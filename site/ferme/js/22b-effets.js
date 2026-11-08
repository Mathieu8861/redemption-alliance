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
/* LE COUP D'EPEE DU IOP, refait le 05/11/2026 dans le style du Tir percant (les videos d'effets de jeu de Mathieu) :
   1. le balayage (0,1 s) : une grosse lame en trois couches, le bord de couleur en melange normal (visible sur l'herbe claire), le coeur blanc, des traits de vitesse le long de l'arc ;
   2. l'impact : un micro-arret sur image, une petite secousse, un eclat en etoile, des epines de lumiere qui jaillissent de la cible, un anneau face a la camera ;
   3. la fin (0,3 s) : la lame s'amincit depuis l'interieur et se defait en etincelles ; une entaille lumineuse reste au sol et s'eteint */
const FS_TRANCHE = `uniform vec3 uCoeur, uBord; uniform float uP, uQ, uA, uE; varying vec2 vUv;
void main() { float u = vUv.x; if (u > uP) discard; float t = clamp((u - (uP - uQ)) / uQ, 0.0, 1.0); float bas = 1.0 - uE; if (vUv.y < bas) discard;
  float w = (vUv.y - bas) / max(uE, 0.001); vec3 c = mix(uBord, uCoeur, smoothstep(0.5, 0.95, w));
  gl_FragColor = vec4(c, uA * (0.3 + 0.7 * t) * smoothstep(0.0, 0.18, w)); }`;
function matTranche(coeur, bord, plein) { return new T.ShaderMaterial({ uniforms: { uCoeur: { value: new T.Color(coeur) }, uBord: { value: new T.Color(bord) }, uP: { value: 0 }, uQ: { value: 0.9 }, uA: { value: 1 }, uE: { value: 1 } },
  vertexShader: VS_RUBAN, fragmentShader: FS_TRANCHE, transparent: true, depthWrite: false, side: T.DoubleSide, blending: plein ? T.NormalBlending : T.AdditiveBlending }); }
const GEO_RUBAN_LARGE = geoRuban(1.3, 1.25, 0.62, 48), GEO_EPINE = (() => { const g = new T.ShapeGeometry(new T.Shape([new T.Vector2(0, -0.05), new T.Vector2(1, 0), new T.Vector2(0, 0.05)])); partager(g); return g; })();
const TONS_TRANCHE = { '': ['#ffffff', '#ffe27a', '#ff8a1e', '#ffb347'], gel: ['#ffffff', '#c8ecff', '#3f8fd8', '#9fd8ff'], fatal: ['#ffffff', '#ffc0a8', '#c8180e', '#ff6a4a'], feu: ['#ffffff', '#ffe27a', '#e8541e', '#ffb02e'] };
function epinesImpact(p, couleur, taille) { /* des epines de lumiere qui jaillissent du point touche, face a la camera */
  const g = new T.Group(), n = 7, rot = fxAlea() * Math.PI * 2; for (let k = 0; k < n; k++) { const m = new T.Mesh(GEO_EPINE, fxMat(k % 2 ? '#ffffff' : couleur, 1, true)); m.rotation.z = rot + k / n * Math.PI * 2 + (fxAlea() - 0.5) * 0.4; m.renderOrder = 10; m.userData.l = 0.6 + fxAlea() * 0.6; g.add(m); }
  g.position.copy(p); fxVie(g, 0.2, (k) => { versCamera(g); const e = 1 - Math.pow(1 - k, 2.5); g.children.forEach((m) => { m.scale.set(m.userData.l * taille * (0.3 + 0.9 * e), 1.4 * taille * (1 - k), 1); m.position.set(Math.cos(m.rotation.z) * 0.25 * e * taille, Math.sin(m.rotation.z) * 0.25 * e * taille, 0); m.material.opacity = 1 - k * k; }); });
}
function entailleIop(pp, pv, style) {
  const a = Math.atan2(pv.x - pp.x, pv.z - pp.z), sens = (entailleIop.n = (entailleIop.n || 0) + 1) % 2 ? 1 : -1, d = Math.hypot(pv.x - pp.x, pv.z - pp.z), taille = Math.min(1.55, Math.max(1.0, d * 0.74)); /* (05/11/2026 : « reduis un peu la taille du coup d'epee », Mathieu ; 1,25 a 1,9 avant) */
  const [cBlanc, cOr, cBord, cEclat] = TONS_TRANCHE[style || ''] || TONS_TRANCHE[''], gros = !!style;
  const g = new T.Group(), penche = new T.Group(); g.position.set(pp.x, pp.y + 0.72, pp.z); g.rotation.y = a; penche.rotation.z = 0.28 * sens; g.add(penche); g.traverse((o) => { o.raycast = () => {}; });
  /* les trois couches : le bord de couleur (plein, large), l'or, le coeur blanc (fin, devant) */
  const couches = [[cOr, cBord, 1.0, true, 9], [cBlanc, cOr, 0.97, false, 10], [cBlanc, cBlanc, 0.94, true, 11]].map(([co, bo, s, plein, ro], i) => {
    const m = new T.Mesh(GEO_RUBAN_LARGE, matTranche(co, bo, plein)); m.rotation.x = Math.PI / 2; m.scale.set(s * taille * sens, s * taille, 1); m.renderOrder = ro; m.userData.e0 = [1, 0.75, 0.32][i]; penche.add(m); return m; });
  const v = new T.Vector3(), w = new T.Vector3(); let touche = false;
  fxVie(g, 0.36, (k, obj) => { const T1 = 0.3, bal = Math.min(1, k / T1), e = 1 - Math.pow(1 - bal, 3), fin = Math.max(0, (k - T1) / (1 - T1));
    couches.forEach((m) => { const U = m.material.uniforms; U.uP.value = e * 1.12; U.uQ.value = 0.35 + 0.6 * e; U.uE.value = m.userData.e0 * (1 - Math.pow(fin, 0.8)); U.uA.value = fin > 0.85 ? (1 - fin) / 0.15 : 1; });
    obj.updateMatrixWorld(true); if (bal < 1) { const an = -1.3 + 2.6 * e; for (let s = 0; s < 2; s++) { v.set(Math.sin(an) * 1.2 * sens, Math.cos(an) * 1.2 * (0.86 + 0.14 * s), 0); couches[0].localToWorld(v); w.set(Math.cos(an) * sens, -Math.sin(an), 0).transformDirection(couches[0].matrixWorld);
        emettre(FX_VIF, 1, { x: v.x, y: v.y, z: v.z, v: [w.x * 9, w.y * 9, w.z * 9], dv: 0.4, vie: [0.08, 0.14], taille: [0.07, 0.02], c: ['#ffffff', cOr], frein: 6, etire: 0.06 }); } } /* (les traits de vitesse le long de l'arc) */
    else if (fin < 0.7 && fxAlea() < 0.8) { const an = -1.3 + 2.6 * fxAlea(); v.set(Math.sin(an) * 1.15 * sens, Math.cos(an) * 1.15, 0); couches[0].localToWorld(v);
      emettre(FX_VIF, 2, { x: v.x, y: v.y, z: v.z, dv: 1.6, vie: [0.2, 0.4], taille: [0.07, 0.015], c: [cOr, cBord], grav: 5, frein: 2 }); } /* (la lame se defait en etincelles) */
    if (!touche && bal >= 0.55) { touche = true; /* l'impact, au passage de la lame sur la cible */
      arretImage(gros ? 0.06 : 0.035); secousse(gros ? 0.07 : 0.035, 0.1); epinesImpact(pv, cEclat, gros ? 1.3 : 1); anneauSouffle(pv, camera.position.clone().sub(pv).normalize(), 0.2, gros ? 1.3 : 0.95, 0.22, cOr, 0.85);
      emettre(FX_VIF, gros ? 18 : 10, { x: pv.x, y: pv.y, z: pv.z, r: 0.08, dv: 7, vie: [0.15, 0.32], taille: [0.09, 0.02], c: ['#ffffff', cOr, cBord], grav: 9, frein: 3, etire: 0.05 }); } });
  const sol = new T.Mesh(GEO_LAME, fxMat(cBord, 0.8)), y = solA(pp.x + Math.sin(a) * 0.9, pp.z + Math.cos(a) * 0.9) + 0.04; sol.rotation.x = -Math.PI / 2; sol.renderOrder = 3; /* l'entaille au sol, devant lui */
  const gs = new T.Group(); gs.add(sol); gs.position.set(pp.x, y, pp.z); gs.rotation.y = a + Math.PI; sol.scale.set(taille * 0.75 * sens, taille * 0.75, 1); sol.position.z = 0.0;
  fxVie(gs, 0.6, (k) => { sol.material.opacity = k < 0.15 ? 0.8 * k / 0.15 : 0.8 * Math.pow(1 - (k - 0.15) / 0.85, 1.5); sol.material.color.lerpColors(new T.Color(cOr), new T.Color(cBord), Math.min(1, k * 2)); });
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
/* ---------- LE TIR PERCANT DU CRA (04/11/2026, d'apres une video d'effets de jeu, « j'adore le style, c'est ouf », Mathieu) : un faisceau au coeur blanc
   et aux bords orange qui suit la fleche comme une comete, un anneau de souffle au depart, des anneaux le long du trait, des etincelles, une brume violette,
   un trait de braise au sol qui s'eteint ; sur chaque monstre transperce, un eclat et un anneau ; l'ecran s'assombrit un instant pour que la lumiere ressorte ---------- */
const ARRET = { t: 0 }; /* l'image figee d'un gros coup : le temps passe 12 fois moins vite tant que ARRET.t > 0 (30-boucle.js) */
const arretImage = (d) => { ARRET.t = Math.max(ARRET.t, d); };
const GEO_FAISCEAU = (() => { const g = new T.PlaneGeometry(1, 1, 1, 24); g.translate(0, 0.5, 0); g.rotateX(Math.PI / 2); partager(g); return g; })(); /* (a plat, de z = 0 a 1 ; uv.y le long) */
const VS_FAISCEAU = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FS_FAISCEAU = `uniform vec3 uCoeur, uBord; uniform float uTete, uQueue, uA, uT; varying vec2 vUv;
void main() { float y = vUv.y; if (y > uTete) discard; float d = (uTete - y) / uQueue; float f = exp(-d * d * 0.7); float x = abs(vUv.x - 0.5) * 2.0;
  float coeur = smoothstep(0.45, 0.0, x), bord = smoothstep(1.0, 0.2, x), strie = 0.92 + 0.08 * sin(y * 9.0 - uT * 30.0), pointe = smoothstep(0.0, 0.012, uTete - y);
  gl_FragColor = vec4(mix(uBord, uCoeur, coeur) * (1.0 + coeur * 0.5), (bord * 0.6 + coeur * 0.9) * f * uA * strie * pointe); }`;
function matFaisceau(coeur, bord, additif) { return new T.ShaderMaterial({ uniforms: { uCoeur: { value: new T.Color(coeur) }, uBord: { value: new T.Color(bord) }, uTete: { value: 0 }, uQueue: { value: 0.4 }, uA: { value: 1 }, uT: { value: 0 } },
  vertexShader: VS_FAISCEAU, fragmentShader: FS_FAISCEAU, transparent: true, depthWrite: false, side: T.DoubleSide, blending: additif ? T.AdditiveBlending : T.NormalBlending }); }
function faisceau(de, fin, couches) { /* deux plans croises par couche, a plat et debout : il se voit de partout ; rend { g, maj(tete, a, t) } */
  const g = new T.Group(), mats = []; couches.forEach(([c, b, larg, add]) => { const m = matFaisceau(c, b, add); mats.push(m); [0, Math.PI / 2].forEach((rz) => { const p = new T.Mesh(GEO_FAISCEAU, m); p.scale.x = larg; p.rotation.z = rz; p.renderOrder = add ? 7 : 6; p.frustumCulled = false; g.add(p); }); });
  g.position.copy(de); g.lookAt(fin); g.scale.z = Math.max(0.01, de.distanceTo(fin)); g.traverse((o) => { o.raycast = () => {}; }); scene.add(g);
  return { g, maj: (tete, a, t) => mats.forEach((m) => { m.uniforms.uTete.value = tete; m.uniforms.uA.value = a; m.uniforms.uT.value = t; }) };
}
const GEO_ANNEAU_S = (() => { const g = new T.RingGeometry(0.84, 1, 40); partager(g); return g; })();
function anneauSouffle(p, dir, r0, r1, duree, couleur, o) { /* un anneau de lumiere en travers du trait, qui s'ouvre et s'efface */
  const m = new T.Mesh(GEO_ANNEAU_S, fxMat(couleur, o || 0.9)); m.renderOrder = 7; /* (opaque et clair : en lumiere additive, il disparaissait sur l'herbe et le ciel) */ m.position.copy(p); m.lookAt(p.clone().add(dir));
  fxVie(m, duree, (k) => { const e = 1 - Math.pow(1 - k, 3); m.scale.setScalar(r0 + (r1 - r0) * e); m.material.opacity = (o || 0.9) * (1 - k) * (1 - k * 0.5); });
}
const GEO_TRAIT_SOL = (() => { const g = new T.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2); partager(g); return g; })();
function braiseSol(x, z, a, long, duree) { /* un bout du trait de braise au sol : orange vif, puis il s'eteint en rougeoyant */
  const y = solA(x, z) + 0.05, g = new T.Group(); [['#ff8a2e', 0.32, 0.85], ['#fff1c0', 0.1, 1]].forEach(([c, l, o]) => { const m = new T.Mesh(GEO_TRAIT_SOL, fxMat(c, o)); m.scale.set(l, 1, long * 1.05); m.userData.o = o; m.renderOrder = 3; g.add(m); });
  g.position.set(x, y, z); g.rotation.y = a; fxVie(g, duree, (k) => { g.children.forEach((m, i) => { m.material.opacity = m.userData.o * (i ? Math.max(0, 1 - k * 3) : (1 - k) * (1 - k)); }); g.children[0].material.color.lerpColors(new T.Color('#ff8a2e'), new T.Color('#8a1e0a'), k); });
  if (fxAlea() < 0.6) emettre(FX_VIF, 1, { x, y: y + 0.05, z, r: 0.15, v: [0, 0.9, 0], dv: 0.5, vie: [0.5, 0.9], taille: [0.07, 0.02], c: ['#ffd36a', '#ff6a1e'], grav: -0.6, frein: 1 }); }
function desintegrer(o) { /* un monstre tue par le Tir percant part en braises et en cendres (04/11/2026, « ca desintegre tout », Mathieu) */
  const m = o.m; if (!m) return; m.updateMatrixWorld(true); const B = new T.Box3().setFromObject(m), c = B.getCenter(new T.Vector3()), s = B.getSize(new T.Vector3()), r = Math.max(0.4, Math.max(s.x, s.z) * 0.45);
  emettre(FX_VIF, 34, { x: c.x, y: c.y, z: c.z, r, v: [0, 1.2, 0], dv: 2.2, vie: [0.4, 0.9], taille: [0.1, 0.02], c: ['#ffffff', '#ffd36a', '#ff6a1e', '#8a1e0a'], a: 1, grav: -1.5, frein: 1.6, etire: 0.03 });
  emettre(FX_FUM, 10, { x: c.x, y: c.y, z: c.z, r: r * 0.8, v: [0, 1, 0], dv: 0.8, vie: [0.6, 1.1], taille: [0.4, 1.3], c: ['#3a2a24', '#6a5a52'], a: 0.45, frein: 1.2, entree: 0.1 });
  emettre(FX_LUM, 1, { x: c.x, y: c.y, z: c.z, vie: [0.14, 0.16], taille: [Math.max(s.x, s.y) * 1.4, Math.max(s.x, s.y) * 2], c: ['#ffffff', '#ffb347'], a: 0.9, entree: 0.01 });
  m.visible = false; if (o.ombreM) o.ombreM.visible = false;
}
let VOILE_FX = null;
function voileEcran(force, duree) { /* l'ecran s'assombrit un instant (les bords surtout) : la lumiere du sort ressort comme sur un fond sombre */
  if (!VOILE_FX) { VOILE_FX = document.createElement('div'); VOILE_FX.id = 'voile-fx'; const cv = rendu.domElement; cv.parentNode.insertBefore(VOILE_FX, cv.nextSibling); } /* (juste au-dessus de la 3D, sous l'interface) */
  const V = VOILE_FX; V.t = 0; V.d = duree; V.f = force; if (V.actif) return; V.actif = true;
  effets.push((dt) => { V.t += dt; const k = Math.min(1, V.t / V.d); V.style.opacity = String(V.f * (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85)); if (k >= 1) { V.style.opacity = '0'; V.actif = false; return true; } });
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
function geyserEau(x, y, z, r, C, petit) { /* (petit : les geysers de sa rage, six a la fois, moitie moins de gouttes) */
  const [cA, cB, cC] = C || ['#2aa8e0', '#bdf0ff', '#16608f'], H = 5.2, D = 1.5, g = new T.Group(); g.position.set(x, y, z);
  const tube = (rad, c1, c2, a, add) => { const u = { uT: { value: 0 }, uA: { value: a }, uC1: { value: new T.Color(c1) }, uC2: { value: new T.Color(c2) } };
    const m = new T.Mesh(GEO_GEYSER, new T.ShaderMaterial({ uniforms: u, vertexShader: VS_GEYSER, fragmentShader: FS_GEYSER, transparent: true, depthWrite: false, side: T.DoubleSide, blending: add ? T.AdditiveBlending : T.NormalBlending }));
    m.renderOrder = 5; m.userData = { u, rad, a }; g.add(m); return m; };
  const tubes = [tube(r * 0.8, cC, cB, 0.85), tube(r * 0.45, cA, '#ffffff', 0.6, true)];
  const flaque = new T.Mesh(GEO_DISQUE, fxMat(cA, 0.4)); flaque.rotation.x = -Math.PI / 2; flaque.position.y = 0.06; flaque.renderOrder = 3; g.add(flaque);
  let kp = 0, gerbe = 0; const q = petit ? 0.5 : 1;
  fxVie(g, D, (k) => {
    const e = 1 - Math.pow(1 - Math.min(1, k / 0.1), 3), tombe = k > 0.6 ? (k - 0.6) / 0.4 : 0, h = Math.max(0.01, H * e * (1 - 0.92 * tombe * tombe));
    tubes.forEach((m) => { const U = m.userData; U.u.uT.value = k * D; m.scale.set(U.rad * (1 + 0.2 * tombe), h, U.rad * (1 + 0.2 * tombe)); U.u.uA.value = U.a * (1 - tombe); });
    flaque.scale.setScalar(r * (0.55 + 0.45 * e)); flaque.material.opacity = 0.4 * (1 - k);
    gerbe += (k - kp) * D * (k < 0.65 ? 90 * q : 0); kp = k; const n = Math.floor(gerbe); gerbe -= n; /* (la gerbe du sommet : des gouttes qui partent en couronne et retombent sur le cercle) */
    if (n) emettre(FX_VIF, n, { x, y: y + h * 0.97, z, r: r * 0.3, v: [0, 1.5, 0], dv: r * 1.9, haut: true, vie: [0.7, 1.1], taille: [0.2, 0.07], c: ['#ffffff', cB, cA], a: 0.92, grav: 10, sol: y + 0.05, rebond: 0.15 });
  });
  onde(x, y, z, r * 1.25, cB, 0.5, 0.9); onde(x, y, z, r * 0.9, '#ffffff', 0.35, 0.7);
  emettre(FX_VIF, Math.round(40 * q), { x, y: y + 0.1, z, r: r * 0.95, plat: true, v: [0, 3.2, 0], dv: 2.4, haut: true, vie: [0.4, 0.75], taille: [0.18, 0.06], c: ['#ffffff', cB, cA], a: 0.95, grav: 11, sol: y + 0.05 });
  emettre(FX_FUM, Math.round(16 * q), { x, y: y + 0.25, z, r: r * 0.7, plat: true, dv: 1.6, haut: true, vie: [0.6, 1.1], taille: [0.6, 1.1], c: ['#f2fcff', cB], a: 0.45, grav: -0.8 });
  if (!petit) flashLumiere(x, y + 1.5, z, cA, 2, 6, 0.4);
}
/* LA GALVANISATION DE LA TORTUE CORAIL (30/10/2026, « l'onde bleue, faudrait revoir l'animation, on a l'impression que c'est un sort d'attaque », Mathieu) :
   plus d'onde qui s'elargit au sol. Un sort de soutien : la lumiere monte autour d'elle, un filet de lumiere part de son baton vers chaque alliee, et chez
   chacune trois fleches montent (le signe d'un bonus) ; son anneau prend la couleur de la tortue et une lumiere monte d'elle tant que dure le bonus (21-combat.js) */
const GEO_CHEVRON = new T.ShapeGeometry(new T.Shape([[-0.5, -0.1], [0, 0.4], [0.5, -0.1], [0.5, -0.45], [0, 0.05], [-0.5, -0.45]].map(([x, y]) => new T.Vector2(x * 0.42, y * 0.42)))); partager(GEO_CHEVRON);
function flechesBonus(x, y, z, couleur) { /* trois chevrons qui montent l'un apres l'autre et s'effacent, toujours face a la camera */
  for (let k = 0; k < 3; k++) { const m = new T.Mesh(GEO_CHEVRON, fxMat(couleur, 0, true)); m.renderOrder = 9; const d0 = k * 0.14, D = 0.85 + d0;
    fxVie(m, D, (t) => { const u = Math.max(0, (t * D - d0) / 0.85); m.position.set(x, y + 0.3 + u * 1.3 + k * 0.32, z); versCamera(m); m.material.opacity = u <= 0 ? 0 : 0.95 * (u < 0.15 ? u / 0.15 : 1 - Math.max(0, (u - 0.55) / 0.45)); }); }
}
function galvaniser(mo, allies, C) {
  const y = mo.m.position.y, h = mo.haut || 2.5, main = typeof mainSquelette === 'function' && mainSquelette(mo), de = main || new T.Vector3(mo.x, y + h * 0.75, mo.z);
  emettre(FX_LUM, 34, { x: mo.x, y: y + 0.2, z: mo.z, r: 1.3, plat: true, v: [0, 2.4, 0], dv: 0.4, vie: [0.7, 1.1], taille: [0.2, 0.04], c: ['#ffffff', C[1], C[0]], a: 0.9, frein: 0.3 });
  emettre(FX_LUM, 10, { x: de.x, y: de.y, z: de.z, r: 0.25, dv: 1.2, vie: [0.3, 0.5], taille: [0.35, 0.05], c: ['#ffffff', C[0]], a: 0.95 });
  flashLumiere(de.x, de.y, de.z, C[0], 1.5, 5, 0.45);
  allies.forEach((o) => { let t = 0; const D = 0.4 + Math.hypot(o.x - mo.x, o.z - mo.z) * 0.04; /* (le filet de lumiere : une tete qui file en arc vers l'alliee, sa trainee derriere elle) */
    effets.push((dt) => { t += dt; if (!combat || combat.fin || !o.m) return true; const k = Math.min(1, t / D), oy = o.m.position.y + (o.haut || 1.4) * 0.6;
      const px = de.x + (o.x - de.x) * k, py = de.y + (oy - de.y) * k + Math.sin(k * Math.PI) * 1.0, pz = de.z + (o.z - de.z) * k;
      emettre(FX_LUM, 2, { x: px, y: py, z: pz, r: 0.06, vie: [0.25, 0.4], taille: [0.3, 0.05], c: ['#ffffff', C[0]], a: 0.95 });
      if (k < 1) return false;
      flechesBonus(o.x, o.m.position.y + (o.haut || 1.4) * 0.55, o.z, C[0]);
      emettre(FX_LUM, 16, { x: o.x, y: o.m.position.y + 0.2, z: o.z, r: 0.6, plat: true, v: [0, 2, 0], dv: 0.3, vie: [0.5, 0.9], taille: [0.16, 0.03], c: ['#ffffff', C[1], C[0]], a: 0.9 }); return true; }); });
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
function souffleDeFeu(de, a, portee, o) { /* (o, 31/10/2026 : un monstre qui souffle, Crocabulia ; o.src, d'ou part le feu ; o.ouv, la demi-ouverture de son cone) */
  const perso = o ? null : paysanMesh, dx = Math.sin(a), dz = Math.cos(a), nb = o ? Math.max(3, Math.round(portee / 2.3)) : 3; let t = 0;
  flashLumiere(de.x + dx, de.y + 1, de.z + dz, '#ff8a2e', 3.5, 8, 0.8); secousse(0.08, 0.6);
  effets.push((dt) => {
    t += dt; if (t > 0.75) { const y0 = solA(de.x, de.z); for (let k = 1; k <= nb; k++) brulure(de.x + dx * k * portee / (nb + 1), y0, de.z + dz * k * portee / (nb + 1), 0.5 + 0.9 * k / nb); return true; } const b = o && o.src ? o.src() : perso ? bouche(perso) : de.clone().add(new T.Vector3(0, 1.1, 0)); b.x += dx * 0.35; b.z += dz * 0.35; b.y -= 0.05;
    const n = t < 0.6 ? 9 : 2, v = portee * 1.85; /* (un cone serre de 35 degres, des flammes qui grossissent en s'eloignant et atteignent la portee) */
    for (let i = 0; i < n; i++) { const e = (fxAlea() - 0.5) * (o && o.ouv ? o.ouv * 1.8 : 0.6), ve = (fxAlea() - 0.45) * 0.22, ca = Math.cos(e), sa = Math.sin(e), vx = (dx * ca - dz * sa) * v * fxEntre(0.85, 1.1), vz = (dz * ca + dx * sa) * v * fxEntre(0.85, 1.1);
      emettre(FX_VIF, 1, { x: b.x, y: b.y, z: b.z, v: [vx, ve * v - 0.4, vz], vie: [0.42, 0.58], taille: [0.1, 1.05], c: ['#fffbe0', '#ffd04a', '#ff6a1e', '#8a1a06'], a: 0.9, frein: 0.9, grav: -1.4, vrot: 3, entree: 0.03 });
      if (i % 4 === 0) emettre(FX_LUM, 1, { x: b.x, y: b.y, z: b.z, v: [vx * 0.92, ve * v - 0.3, vz * 0.92], vie: [0.35, 0.5], taille: [0.15, 1.6], c: ['#ffb84a', '#ff5a1e'], a: 0.35, frein: 0.9, grav: -1.4 }); }
    if (fxAlea() < 0.6) emettre(FX_VIF, 1, { x: b.x, y: b.y, z: b.z, v: [dx * v * 0.8, 1, dz * v * 0.8], dv: 2, vie: [0.5, 0.9], taille: [0.07, 0.02], c: ['#fff1a8', '#ff8a1e'], grav: 3, etire: 0.03 });
    if (t > 0.12 && fxAlea() < 0.6) emettre(FX_FUM, 1, { x: b.x + dx * portee * 0.75, y: b.y, z: b.z + dz * portee * 0.75, r: 0.6, v: [dx * 2, 1.6, dz * 2], vie: [0.9, 1.4], taille: [0.7, 2.2], c: ['#3a2e28', '#7a706a'], a: 0.45, frein: 1.2, vrot: 1, entree: 0.25 });
    return false;
  });
}
/* la Bourrasque d'Ark (31/10/2026) : sa fleche de vent file droit devant, une spirale d'air autour d'elle ; derriere, trois fronts de vent en arc
   s'ecartent dans le cone, des filets d'air filent, la poussiere et des feuilles sont balayees au sol. En bleu ciel et en melange normal : en blanc
   et en lumiere, le vent disparaissait sur le sable clair de l'Arene */
const GEO_FRONT_VENT = (() => { const g = new T.RingGeometry(0.84, 1, 28, 1, -0.5, 1); g.rotateX(-Math.PI / 2); partager(g); return g; })(); /* (un arc d'un radian, rescale a l'ouverture du cone) */
function bourrasqueVent(de, ySol, a, R, ouv) {
  const dx = Math.sin(a), dz = Math.cos(a), V = R / 0.32;
  { const f = projectileMonstre('fleche', { d: {} }); f.position.copy(de); f.rotation.y = a; let t = 0;
    fxVie(f, 0.34, (k) => { t = k * 0.34; const d = Math.min(R + 0.5, t * V * 1.1); f.position.set(de.x + dx * d, de.y - 0.15 * k, de.z + dz * d);
      for (let i = 0; i < 2; i++) { const s = t * 40 + i * Math.PI, r = 0.22; emettre(FX_VIF, 1, { x: f.position.x + Math.cos(a) * Math.cos(s) * r, y: f.position.y + Math.sin(s) * r, z: f.position.z - Math.sin(a) * Math.cos(s) * r, vie: [0.2, 0.3], taille: [0.13, 0.04], c: ['#ffffff', '#6fc4ea'], a: 0.95 }); } }); }
  for (let i = 0; i < 3; i++) { const m = new T.Mesh(GEO_FRONT_VENT, new T.MeshBasicMaterial({ color: i === 1 ? '#bfeaff' : '#6cc0e8', transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide }));
    m.renderOrder = 5; m.position.set(de.x, ySol + 0.35 + i * 0.35, de.z); m.rotation.y = a - Math.PI / 2; const t0 = i * 0.07;
    fxVie(m, 0.5, (k) => { const u = Math.max(0, (k * 0.5 - t0) / 0.38); if (u <= 0) { m.visible = false; return; } m.visible = true; const e = 1 - Math.pow(1 - Math.min(1, u), 2), r = 0.6 + (R - 0.4) * e;
      m.scale.set(r, 1, r * Math.sin(ouv) / Math.sin(0.5)); m.material.opacity = (u < 1 ? 0.8 * (1 - u * 0.75) : 0); }); }
  let t = 0; effets.push((dt) => { t += dt; if (t > 0.42) return true;
    for (let i = 0; i < 6; i++) { const e = (fxAlea() - 0.5) * 2 * ouv, ca = Math.cos(e), sa = Math.sin(e), vx = (dx * ca - dz * sa) * V * fxEntre(0.8, 1.15), vz = (dz * ca + dx * sa) * V * fxEntre(0.8, 1.15);
      emettre(FX_VIF, 1, { x: de.x + dx * 0.4, y: ySol + 0.3 + fxAlea() * 1.4, z: de.z + dz * 0.4, v: [vx, 0.3, vz], vie: [0.3, 0.42], taille: [0.09, 0.04], c: ['#ffffff', '#5fb8e4'], a: 1, frein: 1.2, etire: 0.035 }); }
    if (fxAlea() < 0.7) { const e = (fxAlea() - 0.5) * 2 * ouv, d = fxEntre(0.8, R * 0.9), ca = Math.cos(e), sa = Math.sin(e), ux = dx * ca - dz * sa, uz = dz * ca + dx * sa;
      emettre(FX_FUM, 1, { x: de.x + ux * d, y: ySol + 0.15, z: de.z + uz * d, v: [ux * 5, 0.6, uz * 5], vie: [0.5, 0.8], taille: [0.4, 1.3], c: ['#d6c39a', '#c4ad80'], a: 0.55, frein: 2.2, vrot: 1.5, entree: 0.1 }); }
    if (fxAlea() < 0.45) { const e = (fxAlea() - 0.5) * 2 * ouv, d = fxEntre(0.6, R * 0.7), ca = Math.cos(e), sa = Math.sin(e), ux = dx * ca - dz * sa, uz = dz * ca + dx * sa;
      emettre(FX_VIF, 1, { x: de.x + ux * d, y: ySol + 0.2, z: de.z + uz * d, v: [ux * 7, 2.2, uz * 7], dv: 1, vie: [0.5, 0.8], taille: [0.11, 0.08], c: ['#7cc24a', '#4f9a32'], a: 1, grav: 3, frein: 1.5, vrot: 9 }); }
    return false; });
  secousse(0.05, 0.2);
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
function bulleInvincible(duree) { /* l'ulti du Iop le rend invincible (30/10/2026) : une bulle doree qui le suit et tourne, le temps que ca dure */
  if (!paysanMesh) return;
  const g = new T.Group(), plein = new T.Mesh(GEO_BOUCLIER, fxMat('#ffd75e', 0.2)), fil = new T.Mesh(GEO_BOUCLIER, new T.MeshBasicMaterial({ color: '#fff1b8', wireframe: true, transparent: true, opacity: 0.7, depthWrite: false, blending: T.AdditiveBlending })); g.add(plein, fil);
  fxVie(g, duree, (k) => { const p = paysanMesh.position, f = k > 0.85 ? (1 - k) / 0.15 : Math.min(1, k * 8); g.position.set(p.x, p.y + 0.8, p.z); g.scale.setScalar(1.15 * (1 + 0.05 * Math.sin(k * duree * 12))); g.rotation.y = k * duree * 1.5; plein.material.opacity = 0.2 * f; fil.material.opacity = 0.7 * f; });
  const p = paysanMesh.position; emettre(FX_LUM, 14, { x: p.x, y: p.y + 0.8, z: p.z, r: 1.1, dv: 1.5, vie: [0.3, 0.6], taille: [0.12, 0.02], c: ['#ffffff', '#ffd75e'], a: 1 });
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

/* LES IMPACTS PAR ELEMENT (01/11/2026, par Discord : « j'aimerais retravailler les cercles d'impact en fonction des elements d'attaque », Mathieu, apres le vent
   au ras du sol d'Ebil) : au ras du sol, sans eclair blanc. impactElement(el, x, z, r) : 'vent' (rafaleVent, 21-combat.js), 'terre', 'feu', 'eau', 'poison', 'magie' */
function tacheSol(x, y, z, r, couleur, op, duree, bord) { /* une tache au sol qui apparait et s'efface (bord : un liseré de couleur qui s'eteint plus vite) */
  const g = new T.Group(), d = new T.Mesh(GEO_DISQUE, fxMat(couleur, op)); d.rotation.x = -Math.PI / 2; d.scale.setScalar(r); d.renderOrder = 2; g.add(d);
  let b = null; if (bord) { b = new T.Mesh(new T.RingGeometry(0.88, 1, 40), fxMat(bord, 0.9)); b.rotation.x = -Math.PI / 2; b.scale.setScalar(r); b.renderOrder = 3; g.add(b); }
  g.position.set(x, y + 0.05, z); return fxVie(g, duree, (k) => { const a = Math.min(1, k * duree / 0.12) * (k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4); d.material.opacity = op * a; if (b) b.material.opacity = 0.9 * a * Math.max(0, 1 - k * 1.6); });
}
/* (deuxieme version, le meme jour, par Discord : « je pense qu'on peut ameliorer un peu les details et le realisme des cercles qui representent un element
   naturel : feu, eau, terre, vent, fumee, poison, feuille », Mathieu) : de vraies pieces a la place des seuls grains : des langues de feu qui vacillent, une
   couronne d'eau qui jaillit et retombe, des eclats de roche qui rebondissent, des bulles qui gonflent et crevent, des feuilles qui virevoltent, de l'herbe qui pousse */
const texFlamme = (C) => texCanvas(128, (g, n) => { /* une langue de feu : coeur jaune pale, corps orange, pointe rouge qui s'efface (C : d'autres teintes) */
  const forme = (k) => { g.beginPath(); g.moveTo(n * 0.5, n * 0.04); g.bezierCurveTo(n * (0.5 + 0.2 * k), n * 0.35, n * (0.5 + 0.38 * k), n * 0.6, n * (0.5 + 0.3 * k), n * 0.82); g.bezierCurveTo(n * (0.5 + 0.22 * k), n * 0.98, n * (0.5 - 0.22 * k), n * 0.98, n * (0.5 - 0.3 * k), n * 0.82); g.bezierCurveTo(n * (0.5 - 0.38 * k), n * 0.6, n * (0.5 - 0.2 * k), n * 0.35, n * 0.5, n * 0.04); g.closePath(); };
  let d = g.createLinearGradient(0, n, 0, 0); C = C || ['rgba(255,190,70,1)', 'rgba(255,120,30,0.95)', 'rgba(220,60,20,0.6)', 'rgba(180,30,10,0)', 'rgba(255,250,210,1)', 'rgba(255,220,120,0.8)', 'rgba(255,200,80,0)'];
  d.addColorStop(0, C[0]); d.addColorStop(0.45, C[1]); d.addColorStop(0.8, C[2]); d.addColorStop(1, C[3]); g.fillStyle = d; forme(1); g.fill();
  d = g.createLinearGradient(0, n, 0, n * 0.3); d.addColorStop(0, C[4]); d.addColorStop(0.6, C[5]); d.addColorStop(1, C[6]); g.fillStyle = d; g.save(); g.translate(0, n * 0.12); forme(0.55); g.fill(); g.restore(); });
const TEX_FLAMME = texFlamme(), TEX_FLAMME_SPECTRE = texFlamme(['rgba(70,225,165,1)', 'rgba(40,190,140,0.95)', 'rgba(25,130,105,0.6)', 'rgba(15,90,80,0)', 'rgba(235,255,245,1)', 'rgba(160,250,215,0.8)', 'rgba(110,235,190,0)']); /* (le feu ; les flammes fantomes de l'esprit) */
const TEX_COURONNE = texCanvas(128, (g, n) => { /* la couronne d'eau : une paroi translucide aux pointes dechiquetees, plus blanche en haut */
  for (let x = 0; x < n; x += 2) { const h = n * (0.45 + 0.4 * Math.abs(Math.sin(x * 0.19)) * (0.6 + 0.4 * fxAlea())), d = g.createLinearGradient(0, n, 0, n - h); d.addColorStop(0, 'rgba(150,205,240,0.75)'); d.addColorStop(0.7, 'rgba(210,238,255,0.85)'); d.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = d; g.fillRect(x, n - h, 2, h); } });
const GEO_ECLAT = new T.DodecahedronGeometry(0.1, 0), GEO_BULLE = new T.SphereGeometry(1, 12, 9), GEO_BRIN = new T.ConeGeometry(0.035, 1, 4); GEO_BRIN.translate(0, 0.5, 0);
const GEO_FEUILLE = (() => { const s = new T.Shape(); s.moveTo(0, -0.1); s.quadraticCurveTo(0.065, -0.02, 0, 0.1); s.quadraticCurveTo(-0.065, -0.02, 0, -0.1); return new T.ShapeGeometry(s, 5); })();
partager(GEO_ECLAT, GEO_BULLE, GEO_BRIN, GEO_FEUILLE);
const MATS_ECLAT = ['#8a8070', '#6f6658', '#9a7a52', '#7a5a3a'].map((c) => mat(c)), MATS_FEUILLE = ['#5fae3a', '#7fc24f', '#4f8f2e', '#a8c84a'].map((c) => new T.MeshToonMaterial({ color: c, gradientMap: grad, side: T.DoubleSide })), MAT_BRIN = mat('#5fae3a');
const MATS_OS = ['#efe6cf', '#d8cfb8', '#c9bc98'].map((c) => mat(c)), MATS_BOIS = ['#7a5230', '#5a3a20', '#c8873a'].map((c) => mat(c));
partager(MATS_ECLAT, MATS_FEUILLE, MAT_BRIN, MATS_OS, MATS_BOIS);
/* LE VENT, CINQUIEME VERSION (02/11/2026, « les animations du Kanniboul Ebil, les tornades et l'espace de cercle au sol sont pas tres bien reussis, on peut faire
   bcp plus realiste », puis « l'animation au sol quand il jette sa lance, et sur un autre sort aussi », Mathieu ; captures : des anneaux empiles en ressort, des
   bras blancs et des boucles dessinees sur le sable). Plus de traits dessines : de la poussiere et de l'air, en nuanceur, avec un bruit periodique autour de l'axe
   (pas de couture) : des bandes etirees qui tournent et montent.
   - entonnoirVent(o) : une paroi de vent, un cylindre ouvert dont le nuanceur fait le profil (rb en bas, rh en haut), la torsion et les bandes ; dos puis face ;
   - solVent(r, o) : la poussiere couchee au sol en spirale qui s'enroule vers le centre, des filets d'air clairs ; uOuv : ouverte du centre (0) a tout le disque (1) ;
   - tornadeVent(R, H) : le coeur dense, le voile, la jupe de debris a son pied, le sol qui tourbillonne (assombri dessous), cailloux, brins et feuilles en orbite */
const GLSL_BRUIT_P = `float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float nP(vec2 p, float per) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); float a = mod(i.x, per), b = mod(i.x + 1.0, per);
    return mix(mix(h1(vec2(a, i.y)), h1(vec2(b, i.y)), f.x), mix(h1(vec2(a, i.y + 1.0)), h1(vec2(b, i.y + 1.0)), f.x), f.y); }
  float fbmP(vec2 p, float per) { float v = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { v += a * nP(p, per); p = p * 2.0 + vec2(0.0, 7.31); per *= 2.0; a *= 0.5; } return v; }`;
const VS_ENTONNOIR = `uniform float uT, uRb, uRh, uExp, uTord, uOnd; varying vec2 vUv; varying float vBord;
  void main() { vUv = uv; float y = position.y, a = atan(position.z, position.x);
    float r = mix(uRb, uRh, pow(y, uExp)) * (1.0 + uOnd * sin(a * 3.0 + y * 7.0 - uT * 8.0));
    vec3 p = vec3(cos(a) * r, y, sin(a) * r);
    p.x += (sin(y * 2.4 - uT * 1.8) * 0.2 + sin(y * 6.0 + uT * 2.6) * 0.05) * y * uTord; p.z += cos(y * 2.0 - uT * 1.5) * 0.16 * y * uTord;
    vec4 mv = modelViewMatrix * vec4(p, 1.0); vBord = 1.0 - abs(dot(normalize(normalMatrix * vec3(cos(a), 0.0, sin(a))), normalize(-mv.xyz)));
    gl_Position = projectionMatrix * mv; }`;
const FS_ENTONNOIR = `uniform float uT, uA, uVit, uMonte; uniform vec3 uC1, uC2; varying vec2 vUv; varying float vBord;
  ` + GLSL_BRUIT_P + `
  void main() { float y = vUv.y, u = vUv.x, s = uT * uVit;
    float d = fbmP(vec2(u * 5.0 - s * (1.25 - 0.45 * y) + y * 2.2, y * 6.0 - uT * uMonte), 5.0);
    float f = nP(vec2(u * 16.0 - s * 1.6 + y * 5.0, y * 26.0 - uT * uMonte * 2.0), 16.0);
    float b = smoothstep(0.4, 0.7, d * 0.8 + f * 0.3);
    float a = uA * (0.3 + 0.7 * b) * (0.45 + 0.55 * pow(vBord, 0.7)) * smoothstep(0.0, 0.08, y) * (1.0 - smoothstep(0.7, 1.0, y));
    gl_FragColor = vec4(mix(uC1, uC2, clamp(b * 0.75 + y * 0.3, 0.0, 1.0)), a); }`;
const VS_PLAT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FS_SOL_VENT = `uniform float uT, uA, uOuv, uOmbre; uniform vec3 uC1, uC2; varying vec2 vUv;
  ` + GLSL_BRUIT_P + `
  void main() { vec2 q = vUv * 2.0 - 1.0; float r = length(q); if (r >= 1.0) discard;
    float an = atan(q.y, q.x) / 6.28318 + 0.5, s = an + log(max(r, 0.03)) * 0.42 + uT * 0.55;
    float b = smoothstep(0.4, 0.75, fbmP(vec2(s * 6.0, r * 4.0 - uT * 1.2), 6.0));
    float fil = smoothstep(0.82, 1.0, nP(vec2(s * 20.0, r * 3.0 - uT), 20.0)) * smoothstep(0.12, 0.4, r);
    float bord = (1.0 - smoothstep(0.75, 1.0, r)) * (1.0 - smoothstep(uOuv - 0.22, uOuv, r)), ombre = uOmbre * (1.0 - smoothstep(0.0, 0.6, r));
    vec3 c = mix(mix(uC1, uC2, b), vec3(1.0), fil * 0.6) * (1.0 - ombre * 0.5);
    gl_FragColor = vec4(c, uA * bord * clamp(0.16 + 0.75 * b + 0.55 * fil + ombre * 0.6, 0.0, 1.0)); }`;
const GEO_ENTONNOIR = new T.CylinderGeometry(1, 1, 1, 40, 24, true), GEO_DISQUE_VENT = new T.CircleGeometry(1, 48); GEO_ENTONNOIR.translate(0, 0.5, 0); partager(GEO_ENTONNOIR, GEO_DISQUE_VENT);
function entonnoirVent(o) { /* o : rb, rh, exp, tord, ond, vit, monte, a, c1, c2, ordre ; la hauteur et l'echelle : celles du groupe (y de 0 a 1) ; ses uniformes : userData.u */
  const u = { uT: { value: fxAlea() * 20 }, uA: { value: o.a }, uRb: { value: o.rb }, uRh: { value: o.rh }, uExp: { value: o.exp || 1.4 }, uTord: { value: o.tord || 0 }, uOnd: { value: o.ond != null ? o.ond : 0.06 },
    uVit: { value: o.vit || 3 }, uMonte: { value: o.monte || 1 }, uC1: { value: new T.Color(o.c1) }, uC2: { value: new T.Color(o.c2) } };
  const g = new T.Group(); [T.BackSide, T.FrontSide].forEach((side, k) => { const m = new T.Mesh(GEO_ENTONNOIR, new T.ShaderMaterial({ uniforms: u, vertexShader: VS_ENTONNOIR, fragmentShader: FS_ENTONNOIR, transparent: true, depthWrite: false, side }));
    m.frustumCulled = false; m.renderOrder = (o.ordre || 6) + k; g.add(m); }); /* (le dos d'abord : la paroi du fond se voit a travers celle de devant) */
  g.userData.u = u; return sansClic(g);
}
function solVent(r, o = {}) { /* o : ombre (le sol assombri au centre, sous une tornade), c1, c2 */
  const u = { uT: { value: fxAlea() * 10 }, uA: { value: 0 }, uOuv: { value: 2 }, uOmbre: { value: o.ombre || 0 }, uC1: { value: new T.Color(o.c1 || '#75664f') }, uC2: { value: new T.Color(o.c2 || '#f3ead5') } }; /* (assez sombre et assez clair pour se voir sur le sable de l'Arene comme sur l'herbe) */
  const m = sansClic(new T.Mesh(GEO_DISQUE_VENT, new T.ShaderMaterial({ uniforms: u, vertexShader: VS_PLAT, fragmentShader: FS_SOL_VENT, transparent: true, depthWrite: false })));
  m.rotation.x = -Math.PI / 2; m.scale.setScalar(r); m.renderOrder = 3; m.userData.u = u; return m;
}
function tornadeVent(R, H, C) { /* userData.maj(dt, f) : f, sa force de 0 a 1 (elle nait et se dissipe) ; C : ses couleurs (la Tempete de feuilles du Cra, verte, 09/11/2026) */
  C = C || {}; const g = new T.Group(), coeur = entonnoirVent({ rb: R * 0.18, rh: R * 0.7, exp: 1.7, tord: 0.35, a: 0.9, vit: 4.4, monte: 1.6, c1: C.coeur1 || '#4f463b', c2: C.coeur2 || '#bfb19a', ordre: 7 }),
    voile = entonnoirVent({ rb: R * 0.28, rh: R * 1.35, exp: 1.8, tord: 0.45, a: 0.55, vit: 2.7, monte: 1.0, c1: C.voile1 || '#6e6352', c2: C.voile2 || '#d9d2c4', ordre: 9 }),
    jupe = entonnoirVent({ rb: R * 0.95, rh: R * 0.38, exp: 0.6, ond: 0.12, a: 0.75, vit: 5.2, monte: 2.4, c1: C.jupe1 || '#7a6448', c2: C.jupe2 || '#e3d0a8', ordre: 5 }), sol = solVent(R * 1.7, { ombre: 1, c1: C.sol1, c2: C.sol2 });
  coeur.scale.y = H; voile.scale.y = H * 1.04; sol.position.y = 0.04; g.add(sol, jupe, coeur, voile);
  const E = [coeur, voile, jupe].map((x) => [x.userData.u, x.userData.u.uA.value]), D = [];
  for (let i = 0; i < 18; i++) { const k = i % 3, m = sansClic(new T.Mesh(k === 0 ? GEO_FEUILLE : k === 1 ? GEO_BRIN : GEO_ECLAT, k === 0 ? MATS_FEUILLE[i % 4] : k === 1 ? MAT_BRIN : MATS_ECLAT[i % 4]));
    m.scale.setScalar(k === 0 ? fxEntre(1.1, 1.6) : k === 1 ? fxEntre(0.25, 0.4) : fxEntre(0.5, 1.1)); g.add(m); D.push({ m, a: fxAlea() * 6.28, h: fxAlea() * 0.85, v: fxEntre(5, 9), vy: fxEntre(0.25, 0.45), ph: fxAlea() * 6 }); } /* (les debris emportes) */
  let t = 0; g.userData.maj = (dt, f) => { t += dt; E.forEach(([u, a]) => { u.uT.value += dt; u.uA.value = a * f; }); sol.userData.u.uT.value += dt * 1.6; sol.userData.u.uA.value = 0.9 * f;
    D.forEach((d) => { d.a += dt * d.v * (1.2 - 0.5 * d.h); d.h += dt * d.vy; if (d.h > 0.85) d.h = 0.04; const r = R * (0.22 + 0.95 * Math.pow(d.h, 1.3)) * (1 + 0.12 * Math.sin(t * 3 + d.ph)); /* (ils montent en spirale, au bord de l'entonnoir) */
      d.m.position.set(Math.cos(d.a) * r, d.h * H, Math.sin(d.a) * r); d.m.rotation.set(t * 6 + d.ph, t * 4.5 + d.ph, t * 3); d.m.visible = f > 0.25; }); };
  return g;
}
const TEX_CRAQUELE = texCanvas(256, (g, n) => { /* la terre craquelee en plaques : de la terre brune aux bords irreguliers, des fentes sombres entre des plaques (Voronoi) */
  const c = n / 2, S = Array.from({ length: 22 }, (_, k) => { const a = k * 2.399, r = Math.sqrt((k + 0.5) / 22) * c * 0.95; return [c + Math.cos(a) * r + (fxAlea() - 0.5) * 14, c + Math.sin(a) * r + (fxAlea() - 0.5) * 14]; });
  const im = g.createImageData(n, n), D = im.data, plus = (x, y) => { let b = 1e9, b2 = 1e9; for (const [sx, sy] of S) { const d = (sx - x) ** 2 + (sy - y) ** 2; if (d < b) { b2 = b; b = d; } else if (d < b2) b2 = d; } return Math.sqrt(b2) - Math.sqrt(b); };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const dr = Math.hypot(x - c, y - c) / c, bord = 0.86 + 0.08 * Math.sin(Math.atan2(y - c, x - c) * 7), a = dr > bord ? Math.max(0, 1 - (dr - bord) / 0.07) : 1; if (a <= 0) continue;
    const f = plus(x, y), fente = f < 2.2, i = (y * n + x) * 4, v = 0.9 + 0.1 * Math.sin(x * 0.7) * Math.sin(y * 0.6); /* (une fente la ou deux plaques se touchent) */
    D[i] = fente ? 48 : 128 * v; D[i + 1] = fente ? 32 : 96 * v; D[i + 2] = fente ? 20 : 62 * v; D[i + 3] = 255 * a * (fente ? 1 : 0.72); }
  g.putImageData(im, 0, 0); });
const GEO_PLAQUE = new T.CylinderGeometry(1, 0.85, 1, 6); partager(GEO_PLAQUE);
const sansClic = (o) => { o.traverse((q) => { q.raycast = () => {}; }); return o; };
function langueFeu(x, y, z, h, vie, ph, tex) { /* une langue de feu qui vacille (un sprite pose par sa base, en couleur pleine : en lumiere additive, elle virait au blanc sur le sable) ; renvoie de quoi la deplacer */
  const s = sansClic(new T.Sprite(new T.SpriteMaterial({ map: tex || TEX_FLAMME, transparent: true, depthWrite: false }))); s.center.set(0.5, 0.04); s.position.set(x, y, z); s.renderOrder = 6; scene.add(s); let t = 0; /* (dessinee apres le lit de braises, qui la recouvrait) */
  const o = { s, x, z }; effets.push((dt) => { t += dt; const k = t / vie, mont = Math.min(1, t / 0.12), f = k < 0.65 ? 1 : Math.max(0, 1 - (k - 0.65) / 0.35);
    const hh = h * mont * f * (0.75 + 0.25 * Math.sin(t * 17 + ph) + 0.12 * Math.sin(t * 31 + ph * 2)); s.scale.set(hh * 0.62, Math.max(0.001, hh), 1); s.position.set(o.x + Math.sin(t * 9 + ph) * 0.03, y, o.z); s.material.opacity = Math.min(1, f * 1.2);
    if (k >= 1) { jeter(s); return true; } }); return o;
}
function eclatsRoche(x, y, z, n, force, M) { /* des eclats de roche qui jaillissent en tournant, rebondissent une fois et s'enfoncent (M : leurs matieres, des os pour l'esprit) */
  for (let i = 0; i < n; i++) { const m = sansClic(new T.Mesh(GEO_ECLAT, (M || MATS_ECLAT)[i % (M || MATS_ECLAT).length])), a = fxAlea() * Math.PI * 2, v = (1.5 + fxAlea() * 2.5) * force, s = 0.6 + fxAlea() * 1.0; m.scale.set(s, s * 0.8, s * 1.1); m.castShadow = true;
    m.position.set(x + Math.cos(a) * 0.2, y + 0.1, z + Math.sin(a) * 0.2); scene.add(m); let vx = Math.cos(a) * v, vz = Math.sin(a) * v, vy = 3 + fxAlea() * 3.5 * force, t = 0, rebond = 0; const wr = [fxEntre(-9, 9), fxEntre(-9, 9)];
    effets.push((dt) => { t += dt; if (rebond < 2) { vy -= 16 * dt; m.position.x += vx * dt; m.position.y += vy * dt; m.position.z += vz * dt; m.rotation.x += wr[0] * dt; m.rotation.z += wr[1] * dt;
        if (m.position.y < y + 0.05) { m.position.y = y + 0.05; rebond++; vy = Math.abs(vy) * 0.3; vx *= 0.45; vz *= 0.45; wr[0] *= 0.4; wr[1] *= 0.4; if (rebond === 1) emettre(FX_VIF, 2, { x: m.position.x, y: y + 0.05, z: m.position.z, dv: 0.8, haut: true, vie: [0.2, 0.3], taille: [0.08, 0.03], c: ['#a89070', '#8a7058'], grav: 8 }); } }
      if (t > 1.3) { m.position.y -= dt * 0.25; } if (t > 1.8) { jeter(m); return true; } }); }
}
function bullePoison(x, y, z, r, vie) { /* une bulle verte qui gonfle, luit, puis creve : un petit anneau et des gouttes */
  const b = sansClic(new T.Mesh(GEO_BULLE, new T.MeshBasicMaterial({ color: '#8fd84a', transparent: true, opacity: 0.75, depthWrite: false }))), reflet = sansClic(new T.Mesh(GEO_BULLE, new T.MeshBasicMaterial({ color: '#f2ffd8', transparent: true, opacity: 0.8, depthWrite: false })));
  reflet.scale.setScalar(0.28); reflet.position.set(-0.35, 0.45, 0.35); b.add(reflet); b.position.set(x, y, z); scene.add(b); let t = 0;
  effets.push((dt) => { t += dt; const k = Math.min(1, t / vie), s = r * (0.2 + 0.8 * Math.sin(k * Math.PI / 2)); b.scale.set(s, s * 0.85, s); b.position.y = y + s * 0.5;
    if (k >= 1) { jeter(b); onde(x, y + 0.02, z, r * 2.6, '#b8f07a', 0.25, 0.7, true); emettre(FX_VIF, 5, { x, y: y + r * 0.6, z, dv: 1.6, haut: true, vie: [0.25, 0.4], taille: [0.07, 0.02], c: ['#d8ff9a', '#6fae3a'], grav: 9 }); return true; } });
}
function feuillesVolantes(x, y, z, r, n, tourne) { /* des feuilles qui partent en tournoyant, flottent et retombent doucement (tourne : emportees en rond, le vent) */
  for (let i = 0; i < n; i++) { const m = sansClic(new T.Mesh(GEO_FEUILLE, MATS_FEUILLE[i % 4])), a = fxAlea() * Math.PI * 2, d = fxAlea() * r * 0.4, s = 0.9 + fxAlea() * 0.8; m.scale.setScalar(s); m.position.set(x + Math.cos(a) * d, y + 0.1, z + Math.sin(a) * d); scene.add(m);
    let va = a, ra = d, vy = 2 + fxAlea() * 2.2, t = 0; const vr = 2.5 + fxAlea() * 2.5, w = fxEntre(6, 11), ph = fxAlea() * 6;
    effets.push((dt) => { t += dt; vy -= 3.2 * dt; vy = Math.max(vy, -0.7); ra += dt * vr * (tourne ? 0.6 : 1) * Math.max(0.2, 1 - t); if (tourne) va += dt * 3.5 * Math.max(0.3, 1 - t * 0.6);
      m.position.set(x + Math.cos(va) * ra, Math.max(y + 0.03, m.position.y + vy * dt), z + Math.sin(va) * ra); m.rotation.set(Math.sin(t * w + ph) * 1.2, t * 4 + ph, Math.cos(t * w * 0.7 + ph) * 0.8); /* (elle vrille et se balance) */
      if (t > 1.9) { m.scale.setScalar(s * Math.max(0, 1 - (t - 1.9) / 0.4)); } if (t > 2.3) { jeter(m); return true; } }); }
}
/* LA TERRE (quatrieme version) : tout le cercle se craquelle en plaques ; les plaques se soulevent et basculent en vague du centre vers le bord, puis retombent ;
   des cailloux sautent, une poussiere brune couvre la zone. Ni etoile de fentes ni cratere : ca, c'est le marteau de Moon */
function impactTerre(x, z, r) {
  const y = solA(x, z); secousse(0.16, 0.45);
  const sol = sansClic(new T.Mesh(new T.CircleGeometry(r, 48), new T.MeshBasicMaterial({ map: TEX_CRAQUELE, transparent: true, opacity: 0, depthWrite: false }))); sol.rotation.x = -Math.PI / 2; sol.rotation.z = fxAlea() * 6; sol.position.set(x, y + 0.04, z); sol.renderOrder = 2; scene.add(sol);
  const P = []; for (let k = 0; k < 16; k++) { const a = k * 2.399 + fxAlea() * 0.4, d = Math.sqrt((k + 0.5) / 16) * r * 0.82, s = r * fxEntre(0.13, 0.19), m = sansClic(new T.Mesh(GEO_PLAQUE, MATS_ECLAT[k % 3 === 0 ? 3 : k % 2 ? 2 : 1]));
    m.scale.set(s, 0.14 * r / 2.2, s * fxEntre(0.8, 1.1)); m.rotation.y = fxAlea() * 6; m.position.set(x + Math.cos(a) * d, y - 0.12, z + Math.sin(a) * d); m.castShadow = true; scene.add(m);
    P.push({ m, d, rx: fxEntre(-0.45, 0.45), rz: fxEntre(-0.45, 0.45), h: fxEntre(0.12, 0.32) * r / 2.2 }); } /* (des plaques sur toute la zone, du centre au bord) */
  let t = 0, poussiere = 0; effets.push((dt) => { t += dt; const fin = Math.max(0, (t - 1.5) / 0.5); sol.material.opacity = Math.min(1, t / 0.1) * (1 - fin);
    P.forEach((p) => { const k = t - p.d / r * 0.35; if (k < 0) return; const up = Math.min(1, k / 0.14), retombe = k > 0.55 ? Math.min(1, (k - 0.55) / 0.3) : 0, h = p.h * up * (1 - 0.75 * retombe) * (1 - fin);
      p.m.position.y = y - 0.12 + 0.12 * up + h; p.m.rotation.x = p.rx * up * (1 - 0.6 * retombe); p.m.rotation.z = p.rz * up * (1 - 0.6 * retombe);
      if (!p.saute && up >= 1) { p.saute = true; emettre(FX_VIF, 3, { x: p.m.position.x, y: y + 0.1, z: p.m.position.z, dv: 2.2, haut: true, vie: [0.4, 0.6], taille: [0.08, 0.04], c: ['#7a5a3a', '#9a7a52'], grav: 12, sol: y + 0.03, rebond: 0.3 }); } }); /* (elles jaillissent en vague, basculent, retombent) */
    if ((poussiere += dt) > 0.05 && t < 1.0) { poussiere = 0; const a = fxAlea() * Math.PI * 2, d = Math.sqrt(fxAlea()) * r * 0.9; emettre(FX_FUM, 1, { x: x + Math.cos(a) * d, y: y + 0.2, z: z + Math.sin(a) * d, v: [Math.cos(a) * 0.6, 0.5, Math.sin(a) * 0.6], vie: [0.9, 1.4], taille: [0.6, 1.4], c: ['#a88a62', '#8a7052'], a: 0.6, frein: 1 }); } /* (la poussiere monte de toute la zone) */
    if (t > 2) { jeter(sol); P.forEach((p) => jeter(p.m)); return true; } });
  for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, v = 1.2 + fxAlea(); emettre(FX_FUM, 1, { x: x + Math.cos(a) * r * 0.85, y: y + 0.2, z: z + Math.sin(a) * r * 0.85, v: [Math.cos(a) * v, 0.3, Math.sin(a) * v], vie: [1.0, 1.4], taille: [0.6, 1.3], c: ['#b89a72', '#9a8262'], a: 0.55, frein: 1.4 }); } /* (et roule au bord) */
}
/* LE FEU (troisieme version, par Discord : « le feu, c'est un peu bizarre, ca fait gaziniere, et pourquoi il y a un impact de terre en dessous ? », Mathieu) : plus
   d'anneau de flammes ni de fentes. Tout le cercle prend feu, du centre vers le bord : des flammes de toutes tailles partout, plus hautes au coeur, sur un lit de braises
   qui rougeoie ; puis le feu retombe, les braises palissent, la fumee monte */
const TEX_BRAISES = texCanvas(256, (g, n) => { /* un sol calcine aux bords irreguliers, parseme de braises et de veines rougeoyantes */
  const c = n / 2, im = g.createImageData(n, n), D = im.data;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const dx = x - c, dy = y - c, dr = Math.hypot(dx, dy) / c, an = Math.atan2(dy, dx), bord = 0.84 + 0.07 * Math.sin(an * 5) + 0.04 * Math.sin(an * 13); if (dr > bord + 0.08) continue;
    const a = dr > bord ? 1 - (dr - bord) / 0.08 : 1, v = Math.sin(x * 0.21 + Math.sin(y * 0.13) * 3) * Math.sin(y * 0.19 + Math.sin(x * 0.11) * 3), braise = Math.max(0, v - 0.55) / 0.45, i = (y * n + x) * 4; /* (des veines qui serpentent) */
    D[i] = 40 + 215 * braise; D[i + 1] = 26 + 120 * braise * braise; D[i + 2] = 18 + 30 * braise * braise * braise; D[i + 3] = 255 * a * (0.8 + 0.2 * braise); }
  g.putImageData(im, 0, 0);
  for (let k = 0; k < 160; k++) { const a = fxAlea() * Math.PI * 2, d = Math.sqrt(fxAlea()) * c * 0.8, x = c + Math.cos(a) * d, y = c + Math.sin(a) * d, rr = 1 + fxAlea() * 2.5, gr = g.createRadialGradient(x, y, 0, x, y, rr * 2);
    gr.addColorStop(0, 'rgba(255,230,140,1)'); gr.addColorStop(0.5, 'rgba(255,120,30,0.8)'); gr.addColorStop(1, 'rgba(200,50,10,0)'); g.fillStyle = gr; g.fillRect(x - rr * 2, y - rr * 2, rr * 4, rr * 4); } }); /* (des braises) */
function impactFeu(x, z, r) {
  const y = solA(x, z); secousse(0.1, 0.2); flashLumiere(x, y + 0.6, z, '#ff8a3a', 2.4, 7, 0.9);
  const lit = sansClic(new T.Mesh(new T.CircleGeometry(r, 48), new T.MeshBasicMaterial({ map: TEX_BRAISES, transparent: true, opacity: 0, depthWrite: false }))); lit.rotation.x = -Math.PI / 2; lit.rotation.z = fxAlea() * 6; lit.position.set(x, y + 0.04, z); lit.renderOrder = 2; scene.add(lit);
  for (let k = 0; k < 26; k++) { const a = k * 2.399 + fxAlea() * 0.5, d = Math.sqrt((k + 0.5) / 26) * r * 0.85, cx = x + Math.cos(a) * d, cz = z + Math.sin(a) * d, h = r * (0.65 - 0.3 * d / r) * fxEntre(0.7, 1.2), retard = d / r * 0.3;
    let tw = 0; effets.push((dt) => { tw += dt; if (tw < retard) return false; langueFeu(cx, y, cz, h, fxEntre(1.1, 1.7) - retard * 0.5, fxAlea() * 6); return true; }); } /* (des flammes sur tout le cercle, qui prennent du centre vers le bord) */
  let t = 0, tic = 0; effets.push((dt) => { t += dt; const prend = Math.min(1, t / 0.3), palit = t > 1.4 ? Math.min(1, (t - 1.4) / 0.9) : 0; lit.material.opacity = prend * (1 - palit); lit.material.color.setRGB(1, 1 - 0.35 * palit, 1 - 0.45 * palit); /* (les braises palissent) */
    if ((tic += dt) > 0.04 && t < 1.8) { tic = 0; const a = fxAlea() * Math.PI * 2, d = Math.sqrt(fxAlea()) * r * 0.85 * prend;
      emettre(FX_LUM, 1, { x: x + Math.cos(a) * d, y: y + 0.2, z: z + Math.sin(a) * d, v: [fxEntre(-0.4, 0.4), fxEntre(1.2, 2.2), fxEntre(-0.4, 0.4)], vie: [0.7, 1.2], taille: [0.07, 0.01], c: ['#ffe08a', '#ff6a1e'], frein: 0.4 }); /* (braises qui montent) */
      if (fxAlea() < 0.4) emettre(FX_FUM, 1, { x: x + Math.cos(a) * d, y: y + 0.8, z: z + Math.sin(a) * d, v: [0, 1.1, 0], vie: [1.1, 1.6], taille: [0.6, 1.6], c: ['#5a4a40', '#2e2622'], a: 0.5 }); } /* (fumee sombre) */
    if (t > 2.3) { jeter(lit); return true; } });
}
function impactEau(x, z, r) { /* une couronne d'eau jaillit et retombe, une colonne au centre, des gouttes qui rebondissent, des rides, le sol mouille qui brille */
  const y = solA(x, z); secousse(0.08, 0.15); tacheSol(x, y, z, r * 0.9, '#2f6f9a', 0.5, 2.2, '#7fc8f0');
  const cour = sansClic(new T.Mesh(new T.CylinderGeometry(1, 0.85, 1, 40, 1, true), new T.MeshBasicMaterial({ map: TEX_COURONNE, transparent: true, depthWrite: false, side: T.DoubleSide }))); cour.position.set(x, y, z); scene.add(cour);
  let t = 0; effets.push((dt) => { t += dt; const k = Math.min(1, t / 0.75), h = 0.9 * Math.sin(Math.min(1, k * 1.25) * Math.PI) * r * 0.45, rr = r * (0.25 + 0.5 * Math.sqrt(k)); cour.scale.set(rr, Math.max(0.001, h), rr); cour.position.y = y + h / 2; cour.material.opacity = 1 - k * k;
    if (k >= 1) { jeter(cour); return true; } }); /* (la couronne monte puis s'effondre en s'ouvrant) */
  for (let i = 0; i < 34; i++) { const a = i / 34 * Math.PI * 2 + fxAlea() * 0.2, v = 1.6 + fxAlea() * 1.2; emettre(FX_VIF, 1, { x: x + Math.cos(a) * r * 0.3, y: y + 0.2, z: z + Math.sin(a) * r * 0.3, v: [Math.cos(a) * v, 3.2 + fxAlea() * 1.6, Math.sin(a) * v], vie: [0.7, 1.0], taille: [0.11, 0.05], c: ['#ffffff', '#7fc8f0'], grav: 10, sol: y + 0.04, rebond: 0.25 }); }
  let tc = 0, kr = 0; effets.push((dt) => { tc += dt; if (tc > 0.18 && tc < 0.45) emettre(FX_VIF, 2, { x, y: y + 0.1, z, r: 0.06, v: [0, 4.2, 0], dv: 0.5, vie: [0.4, 0.55], taille: [0.12, 0.05], c: ['#ffffff', '#9fd6f5'], grav: 11 }); /* (la colonne du centre) */
    while (kr < 4 && tc >= kr * 0.14) { onde(x, y, z, r * (0.7 + kr * 0.25), kr % 2 ? '#ffffff' : '#4f9fd0', 0.7, kr % 2 ? 0.5 : 0.8, true); kr++; }
    if (tc < 2 && fxAlea() < dt * 10) { const a = fxAlea() * Math.PI * 2, d = fxAlea() * r * 0.8; emettre(FX_LUM, 1, { x: x + Math.cos(a) * d, y: y + 0.07, z: z + Math.sin(a) * d, vie: [0.15, 0.3], taille: [0.12, 0.02], c: ['#ffffff', '#bfe6ff'], a: 0.9 }); } /* (le sol mouille brille) */
    return tc > 2; });
  emettre(FX_FUM, 8, { x, y: y + 0.3, z, r: r * 0.5, v: [0, 0.5, 0], vie: [0.7, 1.1], taille: [0.6, 1.3], c: ['#eef8ff', '#cfe8f5'], a: 0.4 });
}
function impactFumee(x, z, r) { /* une nappe de fumee epaisse qui roule au ras du sol en tournant, plus sombre au coeur, et s'eleve lentement */
  const y = solA(x, z); tacheSol(x, y, z, r * 0.7, '#4a4440', 0.35, 2.2); onde(x, y, z, r * 1.1, '#8a8480', 0.4, 0.6, true);
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, v = 1.8 + fxAlea() * 1.4; emettre(FX_FUM, 1, { x: x + Math.cos(a) * 0.3, y: y + 0.3, z: z + Math.sin(a) * 0.3, v: [Math.cos(a) * v - Math.sin(a) * 0.8, 0.2, Math.sin(a) * v + Math.cos(a) * 0.8], vie: [1.4, 2.2], taille: [0.8, 1.9], c: [i % 3 ? '#9a948e' : '#b8b2ac', '#6a6460'], a: 0.75, frein: 1.3 }); } /* (elle roule et tourne) */
  let t = 0; effets.push((dt) => { t += dt; if (fxAlea() < dt * 14) emettre(FX_FUM, 1, { x: x + fxEntre(-0.4, 0.4), y: y + 0.4, z: z + fxEntre(-0.4, 0.4), v: [fxEntre(-0.3, 0.3), 0.7, fxEntre(-0.3, 0.3)], vie: [1.4, 2.0], taille: [0.9, 2.0], c: ['#5a5450', '#3e3a36'], a: 0.6 }); return t > 1.2; }); /* (le coeur sombre s'eleve) */
}
function impactPoison(x, z, r) { /* une flaque verte qui bouillonne : des bulles gonflent et crevent, des vapeurs vertes ondulent en montant */
  const y = solA(x, z); tacheSol(x, y, z, r * 0.85, '#3f8a2a', 0.78, 2.9, '#9fe060'); [[0.4, 0.3, 0.35], [-0.35, 0.25, 0.3], [0.1, -0.4, 0.32]].forEach(([dx, dz, s]) => tacheSol(x + dx * r, y + 0.004, z + dz * r, r * s, '#5fae3a', 0.6, 2.9)); /* (une flaque aux bords irreguliers) */
  onde(x, y, z, r * 1.1, '#7ad04a', 0.5, 0.7, true); emettre(FX_VIF, 16, { x, y: y + 0.1, z, r: r * 0.3, dv: 3, haut: true, vie: [0.4, 0.6], taille: [0.11, 0.05], c: ['#b8f07a', '#5f9a2e'], grav: 9, sol: y + 0.03, rebond: 0.2 });
  let t = 0, tic = 0; effets.push((dt) => { t += dt; if ((tic += dt) > 0.09 && t < 2.3) { tic = 0; const a = fxAlea() * Math.PI * 2, d = fxAlea() * r * 0.7; bullePoison(x + Math.cos(a) * d, y + 0.03, z + Math.sin(a) * d, fxEntre(0.05, 0.13), fxEntre(0.3, 0.7)); }
    if (fxAlea() < dt * 9 && t < 2.2) { const a = fxAlea() * Math.PI * 2, d = fxAlea() * r * 0.6, s = fxAlea() < 0.5 ? -1 : 1; emettre(FX_FUM, 1, { x: x + Math.cos(a) * d, y: y + 0.2, z: z + Math.sin(a) * d, v: [s * 0.5, 0.8, -s * 0.3], vie: [1.0, 1.6], taille: [0.4, 1.1], c: ['#a8e070', '#5f9a2e'], a: 0.45 }); } /* (des vapeurs qui ondulent) */
    return t > 2.3; });
}
function impactFeuille(x, z, r) { /* la nature : un anneau d'herbes qui jaillissent du sol et ondulent, des feuilles qui partent en tournoyant, des petales */
  const y = solA(x, z); tacheSol(x, y, z, r * 0.85, '#4f9a3a', 0.45, 2.2); onde(x, y, z, r * 1.1, '#7fc24f', 0.45, 0.6, true); feuillesVolantes(x, y, z, r, 18, false);
  const brins = []; for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2 + fxAlea() * 0.15, d = r * fxEntre(0.55, 0.9), m = sansClic(new T.Mesh(GEO_BRIN, MAT_BRIN)); m.position.set(x + Math.cos(a) * d, y, z + Math.sin(a) * d); m.scale.set(1, 0.001, 1); scene.add(m); brins.push({ m, h: fxEntre(0.25, 0.5), ph: fxAlea() * 6, d0: fxAlea() * 0.2, a }); }
  let t = 0; effets.push((dt) => { t += dt; brins.forEach((b) => { const k = Math.max(0, t - b.d0), up = Math.min(1, k / 0.25), f = t < 1.5 ? 1 : Math.max(0, 1 - (t - 1.5) / 0.4); b.m.scale.set(1, Math.max(0.001, b.h * up * f), 1); b.m.rotation.set(Math.sin(t * 5 + b.ph) * 0.25 * Math.cos(b.a), 0, Math.sin(t * 5 + b.ph) * 0.25 * Math.sin(b.a)); }); /* (ils jaillissent, ondulent, puis rentrent) */
    if (t > 1.9) { brins.forEach((b) => jeter(b.m)); return true; } });
  emettre(FX_VIF, 14, { x, y: y + 0.2, z, r: r * 0.4, dv: 2.2, haut: true, vie: [0.8, 1.2], taille: [0.07, 0.05], c: ['#f7c6d6', '#fbe3ec'], grav: 2, frein: 1 }); /* (des petales) */
}
function impactMagie(x, z, r, couleur) { /* un cercle de runes violet (#8f55e0 : assez fonce pour rester violet sur un sol clair) : deux anneaux, une etoile a six branches, des runes ; il s'ouvre, tourne et s'eteint, des etincelles montent */
  const C = couleur || '#8f55e0', y = solA(x, z), g = new T.Group(), mt = (o) => new T.MeshBasicMaterial({ color: C, transparent: true, opacity: o, depthWrite: false, side: T.DoubleSide }), mats = []; /* (sans melange additif : sur le sable clair, il virait au blanc) */
  const plat = (geo, o, parent) => { const m = new T.Mesh(geo, mt(o)); m.rotation.x = -Math.PI / 2; m.renderOrder = 3; mats.push(m.material); (parent || g).add(m); return m; };
  plat(new T.RingGeometry(0.94, 1, 72), 0.95); plat(new T.RingGeometry(0.6, 0.64, 56), 0.85); const inter = new T.Group(); g.add(inter);
  plat(new T.RingGeometry(0.55, 0.6, 3), 0.85, inter).rotation.z = Math.PI / 2; plat(new T.RingGeometry(0.55, 0.6, 3), 0.85, inter).rotation.z = -Math.PI / 2;
  const runes = new T.Group(); g.add(runes); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, m = plat(new T.PlaneGeometry(0.12, 0.05 + (i % 3) * 0.025), 0.9, runes); m.position.set(Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8); m.rotation.z = -a; }
  plat(GEO_DISQUE, 0.18); g.position.set(x, y + 0.07, z); flashLumiere(x, y + 0.5, z, C, 2, 6, 0.4); secousse(0.08, 0.15);
  fxVie(g, 1.6, (k) => { const tk = k * 1.6, o = Math.min(1, tk / 0.2), f = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45; g.scale.setScalar(r * (0.35 + 0.65 * (1 - (1 - o) * (1 - o)))); inter.rotation.y = tk * 1.4; runes.rotation.y = -tk * 0.9;
    mats.forEach((m, i) => { m.opacity = (i === mats.length - 1 ? 0.18 : 0.9) * f; }); });
  emettre(FX_LUM, 24, { x, y: y + 0.1, z, r: r * 0.8, plat: true, v: [0, 1.6, 0], dv: 0.4, vie: [0.6, 1.0], taille: [0.12, 0.02], c: ['#ffffff', C], frein: 0.6 });
}
/* LA LUNE (01/11/2026, par Discord, du Golem lunaire : « c'est quoi ses sorts ? Travaille-les », Mathieu) : le sol du cercle devient de la surface lunaire, de petits
   crateres s'y creusent, une poussiere argentee roule, une onde de clair de lune, des etincelles qui montent doucement */
const TEX_LUNE_SOL = texCanvas(256, (g, n) => { /* du regolithe gris clair aux bords irreguliers, seme de crateres (bord eclaire, creux dans l'ombre) */
  const c = n / 2; g.save(); g.beginPath(); for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2, rr = c * (0.9 + 0.06 * Math.sin(a * 5) + 0.03 * Math.sin(a * 11)); if (i) g.lineTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr); else g.moveTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr); }
  g.closePath(); g.clip(); g.fillStyle = '#b9bec7'; g.fillRect(0, 0, n, n);
  for (let k = 0; k < 900; k++) { g.fillStyle = fxAlea() < 0.5 ? 'rgba(150,156,168,0.5)' : 'rgba(215,220,228,0.5)'; g.fillRect(fxAlea() * n, fxAlea() * n, 2, 2); } /* (le grain) */
  for (let k = 0; k < 16; k++) { const x = fxAlea() * n, y = fxAlea() * n, r = 5 + fxAlea() * 18; let d = g.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.2, x, y, r);
    d.addColorStop(0, 'rgba(120,126,138,0.9)'); d.addColorStop(0.75, 'rgba(140,146,158,0.6)'); d.addColorStop(0.9, 'rgba(232,236,242,0.95)'); d.addColorStop(1, 'rgba(232,236,242,0)'); g.fillStyle = d; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } /* (les crateres) */
  g.restore(); });
const TEX_CROISSANT = texCanvas(128, (g, n) => { /* un croissant de lune qui luit */
  const c = n / 2, d = g.createRadialGradient(c, c, n * 0.1, c, c, n * 0.5); d.addColorStop(0, 'rgba(200,235,255,0.45)'); d.addColorStop(1, 'rgba(200,235,255,0)'); g.fillStyle = d; g.fillRect(0, 0, n, n);
  g.fillStyle = '#f2fbff'; g.beginPath(); g.arc(c, c, n * 0.3, 0, Math.PI * 2); g.fill(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(c + n * 0.13, c - n * 0.06, n * 0.27, 0, Math.PI * 2); g.fill(); });
function craterLune(x, y, z, rr, duree) { /* un petit cratere : un bourrelet gris clair et un creux sombre, qui se creuse puis s'efface */
  const g = new T.Group(), fond = new T.Mesh(GEO_DISQUE, fxMat('#7d828d', 0.9)), bord = new T.Mesh(new T.TorusGeometry(1, 0.22, 6, 20), mat('#c3c8d0'));
  fond.rotation.x = bord.rotation.x = -Math.PI / 2; fond.position.y = 0.04; bord.scale.set(1, 1, 0.45); g.add(fond, bord); g.position.set(x, y, z); g.scale.setScalar(0.01);
  fxVie(g, duree, (k) => { const tk = k * duree, o = Math.min(1, tk / 0.15), f = Math.max(0, (tk - (duree - 0.5)) / 0.5); g.scale.set(rr * o, rr * o * (1 - f) + 0.001, rr * o); fond.material.opacity = 0.9 * (1 - f); });
}
function impactLune(x, z, r) {
  const y = solA(x, z); secousse(0.14, 0.28); flashLumiere(x, y + 0.8, z, '#cfeeff', 2.2, 7, 0.5);
  const sol = sansClic(new T.Mesh(new T.CircleGeometry(r, 48), new T.MeshBasicMaterial({ map: TEX_LUNE_SOL, transparent: true, opacity: 0, depthWrite: false }))); sol.rotation.x = -Math.PI / 2; sol.rotation.z = fxAlea() * 6; sol.position.set(x, y + 0.04, z); sol.renderOrder = 2; scene.add(sol);
  fxVie(sol, 2.4, (k) => { const tk = k * 2.4; sol.material.opacity = Math.min(1, tk / 0.15) * (k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3); sol.scale.setScalar(0.6 + 0.4 * Math.min(1, tk / 0.25)); });
  for (let k = 0; k < 7; k++) { const a = k * 2.399 + fxAlea() * 0.4, d = Math.sqrt((k + 0.5) / 7) * r * 0.8, cx = x + Math.cos(a) * d, cz = z + Math.sin(a) * d, rr = r * fxEntre(0.12, 0.2); let tw = 0; effets.push((dt) => { tw += dt; if (tw < d / r * 0.25) return false; craterLune(cx, y + 0.02, cz, rr, 2.0); emettre(FX_VIF, 3, { x: cx, y: y + 0.1, z: cz, dv: 2, haut: true, vie: [0.4, 0.6], taille: [0.09, 0.04], c: ['#d8dde6', '#a8adb8'], grav: 10 }); return true; }); } /* (les crateres se creusent du centre vers le bord) */
  onde(x, y, z, r * 1.2, '#bfe6ff', 0.55, 0.8, true);
  for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, v = 1.3 + fxAlea(); emettre(FX_FUM, 1, { x: x + Math.cos(a) * r * 0.5, y: y + 0.2, z: z + Math.sin(a) * r * 0.5, v: [Math.cos(a) * v, 0.3, Math.sin(a) * v], vie: [1.0, 1.4], taille: [0.6, 1.4], c: ['#e2e6ee', '#b8bec8'], a: 0.55, frein: 1.3 }); } /* (la poussiere argentee roule) */
  emettre(FX_LUM, 26, { x, y: y + 0.15, z, r: r * 0.8, plat: true, v: [0, 0.9, 0], dv: 0.3, vie: [0.8, 1.4], taille: [0.1, 0.02], c: ['#ffffff', '#bfe6ff'], frein: 0.5 }); /* (des etincelles de lune montent doucement) */
}
/* L'ESPRIT (01/11/2026, par Discord, du Chafer Cuirasse : « la lance du Chafer, c'est un mort-vivant, donc de type terre et esprit, un truc dans le style »,
   Mathieu) : le sol se fend en plaques sombres et une lueur verte spectrale sort des fentes ; des flammes fantomes vert d'eau montent dans tout le cercle, du
   centre vers le bord ; de petites ames s'en echappent et s'envolent en ondulant ; des eclats d'os sautent ; des etincelles et des volutes vertes tournent en
   montant ; puis tout s'eteint */
const TEX_SPECTRE = texCanvas(256, (g, n) => { /* des plaques de terre sombre (Voronoi, comme la terre craquelee), des fentes qui luisent vert pale et eclairent leurs bords */
  const c = n / 2, S = Array.from({ length: 22 }, (_, k) => { const a = k * 2.399, r = Math.sqrt((k + 0.5) / 22) * c * 0.95; return [c + Math.cos(a) * r + (fxAlea() - 0.5) * 14, c + Math.sin(a) * r + (fxAlea() - 0.5) * 14]; });
  const im = g.createImageData(n, n), D = im.data, plus = (x, y) => { let b = 1e9, b2 = 1e9; for (const [sx, sy] of S) { const d = (sx - x) ** 2 + (sy - y) ** 2; if (d < b) { b2 = b; b = d; } else if (d < b2) b2 = d; } return Math.sqrt(b2) - Math.sqrt(b); };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const dr = Math.hypot(x - c, y - c) / c, bord = 0.86 + 0.08 * Math.sin(Math.atan2(y - c, x - c) * 7), a = dr > bord ? Math.max(0, 1 - (dr - bord) / 0.07) : 1; if (a <= 0) continue;
    const f = plus(x, y), fente = f < 2.6, l = f < 9 ? (1 - f / 9) ** 2 : 0, i = (y * n + x) * 4, v = 0.9 + 0.1 * Math.sin(x * 0.7) * Math.sin(y * 0.6);
    D[i] = fente ? 200 : (38 + 60 * l) * v; D[i + 1] = fente ? 255 : (46 + 170 * l) * v; D[i + 2] = fente ? 228 : (44 + 120 * l) * v; D[i + 3] = 255 * a * (fente ? 1 : 0.8 + 0.2 * l); }
  g.putImageData(im, 0, 0); });
const TEX_FANTOME = texCanvas(128, (g, n) => { /* une petite ame : une tete ronde, un corps qui s'efface vers le bas, deux yeux et une bouche creux */
  const d = g.createLinearGradient(0, n * 0.1, 0, n); d.addColorStop(0, 'rgba(240,255,248,0.95)'); d.addColorStop(0.5, 'rgba(150,245,205,0.85)'); d.addColorStop(1, 'rgba(60,200,150,0)'); g.fillStyle = d;
  g.beginPath(); g.arc(n * 0.5, n * 0.4, n * 0.3, Math.PI, 0); g.lineTo(n * 0.8, n * 0.82); for (let i = 0; i < 4; i++) g.quadraticCurveTo(n * (0.8 - (i + 0.5) * 0.15), n * (i % 2 ? 0.8 : 0.98), n * (0.8 - (i + 1) * 0.15), n * 0.88); g.lineTo(n * 0.2, n * 0.4); g.closePath(); g.fill();
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; [[0.39, 0.4, 0.065, 0.09], [0.61, 0.4, 0.065, 0.09], [0.5, 0.58, 0.05, 0.07]].forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(n * x, n * y, n * rx, n * ry, 0, 0, Math.PI * 2); g.fill(); }); g.globalCompositeOperation = 'source-over'; });
function ameEnvol(x, y, z, s, retard) { /* une ame qui sort du sol, monte en ondulant et s'efface */
  const sp = sansClic(new T.Sprite(new T.SpriteMaterial({ map: TEX_FANTOME, transparent: true, depthWrite: false, opacity: 0 }))), ph = fxAlea() * 6; sp.renderOrder = 7; sp.scale.set(s * 0.8, s, 1); sp.position.set(x, y, z); scene.add(sp); let t = -retard;
  effets.push((dt) => { t += dt; if (t < 0) return false; const k = t / 1.7; sp.position.set(x + Math.sin(t * 3 + ph) * 0.22, y + 0.25 + t * 1.3, z + Math.cos(t * 2.4 + ph) * 0.12); sp.material.rotation = Math.sin(t * 4 + ph) * 0.18;
    sp.material.opacity = Math.min(1, t / 0.25) * Math.max(0, 1 - Math.max(0, k - 0.45) / 0.55) * 0.9; if (k >= 1) { jeter(sp); return true; } });
}
function impactEsprit(x, z, r) {
  const y = solA(x, z); secousse(0.12, 0.3); flashLumiere(x, y + 0.6, z, '#5fffc0', 2.2, 7, 0.6);
  const sol = sansClic(new T.Mesh(new T.CircleGeometry(r, 48), new T.MeshBasicMaterial({ map: TEX_SPECTRE, transparent: true, opacity: 0, depthWrite: false }))); sol.rotation.x = -Math.PI / 2; sol.rotation.z = fxAlea() * 6; sol.position.set(x, y + 0.04, z); sol.renderOrder = 2;
  fxVie(sol, 2.6, (k) => { const tk = k * 2.6; sol.material.opacity = Math.min(1, tk / 0.12) * (k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3); sol.scale.setScalar(0.5 + 0.5 * Math.min(1, tk / 0.2)); }); /* (le sol se fend du centre vers le bord) */
  for (let k = 0; k < 18; k++) { const a = k * 2.399 + fxAlea() * 0.5, d = Math.sqrt((k + 0.5) / 18) * r * 0.85, cx = x + Math.cos(a) * d, cz = z + Math.sin(a) * d, h = r * (0.55 - 0.25 * d / r) * fxEntre(0.7, 1.2), retard = d / r * 0.3;
    let tw = 0; effets.push((dt) => { tw += dt; if (tw < retard) return false; langueFeu(cx, y, cz, h, fxEntre(1.0, 1.6) - retard * 0.5, fxAlea() * 6, TEX_FLAMME_SPECTRE); return true; }); } /* (les flammes fantomes) */
  for (let k = 0; k < 3; k++) { const a = fxAlea() * Math.PI * 2, d = fxAlea() * r * 0.5; ameEnvol(x + Math.cos(a) * d, y, z + Math.sin(a) * d, r * fxEntre(0.28, 0.36), 0.15 + k * 0.25); } /* (des ames s'en echappent) */
  eclatsRoche(x, y, z, 12, 0.9, MATS_OS); onde(x, y, z, r * 1.15, '#3fd8a0', 0.55, 0.75, true);
  let t = 0, tic = 0; effets.push((dt) => { t += dt; if ((tic += dt) > 0.05 && t < 1.9) { tic = 0; const a = fxAlea() * Math.PI * 2, d = Math.sqrt(fxAlea()) * r * 0.8, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
      emettre(FX_LUM, 1, { x: px, y: y + 0.15, z: pz, v: [-Math.sin(a) * 0.8, fxEntre(1.0, 1.8), Math.cos(a) * 0.8], vie: [0.8, 1.3], taille: [0.1, 0.02], c: ['#e8fff4', '#5fe8b0'], frein: 0.4 }); /* (des etincelles qui tournent en montant) */
      if (fxAlea() < 0.45) emettre(FX_FUM, 1, { x: px, y: y + 0.4, z: pz, v: [-Math.sin(a) * 0.6, 1.0, Math.cos(a) * 0.6], vie: [1.0, 1.5], taille: [0.4, 1.1], c: ['#9ff0d0', '#3f9a7a'], a: 0.45 }); } /* (des volutes vertes) */
    return t > 2.0; });
}
function impactElement(el, x, z, r) { ({ vent: () => rafaleVent(x, 0, z, r), terre: () => impactTerre(x, z, r), feu: () => impactFeu(x, z, r), eau: () => impactEau(x, z, r), fumee: () => impactFumee(x, z, r), poison: () => impactPoison(x, z, r), feuille: () => impactFeuille(x, z, r), magie: () => impactMagie(x, z, r), lune: () => impactLune(x, z, r), esprit: () => impactEsprit(x, z, r) }[el] || (() => {}))(); }
