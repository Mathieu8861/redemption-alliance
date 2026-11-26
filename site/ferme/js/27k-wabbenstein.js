'use strict';
/* LE DOCTEUR WABBENSTEIN, LE BOSS DU LABORATOIRE DE LA CAWOTTE (20/11/2026, EN ESSAI DANS L'ARENE DEV SEULEMENT). Le savant fou du donjon de l'ile des
   Wabbits (ILE-DONJON.md), modele fait d'apres la maquette 3 retenue par Mathieu, tete refaite, squelette et mouvements faits main (blender/labo/).
   « tu as fait l'animation des cawottes qui partent en rafale minigun ? et le harpon qui peut t'attraper de loin ? hyper rapidement aussi pour t'attirer
   au cac et ensuite il te met un coup de poing » (Mathieu). Ses deux sorts :
   - la RAFALE DE CAWOTTES : ses deux tourelles montent et basculent par-dessus ses epaules, un eventail rouge devant lui, puis 3 s de tir : chaque tourelle
     crache une cawotte toutes les 0,12 s, la ou elle pointe (elles balaient l'eventail, l'une vers la gauche quand l'autre va vers la droite). Chaque cawotte
     touchee fait mal, on sort de l'eventail ; tout pres de lui, elles passent encore au-dessus de la tete ;
   - le HARPON : une ligne rouge de lui jusqu'a toi (0,6 s), puis le harpon part tres vite le long de la ligne. Touche, tu es harponne, ramene au corps a
     corps en un quart de seconde, et il t'assene un coup de poing de sa main mecanique qui te repousse. Rate, le harpon revient.
   Les tourelles ont leurs propres mouvements (tourelles_sortie, tourelles_rafale, tourelles_rentree), joues PAR-DESSUS les autres : on ne garde, dans chaque
   mouvement, que les pistes de ses os. Le harpon et sa chaine ne sont jamais animes par les mouvements : ce fichier les place a chaque image (la chaine du
   modele, en U sous le canon au repos, est cachee pendant le tir et une chaine aussi longue que la ligne la remplace).
   DEGATS (20/11/2026, Mathieu : « chaque cawotte qui touche retire 2 % des hp de la personne ; harpon a l'impact -1400 et ensuite coup au cac, si on esquive pas
   en 0,7 s on prend 570 ») : des montants fixes, avant les resistances des panoplies (comme tout coup recu), sans le bonus de degats des paliers ; 2 % des PV
   max du perso par cawotte. Apres le harpon, le perso n'est retenu que le temps d'etre ramene (0,28 s) : la zone du coup de poing (bleue, celle des coups au
   corps a corps des boss) dure 0,7 s, on peut en sortir. Le reste (vie, coups de base) : les chiffres de Scorpal, a regler. Pas encore dans le jeu des
   joueurs : seulement dans l'Arene dev (GROUPES_DEV).
   SES COUPS AUTOMATIQUES (20/11/2026, Mathieu : « il peut a la fois taper au corps a corps et a distance ? avec un de ses miniguns il frappe quelqu'un a
   5 cases, une cawotte toutes les 2 secondes, 245 points de degats, et au cac coup classique 450 ») : au contact, son coup de poing normal fait 450 ; plus
   loin, jusqu'a 5 cases (10 unites, une case = S = 2), une tourelle (l'une puis l'autre) tire une cawotte toutes les 2 s : elle part le long du canon,
   puis retombe sur toi (245). Montants avant les resistances, comme ses sorts ; il continue d'avancer pendant qu'il tire. */
SQUELETTES_A_CHARGER.push(['wabbenstein', 'assets/modeles/jeu/wabbenstein-anime.glb', 4.5]); /* (26/11/2026, « 20 a 30 % plus grand », Mathieu : 3,6 avant) */ ALLURES.wabbenstein = { marche: 0.635, course: 1.39 };
const KIT_WAB = {
  rafale: { periode: 11, prepa: 0.45, R: 16, ouv: 0.5, avance: 0.5, tourne: 1.1, arret: 3.0, /* (avance, tourne, arret : il marche vers le joueur le plus proche en tirant, a la moitie de sa vitesse, et tourne a 1,1 rad/s, 26/11/2026) */ /* (26/11/2026, « la portee de ses sorts est pas tres grande par rapport a la map ; trop simple a esquiver », Mathieu : 9,5 de long, 0,42 d'ouverture, 0,6 s d'annonce avant) */ cadence: 0.12, vitesse: 15, pct: 0.02, toucher: 0.65 }, /* (pct : 2 % des PV max du perso par cawotte) */
  autos: { cac: 0.075, tir: 0.055, portee: 14 * S, cadence: 1.6 }, /* (26/11/2026, « trop facile a distance » au banc : 14 cases, presque toute sa salle (5 avant), 5,5 % de tes PV (4,1 avant) toutes les 1,6 s (2 avant)) */ /* (22/11/2026 : en part des PV max, 450 et 245 sur un perso de 6 000 PV ; en montants fixes, ses coups au contact, 3/4 de ses degats, rattrapaient aussi le Cra et l'Osamodas et pesaient 11,5 % de la vie de l'Osa contre 7,5 % du Iop : le bot tombait 12 fois a distance contre 7 au Iop) */ /* (portee : 5 cases) */
  vie: { base: 180000, parJoueur: 0.75 }, /* (20/11/2026, « regle sa vie pour le donjon » : 180 000 en solo, environ 3 min pour un perso de niveau 105 equipe (1 000 de degats par seconde en vrai combat, 1 715 sans bouger) ; +75 % par joueur en plus, x4 a 5 joueurs) */
  phase: { seuil: 0.3, creatures: ['wabGarou', 'wabGarou', 'wabGarou', 'wabGarou'], /* (24/11/2026 : ses Wabbits garous, 27n-mutants-labo.js ; des Gwand Wabbits avant) */ parDeuxJoueurs: 2, vague: 20, max: 12, maxParJoueur: 3, puissance: 1.25, vitesse: 1.25, taille: 1.15, cadenceTir: 1.5 }, /* (sous 30 %, Mathieu, 20/11 : « 4 Gwand Wabbits toutes les 20 secondes », +25 %, la rage et la vitesse ; max : 12 en vie au plus, mon garde-fou) */
  saisie: { periode: 8, prepa: 0.6, R: 2.8 * S, /* (26/11/2026 : 0,8 s et 2,2 cases avant) */ ouv: 0.7, degats: 400, duree: 10, lent: 0.2, jet: 2.0 }, /* (le serum, Mathieu, 20/11 : « 400 degats + un malus de 20 % de vitesse de deplacement, degats pendant 10 s », toutes les 8 s : 400 en 10 s, 40 par seconde, et -20 % de vitesse les memes 10 s) */
  harpon: { periode: 9, prepa: 0.42, min: 2 * S, max: 12 * S, R: 12 * S + 1, /* (26/11/2026 : jusqu'a 12 cases, 8 avant ; 0,42 s d'annonce, 0,6 avant) */ /* (de 2 a 8 cases, « 2 a 8 cases pour le harpon, vas-y », Mathieu, 20/11 ; R : la ligne, un peu au-dela) */ larg: 1.1, vitesse: 34, retour: 26, impact: 0.233, tire: 0.28, poing: 0.095, /* (22/11/2026 : en part des PV max, 1 400 et 570 sur un perso de 6 000 PV ; en montants fixes, le harpon prenait la moitie de la vie de l'Osamodas, 3 900 PV, qu'il vise sans cesse a distance, et le bot tombait 12 fois avec le Cra ou l'Osa contre 7 avec le Iop) */ prepaPoing: 0.7, rPoing: 3.4, ouvPoing: 0.85, repousse: 2.2, toucher: 0.6 }, /* (toucher : la moitie de la ligne rouge, 0,55, et un peu de corps : hors de la ligne, il te manque) */
};
/* LES CREATURES DE LA PHASE SOUS 30 % (22/11/2026, equilibrage) : leurs coups valent 8,7 % de tes PV max (525 sur un Iop de 6 000 PV, comme avant) ; en montants
   fixes, elles faisaient 55 % des degats recus par l'Osamodas (3 900 PV, 14 % de sa vie par coup) et le bot tombait 10 a 12 fois a distance contre 5 a 7 au Iop */
const CREATURE_WAB_PART = 0.087;
MONSTRES.wabbenstein = { element: 'terre', nom: 'Docteur Wabbenstein', modele: 'wabbenstein', icone: 'wabbenstein', boss: true, stable: true,
  desc: 'le savant fou du Laboratoire de la Cawotte, dans son armure : ses deux tourelles crachent des rafales de cawottes en éventail (2 % de tes PV par cawotte), et son harpon t\'attrape de loin (23 % de tes PV), te ramène contre lui et arme un coup de poing (9,5 % de tes PV) : 0,7 s pour sortir de la zone. Ses coups normaux : 7,5 % de tes PV au contact, et jusqu\'à 5 cases une cawotte de ses tourelles toutes les 2 s (4 % de tes PV). Sa main mécanique t\'attrape et t\'injecte son sérum : 400 dégâts en 10 s et 20 % de vitesse en moins',
  pv: () => 60000, deg: () => 112, cadence: 1.6, vitesse: 2.0, portee: 3.75, ombre: 5.0, degSort: 3.2, wabKit: KIT_WAB,
  /* DEUX SORTS DE PLUS (26/11/2026, « il est beaucoup trop facile, meme pas touche une fois ; rajoute-lui des sorts, aussi dur que les boss de l'ile des boss, voire plus :
     on est plusieurs a taper dessus », Mathieu) : la pluie de cawottes (cinq cercles orange, un sur toi, 1,4 s pour en sortir, toutes les 5 s) et la decharge des
     bobines (de pres, un grand cercle bleu autour de lui, 1 s, qui te repousse, toutes les 8 s) */
  pluie: 5, pluieTexte: 'Le Docteur fait pleuvoir des cawottes du haut de ses tourelles', seisme: 8, seismeR: 6.5, seismeDuree: 1.0, seismeProche: 1.5, repousse: true, seismeNom: 'Décharge des bobines' };
GROUPES_DEV.wabbenstein = { nom: 'Docteur Wabbenstein (donjon, solo)', liste: { wabbenstein: 1 } };
/* LE DONJON A PLUSIEURS (20/11/2026, « le DJ doit s'adapter en fonction du nombre de participants, max 5 ») : sa vie x(1 + 0,75 par joueur en plus), 2 Gwand
   Wabbits de plus par vague tous les 2 joueurs en plus, et le plafond de ses creatures monte. Le jeu n'a pas encore de donjon a plusieurs : combat.joueurs le dira ;
   en attendant, deux variantes de l'Arene dev simulent 3 et 5 joueurs (meme Docteur, meme kit) */
MONSTRES.wabbenstein3 = Object.assign({}, MONSTRES.wabbenstein, { joueursSimu: 3 }); MONSTRES.wabbenstein5 = Object.assign({}, MONSTRES.wabbenstein, { joueursSimu: 5 });
GROUPES_DEV.wabbenstein3 = { nom: 'Docteur Wabbenstein (3 joueurs simulés)', liste: { wabbenstein3: 1 } }; GROUPES_DEV.wabbenstein5 = { nom: 'Docteur Wabbenstein (5 joueurs simulés)', liste: { wabbenstein5: 1 } };
const joueursWab = (mo) => Math.max(1, Math.min(5, (combat && combat.joueurs) || (mo && mo.d && mo.d.joueursSimu) || 1));
/* LA VIE SELON LE NOMBRE DE JOUEURS (26/11/2026, Mathieu : « un joueur, 600 000 ; deux joueurs, +100 %, 1,2 million ; puis a chaque joueur en plus, +120 % par rapport
   a la marche d'avant ; et pour les mutants, tu fais pareil ») : x1, x2, x4,4, x9,68, x21,3 (de 1 a 5 joueurs). Le Docteur, ses mutants et leurs chefs */
const COEF_JOUEURS_LABO = { deux: 1.0, ensuite: 1.2 };
const coefJoueursLabo = (n) => { n = Math.max(1, Math.min(5, n || 1)); return n === 1 ? 1 : (1 + COEF_JOUEURS_LABO.deux) * Math.pow(1 + COEF_JOUEURS_LABO.ensuite, n - 2); };
/* ---------------- le modele : les pistes de chaque mouvement, les axes des tourelles et du harpon ---------------- */
const OS_TOURELLES_WAB = /^(tourelle|barillet|fourreau|tige)[GD]\./, OS_HARPON_WAB = /^(harpon|maillon\d+)\./;
const b2gWab = (x, y, z) => new T.Vector3(x, z, -y); /* (repere de Blender, il regarde -Y, vers celui du jeu) */
const chargerSqueletteWab = chargerSquelette;
chargerSquelette = async function (nom) { await chargerSqueletteWab.apply(this, arguments); const M = nom === 'wabbenstein' && MODELES.wabbenstein; if (M && !M.userData.wab) preparerWab(M); };
function preparerWab(M) {
  M.userData.clips.forEach((c) => { const tour = /^tourelles_/.test(c.name); c.tracks = c.tracks.filter((k) => tour ? OS_TOURELLES_WAB.test(k.name) : !OS_TOURELLES_WAB.test(k.name) && !OS_HARPON_WAB.test(k.name)); });
  M.updateMatrixWorld(true);
  const local = (nom, v) => { const b = M.getObjectByName(nom); return v.clone().normalize().applyQuaternion(b.getWorldQuaternion(new T.Quaternion()).invert()); };
  const h = M.getObjectByName('harpon'), canon = h.parent, hW = h.getWorldPosition(new T.Vector3());
  /* la sortie de la chaine, sous la bouche du canon (equipement_commun.py : BOUCHE et SORTIE), dans le repere du canon ; le modele est a l'echelle 2 */
  const ax = new T.Vector3(-0.06, -0.966, -0.247).normalize(), bas = new T.Vector3(0, 0, -1).addScaledVector(ax, ax.z).normalize(), dS = ax.clone().multiplyScalar(-0.03).addScaledVector(bas, 0.105);
  const sortieW = hW.clone().add(b2gWab(dS.x, dS.y, dS.z).multiplyScalar(2));
  M.userData.wab = { axeG: local('tourelleG', b2gWab(0.60, 0.28, 0.75)), axeD: local('tourelleD', b2gWab(-0.60, 0.28, 0.75)), axeH: local('harpon', b2gWab(-0.06, -0.966, -0.247)), axeMain: local('mainG', b2gWab(0, -0.08, -0.25)),
    sortie: canon.worldToLocal(sortieW.clone()) };
}
function osWab(mo) {
  if (mo.wabOs) return mo.wabOs; const m = mo.m; if (!m) return null; const h = m.getObjectByName('harpon'); if (!h) return null;
  const M = []; m.traverse((o) => { if (o.isBone && /^maillon\d+$/.test(o.name)) M.push(o); });
  return (mo.wabOs = { tG: m.getObjectByName('tourelleG'), tD: m.getObjectByName('tourelleD'), mG: m.getObjectByName('mainG'), h, canon: h.parent, hP: h.position.clone(), hQ: h.quaternion.clone(), maillons: M });
}
/* ---------------- les tourelles ---------------- */
const NOMS_TOURELLES = ['tourelles_sortie_1', 'tourelles_rafale_1', 'tourelles_rentree_1'];
function tourellesWab(mo, phase) {
  const an = mo.m && mo.m.userData.anim, nom = 'tourelles_' + phase + '_1', a = an && an.A[nom]; if (!a) return 0;
  NOMS_TOURELLES.forEach((n) => { if (n !== nom && an.A[n]) an.A[n].stop(); });
  const boucle = phase === 'rafale'; a.reset(); a.setLoop(boucle ? T.LoopRepeat : T.LoopOnce, boucle ? Infinity : 1); a.clampWhenFinished = !boucle; a.timeScale = 1; a.setEffectiveWeight(1); a.play(); return a.getClip().duration;
}
const vW1 = new T.Vector3(), qW1 = new T.Quaternion(), qW2 = new T.Quaternion(), qW3 = new T.Quaternion(), mW1 = new T.Matrix4();
function boucheTourelle(mo, c) { /* la bouche d'une tourelle (0,74 du pivot le long de son axe) et la direction ou elle pointe, dans le monde */
  const O = osWab(mo), b = c === 'G' ? O.tG : O.tD, W = MODELES.wabbenstein.userData.wab, ax = c === 'G' ? W.axeG : W.axeD;
  return { p: ax.clone().multiplyScalar(0.74).applyMatrix4(b.matrixWorld), d: ax.clone().applyQuaternion(b.getWorldQuaternion(qW1)) };
}
let GEO_CAW = null;
function cawotteTir() {
  if (!GEO_CAW) { const c = new T.ConeGeometry(0.14, 0.62, 8); c.rotateX(Math.PI / 2); const f = new T.ConeGeometry(0.08, 0.26, 5); f.rotateX(-Math.PI / 2); f.translate(0, 0, -0.4);
    GEO_CAW = { c, f, mc: mat('#ee7a26'), mf: mat('#5fae3a') }; partager(c, f, GEO_CAW.mc, GEO_CAW.mf); }
  const g = new T.Group(); g.add(new T.Mesh(GEO_CAW.c, GEO_CAW.mc), new T.Mesh(GEO_CAW.f, GEO_CAW.mf)); return g;
}
function tirerCawotte(mo, c, R, c0) {
  const { p, d } = boucheTourelle(mo, c), h = Math.hypot(d.x, d.z) || 1, e = (Math.random() - 0.5) * 0.07, ux = (d.x * Math.cos(e) + d.z * Math.sin(e)) / h, uz = (-d.x * Math.sin(e) + d.z * Math.cos(e)) / h;
  const g = cawotteTir(); g.position.copy(p); scene.add(g); emettre(FX_LUM, 1, { x: p.x, y: p.y, z: p.z, vie: [0.08, 0.12], taille: [0.9, 0.3], c: ['#fff1a8', '#ff9a2e'], a: 0.9 });
  const y0 = p.y, yv = solA(p.x, p.z) + 1.0, L = R.R + 1; let s = 0, rot = Math.random() * 6;
  effets.push((dt) => {
    if (combat !== c0 || c0.fin) { jeter(g); return true; }
    s += R.vitesse * dt; rot += dt * 16; const ex = Math.exp(-s / 1.3), x = p.x + ux * s, z = p.z + uz * s, y = yv + (y0 - yv) * ex; /* (elle plonge depuis la tourelle puis file a hauteur de poitrine) */
    g.position.set(x, y, z); g.lookAt(x + ux, y - (y0 - yv) * ex / 1.3, z + uz); g.rotateZ(rot);
    const pp = paysanMesh.position;
    if (y < pp.y + 2.2 && Math.hypot(pp.x - x, pp.z - z) < R.toucher) { jeter(g); pouf(x, y, z, 0.9, '#ee7a26'); emettre(FX_VIF, 6, { x, y, z, r: 0.1, dv: 3, haut: true, vie: [0.25, 0.4], taille: [0.1, 0.04], c: ['#ee7a26', '#5fae3a'], grav: 9, frein: 1.5 });
      if (!c0.fin) blesserPerso(degWab(mo, c0.pvMax * R.pct), mo); return true; }
    if (s > L) { jeter(g); pouf(x, solA(x, z), z, 0.7, '#ee7a26'); return true; } return false;
  });
}
function capWabRafale(mo, ctx) {
  const K = mo.d.wabKit; if (!K || mo.etat !== 'actif' || mo.geste || mo.wabOccupe) return; const R = K.rafale, { pp, sortPret } = ctx;
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('wabRafaleT', R.periode) || dP > R.R - 0.5 || !osWab(mo)) return;
  const an = mo.m.userData.anim, dS = an.A[NOMS_TOURELLES[0]].getClip().duration, dR = 3 * an.A[NOMS_TOURELLES[1]].getClip().duration, dE = an.A[NOMS_TOURELLES[2]].getClip().duration;
  const c0 = combat, a = Math.atan2(pp.x - mo.x, pp.z - mo.z), tot = dS + dR + dE; mo.wabRafaleT = 0; mo.wabOccupe = true; mo.wabRafaleOn = true; mo.ry = a; mo.bloqueT = Math.max(mo.bloqueT || 0, tot); mo.cd = Math.max(mo.cd || 0, tot);
  if (!c0.wabRafaleVu) { c0.wabRafaleVu = true; toast(leNom(mo.d) + ' sort ses tourelles : sors de l\'éventail rouge, une rafale de cawottes arrive !', 'alerte'); }
  const Z = zoneDanger({ mo, x: mo.x, z: mo.z, r: R.R, a, ouv: R.ouv, duree: dS + dR, effet: () => {} });
  tourellesWab(mo, 'sortie'); let t = 0, phase = 'sortie', aC = a; const pret = { G: 0, D: R.cadence / 2 };
  /* IL AVANCE EN TIRANT (26/11/2026, « son tir de cawottes, il faudrait qu'il bouge ou avance en meme temps qu'il tire, dans la direction du joueur le plus proche »,
     Mathieu) : pendant la rafale, il marche vers le perso a la moitie de sa vitesse (il s'arrete a 3) et tourne vers lui sans a-coup ; l'eventail rouge le suit */
  const suivre = (dt) => { const P2 = paysanMesh.position; let e = Math.atan2(P2.x - mo.x, P2.z - mo.z) - aC; e = Math.atan2(Math.sin(e), Math.cos(e)); aC += Math.max(-R.tourne * dt, Math.min(R.tourne * dt, e));
    if (Math.hypot(P2.x - mo.x, P2.z - mo.z) > (R.arret || 3)) { const v = vitesseMonstre(mo.d) * (R.avance || 0); mo.x += Math.sin(aC) * v * dt; mo.z += Math.cos(aC) * v * dt; mo.vLabo = v; }
    if (Z) { Z.x = mo.x; Z.z = mo.z; Z.a = aC; if (Z.g) { Z.g.position.x = mo.x; Z.g.position.z = mo.z; Z.g.rotation.y = aC - a; } } };
  effets.push((dt) => {
    t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') { if (combat === c0 && mo.etat !== 'mort') tourellesWab(mo, 'rentree'); else if (an) NOMS_TOURELLES.forEach((n) => { if (an.A[n]) an.A[n].stop(); }); mo.wabOccupe = false; mo.wabRafaleOn = false; return true; } /* (mort en pleine rafale : les tourelles retombent en V au lieu de tourner sur son corps) */
    mo.ry = aC;
    if (phase === 'sortie' && t >= dS) { phase = 'rafale'; t = 0; tourellesWab(mo, 'rafale'); }
    else if (phase === 'rafale') { if (R.avance) suivre(dt); for (const c of ['G', 'D']) { pret[c] -= dt; if (pret[c] <= 0) { pret[c] += R.cadence; tirerCawotte(mo, c, R, c0); } }
      if (t >= dR) { phase = 'rentree'; t = 0; tourellesWab(mo, 'rentree'); } }
    else if (phase === 'rentree' && t >= dE) { mo.wabOccupe = false; mo.wabRafaleOn = false; return true; }
    return false;
  });
}
/* ---------------- le harpon ---------------- */
let GEO_CHAINE = null;
function chaineWab() {
  if (!GEO_CHAINE) { const g = new T.TorusGeometry(0.072, 0.024, 5, 12); g.scale(1, 1.45, 1); g.rotateX(Math.PI / 2); GEO_CHAINE = { g, m: mat('#8f8a86') }; partager(g, GEO_CHAINE.m); }
  const im = new T.InstancedMesh(GEO_CHAINE.g, GEO_CHAINE.m, 140); im.frustumCulled = false; im.count = 0; scene.add(im); return im;
}
const oW = new T.Object3D(), zW = new T.Vector3(0, 0, 1);
function poserChaine(im, de, vers) {
  const u = vW1.copy(vers).sub(de), L = u.length(); u.normalize(); const n = Math.min(140, Math.floor(L / 0.13)); im.count = n;
  for (let i = 0; i < n; i++) { oW.position.copy(de).addScaledVector(u, (i + 0.5) * L / Math.max(1, n)); oW.quaternion.setFromUnitVectors(zW, u); if (i % 2) oW.rotateZ(Math.PI / 2); oW.updateMatrix(); im.setMatrixAt(i, oW.matrix); }
  im.instanceMatrix.needsUpdate = true;
}
function poserHarponMonde(O, orig, dir) { /* le harpon (son os) pose dans le monde : son talon en orig, sa pointe vers dir */
  const b = O.h, par = O.canon, W = MODELES.wabbenstein.userData.wab; par.updateMatrixWorld(true);
  b.position.copy(orig).applyMatrix4(mW1.copy(par.matrixWorld).invert());
  const qp = par.getWorldQuaternion(qW1), qr = qW2.copy(qp).multiply(O.hQ), ax = W.axeH.clone().applyQuaternion(qr), qd = qW3.setFromUnitVectors(ax, dir.clone().normalize());
  b.quaternion.copy(qp.invert().multiply(qd.multiply(qr)));
}
function rangerHarpon(O) { O.h.position.copy(O.hP); O.h.quaternion.copy(O.hQ); O.maillons.forEach((b) => b.scale.setScalar(1)); }
function capWabHarpon(mo, ctx) {
  const K = mo.d.wabKit; if (!K || mo.etat !== 'actif' || mo.geste || mo.wabOccupe) return; const H = K.harpon, { pp, sortPret } = ctx;
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('wabHarponT', H.periode) || dP < H.min || dP > H.max) return; const O = osWab(mo); if (!O) return;
  const c0 = combat, a = Math.atan2(pp.x - mo.x, pp.z - mo.z); mo.wabHarponT = 0; mo.wabOccupe = true; mo.ry = a; mo.bloqueT = Math.max(mo.bloqueT || 0, H.prepa + 1.4); mo.cd = Math.max(mo.cd || 0, H.prepa + 1.4);
  const e = mo.echelle || 1, B = versMonde(mo.x, mo.z, a, -1.19 * e, 0.69 * e), ah = Math.atan2(pp.x - B.x, pp.z - B.z), x2 = B.x + Math.sin(ah) * H.R, z2 = B.z + Math.cos(ah) * H.R; /* (la ligne part de la bouche du canon, vers toi ; la bouche calculee depuis sa place et sa direction, pas depuis le modele, qui n'a pas encore tourne vers toi a cette image) */
  const an = mo.m.userData.anim, nomS = an.F.sort && an.F.sort[0]; if (nomS) { const s = jouerAnim(an, nomS, 0.1); if (s) s.timeScale = 0.48 / H.prepa; mo.geste = { t: 0, d: H.prepa + 0.9 }; } /* (il vise : le tir de son mouvement tombe a la fin de l'annonce) */
  if (!c0.wabHarponVu) { c0.wabHarponVu = true; toast(leNom(mo.d) + ' te vise de son harpon : sors de la ligne rouge, sinon il te ramène contre lui !', 'alerte'); }
  zoneDanger({ mo, x: B.x, z: B.z, x2, z2, larg: H.larg, bord: true, duree: H.prepa, effet: () => lancerHarpon(mo, O, H, a, ah, B, c0) });
}
function lancerHarpon(mo, O, H, a, ah, L0, c0) { /* (ah : la direction de la ligne rouge annoncee ; le harpon la suit, sortir de la ligne suffit a l'esquiver) */
  if (combat !== c0 || c0.fin || mo.etat !== 'actif') { mo.wabOccupe = false; return; }
  const B0 = O.h.getWorldPosition(new T.Vector3()), dir = new T.Vector3(Math.sin(ah), 0, Math.cos(ah)), pp = paysanMesh.position, y1 = solA(pp.x, pp.z) + 1.0;
  O.maillons.forEach((b) => b.scale.setScalar(0.001)); const ch = chaineWab(); secousse(0.06, 0.14); pouf(B0.x, B0.y, B0.z, 0.9, '#d8c6a0');
  let s = 0, phase = 'aller', t = 0, x0 = 0, z0 = 0, f = null; const pointe = new T.Vector3(), talon = new T.Vector3(), anneau = new T.Vector3(), sortie = new T.Vector3(), vise = new T.Vector3();
  const fin = () => { rangerHarpon(O); jeter(ch); mo.wabOccupe = false; return true; };
  effets.push((dt) => {
    if (combat !== c0 || c0.fin || mo.etat !== 'actif') { if (phase === 'tire') { mo.wabTient = false; } return fin(); }
    mo.ry = a; const B = O.hP.clone().applyMatrix4(O.canon.matrixWorld); sortie.copy(MODELES.wabbenstein.userData.wab.sortie).applyMatrix4(O.canon.matrixWorld);
    if (phase === 'aller' || phase === 'retour') {
      s += (phase === 'aller' ? H.vitesse : -H.retour) * dt; pointe.set(L0.x, B.y, L0.z).addScaledVector(dir, s + 0.95); pointe.y = B.y + (y1 - B.y) * Math.min(1, s / 4); /* (le long de la ligne annoncee, depuis son depart) */
      if (phase === 'aller') { const p = paysanMesh.position;
        if (Math.hypot(p.x - pointe.x, p.z - pointe.z) < H.toucher && !(c0.invincible > 0)) { /* harponne : ramene contre lui */
          phase = 'tire'; t = 0; x0 = p.x; z0 = p.z; mo.wabTient = true; chemin = []; arrivee = null;
          const g = mo.ry + 0, fx = mo.x + Math.sin(g) * 1.7 * (mo.echelle || 1) + Math.cos(g) * 0.5, fz = mo.z + Math.cos(g) * 1.7 * (mo.echelle || 1) - Math.sin(g) * 0.5; f = pointValide(mo.x, mo.z, fx, fz);
          const q = p.clone(); q.y += 2.1; chiffre('Harponné !', q, 'vol'); etoileImpact(pointe, 0.8); blesserPerso(degWab(mo, c0.pvMax * H.impact), mo); c0.assomme = Math.max(c0.assomme || 0, H.tire); /* (retenu le temps d'etre ramene seulement : le coup de poing s'esquive) */
          if (nomS(mo)) { const ac = mo.m.userData.anim.A[nomS(mo)]; if (ac) ac.timeScale = 2.2; } }
        else if (s >= H.R) phase = 'retour'; }
      if (phase === 'retour' && s <= 0) return fin();
      if (phase !== 'tire') { talon.copy(pointe).addScaledVector(dir, -0.95); vise.copy(pointe).sub(talon); poserHarponMonde(O, talon, vise); anneau.copy(talon).addScaledVector(vise.normalize(), 0.32); poserChaine(ch, sortie, anneau); return false; }
    }
    if (phase === 'tire') { /* il te ramene en un quart de seconde, le harpon plante dans toi */
      t += dt; const k = Math.min(1, t / H.tire), e = 1 - (1 - k) * (1 - k), p = paysanMesh.position; p.x = x0 + (f.x - x0) * e; p.z = z0 + (f.z - z0) * e;
      pointe.set(p.x, solA(p.x, p.z) + 1.0, p.z); vise.copy(pointe).sub(B); if (vise.lengthSq() < 0.01) vise.set(Math.sin(a), 0, Math.cos(a)); talon.copy(pointe).addScaledVector(vise.clone().normalize(), -0.95);
      poserHarponMonde(O, talon, vise); anneau.copy(talon).addScaledVector(vise.clone().normalize(), 0.32); poserChaine(ch, sortie, anneau);
      if (k >= 1) { const c = caseIci(f.x, f.z); if (c) paysanMesh.userData.cellule = c; mo.wabTient = false; poingWab(mo, H, c0); rangerHarpon(O); jeter(ch); return true; }
    }
    return false;
  });
}
const nomS = (mo) => { const an = mo.m && mo.m.userData.anim; return an && an.F.sort && an.F.sort[0]; };
function poingWab(mo, H, c0) { /* le coup de poing de la main mecanique, juste apres l'avoir ramene : 0,7 s pour sortir de la zone */
  const an = mo.m.userData.anim, nom = an.F.coup && an.F.coup[0], p = paysanMesh.position, a0 = Math.atan2(p.x - mo.x, p.z - mo.z), e = mo.echelle || 1; mo.ry = a0; mo.wabOccupe = true;
  const ac = nom && jouerAnim(an, nom, 0.06), D = ac ? ac.getClip().duration : 0.6, imp0 = (((mo.m.userData.impacts || {})[nom] || [])[0] || { t: D * 0.45 }).t, ts = imp0 / H.prepaPoing;
  if (ac) ac.timeScale = ts; mo.geste = { t: 0, d: D / ts - 0.05 }; mo.bloqueT = Math.max(mo.bloqueT || 0, D / ts); mo.cd = Math.max(mo.cd || 0, D / ts + 0.3);
  if (!c0.wabPoingVu) { c0.wabPoingVu = true; toast(leNom(mo.d) + ' arme son poing : sors vite de la zone bleue !', 'alerte'); }
  zoneDanger({ mo, x: mo.x, z: mo.z, r: H.rPoing * e, a: a0, ouv: H.ouvPoing, duree: H.prepaPoing, couleur: COULEUR_CAC, effet: (d) => {
    mo.wabOccupe = false; const q = paysanMesh.position; if (combat !== c0 || c0.fin || mo.etat !== 'actif' || !dansDanger(d, q.x, q.z)) return;
    const z = q.clone(); z.y += 1.1; etoileImpact(z, 1.1); secousse(0.22, 0.3); const w = q.clone(); w.y += 2.1; chiffre('Coup de poing !', w, 'vol');
    if (blesserPerso(degWab(mo, c0.pvMax * H.poing), mo)) repousserPerso(mo, H.repousse); } });
}
/* des degats fixes (les montants de Mathieu) : blesserPerso les multiplie par le bonus de degats du palier, on le retire avant */
const degWab = (mo, v) => degatsFixes(v * ((mo && mo.wabPuissance) || 1)); /* (apres l'injection, sous 30 % : tous ses coups x1,25) */
const degatsFixes = (v) => { const c = combat; if (!c || c.raid) return Math.max(1, Math.round(v)); return Math.max(1, v / (multDegats(c.n) * multHautes(c.n, c.genre))); };
/* ---------------- ses coups automatiques ---------------- */
function capWabAutos(mo, ctx) {
  const K = mo.d.wabKit; if (!K || mo.etat !== 'actif') return; const A = K.autos, { pp, dt } = ctx;
  if (!mo.wabVie && K.vie) { mo.wabVie = true; const n = joueursWab(mo), v = Math.round(K.vie.base * coefJoueursLabo(n)); mo.pvMax = mo.pv = v; } /* (sa vie du donjon, selon le nombre de joueurs) */
  mo.deg = degWab(mo, ((combat && combat.pvMax) || 6000) * A.cac) / autoBoss(mo); /* (son coup au contact : mo.deg fois autoBoss, puis le bonus du palier dans blesserPerso ; 450 avant les resistances) */
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z), cac = mo.d.portee * (mo.allonge || 1) + 0.6;
  /* (26/11/2026 : il ne tirait que sans aucun sort en cours, donc presque jamais une fois ses sorts accelerés (au banc, changer sa portee ne changeait rien) ; ses tourelles
     tirent maintenant pendant ses autres sorts, sauf pendant la rafale qui les occupe) */
  if (mo.wabRafaleOn || dP <= cac || dP > A.portee || !osWab(mo)) { mo.wabTirT = Math.min(mo.wabTirT || 0, A.cadence * 0.6); return; } /* (revenu a portee de tir, il ne tire pas dans l'instant) */
  mo.wabTirT = (mo.wabTirT || 0) + dt; if (mo.wabTirT < (mo.wabPuissance && K.phase ? K.phase.cadenceTir : A.cadence)) return; mo.wabTirT = 0;
  mo.wabTirC = mo.wabTirC === 'G' ? 'D' : 'G'; tirAutoWab(mo, mo.wabTirC, A, combat);
}
function tirAutoWab(mo, c, A, c0) { /* une cawotte part le long du canon de la tourelle, puis retombe sur toi (elle te suit : un coup automatique touche toujours) */
  const { p, d } = boucheTourelle(mo, c), g = cawotteTir(); g.position.copy(p); scene.add(g); pouf(p.x, p.y, p.z, 0.6, '#d8c6a0');
  emettre(FX_LUM, 1, { x: p.x, y: p.y, z: p.z, vie: [0.08, 0.12], taille: [1.0, 0.3], c: ['#fff1a8', '#ff9a2e'], a: 0.9 });
  const P2 = new T.Vector3(), Q = new T.Vector3(), av = new T.Vector3(), dist = p.distanceTo(paysanMesh.position), P1 = p.clone().addScaledVector(d, Math.max(1.5, dist * 0.45)), duree = Math.max(0.45, dist / 13); let t = 0;
  effets.push((dt) => {
    if (combat !== c0 || c0.fin) { jeter(g); return true; }
    t += dt / duree; const k = Math.min(1, t), u = 1 - k; P2.copy(paysanMesh.position); P2.y += 0.9; av.copy(g.position);
    Q.copy(p).multiplyScalar(u * u).addScaledVector(P1, 2 * u * k).addScaledVector(P2, k * k); g.position.copy(Q); if (Q.distanceToSquared(av) > 1e-6) g.lookAt(Q.clone().multiplyScalar(2).sub(av));
    if (k >= 1) { jeter(g); pouf(P2.x, P2.y, P2.z, 1.0, '#ee7a26'); emettre(FX_VIF, 8, { x: P2.x, y: P2.y, z: P2.z, r: 0.1, dv: 3, haut: true, vie: [0.25, 0.4], taille: [0.1, 0.04], c: ['#ee7a26', '#5fae3a'], grav: 9, frein: 1.5 });
      if (mo.etat === 'actif' || mo.etat === 'mort') blesserPerso(degWab(mo, c0.pvMax * A.tir), mo); return true; }
    return false;
  });
}
/* ---------------- la main de manipulation et son serum (20/11/2026, « fais la main de manipulation avec le serum », Mathieu) ----------------
   Une zone bleue devant lui (0,8 s) pendant qu'il tend son bras mecanique ; dedans, il t'attrape, te souleve a bout de bras sur le cote, t'injecte son serum
   (400 degats en 10 s, et 20 % de vitesse en moins pendant ce temps), puis te jette. Hors de la zone, il referme la main sur le vide. Toutes les 8 s. */
function capWabSaisie(mo, ctx) {
  const K = mo.d.wabKit; if (!K || !K.saisie || mo.etat !== 'actif' || mo.geste || mo.wabOccupe) return; const G = K.saisie, { pp, sortPret } = ctx, e = mo.echelle || 1;
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('wabSaisieT', G.periode) || dP > G.R * e - 0.3 || !osWab(mo)) return;
  const an = mo.m.userData.anim, nom = an.F.saisie && an.F.saisie[0]; if (!nom) return;
  const c0 = combat, a = Math.atan2(pp.x - mo.x, pp.z - mo.z); mo.wabSaisieT = 0; mo.wabOccupe = true; mo.ry = a; mo.bloqueT = Math.max(mo.bloqueT || 0, G.prepa + 1.4); mo.cd = Math.max(mo.cd || 0, G.prepa + 1.5);
  const ac = jouerAnim(an, nom, 0.1), D = ac.getClip().duration; ac.timeScale = 0.48 / G.prepa; mo.geste = { t: 0, d: G.prepa + (D - 0.48) - 0.1 }; /* (la main se referme a la fin de l'annonce ; 0,48 s de son mouvement, image tenue du debut comprise) */
  if (!c0.wabSaisieVu) { c0.wabSaisieVu = true; toast(leNom(mo.d) + ' tend sa main mécanique : sors de la zone bleue, sinon il t\'attrape et t\'injecte son sérum !', 'alerte'); }
  zoneDanger({ mo, x: mo.x, z: mo.z, r: G.R * e, a, ouv: G.ouv, duree: G.prepa, couleur: COULEUR_CAC, effet: (d) => {
    const p = paysanMesh.position; ac.timeScale = 1;
    if (combat !== c0 || c0.fin || mo.etat !== 'actif' || !dansDanger(d, p.x, p.z) || c0.invincible > 0 || paysanMesh.userData.enVol) { mo.geste = { t: 0, d: 0.25 }; mo.wabOccupe = false; return; } /* (rate : il referme la main sur le vide et repart) */
    tenirWab(mo, G, c0);
  } });
}
function tenirWab(mo, G, c0) { /* il te tient a bout de bras : 0,6 s puis l'injection, puis il te jette a 1,25 s */
  const O = osWab(mo), W = MODELES.wabbenstein.userData.wab, u = paysanMesh.userData, bout = new T.Vector3(); let t = 0, pique = false;
  u.charge = true; chemin = []; arrivee = null; c0.assomme = Math.max(c0.assomme || 0, 1.3); const q0 = paysanMesh.position.clone(); q0.y += 2.1; chiffre('Saisi !', q0, 'vol');
  const lacher = (jeter) => { u.charge = false; const p = paysanMesh.position, cel = caseIci(p.x, p.z); u.y = hauteurSol(p.x, p.z, cel); p.y = u.y; if (cel) u.cellule = cel; mo.wabOccupe = false;
    if (jeter && combat === c0 && !c0.fin) { poussiere(p.x, u.y, p.z, 8, 1.0); repousserPerso(mo, G.jet); } };
  effets.push((dt) => {
    if (combat !== c0 || c0.fin || mo.etat !== 'actif') { lacher(false); return true; }
    t += dt; O.mG.updateMatrixWorld(true); bout.copy(W.axeMain).multiplyScalar(0.26).applyMatrix4(O.mG.matrixWorld);
    const p = paysanMesh.position, sol = hauteurSol(bout.x, bout.z, caseIci(bout.x, bout.z)); p.set(bout.x, Math.max(sol, bout.y - 1.5), bout.z); /* (tenu par le col, juste sous la main : le bras se voit au-dessus de lui) */ chemin = []; arrivee = null;
    paysanMesh.rotation.y = paysanMesh.userData.angle = Math.atan2(mo.x - p.x, mo.z - p.z);
    if (!pique && t >= 0.6) { pique = true; injecterWab(mo, G, c0); }
    if (t >= 1.25) { lacher(true); return true; }
    return false;
  });
}
function injecterWab(mo, G, c0) { /* le serum : 400 degats en 10 s (comme un poison, 40 par seconde) et 20 % de vitesse en moins les memes 10 s */
  const p = paysanMesh.position.clone(); p.y += 1.1; emettre(FX_VIF, 16, { x: p.x, y: p.y, z: p.z, r: 0.2, dv: 3, haut: true, vie: [0.3, 0.6], taille: [0.14, 0.04], c: ['#b6ff6a', '#5fe03a', '#e8ffd0'], grav: 6, frein: 1.4 }); etoileImpact(p, 0.8, '#7cff5a');
  if (combat !== c0 || c0.fin || c0.invincible > 0) return;
  (c0.poisons = c0.poisons || []).push({ pct: G.degats * (mo.wabPuissance || 1) / G.duree / c0.pvMax, t: G.duree, serumWab: true });
  c0.serumLentJusque = performance.now() + G.duree * 1000; c0.serumLent = G.lent;
  const q = paysanMesh.position.clone(); q.y += 2.4; chiffre('Sérum !', q, 'vol'); auraSerum(c0, G.duree);
  if (!c0.wabSerumVu) { c0.wabSerumVu = true; toast('Le sérum du Docteur : ' + G.degats + ' dégâts en ' + G.duree + ' s, et ' + Math.round(G.lent * 100) + ' % de vitesse en moins pendant ce temps.', 'alerte'); }
}
function auraSerum(c0, duree) { /* un anneau vert sous tes pieds tant que le serum agit */
  const r = new T.Mesh(new T.RingGeometry(0.6, 0.8, 32), fxMat('#7cff5a', 0.8)); r.rotation.x = -Math.PI / 2; r.material.blending = T.AdditiveBlending; sansClic(r); scene.add(r); let t = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || t >= duree) { scene.remove(r); r.geometry.dispose(); r.material.dispose(); return true; }
    const q = paysanMesh.position; r.position.set(q.x, solA(q.x, q.z) + 0.09, q.z); r.rotation.z -= dt * 2.5; r.material.opacity = 0.8 * Math.min(1, (duree - t) / 0.4);
    if (Math.random() < dt * 6) emettre(FX_VIF, 1, { x: q.x, y: q.y + 0.4, z: q.z, r: 0.45, v: [0, 1.4, 0], dv: 0.3, vie: [0.5, 0.8], taille: [0.1, 0.02], c: ['#d8ffb0', '#5fe03a'] }); return false; });
}
CAPACITES.unshift(capWabHarpon, capWabRafale, capWabSaisie, capWabAutos);
/* ---------------- sous 30 % : ses creatures, puis sa derniere creation (20/11/2026, « fais la phase sous 30 % maintenant », Mathieu ; le kit : « sous 30 %,
   il libere des creatures mutantes et s'injecte sa derniere creation, qui le rend surpuissant » ; puis « 4 Gwand Wabbits toutes les 20 secondes ») ----------------
   Invulnerable le temps de la scene (4,6 s) : il ecarte les bras et appelle (des Wabbits transmutes sortent de terre autour de lui), puis une seringue verte
   apparait dans sa main mecanique, il se la plante dans le cou, convulse, grossit, s'illumine de vert et rugit. Ensuite, surpuissant : tous ses coups x1,25,
   25 % plus rapide, la rage du jeu (coups 1,7 fois plus rapides, sorts 1,3 fois plus frequents), une cawotte de tourelle toutes les 1,5 s au lieu de 2.
   Ses creatures sont ses invocations : elles tombent avec lui (« a sa mort, les cages s'ouvrent, les Wabbits sont liberes »). */
/* (25/11/2026, « plutot que de le voir invoquer des Wabbits garous, j'aimerais qu'il aille courir et appuyer sur un bouton de son tableau de bord, et un monstre
   qui etait dans la cuve sort, un Wabbit garou geant genetiquement modifie et booste, qui combat en meme temps que le boss, qui lui s'injecte la seringue », Mathieu) :
   sous 30 %, invulnerable, il court a son pupitre (dans son labo ; a l'Arene dev, un pupitre et une cuve sortent du sol), appuie sur le gros bouton, l'alarme
   rougit les ecrans, la cuve ou flotte le garou geant eclate et le garou en sort (GEANT_WAB) ; puis il s'injecte sa seringue (injectionWab, la scene d'avant sans
   ses creatures). Plus de vagues de garous toutes les 20 s. Le garou geant est sa creature : il tombe avec lui (capWabLibere) */
function capWabPhase(mo, ctx) {
  const K = mo.d.wabKit, P = K && K.phase; if (!P || mo.wabPhase || mo.etat !== 'actif' || mo.wabOccupe || mo.pv >= mo.pvMax * P.seuil) return;
  const an = mo.m.userData.anim, c0 = combat; if (!an || !osWab(mo)) return; mo.wabPhase = 'scene'; mo.wabOccupe = true; mo.wabInvuln = true; mo.rugiRage = true; /* (sa rage arrive avec l'injection, sans le rugissement du jeu) */
  coursePupitreWab(mo, P, c0);
}
function injectionWab(mo, P, c0) {
  const an = mo.m.userData.anim; if (combat !== c0 || c0.fin || mo.etat !== 'actif' || !an) { mo.wabInvuln = false; mo.wabOccupe = false; return; }
  const nomA = null, nomI = an.F.injection && an.F.injection[0], dI = nomI ? an.A[nomI].getClip().duration : 3, dA = 0.05, tot = dA + dI;
  mo.bloqueT = Math.max(mo.bloqueT || 0, tot); mo.cd = Math.max(mo.cd || 0, tot); const pp = paysanMesh.position; mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z);
  if (nomA) { const a = jouerAnim(an, nomA, 0.15); a.timeScale = a.getClip().duration / dA; } mo.geste = { t: 0, d: tot };
  toast(leNom(mo.d) + ' s\'injecte sa dernière création !', 'alerte'); son('vague');
  const e0 = mo.echelle || 1, h0 = mo.haut || 3.6, O = osWab(mo), cou = mo.m.getObjectByName('tete'), W = MODELES.wabbenstein.userData.wab, vert = new T.Color('#1e5a0e');
  let t = 0, sortis = false, ser = null, pique = false, jete = null, aura = false;
  effets.push((dt) => {
    if (combat !== c0 || c0.fin || mo.etat !== 'actif') { mo.wabInvuln = false; mo.wabOccupe = false; if (ser) jeter(ser); if (jete) jeter(jete.g); return true; }
    t += dt; const ti = t - dA;
    if (!sortis) sortis = true; /* (plus de creatures sorties de terre : le garou geant de la cuve, coursePupitreWab) */
    if (ti >= 0 && !ser && !pique && nomI) { const a = jouerAnim(an, nomI, 0.12); a.timeScale = 1; ser = seringueWab(); scene.add(ser); }
    if (ser) { /* la seringue dans la main, pointee vers son cou ; le serum se vide apres la piqure */
      O.mG.updateMatrixWorld(true); const bout = W.axeMain.clone().multiplyScalar(0.26).applyMatrix4(O.mG.matrixWorld), c = cou.getWorldPosition(new T.Vector3()), d = c.clone().sub(bout); d.y *= 0.4; d.normalize();
      const dist = c.distanceTo(bout), sc = Math.max(1.1 * e0, Math.min(1.9 * e0, dist / 0.78)), coup = ti < 0.5 ? 0 : ti < 0.65 ? (ti - 0.5) / 0.15 : 1; /* (assez grande pour que l'aiguille atteigne son cou ; elle s'y enfonce a la piqure) */
      ser.position.copy(bout).addScaledVector(d, (0.05 + 0.14 * coup) * sc); ser.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d); ser.scale.setScalar(sc);
      const k = Math.max(0, Math.min(1, (ti - 0.65) / 0.8)); ser.userData.liq.scale.y = Math.max(0.05, 1 - k); ser.userData.liq.position.y = 0.28 * k; ser.userData.pis.position.y = 0.45 * k; /* (le piston pousse vers l'aiguille, le serum se vide de son cote) */
      if (!pique && ti >= 0.65) { pique = true; const p = c.clone(); emettre(FX_VIF, 22, { x: p.x, y: p.y, z: p.z, r: 0.2, dv: 4, haut: true, vie: [0.4, 0.7], taille: [0.16, 0.05], c: ['#e8ffd0', '#7dff5a', '#2fd12f'], grav: 5, frein: 1.2 }); flashLumiere(p.x, p.y, p.z, '#7dff5a', 4, 8, 0.4); secousse(0.12, 0.3); chiffre('Injection !', p.clone().setY(p.y + 1.2), 'vol'); }
      if (ti >= 1.6) { jete = { g: ser, v: new T.Vector3((Math.random() - 0.5) * 3, 3.5, (Math.random() - 0.5) * 3), t: 0 }; ser = null; } }
    if (jete) { jete.t += dt; jete.v.y -= 12 * dt; jete.g.position.addScaledVector(jete.v, dt); jete.g.rotation.x += dt * 9; jete.g.rotation.z += dt * 5;
      if (jete.t > 0.7 || jete.g.position.y < solA(jete.g.position.x, jete.g.position.z)) { pouf(jete.g.position.x, solA(jete.g.position.x, jete.g.position.z), jete.g.position.z, 1.0, '#cfe8d0'); jeter(jete.g); jete = null; } }
    if (pique) { const k = Math.max(0, Math.min(1, (ti - 0.65) / 1.2)), g = k * k * (3 - 2 * k); mo.echelle = e0 * (1 + (P.taille - 1) * g); mo.haut = h0 * (1 + (P.taille - 1) * g); mo.m.scale.setScalar(mo.echelle);
      an.lueur = vert.clone().multiplyScalar(g * (0.45 + 0.12 * Math.sin(t * 9))); /* (une lueur discrete : plus forte, l'orange de l'armure virait au jaune) */ an.peau.forEach((m) => { if (m.emissive) m.emissive.copy(an.lueur); });
      if (!aura && ti >= 1.75) { aura = true; const d0 = mo.d; mo.d = Object.assign({}, d0, { element: 'poison' }); auraRageCorps(mo); mo.d = d0; secousse(0.22, 0.5); onde(mo.x, solA(mo.x, mo.z) + 0.05, mo.z, 6 * e0, '#7dff5a', 0.5, 0.8); } }
    if (t >= tot) { /* surpuissant */
      mo.wabInvuln = false; mo.wabOccupe = false; mo.wabPhase = 'surpuissant'; mo.enrage = true; mo.wabPuissance = P.puissance; mo.vitM = (mo.vitM || 1) * P.vitesse; if (ser) jeter(ser);
      toast(leNom(mo.d) + ' est surpuissant : ses coups font plus mal, il est plus rapide et frappe bien plus souvent !', 'alerte'); lueurWab(mo, c0); return true; }
    return false;
  });
}
function libererCreatures(mo, P, c0) { /* ses creatures sortent de terre en arc devant lui (transmutees, ses invocations) ; jamais plus de P.max en vie */
  const j = joueursWab(mo), L = P.creatures.concat(Array(Math.floor((j - 1) / 2) * (P.parDeuxJoueurs || 0)).fill(P.creatures[0])), max = P.max + (P.maxParJoueur || 0) * (j - 1);
  const vivantes = combat.monstres.filter((o) => o.invoqueur === mo.id && o.etat !== 'mort').length, n = Math.max(0, Math.min(L.length, max - vivantes)), e0 = mo.echelle || 1;
  L.slice(0, n).forEach((ty, i) => { if (!MONSTRES[ty]) return; const a = mo.ry + Math.PI * (0.35 + 1.3 * i / Math.max(1, n - 1)), r = 3.6 * e0, q = pointValide(mo.x, mo.z, mo.x + Math.sin(a) * r, mo.z + Math.cos(a) * r);
    setTimeout(() => { if (combat !== c0 || c0.fin || mo.etat !== 'actif') return; pouf(q.x, solA(q.x, q.z), q.z, 2.0, '#7dff5a'); apparaitre(ty, { x: q.x, z: q.z, apres: (o) => { o.invoqueur = mo.id; o.invoque = true; o.wabCreature = true; if (typeof transmuter === 'function') transmuter(o); if (c0.pvMax) o.deg = Math.max(1, Math.round(c0.pvMax * CREATURE_WAB_PART)); } }); /* (leurs coups en part de tes PV max, 22/11/2026 : voir CREATURE_WAB_PART) */ combat.total++; }, i * 180); });
  return n;
}
/* surpuissant : une nouvelle vague de creatures toutes les 20 s ; il les appelle bras ecartes (1,2 s), quand il n'est pas en plein sort */
function capWabRenforts(mo, ctx) {
  const P = mo.d.wabKit && mo.d.wabKit.phase; if (!P || !P.vagues || mo.wabPhase !== 'surpuissant' || mo.etat !== 'actif') return; /* (vagues : plus de garous toutes les 20 s depuis le 25/11/2026, le garou geant de la cuve les remplace) */
  mo.wabRenfortT = (mo.wabRenfortT || 0) + ctx.dt; if (mo.wabRenfortT < P.vague || mo.wabOccupe || mo.geste) return; mo.wabRenfortT = 0;
  const c0 = combat, vivantes = combat.monstres.filter((o) => o.invoqueur === mo.id && o.etat !== 'mort').length; if (vivantes >= P.max + (P.maxParJoueur || 0) * (joueursWab(mo) - 1)) return;
  const an = mo.m.userData.anim, nomA = an && an.F.appel && an.F.appel[0]; if (nomA) { const a = jouerAnim(an, nomA, 0.15); a.timeScale = a.getClip().duration / 1.2; mo.geste = { t: 0, d: 1.2 }; mo.bloqueT = Math.max(mo.bloqueT || 0, 1.2); }
  setTimeout(() => { if (combat === c0 && !c0.fin && mo.etat === 'actif') { libererCreatures(mo, P, c0); if (!c0.wabRenfortVu) { c0.wabRenfortVu = true; toast(leNom(mo.d) + ' libère de nouvelles créatures : toutes les 20 s tant qu\'il est debout !', 'alerte'); } } }, 450);
}
function lueurWab(mo, c0) { /* la lueur verte qui pulse, jusqu'a sa mort */
  const an = mo.m.userData.anim, vert = new T.Color('#1e5a0e'); let t = 0;
  effets.push((dt) => { if (combat !== c0 || c0.fin || mo.etat === 'mort') return true; t += dt; an.lueur = vert.clone().multiplyScalar(0.45 + 0.12 * Math.sin(t * 4)); if (!(an.eclat > 0)) an.peau.forEach((m) => { if (m.emissive) m.emissive.copy(an.lueur); }); return false; });
}
let GEO_SER = null;
function seringueWab() { /* une grosse seringue : le corps en verre, le serum vert, le piston de laiton, l'aiguille ; elle pointe vers +Y */
  if (!GEO_SER) { GEO_SER = { verre: new T.CylinderGeometry(0.12, 0.12, 0.62, 14), liq: new T.CylinderGeometry(0.095, 0.095, 0.56, 12), aig: new T.CylinderGeometry(0.012, 0.02, 0.34, 6), embout: new T.CylinderGeometry(0.05, 0.1, 0.1, 12),
      tige: new T.CylinderGeometry(0.025, 0.025, 0.5, 6), pouce: new T.CylinderGeometry(0.13, 0.13, 0.04, 14), ailes: new T.BoxGeometry(0.42, 0.04, 0.12),
      mv: new T.MeshToonMaterial({ color: '#dff7ea', gradientMap: grad, transparent: true, opacity: 0.45, depthWrite: false }), ml: new T.MeshBasicMaterial({ color: '#6dff3a' }), ma: mat('#c9c4b8'), mo: mat('#c9a050') };
    partager(...Object.values(GEO_SER)); }
  const G = GEO_SER, g = new T.Group(), liq = new T.Mesh(G.liq, G.ml), verre = new T.Mesh(G.verre, G.mv), aig = new T.Mesh(G.aig, G.ma), emb = new T.Mesh(G.embout, G.ma), pis = new T.Group(), tige = new T.Mesh(G.tige, G.mo), pouce = new T.Mesh(G.pouce, G.mo), ailes = new T.Mesh(G.ailes, G.mo);
  aig.position.y = 0.53; emb.position.y = 0.36; ailes.position.y = -0.3; tige.position.y = -0.25; pouce.position.y = -0.5; pis.add(tige, pouce); pis.position.y = 0; g.add(liq, verre, aig, emb, ailes, pis); g.userData = { liq, pis };
  g.traverse((o) => { o.raycast = () => {}; }); return g;
}
/* invulnerable pendant la scene */
const blesserWabP = blesser; blesser = function (mo, n) { if (mo && mo.wabInvuln && mo.etat === 'actif') { if (!((mo.wabInvT || 0) > performance.now())) { mo.wabInvT = performance.now() + 450; const p = mo.m.position.clone(); p.y += (mo.haut || 3.6) * 0.8; chiffre('Invulnérable', p); } return; } return blesserWabP.apply(this, arguments); };
/* a sa mort, ses creatures sont liberees (« a sa mort, les cages s'ouvrent, les Wabbits sont liberes ») : un nuage vert, elles disparaissent */
function capWabLibere(mo) {
  if (!mo.wabCreature || mo.etat !== 'actif' || !combat) return; const inv = combat.monstres.find((o) => o.id === mo.invoqueur); if (inv && inv.etat !== 'mort') return;
  const y = mo.m.position.y; pouf(mo.x, y + 0.4, mo.z, 1.8, '#7dff5a'); emettre(FX_VIF, 10, { x: mo.x, y: y + 0.6, z: mo.z, r: 0.3, dv: 2, haut: true, vie: [0.4, 0.7], taille: [0.12, 0.04], c: ['#e8ffd0', '#7dff5a'], grav: -1, frein: 1 });
  chiffre('Libéré !', new T.Vector3(mo.x, y + (mo.haut || 1.6) + 0.4, mo.z), 'vol'); mo.pv = 0; mo.etat = 'mort'; mo.t = 0; mo.m.visible = false; if (mo.barre) mo.barre.remove(); if (combat.cible === mo) combat.cible = null;
}
CAPACITES.unshift(capWabPhase, capWabLibere, capWabRenforts);

/* ---------------- le pupitre et la cuve du garou geant (25/11/2026) ---------------- */
const PUPITRE_WAB = { course: 4.6, maxCourse: 3.4, appui: 0.75, alarme: 0.55 };
const GEANT_WAB = { pv: 3, deg: 1.6, taille: 2.6, /* (pv : « un peu trop de vie », Mathieu, 26/11/2026 : 4 avant) */ /* (26/11/2026, « il est tout petit, faudrait qu'il soit plus grand, et fais grossir le truc dans lequel il est enferme », Mathieu : 1,75 avant ; sa cuve suit, CUVE_ECH) */ vit: 1.2, nom: 'Garou géant (sa dernière création)' }; /* (vie et coups d'un garou du labo fois 4 et 1,6 : 150 000 PV au niveau 100, 30 % de la vie du Docteur ; 75 % plus grand, 20 % plus rapide) */
function lieuxPupitreWab(mo) { /* ou sont son pupitre et la cuve du garou : dans son labo, ceux de la salle ; ailleurs (l'Arene dev), a cote de lui */
  if (typeof lieu !== 'undefined' && lieu === 'donjon' && typeof SALLES_LABO !== 'undefined' && mo.lab && mo.lab.mode === 'salle' && mo.lab.i === 4) {
    const S = SALLES_LABO[4], cx = DONJON.x + S.x, cz = DONJON.z + S.z, F = ENTREE_SALLE + Math.PI, P2 = (ar, r) => ({ x: cx + Math.cos(F + ar) * r, z: cz + Math.sin(F + ar) * r });
    const poste = P2(-0.38, S.R - 3.3), bouton = P2(-0.38, S.R - 2.0), cuve = P2(0.78, S.R - 2.0 - 2.2 * CUVE_ECH()); /* (la cuve agrandie reste loin du mur, 26/11/2026) */ return { poste, bouton, cuve, y: Y_SALLE, labo: true };
  }
  const pp = paysanMesh.position, d = Math.hypot(mo.x - pp.x, mo.z - pp.z) || 1, ux = (mo.x - pp.x) / d, uz = (mo.z - pp.z) / d; /* (a l'oppose du perso) */
  const poste = pointValide(mo.x, mo.z, mo.x + ux * 5, mo.z + uz * 5), bouton = { x: poste.x + ux * 1.3, z: poste.z + uz * 1.3 }, cuve = pointValide(poste.x, poste.z, poste.x - uz * 4.2, poste.z + ux * 4.2);
  return { poste, bouton, cuve, y: solA(poste.x, poste.z), labo: false };
}
const CUVE_ECH = () => GEANT_WAB.taille / 1.75; /* (la cuve et le garou dedans, a la taille du garou geant : faite pour 1,75) */
function cuveGeantWab(x, y, z, a) { /* la cuve de verre ou flotte le garou geant, endormi, qui luit vert */
  const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(CUVE_ECH());
  const cuivre = new T.MeshLambertMaterial({ color: '#b8743a' }), verre = new T.MeshLambertMaterial({ color: '#9fffd2', transparent: true, opacity: 0.24, depthWrite: false }), jus = new T.MeshBasicMaterial({ color: '#5dff7a', transparent: true, opacity: 0.18, depthWrite: false });
  const socle = new T.Mesh(new T.CylinderGeometry(2.0, 2.2, 0.55, 26), cuivre); socle.position.y = 0.27; g.add(socle);
  const cap = new T.Mesh(new T.CylinderGeometry(1.85, 2.0, 0.5, 26), cuivre); cap.position.y = 5.55; g.add(cap);
  const tube = new T.Mesh(new T.CylinderGeometry(1.8, 1.8, 4.85, 30, 1, true), verre); tube.position.y = 2.95; tube.renderOrder = 4; g.add(tube);
  const liq = new T.Mesh(new T.CylinderGeometry(1.72, 1.72, 4.6, 26), jus); liq.position.y = 2.9; liq.renderOrder = 3; g.add(liq);
  [1.4, 4.4].forEach((yy) => { const r = new T.Mesh(new T.TorusGeometry(1.83, 0.08, 6, 30), cuivre); r.rotation.x = Math.PI / 2; r.position.y = yy; g.add(r); });
  for (let k = 0; k < 2; k++) { const tu = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 1.4, 8), cuivre); tu.position.set((k ? 0.6 : -0.6), 6.4, 0); g.add(tu); }
  /* le garou, vegetatif (25/11/2026, « le mob depasse du verre, mets-le dans une autre forme, comme s'il etait vegetatif », Mathieu : sans mouvement, il restait en
     pose de liaison, bras ecartes a travers le verre) : affaisse, la tete basse, les bras le long du corps, il respire tres lentement ; deux tuyaux le branchent au toit */
  try { const m = clonerSquelette('wab-garou'); if (m) { m.scale.multiplyScalar(0.92); m.position.set(0, 0.85, 0); m.rotation.set(0.16, a, 0, 'YXZ'); m.traverse((q) => { q.raycast = () => {}; if (q.isMesh && q.material) { q.material = q.material.clone(); if (q.material.emissive) { q.material.emissive.set('#2fd12f'); q.material.emissiveIntensity = 0.3; } } }); g.add(m); g.userData.garou = m;
      const clips = (MODELES['wab-garou'] && MODELES['wab-garou'].userData.clips) || [], cl = clips.find((c) => /^repos/.test(c.name)) || clips.find((c) => /^touche/.test(c.name));
      if (cl) { const mx = new T.AnimationMixer(m), ac = mx.clipAction(cl); ac.play(); ac.timeScale = 0.18; mx.update(0.4); g.userData.mixer = mx; }
      const tuyau = new T.MeshLambertMaterial({ color: '#4d7a3a' }); [-0.45, 0.45].forEach((dx) => { const c = new T.CatmullRomCurve3([new T.Vector3(dx * 0.9, 5.3, 0.1), new T.Vector3(dx * 1.3, 4.6, 0.35), new T.Vector3(dx * 0.7, 3.55, 0.42)]), tu = new T.Mesh(new T.TubeGeometry(c, 12, 0.06, 6), tuyau); g.add(tu); }); } } catch (e) { /* (sans modele : la cuve seule) */ }
  g.traverse((q) => { q.raycast = q.raycast || (() => {}); }); scene.add(g);
  g.userData.bulles = setInterval(() => { if (!g.parent) { clearInterval(g.userData.bulles); return; } if (enPause || typeof emettre !== 'function') return; emettre(FX_LUM, 1, { x: x + (Math.random() - 0.5) * 2.6 * CUVE_ECH(), y: y + 0.8, z: z + (Math.random() - 0.5) * 2.6 * CUVE_ECH(), r: 0.05, v: [0, 1.4, 0], dv: 0.15, vie: [1.8, 2.6], taille: [0.14, 0.05], c: ['#c8ffd8', '#7dff5a'], a: 0.6, frein: 0 });
    if (g.userData.garou) g.userData.garou.position.y = 0.85 + 0.1 * Math.sin(performance.now() / 650); if (g.userData.mixer) g.userData.mixer.update(0.12); }, 120);
  return g;
}
function pupitreArene(x, y, z, a) { /* a l'Arene dev : un pupitre de fer a ecrans et gros bouton rouge, sorti du sol */
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = a; const fer = new T.MeshLambertMaterial({ color: '#4a4c52' }), ecran = new T.MeshBasicMaterial({ color: '#4dff8a' }), rouge = new T.MeshBasicMaterial({ color: '#ff2a2a' });
  const b = new T.Mesh(new T.BoxGeometry(2.4, 1.1, 0.8), fer); b.position.y = 0.55; g.add(b); const h = new T.Mesh(new T.BoxGeometry(2.4, 1.4, 0.25), fer); h.position.set(0, 1.75, -0.28); g.add(h);
  for (let k = 0; k < 3; k++) { const e = new T.Mesh(new T.PlaneGeometry(0.62, 0.5), ecran); e.position.set(-0.75 + k * 0.75, 1.85, -0.14); g.add(e); g.userData.ecrans = (g.userData.ecrans || []).concat(e); }
  const bt = new T.Mesh(new T.CylinderGeometry(0.16, 0.18, 0.12, 14), rouge); bt.position.set(0, 1.16, 0.12); g.add(bt); g.userData.bouton = bt;
  g.traverse((q) => { q.raycast = () => {}; }); scene.add(g); pouf(x, y, z, 2.2, '#c9c4b8'); return g;
}
/* au moment du combat dans son labo, la cuve est deja la (ouvrirSalleLabo) */
let CUVE_WAB = null;
window.addEventListener('DOMContentLoaded', () => { if (typeof ouvrirSalleLabo !== 'function') return; const ouvrirSalleLaboW = ouvrirSalleLabo; ouvrirSalleLabo = function (i) { const r = ouvrirSalleLaboW.apply(this, arguments); /* (29c se charge apres ce fichier : on l'enveloppe une fois toute la page lue) */
  if (i === 4) setTimeout(() => { try { if (CUVE_WAB) { clearInterval(CUVE_WAB.userData.bulles); scene.remove(CUVE_WAB); } const L = lieuxPupitreWab({ lab: { mode: 'salle', i: 4 } }), S = SALLES_LABO[4]; CUVE_WAB = cuveGeantWab(L.cuve.x, L.y, L.cuve.z, Math.atan2(DONJON.x + S.x - L.cuve.x, DONJON.z + S.z - L.cuve.z)); } catch (e) { /* rien */ } }, 450);
  return r; }; });
function coursePupitreWab(mo, P, c0) {
  const an = mo.m.userData.anim, L = lieuxPupitreWab(mo), nomC = (an.F.course && an.F.course[0]) || (an.F.marche && an.F.marche[0]), nomB = an.F.coup && an.F.coup[0];
  toast(leNom(mo.d) + ' court à son pupitre !', 'alerte'); son('vague');
  let pupitre = null, cuve = L.labo && CUVE_WAB && CUVE_WAB.parent ? CUVE_WAB : null;
  if (!L.labo) { const a = Math.atan2(mo.x - L.poste.x, mo.z - L.poste.z); pupitre = pupitreArene(L.bouton.x, L.y, L.bouton.z, a); }
  const pret = chargerSquelettes(['wab-garou']).catch(() => {}).then(() => { if (!cuve && combat === c0) { cuve = cuveGeantWab(L.cuve.x, solA(L.cuve.x, L.cuve.z), L.cuve.z, Math.atan2(mo.x - L.cuve.x, mo.z - L.cuve.z)); pouf(L.cuve.x, solA(L.cuve.x, L.cuve.z), L.cuve.z, 2.6, '#7dff5a'); } });
  if (nomC) { const a = jouerAnim(an, nomC, 0.15); a.timeScale = Math.min(3, PUPITRE_WAB.course / ((ALLURES.wabbenstein && ALLURES.wabbenstein.course) || 1.4)); } mo.geste = { t: 0, d: 30 };
  let t = 0, etape = 'course', te = 0, garou = false;
  const fin = () => { if (pupitre) { setTimeout(() => { if (pupitre.parent) { pouf(pupitre.position.x, pupitre.position.y, pupitre.position.z, 2.0, '#c9c4b8'); scene.remove(pupitre); } }, 2500); } };
  effets.push((dt) => {
    if (combat !== c0 || c0.fin || mo.etat !== 'actif') { mo.wabInvuln = false; mo.wabOccupe = false; mo.geste = null; fin(); return true; }
    t += dt; mo.bloqueT = Math.max(mo.bloqueT || 0, 0.2); mo.cd = Math.max(mo.cd || 0, 0.5);
    if (etape === 'course') {
      const dx = L.poste.x - mo.x, dz = L.poste.z - mo.z, d = Math.hypot(dx, dz), pas = Math.min(d, PUPITRE_WAB.course * dt);
      if (d > 0.15) { mo.x += dx / d * pas; mo.z += dz / d * pas; mo.ry = Math.atan2(dx, dz); if (L.labo && typeof bornerDonjon === 'function') { const q = bornerDonjon(mo.x, mo.z, 0.9, mo.lab); mo.x = q[0]; mo.z = q[1]; } }
      if (d <= 0.3 || t > PUPITRE_WAB.maxCourse) { etape = 'appui'; te = 0; mo.ry = Math.atan2(L.bouton.x - mo.x, L.bouton.z - mo.z); if (nomB) { const a = jouerAnim(an, nomB, 0.1); a.timeScale = a.getClip().duration / PUPITRE_WAB.appui; } } }
    else if (etape === 'appui') { te += dt;
      if (te >= PUPITRE_WAB.appui * 0.55 && !mo.wabClic) { mo.wabClic = true; const y = (L.y || 0) + 1.25; emettre(FX_VIF, 14, { x: L.bouton.x, y, z: L.bouton.z, r: 0.15, dv: 3, haut: true, vie: [0.3, 0.5], taille: [0.1, 0.03], c: ['#ffffff', '#ff6a6a', '#ff2a2a'], grav: 6 }); flashLumiere(L.bouton.x, y + 0.8, L.bouton.z, '#ff3030', 5, 9, 0.5); chiffre('Clic !', new T.Vector3(L.bouton.x, y + 1.2, L.bouton.z), 'vol'); son('impactFleche', undefined, 2, 600);
        if (pupitre) pupitre.userData.ecrans.forEach((e) => e.material = new T.MeshBasicMaterial({ color: '#ff3030' })); toast('Alarme ! La cuve du fond se met à bouillonner…', 'alerte'); }
      if (te >= PUPITRE_WAB.appui) { etape = 'cuve'; te = 0; } }
    else if (etape === 'cuve') { te += dt;
      if (cuve && te < PUPITRE_WAB.alarme) { cuve.position.x = L.cuve.x + Math.sin(te * 60) * 0.05; } /* (la cuve tremble) */
      if (te >= PUPITRE_WAB.alarme && !garou) { garou = true; pret.then(() => sortirGeantWab(mo, L, cuve, c0)); etape = 'injection'; mo.geste = null; mo.wabClic = false; fin(); injectionWab(mo, P, c0); return true; } }
    return false; });
}
function sortirGeantWab(mo, L, cuve, c0) { /* la cuve eclate : eclats de verre, flot vert ; le garou geant en sort et se bat */
  if (combat !== c0 || c0.fin) return; const x = L.cuve.x, z = L.cuve.z, y = cuve ? cuve.position.y : solA(x, z);
  if (cuve) { clearInterval(cuve.userData.bulles); scene.remove(cuve); if (cuve === CUVE_WAB) CUVE_WAB = null; }
  const kC = CUVE_ECH(); emettre(FX_VIF, 46, { x, y: y + 2.6 * kC, z, r: 1.4 * kC, dv: 7, haut: true, vie: [0.5, 0.9], taille: [0.16, 0.05], c: ['#e8fff4', '#b8ffe0', '#ffffff'], grav: 12, frein: 0.6, sol: y + 0.04, rebond: 0.3 });
  emettre(FX_LUM, 36, { x, y: y + 0.3, z, r: 1.6, v: [0, 0.7, 0], dv: 3.2, vie: [0.8, 1.4], taille: [0.5, 0.12], c: ['#7dff5a', '#3fd14a'], a: 0.75, frein: 0.4 });
  flashLumiere(x, y + 2 * kC, z, '#7dff5a', 6, 12, 0.6); secousse(0.45, 0.7); onde(x, y + 0.05, z, 5.5 * kC, '#7dff5a', 0.5, 0.8); son('vague', null, 2);
  toast('La cuve éclate : le Garou géant, sa dernière création, en sort !', 'alerte');
  if (!MONSTRES.wabGarou) return;
  apparaitre('wabGarou', { x, z, apres: (o) => { if (typeof transmuter === 'function') transmuter(o); if (typeof grandirMutant === 'function') grandirMutant(o, GEANT_WAB, '#7dff5a', GEANT_WAB.nom);
    o.invoqueur = mo.id; o.invoque = true; o.wabCreature = true; o.aggro = true; o.vitM = (o.vitM || 1) * GEANT_WAB.vit; o.ry = Math.atan2(paysanMesh.position.x - x, paysanMesh.position.z - z);
    if (L.labo) { o.lab = { mode: 'salle', i: 4 }; o.salle = 4; o.y = Y_SALLE; if (o.dep) { o.dep.x = x; o.dep.z = z; o.dep.y = Y_SALLE; } } } }); combat.total++;
}
