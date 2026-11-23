'use strict';
/* L'ARMURE DU GARDIEN (19/11/2026, version dev : mode test seulement). Proposition de la nuit pour « booster notre gardien » contre VSA ; Mathieu : « ca se
   trouve on le fera evoluer plusieurs fois l'armure, donc faut y penser », puis « il faut plus de ressources et de kamas pour les crafts ».
   Trois niveaux qui se suivent, fabriques l'un apres l'autre a l'atelier (une seule recette, qui propose toujours le niveau suivant) :
   1 rustique (cuir cloute ; 19/11/2026), 2 garde du chateau (acier borde d'or, medaillon du chateau, cape orange), 3 runique (ardoise aux runes violettes qui
   luisent, cristaux ; les niveaux 2 et 3 le 20/11/2026, « l'armure du gardien », Mathieu ; look, effets et couts valides au formulaire le meme soir,
   couts baisses a 800 000 et 2 000 000 kamas).
   - il la porte sur sa forme de combat (le Meulou, la panthere ; blender/gardiens.py, armure_rustique et armure_haut ; un fichier par niveau et par espece,
     gardien-chien-r1.glb, gardien-chat-r2.glb..., charge seulement quand il l'a) ;
   - en VSA : plus de degats (degGardien), et des le niveau 2 il court plus vite, au niveau 3 son pouvoir revient plus vite (14c-gardien.js). */
const ARMURES_GARDIEN = [null,
  { nom: 'Armure rustique', court: 'rustique', bonus: 0.25, vitesse: 0, recharge: 0, fichier: '-r1', noeud: '_R1', kamas: 400000, il: [['couenne', 30], ['dent_bwork', 20], ['eclat_craq', 10]],
    look: 'du cuir clouté, un caparaçon et des jambières' },
  { nom: 'Armure de la garde', court: 'de la garde', bonus: 0.5, vitesse: 0.1, recharge: 0, fichier: '-r2', noeud: '_R2', kamas: 800000, il: [['soie_arakne', 15], ['ecorce_abraknyde', 15], ['ecaille_tortue', 20]],
    look: 'l\'acier bordé d\'or des gardes du château, son médaillon et sa cape orange' },
  { nom: 'Armure runique', court: 'runique', bonus: 0.75, vitesse: 0.15, recharge: 2, runes: 3, fichier: '-r3', noeud: '_R3', kamas: 2000000, il: [['soie_arakne', 25], ['ecorce_abraknyde', 25]],
    look: 'des plaques d\'ardoise aux runes violettes qui luisent, et des cristaux' }];
const NIV_ARMURE_MAX = ARMURES_GARDIEN.length - 1;
const niveauArmureGardien = () => (p11Ouvert() ? Math.min(NIV_ARMURE_MAX, S_.armureGardien || 0) : 0); /* (p11Ouvert : sortie avec le palier 11) */
const statArmureGardien = (k) => { const n = niveauArmureGardien(); return n ? ARMURES_GARDIEN[n][k] || 0 : 0; };
const bonusArmureGardien = () => statArmureGardien('bonus');
const effetsArmure = (A) => '+' + Math.round(A.bonus * 100) + ' % de dégâts' + (A.vitesse ? ', il court ' + Math.round(A.vitesse * 100) + ' % plus vite' : '') + (A.recharge ? ', son pouvoir revient ' + A.recharge + ' s plus tôt' : '');
/* la recette : toujours le niveau suivant (au maximum, la derniere, qui refuse) */
const armureSuivante = () => ARMURES_GARDIEN[Math.min(NIV_ARMURE_MAX, (S_.armureGardien || 0) + 1)];
RECETTES_DEV_ATELIER.push({ id: 'armure_gardien', donne: 1, unique: true, /* (pas de stock : c'est un niveau, pas une reserve ; fabriquee ici, plus bas) */
  get fini() { return (S_.armureGardien || 0) >= NIV_ARMURE_MAX; }, get bouton() { return S_.armureGardien ? 'Faire évoluer' : 'Fabriquer'; }, /* (23/11/2026, « on peut en fabriquer qu'une, une fois fabriquee elle disparait de l'atelier », Mathieu : pas de ×5, et une fois l'armure runique faite, la recette s'en va) */
  get nom() { const n = Math.min(NIV_ARMURE_MAX, (S_.armureGardien || 0) + 1); return armureSuivante().nom + ' du gardien (niveau ' + n + ')'; },
  get kamas() { return armureSuivante().kamas; }, get il() { return armureSuivante().il; },
  get ico() { const G = gardienDe(); return G && G.espece === 'chat' ? 'newton-vsa' : 'masdog-vsa'; },
  get desc() { const n = S_.armureGardien || 0, A = armureSuivante();
    if (n >= NIV_ARMURE_MAX) return 'Ton gardien porte déjà l\'armure runique, la plus haute.';
    return (n ? 'Ton gardien porte l\'armure ' + ARMURES_GARDIEN[n].court + '. ' : '') + 'Le niveau ' + (n + 1) + ' de l\'armure de ton gardien : ' + A.look + '. Il la porte quand VSA arrive : ' + effetsArmure(A) + '.' + (n ? ' Elle remplace l\'armure ' + ARMURES_GARDIEN[n].court + '.' : ' Elle évoluera ensuite (garde du château, puis runique).') +
      (A.runes ? ' Il faut aussi ' + A.runes + ' runes de forgemagie (tu en as ' + runes().forge + ').' : ''); } });
const fabriquerArmure = fabriquer; fabriquer = function (id, fois) {
  if (id !== 'armure_gardien') return fabriquerArmure(id, fois);
  const G = S_.grange || {}, n = S_.armureGardien || 0; if (!niv('atelier') || amelioCachee('atelier') || !p11Ouvert()) return;
  if (!gardienDe()) { toast('Il te faut d\'abord un gardien.'); return; } if (n >= NIV_ARMURE_MAX) { toast('Ton gardien a déjà l\'armure la plus haute.'); return; }
  const A = ARMURES_GARDIEN[n + 1];
  if (!A.il.every((I) => faisables(G, I) >= 1)) { toast('Il te manque des ressources dans ta grange.'); return; }
  if (S_.kamas < A.kamas) { toast('Il te manque ' + fmt(A.kamas - S_.kamas) + ' kamas.'); return; }
  if (A.runes && !MODE_TEST && runes().forge < A.runes) { toast('Il te faut ' + A.runes + ' runes de forgemagie (tu en as ' + runes().forge + ').'); return; }
  A.il.forEach((I) => paieIngredient(G, I, 1).forEach(([r, q]) => { if (q) G[r] -= q; })); S_.kamas -= A.kamas; if (A.runes && !MODE_TEST) runes().forge -= A.runes;
  S_.armureGardien = n + 1; MODELES.gardienVsaArmure = MODELES.gardienCalmeArmure = MODELES.gardienAssisArmure = null; armureChargee = null; if (gard) creerGardien(); chargerArmureGardien(); /* (le nouveau modele tout de suite, sans attendre la boucle) */
  son('niveau'); toast(gardienDe().nom + ' a son ' + A.nom.toLowerCase() + ' : ' + effetsArmure(A) + ' en VSA.', 'or'); sauver(); rendreGrange(); rendreHaut();
};
/* le modele cuirasse : charge a la demande (le fichier de son espece et de son niveau, a part), puis le gardien est refait avec */
let armureChargee = null;
function chargerArmureGardien() {
  const G = gardienDe(), n = niveauArmureGardien(); if (!G || !n || armureChargee) return; const A = ARMURES_GARDIEN[n];
  armureChargee = chargerGlb('assets/modeles/jeu/' + G.fichier + A.fichier + '.glb?v=' + VERSION_MODELES).then((sc) => {
    if (niveauArmureGardien() !== n) return; /* (une armure plus haute fabriquee pendant le chargement : la suivante se chargera) */
    sc.traverse((o) => { if (PIVOT_P8.test(o.name)) o.userData.articule = true; }); versToon(sc, { normales: 0.01, sansContour: SC_GARDIEN });
    const mk = (nom) => { if (!sc.getObjectByName(nom)) return null; const m = gabaritEchelle(sc, nom, ECHELLE_GARDIEN, new T.Vector3(0, 0, 0)); fusionnerPivots(m); m.userData.pivots = true; m.userData.type = S_.gardien.type; m.userData.armure = n; return m; };
    /* (23/11/2026, « la meme, en petit », Mathieu : le meme fichier porte aussi sa forme de tous les jours, debout et assise, en armure ; blender/gardiens.py, armure_calme) */
    MODELES.gardienCalmeArmure = mk(G.calme + A.noeud); MODELES.gardienAssisArmure = mk(G.assis + A.noeud);
    MODELES.gardienVsaArmure = mk(G.vsa + A.noeud); if (gard) creerGardien();
  }).catch(() => { armureChargee = null; });
}
effets.push(() => { if (p11Ouvert() && niveauArmureGardien() && !MODELES.gardienVsaArmure && MODELES.gardienCalme) chargerArmureGardien();
  if (gard && !p11Ouvert() && gard.vsa && MODELES.gardienVsaArmure && gard.vsa.userData.armure) creerGardien(); /* (sorti du mode test : sa forme sans armure) */
  return false; });
const creerGardienArmure = creerGardien; creerGardien = function () { creerGardienArmure(); if (gard && gard.vsa) gard.vsa.userData.armure = !!(MODELES.gardienVsaArmure && niveauArmureGardien()); };
