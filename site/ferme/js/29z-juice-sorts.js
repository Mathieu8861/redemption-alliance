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
const SORTS_OUVERTS = new Set(['flammes', 'givre', 'fatal', 'tempete', 'ruee', 'leg']); /* (les sorts legendaires, recette commune 29zb, ouverts a tous le 25/11/2026, « Ouvrir aux joueurs », Mathieu au formulaire) */ /* (les Fleches enflammees, le givre puis les coups fatals ouverts a tous le 25/11/2026, « ouvre-le aux joueurs », « ok tres bien », Mathieu) */
const juiceSort = (id) => (JUICE_SORTS.eteints && JUICE_SORTS.eteints.has(id) ? false : JUICE_SORTS.force != null ? JUICE_SORTS.force : SORTS_OUVERTS.has(id) || (typeof MODE_TEST !== 'undefined' && !!MODE_TEST)); /* (eteints : un Set de sorts a montrer comme avant dans les essais) */
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
function traitsEclat(p, couleur, o) {
  o = o || {}; const zone = (combat && $('combat-zone')) || document.body, s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), N = o.n || 16, R0 = 55, R1 = o.long || 360, DUREE = o.duree || JS_FATAL.lignes; /* (moins nombreux et plus courts : 22 traits jusqu'a 430 px couvraient tout l'ecran) */ let d = '';
  for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2 + (Math.random() - 0.5) * 0.2, l = R1 * (0.55 + Math.random() * 0.45), w = 0.03 + Math.random() * 0.035, r0 = R0 * (0.8 + Math.random() * 0.6);
    d += 'M' + (Math.cos(a - w) * r0).toFixed(1) + ' ' + (Math.sin(a - w) * r0).toFixed(1) + 'L' + (Math.cos(a) * l).toFixed(1) + ' ' + (Math.sin(a) * l).toFixed(1) + 'L' + (Math.cos(a + w) * r0).toFixed(1) + ' ' + (Math.sin(a + w) * r0).toFixed(1) + 'Z'; }
  s.setAttribute('viewBox', '-450 -450 900 900'); Object.assign(s.style, { position: 'absolute', width: '900px', height: '900px', marginLeft: '-450px', marginTop: '-450px', pointerEvents: 'none', zIndex: '5' });
  s.innerHTML = '<path d="' + d + '" fill="#ffffff" stroke="' + couleur + '" stroke-width="4" stroke-linejoin="round"/>'; zone.appendChild(s); versEcran(p, s);
  const t0 = performance.now(), pas = () => { const k = (performance.now() - t0) / DUREE; if (k >= 1 || !s.isConnected) { s.remove(); return; }
    versEcran(p, s); s.style.transform = 'scale(' + (0.65 + 0.65 * (1 - Math.pow(1 - k, 3))).toFixed(3) + ')'; s.style.opacity = String(k < 0.35 ? 1 : (1 - k) / 0.65); requestAnimationFrame(pas); };
  requestAnimationFrame(pas);
}

/* le temps fort facon anime : image figee, silhouettes, negatif, puis zoom qui revient (en temps reel : l'image figee ralentit le jeu, pas ceci) */
let FATAL_ANIME = false;
function tempsFortAnime(p, couleur, o) {
  arretImage(JS_FATAL.arret); traitsEclat(p, couleur, o);
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
      emettre(FX_VIF, 12, { x: P.x, y: P.y, z: P.z, r: 0.1, v: [dir.x * 7, 0.5, dir.z * 7], dv: 2.5, vie: [0.2, 0.45], taille: [0.12, 0.02], c: ['#ffffff', '#ff6a4a', '#8a0a06'], grav: 5, frein: 2, etire: 0.05 }); } /* (la gerbe part a travers la cible) */
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
  if (!TETE_DRAGON) { /* (refaite en formes rondes et en rendu du jeu : la premiere, taillee en blocs, faisait « trop cubique », Mathieu, 25/11) */
    const toon = (c, e, i) => new T.MeshToonMaterial({ color: c, gradientMap: grad, emissive: e || '#000000', emissiveIntensity: i == null ? 0.5 : i });
    const ecaille = toon('#e04a1c', '#7a1a06', 0.45), sombre = toon('#a8280c', '#4a0e04', 0.45), ventre = toon('#ffb04a', '#8a3a0a', 0.45), dent = toon('#fff4dc', '#6a5a40', 0.35);
    const oeil = new T.MeshBasicMaterial({ color: '#fff3a0' }), pupille = new T.MeshBasicMaterial({ color: '#2a0a04' }), gueule = new T.MeshBasicMaterial({ color: '#ffb02e' });
    const boule = (p, mat, x, y, z, sx, sy, sz, n) => { const m = new T.Mesh(new T.SphereGeometry(0.5, n || 18, Math.round((n || 18) * 0.7)), mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); p.add(m); return m; };
    const cone = (p, mat, r, h, x, y, z, rx, rz) => { const m = new T.Mesh(new T.ConeGeometry(r, h, 8), mat); m.position.set(x, y, z); m.rotation.set(rx || 0, 0, rz || 0); p.add(m); return m; };
    const tete = new T.Group();
    boule(tete, ecaille, 0, 0.2, -0.12, 0.62, 0.5, 0.78); /* (le crane) */
    boule(tete, ecaille, 0, 0.12, 0.34, 0.44, 0.28, 0.78); /* (le museau, long et aplati) */
    boule(tete, sombre, 0, 0.24, 0.52, 0.2, 0.08, 0.34); /* (l'arete du museau) */
    for (const sx of [-1, 1]) {
      boule(tete, sombre, sx * 0.16, 0.36, 0.08, 0.2, 0.08, 0.34); /* (l'arcade au-dessus de l'oeil) */
      boule(tete, oeil, sx * 0.19, 0.3, 0.12, 0.12, 0.1, 0.14, 12); boule(tete, pupille, sx * 0.205, 0.3, 0.17, 0.03, 0.085, 0.05, 8); /* (l'oeil jaune, la pupille fendue) */
      boule(tete, pupille, sx * 0.07, 0.2, 0.71, 0.05, 0.035, 0.05, 8); /* (la narine) */
      const c1 = cone(tete, dent, 0.075, 0.42, sx * 0.17, 0.5, -0.36, -2.0, sx * -0.3), c2 = cone(c1, dent, 0.045, 0.3, 0, 0.3, 0, 0.5, 0); c2.position.y = 0.3; /* (les cornes, courbees vers l'arriere) */
      for (let i = 0; i < 3; i++) cone(tete, sombre, 0.05, 0.22 - i * 0.03, sx * (0.3 - i * 0.02), 0.12 - i * 0.04, -0.3 - i * 0.12, -1.9, sx * -1.1); /* (les piques des joues) */
    }
    for (let i = 0; i < 3; i++) cone(tete, sombre, 0.05, 0.2 - i * 0.04, 0, 0.46 - i * 0.05, -0.28 - i * 0.17, -1.2); /* (la crete) */
    boule(tete, gueule, 0, 0.02, 0.28, 0.34, 0.06, 0.7); /* (le palais, braise) */
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) cone(tete, dent, 0.035, 0.14, sx * (0.16 - i * 0.012), 0.0, 0.14 + i * 0.15, Math.PI); /* (les crocs du haut) */
    const bas = new T.Group(); bas.position.set(0, 0.02, -0.25); bas.name = 'machoire'; tete.add(bas);
    boule(bas, ecaille, 0, -0.07, 0.5, 0.38, 0.14, 0.86); boule(bas, ventre, 0, -0.11, 0.48, 0.3, 0.08, 0.76); boule(bas, gueule, 0, -0.01, 0.5, 0.28, 0.04, 0.66); /* (la machoire du bas, le dessous clair, la langue de braise) */
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) cone(bas, dent, 0.032, 0.12, sx * (0.14 - i * 0.012), 0.04, 0.4 + i * 0.14, 0);
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
  let chemin = null; const b = (u, o) => chemin.getPointAt(Math.min(1, Math.max(0, u)), o);
  const cJaune = new T.Color('#ffd25a'), cRouge = new T.Color('#b8280a'), cc = new T.Color(), pt = new T.Vector3(), pt2 = new T.Vector3();
  const trajet = (P) => { /* un trajet de serpent, bas, qui ondule en S jusqu'a la cible (pas une cloche qui monte tout droit puis retombe, « en cloche », Mathieu, 25/11) */
    const dir = new T.Vector3(P.x - Q.x, 0, P.z - Q.z), L = Math.max(0.6, dir.length()); dir.normalize(); const cote = new T.Vector3(-dir.z, 0, dir.x);
    const pt = (f, h, c) => new T.Vector3(Q.x + dir.x * (L + 0.6) * f - dir.x * 0.6 + cote.x * c * k, Q.y + h * k, Q.z + dir.z * (L + 0.6) * f - dir.z * 0.6 + cote.z * c * k);
    const fin = new T.Vector3(P.x - dir.x * 0.4 * k, P.y + 0.05 * k, P.z - dir.z * 0.4 * k);
    chemin = new T.CatmullRomCurve3([pt(0.35, -0.9, 0), pt(0.36, 0.5, 0.15), pt(0.18, 1.1, 0.95), pt(0.4, 1.45, -0.85), pt(0.72, 1.15, 0.45), fin], false, 'centripetal'); };
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
    tempsFortAnime(p, coul, classe === 'cra' ? { n: 9, long: 220, duree: 170 } : null); cibleFatale(C, de); }; /* (le tir du Cra : moins de traits rouges, plus courts, « limite un peu les traits rouges qui partent partout », Mathieu, 25/11) */
  if (classe === 'cra') return flecheFataleJuicy(de, suivre, impact);
  if (classe === 'iop') return epeeDuCiel(suivre, impact);
  return dragoeufSurgit(suivre, impact);
}; }

/* LA TEMPETE DE LAMES (25/11/2026, « fais la tempete de lames », Mathieu) : l'ulti de zone du Iop. Le jeu ne change pas (meme elan, 2 s de tournoiement,
   4 coups sur tout ce qui est a 2,8 cases, memes degats, la copie de tempeteDeLames de 22-sorts.js en garde chaque regle) ; ce qui change, c'est ce qu'on voit :
   - au depart, un souffle part de lui et souleve la poussiere ;
   - une vraie tornade : trois spirales de vent qui montent autour de lui en tournant, des traits de vent qui defilent dessus ;
   - la pointe de l'epee laisse un cercle de lumiere ;
   - a chaque coup, un anneau tranchant s'ouvre tout autour de lui ; chaque monstre touche blanchit, recule vers l'exterieur, et les etincelles partent dans
     le sens de rotation ; le sol garde des entailles ; un court temps fort quand il touche ;
   - le 4e coup marque plus : temps fort plus long, secousse, anneau plus grand, chiffres plus gros. */
const VS_VENT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FS_VENT = `uniform vec3 uC; uniform float uT, uA; varying vec2 vUv;
void main() { float s = fract(vUv.x * 4.0 - uT * 2.4); float trait = 0.35 + 0.65 * smoothstep(0.0, 0.2, s) * (1.0 - smoothstep(0.4, 0.95, s)); /* (un fond continu et des traits qui defilent : en traits seuls, la tornade ne se voyait pas) */
  float bords = 1.0 - pow(abs(vUv.y - 0.5) * 2.0, 2.0); float bout = smoothstep(0.0, 0.15, vUv.x) * (1.0 - smoothstep(0.8, 1.0, vUv.x)); gl_FragColor = vec4(uC, trait * bords * bout * uA); }`;
function geoHelice(r0, r1, h0, h1, tours, larg, n) { /* un ruban debout qui monte en spirale (uv.x le long, uv.y en travers) */
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) { const u = i / n, a = u * tours * Math.PI * 2, r = r0 + (r1 - r0) * u, y = h0 + (h1 - h0) * u, l = larg * (0.6 + 0.4 * u);
    pos.push(Math.cos(a) * r, y - l / 2, Math.sin(a) * r, Math.cos(a) * r, y + l / 2, Math.sin(a) * r); uv.push(u, 0, u, 1); if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}
const GEO_HELICE = (() => { const g = geoHelice(0.85, 1.8, 0.05, 2.5, 1.15, 0.75, 72); partager(g); return g; })();
const matVent = (c, a, additif) => new T.ShaderMaterial({ uniforms: { uC: { value: new T.Color(c) }, uT: { value: 0 }, uA: { value: a } }, vertexShader: VS_VENT, fragmentShader: FS_VENT, transparent: true, depthWrite: false, side: T.DoubleSide, blending: additif ? T.AdditiveBlending : T.NormalBlending });

function entailleSol(x, y, z, a, long) { /* une entaille laissee au sol par la lame : doree un instant, puis sombre, puis elle s'efface */
  const g = new T.Group(), m = new T.Mesh(GEO_TRAIT_SOL, fxMat('#ffe9a8', 0.9)); m.scale.set(0.07, 1, long); m.renderOrder = 3; g.add(m); g.position.set(x, y + 0.05, z); g.rotation.y = a;
  fxVie(g, 1.6, (k) => { m.material.color.lerpColors(new T.Color('#ffe9a8'), new T.Color('#5a3c22'), Math.min(1, k * 6)); m.material.opacity = 0.85 * (k < 0.6 ? 1 : (1 - k) / 0.4); });
}
function anneauTranchant(p, R, fort) { /* l'anneau tranchant d'un coup : un cercle de lumiere a hauteur d'epee qui s'ouvre jusqu'au bord de la zone */
  const g = new T.Group(), or = new T.Mesh(new T.RingGeometry(0.9, 1, 64), fxMat('#ffb52e', 0.95)), blanc = new T.Mesh(new T.RingGeometry(0.955, 1, 64), fxMat('#ffffff', 1)); blanc.material.blending = T.AdditiveBlending;
  [or, blanc].forEach((m) => { m.rotation.x = -Math.PI / 2; m.renderOrder = 7; g.add(m); }); g.position.set(p.x, p.y + 0.78, p.z);
  fxVie(g, fort ? 0.28 : 0.2, (k) => { const e = 1 - Math.pow(1 - k, 3); g.scale.setScalar(R * (0.45 + 0.6 * e) * (fort ? 1.12 : 1)); or.material.opacity = 0.95 * (1 - k * k); blanc.material.opacity = 1 - k; });
}
function coupDeTempete(p, R, touches, dernier, tour) {
  anneauTranchant(p, R, dernier); onde(p.x, p.y, p.z, R, '#fff3c4', 0.3, 0.7); son('epee', undefined, dernier ? 2 : -1, hasardCents(120));
  for (let i = 0; i < (dernier ? 7 : 4); i++) { const a = fxAlea() * Math.PI * 2, d = fxEntre(0.9, R), x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d, cel = caseIci(x, z); if (lieu === 'ferme' && !cel) continue; /* (les entailles, en travers du rayon : le sens de la lame) */
    entailleSol(x, cel ? posCase(cel).y : solA(x, z), z, Math.atan2(Math.cos(a), -Math.sin(a)) + Math.PI / 2 + fxEntre(-0.3, 0.3), fxEntre(0.5, 0.95)); }
  touches.forEach((mo) => { if (!mo.m) return; const q = new T.Vector3(mo.x, mo.m.position.y + (mo.haut || 1.5) * 0.5, mo.z), out = new T.Vector3(mo.x - p.x, 0, mo.z - p.z); if (out.lengthSq() < 1e-6) out.set(1, 0, 0); out.normalize();
    const tg = new T.Vector3(out.z, 0, -out.x); /* (le sens de rotation : il tourne dans le sens de tour croissant) */
    reactionJuicy(mo, dernier); flashSansSquelette(mo); etoileImpact(q, dernier ? 1.0 : 0.7, '#ffd36a');
    emettre(FX_VIF, dernier ? 12 : 7, { x: q.x, y: q.y, z: q.z, r: 0.08, v: [tg.x * 7 + out.x * 2, 1, tg.z * 7 + out.z * 2], dv: 2.4, vie: [0.15, 0.3], taille: [0.09, 0.02], c: ['#ffffff', '#ffd36a', '#e8601a'], grav: 9, frein: 2.4, etire: 0.05 });
    if (mo.etat === 'actif' && mo.pv > 0 && typeof reculVisuel === 'function') reculVisuel(mo, out, dernier ? 0.55 : 0.28); });
  if (touches.length) { arretImage(dernier ? 0.07 : 0.025); secousse(dernier ? 0.14 : 0.05, dernier ? 0.25 : 0.12); son('impactFleche', undefined, dernier ? 3 : 0, -500 + hasardCents(120)); }
  if (dernier) { anneauSouffle(new T.Vector3(p.x, p.y + 0.4, p.z), new T.Vector3(0, 1, 0), 0.5, R * 1.25, 0.35, '#fff3c4', 0.8); poussiere(p.x, p.y, p.z, 14, R * 0.9); flashLumiere(p.x, p.y + 1, p.z, '#ffd27a', 3.5, 8, 0.35); }
}

function tempeteJuicy(pt) {
  /* le jeu : exactement celui de tempeteDeLames (22-sorts.js) */
  const st = statsPerso(), u = paysanMesh.userData, pp = paysanMesh.position, R = 2.8, de = pp.clone(), m = u.membres || [], bras = m[3] || m[2];
  let x = pt.x, z = pt.z; const ok = (a, b) => { const q = caseIci(a, b); return q && praticable(q); };
  if (!ok(x, z)) { const x0 = x, z0 = z; let k = 1; while (k > 0 && !ok(pp.x + (x0 - pp.x) * k, pp.z + (z0 - pp.z) * k)) k -= 0.05; x = pp.x + (x0 - pp.x) * Math.max(0, k); z = pp.z + (z0 - pp.z) * Math.max(0, k); }
  combat.cdUlti = rechargeUlti(); chemin = []; arrivee = null; combat.ordre = false; u.charge = true; u.tempete = true; toast(nomUlti('zone') + ' !', 'or');
  const dash = Math.min(0.4, Math.hypot(x - pp.x, z - pp.z) / 18);
  /* ce qu'on voit */
  const fx = new T.Group(), lames = new T.Group(), tornade = new T.Group(); scene.add(fx); fx.add(lames, tornade); lames.position.y = 0.78;
  for (let i = 0; i < 2; i++) { const b3 = new T.Group(); b3.rotation.y = i * Math.PI; lames.add(b3); [['#ffffff', '#ffe9a8', 0.95, 1.45, true], ['#ffd27a', '#ff7a1e', 0.6, 1.6, false]].forEach(([c, b, o, s, plein]) => { const l = new T.Mesh(GEO_RUBAN, matRuban(c, b, o, plein)); l.material.uniforms.uP.value = 1; l.material.uniforms.uQ.value = 0.95; l.userData.o = o; l.rotation.x = Math.PI / 2; l.scale.set(-s, s, 1); b3.add(l); }); }
  const mVentA = matVent('#ffffff', 0.85, true), mVentN = matVent('#d9a84a', 0.6, false), helices = []; /* (le vent dore en couleur pleine : en blanc seul, il disparaissait sur le sable) */
  for (let i = 0; i < 3; i++) { const a = new T.Mesh(GEO_HELICE, mVentA), n = new T.Mesh(GEO_HELICE, mVentN); a.rotation.y = n.rotation.y = i * Math.PI * 2 / 3; n.scale.set(1.06, 1, 1.06); a.renderOrder = 8; n.renderOrder = 6; tornade.add(n, a); helices.push(a, n); }
  const sol = new T.Group(), bord = new T.Mesh(new T.RingGeometry(R - 0.12, R, 64), fxMat('#ee8a34', 0.6)), bord2 = new T.Mesh(new T.RingGeometry(R + 0.06, R + 0.12, 64), fxMat('#fff3c4', 0.5)); [bord, bord2].forEach((m2) => { m2.rotation.x = -Math.PI / 2; m2.renderOrder = 3; sol.add(m2); }); sol.position.y = 0.05; fx.add(sol);
  fx.traverse((o) => { o.raycast = () => {}; });
  let fant = dash > 0.05 ? fantomes(paysanMesh, 3, '#ffd27a', 1.4) : null;
  let t = 0, coups = 0, tour = u.angle || 0, souffle = 0, trace = 0, parti = false;
  effets.push((dt) => {
    t += dt; const p = paysanMesh.position;
    if (t < dash) { const k = t / dash; p.x = de.x + (x - de.x) * k; p.z = de.z + (z - de.z) * k; trace += dt; if (trace > 0.02) { trace = 0; lueur(new T.Vector3(p.x, p.y + 0.8, p.z), '#ffd24a', 1.2, 0.25); } }
    else { tour += dt * 17; paysanMesh.rotation.y = tour; if (bras) { bras.rotation.x = -0.25; bras.rotation.z = -1.25; }
      if (!parti) { parti = true; anneauSouffle(new T.Vector3(p.x, p.y + 0.3, p.z), new T.Vector3(0, 1, 0), 0.4, R * 1.1, 0.3, '#fff3c4', 0.85); poussiere(p.x, p.y, p.z, 12, 1.2); son('epee', undefined, 1, -300); } /* (le souffle du depart) */
      while (combat && !combat.fin && coups < COUPS_TEMPETE && t - dash >= coups * (DUREE_TEMPETE / COUPS_TEMPETE)) { coups++; const dernier = coups === COUPS_TEMPETE, touches = [], C = { style: '', gros: dernier, mos: [] };
        JUICE_CRA.coup = C; try { combat.monstres.slice().forEach((o) => { if (o.etat === 'actif' && Math.hypot(o.x - p.x, o.z - p.z) <= R) { touches.push(o); blesser(o, Math.round(st.deg * 3 / COUPS_TEMPETE), true); } }); } finally { JUICE_CRA.coup = null; }
        coupDeTempete(p, R, touches, dernier, tour); }
      souffle += dt; if (souffle > 0.06) { souffle = 0; const b = tour * 0.7; poussiere(p.x + Math.sin(b) * R * 0.85, p.y, p.z + Math.cos(b) * R * 0.85, 1, 0.6); }
      for (let w = 0; w < 2; w++) { const a = tour + 0.3 + w * Math.PI + Math.PI / 2; emettre(FX_VIF, 1, { x: p.x + Math.sin(a) * 1.4, y: p.y + 0.78, z: p.z + Math.cos(a) * 1.4, v: [Math.cos(a) * 6, 0, -Math.sin(a) * 6], vie: [0.1, 0.16], taille: [0.1, 0.03], c: ['#ffffff', '#ffd36a'], a: 1, etire: 0.03 }); } /* (le cercle de lumiere de la pointe de l'epee) */
      for (let w = 0; w < 3; w++) { const th = tour * 0.6 + w * 2.09 + t * 3, rr = 1.0 + ((w * 0.37 + t * 1.7) % 1.6), h = 0.2 + ((w * 0.41 + t * 2.3) % 1.9); /* (des filets de vent qui tournent) */
        emettre(FX_LUM, 1, { x: p.x + Math.sin(th) * rr, y: p.y + h, z: p.z + Math.cos(th) * rr, v: [Math.cos(th) * 9, 1.2, -Math.sin(th) * 9], vie: [0.16, 0.24], taille: [0.08, 0.03], c: ['#ffffff', '#fff1c0'], a: 0.6, etire: 0.045 }); } }
    const cel = caseIci(p.x, p.z); u.y = hauteurSol(p.x, p.z, cel); p.y = u.y; fx.position.set(p.x, p.y, p.z);
    if (fant) { if (t < dash + 0.12) fant.maj(dt, Math.min(1, (dash + 0.12 - t) / 0.12)); else { fant.fin(); fant = null; } }
    const f = Math.min(1, Math.max(0, t - dash) / 0.15, (dash + DUREE_TEMPETE - t) / 0.2); /* (la tornade se forme puis se defait) */
    lames.rotation.y = tour + 0.3; lames.scale.setScalar(0.6 + 0.4 * f); lames.children.forEach((b3) => b3.children.forEach((l) => { l.material.uniforms.uA.value = l.userData.o * f; }));
    tornade.rotation.y += dt * 9; tornade.scale.set(0.7 + 0.3 * f, 0.4 + 0.6 * f, 0.7 + 0.3 * f); [mVentA, mVentN].forEach((mm, i) => { mm.uniforms.uT.value = t; mm.uniforms.uA.value = (i ? 0.6 : 0.85) * f; });
    bord.material.opacity = (0.45 + 0.2 * Math.sin(t * 12)) * f; bord2.material.opacity = 0.5 * f;
    if (t >= dash + DUREE_TEMPETE || !combat) { jeter(fx); if (fant) { fant.fin(); fant = null; } u.charge = false; u.tempete = false; if (bras) { bras.rotation.x = 0; bras.rotation.z = 0; } if (cel && praticable(cel)) u.cellule = cel; onde(p.x, p.y, p.z, R + 0.6, '#ffffff', 0.4, 0.8); poussiere(p.x, p.y, p.z, 12, R * 0.7); flashLumiere(p.x, p.y + 1, p.z, '#ffd27a', 2.5, 7, 0.3); return true; }
  });
}
{ const tempeteJS = tempeteDeLames; tempeteDeLames = function (pt) { if (!juiceSort('tempete')) return tempeteJS.apply(this, arguments); return tempeteJuicy(pt); }; }

/* LA RUEE DU TROUPEAU (25/11/2026, « fais la ruee du troupeau », Mathieu) : l'ulti de zone de l'Osamodas. Les degats ne changent pas, mais chaque monstre les
   prend quand le troupeau lui passe dessus (et non plus tous d'un coup avant que les Bouftous n'arrivent) :
   - le fouet claque, un nuage de poussiere se leve derriere l'Osamodas, le sol gronde ;
   - 5 Bouftous chargent en V, au galop (ils s'ecrasent a chaque foulee et s'etirent en l'air), tete baissee, dans la poussiere, en laissant des traces de sabots ;
   - chaque monstre touche blanchit, saute, recule dans le sens de la charge, ses degats sautent a ce moment-la ;
   - au bout de la course, les Bouftous disparaissent dans un nuage de laine.
   Comment : la ruee lancee par l'ulti (executerUlti) met de cote les coups de la zone (blesser est mis de cote le temps de l'impact) et les donne au
   troupeau, qui les porte au passage ; tout coup pas encore porte a la fin de la course est porte a ce moment-la. */
let RUEE_ULTI = false, RUEE_ACTIVE = null, RUEE_ULTI_IMPACT = false;
const JS_RUEE = { n: 5, vitesse: 13, avant: 2.2, apres: 1.6, echelle: 0.55 };
{ const majMonstreRU = majMonstre; majMonstre = function (mo, dt) { const r = majMonstreRU.apply(this, arguments); const S = mo && mo.sautV; /* (le saut d'un monstre bouscule, a l'image) */
  if (S && mo.m) { S.t += dt || 0; const k = S.t / 0.36; if (k >= 1 || mo.etat !== 'actif') mo.sautV = null; else mo.m.position.y += Math.sin(k * Math.PI) * S.h; } return r; }; }
function rueeJuicy(x, y, z, r) {
  const pp = paysanMesh.position, L = Math.hypot(x - pp.x, z - pp.z) || 1, dx = (x - pp.x) / L, dz = (z - pp.z) / L, cx = -dz, cz = dx, n = JS_RUEE.n;
  const s0 = -(r + JS_RUEE.avant), s1 = r + JS_RUEE.apres, D = s1 - s0, TC = D / JS_RUEE.vitesse;
  secousse(0.07, TC + 0.35); onde(x, y, z, r + 0.3, '#e9dcc0', 0.6, 0.6, true);
  const depart = { x: x + dx * s0, z: z + dz * s0 }; poussiere(depart.x, solA(depart.x, depart.z), depart.z, 16, r * 0.9, '#e9dcc0'); /* (le nuage d'ou sort le troupeau) */
  const bouf = []; let maxRetard = 0;
  for (let i = 0; i < n; i++) { const lat = (i - (n - 1) / 2) * r * 0.6, retard = Math.abs(lat) * 0.03 + fxAlea() * 0.03; maxRetard = Math.max(maxRetard, retard);
    const m = modeleBouftouInvoque(); m.rotation.order = 'YXZ'; m.scale.setScalar(0.001); poser(m, depart.x + cx * lat, solA(depart.x + cx * lat, depart.z + cz * lat), depart.z + cz * lat, Math.atan2(dx, dz)); m.traverse((o) => { o.raycast = () => {}; });
    bouf.push({ m, lat, retard, poudre: 0, pas: 0, ph0: fxAlea() * 3 }); } /* (en V : ceux du milieu partent devant) */
  const S = { coups: [], b0: null, recevoir(pris, b0) { this.b0 = b0; pris.forEach(([mo, nb, rest]) => this.coups.push({ mo, nb, rest, s: (mo.x - x) * dx + (mo.z - z) * dz, fait: false })); } };
  const porter = (c, fort) => { c.fait = true; const mo = c.mo; if (!combat || combat.fin || !mo || mo.etat !== 'actif') return;
    JUICE_CRA.coup = { style: '', gros: true, mos: [] }; try { S.b0(mo, c.nb, ...c.rest); } finally { JUICE_CRA.coup = null; }
    if (!fort || !mo.m) return; const h = mo.haut || 1.5, q = new T.Vector3(mo.x, mo.m.position.y + h * 0.5, mo.z), boss = mo.d && (mo.d.boss || mo.d.stable);
    reactionJuicy(mo, true); flashSansSquelette(mo); etoileImpact(q, 0.9, '#fff3c4'); poussiere(mo.x, solA(mo.x, mo.z), mo.z, 5, 0.7, '#e9dcc0');
    emettre(FX_VIF, 9, { x: q.x, y: q.y, z: q.z, r: 0.1, v: [dx * 6, 2, dz * 6], dv: 2.5, vie: [0.2, 0.4], taille: [0.09, 0.02], c: ['#ffffff', '#fff3c4', '#d9c49a'], grav: 9, frein: 2, etire: 0.04 });
    if (mo.etat === 'actif' && mo.pv > 0) { reculVisuel(mo, { x: dx, z: dz }, 0.75); if (!boss) mo.sautV = { t: 0, h: 0.5 }; }
    son('impactFleche', undefined, 1, -800 + hasardCents(150)); if (!S.premier) { S.premier = true; arretImage(0.03); } };
  let t = 0;
  effets.push((dt) => { t += dt; let front = -1e9;
    bouf.forEach((b) => { const tb = t - b.retard; if (tb < 0 || b.fini) return; const k = Math.min(1, tb / TC), s = s0 + D * k, X = x + dx * s + cx * b.lat, Z = z + dz * s + cz * b.lat, ys = solA(X, Z), ph = b.ph0 + tb * 22, saut = Math.abs(Math.sin(ph));
      front = Math.max(front, s); const e = JS_RUEE.echelle * Math.min(1, tb / 0.08);
      b.m.position.set(X, ys + saut * 0.3, Z); b.m.rotation.x = 0.2 + Math.cos(ph) * 0.14; b.m.scale.set(e * (1 + 0.1 * (1 - saut)), e * (0.82 + 0.28 * saut), e * (0.92 + 0.18 * saut)); /* (il s'ecrase en touchant le sol, s'etire en l'air) */
      b.poudre += dt; if (b.poudre > 0.035) { b.poudre = 0; emettre(FX_FUM, 1, { x: X - dx * 0.5, y: ys + 0.15, z: Z - dz * 0.5, v: [-dx * 0.8, fxEntre(0.3, 0.9), -dz * 0.8], vie: [0.4, 0.7], taille: [0.35, 1.0], c: ['#e9dcc0', '#e9dcc0'], a: 0.45, frein: 3, vrot: 1.5, entree: 0.08 });
        if (fxAlea() < 0.4) emettre(FX_VIF, 2, { x: X, y: ys + 0.05, z: Z, r: 0.15, v: [-dx * 2, 2.2, -dz * 2], dv: 1, vie: [0.3, 0.5], taille: [0.07, 0.04], c: ['#8a6a44', '#6a4a2a'], grav: 9, sol: ys + 0.03, rebond: 0.3 }); } /* (la poussiere et les mottes soulevees) */
      b.pas += dt; if (b.pas > 0.11 && saut < 0.3) { b.pas = 0; tacheSol(X, ys, Z, 0.16, '#6a4a2a', 0.45, 1.4); } /* (les traces de sabots) */
      if (k >= 1) { b.fini = true; b.m.visible = false; emettre(FX_FUM, 7, { x: X, y: ys + 0.4, z: Z, r: 0.4, v: [dx, 0.8, dz], dv: 1.2, vie: [0.4, 0.7], taille: [0.4, 1.0], c: ['#ffffff', '#f2ead8'], a: 0.75, frein: 2.5, entree: 0.05 });
        emettre(FX_VIF, 8, { x: X, y: ys + 0.4, z: Z, r: 0.3, dv: 2.5, haut: true, vie: [0.3, 0.6], taille: [0.1, 0.05], c: ['#ffffff', '#f2ead8'], grav: 4, frein: 1.5 }); } }); /* (il disparait dans un nuage de laine) */
    S.coups.forEach((c) => { if (!c.fait && front >= c.s - 0.3) porter(c, true); });
    if (t >= TC + maxRetard + 0.05) { S.coups.forEach((c) => { if (!c.fait) porter(c, true); }); jeter(...bouf.map((b) => b.m)); return true; } return false; });
  return S;
}
{ const rueeJS = rueeTroupeau; rueeTroupeau = function (x, y, z, r) { if (!RUEE_ULTI_IMPACT || !juiceSort('ruee')) return rueeJS.apply(this, arguments); RUEE_ACTIVE = rueeJuicy(x, y, z, r); }; }
{ const executerUltiRU = executerUlti; executerUlti = function (id, c, pt) { const r = executerUltiRU.apply(this, arguments);
  if (id === 'zone' && classeDe() === 'osa' && juiceSort('ruee')) { const A = paysanMesh.userData.attaque; if (A && A.surFrappe) { const sf = A.surFrappe; A.surFrappe = () => { RUEE_ULTI = true; try { return sf(); } finally { RUEE_ULTI = false; } }; } }
  return r; }; }
{ const effetFrappeRU = effetFrappe; effetFrappe = function (classe, pv, auImpact, feu) {
  if (!RUEE_ULTI || classe !== 'osa') return effetFrappeRU.apply(this, arguments);
  const a0 = auImpact; return effetFrappeRU.call(this, classe, pv, () => { /* l'impact de la ruee : les coups de la zone sont mis de cote et donnes au troupeau */
    const b0 = blesser, pris = []; blesser = function (mo, nb, ...rest) { pris.push([mo, nb, rest]); }; RUEE_ACTIVE = null; RUEE_ULTI_IMPACT = true;
    try { a0(); } finally { blesser = b0; RUEE_ULTI_IMPACT = false; }
    if (RUEE_ACTIVE) { RUEE_ACTIVE.recevoir(pris, b0); RUEE_ACTIVE = null; } else pris.forEach(([mo, nb, rest]) => b0(mo, nb, ...rest)); }, feu); }; }
