/* ============================================ */
/* Redemption     - Accueil (Dashboard)          */
/* Stats, activite recente, systeme de points  */
/* ============================================ */
(function () {
    'use strict';

    document.addEventListener('ren:ready', init);

    async function init() {
        if (!window.REN.supabase || !window.REN.currentProfile) return;
        loadDashboardStats();
        loadMyRank();
        loadActivityFeed();
        setupPointsModal();
        // Scroll vers changelog si #changelog dans l'URL
        if (window.location.hash === '#changelog') {
            setTimeout(function () {
                var el = document.getElementById('changelog');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }

    /* === DASHBOARD STATS === */
    async function loadDashboardStats() {
        try {
            var { data, error } = await window.REN.supabase.rpc('get_dashboard_stats');
            if (error) throw error;

            var stats = typeof data === 'string' ? JSON.parse(data) : data;

            setStatValue('stat-kamas', window.REN.formatKamas(stats.total_kamas));
            setStatValue('stat-attaques', window.REN.formatNumber(stats.nb_attaques));
            setStatValue('stat-winrate-atk', stats.winrate_attaque + '%');
            setStatValue('stat-winrate-def', stats.winrate_defense + '%');
            setStatValue('stat-defenses', window.REN.formatNumber(stats.nb_defenses));
            setStatValue('stat-menace', stats.menace_nom);
        } catch (err) {
            console.error('[REN] Erreur dashboard stats:', err);
        }
    }

    function setStatValue(id, value) {
        var el = document.getElementById(id);
        if (!el) return;
        var valueEl = el.querySelector('.stat-card__value');
        if (!valueEl) return;

        /* Si l'element a data-counter, on anime le chiffre */
        if (valueEl.hasAttribute('data-counter')) {
            animateCounter(valueEl, value);
        } else {
            valueEl.textContent = value;
        }
    }

    /**
     * Anime un compteur de 0 vers la valeur finale
     * Supporte : "1 234", "56%", "1.2M K", etc.
     */
    function animateCounter(el, finalText) {
        var str = String(finalText);
        /* Extraire le nombre et le suffixe */
        var match = str.match(/^([0-9\s.,]+)(.*)/);
        if (!match) {
            el.textContent = finalText;
            return;
        }

        var numStr = match[1].trim();
        var suffix = match[2] || '';
        var cleanNum = numStr.replace(/\s/g, '').replace(',', '.');
        var target = parseFloat(cleanNum);

        if (isNaN(target) || target === 0) {
            el.textContent = finalText;
            return;
        }

        var duration = 1200;
        var startTime = null;
        var isDecimal = numStr.indexOf(',') !== -1 || numStr.indexOf('.') !== -1;
        var hasSpaces = numStr.indexOf(' ') !== -1;

        function formatAnimValue(val) {
            if (isDecimal) {
                var formatted = val.toFixed(1);
            } else {
                var formatted = Math.round(val).toString();
            }
            /* Remettre les espaces milliers si l'original en avait */
            if (hasSpaces && !isDecimal) {
                formatted = Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
            }
            return formatted + suffix;
        }

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            /* easeOutExpo pour un effet de ralentissement naturel */
            var eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            var current = eased * target;
            el.textContent = formatAnimValue(current);
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                /* Valeur finale exacte */
                el.textContent = finalText;
            }
        }

        requestAnimationFrame(step);
    }

    /* === MON RANG === */
    async function loadMyRank() {
        var container = document.getElementById('my-rank');
        if (!container) return;

        try {
            var { data, error } = await window.REN.supabase.rpc('get_member_stats');
            if (error) throw error;

            var userId = window.REN.currentUser.id;
            var me = (data || []).find(function (m) { return m.user_id === userId; });

            if (!me) {
                container.innerHTML = '<p class="text-muted" style="padding:1rem;">Aucune donnee disponible.</p>';
                return;
            }

            var totalPoints = me.total_points || 0;
            var tier = window.REN.getTierFromPoints(totalPoints);
            var tiersAsc = window.REN.TIERS_ASC;
            var currentIdx = -1;
            for (var i = 0; i < tiersAsc.length; i++) {
                if (tiersAsc[i].key === tier.key) { currentIdx = i; break; }
            }
            var nextTier = currentIdx < tiersAsc.length - 1 ? tiersAsc[currentIdx + 1] : null;

            var totalCombats = (me.total_attaques || 0) + (me.total_defenses || 0);
            var totalVictoires = (me.victoires_attaque || 0) + (me.victoires_defense || 0);
            /* Winrate : combats équilibrés uniquement (1v1, 2v2...) */
            var eqCombats = me.eq_attaques != null ? (me.eq_attaques || 0) + (me.eq_defenses || 0) : totalCombats;
            var eqVictoires = me.eq_attaques != null ? (me.eq_victoires_attaque || 0) + (me.eq_victoires_defense || 0) : totalVictoires;
            var winrate = eqCombats > 0 ? Math.round(eqVictoires / eqCombats * 100) : 0;

            var html = '<div class="dashboard-rank">';

            /* Avatar frame */
            html += '<div class="dashboard-rank__frame">';
            html += window.REN.buildAvatarFrame(me.avatar_url, totalPoints);
            html += '</div>';

            /* Info */
            html += '<div class="dashboard-rank__info">';
            html += '<div class="dashboard-rank__header">';
            html += '<span class="dashboard-rank__name">' + me.username + '</span>';
            html += '</div>';
            html += '<div class="dashboard-rank__detail"><span class="dashboard-rank__label">Ornement :</span> <span class="tier-badge tier-badge--' + tier.key + '">' + tier.name + '</span></div>';
            html += '<div class="dashboard-rank__detail"><span class="dashboard-rank__label">Titre :</span> ' + tier.title + '</div>';

            /* Mini stats inline */
            html += '<div class="dashboard-rank__mini-stats">';
            html += '<span><span class="dashboard-rank__label">Points</span> ' + totalPoints + '</span>';
            html += '<span class="dashboard-rank__sep">&bull;</span>';
            html += '<span><span class="dashboard-rank__label">Combats</span> ' + totalCombats + '</span>';
            html += '<span class="dashboard-rank__sep">&bull;</span>';
            html += '<span><span class="dashboard-rank__label">Winrate</span> <span class="' + (winrate >= 50 ? 'text-success' : 'text-danger') + '">' + winrate + '%</span></span>';
            html += '</div>';

            /* Progress bar */
            if (nextTier) {
                var progress = Math.min(100, Math.round((totalPoints - tier.min) / (nextTier.min - tier.min) * 100));
                html += '<div class="dashboard-rank__progress">';
                html += '<div class="profil-progression__bar">';
                html += '<div class="profil-progression__bar-fill profil-progression__bar-fill--' + nextTier.key + '" style="width:' + progress + '%"></div>';
                html += '</div>';
                html += '<span class="dashboard-rank__next">Prochain palier de recompense : <strong>' + nextTier.name + '</strong> (' + totalPoints + ' / ' + nextTier.min + ' pts)</span>';
                html += '</div>';
            } else {
                html += '<div class="dashboard-rank__max">&#11088; Rang maximum atteint !</div>';
            }

            html += '</div>'; /* rank__info */
            html += '</div>'; /* dashboard-rank */

            container.innerHTML = html;

        } catch (err) {
            console.error('[REN] Erreur rang dashboard:', err);
            container.innerHTML = '<p class="text-muted" style="padding:1rem;">Erreur de chargement.</p>';
        }
    }

    /* === ACTIVITY FEED === */
    async function loadActivityFeed() {
        var feedContainer = document.getElementById('activity-feed');
        if (!feedContainer) return;

        try {
            var { data: combats, error } = await window.REN.supabase
                .from('combats')
                .select('*, auteur:profiles!auteur_id(username), alliance:alliances(nom, tag), participants:combat_participants(user:profiles(username))')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            if (!combats || combats.length === 0) {
                feedContainer.innerHTML = '<div class="activity"><p class="text-muted" style="padding: 1rem;">Aucune activite pour le moment. Declarez votre premiere attaque !</p></div>';
                return;
            }

            var html = '<div class="activity">';

            combats.forEach(function (c) {
                var badgeClass = c.resultat === 'victoire' ? 'badge--victoire' : 'badge--defaite';
                var badgeText = c.resultat === 'victoire' ? 'VICTOIRE' : 'DEFAITE';
                var auteurName = c.auteur ? c.auteur.username : 'Inconnu';
                var mates = [];
                if (c.participants) {
                    c.participants.forEach(function (p) {
                        if (p.user && p.user.username !== auteurName) {
                            mates.push(p.user.username);
                        }
                    });
                }
                var matesStr = mates.length > 0 ? ' <span class="text-muted">(avec ' + mates.map(function(m) { return '<span class="highlight">' + m + '</span>'; }).join(', ') + ')</span>' : '';
                if (c.invites && c.invites.length) {
                    matesStr += ' <span class="text-muted">(+ invités : ' + c.invites.map(function (n) { return window.REN.escapeHtml(n); }).join(', ') + ')</span>';
                }
                var actionType = c.type === 'attaque' ? 'une Attaque' : 'une Defense';
                var actionVerb = c.resultat === 'victoire' ? 'a remporte' : 'a perdu';
                var allianceName = c.alliance ? '<strong>' + c.alliance.nom + (c.alliance.tag ? ' [' + c.alliance.tag + ']' : '') + '</strong>' : (c.alliance_ennemie_nom || 'Inconnu');
                var butinStr = c.type === 'attaque' && c.butin_kamas > 0 ? ' &mdash; Butin : <span class="kamas">' + window.REN.formatKamas(c.butin_kamas) + '</span>' : '';
                var pointsStr = c.points_gagnes !== 0 ? ' &mdash; <span class="' + (c.points_gagnes > 0 ? 'text-success' : 'text-danger') + '">' + (c.points_gagnes > 0 ? '+' : '') + c.points_gagnes + ' pts</span>' : '';

                var preuvesStr = '';
                [c.preuve_url_1, c.preuve_url_2].forEach(function (u, idx) {
                    if (!u) return;
                    var su = window.REN.sanitizeUrl ? window.REN.sanitizeUrl(u) : u;
                    preuvesStr += ' <a class="activity__preuve js-lightbox" href="' + su + '" target="_blank" rel="noopener" title="Voir le screenshot ' + (idx + 1) + '">&#128247;' + (idx + 1) + '</a>';
                });

                var formatBadge = (c.nb_allies && c.nb_ennemis) ? '<span class="badge badge--format">' + c.nb_allies + 'v' + c.nb_ennemis + '</span>' : '';
                html += '<div class="activity__item">';
                html += '<div class="activity__text"><span class="badge ' + badgeClass + '">' + badgeText + '</span>' + formatBadge;
                html += '<strong>' + auteurName + '</strong>' + matesStr + ' ' + actionVerb + ' ' + actionType + ' contre ' + allianceName + butinStr + pointsStr + preuvesStr;
                html += '</div>';
                html += '<span class="activity__time">' + window.REN.formatDate(c.created_at) + '</span>';
                html += '</div>';
            });

            html += '</div>';
            feedContainer.innerHTML = html;

        } catch (err) {
            console.error('[REN] Erreur activity feed:', err);
            feedContainer.innerHTML = '<div class="activity"><p class="text-muted" style="padding: 1rem;">Erreur de chargement.</p></div>';
        }
    }

    /* === MODAL SYSTEME DE POINTS === */
    function setupPointsModal() {
        var btn = document.getElementById('system-points-btn');
        var overlay = document.getElementById('modal-points');
        var closeBtn = document.getElementById('modal-points-close');

        if (!btn || !overlay) return;

        btn.addEventListener('click', function () {
            overlay.classList.add('active');
            loadPointsBareme();
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                overlay.classList.remove('active');
            });
        }

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    }

    async function loadPointsBareme() {
        var content = document.getElementById('modal-points-content');
        if (!content) return;

        try {
            var { data: bareme, error } = await window.REN.supabase
                .from('bareme_points').select('*').order('nb_allies').order('nb_ennemis');

            if (error) throw error;

            var html = '<p class="text-muted" style="font-size:0.8125rem;margin-bottom:var(--spacing-md);">Chaque participant touche les points de la case correspondant au nombre d\'alliés et d\'ennemis du combat.</p>';

            /* Legende */
            html += '<div class="bareme-legend">'
                  + '<span class="bareme-legend__item"><span class="bareme-legend__swatch bareme-legend__swatch--gain"></span>Points gagnés en victoire, plus la case est claire plus ça rapporte</span>'
                  + '<span class="bareme-legend__item"><span class="bareme-legend__swatch bareme-legend__swatch--perte">-1</span>Points perdus en défaite, seulement quand il y en a</span>'
                  + '<span class="bareme-legend__item"><span class="bareme-legend__swatch bareme-legend__swatch--eq"></span>Combat équilibré (autant d\'alliés que d\'ennemis)</span>'
                  + '</div>';

            html += buildBaremeHeatmap(bareme, 'attaque', 'Attaque', ICON_SWORD);
            html += buildBaremeHeatmap(bareme, 'defense', 'Défense', ICON_SHIELD);

            /* Multiplicateurs d'alliance : on ne liste que ceux qui changent quelque chose */
            var { data: alliances } = await window.REN.supabase.from('alliances').select('nom, tag, multiplicateur').order('nom');
            var bonus = (alliances || []).filter(function (a) { return Number(a.multiplicateur) !== 1; });
            html += '<div class="bareme-section__head" style="margin-top:var(--spacing-xl);">'
                  + '<h3 class="bareme-section__title">Multiplicateurs d\'alliance</h3>'
                  + '<span class="text-muted bareme-section__sub">S\'appliquent aux points gagnés en victoire</span>'
                  + '</div>';
            if (!bonus.length) {
                html += '<p class="text-muted" style="font-size:0.8125rem;">Aucun multiplicateur actif pour le moment : toutes les alliances sont à x1.</p>';
            } else {
                html += '<div class="bareme-multis">';
                bonus.forEach(function (a) {
                    html += '<span class="bareme-multi"><span class="bareme-multi__nom">' + window.REN.escapeHtml(a.nom) + (a.tag ? ' [' + window.REN.escapeHtml(a.tag) + ']' : '') + '</span><span class="bareme-multi__val">x' + a.multiplicateur + '</span></span>';
                });
                html += '</div>';
            }

            content.innerHTML = html;

        } catch (err) {
            console.error('[REN] Erreur bareme:', err);
            content.innerHTML = '<p class="text-muted">Erreur de chargement du barème.</p>';
        }
    }

    var ICON_SWORD = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/></svg>';
    var ICON_SHIELD = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';

    /* Grille chauffee : le gain en gros, colore selon son intensite (relative au
       maximum du bareme), la perte seulement quand elle existe, la diagonale
       (combats equilibres) encadree. Remplace l'ancien tableau « +X / 0 ». */
    function buildBaremeHeatmap(bareme, type, label, icon) {
        var filtered = (bareme || []).filter(function (b) { return b.type === type; });
        var max = 0;
        filtered.forEach(function (b) { if (b.points_victoire > max) max = b.points_victoire; });
        if (!max) max = 1;

        var html = '<div class="bareme-section">';
        html += '<div class="bareme-section__head">'
              + '<h3 class="bareme-section__title">' + icon + label + '</h3>'
              + '<span class="text-muted bareme-section__sub">Alliés en lignes, ennemis en colonnes</span>'
              + '</div>';
        html += '<div class="bareme-heat-wrap"><div class="bareme-heat">';

        /* En-tete : coin + colonnes ennemis */
        html += '<div class="bareme-heat__corner"><span>Alliés</span><span>Ennemis</span></div>';
        for (var e = 1; e <= 5; e++) {
            html += '<div class="bareme-heat__col">' + e + '<small>enn.</small></div>';
        }

        for (var a = 1; a <= 5; a++) {
            html += '<div class="bareme-heat__row">' + a + '<small>alli' + (a > 1 ? 'és' : 'é') + '</small></div>';
            for (var ee = 1; ee <= 5; ee++) {
                var cell = filtered.find(function (b) { return b.nb_allies === a && b.nb_ennemis === ee; });
                var pv = cell ? cell.points_victoire : 0;
                var pd = cell ? cell.points_defaite : 0;
                var ratio = pv / max;
                var cls = 'bareme-heat__cell' + (a === ee ? ' bareme-heat__cell--eq' : '') + (pv === 0 ? ' bareme-heat__cell--zero' : '');
                html += '<div class="' + cls + '" style="--heat:' + ratio.toFixed(2) + ';" title="' + a + ' contre ' + ee + ' : +' + pv + ' en victoire' + (pd ? ', -' + pd + ' en défaite' : '') + '">'
                      + '<span class="bareme-heat__gain">' + (pv > 0 ? '+' + pv : '0') + '</span>'
                      + (pd ? '<span class="bareme-heat__perte">-' + pd + '</span>' : '')
                      + '</div>';
            }
        }

        html += '</div></div></div>';
        return html;
    }
    window.REN.buildBaremeHeatmap = buildBaremeHeatmap;
})();
