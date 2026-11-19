'use strict';
/* LES CULTURES DU PALIER 11 (19/11/2026, version dev : mode test seulement). Mathieu : « la courge j'aime bien si ca doit etre un boost (pousse que au bord de
   l'eau) en condition, et les lotus en nouvelle recolte pour la suite du Noctiflore », puis « il faut 30 % d'XP en plus au total pour monter du 100 au 110 par
   rapport au 90 a 100 [04-etat.js, SEUILS_P11], et les lotus ca XP 20 % de plus que les noctiflores, et les lotus poussent 30 % plus vite lorsqu'il pleut », et
   pour la courge « reduit de 20 % tous les effets d'entrave, de poison et de saignement ».
   - le Lotus des marais : la recolte du palier 11 (niveau 100), XP 1 555 (la Noctiflore +20 %), 30 % plus vite sous la pluie (pousseNuit, 14i-nuit.js) ;
   - la Courge de pluie : ne se plante que sur un champ qui touche l'eau de l'ile (l'etang, la riviere) ; mangee avant une vague, +20 % de resistance a
     l'entrave et +20 % de resistance aux poisons (les saignements des Piranhas en sont) pendant cette vague.
   Modeles : blender/cultures6.py (la fleur de lotus d'apres l'image IA : blender/lotus-ia.py), icones : blender/icones-p11.py. Elles n'existent que dans le
   mode test : ajoutees a son entree (quitter le mode test recharge la page). Chiffres de depart (graines, temps, prix), a valider. */
const LOTUS = { id: 'lotus', nom: 'Lotus des marais', niv: 100, graine: 3600, temps: 190, rendement: 9, prix: 820, xp: 1555, couleur: '#ee9fc1', tige: '#5f9a4a', glb: 'cultures6', p11: true, pluie: 1.3 };
const COURGE_PLUIE = { id: 'courge_pluie', nom: 'Courge de pluie', niv: 100, graine: 4000, temps: 240, rendement: 3, prix: 200, xp: 400, couleur: '#82a6c0', tige: '#3f6e36', glb: 'cultures6', p11: true, bordEau: true,
  mange: { courge: 0.2, txt: 'entraves, poisons et saignements -20 %' } };
let culturesP11 = null; /* (la promesse du chargement, une seule fois) */
function activerCulturesP11() {
  if (culturesP11) return culturesP11;
  [LOTUS, COURGE_PLUIE].forEach((c) => { c.prix = +(c.prix * RENTA_RECOLTES).toFixed(2); });
  const iN = CULTURES.findIndex((c) => c.id === 'noctiflore'); CULTURES.splice(iN >= 0 ? iN + 1 : CULTURES.length, 0, LOTUS, COURGE_PLUIE);
  VENDABLES.push(LOTUS, COURGE_PLUIE); PAR_ID.lotus = LOTUS; PAR_ID.courge_pluie = COURGE_PLUIE;
  S_.cours = S_.cours || {}; [LOTUS, COURGE_PLUIE].forEach((c) => { if (!S_.cours[c.id]) S_.cours[c.id] = 1; });
  if (!BOOSTS_TEST.some((b) => b[0] === 'courge_pluie')) BOOSTS_TEST.push(['courge_pluie', 'repas', 'Courge de pluie', 'entraves, poisons et saignements -20 %']);
  return (culturesP11 = chargerGlb('assets/modeles/jeu/cultures6.glb?v=' + VERSION_MODELES).then((sc) => {
    versToon(sc, { normales: 0.008, souple: SOUPLE_CULTURES, sansContour: SC_CULT });
    [LOTUS, COURGE_PLUIE].forEach((c) => [0, 1, 2].forEach((k) => { const src = sc.getObjectByName('parcelle_' + c.id + '_' + k); if (!src) return;
      const g = src.clone(true); g.position.set(0, 0.02, 0); g.rotation.set(0, 0, 0); MODELES[c.id + k] = fusionner(g, { parNom: true }); }));
    S_.cases.filter((p) => p.type === 'champ' && (p.c === 'lotus' || p.c === 'courge_pluie')).forEach((p) => rendreCase(p.id));
  }).catch(() => { culturesP11 = null; }));
}
const entrerModeTestP11 = entrerModeTest; entrerModeTest = function () { const r = entrerModeTestP11.apply(this, arguments); if (MODE_TEST) activerCulturesP11(); return r; };
/* la Courge au bord de l'eau : une case de champ qui touche (meme en diagonale) une case d'eau de l'ile ; planter tout un champ n'en remplit que ces cases */
const bordDeLEau = (p) => { for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if ((di || dj) && codeIle(p.i + di, p.j + dj) === '~') return true; } return false; };
let toastEauT = 0;
const planterP11 = ACTIONS.planter; ACTIONS.planter = function (p, id) {
  if (!id) { const dispo = CULTURES.filter((c) => debloquee(c) && (S_.graines[c.id] || 0) > 0); if (dispo.length === 1) id = dispo[0].id; }
  const c = id && PAR_ID[id];
  if (c && c.bordEau && p && !bordDeLEau(p)) { if (Date.now() - toastEauT > 2500) { toastEauT = Date.now(); toast('La Courge de pluie ne pousse qu\'au bord de l\'eau : sur une case de champ qui touche l\'étang ou la rivière.', 'alerte'); } return; }
  return planterP11.call(this, p, id);
};
/* la Courge mangee avant la vague : les resistances pendant cette vague (appliquerRepas la note dans combat.repasActifs) */
const caracsP11 = caracs; caracs = function () {
  const t = caracsP11();
  try { if (combat && combat.repasActifs && combat.repasActifs.courge_pluie) { const k = 100 * COURGE_PLUIE.mange.courge; t.entrave = (t.entrave || 0) + k; t.resPoison = (t.resPoison || 0) + k; } } catch (e) { /* (avant le premier combat) */ }
  return t;
};
/* mangee pendant l'entracte : les resistances, gardees en memoire pour la vague, sont recalculees */
const mangerEntracteP11 = mangerEntracte; mangerEntracte = function (id) { const r = mangerEntracteP11.apply(this, arguments); if (id === 'courge_pluie' && combat) { combat.kEntrave = null; combat.kPoison = null; } return r; };
