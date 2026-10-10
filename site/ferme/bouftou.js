/* Bouftou valide par Mathieu le 09/10/2026 : version A (cornes courtes a pointe fine) avec la queue de la version B (tige et houppette).
   Modele propre a Regen, inspire de l'allure du jeu, rendu toon avec contours.
   Usage : const b = creerBouftou(THREE, maille, options) ; maille(geo, couleur, epaisseurContour) doit renvoyer un Object3D (maillage + contour). */
(function () {
  'use strict';
  window.creerBouftou = function (T, maille, o) {
    o = o || {};
    const L = o.laine || '#efe8b3', CO = o.cornes || '#3f5f7c', CT = o.corneTip || '#6d90ad', SAB = '#34506a', PAT = '#7a6e45';
    const PEAU = o.peau || '#8f7f4d', PEAU2 = '#746538', PAUP = '#5f5233', SCL = '#e6d7a0';
    const sph = (r, c, e) => maille(new T.SphereGeometry(r, 24, 18), c, e);
    const cyl = (rh, rb, h, c, e) => maille(new T.CylinderGeometry(rh, rb, h, 14), c, e);
    const pose = (m, x, y, z, sx, sy, sz, parent) => { m.position.set(x, y, z); if (sx) m.scale.set(sx, sy || sx, sz || sx); parent.add(m); return m; };
    const g = new T.Group();
    const R = 1.2, CY = 1.55;

    /* laine : noyau plus large que haut, trois couronnes de festons, touffe */
    pose(sph(R, L, 0.04), 0, CY, -0.1, 1.08, 0.92, 1.08, g);
    [[9, 0.0, 0.5, 0.5], [7, 0.6, 0.47, 0], [3, 1.1, 0.4, 0.3]].forEach(([n, lat, r, dec]) => {
      for (let i = 0; i < n; i++) {
        const a = (i + dec) / n * Math.PI * 2;
        const x = Math.cos(a) * Math.cos(lat) * R, z = Math.sin(a) * Math.cos(lat) * R * 1.02 - 0.1, y = CY + Math.sin(lat) * R * 0.85;
        if (z > 0.55 && y < CY + 0.35) continue; /* on laisse la place a la tete */
        pose(sph(r, L, 0.05), x, y, z, 1, 1, 1, g);
      }
    });
    pose(sph(0.34, L, 0.06), -0.5, CY + 1.2, -0.6, 1, 1, 1, g);
    pose(sph(0.24, L, 0.07), -0.75, CY + 1.45, -0.75, 1, 1, 1, g);

    /* tete de mouton olive, enfoncee sous la laine : museau, narines, petit sourire */
    const tete = new T.Group();
    pose(sph(0.58, PEAU, 0.05), 0, 0, 0, 1.0, 0.95, 0.9, tete);
    pose(sph(0.34, PEAU2, 0.06), 0, -0.2, 0.42, 0.9, 0.65, 0.75, tete);
    [-1, 1].forEach((s) => pose(sph(0.04, '#2f2816', 0), s * 0.09, -0.16, 0.66, 1, 0.7, 1, tete));
    const bouche = new T.Mesh(new T.TorusGeometry(0.09, 0.028, 8, 24, Math.PI), new T.MeshBasicMaterial({ color: '#2f2816' }));
    bouche.position.set(0, -0.33, 0.66); bouche.rotation.z = Math.PI; tete.add(bouche);
    /* yeux sur les cotes de la tete : ovales, blanc beige, paupiere lourde */
    [-1, 1].forEach((s) => {
      const oe = new T.Group();
      pose(sph(0.3, SCL, 0.05), 0, 0, 0, 0.95, 1.1, 0.45, oe);
      pose(sph(0.18, '#3a2d18', 0), 0.02, -0.06, 0.1, 0.95, 1.05, 0.45, oe);
      pose(sph(0.08, '#120e08', 0), 0.02, -0.06, 0.16, 1, 1, 0.5, oe);
      pose(sph(0.05, '#fffbe8', 0), 0.1, 0.02, 0.14, 1, 1, 1, oe);
      const pp = pose(sph(0.32, PAUP, 0.05), 0, 0.22, -0.04, 1, 0.62, 0.55, oe); pp.rotation.z = -0.2;
      oe.position.set(s * 0.38, 0.08, 0.3); oe.rotation.y = s * 0.55; if (s < 0) oe.scale.x = -1; tete.add(oe);
    });
    /* cornes version A : base ronde bleu ardoise, pointe courte vers le haut et l'exterieur */
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

    /* queue version B : petite tige olive dressee, houppette de laine */
    const tige = cyl(0.07, 0.09, 0.8, PAT, 0.1); tige.position.set(0.05, 2.5, -1.15); tige.rotation.x = 0.35; g.add(tige);
    pose(sph(0.28, L, 0.07), 0.05, 2.95, -1.3, 1, 1, 1, g);
    pose(sph(0.15, L, 0.08), 0.2, 3.15, -1.35, 1, 1, 1, g);

    /* pattes olive, sabots bleu nuit */
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([a, b]) => {
      pose(cyl(0.16, 0.19, 0.45, PAT, 0.08), a * 0.55, 0.325, b * 0.48, 1, 1, 1, g);
      pose(sph(0.24, SAB, 0.07), a * 0.55, 0.17, b * 0.48, 1, 0.7, 1.05, g);
    });
    g.userData.tete = tete;
    return g;
  };
})();
