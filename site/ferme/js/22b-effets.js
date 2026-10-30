'use strict';
/* LES ANIMATIONS DES SORTS (23/10/2026, « les animations d'attaque refaites, faut me les montrer en gif, des trucs stylés », « faut réussir à animer
   les sorts in game », puis « pousse encore les animations, fais en sorte qu'on ait un truc de malade », Mathieu).
   Un moteur de particules (des milliers de quads tournes vers la camera, dessines en un seul appel : lueurs et flammes en lumiere additive, fumee et
   poussiere en melange normal ; les etincelles s'etirent dans le sens de leur vitesse), des ondes de choc en degrade, des trainees de lame qui balaient
   et s'effacent, des flashs de lumiere qui eclairent le decor. Rien ici ne change le jeu : memes degats, aux memes instants qu'avant.
   Pas de Math.random : le banc rejoue les memes tirages, ces effets ont leur propre petit generateur. */
let graineFx = 7;
const fxAlea = () => (graineFx = (graineFx * 16807) % 2147483647) / 2147483647;
const fxEntre = (a, b) => a + (b - a) * fxAlea();
const fxLeger = () => graphismes() === 'leger'; /* (graphismes alleges : moitie moins de particules) */
const fxMat = (c, o, devant) => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: o == null ? 1 : o, side: T.DoubleSide, depthWrite: false, depthTest: !devant });
function geoLame(A, ep) { /* un croissant : epais au milieu, effile aux deux bouts, bombe vers +y (A : son demi-angle, ep : son epaisseur) */
  const R = 1.15, n = 24, pts = [];
  for (let i = 0; i <= n; i++) { const a = -A + 2 * A * i / n; pts.push(new T.Vector2(Math.sin(a) * R, Math.cos(a) * R)); }
  for (let i = n; i >= 0; i--) { const a = -A + 2 * A * i / n, r = R * (1 - ep * Math.pow(Math.cos(a / A * Math.PI / 2), 1.4)); pts.push(new T.Vector2(Math.sin(a) * r, Math.cos(a) * r)); }
  return new T.ShapeGeometry(new T.Shape(pts)); }
const GEO_LAME = geoLame(1.25, 0.4), GEO_LAME_COURTE = geoLame(0.62, 0.42);
const GEO_ETOILE = new T.ShapeGeometry(new T.Shape(Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2, r = i % 2 ? 0.2 : i % 4 ? 0.4 : 0.55; return new T.Vector2(Math.sin(a) * r, Math.cos(a) * r); })));
const GEO_CROIX = new T.ShapeGeometry(new T.Shape([[-1, 3], [1, 3], [1, 1], [3, 1], [3, -1], [1, -1], [1, -3], [-1, -3], [-1, -1], [-3, -1], [-3, 1], [-1, 1]].map(([x, y]) => new T.Vector2(x * 0.09, y * 0.09))));
const GEO_DISQUE = new T.CircleGeometry(1, 28), GEO_MOTTE = new T.BoxGeometry(0.14, 0.12, 0.14), GEO_FENTE = new T.BoxGeometry(1, 0.012, 0.075); GEO_FENTE.translate(0.5, 0, 0);
const MAT_MOTTES = ['#8b6a45', '#6e4f33', '#7fae4e'].map((c) => mat(c));
partager(GEO_LAME, GEO_LAME_COURTE, GEO_ETOILE, GEO_CROIX, GEO_DISQUE, GEO_MOTTE, GEO_FENTE, MAT_MOTTES);

/* un objet qui vit `duree` secondes : maj(k, objet), k de 0 a 1 ; il est jete a la fin */
function fxVie(m, duree, maj) { m.traverse((o) => { o.raycast = () => {}; }); scene.add(m); let t = 0; maj(0, m); effets.push((dt) => { t += dt / duree; maj(Math.min(1, t), m); if (t >= 1) { jeter(m); return true; } }); return m; }
const versCamera = (o) => o.quaternion.copy(camera.quaternion);
const COULEURS = new Map();
function rgb(c) { let v = COULEURS.get(c); if (!v) { const k = new T.Color(c); v = [k.r, k.g, k.b]; COULEURS.set(c, v); } return v; }

/* ---------- les textures, dessinees une fois au chargement ---------- */
function texCanvas(n, dessin) { const c = document.createElement('canvas'); c.width = c.height = n; dessin(c.getContext('2d'), n); const t = new T.CanvasTexture(c); partager(t); return t; }
const TEX_ROND = texCanvas(64, (g, n) => { const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.22, 'rgba(255,255,255,0.9)'); r.addColorStop(0.55, 'rgba(255,255,255,0.28)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, n, n); });
const TEX_VIF = texCanvas(64, (g, n) => { const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,1)'); r.addColorStop(0.75, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, n, n); }); /* (un point net : lisible en couleur pleine sur l'herbe claire) */
const TEX_FUMEE = texCanvas(128, (g, n) => { for (let i = 0; i < 22; i++) { const a = fxAlea() * Math.PI * 2, d = fxAlea() * n * 0.2, x = n / 2 + Math.cos(a) * d, y = n / 2 + Math.sin(a) * d, rr = n * (0.12 + fxAlea() * 0.17), r = g.createRadialGradient(x, y, 0, x, y, rr); r.addColorStop(0, 'rgba(255,255,255,0.5)'); r.addColorStop(0.6, 'rgba(255,255,255,0.22)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill(); } });

/* ---------- LE MOTEUR DE PARTICULES ---------- */
const VS_PART = `attribute vec3 iPos; attribute vec4 iCol; attribute vec2 iTai; attribute vec3 iVit; varying vec2 vUv; varying vec4 vCol;
void main() { vUv = uv; vCol = iCol; vec4 mv = modelViewMatrix * vec4(iPos, 1.0); vec2 p = position.xy; float s = iTai.x;
  vec3 vv = (modelViewMatrix * vec4(iVit, 0.0)).xyz; float L = length(vv.xy);
  if (L > 0.0001) { vec2 ax = vv.xy / L; vec2 pe = vec2(-ax.y, ax.x); p = ax * p.x * (s + L) + pe * p.y * s; }
  else { float c = cos(iTai.y), sn = sin(iTai.y); p = vec2(c * p.x - sn * p.y, sn * p.x + c * p.y) * s; }
  mv.xy += p; gl_Position = projectionMatrix * mv; }`;
const FS_PART = `uniform sampler2D map; varying vec2 vUv; varying vec4 vCol; void main() { vec4 t = texture2D(map, vUv); gl_FragColor = vec4(vCol.rgb * t.rgb, vCol.a * t.a); }`;
const SYSTEMES = [];
function systeme(max, tex, additif, ordre) {
  const q = new T.PlaneGeometry(1, 1), geo = new T.InstancedBufferGeometry(); geo.setIndex(q.index); geo.setAttribute('position', q.getAttribute('position')); geo.setAttribute('uv', q.getAttribute('uv'));
  const att = (nom, k) => { const a = new T.InstancedBufferAttribute(new Float32Array(max * k), k); a.setUsage(T.DynamicDrawUsage); geo.setAttribute(nom, a); return a; };
  const S = { max, vivants: [], libres: [], aPos: att('iPos', 3), aCol: att('iCol', 4), aTai: att('iTai', 2), aVit: att('iVit', 3), geo };
  geo.instanceCount = 0;
  const m = new T.Mesh(geo, new T.ShaderMaterial({ uniforms: { map: { value: tex } }, vertexShader: VS_PART, fragmentShader: FS_PART, transparent: true, depthWrite: false, blending: additif ? T.AdditiveBlending : T.NormalBlending }));
  m.frustumCulled = false; m.renderOrder = ordre; m.raycast = () => {}; partager(m); scene.add(m); S.mesh = m; SYSTEMES.push(S); return S; /* (jamais touche par un clic) */
}
const FX_LUM = systeme(1400, TEX_ROND, true, 8), FX_VIF = systeme(1400, TEX_VIF, false, 7), FX_FUM = systeme(600, TEX_FUMEE, false, 6); /* (FX_LUM : halos et lueurs en lumiere additive ; FX_VIF : etincelles, braises, flammes en couleur pleine ; FX_FUM : fumee, poussiere) */
/* une poignee de particules : o = { x, y, z, r (rayon de depart), v: [vx, vy, vz], dv (vitesse au hasard), vie: [min, max], taille: [debut, fin],
   c: [couleurs du debut a la fin], a (opacite), grav, frein, etire (les etincelles), rot, vrot, sol (rebond au sol), entree (fondu d'entree) } */
function emettre(S, n, o) {
  if (fxLeger()) n = Math.ceil(n * 0.5);
  for (let i = 0; i < n && S.vivants.length < S.max; i++) {
    const p = S.libres.pop() || {}, a = fxAlea() * Math.PI * 2, b = Math.acos(fxAlea() * 2 - 1), rr = (o.r || 0) * Math.cbrt(fxAlea()), dv = (o.dv || 0) * (0.35 + 0.65 * fxAlea());
    const sx = Math.sin(b) * Math.cos(a), sy = Math.cos(b), sz = Math.sin(b) * Math.sin(a), v = o.v || [0, 0, 0];
    p.x = o.x + sx * rr; p.y = o.y + Math.abs(sy) * rr * (o.plat ? 0.15 : 1); p.z = o.z + sz * rr;
    p.vx = v[0] + sx * dv; p.vy = v[1] + (o.haut ? Math.abs(sy) : sy) * dv; p.vz = v[2] + sz * dv;
    if (o.disperse) { p.vx *= fxEntre(1 - o.disperse, 1 + o.disperse); p.vy *= fxEntre(1 - o.disperse, 1 + o.disperse); p.vz *= fxEntre(1 - o.disperse, 1 + o.disperse); }
    p.age = 0; p.vie = o.vie ? fxEntre(o.vie[0], o.vie[1]) : 0.5; p.s0 = (o.taille ? o.taille[0] : 0.3) * fxEntre(0.75, 1.25); p.s1 = (o.taille ? o.taille[1] : 0) * fxEntre(0.8, 1.2);
    p.c = (o.c || ['#ffffff']).map(rgb); p.a = o.a == null ? 1 : o.a; p.grav = o.grav || 0; p.frein = o.frein || 0; p.etire = o.etire || 0;
    p.rot = fxAlea() * 6.28; p.vrot = (o.vrot || 0) * (fxAlea() - 0.5) * 2; p.sol = o.sol == null ? null : o.sol; p.rebond = o.rebond || 0.3; p.entree = o.entree || 0.06;
    S.vivants.push(p);
  }
}
function majParticules(dt) {
  for (const S of SYSTEMES) {
    const P = S.vivants, ps = S.aPos.array, cs = S.aCol.array, ts = S.aTai.array, vs = S.aVit.array; let j = 0;
    for (let i = 0; i < P.length; i++) {
      const p = P[i]; p.age += dt; if (p.age >= p.vie) { S.libres.push(p); continue; }
      p.vy -= p.grav * dt; const f = Math.max(0, 1 - p.frein * dt); p.vx *= f; p.vy *= f; p.vz *= f; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vrot * dt;
      if (p.sol != null && p.y < p.sol) { p.y = p.sol; p.vy = Math.abs(p.vy) * p.rebond; p.vx *= 0.55; p.vz *= 0.55; }
      const k = p.age / p.vie, n = p.c.length - 1, u = Math.min(n - 1e-6, k * n), i0 = Math.floor(u), w = u - i0, c0 = p.c[i0], c1 = p.c[Math.min(n, i0 + 1)];
      const al = p.a * Math.min(1, k / p.entree) * (k > 0.55 ? (1 - k) / 0.45 : 1), s = p.s0 + (p.s1 - p.s0) * (1 - (1 - k) * (1 - k));
      ps[j * 3] = p.x; ps[j * 3 + 1] = p.y; ps[j * 3 + 2] = p.z;
      cs[j * 4] = c0[0] + (c1[0] - c0[0]) * w; cs[j * 4 + 1] = c0[1] + (c1[1] - c0[1]) * w; cs[j * 4 + 2] = c0[2] + (c1[2] - c0[2]) * w; cs[j * 4 + 3] = al;
      ts[j * 2] = s; ts[j * 2 + 1] = p.rot; vs[j * 3] = p.vx * p.etire; vs[j * 3 + 1] = p.vy * p.etire; vs[j * 3 + 2] = p.vz * p.etire;
      P[j++] = p;
    }
    P.length = j; S.geo.instanceCount = j; S.aPos.needsUpdate = S.aCol.needsUpdate = S.aTai.needsUpdate = S.aVit.needsUpdate = true;
  }
}
/* ---------- les flashs de lumiere : deux lampes posees une fois pour toutes (en ajouter une en combat recompilerait tous les materiaux), allumees un instant ---------- */
const FLASHS = [0].map(() => { const l = new T.PointLight('#ffffff', 0, 7, 2); scene.add(l); return { l, t: 1, d: 1, i: 0 }; });
function flashLumiere(x, y, z, couleur, intensite, portee, duree) {
  const F = FLASHS.slice().sort((a, b) => (b.t / b.d) - (a.t / a.d))[0]; F.l.position.set(x, y, z); F.l.color.set(couleur); F.l.distance = portee || 7; F.i = (intensite || 2.5) * 0.5; F.d = duree || 0.25; F.t = 0;
  if (!F.actif) { F.actif = true; effets.push((dt) => { F.t += dt; const k = Math.min(1, F.t / F.d); F.l.intensity = F.i * (1 - k) * (1 - k); if (k >= 1) { F.l.intensity = 0; F.actif = false; return true; } }); }
}
/* ---------- ondes de choc en degrade : un anneau doux qui s'ecarte ---------- */
const GEO_ONDE_P = new T.PlaneGeometry(2, 2); GEO_ONDE_P.rotateX(-Math.PI / 2); partager(GEO_ONDE_P);
const VS_ONDE = `varying vec2 vP; void main() { vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FS_ONDE = `uniform vec3 uCol; uniform float uR, uL, uA; varying vec2 vP; void main() { float r = length(vP); float d = (r - uR) / uL; float a = exp(-d * d) * uA * smoothstep(1.0, 0.94, r) * smoothstep(0.0, uR * 0.6 + 0.001, r); gl_FragColor = vec4(uCol, a); }`;
function onde(x, y, z, r, couleur, duree, o, normal) {
  const u = { uCol: { value: new T.Color(couleur) }, uR: { value: 0.05 }, uL: { value: 0.14 }, uA: { value: o || 0.9 } };
  const m = new T.Mesh(GEO_ONDE_P, new T.ShaderMaterial({ uniforms: u, vertexShader: VS_ONDE, fragmentShader: FS_ONDE, transparent: true, depthWrite: false, blending: normal ? T.NormalBlending : T.AdditiveBlending }));
  m.position.set(x, y + 0.07, z); m.scale.setScalar(Math.max(0.3, r * 1.08)); m.renderOrder = 4;
  fxVie(m, duree || 0.4, (k) => { const e = 1 - Math.pow(1 - k, 3); u.uR.value = 0.06 + 0.86 * e; u.uL.value = 0.16 - 0.1 * e; u.uA.value = (o || 0.9) * (1 - k * k); });
}
/* ---------- les trainees de lame : un ruban en arc, une lame de lumiere qui balaie et dont la queue s'efface ---------- */
function geoRuban(A, R, ep, n) {
  const N = n || 40, pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) { const u = i / N, a = -A + 2 * A * u, e = ep * Math.pow(Math.sin(Math.PI * u), 0.7), ri = R * (1 - e);
    pos.push(Math.sin(a) * ri, Math.cos(a) * ri, 0, Math.sin(a) * R, Math.cos(a) * R, 0); uv.push(u, 0, u, 1); if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); partager(g); return g;
}
const GEO_RUBAN = geoRuban(1.25, 1.15, 0.42), GEO_RUBAN_COURT = geoRuban(0.7, 1.15, 0.5);
const VS_RUBAN = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FS_RUBAN = `uniform vec3 uCoeur, uBord; uniform float uP, uQ, uA; varying vec2 vUv;
void main() { float u = vUv.x; if (u > uP) discard; float t = clamp((u - (uP - uQ)) / uQ, 0.0, 1.0); float v = vUv.y;
  vec3 c = mix(uBord, uCoeur, smoothstep(0.45, 0.95, v)); float a = t * t * uA * smoothstep(0.0, 0.3, v) * (0.55 + 0.45 * smoothstep(0.9, 1.0, t)); gl_FragColor = vec4(c * (0.7 + 0.6 * t), a); }`;
function matRuban(coeur, bord, a, plein) { return new T.ShaderMaterial({ uniforms: { uCoeur: { value: new T.Color(coeur) }, uBord: { value: new T.Color(bord) }, uP: { value: 0 }, uQ: { value: 0.55 }, uA: { value: a == null ? 1 : a } }, vertexShader: VS_RUBAN, fragmentShader: FS_RUBAN, transparent: true, depthWrite: false, side: T.DoubleSide, blending: plein ? T.NormalBlending : T.AdditiveBlending }); }

/* la camera tremble (force en unites de jeu) ; appliquee juste le temps du rendu, la vue n'en garde rien */
const SECOUSSE = { v: new T.Vector3(), f: 0, t: 1, d: 1 };
function secousse(force, duree) {
  const S = SECOUSSE; if (S.t < S.d && S.f * (1 - S.t / S.d) > force) return; S.f = force; S.d = duree; S.t = 0;
  if (!S.actif) { S.actif = true; effets.push((dt) => { S.t += dt; const k = Math.max(0, 1 - S.t / S.d), a = S.f * k * k; S.v.set(Math.sin(S.t * 71) * a, Math.sin(S.t * 89 + 1.3) * a * 0.6, Math.cos(S.t * 63) * a); if (S.t >= S.d) { S.v.set(0, 0, 0); S.actif = false; return true; } }); }
}

/* ---------- les briques ---------- */
function etincelle(p, portee, couleur) { /* une gerbe d'etincelles etirees qui retombent */
  emettre(FX_VIF, 3, { x: p.x, y: p.y, z: p.z, r: 0.05, dv: 4 + portee * 3, vie: [0.18, 0.32], taille: [0.07, 0.02], c: ['#ffffff', couleur || '#ffd36a', '#ff8a2e'], grav: 9, frein: 2, etire: 0.05 });
}
function etoileImpact(p, taille, couleur) { /* l'eclat du coup sur la cible : un flash, une etoile, une gerbe d'etincelles */
  const t = taille || 1, c = couleur || '#ffc93a';
  emettre(FX_LUM, 1, { x: p.x, y: p.y, z: p.z, vie: [0.14, 0.16], taille: [1.6 * t, 2.6 * t], c: ['#ffffff', c], a: 0.9, entree: 0.01 });
  emettre(FX_VIF, Math.round(10 * t + 4), { x: p.x, y: p.y, z: p.z, r: 0.1, dv: 6 * t + 2, vie: [0.15, 0.35], taille: [0.09, 0.02], c: ['#ffffff', c, '#ff7a1e'], grav: 10, frein: 3, etire: 0.045 });
  const g = new T.Group(), fond = new T.Mesh(GEO_ETOILE, fxMat(c, 0.95, true)), coeur = new T.Mesh(GEO_ETOILE, fxMat('#ffffff', 1, true));
  fond.renderOrder = 8; coeur.renderOrder = 9; coeur.scale.setScalar(0.58); g.add(fond, coeur); g.position.copy(p); const rot = fxAlea() * Math.PI;
  fxVie(g, 0.18, (k) => { versCamera(g); g.rotateZ(rot + k * 0.9); g.scale.setScalar(Math.max(0.001, 0.8 * t * (k < 0.25 ? 0.4 + 0.8 * k / 0.25 : 1.2 * (1 - (k - 0.25) / 0.75)))); fond.material.opacity = 0.95 * (1 - k * 0.4); });
}
function lueur(p, couleur, taille, duree) { emettre(FX_LUM, 1, { x: p.x, y: p.y, z: p.z, vie: [(duree || 0.3) * 0.8, duree || 0.3], taille: [0.22 * taille, 0.02], c: ['#ffffff', couleur], a: 0.9 }); }
function poussiere(x, y, z, n, r, couleur) { /* un nuage de poussiere qui roule vers l'exterieur et monte */
  const c = couleur || '#e9dcc0';
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + fxAlea() * 0.6, v = r * fxEntre(1.6, 2.6);
    emettre(FX_FUM, 1, { x: x + Math.sin(a) * 0.2, y: y + 0.2, z: z + Math.cos(a) * 0.2, v: [Math.sin(a) * v, fxEntre(0.4, 1.2), Math.cos(a) * v], vie: [0.7, 1.1], taille: [0.5, 1.5 + r * 0.25], c: [c, c], a: 0.55, frein: 3.2, vrot: 1.5, entree: 0.1 }); }
}
function mottes(x, y, z, n, force) { /* des mottes de terre projetees qui retombent, rebondissent une fois et s'effacent ; de la terre fine autour */
  for (let i = 0; i < n; i++) {
    const m = new T.Mesh(GEO_MOTTE, MAT_MOTTES[i % 3]), a = fxAlea() * Math.PI * 2, v = (1.4 + fxAlea() * 2) * force, s = 0.6 + fxAlea() * 0.8; m.scale.setScalar(s); m.castShadow = true;
    let px = x + Math.sin(a) * 0.3, py = y + 0.1, pz = z + Math.cos(a) * 0.3, vx = Math.sin(a) * v, vz = Math.cos(a) * v, vy = (3 + fxAlea() * 2.5) * force, pose = false, t = 0; m.position.set(px, py, pz); scene.add(m);
    effets.push((dt) => { t += dt;
      if (!pose) { vy -= 14 * dt; px += vx * dt; pz += vz * dt; py += vy * dt; m.rotation.x += dt * 9; m.rotation.z += dt * 7; if (py <= y + 0.06 && vy < 0) { if (vy < -2) { vy = -vy * 0.35; vx *= 0.5; vz *= 0.5; py = y + 0.06; } else { pose = true; py = y + 0.06; } } }
      m.position.set(px, py, pz); if (t > 0.85) m.scale.setScalar(Math.max(0.001, s * (1 - (t - 0.85) / 0.3))); if (t >= 1.15) { jeter(m); return true; } });
  }
  emettre(FX_FUM, n * 2, { x, y: y + 0.1, z, r: 0.3, dv: 3.5 * force, haut: true, vie: [0.5, 0.9], taille: [0.12, 0.05], c: ['#6e4f33', '#8b6a45'], a: 0.9, grav: 9, sol: y + 0.03, rebond: 0.15 });
}
function solFendu(x, y, z, r, braise) { /* le sol se fend en etoile sous l'impact (des fentes rougeoyantes si braise), puis se referme */
  const g = new T.Group(), mf = fxMat(braise ? '#ff6a1e' : '#3d2a1b', 0.9), tache = new T.Mesh(GEO_DISQUE, fxMat('#5a4028', 0.4)); g.position.set(x, y + 0.06, z); tache.rotation.x = -Math.PI / 2; tache.scale.setScalar(r * 0.42); g.add(tache);
  const fentes = []; for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + (fxAlea() - 0.5) * 0.5, L = r * (0.45 + fxAlea() * 0.45), f = new T.Mesh(GEO_FENTE, mf); f.rotation.y = a; f.userData.L = L; g.add(f); fentes.push(f);
    if (i % 2 === 0) { const b = new T.Mesh(GEO_FENTE, mf), c = 0.55; b.position.set(Math.cos(a) * L * c, 0, -Math.sin(a) * L * c); b.rotation.y = a + (fxAlea() > 0.5 ? 0.6 : -0.6); b.userData.L = L * 0.4; g.add(b); fentes.push(b); } }
  fxVie(g, 1.6, (k) => { const pousse = Math.min(1, k / 0.07); fentes.forEach((f) => f.scale.set(Math.max(0.001, f.userData.L * pousse), 1, 1)); const o = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4; mf.opacity = 0.9 * o; tache.material.opacity = 0.4 * o; if (braise) mf.color.setRGB(1, 0.42 - 0.2 * k, 0.12 * (1 - k)); });
}
function croixSoin(x, y, z, n) { /* des croix vertes et des lueurs qui montent du perso soigne */
  const N = 1 + n; onde(x, y, z, 1.7, '#7fe08f', 0.5, 0.8);
  emettre(FX_LUM, 18, { x, y: y + 0.4, z, r: 0.6, v: [0, 1.4, 0], dv: 0.4, vie: [0.6, 1.0], taille: [0.16, 0.02], c: ['#e8ffd8', '#5fdc7a'], a: 0.9, frein: 1 });
  for (let i = 0; i < N; i++) {
    const g = new T.Group(), bord = new T.Mesh(GEO_CROIX, fxMat('#ffffff', 1, true)), coeur = new T.Mesh(GEO_CROIX, fxMat('#3fbf5f', 1, true)); bord.renderOrder = 8; coeur.renderOrder = 9; coeur.scale.setScalar(0.66); g.add(bord, coeur);
    const a = i / N * Math.PI * 2 + fxAlea() * 0.8, r = 0.45 + fxAlea() * 0.35, x0 = x + Math.sin(a) * r, z0 = z + Math.cos(a) * r, y0 = y + 0.5 + fxAlea() * 0.7, d = i * 0.09, D = 0.9 + d, tl = fxAlea() * 6;
    fxVie(g, D, (k) => { const kk = Math.max(0, (k * D - d) / 0.9); g.position.set(x0 + Math.sin(tl + kk * 6) * 0.06, y0 + kk * 1.1, z0); versCamera(g); g.scale.setScalar(kk <= 0 ? 0.001 : 0.62 * Math.min(1, kk / 0.18)); bord.material.opacity = coeur.material.opacity = kk > 0.6 ? Math.max(0, 1 - (kk - 0.6) / 0.4) : 1; });
  }
}
/* ---------- LE IOP ---------- */
/* le coup d'epee : une lame de lumiere qui balaie devant lui (un coup a gauche, un coup a droite), des etincelles qui jaillissent du fil */
const TONS_LAME = { '': [['#ffffff', '#ffe9a8'], ['#ffd27a', '#ff7a1e']], gel: [['#ffffff', '#d8f2ff'], ['#9fd8ff', '#3f8fd8']], fatal: [['#ffffff', '#ffd0c0'], ['#ff6a4a', '#b0180e']], feu: [['#ffffff', '#ffe9a8'], ['#ffb02e', '#e8541e']] };
function entailleIop(pp, pv, style) {
  const a = Math.atan2(pv.x - pp.x, pv.z - pp.z), sens = (entailleIop.n = (entailleIop.n || 0) + 1) % 2 ? 1 : -1, d = Math.hypot(pv.x - pp.x, pv.z - pp.z), taille = Math.min(1.8, Math.max(1.15, d * 0.85));
  const g = new T.Group(), penche = new T.Group(); g.position.set(pp.x, pp.y + 0.72, pp.z); g.rotation.y = a; penche.rotation.z = 0.22 * sens; g.add(penche);
  const ton = TONS_LAME[style || ''] || TONS_LAME[''], gel = style === 'gel';
  const lames = [[ton[0][0], ton[0][1], 1, 1.0, true], [ton[1][0], ton[1][1], 0.7, 1.14, false]].map(([c, b, o, s, plein]) => { const m = new T.Mesh(GEO_RUBAN, matRuban(c, b, o, plein)); m.rotation.x = Math.PI / 2; m.scale.set(s * taille * sens, s * taille, 1); m.renderOrder = plein ? 9 : 8; penche.add(m); return m; });
  const v = new T.Vector3(); let t = 0;
  fxVie(g, 0.26, (k) => { t = k; const e = 1 - Math.pow(1 - k, 2.2); lames.forEach((m) => { m.material.uniforms.uP.value = e * 1.5; m.material.uniforms.uA.value = (m === lames[0] ? 1 : 0.7) * (k < 0.7 ? 1 : (1 - k) / 0.3); });
    const u = Math.min(1, e * 1.5), an = -1.25 + 2.5 * u; if (u < 1 && fxAlea() < 0.9) { v.set(Math.sin(an) * 1.15 * sens, Math.cos(an) * 1.15, 0); lames[0].localToWorld(v); emettre(FX_VIF, 2, { x: v.x, y: v.y, z: v.z, dv: 3, vie: [0.15, 0.3], taille: [0.08, 0.02], c: ['#ffffff', gel ? '#9fd8ff' : style === 'fatal' ? '#ff5a3a' : '#ffc24a'], grav: gel ? 1 : 8, frein: 2, etire: gel ? 0 : 0.04 }); } });
}
/* ---------- LE CRA ---------- */
function decocher(de, vers) { const d = vers.clone().sub(de).normalize(), p = de.clone().addScaledVector(d, 0.35);
  emettre(FX_LUM, 1, { x: p.x, y: p.y, z: p.z, vie: [0.1, 0.12], taille: [0.9, 1.3], c: ['#ffffff', '#fff1c0'], a: 0.8, entree: 0.01 });
  emettre(FX_VIF, 6, { x: p.x, y: p.y, z: p.z, v: [d.x * 3, d.y * 3, d.z * 3], dv: 2, vie: [0.12, 0.22], taille: [0.06, 0.02], c: ['#ffffff', '#ffe08a'], etire: 0.04 }); }
function traineeFleche(p, feu) {
  if (feu === 'gel') { emettre(FX_VIF, 2, { x: p.x, y: p.y, z: p.z, r: 0.05, dv: 0.4, vie: [0.25, 0.4], taille: [0.09, 0.02], c: ['#ffffff', '#bfe6ff'], a: 1 }); emettre(FX_FUM, 1, { x: p.x, y: p.y, z: p.z, vie: [0.35, 0.5], taille: [0.15, 0.5], c: ['#eef9ff', '#dff2ff'], a: 0.4 }); return; }
  if (feu === 'fatal') { emettre(FX_LUM, 2, { x: p.x, y: p.y, z: p.z, vie: [0.18, 0.26], taille: [0.4, 0.1], c: ['#ffffff', '#ff3b2e'], a: 0.8 }); emettre(FX_VIF, 1, { x: p.x, y: p.y, z: p.z, dv: 1, vie: [0.2, 0.3], taille: [0.08, 0.02], c: ['#ffd0c0', '#d8180e'] }); return; }
  if (!feu) { emettre(FX_LUM, 1, { x: p.x, y: p.y, z: p.z, vie: [0.12, 0.18], taille: [0.16, 0.03], c: ['#ffffff', '#fff1c0'], a: 0.7 }); return; }
  emettre(FX_VIF, 3, { x: p.x, y: p.y, z: p.z, r: 0.06, v: [0, 0.8, 0], dv: 0.6, vie: [0.2, 0.35], taille: [0.3, 0.06], c: ['#fff3b0', '#ff8a1e', '#b0280e'], a: 0.95 });
  emettre(FX_LUM, 1, { x: p.x, y: p.y, z: p.z, vie: [0.15, 0.2], taille: [0.6, 0.2], c: ['#ffb84a', '#ff6a1e'], a: 0.6 });
  emettre(FX_FUM, 1, { x: p.x, y: p.y, z: p.z, v: [0, 0.9, 0], vie: [0.5, 0.8], taille: [0.2, 0.7], c: ['#5a4a42', '#8a8078'], a: 0.35, entree: 0.2 });
}
function flamme(p, haut) { emettre(FX_VIF, 1, { x: p.x, y: p.y, z: p.z, r: 0.08, v: [0, (haut || 0.8) * 2.2, 0], dv: 0.4, vie: [0.35, 0.55], taille: [0.42, 0.06], c: ['#fff3b0', '#ff8a1e', '#a8200a'], a: 0.95, frein: 1.2 }); }
function boule(x, y, z, r, couleurs, fumee) { /* une boule de feu : un coeur blanc qui jaillit, des flammes qui s'ouvrent, des braises, de la fumee qui monte */
  emettre(FX_LUM, 1, { x, y, z, vie: [0.16, 0.18], taille: [2.2 * r, 3.2 * r], c: ['#ffffff', couleurs[0]], a: 0.9, entree: 0.01 });
  emettre(FX_VIF, Math.round(26 * r), { x, y, z, r: 0.25 * r, dv: 3.2 * r, haut: true, vie: [0.35, 0.6], taille: [0.6 * r, 0.2 * r], c: ['#fff6c8'].concat(couleurs), a: 0.95, frein: 3.5, grav: -1.2 });
  emettre(FX_LUM, Math.round(10 * r), { x, y, z, r: 0.3 * r, dv: 2.5 * r, haut: true, vie: [0.3, 0.5], taille: [1.2 * r, 0.6 * r], c: [couleurs[0], couleurs[1] || couleurs[0]], a: 0.55, frein: 3, grav: -1 });
  emettre(FX_VIF, Math.round(16 * r), { x, y, z, r: 0.2, dv: 7 * r, haut: true, vie: [0.4, 0.9], taille: [0.07, 0.02], c: ['#fff1a8', '#ff8a1e'], grav: 7, frein: 1.4, etire: 0.03 });
  if (fumee !== false) emettre(FX_FUM, Math.round(9 * r), { x, y: y + 0.3, z, r: 0.4 * r, v: [0, 1.4, 0], dv: 1.2 * r, vie: [0.9, 1.5], taille: [0.6 * r, 2.0 * r], c: ['#4a3c34', '#9a908a'], a: 0.5, frein: 1.5, vrot: 1, entree: 0.18 });
}
function impactFleche(p, feu) {
  if (!feu) { etoileImpact(p, 0.6); return; }
  if (feu === 'gel') { givre(p); return; } /* (la glace gele : pas d'explosion, pas de tremblement) */
  if (feu === 'fatal') { etoileImpact(p, 0.9, '#ff3b2e'); return; }
  etoileImpact(p, 0.9, '#ff7a1e'); boule(p.x, p.y, p.z, 0.8, ['#ff9a2e', '#d8380e']); flashLumiere(p.x, p.y + 0.3, p.z, '#ff8a2e', 3, 6, 0.3); const ys = solA(p.x, p.z); onde(p.x, ys, p.z, 1.6, '#ff8a2e', 0.35, 0.8); brulure(p.x, ys, p.z, 0.8);
}
/* ---------- L'OSAMODAS ---------- */
/* la main droite du perso, la ou part le fouet */
function mainDe(mesh) {
  const u = mesh.userData;
  if (u.fouetMain && u.boutFouet) return u.boutFouet.getWorldPosition(new T.Vector3()); /* (le fouet tenu en main : la laniere part du bout du manche, 12-perso.js) */
  if (!u.paumes) { const bras = (u.membres || [])[3]; u.paumes = []; if (bras) bras.traverse((m) => { if (m.isMesh && /^(paume|doigts|main)/.test(nomP(m))) u.paumes.push(m); }); }
  if (!u.paumes.length) { const p = mesh.position.clone(); p.y += 0.7; return p; }
  return unionDe(u.paumes).getCenter(new T.Vector3());
}
/* le coup de fouet : la laniere part de la main, ondule et se deroule jusqu'a la cible, claque (un eclat, une onde), puis retombe */
function coupDeFouet(de, pv, perso, style) {
  const N = 26, geo = new T.TubeGeometry(new T.LineCurve3(de, pv), N, 0.05, 6, false), fouet = new T.Mesh(geo, new T.MeshBasicMaterial({ color: style === 'gel' ? '#8fc4ea' : style === 'fatal' ? '#7a1a12' : '#5a3a22', transparent: true, opacity: 1 })); scene.add(fouet);
  const P = geo.getAttribute('position'), base = Float32Array.from(P.array), dir = pv.clone().sub(de), L = dir.length(), cote = new T.Vector3(-dir.z, 0, dir.x).normalize(), tmp = new T.Vector3(), main = new T.Vector3();
  let t = 0, claque = false;
  effets.push((dt) => {
    t += dt; const k = Math.min(1, t / 0.13); if (perso) main.copy(mainDe(perso)); else main.copy(de);
    for (let i = 0; i < P.count; i++) { /* chaque anneau du tube : sa place le long du fouet, et l'onde qui court jusqu'au bout */
      tmp.set(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]); const s = Math.min(1, Math.max(0, tmp.clone().sub(de).dot(dir) / (L * L))), off = tmp.clone().sub(de.clone().addScaledVector(dir, s));
      const vis = s <= k, onde_ = Math.sin(s * Math.PI * 2.2 - t * 40) * 0.35 * s * (1 - k * 0.8), arc = Math.sin(s * Math.PI) * (0.9 * (1 - k) + 0.25);
      const q = main.clone().lerp(pv, vis ? s : k).addScaledVector(cote, vis ? onde_ : 0); q.y += vis ? arc : 0; q.addScaledVector(off, 1.25 - 0.95 * s); P.setXYZ(i, q.x, q.y, q.z); /* (le manche plus epais, la laniere qui s'affine jusqu'au bout) */
    }
    P.needsUpdate = true; geo.computeBoundingSphere();
    if (k >= 1 && !claque) { claque = true; if (style === 'gel') givre(pv); else { etoileImpact(pv, 0.8, style === 'fatal' ? '#ff3b2e' : '#fff3c4'); onde(pv.x, pv.y - 0.45, pv.z, 1.2, '#fff3c4', 0.25, 0.8); flashLumiere(pv.x, pv.y, pv.z, '#fff3c4', 2, 5, 0.18); } }
    fouet.material.opacity = t < 0.2 ? 1 : Math.max(0, 1 - (t - 0.2) / 0.2); if (t >= 0.4) { jeter(fouet); return true; }
  });
}
/* l'Invocation : un cercle magique violet qui s'allume au sol, une colonne de lumiere, des lueurs qui montent ; le Bouftou tombe du ciel (majInvoc) et retombe dans un choc */
function cercleInvocation(x, y, z, C) { /* (C : la teinte, le clair, le fonce ; violet par defaut, comme le Bouftou du perso) */
  const [cA, cB, cC] = C || ['#c39bff', '#c9a6ff', '#7a4ad8'], g = new T.Group(), mats = []; g.position.set(x, y + 0.07, z);
  const ajoute = (geo, o, rz) => { const m = new T.Mesh(geo, fxMat(cA, o)); m.material.blending = C ? T.NormalBlending : T.AdditiveBlending; /* (en lumiere, un bleu se perd sur le sol clair de l'Arene) */ m.rotation.x = -Math.PI / 2; if (rz) m.rotation.z = rz; mats.push([m.material, o]); g.add(m); return m; };
  ajoute(new T.RingGeometry(1.55, 1.68, 56), 0.95); ajoute(new T.RingGeometry(1.05, 1.11, 48), 0.85); ajoute(new T.RingGeometry(1.0, 1.07, 3), 0.85); ajoute(new T.RingGeometry(1.0, 1.07, 3), 0.85, Math.PI);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = ajoute(new T.PlaneGeometry(0.1, 0.22), 0.9); r.position.set(Math.cos(a) * 1.33, 0, Math.sin(a) * 1.33); r.rotation.z = -a; }
  const colonne = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 5, 28, 1, true), fxMat(cB, 0.35)); colonne.material.blending = T.AdditiveBlending; colonne.position.y = 2.5; g.add(colonne);
  fxVie(g, 1.3, (k) => { g.rotation.y = k * 1.6; const o = k < 0.1 ? k / 0.1 : k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1; mats.forEach(([m, o0]) => { m.opacity = o0 * o; }); g.scale.setScalar(0.6 + 0.4 * Math.min(1, k / 0.12));
    colonne.material.opacity = 0.35 * Math.max(0, 1 - k / 0.4); colonne.scale.set(Math.max(0.01, 1 - k / 0.4), 1, Math.max(0.01, 1 - k / 0.4)); });
  emettre(FX_LUM, 40, { x, y: y + 0.1, z, r: 1.5, plat: true, v: [0, 2.2, 0], dv: 0.5, vie: [0.6, 1.1], taille: [0.16, 0.03], c: ['#ffffff', cB, cC], a: 0.95, frein: 0.6 });
  flashLumiere(x, y + 1.5, z, C ? cA : '#b48cff', 2.5, 7, 0.5);
}
/* LE GEYSER (30/10/2026, « s'il y a un geyser qui est cense apparaitre, fais une animation de geyser sous mes pieds, au niveau du cercle », Mathieu) :
   une colonne d'eau jaillit du cercle en un dixieme de seconde, ruisselle vers le haut (des filets clairs qui montent, la colonne ondule), se dechire
   en gerbe a son sommet, puis s'affaisse ; la gerbe retombe en pluie sur tout le cercle ; au sol, une flaque, de l'ecume et deux anneaux d'eau */
const VS_GEYSER = `uniform float uT; varying vec2 vUv; void main() { vUv = uv; vec3 p = position; float a = atan(p.z, p.x);
  p.xz *= 1.0 + 0.1 * sin(p.y * 9.0 - uT * 13.0 + a * 3.0) + 0.06 * sin(a * 5.0 + uT * 7.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;
const FS_GEYSER = `uniform float uT, uA; uniform vec3 uC1, uC2; varying vec2 vUv; void main() {
  float y = vUv.y, n = sin(vUv.x * 43.98 + sin(y * 9.0 - uT * 14.0) * 1.6) * 0.5 + 0.5, m = sin(vUv.x * 25.13 - y * 5.0 + uT * 4.0) * 0.5 + 0.5, f = fract(y * 2.6 - uT * 3.8);
  float b = clamp(smoothstep(0.55, 1.0, n * 0.6 + m * 0.4) * 0.85 + smoothstep(0.82, 1.0, f) * 0.35, 0.0, 1.0);
  gl_FragColor = vec4(mix(uC1, uC2, b), uA * (0.5 + 0.5 * b) * smoothstep(0.0, 0.06, y) * (1.0 - smoothstep(0.78, 1.0, y))); }`;
const GEO_GEYSER = new T.CylinderGeometry(0.75, 0.5, 1, 28, 12, true); GEO_GEYSER.translate(0, 0.5, 0); partager(GEO_GEYSER);
function geyserEau(x, y, z, r, C) {
  const [cA, cB, cC] = C || ['#2aa8e0', '#bdf0ff', '#16608f'], H = 5.2, D = 1.5, g = new T.Group(); g.position.set(x, y, z);
  const tube = (rad, c1, c2, a, add) => { const u = { uT: { value: 0 }, uA: { value: a }, uC1: { value: new T.Color(c1) }, uC2: { value: new T.Color(c2) } };
    const m = new T.Mesh(GEO_GEYSER, new T.ShaderMaterial({ uniforms: u, vertexShader: VS_GEYSER, fragmentShader: FS_GEYSER, transparent: true, depthWrite: false, side: T.DoubleSide, blending: add ? T.AdditiveBlending : T.NormalBlending }));
    m.renderOrder = 5; m.userData = { u, rad, a }; g.add(m); return m; };
  const tubes = [tube(r * 0.8, cC, cB, 0.85), tube(r * 0.45, cA, '#ffffff', 0.6, true)];
  const flaque = new T.Mesh(GEO_DISQUE, fxMat(cA, 0.4)); flaque.rotation.x = -Math.PI / 2; flaque.position.y = 0.06; flaque.renderOrder = 3; g.add(flaque);
  let kp = 0, gerbe = 0;
  fxVie(g, D, (k) => {
    const e = 1 - Math.pow(1 - Math.min(1, k / 0.1), 3), tombe = k > 0.6 ? (k - 0.6) / 0.4 : 0, h = Math.max(0.01, H * e * (1 - 0.92 * tombe * tombe));
    tubes.forEach((m) => { const U = m.userData; U.u.uT.value = k * D; m.scale.set(U.rad * (1 + 0.2 * tombe), h, U.rad * (1 + 0.2 * tombe)); U.u.uA.value = U.a * (1 - tombe); });
    flaque.scale.setScalar(r * (0.55 + 0.45 * e)); flaque.material.opacity = 0.4 * (1 - k);
    gerbe += (k - kp) * D * (k < 0.65 ? 90 : 0); kp = k; const n = Math.floor(gerbe); gerbe -= n; /* (la gerbe du sommet : des gouttes qui partent en couronne et retombent sur le cercle) */
    if (n) emettre(FX_VIF, n, { x, y: y + h * 0.97, z, r: r * 0.3, v: [0, 1.5, 0], dv: r * 1.9, haut: true, vie: [0.7, 1.1], taille: [0.2, 0.07], c: ['#ffffff', cB, cA], a: 0.92, grav: 10, sol: y + 0.05, rebond: 0.15 });
  });
  onde(x, y, z, r * 1.25, cB, 0.5, 0.9); onde(x, y, z, r * 0.9, '#ffffff', 0.35, 0.7);
  emettre(FX_VIF, 40, { x, y: y + 0.1, z, r: r * 0.95, plat: true, v: [0, 3.2, 0], dv: 2.4, haut: true, vie: [0.4, 0.75], taille: [0.18, 0.06], c: ['#ffffff', cB, cA], a: 0.95, grav: 11, sol: y + 0.05 });
  emettre(FX_FUM, 16, { x, y: y + 0.25, z, r: r * 0.7, plat: true, dv: 1.6, haut: true, vie: [0.6, 1.1], taille: [0.6, 1.1], c: ['#f2fcff', cB], a: 0.45, grav: -0.8 });
  flashLumiere(x, y + 1.5, z, cA, 2, 6, 0.4);
}
function atterrirBouftou(x, y, z) { secousse(0.14, 0.25); onde(x, y, z, 2.4, '#d9c2ff', 0.35, 0.9); onde(x, y, z, 1.6, '#ffffff', 0.25, 0.7); poussiere(x, y, z, 10, 1.6); mottes(x, y, z, 6, 0.8); emettre(FX_LUM, 20, { x, y: y + 0.2, z, r: 0.6, dv: 4, haut: true, vie: [0.3, 0.6], taille: [0.1, 0.02], c: ['#ffffff', '#c9a6ff'], grav: 6, etire: 0.03 }); }
/* la Meute : un halo violet aux pieds de l'Osamodas tant que son Bouftou est en vie, des lueurs qui tournent autour de lui */
const HALO_MEUTE = new T.Mesh(new T.RingGeometry(0.62, 0.78, 40), new T.MeshBasicMaterial({ color: '#b48cff', transparent: true, opacity: 0.7, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
HALO_MEUTE.rotation.x = -Math.PI / 2; HALO_MEUTE.raycast = () => {}; HALO_MEUTE.visible = false; partager(HALO_MEUTE); scene.add(HALO_MEUTE);
function majMeute(s) {
  const oui = !!(paysanMesh && meuteActive()); HALO_MEUTE.visible = oui; if (!oui) return;
  const p = paysanMesh.position; HALO_MEUTE.position.set(p.x, p.y + 0.06, p.z); HALO_MEUTE.material.opacity = 0.5 + 0.25 * Math.sin(s * 5); HALO_MEUTE.scale.setScalar(1 + 0.06 * Math.sin(s * 5));
  majMeute.t = (majMeute.t || 0) + 1; if (majMeute.t % 4 === 0) emettre(FX_LUM, 1, { x: p.x + Math.sin(s * 5) * 0.7, y: p.y + 0.15, z: p.z + Math.cos(s * 5) * 0.7, v: [0, 1.1, 0], vie: [0.5, 0.8], taille: [0.12, 0.02], c: ['#ffffff', '#b48cff'], a: 0.9 });
}
/* ---------- LES ULTIS ---------- */
const GEO_PIC = new T.ConeGeometry(0.13, 0.75, 5); GEO_PIC.translate(0, 0.37, 0); partager(GEO_PIC);
/* le givre sur une cible : des eclats de glace qui tintent, une petite brume, des cristaux (rien qui tremble ni qui explose) */
function givre(p) {
  emettre(FX_VIF, 14, { x: p.x, y: p.y, z: p.z, r: 0.1, dv: 2.5, vie: [0.3, 0.55], taille: [0.1, 0.03], c: ['#ffffff', '#bfe6ff', '#7ab8e8'], grav: 5, frein: 2, etire: 0.02 });
  emettre(FX_FUM, 5, { x: p.x, y: p.y - 0.2, z: p.z, r: 0.3, dv: 0.6, vie: [0.6, 0.9], taille: [0.3, 1.0], c: ['#f2fbff', '#d6efff'], a: 0.5, frein: 2, entree: 0.12 });
  emettre(FX_LUM, 1, { x: p.x, y: p.y, z: p.z, vie: [0.2, 0.25], taille: [1.0, 1.4], c: ['#ffffff', '#9fd8ff'], a: 0.5 });
}
function explosionGel(x, y, z, r) { /* le sol gele : des pics de glace jaillissent, une brume de givre roule au sol, des cristaux de neige scintillent (pas de tremblement, pas d'explosion) */
  onde(x, y, z, r + 0.2, '#bfe6ff', 0.9, 0.55, true); onde(x, y, z, r * 0.8, '#ffffff', 0.7, 0.35);
  for (let i = 0; i < 13; i++) { const a = i / 13 * Math.PI * 2 + fxAlea() * 0.4, d = (i % 2 ? 0.45 : 0.85) * r * (0.7 + fxAlea() * 0.4), m = new T.Mesh(GEO_PIC, fxMat(i % 3 ? '#bfe6ff' : '#ffffff', 0.92)), h = 0.7 + fxAlea() * 0.9;
    m.position.set(x + Math.cos(a) * d, y, z + Math.sin(a) * d); m.rotation.set((fxAlea() - 0.5) * 0.5, 0, (fxAlea() - 0.5) * 0.5);
    fxVie(m, 1.2, (k) => { const s = k < 0.1 ? k / 0.1 : k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1; m.scale.set(Math.max(0.001, s), Math.max(0.001, s * h), Math.max(0.001, s)); m.material.opacity = 0.92 * Math.min(1, s + 0.2); }); }
  emettre(FX_FUM, 18, { x, y: y + 0.15, z, r: r * 0.4, plat: true, dv: r * 1.2, vie: [1.1, 1.6], taille: [0.6, 1.8], c: ['#f2fbff', '#cfeaff'], a: 0.6, frein: 2.5, vrot: 0.6, entree: 0.15 });
  emettre(FX_LUM, 36, { x, y: y + 0.5, z, r: r, v: [0, 0.6, 0], dv: 1, vie: [0.6, 1.2], taille: [0.1, 0.02], c: ['#ffffff', '#bfe6ff'], a: 1, frein: 1 });
}
function explosionZone(x, y, z, r, teinte) { /* une vraie explosion : boule de feu, onde, debris, poussiere, un champignon de fumee */
  secousse(0.2, 0.35); onde(x, y, z, r + 0.3, '#fff3c4', 0.3, 0.95); onde(x, y, z, r + 1, teinte, 0.55, 0.8); flashLumiere(x, y + 1, z, '#ffb24a', 4, 9, 0.45);
  boule(x, y + 0.5, z, 1.4, ['#ffb02e', '#e8541e', '#7a1e0a']); poussiere(x, y, z, 12, r); mottes(x, y, z, 10, 1.2); solFendu(x, y, z, r * 0.9, true); brulure(x, y, z, r * 0.8);
}
function coupFatal(p) { /* p : le milieu de la cible ; une colonne de lumiere tombe du ciel, le sol se fend, une gerbe d'or */
  secousse(0.28, 0.4); const y0 = p.y - 0.6; flashLumiere(p.x, p.y + 1.5, p.z, '#ffd75e', 4.5, 8, 0.5);
  /* la colonne : une gaine doree en melange normal (en additif, sur l'herbe claire, elle virait au rectangle blanc) et un coeur fin lumineux */
  const col = new T.Group(), gaine = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 8, 24, 1, true), fxMat('#ffc53a', 0.55)), coeur = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 8, 16, 1, true), fxMat('#fff6d0', 0.85));
  coeur.material.blending = T.AdditiveBlending; col.add(gaine, coeur); col.position.set(p.x, y0 + 4, p.z);
  fxVie(col, 0.55, (k) => { const s = Math.max(0.01, (1 - k) * (k < 0.1 ? k / 0.1 : 1)); col.scale.set(s, 1, s); gaine.material.opacity = 0.55 * (1 - k); coeur.material.opacity = 0.85 * (1 - k); });
  etoileImpact(p, 1.6, '#d9443a'); onde(p.x, y0, p.z, 2.6, '#d9443a', 0.45, 0.9); onde(p.x, y0, p.z, 1.6, '#ffd75e', 0.3, 0.95); solFendu(p.x, y0, p.z, 1.7, true);
  emettre(FX_LUM, 40, { x: p.x, y: y0 + 0.2, z: p.z, r: 0.5, v: [0, 3.5, 0], dv: 2.5, vie: [0.4, 0.9], taille: [0.12, 0.02], c: ['#ffffff', '#ffd75e', '#d9443a'], grav: 2, frein: 1, etire: 0.03 });
}
/* ---------- LES SORTS LEGENDAIRES ---------- */
function seisme(x, y, z, r) { /* le sol se fend en rougeoyant, des rochers jaillissent, un nuage de poussiere enfle */
  secousse(0.32, 0.5); solFendu(x, y, z, r * 1.25, true); mottes(x, y, z, 16, 1.4); poussiere(x, y, z, 16, r * 1.2, '#cdb89a'); onde(x, y, z, r + 0.5, '#a08a6a', 0.5, 0.9, true); flashLumiere(x, y + 0.5, z, '#ff7a2e', 2.5, 6, 0.4);
  emettre(FX_LUM, 24, { x, y: y + 0.1, z, r: r * 0.6, plat: true, v: [0, 2, 0], dv: 1.5, vie: [0.4, 0.8], taille: [0.12, 0.02], c: ['#fff1a8', '#ff7a1e'], grav: 4, etire: 0.03 });
}
/* le Souffle de feu : un jet de flammes crache par la bouche, en cone, sur tout ce qui est devant (0,7 s de flammes, de la fumee, des braises) */
function bouche(mesh) { const t = mesh.getObjectByName('tete'), p = t ? t.getWorldPosition(new T.Vector3()) : mesh.position.clone().add(new T.Vector3(0, 1.2, 0)); return p; }
function souffleDeFeu(de, a, portee) {
  const perso = paysanMesh, dx = Math.sin(a), dz = Math.cos(a); let t = 0;
  flashLumiere(de.x + dx, de.y + 1, de.z + dz, '#ff8a2e', 3.5, 8, 0.8); secousse(0.08, 0.6);
  effets.push((dt) => {
    t += dt; if (t > 0.75) { const y0 = solA(de.x, de.z); for (let k = 1; k <= 3; k++) brulure(de.x + dx * k * portee * 0.25, y0, de.z + dz * k * portee * 0.25, 0.5 + k * 0.3); return true; } const b = perso ? bouche(perso) : de.clone().add(new T.Vector3(0, 1.1, 0)); b.x += dx * 0.35; b.z += dz * 0.35; b.y -= 0.05;
    const n = t < 0.6 ? 9 : 2, v = portee * 1.85; /* (un cone serre de 35 degres, des flammes qui grossissent en s'eloignant et atteignent la portee) */
    for (let i = 0; i < n; i++) { const e = (fxAlea() - 0.5) * 0.6, ve = (fxAlea() - 0.45) * 0.22, ca = Math.cos(e), sa = Math.sin(e), vx = (dx * ca - dz * sa) * v * fxEntre(0.85, 1.1), vz = (dz * ca + dx * sa) * v * fxEntre(0.85, 1.1);
      emettre(FX_VIF, 1, { x: b.x, y: b.y, z: b.z, v: [vx, ve * v - 0.4, vz], vie: [0.42, 0.58], taille: [0.1, 1.05], c: ['#fffbe0', '#ffd04a', '#ff6a1e', '#8a1a06'], a: 0.9, frein: 0.9, grav: -1.4, vrot: 3, entree: 0.03 });
      if (i % 4 === 0) emettre(FX_LUM, 1, { x: b.x, y: b.y, z: b.z, v: [vx * 0.92, ve * v - 0.3, vz * 0.92], vie: [0.35, 0.5], taille: [0.15, 1.6], c: ['#ffb84a', '#ff5a1e'], a: 0.35, frein: 0.9, grav: -1.4 }); }
    if (fxAlea() < 0.6) emettre(FX_VIF, 1, { x: b.x, y: b.y, z: b.z, v: [dx * v * 0.8, 1, dz * v * 0.8], dv: 2, vie: [0.5, 0.9], taille: [0.07, 0.02], c: ['#fff1a8', '#ff8a1e'], grav: 3, etire: 0.03 });
    if (t > 0.12 && fxAlea() < 0.6) emettre(FX_FUM, 1, { x: b.x + dx * portee * 0.75, y: b.y, z: b.z + dz * portee * 0.75, r: 0.6, v: [dx * 2, 1.6, dz * 2], vie: [0.9, 1.4], taille: [0.7, 2.2], c: ['#3a2e28', '#7a706a'], a: 0.45, frein: 1.2, vrot: 1, entree: 0.25 });
    return false;
  });
}
const GEO_CAWOTTE = new T.ConeGeometry(0.16, 0.6, 7); GEO_CAWOTTE.rotateX(Math.PI); partager(GEO_CAWOTTE);
function pluieCawotte(x, y, z, retard) { /* une cawotte tombe du ciel en sifflant (une trainee), la pointe en bas, et eclate au sol */
  const g = new T.Group(), c = new T.Mesh(GEO_CAWOTTE, mat('#f08a24')), f = new T.Mesh(new T.ConeGeometry(0.12, 0.3, 5), mat('#5fae3a')); f.position.y = 0.42; g.add(c, f); g.visible = false; scene.add(g);
  let t = -(retard || 0), fini = false;
  effets.push((dt) => { t += dt; if (t < 0) return false; g.visible = true; const k = Math.min(1, t / 0.2); g.position.set(x, y + 0.3 + (1 - k * k) * 5, z); g.rotation.y = t * 9;
    emettre(FX_LUM, 2, { x, y: g.position.y + 0.3, z, r: 0.05, vie: [0.15, 0.25], taille: [0.25, 0.04], c: ['#ffffff', '#ffb46a'], a: 0.8 });
    if (k >= 1 && !fini) { fini = true; jeter(g); onde(x, y, z, 1.8, '#f08a24', 0.3, 0.9); etoileImpact(new T.Vector3(x, y + 0.4, z), 0.9, '#f08a24'); mottes(x, y, z, 6, 0.9); poussiere(x, y, z, 6, 1); secousse(0.08, 0.15); return true; } return false; });
}
/* ---------- LES PASSIFS DE CLASSE A L'ECRAN : la Peau de Iop brille quand il encaisse (un bouclier dore qui s'eclaire), le Cra souleve de la poussiere quand il court en combat ---------- */
const GEO_BOUCLIER = new T.IcosahedronGeometry(0.95, 1); partager(GEO_BOUCLIER);
function peauDeIop() {
  if (!paysanMesh || (peauDeIop.cd || 0) > performance.now()) return; peauDeIop.cd = performance.now() + 350;
  const g = new T.Group(), plein = new T.Mesh(GEO_BOUCLIER, fxMat('#ffd75e', 0.22)), fil = new T.Mesh(GEO_BOUCLIER, new T.MeshBasicMaterial({ color: '#ffe9a0', wireframe: true, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending })); g.add(plein, fil);
  fxVie(g, 0.32, (k) => { const p = paysanMesh.position; g.position.set(p.x, p.y + 0.8, p.z); g.scale.setScalar(0.85 + 0.25 * k); plein.material.opacity = 0.22 * (1 - k); fil.material.opacity = 0.85 * (1 - k); });
  const p = paysanMesh.position; emettre(FX_LUM, 8, { x: p.x, y: p.y + 0.8, z: p.z, r: 0.9, dv: 1, vie: [0.2, 0.4], taille: [0.1, 0.02], c: ['#ffffff', '#ffd75e'], a: 1 });
}
function majPassifs(dt) {
  if (!combat || !paysanMesh || classeDe() !== 'cra') { majPassifs.de = null; return; }
  const p = paysanMesh.position, de = majPassifs.de; majPassifs.de = p.clone(); if (!de) return;
  if (Math.hypot(p.x - de.x, p.z - de.z) < 0.01) return; majPassifs.t = (majPassifs.t || 0) + dt; if (majPassifs.t < 0.08) return; majPassifs.t = 0;
  emettre(FX_FUM, 1, { x: p.x, y: p.y + 0.12, z: p.z, v: [(de.x - p.x) / Math.max(dt, 0.001) * 0.15, 0.5, (de.z - p.z) / Math.max(dt, 0.001) * 0.15], vie: [0.45, 0.7], taille: [0.25, 0.8], c: ['#e9dcc0', '#e9dcc0'], a: 0.45, frein: 2, entree: 0.1 });
}
/* ---------- les images remanentes : des silhouettes dorees qui suivent le perso pendant un saut ou un elan (des copies du modele, sans contour, en lumiere) ---------- */
function fantomes(mesh, n, couleur, ecart) {
  const mats = Array.from({ length: n }, () => new T.MeshBasicMaterial({ color: couleur || '#ffc94a', transparent: true, opacity: 0.35, depthWrite: false })), L = [], hist = [];
  const ud = mesh.userData; mesh.userData = {}; /* (clone() recopie userData en JSON : les references aux bras et a l'epee seraient serialisees, tres lent) */
  try { for (let i = 0; i < n; i++) { const g = mesh.clone(true); g.traverse((m) => { if (m.isMesh) { if (m.material && m.material.side === T.BackSide) m.visible = false; else m.material = mats[i]; m.castShadow = false; m.receiveShadow = false; } }); g.children.forEach((c) => { if (c.isMesh && !c.name) c.visible = false; }); g.traverse((o) => { o.raycast = () => {}; }); g.visible = false; scene.add(g); L.push(g); } } finally { mesh.userData = ud; }
  const enfants = (o) => o.children.filter((c) => !(c.isMesh && !c.name));
  let t = 0;
  return {
    maj(dt, force) { t += dt; hist.unshift({ p: mesh.position.clone(), q: mesh.quaternion.clone(), e: enfants(mesh).map((c) => [c.position.clone(), c.quaternion.clone()]) }); if (hist.length > 40) hist.pop();
      L.forEach((g, i) => { const h = hist[Math.min(hist.length - 1, Math.round((i + 1) * (ecart || 2.2)))]; if (!h) return; g.visible = true; g.position.copy(h.p); g.quaternion.copy(h.q); enfants(g).forEach((c, j) => { if (h.e[j]) { c.position.copy(h.e[j][0]); c.quaternion.copy(h.e[j][1]); } }); });
      mats.forEach((m, i) => { m.opacity = 0.42 * (1 - i / (n + 0.5)) * (force == null ? 1 : force); }); },
    fin() { L.forEach((g) => scene.remove(g)); mats.forEach((m) => m.dispose()); } /* (les copies partagent les geometries du modele : on les retire sans rien liberer) */
  };
}
/* une brulure au sol, noire au coeur, qui s'efface lentement (apres les flammes) */
function brulure(x, y, z, r) {
  const m = new T.Mesh(GEO_DISQUE, new T.MeshBasicMaterial({ map: TEX_FUMEE, color: '#2a1a12', transparent: true, opacity: 0.55, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y + 0.05, z); m.scale.setScalar(r); m.renderOrder = 3;
  fxVie(m, 2.2, (k) => { m.material.opacity = 0.55 * (k < 0.7 ? 1 : (1 - k) / 0.3); });
}
/* ---------- LES ULTIS, CHACUN A SON TON (23/10/2026, « faut que ça reste en cohérence avec le type de sort qu'on envoie », Mathieu) ----------
   Cra, Fleches enflammees : une pluie de fleches de feu tombe dans la zone et s'embrase ; Fleche fatale : une grande fleche rouge transperce la cible.
   Osamodas, Ruee du troupeau : des Bouftous chargent a travers la zone (22-sorts.js) ; Morsure du Dragoeuf : deux machoires de feu se referment. */
function pluieFlechesFeu(x, y, z, r) {
  secousse(0.12, 0.5); flashLumiere(x, y + 1, z, '#ff8a2e', 3, 8, 0.6);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + fxAlea() * 0.6, d = i ? r * fxEntre(0.25, 0.85) : 0, X = x + Math.cos(a) * d, Z = z + Math.sin(a) * d, Y = y, retard = i * 0.045;
    const fl = boite(0.08, 0.08, 0.95, '#ff7a1e'), de = new T.Vector3(X - 1.2, Y + 5, Z - 1.2), vers = new T.Vector3(X, Y + 0.15, Z); fl.visible = false; scene.add(fl); fl.position.copy(de); fl.lookAt(vers);
    const pointe = new T.Mesh(new T.IcosahedronGeometry(0.15, 1), new T.MeshBasicMaterial({ color: '#ffcf3e' })); pointe.position.z = 0.5; fl.add(pointe); /* (la pointe en flammes, bien visible en tombant) */
    let t = -retard, fini = false;
    effets.push((dt) => { t += dt; if (t < 0) return false; fl.visible = true; const k = Math.min(1, t / 0.3); fl.position.lerpVectors(de, vers, k); traineeFleche(fl.position, 'feu');
      if (k >= 1 && !fini) { fini = true; jeter(fl); boule(X, Y + 0.3, Z, 0.55, ['#ffb02e', '#e8541e', '#7a1e0a'], i % 3 === 0); brulure(X, Y, Z, 0.7); onde(X, Y, Z, 1.2, '#ff8a2e', 0.3, 0.6); return true; } return false; }); /* (fumee sur une fleche sur trois : sinon un nuage noir couvre la zone) */
  }
  onde(x, y, z, r + 0.3, '#ff8a2e', 0.6, 0.6);
}
function impactFatal(p) { /* la fleche fatale : elle traverse la cible en laissant un sillage rouge, un eclat, une gerbe ecarlate */
  secousse(0.12, 0.22); flashLumiere(p.x, p.y + 0.5, p.z, '#ff3b2e', 3.5, 6, 0.35); etoileImpact(p, 1.5, '#ff3b2e');
  emettre(FX_VIF, 30, { x: p.x, y: p.y, z: p.z, r: 0.1, dv: 7, vie: [0.25, 0.5], taille: [0.1, 0.02], c: ['#ffffff', '#ff6a4a', '#8a0a06'], grav: 6, frein: 2, etire: 0.05 });
  emettre(FX_LUM, 10, { x: p.x, y: p.y, z: p.z, r: 0.3, dv: 1.5, vie: [0.3, 0.5], taille: [0.5, 1.2], c: ['#ff6a4a', '#b0180e'], a: 0.45 });
  onde(p.x, p.y - 0.5, p.z, 1.8, '#ff3b2e', 0.35, 0.8);
}
/* une machoire : un croissant de feu et cinq crocs blancs sur son bord interieur (celle du bas est la meme, retournee et decalee pour que les crocs s'emboitent) */
let GEO_MACHOIRE = null, GEO_CROCS = null;
function geoMachoire() {
  if (GEO_MACHOIRE) return; const L = 0.75, N = 16, dome = (x, h) => h * (1 - (x / L) * (x / L)), s = new T.Shape(); s.moveTo(-L, 0);
  for (let i = 1; i <= N; i++) { const x = -L + 2 * L * i / N; s.lineTo(x, dome(x, 0.5)); }
  for (let i = N - 1; i >= 0; i--) { const x = -L + 2 * L * i / N; s.lineTo(x, dome(x, 0.22)); }
  const crocs = [-0.5, -0.25, 0, 0.25, 0.5].map((x) => { const y = dome(x, 0.22), c = new T.Shape(); c.moveTo(x - 0.08, y + 0.03); c.lineTo(x + 0.08, y + 0.03); c.lineTo(x, y - 0.2); return c; });
  GEO_MACHOIRE = new T.ShapeGeometry(s); GEO_CROCS = new T.ShapeGeometry(crocs); partager(GEO_MACHOIRE); partager(GEO_CROCS);
}
function morsure(p) { /* la morsure du Dragoeuf : deux machoires de feu s'ouvrent devant la cible et claquent, des crocs de lumiere, une gerbe de braises */
  let t0 = 0; effets.push((dt) => { t0 += dt; if (t0 < 0.13) return false; /* (le fouet met 0,13 s a atteindre la cible : les machoires apparaissent au claquement) */
    geoMachoire(); const g = new T.Group(), mats = []; g.position.copy(p);
    const machoire = (bas) => { const j = new T.Group(); [[GEO_MACHOIRE, '#ff6a1e'], [GEO_CROCS, '#fff6e0']].forEach(([geo, c]) => { const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false, depthTest: false, side: T.DoubleSide })); m.renderOrder = 10; mats.push(m.material); j.add(m); });
      if (bas) { j.rotation.z = Math.PI; j.position.x = 0.125; } g.add(j); return j; }; /* (par-dessus tout : la cible les cacherait a moitie) */
    const haut = machoire(false), bas = machoire(true);
    fxVie(g, 0.45, (k) => { versCamera(g); const o = Math.min(1, k / 0.3), f = k < 0.3 ? 0 : Math.min(1, (k - 0.3) / 0.08), ec = (0.15 + 0.45 * o) * (1 - f);
      haut.position.y = ec; bas.position.y = -ec; g.scale.setScalar(0.75 + 0.35 * o); mats.forEach((m) => { m.opacity = k < 0.6 ? Math.min(1, k / 0.1) : (1 - k) / 0.4; });
      if (f >= 1 && !g.userData.croc) { g.userData.croc = true; secousse(0.12, 0.25); flashLumiere(p.x, p.y + 0.5, p.z, '#ff6a1e', 3, 6, 0.35); etoileImpact(p, 1.3, '#ff6a1e'); boule(p.x, p.y, p.z, 0.5, ['#ffb02e', '#e8541e'], false); } });
    return true; });
}
