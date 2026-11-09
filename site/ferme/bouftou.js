/* Bouftou valide par Mathieu le 09/10/2026 : version A (cornes courtes a pointe fine) avec la queue de la version B (tige et houppette).
   Depuis le 09/11/2026 : l'adulte retouche (sans la tige ni la touffe du dos, queue ronde, oreilles, sabots ronds) et un vrai bebe (o.bebe).
   Modele propre a Regen, inspire de l'allure du jeu, rendu toon avec contours.
   Usage : const b = creerBouftou(THREE, maille, options) ; maille(geo, couleur, epaisseurContour) doit renvoyer un Object3D (maillage + contour). */
(function () {
  'use strict';
  /* LE BEBE BOUFTOU (09/11/2026, valide par Mathieu : « je valide les bebes comme ca », le blanc au museau rose leger, le noir tel quel) : le Bouftou
     classique en petit. Corps rond, laine plus claire, tete relevee et en avant, visage plus clair, yeux grands ouverts a paupiere fine, petites oreilles
     tombantes, toutes petites cornes qui depassent de la frange, pattes courtes et trapues. Le blanc a un petit museau creme rose (narines en fentes :
     un mouton, pas un groin) ; le noir (o.peau donne) garde le museau de sa couleur */
  function bebe(T, maille, o) {
    const teinte = (c, k) => '#' + new T.Color(c).lerp(new T.Color(k > 0 ? '#ffffff' : '#000000'), Math.abs(k)).getHexString();
    const L = o.laine || '#f5efd0', CO = o.cornes || '#3f5f7c', CT = o.corneTip || '#6d90ad', SAB = '#34506a', PAT = '#7a6e45';
    const PEAU = teinte(o.peau || '#8f7f4d', 0.16), PEAU2 = teinte(o.peau ? teinte(o.peau, -0.15) : '#746538', 0.14), PAUP = teinte(o.peau || '#8f7f4d', -0.12), SCL = '#efe4b8', NOIR = '#2f2816';
    const MUSEAU = o.peau ? null : '#efd4c4';
    const sph = (r, c, e) => maille(new T.SphereGeometry(r, r >= 0.9 ? 18 : r >= 0.3 ? 14 : r >= 0.12 ? 10 : 7, r >= 0.9 ? 13 : r >= 0.3 ? 10 : r >= 0.12 ? 7 : 5), c, e);
    const cyl = (rh, rb, h, c, e) => maille(new T.CylinderGeometry(rh, rb, h, 14), c, e);
    const pose = (m, x, y, z, sx, sy, sz, parent) => { m.position.set(x, y, z); if (sx) m.scale.set(sx, sy || sx, sz || sx); parent.add(m); return m; };
    const g = new T.Group();
    const R = 1.0, LP = 0.72, CY = 0.4 + R * 0.92, TT = MUSEAU ? 0.94 : 1.0, kR = R / 1.2;

    /* la laine, ronde */
    pose(sph(R, L, 0.04), 0, CY, -0.1 * kR, 1.08, 0.94, 1.08, g);
    [[8, 0.0, 0.44, 0.5], [6, 0.62, 0.42, 0], [3, 1.12, 0.36, 0.3]].forEach(([n, lat, r, dec]) => {
      for (let i = 0; i < n; i++) {
        const a = (i + dec) / n * Math.PI * 2;
        const x = Math.cos(a) * Math.cos(lat) * R, z = Math.sin(a) * Math.cos(lat) * R * 1.03 - 0.1 * kR, y = CY + Math.sin(lat) * R * 0.87;
        if (z > 0.5 * R && y < CY + 0.45 * R && Math.abs(x) < 0.7 * R) continue; /* la place de la tete */
        pose(sph(r, L, 0.05), x, y, z, 1, 1, 1, g);
      }
    });
    pose(sph(0.24, L, 0.05), 0, CY + 0.1, -R * 1.12 - 0.08, 0.9, 1, 0.85, g); /* la petite queue ronde */

    /* la tete */
    const tete = new T.Group();
    pose(sph(0.58, PEAU, 0.05), 0, 0, 0, 1.0, 0.96, 0.92, tete);
    if (MUSEAU) {
      pose(sph(0.25, MUSEAU, 0.05), 0, -0.22, 0.45, 0.9, 0.66, 0.6, tete);
      [-1, 1].forEach((s) => { const n = pose(sph(0.03, NOIR, 0), s * 0.06, -0.15, 0.585, 1.6, 0.5, 0.6, tete); n.rotation.z = s * 0.45; });
      const bouche = new T.Mesh(new T.TorusGeometry(0.06, 0.022, 8, 20, Math.PI), new T.MeshBasicMaterial({ color: NOIR }));
      bouche.position.set(0, -0.3, 0.585); bouche.rotation.z = Math.PI; tete.add(bouche);
    } else {
      pose(sph(0.3, PEAU2, 0.05), 0, -0.22, 0.4, 0.92, 0.66, 0.72, tete);
      [-1, 1].forEach((s) => pose(sph(0.035, NOIR, 0), s * 0.08, -0.17, 0.61, 1, 0.7, 1, tete));
      const bouche = new T.Mesh(new T.TorusGeometry(0.075, 0.024, 8, 20, Math.PI), new T.MeshBasicMaterial({ color: NOIR }));
      bouche.position.set(0, -0.31, 0.6); bouche.rotation.z = Math.PI; tete.add(bouche);
    }
    [-1, 1].forEach((s) => { /* les yeux */
      const oe = new T.Group();
      pose(sph(0.27, SCL, 0.05), 0, 0, 0, 0.95, 1.08, 0.45, oe);
      pose(sph(0.18, '#3a2d18', 0), 0.01, -0.04, 0.09, 0.95, 1.05, 0.45, oe);
      pose(sph(0.09, '#120e08', 0), 0.01, -0.04, 0.14, 1, 1, 0.5, oe);
      pose(sph(0.05, '#fffbe8', 0), 0.08, 0.04, 0.15, 1, 1, 1, oe);
      pose(sph(0.29, PAUP, 0.05), 0, 0.27, -0.05, 1, 0.42, 0.5, oe);
      oe.position.set(s * 0.33, 0.07, 0.37); oe.rotation.y = s * 0.42; if (s < 0) oe.scale.x = -1; tete.add(oe);
    });
    [-1, 1].forEach((s) => { /* les oreilles */
      const or = new T.Group();
      pose(sph(0.15, PEAU, 0.05), 0.15, 0, 0, 1.45, 0.5, 0.85, or);
      or.position.set(s * 0.5, 0.05, -0.12); or.rotation.z = -0.65; or.rotation.y = -0.3; if (s < 0) { or.scale.x = -1; or.rotation.y = 0.3; } tete.add(or);
    });
    [-1, 1].forEach((s) => { /* les toutes petites cornes, en haut et en avant de la tete : devant la frange */
      const k = new T.Group();
      pose(sph(0.1, CO, 0.05), 0, 0, 0, 1.1, 0.9, 0.9, k);
      const geo = new T.ConeGeometry(0.085, 0.3, 12); geo.translate(0, 0.15, 0);
      const c = maille(geo, CO, 0.05); c.rotation.z = -0.7; k.add(c);
      pose(sph(0.035, CT, 0), 0.19, 0.23, 0, 1, 1, 1, k);
      k.position.set(s * 0.44, 0.4, 0.16); k.rotation.y = s * 0.2; k.rotation.x = 0.35; if (s < 0) k.scale.x = -1; tete.add(k);
    });
    tete.scale.setScalar(TT);
    tete.position.set(0, CY - 0.02, R * 0.92); tete.rotation.x = -0.08; g.add(tete);
    /* la petite frange de laine entre les cornes */
    pose(sph(0.24, L, 0.05), -0.18 * TT, tete.position.y + 0.52 * TT, tete.position.z - 0.2 * TT, 1, 0.85, 1, g);
    pose(sph(0.24, L, 0.05), 0.18 * TT, tete.position.y + 0.52 * TT, tete.position.z - 0.2 * TT, 1, 0.85, 1, g);
    pose(sph(0.22, L, 0.05), 0, tete.position.y + 0.58 * TT, tete.position.z - 0.06 * TT, 1, 0.85, 1, g);

    /* les pattes, courtes et trapues, sabots ronds (memes articulations que l'adulte) */
    g.userData.pattes = [];
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([a, b]) => {
      const hanche = new T.Group(); hanche.name = 'hanche'; hanche.userData.articule = true; hanche.position.set(a * 0.5 * R, 0.62 * LP, b * 0.42 * R); g.add(hanche);
      pose(cyl(0.17, 0.15, 0.42 * LP, PAT, 0.08), 0, -0.06 * LP, 0, 1, 1, 1, hanche);
      const genou = new T.Group(); genou.name = 'genou'; genou.userData.articule = true; genou.position.set(0, -0.27 * LP, 0); hanche.add(genou);
      pose(sph(0.155, PAT, 0.08), 0, 0, 0, 1, 0.95, 1, genou);
      const ys = -(0.35 * LP - 0.09); /* (le dessous du sabot au sol) */
      pose(cyl(0.17, 0.2, 0.18, SAB, 0.07), 0, ys, 0.01, 1, 1, 1.05, genou);
      pose(sph(0.17, SAB, 0.07), 0, ys + 0.08, 0.01, 1, 0.45, 1.05, genou);
      g.userData.pattes.push({ hanche, genou });
    });
    g.userData.tete = tete;
    return g;
  }
  /* LE BOUFTOU RETOUCHE (09/11/2026, « les Bouftous retouches sont un peu mieux », Mathieu, apres les bouclettes) : le Bouftou d'avant, meme laine, meme
     tete, memes yeux, memes cornes, sans la tige a pompon ni la touffe du dos (« l'espece de bitonio qu'ils ont au-dessus ») ; une petite queue ronde a
     l'arriere, deux oreilles tombantes, des sabots ronds a liseret. Memes articulations des pattes (hanche et genou) que le jeu anime */
  function retouche(T, maille, o) {
    const L = o.laine || '#efe8b3', CO = o.cornes || '#3f5f7c', CT = o.corneTip || '#6d90ad', SAB = '#34506a', PAT = '#7a6e45';
    const PEAU = o.peau || '#8f7f4d', PEAU2 = '#746538', PAUP = '#5f5233', SCL = '#e6d7a0';
    const sph = (r, c, e) => maille(new T.SphereGeometry(r, r >= 0.9 ? 18 : r >= 0.3 ? 14 : r >= 0.12 ? 10 : 7, r >= 0.9 ? 13 : r >= 0.3 ? 10 : r >= 0.12 ? 7 : 5), c, e);
    const cyl = (rh, rb, h, c, e) => maille(new T.CylinderGeometry(rh, rb, h, 14), c, e);
    const pose = (m, x, y, z, sx, sy, sz, parent) => { m.position.set(x, y, z); if (sx) m.scale.set(sx, sy || sx, sz || sx); parent.add(m); return m; };
    const g = new T.Group();
    const R = 1.2, CY = 1.55;

    /* la laine : noyau plus large que haut, trois couronnes de festons */
    pose(sph(R, L, 0.04), 0, CY, -0.1, 1.08, 0.92, 1.08, g);
    [[9, 0.0, 0.5, 0.5], [7, 0.6, 0.47, 0], [3, 1.1, 0.4, 0.3]].forEach(([n, lat, r, dec]) => {
      for (let i = 0; i < n; i++) {
        const a = (i + dec) / n * Math.PI * 2;
        const x = Math.cos(a) * Math.cos(lat) * R, z = Math.sin(a) * Math.cos(lat) * R * 1.02 - 0.1, y = CY + Math.sin(lat) * R * 0.85;
        if (z > 0.55 && y < CY + 0.35) continue; /* on laisse la place a la tete */
        pose(sph(r, L, 0.05), x, y, z, 1, 1, 1, g);
      }
    });
    pose(sph(0.3, L, 0.05), 0, CY + 0.12, -R * 1.12 - 0.1, 0.9, 1, 0.85, g); /* la petite queue ronde, a l'arriere */

    /* la tete : museau, narines, petit sourire, yeux sur les cotes a paupiere lourde */
    const tete = new T.Group();
    pose(sph(0.58, PEAU, 0.05), 0, 0, 0, 1.0, 0.95, 0.9, tete);
    pose(sph(0.34, PEAU2, 0.06), 0, -0.2, 0.42, 0.9, 0.65, 0.75, tete);
    [-1, 1].forEach((s) => pose(sph(0.04, '#2f2816', 0), s * 0.09, -0.16, 0.66, 1, 0.7, 1, tete));
    const bouche = new T.Mesh(new T.TorusGeometry(0.09, 0.028, 8, 24, Math.PI), new T.MeshBasicMaterial({ color: '#2f2816' }));
    bouche.position.set(0, -0.33, 0.66); bouche.rotation.z = Math.PI; tete.add(bouche);
    [-1, 1].forEach((s) => {
      const oe = new T.Group();
      pose(sph(0.3, SCL, 0.05), 0, 0, 0, 0.95, 1.1, 0.45, oe);
      pose(sph(0.18, '#3a2d18', 0), 0.02, -0.06, 0.1, 0.95, 1.05, 0.45, oe);
      pose(sph(0.08, '#120e08', 0), 0.02, -0.06, 0.16, 1, 1, 0.5, oe);
      pose(sph(0.05, '#fffbe8', 0), 0.1, 0.02, 0.14, 1, 1, 1, oe);
      const pp = pose(sph(0.32, PAUP, 0.05), 0, 0.22, -0.04, 1, 0.62, 0.55, oe); pp.rotation.z = -0.2;
      oe.position.set(s * 0.38, 0.08, 0.3); oe.rotation.y = s * 0.55; if (s < 0) oe.scale.x = -1; tete.add(oe);
    });
    /* deux oreilles tombantes, de la couleur de la tete, sous les cornes */
    [-1, 1].forEach((s) => {
      const or = new T.Group();
      pose(sph(0.17, PEAU, 0.05), 0.17, 0, 0, 1.45, 0.48, 0.85, or);
      or.position.set(s * 0.5, 0.12, -0.12); or.rotation.z = -0.7; or.rotation.y = -0.3; if (s < 0) { or.scale.x = -1; or.rotation.y = 0.3; } tete.add(or);
    });
    /* cornes version A */
    [-1, 1].forEach((s) => {
      const k = new T.Group();
      pose(sph(0.24, CO, 0.06), 0, 0, 0, 1.1, 1.0, 0.8, k);
      const geo = new T.ConeGeometry(0.2, 0.62, 16); geo.translate(0, 0.31, 0);
      const c = maille(geo, CO, 0.06); c.rotation.z = -0.95; k.add(c);
      pose(sph(0.07, CT, 0), 0.38, 0.36, 0.1, 1, 1, 1, k);
      k.position.set(s * 0.6, 0.55, 0.0); k.rotation.y = s * 0.3; if (s < 0) k.scale.x = -1; tete.add(k);
    });
    tete.position.set(0, 1.12, 0.98); tete.rotation.x = 0.15; g.add(tete);
    /* capuche de laine au-dessus de la tete */
    pose(sph(0.4, L, 0.05), -0.45, 2.1, 0.7, 1, 1, 1, g); pose(sph(0.4, L, 0.05), 0.45, 2.1, 0.7, 1, 1, 1, g); pose(sph(0.42, L, 0.05), 0, 2.1, 0.95, 1, 1, 1, g);

    /* pattes : cuisse, genou, canon, sabot rond a liseret (ordre : avant gauche, avant droite, arriere gauche, arriere droite) */
    g.userData.pattes = [];
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([a, b]) => {
      const hanche = new T.Group(); hanche.name = 'hanche'; hanche.userData.articule = true; hanche.position.set(a * 0.55, 0.62, b * 0.48); g.add(hanche);
      pose(cyl(0.18, 0.15, 0.42, PAT, 0.08), 0, -0.08, 0, 1, 1, 1, hanche);
      const genou = new T.Group(); genou.name = 'genou'; genou.userData.articule = true; genou.position.set(0, -0.27, 0); hanche.add(genou);
      pose(sph(0.16, PAT, 0.08), 0, 0, 0.01, 1, 0.95, 1.05, genou);
      pose(cyl(0.14, 0.155, 0.13, PAT, 0.08), 0, -0.075, 0, 1, 1, 1, genou);
      pose(cyl(0.18, 0.22, 0.2, SAB, 0.07), 0, -0.25, 0.015, 1, 1, 1.05, genou); /* (le dessous du sabot au sol) */
      pose(sph(0.18, SAB, 0.07), 0, -0.16, 0.015, 1, 0.45, 1.05, genou);
      g.userData.pattes.push({ hanche, genou });
    });
    g.userData.tete = tete;
    return g;
  }
  window.creerBouftou = function (T, maille, o) { o = o || {}; return o.bebe ? bebe(T, maille, o) : retouche(T, maille, o); };
})();
