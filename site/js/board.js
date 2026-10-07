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
    var percoResa = true;       /* reservations de zones actives (site_config.perco_reservations), mode rang */
    var periodeInfos = null;    /* periode_pvp_infos() : mode, debut, fin, libelle */
    var prefMax = 5;            /* taille du top de preferences (site_config.perco_pref_max) */
    var myTop = [];             /* mon top : zones choisies, dans mon ordre */

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

        /* Paliers, classement et zones BDA d'abord : les reservations ne
           comptent que si un palier en donne (colonne Reservations, sql/056) */
        await Promise.all([loadPaliers(), loadLadder(), loadZonesBda()]);
        percoResa = percoResa && paliers.some(function (p) { return (p.resa || 0) > 0; });

        /* Pas de reservation : le ladder seul, sans onglet Mes preferences ni
           colonne Zone reservee */
        if (!percoResa) {
            var tabsRang = document.getElementById('board-tabs');
            if (tabsRang) tabsRang.style.display = 'none';
            var tabPrefsRang = document.getElementById('board-tab-preferences');
            if (tabPrefsRang) tabPrefsRang.hidden = true;
            reservations = [];
            renderPeriode();
            renderBareme();
            renderTable();
            renderGuideRang();
            setupBdaModal();
            return;
        }

        /* Le tirage (en direct sans remise a zero, fige sinon) vient de
           attribution_percos_courante() */
        await Promise.all([loadReservations(), loadMyPrefs(), loadZones()]);
        buildMyTop();

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
                .from('site_config').select('cle, valeur').in('cle', ['perco_mode', 'perco_reservations', 'perco_pref_max']);
            var cfg = {};
            (data || []).forEach(function (r) { cfg[r.cle] = r.valeur; });
            percoMode = cfg.perco_mode === 'rang' ? 'rang' : 'points';
            /* cle absente = reservations actives (comportement d'avant la migration 053) */
            percoResa = cfg.perco_reservations !== 'false';
            prefMax = Math.min(20, Math.max(1, parseInt(cfg.perco_pref_max, 10) || 5));
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
        /* Phrase de periode : sur plusieurs lignes si elle depasse la largeur */
        var periodeEl = document.getElementById('board-period');
        var lignesPeriode = (function () {
            var txt = periodeEl ? periodeEl.textContent : '';
            var m = document.createElement('canvas').getContext('2d');
            m.font = '400 13px Inter, sans-serif';
            var max = W - 2 * pad, out = [], cur = '';
            txt.split(' ').forEach(function (mot) {
                var essai = cur ? cur + ' ' + mot : mot;
                if (cur && m.measureText(essai).width > max) { out.push(cur); cur = mot; } else { cur = essai; }
            });
            if (cur) out.push(cur);
            return out.length ? out : [''];
        })();
        headerH += (lignesPeriode.length - 1) * 18;
        var baremeH = bareme.length * baremeLineH + 26;
        var thH = 42;
        var footerH = 46;
        /* Mode classement : le classement tient sur deux colonnes, et les zones
           reservees (quelques rangs seulement) ont leur bloc a part au-dessus */
        var deuxCol = !isPoints;
        var parCol = deuxCol ? Math.ceil(ladder.length / 2) : ladder.length;
        var colW = (W - 2 * pad - 24) / 2;      /* largeur utile d'une colonne */
        var colX = [pad, pad + colW + 24];       /* abscisse de depart de chaque colonne */
        var zonesExport = [];
        if (!isPoints && percoResa) {
            ladder.forEach(function (p) {
                if (resaDe(p.rang) > 0 && resaByUser[p.user_id]) zonesExport.push({ rang: p.rang, username: p.username, zones: resaByUser[p.user_id] });
            });
        }
        var zoneLineH = 24;
        var parColZ = Math.ceil(zonesExport.length / 2);
        var zonesH = zonesExport.length ? 44 + parColZ * zoneLineH : 0;
        var H = headerH + baremeH + zonesH + thH + parCol * rowH + footerH;

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
        lignesPeriode.forEach(function (l, i) { ctx.fillText(l, pad, 98 + i * 18); });

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
                txt = (b.emoji ? b.emoji + ' ' : '') + lbl + ' : ' + droitsTexte(b, false);
            }
            ctx.fillStyle = '#c6c9cf';
            ctx.font = '400 13.5px Inter, sans-serif';
            ctx.fillText(txt, pad, y);
            y += baremeLineH;
        });

        /* Zones reservees : bloc a part, sur deux colonnes */
        if (zonesExport.length) {
            y += 6;
            ctx.fillStyle = '#ffb238';
            ctx.font = '700 14px Rajdhani, Inter, sans-serif';
            ctx.fillText('ZONES RÉSERVÉES (' + texteRangs(plagesResa()).toUpperCase() + ')', pad, y + 8);
            y += 28;
            zonesExport.forEach(function (zx, i) {
                var cz = Math.floor(i / parColZ), rz = i % parColZ;
                var zx0 = colX[cz], zy = y + rz * zoneLineH + zoneLineH / 2;
                ctx.fillStyle = '#8b8f98';
                ctx.font = '700 13px Inter, sans-serif';
                ctx.fillText(String(zx.rang), zx0, zy);
                ctx.fillStyle = '#e8eaed';
                ctx.font = '600 13px Inter, sans-serif';
                ctx.fillText(truncateTxt(zx.username, 16), zx0 + 34, zy);
                ctx.fillStyle = '#ffb238';
                ctx.fillText(truncateTxt(zx.zones.join(' · '), 28), zx0 + 190, zy);
            });
            y += parColZ * zoneLineH + 10;
        }

        /* Tableau : en-tete */
        y += 8;
        ctx.fillStyle = '#232430';
        drawRoundRect(ctx, pad - 12, y, W - 2 * pad + 24, thH, 8);
        ctx.fill();
        var cols;
        if (isPoints) {
            cols = [{ x: pad, t: '#' }, { x: pad + 50, t: 'JOUEUR' }, { x: 470, t: 'PTS', right: true }, { x: 500, t: 'PALIER' }, { x: 655, t: 'DROITS' }, { x: 815, t: 'ZONE RÉSERVÉE' }];
        } else {
            cols = [];
            colX.forEach(function (x0) {
                cols.push({ x: x0, t: '#' }, { x: x0 + 40, t: 'JOUEUR' }, { x: x0 + 252, t: 'PTS', right: true }, { x: x0 + 272, t: 'DROITS' });
            });
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
            var xPts = deuxCol ? x0 + 252 : 470;
            var xDroits = deuxCol ? x0 + 272 : 500;
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
            ctx.fillText(truncateTxt(p.username, deuxCol ? 18 : 26), xNom, cy);

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
                var dtxt = pal ? (pal.emoji ? pal.emoji + ' ' : '') + droitsTexte(pal, true) : 'aucun';
                ctx.fillStyle = '#c6c9cf';
                ctx.font = '400 13px Inter, sans-serif';
                ctx.fillText(dtxt, xDroits, cy);
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
    /* Pas de remise a zero en ce moment : illimite, ou depart programme pas
       encore atteint (periode_pvp_infos().en_direct, sql/057) */
    function periodeEnDirect() {
        if (!periodeInfos) return true;
        return periodeInfos.en_direct !== undefined ? !!periodeInfos.en_direct : !periodeInfos.fin;
    }

    function jourParis(iso) {
        return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' });
    }

    function rythmeTxt() {
        return 'chaque ' + String((periodeInfos && periodeInfos.libelle) || 'période').toLowerCase();
    }

    function periodeTexte(phrasePeriodique, phraseIllimite) {
        if (!periodeInfos) return 'Chargement de la période...';
        if (periodeEnDirect()) {
            if (periodeInfos.programme && periodeInfos.fin) {
                return phraseIllimite + ' Première remise à zéro le ' + jourParis(periodeInfos.fin) + ' à minuit, puis ' + rythmeTxt() + '.';
            }
            return phraseIllimite;
        }
        var debut = new Date(periodeInfos.debut);
        var veille = new Date(new Date(periodeInfos.fin).getTime() - 12 * 3600 * 1000);
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
            var { data, error } = await window.REN.supabase.rpc('attribution_percos_courante');
            if (error) throw error;
            reservations = (data || []).map(function (r) {
                return { tour: r.tour, rang: r.rang, user_id: r.user_id, zone_id: r.zone_id, choix: r.choix,
                    zone: { nom: r.nom, sous_titre: r.sous_titre } };
            });
        } catch (err) {
            reservations = [];
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

    /* Mon top : mes preferences enregistrees, dans leur ordre, limitees a la
       taille du top (seuls ces choix comptent au tirage) */
    function buildMyTop() {
        var byId = {};
        allZones.forEach(function (z) { byId[z.id] = z; });
        myTop = [];
        myPrefs.forEach(function (p) {
            var z = byId[p.zone_id];
            if (z && myTop.length < prefMax && myTop.indexOf(z) === -1) myTop.push(z);
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
        var programme = periodeInfos && periodeInfos.programme && periodeInfos.fin;
        html += '<li><strong>La période.</strong> ' + (!periodeEnDirect()
            ? 'Le classement PvP repart de zéro ' + rythmeTxt() + '. Les droits affichés valent pour la période en cours et se calculent sur le classement de la précédente.'
            : (programme
                ? 'Pas de remise à zéro jusqu\'au ' + jourParis(periodeInfos.fin) + ' à minuit : d\'ici là, les droits suivent le classement depuis le début. Ensuite le classement PvP repart de zéro ' + rythmeTxt() + ', et les droits de chaque période se calculent sur le classement de la précédente.'
                : 'Pas de remise à zéro pour le moment : les droits suivent le classement depuis le début et bougent en direct.')) + '</li>';
        if (percoResa) {
            html += '<li><strong>Les zones réservées.</strong> Les ' + texteRangs(plagesResa()) + ' ont une zone réservée : un de leurs percos y a sa place et personne d\'autre de l\'alliance n\'y pose. La colonne « Droits percos » l\'indique, par exemple « 4 percos dont 1 en zone réservée ».</li>';
            html += '<li><strong>Ton top ' + prefMax + '.</strong> Dans « Mes préférences », choisis jusqu\'à ' + prefMax + ' zones dans ton ordre. Dans l\'ordre du classement, chacun reçoit son premier choix encore libre : si un joueur mieux classé a déjà pris ta zone n°1, tu reçois ta n°2, et ainsi de suite. Ceux qui n\'ont rien choisi passent après et reçoivent une zone dans l\'ordre conseillé par l\'alliance.</li>';
            html += '<li><strong>Quand ça bouge.</strong> ' + (!periodeEnDirect()
                ? 'Le tirage se fait au début de chaque période, sur le classement de la précédente, et reste figé jusqu\'à la suivante.'
                : (programme
                    ? 'Jusqu\'au ' + jourParis(periodeInfos.fin) + ', le tirage suit le classement en direct. Ensuite il se fait au début de chaque période, sur le classement de la précédente, et reste figé jusqu\'à la suivante.'
                    : 'Sans remise à zéro, le tirage suit le classement en direct : si tu entres dans ces rangs tu reçois une zone, si tu en sors elle passe au suivant.')) + '</li>';
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
            var d = droitsPalier(p);
            var rewards = '';
            if (d.total > 0) rewards += '<span class="board-bareme__perco">' + d.total + ' perco' + (d.total > 1 ? 's' : '') + '</span>';
            if (d.resa > 0) rewards += '<span class="board-bareme__resa">dont ' + d.resa + ' en zone réservée</span>';
            if (d.p150 > 0) rewards += '<span class="board-bareme__resa">+ ' + d.p150 + ' perco' + (d.p150 > 1 ? 's' : '') + ' niv 150-</span>';
            html += '<div class="board-bareme__item">'
                + '<span class="board-bareme__emoji">' + esc(p.emoji || '') + '</span>'
                + '<div class="board-bareme__info">'
                    + '<span class="board-bareme__label">' + esc(label) + '</span>'
                + '</div>'
                + '<div class="board-bareme__rewards">'
                    + (rewards || '<span class="text-muted">aucun</span>')
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

    /* Droits d'un palier : total = percos libres + percos en zone reservee ;
       les percos niveau 150 restent a part */
    function droitsPalier(p) {
        var resa = p ? (p.resa || 0) : 0;
        return { total: p ? (p.percos || 0) + resa : 0, resa: resa, p150: p ? (p.percos_150 || 0) : 0 };
    }

    function droitsTexte(p, court) {
        var d = droitsPalier(p);
        var parts = [];
        if (d.total > 0) parts.push(d.total + ' perco' + (d.total > 1 ? 's' : '') + (d.resa > 0 ? (court ? ' dont ' + d.resa + ' rés.' : ' dont ' + d.resa + ' en zone réservée') : ''));
        if (d.p150 > 0) parts.push(d.p150 + (court ? '' : ' perco' + (d.p150 > 1 ? 's' : '')) + ' niv 150-');
        return parts.join(' + ') || 'aucun';
    }

    /* Nombre de zones reservees au rang donne (0 = pas de zone) */
    function resaDe(rang) {
        return droitsPalier(palierFor(rang)).resa;
    }

    /* Plages de rangs qui ont une reservation, fusionnees : [[1, 10], [21, 30]] */
    function plagesResa() {
        var plages = [];
        paliers.slice().sort(function (a, b) { return a.rang_min - b.rang_min; }).forEach(function (p) {
            if ((p.resa || 0) <= 0) return;
            var last = plages[plages.length - 1];
            if (last && p.rang_min <= last[1] + 1) last[1] = Math.max(last[1], p.rang_max);
            else plages.push([p.rang_min, p.rang_max]);
        });
        return plages;
    }

    function texteRangs(plages) {
        if (!plages.length) return 'aucun rang';
        var parts = plages.map(function (pl) { return pl[0] === pl[1] ? String(pl[0]) : pl[0] + ' à ' + pl[1]; });
        var unSeul = plages.length === 1 && plages[0][0] === plages[0][1];
        return (unSeul ? 'rang ' : 'rangs ') + (parts.length > 1 ? parts.slice(0, -1).join(', ') + ' et ' + parts[parts.length - 1] : parts[0]);
    }

    function ordinal(n) {
        return n + (n === 1 ? 'er' : 'e');
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

        var enDirect = periodeEnDirect();
        var icone = ' <img class="icon-inline icon-inline--perco" src="assets/images/percepteur.png" alt="perco">';
        ladder.forEach(function (p) {
            var palier = palierFor(p.rang);
            var d = droitsPalier(palier);
            var parts = [];
            if (d.total > 0) parts.push('<strong>' + d.total + '</strong>' + icone + (d.resa > 0 ? ' <span class="board-table__lvl">dont ' + d.resa + ' en zone réservée</span>' : ''));
            if (d.p150 > 0) parts.push('<strong>' + d.p150 + '</strong>' + icone + ' <span class="board-table__lvl">niv 150-</span>');
            var droits = (palier && palier.emoji ? esc(palier.emoji) + ' ' : '') + (parts.join(' + ') || '<span class="text-muted">aucun</span>');

            /* Zone reservee : rien du tout pour les rangs dont le palier n'en donne pas */
            var zoneTxt = '';
            if (d.resa > 0) {
                var resas = resaByUser[p.user_id] || [];
                zoneTxt = resas.length
                    ? resas.map(function (r) {
                        var nom = r.zone ? r.zone.nom : '?';
                        var sub = r.zone && r.zone.sous_titre ? ' <span class="board-table__lvl">' + esc(r.zone.sous_titre) + '</span>' : '';
                        return '<strong>' + esc(nom) + '</strong>' + sub;
                    }).join(' <span class="text-muted">·</span> ')
                    : '<span class="text-muted">' + (enDirect ? 'aucune zone libre' : 'au prochain tirage') + '</span>';
            }

            html += '<tr class="board-table__row' + (p.user_id === myId ? ' board-table__row--me' : '') + '">';
            html += '<td class="board-table__td board-table__td--rank">' + p.rang + '</td>';
            html += '<td class="board-table__td board-table__td--name notranslate">' + esc(p.username) + (percoResa && zoneTxt ? '<div class="board-table__zone-mobile">' + zoneTxt + '</div>' : '') + '</td>';
            html += '<td class="board-table__td board-table__td--points">' + p.points + '</td>';
            html += '<td class="board-table__td board-table__td--tier">' + droits + '</td>';
            if (percoResa) html += '<td class="board-table__td board-table__td--zone">' + zoneTxt + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    /* === MES PRÉFÉRENCES : un top de N zones choisies dans la liste === */
    function normTxt(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function ligneDe(userId) {
        for (var i = 0; i < ladder.length; i++) if (ladder[i].user_id === userId) return ladder[i];
        return null;
    }

    /* Joueur qui a explicitement choisi cette zone et la tient en ce moment */
    function choisiePar(zoneId) {
        var me = window.REN.currentProfile.id;
        for (var i = 0; i < reservations.length; i++) {
            var r = reservations[i];
            if (r.zone_id === zoneId && r.user_id !== me && (r.choix || 0) > 0) {
                var l = ligneDe(r.user_id);
                return l ? l.username + ' (' + ordinal(l.rang) + ')' : 'un autre joueur';
            }
        }
        return '';
    }

    function renderPrefs() {
        var listEl = document.getElementById('board-prefs-list');
        var topEl = document.getElementById('board-prefs-top');
        var mineEl = document.getElementById('board-prefs-mine');
        var hintEl = document.getElementById('board-prefs-hint');
        var saveBtn = document.getElementById('board-prefs-save');
        var resetBtn = document.getElementById('board-prefs-reset');
        if (!listEl || !topEl) return;

        var esc = window.REN.escapeHtml;
        var me = window.REN.currentProfile.id;
        var enDirect = periodeEnDirect();
        var rangsTxt = texteRangs(plagesResa());

        if (hintEl) hintEl.textContent = 'Choisis jusqu\'à ' + prefMax + ' zones dans la liste, dans ton ordre de préférence. Dans l\'ordre du classement, chaque joueur qui a droit à une zone reçoit son premier choix encore libre : si un joueur mieux classé a déjà pris ta zone n°1, tu reçois ta n°2, et ainsi de suite. Ceux qui n\'ont rien choisi passent après tout le monde.';

        /* Encart : ma situation */
        var moi = ligneDe(me);
        var mesResas = reservations.filter(function (r) { return r.user_id === me; });
        var mine;
        if (!moi) {
            mine = '<div class="board-prefs__mine board-prefs__mine--none">Tu n\'es pas encore classé. Les zones réservées vont aux ' + esc(rangsTxt) + ' du classement : prépare ton top, il servira dès que tu y entres.</div>';
        } else if (resaDe(moi.rang) <= 0) {
            mine = '<div class="board-prefs__mine board-prefs__mine--none">Tu es <strong>' + ordinal(moi.rang) + '</strong>. Les zones réservées vont aux ' + esc(rangsTxt) + ' : prépare ton top, il servira dès que tu y entres.</div>';
        } else if (mesResas.length) {
            var detail = mesResas.map(function (r) {
                var nom = r.zone ? r.zone.nom : '?';
                var sub = r.zone && r.zone.sous_titre ? ' <span class="pref-row__lvl">' + esc(r.zone.sous_titre) + '</span>' : '';
                var pourquoi = (r.choix || 0) > 0
                    ? 'ton choix n°' + r.choix
                    : (myPrefs.length ? 'zone par défaut, tes choix sont pris par des joueurs mieux classés' : 'zone par défaut, tu n\'as pas encore choisi ton top');
                return '<strong>' + esc(nom) + '</strong>' + sub + ' <span class="text-muted">(' + pourquoi + ')</span>';
            }).join(' <span class="text-muted">·</span> ');
            mine = '<div class="board-prefs__mine">Tu es <strong>' + ordinal(moi.rang) + '</strong>. ' + (enDirect ? 'Ta zone réservée en ce moment' : 'Ta zone réservée pour cette période') + ' : ' + detail
                + '<div class="board-prefs__note">' + (enDirect
                    ? 'Le tirage suit le classement en direct : si tu sors des ' + esc(rangsTxt) + ', ta zone passe au suivant.'
                    : 'Ton top sert au tirage de la prochaine période.') + '</div></div>';
        } else {
            mine = '<div class="board-prefs__mine board-prefs__mine--none">Tu es <strong>' + ordinal(moi.rang) + '</strong> : ' + (enDirect
                ? 'plus aucune zone libre pour toi en ce moment.'
                : 'pas de zone sur cette période, ton top servira au prochain tirage.') + '</div>';
        }
        if (mineEl) mineEl.innerHTML = mine;

        /* Mon top : N cases */
        var slots = '';
        for (var i = 0; i < prefMax; i++) {
            var z = myTop[i];
            if (!z) {
                slots += '<li class="top-slot top-slot--vide"><span class="top-slot__num">' + (i + 1) + '</span><span class="top-slot__nom">Ajoute une zone depuis la liste</span></li>';
                continue;
            }
            var mienne = mesResas.some(function (r) { return r.zone_id === z.id; });
            var par = mienne ? '' : choisiePar(z.id);
            slots += '<li class="top-slot' + (mienne ? ' top-slot--mienne' : '') + '">'
                + '<span class="top-slot__num">' + (i + 1) + '</span>'
                + '<span class="top-slot__nom notranslate">' + esc(z.nom)
                    + (z.sous_titre ? ' <span class="pref-row__lvl">' + esc(z.sous_titre) + '</span>' : '')
                    + (mienne ? ' <span class="top-slot__tag top-slot__tag--ok">ta zone</span>' : '')
                    + (par ? ' <span class="top-slot__tag">choisie par ' + esc(par) + '</span>' : '')
                + '</span>'
                + '<span class="top-slot__actions">'
                    + '<button type="button" class="pref-row__btn" data-action="up" data-i="' + i + '" title="Monter"' + (i === 0 ? ' disabled' : '') + '>&#9650;</button>'
                    + '<button type="button" class="pref-row__btn" data-action="down" data-i="' + i + '" title="Descendre"' + (i === myTop.length - 1 ? ' disabled' : '') + '>&#9660;</button>'
                    + '<button type="button" class="pref-row__btn pref-row__btn--del" data-action="retirer" data-i="' + i + '" title="Retirer de mon top">&#10005;</button>'
                + '</span>'
                + '</li>';
        }
        topEl.innerHTML = '<div class="board-top__head"><strong>Mon top ' + prefMax + '</strong><span class="text-muted">' + myTop.length + ' / ' + prefMax + '</span></div>'
            + '<ol class="board-top__slots">' + slots + '</ol>';

        /* La liste des zones, filtree par la recherche */
        var filterEl = document.getElementById('board-prefs-filter');
        var q = normTxt(filterEl ? filterEl.value.trim() : '');
        var plein = myTop.length >= prefMax;
        var html = '';
        allZones.forEach(function (zz) {
            if (q && normTxt(zz.nom + ' ' + (zz.sous_titre || '')).indexOf(q) === -1) return;
            var pos = myTop.indexOf(zz);
            var parZ = pos >= 0 ? '' : choisiePar(zz.id);
            html += '<div class="pref-row' + (pos >= 0 ? ' pref-row--choisie' : '') + '">'
                + '<span class="pref-row__nom notranslate">' + esc(zz.nom)
                    + (zz.sous_titre ? ' <span class="pref-row__lvl">' + esc(zz.sous_titre) + '</span>' : '')
                    + (zz.categorie === 'secondaire' ? ' <span class="pref-row__cat">2nd</span>' : '')
                + '</span>'
                + (parZ ? '<span class="pref-row__occ">choisie par ' + esc(parZ) + '</span>' : '')
                + (pos >= 0
                    ? '<span class="pref-row__pos">n°' + (pos + 1) + ' de ton top</span>'
                    : '<button type="button" class="btn btn--secondary btn--small pref-row__add" data-action="ajouter" data-zone="' + zz.id + '"'
                        + (plein ? ' disabled title="Ton top est complet : retire une zone d\'abord"' : '') + '>+ Ajouter</button>')
                + '</div>';
        });
        listEl.innerHTML = html || '<p class="text-muted" style="padding:var(--spacing-sm);">Aucune zone ne correspond à ta recherche.</p>';

        if (saveBtn) saveBtn.hidden = !prefsDirty;
        if (resetBtn) resetBtn.disabled = !myTop.length;
        bindPrefsControls();
    }

    var prefsControlsBound = false;
    function bindPrefsControls() {
        if (prefsControlsBound) return;
        prefsControlsBound = true;

        var listEl = document.getElementById('board-prefs-list');
        var topEl = document.getElementById('board-prefs-top');
        var filterInput = document.getElementById('board-prefs-filter');
        var saveBtn = document.getElementById('board-prefs-save');
        var resetBtn = document.getElementById('board-prefs-reset');

        if (saveBtn) saveBtn.addEventListener('click', savePrefs);
        if (resetBtn) resetBtn.addEventListener('click', function () {
            if (!myTop.length) return;
            myTop = [];
            prefsDirty = true;
            renderPrefs();
        });
        if (filterInput) filterInput.addEventListener('input', renderPrefs);

        /* + Ajouter : la zone prend la premiere case libre du top */
        if (listEl) listEl.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-action="ajouter"]');
            if (!btn || btn.disabled) return;
            var id = parseInt(btn.dataset.zone, 10);
            var z = null;
            allZones.forEach(function (x) { if (x.id === id) z = x; });
            if (!z || myTop.indexOf(z) !== -1 || myTop.length >= prefMax) return;
            myTop.push(z);
            prefsDirty = true;
            renderPrefs();
        });

        /* Monter, descendre, retirer dans le top */
        if (topEl) topEl.addEventListener('click', function (e) {
            var btn = e.target.closest('.pref-row__btn');
            if (!btn || btn.disabled) return;
            var i = parseInt(btn.dataset.i, 10);
            var action = btn.dataset.action;
            if (action === 'up' && i > 0) {
                var tmp = myTop[i - 1]; myTop[i - 1] = myTop[i]; myTop[i] = tmp;
            } else if (action === 'down' && i < myTop.length - 1) {
                var tmp2 = myTop[i + 1]; myTop[i + 1] = myTop[i]; myTop[i] = tmp2;
            } else if (action === 'retirer') {
                myTop.splice(i, 1);
            } else {
                return;
            }
            prefsDirty = true;
            renderPrefs();
        });
    }

    async function savePrefs() {
        var saveBtn = document.getElementById('board-prefs-save');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Enregistrement...'; }
        try {
            var me = window.REN.currentProfile.id;
            var del = await window.REN.supabase.from('perco_preferences').delete().eq('user_id', me);
            if (del.error) throw del.error;
            if (myTop.length) {
                var rows = myTop.map(function (z, i) { return { user_id: me, zone_id: z.id, ordre: i + 1 }; });
                var ins = await window.REN.supabase.from('perco_preferences').insert(rows);
                if (ins.error) throw ins.error;
            }
            myPrefs = myTop.map(function (z) { return { zone_id: z.id, nom: z.nom, sous_titre: z.sous_titre || '' }; });
            prefsDirty = false;

            var enDirect = periodeEnDirect();
            if (enDirect) {
                /* Tirage en direct : on recharge pour montrer tout de suite l'effet */
                await loadReservations();
                renderTable();
            }
            renderPrefs();
            window.REN.toast(myTop.length
                ? (enDirect ? 'Ton top est enregistré, le tirage en tient compte tout de suite.' : 'Ton top est enregistré, il servira au prochain tirage.')
                : 'Ton top est vidé : si tu as droit à une zone, tu en recevras une par défaut.', 'success');
        } catch (err) {
            console.error('[REN-BOARD] Erreur sauvegarde préférences:', err);
            window.REN.toast('Erreur : ' + err.message, 'error');
        } finally {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Enregistrer mon top'; }
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
