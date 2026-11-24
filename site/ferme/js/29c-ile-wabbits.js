'use strict';
/* L'ILE DES WABBITS, PREMIERE ILE-DONJON (version dev : mode test seulement).
   Prototype du 19/11/2026 (un chemin qui serpente dans la mer), remplace le 22/11/2026 par le LABORATOIRE DE LA CAWOTTE choisi par Mathieu le 20/11
   (ILE-DONJON.md) : au milieu de l'ile, la tour du Docteur Wabbenstein, une cawotte geante de cuivre (blender/ile-labo.py -> ile-labo.glb). On debarque
   au ponton ; des camps de Wabbits mutants gardent leur coin et attaquent quiconque y entre (ils rentrent chez eux si on s'eloigne) ; une passerelle en
   spirale monte autour de la tour, on y marche pour de vrai (hauteurSol) ; cinq portes, une par etage, menent chacune a une salle ; une grille ferme la
   passerelle apres chacune des quatre premieres et s'ouvre quand sa salle est nettoyee. La 5e salle : le labo du Docteur. Tout se joue dans un seul
   combat (genre 'donjon'). Les tests se lancent par le bandeau du mode test (bouton « Île des Wabbits »).
   22/11/2026 au soir (« il faudrait faire la tour plus grande et large, les salles plus larges et diversifiees en decoration, preparer la salle du boss,
   et surtout l'exterieur de l'ile : du relief, differentes plantes, differents biomes, terre mer sable arbre, montable, champs de cawotte, mais avec une
   ambiance un peu bizarre », Mathieu) :
   - la tour 1,5 fois plus grande, la passerelle plus large et plus haute (les mesures de LABO suivent blender/ile-labo.py) ;
   - l'ile 2,5 fois plus grande, en RELIEF : hTerrainLabo donne la hauteur du sol partout (le perso et les monstres y marchent, la camera suit), un
     plateau plat autour de la tour, et quatre biomes autour : les CHAMPS de cawottes (devant, cote ponton : champs en terrasses, cawottes geantes mutees,
     epouvantail, clotures, lampadaires verts), la FORET TORDUE (a gauche : arbres blanchis au feuillage sarcelle ou violet, champignons qui luisent dont
     un geant, plantes carnivores, plantes a oeil qui suivent le perso du regard), la BUTTE (derriere : une colline qu'on gravit, rochers, cristaux de
     mutagene, le vieux mat radio au sommet) et le MARAIS (a droite : mares de mutagene qui luisent, roseaux, passerelles de planches, tonneaux qui
     fuient) ; une plage de sable cendre tout autour (os d'un Wabbit geant, bois mort). Les pieces : blender/ile-labo-flore.py ;
   - l'ambiance bizarre : un voile vert-gris et violet sur l'ecran, des spores qui flottent, des nappes de brume, les lueurs qui respirent ;
   - les salles plus grandes, chacune son decor (blender/ile-labo-salles.py), et la salle du boss preparee (une arene ronde, sa grande cuve, ses bobines
     qui crepitent, son pupitre). Les salles sont au niveau du sol (y = 0), loin de l'ile : les effets des combats s'y dessinent a la bonne hauteur. */
const DONJON = new T.Vector3(0, 0, -300);
/* la passerelle : les memes mesures que blender/ile-labo.py (RAMPE) ; une spirale de A0 sur TOURS tours, de 0 a H, entre R_IN et R_OUT */
const LABO = { A0: -0.55, TOURS: 2.0, H: 21.0, R_IN: 7.65, R_OUT: 10.85, PORTES: [3.4, 7.4, 11.4, 15.4, 19.0], GRILLE_APRES: 0.42, PALIER: 0.22, ECH: 1.5 };
LABO.DA = LABO.TOURS * Math.PI * 2; LABO.K = LABO.H / LABO.DA;
const TAU_L = Math.PI * 2, hautRampe = (t) => Math.max(0, Math.min(LABO.H, (t - LABO.A0) * LABO.K)), angleRampe = (h) => LABO.A0 + h / LABO.K;
const lisse01 = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const polL = (a, r) => ({ x: Math.cos(a) * r, z: Math.sin(a) * r });
const rIle = (a) => 52 + 2.6 * Math.sin(3 * a + 0.5) + 1.8 * Math.sin(5 * a + 1.3) + 1.0 * Math.sin(8 * a + 2.1); /* (le bord de l'eau) */
const angDiff = (a, b) => { let d = (a - b) % TAU_L; if (d > Math.PI) d -= TAU_L; if (d < -Math.PI) d += TAU_L; return d; };
/* le ponton : le long du rayon a l'angle a, de r0 a r0 + L (le modele Fl_ponton va de 0 a 7,2 vers +x) */
const DOCK_LABO = { a: 0.62, L: 7.2, w: 0.95 }; DOCK_LABO.r0 = rIle(DOCK_LABO.a) - 2.2; DOCK_LABO.c = Math.cos(DOCK_LABO.a); DOCK_LABO.s = Math.sin(DOCK_LABO.a);
const surPontonL = (lx, lz, m) => { const D = DOCK_LABO, u = lx * D.c + lz * D.s - D.r0, v = -lx * D.s + lz * D.c; return u >= 0 && u <= D.L - m && Math.abs(v) <= D.w - m * 0.5; };
const versDock = (u, v) => ({ x: DOCK_LABO.c * (DOCK_LABO.r0 + u) - DOCK_LABO.s * v, z: DOCK_LABO.s * (DOCK_LABO.r0 + u) + DOCK_LABO.c * v }); /* (u le long du ponton, v en travers) */
const leLongDuChemin = (s, l) => ({ x: DOCK_LABO.c * s - DOCK_LABO.s * l, z: DOCK_LABO.s * s + DOCK_LABO.c * l }); /* (s depuis le centre, dans l'axe du ponton ; l sur le cote) */
/* ---------- les biomes ---------- */
const BUTTE_LABO = Object.assign(polL(4.4, 33), { h: 8.5, s: 9.5 }); /* (derriere a droite : pile derriere la tour, vue de la camera de depart, elle etait cachee) */
const MARES_LABO = [[5.2, 28, 3.0], [5.5, 32.5, 4.0], [5.1, 36.5, 2.6], [5.85, 29, 2.4], [5.45, 40.5, 3.0], [5.75, 36.5, 2.0]].map(([a, r, R]) => Object.assign(polL(a, r), { R }));
const CHAMPS_LABO = [[27, 7.2], [35, 8.2], [27, -7.2], [36, -8.6], [40, 7.6]].map(([s, l]) => Object.assign(leLongDuChemin(s, l), { a: DOCK_LABO.a, hl: 4.4, hw: 3.4 }));
/* les camps des mutants : r, leur perimetre */
const CAMPS_LABO = [
/* (24/11/2026, les mutants du labo, 27n-mutants-labo.js : les Wabbits du jeu verdis laissent la place aux gardes lapins-machines et aux mutants ; un 3e terme
   'chef' : le mini-boss du camp, plus grand et bien plus fort, et son coffre a sa mort, « des endroits de mini-boss ou on gagne des recompenses exceptionnelles », Mathieu) */
  Object.assign(leLongDuChemin(33, 0), { nom: 'le champ de cawottes', r: 5.5, L: [['wabEnrage', 3], ['wabGarde', 1]] }),
  Object.assign(polL(2.2, 27), { nom: 'la lisière de la forêt', r: 6, L: [['wabFluo', 2], ['wabVampire', 2]] }),
  Object.assign(polL(5.35, 22.5), { nom: 'le marais', r: 6, L: [['wabFluo', 3], ['wabEnrage', 1]] }),
  Object.assign(polL(0.3, 14.8), { nom: 'le pied de la tour', r: 5, L: [['wabGarde', 1, 'chef'], ['wabGarde', 2], ['wabGreffe', 1]] }),
  Object.assign({ x: BUTTE_LABO.x, z: BUTTE_LABO.z }, { nom: 'le sommet de la butte', r: 5.5, L: [['wabGarou', 1, 'chef'], ['wabEnrage', 2]] })];
/* les chemins (seulement la couleur du sol) */
const CHEMINS_LABO = [
  [[49, 0], [44, 0.8], [38, -0.5], [31, 0.4], [24, -0.3], [17, 0]].map(([s, l]) => leLongDuChemin(s, l)),
  [[1.75, 17], [1.95, 22], [2.2, 27], [2.3, 31], [2.45, 35.5]].map(([a, r]) => polL(a, r)),
  [[3.65, 17], [3.9, 22], [4.4, 23.5], [4.8, 26], [4.9, 31], [4.7, 36], [4.3, 37.5], [4.1, 34], [4.4, 33]].map(([a, r]) => polL(a, r)),
  [[5.9, 17], [5.6, 20], [5.35, 22.5], [5.33, 27.5], [5.36, 31]].map(([a, r]) => polL(a, r)),
  Array.from({ length: 25 }, (_, k) => polL(k / 24 * TAU_L, 16.6))];
const dSeg = (x, z, a, b) => { const dx = b.x - a.x, dz = b.z - a.z, L = dx * dx + dz * dz, t = L ? Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L)) : 0; return Math.hypot(x - a.x - dx * t, z - a.z - dz * t); };
const dChemin = (x, z) => { let d = 1e9; CHEMINS_LABO.forEach((C) => { for (let i = 1; i < C.length; i++) d = Math.min(d, dSeg(x, z, C[i - 1], C[i])); }); return d; };
const bruitL = (x, z) => [Math.sin(0.13 * x + 0.4) * Math.cos(0.11 * z - 0.8), 0.6 * Math.sin(0.21 * x + 0.17 * z + 1.1) + 0.4 * Math.sin(0.29 * z - 0.08 * x + 2.3), Math.sin(0.47 * x + 0.3) * Math.sin(0.43 * z + 1.7)];
const poidsBiomes = (a) => { const w = (c, l) => Math.exp(-Math.pow(angDiff(a, c) / l, 2)); return [w(0.75, 0.8), w(2.35, 0.75), w(4.4, 0.65), w(5.5, 0.7)]; }; /* (champs, foret, butte, marais) */
/* LE RELIEF : la hauteur brute (biomes, butte, mares), puis le plateau de la tour, les replats (champs, camps, sommet) et la plage */
function hBrutLabo(x, z) {
  const a = Math.atan2(z, x), [n1, n2, n3] = bruitL(x, z), [wc, wf, wb, wm] = poidsBiomes(a), S = wc + wf + wb + wm + 0.15;
  let h = (wc * (0.35 + 0.25 * n1) + wf * (1.0 + 0.9 * n2 + 0.5 * n3) + wb * (0.8 + 0.6 * n2) + wm * (0.05 + 0.12 * n1) + 0.15 * (0.4 + 0.3 * n2)) / S;
  const db = Math.hypot(x - BUTTE_LABO.x, z - BUTTE_LABO.z); h += BUTTE_LABO.h * Math.exp(-db * db / (2 * BUTTE_LABO.s * BUTTE_LABO.s));
  for (const M of MARES_LABO) { const d = Math.hypot(x - M.x, z - M.z); if (d < M.R + 1.6) h -= 1.0 * lisse01((M.R + 1.6 - d) / 2.4); }
  return h * lisse01((Math.hypot(x, z) - 18) / 7);
}
const APLATS_LABO = []; /* (rempli plus bas : { k(x, z) de 0 a 1, h } */
function hTerrainLabo(x, z) { /* (en coordonnees de l'ile) */
  const r = Math.hypot(x, z); if (r < 18) return 0;
  let h = hBrutLabo(x, z);
  for (const F of APLATS_LABO) { const k = F.k(x, z); if (k > 0) h += (F.h - h) * k; }
  const s = rIle(Math.atan2(z, x)) - r; if (s < 7) { h = -0.25 + (h + 0.25) * lisse01((s - 1.5) / 5.5); if (s < 1.5) h = -1.6 + 1.35 * lisse01((s + 3) / 4.5); }
  return h;
}
{ const plat = (x, z, R, w, h) => APLATS_LABO.push({ h, k: (px, pz) => lisse01((R + w - Math.hypot(px - x, pz - z)) / w) });
  CHAMPS_LABO.forEach((F) => { const c = Math.cos(F.a), s = Math.sin(F.a), h = hBrutLabo(F.x, F.z); APLATS_LABO.push({ h, k: (px, pz) => { const u = (px - F.x) * c + (pz - F.z) * s, v = -(px - F.x) * s + (pz - F.z) * c, d = Math.hypot(Math.max(0, Math.abs(u) - F.hl), Math.max(0, Math.abs(v) - F.hw)); return lisse01(1 - d / 2.2); } }); });
  CAMPS_LABO.forEach((K, k) => { if (k === 4) return; plat(K.x, K.z, K.r * 0.8, 3.0, hBrutLabo(K.x, K.z)); });
  { const B = BUTTE_LABO, hs = hBrutLabo(B.x + 3.5, B.z); plat(B.x, B.z, 5.0, 4.0, hs); }
}
/* LES OBSTACLES : arbres, rochers, cages, mares... rangés par cases de 8 (on ne teste que ceux de la case ou l'on est) */
const BLOCS_LABO = new Map(), CASE_BL = 8;
function ajouterBlocLabo(x, z, r) { const o = { x, z, r }, m = r + 1.6; for (let i = Math.floor((x - m) / CASE_BL); i <= Math.floor((x + m) / CASE_BL); i++) for (let j = Math.floor((z - m) / CASE_BL); j <= Math.floor((z + m) / CASE_BL); j++) { const k = i + ',' + j; if (!BLOCS_LABO.has(k)) BLOCS_LABO.set(k, []); BLOCS_LABO.get(k).push(o); } }
const blocsLabo = (x, z) => BLOCS_LABO.get(Math.floor(x / CASE_BL) + ',' + Math.floor(z / CASE_BL)) || [];
MARES_LABO.forEach((M) => ajouterBlocLabo(M.x, M.z, M.R - 0.4));
ajouterBlocLabo(Math.cos(2.6) * 12.05, Math.sin(2.6) * 12.05, 1.5); /* (la pompe du gros tuyau) */
const repousser = (x, z, L, m) => { for (let n = 0; n < 2; n++) for (const o of L) { const dx = x - o.x, dz = z - o.z, dd = Math.hypot(dx, dz), Rb = o.r + m; if (dd >= Rb) continue; if (dd < 0.001) { x = o.x + Rb; continue; } const ux = dx / dd, uz = dz / dd, c = 0.94, s = 0.34; x = o.x + (ux * c - uz * s) * Rb; z = o.z + (ux * s + uz * c) * Rb; } return [x, z]; }; /* (repousse un peu de biais : on glisse autour de l'obstacle au lieu d'y rester colle quand on arrive en plein dessus) */
/* LES SALLES INTERIEURES : on passe la porte, on est dans la salle (une piece ronde au niveau du sol, loin de l'ile : x, z locaux) ; ses mutants
   l'attendent ; nettoyee, une sortie verte s'allume contre la porte : elle ramene sur la passerelle et ouvre la grille. La 5e, le labo : le Docteur
   Wabbenstein ; il tombe, fin du donjon. theme : le decor (Salle_<theme> dans ile-labo-salles.glb ; R comme dans blender/ile-labo-salles.py) */
const Y_SALLE = 0;
const SALLES_LABO = [
  /* (24/11/2026, les mutants du labo : un mutant par salle, celui de son theme valide le 20/11 ; a mi-chemin, son specimen brise sa cuve et s'en echappe, specimenLabo) */
  { nom: 'les cages', theme: 'cages', x: -220, z: -400, R: 13, L: [['wabEnrage', 5]] },
  { nom: 'la serre à mutagène', theme: 'serre', x: -110, z: -400, R: 13, L: [['wabFluo', 4], ['wabEnrage', 1]] },
  { nom: 'la salle de chirurgie', theme: 'chirurgie', x: 0, z: -400, R: 12.5, L: [['wabGreffe', 3], ['wabGarde', 1]] },
  { nom: 'la salle des cuves', theme: 'cuves', x: 110, z: -400, R: 13.5, L: [['wabVampire', 4]] },
  { nom: 'le labo du Docteur Wabbenstein', theme: 'labo', x: 220, z: -400, R: 18, L: [['wabbenstein', 1]] }];
const ENTREE_SALLE = Math.PI / 4; /* (l'entree de chaque salle : du cote de la camera de depart, la salle s'etend derriere) */
let ileWabbits = null, donjonEtat = null, donjonEntite = null;
/* jusqu'ou monte la passerelle : la premiere grille fermee */
function rampeMax() { const E = donjonEtat; for (let i = 0; i < 4; i++) if (!(E && E.grilles && E.grilles[i])) return angleRampe(LABO.PORTES[i]) + LABO.GRILLE_APRES - 0.12; return LABO.A0 + LABO.DA + LABO.PALIER; }
const etatPerso = () => (donjonEtat ? donjonEtat.perso : (bornerDonjon.libre || (bornerDonjon.libre = { mode: 'sol', theta: LABO.A0 })));
/* LE SOL ET LA PASSERELLE : ou l'on peut se tenir. E (l'etat de celui qui bouge : le perso, ou un monstre) dit s'il est au sol, sur la passerelle ou dans
   une salle, et a quel angle deroule (la spirale passe deux fois au-dessus du meme point : c'est l'angle deroule qui dit sur quel tour on est) */
function bornerDonjon(x, z, m, E) {
  m = m == null ? 0.4 : m; E = E || etatPerso(); let lx = x - DONJON.x, lz = z - DONJON.z, r = Math.hypot(lx, lz), a = Math.atan2(lz, lx);
  if (E.mode === 'salle') { /* (dans une salle : son cercle, et ses meubles) */
    const S = SALLES_LABO[E.i]; let sx = lx - S.x, sz = lz - S.z; const d = Math.hypot(sx, sz), R = S.R - 0.7 - m; if (d > R) { sx *= R / d; sz *= R / d; }
    [sx, sz] = repousser(sx, sz, S.blocs || [], m); return [DONJON.x + S.x + sx, DONJON.z + S.z + sz]; }
  if (E.mode === 'rampe') {
    let t = a + TAU_L * Math.round((E.theta - a) / TAU_L);
    if (t >= LABO.A0 - 0.02) { t = Math.min(t, rampeMax()); const rr = Math.max(LABO.R_IN + m, Math.min(LABO.R_OUT - m, r)); E.theta = t; return [DONJON.x + rr * Math.cos(t), DONJON.z + rr * Math.sin(t)]; }
    E.mode = 'sol'; /* (redescendu par le bas de la passerelle) */
  }
  const d = angDiff(a, LABO.A0);
  if (r < LABO.R_OUT + m) {
    if (d > 0 && d < 0.3 && r >= LABO.R_IN + m * 0.5 && r <= LABO.R_OUT) { E.mode = 'rampe'; E.theta = LABO.A0 + d; return [x, z]; } /* (le pied de la passerelle) */
    if (d >= -0.6 && d <= 0) { if (r < LABO.R_IN + m) { const k = (LABO.R_IN + m) / (r || 1); lx *= k; lz *= k; } } /* (le petit coin devant le pied de la passerelle) */
    else { const k = (LABO.R_OUT + m) / (r || 1); lx *= k; lz *= k; }
  }
  r = Math.hypot(lx, lz); a = Math.atan2(lz, lx); const R = rIle(a) - 1.0 - m;
  if (r > R && !surPontonL(lx, lz, m)) { /* (le bord de l'eau ; sur le ponton, on reste sur les planches) */
    const D = DOCK_LABO, u = lx * D.c + lz * D.s - D.r0, v = -lx * D.s + lz * D.c;
    if (u > -0.5 && Math.abs(v) < D.w + 0.6) { const vv = Math.max(-D.w + m * 0.5, Math.min(D.w - m * 0.5, v)), uu = Math.min(u, D.L - m); lx = D.c * (D.r0 + uu) - D.s * vv; lz = D.s * (D.r0 + uu) + D.c * vv; }
    else { const k = R / r; lx *= k; lz *= k; } }
  [lx, lz] = repousser(lx, lz, blocsLabo(lx, lz), m);
  return [lx + DONJON.x, lz + DONJON.z];
}
const dansDonjon = (x, z, m) => { /* (un point ou l'on peut se tenir : dans la salle ou est le perso, ou sur l'ile) */
  const P = etatPerso(), lx = x - DONJON.x, lz = z - DONJON.z;
  if (P.mode === 'salle') { const S = SALLES_LABO[P.i], q = bornerDonjon(x, z, m, { mode: 'salle', i: P.i }); return Math.hypot(lx - S.x, lz - S.z) < S.R - 0.6 && Math.hypot(q[0] - x, q[1] - z) < 0.05; }
  const r = Math.hypot(lx, lz); if (r >= LABO.R_IN && r <= LABO.R_OUT) return true; const E = { mode: 'sol', theta: LABO.A0 }, q = bornerDonjon(x, z, m, E); return E.mode === 'sol' && Math.hypot(q[0] - x, q[1] - z) < 0.05; };
/* la hauteur du sol : la passerelle pour qui est dessus (le perso, ou le monstre qu'on est en train de bouger), la salle, le ponton, sinon le relief */
const hauteurSolDonjon0 = hauteurSol;
hauteurSol = function (x, z) {
  if (lieu !== 'donjon' || !ileWabbits) return hauteurSolDonjon0.apply(this, arguments);
  const E = donjonEntite ? donjonEntite.lab : etatPerso(); if (E && E.mode === 'salle') return Y_SALLE; if (E && E.mode === 'rampe') { const a = Math.atan2(z - DONJON.z, x - DONJON.x); return hautRampe(Math.min(a + TAU_L * Math.round((E.theta - a) / TAU_L), rampeMax())); }
  const lx = x - DONJON.x, lz = z - DONJON.z; return surPontonL(lx, lz, 0) ? Math.max(-0.06, hTerrainLabo(lx, lz)) : hTerrainLabo(lx, lz);
};
const majMonstreDonjon0 = majMonstre; majMonstre = function (mo) { if (lieu !== 'donjon') return majMonstreDonjon0.apply(this, arguments); donjonEntite = mo; try { return majMonstreDonjon0.apply(this, arguments); } finally { donjonEntite = null; } };
/* UN CLIC : sur la passerelle, le chemin suit la spirale (en ligne droite, on butait contre la tour) */
function cheminDonjon(p) {
  if (etatPerso().mode === 'salle') { const [x, z] = bornerDonjon(p.x, p.z); return [{ c: paysanMesh.userData.cellule, x, z }]; }
  const E = etatPerso(), pp = paysanMesh.position, lx = p.x - DONJON.x, lz = p.z - DONJON.z, r = Math.hypot(lx, lz), a = Math.atan2(lz, lx), surRampe = r >= LABO.R_IN - 0.2 && r <= LABO.R_OUT + 0.2 && p.y > 0.25;
  const pts = []; const spirale = (t0, t1, rr) => { const n = Math.max(1, Math.ceil(Math.abs(t1 - t0) / 0.25)); for (let k = 1; k <= n; k++) { const t = t0 + (t1 - t0) * k / n; pts.push({ x: DONJON.x + rr * Math.cos(t), z: DONJON.z + rr * Math.sin(t) }); } };
  const rm = (LABO.R_IN + LABO.R_OUT) / 2;
  if (surRampe) { /* l'angle deroule vise : celui dont la hauteur colle au point touche */
    let tv = a + TAU_L * Math.round((angleRampe(Math.max(0, p.y - 0.05)) - a) / TAU_L); tv = Math.max(LABO.A0 + 0.05, Math.min(rampeMax(), tv));
    if (E.mode === 'rampe') spirale(E.theta, tv, rm);
    else { const d0 = { x: DONJON.x + rm * Math.cos(LABO.A0 - 0.3), z: DONJON.z + rm * Math.sin(LABO.A0 - 0.3) }, R0 = LABO.R_OUT + 1.2, ap = Math.atan2(pp.z - DONJON.z, pp.x - DONJON.x);
      if (Math.hypot(pp.x - DONJON.x, pp.z - DONJON.z) > LABO.R_OUT) { const t0 = ap + angDiff(LABO.A0 - 0.3, ap); spirale(ap, t0, Math.max(R0, Math.min(17, Math.hypot(pp.x - DONJON.x, pp.z - DONJON.z)))); }
      pts.push(d0); spirale(LABO.A0 - 0.3, tv, rm); }
  } else if (E.mode === 'rampe') { spirale(E.theta, LABO.A0 - 0.3, rm); pts.push({ x: DONJON.x + (LABO.R_OUT + 1.2) * Math.cos(LABO.A0 - 0.45), z: DONJON.z + (LABO.R_OUT + 1.2) * Math.sin(LABO.A0 - 0.45) }); const [x, z] = bornerDonjon(p.x, p.z, 0.4, { mode: 'sol', theta: LABO.A0 }); pts.push({ x, z }); }
  else { /* au sol, de l'autre cote de la tour : on la contourne */
    const ap = Math.atan2(pp.z - DONJON.z, pp.x - DONJON.x), [x, z] = bornerDonjon(p.x, p.z, 0.4, { mode: 'sol', theta: LABO.A0 }), at = Math.atan2(z - DONJON.z, x - DONJON.x), rp = Math.hypot(pp.x - DONJON.x, pp.z - DONJON.z);
    const coupe = Math.abs(angDiff(at, ap)) > 1.0 && Math.min(rp, Math.hypot(x - DONJON.x, z - DONJON.z)) < 20; if (coupe) spirale(ap, ap + angDiff(at, ap), Math.max(LABO.R_OUT + 1.6, Math.min(rp, 16))); pts.push({ x, z }); }
  return pts.map((q) => ({ c: paysanMesh.userData.cellule, x: q.x, z: q.z }));
}
/* ---------- la carte ---------- */
const SC_FLORE = new Set(['feuille', 'tige', 'brin', 'fil_cosse', 'strie', 'rivet', 'sillon', 'veine', 'treillis', 'hauban', 'cage_barreau', 'fil', 'chaine', 'corde', 'antenne', 'pupilleO', 'iris', 'reflet', 'dent', 'cawotte_strie', 'massette', 'bouton', 'cercle', 'volant', 'cage', 'piquet', 'lisse', 'planche', 'caisse_planche', 'caisse_coin', 'poutre']);
/* la couleur du sol, point par point : le biome, la pente (la roche), les chemins, la plage, le plateau */
function couleurLabo(x, z, h, ny, C) {
  const r = Math.hypot(x, z), a = Math.atan2(z, x), [n1, n2, n3] = bruitL(x, z), [wc, wf, wb, wm] = poidsBiomes(a), S = wc + wf + wb + wm + 0.15, v = 0.5 + 0.5 * n3;
  const mix = (c, d, k) => [c[0] + (d[0] - c[0]) * k, c[1] + (d[1] - c[1]) * k, c[2] + (d[2] - c[2]) * k];
  const hx = (s) => [parseInt(s.slice(1, 3), 16) / 255, parseInt(s.slice(3, 5), 16) / 255, parseInt(s.slice(5, 7), 16) / 255];
  const P = couleurLabo.P || (couleurLabo.P = { herbe: hx('#8c9c58'), herbeC: hx('#a0a862'), herbeF: hx('#78874b'), mousse: hx('#7c7190'), foret: hx('#606d4b'), foretV: hx('#6a5c86'), champs: hx('#8c7c54'),
    butte: hx('#9a9d6b'), roche: hx('#8e889a'), rocheF: hx('#736e80'), marais: hx('#5e5b42'), vase: hx('#4d5e36'), sable: hx('#dad1b4'), sableM: hx('#b6ad92'), plateau: hx('#898372'), plateauF: hx('#716c5c'), chemin: hx('#ab946e'), cheminF: hx('#957d5a') });
  let c = [0, 0, 0]; const add = (col, w) => { c[0] += col[0] * w; c[1] += col[1] * w; c[2] += col[2] * w; };
  add(mix(P.herbe, n1 > 0 ? P.herbeC : P.herbeF, Math.abs(n1) * 0.7), wc * 0.5 + 0.15); add(P.champs, wc * 0.5);
  add(mix(P.foret, P.foretV, v * 0.8), wf); add(mix(P.butte, P.herbeF, 0.5 + 0.5 * n2), wb); add(mix(P.marais, P.vase, v), wm); c = c.map((q) => q / S);
  if (n3 > 0.55 && wm < 0.5) c = mix(c, P.mousse, Math.min(1, (n3 - 0.55) * 3) * 0.7); /* (des plaques de mousse violette) */
  const db = Math.hypot(x - BUTTE_LABO.x, z - BUTTE_LABO.z); if (db < 16) { const k = Math.max(lisse01((0.92 - ny) / 0.12), lisse01((h - 6.4) / 1.2) * 0.6); c = mix(c, mix(P.roche, P.rocheF, v), k); }
  for (const M of MARES_LABO) { const d = Math.hypot(x - M.x, z - M.z); if (d < M.R + 2.2) c = mix(c, P.vase, lisse01((M.R + 2.2 - d) / 1.6)); }
  if (r < 21) c = mix(c, mix(P.plateau, P.plateauF, v * v), lisse01((21 - r) / 3));
  const dc = dChemin(x, z); if (dc < 1.6) c = mix(c, mix(P.chemin, P.cheminF, v), lisse01((1.6 - dc) / 0.7) * 0.85);
  const s = rIle(a) - r; if (s < 7.5) c = mix(c, s < 2.2 ? mix(P.sable, P.sableM, lisse01((2.2 - s) / 1.4)) : mix(P.sable, [0.78, 0.74, 0.62], v * 0.4), lisse01((7.5 - s) / 2.2));
  C[0] = c[0]; C[1] = c[1]; C[2] = c[2];
}
/* le sol : une grille de 1 en relief, coloree point par point (sRGB -> lineaire pour la couleur des sommets) */
function solLabo() {
  const N = 132, geo = new T.PlaneGeometry(N, N, N, N); geo.rotateX(-Math.PI / 2); const P = geo.attributes.position, n = P.count;
  for (let i = 0; i < n; i++) P.setY(i, hTerrainLabo(P.getX(i), P.getZ(i)));
  geo.computeVertexNormals(); const No = geo.attributes.normal, col = new Float32Array(n * 3), C = [0, 0, 0], cc = new T.Color();
  for (let i = 0; i < n; i++) { couleurLabo(P.getX(i), P.getZ(i), P.getY(i), No.getY(i), C); cc.setRGB(C[0], C[1], C[2]).convertSRGBToLinear(); col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b; }
  geo.setAttribute('color', new T.BufferAttribute(col, 3));
  const m = new T.Mesh(geo, new T.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: grad })); m.receiveShadow = true; m.name = 'sol_labo'; return m;
}
/* LES PIECES DU DEHORS : la liste (nom de la piece, x, z, rotation, echelle) tiree une fois pour toutes (toujours la meme ile) ; les obstacles notes au passage */
function placerFloreLabo() {
  const L = []; let gr = 20261122; const rnd = () => (gr = (gr * 16807) % 2147483647) / 2147483647;
  const occupe = []; /* (les gros objets : on ne pose rien dessus) */
  const loin = (x, z, d) => occupe.every((o) => Math.hypot(o.x - x, o.z - z) >= d + o.r);
  const sDe = (x, z) => rIle(Math.atan2(z, x)) - Math.hypot(x, z);
  const dansChamp = (x, z, m) => CHAMPS_LABO.some((F) => { const c = Math.cos(F.a), s = Math.sin(F.a), u = (x - F.x) * c + (z - F.z) * s, v = -(x - F.x) * s + (z - F.z) * c; return Math.abs(u) < F.hl + m && Math.abs(v) < F.hw + m; });
  const dansCamp = (x, z, m) => CAMPS_LABO.some((K) => Math.hypot(x - K.x, z - K.z) < K.r * 0.75 + m);
  const dansMare = (x, z, m) => MARES_LABO.some((M) => Math.hypot(x - M.x, z - M.z) < M.R + m);
  const presDuPonton = (x, z) => { const D = DOCK_LABO, u = x * D.c + z * D.s - D.r0, v = -x * D.s + z * D.c; return u > -5 && u < D.L + 2 && Math.abs(v) < 3.6; };
  const libre = (x, z, o) => { o = o || {}; const r = Math.hypot(x, z); return r > (o.rMin || 19) && !presDuPonton(x, z) && sDe(x, z) > (o.sMin == null ? 7.5 : o.sMin) && dChemin(x, z) > (o.chemin == null ? 1.8 : o.chemin) && !dansChamp(x, z, o.champ == null ? 1.0 : o.champ) && !dansCamp(x, z, o.camp == null ? 1.5 : o.camp) && !dansMare(x, z, o.mare == null ? 0.8 : o.mare) && loin(x, z, o.ecart == null ? 0.6 : o.ecart); };
  const poser = (p, x, z, o) => { o = o || {}; const P = { p, x, z, ry: o.ry == null ? rnd() * TAU_L : o.ry, s: o.s || 1, dy: o.dy || 0 }; L.push(P); if (o.bloc) ajouterBlocLabo(x, z, o.bloc * P.s); if (o.gros) occupe.push({ x, z, r: o.gros * P.s }); return P; };
  const semer = (n, a0, a1, r0, r1, f) => { for (let k = 0, m = 0; m < n && k < n * 40; k++) { const a = a0 + (a1 - a0) * rnd(), r = Math.sqrt(r0 * r0 + (r1 * r1 - r0 * r0) * rnd()), x = Math.cos(a) * r, z = Math.sin(a) * r; if (f(x, z, a, r)) m++; } };
  const choisir = (T_) => T_[Math.floor(rnd() * T_.length)];
  /* le ponton */
  { const q = versDock(0, 0); poser('ponton', q.x, q.z, { ry: -DOCK_LABO.a, dy: 0 }); }
  /* LES CHAMPS : sillons, cawottes en rangs (quelques violettes, quelques fanees), clotures, cawottes geantes, epouvantail, caisses, lampadaires */
  CHAMPS_LABO.forEach((F, fi) => { const c = Math.cos(F.a), s = Math.sin(F.a), en = (u, v) => ({ x: F.x + c * u - s * v, z: F.z + s * u + c * v });
    poser('sillons', F.x, F.z, { ry: -F.a });
    for (let k = 0; k < 6; k++) for (let j = 0; j < 8; j++) { if (fi === 1 && k >= 2 && k <= 3 && j >= 3 && j <= 4) continue; const q = en(-3.5 + j + (rnd() - 0.5) * 0.15, -2.5 + k); const t = rnd(); poser(t < 0.13 ? 'cawotte_morte' : t < 0.26 ? 'cawotte_v' : 'cawotte', q.x, q.z, { s: 0.9 + rnd() * 0.3 }); }
    for (let k = -2; k <= 2; k++) { if ((k + fi) % 4 === 0) continue; const q = en(k * 2.05, F.hw + 0.35), q2 = en(k * 2.05, -F.hw - 0.35); if (fi % 2 === 0) poser('cloture', q.x, q.z, { ry: -F.a + (rnd() - 0.5) * 0.12 }); else poser('cloture', q2.x, q2.z, { ry: -F.a + (rnd() - 0.5) * 0.12 }); } });
  { const F = CHAMPS_LABO[1], q = { x: F.x, z: F.z }; poser('cawotte_geante', q.x, q.z, { ry: 0.6, s: 1.15, bloc: 1.4, gros: 2.2 }); } /* (la geante qui a creve le champ) */
  [leLongDuChemin(30.5, 12.8), leLongDuChemin(41, -12), leLongDuChemin(21.5, 13.5)].forEach((q, k) => poser('cawotte_geante', q.x, q.z, { ry: 1.7 + k * 2.1, s: 0.85 + k * 0.15, bloc: 1.4, gros: 2.2 }));
  { const q = leLongDuChemin(31, 3.4); poser('epouvantail', q.x, q.z, { ry: -DOCK_LABO.a + Math.PI / 2 + 0.3, bloc: 0.35, gros: 0.6 }); }
  { const q = leLongDuChemin(23.5, -4.2); poser('caisse_cawottes', q.x, q.z, { ry: 0.4, bloc: 0.7, gros: 0.9 }); const q2 = leLongDuChemin(24.6, -4.8); poser('caisse_p', q2.x, q2.z, { ry: 0.9, bloc: 0.55, gros: 0.7 }); }
  const tuyau = (q, ry) => { poser('tuyau_sol', q.x, q.z, { ry, gros: 1.8 }); for (const k of [-1.5, 1.5]) ajouterBlocLabo(q.x + Math.cos(ry) * k, q.z - Math.sin(ry) * k, 0.35); }; /* (ses deux pieds : l'axe x du modele, tourne de ry) */
  tuyau(leLongDuChemin(38.5, 3.6), -DOCK_LABO.a + Math.PI / 2);
  [[46.5, 2.3], [40, -2.2], [33.5, 2.3], [27, -2.2], [20.5, 2.3]].forEach(([s, l]) => { const q = leLongDuChemin(s, l); poser('lampadaire', q.x, q.z, { ry: -DOCK_LABO.a + (l > 0 ? -Math.PI / 2 : Math.PI / 2) + Math.PI, bloc: 0.25, gros: 0.4 }); });
  { const q = leLongDuChemin(47.5, -2.6); poser('panneau', q.x, q.z, { ry: -DOCK_LABO.a + Math.PI / 2, gros: 0.3 }); }
  [leLongDuChemin(44, 4.5), leLongDuChemin(29.5, -12.5)].forEach((q, k) => poser(k ? 'tonneau_couche' : 'tonneau', q.x, q.z, { bloc: 0.45, gros: 0.8 }));
  semer(60, 0.05, 1.45, 20, 50, (x, z) => { if (!libre(x, z, { chemin: 1.2, sMin: 6.5, ecart: 0.2 })) return false; poser(rnd() < 0.7 ? 'touffe' : 'touffe_v', x, z, { s: 0.8 + rnd() * 0.6 }); return true; });
  /* LA FORET TORDUE */
  semer(34, 1.55, 3.4, 20, 46, (x, z) => { if (!libre(x, z, { ecart: 4.4, chemin: 3.0, camp: 3.0, sMin: 9 })) return false; const t = rnd(); poser(t < 0.84 ? choisir(['arbre_1', 'arbre_2', 'arbre_3', 'arbre_2']) : choisir(['arbre_mort_1', 'arbre_mort_2']), x, z, { s: 0.75 + rnd() * 0.32, bloc: 0.5, gros: 1.2 }); return true; });
  { const q = polL(2.5, 36.5); poser('champi_geant', q.x, q.z, { s: 1.1, bloc: 0.75, gros: 2.0 }); const q2 = polL(1.85, 42); poser('champi_geant', q2.x, q2.z, { s: 0.8, ry: 2.0, bloc: 0.6, gros: 1.6 }); }
  semer(5, 1.6, 3.2, 22, 46, (x, z) => { if (!libre(x, z, { ecart: 1.4, chemin: 2.2 })) return false; poser('racines', x, z, { s: 0.9 + rnd() * 0.4, gros: 2.0 }); return true; });
  semer(22, 1.55, 3.25, 20, 48, (x, z) => { if (!libre(x, z, { ecart: 0.6, chemin: 1.4 })) return false; poser(rnd() < 0.5 ? 'champis_1' : 'champis_2', x, z, { s: 0.8 + rnd() * 0.6, gros: 0.6 }); return true; });
  semer(30, 1.55, 3.25, 20, 48, (x, z) => { if (!libre(x, z, { ecart: 0.3, chemin: 1.2 })) return false; poser(rnd() < 0.6 ? 'fougere' : 'fougere_v', x, z, { s: 0.9 + rnd() * 0.7 }); return true; });
  semer(18, 1.55, 3.25, 20, 48, (x, z) => { if (!libre(x, z, { ecart: 0.4, chemin: 1.6 })) return false; poser(rnd() < 0.55 ? 'buisson_v' : 'buisson_s', x, z, { s: 0.8 + rnd() * 0.6, gros: 0.7 }); return true; });
  semer(7, 1.6, 3.2, 21, 46, (x, z) => { if (!libre(x, z, { ecart: 0.8, chemin: 1.8 })) return false; poser('carnivore', x, z, { s: 0.9 + rnd() * 0.5, bloc: 0.3, gros: 0.6 }); return true; });
  semer(12, 1.6, 3.2, 21, 46, (x, z) => { if (!libre(x, z, { ecart: 0.4, chemin: 1.4 })) return false; poser(rnd() < 0.5 ? 'bulbe_c' : 'bulbe_v', x, z, { s: 0.8 + rnd() * 0.5 }); return true; });
  semer(70, 1.55, 3.25, 20, 50, (x, z) => { if (!libre(x, z, { ecart: 0.2, chemin: 1.0, sMin: 6.5 })) return false; poser(rnd() < 0.6 ? 'touffe_v' : 'touffe', x, z, { s: 0.8 + rnd() * 0.5 }); return true; });
  /* les plantes a oeil (le globe est pose a part : il suit le perso du regard) */
  const yeux = []; semer(9, 1.4, 3.5, 21, 45, (x, z) => { if (!libre(x, z, { ecart: 0.9, chemin: 1.6 })) return false; const P = poser('oeil_tige', x, z, { s: 0.95 + rnd() * 0.35, bloc: 0.3, gros: 0.6 }); yeux.push(P); return true; });
  semer(3, 5.0, 5.9, 22, 44, (x, z) => { if (!libre(x, z, { ecart: 0.9, chemin: 1.6, mare: 1.2 })) return false; const P = poser('oeil_tige', x, z, { s: 1.0 + rnd() * 0.3, bloc: 0.3, gros: 0.6 }); yeux.push(P); return true; });
  /* LA BUTTE : le mat radio au sommet, rochers, cristaux, arbres morts */
  { const B = BUTTE_LABO; poser('mat_radio', B.x - 2.2, B.z - 2.0, { ry: 0.4, bloc: 0.8, gros: 1.5 }); poser('panneau', B.x + 1.4, B.z - 3.2, { ry: 2.2, gros: 0.3 }); }
  /* LES COINS DES MINI-BOSS (24/11/2026, « des endroits de mini-boss », Mathieu) : on les repere de loin. L'antre du Garou alpha, au sommet de la butte : des os de
     proies et des cristaux de mutagene en cercle ; le poste du Chef des gardes, au pied de la tour : caisses, tonneaux et deux lampadaires */
  { const K = CAMPS_LABO[4]; for (let k = 0; k < 7; k++) { const a = k / 7 * TAU_L + 0.3, r = K.r * 0.95; poser(k % 2 ? 'cristaux' : 'os_wabbit', K.x + Math.cos(a) * r, K.z + Math.sin(a) * r, { ry: a, s: k % 2 ? 0.75 : 0.5, bloc: k % 2 ? 0.4 : 0, gros: 0.5 }); } }
  { const K = CAMPS_LABO[3]; [['caisse_cawottes', 0.4], ['caisse_p', 1.3], ['tonneau', 2.4], ['caisse_p', 3.6], ['tonneau_couche', 4.6]].forEach(([p, a]) => poser(p, K.x + Math.cos(a) * K.r * 0.95, K.z + Math.sin(a) * K.r * 0.95, { ry: a * 1.7, bloc: 0.5, gros: 0.7 }));
    [0.9, 4.1].forEach((a) => poser('lampadaire', K.x + Math.cos(a) * (K.r + 0.6), K.z + Math.sin(a) * (K.r + 0.6), { ry: a, gros: 0.4 })); }
  semer(16, 3.65, 5.05, 21, 47, (x, z) => { if (!libre(x, z, { ecart: 1.2, chemin: 2.4, camp: 3 })) return false; const t = choisir(['rochers_1', 'rochers_2', 'rochers_3', 'rochers_1']), s = 0.8 + rnd() * 0.6; poser(t, x, z, { s, bloc: { rochers_1: 1.25, rochers_2: 0.95, rochers_3: 1.7 }[t], gros: { rochers_1: 1.6, rochers_2: 1.2, rochers_3: 2.2 }[t], dy: -0.15 }); return true; });
  semer(7, 3.8, 4.95, 22, 44, (x, z) => { if (!libre(x, z, { ecart: 1.0, chemin: 2.0, camp: 2.5 })) return false; poser('cristaux', x, z, { s: 0.8 + rnd() * 0.6, bloc: 0.85, gros: 1.2, dy: -0.1 }); return true; });
  semer(6, 3.4, 5.0, 22, 46, (x, z) => { if (!libre(x, z, { ecart: 2.0, chemin: 2.2, camp: 2.5 })) return false; poser(rnd() < 0.5 ? 'arbre_mort_1' : 'arbre_mort_2', x, z, { s: 0.8 + rnd() * 0.35, bloc: 0.45, gros: 1.0 }); return true; });
  semer(55, 3.25, 5.0, 20, 50, (x, z) => { if (!libre(x, z, { ecart: 0.2, chemin: 1.1, sMin: 6.5 })) return false; poser(rnd() < 0.7 ? 'touffe' : 'touffe_v', x, z, { s: 0.7 + rnd() * 0.5 }); return true; });
  /* LE MARAIS : roseaux au bord des mares, passerelles, bulbes, tonneaux, arbres morts */
  MARES_LABO.forEach((M, i) => { const n = Math.round(M.R * 2.2); for (let k = 0; k < n; k++) { const a = k / n * TAU_L + rnd() * 0.4, rr = M.R + 0.2 + rnd() * 0.9, x = M.x + Math.cos(a) * rr, z = M.z + Math.sin(a) * rr; if (sDe(x, z) < 6 || dChemin(x, z) < 1.2) continue; poser('roseaux', x, z, { s: 0.7 + rnd() * 0.5 }); }
    if (i % 2 === 0) { const a = rnd() * TAU_L, x = M.x + Math.cos(a) * (M.R - 0.8), z = M.z + Math.sin(a) * (M.R - 0.8); poser('tonneau_couche', x, z, { dy: -0.45, ry: a }); } });
  [[0, 1, 0.5], [1, 4, 0.5], [1, 3, 0.4], [0, 3, 0.55]].forEach(([i, j, t]) => { const A = MARES_LABO[i], B = MARES_LABO[j], x = A.x + (B.x - A.x) * t, z = A.z + (B.z - A.z) * t; poser('passerelle_marais', x, z, { ry: -Math.atan2(B.z - A.z, B.x - A.x), dy: -0.05 }); });
  semer(10, 4.95, 6.05, 21, 46, (x, z) => { if (!libre(x, z, { ecart: 0.5, chemin: 1.4, mare: 0.5 })) return false; poser(rnd() < 0.6 ? 'bulbe_v' : 'bulbe_c', x, z, { s: 0.8 + rnd() * 0.5 }); return true; });
  semer(5, 4.95, 6.05, 22, 46, (x, z) => { if (!libre(x, z, { ecart: 2.0, chemin: 2.0, mare: 1.0 })) return false; poser(rnd() < 0.5 ? 'arbre_mort_2' : 'arbre_mort_1', x, z, { s: 0.8 + rnd() * 0.3, bloc: 0.45, gros: 1.0 }); return true; });
  semer(4, 4.95, 6.05, 21, 44, (x, z) => { if (!libre(x, z, { ecart: 1.0, chemin: 1.8, mare: 0.8 })) return false; poser(rnd() < 0.5 ? 'tonneau' : 'tonneau_couche', x, z, { bloc: 0.45, gros: 0.8 }); return true; });
  semer(3, 4.95, 6.05, 21, 44, (x, z) => { if (!libre(x, z, { ecart: 1.0, chemin: 1.8, mare: 1.0 })) return false; poser('carnivore', x, z, { s: 1.0 + rnd() * 0.4, bloc: 0.3, gros: 0.6 }); return true; });
  tuyau(polL(5.68, 20.5), -5.68);
  semer(55, 4.9, 6.15, 20, 50, (x, z) => { if (!libre(x, z, { ecart: 0.2, chemin: 1.0, sMin: 6.5, mare: 0.3 })) return false; poser(rnd() < 0.5 ? 'touffe' : 'touffe_v', x, z, { s: 0.8 + rnd() * 0.5 }); return true; });
  /* LA PLAGE : les os du Wabbit geant, du bois mort, des rochers, des tonneaux echoues */
  [[2.95, 3.2], [3.75, 3.4]].forEach(([a, s], k) => { const r = rIle(a) - s, q = polL(a, r); poser('os_wabbit', q.x, q.z, { ry: -a + (k ? 2.2 : -1.9), s: 1.0 + k * 0.25, bloc: 1.1, gros: 3.0, dy: -0.2 }); });
  semer(9, 0, TAU_L, 30, 56, (x, z) => { const s = sDe(x, z); if (s < 2.0 || s > 5.5 || !libre(x, z, { sMin: 2.0, ecart: 2.5, rMin: 25, champ: 2 })) return false; poser('bois_mort', x, z, { s: 0.8 + rnd() * 0.5, gros: 1.6, dy: -0.15 }); return true; });
  semer(10, 0, TAU_L, 30, 56, (x, z) => { const s = sDe(x, z); if (s < 1.6 || s > 5.0 || !libre(x, z, { sMin: 1.6, ecart: 2.5, rMin: 25, champ: 2 })) return false; const t = rnd() < 0.5 ? 'rochers_1' : 'rochers_2'; poser(t, x, z, { s: 0.7 + rnd() * 0.5, bloc: t === 'rochers_1' ? 1.25 : 0.95, gros: 1.6, dy: -0.25 }); return true; });
  semer(3, 0, TAU_L, 30, 56, (x, z) => { const s = sDe(x, z); if (s < 2.0 || s > 4.5 || !libre(x, z, { sMin: 2.0, ecart: 3, rMin: 25, champ: 2 })) return false; poser('tonneau_couche', x, z, { bloc: 0.45, gros: 0.9, dy: -0.15 }); return true; });
  /* LE PLATEAU DE LA TOUR : cages et caisses du Docteur, tonneaux, lampadaires sur l'anneau, panneaux */
  [[2.0, 13.6, 0.3, 'cage'], [2.25, 14.6, -0.4, 'cage_ouverte'], [1.75, 15.2, 0.9, 'cage'], [3.6, 13.8, 0.2, 'cage'], [4.4, 14.2, 1.2, 'cage_ouverte']].forEach(([a, r, ry, t]) => { const q = polL(a, r); poser(t, q.x, q.z, { ry, bloc: 0.95, gros: 1.0 }); });
  [[4.9, 13.4, 'caisse'], [5.05, 14.6, 'caisse_p'], [4.98, 12.2, 'caisse_p'], [1.25, 13.0, 'caisse'], [3.1, 15.0, 'caisse']].forEach(([a, r, t]) => { const q = polL(a, r); poser(t, q.x, q.z, { ry: rnd() * 2, bloc: t === 'caisse' ? 0.75 : 0.58, gros: 0.8 }); });
  [[5.6, 13.0, 'tonneau'], [1.05, 14.4, 'tonneau_couche']].forEach(([a, r, t]) => { const q = polL(a, r); poser(t, q.x, q.z, { bloc: 0.45, gros: 0.8 }); });
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU_L + 0.2, q = polL(a, 18.2); if (Math.abs(angDiff(a, DOCK_LABO.a)) < 0.25) continue; poser('lampadaire', q.x, q.z, { ry: -a + Math.PI, bloc: 0.25, gros: 0.4 }); }
  { const q = polL(-0.05, 12.6); poser('panneau', q.x, q.z, { ry: 1.6, gros: 0.3 }); }
  return { L, yeux };
}
/* VOIR A TRAVERS LES ARBRES : les pieces du dehors (cimes, rochers, champignons geants...) s'ouvrent autour du perso, entre lui et la camera, au-dessus de
   1,5 de haut (un trou au bord tramé) ; sinon, dans la foret, le perso disparaissait sous les cimes. Les uniformes sont mis a jour a chaque image (vieIleLabo) */
const TROU_LABO = { uPerso: { value: new T.Vector3() }, uDir: { value: new T.Vector3(0, 1, 0) }, uTrou: { value: 0 } };
function trouLabo(m) {
  if (m.userData.trou) return m; m.userData.trou = true; const avant = m.onBeforeCompile, cle = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : null;
  m.onBeforeCompile = (sh, r) => { if (avant) avant.call(m, sh, r); Object.assign(sh.uniforms, TROU_LABO);
    sh.vertexShader = 'varying vec3 vMondeT;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvMondeT = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform vec3 uPerso; uniform vec3 uDir; uniform float uTrou; varying vec3 vMondeT;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n  if (uTrou > 0.0 && vMondeT.y > uPerso.y + 1.5) { vec3 dP = vMondeT - uPerso; float t = dot(dP, uDir); if (t > 0.4) { float d = length(dP - uDir * t); if (d < uTrou) { float k = (uTrou - d) / 0.9; float h = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453); if (k > 1.0 || h < k) discard; } } }'); };
  m.customProgramCacheKey = () => (cle ? cle() : '') + '|trouLabo'; m.needsUpdate = true; return m;
}
const contoursTrou = new Map(); /* (les contours sont partages avec la ferme : une copie a part, une par contour) */
function trouGroupe(grp, sauf) { const L = []; grp.traverse((m) => { if (!m.isMesh || !m.material || (sauf && sauf.includes(m))) return;
  if (m.material.side === T.BackSide) { const c0 = m.material; if (!contoursTrou.has(c0)) { const c = c0.clone(); c.onBeforeCompile = c0.onBeforeCompile; c.customProgramCacheKey = c0.customProgramCacheKey; contoursTrou.set(c0, trouLabo(c)); } m.material = contoursTrou.get(c0); return; }
  if (m.material.isMeshBasicMaterial) { m.material = m.material.clone(); L.push({ m: m.material, c: m.material.color.clone(), ph: L.length * 1.9 }); }
  trouLabo(m.material); }); return L; } /* (rend les lueurs : les matieres qui luisent, copiees, pour les faire respirer) */
/* le chargement de l'ile : la mer, le sol en relief, la tour, les pieces du dehors (soudees par morceaux de 24 : seuls ceux qu'on voit se dessinent),
   la barque, les mares de mutagene, la brume, les salles */
async function construireIleWabbits() {
  const g = new T.Group(); g.position.copy(DONJON);
  const mer = new T.Mesh(new T.PlaneGeometry(420, 420), new T.MeshToonMaterial({ color: '#28606c', gradientMap: grad })); mer.rotation.x = -Math.PI / 2; mer.position.y = -0.55; mer.receiveShadow = true; g.add(mer);
  const haut = new T.Mesh(new T.PlaneGeometry(420, 420), new T.MeshBasicMaterial({ color: '#7fd8c4', transparent: true, opacity: 0.14, depthWrite: false })); haut.rotation.x = -Math.PI / 2; haut.position.y = -0.5; g.add(haut);
  /* l'eau claire le long du rivage (un anneau lisse, du vert d'eau a la couleur de la mer) et l'ecume */
  { const N = 220, R = [[-1.4, '#6dbfae'], [2.5, '#4f9d92'], [6.5, '#36777c'], [11, '#28606c']], pos = [], col = [], idx = [], C = new T.Color();
    for (let i = 0; i <= N; i++) { const a = i / N * TAU_L, r = rIle(a); R.forEach(([d, c]) => { pos.push(Math.cos(a) * (r + d), -0.53, Math.sin(a) * (r + d)); C.set(c).convertSRGBToLinear(); col.push(C.r, C.g, C.b); }); }
    for (let i = 0; i < N; i++) for (let k = 0; k < R.length - 1; k++) { const a = i * R.length + k, b = (i + 1) * R.length + k; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const eau = new T.Mesh(geo, new T.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: grad })); eau.receiveShadow = true; g.add(eau);
    const pe = [], ie = []; for (let i = 0; i <= N; i++) { const a = i / N * TAU_L, r = rIle(a); pe.push(Math.cos(a) * (r - 0.9), -0.5, Math.sin(a) * (r - 0.9), Math.cos(a) * (r + 1.3 + 0.4 * Math.sin(i * 0.7)), -0.5, Math.sin(a) * (r + 1.3 + 0.4 * Math.sin(i * 0.7))); }
    for (let i = 0; i < N; i++) ie.push(2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 2, 2 * i + 3, 2 * i + 1);
    const ge = new T.BufferGeometry(); ge.setAttribute('position', new T.Float32BufferAttribute(pe, 3)); ge.setIndex(ie);
    const ec = new T.Mesh(ge, new T.MeshBasicMaterial({ color: '#eefcf2', transparent: true, opacity: 0.3, depthWrite: false, side: T.DoubleSide })); g.add(ec); g.userData.ecume = ec; }
  const sol = solLabo(); g.add(sol);
  /* les dalles de fer autour du pied de la tour */
  { const n = 44, im = new T.InstancedMesh(new T.BoxGeometry(1.0, 0.08, 1.0), mat('#ffffff'), n * 2), M = new T.Matrix4(), Q = new T.Quaternion(), V = new T.Vector3(), Sc = new T.Vector3(), C = new T.Color(), Y = new T.Vector3(0, 1, 0); let k = 0;
    [[12.2, 1.9, 1.45], [14.3, 1.9, 1.5]].forEach(([r, w, d], ri) => { for (let i = 0; i < n; i++) { const a = (i + ri * 0.5) / n * TAU_L; Q.setFromAxisAngle(Y, -a); V.set(Math.cos(a) * r, 0.02, Math.sin(a) * r); Sc.set(d, 1, w * 0.92); M.compose(V, Q, Sc); im.setMatrixAt(k, M); im.setColorAt(k, C.set(['#5d6066', '#6a6d74', '#555860'][(i + ri) % 3])); k++; } });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.receiveShadow = true; g.add(im); }
  const pose = (o, x, z, y, ry) => { o.position.set(x, y || 0, z); if (ry) o.rotation.y = ry; o.traverse((q) => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); g.add(o); return o; };
  /* la tour, la passerelle, les grilles, les portes : soudees par matiere, groupe par groupe ; la tour et ses portes ont leurs propres matieres (on les rend
     transparentes quand le perso passe derriere) */
  const [sc, fl] = await Promise.all([chargerGlb('assets/modeles/jeu/ile-labo.glb?v=' + (VERSIONS_FICHIERS['ile-labo.glb'] || VERSION_MODELES)), chargerGlb('assets/modeles/jeu/ile-labo-flore.glb?v=' + (VERSIONS_FICHIERS['ile-labo-flore.glb'] || VERSION_MODELES))]);
  versToon(sc, { normales: 0.03, sansContour: SC_BATI });
  const prendre = (nom) => { const n = sc.getObjectByName(nom); if (!n) return null; n.parent.remove(n); n.position.set(0, 0, 0); const e = new T.Group(); e.name = nom; e.add(n); fusionner(e); e.traverse((q) => { if (q.isMesh) { q.material = q.material.clone(); q.castShadow = true; q.receiveShadow = true; } }); g.add(e); return e; };
  g.userData.tour = prendre('Labo_tour'); g.userData.passerelle = prendre('Labo_passerelle');
  g.userData.portes = [1, 2, 3, 4, 5].map((i) => prendre('Labo_porte_' + i)); g.userData.grilles = [1, 2, 3, 4].map((i) => prendre('Labo_grille_' + i));
  /* les pieces du dehors */
  versToon(fl, { normales: 0.02, sansContour: SC_FLORE }); const F = {}; fl.children.slice().forEach((o) => { F[o.name.replace(/^Fl_/, '')] = o; });
  const { L, yeux } = placerFloreLabo(), morceaux = new Map();
  L.forEach((P) => { const pr = F[P.p]; if (!pr) return; const o = pr.clone(); const y = P.p === 'ponton' ? 0 : hTerrainLabo(P.x, P.z) + P.dy; o.position.set(P.x, y, P.z); o.rotation.set(0, P.ry, 0); o.scale.setScalar(P.s);
    if (P.p === 'sillons' || P.p === 'passerelle_marais') o.position.y = hTerrainLabo(P.x, P.z) + (P.p === 'sillons' ? 0.06 : 0.05) + P.dy;
    const cle = Math.floor(P.x / 24) + ',' + Math.floor(P.z / 24); if (!morceaux.has(cle)) { const mg = new T.Group(); mg.name = 'flore_' + cle; morceaux.set(cle, mg); } morceaux.get(cle).add(o); });
  const lueurs = []; morceaux.forEach((mg) => { g.add(mg); fusionner(mg); lueurs.push(...trouGroupe(mg)); });
  g.userData.lueurs = lueurs;
  /* les yeux : un globe par plante, qui suit le perso */
  g.userData.yeux = yeux.map((P) => { const o = F.oeil_globe.clone(), s = P.s, c = Math.cos(P.ry), sn = Math.sin(P.ry), tx = 0.085, tz = 0.135; o.position.set(P.x + (tx * c + tz * sn) * s, hTerrainLabo(P.x, P.z) + 1.86 * s, P.z + (-tx * sn + tz * c) * s); o.scale.setScalar(s * 0.95); g.add(o); return o; }); /* (au bout de la tige : 0,085 ; 1,59 ; 0,135 dans le modele) */
  /* la barque */
  { const b = new T.Group(), coque = boite(1.3, 0.45, 3.0, '#6b4e36'); coque.position.y = -0.2; b.add(coque); const bo = boite(1.45, 0.12, 3.1, '#4f3826'); bo.position.y = 0.05; b.add(bo);
    const proue = cone(0.66, 0.9, '#6b4e36', 4); proue.rotation.x = Math.PI / 2; proue.rotation.y = Math.PI / 4; proue.position.set(0, -0.2, 1.9); proue.scale.set(1, 1, 0.5); b.add(proue);
    const lant = new T.Mesh(new T.SphereGeometry(0.14, 10, 8), new T.MeshBasicMaterial({ color: '#8dff6a' })); lant.position.set(0, 0.62, -1.15); b.add(lant); const mt = boite(0.05, 0.6, 0.05, '#3a3a3a'); mt.position.set(0, 0.32, -1.15); b.add(mt);
    for (const s of [-1, 1]) { const r = boite(0.08, 0.08, 1.6, '#c9a86a'); r.position.set(s * 0.9, 0.1, 0.3); r.rotation.y = s * 0.4; b.add(r); } pose(b, 0, 0, -0.2); b.visible = false; g.userData.barque = b; }
  /* les mares de mutagene qui luisent (et leurs bords plus sombres) */
  const flaques = []; MARES_LABO.forEach((M) => {
    const f = new T.Mesh(new T.CircleGeometry(M.R + 0.6, 30), new T.MeshBasicMaterial({ color: '#7dff5a', transparent: true, opacity: 0.55, depthWrite: false })); f.rotation.x = -Math.PI / 2; f.position.set(M.x, -0.18, M.z); g.add(f); flaques.push(f);
    const fo = new T.Mesh(new T.CircleGeometry(M.R * 0.55, 24), new T.MeshBasicMaterial({ color: '#d8ffb0', transparent: true, opacity: 0.35, depthWrite: false })); fo.rotation.x = -Math.PI / 2; fo.position.set(M.x + 0.4, -0.17, M.z - 0.3); g.add(fo); });
  /* les nappes de brume (le marais vert pale, la foret violette) */
  const brumes = []; { const tx = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), d = x.createRadialGradient(64, 64, 4, 64, 64, 62); d.addColorStop(0, 'rgba(255,255,255,0.9)'); d.addColorStop(0.5, 'rgba(255,255,255,0.35)'); d.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = d; x.fillRect(0, 0, 128, 128); const t = new T.CanvasTexture(c); return t; })();
    [[5.3, 27, '#c8f0b0'], [5.55, 34, '#c8f0b0'], [5.2, 38, '#c8f0b0'], [5.75, 31, '#c8f0b0'], [5.45, 24, '#d8f5c8'], [2.1, 30, '#b9a0d8'], [2.5, 38, '#b9a0d8'], [2.0, 41, '#c4b0e0'], [2.75, 33, '#b9a0d8'], [1.75, 35, '#b9a0d8'], [3.0, 42, '#b9a0d8'], [4.2, 38, '#cfc8d8'], [0.9, 37, '#d8e8c8']].forEach(([a, r, c], k) => {
      const q = polL(a, r), m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: tx, color: c, transparent: true, opacity: 0.3, depthWrite: false })); m.rotation.x = -Math.PI / 2; const s = 9 + (k % 3) * 3; m.scale.set(s, s * 0.7, 1);
      m.position.set(q.x, Math.max(-0.1, hTerrainLabo(q.x, q.z)) + 0.45, q.z); m.renderOrder = 2; g.add(m); brumes.push({ m, x: q.x, z: q.z, ph: k * 1.3 }); }); }
  g.userData.salles = await construireSallesLabo(g);
  g.userData.flaques = flaques; g.userData.brumes = brumes; sansClic(g);
  g.userData.salles.forEach((S) => { if (S.clic) delete S.clic.raycast; }); sol.raycast = T.Mesh.prototype.raycast; mer.raycast = T.Mesh.prototype.raycast;
  if (g.userData.passerelle) g.userData.passerelle.traverse((q) => { if (q.isMesh) delete q.raycast; }); /* (la mer, le sol, la passerelle et le sol des salles restent cliquables : on y va) */
  g.traverse((o) => { if (o.isMesh && o.parent && /^flore_/.test(o.parent.name) && o.material && o.material.side !== T.BackSide) o.castShadow = true; });
  scene.add(g); effets.push(vieIleLabo); return g;
}
/* ---------- LES SALLES (blender/ile-labo-salles.py) : leurs meubles sont des obstacles (les pieces « bloc » du modele : un cylindre par meuble, lu puis
   retire), les reperes « repere_bobine » (le haut d'une bobine qui crepite) et « repere_bulles » (une cuve qui bouillonne) ; les verres « verre » sont
   transparents ; autour de chaque salle, du noir ; un disque invisible pour cliquer au sol, la sortie verte contre la porte ---------- */
async function construireSallesLabo(g) {
  const sc = await chargerGlb('assets/modeles/jeu/ile-labo-salles.glb?v=' + (VERSIONS_FICHIERS['ile-labo-salles.glb'] || VERSION_MODELES));
  const nomB = (m) => m.name.replace(/\.?\d+$/, '').replace(/_\d+$/, '');
  return SALLES_LABO.map((S) => {
    const n = sc.getObjectByName('Salle_' + S.theme), s = new T.Group(); s.position.set(S.x, Y_SALLE, S.z); g.add(s); const blocs = [], reperes = [];
    if (n) { n.parent.remove(n); n.position.set(0, 0, 0); const retirer = [];
      n.traverse((m) => { if (!m.isMesh) return; const b = nomB(m); if (b !== 'bloc' && !b.startsWith('repere')) return; m.geometry.computeBoundingBox(); const B = m.geometry.boundingBox, c = B.getCenter(new T.Vector3()); if (b === 'bloc') blocs.push({ x: c.x, z: c.z, r: (B.max.x - B.min.x) / 2 }); else reperes.push({ nom: b, x: c.x, y: c.y, z: c.z }); retirer.push(m); });
      retirer.forEach((m) => m.parent.remove(m));
      versToon(n, { normales: 0.02, sansContour: SC_FLORE });
      n.traverse((m) => { if (m.isMesh && /^verre/.test(nomB(m))) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0.32; m.material.depthWrite = false; m.castShadow = false; m.children.forEach((k) => { k.visible = false; }); } });
      s.add(n); fusionner(n); }
    const vide = new T.Mesh(new T.CircleGeometry(S.R + 40, 40), new T.MeshBasicMaterial({ color: '#07080b' })); vide.rotation.x = -Math.PI / 2; vide.position.y = -0.4; s.add(vide);
    const clic = new T.Mesh(new T.CircleGeometry(S.R, 48), new T.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); clic.rotation.x = -Math.PI / 2; clic.position.y = 0.02; s.add(clic);
    const sortie = new T.Mesh(new T.RingGeometry(0.85, 1.25, 32), new T.MeshBasicMaterial({ color: '#7dff5a', transparent: true, opacity: 0.75, depthWrite: false })); sortie.rotation.x = -Math.PI / 2; sortie.position.set(Math.cos(ENTREE_SALLE) * (S.R - 1.1), 0.05, Math.sin(ENTREE_SALLE) * (S.R - 1.1)); sortie.visible = false; s.add(sortie);
    const lueurs = trouGroupe(s, [vide, clic, sortie]); /* (les meubles entre le perso et la camera s'ouvrent aussi : la porte cachait le perso a l'entree) */
    /* les arcs des bobines : une ligne brisee qui saute d'une bobine a l'autre, ou vers le sol */
    const bobines = reperes.filter((q) => q.nom === 'repere_bobine').map((q) => new T.Vector3(q.x, q.y, q.z)), arcs = [];
    bobines.forEach(() => { const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(new Float32Array(10 * 3), 3)); const l = new T.Line(geo, new T.LineBasicMaterial({ color: '#d8f6ff', transparent: true, opacity: 0.9 })); l.visible = false; s.add(l); arcs.push(l); });
    S.blocs = blocs; return { grp: s, sortie, clic, lueurs, bobines, arcs, bulles: reperes.filter((q) => q.nom === 'repere_bulles') };
  });
}
let ileWabbitsPromesse = null;
async function chargerIleWabbits() { if (!ileWabbits) ileWabbits = await (ileWabbitsPromesse || (ileWabbitsPromesse = construireIleWabbits())); return ileWabbits; }
VOYAGES.donjon = { centre: DONJON, charger: () => chargerIleWabbits(), zoom: () => 1.0 };
/* L'AMBIANCE BIZARRE : un voile sur l'ecran (le vert-gris qui ternit, le violet sur les bords), seulement sur l'ile */
function voileLabo() {
  let v = document.getElementById('voile-labo'); if (v) return v;
  v = document.createElement('div'); v.id = 'voile-labo'; v.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1;display:none';
  v.innerHTML = '<div style="position:absolute;inset:0;background:rgba(70,96,60,.07)"></div><div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 46%,rgba(40,16,60,0) 38%,rgba(40,16,60,.12) 70%,rgba(24,8,40,.34) 100%)"></div>'; /* (un voile vert-gris leger, pas de melange « multiply » : par-dessus le canevas transparent du jeu, il couvrait tout) */
  canvas.insertAdjacentElement('afterend', v); return v;
}
const montrerIles0 = montrerIles; montrerIles = function () { montrerIles0(); if (ileWabbits) ileWabbits.visible = lieu === 'donjon'; voileLabo().style.display = lieu === 'donjon' ? 'block' : 'none'; };
/* LA VIE DE L'ILE, a chaque image ou l'on y est : les spores qui flottent, la brume, les lueurs qui respirent, les mares, l'ecume, les yeux qui suivent le perso,
   la fumee de la cheminee ; dans une salle : ses lueurs, les arcs des bobines, les bulles des cuves */
function vieIleLabo(dt) {
  if (lieu !== 'donjon' || !ileWabbits) return false; const I = ileWabbits.userData, V = vieIleLabo.v || (vieIleLabo.v = { t: 0, spore: 0, fumee: 0, arc: 0, bulle: 0 }); V.t += dt; const t = V.t, p = paysanMesh.position, P = etatPerso();
  TROU_LABO.uPerso.value.copy(p); TROU_LABO.uDir.value.copy(camera.position).sub(VISEE).normalize(); TROU_LABO.uTrou.value = 2.7;
  if (P.mode === 'salle') { const S = I.salles[P.i]; if (!S) return false;
    S.lueurs.forEach((L) => { L.m.color.copy(L.c).multiplyScalar(0.82 + 0.22 * Math.sin(t * 2.3 + L.ph)); });
    if ((V.arc -= dt) <= 0) { V.arc = 0.07; S.arcs.forEach((l, k) => { if (Math.random() < 0.45) { l.visible = false; return; } const A = S.bobines[k], B = k + 1 < S.bobines.length && Math.random() < 0.6 ? S.bobines[k + 1] : new T.Vector3(A.x + (Math.random() - 0.5) * 5, 0.1, A.z + (Math.random() - 0.5) * 5), a = l.geometry.attributes.position;
      for (let i = 0; i < 10; i++) { const u = i / 9, j = i === 0 || i === 9 ? 0 : 0.55; a.setXYZ(i, A.x + (B.x - A.x) * u + (Math.random() - 0.5) * j, A.y + (B.y - A.y) * u + Math.sin(u * Math.PI) * 1.2 + (Math.random() - 0.5) * j, A.z + (B.z - A.z) * u + (Math.random() - 0.5) * j); }
      a.needsUpdate = true; l.visible = true; }); }
    if ((V.bulle -= dt) <= 0) { V.bulle = 0.12; S.bulles.forEach((q) => { const w = S.grp.position; emettre(FX_LUM, 1, { x: DONJON.x + w.x + q.x + (Math.random() - 0.5) * 0.9, y: q.y - 1.6, z: DONJON.z + w.z + q.z + (Math.random() - 0.5) * 0.9, r: 0.1, v: [0, 1.0, 0], dv: 0.2, vie: [1.2, 1.8], taille: [0.14, 0.06], c: ['#d8ffb0', '#8dff6a'], a: 0.8, frein: 0.3 }); }); }
    return false; }
  (I.lueurs || []).forEach((L) => { L.m.color.copy(L.c).multiplyScalar(0.8 + 0.25 * Math.sin(t * 1.9 + L.ph)); });
  (I.flaques || []).forEach((f, i) => { f.material.opacity = 0.45 + 0.15 * Math.sin(t * 2.0 + i); });
  if (I.ecume) I.ecume.material.opacity = 0.24 + 0.1 * Math.sin(t * 1.3);
  (I.brumes || []).forEach((B) => { B.m.material.opacity = 0.22 + 0.1 * Math.sin(t * 0.5 + B.ph); B.m.rotation.z = Math.sin(t * 0.07 + B.ph) * 0.6; B.m.position.x = B.x + Math.sin(t * 0.11 + B.ph) * 1.2; });
  const cible = new T.Vector3(p.x, p.y + 1.0, p.z); (I.yeux || []).forEach((o) => { if (Math.abs(o.position.x + DONJON.x - p.x) + Math.abs(o.position.z + DONJON.z - p.z) < 40) o.lookAt(cible); });
  if ((V.spore -= dt) <= 0) { V.spore = 0.07; const x = VISEE.x + (Math.random() - 0.5) * 34, z = VISEE.z + (Math.random() - 0.5) * 34, h = hTerrainLabo(x - DONJON.x, z - DONJON.z); emettre(FX_LUM, 1, { x, y: Math.max(-0.2, h) + 0.4 + Math.random() * 3.2, z, r: 0.1, v: [0.12, 0.18, 0.06], dv: 0.12, vie: [3, 5], taille: [0.13, 0.05], c: ['#c98cff', '#8dff6a', '#7ff3ff', '#e6ffb0'], a: 0.55, frein: 0.2 }); }
  if ((V.fumee -= dt) <= 0) { V.fumee = 0.22; const a = 2.85, r = 3.3 * LABO.ECH; emettre(FX_LUM, 1, { x: DONJON.x + r * Math.cos(a), y: 20.65 * LABO.ECH + 0.3, z: DONJON.z + r * Math.sin(a), r: 0.35, v: [0.3, 1.8, 0], dv: 0.3, vie: [2.4, 3.2], taille: [0.9, 2.2], c: ['#8a8f86', '#b8c0b0', '#6f746c'], a: 0.42, frein: 0.6 }); } /* (la fumee de la cheminee) */
  return false;
}
/* ---------- le donjon ---------- */
/* les Wabbits transmutes : la peau verdit et luit un peu, ils ne grignotent ni ne cassent rien ici (sans ca, ils filaient vers les champs de la ferme) */
function transmuter(o) {
  if (/^wab-/.test(o.d.modele || '')) { o.aggro = true; o.casseur = false; o.d = Object.assign({}, o.d, { grignote: false, casseur: false, bucheron: false }); return; } /* (les mutants du labo, 24/11/2026 : leur propre look) */
  o.aggro = true; o.casseur = false; o.d = Object.assign({}, o.d, { grignote: false, casseur: false, bucheron: false, nom: o.d.nom + ' transmuté' + (o.d.fem ? 'e' : '') });
  const vert = new T.Color('#7dff5a'); o.m.traverse((q) => { if (!q.isMesh || !q.material || q.name === 'contour' || q.material.isMeshBasicMaterial) return; q.material = q.material.clone(); if (q.material.color) q.material.color.lerp(vert, 0.28); if (q.material.emissive) { q.material.emissive.set('#2fd12f'); q.material.emissiveIntensity = 0.22; } });
}
/* les camps : leurs mutants attendent chez eux, immobiles, jusqu'a ce que le perso entre dans leur perimetre */
function posterCamps(c) {
  CAMPS_LABO.forEach((K, k) => { const L = []; K.L.forEach(([t, n]) => { for (let i = 0; i < n; i++) L.push(t); });
    L.forEach((t, i) => { const a = i / L.length * TAU_L + k, r = 1.2 + (i % 2) * 1.4, q = bornerDonjon(DONJON.x + K.x + Math.cos(a) * r, DONJON.z + K.z + Math.sin(a) * r, 0.6, { mode: 'sol', theta: LABO.A0 }), chef = K.L.some(([t2, , ch]) => ch === 'chef' && t2 === t) && L.indexOf(t) === i;
      setTimeout(() => { if (combat === c && !c.fin) apparaitre(t, { x: q[0], z: q[1], apres: (o) => { transmuter(o); o.lab = { mode: 'sol', theta: LABO.A0 }; o.camp = k; o.maison = { x: q[0], z: q[1] };
        if (chef && typeof grandirMutant === 'function') { grandirMutant(o, CHEF_LABO, '#ffb02e', t === 'wabGarou' ? 'Garou alpha' : 'Chef des gardes'); o.chef = true; } } }); }, 200 + (k * 6 + i) * 120); }); }); /* (chef : le premier de son type dans le camp) */
}
/* le passage d'une porte : un fondu au noir, le perso de l'autre cote */
function fonduDonjon(fn) { let d = document.getElementById('fondu-donjon'); if (!d) { d = document.createElement('div'); d.id = 'fondu-donjon'; d.style.cssText = 'position:fixed;inset:0;background:#05070a;opacity:0;pointer-events:none;transition:opacity .28s;z-index:60'; document.body.appendChild(d); }
  d.style.opacity = '1'; setTimeout(() => { try { fn(); } finally { setTimeout(() => { d.style.opacity = '0'; }, 140); } }, 300); }
function placerPersoDonjon(x, y, z) { const u = paysanMesh.userData; paysanMesh.position.set(x, y, z); u.y = y; chemin = []; arrivee = null; if (combat) { combat.tenir = true; combat.ordre = false; combat.poursuite = false; combat.cible = null; } /* (de l'autre cote de la porte, il tient sa position : sinon il repartait vers un mutant reste au pied de la tour) */ VISEE.set(x, y + 0.6, z); placerCamera(); suivreOmbres(); }
/* on passe la porte i : la salle, ses mutants (ou le Docteur) qui attendent au fond */
function ouvrirSalleLabo(i) {
  const c = combat, E = donjonEtat, S = SALLES_LABO[i]; if (!c || !E || E.salles[i]) return;
  const L = []; S.L.forEach(([t, n]) => { for (let k = 0; k < n; k++) L.push(t); }); E.salles[i] = { t: E.t, fini: false, dedans: true, n: L.length };
  fonduDonjon(() => {
    const P = E.perso; P.mode = 'salle'; P.i = i; const re = S.R - 3.4; zoom = i === 4 ? 0.7 : 0.82; cadrer(); placerPersoDonjon(DONJON.x + S.x + Math.cos(ENTREE_SALLE) * re, Y_SALLE, DONJON.z + S.z + Math.sin(ENTREE_SALLE) * re);
    paysanMesh.userData.angle = Math.atan2(-Math.cos(ENTREE_SALLE), -Math.sin(ENTREE_SALLE)); paysanMesh.rotation.y = paysanMesh.userData.angle;
    toast(i === 4 ? 'Le labo ! Le Docteur Wabbenstein lâche ses fioles et se retourne vers toi.' : 'Tu entres dans ' + S.nom + ' : ses mutants t\'attendent !', 'alerte'); son('vague', null, 2);
    if (i < 4) cuveSpecimenLabo(i); /* (le specimen dans sa cuve, au fond, 24/11/2026) */
    L.forEach((t, k) => { const a = ENTREE_SALLE + Math.PI + (L.length > 1 ? (k / (L.length - 1) - 0.5) * 1.6 : 0), rr = i === 4 ? 6.5 : 3.6 + (k % 2) * 2.4, x = DONJON.x + S.x + Math.cos(a) * rr, z = DONJON.z + S.z + Math.sin(a) * rr;
      setTimeout(() => { if (combat !== c || c.fin) return; apparaitre(t, { x, z, apres: (o) => { if (t !== 'wabbenstein') transmuter(o); o.lab = { mode: 'salle', i }; o.salle = i; o.y = Y_SALLE; o.ry = Math.atan2(Math.cos(ENTREE_SALLE), Math.sin(ENTREE_SALLE)); if (o.dep) { o.dep.x = x; o.dep.z = z; o.dep.y = Y_SALLE - 1.4; } } }); }, 450 + k * 240); });
  });
}
/* LE SPECIMEN D'UNE CUVE (24/11/2026, « dans chaque salle un lapin mutant qui est dans une cuve et qui sort a un certain moment de la vague », Mathieu) : la moitie
   des mutants de la salle abattue, la cuve du fond se brise (eclats de verre, flot vert) et le specimen du theme en sort : le meme mutant, plus grand et bien plus
   fort ; il donne des kamas et des Poils de Wabbit (27n-mutants-labo.js) */
function cuveSpecimenLabo(i) {
  const E = donjonEtat, S = SALLES_LABO[i], t = S.L[0][0], a = ENTREE_SALLE + Math.PI, rr = S.R - 3.2, x = DONJON.x + S.x + Math.cos(a) * rr, z = DONJON.z + S.z + Math.sin(a) * rr;
  if (!E || !E.salles[i] || E.salles[i].cuveG) return; const g = new T.Group(); g.position.set(x, Y_SALLE, z);
  const cuivre = new T.MeshLambertMaterial({ color: '#b8743a' }), verre = new T.MeshLambertMaterial({ color: '#9fffd2', transparent: true, opacity: 0.26, depthWrite: false }), jus = new T.MeshBasicMaterial({ color: '#5dff7a', transparent: true, opacity: 0.16, depthWrite: false });
  const socle = new T.Mesh(new T.CylinderGeometry(1.75, 1.9, 0.5, 24), cuivre); socle.position.y = 0.25; g.add(socle);
  const cap = new T.Mesh(new T.CylinderGeometry(1.6, 1.75, 0.45, 24), cuivre); cap.position.y = 4.35; g.add(cap);
  const tube = new T.Mesh(new T.CylinderGeometry(1.55, 1.55, 3.7, 28, 1, true), verre); tube.position.y = 2.35; tube.renderOrder = 4; g.add(tube);
  const liq = new T.Mesh(new T.CylinderGeometry(1.48, 1.48, 3.5, 24), jus); liq.position.y = 2.3; liq.renderOrder = 3; g.add(liq);
  [1.2, 3.4].forEach((y) => { const r = new T.Mesh(new T.TorusGeometry(1.58, 0.07, 6, 28), cuivre); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); });
  try { const m = clonerSquelette(MONSTRES[t].modele); if (m) { m.scale.multiplyScalar(0.85); m.position.y = 0.6; m.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)); m.traverse((q) => { if (q.isMesh && q.material) { q.material = q.material.clone(); if (q.material.emissive) { q.material.emissive.set('#2fd12f'); q.material.emissiveIntensity = 0.25; } } }); g.add(m); g.userData.mutant = m; } } catch (e) { /* (sans modele : la cuve seule) */ }
  scene.add(g); E.salles[i].cuveG = g;
  g.userData.bulles = setInterval(() => { if (!g.parent) { clearInterval(g.userData.bulles); return; } if (enPause || typeof emettre !== 'function') return; emettre(FX_LUM, 1, { x: x + (Math.random() - 0.5) * 2.2, y: Y_SALLE + 0.7, z: z + (Math.random() - 0.5) * 2.2, r: 0.05, v: [0, 1.3, 0], dv: 0.15, vie: [1.6, 2.4], taille: [0.12, 0.05], c: ['#c8ffd8', '#7dff5a'], a: 0.6, frein: 0 });
    if (g.userData.mutant) g.userData.mutant.position.y = 0.6 + 0.08 * Math.sin(performance.now() / 700); }, 120);
}
function briserCuveLabo(i) { const E = donjonEtat, s = E && E.salles[i], g = s && s.cuveG; if (!g) return; clearInterval(g.userData.bulles); scene.remove(g); g.traverse((q) => { if (q.isMesh && !q.isSkinnedMesh) { q.geometry.dispose(); } }); s.cuveG = null; }
function specimenLabo(i) {
  const c = combat, E = donjonEtat, S = SALLES_LABO[i]; if (!c || !E || !E.salles[i] || E.salles[i].specimen) return; E.salles[i].specimen = true;
  const t = S.L[0][0], a = ENTREE_SALLE + Math.PI, rr = S.R - 3.2, x = DONJON.x + S.x + Math.cos(a) * rr, z = DONJON.z + S.z + Math.sin(a) * rr;
  if (typeof emettre === 'function') { emettre(FX_LUM, 40, { x, y: Y_SALLE + 1.4, z, r: 0.8, v: [0, 2.2, 0], dv: 3.2, vie: [0.5, 1.1], taille: [0.22, 0.06], c: ['#d8fff4', '#9fffd0', '#ffffff'], a: 0.9, frein: 0.6 });
    emettre(FX_LUM, 30, { x, y: Y_SALLE + 0.2, z, r: 1.2, v: [0, 0.6, 0], dv: 2.0, vie: [0.8, 1.4], taille: [0.4, 0.1], c: ['#7dff5a', '#3fd14a'], a: 0.7, frein: 0.4 }); }
  briserCuveLabo(i); if (typeof secousse === 'function') secousse(0.25, 0.4); son('vague', null, 2);
  toast('Crac ! La cuve du fond se brise : le spécimen n°' + (i + 1) + ' s\'en échappe !', 'alerte');
  apparaitre(t, { x, z, apres: (o) => { transmuter(o); if (typeof grandirMutant === 'function') grandirMutant(o, SPECIMEN, '#7dff5a', 'Spécimen n°' + (i + 1) + ' (' + MONSTRES[t].nom + ')'); o.specimen = true; o.lab = { mode: 'salle', i }; o.salle = i; o.y = Y_SALLE; o.ry = Math.atan2(-Math.cos(a), -Math.sin(a)); if (o.dep) { o.dep.x = x; o.dep.z = z; o.dep.y = Y_SALLE - 1.4; } } });
}
/* la salle nettoyee : on ressort par la sortie verte, sur la passerelle devant la porte, et la grille s'ouvre */
function sortirSalleLabo(i) { const E = donjonEtat; if (!E || E.sortie) return; E.sortie = true;
  fonduDonjon(() => { const P = E.perso, ta = angleRampe(LABO.PORTES[i]) + 0.05, rr = LABO.R_IN + 1.0; P.mode = 'rampe'; P.theta = ta; P.i = null; E.salles[i].dedans = false; E.sortie = false;
    zoom = VOYAGES.donjon.zoom(); cadrer(); placerPersoDonjon(DONJON.x + rr * Math.cos(ta), hautRampe(ta), DONJON.z + rr * Math.sin(ta)); const S = ileWabbits.userData.salles[i]; if (S && S.sortie) S.sortie.visible = false; ouvrirGrille(i); }); }
function ouvrirGrille(i) { const E = donjonEtat; if (!E || E.grilles[i]) return; E.grilles[i] = true; const G = ileWabbits && ileWabbits.userData.grilles[i]; son('quete');
  toast('Tu ressors avec la clé : la grille de la passerelle s\'ouvre. Monte !', 'or');
  if (G) { let t = 0; effets.push((dt) => { t += dt; G.position.y = -Math.min(1, t / 1.1) * 2.8; if (t >= 1.1) { G.visible = false; return true; } return false; }); } }
const hauteurPerso = (P, p) => (P.mode === 'rampe' ? hautRampe(P.theta) : P.mode === 'salle' ? Y_SALLE : hTerrainLabo(p.x - DONJON.x, p.z - DONJON.z));
function tickDonjon(dt) { /* chaque image, tant qu'on est sur l'ile : les camps, les portes et les grilles, les monstres sur l'ile, la camera, la tour qui s'efface */
  const E = donjonEtat, c = combat; if (!E || lieu !== 'donjon') return true; if (!c || c.genre !== 'donjon' || c.fin) return false;
  E.t += dt; const p = paysanMesh.position, P = E.perso, hP = hauteurPerso(P, p);
  const S0 = P.mode === 'salle' ? SALLES_LABO[P.i] : null, vx = S0 ? p.x + (DONJON.x + S0.x - p.x) * 0.35 : p.x, vz = S0 ? p.z + (DONJON.z + S0.z - p.z) * 0.35 : p.z; /* (dans une salle, la camera regarde un peu vers le milieu : on voit la salle, pas le noir derriere la porte) */
  const suivre = () => { if (!(typeof dg !== 'undefined' && dg.zoomJeu != null)) { const k = Math.min(1, dt * 4); VISEE.x += (vx - VISEE.x) * k; VISEE.z += (vz - VISEE.z) * k; VISEE.y += (0.6 + hP - VISEE.y) * Math.min(1, dt * 3); placerCamera(); } };
  if (E.arrivee) { suivre(); return false; } /* (pendant la traversee : rien ne bouge, la camera suit la barque) */
  /* les camps : ils attendent ; le perso entre dans leur perimetre (au sol), ils attaquent ; il s'eloigne ou monte la passerelle, ils rentrent chez eux */
  CAMPS_LABO.forEach((K, k) => { const d = Math.hypot(p.x - DONJON.x - K.x, p.z - DONJON.z - K.z), st = E.camps[k];
    const blesse = !st.actif && c.monstres.some((o) => o.camp === k && o.etat === 'actif' && o.pv < o.pvMax); /* (un mutant touche de loin reveille tout son camp) */
    if (!st.actif && ((P.mode === 'sol' && d < K.r) || blesse)) { st.actif = true; st.force = blesse; toast('Des Wabbits mutants gardent ' + K.nom + ' : ils t\'attaquent !', 'alerte'); }
    else if (st.actif && (d > K.r + (st.force ? 16 : 9) || P.mode !== 'sol')) { st.actif = false; st.force = false; } });
  c.monstres.forEach((o) => { if (o.etat !== 'actif' || o.camp == null || E.camps[o.camp].actif) return; o.bloqueT = Math.max(o.bloqueT || 0, 0.25); const dx = o.maison.x - o.x, dz = o.maison.z - o.z, d = Math.hypot(dx, dz);
    if (d > 0.3) { const v = Math.min(d, 3.2 * dt); o.x += dx / d * v; o.z += dz / d * v; o.ry = Math.atan2(dx, dz); } });
  /* les portes : on arrive devant, la salle s'ouvre ; une salle nettoyee rend 25 % de vie et ouvre la grille */
  if (P.mode === 'rampe') LABO.PORTES.forEach((h, i) => { if (E.salles[i] || (i > 0 && !E.grilles[i - 1])) return; const ta = angleRampe(h), r = Math.hypot(p.x - DONJON.x, p.z - DONJON.z); if (Math.abs(P.theta - ta) < 0.22 && r < LABO.R_IN + 2.0) ouvrirSalleLabo(i); }); /* (la moitie de la passerelle cote mur, devant la porte) */
  E.salles.forEach((s, i) => { if (!s || s.fini || E.t - s.t < 3) return;
    if (i < 4 && !s.specimen) { if (c.monstres.filter((o) => o.salle === i && o.etat !== 'mort').length <= Math.ceil((s.n || 1) / 2)) specimenLabo(i); return; } /* (le specimen de la cuve : a mi-chemin, et la salle n'est finie qu'apres lui) */
    if (c.monstres.some((o) => o.salle === i && o.etat !== 'mort')) return; s.fini = true; c.pv = Math.min(c.pvMax, c.pv + c.pvMax * 0.25); majCombatHud();
    if (i === 4) { E.gagne = E.t; toast('Le Docteur Wabbenstein est tombé !', 'or'); if (typeof liberationLabo === 'function') liberationLabo(); return; } /* (la liberation des Wabbits, puis le coffre : 29s-fin-labo.js) */
    const S = ileWabbits.userData.salles[i]; if (S) S.sortie.visible = true; toast('Salle nettoyée : la clé est à toi ! Ressors par l\'entrée (le cercle vert).', 'or'); son('quete'); });
  if (P.mode === 'salle' && P.i != null && P.i < 4 && E.salles[P.i] && E.salles[P.i].fini) { const S = SALLES_LABO[P.i], sx = DONJON.x + S.x + Math.cos(ENTREE_SALLE) * (S.R - 1.1), sz = DONJON.z + S.z + Math.sin(ENTREE_SALLE) * (S.R - 1.1); if (Math.hypot(p.x - sx, p.z - sz) < 1.1) sortirSalleLabo(P.i);
    const So = ileWabbits.userData.salles[P.i]; if (So && So.sortie.visible) { So.sortie.material.opacity = 0.55 + 0.3 * Math.sin(E.t * 5); So.sortie.scale.setScalar(1 + 0.06 * Math.sin(E.t * 5)); } }
  if (E.gagne != null && E.t - E.gagne > (typeof FIN_LABO !== 'undefined' ? FIN_LABO.duree : 1.6)) { finDonjon(true); return true; }
  c.monstres.forEach((o) => { if (o.etat !== 'actif' || o.d.vole) return; if (!o.lab) o.lab = { mode: 'sol', theta: LABO.A0 }; const q = bornerDonjon(o.x, o.z, o.d.boss ? 0.9 : 0.3, o.lab); o.x = q[0]; o.z = q[1]; });
  if ((E.lueurT = (E.lueurT || 0) - dt) <= 0) { E.lueurT = 0.14; c.monstres.forEach((o) => { if (o.etat !== 'actif' || !o.m) return; const h = o.d.boss ? 2.4 : 1.2; emettre(FX_LUM, 2, { x: o.x + (Math.random() - 0.5) * 0.8, y: o.m.position.y + Math.random() * h, z: o.z + (Math.random() - 0.5) * 0.8, r: 0.1, v: [0, 1.1, 0], dv: 0.3, vie: [0.7, 1.2], taille: [0.2, 0.03], c: ['#d8ffb0', '#7dff5a', '#2fd12f'], a: 0.9, frein: 1 }); }); }
  suivre(); suivreOmbres(); effacerTour(dt, hP);
  return false;
}
/* LA TOUR QUI S'EFFACE : quand le perso passe derriere elle (vu de la camera), le corps de la tour devient transparent */
function effacerTour(dt, hP) {
  const T0 = ileWabbits && ileWabbits.userData.tour; if (!T0) return; const p = paysanMesh.position, lx = p.x - DONJON.x, lz = p.z - DONJON.z, r = Math.hypot(lx, lz);
  const cx = camera.position.x - VISEE.x, cy = camera.position.y - VISEE.y, cz = camera.position.z - VISEE.z, L = Math.hypot(cx, cz) || 1, dx = cx / L, dz = cz / L, t = -lx * dx - lz * dz; /* (le rayon du perso vers la camera passe-t-il pres de l'axe de la tour, sous son sommet ?) */
  const derriere = etatPerso().mode !== 'salle' && t > 0 && Math.hypot(-lx - dx * t, -lz - dz * t) < LABO.R_OUT + 1.5 && hP + t * cy / L < 40; void r;
  const E = donjonEtat; E.voile = (E.voile || 0) + ((derriere ? 1 : 0) - (E.voile || 0)) * Math.min(1, dt * 5); const op = 1 - 0.72 * E.voile;
  const opP = etatPerso().mode === 'sol' ? op : 1; /* (la passerelle aussi, quand on est au sol derriere elle : pas quand on marche dessus) */
  [[T0, op], [ileWabbits.userData.passerelle, opP]].concat((ileWabbits.userData.portes || []).map((G) => [G, op])).forEach(([G, o]) => G && G.traverse((q) => { if (!q.isMesh || !q.material) return; const tr = o < 0.99; if (q.material.transparent !== tr) { q.material.transparent = tr; q.material.needsUpdate = true; } q.material.opacity = o; q.material.depthWrite = !tr; }));
}
async function partirDonjon() {
  if (!MODE_TEST) return; if (combat) { toast('Finis ou quitte le combat d\'abord.'); return; } if (lieu !== 'ferme' && lieu !== 'donjon') { toast('Rentre d\'abord à la ferme.'); return; }
  fermerModale(); if (lieu !== 'donjon' && !(await allerSur('donjon'))) { toast('L\'île n\'a pas pu se charger, réessaie.', 'alerte'); return; }
  const I = ileWabbits.userData; (I.grilles || []).forEach((G) => { if (G) { G.visible = true; G.position.y = 0; } });
  const q0 = versDock(6.6, 0), u = paysanMesh.userData; paysanMesh.position.set(DONJON.x + q0.x, 0, DONJON.z + q0.z); u.y = 0; u.angle = -Math.PI / 2; paysanMesh.rotation.set(0, u.angle, 0); u.charge = false; chemin = []; arrivee = null;
  VISEE.set(paysanMesh.position.x, 0.6, paysanMesh.position.z); zoom = VOYAGES.donjon.zoom(); placerCamera(); cadrer();
  const n = Math.max(51, Math.min(VAGUES_TOTAL, Math.round(niveau(S_.xp)))); /* (les Wabbits a la force de ton niveau, jamais sous la vague 51) */
  if (typeof MUTANTS_LABO !== 'undefined') { const N = MUTANTS_LABO.map(([m]) => m).filter((m) => !MODELES[m]); if (N.length) { toast('Les mutants du labo se réveillent…', 'or'); try { await chargerSquelettes(N); prechaufferSquelettes(N); } catch (e) { /* rien */ } } } /* (24/11/2026 : charges avant les camps ; sinon les premiers demandes, pendant le chargement, se perdaient) */
  const total = CAMPS_LABO.concat(SALLES_LABO).reduce((a, Z) => a + Z.L.reduce((b, [, k]) => b + k, 0), 0) + 4; /* (+4 : les specimens des cuves, 24/11/2026) */
  nouveauCombat('donjon', { n, attente: 1e9, total, ...potsDeVague() }); /* (attente : rien ne sort de la file, les camps et les salles font sortir leurs mutants) */
  { const repas = appliquerRepas(); if (repas.length) setTimeout(() => toast('Repas avant le donjon : ' + texteRepas(repas) + '.', 'or'), 2400); }
  donjonEtat = { t: 0, camps: CAMPS_LABO.map(() => ({ actif: false })), salles: [], grilles: [], gagne: null, n, perso: { mode: 'sol', theta: LABO.A0 } };
  ouvrirHudCombat(); majCombatHud(); effets.push(tickDonjon); posterCamps(combat); debarquer();
  toast('L\'île des Wabbits ! La tour du Docteur Wabbenstein t\'attend : traverse l\'île, monte la passerelle, chaque porte mène à une salle.', 'or');
}
/* L'ARRIVEE EN BARQUE : la barque vient du large le long du ponton, le perso a bord, accoste au bout, et il saute dessus (2,8 s) */
function debarquer() {
  const b = ileWabbits && ileWabbits.userData.barque, E = donjonEtat; if (!b || !E) return; const c0 = combat, u = paysanMesh.userData, A = versDock(DOCK_LABO.L + 24, -1.9), B = versDock(DOCK_LABO.L + 0.6, -1.9), S = versDock(DOCK_LABO.L - 0.8, 0), cap = Math.atan2(B.x - A.x, B.z - A.z);
  E.arrivee = true; b.visible = true; b.rotation.y = cap; let t = 0; const T1 = 2.4, T2 = 0.6;
  effets.push((dt) => { t += dt; if (combat !== c0 || !donjonEtat) return true; const p = paysanMesh.position;
    if (t < T1) { const k = t / T1, e = 1 - Math.pow(1 - k, 2); b.position.set(A.x + (B.x - A.x) * e, -0.2 + Math.sin(t * 5) * 0.04, A.z + (B.z - A.z) * e); b.rotation.z = Math.sin(t * 3.2) * 0.04;
      p.set(DONJON.x + b.position.x - Math.sin(cap) * 0.4, 0.05 + Math.sin(t * 5) * 0.04, DONJON.z + b.position.z - Math.cos(cap) * 0.4); u.y = p.y; u.angle = cap; paysanMesh.rotation.y = u.angle; chemin = []; arrivee = null; return false; }
    const k = Math.min(1, (t - T1) / T2), x0 = B.x - Math.sin(cap) * 0.4, z0 = B.z - Math.cos(cap) * 0.4; p.set(DONJON.x + x0 + (S.x - x0) * k, Math.sin(Math.PI * k) * 0.9, DONJON.z + z0 + (S.z - z0) * k); u.y = p.y;
    if (k < 1) return false; p.y = -0.06; u.y = -0.06; E.arrivee = false; b.rotation.z = 0; poussiere(p.x, -0.06, p.z, 5, 0.6, '#b9ae92'); return true; });
}
function finDonjon(gagne) {
  try { (donjonEtat && donjonEtat.salles || []).forEach((s, i) => { if (s && s.cuveG) briserCuveLabo(i); }); } catch (e) { /* rien */ } /* (les cuves des specimens, 24/11/2026) */
  const c = combat, E = donjonEtat; if (!c || c.fin || c.genre !== 'donjon') return; nettoyerCombat(c, true); donjonEtat = null;
  const m = Math.floor(E.t / 60), sec = Math.round(E.t % 60), salles = E.salles.filter((s) => s && s.fini).length;
  if (ileWabbits) effacerTourReset();
  son(gagne ? 'victoire' : 'defaite'); if (gagne) confettis(60);
  ouvrirModale('donjon-fin', entete(gagne ? 'Le Docteur Wabbenstein est tombé !' : 'À terre !') +
    '<div class="recap-combat">' + ligneRecap('cadence', 'Temps', (m ? m + ' min ' : '') + sec + ' s') + ligneRecap('renfort', 'Salles nettoyées', salles + ' sur 5') + ligneRecap('renfort', 'Monstres abattus', c.st.tues) +
    ligneRecap('degats', 'Tes dégâts', fmt(Math.round(c.st.inflige))) + ligneRecap('vita', 'Dégâts reçus', fmt(Math.round(c.st.recus))) + '</div>' + detailCombat(c) +
    '<p class="hdv-aide">Essai (version dev) : l\'île en relief et ses biomes, la tour, sa passerelle, les camps et les cinq salles. Prochaine étape : un coffre et un record de temps à la fin, les Wabbits mutants redessinés.</p>' +
    '<div class="act-bas"><button class="btn discret" data-montgolfiere="rentrer">Rentrer à la ferme</button><button class="btn kamas" data-donjon="partir">Recommencer</button></div>');
}
function effacerTourReset() { const I = ileWabbits.userData; [I.tour, I.passerelle].concat(I.portes || []).forEach((G) => G && G.traverse((q) => { if (q.isMesh && q.material) { q.material.transparent = false; q.material.opacity = 1; q.material.depthWrite = true; q.material.needsUpdate = true; } })); }
/* le perso a terre sur l'ile : le bilan (sans deroute de la ferme) */
const persoATerreDonjon = persoATerre; persoATerre = function () { if (combat && combat.genre === 'donjon') { finDonjon(false); return; } persoATerreDonjon(); };
/* le bouton du bandeau du mode test, et ceux du bilan */
const bandeauTestDonjon = bandeauTest; bandeauTest = function () { bandeauTestDonjon(); const b = document.getElementById('bandeau-test'); if (b && !b.querySelector('[data-donjon]')) b.insertAdjacentHTML('beforeend', '<button class="btn mini" data-donjon="partir">Île des Wabbits</button>'); };
document.addEventListener('click', (e) => { const b = e.target.closest('[data-donjon]'); if (!b || !MODE_TEST || !estAdmin()) return; if (b.dataset.donjon === 'partir') { if (combat && combat.genre === 'donjon') return; partirDonjon(); } });
