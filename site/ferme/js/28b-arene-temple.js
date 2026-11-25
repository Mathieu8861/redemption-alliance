'use strict';
/* LE TEMPLE DE LA JUNGLE, deuxieme carte de l'Arene (25/11/2026, « commence a travailler 2 nouvelles maps d'arene, elles peuvent etre de taille / forme differente,
   avec des obstacles ou non, et avec une thematique differente ; commence par une », Mathieu ; au formulaire : « Temple de la jungle », « au hasard a chaque entree ») :
   blender/arene-temple.py. Un terrain carre de 22 de cote, 4 statues de Kannibouls qui sont de vrais obstacles (le perso et les monstres les contournent), trois portes
   aux places des herses (PORTES_ARENE : les monstres en sortent), une pyramide a degres au fond, la jungle autour.
   - la carte se tire au hasard a chaque entree (Arene, Arene dev, entrainement) ; tant que TEMPLE_SORTI est faux, le temple ne sort que dans le mode test, ou le
     bouton « Arène : ... » de la barre du mode test peut aussi forcer une carte
   - les crochets de 27-arene.js (dansArene, bornerArene, cheminArene, pasMonstreArene, bornerMonstresArene) suivent la carte tiree
   REPERE LOCAL du temple : celui de blender/arene-temple.py (la camera vers +z, la pyramide vers -z), tourne de ROT_ARENE dans le monde. */
const TEMPLE_SORTI = false;
const ARENE_CARTE = { ici: 'colisee', force: null }; /* (force : le choix du mode test, null = au hasard) */
const templeIci = () => ARENE_CARTE.ici === 'temple';
const TEMPLE = { mur: 11.3, /* la face interieure du muret */ statues: [[-5.5, 5.5], [5.5, 5.5], [-5.5, -5.5], [5.5, -5.5]], rStatue: 1.15, /* (les socles : 1,9 de cote) */
  portes: [{ axe: 'z', s: -1, l: 1.2 }, { axe: 'x', s: -1, l: 1.0 }, { axe: 'x', s: 1, l: 1.0 }], /* (le fond, la gauche, la droite : demi-largeur du passage) */ perso: 0.8 /* (le perso reste a 10,5 du centre sur chaque axe) */ };
let ileTemple = null;
const versLocalArene = (x, z) => { const dx = x - ARENE.x, dz = z - ARENE.z, c = Math.cos(ROT_ARENE), s = Math.sin(ROT_ARENE); return [dx * c - dz * s, dx * s + dz * c]; };
const versMondeArene = (lx, lz) => { const c = Math.cos(ROT_ARENE), s = Math.sin(ROT_ARENE); return [lx * c + lz * s + ARENE.x, -lx * s + lz * c + ARENE.z]; };

/* ---------- le sol et les obstacles (repere local) ---------- */
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
const dansTemple = (x, z, m) => { const [lx, lz] = versLocalArene(x, z); return libreTemple(lx, lz, m == null ? 0.5 : m, false); };
function bornerTemple(x, z, m, monstre, sansDecor) { /* le point le plus proche ou l'on peut se tenir : dans le carre (ou le passage d'une porte, pour un monstre), hors des socles */
  m = m == null ? TEMPLE.perso : m; let [lx, lz] = versLocalArene(x, z); const B = TEMPLE.mur - m;
  if (!(monstre && dansPorteTemple(lx, lz, m))) { lx = Math.max(-B, Math.min(B, lx)); lz = Math.max(-B, Math.min(B, lz)); }
  if (!sansDecor) for (let n = 0; n < 2; n++) TEMPLE.statues.forEach(([sx, sz]) => { const dx = lx - sx, dz = lz - sz, d = Math.hypot(dx, dz), R = TEMPLE.rStatue + m; if (d >= R) return; if (d < 0.001) lx = sx + R; else { lx = sx + dx / d * R; lz = sz + dz / d * R; } });
  return versMondeArene(lx, lz);
}

/* ---------- le chemin autour des statues : la grille et l'A* de l'ile des boss (cheminGrilleIle, caseLibreIle, 27-arene.js) ---------- */
const GRILLE_TEMPLE = { pas: 0.5, R: 13, cache: new Map() };
function grilleTemple(m, porte) {
  const cle = m + ':' + !!porte; let G = GRILLE_TEMPLE.cache.get(cle); if (G) return G;
  const p = GRILLE_TEMPLE.pas, o = -GRILLE_TEMPLE.R, n = Math.round(GRILLE_TEMPLE.R * 2 / p) + 1, L = new Uint8Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) L[i * n + j] = libreTemple(o + i * p, o + j * p, m, porte) ? 1 : 0;
  G = { n, o, p, L }; GRILLE_TEMPLE.cache.set(cle, G); return G;
}
function segmentLibreTemple(ax, az, bx, bz, m, porte) { const D = Math.hypot(bx - ax, bz - az), k = Math.max(1, Math.ceil(D / 0.25)); for (let i = 1; i <= k; i++) { const t = i / k; if (!libreTemple(ax + (bx - ax) * t, az + (bz - az) * t, m, porte)) return false; } return true; }
function pasTemple(e, x, z, dt) { /* (comme pasIle : tout droit quand rien ne barre la route, sinon le plus court chemin, refait toutes les 0,4 s ou quand la cible a bouge) */
  const m = e.d ? (e.d.boss ? 0.9 : 0.3) : 0.4, [ax, az] = versLocalArene(e.x, e.z), [bx, bz] = versLocalArene(x, z);
  if (segmentLibreTemple(ax, az, bx, bz, m * 0.9, true)) { e.routeTemple = null; e.horsAtteinte = false; return { x, z }; }
  e.routeTempleT = (e.routeTempleT || 0) - dt; let R = e.routeTemple;
  if (!R || e.routeTempleT <= 0 || Math.hypot(bx - R.bx, bz - R.bz) > 1.5) {
    const G = grilleTemple(m, true), [si, sj] = caseLibreIle(G, ax, az), [gi, gj] = caseLibreIle(G, bx, bz), P = cheminGrilleIle(G, si, sj, gi, gj);
    R = e.routeTemple = { pts: P.map((k) => [G.o + ((k / G.n) | 0) * G.p, G.o + (k % G.n) * G.p]), bx, bz, w: null }; e.routeTempleT = 0.4;
    const fin = R.pts[R.pts.length - 1], porte = e.d && e.d.portee ? e.d.portee * (e.allonge || 1) * 0.8 : 1; e.horsAtteinte = !fin || Math.hypot(fin[0] - bx, fin[1] - bz) > porte; }
  if (R.pts.length < 2) return { x, z };
  if (!R.w || Math.hypot(R.w[0] - ax, R.w[1] - az) < 0.8) { R.w = null;
    for (let k = R.pts.length - 1; k >= 1; k--) if (segmentLibreTemple(ax, az, R.pts[k][0], R.pts[k][1], m * 0.9, true)) { R.w = R.pts[k]; break; }
    if (!R.w) R.w = R.pts[1]; }
  const [wx, wz] = versMondeArene(R.w[0], R.w[1]); return { x: wx, z: wz };
}
function cheminTemple(x, z) { /* le perso, au clic : jusqu'au point touche (ramene dans le carre), en contournant les statues */
  const pp = paysanMesh.position, c0 = paysanMesh.userData.cellule, m = TEMPLE.perso, [tx, tz] = bornerTemple(x, z, m), [ax, az] = versLocalArene(pp.x, pp.z), [bx, bz] = versLocalArene(tx, tz);
  if (segmentLibreTemple(ax, az, bx, bz, m * 0.9, false)) return [{ c: c0, x: tx, z: tz }];
  const G = grilleTemple(m, false), [si, sj] = caseLibreIle(G, ax, az), [gi, gj] = caseLibreIle(G, bx, bz), P = cheminGrilleIle(G, si, sj, gi, gj).map((k) => [G.o + ((k / G.n) | 0) * G.p, G.o + (k % G.n) * G.p]);
  const L = []; let de = [ax, az]; /* (on ne garde que les points ou il faut tourner : du dernier point garde, le plus loin qu'on voit en ligne droite) */
  for (let k = 1; k < P.length; ) { let j = P.length - 1; while (j > k && !segmentLibreTemple(de[0], de[1], P[j][0], P[j][1], m * 0.9, false)) j--; L.push(P[j]); de = P[j]; k = j + 1; }
  const out = L.map(([lx, lz]) => { const [wx, wz] = versMondeArene(lx, lz); return { c: c0, x: wx, z: wz }; });
  if (!out.length || Math.hypot(out[out.length - 1].x - tx, out[out.length - 1].z - tz) > 0.3) out.push({ c: c0, x: tx, z: tz });
  return out;
}

/* ---------- les crochets de 27-arene.js : le temple quand il est tire, le colisee sinon ---------- */
{ const dansAreneC = dansArene; dansArene = function (x, z) { return templeIci() ? dansTemple(x, z) : dansAreneC.apply(this, arguments); }; }
{ const bornerAreneC = bornerArene; bornerArene = function (x, z) { return templeIci() ? bornerTemple(x, z) : bornerAreneC.apply(this, arguments); }; }
{ const cheminAreneC = cheminArene; cheminArene = function (x, z) { return templeIci() ? cheminTemple(x, z) : cheminAreneC.apply(this, arguments); }; }
{ const pasMonstreAreneC = pasMonstreArene; pasMonstreArene = function (e, x, z, dt) { return templeIci() ? pasTemple(e, x, z, dt) : pasMonstreAreneC.apply(this, arguments); }; }
{ const bornerMonstresAreneC = bornerMonstresArene; bornerMonstresArene = function (c) { if (!templeIci()) return bornerMonstresAreneC.apply(this, arguments);
  c.monstres.forEach((o) => { if (o.etat !== 'actif' || o.d.vole) return; const q = bornerTemple(o.x, o.z, o.d.boss ? 0.9 : 0.3, true, o.traverseT > 0); o.x = q[0]; o.z = q[1]; }); }; } /* (traverse : un boss coince passe a travers les statues, il reste dans le temple) */

/* ---------- le chargement et l'affichage ---------- */
async function chargerTemple() {
  if (ileTemple) return ileTemple;
  const sc = await chargerGlb('assets/modeles/jeu/arene-temple.glb?v=' + (VERSIONS_FICHIERS['arene-temple.glb'] || VERSION_MODELES)), reperes = [], axe = new T.Vector3(0, 1, 0);
  sc.updateMatrixWorld(true); sc.traverse((o) => { if (/^repere_/.test(o.name)) { const p = new T.Vector3(); o.getWorldPosition(p); p.applyAxisAngle(axe, ROT_ARENE); reperes.push({ nom: o.name, p }); } }); /* (les flammes : dans le repere de l'ile, deja tourne) */
  versToon(sc, { echelle: 0.012, souple: SOUPLE_ILE, sansContour: SC_ILE, douce: true, centre: true });
  const garde = (m) => /^(drapeau_|grille)/.test(m.name) || !!(m.parent && /^(drapeau_|grille)/.test(m.parent.name)); /* (les bannieres qui flottent et les grilles de bambou qui se levent) */
  const g = new T.Group(), tour = new T.Group(); tour.rotation.y = ROT_ARENE; tour.add(fusionner(sc.getObjectByName('AreneTemple') || sc, { garder: garde })); g.add(tour); g.position.copy(ARENE);
  if (MODELES.montgolfiere) { const m = MODELES.montgolfiere.clone(true); m.traverse((o) => { delete o.userData.montgolfiere; }); m.position.set(16, 0, 3.9); m.rotation.set(0, -Math.PI / 2, 0); m.visible = true; g.add(m); g.userData.montgolfiere = m; } /* (la montgolfiere, a la meme place qu'au colisee) */
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const avant = typeof DV !== 'undefined' ? DV.arene : null;
  decorArene(g, reperes, null); /* (les flammes des torches et des braseros, les bannieres, les grilles qui se levent comme des herses, la poussiere ; 27e-decor-vivant.js) */
  if (avant && !templeIci()) DV.arene = avant;
  g.visible = false; scene.add(g); ileTemple = g; if (!soleil.target.parent) scene.add(soleil.target);
  return g;
}
function decorDeLaCarte() { if (typeof DV === 'undefined') return; const g = templeIci() ? ileTemple : ileArene; if (g) DV.arene = g; } /* (les herses et les flammes animees : celles de la carte du jour) */
function tirerCarteArene() {
  const L = TEMPLE_SORTI || MODE_TEST ? ['colisee', 'temple'] : ['colisee'], f = ARENE_CARTE.force;
  ARENE_CARTE.ici = f && L.includes(f) ? f : L[Math.floor(Math.random() * L.length)];
}
{ const chargerAreneC = chargerArene; chargerArene = async function () { if (templeIci()) await chargerTemple(); else await chargerAreneC.apply(this, arguments); decorDeLaCarte(); }; }
{ const montrerIlesC = montrerIles; montrerIles = function () { montrerIlesC.apply(this, arguments); const a = lieu === 'arene'; if (ileArene) ileArene.visible = a && !templeIci(); if (ileTemple) ileTemple.visible = a && templeIci(); }; }
const avecCarteArene = (f) => async function () { /* une nouvelle entree : une carte tiree au hasard (pas en plein combat) */
  if (!combat) { const avant = ARENE_CARTE.ici; tirerCarteArene(); if (lieu === 'arene' && ARENE_CARTE.ici !== avant) { await chargerArene(); montrerIles(); } }
  return f.apply(this, arguments);
};
partirArene = avecCarteArene(partirArene); partirDev = avecCarteArene(partirDev); partirEntrainement = avecCarteArene(partirEntrainement);

/* ---------- le mode test : forcer une carte ---------- */
const NOMS_CARTES = { null: 'au hasard', colisee: 'colisée', temple: 'temple' };
const boutonCarteArene = () => '<button class="btn mini" data-carte-arene="1">Arène : ' + NOMS_CARTES[ARENE_CARTE.force] + '</button>';
{ const bandeauTestC = bandeauTest; bandeauTest = function () { bandeauTestC.apply(this, arguments); const b = document.getElementById('bandeau-test'); if (!b) return; const v = b.querySelector('[data-carte-arene]'); if (v) v.outerHTML = boutonCarteArene(); else { const q = b.querySelector('[data-test="quitter"]'); if (q) q.insertAdjacentHTML('beforebegin', boutonCarteArene()); else b.insertAdjacentHTML('beforeend', boutonCarteArene()); } }; }
document.addEventListener('click', (e) => { const b = e.target.closest('[data-carte-arene]'); if (!b || !MODE_TEST) return;
  ARENE_CARTE.force = ARENE_CARTE.force === null ? 'colisee' : ARENE_CARTE.force === 'colisee' ? 'temple' : null;
  b.outerHTML = boutonCarteArene(); toast('Prochaine entrée à l\'Arène : ' + (ARENE_CARTE.force ? 'le ' + NOMS_CARTES[ARENE_CARTE.force] : 'une carte au hasard') + '.'); });
