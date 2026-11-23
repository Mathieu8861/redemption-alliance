'use strict';
/* LA SERIE D'ESSAIS DE LA VAGUE 101 (22/11/2026, Mathieu : « avant d'envoyer toutes les vagues, on laisse que la 101 a tout le monde mais avec differents
   niveaux de la 101, et en fonction de leur retour (recuperer les donnees de leur partie) on sait quelle vague est plus simple / dure qu'une autre, et comme ca
   on cree les autres pour l'equilibrage », puis « j'aimerais que chaque joueur joue les memes vagues, histoire de comparer ») :
   - cinq versions de la 101, jouees par tous dans le meme ordre (B, A, C, D, E) ; une version perdue se retente apres le repos, jusqu'a la victoire, puis
     on passe a la suivante ; la serie finie, la 101 se rejoue (les versions reviennent dans le meme ordre) ;
   - A, B, C : la composition actuelle de la 101 (Tetaclaques, Crachopauds, Tritonnerre), force -15 %, actuelle, +15 % (vie et coups x racine) ;
     D : plus de Crachopauds (tireurs), E : plus de Tritonnerres (brutes), ramenees a la force de B ;
   - chaque partie va dans le journal des vagues (23b) avec sa version, son rang et le nombre d'essais ; le joueur donne son ressenti d'un clic dans le bilan
     (trop facile, correct, trop dur) ; outils/essai101.py lit le tout en base ;
   - gains d'une vague rejouee (la moitie), plus l'autre moitie des kamas a la premiere victoire de chaque version ; aucun butin (rien du palier 11) ; la
     progression ne bouge pas (la 101 reste fermee) ;
   - visible quand tous les paliers sont termines, au niveau 99 ou plus ; d'abord le compte admin seulement (ESSAI101.joueurs), le temps que Mathieu l'essaie. */
/* (22/11/2026, « mets Vague 101.2 et remets ma serie a zero », Mathieu : les versions s'appellent 101.1 a 101.5 ; serie : une nouvelle valeur remet la serie
   de chacun a zero et seules les parties de cette serie comptent dans outils/essai101.py ; a changer en ouvrant aux joueurs) */
/* OUVERTE AUX JOUEURS LE 23/11/2026 (« sortir aux joueurs les vagues 101.1, .2, .3 etc., sans leur mettre le reste de la maj a disposition », Mathieu) : serie
   joueurs-1 (outils/essai101.py --serie=joueurs-1) ; le reste du palier 11 attend SORTIE_P11 (02-donnees.js) */
/* (RETIREE LE MEME SOIR, 23/11/2026, « oui retire-la en attendant le nouvel equilibrage », Mathieu : les vagues 101 a 110 sont refaites (pas de x2 des PV par palier) ;
   aucune partie jouee entre-temps. A remettre avec joueurs: true une fois l'equilibrage fait) */
const ESSAI101 = { joueurs: false, serie: 'joueurs-1', n: 101, ordre: ['B', 'A', 'C', 'D', 'E'], lance: null,
  versions: { A: { f: Math.sqrt(0.85) }, B: { f: 1 }, C: { f: Math.sqrt(1.15) },
    D: { L: [['tetard', 2], ['crapaud', 4], ['triton', 1]] }, E: { L: [['tetard', 3], ['crapaud', 1], ['triton', 2]] } } };
const essaiBase101 = () => COMPO_MARE[1].map((x) => x.slice());
function forceCompo101(L) { const n = ESSAI101.n; let pv = 0, dps = 0; L.forEach(([t, k]) => { const M = MONSTRES[t]; if (!M || M.unique) return; pv += k * M.pv(n); dps += k * M.deg(n) / (M.cadence || 1); }); return pv * dps; }
function versionEssai101(v) { const V = ESSAI101.versions[v], L = V.L || essaiBase101(), f = V.f || Math.sqrt(forceCompo101(essaiBase101()) / forceCompo101(L)); return { v, f, L }; } /* (D et E : la meme force que B, vie et coups x racine du rapport) */
function compoEssai101(L) { const sauve = COMPO_MARE[1]; COMPO_MARE[1] = L.map((x) => x.slice()); try { return compoVague(ESSAI101.n); } finally { COMPO_MARE[1] = sauve; } } /* (la horde, le Iop en plus, l'Axolutin unique : comme la vraie 101) */
const etatEssai101 = () => (S_.essai101 && S_.essai101.serie === ESSAI101.serie ? S_.essai101 : (S_.essai101 = { serie: ESSAI101.serie, i: 0, essais: {}, gagnes: {} }));
const nomEssai101 = (j) => 'Vague ' + ESSAI101.n + '.' + (j + 1); /* (j : le rang dans la serie, de 0 a 4) */
/* (23/11/2026, « 101.1, 101.2 etc. : fais en sorte qu'on puisse faire celle qu'on veut », Mathieu) : on touche un numero pour choisir sa version (E.choix) ; sinon, la
   premiere pas encore reussie, dans l'ordre. La serie est finie quand les cinq ont ete reussies, dans n'importe quel ordre */
const rangEssai101 = () => { const E = etatEssai101(), O = ESSAI101.ordre; if (E.choix != null && E.choix >= 0 && E.choix < O.length) return E.choix; const j = O.findIndex((v) => !E.gagnes[v]); return j >= 0 ? j : 0; };
const versionCourante101 = () => ESSAI101.ordre[rangEssai101()];
const serieFinie101 = () => ESSAI101.ordre.every((v) => etatEssai101().gagnes[v]);
const essaiVisible101 = () => { try { return !!S_ && !!S_.perso && (ESSAI101.joueurs || MODE_TEST) /* (23/11/2026 : plus pour le compte admin hors mode test, « mets-moi comme les joueurs classiques », Mathieu) */ && S_.vague.num > VAGUES_TOTAL && niveau(S_.xp) >= ESSAI101.n - 2; } catch (e) { return false; } };
function lancerEssai101() {
  if (!essaiVisible101() || combat) return; const E = etatEssai101(), V = versionEssai101(versionCourante101());
  ESSAI101.lance = { n: ESSAI101.n, v: V.v, f: V.f, k: rangEssai101(), compo: () => compoEssai101(V.L) }; if (typeof ouvrirTourbe === 'function') ouvrirTourbe(); /* (la Tourbe qu'ils ramassent : visible dans la grange) */
  fermerModale(); lancerVague(); if (!combat && !lancerVague.charge) ESSAI101.lance = null; /* (pas lancee, le repos par exemple : rien ne reste pour la vague suivante) */
}
/* la carte de la serie, dans la fenetre des vagues (onglet Les vagues, quand tous les paliers sont termines) */
function carteEssai101() {
  const E = etatEssai101(), tot = ESSAI101.ordre.length, fin = serieFinie101(), k = rangEssai101(), V = versionEssai101(versionCourante101()), n = ESSAI101.n, repos = S_.vague.repos - Date.now(), nbOk = ESSAI101.ordre.filter((v) => E.gagnes[v]).length;
  const img = (x) => '<img src="assets/icones/' + x + '.png?v=' + VERSION_MODELES + '" alt="">';
  const pistes = ESSAI101.ordre.map((v, j) => '<i class="' + (j === k ? 'ici' : E.gagnes[v] ? 'fait' : '') + '" style="cursor:pointer" data-essai101-choix="' + j + '" data-info="' + nomEssai101(j) + (E.gagnes[v] ? ' : réussie' : '') + ', touche pour la choisir">' + (E.gagnes[v] && j !== k ? '✓' : '.' + (j + 1)) + '</i>').join('');
  const mons = compoEssai101(V.L).map(([t, nb]) => { const M = MONSTRES[t];
    return '<button class="vg-mon" data-fiche-monstre="' + t + '" data-info="Sa fiche">' + img(M.icone) + '<b>× ' + nb + '</b><span>' + M.nom + '</span><small>' + fmt(Math.round(pvMonstre(t, n) * V.f)) + ' PV</small></button>'; }).join('');
  const g = gainsVague(n, true), plein = gainsVague(n, false), bonus = Math.max(0, plein.kamas - g.kamas), dejaV = !!E.gagnes[V.v];
  const bouton = repos > 0 ? '<button class="btn vg-lancer" disabled>Ton perso se repose encore ' + dureeLisible(repos) + '</button>' : '<button class="btn kamas vg-lancer" data-essai101>' + (E.gagnes[V.v] ? 'Rejouer la ' : 'Lancer la ') + nomEssai101(k).toLowerCase() + '</button>';
  return '<div class="essai-carte"><div class="essai-t"><b>Vague 101 : la saison des pluies, en avant-première</b><span>' + nomEssai101(k) + ' · ' + (fin ? 'série terminée, merci !' : nbOk + ' sur ' + tot + ' réussie' + (nbOk > 1 ? 's' : '')) + '</span></div>' +
    '<p>Aide-nous à régler le prochain palier : joue les ' + tot + ' versions de la vague 101 (101.1 à 101.' + tot + '), dans l\'ordre que tu veux : touche un numéro pour choisir ta version. Une vague perdue se retente après ton repos. À la fin de chaque vague, dis-nous en un clic si elle était trop facile, correcte ou trop dure : tes résultats servent à équilibrer les vagues 101 à 110.</p>' +
    '<div class="essai-pistes">' + pistes + '</div><div class="vg-mons">' + mons + '</div>' +
    '<div class="essai-pied"><span>' + img('kama') + fmt(g.kamas) + ' kamas' + (!dejaV && !fin ? ', +' + fmt(bonus) + ' à ta première victoire de cette version' : '') + '. Des ressources, mais aucune pièce d\'équipement.</span>' + bouton + '</div></div>';
}
/* (23/11/2026, « en mode test, t'as pas mis le fait de pouvoir tester la vague 101.1 jusqu'a 101.5 ; toutes les choses qu'on va push apres pour les joueurs, il
   faut les mettre », Mathieu : le mode test ouvre les vagues 101 a 110, donc « tous les paliers termines » n'y arrivait jamais ; la carte s'y montre aussi, en haut
   de l'onglet de la vague, tant que sa vraie partie a fini le dernier palier des joueurs) */
const essaiIci101 = () => essaiVisible101() && (S_.vague.num > vaguesOuvertes() || MODE_TEST);
{ const ouvrirVaguesE = ouvrirVagues; ouvrirVagues = function (onglet) {
    const r = ouvrirVaguesE.call(this, typeof onglet !== 'string' && modaleOuverte !== 'vagues' && S_.vague.num > vaguesOuvertes() && essaiVisible101() ? 'vague' : onglet); /* (la serie ouverte : la fenetre s'ouvre sur Les vagues, pas sur Refaire un boss) */
    try { const a = document.querySelector('#carte .vg-aide') || document.querySelector('#carte .vg-entete'); if (modaleOuverte === 'vagues' && ouvrirVagues.onglet === 'vague' && essaiIci101() && a) a.insertAdjacentHTML(a.classList.contains('vg-aide') ? 'afterend' : 'beforebegin', carteEssai101()); } catch (e) { /* (la fenetre reste comme avant) */ }
    return r; }; }
/* apres la vague : le compte de la serie, la ligne du journal completee, et le ressenti dans le bilan */
{ const finVagueE = finVague; finVague = function (gagne, fuite) {
    const c = combat, es = c && !c.fin && c.essai101; const r = finVagueE.apply(this, arguments);
    if (es) { try { apresEssai101(es, !!gagne, !!fuite); } catch (e) { /* (le bilan reste comme avant) */ } }
    return r; }; }
function apresEssai101(es, gagne, fuite) {
  const E = etatEssai101(), v = es.v, tot = ESSAI101.ordre.length, premiere = gagne && !E.gagnes[v];
  E.essais[v] = (E.essais[v] || 0) + 1; const fois = E.essais[v];
  let bonus = 0; if (premiere) { bonus = Math.max(0, gainsVague(ESSAI101.n, false).kamas - gainsVague(ESSAI101.n, true).kamas); S_.kamas += bonus; rendreHaut(); }
  if (gagne) { E.gagnes[v] = (E.gagnes[v] || 0) + 1; E.i++; E.choix = null; } /* (apres une victoire, la fenetre propose la suivante pas encore reussie) */
  const J = S_.journalVagues, e = Array.isArray(J) ? J[J.length - 1] : null; if (e && e.n === ESSAI101.n && !e.essai) e.essai = { v, rang: ESSAI101.ordre.indexOf(v) + 1, fois, f: Math.round(es.f * 1000) / 1000, serie: ESSAI101.serie };
  sauver(); const carte = $('carte'); if (!carte || modaleOuverte !== 'vague-fin' || !e) return;
  const rang = ESSAI101.ordre.indexOf(v) + 1, suite = gagne ? (serieFinie101() ? 'Série terminée, merci ! Chaque version reste rejouable : choisis-la dans la fenêtre des vagues.' : 'Choisis la suivante dans la fenêtre des vagues.') : fuite ? '' : 'Tu peux la retenter après ton repos.';
  const bloc = '<div class="essai-bilan"><b>' + nomEssai101(rang - 1) + (gagne ? ' réussie' : fuite ? ' abandonnée' : ' perdue') + '</b>' + (fois > 1 ? ' <small>(tentative ' + fois + ')</small>' : '') +
    (bonus ? '<p>+' + fmt(bonus) + ' kamas pour ta première victoire de cette version.</p>' : '') + (suite ? '<p>' + suite + '</p>' : '') +
    '<div class="essai-ressenti"><span>Ton ressenti sur cette vague :</span><button class="btn mini" data-ressenti="facile">Trop facile</button><button class="btn mini" data-ressenti="correct">Correcte</button><button class="btn mini" data-ressenti="dur">Trop dure</button></div></div>';
  carte.querySelectorAll('p').forEach((p) => { if (p.textContent.includes('tous les paliers sont termin')) p.remove(); }); /* (le bilan d'une vague rejouee disait « le Machefange est tombe » : faux pour un essai) */
  const art = carte.querySelector('.art'); if (art) art.insertAdjacentHTML('afterend', bloc); else carte.insertAdjacentHTML('beforeend', bloc);
}
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-essai101], [data-essai101-choix], [data-ressenti]'); if (!b) return;
  if (b.hasAttribute('data-essai101')) { lancerEssai101(); return; }
  if (b.hasAttribute('data-essai101-choix')) { etatEssai101().choix = +b.dataset.essai101Choix; ouvrirVagues('vague'); return; } /* (la version choisie, 23/11/2026) */
  const J = S_.journalVagues, e = Array.isArray(J) ? J[J.length - 1] : null, z = b.closest('.essai-ressenti');
  if (e && e.essai) { e.essai.ressenti = b.dataset.ressenti; sauver(); }
  if (z) z.innerHTML = '<span>Merci, c\'est noté !</span>';
});
/* le butin d'un essai : les ressources seulement, aucune piece (23/11/2026, « donne pas de loot d'item, que des ressources », Mathieu ; aucun butin avant) */
{ const butinE = butin; butin = function (mo) { if (combat && combat.essai101) combat.sansObjets = true; return butinE(mo); }; }
