'use strict';
function lancer(etat) {
  lancer.t = performance.now(); pDown = null;
  S_ = etat; completerTerrains(); arbresSurCases(); sauver();
  document.getElementById('accueil').hidden = true; document.getElementById('hud').classList.remove('cache');
  enAccueil = false; angleCam = angleSauve(); angleVise = null; placerCamera(); /* (l'angle choisi la derniere fois, 29/10/2026) */
  resynchroniserIle(); construireBatiments(); construireArbres(); appliquerEnclos(); appliquerVoliere(); rendreBouftous(); majFeux(true);
  if (paysanMesh) { const c = paysanMesh.userData.cellule, q = c ? posCase(c) : { x: cx(4), y: 0, z: cz(3) }; scene.remove(paysanMesh); paysanMesh = paysan(q.x, q.y, q.z, S_.perso.classe); paysanMesh.userData.cellule = c; }
  if (S_.equip && (S_.equip.coiffe || S_.equip.cape || S_.equip.arme)) rafraichirTenue(); /* (les modeles des pieces portees arrivent apres) */
  toast('Bienvenue ' + S_.perso.nom + ' ! Pépito t\'attend à la ferme.', 'or');
  if (S_.migreIleRonde && !S_.migreIleRonde.vu) { const m = S_.migreIleRonde; m.vu = 1; sauver(); /* (une seule fois, apres la conversion d'une ancienne ferme) */
    setTimeout(() => toast('Ta ferme a déménagé sur l\'île ronde ! Le départ fait maintenant 92 cases' + (m.terrains ? ', et tes ' + m.terrains + ' terrain' + (m.terrains > 1 ? 's sont devenus les ' + m.terrains + ' premiers' : ' est devenu le premier') + ' terrain' + (m.terrains > 1 ? 's' : '') + ' de l\'île, plus grand' + (m.terrains > 1 ? 's' : '') : '') + (m.replaces ? '. Ce qui était posé dessus a été replacé sur ta ferme' : '') + '. Les suivants se débloquent avec ton niveau, en faisant le tour de l\'île.', 'or'), 3500); }
  const tutoAuto = !S_.tuto && niveau(S_.xp) < 5; /* un debutant qui ne l'a jamais vu (ou pas fini) */
  rendreHaut(); rendreObjectif(); setTimeout(placerPanneaux, 50); if (!tutoAuto) setTimeout(astuceClics, 4000); setTimeout(nuageEnvoyer, 1500);
  if (tutoAuto) setTimeout(() => demarrerTuto(S_.tutoEtape || 0), 700); else { if (absence) setTimeout(montrerAbsence, 400); setTimeout(cadeauDuJour, absence ? 2500 : 600); }
}
async function demarrer() {
  { const a = document.getElementById('chargement-astuce'); if (a) a.textContent = 'Pépito : « ' + hasard(PEPITO) + ' »'; }
  S_ = charger() || etatInitial(); completerTerrains(); const nuageP = identifier();
  try { await chargerModeles(); } catch (err) { document.getElementById('chargement-texte').textContent = 'Le chargement de l\'île a échoué, recharge la page.'; window.__erreur = String(err); throw err; }
  { const n = await nuageP; if (n) choisirVersion(n); } /* le compte et sa ferme en ligne, si elle est plus recente */
  document.getElementById('chargement').hidden = true;
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
  window.__pret = true; requestAnimationFrame(boucle);
}
window.addEventListener('error', (e) => { window.__erreur = e.message; });

$('b-pause').addEventListener('click', (e) => { e.stopPropagation(); mettrePause(true); });
$('b-reprendre').addEventListener('click', (e) => { e.stopPropagation(); mettrePause(false); });
$('b-simu').addEventListener('click', (e) => { e.stopPropagation(); accepterSimu(); });
/* LE CLAVIER (un seul ecouteur depuis la refonte du 16/10/2026) : Echap annule une visee ; 1 a 4 lancent le sort, l'ulti et les sorts legendaires
   pendant un combat (touches du haut du clavier ou pave numerique, AZERTY comme QWERTY) ; P met en pause et reprend, Echap reprend aussi.
   Rien quand on ecrit dans un champ (sauf Echap sur une visee), et pendant une lecon de Pepito, c'est elle qui tient la pause. */
const TOUCHES_SORT = { Digit1: () => lancerSort(), Numpad1: () => lancerSort(), Digit2: () => lancerUlti(), Numpad2: () => lancerUlti(),
  Digit3: () => lancerLeg('coiffe'), Numpad3: () => lancerLeg('coiffe'), Digit4: () => lancerLeg('arme'), Numpad4: () => lancerLeg('arme') };
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && visee) annulerVisee();
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const sort = TOUCHES_SORT[e.code]; if (sort && combat && !combat.fin && !enPause && !e.repeat) { e.preventDefault(); sort(); }
  if (lecon.ouverte) return;
  if (e.key === 'p' || e.key === 'P') mettrePause(!enPause); else if (e.key === 'Escape' && enPause) mettrePause(false);
  /* tourner la camera (29/10/2026) : A et E sur un clavier azerty (Q et E en qwerty : la meme place), R pour revenir a la vue de depart */
  if (!enAccueil && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) { const base = angleVise != null ? angleVise : angleCam;
    if (e.code === 'KeyQ') tournerCameraVers(base - Math.PI / 2); else if (e.code === 'KeyE') tournerCameraVers(base + Math.PI / 2); else if (e.code === 'KeyR') tournerCameraVers(ANGLE_DEPART + Math.round((angleCam - ANGLE_DEPART) / (2 * Math.PI)) * 2 * Math.PI); }
});
demarrer();
