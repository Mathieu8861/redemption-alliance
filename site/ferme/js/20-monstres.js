'use strict';
const TIR_FEU = 10; /* Cra : une attaque sur 10 est une fleche de feu */
/* les paliers : 10 vagues chacun, un boss a la 10e. Battre le Bouftou Royal ouvre la Vague de Chafers (vagues 11 a 20), battre le Chafer Cuirasse ouvre la Horde des Bworks (21 a 30). */
const PALIERS = [{ nom: 'Amakna', boss: 'royal', icone: 'bouftou-royal' }, { nom: 'la Vague de Chafers', boss: 'cuirasse', icone: 'chafer-cuirasse' }, { nom: 'la Horde des Bworks', boss: 'bworker', icone: 'bworker' }, { nom: 'le Massif des Craqueleurs', boss: 'craqLegendaire', icone: 'craq-legendaire' }, { nom: 'le Nid des Dragoeufs', boss: 'crocabulia', icone: 'crocabulia' }, { nom: 'l\'île des Wabbits', boss: 'waWabbit', icone: 'wa-wabbit', phase: 2 }, { nom: 'la Montagne des Koalaks', boss: 'koulosse', icone: 'koulosse', phase: 2 }];
const nomPalier = (P) => P < 5 ? 'Palier ' + (P + 1) : 'Phase 2, palier ' + (P - 4); /* la Phase 2 commence apres Crocabulia (« le niveau 1 a 50 c'est la phase 1 », Mathieu) */
const VAGUES_TOTAL = VAGUES_PALIER * PALIERS.length;
const palierDe = (n) => Math.min(PALIERS.length - 1, Math.floor((n - 1) / VAGUES_PALIER)), vagueCourante = () => Math.min(S_.vague.num, VAGUES_TOTAL);
const MONSTRES = {
  tofu: { nom: 'Tofu', modele: 'tofu', icone: 'tofu', desc: 'très rapide, file picorer tes cultures', grignote: true, pv: (n) => 12 + 5 * n, deg: (n) => 1 + Math.floor(n / 4), cadence: 1.2, vitesse: 4.6, portee: 0.95, ombre: 0.9 },
  /* « les vagues 1 a 10, des Tofus et des Chafers, le boss un Bouftou Royal ? » (Mathieu, 13/10/2026) : le palier d'Amakna, ce sont les Bouftous du Royal.
     Le Bouftou des vagues est celui de la ferme (bouftou.js, pattes articulees), fabrique neuf a chaque apparition ; ses chiffres sont ceux du Chafer d'avant */
  bouftou: { nom: 'Bouftou', modele: 'chafer', fabrique: () => fabriquerBouftou(), icone: 'bouftou', desc: 'fonce tête baissée, s\'en prend aussi aux bâtiments', casse: 0.4, pv: (n) => 30 + 10 * n, deg: (n) => 3 + Math.floor(n * 0.7), cadence: 1.4, vitesse: 1.5, portee: 1.15, ombre: 1.4 },
  chafer: { nom: 'Chafer', modele: 'chafer', icone: 'chafer', desc: 'frappe fort, s\'en prend aussi aux bâtiments', casse: 0.4, pv: (n) => 30 + 10 * n, deg: (n) => 3 + Math.floor(n * 0.7), cadence: 1.4, vitesse: 1.5, portee: 1.15, ombre: 1.4 },
  voleurRaid: { nom: 'Voleur de VSA', modele: 'voleur', icone: 'voleur', desc: 'file vers ta grange', pv: () => pvSimu(false), deg: () => 0, cadence: 9, vitesse: 3, portee: 1, ombre: 1.65, vole: 1 }, /* (2,5 avant le 19/10/2026 : « une attaque eclair », Mathieu) */
  monture: { nom: 'Voleur à dos de Dragodinde', modele: 'voleurMonte', icone: 'voleur', desc: 'rapide et coriace, emporte deux fois plus', pv: () => pvSimu(true), deg: () => 0, cadence: 9, vitesse: 5, portee: 1.2, ombre: 2.0, vole: 2 }, /* (3,8 avant le 19/10/2026) */
  demenageur: { nom: 'Déménageur de VSA', modele: 'demenageur', icone: 'voleur', desc: 'énorme et lent, mais très coriace : arrivé à ta grange, il emporte quatre fois plus qu\'un voleur', pv: () => 5 * pvSimu(false), deg: () => 0, cadence: 9, vitesse: 2, portee: 1.3, ombre: 2.4, vole: 4 }, /* (le tank de VSA, 19/10/2026 : 1 par simu des la vague 30, 2 des la 50, en plus des voleurs) */
  royal: { nom: 'Bouftou Royal', modele: 'royal', icone: 'bouftou-royal', desc: 'le chef du troupeau : il fonce tête baissée (sors de la bande rouge, ou cache-toi derrière un bâtiment : il s\'y écrase), appelle des Tofus toutes les 16 s, enragé sous 30 % de vie', pv: () => 450, deg: () => 12, cadence: 1.6, vitesse: 1.2, portee: 1.8, ombre: 2.6, renforts: ['tofu', 'Tofus'], charge: 8, degSort: 3.8, rage: true, boss: true },
  /* palier 2 : la Vague de Chafers (k = numero de la vague dans le palier, 1 a 10) */
  fantassin: { nom: 'Chafer Fantassin', modele: 'fantassin', icone: 'chafer-fantassin', desc: 'le soldat, en nombre', casse: 0.4, pv: (n) => 70 + 8 * (n - 10), deg: (n) => 4 + Math.round(0.6 * (n - 10)), cadence: 1.4, vitesse: 1.8, portee: 1.15, ombre: 1.4 },
  gardien: { nom: 'Chafer Gardien', modele: 'gardien', icone: 'chafer-gardien', desc: 'lent, encaisse et cogne les bâtiments', casse: 0.6, pv: (n) => 120 + 10 * (n - 10), deg: (n) => 7 + (n - 10), cadence: 1.9, vitesse: 1.1, portee: 1.3, ombre: 1.5 },
  archer: { nom: 'Chafer Archer', modele: 'archer', icone: 'chafer-archer', desc: 'tire de loin, va le chercher', pv: (n) => 55 + 6 * (n - 10), deg: (n) => 4 + Math.round(0.5 * (n - 10)), cadence: 1.8, vitesse: 1.7, portee: 6, distance: true, ombre: 1.4 },
  cuirasse: { nom: 'Chafer Cuirassé', modele: 'cuirasse', icone: 'chafer-cuirasse', desc: 'armure (-25 %), te lance sa lance d\'os de loin (sors de la bande rouge, ou cache-toi derrière un bâtiment), se replie sous sa carapace d\'épines (presque aucun dégât, il renvoie un cinquième de tes coups : frappe ses soldats en attendant), appelle des Fantassins toutes les 16 s ; enragé sous 30 % de vie, il appelle des Archers', pv: () => 1650, deg: () => 14, cadence: 1.8, vitesse: 1.2, portee: 2.0, ombre: 2.8, armure: 0.25, renforts: ['fantassin', 'Fantassins'], renfortsRage: ['archer', 'Chafers Archers'], carapace: 10, lance: 9, degSort: 3.5, rage: true, boss: true }, /* (14/10/2026 : la lance d'os toutes les 9 s et les Archers en rage, « je le trouve tellement simple en Cra », Mathieu ; vitesse 1 avant, 1,1 puis 1,2 le meme jour, « augmente sa vitesse de 10 % aussi ». PV de base 1 650 au lieu de 1 100 (« si tu fais tes tests sans equipement, sans tour, sans potion... », Mathieu : rejoue sur une vraie ferme de bot Cra niveau 20, panoplie du Chafer, 4 tours niveau 3, arbalete 2, l'ancien Chafer etait battu 8 fois sur 8 avec 92 % de vie en moyenne en reculant ; avec 1 650 PV, 6 fois sur 8 avec 40 % en reculant, 7 sur 8 avec 45 % en restant plante) Simule : 6 s et 5 fois ses degats, le bot Cra perdait 5 fois sur 5) */
  /* palier 3 : la Horde des Bworks (k = n - 20) */
  bwork: { nom: 'Bwork', modele: 'bwork', icone: 'bwork', desc: 'la brute à massue, démolit les bâtiments', casse: 0.7, pv: (n) => 150 + 12 * (n - 20), deg: (n) => 9 + Math.round(1.2 * (n - 20)), cadence: 1.7, vitesse: 1.4, portee: 1.4, ombre: 1.6 },
  bworkArcher: { nom: 'Bwork Archer', modele: 'bworkArcher', icone: 'bwork-archer', desc: 'tire de loin, va le chercher', pv: (n) => 90 + 8 * (n - 20), deg: (n) => 7 + Math.round(0.7 * (n - 20)), cadence: 1.8, vitesse: 1.6, portee: 6, distance: true, ombre: 1.5 },
  bworkMage: { nom: 'Bwork Mage', modele: 'bworkMage', icone: 'bwork-mage', desc: 'soigne la horde, abats-le en premier', pv: (n) => 100 + 8 * (n - 20), deg: (n) => 6 + Math.round(0.5 * (n - 20)), cadence: 2.0, vitesse: 1.3, portee: 5, distance: true, magie: true, soigne: 3.5, ombre: 1.5 },
  bworkette: { nom: 'Bworkette', modele: 'bworkette', icone: 'bworkette', desc: 'rapide, pique sans arrêt', casse: 0.5, pv: (n) => 80 + 7 * (n - 20), deg: (n) => 5 + Math.round(0.6 * (n - 20)), cadence: 0.9, vitesse: 2.7, portee: 1.3, ombre: 1.3 },
  bworker: { nom: 'Bworker', modele: 'bworker', icone: 'bworker', desc: 'armure (-30 %), il saute sur toi et écrase le sol (sors du cercle rouge), appelle des Bworks toutes les 16 s, enragé sous 30 % de vie', pv: () => 2875, deg: () => 22, /* (2 300 avant le 15/10/2026 : +25 %, pour rester au-dessus du Chafer renforce ; simule Cra niveau 30 qui recule : 6 victoires sur 8 a 60 % de vie, contre 5 sur 8 a 25 % pour le Chafer niveau 21) */ cadence: 2.0, vitesse: 1.0, portee: 2.3, ombre: 3.2, armure: 0.3, renforts: ['bwork', 'Bworks'], bondit: 9, degSort: 7.3, rage: true, boss: true },
  /* palier 4 : le Massif des Craqueleurs (h = n - 30) */
  craqueleur: { nom: 'Craqueleur', modele: 'craqueleur', icone: 'craqueleur', desc: 'golem de pierre, coriace, démolit les bâtiments', res: 'eclat_craq', pv: (n) => 240 + 16 * (n - 30), deg: (n) => 12 + Math.round(1.1 * (n - 30)), cadence: 1.9, vitesse: 1.1, portee: 1.5, ombre: 1.8, armure: 0.15, casse: 0.8 },
  craqueboule: { nom: 'Craqueboule', modele: 'craqueboule', icone: 'craqueboule', desc: 'un rocher qui roule vite et mord', res: 'eclat_craq', pv: (n) => 140 + 10 * (n - 30), deg: (n) => 8 + Math.round(0.7 * (n - 30)), cadence: 1.0, vitesse: 2.8, portee: 1.2, ombre: 1.4, casse: 0.5, roule: true },
  craqLanceur: { nom: 'Craqueleur Lanceur', modele: 'craqLanceur', icone: 'craq-lanceur', desc: 'lance des rochers de loin, même sur tes bâtiments', res: 'eclat_craq', pv: (n) => 150 + 9 * (n - 30), deg: (n) => 10 + Math.round(0.8 * (n - 30)), cadence: 2.2, vitesse: 1.3, portee: 6.5, distance: true, projectile: 'rocher', ombre: 1.6, casse: 0.4 },
  craqCristal: { nom: 'Craqueleur de Cristal', modele: 'craqCristal', icone: 'craq-cristal', desc: 'protège la horde, bouclier de cristal (-40 % de dégâts)', res: 'eclat_craq', pv: (n) => 180 + 11 * (n - 30), deg: (n) => 7 + Math.round(0.5 * (n - 30)), cadence: 2.0, vitesse: 1.2, portee: 1.4, ombre: 1.6, protege: 5 },
  craqLegendaire: { nom: 'Craqueleur Légendaire', modele: 'craqLegendaire', icone: 'craq-legendaire', desc: 'armure (-35 %), séisme : un cercle rouge autour de lui, éloigne-toi avant qu\'il frappe le sol ; appelle des Craqueboules toutes les 16 s, enragé sous 30 % de vie', res: 'eclat_craq', pv: () => 3600, deg: () => 26, cadence: 2.1, vitesse: 0.9, portee: 2.6, ombre: 3.4, armure: 0.35, renforts: ['craqueboule', 'Craqueboules'], seisme: 8, degSort: 10.6, rage: true, boss: true },
  /* palier 5 : le Nid des Dragoeufs (h = n - 40) */
  dragBlanc: { nom: 'Dragoeuf Blanc', modele: 'dragBlanc', icone: 'drag-blanc', desc: 'très rapide, mord sans arrêt', res: 'ecaille_drag', pv: (n) => 200 + 12 * (n - 40), deg: (n) => 10 + (n - 40), cadence: 0.9, vitesse: 3.0, portee: 1.3, ombre: 1.4, casse: 0.4 },
  dragNoir: { nom: 'Dragoeuf Noir', modele: 'dragNoir', icone: 'drag-noir', desc: 'la brute à piques, démolit les bâtiments', res: 'ecaille_drag', pv: (n) => 380 + 20 * (n - 40), deg: (n) => 17 + Math.round(1.4 * (n - 40)), cadence: 1.8, vitesse: 1.5, portee: 1.6, ombre: 1.9, armure: 0.1, casse: 0.85 },
  dragArdoise: { nom: 'Dragoeuf Ardoise', modele: 'dragArdoise', icone: 'drag-ardoise', desc: 'vole, crache du feu de loin, incendie tes bâtiments', vol: 1.2, res: 'ecaille_drag', pv: (n) => 220 + 12 * (n - 40), deg: (n) => 12 + (n - 40), cadence: 2.0, vitesse: 1.5, portee: 6, distance: true, projectile: 'feu', ombre: 1.6, casse: 0.6 },
  dragDore: { nom: 'Dragoeuf Doré', modele: 'dragDore', icone: 'drag-dore', desc: 'vole au-dessus de la horde et la galvanise, ils frappent et courent plus vite', vol: 1.5, res: 'ecaille_drag', pv: (n) => 260 + 14 * (n - 40), deg: (n) => 10 + Math.round(0.8 * (n - 40)), cadence: 1.9, vitesse: 1.6, portee: 1.4, ombre: 1.7, galvanise: 5 },
  crocabulia: { nom: 'Crocabulia', propre: true, fem: true, modele: 'crocabulia', icone: 'crocabulia', desc: 'la mère des Dragoeufs, armure (-35 %), souffle de feu (sors du cône rouge), appelle ses petits toutes les 16 s, enragée sous 30 % de vie', res: 'ecaille_drag', pv: () => 4100, deg: () => 26, cadence: 2.2, vitesse: 1.0, portee: 2.8, ombre: 4.0, armure: 0.35, renforts: ['dragBlanc', 'Dragoeufs Blancs'], souffle: 7, degSort: 14, rage: true, boss: true },
  /* Phase 2, palier 1 : l'ile des Wabbits (s = n - 50). Les petits grignotent tes cultures, les Cawottes d'abord, puis les Fraises (« c'est leur peche mignon », Mathieu) */
  wabbit: { nom: 'Wabbit', modele: 'wabbit', icone: 'wabbit', desc: 'rapide, file grignoter tes Cawottes puis tes Fraises', res: 'poil_wabbit', grignote: true, gourmand: true, pv: (n) => 260 + 14 * (n - 50), deg: (n) => 12 + (n - 50), cadence: 1.0, vitesse: 2.9, portee: 1.2, ombre: 1.1 },
  wabbitNoir: { nom: 'Wabbit Noir', modele: 'wabbitNoir', icone: 'wabbit-noir', desc: 'le guerrier au bandeau rouge, cogne fort', res: 'poil_wabbit', pv: (n) => 470 + 22 * (n - 50), deg: (n) => 20 + Math.round(1.5 * (n - 50)), cadence: 1.6, vitesse: 1.7, portee: 1.5, ombre: 1.3, armure: 0.1, casse: 0.6 },
  wabbitSquelette: { nom: 'Wabbit Squelette', modele: 'wabbitSquelette', icone: 'wabbit-squelette', desc: 'se relève une fois quand on l\'abat', res: 'poil_wabbit', revit: true, pv: (n) => 320 + 16 * (n - 50), deg: (n) => 15 + (n - 50), cadence: 1.4, vitesse: 1.8, portee: 1.4, ombre: 1.2 },
  woWabbit: { nom: 'Wo Wabbit', modele: 'woWabbit', icone: 'wo-wabbit', desc: 'le gros, encaisse et soigne les Wabbits autour de lui', res: 'poil_wabbit', pv: (n) => 560 + 26 * (n - 50), deg: (n) => 13 + (n - 50), cadence: 2.0, vitesse: 1.2, portee: 1.5, ombre: 1.6, soigne: 4 },
  wabbitSorciere: { nom: 'Wabbit Sorcière', fem: true, modele: 'wabbitSorciere', icone: 'wabbit-sorciere', desc: 'la mage, lance des sorts violets de loin', res: 'poil_wabbit', pv: (n) => 250 + 12 * (n - 50), deg: (n) => 17 + Math.round(1.2 * (n - 50)), cadence: 2.0, vitesse: 1.5, portee: 6, distance: true, magie: true, couleurMagie: '#b48cff', ombre: 1.3 },
  gwandWabbit: { nom: 'Gwand Wabbit', modele: 'gwandWabbit', icone: 'gwand-wabbit', desc: 'le costaud à la cawotte-massue, démolit les bâtiments', res: 'poil_wabbit', pv: (n) => 720 + 30 * (n - 50), deg: (n) => 24 + 2 * (n - 50), cadence: 2.1, vitesse: 1.2, portee: 1.7, ombre: 1.9, armure: 0.15, casse: 0.9 },
  waWabbit: { nom: 'Wa Wabbit', modele: 'waWabbit', icone: 'wa-wabbit', desc: 'le roi des Wabbits, armure (-35 %), pluie de cawottes explosives (sors des cercles orange), la Cawotte royale (une petite cible rouge te suit puis se fige : file, la cawotte géante assomme), appelle des Wabbits toutes les 16 s (ils filent vers tes Cawottes), enragé sous 30 % de vie', res: 'poil_wabbit', pv: () => 4400, deg: () => 27, cadence: 2.2, vitesse: 1.0, portee: 2.6, ombre: 3.0, armure: 0.35, renforts: ['wabbit', 'Wabbits'], pluie: 7, cawotteRoyale: 11, degSort: 11.6, rage: true, boss: true }, /* (la Cawotte royale, son deuxieme sort, le 15/10/2026) */
  /* Phase 2, palier 2 : la Montagne des Koalaks (k = n - 60). Les 15 Koalaks (blender/koalaks.py), le Koulosse et ses Boufcouls (14/10/2026, « travaille-les bien »,
     puis « dommage de pas tout utiliser ») : chacun son role ; les comportements nouveaux : bucheron (frappe les tours), fouisseur (sort au pied d'un batiment),
     bandit (vole des kamas a la grange), ralentit, assomme, poison (sur le perso), fruit (projectile du lance-pierre), demonte (il continue a pied) */
  koalakImmature: { nom: 'Koalak Immature', modele: 'koalakImmature', icone: 'koalak-immature', desc: 'le petit, arrive en bande et file grignoter tes cultures', res: 'kaliptus', grignote: true, /* (comme les Wabbits : « fais en sorte qu'ils foncent pas tous sur lui direct », Mathieu) */ pv: (n) => 300 + 14 * (n - 60), deg: (n) => 16 + (n - 60), cadence: 0.9, vitesse: 3.1, portee: 1.2, ombre: 1.0, casse: 0.3 },
  koalakForestier: { nom: 'Koalak Forestier', modele: 'koalakForestier', icone: 'koalak-forestier', desc: 'le bûcheron à la hache double : il abat tes tours (deux fois plus de dégâts sur elles)', res: 'kaliptus', pv: (n) => 600 + 26 * (n - 60), deg: (n) => 26 + Math.round(1.6 * (n - 60)), cadence: 1.8, vitesse: 1.6, portee: 1.5, ombre: 1.4, armure: 0.1, casse: 0.8, bucheron: 2 },
  koalakFossoyeur: { nom: 'Koalak Fossoyeur', modele: 'koalakFossoyeur', icone: 'koalak-fossoyeur', desc: 'creuse sous ta ferme et ressort au pied d\'un bâtiment, derrière tes tours', res: 'kaliptus', pv: (n) => 480 + 20 * (n - 60), deg: (n) => 22 + Math.round(1.3 * (n - 60)), cadence: 1.5, vitesse: 1.7, portee: 1.4, ombre: 1.3, casse: 1, fouisseur: true },
  guerrierKoalak: { nom: 'Guerrier Koalak', modele: 'guerrierKoalak', icone: 'guerrier-koalak', desc: 'la brute en armure, démolit les bâtiments', res: 'kaliptus', pv: (n) => 880 + 34 * (n - 60), deg: (n) => 30 + 2 * (n - 60), cadence: 2.1, vitesse: 1.3, portee: 1.7, ombre: 1.8, armure: 0.15, casse: 0.9 },
  koalakFarouche: { nom: 'Koalak Farouche', modele: 'koalakFarouche', icone: 'koalak-farouche', desc: 'le bandit : file à ta grange, vole des kamas et s\'enfuit (abats-le pour les récupérer)', res: 'kaliptus', pv: (n) => 420 + 18 * (n - 60), deg: (n) => 18 + (n - 60), cadence: 1.2, vitesse: 2.6, portee: 1.3, ombre: 1.2, bandit: true },
  mamaKoalak: { nom: 'Mama Koalak', fem: true, modele: 'mamaKoalak', icone: 'mama-koalak', desc: 'soigne les Koalaks autour d\'elle, abats-la en premier', res: 'kaliptus', pv: (n) => 650 + 28 * (n - 60), deg: (n) => 15 + (n - 60), cadence: 2.0, vitesse: 1.3, portee: 1.5, ombre: 1.5, soigne: 4 },
  maitreKoalak: { nom: 'Maître Koalak', modele: 'maitreKoalak', icone: 'maitre-koalak', desc: 'galvanise la horde : ils frappent et courent plus vite', res: 'kaliptus', pv: (n) => 560 + 24 * (n - 60), deg: (n) => 16 + (n - 60), cadence: 2.0, vitesse: 1.3, portee: 1.5, ombre: 1.4, galvanise: 5 },
  dokAlako: { nom: 'Dok Alako', propre: true, modele: 'dokAlako', icone: 'dok-alako', desc: 'le sorcier : boules de feu rouges, de loin', res: 'kaliptus', pv: (n) => 380 + 16 * (n - 60), deg: (n) => 24 + Math.round(1.4 * (n - 60)), cadence: 2.0, vitesse: 1.5, portee: 6, distance: true, magie: true, couleurMagie: '#ff5a3a', ombre: 1.3 },
  momieKoalak: { nom: 'Momie Koalak', fem: true, modele: 'momieKoalak', icone: 'momie-koalak', desc: 'se relève une fois, et te ralentit quand elle te frappe', res: 'kaliptus', revit: true, ralentit: 2.5, pv: (n) => 520 + 22 * (n - 60), deg: (n) => 20 + Math.round(1.2 * (n - 60)), cadence: 1.5, vitesse: 1.4, portee: 1.4, ombre: 1.3 },
  koalakGriotte: { nom: 'Koalak Griotte', modele: 'koalakGriotte', icone: 'koalak-griotte', desc: 'au lance-pierre : tire ses griottes très vite', res: 'kaliptus', pv: (n) => 340 + 15 * (n - 60), deg: (n) => 14 + (n - 60), cadence: 1.1, vitesse: 1.7, portee: 6, distance: true, projectile: 'fruit', fruit: '#d0243a', ombre: 1.2 },
  koalakReinette: { nom: 'Koalak Reinette', modele: 'koalakReinette', icone: 'koalak-reinette', desc: 'au lance-pierre : sa pomme t\'assomme un instant', res: 'kaliptus', pv: (n) => 360 + 15 * (n - 60), deg: (n) => 18 + (n - 60), cadence: 2.0, vitesse: 1.7, portee: 6, distance: true, projectile: 'fruit', fruit: '#93cf3e', assomme: 0.7, ombre: 1.2 },
  koalakIndigo: { nom: 'Koalak Indigo', modele: 'koalakIndigo', icone: 'koalak-indigo', desc: 'au lance-pierre : sa baie t\'empoisonne quelques secondes', res: 'kaliptus', pv: (n) => 360 + 15 * (n - 60), deg: (n) => 15 + (n - 60), cadence: 2.0, vitesse: 1.7, portee: 6, distance: true, projectile: 'fruit', fruit: '#4f63c8', poison: [0.012, 4], ombre: 1.2 },
  koalakCoco: { nom: 'Koalak Coco', modele: 'koalakCoco', icone: 'koalak-coco', desc: 'au lance-pierre : sa noix de coco abîme tes bâtiments, de loin', res: 'kaliptus', pv: (n) => 400 + 17 * (n - 60), deg: (n) => 22 + Math.round(1.3 * (n - 60)), cadence: 2.3, vitesse: 1.6, portee: 6, distance: true, projectile: 'fruit', fruit: '#7a5230', grosFruit: true, ombre: 1.2, casse: 0.7 },
  drakoalak: { nom: 'Drakoalak', modele: 'drakoalak', icone: 'drakoalak', desc: 'charge en ligne droite sur sa Dragodinde : sors de la bande rouge', res: 'kaliptus', pv: (n) => 820 + 32 * (n - 60), deg: (n) => 28 + Math.round(1.8 * (n - 60)), cadence: 1.8, vitesse: 2.4, portee: 1.7, ombre: 2.0, charge: 9, degSort: 1.8 },
  chevaucheurKoalak: { nom: 'Chevaucheur Koalak', modele: 'chevaucheurKoalak', icone: 'chevaucheur-koalak', desc: 'quand sa monture squelette tombe, il continue à pied', res: 'kaliptus', pv: (n) => 700 + 28 * (n - 60), deg: (n) => 26 + Math.round(1.6 * (n - 60)), cadence: 1.8, vitesse: 2.2, portee: 1.8, ombre: 2.0, demonte: 'guerrierKoalak' },
  boufcoul: { nom: 'Boufcoul', modele: 'chafer', fabrique: () => fabriquerBoufcoul(), icone: 'boufcoul', desc: 'le Bouftou du Koulosse, laine rasta : il fonce sur toi', res: 'kaliptus', pv: (n) => 500 + 20 * (n - 60), deg: (n) => 20 + (n - 60), cadence: 1.4, vitesse: 2.2, /* (+10 % le 15/10/2026) */ portee: 1.3, ombre: 1.4, casse: 0.3 },
  koulosse: { nom: 'Koulosse', propre: true, modele: 'koulosse', icone: 'koulosse', desc: 'le colosse fumeur de la montagne, armure (-35 %) : crache des nuages de fumée (les toucher empoisonne : 2 s de poison par seconde passée dedans), t\'attire à lui (sors de la bande verte), appelle des Boufcouls toutes les 16 s ; sous 30 % de vie, il tire sur son calumet et s\'entoure de fumée', res: 'kaliptus', pv: () => 5200, deg: () => 30, cadence: 2.3, vitesse: 0.9, portee: 2.8, ombre: 4.2, armure: 0.35, renforts: ['boufcoul', 'Boufcouls'], fumee: 9, appel: 13, calumet: true, degSort: 9, rage: true, boss: true }
};
const STATS_CLASSE = {
  /* (13/10/2026, Mathieu : portees en cases rondes, Iop 1, Osamodas 3, Cra 5 (une case = S = 2 unites) ; degats de base 10, 6 et 8, puis la pente par niveau
     reglee par simulation : le Iop, expose au corps a corps, monte le plus ; le Cra, a distance, un peu moins ; l'Osamodas le moins, son invocation tapant fort.
     Avant : portees 1,5, 7 et 3,2 unites, degats 8, 8 et 7 + 2 par niveau) */
  iop: { pv: (l) => 80 + 17 * l, deg: (l) => Math.round(10 + 2 * l), cadence: 0.9, portee: 1 * S },
  cra: { pv: (l) => 60 + 13 * l, deg: (l) => Math.round(8 + 2 * l), cadence: 0.85, portee: 5 * S }, /* (2 par niveau, 2,2 avant le 13/10/2026 au soir : le bot patient finissait ses vagues a 80-86 % de vie en Cra, 55-70 % pour les autres ; sa course +15 % reste) */
  osa: { pv: (l) => 60 + 13 * l, deg: (l) => Math.round(6 + 1.8 * l), cadence: 0.9, portee: 3 * S }
};
/* la durete des monstres ordinaires, par palier (les boss gardent leurs propres stats) : reglee par simulation le 11/10/2026 */
/* (13/10/2026, « augmente un chouille la difficulte du 1 a 50, +10 % de degats des monstres », Mathieu : les degats des paliers 1 a 5 x1,1, le palier 6 et les boss inchanges) */
/* +15 % de PV et de degats des la vague 11, boss compris (13/10/2026, bot patient : 1 a 3 defaites sur toute la partie ; avant : 1,1/1,27, 1,3/1,6, 1,4/1,71, 1,45/1,76, 1,4/1,5).
   Le premier palier ne change pas. Le lissage des renforts (renfort) part de la 9e vague : le palier 2 monte donc en douceur jusqu'aux +15 % */
const DURETE = [{ pv: 1, deg: 1.1 }, { pv: 1.265, deg: 1.46 }, { pv: 1.495, deg: 1.84 }, { pv: 1.61, deg: 1.97 }, { pv: 1.67, deg: 2.02 }, { pv: 1.61, deg: 1.73 }, { pv: 1.6, deg: 1.55 }]; /* (les Koalaks, 14/10/2026 : 1,61 et 1,73 au premier jet, simule trop dur quand ils fonçaient tous sur le perso ; les Immatures vont maintenant aux champs, comme les Wabbits) */
const durete = (t, n) => MONSTRES[t].boss || t === 'voleurRaid' || !(n >= 1) ? { pv: 1, deg: 1 } : DURETE[palierDe(n)]; /* les voleurs des raids VSA ont leur propre equilibrage */
/* « quand on reprend une nouvelle phase, les mobs sont nuls sur les premiers niveaux : la vague 19 est plus dure que la 22 » (Mathieu, 12/10/2026) :
   chaque palier repartait avec 3 ou 4 monstres, une force divisee par 5 d'une vague a l'autre. La force d'une vague = PV totaux x degats par seconde ;
   les premieres vagues d'un palier ont plus de monstres (compoVague), puis des PV et des degats en plus (x1,8 au plus) pour monter regulierement depuis la 9e vague du palier precedent jusqu'a la 9e du
   sien. Le premier palier, les 9es vagues et les boss ne changent pas. */
/* les premieres vagues d'un palier ont au moins 60 % de l'effectif de la fin du palier precedent (des monstres de base en plus) */
const effectif = (L) => L.reduce((t, [, k]) => t + k, 0);
const compoVague0 = (n) => { const L = compoBase(n), h = (n - 1) % VAGUES_PALIER + 1; if (n <= VAGUES_PALIER || n > VAGUES_TOTAL || h >= VAGUES_PALIER - 1) return L;
  const manque = Math.ceil(effectif(compoBase(n - h - 1)) * 0.6) - effectif(L); return manque > 0 ? L.map(([t, k], i) => [t, i ? k : k + manque]) : L; };
/* « je rajouterais bien 1 mob par vague, sauf sur le premier palier : on laisse le debutant se faire au jeu » (Mathieu, 13/10/2026) : des la vague 11, un monstre
   de base de plus (le plus nombreux de la vague, jamais un boss). Il ne compte pas dans le lissage des renforts (forceBrute) : sinon ses PV seraient repris aux autres */
const MOBS_EN_PLUS = 1;
const compoVague = (n) => { const L = compoVague0(n).map((x) => x.slice()); if (n <= VAGUES_PALIER || n > VAGUES_TOTAL) return L;
  let k = -1; L.forEach(([t, nb], i) => { if (!MONSTRES[t].boss && (k < 0 || nb > L[k][1])) k = i; }); if (k >= 0) L[k][1] += MOBS_EN_PLUS; return L; };
/* « durcis encore » (Mathieu, 12/10/2026) : les monstres des vagues normales prennent des PV et des degats en plus, davantage dans les paliers du haut
   (simulations : on finissait les vagues avec 65 a 95 % de PV, maintenant 30 a 70 %). Les vagues de boss et les voleurs des raids ne changent pas. */
const DURCI = { deg: [1.1, 1.2, 1.3, 1.5, 1.5, 1.75, 1.75], pv: [1.1, 1.1, 1.15, 1.2, 1.2, 1.38, 1.38] }; /* (les Wabbits, 12/10/2026 : « rassure-moi, la vague 51 est plus dure que 45 a 49 ? » ; elle etait entre la 46 et la 47, maintenant 10 % au-dessus de la 49) */
const durci = (t, n, c) => (MONSTRES[t].boss || !(n >= 1) || n % VAGUES_PALIER === 0 ? 1 : DURCI[c][palierDe(n)] || 1);
const forceBrute = (n) => { let pv = 0, dps = 0; compoVague0(n).forEach(([t, k]) => { const d = durete(t, n); pv += k * MONSTRES[t].pv(n) * d.pv * durci(t, n, 'pv'); dps += k * MONSTRES[t].deg(n) * d.deg * durci(t, n, 'deg') * multDegats(n) / MONSTRES[t].cadence; }); return pv * dps; };
const RENFORTS = {};
const renfort = (n) => { if (n in RENFORTS) return RENFORTS[n]; const h = (n - 1) % VAGUES_PALIER + 1; let f = 1;
  if (n > VAGUES_PALIER && n <= VAGUES_TOTAL && h < VAGUES_PALIER - 1) { const a = forceBrute(n - h - 1), b = forceBrute(n - h + VAGUES_PALIER - 1), cible = a * Math.pow(b / a, h / (VAGUES_PALIER - 1)); f = Math.min(1.8, Math.max(1, Math.sqrt(cible / forceBrute(n)))); } /* (plafonne : au-dela, des coups trop gros) */
  return (RENFORTS[n] = Math.round(f * 100) / 100); };
/* « je viens de faire le boss craqueleur, il est bidon a mort » puis « tu peux mettre x1,3 pour les monstres par rapport a la vague precedente, par contre
   le boss ca doit vraiment etre un boss, un truc dur a tuer, il faudrait qu'il ait un sort special aussi » (Mathieu, 12/10/2026) :
   l'escorte du boss : chaque monstre vaut le meme monstre de la vague d'avant (un peu moins dans les derniers paliers, ESCORTE), c'est leur nombre et les rappels qui font la difficulte. Le boss : beaucoup
   de PV (BOSS_PV, regle par simulation pour un long combat), des coups moderes (BOSS_DEG), et un sort special annonce au sol qu'on peut esquiver */
const ESCORTE = [1, 1, 0.8, 0.9, 0.85, 0.7, 0.62], vagueBoss = (n) => n >= 1 && n <= VAGUES_TOTAL && n % VAGUES_PALIER === 0;
const BOSS_PV = [2.6, 1.84, 1.38, 1.67, 1.7, 3.68, 3.4], BOSS_DEG = [0.3, 0.31, 0.35, 0.48, 0.5, 0.92, 0.95]; /* (+15 % des le boss 20, 13/10/2026 au soir : 1,6, 1,2, 1,45, 1,7, 3,2 et 0,27, 0,3, 0,42, 0,5, 0,8 avant ; les sorts des boss n'en dependent pas, voir degSort. Sauf Crocabulia, le boss 50, garde a 1,7 et 0,5 : a +15 %, le bot Osamodas patient l'a perdu 14 fois de suite, et le Cra simule 3 victoires sur 6) */ /* (le Wa Wabbit, 13/10/2026 : Moon l'ecrasait avec 65 a 76 % de vie, la vague 60 etait la plus facile de la fin du jeu ; 1,9 et 0,5 avant : 8 360 PV et 14 par coup, maintenant 14 080 et 22, simule : 50 a 62 % de vie avec tours, une defaite possible sur 4) */
/* « il faut obliger le joueur a prendre une decision entre focus les mobs et le boss » (Mathieu, 12/10/2026) : sa troupe le protege (chaque monstre a moins
   de 6 cases lui retire 12 % des degats recus, jusqu'a -60 %), et il la rappelle toutes les 16 s tant qu'il est debout. Taper le boss au milieu de ses gardes
   ne sert presque a rien, nettoyer la troupe sans fin non plus : on degage, puis on tape le boss avant le retour des renforts */
const PROTEGE_TROUPE = 0.12, PROTEGE_MAX = 0.6, RAYON_TROUPE = 6, RAPPEL_TROUPE = 16, TROUPE_MAX = 6;
const protectionBoss = (mo) => (combat ? Math.min(PROTEGE_MAX, PROTEGE_TROUPE * combat.monstres.filter((o) => o !== mo && o.etat === 'actif' && !o.d.boss && Math.hypot(o.x - mo.x, o.z - mo.z) < RAYON_TROUPE).length) : 0);
const degSort = (mo) => Math.max(1, Math.round(mo.d.boss ? mo.deg / BOSS_DEG[palierDe(combat.n || 1)] * (mo.degSortA || mo.d.degSort) : mo.deg * (mo.d.degSort || 1.5))); /* (un monstre ordinaire qui charge, le Drakoalak : degSort fois ses degats) */ /* les sorts : degSort fois ses degats de base, quel que soit BOSS_DEG */
const forceBoss = (t, n, k) => (MONSTRES[t].boss && n >= 1 ? (k ? BOSS_DEG : BOSS_PV)[palierDe(n)] : 1);
/* LA FORCE D'UN MONSTRE (refonte du 16/10/2026), ses PV (c = 'pv') ou ses degats (c = 'deg') a la vague n : sa fiche, x la durete du palier (DURETE),
   x les vagues normales durcies (DURCI), x le lissage des debuts de palier (renfort), x le boss (BOSS_PV, BOSS_DEG) ; l'escorte d'un boss vaut le
   meme monstre de la vague d'avant (ESCORTE). A son arrivee, la regle du combat s'ajoute : la revanche (facteurRejoue), l'Arene (regleArene),
   l'ile des boss (regleIleBoss). Sur le perso, ses coups prennent encore multDegats (DEGATS_MONSTRES), au moment du coup. */
const forceMonstre = (t, n, c) => (!MONSTRES[t].boss && vagueBoss(n) ? Math.round(forceMonstre(t, n - 1, c) * ESCORTE[palierDe(n)]) : Math.round(MONSTRES[t][c](n) * durete(t, n)[c] * durci(t, n, c) * renfort(n) * forceBoss(t, n, c === 'deg' ? 1 : 0)));
const pvMonstre = (t, n) => forceMonstre(t, n, 'pv'), degMonstre = (t, n) => forceMonstre(t, n, 'deg');
/* Phase 2, palier 2 : la Montagne des Koalaks (14/10/2026, « je trouve ca dommage de pas tout utiliser », « plus de monstres, ou alors la vague du boss se fait
   en plusieurs temps », Mathieu) : les 15 Koalaks arrivent au fil des vagues 61 a 69 (deux nouveaux presque a chaque vague), et la vague 70 se joue en trois temps :
   la horde, puis les cavaliers, puis le Koulosse et sa garde (PHASES_BOSS, lancees l'une apres l'autre quand la precedente est nettoyee) */
const COMPO_KOALAKS = [null,
  [['koalakImmature', 3], ['koalakForestier', 1], ['guerrierKoalak', 1], ['koalakGriotte', 2]],
  [['koalakImmature', 3], ['koalakForestier', 1], ['guerrierKoalak', 1], ['koalakFarouche', 1], ['koalakGriotte', 2]],
  [['koalakImmature', 3], ['guerrierKoalak', 1], ['koalakFarouche', 1], ['mamaKoalak', 1], ['koalakReinette', 2], ['koalakForestier', 1]],
  [['koalakImmature', 3], ['guerrierKoalak', 1], ['koalakFossoyeur', 1], ['mamaKoalak', 1], ['dokAlako', 1], ['koalakReinette', 1], ['koalakForestier', 1]],
  [['koalakImmature', 3], ['guerrierKoalak', 1], ['koalakFossoyeur', 1], ['maitreKoalak', 1], ['dokAlako', 1], ['koalakIndigo', 1]],
  [['koalakImmature', 3], ['guerrierKoalak', 1], ['momieKoalak', 1], ['maitreKoalak', 1], ['koalakCoco', 1], ['koalakIndigo', 1], ['koalakFarouche', 1]],
  [['koalakImmature', 3], ['guerrierKoalak', 1], ['drakoalak', 1], ['momieKoalak', 1], ['mamaKoalak', 1], ['koalakCoco', 1], ['koalakGriotte', 1]],
  [['koalakImmature', 3], ['guerrierKoalak', 1], ['chevaucheurKoalak', 1], ['drakoalak', 1], ['mamaKoalak', 1], ['maitreKoalak', 1], ['koalakReinette', 1]],
  [['koalakImmature', 3], ['guerrierKoalak', 1], ['chevaucheurKoalak', 1], ['drakoalak', 1], ['mamaKoalak', 1], ['momieKoalak', 1], ['dokAlako', 1], ['koalakCoco', 1]],
  [['koalakImmature', 4], ['koalakForestier', 1], ['guerrierKoalak', 2], ['koalakFarouche', 1], ['mamaKoalak', 1], ['dokAlako', 1], ['koalakGriotte', 1], ['koalakReinette', 1]]];
const PHASES_BOSS = { 70: [
  { nom: 'les cavaliers', L: [['drakoalak', 2], ['chevaucheurKoalak', 2], ['maitreKoalak', 1], ['koalakIndigo', 1], ['koalakCoco', 1]] },
  { nom: 'le Koulosse et sa garde', L: [['koulosse', 1], ['momieKoalak', 2], ['koalakFossoyeur', 1], ['mamaKoalak', 1]] }] };
const compoTotale = (n) => compoVague(n).concat(...(PHASES_BOSS[n] || []).map((p) => p.L)); /* (la vague entiere, ses temps compris : le bestiaire, la fenetre des vagues) */
const compoBase = (n) => {
  if (n === VAGUES_PALIER) return [['royal', 1], ['bouftou', 2], ['tofu', 3]];
  if (n < VAGUES_PALIER) return [['tofu', Math.min(8, 3 + Math.ceil(n * 0.6))]].concat(n >= 2 ? [['bouftou', Math.ceil(n / 3)]] : []);
  if (n > 6 * VAGUES_PALIER) return COMPO_KOALAKS[Math.min(VAGUES_PALIER, n - 6 * VAGUES_PALIER)].map((x) => x.slice()); /* la Montagne des Koalaks */
  if (n > 5 * VAGUES_PALIER) { /* Phase 2 : l'ile des Wabbits */
    const h = n - 5 * VAGUES_PALIER;
    if (h >= VAGUES_PALIER) return [['waWabbit', 1], ['woWabbit', 1], ['wabbitSorciere', 1], ['wabbitNoir', 1], ['wabbit', 2]];
    return [['wabbit', Math.min(4, 2 + Math.floor(h / 3))], ['wabbitNoir', Math.min(2, 1 + Math.floor(h / 5))]].concat(h >= 2 ? [['wabbitSquelette', h >= 7 ? 2 : 1]] : []).concat(h >= 4 ? [['wabbitSorciere', 1]] : []).concat(h >= 6 ? [['woWabbit', 1]] : []).concat(h >= 8 ? [['gwandWabbit', 1]] : []);
  }
  if (n > 4 * VAGUES_PALIER) { /* le Nid des Dragoeufs */
    const h = n - 4 * VAGUES_PALIER;
    if (h >= VAGUES_PALIER) return [['crocabulia', 1], ['dragDore', 1], ['dragArdoise', 1], ['dragNoir', 2]];
    return [['dragNoir', Math.min(3, 1 + Math.ceil(h * 0.22))], ['dragBlanc', 1 + Math.floor(h / 4)]].concat(h >= 3 ? [['dragArdoise', Math.ceil(h / 6)]] : []).concat(h >= 5 ? [['dragDore', 1]] : []);
  }
  if (n > 3 * VAGUES_PALIER) { /* le Massif des Craqueleurs */
    const h = n - 3 * VAGUES_PALIER;
    if (h >= VAGUES_PALIER) return [['craqLegendaire', 1], ['craqCristal', 1], ['craqLanceur', 1], ['craqueleur', 2]];
    return [['craqueleur', Math.min(3, 1 + Math.ceil(h * 0.25))], ['craqueboule', 1 + Math.floor(h / 4)]].concat(h >= 3 ? [['craqLanceur', Math.ceil(h / 6)]] : []).concat(h >= 5 ? [['craqCristal', 1]] : []);
  }
  if (n > 2 * VAGUES_PALIER) { /* la Horde des Bworks */
    const h = n - 2 * VAGUES_PALIER;
    if (h >= VAGUES_PALIER) return [['bworker', 1], ['bworkMage', 1], ['bworkArcher', 1], ['bwork', 2]];
    return [['bwork', Math.min(4, 2 + Math.ceil(h * 0.2))]].concat(h >= 2 ? [['bworkette', Math.ceil(h / 4)]] : []).concat(h >= 3 ? [['bworkArcher', Math.ceil(h / 5)]] : []).concat(h >= 5 ? [['bworkMage', h >= 8 ? 2 : 1]] : []);
  }
  const k = n - VAGUES_PALIER; /* la Vague de Chafers */
  if (k >= VAGUES_PALIER) return [['cuirasse', 1], ['gardien', 1], ['archer', 1], ['fantassin', 2]];
  return [['fantassin', Math.min(4, 2 + Math.ceil(k * 0.25))]].concat(k >= 3 ? [['gardien', Math.floor(k / 4) || 1]] : []).concat([['archer', Math.ceil(k / 5)]]);
};
/* « reduis de 15 % l'xp gagnee sur toutes les vagues du jeu » (Mathieu, 13/10/2026) : toutes les vagues, boss et vagues rejouees compris (gainsBoss en derive) */
/* « un nerf de -20 % sur les kamas gagnes sur les vagues » (Mathieu, 13/10/2026) : toutes les vagues, boss et revanches compris */
const XP_VAGUES = 0.85, KAMAS_VAGUES = 0.8, gainsVague = (n, rejoue) => { const g = gainsVagueBrut(n, rejoue); return Object.assign({}, g, { xp: Math.round(g.xp * XP_VAGUES), kamas: kamasGagnes(g.kamas * KAMAS_VAGUES) }); };
const gainsVagueBrut = (n, rejoue) => {
  const k = rejoue ? 0.5 : 1, j = n - VAGUES_PALIER, h = n - 2 * VAGUES_PALIER, q = n - 3 * VAGUES_PALIER, r = n - 4 * VAGUES_PALIER, w = n - 5 * VAGUES_PALIER;
  { const k7 = n - 6 * VAGUES_PALIER; if (k7 > 0) return { kamas: Math.round((k7 === VAGUES_PALIER ? 70000 : 3300 + 550 * k7) * k), xp: Math.round((k7 === VAGUES_PALIER ? 800 : 100 + 18 * k7) * k) }; } /* la Montagne des Koalaks */
  if (w > 0) return { kamas: Math.round((w === VAGUES_PALIER ? 50000 : 2600 + 450 * w) * k), xp: Math.round((w === VAGUES_PALIER ? 700 : 85 + 16 * w) * k) }; /* l'ile des Wabbits */
  if (r > 0) return { kamas: Math.round((r === VAGUES_PALIER ? 35000 : 1800 + 350 * r) * k), xp: Math.round((r === VAGUES_PALIER ? 600 : 70 + 14 * r) * k) }; /* le Nid des Dragoeufs */
  if (q > 0) return { kamas: Math.round((q === VAGUES_PALIER ? 20000 : 1200 + 250 * q) * k), xp: Math.round((q === VAGUES_PALIER ? 500 : 60 + 12 * q) * k) }; /* le Massif des Craqueleurs */
  if (h > 0) return { kamas: Math.round((h === VAGUES_PALIER ? 12000 : 800 + 200 * h) * k), xp: Math.round((h === VAGUES_PALIER ? 500 : 50 + 15 * h) * k) }; /* la Horde des Bworks */
  const kamas = n <= VAGUES_PALIER ? (n === VAGUES_PALIER ? 1500 : 60 * n) : (j === VAGUES_PALIER ? 5000 : 300 + 120 * j);
  const xp = n <= VAGUES_PALIER ? (n === VAGUES_PALIER ? 200 : 10 + 10 * n) : (j === VAGUES_PALIER ? 300 : 30 + 10 * j);
  return { kamas: Math.round(kamas * k), xp: Math.round(xp * k) };
};
/* le pluriel d'un nom de monstre : chaque mot jusqu'au premier « de » ou « à » (Craqueleurs Lanceurs, Craqueleurs de Cristal) */
const leNom = (d, min) => d.propre ? d.nom : (min ? 'le ' : 'Le ') + d.nom, ac = (d) => d.fem ? 'e' : ''; /* « Le Bworker est tombé », « Crocabulia est tombée » */
const pluriel = (nom) => { let stop = false; return nom.split(' ').map((w) => { if (stop || /^(de|du|à|d')$/i.test(w)) { stop = true; return w; } return /[sx]$/.test(w) ? w : w + 's'; }).join(' '); };
const classeDe = () => (S_.perso && S_.perso.classe) || 'iop';
