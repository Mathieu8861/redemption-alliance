'use strict';
/* LES COFFRES DANS LE SAC (26/11/2026, « ce serait bien que les coffres, on les gagne dans notre inventaire et c'est a nous de les ouvrir, au fur et a mesure ;
   peut-etre j'ai envie de me faire une session ou je les ouvre tous d'un coup, quelque chose qui ne s'ouvre pas tout seul ; ca rajouterait un petit cote fun »,
   Mathieu ; au formulaire : « Dans le sac du perso », « Tous les coffres ») :
   - un coffre gagne ne s'ouvre plus tout seul : il se range dans le sac (Perso), en haut de la colonne du sac, avec « Ouvrir » et « Tout ouvrir » ;
   - a l'ouverture, ce qu'il contient est tire et donne a ce moment-la, avec l'animation des coffres facon jeux mobiles (29m-ouverture-coffre.js) ;
   - « Tout ouvrir » les ouvre l'un apres l'autre, chacun avec son animation ;
   - les coffres concernes : celui de l'ile des boss (la semaine finie : il apparait dans le sac au lieu de s'ouvrir a la ferme), et ceux du labo (les coffres de
     l'ile, celui d'un chef de camp, celui de la fin du labo). Le coffre des trois defis du jour s'ouvrait deja a la main : il ne change pas.
   COFFRES_SAC[type] : le titre, la rarete (l'image du coffre), l'ouverture (ouvrir(d, fin) : donne, montre, puis fin()). */
const COFFRES_SAC = {};
const coffresSac = () => { if (!S_) return []; if (!Array.isArray(S_.coffresSac)) S_.coffresSac = []; return S_.coffresSac; };
const coffreIleEnAttente = () => { try { return typeof aReclamerIle === 'function' && enLigneSv && enLigneSv.compte && aReclamerIle().length > 0; } catch (e) { return false; } };
function rangerCoffre(type, d, calme) {
  const L = coffresSac(); L.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), type, d: d || {}, quand: Date.now() }); sauver(); majPastilleCoffres();
  if (!calme && COFFRES_SAC[type]) toast('🎁 ' + COFFRES_SAC[type].titre(d || {}) + ' : rangé dans ton sac (Perso). Ouvre-le quand tu veux !', 'or');
}
function listeCoffresSac() { const L = coffresSac().filter((c) => COFFRES_SAC[c.type]).map((c) => Object.assign({}, c));
  if (coffreIleEnAttente()) L.push({ id: 'ile', type: 'ile', d: {} }); return L; }
function ouvrirCoffreSac(id, fin) {
  if (id === 'ile') { fermerModale(); COFFRES_SAC.ile.ouvrir({}, fin); return; }
  const L = coffresSac(), i = L.findIndex((c) => c.id === id); if (i < 0) { if (fin) fin(); return; } const C = L.splice(i, 1)[0]; const T0 = COFFRES_SAC[C.type];
  sauver(); majPastilleCoffres(); fermerModale(); if (!T0) { if (fin) fin(); return; }
  try { T0.ouvrir(C.d || {}, fin); } catch (e) { console.warn('coffre du sac', e); if (fin) fin(); }
}
function toutOuvrirCoffres() { /* l'un apres l'autre ; celui de l'ile en dernier (il a ses ressources a choisir) */
  const L = listeCoffresSac().sort((a, b) => (a.type === 'ile') - (b.type === 'ile')); let k = 0;
  const suivant = () => { if (k >= L.length) return; const C = L[k++]; ouvrirCoffreSac(C.id, C.type === 'ile' ? null : () => setTimeout(suivant, 300)); };
  suivant();
}
/* l'ouverture commune : l'animation des coffres (rar : normal, rare, epique, legendaire) ; sans elle, un message, puis la suite */
function montrerCoffre(rar, titre, sousTitre, cartes, fin, lignes) {
  const ok = typeof ouvertureMobile === 'function' && ouvertureMobile({ rar, titre, sousTitre, cartes, fin: () => { if (fin) fin(); }, base: typeof coffrePodium === 'function' && typeof RANG_COFFRE !== 'undefined' ? coffrePodium(['legendaire', 'epique', 'rare'].indexOf(rar)) : null });
  if (!ok) { toast('🎁 ' + titre + ' : ' + (lignes || cartes.map((c) => (c.n != null ? fmt(c.n) + ' ' : '') + c.t)).join(', ') + '.', 'or'); if (fin) setTimeout(fin, 600); }
}
/* ---------- les coffres du labo ---------- */
COFFRES_SAC.labo = { titre: (d) => (COFFRES_ILE_LABO[d.rang] || COFFRES_ILE_LABO.commun).nom, rar: (d) => ({ precieux: 'epique', rare: 'rare' })[d.rang] || 'normal',
  ouvrir: (d, fin) => { const T0 = COFFRES_ILE_LABO[d.rang] || COFFRES_ILE_LABO.commun, pros = prosLabo(), G = S_.grange = S_.grange || {}, cartes = [], hasard = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const kamas = kamasGagnes(hasard(T0.kamas[0], T0.kamas[1])); S_.kamas += kamas; cartes.push({ ico: 'kama', n: kamas, t: 'kamas', son: 'kamas' });
    T0.L.forEach(([p, type, a, b, c]) => { if (Math.random() >= Math.min(1, p * pros)) return;
      if (type === 'pot') { const t = a[Math.floor(Math.random() * a.length)], n = hasard(b, c); S_.pots[t] = (S_.pots[t] || 0) + n; cartes.push({ ico: 'pot-' + t, n, t: (n > 1 ? POTS[t].court : POTS[t].nom).toLowerCase() }); }
      else if (type === 'res') { const n = hasard(b, c); G[a] = (G[a] || 0) + n; cartes.push({ ico: a, n, t: nomRessources(a, n) }); }
      else if (type === 'forge') { runes().forge = (runes().forge || 0) + a; cartes.push({ ico: 'rune-forge', n: a, t: 'rune de forgemagie', son: 'quete' }); }
      else if (type === 'parfaite') { runes().parfaite = (runes().parfaite || 0) + a; cartes.push({ ico: 'rune-parfaite', n: a, t: 'rune parfaite', brille: true }); }
      else if (type === 'cristal' && typeof gagnerCristaux === 'function') { gagnerCristaux(a); cartes.push({ ico: 'rune-cristal', n: a, t: a > 1 ? 'cristaux runiques' : 'cristal runique', brille: true }); } });
    sauver(); rendreHaut(); rendreGrange(); montrerCoffre(COFFRES_SAC.labo.rar(d), T0.nom, 'Un coffre de l\'île des Wabbits', cartes, fin); } };
COFFRES_SAC.chefLabo = { titre: (d) => 'Coffre de ' + (d.nom || 'chef'), rar: () => 'epique',
  ouvrir: (d, fin) => { const R = LOOT_LABO.chef, G = S_.grange = S_.grange || {}, cartes = [];
    if (R.kamas) { S_.kamas += R.kamas; cartes.push({ ico: 'kama', n: R.kamas, t: 'kamas', son: 'kamas' }); }
    if (R.poils) { G.poil_wabbit = (G.poil_wabbit || 0) + R.poils; cartes.push({ ico: 'poil_wabbit', n: R.poils, t: 'Poils de Wabbit' }); }
    if (R.forge) { runes().forge = (runes().forge || 0) + R.forge; cartes.push({ ico: 'rune-forge', n: R.forge, t: 'rune de forgemagie', son: 'quete' }); }
    if (R.parfaite && Math.random() < R.parfaite) { runes().parfaite = (runes().parfaite || 0) + 1; cartes.push({ ico: 'rune-parfaite', n: 1, t: 'rune parfaite', brille: true }); }
    if (R.cristal && typeof gagnerCristaux === 'function') { gagnerCristaux(R.cristal); cartes.push({ ico: 'rune-cristal', n: R.cristal, t: R.cristal > 1 ? 'cristaux runiques' : 'cristal runique', brille: true }); }
    sauver(); rendreHaut(); rendreGrange(); montrerCoffre('epique', 'Coffre de ' + (d.nom || 'chef'), 'Un chef de camp du labo', cartes, fin); } };
COFFRES_SAC.finLabo = { titre: () => 'Le coffre du labo', rar: (d) => (d.premier ? 'legendaire' : 'epique'),
  ouvrir: (d, fin) => { const C = FIN_LABO.coffre, G = S_.grange = S_.grange || {}, parfaite = d.parfaite ? 1 : 0;
    S_.kamas += C.kamas; G.poil_wabbit = (G.poil_wabbit || 0) + C.poils; if (typeof gagnerCristaux === 'function') gagnerCristaux(C.cristal); runes().forge = (runes().forge || 0) + C.forge; if (parfaite) runes().parfaite = (runes().parfaite || 0) + 1;
    sauver(); rendreHaut(); rendreGrange();
    const cartes = [{ ico: 'kama', n: C.kamas, t: 'kamas', son: 'kamas' }, { ico: 'poil_wabbit', n: C.poils, t: 'Poils de Wabbit' }, { ico: 'rune-forge', n: C.forge, t: 'runes de forgemagie', son: 'quete' }].concat(C.cristal ? [{ ico: 'rune-cristal', n: C.cristal, t: 'cristaux runiques', brille: true }] : []).concat(parfaite ? [{ ico: 'rune-parfaite', n: 1, t: 'rune parfaite', brille: true }] : []);
    montrerCoffre(COFFRES_SAC.finLabo.rar(d), 'Le coffre du labo', d.sous || 'Les Wabbits sont libres !', cartes, fin); } };
/* le coffre de terre du labo : au contact, il s'ouvre un instant (son couvercle, un eclat) et file dans le sac */
{ const ouvrirCoffreLaboSac = ouvrirCoffreLabo; ouvrirCoffreLabo = function (C) {
    if (C.ouvert) return; C.ouvert = true; C.rang = rangCoffreLabo(); const T0 = COFFRES_ILE_LABO[C.rang], y = hTerrainLabo(C.x, C.z);
    son('quete'); if (typeof chiffre === 'function') chiffre('🎁 ' + T0.nom, new T.Vector3(DONJON.x + C.x, y + 1.8, DONJON.z + C.z), 'butin');
    emettre(FX_VIF, 14, { x: DONJON.x + C.x, y: y + 0.6, z: DONJON.z + C.z, r: 0.3, dv: 3, haut: true, vie: [0.4, 0.8], taille: [0.14, 0.05], c: ['#fff3c4', '#ffd27a', '#ffffff'], grav: 6 });
    rangerCoffre('labo', { rang: C.rang });
    let t = 0; effets.push((dt) => { t += dt; if (C.ch) C.ch.rotation.x = -1.9 * Math.min(1, t / 0.45); return t >= 0.45; }); }; }
/* le coffre d'un chef de camp : il tombe dans le sac */
{ const gagnerLaboSac = gagnerLabo; gagnerLabo = function (mo, R, titre) {
    if (R === LOOT_LABO.chef) { if (typeof chiffre === 'function') chiffre('🎁 ' + titre, new T.Vector3(mo.x, (mo.m ? mo.m.position.y : 0) + (mo.haut || 2) + 0.6, mo.z), 'butin'); son('quete'); rangerCoffre('chefLabo', { nom: mo.d.nom }); return; }
    return gagnerLaboSac.apply(this, arguments); }; }
/* ---------- le coffre de l'ile des boss : il attend dans le sac au lieu de s'ouvrir tout seul a la ferme ---------- */
COFFRES_SAC.ile = { titre: () => 'Le coffre de l\'île des boss', rar: () => 'legendaire', ouvrir: (d, fin) => { reclamerIleBoss(false); if (fin) fin(); } };
{ const coffreIleAutoSac = coffreIleAuto; coffreIleAuto = function () {
    if (!S_ || !S_.perso || enAccueil || combat || modaleOuverte || lieu !== 'ferme' || (typeof lecon !== 'undefined' && lecon.ouverte) || reclamerIleBoss.enCours || !ENLIGNE || !enLigneSv.compte) { try { compensationAuto(); } catch (e) { /* rien */ } return; }
    if ((etatIleBoss().aChoisir || 0) > 0 && !aReclamerIle().length) return coffreIleAutoSac.apply(this, arguments); /* (des ressources au choix pas encore prises : comme avant) */
    try { compensationAuto(); } catch (e) { /* rien */ }
    if (coffreIleEnAttente() && !coffreIleAuto.vu) { coffreIleAuto.vu = true; majPastilleCoffres(); toast('🎁 Le coffre de l\'île des boss est arrivé dans ton sac (Perso) : ouvre-le quand tu veux !', 'or'); } }; }
/* ---------- le sac : les coffres en haut, et une pastille sur le bouton Perso ---------- */
function blocCoffresSac() {
  const L = listeCoffresSac(); if (!L.length) return '';
  const img = (C) => { const rar = COFFRES_SAC[C.type].rar(C.d), look = typeof lookCoffre === 'function' && rar !== 'normal' ? lookCoffre(rar) : rar === 'normal' ? 'ferme' : rar; return 'assets/icones/coffre-' + look + '.png?v=' + VERSION_MODELES; };
  return '<div class="fp-coffres"><h3>Coffres <small>' + L.length + ' à ouvrir</small></h3><div class="fpc-liste">' + L.map((C) => '<div class="fpc"><img src="' + img(C) + '" alt=""><span>' + COFFRES_SAC[C.type].titre(C.d) + '</span><button class="btn kamas mini" data-coffre-sac="' + C.id + '">Ouvrir</button></div>').join('') + '</div>' +
    (L.length > 1 ? '<button class="btn kamas" data-coffres-tout="1">Tout ouvrir (' + L.length + ')</button>' : '') + '</div>';
}
{ const ouvrirPersoSac = ouvrirPerso; ouvrirPerso = function () { const r = ouvrirPersoSac.apply(this, arguments);
    try { const h = blocCoffresSac(); if (h) { const blocs = document.querySelectorAll('#carte .fp-corps > .fp-bloc'), d = blocs[blocs.length - 1]; if (d) { const t = d.querySelector('h3'); if (t) t.insertAdjacentHTML('beforebegin', h); } } } catch (e) { /* rien */ }
    return r; }; }
function majPastilleCoffres() { const b = document.getElementById('b-perso'); if (!b) return; const n = S_ ? listeCoffresSac().length : 0; let p = b.querySelector('.pastille-coffres');
  if (!n) { if (p) p.remove(); return; } if (!p) { p = document.createElement('span'); p.className = 'pastille-coffres'; b.appendChild(p); } p.textContent = '🎁' + (n > 1 ? n : ''); }
document.addEventListener('click', (e) => { const b = e.target.closest('[data-coffre-sac], [data-coffres-tout]'); if (!b) return; e.preventDefault(); e.stopPropagation();
  if (b.dataset.coffreSac) ouvrirCoffreSac(b.dataset.coffreSac); else toutOuvrirCoffres(); }, true);
setInterval(() => { try { majPastilleCoffres(); } catch (e) { /* rien */ } }, 4000);
