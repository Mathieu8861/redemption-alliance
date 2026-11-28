'use strict';
/* LE LABO A PLUSIEURS, DEUXIEME TEMPS : LE COMBAT PARTAGE (28/11/2026, « ok lance le deuxieme temps », Mathieu ; jeu-ferme/MULTIJOUEUR.md, facon A) :
   le jeu du chef fait foi. Il fait tourner le labo comme en solo (monstres, Docteur, salles, coups) et envoie environ 10 fois par seconde l'etat du combat
   (chaque monstre : position, hauteur, direction, vie ; les degats donnes, par qui) ; les autres n'ont plus leurs propres monstres : ils affichent ceux du chef
   (des « reflets », qui glissent d'une position a l'autre), et envoient au chef leurs coups (le monstre vise, les degats, critique ou non).
   - Les monstres visent un joueur : celui qui les a frappes dans les 3 dernieres secondes, sinon le plus proche (pas toujours le chef). Le temps de mettre a jour un
     monstre qui vise un autre joueur, le jeu du chef pose son perso a la place de ce joueur : le monstre le poursuit, l'attaque, et le coup part chez lui.
     Les coups en retard (projectiles, coups au bout de l'elan) gardent leur cible. Les zones rouges (zoneDanger) s'affichent chez tout le monde et touchent
     chaque joueur qui est dedans au moment du coup ; chacun encaisse avec ses propres resistances.
   - Vie selon le nombre de joueurs au depart (combat.joueurs, VIE_JOUEURS_LABO).
   - Un joueur a terre se releve au bout de 10 s, au debut de la salle, tant qu'un coequipier tient debout ; tous a terre : defaite pour tous.
   - Victoire : chacun son bilan, son coffre et sa reussite de la semaine (dans l'essai, rien n'est enregistre) ; un joueur qui avait deja ses 5 reussites aide
     sans recompense.
   - Le chef qui s'en va : les autres rentrent, avec un message.
   - Les sorts des autres se voient (une onde a leur couleur), et leur vie au-dessus de leur tete.
   Seulement dans le labo lance a plusieurs (MULTI.role), donc seulement pour ceux qui voient les Contacts. Le labo seul ne change pas. */
const MULTI_C = { morts: [], tick: 0, seq: 0, ids: new WeakMap(), etats: new Map(), reflets: new Map(), dg: [], coups: [], touches: [], terre: {}, cible: null, rejeu: false, applique: false, tEtat: 0, nEtat: 0, octets: 0, auteur: null, chefPerdu: 0, vu: {}, env: {}, rec: {}, sEvt: 0, sVu: {}, defaite: false, zones: [], sorts: [], tCoups: 0 };
const MC_PAS = { pres: 35, complet: 20, etat: 50, aggro: 3000, choix: 1000, terre: 10, perdu: 4000, glisse: 6 };
const multiCombat = () => !!(MULTI.role && typeof lieu !== 'undefined' && lieu === 'donjon' && combat && combat.genre === 'donjon' && !combat.fin && MULTI.canal);
const chefMulti = () => multiCombat() && MULTI.role === 'chef';
const inviteMulti = () => multiCombat() && MULTI.role === 'invite';
const ST_NATIF = window.setTimeout.bind(window); /* (avant l'habillage plus bas) */
const envoyerMulti = (event, payload) => { try { if (MULTI.canal) { const s = JSON.stringify(payload); MULTI_C.octets += s.length; MULTI_C.env[event] = (MULTI_C.env[event] || 0) + 1; MULTI.canal.send({ type: 'broadcast', event, payload }).catch(() => {}); } } catch (e) { /* rien */ } };
/* les evenements qui comptent (a terre, debout, salles, grilles, fin) : numerotes et renvoyes deux fois, au cas ou un message se perd ; chacun n'est applique qu'une fois */
const evtMulti = (P) => { P.s = String(MULTI.moi || '').slice(0, 6) + ':' + (++MULTI_C.sEvt); envoyerMulti('evt', P); ST_NATIF(() => envoyerMulti('evt', P), 400); ST_NATIF(() => envoyerMulti('evt', P), 1200); };
/* en combat partage, la position part dans le message du combat (un seul message par joueur et par dixieme de seconde) : lu par 29zr */
const posDansCombat = () => multiCombat();
/* le rythme des envois selon la taille du groupe (chaque message part chez tous les autres : a 5, on reste sous 100 messages recus par seconde en tout) */
const pasEnvoiM = () => { const n = MULTI.nDepart || 2; return MULTI.role === 'chef' ? (n <= 3 ? 100 : 150) : n <= 2 ? 100 : n <= 3 ? 150 : 250; };
const uidM = (o) => { let u = MULTI_C.ids.get(o); if (!u) { u = ++MULTI_C.seq; MULTI_C.ids.set(o, u); } return u; };
const monstreUid = (u) => combat && combat.monstres.find((o) => MULTI_C.ids.get(o) === u);

/* ---- le depart : qui est chef, combien de joueurs ---- */
{ const ldg0 = lancerDepartGroupe; lancerDepartGroupe = function () { const g = monGroupe(); MULTI.role = 'chef'; MULTI.chefId = MULTI.moi; MULTI.nDepart = Math.max(1, ((g && g.membres) || []).length); MULTI_C.terre = {}; return ldg0.apply(this, arguments); }; }
{ const rd0 = recevoirDepart; recevoirDepart = function (P) { if (P && Array.isArray(P.membres) && P.membres.includes(MULTI.moi) && P.chef !== MULTI.moi && !combat && lieu === 'ferme') {
    MULTI.role = 'invite'; MULTI.chefId = P.chef; MULTI.nDepart = P.membres.length; MULTI_C.terre = {}; MULTI_C.etats.clear(); MULTI_C.reflets.clear();
    let S = { n: 0 }; try { S = reussitesDonjon(); } catch (e) { /* rien */ } MULTI.sansRecompense = S.n >= DONJON_SEMAINE.max; }
  return rd0.apply(this, arguments); }; }
/* la vie selon le nombre de joueurs : posee avant que les camps sortent */
{ const pc0 = posterCamps; posterCamps = function (c) { if (MULTI.role && c) c.joueurs = Math.max(1, Math.min(5, MULTI.nDepart || 1)); return pc0.apply(this, arguments); }; }

/* ---- les canaux : branches par 29zr (brancherCombatMulti) ---- */
function brancherCombatMulti(ch) {
  const on = (ev, f) => ch.on('broadcast', { event: ev }, ({ payload }) => { MULTI_C.rec[ev] = (MULTI_C.rec[ev] || 0) + 1; f(payload); }); /* (compte les messages recus, pour les mesures) */
  const sortsDe = (P) => { if (P && Array.isArray(P.s)) P.s.forEach((x) => { try { recevoirSort(x); } catch (e) { /* rien */ } }); };
  on('etat', (P) => { if (!P) return; if (P.j) recevoirPos(P.j); if (P.h) recevoirTouches({ l: P.h }); recevoirEtat(P); if (Array.isArray(P.z)) P.z.forEach((Z) => recevoirZone(Z)); sortsDe(P); });
  on('coups', (P) => { if (!P) return; if (P.j) recevoirPos(P.j); recevoirCoups(P); sortsDe(P); });
  on('touches', recevoirTouches); on('zone', recevoirZone); on('evt', recevoirEvt); on('sort', recevoirSort);
}

/* ---- CHEZ LE CHEF : l'etat, 10 fois par seconde ---- */
setInterval(() => {
  try {
    if (!chefMulti()) return; const now = performance.now(); if (now - MULTI_C.tEtat < pasEnvoiM() - 8) return; MULTI_C.msDebut = now; const c = combat, complet = MULTI_C.tick++ % MC_PAS.complet === 0, J = joueursDebout().map((j) => j.p).concat([...MULTI.avatars.values()].map((A) => A.W.position)); /* (allege : a chaque fois les monstres a moins de 35 d'un joueur, toute la liste toutes les 2 s) */
    const m = []; c.monstres.forEach((o) => { if (o.etat === 'mort' || !o.m || !o.m.parent || o.pv <= 0) return; if (!complet && !J.some((q) => Math.abs(q.x - o.x) + Math.abs(q.z - o.z) < MC_PAS.pres)) return; const p = o.m.position, f = (o.chef ? 1 : 0) + (o.specimen ? 2 : 0) + (o.etat !== 'actif' || o.m.visible === false ? 4 : 0);
      m.push([uidM(o), o.type, +o.x.toFixed(2), +p.y.toFixed(2), +o.z.toFixed(2), +(o.m.rotation.y || 0).toFixed(2), Math.round(o.pv), Math.round(o.pvMax), f]); });
    const E = { m, d: MULTI_C.dg.splice(0), k: MULTI_C.morts.splice(0), p: complet ? 0 : 1, n: c.n, t: Math.round(donjonEtat ? donjonEtat.t : 0) }, j = posMulti(); if (j) E.j = j; if (MULTI_C.touches.length) E.h = MULTI_C.touches.splice(0); if (MULTI_C.zones.length) E.z = MULTI_C.zones.splice(0); if (MULTI_C.sorts.length) E.s = MULTI_C.sorts.splice(0); /* (sa position, les coups pour les autres, les zones rouges et ses sorts : dans le meme message) */
    envoyerMulti('etat', E); MULTI_C.tEtat = now; MULTI_C.nEtat++; MULTI_C.msEnvoi = (MULTI_C.msEnvoi || 0) + performance.now() - now; /* (le temps passe a preparer l'etat, pour les mesures) */
  } catch (e) { /* rien */ }
}, MC_PAS.etat);
/* les degats donnes, notes pour les chiffres chez les autres (qui, combien, sur quel monstre) */
{ const bl0 = blesser; blesser = function (mo, n, gros, src) {
    if (inviteMulti() && mo && mo.refletM) { /* (chez un invite : le coup part au chef ; le chiffre s'affiche tout de suite chez lui) */
      if (!(n > 0) || mo.etat !== 'actif') return 0; const v = Math.max(1, Math.round(n * (mo.d.armure ? 1 - mo.d.armure : 1)));
      MULTI_C.coups.push([mo.refletM, Math.round(n), gros ? 1 : 0, src ? String(src).slice(0, 8) : '']); mo.pv = Math.max(1, mo.pv - v); mo.tCoupLocal = performance.now();
      try { if (combat.st) combat.st.inflige += v; if (typeof noterDegats === 'function') noterDegats(src, v); } catch (e) { /* rien */ }
      try { chiffre('-' + v, new T.Vector3(mo.x, mo.m.position.y + (mo.haut || 1.4) - 0.2, mo.z), gros ? 'gros' : ''); } catch (e) { /* rien */ } return v; }
    if (!chefMulti() || !mo) return bl0.apply(this, arguments);
    const avant = mo.pv, vivant = mo.etat === 'actif', r = bl0.apply(this, arguments), fait = vivant ? Math.round(avant - Math.max(0, mo.pv)) : 0;
    if (vivant && mo.etat === 'mort') MULTI_C.morts.push(uidM(mo));
    if (fait > 0) { MULTI_C.dg.push([uidM(mo), fait, MULTI_C.auteur || MULTI.moi, gros ? 1 : 0]); if (MULTI_C.auteur) mo.aggroM = { id: MULTI_C.auteur, t: performance.now() }; else mo.aggroM = { id: MULTI.moi, t: performance.now() }; }
    return r; }; }
/* les coups des invites, appliques par le chef avec leurs degats */
function recevoirCoups(P) {
  if (!chefMulti() || !P || !Array.isArray(P.l)) return; const nom = (MULTI.presents[P.i] || {}).pseudo || 'Allié';
  P.l.forEach(([u, n, g]) => { const mo = monstreUid(u); if (!mo || mo.etat !== 'actif' || !(n > 0)) return; const s0 = SRC_DEG; SRC_DEG = 'Allié : ' + nom; MULTI_C.auteur = P.i;
    try { blesser(mo, Math.min(n, 5e6), !!g, 'allie'); } finally { SRC_DEG = s0; MULTI_C.auteur = null; } });
}
/* ---- la cible de chaque monstre : celui qui l'a frappe (3 s), sinon le plus proche ; le perso du chef pose a sa place le temps de sa mise a jour ---- */
function joueursDebout() { const L = []; if (!MULTI_C.terre[MULTI.moi]) L.push({ id: MULTI.moi, p: MULTI_C.vrai || paysanMesh.position });
  MULTI.avatars.forEach((A, id) => { if (!MULTI_C.terre[id] && MULTI.presents[id] && MULTI.presents[id].etat === 'donjon') L.push({ id, p: A.W.position }); }); return L; }
function cibleDe(mo) { const now = performance.now(), J = joueursDebout(); if (!J.length) return MULTI.moi;
  if (mo.aggroM && now - mo.aggroM.t < MC_PAS.aggro && J.some((j) => j.id === mo.aggroM.id)) return mo.aggroM.id;
  if (mo.cibleM && now < mo.cibleM.jusque && J.some((j) => j.id === mo.cibleM.id)) return mo.cibleM.id;
  let b = J[0], bd = 1e9; J.forEach((j) => { const d = Math.hypot(j.p.x - mo.x, j.p.z - mo.z); if (d < bd) { bd = d; b = j; } }); mo.cibleM = { id: b.id, jusque: now + MC_PAS.choix }; return b.id; }
/* poser le perso du chef a la place d'un autre joueur, puis le remettre */
/* (ce qu'un coup pose sur le perso touche : etourdi, ralenti, colle, poison, son chemin coupe... ; quand le coup vise un autre joueur, le perso du chef n'en garde rien) */
const STATUTS_M = ['agrippe', 'lenteur', 'colle', 'assomme', 'vase', 'poisonAcc', 'poisonFumee', 'mauditJusque', 'mauditX', 'cdAttaque'];
function photoStatuts() { const c = combat, u = paysanMesh.userData, o = { ch: chemin, ar: arrivee, cel: u.cellule, chg: u.charge, vol: u.enVol, c }; if (c) { o.v = STATUTS_M.map((k) => c[k]); o.pa = c.poisons; o.np = c.poisons ? c.poisons.length : 0; } return o; }
function rendreStatuts(o) { chemin = o.ch; arrivee = o.ar; const u = paysanMesh.userData; u.cellule = o.cel; u.charge = o.chg; u.enVol = o.vol; const c = o.c; if (!c || c !== combat) return;
  STATUTS_M.forEach((k, i) => { if (o.v[i] === undefined) delete c[k]; else c[k] = o.v[i]; }); if (o.pa) { c.poisons = o.pa; if (o.pa.length > o.np) o.pa.length = o.np; } else delete c.poisons; }
function poserSurJoueur(id) { if (!id || id === MULTI.moi) return null; const A = MULTI.avatars.get(id); if (!A) return null; const p = paysanMesh.position, u = paysanMesh.userData, sv = { x: p.x, y: p.y, z: p.z, uy: u.y, c: MULTI_C.cible, vrai: MULTI_C.vrai, st: photoStatuts() };
  if (!MULTI_C.vrai) MULTI_C.vrai = { x: p.x, y: p.y, z: p.z, uy: u.y }; p.set(A.W.position.x, A.W.position.y, A.W.position.z); u.y = A.W.position.y; MULTI_C.cible = id;
  return () => { paysanMesh.position.set(sv.x, sv.y, sv.z); paysanMesh.userData.y = sv.uy; MULTI_C.cible = sv.c; MULTI_C.vrai = sv.vrai; try { rendreStatuts(sv.st); } catch (e) { /* rien */ } }; }
/* remettre le perso du chef a sa vraie place le temps d'un coup (une zone ou il est aussi) */
function poserSurMoi() { const V = MULTI_C.vrai; if (!V) return null; const p = paysanMesh.position, u = paysanMesh.userData, sv = { x: p.x, y: p.y, z: p.z, uy: u.y, c: MULTI_C.cible };
  p.set(V.x, V.y, V.z); u.y = V.uy; MULTI_C.cible = null; MULTI_C.vrai = null; return () => { paysanMesh.position.set(sv.x, sv.y, sv.z); paysanMesh.userData.y = sv.uy; MULTI_C.cible = sv.c; MULTI_C.vrai = V; }; }
{ const mm0 = majMonstre; majMonstre = function (mo, dt, s) {
    if (inviteMulti() && mo.refletM && mo.etat === 'actif') { majReflet(mo, dt); return; }
    if (!chefMulti() || mo.etat !== 'actif') return mm0.apply(this, arguments);
    const id = cibleDe(mo), rend = poserSurJoueur(id); try { return mm0.apply(this, arguments); } finally { if (rend) rend(); } }; }
/* les coups en retard gardent leur cible : effets et minuteries crees pendant la mise a jour d'un monstre qui vise un autre joueur */
const avecCibleM = (id, f) => function (...a) { const rend = MULTI.avatars.has(id) ? poserSurJoueur(id) : null; try { return f.apply(this, a); } finally { if (rend) rend(); } };
{ const push0 = effets.push; effets.push = function (...fs) { const id = MULTI_C.cible; return push0.apply(this, id ? fs.map((f) => (typeof f === 'function' ? avecCibleM(id, f) : f)) : fs); }; }
{ const st0 = window.setTimeout; window.setTimeout = function (f, ...r) { const id = MULTI_C.cible; return st0.call(window, id && typeof f === 'function' ? avecCibleM(id, f) : f, ...r); }; }
/* les coups recus : chez le chef, celui qui vise un autre joueur part chez lui */
{ const bp0 = blesserPerso; blesserPerso = function (n, mo) {
    if (chefMulti() && MULTI_C.cible && MULTI_C.cible !== MULTI.moi) { if (n > 0) MULTI_C.touches.push([MULTI_C.cible, Math.round(n), mo ? uidM(mo) : 0]); return true; }
    if (multiCombat() && MULTI_C.terre[MULTI.moi]) return; /* (a terre : plus rien ne l'atteint) */
    return bp0.apply(this, arguments); }; }
function recevoirTouches(P) { if (!inviteMulti() || !P || !Array.isArray(P.l)) return;
  P.l.forEach(([to, n, u]) => { if (to !== MULTI.moi || !(n > 0)) return; const mo = refletParUid(u); try { blesserPerso(Math.min(n, 1e6), mo || null); } catch (e) { /* rien */ } }); }
/* les zones rouges : dessinees chez tout le monde ; au coup, chaque joueur qui est dedans est touche (le jeu du chef rejoue l'effet a sa place) */
{ const zd0 = zoneDanger; zoneDanger = function (o) {
    if (!chefMulti() || MULTI_C.rejeu || !o) return zd0.apply(this, arguments);
    const coul = o.couleur || (o.mo && o.mo.d && o.mo.d.couleurSorts && o.mo.d.couleurSorts[0]) || '#e2413a', Z = { x: o.x, z: o.z, r: o.r, a: o.a, ouv: o.ouv, x2: o.x2, z2: o.z2, larg: o.larg, duree: o.duree, couleur: coul, fort: o.fort, bord: o.bord };
    Object.keys(Z).forEach((k) => { if (Z[k] == null) delete Z[k]; else if (typeof Z[k] === 'number') Z[k] = +Z[k].toFixed(2); }); MULTI_C.zones.push(Z); /* (part avec le prochain etat) */
    const e0 = o.effet; if (typeof e0 === 'function') o.effet = function (d) {
      const dedans = joueursDebout().filter((j) => dansDanger(d, j.p.x, j.p.z)).map((j) => j.id); if (!dedans.length) return e0.apply(this, arguments); /* (personne dedans : l'effet seul, pour l'image) */
      let r, premier = true; dedans.forEach((id) => { const rend = id === MULTI.moi ? poserSurMoi() : poserSurJoueur(id); MULTI_C.rejeu = !premier;
        try { const x = e0.call(this, d); if (premier) r = x; } catch (e) { /* rien */ } finally { MULTI_C.rejeu = false; if (rend) rend(); } premier = false; }); /* (le premier joue l'effet entier ; pour les suivants, rien ne naît deux fois) */
      return r; };
    return zd0.apply(this, arguments); }; }
/* pendant un rejeu d'effet, rien ne naît deux fois */
{ const ap0 = apparaitre; apparaitre = function (type, pres) {
    if (MULTI_C.rejeu) return;
    if (inviteMulti() && !MULTI_C.applique && !(pres && pres.refletM)) return; /* (chez un invite : les monstres viennent du chef, sous forme de reflets) */
    return ap0.apply(this, arguments); }; }

/* ---- CHEZ UN INVITE : les reflets des monstres du chef ---- */
function refletParUid(u) { const o = MULTI_C.reflets.get(u); return o && o.etat === 'actif' ? o : null; }
function recevoirEtat(P) {
  if (!inviteMulti() || !P || !Array.isArray(P.m)) return; const c = combat, vus = new Set();
  if (P.n && c.n !== P.n) c.n = P.n; /* (les monstres a la force du chef : ses coups recus se calculent pareil) */
  P.m.forEach(([u, t, x, y, z, ry, pv, pvMax, f]) => { vus.add(u); MULTI_C.etats.set(u, { x, y, z, ry, pv, pvMax, t: performance.now() });
    let o = MULTI_C.reflets.get(u);
    if (o && o.etat === 'actif') { o.pvMax = pvMax; if (!(o.pv < pv && performance.now() - (o.tCoupLocal || 0) < 400)) o.pv = Math.max(1, pv); o.cacheM = !!(f & 4); return; }
    if (o || MULTI_C.vu[u] || !MONSTRES[t]) return; MULTI_C.vu[u] = true;
    MULTI_C.applique = true; try { apparaitre(t, { x, z, refletM: u, apres: (m) => { m.refletM = u; m.pv = pv; m.pvMax = pvMax; m.y = y; m.ry = ry; m.aggro = true; m.lab = null; MULTI_C.reflets.set(u, m);
      if (f & 1 && typeof grandirMutant === 'function') grandirMutant(m, CHEF_LABO, '#ffb02e', t === 'wabGarou' ? 'Garou alpha' : 'Chef des gardes');
      if (f & 2 && typeof grandirMutant === 'function') grandirMutant(m, SPECIMEN, '#7dff5a', 'Spécimen (' + MONSTRES[t].nom + ')');
      m.pv = pv; m.pvMax = pvMax; } }); } finally { MULTI_C.applique = false; } });
  const tuer = (o) => { if (o.etat !== 'actif') return; o.pv = 0; o.etat = 'mort'; o.t = 0; try { o.barre.remove(); } catch (e) { /* rien */ } if (c.cible === o) c.cible = null; try { pouf(o.x, o.m.position.y, o.z, 2); } catch (e) { /* rien */ } };
  (P.k || []).forEach((u) => { const o = MULTI_C.reflets.get(u); if (o) tuer(o); }); /* (les morts, tout de suite) */
  if (!P.p) MULTI_C.reflets.forEach((o, u) => { if (!vus.has(u) && o.etat === 'actif') { o.pv = 0; o.etat = 'mort'; o.t = 0; try { o.barre.remove(); } catch (e) { /* rien */ } if (c.cible === o) c.cible = null; try { pouf(o.x, o.m.position.y, o.z, 2); } catch (e) { /* rien */ } } });
  /* les chiffres des degats des autres */
  (P.d || []).forEach(([u, n, qui, g]) => { if (qui === MULTI.moi) return; const o = MULTI_C.reflets.get(u); if (!o || !o.m) return; try { chiffre('-' + fmt(n), new T.Vector3(o.x, o.m.position.y + (o.haut || 1.4) - 0.2, o.z), g ? 'gros' : ''); } catch (e) { /* rien */ } });
}
function majReflet(mo, dt) { const E = MULTI_C.etats.get(mo.refletM), m = mo.m; if (!E || !m) return; m.visible = !mo.cacheM; if (mo.barre) mo.barre.hidden = !!mo.cacheM;
  const dx = E.x - mo.x, dz = E.z - mo.z, D = Math.hypot(dx, dz), k = 1 - Math.exp(-dt * 10); if (D > MC_PAS.glisse) { mo.x = E.x; mo.z = E.z; } else { mo.x += dx * k; mo.z += dz * k; }
  const v = dt > 0 ? Math.min(12, D * k / dt) : 0; m.position.set(mo.x, m.position.y + (E.y - m.position.y) * k, mo.z); let da = E.ry - m.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); m.rotation.y += da * k; mo.ry = m.rotation.y;
  if (m.userData.anim) { try { majSquelette(mo, v, dt); } catch (e) { /* rien */ } } if (mo.d.boss) { try { majBarreBoss(mo); } catch (e) { /* rien */ } } }
/* les coups de l'invite partent au chef, 10 fois par seconde au plus */
setInterval(() => { try { if (inviteMulti()) { const now = performance.now(); if (now - MULTI_C.tCoups < pasEnvoiM() - 8) return; const j = posMulti(); if (!(MULTI_C.coups.length || j || MULTI_C.sorts.length)) return;
      const C = { i: MULTI.moi, l: MULTI_C.coups.splice(0) }; if (j) C.j = j; if (MULTI_C.sorts.length) C.s = MULTI_C.sorts.splice(0); envoyerMulti('coups', C); MULTI_C.tCoups = now; } else MULTI_C.coups.length = 0; } catch (e) { /* rien */ } }, MC_PAS.etat);
function recevoirZone(Z) { if (!inviteMulti() || !Z || !(Z.duree > 0)) return; try { zoneDanger(Object.assign({}, Z, { effet: () => {} })); } catch (e) { /* rien */ } }

/* ---- les salles, les grilles, les cuves et la fin : le chef decide, les invites suivent ---- */
const SUIT_CHEF = [['ouvrirSalleLabo', 'salle'], ['sortirSalleLabo', 'sortie'], ['ouvrirGrille', 'grille'], ['specimenLabo', 'specimen']];
SUIT_CHEF.forEach(([nom, ev]) => { const f0 = window[nom]; if (typeof f0 !== 'function') return; window[nom] = function (i) {
  if (chefMulti() && !MULTI_C.applique) { evtMulti({ k: ev, i }); return f0.apply(this, arguments); }
  if (inviteMulti() && !MULTI_C.applique) return; return f0.apply(this, arguments); }; });
/* (les noms globaux : reaffectes pour que tickDonjon et les portes passent par la) */
ouvrirSalleLabo = window.ouvrirSalleLabo; sortirSalleLabo = window.sortirSalleLabo; ouvrirGrille = window.ouvrirGrille; specimenLabo = window.specimenLabo;
{ const dp0 = demanderPorteLabo; demanderPorteLabo = function () { if (inviteMulti()) { if (performance.now() - (MULTI_C.tPorte || 0) > 4000) { MULTI_C.tPorte = performance.now(); toast('C\'est le chef qui ouvre les portes : tout le groupe entre avec lui.', 'or'); } return; } return dp0.apply(this, arguments); }; }
{ const vc0 = vieCampsLabo; vieCampsLabo = function () { if (inviteMulti()) return; return vc0.apply(this, arguments); }; }
{ const fd0 = finDonjon; finDonjon = function (gagne) {
    if (chefMulti() && !MULTI_C.applique) evtMulti({ k: 'fin', g: gagne ? 1 : 0 });
    else if (inviteMulti() && !MULTI_C.applique) return;
    const r = fd0.apply(this, arguments); finMulti(); return r; }; }
function recevoirEvt(P) {
  if (!P || !P.k) return; if (P.s) { if (MULTI_C.sVu[P.s]) return; MULTI_C.sVu[P.s] = 1; } /* (un renvoi deja applique) */
  if (P.k === 'terre' || P.k === 'debout') { if (P.id) MULTI_C.terre[P.id] = P.k === 'terre'; if (chefMulti()) verifierDefaite(); return; }
  if (!inviteMulti()) return; MULTI_C.applique = true;
  try { if (P.k === 'salle') ouvrirSalleLabo(P.i); else if (P.k === 'sortie') sortirSalleLabo(P.i); else if (P.k === 'grille') ouvrirGrille(P.i); else if (P.k === 'specimen') specimenLabo(P.i); else if (P.k === 'fin') finDonjon(!!P.g); }
  catch (e) { /* rien */ } finally { MULTI_C.applique = false; }
}
function finMulti() { MULTI_C.reflets.clear(); MULTI_C.etats.clear(); MULTI_C.vu = {}; MULTI_C.terre = {}; MULTI_C.coups.length = 0; MULTI_C.touches.length = 0; MULTI_C.dg.length = 0; MULTI_C.zones.length = 0; MULTI_C.sorts.length = 0; MULTI_C.defaite = false; MULTI.role = null; }

/* ---- a terre : 10 s, puis debout au debut de la salle tant qu'un coequipier tient ; tous a terre : defaite ---- */
{ const pat0 = persoATerre; persoATerre = function () { if (!multiCombat()) return pat0.apply(this, arguments); aTerreMulti(); }; }
function aTerreMulti() {
  const c = combat; if (!c || MULTI_C.terre[MULTI.moi]) return; MULTI_C.terre[MULTI.moi] = true; c.pv = 1; c.invincible = MC_PAS.terre + 1; chemin = []; arrivee = null;
  evtMulti({ k: 'terre', id: MULTI.moi }); toast('À terre ! Tu te relèves dans ' + MC_PAS.terre + ' s si un coéquipier tient debout.', 'alerte');
  paysanMesh.rotation.z = Math.PI / 2.2; const c0 = combat; let t = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin) { paysanMesh.rotation.z = 0; return true; } chemin = []; arrivee = null; c0.cdAttaque = Math.max(c0.cdAttaque || 0, 0.3);
    if (t < MC_PAS.terre) return false; const debout = joueursDeboutTous().length > 0; if (!debout) { if (t > MC_PAS.terre + 30) { paysanMesh.rotation.z = 0; return true; } return false; }
    paysanMesh.rotation.z = 0; MULTI_C.terre[MULTI.moi] = false; c0.pv = Math.round(c0.pvMax * 0.5); invincibleMulti(c0, 2); majCombatHud();
    try { const E = donjonEtat, P = E && E.perso; if (P && P.mode === 'salle' && P.i != null) { const S = SALLES_LABO[P.i], re = S.R - 3.4; placerPersoDonjon(DONJON.x + S.x + Math.cos(ENTREE_SALLE) * re, Y_SALLE, DONJON.z + S.z + Math.sin(ENTREE_SALLE) * re); } } catch (e) { /* rien */ }
    evtMulti({ k: 'debout', id: MULTI.moi }); toast('Debout ! Retour au combat.', 'or'); return true; });
  if (chefMulti()) verifierDefaite();
}
/* invincible un moment (le jeu ne decompte l'invincibilite que pour le Iop, 23-fin-combat.js : ici, pour toutes les classes) */
function invincibleMulti(c0, s) { c0.invincible = s; if (classeDe() === 'iop') return; let r = s; effets.push((dt) => { r -= dt; if (combat !== c0) return true; if (r > 0) return false; if (c0.invincible > 0 && c0.invincible <= s) c0.invincible = 0; return true; }); }
function joueursDeboutTous() { const L = []; if (!MULTI_C.terre[MULTI.moi]) L.push(MULTI.moi); Object.keys(MULTI.presents).forEach((id) => { if (id !== MULTI.moi && MULTI.presents[id].etat === 'donjon' && !MULTI_C.terre[id]) L.push(id); }); return L; }
function verifierDefaite() { if (!chefMulti() || MULTI_C.defaite) return; if (joueursDeboutTous().length === 0) { MULTI_C.defaite = true; toast('Tout le groupe est à terre : défaite.', 'alerte'); ST_NATIF(() => { MULTI_C.defaite = false; if (chefMulti()) finDonjon(false); }, 1200); } }
/* a terre ou debout, aussi d'apres la position de chacun (elle le dit a chaque envoi) : si un message d'evenement se perd, l'etat se rattrape */
{ const rp0 = recevoirPos; recevoirPos = function (P) { if (P && P.id && P.id !== MULTI.moi && multiCombat()) { const t = !!P.tr; if (!!MULTI_C.terre[P.id] !== t) { MULTI_C.terre[P.id] = t; if (chefMulti()) verifierDefaite(); } } return rp0.apply(this, arguments); }; }
setInterval(() => { try { if (chefMulti() && MULTI_C.terre[MULTI.moi]) verifierDefaite(); } catch (e) { /* rien */ } }, 500);

/* ---- le chef qui s'en va : les autres rentrent ---- */
setInterval(() => { try {
  if (!inviteMulti()) { MULTI_C.chefPerdu = 0; return; } if (MULTI.presents[MULTI.chefId]) { MULTI_C.chefPerdu = 0; return; }
  MULTI_C.chefPerdu += 500; if (MULTI_C.chefPerdu < MC_PAS.perdu) return; MULTI_C.chefPerdu = -1e9;
  toast('Ton chef a quitté le labo : retour à la ferme.', 'alerte'); MULTI.role = null; setTimeout(() => { try { if (MULTI.essai) { fermerCanalMulti(); location.reload(); } else { finMulti(); rentrerFerme(); } } catch (e) { /* rien */ } }, 1500);
} catch (e) { /* rien */ } }, 500);

/* ---- les sorts des autres : une onde a leur couleur, la ou ils le lancent ---- */
const COUL_MULTI = { iop: '#ffb02e', cra: '#7fd8ff', osa: '#b48cff' };
function annoncerSort(k, x, z) { if (!multiCombat()) return; MULTI_C.sorts.push({ i: MULTI.moi, k, c: (S_ && S_.perso && S_.perso.classe) || 'iop', x: +(+x).toFixed(2), z: +(+z).toFixed(2) }); }
function recevoirSort(P) { if (!multiCombat() || !P || P.i === MULTI.moi) return; const A = MULTI.avatars.get(P.i); const x = isFinite(P.x) ? P.x : A && A.W.position.x, z = isFinite(P.z) ? P.z : A && A.W.position.z; if (!isFinite(x)) return;
  const y = A ? A.W.position.y : solA(x, z), coul = COUL_MULTI[P.c] || '#ffe7a6', gros = P.k === 'ulti';
  try { onde(x, y + 0.08, z, gros ? 3.2 : 1.8, coul, gros ? 0.6 : 0.4, 0.9); emettre(FX_VIF, gros ? 26 : 14, { x, y: y + 1, z, r: 0.3, dv: gros ? 4 : 3, haut: true, vie: [0.3, 0.6], taille: [0.12, 0.04], c: ['#ffffff', coul], frein: 1.5 }); if (A && gros) pouf(A.W.position.x, A.W.position.y + 0.4, A.W.position.z, 1.6, coul); } catch (e) { /* rien */ } }
{ const t0 = BOUTONS_SORT.sort.tirer; BOUTONS_SORT.sort.tirer = function (v, pt) { const r = t0.apply(this, arguments); try { if (r !== false) annoncerSort('sort', pt ? pt.x : paysanMesh.position.x, pt ? pt.z : paysanMesh.position.z); } catch (e) { /* rien */ } return r; }; }
{ const eu0 = executerUlti; executerUlti = function (id, cible, pt) { const r = eu0.apply(this, arguments); try { const q = cible || pt || paysanMesh.position; annoncerSort('ulti', q.x, q.z); } catch (e) { /* rien */ } return r; }; }
{ const el0 = executerLeg; executerLeg = function (emp, pt) { const r = el0.apply(this, arguments); try { const q = pt || paysanMesh.position; annoncerSort('leg', q.x, q.z); } catch (e) { /* rien */ } return r; }; }
/* un labo lance seul (pas par le depart du groupe) : plus de role multi */
{ const pd0 = partirDonjon; partirDonjon = function () { if (Date.now() - (MULTI.depart || 0) > 4000) MULTI.role = null; return pd0.apply(this, arguments); }; }
