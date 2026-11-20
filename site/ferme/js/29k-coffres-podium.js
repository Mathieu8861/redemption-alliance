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
    pose(k, s * (L / 2 - R * 0.1), y0 + H + R * 0.32, t * (P / 2 - R * 0.1)); }));
  /* les pieds a griffes (legendaire) */
  if (niv >= 3) [-1, 1].forEach((s) => [-1, 1].forEach((t) => { const p = new T.Group(); p.add(clou(R * 0.3, C.or)); for (let i = -1; i <= 1; i++) { const gr = M(new T.ConeGeometry(R * 0.08, R * 0.28, 6), C.orF); gr.position.set(i * R * 0.15, -R * 0.18, R * 0.24); gr.rotation.x = Math.PI / 2 + 0.5; p.add(gr); }
    pose(p, s * (L / 2 - R * 0.05), R * 0.3, t * (P / 2 - R * 0.05), 0, t > 0 ? 0 : Math.PI, 0); }));
  /* ---------------- le couvercle, sur sa charniere a l'arriere ---------------- */
  const ch = new T.Group(); ch.position.set(0, y0 + H, -P / 2); g.add(ch);
  const dome = M(new T.CylinderGeometry(P / 2, P / 2, L * 0.98, 32, 1, false, 0, Math.PI), C.couv); dome.rotation.z = Math.PI / 2; dome.position.set(0, 0, P / 2); ch.add(dome);
  pose(BR(L * 1.02, R * 0.2, P * 1.02, C.or, R * 0.05), 0, -R * 0.02, P / 2, 0, 0, 0, ch); /* (la levre du couvercle) */
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
    cr.add(M(new T.CylinderGeometry(R * 0.55, R * 0.7, R * 0.22, 18), C.or));
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, pt = M(new T.ConeGeometry(R * 0.11, R * (i % 2 ? 0.32 : 0.48), 5), C.or); pt.position.set(Math.cos(a) * R * 0.56, R * 0.24, Math.sin(a) * R * 0.56); cr.add(pt); if (!(i % 2)) { const b = clou(R * 0.07, C.gemme); b.position.set(Math.cos(a) * R * 0.56, R * 0.5, Math.sin(a) * R * 0.56); cr.add(b); } }
    const cx = cofGemme(C.gemme, R * 0.34, false); cx.position.y = R * 0.5; cr.add(cx);
    anims.push((dt, t) => { cr.rotation.y += dt * (Math.PI * 2 / 40); cx.position.y = R * (0.5 + 0.04 * Math.sin(t * 2)); }); }
  if (niv >= 3) { /* le grand cristal turquoise qui flotte dans son anneau d'or, et le halo */
    const haut = new T.Group(); haut.position.set(0, P / 2 + R * 0.95, P / 2); ch.add(haut);
    const support = M(new T.CylinderGeometry(R * 0.32, R * 0.55, R * 0.25, 16), C.or); support.position.y = -R * 0.78; haut.add(support);
    const cri = cofGemme(C.gemme, R * 0.55, false); cri.scale.y *= 1.25; haut.add(cri);
    const anneau = M(new T.TorusGeometry(R * 0.85, R * 0.07, 8, 40), C.or); anneau.rotation.x = Math.PI / 2 - 0.35; haut.add(anneau);
    const petites = [0, 1, 2].map((i) => { const p = clou(R * 0.09, C.gemme); haut.add(p); return p; });
    if (!TEX_HALO_COFFRE) TEX_HALO_COFFRE = texCanvas(64, (c2, n) => { const r = c2.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(0.35, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); c2.fillStyle = r; c2.fillRect(0, 0, n, n); });
    const halo = new T.Sprite(new T.SpriteMaterial({ map: TEX_HALO_COFFRE, color: C.lueur, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); halo.scale.setScalar(R * 3.2); halo.renderOrder = 5; haut.add(halo);
    anims.push((dt, t) => { cri.rotation.y += dt * 0.9; cri.position.y = R * 0.08 * Math.sin(t * 1.8); anneau.rotation.z += dt * 0.6; halo.material.opacity = 0.75 + 0.2 * Math.sin(t * 2.4);
      petites.forEach((p, i) => { const a = t * 1.4 + i / 3 * Math.PI * 2; p.position.set(Math.cos(a) * R * 0.85, Math.sin(a * 2) * R * 0.12, Math.sin(a) * R * 0.85); }); }); }
  const lum = new T.PointLight(C.lueur, niv >= 2 ? 0.7 : 0, R * 18); lum.position.set(0, y0 + H + R * 1.6, R * 0.6); g.add(lum);
  let tA = 0; const anim = (dt) => { tA += dt; anims.forEach((f) => f(dt, tA)); }; anim(0.01);
  return { g, ch, lum, L, P, H: y0 + H, R, couleur: C.lueur, niv, anim };
}
