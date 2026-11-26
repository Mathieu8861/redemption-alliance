'use strict';
/* LES RUINES CELESTES, cinquieme carte de l'Arene (26/11/2026, la nuit : « des arenes ou on peut monter aussi sur des plateformes avec des escaliers etc, des decors
   differents. Map a trous, des ponts etc », Mathieu) : blender/arene-ciel.py. Des ilots de marbre dans le ciel, relies par des ponts de pierre sans parapet :
   l'ilot de devant (le depart), l'ilot du milieu et son autel (1,4 de haut, un escalier), les ilots de gauche et de droite (leurs portes), l'ilot du fond, sa
   terrasse et son escalier, relies a l'autel par un pont haut ; deux petits ilots devant, au bout de ponts etroits. Partout ailleurs, le vide : on y tombe
   (28e-arene-relief.js). Le decor vit : la cascade qui tombe d'un ilot dans le vide, des rochers qui flottent, des nuages qui passent sous l'arene. */
const PLAN_CIEL = [ /* (genere par blender/arenes-relief-plans.py, a garder identique) */
  '________..sss...________',
  '________.#sss.#.________',
  '________.HHHHHH.________',
  '________.HHHHHH.________',
  '________.HHHHHH.________',
  '__________---___________',
  '__________---___________',
  '__________---___________',
  '.....___.HHHHHH.___.....',
  '.#...___.HHHHHH.___.....',
  '.....___.HHHHHH.___.....',
  '.....===..nnn...===.....',
  '.....===..nnn...===.....',
  '.....===..nnn...===.....',
  '.....___........___...#.',
  '....._____===______.....',
  '__________===___________',
  '_____.............._____',
  '_____.............._____',
  '...__..............__...',
  '...==..............==...',
  '..#==..............==.#.',
  '...__.#..........#.__...',
  '_____.............._____'];
const EAU_FS = `varying vec3 vP; uniform float uT;
  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
  void main() { vec2 p = vec2((vP.x + vP.z) * 1.6, vP.y * 0.9 + uT * 2.2); float a = n(p) * 0.6 + n(p * 2.3 + 7.0) * 0.4;
    vec3 c = mix(vec3(0.52, 0.8, 0.95), vec3(0.93, 0.98, 1.0), smoothstep(0.45, 0.75, a)); gl_FragColor = vec4(c, 0.92); }`;
carteRelief({ nom: 'ciel', sortie: 'p11', fichier: 'arene-ciel.glb', racine: 'AreneCiel', plan: PLAN_CIEL, H: 1.4, depart: [0.5, 2.5], chuteCouleurs: ['#ffffff', '#dfeaf6'],
  garder: /^(drapeau_|grille|eau_chute)/, decor: (g, reperes) => decorCiel(g, reperes) });
function decorCiel(g, reperes) {
  const chutes = [], rocs = new Map(); g.traverse((o) => { if (!o.isMesh) return; if (/^eau_chute/.test(o.name) || (o.parent && /^eau_chute/.test(o.parent.name))) chutes.push(o);
    let q = o; while (q && q !== g) { const m = /^roc_flottant_?(\d*)/.exec(q.name || ''); if (m) { rocs.set(q, q.position.y); break; } q = q.parent; } });
  const U = { uT: { value: 0 } }, mat = new T.ShaderMaterial({ vertexShader: LAVE_VS, fragmentShader: EAU_FS, uniforms: U, transparent: true, depthWrite: false });
  chutes.forEach((o) => { o.material = mat; o.castShadow = false; });
  const nuages = reperes.filter((r) => /repere_nuage/.test(r.nom)), embruns = reperes.filter((r) => /repere_embruns/.test(r.nom));
  let t = 0; effets.push((dt) => { if (!g.parent) return true; if (!g.visible) return false; t += dt; U.uT.value = t;
    let k = 0; rocs.forEach((y0, o) => { o.position.y = y0 + Math.sin(t * 0.7 + k * 1.9) * 0.18; o.rotation.y += dt * 0.05 * (k % 2 ? 1 : -1); k++; });
    if (nuages.length && Math.random() < dt * 5) { const r = nuages[Math.floor(Math.random() * nuages.length)], w = g.localToWorld(r.p.clone());
      emettre(FX_FUM, 1, { x: w.x + (Math.random() - 0.5) * 4, y: w.y, z: w.z + (Math.random() - 0.5) * 4, v: [0.7, 0.05, 0.25], vie: [5, 8], taille: [3.5, 6.5], c: ['#ffffff', '#f2f7fc'], a: 0.38, entree: 0.5 }); } /* (des nuages doux qui passent sous l'arene) */
    if (embruns.length && Math.random() < dt * 10) { const r = embruns[Math.floor(Math.random() * embruns.length)], w = g.localToWorld(r.p.clone());
      emettre(FX_FUM, 1, { x: w.x + (Math.random() - 0.5) * 0.8, y: w.y, z: w.z + (Math.random() - 0.5) * 0.8, v: [0, -0.8, 0], vie: [0.8, 1.3], taille: [0.4, 1.1], c: ['#ffffff', '#dff2fb'], a: 0.4 }); }
    return false; });
}
