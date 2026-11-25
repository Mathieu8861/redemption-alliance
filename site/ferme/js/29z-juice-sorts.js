'use strict';
/* LES SORTS « JUICY » (25/11/2026, « je voulais surtout ameliorer aussi la qualite de certains sorts », Mathieu ; au formulaire : « Fleches enflammees » d'abord).
   Chaque sort reste en version dev (seulement dans le mode test) tant que Mathieu ne l'a pas valide ; SORTS_OUVERTS : ceux ouverts a tous
   (JUICE_SORTS.force : true / false pour comparer avant et apres dans les essais).
   Les recettes viennent des videos (IDEES-JUICE.md) : la boule de feu (charge, coeur chaud, trainee, eclat, reaction, ce qui reste en feu, cendres a la mort),
   les pics de glace (le sol qui se fend), les regles du dessin anime (anticipation, etirement, arcs, temps fort). Rien ne change aux degats ni au moment ou ils tombent.

   FLECHES ENFLAMMEES (l'ulti de zone du Cra) : la fleche de feu touche (29w-juice-cra.js), puis
   - l'explosion centrale : un eclair blanc, un temps fort (arret sur image), un anneau de feu qui balaie toute la zone, le sol qui se fend en braises,
     une gerbe d'etincelles qui monte au ciel (c'est elle qui « appelle » la pluie) ;
   - les monstres de la zone blanchissent, s'ecrasent, puis brulent un instant (des flammes leur courent dessus) ;
   - la pluie : chaque fleche tombe en arc (elle accelere en tombant), etiree par la vitesse, la pointe en boule de feu, une trainee de flammes et de fumee ;
     une cible se resserre au sol sous elle juste avant qu'elle arrive ;
   - chaque impact : un eclat, des braises qui rebondissent, une petite boule de feu, une brulure, un petit coup sourd ; la fleche reste plantee et brule ;
   - un monstre tue par le sort part en braises et en cendres (pas les boss ni les demi-boss, leur corps reste au sol). */
const JUICE_SORTS = { force: null };
const SORTS_OUVERTS = new Set(['flammes', 'givre']); /* (les Fleches enflammees puis le givre ouverts a tous le 25/11/2026, « ouvre-le aux joueurs », Mathieu) */
const juiceSort = (id) => (JUICE_SORTS.force != null ? JUICE_SORTS.force : SORTS_OUVERTS.has(id) || (typeof MODE_TEST !== 'undefined' && !!MODE_TEST));
const JS_FEU = { n: 9, depart: 0.14, chute: 0.3, ecart: 0.045, haut: 6, plantee: 1.4, brule: 1.3, arret: 0.07 };

/* des flammes qui courent sur un monstre un instant */
function monstreEnFeu(mo, duree) {
  if (!mo || !mo.m) return; const h = mo.haut || 1.5, R = Math.max(0.3, Math.min(1.2, h * 0.32)), an = mo.m.userData.anim; let t = 0, acc = 0, teinte = false;
  const fin = () => { if (teinte && an) an.eclat = Math.max(an.eclat || 0, 1e-4); }; /* (la couleur d'origine revient a l'image suivante, 22c-squelettes.js) */
  effets.push((dt) => { t += dt; if (!mo.m || mo.etat !== 'actif' || t >= duree) { fin(); return true; } const f = 1 - t / duree; acc += dt * 46 * f;
    if (an && an.peau && t > 0.18 && !(an.eclat > 0) && !(mo.flashB > 0)) { teinte = true; const g = f * (0.75 + 0.25 * Math.sin(t * 30)); an.peau.forEach((m) => { if (!m.emissive) return; const b0 = m.emissiveMap ? 1 : 0; m.emissive.setRGB(b0 + 0.55 * g, b0 + 0.16 * g, b0); }); } /* (il rougeoie en brulant) */
    while (acc >= 1) { acc -= 1; const a = fxAlea() * Math.PI * 2, d = R * Math.sqrt(fxAlea()), y = mo.m.position.y + h * fxEntre(0.15, 0.85);
      emettre(FX_VIF, 1, { x: mo.x + Math.cos(a) * d, y, z: mo.z + Math.sin(a) * d, v: [0, 1.8, 0], dv: 0.35, vie: [0.28, 0.45], taille: [0.42, 0.06], c: ['#ffd25a', '#ff6a12', '#c8300a'], a: 1, frein: 1.2 }); }
    if (fxAlea() < 0.25) emettre(FX_FUM, 1, { x: mo.x, y: mo.m.position.y + h * 0.9, z: mo.z, r: R * 0.6, v: [0, 1.1, 0], vie: [0.5, 0.8], taille: [0.25, 0.8], c: ['#4a3c34', '#8a8078'], a: 0.3, entree: 0.2 });
    return false; });
}

/* la cible qui se resserre au sol sous une fleche qui tombe */
function cibleSol(x, y, z, duree) {
  const m = new T.Mesh(GEO_ANNEAU_S, fxMat('#ff6a12', 0)); m.rotation.x = -Math.PI / 2; m.position.set(x, y + 0.06, z); m.renderOrder = 4;
  fxVie(m, duree, (k) => { m.scale.setScalar(1.0 - 0.75 * k); m.material.opacity = 0.9 * Math.min(1, k * 3); m.material.color.lerpColors(new T.Color('#ff6a12'), new T.Color('#ffd25a'), k); });
}

/* une fleche plantee dans le sol, qui brule puis s'eteint */
function flecheSolBrule(p, dir) {
  const g = new T.Group(), fut = boite(0.04, 0.04, 0.6, '#3a2418'); fut.position.z = -0.18; g.add(fut);
  for (const s of [-1, 1]) { const pl = boite(0.14, 0.006, 0.12, '#e8d8c0'); pl.position.set(0, 0, -0.42); pl.rotation.z = s * 0.8; g.add(pl); }
  g.position.copy(p); g.lookAt(p.clone().add(dir)); g.traverse((o) => { o.raycast = () => {}; }); scene.add(g);
  const queue = new T.Vector3(); let t = 0, acc = 0;
  effets.push((dt) => { t += dt; if (!g.parent) return true; const k = t / JS_FEU.plantee; if (k >= 1) { jeter(g); return true; }
    if (k > 0.75) g.scale.setScalar(1 - (k - 0.75) / 0.25);
    acc += dt * 30 * (1 - k); g.updateMatrixWorld(); queue.set(0, 0, -0.04).applyMatrix4(g.matrixWorld); /* (le feu au pied de la fleche, la ou elle est entree) */
    while (acc >= 1) { acc -= 1; emettre(FX_VIF, 1, { x: queue.x, y: queue.y, z: queue.z, r: 0.1, v: [0, 1.5, 0], dv: 0.3, vie: [0.28, 0.45], taille: [0.36, 0.05], c: ['#ffd25a', '#ff6a12', '#c8300a'], a: 1, frein: 1.2 }); }
    return false; });
}

/* une fleche de la pluie : elle tombe en arc, s'etire, sa pointe brule, et elle s'embrase en touchant le sol */
function flecheDePluie(X, Y, Z, venue, retard, son_) {
  const vers = new T.Vector3(X, Y + 0.12, Z), de = new T.Vector3(X - venue.x * 2.2, Y + JS_FEU.haut, Z - venue.z * 2.2);
  const fl = new T.Group(), fut = boite(0.07, 0.07, 0.85, '#ff6a12'); fut.position.z = -0.27; fl.add(fut);
  const coeur = new T.Mesh(new T.IcosahedronGeometry(0.15, 1), new T.MeshBasicMaterial({ color: '#ffd25a' })); coeur.position.z = 0.18; fl.add(coeur);
  fl.visible = false; fl.traverse((o) => { o.raycast = () => {}; }); scene.add(fl);
  const pos = (k, o) => o.set(de.x + (vers.x - de.x) * k, de.y + (vers.y - de.y) * k * k, de.z + (vers.z - de.z) * k); /* (elle accelere en tombant : un arc, pas un trait droit) */
  const prec = new T.Vector3(), suiv = new T.Vector3(), bout = new T.Vector3(); let t = -retard, cible = false;
  effets.push((dt) => { t += dt; if (!cible && t > -0.02) { cible = true; cibleSol(X, Y, Z, JS_FEU.chute + 0.02); }
    if (t < 0) return false; const k = Math.min(1, t / JS_FEU.chute);
    if (!fl.visible) { fl.visible = true; pos(0, fl.position); }
    prec.copy(fl.position); pos(k, fl.position); pos(Math.min(1, k + 0.05), suiv); if (k < 1) fl.lookAt(suiv);
    fl.scale.set(1, 1, 1 + 0.7 * k); fl.updateMatrixWorld(); bout.set(0, 0, 0.18).applyMatrix4(fl.matrixWorld);
    emettre(FX_LUM, 1, { x: bout.x, y: bout.y, z: bout.z, vie: [0.05, 0.06], taille: [0.95, 0.5], c: ['#fff3c4', '#ff7a1e'], a: 0.9 }); emettre(FX_VIF, 3, { x: bout.x, y: bout.y, z: bout.z, r: 0.06, v: [0, 0.8, 0], dv: 0.6, vie: [0.2, 0.35], taille: [0.3, 0.06], c: ['#fff3b0', '#ff8a1e', '#b0280e'], a: 0.95 }); /* (la pointe en boule de feu, les flammes de la trainee du jeu) */
    if (fxAlea() < 0.3) emettre(FX_FUM, 1, { x: bout.x, y: bout.y, z: bout.z, v: [0, 0.9, 0], vie: [0.4, 0.6], taille: [0.2, 0.6], c: ['#5a4a42', '#8a8078'], a: 0.22, entree: 0.2 }); /* (un peu de fumee seulement : en continu, elle laissait des colonnes grises) */
    for (let i = 0; i < 3; i++) { const q = (i + 0.5) / 3, x = prec.x + (bout.x - prec.x) * q, y = prec.y + (bout.y - prec.y) * q, z = prec.z + (bout.z - prec.z) * q;
      emettre(FX_VIF, 1, { x, y, z, r: 0.04, v: [0, 0.7, 0], dv: 0.4, vie: [0.18, 0.32], taille: [0.34, 0.05], c: ['#ffd25a', '#ff6a12', '#b0280e'], a: 1 });
      emettre(FX_LUM, 1, { x, y, z, vie: [0.12, 0.18], taille: [0.5, 0.15], c: ['#ffb84a', '#ff5a1e'], a: 0.5 }); }
        if (k < 1) return false;
    const dir = vers.clone().sub(prec).normalize(), p = new T.Vector3(X, Y + 0.15, Z); jeter(fl);
    etoileImpact(p, 0.75, '#ff7a1e'); boule(X, Y + 0.25, Z, 0.45, ['#ffb02e', '#e8541e', '#7a1e0a'], false); brulure(X, Y, Z, 0.7); onde(X, Y, Z, 1.0, '#ffb04a', 0.3, 0.7);
    emettre(FX_VIF, 12, { x: X, y: Y + 0.2, z: Z, r: 0.08, dv: 4.5, haut: true, vie: [0.4, 0.8], taille: [0.07, 0.02], c: ['#fff1a8', '#ff8a1e', '#8a1e0a'], grav: 9, frein: 1, etire: 0.03, sol: Y + 0.04, rebond: 0.35 }); /* (des braises qui rebondissent) */
    flecheSolBrule(new T.Vector3(X, Y + 0.05, Z).addScaledVector(dir, -0.05), dir); secousse(0.05, 0.12);
    if (son_) son('impactFleche', undefined, -3, -500 + hasardCents(150));
    return true; });
}

function pluieFlechesFeuJuicy(x, y, z, r) {
  const c = new T.Vector3(x, y + 0.4, z), pp = paysanMesh.position, L = Math.hypot(x - pp.x, z - pp.z) || 1, venue = { x: (x - pp.x) / L, z: (z - pp.z) / L }; /* (la volee vient du cote du Cra) */
  /* l'explosion centrale */
  arretImage(JS_FEU.arret); secousse(0.16, 0.4); flashLumiere(x, y + 1, z, '#ff8a2e', 4, r * 3, 0.6);
  emettre(FX_LUM, 1, { x, y: y + 0.5, z, vie: [0.13, 0.15], taille: [r * 1.4, r * 2], c: ['#ffffff', '#ffd38a'], a: 0.9, entree: 0.01 });
  boule(x, y + 0.3, z, 0.9, ['#ffb02e', '#e8541e', '#7a1e0a'], true); onde(x, y, z, r + 0.4, '#fff3c4', 0.28, 0.9); onde(x, y, z, r + 0.2, '#ff6a1e', 0.55, 0.8); solFendu(x, y, z, r * 0.85, true);
  emettre(FX_VIF, 30, { x, y: y + 0.3, z, r: 0.2, v: [0, 9, 0], dv: 2.2, vie: [0.25, 0.5], taille: [0.1, 0.02], c: ['#ffffff', '#ffd36a', '#ff6a1e'], grav: 4, frein: 0.8, etire: 0.05 }); /* (la gerbe qui monte au ciel : elle appelle la pluie) */
  son('impactFleche', undefined, 4, -900 + hasardCents(60));
  /* les monstres de la zone : blancs, ecrases, puis en feu ; ceux que le sort tue partent en cendres (on le voit a l'image suivante, apres les degats) */
  const zone = combat ? combat.monstres.filter((o) => o.etat === 'actif' && Math.hypot(o.x - x, o.z - z) <= r) : [];
  zone.forEach((mo) => { reactionJuicy(mo, true); flashSansSquelette(mo); monstreEnFeu(mo, JS_FEU.brule); });
  effets.push(() => { zone.forEach((o) => { if (o.etat === 'mort' && o.d && !o.d.boss && !o.d.demi && o.m && o.m.visible) desintegrer(o); }); return true; });
  /* la pluie */
  for (let i = 0; i < JS_FEU.n; i++) { const a = i * 2.39996 + fxAlea() * 0.5, d = r * 0.92 * Math.sqrt((i + 0.5) / JS_FEU.n), X = x + Math.cos(a) * d, Z = z + Math.sin(a) * d, cel = caseIci(X, Z), Y = cel ? posCase(cel).y : solA(X, Z);
    flecheDePluie(X, Y, Z, venue, JS_FEU.depart + i * JS_FEU.ecart, i % 2 === 0); }
}
{ const pluieJS = pluieFlechesFeu; pluieFlechesFeu = function (x, y, z, r) { if (!juiceSort('flammes')) return pluieJS.apply(this, arguments); return pluieFlechesFeuJuicy(x, y, z, r); }; }

/* LE GIVRE (25/11/2026, « fais le givre », Mathieu) : l'ulti de gel des trois classes (Fleche glacee, Epee de givre, Fouet de givre), d'apres la video des
   pics de glace. « Le givre gele sans trembler » (23/10/2026) : ni secousse ni explosion, seulement un temps fort tres court (l'image qui « gele »).
   - un eclair froid, l'image qui se fige un instant, un craquement de glace et des tintements de cristal ;
   - un bouquet de grands pics au centre, penches vers l'exterieur, qui jaillissent en depassant un peu leur taille puis se posent ;
   - des rangees de pics qui courent du centre jusqu'au bord de la zone, de plus en plus petits et penches, avec de petits pics sur les cotes ;
   - le sol gele sous la vague (une plaque de givre qui s'etend et un trait de glace le long de chaque rangee) ;
   - chaque monstre de la zone blanchit, un petit bouquet de glace se referme a ses pieds quand la vague l'atteint, et il reste bleu de givre tant qu'il
     est ralenti (5 s), en perdant des flocons ;
   - les pics fondent par le haut puis eclatent en eclats qui rebondissent ; la neige tombe, la brume roule, des paillettes scintillent.
   Tous les pics sont dessines d'un seul coup (un seul objet a instances) : une centaine de pics ne coute qu'un dessin. */
const JS_GEL = { rayons: 7, pas: 0.42, vitesse: 11, tenue: 0.8, fonte: 0.35, arret: 0.05 };
const GEO_GLACE = (() => { const g = new T.ConeGeometry(0.17, 1, 5, 1); g.translate(0, 0.5, 0); partager(g); return g; })();
let MAT_GLACE = null;
function matGlace() { if (!MAT_GLACE) { MAT_GLACE = new T.MeshPhongMaterial({ color: '#ffffff', emissive: '#2f74b0', emissiveIntensity: 0.45, specular: '#ffffff', shininess: 90, flatShading: true, transparent: true, opacity: 0.93 }); partager(MAT_GLACE); } return MAT_GLACE; }
const AXE_Y = new T.Vector3(0, 1, 0);

/* des pics de glace : L = [{ x, y, z, h (hauteur), s (largeur), q (penche), t0 (quand il jaillit) }] */
function picsDeGlace(L) {
  if (!L.length) return; const im = new T.InstancedMesh(GEO_GLACE, matGlace(), L.length); im.frustumCulled = false; im.renderOrder = 5; im.raycast = () => {};
  const c = new T.Color(), M = new T.Matrix4(), S = new T.Vector3(), P = new T.Vector3(), haut = new T.Vector3(); L.forEach((p, i) => { c.set(i % 4 === 0 ? '#ffffff' : i % 2 ? '#9ad2f5' : '#c4e8ff'); im.setColorAt(i, c); }); /* (plus bleus : en blanc pale, ils disparaissaient sur le sable) */
  const fin = Math.max(...L.map((p) => p.t0)) + JS_GEL.tenue + JS_GEL.fonte + 0.05; scene.add(im); let t = 0;
  const pose = () => { L.forEach((p, i) => { const u = t - p.t0; let sy = 1e-4, sx = 1e-4;
      if (u > 0 && !p.eclate) { const pousse = Math.min(1, u / 0.09), dep = pousse < 1 ? pousse * 1.18 : 1.18 - 0.18 * Math.min(1, (u - 0.09) / 0.08), fonte = Math.max(0, (u - JS_GEL.tenue) / JS_GEL.fonte); /* (il jaillit en depassant un peu sa taille, puis se pose ; il fond par le haut) */
        sy = p.h * dep * (1 - 0.75 * Math.min(1, fonte)); sx = p.s * (0.7 + 0.3 * pousse) * (1 - 0.35 * Math.min(1, fonte));
        if (fonte >= 1) { p.eclate = true; sy = sx = 1e-4; haut.set(0, p.h * 0.2, 0).applyQuaternion(p.q); /* les eclats */
          emettre(FX_VIF, 3, { x: p.x + haut.x, y: p.y + haut.y, z: p.z + haut.z, r: 0.06 * p.s, dv: 2.4, haut: true, vie: [0.35, 0.6], taille: [0.08, 0.03], c: ['#ffffff', '#cfeeff', '#8fc8ee'], grav: 9, frein: 1, etire: 0.02, sol: p.y + 0.04, rebond: 0.3 });
          if (i % 4 === 0) emettre(FX_FUM, 1, { x: p.x, y: p.y + 0.2, z: p.z, vie: [0.5, 0.8], taille: [0.25, 0.7], c: ['#f2fbff', '#d6efff'], a: 0.4, entree: 0.1 }); } }
      S.set(sx, sy, sx); P.set(p.x, p.y, p.z); M.compose(P, p.q, S); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; };
  pose(); effets.push((dt) => { t += dt; pose(); if (t >= fin) { jeter(im); return true; } return false; });
}

/* un monstre pris dans le givre : bleu tant qu'il est ralenti, des flocons qui tombent de lui */
function monstreGivre(mo) {
  if (!mo || !mo.m) return; const an = mo.m.userData.anim, h = mo.haut || 1.5, R = Math.max(0.3, Math.min(1.2, h * 0.32)); let t = 0, teinte = false;
  const fin = () => { if (teinte && an) an.eclat = Math.max(an.eclat || 0, 1e-4); };
  effets.push((dt) => { t += dt; if (!mo.m || mo.etat !== 'actif' || (t > 0.3 && !(mo.lent > 0))) { fin(); return true; } const f = t < 0.3 ? 1 : Math.min(1, mo.lent / 0.5);
    if (an && an.peau && t > 0.16 && !(an.eclat > 0) && !(mo.flashB > 0)) { teinte = true; an.peau.forEach((m) => { if (!m.emissive) return; const b0 = m.emissiveMap ? 1 : 0; m.emissive.setRGB(b0 + 0.1 * f, b0 + 0.3 * f, b0 + 0.55 * f); }); }
    if (fxAlea() < dt * 9) emettre(FX_VIF, 1, { x: mo.x + (fxAlea() - 0.5) * R * 2, y: mo.m.position.y + h * fxEntre(0.3, 0.9), z: mo.z + (fxAlea() - 0.5) * R * 2, v: [0, -0.5, 0], dv: 0.2, vie: [0.6, 1.0], taille: [0.06, 0.04], c: ['#ffffff', '#d6f0ff'], a: 0.95, grav: 0.6, frein: 1 });
    if (fxAlea() < dt * 5) emettre(FX_LUM, 1, { x: mo.x + (fxAlea() - 0.5) * R * 2, y: mo.m.position.y + h * fxEntre(0.2, 1), z: mo.z + (fxAlea() - 0.5) * R * 2, vie: [0.2, 0.3], taille: [0.25, 0.02], c: ['#ffffff', '#bfe6ff'], a: 0.9 }); /* (une paillette) */
    return false; });
}

/* le sol qui gele sous la vague : une plaque de givre qui s'etend, un trait de glace le long de chaque rangee */
function solGele(x, y, z, r, angles) {
  const d = r / JS_GEL.vitesse, vie = d + JS_GEL.tenue + JS_GEL.fonte + 0.4, g = new T.Group(), plaque = new T.Mesh(GEO_DISQUE, fxMat('#e8f6ff', 0)), bord = new T.Mesh(new T.RingGeometry(0.9, 1, 48), fxMat('#9fd8ff', 0));
  plaque.rotation.x = bord.rotation.x = -Math.PI / 2; plaque.renderOrder = 2; bord.renderOrder = 3; g.add(plaque, bord);
  const traits = angles.map((a) => { const b = new T.Group(), m = new T.Mesh(GEO_TRAIT_SOL, fxMat('#ffffff', 0)); m.renderOrder = 3; b.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)); b.add(m); g.add(b); return m; });
  g.position.set(x, y + 0.05, z); fxVie(g, vie, (k) => { const t = k * vie, e = Math.min(1, t / d), R = 0.3 + (r - 0.3) * (1 - Math.pow(1 - e, 2)), a = t < vie - 0.5 ? 1 : (vie - t) / 0.5;
    plaque.scale.setScalar(R); plaque.material.opacity = 0.5 * a; bord.scale.setScalar(R); bord.material.opacity = 0.8 * a * (e < 1 ? 1 : Math.max(0, 1 - (t - d) / 0.4));
    traits.forEach((m) => { m.scale.set(0.14, 1, R); m.position.z = R / 2; m.material.opacity = 0.75 * a; }); });
}

function explosionGelJuicy(x, y, z, r) {
  const L = [], q = (a, th) => new T.Quaternion().setFromAxisAngle(new T.Vector3(Math.sin(a), 0, -Math.cos(a)), th).multiply(new T.Quaternion().setFromAxisAngle(AXE_Y, fxAlea() * 6.28)); /* (penche vers a, tourne sur lui-meme au hasard) */
  const sol = (px, pz) => { const cel = caseIci(px, pz); return cel ? posCase(cel).y : solA(px, pz); };
  const pic = (px, pz, h, s, a, th, t0) => L.push({ x: px, y: sol(px, pz) - 0.05, z: pz, h, s, q: q(a, th), t0 });
  /* le temps fort : un eclair froid, l'image qui se fige, la glace qui craque */
  arretImage(JS_GEL.arret); flashLumiere(x, y + 1, z, '#9fd8ff', 3, r * 3, 0.5); son('glace');
  emettre(FX_LUM, 1, { x, y: y + 0.6, z, vie: [0.14, 0.16], taille: [r * 1.1, r * 1.7], c: ['#ffffff', '#bfe6ff'], a: 0.85, entree: 0.01 });
  /* le bouquet du centre */
  pic(x, z, 2.6, 2, 0, 0.05, 0); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + fxAlea() * 0.4; pic(x + Math.cos(a) * 0.25, z + Math.sin(a) * 0.25, fxEntre(1.6, 2.3), 1.8, a, fxEntre(0.35, 0.6), 0.015 * i); }
  /* les rangees qui courent jusqu'au bord, de plus en plus petites et penchees, avec de petits pics sur les cotes */
  const angles = []; for (let k = 0; k < JS_GEL.rayons; k++) { const a = k / JS_GEL.rayons * 6.283 + fxAlea() * 0.5; angles.push(a);
    for (let d = 0.75, j = 0; d <= r * 0.98; d += JS_GEL.pas * fxEntre(0.85, 1.15), j++) { const f = d / r, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, t0 = d / JS_GEL.vitesse;
      pic(px, pz, fxEntre(0.85, 1.15) * (1.7 - 1.0 * f), 1.5 - 0.5 * f, a, 0.25 + 0.35 * f, t0);
      if (j % 2 === 1) for (const sg of [-1, 1]) { const b = a + sg * Math.PI / 2; pic(px + Math.cos(b) * 0.24, pz + Math.sin(b) * 0.24, 0.45 + 0.25 * (1 - f), 0.8, a + sg * 1.0, 0.8, t0 + 0.02); } } }
  /* les monstres de la zone : blancs, ecrases, un bouquet de glace a leurs pieds quand la vague arrive, puis bleus de givre tant qu'ils sont ralentis */
  const zone = combat ? combat.monstres.filter((o) => o.etat === 'actif' && Math.hypot(o.x - x, o.z - z) <= r) : [];
  zone.forEach((mo) => { reactionJuicy(mo, true); flashSansSquelette(mo); monstreGivre(mo); const t0 = Math.hypot(mo.x - x, mo.z - z) / JS_GEL.vitesse, R = Math.max(0.35, Math.min(1, (mo.haut || 1.5) * 0.3));
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + fxAlea() * 0.5; pic(mo.x + Math.cos(a) * R, mo.z + Math.sin(a) * R, fxEntre(0.8, 1.2), 1.1, a, fxEntre(0.45, 0.7), t0 + 0.02); } });
  picsDeGlace(L); solGele(x, y, z, r, angles);
  /* le givre dans l'air : la brume qui roule, la neige qui tombe, des paillettes */
  emettre(FX_FUM, 16, { x, y: y + 0.15, z, r: r * 0.4, plat: true, dv: r * 1.2, vie: [1.1, 1.6], taille: [0.6, 1.8], c: ['#f2fbff', '#cfeaff'], a: 0.55, frein: 2.5, vrot: 0.6, entree: 0.15 });
  emettre(FX_VIF, 40, { x, y: y + 2.6, z, r: r * 0.85, plat: true, v: [0, -0.9, 0], dv: 0.25, vie: [1.2, 1.8], taille: [0.07, 0.05], c: ['#ffffff', '#e2f4ff'], a: 0.95, frein: 0.4 });
  emettre(FX_LUM, 30, { x, y: y + 0.5, z, r, v: [0, 0.6, 0], dv: 1, vie: [0.6, 1.2], taille: [0.1, 0.02], c: ['#ffffff', '#bfe6ff'], a: 1, frein: 1 });
}
{ const gelJS = explosionGel; explosionGel = function (x, y, z, r) { if (!juiceSort('givre')) return gelJS.apply(this, arguments); return explosionGelJuicy(x, y, z, r); }; }

/* LES COUPS FATALS (25/11/2026, « fais les coups fatals », Mathieu) : Fleche fatale (Cra), Colere de Iop, Morsure du Dragoeuf (Osamodas), d'apres la video
   des coups facon anime (IDEES-JUICE.md). A l'image du contact : le jeu se fige, une image en silhouettes noires sur fond blanc, une image en negatif,
   des traits d'eclat en pointes depuis le point d'impact, puis un zoom brutal qui revient avec la couleur ; les sorts eux-memes sont refaits plus bas. En plus :
   - la cible blanchit, s'ecrase et recule fort (a l'image) ; tuee (hors boss et demi-boss), elle eclate en braises et en cendres ;
   - les chiffres sautent en arc, gros et dores ;
   Les images en silhouette et en negatif et le zoom ne se jouent pas en graphismes legers, ni si le systeme demande moins d'animations. */
const JS_FATAL = { arret: 0.11, silhouette: 45, negatif: 45, zoom: 1.16, retour: 320, lignes: 240, recul: 0.9 };
const animationsReduites = () => { try { return fxLeger() || matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return fxLeger(); } };

/* les traits d'eclat en pointes, dessines par-dessus le jeu au point d'impact */
function traitsEclat(p, couleur) {
  const zone = (combat && $('combat-zone')) || document.body, s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), N = 16, R0 = 55, R1 = 360; /* (moins nombreux et plus courts : 22 traits jusqu'a 430 px couvraient tout l'ecran) */ let d = '';
  for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2 + (Math.random() - 0.5) * 0.2, l = R1 * (0.55 + Math.random() * 0.45), w = 0.03 + Math.random() * 0.035, r0 = R0 * (0.8 + Math.random() * 0.6);
    d += 'M' + (Math.cos(a - w) * r0).toFixed(1) + ' ' + (Math.sin(a - w) * r0).toFixed(1) + 'L' + (Math.cos(a) * l).toFixed(1) + ' ' + (Math.sin(a) * l).toFixed(1) + 'L' + (Math.cos(a + w) * r0).toFixed(1) + ' ' + (Math.sin(a + w) * r0).toFixed(1) + 'Z'; }
  s.setAttribute('viewBox', '-450 -450 900 900'); Object.assign(s.style, { position: 'absolute', width: '900px', height: '900px', marginLeft: '-450px', marginTop: '-450px', pointerEvents: 'none', zIndex: '5' });
  s.innerHTML = '<path d="' + d + '" fill="#ffffff" stroke="' + couleur + '" stroke-width="4" stroke-linejoin="round"/>'; zone.appendChild(s); versEcran(p, s);
  const t0 = performance.now(), pas = () => { const k = (performance.now() - t0) / JS_FATAL.lignes; if (k >= 1 || !s.isConnected) { s.remove(); return; }
    versEcran(p, s); s.style.transform = 'scale(' + (0.65 + 0.65 * (1 - Math.pow(1 - k, 3))).toFixed(3) + ')'; s.style.opacity = String(k < 0.35 ? 1 : (1 - k) / 0.65); requestAnimationFrame(pas); };
  requestAnimationFrame(pas);
}

/* le temps fort facon anime : image figee, silhouettes, negatif, puis zoom qui revient (en temps reel : l'image figee ralentit le jeu, pas ceci) */
let FATAL_ANIME = false;
function tempsFortAnime(p, couleur) {
  arretImage(JS_FATAL.arret); traitsEclat(p, couleur);
  if (animationsReduites() || FATAL_ANIME) return; FATAL_ANIME = true;
  const cv = rendu.domElement, f0 = cv.style.filter || '', t0 = performance.now(), fin = () => { camera.zoom = 1; camera.updateProjectionMatrix(); cv.style.filter = f0; FATAL_ANIME = false; };
  const pas = () => { try { const t = performance.now() - t0, tz = t - JS_FATAL.silhouette - JS_FATAL.negatif;
      cv.style.filter = t < JS_FATAL.silhouette ? 'grayscale(1) contrast(8)' : tz < 0 ? 'invert(1)' : f0;
      if (tz >= JS_FATAL.retour) { fin(); return; } camera.zoom = tz < 0 ? JS_FATAL.zoom : 1 + (JS_FATAL.zoom - 1) * Math.pow(1 - tz / JS_FATAL.retour, 3); camera.updateProjectionMatrix(); requestAnimationFrame(pas); }
    catch (e) { fin(); } };
  pas();
}

/* la cible : blanche, ecrasee, repoussee fort ; tuee, elle eclate en braises et en cendres */
function cibleFatale(C, de) {
  const mo = C.mo; if (!mo) return; const d = new T.Vector3(mo.x - de.x, 0, mo.z - de.z); if (d.lengthSq() < 1e-6) d.set(0, 0, 1); d.normalize();
  reactionJuicy(mo, true); flashSansSquelette(mo);
  if (mo.etat === 'actif' && mo.pv > 0) reculVisuel(mo, d, JS_FATAL.recul);
  else if (mo.etat === 'mort' && mo.d && !mo.d.boss && !mo.d.demi && mo.m && mo.m.visible) desintegrer(mo);
}

/* LES SORTS EUX-MEMES (25/11/2026, « les effets sont bien, mais les sorts en eux-memes bof, la fleche, les crocs et le Iop je sais meme pas ce que c'est ;
   ce serait bien une epee qui tombe du ciel, et pour les autres je te laisse trouver une bonne idee, une belle realisation bien propre », Mathieu) :
   - Colere de Iop : le Iop lance une colonne de lumiere au ciel, un sceau dore s'ouvre sous la cible, une epee geante tombe du ciel et s'y plante (le sol se
     fend, la poussiere roule), elle vibre, reste plantee un instant puis s'efface sur place en paillettes d'or ;
   - Fleche fatale : un tir de precision ; une mire rouge se resserre et se verrouille sur la cible pendant que la fleche se charge, puis une grande fleche
     spectrale part en ligne droite, tres vite, dans un faisceau rouge, et traverse la cible ;
   - Morsure du Dragoeuf : l'Osamodas fait claquer son fouet au sol, un portail de feu s'ouvre, un dragon de feu en jaillit (tete faite en code, long corps
     de flammes), s'eleve, plonge sur la cible gueule ouverte et la referme dessus, puis se defait en braises.
   Les degats tombent a l'image du contact (l'epee qui se plante, la fleche qui traverse, la morsure), environ 0,4 a 0,55 s apres le geste ; si la cible
   bouge pendant ce temps, le sort la suit. */

/* la cible d'un coup fatal : le monstre le plus proche du point vise, suivi s'il bouge */
function suivreCible(pv) {
  let mo = null, bd = 1.6; if (combat) combat.monstres.forEach((o) => { if (o.etat !== 'actif' || !o.m) return; const d = Math.hypot(o.x - pv.x, o.z - pv.z); if (d < bd) { bd = d; mo = o; } });
  const dernier = pv.clone(), dy = mo ? pv.y - mo.m.position.y : 0;
  const f = () => { if (mo && mo.m && mo.etat === 'actif') dernier.set(mo.x, mo.m.position.y + dy, mo.z); return dernier; }; f.mo = mo; f.haut = (mo && mo.haut) || 1.6; return f;
}
const solSous = (p) => { const cel = caseIci(p.x, p.z); return cel ? posCase(cel).y : solA(p.x, p.z); };
const versCameraY = (p) => Math.atan2(camera.position.x - p.x, camera.position.z - p.z); /* (l'angle qui tourne une face vers la camera, a l'horizontale) */

/* ---- COLERE DE IOP : l'epee qui tombe du ciel ---- */
let EPEE_CIEL = null;
function modeleEpeeCiel() {
  if (!EPEE_CIEL) {
    const ph = (o) => new T.MeshPhongMaterial(Object.assign({ flatShading: true }, o));
    const acier = ph({ color: '#e8eef6', specular: '#ffffff', shininess: 140, emissive: '#30445c', emissiveIntensity: 0.55 }), or = ph({ color: '#f2c14e', specular: '#fff3c4', shininess: 90, emissive: '#6a4a08', emissiveIntensity: 0.55 });
    const cuir = ph({ color: '#6a3f22', emissive: '#2a160a', emissiveIntensity: 0.5 }), gemme = ph({ color: '#e8402e', specular: '#ffffff', shininess: 120, emissive: '#8a1206', emissiveIntensity: 0.8 });
    const halo = new T.MeshBasicMaterial({ color: '#ffd36a', transparent: true, opacity: 0.45, blending: T.AdditiveBlending, depthWrite: false, side: T.BackSide });
    const lame = new T.Shape(); lame.moveTo(-0.2, 0); lame.lineTo(0.2, 0); lame.lineTo(0.17, 2.15); lame.lineTo(0, 2.75); lame.lineTo(-0.17, 2.15); lame.closePath();
    const gLame = new T.ExtrudeGeometry(lame, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.04, bevelSegments: 1, steps: 1 }); gLame.translate(0, 0, -0.025);
    const g = new T.Group(), add = (geo, mat, x, y, z) => { const m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); g.add(m); return m; };
    add(gLame, acier); add(gLame, halo).scale.set(1.2, 1.035, 1.8); /* (le lisere d'or autour de la lame) */
    add(new T.BoxGeometry(0.06, 1.9, 0.135), ph({ color: '#aebdd0', emissive: '#22303f', emissiveIntensity: 0.5 }), 0, 1.02); /* (la gouttiere au milieu de la lame) */
    add(new T.BoxGeometry(1.05, 0.15, 0.22), or, 0, -0.03); add(new T.SphereGeometry(0.11, 10, 8), or, -0.56, -0.03); add(new T.SphereGeometry(0.11, 10, 8), or, 0.56, -0.03);
    add(new T.IcosahedronGeometry(0.085, 0), gemme, 0, -0.03, 0.12); add(new T.IcosahedronGeometry(0.085, 0), gemme, 0, -0.03, -0.12);
    add(new T.CylinderGeometry(0.075, 0.085, 0.7, 10), cuir, 0, -0.46); [-0.2, -0.46, -0.72].forEach((y) => { add(new T.TorusGeometry(0.086, 0.022, 6, 14), or, 0, y).rotation.x = Math.PI / 2; });
    add(new T.SphereGeometry(0.14, 12, 10), or, 0, -0.88); add(new T.IcosahedronGeometry(0.06, 0), gemme, 0, -1.0);
    g.traverse((o) => { o.raycast = () => {}; }); partager(g); EPEE_CIEL = g;
  }
  return EPEE_CIEL.clone();
}
function sceauDore() { /* le sceau dore au sol : deux cercles, huit rayons */
  const g = new T.Group(), m = (geo, c, o) => { const x = new T.Mesh(geo, fxMat(c, o)); x.rotation.x = -Math.PI / 2; x.renderOrder = 3; g.add(x); return x; };
  m(GEO_DISQUE, '#ffb52e', 0.28); m(new T.RingGeometry(0.88, 1, 56), '#ff8a12', 1); m(new T.RingGeometry(1.04, 1.1, 56), '#fff3c4', 0.9); m(new T.RingGeometry(0.58, 0.66, 48), '#ff8a12', 1); /* (plus orange et plus epais : en or pale, il se perdait sur le sable) */
  for (let i = 0; i < 8; i++) { const b = new T.Group(), t = new T.Mesh(GEO_TRAIT_SOL, fxMat(i % 2 ? '#ffe08a' : '#ff8a12', 1)); t.scale.set(0.08, 1, 0.24); t.position.z = 0.77; t.renderOrder = 3; b.rotation.y = i / 8 * Math.PI * 2; b.add(t); g.add(b); }
  g.traverse((o) => { o.raycast = () => {}; }); scene.add(g); return g;
}
function epeeDuCiel(suivre, impact) {
  const k = Math.min(2.2, Math.max(1, suivre.haut / 1.6)), T_APPEL = 0.32, T_CHUTE = 0.2, T_TENUE = 0.55, T_FIN = 0.25, pp = paysanMesh.position;
  /* l'appel : une colonne de lumiere monte de l'epee du Iop */
  emettre(FX_LUM, 26, { x: pp.x, y: pp.y + 1.2, z: pp.z, r: 0.15, v: [0, 16, 0], dv: 1, vie: [0.25, 0.4], taille: [0.25, 0.05], c: ['#ffffff', '#ffd36a'], a: 0.9, etire: 0.02 });
  emettre(FX_VIF, 12, { x: pp.x, y: pp.y + 1.2, z: pp.z, r: 0.1, v: [0, 12, 0], dv: 1.5, vie: [0.2, 0.35], taille: [0.08, 0.02], c: ['#ffffff', '#ffd36a'], frein: 1, etire: 0.03 }); flashLumiere(pp.x, pp.y + 1.5, pp.z, '#ffd36a', 2.5, 6, 0.3);
  const sceau = sceauDore(), epee = modeleEpeeCiel(), yaw = new T.Quaternion(), pench = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), 0.12), retourne = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), Math.PI), vib = new T.Quaternion(), AX = new T.Vector3(1, 0, 0);
  epee.visible = false; scene.add(epee); let t = 0, frappe = false, P = suivre().clone(), y0 = solSous(P);
  const rai = faisceau(new T.Vector3(P.x, y0 + 12, P.z), new T.Vector3(P.x, y0, P.z), [['#ffd36a', '#ff9a1e', 0.55 * k, false], ['#ffffff', '#ffd36a', 0.18 * k, true]]); /* (un rai de lumiere tombe du ciel la ou l'epee va tomber) */
  effets.push((dt) => { t += dt;
    if (!frappe) { P.copy(suivre()); y0 = solSous(P); }
    /* le sceau : il s'ouvre en tournant, eclate a l'impact, puis s'efface */
    const ks = t < T_APPEL + T_CHUTE ? Math.min(1, t / (T_APPEL + T_CHUTE)) : 1, fs = t < T_APPEL + T_CHUTE ? 1 : Math.max(0, 1 - (t - T_APPEL - T_CHUTE) / 0.45);
    sceau.position.set(P.x, y0 + 0.06, P.z); sceau.rotation.y = t * 2.2; sceau.scale.setScalar(k * (0.35 + 0.95 * (1 - Math.pow(1 - ks, 3)) + (frappe ? 0.6 * (1 - fs) : 0)));
    sceau.traverse((o) => { if (o.material) o.material.opacity = (o.userData.o0 != null ? o.userData.o0 : (o.userData.o0 = o.material.opacity)) * fs * Math.min(1, t / 0.08); });
    if (rai) { if (t < T_APPEL + T_CHUTE) { rai.g.position.set(P.x, y0 + 12, P.z); rai.g.lookAt(P.x, y0, P.z); rai.maj(Math.min(1, t / 0.12), 0.75 * Math.min(1, t / 0.1) * (t > T_APPEL ? Math.max(0, 1 - (t - T_APPEL) / T_CHUTE) : 1), t); } else if (rai.g.parent) jeter(rai.g); }
    /* l'epee : elle tombe en accelerant, etiree par la vitesse, se plante et vibre */
    yaw.setFromAxisAngle(AXE_Y, versCameraY(P)); const yImpact = y0 + 2.2 * k;
    if (t >= T_APPEL) { epee.visible = true; const u = Math.min(1, (t - T_APPEL) / T_CHUTE), ap = t - T_APPEL - T_CHUTE;
      let y = yImpact + 11 * (1 - u * u), sy = k * (1 + 0.35 * u * (u < 1 ? 1 : 0)), a = 0;
      if (ap > 0) { y = yImpact - 0.18 * k * Math.exp(-ap * 18); sy = k * (1 - 0.12 * Math.exp(-ap * 14) * Math.cos(ap * 40)); a = 0.07 * Math.exp(-ap * 7) * Math.sin(ap * 46); } /* (elle s'enfonce d'un coup, rebondit et vibre) */
      epee.scale.set(k, sy, k);
      if (ap > T_TENUE) { const f = Math.min(1, (ap - T_TENUE) / T_FIN); /* elle s'efface sur place en paillettes d'or (« fais-la disparaitre, pas rapetisser dans les airs », Mathieu) */
        if (!epee.userData.fond) { epee.userData.fond = true; epee.traverse((o) => { if (!o.material) return; o.material = o.material.clone(); o.material.userData.o0 = o.material.opacity; o.material.transparent = true; o.material.depthWrite = false; });
          for (let i = 0; i < 18; i++) emettre(FX_LUM, 1, { x: P.x, y: yImpact - fxAlea() * 2.75 * k + 0.2, z: P.z, r: 0.18 * k, v: [0, 1.2, 0], dv: 1, vie: [0.4, 0.7], taille: [0.16, 0.02], c: ['#ffffff', '#ffd36a'], a: 1, frein: 1 });
          emettre(FX_LUM, 1, { x: P.x, y: yImpact, z: P.z, vie: [0.12, 0.14], taille: [1.2 * k, 1.8 * k], c: ['#ffffff', '#ffd36a'], a: 0.7, entree: 0.01 }); }
        epee.traverse((o) => { if (o.material) o.material.opacity = o.material.userData.o0 * (1 - f); });
        if (fxAlea() < 0.9) emettre(FX_LUM, 2, { x: P.x, y: yImpact - fxAlea() * 2.75 * k, z: P.z, r: 0.15 * k, v: [0, 1.4, 0], dv: 0.6, vie: [0.4, 0.7], taille: [0.12, 0.02], c: ['#ffffff', '#ffd36a'], a: 1, frein: 1 }); }
      vib.setFromAxisAngle(AX, a); epee.quaternion.copy(yaw).multiply(pench).multiply(vib).multiply(retourne); epee.position.set(P.x, y, P.z);
      if (u < 1) for (let i = 0; i < 4; i++) { const h = fxAlea() * 2.75 * k; emettre(FX_LUM, 1, { x: P.x + (fxAlea() - 0.5) * 0.3 * k, y: y - h, z: P.z + (fxAlea() - 0.5) * 0.3 * k, v: [0, 22, 0], vie: [0.08, 0.14], taille: [0.3, 0.1], c: ['#ffffff', '#ffd36a'], a: 0.8, etire: 0.012 }); } /* (les traits de vitesse le long de la lame) */
      if (u >= 1 && !frappe) { frappe = true; impact(); const ys = y0;
        onde(P.x, ys, P.z, 2.6 * k, '#fff3c4', 0.3, 0.95); onde(P.x, ys, P.z, 1.8 * k, '#ffc23a', 0.5, 0.85); solFendu(P.x, ys, P.z, 1.8 * k, true); mottes(P.x, ys, P.z, 12, 1.2); poussiere(P.x, ys, P.z, 14, 1.6 * k, '#e8d8b8');
        secousse(0.3, 0.4); flashLumiere(P.x, ys + 1, P.z, '#ffd36a', 4.5, 9, 0.5); etoileImpact(new T.Vector3(P.x, ys + 0.3, P.z), 1.6 * k, '#ffd36a');
        emettre(FX_VIF, 30, { x: P.x, y: ys + 0.2, z: P.z, r: 0.3, v: [0, 2, 0], dv: 7, haut: true, vie: [0.3, 0.6], taille: [0.1, 0.02], c: ['#ffffff', '#ffd36a', '#e8a21e'], grav: 9, frein: 1.4, etire: 0.04, sol: ys + 0.04, rebond: 0.3 });
        son('impactFleche', undefined, 6, -1150 + hasardCents(60)); } }
    if (t >= T_APPEL + T_CHUTE + T_TENUE + T_FIN) { jeter(epee, sceau, rai.g); return true; } return false; });
}

/* ---- FLECHE FATALE : le tir de precision ---- */
let FLECHE_FATALE = null;
function modeleFlecheFatale() {
  if (!FLECHE_FATALE) {
    const g = new T.Group(), rouge = new T.MeshBasicMaterial({ color: '#ff3b2e' }), clair = new T.MeshBasicMaterial({ color: '#ffd0c4' }), halo = new T.MeshBasicMaterial({ color: '#ff3b2e', transparent: true, opacity: 0.45, blending: T.AdditiveBlending, depthWrite: false });
    const fut = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 1.3, 6), clair); fut.rotation.x = Math.PI / 2; g.add(fut);
    const pointe = new T.Mesh(new T.ConeGeometry(0.13, 0.42, 4), rouge); pointe.rotation.x = Math.PI / 2; pointe.position.z = 0.86; g.add(pointe);
    const hp = new T.Mesh(new T.ConeGeometry(0.26, 0.8, 8), halo); hp.rotation.x = Math.PI / 2; hp.position.z = 0.8; g.add(hp);
    const pl = new T.Shape(); pl.moveTo(0, 0); pl.lineTo(0.2, -0.08); pl.lineTo(0.22, 0.32); pl.lineTo(0, 0.2); pl.closePath(); const gp = new T.ShapeGeometry(pl);
    for (let i = 0; i < 3; i++) { const p = new T.Mesh(gp, new T.MeshBasicMaterial({ color: '#ff6a4a', side: T.DoubleSide })), b = new T.Group(); p.rotation.x = -Math.PI / 2; p.position.z = -0.62; b.rotation.z = i / 3 * Math.PI * 2; b.add(p); g.add(b); } /* (l'empennage : trois plumes) */
    const hf = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 1.4, 8, 1, true), halo); hf.rotation.x = Math.PI / 2; g.add(hf);
    g.traverse((o) => { o.raycast = () => {}; }); partager(g); FLECHE_FATALE = g;
  }
  return FLECHE_FATALE.clone();
}
function mireRouge() { /* la mire qui se resserre sur la cible : un cercle et quatre pointes, par-dessus tout */
  const g = new T.Group(), anneau = new T.Mesh(new T.RingGeometry(0.86, 1, 48), fxMat('#ff3b2e', 0.95, true)); anneau.renderOrder = 12; g.add(anneau);
  const tri = new T.Shape(); tri.moveTo(-0.13, 0); tri.lineTo(0.13, 0); tri.lineTo(0, -0.3); tri.closePath(); const gt = new T.ShapeGeometry(tri);
  for (let i = 0; i < 4; i++) { const b = new T.Group(), m = new T.Mesh(gt, fxMat('#ff3b2e', 0.95, true)); m.position.y = 1.42; m.renderOrder = 12; b.rotation.z = i * Math.PI / 2; b.add(m); g.add(b); }
  const point = new T.Mesh(new T.CircleGeometry(0.07, 12), fxMat('#ffffff', 0.95, true)); point.renderOrder = 12; g.add(point);
  g.traverse((o) => { o.raycast = () => {}; }); scene.add(g); return g;
}
function flecheFataleJuicy(de0, suivre, impact) {
  const T_VISE = 0.32, VITESSE = 42, mire = mireRouge(), visee = faisceau(de0, suivre(), [['#ff6a4a', '#ff3b2e', 0.05, true]]), k = Math.min(1.8, Math.max(1, suivre.haut / 1.6));
  let t = 0, fl = null, F = null, de = de0.clone(), dir = new T.Vector3(), L = 1, fait = 0, frappe = false, fini = 0;
  effets.push((dt) => { t += dt; const P = suivre(), arc = pointeArc(paysanMesh);
    if (t < T_VISE) { /* la visee : la mire se resserre en tournant, un fin trait rouge relie l'arc a la cible, la fleche se charge */
      const u = t / T_VISE, e = 1 - Math.pow(1 - u, 3); versCamera(mire); mire.position.copy(P); mire.scale.setScalar(k * (1.45 - 0.9 * e)); /* (plus petite : « fais-le quand meme un peu plus petit », Mathieu, 25/11) */ mire.quaternion.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), (1 - e) * 1.6));
      visee.g.position.copy(arc); visee.g.lookAt(P); visee.g.scale.z = Math.max(0.01, arc.distanceTo(P)); visee.maj(1, 0.35 + 0.35 * Math.sin(t * 70), t);
      for (let i = 0; i < 3; i++) { const o = new T.Vector3(fxAlea() - 0.5, fxAlea() - 0.5, fxAlea() - 0.5).normalize().multiplyScalar(0.7);
        emettre(FX_VIF, 1, { x: arc.x + o.x, y: arc.y + o.y, z: arc.z + o.z, v: [-o.x * 4.5, -o.y * 4.5, -o.z * 4.5], vie: [0.14, 0.16], taille: [0.07, 0.03], c: ['#ffd0c4', '#ff3b2e'], a: 1, etire: 0.03 }); }
      emettre(FX_LUM, 1, { x: arc.x, y: arc.y, z: arc.z, vie: [0.05, 0.06], taille: [0.3 + 0.9 * u, 0.3 + 0.9 * u], c: ['#ffffff', '#ff6a4a'], a: 0.9 });
      return false; }
    if (!fl) { /* le tir */
      jeter(visee.g); de.copy(arc); dir.copy(P).sub(de); L = Math.max(0.5, dir.length()); dir.normalize(); fl = modeleFlecheFatale(); fl.scale.setScalar(1.15); scene.add(fl); fl.position.copy(de); fl.lookAt(P);
      F = faisceau(de, de.clone().addScaledVector(dir, L + 2.5), [['#ff6a4a', '#8a0a06', 0.42, false], ['#ffffff', '#ff3b2e', 0.16, true]]);
      anneauSouffle(de.clone().addScaledVector(dir, 0.4), dir, 0.1, 0.9, 0.18, '#ffd0c4', 0.9); flashLumiere(de.x, de.y, de.z, '#ff3b2e', 2.5, 5, 0.2);
      mire.children.forEach((c) => { (c.isGroup ? c.children : [c]).forEach((m) => m.material.color.set('#ffffff')); }); } /* (la mire se verrouille : elle blanchit) */
    if (!frappe) { versCamera(mire); mire.position.copy(P); mire.scale.setScalar(k * 0.55); }
    fait = Math.min(L + 2.5, fait + VITESSE * dt); fl.position.copy(de).addScaledVector(dir, fait); F.maj(fait / (L + 2.5), 1 - fini, t);
    emettre(FX_LUM, 1, { x: fl.position.x, y: fl.position.y, z: fl.position.z, vie: [0.06, 0.08], taille: [1.2, 0.4], c: ['#ffffff', '#ff3b2e'], a: 0.95 });
    emettre(FX_VIF, 3, { x: fl.position.x, y: fl.position.y, z: fl.position.z, r: 0.06, v: [-dir.x * 5, 0.6, -dir.z * 5], dv: 2.5, vie: [0.15, 0.3], taille: [0.1, 0.02], c: ['#ffffff', '#ff6a4a', '#8a0a06'], grav: 4, frein: 2, etire: 0.05 });
    if (!frappe && fait >= L) { frappe = true; impact(); jeter(mire); anneauSouffle(P.clone(), dir, 0.15, 1.6 * k, 0.25, '#ff8a6a', 0.9); son('impactFleche', undefined, 4, -650 + hasardCents(60));
      emettre(FX_VIF, 26, { x: P.x, y: P.y, z: P.z, r: 0.1, v: [dir.x * 9, 0.5, dir.z * 9], dv: 4, vie: [0.2, 0.45], taille: [0.12, 0.02], c: ['#ffffff', '#ff6a4a', '#8a0a06'], grav: 5, frein: 2, etire: 0.05 }); } /* (la gerbe part a travers la cible) */
    if (fait >= L + 2.5) { fini = Math.min(1, fini + dt / 0.25); fl.visible = false; F.maj(1, 1 - fini, t); if (fini >= 1) { jeter(fl, F.g); if (!frappe) { frappe = true; impact(); jeter(mire); } return true; } }
    return false; });
}

function portailDeFeu() {
  const g = new T.Group(), trou = new T.Mesh(GEO_DISQUE, fxMat('#1a0602', 0.85)), bord = new T.Mesh(new T.RingGeometry(0.82, 1, 48), fxMat('#ff6a1e', 0.95)), lueur = new T.Mesh(new T.RingGeometry(1, 1.35, 48), fxMat('#ffb04a', 0.45));
  [trou, bord, lueur].forEach((m, i) => { m.rotation.x = -Math.PI / 2; m.renderOrder = 2 + i; g.add(m); }); g.traverse((o) => { o.raycast = () => {}; }); scene.add(g); return g;
}
/* ---- MORSURE DU DRAGOEUF : un dragon de feu qui jaillit d'un portail (25/11/2026, le Dragoeuf teinte « tres bof », Mathieu) ----
   La tete est faite en code (machoires, crocs, cornes, yeux), le corps est un long ruban de flammes qui suit le meme trajet qu'elle : il sort du portail,
   s'eleve, plonge sur la cible gueule ouverte, la referme dessus, puis le dragon entier se defait en braises (sans rapetisser). */
let TETE_DRAGON = null;
function modeleTeteDragon() {
  if (!TETE_DRAGON) {
    const ph = (o) => new T.MeshPhongMaterial(Object.assign({ flatShading: true }, o));
    const ecaille = ph({ color: '#d8401a', specular: '#ffb070', shininess: 40, emissive: '#7a1a06', emissiveIntensity: 0.55 }), dent = ph({ color: '#fff4dc', emissive: '#6a5a40', emissiveIntensity: 0.45 });
    const oeil = new T.MeshBasicMaterial({ color: '#fff3a0' }), gueule = new T.MeshBasicMaterial({ color: '#ffb02e' });
    const profil = (pts, larg) => { const s = new T.Shape(); s.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(([x, y]) => s.lineTo(x, y)); s.closePath();
      const g = new T.ExtrudeGeometry(s, { depth: larg, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 1, steps: 1 }); g.translate(0, 0, -larg / 2); g.rotateY(-Math.PI / 2); return g; }; /* (dessine de profil : x vers l'avant, y vers le haut ; l'epaisseur devient la largeur) */
    const tete = new T.Group(), add = (p, geo, mat, x, y, z) => { const m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); p.add(m); return m; };
    add(tete, profil([[-0.5, 0], [0.7, 0], [0.8, 0.08], [0.72, 0.2], [0.32, 0.27], [0.06, 0.43], [-0.3, 0.5], [-0.52, 0.34]], 0.5), ecaille); /* (le crane et la machoire du haut) */
    const bas = new T.Group(); bas.position.z = -0.4; bas.name = 'machoire'; tete.add(bas);
    add(bas, profil([[-0.05, 0], [1.02, 0], [0.95, -0.1], [0.6, -0.16], [0.1, -0.18], [-0.05, -0.1]], 0.42), ecaille); /* (la machoire du bas, articulee a l'arriere) */
    add(bas, new T.BoxGeometry(0.34, 0.03, 0.95), gueule, 0, 0.0, 0.5); add(tete, new T.BoxGeometry(0.4, 0.03, 1.0), gueule, 0, -0.01, 0.15); /* (l'interieur de la gueule, braise) */
    const cr = new T.ConeGeometry(0.04, 0.16, 5);
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) { const z = 0.08 + i * 0.17; add(tete, cr, dent, sx * 0.19, -0.07, z).rotation.x = Math.PI; add(bas, cr, dent, sx * 0.16, 0.07, z + 0.4); } /* (les crocs, en haut et en bas) */
    for (const sx of [-1, 1]) { add(tete, new T.IcosahedronGeometry(0.065, 0), oeil, sx * 0.2, 0.33, 0.12); const c = add(tete, new T.ConeGeometry(0.07, 0.5, 6), dent, sx * 0.16, 0.48, -0.42); c.rotation.x = -2.1; c.rotation.z = sx * -0.25; }
    for (let i = 0; i < 3; i++) add(tete, new T.ConeGeometry(0.05, 0.18 - i * 0.03, 5), dent, 0, 0.5 - i * 0.05, -0.15 - i * 0.18).rotation.x = -0.6; /* (la crete) */
    tete.traverse((o) => { o.raycast = () => {}; }); partager(tete); TETE_DRAGON = tete;
  }
  return TETE_DRAGON.clone();
}
function dragoeufSurgit(suivre, impact) {
  const P0 = suivre().clone(), pp = paysanMesh.position, d0 = new T.Vector3(pp.x - P0.x, 0, pp.z - P0.z); if (d0.lengthSq() < 1e-6) d0.set(-1, 0, 0); d0.normalize();
  const recul = Math.min(1.8, Math.max(1.1, Math.hypot(pp.x - P0.x, pp.z - P0.z) * 0.6)), Q = P0.clone().addScaledVector(d0, recul); Q.y = solSous(Q);
  const k = Math.min(1.6, Math.max(1, suivre.haut / 1.8)), T_OUVRE = 0.22, T_VOL = 0.44, T_TIENT = 0.16, T_FIN = 0.3, CORPS = 0.42, R = 0.16 * k, KT = 0.72 * k; /* (corps fin, couvert de flammes, et tete plus petite : en tuyau plein et grosse tete, il faisait jouet, 25/11) */
  coupDeFouet(mainDe(paysanMesh), Q.clone().setY(Q.y + 0.1), paysanMesh, 'fatal'); /* (le fouet claque au sol : il ouvre le portail) */
  const portail = portailDeFeu(), tete = modeleTeteDragon(), bas = tete.getObjectByName('machoire'); tete.scale.setScalar(KT); tete.visible = false; scene.add(tete);
  const coeur = new T.Mesh(new T.BufferGeometry(), new T.MeshBasicMaterial({ vertexColors: true })), halo = new T.Mesh(new T.BufferGeometry(), new T.MeshBasicMaterial({ color: '#ff8a2e', transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false }));
  [coeur, halo].forEach((m) => { m.frustumCulled = false; m.raycast = () => {}; m.visible = false; scene.add(m); });
  const B = [new T.Vector3(), new T.Vector3(), new T.Vector3(), new T.Vector3()], b = (u, o) => { const v = 1 - u; return o.set(0, 0, 0).addScaledVector(B[0], v * v * v).addScaledVector(B[1], 3 * v * v * u).addScaledVector(B[2], 3 * v * u * u).addScaledVector(B[3], u * u * u); };
  const cJaune = new T.Color('#ffd25a'), cRouge = new T.Color('#b8280a'), cc = new T.Color(), pt = new T.Vector3(), pt2 = new T.Vector3();
  const trajet = (P) => { const dir = new T.Vector3(P.x - Q.x, 0, P.z - Q.z); const L = Math.max(0.5, dir.length()); dir.normalize();
    B[0].set(Q.x, Q.y - 0.8 * k, Q.z); B[1].set(Q.x - dir.x * 0.3, Q.y + 3.4 * k, Q.z - dir.z * 0.3); B[2].set(P.x - dir.x * (0.6 + L * 0.2), P.y + 2.6 * k, P.z - dir.z * (0.6 + L * 0.2));
    const fin = new T.Vector3().subVectors(P, B[2]).normalize(); B[3].copy(P).addScaledVector(fin, -0.42 * k); };
  const corps = (u) => { /* le ruban de feu : le trajet de la tete entre u - CORPS et u, plus fin vers la queue */
    const pts = []; for (let i = 0; i <= 14; i++) { const v = u - CORPS * (1 - i / 14); pts.push(b(Math.max(0, v), new T.Vector3()).add(v < 0 ? pt2.set(0, v * 2 * k, 0) : pt2.set(0, 0, 0))); }
    const courbe = new T.CatmullRomCurve3(pts), N = 28, RS = 8;
    [[coeur, 1], [halo, 2.6]].forEach(([m, f]) => { const g = new T.TubeGeometry(courbe, N, R * f, RS, false), P = g.getAttribute('position'), col = f === 1 ? new Float32Array(P.count * 3) : null;
      for (let i = 0; i <= N; i++) { const c = courbe.getPointAt(i / N, pt), ta = 0.18 + 0.82 * Math.pow(i / N, 0.7); if (col) cc.copy(cRouge).lerp(cJaune, Math.pow(i / N, 1.5));
        for (let j = 0; j <= RS; j++) { const q = i * (RS + 1) + j; P.setXYZ(q, c.x + (P.getX(q) - c.x) * ta, c.y + (P.getY(q) - c.y) * ta, c.z + (P.getZ(q) - c.z) * ta); if (col) { col[q * 3] = cc.r; col[q * 3 + 1] = cc.g; col[q * 3 + 2] = cc.b; } } }
      if (col) g.setAttribute('color', new T.BufferAttribute(col, 3)); m.geometry.dispose(); m.geometry = g; m.visible = true; });
    for (let i = 0; i < 18; i++) { const w = Math.pow(fxAlea(), 0.6); courbe.getPointAt(w, pt); emettre(FX_VIF, 1, { x: pt.x, y: pt.y + R * 0.4, z: pt.z, r: R * 1.2, v: [0, 1.4, 0], dv: 0.4, vie: [0.12, 0.24], taille: [(0.2 + 0.32 * w) * k, 0.04], c: ['#ffe08a', '#ff7a12', '#c8300a'], a: 1, frein: 1.2 }); } /* (le corps : des flammes serrees autour d'un fil de braise, plus grosses vers la tete) */
    return courbe; };
  let t = 0, frappe = false, P = P0.clone(), feu = 0, fini = false, derniere = null; trajet(P);
  effets.push((dt) => { t += dt; if (!frappe) { P.copy(suivre()); trajet(P); }
    /* le portail : il s'ouvre au claquement, crache des flammes, se referme a la fin */
    const ouv = t < 0.12 ? 0 : Math.min(1, (t - 0.12) / 0.12), ferme = Math.max(0, (t - T_OUVRE - T_VOL - T_TIENT) / T_FIN), r = 0.85 * k * (1 - Math.pow(1 - ouv, 3)) * (1 - ferme);
    portail.position.set(Q.x, Q.y + 0.05, Q.z); portail.scale.setScalar(Math.max(1e-3, r)); portail.rotation.y = t * 3;
    if (ouv > 0 && ferme < 1) { feu += dt * 36; while (feu >= 1) { feu -= 1; const a = fxAlea() * Math.PI * 2; emettre(FX_VIF, 1, { x: Q.x + Math.cos(a) * r, y: Q.y + 0.1, z: Q.z + Math.sin(a) * r, v: [0, 2.2, 0], dv: 0.4, vie: [0.25, 0.45], taille: [0.34, 0.05], c: ['#ffd25a', '#ff6a12', '#c8300a'], a: 1, frein: 1.2 }); } }
    if (t > 0.12 && t - dt <= 0.12) { onde(Q.x, Q.y, Q.z, 1.4 * k, '#ff8a2e', 0.35, 0.8); emettre(FX_VIF, 16, { x: Q.x, y: Q.y + 0.1, z: Q.z, r: 0.3, v: [0, 4, 0], dv: 2.5, haut: true, vie: [0.3, 0.6], taille: [0.08, 0.02], c: ['#fff1a8', '#ff8a1e'], grav: 6, frein: 1, etire: 0.03 }); }
    const s = t - T_OUVRE; if (s < 0) return false;
    if (!fini) { const u = Math.min(1, Math.pow(Math.min(1, s / T_VOL), 1.35)); tete.visible = true; b(u, tete.position); b(Math.min(1, u + 0.02), pt); if (u < 1 && pt.distanceToSquared(tete.position) > 1e-8) tete.lookAt(pt);
      /* la gueule s'ouvre en plongeant, claque sur la cible */
      const ap = s - T_VOL; bas.rotation.x = ap < 0 ? 0.95 * Math.min(1, Math.max(0, (u - 0.45) / 0.45)) : Math.max(0, 0.95 * (1 - ap / 0.04)) + 0.05 * Math.exp(-ap * 20) * Math.sin(ap * 60);
      derniere = corps(u); emettre(FX_LUM, 1, { x: tete.position.x, y: tete.position.y, z: tete.position.z, vie: [0.06, 0.08], taille: [1.1 * k, 0.7 * k], c: ['#ffd25a', '#ff6a1e'], a: 0.5 }); /* (la lueur autour de la tete) */
      tete.updateMatrixWorld(); for (let i = 0; i < 4; i++) { pt.set((fxAlea() - 0.5) * 0.4, 0.3 + fxAlea() * 0.25, -0.3 - fxAlea() * 0.35).applyMatrix4(tete.matrixWorld); emettre(FX_VIF, 1, { x: pt.x, y: pt.y, z: pt.z, v: [0, 1.6, 0], dv: 0.5, vie: [0.14, 0.26], taille: [0.36 * k, 0.05], c: ['#ffe08a', '#ff7a12', '#c8300a'], a: 1, frein: 1.2 }); } /* (la criniere de flammes) */
      if (ap >= 0 && !frappe) { frappe = true; impact(); boule(P.x, P.y, P.z, 0.7, ['#ffb02e', '#e8541e', '#7a1e0a'], false); etoileImpact(P, 1.3, '#ff6a1e'); secousse(0.14, 0.25); son('impactFleche', undefined, 4, -900 + hasardCents(80)); }
      if (ap >= T_TIENT) { fini = true; /* il se defait en braises, d'un coup */
        tete.visible = false; coeur.visible = halo.visible = false; const c = derniere;
        for (let i = 0; i < 24; i++) { c.getPointAt(i / 23, pt); emettre(FX_VIF, 2, { x: pt.x, y: pt.y, z: pt.z, r: R, v: [0, 1.6, 0], dv: 2.2, vie: [0.35, 0.7], taille: [0.3 * k, 0.04], c: ['#ffd25a', '#ff6a12', '#c8300a'], a: 1, frein: 1.4 }); emettre(FX_VIF, 1, { x: pt.x, y: pt.y, z: pt.z, r: R, dv: 3, vie: [0.4, 0.8], taille: [0.07, 0.02], c: ['#fff1a8', '#ff8a1e'], grav: 3, frein: 1, etire: 0.03 }); }
        emettre(FX_LUM, 1, { x: tete.position.x, y: tete.position.y, z: tete.position.z, vie: [0.14, 0.16], taille: [2.2 * k, 3 * k], c: ['#ffffff', '#ffb04a'], a: 0.8, entree: 0.01 });
        emettre(FX_FUM, 8, { x: tete.position.x, y: tete.position.y, z: tete.position.z, r: 0.5 * k, v: [0, 1.2, 0], dv: 0.8, vie: [0.6, 1.0], taille: [0.4, 1.2], c: ['#4a3c34', '#9a908a'], a: 0.35, frein: 1.4, entree: 0.12 }); } }
    if (ferme >= 1) { jeter(tete, portail, coeur, halo); return true; } return false; });
}

{ const effetFrappeJF = effetFrappe; effetFrappe = function (classe, pv, auImpact, feu) {
  if (feu !== 'fatal' || !juiceSort('fatal')) return effetFrappeJF.apply(this, arguments);
  const suivre = suivreCible(pv), de = classe === 'cra' ? pointeArc(paysanMesh) : paysanMesh.position.clone(), C = { style: 'fatal', gros: true, mos: [] }, coul = { cra: '#d9443a', iop: '#e8a21e', osa: '#ff6a1e' }[classe] || '#d9443a';
  const impact = () => { const p = suivre().clone(), sauf = classe === 'iop' ? 'coupFatal' : classe === 'osa' ? 'morsure' : null, f0 = sauf && window[sauf]; if (sauf) window[sauf] = () => {}; /* (l'ancien effet de la classe ne se rejoue pas : le sort l'a remplace) */
    JUICE_CRA.coup = C; try { auImpact(); } finally { JUICE_CRA.coup = null; if (sauf) window[sauf] = f0; }
    tempsFortAnime(p, coul); cibleFatale(C, de); };
  if (classe === 'cra') return flecheFataleJuicy(de, suivre, impact);
  if (classe === 'iop') return epeeDuCiel(suivre, impact);
  return dragoeufSurgit(suivre, impact);
}; }
