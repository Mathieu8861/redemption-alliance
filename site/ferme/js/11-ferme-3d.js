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
    const v = batiment('voliere' + nv, mx, P[0].y, mz, B[0].id, ry); v.userData.sol = [0.27, 0.27, 0.36, 0.38, 0.42][nv - 1]; v.userData.etendue = [1, 1.35, 1.6, 1.9, 2.3][nv - 1]; volieresMesh.push(v);
  }
  if (B.length) { const P = B.map(posCase); ancres.voliere = new T.Vector3(P.reduce((t, q) => t + q.x, 0) / P.length, P[0].y + (volieresMesh[0].userData.hauteur || 1.8) * k + 0.25, P.reduce((t, q) => t + q.z, 0) / P.length); }
  rendreTofusVoliere(); if (S_.bats) majFeu('voliere', true);
}
/* les Tofus captures sautillent dans la cage (sur son plancher surelevee, bien a l'interieur) : on voit tout de suite si elle est pleine */
const PLACES_CAGE = [[-0.3, -0.28], [0.3, -0.28], [0, -0.05], [-0.3, 0.12], [0.3, 0.12]];
function rendreTofusVoliere() {
  tofusVoliere.forEach((m) => scene.remove(m)); tofusVoliere = [];
  if (!MODELES.tofu || !volieresMesh.length) return;
  for (let k = 0; k < S_.tofus; k++) {
    const v = volieresMesh[k % volieresMesh.length], [px, pz] = PLACES_CAGE[Math.floor(k / volieresMesh.length) % PLACES_CAGE.length], e = v.scale.x;
    const t = marquer(cloner('tofu'), v.userData.cellule || 'm2_0'); t.scale.setScalar(0.38);
    const et = e * (v.userData.etendue || 1), [ox, oz] = tourne(px * et, pz * et, v.rotation.y); t.userData.base = { x: v.position.x + ox, y: v.position.y + (v.userData.sol || 0.27) * e + 0.02, z: v.position.z + oz };
    poser(t, t.userData.base.x, t.userData.base.y, t.userData.base.z, 0.6 + k * 1.3); tofusVoliere.push(t);
  }
}

/* ---------- les batiments sont poses d'apres leurs cases : on les deplace avec Amenager ---------- */
const BATIS = { forge: 'l\'atelier de forgemagie', grange: 'la grange', hdv: 'l\'HDV', voliere: 'la volière', geliere: 'la Gelière', puits: 'le puits', epouvantail: 'l\'épouvantail', leurre: 'le leurre à Wabbits', niche: 'la maison de ton gardien', foin: 'le foin', montgolfiere: 'la montgolfière' }; /* (la montgolfiere depuis le 14/10/2026 : elle se deplace comme le reste) */
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
  champignons: { nom: 'Champignons', prix: 1200, niv: 1, pr: 'les' }, fleurs: { nom: 'Massif de fleurs', prix: 1500, niv: 1, pr: 'le' },
  lanterne: { nom: 'Lanterne de pierre', prix: 2500, niv: 10, pr: 'la' }, banc: { nom: 'Banc de bois', prix: 2000, niv: 10, pr: 'le' },
  arbre_rond: { nom: 'Arbre rond', prix: 2000, niv: 15, pr: 'le' }, sapin: { nom: 'Sapin', prix: 2500, niv: 15, pr: 'le' },
  pommier: { nom: 'Pommier', prix: 3000, niv: 20, pr: 'le' }, statue_gelee: { nom: 'Statue de Gelée', prix: 8000, niv: 25, pr: 'la' },
  fontaine: { nom: 'Fontaine', prix: 12000, niv: 30, pr: 'la' }, banniere: { nom: 'Bannière de Redemption', prix: 20000, niv: 40, pr: 'la' },
};
const nbDecos = (k) => (S_ && S_.decos && S_.decos[k]) || 0;
const accordDeco = (k, mot) => mot + ({ la: 'e', les: 's' }[DECOS[k].pr] || '');
const texteDeco = (k) => { const D = DECOS[k] || { nom: 'Décoration', pr: 'la' }; return D.nom + ' : touche une case d\'herbe libre pour ' + D.pr + ' déplacer, Tourner pour ' + D.pr + ' pivoter, Ranger pour ' + D.pr + ' mettre dans tes décorations.'; };
let decosMesh = [], decosCharge = null;
function assurerDecos() {
  if (MODELES.deco_rocher) return Promise.resolve(); if (decosCharge) return decosCharge;
  decosCharge = chargerGlb('assets/modeles/jeu/deco.glb?v=' + VERSION_MODELES).then((G) => {
    versToon(G, { echelle: 0.012, souple: SOUPLE_ILE, sansContour: SC_ILE, douce: true }); /* (au style de l'ile, faites avec les memes outils) */
    Object.keys(DECOS).forEach((k) => { MODELES['deco_' + k] = gabaritEchelle(G, 'Deco_' + k, 1); });
    if (S_ && S_.perso) construireDecos();
  }).catch((e) => { console.warn('Décorations', e); decosCharge = null; });
  return decosCharge;
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
  decosMesh.forEach((m) => scene.remove(m)); decosMesh = []; let manque = false;
  S_.cases.forEach((c) => {
    if (c.type !== 'deco') return;
    const R = c.ile != null && MODELES.piecesIle && MODELES.piecesIle[c.ile], M = R ? R.g : MODELES['deco_' + c.deco]; if (!M) { manque = true; return; }
    const m = marquer(M.clone(true), c.id), q = posCase(c);
    if (R && c.orig) m.position.copy(R.base); else m.position.set(q.x, q.y, q.z); /* (un rocher de l'ile garde sa place exacte tant qu'il n'a pas bouge) */
    m.rotation.y = (c.rotD || 0) * Math.PI / 2; scene.add(m); decosMesh.push(m);
  });
  Object.keys(S_.ileLibre || {}).forEach((k) => { const R = MODELES.piecesIle && MODELES.piecesIle[k]; if (!R || !S_.ileLibre[k]) return;
    const m = R.g.clone(true); m.position.copy(R.base); m.traverse((o) => { o.userData.piece = +k; }); scene.add(m); decosMesh.push(m); });
  if (manque) assurerDecos();
}
/* « Mes décorations » : ce qui est range ou achete, a poser */
function ouvrirDecos() {
  const L = Object.keys(DECOS).filter((k) => nbDecos(k) > 0);
  ouvrirModale('decos', entete('Mes décorations') + '<p class="hdv-aide">Ce que tu as rangé ou acheté : pose-les où tu veux sur ta ferme. Pour ranger une décoration ou un arbre, passe par Aménager et touche-le.</p>' +
    (L.length ? '<div class="deco-grille">' + L.map((k) => '<div class="deco-carte"><img src="assets/icones/deco-' + k + '.png?v=' + VERSION_MODELES + '" alt=""><b>' + DECOS[k].nom + '</b><span class="n">×' + nbDecos(k) + '</span><button class="btn kamas" data-poser-deco="' + k + '">Poser</button></div>').join('') + '</div>'
      : '<p class="deco-vide">Rien de rangé pour l\'instant. Achète des décorations à l\'HDV, ou range celles de ta ferme avec Aménager.</p>') +
    '<div class="deco-pied"><button class="btn discret" data-hdv-cat="deco">Acheter des décorations à l\'HDV</button></div>');
}
/* la categorie Deco de l'HDV : ce qui s'achete a ton niveau, puis ce qui se debloque */
function corpsDecoHdv() {
  const nv = niveau(S_.xp), ks = Object.keys(DECOS), stock = ks.reduce((t, k) => t + nbDecos(k), 0), posees = (k) => S_.cases.filter((c) => c.type === 'deco' && c.deco === k).length;
  return '<p class="hdv-aide">Des décorations pour ta ferme, juste pour le plaisir des yeux : une case chacune. Elles vont dans tes décorations, tu les poses où tu veux.</p>' +
    '<div class="deco-pied deco-tete"><button class="btn discret" data-mes-decos>Mes décorations' + (stock ? ' (' + stock + ')' : '') + '</button></div>' +
    ks.filter((k) => nv >= DECOS[k].niv).map((k) => { const D = DECOS[k], n = nbDecos(k), po = posees(k);
      return '<div class="art">' + ico('deco-' + k) + '<div><b>' + D.nom + '</b><div class="puces">' + (n ? '<span class="puce bonne">' + n + ' en réserve</span>' : '') + (po ? '<span class="puce">' + po + ' sur ta ferme</span>' : '') + '</div></div>' +
        '<div class="act"><small>à l\'unité</small><button class="btn kamas" data-deco-achat="' + k + '"' + (S_.kamas >= D.prix ? '' : ' disabled') + '>Acheter ' + fmt(D.prix) + ' ' + KAMA + '</button>' + manque(D.prix) + (n ? '<button class="btn discret mini" data-poser-deco="' + k + '">Poser</button>' : '') + '</div></div>'; }).join('') +
    (ks.some((k) => nv < DECOS[k].niv) ? '<div class="hdv-section">À débloquer en montant de niveau</div>' + ks.filter((k) => nv < DECOS[k].niv).map((k) => '<div class="art verrou">' + ico('deco-' + k) + '<div><b>' + DECOS[k].nom + '</b></div><div class="act"><span class="cadenas">' + picto('cadenas', '#a3957a') + 'Niveau ' + DECOS[k].niv + '</span></div></div>').join('') : '');
}
let batisMesh = [];
const rotDe = (type) => ((S_.rot && S_.rot[type]) || 0) * Math.PI / 2;
const tourne = (dx, dz, a) => [dx * Math.cos(a) + dz * Math.sin(a), -dx * Math.sin(a) + dz * Math.cos(a)]; /* un decalage, tourne avec le batiment */
function construireBatiments() {
  batisMesh.forEach((m) => scene.remove(m)); batisMesh = []; fumeesCheminee = [];
  const pose = (...a) => { const m = batiment(...a); batisMesh.push(m); return m; };
  if (montgolfiereMesh) poserMontgolfiere(); /* (deplacee ou tournee dans Amenager, ou une autre partie) */
  if (!S_.cases.some((c) => c.type === 'foin')) { const c = S_.cases.find((x) => x.id === 'm7_4'); if (c && c.type === 'enclos') c.type = 'foin'; } /* (anciennes sauvegardes : le foin etait passe dans l'enclos) */
  let o = blocBati('grange'); if (o) { const a = rotDe('grange'), [gx, gz] = tourne(0, -0.1, a); const ng = nivBat('qg'); fumerCheminee(pose('grange' + ng, o.x + gx, o.y, o.z + gz, o.c0.id, a), ng); ancres.grange = new T.Vector3(o.x, o.y + MODELES.toitGrange + (ng >= 3 ? MODELES.leveGrange : 0) + 0.3, o.z); /* au faitage, pas en haut de la tourelle */ }
  o = blocBati('hdv'); if (o) {
    const a = rotDe('hdv'), [hx, hz] = tourne(0, -0.15, a), [mx, mz] = tourne(1.75, 0.45, a); const h = pose('hdv' + nivBat('nivEtal'), o.x + hx, o.y, o.z + hz, o.c0.id, a); ancres.hdv = new T.Vector3(o.x, o.y + h.userData.hauteur + 0.3, o.z);
    if (MODELES.marchand && !MODELES.marchand.userData.ombre) { ombrePieds(MODELES.marchand, 1.4); MODELES.marchand.userData.ombre = true; }
    if (MODELES.marchand) { marchandMesh = pose('marchand', o.x + mx, o.y, o.z + mz, o.c0.id, -0.5 + a); marchandMesh.userData.y0 = o.y; marchandMesh.userData.ry0 = -0.5 + a; } /* le marchand a cote de son etal */
  }
  o = blocBati('forge'); if (o && MODELES.forge) { pose('forge', o.x, o.y, o.z, o.c0.id, rotDe('forge')); ancres.forge = new T.Vector3(o.x, o.y + 3.2, o.z); } else delete ancres.forge;
  o = blocBati('niche'); if (o && MODELES.maisonGardien) { pose('maisonGardien', o.x, o.y, o.z, o.c0.id, rotDe('niche')); ancres.niche = new T.Vector3(o.x, o.y + 2.3, o.z); } else delete ancres.niche; /* la maison du gardien (14c-gardien.js) */
  o = blocBati('puits'); if (o) pose('puits' + nivBat('nivPuits'), o.x, o.y, o.z, o.c0.id, -0.3 + rotDe('puits'));
  o = blocBati('epouvantail'); if (o) pose('epouvantail', o.x, o.y, o.z, o.c0.id, 0.4 + rotDe('epouvantail'));
  o = blocBati('foin'); if (o) { const a = rotDe('foin'); [[-0.35, 0, -0.2, 0.3], [0.45, 0, 0.35, -0.5], [0.05, 0.55, 0.05, 1.2]].forEach(([dx, dy, dz, r]) => { const [x, z] = tourne(dx, dz, a); pose('botte', o.x + x, o.y + dy, o.z + z, o.c0.id, r + a); }); }
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
    if (ok && o.B.every((c) => o.B.length === cells.length)) return cells;
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
  const ici = paysanMesh && caseIci(paysanMesh.position.x, paysanMesh.position.z), dep = ici && PASSABLE[ici.type] ? ici : S_.cases.find((c) => c.id === 'm3_2' && PASSABLE[c.type]) || S_.cases.find((c) => PASSABLE[c.type]);
  const vu = new Set([dep]), file = [dep];
  while (file.length) { const c = file.shift(); voisins(c).forEach((v) => { if (PASSABLE[v.type] && !vu.has(v)) { vu.add(v); file.push(v); } }); }
  const manque = [];
  Object.keys(BATIS).filter((t) => t !== 'foin').concat(['enclos']).forEach((t) => { /* le foin n'est qu'un decor */ const B = S_.cases.filter((c) => c.type === t); if (B.length && !B.some((c) => voisins(c).some((v) => vu.has(v)))) manque.push(BATIS[t] || 'l\'enclos'); });
  if (S_.cases.some((c) => c.type === 'champ' && !vu.has(c))) manque.push('une de tes parcelles');
  return manque;
}
