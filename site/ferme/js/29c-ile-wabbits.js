'use strict';
/* L'ILE DES WABBITS, PREMIERE ILE-DONJON (version dev : mode test seulement).
   Prototype du 19/11/2026 (un chemin qui serpente dans la mer), remplace le 22/11/2026 par le LABORATOIRE DE LA CAWOTTE choisi par Mathieu le 20/11
   (ILE-DONJON.md) : une ile ronde et, au milieu, la tour du Docteur Wabbenstein, une cawotte geante de cuivre (piste A « cuivre industriel »,
   modele blender/ile-labo.py -> assets/modeles/jeu/ile-labo.glb). On debarque au ponton ; au pied de la tour, des Wabbits mutants gardent leur coin et
   attaquent quiconque entre dans leur perimetre (ils rentrent chez eux si on s'eloigne) ; une passerelle en spirale monte autour de la tour, on y marche
   pour de vrai (hauteurSol) ; cinq portes, une par etage, menent chacune a une salle ; une grille ferme la passerelle apres chacune des quatre premieres
   et s'ouvre quand sa salle est nettoyee (chaque salle donne la cle de la suivante). En attendant les salles interieures, les mutants de la salle sortent
   par la porte sur la passerelle ; la 5e porte (le labo de Wabbenstein) termine l'essai. Tout se joue dans un seul combat (genre 'donjon').
   Les tests se lancent par le bandeau du mode test (bouton « Île des Wabbits »). */
const DONJON = new T.Vector3(0, 0, -300);
/* la passerelle : les memes mesures que blender/ile-labo.py (RAMPE) ; une spirale de A0 sur TOURS tours, de 0 a H, entre R_IN et R_OUT */
const LABO = { A0: -0.55, TOURS: 2.0, H: 13.6, R_IN: 4.95, R_OUT: 7.35, PORTES: [2.4, 5.0, 7.6, 10.2, 12.8], GRILLE_APRES: 0.42, PALIER: 0.27 };
LABO.DA = LABO.TOURS * Math.PI * 2; LABO.K = LABO.H / LABO.DA;
const TAU_L = Math.PI * 2, hautRampe = (t) => Math.max(0, Math.min(LABO.H, (t - LABO.A0) * LABO.K)), angleRampe = (h) => LABO.A0 + h / LABO.K;
const rIle = (a) => 21.2 + 1.3 * Math.sin(3 * a + 0.5) + 0.8 * Math.sin(5 * a + 1.3); /* le bord de l'herbe ; le sable va 1,9 plus loin */
const PONTON_L = { x0: 17.2, x1: 23.6, z: 9.2, w: 0.95 };
/* les camps des mutants au pied de la tour (le decor est dans le modele : cages, caisses) ; r : leur perimetre */
const CAMPS_LABO = [
  { nom: 'les caisses du quai', x: 10.0, z: 8.4, r: 6.5, L: [['wabbit', 3], ['wabbitFonceur', 1]] },
  { nom: 'les cages', x: -10.6, z: 0.4, r: 7.5, L: [['wabbitNoir', 2], ['wabbit', 2], ['wabbitSorciere', 1]] },
  { nom: 'la réserve', x: 3.4, z: -12.6, r: 6.5, L: [['wabbitSquelette', 2], ['wabbitFonceur', 2]] },
  { nom: 'le dépôt', x: 12.2, z: -4.6, r: 6.5, L: [['woWabbit', 1], ['wabbitNoir', 2], ['wabbitSorciere', 1]] }];
/* LES SALLES INTERIEURES (ILE-DONJON.md, validees le 20/11 ; 22/11/2026) : on passe la porte, on est dans la salle (une piece ronde sous l'ile, a Y_SALLE,
   loin de la tour : x, z locaux) ; ses mutants l'attendent ; nettoyee, une sortie verte s'allume a l'entree : elle ramene sur la passerelle et ouvre la grille.
   La 5e, le labo : le Docteur Wabbenstein ; il tombe, fin du donjon. theme : le decor (sallesLabo) */
const Y_SALLE = -40;
const SALLES_LABO = [
  { nom: 'les cages', theme: 'cages', x: 70, z: 70, R: 9, L: [['wabbitFonceur', 3], ['wabbit', 2]] },
  { nom: 'la serre à mutagène', theme: 'serre', x: 140, z: 70, R: 9, L: [['wabbitSorciere', 2], ['wabbit', 3]] },
  { nom: 'la salle de chirurgie', theme: 'chirurgie', x: 210, z: 70, R: 9, L: [['woWabbit', 2], ['wabbitSquelette', 2]] },
  { nom: 'la salle des cuves', theme: 'cuves', x: 70, z: 140, R: 9, L: [['wabbitNoir', 3], ['gwandWabbit', 1]] },
  { nom: 'le labo du Docteur Wabbenstein', theme: 'labo', x: 140, z: 140, R: 11.5, L: [['wabbenstein', 1]] }];
/* les obstacles au sol (les cages et les caisses du modele) */
const BLOCS_LABO = [[-11.5, -3.0, 0.95], [-13.2, 0.6, 0.95], [-9.4, 4.6, 0.95], [10.8, -6.6, 0.95], [12.4, 6.8, 0.95], [4.0, -12.5, 0.95],
  [-8.2, -8.0, 1.1], [13.6, -2.6, 0.75], [8.6, 10.2, 0.75], [9.7, 11.0, 0.62], [-3.0, 12.4, 0.68], [2.6, -14.4, 0.66]].map(([x, z, r]) => ({ x, z, r }));
let ileWabbits = null, donjonEtat = null, donjonEntite = null;
const angDiff = (a, b) => { let d = (a - b) % TAU_L; if (d > Math.PI) d -= TAU_L; if (d < -Math.PI) d += TAU_L; return d; };
const surPonton = (lx, lz, m) => lx >= PONTON_L.x0 && lx <= PONTON_L.x1 - m && Math.abs(lz - PONTON_L.z) <= PONTON_L.w - m * 0.5;
/* jusqu'ou monte la passerelle : la premiere grille fermee */
function rampeMax() { const E = donjonEtat; for (let i = 0; i < 4; i++) if (!(E && E.grilles && E.grilles[i])) return angleRampe(LABO.PORTES[i]) + LABO.GRILLE_APRES - 0.12; return LABO.A0 + LABO.DA + LABO.PALIER; }
const etatPerso = () => (donjonEtat ? donjonEtat.perso : (bornerDonjon.libre || (bornerDonjon.libre = { mode: 'sol', theta: LABO.A0 })));
/* LE SOL ET LA PASSERELLE : ou l'on peut se tenir. E (l'etat de celui qui bouge : le perso, ou un monstre) dit s'il est au sol ou sur la passerelle, et
   a quel angle deroule (la spirale passe deux fois au-dessus du meme point : c'est l'angle deroule qui dit sur quel tour on est) */
function bornerDonjon(x, z, m, E) {
  m = m == null ? 0.4 : m; E = E || etatPerso(); let lx = x - DONJON.x, lz = z - DONJON.z, r = Math.hypot(lx, lz), a = Math.atan2(lz, lx);
  if (E.mode === 'salle') { /* (dans une salle : son cercle, et ses meubles) */
    const S = SALLES_LABO[E.i]; let sx = lx - S.x, sz = lz - S.z; const d = Math.hypot(sx, sz), R = S.R - 0.7 - m; if (d > R) { sx *= R / d; sz *= R / d; }
    for (let n = 0; n < 2; n++) (S.blocs || []).forEach((o) => { const dx = sx - o.x, dz = sz - o.z, dd = Math.hypot(dx, dz), Rb = o.r + m; if (dd >= Rb) return; if (dd < 0.001) sx = o.x + Rb; else { sx = o.x + dx / dd * Rb; sz = o.z + dz / dd * Rb; } });
    return [DONJON.x + S.x + sx, DONJON.z + S.z + sz]; }
  if (E.mode === 'rampe') {
    let t = a + TAU_L * Math.round((E.theta - a) / TAU_L);
    if (t >= LABO.A0 - 0.02) { t = Math.min(t, rampeMax()); const rr = Math.max(LABO.R_IN + m, Math.min(LABO.R_OUT - m, r)); E.theta = t; return [DONJON.x + rr * Math.cos(t), DONJON.z + rr * Math.sin(t)]; }
    E.mode = 'sol'; /* (redescendu par le bas de la passerelle) */
  }
  const d = angDiff(a, LABO.A0);
  if (r < LABO.R_OUT + m) {
    if (d > 0 && d < 0.35 && r >= LABO.R_IN + m * 0.5 && r <= LABO.R_OUT) { E.mode = 'rampe'; E.theta = LABO.A0 + d; return [x, z]; } /* (le pied de la passerelle) */
    if (d >= -0.65 && d <= 0) { if (r < LABO.R_IN + m) { const k = (LABO.R_IN + m) / (r || 1); lx *= k; lz *= k; } } /* (le petit coin devant le pied de la passerelle) */
    else { const k = (LABO.R_OUT + m) / (r || 1); lx *= k; lz *= k; }
  }
  r = Math.hypot(lx, lz); a = Math.atan2(lz, lx); const R = rIle(a) + 1.9 - m;
  if (r > R && !surPonton(lx, lz, m)) { if (lx > PONTON_L.x0 - 1 && Math.abs(lz - PONTON_L.z) < PONTON_L.w + 0.6) { lz = Math.max(PONTON_L.z - PONTON_L.w + m * 0.5, Math.min(PONTON_L.z + PONTON_L.w - m * 0.5, lz)); lx = Math.min(lx, PONTON_L.x1 - m); } else { const k = R / r; lx *= k; lz *= k; } }
  for (let n = 0; n < 2; n++) BLOCS_LABO.forEach((o) => { const dx = lx - o.x, dz = lz - o.z, dd = Math.hypot(dx, dz), Rb = o.r + m; if (dd >= Rb) return; if (dd < 0.001) lx = o.x + Rb; else { lx = o.x + dx / dd * Rb; lz = o.z + dz / dd * Rb; } });
  return [lx + DONJON.x, lz + DONJON.z];
}
const dansDonjon = (x, z, m) => { const lx = x - DONJON.x, lz = z - DONJON.z, r = Math.hypot(lx, lz); if (r >= LABO.R_IN && r <= LABO.R_OUT) return true; const E = { mode: 'sol', theta: LABO.A0 }, q = bornerDonjon(x, z, m, E); return E.mode === 'sol' && Math.hypot(q[0] - x, q[1] - z) < 0.05; };
/* la hauteur du sol : la passerelle pour qui est dessus (le perso, ou le monstre qu'on est en train de bouger), le ponton, sinon l'herbe */
const hauteurSolDonjon0 = hauteurSol;
hauteurSol = function (x, z) {
  if (lieu !== 'donjon' || !ileWabbits) return hauteurSolDonjon0.apply(this, arguments);
  const E = donjonEntite ? donjonEntite.lab : etatPerso(); if (E && E.mode === 'salle') return Y_SALLE; if (E && E.mode === 'rampe') { const a = Math.atan2(z - DONJON.z, x - DONJON.x); return hautRampe(Math.min(a + TAU_L * Math.round((E.theta - a) / TAU_L), rampeMax())); }
  return surPonton(x - DONJON.x, z - DONJON.z, 0) ? -0.06 : 0;
};
const majMonstreDonjon0 = majMonstre; majMonstre = function (mo) { if (lieu !== 'donjon') return majMonstreDonjon0.apply(this, arguments); donjonEntite = mo; try { return majMonstreDonjon0.apply(this, arguments); } finally { donjonEntite = null; } };
/* UN CLIC : sur la passerelle, le chemin suit la spirale (en ligne droite, on butait contre la tour) */
function cheminDonjon(p) {
  if (etatPerso().mode === 'salle') { const [x, z] = bornerDonjon(p.x, p.z); return [{ c: paysanMesh.userData.cellule, x, z }]; }
  const E = etatPerso(), pp = paysanMesh.position, lx = p.x - DONJON.x, lz = p.z - DONJON.z, r = Math.hypot(lx, lz), a = Math.atan2(lz, lx), surRampe = r >= LABO.R_IN - 0.2 && r <= LABO.R_OUT + 0.2 && p.y > 0.25;
  const pts = []; const spirale = (t0, t1, rr) => { const n = Math.max(1, Math.ceil(Math.abs(t1 - t0) / 0.3)); for (let k = 1; k <= n; k++) { const t = t0 + (t1 - t0) * k / n; pts.push({ x: DONJON.x + rr * Math.cos(t), z: DONJON.z + rr * Math.sin(t) }); } };
  const rm = (LABO.R_IN + LABO.R_OUT) / 2;
  if (surRampe) { /* l'angle deroule vise : celui dont la hauteur colle au point touche */
    let tv = a + TAU_L * Math.round((angleRampe(Math.max(0, p.y - 0.05)) - a) / TAU_L); tv = Math.max(LABO.A0 + 0.05, Math.min(rampeMax(), tv));
    if (E.mode === 'rampe') spirale(E.theta, tv, rm);
    else { const d0 = { x: DONJON.x + rm * Math.cos(LABO.A0 - 0.35), z: DONJON.z + rm * Math.sin(LABO.A0 - 0.35) }, R0 = LABO.R_OUT + 1.2, ap = Math.atan2(pp.z - DONJON.z, pp.x - DONJON.x);
      if (Math.hypot(pp.x - DONJON.x, pp.z - DONJON.z) > LABO.R_OUT) { const t0 = ap + angDiff(LABO.A0 - 0.35, ap); spirale(ap, t0, Math.max(R0, Math.hypot(pp.x - DONJON.x, pp.z - DONJON.z))); }
      pts.push(d0); spirale(LABO.A0 - 0.35, tv, rm); }
  } else if (E.mode === 'rampe') { spirale(E.theta, LABO.A0 - 0.3, rm); pts.push({ x: DONJON.x + (LABO.R_OUT + 1.2) * Math.cos(LABO.A0 - 0.5), z: DONJON.z + (LABO.R_OUT + 1.2) * Math.sin(LABO.A0 - 0.5) }); const [x, z] = bornerDonjon(p.x, p.z, 0.4, { mode: 'sol', theta: LABO.A0 }); pts.push({ x, z }); }
  else { /* au sol, de l'autre cote de la tour : on la contourne */
    const ap = Math.atan2(pp.z - DONJON.z, pp.x - DONJON.x), [x, z] = bornerDonjon(p.x, p.z, 0.4, { mode: 'sol', theta: LABO.A0 }), at = Math.atan2(z - DONJON.z, x - DONJON.x), rp = Math.hypot(pp.x - DONJON.x, pp.z - DONJON.z);
    const coupe = Math.abs(angDiff(at, ap)) > 1.2 && Math.min(rp, Math.hypot(x - DONJON.x, z - DONJON.z)) < 14; if (coupe) spirale(ap, ap + angDiff(at, ap), Math.max(LABO.R_OUT + 1.4, Math.min(rp, 12))); pts.push({ x, z }); }
  return pts.map((q) => ({ c: paysanMesh.userData.cellule, x: q.x, z: q.z }));
}
/* une case aux bords arrondis, comme celles de la ferme : un carre a coins ronds extrude vers le bas, le dessus a y = 0 */
function caseArrondie() { const f = new T.Shape(), r = 0.2, h = 0.9; f.moveTo(-h + r, -h); f.lineTo(h - r, -h); f.quadraticCurveTo(h, -h, h, -h + r); f.lineTo(h, h - r); f.quadraticCurveTo(h, h, h - r, h); f.lineTo(-h + r, h); f.quadraticCurveTo(-h, h, -h, h - r); f.lineTo(-h, -h + r); f.quadraticCurveTo(-h, -h, -h + r, -h);
  const g = new T.ExtrudeGeometry(f, { depth: 0.9, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 2, curveSegments: 3 }); g.rotateX(Math.PI / 2); g.translate(0, -0.07, 0); return g; }
/* ---------- la carte : la mer, les cases du sol (herbe, sable), la tour et son decor, les flaques de mutagene, quelques buissons ---------- */
async function construireIleWabbits() {
  const g = new T.Group(); g.position.copy(DONJON);
  const mer = new T.Mesh(new T.PlaneGeometry(420, 420), new T.MeshToonMaterial({ color: '#2a7fa3', gradientMap: grad })); mer.rotation.x = -Math.PI / 2; mer.position.y = -0.55; mer.receiveShadow = true; g.add(mer);
  const haut = new T.Mesh(new T.PlaneGeometry(420, 420), new T.MeshBasicMaterial({ color: '#7fe0ee', transparent: true, opacity: 0.18, depthWrite: false })); haut.rotation.x = -Math.PI / 2; haut.position.y = -0.5; g.add(haut);
  const bordIle = (x, z) => Math.hypot(x, z) - (rIle(Math.atan2(z, x)) + 1.9); /* (negatif : sur l'ile) */
  const cases = [], bord = [], ecume = [];
  for (let i = -15; i <= 15; i++) for (let j = -15; j <= 15; j++) { const x = i * 2, z = j * 2, d = bordIle(x, z);
    if (d <= 0.3) { if (Math.hypot(x, z) < 2.6) continue; cases.push({ x, z, sable: d > -1.9, v: ((i * 7 + j * 13) % 5 + 5) % 5 }); } else if (d <= 5.2) { bord.push({ x, z, d }); if (d <= 1.6) ecume.push([x, z]); } }
  { const eau = new T.InstancedMesh(new T.PlaneGeometry(2, 2), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false }), bord.length), M0 = new T.Matrix4(), R0 = new T.Matrix4().makeRotationX(-Math.PI / 2), C0 = new T.Color(), clair = new T.Color('#7fd6d6'), fonce = new T.Color('#2a7fa3');
    bord.forEach((b, k) => { M0.makeTranslation(b.x, -0.52, b.z).multiply(R0); eau.setMatrixAt(k, M0); eau.setColorAt(k, C0.copy(clair).lerp(fonce, Math.min(1, b.d / 5.2))); }); eau.instanceMatrix.needsUpdate = true; if (eau.instanceColor) eau.instanceColor.needsUpdate = true; g.add(eau);
    const ec = new T.InstancedMesh(new T.PlaneGeometry(2.1, 2.1), new T.MeshBasicMaterial({ color: '#f2fdff', transparent: true, opacity: 0.32, depthWrite: false }), ecume.length);
    ecume.forEach(([x, z], k) => { M0.makeTranslation(x, -0.5, z).multiply(R0); ec.setMatrixAt(k, M0); }); ec.instanceMatrix.needsUpdate = true; g.add(ec); g.userData.ecume = ec; }
  const geo = caseArrondie(), im = new T.InstancedMesh(geo, new T.MeshToonMaterial({ color: '#ffffff', gradientMap: grad }), cases.length), M = new T.Matrix4(), C = new T.Color();
  const HERBE = ['#6b9a4c', '#719f50', '#66944a', '#6e9c4e', '#74a352'], SABLE = ['#d9c58e', '#d3bf88'];
  cases.forEach((c, k) => { M.makeTranslation(c.x, c.sable ? -0.16 : 0.015 * (c.v % 3), c.z); im.setMatrixAt(k, M); C.set(c.sable ? SABLE[c.v % 2] : HERBE[c.v]); im.setColorAt(k, C); });
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.receiveShadow = true; g.add(im);
  const socle = new T.InstancedMesh(new T.BoxGeometry(2.0, 1.4, 2.0), new T.MeshToonMaterial({ color: '#8a6a44', gradientMap: grad }), cases.length); cases.forEach((c, k) => { M.makeTranslation(c.x, -1.6, c.z); socle.setMatrixAt(k, M); }); socle.instanceMatrix.needsUpdate = true; g.add(socle);
  const pose = (o, x, z, y, ry) => { o.position.set(x, y || 0, z); if (ry) o.rotation.y = ry; o.traverse((q) => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); g.add(o); return o; };
  /* la tour, la passerelle, les grilles, les portes et le decor du pied (le modele) : soudes par matiere, groupe par groupe ; la tour et ses portes ont leurs
     propres matieres (on les rend transparentes quand le perso passe derriere) */
  const sc = await chargerGlb('assets/modeles/jeu/ile-labo.glb?v=' + (VERSIONS_FICHIERS['ile-labo.glb'] || VERSION_MODELES)); versToon(sc, { normales: 0.03, sansContour: SC_BATI });
  const prendre = (nom) => { const n = sc.getObjectByName(nom); if (!n) return null; n.parent.remove(n); n.position.set(0, 0, 0); const e = new T.Group(); e.name = nom; e.add(n); fusionner(e); e.traverse((q) => { if (q.isMesh) { q.material = q.material.clone(); q.castShadow = true; q.receiveShadow = true; } }); g.add(e); return e; };
  g.userData.tour = prendre('Labo_tour'); g.userData.passerelle = prendre('Labo_passerelle'); prendre('Labo_decor');
  g.userData.portes = [1, 2, 3, 4, 5].map((i) => prendre('Labo_porte_' + i)); g.userData.grilles = [1, 2, 3, 4].map((i) => prendre('Labo_grille_' + i));
  /* la barque */
  { const b = new T.Group(), coque = boite(1.3, 0.45, 3.0, '#8a5a32'); coque.position.y = -0.2; b.add(coque); const bo = boite(1.45, 0.12, 3.1, '#6b4528'); bo.position.y = 0.05; b.add(bo);
    const proue = cone(0.66, 0.9, '#8a5a32', 4); proue.rotation.x = Math.PI / 2; proue.rotation.y = Math.PI / 4; proue.position.set(0, -0.2, 1.9); proue.scale.set(1, 1, 0.5); b.add(proue);
    for (const s of [-1, 1]) { const r = boite(0.08, 0.08, 1.6, '#c9a86a'); r.position.set(s * 0.9, 0.1, 0.3); r.rotation.y = s * 0.4; b.add(r); } pose(b, 25.0, 7.6, -0.2, -Math.PI / 2); g.userData.barque = b; }
  /* les flaques de mutagene qui luisent, pres des camps et au pied de la tour */
  const flaques = []; [[-8.5, -1.5, 1.4], [-11.8, 3.2, 0.9], [7.5, 6.6, 1.1], [1.0, -10.4, 1.2], [13.0, -8.4, 0.9], [-5.6, 9.4, 1.3], [-3.4, -12.0, 0.8], [15.0, 2.0, 0.7]].forEach(([x, z, s]) => {
    const f = new T.Mesh(new T.CircleGeometry(1.2 * s, 22), new T.MeshBasicMaterial({ color: '#8bff4a', transparent: true, opacity: 0.55, depthWrite: false })); f.rotation.x = -Math.PI / 2; f.position.set(x, 0.035, z); f.scale.set(1, 0.68, 1); g.add(f); flaques.push(f);
    const p = new T.Mesh(new T.CircleGeometry(0.42 * s, 14), f.material); p.rotation.x = -Math.PI / 2; p.position.set(x + 1.3 * s, 0.035, z + 0.6 * s); g.add(p); });
  /* des buissons, des touffes et des fleurs au bord de l'herbe (toujours les memes) */
  { let gr = 11; const rnd = () => (gr = (gr * 16807) % 2147483647) / 2147483647, FL = ['#f2b630', '#e8708c', '#ffffff'];
    for (let k = 0; k < 160; k++) { const a = rnd() * TAU_L, r = 9 + rnd() * 12, x = Math.cos(a) * r, z = Math.sin(a) * r; if (r > rIle(a) - 0.4 || BLOCS_LABO.some((b) => Math.hypot(x - b.x, z - b.z) < b.r + 0.8) || CAMPS_LABO.some((c) => Math.hypot(x - c.x, z - c.z) < 2.2) || (x > 15 && Math.abs(z - PONTON_L.z) < 2.4)) continue;
      const t = rnd(); if (t < 0.22) { const b = new T.Mesh(new T.IcosahedronGeometry(0.45 + rnd() * 0.3, 0), mat(rnd() < 0.5 ? '#5a9640' : '#679f48')); b.scale.y = 0.7; pose(b, x, z, 0.2); }
      else if (t < 0.75) { const f = new T.Group(); for (let q = 0; q < 3; q++) { const h = cone(0.06, 0.35, '#5f9a3e', 3); h.position.set((q - 1) * 0.08, 0.17, (q % 2) * 0.06); h.rotation.z = (q - 1) * 0.3; f.add(h); } pose(f, x, z); }
      else { const f = new T.Group(), tg = cone(0.025, 0.3, '#4f8a35', 3); tg.position.y = 0.15; f.add(tg); const fl = new T.Mesh(new T.IcosahedronGeometry(0.09, 0), mat(FL[Math.floor(rnd() * FL.length)])); fl.position.y = 0.32; f.add(fl); pose(f, x, z); } } }
  g.userData.salles = construireSalles(g);
  g.userData.flaques = flaques; sansClic(g); g.userData.salles.forEach((S) => { if (S.grp.userData.sol) delete S.grp.userData.sol.raycast; }); /* (le sol des salles reste cliquable) */ mer.raycast = im.raycast = T.Mesh.prototype.raycast; if (g.userData.passerelle) g.userData.passerelle.traverse((q) => { if (q.isMesh) delete q.raycast; }); /* (la mer, le sol et la passerelle restent cliquables : on y va) */
  im.raycast = T.InstancedMesh.prototype.raycast;
  scene.add(g); return g;
}
let ileWabbitsPromesse = null;
async function chargerIleWabbits() { if (!ileWabbits) ileWabbits = await (ileWabbitsPromesse || (ileWabbitsPromesse = construireIleWabbits())); return ileWabbits; }
VOYAGES.donjon = { centre: DONJON, charger: () => chargerIleWabbits(), zoom: () => 1.25 };
const montrerIles0 = montrerIles; montrerIles = function () { montrerIles0(); if (ileWabbits) ileWabbits.visible = lieu === 'donjon'; };
/* ---------- le donjon ---------- */
/* les Wabbits transmutes : la peau verdit et luit un peu, ils ne grignotent ni ne cassent rien ici (sans ca, ils filaient vers les champs de la ferme) */
function transmuter(o) {
  o.aggro = true; o.casseur = false; o.d = Object.assign({}, o.d, { grignote: false, casseur: false, bucheron: false, nom: o.d.nom + ' transmuté' + (o.d.fem ? 'e' : '') });
  const vert = new T.Color('#7dff5a'); o.m.traverse((q) => { if (!q.isMesh || !q.material || q.name === 'contour' || q.material.isMeshBasicMaterial) return; q.material = q.material.clone(); if (q.material.color) q.material.color.lerp(vert, 0.28); if (q.material.emissive) { q.material.emissive.set('#2fd12f'); q.material.emissiveIntensity = 0.22; } });
}
/* les camps : leurs mutants attendent chez eux, immobiles, jusqu'a ce que le perso entre dans leur perimetre */
function posterCamps(c) {
  CAMPS_LABO.forEach((K, k) => { const L = []; K.L.forEach(([t, n]) => { for (let i = 0; i < n; i++) L.push(t); });
    L.forEach((t, i) => { const a = i / L.length * TAU_L + k, r = 1.2 + (i % 2) * 1.2, q = bornerDonjon(DONJON.x + K.x + Math.cos(a) * r, DONJON.z + K.z + Math.sin(a) * r, 0.6, { mode: 'sol', theta: LABO.A0 });
      setTimeout(() => { if (combat === c && !c.fin) apparaitre(t, { x: q[0], z: q[1], apres: (o) => { transmuter(o); o.lab = { mode: 'sol', theta: LABO.A0 }; o.camp = k; o.maison = { x: q[0], z: q[1] }; } }); }, 200 + (k * 6 + i) * 120); }); });
}
/* le passage d'une porte : un fondu au noir, le perso de l'autre cote */
function fonduDonjon(fn) { let d = document.getElementById('fondu-donjon'); if (!d) { d = document.createElement('div'); d.id = 'fondu-donjon'; d.style.cssText = 'position:fixed;inset:0;background:#05070a;opacity:0;pointer-events:none;transition:opacity .28s;z-index:60'; document.body.appendChild(d); }
  d.style.opacity = '1'; setTimeout(() => { try { fn(); } finally { setTimeout(() => { d.style.opacity = '0'; }, 140); } }, 300); }
function placerPersoDonjon(x, y, z) { const u = paysanMesh.userData; paysanMesh.position.set(x, y, z); u.y = y; chemin = []; arrivee = null; if (combat) { combat.tenir = true; combat.ordre = false; combat.poursuite = false; combat.cible = null; } /* (de l'autre cote de la porte, il tient sa position : sinon il repartait vers un mutant reste au pied de la tour) */ VISEE.set(x, y + 0.6, z); placerCamera(); suivreOmbres(); }
const ENTREE_SALLE = Math.PI / 4; /* (l'entree de chaque salle : du cote de la camera de depart, la salle s'etend derriere) */
/* on passe la porte i : la salle, ses mutants (ou le Docteur) qui attendent au fond */
function ouvrirSalleLabo(i) {
  const c = combat, E = donjonEtat, S = SALLES_LABO[i]; if (!c || !E || E.salles[i]) return; E.salles[i] = { t: E.t, fini: false, dedans: true };
  const L = []; S.L.forEach(([t, n]) => { for (let k = 0; k < n; k++) L.push(t); });
  fonduDonjon(() => {
    const P = E.perso; P.mode = 'salle'; P.i = i; const re = S.R - 3.0; placerPersoDonjon(DONJON.x + S.x + Math.cos(ENTREE_SALLE) * re, Y_SALLE, DONJON.z + S.z + Math.sin(ENTREE_SALLE) * re);
    paysanMesh.userData.angle = Math.atan2(-Math.cos(ENTREE_SALLE), -Math.sin(ENTREE_SALLE)); paysanMesh.rotation.y = paysanMesh.userData.angle;
    toast(i === 4 ? 'Le labo ! Le Docteur Wabbenstein se retourne vers toi.' : 'Tu entres dans ' + S.nom + ' : ses mutants t\'attendent !', 'alerte'); son('vague', null, 2);
    L.forEach((t, k) => { const a = ENTREE_SALLE + Math.PI + (L.length > 1 ? (k / (L.length - 1) - 0.5) * 1.6 : 0), rr = i === 4 ? 2.5 : 2.6 + (k % 2) * 2.0, x = DONJON.x + S.x + Math.cos(a) * rr, z = DONJON.z + S.z + Math.sin(a) * rr;
      setTimeout(() => { if (combat !== c || c.fin) return; apparaitre(t, { x, z, apres: (o) => { if (t !== 'wabbenstein') transmuter(o); o.lab = { mode: 'salle', i }; o.salle = i; o.y = Y_SALLE; o.ry = Math.atan2(Math.cos(ENTREE_SALLE), Math.sin(ENTREE_SALLE)); if (o.dep) { o.dep.x = x; o.dep.z = z; o.dep.y = Y_SALLE - 1.4; } } }); }, 450 + k * 240); });
  });
}
/* la salle nettoyee : on ressort par la sortie verte, sur la passerelle devant la porte, et la grille s'ouvre */
function sortirSalleLabo(i) { const E = donjonEtat; if (!E || E.sortie) return; E.sortie = true;
  fonduDonjon(() => { const P = E.perso, ta = angleRampe(LABO.PORTES[i]) + 0.05, rr = LABO.R_IN + 0.9; P.mode = 'rampe'; P.theta = ta; P.i = null; E.salles[i].dedans = false; E.sortie = false;
    placerPersoDonjon(DONJON.x + rr * Math.cos(ta), hautRampe(ta), DONJON.z + rr * Math.sin(ta)); const S = ileWabbits.userData.salles[i]; if (S && S.sortie) S.sortie.visible = false; ouvrirGrille(i); }); }
/* LES SALLES : une piece ronde chacune, sous l'ile ; sol de toles, murets de cuivre cercles de laiton, tuyaux, la porte d'entree et sa sortie verte, et le decor
   de son theme (les cages, la serre, la chirurgie, les cuves, le labo) ; chaque meuble est un obstacle (S.blocs, en coordonnees de la salle) */
function construireSalles(g) {
  const T_ = (o, x, y, z) => { o.position.set(x, y, z); o.traverse((q) => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); return o; };
  const cyl = (r, h, c, seg) => new T.Mesh(new T.CylinderGeometry(r, r, h, seg || 16), mat(c)), lum = (c, o) => new T.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o == null ? 1 : o, depthWrite: o == null });
  return SALLES_LABO.map((S, i) => {
    const s = new T.Group(), R = S.R, blocs = []; s.position.set(S.x, Y_SALLE, S.z); const bloc = (x, z, r) => blocs.push({ x, z, r });
    const vide = new T.Mesh(new T.CircleGeometry(R + 30, 40), lum('#0b0d12')); vide.rotation.x = -Math.PI / 2; vide.position.y = -0.3; s.add(vide);
    const sol = cyl(R, 0.4, '#5a5d64', 56); sol.position.y = -0.2; sol.receiveShadow = true; s.add(sol); s.userData.sol = sol;
    for (let k = 1; k <= 3; k++) { const a = new T.Mesh(new T.RingGeometry(R * k / 4 - 0.05, R * k / 4 + 0.05, 56), lum('#43464d')); a.rotation.x = -Math.PI / 2; a.position.y = 0.012; s.add(a); }
    for (let k = 0; k < 8; k++) { const b = boite(R * 0.75, 0.02, 0.09, '#43464d'); b.position.set(Math.cos(k / 8 * Math.PI * 2) * R * 0.625, 0.012, Math.sin(k / 8 * Math.PI * 2) * R * 0.625); b.rotation.y = -k / 8 * Math.PI * 2; s.add(b); }
    const mur = new T.Mesh(new T.CylinderGeometry(R + 0.3, R + 0.3, 1.7, 56, 1, true), new T.MeshToonMaterial({ color: '#b5602a', gradientMap: grad, side: T.DoubleSide })); mur.position.y = 0.85; s.add(mur);
    const cercle = new T.Mesh(new T.TorusGeometry(R + 0.3, 0.15, 8, 56), mat('#b38d35')); cercle.rotation.x = Math.PI / 2; cercle.position.y = 1.72; s.add(cercle);
    for (let k = 0; k < 10; k++) { const a = ENTREE_SALLE + Math.PI + (k / 9 - 0.5) * 3.6, t = cyl(0.22, 4.2, k % 3 ? '#a8562e' : '#7a3b1e', 10); s.add(T_(t, Math.cos(a) * (R + 0.55), 2.1, Math.sin(a) * (R + 0.55))); if (k % 3 === 1) { const v = cyl(0.3, 0.12, '#b38d35', 12); s.add(T_(v, Math.cos(a) * (R + 0.55), 3.2, Math.sin(a) * (R + 0.55))); } }
    /* la porte d'entree, et la sortie verte devant elle */
    { const ca = Math.cos(ENTREE_SALLE), sa = Math.sin(ENTREE_SALLE), p = new T.Group(); const cad = boite(2.2, 2.6, 0.35, '#3e4046'); cad.position.y = 1.3; p.add(cad); const po = boite(1.6, 2.2, 0.4, '#62656d'); po.position.y = 1.1; p.add(po);
      const vo = new T.Mesh(new T.TorusGeometry(0.36, 0.05, 6, 16), mat('#8b8f98')); vo.position.set(0, 1.4, 0.22); p.add(vo); p.rotation.y = Math.atan2(ca, sa); s.add(T_(p, ca * (R + 0.25), 0, sa * (R + 0.25))); }
    const sortie = new T.Mesh(new T.RingGeometry(0.8, 1.15, 32), lum('#7dff5a', 0.75)); sortie.rotation.x = -Math.PI / 2; sortie.position.set(Math.cos(ENTREE_SALLE) * (R - 1.0), 0.04, Math.sin(ENTREE_SALLE) * (R - 1.0)); sortie.visible = false; /* (contre la porte, loin de l'arrivee : on ressort quand on veut) */ s.add(sortie);
    const fond = (k, n, rr) => { const a = ENTREE_SALLE + Math.PI + (n > 1 ? (k / (n - 1) - 0.5) * 2.6 : 0); return [Math.cos(a) * rr, Math.sin(a) * rr]; }; /* (le fond de la salle, face a l'entree) */
    const cote = (k, rr) => { const a = ENTREE_SALLE + (k % 2 ? 1 : -1) * (1.25 + Math.floor(k / 2) * 0.42); return [Math.cos(a) * rr, Math.sin(a) * rr]; };
    if (S.theme === 'cages') { /* les cages : des cages de fer le long du mur, certaines enfoncees */
      for (let k = 0; k < 9; k++) { const [x, z] = k < 5 ? fond(k, 5, R - 1.3) : cote(k - 5, R - 1.3), c = new T.Group(); const sk = boite(1.3, 0.1, 1.3, '#2f3035'); sk.position.y = 0.05; c.add(sk); const tt = boite(1.3, 0.1, 1.3, '#2f3035'); tt.position.y = 1.6; c.add(tt);
        for (let b = 0; b < 12; b++) { const a2 = b / 12 * Math.PI * 2, br = boite(0.05, 1.55, 0.05, '#4a4c52'); br.position.set(Math.cos(a2) * 0.6, 0.8, Math.sin(a2) * 0.6); if (!(k % 3 === 2 && b < 3)) c.add(br); }
        c.rotation.y = k * 0.7; s.add(T_(c, x, 0, z)); bloc(x, z, 0.85); } }
    else if (S.theme === 'serre') { /* la serre a mutagene : des bacs de terre ou poussent des plantes vertes qui luisent, des flaques */
      for (let k = 0; k < 6; k++) { const [x, z] = k < 4 ? fond(k, 4, R - 1.6) : cote(k - 4, R - 1.8), b = new T.Group(); const bac = boite(1.8, 0.5, 1.0, '#6b4528'); bac.position.y = 0.25; b.add(bac); const te = boite(1.7, 0.08, 0.9, '#3d2f20'); te.position.y = 0.52; b.add(te);
        for (let q = 0; q < 3; q++) { const tg = cone(0.07, 1.1 + q * 0.25, '#3f8f3a', 5); tg.position.set(-0.55 + q * 0.55, 1.0 + q * 0.12, 0); b.add(tg); const bu = new T.Mesh(new T.IcosahedronGeometry(0.2, 0), lum('#8dff6a')); bu.position.set(-0.55 + q * 0.55, 1.55 + q * 0.25, 0); b.add(bu); }
        b.rotation.y = -Math.atan2(z, x) + Math.PI / 2; s.add(T_(b, x, 0, z)); bloc(x, z, 1.0); }
      for (const [x, z, r] of [[-1.8, 2.4, 1.1], [2.6, -1.4, 0.8], [0.4, -3.8, 0.9]]) { const f = new T.Mesh(new T.CircleGeometry(r, 18), lum('#8bff4a', 0.5)); f.rotation.x = -Math.PI / 2; f.position.set(x, 0.03, z); s.add(f); } }
    else if (S.theme === 'chirurgie') { /* la salle de chirurgie : deux tables d'operation sous leurs lampes, des chariots d'outils, un bras mecanique */
      for (let k = 0; k < 2; k++) { const [x, z] = fond(k, 2, R - 3.4), t = new T.Group(); const pl = boite(2.2, 0.16, 1.0, '#d8dde2'); pl.position.y = 0.95; t.add(pl); const pi = cyl(0.12, 0.9, '#62656d', 8); pi.position.y = 0.45; t.add(pi); const pied = boite(1.0, 0.1, 0.6, '#43464d'); pied.position.y = 0.05; t.add(pied);
        const tige = cyl(0.05, 1.6, '#43464d', 6); tige.position.set(0, 2.4, 0); t.add(tige); const lampe = cone(0.5, 0.4, '#62656d', 12); lampe.position.y = 3.2; t.add(lampe); const ampoule = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), lum('#fff6c8')); ampoule.position.y = 3.0; t.add(ampoule);
        t.rotation.y = -Math.atan2(z, x); s.add(T_(t, x, 0, z)); bloc(x, z, 1.15); }
      for (let k = 0; k < 4; k++) { const [x, z] = cote(k, R - 1.5), ch = new T.Group(); const pl = boite(1.0, 0.08, 0.6, '#9aa3ad'); pl.position.y = 0.9; ch.add(pl); const pl2 = boite(1.0, 0.08, 0.6, '#9aa3ad'); pl2.position.y = 0.45; ch.add(pl2);
        for (const [dx, dz] of [[-0.45, -0.25], [0.45, -0.25], [-0.45, 0.25], [0.45, 0.25]]) { const pi = cyl(0.03, 0.9, '#62656d', 6); pi.position.set(dx, 0.45, dz); ch.add(pi); } const sc = new T.Mesh(new T.ConeGeometry(0.06, 0.4, 5), lum('#d8ffb0')); sc.rotation.z = Math.PI / 2; sc.position.set(0.1, 1.0, 0); ch.add(sc);
        s.add(T_(ch, x, 0, z)); bloc(x, z, 0.65); }
      { const [x, z] = fond(0, 1, R - 1.2), br = new T.Group(); const so = cyl(0.5, 0.5, '#43464d', 12); so.position.y = 0.25; br.add(so); const b1 = cyl(0.16, 2.2, '#c9682a', 10); b1.position.set(0, 1.5, 0); br.add(b1); const b2 = cyl(0.13, 1.8, '#c9682a', 10); b2.rotation.z = 1.1; b2.position.set(0.75, 2.8, 0); br.add(b2); const pince = cone(0.18, 0.4, '#62656d', 6); pince.position.set(1.55, 3.0, 0); pince.rotation.z = -1.6; br.add(pince); s.add(T_(br, x, 0, z)); bloc(x, z, 0.7); } }
    else if (S.theme === 'cuves') { /* la salle des cuves : de grandes cuves de verre vert, cerclees de laiton, des Wabbits en suspension */
      for (let k = 0; k < 5; k++) { const [x, z] = k < 3 ? fond(k, 3, R - 1.8) : cote(k - 3, R - 2.0), cu = new T.Group(); const pied = cyl(0.95, 0.4, '#b38d35', 18); pied.position.y = 0.2; cu.add(pied); const verre = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 2.6, 18), lum('#7dff5a', 0.42)); verre.position.y = 1.7; cu.add(verre);
        const toit = cyl(0.95, 0.35, '#b38d35', 18); toit.position.y = 3.15; cu.add(toit); const lap = new T.Mesh(new T.SphereGeometry(0.4, 10, 8), mat('#d8d2c4')); lap.scale.set(1, 1.3, 1); lap.position.y = 1.7; cu.add(lap); const t2 = cyl(0.12, 1.2, '#a8562e', 8); t2.position.y = 3.9; cu.add(t2);
        s.add(T_(cu, x, 0, z)); bloc(x, z, 1.05); } }
    else { /* le labo du Docteur : la grande cuve de sa derniere creation, son pupitre aux ecrans verts, deux bobines qui crepitent, des cawottes a l'etude */
      { const [x, z] = fond(0, 1, R - 2.2), cu = new T.Group(); const pied = cyl(1.6, 0.5, '#b38d35', 22); pied.position.y = 0.25; cu.add(pied); const verre = new T.Mesh(new T.CylinderGeometry(1.4, 1.4, 3.6, 22), lum('#8dff6a', 0.45)); verre.position.y = 2.3; cu.add(verre); const toit = cyl(1.6, 0.4, '#b38d35', 22); toit.position.y = 4.3; cu.add(toit);
        const ca = cone(0.5, 1.6, '#e07a20', 8); ca.rotation.z = Math.PI; ca.position.y = 2.4; cu.add(ca); s.add(T_(cu, x, 0, z)); bloc(x, z, 1.7); }
      for (let k = 0; k < 2; k++) { const [x, z] = fond(k, 2, R - 2.0).map((v, j) => v + (j ? 1 : -1) * 0), [x2, z2] = cote(k, R - 2.2), bo = new T.Group(); const so = cyl(0.45, 0.4, '#43464d', 10); so.position.y = 0.2; bo.add(so);
        for (let q = 0; q < 6; q++) { const an = new T.Mesh(new T.TorusGeometry(0.32, 0.06, 6, 16), mat('#c98a3c')); an.rotation.x = Math.PI / 2; an.position.y = 0.6 + q * 0.28; bo.add(an); } const bou = new T.Mesh(new T.SphereGeometry(0.4, 12, 10), lum('#c9f2ff')); bou.position.y = 2.6; bo.add(bou); s.add(T_(bo, x2, 0, z2)); bloc(x2, z2, 0.6); void x; void z; }
      { const [x, z] = cote(2, R - 1.6), pu = new T.Group(); const b = boite(2.4, 1.0, 0.9, '#62656d'); b.position.y = 0.5; pu.add(b); for (let q = 0; q < 3; q++) { const e = new T.Mesh(new T.PlaneGeometry(0.6, 0.45), lum('#7dff5a')); e.position.set(-0.75 + q * 0.75, 1.35, 0.1); const ec = boite(0.7, 0.55, 0.1, '#3e4046'); ec.position.set(-0.75 + q * 0.75, 1.35, 0.02); pu.add(ec, e); }
        pu.rotation.y = -Math.atan2(z, x) - Math.PI / 2; s.add(T_(pu, x, 0, z)); bloc(x, z, 1.2); } }
    S.blocs = blocs; g.add(s); return { grp: s, sortie };
  });
}
function ouvrirGrille(i) { const E = donjonEtat; if (!E || E.grilles[i]) return; E.grilles[i] = true; const G = ileWabbits && ileWabbits.userData.grilles[i]; son('quete');
  toast('Tu ressors avec la clé : la grille de la passerelle s\'ouvre. Monte !', 'or');
  if (G) { let t = 0; effets.push((dt) => { t += dt; G.position.y = -Math.min(1, t / 1.1) * 2.6; if (t >= 1.1) { G.visible = false; return true; } return false; }); } }
function tickDonjon(dt) { /* chaque image, tant qu'on est sur l'ile : les camps, les portes et les grilles, les monstres sur l'ile, la camera, la tour qui s'efface */
  const E = donjonEtat, c = combat; if (!E || lieu !== 'donjon') return true; if (!c || c.genre !== 'donjon' || c.fin) return false;
  E.t += dt; const p = paysanMesh.position, P = E.perso, hP = P.mode === 'rampe' ? hautRampe(P.theta) : P.mode === 'salle' ? Y_SALLE : 0;
  const suivre = () => { if (!(typeof dg !== 'undefined' && dg.zoomJeu != null)) { const k = Math.min(1, dt * 4); VISEE.x += (p.x - VISEE.x) * k; VISEE.z += (p.z - VISEE.z) * k; VISEE.y += (0.6 + hP - VISEE.y) * Math.min(1, dt * 3); placerCamera(); } };
  if (E.arrivee) { suivre(); return false; } /* (pendant la traversee : rien ne bouge, la camera suit la barque) */
  /* les camps : ils attendent ; le perso entre dans leur perimetre (au sol), ils attaquent ; il s'eloigne ou monte, ils rentrent chez eux */
  CAMPS_LABO.forEach((K, k) => { const d = Math.hypot(p.x - DONJON.x - K.x, p.z - DONJON.z - K.z), st = E.camps[k];
    const blesse = !st.actif && c.monstres.some((o) => o.camp === k && o.etat === 'actif' && o.pv < o.pvMax); /* (un mutant touche de loin reveille tout son camp) */
    if (!st.actif && ((P.mode === 'sol' && d < K.r) || blesse)) { st.actif = true; st.force = blesse; toast('Des Wabbits mutants gardent ' + K.nom + ' : ils t\'attaquent !', 'alerte'); }
    else if (st.actif && (d > K.r + (st.force ? 16 : 9) || hP > 2.2)) { st.actif = false; st.force = false; } });
  c.monstres.forEach((o) => { if (o.etat !== 'actif' || o.camp == null || E.camps[o.camp].actif) return; o.bloqueT = Math.max(o.bloqueT || 0, 0.25); const dx = o.maison.x - o.x, dz = o.maison.z - o.z, d = Math.hypot(dx, dz);
    if (d > 0.3) { const v = Math.min(d, 3.2 * dt); o.x += dx / d * v; o.z += dz / d * v; o.ry = Math.atan2(dx, dz); } });
  /* les portes : on arrive devant, la salle s'ouvre ; une salle nettoyee rend 25 % de vie et ouvre la grille */
  if (P.mode === 'rampe') LABO.PORTES.forEach((h, i) => { if (E.salles[i] || (i > 0 && !E.grilles[i - 1])) return; const ta = angleRampe(h), r = Math.hypot(p.x - DONJON.x, p.z - DONJON.z); if (Math.abs(P.theta - ta) < 0.3 && r < LABO.R_IN + 1.3) ouvrirSalleLabo(i); });
  E.salles.forEach((s, i) => { if (!s || s.fini || E.t - s.t < 3) return; if (c.monstres.some((o) => o.salle === i && o.etat !== 'mort')) return; s.fini = true; c.pv = Math.min(c.pvMax, c.pv + c.pvMax * 0.25); majCombatHud();
    if (i === 4) { E.gagne = E.t; toast('Le Docteur Wabbenstein est tombé ! Les cages s\'ouvrent, les Wabbits sont libres.', 'or'); return; }
    const S = ileWabbits.userData.salles[i]; if (S) S.sortie.visible = true; toast('Salle nettoyée : la clé est à toi ! Ressors par l\'entrée (le cercle vert).', 'or'); son('quete'); });
  if (P.mode === 'salle' && P.i != null && P.i < 4 && E.salles[P.i] && E.salles[P.i].fini) { const S = SALLES_LABO[P.i], sx = DONJON.x + S.x + Math.cos(ENTREE_SALLE) * (S.R - 1.0), sz = DONJON.z + S.z + Math.sin(ENTREE_SALLE) * (S.R - 1.0); if (Math.hypot(p.x - sx, p.z - sz) < 1.05) sortirSalleLabo(P.i);
    const So = ileWabbits.userData.salles[P.i]; if (So && So.sortie.visible) { So.sortie.material.opacity = 0.55 + 0.3 * Math.sin(E.t * 5); So.sortie.scale.setScalar(1 + 0.06 * Math.sin(E.t * 5)); } }
  if (E.gagne != null && E.t - E.gagne > 1.6) { finDonjon(true); return true; }
  c.monstres.forEach((o) => { if (o.etat !== 'actif' || o.d.vole) return; if (!o.lab) o.lab = { mode: 'sol', theta: LABO.A0 }; const q = bornerDonjon(o.x, o.z, o.d.boss ? 0.9 : 0.3, o.lab); o.x = q[0]; o.z = q[1]; });
  if ((E.lueurT = (E.lueurT || 0) - dt) <= 0) { E.lueurT = 0.14; c.monstres.forEach((o) => { if (o.etat !== 'actif' || !o.m) return; const h = o.d.boss ? 2.4 : 1.2; emettre(FX_LUM, 2, { x: o.x + (Math.random() - 0.5) * 0.8, y: o.m.position.y + Math.random() * h, z: o.z + (Math.random() - 0.5) * 0.8, r: 0.1, v: [0, 1.1, 0], dv: 0.3, vie: [0.7, 1.2], taille: [0.2, 0.03], c: ['#d8ffb0', '#7dff5a', '#2fd12f'], a: 0.9, frein: 1 }); }); }
  suivre(); suivreOmbres(); effacerTour(dt, hP);
  if ((E.fumeeT = (E.fumeeT || 0) - dt) <= 0) { E.fumeeT = 0.22; const a = 2.85; emettre(FX_LUM, 1, { x: DONJON.x + 3.3 * Math.cos(a), y: 20.7, z: DONJON.z + 3.3 * Math.sin(a), r: 0.25, v: [0.25, 1.6, 0], dv: 0.3, vie: [2.2, 3], taille: [0.6, 1.6], c: ['#9a9a9a', '#c8c8c8', '#7a7a7a'], a: 0.45, frein: 0.6 }); } /* (la fumee de la cheminee) */
  if (ileWabbits) ileWabbits.userData.flaques.forEach((f, i) => { f.material.opacity = 0.45 + 0.15 * Math.sin(E.t * 2.4 + i); });
  if (ileWabbits && ileWabbits.userData.ecume) ileWabbits.userData.ecume.material.opacity = 0.26 + 0.1 * Math.sin(E.t * 1.3);
  return false;
}
/* LA TOUR QUI S'EFFACE : quand le perso passe derriere elle (vu de la camera), le corps de la tour devient transparent */
function effacerTour(dt, hP) {
  const T0 = ileWabbits && ileWabbits.userData.tour; if (!T0) return; const p = paysanMesh.position, lx = p.x - DONJON.x, lz = p.z - DONJON.z, r = Math.hypot(lx, lz);
  const cx = camera.position.x - DONJON.x, cz = camera.position.z - DONJON.z, cr = Math.hypot(cx, cz) || 1, derriere = r > 0.1 && r < 16 && (lx * cx + lz * cz) / (r * cr) < 0.15 && hP < 21;
  const E = donjonEtat; E.voile = (E.voile || 0) + ((derriere ? 1 : 0) - (E.voile || 0)) * Math.min(1, dt * 5); const op = 1 - 0.72 * E.voile;
  [T0].concat(ileWabbits.userData.portes || []).forEach((G) => G && G.traverse((q) => { if (!q.isMesh || !q.material) return; const tr = op < 0.99; if (q.material.transparent !== tr) { q.material.transparent = tr; q.material.needsUpdate = true; } q.material.opacity = op; q.material.depthWrite = !tr; }));
}
async function partirDonjon() {
  if (!MODE_TEST) return; if (combat) { toast('Finis ou quitte le combat d\'abord.'); return; } if (lieu !== 'ferme' && lieu !== 'donjon') { toast('Rentre d\'abord à la ferme.'); return; }
  fermerModale(); if (lieu !== 'donjon' && !(await allerSur('donjon'))) { toast('L\'île n\'a pas pu se charger, réessaie.', 'alerte'); return; }
  const I = ileWabbits.userData; if (I.barque) I.barque.position.set(44, -0.2, 7.6); (I.grilles || []).forEach((G) => { if (G) { G.visible = true; G.position.y = 0; } });
  const u = paysanMesh.userData; paysanMesh.position.set(DONJON.x + 22.6, 0, DONJON.z + 9.2); u.y = 0; u.angle = -Math.PI / 2; paysanMesh.rotation.set(0, u.angle, 0); u.charge = false; chemin = []; arrivee = null;
  VISEE.set(paysanMesh.position.x, 0.6, paysanMesh.position.z); zoom = VOYAGES.donjon.zoom(); placerCamera(); cadrer();
  const n = Math.max(51, Math.min(VAGUES_TOTAL, Math.round(niveau(S_.xp)))); /* (les Wabbits a la force de ton niveau, jamais sous la vague 51) */
  const total = CAMPS_LABO.concat(SALLES_LABO).reduce((a, Z) => a + Z.L.reduce((b, [, k]) => b + k, 0), 0);
  nouveauCombat('donjon', { n, attente: 1e9, total, ...potsDeVague() }); /* (attente : rien ne sort de la file, les camps et les salles font sortir leurs mutants) */
  { const repas = appliquerRepas(); if (repas.length) setTimeout(() => toast('Repas avant le donjon : ' + texteRepas(repas) + '.', 'or'), 2400); }
  donjonEtat = { t: 0, camps: CAMPS_LABO.map(() => ({ actif: false })), salles: [], grilles: [], gagne: null, n, perso: { mode: 'sol', theta: LABO.A0 } };
  ouvrirHudCombat(); majCombatHud(); effets.push(tickDonjon); posterCamps(combat); debarquer();
  toast('L\'île des Wabbits ! La tour du Docteur Wabbenstein t\'attend : monte la passerelle, chaque porte mène à une salle.', 'or');
}
/* L'ARRIVEE EN BARQUE : la barque vient du large avec le perso a bord, accoste au bout du ponton, et il saute dessus (2,8 s) */
function debarquer() {
  const b = ileWabbits && ileWabbits.userData.barque, E = donjonEtat; if (!b || !E) return; const c0 = combat, u = paysanMesh.userData, A = { x: 44, z: 7.6 }, B = { x: 25.0, z: 7.6 }, S = { x: 22.6, z: 9.2 }, cap = Math.atan2(B.x - A.x, B.z - A.z);
  E.arrivee = true; b.rotation.y = cap; let t = 0; const T1 = 2.2, T2 = 0.6;
  effets.push((dt) => { t += dt; if (combat !== c0 || !donjonEtat) return true; const p = paysanMesh.position;
    if (t < T1) { const k = t / T1, e = 1 - Math.pow(1 - k, 2); b.position.set(A.x + (B.x - A.x) * e, -0.2 + Math.sin(t * 5) * 0.04, A.z + (B.z - A.z) * e); b.rotation.z = Math.sin(t * 3.2) * 0.04;
      p.set(DONJON.x + b.position.x - Math.sin(cap) * 0.4, 0.05 + Math.sin(t * 5) * 0.04, DONJON.z + b.position.z - Math.cos(cap) * 0.4); u.y = p.y; u.angle = cap; paysanMesh.rotation.y = u.angle; chemin = []; arrivee = null; return false; }
    const k = Math.min(1, (t - T1) / T2), x0 = B.x - Math.sin(cap) * 0.4, z0 = B.z - Math.cos(cap) * 0.4; p.set(DONJON.x + x0 + (S.x - x0) * k, Math.sin(Math.PI * k) * 0.9, DONJON.z + z0 + (S.z - z0) * k); u.y = p.y;
    if (k < 1) return false; p.y = -0.06; u.y = -0.06; E.arrivee = false; b.rotation.z = 0; poussiere(p.x, 0, p.z, 5, 0.6, '#d9c58e'); return true; });
}
function finDonjon(gagne) {
  const c = combat, E = donjonEtat; if (!c || c.fin || c.genre !== 'donjon') return; nettoyerCombat(c, true); donjonEtat = null;
  const m = Math.floor(E.t / 60), sec = Math.round(E.t % 60), salles = E.salles.filter((s) => s && s.fini).length;
  if (ileWabbits) effacerTourReset();
  son(gagne ? 'victoire' : 'defaite'); if (gagne) confettis(60);
  ouvrirModale('donjon-fin', entete(gagne ? 'Le Docteur Wabbenstein est tombé !' : 'À terre !') +
    '<div class="recap-combat">' + ligneRecap('cadence', 'Temps', (m ? m + ' min ' : '') + sec + ' s') + ligneRecap('renfort', 'Salles nettoyées', salles + ' sur 5') + ligneRecap('renfort', 'Monstres abattus', c.st.tues) +
    ligneRecap('degats', 'Tes dégâts', fmt(Math.round(c.st.inflige))) + ligneRecap('vita', 'Dégâts reçus', fmt(Math.round(c.st.recus))) + '</div>' + detailCombat(c) +
    '<p class="hdv-aide">Essai (version dev) : la tour, sa passerelle, les camps du pied et les cinq salles. Prochaine étape : un coffre et un record de temps à la fin, les Wabbits mutants redessinés.</p>' +
    '<div class="act-bas"><button class="btn discret" data-montgolfiere="rentrer">Rentrer à la ferme</button><button class="btn kamas" data-donjon="partir">Recommencer</button></div>');
}
function effacerTourReset() { const I = ileWabbits.userData; [I.tour].concat(I.portes || []).forEach((G) => G && G.traverse((q) => { if (q.isMesh && q.material) { q.material.transparent = false; q.material.opacity = 1; q.material.depthWrite = true; q.material.needsUpdate = true; } })); }
/* le perso a terre sur l'ile : le bilan (sans deroute de la ferme) */
const persoATerreDonjon = persoATerre; persoATerre = function () { if (combat && combat.genre === 'donjon') { finDonjon(false); return; } persoATerreDonjon(); };
/* le bouton du bandeau du mode test, et ceux du bilan */
const bandeauTestDonjon = bandeauTest; bandeauTest = function () { bandeauTestDonjon(); const b = document.getElementById('bandeau-test'); if (b && !b.querySelector('[data-donjon]')) b.insertAdjacentHTML('beforeend', '<button class="btn mini" data-donjon="partir">Île des Wabbits</button>'); };
document.addEventListener('click', (e) => { const b = e.target.closest('[data-donjon]'); if (!b || !MODE_TEST || !estAdmin()) return; if (b.dataset.donjon === 'partir') { if (combat && combat.genre === 'donjon') return; partirDonjon(); } });
