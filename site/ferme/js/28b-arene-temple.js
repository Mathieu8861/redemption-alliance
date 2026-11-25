'use strict';
/* LES CARTES DE L'ARENE (25/11/2026, « commence a travailler 2 nouvelles maps d'arene, elles peuvent etre de taille / forme differente, avec des obstacles ou non,
   et avec une thematique differente ; commence par une », Mathieu ; au formulaire : « au hasard a chaque entree ») : le colisee de toujours (27-arene.js) et des
   cartes en plus, inscrites dans CARTES_ARENE :
   - temple (ce fichier) : le temple de la jungle (blender/arene-temple.py), un carre de 22 de cote, 4 statues de Kannibouls qui sont de vrais obstacles ;
   - volcan (28c-arene-volcan.js) : le cratere volcanique, un anneau autour d'un lac de lave.
   Chaque carte donne : son fichier, ses bornes (libre : un point ou l'on peut se tenir, dans son repere local ; borner : le point le plus proche), ou poser le perso,
   son decor anime. La carte se tire au hasard a chaque entree (Arene, Arene dev ; l'entrainement reste au colisee) ; une carte dont « sortie » est faux ne sort que
   dans le mode test, ou le bouton « Arene : ... » de la barre du mode test peut aussi forcer une carte.
   Les crochets de 27-arene.js (dansArene, bornerArene, cheminArene, pasMonstreArene, bornerMonstresArene) suivent la carte tiree ; le chemin autour des obstacles
   est l'A* de l'ile des boss (cheminGrilleIle, caseLibreIle).
   REPERE LOCAL d'une carte : celui de son modele Blender (la camera vers +z, le fond vers -z), tourne de ROT_ARENE dans le monde. */
const CARTES_ARENE = {};
const ARENE_CARTE = { ici: 'colisee', force: null }; /* (force : le choix du mode test, null = au hasard) */
const carteDuJour = () => CARTES_ARENE[ARENE_CARTE.ici] || null; /* (null : le colisee) */
const templeIci = () => !!carteDuJour(); /* (une carte autre que le colisee ; le nom est reste du temple) */
const versLocalArene = (x, z) => { const dx = x - ARENE.x, dz = z - ARENE.z, c = Math.cos(ROT_ARENE), s = Math.sin(ROT_ARENE); return [dx * c - dz * s, dx * s + dz * c]; };
const versMondeArene = (lx, lz) => { const c = Math.cos(ROT_ARENE), s = Math.sin(ROT_ARENE); return [lx * c + lz * s + ARENE.x, -lx * s + lz * c + ARENE.z]; };
const M_PERSO_ARENE = 0.8; /* (la marge du perso : il reste a 0,8 du bord) */

/* ---------- le temple de la jungle ---------- */
const TEMPLE = { mur: 11.3, /* la face interieure du muret */ statues: [[-5.5, 5.5], [5.5, 5.5], [-5.5, -5.5], [5.5, -5.5]], rStatue: 1.15, /* (les socles : 1,9 de cote) */
  portes: [{ axe: 'z', s: -1, l: 1.2 }, { axe: 'x', s: -1, l: 1.0 }, { axe: 'x', s: 1, l: 1.0 }] /* (le fond, la gauche, la droite : demi-largeur du passage) */ };
function dansPorteTemple(lx, lz, m) { /* un monstre dans le passage d'une porte (il en sort), jusqu'a 12,8 du centre */
  const B = TEMPLE.mur - m;
  return TEMPLE.portes.some((p) => { const a = p.axe === 'z' ? lz : lx, t = p.axe === 'z' ? lx : lz; return a * p.s > B && a * p.s < 12.8 && Math.abs(t) < p.l; });
}
function libreTemple(lx, lz, m, porte) {
  const B = TEMPLE.mur - m;
  if ((Math.abs(lx) > B || Math.abs(lz) > B) && !(porte && dansPorteTemple(lx, lz, m))) return false;
  for (const [sx, sz] of TEMPLE.statues) if (Math.hypot(lx - sx, lz - sz) < TEMPLE.rStatue + m) return false;
  return true;
}
function bornerLocalTemple(lx, lz, m, monstre, sansDecor) { /* dans le carre (ou le passage d'une porte, pour un monstre), hors des socles */
  const B = TEMPLE.mur - m;
  if (!(monstre && dansPorteTemple(lx, lz, m))) { lx = Math.max(-B, Math.min(B, lx)); lz = Math.max(-B, Math.min(B, lz)); }
  if (!sansDecor) for (let n = 0; n < 2; n++) TEMPLE.statues.forEach(([sx, sz]) => { const dx = lx - sx, dz = lz - sz, d = Math.hypot(dx, dz), R = TEMPLE.rStatue + m; if (d >= R) return; if (d < 0.001) lx = sx + R; else { lx = sx + dx / d * R; lz = sz + dz / d * R; } });
  return [lx, lz];
}

/* ---------- ce qui sert a toutes les cartes : bornes, chemin, chargement ---------- */
const dansCarte = (x, z, m) => { const C = carteDuJour(), [lx, lz] = versLocalArene(x, z); return C.libre(lx, lz, m == null ? 0.5 : m, false); };
function bornerCarte(x, z, m, monstre, sansDecor) { const C = carteDuJour(); m = m == null ? M_PERSO_ARENE : m; const [lx, lz] = versLocalArene(x, z), q = C.borner(lx, lz, m, !!monstre, !!sansDecor); return versMondeArene(q[0], q[1]); }
const GRILLE_ARENE = { pas: 0.5, R: 16, cache: new Map() };
function grilleCarte(m, porte) {
  const cle = ARENE_CARTE.ici + ':' + m + ':' + !!porte; let G = GRILLE_ARENE.cache.get(cle); if (G) return G; const C = carteDuJour();
  const p = GRILLE_ARENE.pas, o = -GRILLE_ARENE.R, n = Math.round(GRILLE_ARENE.R * 2 / p) + 1, L = new Uint8Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) L[i * n + j] = C.libre(o + i * p, o + j * p, m, porte) ? 1 : 0;
  G = { n, o, p, L }; GRILLE_ARENE.cache.set(cle, G); return G;
}
function segmentLibreCarte(ax, az, bx, bz, m, porte) { const C = carteDuJour(), D = Math.hypot(bx - ax, bz - az), k = Math.max(1, Math.ceil(D / 0.25)); for (let i = 1; i <= k; i++) { const t = i / k; if (!C.libre(ax + (bx - ax) * t, az + (bz - az) * t, m, porte)) return false; } return true; }
function pasCarte(e, x, z, dt) { /* (comme pasIle : tout droit quand rien ne barre la route, sinon le plus court chemin, refait toutes les 0,4 s ou quand la cible a bouge) */
  const m = e.d ? (e.d.boss ? 0.9 : 0.3) : 0.4, [ax, az] = versLocalArene(e.x, e.z), [bx, bz] = versLocalArene(x, z);
  if (segmentLibreCarte(ax, az, bx, bz, m * 0.9, true)) { e.routeTemple = null; e.horsAtteinte = false; return { x, z }; }
  e.routeTempleT = (e.routeTempleT || 0) - dt; let R = e.routeTemple;
  if (!R || e.routeTempleT <= 0 || Math.hypot(bx - R.bx, bz - R.bz) > 1.5) {
    const G = grilleCarte(m, true), [si, sj] = caseLibreIle(G, ax, az), [gi, gj] = caseLibreIle(G, bx, bz), P = cheminGrilleIle(G, si, sj, gi, gj);
    R = e.routeTemple = { pts: P.map((k) => [G.o + ((k / G.n) | 0) * G.p, G.o + (k % G.n) * G.p]), bx, bz, w: null }; e.routeTempleT = 0.4;
    const fin = R.pts[R.pts.length - 1], porte = e.d && e.d.portee ? e.d.portee * (e.allonge || 1) * 0.8 : 1; e.horsAtteinte = !fin || Math.hypot(fin[0] - bx, fin[1] - bz) > porte; }
  if (R.pts.length < 2) return { x, z };
  if (!R.w || Math.hypot(R.w[0] - ax, R.w[1] - az) < 0.8) { R.w = null;
    for (let k = R.pts.length - 1; k >= 1; k--) if (segmentLibreCarte(ax, az, R.pts[k][0], R.pts[k][1], m * 0.9, true)) { R.w = R.pts[k]; break; }
    if (!R.w) R.w = R.pts[1]; }
  const [wx, wz] = versMondeArene(R.w[0], R.w[1]); return { x: wx, z: wz };
}
function cheminCarte(x, z) { /* le perso, au clic : jusqu'au point touche (ramene sur le terrain), en contournant les obstacles */
  const pp = paysanMesh.position, c0 = paysanMesh.userData.cellule, m = M_PERSO_ARENE, [tx, tz] = bornerCarte(x, z, m), [ax, az] = versLocalArene(pp.x, pp.z), [bx, bz] = versLocalArene(tx, tz);
  if (segmentLibreCarte(ax, az, bx, bz, m * 0.9, false)) return [{ c: c0, x: tx, z: tz }];
  const G = grilleCarte(m, false), [si, sj] = caseLibreIle(G, ax, az), [gi, gj] = caseLibreIle(G, bx, bz), P = cheminGrilleIle(G, si, sj, gi, gj).map((k) => [G.o + ((k / G.n) | 0) * G.p, G.o + (k % G.n) * G.p]);
  const L = []; let de = [ax, az]; /* (on ne garde que les points ou il faut tourner : du dernier point garde, le plus loin qu'on voit en ligne droite) */
  for (let k = 1; k < P.length; ) { let j = P.length - 1; while (j > k && !segmentLibreCarte(de[0], de[1], P[j][0], P[j][1], m * 0.9, false)) j--; L.push(P[j]); de = P[j]; k = j + 1; }
  const out = L.map(([lx, lz]) => { const [wx, wz] = versMondeArene(lx, lz); return { c: c0, x: wx, z: wz }; });
  if (!out.length || Math.hypot(out[out.length - 1].x - tx, out[out.length - 1].z - tz) > 0.3) out.push({ c: c0, x: tx, z: tz });
  return out;
}
/* le modele d'une carte : rendu comme l'ile, tourne de ROT_ARENE, avec ses flammes, ses drapeaux, ses grilles qui se levent (decorArene, 27e-decor-vivant.js) */
async function chargerCarteArene(C) {
  if (C.g) return C.g;
  const sc = await chargerGlb('assets/modeles/jeu/' + C.fichier + '?v=' + (VERSIONS_FICHIERS[C.fichier] || VERSION_MODELES)), reperes = [], axe = new T.Vector3(0, 1, 0);
  sc.updateMatrixWorld(true); sc.traverse((o) => { if (/^repere_/.test(o.name)) { const p = new T.Vector3(); o.getWorldPosition(p); p.applyAxisAngle(axe, ROT_ARENE); reperes.push({ nom: o.name, p }); } }); /* (dans le repere de l'ile, deja tourne) */
  versToon(sc, { echelle: 0.012, souple: SOUPLE_ILE, sansContour: SC_ILE, douce: true, centre: true });
  const re = C.garder || /^(drapeau_|grille)/, garde = (m) => re.test(m.name) || !!(m.parent && re.test(m.parent.name)); /* (ce qui s'anime seul reste a part) */
  const g = new T.Group(), tour = new T.Group(); tour.rotation.y = ROT_ARENE; tour.add(fusionner(sc.getObjectByName(C.racine) || sc, { garder: garde })); g.add(tour); g.position.copy(ARENE); g.userData.tour = tour;
  if (MODELES.montgolfiere) { const m = MODELES.montgolfiere.clone(true); m.traverse((o) => { delete o.userData.montgolfiere; }); m.position.set(16, 0, 3.9); m.rotation.set(0, -Math.PI / 2, 0); m.visible = true; g.add(m); g.userData.montgolfiere = m; } /* (la montgolfiere, a la meme place qu'au colisee) */
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const avant = typeof DV !== 'undefined' ? DV.arene : null;
  decorArene(g, reperes, null); if (C.decor) C.decor(g, reperes);
  if (avant && carteDuJour() !== C) DV.arene = avant;
  g.visible = false; scene.add(g); C.g = g; if (!soleil.target.parent) scene.add(soleil.target);
  return g;
}
CARTES_ARENE.temple = { nom: 'temple', sortie: 'p11', fichier: 'arene-temple.glb', racine: 'AreneTemple', libre: libreTemple, borner: bornerLocalTemple };
Object.defineProperty(window, 'ileTemple', { get: () => CARTES_ARENE.temple.g || null, configurable: true }); /* (le nom d'avant, pour les essais) */

/* ---------- les crochets de 27-arene.js : la carte tiree, le colisee sinon ---------- */
{ const dansAreneC = dansArene; dansArene = function (x, z) { return carteDuJour() ? dansCarte(x, z) : dansAreneC.apply(this, arguments); }; }
{ const bornerAreneC = bornerArene; bornerArene = function (x, z) { return carteDuJour() ? bornerCarte(x, z) : bornerAreneC.apply(this, arguments); }; }
{ const cheminAreneC = cheminArene; cheminArene = function (x, z) { return carteDuJour() ? cheminCarte(x, z) : cheminAreneC.apply(this, arguments); }; }
{ const pasMonstreAreneC = pasMonstreArene; pasMonstreArene = function (e, x, z, dt) { return carteDuJour() ? pasCarte(e, x, z, dt) : pasMonstreAreneC.apply(this, arguments); }; }
{ const bornerMonstresAreneC = bornerMonstresArene; bornerMonstresArene = function (c) { if (!carteDuJour()) return bornerMonstresAreneC.apply(this, arguments);
  c.monstres.forEach((o) => { if (o.etat !== 'actif' || o.d.vole) return; const q = bornerCarte(o.x, o.z, o.d.boss ? 0.9 : 0.3, true, o.traverseT > 0); o.x = q[0]; o.z = q[1]; }); }; } /* (traverse : un boss coince passe a travers le decor, il reste sur le terrain) */

/* ---------- le tirage, le chargement, l'affichage ---------- */
function decorDeLaCarte() { if (typeof DV === 'undefined') return; const C = carteDuJour(), g = C ? C.g : ileArene; if (g) DV.arene = g; } /* (les herses et les flammes animees : celles de la carte du jour) */
/* (26/11/2026, « les nouvelles maps sortent a la maj palier 11 avec le reste », Mathieu : sortie 'p11' suit l'interrupteur SORTIE_P11, 02-donnees.js) */
const carteSortie = (K) => (K.sortie === 'p11' ? typeof SORTIE_P11 !== 'undefined' && !!SORTIE_P11 : !!K.sortie);
function tirerCarteArene() {
  const L = ['colisee'].concat(Object.keys(CARTES_ARENE).filter((k) => carteSortie(CARTES_ARENE[k]) || MODE_TEST)), f = ARENE_CARTE.force;
  ARENE_CARTE.ici = f && L.includes(f) ? f : L[Math.floor(Math.random() * L.length)];
}
{ const chargerAreneC = chargerArene; chargerArene = async function () { const C = carteDuJour(); if (C) await chargerCarteArene(C); else await chargerAreneC.apply(this, arguments); decorDeLaCarte(); }; }
{ const montrerIlesC = montrerIles; montrerIles = function () { montrerIlesC.apply(this, arguments); const a = lieu === 'arene', C = carteDuJour(); if (ileArene) ileArene.visible = a && !C;
  Object.values(CARTES_ARENE).forEach((K) => { if (K.g) K.g.visible = a && K === C; }); }; }
const placerDepartArene = () => { const C = carteDuJour(); if (!C || !C.depart || lieu !== 'arene' || !paysanMesh) return; const [x, z] = versMondeArene(C.depart[0], C.depart[1]), u = paysanMesh.userData;
  paysanMesh.position.set(x, 0, z); u.y = 0; chemin = []; arrivee = null; u.angle = Math.atan2(ARENE.x - x, ARENE.z - z) + (C.departTourne || 0); paysanMesh.rotation.set(0, u.angle, 0); }; /* (une carte sans sol au milieu : le perso part de son point de depart) */
const avecCarteArene = (f, tirage) => async function () { /* une nouvelle entree : une carte tiree au hasard (pas en plein combat) */
  if (!combat) { const avant = ARENE_CARTE.ici; if (tirage) tirerCarteArene(); else ARENE_CARTE.ici = 'colisee'; if (lieu === 'arene' && ARENE_CARTE.ici !== avant) { await chargerArene(); montrerIles(); } }
  const r = await f.apply(this, arguments); placerDepartArene(); return r;
};
partirArene = avecCarteArene(partirArene, true); partirDev = avecCarteArene(partirDev, true); partirEntrainement = avecCarteArene(partirEntrainement, false); /* (l'entrainement au Poutch : au colisee, ses Poutchs sont poses au milieu) */

/* ---------- le mode test : forcer une carte ---------- */
const NOMS_CARTES = { null: 'au hasard', colisee: 'colisée', temple: 'temple', volcan: 'volcan' };
const boutonCarteArene = () => '<button class="btn mini" data-carte-arene="1">Arène : ' + NOMS_CARTES[ARENE_CARTE.force] + '</button>';
{ const bandeauTestC = bandeauTest; bandeauTest = function () { bandeauTestC.apply(this, arguments); const b = document.getElementById('bandeau-test'); if (!b) return; const v = b.querySelector('[data-carte-arene]'); if (v) v.outerHTML = boutonCarteArene(); else { const q = b.querySelector('[data-test="quitter"]'); if (q) q.insertAdjacentHTML('beforebegin', boutonCarteArene()); else b.insertAdjacentHTML('beforeend', boutonCarteArene()); } }; }
document.addEventListener('click', (e) => { const b = e.target.closest('[data-carte-arene]'); if (!b || !MODE_TEST) return;
  const L = [null, 'colisee'].concat(Object.keys(CARTES_ARENE)), i = L.indexOf(ARENE_CARTE.force); ARENE_CARTE.force = L[(i + 1) % L.length];
  b.outerHTML = boutonCarteArene(); toast('Prochaine entrée à l\'Arène : ' + (ARENE_CARTE.force ? 'le ' + NOMS_CARTES[ARENE_CARTE.force] : 'une carte au hasard') + '.'); });
