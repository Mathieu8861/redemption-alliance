'use strict';
/* LES DEFIS DU JOUR SELON LE NIVEAU (27/11/2026, Mathieu, niveau 100 devant « Arrose 40 semis, +2 862 kamas » : « il faudrait adapter un peu plus les recompenses
   en fonction du niveau du joueur, mais egalement les missions ; et plus les missions sont compliquees, plus la recompense peut etre interessante » ; ses choix
   au formulaire) :
   - trois defis par jour, un par rang : un defi de FERME (facile), un defi de COMBAT (moyen), un EXPLOIT (difficile, des le niveau 30). Un rang qui n'a rien a
     proposer au joueur (pas encore de vagues, pas de boss battu) prend un defi du rang d'en dessous ;
   - les kamas en part d'une vague de son niveau (vagueDeNiveau) : ferme 30 % (comme avant), combat 75 %, exploit 200 % ; au niveau 100 : 2 862, 7 155, 19 080 ;
     l'XP dans les memes proportions ; pas de bonus en plus sur l'exploit (« rien de plus ») ;
   - le coffre du jour (les trois reussis), dicte par Mathieu : 150 % d'une vague de son niveau, 60 % de chance d'une piece de son palier, 5 % d'une piece rare
     de son palier, et une chance sur deux de 2 ressources au hasard de son palier. La Prospection ne joue pas (jamais sur un coffre).
   VERSION DEV (« MAJ au palier 11 ca, l'applique pas de suite, on le sortira en meme temps que tout le reste », Mathieu) : dans le mode test, et pour tous a la
   sortie du palier 11 (p11Ouvert). Les compteurs des nouveaux defis (revanches, vagues tenues a l'Arene, voleurs abattus) tournent deja pour tous, sans rien
   afficher. Les defis d'avant restent dans 16-progression.js, intacts. */
const DEFIS_RANGS = { ferme: { nom: 'Ferme', part: 0.3, teinte: '#5fae3a' }, combat: { nom: 'Combat', part: 0.75, teinte: '#f08a24' }, exploit: { nom: 'Exploit', part: 2, teinte: '#a64dff' } };
const COFFRE_JOUR = { part: 1.5, piece: 0.6, rare: 0.05, res: 0.5, nRes: 2 };
const NIV_EXPLOIT = 30, NIV_REVANCHE_DURE = 60;
/* un defi : [compteur, quantite, texte, condition, plafond] ; quantite : un nombre (multiplie par 1 + niveau / 25, comme avant) ou une fonction (le nombre exact) */
const DEFIS_NIVEAU = {
  ferme: [['recoltes', 6, 'Récolte {n} cultures'], ['plantes', 6, 'Plante {n} graines'], ['arrosages', 8, 'Arrose {n} semis'], ['ventes', 3, 'Vends {n} fois à l\'HDV', null, 8],
    ['laines', 4, 'Tonds {n} laines', () => S_.bouftous.length], ['repas', 3, 'Nourris tes Bouftous {n} fois', () => S_.bouftous.length, 12],
    ['plumes', 2, 'Ramasse des plumes {n} fois', () => S_.tofus, 4], ['tofusChasses', 2, 'Chasse {n} Tofus', null, 6],
    ['repasGelees', 2, 'Nourris tes Gelées {n} fois', () => (S_.gelees || []).length, 8], ['potsGeliere', 2, 'Récolte {n} pots de gelée', () => (S_.gelees || []).length, 8]],
  combat: [['monstres', 12, 'Abats {n} monstres', () => S_.vague.num > 1], ['vagues', 1, 'Gagne {n} vague{s}', () => S_.vague.num > 1, 3],
    ['voleurs', () => Math.max(2, Math.round(tailleSimu().nb / 2)), 'Abats {n} voleurs de VSA', (L) => L >= NIV_SIMU]],
  exploit: [['revanches', () => 1, 'Bats un boss en revanche', (L) => L >= NIV_EXPLOIT && S_.vague.num > VAGUES_PALIER],
    ['revanchesDures', () => 1, 'Bats un boss en revanche difficile', (L) => L >= NIV_REVANCHE_DURE && S_.vague.num > VAGUES_PALIER],
    ['areneVagues', () => 10, 'Tiens {n} vagues dans l\'Arène', (L) => L >= Math.max(NIV_EXPLOIT, NIV_ARENE)],
    ['runes', () => 2, 'Pose {n} runes de forgemagie', (L) => L >= NIV_EXPLOIT && niv('forge') > 0 && (runes().forge || 0) >= 2]]
};
const defisNiveauOuverts = () => p11Ouvert();
function fabriquerDefi(d, rang, L) {
  const [cle, q, txt, , max] = d, b = Math.max(1, Math.min(max || 1e9, typeof q === 'function' ? q(L) : Math.round(q * (1 + L / 25)))), R = DEFIS_RANGS[rang];
  return { cle, but: b, txt: txt.replace('{n}', b).replace('{s}', b > 1 ? 's' : ''), fait: 0, reclame: false, rang,
    kamas: Math.max(kamasGagnes(40 + 15 * L), Math.round(R.part * vagueDeNiveau(L))), xp: Math.round((5 + L / 2) * R.part / DEFIS_RANGS.ferme.part) };
}
function tirerDefisNiveau() {
  const L = niveau(S_.xp), pris = new Set(), ok = (d) => { try { return !pris.has(d[0]) && (!d[3] || !!d[3](L)); } catch (e) { return false; } };
  const choisir = (rang) => { const ordre = rang === 'exploit' ? ['exploit', 'combat', 'ferme'] : rang === 'combat' ? ['combat', 'ferme'] : ['ferme'];
    for (const r of ordre) { const P = DEFIS_NIVEAU[r].filter(ok); if (P.length) { const d = hasard(P); pris.add(d[0]); return fabriquerDefi(d, r, L); } } return null; };
  return ['ferme', 'combat', 'exploit'].map(choisir).filter(Boolean);
}
/* le jour : les defis d'avant sont remplaces par les nouveaux, une fois (v2) ; pour un joueur, seulement s'il n'a encore rien commence ce jour-la (le jour de
   la sortie) ; dans le mode test, toujours (rien n'y est enregistre) */
{ const jourCourantNiv = jourCourant; jourCourant = function () { const J = jourCourantNiv.apply(this, arguments); if (!J || J.v2 || !defisNiveauOuverts()) return J;
    if (MODE_TEST || !J.defis.some((d) => d.reclame || d.fait > 0)) { try { const D = tirerDefisNiveau(); if (D.length === 3) { J.defis = D; if (MODE_TEST) J.coffre = false; } } catch (e) { console.warn('defis du jour', e); } }
    J.v2 = true; return J; }; }
/* les compteurs des nouveaux defis */
{ const finVagueDefis = finVague; finVague = function (gagne) { const c = combat, boss = !!(gagne && c && !c.raid && c.rejoueBoss != null && !c.defiCompte); if (boss) c.defiCompte = true;
    const r = finVagueDefis.apply(this, arguments); if (boss) { try { compter('revanches'); if (c.difficile) compter('revanchesDures'); } catch (e) { /* rien */ } } return r; }; }
{ const finAreneDefis = finArene; finArene = function () { const c = combat, t = c && c.arene && !c.defiCompte ? c.arene.tenues || 0 : 0; if (c && c.arene) c.defiCompte = true;
    const r = finAreneDefis.apply(this, arguments); if (t > 0) { try { compter('areneVagues', t); } catch (e) { /* rien */ } } return r; }; }
{ const butinVoleurDefis = butinVoleur; butinVoleur = function () { try { compter('voleurs'); } catch (e) { /* rien */ } return butinVoleurDefis.apply(this, arguments); }; }
/* les ressources que lachent les monstres d'un palier (leur champ res), pour le coffre */
function ressourcesDuPalier(p) { const R = new Set();
  for (let n = p * VAGUES_PALIER + 1; n <= Math.min((p + 1) * VAGUES_PALIER, VAGUES_TOTAL); n++) { try { compoTotale(n).forEach(([t]) => { const r = MONSTRES[t] && MONSTRES[t].res; if (r && PAR_ID[r]) R.add(r); }); } catch (e) { /* rien */ } }
  return [...R]; }
const kamasCoffreNiveau = () => Math.max(kamasGagnes(150 + 40 * niveau(S_.xp)), Math.round(COFFRE_JOUR.part * vagueDeNiveau(niveau(S_.xp))));
const pcDefi = (x) => Math.round(x * 100) + ' %';
(() => { const st = document.createElement('style'); st.textContent = '.defi-rang{display:inline-block;margin-left:7px;padding:1px 8px;border-radius:99px;font-size:.62rem;font-weight:800;color:#16181c;vertical-align:middle;text-transform:uppercase;letter-spacing:.03em}'; document.head.appendChild(st); })();
/* la fenetre : la pastille du rang a cote de chaque defi, et le nouveau coffre */
{ const ouvrirDefisNiv = ouvrirDefis; ouvrirDefis = function () { const J = jourCourant(); if (!J || !J.v2 || !defisNiveauOuverts() || !J.defis.some((d) => d.rang)) return ouvrirDefisNiv.apply(this, arguments);
    const tous = J.defis.every((d) => d.reclame), C = COFFRE_JOUR;
    ouvrirModale('defis', entete('Défis du jour') + '<p style="font-size:.8rem;font-weight:600;margin:0 0 4px">Trois défis par jour : un de ferme, un de combat et un exploit. Plus un défi est dur, mieux il paie. Les trois réussis ouvrent le coffre du jour.</p>' +
      J.defis.map((d, k) => { const R = DEFIS_RANGS[d.rang]; return '<div class="defi"><div><b>' + d.txt + '</b>' + (R ? '<span class="defi-rang" style="background:' + R.teinte + '">' + R.nom + '</span>' : '') + '<div class="pv-grand"><i style="width:' + (100 * Math.min(1, d.fait / d.but)).toFixed(0) + '%;background:var(--vert)"></i></div><small style="font-size:.7rem;font-weight:700;color:#a9adb5">' + Math.min(d.fait, d.but) + ' / ' + d.but + ' : +' + fmt(d.kamas) + ' kamas, +' + xpReel(d.xp) + ' XP</small></div><div class="act">' + (d.reclame ? '<span class="cadenas">✓ Réclamé</span>' : '<button class="btn kamas" data-reclamer-defi="' + k + '"' + (d.fait >= d.but ? '' : ' disabled') + '>Réclamer</button>') + '</div></div>'; }).join('') +
      '<div class="art">' + ico('coffre') + '<div><b>Le coffre du jour</b><div class="desc">' + (J.coffre ? 'Ouvert ! Reviens demain pour de nouveaux défis.' : 'Réussis les trois défis : ' + fmt(kamasCoffreNiveau()) + ' kamas, ' + pcDefi(C.piece) + ' de chance d\'une pièce de ton palier, ' + pcDefi(C.rare) + ' d\'une pièce rare ★, et une chance sur deux de ' + C.nRes + ' ressources de ton palier.') + '</div></div><div class="act">' + (J.coffre ? '<span class="cadenas">✓ Ouvert</span>' : '<button class="btn kamas" data-coffre' + (tous ? '' : ' disabled') + '>Ouvrir</button>') + '</div></div>'); }; }
{ const ouvrirCoffreNiv = ouvrirCoffre; ouvrirCoffre = function () { const J = jourCourant(); if (!J || !J.v2 || !defisNiveauOuverts() || !J.defis.some((d) => d.rang)) return ouvrirCoffreNiv.apply(this, arguments);
    if (J.coffre || !J.defis.every((d) => d.reclame)) return; J.coffre = true; const C = COFFRE_JOUR, kamas = kamasCoffreNiveau(); S_.kamas += kamas; let objet = '', res = [];
    const P = panoAuHasard(palierCourant()), ids = EMPLACEMENTS.map(([e]) => P.id + '-' + e), neufs = ids.filter((id) => !possede(id)), base = hasard(neufs.length ? neufs : ids), tir = Math.random();
    if (tir < C.rare && OBJETS[base + '-rare']) objet = donnerObjet(base + '-rare'); else if (tir < C.rare + C.piece) objet = donnerObjet(base); /* (5 % rare, 60 % normale, 35 % rien ; sans Prospection) */
    if (Math.random() < C.res) { const L = ressourcesDuPalier(palierCourant()), par = {}; if (L.length) { for (let i = 0; i < C.nRes; i++) { const id = hasard(L); par[id] = (par[id] || 0) + 1; S_.grange[id] = (S_.grange[id] || 0) + 1; } res = Object.entries(par); } }
    rendreHaut(); rendreObjectif(); if (typeof rendreGrange === 'function') rendreGrange(); sauver(); animerCoffreNiveau(kamas, objet, res); }; }
function animerCoffreNiveau(kamas, id, res) {
  const o = id && obj(id), v = '?v=' + VERSION_MODELES;
  ouvrirModale('coffre', entete('Le coffre du jour') + '<div class="ouverture-coffre">' + sceneCoffre() +
    '<div class="gains-coffre"><div class="gain-coffre"><img src="assets/icones/kama.png' + v + '" alt=""><b>+' + fmt(kamas) + ' kamas</b></div>' +
    (o ? '<div class="gain-coffre objet"><img src="assets/icones/' + iconeObjet(id) + '.png' + v + '" alt=""' + (o.rare ? ' class="rare"' : '') + '><div class="desc"><b>' + o.nom + '</b> <span class="puce neuf">nouveau</span><div class="puces">' + statsObjet(o) + '</div></div></div>' : '') +
    (res || []).map(([r, n]) => '<div class="gain-coffre">' + ico(r) + '<b>+' + n + ' ' + nomRessources(r, n) + '</b></div>').join('') + '</div>' +
    '<div class="boutons">' + (o ? '<button class="btn discret" data-coffre-fiche>Voir dans ma fiche</button>' : '') + '<button class="btn kamas" data-coffre-ok>Super !</button></div></div>');
  $('modale').dataset.aLire = '1'; jouerCoffre('coffre');
}
