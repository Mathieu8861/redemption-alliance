/* LES AMPHIBIENS, NOUVELLE VERSION, DANS L'ARENE DEV (16/11/2026, « ca me parait pas mal ; avant, tu peux importer les nouvelles versions en arene et mode test
   stp ? », Mathieu). Les versions validees le 15/11 : les cinq variantes 2 de Rodin a la peau repeinte (Tetard, Crapaud cracheur, Fouette-langue, Triton,
   Axolotl : assets/modeles/jeu/<nom>-v2.glb, la peinture posee par sommet au chargement, chargerV2) et la Mere Crapaude bleu-vert faite en formes simples
   (fabriquerMereJeu2(2)). PAS ENCORE ANIMEES : modeles fixes, ils glissent et frappent sans mouvement (les squelettes viennent ensuite). Un choix dans
   l'Arene dev (Reglages et Groupes) : ancienne version (animee) ou nouvelle ; en nouvelle, chaque amphibien sort avec son nouveau modele (MONSTRES[t].fabrique),
   les tetards eclos des oeufs de la Mere compris. Sources : maquettes/saison-des-pluies/mere-styles/v2-peau.js et mere-jeu2.js (copiees ici telles quelles). */
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
  window.chargerV2 = async (nom, peindre) => {
    const gl = await new Promise((ok, ko) => chargeur.load('assets/modeles/jeu/' + nom + '-v2.glb?v=' + VERSION_MODELES, ok, undefined, ko)), sc = gl.scene, R = REGLES[nom];
    sc.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(sc), k = HAUT[nom] / (bb.max.y - bb.min.y), ctr = bb.getCenter(new T.Vector3()), dim = bb.getSize(new T.Vector3());
    const meshes = []; sc.traverse((o) => { if (o.isMesh) meshes.push(o); });
    for (const m of meshes) { const map = m.material.map; if (map) { map.encoding = T.LinearEncoding; map.needsUpdate = true; }
      const mat = new T.MeshToonMaterial({ color: '#ffffff', map, gradientMap: grad, side: T.DoubleSide });
      if (peindre !== false && map) {
        const im = map.image, cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0); const px = cx.getImageData(0, 0, cv.width, cv.height).data;
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
        G.setAttribute('aTeinte', new T.BufferAttribute(teinte, 3)); G.setAttribute('aPart', new T.BufferAttribute(part, 1));
        mat.onBeforeCompile = (sh) => { sh.vertexShader = 'attribute vec3 aTeinte;\nattribute float aPart;\nvarying vec3 vTeinte;\nvarying float vPart;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvTeinte = aTeinte; vPart = aPart;');
          sh.fragmentShader = 'varying vec3 vTeinte;\nvarying float vPart;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vTeinte, vPart);'); };
        mat.customProgramCacheKey = () => 'v2-peau-' + nom; }
      m.material = mat; m.castShadow = true; m.receiveShadow = false;
      const ct = new T.Mesh(m.geometry, contourDe(0.007 / k)); m.add(ct); }
    const env = new T.Group(); sc.scale.setScalar(k); sc.position.set(-ctr.x * k, -bb.min.y * k, -ctr.z * k); env.add(sc); env.userData = { hauteur: HAUT[nom], nom }; return env;
  };
})();
/* LA MERE CRAPAUDE, L'ENTRE-DEUX (15/11/2026, par Discord : « je prefere, mais un entre-deux serait cool ; sur la tete, mets-lui un nenuphar », Mathieu,
   apres la version en formes simples, mere-jeu.js). Entre le modele Rodin (trop realiste) et les boules du jeu : un corps d'un seul tenant sculpte dans une
   sphere (la tete fondue dans le corps comme un vrai crapaud, le pli de la bouche, les bosses derriere les yeux, des verrues en relief), une peau tachetee
   peinte par sommet (dos marbre, ventre creme, bouche sombre), des pattes en segments avec des doigts a coussinets ; le rendu reste celui du jeu (toon,
   contour). Un nenuphar fleuri sur la tete a la place de la barque. fabriquerMereJeu2(1, 2 ou 3) : les memes trois teintes, 5 de haut. */
window.fabriquerMereJeu2 = function (v) {
  const g = new T.Group(), Y = new T.Vector3(0, 1, 0), C = (c) => new T.Color(c);
  const P = [null,
    { nom: 'Matrone', peau: '#5f7c3c', fonce: '#3f5726', clair: '#7d9a4e', ventre: '#ecdfb2', iris: '#e8a83a', oeuf: '#8df07e', tx: 1.25, ty: 0.95, tz: 1.2, haut: 0, oeufs: 'flancs' },
    { nom: 'Reine des roseaux', peau: '#3f7f72', fonce: '#2a5d54', clair: '#62a28c', ventre: '#dbe7aa', iris: '#f2c34a', oeuf: '#9cf57a', tx: 1.14, ty: 1.05, tz: 1.1, haut: 0.12, oeufs: 'dos' },
    { nom: 'Bouffie', peau: '#8b6b3a', fonce: '#62482a', clair: '#a8864e', ventre: '#f2dca2', iris: '#e0602a', oeuf: '#8cf27c', tx: 1.42, ty: 0.84, tz: 1.3, haut: -0.1, oeufs: 'dessus' }][v];
  const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let s0 = 11 + v; const alea = () => { s0 = (s0 * 16807) % 2147483647; return s0 / 2147483647; };
  /* --- le corps : une sphere sculptee ; forme(d) donne le point de la peau dans la direction d (et sa couleur) --- */
  const verrues = []; for (let i = 0; i < 150; i++) { /* (150 au lieu de 70, 15/11/2026, « travaille-la un poil plus, a l'image des autres monstres », Mathieu) */ const th = Math.acos(1 - alea() * 1.3), ph = alea() * Math.PI * 2, d = new T.Vector3(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)); if (d.z > 0.55 && d.y < 0.35) continue; verrues.push([d, 0.03 + alea() * 0.045, 0.045 + alea() * 0.05]); }
  const bouche = (x) => 0.26 - 0.22 * x * x;
  const TACHES = []; for (let i = 0; i < 46; i++) { const th = Math.acos(1 - alea() * 1.15), ph = alea() * Math.PI * 2, dd = new T.Vector3(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)); if (dd.z > 0.6 && dd.y < 0.55) continue; TACHES.push([dd, 0.07 + alea() * 0.09]); } /* (la ligne de la bouche, en direction : elle tombe aux coins) */
  const forme = (d) => {
    let x = d.x * P.tx, y = d.y * P.ty, z = d.z * P.tz;
    const avant = sst(0.0, 0.85, d.z) * sst(-0.35, 0.35, d.y); y += avant * (0.32 + P.haut); z += avant * 0.32; x *= 1 - avant * 0.12; /* (la tete, fondue dans le corps, vers l'avant et le haut) */
    const md = d.y - bouche(d.x), sillon = d.z > 0.2 ? Math.exp(-(md * md) / 0.0009) * sst(0.2, 0.55, d.z) : 0; /* (le pli de la bouche) */
    let bosse = 0; for (const [c, h, r] of verrues) { const a = d.angleTo(c); if (a < r * 2.5) bosse += h * Math.exp(-(a * a) / (r * r * 0.5)); }
    for (const sx of [-1, 1]) { const c = new T.Vector3(sx * 0.5, 0.62, 0.42).normalize(), a = d.angleTo(c); bosse += 0.12 * Math.exp(-(a * a) / 0.02); } /* (les bosses derriere les yeux) */
    const n = new T.Vector3(x, y, z).normalize(), k = 1 + bosse - sillon * 0.07; let p = new T.Vector3(x * k, y * k, z * k);
    if (p.y < -0.7) p.y = -0.7 + (p.y + 0.7) * 0.25; /* (le dessous a plat, pose au sol) */
    /* la couleur : le ventre creme dessous et a la gorge, le dos marbre, la bouche sombre */
    let c = C(P.peau), tache = 0; for (const [tc, tr] of TACHES) { const a = d.angleTo(tc); if (a < tr * 1.6) tache = Math.max(tache, sst(tr * 1.15, tr * 0.85, a) - 0.4 * sst(tr * 1.6, tr * 1.2, a) * 0); }
    c = c.clone().lerp(C(P.fonce), tache); /* (des taches rondes, sombres, bordees net) */
    const ventre = Math.max(sst(-0.05, -0.5, d.y), sst(0.45, 0.85, d.z) * sst(0.0, -0.25, md) * 1.0); c = c.clone().lerp(C(P.ventre), ventre);
    const grain = Math.sin(d.x * 37 + d.y * 11) * Math.sin(d.y * 41 - d.z * 7) * Math.sin(d.z * 33 + d.x * 13), grain2 = Math.sin(d.x * 71 - d.z * 17) * Math.sin(d.y * 67 + d.x * 9) * Math.sin(d.z * 59 - d.y * 21);
    if (ventre < 0.5) { if (grain > 0.3) c = c.clone().lerp(C(P.fonce), 0.4); else if (grain < -0.4) c = c.clone().lerp(C(P.clair), 0.35); } /* (un grain marbre fin, comme les peaux peintes des autres) */
    else if (grain2 > 0.45) c = c.clone().lerp(C(P.ventre).multiplyScalar(0.86), 0.7); /* (le ventre granuleux) */
    if (ventre < 0.5) c = c.clone().lerp(C(P.clair), sst(0.55, 0.95, d.y) * 0.3); /* (le dessus qui luit : la peau mouillee) */
    if (bosse > 0.03 && ventre < 0.5) c = c.clone().lerp(C(P.clair), Math.min(1, (bosse - 0.03) * 12) * 0.7);
    if (bosse > 0.07 && ventre < 0.5) c = c.clone().lerp(C('#c9ecdc'), Math.min(1, (bosse - 0.07) * 15) * 0.6); /* (le sommet des verrues, qui accroche la lumiere) */
    if (d.z > 0.3 && md < -0.04 && md > -0.2 && Math.abs(Math.sin((md + 0.04) * 60)) > 0.92 && ventre > 0.3) c = c.clone().lerp(C(P.ventre).multiplyScalar(0.72), 0.6); /* (les plis de la gorge) */
    c = c.clone().lerp(C('#26331a'), Math.min(1, sillon * 1.5)); /* (le pli de la bouche, en fondu) */
    return { p, c };
  };
  const geo = new T.SphereGeometry(1, 128, 96), pos = geo.attributes.position, cols = new Float32Array(pos.count * 3), d = new T.Vector3();
  for (let i = 0; i < pos.count; i++) { d.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize(); const f = forme(d); pos.setXYZ(i, f.p.x, f.p.y, f.p.z); cols[i * 3] = f.c.r; cols[i * 3 + 1] = f.c.g; cols[i * 3 + 2] = f.c.b; }
  geo.setAttribute('color', new T.BufferAttribute(cols, 3)); geo.computeVertexNormals();
  const cY = 0.78, corps = maille(geo, new T.MeshToonMaterial({ vertexColors: true, gradientMap: grad }), 0.03); corps.position.set(0, cY, -0.1); g.add(corps);
  const surPeau = (dx, dy, dz, k) => { const dd = new T.Vector3(dx, dy, dz).normalize(), q = forme(dd).p.multiplyScalar(k || 1); return new T.Vector3(q.x, q.y + cY, q.z - 0.1); };
  const a = (o, p, s, r) => { o.position.copy(p); if (s) o.scale.set(s[0], s[1], s[2]); if (r) o.rotation.set(r[0], r[1], r[2]); g.add(o); return o; };
  const sph = (c, o, seg) => maille(new T.SphereGeometry(1, seg || 24, Math.round((seg || 24) * 0.7)), c, o);
  const membre = (c, A, B, r1, r2) => { const dd = B.clone().sub(A), m = maille(new T.CylinderGeometry(r2, r1, dd.length(), 14), c, 0.05); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(Y, dd.normalize()); g.add(m); return m; };
  const V3 = (x, y, z) => new T.Vector3(x, y, z);
  /* la peau des membres (15/11/2026) : la meme que le corps, taches sombres et grain, calculee la ou est chaque sommet */
  const peauA = (q) => { const b = Math.sin(q.x * 6.1 + q.z * 3.3) * Math.sin(q.y * 5.3 - q.x * 2.1) * Math.sin(q.z * 5.7 + q.y * 4.4), f = Math.sin(q.x * 31 + q.y * 7) * Math.sin(q.y * 29 - q.z * 11) * Math.sin(q.z * 27 + q.x * 5);
    let c = C(P.peau); if (b > 0.22) c = c.lerp(C(P.fonce), sst(0.22, 0.3, b)); if (f > 0.35) c = c.lerp(C(P.fonce), 0.35); else if (f < -0.4) c = c.lerp(C(P.clair), 0.35); return c; };
  const matPeau = () => new T.MeshToonMaterial({ vertexColors: true, gradientMap: grad });
  const sphP = (centre, sc, rot, contour) => { const ge = new T.SphereGeometry(1, 28, 20), P_ = ge.attributes.position, cl = new Float32Array(P_.count * 3), q = V3();
    for (let i = 0; i < P_.count; i++) { q.set(P_.getX(i) * sc[0], P_.getY(i) * sc[1], P_.getZ(i) * sc[2]).add(centre); const cc = peauA(q); cl[i * 3] = cc.r; cl[i * 3 + 1] = cc.g; cl[i * 3 + 2] = cc.b; }
    ge.setAttribute('color', new T.BufferAttribute(cl, 3)); const m = maille(ge, matPeau(), contour == null ? 0.03 : contour); m.position.copy(centre); m.scale.set(sc[0], sc[1], sc[2]); if (rot) m.rotation.set(rot[0], rot[1], rot[2]); g.add(m); return m; };
  /* --- les yeux : sur le dessus de la tete, iris dore cercle de sombre, pupille en fente, paupiere lourde en biais --- */
  for (const s of [-1, 1]) {
    const e = surPeau(s * 0.4, 0.72, 0.56, 0.97), n = new T.Vector3(s * 0.25, 0.5, 0.83).normalize();
    sphP(e.clone().add(V3(0, -0.03, -0.03)), [0.26, 0.24, 0.26]);
    const ic = e.clone().addScaledVector(n, 0.1); a(sph(P.fonce), ic, [0.235, 0.235, 0.235]); a(sph(P.iris, 0.0), ic.clone().addScaledVector(n, 0.012), [0.225, 0.225, 0.225]);
    const n2 = new T.Vector3(s * 0.22, 0.14, 0.97).normalize(), pu = a(sph('#1d1a14', 0.08), ic.clone().addScaledVector(n2, 0.222), [0.12, 0.035, 0.03]); pu.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), n2); pu.rotateZ(s * 0.22);
    a(sph('#ffffff', 0.0, 10), ic.clone().addScaledVector(new T.Vector3(s * 0.05, 0.05, 1).normalize(), 0.225).add(V3(s * 0.05, -0.05, 0)), [0.028, 0.02, 0.012]); /* (un petit reflet humide) */
    const pau = maille(new T.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.37), P.fonce); pau.position.copy(ic); pau.scale.setScalar(0.255); pau.rotation.set(0.25, 0, s * 0.38); g.add(pau);
  }
  for (const s of [-1, 1]) a(sph('#24301a', 0.0), surPeau(s * 0.12, 0.5, 0.86, 1.0), [0.04, 0.028, 0.03]); /* (les narines) */
  { const bave = new T.MeshToonMaterial({ color: '#c9f2e2', gradientMap: grad, transparent: true, opacity: 0.7 }); /* (la bave qui pend de la levre, 15/11/2026, comme le Tetard) */
    [[-0.55, 0.32], [-0.2, 0.22], [0.35, 0.28], [0.62, 0.18]].forEach(([x, L]) => { const l0 = surPeau(x, 0.26 - 0.22 * x * x - 0.02, 0.8, 1.0);
      const pts = [l0, l0.clone().add(V3(0, -L * 0.5, 0.03)), l0.clone().add(V3(0, -L, 0.02))], cu = new T.CatmullRomCurve3(pts);
      const t1 = new T.Mesh(new T.TubeGeometry(cu, 10, 0.022, 8), bave); g.add(t1); const gt = new T.Mesh(new T.SphereGeometry(1, 12, 10), bave); gt.position.copy(pts[2]); gt.scale.set(0.045, 0.06, 0.045); g.add(gt); }); }
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
  for (const s of [-1, 1]) {
    const ep = surPeau(s * 0.6, -0.12, 0.58, 0.82), co = V3(s * (P.tx * 1.04), 0.3, 0.3), av = V3(s * (P.tx * 0.98), 0.2, 0.62), po = V3(s * (P.tx * 0.84), 0.09, 0.84);
    tube([ep, V3(s * (P.tx * 0.92), 0.5, 0.42), co, av, po], (t) => 0.23 - 0.07 * t + 0.04 * Math.exp(-((t - 0.62) ** 2) / 0.012) - (t > 0.85 ? (t - 0.85) * 0.25 : 0), 'peau', 40, 20); /* (le bras, l'avant-bras galbe) */
    sphP(po.clone().add(V3(0, -0.03, 0.06)), [0.2, 0.075, 0.18], [0, -s * 0.3, 0]); /* (la paume, a plat) */
    for (let k = 0; k < 4; k++) { const b = (-0.6 + k * 0.4) * s - s * 0.25, dir = V3(Math.sin(b), 0, Math.cos(b)), L = k === 1 || k === 2 ? 0.3 : 0.24, p0 = po.clone().add(V3(0, -0.01, 0.06));
      const p1 = p0.clone().addScaledVector(dir, L * 0.5).add(V3(0, 0.035, 0)), p2 = p0.clone().addScaledVector(dir, L).add(V3(0, -0.035, 0));
      tube([p0, p1, p2], (t) => 0.052 - 0.014 * t, 'peau', 12, 12, 0.06);
      a(sph(P.clair, 0.05), p2.clone().addScaledVector(dir, 0.025).add(V3(0, -0.005, 0)), [0.058, 0.04, 0.062]); } /* (les doigts courbes, un coussinet au bout) */
  }
  /* --- les pattes arriere repliees : la cuisse, la jambe le long, un long pied palme a cinq doigts --- */
  for (const s of [-1, 1]) {
    const cu = surPeau(s * 0.85, -0.25, -0.25, 0.86); sphP(cu, [0.52, 0.48, 0.66], [0, s * 0.3, 0]);
    const ta = V3(s * (P.tx * 1.0), 0.14, -0.55), pi = V3(s * (P.tx * 1.08), 0.06, 0.18);
    tube([cu.clone().add(V3(s * 0.15, -0.25, -0.25)), ta, pi], (t) => 0.16 - 0.07 * t, 'peau', 24, 16); /* (la jambe, d'un seul tenant) */
    const pa = new T.Group(); pa.position.copy(pi); pa.rotation.y = -s * 0.25; g.add(pa);
    const toile = maille(new T.SphereGeometry(1, 20, 12), P.clair, 0.05); toile.scale.set(0.3, 0.035, 0.32); toile.position.set(0, -0.02, 0.2); pa.add(toile); /* (la palmure) */
    for (let k = 0; k < 5; k++) { const b = -0.6 + k * 0.3, L = 0.34 + (k === 2 ? 0.08 : 0) - Math.abs(k - 2) * 0.03, t = V3(Math.sin(b) * L, -0.02, Math.cos(b) * L);
      const doigt = maille(new T.CylinderGeometry(0.035, 0.045, L, 10), '#' + peauA(pi).getHexString(), 0.06); doigt.position.copy(t).multiplyScalar(0.5); doigt.quaternion.setFromUnitVectors(Y, t.clone().normalize()); pa.add(doigt);
      const bout = maille(new T.SphereGeometry(1, 10, 8), P.clair, 0.05); bout.position.copy(t); bout.scale.set(0.055, 0.04, 0.055); pa.add(bout); }
  }
  /* --- les grappes d'oeufs qui luisent, un petit tetard sombre dans chacun --- */
  const oeufs = (c, n, rx, ry, rz) => { for (let i = 0; i < n; i++) { const t = i * 2.399, k = Math.sqrt((i + 0.5) / n), r = 0.13 + ((i * 7) % 5) * 0.014;
    const o = maille(new T.SphereGeometry(1, 16, 12), new T.MeshToonMaterial({ color: P.oeuf, gradientMap: grad, emissive: C(P.oeuf).multiplyScalar(0.3), transparent: true, opacity: 0.82 })); /* (translucides, 15/11/2026) */ o.position.set(c.x + Math.cos(t) * k * rx, c.y + Math.sin(t) * k * ry, c.z + (1 - k) * rz); o.scale.setScalar(r); g.add(o);
    const em = maille(new T.SphereGeometry(1, 10, 8), '#1f5a28', 0.0); em.position.copy(o.position).add(V3(0, 0, r * 0.35)); em.scale.set(r * 0.32, r * 0.32, r * 0.25); g.add(em); } };
  if (P.oeufs === 'flancs') for (const s of [-1, 1]) oeufs(surPeau(s * 0.9, 0.35, -0.3, 1.02), 26, 0.36, 0.4, 0.12);
  if (P.oeufs === 'dos') oeufs(surPeau(0, 0.3, -1, 1.02), 32, 0.62, 0.5, 0.15);
  if (P.oeufs === 'dessus') for (const s of [-1, 1]) oeufs(surPeau(s * 0.45, 0.85, -0.25, 1.02), 14, 0.3, 0.22, 0.1);
  /* --- le nenuphar sur la tete : une grande feuille ronde a encoche, ses nervures, un bord releve, une fleur rose ouverte --- */
  const haut = surPeau(0, 1, -0.1, 1.0), nen = new T.Group(); nen.position.copy(haut).add(V3(0.05, 0.06, -0.12)); nen.rotation.set(-0.08, 0.6, -0.1); /* (derriere les yeux, qu'ils restent degages) */ g.add(nen);
  const R = v === 3 ? 0.98 : 0.85, forme2 = new T.Shape(); forme2.moveTo(0, 0); forme2.absarc(0, 0, R, 0.22, Math.PI * 2 - 0.22, false); forme2.lineTo(0, 0);
  const feuille = new T.ExtrudeGeometry(forme2, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.02, bevelSegments: 2, curveSegments: 48 }); feuille.rotateX(-Math.PI / 2);
  const fp = feuille.attributes.position; for (let i = 0; i < fp.count; i++) { const x = fp.getX(i), z = fp.getZ(i), r = Math.hypot(x, z) / R; fp.setY(i, fp.getY(i) + 0.08 * r * r * r + 0.02 * Math.sin(Math.atan2(z, x) * 5) * r * r - 0.05 * r); } feuille.computeVertexNormals(); /* (le bord qui ondule et se releve) */
  const fe = maille(feuille, '#5f9a3a', 0.02); nen.add(fe);
  for (let k = 0; k < 9; k++) { const b = 0.4 + k / 8 * (Math.PI * 2 - 0.8), L = R * 0.92, ne = maille(new T.BoxGeometry(L, 0.012, 0.03), '#8cc35a', 0); ne.position.set(Math.cos(b) * L / 2, 0.06, -Math.sin(b) * L / 2); ne.rotation.y = b; nen.add(ne); } /* (les nervures) */
  const fleur = new T.Group(); fleur.position.set(-0.12, 0.08, 0.1); nen.add(fleur);
  [[8, 0.32, 0.9, '#eaa0b4'], [7, 0.26, 0.55, '#f4c2d0'], [5, 0.18, 0.25, '#fbe0e8']].forEach(([n, L, ouv, c], j) => { for (let k = 0; k < n; k++) { const b = k / n * Math.PI * 2 + j * 0.3, pe = maille(new T.SphereGeometry(1, 14, 10), c, 0.05);
    pe.scale.set(0.085, 0.04, L * 0.5); const piv = new T.Group(); piv.rotation.y = b; pe.position.set(0, L * 0.5 * Math.sin(ouv), L * 0.5 * Math.cos(ouv)); pe.rotation.x = -ouv; piv.add(pe); fleur.add(piv); } });
  const coeur = maille(new T.SphereGeometry(1, 12, 10), '#f5d36a', 0.05); coeur.scale.set(0.09, 0.06, 0.09); coeur.position.y = 0.06; fleur.add(coeur);
  const goutte = maille(new T.SphereGeometry(1, 12, 10), new T.MeshToonMaterial({ color: '#cfeaff', gradientMap: grad, transparent: true, opacity: 0.75 })); goutte.scale.set(0.06, 0.04, 0.06); goutte.position.set(R * 0.45, 0.07, -R * 0.3); nen.add(goutte); /* (une goutte d'eau) */
  g.traverse((o) => { if (o.isMesh) o.receiveShadow = false; }); /* (comme les monstres du jeu : pas d'ombre sur soi-meme, sinon des stries sur le ventre) */
  /* a la taille du jeu : 5 de haut, les pieds au sol */
  const bb = new T.Box3().setFromObject(g), env = new T.Group(), kk = 5.0 / (bb.max.y - bb.min.y); g.scale.setScalar(kk); g.position.y = -bb.min.y * kk; env.add(g); env.userData = { hauteur: 5.0, nom: P.nom }; return env;
};

let VERSION_AMPHI = (() => { try { return localStorage.getItem('ferme-version-amphi') === 'nouvelle' ? 'nouvelle' : 'ancienne'; } catch (err) { return 'ancienne'; } })();
const AMPHI_V2 = { tetard: 'tetard', crapaud: 'crapaud', fouette: 'fouette', triton: 'triton', axolotl: 'axolotl', mereCrapaude: 'mere' }, PROTO_V2 = {}, PROTO_V2_EN_COURS = {};
async function preparerAmphiV2() { /* les six modeles, une fois chacun (chargerV2 peint la peau ; la Mere est construite) */
  await Promise.all(Object.values(AMPHI_V2).map((n) => PROTO_V2[n] || (PROTO_V2_EN_COURS[n] = PROTO_V2_EN_COURS[n] || (n === 'mere' ? Promise.resolve(window.fabriquerMereJeu2(2)) : window.chargerV2(n, true)).then((m) => { PROTO_V2[n] = m; return m; }).catch(() => null))));
}
function appliquerAmphiV2() {
  Object.entries(AMPHI_V2).forEach(([t, n]) => { const d = MONSTRES[t]; if (!d) return;
    if (VERSION_AMPHI === 'nouvelle' && PROTO_V2[n]) d.fabrique = () => { const c = PROTO_V2[n].clone(true); c.userData = Object.assign({}, PROTO_V2[n].userData); return c; }; else delete d.fabrique; });
}
async function choisirVersionAmphi(v) {
  VERSION_AMPHI = v === 'nouvelle' ? 'nouvelle' : 'ancienne'; try { localStorage.setItem('ferme-version-amphi', VERSION_AMPHI); } catch (err) { /* rien */ }
  if (VERSION_AMPHI === 'nouvelle') { toast('Chargement de la nouvelle version des amphibiens…'); await preparerAmphiV2(); } appliquerAmphiV2();
  toast(VERSION_AMPHI === 'nouvelle' ? 'Amphibiens : nouvelle version (pas encore animée).' : 'Amphibiens : ancienne version (animée).', 'or');
}
if (VERSION_AMPHI === 'nouvelle') setTimeout(() => { preparerAmphiV2().then(appliquerAmphiV2); }, 6000); /* (choisie a une visite precedente : chargee apres le demarrage, sans le ralentir) */
