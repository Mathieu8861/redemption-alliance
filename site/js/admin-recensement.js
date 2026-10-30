/* ============================================ */
/* Redemption - Admin : le Recensement          */
/* Tout le monde, en croisant l'alliance en     */
/* jeu, le Discord et le site (30/10/2026,      */
/* sql/081, moteur : js/recensement-moteur.js)  */
/* ============================================ */
(function () {
    'use strict';

    var M = window.RecensementMoteur;
    var etat = null; /* { jeu, liens, notes, site, discord, luLe } */
    var filtre = { texte: '', statut: '' };
    var ouvertes = { complet: false };

    function esc(t) { return window.REN.escapeHtml(t == null ? '' : String(t)); }
    function sb() { return window.REN.supabase; }
    function moi() { return window.REN.currentProfile ? window.REN.currentProfile.id : null; }
    function date(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : ''; }
    function libelleStatut(s) { var x = M.STATUTS.filter(function (t) { return t[0] === s; })[0]; return x ? x[1] : s; }

    /* ---------- lecture ---------- */
    async function toutes(table, colonnes) {
        var l = [], pas = 1000;
        for (var i = 0; ; i += pas) {
            var r = await sb().from(table).select(colonnes).range(i, i + pas - 1);
            if (r.error) throw new Error(table + ' : ' + r.error.message);
            l = l.concat(r.data || []);
            if (!r.data || r.data.length < pas) return l;
        }
    }
    async function lireDiscord() {
        var jeton = null;
        try {
            var s = await sb().auth.getSession();
            jeton = s && s.data && s.data.session ? s.data.session.access_token : null;
        } catch (e) { /* pas de session : serveur local */ }
        var entetes = { 'Content-Type': 'application/json' };
        if (jeton) entetes.Authorization = 'Bearer ' + jeton;
        var r = await fetch('/api/recensement', { method: 'POST', headers: entetes, body: '{}' });
        var j = await r.json().catch(function () { return {}; });
        if (!r.ok || j.erreur) throw new Error('Discord : ' + (j.erreur || 'erreur ' + r.status));
        return j;
    }
    async function lireBase() {
        var res = await Promise.all([
            toutes('recensement_jeu', 'nom,rang,niveau,en_ligne,releve_le'),
            toutes('recensement_liens', 'id,a,b,type,note,cree_le'),
            toutes('recensement_notes', 'cle,statut,note,maj_le'),
            toutes('profiles', 'id,username,classe,mules,discord_id,is_validated,is_admin,created_at'),
            toutes('combat_participants', 'user_id')
        ]);
        var nb = {};
        res[4].forEach(function (c) { nb[c.user_id] = (nb[c.user_id] || 0) + 1; });
        res[3].forEach(function (p) { p.combats = nb[p.id] || 0; });
        return { jeu: res[0], liens: res[1], notes: res[2], site: res[3] };
    }
    async function relireLiensNotes() {
        var res = await Promise.all([toutes('recensement_liens', 'id,a,b,type,note,cree_le'), toutes('recensement_notes', 'cle,statut,note,maj_le')]);
        etat.liens = res[0]; etat.notes = res[1];
    }

    /* ---------- écriture ---------- */
    function paire(a, b) { return 'and(a.eq."' + a + '",b.eq."' + b + '"),and(a.eq."' + b + '",b.eq."' + a + '")'; }
    async function poserLien(a, b, type, note) {
        var d = await sb().from('recensement_liens').delete().or(paire(a, b));
        if (d.error) throw new Error(d.error.message);
        var r = await sb().from('recensement_liens').insert({ a: a, b: b, type: type, note: note, cree_par: moi() });
        if (r.error) throw new Error(r.error.message);
    }
    async function poserNote(cle, champs) {
        var avant = (etat.notes.filter(function (n) { return n.cle === cle; })[0]) || {};
        var ligne = { cle: cle, statut: avant.statut || null, note: avant.note || null, maj_par: moi(), maj_le: new Date().toISOString() };
        Object.keys(champs).forEach(function (k) { ligne[k] = champs[k]; });
        var r = await sb().from('recensement_notes').upsert(ligne, { onConflict: 'cle' });
        if (r.error) throw new Error(r.error.message);
    }
    async function agir(fn, msgOk) {
        try {
            await fn();
            await relireLiensNotes();
            rendreResultats();
            if (msgOk && window.REN.toast) window.REN.toast(msgOk, 'success');
        } catch (e) {
            alert('Ça n\'est pas passé : ' + e.message);
        }
    }

    /* ---------- affichage ---------- */
    var index = {};
    function etiquette(cle) {
        var n = index[cle];
        if (!n) return cle;
        if (n.type === 'jeu') return '🎮 ' + n.obj.nom + ' (niv. ' + (n.obj.niveau || '?') + ', ' + (n.obj.rang || '?') + ')';
        if (n.type === 'discord') return '💬 ' + (n.obj.surnom || n.obj.nom || n.obj.pseudo) + ' (@' + n.obj.pseudo + ')';
        return '🌐 ' + n.obj.username + ' (site)';
    }
    function court(cle) {
        var n = index[cle];
        if (!n) return cle;
        if (n.type === 'jeu') return '🎮 ' + n.obj.nom;
        if (n.type === 'discord') return '💬 ' + (n.obj.surnom || n.obj.nom || n.obj.pseudo);
        return '🌐 ' + n.obj.username;
    }

    function celluleJeu(p) {
        if (!p.jeu.length) return '<span class="rc-vide">pas dans l\'alliance</span>';
        return p.jeu.map(function (j) {
            return '<span class="rc-chip" title="Rang : ' + esc(j.rang) + '">' + esc(j.nom) + ' <b>' + esc(j.niveau) + '</b><small>' + esc(j.rang) + '</small></span>';
        }).join('');
    }
    function puceRole(r) {
        var ton = r === 'Alliance' ? 'vert' : r === 'Allié' ? 'bleu' : (r === 'Lead' || r === 'Lieutenant') ? 'orange' : 'gris';
        return '<span class="rc-role rc-role--' + ton + '">' + esc(r) + '</span>';
    }
    function celluleDiscord(p) {
        if (!p.discord.length) return '<span class="rc-vide">introuvable</span>';
        return p.discord.map(function (m) {
            return '<div class="rc-dc">' + (m.avatar ? '<img src="' + esc(m.avatar) + '" alt="" loading="lazy">' : '')
                + '<div><strong>' + esc(m.surnom || m.nom || m.pseudo) + '</strong> <span class="rc-muet">@' + esc(m.pseudo) + '</span><br>'
                + (m.roles.length ? m.roles.map(puceRole).join('') : '<span class="rc-muet">aucun rôle</span>')
                + ' <span class="rc-muet">arrivé le ' + date(m.arrive) + '</span></div></div>';
        }).join('');
    }
    function celluleSite(p) {
        if (!p.site.length) return '<span class="rc-vide">pas inscrit</span>';
        var enJeu = {};
        p.jeu.forEach(function (j) { enJeu[M.norm(j.nom)] = true; });
        return p.site.map(function (s) {
            var horsJeu = (s.mules || []).filter(function (m) { return !enJeu[M.norm(m)]; });
            return '<div><strong>' + esc(s.username) + '</strong>' + (s.is_admin ? ' <span class="rc-role rc-role--orange">admin</span>' : '')
                + '<br><span class="rc-muet">' + (s.is_validated ? 'validé' : '<span style="color:var(--color-warning);">pas validé</span>') + ' · '
                + s.combats + ' combat' + (s.combats > 1 ? 's' : '') + ' · inscrit le ' + date(s.created_at) + '</span>'
                + (horsJeu.length ? '<br><span class="rc-muet" title="Déclarées sur le site, absentes de l\'alliance en jeu">mules hors alliance : ' + esc(horsJeu.join(', ')) + '</span>' : '')
                + '</div>';
        }).join('');
    }
    function celluleLiens(p) {
        var h = '';
        p.aretes.forEach(function (e) {
            if (e.force === 'probable') {
                h += '<div class="rc-lien rc-lien--probable"><span class="rc-q">?</span> ' + esc(court(e.a)) + ' ↔ ' + esc(court(e.b))
                    + '<br><span class="rc-muet">' + esc(e.raison) + '</span> '
                    + '<button class="rc-mini rc-mini--ok" data-confirmer="' + esc(e.a) + '|' + esc(e.b) + '" title="C\'est bien la même personne">✓ confirmer</button>'
                    + '<button class="rc-mini rc-mini--non" data-separer="' + esc(e.a) + '|' + esc(e.b) + '" title="Ce ne sont pas les mêmes">✕ séparer</button></div>';
            } else if (e.lien) {
                h += '<div class="rc-lien">🔗 ' + esc(court(e.a)) + ' ↔ ' + esc(court(e.b)) + '<br><span class="rc-muet">' + esc(e.raison) + '</span> '
                    + '<button class="rc-mini rc-mini--non" data-separer="' + esc(e.a) + '|' + esc(e.b) + '" title="Retirer ce rattachement">✕ retirer</button></div>';
            }
        });
        var probables = p.aretes.filter(function (e) { return e.force === 'probable'; });
        if (probables.length > 1) {
            h += '<button class="rc-mini rc-mini--ok" data-tout-confirmer="' + esc(probables.map(function (e) { return e.a + '|' + e.b; }).join(',')) + '">✓ tout confirmer (' + probables.length + ')</button>';
        }
        p.remarques.forEach(function (r) { h += '<div class="rc-remarque">⚠ ' + esc(r) + '</div>'; });
        h += '<div class="rc-rattacher" data-pour="' + esc(p.cles[0]) + '"><button class="rc-mini" data-ouvrir-rattacher="1">+ rattacher…</button></div>';
        var n = p.note && p.note.note ? p.note.note : '';
        h += '<textarea class="form-input rc-note" rows="1" placeholder="Note…" data-note="' + esc(p.cleNote) + '">' + esc(n) + '</textarea>';
        return h;
    }
    function ligne(p) {
        var manuel = p.note && p.note.statut;
        var sel = '<select class="form-input rc-statut" data-statut="' + esc(p.cleNote) + '">'
            + '<option value=""' + (manuel ? '' : ' selected') + '>Auto : ' + esc(libelleStatut(p.statutAuto)) + '</option>'
            + M.STATUTS.map(function (s) { return '<option value="' + s[0] + '"' + (manuel && p.note.statut === s[0] ? ' selected' : '') + '>' + esc(s[1]) + '</option>'; }).join('')
            + '</select>';
        return '<tr class="rc-statut-' + esc(p.statut) + '">'
            + '<td><strong class="rc-nom">' + esc(p.nom) + '</strong> <span class="rc-score rc-score--' + p.score + '">' + p.score + '/3</span>'
            + (p.aConfirmer ? ' <span class="rc-q" title="Au moins un lien déduit, à confirmer">?</span>' : '') + '<br>' + sel + '</td>'
            + '<td>' + celluleJeu(p) + '</td><td>' + celluleDiscord(p) + '</td><td>' + celluleSite(p) + '</td><td>' + celluleLiens(p) + '</td></tr>';
    }

    function correspond(p) {
        if (filtre.statut && p.statut !== filtre.statut) return false;
        if (!filtre.texte) return true;
        var q = M.norm(filtre.texte), noms = [];
        p.jeu.forEach(function (j) { noms.push(j.nom); });
        p.discord.forEach(function (m) { noms.push(m.pseudo, m.nom, m.surnom); });
        p.site.forEach(function (s) { noms.push(s.username); (s.mules || []).forEach(function (x) { noms.push(x); }); });
        if (p.note && p.note.note) noms.push(p.note.note);
        return noms.some(function (n) { return n && M.norm(n).indexOf(q) !== -1; });
    }

    function rendreResultats() {
        var zone = document.getElementById('rc-resultats');
        if (!zone) return;
        var r = M.croiser({ jeu: etat.jeu, discord: etat.discord, site: etat.site, liens: etat.liens, notes: etat.notes });
        index = {};
        etat.jeu.forEach(function (j) { index[M.cleJeu(j.nom)] = { type: 'jeu', obj: j }; });
        etat.discord.forEach(function (m) { if (!m.bot) index['discord:' + m.id] = { type: 'discord', obj: m }; });
        etat.site.forEach(function (s) { index['site:' + s.id] = { type: 'site', obj: s }; });

        var suspects = r.personnes.filter(function (p) { return p.statut === 'suspect'; }).length;
        var aVerifier = r.personnes.filter(function (p) { return p.statut === 'a_verifier'; }).length;
        document.getElementById('rc-chiffres').innerHTML = [
            ['Personnes', r.stats.personnes, 'après croisement'], ['Persos en jeu', r.stats.persos, 'relevé du ' + esc(etat.releve || '?')],
            ['Membres Discord', r.stats.discord, 'lu à ' + new Date(etat.luLe).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })],
            ['Comptes du site', r.stats.site, ''], ['Suspects', suspects, ''], ['À vérifier', aVerifier, '']
        ].map(function (c) {
            return '<div class="rc-carte"><div class="rc-muet">' + c[0] + '</div><div class="rc-carte__val">' + c[1] + '</div><div class="rc-muet">' + c[2] + '</div></div>';
        }).join('');

        var h = '';
        M.CATEGORIES.forEach(function (c) {
            var l = r.personnes.filter(function (p) { return p.categorie === c.id && correspond(p); });
            var total = r.personnes.filter(function (p) { return p.categorie === c.id; }).length;
            if (c.id === 'jeu_seul') l.sort(function (a, b) { return (b.jeu[0].niveau || 0) - (a.jeu[0].niveau || 0); });
            else l.sort(function (a, b) { return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }); });
            var ouverte = ouvertes[c.id] !== false;
            h += '<details class="rc-cat rc-cat--' + c.ton + '" data-cat="' + c.id + '"' + (ouverte ? ' open' : '') + '><summary><span class="rc-cat__titre">' + esc(c.titre) + '</span> <span class="rc-cat__nb">'
                + (l.length === total ? total : l.length + ' / ' + total) + '</span> <span class="rc-muet">' + esc(c.aide) + '</span></summary>';
            if (!l.length) h += '<p class="rc-muet" style="padding:8px 12px;">Personne ici' + (total ? ' avec ces filtres' : '') + '.</p>';
            else h += '<div class="rc-defile"><table class="rc-table"><thead><tr><th>Personne</th><th>Persos dans l\'alliance</th><th>Discord</th><th>Site</th><th>Liens, remarques, note</th></tr></thead><tbody>'
                + l.map(ligne).join('') + '</tbody></table></div>';
            h += '</details>';
        });
        zone.innerHTML = h;

        var dl = document.getElementById('rc-noeuds');
        dl.innerHTML = Object.keys(index).map(function (k) { return '<option value="' + esc(etiquette(k)) + '"></option>'; }).join('');
    }

    var STYLE = '<style>'
        + '.rc-muet{color:var(--color-text-muted);font-size:.78rem;}'
        + '.rc-vide{color:var(--color-text-muted);font-style:italic;font-size:.85rem;}'
        + '.rc-cartes{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;}'
        + '.rc-carte{flex:1 1 130px;background:var(--color-bg-tertiary);border:1px solid var(--color-border);border-radius:12px;padding:10px 14px;}'
        + '.rc-carte__val{font-family:var(--font-title);font-size:1.5rem;font-weight:700;}'
        + '.rc-filtres{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:16px;}'
        + '.rc-filtres .form-input{max-width:320px;}'
        + '.rc-cat{border:1px solid var(--color-border);border-left:4px solid var(--rc-ton);border-radius:12px;margin-bottom:12px;background:var(--color-bg-secondary);}'
        + '.rc-cat>summary{cursor:pointer;padding:10px 14px;list-style:revert;}'
        + '.rc-cat__titre{font-family:var(--font-title);font-weight:700;font-size:1.1rem;}'
        + '.rc-cat__nb{display:inline-block;min-width:26px;text-align:center;border-radius:10px;padding:0 8px;background:var(--rc-ton);color:#111;font-weight:700;margin:0 6px;}'
        + '.rc-cat--rouge{--rc-ton:var(--color-danger);}.rc-cat--orange{--rc-ton:var(--color-warning);}.rc-cat--jaune{--rc-ton:#f1c40f;}'
        + '.rc-cat--gris{--rc-ton:#8a8f98;}.rc-cat--vert{--rc-ton:var(--color-success);}.rc-cat--bleu{--rc-ton:var(--color-info);}'
        + '.rc-defile{overflow-x:auto;}'
        + '.rc-table{width:100%;border-collapse:collapse;min-width:980px;}'
        + '.rc-table th,.rc-table td{padding:8px 10px;text-align:left;vertical-align:top;border-top:1px solid var(--color-border);font-size:.86rem;}'
        + '.rc-table th{color:var(--color-text-muted);font-size:.75rem;font-weight:600;}'
        + '.rc-table td:first-child{width:170px;}.rc-table td:last-child{width:300px;}'
        + '.rc-statut{margin-top:6px;font-size:.78rem;padding:4px 6px;}'
        + '.rc-statut-suspect .rc-nom{color:var(--color-danger);}.rc-statut-ok .rc-nom{color:var(--color-success);}'
        + '.rc-score{display:inline-block;border-radius:8px;padding:0 6px;font-size:.72rem;font-weight:700;color:#111;}'
        + '.rc-score--1{background:var(--color-danger);}.rc-score--2{background:var(--color-warning);}.rc-score--3{background:var(--color-success);}'
        + '.rc-q{display:inline-block;width:16px;height:16px;line-height:16px;text-align:center;border-radius:50%;background:var(--color-info);color:#fff;font-size:.7rem;font-weight:700;}'
        + '.rc-chip{display:inline-block;margin:0 4px 4px 0;padding:2px 8px;border-radius:8px;background:var(--color-bg-tertiary);border:1px solid var(--color-border);white-space:nowrap;}'
        + '.rc-chip b{color:var(--color-accent-light);font-weight:600;}.rc-chip small{display:block;color:var(--color-text-muted);font-size:.68rem;}'
        + '.rc-dc{display:flex;gap:8px;align-items:flex-start;margin-bottom:4px;}.rc-dc img{width:24px;height:24px;border-radius:50%;}'
        + '.rc-role{display:inline-block;margin:2px 3px 0 0;padding:0 6px;border-radius:6px;font-size:.7rem;border:1px solid;}'
        + '.rc-role--vert{color:var(--color-success);}.rc-role--bleu{color:var(--color-info);}.rc-role--orange{color:var(--color-accent-light);}.rc-role--gris{color:var(--color-text-secondary);}'
        + '.rc-lien{margin-bottom:6px;font-size:.8rem;}.rc-lien--probable{border-left:2px solid var(--color-info);padding-left:6px;}'
        + '.rc-remarque{color:var(--color-warning);font-size:.78rem;margin-bottom:4px;}'
        + '.rc-mini{font-size:.7rem;padding:1px 6px;margin:2px 4px 0 0;border-radius:6px;border:1px solid var(--color-border-light);background:var(--color-bg-tertiary);color:var(--color-text-secondary);cursor:pointer;}'
        + '.rc-mini--ok{border-color:var(--color-success);color:var(--color-success);}.rc-mini--non{border-color:var(--color-danger);color:var(--color-danger);}'
        + '.rc-rattacher .form-input{font-size:.78rem;padding:4px 6px;margin-top:4px;}'
        + '.rc-note{margin-top:6px;font-size:.78rem;padding:4px 6px;resize:vertical;min-height:28px;width:100%;}'
        + '.rc-import textarea{width:100%;min-height:140px;font-family:monospace;font-size:.8rem;}'
        + '</style>';

    function rendre(container) {
        var h = STYLE + '<div class="admin-panel__title">Recensement des membres</div>'
            + '<div class="admin-panel__desc">Chaque personne, avec ses persos dans l\'alliance en jeu, son compte Discord et son compte du site. '
            + 'Les liens sûrs viennent du site (Discord connecté, pseudo, mules déclarées) ; les liens marqués <span class="rc-q">?</span> sont déduits des noms et sont à confirmer. '
            + 'Une personne présente d\'un seul côté (1/3) est suspecte, surtout sur le Discord sans être dans l\'alliance.</div>'
            + '<div class="rc-cartes" id="rc-chiffres"></div>'
            + '<div class="rc-filtres"><input type="search" class="form-input" id="rc-cherche" placeholder="Chercher un nom (jeu, Discord, site)…" value="' + esc(filtre.texte) + '">'
            + '<select class="form-input" id="rc-filtre-statut"><option value="">Tous les statuts</option>'
            + M.STATUTS.map(function (s) { return '<option value="' + s[0] + '"' + (filtre.statut === s[0] ? ' selected' : '') + '>' + esc(s[1]) + '</option>'; }).join('') + '</select>'
            + '<button class="btn btn--secondary btn--small" id="rc-relire">Relire le Discord et le site</button></div>'
            + '<datalist id="rc-noeuds"></datalist>'
            + '<div id="rc-resultats"></div>'
            + '<details class="rc-cat rc-cat--gris rc-import"><summary><span class="rc-cat__titre">Mettre à jour la liste de l\'alliance en jeu</span> '
            + '<span class="rc-muet">' + etat.jeu.length + ' persos, relevé du ' + esc(etat.releve || '?') + '</span></summary><div style="padding:0 14px 14px;">'
            + '<p class="rc-muet">Une ligne par perso : <code>Nom;Rang;Niveau</code>. La liste remplace entièrement l\'ancienne (les rattachements et les notes sont gardés).</p>'
            + '<textarea class="form-input" id="rc-liste"></textarea><br><button class="btn btn--primary btn--small" id="rc-remplacer" style="margin-top:8px;">Remplacer la liste</button></div></details>';
        container.innerHTML = h;
        rendreResultats();
        brancher(container);
    }

    function brancher(container) {
        var minuteur = null;
        document.getElementById('rc-cherche').addEventListener('input', function () {
            var v = this.value;
            clearTimeout(minuteur);
            minuteur = setTimeout(function () { filtre.texte = v; rendreResultats(); }, 200);
        });
        document.getElementById('rc-filtre-statut').addEventListener('change', function () { filtre.statut = this.value; rendreResultats(); });
        document.getElementById('rc-relire').addEventListener('click', function () { window.tabRecensement(container); });
        document.getElementById('rc-remplacer').addEventListener('click', remplacerListe);

        var zone = document.getElementById('rc-resultats');
        zone.addEventListener('toggle', function (e) {
            var d = e.target.closest && e.target.closest('details[data-cat]');
            if (d) ouvertes[d.getAttribute('data-cat')] = d.open;
        }, true);
        zone.addEventListener('change', function (e) {
            var t = e.target;
            if (t.matches('select[data-statut]')) agir(function () { return poserNote(t.getAttribute('data-statut'), { statut: t.value || null }); }, 'Statut enregistré');
            else if (t.matches('textarea[data-note]')) agir(function () { return poserNote(t.getAttribute('data-note'), { note: t.value.trim() || null }); }, 'Note enregistrée');
        });
        zone.addEventListener('click', function (e) {
            var b = e.target.closest('button');
            if (!b) return;
            var c = b.getAttribute('data-confirmer'), s = b.getAttribute('data-separer');
            if (c) { var x = c.split('|'); agir(function () { return poserLien(x[0], x[1], 'lien', 'Confirmé à la main'); }, 'Lien confirmé'); return; }
            var tous = b.getAttribute('data-tout-confirmer');
            if (tous) {
                agir(async function () {
                    var l = tous.split(',');
                    for (var i = 0; i < l.length; i++) { var z = l[i].split('|'); await poserLien(z[0], z[1], 'lien', 'Confirmé à la main'); }
                }, 'Liens confirmés');
                return;
            }
            if (s) {
                var y = s.split('|');
                if (!confirm('Séparer ' + court(y[0]) + ' et ' + court(y[1]) + ' ? Ce ne seront plus la même personne.')) return;
                agir(function () { return poserLien(y[0], y[1], 'separe', 'Séparé à la main'); }, 'Séparés');
                return;
            }
            if (b.hasAttribute('data-ouvrir-rattacher')) {
                var boite = b.parentNode;
                boite.innerHTML = '<input class="form-input" list="rc-noeuds" placeholder="Perso, Discord ou compte du site…">'
                    + '<button class="rc-mini rc-mini--ok" data-valider-rattacher="1">rattacher</button><button class="rc-mini" data-annuler-rattacher="1">annuler</button>';
                boite.querySelector('input').focus();
                return;
            }
            if (b.hasAttribute('data-annuler-rattacher')) { rendreResultats(); return; }
            if (b.hasAttribute('data-valider-rattacher')) {
                var bo = b.parentNode, saisie = bo.querySelector('input').value.trim();
                var cible = Object.keys(index).filter(function (k) { return etiquette(k) === saisie; })[0];
                if (!cible) { alert('Choisis un nom dans la liste proposée.'); return; }
                var pour = bo.getAttribute('data-pour');
                agir(function () { return poserLien(pour, cible, 'lien', 'Rattaché à la main'); }, 'Rattaché');
            }
        });
    }

    async function remplacerListe() {
        var lignes = document.getElementById('rc-liste').value.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
        var persos = [], vus = {};
        for (var i = 0; i < lignes.length; i++) {
            var c = lignes[i].split(/[;\t]/).map(function (x) { return x.trim(); });
            if (!c[0] || vus[M.norm(c[0])]) continue;
            vus[M.norm(c[0])] = true;
            persos.push({ nom: c[0], rang: c[1] || null, niveau: parseInt(c[2], 10) || null, releve_le: new Date().toISOString().slice(0, 10) });
        }
        if (!persos.length) { alert('Colle d\'abord la liste, une ligne par perso.'); return; }
        if (!confirm('Remplacer les ' + etat.jeu.length + ' persos actuels par ces ' + persos.length + ' ?')) return;
        try {
            var d = await sb().from('recensement_jeu').delete().neq('nom', '');
            if (d.error) throw new Error(d.error.message);
            for (var j = 0; j < persos.length; j += 500) {
                var r = await sb().from('recensement_jeu').insert(persos.slice(j, j + 500));
                if (r.error) throw new Error(r.error.message);
            }
            window.tabRecensement(document.getElementById('admin-content'));
        } catch (e) { alert('La liste n\'est pas passée : ' + e.message); }
    }

    window.tabRecensement = async function (container) {
        try {
            var res = await Promise.all([lireBase(), lireDiscord()]);
            etat = res[0];
            etat.discord = res[1].membres;
            etat.luLe = res[1].lu_le;
            var dates = etat.jeu.map(function (j) { return j.releve_le; }).filter(Boolean).sort();
            etat.releve = dates.length ? date(dates[dates.length - 1]) : null;
            rendre(container);
        } catch (e) {
            container.innerHTML = '<div class="admin-panel__title">Recensement des membres</div><p class="text-muted">Impossible de tout lire : ' + esc(e.message) + '</p>';
        }
    };
})();
