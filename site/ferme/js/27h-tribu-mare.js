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
/* LE CROCO SAUVAGE, BOSS DE LA VAGUE 110 (18/11/2026) : le dessin « croco sauvage B », de face bras ecartes, Rodin, aplats recales sur le dessin (vert, crete
   orange, ventre beige), squelette des creatures (placer-squelette.py : profondeur des jambes prise sur leur devant, sa queue passe derriere), queue au
   bassin. Pour l'instant un gros monstre sans ses sorts, a voir bouger dans l'Arene dev ; son kit (la traque, l'odeur du sang, la Machoire qui retient,
   la Plongee dans la vase, la Crue de la mare, la Frenesie de sang) est dans PALIER11.md, a chiffrer avec Mathieu */
/* (18/11/2026 au soir, refait d'apres un dessin plus fidele : « il est pas tres ressemblant », « tres peu de details », « un peu petit », « pas tres menacant »,
   « penche en avant, comme s'il reposait de temps a autre sur ses pattes avant », Mathieu) : voute, longs bras qui touchent presque le sol, tete de croco
   qui montre les dents, crete dense, texture d'origine (pas d'aplats), 4,6 de haut comme Moon, son propre rendu B plus doux (RENDU_B_PAR, 27d), et plus
   coriace en attendant son kit */
SQUELETTES_A_CHARGER.push(['croco-boss', 'assets/modeles/jeu/croco-boss-anime.glb', 4.6]); NOMS_BW2.add('croco-boss'); VITESSE_FAMILLE['croco-boss'] = 1.25;
MONSTRES.crocoBoss = { element: 'eau', nom: 'Croco sauvage', modele: 'croco-boss', icone: 'triton', /* (nom et icone provisoires) */
  desc: 'le chasseur de la mare : rapide, il te traque et ne te laisse pas respirer', pv: (n) => 160000 + 4000 * (n - 100), deg: (n) => 220 + Math.round(5 * (n - 100)),
  cadence: 1.3, vitesse: 3.6, portee: 3.2, ombre: 4.2 };
AVANT_PREMIERE.unshift('crocoVase', 'piranha', 'crocoBoss'); GROUPES_DEV.tribu = { nom: 'La tribu de la mare', liste: { crocoVase: 2, piranha: 4 } };
GROUPES_DEV.crocoBoss = { nom: 'Le boss de la 110 (essai, sans ses sorts)', liste: { crocoBoss: 1 } };
