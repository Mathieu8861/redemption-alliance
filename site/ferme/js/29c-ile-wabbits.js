'use strict';
/* L'ILE DES WABBITS, PREMIERE ILE-DONJON (prototype du 19/11/2026, version dev : mode test seulement). Demande de Mathieu, la nuit du 18 au 19/11 :
   « une ile mais cette fois au sol, en mer, ou c'est un donjon : on se balade sur une map, on avance, des monstres attaquent au fur et a mesure qu'on
   avance sur l'ile jusqu'a arriver au boss ; tu peux commencer par l'ile des Wabbits pour tester, ce sera des Wabbits transmutes ».
   L'ile est un long chemin de terre qui serpente dans la mer (sol : tout point a moins de R_CHEMIN du trace, et l'arene du boss au bout). On debarque de
   la barque sur la plage ; a chaque zone (champ de cawottes, terriers, ferme en ruine, marais de mutation, porte), un groupe de Wabbits transmutes (les
   Wabbits du jeu, verdis et luisants) sort de terre quand on approche et attaque ; le Wa Wabbit attend dans l'arene. Tout se joue dans un seul combat
   (genre 'donjon') qui dure tant qu'on est sur l'ile. Le perso a terre ou le boss abattu : le bilan, puis retour a la ferme. Les tests se lancent par le
   bandeau du mode test (bouton « Île des Wabbits »). */
const DONJON = new T.Vector3(0, 0, -300), R_CHEMIN = 4.4;
/* le trace du chemin (coordonnees locales) et l'arene du boss au bout */
const TRACE_WABBITS = [[0, 4], [0, -6], [2, -14], [10, -21], [20, -20], [27, -12], [26, -2], [18, 5], [10, 11], [8, 21], [15, 29], [25, 33]];
const ARENE_WABBITS = { x: 33, z: 37, r: 9 };
/* les zones : un groupe par zone, qui sort quand le perso arrive a moins de 'r' ; leur nom s'affiche */
const ZONES_WABBITS = [
  { nom: 'le champ de cawottes', x: 1, z: -11, r: 9, L: [['wabbit', 3], ['wabbitFonceur', 2]] },
  { nom: 'les terriers', x: 15, z: -21, r: 9, L: [['wabbitNoir', 2], ['wabbit', 2], ['wabbitSorciere', 1]] },
  { nom: 'la ferme en ruine', x: 27, z: -6, r: 9, L: [['wabbitSquelette', 2], ['woWabbit', 1], ['wabbitNoir', 2]] },
  { nom: 'le marais de mutation', x: 14, z: 8, r: 9, L: [['gwandWabbit', 1], ['wabbitSorciere', 2], ['wabbitFonceur', 2]] },
  { nom: 'la porte du terrier royal', x: 10, z: 23, r: 9, L: [['gwandWabbit', 2], ['woWabbit', 1], ['wabbitSquelette', 2]] },
  { nom: 'l\'arène du Wa Wabbit', x: ARENE_WABBITS.x, z: ARENE_WABBITS.z, r: 10, L: [['waWabbit', 1], ['woWabbit', 2]], boss: true }];
let ileWabbits = null, donjonEtat = null;
const distSeg = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz, t = L ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / L)) : 0, x = a[0] + dx * t, z = a[1] + dz * t; return [Math.hypot(px - x, pz - z), x, z]; };
function prochePiste(lx, lz) { /* le point du trace le plus proche, sa distance */
  let best = [1e9, 0, 0]; for (let i = 0; i < TRACE_WABBITS.length - 1; i++) { const d = distSeg(lx, lz, TRACE_WABBITS[i], TRACE_WABBITS[i + 1]); if (d[0] < best[0]) best = d; } return best;
}
const solWabbits = (lx, lz, m) => { const A = ARENE_WABBITS; return prochePiste(lx, lz)[0] <= R_CHEMIN - m || Math.hypot(lx - A.x, lz - A.z) <= A.r - m; };
const dansDonjon = (x, z, m) => { const lx = x - DONJON.x, lz = z - DONJON.z; if (!solWabbits(lx, lz, m == null ? 0.4 : m)) return false; return !(ileWabbits ? ileWabbits.userData.blocs : []).some((o) => Math.hypot(lx - o.x, lz - o.z) < o.r + (m == null ? 0.4 : m)); };
function bornerDonjon(x, z, m) { /* le point le plus proche ou l'on peut se tenir */
  m = m == null ? 0.4 : m; let lx = x - DONJON.x, lz = z - DONJON.z;
  if (!solWabbits(lx, lz, m)) { const A = ARENE_WABBITS, dA = Math.hypot(lx - A.x, lz - A.z), [dP, px, pz] = prochePiste(lx, lz);
    if (dA - A.r < dP - R_CHEMIN) { const k = (A.r - m) / dA; lx = A.x + (lx - A.x) * k; lz = A.z + (lz - A.z) * k; } else { const k = (R_CHEMIN - m) / (dP || 1); lx = px + (lx - px) * k; lz = pz + (lz - pz) * k; } }
  for (let n = 0; n < 2; n++) (ileWabbits ? ileWabbits.userData.blocs : []).forEach((o) => { const dx = lx - o.x, dz = lz - o.z, d = Math.hypot(dx, dz), R = o.r + m; if (d >= R) return; if (d < 0.001) lx = o.x + R; else { lx = o.x + dx / d * R; lz = o.z + dz / d * R; } });
  return [lx + DONJON.x, lz + DONJON.z];
}
/* une case aux bords arrondis, comme celles de la ferme : un carre a coins ronds extrude vers le bas, le dessus a y = 0 */
function caseArrondie() { const f = new T.Shape(), r = 0.2, h = 0.9; f.moveTo(-h + r, -h); f.lineTo(h - r, -h); f.quadraticCurveTo(h, -h, h, -h + r); f.lineTo(h, h - r); f.quadraticCurveTo(h, h, h - r, h); f.lineTo(-h + r, h); f.quadraticCurveTo(-h, h, -h, h - r); f.lineTo(-h, -h + r); f.quadraticCurveTo(-h, -h, -h + r, -h);
  const g = new T.ExtrudeGeometry(f, { depth: 0.9, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 2, curveSegments: 3 }); g.rotateX(Math.PI / 2); g.translate(0, -0.07, 0); return g; }
/* ---------- la carte : la mer, les cases du sol (herbe, chemin de terre, sable du bord), le decor de chaque zone ---------- */
function construireIleWabbits() {
  const g = new T.Group(); g.position.copy(DONJON); const blocs = [];
  const mer = new T.Mesh(new T.PlaneGeometry(420, 420), new T.MeshToonMaterial({ color: '#2a7fa3', gradientMap: grad })); mer.rotation.x = -Math.PI / 2; mer.position.y = -0.55; mer.receiveShadow = true; g.add(mer);
  const haut = new T.Mesh(new T.PlaneGeometry(420, 420), new T.MeshBasicMaterial({ color: '#7fe0ee', transparent: true, opacity: 0.18, depthWrite: false })); haut.rotation.x = -Math.PI / 2; haut.position.y = -0.5; g.add(haut);
  /* les cases : une boite par case de 2, en une seule maille instanciee (une couleur par case) */
  const cases = [];
  for (let i = -8; i <= 22; i++) for (let j = -17; j <= 24; j++) { const x = i * 2, z = j * 2, A = ARENE_WABBITS, dA = Math.hypot(x - A.x, z - A.z) - A.r, [dP] = prochePiste(x, z), d = Math.min(dP - R_CHEMIN, dA);
    if (d > 2.2) continue; const sable = d > 0.3, chemin = !sable && dP < 1.5 && dA > -1, arene = dA < -1.5; cases.push({ x, z, sable, chemin, arene, v: ((i * 7 + j * 13) % 5 + 5) % 5 }); }
  { const bord = []; for (let i = -10; i <= 24; i++) for (let j = -19; j <= 26; j++) { const x = i * 2, z = j * 2, A = ARENE_WABBITS, d = Math.min(prochePiste(x, z)[0] - R_CHEMIN, Math.hypot(x - A.x, z - A.z) - A.r); if (d > 2.2 && d <= 7) bord.push({ x, z, d }); }
    const eau = new T.InstancedMesh(new T.PlaneGeometry(2, 2), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false }), bord.length), M0 = new T.Matrix4(), R0 = new T.Matrix4().makeRotationX(-Math.PI / 2), C0 = new T.Color(), clair = new T.Color('#7fd6d6'), fonce = new T.Color('#2a7fa3');
    bord.forEach((b, k) => { M0.makeTranslation(b.x, -0.52, b.z).multiply(R0); eau.setMatrixAt(k, M0); eau.setColorAt(k, C0.copy(clair).lerp(fonce, (b.d - 2.2) / 4.8)); }); eau.instanceMatrix.needsUpdate = true; if (eau.instanceColor) eau.instanceColor.needsUpdate = true; g.add(eau); } /* (l'eau claire des hauts-fonds, plus foncee au large) */
  const geo = caseArrondie(), im = new T.InstancedMesh(geo, new T.MeshToonMaterial({ color: '#ffffff', gradientMap: grad }), cases.length), M = new T.Matrix4(), C = new T.Color();
  const HERBE = ['#6b9a4c', '#719f50', '#66944a', '#6e9c4e', '#74a352'], TERRE = ['#a87a4a', '#a37548', '#ad7f4e'], SABLE = ['#d9c58e', '#d3bf88'], DALLE = ['#bdb5a3', '#b2aa98']; /* (les couleurs de la ferme, adoucies comme l'ile ronde : versToon douce) */
  cases.forEach((c, k) => { const y = c.sable ? -0.16 : c.chemin ? -0.02 : 0.015 * (c.v % 3); M.makeTranslation(c.x, y, c.z); im.setMatrixAt(k, M); /* (le dessus de la case ; la plage un cran plus bas que l'herbe) */
    C.set(c.sable ? SABLE[c.v % 2] : c.arene ? DALLE[c.v % 2] : c.chemin ? TERRE[c.v % 3] : HERBE[c.v]); im.setColorAt(k, C); });
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.receiveShadow = true; g.add(im);
  /* le pied des falaises : un socle de terre sous les cases du bord, qui plonge dans la mer */
  const socle = new T.InstancedMesh(new T.BoxGeometry(2.0, 1.4, 2.0), new T.MeshToonMaterial({ color: '#8a6a44', gradientMap: grad }), cases.length); cases.forEach((c, k) => { M.makeTranslation(c.x, -1.6, c.z); socle.setMatrixAt(k, M); }); socle.instanceMatrix.needsUpdate = true; g.add(socle);
  const pose = (o, x, z, y, ry) => { o.position.set(x, y || 0, z); if (ry) o.rotation.y = ry; o.traverse((q) => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); g.add(o); return o; };
  const bloc = (x, z, r) => blocs.push({ x, z, r });
  /* la plage et la barque */
  { const b = new T.Group(), coque = boite(1.3, 0.45, 3.0, '#8a5a32'); coque.position.y = -0.2; b.add(coque); const bord = boite(1.45, 0.12, 3.1, '#6b4528'); bord.position.y = 0.05; b.add(bord);
    const proue = cone(0.66, 0.9, '#8a5a32', 4); proue.rotation.x = Math.PI / 2; proue.rotation.y = Math.PI / 4; proue.position.set(0, -0.2, 1.9); proue.scale.set(1, 1, 0.5); b.add(proue);
    for (const s of [-1, 1]) { const r = boite(0.08, 0.08, 1.6, '#c9a86a'); r.position.set(s * 0.9, 0.1, 0.3); r.rotation.y = s * 0.4; b.add(r); } pose(b, -7.6, 5.55, -0.2, Math.PI / 2); g.userData.barque = b; }
  /* le champ de cawottes : des rangs de fanes et de cawottes qui depassent */
  for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++) { const x = -3.4 + k * 1.7, z = -9 - r * 1.6; if (Math.abs(x) < 1.6) continue;
    const ca = cone(0.16, 0.5, '#f08a24', 6); ca.rotation.x = Math.PI; ca.position.y = 0.1; const f = cone(0.18, 0.4, '#4f9e3a', 5); f.position.y = 0.48; const p = new T.Group(); p.add(ca, f); pose(p, x, z); }
  /* les terriers : des buttes de terre et leur trou sombre */
  [[12, -24.5], [17, -24], [20.5, -16.5], [10.5, -17]].forEach(([x, z], i) => { const b = new T.Group(), t = new T.Mesh(new T.SphereGeometry(1.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#9a6b3c')); t.scale.set(1, 0.6, 1); b.add(t);
    const h = new T.Mesh(new T.CircleGeometry(0.42, 14), new T.MeshBasicMaterial({ color: '#2a1a10' })); h.position.set(0, 0.3, 0.95); h.rotation.x = -0.5; b.add(h); pose(b, x, z, 0, i); bloc(x, z, 1.0); });
  /* la ferme en ruine : des pans de mur de pierre et une charrette */
  [[24.5, -9, 0, 2.6], [29.5, -4, 1.57, 2.2], [23.5, -2.5, 0.4, 1.4]].forEach(([x, z, ry, L]) => { const m = new T.Group(); for (let k = 0; k < Math.round(L / 0.55); k++) { const p = boite(0.5, 0.9 + Math.random() * 0.8, 0.5, k % 2 ? '#c9c1b0' : '#a89f8c'); p.position.set(-L / 2 + k * 0.55, 0.45, 0); m.add(p); } pose(m, x, z, 0, ry); bloc(x, z, L / 2); });
  /* le marais de mutation : des flaques vertes qui luisent, des roseaux */
  const flaques = []; [[12, 5], [17, 9.5], [9, 10], [16, 3.5]].forEach(([x, z]) => { const f = new T.Mesh(new T.CircleGeometry(1.2, 20), new T.MeshBasicMaterial({ color: '#8bff4a', transparent: true, opacity: 0.55, depthWrite: false })); f.rotation.x = -Math.PI / 2; f.position.set(x, 0.03, z); f.scale.set(1, 0.7, 1); g.add(f); flaques.push(f);
    for (let k = 0; k < 4; k++) { const r = cone(0.05, 0.9, '#4a7a2e', 4); pose(r, x + Math.cos(k * 1.7) * 1.4, z + Math.sin(k * 1.7) * 1.0, 0.45); } });
  /* la porte du terrier royal : deux piliers de pierre et une arche ornee d'une cawotte */
  { const p = new T.Group(); for (const s of [-1, 1]) { const c = boite(0.7, 3.0, 0.7, '#c9c1b0'); c.position.set(s * 2.4, 1.5, 0); p.add(c); const o = boite(0.8, 0.2, 0.8, '#f2b630'); o.position.set(s * 2.4, 3.05, 0); p.add(o); }
    const a = boite(5.6, 0.5, 0.7, '#a89f8c'); a.position.y = 3.3; p.add(a); const ca = cone(0.45, 1.2, '#f08a24', 6); ca.rotation.z = Math.PI; ca.position.y = 4.1; p.add(ca); const fa = cone(0.4, 0.6, '#4f9e3a', 5); fa.position.y = 4.9; p.add(fa);
    pose(p, 9, 26.5, 0, 0.35); bloc(9 - 2.25, 26.5 + 0.8, 0.5); bloc(9 + 2.25, 26.5 - 0.8, 0.5); }
  /* l'arene du Wa Wabbit : un cercle de dalles, des piliers, la grande cawotte de pierre au fond */
  { const A = ARENE_WABBITS; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.2, x = A.x + Math.cos(a) * (A.r - 0.8), z = A.z + Math.sin(a) * (A.r - 0.8); if (Math.hypot(x - 25, z - 33) < 4) continue; const c = boite(0.7, 2.2, 0.7, '#c9c1b0'); c.position.y = 1.1; const o = boite(0.85, 0.2, 0.85, '#f2b630'); o.position.y = 2.25; const pi = new T.Group(); pi.add(c, o); pose(pi, x, z); bloc(x, z, 0.5); }
    const st = new T.Group(), ca = cone(1.3, 4.2, '#e07a20', 8); ca.rotation.z = Math.PI; ca.position.y = 2.6; st.add(ca); for (let k = 0; k < 3; k++) { const f = cone(0.45, 1.6, '#3f8f3a', 5); f.position.set(Math.cos(k * 2.1) * 0.4, 5.3, Math.sin(k * 2.1) * 0.4); f.rotation.z = Math.cos(k * 2.1) * 0.4; st.add(f); }
    const so = boite(2.4, 0.5, 2.4, '#a89f8c'); so.position.y = 0.25; st.add(so); pose(st, A.x + 5, A.z + 5); bloc(A.x + 5, A.z + 5, 1.5); }
  /* des arbres et des rochers sur les bords */
  [[-3.5, 0], [3.8, -3], [6, -18], [24, -23], [30.5, -14], [21, 2], [5, 14], [13, 17], [19, 26], [4, 24]].forEach(([x, z], i) => {
    if (i % 3 === 2) { const r = new T.Mesh(new T.DodecahedronGeometry(0.8, 0), mat('#9a9488')); r.scale.set(1, 0.7, 1.1); pose(r, x, z, 0.3, i); bloc(x, z, 0.8); return; }
    const t = new T.Group(), tr = boite(0.3, 1.4, 0.3, '#7a5230'); tr.position.y = 0.7; t.add(tr); const f = new T.Mesh(new T.IcosahedronGeometry(1.15, 0), mat(i % 2 ? '#4f9e3a' : '#5aa844')); f.position.y = 2.0; t.add(f); pose(t, x, z); bloc(x, z, 0.5); });
  /* l'ecume le long des plages : une bande claire sur les cases d'eau qui touchent le sable */
  { const L = []; for (let i = -10; i <= 24; i++) for (let j = -19; j <= 26; j++) { const x = i * 2, z = j * 2, A = ARENE_WABBITS, d = Math.min(prochePiste(x, z)[0] - R_CHEMIN, Math.hypot(x - A.x, z - A.z) - A.r); if (d > 2.2 && d <= 3.6) L.push([x, z]); }
    const ec = new T.InstancedMesh(new T.PlaneGeometry(2.1, 2.1), new T.MeshBasicMaterial({ color: '#f2fdff', transparent: true, opacity: 0.32, depthWrite: false }), L.length), M1 = new T.Matrix4(), R1 = new T.Matrix4().makeRotationX(-Math.PI / 2);
    L.forEach(([x, z], k) => { M1.makeTranslation(x, -0.5, z).multiply(R1); ec.setMatrixAt(k, M1); }); ec.instanceMatrix.needsUpdate = true; g.add(ec); g.userData.ecume = ec; }
  /* le ponton ou la barque accoste */
  { const p = new T.Group(); for (let k = 0; k < 9; k++) { const pl = boite(0.34, 0.12, 1.6, k % 2 ? '#a87a4a' : '#9a6a3c'); pl.position.set(-5.0 - k * 0.4, -0.08, 0); p.add(pl); } /* (sur la cote ouest, face au large : le sable s'arrete vers x = -6,6) */
    for (const s of [-1, 1]) for (const x of [-6.0, -8.0]) { const pi = boite(0.16, 1.1, 0.16, '#6b4528'); pi.position.set(x, -0.5, s * 0.72); p.add(pi); }
    const bo = boite(0.18, 0.5, 0.18, '#6b4528'); bo.position.set(-8.3, 0.15, 0.85); p.add(bo); pose(p, 0, 4, 0); }
  /* des buissons, des touffes d'herbe et des fleurs, places au hasard (toujours le meme) sur l'herbe, hors du chemin */
  { let gr = 7; const rnd = () => (gr = (gr * 16807) % 2147483647) / 2147483647, FL = ['#f2b630', '#e8708c', '#ffffff', '#b98cff'];
    for (let k = 0; k < 140; k++) { const x = -14 + rnd() * 58, z = -32 + rnd() * 76, [dP] = prochePiste(x, z), A = ARENE_WABBITS; if (dP > R_CHEMIN - 0.6 || dP < 1.8 || Math.hypot(x - A.x, z - A.z) < A.r + 0.5 || blocs.some((b) => Math.hypot(x - b.x, z - b.z) < b.r + 0.6)) continue;
      const t = rnd(); if (t < 0.3) { const b = new T.Mesh(new T.IcosahedronGeometry(0.45 + rnd() * 0.25, 0), mat(rnd() < 0.5 ? '#5a9640' : '#679f48')); b.scale.y = 0.7; pose(b, x, z, 0.2); }
      else if (t < 0.7) { const f = new T.Group(); for (let q = 0; q < 3; q++) { const h = cone(0.06, 0.35, '#5f9a3e', 3); h.position.set((q - 1) * 0.08, 0.17, (q % 2) * 0.06); h.rotation.z = (q - 1) * 0.3; f.add(h); } pose(f, x, z); }
      else { const f = new T.Group(), tg = cone(0.025, 0.3, '#4f8a35', 3); tg.position.y = 0.15; f.add(tg); const fl = new T.Mesh(new T.IcosahedronGeometry(0.09, 0), mat(FL[Math.floor(rnd() * FL.length)])); fl.position.y = 0.32; f.add(fl); pose(f, x, z); } } }
  g.userData.blocs = blocs; g.userData.flaques = flaques; sansClic(g); mer.raycast = T.Mesh.prototype.raycast; /* (la mer reste cliquable : toucher l'eau, c'est viser le bord) */
  scene.add(g); return g;
}
async function chargerIleWabbits() { if (!ileWabbits) ileWabbits = construireIleWabbits(); return ileWabbits; }
VOYAGES.donjon = { centre: DONJON, charger: () => chargerIleWabbits(), zoom: () => 1.1 };
const montrerIles0 = montrerIles; montrerIles = function () { montrerIles0(); if (ileWabbits) ileWabbits.visible = lieu === 'donjon'; };
/* ---------- le donjon ---------- */
/* les Wabbits transmutes : la peau verdit et luit un peu, ils ne grignotent ni ne cassent rien ici (sans ca, ils filaient vers les champs de la ferme) */
function transmuter(o) {
  o.aggro = true; o.casseur = false; o.d = Object.assign({}, o.d, { grignote: false, casseur: false, bucheron: false, nom: o.d.nom + ' transmuté' + (o.d.fem ? 'e' : '') });
  const vert = new T.Color('#7dff5a'); o.m.traverse((q) => { if (!q.isMesh || !q.material || q.name === 'contour' || q.material.isMeshBasicMaterial) return; q.material = q.material.clone(); if (q.material.color) q.material.color.lerp(vert, 0.28); if (q.material.emissive) { q.material.emissive.set('#2fd12f'); q.material.emissiveIntensity = 0.22; } });
}
function sortirZone(Z) { const c = combat; if (!c || c.genre !== 'donjon') return; const L = []; Z.L.forEach(([t, k]) => { for (let i = 0; i < k; i++) L.push(t); });
  L.forEach((t, i) => { const a = i / L.length * Math.PI * 2 + Math.random() * 0.4, r = MONSTRES[t].boss ? 0 : 2.2 + Math.random() * 1.6, q = bornerDonjon(DONJON.x + Z.x + Math.cos(a) * r, DONJON.z + Z.z + Math.sin(a) * r, 0.6);
    setTimeout(() => { if (combat === c && !c.fin) apparaitre(t, { x: q[0], z: q[1], apres: transmuter }); }, i * 220); });
  toast(Z.boss ? 'Le Wa Wabbit transmuté sort de son terrier royal !' : 'Des Wabbits transmutés surgissent : ' + Z.nom + ' !', 'alerte'); if (Z.boss) son('vague'); }
function tickDonjon(dt) { /* chaque image, tant qu'on est sur l'ile : les zones qui se declenchent, les monstres sur l'ile, la camera, les flaques qui palpitent */
  const E = donjonEtat, c = combat; if (!E || lieu !== 'donjon') return true; if (!c || c.genre !== 'donjon' || c.fin) return false;
  E.t += dt; const p = paysanMesh.position, lx = p.x - DONJON.x, lz = p.z - DONJON.z; if (E.arrivee) { if (!(typeof dg !== 'undefined' && dg.zoomJeu != null)) { const k = Math.min(1, dt * 4); VISEE.x += (p.x - VISEE.x) * k; VISEE.z += (p.z - VISEE.z) * k; placerCamera(); } return false; } /* (pendant la traversee : rien ne sort, la camera suit la barque) */
  ZONES_WABBITS.forEach((Z, k) => { if (E.zones[k]) return; const avant = ZONES_WABBITS.slice(0, k).every((z, j) => E.zones[j] && E.zones[j].fini); if (Math.hypot(lx - Z.x, lz - Z.z) > Z.r || (Z.boss && !avant)) return; E.zones[k] = { t: E.t, fini: false }; sortirZone(Z); });
  E.zones.forEach((z, k) => { if (z && !z.fini && E.t - z.t > 3 && !c.monstres.some((o) => o.etat !== 'mort')) { z.fini = true; const Z = ZONES_WABBITS[k]; if (Z.boss) { E.gagne = E.t; } else { toast(Z.nom.replace(/^./, (x) => x.toUpperCase()) + ' : nettoyé' + (Z.nom.startsWith('la') || Z.nom.startsWith('l\'') ? 'e' : '') + '. Avance !', 'or'); c.pv = Math.min(c.pvMax, c.pv + c.pvMax * 0.25); majCombatHud(); } } });
  if (E.gagne != null && E.t - E.gagne > 1.6) { finDonjon(true); return true; }
  c.monstres.forEach((o) => { if (o.etat !== 'actif' || o.d.vole) return; const q = bornerDonjon(o.x, o.z, o.d.boss ? 0.9 : 0.3); o.x = q[0]; o.z = q[1]; });
  if (!(typeof dg !== 'undefined' && dg.zoomJeu != null)) { const k = Math.min(1, dt * 4); VISEE.x += (p.x - VISEE.x) * k; VISEE.z += (p.z - VISEE.z) * k; placerCamera(); } suivreOmbres();
  if (ileWabbits) ileWabbits.userData.flaques.forEach((f, i) => { f.material.opacity = 0.45 + 0.15 * Math.sin(E.t * 2.4 + i); });
  if (ileWabbits && ileWabbits.userData.ecume) ileWabbits.userData.ecume.material.opacity = 0.26 + 0.1 * Math.sin(E.t * 1.3);
  return false;
}
async function partirDonjon() {
  if (!MODE_TEST) return; if (combat) { toast('Finis ou quitte le combat d\'abord.'); return; } if (lieu !== 'ferme' && lieu !== 'donjon') { toast('Rentre d\'abord à la ferme.'); return; }
  fermerModale(); if (ileWabbits && ileWabbits.userData.barque) ileWabbits.userData.barque.position.set(-26, -0.2, 6.4); if (lieu !== 'donjon' && !(await allerSur('donjon'))) { toast('L\'île n\'a pas pu se charger, réessaie.', 'alerte'); return; }
  const u = paysanMesh.userData; paysanMesh.position.set(DONJON.x + 0.5, 0, DONJON.z + 2.5); u.y = 0; u.angle = Math.PI; paysanMesh.rotation.set(0, u.angle, 0); u.charge = false; chemin = []; arrivee = null;
  VISEE.set(paysanMesh.position.x, 0.6, paysanMesh.position.z); zoom = VOYAGES.donjon.zoom(); placerCamera(); cadrer();
  const n = Math.max(51, Math.min(VAGUES_TOTAL, Math.round(niveau(S_.xp)))); /* (les Wabbits a la force de ton niveau, jamais sous la vague 51) */
  nouveauCombat('donjon', { n, attente: 1e9, total: ZONES_WABBITS.reduce((a, Z) => a + Z.L.reduce((b, [, k]) => b + k, 0), 0), ...potsDeVague() }); /* (attente : rien ne sort de la file, les zones font sortir leurs groupes) */
  { const repas = appliquerRepas(); if (repas.length) setTimeout(() => toast('Repas avant le donjon : ' + texteRepas(repas) + '.', 'or'), 2400); }
  donjonEtat = { t: 0, zones: [], gagne: null, n }; ouvrirHudCombat(); majCombatHud(); effets.push(tickDonjon); debarquer();
  toast('L\'île des Wabbits ! Suis le chemin : les Wabbits transmutés t\'attendent dans chaque zone, le Wa Wabbit au bout.', 'or');
}
/* L'ARRIVEE EN BARQUE : la barque vient du large avec le perso a bord, accoste, et il saute sur la plage (2,8 s ; les zones attendent qu'il ait pose le pied) */
function debarquer() {
  const b = ileWabbits && ileWabbits.userData.barque, E = donjonEtat; if (!b || !E) return; const c0 = combat, u = paysanMesh.userData, A = { x: -26, z: 6.4 }, B = { x: -7.6, z: 5.55 }, S = { x: -3.4, z: 4.4 }, cap = Math.atan2(B.x - A.x, B.z - A.z);
  E.arrivee = true; b.rotation.y = cap; let t = 0; const T1 = 2.2, T2 = 0.6;
  effets.push((dt) => { t += dt; if (combat !== c0 || !donjonEtat) return true; const p = paysanMesh.position;
    if (t < T1) { const k = t / T1, e = 1 - Math.pow(1 - k, 2); b.position.set(A.x + (B.x - A.x) * e, -0.2 + Math.sin(t * 5) * 0.04, A.z + (B.z - A.z) * e); b.rotation.z = Math.sin(t * 3.2) * 0.04;
      p.set(DONJON.x + b.position.x - Math.sin(cap) * 0.4, 0.05 + Math.sin(t * 5) * 0.04, DONJON.z + b.position.z - Math.cos(cap) * 0.4); u.y = p.y; u.angle = cap; paysanMesh.rotation.y = u.angle; chemin = []; arrivee = null; return false; }
    const k = Math.min(1, (t - T1) / T2), x0 = B.x - Math.sin(cap) * 0.4, z0 = B.z - Math.cos(cap) * 0.4; p.set(DONJON.x + x0 + (S.x - x0) * k, 0.05 + Math.sin(Math.PI * k) * 0.9, DONJON.z + z0 + (S.z - z0) * k); u.y = p.y; /* (le saut sur le ponton, puis la plage) */
    if (k < 1) return false; p.y = 0; u.y = 0; E.arrivee = false; b.rotation.z = 0; poussiere(p.x, 0, p.z, 5, 0.6, '#d9c58e'); return true; });
}
function finDonjon(gagne) {
  const c = combat, E = donjonEtat; if (!c || c.fin || c.genre !== 'donjon') return; nettoyerCombat(c, true); donjonEtat = null;
  const m = Math.floor(E.t / 60), sec = Math.round(E.t % 60), faites = E.zones.filter((z) => z && z.fini).length;
  son(gagne ? 'victoire' : 'defaite'); if (gagne) confettis(60);
  ouvrirModale('donjon-fin', entete(gagne ? 'Le Wa Wabbit transmuté est tombé !' : 'À terre !') +
    '<div class="recap-combat">' + ligneRecap('cadence', 'Temps', (m ? m + ' min ' : '') + sec + ' s') + ligneRecap('renfort', 'Zones nettoyées', faites + ' sur ' + ZONES_WABBITS.length) + ligneRecap('renfort', 'Monstres abattus', c.st.tues) +
    ligneRecap('degats', 'Tes dégâts', fmt(Math.round(c.st.inflige))) + ligneRecap('vita', 'Dégâts reçus', fmt(Math.round(c.st.recus))) + '</div>' + detailCombat(c) +
    '<p class="hdv-aide">Prototype (version dev) : pas encore de coffre ni de record. Ce qui est prévu : un coffre à la fin, un record de temps, des pauses pour boire un pot entre les zones.</p>' +
    '<div class="act-bas"><button class="btn discret" data-montgolfiere="rentrer">Rentrer à la ferme</button><button class="btn kamas" data-donjon="partir">Recommencer</button></div>');
}
/* le perso a terre sur l'ile : le bilan (sans deroute de la ferme) */
const persoATerreDonjon = persoATerre; persoATerre = function () { if (combat && combat.genre === 'donjon') { finDonjon(false); return; } persoATerreDonjon(); };
/* le bouton du bandeau du mode test, et ceux du bilan */
const bandeauTestDonjon = bandeauTest; bandeauTest = function () { bandeauTestDonjon(); const b = document.getElementById('bandeau-test'); if (b && !b.querySelector('[data-donjon]')) b.insertAdjacentHTML('beforeend', '<button class="btn mini" data-donjon="partir">Île des Wabbits</button>'); };
document.addEventListener('click', (e) => { const b = e.target.closest('[data-donjon]'); if (!b || !MODE_TEST || !estAdmin()) return; if (b.dataset.donjon === 'partir') { if (combat && combat.genre === 'donjon') return; partirDonjon(); } });
