'use strict';
/* LES BWORKS, NOUVELLE VERSION, DANS L'ARENE DEV (16/11/2026, « refaire visuellement le Bworker et ses mobs, ils sont a l'ancienne version, sans squelette
   et sans notre patte graphique actuelle », Mathieu). Les 5 modeles Rodin, le rendu B choisi au formulaire (ombres de la variante 5 : seuil net, ombre teintee
   olive, lumiere en haut a gauche de l'ecran ; contour fin vert fonce de la variante 6 ; teinte chaude cuite dans la texture, outils/bworks/cuire_aplats.py),
   un squelette Mixamo cale sans le site de Mixamo (blender/placer-squelette.py, lier-squelette.py), les mouvements des packs et leurs armes faites main
   (blender/monstre-anime.py, armes-bworks.py) : assets/modeles/jeu/<nom>-anime-v2.glb. Un choix dans l'Arene dev : ancienne version ou nouvelle (garde dans
   ce navigateur), pour le prochain combat ; les joueurs gardent l'ancienne tant que Mathieu n'a pas valide. Suivi : maquettes/bworks/BWORKS.md. */
let VERSION_BWORKS = (() => { try { return localStorage.getItem('ferme-version-bworks') === 'nouvelle' ? 'nouvelle' : 'ancienne'; } catch (err) { return 'ancienne'; } })();
/* type du monstre -> [nom du modele, hauteur en jeu, vitesse de ses animations] */
const BWORKS_V2 = { bwork: ['bwork', 2.0, 1.4], bworkArcher: ['bwork-archer', 1.95, 1.4], bworkMage: ['bwork-mage', 1.85, 1.35], bworkette: ['bworkette', 1.65, 1.6], bworker: ['bworker', 3.3, 1.3] };
const NOMS_BW2 = new Set(Object.values(BWORKS_V2).map(([n]) => n + '-v2'));
for (const [n, h, v] of Object.values(BWORKS_V2)) { SQUELETTES_A_CHARGER.push([n + '-v2', 'assets/modeles/jeu/' + n + '-anime-v2.glb', h]); VITESSE_FAMILLE[n + '-v2'] = v; }
/* le rendu B : la matiere toon du jeu, dont seule la sortie change (l'ombre teintee a seuil net, calculee sur la normale vue de la camera : la lumiere vient
   toujours du haut a gauche de l'ecran, comme sur la planche validee) ; l'eclat rouge d'un coup et la lueur de rage (emissive) s'ajoutent par-dessus */
const RENDU_B = { ombre: { value: new T.Vector3(0.44, 0.50, 0.36) }, dir: { value: new T.Vector3(-0.75, 0.6, 0.3).normalize() }, contour: '#2f3b1a', ep: 0.006 };
function matiereB(m) {
  m.onBeforeCompile = (sh) => { sh.uniforms.uOmbreB = RENDU_B.ombre; sh.uniforms.uDirB = RENDU_B.dir;
    sh.fragmentShader = 'uniform vec3 uOmbreB;\nuniform vec3 uDirB;\n' + sh.fragmentShader.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
      'float lB = smoothstep(0.02, 0.10, dot(normal, uDirB));\ngl_FragColor = vec4(mix(diffuseColor.rgb * uOmbreB, diffuseColor.rgb, lB) + totalEmissiveRadiance, diffuseColor.a);'); };
  m.customProgramCacheKey = () => 'rendu-b'; m.needsUpdate = true; return m;
}
const CONTOURS_B = {}; /* (un contour par epaisseur : 0,006 en unites du jeu, quelle que soit l'echelle du modele) */
function contourB(e, peau) { const cle = e.toFixed(5) + (peau ? 's' : ''); if (CONTOURS_B[cle]) return CONTOURS_B[cle];
  const m = new T.MeshBasicMaterial({ color: RENDU_B.contour, side: T.BackSide, skinning: !!peau });
  m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * ' + e.toFixed(5) + ';'); };
  m.customProgramCacheKey = () => 'contour-b-' + cle; return (CONTOURS_B[cle] = m); }
function habillerB(M) {
  M.updateMatrixWorld(true); const v = new T.Vector3(), peaux = [], armes = [];
  M.traverse((o) => { if (o.isSkinnedMesh && o.name !== 'contour') peaux.push(o); else if (o.isMesh && !o.isSkinnedMesh && o.name !== 'contour-b') armes.push(o); });
  peaux.forEach((o) => { const map = o.material.map; o.material = matiereB(new T.MeshToonMaterial({ color: '#ffffff', map, gradientMap: grad, skinning: true, side: T.DoubleSide }));
    const k = o.parent && o.parent.children.find((c) => c.name === 'contour' && c.isSkinnedMesh && c.geometry === o.geometry); if (k) k.material = contourB(RENDU_B.ep / o.getWorldScale(v).x, true); });
  armes.forEach((o) => { const c = (o.material.color || new T.Color('#888888')).clone().convertLinearToSRGB(); /* (le glb donne des couleurs lineaires, le jeu les affiche telles quelles) */
    o.material = matiereB(new T.MeshToonMaterial({ color: c, gradientMap: grad, side: T.DoubleSide })); o.castShadow = true;
    const k = new T.Mesh(o.geometry, contourB(RENDU_B.ep / o.getWorldScale(v).x, false)); k.name = 'contour-b'; o.add(k); });
}
const chargerSquelette1 = chargerSquelette; chargerSquelette = async function (nom, url, h) { await chargerSquelette1(nom, url, h); const M = MODELES[nom];
  if (NOMS_BW2.has(nom) && M && !M.userData.habilleB) { habillerB(M); M.userData.habilleB = true; } };
const clonerSquelette1 = clonerSquelette; clonerSquelette = function (nom) { const g = clonerSquelette1(nom); /* (la copie d'une matiere perd son onBeforeCompile) */
  if (NOMS_BW2.has(nom)) g.traverse((o) => { if (o.isSkinnedMesh && o.name !== 'contour') matiereB(o.material); }); return g; };
/* la hache lancee du Bworker : la sienne (manche court), qui quitte sa main le temps du vol */
const armeJet1 = armeJet; armeJet = function (type, k) {
  const M = MODELES['bworker-v2'], src = type === 'hache' && VERSION_BWORKS === 'nouvelle' && M && M.getObjectByName('hache-bworker'); if (!src) return armeJet1(type, k);
  M.updateMatrixWorld(true); const s = src.getWorldScale(new T.Vector3()).x * 1.15, g = new T.Group(), c = src.clone(true); c.position.set(0, -0.12 * s, 0); c.rotation.set(0, 0, 0); c.scale.setScalar(s); g.add(c);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return g; };
const majSquelette1 = majSquelette; majSquelette = function (mo, v, dt) { majSquelette1(mo, v, dt);
  if (!mo.d || !mo.d.jet || !mo.m || !NOMS_BW2.has(mo.d.modele)) return; const h = mo.hacheMain || (mo.hacheMain = mo.m.getObjectByName('hache-bworker')); if (!h) return;
  if (mo.jetT != null && mo.jetAvant != null && mo.jetT < mo.jetAvant) mo.jetVol = 0; mo.jetAvant = mo.jetT; if (mo.jetVol != null) mo.jetVol += dt;
  h.visible = !(mo.jetVol != null && mo.jetVol < mo.d.jet.prepa + 0.5); };
/* le choix de version */
async function preparerBworksV2() { await chargerSquelettes([...NOMS_BW2]); }
function appliquerBworksV2() {
  const neuf = VERSION_BWORKS === 'nouvelle';
  Object.entries(BWORKS_V2).forEach(([t, [n]]) => { const d = MONSTRES[t]; if (!d) return; if (!('modeleV1' in d)) { d.modeleV1 = d.modele; d.gestesV1 = d.gestes; d.gesteSoinV1 = d.gesteSoin; }
    const ok = neuf && MODELES[n + '-v2']; d.modele = ok ? n + '-v2' : d.modeleV1;
    d.gestes = ok && d.jet ? Object.assign({}, d.gestesV1, { jet: 'jet' }) : d.gestesV1; d.gesteSoin = ok && d.soigne ? true : d.gesteSoinV1; });
}
async function choisirVersionBworks(v) {
  VERSION_BWORKS = v === 'nouvelle' ? 'nouvelle' : 'ancienne'; try { localStorage.setItem('ferme-version-bworks', VERSION_BWORKS); } catch (err) { /* rien */ }
  if (VERSION_BWORKS === 'nouvelle') { toast('Chargement de la nouvelle version des Bworks…'); await preparerBworksV2(); } appliquerBworksV2();
  toast(VERSION_BWORKS === 'nouvelle' ? 'Bworks : nouvelle version (animée, rendu B).' : 'Bworks : ancienne version.', 'or');
}
if (VERSION_BWORKS === 'nouvelle') setTimeout(() => { preparerBworksV2().then(appliquerBworksV2); }, 6500); /* (choisie a une visite precedente : chargee apres le demarrage) */
