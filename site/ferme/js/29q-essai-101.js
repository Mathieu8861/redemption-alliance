'use strict';
/* LA SERIE D'ESSAIS DE LA VAGUE 101 (22/11/2026, Mathieu : « avant d'envoyer toutes les vagues, on laisse que la 101 a tout le monde mais avec differents
   niveaux de la 101, et en fonction de leur retour (recuperer les donnees de leur partie) on sait quelle vague est plus simple / dure qu'une autre ») :
   - chaque partie va dans le journal des vagues (23b) avec sa version et le nombre d'essais ; outils/essai101.py lit le tout en base ;
   - gains d'une vague rejouee (la moitie), plus l'autre moitie des kamas a la premiere victoire de chaque version ; des ressources, aucune piece (23/11/2026) ;
     la progression ne bouge pas (la 101 reste fermee) ;
   - visible quand tous les paliers sont termines, au niveau 99 ou plus ; dans le mode test, et pour tous avec ESSAI101.joueurs ;
   - on touche un numero pour choisir sa version (23/11/2026, « fais en sorte qu'on puisse faire celle qu'on veut », Mathieu).
   Ouverte aux joueurs le 23/11/2026 au soir (serie joueurs-1), retiree le meme soir avant toute partie, le temps du nouvel equilibrage. */
/* LES HUIT VERSIONS (24/11/2026, la nouvelle logique : « les PV ne font pas tout », puis « pour la vague 101, on peut faire autant de vagues test qu'on veut pour les
   membres et voir apres leur retour ; tu testes plusieurs choses ? tu peux meme en creer 10 », Mathieu, par Discord) : huit facons d'etre dur, toutes reglees au bot sur
   la meme difficulte (1,25 fois la 99, outils/banc/series/calib_essai.py) ; les joueurs comparent la facon dont c'est dur, pas le niveau. Les monstres partent des
   nouvelles fiches du palier 11 (leur equivalent de la foret +12 a +20 %), puis chaque version regle :
   horde (le nombre de monstres, 2,5 pour la mare), pv et deg (leur vie et leurs coups), vit (leur vitesse), cad (le temps entre deux coups), sorts (le temps entre
   deux sorts : bonds, salves, seismes, charges, langues, soins), L (la composition, avant la horde ; sinon celle de la 101) ; regle : le levier ajuste au bot.
   Premier reglage au bot le 24/11/2026 (outils/banc/series/calib_essai.py, lot e8a, 72 parties) ; les brutes : vie x2,2 et coups x6 plutot que coups x8.
   Passe de controle (lot e8b, 72 parties) : 4,4 a 6 vies pour une cible de 5,15, dernier reglage applique ; cl : un coefficient par classe propre a la version
   (les brutes : 11,9 vies pour le Iop au contact, 3,2 pour l'Osamodas ; vie et coups x cl, les vies x cl au carre).
   3e passe (lot e8c, 71 parties) : les huit entre 4,7 et 5,6 vies pour 5,15 ; derniere retouche des coups et des classes (Iop un peu plus a l'aise, Osamodas un peu plus en peine).
   La note de difficulte de 0 a 10 (24/11/2026, « est-ce qu'on ne ferait pas noter la difficulte aux membres de 0 a 10 ? 10 etant hardcore / impossible », Mathieu)
   remplace les trois boutons du ressenti ; le commentaire facultatif reste (23/11/2026). */
/* (OUVERTE AUX JOUEURS, 24/11/2026 dans la nuit, apres le reglage au bot des huit versions : « sortir aux joueurs les vagues 101.1, .2, .3 », Mathieu) */
const ESSAI101 = { joueurs: true, serie: 'joueurs-2', n: 101, lance: null,
  ordre: ['melange', 'essaim', 'brutes', 'rapides', 'sacs', 'tireurs', 'entraves', 'sorts', 'deferlante', 'assaut'],
  versions: {
    melange: { nom: 'Le mélange', desc: 'un peu plus de monstres, des coups plus forts, un peu plus vifs', horde: 3.5, pv: 1.12, deg: 3.38, vit: 1.1 },
    essaim: { nom: 'L\'essaim', desc: 'beaucoup plus de monstres, chacun plus faible', horde: 5.5, pv: 0.7, deg: 3.55, vit: 1.1 },
    brutes: { nom: 'Les brutes', desc: 'peu de monstres, mais ils tapent très fort', horde: 2, pv: 2.2, deg: 5.31, cl: { iop: 0.8, cra: 0.96, osa: 1.12 } },
    rapides: { nom: 'Les rapides', desc: 'ils courent et frappent plus vite, des coups plus légers', horde: 3.5, pv: 1, deg: 2.97, vit: 1.35, cad: 0.7 },
    sacs: { nom: 'Les sacs à PV', desc: 'comme avant : beaucoup de vie, des coups normaux', horde: 2.5, pv: 5.86, deg: 1, regle: 'pv' },
    tireurs: { nom: 'Les tireurs', desc: 'moitié de Crachopauds : ça tire de partout', L: [['tetard', 2], ['crapaud', 3], ['triton', 1]], horde: 3.5, pv: 1.12, deg: 2.4, vit: 1.1 },
    entraves: { nom: 'Les entraves', desc: 'plus de Claquelangues et de flaques qui ralentissent', L: [['tetard', 2], ['fouette', 3], ['crapaud', 2]], horde: 3.5, pv: 1.12, deg: 3.93, vit: 1.1 },
    sorts: { nom: 'Les sorts', desc: 'bonds, salves et coups au sol deux fois plus souvent', horde: 3.5, pv: 1.12, deg: 3.3, vit: 1.1, sorts: 0.5 },
    /* (24/11/2026 au soir, « cree une vague 101.9 et 101.10 avec les retours qu'on t'a donnes, on laisse les autres jouer dessus », Mathieu. Les retours des huit :
       la pression vient du nombre et des coups qui tombent vite (l'essaim 6,3, le melange 6), les monstres lents se kitent (« pas de pression », « facile a
       kiter »), les sacs a PV sont longs et desagreables, les rapides a coups legers trop faciles ; reglees au bot plus dures que les huit) */
    deferlante: { nom: 'La déferlante', desc: 'beaucoup de monstres, rapides, qui tapent fort : impossible de les semer', horde: 5, pv: 0.85, deg: 3.46, vit: 1.3 }, /* (reglee au bot, lot e9a : 6,9 vies pour une cible de 6,6, soit 1,6 fois la 99 ; les huit : 1,25) */
    assaut: { nom: 'L\'assaut', desc: 'un peu de tout et plus vite : Claquelangues qui attirent, Crachopauds qui tirent, Têtaclaques au contact, sorts plus fréquents', L: [['tetard', 3], ['fouette', 2], ['crapaud', 2]], horde: 4, pv: 1, deg: 3.6, vit: 1.25, cad: 0.85, sorts: 0.7, cl: { iop: 1, cra: 0.88, osa: 1.15 } } } }; /* (lot e9a : Iop 6,4, Cra 9,4, Osamodas 3,9 vies pour 6,6 : les tireurs et les langues pesent sur le Cra, d'ou cl) */
const COMMENTAIRE101 = 300;
const es101 = (c) => (c && c.essai101 && !(c.essai101.P && c.essai101.P.cm) ? c.essai101 : null); /* (un combat des vagues 101 a 110, 29zi-vagues-combats.js, passe par la meme voie : la serie le laisse tranquille, 26/11/2026) */
/* LE COFFRE DE LA SERIE (24/11/2026, « on ferait pas gagner un coffre aux gens qui ont repondu a tout, coffre qui regroupe tous leurs drops des vagues gagnees + un
   bonus ? kamas et runes ? », puis « tres bien », Mathieu, par Discord) : les ressources gagnees dans une version reussie s'empilent dans le coffre (rien ne va dans
   la grange pendant la serie ; une version perdue ou abandonnee perd les siennes) ; les huit versions gagnees ET notees, il s'ouvre (l'animation des coffres de
   l'ile) : tout son contenu, plus le bonus. Une seule fois par serie */
const COFFRE101 = { kamas: kamasGagnes(150000), forge: 3, parfaite: 1 };
const essaiBase101 = () => COMPO_MARE[1].map((x) => x.slice());
function versionEssai101(v) { const P = ESSAI101.versions[v]; return { v, f: 1, P, L: P.L || essaiBase101() }; }
function compoEssai101(L, horde) { const sauve = COMPO_MARE[1], h0 = HORDE_ESSAI; COMPO_MARE[1] = L.map((x) => x.slice()); if (horde) HORDE_ESSAI = horde; try { return compoVague(ESSAI101.n); } finally { COMPO_MARE[1] = sauve; HORDE_ESSAI = h0; } } /* (la horde, l'Axolutin unique : comme la vraie 101) */
const etatEssai101 = () => (S_.essai101 && S_.essai101.serie === ESSAI101.serie ? S_.essai101 : (S_.essai101 = { serie: ESSAI101.serie, i: 0, essais: {}, gagnes: {} }));
const nomEssai101 = (j) => 'Vague ' + ESSAI101.n + '.' + (j + 1); /* (j : le rang dans la serie, de 0 a 7) */
const rangEssai101 = () => { const E = etatEssai101(), O = ESSAI101.ordre; if (E.choix != null && E.choix >= 0 && E.choix < O.length) return E.choix; const j = O.findIndex((v) => !E.gagnes[v]); return j >= 0 ? j : 0; };
const versionCourante101 = () => ESSAI101.ordre[rangEssai101()];
const VERSIONS_COFFRE101 = ESSAI101.ordre.slice(0, 8); /* (le coffre : les huit premieres ; la 101.9 et la 101.10, ajoutees le 24/11/2026 au soir, sont en plus) */
const serieFinie101 = () => VERSIONS_COFFRE101.every((v) => etatEssai101().gagnes[v]);
const toutFini101 = () => ESSAI101.ordre.every((v) => etatEssai101().gagnes[v]);
/* LA SERIE RETIREE (26/11/2026, « la serie 101 des joueurs, je peux deja meme la retirer tout court maintenant, vu que les gens l'ont faite », Mathieu) : plus visible pour personne,
   mode test compris ; les vagues 101 a 110 en combats (29zi-vagues-combats.js) prennent sa place avec le palier 11 */
const SERIE101_RETIREE = true;
const essaiVisible101 = () => { try { return !SERIE101_RETIREE && !!S_ && !!S_.perso && (ESSAI101.joueurs || MODE_TEST) && S_.vague.num > VAGUES_TOTAL && niveau(S_.xp) >= ESSAI101.n - 2; } catch (e) { return false; } };
/* LES SORTS PLUS FREQUENTS : le temps entre deux sorts des monstres de la version, divise le temps du combat, puis rendu */
const CLES_SORTS101 = ['bondit', 'seisme', 'charge', 'soigne'];
let sortsSauves101 = null;
function accelererSorts101(L, x) {
  rendreSorts101(); if (!x || x === 1) return; sortsSauves101 = [];
  [...new Set(L.map(([t]) => t))].forEach((t) => { const d = MONSTRES[t]; if (!d) return;
    CLES_SORTS101.forEach((k) => { if (typeof d[k] === 'number') { sortsSauves101.push([d, k, d[k]]); d[k] = +(d[k] * x).toFixed(2); } });
    Object.keys(d).forEach((k) => { const o = d[k]; if (o && typeof o === 'object' && !Array.isArray(o) && typeof o.periode === 'number') { sortsSauves101.push([d, k, o]); d[k] = Object.assign({}, o, { periode: +(o.periode * x).toFixed(2) }); } }); });
}
function rendreSorts101() { if (sortsSauves101) sortsSauves101.forEach(([d, k, v]) => { d[k] = v; }); sortsSauves101 = null; }
/* une version armee (au lancement, ou par le bot du banc) : sa horde, ses sorts, et ce que lancerVague lira ; desarmee a la fin de la vague */
function armerEssai101(k) {
  const v = ESSAI101.ordre[k], V = versionEssai101(v);
  HORDE_ESSAI = V.P.horde || 0; accelererSorts101(V.L, V.P.sorts);
  ESSAI101.lance = { n: ESSAI101.n, v, f: 1, k, P: V.P, compo: () => compoEssai101(V.L, V.P.horde) };
  if (typeof ouvrirTourbe === 'function') ouvrirTourbe(); /* (la Tourbe qu'ils ramassent : visible dans la grange) */
}
function desarmerEssai101() { HORDE_ESSAI = 0; rendreSorts101(); ESSAI101.lance = null; }
function lancerEssai101() {
  if (!essaiVisible101() || combat) return; armerEssai101(rangEssai101());
  fermerModale(); lancerVague(); if (!combat && !lancerVague.charge) desarmerEssai101(); /* (pas lancee, le repos par exemple : rien ne reste pour la vague suivante) */
}
/* la carte de la serie, dans la fenetre des vagues (onglet Les vagues, quand tous les paliers sont termines) */
function carteEssai101() {
  const E = etatEssai101(), tot = ESSAI101.ordre.length, fin = toutFini101(), k = rangEssai101(), V = versionEssai101(versionCourante101()), n = ESSAI101.n, repos = S_.vague.repos - Date.now(), nbOk = ESSAI101.ordre.filter((v) => E.gagnes[v]).length;
  const img = (x) => '<img src="assets/icones/' + x + '.png?v=' + VERSION_MODELES + '" alt="">';
  const pistes = ESSAI101.ordre.map((v, j) => '<i class="' + (j === k ? 'ici' : E.gagnes[v] ? 'fait' : '') + '" style="cursor:pointer" data-essai101-choix="' + j + '" data-info="' + nomEssai101(j) + ' : ' + ESSAI101.versions[v].nom + (E.gagnes[v] ? ', réussie' : '') + '. Touche pour la choisir">' + (E.gagnes[v] && j !== k ? '✓' : '.' + (j + 1)) + '</i>').join('');
  const mons = compoEssai101(V.L, V.P.horde).map(([t, nb]) => { const M = MONSTRES[t];
    return '<button class="vg-mon" data-fiche-monstre="' + t + '" data-info="Sa fiche">' + img(M.icone) + '<b>× ' + nb + '</b><span>' + M.nom + '</span><small>' + fmt(Math.round(pvMonstre(t, n) * (V.P.pv || 1))) + ' PV</small></button>'; }).join('');
  const g = gainsVague(n, true), plein = gainsVague(n, false), bonus = Math.max(0, plein.kamas - g.kamas), dejaV = !!E.gagnes[V.v];
  const bouton = repos > 0 ? '<button class="btn vg-lancer" disabled>Ton perso se repose encore ' + dureeLisible(repos) + '</button>' : '<button class="btn kamas vg-lancer" data-essai101>' + (E.gagnes[V.v] ? 'Rejouer la ' : 'Lancer la ') + nomEssai101(k).toLowerCase() + '</button>';
  return '<div class="essai-carte"><div class="essai-t"><b>Vague 101 : la saison des pluies, en avant-première</b><span>' + (fin ? 'série terminée, merci !' : nbOk + ' sur ' + tot + ' réussie' + (nbOk > 1 ? 's' : '')) + '</span></div>' +
    '<p>Aide-nous à régler le prochain palier : ' + tot + ' versions de la vague 101, chacune dure à sa façon (la 101.9 et la 101.10, les dernières venues, sont plus dures). Joue-les dans l\'ordre que tu veux (touche un numéro), et à la fin de chaque vague donne-lui une note de difficulté de 0 à 10. Une vague perdue se retente après ton repos. Les ressources gagnées vont dans le coffre de la série, et les bâtiments touchés sont réparés gratuitement à la fin de la vague.</p>' +
    '<div class="essai-pistes">' + pistes + '</div>' + ligneCoffre101() + '<p class="essai-v"><b>' + nomEssai101(k) + ' · ' + V.P.nom + '</b> : ' + V.P.desc + '.</p><div class="vg-mons">' + mons + '</div>' +
    '<div class="essai-pied"><span>' + img('kama') + fmt(g.kamas) + ' kamas' + (!dejaV && !fin ? ', +' + fmt(bonus) + ' à ta première victoire de cette version' : '') + '. Des ressources, mais aucune pièce d\'équipement.</span>' + bouton + '</div></div>';
}
function ligneCoffre101() {
  const E = etatEssai101(), C = coffre101(), n = nbCoffre101(), notes = VERSIONS_COFFRE101.filter((v) => (E.notes || {})[v] != null).length, gagnes = VERSIONS_COFFRE101.filter((v) => E.gagnes[v]).length;
  const detail = Object.keys(C).filter((k) => C[k] > 0 && PAR_ID[k]).map((k) => C[k] + ' ' + PAR_ID[k].nom).join(', ') || 'rien pour l\'instant';
  const rattrape0 = notesManquantes101(E); if (E.coffreOuvert) return rattrape0 + '<p class="essai-coffre ouvert">' + img101('coffre-ouvert') + '<span><b>Le coffre de la série est ouvert.</b> Merci pour tes notes ! La 101.9 et la 101.10 sont en plus : leurs ressources vont directement dans ta grange.</span></p>';
  return notesManquantes101(E) + ligneCoffreFin101(E, n, detail, notes, gagnes); }
function notesManquantes101(E) {
  const aNoter = ESSAI101.ordre.map((v, j) => [v, j]).filter(([v]) => E.gagnes[v] && (E.notes || {})[v] == null), pourCoffre = !E.coffreOuvert && aNoter.some(([v]) => VERSIONS_COFFRE101.includes(v)); /* (24/11/2026, « j'ai fini les 8 vagues, je fais comment pour recuperer le coffre ? », Mathieu : une note oubliee dans le bilan ne pouvait plus se donner ; elle se donne ici) */
  return aNoter.length ? '<div class="essai-bilan"><b>Il te manque ' + (aNoter.length > 1 ? aNoter.length + ' notes' : 'une note') + (pourCoffre ? ' pour ouvrir le coffre :' : ' :') + '</b>' + aNoter.map(([v, j]) => '<div class="essai-note"><span>' + nomEssai101(j) + ' · ' + ESSAI101.versions[v].nom + ' :</span><div class="essai-notes">' + Array.from({ length: 11 }, (x, i) => '<button class="btn mini" data-note101="' + i + '" data-note101v="' + v + '">' + i + '</button>').join('') + '</div></div>').join('') + '<small>0 : trop facile · 5 : correcte · 10 : hardcore, impossible</small></div>' : '';
}
function ligneCoffreFin101(E, n, detail, notes, gagnes) {
  return '<p class="essai-coffre" data-info="Dans le coffre : ' + detail + '">' + img101('coffre-legendaire') + '<span><b>Le coffre de la série :</b> ' + n + ' ressource' + (n > 1 ? 's' : '') + ' gagnée' + (n > 1 ? 's' : '') + ' dans tes vagues réussies, plus ' + fmt(COFFRE101.kamas) + ' kamas, ' + COFFRE101.forge + ' runes de forgemagie et 1 rune parfaite. Il s\'ouvre quand les ' + VERSIONS_COFFRE101.length + ' premières versions sont gagnées et notées (' + gagnes + ' gagnées, ' + notes + ' notées).</span></p>';
}
const img101 = (x) => '<img src="assets/icones/' + x + '.png?v=' + VERSION_MODELES + '" alt="">';
/* (23/11/2026 : dans le mode test, la carte se montre aussi en haut de l'onglet de la vague, tant que sa vraie partie a fini le dernier palier des joueurs) */
const essaiIci101 = () => essaiVisible101() && (S_.vague.num > vaguesOuvertes() || MODE_TEST);
{ const ouvrirVaguesE = ouvrirVagues; ouvrirVagues = function (onglet) {
    const r = ouvrirVaguesE.call(this, typeof onglet !== 'string' && modaleOuverte !== 'vagues' && S_.vague.num > vaguesOuvertes() && essaiVisible101() ? 'vague' : onglet); /* (la serie ouverte : la fenetre s'ouvre sur Les vagues, pas sur Refaire un boss) */
    try { const a = document.querySelector('#carte .vg-aide') || document.querySelector('#carte .vg-entete'); if (modaleOuverte === 'vagues' && ouvrirVagues.onglet === 'vague' && essaiIci101() && a) a.insertAdjacentHTML(a.classList.contains('vg-aide') ? 'afterend' : 'beforebegin', carteEssai101()); } catch (e) { /* (la fenetre reste comme avant) */ }
    return r; }; }
/* apres la vague : le compte de la serie, la ligne du journal completee, la note et le commentaire dans le bilan ; la version desarmee */
{ const finVagueE = finVague; finVague = function (gagne, fuite) {
    const c = combat, es = c && !c.fin && es101(c); let r;
    if (es && gagne && c.coffre101) { try { const C = coffre101(); Object.keys(c.coffre101).forEach((k) => { C[k] = (C[k] || 0) + c.coffre101[k]; }); } catch (e) { /* rien */ } } /* (le coffre de la serie, 24/11/2026) */
    try { r = finVagueE.apply(this, arguments); } finally { if (es) desarmerEssai101(); }
    if (es) { try { es.nbCoffre = c.coffre101 ? Object.values(c.coffre101).reduce((t, n) => t + n, 0) : 0; apresEssai101(es, !!gagne, !!fuite); } catch (e) { /* (le bilan reste comme avant) */ } }
    return r; }; }
function apresEssai101(es, gagne, fuite) {
  const E = etatEssai101(), v = es.v, premiere = gagne && !E.gagnes[v];
  E.essais[v] = (E.essais[v] || 0) + 1; const fois = E.essais[v];
  let bonus = 0; if (premiere) { bonus = Math.max(0, gainsVague(ESSAI101.n, false).kamas - gainsVague(ESSAI101.n, true).kamas); S_.kamas += bonus; rendreHaut(); }
  if (gagne) { E.gagnes[v] = (E.gagnes[v] || 0) + 1; E.i++; E.choix = null; } /* (apres une victoire, la fenetre propose la suivante pas encore reussie) */
  const J = S_.journalVagues, e = Array.isArray(J) ? J[J.length - 1] : null; if (e && e.n === ESSAI101.n && !e.essai) e.essai = { v, rang: ESSAI101.ordre.indexOf(v) + 1, fois, serie: ESSAI101.serie };
  sauver(); const carte = $('carte'); if (!carte || modaleOuverte !== 'vague-fin' || !e) return;
  const rang = ESSAI101.ordre.indexOf(v) + 1, suite = gagne ? (serieFinie101() ? 'Série terminée, merci ! Chaque version reste rejouable : choisis-la dans la fenêtre des vagues.' : 'Choisis la suivante dans la fenêtre des vagues.') : fuite ? '' : 'Tu peux la retenter après ton repos.';
  const notes = Array.from({ length: 11 }, (x, i) => '<button class="btn mini" data-note101="' + i + '">' + i + '</button>').join('');
  const bloc = '<div class="essai-bilan"><b>' + nomEssai101(rang - 1) + ' · ' + ESSAI101.versions[v].nom + (gagne ? ' : réussie' : fuite ? ' : abandonnée' : ' : perdue') + '</b>' + (fois > 1 ? ' <small>(tentative ' + fois + ')</small>' : '') +
    (bonus ? '<p>+' + fmt(bonus) + ' kamas pour ta première victoire de cette version.</p>' : '') + (suite ? '<p>' + suite + '</p>' : '') +
    (gagne && es.nbCoffre ? '<p>' + es.nbCoffre + ' ressource' + (es.nbCoffre > 1 ? 's' : '') + ' de cette vague dans le coffre de la série.</p>' : !gagne ? '<p>Les ressources de cette vague sont perdues : seules les versions gagnées remplissent le coffre.</p>' : '') +
    '<div class="essai-note"><span>Ta note de difficulté :</span><div class="essai-notes">' + notes + '</div><small>0 : trop facile · 5 : correcte · 10 : hardcore, impossible</small></div>' +
    '<div class="essai-com"><textarea maxlength="' + COMMENTAIRE101 + '" rows="2" placeholder="Un commentaire ? (facultatif) : ce qui t\'a gêné, un monstre trop fort, une idée…"></textarea><button class="btn mini" data-essai-com>Envoyer</button></div></div>';
  carte.querySelectorAll('p').forEach((p) => { if (p.textContent.includes('tous les paliers sont termin')) p.remove(); }); /* (le bilan d'une vague rejouee disait « le Machefange est tombe » : faux pour un essai) */
  const art = carte.querySelector('.art'); if (art) art.insertAdjacentHTML('afterend', bloc); else carte.insertAdjacentHTML('beforeend', bloc);
}
/* LES BATIMENTS REPARES GRATUITEMENT APRES UNE VAGUE D'ESSAI (24/11/2026, « les degats de batiment qu'ils prennent et qu'il faut repayer sur les tests de la
   vague 101, ca ne leur coute 0 ? ils peuvent reparer free ? », Mathieu) : a la fin de la vague (gagnee, perdue ou abandonnee), chaque batiment perd exactement
   les degats pris pendant la vague (combat.bats, tenu par blesserBat), ruine comprise ; ce qu'il avait deja avant la vague reste a reparer, comme avant.
   Les degats en cours sont aussi notes dans la sauvegarde (essai101.batsEnCours) : une page fermee en pleine vague les rend au chargement suivant. */
function rendreBatsEssai101(s, D) {
  const L = []; if (!s || !s.bats || !D) return L;
  Object.keys(D).forEach((k) => { const b = s.bats[k], d = Math.round(D[k] || 0); if (!b || d <= 0) return;
    L.push({ k, ruine: !!b.ruine }); b.deg = Math.max(0, (b.deg || 0) - d); delete b.ruine; if (!b.deg) delete s.bats[k]; });
  return L;
}
{ const blesserBatE = blesserBat; blesserBat = function () { const r = blesserBatE.apply(this, arguments);
    try { if (es101(combat) && !combat.fin && combat.bats) etatEssai101().batsEnCours = Object.assign({}, combat.bats); } catch (e) { /* rien */ } return r; }; }
{ const chargerE = charger; charger = function () { const s = chargerE.apply(this, arguments);
    try { const E = s && s.essai101; if (E && E.batsEnCours) { rendreBatsEssai101(s, E.batsEnCours); delete E.batsEnCours; } } catch (e) { /* (la sauvegarde reste comme elle est) */ } return s; }; }
{ const finVagueE = finVague; finVague = function (gagne, fuite) {
    const c = combat, es = c && !c.fin && es101(c), r = finVagueE.apply(this, arguments);
    if (es) { try { reparerApresEssai101(c); } catch (e) { /* (le bilan reste comme avant) */ } }
    return r; }; }
function reparerApresEssai101(c) {
  delete etatEssai101().batsEnCours; const L = rendreBatsEssai101(S_, c.bats); if (!L.length) { sauver(); return; }
  L.forEach((x) => { majFeu(x.k, true); if (x.ruine) { ecarterPerso(casesDeCle(x.k)); if (typeCle(x.k) === 'grange') rendreArbaleteBulle(); } });
  majBarresBat(); rendreHaut(); sauver();
  const carte = $('carte'); if (!carte || modaleOuverte !== 'vague-fin') return;
  L.forEach((x) => carte.querySelectorAll('[data-reparer="' + x.k + '"], [data-reconstruire="' + x.k + '"]').forEach((e) => {
    const ligne = e.closest('.art'), d = ligne && ligne.querySelector('.desc'), reste = degatsBat(x.k) || enRuine(x.k), cout = enRuine(x.k) ? coutReconstruire(x.k) : coutReparer(x.k);
    if (d) d.textContent = reste ? 'Les dégâts de la vague d\'essai sont réparés gratuitement. Restent ceux d\'avant : ' + fmt(pvBat(x.k)) + ' PV sur ' + fmt(pvMaxBat(x.k)) + '.' : 'Vague d\'essai : réparé gratuitement, ' + fmt(pvMaxBat(x.k)) + ' PV sur ' + fmt(pvMaxBat(x.k)) + '.';
    e.outerHTML = reste ? '<button class="btn kamas" data-reparer="' + x.k + '">Réparer ' + fmt(cout) + ' ' + KAMA + '</button>' : '<span class="cadenas">✓ Gratuit</span>'; }));
  const tb = carte.querySelector('[data-tout-reparer]');
  if (tb) { const reste = tb.dataset.toutReparer.split(',').filter((k) => degatsBat(k) || enRuine(k)), total = reste.reduce((t, k) => t + (enRuine(k) ? coutReconstruire(k) : coutReparer(k)), 0);
    if (reste.length < 2) tb.parentNode.remove(); else { tb.dataset.toutReparer = reste.join(','); tb.innerHTML = 'Tout réparer ' + fmt(total) + ' ' + KAMA; } }
  carte.querySelectorAll('b').forEach((b) => { if (b.textContent.includes('répare avant la prochaine vague')) b.textContent = b.textContent.replace('répare avant la prochaine vague', 'c\'est réparé gratuitement, c\'est une vague d\'essai'); });
  const bloc = carte.querySelector('.essai-bilan'); if (bloc) { const p = bloc.querySelector('.essai-note'); if (p) p.insertAdjacentHTML('beforebegin', '<p>Tes bâtiments touchés pendant la vague sont réparés gratuitement.</p>'); }
}
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-essai101], [data-essai101-choix], [data-note101], [data-essai-com]'); if (!b) return;
  if (b.hasAttribute('data-essai101')) { lancerEssai101(); return; }
  if (b.hasAttribute('data-essai101-choix')) { etatEssai101().choix = +b.dataset.essai101Choix; ouvrirVagues('vague'); return; }
  const J = S_.journalVagues, e = Array.isArray(J) ? J[J.length - 1] : null;
  if (b.hasAttribute('data-essai-com')) { const boite = b.closest('.essai-com'), ta = boite && boite.querySelector('textarea'), v = ta ? ta.value.trim().slice(0, COMMENTAIRE101) : ''; if (!v) { if (ta) ta.focus(); return; }
    if (e && e.essai) { e.essai.commentaire = v; sauver(); } boite.innerHTML = '<span>Merci, ton commentaire est noté !</span>'; return; }
  if (b.dataset.note101v) { const v = b.dataset.note101v, E = etatEssai101(), note = Math.max(0, Math.min(10, +b.dataset.note101 || 0)); if (!ESSAI101.versions[v]) return;
    E.notes = E.notes || {}; E.notes[v] = note; if (Array.isArray(J)) { for (let i = J.length - 1; i >= 0; i--) { const x = J[i]; if (x && x.essai && x.essai.v === v) { if (x.essai.note == null) x.essai.note = note; break; } } } /* (la derniere partie de cette version, pour outils/essai101.py) */
    sauver(); if (serieFinie101() && serieNotee101() && !E.coffreOuvert) { fermerModale(); setTimeout(ouvrirCoffre101, 300); } else ouvrirVagues('vague'); return; }
  const note = Math.max(0, Math.min(10, +b.dataset.note101 || 0)), z = b.closest('.essai-note');
  if (e && e.essai) { e.essai.note = note; const E = etatEssai101(); E.notes = E.notes || {}; E.notes[e.essai.v] = note; sauver(); }
  if (z) z.innerHTML = '<span>Merci, noté ' + note + ' sur 10 !</span>';
  if (serieFinie101() && serieNotee101() && !etatEssai101().coffreOuvert) setTimeout(ouvrirCoffre101, 600); /* (le coffre de la serie : la huitieme note donnee) */
});
/* le butin d'un essai : les ressources seulement, aucune piece (23/11/2026, « donne pas de loot d'item, que des ressources », Mathieu) */
{ const butinE = butin; butin = function (mo) { const c = combat; if (!es101(c)) return butinE(mo); c.sansObjets = true; if (etatEssai101().coffreOuvert) return butinE(mo); /* (le coffre deja ouvert : directement dans la grange) */
    const avant = Object.assign({}, S_.grange || {}); let r; try { r = butinE(mo); } finally { /* (le coffre de la serie : ce qui vient d'arriver dans la grange passe dans la reserve du combat) */
      try { const G = S_.grange || {}; c.coffre101 = c.coffre101 || {}; Object.keys(G).forEach((k) => { const d = (G[k] || 0) - (avant[k] || 0); if (d > 0 && PAR_ID[k]) { G[k] -= d; c.coffre101[k] = (c.coffre101[k] || 0) + d; } }); } catch (e) { /* rien */ } }
    return r; }; }
const coffre101 = () => { const E = etatEssai101(); return (E.coffre = E.coffre || {}); };
const nbCoffre101 = () => Object.values(coffre101()).reduce((t, n) => t + n, 0);
const serieNotee101 = () => VERSIONS_COFFRE101.every((v) => (etatEssai101().notes || {})[v] != null);
function ouvrirCoffre101() {
  const E = etatEssai101(); if (E.coffreOuvert || !serieFinie101() || !serieNotee101()) return; E.coffreOuvert = true;
  const C = coffre101(), G = S_.grange = S_.grange || {}; Object.keys(C).forEach((k) => { G[k] = (G[k] || 0) + C[k]; });
  S_.kamas += COFFRE101.kamas; runes().forge = (runes().forge || 0) + COFFRE101.forge; runes().parfaite = (runes().parfaite || 0) + COFFRE101.parfaite;
  sauver(); rendreGrange(); rendreHaut(); son('niveau');
  const cartes = [{ ico: 'kama', n: COFFRE101.kamas, t: 'kamas', son: 'kamas' }, { ico: 'rune-forge', n: COFFRE101.forge, t: 'runes de forgemagie', son: 'quete' }, { ico: 'rune-parfaite', n: COFFRE101.parfaite, t: 'rune parfaite', brille: true }]
    .concat(Object.keys(C).filter((k) => C[k] > 0 && PAR_ID[k]).sort((a, b) => C[b] - C[a]).map((k) => ({ ico: k, n: C[k], t: PAR_ID[k].nom })));
  if (!(typeof ouvertureMobile === 'function' && ouvertureMobile({ rar: 'legendaire', cartes, titre: 'Le coffre de la série', sousTitre: 'Merci pour tes huit notes !' })))
    toast('Le coffre de la série s\'ouvre : ' + fmt(COFFRE101.kamas) + ' kamas, ' + COFFRE101.forge + ' runes de forgemagie, 1 rune parfaite et ' + nbCoffre101() + ' ressources. Merci !', 'or');
}
