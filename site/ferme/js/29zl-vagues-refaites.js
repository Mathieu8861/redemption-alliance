'use strict';
/* TROIS VAGUES A REFAIRE CHAQUE JOUR (27/11/2026, Mathieu : « en plus de pouvoir refaire les boss, les membres auront le droit de refaire chaque jour 3 vagues /
   combats de leur choix, afin de collecter des ressources ; ils ne peuvent pas refaire une vague qui contient un demi-boss / boss » ; au formulaire du 26/11 :
   « butin des monstres seul ») :
   - une vague deja gagnee (ou un combat deja gagne des vagues 101 a 110), sans boss ni demi-boss, ni dans sa troupe ni dans ses temps suivants ;
   - trois par jour (le jour du joueur, comme la revanche des boss), compte au lancement : fuir ou perdre en consomme une ;
   - elle ne fait pas avancer, et ne rapporte que le butin des monstres (ressources, pieces, kamas qu'ils lachent) : ni kamas ni XP de fin de vague ;
   - un onglet « Refaire une vague » dans la fenetre des vagues ; le mode test les refait sans limite.
   Le lancement passe par lancerVague (21-combat.js, canal REJOUE_VAGUES.lance), la fin par finVague (23-fin-combat.js, c.rejoueVague). */
const REJOUE_VAGUES = { parJour: 3, sorti: false, lance: null, vue: false };
const etatRejoue = () => { const j = jourJeu(); let E = S_.vaguesRefaites; if (!E || E.jour !== j) E = S_.vaguesRefaites = { jour: j, n: 0, L: [] }; return E; };
const refaitesRestantes = () => Math.max(0, REJOUE_VAGUES.parJour - etatRejoue().n);
const refaireVisible = () => REJOUE_VAGUES.sorti || (typeof p11Ouvert === 'function' ? p11Ouvert() : typeof MODE_TEST !== 'undefined' && MODE_TEST); /* (« avec le palier 11 », Mathieu, 27/11/2026 : s'ouvre a tous avec l'interrupteur SORTIE_P11, 02-donnees.js ; en attendant, le mode test) */
const avecChefRV = (L) => (L || []).some(([t]) => MONSTRES[t] && MONSTRES[t].boss); /* (boss et demi-boss : les deux ont boss, le demi-boss a aussi demi) */
function vagueRefaisable(n) {
  if (!(n >= 1 && n < S_.vague.num && n <= vaguesOuvertes())) return false; if (typeof vagueEnCombats === 'function' && vagueEnCombats(n)) return false;
  if (avecChefRV(compoVague(n))) return false; return !(PHASES_BOSS[n] || []).some((p) => avecChefRV(p.L));
}
function combatRefaisable(n, k) {
  if (typeof vagueEnCombats !== 'function' || !vagueEnCombats(n) || !((etatVagueCM(n).g[k] || 0) > 0)) return false; const C = combatCM(n, k); if (C.boss) return false;
  return !avecChefRV(compoCM(C)) && !(C.P.tempsCM || []).some((T) => avecChefRV(compoTempsCM(T)));
}
function listeRefaisables() { /* [{ n, k, nom }] : les vagues gagnees de la plus recente a la plus ancienne, et les combats gagnes de 101 a 110 */
  const L = []; for (let n = Math.min(S_.vague.num - 1, vaguesOuvertes()); n >= 1; n--) {
    if (typeof vagueEnCombats === 'function' && vagueEnCombats(n)) { (PLAN_CM[n] || []).forEach((x, k) => { if (combatRefaisable(n, k)) L.push({ n, k }); }); continue; }
    if (vagueRefaisable(n)) L.push({ n, k: null }); }
  return L;
}
function refaireVague(n, k) {
  if (combat || enAccueil || lancerVague.charge || !refaireVisible()) return; k = k == null || k === '' ? null : +k;
  if (!(typeof MODE_TEST !== 'undefined' && MODE_TEST) && !refaitesRestantes()) { toast('Tu as déjà refait tes ' + REJOUE_VAGUES.parJour + ' vagues aujourd\'hui : reviens demain.', 'alerte'); return; }
  if (k == null ? !vagueRefaisable(n) : !combatRefaisable(n, k)) { toast('Celle-ci ne se refait pas : pas encore gagnée, ou un boss ou un demi-boss l\'accompagne.', 'alerte'); return; }
  REJOUE_VAGUES.lance = { n, k }; const avant = combat;
  try { if (k != null) armerCM(n, k); lancerVague(); } finally { REJOUE_VAGUES.lance = null; }
  if (k != null && !combat && !lancerVague.charge) desarmerEssai101();
  if (combat && combat !== avant && combat.rejoueVague != null) { const E = etatRejoue(); E.n++; E.L.push(k != null ? n + '.' + (k + 1) : String(n)); sauver();
    setTimeout(() => toast((k != null ? 'Combat ' + n + '.' + (k + 1) : 'Vague ' + n) + ' refaite : le butin des monstres seulement. ' + (MODE_TEST ? '(Mode test : sans limite.)' : 'Il t\'en reste ' + refaitesRestantes() + ' aujourd\'hui.'), 'or'), 2600); }
}
/* le chargement des monstres a squelette relance lancerVague plus tard (lancerVague.charge) : le canal reste ouvert jusqu'a ce relancement */
{ const lancerVagueRV = lancerVague; lancerVague = function () { const L0 = REJOUE_VAGUES.lance, r = lancerVagueRV.apply(this, arguments);
    if (L0 && lancerVague.charge && !combat) { REJOUE_VAGUES.attente = L0; REJOUE_VAGUES.attenteT = performance.now(); } return r; }; }
{ const lancerVagueRV2 = lancerVague; lancerVague = function () { if (!REJOUE_VAGUES.lance && REJOUE_VAGUES.attente && !lancerVague.charge && performance.now() - (REJOUE_VAGUES.attenteT || 0) < 60000) { /* (le relancement apres le chargement des modeles : 21-combat le fait avec charges, 29zi sans) */ const L0 = REJOUE_VAGUES.attente; REJOUE_VAGUES.attente = null; REJOUE_VAGUES.lance = L0;
      const avant = combat; let r; try { r = lancerVagueRV2.apply(this, arguments); } finally { REJOUE_VAGUES.lance = null; }
      if (combat && combat !== avant && combat.rejoueVague != null) { const E = etatRejoue(); E.n++; E.L.push(L0.k != null ? L0.n + '.' + (L0.k + 1) : String(L0.n)); sauver(); } return r; }
    return lancerVagueRV2.apply(this, arguments); }; }

/* le bilan : le titre et la ligne des gains disent que c'etait une vague refaite */
{ const finVagueRV = finVague; finVague = function (gagne, fuite) { const c = combat, rv = c && !c.fin && c.rejoueVague != null ? c : null, r = finVagueRV.apply(this, arguments);
    try { if (rv && modaleOuverte === 'vague-fin') { const carte = $('carte'), h = carte && carte.querySelector('h2'), cm = typeof combatCMde === 'function' && combatCMde(rv), nom = cm ? 'Combat ' + cm.num : 'Vague ' + rv.n;
        if (h && h.firstChild && h.firstChild.nodeType === 3) h.firstChild.nodeValue = gagne ? nom + ' refait' + (cm ? '' : 'e') + ' !' : fuite ? 'Tu as fui : ' + nom.toLowerCase() + ' refait' + (cm ? '' : 'e') : nom + ' refait' + (cm ? '' : 'e') + ' : perdu' + (cm ? '' : 'e');
        if (gagne) { const a = carte.querySelector('.art'); if (a) a.outerHTML = '<div class="art">' + ico('grange') + '<div><b>Le butin des monstres, et rien d\'autre</b><div class="desc">Une vague refaite ne rapporte ni kamas ni XP de fin de vague. ' + (MODE_TEST ? 'Mode test : sans limite.' : 'Il t\'en reste ' + refaitesRestantes() + ' sur ' + REJOUE_VAGUES.parJour + ' aujourd\'hui.') + '</div></div><div></div></div>'; }
        carte.querySelectorAll('p').forEach((p) => { if (/t'attend|tous les paliers sont termin|est ouverte|reste à faire/.test(p.textContent)) p.remove(); }); } } catch (e) { /* rien */ }
    return r; }; }

/* l'onglet « Refaire une vague » de la fenetre des vagues */
(() => { const st = document.createElement('style'); st.textContent = '.vg-rv-pal{font-weight:800;font-size:.78rem;margin:10px 0 4px;opacity:.85}.vg-rv-grille{display:flex;flex-wrap:wrap;gap:5px}.vg-rv-grille .btn{min-width:46px;padding:5px 8px;font-size:.8rem}.vg-rv-reste{font-weight:800;margin:6px 0}';
  document.head.appendChild(st); })();
function ongletRefaire() {
  const L = listeRefaisables(), reste = refaitesRestantes(), test = typeof MODE_TEST !== 'undefined' && MODE_TEST, repos = !test && Date.now() < S_.vague.repos ? S_.vague.repos - Date.now() : 0, bloque = !test && (!reste || repos > 0);
  const quoi = (n, k) => { const T = k != null ? compoCM(combatCM(n, k)) : compoVague(n); return T.map(([t, x]) => x + ' ' + (MONSTRES[t].nom || t)).join(', '); };
  let h = '<p class="vg-aide">Chaque jour, refais jusqu\'à ' + REJOUE_VAGUES.parJour + ' vagues ou combats déjà gagnés, au choix, pour récolter le butin de leurs monstres (ressources et pièces). Ni kamas ni XP de fin de vague, et ta progression ne bouge pas. Les vagues avec un boss ou un demi-boss ne se refont pas ici : leurs boss se rejouent dans l\'onglet Refaire un boss.</p>' +
    '<p class="vg-rv-reste">' + (test ? 'Mode test : sans limite (' + etatRejoue().n + ' refaite' + (etatRejoue().n > 1 ? 's' : '') + ' aujourd\'hui).' : reste ? 'Il t\'en reste ' + reste + ' sur ' + REJOUE_VAGUES.parJour + ' aujourd\'hui.' : 'Plus aucune aujourd\'hui : reviens demain.') + '</p>' +
    (repos > 0 ? '<p class="vg-repos">Ton perso se repose encore ' + dureeLisible(repos) + '.</p>' : '');
  if (!L.length) return h + '<p class="vg-aide">Aucune vague à refaire pour l\'instant : gagne d\'abord des vagues sans boss.</p>';
  let pal = -1; L.forEach(({ n, k }) => { const P = palierDe(n); if (P !== pal) { h += (pal >= 0 ? '</div>' : '') + '<div class="vg-rv-pal">' + PALIERS_TOUS[P].nom.charAt(0).toUpperCase() + PALIERS_TOUS[P].nom.slice(1) + '</div><div class="vg-rv-grille">'; pal = P; }
    h += '<button class="btn ' + (bloque ? 'discret' : 'kamas') + '" data-refaire-vague="' + n + '" data-refaire-k="' + (k == null ? '' : k) + '"' + (bloque ? ' disabled' : '') + ' data-info="' + (k != null ? 'Combat ' + n + '.' + (k + 1) : 'Vague ' + n) + ' : ' + quoi(n, k).replace(/"/g, '') + '">' + (k != null ? n + '.' + (k + 1) : n) + '</button>'; });
  return h + '</div>';
}
{ const ouvrirVaguesRV = ouvrirVagues; ouvrirVagues = function (onglet) {
    if (typeof onglet === 'string') REJOUE_VAGUES.vue = onglet === 'refaire'; else if (modaleOuverte !== 'vagues') REJOUE_VAGUES.vue = false;
    const nous = REJOUE_VAGUES.vue && refaireVisible(), r = ouvrirVaguesRV.apply(this, nous ? ['vague'] : arguments);
    try { const carte = $('carte'), O = carte && carte.querySelector('.vg-onglets'); if (!O || !refaireVisible() || modaleOuverte !== 'vagues') return r;
      if (!O.querySelector('[data-vg-onglet="refaire"]')) { const b = document.createElement('button'); b.dataset.vgOnglet = 'refaire'; const nL = listeRefaisables().length;
        b.innerHTML = 'Refaire une vague<small>' + (MODE_TEST ? 'sans limite (test)' : refaitesRestantes() + ' sur ' + REJOUE_VAGUES.parJour + ' aujourd\'hui') + '</small>'; if (!nL) b.disabled = true;
        const bestiaire = O.querySelector('[data-vg-onglet="bestiaire"]'); O.insertBefore(b, bestiaire || null); }
      if (nous) { O.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.vgOnglet === 'refaire'));
        let x = O.nextSibling; while (x) { const s = x.nextSibling; x.remove(); x = s; } O.insertAdjacentHTML('afterend', '<div class="vg-rv">' + ongletRefaire() + '</div>'); } } catch (e) { console.warn('refaire une vague', e); }
    return r; }; }
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-refaire-vague]'); if (!b || b.disabled) return; e.stopPropagation(); refaireVague(+b.dataset.refaireVague, b.dataset.refaireK); });
