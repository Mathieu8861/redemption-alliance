'use strict';
/* LE PUITS NIVEAU 6 : LE RECUPERATEUR D'EAU DE PLUIE (19/11/2026, version dev : mode test seulement). Mathieu : « un recuperateur d'eau de pluie a irrigation
   partielle, histoire de se laisser une autre amelioration plus tard », « un truc qui ressemble au 2 [le reservoir de pluie de la maquette], le 3 [la roue a
   aubes] est top plus pour une future amelioration ».
   - le modele : blender/puits6.py (le chateau d'eau du niveau 5 coiffe d'un entonnoir de cuivre, echelle, pluviometre, descente et rigole sur treteaux) ;
   - l'arrosoir passe a 60 doses, la citerne a 50 (02-donnees.js, 04-etat.js : les tableaux vont jusqu'au niveau 6, sans rien changer aux autres) ;
   - l'irrigation partielle : les champs qui touchent le puits (les 8 cases autour) sont toujours arroses, tant que le puits n'est pas en ruine. La roue a
     aubes (niveau 7, plus tard) pourra l'etendre a 2 cases et faire pousser plus vite.
   Il n'existe que dans le mode test : ajoute a son entree (quitter le mode test recharge la page). Chiffres de depart, a valider. */
const PUITS6 = { cout: 250000, niv: 95, eau: 60, citerne: 50, portee: 1 };
let puits6Charge = null;
function chargerPuits6() {
  if (puits6Charge) return puits6Charge;
  return (puits6Charge = chargerGlb('assets/modeles/jeu/puits6.glb?v=' + VERSION_MODELES).then((sc) => {
    versToon(sc, { normales: 0.01, sansContour: SC_BATI });
    const o = sc.getObjectByName('Puits1').clone(true); o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrixWorld(true); /* (la meme mesure que les niveaux 1 a 5, kDe de 09-modeles.js) */
    const b = new T.Box3().setFromObject(o), d = new T.Vector3(); b.getSize(d);
    MODELES.puits6 = gabaritEchelle(sc, 'Puits6', 1.75 / Math.max(d.x, d.z), b.getCenter(new T.Vector3()));
    if (nivBat('nivPuits') >= 6) construireBatiments();
  }).catch(() => { puits6Charge = null; }));
}
function activerPuits6() {
  const a = AMELIOS.find((x) => x.id === 'nivPuits'); if (!a || a.couts.length >= 5) return;
  a.couts.push(PUITS6.cout); a.nivs.push(PUITS6.niv);
  a.desc += ' Niveau 6 : le récupérateur d\'eau de pluie, citerne de ' + PUITS6.citerne + ', arrosoir de ' + PUITS6.eau + ', et les champs qui touchent le puits sont toujours arrosés.';
  PALIERS_BAT.nivPuits.push('Le récupérateur d\'eau de pluie : citerne de ' + PUITS6.citerne + ', arrosoir de ' + PUITS6.eau + ', et sa rigole arrose toujours les champs qui touchent le puits.');
  const G = GAINS.nivPuits; G.looks.push('le récupérateur d\'eau de pluie'); G.stats[0][2].push(PUITS6.eau); G.stats[1][2].push(PUITS6.citerne);
  G.neufs = G.neufs || {}; G.neufs[5] = [['eau', 'Les champs qui touchent le puits sont toujours arrosés']];
  chargerPuits6();
}
const entrerModeTestPuits6 = entrerModeTest; entrerModeTest = function () { const r = entrerModeTestPuits6.apply(this, arguments); if (MODE_TEST) activerPuits6(); return r; };
/* l'irrigation : un champ a une case du puits (diagonales comprises) */
const irrigue = (p) => nivBat('nivPuits') >= 6 && !enRuine('puits') && S_.cases.some((c) => c.type === 'puits' && Math.max(Math.abs(c.i - p.i), Math.abs(c.j - p.j)) <= PUITS6.portee);
function irriguer() { /* les champs plantes et pas arroses, autour du puits : arroses (a chaque semis, et toutes les 2 s pour ceux d'avant l'achat) */
  if (!S_ || nivBat('nivPuits') < 6) return;
  S_.cases.forEach((p) => { if (p.type === 'champ' && p.c && !p.arrose && irrigue(p)) { p.arrose = true; rendreCase(p.id); } });
}
setInterval(() => { try { irriguer(); } catch (e) { /* (avant le chargement de la ferme) */ } }, 2000);
const planterPuits6 = ACTIONS.planter; ACTIONS.planter = function (p) { const r = planterPuits6.apply(this, arguments); if (p && p.c && !p.arrose && irrigue(p)) { p.arrose = true; rendreCase(p.id); } return r; };
const amelioPuits6 = ACTIONS.amelio; ACTIONS.amelio = function (id) {
  const avant = id === 'nivPuits' ? nivBat('nivPuits') : 0, r = amelioPuits6.apply(this, arguments);
  if (id === 'nivPuits' && avant === 5 && nivBat('nivPuits') === 6) { irriguer(); setTimeout(() => toast('Le récupérateur d\'eau de pluie est en place : sa rigole arrose toujours les champs qui touchent le puits.', 'or'), 1600); }
  return r;
};
