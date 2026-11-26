'use strict';
/* LES OBJETS DU LABO DE WABBENSTEIN (26/11/2026, « des petits stuffs pour le donjon du Wabbenstein ; on ne fait pas une panoplie, un item par monstre, des stats
   vraiment tres differentes, pour completer un build ou tu as une panoplie de 2 ou 4 items ; le loot doit etre vraiment dur, 2 voire 3 fois plus dur que les vagues,
   et en rare encore plus dur », Mathieu ; au formulaire : « 3 fois plus dur », niveau 100, un legendaire du Docteur plus tard ; puis, liste revue : le vol de vie
   « reduis-le a 0,6 au max », venin et ecailles a expliquer, la Ruee des pattes a changer). Version dev : le labo n'est pas encore sorti.
   - Un objet par monstre du labo, hors panoplie (aucun bonus de panoplie, o.labo : le monstre qui le lache), niveau 100, rare a x1,5 (sauf la portee et le vol
     de vie, les memes en rare) ; leurs icones (26/11/2026) : modeles faits a la main, blender/objets-labo.py, photographies par icones-labo-objets.html (obj-labo-*).
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
  OBJETS[id] = { id, emp, nom, niv: 100, labo: monstre, icone: 'obj-' + id, stats: st }; /* (icone : obj-labo-..., 26/11/2026 ; avant, celle du monstre) */ OBJET_DU_MONSTRE[monstre] = (OBJET_DU_MONSTRE[monstre] || []).concat(id);
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
   « Tourelle a cawottes ») : ni degats fixes ni vol de vie. Portees en bandeau au niveau des yeux (plus bas, 26/11/2026) ; icone obj-leg-docteur ================= */
const TOURELLE_DOC = { duree: 8, periode: 2, rafale: 3, ecart: 0.18, portee: 10, part: 0.4, vitesse: 24, invoc: 0.15 }, SOURCES_INVOC = new Set(['Bouftou invoqué', 'Bouture', 'Dragonnet', 'Tourelle à cawottes']);
LEGENDAIRES.push({ cle: 'docteur', boss: 'wabbenstein', nom: 'Lunettes du Docteur', rang: PANOS.findIndex((P) => P.id === 'ecorce'), chance: 0.25,
  pouvoir: 'Sort Tourelle à cawottes (touche 3) : tu poses une tourelle là où tu vises (jusqu\'à 5 cases de toi) ; pendant 8 s, elle tire des rafales de 3 cawottes sur le monstre le plus proche (5 cases autour d\'elle), chacune 40 % de tes dégâts. Recharge 14 s. Et tes invocations (le Bouftou de l\'Osamodas, le Dragonnet, la Bouture, la tourelle) font 15 % de dégâts en plus.' });
{ const L = LEGENDAIRES[LEGENDAIRES.length - 1], k = L.rang; OBJETS['leg-docteur'] = { id: 'leg-docteur', pano: k, leg: 'docteur', emp: 'coiffe', nom: L.nom, niv: 100, icone: 'obj-leg-docteur', pouvoir: L.pouvoir, stats: { vita: 2 * VALEURS.vita[k], sagesse: 2 * VALEURS.sagesse[k], puissance: VALEURS.puissance[k] } }; }
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

/* ================= LES PIECES DU LABO PORTEES (26/11/2026, « faut juste voir comment tu fais porter les lunettes, ca devrait etre un bandeau a lunettes autour
   de la tete au niveau des yeux, pas un chapeau », puis « la cape vampire, les mobs sont blancs : soit les mobs violets, soit la cape blanche », Mathieu) :
   les trois pieces qui se voient sur le perso, faites a la main comme leurs icones (blender/objets-labo.py -- assets/modeles/jeu/objets-labo.glb
   viseur,cape,lunettes ; charge a la demande, quand l'une est portee) :
   - le Viseur du drone : le casque enfonce sur la tete comme les autres coiffes (rond) ; son hublot vert est a part (Obj_labo_viseur_oeil) et se pose devant
     un oeil du perso, a sa taille (« la coiffe enfoncee sur leur tete comme a chaque fois, et la lunette de vision au niveau d'un oeil », Mathieu, 26/11/2026) ;
   - la Cape du vampire : une cape comme les autres, blanche comme les vampires du labo, nervures violettes, doublure rouge ; son col de vampire fait le tour
     du cou (« collier_ »), la fiole de sang est posee d'un bloc a l'epaule (« epaule_ ») ;
   - les Lunettes du Docteur : PAS posees comme une coiffe (le calage des coiffes les mettait sur le crane et aplatissait les cheveux) : le bandeau fait le tour
     de la tete a la hauteur des yeux, les verres devant les yeux ; le chapeau de paille disparait, les cheveux et les cornes de l'Osamodas restent. ================= */
const FICHIER_LABO = 'objets-labo', NOEUD_LABO = { 'labo-viseur': 'Obj_labo_viseur', 'labo-cape': 'Obj_labo_cape', 'leg-docteur': 'Obj_labo_lunettes' };
const BANDEAU_LABO = { k: 1.04, yVerres: 0.516, ray: 0.478 }, VISIERE_LABO = { k: 0.62, cerclage: 0.17, devant: 0.03 }; /* (VISIERE_LABO : le cerclage du hublot fait 0,62 fois la hauteur de l'oeil ; devant : son ecart devant l'oeil) */ /* (k : un peu plus large que le crane ; yVerres : la hauteur des verres dans le modele ; ray : le rayon du bandeau dans le modele) */
VERSIONS_FICHIERS[FICHIER_LABO + '.glb'] = '20261126e'; VISUELS_TARDIFS.add(FICHIER_LABO);
['labo-viseur', 'labo-viseur-rare'].forEach((id) => { if (OBJETS[id]) OBJETS[id].rond = true; }); /* (le casque enfonce sur la tete) */
const baseLabo = (id) => { if (!id) return null; const o = OBJETS[baseObjet(id)] || null; return o && o.base ? OBJETS[o.base] : o; }; /* (la piece d'origine : « leg-docteur~1l » -> leg-docteur, la version rare -> sa piece) */
function noeudLabo(id) { const o = baseLabo(id), n = o && NOEUD_LABO[o.id]; if (!n || !visuelsPrets()) return null; if (!VISUELS[FICHIER_LABO]) { chargerVisuelTardif(FICHIER_LABO); return null; } return VISUELS[FICHIER_LABO].getObjectByName(n) || null; }
{ const nvLabo = noeudVisuel; noeudVisuel = function (id) { const o = baseLabo(id); if (o && o.id === 'leg-docteur') return null; /* (le bandeau se pose a part, porterBandeauLabo) */
    return o && NOEUD_LABO[o.id] ? noeudLabo(id) : nvLabo.apply(this, arguments); }; }
function porterBandeauLabo(g) {
  const idC = S_ && S_.equip && S_.equip.coiffe, o = baseLabo(idC); if (!o || o.id !== 'leg-docteur') return; const N = noeudLabo(idC); if (!N) return;
  g.updateMatrixWorld(true); const pieces = []; g.traverse((m) => { if (m.isMesh && !(m.parent && m.parent.isMesh)) pieces.push(m); });
  pieces.filter((m) => P_CHAPEAU.test(nomP(m))).forEach((m) => { m.visible = false; });
  const teteN = g.getObjectByName('tete'); if (!teteN) return; const sous = []; teteN.traverse((m) => { if (m.isMesh && !(m.parent && m.parent.isMesh) && !P_CHAPEAU.test(nomP(m))) sous.push(m); });
  const crane = sous.filter((m) => /^crane/.test(nomP(m))), yeux = sous.filter((m) => /^oeil/.test(nomP(m))), bt = unionDe(crane.length ? crane : sous), ct = bt.getCenter(new T.Vector3()), st = bt.getSize(new T.Vector3());
  const by = yeux.length ? unionDe(yeux) : null, ey = by ? by.getCenter(new T.Vector3()).y : bt.min.y + st.y * 0.42;
  const bouche = g.getObjectByName('bouche'), avant = bouche ? Math.sign(boiteDe(bouche).getCenter(new T.Vector3()).z - ct.z) || 1 : 1, devant = by ? (avant > 0 ? by.max.z - ct.z : ct.z - by.min.z) : st.z / 2;
  const k = Math.max((devant + 0.02) / BANDEAU_LABO.ray, (st.x / 2) / BANDEAU_LABO.ray) * BANDEAU_LABO.k;
  const c = N.clone(true); c.rotation.set(0, avant < 0 ? Math.PI : 0, 0); c.scale.setScalar(k); c.position.set(ct.x, ey - BANDEAU_LABO.yVerres * k, ct.z);
  let eq = g.getObjectByName('equipement_porte'); if (!eq) { eq = new T.Group(); eq.name = 'equipement_porte'; g.add(eq); }
  const sg = new T.Group(); sg.name = 'bandeau_labo'; sg.add(c); eq.add(sg); fusionner(sg); sg.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
}
/* le hublot du Viseur, devant un oeil (celui du cote du bras du modele) */
function porterVisiereLabo(g) {
  const idC = S_ && S_.equip && S_.equip.coiffe, o = baseLabo(idC); if (!o || o.id !== 'labo-viseur' || !VISUELS[FICHIER_LABO]) return;
  const N = VISUELS[FICHIER_LABO].getObjectByName('Obj_labo_viseur_oeil'); if (!N) return;
  g.updateMatrixWorld(true); const teteN = g.getObjectByName('tete'); if (!teteN) return; const sous = []; teteN.traverse((m) => { if (m.isMesh && !(m.parent && m.parent.isMesh)) sous.push(m); });
  const crane = sous.filter((m) => /^crane/.test(nomP(m))), yeux = sous.filter((m) => /^oeil/.test(nomP(m))); if (!yeux.length) return;
  const ct = unionDe(crane.length ? crane : sous).getCenter(new T.Vector3()), bouche = g.getObjectByName('bouche'), avant = bouche ? Math.sign(boiteDe(bouche).getCenter(new T.Vector3()).z - ct.z) || 1 : 1;
  const be = yeux.map((m) => boiteDe(m)).sort((a, b) => (b.getCenter(new T.Vector3()).x - a.getCenter(new T.Vector3()).x) * avant)[0], ce = be.getCenter(new T.Vector3()), eh = be.getSize(new T.Vector3()).y;
  const c = N.clone(true); c.position.set(0, 0, 0); c.rotation.set(0, avant < 0 ? Math.PI : 0, 0); c.scale.setScalar(eh * VISIERE_LABO.k / VISIERE_LABO.cerclage); c.updateMatrixWorld(true);
  let lent = null; c.traverse((m) => { if (!lent && m.isMesh && !(m.parent && m.parent.isMesh) && nomP(m) === 'visiere_lentille') lent = m; }); if (!lent) return;
  const cl = boiteDe(lent).getCenter(new T.Vector3()), zDevant = (avant > 0 ? be.max.z : be.min.z) + avant * VISIERE_LABO.devant;
  c.position.set(ce.x - cl.x, ce.y - cl.y, zDevant - cl.z);
  let eq = g.getObjectByName('equipement_porte'); if (!eq) { eq = new T.Group(); eq.name = 'equipement_porte'; g.add(eq); }
  const sg = new T.Group(); sg.name = 'visiere_labo'; sg.add(c); eq.add(sg); fusionner(sg); sg.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
}
{ const htLabo = habillerTenue; habillerTenue = function (g) { const r = htLabo.apply(this, arguments); try { porterBandeauLabo(g); } catch (e) { console.warn('bandeau du labo', e); } try { porterVisiereLabo(g); } catch (e) { console.warn('visiere du labo', e); } return r; }; }
/* le mode test : les 7 objets du labo et les Lunettes, au jet moyen, dans le sac (a cote du bouton des pieces du palier 11) */
{ const omtLabo = ouvrirModeTest; ouvrirModeTest = function () { const r = omtLabo.apply(this, arguments);
    try { const b = document.querySelector('[data-test-p11-sac]'); if (b && !document.querySelector('[data-test-labo-sac]')) b.insertAdjacentHTML('afterend', '<button class="btn discret" data-test-labo-sac>Me donner les 7 objets du labo et les Lunettes du Docteur</button>'); } catch (e) { /* rien */ }
    return r; }; }
document.addEventListener('click', (e) => { if (!e.target.closest('[data-test-labo-sac]') || !estAdmin() || !MODE_TEST || combat) return;
  const L = OBJETS_LABO.map(([id]) => id).concat('leg-docteur'); L.forEach((id) => { const k = creerObjet(id); S_.jets[k] = Object.assign({}, OBJETS[id].stats); S_.sac[k] = 1; marquerNeuf(k); });
  const monte = niveau(S_.xp) < 100; if (monte) S_.xp = seuil(100); vieAuMax(); rendreHaut();
  toast('Les 7 objets du labo et les Lunettes du Docteur dans ton sac, au jet moyen' + (monte ? ' ; te voilà niveau 100 pour les porter' : '') + '. Bouton Perso pour les voir.', 'or');
  if (modaleOuverte === 'mode-test') ouvrirModeTest();
});
/* les portraits (la fiche du perso, les parties de l'accueil) : le modele des pieces du labo se charge a la demande ; le portrait fait avant son arrivee (avec
   le chapeau de paille) restait en memoire : il est refait quand le modele arrive, et le portrait d'une partie attend le modele */
{ const cvtLabo = chargerVisuelTardif; chargerVisuelTardif = function (f) { const pr = cvtLabo.apply(this, arguments);
    if (f === FICHIER_LABO && pr && !pr.labo) { pr.labo = true; pr.then((ok) => { if (!ok) return; for (const k in portraits) delete portraits[k]; try { if (modaleOuverte === 'perso') ouvrirPerso(); } catch (e) { /* rien */ } }); }
    return pr; }; }
const enrobPortraitLabo = () => { if (typeof portraitDePartie !== 'function' || portraitDePartie.labo) return; const pdpLabo = portraitDePartie; portraitDePartie = async function (e) { const eq = (e && e.equip) || {};
    if ([eq.coiffe, eq.cape].some((id) => { const o = baseLabo(id); return o && NOEUD_LABO[o.id]; })) { try { await assurerVisuels(); if (!VISUELS[FICHIER_LABO]) await chargerVisuelTardif(FICHIER_LABO); } catch (er) { /* rien */ } }
    return pdpLabo.apply(this, arguments); }; portraitDePartie.labo = true; };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enrobPortraitLabo); else enrobPortraitLabo(); /* (portraitDePartie est dans 30-boucle.js, charge apres ce fichier) */
