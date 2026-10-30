/* ============================================ */
/* Redemption - Recensement : le croisement     */
/* Relie les persos en jeu, les comptes Discord */
/* et les comptes du site, puis classe chaque   */
/* personne (30/10/2026, sql/081)               */
/* ============================================ */
/* Utilisé par js/admin-recensement.js, et chargeable dans Node (module.exports) pour le tester sur les vraies données. */
(function (racine) {
    'use strict';

    /* minuscules, sans accents, sans rien d'autre que lettres et chiffres : « Moule à Gaufres » = « Moule-a-Gaufres » */
    function norm(t) {
        return String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    function cleJeu(nom) { return 'jeu:' + norm(nom); }

    /* les morceaux d'un nom Discord qui peuvent être un nom de perso : « Sarune/Kamaxou », « Saronce le roi feuillu », « sarava3 » */
    function morceaux(nom) {
        var l = [];
        function ajoute(t, min) { var n = norm(t); if (n.length >= min && l.indexOf(n) === -1) l.push(n); }
        if (!nom) return l;
        ajoute(nom, 3);
        String(nom).split(/[\/|,&()\[\]]+/).forEach(function (bout) {
            ajoute(bout, 3);
            ajoute(bout.replace(/[0-9_.\s]+$/, ''), 3); /* « waldo_93 » -> waldo */
            bout.split(/\s+/).forEach(function (mot) { ajoute(mot, 4); });
        });
        return l;
    }

    /* même personne ? un morceau de nom Discord et un nom de perso (normalisés) */
    function ressemble(m, perso) {
        if (m === perso) return true;
        if (m.length >= 6 && perso.indexOf(m) !== -1) return true; /* « sadistesdeath » dans « queensadistesdeath » */
        if (perso.length >= 6 && m.indexOf(perso) !== -1) return true; /* « elfresh » dans « elfreshito » */
        return false;
    }

    function croiser(d) {
        var noeuds = {}, parent = {}, aretes = [];
        function noeud(cle, type, obj) { noeuds[cle] = { cle: cle, type: type, obj: obj }; parent[cle] = cle; }
        function racineDe(c) { while (parent[c] !== c) { parent[c] = parent[parent[c]]; c = parent[c]; } return c; }

        (d.jeu || []).forEach(function (p) { noeud(cleJeu(p.nom), 'jeu', p); });
        (d.discord || []).forEach(function (m) { if (!m.bot) noeud('discord:' + m.id, 'discord', m); });
        (d.site || []).forEach(function (p) { noeud('site:' + p.id, 'site', p); });

        /* contenu d'un groupe (pour refuser une fusion qui mettrait deux Discord ou deux comptes du site ensemble) */
        var contenu = {};
        Object.keys(noeuds).forEach(function (c) { var t = noeuds[c].type; contenu[c] = { discord: t === 'discord' ? [c] : [], site: t === 'site' ? [c] : [] }; });
        function conflit(a, b) {
            var x = contenu[racineDe(a)], y = contenu[racineDe(b)];
            return (x.discord.length && y.discord.length) || (x.site.length && y.site.length);
        }
        function unir(a, b) {
            var ra = racineDe(a), rb = racineDe(b);
            if (ra === rb) return;
            parent[rb] = ra;
            contenu[ra] = { discord: contenu[ra].discord.concat(contenu[rb].discord), site: contenu[ra].site.concat(contenu[rb].site) };
        }

        /* les liens refusés à la main (type « separe ») */
        var separes = {};
        (d.liens || []).forEach(function (l) { if (l.type === 'separe') { separes[l.a + '|' + l.b] = true; separes[l.b + '|' + l.a] = true; } });

        function arete(a, b, force, raison, lien) {
            if (!noeuds[a] || !noeuds[b] || a === b) return;
            if (separes[a + '|' + b]) return;
            if (force !== 'sur' && conflit(a, b)) return;
            if (racineDe(a) === racineDe(b) && force !== 'sur') return;
            unir(a, b);
            aretes.push({ a: a, b: b, force: force, raison: raison, lien: lien || null });
        }

        /* 1. le sûr : le site lui-même (Discord connecté, pseudo, mules déclarées), puis les liens confirmés à la main */
        (d.site || []).forEach(function (p) {
            var s = 'site:' + p.id;
            if (p.discord_id) arete(s, 'discord:' + p.discord_id, 'sur', 'Compte du site connecté avec ce Discord');
            arete(s, cleJeu(p.username), 'sur', 'Pseudo du site = perso en jeu');
            (p.mules || []).forEach(function (m) { arete(s, cleJeu(m), 'sur', 'Mule déclarée sur le site'); });
        });
        (d.liens || []).forEach(function (l) { if (l.type === 'lien') arete(l.a, l.b, 'sur', l.note || 'Rattaché à la main', l); });

        /* 2. le probable : les déductions notées à la main, puis les noms Discord qui ressemblent à un perso ou à un pseudo du site */
        (d.liens || []).forEach(function (l) { if (l.type === 'probable') arete(l.a, l.b, 'probable', l.note || 'Déduit, à confirmer', l); });
        var persos = (d.jeu || []).map(function (p) { return { cle: cleJeu(p.nom), n: norm(p.nom) }; });
        var pseudosSite = (d.site || []).filter(function (p) { return !p.discord_id; }).map(function (p) { return { cle: 'site:' + p.id, n: norm(p.username) }; });
        (d.discord || []).forEach(function (m) {
            if (m.bot) return;
            var cle = 'discord:' + m.id, vus = [];
            [m.surnom, m.nom, m.pseudo].forEach(function (nom) { morceaux(nom).forEach(function (x) { if (vus.indexOf(x) === -1) vus.push(x); }); });
            pseudosSite.forEach(function (s) { if (vus.some(function (x) { return x === s.n; })) arete(cle, s.cle, 'probable', 'Nom sur le Discord = pseudo du site'); });
            persos.forEach(function (p) { if (vus.some(function (x) { return ressemble(x, p.n); })) arete(cle, p.cle, 'probable', 'Nom sur le Discord ≈ perso en jeu'); });
        });

        /* 3. les groupes = les personnes */
        var groupes = {};
        Object.keys(noeuds).forEach(function (c) { var r = racineDe(c); (groupes[r] = groupes[r] || []).push(c); });
        var notes = {};
        (d.notes || []).forEach(function (n) { notes[n.cle] = n; });

        var personnes = Object.keys(groupes).map(function (r) {
            var cles = groupes[r];
            var p = { cles: cles, jeu: [], discord: [], site: [], aretes: [], note: null };
            cles.forEach(function (c) { p[noeuds[c].type].push(noeuds[c].obj); });
            p.jeu.sort(function (a, b) { return (b.niveau || 0) - (a.niveau || 0); });
            p.aretes = aretes.filter(function (e) { return cles.indexOf(e.a) !== -1; });
            p.aConfirmer = p.aretes.some(function (e) { return e.force === 'probable'; });
            /* la note de l'admin : celle du Discord, sinon du site, sinon du premier perso */
            var ordre = cles.slice().sort(function (a, b) { return 'dsj'.indexOf(a[0]) - 'dsj'.indexOf(b[0]); });
            for (var i = 0; i < ordre.length; i++) if (notes[ordre[i]]) { p.note = notes[ordre[i]]; break; }
            p.cleNote = p.note ? p.note.cle : ordre[0];
            var roles = [];
            p.discord.forEach(function (m) { (m.roles || []).forEach(function (x) { if (roles.indexOf(x) === -1) roles.push(x); }); });
            p.roles = roles;
            p.allie = roles.indexOf('Allié') !== -1;
            p.score = (p.jeu.length ? 1 : 0) + (p.discord.length ? 1 : 0) + (p.site.length ? 1 : 0);
            p.nom = p.site.length ? p.site[0].username
                : p.discord.length ? (p.discord[0].surnom || p.discord[0].nom || p.discord[0].pseudo)
                : p.jeu[0].nom;
            p.categorie = categorie(p);
            p.remarques = remarques(p, noeuds);
            p.statutAuto = statutAuto(p);
            p.statut = p.note && p.note.statut ? p.note.statut : p.statutAuto;
            return p;
        });

        var stats = { personnes: personnes.length, persos: (d.jeu || []).length, discord: (d.discord || []).filter(function (m) { return !m.bot; }).length, site: (d.site || []).length, parCategorie: {} };
        personnes.forEach(function (p) { stats.parCategorie[p.categorie] = (stats.parCategorie[p.categorie] || 0) + 1; });
        return { personnes: personnes, stats: stats };
    }

    /* les catégories, de la plus suspecte à la plus sûre */
    var CATEGORIES = [
        { id: 'discord_seul', titre: 'Sur le Discord seulement', aide: 'Ni dans l\'alliance en jeu, ni sur le site : le plus suspect.', ton: 'rouge' },
        { id: 'discord_site_hors_jeu', titre: 'Discord et site, mais pas dans l\'alliance', aide: 'Inscrits partout sauf en jeu : partis de l\'alliance, ou jamais entrés ?', ton: 'rouge' },
        { id: 'site_seul', titre: 'Sur le site seulement', aide: 'Un compte du site, mais ni Discord trouvé ni perso dans l\'alliance.', ton: 'orange' },
        { id: 'jeu_site_sans_discord', titre: 'En jeu et sur le site, Discord introuvable', aide: 'Leur Discord a peut-être un autre nom, ou ils ont quitté le serveur.', ton: 'orange' },
        { id: 'jeu_discord_sans_site', titre: 'En jeu et sur le Discord, pas sur le site', aide: 'À inscrire sur le site (connexion avec Discord).', ton: 'jaune' },
        { id: 'jeu_seul', titre: 'En jeu seulement', aide: 'Persos rattachés à personne : des mules à relier, ou des inconnus.', ton: 'gris' },
        { id: 'complet', titre: 'Complets : jeu, Discord et site', aide: 'Les trois se recoupent.', ton: 'vert' },
        { id: 'allies', titre: 'Alliés (rôle Allié sur le Discord)', aide: 'Pas dans l\'alliance, et c\'est normal.', ton: 'bleu' }
    ];
    function categorie(p) {
        var j = p.jeu.length > 0, dc = p.discord.length > 0, s = p.site.length > 0;
        if (p.allie && !j) return 'allies';
        if (j && dc && s) return 'complet';
        if (j && dc) return 'jeu_discord_sans_site';
        if (j && s) return 'jeu_site_sans_discord';
        if (j) return 'jeu_seul';
        if (dc && s) return 'discord_site_hors_jeu';
        if (dc) return 'discord_seul';
        return 'site_seul';
    }
    /* ce qui cloche, en clair (affiché sous la personne) */
    function remarques(p, noeuds) {
        var r = [], j = p.jeu.length > 0;
        if (p.discord.length > 1) r.push('Plusieurs comptes Discord rattachés : à démêler.');
        if (p.site.length > 1) r.push('Plusieurs comptes du site rattachés : à démêler.');
        if (!j && p.roles.indexOf('Alliance') !== -1) r.push('A le rôle Alliance sur le Discord sans perso dans l\'alliance : il voit les salons de l\'alliance.');
        if (j && p.allie) r.push('Rôle Allié sur le Discord, alors qu\'il est dans l\'alliance en jeu.');
        if (j && p.discord.length && !p.allie && p.roles.indexOf('Alliance') === -1) r.push('Dans l\'alliance en jeu, mais sans le rôle Alliance sur le Discord.');
        if (p.discord.length && !p.roles.length) r.push('Aucun rôle sur le Discord.');
        p.site.forEach(function (s) {
            if (s.discord_id && !noeuds['discord:' + s.discord_id]) r.push('Le Discord connecté au compte « ' + s.username + ' » n\'est plus sur le serveur.');
            if (/^user_[0-9a-f]{8}$/.test(s.username || '')) r.push('Compte du site sans pseudo (jamais fini l\'inscription).');
            else if (!s.is_validated) r.push('Compte du site pas encore validé.');
        });
        return r;
    }

    function statutAuto(p) {
        if (p.discord.length > 1 || p.site.length > 1) return 'a_verifier';
        if (p.categorie === 'allies') return 'allie';
        if (p.categorie === 'discord_seul' || p.categorie === 'discord_site_hors_jeu' || p.categorie === 'site_seul') return 'suspect';
        if (p.categorie === 'complet' && !p.aConfirmer) return 'ok';
        return 'a_verifier';
    }

    var STATUTS = [
        ['ok', 'OK, vérifié'], ['a_verifier', 'À vérifier'], ['suspect', 'Suspect'], ['allie', 'Allié'],
        ['mule', 'Mule de quelqu\'un'], ['parti', 'Parti / à retirer'], ['inconnu', 'Inconnu']
    ];

    var M = { norm: norm, cleJeu: cleJeu, morceaux: morceaux, croiser: croiser, CATEGORIES: CATEGORIES, STATUTS: STATUTS };
    racine.RecensementMoteur = M;
    if (typeof module === 'object' && module.exports) module.exports = M;
})(typeof window !== 'undefined' ? window : globalThis);
