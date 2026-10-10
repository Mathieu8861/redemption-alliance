/* Vent leger sur la ferme : les vegetaux plient depuis leur pied, plus fort en haut qu'en bas,
   avec un balancement permanent tres doux et, de temps en temps, une rafale qui traverse la scene en vague.
   Le rythme (phase) est pris sur l'origine de chaque objet, pas sur chaque point : une plante bouge d'un seul bloc,
   au lieu de se deformer comme de la gelee. Tout est periodique sur 6 secondes (animation qui boucle sans saut).
   Usage :
     const vent = creerVent(THREE, { sol, plafond });
     vent.materiau(materiau, souplesse)  -> materiau sensible au vent ; souplesse 1 = ble, 0.15 = arbre, 0 = immobile
     vent.ombre(souplesse)               -> materiau d'ombre qui suit le vent (mesh.customDepthMaterial), meme souplesse
     vent.mettreAJour(secondes)          -> a chaque image ; vent.reglages.force.value pour regler l'ensemble */
(function () {
  'use strict';
  window.creerVent = function (T, o) {
    o = o || {};
    const temps = { value: 0 };
    const reglages = {
      force: { value: o.force != null ? o.force : 1 },
      sol: { value: o.sol != null ? o.sol : 0 },
      plafond: { value: o.plafond != null ? o.plafond : 1.3 },
      direction: { value: new T.Vector2(o.dx != null ? o.dx : 1, o.dz != null ? o.dz : 0.4).normalize() }
    };
    const W0 = (2 * Math.PI / 6).toFixed(5), W1 = (2 * Math.PI / 3).toFixed(5); /* rafale toutes les 6 s, balancement toutes les 3 s */
    const GLSL = [
      'uniform float uVentTemps; uniform float uVentForce; uniform float uVentSol; uniform float uVentPlafond; uniform vec2 uVentDir; uniform float uVentSouplesse;',
      'vec4 ventDeplacer(vec4 wp) {',
      '  vec3 org = modelMatrix[3].xyz;',
      '  float h = clamp(wp.y - uVentSol, 0.0, uVentPlafond);',
      '  float flex = h * h;',
      '  float phase = uVentTemps * ' + W1 + ' + org.x * 1.3 + org.z * 0.9;',
      '  float balance = sin(phase) * 0.6 + sin(phase * 1.5 + 1.3) * 0.25;',
      '  float vague = 0.5 + 0.5 * sin(dot(org.xz, uVentDir) * 0.55 - uVentTemps * ' + W0 + ');',
      '  float rafale = vague * vague * vague * vague;',
      '  float k = flex * uVentForce * uVentSouplesse;',
      '  wp.xz += uVentDir * (balance * (0.03 + 0.08 * rafale) + rafale * 0.06) * k;',
      '  wp.y -= 0.02 * rafale * k;',
      '  return wp;',
      '}'
    ].join('\n');
    const PROJECTION = [
      'vec4 ventWp = modelMatrix * vec4( transformed, 1.0 );',
      'ventWp = ventDeplacer( ventWp );',
      'vec4 mvPosition = viewMatrix * ventWp;',
      'gl_Position = projectionMatrix * mvPosition;'
    ].join('\n');
    function brancheur(souplesse) {
      const s = { value: souplesse };
      return function (shader) {
        shader.uniforms.uVentTemps = temps; shader.uniforms.uVentForce = reglages.force; shader.uniforms.uVentSol = reglages.sol;
        shader.uniforms.uVentPlafond = reglages.plafond; shader.uniforms.uVentDir = reglages.direction; shader.uniforms.uVentSouplesse = s;
        shader.vertexShader = GLSL + '\n' + shader.vertexShader.replace('#include <project_vertex>', PROJECTION);
      };
    }
    const ombres = {};
    return {
      temps, reglages,
      materiau(m, souplesse) { m.onBeforeCompile = brancheur(souplesse != null ? souplesse : 1); m.customProgramCacheKey = () => 'vent'; return m; },
      ombre(souplesse) {
        const k = String(souplesse != null ? souplesse : 1);
        if (!ombres[k]) { const d = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking }); d.onBeforeCompile = brancheur(parseFloat(k)); d.customProgramCacheKey = () => 'vent-ombre'; ombres[k] = d; }
        return ombres[k];
      },
      mettreAJour(s) { temps.value = s; }
    };
  };
})();
