'use strict';
/* ===================== LE LEURRE A WABBITS =====================
   (19/10/2026, Mathieu : « un piege anti-Wabbit, un peu comme l'epouvantail, mais une fausse Cawotte qui les attire dessus plutot que les champs, et apres
   c'est a nous de les tuer quand meme » ; « pas empoisonner, c'est vicieux, il faudrait un truc sympa » ; il retient les trois niveaux proposes : la fausse
   Cawotte en bois peint, la Cawotte au caramel, le panier a ressort (10 000, 20 000 et 40 000 kamas) ; « il faut pas que ca attire les Wabbits des vagues,
   uniquement ceux qui arrivent entre deux »).
   Un batiment d'une case, pose a l'achat sur l'herbe libre la plus proche de tes Cawottes et de tes Fraises (il se deplace dans Amenager). Un Wabbit qui vient
   manger un champ file dessus (ATTIRE_LEURRE : 1 sur 2, 3 sur 4, puis tous) : il ronge du bois et ne vole rien. Niveau 1 : il repart au bout de
   DUREE_PICORAGE. Niveau 2 : il reste colle au caramel jusqu'a ce qu'on vienne. Niveau 3 : le panier lui tombe dessus. Un seul a la fois (S_.leurreWabbit).
   On le chasse (ou on le relache) en touchant le leurre : de l'XP, et un Poil de Wabbit une fois sur deux. Les Wabbits des vagues ne le voient pas. */
let leurreMesh = null;
function caseLibreLeurre() { /* une case d'herbe libre, la plus proche de tes Cawottes et de tes Fraises (sinon de tes champs), qui ne coupe aucun acces */
  const F = S_.cases.filter((c) => c.type === 'champ' && WABBIT_MANGE.includes(c.c)), C = F.length ? F : S_.cases.filter((c) => c.type === 'champ'), P = C.map(posCase);
  const cx = P.length ? P.reduce((t, q) => t + q.x, 0) / P.length : 0, cz = P.length ? P.reduce((t, q) => t + q.z, 0) / P.length : 0, d = (c) => Math.hypot(posCase(c).x - cx, posCase(c).z - cz);
  const deja = inaccessibles(), L = S_.cases.filter((c) => c.type === 'libre' && !(S_.sauvage && S_.sauvage.id === c.id)).sort((a, b) => d(a) - d(b));
  for (const c of L.slice(0, 80)) { c.type = 'leurre'; const bloque = inaccessibles().some((x) => !deja.includes(x)); c.type = 'libre'; if (!bloque) return c; }
  return null;
}
/* un Wabbit arrive pour manger le champ p : le leurre l'attire peut-etre, sinon il s'installe sur le champ */
function arriveeWabbit(p, maintenant, ch) {
  const n = niv('leurre'), nom = PAR_ID[p.c].nom, premier = !S_.vuWabbitChamp; S_.vuWabbitChamp = true;
  if (n && blocBati('leurre') && !S_.leurreWabbit && Math.random() < ATTIRE_LEURRE[Math.min(3, n)]) {
    S_.leurreWabbit = { depuis: maintenant }; majLeurre(); rendreCasesBulles();
    toast(n >= 3 ? 'Un Wabbit venu pour ta ' + nom + ' a préféré ta fausse Cawotte : le panier lui est tombé dessus ! Viens le relâcher.'
      : 'Un Wabbit venu pour ta ' + nom + ' fonce sur ta fausse Cawotte ! ' + (n >= 2 ? 'Il est collé au caramel : viens le chasser.' : 'Il ronge du bois sans rien voler : va le chasser.'), 'alerte');
    return;
  }
  p.tofu = maintenant; p.nuisible = 'wabbit'; ch.add(p.id);
  toast('Un Wabbit grignote ta ' + nom + ' ! Chasse-le dans les ' + dureeLisible(DUREE_PICORAGE * (niv('cloche') ? 2 : 1)) + ', sinon il te vole une récolte.' + (premier ? ' Les Wabbits n\'ont pas peur de l\'épouvantail : à toi de les chasser, ou pose un leurre à Wabbits (HDV, Améliorations, Défense).' : ''), 'alerte');
}
/* le leurre en 3D, refait a chaque changement (niveau, Wabbit pris ou chasse, deplacement) */
function majLeurre() {
  if (leurreMesh) { jeter(leurreMesh); leurreMesh = null; } delete ancres.leurre;
  if (!S_ || typeof scene === 'undefined') return;
  const o = blocBati('leurre'), n = niv('leurre'); if (!o || !n) return;
  leurreMesh = marquer(fabriquerLeurre(n, !!S_.leurreWabbit), o.c0.id); poser(leurreMesh, o.x, o.y, o.z, rotDe('leurre'));
  ancres.leurre = new T.Vector3(o.x, o.y + 2.6, o.z); /* (plus haut : le leurre a grandi, 20/10/2026) */
}
/* LE MODELE : une Cawotte taillee dans le bois a facettes et peinte (des bandes plus foncees, la coupe du haut laissee en bois brut, des fanes en planchettes),
   plantee dans une butte de terre et tenue par un tuteur. Niveau 2 : un caramel dore nappe le haut et coule le long des facettes. Niveau 3 : un panier
   d'osier tresse retourne, releve vers toi sur un baton entoure de son ressort, une ficelle du baton a la Cawotte ; quand un Wabbit tire dessus, le panier
   tombe : on ne voit plus que ses oreilles, qui depassent par le trou du fond. Tout est pose dans « axe » : +z vers la camera (vue par defaut), +x a droite. */
function fabriquerLeurre(n, wabbit) {
  const g = new T.Group(), axe = new T.Group(); axe.rotation.y = Math.PI / 4; g.add(axe);
  const BOIS = '#d2a874', TUTEUR = '#8a5a32', ORANGE = '#ef7d22', BANDE = '#c95d14', VERT = '#4fae3a', CARAMEL = '#f0b545', FICELLE = '#e2cf98';
  const plat = (geo, c) => maille(geo, c, { flatShading: true });
  /* LA DALLE DE TERRE (20/10/2026, « toute la case, une petite dalle de terre, qu'on voie qu'il y a quelque chose », Mathieu) : un carre de terre battue
     un peu sureleve, borde plus fonce, seme de mottes ; alignee sur la case (dans g, pas dans axe qui est tourne d'un quart) */
  const bord = plat(new T.BoxGeometry(1.94, 0.05, 1.94), '#5e3d22'); bord.position.y = 0.025; g.add(bord);
  const dalle = plat(new T.BoxGeometry(1.82, 0.09, 1.82), '#86603a'); dalle.position.y = 0.045; g.add(dalle);
  [[-0.62, -0.55, 0.09], [0.58, -0.66, 0.07], [-0.7, 0.48, 0.08], [0.66, 0.6, 0.09], [0.1, 0.74, 0.06], [-0.2, -0.78, 0.065], [0.78, 0.0, 0.06], [-0.8, -0.08, 0.07]].forEach(([x, z, r], k) => {
    const m = sphere(r, k % 2 ? '#9a7048' : '#6a4626', 1); m.scale.set(1, 0.5, 1); m.position.set(x, 0.09, z); g.add(m); });
  const K = n >= 3 ? 1.3 : 1.55; axe.scale.setScalar(K); axe.position.y = 0.09; /* (plus grande : sur une case de 2, elle passait inapercue) */
  const cw = new T.Group(); axe.add(cw); /* la fausse Cawotte, sa butte et son tuteur */
  const butte = sphere(0.38, '#7a5232', 1); butte.scale.set(1, 0.22, 1); cw.add(butte);
  /* la Cawotte : un tronc de cone a 8 facettes, pointe en bas, enfoncee dans la butte ; R au sommet, H de haut, sa pointe a Y0 */
  const R = 0.24, H = 0.95, Y0 = -0.12, HAUT = Y0 + H, r = (y) => Math.max(0.006, R * (y - Y0) / H), A8 = Math.cos(Math.PI / 8);
  const corps = plat(new T.CylinderGeometry(R, 0.006, H, 8), ORANGE); corps.position.y = Y0 + H / 2; cw.add(corps);
  [[0.2, 0.26], [0.4, 0.46], [0.6, 0.66]].forEach(([y1, y2]) => { /* les bandes peintes : des tranches du meme cone, a peine plus larges */
    const b = plat(new T.CylinderGeometry(r(y2) * 1.025, r(y1) * 1.025, y2 - y1, 8), BANDE); b.position.y = (y1 + y2) / 2; cw.add(b); });
  const coupe = plat(new T.CylinderGeometry(R * 0.97, R * 0.97, 0.03, 8), BOIS); coupe.position.y = HAUT + 0.012; cw.add(coupe); /* le bois brut, a la coupe */
  [-0.5, 0, 0.5].forEach((a, k) => { /* les fanes : trois planchettes peintes en vert, plantees dans la coupe */
    const geo = new T.BoxGeometry(0.1, 0.42, 0.028); geo.translate(0, 0.21, 0); const f = plat(geo, VERT); f.position.set(0, HAUT, (k - 1) * 0.03); f.rotation.set(0, (k - 1) * 0.35, -a); cw.add(f); });
  const tuteur = plat(new T.BoxGeometry(0.07, HAUT + 0.12, 0.07), TUTEUR); tuteur.position.set(0, (HAUT + 0.12) / 2 - 0.05, -(R + 0.035)); cw.add(tuteur); /* derriere elle */
  const lien = new T.Mesh(new T.TorusGeometry(0.06, 0.012, 4, 10), mat(FICELLE)); lien.position.set(0, HAUT - 0.06, -(R + 0.005)); lien.rotation.x = Math.PI / 2; cw.add(lien); /* la ficelle qui la tient au tuteur */
  if (n >= 2) { /* le caramel : une nappe doree sur la coupe, et des coulures fines, chacune au milieu d'une facette, qui finissent en goutte */
    const nappe = sphere(0.22, CARAMEL, 2); nappe.scale.set(1.12, 0.22, 1.12); nappe.position.y = HAUT + 0.035; cw.add(nappe);
    const pente = Math.atan(R * A8 / H);
    [[0, 0.3], [1, 0.18], [2, 0.38], [4, 0.24], [5, 0.34], [7, 0.2]].forEach(([k, L]) => { const dg = new T.Group(); dg.rotation.y = (k + 0.5) * Math.PI / 4; cw.add(dg);
      const yc = HAUT - L / 2, c = sphere(0.032, CARAMEL, 1); c.scale.set(1, L / 0.064, 0.45); c.position.set(0, yc, r(yc) * A8 + 0.008); c.rotation.x = pente; dg.add(c);
      const yb = HAUT - L + 0.02, goutte = sphere(0.042, CARAMEL, 1); goutte.scale.set(1, 1.15, 0.8); goutte.position.set(0, yb, r(yb) * A8 + 0.022); dg.add(goutte); });
  }
  let panier = null, w = null;
  if (n >= 3) { /* le panier a ressort : la Cawotte, plus petite, a droite sous le panier ; le panier pivote sur son bord arriere */
    cw.scale.setScalar(0.62); cw.position.x = 0.22;
    const RB = 0.62, RH = 0.5, HP = 0.82, ANG = wabbit ? 0 : 0.8, piv = new T.Group(); piv.position.set(0, 0, -RB); axe.add(piv); piv.rotation.x = -ANG;
    panier = new T.Group(); panier.position.set(0, 0, RB); piv.add(panier);
    const geo = new T.CylinderGeometry(RH, RB, HP, 24, 8, true).toNonIndexed(); geo.translate(0, HP / 2, 0); /* la paroi tressee : un damier d'osier clair et fonce */
    const P = geo.attributes.position, col = new Float32Array(P.count * 3), clair = new T.Color('#d8a866'), fonce = new T.Color('#a26e36');
    for (let i = 0; i < P.count; i += 3) { let x = 0, y = 0, z = 0; for (let k = 0; k < 3; k++) { x += P.getX(i + k); y += P.getY(i + k); z += P.getZ(i + k); }
      const sa = Math.floor((Math.atan2(x, z) + Math.PI) / (2 * Math.PI) * 24), sy = Math.floor(y / 3 / HP * 8), c = (sa + sy) % 2 ? clair : fonce; for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (i + k) * 3); }
    geo.setAttribute('color', new T.BufferAttribute(col, 3));
    const paroi = new T.Mesh(geo, mat('#ffffff', { side: T.DoubleSide, vertexColors: true, flatShading: true })); paroi.castShadow = true; panier.add(paroi);
    const fond = new T.Mesh(new T.RingGeometry(0.17, RH, 24), mat('#a26e36', { side: T.DoubleSide })); fond.rotation.x = -Math.PI / 2; fond.position.y = HP; panier.add(fond); /* le fond, troue au milieu */
    [[RB, 0.03, 0.02], [RH, 0.025, HP], [0.17, 0.02, HP]].forEach(([rr, e, y]) => { const b = new T.Mesh(new T.TorusGeometry(rr, e, 5, 24), mat('#7d5428')); b.rotation.x = Math.PI / 2; b.position.y = y; panier.add(b); }); /* les bords tresses */
    const bout = new T.Vector3(0, Math.sin(ANG) * 2 * RB, -RB + Math.cos(ANG) * 2 * RB); /* le bord releve, pose sur le baton */
    if (!wabbit) { /* arme : le baton sous le bord, son ressort enroule au pied, la ficelle jusqu'a la Cawotte */
      const baton = plat(new T.BoxGeometry(0.05, bout.y, 0.05), TUTEUR); baton.position.set(0, bout.y / 2, bout.z); axe.add(baton);
      for (let k = 0; k < 5; k++) { const sp = new T.Mesh(new T.TorusGeometry(0.042, 0.01, 4, 12), mat('#7d8a92')); sp.rotation.x = Math.PI / 2; sp.position.set(0, 0.03 + k * 0.035, bout.z); axe.add(sp); }
      const a = new T.Vector3(0.03, 0.12, bout.z), b = new T.Vector3(0.22 - 0.62 * (r(0.3) * A8 + 0.004), 0.62 * 0.3, 0), d = b.clone().sub(a);
      const fil = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, d.length(), 4), mat(FICELLE)); fil.position.copy(a).add(b).multiplyScalar(0.5); fil.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); axe.add(fil);
    } else { /* tombe : le baton gît devant, le ressort detendu a cote */
      const baton = plat(new T.BoxGeometry(0.05, 0.62, 0.05), TUTEUR); baton.rotation.z = Math.PI / 2; baton.position.set(-0.1, 0.025, RB + 0.14); axe.add(baton);
      if (MODELES.wabbit) { w = cloner('wabbit'); w.scale.multiplyScalar(0.85); axe.add(w); } /* sous le panier : seules ses oreilles depassent du fond */
    }
  } else if (wabbit && MODELES.wabbit) { /* le Wabbit, a droite de la Cawotte, qui la ronge */
    const tient = new T.Group(); tient.position.set(0.46, 0, 0.06); tient.rotation.y = Math.atan2(-0.46, -0.06); axe.add(tient); /* (tourne vers la Cawotte : il pique du nez dans son propre axe) */
    w = cloner('wabbit'); w.scale.multiplyScalar(0.85 / K); tient.add(w); /* (le Wabbit garde sa taille, seul le leurre grandit) */
  }
  g.userData.anim = { w, panier, wx: w ? w.rotation.x : 0, wz: w ? w.rotation.z : 0 };
  return g;
}
/* a chaque image : le Wabbit ronge (il pique du nez sur la Cawotte) ; pris au panier, le panier tressaute de temps en temps et ses oreilles s'agitent */
function animerLeurre(s) {
  if (!leurreMesh) return; const A = leurreMesh.userData.anim; if (!A) return;
  if (A.w && !A.panier) A.w.rotation.x = A.wx + 0.1 + Math.sin(s * 9) * 0.08;
  if (A.panier && A.w) { const secoue = Math.sin(s * 1.3) > 0.55; A.panier.rotation.z = secoue ? Math.sin(s * 22) * 0.03 : 0; A.w.rotation.z = A.wz + (secoue ? Math.sin(s * 22) * 0.05 : 0); }
}
function ouvrirLeurre() {
  const n = niv('leurre'), w = S_.leurreWabbit;
  const etat = n >= 3 ? 'Le panier à ressort : tous les Wabbits filent sur la fausse Cawotte, et le panier leur tombe dessus. À toi de venir les relâcher.'
    : n === 2 ? 'La Cawotte au caramel : trois Wabbits sur quatre y vont au lieu de tes champs, et ils y restent collés jusqu\'à ce que tu viennes les chasser.'
    : 'La fausse Cawotte en bois peint : un Wabbit sur deux y va au lieu de tes champs. Il ronge du bois sans rien voler, et repart au bout de ' + dureeLisible(DUREE_PICORAGE) + '.';
  ouvrirModale('leurre', entete('Le leurre à Wabbits') + '<div class="art">' + ico('cawotte') + '<div><b>' + ['', 'La fausse Cawotte', 'La Cawotte au caramel', 'Le panier à ressort'][Math.min(3, n)] + '</b><div class="desc">' + etat +
    (w ? ' Un Wabbit y est en ce moment : touche le leurre pour ' + (n >= 3 ? 'le relâcher.' : 'le chasser.') : '') + ' Il n\'attire que les Wabbits qui viennent manger tes Cawottes et tes Fraises entre deux vagues, pas ceux des vagues.</div></div><div></div></div>' +
    lignesAmelio(['leurre'], 'Contre les Wabbits'));
}
