'use strict';
/* ================= LE GANTELET DE LA GORGOUILLE (26/11/2026, « faire un item sur la Gorgouille, on n'en a pas sur ce demi-boss ; un anneau qui ressemble a un de
   ses gants, qui donne de la vitesse d'attaque, beaucoup, ou de l'Agilite ; vitesse de deplacement +2 a +4 ; un petit peu de prospection », Mathieu, puis au
   formulaire : l'Agilite, « oui comme ca », 3 % et niveau 75). Un anneau hors panoplie (o.labo : le monstre qui le lache), niveau 75 (le palier 8 : la
   Gorgouille sort aux vagues 75 et 80), rare x1,5 comme les autres pieces. Modele : blender/objets-labo.py (anneau_gorgouille : anneau de pierre fendillee,
   brassard d'or a la croix, poing de pierre griffu), icone obj-gorgouille-anneau. Butin : 3 % sur la Gorgouille, Prospection comprise (un monstre, pas un
   coffre), dans les vagues et les revanches (ni l'Arene, ni l'ile des boss, ni le labo). Version dev tant que GANT_GORGOUILLE.joueurs est faux ================= */
const GANT_GORGOUILLE = { id: 'gorgouille-anneau', nom: 'Gantelet de la Gorgouille', niv: 75, chance: 0.03, joueurs: false, bornes: { agilite: [30, 45], vitDep: [2, 4], prospection: [10, 20] } };
{ const A = GANT_GORGOUILLE, ref = (a, b) => Math.round((a + b) / 2), rid = A.id + '-rare', moy = (B) => Object.fromEntries(Object.entries(B).map(([c, [a, b]]) => [c, ref(a, b)]));
  const bR = Object.fromEntries(Object.entries(A.bornes).map(([c, [a, b]]) => [c, [Math.ceil(a * 1.5), Math.ceil(b * 1.5)]]));
  OBJETS[A.id] = { id: A.id, emp: 'anneau', nom: A.nom, niv: A.niv, labo: 'gorgouille', stats: moy(A.bornes) };
  OBJETS[rid] = Object.assign({}, OBJETS[A.id], { id: rid, base: A.id, rare: true, nom: A.nom + ' ★', stats: moy(bR) });
  BORNES_JET[A.id] = A.bornes; BORNES_JET[rid] = bR; }
const gantGorgouilleOuvert = () => GANT_GORGOUILLE.joueurs || (typeof MODE_TEST !== 'undefined' && !!MODE_TEST);
const prosGant = () => Math.min(PLAFOND_PROS.rare, 1 + (caracs().prospection || 0) / 100);
{ const butinGant = butin; butin = function (mo) { const r = butinGant.apply(this, arguments);
    try { const c = combat;
      if (mo && mo.type === 'gorgouille' && !mo.invoque && !mo.renfort && c && !c.arene && !c.sansObjets && c.genre !== 'ile' && c.genre !== 'donjon' && gantGorgouilleOuvert() && Math.random() < GANT_GORGOUILLE.chance * prosGant()) {
        const id = tirerRare(GANT_GORGOUILLE.id, prosGant()), k = donnerObjet(id), o = OBJETS[id], L = c.loot || (c.loot = { res: {}, objets: [] }); (L.objets = L.objets || []).push(k);
        if (typeof chiffre === 'function') chiffre('✦ ' + o.nom, new T.Vector3(mo.x, (mo.m ? mo.m.position.y : 0) + (mo.haut || 2) + 0.8, mo.z), 'butin');
        toast('✦ ' + o.nom + (o.rare ? ' (rare !)' : '') + ' : la Gorgouille l\'a lâché, il est dans ton sac.', 'or'); son('quete'); if (typeof rendreHaut === 'function') rendreHaut(); }
    } catch (e) { /* rien */ } return r; }; }
/* sa ligne dans la fiche de la Gorgouille (bestiaire) */
{ const fmGant = ficheMonstre; ficheMonstre = function (t) { let h = fmGant.apply(this, arguments);
    try { if (t === 'gorgouille' && gantGorgouilleOuvert()) { const p = (Math.round(Math.min(1, GANT_GORGOUILLE.chance * prosGant()) * 1000) / 10).toString().replace('.', ',') + ' %';
      const d = '<div class="bx-drop"><img src="assets/icones/obj-gorgouille-anneau.png?v=' + VERSION_MODELES + '" alt=""><span>' + GANT_GORGOUILLE.nom + ' · ' + p + '</span></div>', i = h.indexOf('<div class="bx-drop">');
      if (i >= 0) h = h.slice(0, i) + d + h.slice(i); } } catch (e) { /* rien */ } return h; }; }

/* ================= LES PIECES DU CORPS PORTEES (26/11/2026, « fais-les, fais tout », Mathieu) : jusque-la, seules la coiffe, la cape et l'arme se voyaient
   sur le perso. Maintenant l'amulette, la ceinture, les bottes et l'anneau aussi, pour toutes les panoplies (leurs modeles sont ceux des icones, deja dans les
   fichiers du jeu ; le palier 11 : equipements-mare-objets.glb, charge a la demande), les objets du labo et le Gantelet de la Gorgouille (objets-labo.glb) :
   - la ceinture : a la taille, a la place de la ceinture du perso (calee sur elle), boucle devant ;
   - les bottes : chaque botte sur un tibia (pivot_genouG / D : elles suivent la marche), du bas du pied au genou, a la place des bottes du perso ;
   - l'amulette : son cordon fait le tour du cou (le modele est un collier vu de face : il est replie a plat autour du cou), le pendentif pend sur la poitrine ;
   - l'anneau : au poignet droit, le chaton devant.
   Version dev : visibles seulement dans le mode test tant que PIECES_CORPS.joueurs est faux (a valider par Mathieu). Reglages : PIECES_CORPS ================= */
const PIECES_CORPS = { joueurs: false, ceinture: { large: 1.07, profond: 1.12 }, bottes: { haut: 1.0, large: 1.22 }, amulette: { cou: 1.45, pend: 0.42, devant: 0.03 }, anneau: { large: 1.45 } };
const corpsVisible = () => PIECES_CORPS.joueurs || (typeof MODE_TEST !== 'undefined' && !!MODE_TEST);
const EMP_CORPS = ['amulette', 'ceinture', 'bottes', 'anneau'], FICHIER_P11_OBJ = 'equipements-mare-objets';
VISUELS_TARDIFS.add(FICHIER_P11_OBJ); VERSIONS_FICHIERS[FICHIER_P11_OBJ + '.glb'] = '20261126a';
const NOEUD_CORPS = { 'labo-fiole': 'Obj_labo_fiole', 'labo-pince': 'Obj_labo_pince', 'labo-garde': 'Obj_labo_garde', 'labo-garou': 'Obj_labo_garou', 'labo-enrage': 'Obj_labo_enrage', 'gorgouille-anneau': 'Obj_labo_gorgouille' };
function noeudCorps(id) {
  const o = baseLabo(id); if (!o || o.leg || !visuelsPrets()) return null; /* (les legendaires du corps, la Bague du joueur pro : pas de modele) */
  const n = NOEUD_CORPS[o.id]; if (n) { if (!VISUELS[FICHIER_LABO]) { chargerVisuelTardif(FICHIER_LABO); return null; } return VISUELS[FICHIER_LABO].getObjectByName(n) || null; }
  const P = PANOS[o.pano] && PANOS[o.pano].id; if (!P) return null;
  let f = FICHIER_PANO[P] || 'equipements'; if (f === 'equipements-mare') f = FICHIER_P11_OBJ; /* (le fichier du palier 11 n'a que les coiffes et les capes) */
  if (!VISUELS[f]) { if (VISUELS_TARDIFS.has(f)) chargerVisuelTardif(f); return null; }
  return VISUELS[f].getObjectByName('Obj_' + P + '_' + o.emp) || null;
}
const V3 = () => new T.Vector3();
const premiersCorps = (r) => { const L = []; r.traverse((m) => { if (m.isMesh && !(m.parent && m.parent.isMesh) && !(m.material && m.material.side === T.BackSide)) L.push(m); }); return L; };
const cloneCorps = (N) => { const c = N.clone(true); c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); c.scale.set(1, 1, 1); c.updateMatrixWorld(true); return c; };
/* poser le modele c (repere du modele) dans le noeud parent du perso, avec la matrice Mg (modele -> repere du perso g) */
function poserCorps(g, parent, c, Mg, nom) {
  g.updateMatrixWorld(true); parent.updateMatrixWorld(true);
  const L = new T.Matrix4().copy(parent.matrixWorld).invert().multiply(g.matrixWorld).multiply(Mg), grp = new T.Group(); grp.name = nom;
  L.decompose(grp.position, grp.quaternion, grp.scale); grp.add(c); parent.add(grp);
  grp.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; m.raycast = () => {}; } }); return grp;
}
/* le corps du perso, dans son repere g : les boites utiles, le sens (avant : +z ou -z) */
function corpsDe(g) {
  g.updateMatrixWorld(true); const Gi = new T.Matrix4().copy(g.matrixWorld).invert(), tous = premiersCorps(g), par = (re, dans) => tous.filter((m) => re.test(nomP(m)) && (!dans || estDans(m, dans)));
  const estDans = (m, n) => { for (let x = m; x; x = x.parent) if (x === n) return true; return false; };
  const boite = (L) => (L.length ? unionDe(L).applyMatrix4(Gi) : null), teteN = g.getObjectByName('tete'), crane = teteN ? par(/^crane/, teteN) : [];
  const ct = crane.length ? boite(crane).getCenter(V3()) : V3(), bouche = g.getObjectByName('bouche'), avant = bouche ? Math.sign(boiteDe(bouche).applyMatrix4(Gi).getCenter(V3()).z - ct.z) || 1 : 1;
  const genoux = ['G', 'D'].map((s) => g.getObjectByName('pivot_genou' + s)).filter(Boolean);
  return { Gi, tous, par, boite, avant, haut: g.getObjectByName('haut') || g, genoux, main: g.getObjectByName('main001') || g.getObjectByName('main'), estDans };
}
const tourneY = (avant) => new T.Matrix4().makeRotationY(avant < 0 ? Math.PI : 0);
/* ---- la ceinture ---- */
function porterCeintureCorps(g, N, K) {
  const R = PIECES_CORPS.ceinture, sienne = K.par(/^ceinture$/, K.haut), tun = K.par(/^tunique$/);
  let w = K.boite(sienne); if (!w && tun.length) { const b = K.boite(tun), s = b.getSize(V3()); w = new T.Box3(new T.Vector3(b.min.x, b.min.y + s.y * 0.1, b.min.z), new T.Vector3(b.max.x, b.min.y + s.y * 0.3, b.max.z)); }
  if (!w) return; const c = cloneCorps(N), P = premiersCorps(c); if (!P.length) return;
  const bande = P.slice().sort((a, b) => boiteDe(b).getSize(V3()).x - boiteDe(a).getSize(V3()).x)[0], bb = boiteDe(bande), sb = bb.getSize(V3()), cb = bb.getCenter(V3()), sw = w.getSize(V3()), cw = w.getCenter(V3());
  const kx = sw.x * R.large / sb.x, kz = Math.max(kx, sw.z * R.profond / sb.z);
  const Mg = new T.Matrix4().makeTranslation(cw.x, cw.y, cw.z).multiply(tourneY(K.avant)).multiply(new T.Matrix4().makeScale(kx, kx, kz)).multiply(new T.Matrix4().makeTranslation(-cb.x, -cb.y, -cb.z));
  poserCorps(g, K.haut, c, Mg, 'piece_ceinture');
  sienne.concat(K.par(/^(boucle|boucle_trou)$/, K.haut).filter((m) => { const b = K.boite([m]); return b && b.max.y > w.min.y - 0.05 && b.min.y < w.max.y + 0.05; })).forEach((m) => { m.visible = false; });
}
/* ---- les bottes : une par tibia ---- */
function porterBottesCorps(g, N, K) {
  const R = PIECES_CORPS.bottes;
  K.genoux.forEach((genou) => {
    const siens = premiersCorps(genou).filter((m) => m.parent === genou), sb = K.boite(siens); if (!sb) return;
    const tib = siens.filter((m) => /^tibia$/.test(nomP(m))), ctib = (tib.length ? K.boite(tib) : sb).getCenter(V3()), cote = Math.sign(ctib.x - K.boite(K.par(/^crane/)).getCenter(V3()).x) || 1;
    const genouY = new T.Vector3().setFromMatrixPosition(genou.matrixWorld).applyMatrix4(K.Gi).y, larg = (tib.length ? K.boite(tib) : sb).getSize(V3()).x;
    const c = cloneCorps(N), cm = cote * (K.avant > 0 ? 1 : -1); /* (le modele vu de face : la botte du cote x de la jambe ; tourne d'un demi-tour si le perso regarde vers -z) */
    premiersCorps(c).forEach((m) => { if (Math.sign(boiteDe(m).getCenter(V3()).x) !== cm) m.parent.remove(m); }); c.updateMatrixWorld(true);
    const P = premiersCorps(c); if (!P.length) return; const bb = unionDe(P), hb = bb.getSize(V3()).y, mi = bb.min.y + hb * 0.45;
    const haut = P.filter((m) => boiteDe(m).getCenter(V3()).y > mi), bh = unionDe(haut.length ? haut : P), ch = bh.getCenter(V3()), lh = bh.getSize(V3()).x;
    const k = Math.max((genouY - sb.min.y) * R.haut / hb, larg * R.large / lh);
    const Mg = new T.Matrix4().makeTranslation(ctib.x, sb.min.y, ctib.z).multiply(tourneY(K.avant)).multiply(new T.Matrix4().makeScale(k, k, k)).multiply(new T.Matrix4().makeTranslation(-ch.x, -bb.min.y, -ch.z));
    poserCorps(g, genou, c, Mg, 'piece_botte');
    siens.filter((m) => /^(botte|bande)$/.test(nomP(m))).forEach((m) => { m.visible = false; });
  });
}
/* ---- l'amulette : le cordon replie a plat autour du cou, le pendentif sur la poitrine ---- */
function porterAmuletteCorps(g, N, K) {
  const R = PIECES_CORPS.amulette, cou = K.par(/^cou$/), tun = K.par(/^tunique$/); if (!cou.length) return;
  const bc = K.boite(cou), cn = bc.getCenter(V3()), sc = bc.getSize(V3()), rn = Math.max(sc.x, sc.z) / 2, bt = tun.length ? K.boite(tun) : null;
  const devant = bt ? (K.avant > 0 ? bt.max.z - cn.z : cn.z - bt.min.z) : rn, torse = bt ? bt.getSize(V3()).y : 0.7;
  const c = cloneCorps(N), P = premiersCorps(c); if (!P.length) return;
  /* le cordon : un cercle debout en haut du modele (d'un seul tenant, ou une chaine de maillons) : ce qui est dans le haut du modele en donne la largeur */
  const Ytop = unionDe(P).max.y, H = P.filter((m) => boiteDe(m).getCenter(V3()).y >= Ytop - 0.55), sl = unionDe(H.length ? H : P).getSize(V3());
  const ep = Math.min(sl.z, 0.08) / 2, Rm = sl.x / 2 - ep, y0 = Ytop - ep - Rm, yb = y0 - Rm; /* (son milieu Rm, son centre y0, son bas yb) */
  const pend = P.filter((m) => boiteDe(m).max.y <= yb + 0.04), bas = pend.length ? Math.min(...pend.map((m) => boiteDe(m).min.y)) : yb, Lp = Math.max(0.05, yb - bas);
  const Rx = rn * R.cou, Rz = Math.max(rn * R.cou, devant + R.devant), s = Rx / Rm, sp = Math.min(s, R.pend * torse / Lp);
  const yN = bc.min.y + sc.y * 0.25, grp = new T.Group(), v = V3();
  P.forEach((m) => {
    const geo = m.geometry.clone(); geo.applyMatrix4(m.matrixWorld); const A = geo.attributes.position, estPend = pend.includes(m);
    for (let i = 0; i < A.count; i++) { v.fromBufferAttribute(A, i);
      if (estPend) A.setXYZ(i, v.x * sp, -(yb - v.y) * sp, Rz + v.z * sp);
      else { const dy = v.y - y0, a = Math.atan2(v.x, dy), d = Math.hypot(v.x, dy) - Rm; A.setXYZ(i, Math.sin(a) * (Rx + d * s), v.z * s, -Math.cos(a) * (Rz + d * s)); } }
    A.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
    const n = new T.Mesh(geo, m.material); n.name = m.name; m.children.forEach((k) => { if (k.isMesh) { const o = new T.Mesh(geo, k.material); o.name = k.name; n.add(o); } }); grp.add(n);
  });
  const Mg = new T.Matrix4().makeTranslation(cn.x, yN, cn.z).multiply(tourneY(K.avant)); poserCorps(g, K.haut, grp, Mg, 'piece_amulette');
}
/* ---- l'anneau : au poignet droit, le chaton devant ---- */
function porterAnneauCorps(g, N, K) {
  const R = PIECES_CORPS.anneau, main = K.main; if (!main) return; const paume = premiersCorps(main).filter((m) => m.parent === main), hb = K.boite(paume.length ? paume : premiersCorps(main)); if (!hb) return;
  const c = cloneCorps(N), P = premiersCorps(c); if (!P.length) return;
  const bande = P.slice().sort((a, b) => boiteDe(b).getSize(V3()).x - boiteDe(a).getSize(V3()).x)[0], bb = boiteDe(bande), cb = bb.getCenter(V3()), k = hb.getSize(V3()).x * R.large / bb.getSize(V3()).x, ch = hb.getCenter(V3());
  const Mg = new T.Matrix4().makeTranslation(ch.x, hb.max.y - hb.getSize(V3()).y * 0.15, ch.z).multiply(tourneY(K.avant)).multiply(new T.Matrix4().makeScale(k, k, k)).multiply(new T.Matrix4().makeRotationX(Math.PI / 2)).multiply(new T.Matrix4().makeTranslation(-cb.x, -cb.y, -cb.z));
  poserCorps(g, main, c, Mg, 'piece_anneau');
}
function porterPiecesCorps(g) {
  if (!corpsVisible() || !S_ || !S_.equip) return; const E = S_.equip; if (!EMP_CORPS.some((e) => E[e])) return;
  const K = corpsDe(g), F = { ceinture: porterCeintureCorps, bottes: porterBottesCorps, amulette: porterAmuletteCorps, anneau: porterAnneauCorps };
  EMP_CORPS.forEach((e) => { if (!E[e]) return; const N = noeudCorps(E[e]); if (!N) return; try { F[e](g, N, K); } catch (er) { console.warn('piece du corps ' + e, er); } });
}
{ const htCorps = habillerTenue; habillerTenue = function (g) { const r = htCorps.apply(this, arguments); try { porterPiecesCorps(g); } catch (e) { console.warn('pieces du corps', e); } return r; }; }
/* les modeles des pieces se chargent avec ceux des coiffes et des capes ; le portrait de la fiche change quand elles changent ; refait quand un modele arrive */
{ const rtCorps = rafraichirTenue; rafraichirTenue = function () { const r = rtCorps.apply(this, arguments);
    try { if (corpsVisible() && S_ && S_.equip && EMP_CORPS.some((e) => S_.equip[e]) && !visuelsPrets()) assurerVisuels().then((ok) => { if (ok) { for (const k in portraits) delete portraits[k]; rhabiller(); } }); } catch (e) { /* rien */ }
    return r; }; }
{ const ppCorps = portraitPerso; let dernier = ''; portraitPerso = function () { const k = corpsVisible() && S_ && S_.equip ? EMP_CORPS.map((e) => S_.equip[e] || '').join('|') : '';
    if (k !== dernier) { for (const x in portraits) delete portraits[x]; dernier = k; } return ppCorps.apply(this, arguments); }; }
{ const cvtCorps = chargerVisuelTardif; chargerVisuelTardif = function (f) { const pr = cvtCorps.apply(this, arguments);
    if (f === FICHIER_P11_OBJ && pr && !pr.corps) { pr.corps = true; pr.then((ok) => { if (!ok) return; for (const k in portraits) delete portraits[k]; try { if (modaleOuverte === 'perso') ouvrirPerso(); } catch (e) { /* rien */ } }); }
    return pr; }; }
/* le mode test : le Gantelet de la Gorgouille au jet moyen (a cote du bouton des objets du labo) */
{ const omtGant = ouvrirModeTest; ouvrirModeTest = function () { const r = omtGant.apply(this, arguments);
    try { const b = document.querySelector('[data-test-labo-sac]'); if (b && !document.querySelector('[data-test-gant-sac]')) b.insertAdjacentHTML('afterend', '<button class="btn discret" data-test-gant-sac>Me donner le Gantelet de la Gorgouille</button>'); } catch (e) { /* rien */ }
    return r; }; }
document.addEventListener('click', (e) => { if (!e.target.closest('[data-test-gant-sac]') || !estAdmin() || !MODE_TEST || combat) return;
  const id = GANT_GORGOUILLE.id, k = creerObjet(id); S_.jets[k] = Object.assign({}, OBJETS[id].stats); S_.sac[k] = 1; marquerNeuf(k);
  const monte = niveau(S_.xp) < GANT_GORGOUILLE.niv; if (monte) S_.xp = seuil(GANT_GORGOUILLE.niv); vieAuMax(); rendreHaut();
  toast('Le Gantelet de la Gorgouille dans ton sac, au jet moyen' + (monte ? ' ; te voilà niveau ' + GANT_GORGOUILLE.niv + ' pour le porter' : '') + '. Bouton Perso pour le voir.', 'or');
  if (modaleOuverte === 'mode-test') ouvrirModeTest();
});
