'use strict';
/* ===================== ETAT ===================== */
let S_ = null;
const fmt = (n) => Math.round(n).toLocaleString('fr-FR');
const dureeLisible = (ms) => { const s = Math.max(1, Math.round(ms / 1000)); if (RAPIDE || s < 60) return s + ' s'; const m = Math.round(s / 60); if (m < 60) return m + ' min'; const h = Math.floor(m / 60), r = m % 60; return h + ' h' + (r ? ' ' + String(r).padStart(2, '0') : ''); }; /* (1 h 02 et non 1 h 2, 04/11/2026) */
const borne = (v, a, b) => Math.min(b, Math.max(a, v));
const hasard = (t) => t[Math.floor(Math.random() * t.length)];
const de = (nom) => (/^(Cawotte|Fraise)/.test(nom) ? 'de la ' : /^Houblon/.test(nom) ? 'du ' : /^[AEIOUYÉH]/i.test(nom) ? 'de l\'' : 'du ') + nom;
const NIVBAT = { qg: 'qg', nivPuits: 'nivPuits', enclos: 'enclos', voliere: 'voliere', nivEtal: 'nivEtal' };
const nivBat = (id) => 1 + (S_.amelio[id] || 0); /* le niveau d'un batiment, de 1 a 5 */
const DERIVE = { /* les reglages d'avant le 11/10, deduits du niveau du batiment : le code des effets n'a pas bouge */
  murs: () => nivBat('qg') - 1, cadenas: () => (nivBat('qg') >= 2 ? 1 : 0),
  reservoir: () => nivBat('nivPuits') - 1, poulie: () => (nivBat('nivPuits') >= 2 ? 1 : 0), arrosoir: () => [0, 0, 2, 3, 4][nivBat('nivPuits') - 1],
  abreuvoir: () => (nivBat('enclos') >= 2 ? 1 : 0), mangeoire: () => (nivBat('enclos') >= 3 ? 1 : 0), cisailles: () => [0, 0, 1, 2, 3][nivBat('enclos') - 1]
};
const niv = (id) => (DERIVE[id] ? DERIVE[id]() : (S_.amelio[id] || 0));
/* LA COURBE D'XP (16/10/2026, le tableau valide par Mathieu ; « des niveaux avec 4 d'XP d'ecart et d'autres avec 150 », la courbe d'avant s'aplatissait
   jusqu'au 50 puis une regle a part multipliait la Phase 2). Une seule formule pour tout : les niveaux 1 a 10 (le tutoriel) gardent leurs seuils ; ensuite
   chaque niveau coute un peu plus que le precedent, l'ecart valant 10 XP plus une part qui grandit de 17 % par niveau. Ca donne 101 XP pour passer au 11,
   592 pour le 50, 1 089 pour le 60, 3 100 pour le 70. Les sauvegardes d'avant gardent leur niveau (convertirXp). */
const seuilAncien = (n) => (n <= 1 ? 0 : Math.round(12 * Math.pow(n - 1, 1.7))); /* (la courbe d'avant le 13/10 : celle du tutoriel, et la conversion des sauvegardes) */
const SEUILS = (() => { const t = []; let cout = 0; for (let n = 0; n <= 101; n++) { if (n <= 10) { t[n] = seuilAncien(n); cout = n ? t[n] - t[n - 1] : 0; } else { cout += Math.round(10 + 0.03324 * Math.pow(1.17, n - 11)); t[n] = t[n - 1] + cout; } } return t; })();
const seuil = (n) => (n <= 1 ? 0 : SEUILS[Math.min(n, 101)]);
const NIV_MAX = 90; /* (90 depuis l'ile de Moon, 02/11/2026 ; 80 depuis le palier du Dragon Cochon, 20/10/2026 ; 70 avant) */ /* le niveau maximum de Paysan (la vague 60 demande le niveau 58) ; Phase 1 : niveaux 1 a 50, Phase 2 : de 50 a 100, un palier de 10 niveaux a la fois (11/10/2026) */
/* (09/11/2026, « dans l'arene de test, mets les nouveaux items qui vont jusqu'au niveau 100 », Mathieu) NIV_PLAFOND : 100 en mode test ; NIV_ESSAI : le niveau choisi
   pour un combat de l'Arene dev, rendu a la fin (ni l'un ni l'autre ne s'enregistre) */
let NIV_PLAFOND = 0, NIV_ESSAI = 0;
const niveau = (xp) => { const max = Math.max(NIV_MAX, NIV_PLAFOND); let n = 1; while (n < max && xp >= seuil(n + 1)) n++; return n; };
const capNiveau = () => (S_ && S_.vague ? Math.min(NIV_MAX, 50 + 10 * Math.max(0, Math.floor((S_.vague.num - 41) / 10))) : 50); /* (14/10/2026 : 50, puis 60 apres Crocabulia, 70 apres le Wa Wabbit) */ /* Phase 1 : niveau 50 au plus tant que Crocabulia (vague 50) n'est pas battue ; puis le palier des Wabbits ouvre jusqu'au 60 (plus tard, un palier de 10 niveaux a la fois jusqu'au 100) */
const texteCap = () => { const v = capNiveau(), P = v / 10 - 1, B = PALIERS_TOUS[P] && MONSTRES[PALIERS_TOUS[P].boss]; return (v === 50 ? 'le maximum de la Phase 1' : 'le maximum pour l\'instant') + (B && v < NIV_MAX ? '. Bats ' + leNom(B, true) + ' (vague ' + v + ') pour monter jusqu\'au niveau ' + Math.min(NIV_MAX, v + 10) : ''); }; /* (le plafond et le boss qui le leve : Crocabulia a la vague 50, le Wa Wabbit a la 60) */
/* l'XP de la laine et des plumes (35 % de leur valeur) ; le frein d'avance sur les vagues a ete retire le 16/10/2026 (« pas de malus en fonction du niveau ») */
const XP_FERME = 0.35; /* (14/10/2026, « faut nerf l'xp des plantes, j'suis deja 65 », Moonsbir : 0,6 et un frein de 1/2, 1/4, 1/10 avant ; ses 28 parcelles de Frostiz donnaient 1 700 XP par heure, trois fois les vagues ; maintenant environ 650, autant que les vagues) */
function xpFerme(n) { return gagnerXp(Math.max(1, Math.round(n * XP_FERME))); }
const duree = (c) => c.temps * MIN * Math.pow(0.85, niv('engrais')); /* (temps : en vraies minutes, 1,5 = 1 min 30) */
const capacite = () => Math.min([2, 3, 4, 5, 6][nivBat('enclos') - 1], Math.floor(S_.cases.filter((c) => c.type === 'enclos').length / 2)); /* et 2 cases d'enclos par Bouftou */
const debloquee = (c) => { if (niveau(S_.xp) >= c.niv) return true; if (!S_.cultAcquises) S_.cultAcquises = Object.keys(ANCIEN_NIV).filter((id) => niveau(S_.xp) >= ANCIEN_NIV[id]); return S_.cultAcquises.includes(c.id); };
const champVide = () => ({ c: null, pousse: 0, arrose: false, pretDepuis: 0, tofu: 0, vole: 0, tofuParti: 0, picore: false });
const recolte = (p) => Math.max(1, PAR_ID[p.c].rendement + (PAR_ID[p.c].arbre ? 0 : niv('faux')) - (p.vole || 0) - (p.picore ? Math.floor(PAR_ID[p.c].rendement / 2) : 0)); /* picore : anciennes sauvegardes ; un arbre, le bananier : son regime ne grossit pas avec la Faux (04/11/2026) */
/* (06/11/2026, « il a pu acheter 30 arbres banana, la limite devrait etre a 2 max et l'arbre coute 50k », Mathieu) : le bananier a un prix fixe, et on n'en possede
   jamais plus que son maximum, plantes et graines en reserve comptes ensemble */
const PRIX_BANANIER = 50000;
const arbresPossedes = (c) => (S_.graines[c.id] || 0) + S_.cases.filter((x) => x.type === 'champ' && x.c === c.id).length;
const arbresAchetables = (c) => (c.max ? Math.max(0, c.max - arbresPossedes(c)) : Infinity);
const prixGraine = (c) => c.arbre ? PRIX_BANANIER : Math.max(1, Math.round(c.graine * ((S_.cours[c.id] || 1) * 0.5 + 0.5) * [1, 1, 0.85, 0.85, 0.8][nivBat('nivEtal') - 1])); /* le prix des graines suit un peu le cours */
const prixAchatBle = () => Math.max(5, Math.ceil(prix('ble') * 2)); /* le Ble achete a l'HDV : le double de ce qu'il se revend (05/11/2026) */
function prix(id) {
  const v = PAR_ID[id];
  let p = v.prix * NERF_KAMAS * (S_.cours[id] || 1) * [1, 1.1, 1.1, 1.15, 1.2][nivBat('nivEtal') - 1];
  if (S_.crise && S_.crise.id === id) p *= 0.6;
  return Math.max(1, Math.round(p));
}
function casesInitiales() { /* tout le depart en herbe, puis la ferme 8 x 5 au milieu */
  const cases = casesDepart(), par = new Map(cases.map((c) => [c.id, c]));
  PLAN.forEach((ligne, j) => ligne.forEach((code, i) => {
    const cell = par.get(idCase(i, j)); cell.type = { G: 'grange', V: 'voliere', H: 'hdv', W: 'puits', E: 'epouvantail', B: 'foin', e: 'enclos', c: 'champ', '.': 'libre' }[code];
    if (cell.type === 'champ') Object.assign(cell, champVide());
  }));
  return cases;
}
function etatInitial() {
  const t = Date.now();
  const cours = {}; VENDABLES.forEach((v) => { cours[v.id] = 1; });
  const cases = casesInitiales();
  const champs = cases.filter((c) => c.type === 'champ');
  Object.assign(champs[0], { c: 'ble', pousse: 78 * SEC, arrose: true }); /* (presque mur : 78 s sur 1 min 30) */
  Object.assign(champs[1], { c: 'ble', pousse: 18 * SEC, arrose: false });
  return {
    kamas: 100, xp: 0, graine: 'ble', vu: t, rythme: REPERE_TEMPS, courbeXp: 3, cultures: 2, panosProfil: 1, pots: { petit: POTS_DEPART }, gelees: [], cases, terrains: {}, graines: { ble: 5 }, filets: 0, tofus: 0, peche: { cannes: [1], main: 0 }, gardien: null, perso: null, eau: CAPACITE_EAU, voliere: { plumes: 0, accu: 0 }, sauvage: null, prochainVoleur: t + 1.5 * MIN, prochainRaid: t + 6 * MIN, fleches: 0, arbaleteArmee: false, carreaux: 0, vague: { num: 1, repos: 0 },
    grange: { ble: 4 }, bouftous: [{ nom: 'Bêêrnard', rassasie: t, laine: 1, accu: 0 }],
    amelio: {}, citerne: 0, bats: {}, equip: {}, sac: {}, cours, coursAvant: Object.assign({}, cours), prochainCours: t + CADENCE_COURS, crise: null, prochaineCrise: t + CADENCE_CRISE, parcellesAchetees: 0, ileRonde: 1, niveauxBat: 1, cultAcquises: [] /* (nee sur l'ile ronde, aux niveaux de batiments et aux cultures d'aujourd'hui : rien a convertir ; sans niveauxBat, le premier rechargement remettait les batiments ameliores au niveau 1, bug corrige le 16/10/2026) */
  };
}
/* 11/10/2026 : les ameliorations deja achetees deviennent le niveau equivalent du batiment (on ne perd rien) */
function convertirNiveaux(e) {
  if (e.niveauxBat) return;
  if ((e.amelio || {}).arbalete > 1) { e.amelio.arbDegats = Math.min(3, e.amelio.arbalete - 1); e.amelio.arbalete = 1; } /* (l'arbalete d'avant ses ameliorations separees) */
  const a = e.amelio = e.amelio || {}, g = (id) => a[id] || 0;
  a.qg = Math.min(4, Math.max(g('murs'), g('cadenas')));
  if (g('arbalete')) a.arbalete = Math.min(5, 1 + Math.round((g('arbDegats') + g('arbCadence') + g('arbChargeur') + g('arbPortee')) / 4));
  a.nivPuits = Math.max(g('reservoir'), g('poulie') ? 1 : 0, [0, 2, 2, 3, 4][Math.min(4, g('arrosoir'))]);
  a.enclos = Math.max([0, 1, 3][Math.min(2, g('enclos'))], g('abreuvoir') ? 1 : 0, g('mangeoire') ? 2 : 0, [0, 2, 3, 4][Math.min(3, g('cisailles'))]);
  a.nivEtal = g('remise') ? 2 : g('charrette') ? 1 : 0;
  const tours = 1 + Math.max(g('tours'), g('toursPortee'), Math.min(3, g('toursPv')));
  (e.cases || []).forEach((c) => { if (c.type === 'tour') c.niv = Math.min(5, tours); });
  ['murs', 'cadenas', 'arbDegats', 'arbCadence', 'arbChargeur', 'arbPortee', 'reservoir', 'poulie', 'arrosoir', 'abreuvoir', 'mangeoire', 'cisailles', 'charrette', 'remise', 'tours', 'toursPortee', 'toursPv'].forEach((id) => { delete a[id]; });
  e.niveauxBat = 1;
}
/* LA SAUVEGARDE A L'OUVERTURE (refonte du 16/10/2026) : d'abord les valeurs par defaut des champs ajoutes au fil du temps (completerSauvegarde),
   puis les conversions d'anciens formats (MIGRATIONS : chacune sait si elle a deja ete faite, et ne s'applique qu'une fois). Une ferme neuve
   (etatInitial) nait deja a jour. Ajouter un champ : sa valeur par defaut ici et dans etatInitial ; changer un format : une migration de plus. */
function completerSauvegarde(e) {
  if (!e.graines) e.graines = { ble: 3 };
  if (!e.filets) e.filets = 0;
  if (!e.peche) e.peche = { cannes: [1], main: 0 }; /* (la peche, 11/11/2026 : les cannes qu'on a (la canne de bambou vient avec la cabane), celle qu'on tient ; 14g-cabane.js) */
  if (!e.tofus) e.tofus = 0;
  if (!e.tofusDores) e.tofusDores = 0; /* (les Tofus dores de la voliere, comptes dans tofus, 07/11/2026) */
  if (e.gardien === undefined) e.gardien = null; /* le gardien de la ferme (niveau 60) : { type: 'chat' ou 'chien', rassasie, depuis } */
  if (typeof e.eau !== 'number') e.eau = CAPACITE_EAU;
  if (!e.voliere) e.voliere = { plumes: 0, accu: 0 };
  if (e.voliere.plumesD === undefined) { e.voliere.plumesD = 0; e.voliere.accuD = 0; } /* (les Plumes dorees, 07/11/2026) */
  if (e.sauvage === undefined) e.sauvage = null;
  if (!e.prochainVoleur) e.prochainVoleur = Date.now() + 1.5 * MIN;
  if (typeof e.fleches !== 'number') e.fleches = 0;
  if (e.arbaleteArmee === undefined) e.arbaleteArmee = false;
  if (typeof e.carreaux !== 'number') e.carreaux = e.arbaleteArmee ? 1 : 0;
  if (!e.prochainRaid) e.prochainRaid = Date.now() + 6 * MIN;
  if (!e.vague) e.vague = { num: 1, repos: 0 };
  if (!e.bats) e.bats = {};
  if (!e.equip) e.equip = {};
  if (typeof e.citerne !== 'number') e.citerne = [0, 6, 12, 20, 32][Math.min(4, (e.amelio || {}).arrosoir || 0)];
  if (!e.sac) e.sac = {};
  if (!e.pots) e.pots = { petit: POTS_DEPART }; /* (13/10/2026 : les pots de gelee, 3 petits pour commencer) */
  if (!Array.isArray(e.gelees)) e.gelees = [];
}
const MIGRATIONS = [convertirNiveaux, convertirRythme, convertirXp, convertirCultures, convertirPanos, plafonnerArbres, cadeauRevancheMada, cadeauDoreMathieu, rendreRevancheDragon]; /* (les niveaux des batiments le 11/10, le rythme fixe le 13/10, la courbe d'XP le 13/10 puis le 16/10, les temps de pousse le 16/10) */
function charger() {
  try { const e = JSON.parse(localStorage.getItem(CLE)); if (e && Array.isArray(e.cases) && typeof e.kamas === 'number') { completerSauvegarde(e); MIGRATIONS.forEach((f) => f(e)); return e; } } catch (err) { /* rien */ }
  return null;
}
/* les parties d'avant le rythme fixe (13/10/2026) : leurs durees en cours etaient comptees a l'ancienne minute de 60 s. On les ramene au nouveau rythme :
   chaque date, passee ou a venir, se rapproche d'autant de l'instant de la sauvegarde, et les compteurs (pousse, laine, croissance, plumes) rapetissent
   pareil. Une Fraise a moitie poussee reste a moitie poussee, une vague qui se preparait encore 3 h attend 9 min. */
/* les courbes d'XP d'avant, pour convertir les sauvegardes : la 1 (jusqu'au 13/10/2026), la 2 (du 13/10 au 16/10, la 1 plus une Phase 2 multipliee) */
const seuilCourbe = (v, n) => { if (n <= 1) return 0; if (v < 2 || n <= 50) return seuilAncien(n); let t = seuilAncien(50); for (let k = 51; k <= n; k++) t += Math.round((seuilAncien(k) - seuilAncien(k - 1)) * (1 + 0.3 * (k - 50))); return t; };
/* la courbe d'XP change (13/10, puis 16/10/2026) : chaque partie du compte garde son niveau, et sa progression dans ce niveau (la moitie du 37 reste la moitie du 37) */
function convertirXp(e) {
  [e].concat(Object.values(e.parties || {})).forEach((p) => {
    if (!p || p.courbeXp >= 3 || typeof p.xp !== 'number') return; const v = p.courbeXp || 1, ancien = (n) => seuilCourbe(v, Math.min(n, 101)); p.courbeXp = 3;
    let L = 1; while (L < 100 && p.xp >= ancien(L + 1)) L++;
    const f = (p.xp - ancien(L)) / Math.max(1, ancien(L + 1) - ancien(L)); p.xp = Math.floor(seuil(L) + f * (seuil(L + 1) - seuil(L)));
  });
}
/* les temps de pousse changent (16/10/2026) : un champ en cours garde son avancee (a moitie pousse, il reste a moitie pousse), dans toutes les parties */
const TEMPS_CULTURES_1 = { ble: 0.75, orge: 2.25, avoine: 6, houblon: 15, lin: 30, seigle: 72, riz: 30, malt: 45, chanvre: 60, mais: 72, millet: 72, frostiz: 90 };
/* les pieces des panoplies Tortue et Kanniboul tombees avant leur profil (06/11/2026) : chaque caracteristique prend le multiplicateur du profil, le jet reste le meme
   (une Coiffe de la Tortue a 520 PV passe a 832), borne a la nouvelle fourchette */
/* les bananiers : jamais plus que leur maximum, plantes et graines en reserve comptes ensemble (06/11/2026, « il en a achete 30, retire-lui 28 et laisse-lui les deux
   qui sont en terre », Mathieu, pour Madazoo : les graines achetees avant la limite de l'HDV) ; a chaque chargement, les plantes d'abord, puis les graines */
/* (07/11/2026, « redonne le droit de refaire 1 fois le Koulosse en difficile a Mada », Mathieu) : la revanche du Koulosse (palier 6) du samedi 07/11 rendue une fois,
   a la seule Iop « Madazezette » ; marquee dans la partie pour ne jamais se rejouer */
function cadeauRevancheMada(e) {
  [e].concat(Object.values(e.parties || {})).forEach((p) => { if (!p || !p.perso || p.perso.nom !== 'Madazezette' || p.perso.classe !== 'iop') return;
    p.cadeaux = p.cadeaux || {}; if (p.cadeaux.revancheKoulosse0711) return; p.cadeaux.revancheKoulosse0711 = true;
    if (p.bossRejoue && p.bossRejoue['6'] === 'Sat Nov 07 2026') delete p.bossRejoue['6']; });
}
/* (08/11/2026, « donne-moi un Tofu doré dans ma ferme, je me fais scam », Mathieu) : un Tofu doré offert une fois, directement dans la voliere de son Cra
   (Rorschach) ; s'il n'y a pas de place, il prend celle d'un Tofu normal, comme a la capture ; annonce au chargement (majTofuDore, 14f-tofus.js) */
/* (11/11/2026, « donne-moi le droit de refaire le Dragon Cochon, je lui tapais du 1, impossible de le finir », Mathieu) : du 10/11 a 20 h 55 au 11/11, le Dragon Cochon
   ne prenait que 1 degat par coup (un reglage des tetes de l'Ancestral portait le meme nom qu'un des siens, 20-monstres.js) : personne ne pouvait le battre. La revanche
   du Dragon Cochon (palier 7) faite le 11/11 est rendue une fois, a tous les joueurs ; marquee dans la partie pour ne jamais se rejouer */
function rendreRevancheDragon(e) {
  [e].concat(Object.values(e.parties || {})).forEach((p) => { if (!p || !p.perso) return;
    p.cadeaux = p.cadeaux || {}; if (p.cadeaux.revancheDragon1111) return; p.cadeaux.revancheDragon1111 = true;
    if (p.bossRejoue && p.bossRejoue['7'] === 'Wed Nov 11 2026') delete p.bossRejoue['7']; });
}
function cadeauDoreMathieu(e) {
  [e].concat(Object.values(e.parties || {})).forEach((p) => { if (!p || !p.perso || p.perso.classe !== 'cra' || !/^Rorschach/.test(p.perso.nom || '')) return;
    p.cadeaux = p.cadeaux || {}; if (p.cadeaux.tofuDore0811) return; p.cadeaux.tofuDore0811 = true;
    const cap = 2 + 2 * ((p.amelio || {}).voliere || 0); if ((p.tofus || 0) < cap) p.tofus = (p.tofus || 0) + 1; p.tofusDores = Math.min(p.tofus || 0, (p.tofusDores || 0) + 1); p.cadeauDoreVu = false; });
}
function plafonnerArbres(e) {
  [e].concat(Object.values(e.parties || {})).forEach((p) => { if (!p || !p.graines || !Array.isArray(p.cases)) return;
    CULTURES.filter((c) => c.max).forEach((c) => { const plantes = p.cases.filter((x) => x.type === 'champ' && x.c === c.id).length, g = p.graines[c.id] || 0, garde = Math.max(0, c.max - plantes); if (g > garde) p.graines[c.id] = garde; }); });
}
function convertirPanos(e) {
  [e].concat(Object.values(e.parties || {})).forEach((p) => {
    if (!p || p.panosProfil >= 1) return; p.panosProfil = 1;
    Object.entries(p.jets || {}).forEach(([k, j]) => { const o = OBJETS[baseObjet(k)]; if (!o || o.leg || o.arme || !j) return;
      Object.keys(j).forEach((c) => { const m = multPano(o.pano, c); if (m === 1 || !o.stats[c]) return; const [a, b] = fourchette(o.stats[c]); j[c] = Math.min(b, Math.max(a, Math.round(j[c] * m))); }); });
  });
}
function convertirCultures(e) {
  [e].concat(Object.values(e.parties || {})).forEach((p) => {
    if (!p || p.cultures >= 2 || !Array.isArray(p.cases)) return; p.cultures = 2;
    p.cases.forEach((x) => { const t0 = x.type === 'champ' && x.c && TEMPS_CULTURES_1[x.c]; if (t0 && typeof x.pousse === 'number') x.pousse *= PAR_ID[x.c].temps / t0; });
  });
}
function convertirRythme(e) {
  const r = REPERE_TEMPS, k = r / (e.rythme || 1); if (Math.abs(k - 1) < 1e-9) return; const ref = e.vu || Date.now();
  const dates = (o) => { for (const c in o) { const v = o[c]; if (typeof v === 'number') { if (v > 1.5e12 && v < 4e12) o[c] = Math.round(ref + (v - ref) / k); } else if (v && typeof v === 'object') dates(v); } };
  dates(e);
  (e.cases || []).forEach((p) => { if (typeof p.pousse === 'number') p.pousse /= k; });
  (e.bouftous || []).forEach((b) => { if (typeof b.accu === 'number') b.accu /= k; if (typeof b.grandi === 'number') b.grandi /= k; });
  if (e.voliere && typeof e.voliere.accu === 'number') e.voliere.accu /= k;
  e.rythme = r;
}
/* LE MODE TEST (05/11/2026, 27b-arene-dev.js) : tant qu'il dure, rien n'est enregistre, ni sur l'appareil ni en ligne (sauver ici, rpc et nuageEnvoyer dans 05-nuage.js) ;
   la vraie partie reste telle qu'elle etait, la page rechargee la reprend */
let MODE_TEST = false; const ETAT_TEST = { n: 1, immortel: false, tours: null, sansDef: false }; /* (tours : null les siennes, 0 coupees, 1 a 6 un niveau force ; sansDef : arbalete et Pepito-Tron coupes) */
function sauver() { if (MODE_TEST) return; try { localStorage.setItem(CLE, JSON.stringify(S_)); } catch (err) { /* rien */ } nuageMarquer(); }
