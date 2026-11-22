'use strict';
/* LES PERFORMANCES (22/11/2026, « analyse tout et ameliore, si on lag maintenant on pourra jamais ameliorer sur des trucs plus chauds », puis « y a-t-il des
   ameliorations qui ne degradent pas la qualite ni le gameplay ? » ; « ok » pour les trois sans perte, Mathieu). Mesures sur la ferme de Madazezette avec
   une vraie carte graphique (traces/chargement/plans-perf*.js, outils/banc/apercu.mjs avec APERCU_GPU=1) : 60 images/s sur la ferme tout juste, 42 en vague ;
   le rendu est le goulot (2 800 appels de dessin), et les a-coups ressentis comme du lag tombent quand les monstres arrivent : la premiere fois qu'un type de
   monstre ou un effet s'affiche, ses textures et ses matieres partent vers la carte graphique en plein combat (jusqu'a 77 ms d'un coup, 34 ms au premier
   tir du Libeclair).
   1. LE PRECHAUFFAGE DE LA VAGUE : au lancement, un exemplaire de chaque monstre attendu (renforts, invocations et temps d'une vague de boss compris) et les
      effets du Libeclair sont dessines une fois hors de l'ecran, dans une petite image a part : leurs textures, leurs squelettes et leurs matieres sont prets
      quand les vrais arrivent. L'attente passe au lancement (le moment « les monstres arrivent »), plus en plein combat. Rien ne change a l'image. */
function typesDeVague(n) {
  const T0 = new Set(); try { compoTotale(n).forEach(([t]) => T0.add(t)); } catch (e) { /* rien */ }
  try { (PHASES_BOSS[n] || []).forEach((p) => p.L.forEach(([t]) => T0.add(t))); } catch (e) { /* rien */ }
  [...T0].forEach((t) => { const M = MONSTRES[t]; if (!M) return; [].concat(M.renforts ? [M.renforts[0]] : [], M.renfortsRage ? [M.renfortsRage[0]] : [], M.invoque ? M.invoque.types || [] : [], M.affaibli ? [M.affaibli.invoque] : [], M.enracine ? (M.enracine.types || []) : []).forEach((x) => { if (MONSTRES[x]) T0.add(x); }); });
  return [...T0];
}
function prechaufferVague(types) {
  if (typeof rendu === 'undefined' || !rendu || !camera) return 0; const t0 = performance.now(), g = new T.Group(), noms = new Set();
  types.forEach((t) => { const d = MONSTRES[t]; if (!d) return;
    if (d.fabrique) { try { g.add(d.fabrique()); } catch (e) { /* rien */ } return; }
    [d.modele, d.modele + '-v2'].forEach((nm) => { if (MODELES[nm] && !noms.has(nm)) { noms.add(nm); try { g.add(cloner(nm)); } catch (e) { /* rien */ } } }); });
  if (types.includes('libeclair') && typeof orbeFoudre === 'function') { try { g.add(orbeFoudre()); if (typeof spriteEclair === 'function') g.add(spriteEclair(1, 0.3)); } catch (e) { /* rien */ } }
  if (!g.children.length) return 0;
  const dir = new T.Vector3(); camera.getWorldDirection(dir); g.position.copy(camera.position).addScaledVector(dir, 10); g.children.forEach((o, i) => { o.position.set((i % 6) * 1.5 - 4, 0, Math.floor(i / 6) * 1.5); });
  scene.add(g); g.updateMatrixWorld(true);
  const rt = new T.WebGLRenderTarget(96, 96), avant = rendu.getRenderTarget();
  try { rendu.compile(scene, camera); rendu.setRenderTarget(rt); rendu.render(scene, camera); } catch (e) { /* rien */ } finally { rendu.setRenderTarget(avant); scene.remove(g); rt.dispose(); }
  g.traverse((o) => { const an = o.userData && o.userData.anim; if (an && an.mixer) an.mixer.stopAllAction(); });
  return Math.round(performance.now() - t0);
}
{ const lancerVagueP = lancerVague; lancerVague = function () {
    const avant = combat, r = lancerVagueP.apply(this, arguments);
    if (combat && combat !== avant && combat.genre === 'vague' && !window.__sansPrechauffage) { /* (__sansPrechauffage : pour les mesures avant / apres) */ try { combat.prechauffe = prechaufferVague(typesDeVague(combat.n)); } catch (e) { /* (le jeu continue sans) */ } }
    return r; }; }
/* 2. LES CHAMPS EN INSTANCES (22/11/2026, « vas-y fais les champs instancies maintenant », Mathieu) : chaque champ posait sa copie du modele de sa culture,
      environ 13 appels de dessin par champ (tige, feuilles, fleur, sillon et leurs contours), soit environ 500 pour 42 champs. Maintenant, chaque piece
      (meme geometrie, meme matiere) de tous les champs est dessinee en un seul appel (InstancedMesh). La copie du champ reste en place mais cachee : elle
      sert toujours aux clics, au survol et a la lueur des Noctiflores (qui lit ses pieces). Le vent garde le meme rythme (vent.js prend instanceMatrix en
      compte), les matieres sont les memes objets (la terre mouillee, la lueur de nuit, le mode graphismes legers suivent), les ombres aussi.
      window.__sansInstances = true avant le chargement : l'ancien rendu, pour comparer. */
const INST_CHAMPS = { pools: new Map(), cases: new Map(), CAP: 192 };
const cleMatiere = (M) => (M.onBeforeCompile && M.onBeforeCompile !== T.Material.prototype.onBeforeCompile) || M.map || M.userData.unique ? M.uuid /* (une matiere a shader ou a texture : elle-meme) */
  : [M.type, M.color ? M.color.getHexString() : '', M.side, M.transparent ? 't' : '', M.opacity, M.visible ? 'v' : '', M.gradientMap ? M.gradientMap.uuid : '', M.emissive ? M.emissive.getHexString() : ''].join(':'); /* (une matiere simple : par son apparence ; le sol laboure d'une parcelle ajoutee avait sa propre matiere, de la meme couleur, dans chaque champ) */
function poolInst(m) {
  const cle = m.geometry.uuid + '|' + cleMatiere(m.material) + '|' + (m.castShadow ? 1 : 0) + (m.receiveShadow ? 1 : 0) + '|' + (m.customDepthMaterial ? m.customDepthMaterial.uuid : '');
  let P = INST_CHAMPS.pools.get(cle); if (P) return P;
  const geo = new T.BufferGeometry(); Object.keys(m.geometry.attributes).forEach((k) => geo.setAttribute(k, m.geometry.attributes[k])); if (m.geometry.index) geo.setIndex(m.geometry.index); geo.groups = m.geometry.groups;
  if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere(); geo.boundingSphere = new T.Sphere(); geo.boundingBox = null; /* (la meme geometrie, memoire et tampons partages, avec sa propre sphere : celle de tous ses champs, pour que la pile soit ecartee hors de l'ecran) */
  const im = new T.InstancedMesh(geo, m.material, INST_CHAMPS.CAP); im.count = 0; im.castShadow = m.castShadow; im.receiveShadow = m.receiveShadow;
  if (m.customDepthMaterial) im.customDepthMaterial = m.customDepthMaterial; im.renderOrder = m.renderOrder; im.name = 'champs:' + (m.name || '');
  im.raycast = () => {}; /* (les clics touchent la copie cachee du champ, qui porte sa case) */
  im.instanceMatrix.setUsage(T.DynamicDrawUsage); im.visible = typeof lieu === 'undefined' || lieu === 'ferme' || lieu === 'cabane'; scene.add(im);
  P = { im, libres: [], r0: m.geometry.boundingSphere.radius }; INST_CHAMPS.pools.set(cle, P); return P;
}
function bornesInst(P) { /* la sphere de la pile : les centres de ses champs (les places libres, a l'echelle zero, ne comptent pas), elargie du rayon de la piece */
  const im = P.im, e = im.instanceMatrix.array, b = new T.Box3(), v = new T.Vector3(); let n = 0, sc = 1;
  for (let i = 0; i < im.count; i++) { const o = i * 16; if (!e[o] && !e[o + 5] && !e[o + 10]) continue; v.set(e[o + 12], e[o + 13], e[o + 14]); b.expandByPoint(v); n++; sc = Math.max(sc, Math.hypot(e[o], e[o + 1], e[o + 2])); }
  const S = im.geometry.boundingSphere; if (!n) { S.center.set(0, -1e4, 0); S.radius = 0; return; } b.getCenter(S.center); S.radius = b.getSize(v).length() / 2 + P.r0 * sc * 1.2;
}
const ZERO_INST = new T.Matrix4().makeScale(0, 0, 0);
function libererChamp(id) {
  const L = INST_CHAMPS.cases.get(id); if (!L) return; INST_CHAMPS.cases.delete(id);
  const vus = new Set(); L.forEach(({ P, i, m }) => { P.im.setMatrixAt(i, ZERO_INST); P.im.instanceMatrix.needsUpdate = true; P.libres.push(i); if (m) m.visible = true; vus.add(P); }); vus.forEach(bornesInst);
}
function instancierChamp(id) {
  const g = casesDyn[id]; if (!g || !g.parent) return; g.updateMatrixWorld(true); const L = [];
  g.traverse((m) => { if (!m.isMesh || m.isSkinnedMesh || m.isInstancedMesh || !m.visible || !m.geometry || !m.material || Array.isArray(m.material)) return;
    for (let x = m; x && x !== g; x = x.parent) if (x.userData && x.userData.tofu) return; /* (le Tofu ou le Wabbit du champ reste a part : il bouge) */
    if (m.material.transparent || m.onBeforeRender !== T.Mesh.prototype.onBeforeRender) return;
    const P = poolInst(m); let i = P.libres.length ? P.libres.pop() : P.im.count; if (i >= INST_CHAMPS.CAP) return; /* (plein : cette piece reste dessinee comme avant) */
    if (i >= P.im.count) P.im.count = i + 1; P.im.setMatrixAt(i, m.matrixWorld); P.im.instanceMatrix.needsUpdate = true; m.visible = false; L.push({ P, i, m }); });
  if (L.length) { INST_CHAMPS.cases.set(id, L); new Set(L.map((x) => x.P)).forEach(bornesInst); }
}
if (!window.__sansInstances && !/[?&]sansinst=1/.test(location.search)) { /* (?sansinst=1 dans l'adresse : l'ancien rendu, pour comparer) */
  const rendreCaseI = rendreCase; rendreCase = function (id) { libererChamp(id); const r = rendreCaseI.apply(this, arguments); try { const p = S_.cases.find((c) => c.id === id); if (p && p.type === 'champ') instancierChamp(id); } catch (e) { /* (le champ reste dessine comme avant) */ } return r; };
  const montrerIlesI = montrerIles; montrerIles = function () { const r = montrerIlesI.apply(this, arguments); INST_CHAMPS.pools.forEach((P) => { P.im.visible = lieu === 'ferme' || lieu === 'cabane'; }); return r; }; /* (ailleurs, la ferme sort du champ ; les instances, elles, ne sont pas ecartees d'office) */
  setInterval(() => { INST_CHAMPS.cases.forEach((L, id) => { const g = casesDyn[id]; if (!g || !g.parent || !L.every(({ m }) => { for (let x = m; x; x = x.parent) if (x === g) return true; return false; })) libererChamp(id); }); }, 1000); /* (une case retiree ou videe sans etre redessinee : ses instances partent) */
}
/* 3. LE PERSO FUSIONNE PAR MEMBRE (23/11/2026, « fais la fusion du perso mais fais en sorte que ca casse pas des animations ou des choses liees a
      l'equipement », Mathieu) : le perso etait fait d'environ 300 pieces (coiffe et arme portees comprises), chacune avec sa matiere et son contour,
      soit 186 appels de dessin. Les pieces fixes d'une meme partie qui bouge (le torse, la tete, chaque bras, chaque jambe, chaque genou, la coiffe,
      l'arme legendaire) et de meme apparence sont soudees en une seule ; la partie, elle, reste a sa place et bouge comme avant. Restent a part, telles
      quelles : tout ce que le jeu va chercher par son nom (l'epee, le fouet et l'arc qui passent dans la main en combat, les mains, les bras du Cra,
      le carquois...), ce qui est cache, transparent, texture ou a son propre effet de dessin. Les contours gardent leur epaisseur exacte (elle est
      cuite dans la piece soudee, comme le faisait le dessin). Seul le perso en jeu est soude (pas les portraits). ?sansfusion=1 dans l'adresse :
      l'ancien perso, pour comparer. */
const P_GARDER_PERSO = /^(lame|gorge|garde|garde_g|garde_d|poignee|pommeau|fouet|manche_fouet|pommeau_fouet|bague_fouet|meche_fouet|bout_fouet|laniere|arc|corde_arc|bout_arc|poignee_arc|carquois|carquois_bord|carquois_fond|fleche|empennage|paume|doigts|main)$/;
const P_BRAS_HAUT = /^(bras|brassard|main|mancheronne)$/; /* (le bras gauche du Cra, pose sur le torse : le jeu lui fait une epaule au premier arc en main, en prenant ces pieces dans le haut du corps) */
const TEX_MATIERE = ['map', 'alphaMap', 'aoMap', 'bumpMap', 'displacementMap', 'emissiveMap', 'envMap', 'lightMap', 'normalMap', 'specularMap', 'roughnessMap', 'metalnessMap', 'matcap'];
const PERSO_FUSIONNES = new WeakSet();
function epContourPerso(M) { /* l'epaisseur d'un contour du jeu (contourMat sans vent, ou CONTOUR), sinon null */
  if (M === CONTOUR) return 0;
  for (const k in contours) if (contours[k] === M) { const [ep, sp] = k.split('|'); return sp === 'undefined' || sp === 'null' ? +ep || 0 : null; }
  return null;
}
function cleMatPerso(M) { /* deux matieres de meme cle se dessinent pareil */
  return [M.type, M.color ? M.color.getHexString() : '', M.emissive ? M.emissive.getHexString() : '', M.emissiveIntensity, M.side, M.flatShading, M.vertexColors, M.opacity, M.alphaTest, M.depthTest, M.depthWrite, M.colorWrite,
    M.polygonOffset, M.polygonOffsetFactor, M.polygonOffsetUnits, M.blending, M.wireframe, M.fog, M.toneMapped, M.visible, M.gradientMap ? M.gradientMap.uuid : '', M.dithering, M.shininess, M.specular ? M.specular.getHexString() : '',
    M.roughness, M.metalness, M.stencilWrite, (M.clippingPlanes || []).length, JSON.stringify(M.userData || {})].join('|');
}
function piecePersoOk(m) { /* une piece qu'on peut souder sans rien changer a son dessin */
  if (!m.isMesh || m.isSkinnedMesh || m.isInstancedMesh || !m.visible || Array.isArray(m.material) || !m.material || !m.geometry || !m.geometry.isBufferGeometry) return false;
  const M = m.material, G = m.geometry, P = G.attributes.position;
  if (!P || P.itemSize !== 3 || Object.keys(G.morphAttributes || {}).length || G.drawRange.start !== 0 || G.drawRange.count !== Infinity) return false;
  if (m.onBeforeRender !== T.Mesh.prototype.onBeforeRender || m.customDepthMaterial || m.customDistanceMaterial || Object.keys(m.userData).some((k) => k !== 'ep' && k !== 'name')) return false; /* (ep : l'epaisseur notee sur les contours de versToon ; name : le nom d'origine que garde le chargeur glTF, lu nulle part) */
  if (M.transparent || M.vertexColors || TEX_MATIERE.some((k) => M[k]) || M.onBeforeRender !== T.Material.prototype.onBeforeRender) return false;
  const ep = epContourPerso(M), propre = M.onBeforeCompile === T.Material.prototype.onBeforeCompile && M.customProgramCacheKey === T.Material.prototype.customProgramCacheKey;
  if (!propre && ep == null) return false; /* (une matiere a son propre effet de dessin : elle reste a part) */
  if (!G.attributes.normal && (ep || M.type !== 'MeshBasicMaterial')) return false;
  return true;
}
function geoFusionPerso(L, inv) { /* les pieces dans le repere de leur partie ; un contour pousse de son epaisseur le long de la normale, dans le repere de sa piece, comme le faisait le dessin */
  let nv = 0, ni = 0; L.forEach(({ m }) => { const g = m.geometry; nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; });
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let ov = 0, oi = 0; const v = new T.Vector3(), n = new T.Vector3(), mt = new T.Matrix4(), nm = new T.Matrix3();
  L.forEach(({ m, ep }) => {
    mt.multiplyMatrices(inv, m.matrixWorld); nm.getNormalMatrix(mt); const g = m.geometry, P = g.attributes.position, N = g.attributes.normal;
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i); const q = (ov + i) * 3;
      if (N) { n.fromBufferAttribute(N, i); if (ep) { const l = n.length(); if (l > 0) v.addScaledVector(n, ep / l); } n.applyMatrix3(nm).normalize(); nor[q] = n.x; nor[q + 1] = n.y; nor[q + 2] = n.z; }
      v.applyMatrix4(mt); pos[q] = v.x; pos[q + 1] = v.y; pos[q + 2] = v.z;
    }
    const miroir = mt.determinant() < 0, nb = g.index ? g.index.count : P.count, id = (i) => (g.index ? g.index.getX(i) : i) + ov; /* (une piece en miroir : ses triangles retournes, comme dans fusionGeo) */
    for (let i = 0; i < nb; i += 3) { idx[oi + i] = id(i); idx[oi + i + 1] = id(miroir ? i + 2 : i + 1); idx[oi + i + 2] = id(miroir ? i + 1 : i + 2); }
    ov += P.count; oi += nb;
  });
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.BufferAttribute(nor, 3)); geo.setIndex(new T.BufferAttribute(idx, 1));
  geo.computeBoundingSphere(); geo.computeBoundingBox(); return geo;
}
function fusionnerPerso(g) {
  g.updateMatrixWorld(true); const paquets = new Map(), pieces = [];
  const visible = (o) => { for (let x = o; x && x !== g; x = x.parent) if (!x.visible) return false; return true; };
  let arcDuCra = false; g.traverse((o) => { if (o.isMesh && nomP(o) === 'bout_arc') arcDuCra = true; });
  const horsMain = (o) => { for (let x = o; x && x !== g; x = x.parent) if (x.name === 'arc_main' || (arcDuCra && x.name === 'arme_legendaire')) return false; return true; }; /* (l'arc legendaire du Cra reste tel quel : pour le prendre en main, le jeu lit un sommet sur trois de son modele, l'ordre des sommets compte) */
  const cleObj = (m) => [m.castShadow ? 1 : 0, m.receiveShadow ? 1 : 0, m.renderOrder, m.frustumCulled ? 1 : 0, m.layers.mask].join(':');
  const mettre = (ancre, m) => {
    const M = m.material, ep = epContourPerso(M), contour = ep != null && M.side === T.BackSide;
    const cle = ancre.uuid + '|' + cleObj(m) + '|' + (contour ? 'contour:' + (M === CONTOUR ? 'C' : 'K') + ':' + M.color.getHexString() : cleMatPerso(M));
    if (!paquets.has(cle)) paquets.set(cle, { ancre, ex: m, mat: contour ? (M === CONTOUR ? CONTOUR : contourMat(0)) : M, L: [] }); /* (un contour : sa forme poussee est cuite, la matiere commune n'a plus a pousser) */
    paquets.get(cle).L.push({ m, ep: contour ? ep : 0 });
  };
  g.traverse((m) => {
    if (!m.isMesh || m === g || !m.parent || m.parent.isMesh) return; /* (une piece de premier rang ; ses contours viennent avec elle) */
    if (P_GARDER_PERSO.test(nomP(m)) || (P_BRAS_HAUT.test(nomP(m)) && nomP(m.parent) === 'haut') || !visible(m) || !horsMain(m) || !piecePersoOk(m)) return;
    if (!m.children.every((k) => k.isMesh && !k.children.length && piecePersoOk(k))) return; /* (une piece qui porte autre chose que ses contours reste, avec ce qu'elle porte) */
    pieces.push(m);
  });
  pieces.forEach((m) => { mettre(m.parent, m); m.children.forEach((k) => mettre(m.parent, k)); });
  const soudees = []; paquets.forEach((pq) => {
    const f = new T.Mesh(geoFusionPerso(pq.L, new T.Matrix4().copy(pq.ancre.matrixWorld).invert()), pq.mat); f.name = 'fusion_perso'; /* (un nom : le salto du Iop fait tourner les enfants nommes du perso) */
    f.castShadow = pq.ex.castShadow; f.receiveShadow = pq.ex.receiveShadow; f.renderOrder = pq.ex.renderOrder; f.frustumCulled = pq.ex.frustumCulled; f.layers.mask = pq.ex.layers.mask; soudees.push([pq.ancre, f]); });
  soudees.forEach(([a, f]) => a.add(f)); pieces.forEach((m) => m.parent.remove(m)); /* (tout est calcule avant de toucher au perso : une erreur le laisse tel quel) */
  g.userData.fusionPerso = { pieces: pieces.length, soudees: soudees.length };
  return g;
}
if (!/[?&]sansfusion=1/.test(location.search) && !window.__sansFusionPerso) {
  let ancien = null; /* (le dernier perso soude : quand il est remplace (rhabiller, changement de look), ses pieces soudees, a lui seul, sont liberees de la carte graphique) */
  const marcherF = marcher; marcher = function () { /* (avant le reste de l'image : l'arme n'est pas encore passee dans la main) */
    const g = paysanMesh;
    if (ancien && ancien !== g && !ancien.parent) { ancien.traverse((o) => { if (o.isMesh && o.name === 'fusion_perso') o.geometry.dispose(); }); ancien = null; }
    if (g && !PERSO_FUSIONNES.has(g)) { const u = g.userData; if (!u.epeeMain && !u.fouetMain && !u.arcMain) { PERSO_FUSIONNES.add(g); try { fusionnerPerso(g); ancien = g; } catch (e) { console.warn('fusion du perso', e); } } }
    return marcherF.apply(this, arguments); };
}
