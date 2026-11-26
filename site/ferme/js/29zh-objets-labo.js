'use strict';
/* LES OBJETS DU LABO DE WABBENSTEIN (26/11/2026, « des petits stuffs pour le donjon du Wabbenstein ; on ne fait pas une panoplie, un item par monstre, des stats
   vraiment tres differentes, pour completer un build ou tu as une panoplie de 2 ou 4 items ; le loot doit etre vraiment dur, 2 voire 3 fois plus dur que les vagues,
   et en rare encore plus dur », Mathieu ; au formulaire : « 3 fois plus dur », niveau 100, un legendaire du Docteur plus tard ; puis, liste revue : le vol de vie
   « reduis-le a 0,6 au max », venin et ecailles a expliquer, la Ruee des pattes a changer). Version dev : le labo n'est pas encore sorti.
   - Un objet par monstre du labo, hors panoplie (aucun bonus de panoplie, o.labo : le monstre qui le lache), niveau 100, rare a x1,5 (sauf la portee et le vol
     de vie, les memes en rare) ; leur icone : celle de leur monstre, en attendant les leurs.
   - Le butin : dans le labo (combat.genre 'donjon'), chaque mutant abattu a 7 / 3 % de chance (environ 2,3 %) de lacher l'objet de son type, Prospection comprise ;
     les specimens des cuves et les chefs des camps 7 % ; la version rare deux fois plus rare qu'en vague (CHANCE_RARE x 0,5).
   - Deux stats nouvelles : la portee (+1 case, statsPerso, 21-combat.js) et le vol de vie (en dixiemes de %, DIXIEMES, 03-equipements.js : 4 a 6 = 0,4 a 0,6 %) */
CARACS.portee = ['Portée', ' case de portée en plus', picto('portee', '#c0392b')];
CARACS.volVie = ['Vol de vie', ' % de tes dégâts rendus en vie', picto('soin', '#a8324a')];
DIXIEMES.volVie = 10;
const OBJETS_LABO = [
  ['labo-viseur', 'coiffe', 'Viseur du drone', 'wabDrone', 'wab-drone', { portee: [1, 1], prospection: [15, 25] }],
  ['labo-cape', 'cape', 'Cape du vampire', 'wabVampire', 'wab-vampire', { vita: [500, 750], volVie: [4, 6] }],
  ['labo-fiole', 'amulette', 'Fiole de mutagène', 'wabFluo', 'wab-fluo-b', { puissance: [45, 70], venin: [6, 10] }],
  ['labo-pince', 'anneau', 'Pince greffée', 'wabGreffe', 'wab-greffe', { degFixe: [30, 50], resCac: [4, 6] }],
  ['labo-garde', 'anneau', 'Anneau de garde', 'wabGarde', 'wab-garde', { resLoin: [6, 10], resFixe: [8, 12] }],
  ['labo-garou', 'ceinture', 'Ceinture du garou', 'wabGarou', 'wab-garou', { vita: [700, 1000], ecailles: [6, 10] }],
  ['labo-enrage', 'bottes', 'Pattes d\'enragé', 'wabEnrage', 'wab-enrage', { agilite: [30, 45], vitDep: [2, 4] }], /* (la vitesse de deplacement a la place de la Ruee, 26/11/2026) */
];
const FIXES_RARE_LABO = new Set(['portee', 'volVie']), LOOT_OBJETS_LABO = { mutant: 0.07 / 3, chef: 0.07, rare: 0.5 }, OBJET_DU_MONSTRE = {};
OBJETS_LABO.forEach(([id, emp, nom, monstre, icone, bornes]) => {
  const ref = (a, b) => Math.round((a + b) / 2), st = Object.fromEntries(Object.entries(bornes).map(([c, [a, b]]) => [c, ref(a, b)])), rid = id + '-rare';
  OBJETS[id] = { id, emp, nom, niv: 100, labo: monstre, icone, stats: st }; OBJET_DU_MONSTRE[monstre] = (OBJET_DU_MONSTRE[monstre] || []).concat(id);
  const bR = Object.fromEntries(Object.entries(bornes).map(([c, [a, b]]) => [c, FIXES_RARE_LABO.has(c) ? [a, b] : [Math.ceil(a * 1.5), Math.ceil(b * 1.5)]]));
  OBJETS[rid] = Object.assign({}, OBJETS[id], { id: rid, base: id, rare: true, nom: nom + ' ★', stats: Object.fromEntries(Object.entries(bR).map(([c, [a, b]]) => [c, ref(a, b)])) });
  BORNES_JET[id] = bornes; BORNES_JET[rid] = bR;
});
/* ---------------- le butin du labo ---------------- */
function lootObjetLabo(mo) {
  const c = combat; if (!(c && c.genre === 'donjon') || !mo || !mo.type) return; const L0 = OBJET_DU_MONSTRE[mo.type]; if (!L0) return;
  const pros = 1 + (caracs().prospection || 0) / 100; if (Math.random() >= (mo.specimen || mo.chef ? LOOT_OBJETS_LABO.chef : LOOT_OBJETS_LABO.mutant) * pros) return;
  const id = hasard(L0), rare = Math.random() < CHANCE_RARE * LOOT_OBJETS_LABO.rare * prosRare(pros), k = donnerObjet(rare ? id + '-rare' : id), o = OBJETS[rare ? id + '-rare' : id];
  const L = c.loot || (c.loot = { res: {}, objets: [] }); (L.objets = L.objets || []).push(k);
  if (typeof chiffre === 'function') chiffre('✦ ' + o.nom, new T.Vector3(mo.x, (mo.m ? mo.m.position.y : 0) + (mo.haut || 2) + 0.8, mo.z), 'butin');
  toast('✦ ' + o.nom + (rare ? ' (rare !)' : '') + ' : un objet du labo, dans ton sac.', 'or'); son('quete'); if (typeof rendreHaut === 'function') rendreHaut();
}
{ const butinObjLabo = butin; butin = function (mo) { const r = butinObjLabo.apply(this, arguments); try { lootObjetLabo(mo); } catch (e) { /* rien */ } return r; }; }
/* ---------------- le vol de vie : tes coups (attaques et sorts) te rendent une part de leurs degats ---------------- */
const volVieLabo = () => { if (!combat) return 0; if (combat.volLabo == null) combat.volLabo = (caracs().volVie || 0) / 1000; return combat.volLabo; }; /* (une fois par combat : l'equipement ne change pas en plein combat) */
{ const blesserVolLabo = blesser; blesser = function (mo, n, gros, src) {
    const v = src == null && typeof coupDirectP11 === 'function' && coupDirectP11() ? volVieLabo() : 0, avant = mo ? mo.pv : 0, r = blesserVolLabo.apply(this, arguments);
    if (v > 0 && combat && !combat.fin && combat.pv > 0) { const a0 = combat.pv; combat.pv = Math.min(combat.pvMax, combat.pv + Math.min(n, Math.max(0, avant)) * v); if (combat.st) combat.st.soins = (combat.st.soins || 0) + combat.pv - a0; }
    return r; }; }
