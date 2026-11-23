'use strict';
/* LIBECLAIR, LA LIBELLULE-FOUDRE DE LA TRIBU DE LA MARE (22/11/2026, par Discord : « vas-y fais-la », puis « version 1 oui », « Libéclair j'aime bien », Mathieu ;
   dessin : maquettes/saison-des-pluies/libellule/v1-retenue.png). Le 12e monstre du palier 11, en version dev comme les autres.
   Son corps : le dessin redessine sans ailes (libeclair-sans-ailes.png), Rodin qualite haute, prepare (blender/sphere-ia-preparer.py), a la recette C de la DA
   (moitie texture, moitie aplats : outils/spheres/cuire_aplats.py et melanger_ab.py, blender/remplacer-texture.py) -> assets/modeles/jeu/libeclair-c.glb.
   Ses ailes : faites ici, quatre ailes translucides nervurees, pour qu'elles battent vite (une paire en avance sur l'autre), comme une vraie libellule.
   Elle vole a hauteur de tete, se balance, se penche en avancant, et te foudroie de loin (une magie vert-jaune) ; forces provisoires, sans sort a part. */
const LIBECLAIR = { modele: null, long: 2.1, vol: 1.2, arcs: [] };
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
  const bouche = new T.Object3D(); bouche.name = 'mainD'; bouche.position.set(0, 0.03 * L, 0.56 * L); corps.add(bouche); /* (devant sa tete, mesuree en jeu : le bout de la tete est a 0,5 L devant et 0,02 L au-dessus du centre ; la charge s'y forme, le tir en part) */
  [[0.17, 1.05, 0.3, 0], [0.02, 0.95, 0.27, 1]].forEach(([z, lg, lr, paire]) => [-1, 1].forEach((sg) => { /* (deux paires, l'avant un peu plus longue ; l'arriere en decale) */
    const piv = new T.Group(), a = aileLibeclair(); a.scale.set(lg * L * 0.62, lr * L * 0.62, 1); a.rotation.z = 0; piv.add(a); if (sg < 0) piv.scale.x = -1;
    piv.position.set(sg * 0.05 * L, 0.11 * L, z * L); piv.rotation.y = sg * (paire ? -0.28 : 0.18); corps.add(piv); ailes.push({ piv, sg, paire }); }));
  g.userData = { hauteur: LIBECLAIR.vol + 0.35, libeclair: true, vol, corps, ailes, bouche, t: Math.random() * 10, x0: null };
  return g;
}
MONSTRES.libeclair = { element: 'vent', nom: 'Libéclair', fem: true, icone: 'libeclair', modele: 'chafer' /* (comme les autres monstres faits ici : le chargement de l'Arene dev demande un modele connu) */, fabrique: () => fabriquerLibeclair(),
  desc: 'la libellule-foudre de la tribu : elle vole au-dessus de la mêlée et te foudroie de loin', pv: (n) => 1990 + 60 * (n - 100), /* (23/11/2026 : 2 800 + 85 avant ; l'Araknotron x1,12, tireur volant) */ deg: (n) => 50 + Math.round(1.5 * (n - 100)), /* (22/11/2026, equilibrage : 66 + 2 par vague avant ; 3 a 5 Libeclairs faisaient 22 a 34 % des degats des vagues 107 a 110 au bot, 2 a 3 fois un Crachopaud chacun) */
  cadence: 2.9 /* (2,2 avant le 22/11/2026 : ses tirs, qui touchent toujours, faisaient le tiers des degats recus par le Cra et l'Osamodas, 14 % pour le Iop) */, vitesse: 3.4, portee: 6, distance: true, magie: true, couleurMagie: '#d8ff3a', ombre: 1.6, sansSaut: true }; /* (forces provisoires, sur le Silurmage : a regler en jouant) */
AVANT_PREMIERE.unshift('libeclair'); GROUPES_DEV.libeclair = { nom: 'Libéclair (essai)', liste: { libeclair: 3 } };
/* SON ATTAQUE, UNE PETITE CHARGE ELECTRIQUE (22/11/2026, par Discord : « elles font pas des petites attaques comme celle que tu viens de faire [la grenouille],
   mais avec une petite charge electrique ? », Mathieu) : avant de tirer (0,45 s), une boule d'electricite grossit devant sa tete, de petits eclairs en
   sautent avec des etincelles, et elle se ramasse ; au tir, elle se detend en avant et la boule part de sa tete (le point « mainD », que le tir des
   monstres prend comme depart) ; la boule est cerclee de vert fonce (lisible meme sur le sable clair de l'Arene), deux eclairs changent sans cesse autour,
   des etincelles derriere ; a l'impact, un eclat blanc, six eclairs en etoile qui claquent, une gerbe d'etincelles et un anneau au sol. Les eclairs sont
   dessines epais (coeur blanc, vert-jaune, bord vert fonce) sur une image allongee, pour garder leur epaisseur a l'ecran. Ses degats et sa cadence ne
   changent pas (les tirs des monstres, 21-combat.js) */
TIRS.foudre = { v: 14, arc: 0.18, parD: 0.015 };
Object.assign(MONSTRES.libeclair, { projectile: 'foudre' }); delete MONSTRES.libeclair.magie; delete MONSTRES.libeclair.couleurMagie;
const TEX_ECLAIR = []; let texOrbe = null, texLueurF = null;
function texEclair() { /* quatre eclairs dessines sur une image 4 fois plus longue que haute, au hasard */
  if (!TEX_ECLAIR.length) for (let v = 0; v < 4; v++) { const c = document.createElement('canvas'), W = 256, H = 64; c.width = W; c.height = H; const x = c.getContext('2d');
    const P = [[8, H / 2]]; for (let i = 1; i < 7; i++) P.push([8 + i * (W - 16) / 7, H / 2 + (i % 2 ? 1 : -1) * (6 + Math.random() * 12)]); P.push([W - 8, H / 2]);
    const trait = (w, col) => { x.beginPath(); P.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.lineWidth = w; x.strokeStyle = col; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(); };
    trait(15, 'rgba(25,60,20,0.9)'); trait(9, '#c8ff2e'); trait(3.5, '#ffffff'); const t = new T.CanvasTexture(c); partager(t); TEX_ECLAIR.push(t); }
  return TEX_ECLAIR[Math.floor(Math.random() * TEX_ECLAIR.length)];
}
function spriteEclair(L, e, ancre) { const s = new T.Sprite(new T.SpriteMaterial({ map: texEclair(), transparent: true, depthWrite: false })); s.scale.set(L, e, 1); if (ancre) s.center.set(0, 0.5); return s; }
const texOrbeFoudre = () => texOrbe || (texOrbe = texCanvas(64, (c, n) => { const g = c.createRadialGradient(n * 0.45, n * 0.42, 1, n / 2, n / 2, n * 0.34); g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#eaff7a'); g.addColorStop(1, '#9fe02a');
  c.fillStyle = g; c.beginPath(); c.arc(n / 2, n / 2, n * 0.34, 0, Math.PI * 2); c.fill(); c.lineWidth = n * 0.07; c.strokeStyle = '#1e4a14'; c.stroke(); }));
const lueurFoudre = () => texLueurF || (texLueurF = texCanvas(64, (c, n) => { const g = c.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); g.addColorStop(0, 'rgba(240,255,140,0.95)'); g.addColorStop(0.45, 'rgba(200,255,60,0.4)'); g.addColorStop(1, 'rgba(200,255,60,0)'); c.fillStyle = g; c.fillRect(0, 0, n, n); }));
function bouleFoudre(tO, tH, nE, LE) { /* une boule d'electricite : un halo, la boule cerclee, nE eclairs qui changent toutes les 55 ms */
  const g = new T.Group(), halo = new T.Sprite(new T.SpriteMaterial({ map: lueurFoudre(), transparent: true, depthWrite: false, blending: T.AdditiveBlending })); halo.scale.setScalar(tH); g.add(halo);
  const b = new T.Sprite(new T.SpriteMaterial({ map: texOrbeFoudre(), transparent: true, depthWrite: false })); b.scale.setScalar(tO); g.add(b);
  for (let i = 0; i < nE; i++) { const s = spriteEclair(LE, LE * 0.3); let t = 0; s.onBeforeRender = () => { const now = performance.now(); if (now - t < 55) return; t = now; s.material.map = texEclair(); s.material.rotation = Math.random() * Math.PI * 2; }; g.add(s); }
  g.userData.halo = halo; g.userData.boule = b; return g;
}
const orbeFoudre = () => bouleFoudre(0.5, 1.25, 2, 0.95); /* (le projectile) */
function eclairsEtoile(p, n, R, duree) { /* des eclairs qui partent d'un point en etoile et claquent (ils changent deux fois, restent pleins puis s'effacent) */
  const L = []; for (let i = 0; i < n; i++) { const r = R * (0.75 + Math.random() * 0.45), s = spriteEclair(r, r * 0.3, true); s.material.rotation = i / n * Math.PI * 2 + Math.random() * 0.4; s.position.copy(p); scene.add(s); L.push(s); }
  let t = 0, prochain = duree / 3; effets.push((dt) => { t += dt; if (t >= prochain && t < duree) { prochain += duree / 3; L.forEach((s) => { s.material.map = texEclair(); }); }
    L.forEach((s) => { s.material.opacity = Math.max(0, Math.min(1, 2.5 * (1 - t / duree))); }); if (t < duree) return false; L.forEach((s) => { scene.remove(s); s.material.dispose(); }); return true; });
}
function eclatFoudre(p, taille, duree) { /* l'eclat blanc de l'impact */
  const s = new T.Sprite(new T.SpriteMaterial({ map: lueurFoudre(), transparent: true, depthWrite: false, blending: T.AdditiveBlending })); s.position.copy(p); scene.add(s); let t = 0;
  effets.push((dt) => { t += dt; const k = Math.min(1, t / duree); s.scale.setScalar(taille * (0.6 + 0.6 * k)); s.material.opacity = 1 - k; if (k < 1) return false; scene.remove(s); s.material.dispose(); return true; });
}
function impactFoudre(p) {
  eclatFoudre(p, 2.0, 0.22); etoileImpact(p, 0.8, '#e8ff5a'); eclairsEtoile(p, 6, 1.25, 0.3);
  emettre(FX_VIF, 12, { x: p.x, y: p.y, z: p.z, r: 0.08, dv: 4.5, haut: true, vie: [0.2, 0.35], taille: [0.11, 0.03], c: ['#ffffff', '#e8ff5a'], grav: 5, frein: 2 });
  onde(p.x, solA(p.x, p.z) + 0.03, p.z, 1.2, '#9fe02a', 0.28, 0.8);
}
const projectileMonstreLib = projectileMonstre; projectileMonstre = function (type, mo) { return type === 'foudre' ? orbeFoudre() : projectileMonstreLib(type, mo); };
const traineeTirLib = traineeTir; traineeTir = function (type, p, mo) { if (type !== 'foudre') return traineeTirLib(type, p, mo);
  if (fxAlea() < 0.8) emettre(FX_VIF, 1, { x: p.x, y: p.y, z: p.z, r: 0.08, dv: 1.4, vie: [0.15, 0.28], taille: [0.09, 0.02], c: ['#ffffff', '#c8ff2e'], grav: 2 }); };
const impactTirLib = impactTir; impactTir = function (type, p, mo, perso) { if (type !== 'foudre') return impactTirLib(type, p, mo, perso); impactFoudre(p); };
const tirMonstreLib = tirMonstre; tirMonstre = function (mo, bat, caw) { /* au tir : elle se detend en avant et des eclairs claquent a sa tete ; pas de nuage de poussiere en l'air */
  if (!mo || mo.d.projectile !== 'foudre') return tirMonstreLib(mo, bat, caw);
  const u = mo.m && mo.m.userData; if (u && u.libeclair) { u.tir = 0; const q = teteLibeclair(u); if (q) eclairsEtoile(q, 4, 0.7, 0.16); }
  const p0 = pouf; pouf = () => {}; try { return tirMonstreLib(mo, bat, caw); } finally { pouf = p0; } };
const teteLibeclair = (u) => (u.bouche ? u.bouche.getWorldPosition(new T.Vector3()) : null); /* (devant sa tete, ou se forme la charge et d'ou part le tir) */
function chargeLibeclair(o, u, dt) { /* les 0,45 s avant le tir : la boule grossit devant sa tete, de petits eclairs en sautent ; renvoie la charge, de 0 a 1 */
  const charge = o.etat === 'actif' && o.arrete && o.cd > 0 && o.cd < 0.45, k = charge ? 1 - o.cd / 0.45 : 0;
  if (!u.arcs) { u.arcs = [0, 1].map(() => { const s = spriteEclair(0.5, 0.15, true); s.visible = false; scene.add(s); LIBECLAIR.arcs.push(s); return s; }); }
  if (!u.charge && u.bouche) { u.charge = bouleFoudre(0.4, 1.0, 1, 0.6); u.charge.visible = false; u.bouche.add(u.charge); }
  if (u.charge) { u.charge.visible = charge; if (charge) { const f = 0.25 + 0.75 * k, fl = 1 + 0.12 * Math.sin(u.t * 60); u.charge.scale.setScalar(f * fl); } }
  if (!charge) { u.arcs.forEach((s) => { s.visible = false; }); return 0; }
  const q = teteLibeclair(u); if (!q) return k;
  u.arcs.forEach((s) => { s.visible = Math.random() < 0.8; if (!s.visible) return; s.position.copy(q); s.material.map = texEclair(); s.material.rotation = Math.random() * Math.PI * 2; const L = 0.35 + Math.random() * 0.4; s.scale.set(L, L * 0.3, 1); });
  if (fxAlea() < dt * 30) emettre(FX_VIF, 1, { x: q.x, y: q.y, z: q.z, r: 0.15, dv: 1.6, vie: [0.12, 0.22], taille: [0.09, 0.02], c: ['#ffffff', '#e8ff5a'], grav: 1 });
  return k;
}
function animerLibeclair(dt) { /* ses ailes battent (une paire en avance), elle se balance et se penche en avancant */
  if (!combat || !combat.monstres) { LIBECLAIR.arcs.forEach((l) => { scene.remove(l); l.material.dispose(); }); LIBECLAIR.arcs = []; return; } /* (ses arcs de charge partent avec le combat) */
  for (const o of combat.monstres) { const u = o.m && o.m.userData; if (!u || !u.libeclair) continue; u.t += dt; const t = u.t;
    const mort = o.etat === 'mort', f = mort ? 0 : 1;
    const k = mort ? 0 : chargeLibeclair(o, u, dt); /* (la charge electrique avant le tir) */
    let avance = -0.07 * LIBECLAIR.long * k; if (u.tir != null) { u.tir += dt; const e = Math.sin(Math.min(1, u.tir / 0.3) * Math.PI); avance = 0.12 * LIBECLAIR.long * e; if (u.tir >= 0.3) u.tir = null; } /* (elle se ramasse en arriere, puis se detend en avant au tir) */
    u.corps.position.z = avance; const sq = 1 + 0.06 * k; u.corps.scale.set(sq, 1 / sq, 1);
    u.ailes.forEach((A) => { const ph = t * 46 + (A.paire ? 1.3 : 0); A.piv.rotation.z = A.sg * f * (0.15 + 0.55 * Math.sin(ph)); }); /* (le battement : vers le haut et le bas, autour de la racine) */
    const v = u.x0 ? Math.hypot(o.x - u.x0[0], o.z - u.x0[1]) / Math.max(dt, 1e-3) : 0; u.x0 = [o.x, o.z]; u.pench = (u.pench || 0) + ((Math.min(1, v / 3) * 0.22) - (u.pench || 0)) * Math.min(1, dt * 5);
    u.vol.position.y = mort ? Math.max(0.15, u.vol.position.y - dt * 2.5) : LIBECLAIR.vol + Math.sin(t * 3.1) * 0.09; /* (elle tombe quand elle meurt) */
    u.corps.rotation.x = u.pench + Math.sin(t * 2.3) * 0.04; u.corps.rotation.z = Math.sin(t * 1.7) * 0.05; }
}
(function boucleLibeclair(prec) { requestAnimationFrame((now) => { const dt = Math.min(0.05, Math.max(0, (now - prec) / 1000)); try { animerLibeclair(dt); } catch (e) { /* rien */ } boucleLibeclair(now); }); })(performance.now());
