'use strict';
/* LES CRAQUELEURS, NOUVELLE VERSION (17/11/2026, « refaire les autres anciennes familles », Mathieu, au formulaire : les Craqueleurs du palier 4, « comme
   les Bworks » ; « c'est des golems de pierre, pas de visage démoniaque, pas obligés d'être humanoïdes »). Dessins choisis au formulaire, modèles Rodin en
   pose T (assets/modeles/essais/palier4/poseT/), aplats, creux, runes et yeux lumineux cuits dans la texture (outils/craqueleurs/cuire_aplats.py,
   blender/craq-details.py), squelettes calés sans Mixamo (placer-squelette.py, lier-squelette.py ... epaules) et mouvements des brutes (monstre-anime.py) ;
   la Craqueboule, à quatre pattes, a son squelette fait main (blender/craqueboule.py). Rendu B des Bworks (ombre gris froid, contour fin), lueur des yeux
   et des runes en émission. Le combat ne change pas : mêmes coups, même cadence, pas de rugissement d'arrivée.
   Version dev : choisie dans l'Arène dev (onglet Versions des monstres), gardée dans ce navigateur ; les joueurs gardent l'ancienne. Suivi :
   maquettes/craqueleurs/CRAQUELEURS.md. */
let VERSION_CRAQ = (() => { try { return localStorage.getItem('ferme-version-craq') === 'nouvelle' ? 'nouvelle' : 'ancienne'; } catch (err) { return 'ancienne'; } })();
/* type du monstre -> [nom du modèle, hauteur en jeu, vitesse de ses animations] (tailles de la planche validée le 17/11) */
const CRAQ_V2 = { craqueleur: ['craqueleur', 3.1, 1.0], craqueboule: ['craqueboule', 1.55, 1.25], craqLanceur: ['craqLanceur', 3.35, 1.0], craqCristal: ['craqCristal', 3.1, 1.0], craqLegendaire: ['craqLegendaire', 5.0, 0.9] }; /* (17/11/2026, « ils sont tous un peu trop petits, le Légendaire plus large aussi », Mathieu : +20 %, le Légendaire élargi de 25 %) */
const NOMS_CQ2 = new Set(Object.values(CRAQ_V2).map(([n]) => n + '-v2'));
for (const [n, h, v] of Object.values(CRAQ_V2)) { SQUELETTES_A_CHARGER.push([n + '-v2', 'assets/modeles/jeu/' + n + '-anime-v2.glb', h]); VITESSE_FAMILLE[n + '-v2'] = v; }
ALLURES['craqueboule-v2'] = { marche: 0.6, course: 1.6 }; /* (son trot fait main n'a pas d'os des hanches : sa vitesse naturelle est donnée ici) */
/* la lueur des yeux et des runes : l'image d'émission de chaque golem (la Craqueboule a la sienne dans son glb) */
const LUEURS_CQ = {};
const lueurCq = (n) => LUEURS_CQ[n] || (LUEURS_CQ[n] = new Promise((ok) => new T.TextureLoader().load('assets/modeles/jeu/da/' + n + '-lueur.jpg?v=' + VERSION_MODELES,
  (t) => { t.flipY = false; t.encoding = T.LinearEncoding; ok(t); }, undefined, () => ok(null))));
const CONTOURS_CQ = {}; /* (contour fin gris-brun : le vert foncé des Bworks verdissait la pierre) */
function contourCq(e) { const cle = e.toFixed(5); if (CONTOURS_CQ[cle]) return CONTOURS_CQ[cle];
  const m = new T.MeshBasicMaterial({ color: '#2c2722', side: T.BackSide, skinning: true });
  m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * ' + e.toFixed(5) + ';'); };
  m.customProgramCacheKey = () => 'contour-cq-' + cle; return (CONTOURS_CQ[cle] = m); }
function habillerCq(M, lueur) {
  M.updateMatrixWorld(true); const v = new T.Vector3();
  M.traverse((o) => { if (!o.isSkinnedMesh || o.name === 'contour') return; const map = o.material.map, emi = o.material.emissiveMap || lueur;
    o.material = matiereB(new T.MeshToonMaterial(Object.assign({ color: '#ffffff', map, gradientMap: grad, skinning: true, side: T.DoubleSide }, emi ? { emissive: '#ffffff', emissiveMap: emi, emissiveIntensity: 1.5 } : {})));
    const k = o.parent && o.parent.children.find((c) => c.name === 'contour' && c.isSkinnedMesh && c.geometry === o.geometry); if (k) k.material = contourCq(RENDU_B.ep / o.getWorldScale(v).x); });
}
const chargerSquelette2 = chargerSquelette; chargerSquelette = async function (nom, url, h) { await chargerSquelette2(nom, url, h); const M = MODELES[nom];
  if (NOMS_CQ2.has(nom) && M && !M.userData.habilleCq) { const n = nom.replace(/-v2$/, ''); const lu = n === 'craqueboule' ? null : await lueurCq(n); habillerCq(M, lu); M.userData.habilleCq = true; } };
const clonerSquelette2 = clonerSquelette; clonerSquelette = function (nom) { const g = clonerSquelette2(nom); /* (la copie d'une matière perd son onBeforeCompile) */
  if (NOMS_CQ2.has(nom)) g.traverse((o) => { if (o.isSkinnedMesh && o.name !== 'contour') matiereB(o.material); }); return g; };
/* le combat comme avant : pas de rugissement d'arrivée ni de rage (1,35 s sans rien faire), coups portés tout de suite, geste joué depuis l'instant du coup */
const majSquelette3 = majSquelette; majSquelette = function (mo, v, dt) { if (mo.d && NOMS_CQ2.has(mo.d.modele)) { mo.rugiArrivee = true; mo.rugiRage = true; } majSquelette3(mo, v, dt); };
const attaqueSquelette2 = attaqueSquelette; attaqueSquelette = function (mo, fam, frapper) {
  if (!mo.d || !NOMS_CQ2.has(mo.d.modele)) return attaqueSquelette2(mo, fam, frapper);
  const an = mo.m && mo.m.userData.anim; if (an && !mo.geste) { if (!an.F[fam]) fam = an.F.coup ? 'coup' : null;
    if (fam) { const nom = piocher(an, fam), a = jouerAnim(an, nom, 0.06); if (a) { const d0 = a.getClip().duration, t0 = (((mo.m.userData.impacts || {})[nom] || [])[0] || { t: d0 * 0.45 }).t, k = 1.2 * vitAnim(mo);
      a.time = Math.max(0, t0 - 0.12 * k); a.timeScale = k; mo.geste = { t: 0, d: Math.min(0.5, (d0 - a.time) / k) }; } } }
  frapper(); };
/* l'île des boss : la semaine du Craqueleur Légendaire, ses modèles (et ceux des Craqueboules qu'il appelle) sont chargés avant l'essai */
const lancerIleBoss2 = lancerIleBoss; lancerIleBoss = function () {
  let manque = []; try { manque = VERSION_CRAQ === 'nouvelle' && bossDuJour(semaineIleBoss()) === 'craqLegendaire' ? ['craqLegendaire-v2', 'craqueboule-v2'].filter((n) => !MODELES[n]) : []; } catch (err) { manque = []; }
  if (!manque.length) return lancerIleBoss2();
  if (lancerIleBoss.chargeCq) return; lancerIleBoss.chargeCq = true; toast('Le Craqueleur colossal arrive…', 'or');
  chargerSquelettes(manque).then(() => { prechaufferSquelettes(manque); }).catch(() => {}).finally(() => { lancerIleBoss.chargeCq = false; lancerIleBoss2(); }); };
/* le choix de version */
async function preparerCraqV2() { await chargerSquelettes([...NOMS_CQ2]); }
function appliquerCraqV2() {
  const neuf = VERSION_CRAQ === 'nouvelle';
  Object.entries(CRAQ_V2).forEach(([t, [n]]) => { const d = MONSTRES[t]; if (!d) return; if (!('modeleV1' in d)) d.modeleV1 = d.modele; d.modele = neuf ? n + '-v2' : d.modeleV1; });
}
async function choisirVersionCraq(v) {
  VERSION_CRAQ = v === 'nouvelle' ? 'nouvelle' : 'ancienne'; try { localStorage.setItem('ferme-version-craq', VERSION_CRAQ); } catch (err) { /* rien */ }
  if (VERSION_CRAQ === 'nouvelle') { toast('Chargement de la nouvelle version des Craqueleurs…'); await preparerCraqV2(); } appliquerCraqV2();
  toast(VERSION_CRAQ === 'nouvelle' ? 'Craqueleurs : nouvelle version (animée, rendu B).' : 'Craqueleurs : ancienne version.', 'or');
}
appliquerCraqV2(); /* (au démarrage : la version choisie ; les modèles se chargent quand les Craqueleurs arrivent) */
