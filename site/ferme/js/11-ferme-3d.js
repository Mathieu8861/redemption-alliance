'use strict';
/* ---------- l'enclos : un ensemble de cases que le joueur amenage lui-meme (Amenager l'enclos) ;
   la cloture suit son bord, un module par cote de case, le portillon au milieu du devant, l'auge dans le coin du fond ---------- */
const COTES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const caseGrille = (c, di, dj) => caseAt(c.i + di, c.j + dj);
const memeNiveau = (a, b) => Math.abs(posCase(a).y - posCase(b).y) < 0.1;
const casesEnclos = () => S_.cases.filter((c) => c.type === 'enclos');
const maxCasesEnclos = () => [6, 8, 10, 12, 14][nivBat('enclos') - 1];
const enclosVoisin = (c, di, dj) => { const v = caseGrille(c, di, dj); return !!v && v.type === 'enclos' && memeNiveau(v, c); };
function connexe(cells) { /* d'un seul tenant, au meme niveau */
  if (!cells.length) return true; const vu = new Set([cells[0]]), file = [cells[0]];
  while (file.length) { const c = file.shift(); COTES.forEach(([di, dj]) => { const v = caseGrille(c, di, dj); if (v && cells.includes(v) && !vu.has(v) && memeNiveau(v, c)) { vu.add(v); file.push(v); } }); }
  return vu.size === cells.length;
}
const ajoutablesEnclos = () => S_.cases.filter((c) => c.type === 'libre' && !(S_.sauvage && S_.sauvage.id === c.id) && COTES.some(([di, dj]) => { const v = caseGrille(c, di, dj); return v && v.type === 'enclos' && memeNiveau(v, c); }));
let clotureMesh = null, augePos = { x: 0, z: 0 };
function appliquerEnclos() {
  const E = casesEnclos(); if (clotureMesh) scene.remove(clotureMesh); clotureMesh = new T.Group(); scene.add(clotureMesh);
  if (!E.length) return;
  const P = E.map(posCase), xs = P.map((q) => q.x), zs = P.map((q) => q.z);
  Object.assign(enclosDef, { x: (Math.min(...xs) + Math.max(...xs)) / 2, z: (Math.min(...zs) + Math.max(...zs)) / 2, w: Math.max(...xs) - Math.min(...xs) + S, d: Math.max(...zs) - Math.min(...zs) + S, cellule: E[0].id });
  const bords = [];
  E.forEach((c) => { const q = posCase(c); COTES.forEach(([di, dj]) => { if (!enclosVoisin(c, di, dj)) bords.push({ c, di, dj, x: q.x + di * S / 2, y: q.y, z: q.z + dj * S / 2 }); }); });
  const devant = bords.filter((b) => b.dj === 1), zMax = Math.max(...devant.map((b) => b.z)), rang = devant.filter((b) => Math.abs(b.z - zMax) < 0.1).sort((a, b) => a.x - b.x), porte = rang[Math.floor((rang.length - 1) / 2)];
  const ne = nivBat('enclos'), style = MODELES.cloture1 ? 'cloture' + [1, 2, 3, 3, 5][ne - 1] : 'cloture'; /* la cloture et ses pieces suivent le niveau de l'enclos */
  bords.forEach((b) => clotureMesh.add(batiment(b === porte ? 'portillon' : style, b.x, b.y, b.z, b.c.id, b.di ? Math.PI / 2 : 0)));
  if (MODELES.portique2 && ne >= 2 && porte) clotureMesh.add(batiment('portique' + (ne >= 5 ? 5 : ne >= 3 ? 3 : 2), porte.x, porte.y, porte.z, porte.c.id, porte.di ? Math.PI / 2 : 0));
  const fond = E.slice().sort((a, b) => a.j - b.j || b.i - a.i)[0], qf = posCase(fond); augePos = { x: qf.x + 0.05, z: qf.z - 0.25 };
  clotureMesh.add(batiment('auge', augePos.x, qf.y, augePos.z, fond.id, 0.15));
  if (MODELES.abreuvoir && ne >= 2) { /* l'abreuvoir, la mangeoire puis la bergerie : dans les cases les plus loin de l'auge */
    const loin = E.filter((c) => c !== fond && (!porte || c !== porte.c)).map((c) => [c, posCase(c)]).sort((a, b) => Math.hypot(b[1].x - qf.x, b[1].z - qf.z) - Math.hypot(a[1].x - qf.x, a[1].z - qf.z));
    [['abreuvoir', 2], ['mangeoire', 3], ['bergerie' + (ne >= 5 ? 5 : 4), 4]].forEach(([nom, min], k) => { const L = loin[k]; if (L && ne >= min) clotureMesh.add(batiment(nom, L[1].x, L[1].y, L[1].z - 0.15, L[0].id, 0)); });
  }
  erre.forEach((e) => { if (e && !dansEnclos(e.x, e.z)) Object.assign(e, pointEnclos(), { cible: null }); });
}
/* un point ou un Bouftou peut se tenir : dans une case de l'enclos, a distance des barrieres */
function dansEnclos(x, z) {
  const c = caseIci(x, z); if (!c || c.type !== 'enclos') return false; const q = posCase(c);
  return COTES.every(([di, dj]) => enclosVoisin(c, di, dj) || (di ? Math.abs(q.x + di * S / 2 - x) : Math.abs(q.z + dj * S / 2 - z)) > 0.5);
}
function pointEnclos(pres) {
  const E = casesEnclos(); if (!E.length) return { x: enclosDef.x, z: enclosDef.z };
  let choix = E; const c0 = pres && caseIci(pres.x, pres.z);
  if (c0 && c0.type === 'enclos') choix = E.filter((c) => c === c0 || COTES.some(([di, dj]) => caseGrille(c0, di, dj) === c && memeNiveau(c, c0))); /* une case voisine : le chemin reste dans l'enclos */
  const q = posCase(hasard(choix)); return { x: q.x + (Math.random() - 0.5) * 0.9, z: q.z + (Math.random() - 0.5) * 0.9 };
}
/* AMENAGER L'ENCLOS (refait le 13/10/2026, « zero visibilite, zero indication, un enfer », Mathieu) : un + sur chaque case qu'on peut ajouter (herbe libre
   collee a l'enclos, qui ne coupe aucun acces), un - sur chaque case qu'on peut rendre (il reste 2 cases par Bouftou, d'un seul tenant), le compteur dans
   le bandeau ; « Déplacer tout l'enclos » est un mode a part (les cases de l'enclos en jaune), et toucher une case loin ne le fait plus demenager. */
const minCasesEnclos = () => Math.max(2, 2 * S_.bouftous.length);
const rendablesEnclos = () => { const E = casesEnclos(); return E.length - 1 < minCasesEnclos() ? [] : E.filter((c) => connexe(E.filter((x) => x !== c))); };
function ajoutablesSurs() { /* les cases qu'on peut vraiment ajouter : sans couper d'acces */
  if (!paysanMesh) return ajoutablesEnclos(); const deja = inaccessibles();
  return ajoutablesEnclos().filter((c) => { c.type = 'enclos'; const ok = !inaccessibles().some((x) => !deja.includes(x)); c.type = 'libre'; return ok; });
}
function texteEnclos() {
  const n = casesEnclos().length, max = maxCasesEnclos(), b = S_.bouftous.length, plus = n < max && ajoutablesSurs().length, moins = rendablesEnclos().length;
  return 'Enclos : ' + n + ' / ' + max + ' cases' + (b ? ' (' + b + ' Bouftou' + (b > 1 ? 's' : '') + ' : ' + minCasesEnclos() + ' au moins)' : '') + '. ' +
    (n >= max ? 'Il est plein : rends une case (−) pour la poser ailleurs (+), ou améliore l\'enclos pour en avoir plus.'
      : plus ? 'Touche un + pour ajouter une case' + (moins ? ', un − pour en rendre une.' : '.') : 'Pas de place autour de lui : libère de l\'herbe à côté, ou déplace tout l\'enclos.');
}
function agrandirEnclosAuto() { /* ajoute les cases qui manquent : collees a l'enclos, celles qui touchent le plus de cases de l'enclos d'abord (forme compacte) */
  let k = 0; const ajoutees = [];
  while (casesEnclos().length < maxCasesEnclos()) {
    const E = casesEnclos(), mi = E.reduce((t, c) => t + c.i, 0) / E.length, mj = E.reduce((t, c) => t + c.j, 0) / E.length;
    const L = ajoutablesSurs().map((c) => [c, COTES.filter(([di, dj]) => enclosVoisin(c, di, dj)).length, (c.i - mi) ** 2 + (c.j - mj) ** 2]).sort((a, b) => b[1] - a[1] || a[2] - b[2]);
    if (!L.length) break; L[0][0].type = 'enclos'; ajoutees.push(L[0][0]); rendreCase(L[0][0].id); k++;
  }
  if (ajoutees.length) ecarterPerso(ajoutees);
  return k;
}
const milieuEnclos = (E) => { const mi = E.reduce((t, c) => t + c.i, 0) / E.length, mj = E.reduce((t, c) => t + c.j, 0) / E.length; return E.slice().sort((x, y) => (x.i - mi) ** 2 + (x.j - mj) ** 2 - (y.i - mi) ** 2 - (y.j - mj) ** 2)[0]; };
function placeEnclos(p, ordre) { /* les cases ou irait l'enclos, sa case du milieu sur p, dans le premier sens qui rentre (null : pas la place) */
  const E = casesEnclos(); if (!E.length || !p) return null; const a = milieuEnclos(E), forme = E.map((c) => [c.i - a.i, c.j - a.j]);
  for (const r of ordre || [0, 1, 2, 3]) {
    const L = forme.map(([di, dj]) => [[di, dj], [-dj, di], [-di, -dj], [dj, -di]][r]).map(([di, dj]) => caseGrille(p, di, dj));
    if (L.every((c) => c && (c.type === 'libre' || c.type === 'enclos') && memeNiveau(c, p) && !(S_.sauvage && S_.sauvage.id === c.id))) return L;
  }
  return null;
}
/* l'apercu, a la souris : la ou l'enclos irait (vert), ou la case seule en rouge s'il n'y a pas la place */
let apercuEnclos = null, apercuCase = null;
function majApercuEnclos(c) {
  if (apercuEnclos) { scene.remove(apercuEnclos); apercuEnclos = null; } apercuCase = c;
  if (mode !== 'enclosDeplacer' || !c || c.type === 'enclos') return;
  const cells = c.type === 'libre' ? placeEnclos(c) : null, g = new T.Group();
  (cells || [c]).forEach((x) => { const q = posCase(x), m = new T.Mesh(new T.PlaneGeometry(S - 0.1, S - 0.1), cells ? MARQUE_OK : MARQUE_NON); m.rotation.x = -Math.PI / 2; m.position.set(q.x, q.y + 0.11, q.z); m.renderOrder = 4; g.add(m); });
  scene.add(g); apercuEnclos = g;
}
canvas.addEventListener('pointermove', (e) => { if (mode !== 'enclosDeplacer' || e.pointerType !== 'mouse') { if (apercuEnclos) majApercuEnclos(null); return; } const pt = pointSol(e), c = pt && caseIci(pt.x, pt.z); if (c !== apercuCase) majApercuEnclos(c); });
function ecarterPerso(cells) { /* le perso se trouve sur une case qui devient l'enclos (ou un batiment) : il s'ecarte sur la case libre la plus proche */
  if (!paysanMesh) return; const u = paysanMesh.userData;
  if (cells.includes(u.cellule) || cells.includes(caseIci(paysanMesh.position.x, paysanMesh.position.z))) { const v = S_.cases.find((c) => PASSABLE[c.type] && voisins(c).some((x) => cells.includes(x))); if (v) { const q = posCase(v); paysanMesh.position.set(q.x, q.y, q.z); u.cellule = v; u.y = q.y; chemin = []; } }
}
/* les reperes dessines : une case au bord pointille (verte : on peut l'ajouter), et au-dessus une pastille + ou - qui fait toujours face a la camera
   (posees a plat, vues de biais, le + avait l'air d'un x et le - s'ecrasait) ; pour deplacer l'enclos, ses cases en jaune et l'apercu en vert ou rouge */
const texMarque = (dessin) => { const c = document.createElement('canvas'); c.width = c.height = 128; dessin(c.getContext('2d')); const t = new T.CanvasTexture(c); t.anisotropy = 4; return t; };
const tuilePointillee = (fond) => new T.MeshBasicMaterial({ transparent: true, depthWrite: false, map: texMarque((x) => {
  x.beginPath(); const r = 18, a = 8, b = 120; x.moveTo(a + r, a); x.arcTo(b, a, b, b, r); x.arcTo(b, b, a, b, r); x.arcTo(a, b, a, a, r); x.arcTo(a, a, b, a, r); x.closePath();
  x.fillStyle = fond; x.fill(); x.lineWidth = 7; x.setLineDash([16, 10]); x.strokeStyle = 'rgba(255, 255, 255, .95)'; x.stroke(); }) });
const pastilleSigne = (fond, plus) => new T.SpriteMaterial({ depthTest: false, depthWrite: false, map: texMarque((x) => {
  x.beginPath(); x.arc(64, 64, 52, 0, Math.PI * 2); x.fillStyle = fond; x.fill(); x.lineWidth = 9; x.strokeStyle = '#3a2b1f'; x.stroke();
  x.fillStyle = '#fff'; x.fillRect(36, 56, 56, 16); if (plus) x.fillRect(56, 36, 16, 56); }) });
const MARQUE_PLUS = tuilePointillee('rgba(160, 235, 100, .5)'), SIGNE_PLUS = pastilleSigne('#4caf3a', true), SIGNE_MOINS = pastilleSigne('#e8742a', false), MARQUE_MOINS = SIGNE_MOINS;
const MARQUE_JAUNE = tuilePointillee('rgba(242, 182, 48, .5)'), MARQUE_OK = tuilePointillee('rgba(110, 215, 70, .75)'), MARQUE_NON = tuilePointillee('rgba(224, 83, 58, .6)');
let marquesEnclos = null;
function marquerEnclos() {
  if (marquesEnclos) { scene.remove(marquesEnclos); marquesEnclos = null; }
  if (apercuEnclos) { const c = apercuCase; majApercuEnclos(null); if (mode === 'enclosDeplacer') majApercuEnclos(c); } /* (l'apercu suit l'enclos qui vient de bouger) */
  if (mode !== 'enclos' && mode !== 'enclosDeplacer') return;
  const g = new T.Group(), E = casesEnclos();
  const tuile = (c, mat) => { const q = posCase(c), m = new T.Mesh(new T.PlaneGeometry(S - 0.1, S - 0.1), mat); m.rotation.x = -Math.PI / 2; m.position.set(q.x, q.y + 0.09, q.z); m.renderOrder = 3; m.userData.cellule = c.id; g.add(m); };
  const signe = (c, mat) => { const q = posCase(c), sp = new T.Sprite(mat), k = innerWidth < 720 ? 1.1 : 0.78; sp.scale.set(k, k, 1); /* (plus grosses au telephone) */ sp.position.set(q.x, q.y + 0.55, q.z); sp.renderOrder = 6; sp.userData.cellule = c.id; g.add(sp); };
  if (mode === 'enclosDeplacer') E.forEach((c) => tuile(c, MARQUE_JAUNE));
  else { if (E.length < maxCasesEnclos()) ajoutablesSurs().forEach((c) => { tuile(c, MARQUE_PLUS); signe(c, SIGNE_PLUS); }); rendablesEnclos().forEach((c) => signe(c, SIGNE_MOINS)); }
  scene.add(g); marquesEnclos = g;
}

/* ---------- la voliere : un module par case ; au niveau 1 un deuxieme se pose sur une case libre a cote, au niveau 3 ils prennent un etage ---------- */
const voisinLibreVoliere = () => { const B = S_.cases.filter((c) => c.type === 'voliere'); for (const c of B) for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const v = caseGrille(c, di, dj); if (v && v.type === 'libre' && memeNiveau(v, c) && !(S_.sauvage && S_.sauvage.id === v.id)) return v; } return null; };
const bloqueursVoliere = () => S_.cases.filter((c) => c.type === 'voliere').length >= 2 || voisinLibreVoliere() ? [] : [1];
let volieresMesh = [], tofusVoliere = [];
function appliquerVoliere() {
  if (niv('voliere') >= 1 && S_.cases.filter((c) => c.type === 'voliere').length < 2) { const v = voisinLibreVoliere(); if (v) { v.type = 'voliere'; if (casesDyn[v.id]) rendreCase(v.id); } }
  volieresMesh.forEach((m) => scene.remove(m)); volieresMesh = [];
  const B = S_.cases.filter((c) => c.type === 'voliere').sort((a, b) => a.i - b.i || a.j - b.j), nv = nivBat('voliere'), k = 1;
  const a = rotDe('voliere'), [vx, vz] = tourne(0, -0.1, a);
  if (nv === 1 || !B.length) B.forEach((c) => { const q = posCase(c), v = batiment('voliere1', q.x + vx, q.y, q.z + vz, c.id, a); volieresMesh.push(v); });
  else { /* un seul grand batiment, au milieu de ses cases, le long de leur axe, face a la camera */
    const P = B.map(posCase), mx = P.reduce((t, q) => t + q.x, 0) / P.length, mz = P.reduce((t, q) => t + q.z, 0) / P.length;
    let ry = B.length > 1 ? Math.atan2(-(P[1].z - P[0].z), P[1].x - P[0].x) : a; if (Math.sin(ry) + Math.cos(ry) < 0) ry += Math.PI;
    const v = batiment('voliere' + nv, mx, P[0].y, mz, B[0].id, ry); volieresMesh.push(v);
  }
  if (B.length) { const P = B.map(posCase); ancres.voliere = new T.Vector3(P.reduce((t, q) => t + q.x, 0) / P.length, P[0].y + (volieresMesh[0].userData.hauteur || 1.8) * k + 0.25, P.reduce((t, q) => t + q.z, 0) / P.length); }
  rendreTofusVoliere(); if (S_.bats) majFeu('voliere', true);
}
/* LA VOLIERE-JARDIN (08/11/2026, « refais la voliere, qu'on voie a l'interieur les Tofus et leur nom ; on dirait une prison, on voit pas les Tofus », Mathieu) :
   le modele n'a plus de toit (blender/voliere-niveaux.py, version 4) ; les vrais Tofus se posent sur la paille, repartis sur toute la voliere, hors de l'arbre,
   de la mangeoire, de l'abreuvoir et des nichoirs (cotes du modele : VOLIERE_DIM = DIMS du script) ; chacun a un nom, montre au survol de la voliere */
const VOLIERE_DIM = [null, [0.6, 0.45, 1.3], [1.0, 0.68, 1.6], [1.2, 0.8, 1.79], [1.45, 0.95, 1.98], [1.75, 1.1, 2.2]]; /* (W, D, hauteur du faite) */
function placesVoliere(nv, n) {
  const [W, D] = VOLIERE_DIM[nv] || VOLIERE_DIM[1], obst = [[W * 0.45, -D * 0.35, 0.2], [-W * 0.55, D * 0.55, Math.min(0.42, W * 0.45) / 2 + 0.1], [W * 0.6, D * 0.5, 0.17]];
  if (nv >= 2) obst.push([-W + Math.min(0.95, W * 0.8), -D + 0.5, 0.08]); if (nv >= 3) obst.push([W * 0.85, -D + 0.2, 0.12]); if (nv >= 4) obst.push([-W * 0.15, -D + 0.18, 0.1]); if (nv >= 5) obst.push([W * 0.1, -D + 0.18, 0.1]);
  const L = []; for (let x = -W + 0.16; x <= W - 0.16; x += 0.24) for (let z = -D + 0.15; z <= D - 0.15; z += 0.24) if (!obst.some(([a, b, r]) => Math.hypot(x - a, z - b) < r + 0.09)) L.push([x, z]);
  if (!L.length) return Array.from({ length: n }, () => [0, 0]); /* (le plus au milieu d'abord, puis chaque fois la place la plus loin de toutes les autres : ils se repartissent sur toute l'herbe) */
  const out = [L.reduce((m, p) => (Math.hypot(p[0], p[1]) < Math.hypot(m[0], m[1]) ? p : m))];
  while (out.length < Math.min(n, L.length)) { let best = null, bd = -1; L.forEach((p) => { const d = Math.min(...out.map((q) => Math.hypot(p[0] - q[0], p[1] - q[1]))); if (d > bd) { bd = d; best = p; } }); out.push(best); }
  while (out.length < n) out.push(out[out.length % L.length]); return out;
}
const NOMS_TOFUS = ['Pioupiou', 'Plumette', 'Cui-Cui', 'Picorette', 'Duvet', 'Biscotte', 'Piaf', 'Coco', 'Tofinou', 'Grainette', 'Tartine', 'Caramel', 'Choupette', 'Flan', 'Brioche', 'Moustique', 'Pompon', 'Cacahuète', 'Noisette', 'Patapouf', 'Bigoudi', 'Croquette', 'Gribouille', 'Pistache'];
const NOMS_DORES = ['Pépite', 'Lingot', 'Doublon', 'Sou d\'or', 'Écu', 'Florin'];
function nomTofu(k) { /* le meme nom pour la meme place de la voliere ; les dores d'abord */
  const nD = Math.min(S_.tofusDores || 0, S_.tofus); if (k < nD) return NOMS_DORES[k % NOMS_DORES.length] + (k >= NOMS_DORES.length ? ' ' + (Math.floor(k / NOMS_DORES.length) + 1) : '');
  const g = [...((S_.perso && S_.perso.nom) || 'x')].reduce((t, c) => t + c.charCodeAt(0), 0), i = k - nD; return NOMS_TOFUS[(g + i * 5) % NOMS_TOFUS.length] + (i >= NOMS_TOFUS.length ? ' ' + (Math.floor(i / NOMS_TOFUS.length) + 1) : '');
}
function rendreTofusVoliere() {
  tofusVoliere.forEach((m) => { scene.remove(m); if (m.userData.etiq) m.userData.etiq.remove(); }); tofusVoliere = []; Object.keys(ancres).filter((c) => /^tofu\d/.test(c)).forEach((c) => delete ancres[c]);
  if (!MODELES.tofu || !volieresMesh.length) return;
  const nv = nivBat('voliere'), K = MODELES.voliereK || 1, C = nv === 1 && MODELES.voliereC ? MODELES.voliereC : { x: 0, z: 0 }, nb = volieresMesh.length, places = placesVoliere(nv, Math.ceil(S_.tofus / nb));
  for (let k = 0; k < S_.tofus; k++) {
    const v = volieresMesh[k % nb], [mx, mz] = places[Math.floor(k / nb) % places.length], e = v.scale.x;
    const t = marquer(cloner('tofu'), v.userData.cellule || 'm2_0'); t.scale.setScalar(0.42); if (k < (S_.tofusDores || 0)) { dorerTofu(t); auraDoree(t, 0.45); } /* (les Tofus dores de la voliere et leur aura, 07/11/2026) */
    const [ox, oz] = tourne((mx - C.x) * K * e, (mz - C.z) * K * e, v.rotation.y); t.userData.base = { x: v.position.x + ox, y: v.position.y + 0.058 * K * e, z: v.position.z + oz }; t.userData.nomTofu = nomTofu(k);
    poser(t, t.userData.base.x, t.userData.base.y, t.userData.base.z, 0.6 + k * 1.3); tofusVoliere.push(t);
  }
  if (nomsTofusFin) montrerNomsTofus(nomsTofusFin - performance.now());
}
let nomsTofusFin = 0;
function montrerNomsTofus(ms) { /* les noms au-dessus des Tofus de la voliere, quelques secondes (au survol de la voliere, 12-perso.js) */
  nomsTofusFin = performance.now() + Math.max(500, ms || 3000);
  tofusVoliere.forEach((t, k) => { const cle = 'tofu' + k; if (!t.userData.etiq) { const b = document.createElement('div'); b.className = 'bulle nom-tofu' + (k < (S_.tofusDores || 0) ? ' dore' : ''); b.dataset.ancre = cle; b.textContent = (k < (S_.tofusDores || 0) ? '★ ' : '') + t.userData.nomTofu; zoneBulles.appendChild(b); t.userData.etiq = b; } ancres[cle] = ancres[cle] || new T.Vector3(); });
}
function majNomsTofus() {
  if (!nomsTofusFin) return; const fini = performance.now() > nomsTofusFin || lieu !== 'ferme' || combat;
  tofusVoliere.forEach((t, k) => { const cle = 'tofu' + k; if (fini) { delete ancres[cle]; if (t.userData.etiq) { t.userData.etiq.remove(); t.userData.etiq = null; } return; } const a = ancres[cle]; if (a) { t.getWorldPosition(a); a.y += 0.4 + (k % 2) * 0.16; } });
  if (fini) nomsTofusFin = 0;
}

/* ---------- les batiments sont poses d'apres leurs cases : on les deplace avec Amenager ---------- */
const BATIS = { forge: 'l\'atelier de forgemagie', atelier: 'l\'atelier', grange: 'la grange', hdv: 'l\'HDV', voliere: 'la volière', geliere: 'la Gelière', puits: 'le puits', epouvantail: 'l\'épouvantail', leurre: 'le leurre à Wabbits', niche: 'la maison de ton gardien', foin: 'le foin', montgolfiere: 'la montgolfière' }; /* (la montgolfiere depuis le 14/10/2026 : elle se deplace comme le reste) */
function blocBati(type) {
  const B = S_.cases.filter((c) => c.type === type); if (!B.length) return null;
  const i0 = Math.min(...B.map((c) => c.i)), j0 = Math.min(...B.map((c) => c.j)), P = B.map(posCase);
  return { B, c0: B.find((c) => c.i === i0 && c.j === j0) || B[0], w: Math.max(...B.map((c) => c.i)) - i0 + 1, h: Math.max(...B.map((c) => c.j)) - j0 + 1, x: P.reduce((t, q) => t + q.x, 0) / P.length, y: P[0].y, z: P.reduce((t, q) => t + q.z, 0) / P.length };
}
/* les arbres : a leur place d'origine (sur le bord de l'ile), ou replantes sur une case (elle devient 'arbre') */
let arbresMesh = {};
function arbresSurCases() {
  S_.arbres = S_.arbres || {};
  (MODELES.arbres || []).forEach((A) => { const st = S_.arbres[A.nom] || (S_.arbres[A.nom] = {}); if (st.cell || st.range) return; const c = caseIci(A.base.x, A.base.z); if (c && c.type === 'libre') { c.type = 'arbre'; c.arbre = A.nom; st.cell = c.id; st.orig = true; } });
  decosSurCases();
}
function construireArbres() {
  Object.values(arbresMesh).forEach((m) => scene.remove(m)); arbresMesh = {};
  (MODELES.arbres || []).forEach((A) => {
    if (S_.arbres && S_.arbres[A.nom] && S_.arbres[A.nom].range) return; /* (range dans les decorations) */
    const m = A.g.clone(true), st = S_.arbres && S_.arbres[A.nom], c = st && st.cell ? S_.cases.find((x) => x.id === st.cell) : null;
    if (c && c.type === 'arbre' && !st.orig) { const q = posCase(c); m.position.set(q.x, q.y, q.z); } else m.position.copy(A.base); /* tant qu'il n'a pas bouge, il garde sa place exacte */
    m.rotation.y = ((st && st.rot) || 0) * Math.PI / 2; m.traverse((o) => { o.userData.arbre = A.nom; });
    scene.add(m); arbresMesh[A.nom] = m;
  });
  construireDecos();
}
/* LES DECORATIONS (13/10/2026) : « les cailloux comme ca, fais en sorte que ce soit des elements de decor aussi. J'aimerais qu'on puisse ranger les elements
   de decoration si on veut, on peut les mettre sur la map ou dans un inventaire dedie a la deco, et qu'on puisse acheter des choses aussi » (Mathieu, maquette
   validee). Une decoration occupe sa case (on ne la traverse pas, comme un arbre), sans aucun effet, hors quota de parcelles. Avec Amenager : la deplacer,
   la tourner, ou la ranger dans S_.decos (le stock, « Mes décorations »), d'ou on la repose. Les deux rochers moussus de l'ile en deviennent (une fois,
   S_.rochersIle), puis les lanternes de l'escalier, et gardent leur modele tant qu'ils sont poses (c.ile) ; un arbre de l'ile range revient comme l'arbre du meme genre. Les 12 modeles
   (blender/deco.py, 0,6 Mo) arrivent au premier besoin. pr : le pronom (pour LE deplacer, LA, LES). */
const DECOS = {
  rocher: { nom: 'Rocher moussu', prix: 800, niv: 1, pr: 'le' }, gros_rocher: { nom: 'Gros rochers', prix: 1800, niv: 1, pr: 'les' },
  champignons: { nom: 'Champignons', prix: 1200, niv: 1, pr: 'les' }, fleurs: { nom: 'Parterre de fleurs', prix: 1500, niv: 1, pr: 'le' },
  lanterne: { nom: 'Lanterne de pierre', prix: 2500, niv: 10, pr: 'la' }, banc: { nom: 'Banc de bois', prix: 2000, niv: 10, pr: 'le' },
  arbre_rond: { nom: 'Arbre rond', prix: 2000, niv: 15, pr: 'le' }, sapin: { nom: 'Sapin', prix: 2500, niv: 15, pr: 'le' },
  pommier: { nom: 'Pommier', prix: 3000, niv: 20, pr: 'le' }, statue_gelee: { nom: 'Statue de Gelée', prix: 8000, niv: 25, pr: 'la' },
  fontaine: { nom: 'Fontaine', prix: 12000, niv: 30, pr: 'la' }, banniere: { nom: 'Bannière de Redemption', prix: 20000, niv: 40, pr: 'la' },
  foin: { nom: 'Bottes de foin', prix: 600, niv: 1, pr: 'les', bottes: true }, /* (05/11/2026 : les trois bottes du decor de la ferme, devenues une decoration ; leur modele vient des objets du jeu, pas de deco.glb) */
  /* (01/11/2026, « des routes pavees, un peu dans le meme style que les pierres qu'on a sur les batiments, des lanternes de lumiere, et des petites clotures
     pour separer nos differents champs », Mathieu) sol : la route est un sol, comme l'herbe (c.pave : « fais en sorte qu'on puisse poser un batiment ou une
     deco par-dessus les paves », Mathieu, le meme soir) ; bord : la cloture se pose sur le
     bord d'une case (S_.clotures), juste decorative ; lumiere : la hauteur de son verre et la taille de sa lueur */
  route_pavee: { nom: 'Route pavée', prix: 250, niv: 1, pr: 'la', sol: true }, cloture: { nom: 'Petite clôture', prix: 150, niv: 1, pr: 'la', bord: true },
  /* LA PORTEE DES LUMIERES ET LEUR PRIX (09/11/2026, « le lampadaire, ca reduit de 1, une zone comme celle que je t'envoie, et c'est 25k avec les decos ;
     les lanternes au sol, cercle encore plus petit, 15k ; les torches, cercle 2 fois plus grand qu'un lampadaire, 10k et des ressources pour les fabriquer », Mathieu) :
     portee = le rayon du cercle qu'elle eclaire la nuit, en unites (une case : 2). Le lampadaire passe de 4,2 (2,1 cases) a 2,2 (1,1 case), la petite lanterne
     de 2,5 a 1,4, la torche de 5,25 a 4,4 (deux fois le lampadaire). La torche ne s'achete plus : elle se fabrique a l'atelier (RECETTES_ATELIER, 03-equipements.js) */
  lanterne_sol: { nom: 'Petite lanterne', prix: 15000, niv: 5, pr: 'la', lumiere: { y: 0.25, r: 0.6, portee: 1.4 } }, lanterne_pied: { nom: 'Lanterne sur pied', prix: 25000, niv: 12, pr: 'la', lumiere: { y: 1.77, r: 1.0, portee: 2.2 } },
  torche: { nom: 'Torche', prix: 10000, niv: 10, pr: 'la', atelier: true, lumiere: { y: 1.78, r: 1.25, portee: 4.4 } },
  /* (11/11/2026, « a l'atelier on peut craft des lanternes UV qui permettent de faire pousser les champs la nuit a 100 % », Mathieu) : fabriquee a l'atelier ; la nuit,
     les champs a une case et demie d'elle poussent a plein (UV_PORTEE, 14i-nuit.js). Son modele : celui de la lanterne sur pied, au verre violet, en attendant le sien */
  lanterne_uv: { nom: 'Lanterne UV', prix: 30000, niv: 90, pr: 'la', atelier: true, copie: 'lanterne_pied', verre: '#b58cff', uv: true, lumiere: { y: 1.77, r: 1.0, portee: 2.2, teinte: '#b58cff' } }, /* (08/11/2026, « il faudra acheter des lampadaires » puis « rajoute aussi des lampes torches », Mathieu : pendant la nuit de la foret, lanternes et torches y percent un cercle de lumiere, 21-combat.js) */
};
const nbDecos = (k) => (S_ && S_.decos && S_.decos[k]) || 0;
const accordDeco = (k, mot) => mot + ({ la: 'e', les: 's' }[DECOS[k].pr] || '');
const texteDeco = (k) => { const D = DECOS[k] || { nom: 'Décoration', pr: 'la' }; return D.nom + ' : touche une case d\'herbe libre pour ' + D.pr + ' déplacer, Tourner pour ' + D.pr + ' pivoter, Ranger pour ' + D.pr + ' mettre dans tes décorations.' + (D.uv ? ' En violet : les cases qu\'elle couvre la nuit.' : ''); };
let decosMesh = [], decosCharge = null; const pavesMesh = new Map();
/* (01/11/2026, « il faudrait que ce soit a la meme hauteur que l'herbe », puis « rends les dalles plus detaillees, comme les batiments », Mathieu) : le lit de
   joints a 2,6 cm au-dessus de l'herbe, les paves bombes 2 a 3 cm plus haut. Dans blender/deco.py le lit va de -0,015 a 0,015 et les paves de -0,015 a
   0,035 (plus le relief, des deux cotes) : le milieu du modele est a 0,01, le dessus du lit 0,005 au-dessus */
const yPave = (P) => { if (P.userData.yPave == null) P.userData.yPave = 0.021 - new T.Box3().setFromObject(P).getSize(new T.Vector3()).y / 2; return P.userData.yPave; };
function assurerDecos() {
  if (MODELES.deco_rocher) return Promise.resolve(); if (decosCharge) return decosCharge;
  decosCharge = chargerGlb('assets/modeles/jeu/deco.glb?v=' + VERSION_MODELES).then((G) => {
    versToon(G, { echelle: 0.012, souple: SOUPLE_ILE, sansContour: SC_ILE, douce: true, centre: true }); /* (au style de l'ile, faites avec les memes outils) */
    Object.keys(DECOS).filter((k) => !DECOS[k].bottes).concat(['cloture_poteau']).forEach((k) => { MODELES['deco_' + k] = gabaritEchelle(G, 'Deco_' + ((DECOS[k] || {}).copie || k), 1);
      if (DECOS[k] && DECOS[k].verre) MODELES['deco_' + k].traverse((o) => { if (o.isMesh && o.material && o.material.isMeshBasicMaterial) { o.material = o.material.clone(); o.material.color.set(DECOS[k].verre); } }); }); /* (copie et verre : un modele d'attente, celui d'une autre decoration au verre reteinte ; la lanterne UV, 11/11/2026) */ /* (le poteau d'un coin de cloture : pas a vendre) */
    modeleFoin();
    if (S_ && S_.perso) construireDecos();
  }).catch((e) => { console.warn('Décorations', e); decosCharge = null; });
  return decosCharge;
}
/* les bottes de foin en decoration : les trois bottes du decor, a la place qu'elles avaient autour du centre de leur case */
function modeleFoin() {
  if (MODELES.deco_foin || !MODELES.botte) return; const g = new T.Group();
  [[-0.35, 0, -0.2, 0.3], [0.45, 0, 0.35, -0.5], [0.05, 0.55, 0.05, 1.2]].forEach(([dx, dy, dz, r]) => { const b = MODELES.botte.clone(true); b.position.set(dx, dy, dz); b.rotation.y = r; g.add(b); });
  MODELES.deco_foin = g;
}
function decosSurCases() { /* les pieces de l'ile (rochers, lanternes) deviennent des decorations, une seule fois (S_.rochersIle, le nom est reste) ;
  si leur case est prise, ou si elles couperaient un passage, elles attendent dans tes decorations */
  S_.rochersIle = S_.rochersIle || []; const ranges = [];
  (MODELES.piecesIle || []).forEach((R, k) => {
    if (S_.rochersIle[k]) return; S_.rochersIle[k] = 1;
    if (R.genre === 'lanterne') { S_.ileLibre = S_.ileLibre || {}; S_.ileLibre[k] = 1; return; } /* (a sa place, contre le muret : elle ne prend pas de case) */
    const c = caseIci(R.base.x, R.base.z);
    let ok = c && c.type === 'libre' && !(S_.sauvage && S_.sauvage.id === c.id);
    if (ok) { const deja = inaccessibles(); c.type = 'deco'; ok = !inaccessibles().some((x) => !deja.includes(x)); c.type = 'libre'; }
    if (ok) Object.assign(c, { type: 'deco', deco: R.genre, ile: k, orig: true });
    else { S_.decos = S_.decos || {}; S_.decos[R.genre] = nbDecos(R.genre) + 1; ranges.push(R.genre); }
  });
  if (ranges.length) setTimeout(() => toast('Les rochers et les lanternes de l\'île sont maintenant des décorations. ' + ranges.length + ' gênai' + (ranges.length > 1 ? 'ent' : 't') + ' un passage : ' + (ranges.length > 1 ? 'elles t\'attendent' : 'elle t\'attend') + ' dans tes décorations (Aménager, puis Décorations).', 'or'), 5000);
}
function construireDecos() {
  modeleFoin(); /* (les bottes de foin : faites des objets du jeu, deja la) */
  lanternesAnim.forEach((A) => { jeter(A.sol); A.halo.material.dispose(); if (A.anneau) jeter(A.anneau); }); fontainesAnim.forEach((A) => jeter(A.g)); /* (leur lueur et leur eau sont faites ici : on les libere, 01/11/2026) */
  decosMesh.forEach((m) => scene.remove(m)); decosMesh = []; fontainesAnim = []; lanternesAnim = []; pavesMesh.clear(); let manque = false;
  S_.cases.forEach((c) => {
    if (c.type === 'route') { c.type = 'libre'; c.pave = c.deco || 'route_pavee'; if (c.rotD) c.paveRot = c.rotD; delete c.deco; delete c.rotD; } /* (la route posee comme une case, le 01/11 au soir : devenue un sol) */
    if (c.pave) { const P = MODELES['deco_' + c.pave]; if (!P) manque = true; else { /* le sol pave, sous ce qui est pose dessus ; cache sous un champ */
      const m = marquer(P.clone(true), c.id), q = posCase(c); m.position.set(q.x, q.y + yPave(P), q.z); m.rotation.y = (c.paveRot || 0) * Math.PI / 2; m.visible = c.type !== 'champ'; scene.add(m); decosMesh.push(m); pavesMesh.set(c.id, m); } }
    if (c.type !== 'deco') return;
    const R = c.ile != null && MODELES.piecesIle && MODELES.piecesIle[c.ile], M = R ? R.g : MODELES['deco_' + c.deco]; if (!M) { manque = true; return; }
    const m = marquer(M.clone(true), c.id), q = posCase(c);
    if (R && c.orig) m.position.copy(R.base); else m.position.set(q.x, q.y, q.z); /* (un rocher de l'ile garde sa place exacte tant qu'il n'a pas bouge) */
    m.rotation.y = (c.rotD || 0) * Math.PI / 2; scene.add(m); decosMesh.push(m);
    if (!R && c.deco === 'fontaine') { const A = eauFontaine(m); marquer(A.g, c.id); fontainesAnim.push(A); } /* (son eau, animee, 01/11/2026) */
    if (!R && DECOS[c.deco] && DECOS[c.deco].lumiere) lueurLanterne(m, DECOS[c.deco].lumiere); /* (sa lueur, 01/11/2026) */
  });
  construireClotures();
  Object.keys(S_.ileLibre || {}).forEach((k) => { const R = MODELES.piecesIle && MODELES.piecesIle[k]; if (!R || !S_.ileLibre[k]) return;
    const m = R.g.clone(true); m.position.copy(R.base); m.traverse((o) => { o.userData.piece = +k; }); scene.add(m); decosMesh.push(m); });
  if (manque) assurerDecos();
}
/* LES LANTERNES QUI LUISENT (01/11/2026) : le verre brille deja (matiere lumiere) ; autour, un halo chaud qui palpite comme une flamme, et une flaque de
   lumiere doree au sol (en couleur normale : en lumiere additive, elle virait au blanc sur l'herbe claire). Allumees seulement quand il fait nuit sur la carte (plus bas) */
/* (09/11/2026, « ameliore un peu la luminosite des lampadaires, et qu'on voie aussi, quand on est dans une vague, leur portee d'efficacite », Mathieu) : un halo plus
   grand et plus vif, une flaque de lumiere plus large ; pendant une vague a la ferme, un cercle pointille dore au sol montre jusqu'ou chaque lampe allumee eclaire
   (le cercle de lumiere qu'elle perce dans la nuit de la foret, TROU_NUIT, 21-combat.js) */
let lanternesAnim = [], texHalo = null, texFlaqueLumiere = null, texPortee = null;
function porteeLanterne(A) { /* le cercle de sa portee, cree a la premiere vague */
  texPortee = texPortee || texCanvas(256, (g, n) => { const c = n / 2; g.fillStyle = 'rgba(255,214,120,0.07)'; g.beginPath(); g.arc(c, c, c - 4, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,224,140,0.95)'; g.lineWidth = 5; g.setLineDash([16, 11]); g.beginPath(); g.arc(c, c, c - 5, 0, Math.PI * 2); g.stroke(); });
  const R = A.portee, m = new T.Mesh(new T.CircleGeometry(R, 48), new T.MeshBasicMaterial({ map: texPortee, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.copy(A.sol.position); m.position.y += 0.02; m.renderOrder = 2; m.raycast = () => {}; scene.add(m); decosMesh.push(m); A.anneau = m; return m;
}
function lueurLanterne(m, L) {
  texHalo = texHalo || texCanvas(64, (g, n) => { const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); r.addColorStop(0, 'rgba(255,246,210,1)'); r.addColorStop(0.35, 'rgba(255,206,100,0.6)'); r.addColorStop(1, 'rgba(255,160,40,0)'); g.fillStyle = r; g.fillRect(0, 0, n, n); });
  texFlaqueLumiere = texFlaqueLumiere || texCanvas(64, (g, n) => { const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); r.addColorStop(0, 'rgba(255,220,130,0.75)'); r.addColorStop(0.6, 'rgba(255,195,95,0.28)'); r.addColorStop(1, 'rgba(255,170,60,0)'); g.fillStyle = r; g.fillRect(0, 0, n, n); });
  const halo = new T.Sprite(new T.SpriteMaterial({ map: texHalo, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); halo.scale.setScalar(L.r * 1.9); halo.position.set(m.position.x, m.position.y + L.y, m.position.z); halo.renderOrder = 6;
  const sol = new T.Mesh(new T.CircleGeometry(L.r * 2.5, 32), new T.MeshBasicMaterial({ map: texFlaqueLumiere, transparent: true, depthWrite: false })); sol.rotation.x = -Math.PI / 2; sol.position.set(m.position.x, m.position.y + 0.03, m.position.z); sol.renderOrder = 2;
  if (L.teinte) { halo.material.color.set(L.teinte); sol.material.color.set(L.teinte); } /* (la lueur violette de la lanterne UV) */
  [halo, sol].forEach((o) => { o.raycast = () => {}; scene.add(o); decosMesh.push(o); });
  const verres = []; m.traverse((o) => { if (o.isMesh && o.material && o.material.isMeshBasicMaterial) { const M = o.material; if (!M.userData.allume) { M.userData.allume = M.color.clone(); M.userData.eteint = M.color.clone().lerp(new T.Color('#5d6466'), 0.65); } verres.push(M); } }); /* (le verre qui brille : sa couleur allumee et sa couleur eteinte) */
  const a = lanternesAllumees() ? 1 : 0; lanternesAnim.push({ halo, sol, r: L.r, portee: L.portee || L.r * TROU_NUIT, ph: Math.random() * 6, verres, a }); allumerLanterne(lanternesAnim[lanternesAnim.length - 1]);
}
/* LES LANTERNES SUIVENT LA NUIT DE LA CARTE (09/11/2026, « quand il fait jour sur la map, ils sont eteints ; s'il fait nuit, ils s'allument, tout simplement.
   Ils s'allumeront que pendant les vagues pour l'instant ; a un moment, on mettra un mode jour-nuit », Mathieu) : allumees pendant la nuit de la foret
   (NUIT_F, les vagues du palier 10) et la nuit lunaire du Golem (NUIT), eteintes le reste du temps. Du 05/11 au 09/11/2026, elles suivaient la vraie heure
   de Paris (« les lampadaires, ils peuvent etre eteints le jour ? ») : la carte restait en plein jour avec ses lanternes allumees le soir. Le jour ou la ferme
   aura son cycle jour-nuit, c'est ici qu'il se branche. LANTERNES_FORCE (true ou false) les force, pour les tests. */
let LANTERNES_FORCE = null;
const nuitSurLaCarte = () => !!((typeof NUIT_F !== 'undefined' && NUIT_F && NUIT_F.actif) || (typeof NUIT !== 'undefined' && NUIT && NUIT.actif) || nuitFermeLa() || (typeof pluieLa === 'function' && pluieLa())); /* (pluieLa : sous la pluie a l'essai du palier 11, les lanternes s'allument aussi ; 14j-pluie.js) */ /* (nuitFermeLa : le jour et la nuit du palier 10, 14i-nuit.js) */
function lanternesAllumees() { return LANTERNES_FORCE != null ? LANTERNES_FORCE : nuitSurLaCarte(); }
function allumerLanterne(A) { A.halo.visible = A.sol.visible = A.a > 0.01; A.halo.material.opacity = A.a; A.verres.forEach((M) => M.color.copy(M.userData.eteint).lerp(M.userData.allume, A.a)); }
function animerLanternes(s) {
  if (!lanternesAnim.length || lieu === 'arene' || lieu === 'ile') return;
  const now = performance.now(); if (!animerLanternes.t || now - animerLanternes.t > 2000) { animerLanternes.t = now; animerLanternes.cible = lanternesAllumees() ? 1 : 0; } /* (l'heure, relue toutes les 2 s) */
  const c = animerLanternes.cible, dt = Math.min(0.1, (now - (animerLanternes.d || now)) / 1000); animerLanternes.d = now;
  lanternesAnim.forEach((A) => { if (A.a !== c) { A.a = c > A.a ? Math.min(c, A.a + dt) : Math.max(c, A.a - dt); allumerLanterne(A); } if (A.a <= 0.01) { if (A.anneau) A.anneau.visible = false; return; } /* (un fondu d'une seconde) */
    const vague = !!combat && !combat.fin && lieu === 'ferme'; if (vague || A.anneau) { const an = A.anneau || porteeLanterne(A); an.visible = vague; if (vague) { an.material.opacity = A.a * (0.75 + 0.25 * Math.sin(s * 3 + A.ph)); an.rotation.z = s * 0.15 + A.ph; } } /* (sa portee, pendant une vague) */
    { const large = MODE_TEST && typeof nuitFermeLa === 'function' && nuitFermeLa(); if (A.sol.userData.y0 == null) A.sol.userData.y0 = A.sol.position.y; A.sol.position.y = A.sol.userData.y0 + (large ? 0.1 : 0); A.sol.scale.setScalar(large ? (A.portee * 1.4) / (A.r * 2.5) : 1); }
    /* (la flaque de lumiere, dans la nuit de la ferme : « ca eclaire d'un cote, mais il ne devrait pas y avoir d'ombre dans son rayon de portee », Mathieu, 11/11/2026 : posee au ras du sol, elle passait sous la terre des champs ;
       elle monte de 10 cm, au-dessus des sillons, et va jusqu'au bord du cercle de lumiere, 1,4 fois la portee ; en version dev d'abord) */
    const calme = MODE_TEST ? 0.25 : 1, lent = MODE_TEST ? 0.35 : 1; /* (la lumiere « vacille trop, faudrait que ca bouge moins », Mathieu, 11/11/2026 : quatre fois moins d'ecart, trois fois plus lent ; en version dev d'abord) */
    const f = 1 + calme * (0.07 * Math.sin(s * 7 * lent + A.ph) + 0.04 * Math.sin(s * 13.3 * lent + A.ph * 2)); A.halo.scale.setScalar(A.r * 1.9 * f); A.sol.material.opacity = (1 - 0.15 * calme + 0.15 * calme * Math.sin(s * 5 * lent + A.ph)) * A.a; });
}
/* LES PETITES CLOTURES (01/11/2026, « des petites clotures pour separer nos differents champs », Mathieu ; posees sur les bords des cases, juste decoratives) :
   un morceau par bord, S_.clotures[cle] ; 'x' + i + '_' + j : le bord entre la case (i, j) et sa voisine (i + 1, j) ; 'z' + i + '_' + j : entre (i, j) et
   (i, j + 1). Un poteau a chaque coin touche, un seul meme quand plusieurs morceaux s'y rejoignent. Elles ne bloquent personne et ne prennent aucune case :
   un champ borde de clotures reste un champ */
let cloturesMesh = [];
/* (01/11/2026, « peu importe ce que je fais, j'arrive pas a la retirer », Mathieu, avec une capture) : le bord se calculait depuis la case touchee en premier,
   souvent le champ voisin (ses epis arretent le rayon), et retoucher une cloture en posait une autre sur le bord du champ. Maintenant tout part du point
   touche, a la hauteur des lisses (pointClic) : la cloture posee la plus proche si on est dessus, sinon le bord le plus proche de ce point */
function bordDuPoint(x, z) { const i = Math.round(x / S + (COLS - 1) / 2), j = Math.round(z / S + (ROWS - 1) / 2), dx = x - cx(i), dz = z - cz(j); return Math.abs(dx) > Math.abs(dz) ? 'x' + (dx > 0 ? i : i - 1) + '_' + j : 'z' + i + '_' + (dz > 0 ? j : j - 1); }
function clotureProche(x, z, seuil) { let k0 = null, d0 = seuil; Object.keys(S_.clotures || {}).forEach((k) => { const b = bordPos(k), d = b.long === 'x' ? Math.hypot(Math.max(0, Math.abs(x - b.x) - S / 2), z - b.z) : Math.hypot(x - b.x, Math.max(0, Math.abs(z - b.z) - S / 2)); if (d < d0) { d0 = d; k0 = k; } }); return k0; }
function rangerCloture(cle) { delete S_.clotures[cle]; S_.decos = S_.decos || {}; S_.decos.cloture = nbDecos('cloture') + 1; son('planter'); construireClotures(); toast('Petite clôture rangée dans tes décorations.', 'or'); sauver(); }
function bordPos(cle) { const [i, j] = cle.slice(1).split('_').map(Number); return cle[0] === 'x' ? { x: cx(i) + S / 2, z: cz(j), long: 'z' } : { x: cx(i), z: cz(j) + S / 2, long: 'x' }; }
function construireClotures() {
  cloturesMesh.forEach((m) => scene.remove(m)); cloturesMesh = []; const ks = Object.keys(S_.clotures || {}); if (!ks.length) return;
  if (!MODELES.deco_cloture || !MODELES.deco_cloture_poteau) { assurerDecos(); return; }
  const coins = new Map(), pose = (M, x, z, ry) => { const m = M.clone(true); m.position.set(x, 0, z); m.rotation.y = ry; m.traverse((o) => { o.raycast = () => {}; }); scene.add(m); cloturesMesh.push(m); };
  ks.forEach((k) => { const b = bordPos(k), lx = b.long === 'x'; pose(MODELES.deco_cloture, b.x, b.z, lx ? 0 : Math.PI / 2);
    [-1, 1].forEach((s) => { const x = b.x + (lx ? s * S / 2 : 0), z = b.z + (lx ? 0 : s * S / 2); coins.set(Math.round(x * 10) + '_' + Math.round(z * 10), [x, z]); }); });
  coins.forEach(([x, z]) => pose(MODELES.deco_cloture_poteau, x, z, 0));
}
/* LA FONTAINE ANIMEE (01/11/2026, « elle est vilaine la fontaine mdr, pas d'animation, un bloc de pierre », Mathieu) : la pierre vient de deco.py ;
   l'eau est faite ici : la surface du bassin (translucide, on voit le fond et les poissons), les nappes qui coulent de la vasque du haut a celle du milieu
   puis au bassin, l'ecume a leur pied, le jet du sommet (des gouttes qui montent et retombent), les rides, les reflets, deux poissons qui tournent.
   FONTAINE : les hauteurs et les rayons de deco.py (y : la surface du bassin, V : la vasque du milieu, H : celle du haut), a changer des deux cotes. */
const FONTAINE = { y: 0.2, r: 0.63, yV: 0.785, rV: 0.475, yH: 1.31, rH: 0.262, jet: 1.47 };
let fontainesAnim = [], texNappe = null;
function textureNappe() {
  if (texNappe) return texNappe; const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const x = cv.getContext('2d');
  for (let i = 0; i < 30; i++) { const px = Math.random() * 64, w = 1 + Math.random() * 3, y0 = Math.random() * 128, h = 30 + Math.random() * 90, a = 0.35 + Math.random() * 0.6;
    const g = x.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.3, 'rgba(235,248,255,' + a + ')'); g.addColorStop(1, 'rgba(200,236,255,0)');
    x.fillStyle = g; x.fillRect(px, y0, w, h); x.fillRect(px, y0 - 128, w, h); } /* (des filets d'eau etires sur un fond vide : la nappe se lit filet par filet, pas comme un tube) */
  texNappe = new T.CanvasTexture(cv); texNappe.wrapS = texNappe.wrapT = T.RepeatWrapping; texNappe.repeat.set(3, 1); return texNappe;
}
function eauFontaine(m) {
  const F = FONTAINE, g = new T.Group(), fx = (c, o) => new T.MeshBasicMaterial(Object.assign({ color: c, transparent: true, depthWrite: false }, o));
  const eau = new T.Mesh(new T.CircleGeometry(F.r, 36), fx('#56b8ea', { opacity: 0.6 })); eau.rotation.x = -Math.PI / 2; eau.position.y = F.y; eau.renderOrder = 2; g.add(eau);
  [[F.yV, F.rV - 0.04], [F.yH, F.rH - 0.035]].forEach(([y, r]) => { const v = new T.Mesh(new T.CircleGeometry(r, 28), fx('#4aa6e4', { opacity: 0.88 })); v.rotation.x = -Math.PI / 2; v.position.y = y + 0.003; v.renderOrder = 2; g.add(v); }); /* (l'eau des vasques, du meme bleu que le bassin) */
  const nappe = (r1, r2, y1, y2) => { const n = new T.Mesh(new T.CylinderGeometry(r1, r2, y1 - y2, 32, 1, true), fx('#d8f1ff', { map: textureNappe(), opacity: 0.9, side: T.DoubleSide }));
    n.position.y = (y1 + y2) / 2; n.renderOrder = 3; g.add(n); return n; };
  nappe(F.rH + 0.004, F.rH + 0.03, F.yH - 0.01, F.yV - 0.012); nappe(F.rV + 0.004, F.rV + 0.05, F.yV - 0.02, F.y + 0.004); /* (elle s'evase un peu en tombant) */
  const ecume = (r1, r2, y, ph) => { const e = new T.Mesh(new T.RingGeometry(r1, r2, 40), fx('#f2fbff', { opacity: 0.6 })); e.rotation.x = -Math.PI / 2; e.position.y = y + 0.006; e.renderOrder = 4; g.add(e); return { m: e, ph }; };
  const ecumes = [ecume(F.rV - 0.01, F.rV + 0.11, F.y, 0), ecume(F.rH - 0.01, F.rH + 0.07, F.yV - 0.012, 1.7)];
  const ride = (y, a, b, ph) => { const r = new T.Mesh(new T.RingGeometry(0.965, 1, 48), fx('#ffffff', { opacity: 0 })); r.rotation.x = -Math.PI / 2; r.position.y = y + 0.008; r.renderOrder = 4; g.add(r); return { m: r, a, b, ph }; };
  const rides = [0, 0.33, 0.66].map((ph) => ride(F.y, F.rV + 0.1, F.r - 0.02, ph)).concat([0.15, 0.65].map((ph) => ride(F.yV, F.rH + 0.06, F.rV - 0.04, ph))); /* (dans le bassin et dans la vasque du milieu) */
  const jet = new T.Mesh(new T.CylinderGeometry(0.012, 0.03, 0.32, 8, 1, true), fx('#e6f6ff', { opacity: 0.85 })); jet.position.y = F.jet + 0.14; g.add(jet);
  const nenuphars = [[0.42, 0.2, true], [0.55, 2.3, false], [0.33, 4.1, false]].map(([r, a, fleur], k) => { /* (des nenuphars qui derivent lentement autour de la fontaine, l'un fleuri) */
    const n = new T.Group(), f = new T.Mesh(new T.CircleGeometry(0.075 + 0.015 * k, 14, 0.4, Math.PI * 2 - 0.5), mat(k % 2 ? '#5fae55' : '#4f9a4a')); f.rotation.x = -Math.PI / 2; n.add(f);
    if (fleur) for (let i = 0; i < 5; i++) { const p = new T.Mesh(new T.ConeGeometry(0.022, 0.06, 4), mat(i % 2 ? '#f7c6d6' : '#fbe3ec')); const b = i / 5 * Math.PI * 2; p.position.set(Math.cos(b) * 0.02, 0.03, Math.sin(b) * 0.02); p.rotation.set(Math.sin(b) * 0.5, 0, -Math.cos(b) * 0.5); n.add(p); }
    n.position.y = F.y + 0.006; g.add(n); return { n, r, a, v: 0.06 + 0.02 * k }; });
  const poissons = [['#f08a2c', '#fff4e6', 0.47, 0.5, 0], ['#fff4e6', '#f08a2c', 0.36, -0.38, 2.6]].map(([c, c2, r, v, ph]) => { /* (deux kois, l'un orange tache de blanc, l'autre l'inverse, qui tournent en sens contraire) */
    const p = new T.Group(), corps = new T.Mesh(new T.SphereGeometry(0.05, 12, 8), mat(c)); corps.scale.set(0.7, 0.55, 1.7); p.add(corps); p.scale.setScalar(1.3);
    const tache = new T.Mesh(new T.SphereGeometry(0.03, 8, 6), mat(c2)); tache.position.set(0, 0.02, 0.015); tache.scale.set(1, 0.5, 1.5); p.add(tache);
    const piv = new T.Group(); piv.position.z = -0.07; p.add(piv); const q = new T.Mesh(new T.ConeGeometry(0.045, 0.08, 4), mat(c)); q.rotation.x = Math.PI / 2; q.position.z = -0.035; q.scale.set(0.25, 1, 1); piv.add(q);
    p.position.y = F.y - 0.03; g.add(p); return { p, piv, r, v, ph }; });
  g.position.y = -(m.userData.solY || 0); /* (le modele est pose par le bas de ce qu'il a de plus bas, les racines des touffes : on suit le meme decalage) */
  m.add(g); return { m, g, eau, ecumes, rides, jet, poissons, nenuphars, tJet: 0, tPlouf: 0, tReflet: 0 };
}
function animerFontaines(dt, s) {
  if (!fontainesAnim.length || lieu === 'arene' || lieu === 'ile') return;
  if (texNappe) texNappe.offset.y = (texNappe.offset.y + dt * 1.4) % 1; /* (l'eau coule) */
  const F = FONTAINE, w = new T.Vector3();
  fontainesAnim.forEach((A) => { if (!A.m.parent) return; A.g.getWorldPosition(w);
    A.eau.material.opacity = 0.7 + 0.05 * Math.sin(s * 1.3);
    A.ecumes.forEach((e) => { const k = 1 + 0.035 * Math.sin(s * 6 + e.ph); e.m.scale.set(k, k, 1); e.m.material.opacity = 0.5 + 0.15 * Math.sin(s * 4.3 + e.ph); });
    A.rides.forEach((o) => { const k = (s * 0.5 + o.ph) % 1; o.m.scale.setScalar(o.a + k * (o.b - o.a)); o.m.material.opacity = 0.4 * (1 - k); }); /* (des rides partent du pied de la nappe vers le bord) */
    const j = 0.85 + 0.2 * Math.sin(s * 9); A.jet.scale.y = j; A.jet.position.y = F.jet + 0.16 * j;
    A.nenuphars.forEach((o) => { const a = o.a + s * o.v; o.n.position.x = Math.cos(a) * o.r; o.n.position.z = Math.sin(a) * o.r; o.n.rotation.y = -a * 0.6; o.n.position.y = F.y + 0.006 + 0.004 * Math.sin(s * 2 + o.a); });
    A.poissons.forEach((o) => { const a = o.ph + s * o.v, rr = o.r + 0.04 * Math.sin(s * 0.7 + o.ph); o.p.position.x = Math.cos(a) * rr; o.p.position.z = Math.sin(a) * rr;
      o.p.rotation.y = Math.atan2(-Math.sin(a) * o.v, Math.cos(a) * o.v); o.piv.rotation.y = Math.sin(s * 11 + o.ph) * 0.5; }); /* (il nage droit devant lui, la queue bat) */
    if ((A.tJet += dt) > 0.05) { A.tJet = 0; emettre(FX_VIF, 1, { x: w.x, y: w.y + F.jet + 0.22, z: w.z, r: 0.02, v: [0, 0.9, 0], dv: 0.5, vie: [0.4, 0.55], taille: [0.05, 0.02], c: ['#ffffff', '#bfe6ff'], grav: 5 }); } /* (le jet : des gouttes qui montent et retombent dans la vasque du haut) */
    if ((A.tPlouf += dt) > 0.07) { A.tPlouf = 0; const a = Math.random() * Math.PI * 2, haut = Math.random() < 0.35, r = (haut ? F.rH : F.rV) + 0.04, y = haut ? F.yV : F.y;
      emettre(FX_VIF, 1, { x: w.x + Math.cos(a) * r, y: w.y + y + 0.02, z: w.z + Math.sin(a) * r, r: 0.02, v: [Math.cos(a) * 0.25, 0.7, Math.sin(a) * 0.25], dv: 0.25, vie: [0.25, 0.35], taille: [0.04, 0.015], c: ['#ffffff', '#cfeeff'], grav: 6 }); } /* (ca eclabousse au pied des nappes) */
    if ((A.tReflet += dt) > 0.35) { A.tReflet = 0; const a = Math.random() * Math.PI * 2, r = 0.25 + Math.random() * 0.33;
      emettre(FX_LUM, 1, { x: w.x + Math.cos(a) * r, y: w.y + F.y + 0.03, z: w.z + Math.sin(a) * r, vie: [0.3, 0.5], taille: [0.1, 0.02], c: ['#ffffff', '#bfe6ff'], a: 0.8 }); } /* (un reflet qui scintille) */
  });
}
/* « Mes décorations » : ce qui est range ou achete, a poser */
function ouvrirDecos() {
  const L = Object.keys(DECOS).filter((k) => nbDecos(k) > 0 || (DECOS[k].bord && Object.keys(S_.clotures || {}).length) || (DECOS[k].sol && S_.cases.some((c) => c.pave === k))); /* (des clotures ou des paves poses : on peut revenir les ranger) */
  ouvrirModale('decos', entete('Mes décorations') + '<p class="hdv-aide">Ce que tu as rangé ou acheté : pose-les où tu veux sur ta ferme. Pour ranger une décoration ou un arbre, passe par Aménager et touche-le.</p>' +
    (L.length ? '<div class="deco-grille">' + L.map((k) => '<div class="deco-carte"><img src="assets/icones/deco-' + k + '.png?v=' + VERSION_MODELES + '" alt=""><b>' + DECOS[k].nom + '</b><span class="n">×' + nbDecos(k) + '</span><button class="btn kamas" data-poser-deco="' + k + '">Poser</button></div>').join('') + '</div>'
      : '<p class="deco-vide">Rien de rangé pour l\'instant. Achète des décorations à l\'HDV, ou range celles de ta ferme avec Aménager.</p>') +
    '<div class="deco-pied"><button class="btn discret" data-hdv-cat="deco">Acheter des décorations à l\'HDV</button></div>');
}
/* la categorie Deco de l'HDV : ce qui s'achete a ton niveau, puis ce qui se debloque */
function corpsDecoHdv() {
  const nv = niveau(S_.xp), ks = Object.keys(DECOS).filter((k) => !(DECOS[k].uv && !nuitDebloquee())) /* (la lanterne UV ne se montre pas avant le jour et la nuit du palier 10 : en version dev pour l'instant) */, stock = ks.reduce((t, k) => t + nbDecos(k), 0), posees = (k) => (DECOS[k].bord ? Object.keys(S_.clotures || {}).length : DECOS[k].sol ? S_.cases.filter((c) => c.pave === k).length : S_.cases.filter((c) => c.type === 'deco' && c.deco === k).length);
  return '<p class="hdv-aide">Des décorations pour ta ferme, juste pour le plaisir des yeux : une case chacune. Elles vont dans tes décorations, tu les poses où tu veux. La route pavée est un sol, comme l\'herbe : on pose ce qu\'on veut dessus ; la petite clôture se pose sur le bord d\'une case, pour séparer tes champs.</p>' +
    '<div class="deco-pied deco-tete"><button class="btn discret" data-mes-decos>Mes décorations' + (stock ? ' (' + stock + ')' : '') + '</button></div>' +
    ks.filter((k) => nv >= DECOS[k].niv).map((k) => { const D = DECOS[k], n = nbDecos(k), po = posees(k);
      return '<div class="art">' + ico('deco-' + k) + '<div><b>' + D.nom + '</b><div class="puces">' + (n ? '<span class="puce bonne">' + n + ' en réserve</span>' : '') + (po ? '<span class="puce">' + po + ' sur ta ferme</span>' : '') + (D.uv ? '<span class="puce or">La nuit, les champs des 12 cases autour poussent à plein</span>' : '') + (D.lumiere ? '<span class="puce">La nuit, éclaire ' + String(Math.round(D.lumiere.portee / S * 10) / 10).replace('.', ',') + ' case' + (D.lumiere.portee / S >= 2 ? 's' : '') + ' autour</span>' : '') + '</div></div>' +
        (D.atelier ? '<div class="act"><small>se fabrique</small>' + (niv('atelier') && !amelioCachee('atelier') ? '<button class="btn kamas" data-ouvrir-atelier>À l\'atelier</button>' : '<span class="cadenas">' + picto('cadenas', '#a3957a') + (amelioCachee('atelier') ? 'Bientôt' : 'L\'atelier') + '</span>') + (n ? '<button class="btn discret mini" data-poser-deco="' + k + '">Poser</button>' : '') + '</div></div>' :
        '<div class="act"><small>à l\'unité</small><button class="btn kamas" data-deco-achat="' + k + '"' + (S_.kamas >= D.prix ? '' : ' disabled') + '>Acheter ' + fmt(D.prix) + ' ' + KAMA + '</button>' + manque(D.prix) + (D.sol || D.bord ? '<button class="btn kamas mini" data-deco-achat="' + k + '" data-n="10"' + (S_.kamas >= D.prix * 10 ? '' : ' disabled') + '>×10 : ' + fmt(D.prix * 10) + ' ' + KAMA + '</button>' : '') + /* (la route et la cloture vont par dizaines) */ (n || ((D.sol || D.bord) && po) ? '<button class="btn discret mini" data-poser-deco="' + k + '">' + (n ? 'Poser' : 'Ranger') + '</button>' : '') + '</div></div>'); }).join('') +
    (ks.some((k) => nv < DECOS[k].niv) ? '<div class="hdv-section">À débloquer en montant de niveau</div>' + ks.filter((k) => nv < DECOS[k].niv).map((k) => '<div class="art verrou">' + ico('deco-' + k) + '<div><b>' + DECOS[k].nom + '</b></div><div class="act"><span class="cadenas">' + picto('cadenas', '#a3957a') + 'Niveau ' + DECOS[k].niv + '</span></div></div>').join('') : '');
}
/* LE CHATEAU-GRANGE (02/11/2026, « une version niveau 6 de la grange qu'on peut fusionner avec les quatre tours, et ca devient un grand batiment qui fait
   4 sur 4 ; un chateau avec des tours dans chaque coin », puis le fort de Redemption de la planche, « ca j'aime bien », Mathieu ; modele : blender/chateau-grange.py
   --jeu). Ses conditions : perso niveau 80, grange niveau 5, 4 tours niveau 5, 500 000 kamas ; on choisit ou le batir (4 x 4 cases d'herbe, la grange et les
   tours comptent comme libres). La grange devient 16 cases 'grange', les tours disparaissent : ses 4 tours d'angle tirent comme des tours niveau 6 (construireTours),
   la baliste de la grange passe sur la terrasse du donjon (construireArbalete) ; 12 000 PV a lui seul. */
const Y_DONJON = 4.15, COIN_CHATEAU = 3.157, Y_TOURS_CHATEAU = 3.45; /* (la terrasse du donjon, le centre des balistes d'angle et leur estrade, en unites du jeu, pour le modele a sa taille d'origine : 4 x 4 cases ; a multiplier par echChateau()) */
/* LE CHATEAU PASSE A 5 x 5 (11/11/2026, « on devrait agrandir la taille du chateau : la il fait 4 sur 4, il faudrait qu'il fasse 5 sur 5 et que sa porte d'entree
   soit au milieu », Mathieu) : sur un nombre impair de cases, la porte (au milieu du rempart de devant) tombe en face d'une case, plus entre deux. Le modele est le
   meme, agrandi d'un quart (ECH_CHATEAU) : tours, remparts, donjon et porte grandissent ensemble ; les balistes et leurs hauteurs suivent (echChateau).
   Un chateau deja bati en 4 x 4 s'agrandit tout seul, une fois (agrandirChateau) : ce qui gene sur ses 9 cases de plus est deplace juste a cote ; si vraiment rien
   ne passe (plus de place libre, un acces coupe), il reste tel quel, a son ancienne taille, et passe a 5 x 5 quand on le deplace (Amenager : deplacerBatiment). */
const COTE_CHATEAU = 5, ECH_CHATEAU = COTE_CHATEAU / 4;
/* EN VERSION DEV SEULEMENT pour l'instant (« le chateau en 5 x 5 : avec la maj du palier 10 », puis « push, mais que en version dev, pas pour la version joueur »,
   Mathieu, 11/11/2026) : hors du mode test, un chateau se batit et se deplace en 4 x 4 comme avant, et aucun ne s'agrandit. Le jour de la sortie : coteChateau
   rend toujours COTE_CHATEAU, et agrandirChateau perd son MODE_TEST. */
const coteChateau = () => (MODE_TEST ? COTE_CHATEAU : 4);
const echChateau = () => { const o = aChateau() && blocBati('grange'); return o && o.w >= COTE_CHATEAU && o.h >= COTE_CHATEAU ? ECH_CHATEAU : 1; }; /* (1 : un ancien chateau de 4 x 4 pas encore agrandi) */
function agrandirChateau() {
  if (!MODE_TEST || !aChateau() || S_.chateau5) return; const o = blocBati('grange'); if (!o) return; S_.chateau5 = 1; /* (une seule tentative ; en mode test rien n'est enregistre : la vraie ferme ne bouge pas) */
  if (o.w !== 4 || o.h !== 4 || o.B.length !== 16) return;
  /* (« ceux qui ont des batiments ou des cultures autour, ca va se passer comment ? [...] faut bien qu'elle soit deplacee », Mathieu, 11/11/2026) : le chateau grandit
     dans tous les cas ; ce qui se trouve sur ses 9 cases de plus est deplace sur la place libre la plus proche : un champ garde sa culture et sa pousse, une
     decoration et un arbre changent de case, un batiment demenage en entier. On prend, des quatre carres de 5 x 5 qui contiennent le chateau, celui qui derange le
     moins (poidsCase). Tout se fait sur une photo de la ferme : si une chose ne trouve pas de place, ou si un acces se retrouve coupe, on remet la photo et on
     essaie le carre suivant. L'enclos, l'eau et un Tofu sauvage ne se deplacent pas. Si aucun carre ne passe, le chateau reste en 4 x 4 (echChateau). */
  const tofu = (c) => !!(S_.sauvage && S_.sauvage.id === c.id), CLES_CHAMP = ['c', 'pousse', 'arrose', 'pretDepuis', 'tofu', 'vole', 'tofuParti', 'picore', 'prixPaye'];
  const poidsCase = (c) => (tofu(c) ? 1000 : c.type === 'libre' ? (c.pave ? 0.1 : 0) : c.type === 'deco' || c.type === 'arbre' ? 1 : c.type === 'champ' ? 3 : BATIS[c.type] ? 8 : 1000);
  const dist = (a, b) => { const p = posCase(a), q = posCase(b); return Math.hypot(p.x - q.x, p.z - q.z); };
  const carres = [[0, 0], [-1, 0], [0, -1], [-1, -1]].map(([di, dj]) => { const plus = [];
    for (let x = 0; x < COTE_CHATEAU; x++) for (let y = 0; y < COTE_CHATEAU; y++) { const c = S_.cases.find((v) => v.terrain === o.c0.terrain && v.i === o.c0.i + di + x && v.j === o.c0.j + dj + y); if (!c || !memeNiveau(c, o.c0)) return null; if (c.type !== 'grange') plus.push(c); }
    return { plus, cout: plus.reduce((t, c) => t + poidsCase(c), 0) }; }).filter((x) => x && x.cout < 1000).sort((a, b) => a.cout - b.cout);
  for (const { plus } of carres) {
    const photo = JSON.stringify({ cases: S_.cases, arbres: S_.arbres || {} }), deja = inaccessibles(), pris = new Set(o.B.concat(plus)), bouges = { champ: 0, deco: 0, arbre: 0, bat: [] };
    const pres = (src) => S_.cases.filter((c) => c.type === 'libre' && !pris.has(c) && !tofu(c)).sort((a, b) => dist(a, src) - dist(b, src))[0]; /* la case d'herbe libre la plus proche, hors du chateau */
    let bon = true;
    for (const c of plus) {
      if (c.type === 'libre') continue;
      if (c.type === 'champ') { const d = pres(c); if (!d) { bon = false; break; } const champ = {}; CLES_CHAMP.forEach((k) => { if (c[k] !== undefined) champ[k] = c[k]; delete c[k]; }); c.type = 'libre'; Object.assign(d, { type: 'champ' }, champ); bouges.champ++; }
      else if (c.type === 'deco') { const d = pres(c); if (!d) { bon = false; break; } ['deco', 'rotD', 'ile'].forEach((k) => { if (c[k] !== undefined) d[k] = c[k]; delete c[k]; }); delete c.orig; c.type = 'libre'; d.type = 'deco'; bouges.deco++; }
      else if (c.type === 'arbre') { const d = pres(c); if (!d) { bon = false; break; } const nom = c.arbre; S_.arbres = S_.arbres || {}; const st = S_.arbres[nom] || (S_.arbres[nom] = {}); c.type = 'libre'; delete c.arbre; d.type = 'arbre'; d.arbre = nom; st.cell = d.id; delete st.orig; bouges.arbre++; }
      else if (BATIS[c.type]) { /* un batiment : il demenage en entier, au plus pres, sur des cases libres (ou les siennes) hors du chateau */
        const type = c.type, b = blocBati(type), ok = (v) => !!v && (v.type === 'libre' || v.type === type) && !pris.has(v) && !tofu(v); let cells = null;
        for (const d of S_.cases.filter((v) => v.terrain === b.c0.terrain && memeNiveau(v, b.c0)).sort((p, q) => dist(p, b.c0) - dist(q, b.c0))) { const L = []; let tient = true;
          for (let x = 0; x < b.w && tient; x++) for (let y = 0; y < b.h && tient; y++) { const v = S_.cases.find((u) => u.terrain === d.terrain && u.i === d.i + x && u.j === d.j + y); if (ok(v) && memeNiveau(v, d)) L.push(v); else tient = false; }
          if (tient && L.length === b.B.length) { cells = L; break; } }
        if (!cells) { bon = false; break; } b.B.forEach((v) => { v.type = 'libre'; }); cells.forEach((v) => { v.type = type; }); bouges.bat.push(BATIS[type]); }
      else { bon = false; break; }
    }
    if (bon) { plus.forEach((c) => { c.type = 'grange'; }); if (inaccessibles().some((x) => !deja.includes(x))) bon = false; }
    if (!bon) { const P = JSON.parse(photo); S_.cases.forEach((c, k) => { Object.keys(c).forEach((key) => { delete c[key]; }); Object.assign(c, P.cases[k]); }); S_.arbres = P.arbres; continue; } /* (on remet la photo : rien n'a bouge) */
    S_.cases.forEach((c) => rendreCase(c.id)); if (bouges.arbre) construireArbres(); if (bouges.deco) construireDecos(); if (bouges.bat.includes(BATIS.voliere) && typeof appliquerVoliere === 'function') appliquerVoliere();
    if (typeof paysanMesh !== 'undefined' && paysanMesh && paysanMesh.userData) { const u = paysanMesh.userData, ici = caseIci(paysanMesh.position.x, paysanMesh.position.z); if ((ici && !sansObstacle(ici)) || (u.cellule && !sansObstacle(u.cellule))) { const v = S_.cases.filter((x) => PASSABLE[x.type]).sort((p, q) => dist(p, ici || o.c0) - dist(q, ici || o.c0))[0]; if (v) { const q = posCase(v); paysanMesh.position.set(q.x, q.y, q.z); u.cellule = v; u.y = q.y; chemin = []; } } } /* il s'ecarte */
    const dits = [bouges.champ ? bouges.champ + ' champ' + (bouges.champ > 1 ? 's' : '') : '', bouges.deco ? bouges.deco + ' décoration' + (bouges.deco > 1 ? 's' : '') : '', bouges.arbre ? bouges.arbre + ' arbre' + (bouges.arbre > 1 ? 's' : '') : ''].concat(bouges.bat).filter(Boolean);
    setTimeout(() => { if (typeof toast === 'function') toast('Ton château s\'est agrandi : 5 cases sur 5, et sa porte tombe en face d\'une case.' + (dits.length ? ' Pour lui faire de la place, on a déplacé juste à côté : ' + dits.join(', ') + '.' : ''), 'or'); }, 6000); return;
  }
  setTimeout(() => { if (typeof toast === 'function') toast('Ton château peut s\'agrandir à 5 cases sur 5 : fais-lui de la place, puis déplace-le avec Aménager.', 'or'); }, 6000);
}
let chateauCharge = null, chateauVise = null, apercuChateau = null; const TUILE_CHATEAU = new T.PlaneGeometry(S - 0.1, S - 0.1); partager(TUILE_CHATEAU);
function assurerChateau() {
  if (MODELES.grange6) return Promise.resolve(); if (chateauCharge) return chateauCharge;
  chateauCharge = chargerGlb('assets/modeles/jeu/chateau.glb?v=' + VERSION_MODELES).then((G) => {
    versToon(G, { normales: 0.01, sansContour: SC_BATI }); MODELES.grange6 = gabaritEchelle(G, 'Grange6', 1, new T.Vector3(0, 0, 0));
    if (S_ && S_.perso) construireBatiments();
  }).catch((e) => { console.warn('Château', e); chateauCharge = null; });
  return chateauCharge;
}
const manqueChateau = () => { const L = S_.cases.filter((c) => c.type === 'tour'); return L.length < TOURS_MAX ? 'Construis d\'abord tes ' + TOURS_MAX + ' tours de défense' : L.some((c) => nivTour(c) < 4) ? 'Monte d\'abord tes ' + TOURS_MAX + ' tours au niveau 5' : ''; };
function essaiChateau(cible) { /* 5 x 5 cases autour de la case touchee (le carre centre sur elle d'abord) : herbe libre, ou la grange et les tours, au meme niveau */
  const ok = (c) => c && (c.type === 'libre' || c.type === 'grange' || c.type === 'tour') && !(S_.sauvage && S_.sauvage.id === c.id) && memeNiveau(c, cible);
  const N = coteChateau(), m = (N - 1) / 2; let decal = []; for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) decal.push([a, b]); decal.sort((p, q) => Math.hypot(p[0] - m, p[1] - m) - Math.hypot(q[0] - m, q[1] - m));
  if (N === 4) decal = [[1, 1], [2, 1], [1, 2], [2, 2], [0, 1], [1, 0], [3, 1], [1, 3], [0, 2], [2, 0], [3, 2], [2, 3], [0, 0], [3, 0], [0, 3], [3, 3]]; /* (le 4 x 4 des joueurs : l'ordre d'origine, rien ne change pour eux) */
  for (const [di, dj] of decal) {
    const cells = []; let bon = true;
    for (let x = 0; x < N && bon; x++) for (let y = 0; y < N && bon; y++) { const c = S_.cases.find((v) => v.terrain === cible.terrain && v.i === cible.i - di + x && v.j === cible.j - dj + y); if (ok(c)) cells.push(c); else bon = false; }
    if (bon) return cells;
  }
  return null;
}
function majApercuChateau(cells) {
  if (apercuChateau) { scene.remove(apercuChateau); apercuChateau = null; } if (!cells) return;
  const g = new T.Group(); cells.forEach((c) => { const q = posCase(c), m = new T.Mesh(TUILE_CHATEAU, MARQUE_OK); m.rotation.x = -Math.PI / 2; m.position.set(q.x, q.y + 0.09, q.z); m.renderOrder = 3; m.raycast = () => {}; g.add(m); });
  scene.add(g); apercuChateau = g;
}
let batisMesh = [];
const rotDe = (type) => ((S_.rot && S_.rot[type]) || 0) * Math.PI / 2;
const tourne = (dx, dz, a) => [dx * Math.cos(a) + dz * Math.sin(a), -dx * Math.sin(a) + dz * Math.cos(a)]; /* un decalage, tourne avec le batiment */
function construireBatiments() {
  batisMesh.forEach((m) => scene.remove(m)); batisMesh = []; fumeesCheminee = [];
  const pose = (...a) => { const m = batiment(...a); m.userData.modele = a[0]; /* (son modele : les foyers de la forgemagie et de l'atelier, 14i-nuit.js) */ batisMesh.push(m); return m; };
  if (montgolfiereMesh) poserMontgolfiere(); /* (deplacee ou tournee dans Amenager, ou une autre partie) */
  if (!S_.foinDeco && !S_.cases.some((c) => c.type === 'foin')) { const c = S_.cases.find((x) => x.id === 'm7_4'); if (c && c.type === 'enclos') c.type = 'foin'; } /* (anciennes sauvegardes : le foin etait passe dans l'enclos) */
  if (!S_.foinDeco) { S_.foinDeco = true; S_.cases.filter((c) => c.type === 'foin').forEach((c) => { c.type = 'deco'; c.deco = 'foin'; c.rotD = (S_.rot && S_.rot.foin) || 0; rendreCase(c.id); }); construireDecos(); } /* (05/11/2026 : le foin devient une decoration, une fois) */
  agrandirChateau(); /* (un chateau de 4 x 4 passe a 5 x 5, une fois, s'il en a la place) */
  let o = blocBati('grange'); if (o) { const a = rotDe('grange'), [gx, gz] = tourne(0, -0.1, a); const ng = nivBat('qg');
    if (ng >= 6) { const k = echChateau(); if (MODELES.grange6) pose('grange6', o.x, o.y, o.z, o.c0.id, a).scale.setScalar(k); else assurerChateau(); ancres.grange = new T.Vector3(o.x, o.y + Y_DONJON * k + 0.4, o.z); } /* (le chateau-grange : sa baliste sur la terrasse du donjon) */
    else { fumerCheminee(pose('grange' + ng, o.x + gx, o.y, o.z + gz, o.c0.id, a), ng); ancres.grange = new T.Vector3(o.x, o.y + MODELES.toitGrange + (ng >= 3 ? MODELES.leveGrange : 0) + 0.3, o.z); } } /* au faitage, pas en haut de la tourelle */
  o = blocBati('hdv'); if (o) {
    const a = rotDe('hdv'), [hx, hz] = tourne(0, -0.15, a), [mx, mz] = tourne(1.75, 0.45, a); const h = pose('hdv' + nivBat('nivEtal'), o.x + hx, o.y, o.z + hz, o.c0.id, a); ancres.hdv = new T.Vector3(o.x, o.y + h.userData.hauteur + 0.3, o.z);
    if (MODELES.marchand && !MODELES.marchand.userData.ombre) { ombrePieds(MODELES.marchand, 1.4); MODELES.marchand.userData.ombre = true; }
    if (MODELES.marchand) { marchandMesh = pose('marchand', o.x + mx, o.y, o.z + mz, o.c0.id, -0.5 + a); marchandMesh.userData.y0 = o.y; marchandMesh.userData.ry0 = -0.5 + a; } /* le marchand a cote de son etal */
  }
  o = blocBati('forge'); if (o && MODELES.forge) { pose('forge', o.x, o.y, o.z, o.c0.id, rotDe('forge')); ancres.forge = new T.Vector3(o.x, o.y + 3.2, o.z); } else delete ancres.forge;
  o = blocBati('atelier'); if (o && MODELES.atelier) { pose('atelier', o.x, o.y, o.z, o.c0.id, rotDe('atelier')); ancres.atelier = new T.Vector3(o.x, o.y + 3.0, o.z); } else delete ancres.atelier; /* (l'atelier, 09/11/2026) */
  poserCabane(pose); /* (la cabane du pecheur, a sa place fixe : 14g-cabane.js) */
  o = blocBati('niche'); if (o && MODELES.maisonGardien) { pose('maisonGardien', o.x, o.y, o.z, o.c0.id, rotDe('niche')); ancres.niche = new T.Vector3(o.x, o.y + 2.3, o.z); } else delete ancres.niche; /* la maison du gardien (14c-gardien.js) */
  o = blocBati('puits'); if (o) pose('puits' + nivBat('nivPuits'), o.x, o.y, o.z, o.c0.id, -0.3 + rotDe('puits'));
  o = blocBati('epouvantail'); if (o) pose('epouvantail', o.x, o.y, o.z, o.c0.id, 0.4 + rotDe('epouvantail'));
  o = blocBati('geliere'); if (o && niv('geliere')) { if (MODELES.geliere1) { pose('geliere' + Math.min(4, niv('geliere')), o.x, o.y, o.z, o.c0.id, rotDe('geliere')); ancres.geliere = new T.Vector3(o.x, o.y + 2.2, o.z); } else assurerGeliere(); } /* (la Geliere : son modele arrive au premier besoin) */
  rendreGelees();
  if (arbalete) { scene.remove(arbalete); arbalete = null; } construireArbalete(); construireTours();
  majFeux(true); equiperEpouvantail(); majLeurre();
}
/* poser un batiment de w x h cases de facon que la case touchee soit dessous : cases d'herbe libres (ou les siennes), au meme niveau */
function essaiPose(type, cible, W, H) {
  const o = blocBati(type); if (!o) return null; const w = W || o.w, h = H || o.h;
  for (let di = 0; di < w; di++) for (let dj = 0; dj < h; dj++) {
    const cells = []; let ok = true;
    for (let a = 0; a < w && ok; a++) for (let b = 0; b < h && ok; b++) {
      const c = S_.cases.find((x) => x.terrain === cible.terrain && x.i === cible.i - di + a && x.j === cible.j - dj + b);
      if (!c || !(c.type === 'libre' || c.type === type) || (S_.sauvage && S_.sauvage.id === c.id) || !memeNiveau(c, cible)) ok = false; else cells.push(c);
    }
    if (ok && (W || o.B.every((c) => o.B.length === cells.length))) return cells; /* (W donne : la taille est voulue, le chateau qui passe de 4 x 4 a 5 x 5) */
  }
  return null;
}
/* rien ne doit devenir inaccessible a pied : chaque batiment, l'enclos et chaque parcelle */
/* (retour de Mathieu : on pose ou l'on veut) un placement qui coupe un acces n'est plus refuse, on previent seulement */
/* « tu peux te bloquer l'acces a l'enclos avec tes batiments » (testeurs, 12/10/2026) : avant, un simple avertissement, et le perso traversait les
   murs ; maintenant le placement est refuse et les cases reprennent leur etat */
const avantCases = (L) => L.filter(Boolean).map((c) => [c, c.type, c.arbre]);
function refuserSiBloque(deja, avant) {
  const n = inaccessibles().filter((x) => !deja.includes(x)); if (!n.length) return false;
  avant.forEach(([c, t, a]) => { c.type = t; if (a === undefined) delete c.arbre; else c.arbre = a; });
  toast('Pas là : ' + n[0] + ' ne serait plus accessible. Laisse un passage d\'herbe.', 'alerte'); return true;
}
function avertirAcces(deja) { const n = inaccessibles().filter((x) => !deja.includes(x)); if (n.length) toast('Attention : ton perso devra couper à travers pour aller jusqu\'à ' + n[0] + '.'); }
function inaccessibles() {
  const ici = paysanMesh && caseIci(paysanMesh.position.x, paysanMesh.position.z), dep = ici && sansObstacle(ici) ? ici : S_.cases.find((c) => c.id === 'm3_2' && PASSABLE[c.type]) || S_.cases.find((c) => PASSABLE[c.type]); /* (les decos se traversent, 08/11/2026) */
  const vu = new Set([dep]), file = [dep];
  while (file.length) { const c = file.shift(); voisins(c).forEach((v) => { if (sansObstacle(v) && !vu.has(v)) { vu.add(v); file.push(v); } }); }
  const manque = [];
  Object.keys(BATIS).filter((t) => t !== 'foin').concat(['enclos']).forEach((t) => { /* le foin n'est qu'un decor */ const B = S_.cases.filter((c) => c.type === t); if (B.length && !B.some((c) => voisins(c).some((v) => vu.has(v)))) manque.push(BATIS[t] || 'l\'enclos'); });
  if (S_.cases.some((c) => c.type === 'champ' && !vu.has(c))) manque.push('une de tes parcelles');
  return manque;
}
