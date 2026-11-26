'use strict';
/* LA GELIERE : L'EAU QUI BOUGE (26/11/2026, Mathieu : « la petite flaque d'eau au milieu, la ou elles peuvent se baigner, une petite animation, un truc un peu
   plus sympa qu'un truc completement fige ») : sur les batiments, toute eau devenait un aplat vert d'eau immobile (versToon, 09-modeles.js) ; dans la Geliere,
   ses mares, flaques, bassin et fontaine prennent des ronds qui partent de leur centre et des reflets qui glissent. Les flaques d'un niveau sont fondues en une
   seule piece (fusionner) : chaque morceau d'eau retrouve son centre (aCentre, calcule une fois sur la geometrie), et la matiere est modifiee sur place, pour
   que toutes les copies posees sur la ferme bougent aussi. */
const EAU_GELIERE = { couleur: '86ecbd', rond: 26, vitesse: 3.2, reflet: 0.4 };
function centresEauGeliere(geo) { /* (chaque morceau d'eau separe : les sommets relies par un triangle, ou au meme endroit) */
  const pos = geo.attributes.position, n = pos.count, par = Array.from({ length: n }, (x, i) => i), cles = new Map();
  const tete = (i) => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; }, unir = (a, b) => { a = tete(a); b = tete(b); if (a !== b) par[a] = b; };
  for (let i = 0; i < n; i++) { const k = Math.round(pos.getX(i) * 1e3) + ',' + Math.round(pos.getY(i) * 1e3) + ',' + Math.round(pos.getZ(i) * 1e3); if (cles.has(k)) unir(i, cles.get(k)); else cles.set(k, i); }
  const idx = geo.index; const nt = idx ? idx.count / 3 : n / 3;
  for (let t = 0; t < nt; t++) { const a = idx ? idx.getX(3 * t) : 3 * t, b = idx ? idx.getX(3 * t + 1) : 3 * t + 1, c = idx ? idx.getX(3 * t + 2) : 3 * t + 2; unir(a, b); unir(b, c); }
  const somme = new Map(); for (let i = 0; i < n; i++) { const r = tete(i), s = somme.get(r) || [0, 0, 0, 0]; s[0] += pos.getX(i); s[1] += pos.getY(i); s[2] += pos.getZ(i); s[3]++; somme.set(r, s); }
  const C = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const s = somme.get(tete(i)); C[3 * i] = s[0] / s[3]; C[3 * i + 1] = s[1] / s[3]; C[3 * i + 2] = s[2] / s[3]; }
  geo.setAttribute('aCentre', new T.BufferAttribute(C, 3));
}
function animerEauGeliere(g) {
  if (!g) return; g.traverse((m) => {
    const M = m.isMesh && m.material; if (!M || !M.isMeshBasicMaterial || M.userData.eauGeliere || !M.color || M.color.getHexString() !== EAU_GELIERE.couleur) return;
    try { centresEauGeliere(m.geometry); } catch (e) { return; }
    M.userData.eauGeliere = true; M.transparent = true; M.opacity = 0.9;
    M.onBeforeCompile = (sh) => {
      sh.uniforms.uTemps = vent.temps;
      sh.vertexShader = 'attribute vec3 aCentre; varying vec2 vRel; varying vec2 vWp;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvRel = position.xz - aCentre.xz; vWp = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = 'uniform float uTemps; varying vec2 vRel; varying vec2 vWp;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', [
        '#include <dithering_fragment>',
        'float d = length(vRel);',
        'float rond = smoothstep(0.8, 1.0, sin(d * ' + EAU_GELIERE.rond.toFixed(1) + ' - uTemps * ' + EAU_GELIERE.vitesse.toFixed(2) + ')) * smoothstep(0.03, 0.14, d);',
        'float reflet = smoothstep(0.9, 1.0, sin(vWp.x * 7.0 + uTemps * 1.7) * sin(vWp.y * 6.0 - uTemps * 1.3));',
        'float houle = 0.93 + 0.07 * sin(vWp.x * 3.1 + vWp.y * 2.3 + uTemps * 1.1);',
        'gl_FragColor.rgb = mix(gl_FragColor.rgb * houle, vec3(0.94, 0.99, 1.0), rond * 0.42 + reflet * ' + EAU_GELIERE.reflet.toFixed(2) + ');'
      ].join('\n'));
    };
    M.customProgramCacheKey = () => 'eauGeliere'; M.needsUpdate = true;
  });
}
const animerEauxGeliere = () => { for (let n = 1; n <= 6; n++) animerEauGeliere(MODELES['geliere' + n]); };
{ const assurerGeliereE = assurerGeliere; assurerGeliere = function () { const p = assurerGeliereE.apply(this, arguments); if (p && p.then) p.then(() => { try { animerEauxGeliere(); } catch (e) { /* rien */ } }); return p; }; }
