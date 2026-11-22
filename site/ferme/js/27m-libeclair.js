'use strict';
/* LIBECLAIR, LA LIBELLULE-FOUDRE DE LA TRIBU DE LA MARE (22/11/2026, par Discord : « vas-y fais-la », puis « version 1 oui », « Libéclair j'aime bien », Mathieu ;
   dessin : maquettes/saison-des-pluies/libellule/v1-retenue.png). Le 12e monstre du palier 11, en version dev comme les autres.
   Son corps : le dessin redessine sans ailes (libeclair-sans-ailes.png), Rodin qualite haute, prepare (blender/sphere-ia-preparer.py), a la recette C de la DA
   (moitie texture, moitie aplats : outils/spheres/cuire_aplats.py et melanger_ab.py, blender/remplacer-texture.py) -> assets/modeles/jeu/libeclair-c.glb.
   Ses ailes : faites ici, quatre ailes translucides nervurees, pour qu'elles battent vite (une paire en avance sur l'autre), comme une vraie libellule.
   Elle vole a hauteur de tete, se balance, se penche en avancant, et te foudroie de loin (une magie vert-jaune) ; forces provisoires, sans sort a part. */
const LIBECLAIR = { modele: null, long: 2.1, vol: 1.2 };
chargerGlb('assets/modeles/jeu/libeclair-c.glb?v=' + VERSION_MODELES).then((g) => { LIBECLAIR.modele = g; }).catch(() => {});
let texAileLib = null;
function aileLibeclair() { /* une aile : longue, arrondie au bout, translucide, nervuree, cerclee de vert fonce ; sa racine en x = 0, elle s'etend vers +x */
  if (!texAileLib) texAileLib = texCanvas(256, (c, n) => { const h = n / 4, y0 = n / 2; c.clearRect(0, 0, n, n);
    const forme = () => { c.beginPath(); c.moveTo(6, y0); c.bezierCurveTo(n * 0.25, y0 - h * 1.15, n * 0.85, y0 - h * 1.05, n - 6, y0 - h * 0.15); c.bezierCurveTo(n - 2, y0 + h * 0.35, n * 0.6, y0 + h * 0.8, n * 0.2, y0 + h * 0.45); c.closePath(); };
    const g = c.createLinearGradient(0, 0, n, 0); g.addColorStop(0, 'rgba(190,240,120,0.55)'); g.addColorStop(0.25, 'rgba(200,236,240,0.38)'); g.addColorStop(1, 'rgba(215,240,245,0.28)'); forme(); c.fillStyle = g; c.fill();
    c.save(); forme(); c.clip(); c.strokeStyle = 'rgba(30,70,64,0.55)'; c.lineWidth = 1.4;
    for (let i = 0; i < 6; i++) { const yy = y0 - h * 0.8 + i * h * 0.3; c.beginPath(); c.moveTo(6, y0); c.quadraticCurveTo(n * 0.45, yy, n - 10, yy * 0.5 + (y0 - h * 0.2) * 0.5); c.stroke(); }
    for (let i = 1; i < 9; i++) { const xx = i * n / 9; c.beginPath(); c.moveTo(xx, y0 - h * 1.1); c.lineTo(xx + 8, y0 + h * 0.9); c.stroke(); } c.restore(); /* (les nervures) */
    forme(); c.lineWidth = 3.2; c.strokeStyle = '#1e463f'; c.stroke(); });
  const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: texAileLib, transparent: true, depthWrite: false, side: T.DoubleSide }));
  m.geometry.translate(0.5, 0, 0); m.rotation.x = -Math.PI / 2; return m; /* (a plat ; la racine au pivot) */
}
function fabriquerLibeclair() {
  const g = new T.Group(), vol = new T.Group(), corps = new T.Group(); g.add(vol); vol.add(corps); vol.position.y = LIBECLAIR.vol;
  if (LIBECLAIR.modele) { const m = LIBECLAIR.modele.clone(true), mats = new Set();
    m.traverse((o) => { if (!o.isMesh) return; const map = o.material.map; if (map) { map.encoding = T.LinearEncoding; map.needsUpdate = true; } o.material = new T.MeshToonMaterial({ color: '#ffffff', map: map || null, gradientMap: grad }); mats.add(o.material); o.castShadow = true; });
    m.scale.setScalar(LIBECLAIR.long); corps.add(m); if (typeof habillerSphB === 'function' && typeof RENDU_SPH_C !== 'undefined') habillerSphB(corps, mats, RENDU_SPH_C); /* (la recette C : ombre douce, contour fin) */ }
  else { const b = new T.Mesh(new T.CapsuleGeometry ? new T.CapsuleGeometry(0.18, 1.4, 4, 8) : new T.CylinderGeometry(0.18, 0.12, 1.6, 8), new T.MeshToonMaterial({ color: '#1f4a44', gradientMap: grad })); b.rotation.x = Math.PI / 2; corps.add(b); } /* (le temps que le modele arrive) */
  const L = LIBECLAIR.long, ailes = [];
  [[0.17, 1.05, 0.3, 0], [0.02, 0.95, 0.27, 1]].forEach(([z, lg, lr, paire]) => [-1, 1].forEach((sg) => { /* (deux paires, l'avant un peu plus longue ; l'arriere en decale) */
    const piv = new T.Group(), a = aileLibeclair(); a.scale.set(lg * L * 0.62, lr * L * 0.62, 1); a.rotation.z = 0; piv.add(a); if (sg < 0) piv.scale.x = -1;
    piv.position.set(sg * 0.05 * L, 0.11 * L, z * L); piv.rotation.y = sg * (paire ? -0.28 : 0.18); corps.add(piv); ailes.push({ piv, sg, paire }); }));
  g.userData = { hauteur: LIBECLAIR.vol + 0.35, libeclair: true, vol, corps, ailes, t: Math.random() * 10, x0: null };
  return g;
}
MONSTRES.libeclair = { element: 'vent', nom: 'Libéclair', fem: true, icone: 'libeclair', modele: 'chafer' /* (comme les autres monstres faits ici : le chargement de l'Arene dev demande un modele connu) */, fabrique: () => fabriquerLibeclair(),
  desc: 'la libellule-foudre de la tribu : elle vole au-dessus de la mêlée et te foudroie de loin', pv: (n) => 2800 + 85 * (n - 100), deg: (n) => 66 + Math.round(2 * (n - 100)),
  cadence: 2.2, vitesse: 3.4, portee: 6, distance: true, magie: true, couleurMagie: '#d8ff3a', ombre: 1.6, sansSaut: true }; /* (forces provisoires, sur le Silurmage : a regler en jouant) */
AVANT_PREMIERE.unshift('libeclair'); GROUPES_DEV.libeclair = { nom: 'Libéclair (essai)', liste: { libeclair: 3 } };
function animerLibeclair(dt) { /* ses ailes battent (une paire en avance), elle se balance et se penche en avancant */
  if (!combat || !combat.monstres) return;
  for (const o of combat.monstres) { const u = o.m && o.m.userData; if (!u || !u.libeclair) continue; u.t += dt; const t = u.t;
    const mort = o.etat === 'mort', f = mort ? 0 : 1;
    u.ailes.forEach((A) => { const ph = t * 46 + (A.paire ? 1.3 : 0); A.piv.rotation.z = A.sg * f * (0.15 + 0.55 * Math.sin(ph)); }); /* (le battement : vers le haut et le bas, autour de la racine) */
    const v = u.x0 ? Math.hypot(o.x - u.x0[0], o.z - u.x0[1]) / Math.max(dt, 1e-3) : 0; u.x0 = [o.x, o.z]; u.pench = (u.pench || 0) + ((Math.min(1, v / 3) * 0.22) - (u.pench || 0)) * Math.min(1, dt * 5);
    u.vol.position.y = mort ? Math.max(0.15, u.vol.position.y - dt * 2.5) : LIBECLAIR.vol + Math.sin(t * 3.1) * 0.09; /* (elle tombe quand elle meurt) */
    u.corps.rotation.x = u.pench + Math.sin(t * 2.3) * 0.04; u.corps.rotation.z = Math.sin(t * 1.7) * 0.05; }
}
(function boucleLibeclair(prec) { requestAnimationFrame((now) => { const dt = Math.min(0.05, Math.max(0, (now - prec) / 1000)); try { animerLibeclair(dt); } catch (e) { /* rien */ } boucleLibeclair(now); }); })(performance.now());
