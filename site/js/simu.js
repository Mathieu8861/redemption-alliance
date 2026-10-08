/* ============================================ */
/* Redemption - Compo de simu (sql/063)          */
/* Lecture des ✅ de #event a l'heure reglee,     */
/* equipes proposees puis ajustees en glissant,  */
/* publication dans #event avec les tags         */
/* ============================================ */
(function () {
    'use strict';

    var SERVEUR_DISCORD = '1548432166671753318';
    var COURT = { Eniripsa: 'Eni', Feca: 'Feca', Iop: 'Iop', Pandawa: 'Panda', Sacrieur: 'Sacri', Sadida: 'Sadi', Zobal: 'Zobal',
        Xelor: 'Xelor', Cra: 'Cra', Osamodas: 'Osa', Enutrof: 'Enu', Eliotrope: 'Elio', Huppermage: 'Hupper', Ouginak: 'Ougi',
        Steamer: 'Steamer', Ecaflip: 'Eca', Sram: 'Sram', Roublard: 'Roub', Forge: 'Forge' };
    var COULEUR = { Feca: '#5cc4d6', Eniripsa: '#ff8fb8', Iop: '#ff7a45', Pandawa: '#5fd08a', Sacrieur: '#e84444', Sadida: '#9bd65c', '*': '#a68bff' };
    var MODELES_DEFAUT = [['Feca', 'Eniripsa', 'Iop', 'Pandawa', '*'], ['Eniripsa', 'Iop', 'Pandawa', 'Sacrieur', 'Sadida']];

    var moi = null;
    var classes = [];          /* ordre de classes_ref */
    var modeles = MODELES_DEFAUT;
    var annonces = [];
    var simu = null;           /* ligne simu_events */
    var compo = null;          /* { auto, equipes: [{ nom, modele, places: [{ joueur, nom, classe } | null] }], remplacants: [], retardataires: [], ajoutes: [{ joueur, nom }] } */
    var annuaire = {};         /* discord_id -> joueur du site (classes, points) */
    var membresDiscord = null; /* membres du serveur Discord, charges a la premiere recherche */
    var selection = null;      /* cle du joueur touche (telephone) */
    var minuteurSauvegarde = null;
    var canal = null;
    var lectureEnCours = false;

    document.addEventListener('ren:ready', init);

    function esc(s) { return window.REN.escapeHtml(s == null ? '' : String(s)); }
    function toast(m, t) { window.REN.toast(m, t || 'info'); }
    function court(c) { return c === '*' ? 'Autre' : (COURT[c] || c || '?'); }
    function libelleModele(m) { return m.map(court).join(' / '); }

    var ICONE_RECOMPOSER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>';
    var ICONE_PUBLIER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';

    /* Fenetre de confirmation aux couleurs du site, a la place du confirm()
       du navigateur. Resout true si on confirme ; Echap, « non » ou un clic
       sur le fond annulent. */
    function demander(o) {
        return new Promise(function (resoudre) {
            var avant = document.activeElement;
            var fond = document.createElement('div');
            fond.className = 'modal-overlay simu-confirm';
            fond.innerHTML = '<div class="modal simu-confirm__boite" role="alertdialog" aria-modal="true" aria-labelledby="simu-confirm-titre" aria-describedby="simu-confirm-texte">'
                + '<div class="simu-confirm__icone" aria-hidden="true">' + o.icone + '</div>'
                + '<h2 class="modal__title" id="simu-confirm-titre">' + esc(o.titre) + '</h2>'
                + '<p class="simu-confirm__texte" id="simu-confirm-texte">' + esc(o.texte) + '</p>'
                + '<div class="simu-confirm__actions">'
                +   '<button type="button" class="btn btn--secondary" data-choix="non">' + esc(o.non) + '</button>'
                +   '<button type="button" class="btn btn--primary" data-choix="oui">' + esc(o.oui) + '</button>'
                + '</div></div>';
            document.body.appendChild(fond);
            var boutons = fond.querySelectorAll('[data-choix]');
            var appuiSurFond = false;
            var fini = false;

            function fermer(ok) {
                if (fini) return;
                fini = true;
                document.removeEventListener('keydown', clavier, true);
                fond.classList.remove('active');
                setTimeout(function () { fond.remove(); }, 300);
                if (avant && avant.focus) avant.focus();
                resoudre(ok);
            }
            function clavier(e) {
                if (e.key === 'Escape') { e.preventDefault(); fermer(false); return; }
                if (e.key !== 'Tab') return;
                /* Le focus reste dans la fenetre */
                e.preventDefault();
                var i = Array.prototype.indexOf.call(boutons, document.activeElement);
                boutons[(i + (e.shiftKey ? boutons.length - 1 : 1)) % boutons.length].focus();
            }
            /* Un texte selectionne en glissant jusqu'au fond ne ferme pas la fenetre */
            fond.addEventListener('mousedown', function (e) { appuiSurFond = e.target === fond; });
            fond.addEventListener('click', function (e) {
                var b = e.target.closest('[data-choix]');
                if (b) fermer(b.getAttribute('data-choix') === 'oui');
                else if (e.target === fond && appuiSurFond) fermer(false);
            });
            document.addEventListener('keydown', clavier, true);
            void fond.offsetWidth; /* etat de depart pris en compte : la fenetre s'anime */
            fond.classList.add('active');
            boutons[1].focus();
        });
    }

    async function init() {
        if (!window.REN.supabase || !window.REN.currentProfile) return;
        moi = window.REN.currentProfile;
        var chargement = document.getElementById('simu-chargement');
        if (!(moi.is_admin || moi.organisateur_event)) {
            await vueJoueur();
            return;
        }
        if (window.REN.demoLocale) document.getElementById('simu-badge-test').hidden = false;
        try {
            await Promise.all([chargerReglages(), chargerAnnuaire()]);
            await chargerAnnonces();
        } catch (e) {
            chargement.style.display = 'none';
            toast('Chargement impossible : ' + e.message, 'error');
            return;
        }
        chargement.style.display = 'none';
        document.getElementById('simu-contenu').hidden = false;
        brancher();
        var choix = annonceParDefaut();
        if (choix) await ouvrir(choix);
        else renderTout();
        setInterval(tic, 30000);
    }

    /* === APPELS === */
    async function api(action, params) {
        var jeton = null;
        try {
            var s = await window.REN.supabase.auth.getSession();
            jeton = s && s.data && s.data.session ? s.data.session.access_token : null;
        } catch (e) { /* pas de session : serveur local */ }
        var entetes = { 'Content-Type': 'application/json' };
        if (jeton) entetes.Authorization = 'Bearer ' + jeton;
        var r = await fetch('/api/simu', { method: 'POST', headers: entetes, body: JSON.stringify(Object.assign({ action: action }, params || {})) });
        var j = await r.json().catch(function () { return {}; });
        if (!r.ok || j.erreur) throw new Error(j.erreur || ('erreur ' + r.status));
        return j;
    }

    async function chargerReglages() {
        var res = await Promise.all([
            window.REN.supabase.from('site_config').select('cle, valeur').in('cle', ['simu_modeles']),
            window.REN.supabase.from('classes_ref').select('classe, ordre').order('ordre')
        ]);
        (res[0].data || []).forEach(function (r) {
            try {
                var m = JSON.parse(r.valeur);
                if (Array.isArray(m) && m.length && m.every(function (x) { return Array.isArray(x) && x.length; })) modeles = m;
            } catch (e) { /* reglage illisible : modeles par defaut */ }
        });
        classes = (res[1].data || []).map(function (c) { return c.classe; });
        if (!classes.length) classes = Object.keys(COURT);
    }

    /* Joueurs du site relies a Discord : classes (principale + mules) et points PvP definitifs */
    async function chargerAnnuaire() {
        var res = await Promise.all([
            window.REN.supabase.from('profiles').select('id, username, classe, mules_infos, discord_id').not('discord_id', 'is', null),
            window.REN.supabase.from('classement_pvp_definitif').select('id, points')
        ]);
        var points = {};
        (res[1].data || []).forEach(function (p) { points[p.id] = p.points || 0; });
        annuaire = {};
        (res[0].data || []).forEach(function (p) {
            var cl = [];
            if (p.classe) cl.push(p.classe);
            Object.keys(p.mules_infos || {}).forEach(function (k) {
                var c = p.mules_infos[k] && p.mules_infos[k].classe;
                if (c && cl.indexOf(c) === -1) cl.push(c);
            });
            annuaire[p.discord_id] = { cle: p.discord_id, nom: p.username, site: true, classes: cl, principale: p.classe || null, points: points[p.id] || 0 };
        });
    }

    async function chargerAnnonces() {
        var r = await api('annonces');
        annonces = r.annonces || [];
        var sel = document.getElementById('simu-annonces');
        sel.innerHTML = annonces.length
            ? annonces.map(function (a) { return '<option value="' + esc(a.id) + '">' + esc(libelleAnnonce(a)) + '</option>'; }).join('')
            : '<option value="">Aucune annonce avec des ✅ ces 8 derniers jours</option>';
    }

    function libelleAnnonce(a) {
        var quand = new Date(a.annonce_le).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        var texte = String(a.texte || '').replace(/<[@#][!&]?\d+>/g, '').replace(/@everyone|@here/g, '').replace(/\s+/g, ' ').trim();
        return quand + ' · ' + a.auteur_nom + ' · ✅ ' + a.oui + ' · ' + (texte.length > 60 ? texte.slice(0, 60) + '...' : texte);
    }

    /* La plus recente qui ressemble a une annonce (une heure, ou au moins 3 ✅) */
    function annonceParDefaut() {
        var demande = new URLSearchParams(location.search).get('annonce');
        if (demande) return demande;
        var vraies = annonces.filter(function (a) { return a.lancement_propose || a.oui >= 3; });
        return ((vraies[0] || annonces[0]) || {}).id || null;
    }

    async function ouvrir(messageId) {
        etat('Lecture des ✅...');
        try {
            var r = await api('ouvrir', { message_id: messageId });
            simu = r.simu;
            document.getElementById('simu-annonces').value = messageId;
            compo = simu.compo || null;
            /* Compo jamais retouchee a la main : on la refait avec les ✅ du moment */
            if (!compo || compo.auto) composerAuto(false);
            else if (synchroniserBancs()) sauver();
            abonner();
            renderTout();
        } catch (e) {
            toast(e.message, 'error');
            etat('Erreur : ' + e.message);
        }
    }

    async function relire(silencieux) {
        if (!simu || lectureEnCours) return;
        lectureEnCours = true;
        var avant = simu.inscrits_a_l_heure;
        try {
            var r = await api('lire', { simu_id: simu.id });
            simu = r.simu;
            var vientDeFiger = !Array.isArray(avant) && Array.isArray(simu.inscrits_a_l_heure);
            /* Compo jamais retouchee a la main : refaite ; sinon les nouveaux vont sur les bancs */
            if (!compo || compo.auto) composerAuto(false);
            else if (synchroniserBancs()) sauver();
            renderTout();
            if (!silencieux) toast(vientDeFiger ? 'Inscrits figés : ceux qui cochent maintenant sont retardataires' : 'Inscriptions relues', 'success');
        } catch (e) {
            if (!silencieux) toast(e.message, 'error');
        }
        lectureEnCours = false;
    }

    /* Toutes les 30 s : l'heure de lecture arrivee, la liste se fige */
    function tic() {
        if (!simu) return;
        renderEtat();
        if (simu.lancement && !Array.isArray(simu.inscrits_a_l_heure) && Date.now() >= cloture()) relire(true);
    }

    function cloture() {
        return new Date(simu.lancement).getTime() - (simu.lecture_avant_min || 0) * 60000;
    }

    /* === INSCRITS === */
    function idsInscrits() { return (simu && simu.inscrits || []).map(function (i) { return i.discord_id; }); }

    function aLHeure() {
        var ids = idsInscrits();
        if (simu && Array.isArray(simu.inscrits_a_l_heure)) return ids.filter(function (id) { return simu.inscrits_a_l_heure.indexOf(id) !== -1; });
        return ids;
    }

    /* Ajoutes a la main : presence confirmee sans ✅ (vocal, message...) */
    function ajoutes() { return (compo && compo.ajoutes) || []; }

    function estAjoute(cle) {
        return ajoutes().some(function (a) { return a.joueur === cle; });
    }

    function enRetard() {
        if (!simu || !Array.isArray(simu.inscrits_a_l_heure)) return [];
        return idsInscrits().filter(function (id) { return simu.inscrits_a_l_heure.indexOf(id) === -1 && !estAjoute(id); });
    }

    /* Ceux qui jouent : les ✅ a l'heure et les ajoutes a la main */
    function participants() {
        var ids = aLHeure();
        ajoutes().forEach(function (a) { if (ids.indexOf(a.joueur) === -1) ids.push(a.joueur); });
        return ids;
    }

    function nomDiscord(cle) {
        var i = (simu && simu.inscrits || []).filter(function (x) { return x.discord_id === cle; })[0]
            || ajoutes().filter(function (x) { return x.joueur === cle; })[0];
        return i ? i.nom : null;
    }

    function joueur(cle, nomDeSecours) {
        var nd = nomDiscord(cle);
        if (annuaire[cle]) {
            /* Compte du site sans pseudo choisi (user_xxxx) : son nom Discord parle mieux */
            if (/^user_[0-9a-f]+$/i.test(annuaire[cle].nom) && nd) return Object.assign({}, annuaire[cle], { nom: nd });
            return annuaire[cle];
        }
        return { cle: cle, nom: nd || nomDeSecours || 'Joueur', site: false, classes: [], principale: null, points: 0 };
    }

    function entree(cle) {
        var j = joueur(cle);
        return { joueur: cle, nom: j.nom, classe: j.principale || '' };
    }

    /* === COMPO AUTOMATIQUE ===
       Le plus grand nombre d'equipes completes, toutes formules confondues (a
       nombre egal, la premiere formule d'abord), par couplage joueurs/postes,
       les plus forts d'abord pour qu'ils jouent en priorite. Puis chaque poste
       est reparti en serpentin selon les points PvP pour equilibrer les
       equipes. Le reste va en remplacants. */
    function composerAuto(confirmer) {
        if (confirmer && compo && !compo.auto) {
            demander({
                icone: ICONE_RECOMPOSER,
                titre: 'Recomposer les équipes ?',
                texte: 'Tu as modifié la compo à la main. Une nouvelle proposition automatique remplacera tes changements.',
                non: 'Garder ma compo',
                oui: 'Recomposer'
            }).then(function (ok) { if (ok) composerAuto(false); });
            return;
        }
        var manuels = ajoutes();
        var joueurs = participants().map(function (id) { return joueur(id); })
            .sort(function (a, b) { return (b.points - a.points) || a.nom.localeCompare(b.nom); });
        var res = meilleuresEquipes(joueurs);
        var equipes = res.equipes;
        var restants = res.restants;
        equipes.forEach(function (e, i) { e.nom = 'Team ' + (i + 1); });
        compo = {
            auto: true,
            equipes: equipes,
            remplacants: restants.map(function (j) { return { joueur: j.cle, nom: j.nom, classe: j.principale || '' }; }),
            retardataires: enRetard().map(entree),
            ajoutes: manuels
        };
        sauver();
        renderTout();
    }

    /* Pas de doublon de classe dans une equipe : « Autre » demande une classe
       que les postes nommes de la formule n'ont pas deja */
    function nommes(modele) {
        return modele.filter(function (p) { return p !== '*'; });
    }

    function peutJouer(j, poste, modele) {
        if (poste !== '*') return j.classes.indexOf(poste) !== -1;
        var n = nommes(modele);
        return j.classes.some(function (c) { return n.indexOf(c) === -1; });
    }

    /* Nombre d'equipes par formule pour un total donne, la premiere formule
       la plus representee d'abord : [2, 0], [1, 1], [0, 2] */
    function repartitions(total, nbFormules) {
        if (nbFormules === 1) return [[total]];
        var liste = [];
        for (var k = total; k >= 0; k--) {
            repartitions(total - k, nbFormules - 1).forEach(function (suite) { liste.push([k].concat(suite)); });
        }
        return liste;
    }

    function meilleuresEquipes(joueurs) {
        var connus = joueurs.filter(function (j) { return j.classes.length; });
        var taille = Math.min.apply(null, modeles.map(function (m) { return m.length; }));
        for (var total = Math.floor(connus.length / taille); total >= 1; total--) {
            var essais = repartitions(total, modeles.length);
            for (var r = 0; r < essais.length; r++) {
                var nb = essais[r];
                var postes = [];
                nb.forEach(function (k, mi) {
                    modeles[mi].forEach(function (p, pi) { for (var n = 0; n < k; n++) postes.push({ poste: p, pi: pi, mi: mi }); });
                });
                if (postes.length > connus.length) continue;
                var titulaire = coupler(connus, postes);
                if (titulaire.indexOf(-1) !== -1) continue;
                var equipes = [];
                nb.forEach(function (k, mi) {
                    if (!k) return;
                    var modele = modeles[mi];
                    var parIndex = modele.map(function () { return []; });
                    postes.forEach(function (s, si) { if (s.mi === mi) parIndex[s.pi].push(connus[titulaire[si]]); });
                    var places = [];
                    for (var e = 0; e < k; e++) places.push(modele.map(function () { return null; }));
                    parIndex.forEach(function (liste, pi) {
                        liste.sort(function (a, b) { return b.points - a.points; });
                        liste.forEach(function (j, rang) {
                            var cible = pi % 2 === 0 ? rang : k - 1 - rang;
                            places[cible][pi] = { joueur: j.cle, nom: j.nom, classe: classeAuPoste(j, modele[pi], modele) };
                        });
                    });
                    places.forEach(function (p) { equipes.push({ modele: mi, places: p }); });
                });
                var pris = {};
                equipes.forEach(function (eq) { eq.places.forEach(function (p) { pris[p.joueur] = true; }); });
                return { equipes: equipes, restants: joueurs.filter(function (j) { return !pris[j.cle]; }) };
            }
        }
        return { equipes: [], restants: joueurs };
    }

    /* Couplage maximal (chemins augmentants), joueurs pris dans l'ordre de priorite */
    function coupler(joueurs, postes) {
        var titulaire = postes.map(function () { return -1; });
        function placer(ji, vus) {
            for (var s = 0; s < postes.length; s++) {
                if (vus[s] || !peutJouer(joueurs[ji], postes[s].poste, modeles[postes[s].mi])) continue;
                vus[s] = true;
                if (titulaire[s] === -1 || placer(titulaire[s], vus)) { titulaire[s] = ji; return true; }
            }
            return false;
        }
        for (var ji = 0; ji < joueurs.length; ji++) placer(ji, {});
        return titulaire;
    }

    /* Classe jouee : celle du poste ; pour « Autre », sa principale si l'equipe
       ne l'a pas deja, sinon sa premiere classe hors des postes de la formule */
    function classeAuPoste(j, poste, modele) {
        if (poste !== '*') return poste;
        var n = nommes(modele);
        if (j.principale && n.indexOf(j.principale) === -1) return j.principale;
        var hors = j.classes.filter(function (c) { return n.indexOf(c) === -1; });
        return hors[0] || j.principale || j.classes[0] || '';
    }

    /* Classes deja jouees dans l'equipe e, sans compter la place i */
    function classesEquipe(e, sauf) {
        return compo.equipes[e].places
            .filter(function (p, i) { return i !== sauf && p && p.joueur && p.classe; })
            .map(function (p) { return p.classe; });
    }

    /* Nouveaux inscrits a l'heure -> remplacants, nouveaux retardataires -> retardataires */
    function synchroniserBancs() {
        if (!compo) return false;
        var places = {};
        tousLesJoueurs().forEach(function (cle) { places[cle] = true; });
        var change = false;
        participants().forEach(function (id) { if (!places[id]) { compo.remplacants.push(entree(id)); places[id] = true; change = true; } });
        enRetard().forEach(function (id) { if (!places[id]) { compo.retardataires.push(entree(id)); places[id] = true; change = true; } });
        return change;
    }

    function tousLesJoueurs() {
        var cles = [];
        if (!compo) return cles;
        compo.equipes.forEach(function (eq) { eq.places.forEach(function (p) { if (p && p.joueur) cles.push(p.joueur); }); });
        compo.remplacants.concat(compo.retardataires).forEach(function (r) { cles.push(r.joueur); });
        return cles;
    }

    /* === DEPLACEMENTS === */
    function localiser(cle) {
        for (var e = 0; e < compo.equipes.length; e++) {
            for (var i = 0; i < compo.equipes[e].places.length; i++) {
                var p = compo.equipes[e].places[i];
                if (p && p.joueur === cle) return { type: 'place', e: e, i: i };
            }
        }
        var bancs = ['remplacants', 'retardataires'];
        for (var b = 0; b < bancs.length; b++) {
            var idx = compo[bancs[b]].map(function (r) { return r.joueur; }).indexOf(cle);
            if (idx !== -1) return { type: 'banc', banc: bancs[b], index: idx };
        }
        return null;
    }

    function lire(loc) {
        return loc.type === 'place' ? compo.equipes[loc.e].places[loc.i] : compo[loc.banc][loc.index];
    }

    function posteDe(e, i) {
        var m = modeles[compo.equipes[e].modele] || modeles[0];
        return m[i] || '*';
    }

    /* Classe du joueur pose a la place i de l'equipe e. « Autre » : une classe
       que l'equipe n'a pas deja (ni ses postes nommes, ni ses autres joueurs) */
    function classePourPoste(ent, poste, e, i) {
        var j = joueur(ent.joueur, ent.nom);
        if (poste !== '*') return j.classes.indexOf(poste) !== -1 ? poste : (ent.classe || j.principale || '');
        var modele = modeles[compo.equipes[e].modele] || modeles[0];
        var exclues = classesEquipe(e, i).concat(nommes(modele));
        var libre = function (c) { return !!c && exclues.indexOf(c) === -1; };
        if (libre(ent.classe)) return ent.classe;
        if (libre(j.principale)) return j.principale;
        return j.classes.filter(libre)[0] || ent.classe || j.principale || '';
    }

    function deplacer(cle, cible) {
        var src = localiser(cle);
        if (!src) return;
        var ent = lire(src);
        var occupant = null;
        if (cible.type === 'place') {
            if (src.type === 'place' && src.e === cible.e && src.i === cible.i) return;
            var place = compo.equipes[cible.e].places[cible.i];
            occupant = place && place.joueur ? place : null;
        } else if (src.type === 'banc' && src.banc === cible.banc) {
            return;
        }
        /* Retirer de la source */
        if (src.type === 'place') compo.equipes[src.e].places[src.i] = null;
        else compo[src.banc].splice(src.index, 1);
        /* Poser a la cible */
        if (cible.type === 'place') {
            compo.equipes[cible.e].places[cible.i] = { joueur: ent.joueur, nom: ent.nom, classe: classePourPoste(ent, posteDe(cible.e, cible.i), cible.e, cible.i) };
            /* Place occupee : l'occupant prend la place laissee */
            if (occupant) {
                if (src.type === 'place') {
                    compo.equipes[src.e].places[src.i] = { joueur: occupant.joueur, nom: occupant.nom, classe: classePourPoste(occupant, posteDe(src.e, src.i), src.e, src.i) };
                } else {
                    compo[src.banc].splice(src.index, 0, { joueur: occupant.joueur, nom: occupant.nom, classe: occupant.classe });
                }
            }
        } else {
            compo[cible.banc].push({ joueur: ent.joueur, nom: ent.nom, classe: ent.classe });
        }
        compo.auto = false;
        sauver();
        renderTout();
    }

    function cibleDepuis(el) {
        var place = el.closest('.simu-place');
        if (place) return { type: 'place', e: parseInt(place.getAttribute('data-e'), 10), i: parseInt(place.getAttribute('data-i'), 10) };
        var banc = el.closest('.simu-banc');
        if (banc) return { type: 'banc', banc: banc.getAttribute('data-banc') };
        return null;
    }

    /* === AJOUT A LA MAIN ===
       Un joueur qui a confirme sa presence autrement qu'en cochant ✅ :
       recherche parmi les membres du Discord et les comptes du site. */
    function sansAccent(s) {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    }

    function candidats() {
        var parCle = {};
        (membresDiscord || []).forEach(function (m) {
            parCle[m.discord_id] = { cle: m.discord_id, nomDiscord: m.nom, pseudo: m.pseudo };
        });
        Object.keys(annuaire).forEach(function (cle) {
            parCle[cle] = Object.assign(parCle[cle] || { cle: cle }, { site: annuaire[cle] });
        });
        return Object.keys(parCle).map(function (cle) {
            var c = parCle[cle];
            var nomSite = c.site && !/^user_[0-9a-f]+$/i.test(c.site.nom) ? c.site.nom : null;
            c.nom = nomSite || c.nomDiscord || (c.site && c.site.nom) || c.pseudo || 'Joueur';
            c.cherche = sansAccent([c.nom, c.nomDiscord, c.pseudo].filter(Boolean).join(' '));
            return c;
        });
    }

    async function basculerAjout() {
        var panneau = document.getElementById('simu-ajout');
        if (panneau.hidden && (!simu || !compo)) { toast('Choisis d\'abord une annonce', 'error'); return; }
        panneau.hidden = !panneau.hidden;
        if (panneau.hidden) return;
        var champ = document.getElementById('simu-ajout-recherche');
        champ.value = '';
        champ.focus();
        rechercherAjout();
        if (membresDiscord === null) {
            try {
                membresDiscord = (await api('membres')).membres || [];
            } catch (e) {
                membresDiscord = [];
                toast('Membres du Discord indisponibles : recherche parmi les comptes du site seulement', 'error');
            }
            rechercherAjout();
        }
    }

    function rechercherAjout() {
        var panneau = document.getElementById('simu-ajout');
        if (panneau.hidden) return;
        var saisie = document.getElementById('simu-ajout-recherche').value.trim();
        var q = sansAccent(saisie);
        var bloc = document.getElementById('simu-ajout-resultats');
        if (membresDiscord === null) { bloc.innerHTML = '<p class="text-muted simu-ajout__info">Chargement des membres du Discord...</p>'; return; }
        if (!q) { bloc.innerHTML = '<p class="text-muted simu-ajout__info">Tape le début de son pseudo, Discord ou site.</p>'; return; }
        var dejaLa = tousLesJoueurs();
        var trouves = candidats().filter(function (c) { return c.cherche.indexOf(q) !== -1; })
            .sort(function (a, b) {
                var da = sansAccent(a.nom).indexOf(q) === 0 ? 0 : 1, db = sansAccent(b.nom).indexOf(q) === 0 ? 0 : 1;
                return (da - db) || ((b.site ? 1 : 0) - (a.site ? 1 : 0)) || a.nom.localeCompare(b.nom);
            })
            .slice(0, 8);
        if (!trouves.length) {
            bloc.innerHTML = '<p class="text-muted simu-ajout__info">Personne sur le Discord ni sur le site avec ce pseudo.</p>'
                + '<button type="button" class="btn btn--secondary btn--small simu-ajout__libre" data-nom="' + esc(saisie) + '">Ajouter « ' + esc(saisie) + ' » sans tag Discord</button>';
            return;
        }
        bloc.innerHTML = trouves.map(function (c) {
            var pris = dejaLa.indexOf(c.cle) !== -1;
            var infos = c.site ? (c.site.classes.length ? c.site.classes.map(court).join(', ') : 'aucune classe sur son profil') : 'pas de compte sur le site';
            /* Nom Discord different, ou identifiant Discord quand c'est lui qui correspond a la recherche */
            var alias = c.nomDiscord && c.nomDiscord !== c.nom ? c.nomDiscord : null;
            if (c.pseudo && sansAccent(c.nom).indexOf(q) === -1 && sansAccent(alias).indexOf(q) === -1) alias = '@' + c.pseudo;
            if (alias) infos = 'Discord : ' + alias + ' · ' + infos;
            return '<button type="button" class="simu-ajout__choix" data-cle="' + esc(c.cle) + '" data-nom="' + esc(c.nom) + '"' + (pris ? ' disabled' : '') + '>'
                + '<span class="simu-ajout__nom notranslate">' + esc(c.nom) + '</span>'
                + '<span class="simu-ajout__infos">' + esc(pris ? 'déjà dans la compo' : infos) + '</span>'
                + '</button>';
        }).join('');
    }

    /* Compo automatique encore intacte : refaite avec lui ; sinon il va en remplacant */
    function ajouterJoueur(cle, nom) {
        if (!compo || !cle) return;
        if (tousLesJoueurs().indexOf(cle) !== -1) { toast(nom + ' est déjà dans la compo', 'info'); return; }
        compo.ajoutes = ajoutes().filter(function (a) { return a.joueur !== cle; }).concat([{ joueur: cle, nom: nom }]);
        if (compo.auto) {
            composerAuto(false);
        } else {
            compo.remplacants.push(entree(cle));
            sauver();
            renderTout();
        }
        var loc = localiser(cle);
        toast(nom + (loc && loc.type === 'place' ? ' ajouté dans la ' + compo.equipes[loc.e].nom : ' ajouté aux remplaçants'), 'success');
        var champ = document.getElementById('simu-ajout-recherche');
        champ.value = '';
        rechercherAjout();
        champ.focus();
    }

    function retirerAjoute(cle) {
        var nom = joueur(cle).nom;
        var loc = localiser(cle);
        compo.ajoutes = ajoutes().filter(function (a) { return a.joueur !== cle; });
        if (loc) {
            if (loc.type === 'place') compo.equipes[loc.e].places[loc.i] = null;
            else compo[loc.banc].splice(loc.index, 1);
        }
        if (compo.auto) composerAuto(false);
        else { sauver(); renderTout(); }
        toast(nom + ' retiré de la compo', 'info');
    }

    /* === SAUVEGARDE ET TEMPS REEL === */
    function sauver() {
        if (!simu) return;
        clearTimeout(minuteurSauvegarde);
        minuteurSauvegarde = setTimeout(async function () {
            var fin = document.getElementById('simu-fin');
            var maj = { compo: compo, message_fin: fin && fin.value.trim() ? fin.value.trim() : null, maj_par: moi.id, maj_le: new Date().toISOString() };
            var r = await window.REN.supabase.from('simu_events').update(maj).eq('id', simu.id);
            if (r.error) toast('Sauvegarde impossible : ' + r.error.message, 'error');
        }, 500);
    }

    /* Deux organisateurs sur la meme compo : chacun voit les changements de l'autre */
    function abonner() {
        if (window.REN.demoLocale || !simu || !window.REN.supabase.channel) return;
        if (canal) window.REN.supabase.removeChannel(canal);
        canal = window.REN.supabase.channel('simu-' + simu.id)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'simu_events', filter: 'id=eq.' + simu.id }, function (p) {
                var n = p && p.new;
                if (!n || !n.id) return;
                var parUnAutre = n.maj_par && n.maj_par !== moi.id && n.compo && JSON.stringify(n.compo) !== JSON.stringify(compo);
                simu = n;
                if (parUnAutre) {
                    compo = n.compo;
                    toast('Compo modifiée par un autre organisateur', 'info');
                }
                renderTout();
            })
            .subscribe();
    }

    async function majReglages() {
        var hhmm = document.getElementById('simu-lancement').value;
        var avant = Math.max(0, Math.min(720, parseInt(document.getElementById('simu-avant').value, 10) || 0));
        var lancement = hhmm ? parisVersIso(jourParis(simu.lancement || simu.annonce_le), hhmm) : null;
        var r = await window.REN.supabase.from('simu_events')
            .update({ lancement: lancement, lecture_avant_min: avant, maj_par: moi.id, maj_le: new Date().toISOString() })
            .eq('id', simu.id).select().single();
        if (r.error) { toast('Enregistrement impossible : ' + r.error.message, 'error'); return; }
        simu = r.data;
        renderTout();
        tic();
    }

    /* === PUBLICATION === */
    function heureCourte(iso) {
        var s = new Date(iso).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).split(':');
        return parseInt(s[0], 10) + 'h' + (s[1] !== '00' ? s[1] : '');
    }

    function finParDefaut() {
        if (!simu || !simu.lancement) return 'Chacun dans le vocal de son équipe (Voc 1, Voc 2...).';
        return 'RDV ' + heureCourte(new Date(new Date(simu.lancement).getTime() - 5 * 60000).toISOString())
            + ', chacun dans le vocal de son équipe (Voc 1, Voc 2...). Lancement ' + heureCourte(simu.lancement) + '.';
    }

    function finMessage() {
        var champ = document.getElementById('simu-fin');
        return (champ && champ.value.trim()) || finParDefaut();
    }

    function mention(ent) {
        return /^\d{5,25}$/.test(String(ent.joueur)) ? '<@' + ent.joueur + '>' : (ent.nom || 'Joueur');
    }

    function messageDiscord() {
        var l = ['⚔️ **Équipes' + (simu && simu.lancement ? ' pour la simu de ' + heureCourte(simu.lancement) : '') + '**'];
        l.push('Dans l\'ordre : ' + libelleModele(modeles[0]));
        l.push('');
        compo.equipes.forEach(function (eq) {
            var noms = eq.places.map(function (p) { return p && p.joueur ? mention(p) : '(place libre)'; });
            l.push('**' + eq.nom + '**' + (eq.modele ? ' (' + libelleModele(modeles[eq.modele] || modeles[0]) + ')' : '') + ' : ' + noms.join(' / '));
        });
        var ligneBanc = function (titre, liste) {
            return '**' + titre + '** : ' + liste.map(function (r) { return mention(r) + (r.classe ? ' (' + court(r.classe) + ')' : ''); }).join(', ');
        };
        if (compo.remplacants.length || compo.retardataires.length) l.push('');
        if (compo.remplacants.length) l.push(ligneBanc('Remplaçants', compo.remplacants));
        if (compo.retardataires.length) l.push(ligneBanc('Retardataires', compo.retardataires));
        l.push('', finMessage());
        return l.join('\n');
    }

    function mentions() {
        return tousLesJoueurs().filter(function (c) { return /^\d{5,25}$/.test(String(c)); });
    }

    async function publier() {
        if (!simu || !compo || !compo.equipes.length) { toast('Aucune équipe à publier', 'error'); return; }
        var texte = messageDiscord();
        var tags = mentions();
        var maj = !!simu.publie_message_id;
        var ok = await demander({
            icone: ICONE_PUBLIER,
            titre: maj ? 'Mettre à jour le message dans #event ?' : 'Publier les équipes dans #event ?',
            texte: maj
                ? 'Une modification ne notifie personne : préviens toi-même les joueurs ajoutés.'
                : 'Les ' + tags.length + ' joueurs seront tagués.',
            non: 'Annuler',
            oui: maj ? 'Mettre à jour' : 'Publier'
        });
        if (!ok) return;
        var bouton = document.getElementById('simu-publier');
        bouton.disabled = true;
        try {
            var r = await api('publier', { simu_id: simu.id, texte: texte, mentions: tags });
            if (r.aBlanc) {
                document.getElementById('simu-publie-info').textContent = 'Mode test : le message est prêt (' + texte.length + ' caractères, ' + tags.length + ' joueurs tagués), rien n\'a été envoyé.';
                toast('Mode test : rien n\'a été envoyé', 'info');
            } else {
                simu = r.simu;
                toast(r.modifier ? 'Message mis à jour dans #event' : 'Équipes publiées dans #event', 'success');
                renderPublication();
            }
        } catch (e) {
            toast(e.message, 'error');
        }
        bouton.disabled = false;
    }

    /* === AFFICHAGE === */
    function renderTout() {
        renderAnnonce();
        renderEtat();
        renderEquipes();
        renderBancs();
        renderPublication();
        rechercherAjout();
    }

    function etat(txt) {
        document.getElementById('simu-etat').textContent = txt;
    }

    function heureParis(iso) {
        return new Date(iso).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
    }

    function renderAnnonce() {
        var bloc = document.getElementById('simu-texte');
        if (!simu) { bloc.innerHTML = ''; return; }
        var lien = 'https://discord.com/channels/' + SERVEUR_DISCORD + '/' + simu.discord_channel_id + '/' + simu.discord_message_id;
        var texte = esc(String(simu.texte || '').replace(/<[@#][!&]?\d+>/g, '@...')).replace(/\n/g, '<br>');
        bloc.innerHTML = '<span class="simu-annonce__auteur">' + esc(simu.auteur_nom || '') + '</span> ' + texte
            + ' <a href="' + lien + '" target="_blank" rel="noopener">Voir sur Discord</a>';
        var champLancement = document.getElementById('simu-lancement');
        if (document.activeElement !== champLancement) champLancement.value = simu.lancement ? heureParis(simu.lancement) : '';
        var champAvant = document.getElementById('simu-avant');
        if (document.activeElement !== champAvant) champAvant.value = simu.lecture_avant_min;
        var champFin = document.getElementById('simu-fin');
        if (document.activeElement !== champFin) {
            champFin.value = simu.message_fin || '';
            champFin.placeholder = finParDefaut();
        }
    }

    function dureeTexte(ms) {
        var min = Math.max(0, Math.round(ms / 60000));
        return min >= 60 ? Math.floor(min / 60) + ' h ' + String(min % 60).padStart(2, '0') : min + ' min';
    }

    function renderEtat() {
        if (!simu) { etat(''); return; }
        var nbHeure = aLHeure().length, nbRetard = enRetard().length;
        var sansCompte = idsInscrits().filter(function (id) { return !annuaire[id]; }).length;
        var txt;
        if (!simu.lancement) {
            txt = 'Indique l\'heure de lancement : la liste des inscrits se figera ' + simu.lecture_avant_min + ' min avant. Pour l\'instant, ' + idsInscrits().length + ' inscrits.';
        } else if (Array.isArray(simu.inscrits_a_l_heure)) {
            txt = 'Inscrits figés à ' + heureParis(simu.cloture_le) + ' : ' + nbHeure + ' à l\'heure, ' + nbRetard + ' retardataire' + (nbRetard > 1 ? 's' : '') + ' depuis.';
        } else if (Date.now() < cloture()) {
            txt = 'Lecture des ✅ à ' + heureParis(new Date(cloture()).toISOString()) + ' (dans ' + dureeTexte(cloture() - Date.now()) + '). En attendant, la compo suit les ✅ actuels : ' + nbHeure + ' inscrits.';
        } else {
            txt = 'Heure de lecture passée : la liste se fige à la prochaine lecture.';
        }
        if (simu.lu_le) txt += ' Dernière lecture à ' + heureParis(simu.lu_le) + '.';
        if (ajoutes().length) txt += ' ' + ajoutes().length + ' ajouté' + (ajoutes().length > 1 ? 's' : '') + ' à la main.';
        if (sansCompte) txt += ' ' + sansCompte + ' sans compte relié sur le site (classe inconnue).';
        etat(txt);
    }

    /* Menu de classe : seulement les siennes ; toutes si le site ne lui en connait aucune */
    function optionsClasses(j, actuelle) {
        var liste = j.classes.length ? j.classes.slice() : classes.slice();
        if (actuelle && liste.indexOf(actuelle) === -1) liste.push(actuelle);
        var opt = function (c) { return '<option value="' + esc(c) + '"' + (c === actuelle ? ' selected' : '') + '>' + esc(court(c)) + '</option>'; };
        return (actuelle ? '' : '<option value="" selected>classe ?</option>') + liste.map(opt).join('');
    }

    function carteJoueur(ent, poste, doublon) {
        var j = joueur(ent.joueur, ent.nom);
        var coche = idsInscrits().indexOf(ent.joueur) !== -1;
        var ajoute = estAjoute(ent.joueur);
        var inscrit = coche || ajoute;
        var horsPoste = poste && poste !== '*' && ent.classe !== poste;
        var classesCss = ['simu-joueur'];
        if (selection === ent.joueur) classesCss.push('simu-joueur--selection');
        if (horsPoste) classesCss.push('simu-joueur--hors-poste');
        if (doublon) classesCss.push('simu-joueur--doublon');
        if (!j.site) classesCss.push('simu-joueur--sans-compte');
        if (ajoute) classesCss.push('simu-joueur--ajoute');
        if (!inscrit) classesCss.push('simu-joueur--desinscrit');
        var notes = [];
        if (!inscrit) notes.push('a retiré son ✅');
        if (doublon) notes.push(court(ent.classe) + ' en double dans l\'équipe');
        if (horsPoste) notes.push('pas ' + court(poste) + ' sur son profil');
        if (!j.site) notes.push('sans compte site');
        var titre = (ajoute ? ['ajouté à la main'] : []).concat(notes).join(', ');
        return '<div class="' + classesCss.join(' ') + '" draggable="true" data-cle="' + esc(ent.joueur) + '"'
            + (titre ? ' title="' + esc(titre) + '"' : '') + '>'
            + '<div class="simu-joueur__ligne">'
                + '<span class="simu-joueur__nom notranslate">' + esc(j.nom || ent.nom) + '</span>'
                + '<select class="simu-joueur__classe" data-cle="' + esc(ent.joueur) + '" aria-label="Classe jouée">' + optionsClasses(j, ent.classe) + '</select>'
                + (ajoute && !coche ? '<button type="button" class="simu-joueur__retirer" data-cle="' + esc(ent.joueur) + '" title="Retirer ce joueur de la compo" aria-label="Retirer ce joueur de la compo">&times;</button>' : '')
            + '</div>'
            + (ajoute || notes.length
                ? '<span class="simu-joueur__note">'
                    + (ajoute ? '<span class="simu-joueur__ajoute">ajouté à la main</span>' + (notes.length ? ' · ' : '') : '')
                    + (notes.length ? esc(notes[0]) : '')
                  + '</span>'
                : '')
            + '</div>';
    }

    function renderEquipes() {
        var bloc = document.getElementById('simu-equipes');
        if (!compo || !compo.equipes.length) {
            bloc.innerHTML = '<p class="text-muted simu-vide">' + (simu && participants().length
                ? 'Pas assez de joueurs avec les bonnes classes pour une équipe complète : ajoute une équipe et place les joueurs à la main.'
                : 'Pas encore d\'inscrits.') + '</p>';
            return;
        }
        bloc.innerHTML = compo.equipes.map(function (eq, e) {
            var modele = modeles[eq.modele] || modeles[0];
            var force = 0;
            /* Doublons de classe dans l'equipe : signales sur les cartes concernees */
            var nbClasse = {};
            eq.places.forEach(function (p) { if (p && p.joueur && p.classe) nbClasse[p.classe] = (nbClasse[p.classe] || 0) + 1; });
            var places = eq.places.map(function (p, i) {
                var poste = modele[i] || '*';
                if (p && p.joueur) force += joueur(p.joueur, p.nom).points || 0;
                return '<div class="simu-place' + (p && p.joueur ? '' : ' simu-place--vide') + '" data-e="' + e + '" data-i="' + i + '" style="--poste-c:' + (COULEUR[poste] || COULEUR['*']) + '">'
                    + '<span class="simu-place__poste">' + esc(court(poste)) + '</span>'
                    + (p && p.joueur ? carteJoueur(p, poste, nbClasse[p.classe] > 1) : '<span class="simu-place__libre">Place libre</span>')
                    + '</div>';
            }).join('');
            return '<div class="simu-equipe">'
                + '<div class="simu-equipe__tete">'
                    + '<div class="simu-equipe__titre">'
                        + '<strong>' + esc(eq.nom) + '</strong><span class="simu-equipe__voc">Voc ' + (e + 1) + '</span>'
                        + '<button type="button" class="simu-equipe__suppr" data-e="' + e + '" title="Supprimer l\'équipe (ses joueurs passent en remplaçants)">&times;</button>'
                    + '</div>'
                    + '<select class="simu-equipe__modele" data-e="' + e + '" aria-label="Formule de l\'équipe">'
                        + modeles.map(function (m, mi) { return '<option value="' + mi + '"' + (mi === eq.modele ? ' selected' : '') + '>' + esc(libelleModele(m)) + '</option>'; }).join('')
                    + '</select>'
                + '</div>'
                + places
                + '<div class="simu-equipe__pied">' + force + ' pts PvP</div>'
                + '</div>';
        }).join('');
    }

    function renderBancs() {
        ['remplacants', 'retardataires'].forEach(function (b) {
            var liste = compo ? compo[b] : [];
            document.getElementById('simu-' + b).innerHTML = liste.length
                ? liste.map(function (r) { return carteJoueur(r, null); }).join('')
                : '<span class="text-muted simu-banc__vide">' + (b === 'remplacants' ? 'Personne' : 'Personne pour l\'instant') + '</span>';
            document.getElementById('simu-n-' + b).textContent = liste.length ? '(' + liste.length + ')' : '';
        });
    }

    function renderPublication() {
        var apercu = document.getElementById('simu-apercu');
        var info = document.getElementById('simu-publie-info');
        var bouton = document.getElementById('simu-publier');
        if (!simu || !compo) { apercu.innerHTML = ''; return; }
        var lisible = esc(messageDiscord().replace(/<@(\d+)>/g, function (m, id) { return '@' + joueur(id).nom; }))
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        apercu.innerHTML = lisible;
        bouton.textContent = simu.publie_message_id ? 'Mettre à jour le message dans #event' : 'Publier dans #event';
        if (simu.publie_le) {
            info.innerHTML = 'Publié à ' + esc(heureParis(simu.publie_le)) + ' : <a href="https://discord.com/channels/' + SERVEUR_DISCORD + '/' + esc(simu.discord_channel_id) + '/' + esc(simu.publie_message_id) + '" target="_blank" rel="noopener">voir le message</a>.';
        } else if (!window.REN.demoLocale) {
            info.textContent = mentions().length + ' joueurs seront tagués.';
        }
    }

    /* === VUE JOUEUR (lecture seule) ===
       Pour les membres qui n'organisent pas : la prochaine simu, leur place et
       les equipes, sans rien pouvoir modifier. Lit simu_events directement. */
    async function vueJoueur() {
        var chargement = document.getElementById('simu-chargement');
        document.getElementById('simu-titre').textContent = 'Simu';
        document.getElementById('simu-intro').textContent = 'Les équipes de la prochaine simu, préparées par les organisateurs puis publiées dans #event avec un tag pour chaque joueur. Ta place est en surbrillance.';
        if (window.REN.demoLocale) {
            var badge = document.getElementById('simu-badge-test');
            badge.textContent = 'Aperçu local : vue de ' + moi.username;
            badge.hidden = false;
        }
        try {
            await Promise.all([chargerReglages(), chargerAnnuaire()]);
            simu = await prochaineSimu();
        } catch (e) {
            chargement.style.display = 'none';
            toast('Chargement impossible : ' + e.message, 'error');
            return;
        }
        compo = (simu && simu.compo) || null;
        chargement.style.display = 'none';
        document.getElementById('simu-vue').hidden = false;
        renderVueJoueur();
        abonnerVue();
    }

    /* La simu a venir la plus proche (ou lancee il y a moins de 3 h) */
    async function prochaineSimu() {
        var r = await window.REN.supabase.from('simu_events').select('*')
            .gte('annonce_le', new Date(Date.now() - 3 * 86400000).toISOString())
            .order('annonce_le', { ascending: false }).limit(10);
        if (r.error) throw new Error(r.error.message);
        var limite = Date.now() - 3 * 3600000;
        var quand = function (s) { return new Date(s.lancement || s.annonce_le).getTime(); };
        var liste = (r.data || []).filter(function (s) { return !s.lancement || quand(s) >= limite; });
        liste.sort(function (a, b) { return quand(a) - quand(b); });
        return liste[0] || null;
    }

    function abonnerVue() {
        if (window.REN.demoLocale || !window.REN.supabase.channel) return;
        window.REN.supabase.channel('simu-vue')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'simu_events' }, async function () {
                try {
                    simu = await prochaineSimu();
                    compo = (simu && simu.compo) || null;
                    renderVueJoueur();
                } catch (e) { /* nouvel essai au prochain changement */ }
            })
            .subscribe();
    }

    function titreSimu() {
        if (!simu.lancement) return 'Simu annoncée par ' + (simu.auteur_nom || '?');
        var jour = jourParis(simu.lancement);
        var heure = heureCourte(simu.lancement);
        if (jour === jourParis(new Date().toISOString())) {
            return (new Date(simu.lancement).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false }) >= '18' ? 'Simu de ce soir' : 'Simu d\'aujourd\'hui') + ', ' + heure;
        }
        if (jour === jourParis(new Date(Date.now() + 86400000).toISOString())) return 'Simu de demain, ' + heure;
        return 'Simu du ' + new Date(simu.lancement).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long' }) + ', ' + heure;
    }

    /* Ou est le joueur connecte dans la compo */
    function maPlace() {
        var id = moi.discord_id;
        if (!id) return { type: 'sans-discord' };
        var loc = compo ? localiser(id) : null;
        if (loc && loc.type === 'place') return { type: 'equipe', e: loc.e, poste: posteDe(loc.e, loc.i), classe: compo.equipes[loc.e].places[loc.i].classe };
        if (loc) return { type: loc.banc };
        if (idsInscrits().indexOf(id) !== -1 || estAjoute(id)) return { type: 'inscrit' };
        return { type: 'absent' };
    }

    function texteMaPlace(lienAnnonce) {
        var p = maPlace();
        var publie = !!simu.publie_le;
        var provisoire = publie ? '' : ' <span class="simu-vue__provisoire">(proposition, peut encore changer)</span>';
        if (p.type === 'equipe') {
            var eq = compo.equipes[p.e];
            var poste = p.poste === '*'
                ? 'en <strong>Autre</strong>' + (p.classe ? ' avec ton <strong>' + esc(court(p.classe)) + '</strong>' : '')
                : 'au poste <strong>' + esc(court(p.poste)) + '</strong>';
            return 'Tu joues dans la <strong>' + esc(eq.nom) + '</strong> ' + poste + ', vocal <strong>Voc ' + (p.e + 1) + '</strong>.' + provisoire;
        }
        if (p.type === 'remplacants') return 'Tu es <strong>remplaçant</strong> : tu entres si une place se libère, reste dispo au lancement.' + provisoire;
        if (p.type === 'retardataires') return 'Tu es <strong>retardataire</strong> : tu as coché après la lecture des ✅, tu passes après les remplaçants.' + provisoire;
        if (p.type === 'inscrit') return 'Tu es inscrit ✅. Les équipes ne sont pas encore faites.';
        if (p.type === 'sans-discord') return 'Relie ton compte Discord à ton profil pour retrouver ta place ici.';
        return 'Tu n\'es pas inscrit. Pour venir, coche ✅ sous <a href="' + lienAnnonce + '" target="_blank" rel="noopener">l\'annonce dans #event</a>.';
    }

    function carteLecture(ent) {
        var j = joueur(ent.joueur, ent.nom);
        var estMoi = !!moi.discord_id && ent.joueur === moi.discord_id;
        return '<div class="simu-joueur simu-joueur--lecture' + (estMoi ? ' simu-joueur--moi' : '') + '">'
            + '<div class="simu-joueur__ligne">'
                + '<span class="simu-joueur__nom notranslate">' + esc(j.nom || ent.nom) + '</span>'
                + (estMoi ? '<span class="simu-joueur__toi">toi</span>' : '')
                + (ent.classe ? '<span class="simu-joueur__classe-lue">' + esc(court(ent.classe)) + '</span>' : '')
            + '</div>'
            + '</div>';
    }

    function renderVueJoueur() {
        var bloc = document.getElementById('simu-vue');
        if (!simu) {
            bloc.innerHTML = '<div class="simu-carte simu-vue__vide">Aucune simu en préparation pour l\'instant. Les annonces passent dans #event : coche ✅ pour t\'inscrire.</div>';
            return;
        }
        var lien = 'https://discord.com/channels/' + SERVEUR_DISCORD + '/' + simu.discord_channel_id + '/' + simu.discord_message_id;
        var aDesEquipes = !!(compo && compo.equipes && compo.equipes.length);
        var pastilles = [];
        if (simu.publie_le) pastilles.push(['publie', 'Équipes publiées dans #event à ' + heureParis(simu.publie_le)]);
        else if (aDesEquipes) pastilles.push(['proposition', 'Proposition en cours' + (simu.maj_le ? ', mise à jour à ' + heureParis(simu.maj_le) : '')]);
        else pastilles.push(['neutre', 'Équipes en préparation']);
        if (simu.lancement) {
            pastilles.push(['neutre', Array.isArray(simu.inscrits_a_l_heure)
                ? 'Inscrits figés à ' + heureParis(simu.cloture_le || new Date(cloture()).toISOString())
                : 'Inscription par ✅ jusqu\'à ' + heureParis(new Date(cloture()).toISOString()) + ', ensuite retardataire']);
        }
        var texte = String(simu.texte || '').replace(/<[@#][!&]?\d+>/g, '').replace(/@everyone|@here/g, '').replace(/\s+/g, ' ').trim();

        var html = '<section class="simu-carte simu-vue__tete">'
            + '<div class="simu-vue__titre">' + esc(titreSimu()) + '</div>'
            + '<div class="simu-vue__pastilles">' + pastilles.map(function (p) { return '<span class="simu-vue__pastille simu-vue__pastille--' + p[0] + '">' + esc(p[1]) + '</span>'; }).join('') + '</div>'
            + '<p class="simu-vue__annonce"><strong>' + esc(simu.auteur_nom || '') + '</strong> ' + esc(texte) + ' <a href="' + lien + '" target="_blank" rel="noopener">Voir l\'annonce</a></p>'
            + '<div class="simu-vue__place"><span class="simu-vue__place-titre">Ta place</span><p class="simu-vue__place-texte">' + texteMaPlace(lien) + '</p></div>'
            + '</section>';

        if (aDesEquipes) {
            html += '<div class="simu-equipes">' + compo.equipes.map(function (eq, e) {
                var modele = modeles[eq.modele] || modeles[0];
                var avecMoi = eq.places.some(function (p) { return p && p.joueur && p.joueur === moi.discord_id; });
                var places = eq.places.map(function (p, i) {
                    var poste = modele[i] || '*';
                    return '<div class="simu-place' + (p && p.joueur ? '' : ' simu-place--vide') + '" style="--poste-c:' + (COULEUR[poste] || COULEUR['*']) + '">'
                        + '<span class="simu-place__poste">' + esc(court(poste)) + '</span>'
                        + (p && p.joueur ? carteLecture(p) : '<span class="simu-place__libre">Place libre</span>')
                        + '</div>';
                }).join('');
                return '<div class="simu-equipe' + (avecMoi ? ' simu-equipe--moi' : '') + '">'
                    + '<div class="simu-equipe__tete">'
                        + '<div class="simu-equipe__titre"><strong>' + esc(eq.nom) + '</strong><span class="simu-equipe__voc">Voc ' + (e + 1) + '</span></div>'
                        + '<span class="simu-equipe__formule">' + esc(libelleModele(modele)) + '</span>'
                    + '</div>'
                    + places
                    + '</div>';
            }).join('') + '</div>';
            var bancs = [['remplacants', 'Remplaçants', ''], ['retardataires', 'Retardataires', ' simu-banc--retard']]
                .filter(function (b) { return (compo[b[0]] || []).length; })
                .map(function (b) {
                    return '<div class="simu-banc' + b[2] + '"><h3 class="simu-banc__titre">' + b[1] + ' <span>(' + compo[b[0]].length + ')</span></h3>'
                        + '<div class="simu-banc__liste">' + compo[b[0]].map(carteLecture).join('') + '</div></div>';
                }).join('');
            if (bancs) html += '<div class="simu-bancs">' + bancs + '</div>';
        } else if (idsInscrits().length) {
            html += '<section class="simu-carte"><h2 class="recyc-section-title" style="margin-top:0;">Inscrits (' + idsInscrits().length + ')</h2><div class="simu-vue__inscrits">'
                + idsInscrits().map(function (id) {
                    return '<span class="simu-vue__inscrit' + (id === moi.discord_id ? ' simu-vue__inscrit--moi' : '') + '">' + esc(joueur(id).nom) + '</span>';
                }).join('') + '</div></section>';
        }
        bloc.innerHTML = html;
    }

    /* === EVENEMENTS === */
    function brancher() {
        var contenu = document.getElementById('simu-contenu');

        document.getElementById('simu-annonces').addEventListener('change', function (e) { if (e.target.value) ouvrir(e.target.value); });
        document.getElementById('simu-relire').addEventListener('click', function () { relire(false); });
        document.getElementById('simu-lancement').addEventListener('change', majReglages);
        document.getElementById('simu-avant').addEventListener('change', majReglages);
        document.getElementById('simu-composer').addEventListener('click', function () { composerAuto(true); });
        document.getElementById('simu-ajouter').addEventListener('click', function () {
            if (!compo) compo = { auto: false, equipes: [], remplacants: [], retardataires: [] };
            compo.equipes.push({ nom: 'Team ' + (compo.equipes.length + 1), modele: 0, places: modeles[0].map(function () { return null; }) });
            compo.auto = false;
            sauver();
            renderTout();
        });
        document.getElementById('simu-fin').addEventListener('input', function () { sauver(); renderPublication(); });
        document.getElementById('simu-publier').addEventListener('click', publier);

        /* Ajout a la main */
        var panneauAjout = document.getElementById('simu-ajout');
        var rechercheAjout = document.getElementById('simu-ajout-recherche');
        document.getElementById('simu-ajouter-joueur').addEventListener('click', basculerAjout);
        document.getElementById('simu-ajout-fermer').addEventListener('click', function () { panneauAjout.hidden = true; });
        rechercheAjout.addEventListener('input', rechercherAjout);
        rechercheAjout.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { panneauAjout.hidden = true; return; }
            if (e.key !== 'Enter') return;
            e.preventDefault();
            var premier = panneauAjout.querySelector('.simu-ajout__choix:not([disabled]), .simu-ajout__libre');
            if (premier) premier.click();
        });
        document.getElementById('simu-ajout-resultats').addEventListener('click', function (e) {
            var choix = e.target.closest('.simu-ajout__choix');
            if (choix && !choix.disabled) { ajouterJoueur(choix.getAttribute('data-cle'), choix.getAttribute('data-nom')); return; }
            var libre = e.target.closest('.simu-ajout__libre');
            if (libre) ajouterJoueur('libre:' + libre.getAttribute('data-nom'), libre.getAttribute('data-nom'));
        });

        contenu.addEventListener('change', function (e) {
            var sel = e.target.closest('.simu-joueur__classe');
            if (sel) {
                var loc = localiser(sel.getAttribute('data-cle'));
                if (loc) { lire(loc).classe = sel.value; compo.auto = false; sauver(); renderTout(); }
                return;
            }
            var mod = e.target.closest('.simu-equipe__modele');
            if (mod) {
                var ie = parseInt(mod.getAttribute('data-e'), 10);
                var eq = compo.equipes[ie];
                eq.modele = parseInt(mod.value, 10) || 0;
                var m = modeles[eq.modele];
                while (eq.places.length < m.length) eq.places.push(null);
                eq.places.forEach(function (p, i) { if (p && p.joueur) p.classe = classePourPoste(p, m[i] || '*', ie, i); });
                compo.auto = false;
                sauver();
                renderTout();
            }
        });

        contenu.addEventListener('click', function (e) {
            if (e.target.closest('select, a, input, .simu-ajout')) return;
            var retirer = e.target.closest('.simu-joueur__retirer');
            if (retirer) {
                selection = null;
                retirerAjoute(retirer.getAttribute('data-cle'));
                return;
            }
            var suppr = e.target.closest('.simu-equipe__suppr');
            if (suppr) {
                var idx = parseInt(suppr.getAttribute('data-e'), 10);
                compo.equipes[idx].places.forEach(function (p) { if (p && p.joueur) compo.remplacants.push({ joueur: p.joueur, nom: p.nom, classe: p.classe }); });
                compo.equipes.splice(idx, 1);
                compo.equipes.forEach(function (eq, i) { eq.nom = 'Team ' + (i + 1); });
                compo.auto = false;
                sauver();
                renderTout();
                return;
            }
            /* Telephone : toucher un joueur, puis l'endroit ou le mettre */
            var carte = e.target.closest('.simu-joueur');
            if (carte && !selection) { selection = carte.getAttribute('data-cle'); renderTout(); return; }
            if (selection) {
                var cible = cibleDepuis(e.target);
                var cle = selection;
                selection = null;
                if (cible && !(carte && carte.getAttribute('data-cle') === cle)) deplacer(cle, cible);
                else renderTout();
            }
        });

        contenu.addEventListener('dragstart', function (e) {
            var carte = e.target.closest && e.target.closest('.simu-joueur');
            if (!carte) return;
            e.dataTransfer.setData('text/plain', carte.getAttribute('data-cle'));
            e.dataTransfer.effectAllowed = 'move';
            carte.classList.add('simu-joueur--glisse');
        });
        contenu.addEventListener('dragend', function (e) {
            var carte = e.target.closest && e.target.closest('.simu-joueur');
            if (carte) carte.classList.remove('simu-joueur--glisse');
            contenu.querySelectorAll('.simu-cible').forEach(function (x) { x.classList.remove('simu-cible'); });
        });
        contenu.addEventListener('dragover', function (e) {
            var zone = e.target.closest('.simu-place, .simu-banc');
            if (!zone) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            contenu.querySelectorAll('.simu-cible').forEach(function (x) { if (x !== zone) x.classList.remove('simu-cible'); });
            zone.classList.add('simu-cible');
        });
        contenu.addEventListener('drop', function (e) {
            var cible = cibleDepuis(e.target);
            if (!cible) return;
            e.preventDefault();
            var cle = e.dataTransfer.getData('text/plain');
            if (cle) deplacer(cle, cible);
        });
    }

    /* === DATES (heure de Paris) === */
    function jourParis(iso) {
        return new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
    }

    function parisVersIso(jour, hhmm) {
        var essai = new Date(jour + 'T' + hhmm + ':00Z');
        var paris = new Date(essai.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
        var utc = new Date(essai.toLocaleString('en-US', { timeZone: 'UTC' }));
        return new Date(essai.getTime() - (paris - utc)).toISOString();
    }
})();
