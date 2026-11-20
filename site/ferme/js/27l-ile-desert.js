'use strict';
/* L'ILE DES BOSS EN DESERT, LA SEMAINE DE SCORPAL (20/11/2026, « j'aimerais creer une nouvelle map, similaire en taille a celle actuelle, une map de sable a
   l'image d'un scorpion, un decor de desert ; les elements de decor qui peuvent bloquer / ou se cacher a de nouveaux endroits ; des tornades qui apparaissent de
   maniere aleatoire a certains endroits (lies a la map) ; le portail au meme endroit, les torches de feu pareil ; tu peux repartir de celle existante et
   l'adapter en mode desert », Mathieu).
   - Le modele : blender/boss-ile-desert.py (copie de boss-ile.py : meme sol, arche-crane et portail, bols de feu et tableau a leur place ; sable, gres et ambre ;
     piliers de gres, buttes en strates, cactus, dunes, os blanchis a de nouveaux endroits ; deux buttes plus pres du cercle pour s'abriter ; six reperes de tornades).
   - Ici : l'habillage (le cercle magique en ambre, le sceau du scorpion au milieu, la brume de sable, des poussieres dorees au lieu des ames violettes, les petites
     flammes des cranes en orange) et les tornades de sable du combat.
   Les tornades : toutes les 8 a 12 s (2 en meme temps au plus), l'un des six endroits de la carte, tire au hasard ; un cercle de sable au sol (1,2 s), puis la
   tornade se leve et tourne autour de son endroit 7 s. Dedans : 3 % de ta vie toutes les 0,6 s et tu es repousse de 1,5 case. Chiffres a valider avec Mathieu. */
FICHIERS_ILE.desert = 'boss-ile-desert.glb';
let DESERT_POUR_TOUS = false; /* (le nouveau visuel attend l'accord de Mathieu : en attendant, le desert n'est que dans son mode test) */
Object.defineProperty(MONSTRES.scorpal, 'carteIle', { get: () => (DESERT_POUR_TOUS || MODE_TEST ? 'desert' : null), configurable: true });
const TORNADES = { periode: [8, 12], max: 2, annonce: 1.2, vie: 7, R: 1.35, ronde: 1.8, vitesse: 0.55, pct: 0.03, tic: 0.6, repousse: 3.0 };
HABILLER_ILE.desert = function (g, reperes) {
  const fx = g.userData.fx, ambre = new T.Color('#ffb347');
  fx.cercles.forEach(({ m, k }) => { m.material.color.copy(k === 2 ? new T.Color('#c9822e') : ambre); });
  fx.flammes.forEach((o) => { o.a.material.color.set('#ff9a3c'); o.b.material.color.set('#ffd27a'); }); /* (les petites flammes des cranes : orange) */
  if (fx.sceau) g.remove(fx.sceau); fx.sceau = sceauScorpion(); g.add(fx.sceau);
  const V = g.userData.vivant || {};
  if (V.brume && V.brume.material.uniforms && V.brume.material.uniforms.uC) V.brume.material.uniforms.uC.value.set('#e8cf9a'); /* (une brume de sable) */
  (V.ames || []).forEach((o) => { o.m.material.map = lueurDe('orange'); o.m.material.color.set('#ffe2a8'); o.m.material.needsUpdate = true; o.e *= 0.6; }); /* (des poussieres dorees au lieu des ames violettes) */
  g.userData.tornades = reperes.filter((x) => /^repere_tornade/.test(x.nom)).map((x) => ({ x: x.p.x, z: x.p.z })); /* (dans le repere de l'ile) */
};
/* le sceau du milieu : un scorpion d'ambre sur un disque de sable sombre */
function sceauScorpion() {
  const g = new T.Group(), c = new T.Group(); g.add(c); c.rotation.x = -Math.PI / 2; g.position.y = 0.035; g.userData.v = 'scorpion';
  const plat = (geo, col, op, add, z) => { const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide, blending: add ? T.AdditiveBlending : T.NormalBlending })); m.position.z = z || 0; m.renderOrder = 3 + Math.round((z || 0) * 1000); m.raycast = () => {}; c.add(m); return m; };
  const barre = (x1, y1, x2, y2, e, col, op, z) => { const L = Math.hypot(x2 - x1, y2 - y1), m = plat(new T.PlaneGeometry(L, e), col, op, false, z || 0.004); m.position.x = (x1 + x2) / 2; m.position.y = (y1 + y2) / 2; m.rotation.z = Math.atan2(y2 - y1, x2 - x1); return m; };
  const ell = (x, y, rx, ry, col, z, a) => { const m = plat(new T.CircleGeometry(1, 28), col, 1, false, z); m.position.x = x; m.position.y = y; m.scale.set(rx, ry, 1); m.rotation.z = a || 0; return m; };
  plat(new T.CircleGeometry(1.15, 48), '#2b1d0e', 0.92, false, 0); g.userData.halo = plat(new T.RingGeometry(1.12, 1.22, 48), '#ffb347', 0.35, true, 0.002);
  const A = '#ffc964', F = '#d98a2a';
  /* les pattes : quatre de chaque cote, coudees */
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const y0 = 0.16 - k * 0.12, x0 = s * 0.13, x1 = s * (0.36 + 0.03 * k), y1 = y0 + 0.08 - 0.02 * k, x2 = s * (0.5 + 0.02 * k), y2 = y0 - 0.1 - 0.03 * k; barre(x0, y0, x1, y1, 0.045, F, 1, 0.004); barre(x1, y1, x2, y2, 0.04, F, 1, 0.004); }
  /* les pinces : le bras, puis deux mors en croissant */
  for (const s of [-1, 1]) { barre(s * 0.12, 0.3, s * 0.3, 0.5, 0.07, A, 1, 0.005); barre(s * 0.3, 0.5, s * 0.36, 0.62, 0.065, A, 1, 0.005);
    const mors = (a0, a1) => { const sh = new T.Shape(); sh.absarc(0, 0, 0.13, a0, a1, false); sh.absarc(0, 0, 0.07, a1, a0, true); const m = plat(new T.ShapeGeometry(sh, 16), A, 1, false, 0.006); m.position.x = s * 0.38; m.position.y = 0.72; m.scale.x = s; return m; };
    mors(-0.4, 1.9); mors(2.3, 3.6); }
  /* le corps : la tete, puis le ventre en anneaux */
  ell(0, 0.24, 0.16, 0.13, A, 0.007); for (let k = 0; k < 4; k++) { const y = 0.08 - k * 0.135, rx = 0.17 - k * 0.012; ell(0, y, rx, 0.075, A, 0.007); barre(-rx * 0.9, y - 0.07, rx * 0.9, y - 0.07, 0.022, F, 1, 0.008); }
  for (const s of [-1, 1]) ell(s * 0.06, 0.29, 0.025, 0.025, '#2b1d0e', 0.009); /* (ses yeux) */
  /* la queue : des anneaux qui descendent puis remontent en crosse, le dard pointe vers le dos */
  const Q = [[0, -0.48], [0.06, -0.62], [0.18, -0.72], [0.32, -0.71], [0.43, -0.6], [0.46, -0.44]]; Q.forEach(([x, y], k) => ell(x, y, 0.075 - k * 0.006, 0.07 - k * 0.006, A, 0.007));
  { const sh = new T.Shape(); sh.moveTo(0.46, -0.36); sh.lineTo(0.5, -0.4); sh.quadraticCurveTo(0.44, -0.2, 0.32, -0.2); sh.quadraticCurveTo(0.42, -0.26, 0.41, -0.38); sh.lineTo(0.46, -0.36); plat(new T.ShapeGeometry(sh, 12), F, 1, false, 0.008); }
  return g;
}
/* ---------------- les tornades de sable ---------------- */
const TORNADE_FS = `varying vec2 vUv; uniform float uT; uniform float uA;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
  void main(){
    float bandes = sin((vUv.x * 6.2832 * 3.0) - vUv.y * 9.0 + uT * 7.0) * 0.5 + 0.5;
    float b = n(vec2(vUv.x * 12.0 + uT * 2.5, vUv.y * 6.0 - uT * 1.5));
    float k = smoothstep(0.28, 0.72, bandes * 0.62 + b * 0.38); /* (des bandes nettes qui tournent : une tache floue avant) */
    float bords = smoothstep(0.0, 0.1, vUv.y) * (1.0 - smoothstep(0.84, 1.0, vUv.y));
    vec3 c = mix(vec3(0.5, 0.35, 0.19), vec3(0.98, 0.88, 0.66), k);
    gl_FragColor = vec4(c, (0.38 + 0.52 * k) * bords * uA);
  }`;
const TORNADE_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
function corpsTornade() {
  const g = new T.Group(), L = [], H = 5.2;
  [[0.3, 1.6, 0], [0.5, 2.2, 0.35], [0.8, 2.8, 0.7]].forEach(([r0, r1, k], i) => { /* trois entonnoirs emboites, du plus etroit au plus large, qui tournent chacun a sa vitesse */
    const geo = new T.CylinderGeometry(r1, r0, H, 28, 8, true); geo.translate(0, H / 2, 0);
    const m = new T.Mesh(geo, new T.ShaderMaterial({ uniforms: { uT: { value: Math.random() * 10 }, uA: { value: 0 } }, vertexShader: TORNADE_VS, fragmentShader: TORNADE_FS, transparent: true, depthWrite: false, side: T.DoubleSide }));
    m.renderOrder = 6; m.raycast = () => {}; m.userData.v = 2.2 - i * 0.5; g.add(m); L.push(m); });
  const debris = []; for (let k = 0; k < 7; k++) { const d = new T.Mesh(new T.DodecahedronGeometry(0.08 + Math.random() * 0.08, 0), mat(Math.random() < 0.5 ? '#c99a62' : '#a8743f')); d.userData = { a: Math.random() * 6.28, y: 0.3 + Math.random() * 3.5, r: 0.6 + Math.random() * 1.2, v: 2 + Math.random() * 2 }; g.add(d); debris.push(d); }
  return { g, L, debris };
}
function capTornadesDesert(mo, ctx) {
  const c = combat; if (!c || c.fin || c.genre !== 'ile' || !mo.d.boss || mo.etat !== 'actif' || !ileBoss || ileBoss.userData.carte !== 'desert') return;
  const spots = ileBoss.userData.tornades || []; if (!spots.length) return; const T0 = TORNADES;
  if (c.tornadeT == null) { c.tornadeT = 0; c.tornadeProchaine = 5 + Math.random() * 3; c.tornades = 0; }
  c.tornadeT += ctx.dt; if (c.tornadeT < c.tornadeProchaine || c.tornades >= T0.max) return;
  c.tornadeT = 0; c.tornadeProchaine = T0.periode[0] + Math.random() * (T0.periode[1] - T0.periode[0]);
  const libres = spots.filter((s) => !(c.tornadesPos || []).some((q) => q === s)); if (!libres.length) return;
  const s = hasard(libres); (c.tornadesPos = c.tornadesPos || []).push(s); c.tornades++;
  lancerTornade(s, c, mo);
}
function lancerTornade(s, c0, mo) {
  const T0 = TORNADES, [cx, cz] = versMondeIle(s.x, s.z);
  if (!c0.tornadeVu) { c0.tornadeVu = true; toast('Une tornade de sable se lève : sors du cercle et ne reste pas dans son chemin !', 'alerte'); }
  zoneDanger({ x: cx, z: cz, r: T0.R + 0.4, duree: T0.annonce, couleur: '#e0a84a', effet: () => {} });
  const { g, L, debris } = corpsTornade(); g.position.set(cx, solA(cx, cz), cz); g.scale.setScalar(0.2); scene.add(g);
  const ph = Math.random() * 6.28, sens = Math.random() < 0.5 ? -1 : 1; let t = -T0.annonce, tic = 0, pf = 0; const pos = { x: cx, z: cz };
  const fin = () => { jeter(g); c0.tornades = Math.max(0, (c0.tornades || 1) - 1); c0.tornadesPos = (c0.tornadesPos || []).filter((q) => q !== s); return true; };
  effets.push((dt) => {
    if (combat !== c0 || c0.fin) return fin(); t += dt;
    if (t < 0) { if (Math.random() < dt * 14) emettre(FX_FUM, 1, { x: cx + (Math.random() - 0.5) * 2, y: solA(cx, cz) + 0.1, z: cz + (Math.random() - 0.5) * 2, r: 0.3, v: [0, 0.6, 0], vie: [0.5, 0.9], taille: [0.4, 0.9], c: ['#e8cf9a', '#c99a62'], a: 0.5, frein: 1, vrot: 2 }); return false; }
    if (t > T0.vie) return fin();
    const montee = Math.min(1, t / 0.6), descente = Math.min(1, (T0.vie - t) / 0.6), e = Math.min(montee, descente);
    /* elle tourne autour de son endroit, sans sortir de l'ile */
    const a = ph + sens * t * T0.vitesse, [lx, lz] = versLocalIle(cx, cz), q = bornerIle(...versMondeIle(lx + Math.cos(a) * T0.ronde * Math.min(1, t), lz + Math.sin(a) * T0.ronde * Math.min(1, t)), 0.6);
    pos.x = q[0]; pos.z = q[1]; g.position.set(pos.x, solA(pos.x, pos.z), pos.z); g.scale.set(0.4 + 0.6 * e, 0.3 + 0.7 * e, 0.4 + 0.6 * e);
    L.forEach((m) => { m.rotation.y += dt * m.userData.v * 3; m.material.uniforms.uT.value += dt; m.material.uniforms.uA.value = e; });
    debris.forEach((d) => { const u = d.userData; u.a += dt * u.v; d.position.set(Math.cos(u.a) * u.r * (0.5 + u.y / 5), u.y, Math.sin(u.a) * u.r * (0.5 + u.y / 5)); d.rotation.x += dt * 4; });
    if ((pf += dt) > 0.08) { pf = 0; emettre(FX_FUM, 1, { x: pos.x + (Math.random() - 0.5) * 2.4, y: solA(pos.x, pos.z) + 0.15, z: pos.z + (Math.random() - 0.5) * 2.4, r: 0.4, v: [0, 0.8, 0], vie: [0.5, 0.9], taille: [0.6, 1.3], c: ['#e8cf9a', '#c99a62'], a: 0.45, frein: 1, vrot: 3 }); }
    /* dedans : des degats et tu es repousse */
    const p = paysanMesh.position; tic -= dt;
    if (e > 0.6 && tic <= 0 && Math.hypot(p.x - pos.x, p.z - pos.z) < T0.R && !paysanMesh.userData.enVol) {
      tic = T0.tic; const n = Math.max(1, Math.round(c0.pvMax * T0.pct)); blesserPerso(n, null); repousserPerso({ x: pos.x, z: pos.z }, T0.repousse); }
    return false;
  });
}
CAPACITES.unshift(capTornadesDesert); /* (capTornades existe deja : les tornades d'Ebil, 21-combat.js) */
