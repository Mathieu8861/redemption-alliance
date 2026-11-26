'use strict';
/* LA FIN DU DONJON DES WABBITS (24/11/2026, Mathieu par Discord : « continue de construire et de creer sur le donjon Wabbit, que ce soit les monstres, les
   animations, les decors... go go go »). Version dev : le donjon n'existe que dans le mode test (ILE-DONJON.md).
   L'histoire (20/11) : vaincre le Docteur Wabbenstein dans son labo pour liberer les Wabbits. Quand il tombe :
   - ses creatures encore debout s'effondrent ;
   - les Wabbits prisonniers sortent des cages du labo (deux par cage), sautillent de joie autour du perso (petits coeurs), puis filent par la porte ;
   - le coffre du labo s'ouvre (l'ecran des coffres, 29m) : kamas, Poils de Wabbit, runes ; la premiere victoire ajoute une rune parfaite sure ;
   - le bilan garde le record de temps (S_.donjons.wabbits : record en secondes, nombre de victoires).
   Et, plus bas, la scene d'entree du Docteur dans son labo. */
const FIN_LABO = { duree: 6.2, parCage: 2, coffre: { kamas: kamasGagnes(100000), poils: 12, forge: 2, parfaite: 0.35, cristal: 3 } }; /* (cristal : les cristaux runiques, 29t) */
const etatDonjons = () => (S_.donjons = S_.donjons || {}), etatDonjonWab = () => (etatDonjons().wabbits = etatDonjons().wabbits || { record: 0, fois: 0 });
let wabbitsLibres = [], boucleLibres = false;
/* les cages du labo : les obstacles ronds de rayon 1 contre le mur, a R - 1,2 du centre (ile-labo-salles.py, salle_labo) */
function cagesLabo() { const S = SALLES_LABO[4]; return (S.blocs || []).filter((b) => Math.abs(b.r - 1.0) < 0.1 && Math.abs(Math.hypot(b.x, b.z) - (S.R - 1.2)) < 0.3); } /* (les cages sont a R - 1,2 ; les paillasses, de meme rayon, a R - 2) */
function liberationLabo() {
  const c = combat, E = donjonEtat; if (!c || !E || E.liberes) return; E.liberes = true; adieuDocteur();
  c.monstres.forEach((o) => { if (o.etat === 'actif' && !o.d.boss) { try { blesser(o, o.pv + 10, true); } catch (e) { /* rien */ } } }); /* (ses creatures tombent avec lui) */
  const S = SALLES_LABO[4];
  let cages = cagesLabo(); if (!cages.length) cages = [0, 1, 2, 3].map((k) => { const a = ENTREE_SALLE + Math.PI + (k - 1.5) * 0.5; return { x: Math.cos(a) * (S.R - 1.4), z: Math.sin(a) * (S.R - 1.4) }; });
  (S.prisonniers || []).forEach((w) => { w.visible = false; }); /* (ceux des cages en sortent, 29c) */
  libererWabbits(4, cages, FIN_LABO.parCage, CAGES_LABO.types[4]); /* (les Gwand Wabbits, prisonniers du labo) */
  toast('Les cages s\'ouvrent : les Wabbits sont libres ! Ils viennent te remercier.', 'or'); son('quete');
}
/* LES CAGES DES SALLES (24/11/2026, « plutot des cages sur les cotes qu'on libere en cliquant dessus, des Wabbits differents a chaque etage », Mathieu ; avant, trois
   Wabbits sortaient tout seuls du fond de chaque salle nettoyee) : on touche une cage, le perso y va ; la salle nettoyee, elle s'ouvre et ses Wabbits (le type de
   l'etage, CAGES_LABO de 29c) sautent de joie puis filent par la porte. Le bilan compte les Wabbits liberes */
function cageVisee(p) { const E = donjonEtat, P = E && E.perso; if (!P || P.mode !== 'salle' || !(P.i < 4) || !ileWabbits) return null; const S = SALLES_LABO[P.i], I = ileWabbits.userData.salles[P.i]; if (!I || !I.cages) return null;
  const lx = p.x - DONJON.x - S.x, lz = p.z - DONJON.z - S.z; let k0 = null, bd = 1.9; I.cages.forEach((C, k) => { if (C.ouverte) return; const d = Math.hypot(C.x - lx, C.z - lz); if (d < bd) { bd = d; k0 = k; } }); return k0; }
{ const cheminCage = cheminDonjon; cheminDonjon = function (p) { const E = donjonEtat, k = cageVisee(p); if (E) E.cage = null; if (k == null) return cheminCage.apply(this, arguments);
    const i = E.perso.i, S = SALLES_LABO[i], C = ileWabbits.userData.salles[i].cages[k], d = Math.hypot(C.x, C.z) || 1, f = Math.max(0, 1 - 1.6 / d);
    E.cage = { i, k }; return cheminCage.call(this, { x: DONJON.x + S.x + C.x * f, y: Y_SALLE, z: DONJON.z + S.z + C.z * f }); }; }
function ouvrirCageLabo(i, k) {
  const E = donjonEtat, I = ileWabbits && ileWabbits.userData.salles[i], C = I && I.cages[k]; if (!E || !C || C.ouverte) return; C.ouverte = true; E.cage = null;
  const P0 = ileWabbits.userData.protos; if (P0 && P0.cageOuverte) { const o = P0.cageOuverte.clone(true); o.position.copy(C.grp.position); o.rotation.copy(C.grp.rotation); o.traverse((q) => { q.raycast = () => {}; }); C.grp.parent.add(o); C.grp.parent.remove(C.grp); C.grp = o; }
  if (C.wab.parent) C.wab.parent.remove(C.wab);
  libererWabbits(i, [{ x: C.x, z: C.z }], FIN_LABO.parCage, C.type); E.wabLiberes = (E.wabLiberes || 0) + FIN_LABO.parCage; son('quete'); E.cagesOuvertes = (E.cagesOuvertes || 0) + 1; majSuccesWabbits(E);
  toast('La cage s\'ouvre : ' + FIN_LABO.parCage + ' ' + (CAGES_LABO.noms[C.type] || 'Wabbits') + ' sont libres !', 'or');
}
{ const tickDonjonCages = tickDonjon; tickDonjon = function () { const r = tickDonjonCages.apply(this, arguments);
    try { const E = donjonEtat, p = paysanMesh.position; if (E && E.cage && E.perso.mode === 'salle' && E.perso.i === E.cage.i) { const S = SALLES_LABO[E.cage.i], C = ileWabbits.userData.salles[E.cage.i].cages[E.cage.k];
        if (C && Math.hypot(p.x - DONJON.x - S.x - C.x, p.z - DONJON.z - S.z - C.z) < 2.2) { if (E.salles[E.cage.i] && E.salles[E.cage.i].fini) ouvrirCageLabo(E.cage.i, E.cage.k); else { const n = combat.monstres.filter((o) => o.etat === 'actif' && o.salle === E.cage.i).length; chiffre('Verrouillée', new T.Vector3(DONJON.x + S.x + C.x, Y_SALLE + 2.2, DONJON.z + S.z + C.z));
          toast('Cage verrouillée : ' + (n ? 'encore ' + n + ' mutant' + (n > 1 ? 's' : '') + ' dans la salle. ' : '') + 'Abats tous les mutants, la clé de la salle ouvre les cages : touche-les ensuite pour libérer les Wabbits.', 'alerte'); E.cage = null; } } } /* (25/11/2026, au formulaire : « salle nettoyee d'abord », Mathieu ; le message dit combien il en reste) */
      /* les prisonniers dans leurs cages : un petit sautillement de temps en temps */
      const P = E && E.perso, I = P && P.mode === 'salle' && ileWabbits.userData.salles[P.i]; if (I && I.cages) { const t = E.t; I.cages.forEach((C) => { if (C.ouverte) return; const h = Math.max(0, Math.sin(t * 2.2 + C.ph)); C.wab.position.y = 0.06 + (h > 0.92 ? (h - 0.92) * 3 : 0); C.wab.rotation.y = C.ry + Math.sin(t * 0.7 + C.ph) * 0.4; }); } } catch (e) { /* rien */ }
    return r; }; }
/* des Wabbits prisonniers liberes dans la salle i : ils sortent de leurs cages (sources, en coordonnees de la salle), sautent de joie autour du perso, filent par
   la porte. Aussi a chaque salle nettoyee (24/11/2026, 3 Wabbits : des cages de la salle 1, du fond des autres) */
function libererWabbits(i, sources, parSource, type) {
  const S = SALLES_LABO[i], cx = DONJON.x + S.x, cz = DONJON.z + S.z, sortie = { x: cx + Math.cos(ENTREE_SALLE) * (S.R - 1.1), z: cz + Math.sin(ENTREE_SALLE) * (S.R - 1.1) }, p = paysanMesh.position;
  sources.forEach((g, k) => { for (let j = 0; j < parSource; j++) {
    const m = cloner(type && MODELES[type] ? type : 'wabbit'), x0 = cx + g.x * 0.9, z0 = cz + g.z * 0.9; m.position.set(x0, Y_SALLE, z0); m.traverse((q) => { q.raycast = () => {}; }); scene.add(m);
    const a = Math.random() * Math.PI * 2, rr = 1.6 + Math.random() * 1.8; /* (sa place pour sauter de joie, autour du perso) */
    wabbitsLibres.push({ m, x: x0, z: z0, ry: 0, t: -(k * 0.35 + j * 0.2), joie: { x: p.x + Math.cos(a) * rr, z: p.z + Math.sin(a) * rr }, sortie, coeur: Math.random(), ech: m.scale.x });
    pouf(x0, Y_SALLE, z0, 1.0, '#cfeaff'); } });
  if (boucleLibres) return; boucleLibres = true; /* (une seule boucle pour tous) */
  effets.push((dt) => {
    if (!wabbitsLibres.length) { boucleLibres = false; return true; }
    wabbitsLibres.forEach((W) => { W.t += dt; if (W.t < 0) return;
      const vise = W.t < 3.4 ? W.joie : W.sortie, dx = vise.x - W.x, dz = vise.z - W.z, d = Math.hypot(dx, dz), v = W.t < 3.4 ? 2.6 : 4.2;
      if (d > 0.25) { const pas = Math.min(d, v * dt); W.x += dx / d * pas; W.z += dz / d * pas; W.ry = Math.atan2(dx, dz); }
      else if (W.t < 3.4) { W.ry += dt * 2.2; } /* (arrive : il tourne sur lui-meme en sautant) */
      const saut = Math.abs(Math.sin(W.t * (W.t < 3.4 && d <= 0.25 ? 7 : 9))) * (d <= 0.25 ? 0.55 : 0.32);
      W.m.position.set(W.x, Y_SALLE + saut, W.z); W.m.rotation.y = W.ry;
      if (W.t > 0.6 && W.t < 3.4 && (W.coeur += dt) > 0.55) { W.coeur = Math.random() * 0.2; emettre(FX_LUM, 1, { x: W.x, y: Y_SALLE + 1.1 + saut, z: W.z, r: 0.05, v: [0, 1.0, 0], dv: 0.15, vie: [0.8, 1.1], taille: [0.32, 0.08], c: ['#ff8fb3', '#ff6f9a', '#ffd1e0'], a: 0.95, frein: 1 }); }
      if (W.t >= 3.4 && d < 0.6 && !W.parti) { W.parti = true; pouf(W.x, Y_SALLE, W.z, 0.8, '#d9ffd0'); } /* (il passe la porte) */
      if (W.parti) { W.fin = (W.fin || 0) + dt; W.m.scale.setScalar(W.ech * Math.max(0.01, 1 - W.fin * 3)); } });
    wabbitsLibres = wabbitsLibres.filter((W) => { if (W.fin > 0.35 || !combat) { scene.remove(W.m); return false; } return true; });
    if (!wabbitsLibres.length) { boucleLibres = false; return true; } return false;
  });
}
/* LA SCENE D'ENTREE DU DOCTEUR (24/11/2026) : on entre dans le labo, il est dos a nous, penche sur sa grande cuve ; trois repliques dans sa bulle, il se
   retourne, rugit (l'ecran tremble), puis le combat commence. Invulnerable et sans attaquer pendant la scene (5,2 s) ; une derniere replique a sa mort */
const SCENE_DOC = { duree: 5.2, tourne: 1.7, rugit: 3.4, repliques: [[0.3, 'Encore une goutte de mutagène... voilà, parfait.', 1.5], [1.9, 'Hm ? Un visiteur ? Dans MON labo ?', 1.5], [3.5, 'Ah ! Il me manquait justement un cobaye !', 2.2]] };
let bulleDoc = null;
function direDoc(texte, duree) {
  if (!bulleDoc) { bulleDoc = document.createElement('div'); bulleDoc.className = 'bulle parole doc'; bulleDoc.dataset.ancre = 'docWab'; zoneBulles.appendChild(bulleDoc); }
  bulleDoc.innerHTML = '<small>Docteur Wabbenstein</small>' + texte; bulleDoc.dataset.fin = performance.now() + (duree || 2) * 1000; ancres.docWab = ancres.docWab || new T.Vector3();
}
function majBulleDoc(doc) { if (!bulleDoc) return; if (performance.now() > +bulleDoc.dataset.fin || !doc || !doc.m) { finBulleDoc(); return; } doc.m.getWorldPosition(ancres.docWab); ancres.docWab.y += (doc.haut || 3.6) * 0.95 + 0.4; }
function finBulleDoc() { delete ancres.docWab; if (bulleDoc) { bulleDoc.remove(); bulleDoc = null; } }
function sceneDocteur() {
  const c0 = combat, E = donjonEtat, S = SALLES_LABO[4], R = SCENE_DOC.repliques; let t = 0, doc = null, k = 0, zoom0 = null;
  const finCamera = () => { if (E) E.cameraVers = null; if (zoom0 != null) { zoom = zoom0; zoom0 = null; cadrer(); } };
  effets.push((dt) => {
    if (!c0 || combat !== c0 || c0.fin) { finBulleDoc(); finCamera(); return true; }
    if (!doc) { doc = c0.monstres.find((o) => o.type === 'wabbenstein' && o.etat === 'actif'); if (!doc || !doc.m) { doc = null; return (t += dt) > 8; }
      doc.wabInvuln = true; doc.wabOccupe = true; doc.dosT = Math.atan2(DONJON.x + S.x + Math.cos(ENTREE_SALLE + Math.PI) * S.R - doc.x, DONJON.z + S.z + Math.sin(ENTREE_SALLE + Math.PI) * S.R - doc.z); } /* (face a sa cuve, au fond : dos au perso) */
    { const pp = paysanMesh.position; if (E) E.cameraVers = { x: doc.x * 0.72 + pp.x * 0.28, z: doc.z * 0.72 + pp.z * 0.28 }; if (zoom0 == null) { zoom0 = zoom; zoom = 1.05; cadrer(); } } /* (la camera sur lui, un peu plus pres, le temps de la scene) */
    t += dt; doc.bloqueT = Math.max(doc.bloqueT || 0, 0.3); doc.cd = Math.max(doc.cd || 0, 0.5);
    while (k < R.length && t >= R[k][0]) { direDoc(R[k][1], R[k][2]); k++; }
    const pp = paysanMesh.position, vise = t < SCENE_DOC.tourne ? doc.dosT : Math.atan2(pp.x - doc.x, pp.z - doc.z); doc.ryForce = vise; /* (ryForce : son comportement de combat le tournait vers le perso a chaque image ; stable, il tourne en douceur, ryLisse) */
    if (t >= SCENE_DOC.rugit && !doc.rugi) { doc.rugi = true; if (!geste(doc, 'rugir', true)) geste(doc, 'appel', true); secousse(0.3, 0.5); son('vague', null, 2); }
    majBulleDoc(doc);
    if (t >= SCENE_DOC.duree || doc.etat !== 'actif') { doc.wabInvuln = false; doc.wabOccupe = false; doc.dosT = null; doc.ryForce = null; finCamera(); if (doc.etat === 'actif') toast('Le Docteur Wabbenstein attaque !', 'alerte'); return !bulleDoc; }
    return false;
  });
}
{ const ryLisseScene = ryLisse; ryLisse = function (mo) { if (mo && mo.ryForce != null) mo.ry = mo.ryForce; return ryLisseScene.apply(this, arguments); }; }
{ const ouvrirSalleLaboScene = ouvrirSalleLabo; ouvrirSalleLabo = function (i) { const neuve = !!(donjonEtat && !donjonEtat.salles[i]); const r = ouvrirSalleLaboScene.apply(this, arguments); if (i === 4 && neuve) sceneDocteur(); return r; }; }
/* sa derniere replique, quand il tombe */
function adieuDocteur() { const doc = combat && combat.monstres.find((o) => o.type === 'wabbenstein'); if (!doc || !doc.m) return; direDoc('Non... mes créations... mes petits...', 2.4); let t = 0;
  effets.push((dt) => { t += dt; majBulleDoc(doc); return t > 2.6 || !bulleDoc; }); }
function retirerWabbitsLibres() { wabbitsLibres.forEach((W) => scene.remove(W.m)); wabbitsLibres = []; boucleLibres = false; }
/* le coffre et le record, au bilan d'une victoire */
{ const finDonjonLabo = finDonjon; finDonjon = function (gagne) {
    const E = donjonEtat, c = combat, t = E ? E.t : 0, enJeu = !!(c && !c.fin && c.genre === 'donjon');
    retirerWabbitsLibres(); const r = finDonjonLabo.apply(this, arguments);
    try { const recap0 = document.querySelector('#carte .recap-combat'); if (recap0 && E && enJeu) recap0.insertAdjacentHTML('beforeend', ligneRecap('renfort', 'Wabbits libérés', (E.wabLiberes || 0) + ' des cages' + (gagne ? ', et ceux du labo' : '')).replace('class="rc-l"', 'class="rc-l large"')); /* (sur toute la largeur : la phrase depassait a droite, 25/11/2026) */ } catch (e) { /* rien */ }
    if (!gagne || !enJeu) return r;
    try {
      const W = etatDonjonWab(), ancien = W.record, premier = !W.fois, nouveau = !ancien || t < ancien; W.fois++; if (nouveau) W.record = Math.round(t);
      const C = FIN_LABO.coffre, G = S_.grange = S_.grange || {}, parfaite = premier || Math.random() < C.parfaite ? 1 : 0;
      S_.kamas += C.kamas; G.poil_wabbit = (G.poil_wabbit || 0) + C.poils; if (typeof gagnerCristaux === 'function') gagnerCristaux(C.cristal); runes().forge = (runes().forge || 0) + C.forge; if (parfaite) runes().parfaite = (runes().parfaite || 0) + 1;
      sauver(); rendreHaut(); rendreGrange();
      const duree = (s) => { s = Math.round(s); const m = Math.floor(s / 60); return (m ? m + ' min ' : '') + (s % 60) + ' s'; };
      const recap = document.querySelector('#carte .recap-combat');
      if (recap) recap.insertAdjacentHTML('beforeend', ligneRecap('etoile', 'Record', nouveau ? duree(t) + (ancien ? ' (nouveau record ! avant : ' + duree(ancien) + ')' : ' (ton premier)') : duree(ancien) + ' (cette fois : ' + duree(t) + ')'));
      const aide = document.querySelector('#carte .hdv-aide'); if (aide) aide.textContent = 'Essai (version dev) : les Wabbits sont libres ! Coffre du labo : ' + fmt(C.kamas) + ' kamas, ' + C.poils + ' Poils de Wabbit, ' + C.forge + ' runes de forgemagie, ' + C.cristal + ' cristaux runiques' + (parfaite ? ', 1 rune parfaite' : '') + '. Victoire n° ' + W.fois + '.';
      const cartes = [{ ico: 'kama', n: C.kamas, t: 'kamas', son: 'kamas' }, { ico: 'poil_wabbit', n: C.poils, t: 'Poils de Wabbit' }, { ico: 'rune-forge', n: C.forge, t: 'runes de forgemagie', son: 'quete' }].concat(C.cristal ? [{ ico: 'rune-cristal', n: C.cristal, t: 'cristaux runiques', brille: true }] : []).concat(parfaite ? [{ ico: 'rune-parfaite', n: 1, t: premier ? 'rune parfaite (première victoire)' : 'rune parfaite', brille: true }] : []);
      if (typeof ouvertureMobile === 'function') ouvertureMobile({ rar: premier ? 'legendaire' : 'epique', cartes, titre: 'Le coffre du labo', sousTitre: nouveau ? 'Nouveau record : ' + duree(t) : 'Les Wabbits sont libres !' });
    } catch (e) { console.warn('fin du labo', e); }
    return r; }; }
/* LES DRONES DE LA PASSERELLE (24/11/2026, « oui carrement », Mathieu) : la passerelle de la tour est coupee en cinq troncons (du pied a la porte 1, puis d'une
   porte a l'autre) ; quand le perso entre dans un troncon, deux drones du Docteur (27n-mutants-labo.js) apparaissent un peu plus haut et l'attaquent de loin */
/* (24/11/2026, « sur les passerelles, qu'on se batte contre des gardes et des drones un peu plus souvent, sinon c'est trop simple », Mathieu : deux patrouilles par
   troncon, a l'entree et a mi-chemin, des drones, des gardes et des enrages, un de plus de chaque tous les deux etages ; elles marchent vers le perso le long de la
   spirale, 29c-ile-wabbits.js) */
/* (26/11/2026, « il y a un poil trop de monstres, on n'est pas cense se battre contre autant de monstres dans des petits escaliers » et « les gardes t'attendent devant
   une porte, meme quand tu sors d'une salle ils peuvent t'attaquer », Mathieu : une seule patrouille par troncon, un drone et un garde (un drone de plus tous les deux
   etages), plus de mutants sauvages sur la tour ; et deux gardes postes devant chaque porte : ils attendent, et ne bougent que si le perso arrive a moins de 6) */
const DRONES_RAMPE = { points: [0.5], drones: 1, gardes: 1, enrages: 0, avance: 1.0, ecart: 0.28, porte: 2 };
function dronesRampe() {
  const E = donjonEtat, c = combat; if (!E || !c || c.fin || c.genre !== 'donjon' || E.gagne != null) return; const P = E.perso; if (!P || P.mode !== 'rampe') return;
  E.drones = E.drones || {}; const rm = (LABO.R_IN + LABO.R_OUT) / 2;
  for (let k = 0; k < 5; k++) { const t0 = k === 0 ? LABO.A0 : angleRampe(LABO.PORTES[k - 1]), t1 = angleRampe(LABO.PORTES[k]);
    DRONES_RAMPE.points.forEach((f, j) => { const cle = k + '-' + j, tf = t0 + (t1 - t0) * f; if (E.drones[cle] || P.theta < tf - 0.05 || P.theta > t1 - 0.3) return; E.drones[cle] = true; const plus = Math.floor(k / 2);
      const L = [].concat(Array(DRONES_RAMPE.drones + plus).fill('wabDrone'), Array(DRONES_RAMPE.gardes).fill('wabGarde'), Array(DRONES_RAMPE.enrages).fill('wabEnrage')); c.total += L.length;
      L.forEach((t, i) => { const th = Math.min(t1 - 0.25 - i * 0.06, P.theta + DRONES_RAMPE.avance + i * DRONES_RAMPE.ecart), rr = t === 'wabDrone' ? rm : LABO.R_IN + 1.0 + (i % 2) * 1.3, x = DONJON.x + rr * Math.cos(th), z = DONJON.z + rr * Math.sin(th);
        setTimeout(() => { if (combat !== c || c.fin) return; apparaitre(t, { x, z, apres: (o) => { if (t !== 'wabDrone') transmuter(o); o.lab = { mode: 'rampe', theta: th }; o.drone = t === 'wabDrone'; o.aggro = true; pouf(o.x, hautRampe(th) + (t === 'wabDrone' ? 1.6 : 0.4), o.z, 1.1, '#8dff6a'); } }); }, i * 160); }); });
    if (!E.dronesVus && Object.keys(E.drones).length) { E.dronesVus = true; toast('Les gardes et les drones du Docteur patrouillent sur la passerelle !', 'alerte'); } }
}
{ const tickDonjonDrones = tickDonjon; tickDonjon = function () { const r = tickDonjonDrones.apply(this, arguments); try { dronesRampe(); } catch (e) { /* rien */ } return r; }; }
/* le modele du drone, charge au depart pour l'ile (24/11/2026, 27n-mutants-labo.js) */
{ const partirDonjonDrone = partirDonjon; partirDonjon = async function () { try { if (typeof chargerDrone === 'function') chargerDrone(); } catch (e) { /* rien */ } return partirDonjonDrone.apply(this, arguments); }; }

/* LE SUCCES « LIBERER TOUS LES WABBITS » (25/11/2026, Mathieu : « on pourrait avoir un succes "liberer tous les Wabbits" qui donne un bonus de 5 % d'XP pour ton
   perso, infini » ; au formulaire : « toutes les cages, une partie ») : les cages des quatre salles ouvertes pendant une meme partie du labo (16 cages) ; pour
   toujours, toute l'XP du perso +5 % (gagnerXp : les recoltes, les combats, tout). Affiche dans la fiche du perso, avec les succes de la peche. */
const SUCCES_WAB = { bonusXp: 0.05 };
const succesWabbits = () => !!(S_ && S_.succes && S_.succes.wabbits);
const cagesTotalLabo = () => { const L = (ileWabbits && ileWabbits.userData.salles) || []; let n = 0; for (let i = 0; i < 4; i++) n += ((L[i] && L[i].cages) || []).length; return n; };
function majSuccesWabbits(E) {
  if (!E || succesWabbits()) return; const total = cagesTotalLabo(); if (!total || (E.cagesOuvertes || 0) < total) return;
  S_.succes = S_.succes || {}; S_.succes.wabbits = true; son('niveau'); sauver();
  toast('Succès : Libérer tous les Wabbits ! Les ' + total + ' cages sont ouvertes : toute l\'XP de ton perso monte de ' + Math.round(SUCCES_WAB.bonusXp * 100) + ' %, pour toujours.', 'or');
}
{ const gagnerXpWab = gagnerXp; gagnerXp = function (n, exact, sag) { if (n > 0 && succesWabbits()) n = exact ? Math.round(n * (1 + SUCCES_WAB.bonusXp)) : n * (1 + SUCCES_WAB.bonusXp); return gagnerXpWab.call(this, n, exact, sag); }; } /* (gagnerXp.dernier se pose sur celle-ci : le vrai gain) */
{ const blocSuccesWab = blocSuccesPeche; blocSuccesPeche = function () { const a = blocSuccesWab.apply(this, arguments); if (!S_ || !(succesWabbits() || (S_.donjons && S_.donjons.wabbits))) return a; const ok = succesWabbits();
  return (a || '<h4>Succès</h4>') + '<div class="pano-bonus"><b>' + (ok ? '✓ Libérer tous les Wabbits' : 'Libérer tous les Wabbits : ouvre les cages des 4 salles du labo en une partie') + '</b><div class="paliers"><span class="' + (ok ? 'actif' : '') + '">' + (ok ? '✓ ' : '') + 'Toute ton XP +' + Math.round(SUCCES_WAB.bonusXp * 100) + ' %</span></div></div>'; }; }
/* LES GARDES DES PORTES (26/11/2026, « les gardes t'attendent devant une porte, meme quand tu sors d'une salle ils peuvent t'attaquer », Mathieu) : quand le perso entre
   dans une salle, deux gardes viennent se poster devant sa porte, sur la passerelle ; ils attendent, et l'attaquent a sa sortie (ou s'il passe a moins de 6) */
function postesPortes() {
  const E = donjonEtat, c = combat; if (!E || !c || c.fin || c.genre !== 'donjon' || E.gagne != null) return; const P = E.perso; if (!P || P.mode !== 'salle' || P.i == null || P.i >= 4) return;
  E.postes = E.postes || {}; if (E.postes[P.i]) return; E.postes[P.i] = true; const ta = angleRampe(LABO.PORTES[P.i]); c.total += DRONES_RAMPE.porte;
  for (let i = 0; i < DRONES_RAMPE.porte; i++) { const th = ta + (i % 2 ? 0.3 : -0.3), rr = LABO.R_IN + 1.6, x = DONJON.x + rr * Math.cos(th), z = DONJON.z + rr * Math.sin(th);
    setTimeout(() => { if (combat !== c || c.fin) return; apparaitre('wabGarde', { x, z, apres: (o) => { transmuter(o); o.lab = { mode: 'rampe', theta: th }; o.aggro = true; o.poste = true; } }); }, 400 + i * 200); }
}
{ const tickDonjonPostes = tickDonjon; tickDonjon = function () { const r = tickDonjonPostes.apply(this, arguments); try { postesPortes(); } catch (e) { /* rien */ } return r; }; }
