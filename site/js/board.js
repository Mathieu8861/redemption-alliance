/* ============================================ */
/* Redemption - Droits Percepteurs                */
/* Paliers par RANG + réservations automatiques */
/* de zones par ordre de préférence             */
/* ============================================ */
(function () {
    'use strict';

    var paliers = [];
    var ladder = [];            /* classement de référence (période écoulée, ou courante au lancement) */
    var ladderSource = 'passee';
    var reservations = [];      /* attribution figée de la période courante */
    var zonesBda = [];
    var allZones = [];          /* zones actives (hors BDA) pour le sélecteur */
    var myPrefs = [];           /* ma liste ordonnée [{zone_id, nom, niveau_zone, type}] */
    var prefsDirty = false;
    var percoMode = 'points';   /* 'points' (simple) ou 'rang' (reservations) - site_config.perco_mode */
    var pointsConfig = [];      /* paliers par points (recompenses_config), mode simple */
    var prefRecompenseMap = {}; /* user_id -> preference (percos / pepites / jetons) */
    var zoneReserveeMap = {};   /* user_id -> zone_reservee (saisie libre au profil, modele points) */
    var pointsQuinzaines = {};  /* user_id -> {passee, courante} pour l'eligibilite resa */
    var myList = [];            /* liste complete des zones dans MON ordre (drag & drop) */
    var percoResa = true;       /* reservations de zones actives (site_config.perco_reservations), mode rang */
    var periodeInfos = null;    /* periode_pvp_infos() : mode, debut, fin, libelle */

    document.addEventListener('ren:ready', init);

    async function init() {
        if (!window.REN.supabase || !window.REN.currentProfile) return;

        await Promise.all([loadPercoMode(), loadPeriodeInfos()]);
        bindExportImage();

        /* Mode simple : paliers par points, sans reservations de zones */
        if (percoMode === 'points') {
            var tabsEl = document.getElementById('board-tabs');
            /* .tabs a un display:flex en CSS qui ecrase l'attribut hidden */
            if (tabsEl) tabsEl.style.display = 'none';
            var tabPrefsEl = document.getElementById('board-tab-preferences');
            if (tabPrefsEl) tabPrefsEl.hidden = true;
            var tabDroitsEl = document.getElementById('board-tab-droits');
            if (tabDroitsEl) tabDroitsEl.hidden = false;

            await Promise.all([loadPointsConfig(), loadLadder(), loadZonesBda(), loadPrefRecompense(), loadPointsQuinzaines()]);
            renderPeriodePoints();
            renderBaremePoints();
            renderResaPoints();
            renderTablePoints();
            setupBdaModal();
            return;
        }

        /* Reservations de zones coupees (Admin > Bareme Perco) : le ladder seul,
           sans onglet Mes preferences ni colonne Zone reservee */
        if (!percoResa) {
            var tabsRang = document.getElementById('board-tabs');
            if (tabsRang) tabsRang.style.display = 'none';
            var tabPrefsRang = document.getElementById('board-tab-preferences');
            if (tabPrefsRang) tabPrefsRang.hidden = true;
            reservations = [];
            await Promise.all([loadPaliers(), loadLadder(), loadZonesBda()]);
            renderPeriode();
            renderBareme();
            renderTable();
            renderGuideRang();
            setupBdaModal();
            return;
        }

        /* Secours : si l'attribution de la période n'existe pas encore, la calculer */
        try { await window.REN.supabase.rpc('attribuer_percos_periode'); } catch (e) { /* silencieux */ }

        await Promise.all([
            loadPaliers(), loadLadder(), loadReservations(),
            loadZonesBda(), loadMyPrefs()
        ]);
        await loadZones(); /* apres les BDA : elles sont exclues du catalogue */
        buildMyList();

        renderPeriode();
        renderBareme();
        renderTable();
        renderPrefs();
        renderGuideRang();
        setupBdaModal();
        setupTabs();
    }

    /* === ONGLETS === */
    function setupTabs() {
        var btns = document.querySelectorAll('#board-tabs .tabs__btn');
        btns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                btns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var tab = btn.getAttribute('data-tab');
                var tabDroits = document.getElementById('board-tab-droits');
                var tabPrefs = document.getElementById('board-tab-preferences');
                if (tabDroits) tabDroits.hidden = tab !== 'droits';
                if (tabPrefs) tabPrefs.hidden = tab !== 'preferences';
            });
        });
    }

    /* === MODE SIMPLE (paliers par points) === */
    async function loadPercoMode() {
        try {
            var { data } = await window.REN.supabase
                .from('site_config').select('cle, valeur').in('cle', ['perco_mode', 'perco_reservations']);
            var cfg = {};
            (data || []).forEach(function (r) { cfg[r.cle] = r.valeur; });
            percoMode = cfg.perco_mode === 'rang' ? 'rang' : 'points';
            /* cle absente = reservations actives (comportement d'avant la migration 053) */
            percoResa = cfg.perco_reservations !== 'false';
        } catch (e) { percoMode = 'points'; percoResa = true; }
    }

    /* Periode du classement PvP, reglee dans Admin > Periode classement */
    async function loadPeriodeInfos() {
        try {
            var { data } = await window.REN.supabase.rpc('periode_pvp_infos');
            periodeInfos = data || null;
        } catch (e) { periodeInfos = null; }
    }

    async function loadPointsConfig() {
        try {
            var { data } = await window.REN.supabase
                .from('recompenses_config').select('*').order('ordre');
            pointsConfig = data || [];
        } catch (err) {
            console.error('[REN-BOARD] Erreur config points:', err);
        }
    }

    async function loadPrefRecompense() {
        try {
            var { data } = await window.REN.supabase
                .from('profiles').select('id, preference_recompense, zone_reservee').eq('is_validated', true);
            prefRecompenseMap = {};
            zoneReserveeMap = {};
            (data || []).forEach(function (p) {
                prefRecompenseMap[p.id] = p.preference_recompense || 'percos';
                if (p.zone_reservee) zoneReserveeMap[p.id] = p.zone_reservee;
            });
        } catch (err) {
            console.error('[REN-BOARD] Erreur preferences recompense:', err);
        }
    }

    async function loadPointsQuinzaines() {
        pointsQuinzaines = {};
        try {
            var res = await Promise.all([
                window.REN.supabase.from('classement_pvp_semaine_passee').select('id, points'),
                window.REN.supabase.from('classement_pvp_semaine').select('id, points')
            ]);
            (res[0].data || []).forEach(function (p) {
                pointsQuinzaines[p.id] = pointsQuinzaines[p.id] || {};
                pointsQuinzaines[p.id].passee = p.points;
            });
            (res[1].data || []).forEach(function (p) {
                pointsQuinzaines[p.id] = pointsQuinzaines[p.id] || {};
                pointsQuinzaines[p.id].courante = p.points;
            });
        } catch (err) {
            console.error('[REN-BOARD] Erreur points quinzaines:', err);
        }
    }

    /* Droit de reserver une zone : le palier de points atteint (quinzaine
       passee OU en cours) doit inclure au moins 1 resa (colonne du bareme) */
    function canResaPoints(userId) {
        var pts = pointsQuinzaines[userId];
        if (!pts) return false;
        var rPassee = pts.passee !== undefined ? rewardForPoints(pts.passee) : null;
        var rCourante = pts.courante !== undefined ? rewardForPoints(pts.courante) : null;
        return !!((rPassee && (rPassee.resa || 0) > 0) || (rCourante && (rCourante.resa || 0) > 0));
    }

    function rewardForPoints(points) {
        for (var i = 0; i < pointsConfig.length; i++) {
            var r = pointsConfig[i];
            var max = r.seuil_max !== null ? r.seuil_max : 999999;
            if (points >= r.seuil_min && points <= max) return r;
        }
        return null;
    }

    function renderPeriodePoints() {
        var el = document.getElementById('board-period');
        if (!el) return;
        el.textContent = periodeTexte(
            ladderSource === 'courante'
                ? 'période de lancement, droits selon les points de la période en cours'
                : 'droits selon les points de la période précédente',
            'Sans remise à zéro : les droits suivent tes points depuis le début du classement, mis à jour en direct.');
    }

    function formatNumber(n) {
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    function renderBaremePoints() {
        var container = document.getElementById('board-bareme');
        if (!container) return;
        var esc = window.REN.escapeHtml;
        var html = '';
        pointsConfig.forEach(function (r) {
            var range = r.seuil_max !== null ? r.seuil_min + '-' + r.seuil_max + ' pts' : r.seuil_min + '+ pts';
            html += '<div class="board-bareme__item">'
                + '<span class="board-bareme__emoji">' + esc(r.emoji || '') + '</span>'
                + '<div class="board-bareme__info">'
                    + '<span class="board-bareme__label">' + esc(r.label) + '</span>'
                    + '<span class="board-bareme__range">' + esc(range) + '</span>'
                + '</div>'
                + '<div class="board-bareme__rewards">';
            var hasReward = false;
            if (r.percepteurs_bonus > 0) { hasReward = true; html += '<span class="board-bareme__perco">' + r.percepteurs_bonus + ' perco' + (r.percepteurs_bonus > 1 ? 's' : '') + '</span>'; }
            if ((r.resa || 0) > 0) { hasReward = true; html += '<span class="board-bareme__resa">+ ' + r.resa + ' résa de zone</span>'; }
            if (r.pepites > 0) { hasReward = true; html += '<span class="board-bareme__pepites">' + formatNumber(r.pepites) + ' pépites</span>'; }
            if ((r.jetons_reward || 0) > 0) { hasReward = true; html += '<span class="board-bareme__pepites">' + r.jetons_reward + ' jetons</span>'; }
            if ((r.resa || 0) > 0 && r.percepteurs_bonus > 0) {
                html += '<span class="board-bareme__total">= ' + (r.percepteurs_bonus + r.resa) + ' percos au total</span>';
            }
            if (!hasReward) html += '<span class="text-muted">—</span>';
            html += '</div></div>';
        });
        container.innerHTML = html ? '<div class="board-bareme__grid">' + html + '</div>' : '<p class="text-muted">Aucun palier configuré.</p>';
    }

    /* Encart de reservation de zone sur le board (mode points) : le joueur
       eligible reserve directement ici, sans passer par son profil */
    function renderResaPoints() {
        var box = document.getElementById('board-resa-points');
        if (!box) return;
        var me = window.REN.currentProfile.id;
        if (!canResaPoints(me)) {
            box.setAttribute('hidden', '');
            box.innerHTML = '';
            return;
        }
        box.removeAttribute('hidden');
        var esc = window.REN.escapeHtml;
        var current = window.REN.currentProfile.zone_reservee || '';
        box.innerHTML = '<div class="board-resa">'
            + '<div class="board-resa__label">&#128205; Ton palier te donne droit à une réservation de zone</div>'
            + '<div class="board-resa__row">'
            + '<input type="text" class="form-input" id="board-resa-input" maxlength="80" placeholder="Ex: Bonta centre" value="' + esc(current) + '">'
            + '<button type="button" class="btn btn--primary" id="board-resa-save">' + (current ? 'Modifier' : 'Réserver') + '</button>'
            + '</div>'
            + '</div>';

        document.getElementById('board-resa-save').addEventListener('click', async function () {
            var input = document.getElementById('board-resa-input');
            var zone = input.value.trim() || null;
            var btn = this;
            btn.disabled = true;
            try {
                var { error } = await window.REN.supabase.from('profiles')
                    .update({ zone_reservee: zone }).eq('id', me);
                if (error) throw error;
                window.REN.currentProfile.zone_reservee = zone;
                if (zone) zoneReserveeMap[me] = zone; else delete zoneReserveeMap[me];
                renderTablePoints();
                window.REN.toast(zone ? 'Zone réservée : ' + zone : 'Zone retirée', 'success');
            } catch (err) {
                window.REN.toast('Erreur : ' + err.message, 'error');
            } finally {
                btn.disabled = false;
            }
        });
    }

    function renderTablePoints() {
        var container = document.getElementById('board-table-wrap');
        if (!container) return;

        if (!ladder.length) {
            container.innerHTML = '<p class="text-muted text-center" style="padding:2rem;">Aucun combat sur la période de référence.</p>';
            return;
        }

        var esc = window.REN.escapeHtml;
        var myId = window.REN.currentProfile.id;
        var html = '<table class="board-table">';
        html += '<thead><tr>';
        html += '<th class="board-table__th board-table__th--rank">#</th>';
        html += '<th class="board-table__th board-table__th--name">Joueur</th>';
        html += '<th class="board-table__th board-table__th--points">Points</th>';
        html += '<th class="board-table__th board-table__th--tier">Palier</th>';
        html += '<th class="board-table__th board-table__th--reward">Droits percos</th>';
        html += '<th class="board-table__th board-table__th--zone">Zone réservée</th>';
        html += '</tr></thead><tbody>';

        ladder.forEach(function (p) {
            var r = rewardForPoints(p.points);
            var palierTxt = r ? ((r.emoji ? esc(r.emoji) + ' ' : '') + esc(r.label)) : '—';
            var reward = '—';
            if (r) {
                var pref = prefRecompenseMap[p.user_id] || 'percos';
                if (pref === 'pepites' && r.pepites > 0) {
                    reward = formatNumber(r.pepites) + ' <img class="icon-inline" src="assets/images/pepite.png" alt="pépites">';
                } else if (pref === 'jetons' && (r.jetons_reward || 0) > 0) {
                    reward = '+' + r.jetons_reward + ' <img class="icon-inline" src="assets/images/jeton.png" alt="jetons">';
                } else if (r.percepteurs_bonus > 0 || (r.resa || 0) > 0) {
                    /* Total des poses = percos du palier + perco de la zone reservee */
                    var totalPercos = r.percepteurs_bonus + (r.resa || 0);
                    reward = '<strong>' + totalPercos + '</strong> <img class="icon-inline icon-inline--perco" src="assets/images/percepteur.png" alt="perco">';
                    if ((r.resa || 0) > 0) {
                        reward += ' <span class="board-table__resa-note">(dont ' + r.resa + ' résa)</span>';
                    }
                } else if (r.pepites > 0) {
                    reward = formatNumber(r.pepites) + ' <img class="icon-inline" src="assets/images/pepite.png" alt="pépites">';
                }
            }

            html += '<tr class="board-table__row' + (p.user_id === myId ? ' board-table__row--me' : '') + '">';
            html += '<td class="board-table__td board-table__td--rank">' + p.rang + '</td>';
            html += '<td class="board-table__td board-table__td--name notranslate">' + esc(p.username) + '</td>';
            html += '<td class="board-table__td board-table__td--points">' + p.points + '</td>';
            html += '<td class="board-table__td board-table__td--tier">' + palierTxt + '</td>';
            html += '<td class="board-table__td board-table__td--reward">' + reward + '</td>';
            var zoneTxt = (zoneReserveeMap[p.user_id] && canResaPoints(p.user_id))
                ? '<strong>' + esc(zoneReserveeMap[p.user_id]) + '</strong>'
                : '—';
            html += '<td class="board-table__td board-table__td--zone">' + zoneTxt + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    /* === EXPORT IMAGE DU CLASSEMENT (partage Discord) === */
    function bindExportImage() {
        var btn = document.getElementById('btn-export-ladder');
        if (btn) btn.addEventListener('click', exportLadderImage);
    }

    function truncateTxt(s, n) {
        return s.length > n ? s.slice(0, n - 1) + '…' : s;
    }

    function drawRoundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    /* Droits d'un joueur en texte plat (meme logique que le tableau) */
    function rewardTextPoints(p) {
        var r = rewardForPoints(p.points);
        if (!r) return '—';
        var pref = prefRecompenseMap[p.user_id] || 'percos';
        if (pref === 'pepites' && r.pepites > 0) return formatNumber(r.pepites) + ' pépites';
        if (pref === 'jetons' && (r.jetons_reward || 0) > 0) return '+' + r.jetons_reward + ' jetons';
        var total = r.percepteurs_bonus + (r.resa || 0);
        if (total > 0) return total + ' perco' + (total > 1 ? 's' : '') + ((r.resa || 0) > 0 ? ' (dont ' + r.resa + ' résa)' : '');
        if (r.pepites > 0) return formatNumber(r.pepites) + ' pépites';
        return '—';
    }

    function exportLadderImage() {
        if (!ladder.length) {
            window.REN.toast('Aucun classement à exporter.', 'error');
            return;
        }

        var isPoints = percoMode === 'points';
        var bareme = isPoints ? pointsConfig : paliers;

        /* Reservations par joueur (mode rang) */
        var resaByUser = {};
        if (!isPoints) {
            reservations.forEach(function (r) {
                if (!resaByUser[r.user_id]) resaByUser[r.user_id] = [];
                resaByUser[r.user_id].push(r.zone ? r.zone.nom : '?');
            });
        }

        var W = 1000;
        var pad = 40;
        var rowH = 34;
        var baremeLineH = 25;
        var headerH = 118;
        var baremeH = bareme.length * baremeLineH + 26;
        var thH = 42;
        var footerH = 46;
        /* Sans colonne de zone, le classement tient sur deux colonnes : image deux fois moins haute */
        var deuxCol = !isPoints && !percoResa;
        var parCol = deuxCol ? Math.ceil(ladder.length / 2) : ladder.length;
        var colW = (W - 2 * pad - 24) / 2;      /* largeur utile d'une colonne */
        var colX = [pad, pad + colW + 24];       /* abscisse de depart de chaque colonne */
        var H = headerH + baremeH + thH + parCol * rowH + footerH;

        var canvas = document.createElement('canvas');
        var scale = 2; /* export net (retina) */
        canvas.width = W * scale;
        canvas.height = H * scale;
        var ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        ctx.textBaseline = 'middle';

        /* Fond + lisere violet */
        ctx.fillStyle = '#17181c';
        ctx.fillRect(0, 0, W, H);
        var grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, '#e07c0a');
        grad.addColorStop(1, '#251a4d');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, 6);

        /* En-tete */
        ctx.fillStyle = '#e8eaed';
        ctx.font = '700 30px Rajdhani, Inter, sans-serif';
        ctx.fillText('REDEMPTION [RDM]', pad, 44);
        ctx.fillStyle = '#ffb238';
        ctx.font = '700 19px Rajdhani, Inter, sans-serif';
        ctx.fillText('DROITS PERCEPTEURS', pad, 74);
        ctx.fillStyle = '#a1a5ad';
        ctx.font = '400 13px Inter, sans-serif';
        var periodeEl = document.getElementById('board-period');
        ctx.fillText(periodeEl ? periodeEl.textContent : '', pad, 98);

        /* Bareme */
        var y = headerH + 8;
        bareme.forEach(function (b) {
            var txt;
            if (isPoints) {
                var range = b.seuil_max !== null ? b.seuil_min + '-' + b.seuil_max + ' pts' : b.seuil_min + '+ pts';
                var parts = [];
                if (b.percepteurs_bonus > 0) parts.push(b.percepteurs_bonus + ' perco' + (b.percepteurs_bonus > 1 ? 's' : ''));
                if ((b.resa || 0) > 0) parts.push(b.resa + ' résa de zone');
                if (b.pepites > 0) parts.push(formatNumber(b.pepites) + ' pépites');
                if ((b.jetons_reward || 0) > 0) parts.push(b.jetons_reward + ' jetons');
                txt = (b.emoji ? b.emoji + ' ' : '') + b.label + ' (' + range + ') : ' + (parts.join(' + ') || '—');
                if ((b.resa || 0) > 0 && b.percepteurs_bonus > 0) {
                    txt += '  =  ' + (b.percepteurs_bonus + b.resa) + ' percos au total';
                }
            } else {
                var lbl = b.rang_min === b.rang_max ? 'Top ' + b.rang_min : 'Top ' + b.rang_min + '-' + b.rang_max;
                var dts = [];
                if (b.percos > 0) dts.push(b.percos + ' perco' + (b.percos > 1 ? 's' : ''));
                if (b.percos_150 > 0) dts.push(b.percos_150 + ' perco' + (b.percos_150 > 1 ? 's' : '') + ' niv 150-');
                txt = (b.emoji ? b.emoji + ' ' : '') + lbl + ' : ' + (dts.join(' + ') || '—');
            }
            ctx.fillStyle = '#c6c9cf';
            ctx.font = '400 13.5px Inter, sans-serif';
            ctx.fillText(txt, pad, y);
            y += baremeLineH;
        });

        /* Tableau : en-tete */
        y += 8;
        ctx.fillStyle = '#232430';
        drawRoundRect(ctx, pad - 12, y, W - 2 * pad + 24, thH, 8);
        ctx.fill();
        var cols;
        if (isPoints) {
            cols = [{ x: pad, t: '#' }, { x: pad + 50, t: 'JOUEUR' }, { x: 470, t: 'PTS', right: true }, { x: 500, t: 'PALIER' }, { x: 655, t: 'DROITS' }, { x: 815, t: 'ZONE RÉSERVÉE' }];
        } else if (deuxCol) {
            cols = [];
            colX.forEach(function (x0) {
                cols.push({ x: x0, t: '#' }, { x: x0 + 40, t: 'JOUEUR' }, { x: x0 + 300, t: 'PTS', right: true }, { x: x0 + 322, t: 'DROITS' });
            });
        } else {
            cols = [{ x: pad, t: '#' }, { x: pad + 50, t: 'JOUEUR' }, { x: 470, t: 'PTS', right: true }, { x: 500, t: 'DROITS' }, { x: 705, t: 'ZONE RÉSERVÉE' }];
        }
        ctx.font = '700 11.5px Inter, sans-serif';
        ctx.fillStyle = '#8b8f98';
        cols.forEach(function (c) {
            ctx.textAlign = c.right ? 'right' : 'left';
            ctx.fillText(c.t, c.x, y + thH / 2);
        });
        ctx.textAlign = 'left';
        y += thH;

        /* Lignes du classement */
        var rankColors = { 1: '#f4c430', 2: '#c0c4cc', 3: '#cd8032' };
        ladder.forEach(function (p, i) {
            var col = deuxCol ? Math.floor(i / parCol) : 0;
            var r = deuxCol ? i % parCol : i;
            var top = y + r * rowH;
            var cy = top + rowH / 2;
            var x0 = deuxCol ? colX[col] : pad;
            var xNom = deuxCol ? x0 + 40 : pad + 50;
            var xPts = deuxCol ? x0 + 300 : 470;
            var xDroits = deuxCol ? x0 + 322 : 500;
            if (r % 2 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.025)';
                if (deuxCol) ctx.fillRect(x0 - 12, top, colW + 24, rowH);
                else ctx.fillRect(pad - 12, top, W - 2 * pad + 24, rowH);
            }
            ctx.fillStyle = rankColors[p.rang] || '#6c7077';
            ctx.font = '700 14px Inter, sans-serif';
            ctx.fillText(String(p.rang), x0, cy);

            ctx.fillStyle = '#e8eaed';
            ctx.font = '600 14px Inter, sans-serif';
            ctx.fillText(truncateTxt(p.username, deuxCol ? 20 : 26), xNom, cy);

            ctx.fillStyle = '#f0a63c';
            ctx.font = '700 14px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(String(p.points), xPts, cy);
            ctx.textAlign = 'left';

            if (isPoints) {
                var r = rewardForPoints(p.points);
                ctx.fillStyle = '#c6c9cf';
                ctx.font = '400 13px Inter, sans-serif';
                ctx.fillText(r ? ((r.emoji ? r.emoji + ' ' : '') + r.label) : '—', 500, cy);
                ctx.fillText(rewardTextPoints(p), 655, cy);
                var z = (zoneReserveeMap[p.user_id] && canResaPoints(p.user_id)) ? zoneReserveeMap[p.user_id] : '—';
                ctx.fillStyle = z === '—' ? '#6c7077' : '#ffb238';
                ctx.fillText(truncateTxt(z, 22), 815, cy);
            } else {
                var pal = palierFor(p.rang);
                var dtxt = '—';
                if (pal) {
                    var pp = [];
                    if (pal.percos > 0) pp.push(pal.percos + ' perco' + (pal.percos > 1 ? 's' : ''));
                    if (pal.percos_150 > 0) pp.push(pal.percos_150 + ' niv 150-');
                    dtxt = (pal.emoji ? pal.emoji + ' ' : '') + (pp.join(' + ') || '—');
                }
                ctx.fillStyle = '#c6c9cf';
                ctx.font = '400 13px Inter, sans-serif';
                ctx.fillText(dtxt, xDroits, cy);
                if (percoResa) {
                    var zr = (resaByUser[p.user_id] || []).join(' · ') || '—';
                    ctx.fillStyle = zr === '—' ? '#6c7077' : '#ffb238';
                    ctx.fillText(truncateTxt(zr, 30), 705, cy);
                }
            }
        });

        /* Separateur vertical entre les deux colonnes */
        if (deuxCol && ladder.length > 1) {
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(W / 2 - 0.5, y, 1, parCol * rowH);
        }

        /* Pied de page */
        var fy = y + parCol * rowH + footerH / 2;
        var mois = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
        var now = new Date();
        ctx.fillStyle = '#6c7077';
        ctx.font = '400 12px Inter, sans-serif';
        ctx.fillText('redemption-alliance.vercel.app', pad, fy);
        ctx.textAlign = 'right';
        ctx.fillText('généré le ' + now.getDate() + ' ' + mois[now.getMonth()] + ' ' + now.getFullYear(), W - pad, fy);
        ctx.textAlign = 'left';

        canvas.toBlob(function (blob) {
            if (!blob) { window.REN.toast('Erreur lors de la génération.', 'error'); return; }
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'droits-percos-' + new Date().toISOString().slice(0, 10) + '.png';
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
            window.REN.toast('Image téléchargée ! Glisse-la dans Discord.', 'success');
        }, 'image/png');
    }

    /* === PERIODE (periode_pvp_infos() en SQL, reglee par les admins) === */
    /* Sans remise a zero (pas de fin), les droits suivent le classement en
       direct ; sinon ils valent pour la periode en cours. */
    function periodeTexte(phrasePeriodique, phraseIllimite) {
        if (!periodeInfos) return 'Chargement de la période...';
        if (!periodeInfos.fin) return phraseIllimite;
        var debut = new Date(periodeInfos.debut);
        var veille = new Date(new Date(periodeInfos.fin).getTime() - 24 * 3600 * 1000);
        return (periodeInfos.libelle || 'Période') + ' du ' + formatDate(debut) + ' au ' + formatDate(veille) + ' : ' + phrasePeriodique + '.';
    }

    function formatDate(date) {
        var mois = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
        return date.getDate() + ' ' + mois[date.getMonth()];
    }

    /* === CHARGEMENTS === */
    async function loadPaliers() {
        try {
            var { data } = await window.REN.supabase
                .from('paliers_percos').select('*').order('rang_min');
            paliers = data || [];
        } catch (err) {
            console.error('[REN-BOARD] Erreur paliers:', err);
        }
    }

    async function loadLadder() {
        try {
            var res = await window.REN.supabase.from('classement_pvp_semaine_passee').select('id, username, points');
            var rows = res.data || [];
            if (!rows.length) {
                ladderSource = 'courante';
                res = await window.REN.supabase.from('classement_pvp_semaine').select('id, username, points');
                rows = res.data || [];
            }
            /* Même ordre déterministe que l'attribution SQL : points desc, pseudo asc */
            rows.sort(function (a, b) { return b.points - a.points || a.username.localeCompare(b.username); });
            ladder = rows.map(function (r, i) {
                return { user_id: r.id, username: r.username, points: r.points, rang: i + 1 };
            });
        } catch (err) {
            console.error('[REN-BOARD] Erreur classement:', err);
        }
    }

    async function loadReservations() {
        try {
            var { data } = await window.REN.supabase
                .from('perco_reservations')
                .select('*, zone:zones_reservation!zone_id(nom, sous_titre)')
                .order('periode_debut', { ascending: false })
                .order('tour', { ascending: true })
                .order('rang', { ascending: true });
            var rows = data || [];
            if (!rows.length) { reservations = []; return; }
            /* Ne garder que la période la plus récente (comparaison timezone-proof) */
            var latest = rows[0].periode_debut;
            reservations = rows.filter(function (r) { return r.periode_debut === latest; });
        } catch (err) {
            console.error('[REN-BOARD] Erreur réservations:', err);
        }
    }

    async function loadZonesBda() {
        try {
            var { data } = await window.REN.supabase
                .from('zones_bda').select('*').order('created_at', { ascending: true });
            zonesBda = data || [];
        } catch (err) {
            console.error('[REN-BOARD] Erreur zones BDA:', err);
        }
    }

    async function loadZones() {
        try {
            /* Catalogue dédié réservations : 1 entrée = le couple donjon + zone associée */
            var { data } = await window.REN.supabase
                .from('zones_reservation')
                .select('id, nom, sous_titre, categorie, ordre')
                .eq('actif', true)
                .order('categorie')
                .order('ordre');
            var bdaNames = {};
            zonesBda.forEach(function (z) { bdaNames[z.nom_zone.trim().toLowerCase()] = true; });
            allZones = (data || []).filter(function (z) {
                return !bdaNames[z.nom.trim().toLowerCase()];
            });
        } catch (err) {
            console.error('[REN-BOARD] Erreur zones:', err);
        }
    }

    /* Construit MA liste complete : mes preferences sauvegardees d'abord
       (dans leur ordre), puis le reste du catalogue dans l'ordre par defaut */
    function buildMyList() {
        var byId = {};
        allZones.forEach(function (z) { byId[z.id] = z; });
        var seen = {};
        myList = [];
        myPrefs.forEach(function (p) {
            var z = byId[p.zone_id];
            if (z && !seen[z.id]) { myList.push(z); seen[z.id] = true; }
        });
        allZones.forEach(function (z) {
            if (!seen[z.id]) { myList.push(z); seen[z.id] = true; }
        });
    }

    async function loadMyPrefs() {
        try {
            var { data } = await window.REN.supabase
                .from('perco_preferences')
                .select('zone_id, ordre, zone:zones_reservation!zone_id(nom, sous_titre)')
                .eq('user_id', window.REN.currentProfile.id)
                .order('ordre');
            myPrefs = (data || []).map(function (p) {
                return {
                    zone_id: p.zone_id,
                    nom: p.zone ? p.zone.nom : '?',
                    sous_titre: p.zone ? (p.zone.sous_titre || '') : ''
                };
            });
        } catch (err) {
            console.error('[REN-BOARD] Erreur préférences:', err);
        }
    }

    /* === PÉRIODE === */
    function renderPeriode() {
        var el = document.getElementById('board-period');
        if (!el) return;
        var quoi = percoResa ? 'droits et zones' : 'droits';
        el.textContent = periodeTexte(
            ladderSource === 'courante'
                ? 'période de lancement, ' + quoi + ' selon le classement en cours'
                : quoi + ' selon le classement de la période précédente',
            'Sans remise à zéro : les ' + quoi + ' suivent le classement depuis le début, mis à jour en direct.');
    }

    /* Guide d'utilisation : le texte de board.html decrit le modele par
       points, on le remplace en mode classement */
    function renderGuideRang() {
        var ol = document.querySelector('#guide-modal .guide-steps');
        if (!ol) return;
        var html = '<li><strong>Le ladder.</strong> Ta place au classement PvP détermine ton palier, et chaque palier donne un nombre de percos à poser.</li>';
        html += '<li><strong>La période.</strong> ' + (periodeInfos && periodeInfos.fin
            ? 'Le classement repart de zéro à chaque ' + String(periodeInfos.libelle || 'période').toLowerCase() + '. Les droits affichés valent pour la période en cours et se calculent sur le classement de la précédente.'
            : 'Pas de remise à zéro pour le moment : les droits suivent le classement depuis le début et bougent en direct.') + '</li>';
        if (percoResa) {
            html += '<li><strong>Les zones.</strong> Dans « Mes préférences », classe les zones dans ton ordre. À chaque période, dans l\'ordre du classement, chacun reçoit sa zone la mieux placée encore libre : elle apparaît dans la colonne « Zone réservée », personne d\'autre ne pose dessus.</li>';
        }
        html += '<li><strong>Zones BDA.</strong> Le bouton en haut liste les zones réservées à la Banque d\'Alliance : leurs récoltes financent les récompenses, on ne pose pas dessus.</li>';
        ol.innerHTML = html;
    }

    /* === BARÈME (paliers par rang) === */
    function renderBareme() {
        var container = document.getElementById('board-bareme');
        if (!container) return;
        var esc = window.REN.escapeHtml;
        var html = '';
        paliers.forEach(function (p) {
            var label = p.rang_min === p.rang_max ? 'Top ' + p.rang_min : 'Top ' + p.rang_min + '-' + p.rang_max;
            var droits = [];
            if (p.percos > 0) droits.push(p.percos + ' perco' + (p.percos > 1 ? 's' : ''));
            if (p.percos_150 > 0) droits.push(p.percos_150 + ' perco' + (p.percos_150 > 1 ? 's' : '') + ' niv 150-');
            html += '<div class="board-bareme__item">'
                + '<span class="board-bareme__emoji">' + esc(p.emoji || '') + '</span>'
                + '<div class="board-bareme__info">'
                    + '<span class="board-bareme__label">' + esc(label) + '</span>'
                + '</div>'
                + '<div class="board-bareme__rewards">'
                    + '<span class="board-bareme__perco">' + esc(droits.join(' + ') || '—') + '</span>'
                + '</div>'
                + '</div>';
        });
        container.innerHTML = html ? '<div class="board-bareme__grid">' + html + '</div>' : '<p class="text-muted">Aucun palier configuré.</p>';
    }

    function palierFor(rang) {
        for (var i = 0; i < paliers.length; i++) {
            if (rang >= paliers[i].rang_min && rang <= paliers[i].rang_max) return paliers[i];
        }
        return null;
    }

    /* === TABLEAU === */
    function renderTable() {
        var container = document.getElementById('board-table-wrap');
        if (!container) return;

        if (!ladder.length) {
            container.innerHTML = '<p class="text-muted text-center" style="padding:2rem;">Aucun combat sur la période de référence.</p>';
            return;
        }

        /* Réservations par joueur (tours dans l'ordre) */
        var resaByUser = {};
        reservations.forEach(function (r) {
            if (!resaByUser[r.user_id]) resaByUser[r.user_id] = [];
            resaByUser[r.user_id].push(r);
        });

        var esc = window.REN.escapeHtml;
        var myId = window.REN.currentProfile.id;
        var html = '<table class="board-table">';
        html += '<thead><tr>';
        html += '<th class="board-table__th board-table__th--rank">#</th>';
        html += '<th class="board-table__th board-table__th--name">Joueur</th>';
        html += '<th class="board-table__th board-table__th--points">Points</th>';
        html += '<th class="board-table__th board-table__th--tier">Droits percos</th>';
        if (percoResa) html += '<th class="board-table__th board-table__th--zone">Zone réservée</th>';
        html += '</tr></thead><tbody>';

        ladder.forEach(function (p) {
            var palier = palierFor(p.rang);
            var droits = '—';
            if (palier) {
                var parts = [];
                if (palier.percos > 0) parts.push('<strong>' + palier.percos + '</strong> <img class="icon-inline icon-inline--perco" src="assets/images/percepteur.png" alt="perco">');
                if (palier.percos_150 > 0) parts.push('<strong>' + palier.percos_150 + '</strong> <img class="icon-inline icon-inline--perco" src="assets/images/percepteur.png" alt="perco"> <span class="board-table__lvl">niv 150-</span>');
                droits = (palier.emoji ? esc(palier.emoji) + ' ' : '') + (parts.join(' + ') || '—');
            }

            var resas = resaByUser[p.user_id] || [];
            var zoneTxt = resas.length
                ? resas.map(function (r) {
                    var nom = r.zone ? r.zone.nom : '?';
                    var sub = r.zone && r.zone.sous_titre ? ' <span class="board-table__lvl">' + esc(r.zone.sous_titre) + '</span>' : '';
                    return '<strong>' + esc(nom) + '</strong>' + sub;
                }).join(' <span class="text-muted">·</span> ')
                : '—';

            html += '<tr class="board-table__row' + (p.user_id === myId ? ' board-table__row--me' : '') + '">';
            html += '<td class="board-table__td board-table__td--rank">' + p.rang + '</td>';
            html += '<td class="board-table__td board-table__td--name notranslate">' + esc(p.username) + '</td>';
            html += '<td class="board-table__td board-table__td--points">' + p.points + '</td>';
            html += '<td class="board-table__td board-table__td--tier">' + droits + '</td>';
            if (percoResa) html += '<td class="board-table__td board-table__td--zone">' + zoneTxt + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    /* === MES PRÉFÉRENCES === */
    /* === MES PRÉFÉRENCES (liste complète, réordonnable par drag & drop) === */
    function renderPrefs() {
        var listEl = document.getElementById('board-prefs-list');
        var mineEl = document.getElementById('board-prefs-mine');
        var saveBtn = document.getElementById('board-prefs-save');
        if (!listEl) return;

        var esc = window.REN.escapeHtml;

        /* Position de chaque zone dans l'ordre de base de l'alliance (repere fixe) */
        var baseOrderMap = {};
        allZones.forEach(function (z, i) { baseOrderMap[z.id] = i + 1; });

        /* Encart : ma zone attribuée pour la quinzaine en cours */
        var myResas = reservations.filter(function (r) { return r.user_id === window.REN.currentProfile.id; });
        var mineHtml;
        if (myResas.length) {
            mineHtml = '<div class="board-prefs__mine">Ta zone attribuée pour cette quinzaine : '
                + myResas.map(function (r) {
                    var nom = r.zone ? r.zone.nom : '?';
                    var sub = r.zone && r.zone.sous_titre ? ' <span class="pref-row__lvl">' + esc(r.zone.sous_titre) + '</span>' : '';
                    return '<strong>' + esc(nom) + '</strong>' + sub;
                }).join(' <span class="text-muted">&middot;</span> ') + '</div>';
        } else {
            mineHtml = '<div class="board-prefs__mine board-prefs__mine--none">Aucune zone attribuée pour l\'instant sur cette quinzaine. Le tirage se fait automatiquement au reset (un admin peut le recalculer).</div>';
        }
        if (mineEl) mineEl.innerHTML = mineHtml;

        var html = '';
        myList.forEach(function (z, i) {
            html += '<div class="pref-row pref-row--drag" draggable="true" data-zone-id="' + z.id + '">';
            html += '<span class="pref-row__grip" title="Glisser pour déplacer"><svg width="12" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.8"/><circle cx="15" cy="5" r="1.8"/><circle cx="9" cy="12" r="1.8"/><circle cx="15" cy="12" r="1.8"/><circle cx="9" cy="19" r="1.8"/><circle cx="15" cy="19" r="1.8"/></svg></span>';
            html += '<span class="pref-row__ordre">' + (i + 1) + '</span>';
            html += '<span class="pref-row__nom notranslate">' + esc(z.nom)
                + (z.sous_titre ? ' <span class="pref-row__lvl">' + esc(z.sous_titre) + '</span>' : '')
                + (z.categorie === 'secondaire' ? ' <span class="pref-row__cat">2nd</span>' : '')
                + '</span>';
            html += '<span class="pref-row__base" title="Position dans l\'ordre de base de l\'alliance">base n°' + (baseOrderMap[z.id] || '?') + '</span>';
            html += '<span class="pref-row__actions">';
            html += '<button class="pref-row__btn" data-action="up" data-i="' + i + '" title="Monter"' + (i === 0 ? ' disabled' : '') + '>&#9650;</button>';
            html += '<button class="pref-row__btn" data-action="down" data-i="' + i + '" title="Descendre"' + (i === myList.length - 1 ? ' disabled' : '') + '>&#9660;</button>';
            html += '</span>';
            html += '</div>';
        });
        listEl.innerHTML = html;

        if (saveBtn) saveBtn.hidden = !prefsDirty;
        bindPrefsControls();
    }

    var prefsControlsBound = false;
    function bindPrefsControls() {
        if (prefsControlsBound) return;
        prefsControlsBound = true;

        var listEl = document.getElementById('board-prefs-list');
        var filterInput = document.getElementById('board-prefs-filter');
        var saveBtn = document.getElementById('board-prefs-save');
        var resetBtn = document.getElementById('board-prefs-reset');

        if (saveBtn) saveBtn.addEventListener('click', savePrefs);
        if (resetBtn) resetBtn.addEventListener('click', resetPrefs);

        /* Recherche : scrolle jusqu'à la première zone qui matche et la surligne */
        if (filterInput && listEl) {
            filterInput.addEventListener('input', function () {
                var q = filterInput.value.trim().toLowerCase();
                listEl.querySelectorAll('.pref-row--hit').forEach(function (r) { r.classList.remove('pref-row--hit'); });
                if (q.length < 2) return;
                var rows = listEl.querySelectorAll('.pref-row');
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].textContent.toLowerCase().indexOf(q) !== -1) {
                        rows[i].classList.add('pref-row--hit');
                        rows[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
                        break;
                    }
                }
            });
        }

        if (!listEl) return;

        /* Flèches monter/descendre (délégation, la liste est re-rendue à chaque fois) */
        listEl.addEventListener('click', function (e) {
            var btn = e.target.closest('.pref-row__btn');
            if (!btn || btn.disabled) return;
            var i = parseInt(btn.dataset.i, 10);
            var action = btn.dataset.action;
            if (action === 'up' && i > 0) {
                var tmp = myList[i - 1]; myList[i - 1] = myList[i]; myList[i] = tmp;
            } else if (action === 'down' && i < myList.length - 1) {
                var tmp2 = myList[i + 1]; myList[i + 1] = myList[i]; myList[i] = tmp2;
            } else {
                return;
            }
            prefsDirty = true;
            renderPrefs();
        });

        /* Drag & drop : on déplace la ligne dans le DOM pendant le survol,
           puis on relit l'ordre du DOM au lâcher */
        listEl.addEventListener('dragstart', function (e) {
            var row = e.target.closest('.pref-row');
            if (!row) return;
            row.classList.add('pref-row--dragging');
            try { e.dataTransfer.setData('text/plain', row.dataset.zoneId); } catch (err) { /* vieux navigateurs */ }
            e.dataTransfer.effectAllowed = 'move';
        });

        listEl.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            var dragging = listEl.querySelector('.pref-row--dragging');
            var target = e.target.closest('.pref-row');
            if (!dragging || !target || target === dragging) return;
            var rect = target.getBoundingClientRect();
            var after = (e.clientY - rect.top) > rect.height / 2;
            listEl.insertBefore(dragging, after ? target.nextSibling : target);
        });

        listEl.addEventListener('drop', function (e) { e.preventDefault(); });

        listEl.addEventListener('dragend', function () {
            var dragging = listEl.querySelector('.pref-row--dragging');
            if (dragging) dragging.classList.remove('pref-row--dragging');
            syncListFromDom(listEl);
        });
    }

    /* Relit l'ordre du DOM après un drag et met à jour la liste */
    function syncListFromDom(listEl) {
        var byId = {};
        myList.forEach(function (z) { byId[z.id] = z; });
        var newList = [];
        listEl.querySelectorAll('.pref-row').forEach(function (row) {
            var z = byId[parseInt(row.dataset.zoneId, 10)];
            if (z) newList.push(z);
        });
        if (newList.length !== myList.length) return;
        var changed = false;
        for (var i = 0; i < myList.length; i++) {
            if (myList[i].id !== newList[i].id) { changed = true; break; }
        }
        if (!changed) return;
        myList = newList;
        prefsDirty = true;
        renderPrefs();
    }

    async function savePrefs() {
        var saveBtn = document.getElementById('board-prefs-save');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Enregistrement...'; }
        try {
            var me = window.REN.currentProfile.id;
            var del = await window.REN.supabase.from('perco_preferences').delete().eq('user_id', me);
            if (del.error) throw del.error;

            /* Ordre identique au catalogue : rien à stocker, l'ordre par défaut s'applique */
            var isDefault = myList.length === allZones.length && myList.every(function (z, i) { return allZones[i] && z.id === allZones[i].id; });
            if (!isDefault && myList.length) {
                var rows = myList.map(function (z, i) {
                    return { user_id: me, zone_id: z.id, ordre: i + 1 };
                });
                var ins = await window.REN.supabase.from('perco_preferences').insert(rows);
                if (ins.error) throw ins.error;
            }

            prefsDirty = false;
            renderPrefs();
            window.REN.toast('Ton ordre de préférence est enregistré. Il sera utilisé au prochain calcul d\'attribution.', 'success');
        } catch (err) {
            console.error('[REN-BOARD] Erreur sauvegarde préférences:', err);
            window.REN.toast('Erreur : ' + err.message, 'error');
        } finally {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Enregistrer mes préférences'; }
        }
    }

    async function resetPrefs() {
        if (!confirm('Revenir à l\'ordre par défaut de l\'alliance ? Ton classement personnalisé sera supprimé.')) return;
        try {
            var del = await window.REN.supabase.from('perco_preferences').delete().eq('user_id', window.REN.currentProfile.id);
            if (del.error) throw del.error;
            myPrefs = [];
            myList = allZones.slice();
            prefsDirty = false;
            renderPrefs();
            window.REN.toast('Ordre par défaut rétabli.', 'success');
        } catch (err) {
            window.REN.toast('Erreur : ' + err.message, 'error');
        }
    }

    /* === ZONES BDA === */
    function setupBdaModal() {
        var btn = document.getElementById('btn-zones-bda');
        var overlay = document.getElementById('modal-zones-bda');
        var closeBtn = document.getElementById('modal-bda-close');
        var listEl = document.getElementById('zones-bda-list');
        if (!btn || !overlay) return;

        if (zonesBda.length > 0) {
            btn.innerHTML += ' <span class="bda-badge">' + zonesBda.length + '</span>';
        }

        btn.addEventListener('click', function () {
            renderBdaZones(listEl);
            overlay.classList.add('active');
        });

        closeBtn.addEventListener('click', function () {
            overlay.classList.remove('active');
        });

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    }

    function renderBdaZones(container) {
        if (!zonesBda.length) {
            container.innerHTML = '<p class="text-muted text-center" style="padding:var(--spacing-lg);">Aucune zone réservée pour le moment.</p>';
            return;
        }

        var html = '<div class="bda-zones-grid">';
        zonesBda.forEach(function (z) {
            html += '<div class="bda-zone-card">';
            html += '<div class="bda-zone-card__icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>';
            html += '<div class="bda-zone-card__info">';
            html += '<span class="bda-zone-card__name">' + window.REN.escapeHtml(z.nom_zone) + '</span>';
            if (z.description) html += '<span class="bda-zone-card__desc">' + window.REN.escapeHtml(z.description) + '</span>';
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
    }

})();
