'use strict';
/* LE CRATERE VOLCANIQUE, troisieme carte de l'Arene (25/11/2026, « fais la deuxieme map d'arene », Mathieu ; au formulaire : « Cratere volcanique », « Anneau autour
   d'un trou ») : blender/arene-volcan.py. Un anneau de dalles de basalte de 4,5 a 13 du centre autour d'un lac de lave : on se bat en tournant autour, le lac est
   le seul obstacle (le perso et les monstres le contournent, l'A* de 28b) ; trois portes a herses aux places de PORTES_ARENE ; les falaises du cratere au fond.
   Le perso part devant le lac (depart). Le decor vit : la lave coule (un shader qui fait bouger ses veines, le lac, les coulees et la douve), des bulles crevent
   sur le lac, les fumerolles fument, des braises montent. Version dev (sortie : false), comme le temple. Inscrite dans CARTES_ARENE (28b-arene-temple.js). */
const VOLCAN = { trou: 4.5, ext: 13.0, portes: [{ a: -Math.PI / 2, l: 1.2 }, { a: Math.PI, l: 1.0 }, { a: 0, l: 1.0 }] }; /* (trou : la bordure du lac ; ext : le bord du terrain ; les portes du fond, de gauche, de droite) */
function dansPorteVolcan(lx, lz, m) { /* un monstre dans le passage d'une porte (il en sort), jusqu'a 15,2 du centre */
  const r = Math.hypot(lx, lz), a = Math.atan2(lz, lx); if (r <= VOLCAN.ext - m || r > 15.2) return false;
  return VOLCAN.portes.some((p) => Math.abs(Math.atan2(Math.sin(a - p.a), Math.cos(a - p.a))) * r < p.l);
}
function libreVolcan(lx, lz, m, porte) { const r = Math.hypot(lx, lz); if (r < VOLCAN.trou + m) return false; return r <= VOLCAN.ext - m || !!(porte && dansPorteVolcan(lx, lz, m)); }
function bornerLocalVolcan(lx, lz, m, monstre) { /* hors du lac, dans l'anneau (ou le passage d'une porte, pour un monstre) ; meme un boss qui traverse le decor ne va pas dans la lave */
  const r = Math.hypot(lx, lz), ux = r > 1e-3 ? lx / r : 0, uz = r > 1e-3 ? lz / r : 1, rin = VOLCAN.trou + m, rout = VOLCAN.ext - m;
  if (r < rin) return [ux * rin, uz * rin];
  if (r > rout && !(monstre && dansPorteVolcan(lx, lz, m))) return [ux * rout, uz * rout];
  return [lx, lz];
}
/* la lave qui coule : des veines claires qui bougent, une croute sombre qui derive (le lac et la douve coulent a plat, les coulees vers le bas) */
const LAVE_VS = 'varying vec3 vP; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
const LAVE_FS = `varying vec3 vP; uniform float uT; uniform float uChute;
  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { v += a * n(p); p = p * 2.03 + vec2(3.1, 1.7); a *= 0.5; } return v; }
  void main() {
    vec2 p = uChute > 0.5 ? vec2((vP.x + vP.z) * 0.9, vP.y * 0.7 + uT * 1.4) : vP.xz * 0.5 + vec2(uT * 0.04, -uT * 0.06);
    float a = fbm(p), b = fbm(p * 2.2 - vec2(uT * 0.09, uT * 0.05));
    vec3 c = mix(vec3(0.62, 0.1, 0.02), vec3(1.0, 0.45, 0.07), smoothstep(0.3, 0.7, a * 0.65 + b * 0.35));
    c = mix(c, vec3(1.0, 0.85, 0.36), smoothstep(0.68, 0.9, a)); /* (les veines claires) */
    float cr = smoothstep(0.55, 0.62, b) * (1.0 - smoothstep(0.62, 0.7, b)); c = mix(c, vec3(0.22, 0.06, 0.03), cr * (uChute > 0.5 ? 0.25 : 0.55)); /* (la croute qui derive) */
    gl_FragColor = vec4(c, 1.0);
  }`;
function decorVolcan(g, reperes) {
  const uT = (typeof DV !== 'undefined' && DV.uT) || { value: 0 };
  g.traverse((m) => { if (!m.isMesh || !/^lave_(mer|chute|douve)/.test(m.name) || m.material.side === T.BackSide) return;
    m.material = new T.ShaderMaterial({ uniforms: { uT, uChute: { value: /chute/.test(m.name) ? 1 : 0 } }, vertexShader: LAVE_VS, fragmentShader: LAVE_FS }); m.castShadow = false; m.receiveShadow = false; });
  const bulles = reperes.filter((x) => /^repere_bulle/.test(x.nom)).map((x) => x.p), fumees = reperes.filter((x) => /^repere_fumee/.test(x.nom)).map((x) => x.p);
  let t = 0;
  const id = setInterval(() => { if (!g.parent) { clearInterval(id); return; } if (!g.visible || enPause || typeof emettre !== 'function') return; t += 0.1; const O = g.position;
    if (bulles.length && Math.random() < 0.45) { const b = bulles[Math.floor(Math.random() * bulles.length)], x = O.x + b.x + (Math.random() - 0.5) * 2, z = O.z + b.z + (Math.random() - 0.5) * 2, y = O.y + b.y + 0.05; /* une bulle qui creve */
      emettre(FX_LUM, 1, { x, y: y + 0.1, z, vie: [0.25, 0.35], taille: [0.6, 1.2], c: ['#ffd36a', '#ff7a1e'], a: 0.8 });
      emettre(FX_VIF, 7, { x, y: y + 0.1, z, r: 0.15, v: [0, 3.2, 0], dv: 1.6, vie: [0.4, 0.8], taille: [0.09, 0.03], c: ['#fff1a8', '#ff9a2e', '#c8401e'], grav: 7, frein: 0.6 }); }
    fumees.forEach((f) => { if (Math.random() < 0.3) emettre(FX_FUM, 1, { x: O.x + f.x + (Math.random() - 0.5) * 0.5, y: O.y + f.y, z: O.z + f.z + (Math.random() - 0.5) * 0.5, v: [0.15, 1.1, 0], dv: 0.25, vie: [2.2, 3.4], taille: [0.6, 2.4], c: ['#5a504c', '#7a706a'], a: 0.32, frein: 0.3, entree: 0.4 }); });
    for (let k = 0; k < 2; k++) { const a = Math.random() * Math.PI * 2, rr = 4 + Math.random() * 12; /* des braises qui montent de partout */
      emettre(FX_VIF, 1, { x: O.x + Math.cos(a) * rr, y: O.y + 0.2, z: O.z + Math.sin(a) * rr, v: [0, 1.0, 0], dv: 0.4, vie: [1.4, 2.4], taille: [0.05, 0.02], c: ['#ffb84a', '#ff6a1e'], a: 0.9, grav: -0.3, frein: 0.2 }); } }, 100);
}
CARTES_ARENE.volcan = { nom: 'volcan', sortie: false, fichier: 'arene-volcan.glb', racine: 'AreneVolcan', libre: libreVolcan, borner: bornerLocalVolcan, depart: [0, 8.5],
  garder: /^(drapeau_|grille|lave_mer|lave_chute|lave_douve)/, decor: decorVolcan };
