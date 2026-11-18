'use strict';
/* LA TRIBU DE LA MARE (18/11/2026, palier 11, vagues 106 a 110 ; « pour les monstres du niveau 106 a 110, j'aimerais des creatures hybrides, des poissons
   bipedes enrages et des reptiles (crocodiles) tres sauvages », Mathieu ; dessins retenus : maquettes/saison-des-pluies/monstres-13-tribu-retenue.png).
   En avant-premiere dans l'Arene dev seulement (version dev), comme les amphibiens. Le premier en 3D : le Croco de la vase, « une creature sauvage, qui
   tape avec ses griffes acerees, de longs bras, penchee vers l'avant » : Rodin en pose T (museau allonge, blender/allonger-museau.py), texture cuite en
   aplats (outils/tribu/cuire_aplats.py), squelette du Creature Pack (placer-squelette.py, lier-squelette.py ... epaules queue_bassin), mouvements des
   mutants (blender/monstre-anime.py crocoVase), au rendu B des Bworks (27d-bworks-v2.js). Forces provisoires, sans sort : a regler avec Mathieu. */
SQUELETTES_A_CHARGER.push(['croco-vase', 'assets/modeles/jeu/croco-vase-anime.glb', 2.6]); NOMS_BW2.add('croco-vase'); VITESSE_FAMILLE['croco-vase'] = 1.35;
MONSTRES.crocoVase = { element: 'eau', nom: 'Croco de la vase', modele: 'croco-vase', icone: 'triton', /* (icone provisoire : la sienne se fera d'apres son rendu en jeu) */
  desc: 'la bête de la vase, voûtée sur ses longs bras : elle fonce sur toi et lacère de ses griffes', pv: (n) => 4800 + 140 * (n - 100), deg: (n) => 88 + Math.round(3 * (n - 100)),
  cadence: 1.6, vitesse: 3.0, portee: 2.0, ombre: 2.2 };
/* LE PIRANHA DE GUERRE (18/11/2026, « Piranha de guerre » choisi par Mathieu apres le Croco) : petit, rond et rapide, en nombre ; meme methode (dessin de face
   sans son couteau d'os, Rodin, aplats, squelette des creatures) avec le corps d'un bloc (lier-squelette.py ... corps_rigide corps_bassin : les mutants
   penchaient la tete et pliaient l'oeuf). Forces provisoires, sans sort ; idee de Mathieu pour son kit : « saignement, moins on a de PV plus les piranhas
   sont forts » (a regler avec lui) */
SQUELETTES_A_CHARGER.push(['piranha', 'assets/modeles/jeu/piranha-anime.glb', 1.7]); NOMS_BW2.add('piranha'); VITESSE_FAMILLE['piranha'] = 1.3;
MONSTRES.piranha = { element: 'eau', nom: 'Piranha de guerre', modele: 'piranha', icone: 'triton', /* (icone provisoire) */
  desc: 'petit, rond et vorace, il arrive en bande et mord vite', pv: (n) => 2600 + 80 * (n - 100), deg: (n) => 55 + Math.round(2 * (n - 100)),
  cadence: 1.0, vitesse: 3.6, portee: 1.6, ombre: 1.6 };
AVANT_PREMIERE.unshift('crocoVase', 'piranha'); GROUPES_DEV.tribu = { nom: 'La tribu de la mare', liste: { crocoVase: 2, piranha: 4 } };
