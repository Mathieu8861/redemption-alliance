'use strict';
/* LES KITS DES MUTANTS DU LABO (24/11/2026, Mathieu : « passe aux animations et degats des mutants ; il faut vraiment que ce soit difficile, niveau de
   difficulte d'une vague 35 pour nous, et le meme delire que les boss de l'ile pour les boss, voire plus dur vu qu'on est plusieurs », puis « juste faudra
   ajuster les degats et les pv, mais la rapidite d'execution des sorts des monstres ca doit etre ca, et que ce soit diversifie »). Version dev (le labo n'existe
   que dans le mode test).
   Chaque mutant a maintenant son kit, annonce au sol et rapide (0,7 a 0,9 s pour sortir d'une zone, un sort toutes les 4 a 9 s, comme les Craqueleurs de la
   vague 35), et des coups automatiques plus vifs (cadence et elan raccourcis) :
   - le garde lapin-machine : ses cawottes de loin, et l'OBUS-CAWOTTE tire en cloche sur toi (cercle rouge) ;
   - le Wabbit enrage : il RUGIT puis CHARGE en ligne droite (bande rouge), griffe en continu ; quand l'un tombe, ceux d'a cote entrent en FRENESIE ;
   - le Wabbit fluo : il CRACHE DU MUTAGENE (deux cercles verts : la flaque reste et empoisonne), et laisse sa flaque en mourant ;
   - le Wabbit greffe : le COUP DE PINCE (un eventail devant lui : repousse et assomme) et le GRAPPIN (une ligne : il te ramene contre lui et t'assomme) ;
   - le Wabbit vampire : il vole, te VOLE LA VIE, et fond sur toi en PIQUE (cercle rouge, d'assez loin) ;
   - le Wabbit garou : le BOND (cercle rouge) et la FRAPPE DU GAROU (il abat ses poings : cercle autour de lui) ;
   - le drone : ses cawottes de loin, et le BOMBARDEMENT (trois cercles orange : des cawottes tombent du ciel).
   LES BOSS DU LABO (« le meme delire que les boss de l'ile ») : les chefs des camps (Chef des gardes, Garou alpha) et les specimens des cuves gardent le kit de
   leur type, plus vite (sorts x0,7), avec un sort de boss en plus, LA RAGE sous 30 % (sorts +30 %, il rugit) et des RENFORTS de leur type toutes les 16 s
   (2 a la fois, 4 au plus, sans butin) : BOSS_MUT. Le Docteur : KIT_WAB plus rapide, plus de vie (KIT_WAB_DIFFICILE). Les chiffres (vie, degats) : a regler
   avec Mathieu apres ses essais. */
const KITS_MUT = {
  wabGarde: { cadence: 1.5, elanCoup: 0.3, obus: { periode: 4.5, prepa: 0.85, R: 1.8, x: 1.0, loin: 2.5 } },
  wabEnrage: { cadence: 0.8, elanCoup: 0.28, charge: 3.5, chargePrepa: 0.7, chargeMax: 10, gestes: { charge: 'rugir' }, frenesie: { R: 8, t: 4 } },
  wabFluo: { cadence: 1.3, elanCoup: 0.3, crachatMut: { periode: 5, prepa: 0.85, n: 2, ecart: 2.4, R: 1.3, x: 0.8, flaque: { duree: 3, pct: 0.01 } } },
  wabGreffe: { cadence: 1.5, elanCoup: 0.3, pince: { periode: 5, prepa: 0.7, R: 3.0, ouv: 0.8, x: 1.1, repousse: 1.6, assomme: 0.35 }, grappin: { periode: 6.5, prepa: 0.75, min: 3.5, max: 12, larg: 1.5, x: 0.6 }, appelStun: 0.45 },
  wabVampire: { cadence: 1.0, elanCoup: 0.28, bondit: 3.5, bonditLoin: true, bonditMax: 9, bondPrepa: 0.75, bonditR: 1.7, bonditH: 1.2, gestes: { bondit: 'bond' }, sortsX: { bond: 0.9 } },
  wabGarou: { cadence: 1.6, elanCoup: 0.34, bondit: 5, bondPrepa: 0.8, bonditR: 2.4, seisme: 6.5, seismeR: 3.4, seismeDuree: 0.9, seismeProche: 0.6, seismeNom: 'Frappe du garou', gestes: { bondit: 'bond', seisme: 'coup' }, sortsX: { seisme: 1.2 } },
  wabDrone: { cadence: 1.4, bombardement: { periode: 9, prepa: 1.1, n: 3, ecart: 3.2, R: 1.3, x: 0.8 } },
};
const DESC_MUT = {
  wabGarde: 'le robot de cuivre du Docteur, armure (-30 %) : il te tire des cawottes de son canon, de loin, et toutes les 4,5 s un obus-cawotte en cloche sur toi (cercle rouge, 0,85 s pour en sortir)',
  wabEnrage: 'échappé des cages, l\'œil rouge : il court plus vite que toi, griffe vite et sans s\'arrêter, rugit puis te charge en ligne droite toutes les 3,5 s (bande rouge, 0,7 s pour en sortir) ; quand un enragé tombe, ceux d\'à côté entrent en frénésie 4 s',
  wabFluo: 'gorgé de mutagène qui luit : il te crache du mutagène toutes les 5 s (deux cercles verts, 0,85 s pour en sortir), la flaque reste 3 s et empoisonne (1 % de ta vie par seconde) ; en mourant, il laisse une grande flaque',
  wabGreffe: 'cousu de partout et blindé, armure (-35 %) : coup de pince devant lui toutes les 5 s (éventail rouge, 0,7 s : il repousse et assomme), et de loin son grappin toutes les 6,5 s (une ligne : il te ramène contre lui et t\'assomme)',
  wabVampire: 'sorti des cuves, les oreilles en ailes : il vole, chaque morsure le soigne de la moitié des dégâts, et toutes les 3,5 s il fond sur toi d\'assez loin (cercle rouge, 0,75 s pour en sortir)',
  wabGarou: 'la créature la plus forte du Docteur, armure (-15 %) : il te bondit dessus toutes les 5 s (cercle rouge, 0,8 s) et abat ses poings toutes les 6,5 s (cercle autour de lui, 0,9 s pour en sortir)',
  wabDrone: 'un petit robot volant du Docteur : il te tire des cawottes de loin, et toutes les 9 s il bombarde (trois cercles orange, des cawottes tombent du ciel, 1,1 s pour en sortir)',
};
Object.keys(KITS_MUT).forEach((t) => { if (MONSTRES[t]) Object.assign(MONSTRES[t], KITS_MUT[t], { desc: DESC_MUT[t] || MONSTRES[t].desc }); });
/* QU'ILS FASSENT PEUR (24/11/2026, « faut qu'ils nous fassent peur, que ce soit vraiment dur, parce que si les mobs sont lents, nous touchent jamais, ca va etre
   nul », Mathieu). Mesure (traces/chargement/plans-kite-mutants.js, 3 mutants, le perso qui court en rond a 5,6, la vitesse du Iop) : aucun coup ni aucun sort
   des mutants au corps a corps ne touchait (ils allaient a 2,8 a 4,6, et leurs sorts visaient la ou l'on etait). Trois corrections :
   - leur vitesse pres de la tienne : l'enrage 6,6 (plus vite que tous les persos : Iop 5,6, Osamodas 5,3, Cra 6,4), le vampire 5,4, le garou 4,6,
     le fluo 4,4, le greffe 4,4 (son grappin te ramene), le drone 4,4, le garde 3,6 (il tire de loin) ;
   - leurs sorts visent la ou tu vas : ta course des derniers instants, prolongee sur le temps du sort (a 85 %, 5 cases au plus) ; en ligne droite tu es pris,
     il faut changer de direction ;
   - leur coup te rattrape : il touche encore a 1,8 au-dela de sa portee (1 pour un monstre ordinaire), comme le coup engage des boss */
const PEUR_MUT = { wabEnrage: 6.4, wabVampire: 5.2, wabGarou: 4.4, wabFluo: 4.2, wabDrone: 4.2, wabGreffe: 4.2, wabGarde: 3.4 }, ENGAGE_MUT = 1.8, VISE_MUT = { avance: 0.85, max: 10 };
Object.keys(PEUR_MUT).forEach((t) => { const d = MONSTRES[t]; if (!d) return; d.vitesse = PEUR_MUT[t]; d.viseAvance = true; if (!d.distance) d.engage = ENGAGE_MUT; });
MONSTRES.wabEnrage.engage = 2.4; /* (l'enrage, la meute qui court : plus vite que tous les persos, 6,6 contre 6,4 au Cra, et son coup te rattrape de plus loin) */
/* la course du perso : sa vitesse lissee, mesuree d'une image a l'autre */
const COURSE_PERSO = { x: 0, z: 0, vx: 0, vz: 0, t: 0 };
function majCoursePerso() { const now = performance.now(), C = COURSE_PERSO; if (now - C.t < 25 || !paysanMesh || !combat) return; const p = paysanMesh.position, dt = (now - C.t) / 1000;
  if (C.t && dt < 0.5) { const k = Math.min(1, dt * 6), vx = (p.x - C.x) / dt, vz = (p.z - C.z) / dt; if (Math.hypot(vx, vz) < 20) { C.vx += (vx - C.vx) * k; C.vz += (vz - C.vz) * k; } } else { C.vx = 0; C.vz = 0; }
  C.x = p.x; C.z = p.z; C.t = now; }
function visePerso(prepa) { majCoursePerso(); const p = paysanMesh.position, C = COURSE_PERSO; let dx = C.vx * prepa * VISE_MUT.avance, dz = C.vz * prepa * VISE_MUT.avance; const L = Math.hypot(dx, dz);
  if (L > VISE_MUT.max) { dx *= VISE_MUT.max / L; dz *= VISE_MUT.max / L; }
  if (typeof lieu !== 'undefined' && lieu === 'donjon' && typeof bornerDonjon === 'function' && typeof etatPerso === 'function') { const q = bornerDonjon(p.x + dx, p.z + dz, 0.6, Object.assign({}, etatPerso())); return { x: q[0], z: q[1], y: p.y }; } /* (au labo, jamais au-dela du bord de l'ile ni dans un obstacle : le Garou alpha y bondissait et restait colle au bord, Mathieu, 24/11/2026) */
  return { x: p.x + dx, z: p.z + dz, y: p.y }; }
CAPACITES.unshift(function capCoursePerso() { majCoursePerso(); }); /* (mesuree a chaque image, pas seulement au moment du sort : sinon sa vitesse retombait a zero) */
/* le bond et la charge des mutants visent aussi la ou tu vas : leur fonction recoit ta position a venir (le temps de leur annonce) */
{ const prepaDe = (mo, cap) => cap === capBond ? (mo.d.bondPrepa || ESQUIVE.bond) : (mo.d.chargePrepa || ESQUIVE.charge) + 0.25;
  [capBond, capCharge].forEach((cap) => { const i = CAPACITES.indexOf(cap); if (i < 0) return;
    CAPACITES[i] = function (mo, ctx) { if (!mo.d.viseAvance) return cap(mo, ctx); const q = visePerso(prepaDe(mo, cap)), pp = new T.Vector3(q.x, q.y, q.z); return cap(mo, Object.assign({}, ctx, { pp })); }; }); }
/* ---------------- les boss du labo : chefs des camps et specimens des cuves ---------------- */
const BOSS_MUT = {
  wabGarde: { obus: { periode: 3.8, prepa: 0.8, R: 2.0, x: 1.1, loin: 2 }, bombardement: { periode: 7, prepa: 1.0, n: 4, ecart: 3.4, R: 1.4, x: 0.9 }, renfortsMut: ['wabGarde', 'gardes'] },
  wabGarou: { bondit: 3.5, bondDouble: true, seisme: 4.5, seismeR: 4.0, galvanise: 11, galvaCouleurs: ['#ff5a3a', '#ffb02e'], gestes: { bondit: 'bond', seisme: 'coup', galvanise: 'appel' }, renfortsMut: ['wabEnrage', 'Wabbits enragés'] },
  wabEnrage: { charge: 2.4, chargePrepa: 0.65, galvanise: 10, galvaCouleurs: ['#ff5a3a', '#ffb02e'], gestes: { charge: 'rugir', galvanise: 'rugir' }, renfortsMut: ['wabEnrage', 'Wabbits enragés'] },
  wabFluo: { crachatMut: { periode: 3.5, prepa: 0.8, n: 4, ecart: 2.6, R: 1.4, x: 0.9, flaque: { duree: 4, pct: 0.012 } }, flaqueMort: { R: 2.6, duree: 6, pct: 0.015 }, renfortsMut: ['wabFluo', 'Wabbits fluo'] },
  wabGreffe: { pince: { periode: 3.5, prepa: 0.65, R: 3.6, ouv: 0.9, x: 1.2, repousse: 2, assomme: 0.4 }, grappin: { periode: 6, prepa: 0.7, min: 3.5, max: 13, larg: 1.3, x: 0.7 }, seisme: 7, seismeR: 3.6, seismeDuree: 0.85, seismeProche: 0.6, seismeNom: 'Pince au sol', gestes: { seisme: 'coup' }, renfortsMut: ['wabGreffe', 'Wabbits greffés'] },
  wabVampire: { bondit: 2.5, bondPrepa: 0.7, volVie: 0.8, drain: { periode: 8, prepa: 0.9, R: 3.6, x: 1.0, soin: 3 }, renfortsMut: ['wabVampire', 'Wabbits vampires'] },
};
const RENFORTS_MUT = { periode: 16, n: 2, max: 4 };
/* LEUR VIE (24/11/2026, « le meme delire que les boss de l'ile ») : le specimen tombait en 10 s sous les coups d'un Iop de niveau 100 ; vie x5 (specimen, avant 2,4)
   et x5 (chef, avant 3), soit 25 a 60 s de frappe pour un perso de niveau 100 (le boss du palier 4 pour un perso de niveau 35 : 25 s), +75 % par joueur en plus
   (comme le Docteur, quand le donjon se jouera a plusieurs : joueursWab) */
SPECIMEN.pv = 5; CHEF_LABO.pv = 5; const BOSS_MUT_PAR_JOUEUR = 0.75;
{ const grandir0 = grandirMutant; grandirMutant = function (o, k, couleur, nom) { grandir0.apply(this, arguments); /* (le meme mutant, plus grand et plus fort : son kit de boss par-dessus, et la rage) */
    try { const nJ = typeof joueursWab === 'function' ? joueursWab(o) : 1; if (nJ > 1) { o.pvMax = o.pv = Math.round(o.pvMax * (1 + BOSS_MUT_PAR_JOUEUR * (nJ - 1))); } const B = BOSS_MUT[o.type]; if (B) o.d = Object.assign({}, o.d, B, { rage: true, bossMut: true }); else o.d = Object.assign({}, o.d, { rage: true, bossMut: true }); o.renfortMT = RENFORTS_MUT.periode - 6; } catch (e) { /* rien */ } }; }
/* ---------------- les sorts ---------------- */
const solMut = () => (paysanMesh ? paysanMesh.position.y : 0); /* (le sol sous le perso : dans une salle comme sur l'ile, le perso est debout dessus) */
function capObusMut(mo, ctx) { /* l'obus-cawotte du garde : tire en cloche sur toi, cercle rouge */
  const O = mo.d.obus; if (!O || mo.etat !== 'actif' || combat.deroute != null) return; const { pp, sortPret } = ctx, dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
  if (!sortPret('obusT', O.periode)) return; if (dP < O.loin || dP > 14) { mo.obusT = O.periode; return; }
  mo.obusT = 0; const c0 = combat, q = visePerso(O.prepa), x = q.x, z = q.z, y = solMut(); mo.ry = Math.atan2(x - mo.x, z - mo.z); mo.bloqueT = O.prepa + 0.3; mo.frappe = 0.3;
  mo.geste = null; gesteSort(mo, 'tir', O.prepa); if (!c0.obusVu) { c0.obusVu = true; toast(leNom(mo.d) + ' tire un obus-cawotte en cloche sur toi : sors du cercle rouge !', 'alerte'); }
  cawotteVolante(new T.Vector3(mo.x, mo.m.position.y + (mo.haut || 2) * 0.7, mo.z), x, y, z, 0.12, O.prepa, 1.5, false);
  zoneDanger({ mo, x, z, r: O.R, duree: O.prepa, effet: (d) => { const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) blesserPerso(Math.max(1, Math.round(degSort(mo) * O.x)), mo); } });
}
function capBombardMut(mo, ctx) { /* le bombardement du drone (et du chef des gardes) : des cawottes tombent du ciel sur toi et autour */
  const B = mo.d.bombardement; if (!B || mo.etat !== 'actif' || combat.deroute != null) return; const { pp, sortPret } = ctx, dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
  if (!sortPret('bombT', B.periode)) return; if (dP > 16) { mo.bombT = B.periode; return; }
  mo.bombT = 0; const c0 = combat, y = solMut(); mo.bloqueT = 0.5; mo.frappe = 0.3; mo.geste = null; gesteSort(mo, 'tir', 0.4);
  if (!c0.bombVu) { c0.bombVu = true; toast(leNom(mo.d) + ' bombarde : des cawottes tombent du ciel, sors des cercles orange !', 'alerte'); }
  const q0 = visePerso(B.prepa), P = [[q0.x, q0.z]]; for (let i = 1; i < B.n; i++) { const a = Math.random() * Math.PI * 2, r = B.ecart * (0.6 + Math.random() * 0.5); P.push([pp.x + Math.cos(a) * r, pp.z + Math.sin(a) * r]); }
  P.forEach(([x, z], i) => { cawotteVolante(new T.Vector3(mo.x, mo.m.position.y + (mo.haut || 2) * 0.8, mo.z), x, y, z, 0.05 + i * 0.06, B.prepa, 1.3, false);
    zoneDanger({ mo, x, z, r: B.R, duree: B.prepa, couleur: '#f08a24', effet: (d) => { const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) blesserPerso(Math.max(1, Math.round(degSort(mo) * B.x)), mo); } }); });
}
/* le crachat de mutagene du fluo : des bulles vertes vers toi, la flaque reste et empoisonne */
function flaqueMut(x, z, y, R, duree, pct) {
  const m = new T.Mesh(new T.CircleGeometry(R, 26), new T.MeshBasicMaterial({ color: '#8dff4a', transparent: true, opacity: 0.55, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y + 0.04, z); m.renderOrder = 3; scene.add(m);
  FLAQUES_FLUO.push({ m, x, z, y: y + 0.04, R, fin: performance.now() + duree * 1000, pct, c: combat });
}
const GEO_BULLE_MUT = new T.SphereGeometry(0.28, 12, 9), MAT_BULLE_MUT = new T.MeshBasicMaterial({ color: '#8dff4a' });
function capCrachatMut(mo, ctx) {
  const C = mo.d.crachatMut; if (!C || mo.etat !== 'actif' || combat.deroute != null) return; const { pp, sortPret } = ctx, dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
  if (!sortPret('crachatMT', C.periode)) return; if (dP > 12) { mo.crachatMT = C.periode; return; }
  mo.crachatMT = 0; const c0 = combat, a = Math.atan2(pp.x - mo.x, pp.z - mo.z), y = solMut(); mo.ry = a; mo.bloqueT = C.prepa + 0.3; mo.frappe = 0.3;
  mo.geste = null; gesteSort(mo, 'rugir', C.prepa + 0.2); if (!c0.crachatMVu) { c0.crachatMVu = true; toast(leNom(mo.d) + ' crache du mutagène : sors des cercles verts, la flaque qui reste empoisonne !', 'alerte'); }
  const q0 = visePerso(C.prepa), ux = Math.cos(a), uz = -Math.sin(a), P = []; for (let i = 0; i < C.n; i++) { const k = i - (C.n - 1) / 2; P.push([q0.x + ux * k * C.ecart, q0.z + uz * k * C.ecart]); } /* (en travers de la ligne : on en sort en avancant ou en reculant) */
  const de = new T.Vector3(mo.x + Math.sin(a) * 0.5, mo.m.position.y + (mo.haut || 2) * 0.7, mo.z + Math.cos(a) * 0.5), tg = C.prepa * 0.45;
  P.forEach(([x, z]) => { const b = new T.Mesh(GEO_BULLE_MUT, MAT_BULLE_MUT); b.visible = false; b.raycast = () => {}; scene.add(b); let t = 0;
    effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin) { jeter(b); return true; } if (t < tg) return false; b.visible = true; const u = Math.min(1, (t - tg) / (C.prepa - tg));
      b.position.set(de.x + (x - de.x) * u, de.y + (y + 0.2 - de.y) * u + Math.sin(u * Math.PI) * 2.2, de.z + (z - de.z) * u); if (Math.random() < 0.5) emettre(FX_LUM, 1, { x: b.position.x, y: b.position.y, z: b.position.z, r: 0.05, vie: [0.2, 0.35], taille: [0.22, 0.05], c: ['#c8ff7a', '#8dff4a'], a: 0.8 });
      if (u >= 1) { jeter(b); return true; } return false; });
    zoneDanger({ mo, x, z, r: C.R, duree: C.prepa, couleur: '#3fae2a', effet: (d) => { pouf(x, y, z, C.R * 1.5, '#8dff4a'); emettre(FX_VIF, 12, { x, y: y + 0.2, z, r: 0.4, v: [0, 3.5, 0], dv: 2.5, vie: [0.35, 0.6], taille: [0.16, 0.05], c: ['#c8ff7a', '#8dff4a', '#3fae2a'], grav: 10 });
      const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) blesserPerso(Math.max(1, Math.round(degSort(mo) * C.x)), mo); flaqueMut(x, z, y, C.R * 1.1, C.flaque.duree, C.flaque.pct); } }); });
}
function capPinceMut(mo, ctx) { /* le coup de pince du greffe : un eventail devant lui, il repousse et assomme */
  const P = mo.d.pince; if (!P || mo.etat !== 'actif' || combat.deroute != null) return; const { pp, sortPret } = ctx, dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
  if (!sortPret('pinceT', P.periode)) return; if (dP > P.R + 0.6) { mo.pinceT = P.periode; return; }
  mo.pinceT = 0; const c0 = combat, a = Math.atan2(pp.x - mo.x, pp.z - mo.z); mo.ry = a; mo.bloqueT = P.prepa + 0.35; mo.frappe = 0.3;
  mo.geste = null; gesteSort(mo, 'coup', P.prepa); if (!c0.pinceVu) { c0.pinceVu = true; toast(leNom(mo.d) + ' arme sa pince : sors de l\'éventail rouge, il repousse et assomme !', 'alerte'); }
  zoneDanger({ mo, x: mo.x, z: mo.z, r: P.R, a, ouv: P.ouv, duree: P.prepa, effet: (d) => { const y = mo.m.position.y; secousse(0.12, 0.2); emettre(FX_VIF, 14, { x: mo.x + Math.sin(a) * P.R * 0.6, y: y + 0.8, z: mo.z + Math.cos(a) * P.R * 0.6, r: 0.5, dv: 5, vie: [0.25, 0.45], taille: [0.12, 0.04], c: ['#ffffff', '#ffd27a', '#9aa3ad'], grav: 8, frein: 1 });
    const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) { blesserPerso(Math.max(1, Math.round(degSort(mo) * P.x)), mo); if (combat && !combat.fin) { repousserPerso(mo, P.repousse); etourdir(P.assomme); } } } });
}
function capGrappinMut(mo, ctx) { /* le grappin du greffe : une ligne jusqu'a toi, il te ramene contre lui et t'assomme */
  const G = mo.d.grappin; if (!G || mo.etat !== 'actif' || combat.deroute != null) return; const { pp, sortPret } = ctx, dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
  if (!sortPret('grappinT', G.periode)) return; if (dP < G.min || dP > G.max) { mo.grappinT = G.periode; return; }
  mo.grappinT = 0; const c0 = combat, q0 = visePerso(G.prepa), a = Math.atan2(q0.x - mo.x, q0.z - mo.z), L = Math.hypot(q0.x - mo.x, q0.z - mo.z) + 1.5, x2 = mo.x + Math.sin(a) * L, z2 = mo.z + Math.cos(a) * L; mo.ry = a; mo.bloqueT = G.prepa + 0.5; mo.frappe = 0.3;
  mo.geste = null; gesteSort(mo, 'coup', G.prepa); if (!c0.grappinVu) { c0.grappinVu = true; toast(leNom(mo.d) + ' lance son grappin : sors de la ligne, ou il te ramène contre lui et t\'assomme !', 'alerte'); }
  zoneDanger({ mo, x: mo.x, z: mo.z, x2, z2, larg: G.larg, duree: G.prepa, couleur: '#8a95a5', fort: 1.4, bord: true, effet: (d) => {
    const y0 = mo.m.position.y + (mo.haut || 2) * 0.55, p2 = paysanMesh.position, pris = dansDanger(d, p2.x, p2.z), bout = pris ? new T.Vector3(p2.x, p2.y + 1, p2.z) : new T.Vector3(x2, solMut() + 0.5, z2);
    const geo = new T.BufferGeometry().setFromPoints([new T.Vector3(mo.x, y0, mo.z), bout]), l = new T.Line(geo, new T.LineBasicMaterial({ color: '#cfd4da' })); l.raycast = () => {}; scene.add(l); setTimeout(() => { jeter(l); }, 320);
    if (pris) { blesserPerso(Math.max(1, Math.round(degSort(mo) * G.x)), mo); if (combat && !combat.fin) attirerPerso(mo); } } });
}
function capDrainMut(mo, ctx) { /* le specimen vampire : un cercle autour de lui, il aspire ta vie et se soigne de trois fois ce qu'il prend */
  const D = mo.d.drain; if (!D || mo.etat !== 'actif' || combat.deroute != null) return; const { pp, sortPret } = ctx, dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
  if (!sortPret('drainT', D.periode)) return; if (dP > D.R + 1.5) { mo.drainT = D.periode; return; }
  mo.drainT = 0; const c0 = combat, x0 = mo.x, z0 = mo.z; mo.bloqueT = D.prepa + 0.3; mo.geste = null; gesteSort(mo, 'rugir', D.prepa + 0.2);
  if (!c0.drainVu) { c0.drainVu = true; toast(leNom(mo.d) + ' va aspirer ta vie : sors du cercle, il se soigne de ce qu\'il te prend !', 'alerte'); }
  zoneDanger({ mo, x: x0, z: z0, r: D.R, duree: D.prepa, couleur: '#9a1030', effet: (d) => { const p2 = paysanMesh.position, y = mo.m.position.y;
    emettre(FX_LUM, 26, { x: x0, y: y + 0.3, z: z0, r: D.R * 0.8, plat: true, v: [0, 1.6, 0], dv: 0.6, vie: [0.4, 0.7], taille: [0.2, 0.05], c: ['#ff3a5a', '#9a1030'], a: 0.85 });
    if (dansDanger(d, p2.x, p2.z)) { const a0 = combat.pv; blesserPerso(Math.max(1, Math.round(degSort(mo) * D.x)), mo); const pris = Math.max(0, a0 - (combat ? combat.pv : a0)), h = Math.round(pris * D.soin);
      if (h > 0) { mo.pv = Math.min(mo.pvMax, mo.pv + h); chiffre('+' + h, new T.Vector3(mo.x, y + (mo.haut || 2), mo.z), 'soin'); } } } });
}
function capRenfortsMut(mo, ctx) { /* les boss du labo appellent des mutants de leur type toutes les 16 s (2 a la fois, 4 au plus, sans butin) */
  const rf = mo.d.renfortsMut; if (!rf || mo.etat !== 'actif' || !(combat && combat.genre === 'donjon')) return; const { sortPret } = ctx;
  if (!sortPret('renfortMT', RENFORTS_MUT.periode)) return; mo.renfortMT = 0;
  const vivants = combat.monstres.filter((o) => o.renfortDe === mo && o.etat !== 'mort').length; if (vivants >= RENFORTS_MUT.max) return;
  const c0 = combat, n = Math.min(RENFORTS_MUT.n, RENFORTS_MUT.max - vivants); gesteSort(mo, gesteDe(mo, 'renforts', 'rugir'), 0.8); secousse(0.1, 0.2);
  if (!c0.renfortsMutVu) { c0.renfortsMutVu = true; toast(leNom(mo.d) + ' appelle des ' + rf[1] + ' : il en rappellera toutes les ' + RENFORTS_MUT.periode + ' s tant qu\'il sera debout !', 'alerte'); }
  else chiffre('Renforts !', new T.Vector3(mo.x, mo.m.position.y + (mo.haut || 2) + 0.4, mo.z), 'butin');
  for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, r = 2.2 + Math.random() * 1.2, x = mo.x + Math.cos(a) * r, z = mo.z + Math.sin(a) * r; combat.total++;
    setTimeout(() => { if (combat !== c0 || c0.fin) return; apparaitre(rf[0], { x, z, apres: (o) => { if (typeof transmuter === 'function') transmuter(o); o.renfort = true; o.renfortDe = mo; o.aggro = true;
      if (mo.lab) o.lab = Object.assign({}, mo.lab); if (mo.salle != null) o.salle = mo.salle; if (mo.camp != null) { o.camp = mo.camp; o.maison = { x, z }; } o.y = mo.y; if (o.dep && mo.dep) { o.dep.x = x; o.dep.z = z; o.dep.y = mo.dep.y; }
      pouf(x, solMut(), z, 1.2, '#8dff6a'); } }); }, 250 + k * 200); }
}
CAPACITES.push(capObusMut, capBombardMut, capCrachatMut, capPinceMut, capGrappinMut, capDrainMut, capRenfortsMut);
/* les renforts ne donnent rien (ni poil, ni cristal) ; la flaque du fluo tombe quand meme */
{ const butinMut2 = butin; butin = function (mo) { if (mo && mo.renfort && combat && combat.genre === 'donjon') { try { if (mo.d && mo.d.flaqueMort) flaqueFluo(mo); } catch (e) { /* rien */ } return; } return butinMut2.apply(this, arguments); }; }
/* ---------------- le Docteur, plus dur (« le meme delire que les boss de l'ile, voire plus dur vu qu'on est plusieurs ») ---------------- */
const KIT_WAB_DIFFICILE = { rafale: 8, harpon: 7, saisie: 6.5, vague: 16, vie: 500000, parJoueur: 0.9 }; /* (vie : 500 000 en solo, choisi par Mathieu au formulaire le 24/11/2026 ; vie des mutants et boss x5 gardes) */
if (typeof KIT_WAB !== 'undefined') { KIT_WAB.rafale.periode = KIT_WAB_DIFFICILE.rafale; KIT_WAB.harpon.periode = KIT_WAB_DIFFICILE.harpon; KIT_WAB.saisie.periode = KIT_WAB_DIFFICILE.saisie; KIT_WAB.phase.vague = KIT_WAB_DIFFICILE.vague;
  KIT_WAB.vie.base = KIT_WAB_DIFFICILE.vie; KIT_WAB.vie.parJoueur = KIT_WAB_DIFFICILE.parJoueur; }

/* ILS CONTOURNENT (24/11/2026, « le mini-boss etait bugge dans un mur invisible en bord de map », Mathieu) : sur l'ile, un mutant lance a ta poursuite allait tout
   droit et restait colle contre un rocher, un arbre ou le bord de l'eau. Toutes les 0,7 s, s'il ne te voit pas en ligne droite (la grille des chemins du perso,
   29c), il prend le chemin le plus court (cheminGrille) et le suit jusqu'a te revoir. Aussi s'il n'a presque pas bouge depuis 1,5 s */
const CONTOURNE_MUT = { tous: 0.7, coince: 1.5, bouge: 0.4 };
function voitLabo(ax, az, bx, bz) { const G = grilleCh('sol'), n = G.n, L = Math.hypot(bx - ax, bz - az), N = Math.ceil(L / 0.25);
  for (let s2 = 1; s2 < N; s2++) { const x = ax + (bx - ax) * s2 / N, z = az + (bz - az) * s2 / N, i = Math.floor((x - G.x0) / PAS_CH), j = Math.floor((z - G.z0) / PAS_CH); if (i < 0 || j < 0 || i >= n || j >= n || G.ok[j * n + i] !== 1) return false; } return true; }
{ const majMonstreContourne = majMonstre; majMonstre = function (mo, dt) {
    try { if (lieu === 'donjon' && combat && combat.genre === 'donjon' && donjonEtat && mo.etat === 'actif' && mo.lab && mo.lab.mode === 'sol' && !mo.d.vol && !mo.d.boss && (mo.aggro || mo.chasse) && donjonEtat.perso.mode === 'sol' && !(mo.camp != null && donjonEtat.camps[mo.camp] && !donjonEtat.camps[mo.camp].actif)) {
        const now = performance.now() / 1000, p = paysanMesh.position, ax = mo.x - DONJON.x, az = mo.z - DONJON.z, bx = p.x - DONJON.x, bz = p.z - DONJON.z, d = Math.hypot(bx - ax, bz - az);
        const T0 = mo.contourne || (mo.contourne = { t: 0, x: mo.x, z: mo.z, tb: now, ch: null });
        if (now - T0.tb > CONTOURNE_MUT.coince) { const coince = Math.hypot(mo.x - T0.x, mo.z - T0.z) < CONTOURNE_MUT.bouge && d > (mo.d.portee || 1.5) + 1.5; T0.x = mo.x; T0.z = mo.z; T0.tb = now; if (coince) T0.t = 0; }
        if (now - T0.t > CONTOURNE_MUT.tous) { T0.t = now; T0.ch = d > (mo.d.portee || 1.5) + 1.2 && !voitLabo(ax, az, bx, bz) ? cheminGrille('sol', ax, az, bx, bz) : null; }
        if (T0.ch && T0.ch.length && !(mo.bloqueT > 0) && !mo.geste) { let w = T0.ch[0]; if (Math.hypot(w.x - ax, w.z - az) < 0.5) { T0.ch.shift(); w = T0.ch[0]; }
          if (w) { const wx = w.x - ax, wz = w.z - az, L = Math.hypot(wx, wz) || 1, v = Math.min(L, vitesseMonstre(mo.d) * (dt || 0.016)); mo.x += wx / L * v; mo.z += wz / L * v; mo.ry = Math.atan2(wx, wz); mo.vLabo = v / Math.max(dt || 0.016, 1e-3);
            return majMonstreContourne.call(this, mo, 0, arguments[2]); } } } } catch (e) { /* rien */ }
    return majMonstreContourne.apply(this, arguments); }; }
/* PLUS SOLIDES ET PLUS DE PROJECTILES (24/11/2026 au soir, apres l'essai de Mathieu : « en solo, leurs PV sont vraiment trop faibles ; je mets a peu pres 10-15 000
   en zone avec mes doubles legendaires et mes doubles sorts, si tout le monde fait ca on one-shot les vagues ; les degats ca va, meme si je trouve qu'il n'y a pas
   assez de projectiles, surtout si on est plusieurs ») : la vie des mutants x3 (15 000 a 48 000 au niveau 100 : il faut 2 a 4 passages de sorts de zone par
   groupe), +60 % par joueur en plus ; le garde tire 3 cawottes a la suite (la moitie chacune), le drone 2 (60 % chacune), une de plus par joueur en plus.
   Les boss du labo (x5) et le Docteur partent de la. Quand le donjon se jouera a plusieurs, combat.joueurs le dira (joueursWab, 27k) */
const PV_PEUR = 3, PV_PEUR_PAR_JOUEUR = 0.6;
['wabGarde', 'wabEnrage', 'wabFluo', 'wabGreffe', 'wabVampire', 'wabGarou', 'wabDrone'].forEach((t) => { const D = MONSTRES[t]; if (!D) return; const p0 = D.pv;
  D.pv = (n) => Math.round(p0(n) * PV_PEUR * (1 + PV_PEUR_PAR_JOUEUR * (Math.max(1, (combat && combat.joueurs) || 1) - 1))); });
if (MONSTRES.wabGarde) MONSTRES.wabGarde.salve = { n: 3, x: 0.5, ecart: 0.14 };
if (MONSTRES.wabDrone) MONSTRES.wabDrone.salve = { n: 2, x: 0.6, ecart: 0.18 };
{ const tirMut0 = tirMonstre; tirMonstre = function (mo, bat, caw) { const S = mo && mo.d && mo.d.salve; if (!S || bat || caw) return tirMut0.apply(this, arguments);
    const n = S.n + Math.max(0, ((combat && combat.joueurs) || 1) - 1), c0 = combat, un = () => { const dd = mo.deg; mo.deg = Math.max(1, Math.round(dd * S.x)); try { tirMut0.call(this, mo, null, null); } finally { mo.deg = dd; } };
    un(); let t = 0, k = 1; effets.push((dt) => { t += dt; if (combat !== c0 || !c0 || c0.fin || mo.etat !== 'actif') return true; while (k < n && t >= k * S.ecart) { un(); k++; } return k >= n; }); }; }
