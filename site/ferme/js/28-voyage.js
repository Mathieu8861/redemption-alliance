'use strict';
/* ---------- le voyage ---------- */
async function chargerCasino() {
  if (ileCasino) return;
  /* LE NOUVEAU CASINO, le Palais du Chat Dore (07/11/2026) : l'ile (blender/iles.py version 10) et son decor (blender/casino.py --jeu2), charges au premier
     voyage ; les plantes bercees par le vent chacune a son rythme, l'eau, les nappes, les jets, la cascade et les drapeaux animes (js/26b-casino-decor.js) */
  const [cases, decor, drag] = await Promise.all([chargerGlb('assets/modeles/jeu/ile-casino2-cases.glb?v=' + VERSION_MODELES), chargerGlb('assets/modeles/jeu/casino2-jeu.glb?v=' + VERSION_MODELES), chargerGlb('assets/modeles/jeu/dragodindes.glb?v=' + VERSION_MODELES)]);
  versToon(cases, { echelle: 0.012, souple: SOUPLE_ILE, sansContour: SC_CASINO_SOL, douce: true, centre: true });
  const g = new T.Group(); g.position.copy(CASINO); const sol = fusionner(cases.getObjectByName('IleCasinoCases') || cases, {}); sol.traverse((m) => { if (m.isMesh) m.castShadow = false; }); g.add(sol); /* (08/11/2026, « ca full lag » : le sol ne fait pas d'ombre, il est plat ; il la recoit) */
  versToon(decor, { normales: 0.012, souple: SOUPLE_CASINO, sansContour: SC_CASINO }); g.add(decor); g.updateMatrixWorld(true);
  const nomBase = (m) => m.name.replace(/\.?\d+$/, '').replace(/_\d+$/, '');
  fusionner(decor, { garder: (m) => ['eau', 'eau_canal', 'drapeau'].includes(nomBase(m)) }); casinoAnim = casinoVivant(T, decor);
  grilleCasino(); /* (les chemins du perso : la grille se calcule une fois) */
  versToon(drag, { normales: 0.01, sansContour: SC_MONSTRES });
  DRAGOS.forEach((d) => { MODELES['course_' + d.id] = gabarit(drag, d.id, 1.25, 'y'); });
  scene.add(g); ileCasino = g; scene.add(soleil.target);
}
function soleilVers(c) { soleil.position.set(c.x - 16, 28, c.z + 12); soleil.target.position.set(c.x, 0, c.z); soleil.target.updateMatrixWorld(); }
/* L'ILE RONDE est grande (60 cases de large au niveau 200) : la boite des ombres suit ce qu'on regarde, a la taille du zoom, au lieu de couvrir toute l'ile */
function suivreOmbres() {
  const c = suivreOmbres.c || (suivreOmbres.c = new T.Vector3(1e9, 0, 0)), r = Math.round(Math.max(22, Math.max(camera.right, camera.top) * 1.7));
  if (Math.abs(c.x - VISEE.x) + Math.abs(c.z - VISEE.z) < 0.5 && suivreOmbres.r === r) return;
  c.set(VISEE.x, 0, VISEE.z); suivreOmbres.r = r; if (!soleil.target.parent) scene.add(soleil.target); soleilVers(c);
  Object.assign(soleil.shadow.camera, { left: -r, right: r, top: r, bottom: -r, far: 140 }); soleil.shadow.camera.updateProjectionMatrix(); rendu.shadowMap.needsUpdate = true;
}
/* LES ILES DE LA MONTGOLFIERE (refonte du 16/10/2026) : le Casino, l'Arene et l'ile des boss se rejoignent par le meme voyage (allerSur), et on en
   revient par le meme retour (rentrerFerme). lieu dit ou est le perso : 'ferme', 'casino', 'arene' ou 'ile' (avant : trois drapeaux, auCasino, enArene
   et enIleBoss). Seule l'ile ou l'on est est dessinee : le Casino et l'ile des boss, au meme endroit, pouvaient se superposer. */
let lieu = 'ferme';
const VOYAGES = {
  casino: { centre: CASINO, charger: () => chargerCasino(), zoom: () => Math.max(zoom, 0.6) },
  arene: { centre: ARENE, charger: () => chargerArene(), zoom: () => 0.6 }, /* (0,72 avant l'agrandissement du 30/10/2026) */
  ile: { centre: ILE_BOSS, charger: () => chargerIleBoss(), zoom: () => 0.72 },
};
function montrerIles() { if (ileCasino) ileCasino.visible = lieu === 'casino' && !casinoDedans; if (salleCasino) salleCasino.visible = lieu === 'casino' && casinoDedans; /* (le grand hall du palais, 08/11/2026) */ if (ileArene) ileArene.visible = lieu === 'arene'; if (ileBoss) ileBoss.visible = lieu === 'ile'; }
function peutPartir(nom) { /* ce qui empeche tout voyage : une attaque en cours, ou etre deja sur une autre ile */
  if (combat || raidAnnonce || voleur || simuEnAttente || S_.simuDue) { toast('Impossible de partir pendant une attaque.'); return false; }
  if (lieu !== 'ferme' && lieu !== nom) { toast('Rentre d\'abord à la ferme.'); return false; }
  return true;
}
async function allerSur(nom) { /* le ballon decolle : le voile, l'ile chargee, puis la camera et les ombres sur elle (une boite fixe de 32) ; false si le chargement a rate */
  const I = VOYAGES[nom]; chemin = []; arrivee = null; fileActions.length = 0; $('voile').classList.add('on');
  try { await Promise.all([I.charger(), attendreMs(750)]); } catch (e) { $('voile').classList.remove('on'); return false; }
  lieu = nom; montrerIles();
  zoom = I.zoom(); VISEE.set(I.centre.x + 0.6, 0.6, I.centre.z + 0.6); placerCamera(); cadrer(); soleilVers(I.centre);
  Object.assign(soleil.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, far: 100 }); soleil.shadow.camera.updateProjectionMatrix(); suivreOmbres.r = null; rendu.shadowMap.needsUpdate = true;
  setTimeout(() => $('voile').classList.remove('on'), 120);
  return true;
}
async function partirCasino() {
  if (!peutPartir('casino')) return;
  if (!S_.montgolfiere) return;
  if (casinoEnTravaux()) { toast('Le Casino est fermé pour cause de travaux : il rouvre bientôt, plus grand et plus beau !', 'alerte'); return; }
  casinoDedans = false;
  if (dette()) { toast('Le Casino t\'est fermé tant que ton ardoise n\'est pas réglée.', 'alerte'); return; }
  fermerModale();
  if (!(await allerSur('casino'))) { toast('Le ballon n\'a pas pu décoller (chargement de l\'île), réessaie.', 'alerte'); return; }
  const u = paysanMesh.userData; paysanMesh.position.set(CASINO.x + SPOTS.retour[0] + 0.4, CASINO.y, CASINO.z + SPOTS.retour[1]); u.y = CASINO.y; u.angle = Math.PI / 2; paysanMesh.rotation.y = u.angle; casinoMarche = null; /* (on descend du ballon au ponton, a l'ouest, face a l'allee des Kamas) */
  VISEE.set(paysanMesh.position.x + 6, 0.6, paysanMesh.position.z); placerCamera();
  etatCasino(); majBarreCasino(); $('casino-barre').hidden = false; $('hud').classList.add('au-casino'); compter('casinoVisites');
  toast('Bienvenue au Palais du Chat Doré ! Le palais au nord, l\'hippodrome au sud, les jardins à l\'est : touche un endroit pour y aller.', 'or'); sauver();
}
async function rentrerFerme() {
  if (lieu === 'ferme') return; if (combat) return;
  if (course) { toast('Attends la fin de la course.'); return; }
  fermerModale(); $('voile').classList.add('on'); await attendreMs(700);
  lieu = 'ferme'; casinoDedans = false; if (angleAvantSalle != null) { angleCam = angleAvantSalle; angleAvantSalle = null; } montrerIles(); /* (les iles ne sont plus dessinees ni animees une fois rentre) */ casinoMarche = null; $('casino-barre').hidden = true; $('hud').classList.remove('au-casino'); if (modaleOuverte) { areneSuite = true; fermerModale(); areneSuite = false; }
  const libres = S_.cases.filter((c) => PASSABLE[c.type]).map((c) => [c, posCase(c)]).sort((a, b) => Math.hypot(a[1].x - POS_MONTGOLFIERE.x, a[1].z - POS_MONTGOLFIERE.z) - Math.hypot(b[1].x - POS_MONTGOLFIERE.x, b[1].z - POS_MONTGOLFIERE.z));
  if (libres[0]) { const [c, q] = libres[0], u = paysanMesh.userData; u.cellule = c; u.y = hauteurSol(q.x, q.z, c); paysanMesh.position.set(q.x, u.y, q.z); u.angle = Math.atan2(POS_MONTGOLFIERE.x - q.x, POS_MONTGOLFIERE.z - q.z); }
  VISEE.set(0.6, 0.6, 0.6); placerCamera(); cadrer(); soleilVers(new T.Vector3(0, 0, 0));
  setTimeout(() => $('voile').classList.remove('on'), 120); toast('De retour à la ferme.'); sauver();
}

