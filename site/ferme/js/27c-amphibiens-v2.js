/* LES AMPHIBIENS, NOUVELLE VERSION, DANS L'ARENE DEV (16/11/2026, « ca me parait pas mal ; avant, tu peux importer les nouvelles versions en arene et mode test
   stp ? », Mathieu). Les versions validees le 15/11 : les cinq variantes 2 de Rodin a la peau repeinte (Tetard, Crapaud cracheur, Fouette-langue, Triton,
   Axolotl) et la Mere Crapaude bleu-vert faite en formes simples. Animees depuis le 16/11 (squelettes) : voir plus bas, LE CHOIX DE VERSION ET LES SQUELETTES.
   Un choix dans l'Arene dev (Reglages et Groupes) : ancienne version ou nouvelle. Sources : maquettes/saison-des-pluies/mere-styles/v2-peau.js et
   mere-jeu2.js (copiees ici telles quelles, par le script faire_27c). */
/* LES VARIANTES 2 DES AMPHIBIENS, LA PEAU REPEINTE (15/11/2026, par Discord : « les variantes 2 etaient pas si mal, sauf le boss ; juste les couleurs
   sont pas top, toutes unies pour la peau, ca empeche de faire des trucs plus sympa », Mathieu). Les modeles Rodin « variante 2 » (assets/modeles/essais/
   palier11/<nom>-2.glb), a la taille du jeu, dans le rendu du jeu (toon, contour). Leur texture reste, et on peint par-dessus, sommet par sommet, la
   seule peau (reconnue a sa teinte dans la texture : pas les armures, les batons, les habits) : un dos plus sombre, un ventre clair, des taches, des
   mouchetures, des flammes selon la bete. chargerV2(nom, peindre) -> une promesse du modele (peindre = false : la variante 2 d'origine). */
(() => {
  const C = (c) => new T.Color(c), sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const HAUT = { tetard: 1.1, crapaud: 2.0, fouette: 2.5, triton: 3.2, axolotl: 2.2 };
  /* la peau de chaque bete, reconnue par sa teinte (degres), sa saturation et sa valeur ; puis ce qu'on y peint : (p : position ramenee a la boite, x et z de -1 a 1,
     y de 0 a 1 ; n : la normale ; t : la valeur d'une tache, de 0 a 1) -> [couleur, part] */
  const REGLES = {
    /* (motifs francs, 15/11/2026 : la camera du jeu voit surtout le dos et le dessus de la tete, c'est la qu'ils doivent se lire) */
    tetard: { peau: (h, s, v) => h > 140 && h < 215 && s > 0.15, taches: [0, 0, 0], mouches: [0, 0, 0], /* (sans taches, 15/11/2026, « le tetard non plus », Mathieu) */
      peint: (p, n, t, m) => { let c = null, w = 0; const ve = sst(0.0, -0.6, n.y); if (ve) { c = '#8cc0a8'; w = ve * 0.8; }
        if (t > 0.5 && n.y > -0.3) { c = '#4f9c88'; w = 0.9; } else if (t > 0.15 && n.y > -0.3) { c = '#123430'; w = 0.8; } if (m > 0.5 && n.y > 0) { c = '#a7e0cf'; w = 0.85; } return [c, w]; } },
    crapaud: { peau: (h, s, v) => h > 12 && h < 55 && s > 0.3 && v > 0.25, taches: [30, 0.07, 0.11], mouches: [110, 0.016, 0.03],
      peint: (p, n, t, m) => { let c = null, w = 0; const ve = Math.max(sst(-0.1, -0.6, n.y), sst(0.45, 0.85, n.z) * sst(0.55, 0.2, p.y)); if (ve) { c = '#f2dcaa'; w = ve * 0.8; }
        if (t > 0.5 && ve < 0.4) { c = '#5e3416'; w = 0.9; } else if (t > 0.15 && ve < 0.4) { c = '#8f5222'; w = 0.45; } if (m > 0.5 && ve < 0.4) { c = '#f6c868'; w = 0.85; } return [c, w]; } },
    fouette: { peau: (h, s, v) => h > 190 && h < 235 && s > 0.35, taches: [70, 0.045, 0.08], mouches: [0, 0, 0],
      peint: (p, n, t, m) => { let c = null, w = 0; const dos = sst(0.1, -0.6, n.z) * sst(0.25, 0.5, p.y), ve = sst(0.35, 0.85, n.z) * sst(0.4, 0.55, p.y) * sst(0.8, 0.65, p.y); if (dos) { c = '#122e6a'; w = dos * 0.7; }
        if (ve > 0.1) { c = '#c2e2f7'; w = ve * 0.75; } if (t > 0.5 && ve < 0.3) { c = '#0f2658'; w = 0.9; } else if (t > 0.2 && ve < 0.3) { c = '#5aa6ea'; w = 0.8; } return [c, w]; } },
    triton: { peau: (h, s, v) => h > 190 && h < 235 && s > 0.2, taches: [0, 0, 0], mouches: [0, 0, 0], /* (sans taches, 15/11/2026, « l'axolotl et le triton, pas necessaire les taches », Mathieu) */
      peint: (p, n, t, m) => { let c = null, w = 0; const dos = sst(0.1, -0.6, n.z) * sst(0.3, 0.7, p.y); if (dos) { c = '#122236'; w = dos * 0.55; }
        const fl = Math.abs(p.x) > 0.25 && n.z > -0.3 ? sst(0.55, 0.8, Math.sin(p.y * 30 + p.x * 6) * 0.5 + 0.5) * sst(0.2, 0.5, Math.abs(n.x)) * sst(0.75, 0.35, p.y) * sst(0.12, 0.3, p.y) : 0; if (fl && false) { c = '#f06a24'; w = fl * 0.95; } /* (ses flammes d'origine suffisent) */
        if (t > 0.5) { c = '#7ccc3a'; w = 0.9; } if (m > 0.5 && !fl && t <= 0.5) { c = '#5f92c4'; w = 0.85; } return [c, w]; } },
    axolotl: { peau: (h, s, v) => (h > 320 || h < 25) && s > 0.08 && s < 0.6 && v > 0.55, taches: [0, 0, 0], mouches: [0, 0, 0], /* (sans taches, 15/11/2026) */
      peint: (p, n, t, m) => { let c = null, w = 0; const ve = sst(0.3, 0.8, n.z) * sst(0.3, 0.5, p.y) * sst(0.75, 0.6, p.y); if (ve > 0.1) { c = '#fde9e4'; w = ve * 0.7; }
        if (t > 0.5 && (n.y > 0 || n.z < 0.2)) { c = '#b85a72'; w = 0.85; } else if (m > 0.5 && (n.y > 0 || n.z < 0.2)) { c = '#d27d8c'; w = 0.8; } return [c, w]; } } };
  const hsv = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn || 1e-4; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; return [h, (mx - mn) / (mx || 1e-4), mx]; };
  const contourDe = (e) => { const m = new T.MeshBasicMaterial({ color: '#3a2b1f', side: T.BackSide }); m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * ' + e.toFixed(5) + ';'); }; m.customProgramCacheKey = () => 'contour-v2-' + e.toFixed(5); return m; };
  /* la peinture, sur un modele deja charge (refaite le 16/11/2026 pour les modeles a squelette, dont chaque monstre est une copie) : peindreV2(nom, sc)
     pose sur la geometrie de chaque maillage texture les attributs aTeinte (la couleur peinte) et aPart (sa part) ; appliquerPeauV2(mat, nom) branche
     le melange dans une matiere, a refaire sur chaque matiere copiee (une copie ne garde pas onBeforeCompile) */
  window.appliquerPeauV2 = (mat, nom) => {
    mat.onBeforeCompile = (sh) => { sh.vertexShader = 'attribute vec3 aTeinte;\nattribute float aPart;\nvarying vec3 vTeinte;\nvarying float vPart;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvTeinte = aTeinte; vPart = aPart;');
      sh.fragmentShader = 'varying vec3 vTeinte;\nvarying float vPart;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vTeinte, vPart);'); };
    mat.customProgramCacheKey = () => 'v2-peau-' + nom; mat.needsUpdate = true; return mat; };
  window.peindreV2 = (nom, sc) => {
    const R = REGLES[nom]; sc.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(sc), ctr = bb.getCenter(new T.Vector3()), dim = bb.getSize(new T.Vector3());
    sc.traverse((m) => { if (!m.isMesh || m.name === 'contour' || !m.material || !m.material.map || m.geometry.attributes.aTeinte) return;
      const im = m.material.map.image, cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0); const px = cx.getImageData(0, 0, cv.width, cv.height).data;
      const G = m.geometry, P = G.attributes.position, N = G.attributes.normal, U = G.attributes.uv, nb = P.count, teinte = new Float32Array(nb * 3), part = new Float32Array(nb);
      let s0 = 7; const alea = () => { s0 = (s0 * 16807) % 2147483647; return s0 / 2147483647; };
      const v = new T.Vector3(), nn = new T.Vector3(), mw = m.matrixWorld, nm = new T.Matrix3().getNormalMatrix(mw), Q = [], NQ = [], peau = [];
      /* 1. chaque sommet : sa place dans la boite, sa normale, et s'il est de la peau (teinte de la texture sous lui) */
      for (let i = 0; i < nb; i++) {
        const uu = U.getX(i) % 1, vv = U.getY(i) % 1, ix = Math.min(cv.width - 1, Math.max(0, Math.floor((uu < 0 ? uu + 1 : uu) * cv.width))), iy = Math.min(cv.height - 1, Math.max(0, Math.floor((vv < 0 ? vv + 1 : vv) * cv.height))), o = (iy * cv.width + ix) * 4;
        const [h, s, vl] = hsv(px[o] / 255, px[o + 1] / 255, px[o + 2] / 255); v.fromBufferAttribute(P, i).applyMatrix4(mw); nn.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
        Q.push(new T.Vector3(v.x - ctr.x, v.y - bb.min.y, v.z - ctr.z)); NQ.push(nn.clone()); if (R.peau(h, s, vl)) peau.push(i); }
      /* 2. les centres des taches et des mouchetures, pris sur la peau elle-meme (en unites de la hauteur de la bete) */
      const centres = (n) => Array.from({ length: Math.min(n, peau.length) }, () => Q[peau[Math.floor(alea() * peau.length)]]);
      const T1 = centres(R.taches[0]), T2 = centres(R.mouches[0]), H = dim.y;
      const proche = (L, q, r0, r1) => { let b = 0; for (let i = 0; i < L.length; i++) { const r = (r0 + (r1 - r0) * ((i * 37) % 10) / 10) * H, d = L[i].distanceTo(q); if (d < r) b = Math.max(b, sst(r, r * 0.7, d)); } return b; };
      /* 3. la peinture */
      for (const i of peau) { const q = Q[i], n = NQ[i], qn = new T.Vector3(q.x / (dim.x / 2), q.y / dim.y, q.z / (dim.z / 2));
        const t = R.taches[0] ? proche(T1, q, R.taches[1], R.taches[2]) : 0, mo = R.mouches[0] ? proche(T2, q, R.mouches[1], R.mouches[2]) : 0;
        const [c, w] = R.peint(qn, n, t, mo); if (!c || w <= 0) continue; const cc = C(c); teinte[i * 3] = cc.r; teinte[i * 3 + 1] = cc.g; teinte[i * 3 + 2] = cc.b; part[i] = Math.min(1, w); }
      G.setAttribute('aTeinte', new T.BufferAttribute(teinte, 3)); G.setAttribute('aPart', new T.BufferAttribute(part, 1)); m.userData.peauV2 = nom; });
  };
  window.chargerV2 = async (nom, peindre) => {
    const gl = await new Promise((ok, ko) => chargeur.load('assets/modeles/jeu/' + nom + '-v2.glb?v=' + VERSION_MODELES, ok, undefined, ko)), sc = gl.scene;
    sc.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(sc), k = HAUT[nom] / (bb.max.y - bb.min.y), ctr = bb.getCenter(new T.Vector3());
    const meshes = []; sc.traverse((o) => { if (o.isMesh) meshes.push(o); });
    for (const m of meshes) { const map = m.material.map; if (map) { map.encoding = T.LinearEncoding; map.needsUpdate = true; } m.material = new T.MeshToonMaterial({ color: '#ffffff', map, gradientMap: grad, side: T.DoubleSide }); m.castShadow = true; m.receiveShadow = false; }
    if (peindre !== false) { window.peindreV2(nom, sc); meshes.forEach((m) => { if (m.userData.peauV2) window.appliquerPeauV2(m.material, nom); }); }
    for (const m of meshes) { const ct = new T.Mesh(m.geometry, contourDe(0.007 / k)); m.add(ct); }
    const env = new T.Group(); sc.scale.setScalar(k); sc.position.set(-ctr.x * k, -bb.min.y * k, -ctr.z * k); env.add(sc); env.userData = { hauteur: HAUT[nom], nom }; return env;
  };
})();
/* LA MERE CRAPAUDE, L'ENTRE-DEUX (15/11/2026, par Discord : « je prefere, mais un entre-deux serait cool ; sur la tete, mets-lui un nenuphar », Mathieu,
   apres la version en formes simples, mere-jeu.js). Entre le modele Rodin (trop realiste) et les boules du jeu : un corps d'un seul tenant sculpte dans une
   sphere (la tete fondue dans le corps comme un vrai crapaud, le pli de la bouche, les bosses derriere les yeux, des verrues en relief), une peau tachetee
   peinte par sommet (dos marbre, ventre creme, bouche sombre), des pattes en segments avec des doigts a coussinets ; le rendu reste celui du jeu (toon,
   contour). Un nenuphar fleuri sur la tete a la place de la barque. fabriquerMereJeu2(1, 2 ou 3) : les memes trois teintes, 5 de haut. */
window.fabriquerMereJeu2 = function (v, anime) {
  const g = new T.Group(), Y = new T.Vector3(0, 1, 0), C = (c) => new T.Color(c);
  let PART = 'ancre'; const CH = {}, DIRS = [], ajout0 = g.add.bind(g); g.add = (...L) => { L.forEach((o) => { if (o.userData.part == null) o.userData.part = PART; }); return ajout0(...L); }; /* (chaque piece notee : a quel os elle tient, pour le squelette, 16/11/2026) */
  const P = [null,
    { nom: 'Matrone', peau: '#5f7c3c', fonce: '#3f5726', clair: '#7d9a4e', ventre: '#ecdfb2', iris: '#e8a83a', oeuf: '#8df07e', tx: 1.25, ty: 0.95, tz: 1.2, haut: 0, oeufs: 'flancs' },
    { nom: 'Reine des roseaux', peau: '#3c8a78', fonce: '#255f52', clair: '#5fae95', ventre: '#e2eeae', iris: '#f6a93a', oeuf: '#a6f57e', orange: '#ef8a2e', langue: '#5f7fd0', tx: 1.14, ty: 1.05, tz: 1.1, haut: 0.12, oeufs: 'dos' },
    { nom: 'Bouffie', peau: '#8b6b3a', fonce: '#62482a', clair: '#a8864e', ventre: '#f2dca2', iris: '#e0602a', oeuf: '#8cf27c', tx: 1.42, ty: 0.84, tz: 1.3, haut: -0.1, oeufs: 'dessus' }][v];
  const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let s0 = 11 + v; const alea = () => { s0 = (s0 * 16807) % 2147483647; return s0 / 2147483647; };
  /* --- le corps : une sphere sculptee ; forme(d) donne le point de la peau dans la direction d (et sa couleur) --- */
  const verrues = []; for (let i = 0; i < 110; i++) { /* (16/11/2026, finitions : des verrues rondes et plus larges, la silhouette n'est plus herissee) */ /* (150 au lieu de 70, 15/11/2026, « travaille-la un poil plus, a l'image des autres monstres », Mathieu) */ const th = Math.acos(1 - alea() * 1.3), ph = alea() * Math.PI * 2, d = new T.Vector3(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)); if (d.z > 0.55 && d.y < 0.35) continue; if (d.angleTo(new T.Vector3(0.035, 1, -0.17).normalize()) < 0.72) continue; /* (pas de verrue sous le nenuphar) */ verrues.push([d, 0.022 + alea() * 0.03, 0.065 + alea() * 0.05]); }
  const bouche = (x) => 0.26 - 0.22 * x * x;
  const TACHES_O = []; for (let i = 0; i < 9; i++) { const th = 0.35 + alea() * 0.8, ph = Math.PI * (0.55 + alea() * 0.9) * (alea() < 0.5 ? 1 : -1), dd = new T.Vector3(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)); TACHES_O.push([dd, 0.05 + alea() * 0.05]); } /* (les taches orange, sur le dos et les flancs) */
  const TACHES = []; for (let i = 0; i < 46; i++) { const th = Math.acos(1 - alea() * 1.15), ph = alea() * Math.PI * 2, dd = new T.Vector3(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)); if (dd.z > 0.6 && dd.y < 0.55) continue; TACHES.push([dd, 0.07 + alea() * 0.09]); } /* (la ligne de la bouche, en direction : elle tombe aux coins) */
  const forme = (d) => {
    let x = d.x * P.tx, y = d.y * P.ty, z = d.z * P.tz;
    const avant = sst(0.0, 0.85, d.z) * sst(-0.35, 0.35, d.y); y += avant * (0.32 + P.haut); z += avant * 0.32; x *= 1 - avant * 0.12; /* (la tete, fondue dans le corps, vers l'avant et le haut) */
    const md = d.y - bouche(d.x), sillon = d.z > 0.2 ? Math.exp(-(md * md) / 0.0009) * sst(0.2, 0.55, d.z) : 0; /* (le pli de la bouche) */
    let bosse = 0; for (const [c, h, r] of verrues) { const a = d.angleTo(c); if (a < r * 2.5) bosse += h * Math.exp(-(a * a) / (r * r * 0.5)); }
    for (const sx of [-1, 1]) { const c = new T.Vector3(sx * 0.5, 0.62, 0.42).normalize(), a = d.angleTo(c); bosse += 0.12 * Math.exp(-(a * a) / 0.02); } /* (les bosses derriere les yeux) */
    const n = new T.Vector3(x, y, z).normalize(), k = 1 + bosse; let p = new T.Vector3(x * k, y * k, z * k);
    if (p.y < -0.7) p.y = -0.7 + (p.y + 0.7) * 0.25; /* (le dessous a plat, pose au sol) */
    /* la couleur : le ventre creme dessous et a la gorge, le dos marbre, la bouche sombre */
    let c = C(P.peau), tache = 0; for (const [tc, tr] of TACHES) { const a = d.angleTo(tc); if (a < tr * 1.6) tache = Math.max(tache, sst(tr * 1.15, tr * 0.85, a) - 0.4 * sst(tr * 1.6, tr * 1.2, a) * 0); }
    c = c.clone().lerp(C(P.fonce), tache); /* (des taches rondes, sombres, bordees net) */
    const ventre = Math.max(sst(-0.05, -0.5, d.y) * sst(-0.45, 0.05, d.z), sst(0.45, 0.85, d.z) * sst(0.0, -0.25, md) * 1.0); /* (le creme seulement devant et dessous : plus sur le bas du dos) */ c = c.clone().lerp(C(P.ventre), ventre);
    if (ventre < 0.5) c = c.clone().lerp(C(P.fonce), sst(0.2, 0.85, d.y) * sst(0.4, -0.3, d.z) * 0.35); /* (le dos un peu plus fonce, en aplat) */
    if (P.orange && ventre < 0.4) { let to = 0; for (const [tc, tr] of TACHES_O) { const a = d.angleTo(tc); if (a < tr * 1.3) to = Math.max(to, sst(tr * 1.08, tr * 0.88, a)); } if (to) c = c.clone().lerp(C(P.orange), to); } /* (quelques taches orange vif) */
    if (bosse > 0.03 && ventre < 0.5) c = c.clone().lerp(C(P.clair), Math.min(1, (bosse - 0.03) * 12) * 0.7);
    return { p, c };
  };
  const geo = new T.SphereGeometry(1, 200, 150), /* (plus fin : le trait de la bouche sans escaliers, 16/11/2026) */ pos = geo.attributes.position, cols = new Float32Array(pos.count * 3), d = new T.Vector3();
  for (let i = 0; i < pos.count; i++) { d.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize(); DIRS.push(d.x, d.y, d.z); const f = forme(d); pos.setXYZ(i, f.p.x, f.p.y, f.p.z); cols[i * 3] = f.c.r; cols[i * 3 + 1] = f.c.g; cols[i * 3 + 2] = f.c.b; }
  geo.setAttribute('color', new T.BufferAttribute(cols, 3)); geo.computeVertexNormals();
  PART = 'peau';
  const cY = 0.78, corps = maille(geo, new T.MeshToonMaterial({ vertexColors: true, gradientMap: grad }), 0.045); /* (contour plus franc, 16/11/2026) */ corps.position.set(0, cY, -0.1); g.add(corps); PART = 'surface';
  const levre = (fy, x0, x1, ep) => { const pts = []; for (let i = 0; i <= 64; i++) { const x = x0 + (x1 - x0) * i / 64, y = fy(x), dz = Math.sqrt(Math.max(0.02, 1 - x * x - y * y)), dd = new T.Vector3(x, y, dz).normalize(), q = forme(dd).p.multiplyScalar(1.006); pts.push(new T.Vector3(q.x, q.y + cY, q.z - 0.1)); }
    g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 128, ep, 6), new T.MeshBasicMaterial({ color: '#1a2418' }))); }; /* (16/11/2026 : « rends moins flou le trait de la bouche », Mathieu) */
  const ouv = (x) => 0.075 * Math.max(0, 1 - (x / 0.5) ** 2); /* (la bouche entrouverte : ouverte au milieu, fermee aux coins) */
  const surf = (x, y, k) => { const dd = new T.Vector3(x, y, Math.sqrt(Math.max(0.02, 1 - x * x - y * y))).normalize(), q = forme(dd).p.multiplyScalar(k || 1); return new T.Vector3(q.x, q.y + cY, q.z - 0.1); };
  { const NU = 64, NV = 10, Pp = [], Cl = [], I = [], c0 = C('#24090f'), c1 = C('#7a3040'); /* (l'interieur de la bouche, une piece nette, 16/11/2026) */
    for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) { const x = -0.5 + i / NU, v = j / NV, q = surf(x, 0.26 - 0.22 * x * x - v * ouv(x), 1.004), c = c0.clone().lerp(c1, Math.pow(v, 0.8)); Pp.push(q.x, q.y, q.z); Cl.push(c.r, c.g, c.b); }
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a0 = i * (NV + 1) + j, b0 = a0 + NV + 1; I.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1); }
    const ge = new T.BufferGeometry(); ge.setAttribute('position', new T.Float32BufferAttribute(Pp, 3)); ge.setAttribute('color', new T.Float32BufferAttribute(Cl, 3)); ge.setIndex(I);
    g.add(new T.Mesh(ge, new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 }))); }
  levre((x) => 0.26 - 0.22 * x * x, -0.93, 0.93, 0.016); /* (la bouche, d'un coin a l'autre, et la levre du haut) */
  levre((x) => 0.26 - 0.22 * x * x - 0.075 * Math.max(0, 1 - (x / 0.5) ** 2), -0.5, 0.5, 0.013); /* (la levre du bas, la ou elle s'ouvre) */
  const surPeau = (dx, dy, dz, k) => { const dd = new T.Vector3(dx, dy, dz).normalize(), q = forme(dd).p.multiplyScalar(k || 1); return new T.Vector3(q.x, q.y + cY, q.z - 0.1); };
  const a = (o, p, s, r) => { o.position.copy(p); if (s) o.scale.set(s[0], s[1], s[2]); if (r) o.rotation.set(r[0], r[1], r[2]); g.add(o); return o; };
  const sph = (c, o, seg) => maille(new T.SphereGeometry(1, seg || 24, Math.round((seg || 24) * 0.7)), c, o);
  const membre = (c, A, B, r1, r2) => { const dd = B.clone().sub(A), m = maille(new T.CylinderGeometry(r2, r1, dd.length(), 14), c, 0.05); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(Y, dd.normalize()); g.add(m); return m; };
  const V3 = (x, y, z) => new T.Vector3(x, y, z);
  /* la peau des membres (15/11/2026) : la meme que le corps, taches sombres et grain, calculee la ou est chaque sommet */
  const peauA = (q) => { const b = Math.sin(q.x * 6.1 + q.z * 3.3) * Math.sin(q.y * 5.3 - q.x * 2.1) * Math.sin(q.z * 5.7 + q.y * 4.4), f = Math.sin(q.x * 31 + q.y * 7) * Math.sin(q.y * 29 - q.z * 11) * Math.sin(q.z * 27 + q.x * 5);
    let c = C(P.peau); if (b > 0.22) c = c.lerp(C(P.fonce), sst(0.22, 0.3, b)); return c; }; /* (des aplats, sans grain, 16/11/2026) */
  const matPeau = () => new T.MeshToonMaterial({ vertexColors: true, gradientMap: grad });
  const sphP = (centre, sc, rot, contour) => { const ge = new T.SphereGeometry(1, 28, 20), P_ = ge.attributes.position, cl = new Float32Array(P_.count * 3), q = V3();
    for (let i = 0; i < P_.count; i++) { q.set(P_.getX(i) * sc[0], P_.getY(i) * sc[1], P_.getZ(i) * sc[2]).add(centre); const cc = peauA(q); cl[i * 3] = cc.r; cl[i * 3 + 1] = cc.g; cl[i * 3 + 2] = cc.b; }
    ge.setAttribute('color', new T.BufferAttribute(cl, 3)); const m = maille(ge, matPeau(), contour == null ? 0.03 : contour); m.position.copy(centre); m.scale.set(sc[0], sc[1], sc[2]); if (rot) m.rotation.set(rot[0], rot[1], rot[2]); g.add(m); return m; };
  /* --- les yeux : sur le dessus de la tete, iris dore cercle de sombre, pupille en fente, paupiere lourde en biais --- */
  PART = 'ancre';
  /* (refaits le 16/11/2026, « les yeux a retravailler, pourquoi la partie basse est en escalier », Mathieu : la bosse tachetee a peu de facettes coupait
     le globe en dents de scie, et la paupiere cachait presque tout l'iris vu d'en haut. Maintenant : une bosse lisse, un globe dore bien rond tourne vers
     la camera, cercle de sombre, une pupille en fente, une paupiere lourde de la couleur de la peau, bordee d'un trait net) */
  for (const s of [-1, 1]) {
    const e = surPeau(s * 0.4, 0.72, 0.56, 0.97), n = new T.Vector3(s * 0.3, 0.62, 0.72).normalize(), RE = 0.215;
    a(sph(P.peau, 0.03, 64), e.clone().add(V3(0, -0.03, -0.03)), [0.26, 0.24, 0.26]); /* (la bosse de l'oeil, lisse) */
    const ic = e.clone().addScaledVector(n, 0.1), gO = new T.SphereGeometry(1, 64, 48), pO = gO.attributes.position, cO = new Float32Array(pO.count * 3), q = V3();
    for (let k = 0; k < pO.count; k++) { q.set(pO.getX(k), pO.getY(k), pO.getZ(k)); const an = q.angleTo(n), c = C(P.iris).lerp(C('#ffd36a'), 0.35 * sst(0.5, 0.15, an)).lerp(C('#3a2610'), sst(0.98, 1.12, an)); cO[k * 3] = c.r; cO[k * 3 + 1] = c.g; cO[k * 3 + 2] = c.b; }
    gO.setAttribute('color', new T.BufferAttribute(cO, 3)); a(maille(gO, new T.MeshToonMaterial({ vertexColors: true, gradientMap: grad }), 0.035), ic, [RE, RE, RE]); /* (le globe : l'iris dore, un cercle sombre autour) */
    const n2 = n.clone().add(V3(0, -0.12, 0.16)).normalize(), pu = a(sph('#15120c', 0.0, 32), ic.clone().addScaledVector(n2, RE * 0.985), [0.1, 0.03, 0.022]); pu.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), n2); pu.rotateZ(s * 0.12); /* (la pupille en fente) */
    const nh = n2.clone().add(V3(-0.17, 0.12, 0)).normalize(), hl = a(sph('#ffffff', 0.0, 16), ic.clone().addScaledVector(nh, RE + 0.002), [0.032, 0.024, 0.01]); hl.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), nh); /* (un reflet humide) */
    const T0 = Math.PI * 0.32, pau = new T.Group(); pau.position.copy(ic); pau.scale.setScalar(0.25); pau.rotation.set(-0.3, 0, s * 0.36); g.add(pau); /* (la paupiere lourde, en biais : l'air grognon) */
    const capM = new T.MeshToonMaterial({ color: P.peau, gradientMap: grad, side: T.DoubleSide }), cap = new T.Mesh(new T.SphereGeometry(1, 64, 24, 0, Math.PI * 2, 0, T0), capM); cap.castShadow = true; pau.add(cap);
    const capC = new T.Mesh(new T.SphereGeometry(1.035, 64, 24, 0, Math.PI * 2, 0, T0 - 0.04), CONTOUR); pau.add(capC); /* (son contour, sur le dessus seulement) */
    const rim = new T.Mesh(new T.TorusGeometry(Math.sin(T0), 0.075, 12, 96), capM); rim.rotation.x = Math.PI / 2; rim.position.y = Math.cos(T0); pau.add(rim); /* (son bord, arrondi) */
    const T1 = T0 + 0.05, trait = new T.Mesh(new T.TorusGeometry(Math.sin(T1) * 0.92, 0.034, 8, 96), new T.MeshBasicMaterial({ color: '#1a2418' })); trait.rotation.x = Math.PI / 2; trait.position.y = Math.cos(T1) * 0.92; pau.add(trait); /* (le trait net ou elle se pose sur l'oeil) */
  }
  for (const s of [-1, 1]) a(sph('#24301a', 0.0), surPeau(s * 0.12, 0.5, 0.86, 1.0), [0.04, 0.028, 0.03]); /* (les narines) */
  PART = 'langue';
  { const bave = new T.MeshToonMaterial({ color: '#c9f2e2', gradientMap: grad, transparent: true, opacity: 0.7 }); /* (la bave qui pend de la levre, 15/11/2026, comme le Tetard) */
    [[-0.32, 0.24], [-0.14, 0.16]].forEach(([x, L]) => { const l0 = surPeau(x, 0.26 - 0.22 * x * x - 0.075 * Math.max(0, 1 - (x / 0.5) ** 2) - 0.01, 0.9, 1.0);
      const pts = [l0, l0.clone().add(V3(0, -L * 0.5, 0.03)), l0.clone().add(V3(0, -L, 0.02))], cu = new T.CatmullRomCurve3(pts);
      const t1 = new T.Mesh(new T.TubeGeometry(cu, 10, 0.013, 8), bave); g.add(t1); const gt = new T.Mesh(new T.SphereGeometry(1, 12, 10), bave); gt.position.copy(pts[2]).add(V3(0, -0.01, 0)); gt.scale.set(0.024, 0.034, 0.024); g.add(gt); }); }
  /* --- les pattes avant (refaites le 15/11/2026, « travaille un peu plus les pattes avant », Mathieu) : un bras d'un seul tenant qui s'affine
     (epaule epaisse, coude ecarte vers l'arriere, avant-bras galbe, poignet fin), une main posee a plat et quatre doigts courbes vers le sol, a coussinets --- */
  const tube = (pts, rf, c, seg, rad, contour) => { seg = seg || 28; rad = rad || 14; const cu = new T.CatmullRomCurve3(pts), fr = cu.computeFrenetFrames(seg, false), Pp = [], I = [];
    for (let i = 0; i <= seg; i++) { const t = i / seg, q = cu.getPointAt(t), N = fr.normals[i], B = fr.binormals[i], r = rf(t);
      for (let k = 0; k <= rad; k++) { const an = k / rad * Math.PI * 2, ca = Math.cos(an), sa = Math.sin(an); Pp.push(q.x + r * (ca * N.x + sa * B.x), q.y + r * (ca * N.y + sa * B.y), q.z + r * (ca * N.z + sa * B.z)); } }
    for (let i = 0; i < seg; i++) for (let k = 0; k < rad; k++) { const a0 = i * (rad + 1) + k, b0 = a0 + rad + 1; I.push(a0, a0 + 1, b0, b0, a0 + 1, b0 + 1); }
    const ge = new T.BufferGeometry(); ge.setAttribute('position', new T.Float32BufferAttribute(Pp, 3)); ge.setIndex(I);
    if (c === 'peau') { const cl = new Float32Array(Pp.length), q = V3(); for (let i = 0; i < Pp.length; i += 3) { const cc = peauA(q.set(Pp[i], Pp[i + 1], Pp[i + 2])); cl[i] = cc.r; cl[i + 1] = cc.g; cl[i + 2] = cc.b; } ge.setAttribute('color', new T.BufferAttribute(cl, 3)); } /* (la peau peinte) */
    ge.computeBoundingBox(); const ce = ge.boundingBox.getCenter(new T.Vector3()); ge.translate(-ce.x, -ce.y, -ce.z); ge.computeVertexNormals();
    const m = maille(ge, c === 'peau' ? matPeau() : c, contour == null ? 0.035 : contour); m.position.copy(ce); g.add(m);
    for (const t of [0, 1]) { const q = cu.getPointAt(t), b = maille(new T.SphereGeometry(1, 14, 10), c === 'peau' ? '#' + peauA(q).getHexString() : c, contour == null ? 0.035 : contour); b.position.copy(q); b.scale.setScalar(rf(t)); g.add(b); } return cu; };
  if (P.langue) { /* la langue (refaite le 16/11/2026 : « notre langue est rattachee a notre corps », Mathieu) : un ruban de chair plat, ne au fond de la bouche,
     qui passe sur la levre du bas et se couche sur le menton, le bout large et arrondi, un sillon au milieu */
    const yb = (x) => 0.26 - 0.22 * x * x, nrm = (x, y) => { const e = 0.01, a0 = surf(x - e, y), a1 = surf(x + e, y), b0 = surf(x, y - e), b1 = surf(x, y + e); return new T.Vector3().crossVectors(a1.sub(a0), b1.sub(b0)).normalize(); };
    const sur = (x, y, h) => surf(x, y).addScaledVector(nrm(x, y), h), H = 0.03;
    const pts = [surf(0.1, yb(0.1) - ouv(0.1) - 0.03, 0.82), surf(0.15, yb(0.15) - 0.8 * ouv(0.15), 0.94), sur(0.18, yb(0.18) - ouv(0.18) - 0.015, H), sur(0.2, yb(0.2) - ouv(0.2) - 0.1, H), sur(0.215, yb(0.215) - ouv(0.215) - 0.2, H), sur(0.225, yb(0.225) - ouv(0.225) - 0.29, H)];
    const cu = new T.CatmullRomCurve3(pts, false, 'centripetal'), seg = 56, rad = 24, Pp = [], Cl = [], I = [], cl = C(P.langue), cs = C(P.langue).multiplyScalar(0.7), B0 = V3(1, -0.08, 0);
    for (let i = 0; i <= seg; i++) { const t = i / seg, q = cu.getPointAt(t), tg = cu.getTangentAt(t), B = B0.clone().addScaledVector(tg, -B0.dot(tg)).normalize(), N = new T.Vector3().crossVectors(tg, B).normalize();
      const bout = t > 0.74 ? Math.sqrt(Math.max(0, 1 - ((t - 0.74) / 0.26) ** 2)) : 1, w = (0.085 + 0.085 * t * t) * bout, h = (0.02 + 0.014 * t) * bout;
      for (let k = 0; k <= rad; k++) { const an = k / rad * Math.PI * 2, u = Math.cos(an), v = Math.sin(an), sil = v > 0 ? 0.45 * v * Math.exp(-(u * u) / 0.03) * sst(0.3, 0.5, t) : 0, vv = v - sil;
        Pp.push(q.x + B.x * w * u + N.x * h * vv, q.y + B.y * w * u + N.y * h * vv, q.z + B.z * w * u + N.z * h * vv); const c = cl.clone().lerp(cs, sil * 1.6 * sst(0.35, 0.5, t) * sst(0.85, 0.7, t)); Cl.push(c.r, c.g, c.b); } }
    for (let i = 0; i < seg; i++) for (let k = 0; k < rad; k++) { const a0 = i * (rad + 1) + k, b0 = a0 + rad + 1; I.push(a0, a0 + 1, b0, b0, a0 + 1, b0 + 1); }
    const ge = new T.BufferGeometry(); ge.setAttribute('position', new T.Float32BufferAttribute(Pp, 3)); ge.setAttribute('color', new T.Float32BufferAttribute(Cl, 3)); ge.setIndex(I);
    ge.computeBoundingBox(); const ce = ge.boundingBox.getCenter(new T.Vector3()); ge.translate(-ce.x, -ce.y, -ce.z); ge.computeVertexNormals();
    const lg = maille(ge, new T.MeshToonMaterial({ vertexColors: true, gradientMap: grad }), 0.04); lg.position.copy(ce); g.add(lg);
    { const NU = 12, NV = 12, Q = [], K = [], J = [], cA = C(P.langue).multiplyScalar(0.88), cB = C('#262a5e'); /* (la langue dans la bouche, jusqu'au fond) */
      for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) { const v = 0.08 + 0.92 * j / NV, hw = 0.05 + 0.03 * v, x = 0.175 + (i / NU * 2 - 1) * hw, q = surf(x, yb(x) - v * ouv(x), 1.006), u = i / NU * 2 - 1;
        const c = cB.clone().lerp(cA, Math.pow((v - 0.08) / 0.92, 0.7)).lerp(cB, 0.35 * Math.exp(-(u * u) / 0.02) * v); Q.push(q.x, q.y, q.z); K.push(c.r, c.g, c.b); }
      for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a0 = i * (NV + 1) + j, b0 = a0 + NV + 1; J.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1); }
      const gq = new T.BufferGeometry(); gq.setAttribute('position', new T.Float32BufferAttribute(Q, 3)); gq.setAttribute('color', new T.Float32BufferAttribute(K, 3)); gq.setIndex(J);
      g.add(new T.Mesh(gq, new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 }))); } }
  for (const s of [-1, 1]) {
    const ep = surPeau(s * 0.6, -0.12, 0.58, 0.82), co = V3(s * (P.tx * 1.04), 0.3, 0.3), av = V3(s * (P.tx * 0.98), 0.2, 0.62), po = V3(s * (P.tx * 0.84), 0.09, 0.84);
    const cote = s > 0 ? 'G' : 'D', mi = V3(s * (P.tx * 0.92), 0.5, 0.42); PART = 'chaine:bras' + cote; /* (le squelette : epaule, coude, poignet) */
    CH['bras' + cote] = { pivots: [['bras' + cote, ep], ['avantbras' + cote, co], ['main' + cote, po]], segs: [[ep, mi, 'bras' + cote], [mi, co, 'bras' + cote], [co, av, 'avantbras' + cote], [av, po, 'avantbras' + cote], [po, po.clone().add(V3(0, -0.03, 0.3)), 'main' + cote]] };
    tube([ep, V3(s * (P.tx * 0.92), 0.5, 0.42), co, av, po], (t) => 0.23 - 0.07 * t + 0.04 * Math.exp(-((t - 0.62) ** 2) / 0.012) - (t > 0.85 ? (t - 0.85) * 0.25 : 0), 'peau', 40, 20); /* (le bras, l'avant-bras galbe) */
    PART = 'ancre:main' + cote;
    sphP(po.clone().add(V3(0, -0.03, 0.06)), [0.2, 0.075, 0.18], [0, -s * 0.3, 0]); /* (la paume, a plat) */
    for (let k = 0; k < 4; k++) { const b = (-0.6 + k * 0.4) * s - s * 0.25, dir = V3(Math.sin(b), 0, Math.cos(b)), L = k === 1 || k === 2 ? 0.3 : 0.24, p0 = po.clone().add(V3(0, -0.01, 0.06));
      const p1 = p0.clone().addScaledVector(dir, L * 0.5).add(V3(0, 0.035, 0)), p2 = p0.clone().addScaledVector(dir, L).add(V3(0, -0.035, 0));
      tube([p0, p1, p2], (t) => 0.052 - 0.014 * t, 'peau', 12, 12, 0.06);
      a(sph(P.clair, 0.05), p2.clone().addScaledVector(dir, 0.025).add(V3(0, -0.005, 0)), [0.058, 0.04, 0.062]); } /* (les doigts courbes, un coussinet au bout) */
  }
  /* --- les pattes arriere repliees : la cuisse, la jambe le long, un long pied palme a cinq doigts --- */
  for (const s of [-1, 1]) {
    const cote = s > 0 ? 'G' : 'D'; PART = 'ancre:cuisse' + cote;
    const cu = surPeau(s * 0.85, -0.25, -0.25, 0.86); sphP(cu, [0.52, 0.48, 0.66], [0, s * 0.3, 0]);
    const ta = V3(s * (P.tx * 1.0), 0.14, -0.55), pi = V3(s * (P.tx * 1.08), 0.06, 0.18), hanche = cu.clone().add(V3(s * 0.15, -0.25, -0.25)); PART = 'chaine:jambe' + cote;
    CH['jambe' + cote] = { pivots: [['cuisse' + cote, cu], ['jambe' + cote, ta], ['pied' + cote, pi]], segs: [[hanche, ta, 'cuisse' + cote], [ta, pi, 'jambe' + cote], [pi, pi.clone().add(V3(-s * 0.1, 0, 0.4)), 'pied' + cote]] };
    tube([cu.clone().add(V3(s * 0.15, -0.25, -0.25)), ta, pi], (t) => 0.16 - 0.07 * t, 'peau', 24, 16); /* (la jambe, d'un seul tenant) */
    PART = 'ancre:pied' + cote;
    const pa = new T.Group(); pa.position.copy(pi); pa.rotation.y = -s * 0.25; g.add(pa);
    const toile = maille(new T.SphereGeometry(1, 20, 12), P.clair, 0.05); toile.scale.set(0.3, 0.035, 0.32); toile.position.set(0, -0.02, 0.2); pa.add(toile); /* (la palmure) */
    for (let k = 0; k < 5; k++) { const b = -0.6 + k * 0.3, L = 0.34 + (k === 2 ? 0.08 : 0) - Math.abs(k - 2) * 0.03, t = V3(Math.sin(b) * L, -0.02, Math.cos(b) * L);
      const doigt = maille(new T.CylinderGeometry(0.035, 0.045, L, 10), '#' + peauA(pi).getHexString(), 0.06); doigt.position.copy(t).multiplyScalar(0.5); doigt.quaternion.setFromUnitVectors(Y, t.clone().normalize()); pa.add(doigt);
      const bout = maille(new T.SphereGeometry(1, 10, 8), P.clair, 0.05); bout.position.copy(t); bout.scale.set(0.055, 0.04, 0.055); pa.add(bout); }
  }
  /* --- les grappes d'oeufs qui luisent, un petit tetard sombre dans chacun --- */
  /* les grappes d'oeufs (refaites le 16/11/2026, finitions) : poses sur la peau, en suivant la courbe du dos, serres sur une gelee translucide ; chacun luit, un petit tetard sombre dedans */
  PART = 'ancre';
  const MGELEE = new T.MeshToonMaterial({ color: C(P.oeuf).lerp(C(P.peau), 0.35), gradientMap: grad, transparent: true, opacity: 0.55 });
  const oeufs = (centre, n, cap) => { const c0 = centre.clone().normalize(), u = new T.Vector3().crossVectors(c0, Math.abs(c0.y) < 0.9 ? Y : new T.Vector3(1, 0, 0)).normalize(), w = new T.Vector3().crossVectors(c0, u);
    const base = surPeau(c0.x, c0.y, c0.z, 1.0), gel = new T.Mesh(new T.SphereGeometry(1, 24, 16), MGELEE); gel.position.copy(base); gel.scale.set(cap * 1.05, cap * 1.05, 0.1); gel.lookAt(base.clone().add(new T.Vector3(c0.x, c0.y, c0.z))); g.add(gel);
    for (let i = 0; i < n; i++) { const a = cap * Math.sqrt((i + 0.5) / n), b = i * 2.399, dir = c0.clone().multiplyScalar(Math.cos(a)).addScaledVector(u, Math.cos(b) * Math.sin(a)).addScaledVector(w, Math.sin(b) * Math.sin(a)).normalize();
      const r = 0.13 + ((i * 7) % 5) * 0.013, q = surPeau(dir.x, dir.y, dir.z, 1.0), nn = q.clone().sub(new T.Vector3(0, cY, -0.1)).normalize(), pos = q.addScaledVector(nn, r * 0.55);
      const o = maille(new T.SphereGeometry(1, 16, 12), new T.MeshToonMaterial({ color: P.oeuf, gradientMap: grad, emissive: C(P.oeuf).multiplyScalar(0.3), transparent: true, opacity: 0.82 })); o.position.copy(pos); o.scale.setScalar(r); g.add(o);
      const em = maille(new T.SphereGeometry(1, 10, 8), '#1f5a28', 0.0); em.position.copy(pos).addScaledVector(nn, r * 0.25); em.scale.set(r * 0.32, r * 0.32, r * 0.25); g.add(em); } };
  if (P.oeufs === 'flancs') for (const s of [-1, 1]) oeufs(new T.Vector3(s * 0.9, 0.35, -0.3), 22, 0.36);
  if (P.oeufs === 'dos') oeufs(new T.Vector3(0, 0.25, -1), 30, 0.5);
  if (P.oeufs === 'dessus') for (const s of [-1, 1]) oeufs(new T.Vector3(s * 0.45, 0.85, -0.25), 14, 0.3);
  /* --- le nenuphar sur la tete : une grande feuille ronde a encoche, ses nervures, un bord releve, une fleur rose ouverte --- */
  const haut = surPeau(0, 1, -0.1, 1.0), nen = new T.Group(); nen.position.copy(haut).add(V3(0.04, 0.02, -0.08)); nen.rotation.set(-0.12, 0.6, -0.08); /* (16/11/2026, finitions : pose sur la tete, il l'epouse) */ /* (derriere les yeux, qu'ils restent degages) */ nen.userData.part = 'os:corps'; g.add(nen); /* (une piece a part, portee par le corps : sa fleur s'ouvre en rage) */
  const R = v === 3 ? 0.84 : 0.72, forme2 = new T.Shape(); forme2.moveTo(0, 0); forme2.absarc(0, 0, R, 0.22, Math.PI * 2 - 0.22, false); forme2.lineTo(0, 0);
  const feuille = new T.ExtrudeGeometry(forme2, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.02, bevelSegments: 2, curveSegments: 48 }); feuille.rotateX(-Math.PI / 2);
  nen.updateMatrix(); const MN = nen.matrix.clone(), MNi = MN.clone().invert(), c0 = V3(0, cY, -0.1); /* la feuille posee sur la tete : chaque point a sa hauteur au-dessus de la peau */
  const lisse = (d) => { let x = d.x * P.tx, y = d.y * P.ty, z = d.z * P.tz; const av = sst(0.0, 0.85, d.z) * sst(-0.35, 0.35, d.y); y += av * (0.32 + P.haut); z += av * 0.32; x *= 1 - av * 0.12; let b = 0; for (const sx of [-1, 1]) { const a = d.angleTo(V3(sx * 0.5, 0.62, 0.42).normalize()); b += 0.12 * Math.exp(-(a * a) / 0.02); } return V3(x, y, z).multiplyScalar(1 + b); };
  const rayon = (u) => { const d = u.clone(); for (let k = 0; k < 6; k++) d.add(u.clone().sub(lisse(d).normalize())).normalize(); return lisse(d).length(); };
  const poserN = (x, z, h) => { const u = V3(x, 0, z).applyMatrix4(MN).sub(c0).normalize(); return c0.clone().addScaledVector(u, rayon(u) + 0.022 + h).applyMatrix4(MNi); };
  const fp = feuille.attributes.position; for (let i = 0; i < fp.count; i++) { const q = poserN(fp.getX(i), fp.getZ(i), fp.getY(i) + 0.015); fp.setXYZ(i, q.x, q.y, q.z); } feuille.computeVertexNormals();
  const fe = maille(feuille, '#5f9a3a', 0.02); nen.add(fe);
  for (let k = 0; k < 9; k++) { const b = 0.4 + k / 8 * (Math.PI * 2 - 0.8), pts = []; for (let t = 0; t <= 6; t++) { const r = t / 6 * R * 0.9; pts.push(poserN(Math.cos(b) * r, -Math.sin(b) * r, 0.07)); }
    nen.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 12, 0.011, 5), new T.MeshToonMaterial({ color: '#8cc35a', gradientMap: grad }))); } /* (les nervures, qui suivent la courbe de la feuille) */
  const fleur = new T.Group(); fleur.name = 'fleur'; fleur.position.copy(poserN(-0.12, 0.1, 0.06)); fleur.scale.setScalar(1.6); nen.add(fleur); /* (plus grosse, 16/11/2026 ; elle s'ouvre quand la Mere enrage) */
  [[8, 0.32, 0.9, '#eaa0b4'], [7, 0.26, 0.55, '#f4c2d0'], [5, 0.18, 0.25, '#fbe0e8']].forEach(([n, L, ouv, c], j) => { for (let k = 0; k < n; k++) { const b = k / n * Math.PI * 2 + j * 0.3, pe = maille(new T.SphereGeometry(1, 14, 10), c, 0.05);
    pe.scale.set(0.085, 0.04, L * 0.5); pe.name = 'petale'; pe.userData.L = L; pe.userData.ouv = ouv; const piv = new T.Group(); piv.rotation.y = b; pe.position.set(0, L * 0.5 * Math.sin(ouv), L * 0.5 * Math.cos(ouv)); pe.rotation.x = -ouv; piv.add(pe); fleur.add(piv); } });
  const coeur = maille(new T.SphereGeometry(1, 12, 10), '#f5d36a', 0.05); coeur.scale.set(0.09, 0.06, 0.09); coeur.position.y = 0.06; fleur.add(coeur);
  const goutte = maille(new T.SphereGeometry(1, 12, 10), new T.MeshToonMaterial({ color: '#cfeaff', gradientMap: grad, transparent: true, opacity: 0.75 })); goutte.scale.set(0.06, 0.04, 0.06); goutte.position.copy(poserN(R * 0.4, -R * 0.28, 0.08)); nen.add(goutte); /* (une goutte d'eau) */
  g.traverse((o) => { if (o.isMesh) o.receiveShadow = false; }); /* (comme les monstres du jeu : pas d'ombre sur soi-meme, sinon des stries sur le ventre) */
  /* a la taille du jeu : 5 de haut, les pieds au sol */
  /* LE SQUELETTE (16/11/2026, « fais-leur un squelette, la ca va pas du tout », Mathieu) : les memes os et les memes mouvements que l'ancienne Mere
     (racine, corps, tete, machoire, gorge, bras / avant-bras / main, cuisse / jambe / pied ; repos, marche, course, coup, tir, sort, rugir, touche, mort).
     Les pieces sont cuites en quelques maillages a squelette : la peau du corps (poids selon l'endroit), les pattes (poids selon la distance aux os),
     ce qui suit la peau (levres, bouche, langue, bave : les poids du point de peau le plus proche), les pieces rigides (un os) ; le nenuphar et sa fleur
     restent une piece a part, portee par l'os du corps. fabriquerMereJeu2(v, true) rend le modele anime, comme un glb a squelette du jeu. */
  const squeletter = () => {
    g.updateMatrixWorld(true);
    const PIV = [['racine', V3(0, 0.08, -0.1), null], ['corps', V3(0, cY, -0.1), 'racine'], ['tete', V3(0, cY + 0.2, 0.25), 'corps'], ['machoire', surf(0, bouche(0) - 0.035, 1.0), 'tete'], ['gorge', V3(0, cY - 0.3, 0.45), 'corps']];
    for (const ch of Object.values(CH)) ch.pivots.forEach(([n, q], i) => PIV.push([n, q.clone(), i ? ch.pivots[i - 1][0] : 'corps']));
    const OS = {}, MONDE = {}, IDX = {}; PIV.forEach(([n, q, par], i) => { const b = new T.Bone(); b.name = n; MONDE[n] = q; b.position.copy(par ? q.clone().sub(MONDE[par]) : q); if (par) OS[par].add(b); OS[n] = b; IDX[n] = i; });
    /* la peau du corps : la tete au-dessus de la bouche, la gorge dessous, un peu des bras et des cuisses a leur attache, le reste au corps */
    const poidsPeau = (d) => { const md = d.y - bouche(d.x), W = {}, wt = sst(-0.06, 0.02, md) * sst(-0.15, 0.3, d.z), wg = (1 - wt) * sst(0.0, -0.1, md) * sst(0.25, 0.55, d.z) * sst(-0.85, -0.5, d.y) * sst(0.75, 0.45, Math.abs(d.x)); let reste = 1 - wt - wg; W.tete = wt; W.gorge = wg;
      for (const c of ['G', 'D']) { const sg = c === 'G' ? 1 : -1, aB = d.angleTo(V3(sg * 0.6, -0.12, 0.58).normalize()), wb = Math.min(reste, 0.35 * sst(0.45, 0.15, aB)); if (wb > 0) { W['bras' + c] = wb; reste -= wb; }
        const aC = d.angleTo(V3(sg * 0.85, -0.25, -0.25).normalize()), wc = Math.min(reste, 0.4 * sst(0.6, 0.25, aC)); if (wc > 0) { W['cuisse' + c] = wc; reste -= wc; } }
      W.corps = Math.max(0, reste); return W; };
    const NB = DIRS.length / 3, PW = [], BP = new Float32Array(NB * 3), dd = V3(), cp = g.children.find((o) => o.userData.part === 'peau').children[0].geometry.attributes.position;
    for (let i = 0; i < NB; i++) { PW.push(poidsPeau(dd.set(DIRS[i * 3], DIRS[i * 3 + 1], DIRS[i * 3 + 2]))); BP[i * 3] = cp.getX(i); BP[i * 3 + 1] = cp.getY(i) + cY; BP[i * 3 + 2] = cp.getZ(i) - 0.1; }
    const CEL = 0.08, GR = new Map(), fl = (x) => Math.floor(x / CEL), cle = (a, b, c) => a + ',' + b + ',' + c;
    for (let i = 0; i < NB; i++) { const k = cle(fl(BP[i * 3]), fl(BP[i * 3 + 1]), fl(BP[i * 3 + 2])); let L = GR.get(k); if (!L) GR.set(k, L = []); L.push(i); }
    const proche = (q) => { const cx = fl(q.x), cy = fl(q.y), cz = fl(q.z); let best = 0, bd = Infinity; /* (le point de peau le plus proche) */
      for (let r = 1; r <= 14; r++) { for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (let c = -r; c <= r; c++) { if (r > 1 && Math.max(Math.abs(a), Math.abs(b), Math.abs(c)) !== r) continue; const L = GR.get(cle(cx + a, cy + b, cz + c)); if (L) for (const i of L) { const e = (BP[i * 3] - q.x) ** 2 + (BP[i * 3 + 1] - q.y) ** 2 + (BP[i * 3 + 2] - q.z) ** 2; if (e < bd) { bd = e; best = i; } } }
        if (bd < ((r - 0.5) * CEL) ** 2) break; } return best; };
    const dirDe = (q) => { const u = q.clone().sub(c0).normalize(), d = u.clone(); for (let k = 0; k < 6; k++) d.add(u.clone().sub(lisse(d).normalize())).normalize(); return d; };
    const poidsLangue = (q) => { const W = poidsPeau(dirDe(q)); W.corps = (W.corps || 0) + W.tete; W.tete = 0; return W; }; /* (la langue et la bave : la machoire du bas) */
    const dSeg = (q, a, b) => { const ab = b.clone().sub(a), t = Math.max(0, Math.min(1, q.clone().sub(a).dot(ab) / ab.lengthSq())); return q.distanceTo(a.clone().addScaledVector(ab, t)); };
    const poidsChaine = (ch, q) => { const W = {}; ch.segs.forEach(([a, b, n]) => { const e = dSeg(q, a, b), w = 1 / Math.pow(e * e + 0.003, 2); W[n] = Math.max(W[n] || 0, w); }); return W; };
    const ecrire = (W, SI, SW, i) => { const L = Object.entries(W).filter(([n, w]) => w > 1e-6 && IDX[n] != null).sort((a, b) => b[1] - a[1]).slice(0, 4), t = L.reduce((x, [, w]) => x + w, 0);
      if (!t) { SI[i * 4] = IDX.corps; SW[i * 4] = 1; return; } L.forEach(([n, w], k) => { SI[i * 4 + k] = IDX[n]; SW[i * 4 + k] = w / t; }); };
    /* les pieces, cuites dans le repere du modele et rangees par matiere */
    const LOTS = { peau: [], contour: [], plat: [], oeufs: [], voile: [] }, ATT = [], q = V3(), nq = V3();
    for (const top of [...g.children]) { const part = top.userData.part || 'ancre';
      if (part.startsWith('os:')) { ATT.push([top, part.slice(3)]); continue; }
      const ch = part.startsWith('chaine:') ? CH[part.slice(7)] : null; let fixe = null;
      if (part.startsWith('ancre')) { const n = part.split(':')[1]; fixe = n ? { [n]: 1 } : PW[proche(new T.Box3().setFromObject(top).getCenter(V3()))]; }
      top.traverse((o) => { if (!o.isMesh) return; const M = o.material, ge = o.geometry; if (M === CONTOUR && o.scale.x < 1.002) return; /* (un contour nul) */
        const lot = M === CONTOUR ? 'contour' : M.isMeshBasicMaterial ? 'plat' : M.transparent ? (M.opacity > 0.8 ? 'oeufs' : 'voile') : 'peau'; if (!ge.attributes.normal) ge.computeVertexNormals();
        const n = ge.attributes.position.count, Mw = o.matrixWorld, N3 = new T.Matrix3().getNormalMatrix(Mw), P_ = new Float32Array(n * 3), N_ = new Float32Array(n * 3), C_ = new Float32Array(n * 3), SI = new Uint16Array(n * 4), SW = new Float32Array(n * 4);
        const ca = M.vertexColors && ge.attributes.color, mc = M.color || C('#ffffff'), k = lot === 'oeufs' ? 1.3 : 1; /* (les oeufs : leur lueur dans leur couleur) */
        for (let i = 0; i < n; i++) { q.fromBufferAttribute(ge.attributes.position, i).applyMatrix4(Mw); P_[i * 3] = q.x; P_[i * 3 + 1] = q.y; P_[i * 3 + 2] = q.z; nq.fromBufferAttribute(ge.attributes.normal, i).applyMatrix3(N3).normalize(); N_[i * 3] = nq.x; N_[i * 3 + 1] = nq.y; N_[i * 3 + 2] = nq.z;
          C_[i * 3] = (ca ? ca.getX(i) : 1) * mc.r * k; C_[i * 3 + 1] = (ca ? ca.getY(i) : 1) * mc.g * k; C_[i * 3 + 2] = (ca ? ca.getZ(i) : 1) * mc.b * k;
          ecrire(part === 'peau' ? PW[i] : ch ? poidsChaine(ch, q) : part === 'surface' ? poidsPeau(dirDe(q)) : part === 'langue' ? poidsLangue(q) : fixe, SI, SW, i); }
        LOTS[lot].push({ P: P_, N: N_, C: C_, SI, SW, I: ge.index ? ge.index.array : null, n }); }); }
    const fusion = (L) => { let n = 0, ni = 0; L.forEach((x) => { n += x.n; ni += x.I ? x.I.length : x.n; });
      const P_ = new Float32Array(n * 3), N_ = new Float32Array(n * 3), C_ = new Float32Array(n * 3), SI = new Uint16Array(n * 4), SW = new Float32Array(n * 4), I = new Uint32Array(ni); let o = 0, oi = 0;
      L.forEach((x) => { P_.set(x.P, o * 3); N_.set(x.N, o * 3); C_.set(x.C, o * 3); SI.set(x.SI, o * 4); SW.set(x.SW, o * 4); const m = x.I ? x.I.length : x.n; for (let k = 0; k < m; k++) I[oi + k] = (x.I ? x.I[k] : k) + o; oi += m; o += x.n; });
      const ge = new T.BufferGeometry(); ge.setAttribute('position', new T.BufferAttribute(P_, 3)); ge.setAttribute('normal', new T.BufferAttribute(N_, 3)); ge.setAttribute('color', new T.BufferAttribute(C_, 3));
      ge.setAttribute('skinIndex', new T.BufferAttribute(SI, 4)); ge.setAttribute('skinWeight', new T.BufferAttribute(SW, 4)); ge.setIndex(new T.BufferAttribute(I, 1)); ge.computeBoundingSphere(); return ge; };
    while (g.children.length) g.remove(g.children[0]);
    for (const [o, n] of ATT) { o.position.sub(MONDE[n]); OS[n].add(o); } /* (le nenuphar, porte par le corps) */
    g.add(OS.racine); g.updateMatrixWorld(true); const sq = new T.Skeleton(PIV.map(([n]) => OS[n]));
    const MATS = { peau: new T.MeshToonMaterial({ vertexColors: true, gradientMap: grad, skinning: true, side: T.DoubleSide }), contour: new T.MeshBasicMaterial({ color: '#3a2b1f', side: T.BackSide, skinning: true }),
      plat: new T.MeshBasicMaterial({ vertexColors: true, skinning: true, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 }),
      oeufs: new T.MeshToonMaterial({ vertexColors: true, gradientMap: grad, skinning: true, transparent: true, opacity: 0.82 }), voile: new T.MeshToonMaterial({ vertexColors: true, gradientMap: grad, skinning: true, transparent: true, opacity: 0.62 }) };
    for (const [lot, L] of Object.entries(LOTS)) { if (!L.length) continue; const sm = new T.SkinnedMesh(fusion(L), MATS[lot]); sm.name = lot === 'contour' || lot === 'plat' ? 'contour' : 'mere-' + lot; /* (« contour » : ni eclat ni teinte, comme les contours du jeu) */
      sm.frustumCulled = false; sm.castShadow = lot === 'peau'; sm.receiveShadow = false; g.add(sm); sm.bind(sq, new T.Matrix4()); }
    /* LES MOUVEMENTS : chaque pose est une fonction du temps (u de 0 a 1), echantillonnee a 30 images par seconde ; r : rotations (x, y, z) des os,
       p : decalage de la position de la racine, s : echelle (le corps qui s'ecrase, la gorge qui gonfle). G est le cote x positif. */
    const clips = [], bo = (a, b, c, x) => sst(a, b, x) * (1 - sst(b, c, x)), PI2 = Math.PI * 2;
    const cl = (nom, duree, pose) => { const nb = Math.max(2, Math.round(duree * 30)), poses = [], tps = [], pistes = []; for (let k = 0; k <= nb; k++) { poses.push(pose(k / nb)); tps.push(k / nb * duree); }
      const noms = (c) => [...new Set([].concat(...poses.map((x) => Object.keys(x[c] || {}))))];
      for (const n of noms('r')) { const v = []; poses.forEach((x) => { const e = (x.r && x.r[n]) || [0, 0, 0], qq = new T.Quaternion().setFromEuler(new T.Euler(e[0], e[1], e[2])); v.push(qq.x, qq.y, qq.z, qq.w); }); pistes.push(new T.QuaternionKeyframeTrack(n + '.quaternion', tps, v)); }
      for (const n of noms('p')) { const v = [], b = OS[n].position; poses.forEach((x) => { const e = (x.p && x.p[n]) || [0, 0, 0]; v.push(b.x + e[0], b.y + e[1], b.z + e[2]); }); pistes.push(new T.VectorKeyframeTrack(n + '.position', tps, v)); }
      for (const n of noms('s')) { const v = []; poses.forEach((x) => { let e = x.s && x.s[n]; if (e == null) e = 1; if (typeof e === 'number') e = [e, e, e]; v.push(e[0], e[1], e[2]); }); pistes.push(new T.VectorKeyframeTrack(n + '.scale', tps, v)); }
      clips.push(new T.AnimationClip(nom, duree, pistes)); };
    const cotes = (f) => { const r = {}; for (const c of ['G', 'D']) Object.assign(r, f(c, c === 'G' ? 1 : -1)); return r; };
    cl('repos_1', 2.6, (u) => { const ph = PI2 * u, b = Math.sin(ph), gg = Math.pow(0.5 - 0.5 * Math.cos(2 * ph), 2); /* (elle respire, la gorge bat deux fois) */
      return { s: { corps: [1 + 0.012 * b, 1 + 0.022 * b, 1 + 0.012 * b], gorge: [1 + 0.1 * gg, 1 + 0.08 * gg, 1 + 0.14 * gg] }, r: { tete: [-0.03 * (0.5 - 0.5 * Math.cos(ph)), 0.05 * Math.sin(ph), 0] } }; });
    cl('marche_1', 1.4, (u) => { const ph = PI2 * u, sn = Math.sin(ph); /* (elle avance une main puis l'autre, en se dandinant) */
      return { r: Object.assign({ corps: [0.03 * Math.sin(2 * ph), 0, 0.05 * sn], tete: [0, 0.05 * sn, -0.03 * sn] }, cotes((c, sg) => { const l = Math.max(0, sg * sn); return { ['bras' + c]: [-0.45 * l, 0, sg * 0.1 * l], ['avantbras' + c]: [-0.2 * l, 0, 0], ['cuisse' + c]: [0.12 * Math.sin(ph + sg * Math.PI / 2), 0, 0] }; })),
        p: { racine: [0, 0.02 * (0.5 - 0.5 * Math.cos(2 * ph)), 0] } }; });
    cl('course_1', 0.9, (u) => { const ac = bo(0.0, 0.2, 0.32, u), w = (u - 0.3) / 0.45, h = u > 0.3 && u < 0.75 ? 4 * w * (1 - w) : 0, at = bo(0.7, 0.8, 1.0, u), ja = bo(0.24, 0.4, 0.72, u), br = bo(0.3, 0.5, 0.76, u), dec = bo(0.18, 0.34, 0.6, u); /* (le bond : elle se ramasse, saute, retombe) */
      return { r: Object.assign({ corps: [-0.22 * dec + 0.14 * at, 0, 0], tete: [0.08 * at - 0.08 * h, 0, 0] }, cotes((c, sg) => ({ ['bras' + c]: [-0.32 * br + 0.1 * at, 0, sg * 0.1 * br], ['avantbras' + c]: [0.3 * br, 0, 0], ['cuisse' + c]: [0.6 * ja, 0, sg * 0.06 * ja], ['jambe' + c]: [0.5 * ja, 0, 0], ['pied' + c]: [0.3 * ja, 0, 0] }))),
        p: { racine: [0, 0.42 * h - 0.04 * ac - 0.05 * at, 0] }, s: { corps: [1 + 0.05 * ac + 0.06 * at - 0.02 * h, 1 - 0.1 * ac + 0.06 * h - 0.12 * at, 1 + 0.05 * ac + 0.06 * at] } }; });
    cl('coup_1', 1.2, (u) => { const up = sst(0.0, 0.42, u) * (1 - sst(0.42, 0.52, u)), im = sst(0.44, 0.52, u) * (1 - sst(0.65, 1.0, u)); /* (elle se dresse, mains en l'air, et retombe de tout son poids, impact a 0,52) */
      return { r: Object.assign({ corps: [-0.38 * up + 0.14 * im, 0, 0], tete: [-0.22 * up + 0.1 * im, 0, 0] }, cotes((c, sg) => ({ ['bras' + c]: [-1.25 * up + 0.12 * im, 0, sg * 0.25 * up], ['avantbras' + c]: [-0.35 * up, 0, 0], ['cuisse' + c]: [0.3 * up - 0.1 * im, 0, 0] }))),
        p: { racine: [0, 0.08 * up - 0.04 * im, 0.04 * up] }, s: { corps: [1 + 0.07 * im, 1 + 0.05 * up - 0.12 * im, 1 + 0.07 * im], gorge: 1 + 0.1 * up } }; });
    cl('tir_1', 1.0, (u) => { const ch = sst(0.0, 0.45, u) * (1 - sst(0.45, 0.55, u)), cr = sst(0.45, 0.53, u) * (1 - sst(0.6, 1.0, u)); /* (elle gonfle sa gorge, la tete en arriere, puis la jette en avant) */
      return { r: Object.assign({ tete: [-0.28 * ch + 0.15 * cr, 0, 0], corps: [-0.1 * ch + 0.08 * cr, 0, 0] }, cotes((c) => ({ ['cuisse' + c]: [0.08 * ch - 0.06 * cr, 0, 0] }))),
        s: { gorge: [1 + 0.35 * ch - 0.1 * cr, 1 + 0.3 * ch, 1 + 0.45 * ch - 0.1 * cr], corps: [1, 1 + 0.03 * ch - 0.04 * cr, 1] } }; });
    cl('sort_1', 1.4, (u) => { const go = sst(0.0, 0.5, u) * (1 - sst(0.62, 0.72, u)), tr = sst(0.4, 0.5, u) * (1 - sst(0.62, 0.68, u)) * Math.sin(PI2 * 9 * u), la = sst(0.62, 0.7, u) * (1 - sst(0.75, 1.0, u)); /* (la ponte : elle gonfle, tremble, et projette ses oeufs) */
      return { r: Object.assign({ corps: [-0.18 * go + 0.12 * la, 0, 0.06 * tr], tete: [-0.15 * go + 0.12 * la, 0, 0] }, cotes((c, sg) => ({ ['bras' + c]: [-0.25 * go + 0.05 * la, 0, sg * 0.25 * go], ['cuisse' + c]: [0.15 * go - 0.1 * la, 0, 0] }))),
        p: { racine: [0, 0.05 * go - 0.03 * la, 0] }, s: { corps: [1 + 0.08 * go - 0.03 * la, 1 + 0.1 * go - 0.1 * la, 1 + 0.08 * go], gorge: 1 + 0.25 * go } }; });
    cl('rugir_1', 1.6, (u) => { const te = sst(0.0, 0.2, u) * (1 - sst(0.8, 1.0, u)), pu = bo(0.2, 0.35, 0.5, u) + bo(0.55, 0.7, 0.85, u); /* (elle coasse deux fois, le sac vocal enorme) */
      return { r: Object.assign({ tete: [-0.32 * te, 0.06 * Math.sin(PI2 * 3 * u) * te, 0], corps: [-0.15 * te, 0, 0] }, cotes((c, sg) => ({ ['bras' + c]: [-0.15 * te, 0, sg * 0.1 * te], ['cuisse' + c]: [0.12 * te, 0, 0] }))),
        s: { gorge: [1 + 0.5 * pu, 1 + 0.4 * pu, 1 + 0.6 * pu], corps: [1 + 0.03 * pu, 1 + 0.04 * pu, 1] } }; });
    cl('touche_1', 0.4, (u) => { const k = bo(0, 0.15, 1.0, u); /* (elle encaisse) */
      return { r: { corps: [-0.12 * k, 0, 0.04 * k], tete: [-0.15 * k, 0, 0] }, s: { corps: [1 + 0.04 * k, 1 - 0.07 * k, 1 + 0.04 * k], gorge: 1 - 0.1 * k } }; });
    cl('mort_1', 1.8, (u) => { const re = bo(0, 0.15, 0.35, u), ef = sst(0.25, 1.0, u); /* (elle se cabre, puis s'affaisse a plat, pattes ecartees) */
      return { r: Object.assign({ corps: [-0.2 * re + 0.12 * ef, 0, 0.22 * ef], tete: [0.25 * ef, 0, 0.1 * ef] }, cotes((c, sg) => ({ ['bras' + c]: [0.2 * ef, 0, sg * 0.5 * ef], ['cuisse' + c]: [-0.1 * ef, 0, sg * 0.35 * ef], ['jambe' + c]: [0.3 * ef, 0, 0] }))),
        p: { racine: [0, -0.05 * ef, 0] }, s: { corps: [1 + 0.12 * ef, 1 - 0.28 * ef, 1 + 0.08 * ef], gorge: 1 - 0.15 * ef } }; });
    return clips;
  };
  const bb = new T.Box3().setFromObject(g), env = new T.Group(), kk = 5.0 / (bb.max.y - bb.min.y); const clips = anime ? squeletter() : null;
  g.scale.setScalar(kk); g.position.y = -bb.min.y * kk; env.add(g); env.userData = { hauteur: 5.0, nom: P.nom };
  if (clips) Object.assign(env.userData, { squelette: true, clips, vit: { marche_1: 0.866, course_1: 2.969 }, trajets: {}, impacts: {}, portee: 0 }); /* (les allures de l'ancienne Mere) */
  return env;
};

/* LE CHOIX DE VERSION ET LES SQUELETTES (16/11/2026, « fais-leur un squelette ouais, deja, car la ca va pas du tout », Mathieu). En nouvelle version :
   les amphibiens dont le glb anime est fait (assets/modeles/jeu/<nom>-anime-v2.glb, blender/palier11/<nom>-v2.py, memes os et memes mouvements que
   l'ancienne version) sortent en monstres a squelette, sous le nom <nom>-v2, leur peau repeinte sur chaque copie ; les autres restent en modele fixe
   (MONSTRES[t].fabrique) en attendant ; la Mere Crapaude est construite animee (fabriquerMereJeu2(2, true) : MODELES['mere-v2']). */
let VERSION_AMPHI = (() => { try { return localStorage.getItem('ferme-version-amphi') === 'nouvelle' ? 'nouvelle' : 'ancienne'; } catch (err) { return 'ancienne'; } })();
const AMPHI_V2 = { tetard: ['tetard', 1.1], crapaud: ['crapaud', 2.0], fouette: ['fouette', 2.5], triton: ['triton', 3.2], axolotl: ['axolotl', 2.2] }, PROTO_V2 = {}, PROTO_V2_EN_COURS = {};
const ANIME_V2 = new Set(['tetard', 'crapaud', 'triton']); /* (les glb animes deja faits) */
for (const [n, h] of Object.values(AMPHI_V2)) if (ANIME_V2.has(n)) { SQUELETTES_A_CHARGER.push([n + '-v2', 'assets/modeles/jeu/' + n + '-anime-v2.glb', h]); ALLURES[n + '-v2'] = ALLURES[n]; VITESSE_FAMILLE[n + '-v2'] = VITESSE_FAMILLE[n]; }
VITESSE_FAMILLE['mere-v2'] = VITESSE_FAMILLE.mere;
/* la peau repeinte : sur le modele charge, puis sur chaque copie (la copie d'une matiere perd son melange) */
const chargerSquelette0 = chargerSquelette; chargerSquelette = async function (nom, url, h) { await chargerSquelette0(nom, url, h); const n = nom.replace(/-v2$/, ''), M = MODELES[nom];
  if (n !== nom && M && !M.userData.peint) { window.peindreV2(n, M); M.userData.peint = true; M.traverse((o) => { if (o.userData.peauV2) window.appliquerPeauV2(o.material, n); }); } };
const clonerSquelette0 = clonerSquelette; clonerSquelette = function (nom) { const g = clonerSquelette0(nom), n = nom.replace(/-v2$/, '');
  if (n !== nom) g.traverse((o) => { if (o.isSkinnedMesh && o.userData.peauV2) window.appliquerPeauV2(o.material, n); }); return g; };
function preparerMereV2() { if (MODELES['mere-v2']) return; const M = window.fabriquerMereJeu2(2, true), imp = {}; /* (l'instant de chaque geste, comme pour un glb : la main ou la machoire qui va le plus vite) */
  M.userData.clips.forEach((c) => { if (FAMILLES_GESTE.includes(familleDe(c.name))) imp[c.name] = instantGeste(M, c); }); M.userData.impacts = imp; MODELES['mere-v2'] = M; }
async function preparerAmphiV2() {
  preparerMereV2(); await chargerSquelettes([...ANIME_V2].map((n) => n + '-v2'));
  await Promise.all(Object.values(AMPHI_V2).filter(([n]) => !ANIME_V2.has(n)).map(([n]) => PROTO_V2[n] || (PROTO_V2_EN_COURS[n] = PROTO_V2_EN_COURS[n] || window.chargerV2(n, true).then((m) => { PROTO_V2[n] = m; return m; }).catch(() => null))));
}
function appliquerAmphiV2() {
  const neuf = VERSION_AMPHI === 'nouvelle';
  Object.entries(AMPHI_V2).forEach(([t, [n]]) => { const d = MONSTRES[t]; if (!d) return; d.modeleV1 = d.modeleV1 || d.modele; d.modele = d.modeleV1; delete d.fabrique; if (!neuf) return;
    if (ANIME_V2.has(n) && MODELES[n + '-v2']) d.modele = n + '-v2'; else if (PROTO_V2[n]) d.fabrique = () => { const c = PROTO_V2[n].clone(true); c.userData = Object.assign({}, PROTO_V2[n].userData); return c; }; });
  const dm = MONSTRES.mereCrapaude; if (dm) { dm.modeleV1 = dm.modeleV1 || dm.modele; dm.modele = neuf && MODELES['mere-v2'] ? 'mere-v2' : dm.modeleV1; }
}
async function choisirVersionAmphi(v) {
  VERSION_AMPHI = v === 'nouvelle' ? 'nouvelle' : 'ancienne'; try { localStorage.setItem('ferme-version-amphi', VERSION_AMPHI); } catch (err) { /* rien */ }
  if (VERSION_AMPHI === 'nouvelle') { toast('Chargement de la nouvelle version des amphibiens…'); await preparerAmphiV2(); } appliquerAmphiV2();
  toast(VERSION_AMPHI === 'nouvelle' ? 'Amphibiens : nouvelle version (animée ; Fouette-langue et Axolotl encore fixes).' : 'Amphibiens : ancienne version.', 'or');
}
if (VERSION_AMPHI === 'nouvelle') setTimeout(() => { preparerAmphiV2().then(appliquerAmphiV2); }, 6000); /* (choisie a une visite precedente : chargee apres le demarrage, sans le ralentir) */
/* LA FLEUR DE LA MERE CRAPAUDE (16/11/2026, « lorsqu'elle passe en rage, la fleur grossit et s'ouvre, ca degage un parfum enivrant qui booste les monstres
   qu'elle fait naitre », Mathieu) : en rage, la fleur de son nenuphar grossit et ses petales s'ouvrent en 1,5 s, un nuage rose en sort ; ce qui eclot de
   ses oeufs pendant sa rage est galvanise (capOeuf, 21-combat.js) */
function fleurMere(mo, dt) {
  const f = mo.m && (mo.fleur || (mo.fleur = mo.m.getObjectByName('fleur') || null)); if (!f) return;
  const cible = mo.enrage && mo.etat === 'actif' ? 1 : 0; mo.fleurK = mo.fleurK || 0; if (!cible && !mo.fleurK) return;
  mo.fleurK += Math.sign(cible - mo.fleurK) * Math.min(Math.abs(cible - mo.fleurK), dt / 1.5); if (f.userData.e0 == null) f.userData.e0 = f.scale.x;
  const e = 1 - Math.pow(1 - mo.fleurK, 3); f.scale.setScalar(f.userData.e0 * (1 + 0.7 * e));
  f.traverse((p) => { if (p.name !== 'petale') return; const o = p.userData.ouv * (1 - 0.75 * e), L = p.userData.L; p.position.set(0, L * 0.5 * Math.sin(o), L * 0.5 * Math.cos(o)); p.rotation.x = -o; });
  if (mo.fleurK > 0.3 && mo.etat === 'actif' && Math.random() < dt * 12) { const q = f.getWorldPosition(new T.Vector3()); emettre(FX_LUM, 1, { x: q.x + (Math.random() - 0.5) * 1.4, y: q.y + 0.3, z: q.z + (Math.random() - 0.5) * 1.4, v: [(Math.random() - 0.5) * 0.8, 1.1, (Math.random() - 0.5) * 0.8], vie: [1.0, 1.6], taille: [0.45, 0.12], c: ['#ffb3d6', '#f07ab4', '#fff0f6'], a: 0.6 }); }
  if (mo.fleurK >= 1 && !mo.parfumOnde) { mo.parfumOnde = true; const q = f.getWorldPosition(new T.Vector3()); onde(q.x, mo.m.position.y + 0.1, q.z, 6, '#f07ab4', 0.5, 1.2); }
}
const majSquelette0 = majSquelette; majSquelette = function (mo, v, dt) { majSquelette0(mo, v, dt); if (mo.d && mo.d.parfum) fleurMere(mo, dt); };
