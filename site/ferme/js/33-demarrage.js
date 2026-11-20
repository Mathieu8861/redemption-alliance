'use strict';
function lancer(etat) {
  lancer.t = performance.now(); pDown = null;
  S_ = etat; rendreArmeEssai(true); rendreTenueEssai(true); completerTerrains(); arbresSurCases(); sauver(); /* (une arme a l'essai de l'Arene dev, page fermee en plein combat : rendue) */
  document.getElementById('accueil').hidden = true; document.getElementById('hud').classList.remove('cache');
  enAccueil = false; angleCam = angleSauve(); angleVise = null; placerCamera(); /* (l'angle choisi la derniere fois, 29/10/2026) */
  resynchroniserIle(); construireBatiments(); construireArbres(); appliquerEnclos(); appliquerVoliere(); rendreBouftous(); majFeux(true);
  if (paysanMesh) { const c = paysanMesh.userData.cellule, q = c ? posCase(c) : { x: cx(4), y: 0, z: cz(3) }; scene.remove(paysanMesh); paysanMesh = paysan(q.x, q.y, q.z, S_.perso.classe); paysanMesh.userData.cellule = c; }
  if (S_.equip && (S_.equip.coiffe || S_.equip.cape || S_.equip.arme)) rafraichirTenue(); /* (les modeles des pieces portees arrivent apres) */
  toast('Bienvenue ' + S_.perso.nom + ' ! Pépito t\'attend à la ferme.', 'or');
  if (S_.migreIleRonde && !S_.migreIleRonde.vu) { const m = S_.migreIleRonde; m.vu = 1; sauver(); /* (une seule fois, apres la conversion d'une ancienne ferme) */
    setTimeout(() => toast('Ta ferme a déménagé sur l\'île ronde ! Le départ fait maintenant 92 cases' + (m.terrains ? ', et tes ' + m.terrains + ' terrain' + (m.terrains > 1 ? 's sont devenus les ' + m.terrains + ' premiers' : ' est devenu le premier') + ' terrain' + (m.terrains > 1 ? 's' : '') + ' de l\'île, plus grand' + (m.terrains > 1 ? 's' : '') : '') + (m.replaces ? '. Ce qui était posé dessus a été replacé sur ta ferme' : '') + '. Les suivants se débloquent avec ton niveau, en faisant le tour de l\'île.', 'or'), 3500); }
  if (tutoCoupe()) { if (!S_.tuto) S_.tuto = 'coupe'; if (S_.objCache === undefined) S_.objCache = true; } /* (et les objectifs du debut masques, sauf si on les a rouverts dans les Options) */ /* (le tuto coupe dans les Options : une nouvelle partie demarre sans lui, 06/11/2026) */
  const tutoAuto = !S_.tuto && niveau(S_.xp) < 5; /* un debutant qui ne l'a jamais vu (ou pas fini) */
  rendreHaut(); rendreObjectif(); setTimeout(placerPanneaux, 50); if (!tutoAuto) setTimeout(astuceClics, 4000); setTimeout(nuageEnvoyer, 1500);
  if (tutoAuto) setTimeout(() => demarrerTuto(S_.tutoEtape || 0), 700); else { if (absence) setTimeout(montrerAbsence, 400); setTimeout(cadeauDuJour, absence ? 2500 : 600); }
}
/* LA FIN DU CHARGEMENT (15/11/2026, « il y a un petit freeze quand le chargement finit, l'arriere-plan derriere la selection des persos freeze une demi-seconde »,
   Mathieu ; mesure : environ 1 s saccadee, des images de 130 a 350 ms, la fin de demarrer puis le dessin des 3 portraits des parties) : l'ecran de chargement reste
   devant tant que les portraits ne sont pas dessines et que la scene ne tourne pas de facon fluide (4 images de suite sous 70 ms), puis s'efface en fondu ;
   6 s au plus, et tout de suite si une partie est lancee (enAccueil) */
async function finirChargement() {
  const ch = document.getElementById('chargement'), tx = document.getElementById('chargement-texte'), pct = document.getElementById('chargement-pct');
  if (tx) tx.textContent = 'On prépare tes héros...'; if (pct) pct.textContent = '100 %';
  const t0 = performance.now(), assez = () => !enAccueil || performance.now() - t0 > 6000, image = () => new Promise((r) => { requestAnimationFrame(r); setTimeout(r, 120); });
  let prets = false; Promise.allSettled(PORTRAITS_ACCUEIL).then(() => { prets = true; });
  while (!prets && !assez()) await image();
  let calme = 0, t = performance.now(); while (calme < 4 && !assez()) { await image(); const n = performance.now(); calme = n - t < 70 ? calme + 1 : 0; t = n; }
  ch.classList.add('fini'); setTimeout(() => { ch.hidden = true; }, 700);
}
async function demarrer() {
  { const a = document.getElementById('chargement-astuce'); if (a) a.textContent = 'Pépito : « ' + hasard(PEPITO) + ' »'; }
  S_ = charger() || etatInitial(); completerTerrains(); const nuageP = identifier();
  try { await chargerModeles(); } catch (err) { document.getElementById('chargement-texte').textContent = 'Le chargement de l\'île a échoué, recharge la page.'; window.__erreur = String(err); throw err; }
  { const n = await nuageP; if (n) choisirVersion(n); } /* le compte et sa ferme en ligne, si elle est plus recente */
  if (graphismes() === 'leger') appliquerGraphismes(); /* le choix du joueur (ou la bascule automatique d'une visite precedente) */
  arbresSurCases(); construireStatique(); poserMontgolfiere(); /* la montgolfiere du Casino, au bord de la ferme */
  S_.cases.forEach((p) => construireCase(p));
  bullesFixes();
  /* la pause : plus de rattrapage du temps passe dehors, la ferme reprend ou elle en etait (voir reprendreTemps) */
  rendreHaut(); rendreGrange(); rendreBouftous(); rendreSauvage(); rendreCasesBulles();
  $('commis').innerHTML = '<b>Pépito :</b> « ' + PEPITO[0] + ' »';
  setInterval(tick, 500);
  addEventListener('resize', () => { cadrer(); placerBulles(); placerPanneaux(); });
  cadrer(); rendu.shadowMap.needsUpdate = true; rendu.render(scene, camera); placerBulles();
  placerCamera();
  ouvrirAccueil();
  window.__pret = true; requestAnimationFrame(boucle); finirChargement(); setTimeout(prechargerIcones, 4000); /* (les icones de la grange, en fond, 07/11/2026) */
}
window.addEventListener('error', (e) => { window.__erreur = e.message; });

$('b-pause').addEventListener('click', (e) => { e.stopPropagation(); mettrePause(true); });
$('b-reprendre').addEventListener('click', (e) => { e.stopPropagation(); mettrePause(false); });
$('b-simu').addEventListener('click', (e) => { e.stopPropagation(); accepterSimu(); });
/* LE CLAVIER (un seul ecouteur depuis la refonte du 16/10/2026) : Echap annule une visee ; 1 a 4 lancent le sort, l'ulti et les sorts legendaires
   pendant un combat (touches du haut du clavier ou pave numerique, AZERTY comme QWERTY) ; P met en pause et reprend, Echap reprend aussi.
   Rien quand on ecrit dans un champ (sauf Echap sur une visee), et pendant une lecon de Pepito, c'est elle qui tient la pause. */
const TOUCHES_SORT = { Digit1: () => lancerSort(), Numpad1: () => lancerSort(), Digit2: () => lancerUlti(), Numpad2: () => lancerUlti(),
  Digit3: () => legTouche(3), Numpad3: () => legTouche(3), Digit4: () => legTouche(4), Numpad4: () => legTouche(4) };
addEventListener('keyup', (e) => { if (e.code === 'Space' && !(e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) e.preventDefault(); }); /* (un bouton qui a le focus ne se reclique pas a la barre espace) */
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && visee) annulerVisee();
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (e.key === 'Escape' && !visee && !enPause && modaleOuverte && !lecon.ouverte) { fermerModale(); return; } /* (Echap ferme la fenetre ouverte, comme un clic a cote, 07/11/2026) */
  const sort = TOUCHES_SORT[e.code]; if (sort && combat && !combat.fin && !enPause && !e.repeat) { e.preventDefault(); sort(); }
  if (lecon.ouverte) return;
  if (e.key === 'p' || e.key === 'P' || (e.code === 'Space' && !e.repeat)) { if (e.code === 'Space') e.preventDefault(); mettrePause(!enPause); } else if (e.key === 'Escape' && enPause) mettrePause(false); /* (la barre espace met en pause aussi, combats compris, 20/11/2026, « mettre un raccourci sur la barre espace », Mathieu ; la peche garde la sienne, 14h-peche.js) */
  /* tourner la camera (29/10/2026) : A et E sur un clavier azerty (Q et E en qwerty : la meme place), R pour revenir a la vue de depart */
  if (!enAccueil && !e.ctrlKey && !e.metaKey && !e.altKey && (e.code === 'KeyW' || e.code === 'KeyS')) { const b = elevVise != null ? elevVise : elevCam; inclinerCameraVers(Math.min(ELEV_MAX, Math.max(ELEV_MIN, b + (e.code === 'KeyW' ? 0.16 : -0.16)))); } /* (Z et S en azerty, W et S en qwerty : la camera monte, ou descend ; maintenus, elle continue, 09/11/2026) */
  if (!enAccueil && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) { const base = angleVise != null ? angleVise : angleCam;
    if (e.code === 'KeyQ') tournerCameraVers(base - Math.PI / 2); else if (e.code === 'KeyE') tournerCameraVers(base + Math.PI / 2); else if (e.code === 'KeyR') { tournerCameraVers(ANGLE_DEPART + Math.round((angleCam - ANGLE_DEPART) / (2 * Math.PI)) * 2 * Math.PI); inclinerCameraVers(ELEV_DEPART); } }
});
demarrer();
