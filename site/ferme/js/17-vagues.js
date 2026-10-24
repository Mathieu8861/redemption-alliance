'use strict';
/* ===================== LES VAGUES DE MONSTRES =====================
   C'est le joueur qui lance la vague, quand il est pret (la fiche dit qui arrive, le niveau conseille et les gains).
   Palier 1 Amakna : 10 vagues, le Bouftou Royal a la 10e. Les Tofus vont picorer les cultures (1 recolte volee toutes les 5 s),
   les Chafers et le Royal foncent sur le perso. Le perso frappe tout seul le monstre cible (on touche un monstre pour le cibler,
   une case pour se deplacer), son sort de classe se recharge, l'arbalete de la grange tire aussi.
   Gagne : kamas et experience, la vague suivante s'ouvre. Perdu : une culture saccagee et 1 h de repos avant de relancer. */
const VAGUES_PALIER = 10, REPOS_VAGUE = 3 * MIN, RECHARGE_SORT = 8;
/* LES POTS DE GELEE (13/10/2026, idee de Mathieu) : la vie ne remonte plus d'un coup entre les vagues (S_.pv garde ce qui reste de la precedente ; absent :
   vie pleine). On se soigne avec des pots, achetes a l'HDV (categorie Gelees), bus depuis leur fenetre (le bouton potion a cote de la vie, ou en touchant la vie :
   « j'aime pas que ce soit associe a la grange », Mathieu) ou depuis la fenetre des vagues, jamais en combat. Sans pot, on attend : la vie remonte doucement (REGEN_PV). Le filet de securite : 3 petits pots au depart, et apres une defaite le perso revient a 30 % de vie. Les pots de la Geliere viendront ensuite.
   Prix : un multiple du niveau (24 par niveau pour le petit pot). Triples le 13/10/2026 : « il faut encore augmenter, c'est trop facile de faire des sous ; au pire ca
   les ralentit, ils doivent farmer des kamas avec les recoltes pour repartir en vague, c'est ca l'idee » (Mathieu) : soigner une vague coute environ la moitie de ce qu'elle rapporte. Icones : la fiole carree (assets/icones/pot-*.png) */
const POTS = {
  petit: { nom: 'Petit pot de gelée Bleue', court: 'Petits pots', soin: 0.25, prix: 24, effet: '+25 % de vie', desc: 'Le soin de base, entre deux vagues.' },
  grand: { nom: 'Grand pot de gelée Bleue', court: 'Grands pots', soin: 0.6, prix: 54, effet: '+60 % de vie', desc: 'Pour repartir presque neuf après une vague difficile.' },
  menthe: { nom: 'Pot de gelée Menthe', court: 'Pots de Menthe', soin: 0.25, prix: 42, menthe: true, effet: '+25 % de vie, puis 1 % toutes les 4 s pendant la vague', desc: 'À boire juste avant de lancer la vague : il continue de te soigner pendant le combat.' },
  fraise: { nom: 'Pot de gelée Fraise', court: 'Pots de Fraise', soin: 0.4, effet: '+40 % de vie', desc: 'Fait à ta Gelière par tes Gelées Fraise.', geliere: true },
  citron: { nom: 'Pot de gelée Citron', court: 'Pots de Citron', soin: 0.25, citron: true, effet: '+25 % de vie, et ton perso court 30 % plus vite pendant la vague', desc: 'Fait à ta Gelière. À boire juste avant de lancer la vague.', geliere: true },
  royale: { nom: 'Pot de gelée Royale', court: 'Pots de Royale', soin: 1, agi: 20, effet: 'Toute ta vie, et +20 Agilité pendant la vague', desc: 'Le plus rare : seule la Gelée Royale le fait. Toute ta vie, et +20 Agilité (des coups plus rapides) pendant la prochaine vague.', geliere: true }
};
const BREF_POT = { petit: '+25 % de vie', grand: '+60 % de vie', menthe: '+25 % de vie, puis 1 % toutes les 4 s en vague', fraise: '+40 % de vie', citron: '+25 % de vie, et tu cours 30 % plus vite', royale: 'toute ta vie, et +20 Agilité en vague' };
const POTS_HDV = ['petit', 'grand', 'menthe'], VIE_APRES_DEFAITE = 0.3, POTS_DEPART = 3, REGEN_MENTHE = 0.01 / 4; /* (1 % de la vie toutes les 4 s ; 1 % par seconde avant le 24/10/2026, « les potions Menthe c'est clairement trop broken » : a la vague 70, Moon soignait 22 PV/s pour 19 PV/s recus, il ne descendait presque plus) */
/* LA VIE REMONTE DOUCEMENT (« faudrait faire regagner un PV toutes les x minutes, genre au debut si t'as pas de potion bah tu attends », Mathieu, 13/10/2026) :
   « met pas 1 %, mais 1 PV par minute ; et une vraie minute, sinon les gelees perdent tout leur interet » (Mathieu, 13/10/2026) : 1 PV par VRAIE minute,
   quelle que soit la vitesse du jeu (regenVie recoit du temps reel : avancer divise par la vitesse du curseur). Les pots restent le vrai moyen de se soigner.
   Hors combat seulement. Sans toi (pause, absence), elle remonte au meme rythme, pas ralentie comme les cultures : attendre reste attendre. */
const REGEN_PV = 1, REGEN_PAS = 60000;
function regenVie(dtReel) { if (!S_ || S_.pv == null || combat || !S_.perso || !(dtReel > 0)) return; const max = statsPerso().pvMax; S_.pv = Math.min(max, S_.pv + REGEN_PV * dtReel / REGEN_PAS); if (S_.pv >= max) S_.pv = null; }
const totalPots = () => Object.keys(POTS).reduce((t, k) => t + ((S_.pots && S_.pots[k]) || 0), 0);
const citronPret = () => { const r = !!S_.citron; S_.citron = false; return r; };
const royalePrete = () => { const r = S_.royale || 0; S_.royale = 0; return r; }; /* (la Royale bue avant la vague : +20 Agilite pendant celle-ci) */ /* (le Citron bu avant la vague : le perso court plus vite pendant celle-ci) */
const prixPot = (t) => Math.max(10, POTS[t].prix * niveau(S_.xp));
const vieActuelle = () => { const max = statsPerso().pvMax; return S_.pv == null ? max : Math.max(0, Math.min(max, S_.pv)); };
const menthePrete = () => { const r = S_.menthe ? REGEN_MENTHE : 0; S_.menthe = false; return r; }; /* (la Menthe bue avant la vague : elle soigne pendant celle-ci) */
function boirePot(t) {
  const P = POTS[t]; S_.pots = S_.pots || {}; if (!P || !(S_.pots[t] > 0) || combat) return;
  const max = statsPerso().pvMax, avant = vieActuelle();
  if (P.menthe && S_.menthe) { toast('Tu as déjà bu un pot de Menthe pour la prochaine vague.'); return; }
  if (P.citron && S_.citron) { toast('Tu as déjà bu un pot de Citron pour la prochaine vague.'); return; }
  if (P.agi && S_.royale) { toast('Tu as déjà bu un pot de Royale pour la prochaine vague.'); return; }
  if (avant >= max && !P.menthe && !P.citron && !P.agi) { toast('Ta vie est déjà pleine.'); return; }
  S_.pots[t]--; son('boire'); S_.pv = Math.min(max, Math.round(avant + max * P.soin)); if (P.menthe) S_.menthe = true; if (P.citron) S_.citron = true; if (P.agi) S_.royale = P.agi; compter('pots');
  toast('Glou glou : ' + Math.round(100 * avant / max) + ' % de vie, puis ' + Math.round(100 * S_.pv / max) + ' %' + (P.menthe ? '. La Menthe te soignera pendant la vague.' : P.citron ? '. Le Citron te fera courir plus vite pendant la vague.' : P.agi ? '. La Royale te donnera +' + P.agi + ' Agilité pendant la vague.' : '.'), 'or');
  rendreGrange(); rendreHaut(); sauver();
  if (modaleOuverte === 'vagues') ouvrirVagues(); else if (modaleOuverte === 'pots') ouvrirPots(); else if (modaleOuverte === 'hdv') ouvrirHdv('acheter');
}
/* l'alerte de la fenetre des vagues (« ok », Mathieu) : avec combien de vie tu pars, et tes pots */
/* la pastille de vie du haut, toujours visible (« il faudrait la voir en tout temps », Mathieu, 13/10/2026) ; en combat, elle suit la vie du combat */
function majVieHaut() {
  const b = $('b-vie'); if (!b || !S_ || !S_.perso) return; const max = combat ? combat.pvMax : statsPerso().pvMax, pv = combat ? Math.max(0, combat.pv) : vieActuelle(), pc = Math.round(100 * pv / max);
  if (!b._pret) { b.querySelector('.coeur').innerHTML = picto('vita'); b._pret = true; }
  const w = pc + '%'; if (b._w !== w) { b._w = w; $('vie').style.width = w; }
  const t = Math.ceil(pv) + ' / ' + max + ' PV'; if (b._t !== t) { b._t = t; $('vie-txt').textContent = t; }
  b.classList.toggle('moyen', pc < 60 && pc >= 40); b.classList.toggle('bas', pc < 40);
  const bp = $('b-pots'), np = totalPots(), cle = np + '|' + (pc < 40 && !combat); if (bp && bp._c !== cle) { bp._c = cle; $('pots-nb').textContent = np; bp.classList.toggle('vide', !np); bp.classList.toggle('appel', np > 0 && pc < 40 && !combat); }
}
function blocVie() {
  const max = statsPerso().pvMax, pv = vieActuelle(); S_.pots = S_.pots || {}; if (pv >= max && !S_.menthe) return '';
  const pc = Math.round(100 * pv / max), dispo = Object.keys(POTS).filter((t) => S_.pots[t] > 0);
  const boutons = dispo.length ? dispo.map((t) => '<button class="btn mini-pot" data-boire="' + t + '" data-info="' + POTS[t].nom + ' : ' + POTS[t].effet + '"><img src="assets/icones/pot-' + t + '.png?v=' + VERSION_MODELES + '" alt="' + POTS[t].nom + '"><span>' + S_.pots[t] + '</span></button>').join('')
    : '<button class="btn kamas" data-hdv-cat="gelees">Acheter des pots</button>';
  return '<div class="vie-alerte' + (pc < 40 ? ' bas' : '') + '"><div><b>' + (pv >= max ? 'Ta vie est pleine' : 'Tu pars avec ' + pc + ' % de vie') + '</b><div class="pvb"><i style="width:' + pc + '%"></i></div><small>' + Math.round(pv) + ' / ' + max + ' PV. Elle remonte doucement toute seule, un pot va plus vite. ' +
    (S_.menthe ? 'La Menthe te soignera pendant la vague.' : dispo.length ? 'Bois un pot :' : 'Tu n\'as plus de pot.') + '</small></div><div class="va-pots">' + boutons + '</div></div>';
}
/* LA FENETRE DES POTS : la vie, le temps qu'il faut pour qu'elle remonte seule, et chaque pot (a boire, ou a acheter s'il n'y en a plus) */
function ouvrirPots() {
  const max = statsPerso().pvMax, pv = vieActuelle(), pc = Math.round(100 * pv / max), plein = pv >= max; S_.pots = S_.pots || {};
  const seule = plein ? 'Ta vie est pleine.' : 'Elle remonte doucement toute seule : ' + REGEN_PV + ' PV par minute, pleine dans ' + dureeLisible((max - pv) / REGEN_PV * REGEN_PAS) + '. Un pot fait gagner ce temps.';
  const tete = '<div class="vie-alerte' + (pc < 40 ? ' bas' : '') + '"><div><b>' + (plein ? 'Ta vie est pleine' : 'Ta vie : ' + pc + ' %') + '</b><div class="pvb"><i style="width:' + pc + '%"></i></div><small>' + Math.floor(pv) + ' / ' + max + ' PV. ' + seule + (S_.menthe ? ' La Menthe est bue : elle te soignera pendant la prochaine vague.' : '') + (S_.royale ? ' La Royale est bue : +' + S_.royale + ' Agilité pendant la prochaine vague.' : '') + (S_.citron ? ' Le Citron est bu : tu courras plus vite pendant la prochaine vague.' : '') + '</small></div></div>';
  const types = POTS_HDV.concat(Object.keys(POTS).filter((t) => POTS[t].geliere && ((S_.pots[t] || 0) > 0 || niv('geliere'))));
  const lignes = types.map((t) => { const n = S_.pots[t] || 0, non = (plein && !POTS[t].menthe && !POTS[t].citron && !POTS[t].agi) || (POTS[t].menthe && S_.menthe) || (POTS[t].citron && S_.citron) || (POTS[t].agi && S_.royale);
    return '<div class="art' + (n ? '' : ' pas-eu') + '">' + ico('pot-' + t) + '<div><b>' + POTS[t].nom + ' ×' + n + '</b><div class="puces"><span class="puce bonne">' + BREF_POT[t] + '</span></div><div class="desc">' + POTS[t].desc + '</div></div><div class="act">' +
      (n ? '<button class="btn kamas" data-boire="' + t + '"' + (non ? ' disabled' : '') + '>Boire</button>' : POTS[t].geliere ? '<button class="btn discret" data-geliere>Gelière</button>' : '<button class="btn discret" data-hdv-cat="gelees">Acheter</button>') + '</div></div>'; }).join('');
  ouvrirModale('pots', entete('Pots de gelée') + tete + lignes + '<div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:10px">' + (niv('geliere') ? '<button class="btn discret" data-geliere>Ta Gelière</button>' : '') + '<button class="btn kamas" data-hdv-cat="gelees">Acheter des pots à l\'HDV</button></div>');
}
