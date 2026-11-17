'use strict';
/* LES BWORKS, NOUVELLE VERSION, DANS L'ARENE DEV (16/11/2026, « refaire visuellement le Bworker et ses mobs, ils sont a l'ancienne version, sans squelette
   et sans notre patte graphique actuelle », Mathieu). Les 5 modeles Rodin, le rendu B choisi au formulaire (ombres de la variante 5 : seuil net, ombre teintee
   olive, lumiere en haut a gauche de l'ecran ; contour fin vert fonce de la variante 6 ; teinte chaude cuite dans la texture, outils/bworks/cuire_aplats.py),
   un squelette Mixamo cale sans le site de Mixamo (blender/placer-squelette.py, lier-squelette.py), les mouvements des packs et leurs armes faites main
   (blender/monstre-anime.py, armes-bworks.py) : assets/modeles/jeu/<nom>-anime-v2.glb. Un choix dans l'Arene dev : ancienne version ou nouvelle (garde dans
   ce navigateur), pour le prochain combat ; les joueurs gardent l'ancienne tant que Mathieu n'a pas valide. Suivi : maquettes/bworks/BWORKS.md. */
/* (16/11/2026 au soir, « ok tu peux les push », Mathieu : la nouvelle version pour tous ; « ancienne » ne reste qu'au choix dans l'Arene dev, pour comparer) */
/* (17/11/2026, « je viens de faire le Bworker dans les boss à refaire, ça me met l'ancien », Mathieu : son navigateur gardait « Ancienne », choisie un jour
   pour comparer. Les Bworks sont sortis pour tous : chaque chargement repart sur la nouvelle version, « Ancienne » ne vaut que jusqu'au rechargement) */
let VERSION_BWORKS = 'nouvelle'; try { localStorage.removeItem('ferme-version-bworks'); } catch (err) { /* rien */ }
/* type du monstre -> [nom du modele, hauteur en jeu, vitesse de ses animations] */
const BWORKS_V2 = { bwork: ['bwork', 2.8, 1.4], bworkArcher: ['bwork-archer', 2.5, 1.4], bworkMage: ['bwork-mage', 2.4, 1.35], bworkette: ['bworkette', 2.2, 1.6], /* (+35 % le 16/11 au soir : « ils sont limite plus petits que moi », Mathieu) */ bworker: ['bworker', 3.9, 1.3] }; /* (17/11/2026, « des jambes moins longues au Bworker », Mathieu : jambes raccourcies, haut du corps a la meme taille, 4,6 -> 3,9) */ /* (le Bworker : 3,3 puis 3,8, « fais-le un peu plus grand », puis 5,7 le soir par Discord, « fais-le 50 % plus grand », puis 4,6, « reduis de 20 % », et elargi de 20 %, Mathieu, 16/11/2026) */
const NOMS_BW2 = new Set(Object.values(BWORKS_V2).map(([n]) => n + '-v2'));
for (const [n, h, v] of Object.values(BWORKS_V2)) { SQUELETTES_A_CHARGER.push([n + '-v2', 'assets/modeles/jeu/' + n + '-anime-v2.glb', h]); VITESSE_FAMILLE[n + '-v2'] = v; }
/* le rendu B : la matiere toon du jeu, dont seule la sortie change (l'ombre teintee a seuil net, calculee sur la normale vue de la camera : la lumiere vient
   toujours du haut a gauche de l'ecran, comme sur la planche validee) ; l'eclat rouge d'un coup et la lueur de rage (emissive) s'ajoutent par-dessus */
/* (17/11/2026, « creux + ombre grise c'est mieux », Mathieu : l'ombre olive 0,44 / 0,50 / 0,36 se confondait avec la peau verte, gris froid ; les creux sont cuits dans la texture) */
const RENDU_B = { ombre: { value: new T.Vector3(0.6, 0.59, 0.65) }, dir: { value: new T.Vector3(-0.75, 0.6, 0.3).normalize() }, contour: '#2f3b1a', ep: 0.006 };
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
  M.updateMatrixWorld(true); const s = src.getWorldScale(new T.Vector3()).x * 1.15 * (k || 1) / Math.max(1, (BWORKS_V2.bworker[1] + 0.35) / 3.2), g = new T.Group(), /* (k : sa taille ; le Bworker colossal de l'ile lance une hache une fois et demie plus grande) */ c = src.clone(true); c.position.set(0, -0.12 * s, 0); c.rotation.set(0, 0, 0); c.scale.setScalar(s); g.add(c);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); g.visible = false; armeJet.derniere = g; return g; }; /* (cachee jusqu'au lacher : c'est la hache de sa main qu'on voit pendant l'elan) */
/* (16/11/2026 : le lancer est repere au moment meme ou le sort part, dans capJet ; le reperer a la chute de son minuteur ratait des lancers, et sa hache
   restait dans sa main pendant que l'autre volait. Son geste de lancer passe aussi devant un coup deja commence, sinon il etait saute) */
const capJet1 = capJet; capJet = function (mo, ctx) { const avant = mo.jetT; capJet1(mo, ctx);
  if (!mo.d || !mo.d.jet || !mo.m || !NOMS_BW2.has(mo.d.modele) || !(mo.jetT === 0 && avant !== 0)) return;
  /* (16/11/2026 au soir, par Discord : « le jet de hache, juste avant de la jeter, la hache n'est pas dans sa main », Mathieu. Pendant l'elan il garde sa hache
     en main et la hache lancee reste cachee ; au lacher (le meme instant que capJet : la preparation moins le vol), elle part de sa main, et son geste de
     lancer est cale sur ce lacher) */
  const pp = paysanMesh.position, dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); mo.jetTl = mo.d.jet.prepa - Math.max(0.45, Math.min(0.75, dP / 16));
  mo.jetVol = 0; mo.hacheVol = armeJet.derniere || null; armeJet.derniere = null;
  const an = mo.m.userData.anim; if (an && an.F.jet) { mo.geste = null; gesteSort(mo, 'jet', Math.max(0.3, mo.jetTl + 0.2)); } }; /* (le coup du geste 0,2 s apres le lacher : la hache part bras en avant, pas au ras du sol) */
{ const i = CAPACITES.indexOf(capJet1); if (i >= 0) CAPACITES[i] = capJet; }
/* (16/11/2026, « qu'il soit comme celui actuel en termes de delai », Mathieu : un boss a squelette rugit a son arrivee et a sa rage, 1,35 s ou il ne fait rien ;
   l'ancien Bworker ne rugissait pas, son premier sort venait 1,4 s plus tot sur l'ile. Les nouveaux Bworks ne rugissent donc pas d'eux-memes) */
const majSquelette1 = majSquelette; majSquelette = function (mo, v, dt) { if (mo.d && NOMS_BW2.has(mo.d.modele)) { mo.rugiArrivee = true; mo.rugiRage = true; } majSquelette1(mo, v, dt);
  if (!mo.d || !mo.d.jet || !mo.m || !NOMS_BW2.has(mo.d.modele)) return; const h = mo.hacheMain || (mo.hacheMain = mo.m.getObjectByName('hache-bworker')); if (!h) return;
  if (mo.jetVol == null) { h.visible = true; return; } mo.jetVol += dt; const tl = mo.jetTl || 0, p = mo.hacheVol;
  h.visible = mo.jetVol < tl || mo.jetVol >= mo.d.jet.prepa + 0.5; /* (en main pendant l'elan, au sol pendant le vol et l'impact, puis rendue) */
  if (p) { if (mo.jetVol < tl + 0.1) { h.updateWorldMatrix(true, false); h.getWorldPosition(p.position); } p.visible = mo.jetVol >= tl; if (mo.jetVol > mo.d.jet.prepa + 1) mo.hacheVol = null; } };
/* le baton du Mage reste droit (16/11/2026 au soir, par Discord : « le baton, on le voit ballotter dans tous les sens », Mathieu) : il suit la main, mais garde
   l'axe vertical et le devant du Mage ; il tourne autour de l'endroit ou la main le tient (prise_y, pose par blender/monstre-anime.py) */
const V_HAUT = new T.Vector3(0, 1, 0);
function tenirBaton(mo) {
  const st = mo.baton !== undefined ? mo.baton : (mo.baton = (() => { const b = mo.m.getObjectByName('baton-bwork'); if (!b || !b.parent) return null; const py = (b.userData && b.userData.prise_y) || 0;
    return { b, h: b.parent, py, prise: b.position.clone().add(new T.Vector3(0, py * b.scale.y, 0).applyQuaternion(b.quaternion)) }; })());
  if (!st) return; const { b, h, py, prise } = st; h.updateWorldMatrix(true, false);
  const G = h.localToWorld(prise.clone()), f = new T.Vector3(0, 0, 1).applyQuaternion(mo.m.getWorldQuaternion(new T.Quaternion())); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, 1); f.normalize();
  const x = new T.Vector3().crossVectors(V_HAUT, f).normalize(), z = new T.Vector3().crossVectors(x, V_HAUT), qW = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x, V_HAUT, z));
  const sW = new T.Vector3(); h.getWorldScale(sW); const O = G.addScaledVector(V_HAUT, -py * b.scale.y * sW.y);
  b.quaternion.copy(h.getWorldQuaternion(new T.Quaternion()).invert().multiply(qW)); b.position.copy(h.worldToLocal(O));
}
const majSquelette2 = majSquelette; majSquelette = function (mo, v, dt) { majSquelette2(mo, v, dt); if (mo.d && mo.m && mo.d.modele === 'bwork-mage-v2') tenirBaton(mo); };
/* le tourbillon du Bworker (16/11/2026, « verifie leur animation de sort », Mathieu) : il tournait d'un bloc dans sa pose de repos. Il joue maintenant son
   mouvement « 360 » a la hache, etale sur l'elan et le tour (il arme pendant l'elan, tourne quand la zone part) ; le corps ne tourne plus en plus de l'animation */
const capTourbillon1 = capTourbillon; capTourbillon = function (mo, ctx) { const avant = mo.tourb; capTourbillon1(mo, ctx);
  if (avant || !mo.tourb || !mo.d || !NOMS_BW2.has(mo.d.modele) || !mo.m) return; const an = mo.m.userData.anim, W = mo.d.tourbillon; if (!an || !an.F.tourbillon) return;
  if (!mo.tourneB) { mo.tourneB = true; Object.defineProperty(mo, 'tourne', { get: () => 0, set: () => {}, configurable: true }); }
  const nom = piocher(an, 'tourbillon'), D = an.A[nom].getClip().duration, d = W.prepa + 0.75, a = jouerAnim(an, nom, 0.1); if (!a) return; a.timeScale = D / d; mo.geste = { t: 0, d }; };
{ const i = CAPACITES.indexOf(capTourbillon1); if (i >= 0) CAPACITES[i] = capTourbillon; } /* (la liste des capacites garde la fonction d'origine : on y met la nouvelle) */
/* LEURS COUPS, COMME AVANT (16/11/2026 au soir, « qu'il soit comme celui actuel en termes de delai de recup, degats, etc. dans l'ile du boss », Mathieu) : un monstre
   a squelette porte son coup a l'instant de son geste (jusqu'a 0,42 s plus tard, et rien si le perso a file entre-temps) ; les anciens Bworks frappaient tout de suite.
   Les nouveaux frappent donc tout de suite, a la meme cadence, et leur geste est joue a partir de l'instant du coup (on voit la fin de l'elan) */
const attaqueSquelette1 = attaqueSquelette; attaqueSquelette = function (mo, fam, frapper) {
  if (!mo.d || !NOMS_BW2.has(mo.d.modele)) return attaqueSquelette1(mo, fam, frapper);
  const an = mo.m && mo.m.userData.anim; if (an && !mo.geste) { if (!an.F[fam]) fam = an.F.coup ? 'coup' : null;
    if (fam) { const nom = piocher(an, fam), a = jouerAnim(an, nom, 0.06); if (a) { const d0 = a.getClip().duration, t0 = (((mo.m.userData.impacts || {})[nom] || [])[0] || { t: d0 * 0.45 }).t, k = 1.2 * vitAnim(mo);
      a.time = Math.max(0, t0 - 0.12 * k); a.timeScale = k; mo.geste = { t: 0, d: Math.min(0.5, (d0 - a.time) / k) }; } } }
  frapper(); };
/* L'ILE DES BOSS (16/11/2026) : le boss y sort seul, sans chargement prealable ; un modele a squelette absent arrivait apres coup et le combat, vide, se terminait.
   La semaine du Bworker, ses modeles (et ceux des Bworks qu'il appelle) sont charges avant l'essai, comme avant une vague */
const lancerIleBoss1 = lancerIleBoss; lancerIleBoss = function () {
  let manque = []; try { manque = VERSION_BWORKS === 'nouvelle' && bossDuJour(semaineIleBoss()) === 'bworker' ? ['bworker-v2', 'bwork-v2'].filter((n) => !MODELES[n]) : []; } catch (err) { manque = []; }
  if (!manque.length) return lancerIleBoss1();
  if (lancerIleBoss.charge) return; lancerIleBoss.charge = true; toast('Le Bworker colossal arrive…', 'or');
  chargerSquelettes(manque).then(() => { prechaufferSquelettes(manque); }).catch(() => {}).finally(() => { lancerIleBoss.charge = false; lancerIleBoss1(); }); };
/* le choix de version */
async function preparerBworksV2() { await chargerSquelettes([...NOMS_BW2]); }
function appliquerBworksV2() {
  const neuf = VERSION_BWORKS === 'nouvelle';
  Object.entries(BWORKS_V2).forEach(([t, [n]]) => { const d = MONSTRES[t]; if (!d) return; if (!('modeleV1' in d)) { d.modeleV1 = d.modele; d.gestesV1 = d.gestes; d.gesteSoinV1 = d.gesteSoin; }
    const ok = neuf; d.modele = ok ? n + '-v2' : d.modeleV1; /* (charge a la demande : apparaitre et lancerVague chargent un modele a squelette absent) */
    d.gestes = ok && d.jet ? Object.assign({}, d.gestesV1, { jet: 'jet' }) : d.gestesV1; d.gesteSoin = ok && d.soigne ? true : d.gesteSoinV1; });
}
async function choisirVersionBworks(v) {
  VERSION_BWORKS = v === 'nouvelle' ? 'nouvelle' : 'ancienne';
  if (VERSION_BWORKS === 'nouvelle') { toast('Chargement de la nouvelle version des Bworks…'); await preparerBworksV2(); } appliquerBworksV2();
  toast(VERSION_BWORKS === 'nouvelle' ? 'Bworks : nouvelle version (animée, rendu B).' : 'Bworks : ancienne version.', 'or');
}
/* LA HACHE LANCEE DU CASQUE DU BWORKER (17/11/2026, « la hache qu'on jette aussi », Mathieu) : le sort Hache lancee du joueur lance la hache courte du
   nouveau Bworker (assets/modeles/jeu/hache-bworker.glb, 29 Ko, la meme que dans sa main), en toon comme les pieces du perso, aussi longue que l'ancienne
   grande hache (1,4). Chargee des que le casque est porte ; tant qu'elle ne l'est pas, l'ancienne hache part a sa place */
let hacheBwSc = null, hacheBwPromesse = null;
const chargerHacheBw = () => hacheBwPromesse || (hacheBwPromesse = chargerGlb('assets/modeles/jeu/hache-bworker.glb?v=' + VERSION_MODELES)
  .then((sc) => { hacheBwSc = versToon(sc, { normales: 0.012, sansContour: SC_BATI }); try { partager(hacheBwSc); } catch (err) { /* rien */ } return true; }).catch(() => { hacheBwPromesse = null; return false; }));
function hacheJoueurBw() {
  const src = hacheBwSc && hacheBwSc.getObjectByName('hache-bworker'); if (!src) { chargerHacheBw(); return null; }
  const s = 1.7, g = new T.Group(), c = src.clone(true); c.position.set(0, -0.12 * s, 0); c.rotation.set(0, 0, 0); c.scale.setScalar(s); g.add(c);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return g;
}
const rafraichirTenueBw = rafraichirTenue; rafraichirTenue = function () { if (legPorte('bworker')) chargerHacheBw(); return rafraichirTenueBw.apply(this, arguments); };
appliquerBworksV2(); /* (au demarrage : la version choisie ; les modeles se chargent quand les Bworks arrivent, rien au lancement du jeu) */
