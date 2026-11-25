'use strict';
/* LE COMBUSTIBLE DE LA TOUR A FILETS (19/11/2026, version dev : mode test seulement). Mathieu : « la fumee qui s'en echappe c'est une vraie fumee ? j'aimerais
   qu'il faille aussi l'alimenter avec une ressource, normalement ce serait du charbon, mais du charbon on en a pas », puis « qu'on puisse faire du charbon de
   bois et de la tourbe des marais aussi, les deux ».
   - le charbon de bois se fabrique a l'atelier (6 Ecorces d'Abraknyde, 4 Branches de Kaliptus et 5 000 kamas pour 10 : « il faut plus de ressources et de
     kamas pour les crafts », Mathieu, 19/11/2026 ; 3 et 2 sans kamas avant) ;
   - la tourbe des marais tombe sur la tribu de la mare (vagues 101 a 110), comme les autres ressources de monstres ;
   - la tour a une reserve de feu (30) : un charbon de bois donne 1 feu, une motte de tourbe 2 (elle brule lentement) ; chaque filet tire brule 1 feu. Sans feu,
     elle ne tire plus et sa cheminee ne fume plus ; avec du feu, une vraie fumee sort de sa cheminee (celle de la grange), plus noire a chaque tir.
   Point de depart, chiffres a valider. */
const COMBUSTIBLE = { max: 30, charbon: 1, tourbe: 2 };
PAR_ID.tourbe = { id: 'tourbe', nom: 'Tourbe des marais', prix: 460, xp: 0 };
/* (23/11/2026, avant la sortie du palier 11 : elle n'etait que dans PAR_ID, donc invisible dans la grange et absente de l'HDV.) Elle rejoint les ressources de
   monstres, apres la Soie d'Arakne, des que le palier 11 est ouvert pour cette partie : a l'entree du mode test, et pour tous des la sortie (PALIERS.push(PALIER_MARE)),
   sans rien d'autre a changer. Avant, rien ne bouge pour les joueurs (pas de cours tire en plus : celui des autres ressources reste le meme) */
function ouvrirTourbe() {
  const t = PAR_ID.tourbe; if (VENDABLES.includes(t)) return; [RES_MONSTRES, VENDABLES].forEach((L) => { const i = L.indexOf(PAR_ID.brassard_vsa); L.splice(i >= 0 ? i : L.length, 0, t); });
  if (S_ && S_.cours && !S_.cours.tourbe) S_.cours.tourbe = 1;
}
if (PALIERS.includes(PALIER_MARE)) ouvrirTourbe();
const entrerModeTestTourbe = entrerModeTest; entrerModeTest = function () { const r = entrerModeTestTourbe.apply(this, arguments); if (MODE_TEST) ouvrirTourbe(); return r; };
['tetard', 'crapaud', 'triton', 'fouette', 'axolotl', 'mereCrapaude', 'crocoVase', 'piranha', 'brochet', 'silure', 'crocoBoss'].forEach((k) => { if (MONSTRES[k]) MONSTRES[k].res = 'tourbe'; });
/* LES RECETTES DE L'ATELIER EN COURS (19/11/2026) : le drapeau dev des recettes ne cache plus rien depuis que VSA est sorti aux joueurs (vsaDev() est
   toujours vrai) ; celles-ci ne sont ajoutees a l'atelier que dans le mode test, le temps d'ouvrir la fenetre ou de fabriquer */
const RECETTES_DEV_ATELIER = [];
const ouvrirAtelierDev = ouvrirAtelier; ouvrirAtelier = function () { const n = RECETTES_ATELIER.length; if (p11Ouvert()) RECETTES_ATELIER.push(...RECETTES_DEV_ATELIER); try { return ouvrirAtelierDev(); } finally { RECETTES_ATELIER.length = n; } };
const fabriquerDev = fabriquer; fabriquer = function (id, fois) { const n = RECETTES_ATELIER.length; if (p11Ouvert()) RECETTES_ATELIER.push(...RECETTES_DEV_ATELIER); try { return fabriquerDev(id, fois); } finally { RECETTES_ATELIER.length = n; } };
RECETTES_DEV_ATELIER.push({ id: 'charbon', nom: 'Charbon de bois', donne: 10, stock: 'charbon', kamas: 5000, il: [['ecorce_abraknyde', 6], ['kaliptus', 4]], ico: 'charbon-bois', minuscule: 'charbons de bois',
  apres: '. Verse-les dans ta tour à filets : touche-la.',
  desc: 'Le combustible de la tour à filets : un charbon de bois lui fait tirer un filet. La tourbe des marais, laissée par la tribu de la mare, brûle deux fois plus longtemps.' });
const feuTour = () => S_.feuTour || 0;
const K_TOUR_FILET = ECH_TOUR * 1.3, CHEMINEE_TOUR_FILET = [-0.58, 4.92, -0.5]; /* (le haut de la cheminee dans le modele, blender/tour-filet-pistes.py, apres elancer) */
/* la fumee : celle des cheminees de la grange, sur la tour posee, visible seulement quand elle a du feu (construireBatiments vide les fumees et refait la tour) */
const poserTourFiletBatiFeu = poserTourFiletBati; poserTourFiletBati = function (pose) {
  poserTourFiletBatiFeu(pose); const T1 = tourFiletEssai; if (!T1) return;
  T1.fumee = fumerCheminee(T1.m, 0, new T.Vector3(...CHEMINEE_TOUR_FILET.map((v) => v * K_TOUR_FILET))); if (T1.fumee) { T1.fumee.children.forEach((b) => { b.raycast = () => {}; }); T1.fumee.visible = feuTour() > 0; }
};
function bouffeeTir() { /* a chaque filet, la cheminee crache une bouffee plus noire */
  const T0 = tourFiletEssai; if (!T0 || !T0.fumee) return; const p = T0.fumee.getWorldPosition(new T.Vector3());
  for (let i = 0; i < 5; i++) emettre(FX_FUM, 1, { x: p.x + fxEntre(-0.08, 0.08), y: p.y + 0.05, z: p.z + fxEntre(-0.08, 0.08), v: [fxEntre(-0.3, 0.3), fxEntre(1.4, 2.2), fxEntre(-0.3, 0.3)], vie: [0.9, 1.4], taille: [0.35, 1.1], c: ['#4a4744', '#7d7873'], a: 0.6, frein: 1.4, vrot: 1.2, entree: 0.08 });
}
const lancerFiletFeu = lancerFilet; lancerFilet = function (mo) { S_.feuTour = Math.max(0, feuTour() - 1); bouffeeTir(); return lancerFiletFeu(mo); };
const majTourFiletFeu = majTourFilet; majTourFilet = function (dt) {
  const T0 = tourFiletEssai; if (T0 && T0.fumee) { T0.fumee.visible = feuTour() > 0; if (!fumeesCheminee.includes(T0.fumee)) fumeesCheminee.push(T0.fumee); } /* (la ferme reconstruite vide la liste des fumees : la sienne y revient) */
  if (T0 && !amelioCachee('tourFilet') && combat && combat.raid && !combat.fin && feuTour() <= 0) { if (!T0.vide) { T0.vide = true; toast('La tour à filets n\'a plus de combustible : elle ne tire plus.', 'alerte'); } return; }
  if (T0) T0.vide = false; return majTourFiletFeu(dt);
};
/* alimenter la tour : la reserve de feu, le charbon de bois (atelier) et la tourbe des marais (grange) */
function ouvrirFeuTour() {
  const ch = S_.charbon || 0, tb = (S_.grange || {}).tourbe || 0, f = feuTour(), place = COMBUSTIBLE.max - f;
  const nC = Math.min(ch, Math.floor(place / COMBUSTIBLE.charbon)), nT = Math.min(tb, Math.floor(place / COMBUSTIBLE.tourbe)), pl = (n, s) => n + ' ' + s + (n > 1 ? 's' : '');
  ouvrirModale('feu-tour', entete('La tour à filets') + '<p class="hdv-aide">Pendant une simu VSA, toutes les ' + TOUR_FILET.cadence + ' s, elle lance un filet sur le voleur le plus chargé à ' + TOUR_FILET.portee + ' cases autour d\'elle : il reste pris ' + TOUR_FILET.pris + ' s et lâche la moitié de son butin, qui revient à ta grange.</p>' +
    '<p class="hdv-aide">Réserve de feu : <b>' + f + ' / ' + COMBUSTIBLE.max + '</b>' + (f ? '' : ' (elle est froide)') + '. Chaque filet tiré brûle 1 feu ; sans feu, la tour ne tire plus et ne fume plus.<br>Un charbon de bois donne 1 feu (atelier : 6 Écorces d\'Abraknyde, 4 Branches de Kaliptus et 5 000 kamas pour 10), une motte de tourbe des marais 2 (laissée par la tribu de la mare).</p>' +
    '<div class="act"><button class="btn" data-feu-verser="charbon"' + (nC ? '' : ' disabled') + '>Verser ' + pl(nC, 'charbon') + ' (tu en as ' + ch + ')</button> ' +
    '<button class="btn" data-feu-verser="tourbe"' + (nT ? '' : ' disabled') + '>Verser ' + pl(nT, 'motte') + ' de tourbe (tu en as ' + tb + ')</button>' +
    (MODE_TEST ? ' <button class="btn discret" data-feu-verser="essai">+10 charbons et +10 tourbes (essai)</button>' : '') + '</div>' +
    '<p class="hdv-aide" style="margin-top:8px">Pour la déplacer ou la tourner : Aménager.</p>' + (MODE_TEST ? '<div class="act-bas"><small>Version dev (mode test)</small></div>' : ''));
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-feu-verser]'); if (!b || amelioCachee('tourFilet') || !niv('tourFilet')) return;
  const k = b.dataset.feuVerser, place = COMBUSTIBLE.max - feuTour(); S_.grange = S_.grange || {};
  if (k === 'essai') { if (!MODE_TEST) return; S_.charbon = (S_.charbon || 0) + 10; S_.grange.tourbe = (S_.grange.tourbe || 0) + 10; }
  else if (k === 'charbon') { const n = Math.min(S_.charbon || 0, Math.floor(place / COMBUSTIBLE.charbon)); S_.charbon -= n; S_.feuTour = feuTour() + n * COMBUSTIBLE.charbon; if (n) toast('+' + n * COMBUSTIBLE.charbon + ' feu : la tour fume.', 'or'); }
  else if (k === 'tourbe') { const n = Math.min(S_.grange.tourbe || 0, Math.floor(place / COMBUSTIBLE.tourbe)); S_.grange.tourbe -= n; S_.feuTour = feuTour() + n * COMBUSTIBLE.tourbe; if (n) toast('+' + n * COMBUSTIBLE.tourbe + ' feu : la tour fume.', 'or'); }
  const T0 = tourFiletEssai; if (T0 && T0.fumee) T0.fumee.visible = feuTour() > 0; sauver(); ouvrirFeuTour();
});
/* LA POUDRE D'OS (25/11/2026, une idee de l'atelier, IDEES-ATELIER.md ; « 1 os de Chafer ca fait 2 poudres, pas besoin de kamas ; 1 poudre peut etre utilisee
   sur une parcelle et dure le temps de la culture », Mathieu ; +50 % au formulaire ; version dev d'abord) : a l'atelier, 1 Os de Chafer donne 2 poudres ;
   sur un champ plante, elle le fait pousser 50 % plus vite jusqu'a la recolte (06-temps.js ; la recolte et la remise a nu l'effacent, champVide). On la repand
   en touchant un champ qui pousse (la fenetre de la parcelle). */
const POUDRE_OS = { bonus: 1.5 };
RECETTES_DEV_ATELIER.push({ id: 'poudre_os', nom: 'Poudre d\'os', donne: 2, stock: 'poudreOs', il: [['os_chafer', 1]], ico: 'os_chafer', minuscule: 'poudres d\'os',
  apres: '. Répands-la sur un champ qui pousse : touche-le.',
  desc: 'De l\'os de Chafer moulu : sur un champ planté, la culture pousse 50 % plus vite jusqu\'à sa récolte. Un Os de Chafer en donne deux.' });
const blocPoudre = (p) => { const n = S_.poudreOs || 0; if (p.poudre) return '<p class="poudre-os">✓ Poudre d\'os répandue : cette culture pousse 50 % plus vite jusqu\'à sa récolte.</p>';
  if (!n) return ''; return '<div class="act"><button class="btn kamas" data-poudre-os="' + p.id + '">Répandre de la poudre d\'os (tu en as ' + fmt(n) + ')</button></div><p class="hdv-aide">La culture poussera 50 % plus vite jusqu\'à sa récolte.</p>'; };
{ const mettreANuP = ACTIONS.mettreANu; ACTIONS.mettreANu = function (id, confirme) { const r = mettreANuP.apply(this, arguments); if (confirme) return r;
  const p = S_.cases.find((c) => c.id === id), m = document.querySelector('#modale .confirme'); if (p && m && modaleOuverte === 'nu') { const h = blocPoudre(p); if (h) m.insertAdjacentHTML('afterbegin', '<div class="poudre-bloc">' + h + '</div>'); } return r; }; }
document.addEventListener('click', (e) => { const b = e.target.closest('[data-poudre-os]'); if (!b) return; const p = S_.cases.find((c) => c.id === b.dataset.poudreOs);
  if (!p || p.type !== 'champ' || !p.c || p.poudre || p.pousse >= duree(PAR_ID[p.c]) || !(S_.poudreOs > 0)) return;
  S_.poudreOs--; p.poudre = 1; fermerModale(); son('planter'); const q = posCase(p);
  emettre(FX_FUM, 10, { x: q.x, y: q.y + 0.15, z: q.z, r: 0.5, plat: true, v: [0, 0.5, 0], dv: 0.6, vie: [0.6, 1.0], taille: [0.3, 0.8], c: ['#f6f0e2', '#e8dfc8'], a: 0.6, frein: 2, entree: 0.1 });
  emettre(FX_VIF, 14, { x: q.x, y: q.y + 0.6, z: q.z, r: 0.5, v: [0, -0.5, 0], dv: 0.6, vie: [0.5, 0.8], taille: [0.05, 0.03], c: ['#ffffff', '#efe6d2'], grav: 2, sol: q.y + 0.05 });
  toast('Poudre d\'os répandue : ' + PAR_ID[p.c].nom + ' pousse 50 % plus vite jusqu\'à sa récolte.'); rendreCase(p.id); sauver(); });
