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
