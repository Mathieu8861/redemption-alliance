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
/* ================= LES LUNETTES DU DOCTEUR, LE LEGENDAIRE DE WABBENSTEIN (26/11/2026, au formulaire : la coiffe et son sort Tourelle a cawottes, « 0,5 % »,
   Mathieu) : une coiffe legendaire niveau 100 (les stats des coiffes legendaires au rang de l'Ecorce), qui tombe sur le Docteur a 0,5 % (chance : CHANCE_LEG x 0,25,
   chanceLeg, 03-equipements.js ; la Prospection l'augmente comme les autres). Son sort (touche 3) : une tourelle a cawottes posee la ou tu vises (5 cases), 8 s, des
   rafales de 3 cawottes toutes les 2 s sur le monstre le plus proche (5 cases autour d'elle), chacune 40 % de tes degats (12 en tout, 4,8 fois tes degats). Recharge 14 s.
   En plus : tes invocations (le Bouftou de l'Osamodas, le Dragonnet, la Bouture, la tourelle) font +15 %. Les tirs de la tourelle sont ceux d'une invocation (SRC_DEG
   « Tourelle a cawottes ») : ni degats fixes ni vol de vie. Pas encore de lunettes visibles sur le perso ; son icone : celle du Docteur, en attendant la sienne ================= */
const TOURELLE_DOC = { duree: 8, periode: 2, rafale: 3, ecart: 0.18, portee: 10, part: 0.4, vitesse: 24, invoc: 0.15 }, SOURCES_INVOC = new Set(['Bouftou invoqué', 'Bouture', 'Dragonnet', 'Tourelle à cawottes']);
LEGENDAIRES.push({ cle: 'docteur', boss: 'wabbenstein', nom: 'Lunettes du Docteur', rang: PANOS.findIndex((P) => P.id === 'ecorce'), chance: 0.25,
  pouvoir: 'Sort Tourelle à cawottes (touche 3) : tu poses une tourelle là où tu vises (jusqu\'à 5 cases de toi) ; pendant 8 s, elle tire des rafales de 3 cawottes sur le monstre le plus proche (5 cases autour d\'elle), chacune 40 % de tes dégâts. Recharge 14 s. Et tes invocations (le Bouftou de l\'Osamodas, le Dragonnet, la Bouture, la tourelle) font 15 % de dégâts en plus.' });
{ const L = LEGENDAIRES[LEGENDAIRES.length - 1], k = L.rang; OBJETS['leg-docteur'] = { id: 'leg-docteur', pano: k, leg: 'docteur', emp: 'coiffe', nom: L.nom, niv: 100, icone: 'wabbenstein', pouvoir: L.pouvoir, stats: { vita: 2 * VALEURS.vita[k], sagesse: 2 * VALEURS.sagesse[k], puissance: VALEURS.puissance[k] } }; }
SORTS_LEG.docteur = { nom: 'Tourelle à cawottes', teinte: '#f08a24', recharge: 14, portee: TOURELLE_DOC.portee, zone: 1.2 };
const lunettesPortees = () => { if (!combat) return false; if (combat.lunettesDoc == null) combat.lunettesDoc = legDe('coiffe') === 'docteur'; return combat.lunettesDoc; };
/* +15 % aux invocations */
{ const blesserInvocDoc = blesser; blesser = function (mo, n, gros, src) { if (src == null && typeof SRC_DEG === 'string' && SOURCES_INVOC.has(SRC_DEG) && lunettesPortees()) n = Math.round(n * (1 + TOURELLE_DOC.invoc)); return blesserInvocDoc.call(this, mo, n, gros, src); }; }
/* la tourelle : un socle de cuivre, un pied, une tete d'acier qui pivote, un canon, une cawotte chargee et un voyant vert */
function maillageTourelleDoc() {
  const g = new T.Group(), tete = new T.Group(), mk = (geo, c, p, r) => { const m = new T.Mesh(geo, mat(c)); if (p) m.position.set(p[0], p[1], p[2]); if (r) m.rotation.set(r[0], r[1], r[2]); m.castShadow = true; return m; };
  g.add(mk(new T.CylinderGeometry(0.5, 0.6, 0.22, 16), '#b87333', [0, 0.11, 0]), mk(new T.CylinderGeometry(0.16, 0.22, 0.55, 12), '#6e4a2a', [0, 0.48, 0]));
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; g.add(mk(new T.SphereGeometry(0.06, 6, 4), '#e0b070', [Math.cos(a) * 0.48, 0.23, Math.sin(a) * 0.48])); } /* (les rivets) */
  tete.add(mk(new T.BoxGeometry(0.62, 0.42, 0.62), '#8a9098'), mk(new T.CylinderGeometry(0.12, 0.14, 0.8, 12), '#4a4f56', [0, 0.02, 0.62], [Math.PI / 2, 0, 0]), mk(new T.ConeGeometry(0.11, 0.34, 8), '#ee7a26', [0, 0.02, 1.08], [Math.PI / 2, 0, 0]),
    mk(new T.SphereGeometry(0.08, 8, 6), '#7dff6a', [0.2, 0.26, -0.1]), mk(new T.BoxGeometry(0.66, 0.08, 0.2), '#b87333', [0, 0.25, -0.18]));
  tete.position.y = 0.95; g.add(tete); g.traverse((o) => { o.raycast = () => {}; }); return { g, tete };
}
function finTourelleDoc(c, T0) { const t = c && c.tourelleDoc; if (!t || (T0 && t !== T0)) { if (T0 && T0.M) jeter(T0.M.g); return; } c.tourelleDoc = null; const p = t.M.g.position; pouf(p.x, p.y + 0.4, p.z, 1.6, '#b87333'); emettre(FX_FUM, 8, { x: p.x, y: p.y + 0.6, z: p.z, r: 0.4, v: [0, 0.8, 0], vie: [0.6, 1], taille: [0.4, 1.2], c: ['#5a4a42', '#9a8a80'], a: 0.5, frein: 1.2 }); jeter(t.M.g); }
function tirTourelleDoc(t, cib, c0) {
  const st = statsPerso(), de = new T.Vector3(0, 0.02, 1.1).applyMatrix4(t.M.tete.matrixWorld), vers = new T.Vector3(cib.x, cib.m.position.y + (cib.haut || 1) * 0.5, cib.z);
  const g = typeof cawotteTir === 'function' ? cawotteTir() : new T.Mesh(new T.ConeGeometry(0.14, 0.62, 8), mat('#ee7a26')); g.position.copy(de); g.lookAt(vers); scene.add(g);
  emettre(FX_LUM, 2, { x: de.x, y: de.y, z: de.z, vie: [0.08, 0.12], taille: [0.8, 0.3], c: ['#fff1a8', '#ff9a2e'], a: 0.9 }); t.recul = 0.12;
  const D = Math.max(0.5, de.distanceTo(vers)), duree = D / TOURELLE_DOC.vitesse; let u = 0, rot = 0;
  effets.push((dt) => { if (combat !== c0 || c0.fin) { jeter(g); return true; } u += dt / duree; rot += dt * 18; g.position.lerpVectors(de, vers, Math.min(1, u)); g.lookAt(vers); g.rotateZ(rot);
    if (u < 1) return false; jeter(g); pouf(vers.x, vers.y, vers.z, 0.9, '#ee7a26'); emettre(FX_VIF, 6, { x: vers.x, y: vers.y, z: vers.z, r: 0.1, dv: 3, haut: true, vie: [0.25, 0.4], taille: [0.1, 0.04], c: ['#ee7a26', '#5fae3a'], grav: 9, frein: 1.5 });
    if (cib.etat === 'actif') { const p0 = SRC_DEG; SRC_DEG = 'Tourelle à cawottes'; try { blesser(cib, Math.max(1, Math.round(st.deg * TOURELLE_DOC.part))); } finally { SRC_DEG = p0; } } return true; });
}
function tourelleDocteur(pt) {
  const c0 = combat; finTourelleDoc(c0); const q = pointSort(pt, TOURELLE_DOC.portee), x = q.x, z = q.z, y = solA(x, z), pp = paysanMesh.position, M = maillageTourelleDoc();
  poser(M.g, x, y, z, Math.atan2(pp.x - x, pp.z - z)); M.g.scale.setScalar(0.05);
  const t = c0.tourelleDoc = { x, z, vie: TOURELLE_DOC.duree, cd: 0.45, n: 0, nait: 0, recul: 0, M };
  pouf(x, y + 0.2, z, 1.8, '#b87333'); onde(x, y + 0.05, z, 1.4, '#f08a24', 0.4, 0.8); emettre(FX_VIF, 10, { x, y: y + 0.3, z, r: 0.3, dv: 3, haut: true, vie: [0.3, 0.5], taille: [0.12, 0.04], c: ['#e0b070', '#b87333', '#fff1a8'], grav: 9, frein: 1.4 });
  chiffre('Tourelle à cawottes', new T.Vector3(x, y + 2.2, z), 'gros');
  effets.push((dt) => { if (combat !== c0 || c0.fin || c0.tourelleDoc !== t) { finTourelleDoc(c0, t); return true; } t.vie -= dt; if (t.vie <= 0) { finTourelleDoc(c0, t); return true; }
    t.nait = Math.min(1, t.nait + dt / 0.3); const k = 1 - Math.pow(1 - t.nait, 3), fin = Math.min(1, t.vie / 0.3); M.g.scale.setScalar(Math.max(0.05, k * fin));
    const cib = plusProcheMonstre(t, TOURELLE_DOC.portee); if (cib) { const a = Math.atan2(cib.x - t.x, cib.z - t.z) - M.g.rotation.y; M.tete.rotation.y += (Math.atan2(Math.sin(a), Math.cos(a)) - M.tete.rotation.y) * Math.min(1, dt * 12); }
    t.recul = Math.max(0, t.recul - dt); M.tete.position.x = -Math.sin(M.tete.rotation.y) * t.recul * 0.8; M.tete.position.z = -Math.cos(M.tete.rotation.y) * t.recul * 0.8; /* (le recul, le long du canon) */
    t.cd -= dt; if (cib && t.cd <= 0 && t.nait >= 1) { tirTourelleDoc(t, cib, c0); t.n++; t.cd = t.n % TOURELLE_DOC.rafale ? TOURELLE_DOC.ecart : TOURELLE_DOC.periode - TOURELLE_DOC.ecart * (TOURELLE_DOC.rafale - 1); }
    return false; });
}
/* le sort, a la touche de la coiffe */
{ const executerLegDoc = executerLeg; executerLeg = function (emp, pt, compter, tire) {
    const c = combat; if (!c || c.fin || legDe(emp) !== 'docteur') return executerLegDoc.apply(this, arguments);
    c[cdLeg(emp)] = sortLeg('docteur').recharge; if (compter && c.st) c.st.sorts++; const pp = paysanMesh.position; if (Math.hypot(pt.x - pp.x, pt.z - pp.z) > 0.05) paysanMesh.userData.angle = Math.atan2(pt.x - pp.x, pt.z - pp.z);
    son('sort'); tourelleDocteur(pt); }; }
