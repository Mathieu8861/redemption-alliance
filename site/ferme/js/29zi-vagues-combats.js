'use strict';
/* LES VAGUES EN COMBATS (26/11/2026, Mathieu : « on va changer de modele, maintenant on fera comme on a fait la : la vague 101 se decomposera en 5 combats,
   il faut en valider au moins 4 pour passer a la 102, et comme ca jusqu'a la 110 ; en augmentant la difficulte et en mixant les monstres par rapport a un
   niveau fiable ; a chaque vague ca doit etre plus dur, et les combats diversifies au sein des vagues ») :
   - chaque vague de 101 a 110 = 5 combats (101.1 a 101.5), joues dans l'ordre qu'on veut, rejouables ; 4 gagnes ouvrent la vague suivante ;
     aux vagues 105 et 110, le combat du boss compte obligatoirement parmi les 4 (COMBATS_MARE.bossObligatoire) ;
   - les 5 combats d'une vague sont a peu pres aussi durs, chacun a sa facon (STYLES_CM) ; chaque vague est plus dure que la precedente ;
   - le repere fiable : la 101.9 de la serie d'essais, la deferlante (5 victoires sur 8, 43 % de vie a la fin, note 6 sur 10, « bien equilibre »), reglee au bot
     a 1,6 fois la 99 ; les autres facons partent des reglages au bot de la serie (29q-essai-101.js), corriges par les notes des joueurs ;
   - un combat passe par la meme voie que la serie d'essais (ESSAI101.lance, lu par lancerVague) : ses leviers (P : horde, pv, deg, vit, cad, sorts, cl)
     s'appliquent comme ceux d'une version ; P.cm le distingue (29q-essai-101.js laisse alors le combat tranquille : pas de coffre ni de reparation gratuite) ;
   - gains : la premiere victoire d'un combat donne la moitie des gains de la vague, une victoire de plus un quart (26/11/2026, au formulaire : « la moitie, puis un quart », Mathieu) ;
   - les etourdissements ne s'enchainent plus : apres une entrave (colle, assomme, langue), le perso est libre COMBATS_MARE.immu secondes.
   Version dev : seulement avec le palier 11 (p11Ouvert, le mode test tant que SORTIE_P11 est eteint). */
const COMBATS_MARE = { nb: 5, gagner: 4, bossObligatoire: true, immu: 2, part: { premiere: 0.5, rejoue: 0.25 }, partDeg: 0.59, partHorde: 0.42 };
/* LA MONTEE DE LA DIFFICULTE (26/11/2026, au formulaire : « de la 101 a 104 +6 % par vague, ensuite demi-boss a la 105, donc c'est cense etre quand meme plus dur que
   la 104 ; et de la 106 a la 109 on fait +4 % par vague », Mathieu) : la cible au bot de chaque vague, la 101 valant 1 ; la 105 et la 110, vagues de boss, un cran
   au-dessus de la vague d'avant. Les coups en prennent partDeg, le nombre de monstres partHorde (en puissance) ; le bot corrige ensuite chaque combat */
const MONTEE_CM = { 101: 1, 102: 1.06, 103: 1.124, 104: 1.191, 105: 1.262, 106: 1.313, 107: 1.365, 108: 1.42, 109: 1.477, 110: 1.536 };
const cmActif = () => typeof p11Ouvert === 'function' && p11Ouvert();
const vagueEnCombats = (n) => cmActif() && n > 10 * VAGUES_PALIER && n <= 11 * VAGUES_PALIER;
const combatCMde = (c) => (c && c.essai101 && c.essai101.P && c.essai101.P.cm) || null;
const mareOuTribu = (n, a, b) => (n <= 10 * VAGUES_PALIER + 5 ? a : b); /* (101 a 105 : les amphibiens ; 106 a 110 : la tribu de la mare) */
const sansBossCM = (L) => L.filter(([t]) => !MONSTRES[t].boss).map((x) => x.slice());
/* LES FACONS D'ETRE DUR (tirees des retours des 101.x : le nombre et les coups qui tombent vite font la pression ; les lents se kitent, les sacs a PV sont
   longs) ; L : la composition avant la horde ; P : les leviers a la 101 (deg et horde montent ensuite a chaque vague, voir combatCM) */
const STYLES_CM = {
  deferlante: { nom: 'La déferlante', desc: 'beaucoup de monstres, rapides, qui tapent fort : impossible de les semer',
    L: (n) => sansBossCM(COMPO_MARE[Math.min(VAGUES_PALIER, n - 10 * VAGUES_PALIER)]), P: { horde: 5, pv: 0.85, deg: 3.46, vit: 1.3, cl: { iop: 1.06, cra: 0.97, osa: 0.98 } } }, /* (la 101.9 : le repere) */
  essaim: { nom: 'L\'essaim', desc: 'une marée de petits monstres, chacun plus faible',
    L: (n) => mareOuTribu(n, [['tetard', 4], ['crapaud', 2], ['triton', 1]], [['piranha', 4], ['tetard', 3], ['crapaud', 1]]), P: { horde: 5.5, pv: 0.7, deg: 3.3, vit: 1.1, cl: { iop: 0.96, cra: 1, osa: 1.04 } } }, /* (la 101.2 : note 7, l'Osamodas ecrase, 0 sur 3 pour Daryoo) */
  assaut: { nom: 'L\'assaut', desc: 'un peu de tout et plus vite : des langues qui attirent, des crachats, des monstres au contact, des sorts plus fréquents',
    L: (n) => mareOuTribu(n, [['tetard', 3], ['fouette', 2], ['crapaud', 2]], [['crocoVase', 2], ['piranha', 2], ['fouette', 2], ['crapaud', 1]]), P: { horde: 4, pv: 1, deg: 3.3, vit: 1.25, cad: 0.85, sorts: 0.7, cl: { iop: 1.1, cra: 0.97, osa: 0.94 } } }, /* (la 101.10 : note 7,5, un peu adoucie) */
  tirsCroises: { nom: 'Les tirs croisés', desc: 'des Crachopauds qui tirent de partout et des monstres rapides qui te forcent à bouger',
    L: (n) => mareOuTribu(n, [['crapaud', 3], ['tetard', 3]], [['crapaud', 3], ['piranha', 3]].concat(n >= 107 ? [['libeclair', 1]] : [])), P: { horde: 3.5, pv: 1.05, deg: 2.8, vit: 1.3, cl: { iop: 1.14, cra: 0.95, osa: 0.93 } } }, /* (les tireurs seuls, 101.6, etaient trop simples : note 4,6) */
  elites: { nom: 'Les élites', desc: 'peu de monstres, mais très forts et rapides : charges, bonds et coups au sol plus souvent',
    L: (n) => mareOuTribu(n, [['triton', 2], ['fouette', 1], ['tetard', 2]], [['crocoVase', 2], ['triton', 1]].concat(n >= 107 ? [['brochet', 1]] : [['tetard', 1]])), P: { horde: 2, pv: 2, deg: 5, vit: 1.35, sorts: 0.6, cl: { iop: 0.63, cra: 1.23, osa: 1.28 } } }, /* (les brutes lentes, 101.3, se kitaient : note 4) */
  entraves: { nom: 'Les entraves', desc: 'des langues qui attirent et des flaques de vase qui ralentissent, mais plus d\'étourdissements à la chaîne : après une prise, tu es libre 2 s',
    L: () => [['fouette', 3], ['crapaud', 2], ['tetard', 2]], P: { horde: 3.5, pv: 1.1, deg: 4.2, vit: 1.1, cl: { iop: 1.02, cra: 1.05, osa: 0.94 } } }, /* (la 101.7 : « IMPOSSIBLE ca stun de fou » en Iop, « super simple » en Cra) */
  chaman: { nom: 'Le chaman', desc: 'le chaman soigne et protège sa troupe : va le chercher au milieu d\'elle',
    L: (n) => (n >= 108 ? [['silure', 1], ['axolotl', 1], ['crocoVase', 2], ['brochet', 1], ['tetard', 2]] : [['axolotl', 1], ['triton', 2], ['tetard', 3], ['crapaud', 1]]), P: { horde: 4, pv: 1, deg: 3.4, vit: 1.25, cl: { iop: 0.86, cra: 1.08, osa: 1.08 } } },
  meute: { nom: 'La meute', desc: 'des Piranhargnes par dizaines, rapides et voraces, menés par un Croquevase',
    L: () => [['piranha', 5], ['crocoVase', 1], ['tetard', 1]], P: { horde: 4.5, pv: 0.8, deg: 3.2, vit: 1.2, cl: { iop: 0.75, cra: 1.13, osa: 1.17 } } },
  machoires: { nom: 'Les mâchoires', desc: 'les Croquevases chargent et happent : ne reste pas dans leur ligne',
    L: () => [['crocoVase', 3], ['piranha', 2], ['crapaud', 1]], P: { horde: 3, pv: 1.25, deg: 3.8, vit: 1.2, sorts: 0.75, cl: { iop: 1.01, cra: 0.91, osa: 1.09 } } },
  harceleurs: { nom: 'Les harceleurs', desc: 'les Brochéroces lancent leurs piques de loin pendant que les Piranhargnes te collent',
    L: () => [['brochet', 3], ['piranha', 3], ['crapaud', 1]], P: { horde: 3.5, pv: 1, deg: 3.4, vit: 1.2, cl: { iop: 1.1, cra: 0.89, osa: 1.02 } } },
  orage: { nom: 'L\'orage', desc: 'les Libéclairs foudroient du ciel, les Tritonnerres frappent au sol',
    L: (n) => [['libeclair', 2], ['triton', 2], ['crapaud', 1], ['tetard', 2]].concat(n >= 108 ? [['silure', 1]] : []), P: { horde: 3.5, pv: 1, deg: 3.4, vit: 1.2, cl: { iop: 1.13, cra: 0.88, osa: 1.01 } } },
  maree: { nom: 'La marée', desc: 'toute la mare à la fois : un peu de chaque monstre',
    L: () => [['crocoVase', 1], ['piranha', 2], ['brochet', 1], ['silure', 1], ['tetard', 2], ['crapaud', 1], ['fouette', 1], ['libeclair', 1], ['triton', 1]], P: { horde: 3, pv: 1, deg: 3.4, vit: 1.2, cl: { iop: 1.08, cra: 0.91, osa: 1.02 } } },
  /* LES COMBATS EN PLUSIEURS TEMPS (26/11/2026, « dans les combats de vague, faut voir comment tu fais varier les choses ; faudra mixer les monstres aussi, des monstres
     101 a 104 avec des 106 a 109, je te laisse voir », Mathieu) : la troupe arrive en plusieurs temps, comme aux vagues de boss (l'entracte entre deux temps compris) */
  montante: { brut: true, /* (l'avant-garde comptee telle quelle, sans l'effectif minimum d'une vague : sinon elle etait plus grosse que la suite) */ nom: 'La marée montante', desc: 'trois temps, de plus en plus gros : une avant-garde, puis une deuxième vague, puis la grande marée',
    L: (n) => mareOuTribu(n, [['tetard', 3], ['crapaud', 1]], [['piranha', 3], ['tetard', 2]]), P: { horde: 4, pv: 1, deg: 3.3, vit: 1.2, cl: { iop: 0.79, cra: 1.17, osa: 1.09 } },
    temps: (n) => mareOuTribu(n,
      [{ nom: 'la deuxième vague', L: [['tetard', 2], ['fouette', 1], ['crapaud', 2]], horde: 4 }, { nom: 'la grande marée', L: [['triton', 2], ['tetard', 3], ['crapaud', 2]].concat(n >= 103 ? [['axolotl', 1]] : []), horde: 4.6 }],
      [{ nom: 'la deuxième vague', L: [['crocoVase', 1], ['piranha', 2], ['crapaud', 2]], horde: 4 }, { nom: 'la grande marée', L: [['crocoVase', 2], ['brochet', 1], ['triton', 1], ['libeclair', 1], ['piranha', 2]], horde: 4.6 }]) },
  relais: { nom: 'Le relais', desc: 'les amphibiens d\'abord, puis la tribu de la mare prend le relais',
    L: () => [['tetard', 3], ['crapaud', 2], ['fouette', 1], ['triton', 1]], P: { horde: 3.5, pv: 1, deg: 3.4, vit: 1.2, cl: { iop: 0.96, cra: 0.95, osa: 1.1 } },
    temps: (n) => [{ nom: 'la tribu de la mare', L: [['crocoVase', 2], ['piranha', 3]].concat(n >= 107 ? [['brochet', 1], ['libeclair', 1]] : [['piranha', 1]]).concat(n >= 108 ? [['silure', 1]] : []), horde: 3 }] },
  boss: { boss: true, nom: (n) => (n === 11 * VAGUES_PALIER ? 'Le Mâchefange' : 'La Mère Crapustule'),
    desc: (n) => (n === 11 * VAGUES_PALIER ? 'la horde, puis la Mère Crapustule et la garde de la tribu, puis le Mâchefange en personne' : 'la reine de la mare et sa troupe : elle arrive quand il ne reste que 6 monstres'),
    L: (n) => COMPO_MARE[n - 10 * VAGUES_PALIER].map((x) => x.slice()), P: { pv: 1, deg: 3.2, vit: 1.15 } } };
/* LES 5 COMBATS DE CHAQUE VAGUE : trois facons deja vues et une ou deux nouvelles, les nouveaux monstres avec leur facon */
const PLAN_CM = {
  101: ['deferlante', 'essaim', 'tirsCroises', 'elites', 'assaut'],
  102: ['essaim', 'entraves', 'deferlante', 'elites', 'montante'],
  103: ['chaman', 'tirsCroises', 'entraves', 'montante', 'assaut'],
  104: ['chaman', 'deferlante', 'elites', 'tirsCroises', 'entraves'],
  105: ['deferlante', 'assaut', 'chaman', 'montante', 'boss'],
  106: ['meute', 'machoires', 'relais', 'tirsCroises', 'essaim'],
  107: ['orage', 'harceleurs', 'meute', 'relais', 'assaut'],
  108: ['maree', 'chaman', 'orage', 'elites', 'montante'],
  109: ['maree', 'relais', 'machoires', 'harceleurs', 'chaman'],
  110: ['maree', 'relais', 'orage', 'elites', 'boss'] }; /* (26/11/2026 : la maree montante et le relais remplacent un combat par vague, des la 102) */
/* LES RETOUCHES DU BOT, combat par combat (outils/banc/series/calib_combats.py) : deg et pv multiplient ceux du calcul ; aux combats de boss, deg vaut aussi pour
   les coups du boss et chefPv pour sa vie (P.chef, applique a son arrivee). Lot cma du 26/11/2026 (150 combats, une graine) : coefficients de classe par facon
   (cl) et premier reglage, amorti et borne de 0,6 a 1,7 ; lot cmb (150 combats, une autre graine) : deuxieme reglage, amorti de moitie ; les lots ensemble (outils/banc/series/calib_combats_lots.py) : troisieme reglage et coefficients de classe ; lot cmc : quatrieme reglage sur les trois lots, nouvelle courbe (MONTEE_CM), les combats nouveaux pas encore mesures ; lot cmd (5 fermes, 250 combats) : le niveau sur les 3 fermes de reference de la cible, les classes sur les 5 ; lot cme (les 8 nouveaux combats, 2 graines) : la maree montante a un tiers de monstres en plus plutot que des coups plus gros, puis lot cmf : ses coups recales */
const REGLAGES_CM = { '101.1': { deg: 1.018 }, '101.2': { deg: 1.285 }, '101.3': { deg: 2.093 }, '101.4': { deg: 0.865 }, '101.5': { deg: 1.007 }, '102.1': { deg: 1.597 }, '102.2': { deg: 0.635 }, '102.3': { deg: 0.890 }, '102.4': { deg: 0.709 }, '102.5': { deg: 1.479 }, '103.1': { deg: 0.895 }, '103.2': { deg: 1.497 }, '103.3': { deg: 0.774 }, '103.4': { deg: 1.287 }, '103.5': { deg: 0.693 }, '104.1': { deg: 0.876 }, '104.2': { deg: 0.791 }, '104.3': { deg: 0.849 }, '104.4': { deg: 1.363 }, '104.5': { deg: 0.591 }, '105.1': { deg: 0.667 }, '105.2': { deg: 0.744 }, '105.3': { deg: 0.815 }, '105.4': { deg: 1.241 }, '105.5': { deg: 3.324, chefPv: 1.300 }, '106.1': { deg: 1.920 }, '106.2': { deg: 0.724 }, '106.3': { deg: 1.238 }, '106.4': { deg: 0.787 }, '106.5': { deg: 0.826 }, '107.1': { deg: 0.785 }, '107.2': { deg: 0.617 }, '107.3': { deg: 2.100 }, '107.4': { deg: 0.773 }, '107.5': { deg: 0.376 }, '108.1': { deg: 0.775 }, '108.2': { deg: 1.795 }, '108.3': { deg: 0.826 }, '108.4': { deg: 0.490 }, '108.5': { deg: 0.910 }, '109.1': { deg: 0.668 }, '109.2': { deg: 0.646 }, '109.3': { deg: 0.934 }, '109.4': { deg: 0.922 }, '109.5': { deg: 2.303 }, '110.1': { deg: 0.779 }, '110.2': { deg: 0.850 }, '110.3': { deg: 0.829 }, '110.4': { deg: 2.055 }, '110.5': { deg: 1.387, chefPv: 1.178 } };
const MAX_CM = { silure: 2 }; /* (le Silurmage soigne : jamais plus de deux, comme l'Axolutin unique) */
const compoTempsCM = (T) => T.L.map(([t, k]) => [t, MONSTRES[t].unique ? 1 : Math.min(MAX_CM[t] || 1e9, Math.max(1, Math.round(k * T.horde)))]); /* (un temps suivant : sa troupe x sa horde) */
function combatCM(n, k) {
  const id = PLAN_CM[n][k], S = STYLES_CM[id], j = n - 10 * VAGUES_PALIER - 1, num = n + '.' + (k + 1), R = REGLAGES_CM[num] || {};
  const nom = typeof S.nom === 'function' ? S.nom(n) : S.nom, desc = typeof S.desc === 'function' ? S.desc(n) : S.desc;
  const P = Object.assign({}, S.P, { nom, desc, cm: { n, k, id, num, boss: !!S.boss } });
  const m = MONTEE_CM[n] || 1; P.deg = +(S.P.deg * Math.pow(m, COMBATS_MARE.partDeg) * (R.deg || 1)).toFixed(3); if (R.pv) P.pv = +((S.P.pv || 1) * R.pv).toFixed(3);
  if (S.P.horde) P.horde = +(S.P.horde * Math.pow(m, COMBATS_MARE.partHorde)).toFixed(2);
  if (S.temps) P.tempsCM = S.temps(n).map((T) => ({ nom: T.nom, L: T.L, horde: +((T.horde || S.P.horde || 3) * Math.pow(m, COMBATS_MARE.partHorde)).toFixed(2) })); /* (les temps suivants du combat) */
  if (S.boss) P.chef = { pv: R.chefPv || 1, deg: R.deg || 1 }; /* (le boss lui-meme : les leviers de la troupe ne le touchent pas) */
  return { n, k, id, num, nom, desc, L: S.L(n), P, boss: !!S.boss };
}
const planCM = (n) => (PLAN_CM[n] || []).map((x, k) => combatCM(n, k));
function compoCM(C) {
  if (STYLES_CM[C.id] && STYLES_CM[C.id].brut) return compoTempsCM({ L: C.L, horde: C.P.horde || 3 });
  const i = C.n - 10 * VAGUES_PALIER, sauve = COMPO_MARE[i], h0 = HORDE_ESSAI; COMPO_MARE[i] = C.L.map((x) => x.slice()); if (C.P.horde) HORDE_ESSAI = C.P.horde;
  try { return compoVague(C.n).map(([t, k]) => [t, MAX_CM[t] ? Math.min(MAX_CM[t], k) : k]); } finally { COMPO_MARE[i] = sauve; HORDE_ESSAI = h0; }
}
/* l'etat, dans la sauvegarde : S_.combatsMare[n] = { g : victoires par combat, e : essais par combat, choix : le combat choisi }, vue : la vague regardee */
const etatCM = () => (S_.combatsMare = S_.combatsMare || {});
const etatVagueCM = (n) => { const E = etatCM(); return (E[n] = E[n] || { g: {}, e: {} }); };
const nbGagnesCM = (n) => (PLAN_CM[n] || []).filter((x, k) => (etatVagueCM(n).g[k] || 0) > 0).length;
const kBossCM = (n) => (PLAN_CM[n] || []).indexOf('boss');
const vagueValideeCM = (n) => { const b = kBossCM(n); return nbGagnesCM(n) >= COMBATS_MARE.gagner && (b < 0 || !COMBATS_MARE.bossObligatoire || (etatVagueCM(n).g[b] || 0) > 0); };
const vueCM = () => { const v = +etatCM().vue, cur = vagueCourante(); return v > 10 * VAGUES_PALIER && v <= cur ? v : cur; };
const choixCM = (n) => { const V = etatVagueCM(n); if (V.choix != null && V.choix >= 0 && V.choix < COMBATS_MARE.nb) return V.choix; const k = (PLAN_CM[n] || []).findIndex((x, j) => !(V.g[j] > 0)); return k >= 0 ? k : 0; };
/* un combat arme (au lancement, ou par le bot du banc) : comme une version de la serie d'essais */
function armerCM(n, k) {
  const C = combatCM(n, k); HORDE_ESSAI = C.P.horde || 0; accelererSorts101(C.L, C.P.sorts);
  ESSAI101.lance = { n, v: C.num, f: 1, k, P: C.P, compo: () => compoCM(C) };
  if (typeof ouvrirTourbe === 'function') ouvrirTourbe(); return C;
}
/* le lancement : le bouton de la fenetre (data-lancer-vague), la manette ou le banc passent par lancerVague ; une vague de 101 a 110 y devient son combat choisi */
{ const lancerVagueCM = lancerVague; lancerVague = function (pBoss, difficile, charges) {
    const rejoueB = pBoss != null && pBoss >= 0;
    if (!rejoueB && !combat && !enAccueil && !lancerVague.charge && !ESSAI101.lance && !(typeof REJOUE_VAGUES !== 'undefined' && REJOUE_VAGUES.lance) && S_.vague.num <= VAGUES_MAX && vagueEnCombats(vagueCourante())) { /* (une vague refaite du jour passe a cote, 29zl) */
      const n = vueCM(); if (lieu !== 'ferme') return lancerVagueCM.apply(this, arguments);
      if (!MODE_TEST && Date.now() < S_.vague.repos) { toast('Ton perso se repose encore ' + dureeLisible(S_.vague.repos - Date.now()) + '.'); return; }
      if (!MODE_TEST && niveau(S_.xp) < niveauRequis(n)) { toast('Il faut le niveau ' + niveauRequis(n) + ' pour la vague ' + n + ' : cultive et élève tes bêtes pour gagner de l\'expérience.', 'alerte'); return; }
      const k = choixCM(n); etatVagueCM(n).choix = k; armerCM(n, k);
    }
    const L = ESSAI101.lance, cm = L && L.P && L.P.cm;
    const tempsL = cm ? (cm.boss ? (PHASES_BOSS[cm.n] || []).map((p) => p.L) : (L.P.tempsCM || []).map((T) => T.L)) : [];
    if (cm && tempsL.length && !charges) { /* (les monstres des temps suivants charges avant, sinon l'image se fige a leur arrivee : le Machefange, la maree montante, le relais) */
      const T0 = [...new Set([].concat(...tempsL.map((l) => l.map(([t]) => t))))], sq = [...new Set(T0.map((t) => MONSTRES[t].modele))].filter((x) => !MODELES[x] && SQUELETTES_A_CHARGER.some(([s]) => s === x));
      if (sq.length) { lancerVague.charge = true; chargerSquelettes(sq).then(() => { prechaufferSquelettes(sq); }).catch(() => {}).finally(() => { lancerVague.charge = false; lancerVague(pBoss, difficile, charges); }); return; } }
    const ph = cm && !cm.boss ? PHASES_BOSS[cm.n] : null; if (ph) delete PHASES_BOSS[cm.n]; /* (un combat ordinaire de la 110 : la horde seule, sans les temps du boss) */
    let r; try { r = lancerVagueCM.apply(this, arguments); } finally { if (ph) PHASES_BOSS[cm.n] = ph; }
    if (cm && combat && combatCMde(combat) && combat.essai101.P.tempsCM) combat.phases = combat.essai101.P.tempsCM.map((T) => { const f = []; compoTempsCM(T).forEach(([t, k]) => { for (let i = 0; i < k; i++) f.push(t); }); f.sort(() => Math.random() - 0.5); return { nom: T.nom, f }; });
    if (cm && combat && combatCMde(combat)) { const P = combat.essai101.P; setTimeout(() => { if (combat && combatCMde(combat)) toast('Combat ' + cm.num + ' · ' + P.nom + ' : ' + P.desc + '.', 'alerte'); }, 1700); }
    else if (cm && !combat && !lancerVague.charge) desarmerEssai101(); /* (pas lance : rien ne reste pour la vague suivante) */
    return r; }; }
/* LE BOSS D'UN COMBAT DE BOSS : sa vie et ses coups suivent P.chef, a son arrivee (la troupe suit les leviers comme d'habitude) */
{ const apparaitreCM = apparaitre; apparaitre = function () { const c = combat, n0 = c ? c.monstres.length : 0, r = apparaitreCM.apply(this, arguments);
    try { const P = combatCMde(c) && c.essai101.P; if (P && P.chef && c.monstres.length > n0) { const o = c.monstres[c.monstres.length - 1]; if (o.d.boss && !o.chefCM) { o.chefCM = true; o.pvMax = Math.round(o.pvMax * P.chef.pv); o.pv = Math.round(o.pv * P.chef.pv); o.deg = Math.round(o.deg * P.chef.deg); } } } catch (e) { /* rien */ }
    return r; }; }
/* LES GAINS : la vague d'essai donne la moitie (rejoue, 23-fin-combat.js) ; ramenee ici a la part du combat */
let cmXp = 0;
{ const gagnerXpCM = gagnerXp; gagnerXp = function (n, exact, sag) { if (cmXp && n > 0 && !exact && sag) { n = n * cmXp; cmXp = 0; } return gagnerXpCM.call(this, n, exact, sag); }; }
const partCM = (n, k) => ((etatVagueCM(n).g[k] || 0) > 0 ? COMBATS_MARE.part.rejoue : COMBATS_MARE.part.premiere);
{ const finVagueCM = finVague; finVague = function (gagne, fuite) {
    const c = combat, cm = c && !c.fin && combatCMde(c); if (!cm) return finVagueCM.apply(this, arguments);
    const f = c.rejoueVague != null ? 0 : partCM(cm.n, cm.k), plein = gainsVague(cm.n, false), /* (f 0 : un combat refait du jour, le butin seul, 29zl) */ demi = gainsVague(cm.n, true), deja = (etatVagueCM(cm.n).g[cm.k] || 0) > 0;
    if (gagne) cmXp = f / 0.5; let r;
    try { r = finVagueCM.apply(this, arguments); } finally { cmXp = 0; desarmerEssai101(); }
    try { apresCM(cm, !!gagne, !!fuite, { f, plein, demi, deja }); } catch (e) { console.error(e); }
    return r; }; }
function apresCM(cm, gagne, fuite, G) {
  const V = etatVagueCM(cm.n); V.e[cm.k] = (V.e[cm.k] || 0) + 1; const fois = V.e[cm.k], kamas = Math.round(G.plein.kamas * G.f); let ouvre = false;
  if (gagne) { if (G.f) S_.kamas += kamas - G.demi.kamas; V.g[cm.k] = (V.g[cm.k] || 0) + 1; V.choix = null;
    if (S_.vague.num === cm.n && vagueValideeCM(cm.n)) { S_.vague.num = cm.n + 1; ouvre = true; etatCM().vue = null; } }
  const J = S_.journalVagues, e = Array.isArray(J) ? J[J.length - 1] : null; if (e && e.n === cm.n && !e.combat) e.combat = { num: cm.num, style: cm.id, fois };
  sauver(); rendreHaut();
  const carte = $('carte'); if (!carte || modaleOuverte !== 'vague-fin') return;
  const C = combatCM(cm.n, cm.k), h = carte.querySelector('h2');
  if (h && h.firstChild && h.firstChild.nodeType === 3) h.firstChild.nodeValue = (gagne ? 'Combat ' + cm.num + ' gagné !' : fuite ? 'Tu as fui le combat ' + cm.num : 'Combat ' + cm.num + ' perdu');
  if (gagne) { const b = carte.querySelector('.art b'); if (b) b.innerHTML = b.innerHTML.replace('+' + fmt(G.demi.kamas), '+' + fmt(kamas)); }
  carte.querySelectorAll('p').forEach((p) => { if (/t'attend|tous les paliers sont termin/.test(p.textContent)) p.remove(); });
  const ng = nbGagnesCM(cm.n), b = kBossCM(cm.n), bossManque = b >= 0 && COMBATS_MARE.bossObligatoire && !(V.g[b] > 0), reste = Math.max(0, COMBATS_MARE.gagner - ng);
  const suite = ouvre ? '<p><b>La vague ' + (cm.n + 1 > VAGUES_MAX ? '' : (cm.n + 1) + ' est ouverte !') + '</b>' + (cm.n + 1 > VAGUES_MAX ? '<b>La Saison des pluies est terminée !</b>' : ' Le dernier combat de la ' + cm.n + ' reste à faire quand tu veux.') + '</p>'
    : S_.vague.num > cm.n ? '<p>Vague ' + cm.n + ' déjà validée : ' + ng + ' combat' + (ng > 1 ? 's' : '') + ' gagné' + (ng > 1 ? 's' : '') + ' sur ' + COMBATS_MARE.nb + '.</p>'
    : '<p>' + ng + ' combat' + (ng > 1 ? 's' : '') + ' gagné' + (ng > 1 ? 's' : '') + ' sur ' + COMBATS_MARE.gagner + ' pour ouvrir la vague ' + (cm.n + 1) + (reste ? ' : encore ' + reste + '.' : '.') + (bossManque ? ' Le combat contre ' + leNom(MONSTRES[cm.n === VAGUES_MAX ? 'crocoBoss' : 'mereCrapaude'], true) + ' est obligatoire.' : '') + '</p>';
  const bloc = '<div class="cm-bilan"><b>' + cm.num + ' · ' + C.nom + (gagne ? ' : gagné' : fuite ? ' : abandonné' : ' : perdu') + '</b>' + (fois > 1 ? ' <small>(tentative ' + fois + ')</small>' : '') + suite +
    (gagne ? '<p>' + (G.deja ? 'Combat déjà gagné : un quart des gains de la vague.' : 'Première victoire de ce combat : la moitié des gains de la vague.') + '</p>' : '<p>Retente-le quand tu veux, ou choisis un autre combat dans la fenêtre des vagues.</p>') + '</div>';
  const art = carte.querySelector('.art'); if (art) art.insertAdjacentHTML('afterend', bloc); else carte.insertAdjacentHTML('beforeend', bloc);
}
/* LA FENETRE DES VAGUES : a la place des monstres de la vague, ses 5 combats ; le combat choisi, sa troupe, ses gains et son bouton */
{ const ouvrirVaguesCM = ouvrirVagues; ouvrirVagues = function (onglet) {
    const r = ouvrirVaguesCM.apply(this, arguments);
    try { if (modaleOuverte === 'vagues' && ouvrirVagues.onglet === 'vague' && S_.vague.num <= VAGUES_MAX && vagueEnCombats(vagueCourante())) habillerCM(); } catch (e) { console.error(e); }
    return r; }; }
function chiffresCM(C, t) { const x = chiffresMonstre(t, C.n); if (MONSTRES[t].boss) return x; let cl = 1; try { cl = (C.P.cl && C.P.cl[classeDe()]) || 1; } catch (e) { /* rien */ }
  return { pv: Math.round(x.pv * (C.P.pv || 1) * cl), coup: Math.max(1, Math.round(x.coup * (C.P.deg || 1) * cl)) }; }
function habillerCM() {
  const carte = $('carte'); if (!carte) return;
  carte.querySelectorAll('.essai-carte, .vg-boss').forEach((x) => x.remove()); /* (la serie d'essais de la 101 : remplacee par les combats ; d'abord, elle a aussi sa liste de monstres) */
  const mons = carte.querySelector('.vg-mons'), pied = carte.querySelector('.vg-pied'); if (!mons || !pied) return;
  if (S_.vague.num <= VAGUES_MAX && vagueValideeCM(S_.vague.num)) { S_.vague.num++; sauver(); ouvrirVagues('vague'); return; } /* (rattrapage : une vague deja validee s'ouvre) */
  const cur = vagueCourante(), n = vueCM(), V = etatVagueCM(n), plan = planCM(n), k = choixCM(n), C = plan[k], img = (x) => '<img src="assets/icones/' + x + '.png?v=' + VERSION_MODELES + '" alt="">';
  carte.querySelectorAll('.vg-entete .vg-piste i').forEach((i) => { const v = +i.textContent; if (!(v > 10 * VAGUES_PALIER && v <= cur)) return;
    i.dataset.cmVague = v; i.style.cursor = 'pointer'; i.className = v === n ? 'ici' : v < S_.vague.num ? 'fait' : ''; i.dataset.info = 'Vague ' + v + ' : ' + nbGagnesCM(v) + ' combat' + (nbGagnesCM(v) > 1 ? 's' : '') + ' gagné' + (nbGagnesCM(v) > 1 ? 's' : '') + ' sur ' + COMBATS_MARE.nb + '. Touche pour la voir'; });
  const h = carte.querySelector('h2'); if (h && h.firstChild && h.firstChild.nodeType === 3 && n !== cur) h.firstChild.nodeValue = 'Vague ' + n + ' (' + (n - 10 * VAGUES_PALIER) + ' sur ' + VAGUES_PALIER + ')';
  const tuiles = plan.map((X, j) => { const g = V.g[j] || 0, e = V.e[j] || 0;
    return '<button class="cm-c' + (j === k ? ' ici' : '') + (g ? ' fait' : '') + (X.boss ? ' boss' : '') + '" data-cm-choix="' + j + '" data-info="' + X.num + ' : ' + X.nom + '. Touche pour le choisir"><small>' + X.num + '</small><b>' + X.nom + '</b><span>' +
      (g ? '✓ gagné' + (g > 1 ? ' ×' + g : '') : e ? e + ' essai' + (e > 1 ? 's' : '') : X.boss && COMBATS_MARE.bossObligatoire ? 'obligatoire' : 'à faire') + '</span></button>'; }).join('');
  const ng = nbGagnesCM(n), b = kBossCM(n), bossManque = b >= 0 && COMBATS_MARE.bossObligatoire && !(V.g[b] > 0);
  const etat = S_.vague.num > n ? 'vague validée, ' + ng + ' sur ' + COMBATS_MARE.nb : ng + ' gagné' + (ng > 1 ? 's' : '') + ' sur ' + COMBATS_MARE.gagner + ' pour ouvrir la ' + (n + 1 > VAGUES_MAX ? 'suite' : n + 1) + (bossManque ? ', dont le boss' : '');
  const liste = compoCM(C).concat(C.boss ? [].concat(...(PHASES_BOSS[n] || []).map((p) => p.L)) : [].concat(...(C.P.tempsCM || []).map(compoTempsCM)));
  const temps = C.boss ? (PHASES_BOSS[n] || []).map((p) => p.nom) : (C.P.tempsCM || []).map((T) => T.nom);
  completerBestiaire(); const vus = bestiaire();
  const monstres = liste.map(([t, nb]) => { const M = MONSTRES[t], x = chiffresCM(C, t);
    return '<button class="vg-mon' + (M.boss ? ' boss' : '') + '" data-fiche-monstre="' + t + '" data-info="Sa fiche">' + (!vus[t] ? '<em class="vg-neuf">Nouveau !</em>' : '') + img(M.icone) + '<b>× ' + nb + '</b><span>' + M.nom + '</span><small>' + fmt(x.pv) + ' PV · ' + fmt(x.coup) + ' par coup</small></button>'; }).join('');
  mons.outerHTML = '<div class="cm-carte"><div class="cm-t"><b>Vague ' + n + ' : ' + COMBATS_MARE.nb + ' combats</b><span>' + etat + '</span></div>' +
    '<p class="cm-aide">Gagne ' + COMBATS_MARE.gagner + ' combats sur ' + COMBATS_MARE.nb + ' pour ouvrir la vague suivante' + (b >= 0 && COMBATS_MARE.bossObligatoire ? ', dont celui du boss' : '') + '. Chacun est dur à sa façon : joue-les dans l\'ordre que tu veux, et rejoue-les quand tu veux.</p>' +
    '<div class="cm-combats">' + tuiles + '</div><p class="cm-v"><b>' + C.num + ' · ' + C.nom + '</b> : ' + C.desc + '.' + (temps.length ? ' En ' + (temps.length + 1) + ' temps : la troupe, puis ' + temps.join(', puis ') + ', avec une pause pour manger et boire entre deux.' : '') + '</p><div class="vg-mons">' + monstres + '</div></div>';
  const f = partCM(n, k), plein = gainsVague(n, false), repos = S_.vague.repos - Date.now(), requis = niveauRequis(n), deja = (V.g[k] || 0) > 0;
  const bouton = repos > 0 && !MODE_TEST ? '<button class="btn vg-lancer" disabled>Ton perso se repose encore ' + dureeLisible(repos) + '</button>' : !MODE_TEST && niveau(S_.xp) < requis ? '<button class="btn vg-lancer" disabled>Niveau ' + requis + ' requis (tu es niveau ' + niveau(S_.xp) + ')</button>'
    : '<button class="btn kamas vg-lancer" data-lancer-vague>' + (deja ? 'Rejouer' : 'Lancer') + ' le combat ' + C.num + '</button>';
  pied.innerHTML = img('kama') + '<span class="vg-gain">' + fmt(Math.round(plein.kamas * f)) + ' kamas et ' + xpReel(Math.round(plein.xp * f), true) + ' XP à gagner<small>' + (deja ? 'Combat déjà gagné : un quart des gains de la vague.' : 'Première victoire : la moitié des gains de la vague.') + '</small></span>' + bouton;
}
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-cm-choix], [data-cm-vague]'); if (!b) return;
  if (b.hasAttribute('data-cm-choix')) { etatVagueCM(vueCM()).choix = +b.dataset.cmChoix; ouvrirVagues('vague'); return; }
  etatCM().vue = +b.dataset.cmVague; ouvrirVagues('vague');
});
document.head.insertAdjacentHTML('beforeend', '<style>' +
  '.cm-carte { margin: 6px 0 8px; } .cm-t { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 4px 10px; font: 700 .78rem var(--f-texte); color: #a9adb5; } .cm-t b { font: 400 1.05rem var(--f-titre); color: #e8eaed; }' +
  '.cm-aide { font-size: .74rem; font-weight: 600; margin: 2px 0 6px; } .cm-combats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 5px; margin: 4px 0 6px; }' +
  '.cm-c { display: grid; justify-items: center; align-content: start; gap: 2px; padding: 6px 3px; border: 2px solid #43464e; border-radius: 12px; background: #2b2d31; color: #e8eaed; font: 700 .7rem/1.15 var(--f-texte); text-align: center; cursor: pointer; min-width: 0; overflow-wrap: anywhere; }' +
  '.cm-c small { font: 400 .82rem var(--f-titre); color: #a9adb5; } .cm-c span { font-size: .62rem; color: #a9adb5; } .cm-c:hover { transform: translateY(-1px); box-shadow: 0 3px 0 var(--bord); }' +
  '.cm-c.fait { border-color: var(--vert); background: #23352a; } .cm-c.fait span { color: #8fe0a0; } .cm-c.boss { background: #3d3222; border-color: #8a6414; } .cm-c.boss.fait { background: #2f3a22; border-color: var(--vert); }' +
  '.cm-c.ici { border-color: var(--or); box-shadow: 0 0 0 2px rgba(242, 210, 122, .35); } .cm-c.ici small { color: var(--or); } .cm-v { font-size: .78rem; font-weight: 600; margin: 2px 0 6px; }' +
  '.cm-bilan { margin: 8px 0; padding: 8px 10px; border-radius: 12px; background: #26272b; border: 2px solid #43464e; font-size: .8rem; } .cm-bilan p { margin: 4px 0 0; font-weight: 600; }' +
  '@media (max-width: 520px) { .cm-combats { grid-template-columns: repeat(3, minmax(0, 1fr)); } }</style>');
/* PLUS D'ETOURDISSEMENTS A LA CHAINE (26/11/2026, retours de la 101.7 : « IMPOSSIBLE ca stun de fou », Madazezette en Iop) : dans un combat de vague,
   quand une entrave lache le perso (colle, assomme, langue du Claquelangue), il est libre COMBATS_MARE.immu secondes : rien ne le colle, ne l'assomme,
   ne l'agrippe ni ne l'attrape. Les ralentissements (vase, lenteur) restent. Les reglages passent par des accesseurs sur le combat : tous les sorts sont couverts */
function armerAntiChaine(c) {
  if (!c || c.antiChaine) return; c.antiChaine = true;
  ['colle', 'assomme', 'agrippe'].forEach((k) => { let v = c[k] || 0;
    Object.defineProperty(c, k, { configurable: true, enumerable: true, get: () => v, set: (x) => { if (x > 0 && x > v && c.immuCtrl > 0 && c.deroute == null && !c.fin) { refuseCM(c); return; } v = x; } }); });
}
function refuseCM(c) {
  const t = Date.now(); if ((c.refuseT || 0) > t || !paysanMesh) return; c.refuseT = t + 1000; const q = paysanMesh.position.clone(); q.y += 2.1; chiffre('Libre !', q, 'vol');
  if (!c.libreVu) { c.libreVu = true; toast('Après une entrave, tu es libre ' + COMBATS_MARE.immu + ' s : rien ne peut t\'attraper ni t\'étourdir.', 'or'); }
}
function tickAntiChaine(dt) {
  const c = combat; if (!c || c.fin || !combatCMde(c)) return; armerAntiChaine(c);
  if (c.immuCtrl > 0) c.immuCtrl -= dt;
  const pris = c.colle > 0 || c.assomme > 0; if (c.ctrlAvant && !pris) c.immuCtrl = COMBATS_MARE.immu; c.ctrlAvant = pris;
}
{ const majCombatCM = majCombat; majCombat = function (dt, s) { const r = majCombatCM.apply(this, arguments); try { tickAntiChaine(dt); } catch (e) { /* rien */ } return r; }; }
{ const nouveauCombatCM = nouveauCombat; nouveauCombat = function () { const c = nouveauCombatCM.apply(this, arguments); try { if (combatCMde(c)) armerAntiChaine(c); } catch (e) { /* rien */ } return c; }; }
/* la langue du Claquelangue : pendant la liberte, elle manque le perso (sa zone ne le voit pas), au lieu de le tirer contre le monstre */
let langueCM = false;
{ const i = CAPACITES.indexOf(capLianes); if (i >= 0) { const f = CAPACITES[i]; CAPACITES[i] = function () { langueCM = !!combatCMde(combat); try { return f.apply(this, arguments); } finally { langueCM = false; } }; } }
{ const zoneDangerCM = zoneDanger; zoneDanger = function (o) {
    if (langueCM && o && typeof o.effet === 'function') { const ef = o.effet; o.effet = function (d) { const c = combat;
        if (c && !c.fin && c.immuCtrl > 0 && paysanMesh) { const p = paysanMesh.position, x = p.x, z = p.z; if (dansDanger(d, x, z)) refuseCM(c); p.x += 1e4; p.z += 1e4; try { return ef.apply(this, arguments); } finally { p.x = x; p.z = z; } }
        return ef.apply(this, arguments); }; }
    return zoneDangerCM.apply(this, arguments); }; }
