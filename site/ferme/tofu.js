/* Tofu valide par Mathieu le 09/10/2026 : version 1 « Fidele » (boule jaune, trois plumes couchees vers l'arriere, gros yeux cote a cote, mini ailes, pattes orange).
   Modele propre a Regen, inspire de l'allure du jeu, rendu toon avec contours.
   Usage : const t = creerTofu(THREE, maille) ; maille(geo, couleur, epaisseurContour) doit renvoyer un Object3D (maillage + contour). */
(function () {
  'use strict';
  window.creerTofu = function (T, maille, o) {
    o = o || {};
    const J = o.plume || '#f9e24a', JF = o.plumeSombre || '#e8c428', O = '#f0891e';
    const sph = (r, c, e) => maille(new T.SphereGeometry(r, 24, 18), c, e);
    const cone = (r, h, c, e) => { const geo = new T.ConeGeometry(r, h, 12); geo.translate(0, h / 2, 0); return maille(geo, c, e); };
    const pose = (m, x, y, z, sx, sy, sz, parent) => { m.position.set(x, y, z); if (sx) m.scale.set(sx, sy || sx, sz || sx); parent.add(m); return m; };
    const g = new T.Group();
    /* corps : une boule */
    pose(sph(0.9, J, 0.045), 0, 1.05, 0, 1, 1, 1.05, g);
    /* crete : trois plumes pointues couchees vers l'arriere, celle du milieu plus claire */
    [[0, 1.85, -0.2, 0.9, 0, -0.75, J], [0.22, 1.8, -0.25, 0.75, 0.35, -0.9, JF], [-0.22, 1.8, -0.25, 0.75, -0.35, -0.9, JF]].forEach(([x, y, z, h, rz, rx, c]) => {
      const p = cone(0.13, h, c, 0.08); p.position.set(x, y, z); p.rotation.set(rx, 0, rz); p.scale.z = 0.5; g.add(p);
    });
    /* yeux : gros, ronds, cote a cote, pupille qui regarde un peu de cote, reflet */
    [-1, 1].forEach((s) => {
      const x = s * 0.37, y = 1.22, z = 0.68, r = 0.38;
      pose(sph(r, '#fffdf4', 0.05), x, y, z, 1, 1.05, 0.55, g);
      pose(sph(r * 0.5, '#1d1710', 0), x + 0.12 * r, y - r * 0.05, z + r * 0.3, 1, 1.1, 0.5, g);
      pose(sph(r * 0.17, '#ffffff', 0), x + 0.12 * r + s * r * 0.18, y + r * 0.28, z + r * 0.5, 1, 1, 1, g);
    });
    const bec = cone(0.1, 0.24, O, 0.1); bec.position.set(0, 0.88, 0.9); bec.rotation.x = Math.PI / 2; g.add(bec);
    /* mini ailes rondes */
    pose(sph(0.26, JF, 0.07), -0.82, 1.0, 0.1, 1.1, 0.75, 0.45, g);
    pose(sph(0.26, JF, 0.07), 0.82, 1.0, 0.1, 1.1, 0.75, 0.45, g);
    /* pattes orange a trois doigts */
    [-1, 1].forEach((s) => {
      pose(sph(0.2, O, 0.08), s * 0.3, 0.16, 0.15, 1.2, 0.5, 1.6, g);
      [-0.12, 0, 0.12].forEach((dx) => pose(sph(0.07, O, 0.1), s * 0.3 + dx, 0.16, 0.42, 1, 0.6, 1.6, g));
    });
    return g;
  };
})();
