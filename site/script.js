/* ============================================ */
/* Redemption     - Script principal              */
/* Supabase init, auth guard, nav, utils        */
/* ============================================ */
(function () {
    'use strict';

    /* === CONFIG SUPABASE === */
    /* TODO : remplacer par l'URL et la cle anon du            */
    /* nouveau projet Supabase (Dashboard > Settings > API)    */
    /* Tant que c'est un placeholder, le site affiche une page */
    /* vide : c'est voulu, voir INSTALLATION.md                */
    const SUPABASE_URL = 'https://yebfbdgxikbnqdkbycam.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_2bEkqhNcB3JXYG1yQ7pivg_T__Q5OIq';

    let supabaseClient = null;
    if (window.supabase && SUPABASE_URL !== 'VOTRE_SUPABASE_URL') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    /* === EXPOSE GLOBAL === */
    window.REN = {
        supabase: supabaseClient,
        currentUser: null,
        currentProfile: null,
        isReady: false
    };

    /* === CONSTANTES === */
    const MOBILE_BREAKPOINT = 768;
    const PAGES = ['accueil', 'attaque', 'defense', 'classement', 'historique', 'membres', 'builds', 'jeux', 'recyclages', 'fm', 'matchmaking'];
    const AUTH_PAGE = 'connexion.html';
    const ADMIN_PAGE = 'admin.html';

    /* === SELECTEURS === */
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const nav = document.querySelector('.nav');
    const navUsername = document.getElementById('nav-username');
    const navAdminLink = document.getElementById('nav-admin-link');
    const btnLogout = document.getElementById('btn-logout');
    const footerMemberCount = document.getElementById('footer-member-count');

    /* === AUTH GUARD === */
    async function checkAuth() {
        if (!window.REN.supabase) {
            console.warn('[REN] Supabase non configure. Mode demo.');
            window.REN.isReady = true;
            document.dispatchEvent(new Event('ren:ready'));
            return;
        }

        const currentPage = getCurrentPage();
        const isAuthPage = currentPage === 'connexion';
        const isAdminPage = currentPage === 'admin';

        try {
            const { data: { session } } = await window.REN.supabase.auth.getSession();

            if (!session && !isAuthPage) {
                window.location.href = AUTH_PAGE;
                return;
            }

            if (session && isAuthPage) {
                window.location.href = 'index.html';
                return;
            }

            if (session) {
                window.REN.currentUser = session.user;

                const { data: profile } = await window.REN.supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                window.REN.currentProfile = profile;

                /* Arrivee via Discord : pseudo encore placeholder -> demander le pseudo IG */
                if (profile && isPlaceholderUsername(profile) && !isAuthPage) {
                    showPseudoOnboarding();
                    return;
                }

                if (profile && !profile.is_validated && !isAuthPage) {
                    showPendingValidation();
                    return;
                }

                if (isAdminPage && profile && !profile.is_admin) {
                    window.location.href = 'index.html';
                    return;
                }

                updateNavUser(profile);
                updateMemberCount();
                initMatchmakingWatch();
            }
        } catch (err) {
            console.error('[REN] Erreur auth:', err);
        }

        window.REN.isReady = true;
        document.dispatchEvent(new Event('ren:ready'));
    }

    /* === NAV === */
    function getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop().replace('.html', '');
        if (!filename || filename === 'index') return 'accueil';
        return filename;
    }

    function setActiveNav() {
        const currentPage = getCurrentPage();
        const links = document.querySelectorAll('.nav__link');
        links.forEach(function (link) {
            const page = link.getAttribute('data-page');
            if (page === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    function updateNavUser(profile) {
        if (navUsername && profile) {
            navUsername.textContent = profile.username;
            navUsername.style.cursor = 'pointer';
            navUsername.addEventListener('click', function () {
                window.location.href = 'profil.html';
            });
        }
        if (navAdminLink) {
            navAdminLink.style.display = (profile && profile.is_admin) ? '' : 'none';
        }
        /* Synchroniser les éléments user de la sidebar (desktop) */
        const appUsername = document.getElementById('app-username');
        if (appUsername && profile) {
            appUsername.textContent = profile.username;
        }
        if (navUsername) navUsername.title = 'Mon profil';
        /* Avatar : photo Discord si le profil en a une, sinon l'initiale.
           L'image est creee par le DOM (pas de innerHTML) : l'URL est une
           donnee saisie par le membre. */
        const appAvatar = document.getElementById('app-avatar');
        if (appAvatar && profile) {
            appAvatar.textContent = '';
            if (profile.avatar_url) {
                const img = document.createElement('img');
                img.alt = '';
                img.loading = 'lazy';
                img.onerror = function () { appAvatar.textContent = (profile.username || '?').charAt(0).toUpperCase(); };
                img.src = profile.avatar_url;
                appAvatar.appendChild(img);
            } else {
                appAvatar.textContent = (profile.username || '?').charAt(0).toUpperCase();
            }
        }
        const appAdminLink = document.getElementById('app-admin-link');
        if (appAdminLink) {
            appAdminLink.style.display = (profile && profile.is_admin) ? '' : 'none';
        }
        updatePendingBadge(profile);
    }

    /* Badge rouge sur les liens Admin : inscriptions en attente de validation */
    async function updatePendingBadge(profile) {
        if (!profile || !profile.is_admin || !window.REN.supabase) return;
        try {
            var res = await window.REN.supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('is_validated', false);
            var n = res.count || 0;
            ['nav-admin-link', 'app-admin-link'].forEach(function (id) {
                var el = document.getElementById(id);
                if (!el) return;
                var old = el.querySelector('.notif-badge');
                if (old) old.remove();
                if (n > 0) {
                    var b = document.createElement('span');
                    b.className = 'notif-badge';
                    b.textContent = n > 9 ? '9+' : n;
                    el.appendChild(b);
                }
            });
        } catch (e) { /* silencieux */ }
    }

    async function updateMemberCount() {
        /* Sidebar publique (injectee) + footer admin */
        var sidebarCount = document.getElementById('app-member-count');
        if ((!footerMemberCount && !sidebarCount) || !window.REN.supabase) return;
        try {
            const { count } = await window.REN.supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('is_validated', true);
            if (count !== null) {
                var label = count + (count > 1 ? ' Membres Inscrits' : ' Membre Inscrit');
                if (footerMemberCount) footerMemberCount.textContent = label;
                if (sidebarCount) sidebarCount.textContent = label;
            }
        } catch (err) {
            /* ignore */
        }
    }

    /* === MOBILE MENU === */
    function initMobileMenu() {
        if (!navToggle || !nav) return;

        navToggle.addEventListener('click', function () {
            navToggle.classList.toggle('active');
            nav.classList.toggle('active');
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
        });

        if (navMenu) {
            navMenu.addEventListener('click', function (e) {
                if (e.target.classList.contains('nav__link')) {
                    navToggle.classList.remove('active');
                    nav.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
    }

    /* === LOGOUT === */
    function initLogout() {
        if (!btnLogout) return;
        btnLogout.addEventListener('click', async function () {
            if (window.REN.supabase) {
                await window.REN.supabase.auth.signOut();
            }
            window.location.href = AUTH_PAGE;
        });
    }

    /* === ONBOARDING PSEUDO (arrivee via Discord) === */
    function isPlaceholderUsername(profile) {
        return !!(profile && profile.username === 'user_' + String(profile.id).slice(0, 8));
    }

    function showPseudoOnboarding() {
        var classes = ['Cra', 'Ecaflip', 'Eliotrope', 'Eniripsa', 'Enutrof', 'Feca', 'Forge', 'Huppermage', 'Iop', 'Osamodas', 'Ouginak', 'Pandawa', 'Roublard', 'Sacrieur', 'Sadida', 'Sram', 'Steamer', 'Xelor', 'Zobal'];
        var elements = ['Terre', 'Feu', 'Eau', 'Air', 'Multi', 'Do Pou', 'Do Cri'];
        var opt = function (arr) { return '<option value="">Choisir...</option>' + arr.map(function (x) { return '<option value="' + x + '">' + x + '</option>'; }).join(''); };
        document.body.innerHTML = '\
            <div class="pending-validation">\
                <div class="pending-validation__icon">&#128100;</div>\
                <h1 class="pending-validation__title">Bienvenue sur Redemption</h1>\
                <p class="pending-validation__text">Tu es connecte via Discord. Indique ton personnage principal et tes mules pour finaliser ton compte.</p>\
                <div id="onboard-msg" class="auth-message" style="max-width:420px;margin:0 auto 12px;"></div>\
                <div style="max-width:420px;margin:0 auto;text-align:left;">\
                    <div class="form-group"><label class="form-label" for="onboard-pseudo">Pseudo du personnage principal *</label><input type="text" id="onboard-pseudo" class="form-input" placeholder="Ton pseudo Dofus" maxlength="30" autocomplete="off"></div>\
                    <div class="form-row">\
                        <div class="form-group"><label class="form-label" for="onboard-classe">Classe</label><select id="onboard-classe" class="form-select">' + opt(classes) + '</select></div>\
                        <div class="form-group"><label class="form-label" for="onboard-element">Element</label><select id="onboard-element" class="form-select">' + opt(elements) + '</select></div>\
                    </div>\
                    <div class="form-group">\
                        <label class="form-label">Mules (optionnel)</label>\
                        <div id="onboard-mules"></div>\
                        <button type="button" class="btn btn--secondary btn--small" id="onboard-add-mule">+ Ajouter une mule</button>\
                    </div>\
                    <div class="form-group"><label class="form-label" for="onboard-dofusbook">Lien Dofusbook (optionnel)</label><input type="url" id="onboard-dofusbook" class="form-input" placeholder="https://www.dofusbook.net/..."></div>\
                    <button class="btn btn--primary" id="onboard-submit" style="width:100%;">Valider mon compte</button>\
                    <button class="btn btn--secondary mt-lg" id="onboard-logout" style="width:100%;">Se deconnecter</button>\
                </div>\
            </div>';

        var msg = document.getElementById('onboard-msg');
        var mulesWrap = document.getElementById('onboard-mules');

        function addMuleRow() {
            var row = document.createElement('div');
            row.className = 'onboard-mule-row';
            row.style.cssText = 'display:flex;gap:6px;align-items:center;margin-bottom:6px;';
            row.innerHTML = '\
                <input type="text" class="form-input mule-name" placeholder="Nom de la mule" maxlength="30" autocomplete="off" style="flex:2;">\
                <select class="form-select mule-classe" style="flex:1.3;">' + opt(classes) + '</select>\
                <select class="form-select mule-element" style="flex:1;">' + opt(elements) + '</select>\
                <button type="button" class="btn btn--small mule-remove" title="Retirer" style="background:var(--color-danger);color:#fff;flex-shrink:0;">&times;</button>';
            mulesWrap.appendChild(row);
        }
        document.getElementById('onboard-add-mule').addEventListener('click', addMuleRow);
        mulesWrap.addEventListener('click', function (e) {
            var rm = e.target.closest('.mule-remove');
            if (rm) rm.closest('.onboard-mule-row').remove();
        });

        document.getElementById('onboard-logout').addEventListener('click', async function () {
            try { await window.REN.supabase.auth.signOut(); } catch (e) { /* ignore */ }
            window.location.href = 'connexion.html';
        });
        document.getElementById('onboard-submit').addEventListener('click', async function () {
            var btn = this;
            var pseudo = document.getElementById('onboard-pseudo').value.trim();
            var classe = document.getElementById('onboard-classe').value || null;
            var element = document.getElementById('onboard-element').value || null;
            var dofusbook = document.getElementById('onboard-dofusbook').value.trim() || null;
            if (pseudo.length < 2 || pseudo.length > 30) {
                msg.className = 'auth-message auth-message--error'; msg.textContent = 'Le pseudo doit faire entre 2 et 30 caracteres.'; return;
            }
            /* Collecte des mules */
            var mules = [];
            var mulesInfos = {};
            var rows = mulesWrap.querySelectorAll('.onboard-mule-row');
            for (var i = 0; i < rows.length; i++) {
                var nm = rows[i].querySelector('.mule-name').value.trim();
                if (!nm) continue;
                if (nm.length > 30) { msg.className = 'auth-message auth-message--error'; msg.textContent = 'Nom de mule trop long (max 30).'; return; }
                var mc = rows[i].querySelector('.mule-classe').value || null;
                var me = rows[i].querySelector('.mule-element').value || null;
                mules.push(nm);
                mulesInfos[nm] = { classe: mc, elements: me ? [me] : [] };
            }

            btn.disabled = true; btn.textContent = 'Validation...';
            try {
                var res = await window.REN.supabase.rpc('claim_pseudo', { p_username: pseudo, p_classe: classe, p_element: element, p_dofusbook: dofusbook });
                if (res.error) throw res.error;
                var data = res.data || {};
                if (!data.ok) {
                    var m = 'Erreur.';
                    if (data.error === 'taken') m = 'Ce pseudo est deja pris. Choisis-en un autre, ou contacte un admin si c\'est bien le tien.';
                    else if (data.error === 'bad_length') m = 'Le pseudo doit faire entre 2 et 30 caracteres.';
                    else if (data.error === 'bad_chars') m = 'Le pseudo contient des caracteres non autorises.';
                    else if (data.error === 'already_claimed') { window.location.reload(); return; }
                    msg.className = 'auth-message auth-message--error'; msg.textContent = m;
                    btn.disabled = false; btn.textContent = 'Valider mon compte';
                    return;
                }
                /* Enregistrement des mules (non bloquant : modifiable ensuite dans le profil) */
                if (mules.length) {
                    var uid = (window.REN.currentProfile && window.REN.currentProfile.id) || (window.REN.currentUser && window.REN.currentUser.id);
                    if (uid) {
                        try { await window.REN.supabase.from('profiles').update({ mules: mules, mules_infos: mulesInfos }).eq('id', uid); } catch (e) { /* non bloquant */ }
                    }
                }
                window.location.reload();
            } catch (e) {
                msg.className = 'auth-message auth-message--error'; msg.textContent = 'Erreur : ' + (e.message || e);
                btn.disabled = false; btn.textContent = 'Valider mon compte';
            }
        });
    }

    /* === PENDING VALIDATION === */
    function showPendingValidation() {
        document.body.innerHTML = '\
            <div class="pending-validation">\
                <div class="pending-validation__icon">&#9203;</div>\
                <h1 class="pending-validation__title">Compte en attente</h1>\
                <p class="pending-validation__text">\
                    Votre compte a bien ete cree. Un administrateur doit valider votre acces avant que vous puissiez utiliser le site.\
                </p>\
                <button class="btn btn--secondary mt-lg" onclick="window.location.href=\'connexion.html\'">\
                    Se deconnecter\
                </button>\
            </div>';
    }

    /* === TOAST SYSTEM === */
    /* Traduit un echec de l'analyse par vision (edge function extract-runes)
       en message comprehensible. Avant, credits API epuises, session expiree
       et capture illisible affichaient tous le meme « Echec analyse ». */
    window.REN.expliquerErreurVision = function (err) {
        var msg = String((err && err.message) || '');
        var detail = String((err && err.detail) || '');
        var status = (err && err.status) || 0;
        var tout = (msg + ' ' + detail).toLowerCase();
        if (tout.indexOf('credit balance') !== -1 || tout.indexOf('billing') !== -1) {
            return { code: 'credits', statut: 'Analyse indisponible',
                     message: "Analyse automatique indisponible : les crédits de l'API vision sont épuisés. Préviens un admin." };
        }
        if (status === 401 || tout.indexOf('authentification requise') !== -1) {
            return { code: 'session', statut: 'Session expirée',
                     message: "Ta session a expiré, reconnecte-toi puis réessaie." };
        }
        if (status === 403 || tout.indexOf('compte non valid') !== -1) {
            return { code: 'validation', statut: 'Compte non validé',
                     message: "Ton compte doit être validé par un admin pour utiliser l'analyse." };
        }
        if (tout.indexOf('illisible') !== -1) {
            return { code: 'illisible', statut: 'Capture illisible',
                     message: "L'analyse n'a pas réussi à lire cette capture. Réessaie avec une image plus nette." };
        }
        if (status === 429 || tout.indexOf('rate limit') !== -1 || tout.indexOf('overloaded') !== -1) {
            return { code: 'surcharge', statut: 'Réessaie dans un instant',
                     message: "Le service d'analyse est saturé, réessaie dans quelques secondes." };
        }
        return { code: 'inconnu', statut: 'Échec analyse',
                 message: 'Extraction impossible' + (msg ? ' (' + msg + ')' : '') + '.' };
    };

    window.REN.toast = function (message, type) {
        type = type || 'info';
        var container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        var toast = document.createElement('div');
        toast.className = 'toast toast--' + type;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(function () {
            toast.classList.add('removing');
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 3000);
    };

    /* === LOADING HELPERS === */
    window.REN.showLoading = function (container) {
        if (!container) return;
        container.innerHTML = '<div class="loading"><div class="spinner"></div> Chargement...</div>';
    };

    window.REN.hideLoading = function (container) {
        var loader = container ? container.querySelector('.loading') : null;
        if (loader) loader.remove();
    };

    /* === SECURITE - ANTI XSS === */
    window.REN.escapeHtml = function (str) {
        if (!str && str !== 0) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    /* Valide et nettoie une URL (retourne '' si suspecte) */
    window.REN.sanitizeUrl = function (url) {
        if (!url) return '';
        var trimmed = url.trim();
        if (trimmed.indexOf('javascript:') !== -1 || trimmed.indexOf('data:') !== -1) return '';
        if (trimmed.indexOf('http://') === 0 || trimmed.indexOf('https://') === 0) return trimmed;
        return '';
    };

    /* === LIGHTBOX PARTAGEE (screenshots de preuve, item FM...) === */
    /* Reutilise les styles .build-lightbox. Les liens marques a.js-lightbox */
    /* s'ouvrent sur place ; le clic molette garde l'ouverture en onglet.   */
    window.REN.openLightbox = function (src, alt) {
        var safeSrc = window.REN.sanitizeUrl(src);
        if (!safeSrc) return;

        var existing = document.getElementById('build-lightbox');
        if (existing) existing.remove();

        var div = document.createElement('div');
        div.id = 'build-lightbox';
        div.className = 'build-lightbox';
        div.innerHTML = '<div class="build-lightbox__inner">'
            + '<button class="build-lightbox__close" type="button" aria-label="Fermer">'
                + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
            + '</button>'
            + '<img src="' + window.REN.escapeHtml(safeSrc) + '" alt="' + window.REN.escapeHtml(alt || '') + '">'
            + '</div>';
        document.body.appendChild(div);
        document.body.style.overflow = 'hidden';

        function close() {
            div.classList.remove('build-lightbox--visible');
            document.body.style.overflow = '';
            setTimeout(function () { if (div.parentNode) div.remove(); }, 200);
            document.removeEventListener('keydown', onEsc);
        }
        function onEsc(e) { if (e.key === 'Escape') close(); }

        div.addEventListener('click', function (e) {
            if (e.target === div || e.target.closest('.build-lightbox__close')) close();
        });
        document.addEventListener('keydown', onEsc);

        requestAnimationFrame(function () {
            div.classList.add('build-lightbox--visible');
        });
    };

    /* Delegation globale : tout lien a.js-lightbox ouvre la visionneuse */
    document.addEventListener('click', function (e) {
        var link = e.target.closest ? e.target.closest('a.js-lightbox') : null;
        if (!link) return;
        e.preventDefault();
        window.REN.openLightbox(link.getAttribute('href'), link.getAttribute('title') || '');
    });

    /* === FORMAT HELPERS === */
    window.REN.formatKamas = function (value) {
        if (!value || value === 0) return '0 K';
        /* Jusqu'à 2 décimales, sans zéros inutiles : 1,6 M / 1,65 M / 2 M */
        function unit(v) {
            return parseFloat(v.toFixed(2)).toLocaleString('fr-FR');
        }
        if (value >= 1000000000) return unit(value / 1000000000) + ' G';
        if (value >= 1000000) return unit(value / 1000000) + ' M';
        if (value >= 1000) return unit(value / 1000) + ' K';
        return value.toLocaleString('fr-FR');
    };

    /* === CADRES PROFIL - TIERS === */
    var TIERS = [
        { key: 'legendaire', min: 4000, name: 'Legendaire', title: 'Dieu du PVP', reward: 200 },
        { key: 'diamant', min: 2500, name: 'Diamant', title: 'Faucheuse des Champs', reward: 100 },
        { key: 'rubis', min: 1500, name: 'Rubis', title: 'Machine de Guerre', reward: 80 },
        { key: 'emeraude', min: 1000, name: 'Emeraude', title: 'Seigneur de Guerre', reward: 70 },
        { key: 'saphir', min: 500, name: 'Saphir', title: 'Veteran des Arenes', reward: 50 },
        { key: 'or', min: 300, name: 'Or', title: 'Elite PVP', reward: 40 },
        { key: 'argent', min: 150, name: 'Argent', title: 'Combattant Confirme', reward: 20 },
        { key: 'bronze', min: 50, name: 'Bronze', title: 'Guerrier de Base', reward: 10 },
        { key: 'initie', min: 0, name: 'Initie', title: 'Joueur Lambda', reward: 0 }
    ];

    window.REN.getTierFromPoints = function (points) {
        var pts = points || 0;
        for (var i = 0; i < TIERS.length; i++) {
            if (pts >= TIERS[i].min) return TIERS[i];
        }
        return TIERS[TIERS.length - 1];
    };

    window.REN.buildAvatarFrame = function (avatarUrl, points, size) {
        var tier = window.REN.getTierFromPoints(points);
        var sz = size || 100;
        var containerSz = tier.key === 'legendaire' ? sz * 1.2 : sz * 1.15;
        var userSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
        var safeAvatarUrl = window.REN.sanitizeUrl(avatarUrl);
        var imgContent = safeAvatarUrl ? '<img src="' + window.REN.escapeHtml(safeAvatarUrl) + '" alt="Avatar">' : userSvg;
        var flames = '';
        if (tier.key === 'legendaire') {
            flames = '<div class="frame-flames">';
            for (var i = 0; i < 8; i++) flames += '<div class="frame-flame"></div>';
            flames += '</div>';
        }
        var html = '<div class="avatar-frame avatar-frame--' + tier.key + '" style="width:' + containerSz + 'px;height:' + containerSz + 'px;">';
        html += '<div class="avatar-frame__img" style="width:' + sz + 'px;height:' + sz + 'px;">' + imgContent + '</div>';
        html += flames;
        html += '</div>';
        return html;
    };

    /* Expose TIERS pour les autres modules */
    window.REN.TIERS_ASC = TIERS.slice().reverse(); /* initie -> legendaire */

    /* Claim des recompenses de palier (jetons) */
    window.REN.claimTierRewards = async function (totalPoints) {
        var profile = window.REN.currentProfile;
        if (!profile) return null;

        var claimed = profile.tier_rewards_claimed || [];
        var tiersAsc = window.REN.TIERS_ASC;
        var newClaims = [];
        var totalBonus = 0;

        for (var i = 0; i < tiersAsc.length; i++) {
            var t = tiersAsc[i];
            if (totalPoints >= t.min && t.reward > 0 && claimed.indexOf(t.key) === -1) {
                newClaims.push(t.key);
                totalBonus += t.reward;
            }
        }

        if (newClaims.length === 0) return null;

        var updatedClaimed = claimed.concat(newClaims);
        var newJetons = (profile.jetons || 0) + totalBonus;

        try {
            var { error } = await window.REN.supabase
                .from('profiles')
                .update({ tier_rewards_claimed: updatedClaimed, jetons: newJetons })
                .eq('id', window.REN.currentUser.id);

            if (error) throw error;

            profile.tier_rewards_claimed = updatedClaimed;
            profile.jetons = newJetons;

            return { newClaims: newClaims, totalBonus: totalBonus, newJetons: newJetons };
        } catch (err) {
            console.error('[REN] Erreur claim rewards:', err);
            return null;
        }
    };

    window.REN.formatNumber = function (value) {
        if (value === null || value === undefined) return '0';
        return Number(value).toLocaleString('fr-FR');
    };

    window.REN.formatDate = function (dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        var now = new Date();
        var diff = now - d;
        var minutes = Math.floor(diff / 60000);
        var hours = Math.floor(diff / 3600000);
        var days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'a l\'instant';
        if (minutes < 60) return 'il y a ' + minutes + ' min';
        if (hours < 24) return 'il y a ' + hours + ' h';
        if (days < 7) return 'il y a ' + days + ' j';

        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: undefined });
    };

    window.REN.formatDateFull = function (dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
            ', ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    /* === COMBAT FORM SHARED === */
    window.REN.initCombatForm = function (type) {
        /* Returns an object with references and submit handler - used by attaque.js and defense.js */
        return {
            type: type,
            nbAllies: 1,
            nbEnnemis: 1,
            selectedAllies: [],
            allianceEnnemieId: null,
            resultat: null,
            butinKamas: 0
        };
    };

    /* === MATCHMAKING : badge dans le menu + bandeau si je suis dans la file === */
    /* Sur toutes les pages sauf la page matchmaking elle-meme (qui a sa propre
       vue) : nombre de joueurs disponibles en pastille sur « Trouver une T5 »,
       et un bandeau « Matchmaking en cours » pour celui qui s'est signale. */
    var mmWatchQueue = [];
    var mmWatchTimer = null;
    async function initMatchmakingWatch() {
        if (!window.REN.supabase || !window.REN.currentProfile) return;
        if (!isModuleActif('matchmaking')) return;
        if (getCurrentPage() === 'matchmaking') return;
        await mmWatchRefresh();
        try {
            window.REN.supabase.channel('mm-watch')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'mm_queue' }, mmWatchRefresh)
                .subscribe();
        } catch (e) { /* le rafraichissement periodique prend le relais */ }
        mmWatchTimer = setInterval(mmWatchRefresh, 60000);
    }
    async function mmWatchRefresh() {
        try {
            var { data } = await window.REN.supabase.from('v_mm_queue').select('user_id, username, created_at, expire_at');
            var now = Date.now();
            mmWatchQueue = (data || []).filter(function (q) { return new Date(q.expire_at).getTime() > now; });
        } catch (e) { return; }
        mmWatchRender();
    }
    function mmWatchRender() {
        var n = mmWatchQueue.length;
        var me = mmWatchQueue.filter(function (q) { return q.user_id === window.REN.currentProfile.id; })[0];
        /* Pastille sur le lien du menu */
        var link = document.querySelector('.app-sidebar__link[data-page="matchmaking"]');
        if (link) {
            var old = link.querySelector('.mm-badge');
            if (old) old.remove();
            if (n > 0) {
                var b = document.createElement('span');
                b.className = 'mm-badge' + (me ? ' mm-badge--me' : '');
                b.textContent = n + '/5';
                b.title = n + ' joueur' + (n > 1 ? 's' : '') + ' disponible' + (n > 1 ? 's' : '') + ' pour une T5';
                link.appendChild(b);
            }
        }
        /* Bandeau pour celui qui est dans la file */
        var bar = document.getElementById('mm-bar');
        if (!me) { if (bar) bar.remove(); return; }
        var mins = Math.max(0, Math.round((Date.now() - new Date(me.created_at).getTime()) / 60000));
        if (!bar) {
            bar = document.createElement('a');
            bar.id = 'mm-bar';
            bar.className = 'mm-bar';
            bar.href = 'matchmaking.html';
            document.body.appendChild(bar);
        }
        bar.innerHTML = '<span class="mm-pulse"></span>'
            + '<span class="mm-bar__title">Matchmaking T5 en cours</span>'
            + '<span class="mm-bar__meta">' + mins + ' min · ' + Math.min(n, 5) + '/5 joueur' + (n > 1 ? 's' : '') + '</span>'
            + '<span class="mm-bar__cta">Voir la compo</span>';
    }

    /* === UPDATE NOTIFICATION === */
    var REN_UPDATE_VERSION = '2026-09-26b';

    function showUpdateNotif() {
        var seen = localStorage.getItem('ren_update_seen');
        if (seen === REN_UPDATE_VERSION) return;
        // Ne pas afficher sur la page de connexion
        var page = window.location.pathname.split('/').pop();
        if (page === 'connexion.html' || page === '') return;

        var notif = document.createElement('div');
        notif.className = 'update-notif';
        notif.innerHTML = '<div class="update-notif__header">'
            + '<div class="update-notif__title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>Nouvelle mise \u00e0 jour</div>'
            + '<button class="update-notif__close" title="Fermer">&times;</button>'
            + '</div>'
            + '<div class="update-notif__desc">Des am\u00e9liorations et corrections ont \u00e9t\u00e9 d\u00e9ploy\u00e9es sur le site.</div>'
            + '<a href="index.html#changelog" class="update-notif__btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Voir les mises \u00e0 jour</a>';

        document.body.appendChild(notif);

        setTimeout(function () { notif.classList.add('update-notif--visible'); }, 100);

        notif.querySelector('.update-notif__close').addEventListener('click', function () {
            localStorage.setItem('ren_update_seen', REN_UPDATE_VERSION);
            notif.classList.remove('update-notif--visible');
            setTimeout(function () { notif.remove(); }, 300);
        });

        notif.querySelector('.update-notif__btn').addEventListener('click', function () {
            localStorage.setItem('ren_update_seen', REN_UPDATE_VERSION);
            notif.classList.remove('update-notif--visible');
            setTimeout(function () { notif.remove(); }, 300);
        });
    }

    /* === CHANGELOG COLLAPSE === */
    function initChangelog() {
        var list = document.getElementById('changelog-list');
        var btn = document.getElementById('changelog-show-more');
        if (!list || !btn) return;
        var entries = list.querySelectorAll('.changelog__entry');
        var MAX_VISIBLE = 4;
        if (entries.length <= MAX_VISIBLE) { btn.style.display = 'none'; return; }
        for (var i = MAX_VISIBLE; i < entries.length; i++) {
            entries[i].style.display = 'none';
        }
        btn.style.display = 'flex';
        var expanded = false;
        btn.addEventListener('click', function () {
            expanded = !expanded;
            for (var i = MAX_VISIBLE; i < entries.length; i++) {
                entries[i].style.display = expanded ? '' : 'none';
            }
            btn.querySelector('span').textContent = expanded ? 'Masquer les anciennes mises à jour' : 'Voir les mises à jour précédentes';
            btn.classList.toggle('changelog__show-more--expanded', expanded);
        });
    }

    /* === SIDEBAR INJECTION === */
    /* Single source of truth pour la nav publique. */
    /* Maj du menu = modifier SIDEBAR_GROUPS ci-dessous, rien d'autre. */
    const SIDEBAR_GROUPS = [
        {
            title: 'PvP',
            items: [
                { page: 'attaque', label: 'Attaque', href: 'attaque.html', icon: 'sword', module: 'attaque' },
                { page: 'defense', label: 'Défense', href: 'defense.html', icon: 'shield', module: 'defense' },
                { page: 'historique', label: 'Historique', href: 'historique.html', icon: 'clock', module: 'historique' },
                { page: 'classement', label: 'Classement', href: 'classement.html', icon: 'trophy', module: 'classement' },
                { page: 'matchmaking', label: 'Trouver une T5', href: 'matchmaking.html', icon: 'users', module: 'matchmaking' }
            ]
        },
        {
            title: 'Alliance',
            items: [
                { page: 'membres', label: 'Membres', href: 'membres.html', icon: 'users', module: 'membres' },
                { page: 'builds', label: 'Builds', href: 'builds.html', icon: 'tool', module: 'builds' },
                { page: 'board', label: 'Droits Perco', href: 'board.html', icon: 'chart', module: 'board' },
                { page: 'liens', label: 'Liens utiles', href: 'liens.html', icon: 'link', module: 'liens' }
            ]
        },
        {
            title: 'Économie',
            items: [
                { page: 'boutique', label: 'Boutique', href: 'boutique.html', icon: 'cart', module: 'boutique' },
                { page: 'recyclages', label: 'Recyclages', href: 'recyclages.html', icon: 'recycle', module: 'recyclages' },
                { page: 'fm', label: 'Forgemagie', href: 'fm.html', icon: 'hammer', module: 'fm' }
            ]
        },
        {
            title: 'Fun',
            items: [
                { page: 'jeux', label: 'Jeux', href: 'jeux.html', icon: 'dice', cta: true, module: 'jeux' }
            ]
        }
    ];

    /* === MODULES ACTIVABLES (feature flags) === */
    /* Page -> module (les pages sans entrée sont toujours accessibles) */
    const PAGE_MODULES = {
        attaque: 'attaque', defense: 'defense', historique: 'historique',
        classement: 'classement', membres: 'membres', builds: 'builds',
        board: 'board', liens: 'liens', boutique: 'boutique',
        recyclages: 'recyclages', fm: 'fm', jeux: 'jeux', slot: 'jeux',
        matchmaking: 'matchmaking'
    };
    let modulesActifs = null; /* null = config pas chargée => tout actif */

    function readModulesCache() {
        try {
            const raw = localStorage.getItem('ren_modules');
            if (raw) modulesActifs = JSON.parse(raw);
        } catch (e) { /* ignore */ }
    }

    function isModuleActif(mod) {
        if (!mod || !modulesActifs) return true;
        return modulesActifs[mod] !== false;
    }

    function applyModulesToSidebar() {
        const sidebar = document.getElementById('app-sidebar');
        if (!sidebar) return;
        sidebar.querySelectorAll('.app-sidebar__link[data-module]').forEach(function (link) {
            link.style.display = isModuleActif(link.getAttribute('data-module')) ? '' : 'none';
        });
        /* Masquer les groupes entièrement vides */
        sidebar.querySelectorAll('.app-sidebar__group').forEach(function (group) {
            const links = group.querySelectorAll('.app-sidebar__link');
            if (!links.length) return;
            let visible = 0;
            links.forEach(function (l) { if (l.style.display !== 'none') visible++; });
            group.style.display = visible ? '' : 'none';
        });
    }

    /* Redirige vers l'accueil si la page courante appartient à un module désactivé */
    function guardCurrentPage() {
        const mod = PAGE_MODULES[getCurrentPage()];
        if (mod && !isModuleActif(mod)) {
            window.location.href = 'index.html';
            return true;
        }
        return false;
    }

    async function loadModulesConfig() {
        if (!window.REN.supabase) return;
        try {
            const { data, error } = await window.REN.supabase
                .from('modules_config')
                .select('module, actif');
            if (error) throw error;
            modulesActifs = {};
            (data || []).forEach(function (m) { modulesActifs[m.module] = m.actif; });
            try { localStorage.setItem('ren_modules', JSON.stringify(modulesActifs)); } catch (e) { /* ignore */ }
            applyModulesToSidebar();
            guardCurrentPage();
        } catch (err) {
            /* Table absente ou indisponible : tout reste actif */
            console.warn('[REN] modules_config indisponible:', err.message);
        }
    }

    const SIDEBAR_ICONS = {
        home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        sword: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/></svg>',
        shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>',
        clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
        users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
        link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
        cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
        recycle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="M14 16l-3 3 3 3"/><path d="M8.293 13.596 4.5 9.5 8.5 5"/><path d="m13.378 9.633 4.096-1.098L19 4.5"/><path d="M16 4.5v.01"/><path d="M20.582 11.5a1.82 1.82 0 0 0 .064-1.886L19.36 7.5"/></svg>',
        hammer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>',
        dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor"/></svg>'
    };

    /* Icons SVG pour les actions user (admin + logout) */
    const ADMIN_ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"/></svg>';
    const LOGOUT_ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';

    function injectSidebar() {
        const slot = document.getElementById('app-sidebar');
        if (!slot) return; /* page sans sidebar (admin, connexion) */

        const currentPage = getCurrentPage();
        let html = '';

        /* Bloc brand : le logo sert de lien Accueil (l entree « Accueil » du menu
           faisait doublon juste en dessous et coutait une ligne de defilement). */
        html += '<a href="index.html" class="app-sidebar__brand app-sidebar__brand--link' + (currentPage === 'accueil' ? ' active' : '') + '" data-page="accueil" title="Redemption, retour a l accueil">'
            + '<img src="assets/images/logo-redemption.png?v=20260921" alt="Logo Redemption">'
            + '<span class="app-sidebar__brand-name">Accueil</span>'
            + '</a>';

        /* Groupes de nav */
        SIDEBAR_GROUPS.forEach(function (group) {
            html += '<div class="app-sidebar__group">';
            if (group.title) {
                html += '<div class="app-sidebar__group-title">' + group.title + '</div>';
            }
            group.items.forEach(function (item) {
                const active = item.page === currentPage ? ' active' : '';
                const cta = item.cta ? ' app-sidebar__link--cta' : '';
                const icon = SIDEBAR_ICONS[item.icon] || '';
                html += '<a href="' + item.href + '" class="app-sidebar__link' + cta + active + '" data-page="' + item.page + '"'
                    + (item.module ? ' data-module="' + item.module + '"' : '')
                    + '>'
                    + icon
                    + '<span>' + item.label + '</span>'
                    + '</a>';
            });
            html += '</div>';
        });

        /* Meta (ex-footer) : compteur membres + credit dev */
        html += '<div class="app-sidebar__meta">'
            + '<span class="app-sidebar__meta-count" id="app-member-count"></span>'
            + '<span class="app-sidebar__meta-dev">Développé par <strong class="notranslate">Rorschach</strong></span>'
            + '</div>';

        /* Bloc user en bas de la sidebar (sticky).
           Avant : le pseudo seul, cliquable sans que rien ne l'indique. La
           plupart des membres ne savaient pas que leur profil etait la. */
        html += '<div class="app-sidebar__user">'
            + '<a href="profil.html" class="app-sidebar__profile" id="app-profile-link" title="Voir et modifier mon profil">'
            +   '<span class="app-sidebar__avatar notranslate" id="app-avatar"></span>'
            +   '<span class="app-sidebar__profile-text">'
            +     '<span class="app-sidebar__profile-label">Mon profil</span>'
            +     '<span class="app-sidebar__username notranslate" id="app-username"></span>'
            +   '</span>'
            +   '<svg class="app-sidebar__profile-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
            + '</a>'
            + '<div class="app-sidebar__actions">'
            +   '<button class="app-sidebar__user-icon" id="app-lang-toggle" title="English version"></button>'
            +   '<a href="admin.html" class="app-sidebar__user-icon" id="app-admin-link" title="Administration" style="display:none;">' + ADMIN_ICON_SVG + '</a>'
            +   '<button class="app-sidebar__logout" id="app-btn-logout" title="Se déconnecter du site">' + LOGOUT_ICON_SVG + '<span>Déconnexion</span></button>'
            + '</div>'
            + '</div>';

        slot.innerHTML = html;
        document.body.classList.add('app-has-sidebar');

        /* Inject overlay si pas déjà présent */
        if (!document.getElementById('app-sidebar-overlay')) {
            const ov = document.createElement('div');
            ov.className = 'app-sidebar__overlay';
            ov.id = 'app-sidebar-overlay';
            document.body.appendChild(ov);
            ov.addEventListener('click', closeSidebar);
        }

        /* Click sur username → profil */
        const appUsername = document.getElementById('app-username');
        if (appUsername) {
            appUsername.style.cursor = 'pointer';
            appUsername.addEventListener('click', function () {
                window.location.href = 'profil.html';
            });
        }

        /* Click sur logout sidebar : déconnexion */
        const appBtnLogout = document.getElementById('app-btn-logout');
        if (appBtnLogout) {
            appBtnLogout.addEventListener('click', async function () {
                if (window.REN.supabase) await window.REN.supabase.auth.signOut();
                window.location.href = AUTH_PAGE;
            });
        }
    }

    function openSidebar() {
        const sb = document.getElementById('app-sidebar');
        const ov = document.getElementById('app-sidebar-overlay');
        if (sb) sb.classList.add('active');
        if (ov) ov.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        const sb = document.getElementById('app-sidebar');
        const ov = document.getElementById('app-sidebar-overlay');
        if (sb) sb.classList.remove('active');
        if (ov) ov.classList.remove('active');
        document.body.style.overflow = '';
        if (navToggle) navToggle.classList.remove('active');
    }

    function bindSidebarMobileToggle() {
        if (!navToggle) return;
        /* On remplace l'ancien comportement (nav horizontal) par sidebar */
        navToggle.addEventListener('click', function (e) {
            if (!document.getElementById('app-sidebar')) return; /* page sans sidebar */
            e.stopPropagation();
            navToggle.classList.toggle('active');
            const isOpen = document.getElementById('app-sidebar').classList.contains('active');
            if (isOpen) closeSidebar(); else openSidebar();
        });

        /* Fermer la sidebar quand on clique sur un lien */
        document.addEventListener('click', function (e) {
            const link = e.target.closest('.app-sidebar__link');
            if (link) closeSidebar();
        });
    }

    /* === ZONES AUTOCOMPLETE (utilitaire réutilisable) === */
    /* Cache global des zones (chargé une fois par session) */
    var zonesCache = null;
    var zonesPromise = null;

    async function loadZonesOnce() {
        if (zonesCache) return zonesCache;
        if (zonesPromise) return zonesPromise;
        if (!window.REN.supabase) return [];
        zonesPromise = window.REN.supabase
            .from('zones_perco')
            .select('id, nom, type, niveau_zone')
            .eq('actif', true)
            .order('nom', { ascending: true })
            .then(function (res) {
                zonesCache = res.data || [];
                return zonesCache;
            });
        return zonesPromise;
    }

    function normalizeText(s) {
        return (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    /* Branche un autocomplete zones+donjons sur un input texte existant. */
    /* Le wrapper .ally-autocomplete et le .ally-dropdown sont créés    */
    /* automatiquement si pas déjà présents. La valeur reste un string  */
    /* libre (l'utilisateur peut taper ou choisir dans la liste).       */
    window.REN.attachZoneAutocomplete = async function (input) {
        if (!input || input.dataset.zoneAutocompleteBound === '1') return;
        input.dataset.zoneAutocompleteBound = '1';

        var zones = await loadZonesOnce();
        if (!zones || !zones.length) return;

        /* Wrap dans .ally-autocomplete si pas déjà */
        var wrap = input.parentElement;
        var dropdown;
        if (wrap && wrap.classList.contains('ally-autocomplete')) {
            dropdown = wrap.querySelector('.ally-dropdown');
        } else {
            wrap = document.createElement('div');
            wrap.className = 'ally-autocomplete';
            input.parentNode.insertBefore(wrap, input);
            wrap.appendChild(input);
            input.classList.add('ally-search');
        }
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'ally-dropdown';
            wrap.appendChild(dropdown);
        }
        input.setAttribute('autocomplete', 'off');

        var esc = window.REN.escapeHtml;

        function showDropdown(filter) {
            var q = normalizeText(filter);
            var matches = zones.filter(function (z) {
                if (!q) return true;
                return normalizeText(z.nom).indexOf(q) !== -1
                    || String(z.niveau_zone).indexOf(q) !== -1;
            }).slice(0, 80);

            if (!matches.length) {
                dropdown.innerHTML = '<div class="ally-dropdown__empty">Aucun résultat</div>';
                dropdown.classList.add('active');
                return;
            }

            var html = '';
            matches.forEach(function (z) {
                var typeTag = z.type === 'dj' ? ' [DJ]' : '';
                var label = z.nom + ' (Niv. ' + z.niveau_zone + ')' + typeTag;
                html += '<div class="ally-dropdown__item" data-label="' + esc(z.nom) + '">'
                    + esc(label)
                    + '</div>';
            });
            dropdown.innerHTML = html;
            dropdown.classList.add('active');

            dropdown.querySelectorAll('.ally-dropdown__item').forEach(function (item) {
                item.addEventListener('mousedown', function (e) {
                    e.preventDefault();
                    input.value = item.getAttribute('data-label');
                    dropdown.classList.remove('active');
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });
            });
        }

        input.addEventListener('focus', function () { showDropdown(input.value); });
        input.addEventListener('input', function () { showDropdown(input.value); });
        input.addEventListener('blur', function () {
            setTimeout(function () { dropdown.classList.remove('active'); }, 150);
        });
    };

    /* ============================================ */
    /* === LANGUE (drapeau EN, traduction Google) == */
    /* ============================================ */
    /* Un clic sur le drapeau ouvre un menu de       */
    /* langues (FR / EN / DE). Traduction Google de  */
    /* tout le site (contenu dynamique inclus).      */
    /* Preference memorisee en localStorage, les     */
    /* elements .notranslate (pseudos, noms de       */
    /* runes) restent intacts.                       */
    const LANG_KEY = 'ren_lang';
    const LANGS = {
        fr: { label: 'Français', flag: '<svg class="lang-flag" viewBox="0 0 60 40"><rect width="20" height="40" fill="#002395"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#ED2939"/></svg>' },
        en: { label: 'English', flag: '<svg class="lang-flag" viewBox="0 0 60 40"><rect width="60" height="40" fill="#012169"/><path d="M0,0 60,40 M60,0 0,40" stroke="#fff" stroke-width="8"/><path d="M0,0 60,40 M60,0 0,40" stroke="#C8102E" stroke-width="4"/><path d="M30,0 V40 M0,20 H60" stroke="#fff" stroke-width="12"/><path d="M30,0 V40 M0,20 H60" stroke="#C8102E" stroke-width="7"/></svg>' },
        de: { label: 'Deutsch', flag: '<svg class="lang-flag" viewBox="0 0 60 40"><rect width="60" height="40" fill="#000"/><rect y="13.3" width="60" height="13.4" fill="#DD0000"/><rect y="26.7" width="60" height="13.3" fill="#FFCE00"/></svg>' }
    };

    function getLang() {
        try {
            var l = localStorage.getItem(LANG_KEY);
            return LANGS[l] ? l : 'fr';
        } catch (e) { return 'fr'; }
    }

    function setGoogTransCookie(val) {
        document.cookie = 'googtrans=' + val + '; path=/';
        document.cookie = 'googtrans=' + val + '; path=/; domain=.' + window.location.hostname;
    }

    function clearGoogTransCookie() {
        var past = '; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        document.cookie = 'googtrans=/fr/fr' + past;
        document.cookie = 'googtrans=/fr/fr' + past + '; domain=.' + window.location.hostname;
    }

    function setLang(next) {
        if (!LANGS[next]) next = 'fr';
        try { localStorage.setItem(LANG_KEY, next); } catch (e) {}
        if (next === 'fr') clearGoogTransCookie(); else setGoogTransCookie('/fr/' + next);
        window.location.reload();
    }

    function openLangMenu(btn) {
        var existing = document.getElementById('app-lang-menu');
        if (existing) { existing.remove(); return; }
        var menu = document.createElement('div');
        menu.id = 'app-lang-menu';
        menu.className = 'lang-menu notranslate';
        var current = getLang();
        Object.keys(LANGS).forEach(function (code) {
            var item = document.createElement('button');
            item.type = 'button';
            item.className = 'lang-menu__item' + (code === current ? ' active' : '');
            item.innerHTML = LANGS[code].flag + '<span>' + LANGS[code].label + '</span>';
            item.addEventListener('click', function () {
                if (code === current) { menu.remove(); return; }
                setLang(code);
            });
            menu.appendChild(item);
        });
        document.body.appendChild(menu);
        /* Position : au-dessus du bouton si la place le permet, sinon dessous */
        var r = btn.getBoundingClientRect();
        var top = r.top - menu.offsetHeight - 8;
        if (top < 8) top = r.bottom + 8;
        var left = Math.min(Math.max(8, r.left + r.width / 2 - menu.offsetWidth / 2), window.innerWidth - menu.offsetWidth - 8);
        menu.style.top = top + 'px';
        menu.style.left = left + 'px';
        setTimeout(function () {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && !btn.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    }

    function bootGoogleTranslate(lang) {
        if (document.getElementById('google_translate_element')) return;
        setGoogTransCookie('/fr/' + lang);
        var holder = document.createElement('div');
        holder.id = 'google_translate_element';
        document.body.appendChild(holder);
        window.googleTranslateElementInit = function () {
            new window.google.translate.TranslateElement({
                pageLanguage: 'fr',
                includedLanguages: 'en,de',
                autoDisplay: false
            }, 'google_translate_element');
        };
        var s = document.createElement('script');
        s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.head.appendChild(s);
    }

    function initLangSwitch() {
        var lang = getLang();
        var btn = document.getElementById('app-lang-toggle');
        if (!btn) {
            /* Pages sans sidebar (connexion, admin) : bouton flottant */
            btn = document.createElement('button');
            btn.id = 'app-lang-toggle';
            btn.className = 'lang-float';
            document.body.appendChild(btn);
        }
        btn.innerHTML = LANGS[lang].flag;
        btn.title = 'Langue / Language';
        btn.setAttribute('aria-label', btn.title);
        btn.addEventListener('click', function () { openLangMenu(btn); });
        if (lang !== 'fr') bootGoogleTranslate(lang);
    }

    /* === GUIDE D'UTILISATION PAR PAGE === */
    /* Bouton .js-guide-open (haut de page) -> modale statique #guide-modal */
    function initPageGuide() {
        var modal = document.getElementById('guide-modal');
        if (!modal) return;
        document.querySelectorAll('.js-guide-open').forEach(function (btn) {
            btn.addEventListener('click', function () { modal.classList.add('active'); });
        });
        var close = document.getElementById('guide-modal-close');
        if (close) close.addEventListener('click', function () { modal.classList.remove('active'); });
        modal.addEventListener('click', function (e) {
            if (e.target === modal) modal.classList.remove('active');
        });
    }

    /* === INIT === */
    function init() {
        injectSidebar();
        /* Modules : filtrage immédiat depuis le cache, puis maj depuis la BDD */
        readModulesCache();
        applyModulesToSidebar();
        if (guardCurrentPage()) return; /* redirection en cours, inutile de continuer */
        initLangSwitch();
        loadModulesConfig();
        setActiveNav();
        bindSidebarMobileToggle();
        initMobileMenu();
        initLogout();
        checkAuth();
        showUpdateNotif();
        initChangelog();
        initPageGuide();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
