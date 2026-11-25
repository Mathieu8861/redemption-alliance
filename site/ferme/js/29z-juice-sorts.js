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
