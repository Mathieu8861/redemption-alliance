'use strict';
/* L'EVEIL DES LEGENDAIRES ET LE CONCASSEUR (18/11/2026, Mathieu : « quelque chose qui permet de faire lvl up un item légendaire en utilisant un autre item
   légendaire (qu'on détruit) », puis « et qu'on puisse concasser des items aussi pour gagner des runes » ; règles au formulaire) :
   - L'EVEIL : on sacrifie un doublon exact du légendaire (même pièce, même boss, même emplacement). Chaque fusion lui donne 10 niveaux et le fait passer au
     palier suivant : la coiffe du Craqueleur Légendaire (niveau 40) passe au niveau 50, avec les stats d'une coiffe du palier de Crocabulia, puis du Wa
     Wabbit, etc. Elle garde ses lignes de stats, proportionnées au palier atteint (et son jet), sans dépasser le dernier palier ouvert (aujourd'hui le 10,
     niveau 100, celui des légendaires du Chêne Mou). S_.eveils : { exemplaire: nombre de fusions } ; obj() applique l'éveil (03-equipements.js).
   - LE CONCASSEUR : une pièce de niveau 60 ou plus se détruit contre des runes. Normale : 1 chance sur 40 d'une rune de forgemagie, 1 sur 100 d'une rune
     parfaite. Rare : une rune de forgemagie à coup sûr, et 1 chance sur 5 d'une parfaite. Les légendaires ne se concassent pas (elles servent à l'éveil).
   - OU : de nouveaux bâtiments débloqués au niveau 100 (à concevoir) ; en attendant, en version dev, depuis l'atelier de forgemagie, dans le mode test. */
const NIV_EVEIL = 100, NIV_CONCASSE = 60;
const CONCASSE = { normale: { forge: 1 / 40, parfaite: 1 / 100 }, rare: { forge: 1, parfaite: 1 / 5 } };
const eveilDev = () => !!MODE_TEST; /* (version dev : seulement dans le mode test de Mathieu, tant que les bâtiments ne sont pas faits) */
const rangLeg = (o) => { const L = o && LEGENDAIRES.find((x) => x.cle === o.leg); return L ? (L.rang != null ? L.rang : o.pano) : null; };
const rangMaxLeg = () => Math.max(0, Math.min(VALEURS.vita.length - 1, Math.ceil(vaguesOuvertes() / VAGUES_PALIER) - 1)); /* (le dernier palier ouvert : 10, soit le rang 9) */
const valeurRang = (c, k, arme) => (VALEURS[c] ? VALEURS[c][Math.min(k, VALEURS[c].length - 1)] * nerfP10(k >= 9 ? 91 : 0, c) : null);
function eveillerObjet(o, n) { /* o : la pièce avec son jet ; n : ses fusions. Ses stats passent du palier de son boss au palier atteint, chaque ligne gardée */
  const k0 = rangLeg(o); if (k0 == null || !(n > 0)) return o;
  const k1 = Math.min(rangMaxLeg(), k0 + n), pas = k1 - k0; if (pas <= 0) return o;
  const stats = Object.fromEntries(Object.entries(o.stats).map(([c, v]) => { const a = valeurRang(c, k0, o.arme), b = valeurRang(c, k1, o.arme); return [c, a && b ? Math.round(v * b / a) : v]; }));
  return Object.assign({}, o, { stats, niv: Math.min(NIV_EVEIL, o.niv + 10 * pas), eveil: pas, nom: o.nom + ' +' + pas });
}
const fusionsMax = (k) => { const o = objBrut(k), r = rangLeg(o); return r == null ? 0 : Math.max(0, rangMaxLeg() - r); };
const eveilDe = (k) => (S_.eveils && S_.eveils[k]) || 0;
const exemplairesLeg = () => { /* chaque légendaire possédé, porté ou dans le sac (un exemplaire par entrée ; un sac à 2 du même exemplaire compte pour 2) */
  const L = []; Object.values(S_.equip || {}).forEach((k) => { if (k && objBrut(k) && objBrut(k).leg) L.push({ k, porte: true }); });
  Object.entries(S_.sac || {}).forEach(([k, n]) => { const o = objBrut(k); if (o && o.leg && rangLeg(o) != null) for (let i = 0; i < n; i++) L.push({ k, porte: false }); }); return L; };
function ouvrirEveil() {
  const groupes = {}; exemplairesLeg().forEach((x) => { const b = baseObjet(x.k); (groupes[b] = groupes[b] || []).push(x); });
  const lignes = Object.entries(groupes).map(([b, L]) => {
    /* la pièce à monter : celle qui est portée, sinon la plus éveillée, puis le meilleur jet ; le sacrifice : un autre exemplaire, le moins éveillé, au moins bon jet */
    L.sort((x, y) => (y.porte ? 1 : 0) - (x.porte ? 1 : 0) || eveilDe(y.k) - eveilDe(x.k) || qualiteJet(y.k) - qualiteJet(x.k));
    const cible = L[0], autres = L.slice(1).filter((x) => !x.porte), sac = autres.sort((x, y) => eveilDe(x.k) - eveilDe(y.k) || qualiteJet(x.k) - qualiteJet(y.k))[0];
    const o = obj(cible.k), reste = fusionsMax(cible.k) - eveilDe(cible.k), apres = reste > 0 ? eveillerObjet(objBrut(cible.k), eveilDe(cible.k) + 1) : null;
    const st = (s) => statsTexte(s);
    return '<div class="art">' + icoObjet(cible.k) + '<div><b>✦ ' + o.nom + (cible.porte ? ' <span class="puce bonne">portée</span>' : '') + '</b><div class="desc">Niveau ' + o.niv + (eveilDe(cible.k) ? ', éveillée ' + eveilDe(cible.k) + ' fois' : '') + '</div><div class="puces">' + st(o.stats) + '</div>' +
      (apres ? '<div class="desc" style="margin-top:4px">Après la fusion : <b>niveau ' + apres.niv + '</b></div><div class="puces">' + st(apres.stats) + '</div>' : '<div class="desc">' + (reste <= 0 ? 'Au plus haut pour le moment : elle a atteint le dernier palier ouvert.' : '') + '</div>') +
      '</div><div class="act">' + (apres ? (sac ? '<button class="btn kamas" data-eveil="' + cible.k + '|' + sac.k + '">Fusionner</button><small>' + (L.length - 1) + ' doublon' + (L.length > 2 ? 's' : '') + '</small>' : '<small>Il faut un doublon de cette pièce dans ton sac.</small>') : '<span class="cadenas">✓ max</span>') + '</div></div>';
  });
  ouvrirModale('eveil', entete('L\'éveil des légendaires') + '<p class="hdv-aide">Sacrifie un <b>doublon exact</b> d\'un légendaire (même pièce, même boss) pour le faire monter : <b>+10 niveaux</b> à chaque fusion, et ses stats passent à celles du palier suivant, en gardant les mêmes lignes et son jet. Pas au-delà du dernier palier ouvert (niveau ' + (10 * (rangMaxLeg() + 1)) + '). Le doublon est détruit.</p>' +
    (lignes.length ? lignes.join('') : '<p class="hdv-aide">Tu n\'as aucune pièce légendaire pour l\'instant.</p>') + (eveilDev() ? '<div class="act-bas"><small>Version dev (mode test)</small><button class="btn discret" data-ouvrir-concasseur>Le concasseur</button></div>' : ''));
}
const tableEveil = (a, b) => { const u = (c, v) => '+' + v + (CARACS[c] && CARACS[c][1].startsWith(' %') ? ' %' : ''); /* (avant / après, une ligne par stat) */
  return '<table class="eveil-tab"><tr><th></th><th>Avant</th><th>Après</th></tr><tr><td>Niveau</td><td>' + a.niv + '</td><td>' + b.niv + '</td></tr>' +
    Object.keys(b.stats).map((c) => '<tr><td>' + (CARACS[c] ? CARACS[c][2] + CARACS[c][0] : c) + '</td><td>' + u(c, a.stats[c]) + '</td><td>' + u(c, b.stats[c]) + '</td></tr>').join('') + '</table>'; };
function fusionnerLeg(cible, sacrifice, confirme) {
  if (combat) { toast('Pas pendant un combat.'); return; }
  const o = objBrut(cible), s = objBrut(sacrifice); if (!o || !s || baseObjet(cible) !== baseObjet(sacrifice) || !o.leg) return;
  const porte = (x) => Object.values(S_.equip || {}).includes(x), dispo = (S_.sac[sacrifice] || 0) - (cible === sacrifice && !porte(cible) ? 1 : 0); /* (un doublon dans le sac, en plus de la pièce qui monte) */
  if (!(dispo > 0)) { toast('Ce doublon n\'est plus dans ton sac.'); return; }
  if (eveilDe(cible) >= fusionsMax(cible)) { toast('Cette pièce est déjà au plus haut pour le moment.'); return; }
  const avant = obj(cible), apres = eveillerObjet(o, eveilDe(cible) + 1);
  if (!confirme) { ouvrirModale('eveil', entete('Fusionner ?') + '<div class="confirme"><div class="gros">' + icoObjet(cible) + '</div><p><b>' + avant.nom + '</b> passe au palier suivant.</p>' + tableEveil(avant, apres) +
    '<p><b>Le doublon est détruit</b>' + (eveilDe(sacrifice) ? ' (et ses ' + eveilDe(sacrifice) + ' éveils avec lui)' : '') + '. Tu ne pourras pas revenir en arrière.</p><div class="boutons"><button class="btn discret" data-eveil-retour>Non</button><button class="btn kamas" data-eveil-ok="' + cible + '|' + sacrifice + '">Oui, fusionner</button></div></div>'); return; }
  let k = cible; /* (une clé partagée par plusieurs exemplaires, vieille sauvegarde : on sort celui qui monte sous sa propre clé, à son jet) */
  if (cible === sacrifice || !(S_.jets && S_.jets[k])) { S_.jets = S_.jets || {}; S_.nInst = (S_.nInst || 0) + 1; const nk = baseObjet(k) + '~' + S_.nInst.toString(36); S_.jets[nk] = Object.assign({}, o.stats); if (eveilDe(k)) (S_.eveils = S_.eveils || {})[nk] = eveilDe(k);
    const emp = Object.keys(S_.equip).find((e) => S_.equip[e] === k); if (emp) S_.equip[emp] = nk; else { S_.sac[k]--; if (!S_.sac[k]) delete S_.sac[k]; S_.sac[nk] = 1; } k = nk; }
  S_.sac[sacrifice]--; if (!S_.sac[sacrifice]) { delete S_.sac[sacrifice]; if (!porte(sacrifice)) { if (S_.jets) delete S_.jets[sacrifice]; if (S_.eveils) delete S_.eveils[sacrifice]; } }
  (S_.eveils = S_.eveils || {})[k] = eveilDe(k) + 1; compter('eveils'); son('niveau'); confettis(40); if (Object.values(S_.equip).includes(k)) rafraichirTenue();
  toast(obj(k).nom + ' s\'éveille : niveau ' + obj(k).niv + ' !', 'or'); sauver(); rendreHaut(); ouvrirEveil();
}
const concassable = (k) => { const o = objBrut(k); return !!o && !o.leg && o.niv >= NIV_CONCASSE && !Object.values(S_.equip || {}).includes(k); };
function ouvrirConcasseur() {
  const L = Object.keys(S_.sac || {}).filter(concassable).sort((a, b) => (objBrut(b).rare ? 1 : 0) - (objBrut(a).rare ? 1 : 0) || objBrut(b).niv - objBrut(a).niv), nr = runes();
  const ligne = (k) => { const o = objBrut(k), T = o.rare ? CONCASSE.rare : CONCASSE.normale, n = S_.sac[k];
    return '<div class="art">' + icoObjet(k) + '<div><b>' + (o.rare ? '★ ' : '') + o.nom + (n > 1 ? ' <span class="puce">×' + n + '</span>' : '') + '</b><div class="desc">Niveau ' + o.niv + ' · ' + (o.rare ? 'une rune de forgemagie à coup sûr, 1 chance sur 5 d\'une rune parfaite' : '1 chance sur 40 d\'une rune de forgemagie, 1 sur 100 d\'une rune parfaite') + '</div></div>' +
      '<div class="act"><button class="btn ' + (o.rare ? 'kamas' : 'discret') + '" data-concasser="' + k + '">Concasser</button></div></div>'; };
  const normales = L.filter((k) => !objBrut(k).rare), nbN = normales.reduce((t, k) => t + S_.sac[k], 0);
  ouvrirModale('concasseur', entete('Le concasseur') + '<p class="hdv-aide">Une pièce de <b>niveau ' + NIV_CONCASSE + ' ou plus</b> se broie contre des runes. <b>Normale</b> : 1 chance sur 40 d\'une rune de forgemagie et 1 sur 100 d\'une rune parfaite. <b>Rare</b> : une rune de forgemagie à coup sûr, et 1 chance sur 5 d\'une parfaite. La pièce est détruite. Les légendaires ne se concassent pas : elles servent à l\'éveil. Les pièces portées ne sont pas proposées.</p>' +
    '<div class="forge-stock">' + Object.keys(RUNES).map((t) => '<span class="puce"><img src="assets/icones/rune-' + t + '.png?v=' + VERSION_MODELES + '" alt=""><b>' + (nr[t] || 0) + '</b> ' + ((nr[t] || 0) > 1 ? RUNES[t].court : RUNES[t].nom).toLowerCase() + '</span>').join('') + '</div>' + /* (comme à la forgemagie) */
    (nbN > 1 ? '<div class="act-bas" style="margin:6px 0"><small>' + nbN + ' pièces normales</small><button class="btn discret" data-concasser-tout>Concasser toutes les normales</button></div>' : '') +
    (L.length ? '<div class="hdv-section">Tes pièces de niveau ' + NIV_CONCASSE + ' et plus</div>' + L.map(ligne).join('') : '<p class="hdv-aide">Aucune pièce de niveau ' + NIV_CONCASSE + ' ou plus dans ton sac.</p>') +
    (eveilDev() ? '<div class="act-bas"><small>Version dev (mode test)</small><button class="btn discret" data-ouvrir-eveil>L\'éveil des légendaires</button></div>' : ''));
}
function concasser(liste, confirme) {
  if (combat) { toast('Pas pendant un combat.'); return; }
  const L = liste.filter(concassable); if (!L.length) return; const nb = L.reduce((t, k) => t + (S_.sac[k] || 0), 0), rares = L.filter((k) => objBrut(k).rare).length;
  if (!confirme && (rares || nb > 1)) { ouvrirModale('concasseur', entete('Concasser ?') + '<div class="confirme"><p>' + (nb > 1 ? '<b>' + nb + ' pièces</b> seront détruites' : '<b>' + objBrut(L[0]).nom + '</b> sera détruite') + ' contre des runes. Tu ne pourras pas revenir en arrière.</p><div class="boutons"><button class="btn discret" data-ouvrir-concasseur>Non</button><button class="btn kamas" data-concasser-ok="' + L.join(',') + '">Oui, concasser</button></div></div>'); return; }
  const nr = runes(); let f = 0, p = 0;
  L.forEach((k) => { const o = objBrut(k), T = o.rare ? CONCASSE.rare : CONCASSE.normale; for (let i = S_.sac[k] || 0; i > 0; i--) { if (Math.random() < T.forge) f++; if (Math.random() < T.parfaite) p++; }
    delete S_.sac[k]; if (S_.jets) delete S_.jets[k]; if (S_.eveils) delete S_.eveils[k]; });
  nr.forge = (nr.forge || 0) + f; nr.parfaite = (nr.parfaite || 0) + p; compter('concasses', nb); son(f || p ? 'niveau' : 'kamas'); if (p) confettis(40);
  toast((nb > 1 ? nb + ' pièces concassées' : 'Pièce concassée') + ' : ' + (f || p ? (f ? '+' + f + ' rune' + (f > 1 ? 's' : '') + ' de forgemagie' : '') + (f && p ? ', ' : '') + (p ? '+' + p + ' rune' + (p > 1 ? 's' : '') + ' parfaite' + (p > 1 ? 's' : '') : '') : 'aucune rune cette fois.'), f || p ? 'or' : ''); sauver(); rendreHaut(); ouvrirConcasseur();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-eveil],[data-eveil-ok],[data-eveil-retour],[data-concasser],[data-concasser-ok],[data-concasser-tout],[data-ouvrir-eveil],[data-ouvrir-concasseur]'); if (!b) return;
  if (b.hasAttribute('data-ouvrir-eveil') || b.hasAttribute('data-eveil-retour')) { ouvrirEveil(); return; }
  if (b.hasAttribute('data-ouvrir-concasseur')) { ouvrirConcasseur(); return; }
  if (b.dataset.eveil) { const [c, s] = b.dataset.eveil.split('|'); fusionnerLeg(c, s, false); return; }
  if (b.dataset.eveilOk) { const [c, s] = b.dataset.eveilOk.split('|'); fusionnerLeg(c, s, true); return; }
  if (b.dataset.concasser) { concasser([b.dataset.concasser], false); return; }
  if (b.hasAttribute('data-concasser-tout')) { concasser(Object.keys(S_.sac || {}).filter((k) => concassable(k) && !objBrut(k).rare), false); return; }
  if (b.dataset.concasserOk) { concasser(b.dataset.concasserOk.split(','), true); return; }
});
