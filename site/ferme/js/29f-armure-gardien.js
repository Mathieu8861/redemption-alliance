'use strict';
/* L'ARMURE DU GARDIEN (19/11/2026, version dev : mode test seulement). Proposition de la nuit pour « booster notre gardien » contre VSA ; Mathieu : « ca se
   trouve on le fera evoluer plusieurs fois l'armure, donc faut y penser », puis « il faut plus de ressources et de kamas pour les crafts ».
   Trois niveaux qui se suivent : 1 rustique (cuir clouté), 2 garde du chateau (acier et or, palier 11), 3 runique (avec l'eveil). Seul le niveau 1 existe :
   - fabrique a l'atelier : 30 Couennes de Cochon, 20 Dents de Bwork, 10 Eclats de Craqueleur, 400 000 kamas (chiffres a valider) ;
   - il la porte sur sa forme de combat (le Meulou : caparacon de cuir, criniere courte, jambieres ; la panthere : selle de cuir cloutee, epaulieres,
     jambieres ; blender/gardiens.py, armure_rustique ; modeles a part, gardien-chien-r1.glb et gardien-chat-r1.glb, charges seulement quand il l'a) ;
   - en VSA, +25 % de degats (degGardien, 14c-gardien.js). */
const ARMURES_GARDIEN = [null, { nom: 'Armure rustique', bonus: 0.25, fichier: '-r1', noeud: '_R1' }];
const niveauArmureGardien = () => (MODE_TEST ? Math.min(ARMURES_GARDIEN.length - 1, S_.armureGardien || 0) : 0);
const bonusArmureGardien = () => { const n = niveauArmureGardien(); return n ? ARMURES_GARDIEN[n].bonus : 0; };
RECETTES_DEV_ATELIER.push({ id: 'armure_gardien1', nom: 'Armure rustique du gardien', donne: 1, stock: 'armureGardien', kamas: 400000,
  il: [['couenne', 30], ['dent_bwork', 20], ['eclat_craq', 10]], get ico() { const G = gardienDe(); return G && G.espece === 'chat' ? 'newton-vsa' : 'masdog-vsa'; },
  minuscule: 'armure rustique', apres: ' : ton gardien la porte quand il se transforme en VSA (+25 % de dégâts).',
  desc: 'Le niveau 1 de l\'armure de ton gardien : du cuir clouté, un caparaçon et des jambières. Il la porte quand VSA arrive : +25 % de dégâts. Elle évoluera (garde du château, puis runique).' });
const fabriquerArmure = fabriquer; fabriquer = function (id, fois) {
  if (id === 'armure_gardien1') { if (!gardienDe()) { toast('Il te faut d\'abord un gardien.'); return; } if ((S_.armureGardien || 0) >= 1) { toast('Ton gardien a déjà son armure rustique.'); return; } fois = 1; }
  const r = fabriquerArmure(id, fois); if (id === 'armure_gardien1' && S_.armureGardien >= 1) { MODELES.gardienVsaArmure = null; armureChargee = null; } return r;
};
/* le modele cuirasse : charge a la demande (le fichier de son espece, a part), puis le gardien est refait avec */
let armureChargee = null;
function chargerArmureGardien() {
  const G = gardienDe(), n = niveauArmureGardien(); if (!G || !n || armureChargee) return; const A = ARMURES_GARDIEN[n];
  armureChargee = chargerGlb('assets/modeles/jeu/' + G.fichier + A.fichier + '.glb?v=' + VERSION_MODELES).then((sc) => {
    sc.traverse((o) => { if (PIVOT_P8.test(o.name)) o.userData.articule = true; }); versToon(sc, { normales: 0.01, sansContour: SC_GARDIEN });
    const m = gabaritEchelle(sc, G.vsa + A.noeud, ECHELLE_GARDIEN, new T.Vector3(0, 0, 0)); fusionnerPivots(m); m.userData.pivots = true; m.userData.type = S_.gardien.type;
    MODELES.gardienVsaArmure = m; if (gard) creerGardien();
  }).catch(() => { armureChargee = null; });
}
effets.push(() => { if (MODE_TEST && niveauArmureGardien() && !MODELES.gardienVsaArmure && MODELES.gardienCalme) chargerArmureGardien();
  if (gard && !MODE_TEST && gard.vsa && MODELES.gardienVsaArmure && gard.vsa.userData.armure) creerGardien(); /* (sorti du mode test : sa forme sans armure) */
  return false; });
const creerGardienArmure = creerGardien; creerGardien = function () { creerGardienArmure(); if (gard && gard.vsa) gard.vsa.userData.armure = !!(MODELES.gardienVsaArmure && niveauArmureGardien()); };
