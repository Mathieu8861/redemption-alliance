'use strict';
/* ===================== DONNEES DU JEU ===================== */
/* LES CULTURES A VENDRE (16/10/2026, refaites comme la courbe d'XP ; « plus tu montes plus tu fais des gains, mais plus c'est long a pousser, mais les
   gains par minute sont quand meme de mieux en mieux », Mathieu). Trois regles, de la 1re (Ble) a la 12e (Frostiz) :
   - le temps de pousse, arrose et sans engrais : 1,5 x k^1,763 minutes, de 1 min 30 (Ble) a 2 h (Frostiz) ;
   - le gain par minute a la revente (recolte vendue moins la graine) : de 5 a 10 kamas, +6,5 % a chaque culture ;
   - la graine coute 25 % (Ble) a 50 % (Frostiz) de ce que rapporte la recolte : plus on monte, plus on investit.
   La Cawotte et la Fraise ne suivent pas ces regles : elles se mangent avant un combat, elles ne se vendent pas a profit.
   L'XP DES CULTURES : fixe, la meme a tous les niveaux. Chaque culture rapporte a peu pres 14 XP par heure et par champ (le Ble 0,36 par recolte de
   1 min 30, le Millet 26,61 par recolte de 1 h 43) ; le Frostiz davantage, pour la phase 2 ou les niveaux coutent bien plus cher. La fraction
   d'XP d'une recolte se tire au sort (0,36 : 1 XP un peu plus d'une fois sur trois). Plus aucun malus selon le niveau. */
const CULTURES = [
  { id: 'ble', nom: 'Blé', niv: 1, graine: 2, temps: 1.5, rendement: 3, prix: 3, xp: 0.36, couleur: '#f3c03c', tige: '#d6a63c' },
  { id: 'orge', nom: 'Orge', niv: 5, graine: 9, temps: 5, rendement: 3, prix: 13, xp: 1.18, couleur: '#e8d48c', tige: '#cdb46a' },
  { id: 'cawotte', nom: 'Cawotte', niv: 9, graine: 600, temps: 12, rendement: 4, prix: 40, xp: 2.7, couleur: '#f08a24', tige: '#4fae3a', glb: 'cultures3', mange: { deg: 0.2, txt: '+20 % de dégâts' } },
  { id: 'avoine', nom: 'Avoine', niv: 10, graine: 23, temps: 10, rendement: 4, prix: 22, xp: 2.33, couleur: '#f6e4a0', tige: '#d9c070' },
  { id: 'fraise', nom: 'Fraise', niv: 12, graine: 900, temps: 24, rendement: 5, prix: 55, xp: 5.6, couleur: '#e8323a', tige: '#3f9a35', glb: 'cultures3', mange: { pros: 30, txt: '+30 % de prospection' } },
  { id: 'houblon', nom: 'Houblon', niv: 15, graine: 49, temps: 17, rendement: 4, prix: 42, xp: 3.97, couleur: '#6fae3b', tige: '#8b6a42' },
  { id: 'lin', nom: 'Lin', niv: 20, graine: 88, temps: 26, rendement: 5, prix: 57, xp: 6.07, couleur: '#8cb8ff', tige: '#7fa84a' },
  { id: 'seigle', nom: 'Seigle', niv: 25, graine: 135, temps: 35, rendement: 5, prix: 83, xp: 8.31, couleur: '#c9a35a', tige: '#a88a4a' },
  /* les cultures de haut niveau (blender/cultures2.py) ; le Quisnoa du meme fichier au niveau 70, le Sorgho de Moon au niveau 80 (blender/cultures4.py) */
  { id: 'riz', nom: 'Riz', niv: 30, graine: 210, temps: 46, rendement: 6, prix: 101, xp: 11.04, couleur: '#f3e2a6', tige: '#5cb848', glb: 'cultures2' },
  { id: 'malt', nom: 'Malt', niv: 35, graine: 315, temps: 59, rendement: 6, prix: 143, xp: 14.55, couleur: '#a8683a', tige: '#c98a4a', glb: 'cultures2' },
  { id: 'chanvre', nom: 'Chanvre', niv: 40, graine: 454, temps: 72, rendement: 6, prix: 194, xp: 18, couleur: '#8f8a4a', tige: '#3f8f3a', glb: 'cultures2' },
  { id: 'mais', nom: 'Maïs', niv: 45, graine: 640, temps: 87, rendement: 7, prix: 223, xp: 22.11, couleur: '#f6c83a', tige: '#7fb048', glb: 'cultures2' },
  { id: 'millet', nom: 'Millet', niv: 50, graine: 881, temps: 103, rendement: 7, prix: 293, xp: 26.61, couleur: '#e8964a', tige: '#d0b06a', glb: 'cultures2' },
  { id: 'frostiz', nom: 'Frostiz', niv: 60, graine: 1200, temps: 120, rendement: 8, prix: 333, xp: 74.67, couleur: '#bfefff', tige: '#b6e4f0', glb: 'cultures2' },
  /* (02/11/2026, « il faut peut-etre une nouvelle cereale aussi, a partir du niveau 80 ? », puis « l'ile de Moon, c'est une jungle et des plages » et « Sorgho vas-y »,
     Mathieu) : le Quisnoa, modelise depuis le 12/10 et jamais plante, au niveau 70 ; le Sorgho de Moon au niveau 80. Dans la suite du Frostiz : un peu plus de kamas
     a la minute (11,4 et 12,3 contre 10). L'XP (03/11/2026, « validons ca », Mathieu) : une recolte vaut une part fixe du niveau ou la cereale se debloque, 5 % de
     moins a chaque tranche de 10 niveaux : le Frostiz 6,3 % du niveau 61 (inchange), le Quisnoa 6,0 % du 71, le Sorgho 5,7 % du 81 (la suite : 5,4 % du 91).
     (04/11/2026) Ces parts ne comptaient ni la Sagesse ni la baisse de 10 % : avec les 87 de Sagesse d'un perso niveau 80 equipe, une parcelle de Sorgho donnait
     9,6 % du niveau, un champ de 20 pres de 2 niveaux par recolte. Le Quisnoa, le Sorgho et le Bananagrume sont divises par 1,7 (211, 818 et 760 avant) */
  { id: 'quisnoa', nom: 'Quisnoa', niv: 70, graine: 1650, temps: 140, rendement: 8, prix: 450, xp: 124, couleur: '#c8323e', tige: '#8a9a4a', glb: 'cultures2' },
  /* (03/11/2026) le Bananagrume : un bananier de la jungle de Moon, planté sur une case de champ ; il pousse une fois (3 h 40), puis reste et redonne un régime
     toutes les 2 h (arbre : la part de la pousse où il repart apres la recolte). Il se mange avant un combat : les sorts se rechargent 20 % plus vite.
     (04/11/2026, « je voulais que ce soit un truc un peu rare », Mathieu : 3 bananiers lui donnaient 21 fruits, de quoi manger avant chaque vague) : 2 bananiers
     au plus par ferme (max), un régime de 2 que la Faux n'augmente pas ; il se plante aussi dans l'herbe (une parcelle labourée pour lui), et son XP divisée par 2
     (« un peu too much, divise par 2 », 224 au lieu de 447) */
  { id: 'bananagrume', nom: 'Bananagrume', niv: 80, graine: 2400, temps: 110, /* (110 min, « reduis le temps pour faire pop les Bananagrumes, divise par deux », Mathieu, 09/11/2026 ; 220 avant : le premier regime en 1 h 50, puis un nouveau toutes les 51 min) */ rendement: 2, max: 2, prix: 560, xp: 224, couleur: '#f2bc3a', tige: '#4a8240', glb: 'cultures4', arbre: 0.46, mange: { recharge: 0.2, txt: 'tes sorts se rechargent 20 % plus vite' } },
  { id: 'sorgho', nom: 'Sorgho de Moon', niv: 80, graine: 2250, temps: 160, rendement: 9, prix: 520, xp: 481, couleur: '#a8402a', tige: '#b89a5a', glb: 'cultures4' },
  /* LA PLANTE DE NUIT du palier 10 (11/11/2026, « la nouvelle plante est une plante qui pousse de nuit, et -50 % de jour », Mathieu) : nuit: true, elle pousse a plein
     la nuit et deux fois moins vite le jour (14i-nuit.js) ; elle n'existe que pour une ferme arrivee au palier 10 (debloquee, 04-etat.js). PREMIER JET : son nom, ses
     chiffres (dans la suite du Sorgho : 5,4 % du niveau 91 en XP) et son modele (copie : celui du Sorgho, reteinte en bleu nuit en attendant le sien) sont a valider */
  { id: 'noctiflore', nom: 'Noctiflore', niv: 90, nuit: true, graine: 2900, temps: 150, rendement: 9, prix: 680, xp: 1296, /* (1 296 au lieu de 1 620, 12/11/2026 au soir : « reduis de 20 % l'XP des Noctiflores », Mathieu ; du niveau 90 au 100, 30 recoltes de 42 parcelles et 75 h de pousse au lieu de 24 et 60 h) */ /* (1 620 et non 2 100 : « il faudrait que ce soit 30 % plus long », Mathieu, 11/11/2026 ; du niveau 90 au 100, 24 recoltes de 42 parcelles, 60 h de pousse, contre 17 recoltes et 46 h pour le Sorgho du 80 au 90) */ /* (la meme part de son niveau que le Sorgho, moins 5 % : 2,7 % du niveau 91 par parcelle ; les niveaux 91 et plus demandent 4,6 fois plus d'XP que le 81) */ couleur: '#dcefff', tige: '#4f8f52', glb: 'cultures5' } /* (son modele : le lys de lune, « go sur la 1 », Mathieu, 11/11/2026 ; blender/cultures5.py. Avant : le Sorgho reteinte en bleu nuit) */
];
/* « reduis de 10 % la rentabilite de toutes les recoltes » (Mathieu, 14/10/2026) : le prix de vente des cultures baisse de 10 %.
   Les graines, la laine, les plumes et les ressources des monstres ne bougent pas. */
const RENTA_RECOLTES = 0.9;
CULTURES.forEach((c) => { c.prix = +(c.prix * RENTA_RECOLTES).toFixed(2); });
/* les niveaux d'avant le 12/10/2026 : une culture deja debloquee le reste (on ne retire rien aux joueurs) */
const ANCIEN_NIV = { ble: 1, orge: 3, avoine: 5, houblon: 8, cawotte: 9, lin: 11, fraise: 12, seigle: 14 };
/* la monnaie : une piece de kama dessinee (notre propre motif, pas le logo officiel) a la place du K, qui veut dire mille dans Dofus */
const KAMA = '<img class="kama" src="assets/icones/kama.png" alt="kamas">';
const LAINE = { id: 'laine', nom: 'Laine de Bouftou', prix: 80, xp: 4 }; /* (80 depuis le 12/10/2026, a la demande de Mathieu) */
const LAINE_NOIRE = { id: 'laine_noire', nom: 'Laine de Bouftou noir', prix: 300, xp: 25 }; /* le Bouftou noir, tres rare, donne celle-ci */
const PLUME = { id: 'plume', nom: 'Plume de Tofu', prix: 30, xp: 3 };
const PLUME_DOREE = { id: 'plume_doree', nom: 'Plume dorée', prix: 300, xp: 25 }; /* le Tofu dore (1 Tofu sauvage sur 100, des le niveau 1) donne celle-ci, 07/11/2026 */
const NIV_TOFU_DORE = 1, CHANCE_TOFU_DORE = 0.01, DORE_TOUTES = [80, 100]; /* (07/11/2026 au soir, « une apparition toutes les 1 h 30 connecte en jeu, deco ou en pause ne compte pas », Mathieu : entre 1 h 20 et 1 h 40 de vrai jeu, en vraies minutes ; CHANCE_TOFU_DORE ne sert plus) */ /* (des le niveau 1 depuis le 07/11/2026 au soir, « tofu dore tu peux mettre a partir du niveau 1 en vrai », Mathieu ; avant : niveau 50) */
/* ce que lachent les monstres des vagues (a la grange, ca se vend a l'HDV) */
const RES_MONSTRES = [{ id: 'os_chafer', nom: 'Os de Chafer', prix: 30, xp: 0 }, { id: 'dent_bwork', nom: 'Dent de Bwork', prix: 55, xp: 0 }, { id: 'eclat_craq', nom: 'Éclat de Craqueleur', prix: 85, xp: 0 }, { id: 'ecaille_drag', nom: 'Écaille de Dragoeuf', prix: 130, xp: 0 }, { id: 'poil_wabbit', nom: 'Poil de Wabbit', prix: 180, xp: 0 }, { id: 'kaliptus', nom: 'Branche de Kaliptus', prix: 240, xp: 0 }, { id: 'couenne', nom: 'Couenne de Cochon', prix: 300, xp: 0 },
  { id: 'plume_kanniboul', nom: 'Plume de Kanniboul', prix: 360, xp: 0 }, { id: 'ecaille_tortue', nom: 'Écaille de Tortue', prix: 380, xp: 0 },
  { id: 'ecorce_abraknyde', nom: 'Écorce d\'Abraknyde', prix: 420, xp: 0 }, { id: 'soie_arakne', nom: 'Soie d\'Arakne', prix: 440, xp: 0 }]; /* (la Foret des Abraknydes, 08/11/2026 : l'Ecorce sur les arbres, la Soie sur les araignees) */ /* (l'ile de Moon, 04/11/2026 : la Plume sur les Kannibouls et Moon, l'Ecaille sur les Tortues) */
const PAR_ID = Object.fromEntries(CULTURES.concat([LAINE, LAINE_NOIRE, PLUME, PLUME_DOREE], RES_MONSTRES).map((c) => [c.id, c]));
const VENDABLES = CULTURES.concat([LAINE, LAINE_NOIRE, PLUME, PLUME_DOREE], RES_MONSTRES);
/* l'elevage (revu le 12/10/2026) : deux adultes repus font un petit contre 10 Houblon (15 depuis le 14/10/2026), puis 8 h de repos chacun. Le bebe nait affame,
   mange trois fois plus qu'un adulte (6 Ble, repu deux fois moins longtemps) et ne grandit que repu : 4 h repu pour devenir adulte (lui seul
   fait de la laine). Il nait noir 1 fois sur 10 (laine noire, tres chere), 1 sur 4 avec un parent noir, 1 sur 2 avec deux. */
const NOMS_NOIRS = ['Ébène', 'Réglisse', 'Charbon', 'Minuit', 'Corbeau', 'Encre'];
const ageBebe = (b) => b.grandi != null ? b.grandi : Date.now() - b.ne; /* le temps passe repu (les bebes d'avant le 12/10 grandissaient a l'horloge) */
const dureeCroissance = (b) => (b && b.noir ? DUREE_CROISSANCE_NOIR : DUREE_CROISSANCE);
const adulte = (b) => !b.ne || ageBebe(b) >= dureeCroissance(b);
const croissance = (b) => b.ne ? Math.min(1, ageBebe(b) / dureeCroissance(b)) : 1;
const repasDe = (b) => adulte(b) ? REPAS : REPAS_BEBE, dureeRepasDe = (b) => dureeRepas() / (adulte(b) ? 1 : 2);
const peutReproduire = (b) => adulte(b) && !b.gestation && Date.now() < b.rassasie && Date.now() >= (b.repro || 0);
const enGestation = () => S_.bouftous.filter((b) => b.gestation).length; /* (les petits a naitre : leur place compte deja dans l'enclos) */
function naissance(m) { /* la gestation finie : le petit nait, affame */
  const g = m.gestation, t = g.fin, noir = g.noir; m.gestation = null;
  const pris = S_.bouftous.map((b) => b.nom), libres = (noir ? NOMS_NOIRS : NOMS).filter((n) => !pris.includes(n));
  const bebe = { nom: hasard(libres.length ? libres : (noir ? NOMS_NOIRS : NOMS)) + (libres.length ? '' : ' ' + (S_.bouftous.length + 1)), rassasie: t, laine: 0, accu: 0, ne: t, grandi: 0, noir };
  S_.bouftous.push(bebe); compter('naissances'); son('bebe'); gagnerXp(noir ? 40 : 8);
  toast((noir ? 'Incroyable : ' + m.nom + ' a mis au monde ' + bebe.nom + ', un Bouftou NOIR ! Sa laine noire vaut une fortune.' : m.nom + ' a mis au monde ' + bebe.nom + ' !') + ' Il a faim : nourris-le (' + REPAS_BEBE + ' Blé), il ne grandit que repu.', 'or');
  return bebe;
}
const NOMS = ['Bêêrnard', 'Pompon', 'Flocon', 'Câlinou', 'Bouclette', 'Toison d\'Or', 'Biquette', 'Gros Bouffi', 'Laineur', 'Cotonnade', 'Pépito Junior', 'Rambouftou', 'Moumoute', 'Frisette'];
const BOTTES = 0.2; /* les Bottes de cuir de Bouftou (des le niveau 2) : +20 % de vitesse, au lieu de +30 % (« nerf de 10 % », Mathieu, 13/11/2026) */
/* leur prix (13/11/2026, Mathieu : « +1000 par niveau, a partir du niveau 10 ; jusqu'au niveau 10 c'est 2000, ensuite 3, 4, etc. ») : 2 000 kamas jusqu'au
   niveau 10, puis 1 000 de plus a chaque niveau tant qu'elles ne sont pas achetees (3 000 au 11, 12 000 au 20, 42 000 au 50). Avant : 300 kamas */
const BOTTES_PRIX = 2000, BOTTES_HAUSSE = 1000, BOTTES_PALIER = 10;
const prixBottes = () => { let nv = 1; try { if (S_) nv = niveau(S_.xp); } catch (e) {} return BOTTES_PRIX + BOTTES_HAUSSE * Math.max(0, nv - BOTTES_PALIER); }; /* (S_ est declare plus loin, 04-etat.js) */
const AMELIOS = [
  /* les batiments, du niveau 1 au niveau 5 (decision de Mathieu du 11/10/2026) : chaque niveau monte toutes les stats et change l'apparence.
     couts[k] : le prix pour passer au niveau k + 2 (l'arbalete, elle, s'achete d'abord : couts[0] = la construire) ; nivs[k] : le niveau de Paysan demande */
  { id: 'qg', nom: 'La grange (le QG)', desc: 'Niveau 2 : cheminée et hangar à foin, 900 PV, les voleurs de VSA emportent deux fois moins. Niveau 3 : la grange monte sur un soubassement de pierre, 1 500 PV. Niveau 4 : la tourelle de guet, 2 400 PV. Niveau 5 : le QG de Redemption, 3 600 PV. Niveau 6 : le château de Redemption, ta grange et tes 4 tours fusionnent sur 4 cases sur 4 : 12 000 PV et des tours niveau 6.', couts: [1000, 3000, 7000, 12000, 500000], nivs: [3, 4, 5, 7, 80] },
  { id: 'arbalete', nom: 'L\'arbalète de la grange', desc: 'Elle tire seule sur les voleurs de VSA et les monstres, d\'abord ceux qui attaquent tes bâtiments. Niveau 1 : 30 dégâts (deux fois une tour), 3 carreaux, un tir toutes les 1,1 s, 3,5 cases de portée. Chaque niveau monte tout d\'un coup, jusqu\'à la baliste du niveau 5 : 120 dégâts, 15 carreaux, un tir toutes les 0,65 s, 12 cases. Niveau 6, la baliste d\'acier : 150 dégâts, 18 carreaux, un tir toutes les 0,6 s, 13 cases, et elle tire les carreaux d\'acier de l\'atelier quand tu les charges.', couts: [900, 1500, 4000, 9000, 15000, 700000], nivs: [4, 4, 5, 6, 7, 95] }, /* (le niveau 6, 09/11/2026 : « 700 000 pour la baliste », Mathieu) */
  { id: 'nivPuits', nom: 'Le puits', desc: 'Niveau 2 : la poulie (il remplit dès que ton perso passe à deux cases) et un arrosoir de 15 doses. Niveau 3 : la citerne d\'arrosage, 12 arrosages tout seuls, arrosoir de 20. Niveau 4 : dallage et abreuvoir, citerne de 20, arrosoir de 30. Niveau 5 : le château d\'eau, citerne de 32, arrosoir de 45.', couts: [700, 2000, 6000, 12000], nivs: [1, 3, 4, 6] },
  { id: 'enclos', nom: 'L\'enclos des Bouftous', desc: 'Niveau 2 : portique et abreuvoir (repus 50 % plus longtemps), 8 cases, 3 Bouftous. Niveau 3 : clôture peinte et mangeoire (ils se servent seuls dans la grange), 10 cases, 4 Bouftous, 5 laines avant la tonte. Niveau 4 : la bergerie et les cisailles, 12 cases, 5 Bouftous, 7 laines. Niveau 5 : le ranch, 14 cases, 6 Bouftous, 9 laines. Il faut 2 cases par Bouftou.', couts: [400, 1200, 3000, 5000], nivs: [2, 4, 5, 6] },
  { id: 'voliere', nom: 'La volière à Tofus', desc: 'Deux places de plus à chaque niveau : 4, 6, 8 puis 10 Tofus. Elle grandit avec : grande volière à lattes, chalet de bois, piliers de pierre, puis la halle de Redemption. Dès le niveau 2 elle prend une case de plus, à côté.', couts: [500, 1500, 3500, 7000], nivs: [3, 4, 5, 6] },
  { id: 'nivEtal', nom: 'L\'étal de l\'HDV', desc: 'Niveau 2 : la charrette, tu vends 10 % plus cher. Niveau 3 : graines et balance, les graines coûtent 15 % moins cher. Niveau 4 : le comptoir couvert, ventes +15 %. Niveau 5 : le comptoir de Redemption, ventes +20 % et graines 20 % moins chères.', couts: [900, 1800, 3500, 6000], nivs: [4, 5, 6, 7] },
  { id: 'engrais', nom: 'Engrais d\'Amakna', desc: 'Tes cultures poussent 15 % plus vite, à chaque niveau.', couts: [300, 900, 2500, 6000], niv: 3 },
  { id: 'epouvantail', nom: 'Épouvantail', desc: 'Niveau 1 : deux fois moins de Tofus. Niveau 2 : trois fois moins. Niveau 3 : une arbalète, il tire seul sur les Tofus qui picorent tes parcelles, peu après leur arrivée (8 cases autour de lui, 1 flèche par tir). Niveau 4 : il tire trois fois plus vite, partout sur ta ferme, et aussi sur le Tofu sauvage dans l\'herbe. Niveau 5 : le PÉPITO-TRON, un laser plus fort et plus rapide (les monstres des vagues, c\'est à toi) ; le laser est gratuit, et chaque Tofu abattu laisse sa Plume de Tofu. Niveau 6 : il tire aussi sur les voleurs de VSA, ceux des raids compris (90 dégâts par tir). Les Wabbits, eux, n\'en ont pas peur.', couts: [500, 1500, 4000, 9000, 20000, 200000], niv: 6 },
  { id: 'bottes', nom: 'Bottes de cuir de Bouftou', desc: 'Le paysan marche ' + Math.round(BOTTES * 100) + ' % plus vite : moins de temps perdu en allers-retours. Elles coûtent ' + BOTTES_PRIX.toLocaleString('fr-FR') + ' kamas jusqu\'au niveau ' + BOTTES_PALIER + ', puis ' + BOTTES_HAUSSE.toLocaleString('fr-FR') + ' de plus à chaque niveau : ne tarde pas.', get couts() { return [prixBottes()]; }, niv: 2 },
  { id: 'cloche', nom: 'Cloche d\'alarme', desc: 'Un Tofu ou un Wabbit met deux fois plus longtemps à voler une récolte : le temps de venir le chasser.', couts: [400], niv: 3 },
  { id: 'leurre', nom: 'Leurre à Wabbits', desc: 'Une fausse Cawotte posée dans l\'herbe, qui attire les Wabbits loin de tes Cawottes et de tes Fraises (pas ceux des vagues). Niveau 1 : en bois peint, un Wabbit sur deux y va, ronge du bois sans rien voler et repart au bout de 1 min 30. Niveau 2 : au caramel, trois sur quatre, et il y reste collé jusqu\'à ce que tu viennes le chasser. Niveau 3 : le panier à ressort, tous y vont et le panier leur tombe dessus : viens les relâcher.', couts: [10000, 20000, 40000], niv: 1, apresVague: 50 }, /* (js/14b-leurre.js) */
  { id: 'semences', nom: 'Semences sélectionnées', desc: 'Une chance sur quatre de récupérer la graine à la récolte.', couts: [1200], niv: 6 },
  { id: 'geliere', nom: 'La Gelière', desc: 'L\'élevage des Gelées, sur 6 cases d\'herbe (3 sur 2) avec de l\'eau : elles mangent tes fruits et font tes pots de gelée. Niveau 1 : 2 Gelées. Niveau 2 : 4. Niveau 3 : 6. Niveau 4 : la confiserie de Redemption, 8 Gelées.', couts: [4500, 9000, 15000, 25000], nivs: [25, 32, 40, 50] }, /* (couts[0] : la construire, comme l'arbalete ; baisses le 13/10/2026, « un poil trop chere, surtout vers la fin », Mathieu : avant 5 000, 12 000, 25 000, 45 000) */
  { id: 'forge', nom: 'L\'atelier de forgemagie', desc: 'Pour forger tes pièces avec les runes gagnées dans l\'Arène : une rune de forgemagie ajoute 20 % de jet à la caractéristique de ton choix, une rune parfaite met toute la pièce au jet maximum. Il prend une case d\'herbe libre, près de la grange.', couts: [100000], niv: 50 },
  { id: 'atelier', nom: 'L\'atelier', desc: 'L\'établi sous l\'appentis : tu y fabriques avec les ressources de ta grange, d\'abord les carreaux d\'acier de la baliste (5 Plumes de Tofu, 6 Laines de Bouftou ou 3 Laines de Bouftou noir, 1 Soie d\'Arakne et 1 Écorce d\'Abraknyde donnent 20 carreaux), et le bouclier de carapace qui protège ta grange pendant une vague. Il prend une case d\'herbe libre, près de la grange.', couts: [300000], niv: 90 }, /* (300 000 : « l'atelier, faut le mettre a 300k », Mathieu, 11/11/2026 ; 400 000 le 10/11, 150 000 avant) */ /* (09/11/2026, « oui, nouveau batiment pour l'atelier », puis « A j'aime bien », Mathieu ; prix et niveau a valider) */
  { id: 'faux', nom: 'Faux affûtée', desc: 'Une récolte de plus sur chaque parcelle (3 Blé deviennent 4).', couts: [5000], niv: 9 },
];
/* ce que donne chaque niveau d'un batiment (index = niveau - 1 ; l'arbalete : index = niveau, 0 = pas construite) */
const PALIERS_BAT = {
  qg: ['La grange à colombages, 500 PV.', 'Cheminée et hangar à foin, 900 PV, et les voleurs de VSA emportent deux fois moins.', 'Toute la grange monte sur un soubassement de pierre : 1 500 PV.', 'La tourelle de guet : 2 400 PV.', 'Le QG de Redemption : 3 600 PV.', 'Le château de Redemption : ta grange et tes 4 tours ne font plus qu\'un, sur 4 cases sur 4 ; 12 000 PV, et ses 4 tours tirent comme des tours niveau 6.'],
  arbalete: ['Pas encore construite.', 'De bois : 30 dégâts, 3 carreaux, un tir toutes les 1,1 s, 3,5 cases de portée.', 'Cerclée de fer : 48 dégâts, 6 carreaux, un tir toutes les 1 s, 4 cases.', 'Double, avec lunette : 72 dégâts, 9 carreaux, un tir toutes les 0,9 s, 4,8 cases, et elle se recharge toute seule avec ta réserve de flèches.', 'À répétition : 96 dégâts, 12 carreaux, un tir toutes les 0,8 s, 5,3 cases.', 'La baliste de Redemption : 120 dégâts, 15 carreaux, un tir toutes les 0,65 s, 6 cases.', 'La baliste d\'acier, la tourelle blindée : 150 dégâts, 18 carreaux, un tir toutes les 0,6 s, 6,5 cases, et les carreaux d\'acier de l\'atelier.'],
  nivPuits: ['Un arrosoir de 10 doses.', 'La poulie : il remplit l\'arrosoir dès que ton perso passe à deux cases. Arrosoir de 15 doses.', 'La citerne d\'arrosage : elle arrose seule 12 nouveaux semis. Arrosoir de 20.', 'Dallage et abreuvoir : citerne de 20, arrosoir de 30.', 'Le château d\'eau : citerne de 32, arrosoir de 45.'],
  enclos: ['6 cases, 2 Bouftous, 3 laines avant la tonte.', 'Portique et abreuvoir : repus 50 % plus longtemps. 8 cases, 3 Bouftous.', 'Clôture peinte et mangeoire : ils se servent seuls dans la grange. 10 cases, 4 Bouftous, 5 laines.', 'La bergerie et les cisailles : 12 cases, 5 Bouftous, 7 laines.', 'Le ranch de Redemption : 14 cases, 6 Bouftous, 9 laines.'],
  voliere: ['Le petit jardin à Tofus : 2 Tofus.', 'La volière-jardin, son abri et ses nids : 4 Tofus. Elle prend une case de plus, à côté.', 'Le muret de pierre et le premier nichoir : 6 Tofus.', 'La grande volière, deux nichoirs : 8 Tofus.', 'Le jardin de Redemption, piliers de pierre et bannières : 10 Tofus.'],
  nivEtal: ['L\'étal.', 'La charrette : tu vends 10 % plus cher.', 'Graines et balance : les graines coûtent 15 % moins cher.', 'Le comptoir couvert : ventes +15 %.', 'Le comptoir de Redemption : ventes +20 %, graines 20 % moins chères.']
};
const nivRequis = (a, n) => a.nivs ? a.nivs[Math.min(n, a.nivs.length - 1)] : a.niv;
/* « les parcelles ca coute pas tres cher, surtout a partir de la 2 » (Mathieu, 12/10/2026) : 150, puis par paliers qui suivent les terrains
   (6 parcelles par terrain a l'epoque, 4 depuis le 19/10/2026), et 6 000 a partir de la 30e jusqu'a la fin (avant : 50, puis bloque a 2 500 des la 12e) */
const PRIX_PARCELLE = [150, 200, 300, 400, 500, 650, 800, 1000, 1300, 1600, 1900, 2200, 2500, 2800, 3000, 3200, 3400, 3600, 3800, 4000, 4200, 4400, 4600, 4800, 5000, 5200, 5400, 5600, 5800, 6000];
/* Temps reel : les durees sont en minutes. Avec ?test=1 dans l'adresse, tout va 60 fois plus vite (une minute devient une seconde). */
const TEST = /[?&]test=1/.test(location.search) && /^(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)$/.test(location.hostname); /* le mode test (temps x60) : sur le PC et le reseau local seulement ; en ligne, la beta demande un compte */
/* « en mode test local, retire le x60, laisse-moi comme tout le monde choisir de x1 a x50 » (Mathieu, 12/10/2026) : ?test=1 garde sa sauvegarde a part,
   mais le temps est celui de tout le monde (le curseur) ; le x60 ne sert plus qu'aux tests automatiques, avec &rapide=1 en plus */
/* LE TEMPS (14/10/2026, « remet tout a la bonne echelle, on parlera en x1, x1,5, x2, comme c'est regle actuellement dans le jeu », Mathieu) : toutes les
   durees du code sont en VRAIES minutes (MIN) et vraies secondes (SEC), a la vitesse x1 du curseur. Il n'y a plus de « minute de jeu » : le Ble pousse en 1 min 30,
   le Seigle en 35 min, la laine vient toutes les 6 min, un pot de gelee en 1 min. Seule exception, voulue : en pause ou hors du jeu, la ferme tourne 20 fois
   moins vite (VITESSE_ABSENCE), pour ne pas retrouver 200 pots et toutes ses recoltes au retour.
   (Du 13 au 14/10/2026, les durees etaient ecrites en minutes de jeu de 3 s, le x20 du premier curseur : chaque valeur a ete divisee par 20 ce jour-la.) */
const RAPIDE = TEST && /[?&]rapide=1/.test(location.search), MIN = RAPIDE ? 20000 : 60000, SEC = MIN / 60; /* (rapide=1 : les tests automatiques, trois fois plus vite) */
const REPERE_TEMPS = RAPIDE ? 60 : 20; /* le repere ecrit dans chaque sauvegarde (S_.rythme), a ne jamais changer : convertirRythme recale les parties d'avant le 13/10/2026 */
const DUREE_GESTATION = 60 * MIN; /* (15/10/2026 : la gestation, 1 h) */
const DUREE_CROISSANCE = 60 * MIN, DUREE_CROISSANCE_NOIR = 120 * MIN, /* (1 h le ventre plein, 2 h pour un noir, depuis le 14/10/2026 ; 12 min avant) */ REPOS_REPRO = 24 * MIN, COUT_REPRO = 15, CHANCE_NOIR = { aucun: 1 / 20, deja: 1 / 40, deuxParents: 1 / 2 }, REPAS_BEBE = 6; /* l'elevage (voir plus haut) ; COUT_REPRO en Houblon (15 depuis le 14/10/2026, « met 15 houblons au lieu de 10 », Mathieu ; 10 avant) */
const CAPACITE_EAU = 10; /* l'arrosoir de depart : 10 arrosages, puis il faut retourner au puits */
const capaciteCiterne = () => [0, 6, 12, 20, 32][Math.min(4, niv('arrosoir'))]; /* la citerne d'arrosage (amelioration 'arrosoir') */
const citernePleine = () => !niv('arrosoir') || (S_.citerne || 0) >= capaciteCiterne();
const capaciteEau = () => [10, 15, 20, 30, 45][niv('reservoir')] || CAPACITE_EAU;
const PRIX_FILET = 40, CHANCE_CAPTURE = 0.15, CHANCE_SAUVAGE = 0.35; /* filet de capture : chance faible sur un champ, meilleure sur un Tofu pose dans l'herbe */
const CADENCE_PLUME = 4.5 * MIN, PLUMES_PAR_TOFU = 2, DUREE_SAUVAGE = 1 * MIN; /* a la voliere, chaque Tofu capture donne des plumes a vendre */
const NERF_KAMAS = 0.9; /* (15/10/2026 : -10 % sur tout ce qui rapporte des kamas) */
/* LES GAINS DE KAMAS (refonte du 16/10/2026) : tout gain de kamas s'ecrit kamasGagnes(montant prevu), qui applique la baisse de 10 % et arrondit.
   Une nouvelle recompense (donjon, quete, coffre, vente) l'utilise a sa definition. N'en sont pas : les remboursements, les kamas voles repris,
   le Casino. Les prix de l'HDV prennent NERF_KAMAS dans prix(). L'XP, elle, passe toujours par gagnerXp (NERF_XP dans xpReel). */
const kamasGagnes = (brut) => Math.round(brut * NERF_KAMAS);
const NERF_XP = 0.9; /* (16/10/2026 : -10 % sur toute l'XP, dans xpReel et xpParRecolte ; toute nouvelle XP doit passer par gagnerXp pour la prendre) */
const PRIX_BOUFTOU = 1000, PRIX_PREMIER_BOUFTOU = 300, REVENTE_BOUFTOU = kamasGagnes(800), REVENTE_BEBE = kamasGagnes(300), REVENTE_NOIR = kamasGagnes(3000); /* (le noir : sa laine vaut 3,75 fois l'autre, il se revend 3,75 fois plus) */
const prixBouftou = () => ((S_ && S_.bouftousAchetes) ? PRIX_BOUFTOU : PRIX_PREMIER_BOUFTOU); /* le premier achete coute 300, les suivants 1 000 */
const REPAS = 2, DUREE_REPAS = 12 * MIN, LAINE_MAX = 3, CADENCE_LAINE = 6 * MIN;
/* les ameliorations de l'elevage : abreuvoir (repus plus longtemps), cisailles d'or (plus de laine en attente), voliere agrandie (plus de plumes) */
const dureeRepas = () => DUREE_REPAS * (niv('abreuvoir') ? 1.5 : 1), laineMax = () => LAINE_MAX + 2 * niv('cisailles'), plumesParTofu = () => PLUMES_PAR_TOFU, capaciteVoliere = () => 2 + 2 * niv('voliere'); /* la voliere : 2 places, puis 4, 6, 8 et 10 */
/* les Tofus nuisibles : ils se posent sur une culture plantee (a tout stade), environ une fois toutes les 3 h par parcelle, 2 au plus en meme temps ;
   pas chasse au bout de 30 min, il vole 1 recolte et s'en va. Il reste toujours au moins 1 recolte. Une parcelle est tranquille 20 min apres. */
/* le voleur de VSA : il passe environ toutes les 2 h 30 si la grange vaut le detour, et file vers elle ; on le touche pour le chasser */
const CADENCE_VOLEUR = 7.5 * MIN, VITESSE_VOLEUR = 1.7;
const PRIX_FLECHE = 10; /* l'arbalete du toit de la grange : un carreau par tir, a recharger avec les fleches achetees */
const nivArb = () => Math.max(1, Math.min(6, niv('arbalete'))) - 1; /* (une arbalete pas encore construite se lit comme le niveau 1) */
const degatsArbalete = () => niv('arbalete') ? DEG_ARBALETE[nivArb()] : 0, /* (14/10/2026 : deux fois une tour du meme niveau, 30 a 120 ; 18 a 54 depuis le 13/10, 30 a 90 avant) */ porteeArbalete = () => [7, 8, 9.5, 10.5, 12, 13][nivArb()], capaciteArbalete = () => [3, 6, 9, 12, 15, 18][nivArb()], cadenceArbalete = () => [1.1, 1.0, 0.9, 0.8, 0.65, 0.6][nivArb()];
/* les voleurs de VSA se renforcent a chaque vague gagnee : plus de PV, un peu plus rapides, plus gourmands */
/* les tours de defense : sans archer, une arbalete tournante qui tire seule sur les voleurs et les monstres, en puisant dans la reserve de fleches */
const TOURS_MAX = 4, PRIX_TOUR = [600, 1200, 2000, 3000], NIV_TOUR = 4, CADENCE_TOUR = 1.5;
/* LES TOURS ET L'ARBALETE A -40 % (13/10/2026, Mathieu : « applique un -40 % de degats des tours, peu importe le niveau ou le nombre pose ; pareil pour
   l'arbalete ») : 25, 40, 60, 80, 100 avant (puis 18, 28, 42, 56, 70 quelques minutes). Simule (scratchpad/simtours), 4 tours niveau 5, vagues 30 a 60 :
   77 % de vie restante en moyenne avant, environ 70 % a -40 % ; elles visent d'abord les monstres qui attaquent un batiment (monstreAViser).
   Piste suivante si ca reste facile : +1 % de PV et de degats des monstres par niveau de tour (environ 53 % simule a +25 %, sans toucher aux joueurs sans tours) */
const DEG_ARBALETE = [30, 48, 72, 96, 120, 150]; /* (150 : la baliste d'acier, niveau 6, 09/11/2026) */ /* = 2 x NIV_TOURS.deg : l'arbalete se recharge a la main, elle tape deux fois plus fort qu'une tour */
/* (le niveau 6 : les 4 tours du chateau-grange, 02/11/2026, « ca tape plus fort, ca couvre une zone plus grande », Mathieu) */
const NIV_TOURS = { deg: [15, 24, 36, 48, 60, 80], portee: [6.5, 7.5, 8.5, 9.5, 10.5, 11.5], cadence: [1.5, 1.4, 1.3, 1.2, 1.1, 1.0], pv: [300, 550, 900, 1400, 2000, 2000], prix: [600, 1500, 3000, 5000], nivs: [5, 6, 7, 8] };
const nivTour = (c) => Math.max(1, Math.min(6, (c && c.niv) || 1)) - 1; /* une tour, de 1 a 5 (sa case la porte) ; 6 : une tour du chateau-grange (TOUR_CHATEAU) */
const caseTour = (id) => S_.cases.find((c) => c.id === id && c.type === 'tour');
const porteeTour = (c) => NIV_TOURS.portee[nivTour(c)], cadenceTour = (c) => NIV_TOURS.cadence[nivTour(c)];
/* LE CHATEAU-GRANGE (02/11/2026) : la grange niveau 6 (amelio.qg = 5) ; ses 4 tours d'angle comptent comme les 4 tours de la ferme, on n'en rebatit pas */
const aChateau = () => !!(S_ && S_.amelio && S_.amelio.qg >= 5), TOUR_CHATEAU = { niv: 6 };
const degatsTour = (c) => NIV_TOURS.deg[nivTour(c)], nbTours = () => S_.cases.filter((c) => c.type === 'tour').length + (aChateau() ? TOURS_MAX : 0);
const forceVoleur = () => Math.max(0, Math.min(49, S_.vague.num - 1)), pvVoleur = () => 20 + 7 * forceVoleur(); /* VSA suit ta progression jusqu'a la vague 50 */
/* « quand ta voliere a Tofus est pleine, reduis de 40 % le taux d'apparition des Tofus » (Mathieu, 13/10/2026) : les Tofus des champs et les sauvages */
const peutCapturer = (dore) => S_.filets > 0 && (S_.tofus < capaciteVoliere() || (!!dore && (S_.tofusDores || 0) < S_.tofus)); /* (un Tofu dore prend la place d'un Tofu normal quand la voliere est pleine, 07/11/2026) */ /* (voliere pleine : on chasse, sans fenetre) */
/* LE TOFU DORE NE SE TUE PAS (07/11/2026, « il peut pas se faire tuer par l'epouvantail ? et nous meme si on clique dessus on peut pas le tuer ? on peut juste
   le capturer, mais faut un filet », Mathieu) : ni chasse ni Pepito-Tron, un filet rate ne le fait pas fuir ; il part capture, ou de lui-meme a la fin de son temps */
const doreIci = () => !!(S_.sauvage && S_.sauvage.dore);
function refusDore() { toast(S_.filets > 0 ? 'Ta volière est pleine de Tofus dorés : agrandis-la (HDV, onglet Améliorer) pour en accueillir un autre.' : 'Un Tofu doré ! Il ne se chasse pas : il te faut un filet de capture pour l\'attraper (HDV, onglet Acheter).', 'or'); }
const capturable = (p) => peutCapturer() && p.nuisible !== 'wabbit'; /* un Wabbit qui grignote un champ ne va pas dans la voliere a Tofus : on le chasse (19/10/2026) */
const freinTofus = () => (S_.tofus >= capaciteVoliere() ? 0.6 : 1);
/* LES WABBITS DES CHAMPS (19/10/2026, Mathieu : « les oiseaux s'attaquent plutot aux cereales et les lapins plutot aux carottes ») : apres la vague 50, les
   Tofus ne mangent plus que les cereales, et les Wabbits que les Cawottes et les Fraises (WABBIT_MANGE), environ une fois toutes les 27 min par champ, un a
   la fois (le leurre compris) ; l'epouvantail ne leur fait pas peur. Avant la vague 50, les Tofus mangent tout, comme avant. Le leurre : js/14b-leurre.js */
const WABBIT_MANGE = ['cawotte', 'fraise'], RYTHME_WABBIT = 27 * MIN, WABBITS_MAX = 1, ATTIRE_LEURRE = [0, 0.5, 0.75, 1], CHANCE_POIL = 0.5;
const mangeWabbit = (c) => S_.vague.num > 5 * VAGUES_PALIER && WABBIT_MANGE.includes(c);
const wabbitsDehors = () => S_.cases.filter((x) => x.tofu && x.nuisible === 'wabbit').length + (S_.leurreWabbit ? 1 : 0), tofusDehors = () => S_.cases.filter((x) => x.tofu && x.nuisible !== 'wabbit').length;
const verrouVague = (a) => !!a.apresVague && S_.vague.num <= a.apresVague; /* une amelioration qui attend une vague (le leurre : apres la vague 50) */
const poilDeWabbit = () => { if (Math.random() >= CHANCE_POIL) return false; S_.grange.poil_wabbit = (S_.grange.poil_wabbit || 0) + 1; rendreGrange(); return true; }; /* un Wabbit chasse lache un Poil de Wabbit une fois sur deux */
const RYTHME_TOFU = 9 * MIN, TOFUS_MAX = 2, DUREE_PICORAGE = 1.5 * MIN, ACCALMIE_TOFU = 1 * MIN, CADENCE_COURS = 2 * MIN, CADENCE_CRISE = 5 * MIN, DUREE_CRISE = 60000; /* (rythme fixe : les cours bougent toutes les 2 min, une crise d'une vraie minute toutes les 5 min au plus) */
const PART_CONSTRUCTIBLE = 0.7; /* la regle de Mathieu : 70 % des cases au plus */
const PEPITO = [
  'un Tofu dans le blé, c\'est comme VSA à l\'HDV : faut le chasser vite.',
  'arrose tes semis. un champ sec pousse aussi vite qu\'une maj d\'Ankama.',
  'je bosse pour des pépites, toi pour des kamas. on sait qui négocie le mieux.',
  'un Bouftou qui a faim ne donne rien. comme un perco à 1 pod.',
  'vends ta laine quand les bots de VSA dorment, le cours remonte toujours.',
  'laisse respirer ta ferme : une case vide, c\'est une case où les Tofus ne picorent rien.',
  'l\'Engrais d\'Amakna, c\'est le seul boost que personne ne nerfe.'
];
const CLASSES = [
  { id: 'iop', nom: 'Iop', ico: '⚔️', desc: 'Frappe au corps à corps, et son épée touche aussi les monstres collés à sa cible. Beaucoup de PV, encaisse 15 % de dégâts en moins sur les coups de loin, se régénère en combat (0,5 % de sa vie toutes les 4 s), ses coups d\'épée font 50 % de dégâts en plus sous 50 % de vie, et son ulti le rend invincible 2 s, puis il court 10 % plus vite pendant 2 s. Son Bond du Iop le soigne (10 % de sa vie au plus).', sort: 'Bond du Iop', tunique: '#c0392b',
    role: 'Corps à corps', niveau: ['Difficile', 'difficile'], rang: 3, lignes: ['Va au contact et frappe fort.', 'Le plus solide, mais il encaisse tout au corps à corps.'], sortTxt: 'tu choisis où il saute ; en retombant, il frappe trois fois plus fort.' },
  { id: 'cra', nom: 'Cra', ico: '🏹', desc: 'Tire de loin (5 cases), une flèche de feu toutes les 10. Plus léger, il court 15 % plus vite : recule pour garder tes distances. Sa Flèche perçante traverse toute une ligne de monstres (recharge 20 s).', sort: 'Flèche perçante', tunique: '#2e8b57',
    role: 'À distance', niveau: ['Facile', 'facile'], rang: 1, lignes: ['Tire de loin, à l\'abri.', 'Idéal pour débuter : il touche avant d\'être touché.'], sortTxt: 'une flèche qui traverse toute une ligne de monstres.' },
  { id: 'osa', nom: 'Osamodas', ico: '🐏', desc: 'Invoque les bêtes capturées : il vise où poser son Bouftou, qui retombe sur les monstres et se bat pour lui.', sort: 'Invocation', tunique: '#6f42c1',
    role: 'Invocateur', niveau: ['Moyen', 'moyen'], rang: 2, lignes: ['Fait combattre des Bouftous à sa place.', 'Plus technique : tu choisis où les poser.'], sortTxt: 'un Bouftou tombe sur les monstres puis se bat pour toi.' }
];
