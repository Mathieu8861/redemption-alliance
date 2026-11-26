/* LE DECOR VIVANT DE L'ARENE ET DE L'ILE DES BOSS (17/11/2026, « commence a travailler sur une refonte visuelle de l'arene et de l'ile du boss, genre les
   drapeaux flottants, les flammes qui bougent etc., a l'image de tout ce qu'on a fait recemment sur la ferme : un peu plus de detail et de qualite », Mathieu).
   - drapeauVivant(m) : le tissu (pieces drapeau_* de blender/arene-ile.py, gardees hors fusion) ondule d'autant plus qu'on s'eloigne de son attache (x local),
     le long de sa normale (y local apres l'export), chaque drapeau a sa phase (d'apres sa position) ; son contour et son ombre ondulent avec lui
   - flammeVivante(parent, p, o) : une flamme du shader des incendies (FEU_FS, 13-batiments-pv.js) recoloree (orange pour l'arene, violette pour l'ile),
     son halo qui vacille et des braises qui montent
   - le public de l'arene qui s'agite (des petits sauts, chacun a son rythme), des poussieres qui flottent dans la lumiere
   animerDecorVivant(dt) : appelee par la boucle (30-boucle.js) ; ne travaille que sur le lieu visible */
const DV = { uT: { value: 0 }, arene: null, ile: null };

/* ---------- le tissu qui flotte ---------- */
const ONDE_DRAPEAU = `uniform float uT; uniform float uA; uniform float uB;
  vec2 ondeDrapeau(vec3 p) { /* (le deplacement le long de la normale, et sa pente le long du tissu) */
    float d = max(p.x, 0.0), ph = dot(modelMatrix[3].xz, vec2(0.37, 0.53));
    float a1 = uT * 4.6 - d * 3.2 + ph, a2 = uT * 7.9 - d * 6.0 + ph * 1.7 - p.z * 2.3;
    float w = sin(a1) * 0.6 + sin(a2) * 0.25, dw = -3.2 * cos(a1) * 0.6 - 6.0 * cos(a2) * 0.25;
    w = mix(w, w * 0.5 + 0.55, uB); dw = mix(dw, dw * 0.5, uB);
    return vec2(w * uA * d, uA * (w + d * dw));
  }
`;
function brancherDrapeau(mat, amp, biais, normales) {
  const u = { uA: { value: amp }, uB: { value: biais } };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uT = DV.uT; sh.uniforms.uA = u.uA; sh.uniforms.uB = u.uB;
    sh.vertexShader = ONDE_DRAPEAU + sh.vertexShader;
    if (normales && sh.vertexShader.includes('#include <beginnormal_vertex>')) sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n  { vec2 o = ondeDrapeau(position); objectNormal = normalize(objectNormal - vec3(o.y, 0.0, 0.0) * sign(objectNormal.y + 1e-4)); }');
    sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  { vec2 o = ondeDrapeau(position); transformed.y += o.x; transformed.x -= abs(o.x) * 0.12; }');
  };
  mat.customProgramCacheKey = () => 'drapeau-vivant-' + mat.type + (normales ? '-n' : '');
  return mat;
}
function drapeauVivant(m, amp, biais) { /* amp : l'ampleur (par unite de longueur) ; biais 1 : le tissu ne part que d'un cote (les bannieres contre le mur) */
  m.material = brancherDrapeau(m.material.clone(), amp, biais, true);
  m.customDepthMaterial = brancherDrapeau(new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking }), amp, biais, false);
  m.children.forEach((k) => { if (k.isMesh && k.material && k.material.side === T.BackSide) k.material = brancherDrapeau(k.material.clone(), amp, biais, false); }); /* (son contour) */
  m.frustumCulled = false;
}

/* ---------- les flammes ---------- */
const FLAMME_FS = `varying vec2 vUv; uniform float uT; uniform float uS; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uC4; uniform vec3 uC5;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { v += a * n(p); p = p * 2.07 + vec2(1.7, 9.2); a *= 0.5; } return v; }
  void main(){
    float y = vUv.y, t = uT * 1.6 + uS * 13.0;
    float tord = (fbm(vec2(y * 2.2 - t * 1.1, uS * 3.0)) - 0.5) * 0.55 * y;
    float x = (vUv.x - 0.5 - tord) * 2.0;
    float corps = 0.92 * pow(max(0.0, 1.0 - y), 0.55) * smoothstep(-0.05, 0.22, y);
    float langues = (fbm(vec2(vUv.x * 4.0 + uS * 7.0, y * 3.2 - t * 2.4)) - 0.48) * (0.25 + 0.95 * y);
    float f = corps - abs(x) * (0.85 + 0.6 * y) + langues;
    if (f <= 0.0) { float a = f > -0.2 ? (f + 0.2) / 0.2 * 0.3 * (1.0 - y) : 0.0; if (a <= 0.01) discard; gl_FragColor = vec4(uC3, a); return; }
    float k = f + 0.06 * (1.0 - y); vec3 c;
    if (k > 0.55) c = uC1; else if (k > 0.36) c = uC2; else if (k > 0.19) c = uC3; else if (k > 0.07) c = uC4; else c = uC5;
    gl_FragColor = vec4(c, 1.0);
  }`;
const PALETTES_FEU = {
  orange: { c: ['#fff8d2', '#ffd64d', '#ff8f1f', '#eb4212', '#99210d'], lueur: [[0, 'rgba(255,170,60,0.9)'], [0.5, 'rgba(255,110,30,0.35)'], [1, 'rgba(255,90,20,0)']], braises: ['#ffb02e', '#ff6a12'] },
  violet: { c: ['#f6eaff', '#d9a8ff', '#a866fa', '#7433d9', '#3f1880'], lueur: [[0, 'rgba(190,120,255,0.9)'], [0.5, 'rgba(140,70,240,0.35)'], [1, 'rgba(110,40,220,0)']], braises: ['#e2c2ff', '#a866fa'] },
};
const texLueurs = {};
const lueurDe = (pal) => texLueurs[pal] || (texLueurs[pal] = texDouce(PALETTES_FEU[pal].lueur));
function flammeVivante(parent, p, o) { /* o : { h : hauteur, pal : 'orange' ou 'violet', braises : combien, halo : taille du halo (x h), vit : vitesse (1 : l'arene) } */
  o = Object.assign({ h: 0.6, pal: 'orange', braises: 3, halo: 1.9, vit: 1 }, o || {}); const P = PALETTES_FEU[o.pal], g = new T.Group(); g.position.copy(p); parent.add(g);
  const U = { uT: { value: 0 }, uS: { value: Math.random() * 10 } }; P.c.forEach((c, k) => { U['uC' + (k + 1)] = { value: new T.Color(c) }; });
  const fl = new T.Mesh(GEO_PLAN, new T.ShaderMaterial({ uniforms: U, vertexShader: FEU_VS, fragmentShader: FLAMME_FS, transparent: true, depthWrite: false, side: T.DoubleSide }));
  fl.scale.set(o.h * 0.8, o.h, 1); fl.position.y = o.h * 0.42; fl.renderOrder = 6; g.add(fl);
  const lu = new T.Mesh(GEO_PLAN, new T.MeshBasicMaterial({ map: lueurDe(o.pal), transparent: true, depthWrite: false, blending: T.AdditiveBlending })); lu.position.y = o.h * 0.35; lu.scale.setScalar(o.h * o.halo); lu.renderOrder = 5; g.add(lu);
  const br = []; for (let i = 0; i < o.braises; i++) { const b = new T.Mesh(GEO_PLAN, new T.MeshBasicMaterial({ color: P.braises[i % 2], transparent: true, depthWrite: false })); b.scale.setScalar(0.03 + 0.015 * Math.random()); /* (pas en lumiere ajoutee : sur le sable clair, elles viraient au blanc) */ b.userData = { t: Math.random(), a: Math.random() * 6.28, r: Math.random() * 0.12 * o.h / 0.6 }; g.add(b); br.push(b); }
  [fl, lu, ...br].forEach((m) => { m.raycast = () => {}; m.castShadow = m.receiveShadow = false; });
  const ph = Math.random() * 6.28, qf = new T.Quaternion();
  return { g, maj: (dt, q0, t) => {
    const q = qf; parent.getWorldQuaternion(q); q.invert().multiply(camera.quaternion);
    const tv = t * o.vit; U.uT.value = tv; fl.quaternion.copy(q); lu.quaternion.copy(q); lu.material.opacity = 0.62 + Math.sin(tv * 8.3 + ph) * 0.12 + Math.sin(tv * 19.7 + ph * 2) * 0.07;
    br.forEach((b) => { const u = b.userData; u.t += dt * 0.6 * o.vit; if (u.t > 1) { u.t = 0; u.a = Math.random() * 6.28; } b.position.set(Math.cos(u.a) * u.r + Math.sin(u.t * 8 + u.a) * 0.06, o.h * 0.55 + u.t * o.h * 2.2, Math.sin(u.a) * u.r); b.quaternion.copy(q); b.material.opacity = 1 - u.t; });
  } };
}

/* ---------- le public qui s'agite ---------- */
function publicVivant(pub) { /* chaque spectateur (un rectangle de 4 sommets) a sa phase : il se balance un peu, et de temps en temps il saute */
  const n = pub.geometry.attributes.position.count / 4, ph = new Float32Array(n * 4);
  for (let k = 0; k < n; k++) { const v = Math.random(); ph.set([v, v, v, v], k * 4); }
  pub.geometry.setAttribute('aPh', new T.BufferAttribute(ph, 1));
  pub.material.onBeforeCompile = (sh) => { sh.uniforms.uT = DV.uT;
    sh.vertexShader = 'uniform float uT; attribute float aPh;\n' + sh.vertexShader.replace('#include <begin_vertex>', ['#include <begin_vertex>',
      '  { float s = uT * (0.55 + aPh * 0.5) + aPh * 37.0; float saut = pow(max(0.0, sin(s * 3.1)), 18.0) * step(0.55, fract(s * 0.21 + aPh));',
      '    transformed.y += saut * 0.32 + sin(uT * 2.3 + aPh * 6.28) * 0.025; }'].join('\n')); };
  pub.material.customProgramCacheKey = () => 'public-vivant'; pub.material.needsUpdate = true;
}

/* ---------- les poussieres dans la lumiere ---------- */
function poussieres(parent, n, R, h, couleur) {
  const pos = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * R; pos.set([Math.cos(a) * r, 0.3 + Math.random() * h, Math.sin(a) * r], k * 3); ph[k] = Math.random(); }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('aPh', new T.BufferAttribute(ph, 1));
  const mat = new T.PointsMaterial({ color: couleur, size: 0.11, map: lueurDe('orange'), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.55 });
  mat.onBeforeCompile = (sh) => { sh.uniforms.uT = DV.uT;
    sh.vertexShader = 'uniform float uT; attribute float aPh;\n' + sh.vertexShader.replace('#include <begin_vertex>', ['#include <begin_vertex>',
      '  transformed.x += sin(uT * 0.21 + aPh * 40.0) * 0.9; transformed.z += cos(uT * 0.17 + aPh * 31.0) * 0.9; transformed.y += sin(uT * 0.35 + aPh * 17.0) * 0.4;'].join('\n')); };
  mat.customProgramCacheKey = () => 'poussieres';
  const pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.raycast = () => {}; parent.add(pts); return pts;
}

/* ---------- les eclats qui scintillent sur la coupe de l'arene (17/11/2026) : de petites etoiles a quatre branches, de temps en temps, sur son bord ---------- */
const ETOILE_TEX = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.25, 'rgba(255,240,180,0.9)'); g.addColorStop(1, 'rgba(255,220,120,0)'); x.fillStyle = g;
  x.beginPath(); x.moveTo(32, 2); x.quadraticCurveTo(35, 29, 62, 32); x.quadraticCurveTo(35, 35, 32, 62); x.quadraticCurveTo(29, 35, 2, 32); x.quadraticCurveTo(29, 29, 32, 2); x.fill(); return new T.CanvasTexture(cv); })();
function eclatsCoupe(parent, p, n) {
  const L = []; for (let k = 0; k < n; k++) { const m = new T.Mesh(GEO_PLAN, new T.MeshBasicMaterial({ map: ETOILE_TEX, transparent: true, depthWrite: false, depthTest: false })); m.renderOrder = 8; m.raycast = () => {}; m.visible = false; parent.add(m); L.push({ m, t: -Math.random() * 3 }); }
  return { maj: (dt, q) => L.forEach((o) => { o.t += dt; if (o.t < 0) { o.m.visible = false; return; } if (o.t === dt || !o.m.visible) { const a = Math.random() * 6.28, y = Math.random(); o.m.position.set(p.x + Math.cos(a) * (0.45 + 0.3 * y), p.y - y * 0.9, p.z + Math.sin(a) * (0.45 + 0.3 * y)); o.m.visible = true; }
    const k = o.t / 0.55; if (k >= 1) { o.t = -(1.5 + Math.random() * 3); o.m.visible = false; return; } o.m.quaternion.copy(q); o.m.rotateZ(k * 1.2); o.m.scale.setScalar(0.45 * Math.sin(k * Math.PI)); }) };
}

/* ---------- l'Arene : appelee par chargerArene (27-arene.js), apres la fusion ---------- */
function decorArene(g, reperes, pub) {
  const fx = { flammes: [] };
  g.traverse((m) => { if (!m.isMesh || !/^drapeau_/.test(m.name)) return; drapeauVivant(m, /banniere/.test(m.name) ? 0.08 : /fanionet/.test(m.name) ? 0.3 : 0.17, /banniere/.test(m.name) ? 1 : 0); }); /* (fanionet : les petits fanions des guirlandes) */
  reperes.filter((x) => /^repere_torche/.test(x.nom)).forEach((x) => { fx.flammes.push(flammeVivante(g, x.p.clone(), { h: 0.62, pal: 'orange', braises: 3 })); });
  reperes.filter((x) => /^repere_brasero/.test(x.nom)).forEach((x) => { fx.flammes.push(flammeVivante(g, x.p.clone(), { h: 1.15, pal: 'orange', braises: 6, halo: 2.3 })); }); /* (les gros feux cote camera) */
  const tr = reperes.find((x) => /^repere_trophee/.test(x.nom)); if (tr) fx.flammes.push(eclatsCoupe(g, tr.p.clone(), 3)); /* (les eclats de la coupe, mis a jour avec les flammes) */
  if (pub) publicVivant(pub);
  fx.herses = herses(g); rendu.localClippingEnabled = true; /* (le haut des herses levees est coupe au-dessus de l'arc) */
  if (g.userData.montgolfiere) montgolfiereVivante(g.userData.montgolfiere, fx);
  fx.poussieres = poussieres(g, 70, 11, 5, '#fff1c8');
  g.userData.vivant = fx; DV.arene = g;
}

/* ---------- l'ile des boss : appelee par chargerIleBoss (27-arene.js), apres la fusion ; tout reste lent et doux (« plus lent, tranquille, que ca
   ne bouille pas dans tous les sens, que ca ne clignote pas : leger, fluide, joli », Mathieu, 15/10/2026) ---------- */
const BRUME_FS = `varying vec2 vUv; uniform float uT; uniform vec3 uC;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { v += a * n(p); p = p * 2.03 + vec2(3.1, 1.7); a *= 0.5; } return v; }
  void main(){
    vec2 p = (vUv - 0.5) * 2.0; float r = length(p);
    float bord = smoothstep(0.38, 0.62, r) * (1.0 - smoothstep(0.86, 1.0, r)); /* (le cercle de combat reste net, la brume tourne autour) */
    float b = fbm(p * 3.2 + vec2(uT * 0.035, -uT * 0.02)) * 0.65 + fbm(p * 6.5 - vec2(uT * 0.05, uT * 0.03)) * 0.35;
    float a = smoothstep(0.34, 0.86, b) * bord * 0.62; if (a < 0.01) discard;
    gl_FragColor = vec4(uC, a);
  }`;
const PORTAIL_FS = `varying vec2 vUv; uniform float uT; uniform float uI;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
  void main(){
    vec2 p = vUv - vec2(0.5, 0.48); p.x *= 0.72; float r = length(p), a = atan(p.y, p.x);
    float spir = sin(a * 3.0 + log(r + 0.02) * 7.0 - uT * 0.9) * 0.5 + 0.5; /* (trois bras qui s'enroulent vers le centre, lentement) */
    float bruit = n(vec2(a * 2.0 + uT * 0.15, r * 9.0 - uT * 0.6));
    float k = spir * 0.65 + bruit * 0.35, coeur = 1.0 - smoothstep(0.0, 0.28, r);
    vec3 c = mix(vec3(0.05, 0.02, 0.1), vec3(0.42, 0.18, 0.78), smoothstep(0.35, 0.85, k)); c = mix(c, vec3(0.82, 0.66, 1.0), coeur * coeur * 0.85); c = mix(c, vec3(0.92, 0.82, 1.0), uI * (0.35 + 0.65 * coeur));
    float bordx = smoothstep(0.5, 0.42, abs(vUv.x - 0.5)), bordy = smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.93, vUv.y);
    gl_FragColor = vec4(c, bordx * bordy);
  }`;
function brume(parent, R, y, couleur) {
  const m = new T.Mesh(new T.PlaneGeometry(2 * R, 2 * R), new T.ShaderMaterial({ uniforms: { uT: DV.uT, uC: { value: new T.Color(couleur) } }, vertexShader: FEU_VS, fragmentShader: BRUME_FS, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.renderOrder = 3; m.raycast = () => {}; m.castShadow = m.receiveShadow = false; parent.add(m); return m;
}
const COEUR_AME = texDouce([[0, 'rgba(255,250,255,1)'], [0.45, 'rgba(240,225,255,0.85)'], [1, 'rgba(220,190,255,0)']]);
function ames(parent, n, R0, R1, couleur) { /* de petites ames violettes qui flottent lentement autour de l'ile, chacune sur son cercle */
  const L = []; for (let k = 0; k < n; k++) {
    const m = new T.Mesh(GEO_PLAN, new T.MeshBasicMaterial({ map: lueurDe('violet'), color: couleur, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    const c = new T.Mesh(GEO_PLAN, new T.MeshBasicMaterial({ map: COEUR_AME, transparent: true, depthWrite: false })); c.scale.setScalar(0.35); m.add(c); /* (le coeur blanc, rond) */
    m.renderOrder = 7; m.raycast = () => {}; parent.add(m);
    L.push({ m, r: R0 + Math.random() * (R1 - R0), a: Math.random() * 6.28, v: (Math.random() < 0.5 ? -1 : 1) * (0.05 + Math.random() * 0.05), y: 0.9 + Math.random() * 2.2, ph: Math.random() * 6.28, e: 0.75 + Math.random() * 0.35 }); }
  return L;
}
function portail(parent, p, a) { /* le tourbillon dans l'arche-crane (la face tournee vers l'ile) */
  const m = new T.Mesh(new T.PlaneGeometry(4.9, 6.9), new T.ShaderMaterial({ uniforms: { uT: { value: 0 }, uI: { value: 0 } }, vertexShader: FEU_VS, fragmentShader: PORTAIL_FS, transparent: true, depthWrite: false, side: T.DoubleSide }));
  m.position.copy(p); m.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)); m.renderOrder = 4; m.raycast = () => {}; parent.add(m); return m;
}
const COULEURS_CRISTAL = ['b48cff', 'e2d2ff', '6d3fc0']; /* (cristal, cristalC, cristalF de blender/boss-ile.py, fondus par couleur : on les retrouve a leur couleur) */
const procheDe = (hx, c) => [0, 2, 4].every((i) => Math.abs(parseInt(hx.slice(i, i + 2), 16) - parseInt(c.slice(i, i + 2), 16)) <= 3);
function decorIle(g, reperes) {
  const fx = { flammes: [], cristaux: [] };
  reperes.filter((x) => /^repere_feuV/.test(x.nom)).forEach((x) => fx.flammes.push(flammeVivante(g, x.p.clone(), { h: 1.05, pal: 'violet', braises: 4, halo: 2.2, vit: 0.6 })));
  reperes.filter((x) => /^repere_feu(?!V)/.test(x.nom)).forEach((x) => fx.flammes.push(flammeVivante(g, x.p.clone(), { h: 0.72, pal: 'orange', braises: 2, vit: 0.6 }))); /* (les bols de feu du bord) */
  reperes.filter((x) => /^repere_grandeflamme/.test(x.nom)).forEach((x) => fx.flammes.push(flammeVivante(g, x.p.clone(), { h: 1.35, pal: 'violet', braises: 4, halo: 2.4, vit: 0.6 }))); /* (les yeux du grand crane de l'arche, par Discord le 17/11/2026 : « des flammes violettes qui sortent de ses yeux ») */
  reperes.filter((x) => /^repere_bougie/.test(x.nom)).forEach((x) => fx.flammes.push(flammeVivante(g, x.p.clone(), { h: 0.24, pal: 'violet', braises: 0, halo: 2.6, vit: 0.6 })));
  g.traverse((m) => { if (!m.isMesh || !m.material || !m.material.isMeshToonMaterial || !m.material.color) return; const hx = m.material.color.getHexString(), hx2 = m.material.color.clone().convertLinearToSRGB().getHexString(); /* (versToon range la couleur de Blender telle quelle) */
    if (procheDe(hx, COULEUR_FISSURE) || procheDe(hx2, COULEUR_FISSURE)) { m.material = m.material.clone(); m.material.emissive = m.material.color.clone(); m.material.emissiveIntensity = 0.3; fx.fissures = m.material; return; }
    if (COULEURS_CRISTAL.some((c) => procheDe(hx, c) || procheDe(hx2, c))) { m.material = m.material.clone(); m.material.emissive = m.material.color.clone(); m.material.emissiveIntensity = 0.25; fx.cristaux.push(m.material); } });
  fx.eclats = []; reperes.filter((x) => /^repere_cristal/.test(x.nom)).forEach((x) => { for (let k = 0; k < 3; k++) { const b = new T.Mesh(GEO_PLAN, new T.MeshBasicMaterial({ map: lueurDe('violet'), transparent: true, depthWrite: false, blending: T.AdditiveBlending })); b.renderOrder = 7; b.raycast = () => {}; g.add(b); fx.eclats.push({ b, p: x.p, t: Math.random(), a: Math.random() * 6.28 }); } });
  fx.brume = brume(g, 18.5, 0.32, '#b8a2f2');
  fx.ames = ames(g, 9, 9.5, 15.5, '#c9a2ff');
  const po = reperes.find((x) => /^repere_portail/.test(x.nom)); if (po) { const a = (numRepere(po.nom) || 225) * Math.PI / 180; fx.portail = portail(g, po.p.clone(), a); fx.eclairs = eclairsPortail(g, po.p.clone(), a); }
  g.userData.vivant = fx; DV.ile = g;
}


/* ---------- LES HERSES VIVANTES DE L'ARENE (17/11/2026, formulaire : « herses vivantes ») : fermees au repos, elles se levent quand un monstre sort, puis
   retombent dans un nuage de poussiere. Pieces grilleA/B/C de blender/arene-ile.py (une par herse), gardees hors fusion ; le haut est coupe au-dessus de l'arc ---------- */
function herses(g) {
  const par = {}; g.traverse((m) => { if (m.isMesh && /^grille[ABCD]/.test(m.name) && !(m.parent && /^grille/.test(m.parent.name))) (par[m.name[6]] = par[m.name[6]] || []).push(m); });
  return Object.values(par).map((L) => {
    const G = new T.Group(); g.add(G); L.forEach((m) => G.attach(m)); G.updateMatrixWorld(true);
    const b = new T.Box3(); L.forEach((m) => b.expandByObject(m)); const haut = b.max.y, h = haut - 0.45 - b.min.y, plan = new T.Plane(new T.Vector3(0, -1, 0), haut + 0.06);
    G.traverse((m) => { if (!m.isMesh) return; m.material = m.material.clone(); m.material.clippingPlanes = [plan]; m.castShadow = false; });
    const c = g.worldToLocal(b.getCenter(new T.Vector3())); return { G, lever: h - 0.75, ouv: 0, jusqua: 0, x: c.x, z: c.z, bas: b.min.y - g.position.y }; /* (dans le repere de l'arene) */
  });
}
function ouvrirHerse(x, z) { /* (x, z : la ou le monstre est apparu) */
  const g = DV.arene, H = g && g.userData.vivant && g.userData.vivant.herses; if (!H || !H.length) return;
  const lx = x - g.position.x, lz = z - g.position.z, h = H.slice().sort((a, b) => Math.hypot(a.x - lx, a.z - lz) - Math.hypot(b.x - lx, b.z - lz))[0];
  if (Math.hypot(h.x - lx, h.z - lz) < 4.5) h.jusqua = DV.uT.value + 2.6;
}
const apparaitreSansHerse = apparaitre; apparaitre = function (type, pres) { /* (les monstres de l'arene sortent des herses : celle d'ou il sort se leve) */
  const r = apparaitreSansHerse.apply(this, arguments);
  try { if (combat && combat.arene && lieu === 'arene') { const o = combat.monstres[combat.monstres.length - 1]; if (o) ouvrirHerse(o.x, o.z); } } catch (err) { /* rien */ }
  return r;
};
function animerHerses(fx, dt, t) {
  const g = DV.arene; fx.herses.forEach((h) => { const cible = t < h.jusqua ? 1 : 0, avant = h.ouv;
    h.ouv = cible > h.ouv ? Math.min(1, h.ouv + dt / 0.7) : Math.max(0, h.ouv - dt / 0.32); /* (elle monte en 0,7 s, et tombe d'un coup) */
    const e = cible ? 1 - Math.pow(1 - h.ouv, 2) : h.ouv * h.ouv; h.G.position.y = e * h.lever;
    if ((avant > 0 && h.ouv === 0) || (avant === 0 && h.ouv > 0)) pouf(g.position.x + h.x, g.position.y + h.bas + 0.1, g.position.z + h.z, avant > 0 ? 1.6 : 1.0, '#d8c9a3'); }); /* (la poussiere quand elle retombe, et un peu quand elle part) */
}

/* ---------- LA MONTGOLFIERE VIVANTE (17/11/2026, formulaire : « montgolfiere vivante ») : elle se balance doucement au bout de ses amarres et monte un peu ;
   a l'arene, son bruleur a de vraies flammes (a la ferme, il les avait deja : 14i-nuit.js, qui les fait suivre le balancement) ---------- */
function balancer(m, t, y0) { m.rotation.x = Math.sin(t * 0.83) * 0.022; m.rotation.z = Math.sin(t * 0.61 + 1.3) * 0.022; m.position.y = y0 + Math.sin(t * 1.07) * 0.06; }
function montgolfiereVivante(m, fx) {
  m.updateMatrixWorld(true); const s = m.getWorldScale(new T.Vector3()).x || 1, hsl = {}, foyers = [];
  m.traverse((o) => { if (!o.isMesh || !o.material || !o.material.isMeshBasicMaterial || o.material.map) return; o.material.color.getHSL(hsl); if (!(hsl.h > 0.02 && hsl.h < 0.17 && hsl.s > 0.5)) return;
    grappesLumiere(o, 0.25).forEach((gp) => { const c = gp.min.clone().add(gp.max).multiplyScalar(0.5); if (!foyers.some((f) => f.distanceTo(c) < 0.7)) foyers.push(c); }); o.visible = false; });
  foyers.forEach((c) => fx.flammes.push(flammeVivante(m, m.worldToLocal(c.clone()).add(new T.Vector3(0, -0.15 / s, 0)), { h: 0.8 / s, pal: 'orange', braises: 3 })));
  fx.montgolfiere = { m, y0: m.position.y };
}

/* ---------- LE BOSS SORT DU PORTAIL (17/11/2026, formulaire) : a son arrivee, le tourbillon de l'arche s'emballe et s'eclaire, des eclairs violets crepitent
   autour, un eclair de lumiere, et une bouffee violette la ou il apparait (sa place et son rythme ne changent pas) ---------- */
function eclairsPortail(parent, p, a) {
  const mat = new T.MeshBasicMaterial({ color: '#d9b8ff', transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }), L = [];
  const tg = new T.Vector3(-Math.sin(a), 0, Math.cos(a)), up = new T.Vector3(0, 1, 0), nf = new T.Vector3(-Math.cos(a), 0, -Math.sin(a));
  for (let k = 0; k < 5; k++) { const m = new T.Mesh(new T.BufferGeometry(), mat); m.visible = false; m.renderOrder = 9; m.raycast = () => {}; parent.add(m); L.push(m); }
  const flash = new T.Mesh(GEO_PLAN, new T.MeshBasicMaterial({ map: lueurDe('violet'), transparent: true, depthWrite: false, blending: T.AdditiveBlending })); flash.position.copy(p).addScaledVector(nf, 0.4); flash.visible = false; flash.renderOrder = 9; parent.add(flash);
  const refaire = (m) => { /* un eclair : une ligne brisee du coeur du tourbillon vers son bord, en ruban de 6 cm */
    const n = 7, ang = Math.random() * 6.28, R = 2.2 + Math.random() * 1.6, pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n, w = (i && i < n) ? (Math.random() - 0.5) * 0.7 : 0; pts.push(p.clone().addScaledVector(tg, Math.cos(ang) * R * u * 0.75 + w * Math.sin(ang)).addScaledVector(up, Math.sin(ang) * R * u + w * Math.cos(ang) * 0.6).addScaledVector(nf, 0.25)); }
    const pos = []; for (let i = 0; i < n; i++) { const a0 = pts[i], a1 = pts[i + 1], d = a1.clone().sub(a0).normalize(), l = d.clone().cross(nf).multiplyScalar(0.035 * (1.4 - i / n));
      [a0.clone().add(l), a0.clone().sub(l), a1.clone().add(l), a0.clone().sub(l), a1.clone().sub(l), a1.clone().add(l)].forEach((q) => pos.push(q.x, q.y, q.z)); }
    m.geometry.dispose(); m.geometry = new T.BufferGeometry(); m.geometry.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); };
  return { L, flash, refaire, t: 0, prochain: 0 };
}
/* (la salve part des que le boss est la, dans la boucle : lancerIleBoss peut attendre le chargement des modeles, 27d-bworks-v2.js) */

/* ---------- LES FISSURES QUI PULSENT (17/11/2026, formulaire) : les fissures violettes du sol de l'ile (fissureV de blender/boss-ile.py) respirent, et brillent
   plus fort et plus vite a chaque palier de rage du boss ---------- */
const COULEUR_FISSURE = '9a60f2';

/* ---------- la boucle ---------- */
const qDV = new T.Quaternion(), qParent = new T.Quaternion();
function animerDecorVivant(dt) {
  DV.uT.value += dt; const t = DV.uT.value;
  if (typeof montgolfiereMesh !== 'undefined' && montgolfiereMesh && montgolfiereMesh.visible && lieu === 'ferme') { montgolfiereMesh.userData.balance = true; balancer(montgolfiereMesh, t, POS_MONTGOLFIERE.y || 0); }
  [DV.arene, DV.ile].forEach((g) => { if (!g || !g.visible || !g.userData.vivant) return;
    g.getWorldQuaternion(qParent); qDV.copy(qParent).invert().multiply(camera.quaternion); /* (les flammes face a la camera, dans le repere de l'ile) */
    const fx = g.userData.vivant; fx.flammes.forEach((f) => f.maj(dt, qDV, t));
    if (fx.herses) animerHerses(fx, dt, t);
    if (fx.montgolfiere) balancer(fx.montgolfiere.m, t, fx.montgolfiere.y0);
    if (fx.portail) { const u = fx.portail.material.uniforms, s = fx.salve > 0 ? Math.min(1, fx.salve / 0.6, (2.8 - fx.salve) / 0.3 + 0.2) : 0; u.uI.value = s; u.uT.value += dt * (1 + 5 * s); }
    if (fx.eclairs && combat && combat.genre === 'ile' && fx.vu !== combat) { const b = combat.monstres.find((o) => o.d && o.d.boss); if (b) { fx.vu = combat; fx.salve = 2.8; pouf(b.x, 0.4, b.z, 2.6, '#a866fa'); } }
    if (fx.eclairs) { const E = fx.eclairs; if (fx.salve > 0) { fx.salve -= dt; E.prochain -= dt; if (E.prochain <= 0) { E.prochain = 0.07; E.L.forEach((m) => { m.visible = Math.random() < 0.7; if (m.visible) E.refaire(m); }); }
        E.flash.visible = true; E.flash.quaternion.copy(qDV); E.flash.scale.setScalar(6 + 2 * Math.sin(t * 23)); E.flash.material.opacity = Math.min(1, fx.salve) * (0.55 + 0.3 * Math.random()); }
      else if (E.flash.visible) { E.flash.visible = false; E.L.forEach((m) => { m.visible = false; }); } }
    if (fx.fissures) { const p = combat && combat.genre === 'ile' && combat.arene ? Math.min(6, combat.arene.pas || 0) : 0; fx.fissures.emissiveIntensity = 0.32 + 0.06 * p + (0.18 + 0.04 * p) * Math.sin(t * (0.9 + 0.25 * p)); }
    if (fx.cristaux) fx.cristaux.forEach((m, k) => { m.emissiveIntensity = 0.22 + 0.1 * Math.sin(t * 0.7 + k * 2.1); }); /* (une respiration de 9 s) */
    if (fx.eclats) fx.eclats.forEach((o) => { o.t += dt * 0.18; if (o.t > 1) { o.t = 0; o.a = Math.random() * 6.28; } const k = o.t; o.b.position.set(o.p.x + Math.cos(o.a) * (0.3 + k * 0.3), o.p.y + 0.4 + k * 2.4, o.p.z + Math.sin(o.a) * (0.3 + k * 0.3)); o.b.quaternion.copy(qDV); o.b.scale.setScalar(0.22 * (1 - k * 0.6)); o.b.material.opacity = Math.sin(k * Math.PI) * 0.9; });
    if (fx.ames) fx.ames.forEach((o) => { o.a += o.v * dt; o.m.position.set(Math.cos(o.a) * o.r, o.y + Math.sin(t * 0.5 + o.ph) * 0.35, Math.sin(o.a) * o.r); o.m.quaternion.copy(qDV); o.m.scale.setScalar(o.e * (0.9 + 0.1 * Math.sin(t * 0.8 + o.ph))); o.m.material.opacity = 0.75 + 0.2 * Math.sin(t * 0.6 + o.ph); });
  });
}
