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
AVANT_PREMIERE.unshift('crocoVase'); GROUPES_DEV.tribu = { nom: 'La tribu de la mare', liste: { crocoVase: 3 } };
