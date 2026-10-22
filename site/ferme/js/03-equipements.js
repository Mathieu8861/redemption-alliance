'use strict';
/* ===================== EQUIPEMENTS =====================
   Six emplacements, une panoplie par palier : Bouftou, Chafer, Bwork, Craqueleur, Dragoeuf. Les monstres des vagues en lachent parfois
   (plus souvent avec de la Prospection), le boss toujours la premiere fois. Chaque piece donne deux caracteristiques ;
   3 pieces d'une meme panoplie : un bonus de Vitalite, les 6 : en plus de la Puissance et de la Prospection. On equipe depuis la fiche du perso. */
const EMPLACEMENTS = [['coiffe', 'Coiffe'], ['cape', 'Cape'], ['amulette', 'Amulette'], ['anneau', 'Anneau'], ['ceinture', 'Ceinture'], ['bottes', 'Bottes']];
/* les pictos des caracteristiques (12/10/2026, « les emojis on ronfle ») : dessins pleins, de la couleur de la caracteristique */
const PICTOS = {
  vita: ['#d9443a', '<path d="M12 20.5s-7.5-4.6-7.5-10.4A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.7c0 5.8-7.5 10.4-7.5 10.4z"/>'],
  puissance: ['#e07c0a', '<path d="M13.5 2 4.5 13.5h6.2L9.5 22l9-11.6h-6.3z"/>'],
  agilite: ['#2f9a8a', '<path d="M20.6 3.4C13.4 3.6 7.6 8 6.2 14.6L3.6 20.4l5.9-2.7c6.6-1.4 10.9-7.2 11.1-14.3z"/><path d="M8.2 15.8 15 9" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>'],
  sagesse: ['#7a4fc9', '<path d="M3.5 5.2c3.2-1.6 6.3-1.5 8.5.6 2.2-2.1 5.3-2.2 8.5-.6v14.3c-3.2-1.5-6.3-1.4-8.5.6-2.2-2-5.3-2.1-8.5-.6z"/><path d="M12 5.8v14.3" stroke="#fff" stroke-width="1.4" opacity=".7"/>'],
  prospection: ['#3f8a22', '<circle cx="8.8" cy="8.8" r="3.7"/><circle cx="15.2" cy="8.8" r="3.7"/><circle cx="8.8" cy="15.2" r="3.7"/><circle cx="15.2" cy="15.2" r="3.7"/><path d="M14.6 15.6 20 21.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'],
  degats: ['#8a5634', '<path d="M20.5 2.5 21.5 3l-.4 1.6L10.3 15.4l-1.7-1.7z"/><path d="M5.6 12.6l5.8 5.8M8 16l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>'],
  cadence: ['#3a7fc1', '<circle cx="12" cy="13.5" r="7.8" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M12 9.5v4.4l2.9 1.9M9.4 2.8h5.2" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>'],
  portee: ['#c0392b', '<circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="1.7"/>'],
  /* (et ceux des ameliorations) */
  bouclier: ['#6b7f99', '<path d="M12 2.3 20.2 5.4v6.1c0 5.1-3.5 8.8-8.2 10.2-4.7-1.4-8.2-5.1-8.2-10.2V5.4z"/>'],
  carreaux: ['#8a5634', '<path d="M5.2 18.8 16.6 7.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M21 3l-1.6 7-5.4-5.4z"/><path d="M3 15.5l2.2 3.3 3.3 2.2-.6-3.6-3.3-1.9z"/>'],
  eau: ['#3a95d1', '<path d="M12 2.6c3.7 4.7 6.6 8.4 6.6 11.8a6.6 6.6 0 0 1-13.2 0c0-3.4 2.9-7.1 6.6-11.8z"/>'],
  auto: ['#7a6f5c', '<path d="M10.6 2h2.8l.5 2.6 2.2.9 2.2-1.5 2 2-1.5 2.2.9 2.2 2.6.5v2.8l-2.6.5-.9 2.2 1.5 2.2-2 2-2.2-1.5-2.2.9-.5 2.6h-2.8l-.5-2.6-2.2-.9-2.2 1.5-2-2 1.5-2.2-.9-2.2L2 13.4v-2.8l2.6-.5.9-2.2L4 5.7l2-2 2.2 1.5 2.2-.9z"/><circle cx="12" cy="12" r="3" fill="#fffaf0"/>'],
  bouftou: ['#9c8a6a', '<circle cx="8" cy="10.5" r="4"/><circle cx="12.8" cy="8.5" r="4.3"/><circle cx="16.8" cy="11.6" r="3.7"/><circle cx="11.5" cy="13.4" r="4.2"/><rect x="7.3" y="15.5" width="2.4" height="5.5" rx="1.2"/><rect x="13.6" y="15.5" width="2.4" height="5.5" rx="1.2"/>'],
  cases: ['#5aa02c', '<rect x="3.5" y="3.5" width="7.6" height="7.6" rx="1.6"/><rect x="12.9" y="3.5" width="7.6" height="7.6" rx="1.6"/><rect x="3.5" y="12.9" width="7.6" height="7.6" rx="1.6"/><rect x="12.9" y="12.9" width="7.6" height="7.6" rx="1.6"/>'],
  laine: ['#c9a46a', '<circle cx="12" cy="12" r="8.6"/><path d="M5.6 8.6c4.2 0 8.1 2.1 11.2 6.2M4.8 13.2c4 0 7.1 2.1 9.2 6.1M9 4c3.1 2 5.1 5.1 6.1 9.4" fill="none" stroke="#fffaf0" stroke-width="1.5" opacity=".8"/>'],
  repas: ['#b5733c', '<path d="M3 11.5h18c0 4.7-4 8.6-9 8.6s-9-3.9-9-8.6z"/><path d="M8 8.5c0-1.6 1.1-2.4 1.1-4.2M12 8.5c0-1.6 1.1-2.4 1.1-4.2M16 8.5c0-1.6 1.1-2.4 1.1-4.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>'],
  etoile: ['#e0a31e', '<path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>'],
  tofu: ['#d9a21e', '<circle cx="11" cy="12.8" r="7"/><path d="M17.4 10.6 22.2 12l-4.8 1.6z"/><circle cx="13.2" cy="10.6" r="1.3" fill="#fffaf0"/><path d="M5.5 13.5c1.8 1.6 4 1.9 6 .8" fill="none" stroke="#fffaf0" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>'],
  kama: ['#e0a31e', '<circle cx="12" cy="12" r="9.2"/><path d="M10 7.2v9.6M10 12l4.6-4.6M10 12l4.6 4.6M7.8 10.6h8.4M7.8 13.4h8.4" fill="none" stroke="#fffaf0" stroke-width="1.6" stroke-linecap="round"/>'],
  pousse: ['#5aa02c', '<path d="M11.2 21.5V13h1.6v8.5z"/><path d="M12 13.3c-.5-4.2-3.6-6.8-8.3-6.8.3 4.6 3.5 7.2 8.3 6.8z"/><path d="M12 11.2c.4-4.2 3.5-7 8.3-7-.2 4.8-3.4 7.4-8.3 7z"/>'],
  vitesse: ['#8a5634', '<path d="M7 2.8h6.2v8.4l5.6 2.3c1.7.7 2.7 2.3 2.7 4.1v2.6H4.2v-3.1l2.8-1.4z"/><path d="M1.5 9.5h3.5M1 13h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'],
  epi: ['#d9a21e', '<path d="M11.3 22V9h1.4v13z"/><ellipse cx="9.5" cy="8.5" rx="1.9" ry="3.1" transform="rotate(-28 9.5 8.5)"/><ellipse cx="14.5" cy="8.5" rx="1.9" ry="3.1" transform="rotate(28 14.5 8.5)"/><ellipse cx="9.3" cy="13.4" rx="1.9" ry="3.1" transform="rotate(-28 9.3 13.4)"/><ellipse cx="14.7" cy="13.4" rx="1.9" ry="3.1" transform="rotate(28 14.7 13.4)"/><ellipse cx="12" cy="4.4" rx="1.7" ry="2.8"/>'],
  cadenas: ['#7a6f5c', '<rect x="4.8" y="10.4" width="14.4" height="10.6" rx="2.6"/><path d="M8 10.4V8a4 4 0 0 1 8 0v2.4" fill="none" stroke="currentColor" stroke-width="2.4"/>'],
  /* (le bestiaire, 15/10/2026 : ce que font les monstres) */
  saut: ['#7b4fc9', '<path d="M3.5 19.5C5.2 11 11.5 6.4 18.6 8.3" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="3.2 2.6"/><path d="M21.6 9.2l-6.3 2.6.9-6.4z"/><circle cx="4.6" cy="19" r="2.6"/>'],
  charge: ['#c0392b', '<path d="M12.6 4.4 21.8 12l-9.2 7.6v-4.4H7.2V8.8h5.4z"/><path d="M1.8 9h3.2M1.2 12h3.2M1.8 15h3.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'],
  pique: ['#5a3fa0', '<path d="M4.2 3.6l12.6 12.6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M21.4 21.4h-9.3l9.3-9.3z"/><path d="M2.6 10.6c3.4-.6 6.2-3 7.4-7.6 1.2 2.6.9 5.2-.6 7.2 1.4.4 2.6 1.4 3.2 2.8-3.5.7-7 .1-10-2.4z"/>'],
  casse: ['#7a6f5c', '<rect x="2.8" y="3.6" width="11.4" height="6.6" rx="1.6" transform="rotate(-38 8.5 6.9)"/><path d="M10.6 10.2 20.6 20.2" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>'],
  soin: ['#3f8a22', '<path d="M12 20.5s-7.5-4.6-7.5-10.4A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.7c0 5.8-7.5 10.4-7.5 10.4z"/><path d="M12 9.6v6.2M8.9 12.7h6.2" fill="none" stroke="#fffaf0" stroke-width="2.2" stroke-linecap="round"/>'],
  protege: ['#2f9ac0', '<path d="M12 2.3 20.2 5.4v6.1c0 5.1-3.5 8.8-8.2 10.2-4.7-1.4-8.2-5.1-8.2-10.2V5.4z"/><path d="M12 7.2l1.5 3.1 3.4.4-2.5 2.3.7 3.4-3.1-1.7-3.1 1.7.7-3.4-2.5-2.3 3.4-.4z" fill="#fffaf0"/>'],
  galvanise: ['#d99a12', '<path d="M13.5 2 4.5 13.5h6.2L9.5 22l9-11.6h-6.3z"/><path d="M19.5 3.5l1 2.1 2.1 1-2.1 1-1 2.1-1-2.1-2.1-1 2.1-1z"/>'],
  revit: ['#8c8478', '<path d="M12 2.6a8.2 8.2 0 0 0-8.2 8.2c0 2.9 1.4 4.5 3 5.5v3.9h10.4v-3.9c1.6-1 3-2.6 3-5.5A8.2 8.2 0 0 0 12 2.6z"/><circle cx="8.9" cy="11.2" r="2.1" fill="#fffaf0"/><circle cx="15.1" cy="11.2" r="2.1" fill="#fffaf0"/><path d="M10.4 17.2v2.4M13.6 17.2v2.4" stroke="#fffaf0" stroke-width="1.3"/>'],
  assomme: ['#d9a21e', '<path d="M12 2.2l1.9 4.6 4.9.4-3.8 3.1 1.2 4.8L12 12.4l-4.2 2.7 1.2-4.8-3.8-3.1 4.9-.4z"/><path d="M3.4 17.6c3.4 3.4 13.8 3.4 17.2 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="4.6" cy="14.8" r="1.4"/><circle cx="19.4" cy="14.8" r="1.4"/>'],
  lenteur: ['#3a7fc1', '<path d="M2.4 19.4h15.2c2.4 0 4-1.6 4-3.6l-1.6.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12.2" cy="12.2" r="6.4"/><path d="M12.2 9.6a2.6 2.6 0 1 1-2.6 2.6" fill="none" stroke="#fffaf0" stroke-width="1.5" stroke-linecap="round"/><path d="M19.4 15.4l1.2-4.6M21.6 16l1.6-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'],
  poison: ['#5f9e2a', '<path d="M12 2.6c3.7 4.7 6.6 8.4 6.6 11.8a6.6 6.6 0 0 1-13.2 0c0-3.4 2.9-7.1 6.6-11.8z"/><circle cx="9.8" cy="13.6" r="1.4" fill="#fffaf0"/><circle cx="14.2" cy="13.6" r="1.4" fill="#fffaf0"/><path d="M10 17.2h4" stroke="#fffaf0" stroke-width="1.3" stroke-linecap="round"/>'],
  vol: ['#6f8fb8', '<path d="M2 14.6c4.4-.8 7.4-4 9.2-9.4 1.2 4 .4 7.2-1.6 9.4 4.4.2 8.6-1.8 12.4-6-1 6.4-6.2 10.4-12.4 10.4H5.2z"/>'],
  couronne: ['#e0a31e', '<path d="M2.8 7.8l4.8 4.2L12 4.6l4.4 7.4 4.8-4.2-2.2 11.2H5z"/><rect x="5" y="19.6" width="14" height="2" rx="1"/>'],
  rage: ['#d9443a', '<path d="M12.4 2c.6 4.2 6.4 6.4 6.4 12.4a6.8 6.8 0 0 1-13.6 0c0-3.2 1.8-4.8 2.2-7.6 1.8 1.2 2.6 2.8 2.8 4.6.8-3.2 2.8-5.6 2.2-9.4z"/>'],
  renfort: ['#5aa02c', '<circle cx="8" cy="7.2" r="3.2"/><circle cx="16.4" cy="7.2" r="3.2"/><path d="M2.2 20.4c0-4.6 2.6-7.2 5.8-7.2s5.8 2.6 5.8 7.2z"/><path d="M10.6 20.4c0-4.6 2.6-7.2 5.8-7.2s5.8 2.6 5.8 7.2z"/>'],
  grignote: ['#d9a21e', '<path d="M11.3 22V9h1.4v13z"/><ellipse cx="9.5" cy="8.5" rx="1.9" ry="3.1" transform="rotate(-28 9.5 8.5)"/><ellipse cx="14.5" cy="8.5" rx="1.9" ry="3.1" transform="rotate(28 14.5 8.5)"/><ellipse cx="9.3" cy="13.4" rx="1.9" ry="3.1" transform="rotate(-28 9.3 13.4)"/><circle cx="17.4" cy="14.8" r="3.4" fill="#fffaf0"/>'],
  sort: ['#9b5cf0', '<path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/><circle cx="19" cy="4.6" r="1.6"/><circle cx="5" cy="19.4" r="1.2"/>'],
  message: ['#6b5a44', '<path d="M4 3.6h16a2.2 2.2 0 0 1 2.2 2.2v9.2a2.2 2.2 0 0 1-2.2 2.2h-7.6l-5.2 4.2v-4.2H4a2.2 2.2 0 0 1-2.2-2.2V5.8A2.2 2.2 0 0 1 4 3.6z"/><path d="M6.6 8.6h10.8M6.6 12.2h7" stroke="#fffaf0" stroke-width="1.6" stroke-linecap="round"/>'],
  livre: ['#8a5634', '<path d="M3 4.6c3.4-.8 6.4-.2 9 1.8v14.4c-2.6-2-5.6-2.6-9-1.8z"/><path d="M21 4.6c-3.4-.8-6.4-.2-9 1.8v14.4c2.6-2 5.6-2.6 9-1.8z" opacity=".75"/>']
};
const picto = (k, couleur) => '<svg class="pc" viewBox="0 0 24 24" style="color:' + (couleur || PICTOS[k][0]) + '" aria-hidden="true">' + PICTOS[k][1] + '</svg>';
const CARACS = { vita: ['Vitalité', ' PV', picto('vita')], puissance: ['Puissance', ' % de dégâts', picto('puissance')], agilite: ['Agilité', ' % de vitesse d\'attaque', picto('agilite')], sagesse: ['Sagesse', ' % d\'expérience', picto('sagesse')], prospection: ['Prospection', ' % de butin', picto('prospection')] };
const PANOS = [{ id: 'bouftou', nom: 'Bouftou', de: 'du Bouftou', niv: 1 }, { id: 'chafer', nom: 'Chafer', de: 'du Chafer', niv: 11 }, { id: 'bwork', nom: 'Bwork', de: 'du Bwork', niv: 21 }, { id: 'craqueleur', nom: 'Craqueleur', de: 'du Craqueleur', niv: 31 }, { id: 'dragoeuf', nom: 'Dragoeuf', de: 'du Dragoeuf', niv: 41 }, { id: 'wabbit', nom: 'Wabbit', de: 'du Wabbit', niv: 51 }, { id: 'boufcoul', nom: 'Boufcoul', de: 'du Boufcoul', niv: 61 }, { id: 'dragoncochon', nom: 'Dragon Cochon', de: 'du Dragon Cochon', niv: 71 }];
const MOTIF = { coiffe: ['vita', 'sagesse'], cape: ['vita', 'agilite'], amulette: ['puissance', 'sagesse'], anneau: ['puissance', 'prospection'], ceinture: ['vita', 'puissance'], bottes: ['agilite', 'prospection'] };
const VALEURS = { vita: [20, 45, 80, 125, 180, 245, 320, 405], puissance: [4, 7, 10, 14, 18, 23, 29, 36], agilite: [3, 5, 7, 9, 12, 15, 19, 23], sagesse: [5, 8, 11, 15, 20, 25, 31, 38], prospection: [8, 12, 16, 20, 25, 31, 38, 46] }; /* (le palier 8, 20/10/2026 : la suite des ecarts) */
const DECALAGE = { coiffe: 2, cape: 4, amulette: 6, anneau: 3, ceinture: 5, bottes: 1 }; /* le niveau requis de chaque piece, dans son palier */
const OBJETS = {};
PANOS.forEach((P, k) => EMPLACEMENTS.forEach(([e, nom]) => { const id = P.id + '-' + e; OBJETS[id] = { id, pano: k, emp: e, nom: nom + ' ' + P.de, niv: P.niv + DECALAGE[e], stats: Object.fromEntries(MOTIF[e].map((c) => [c, VALEURS[c][k]])) }; }));
/* les coiffes legendaires (11/10/2026, « une coiffe de chaque boss hyper rare avec des bonus de fou ») : une par boss, 2 % de chance quand il tombe
   (plus avec la Prospection), deux fois les stats de la coiffe de sa panoplie, de la Puissance en plus, et un pouvoir. Elles ne comptent dans aucune panoplie. */
const CHANCE_LEG = 0.02;
const LEGENDAIRES = [
  { cle: 'royal', boss: 'royal', nom: 'Couronne du Bouftou Royal', pouvoir: 'Tes Bouftous donnent 25 % de laine en plus.' },
  { cle: 'chafer', boss: 'cuirasse', nom: 'Heaume du Chafer Cuirassé', pouvoir: 'Tu prends 10 % de dégâts en moins et tu renvoies 10 % des coups reçus au corps à corps.' },
  { cle: 'bworker', boss: 'bworker', nom: 'Casque du Bworker', pouvoir: 'Sous 30 % de vie, tu entres en rage : tu frappes 30 % plus vite.' },
  { cle: 'craq', boss: 'craqLegendaire', nom: 'Couronne du Craqueleur Légendaire', pouvoir: 'Sort Séisme (touche 3) : la terre s\'ouvre là où tu vises (jusqu\'à 5 cases de toi), sur 1,5 case autour, 2 fois tes dégâts. Recharge 12 s.' },
  { cle: 'wa', boss: 'waWabbit', arme: true, rang: 5, /* (14/10/2026 : « les items legendaires du niveau 60 a 100, des corps a corps », Mathieu ; variantes choisies : epee B, arc A, fouet A) */
    noms: { epee: 'Épée du Wa Wabbit', arc: 'Arc du Wa Wabbit', fouet: 'Fouet du Wa Wabbit' }, icone: 'wawabbit', noeuds: { epee: 'Arme_epee_wawabbitB', arc: 'Arme_arc_wawabbit', fouet: 'Arme_fouet_wawabbit' },
    cales: { epee: { y0: 0.06, L: 1.51 }, arc: { mil: 0.85, L: 1.6 }, fouet: { y0: 0.05, L: 0.57, laniere: 'laniere', retirer: /^(laniere|cawotte|sillon|fane)$/ } }, /* (le modele : pommeau, pointe, corde, laniere) */
    pouvoir: 'Sort Pluie de cawottes (touche 4) : quatre cawottes tombent là où tu vises (jusqu\'à 5 cases de toi, sur environ 1 case autour), 2 fois tes dégâts chacune. Recharge 13 s. Et tes repas de Cawotte et de Fraise valent pour 2 vagues.' },
  { cle: 'koulosse', boss: 'koulosse', arme: true, rang: 6, fichier: 'equipements-boufcoul', /* (le palier 7, 14/10/2026 ; variantes choisies par Mathieu : lame A, arc B, fouet B) */
    noms: { epee: 'Lame du Koulosse', arc: 'Arc du Koulosse', fouet: 'Fouet du Koulosse' }, icone: 'koulosse', noeuds: { epee: 'Arme_epee_koulosse', arc: 'Arme_arc_koulosseB', fouet: 'Arme_fouet_koulosseB' },
    cales: { epee: { y0: 0.02, L: 1.62 }, arc: { mil: 0.85, L: 1.6 }, fouet: { y0: 0.03, L: 0.65, laniere: 'fumee', retirer: /^fumee$/ } },
    pouvoir: 'Sort Fumée (touche 4) : un nuage là où tu vises (jusqu\'à 5 cases de toi, sur 1 case autour), les monstres dedans perdent 3 % de leurs PV par seconde pendant 4 s (1 % pour un boss). Recharge 13 s.' },
  { cle: 'cochon', boss: 'dragonCochon', rang: 7, fichier: 'equipements-cochon', nom: 'Heaume du Dragon Cochon', /* (le palier 8, 20/10/2026 ; son modele est dans equipements-cochon) */
    pouvoir: 'Sort Bain de boue (touche 3) : une flaque de boue là où tu vises (jusqu\'à 5 cases de toi, sur 1,5 case autour), 2 fois tes dégâts, et les monstres dedans restent collés 2 s (1 s pour un boss). Recharge 12 s.' },
  { cle: 'croc', boss: 'crocabulia', rang: 4 /* (le palier du Dragoeuf : sans ce rang, elle prenait celui des Wabbits, niveau 60, corrige le 12/10/2026) */, nom: 'Heaume de Crocabulia', pouvoir: 'Sort Souffle de feu (touche 3) : un cône de feu vers où tu vises, sur 3,5 cases, 3 fois tes dégâts, et les monstres touchés brûlent. Recharge 12 s.' }
];
LEGENDAIRES.forEach((L, i) => { if (L.arme) return; const k = L.rang != null ? L.rang : i, id = 'leg-' + L.cle; OBJETS[id] = { id, pano: k, leg: L.cle, emp: 'coiffe', nom: L.nom, niv: PANOS[k].niv + 9, pouvoir: L.pouvoir, stats: { vita: 2 * VALEURS.vita[k], sagesse: 2 * VALEURS.sagesse[k], puissance: VALEURS.puissance[k] } }; });
/* les armes : l'epee du Iop, l'arc du Cra, le fouet de l'Osamodas, aux couleurs de chaque panoplie (icones arme-<type>-<panoplie>, equipements.glb).
   Elles ne tombent que sur les boss, pour ta classe, et ne comptent dans aucune panoplie */
const ARMES = { iop: ['epee', 'Épée'], cra: ['arc', 'Arc'], osa: ['fouet', 'Fouet'] };
const EMPLACEMENTS_PERSO = EMPLACEMENTS.concat([['arme', 'Arme']]);
/* LES ARMES LEGENDAIRES (Phase 2, niveaux 60 a 100 : « une coiffe et un cac legendaire par la suite », Mathieu) : le boss donne celle de ta classe, avec le pouvoir
   du boss ; plus forte qu'une arme de panoplie (Puissance x3,5 au lieu de x2,5, Agilite x1,5, et de la Vitalite). La premiere : le Wa Wabbit (14/10/2026) */
LEGENDAIRES.filter((L) => L.arme).forEach((L) => { const k = L.rang; Object.entries(ARMES).forEach(([cl, [t]]) => { const id = 'leg-' + L.cle + '-' + t;
  OBJETS[id] = { id, pano: k, leg: L.cle, emp: 'arme', classe: cl, arme: true, type: t, icone: 'arme-' + t + '-' + L.icone, visuel: L.noeuds[t], fichier: L.fichier || 'equipements-wabbit', cale: L.cales[t], nom: L.noms[t], niv: PANOS[k].niv + 9, pouvoir: L.pouvoir,
    stats: { puissance: Math.round(VALEURS.puissance[k] * 3.5), agilite: Math.round(VALEURS.agilite[k] * 1.5), vita: VALEURS.vita[k] } }; }); });
const idLeg = (L, classe) => (L.arme ? 'leg-' + L.cle + '-' + ARMES[classe || classeDe()][0] : 'leg-' + L.cle); /* la piece legendaire d'un boss, pour ta classe */
PANOS.forEach((P, k) => Object.entries(ARMES).forEach(([cl, [t, nom]]) => { const id = 'arme-' + t + '-' + P.id; OBJETS[id] = { id, pano: k, emp: 'arme', classe: cl, arme: true, icone: id, nom: nom + ' ' + P.de, niv: P.niv + 9, stats: { puissance: Math.round(VALEURS.puissance[k] * 2.5), agilite: VALEURS.agilite[k] } }; }));
/* les pieces rares : une piece sur 100 qui tombe (plus avec la Prospection), stats +50 %, liseré doré ; elles comptent dans leur panoplie */
const CHANCE_RARE = 0.01;
Object.values(OBJETS).filter((o) => !o.leg).forEach((o) => { const id = o.id + '-rare'; OBJETS[id] = Object.assign({}, o, { id, base: o.id, rare: true, nom: o.nom + ' ★', stats: Object.fromEntries(Object.entries(o.stats).map(([c, v]) => [c, Math.ceil(v * 1.5)])) }); });
const tirerRare = (id, pros) => (OBJETS[id + '-rare'] && Math.random() < CHANCE_RARE * (pros || 1) ? id + '-rare' : id);
const iconeObjet = (k) => { const o = obj(k); return o ? o.icone || 'obj-' + (o.base || baseObjet(k)) : 'obj-' + baseObjet(k); };
const icoObjet = (k) => { const h = ico(iconeObjet(k)), o = obj(k); return o && o.rare ? h.replace('class="pic img', 'class="pic img rare') : h; };
const nomClasse = (id) => (CLASSES.find((c) => c.id === id) || {}).nom || id;
const legPorte = (cle) => !!(S_ && S_.equip && [S_.equip.coiffe, S_.equip.arme].some((k) => { const o = k && obj(k); return !!o && o.leg === cle; })); /* (la coiffe ou l'arme legendaire) */
const statsObjet = (o) => statsTexte(o.stats) + (o.pouvoir ? '<span class="puce leg">✦ ' + o.pouvoir + '</span>' : '');
/* les bonus de panoplie, renforces et par paliers : 2, 4 puis 6 pieces (avant : 3 et 6), chaque palier s'ajoute au precedent */
const PALIERS_PANO = [[2, (k) => ({ vita: VALEURS.vita[k] })], [4, (k) => ({ puissance: VALEURS.puissance[k], agilite: VALEURS.agilite[k] })], [6, (k) => ({ puissance: VALEURS.puissance[k], prospection: 15, sagesse: 10 })]];
const bonusPano = (k, n) => { const b = {}; PALIERS_PANO.forEach(([m, f]) => { if (n >= m) Object.entries(f(k)).forEach(([c, v]) => { b[c] = (b[c] || 0) + v; }); }); return b; };
const comptePanos = () => { const c = {}; Object.values((S_ && S_.equip) || {}).forEach((id) => { const o = obj(id); if (o && !o.leg && !o.arme) c[o.pano] = (c[o.pano] || 0) + 1; }); return c; };
const texteBonus = (bo) => Object.entries(bo).map(([c, v]) => CARACS[c][2] + ' +' + v + CARACS[c][1]).join(', ');
const blocPano = (k, n) => '<div class="pano-bonus"><b>Panoplie ' + PANOS[k].de + ' : ' + n + '/6 pièces</b><div class="paliers">' + PALIERS_PANO.map(([m, f]) => '<span class="' + (n >= m ? 'actif' : '') + '">' + (n >= m ? '✓ ' : '') + m + ' pièces : ' + texteBonus(f(k)) + '</span>').join('') + '</div></div>';
function caracs() {
  const t = { vita: 0, puissance: 0, agilite: 0, sagesse: 0, prospection: 0 };
  Object.values((S_ && S_.equip) || {}).forEach((id) => { const o = obj(id); if (o) Object.entries(o.stats).forEach(([c, v]) => { t[c] += v; }); });
  Object.entries(comptePanos()).forEach(([k, n]) => Object.entries(bonusPano(+k, n)).forEach(([c, v]) => { t[c] += v; }));
  try { if (combat && combat.boostPros) t.prospection += combat.boostPros; if (combat && combat.agi) t.agilite += combat.agi; const b = bonusA(); if (b) { t.puissance += 10 * (b.puissance || 0); t.agilite += 10 * (b.agilite || 0); t.prospection += 20 * (b.butin || 0); } } catch (e) { /* (avant la declaration de combat) */ } /* la Fraise mangee avant la vague, la Royale bue */
  return t;
}
const reventeObjet = (id) => kamasGagnes(15 * obj(id).niv * (obj(id).rare ? 3 : 1)); /* « la revente devrait moins rapporter » (Mathieu, 12/10/2026) : 40 par niveau, soit les deux tiers d'une vague du meme niveau ; maintenant environ un quart */
/* les jets : chaque piece qui tombe est un exemplaire a part (cle « id~n »), ses stats tirees entre 75 % et 125 % des valeurs de reference
   (une Coiffe du Bwork : de 60 a 100 PV). Les pieces d'avant gardent les valeurs de reference (un jet moyen). */
const JET_MIN = 0.75, JET_MAX = 1.25;
const baseObjet = (k) => String(k || '').split('~')[0];
const fourchette = (v) => [Math.max(1, Math.round(v * JET_MIN)), Math.max(1, Math.round(v * JET_MAX))];
function obj(k) { const o = OBJETS[baseObjet(k)]; if (!o) return null; const j = S_ && S_.jets && S_.jets[k]; return j ? Object.assign({}, o, { id: k, stats: j }) : o; }
function creerObjet(id, plancher) { /* (plancher : le jet part de cette part de la fourchette ; 0,5 pour les pieces des coffres de l'Arene, jamais sous la moyenne) */
  const o = OBJETS[id]; S_.jets = S_.jets || {}; S_.nInst = (S_.nInst || 0) + 1; const k = id + '~' + S_.nInst.toString(36);
  S_.jets[k] = Object.fromEntries(Object.entries(o.stats).map(([c, v]) => { const [a0, b] = fourchette(v), a = Math.round(a0 + (plancher || 0) * (b - a0)); return [c, a + Math.floor(Math.random() * (b - a + 1))]; })); return k;
}
function donnerObjet(id, plancher) { const k = creerObjet(id, plancher); S_.sac[k] = 1; marquerNeuf(k); return k; } /* une piece tombee, tiree, rangee dans le sac et signalee */
/* LES RUNES DE FORGEMAGIE (14/10/2026, Mathieu : « kamas et xp c'est bien, mais les gens veulent d'autres recompenses : des runes magiques qui
   permettent d'augmenter les stats d'un item ; si l'item a un jet a 70 %, il prend +20 %, pour que le mec puisse avoir des items jet max »).
   La rune de forgemagie ajoute 20 % de la fourchette a chaque caracteristique d'une piece (au moins 1), sans depasser le maximum ;
   la rune parfaite met la piece au jet maximum. Elles se gagnent dans l'Arene (blender/runes.py pour les icones). */
const RUNES = { forge: { nom: 'Rune de forgemagie', court: 'Runes de forgemagie', gain: 0.2, bref: '+20 % de jet' }, parfaite: { nom: 'Rune parfaite', court: 'Runes parfaites', gain: 1, bref: 'jet maximum' } };
const runes = () => (S_.runes = S_.runes || { forge: 0, parfaite: 0 });
function caseLibreForge() { /* une case d'herbe libre, la plus proche de la grange, qui ne coupe aucun acces */
  const deja = inaccessibles(), G = blocBati('grange'), d = (c) => (G ? Math.hypot(posCase(c).x - G.x, posCase(c).z - G.z) : 0);
  const L = S_.cases.filter((c) => c.type === 'libre' && !(S_.sauvage && S_.sauvage.id === c.id)).sort((a, b) => d(a) - d(b));
  for (const c of L.slice(0, 80)) { c.type = 'forge'; const bloque = inaccessibles().some((x) => !deja.includes(x)); c.type = 'libre'; if (!bloque) return c; }
  return null;
}
function ouvrirForge() {
  if (!niv('forge')) { ouvrirHdv('ameliorer'); return; }
  const nr = runes(), eq = Object.values(S_.equip).filter(Boolean), cles = [...new Set(eq.concat(Object.keys(S_.sac).filter((k) => S_.sac[k] > 0 && obj(k) && obj(k).emp)))].filter((k) => obj(k) && OBJETS[baseObjet(k)]);
  cles.sort((a, b) => (eq.includes(b) ? 1 : 0) - (eq.includes(a) ? 1 : 0) || obj(b).niv - obj(a).niv || qualiteJet(b) - qualiteJet(a));
  const img = (t) => '<img src="assets/icones/rune-' + t + '.png?v=' + VERSION_MODELES + '" alt="">';
  const ligne = (k) => { const o = obj(k), q = qualiteJet(k), maxi = q >= 0.999;
    return '<div class="art">' + icoObjet(k) + '<div><b>' + (o.leg ? '✦ ' : o.rare ? '★ ' : '') + o.nom + (eq.includes(k) ? ' <span class="puce bonne">portée</span>' : '') + (S_.sac[k] > 1 ? ' <span class="puce">×' + S_.sac[k] + '</span>' : '') + '</b>' +
      '<div class="forge-jet"><span>Jet ' + nomJet(q) + '</span><div class="barre"><i style="width:' + Math.round(q * 100) + '%"></i></div><small>' + Math.round(q * 100) + ' %</small></div></div><div class="act forge-act">' +
      (maxi ? '<span class="cadenas">✓ jet max</span>' : Object.keys(RUNES).map((t) => '<button class="btn mini ' + (nr[t] ? 'kamas' : 'discret') + '" data-forger="' + t + '|' + k + '"' + (nr[t] ? '' : ' disabled') + ' data-info="' + RUNES[t].nom + ' : ' + RUNES[t].bref + '">' + img(t) + RUNES[t].bref + '</button>').join('')) + '</div></div>'; };
  ouvrirModale('forge', entete('L\'atelier de forgemagie') + '<p class="hdv-aide">Une <b>rune de forgemagie</b> ajoute 20 % de jet à la caractéristique de ton choix, jusqu\'à son maximum. Une <b>rune parfaite</b> la met d\'un coup au jet maximum. Les runes se gagnent dans l\'Arène (la montgolfière).</p>' +
    '<div class="forge-stock">' + Object.keys(RUNES).map((t) => '<span class="puce">' + img(t) + '<b>' + (nr[t] || 0) + '</b> ' + ((nr[t] || 0) > 1 ? RUNES[t].court : RUNES[t].nom).toLowerCase() + '</span>').join('') + '</div>' +
    (cles.length ? '<div class="hdv-section">Tes pièces</div>' + cles.map(ligne).join('') : '<p class="hdv-aide">Aucune pièce d\'équipement pour l\'instant : les monstres des vagues en lâchent.</p>'));
}
/* le choix de la caracteristique pour une rune de forgemagie : celles qui peuvent encore monter, avant -> apres */
const gainRune = (R, a, b) => Math.max(1, Math.ceil(R.gain * (b - a) - 1e-9));
function ouvrirChoixForge(k) {
  const B = OBJETS[baseObjet(k)], o = obj(k), R = RUNES.forge; if (!B || !o) return;
  const L = Object.entries(B.stats).map(([c, v]) => { const [a, b] = fourchette(v), cur = o.stats[c] != null ? o.stats[c] : v, apres = Math.min(b, cur + gainRune(R, a, b)), q = (x) => Math.round(100 * (b > a ? (x - a) / (b - a) : 1));
    const C = CARACS[c] || [c, '', ''];
    return '<div class="art"><span class="pic">' + (C[2] || '') + '</span><div><b>' + C[0] + '</b><div class="desc">' + (cur >= b ? 'Déjà au maximum (' + fmt(b) + C[1] + ').' : fmt(cur) + C[1] + ' (' + q(cur) + ' %) → <b>' + fmt(apres) + C[1] + '</b> (' + q(apres) + ' %)') + '</div></div><div class="act">' +
      (cur >= b ? '<span class="cadenas">✓ max</span>' : '<button class="btn kamas" data-forger-carac="' + k + '|' + c + '">Forger</button>') + '</div></div>'; }).join('');
  ouvrirModale('forge-choix', entete('Quelle caractéristique ?') + '<p class="hdv-aide"><b>' + o.nom + '</b> : la rune de forgemagie ajoute 20 % de jet à la caractéristique de ton choix, jusqu\'à son maximum.</p>' + L +
    '<div class="act-bas"><button class="btn discret" data-forge-retour>Retour à l\'atelier</button></div>');
}
function forgerObjet(k, t, carac) {
  if (!niv('forge')) { toast('Il te faut l\'atelier de forgemagie (HDV, onglet Construire, niveau ' + NIV_ARENE + ').'); return null; }
  const R = RUNES[t], n = runes(), base = baseObjet(k), B = OBJETS[base]; if (!R || !B || !obj(k)) return null;
  if (!(n[t] > 0)) { toast('Il te faut une ' + R.nom.toLowerCase() + ' : elles se gagnent dans l\'Arène.'); return null; }
  if (qualiteJet(k) >= 0.999) { toast('Cette pièce est déjà au jet maximum.'); return null; }
  if (R.gain < 1) { const v0 = B.stats[carac]; if (v0 == null) { ouvrirChoixForge(k); return null; } const [a0, b0] = fourchette(v0), cur0 = obj(k).stats[carac]; if (cur0 != null && cur0 >= b0) { toast('Cette caractéristique est déjà au maximum.'); return null; } } /* (sans caracteristique choisie : on la demande) */
  S_.jets = S_.jets || {}; let cle = k; const emp = Object.keys(S_.equip).find((e) => S_.equip[e] === k);
  if (!S_.jets[k] || (S_.sac[k] || 0) > 1) { /* une piece d'avant les jets, ou en plusieurs exemplaires : on en sort un exemplaire a part, a son jet actuel */
    S_.nInst = (S_.nInst || 0) + 1; cle = base + '~' + S_.nInst.toString(36); S_.jets[cle] = Object.assign({}, obj(k).stats);
    if (emp) S_.equip[emp] = cle; else { S_.sac[k]--; if (!S_.sac[k]) delete S_.sac[k]; S_.sac[cle] = 1; }
  }
  const q0 = qualiteJet(cle), J = S_.jets[cle];
  Object.entries(B.stats).forEach(([c, v]) => { const [a, b] = fourchette(v), cur = J[c] != null ? J[c] : v; if (R.gain >= 1) J[c] = b; else if (c === carac) J[c] = Math.min(b, cur + gainRune(R, a, b)); }); /* (la rune de forgemagie : la seule caracteristique choisie, 19/10/2026) */
  n[t]--; compter('runes'); son('niveau'); confettis(25);
  toast('Forgemagie réussie : ' + obj(cle).nom + ', jet ' + Math.round(q0 * 100) + ' % puis ' + Math.round(qualiteJet(cle) * 100) + ' %.', 'or'); rendreHaut(); sauver(); return cle;
}
/* la qualite du jet, de 0 (tout au minimum) a 1 (tout au maximum) */
function qualiteJet(k) {
  const o = obj(k), b = OBJETS[baseObjet(k)]; if (!o || !b) return 0.5;
  const L = Object.entries(b.stats).map(([c, v]) => { const [a, m] = fourchette(v); return m > a ? Math.max(0, Math.min(1, ((o.stats[c] || 0) - a) / (m - a))) : 0.5; });
  return L.length ? L.reduce((x, y) => x + y, 0) / L.length : 0.5;
}
const nomJet = (q) => q >= 0.85 ? 'excellent' : q >= 0.6 ? 'bon' : q >= 0.35 ? 'moyen' : 'faible';
const statsFourchette = (o) => Object.entries(o.stats).map(([c, v]) => { const [a, b] = fourchette(v); return '<span class="puce">' + CARACS[c][2] + ' +' + a + ' à ' + b + CARACS[c][1] + '</span>'; }).join('') + (o.pouvoir ? '<span class="puce leg">✦ ' + o.pouvoir + '</span>' : '');
/* UNE PIECE TIREE (refonte du 16/10/2026) : une piece de la panoplie du palier P, de preference une qu'on n'a pas encore, parfois en version rare
   (pros : la Prospection). Le butin des monstres, le coffre du jour et le coffre de l'Arene. */
function tirerPiece(P, pros) { const ids = EMPLACEMENTS.map(([e]) => P.id + '-' + e), neufs = ids.filter((id) => !possede(id)); return tirerRare(hasard(neufs.length ? neufs : ids), pros); }
const palierCourant = () => palierDe(Math.max(1, Math.min(S_.vague.num, VAGUES_TOTAL)));
const panoDe = (p) => PANOS[Math.max(0, Math.min(p, PANOS.length - 1))]; /* la panoplie d'un palier, ou la derniere qui existe (un palier sans panoplie a venir) */ /* (le palier ou en est le joueur ; apres le dernier boss, le dernier) */
function marquerNeuf(id) { S_.nouveaux = (S_.nouveaux || 0) + 1; S_.neufs = S_.neufs || {}; S_.neufs[id] = (S_.neufs[id] || 0) + 1; } /* la pastille du bouton Perso, et le « Nouveau » de la fiche */
/* une piece du sac face a celle qui est portee au meme endroit : l'ecart carac par carac, et « mieux » si elle ne perd rien et gagne quelque chose */
function comparer(id) {
  const o = obj(id), porte = S_.equip[o.emp], q = porte ? obj(porte) : null, ok = niveau(S_.xp) >= o.niv && (!o.classe || o.classe === classeDe());
  if (!q) return { html: '<span class="puce bonne">emplacement vide</span>', mieux: ok, ok };
  const cles = [...new Set([...Object.keys(o.stats), ...Object.keys(q.stats)])], ecarts = cles.map((k) => [k, (o.stats[k] || 0) - (q.stats[k] || 0)]).filter(([, d]) => d);
  const mieux = ok && ecarts.length > 0 && ecarts.every(([, d]) => d > 0) && (!q.pouvoir || o.pouvoir), pareil = !ecarts.length;
  return { mieux, ok, html: (pareil ? '<span class="puce">comme ta pièce actuelle</span>' : ecarts.map(([k, d]) => '<span class="puce ' + (d > 0 ? 'bonne' : 'mauvaise') + '">' + CARACS[k][2] + ' ' + (d > 0 ? '+' : '') + d + CARACS[k][1] + '</span>').join('')) + (q.pouvoir && !o.pouvoir ? '<span class="puce mauvaise">perd : ' + q.pouvoir + '</span>' : '') };
}
const possede = (id) => Object.keys(S_.sac).some((k) => S_.sac[k] > 0 && baseObjet(k) === id) || Object.values(S_.equip).some((k) => baseObjet(k) === id); /* (le modele, quel que soit le jet) */
const statsTexte = (st) => Object.entries(st).map(([c, v]) => '<span class="puce">' + CARACS[c][2] + ' +' + v + CARACS[c][1] + '</span>').join('');
const CLE = TEST ? 'ferme-amakna-3d-v2-test' : 'ferme-amakna-3d-v2'; /* v2 : le plan a change pour coller a l'ile */

/* La ferme 8 x 5 d'origine : ses cases (i 0 a 7, j 0 a 4) gardent leur place au milieu de l'ile ronde. G grange, V voliere, H HDV, W puits, E epouvantail, B foin,
   e enclos, c champ, . herbe libre (p, l'ancien chemin au pied de l'escalier, est devenu de l'herbe) */
const COLS = 8, ROWS = 5, S = 2;
const PLAN = ['G G V . H H . W', 'G G . . . . . .', 'c c c . . e e e', 'c c c c . e e e', 'E . . . . . . B'].map((l) => l.split(' '));
/* L'ILE RONDE (14/10/2026, plan v3 valide par Mathieu : « ca c'est top yes ») : une seule ile pour les 200 niveaux, toute plate (« le muret il fait chier,
   [...] faudrait un truc plus homogene » : plus de terrasse ni d'escalier). Le depart (92 cases, la ferme 8 x 5 au milieu) est a toi des le niveau 1 ; autour,
   16 terrains en friche s'achetent dans l'ordre, un par palier de niveau : l'anneau 1 (6 terrains de 17 ou 18 cases, niveaux 5 a 50), puis l'anneau 2
   (10 terrains de 25 ou 26 cases, niveaux 60 a 195). L'eau (riviere du fond, etang devant a droite) et la berge sont du decor.
   Le plan vient de blender/ile_plan.py, comme le modele (assets/modeles/jeu/ile-ronde-jeu.glb, blender/ile-ronde-jeu.py) ; recopie ici par blender/plan-vers-jeu.py. */
const ILE_PLAN = { i0: -11, j0: -8, /* une ligne par j, un caractere par i : « . » le depart, a..p les terrains T0..T15 (dans l'ordre d'achat), ~ l'eau, « , » la berge (decor), = un pont, espace hors de l'ile */
  lignes: [
    "          ~~~ppppppp          ",
    "       ~~~oooopppppppnn       ",
    "     ,~~ooooooppppppnnnnn     ",
    "    ,~~oooooooppppppnnnnnn    ",
    "   ,~~ooooffffffffffnnnnnnn   ",
    "  ,~~ooooeeffffffffddnnnnnll  ",
    " ,~~mmmeeeee......dddddnlllll ",
    " ,~mmmmeee..........dddllllll ",
    " ~~mmmeee............dddlllll ",
    ",~mmmmeee............dddllllll",
    "~~mmmmcce............ddbljjjjj",
    "~mmmmmccc............bbbjjjjjj",
    " mmmkkccc............bbbjjjjj ",
    " kkkkkkccc..........bbbjjjjjj ",
    " kkkkkkccccc......bbbbbhhjjjj ",
    "  kkkkkkiccaaaaaaaabbhhh~~~j  ",
    "   kkkkiiiaaaaaaaaaahhh~~~~   ",
    "    kiiiiiiiiggggghhhhh~~~    ",
    "     iiiiiiiggggggghhhhhh     ",
    "       iiiiiggggggghhhh       ",
    "          iigggggggh          ",
  ],
  terrains: [
    {id: 'T0', niv: 5, prix: 500, parcelles: 2, anneau: 1},
    {id: 'T1', niv: 12, prix: 1500, parcelles: 4, anneau: 1},
    {id: 'T2', niv: 20, prix: 3500, parcelles: 4, anneau: 1},
    {id: 'T3', niv: 30, prix: 6000, parcelles: 4, anneau: 1},
    {id: 'T4', niv: 40, prix: 9000, parcelles: 4, anneau: 1},
    {id: 'T5', niv: 50, prix: 14000, parcelles: 4, anneau: 1},
    {id: 'T6', niv: 60, prix: 25000, parcelles: 4, anneau: 2},
    {id: 'T7', niv: 75, prix: 40000, parcelles: 4, anneau: 2},
    {id: 'T8', niv: 90, prix: 60000, parcelles: 4, anneau: 2},
    {id: 'T9', niv: 105, prix: 85000, parcelles: 4, anneau: 2},
    {id: 'T10', niv: 120, prix: 115000, parcelles: 4, anneau: 2},
    {id: 'T11', niv: 135, prix: 150000, parcelles: 4, anneau: 2},
    {id: 'T12', niv: 150, prix: 190000, parcelles: 4, anneau: 2},
    {id: 'T13', niv: 165, prix: 240000, parcelles: 4, anneau: 2},
    {id: 'T14', niv: 180, prix: 300000, parcelles: 4, anneau: 2},
    {id: 'T15', niv: 195, prix: 370000, parcelles: 4, anneau: 2},
  ]
};
const idCase = (i, j) => 'm' + i + '_' + j;
const ILE = (() => { /* le code de chaque case de l'ile, les cases du depart, celles de chaque terrain */
  const code = new Map(), depart = [], parT = ILE_PLAN.terrains.map(() => []);
  ILE_PLAN.lignes.forEach((l, dj) => [...l].forEach((ch, di) => {
    const i = ILE_PLAN.i0 + di, j = ILE_PLAN.j0 + dj; if (ch === ' ') return; code.set(i + '_' + j, ch);
    if (ch === '.') depart.push([i, j]); else { const k = 'abcdefghijklmnop'.indexOf(ch); if (k >= 0) parT[k].push([i, j]); }
  }));
  return { code, depart, parT };
})();
const codeIle = (i, j) => ILE.code.get(i + '_' + j) || null; /* null : le vide autour de l'ile */
const terrainDe = (i, j) => 'abcdefghijklmnop'.indexOf(codeIle(i, j) || '?'); /* -1 : pas un terrain (depart, eau, berge, vide) */
const TERRAINS = ILE_PLAN.terrains.map((t, k) => { const cs = ILE.parT[k], X = (i) => (i - (COLS - 1) / 2) * S, Z = (j) => (j - (ROWS - 1) / 2) * S;
  return Object.assign({}, t, { cases: cs, x: cs.reduce((a, [i]) => a + X(i), 0) / cs.length, z: cs.reduce((a, [, j]) => a + Z(j), 0) / cs.length }); });
const prochainTerrain = () => TERRAINS.find((t) => !S_.terrains[t.id]) || null; /* on les achete dans l'ordre */
const aVendre = (t) => prochainTerrain() === t;
const nivTerrainOk = (t) => niveau(S_.xp) >= t.niv;
const MONTGOLFIERE_CASE = [-2, 0]; /* la case ou la montgolfiere du Casino est amarree, au bord gauche du depart (la ou elle etait deja) */
/* les 8 terrains d'avant l'ile ronde : seulement pour convertir les anciennes sauvegardes (migrerIleRonde) */
const ANCIENS_TERRAINS = { t0: { cols: 4, rows: 4, ox: -14, oz: 3 }, t1: { cols: 5, rows: 3, ox: -1, oz: 10 }, t2: { cols: 4, rows: 4, ox: 14, oz: -5 }, t3: { cols: 5, rows: 3, ox: -11, oz: 10 },
  t4: { cols: 4, rows: 4, ox: 14, oz: 3 }, t5: { cols: 6, rows: 3, ox: 0, oz: -10 }, t6: { cols: 4, rows: 3, ox: -10, oz: -10 }, t7: { cols: 4, rows: 3, ox: -20, oz: 10 } };

