/* LES COFFRES DU PODIUM DE L'ILE DES BOSS (20/11/2026, « pour les recompenses avec ce boss, coffre epique, legendaire, rare pour le top 3 » puis « faudrait
   faire de nouveaux designs de coffre » et « travaille-les plus, rends-les incroyables », Mathieu). Ses couleurs :
     rare : rouge, dore et bois (couvercle laque rouge, caisse en planches, ferrures dorees, ecusson serti d'un rubis) ;
     epique : violet et violet fonce sur un fond presque noir, de l'or, comme le sanctuaire du niveau 100 (pierre sombre, runes violettes qui luisent, cristaux
       aux coins, une couronne d'or qui tourne lentement au sommet avec son cristal) ;
     legendaire : turquoise (« et ce que tu veux ») : panneaux d'ivoire et d'or, incrustations turquoise et runes qui luisent, pieds a griffes d'or, et
       au-dessus un grand cristal turquoise qui flotte dans un anneau d'or qui tourne, avec un halo.
   Meme famille et meme retour que le coffre du jour (construireCoffre3d, 16-progression.js : { g, ch, lum, L, P, H, R }), plus anim(dt) pour ce qui bouge. */
const PAL_COFFRES = {
  rare: { caisse: '#8a4a22', planche: '#5e2e12', couv: '#b3262d', couvF: '#7d1419', or: '#f2b630', orF: '#b8801a', gemme: '#e0233c', lueur: '#ffb070' },
  epique: { caisse: '#221c33', caisseC: '#2e2645', incrust: '#5b2a9a', couv: '#4b2585', couvF: '#2e1556', or: '#f2c14a', orF: '#b98a22', gemme: '#a465e6', rune: '#c890ff', lueur: '#b77cff' },
  legendaire: { caisse: '#f1e6cf', caisseC: '#fff6e2', incrust: '#14a7a0', couv: '#1aa9a3', couvF: '#0d6f6b', or: '#f6c443', orF: '#c08a1c', gemme: '#3ff0e2', rune: '#8ffcf2', lueur: '#5ff5e8' } };
/* une boite aux aretes arrondies (extrusion biseautee), centree */
function boiteRonde(w, h, d, b) {
  b = Math.min(b, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3); const s = new T.Shape(), x = w / 2 - b, y = h / 2 - b;
  s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 2 }); g.translate(0, 0, -(d - 2 * b) / 2); return g;
}
let TEX_HALO_COFFRE = null;
function construireCoffreRarete(rar) {
  const C = PAL_COFFRES[rar] || PAL_COFFRES.rare, niv = { rare: 1, epique: 2, legendaire: 3 }[rar] || 1, R = 0.1;
  const L = R * (7.4 + niv * 0.25), P = R * (4.6 + niv * 0.15), H = R * (3.4 + niv * 0.1), g = new T.Group(), anims = [];
  const M = (geo, c, sans) => cofMaille(geo, c, sans), lumineux = (geo, c) => { const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: c })); m.raycast = () => {}; return m; };
  const pose = (o, x, y, z, rx, ry, rz, par) => { o.position.set(x, y, z); o.rotation.set(rx || 0, ry || 0, rz || 0); (par || g).add(o); return o; };
  const BR = (w, h, d, c, b) => M(boiteRonde(w, h, d, b == null ? R * 0.06 : b), c), clou = (r, c) => M(new T.IcosahedronGeometry(r, 1), c, true);
  const y0 = niv >= 3 ? R * 0.55 : R * 0.12; /* (socle, et les pieds du legendaire) */
  /* ---------------- la caisse ---------------- */
  pose(BR(L + R * 0.32, R * 0.26, P + R * 0.32, niv === 1 ? C.planche : C.or, R * 0.08), 0, y0 + R * 0.05, 0); /* (le socle) */
  pose(BR(L, H, P, C.caisse, R * 0.05), 0, y0 + H / 2, 0);
  if (niv === 1) { for (let k = 1; k < 4; k++) pose(BR(L * 1.006, R * 0.05, P * 1.006, C.planche, R * 0.02), 0, y0 + H * k / 4, 0); } /* (les planches) */
  else { /* (les panneaux encadres, et leurs incrustations) */
    const fw = L * 0.74, fh = H * 0.6;
    pose(BR(fw, fh, R * 0.12, C.or, R * 0.04), 0, y0 + H * 0.5, P / 2 + R * 0.02); pose(BR(fw - R * 0.3, fh - R * 0.3, R * 0.14, C.incrust, R * 0.03), 0, y0 + H * 0.5, P / 2 + R * 0.04);
    [-1, 1].forEach((s) => { pose(BR(R * 0.12, fh, P * 0.66, C.or, R * 0.04), s * (L / 2 + R * 0.02), y0 + H * 0.5, 0); pose(BR(R * 0.14, fh - R * 0.3, P * 0.66 - R * 0.3, C.incrust, R * 0.03), s * (L / 2 + R * 0.04), y0 + H * 0.5, 0); });
    /* les runes qui luisent, dans les incrustations */
    const rune = (x, y, z, w, h, ry) => pose(lumineux(new T.BoxGeometry(w, h, R * 0.02), C.rune), x, y, z, 0, ry || 0, 0);
    [-0.32, 0.32].forEach((u) => { rune(u * L, y0 + H * 0.5, P / 2 + R * 0.12, R * 0.05, fh * 0.55); rune(u * L, y0 + H * 0.5, P / 2 + R * 0.12, R * 0.35, R * 0.05); });
    [-1, 1].forEach((s) => rune(s * (L / 2 + R * 0.12), y0 + H * 0.5, 0, P * 0.4, R * 0.05, Math.PI / 2));
  }
  /* l'interieur : un fond sombre, un tas de kamas et des gemmes de sa couleur (on les voit a l'ouverture) */
  pose(BR(L * 0.9, R * 0.06, P * 0.84, '#1e1008', R * 0.02), 0, y0 + H * 0.985, 0);
  { const tas = new T.Group(); tas.position.y = y0 + H * 0.9; g.add(tas); let s0 = 11 + niv; const h = () => (s0 = (s0 * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 26; i++) { const a = i * 2.4, r = R * 2.6 * Math.sqrt((i + 0.5) / 26), y = (1 - (r / (R * 2.6)) ** 2) * R * 1.0 + h() * R * 0.1, k = cofPiece(); if (!k) break; pose(k, Math.cos(a) * r * 1.05, y, Math.sin(a) * r * (P / (R * 9.5)), (h() - 0.5) * 0.9, h() * 6, (h() - 0.5) * 0.9, tas); }
    [[-L * 0.25, R * 0.8, R * 0.2], [L * 0.2, R * 0.85, -R * 0.3], [L * 0.03, R * 1.1, R * 0.15], [-L * 0.08, R * 1.0, -R * 0.6]].slice(0, 1 + niv).forEach(([x, y, z], i) => pose(cofGemme(C.gemme, R * 0.38, i % 2 === 1), x, y, z, 0.3, i, 0.2, tas)); }
  /* les coins renforces, et leurs pommeaux */
  [-1, 1].forEach((s) => [-1, 1].forEach((t) => { pose(BR(R * 0.62, H * 1.04, R * 0.62, C.or, R * 0.08), s * (L / 2 - R * 0.1), y0 + H / 2, t * (P / 2 - R * 0.1));
    if (niv >= 2) pose(clou(R * 0.2, C.or), s * (L / 2 - R * 0.1), y0 + H + R * 0.16, t * (P / 2 - R * 0.1)); }));
  /* les bordures et leurs clous */
  [0.06, 0.95].forEach((k) => pose(BR(L * 1.02, R * 0.2, P * 1.02, C.or, R * 0.05), 0, y0 + H * k, 0));
  for (let i = -3; i <= 3; i++) if (Math.abs(i) > 1 || niv === 1) [0.06, 0.95].forEach((k) => pose(clou(R * 0.075, C.orF), i * L * 0.11, y0 + H * k, P / 2 + R * 0.12));
  /* les poignees des cotes */
  [-1, 1].forEach((s) => { pose(BR(R * 0.18, R * 0.7, R * 1.0, C.or, R * 0.05), s * (L / 2 + R * 0.08), y0 + H * 0.7, 0); const a = M(new T.TorusGeometry(R * 0.5, R * 0.09, 8, 18), C.or); pose(a, s * (L / 2 + R * 0.2), y0 + H * 0.52, 0, 0, Math.PI / 2, 0); });
  /* l'ecusson de la serrure, et sa gemme */
  { const w = R * 1.5, h = R * 1.9, s = new T.Shape(); s.moveTo(-w / 2, h / 2); s.lineTo(w / 2, h / 2); s.lineTo(w / 2, -h * 0.05); s.quadraticCurveTo(w / 2, -h * 0.32, 0, -h / 2); s.quadraticCurveTo(-w / 2, -h * 0.32, -w / 2, -h * 0.05); s.closePath();
    const eg = new T.ExtrudeGeometry(s, { depth: R * 0.12, bevelEnabled: true, bevelThickness: R * 0.04, bevelSize: R * 0.04, bevelSegments: 2, curveSegments: 8 });
    pose(M(eg, C.or), 0, y0 + H * 0.66, P / 2 + R * 0.12); pose(M(new T.CylinderGeometry(R * 0.33, R * 0.33, R * 0.1, 16), C.orF), 0, y0 + H * 0.7, P / 2 + R * 0.3, Math.PI / 2, 0, 0);
    pose(cofGemme(C.gemme, R * (0.26 + niv * 0.04), true), 0, y0 + H * 0.7, P / 2 + R * 0.38); pose(M(new T.BoxGeometry(R * 0.12, R * 0.3, R * 0.08), '#2a1206', true), 0, y0 + H * 0.5, P / 2 + R * 0.3); }
  /* les cristaux des coins (epique) */
  if (niv === 2) [-1, 1].forEach((s) => [-1, 1].forEach((t) => { const k = new T.Group(); [[0, 0.32, 0], [0.12, 0.2, 0.5], [-0.1, 0.22, -0.4]].forEach(([dx, hh, a]) => { const c = M(new T.OctahedronGeometry(R * 0.16, 0), C.gemme); c.scale.set(0.7, hh / 0.16 * 0.6, 0.7); c.position.set(dx * R, hh * R * 0.6, 0); c.rotation.z = a * 0.6; k.add(c); });
    k.scale.setScalar(1.7); pose(k, s * (L / 2 - R * 0.1), y0 + H + R * 0.32, t * (P / 2 - R * 0.1)); }));
  /* les pieds a griffes (legendaire) */
  if (niv >= 3) [-1, 1].forEach((s) => [-1, 1].forEach((t) => { const p = new T.Group(); p.add(clou(R * 0.3, C.or)); for (let i = -1; i <= 1; i++) { const gr = M(new T.ConeGeometry(R * 0.08, R * 0.28, 6), C.orF); gr.position.set(i * R * 0.15, -R * 0.18, R * 0.24); gr.rotation.x = Math.PI / 2 + 0.5; p.add(gr); }
    pose(p, s * (L / 2 - R * 0.05), R * 0.3, t * (P / 2 - R * 0.05), 0, t > 0 ? 0 : Math.PI, 0); }));
  /* ---------------- le couvercle, sur sa charniere a l'arriere ---------------- */
  const ch = new T.Group(); ch.position.set(0, y0 + H, -P / 2); g.add(ch);
  const dome = M(new T.CylinderGeometry(P / 2, P / 2, L * 0.98, 32, 1, false, 0, Math.PI), C.couv); dome.rotation.z = Math.PI / 2; dome.position.set(0, 0, P / 2); ch.add(dome);
  pose(BR(L * 0.99, R * 0.14, P * 0.99, '#2a160a', R * 0.03), 0, -R * 0.02, P / 2, 0, 0, 0, ch); /* (le dessous du couvercle, sombre) */
  [-1, 1].forEach((s) => { pose(BR(L * 1.02, R * 0.2, R * 0.16, C.or, R * 0.05), 0, -R * 0.03, P / 2 + s * (P / 2 + R * 0.01), 0, 0, 0, ch); pose(BR(R * 0.16, R * 0.2, P * 1.02, C.or, R * 0.05), s * (L / 2 + R * 0.01), -R * 0.03, P / 2, 0, 0, 0, ch); }); /* (la levre d'or, un cadre) */
  [-1, 1].forEach((s) => { /* les flasques des bouts : la couleur du couvercle, cerclees d'or */
    const f = M(new T.CylinderGeometry(P / 2 * 0.99, P / 2 * 0.99, R * 0.12, 32, 1, false, 0, Math.PI), C.couvF); f.rotation.z = Math.PI / 2; f.position.set(s * L * 0.495, 0, P / 2); ch.add(f);
    const cer = M(new T.TorusGeometry(P / 2, R * 0.08, 8, 32, Math.PI), C.or); cer.rotation.y = Math.PI / 2; cer.position.set(s * L * 0.5, 0, P / 2); ch.add(cer); });
  const bandes = niv === 1 ? [-0.3, 0.3] : [-0.36, 0, 0.36];
  bandes.forEach((u) => { const ba = M(new T.TorusGeometry(P / 2 * 1.02, R * (0.11 + niv * 0.02), 8, 32, Math.PI), C.or); ba.rotation.y = Math.PI / 2; ba.position.set(u * L, 0, P / 2); ch.add(ba);
    for (let i = 1; i < 6; i++) { const a = i / 6 * Math.PI; pose(clou(R * 0.07, C.orF), u * L, Math.sin(a) * P / 2 * 1.08, P / 2 + Math.cos(a) * P / 2 * 1.08, 0, 0, 0, ch); } }); /* (et leurs clous) */
  pose(BR(R * 1.0, R * 0.8, R * 0.22, C.or, R * 0.05), 0, -R * 0.3, P + R * 0.1, 0, 0, 0, ch); /* (le moraillon) */
  if (niv >= 2) { /* le medaillon serti, sur la pente avant */
    const a = Math.PI * 0.3, x0 = 0, yy = Math.sin(a) * P / 2, zz = P / 2 + Math.cos(a) * P / 2;
    pose(M(new T.CylinderGeometry(R * 0.7, R * 0.7, R * 0.12, 24), C.or), x0, yy, zz, Math.PI / 2 - a, 0, 0, ch);
    pose(M(new T.TorusGeometry(R * 0.55, R * 0.05, 6, 24), C.orF), x0, yy + Math.sin(a) * R * 0.02, zz + Math.cos(a) * R * 0.07, -a, 0, 0, ch);
    pose(cofGemme(C.gemme, R * 0.34, false), x0, yy + Math.sin(a) * R * 0.14, zz + Math.cos(a) * R * 0.14, Math.PI / 2 - a, 0, 0, ch);
    if (niv >= 2) [-1, 1].forEach((s) => pose(lumineux(new T.BoxGeometry(L * 0.18, R * 0.04, R * 0.02), C.rune), s * L * 0.18, yy, zz + R * 0.01, -a, 0, 0, ch)); }
  /* ---------------- le sommet ---------------- */
  if (niv === 2) { /* la couronne d'or qui tourne lentement, et son cristal (le sanctuaire du niveau 100) */
    const cr = new T.Group(); cr.position.set(0, P / 2 + R * 0.12, P / 2); ch.add(cr);
    cr.scale.setScalar(1.45); cr.add(M(new T.CylinderGeometry(R * 0.55, R * 0.7, R * 0.22, 18), C.or));
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, pt = M(new T.ConeGeometry(R * 0.11, R * (i % 2 ? 0.32 : 0.48), 5), C.or); pt.position.set(Math.cos(a) * R * 0.56, R * 0.24, Math.sin(a) * R * 0.56); cr.add(pt); if (!(i % 2)) { const b = clou(R * 0.07, C.gemme); b.position.set(Math.cos(a) * R * 0.56, R * 0.5, Math.sin(a) * R * 0.56); cr.add(b); } }
    const cx = cofGemme(C.gemme, R * 0.34, false); cx.position.y = R * 0.5; cr.add(cx);
    anims.push((dt, t) => { cr.rotation.y += dt * (Math.PI * 2 / 40); cx.position.y = R * (0.5 + 0.04 * Math.sin(t * 2)); }); }
  if (niv >= 3) { /* le grand cristal turquoise qui flotte dans son anneau d'or, et le halo */
    const haut = new T.Group(); haut.position.set(0, P / 2 + R * 1.25, P / 2); haut.scale.setScalar(1.45); ch.add(haut);
    const support = M(new T.CylinderGeometry(R * 0.32, R * 0.55, R * 0.25, 16), C.or); support.position.y = -R * 0.78; haut.add(support);
    const cri = cofGemme(C.gemme, R * 0.55, false); cri.scale.y *= 1.25; haut.add(cri);
    const anneau = M(new T.TorusGeometry(R * 0.85, R * 0.07, 8, 40), C.or); anneau.rotation.x = Math.PI / 2 - 0.35; haut.add(anneau);
    const petites = [0, 1, 2].map((i) => { const p = clou(R * 0.09, C.gemme); haut.add(p); return p; });
    if (!TEX_HALO_COFFRE) TEX_HALO_COFFRE = texCanvas(64, (c2, n) => { const r = c2.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(0.35, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); c2.fillStyle = r; c2.fillRect(0, 0, n, n); });
    const halo = new T.Sprite(new T.SpriteMaterial({ map: TEX_HALO_COFFRE, color: C.lueur, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); halo.scale.setScalar(R * 3.6); halo.renderOrder = 5; haut.add(halo);
    anims.push((dt, t) => { cri.rotation.y += dt * 0.9; cri.position.y = R * 0.08 * Math.sin(t * 1.8); anneau.rotation.z += dt * 0.6; halo.material.opacity = 0.75 + 0.2 * Math.sin(t * 2.4);
      petites.forEach((p, i) => { const a = t * 1.4 + i / 3 * Math.PI * 2; p.position.set(Math.cos(a) * R * 0.85, Math.sin(a * 2) * R * 0.12, Math.sin(a) * R * 0.85); }); }); }
  const lum = new T.PointLight(C.lueur, niv >= 2 ? 0.7 : 0, R * 18); lum.position.set(0, y0 + H + R * 1.6, R * 0.6); g.add(lum);
  let tA = 0; const anim = (dt) => { tA += dt; anims.forEach((f) => f(dt, tA)); }; anim(0.01);
  return { g, ch, lum, L, P, H: y0 + H, R, couleur: C.lueur, niv, anim };
}

/* LES COFFRES DU PODIUM EN 3D GENEREE (21/11/2026, « on les ferait pas avec Artlist ? en mode giga bogoss ? et on fera des petites animations quand il
   s'ouvre, comme sur les jeux mobiles », Mathieu ; dessins Artlist choisis au formulaire : legendaire 1, epique 3, rare 2 ; 3D Rodin, coupes en corps et
   couvercle articule par blender/coffres-ia-decouper.py, maquettes/coffres-podium-ia/) : 1er legendaire, 2e epique, 3e rare. Ils remplacent les coffres
   construits plus haut (construireCoffreRarete), qui restent la roue de secours si le modele ne se charge pas. Le legendaire retrouve ici son grand cristal
   flottant dans un anneau d'or (le modele l'avait soude en un plateau gris : il est retire a la decoupe) ; le cristal de la couronne de l'epique flotte. */
const RANG_COFFRE = ['legendaire', 'epique', 'rare'], COFFRES_IA = {}, COFFRES_IA_PRETS = {};
function chargerCoffreIA(rar) {
  if (!COFFRES_IA[rar]) COFFRES_IA[rar] = chargerGlb('assets/modeles/jeu/coffre-podium-' + rar + '.glb?v=' + VERSION_MODELES).then((sc) => (COFFRES_IA_PRETS[rar] = sc)).catch((e) => { delete COFFRES_IA[rar]; throw e; });
  return COFFRES_IA[rar];
}
function coffreIA(rar) { /* -> { g, ch, lum, L, P, H, R, couleur, niv, anim }, comme construireCoffreRarete ; null si le modele n'est pas encore charge */
  const src = COFFRES_IA_PRETS[rar]; if (!src) return null;
  const C = PAL_COFFRES[rar] || PAL_COFFRES.rare, niv = { rare: 1, epique: 2, legendaire: 3 }[rar] || 1, R = 0.1, s = src.clone(true), g = new T.Group(), anims = [];
  s.traverse((m) => { if (!m.isMesh) return; const map = m.material.map;
    if (map) { map.encoding = T.LinearEncoding; map.needsUpdate = true; m.material = new T.MeshToonMaterial({ color: '#ffffff', map, gradientMap: grad, side: T.DoubleSide }); } /* (comme les monstres generes : l'image telle quelle, en lineaire) */
    else m.material = new T.MeshBasicMaterial({ color: m.material.color.clone().convertLinearToSRGB(), side: T.DoubleSide }); }); /* (le dedans, sombre) */
  const b0 = new T.Box3().setFromObject(s), t0 = b0.getSize(new T.Vector3()), k = R * (7.6 + niv * 0.3) / t0.x; /* (aussi large que les coffres construits) */
  s.scale.setScalar(k); s.position.set(-(b0.min.x + b0.max.x) / 2 * k, -b0.min.y * k, -(b0.min.z + b0.max.z) / 2 * k); g.add(s); g.updateMatrixWorld(true);
  const ch = s.getObjectByName('couvercle'); if (!ch) return null;
  const pivot = ch.getWorldPosition(new T.Vector3()), L = t0.x * k, P = t0.z * k, H = pivot.y, bc = new T.Box3().setFromObject(ch);
  const versCouvercle = (o, x, y, z) => { ch.add(o); o.position.copy(ch.worldToLocal(new T.Vector3(x, y, z))); o.scale.multiplyScalar(1 / k); return o; }; /* (pose un objet du jeu, en unites du jeu, sur le couvercle) */
  if (!TEX_HALO_COFFRE) TEX_HALO_COFFRE = texCanvas(64, (c2, n) => { const r = c2.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(0.35, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); c2.fillStyle = r; c2.fillRect(0, 0, n, n); });
  const halo = (t) => { const h = new T.Sprite(new T.SpriteMaterial({ map: TEX_HALO_COFFRE, color: C.lueur, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); h.scale.setScalar(t); h.renderOrder = 5; return h; };
  if (niv >= 3) { /* le grand cristal turquoise qui flotte dans son anneau d'or, au-dessus du couvercle */
    const haut = new T.Group(); haut.scale.setScalar(1.45); versCouvercle(haut, 0, bc.max.y + R * 1.25, (bc.min.z + bc.max.z) / 2);
    const cri = cofGemme(C.gemme, R * 0.55, false); cri.scale.y *= 1.25; haut.add(cri);
    const anneau = cofMaille(new T.TorusGeometry(R * 0.85, R * 0.07, 8, 40), C.or); anneau.rotation.x = Math.PI / 2 - 0.35; haut.add(anneau);
    const petites = [0, 1, 2].map(() => { const q = cofMaille(new T.IcosahedronGeometry(R * 0.09, 1), C.gemme, true); haut.add(q); return q; });
    const hl = halo(R * 3.6); haut.add(hl);
    anims.push((dt, t) => { cri.rotation.y += dt * 0.9; cri.position.y = R * 0.08 * Math.sin(t * 1.8); anneau.rotation.z += dt * 0.6; hl.material.opacity = 0.75 + 0.2 * Math.sin(t * 2.4);
      petites.forEach((q, i) => { const a = t * 1.4 + i / 3 * Math.PI * 2; q.position.set(Math.cos(a) * R * 0.85, Math.sin(a * 2) * R * 0.12, Math.sin(a) * R * 0.85); }); }); }
  const cr = ch.getObjectByName('cristal'); /* (le cristal au-dessus de la couronne de l'epique : il flotte et luit) */
  if (cr) { const y0 = cr.position.y, bb = new T.Box3().setFromObject(cr), c = bb.getCenter(new T.Vector3()), hl = halo(R * 2.4); g.add(hl); hl.position.copy(c);
    anims.push((dt, t) => { cr.position.y = y0 + R * 0.05 / k * Math.sin(t * 2); hl.material.opacity = 0.55 + 0.2 * Math.sin(t * 2.4); cr.updateMatrixWorld(true); new T.Box3().setFromObject(cr).getCenter(hl.position); }); }
  /* dedans : un tas de kamas et des gemmes de sa couleur, juste sous le rebord (on les voit a l'ouverture) */
  { const tas = new T.Group(); tas.position.y = H - R * 0.35; g.add(tas); let s0 = 11 + niv; const h = () => (s0 = (s0 * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 26; i++) { const a = i * 2.4, r = L * 0.34 * Math.sqrt((i + 0.5) / 26), y = (1 - (r / (L * 0.34)) ** 2) * R * 1.0 + h() * R * 0.1, q = cofPiece(); if (!q) break; q.position.set(Math.cos(a) * r, y, Math.sin(a) * r * (P / L) * 0.85); q.rotation.set((h() - 0.5) * 0.9, h() * 6, (h() - 0.5) * 0.9); tas.add(q); }
    [[-L * 0.22, R * 0.8, R * 0.2], [L * 0.18, R * 0.85, -R * 0.3], [L * 0.03, R * 1.1, R * 0.15], [-L * 0.08, R * 1.0, -R * 0.6]].slice(0, 1 + niv).forEach(([x, y, z], i) => { const q = cofGemme(C.gemme, R * 0.38, i % 2 === 1); q.position.set(x, y, z); q.rotation.set(0.3, i, 0.2); tas.add(q); }); }
  const lum = new T.PointLight(C.lueur, 0.12, R * 18); lum.position.set(0, H + R * 1.6, R * 0.6); g.add(lum); /* (faible : l'image du modele est deja peinte avec sa lumiere ; plus fort, l'ivoire et l'or se delavaient) */
  let tA = 0; const anim = (dt) => { tA += dt; anims.forEach((f) => f(dt, tA)); }; anim(0.01);
  return { g, ch, lum, L, P, H, R, couleur: C.lueur, niv, anim, ia: true };
}
/* le coffre d'une place du podium : le modele genere s'il est la, sinon le coffre construit */
const coffrePodium = (rang) => { const rar = RANG_COFFRE[rang]; return rar ? coffreIA(rar) || construireCoffreRarete(rar) : null; };
const titreCoffreIle = (rang) => ['Le coffre légendaire de l\'île', 'Le coffre épique de l\'île', 'Le coffre rare de l\'île'][rang] || 'Le coffre de l\'île des boss';
/* LES RESSOURCES AU CHOIX DU COFFRE DE L'ILE (21/11/2026, « pour les coffres, on va donner le droit aussi de recuperer des ressources dedans, ressources au
   choix : epique 30, legendaire 20, rare 10, et participant en dessous 5 au choix », Mathieu ; au formulaire : 1er 30, 2e 20, 3e 10, et le coffre remplace
   les 5 des participants) : elles s'ajoutent a etatIleBoss().aChoisir a l'ouverture du coffre et se choisissent dans sa fenetre (la meme liste que la
   compensation de Scorpal). Pas choisies : la fenetre revient a la ferme (coffreIleAuto). Les chiffres changent sur place, sans redessiner la fenetre
   (sinon le coffre 3D repartait du debut). */
const RESSOURCES_ILE = { podium: [30, 20, 10], participation: 5 }, choixResIle = {}, ESSAI_COFFRE_ILE = { n: null };
const listeResIle = () => (typeof COMPENSATION_ILE !== 'undefined' ? COMPENSATION_ILE.liste : []).filter((r) => PAR_ID[r]);
const nChoixIle = () => (ESSAI_COFFRE_ILE.n != null ? ESSAI_COFFRE_ILE.n : etatIleBoss().aChoisir || 0);
const totalChoixIle = () => listeResIle().reduce((t, r) => t + (choixResIle[r] || 0), 0);
function blocChoixIle() {
  const n = nChoixIle(); if (!(n > 0)) return '';
  return '<div class="choix-ile"><div class="hdv-section">Tes ' + n + ' ressources au choix : <span data-ci-reste></span></div>' +
    listeResIle().map((r) => '<div class="art"><img src="assets/icones/' + r + '.png?v=' + VERSION_MODELES + '" alt="" style="width:40px;height:40px"><div><b>' + PAR_ID[r].nom + '</b><div class="desc">Tu en as ' + fmt(S_.grange[r] || 0) + '</div></div>' +
      '<div class="act ci-act"><button class="btn mini discret" data-ci-moins="' + r + '">−</button><b data-ci-n="' + r + '">0</b><button class="btn mini discret" data-ci-plus="' + r + '">+</button><button class="btn mini discret" data-ci-reste-ici="' + r + '">Le reste</button></div></div>').join('') +
    '<div class="act-bas"><button class="btn kamas" data-ci-ok disabled>Prendre mes ressources</button></div></div>';
}
function majChoixIle() { /* les chiffres et les boutons, sur place */
  const n = nChoixIle(), tot = totalChoixIle(), reste = n - tot, q = (sel) => document.querySelectorAll('#carte ' + sel);
  q('[data-ci-reste]').forEach((e) => { e.textContent = reste ? 'encore ' + reste + ' à choisir' : 'c\'est bon !'; });
  q('[data-ci-n]').forEach((e) => { e.textContent = choixResIle[e.dataset.ciN] || 0; });
  q('[data-ci-moins]').forEach((e) => { e.disabled = !(choixResIle[e.dataset.ciMoins] > 0); });
  q('[data-ci-plus],[data-ci-reste-ici]').forEach((e) => { e.disabled = reste <= 0; });
  q('[data-ci-ok]').forEach((e) => { e.disabled = reste !== 0 || !n; });
}
function recevoirChoixIle() {
  const n = nChoixIle(), L = listeResIle().filter((r) => choixResIle[r] > 0), txt = L.map((r) => choixResIle[r] + ' ' + PAR_ID[r].nom).join(', ');
  if (!n || totalChoixIle() !== n) return;
  if (ESSAI_COFFRE_ILE.n != null) { toast('Essai : tu aurais reçu ' + txt + '. Rien n\'est donné.'); }
  else { L.forEach((r) => { S_.grange[r] = (S_.grange[r] || 0) + choixResIle[r]; }); etatIleBoss().aChoisir = 0; sauver(); rendreHaut(); son('kamas'); toast('Ressources de l\'île reçues : ' + txt + '.', 'or'); }
  L.forEach((r) => delete choixResIle[r]); ESSAI_COFFRE_ILE.n = null;
  if (modaleOuverte === 'ile-ressources') { fermerModale(); return; }
  document.querySelectorAll('#carte .choix-ile').forEach((e) => { e.innerHTML = '<div class="hdv-section">Tes ressources</div><p class="hdv-aide">✓ Reçues : ' + txt + '.</p>'; });
}
function ouvrirChoixIle() { ESSAI_COFFRE_ILE.n = null; if (!((etatIleBoss().aChoisir || 0) > 0)) return;
  ouvrirModale('ile-ressources', entete('Tes ressources de l\'île') + '<p class="hdv-aide">Ton coffre de l\'île t\'en réserve encore : choisis-les.</p>' + blocChoixIle()); majChoixIle(); }
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ci-plus],[data-ci-moins],[data-ci-reste-ici],[data-ci-ok],[data-essai-coffre-ile]'); if (!b) return;
  if (b.dataset.essaiCoffreIle != null) { essaiCoffreIle(+b.dataset.essaiCoffreIle); return; }
  const n = nChoixIle(), reste = n - totalChoixIle();
  if (b.dataset.ciPlus) { if (reste > 0) choixResIle[b.dataset.ciPlus] = (choixResIle[b.dataset.ciPlus] || 0) + 1; }
  else if (b.dataset.ciMoins) choixResIle[b.dataset.ciMoins] = Math.max(0, (choixResIle[b.dataset.ciMoins] || 0) - 1);
  else if (b.dataset.ciResteIci) { if (reste > 0) choixResIle[b.dataset.ciResteIci] = (choixResIle[b.dataset.ciResteIci] || 0) + reste; }
  else if (b.hasAttribute('data-ci-ok')) { recevoirChoixIle(); return; }
  majChoixIle();
});
/* l'essai du mode test (27b-arene-dev.js) : le coffre d'une place, ou celui d'un participant, et ses ressources au choix ; rien n'est donne */
async function essaiCoffreIle(rang) {
  const rar = RANG_COFFRE[rang]; if (rar) { try { await Promise.race([chargerCoffreIA(rar), new Promise((ok) => setTimeout(ok, 4000))]); } catch (e) { /* (le coffre construit) */ } }
  Object.keys(choixResIle).forEach((r) => delete choixResIle[r]); ESSAI_COFFRE_ILE.n = rang < 3 ? RESSOURCES_ILE.podium[rang] : RESSOURCES_ILE.participation;
  const om = typeof ouvertureMobile === 'function' && !!(OM.r || !OM.el); /* (l'ecran d'ouverture par-dessus : la fenetre, dessous, sans son petit coffre et deja ouverte) */
  ouvrirModale('ileboss', entete(titreCoffreIle(rang) + ' (essai)') + '<p class="hdv-aide">Essai du mode test : rien n\'est donné.</p><div class="ouverture-coffre' + (om ? ' fini' : '') + '">' + (om ? '' : sceneCoffre()) +
    '<div class="gains-coffre"><div class="gain-coffre bloc' + (om ? ' vu' : '') + '">' + blocChoixIle() + '</div></div><div class="boutons"><button class="btn kamas" data-fermer>Fermer</button></div></div>');
  majChoixIle(); const base = rar ? coffrePodium(rang) : null;
  if (typeof ouvertureMobile === 'function') { const S = rang < 3 ? [209000, 109000, 59000][rang] : 9000; /* (la part s'il tient, 9 000, plus le podium : 200 000, 100 000, 50 000) */
    if (ouvertureMobile({ rar: rar || 'normal', base, sousTitre: 'Essai du mode test', cartes: cartesCoffreIle({ k: S, f: rang < 3 ? [1, 4, 3][rang] : 1, p: rang === 0 ? 1 : 0, xp: 2400, objets: rang === 0 ? [{ ico: 'obj-ecorce-coiffe', t: 'Coiffe d\'Écorce, jet 82 %', son: 'quete' }] : [], res: ESSAI_COFFRE_ILE.n, jetons: rang === 0 ? 1 : 0 }) })) return; }
  if (om) document.querySelectorAll('#carte .ouverture-coffre').forEach((z) => z.insertAdjacentHTML('afterbegin', sceneCoffre())); /* (sans WebGL : le petit coffre, comme avant) */
  jouerCoffre('ileboss', base);
}
/* les cartes de l'ouverture facon jeux mobiles (29m-ouverture-coffre.js) : kamas, XP, runes, runes parfaites, pieces, ressources au choix */
function cartesCoffreIle(c) {
  const L = [];
  if (c.k) L.push({ ico: 'kama', n: c.k, t: 'kamas', son: 'kamas' });
  if (c.xp) L.push({ svg: picto('etoile', '#e0a31e'), n: c.xp, t: 'XP', son: 'quete' });
  if (c.f) L.push({ ico: 'rune-forge', n: c.f, t: 'rune' + (c.f > 1 ? 's' : '') + ' de forgemagie', son: 'quete' });
  if (c.p) L.push({ ico: 'rune-parfaite', n: c.p, t: 'rune' + (c.p > 1 ? 's' : '') + ' parfaite' + (c.p > 1 ? 's' : ''), brille: true });
  (c.objets || []).forEach((o) => L.push(o));
  if (c.res) L.push({ ico: 'ressources-choix', n: c.res, t: 'ressources au choix', plus: false, son: 'quete' });
  if (c.jetons) L.push({ ico: 'jeton-legendaire', n: c.jetons, t: 'jeton légendaire, à jouer à la roue du Casino', brille: true });
  return L;
}
