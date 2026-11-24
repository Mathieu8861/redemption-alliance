'use strict';
/* L'ENCLOS NIVEAU 6 ET LES RATIONS (24/11/2026, version dev : mode test seulement, comme le puits niveau 6). Mathieu : « travaille l'upgrade de l'enclos a
   Bouftou aussi niveau 6 et on peut leur donner de nouveaux trucs a manger qui fait monter le prix de leurs laines ».
   - le niveau 6, le domaine lainier : 16 cases, 7 Bouftous, 11 laines avant la tonte, et deux pieces de plus dans l'enclos (blender/enclos6.py) : le silo a
     rations (son auge a trois cases : avoine, mais, quisnoa) et le sechoir a laines (quatre echeveaux, un panier de pelotes) ;
   - les rations : a la place du Ble, un Bouftou blanc adulte peut manger de l'Avoine, du Mais ou du Quisnoa de la grange ; tant que ce repas dure, sa laine
     est de la Laine fine, soyeuse ou doree, qui se vend plus cher. La ration se choisit pour tout l'enclos dans sa fenetre ; la mangeoire la sert seule, et
     revient au Ble quand il n'y en a plus. Les Bouftous noirs (leur laine noire) et les bebes mangent toujours du Ble.
   - chaque repas a ration est note sur le Bouftou (debut, fin, laine) : une laine prend la qualite du repas pendant lequel elle pousse.
   Chiffres de depart, a valider par Mathieu. */
const ENCLOS6 = { cout: 300000, niv: 100, cases: 16, bouftous: 7, laines: 11 };
const LAINES_RATION = [
  { id: 'laine_fine', nom: 'Laine fine', prix: 130, xp: 6 },
  { id: 'laine_soyeuse', nom: 'Laine soyeuse', prix: 220, xp: 9 },
  { id: 'laine_doree', nom: 'Laine dorée', prix: 360, xp: 14 }];
const RATIONS = [
  { id: 'ble', culture: 'ble', n: REPAS, laine: 'laine' },
  { id: 'avoine', culture: 'avoine', n: 2, laine: 'laine_fine' },
  { id: 'mais', culture: 'mais', n: 1, laine: 'laine_soyeuse' },
  { id: 'quisnoa', culture: 'quisnoa', n: 1, laine: 'laine_doree' }];
const enclos6 = () => !!S_ && nivBat('enclos') >= 6;
const peutRation = (b) => !!b && adulte(b) && !b.noir;
const rationChoisie = () => { if (!enclos6()) return null; const R = RATIONS.find((x) => x.id === S_.ration); return R && R.id !== 'ble' ? R : null; };
const nomRation = (R) => R.n + ' ' + PAR_ID[R.culture].nom;
function segmentRation(b, debut, fin, laine) { if (fin <= debut) return; b.rq = (b.rq || []).filter((s) => s[1] > debut - 1); b.rq.push([debut, fin, laine]); }
const laineDuMoment = (b, t) => { const s = (b.rq || []).find((x) => t >= x[0] && t < x[1]); return s ? s[2] : null; };

/* ---- le modele : le silo et le sechoir, a l'echelle de la cloture du jeu ---- */
let enclos6Charge = null;
function chargerEnclos6() {
  if (enclos6Charge) return enclos6Charge;
  return (enclos6Charge = chargerGlb('assets/modeles/jeu/enclos6.glb?v=' + (VERSIONS_FICHIERS['enclos6.glb'] || VERSION_MODELES)).then((sc) => {
    versToon(sc, { normales: 0.01, sansContour: SC_BATI });
    const o = sc.getObjectByName('Cloture1').clone(true); o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrixWorld(true); /* (la meme mesure que kDe de 09-modeles.js) */
    const b = new T.Box3().setFromObject(o), d = new T.Vector3(); b.getSize(d); const kc = 2.0 / Math.max(d.x, d.z), O = new T.Vector3(0, 0, 0);
    MODELES.silo6 = gabaritEchelle(sc, 'Silo6', kc * 0.9, O); MODELES.sechoir6 = gabaritEchelle(sc, 'Sechoir6', kc, O);
    if (enclos6()) appliquerEnclos();
  }).catch(() => { enclos6Charge = null; }));
}
{ const appliquerEnclos6 = appliquerEnclos; appliquerEnclos = function () { const r = appliquerEnclos6.apply(this, arguments);
  try {
    if (!enclos6() || !MODELES.silo6 || !clotureMesh) return r; const E = casesEnclos(); if (E.length < 3) return r;
    const P = E.map(posCase), bords = []; /* (les memes cases que appliquerEnclos : le portillon, l'auge, puis les pieces dans les cases les plus loin de l'auge) */
    E.forEach((c) => { const q = posCase(c); COTES.forEach(([di, dj]) => { if (!enclosVoisin(c, di, dj)) bords.push({ c, di, dj, z: q.z + dj * S / 2 }); }); });
    const devant = bords.filter((x) => x.dj === 1), zMax = Math.max(...devant.map((x) => x.z)), rang = devant.filter((x) => Math.abs(x.z - zMax) < 0.1).sort((x, y) => posCase(x.c).x - posCase(y.c).x), porte = rang[Math.floor((rang.length - 1) / 2)];
    const fond = E.slice().sort((a, b) => a.j - b.j || b.i - a.i)[0], qf = posCase(fond);
    const loin = E.filter((c) => c !== fond && (!porte || c !== porte.c)).map((c) => [c, posCase(c)]).sort((a, b) => Math.hypot(b[1].x - qf.x, b[1].z - qf.z) - Math.hypot(a[1].x - qf.x, a[1].z - qf.z));
    [['silo6', 3], ['sechoir6', 4]].forEach(([nom, k]) => { const L = loin[k]; if (L) clotureMesh.add(batiment(nom, L[1].x, L[1].y, L[1].z - 0.15, L[0].id, 0)); });
    void P;
  } catch (e) { /* (un enclos en cours d'amenagement) */ }
  return r; }; }

/* ---- l'activation : le niveau 6 dans les ameliorations, les laines a l'HDV ---- */
function activerEnclos6() {
  const a = AMELIOS.find((x) => x.id === 'enclos'); if (!a || a.couts.length >= 5) return;
  a.couts.push(ENCLOS6.cout); a.nivs.push(ENCLOS6.niv);
  a.desc += ' Niveau 6 : le domaine lainier, ' + ENCLOS6.cases + ' cases, ' + ENCLOS6.bouftous + ' Bouftous, ' + ENCLOS6.laines + ' laines, avec le silo à rations et le séchoir à laines : nourris tes Bouftous à l\'Avoine, au Maïs ou au Quisnoa pour de la Laine fine, soyeuse ou dorée, bien plus chère.';
  PALIERS_BAT.enclos.push('Le domaine lainier : ' + ENCLOS6.cases + ' cases, ' + ENCLOS6.bouftous + ' Bouftous, ' + ENCLOS6.laines + ' laines, le silo à rations et le séchoir à laines.');
  const G = GAINS.enclos; G.looks.push('le domaine lainier, son silo et son séchoir'); G.stats[0][2].push(ENCLOS6.bouftous); G.stats[1][2].push(ENCLOS6.cases); G.stats[2][2].push(ENCLOS6.laines);
  G.stats[3][2].push(Math.round(DUREE_REPAS * 1.5 / MIN)); G.neufs = G.neufs || {}; G.neufs[5] = [['laine', 'Les rations du silo : Avoine, Maïs ou Quisnoa pour de la laine fine, soyeuse ou dorée']];
  LAINES_RATION.forEach((L) => { if (!PAR_ID[L.id]) { PAR_ID[L.id] = L; VENDABLES.push(L); } if (S_ && S_.cours && !S_.cours[L.id]) S_.cours[L.id] = 1; });
  chargerEnclos6();
}
const entrerModeTestEnclos6 = entrerModeTest; entrerModeTest = function () { const r = entrerModeTestEnclos6.apply(this, arguments); if (MODE_TEST) activerEnclos6(); return r; };
if (SORTIE_P11) activerEnclos6(); /* (comme le puits niveau 6 : avant le chargement de la partie, sinon un enclos niveau 6 serait ramene au 5) */

/* ---- la mangeoire sert la ration, et chaque laine prend la qualite de son repas ---- */
{ const avancerEnclos6 = avancer; avancer = function (maintenant) {
  if (!enclos6()) return avancerEnclos6.apply(this, arguments);
  const R = rationChoisie(), t0 = Math.max(maintenant - borne(maintenant - S_.vu, 0, 10 * 3600e3), 0);
  if (R && niv('mangeoire')) S_.bouftous.forEach((b) => { if (peutRation(b) && maintenant >= b.rassasie && (S_.grange[R.culture] || 0) >= R.n) {
    S_.grange[R.culture] -= R.n; const d = dureeRepasDe(b); segmentRation(b, maintenant, maintenant + d, R.laine); b.rassasie = maintenant + d; } });
  const avant = new Map(S_.bouftous.map((b) => [b, b.laine])), r = avancerEnclos6.apply(this, arguments);
  S_.bouftous.forEach((b) => { const n = b.laine - (avant.has(b) ? avant.get(b) : b.laine); if (n > 0 && !b.noir && b.rq && b.rq.length) {
      const z = Math.min(maintenant, b.rassasie), a = Math.min(t0, z); b.lq = b.lq || {};
      for (let i = 0; i < n; i++) { const L = laineDuMoment(b, a + (i + 0.5) / n * (z - a)); if (L && L !== 'laine') b.lq[L] = (b.lq[L] || 0) + 1; } }
    if (b.rq && b.rq.length) b.rq = b.rq.filter((s) => s[1] > maintenant); });
  return r; }; }

/* ---- nourrir a la main : la ration choisie, sinon le Ble ---- */
{ const nourrirEnclos6 = ACTIONS.nourrir; ACTIONS.nourrir = function (j) {
  const b = S_.bouftous[j], R = rationChoisie(); if (!R || !peutRation(b)) return nourrirEnclos6.apply(this, arguments);
  if ((S_.grange[R.culture] || 0) < R.n) { toast('Plus assez de ' + PAR_ID[R.culture].nom + ' dans la grange : ' + b.nom + ' mange du Blé.'); return nourrirEnclos6.apply(this, arguments); }
  const d = dureeRepasDe(b), t = Date.now(), debut = Math.max(t, b.rassasie), fin = Math.min(debut + d, t + 3 * d);
  if (fin <= debut) { toast(b.nom + ' est repu pour ' + dureeLisible(b.rassasie - t) + ' : garde ta ration pour plus tard.'); return; }
  S_.grange[R.culture] -= R.n; segmentRation(b, debut, fin, R.laine); compter('repas'); son('nourri'); b.rassasie = fin; b.affame = false;
  toast(b.nom + ' mange ' + nomRation(R) + ' : sa laine sera de la ' + PAR_ID[R.laine].nom + ' tant que ce repas dure.'); rendreBouftous(); rendreGrange(); }; }

/* ---- la tonte : chaque qualite dans la grange ---- */
{ const tondreEnclos6 = ACTIONS.tondre; ACTIONS.tondre = function (j) {
  const b = S_.bouftous[j]; if (!b || !b.laine || b.noir || !b.lq || !Object.keys(b.lq).length) return tondreEnclos6.apply(this, arguments);
  const parts = []; let total = 0, xp = 0;
  LAINES_RATION.slice().reverse().forEach((L) => { const n = Math.min(b.lq[L.id] || 0, b.laine - total); if (n > 0) { S_.grange[L.id] = (S_.grange[L.id] || 0) + n; total += n; xp += L.xp * n; parts.push('+' + n + ' ' + L.nom); } });
  const reste = b.laine - total; if (reste > 0) { S_.grange.laine = (S_.grange.laine || 0) + reste; xp += LAINE.xp * reste; parts.push('+' + reste + ' ' + LAINE.nom); }
  compter('laines', b.laine); son('tonte'); xpFerme(xp); b.laine = 0; b.lq = {};
  toast(parts.join(', ') + ' grâce à ' + b.nom + '.', 'or'); rendreBouftous(); rendreGrange(); }; }

/* ---- la fenetre de l'enclos : le choix de la ration, et la laine de chaque Bouftou ---- */
function decorerEnclos6() {
  const M = $('modale'); if (!M) return; const R0 = rationChoisie(), choisi = R0 ? R0.id : 'ble';
  const boutons = RATIONS.map((R) => { const st = S_.grange[R.culture] || 0, L = PAR_ID[R.laine], ok = st >= R.n;
    return '<button class="btn mini ' + (R.id === choisi ? 'kamas' : 'discret') + '" data-ration="' + R.id + '" title="' + fmt(st) + ' en grange">' + nomRation(R) + ' → ' + L.nom + ' (' + prix(L.id) + ' ' + KAMA + ')' + (ok ? '' : ' · plus en grange') + '</button>'; }).join('');
  const bloc = document.createElement('div'); bloc.className = 'art'; bloc.dataset.rations = '1';
  bloc.innerHTML = ico('laine_doree') + '<div><b>Les rations du silo</b><div class="desc">Ce que mangent tes Bouftous blancs adultes, à la main comme à la mangeoire. Tant que le repas dure, leur laine prend sa qualité. Plus de ration en grange : retour au Blé. Les noirs et les bébés mangent toujours du Blé.</div><div class="puces" style="flex-wrap:wrap;gap:6px">' + boutons + '</div></div>';
  const premier = M.querySelector('.art.eb'); if (premier) premier.parentNode.insertBefore(bloc, premier); else { const h = M.querySelector('h2'); if (h) h.insertAdjacentElement('afterend', bloc); }
  M.querySelectorAll('[data-nourrir]').forEach((x) => { const b = S_.bouftous[+x.dataset.nourrir]; if (R0 && peutRation(b) && (S_.grange[R0.culture] || 0) >= R0.n) x.textContent = 'Nourrir · ' + nomRation(R0);
    const L = b && b.lq && LAINES_RATION.filter((q) => b.lq[q.id]).map((q) => b.lq[q.id] + ' ' + q.nom.replace('Laine ', '') + (b.lq[q.id] > 1 ? 's' : '')); const info = x.closest('.art') && x.closest('.art').children[1];
    const cours = b && laineDuMoment(b, Date.now()); if (info && (L && L.length || (cours && cours !== 'laine'))) info.insertAdjacentHTML('beforeend', '<div class="eb-ligne">' + picto('laine', GRIS_PICTO) + '<span>' + (L && L.length ? 'Dont ' + L.join(', ') : 'Repas en cours') + '</span>' + (cours && cours !== 'laine' ? '<b class="eb-suite">' + PAR_ID[cours].nom + ' en ce moment</b>' : '') + '</div>'); });
}
{ const ouvrirEnclosE6 = ouvrirEnclos; ouvrirEnclos = function () { const r = ouvrirEnclosE6.apply(this, arguments); try { if (enclos6()) decorerEnclos6(); } catch (e) { /* rien */ } return r; }; }
document.addEventListener('click', (e) => { const x = e.target.closest && e.target.closest('[data-ration]'); if (!x || !S_) return;
  S_.ration = x.dataset.ration; sauver(); ouvrirEnclos(); toast(x.dataset.ration === 'ble' ? 'Tes Bouftous mangent du Blé.' : 'Tes Bouftous blancs mangeront ' + nomRation(RATIONS.find((R) => R.id === x.dataset.ration)) + ' par repas.'); });
