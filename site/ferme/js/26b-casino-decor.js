'use strict';
/* LE CASINO QUI VIT (07/11/2026 au soir, « le vent, l'eau qui bouge et coule, la fontaine au milieu luxuriante, les plantes detaillees », Mathieu).
   Le decor vient de blender/casino.py --jeu2 : chaque plante y est posee sur un pivot (son pied), le vent (vent.js) la berce a son propre rythme.
   Ici : la souplesse de chaque piece au vent (SOUPLE_CASINO), les pieces trop fines pour un contour (SC_CASINO), l'eau animee des bassins et du canal,
   les nappes qui debordent des vasques, les jets des quatre chats, l'ecume, les rides et les gouttes, les poissons de la fontaine, le jet du bassin,
   la cascade au bout du canal et les drapeaux qui flottent. Rien ici ne depend du jeu : on passe THREE (et le decor deja passe en toon).
   Partage par le jeu (js/28-voyage.js) et par la page d'apercu design-casino-ile2.html. Tout boucle sur 60 s (uT), sans saut. */
const SOUPLE_CASINO = { tige: 1, feuille: 1, petale: 1, coeur: 1, fleur_buisson: 0.15, coeur_buisson: 0.15, feuillage: 0.15, liane: 0.35,
  palme: 0.22, palme_tige: 0.22, palme_stipe: 0.22, palme_coco: 0.22, papyrus: 0.6, cypres: 0.06 };
const SC_CASINO = new Set(['palme', 'palme_tige', 'tige', 'feuille', 'petale', 'coeur', 'fleur_buisson', 'coeur_buisson', 'liane', 'lierre', 'rosier', 'haie_fleur', 'papyrus',
  'nenuphar', 'lotus', 'eau', 'eau_canal', 'drapeau', 'incrustation', 'tapis_or', 'damier', 'kama_tas', 'fond', 'terreau', 'montant', 'balustre', 'tenture']);
/* les cotes de blender/casino.py (fontaine_luxe, bassin_luxe, canal) */
const FONTAINE_CASINO = { x: 0, z: 0, y: 0.56, r: 3.45, yV: 1.9, rV: 1.47, bordV: 1.625, hautV: 1.97, yH: 2.87, rH: 0.73, bordH: 0.865, hautH: 2.92,
  chats: [0, 1, 2, 3].map((k) => Math.PI / 4 + k * Math.PI / 2), rBouche: 2.47, yBouche: 1.6 };
const BASSIN_CASINO = { x: 17, z: 0, y: 0.32, jet: 0.6 };
const CANAL_CASINO = { x0: 20.35, x1: 27.05, z: 0, y: 0.28, w: 1.0, chute: 10.5 };
const W60 = '0.1047198'; /* 2 pi / 60 : chaque vitesse en est un multiple entier, l'animation boucle sur 60 s */

function hasardCasino(g) { let x = g || 1; return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; } /* (le meme tirage a chaque fois : l'apercu filme se refait a l'identique) */
function texFiletsCasino(T, h) {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128; const x = cv.getContext('2d');
  for (let i = 0; i < 30; i++) { const px = h() * 128, w = 2 + h() * 5, hh = 30 + h() * 70, y0 = h() * 128, a = 0.35 + h() * 0.5;
    const g = x.createLinearGradient(0, y0, 0, y0 + hh); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.35, 'rgba(235,248,255,' + a.toFixed(2) + ')'); g.addColorStop(1, 'rgba(200,236,255,0)');
    x.fillStyle = g; x.fillRect(px, y0, w, hh); x.fillRect(px, y0 - 128, w, hh); }
  const t = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
}
function texBrumeCasino(T) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(0.5, 'rgba(240,250,255,0.35)'); g.addColorStop(1, 'rgba(240,250,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new T.CanvasTexture(cv);
}
/* l'eau : deux trames de vaguelettes qui glissent l'une sur l'autre, des reflets qui scintillent, des rides autour de chaque chute (uC : x, z, rayon de depart,
   force), et sur le canal des stries qui filent vers l'est */
function matEauCasino(T, uT, centres, flot, off) {
  const C = []; for (let i = 0; i < 6; i++) { const c = centres[i]; C.push(c ? new T.Vector4(c[0], c[1], c[2], c[3]) : new T.Vector4(0, 0, 0, 0)); }
  return new T.ShaderMaterial({ transparent: true, depthWrite: false,
    uniforms: { uT, uOff: { value: new T.Vector2(off ? off.x : 0, off ? off.z : 0) }, uC: { value: C }, uFlot: { value: flot ? 1 : 0 }, uFonce: { value: new T.Color('#2e8fcb') }, uClair: { value: new T.Color('#a6e4ff') } },
    vertexShader: 'varying vec3 vWp; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWp = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: ['uniform float uT; uniform vec2 uOff; uniform vec4 uC[6]; uniform float uFlot; uniform vec3 uFonce; uniform vec3 uClair; varying vec3 vWp;',
      'const float W = ' + W60 + ';',
      'void main() {',
      '  vec2 p = vWp.xz - uOff; float t = uT;', /* (uOff : la place de l'ile dans le monde ; les centres sont donnes sur l'ile) */
      '  float a = sin(p.x * 2.1 + t * W * 10.0 + sin(p.y * 1.6 + t * W * 5.0) * 1.3) * sin(p.y * 2.6 - t * W * 8.0 + sin(p.x * 1.2) * 1.1);',
      '  float b = sin((p.x + p.y) * 3.9 - t * W * 16.0) * sin((p.x - p.y) * 3.3 + t * W * 13.0);',
      '  float lum = smoothstep(0.35, 0.95, a * 0.6 + b * 0.5);',
      '  float rides = 0.0;',
      '  for (int i = 0; i < 6; i++) { vec4 c = uC[i]; if (c.w <= 0.0) continue; float d = length(p - c.xy) - c.z;',
      '    if (d < -0.02 || d > 1.7) continue; rides += smoothstep(0.72, 1.0, sin(d * 10.0 - t * W * 50.0)) * (1.0 - d / 1.7) * c.w; }',
      '  float st = uFlot * (smoothstep(0.55, 1.0, sin(p.x * 2.6 - t * W * 70.0 + sin(p.y * 8.0 + p.x * 1.7) * 0.9)) + 0.7 * smoothstep(0.7, 1.0, sin(p.x * 4.3 - t * W * 90.0 + p.y * 5.0)));',
      '  vec3 col = mix(uFonce, uClair, clamp(lum * 0.45 + rides * 0.55 + st * 0.45, 0.0, 1.0));',
      '  col = mix(col, vec3(1.0), smoothstep(0.86, 1.0, a * b + 0.1) * 0.7);',
      '  gl_FragColor = vec4(col, clamp(0.76 + rides * 0.12 + st * 0.08, 0.0, 0.92));',
      '}'].join('\n') });
}
/* un drapeau qui flotte : chaque point s'ecarte de son plan selon sa distance au mat (le pivot du drapeau est en haut du mat) */
function flotterCasino(m, uT) {
  m.onBeforeCompile = (sh) => { sh.uniforms.uT = uT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', ['#include <begin_vertex>',
    'float dd = length(position.xz); vec2 dir = dd > 0.001 ? vec2(-position.z, position.x) / dd : vec2(0.0);',
    'float ond = sin(uT * ' + W60 + ' * 80.0 - dd * 4.5 + position.y * 1.2) * 0.09 * dd + sin(uT * ' + W60 + ' * 30.0 - dd * 2.0) * 0.05 * dd;',
    'transformed.xz += dir * ond; transformed.y += sin(uT * ' + W60 + ' * 80.0 - dd * 4.5) * 0.02 * dd;'].join('\n')); };
  m.customProgramCacheKey = () => 'drapeau-casino';
}

/* decor : le decor du Casino (deja en toon), avec ses surfaces 'eau', 'eau_canal' et ses 'drapeau'. Renvoie { animer(dt, s), uT } */
function casinoVivant(T, decor) {
  const uT = { value: 0 }, h = hasardCasino(7), F = FONTAINE_CASINO, Bq = BASSIN_CASINO, C = CANAL_CASINO, g = new T.Group(); g.name = 'casino_vivant';
  const fx = (c, o) => new T.MeshBasicMaterial(Object.assign({ color: c, transparent: true, depthWrite: false }, o));
  const bouche = (a) => new T.Vector3(F.x + Math.cos(a) * F.rBouche, F.yBouche, F.z + Math.sin(a) * F.rBouche), chute = (a) => new T.Vector3(F.x + Math.cos(a) * 3.2, F.y, F.z + Math.sin(a) * 3.2);
  /* 1. l'eau des bassins, des vasques et du canal (chaque surface reconnue a sa hauteur) */
  const eaux = []; decor.updateMatrixWorld(true); const off = new T.Vector3().setFromMatrixPosition(decor.matrixWorld);
  decor.traverse((m) => { if (!m.isMesh) return; const nom = m.name.replace(/\.?\d+$/, '').replace(/_\d+$/, ''); if (nom !== 'eau' && nom !== 'eau_canal') return; eaux.push([m, nom]); });
  eaux.forEach(([m, nom]) => {
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld), y = b.max.y - off.y;
    let ce = [];
    if (nom === 'eau_canal') ce = [];
    else if (Math.abs(y - BASSIN_CASINO.y) < 0.05) ce = [[Bq.x, Bq.z, 0.22, 1]];
    else if (y > 2.5) ce = [[F.x, F.z, 0.25, 0.8]];
    else if (y > 1.5) ce = [[F.x, F.z, F.bordH + 0.08, 1]];
    else ce = [[F.x, F.z, F.bordV + 0.12, 1]].concat(F.chats.map((a) => { const q = chute(a); return [q.x, q.z, 0.05, 0.6]; }));
    m.material = matEauCasino(T, uT, ce, nom === 'eau_canal', off); m.renderOrder = 2; m.castShadow = false; m.receiveShadow = false;
  });
  decor.traverse((m) => { if (m.isMesh && m.name.replace(/\.?\d+$/, '').replace(/_\d+$/, '') === 'drapeau' && m.material) flotterCasino(m.material, uT); });
  /* 2. les nappes qui debordent des vasques : un voile clair et ses filets qui descendent */
  const filets = texFiletsCasino(T, h); filets.repeat.set(6, 1);
  const nappe = (r1, r2, y1, y2) => {
    const geo = new T.CylinderGeometry(r1, r2, y1 - y2, 56, 1, true);
    const v = new T.Mesh(geo, fx('#8fd3f7', { opacity: 0.32, side: T.DoubleSide })); v.position.set(F.x, (y1 + y2) / 2, F.z); v.renderOrder = 3; g.add(v);
    const f = new T.Mesh(geo, fx('#eaf8ff', { map: filets, opacity: 0.95, side: T.DoubleSide })); f.position.copy(v.position); f.renderOrder = 4; g.add(f);
  };
  nappe(F.bordH, F.bordH + 0.1, F.hautH - 0.005, F.yV + 0.005); nappe(F.bordV, F.bordV + 0.16, F.hautV - 0.005, F.y + 0.005);
  /* 3. les jets des quatre chats : une courbe d'eau, ses filets qui filent de la bouche au bassin */
  const filetsJ = texFiletsCasino(T, h); filetsJ.rotation = Math.PI / 2; filetsJ.repeat.set(2, 3);
  F.chats.forEach((a) => {
    const p0 = bouche(a), p2 = chute(a), p1 = new T.Vector3(F.x + Math.cos(a) * 2.95, F.yBouche + 0.28, F.z + Math.sin(a) * 2.95);
    const courbe = new T.QuadraticBezierCurve3(p0, p1, p2), geo = new T.TubeGeometry(courbe, 28, 0.055, 8, false);
    const t1 = new T.Mesh(geo, fx('#bfe8ff', { opacity: 0.75 })); t1.renderOrder = 3; g.add(t1);
    const t2 = new T.Mesh(new T.TubeGeometry(courbe, 28, 0.058, 8, false), fx('#ffffff', { map: filetsJ, opacity: 1 })); t2.renderOrder = 4; g.add(t2);
  });
  /* 4. l'ecume au pied des chutes, qui palpite */
  const ecumes = [];
  const ecume = (x, y, z, r1, r2, ph) => { const e = new T.Mesh(new T.RingGeometry(r1, r2, 48), fx('#f4fcff', { opacity: 0.6 })); e.rotation.x = -Math.PI / 2; e.position.set(x, y + 0.008, z); e.renderOrder = 5; g.add(e); ecumes.push({ m: e, ph }); };
  ecume(F.x, F.y, F.z, F.bordV + 0.08, F.bordV + 0.3, 0); ecume(F.x, F.yV, F.z, F.bordH + 0.06, F.bordH + 0.2, 1.7); ecume(F.x, F.yH, F.z, 0.24, 0.34, 0.9);
  F.chats.forEach((a, k) => { const q = chute(a); ecume(q.x, q.y, q.z, 0.02, 0.16, k * 1.3); });
  ecume(Bq.x, Bq.y, Bq.z, 0.2, 0.36, 0.4);
  /* 5. les poissons de la fontaine : trois kois et deux poissons d'or, qui tournent entre les socles des chats et le bord */
  const mat = (c) => new T.MeshLambertMaterial({ color: c });
  const poissons = [['#f08a2c', '#fff4e6', 2.72, 0.32, 0], ['#fff4e6', '#f08a2c', 2.78, -0.27, 2.2], ['#f6c33a', '#fff0a0', 2.66, 0.36, 4.1], ['#e0482c', '#fff4e6', 2.82, -0.3, 5.0], ['#f6c33a', '#ffd84a', 2.7, 0.29, 1.1]].map(([c, c2, r, v, ph]) => {
    const p = new T.Group(), corps = new T.Mesh(new T.SphereGeometry(0.05, 12, 8), mat(c)); corps.scale.set(0.7, 0.55, 1.7); p.add(corps); p.scale.setScalar(2.1);
    const tache = new T.Mesh(new T.SphereGeometry(0.03, 8, 6), mat(c2)); tache.position.set(0, 0.02, 0.015); tache.scale.set(1, 0.5, 1.5); p.add(tache);
    const piv = new T.Group(); piv.position.z = -0.07; p.add(piv); const q = new T.Mesh(new T.ConeGeometry(0.045, 0.08, 4), mat(c)); q.rotation.x = Math.PI / 2; q.position.z = -0.035; q.scale.set(0.25, 1, 1); piv.add(q);
    p.position.y = F.y - 0.08; g.add(p); return { p, piv, r, v, ph };
  });
  /* 6. les gouttes : un seul maillage repete (des petites boules), chaque goutte vole puis retombe dans l'eau */
  const NG = 600, gouttes = new T.InstancedMesh(new T.IcosahedronGeometry(1, 0), fx('#eef9ff', { opacity: 0.9 }), NG); gouttes.renderOrder = 6; gouttes.frustumCulled = false; g.add(gouttes);
  const G = [], M4 = new T.Matrix4(), V0 = new T.Vector3(); for (let i = 0; i < NG; i++) G.push({ vie: 0 });
  let libre = 0; const emettre = (x, y, z, vx, vy, vz, vie, taille, sol) => { const o = G[libre]; libre = (libre + 1) % NG; Object.assign(o, { x, y, z, vx, vy, vz, vie, vieMax: vie, taille, sol }); };
  const tE = {}; const chaque = (cle, dt, periode) => { tE[cle] = (tE[cle] || 0) + dt; let n = 0; while (tE[cle] > periode) { tE[cle] -= periode; n++; } return n; };
  /* 7. la cascade au bout du canal : la nappe qui tombe de l'ile (ses filets descendent), une nappe sombre derriere, l'ecume au rebord, la brume en bas */
  const NB = 44, NC = 6, pos = [], uv = [], chuteF = [], idx = [];
  for (let i = 0; i <= NB; i++) { const u = i / NB, sv = C.chute * u * u * 0.35 + C.chute * u * 0.65, x = C.x1 + 1.35 * Math.sqrt(sv / 4.9), w = C.w * (1 + 0.9 * u);
    for (let j = 0; j <= NC; j++) { const k = j / NC; pos.push(x + 0.08 * Math.sin(Math.PI * k), C.y - sv, C.z + (k - 0.5) * w); uv.push(k, sv / 1.3); chuteF.push(u); } }
  for (let i = 0; i < NB; i++) for (let j = 0; j < NC; j++) { const a = i * (NC + 1) + j, b = a + NC + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const geoC = new T.BufferGeometry(); geoC.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geoC.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geoC.setAttribute('aChute', new T.Float32BufferAttribute(chuteF, 1)); geoC.setIndex(idx);
  const matCascade = (clair, alpha, vit) => new T.ShaderMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide, uniforms: { uT },
    vertexShader: 'attribute float aChute; varying vec2 vUv; varying float vC; void main() { vUv = uv; vC = aChute; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: ['uniform float uT; varying vec2 vUv; varying float vC;',
      'void main() {',
      '  float fil = smoothstep(0.35, 1.0, sin((vUv.x * 9.0 + sin(vUv.y * 1.7) * 0.5) * 6.2832) * 0.5 + 0.5);',
      '  float f = fract(vUv.y * 1.1 - uT * ' + vit.toFixed(1) + ' + vUv.x * 0.37); float pas = smoothstep(0.0, 0.2, f) * smoothstep(1.0, 0.5, f);',
      '  vec3 col = mix(vec3(0.5, 0.78, 0.94), vec3(0.95, 0.99, 1.0), clamp(fil * 0.55 + pas * 0.4 + ' + clair.toFixed(2) + ', 0.0, 1.0));',
      '  float a = (' + alpha.toFixed(2) + ' - vC * 0.72) * (0.7 + 0.3 * fil) * smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x);',
      '  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));',
      '}'].join('\n') });
  const derriere = new T.Mesh(geoC, matCascade(-0.25, 0.7, 1.0)); derriere.position.set(0.07, -0.02, 0); derriere.renderOrder = 3; g.add(derriere);
  const devant = new T.Mesh(geoC, matCascade(0.1, 0.9, 1.5)); devant.renderOrder = 4; g.add(devant);
  const levre = new T.Mesh(new T.PlaneGeometry(0.22, C.w + 0.05), fx('#f4fcff', { opacity: 0.75 })); levre.rotation.x = -Math.PI / 2; levre.position.set(C.x1 - 0.06, C.y + 0.006, C.z); levre.renderOrder = 5; g.add(levre);
  const texB = texBrumeCasino(T), brumes = [];
  for (let k = 0; k < 9; k++) { const s = new T.Sprite(new T.SpriteMaterial({ map: texB, transparent: true, depthWrite: false, opacity: 0.5 })); s.renderOrder = 6; g.add(s);
    brumes.push({ s, y: -C.chute * (0.55 + 0.45 * h()), dz: (h() - 0.5) * 1.6, ph: h() * 6.28, t: 1.6 + h() * 1.4 }); }
  decor.add(g);
  const animer = (dt, s) => {
    uT.value = s % 60; dt = Math.min(dt, 0.1);
    filets.offset.y = (s * 1.2) % 1; filetsJ.offset.x = -((s * 1.6) % 1);
    ecumes.forEach((e) => { const k = 1 + 0.05 * Math.sin(s * 6 + e.ph); e.m.scale.set(k, k, 1); e.m.material.opacity = 0.5 + 0.18 * Math.sin(s * 4.3 + e.ph); });
    levre.material.opacity = 0.6 + 0.2 * Math.sin(s * 7);
    poissons.forEach((o) => { const a = o.ph + s * o.v, rr = o.r + 0.05 * Math.sin(s * 0.7 + o.ph); o.p.position.x = F.x + Math.cos(a) * rr; o.p.position.z = F.z + Math.sin(a) * rr;
      o.p.rotation.y = Math.atan2(-Math.sin(a) * o.v, Math.cos(a) * o.v); o.piv.rotation.y = Math.sin(s * 11 + o.ph) * 0.5; });
    brumes.forEach((b) => { const k = (Math.sin(s * 0.8 + b.ph) + 1) / 2; b.s.position.set(C.x1 + 1.7 + 0.6 * k, b.y + 0.6 * Math.sin(s * 0.5 + b.ph), C.z + b.dz); b.s.scale.setScalar(b.t * (0.8 + 0.4 * k)); b.s.material.opacity = 0.28 + 0.22 * k; });
    /* les gouttes : ce qui jaillit et retombe */
    F.chats.forEach((a, k) => { const q = chute(a); for (let n = chaque('c' + k, dt, 0.05); n > 0; n--) emettre(q.x + (h() - 0.5) * 0.1, F.y + 0.02, q.z + (h() - 0.5) * 0.1, Math.cos(a) * 0.3 + (h() - 0.5) * 0.5, 0.7 + h() * 0.5, Math.sin(a) * 0.3 + (h() - 0.5) * 0.5, 0.4, 0.032, F.y); });
    for (let n = chaque('nV', dt, 0.018); n > 0; n--) { const a = h() * 6.2832, r = F.bordV + 0.16; emettre(F.x + Math.cos(a) * r, F.y + 0.02, F.z + Math.sin(a) * r, Math.cos(a) * 0.35, 0.6 + h() * 0.5, Math.sin(a) * 0.35, 0.35, 0.028, F.y); }
    for (let n = chaque('nH', dt, 0.04); n > 0; n--) { const a = h() * 6.2832, r = F.bordH + 0.1; emettre(F.x + Math.cos(a) * r, F.yV + 0.02, F.z + Math.sin(a) * r, Math.cos(a) * 0.25, 0.5 + h() * 0.4, Math.sin(a) * 0.25, 0.3, 0.024, F.yV); }
    for (let n = chaque('h', dt, 0.12); n > 0; n--) { const a = h() * 6.2832; emettre(F.x + Math.cos(a) * 0.28, F.yH + 0.02, F.z + Math.sin(a) * 0.28, Math.cos(a) * 0.15, 0.35 + h() * 0.3, Math.sin(a) * 0.15, 0.3, 0.02, F.yH); }
    for (let n = chaque('b', dt, 0.016); n > 0; n--) emettre(Bq.x + (h() - 0.5) * 0.04, Bq.jet, Bq.z + (h() - 0.5) * 0.04, (h() - 0.5) * 0.35, 3.1 + h() * 0.5, (h() - 0.5) * 0.35, 1.2, 0.036, Bq.y);
    for (let n = chaque('k', dt, 0.03); n > 0; n--) emettre(C.x1 + 0.1, C.y + 0.02, C.z + (h() - 0.5) * C.w, 1.2 + h() * 0.5, 0.25 + h() * 0.4, (h() - 0.5) * 0.4, 1.4, 0.03, -C.chute);
    let i = 0;
    for (const o of G) {
      if (o.vie > 0) { o.vie -= dt; o.vy -= 7.5 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.z += o.vz * dt; if (o.y < o.sol && o.vy < 0) o.vie = 0; }
      const t = o.vie > 0 ? o.taille * (0.5 + 0.5 * o.vie / o.vieMax) : 0;
      M4.makeScale(t, t, t); M4.setPosition(o.vie > 0 ? V0.set(o.x, o.y, o.z) : V0.set(0, -999, 0)); gouttes.setMatrixAt(i++, M4);
    }
    gouttes.instanceMatrix.needsUpdate = true;
  };
  return { animer, uT, groupe: g };
}

/* ---------- SE DEPLACER SUR L'ILE (07/11/2026 au soir, « il faut penser avec une logique humaine de deplacement », Mathieu) ----------
   Le perso suit un vrai chemin : une grille de 0,5 m sur l'ile, ou le decor de casino.py (decor_casino2) bouche ce qu'il occupe ; le chemin le plus court
   (A*), puis lisse en lignes droites tant qu'on voit le point suivant. Tout est donne sur l'ile (le jeu ajoute CASINO). */
const STADE_CASINO = { cx: 0, cz: 19.5, a: 7, R: 4.6, L: 2.4 };
function stadePoint(sv) { /* un point de la ligne du stade (la course) : sv, la distance depuis l'ouest de la ligne droite du nord ; x, z, la tangente tx, tz, la normale vers l'exterieur nx, nz */
  const S = STADE_CASINO, P = 4 * S.a + 2 * Math.PI * S.R; sv = ((sv % P) + P) % P;
  if (sv < 2 * S.a) return { x: S.cx - S.a + sv, z: S.cz - S.R, tx: 1, tz: 0, nx: 0, nz: -1 };
  sv -= 2 * S.a; if (sv < Math.PI * S.R) { const t = -Math.PI / 2 + sv / S.R; return { x: S.cx + S.a + S.R * Math.cos(t), z: S.cz + S.R * Math.sin(t), tx: -Math.sin(t), tz: Math.cos(t), nx: Math.cos(t), nz: Math.sin(t) }; }
  sv -= Math.PI * S.R; if (sv < 2 * S.a) return { x: S.cx + S.a - sv, z: S.cz + S.R, tx: -1, tz: 0, nx: 0, nz: 1 };
  sv -= 2 * S.a; const t = Math.PI / 2 + sv / S.R; return { x: S.cx - S.a + S.R * Math.cos(t), z: S.cz + S.R * Math.sin(t), tx: -Math.sin(t), tz: Math.cos(t), nx: Math.cos(t), nz: Math.sin(t) };
}
const PONT_CASINO = { x0: 21.55, x1: 22.85, z: 1.3, rampe: 0.6 };
function hauteurCasino(x, z) { /* le sol est plat, sauf le petit pont en dos d'ane sur le canal */
  const P = PONT_CASINO; if (x < P.x0 || x > P.x1) return 0; const a = Math.abs(z);
  if (a <= P.z) return 0.44 + 0.3 * Math.cos(Math.PI * z / (2 * P.z)); if (a <= P.z + P.rampe) return 0.44 * (P.z + P.rampe - a) / P.rampe; return 0;
}
const OBST_CASINO = (() => { const R = [], C = [], sym = (x, z, r) => { C.push([x, z, r], [x, -z, r]); }, symX = (x, z, r) => { C.push([x, z, r], [-x, z, r]); };
  [[-21, -10.5], [-12, -20.5], [-22, 8.5], [-12.8, 22], [20, -12], [13, -21.5], [21, 9], [12, 24], [-10.2, 10.6], [10.2, 10.6], [24.5, 5.5], [-6.5, 26]].forEach(([x, z]) => C.push([x, z, 0.45])); /* les palmiers */
  R.push([-6.3, 6.3, -26.6, -15.3], [2.1, 2.3, -15.4, -9.4], [-2.3, -2.1, -15.4, -9.4]); /* le palais, son perron, les cordons du tapis */
  symX(4.6, -15.2, 1.0); symX(8.6, -20.5, 1.8); symX(3.8, -9.8, 0.35); symX(3.8, -12.8, 0.35); symX(3.8, -11.3, 0.5); symX(7.2, -14.3, 0.5); symX(10.2, -14.3, 0.5); symX(9.5, -16.9, 0.8); symX(10.6, -18.3, 0.6);
  C.push([0, 0, 5.05]); /* la fontaine et ses parterres */
  for (let k = 0; k < 4; k++) { const d = Math.PI / 4 + k * Math.PI / 2; C.push([Math.cos(d) * 8.2, Math.sin(d) * 8.2, 0.55]); [-0.35, 0.35].forEach((e) => C.push([Math.cos(d + e) * 8.2, Math.sin(d + e) * 8.2, 0.35])); [-0.19, 0.19].forEach((e) => C.push([Math.cos(d + e) * 7.7, Math.sin(d + e) * 7.7, 0.9])); }
  sym(-24, 3.3, 0.5); sym(-25.6, 4.0, 0.75); R.push([-20.9, -11.1, 4.4, 5.2], [-20.9, -11.1, -5.2, -4.4]); sym(-16, 3.9, 0.25); sym(-22, 3.9, 0.25); sym(-10.6, 3.6, 0.35); sym(-13.6, 3.6, 0.35); sym(-18.4, 3.6, 0.35); sym(-12.1, 4.0, 0.95); sym(-22.6, 4.3, 0.5);
  C.push([-14, -12, 3.0], [-21, -8, 1.1], [-15.6, -6.4, 0.45], [-12.4, -6.4, 0.45], [-17.5, 8, 0.7], [-16.2, 8.6, 0.7], [-19.6, 7.6, 0.95], [-18.6, 9.4, 0.75]); R.push([-11.4, -8.2, -6.2, -5.0]); /* l'ouest */
  R.push([-6.5, -1.1, 11.2, 13.7], [1.1, 6.5, 11.2, 13.7], [-6.2, -5.0, 9.0, 11.0], [14.7, 17.3, 9.3, 14.7]); symX(3.2, 8.6, 0.5); C.push([5.6, 10, 0.55], [14, 9, 0.55], [14, 15, 0.55]); /* l'hippodrome */
  R.push([13.2, 20.8, -2.3, 2.3], [20.7, 21.5, -0.9, 0.9], [22.9, 27.4, -0.9, 0.9], [14.4, 19.6, 5.6, 6.8], [14.4, 19.6, -6.8, -5.6]); /* les jardins : bassin, canal (le pont reste libre), parterres */
  sym(25.6, 1.35, 0.5); sym(24, 2.6, 0.45); sym(11.6, 4.4, 0.5); sym(22.6, 4.4, 0.5); sym(10, 3.6, 0.35); sym(14.5, 4.75, 0.35); sym(19.5, 4.75, 0.35); sym(17, 4.2, 0.95); C.push([15.5, -9.4, 0.8], [17.4, -9.8, 0.6], [19.5, -9, 0.5]);
  return { R, C }; })();
function libreCasino(x, z, marge) { /* sur l'ile, hors du decor (marge : la place du perso) */
  const m = marge == null ? 0.3 : marge, S = STADE_CASINO;
  for (const [dx, dz] of [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]]) { const di = Math.round((x + dx) / 2), dj = Math.round((z + dz) / 2); if (Math.hypot(di, dj) > 13.6) return false; }
  if (Math.hypot(Math.max(Math.abs(x - S.cx) - S.a, 0), z - S.cz) <= S.R + S.L / 2 + 0.25 + m) return false; /* la piste, barrieres comprises */
  for (const [x0, x1, z0, z1] of OBST_CASINO.R) if (x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m) return false;
  for (const [cx, cz, r] of OBST_CASINO.C) if ((x - cx) * (x - cx) + (z - cz) * (z - cz) < (r + m) * (r + m)) return false;
  return true;
}
function alleeCasino(x, z) { /* les allees de marbre (iles.py version 10, marbre) : le perso les prefere a la pelouse */
  const di = Math.round(x / 2), dj = Math.round(z / 2), ad = Math.abs(di), aj = Math.abs(dj);
  return Math.hypot(di, dj) <= 4.4 || (di <= -4 && aj <= 1) || (ad <= 1 && dj >= -8 && dj <= -4) || (ad <= 5 && dj >= -13 && dj <= -7) || (ad <= 1 && dj >= 4 && dj <= 5) || (ad <= 4 && dj === 5) ||
    (di === 0 && dj === 6) || (di >= 4 && di <= 5 && aj <= 1) || (di >= 6 && di <= 11 && aj <= 2) || (di === -7 && dj >= -4 && dj <= -2) || (x >= PONT_CASINO.x0 && x <= PONT_CASINO.x1 && Math.abs(z) <= PONT_CASINO.z + PONT_CASINO.rampe);
}
const COUT_HERBE = 2.2; /* (un pas sur la pelouse compte pour 2,2 pas d'allee : on coupe par l'herbe seulement si l'allee fait un vrai detour) */
const GRILLE_CASINO = { pas: 0.5, min: -30, n: 121, libre: null, allee: null };
function grilleCasino() {
  const G = GRILLE_CASINO; if (G.libre) return G; G.libre = new Uint8Array(G.n * G.n); G.allee = new Uint8Array(G.n * G.n);
  for (let i = 0; i < G.n; i++) for (let j = 0; j < G.n; j++) { const x = G.min + i * G.pas, z = G.min + j * G.pas; G.libre[i * G.n + j] = libreCasino(x, z) ? 1 : 0; G.allee[i * G.n + j] = alleeCasino(x, z) ? 1 : 0; }
  return G;
}
function cheminCasino(x0, z0, x1, z1) { /* le chemin du perso de (x0, z0) a (x1, z1) : des points [x, z], le dernier au plus pres de la cible ; null s'il n'y en a pas */
  const G = grilleCasino(), n = G.n, ci = (v) => Math.max(0, Math.min(n - 1, Math.round((v - G.min) / G.pas))), libre = (i, j) => i >= 0 && j >= 0 && i < n && j < n && G.libre[i * n + j] === 1;
  const proche = (i, j) => { if (libre(i, j)) return [i, j]; for (let r = 1; r < 40; r++) { let best = null, bd = 1e9; for (let a = -r; a <= r; a++) for (const [p, q] of [[i + a, j - r], [i + a, j + r], [i - r, j + a], [i + r, j + a]]) if (libre(p, q)) { const d = (p - i) * (p - i) + (q - j) * (q - j); if (d < bd) { bd = d; best = [p, q]; } } if (best) return best; } return null; };
  const A = proche(ci(x0), ci(z0)), B = proche(ci(x1), ci(z1)); if (!A || !B) return null;
  const k = (i, j) => i * n + j, g = new Float32Array(n * n).fill(Infinity), de = new Int32Array(n * n).fill(-1), ferme = new Uint8Array(n * n), tas = [];
  const pousser = (f, id) => { tas.push([f, id]); let c = tas.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (tas[p][0] <= tas[c][0]) break; [tas[p], tas[c]] = [tas[c], tas[p]]; c = p; } };
  const tirer = () => { const t = tas[0], d = tas.pop(); if (tas.length) { tas[0] = d; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < tas.length && tas[l][0] < tas[m][0]) m = l; if (r < tas.length && tas[r][0] < tas[m][0]) m = r; if (m === c) break; [tas[m], tas[c]] = [tas[c], tas[m]]; c = m; } } return t; };
  const h = (i, j) => { const dx = Math.abs(i - B[0]), dz = Math.abs(j - B[1]); return Math.max(dx, dz) + 0.4142 * Math.min(dx, dz); };
  g[k(A[0], A[1])] = 0; pousser(h(A[0], A[1]), k(A[0], A[1])); const fin = k(B[0], B[1]);
  while (tas.length) {
    const [, id] = tirer(); if (ferme[id]) continue; ferme[id] = 1; if (id === fin) break; const i = Math.floor(id / n), j = id % n;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { if (!a && !b) continue; const p = i + a, q = j + b; if (!libre(p, q) || (a && b && (!libre(i + a, j) || !libre(i, j + b)))) continue;
      const id2 = k(p, q), v = g[id] + (a && b ? 1.4142 : 1) * (G.allee[id2] ? 1 : COUT_HERBE); if (v < g[id2]) { g[id2] = v; de[id2] = id; pousser(v + h(p, q), id2); } }
  }
  if (!ferme[fin]) return null;
  const pts = []; for (let id = fin; id !== -1; id = de[id]) pts.push([G.min + Math.floor(id / n) * G.pas, G.min + (id % n) * G.pas]); pts.reverse();
  if (libreCasino(x1, z1, 0.2)) pts[pts.length - 1] = [x1, z1];
  const herbe = (x, z) => !alleeCasino(x, z), herbeChemin = pts.map((q) => (herbe(q[0], q[1]) ? G.pas : 0)); /* (les metres d'herbe du chemin trouve, point par point) */
  const voit = (a, b, i, j) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.ceil(L / 0.2); let h = 0;
    for (let s = 1; s < m; s++) { const t = s / m, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; if (!libreCasino(x, z, 0.25)) return false; if (herbe(x, z)) h += L / m; }
    let hc = 0; for (let k = i + 1; k <= j; k++) hc += herbeChemin[k]; return h <= hc + 0.8; }; /* (le raccourci ne coupe pas plus par l'herbe que le chemin trouve) */
  const lisse = [[x0, z0]]; let i = -1; while (i < pts.length - 1) { let j = pts.length - 1; while (j > i + 1 && !voit(lisse[lisse.length - 1], pts[j], Math.max(i, 0), j)) j--; lisse.push(pts[j]); i = j; } /* (on va droit tant qu'on voit le point suivant) */
  return lisse.slice(1);
}
