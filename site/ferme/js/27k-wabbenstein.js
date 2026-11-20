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
SQUELETTES_A_CHARGER.push(['wabbenstein', 'assets/modeles/jeu/wabbenstein-anime.glb', 3.6]); ALLURES.wabbenstein = { marche: 0.635, course: 1.39 };
const KIT_WAB = {
  rafale: { periode: 11, prepa: 0.6, R: 9.5, ouv: 0.42, cadence: 0.12, vitesse: 15, pct: 0.02, toucher: 0.65 }, /* (pct : 2 % des PV max du perso par cawotte) */
  autos: { cac: 450, tir: 245, portee: 5 * S, cadence: 2.0 }, /* (portee : 5 cases) */
  saisie: { periode: 8, prepa: 0.8, R: 2.2 * S, ouv: 0.7, degats: 400, duree: 10, lent: 0.2, jet: 2.0 }, /* (le serum, Mathieu, 20/11 : « 400 degats + un malus de 20 % de vitesse de deplacement, degats pendant 10 s », toutes les 8 s : 400 en 10 s, 40 par seconde, et -20 % de vitesse les memes 10 s) */
  harpon: { periode: 9, prepa: 0.6, min: 2 * S, max: 8 * S, R: 8 * S + 1, /* (de 2 a 8 cases, « 2 a 8 cases pour le harpon, vas-y », Mathieu, 20/11 ; R : la ligne, un peu au-dela) */ larg: 1.1, vitesse: 34, retour: 26, impact: 1400, tire: 0.28, poing: 570, prepaPoing: 0.7, rPoing: 3.4, ouvPoing: 0.85, repousse: 2.2, toucher: 0.6 }, /* (toucher : la moitie de la ligne rouge, 0,55, et un peu de corps : hors de la ligne, il te manque) */
};
MONSTRES.wabbenstein = { element: 'terre', nom: 'Docteur Wabbenstein', modele: 'wabbenstein', icone: 'wabbenstein', boss: true, stable: true,
  desc: 'le savant fou du Laboratoire de la Cawotte, dans son armure : ses deux tourelles crachent des rafales de cawottes en éventail (2 % de tes PV par cawotte), et son harpon t\'attrape de loin (1 400), te ramène contre lui et arme un coup de poing (570) : 0,7 s pour sortir de la zone. Ses coups normaux : 450 au contact, et jusqu\'à 5 cases une cawotte de ses tourelles toutes les 2 s (245). Sa main mécanique t\'attrape et t\'injecte son sérum : 400 dégâts en 10 s et 20 % de vitesse en moins',
  pv: () => 60000, deg: () => 112, cadence: 1.6, vitesse: 2.0, portee: 3.0, ombre: 4.0, degSort: 3.2, wabKit: KIT_WAB };
GROUPES_DEV.wabbenstein = { nom: 'Docteur Wabbenstein (donjon, essai)', liste: { wabbenstein: 1 } };
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
      if (!c0.fin) blesserPerso(degatsFixes(c0.pvMax * R.pct), mo); return true; }
    if (s > L) { jeter(g); pouf(x, solA(x, z), z, 0.7, '#ee7a26'); return true; } return false;
  });
}
function capWabRafale(mo, ctx) {
  const K = mo.d.wabKit; if (!K || mo.etat !== 'actif' || mo.geste || mo.wabOccupe) return; const R = K.rafale, { pp, sortPret } = ctx;
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('wabRafaleT', R.periode) || dP > R.R - 0.5 || !osWab(mo)) return;
  const an = mo.m.userData.anim, dS = an.A[NOMS_TOURELLES[0]].getClip().duration, dR = 3 * an.A[NOMS_TOURELLES[1]].getClip().duration, dE = an.A[NOMS_TOURELLES[2]].getClip().duration;
  const c0 = combat, a = Math.atan2(pp.x - mo.x, pp.z - mo.z), tot = dS + dR + dE; mo.wabRafaleT = 0; mo.wabOccupe = true; mo.ry = a; mo.bloqueT = Math.max(mo.bloqueT || 0, tot); mo.cd = Math.max(mo.cd || 0, tot);
  if (!c0.wabRafaleVu) { c0.wabRafaleVu = true; toast(leNom(mo.d) + ' sort ses tourelles : sors de l\'éventail rouge, une rafale de cawottes arrive !', 'alerte'); }
  zoneDanger({ mo, x: mo.x, z: mo.z, r: R.R, a, ouv: R.ouv, duree: dS + dR, effet: () => {} });
  tourellesWab(mo, 'sortie'); let t = 0, phase = 'sortie'; const pret = { G: 0, D: R.cadence / 2 };
  effets.push((dt) => {
    t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') { if (combat === c0 && mo.etat !== 'mort') tourellesWab(mo, 'rentree'); else if (an) NOMS_TOURELLES.forEach((n) => { if (an.A[n]) an.A[n].stop(); }); mo.wabOccupe = false; return true; } /* (mort en pleine rafale : les tourelles retombent en V au lieu de tourner sur son corps) */
    mo.ry = a;
    if (phase === 'sortie' && t >= dS) { phase = 'rafale'; t = 0; tourellesWab(mo, 'rafale'); }
    else if (phase === 'rafale') { for (const c of ['G', 'D']) { pret[c] -= dt; if (pret[c] <= 0) { pret[c] += R.cadence; tirerCawotte(mo, c, R, c0); } }
      if (t >= dR) { phase = 'rentree'; t = 0; tourellesWab(mo, 'rentree'); } }
    else if (phase === 'rentree' && t >= dE) { mo.wabOccupe = false; return true; }
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
          const q = p.clone(); q.y += 2.1; chiffre('Harponné !', q, 'vol'); etoileImpact(pointe, 0.8); blesserPerso(degatsFixes(H.impact), mo); c0.assomme = Math.max(c0.assomme || 0, H.tire); /* (retenu le temps d'etre ramene seulement : le coup de poing s'esquive) */
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
    if (blesserPerso(degatsFixes(H.poing), mo)) repousserPerso(mo, H.repousse); } });
}
/* des degats fixes (les montants de Mathieu) : blesserPerso les multiplie par le bonus de degats du palier, on le retire avant */
const degatsFixes = (v) => { const c = combat; if (!c || c.raid) return Math.max(1, Math.round(v)); return Math.max(1, v / (multDegats(c.n) * multHautes(c.n, c.genre))); };
/* ---------------- ses coups automatiques ---------------- */
function capWabAutos(mo, ctx) {
  const K = mo.d.wabKit; if (!K || mo.etat !== 'actif') return; const A = K.autos, { pp, dt } = ctx;
  mo.deg = degatsFixes(A.cac) / autoBoss(mo); /* (son coup au contact : mo.deg fois autoBoss, puis le bonus du palier dans blesserPerso ; 450 avant les resistances) */
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z), cac = mo.d.portee * (mo.allonge || 1) + 0.6;
  if (mo.wabOccupe || mo.geste || dP <= cac || dP > A.portee || !osWab(mo)) { mo.wabTirT = Math.min(mo.wabTirT || 0, A.cadence * 0.6); return; } /* (revenu a portee de tir, il ne tire pas dans l'instant) */
  mo.wabTirT = (mo.wabTirT || 0) + dt; if (mo.wabTirT < A.cadence) return; mo.wabTirT = 0;
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
      if (mo.etat === 'actif' || mo.etat === 'mort') blesserPerso(degatsFixes(A.tir), mo); return true; }
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
  (c0.poisons = c0.poisons || []).push({ pct: G.degats / G.duree / c0.pvMax, t: G.duree, serumWab: true });
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
