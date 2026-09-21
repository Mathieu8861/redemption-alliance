/* ============================================ */
/* Redemption - Matchmaking T5                  */
/* File « je suis dispo » en temps reel + calcul */
/* de la meilleure compo (classes_ref + regles) */
/* ============================================ */
(function () {
    'use strict';

    var userId = null;
    var profile = null;
    var ref = [];          /* classes_ref, dans l'ordre */
    var refBy = {};        /* classe -> ligne du referentiel */
    var rules = { doublons: false, quota: { tank: 1, support: 1, dps: 2 }, duree: 60 };
    var queue = [];        /* v_mm_queue */
    var channel = null;
    var tickTimer = null;

    var RANG_SCORE = { obligatoire: 5, S: 4, A: 3, B: 2, C: 1 };
    var ROLE_LABEL = { tank: 'Tank', dps: 'DPS', support: 'Support' };
    var CLS_LABELS = { Forge: 'Forgelance' };
    var ROLE_ICON = {
        tank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        dps: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/></svg>',
        support: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
    };

    document.addEventListener('ren:ready', init);

    async function init() {
        if (!window.REN.supabase || !window.REN.currentProfile) return;
        profile = window.REN.currentProfile;
        userId = profile.id;
        await Promise.all([loadRef(), loadRules()]);
        await loadQueue();
        renderAll();
        subscribe();
        tickTimer = setInterval(tick, 30000);
    }

    /* === CHARGEMENTS === */
    async function loadRef() {
        var { data } = await window.REN.supabase.from('classes_ref').select('*').order('ordre', { ascending: true });
        ref = data || [];
        refBy = {};
        ref.forEach(function (r) { refBy[r.classe] = r; });
    }

    async function loadRules() {
        var { data } = await window.REN.supabase.from('site_config').select('cle, valeur').like('cle', 'mm_%');
        (data || []).forEach(function (r) {
            if (r.cle === 'mm_doublons') rules.doublons = r.valeur === 'true';
            if (r.cle === 'mm_quota_tank') rules.quota.tank = parseInt(r.valeur, 10) || 0;
            if (r.cle === 'mm_quota_support') rules.quota.support = parseInt(r.valeur, 10) || 0;
            if (r.cle === 'mm_quota_dps') rules.quota.dps = parseInt(r.valeur, 10) || 0;
            if (r.cle === 'mm_duree_defaut') rules.duree = parseInt(r.valeur, 10) || 60;
        });
    }

    async function loadQueue() {
        var { data, error } = await window.REN.supabase.from('v_mm_queue').select('*');
        if (error) { console.error('[REN-MM] file:', error); return; }
        var now = Date.now();
        queue = (data || []).filter(function (q) { return new Date(q.expire_at).getTime() > now; });
    }

    /* Temps reel : a chaque changement de la file, on recharge et on redessine */
    function subscribe() {
        try {
            channel = window.REN.supabase.channel('mm-queue')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'mm_queue' }, async function () {
                    await loadQueue();
                    renderAll();
                })
                .subscribe();
        } catch (err) {
            console.warn('[REN-MM] temps reel indisponible, rafraichissement toutes les 30 s', err);
        }
    }

    async function tick() {
        /* Les inscriptions expirees disparaissent d'elles-memes, et les chronos avancent */
        var before = queue.length;
        var now = Date.now();
        queue = queue.filter(function (q) { return new Date(q.expire_at).getTime() > now; });
        if (!channel) await loadQueue();
        if (queue.length !== before || !channel) renderAll(); else renderTimes();
    }

    /* === MES CLASSES (principale + mules) === */
    function myClasses() {
        var out = [];
        var seen = {};
        if (profile.classe && refBy[profile.classe]) {
            out.push({ classe: profile.classe, source: 'principal' });
            seen[profile.classe] = true;
        }
        var mules = profile.mules_infos && typeof profile.mules_infos === 'object' ? profile.mules_infos : {};
        Object.keys(mules).forEach(function (nom) {
            var c = mules[nom] && mules[nom].classe;
            if (c && refBy[c] && !seen[c]) { out.push({ classe: c, source: nom }); seen[c] = true; }
        });
        return out;
    }

    /* === CALCUL DE LA COMPO === */
    /* Choisit jusqu'a 5 joueurs et une classe pour chacun. Priorites, dans
       l'ordre : taille de l'equipe, classes obligatoires couvertes, quotas de
       role respectes, somme des rangs, puis l'ordre du referentiel pour
       departager. Limite aux 12 premiers arrives pour rester instantane. */
    function solve() {
        var players = queue.slice(0, 12).map(function (q) {
            return { user_id: q.user_id, username: q.username, classes: (q.classes || []).filter(function (c) { return !!refBy[c]; }) };
        }).filter(function (p) { return p.classes.length; });
        var mandatory = ref.filter(function (r) { return r.rang === 'obligatoire'; }).map(function (r) { return r.classe; });

        var best = { score: -1, team: [] };
        function evaluate(team) {
            var used = {}, roles = { tank: 0, dps: 0, support: 0 }, sumRang = 0, sumOrdre = 0;
            team.forEach(function (m) {
                used[m.classe] = true;
                roles[refBy[m.classe].role] += 1;
                sumRang += RANG_SCORE[refBy[m.classe].rang] || 0;
                sumOrdre += refBy[m.classe].ordre || 0;
            });
            var mand = mandatory.filter(function (c) { return used[c]; }).length;
            var quotasOk = ['tank', 'support', 'dps'].filter(function (r) { return roles[r] >= (rules.quota[r] || 0); }).length;
            var score = team.length * 100000 + mand * 10000 + quotasOk * 1000 + sumRang * 10 - sumOrdre * 0.01;
            if (score > best.score) best = { score: score, team: team.slice(), roles: roles, mand: mand };
        }
        function rec(i, team, used) {
            if (team.length === 5 || i >= players.length) { evaluate(team); return; }
            /* sans ce joueur */
            rec(i + 1, team, used);
            /* avec ce joueur, sur chacune de ses classes */
            var p = players[i];
            for (var k = 0; k < p.classes.length; k++) {
                var c = p.classes[k];
                if (!rules.doublons && used[c]) continue;
                used[c] = (used[c] || 0) + 1;
                team.push({ user_id: p.user_id, username: p.username, classe: c });
                rec(i + 1, team, used);
                team.pop();
                used[c] -= 1;
            }
        }
        rec(0, [], {});
        if (best.score < 0) best = { score: 0, team: [], roles: { tank: 0, dps: 0, support: 0 }, mand: 0 };

        /* Ce qui manque encore */
        var usedNow = {};
        best.team.forEach(function (m) { usedNow[m.classe] = true; });
        var missing = [];
        var couvertParObligatoire = { tank: 0, support: 0, dps: 0 };
        mandatory.forEach(function (c) {
            if (usedNow[c]) return;
            missing.push({ type: 'classe', label: label(c) });
            couvertParObligatoire[refBy[c].role] += 1;
        });
        /* Un role deja reclame via une classe obligatoire n est pas redemande */
        ['tank', 'support', 'dps'].forEach(function (r) {
            var manque = (rules.quota[r] || 0) - best.roles[r] - couvertParObligatoire[r];
            if (manque > 0) missing.push({ type: 'role', role: r, label: manque + ' ' + ROLE_LABEL[r].toLowerCase() + (manque > 1 && r !== 'dps' ? 's' : '') });
        });
        return { team: best.team, missing: missing, roles: best.roles, mand: best.mand, mandatoryTotal: mandatory.length };
    }

    /* === RENDU === */
    function label(c) { return CLS_LABELS[c] || c; }
    function esc(s) { return window.REN.escapeHtml(s == null ? '' : String(s)); }
    function chip(c, extra) {
        var r = refBy[c];
        var role = r ? r.role : 'dps';
        return '<span class="mm-chip mm-chip--' + role + (extra || '') + '" title="' + (r ? ROLE_LABEL[r.role] + ' · rang ' + esc(r.rang) : '') + '">'
             + '<span class="mm-chip__icon">' + ROLE_ICON[role] + '</span>' + esc(label(c)) + '</span>';
    }
    function minutesSince(iso) { return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); }
    function heure(iso) { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
    function isMe(q) { return q.user_id === userId; }
    function inQueue() { return queue.filter(isMe)[0] || null; }

    function renderAll() {
        renderCompo();
        renderMe();
        renderQueue();
    }

    function renderCompo() {
        var box = document.getElementById('mm-compo');
        if (!box) return;
        var res = solve();
        var n = queue.length;
        var full = res.team.length === 5 && res.missing.length === 0;

        var html = '<div class="mm-compo__head">';
        html += '<div><div class="mm-compo__title">Compo proposée <span class="mm-compo__count">' + res.team.length + '/5</span></div>';
        if (!n) {
            html += '<div class="text-muted mm-compo__sub">Personne dans la file pour le moment. Sois le premier à te signaler.</div>';
        } else if (full) {
            html += '<div class="mm-compo__sub mm-compo__sub--ok">Groupe complet, toutes les conditions sont remplies. Go !</div>';
        } else if (res.missing.length) {
            html += '<div class="mm-compo__sub">Il manque : ' + res.missing.map(function (m) { return '<strong>' + esc(m.label) + '</strong>'; }).join(', ') + '</div>';
        } else {
            html += '<div class="mm-compo__sub">' + (5 - res.team.length) + ' place' + (5 - res.team.length > 1 ? 's' : '') + ' encore libre' + (5 - res.team.length > 1 ? 's' : '') + '.</div>';
        }
        html += '</div>';
        html += '<div class="mm-compo__meta text-muted">' + n + ' joueur' + (n > 1 ? 's' : '') + ' disponible' + (n > 1 ? 's' : '') + '</div>';
        html += '</div>';

        html += '<div class="mm-slots' + (full ? ' mm-slots--full' : '') + '">';
        for (var i = 0; i < 5; i++) {
            var m = res.team[i];
            if (m) {
                var r = refBy[m.classe];
                html += '<div class="mm-slot mm-slot--' + r.role + (m.user_id === userId ? ' mm-slot--me' : '') + '">'
                      + '<span class="mm-slot__icon">' + ROLE_ICON[r.role] + '</span>'
                      + '<span class="mm-slot__classe">' + esc(label(m.classe)) + '</span>'
                      + '<span class="mm-slot__name">' + esc(m.username) + '</span>'
                      + '</div>';
            } else {
                var need = res.missing[i - res.team.length];
                html += '<div class="mm-slot mm-slot--empty">'
                      + '<span class="mm-slot__icon">' + (need && need.type === 'role' ? ROLE_ICON[need.role] : '<span class="mm-slot__q">?</span>') + '</span>'
                      + '<span class="mm-slot__classe">' + (need ? esc(need.label) : 'Libre') + '</span>'
                      + '<span class="mm-slot__name">en attente</span>'
                      + '</div>';
            }
        }
        html += '</div>';
        box.innerHTML = html;
    }

    function renderMe() {
        var box = document.getElementById('mm-me');
        if (!box) return;
        var me = inQueue();
        var mine = myClasses();
        var html;

        if (me) {
            html = '<div class="mm-card mm-card--active">'
                 + '<div class="mm-card__head"><span class="mm-pulse"></span><strong>Tu es disponible</strong>'
                 + '<span class="text-muted" id="mm-me-time"> depuis ' + minutesSince(me.created_at) + ' min, jusqu\'à ' + heure(me.expire_at) + '</span></div>'
                 + '<div class="mm-card__chips">' + (me.classes || []).map(function (c) { return chip(c); }).join('') + '</div>'
                 + (me.note ? '<div class="text-muted" style="font-size:0.8125rem;margin-top:6px;">' + esc(me.note) + '</div>' : '')
                 + '<div class="mm-card__actions">'
                 + '<button class="btn btn--secondary btn--small" id="mm-prolonger">+ 30 min</button>'
                 + '<button class="btn btn--secondary btn--small" id="mm-modifier">Modifier mes classes</button>'
                 + '<button class="btn btn--danger btn--small" id="mm-quitter">Je ne suis plus dispo</button>'
                 + '</div></div>';
            box.innerHTML = html;
            document.getElementById('mm-prolonger').addEventListener('click', prolonger);
            document.getElementById('mm-quitter').addEventListener('click', quitter);
            document.getElementById('mm-modifier').addEventListener('click', function () { renderForm(box, me); });
            return;
        }
        if (!mine.length) {
            box.innerHTML = '<div class="mm-card"><strong>Renseigne d\'abord ta classe</strong><div class="text-muted" style="font-size:0.8125rem;margin-top:4px;">Le matchmaking a besoin de savoir ce que tu joues. Ajoute ta classe principale et tes mules dans <a href="profil.html">ton profil</a>.</div></div>';
            return;
        }
        renderForm(box, null);
    }

    function renderForm(box, current) {
        var mine = myClasses();
        var checked = current ? (current.classes || []) : mine.map(function (m) { return m.classe; });
        var html = '<div class="mm-card">'
                 + '<div class="mm-card__head"><strong>' + (current ? 'Modifier mes classes' : 'Je suis dispo pour une T5') + '</strong>'
                 + '<span class="text-muted">Coche ce que tu es prêt à jouer maintenant</span></div>'
                 + '<div class="mm-form__classes">';
        mine.forEach(function (m) {
            var on = checked.indexOf(m.classe) !== -1;
            html += '<label class="mm-check' + (on ? ' mm-check--on' : '') + '"><input type="checkbox" value="' + esc(m.classe) + '"' + (on ? ' checked' : '') + '>'
                  + chip(m.classe) + '<span class="mm-check__src">' + (m.source === 'principal' ? 'principal' : esc(m.source)) + '</span></label>';
        });
        html += '</div>';
        html += '<div class="mm-form__row">'
              + '<label class="form-label" for="mm-duree">Disponible pendant</label>'
              + '<select id="mm-duree" class="form-select">'
              + [30, 60, 120, 180].map(function (m) { return '<option value="' + m + '"' + (m === rules.duree ? ' selected' : '') + '>' + (m >= 60 ? (m / 60) + ' h' : m + ' min') + '</option>'; }).join('')
              + '</select>'
              + '<input type="text" id="mm-note" class="form-input" maxlength="80" placeholder="Note (facultatif) : vocal ok, dispo après 21h..." value="' + esc(current ? current.note || '' : '') + '">'
              + '</div>'
              + '<div class="mm-card__actions">'
              + '<button class="btn btn--primary" id="mm-rejoindre">' + (current ? 'Enregistrer' : 'Je suis dispo') + '</button>'
              + (current ? '<button class="btn btn--secondary" id="mm-annuler">Annuler</button>' : '')
              + '</div></div>';
        box.innerHTML = html;

        box.querySelectorAll('.mm-check input').forEach(function (cb) {
            cb.addEventListener('change', function () { cb.closest('.mm-check').classList.toggle('mm-check--on', cb.checked); });
        });
        document.getElementById('mm-rejoindre').addEventListener('click', rejoindre);
        var ann = document.getElementById('mm-annuler');
        if (ann) ann.addEventListener('click', renderMe);
    }

    function renderQueue() {
        var list = document.getElementById('mm-queue');
        var count = document.getElementById('mm-queue-count');
        if (!list) return;
        if (count) count.textContent = queue.length ? '(' + queue.length + ')' : '';
        if (!queue.length) {
            list.innerHTML = '<p class="text-muted" style="padding:var(--spacing-md);">Personne pour le moment.</p>';
            return;
        }
        var res = solve();
        var assigned = {};
        res.team.forEach(function (m) { assigned[m.user_id] = m.classe; });
        var html = '';
        queue.forEach(function (q) {
            var initial = (q.username || '?').charAt(0).toUpperCase();
            html += '<div class="mm-player' + (isMe(q) ? ' mm-player--me' : '') + '">'
                  + '<span class="mm-player__avatar">' + (q.avatar_url ? '<img src="' + esc(q.avatar_url) + '" alt="">' : esc(initial)) + '</span>'
                  + '<div class="mm-player__body">'
                  + '<div class="mm-player__name">' + esc(q.username) + (isMe(q) ? ' <span class="text-muted" style="font-size:0.7rem;">(toi)</span>' : '')
                  + '<span class="mm-player__time text-muted" data-since="' + esc(q.created_at) + '"> · depuis ' + minutesSince(q.created_at) + ' min</span></div>'
                  + '<div class="mm-player__chips">' + (q.classes || []).map(function (c) { return chip(c, assigned[q.user_id] === c ? ' mm-chip--picked' : ''); }).join('') + '</div>'
                  + (q.note ? '<div class="mm-player__note text-muted">' + esc(q.note) + '</div>' : '')
                  + '</div>'
                  + (assigned[q.user_id] ? '<span class="mm-player__tag">dans la compo</span>' : '')
                  + '</div>';
        });
        list.innerHTML = html;
    }

    function renderTimes() {
        document.querySelectorAll('.mm-player__time[data-since]').forEach(function (el) {
            el.textContent = ' · depuis ' + minutesSince(el.getAttribute('data-since')) + ' min';
        });
        var me = inQueue();
        var t = document.getElementById('mm-me-time');
        if (t && me) t.textContent = ' depuis ' + minutesSince(me.created_at) + ' min, jusqu\'à ' + heure(me.expire_at);
    }

    /* === ACTIONS === */
    async function rejoindre() {
        var btn = document.getElementById('mm-rejoindre');
        var classes = Array.prototype.slice.call(document.querySelectorAll('.mm-check input:checked')).map(function (cb) { return cb.value; });
        if (!classes.length) { window.REN.toast('Coche au moins une classe', 'error'); return; }
        var minutes = parseInt(document.getElementById('mm-duree').value, 10) || rules.duree;
        var note = (document.getElementById('mm-note').value || '').trim();
        btn.disabled = true;
        try {
            var { data, error } = await window.REN.supabase.rpc('mm_rejoindre', { p_classes: classes, p_minutes: minutes, p_note: note || null });
            if (error) throw error;
            if (!data || !data.ok) {
                window.REN.toast(data && data.erreur === 'aucune_classe' ? "Aucune de ces classes n'est sur ton profil." : 'Inscription impossible.', 'error');
                btn.disabled = false;
                return;
            }
            window.REN.toast('Tu es dans la file. On te prévient dès que ça bouge.', 'success');
            await loadQueue();
            renderAll();
        } catch (err) {
            console.error('[REN-MM] rejoindre:', err);
            window.REN.toast('Erreur : ' + err.message, 'error');
            btn.disabled = false;
        }
    }

    async function prolonger() {
        var { data, error } = await window.REN.supabase.rpc('mm_prolonger', { p_minutes: 30 });
        if (error || !data || !data.ok) { window.REN.toast('Prolongation impossible.', 'error'); return; }
        window.REN.toast('Prolongé jusqu\'à ' + heure(data.expire_at) + '.', 'success');
        await loadQueue();
        renderAll();
    }

    async function quitter() {
        var { error } = await window.REN.supabase.rpc('mm_quitter');
        if (error) { window.REN.toast('Erreur : ' + error.message, 'error'); return; }
        window.REN.toast('Tu as quitté la file.', 'success');
        await loadQueue();
        renderAll();
    }

    /* Expose pour le bandeau global et les tests */
    window.REN.mmSolve = solve;
})();
