'use strict';
/* LE PUITS NIVEAU 6 : LE RECUPERATEUR D'EAU DE PLUIE (19/11/2026, version dev : mode test seulement). Mathieu : « un recuperateur d'eau de pluie a irrigation
   partielle, histoire de se laisser une autre amelioration plus tard », « un truc qui ressemble au 2 [le reservoir de pluie de la maquette], le 3 [la roue a
   aubes] est top plus pour une future amelioration ».
   - le modele : blender/puits6.py (le chateau d'eau du niveau 5 coiffe d'un entonnoir de cuivre, echelle, pluviometre, descente et rigole sur treteaux) ;
   - l'arrosoir passe a 60 doses, la citerne a 50 (02-donnees.js, 04-etat.js : les tableaux vont jusqu'au niveau 6, sans rien changer aux autres) ;
   - l'irrigation partielle : les champs qui touchent le puits (les 8 cases autour) sont toujours arroses, tant que le puits n'est pas en ruine. La roue a
     aubes (niveau 7, plus tard) pourra l'etendre a 2 cases et faire pousser plus vite.
   Il n'existe que dans le mode test : ajoute a son entree (quitter le mode test recharge la page). Chiffres de depart, a valider. */
const PUITS6 = { cout: 250000, niv: 95, eau: 60, citerne: 50, portee: 1 };
let puits6Charge = null;
function chargerPuits6() {
  if (puits6Charge) return puits6Charge;
  return (puits6Charge = chargerGlb('assets/modeles/jeu/puits6.glb?v=' + VERSION_MODELES).then((sc) => {
    versToon(sc, { normales: 0.01, sansContour: SC_BATI });
    const o = sc.getObjectByName('Puits1').clone(true); o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrixWorld(true); /* (la meme mesure que les niveaux 1 a 5, kDe de 09-modeles.js) */
    const b = new T.Box3().setFromObject(o), d = new T.Vector3(); b.getSize(d);
    eauDuPuits6(sc.getObjectByName('Puits6')); MODELES.puits6 = gabaritPuits6(sc, 1.75 / Math.max(d.x, d.z), b.getCenter(new T.Vector3())); /* (l'eau qui coule, 25/11/2026) */
    if (S_ && nivBat('nivPuits') >= 6) construireBatiments();
  }).catch((e) => { console.error('puits niveau 6 :', e); puits6Charge = null; }));
}
function activerPuits6() {
  const a = AMELIOS.find((x) => x.id === 'nivPuits'); if (!a || a.couts.length >= 5) return;
  a.couts.push(PUITS6.cout); a.nivs.push(PUITS6.niv);
  a.desc += ' Niveau 6 : le récupérateur d\'eau de pluie, citerne de ' + PUITS6.citerne + ', arrosoir de ' + PUITS6.eau + ', et les champs qui touchent le puits sont toujours arrosés.';
  PALIERS_BAT.nivPuits.push('Le récupérateur d\'eau de pluie : citerne de ' + PUITS6.citerne + ', arrosoir de ' + PUITS6.eau + ', et sa rigole arrose toujours les champs qui touchent le puits.');
  const G = GAINS.nivPuits; G.looks.push('le récupérateur d\'eau de pluie'); G.stats[0][2].push(PUITS6.eau); G.stats[1][2].push(PUITS6.citerne);
  G.neufs = G.neufs || {}; G.neufs[5] = [['eau', 'Les champs qui touchent le puits sont toujours arrosés']];
  chargerPuits6();
}
const entrerModeTestPuits6 = entrerModeTest; entrerModeTest = function () { const r = entrerModeTestPuits6.apply(this, arguments); if (MODE_TEST) activerPuits6(); return r; };
if (SORTIE_P11) activerPuits6(); /* (la sortie du palier 11 : avant le chargement de la partie, sinon un puits niveau 6 serait ramene au 5) */
/* l'irrigation : un champ a une case du puits (diagonales comprises) */
const irrigue = (p) => nivBat('nivPuits') >= 6 && !enRuine('puits') && S_.cases.some((c) => c.type === 'puits' && Math.max(Math.abs(c.i - p.i), Math.abs(c.j - p.j)) <= PUITS6.portee);
function irriguer() { /* les champs plantes et pas arroses, autour du puits : arroses (a chaque semis, et toutes les 2 s pour ceux d'avant l'achat) */
  if (!S_ || nivBat('nivPuits') < 6) return;
  S_.cases.forEach((p) => { if (p.type === 'champ' && p.c && !p.arrose && irrigue(p)) { p.arrose = true; rendreCase(p.id); } });
}
setInterval(() => { try { irriguer(); } catch (e) { /* (avant le chargement de la ferme) */ } }, 2000);
const planterPuits6 = ACTIONS.planter; ACTIONS.planter = function (p) { const r = planterPuits6.apply(this, arguments); if (p && p.c && !p.arrose && irrigue(p)) { p.arrose = true; rendreCase(p.id); } return r; };
const amelioPuits6 = ACTIONS.amelio; ACTIONS.amelio = function (id) {
  const avant = id === 'nivPuits' ? nivBat('nivPuits') : 0, r = amelioPuits6.apply(this, arguments);
  if (id === 'nivPuits' && avant === 5 && nivBat('nivPuits') === 6) { irriguer(); setTimeout(() => toast('Le récupérateur d\'eau de pluie est en place : sa rigole arrose toujours les champs qui touchent le puits.', 'or'), 1600); }
  return r;
};

/* L'EAU QUI COULE (25/11/2026, « a ameliorer un peu visuellement, et anime un peu l'eau », Mathieu, sur la capture du canal en V) : blender/puits6.py fait
   maintenant un vrai petit canal creuse, courbe, aux berges de galets, et l'eau qui coule est un ruban dont la coordonnee v suit le courant
   (alleger.py garde ses coordonnees de texture). Ici :
   - la rigole et le canal : le courant defile (des rides claires qui filent dans le sens de l'eau, le milieu plus profond, les bords d'ecume) ;
   - le filet d'eau et la chute au bout de la rigole : des traits qui tombent ;
   - la flaque au bout du canal : des ronds qui s'elargissent ;
   - des eclaboussures la ou le filet tombe dans la rigole et la ou la rigole se deverse dans le canal.
   L'eau reste sans ombre ni eclairage, comme toute l'eau des batiments (09-modeles.js), et suit le temps du vent (vent.temps). */
const PUITS6_SANS_CONTOUR = ['eauCourante', 'eauChute', 'flaque', 'lit', 'repereChute', 'repereFin', 'repereFlaque'];
PUITS6_SANS_CONTOUR.forEach((n) => SC_BATI.add(n));
const EAU6 = { sens: -1 }; /* (le sens du courant le long de v : l'export glTF retourne v (1 - v), d'ou -1 pour que l'eau descende la pente) */
function matEau6(type, centre) {
  const m = new T.MeshBasicMaterial({ color: '#86ecbd', side: T.DoubleSide });
  if (type === 'courant') m.defines = { USE_UV: '' };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTemps = vent.temps; sh.uniforms.uSens = { value: EAU6.sens }; if (centre) sh.uniforms.uCentre = { value: centre };
    sh.vertexShader = 'varying vec3 vLoc; varying vec3 vMonde;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvLoc = position; vMonde = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    const code = type === 'courant' ? [
      'float u = vUv.x, v = vUv.y * uSens, centre = 1.0 - abs(u - 0.5) * 2.0, ondule = sin(u * 9.0 + uTemps * 2.0) * 0.08;',
      'float r1 = smoothstep(0.78, 1.0, sin((v + ondule) * 14.0 - uTemps * 17.0));',
      'float r2 = smoothstep(0.86, 1.0, sin((v * 0.6 - ondule) * 23.0 - uTemps * 22.0 + u * 3.0));',
      'gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.84, centre * 0.55);',
      'gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.93, 1.0, 0.97), max(r1 * 0.6, r2 * 0.4) * (0.45 + 0.55 * centre));',
      'gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.97, 1.0, 0.98), smoothstep(0.75, 1.0, 1.0 - centre) * 0.5);'
    ] : type === 'chute' ? [
      'float c = smoothstep(0.5, 1.0, sin(vMonde.y * 16.0 + uTemps * 14.0 + sin(vMonde.x * 30.0 + vMonde.z * 30.0) * 1.2));',
      'gl_FragColor.rgb = mix(gl_FragColor.rgb * 0.92, vec3(0.95, 1.0, 0.98), c * 0.6);'
    ] : [
      'float d = length(vLoc.xz - uCentre), ronds = smoothstep(0.8, 1.0, sin(d * 70.0 - uTemps * 6.0)) * (1.0 - smoothstep(0.03, 0.13, d) * 0.6);',
      'gl_FragColor.rgb = mix(gl_FragColor.rgb * 0.9, vec3(0.95, 1.0, 0.98), ronds * 0.55);'
    ];
    sh.fragmentShader = 'uniform float uTemps; uniform float uSens; varying vec3 vLoc; varying vec3 vMonde;' + (centre ? ' uniform vec2 uCentre;' : '') + '\n' + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n' + code.join('\n'));
  };
  m.customProgramCacheKey = () => 'eau6' + type; partager(m); return m;
}
function eauDuPuits6(g) { /* avant la fusion du modele : l'eau qui coule et les reperes des eclaboussures restent a part (la fusion perdrait leurs coordonnees et leurs noms) */
  g.traverse((o) => { if (!o.isMesh) return; const nom = o.name.replace(/\.?\d+$/, '').replace(/_\d+$/, '');
    if (nom === 'eauCourante') { o.material = matEau6('courant'); o.userData.eau6 = true; }
    else if (nom === 'eauChute') { o.material = matEau6('chute'); o.userData.eau6 = true; }
    else if (nom === 'flaque') { o.geometry.computeBoundingBox(); const c = o.geometry.boundingBox.getCenter(new T.Vector3()); o.material = matEau6('flaque', new T.Vector2(c.x, c.z)); o.userData.eau6 = true; }
    else if (/^repere/.test(nom)) { o.visible = false; o.userData.repere = nom; }
    if (o.userData.eau6 || o.userData.repere) { o.castShadow = false; o.receiveShadow = false; } });
}
function gabaritPuits6(racine, k, centre) { /* gabaritEchelle (09-modeles.js), sans fusionner l'eau qui coule ni les reperes */
  const g = racine.getObjectByName('Puits6').clone(true); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.scale.set(1, 1, 1); g.updateMatrixWorld(true);
  const b = new T.Box3().setFromObject(g), d = new T.Vector3(); b.getSize(d); g.scale.setScalar(k); const c = centre || b.getCenter(new T.Vector3()); g.position.set(-c.x * k, -b.min.y * k, -c.z * k);
  const env = new T.Group(); env.add(g); env.userData.hauteur = d.y * k; env.userData.solY = b.min.y; return fusionner(env, { garder: (m) => !!(m.userData.eau6 || m.userData.repere) });
}
/* les eclaboussures : les reperes des puits niveau 6 poses sur la ferme, retrouves a chaque reconstruction */
let REPERES_PUITS6 = [];
{ const construireBatimentsP6 = construireBatiments; construireBatiments = function () { const r = construireBatimentsP6.apply(this, arguments);
  REPERES_PUITS6 = []; if (nivBat('nivPuits') >= 6) scene.traverse((o) => { if (o.userData && o.userData.repere) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); REPERES_PUITS6.push({ o, nom: o.userData.repere, c: o.geometry.boundingBox.getCenter(new T.Vector3()), t: Math.random() }); } });
  return r; }; }
{ const majParticulesP6 = majParticules; majParticules = function (dt) { const r = majParticulesP6.apply(this, arguments);
  if (REPERES_PUITS6.length && typeof lieu !== 'undefined' && lieu === 'ferme' && !combat) { const p = new T.Vector3();
    REPERES_PUITS6.forEach((R) => { if (!R.o.parent) return; R.t += dt; const pas = R.nom === 'repereFlaque' ? 0.7 : R.nom === 'repereChute' ? 0.06 : 0.07; if (R.t < pas) return; R.t = 0; R.o.localToWorld(p.copy(R.c));
      if (R.nom === 'repereFlaque') { onde(p.x, p.y - 0.06, p.z, 0.16, '#dcfff0', 0.9, 0.55); return; }
      emettre(FX_VIF, R.nom === 'repereFin' ? 2 : 1, { x: p.x, y: p.y, z: p.z, r: 0.02, dv: 0.6, haut: true, vie: [0.22, 0.38], taille: [0.035, 0.012], c: ['#ffffff', '#bff5dc'], a: 1, grav: 5 });
      if (R.nom === 'repereFin' && Math.random() < 0.35) emettre(FX_FUM, 1, { x: p.x, y: p.y, z: p.z, r: 0.03, v: [0, 0.15, 0], vie: [0.35, 0.5], taille: [0.07, 0.17], c: ['#ffffff', '#e8fff4'], a: 0.35, entree: 0.1 }); }); }
  return r; }; }
