/* ============================================ */
/* Redemption - Admin : la Ferme d'Incarnam     */
/* Qui a acces, la progression et le temps de   */
/* jeu de chacun (19/10/2026, sql/072)          */
/* 07/11/2026 : deux vues, « Tableau de bord »  */
/* et « Cartes joueurs » (façon cartes membres, */
/* avec la photo de la ferme et le perso,       */
/* sql/085)                                     */
/* ============================================ */
(function () {
    'use strict';

    var ICO = 'ferme/assets/icones/';
    var CLASSES = { iop: 'Iop', cra: 'Cra', osa: 'Osamodas' };
    var GARDIENS = { chat: ['Newton', 'newton'], chien: ['Masdog', 'masdog'] };
    var MODES = [
        ['tous', 'Tout le monde qui a le lien', 'Un compte Discord du site (validé ou non), ou un pseudo et un mot de passe créés dans le jeu.'],
        ['membres', 'Membres validés du site', 'Seuls les profils validés de Redemption, connectés avec Discord.'],
        ['testeurs', 'Testeurs seulement', 'Seuls les joueurs déjà inscrits ci-dessous.']
    ];
    var TRIS_CARTES = [['derniere_partie', 'Dernière partie'], ['niveau', 'Niveau'], ['vague', 'Vague'], ['kamas', 'Kamas'], ['temps_jeu', 'Temps de jeu']];
    var tri = { cle: 'derniere_partie', sens: -1 };
    var vue = 'dash', filtre = 'tous', triCartes = 'derniere_partie';
    try { vue = localStorage.getItem('ferme-admin-vue') === 'cartes' ? 'cartes' : 'dash'; } catch (e) { /* rien */ }
    var apercus = {}, apercusOk = true; /* (id -> { ferme, perso, le } ; apercusOk : la base a bien sql/085) */

    var EN_LIGNE = 180; /* (en ligne : une sauvegarde il y a moins de 3 min ; le jeu envoie toutes les 15 s quand il se passe quelque chose, 07/11/2026) */
    function esc(t) { return window.REN.escapeHtml(t == null ? '' : String(t)); }
    function duree(s) {
        s = Math.max(0, Math.round(s || 0));
        if (s < 60) return s ? s + ' s' : '0';
        var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
        return h ? h + ' h ' + (m < 10 ? '0' : '') + m : m + ' min';
    }
    function depuis(d) { return d ? (Date.now() - new Date(d).getTime()) / 1000 : Infinity; }
    function enLigne(j) { return depuis(j.derniere_partie) < EN_LIGNE; }
    function ilYa(d, court) {
        if (!d) return 'jamais';
        var s = depuis(d);
        if (s < EN_LIGNE) return 'en ligne';
        if (s < 3600) return 'il y a ' + Math.max(1, Math.round(s / 60)) + ' min';
        if (s < 86400) return 'il y a ' + Math.round(s / 3600) + ' h';
        if (s < 86400 * 30) return 'il y a ' + Math.round(s / 86400) + ' j';
        return (court ? '' : 'le ') + new Date(d).toLocaleDateString('fr-FR');
    }
    function nombre(n) { return n == null ? '-' : Number(n).toLocaleString('fr-FR'); }
    function kamas(n) { return n == null ? '-' : (window.REN.formatKamas ? window.REN.formatKamas(n) : nombre(n)); }
    function nomClasse(j) { return j.classe ? (CLASSES[j.classe] || j.classe) : 'Pas de perso'; }
    function icoClasse(j) { return ICO + (CLASSES[j.classe] ? (j.sexe === 'f' ? 'feminin-' : '') + j.classe : 'grange') + '.png'; }
    function photoPerso(j) { var a = j.id && apercus[j.id]; return a && a.perso ? a.perso : ''; }
    function photoFerme(j) { var a = j.id && apercus[j.id]; return a && a.ferme ? a.ferme : ''; }
    function avatar(j, taille) { /* le portrait du perso pris en jeu, sinon l'icone de sa classe */
        var p = photoPerso(j);
        return '<span class="fb-ava" style="width:' + taille + 'px;height:' + taille + 'px;">' + (p ? '<img src="' + esc(p) + '" alt="" class="fb-ava__perso">' : '<img src="' + icoClasse(j) + '" alt="">') + '</span>';
    }

    function valeurTri(j, cle) {
        if (cle === 'nom' || cle === 'classe') return (j[cle] || '').toLowerCase();
        if (cle === 'derniere_partie' || cle === 'cree_le') return j[cle] ? new Date(j[cle]).getTime() : 0;
        return j[cle] == null ? -1 : Number(j[cle]);
    }
    function trier(liste, cle, sens) { return liste.slice().sort(function (a, b) { var x = valeurTri(a, cle), y = valeurTri(b, cle); return x < y ? -sens : x > y ? sens : 0; }); }

    var CSS = ''
        + '.fb{--fb-or:#ffb238;--fb-vert:#2ecc71;--fb-violet:rgba(140,110,255,.3);}'
        + '.fb-tete{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start;justify-content:space-between;margin-bottom:14px;}'
        + '.fb-vues{display:inline-flex;background:var(--color-bg-input);border:1px solid var(--color-border);border-radius:50px;padding:4px;gap:4px;}'
        + '.fb-vues button{border:0;background:transparent;color:var(--color-text-secondary);font:600 .85rem var(--font-body);padding:8px 16px;border-radius:50px;cursor:pointer;transition:background .15s,color .15s;}'
        + '.fb-vues button:hover{color:var(--color-text-primary);}'
        + '.fb-vues button.on{background:linear-gradient(135deg,#e07c0a,#ffb238);color:#1a1b1e;box-shadow:0 4px 14px rgba(224,124,10,.3);}'
        + '.fb-barre{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:6px;}'
        + '.fb-maj{font-size:.78rem;color:var(--color-text-muted);display:inline-flex;align-items:center;gap:6px;}'
        + '.fb-pouls{width:8px;height:8px;border-radius:50%;background:var(--fb-vert);box-shadow:0 0 0 0 rgba(46,204,113,.6);animation:fbPouls 1.8s infinite;display:inline-block;flex-shrink:0;}'
        + '@keyframes fbPouls{0%{box-shadow:0 0 0 0 rgba(46,204,113,.55);}70%{box-shadow:0 0 0 8px rgba(46,204,113,0);}100%{box-shadow:0 0 0 0 rgba(46,204,113,0);}}'
        + '.fb-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:18px 0;}'
        + '.fb-kpi{position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(84,52,189,.30),rgba(34,24,66,.6) 55%,rgba(15,13,28,.78));border:1px solid var(--fb-violet);border-radius:14px;padding:14px 16px;display:flex;gap:12px;align-items:center;}'
        + '.fb-kpi::after{content:"";position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,rgba(224,124,10,.16),transparent 70%);pointer-events:none;}'
        + '.fb-kpi img{width:40px;height:40px;object-fit:contain;flex-shrink:0;filter:drop-shadow(0 3px 6px rgba(0,0,0,.4));}'
        + '.fb-kpi__l{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--color-text-secondary);}'
        + '.fb-kpi__v{font-family:var(--font-title);font-size:1.75rem;font-weight:700;line-height:1.1;color:var(--color-text-primary);}'
        + '.fb-kpi__s{font-size:.75rem;color:var(--color-text-muted);margin-top:2px;}'
        + '.fb-kpi--on{border-color:rgba(46,204,113,.45);background:linear-gradient(135deg,rgba(46,204,113,.18),rgba(20,40,32,.6) 55%,rgba(15,13,28,.78));}'
        + '.fb-kpi--on .fb-kpi__v{color:var(--fb-vert);}'
        + '.fb-g2{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:14px;margin-bottom:14px;}'
        + '@media (max-width:900px){.fb-g2{grid-template-columns:1fr;}}'
        + '.fb-bloc{background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:14px;padding:16px;min-width:0;}'
        + '.fb-bloc h3{font-family:var(--font-title);font-size:1.05rem;font-weight:700;letter-spacing:.03em;margin:0 0 12px;display:flex;align-items:center;gap:8px;color:var(--color-text-primary);}'
        + '.fb-bloc h3 small{font:500 .75rem var(--font-body);color:var(--color-text-muted);margin-left:auto;}'
        + '.fb-vide{color:var(--color-text-muted);font-size:.85rem;padding:10px 0;}'
        + '.fb-ligne{display:flex;align-items:center;gap:12px;padding:8px 6px;border-radius:10px;}'
        + '.fb-ligne+.fb-ligne{border-top:1px dashed rgba(255,255,255,.06);}'
        + '.fb-ligne:hover{background:var(--color-bg-tertiary);}'
        + '.fb-ligne__nom{font-weight:700;color:var(--color-text-primary);}'
        + '.fb-ligne__sous{font-size:.78rem;color:var(--color-text-muted);}'
        + '.fb-ligne__droite{margin-left:auto;text-align:right;font-size:.8rem;color:var(--color-text-secondary);white-space:nowrap;}'
        + '.fb-ava{position:relative;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:radial-gradient(circle at 50% 35%,#3a3560,#1d1a30);border:1px solid var(--fb-violet);overflow:hidden;flex-shrink:0;}'
        + '.fb-ava img{width:78%;height:78%;object-fit:contain;}'
        + '.fb-ava img.fb-ava__perso{width:100%;height:118%;object-fit:cover;object-position:50% 8%;margin-top:18%;}'
        + '.fb-pastille{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--fb-vert);box-shadow:0 0 0 3px rgba(46,204,113,.22);vertical-align:1px;margin-right:6px;}'
        + '.fb-classe{display:flex;align-items:center;gap:10px;margin-bottom:12px;}'
        + '.fb-classe img{width:34px;height:34px;object-fit:contain;}'
        + '.fb-classe__nom{width:84px;font-weight:700;font-size:.9rem;}'
        + '.fb-classe__barre{flex:1;height:12px;border-radius:8px;background:var(--color-bg-input);overflow:hidden;}'
        + '.fb-classe__barre i{display:block;height:100%;border-radius:8px;}'
        + '.fb-classe__n{width:70px;text-align:right;font-family:var(--font-title);font-weight:700;font-size:1.05rem;}'
        + '.fb-classe__n small{font:500 .72rem var(--font-body);color:var(--color-text-muted);margin-left:4px;}'
        + '.fb-podiums{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:14px;}'
        + '.fb-podium .fb-ligne{padding:6px 4px;}'
        + '.fb-rang{width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font:700 .8rem var(--font-title);flex-shrink:0;}'
        + '.fb-rang--1{background:linear-gradient(135deg,#ffd700,#e0a10a);color:#2a1d00;}'
        + '.fb-rang--2{background:linear-gradient(135deg,#e6e6e6,#a9a9a9);color:#222;}'
        + '.fb-rang--3{background:linear-gradient(135deg,#e39a5a,#a8642c);color:#2a1300;}'
        + '.fb-podium .fb-ligne__droite{font-family:var(--font-title);font-weight:700;font-size:1rem;color:var(--fb-or);}'
        + '#ferme-joueurs{width:100%;border-collapse:collapse;}'
        + '#ferme-joueurs th,#ferme-joueurs td{padding:8px 10px;text-align:left;vertical-align:middle;border-bottom:1px solid var(--color-border);white-space:nowrap;}'
        + '#ferme-joueurs th{color:var(--color-text-muted);font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;cursor:pointer;user-select:none;}'
        + '#ferme-joueurs th:hover{color:var(--color-text-primary);}'
        + '#ferme-joueurs tbody tr:hover{background:var(--color-bg-tertiary);}'
        + '.fb-cellnom{display:flex;align-items:center;gap:10px;}'
        + '.fb-niv{display:inline-block;min-width:34px;text-align:center;padding:2px 8px;border-radius:50px;background:rgba(224,124,10,.14);border:1px solid rgba(224,124,10,.35);color:var(--fb-or);font:700 .85rem var(--font-title);}'
        + '.fb-filtres{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px;}'
        + '.fb-puce{border:1px solid var(--color-border);background:var(--color-bg-tertiary);color:var(--color-text-secondary);font:600 .8rem var(--font-body);padding:6px 14px;border-radius:50px;cursor:pointer;}'
        + '.fb-puce.on{border-color:rgba(224,124,10,.6);color:var(--fb-or);background:rgba(224,124,10,.1);}'
        + '.fb-filtres select{margin-left:auto;max-width:220px;}'
        + '.fb-cartes{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;}'
        + '.fb-carte{position:relative;display:flex;flex-direction:column;background:linear-gradient(135deg,rgba(84,52,189,.34),rgba(34,24,66,.62) 48%,rgba(15,13,28,.78));border:1px solid var(--fb-violet);border-radius:16px;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.07);transition:border-color .2s,box-shadow .2s,transform .2s;}'
        + '.fb-carte:hover{border-color:rgba(224,124,10,.45);box-shadow:0 8px 28px rgba(0,0,0,.35),0 0 22px rgba(224,124,10,.12);transform:translateY(-3px);}'
        + '.fb-carte.on{border-color:rgba(46,204,113,.55);box-shadow:0 0 0 1px rgba(46,204,113,.2),0 0 26px rgba(46,204,113,.12);}'
        + '.fb-photo{position:relative;aspect-ratio:16/9;background:#1d1a30 center/cover no-repeat;}'
        + '.fb-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,13,28,0) 45%,rgba(15,13,28,.85));pointer-events:none;}'
        + '.fb-photo.vide{display:flex;align-items:center;justify-content:center;}'
        + '.fb-photo.vide::before{content:"";position:absolute;inset:0;background:inherit;filter:blur(2px) saturate(.8) brightness(.55);}'
        + '.fb-photo__aide{position:relative;z-index:1;font-size:.75rem;color:rgba(255,255,255,.75);background:rgba(15,13,28,.55);padding:4px 10px;border-radius:50px;margin-bottom:34px;}'
        + '.fb-statut{position:absolute;z-index:2;top:10px;left:10px;font:700 .72rem var(--font-body);padding:4px 10px;border-radius:50px;background:rgba(15,13,28,.72);color:var(--color-text-secondary);backdrop-filter:blur(4px);display:inline-flex;align-items:center;gap:6px;}'
        + '.fb-statut.on{color:#bff5d4;background:rgba(20,80,48,.78);}'
        + '.fb-badge{position:absolute;z-index:2;top:10px;right:10px;font:700 .95rem var(--font-title);padding:3px 12px;border-radius:50px;background:linear-gradient(135deg,#e07c0a,#ffb238);color:#1a1b1e;box-shadow:0 4px 12px rgba(0,0,0,.35);}'
        + '.fb-perso{position:absolute;z-index:3;left:12px;bottom:-30px;width:86px;height:86px;border-radius:50%;background:radial-gradient(circle at 50% 35%,#4a4380,#1d1a30);border:3px solid #2a2350;box-shadow:0 6px 16px rgba(0,0,0,.45);overflow:hidden;display:flex;align-items:center;justify-content:center;}'
        + '.fb-carte.on .fb-perso{border-color:rgba(46,204,113,.7);}'
        + '.fb-perso img{width:74%;height:74%;object-fit:contain;}'
        + '.fb-perso img.fb-ava__perso{width:100%;height:122%;object-fit:cover;object-position:50% 6%;margin-top:22%;}'
        + '.fb-corps{padding:40px 16px 16px;display:flex;flex-direction:column;gap:12px;flex:1;}'
        + '.fb-nom{font-family:var(--font-title);font-size:1.35rem;font-weight:700;letter-spacing:.02em;color:var(--color-text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 2px 6px rgba(0,0,0,.6);}'
        + '.fb-sous{font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--fb-or);display:flex;align-items:center;gap:6px;flex-wrap:wrap;}'
        + '.fb-sous span{color:var(--color-text-muted);font-weight:500;text-transform:none;letter-spacing:0;}'
        + '.fb-ident{position:absolute;left:110px;right:12px;bottom:6px;z-index:3;}'
        + '.fb-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}'
        + '.fb-stat{text-align:center;background:var(--color-bg-tertiary);border:1px solid var(--color-border);border-radius:10px;padding:8px 4px 7px;}'
        + '.fb-stat b{display:block;font-family:var(--font-title);font-size:1.25rem;line-height:1;color:var(--color-text-primary);}'
        + '.fb-stat small{display:block;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--color-text-secondary);margin-bottom:4px;}'
        + '.fb-infos{display:flex;flex-direction:column;}'
        + '.fb-info{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:.82rem;padding:5px 2px;border-bottom:1px dashed rgba(255,255,255,.07);}'
        + '.fb-info:last-child{border-bottom:0;}'
        + '.fb-info span{color:var(--color-text-secondary);display:inline-flex;align-items:center;gap:6px;}'
        + '.fb-info span img{width:18px;height:18px;object-fit:contain;}'
        + '.fb-info b{font-family:var(--font-title);font-weight:700;color:var(--color-text-primary);}'
        + '.fb-info b.or{color:var(--color-warning);}'
        + '.fb-note{font-size:.8rem;color:var(--color-text-muted);margin:-4px 0 14px;}';

    function kpi(ico, titre, valeur, sous, classe) {
        return '<div class="fb-kpi' + (classe ? ' ' + classe : '') + '"><img src="' + ICO + ico + '" alt="">'
            + '<div><div class="fb-kpi__l">' + titre + '</div><div class="fb-kpi__v">' + valeur + '</div>' + (sous ? '<div class="fb-kpi__s">' + sous + '</div>' : '') + '</div></div>';
    }

    function vueDash(joueurs, ctx) {
        var html = '';
        /* en ligne + classes */
        html += '<div class="fb-g2"><section class="fb-bloc"><h3><span class="fb-pouls"></span>En ligne maintenant<small>une sauvegarde depuis moins de 3 min</small></h3>';
        if (!ctx.enJeuL.length) html += '<div class="fb-vide">Personne ne joue en ce moment. Dernier passage : ' + (ctx.dernier ? '<strong>' + esc(ctx.dernier.nom) + '</strong>, ' + ilYa(ctx.dernier.derniere_partie) : 'aucun') + '.</div>';
        ctx.enJeuL.forEach(function (j) {
            html += '<div class="fb-ligne">' + avatar(j, 44) + '<div><div class="fb-ligne__nom">' + esc(j.nom) + '</div><div class="fb-ligne__sous">' + esc(nomClasse(j)) + (j.niveau != null ? ' niveau ' + j.niveau : '') + (j.vague != null ? ', vague ' + j.vague : '') + '</div></div>'
                + '<div class="fb-ligne__droite">' + kamas(j.kamas) + ' kamas<br><span class="text-muted">' + duree(j.temps_jeu) + ' de jeu</span></div></div>';
        });
        html += '</section><section class="fb-bloc"><h3>Classes jouées<small>la partie en cours de chacun</small></h3>';
        var cl = ['iop', 'cra', 'osa'], couleurs = { iop: 'linear-gradient(90deg,#e84444,#ff8a3d)', cra: 'linear-gradient(90deg,#27ae60,#9be15d)', osa: 'linear-gradient(90deg,#8e44ad,#c08cf0)' };
        var nbs = cl.map(function (c) { return joueurs.filter(function (j) { return j.classe === c; }).length; }), max = Math.max.apply(null, nbs.concat([1])), tot = nbs.reduce(function (a, b) { return a + b; }, 0) || 1;
        cl.forEach(function (c, k) {
            html += '<div class="fb-classe"><img src="' + ICO + c + '.png" alt=""><div class="fb-classe__nom">' + CLASSES[c] + '</div><div class="fb-classe__barre"><i style="width:' + Math.round(100 * nbs[k] / max) + '%;background:' + couleurs[c] + ';"></i></div>'
                + '<div class="fb-classe__n">' + nbs[k] + '<small>' + Math.round(100 * nbs[k] / tot) + ' %</small></div></div>';
        });
        var sansPerso = joueurs.filter(function (j) { return !CLASSES[j.classe]; }).length;
        if (sansPerso) html += '<div class="fb-vide" style="padding:0;">' + sansPerso + ' inscrit' + (sansPerso > 1 ? 's' : '') + ' sans perso pour le moment.</div>';
        html += '</section></div>';

        /* les podiums */
        var podiums = [['niveau', 'Plus haut niveau', function (j) { return 'niv. ' + j.niveau; }], ['vague', 'Plus loin dans les vagues', function (j) { return 'vague ' + j.vague; }],
            ['kamas', 'Les plus riches', function (j) { return kamas(j.kamas); }], ['temps_jeu', 'Les plus assidus', function (j) { return duree(j.temps_jeu); }]];
        html += '<div class="fb-podiums">';
        podiums.forEach(function (p) {
            var top = trier(joueurs.filter(function (j) { return j[p[0]] != null && Number(j[p[0]]) > 0; }), p[0], -1).slice(0, 3);
            html += '<section class="fb-bloc fb-podium"><h3>' + p[1] + '</h3>';
            if (!top.length) html += '<div class="fb-vide">Personne encore.</div>';
            top.forEach(function (j, k) { html += '<div class="fb-ligne"><span class="fb-rang fb-rang--' + (k + 1) + '">' + (k + 1) + '</span>' + avatar(j, 32) + '<div class="fb-ligne__nom">' + esc(j.nom) + '</div><div class="fb-ligne__droite">' + p[2](j) + '</div></div>'; });
            html += '</section>';
        });
        html += '</div>';

        /* le tableau complet */
        var cols = [['nom', 'Joueur'], ['classe', 'Classe'], ['niveau', 'Niveau'], ['vague', 'Vague'], ['boss', 'Boss battus'], ['parties', 'Persos'], ['kamas', 'Kamas'],
            ['temps_jeu', 'Temps de jeu'], ['sessions', 'Sessions'], ['derniere_partie', 'Dernière partie'], ['cree_le', 'Inscrit le']];
        html += '<section class="fb-bloc"><h3>Tous les joueurs<small>clique sur un titre pour trier</small></h3><div style="overflow-x:auto;"><table id="ferme-joueurs"><thead><tr>';
        cols.forEach(function (c) { html += '<th data-tri="' + c[0] + '">' + c[1] + (tri.cle === c[0] ? (tri.sens > 0 ? ' ▲' : ' ▼') : '') + '</th>'; });
        html += '</tr></thead><tbody>';
        if (!joueurs.length) html += '<tr><td colspan="' + cols.length + '" class="text-muted">Personne n\'a encore joué.</td></tr>';
        trier(joueurs, tri.cle, tri.sens).forEach(function (j) {
            var type = j.invite ? 'compte de jeu' : 'Discord';
            html += '<tr><td><div class="fb-cellnom">' + avatar(j, 34) + '<div>' + (enLigne(j) ? '<span class="fb-pastille" title="En ligne"></span>' : '') + '<strong>' + esc(j.nom) + '</strong><br><span class="text-muted" style="font-size:.75rem;">' + type
                + (j.nom_fermier && j.nom_fermier !== j.nom ? ', perso : ' + esc(j.nom_fermier) : '') + '</span></div></div></td>';
            html += '<td>' + (j.classe ? '<span style="display:inline-flex;align-items:center;gap:6px;"><img src="' + ICO + (CLASSES[j.classe] ? j.classe : 'grange') + '.png" alt="" style="width:22px;height:22px;object-fit:contain;">' + esc(nomClasse(j)) + '</span>' : '<span class="text-muted">-</span>') + '</td>';
            html += '<td>' + (j.niveau != null ? '<span class="fb-niv">' + j.niveau + '</span>' : '<span class="text-muted">-</span>') + '</td>';
            html += '<td>' + nombre(j.vague) + '</td><td>' + nombre(j.boss) + '</td><td>' + nombre(j.parties) + '</td>';
            html += '<td style="color:var(--color-warning);font-weight:600;">' + kamas(j.kamas) + '</td><td>' + duree(j.temps_jeu) + '</td><td>' + nombre(j.sessions) + '</td>';
            html += '<td>' + (enLigne(j) ? '<strong style="color:var(--color-success);">en ligne</strong>' : ilYa(j.derniere_partie, true)) + '</td>';
            html += '<td>' + (j.cree_le ? new Date(j.cree_le).toLocaleDateString('fr-FR') : '') + '</td></tr>';
        });
        html += '</tbody></table></div></section>';
        return html;
    }

    function carteJoueur(j) {
        var on = enLigne(j), f = photoFerme(j), p = photoPerso(j), g = GARDIENS[j.gardien];
        var fond = f ? f : ICO + 'fond-heros-' + (CLASSES[j.classe] ? j.classe : 'iop') + '.jpg';
        var html = '<article class="fb-carte' + (on ? ' on' : '') + '">';
        html += '<div class="fb-photo' + (f ? '' : ' vide') + '" style="background-image:url(\'' + esc(fond) + '\');">';
        if (!f) html += '<span class="fb-photo__aide">' + (apercusOk && j.id ? 'Photo de la ferme à sa prochaine partie' : 'Photos de la ferme bientôt') + '</span>';
        html += '<span class="fb-statut' + (on ? ' on' : '') + '">' + (on ? '<span class="fb-pouls"></span>En ligne' : ilYa(j.derniere_partie)) + '</span>';
        if (j.niveau != null) html += '<span class="fb-badge">Niv. ' + j.niveau + '</span>';
        html += '<div class="fb-perso">' + (p ? '<img src="' + esc(p) + '" alt="" class="fb-ava__perso">' : '<img src="' + icoClasse(j) + '" alt="">') + '</div>';
        html += '<div class="fb-ident"><div class="fb-nom">' + esc(j.nom) + '</div><div class="fb-sous">' + esc(nomClasse(j)) + (j.nom_fermier && j.nom_fermier !== j.nom ? ' <span>perso : ' + esc(j.nom_fermier) + '</span>' : '') + '</div></div>';
        html += '</div><div class="fb-corps">';
        html += '<div class="fb-stats"><div class="fb-stat"><small>Niveau</small><b>' + nombre(j.niveau) + '</b></div><div class="fb-stat"><small>Vague</small><b>' + nombre(j.vague) + '</b></div><div class="fb-stat"><small>Boss</small><b>' + nombre(j.boss) + '</b></div></div>';
        html += '<div class="fb-infos">';
        html += '<div class="fb-info"><span><img src="' + ICO + 'kama.png" alt="">Kamas</span><b class="or">' + kamas(j.kamas) + '</b></div>';
        html += '<div class="fb-info"><span>Temps de jeu</span><b>' + duree(j.temps_jeu) + '</b></div>';
        html += '<div class="fb-info"><span>Sessions</span><b>' + nombre(j.sessions) + '</b></div>';
        if (j.qg != null) html += '<div class="fb-info"><span><img src="' + ICO + 'grange.png" alt="">Grange</span><b>niveau ' + (j.qg + 1) + (j.qg >= 5 ? ' (château)' : '') + '</b></div>';
        if (j.tofus != null) html += '<div class="fb-info"><span><img src="' + ICO + 'tofu.png" alt="">Tofus</span><b>' + j.tofus + '</b></div>';
        if (j.id !== undefined) html += '<div class="fb-info"><span>' + (g ? '<img src="' + ICO + g[1] + '.png" alt="">' : '') + 'Gardien</span><b>' + (g ? g[0] : '<span class="text-muted">aucun</span>') + '</b></div>';
        html += '<div class="fb-info"><span>Persos</span><b>' + nombre(j.parties) + '</b></div>';
        html += '<div class="fb-info"><span>Compte</span><b>' + (j.invite ? 'compte de jeu' : 'Discord') + '</b></div>';
        html += '<div class="fb-info"><span>Inscrit le</span><b>' + (j.cree_le ? new Date(j.cree_le).toLocaleDateString('fr-FR') : '-') + '</b></div>';
        html += '</div></div></article>';
        return html;
    }

    function vueCartes(joueurs) {
        var html = '<div class="fb-filtres">';
        [['tous', 'Tous'], ['enligne', 'En ligne'], ['actifs', 'Actifs sur 7 jours']].forEach(function (f) { html += '<button class="fb-puce' + (filtre === f[0] ? ' on' : '') + '" data-filtre="' + f[0] + '">' + f[1] + '</button>'; });
        html += '<select class="form-input" id="fb-tri-cartes">';
        TRIS_CARTES.forEach(function (t) { html += '<option value="' + t[0] + '"' + (triCartes === t[0] ? ' selected' : '') + '>Trier : ' + t[1] + '</option>'; });
        html += '</select></div>';
        if (!apercusOk) html += '<p class="fb-note">Les photos des fermes et des persos arrivent une fois la base mise à jour (sql/085) ; en attendant, chaque carte montre le décor de sa classe.</p>';
        var liste = joueurs.filter(function (j) { return filtre === 'enligne' ? enLigne(j) : filtre === 'actifs' ? depuis(j.derniere_partie) < 7 * 86400 : true; });
        liste = trier(liste, triCartes, -1);
        if (!liste.length) return html + '<div class="fb-bloc fb-vide">' + (filtre === 'enligne' ? 'Personne ne joue en ce moment.' : 'Personne ici.') + '</div>';
        html += '<div class="fb-cartes">';
        liste.forEach(function (j) { html += carteJoueur(j); });
        return html + '</div>';
    }

    function rendre(container, data) {
        if (!document.getElementById('fb-css')) { var st = document.createElement('style'); st.id = 'fb-css'; st.textContent = CSS; document.head.appendChild(st); }
        var joueurs = (data.joueurs || []).slice();
        var actifs7 = joueurs.filter(function (j) { return depuis(j.derniere_partie) < 7 * 86400; }).length;
        var actifs24 = joueurs.filter(function (j) { return depuis(j.derniere_partie) < 86400; }).length;
        var enJeuL = trier(joueurs.filter(enLigne), 'niveau', -1);
        var total = joueurs.reduce(function (n, j) { return n + (j.temps_jeu || 0); }, 0);
        var sessions = joueurs.reduce(function (n, j) { return n + (j.sessions || 0); }, 0);
        var discord = joueurs.filter(function (j) { return !j.invite; }).length;
        var joue = joueurs.filter(function (j) { return (j.temps_jeu || 0) > 0; }).length || 1;
        var dernier = trier(joueurs.filter(function (j) { return j.derniere_partie; }), 'derniere_partie', -1)[0];

        var html = '<div class="fb"><div class="fb-tete"><div><div class="admin-panel__title" style="margin-bottom:4px;">Ferme d\'Incarnam : les joueurs</div>'
            + '<div class="admin-panel__desc" style="margin:0;">Qui joue, où en est chacun et combien de temps il a joué (compté depuis le 19/10/2026).</div></div>'
            + '<div class="fb-vues"><button data-vue="dash"' + (vue === 'dash' ? ' class="on"' : '') + '>Tableau de bord</button><button data-vue="cartes"' + (vue === 'cartes' ? ' class="on"' : '') + '>Cartes joueurs</button></div></div>';

        /* qui peut jouer */
        html += '<div class="fb-barre"><label for="ferme-acces" style="font-weight:700;">Qui peut jouer</label><select id="ferme-acces" class="form-input" style="max-width:300px;">';
        MODES.forEach(function (m) { html += '<option value="' + m[0] + '"' + (data.acces === m[0] ? ' selected' : '') + '>' + m[1] + '</option>'; });
        html += '</select><button class="btn btn--primary btn--small" id="ferme-acces-ok">Enregistrer</button><button class="btn btn--secondary btn--small" id="ferme-rafraichir">Rafraîchir</button>'
            + '<span class="fb-maj"><span class="fb-pouls"></span>à jour à ' + new Date().toLocaleTimeString('fr-FR') + ', tout seul toutes les 30 s</span></div>';
        var mode = MODES.filter(function (m) { return m[0] === data.acces; })[0];
        html += '<p class="text-muted" id="ferme-acces-aide" style="margin:2px 0 0;font-size:.82rem;">' + (mode ? mode[2] : '') + '</p>';

        /* les chiffres */
        html += '<div class="fb-kpis">';
        html += kpi('grange.png', 'Joueurs inscrits', joueurs.length, discord + ' par Discord, ' + (joueurs.length - discord) + ' en compte de jeu');
        html += kpi(enJeuL[0] ? (CLASSES[enJeuL[0].classe] ? enJeuL[0].classe : 'grange') + '.png' : 'cloche.png', 'En ligne maintenant', enJeuL.length,
            enJeuL.length ? enJeuL.map(function (j) { return esc(j.nom); }).join(', ') : 'personne pour le moment', enJeuL.length ? 'fb-kpi--on' : '');
        html += kpi('tofu.png', 'Actifs', actifs7 + ' <span style="font-size:.95rem;color:var(--color-text-muted);">sur 7 j</span>', actifs24 + ' sur les dernières 24 h');
        html += kpi('coffre.png', 'Temps de jeu total', duree(total), 'en moyenne ' + duree(total / joue) + ' par joueur');
        html += kpi('kama.png', 'Sessions', nombre(sessions), 'kamas cumulés : ' + kamas(joueurs.reduce(function (n, j) { return n + (j.kamas || 0); }, 0)));
        html += '</div>';

        html += vue === 'cartes' ? vueCartes(joueurs) : vueDash(joueurs, { enJeuL: enJeuL, dernier: dernier });
        html += '</div>';
        container.innerHTML = html;
        brancher(container, data);
    }

    function brancher(container, data) {
        container.querySelectorAll('.fb-vues button').forEach(function (b) {
            b.addEventListener('click', function () {
                vue = b.getAttribute('data-vue'); try { localStorage.setItem('ferme-admin-vue', vue); } catch (e) { /* rien */ }
                rendre(container, data);
            });
        });
        container.querySelectorAll('th[data-tri]').forEach(function (th) {
            th.addEventListener('click', function () {
                var c = th.getAttribute('data-tri');
                tri = { cle: c, sens: tri.cle === c ? -tri.sens : (c === 'nom' || c === 'classe' ? 1 : -1) };
                rendre(container, data);
            });
        });
        container.querySelectorAll('[data-filtre]').forEach(function (b) { b.addEventListener('click', function () { filtre = b.getAttribute('data-filtre'); rendre(container, data); }); });
        var tc = document.getElementById('fb-tri-cartes');
        if (tc) tc.addEventListener('change', function () { triCartes = tc.value; rendre(container, data); });
        var sel = document.getElementById('ferme-acces');
        sel.addEventListener('change', function () {
            var m = MODES.filter(function (x) { return x[0] === sel.value; })[0];
            document.getElementById('ferme-acces-aide').textContent = m ? m[2] : '';
        });
        document.getElementById('ferme-acces-ok').addEventListener('click', async function () {
            var b = this; b.disabled = true;
            var r = await window.REN.supabase.rpc('ferme_admin_acces', { p_mode: sel.value });
            b.disabled = false;
            if (r.error || !r.data || !r.data.ok) { alert('Le changement n\'est pas passé : ' + (r.error ? r.error.message : (r.data && r.data.erreur) || '?')); return; }
            data.acces = r.data.acces; b.textContent = 'Enregistré ✓'; setTimeout(function () { b.textContent = 'Enregistrer'; }, 1500);
        });
        document.getElementById('ferme-rafraichir').addEventListener('click', function () { window.tabFerme(container); });
    }

    /* les photos (sql/085) : chargees a part, seulement celles qui ont change depuis la derniere fois */
    async function chargerApercus(joueurs) {
        if (!joueurs.length || joueurs[0].id === undefined) { apercusOk = false; return false; }
        var manque = joueurs.filter(function (j) {
            if (!j.id || !j.apercu_le) return false;
            var a = apercus[j.id]; return !a || new Date(a.le).getTime() !== new Date(j.apercu_le).getTime();
        }).map(function (j) { return j.id; });
        if (!manque.length) return false;
        var r = await window.REN.supabase.rpc('ferme_admin_apercus', { p_ids: manque });
        if (r.error || !r.data || !r.data.ok) { apercusOk = false; return false; }
        (r.data.apercus || []).forEach(function (a) { apercus[a.id] = a; });
        return true;
    }

    async function lire(container) {
        var r = await window.REN.supabase.rpc('ferme_admin_joueurs');
        if (r.error || !r.data || !r.data.ok) return r;
        apercusOk = true;
        if ((r.data.joueurs || []).length && r.data.joueurs[0].id === undefined) apercusOk = false; /* (la base n'a pas encore sql/085) */
        rendre(container, r.data);
        if (await chargerApercus(r.data.joueurs || []) && container.isConnected) rendre(container, r.data);
        return r;
    }

    window.tabFerme = async function (container) {
        var r = await lire(container);
        if (r.error || !r.data || !r.data.ok) {
            container.innerHTML = '<div class="admin-panel__title">Ferme d\'Incarnam : les joueurs</div><p class="text-muted">Impossible de lire les joueurs : '
                + esc(r.error ? r.error.message : (r.data && r.data.erreur) || '?') + '</p>';
            return;
        }
        /* (07/11/2026) : le board se met a jour tout seul toutes les 30 s tant que l'onglet est affiche */
        clearInterval(window.__fermeAuto);
        window.__fermeAuto = setInterval(function () {
            if (!container.isConnected || !container.querySelector('.fb')) { clearInterval(window.__fermeAuto); return; }
            if (document.hidden || container.offsetParent === null) return;
            var a = document.activeElement; if (a && container.contains(a) && a.tagName === 'SELECT') return; /* (pas pendant un choix dans une liste) */
            lire(container);
        }, 30000);
    };
})();
