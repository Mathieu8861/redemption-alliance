'use strict';
/* ---------- LA PECHE (11/11/2026) ----------
   « et ensuite quand on peche il se passe quoi ? c'est en automatique ou on doit faire des actions ? », puis, sur la proposition d'une peche active et courte :
   « Go tester ca ouais » ; « il faudrait devoir acheter les appats aussi » (Mathieu). PAS EN LIGNE : la cabane et la peche vont avec la future mise a jour.
   Le deroule, depuis la terrasse de la cabane (14g-cabane.js), une canne en main :
   1. on touche l'eau de la mare (ou le bouton « Pecher ») : le perso va au bout de la terrasse et lance sa ligne ; un appat est consomme ;
   2. le bouchon flotte, fremit deux fois, puis plonge au bout de quelques secondes : on touche l'ecran (ou Espace) dans la seconde pour ferrer ;
   3. la jauge : on garde le poisson dans la zone verte (rester appuye la pousse a droite, relacher la laisse revenir) jusqu'a remplir la barre ;
      un poisson rare tire plus fort et demande plus de temps, une meilleure canne elargit la zone ;
   4. la prise saute dans les mains du perso et rejoint le tonneau a poissons de la cabane (S_.peche.prises). Ce qu'on en fait reste a decider.
   Les appats s'achetent a l'etabli de la cabane ; l'appat choisi decide des chances de chaque rang de poisson. */
const POISSONS = [{ id: 'goujon', nom: 'Goujon', rang: 0, teinte: '#a08a62' }, { id: 'truite', nom: 'Truite', rang: 0, fem: true, teinte: '#7fa05a' }, { id: 'chaton', nom: 'Poisson-Chaton', rang: 0, teinte: '#7b8aa0' },
  { id: 'brochet', nom: 'Brochet', rang: 1, teinte: '#8fa35e' }, { id: 'carpe', nom: 'Carpe', rang: 1, fem: true, teinte: '#c79a3e' }, { id: 'perche', nom: 'Perche', rang: 1, fem: true, teinte: '#8a9a3e' },
  { id: 'bar', nom: 'Bar', rang: 2, teinte: '#9aa7b4' }, { id: 'raie', nom: 'Raie bleue', rang: 2, fem: true, teinte: '#6f8fc0' }, { id: 'lotte', nom: 'Lotte', rang: 2, fem: true, teinte: '#6b4a36' },
  { id: 'chaton-dore', nom: 'Poisson-Chaton doré', rang: 3, teinte: '#f2c53d' }];
/* les rangs : tire (sa vivacite dans la jauge), tenir (les secondes a le garder dans la zone verte) */
const RANGS_PECHE = [{ nom: 'commun', tire: 0.65, tenir: 3.0 }, { nom: 'peu commun', tire: 0.95, tenir: 3.6 }, { nom: 'rare', tire: 1.3, tenir: 4.4 }, { nom: 'légendaire', tire: 1.7, tenir: 5.2 }];
/* les appats : leur prix a l'etabli, les chances de chaque rang (commun, peu commun, rare), et dore : la chance du Poisson-Chaton dore, tiree a part
   (11/11/2026, « mets le taux de chance a 0,5 sur les poissons-chats dores », Mathieu : 0,5 % par lancer a l'appat dore, 2 % au premier jet ; aucune canne ne la change) */
const APPATS = { ver: { nom: 'Ver de terre', prix: 40, poids: [80, 18, 2], desc: 'L\'appât de tous les jours : surtout des poissons communs.' },
  mouche: { nom: 'Mouche de mai', prix: 150, poids: [50, 38, 12], desc: 'Plus de poissons peu communs, quelques rares.' },
  dore: { nom: 'Appât doré', prix: 600, poids: [22, 40, 38], dore: 0.005, desc: 'Attire les poissons rares, et très rarement le Poisson-Chaton doré (0,5 % de chance).' } };
/* les cannes : la largeur de la zone verte (sur 100), la portee du lancer, la longueur du modele */
const CANNES_PECHE = [null, { zone: 26, portee: 4.5, long: 2.0, bouchon: '#d8402f' }, { zone: 29, portee: 6.5, long: 2.6, bouchon: '#f4efe2' }, { zone: 33, portee: 5.0, long: 2.2, bouchon: '#f2c53d' }, { zone: 38, portee: 5.5, long: 2.3, bouchon: '#f08a2e' }, { zone: 44, portee: 6.0, long: 2.4, bouchon: '#f2c53d' }]; /* (5 : la Canne doree, la zone verte la plus large) */
const MARE_Y = -0.05, FENETRE_FERRAGE = 1.0;
let peche = null, pecheHud = null, pecheBouton = null;
const dansMare = (x, z) => codeIle(Math.round(x / S + (COLS - 1) / 2), Math.round(z / S + (ROWS - 1) / 2)) === '~';
const unPoisson = (p) => (p.fem ? 'une ' : 'un ') + p.nom;
function tirerPoisson() {
  const P = etatPeche(), A = APPATS[P.appat]; if (Math.random() < (A.dore || 0)) return POISSONS.find((p) => p.rang === 3); /* (le Poisson-Chaton dore : sa chance fixe, d'abord) */
  const W = A.poids.slice(); if (P.main === 4) W[2] *= 1.3; /* (la canne de mer : plus de poissons rares) */
  let r = Math.random() * W.reduce((a, b) => a + b, 0), rang = 0; for (let k = 0; k < W.length; k++) { r -= W[k]; if (r <= 0) { rang = k; break; } }
  return hasard(POISSONS.filter((p) => p.rang === rang));
}
/* ----- ce qu'on voit : le bouchon, le fil, le poisson qui saute ----- */
function bouchonPeche(k) {
  const g = new T.Group(), haut = new T.Mesh(new T.SphereGeometry(0.085, 10, 8), new T.MeshLambertMaterial({ color: CANNES_PECHE[k].bouchon })), bas = new T.Mesh(new T.SphereGeometry(0.075, 10, 8), new T.MeshLambertMaterial({ color: '#f5f1e6' })), tige = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.34, 5), new T.MeshLambertMaterial({ color: '#b07a45' }));
  haut.position.y = 0.06; bas.position.y = -0.04; tige.position.y = 0.04; g.add(haut, bas, tige); g.traverse((o) => { o.raycast = () => {}; }); return g;
}
function filPeche() { const l = new T.Line(new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(new Float32Array(14 * 3), 3)), new T.LineBasicMaterial({ color: '#f5f0e0' })); l.frustumCulled = false; l.raycast = () => {}; return l; }
function eclaboussure(x, z, r) { onde(x, MARE_Y + 0.03, z, r, '#e9f8ff', 0.6, 0.7); pouf(x, MARE_Y + 0.05, z, r * 0.9, '#cfeeff'); }
const pointeCanne = (p) => { const c = paysanMesh.userData.canneObj; if (!c) return paysanMesh.position.clone().setY(paysanMesh.position.y + 1.6); c.updateWorldMatrix(true, false); return c.localToWorld(new T.Vector3(0, CANNES_PECHE[p.canne].long, 0.02)); };
function majFil(p, mou) {
  const a = pointeCanne(p), b = p.bouchon.position, P = p.fil.geometry.attributes.position, n = P.count;
  for (let i = 0; i < n; i++) { const k = i / (n - 1); P.setXYZ(i, a.x + (b.x - a.x) * k, a.y + (b.y + 0.12 - a.y) * k - mou * 4 * k * (1 - k), a.z + (b.z - a.z) * k); } P.needsUpdate = true;
}
/* ----- l'affichage : le message, la jauge, le bouton ----- */
function hudPeche() {
  if (pecheHud) return pecheHud;
  const d = document.createElement('div'); d.id = 'peche-hud'; d.hidden = true;
  d.innerHTML = '<div id="peche-saisie"></div><div class="peche-carte"><div class="peche-msg"></div><div class="peche-jauge" hidden><i class="zone"></i><b class="poisson"></b></div><div class="peche-avance" hidden><i></i></div><button class="btn discret mini">Remonter la ligne</button></div>';
  document.body.appendChild(d);
  const s = d.querySelector('#peche-saisie'); s.addEventListener('pointerdown', (e) => { e.preventDefault(); appuiPeche(true); }); ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => s.addEventListener(n, () => appuiPeche(false)));
  d.querySelector('button').addEventListener('click', () => { if (peche && peche.etat !== 'prise') finPeche('Tu remontes ta ligne.'); });
  pecheHud = { d, msg: d.querySelector('.peche-msg'), jauge: d.querySelector('.peche-jauge'), zone: d.querySelector('.zone'), poisson: d.querySelector('.poisson'), avance: d.querySelector('.peche-avance'), barre: d.querySelector('.peche-avance i') };
  return pecheHud;
}
function direPeche(txt, fort, image) { const H = hudPeche(); H.msg.textContent = txt; H.msg.classList.toggle('fort', !!fort); if (image) { const i = document.createElement('img'); i.className = 'peche-prise'; i.src = 'assets/icones/' + image + '.png?v=' + VERSION_MODELES; i.alt = ''; H.msg.prepend(i); } }
/* l'appui : pendant la touche, il ferre ; pendant la jauge, tenir pousse la zone verte */
function appuiPeche(on) {
  const p = peche; if (!p) return; p.tenu = !!on; if (!on) return;
  if (p.etat === 'touche') { const H = hudPeche(), Z = CANNES_PECHE[p.canne].zone; p.etat = 'combat'; p.t = 0; p.g = 50 - Z / 2; p.gv = 0; p.f = 50; p.fc = 50; p.ft = 0.4; p.p = 0.35; H.jauge.hidden = false; H.avance.hidden = false; son('touche'); direPeche('Garde le poisson dans le vert : reste appuyé pour pousser la zone.'); }
  else if (p.etat === 'attente' && performance.now() - (appuiPeche.t || 0) > 2500) { appuiPeche.t = performance.now(); direPeche('Pas encore : attends que le bouchon plonge.'); }
}
document.addEventListener('keydown', (e) => { if (!peche || peche.etat === 'marche') return; if (e.code === 'Space') { e.preventDefault(); e.stopPropagation(); if (!e.repeat) appuiPeche(true); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (peche.etat !== 'prise') finPeche('Tu remontes ta ligne.'); } }, true);
document.addEventListener('keyup', (e) => { if (peche && e.code === 'Space') { e.preventDefault(); e.stopPropagation(); appuiPeche(false); } }, true);
function majBoutonPeche() { /* le bouton « Pecher » : sur la terrasse, une canne en main */
  const pp = paysanMesh && paysanMesh.position, P = S_ && S_.peche, vu = !!pp && !peche && pontonActif && lieu === 'ferme' && !combat && !mode && !!P && !!P.main && !modaleOuverte && hauteurPonton(pp.x, pp.z) > 0.2, n = vu ? (etatPeche().appats[etatPeche().appat] || 0) : 0, cle = vu ? 'o' + n + etatPeche().appat : 'n';
  if (majBoutonPeche.cle === cle) return; majBoutonPeche.cle = cle;
  if (!pecheBouton) { if (!vu) return; pecheBouton = document.createElement('button'); pecheBouton.id = 'peche-bouton'; pecheBouton.className = 'btn kamas'; pecheBouton.addEventListener('click', () => demarrerPeche(null)); document.body.appendChild(pecheBouton); }
  pecheBouton.hidden = !vu; if (vu) pecheBouton.textContent = 'Pêcher (' + APPATS[etatPeche().appat].nom + ' : ' + n + ')';
}
/* ----- le deroule ----- */
function demarrerPeche(pt) {
  if (peche || combat || lieu !== 'ferme' || !pontonActif || mode) return;
  const P = etatPeche();
  if (!P.main) { toast('Il te faut une canne : prends-en une au râtelier, dans la cabane.'); return; }
  if (!(P.appats[P.appat] > 0)) { toast('Plus d\'appât sur ta ligne (' + APPATS[P.appat].nom + ') : achètes-en à l\'établi de la cabane.', 'alerte'); return; }
  const C = CANNES_PECHE[P.main], pp = paysanMesh.position, x = CABANE_X + Math.max(-1.3, Math.min(1.3, (pt ? pt.x : pp.x) - CABANE_X)), z = CABANE_Z + 2.62;
  let cx = x, cz = z + 2.6; /* ou tombe le bouchon : le point touche, ramene a la portee de la canne ; sinon droit devant */
  if (pt) { const dx = pt.x - x, dz = pt.z - (z + 0.3), d = Math.hypot(dx, dz) || 1, k = Math.max(1.8, Math.min(C.portee, d)) / d; cx = x + dx * k; cz = z + 0.3 + dz * k; }
  if (!dansMare(cx, cz) || cz < CABANE_Z + 3.4) { cx = x; cz = z + 2.6; }
  peche = { etat: 'marche', t: 0, x, z, cx, cz, canne: P.main, theta: 0.1, bras: null };
  clicCabaneDehors({ x, y: PONTON_Y, z }, false); /* (il va au bout de la terrasse) */
}
function lancerLigne(p) {
  const P = etatPeche(); if (!(P.appats[P.appat] > 0)) { peche = null; return; }
  P.appats[P.appat]--; p.appat = P.appat; p.poisson = tirerPoisson(); p.etat = 'lance'; p.t = 0; p.touche = 2.6 + Math.random() * 4.4; p.tenu = false;
  p.bouchon = bouchonPeche(p.canne); p.bouchon.visible = false; scene.add(p.bouchon); p.fil = filPeche(); p.fil.visible = false; scene.add(p.fil);
  tenirCanne(); /* (la canne sans son fil enroule : il est a l'eau) */
  const H = hudPeche(); H.d.hidden = false; H.jauge.hidden = true; H.avance.hidden = true; H.d.querySelector('button').hidden = false; direPeche('Tu lances ta ligne…');
}
function finPeche(msg, muet) {
  const p = peche; peche = null; if (!p) return;
  [p.bouchon, p.fil, p.prise].forEach((o) => { if (o && o.parent) o.parent.remove(o); });
  if (pecheHud) pecheHud.d.hidden = true; majBoutonPeche.cle = null; if (paysanMesh) tenirCanne();
  if (msg && !muet) toast(msg); if (p.etat !== 'marche') sauver();
}
function jaugePeche(p, dt, R, C) {
  const Z = C.zone, H = hudPeche();
  p.gv += (p.tenu ? 300 : -240) * dt; p.gv *= Math.pow(0.9, dt * 60); p.g += p.gv * dt;
  if (p.g < 0) { p.g = 0; p.gv = 0; } if (p.g > 100 - Z) { p.g = 100 - Z; p.gv = 0; }
  p.ft -= dt; if (p.ft <= 0) { p.ft = (0.35 + Math.random() * 0.8) / R.tire; p.fc = Math.max(5, Math.min(95, p.f + (Math.random() - 0.5) * 2 * (22 + 26 * R.tire))); } /* (il change de cap, d'autant plus souvent et plus loin qu'il est rare) */
  const v = (25 + 40 * R.tire) * dt, e = p.fc - p.f; p.f += Math.abs(e) <= v ? e : Math.sign(e) * v;
  p.dedans = p.f >= p.g && p.f <= p.g + Z; p.p += p.dedans ? dt / R.tenir : -dt / (3.2 / R.tire);
  H.zone.style.left = p.g + '%'; H.zone.style.width = Z + '%'; H.poisson.style.left = p.f + '%'; H.barre.style.width = Math.max(0, Math.min(100, p.p * 100)) + '%'; H.jauge.classList.toggle('dedans', p.dedans);
  if (p.p >= 1) prendrePoisson(p); else if (p.p <= 0) finPeche('Le poisson s\'est décroché.');
}
function prendrePoisson(p) {
  const P = etatPeche(), F = p.poisson, neuf = !P.vues[F.id]; P.vues[F.id] = 1; P.prises[F.id] = (P.prises[F.id] || 0) + 1; /* (vues : les especes deja pechees, meme une fois vendues ou mises a l'aquarium) */ P.total = (P.total || 0) + 1;
  p.etat = 'prise'; p.t = 0; p.de = p.bouchon.position.clone(); p.bouchon.visible = false; p.fil.visible = false; /* (plus de poisson qui saute au-dessus de la tete : « une animation d'un poisson moche, ca sert a rien », Mathieu, 11/11/2026 ; la prise se lit sur la carte, avec son image) */
  eclaboussure(p.de.x, p.de.z, 1.1); son(F.rang >= 2 ? 'quete' : 'plouf'); const H = hudPeche(); H.jauge.hidden = true; H.avance.hidden = true; H.d.querySelector('button').hidden = true;
  direPeche((neuf ? 'Nouveau poisson : ' : '') + F.nom + ' !', true, 'poisson-' + F.id);
  gagnerXp(XP_POISSON[F.rang]); const xpPrise = gagnerXp.dernier || 0;
  if (neuf) setTimeout(majSuccesPeche, 1400);
  toast((neuf ? 'Nouveau poisson ! ' : '') + 'Tu as pêché ' + unPoisson(F) + ' (' + RANGS_PECHE[F.rang].nom + '). ' + (F.fem ? 'Elle' : 'Il') + ' rejoint le tonneau de la cabane.' + (xpPrise ? ' +' + fmt(xpPrise) + ' XP.' : ''), F.rang >= 2 ? 'or' : undefined);
}
function majPeche(dt) {
  if (!paysanMesh || !S_) return; majBoutonPeche();
  const p = peche; if (!p) return;
  if (combat || lieu !== 'ferme' || !(S_.peche && S_.peche.main)) { finPeche(null, true); return; }
  p.t += dt; const u = paysanMesh.userData, pp = paysanMesh.position;
  if (p.etat === 'marche') { /* il va au bout de la terrasse ; s'il part ailleurs, on laisse tomber */
    if (Math.hypot(pp.x - p.x, pp.z - p.z) < 0.25 && !chemin.length) lancerLigne(p);
    else if ((!chemin.length && !arrivee && p.t > 0.6) || p.t > 14) peche = null;
    return;
  }
  chemin = []; arrivee = null; u.angle = Math.atan2(p.cx - pp.x, p.cz - pp.z);
  const R = RANGS_PECHE[p.poisson.rang], C = CANNES_PECHE[p.canne], b = p.bouchon; let cible = 0.9, mou = 0.22; p.bras = -0.7;
  if (p.etat === 'lance') { /* la canne part en arriere, puis fouette vers l'avant : le bouchon s'envole en cloche jusqu'a l'eau */
    cible = p.t < 0.4 ? -0.7 : p.t < 0.7 ? 1.35 : 0.9; mou = 0;
    if (p.t >= 0.5) { const a = Math.min(1, (p.t - 0.5) / 0.55), de = pointeCanne(p); b.visible = true; p.fil.visible = true; b.position.set(de.x + (p.cx - de.x) * a, de.y + (MARE_Y - de.y) * a + Math.sin(a * Math.PI) * 1.1, de.z + (p.cz - de.z) * a); }
    if (p.t >= 1.05) { p.etat = 'attente'; p.t = 0; eclaboussure(p.cx, p.cz, 0.6); son('plouf'); direPeche('Attends que le bouchon plonge…'); }
  } else if (p.etat === 'attente') {
    const reste = p.touche - p.t; let y = MARE_Y + Math.sin(p.t * 2.4) * 0.018; if ((reste < 0.95 && reste > 0.8) || (reste < 0.5 && reste > 0.35)) y -= 0.06; /* (deux petites touches avant la vraie) */
    b.position.set(p.cx, y, p.cz);
    if (p.t >= p.touche) { p.etat = 'touche'; p.t = 0; eclaboussure(p.cx, p.cz, 0.9); son('plouf'); direPeche('Ça mord ! Ferre !', true); }
  } else if (p.etat === 'touche') {
    b.position.set(p.cx, MARE_Y - 0.2 + Math.sin(p.t * 34) * 0.02, p.cz); cible = 1.1; mou = 0;
    if (p.t > FENETRE_FERRAGE) { finPeche('Trop tard : le poisson a filé avec l\'appât.'); return; }
  } else if (p.etat === 'combat') {
    jaugePeche(p, dt, R, C); if (peche !== p) return; if (p.etat !== 'combat') return;
    const k = (p.f - 50) / 50; b.position.set(p.cx + k * 0.9, MARE_Y - 0.12 + Math.sin(p.t * 20) * 0.03, p.cz + Math.sin(p.t * 3) * 0.2); cible = p.dedans ? 0.55 : 0.95; mou = 0;
    if (Math.floor(p.t * 2.5) !== Math.floor((p.t - dt) * 2.5)) onde(b.position.x, MARE_Y + 0.03, b.position.z, 0.5, '#e9f8ff', 0.5, 0.5);
  } else if (p.etat === 'prise') { /* la prise : une eclaboussure, la carte dit le poisson, et il releve sa canne un instant */
    cible = 0.2; p.bras = -0.9;
    if (p.t > 1.8) { finPeche(null); return; }
  }
  p.theta += (cible - p.theta) * Math.min(1, dt * 12);
  if (u.canneObj) u.canneObj.rotation.x = p.theta - p.bras; /* (l'inclinaison de la canne dans le monde : celle du bras, plus la sienne) */
  if (p.fil && p.fil.visible) majFil(p, mou);
}
/* ----- l'etabli de la cabane : les appats et les cannes ; le tonneau : les prises ----- */
function acheterAppat(k, n) {
  const A = APPATS[k], P = etatPeche(), prix = A.prix * n; if (!A || !(n > 0)) return;
  if (S_.kamas < prix) { toast('Il te manque ' + fmt(prix - S_.kamas) + ' kamas.', 'alerte'); return; }
  S_.kamas -= prix; P.appats[k] = (P.appats[k] || 0) + n; if (!(P.appats[P.appat] > 0)) P.appat = k; son('kamas'); rendreHaut(); sauver(); ouvrirEtabliPecheur();
}
/* (11/11/2026, « a ameliorer ca », Mathieu, sur la premiere fenetre : des lignes sans image, des boutons « 1 : 40 ») : en cartes. Un appat : son image, ce qu'il en
   reste, ses chances en barre (communs, peu communs, rares), deux boutons d'achat avec leur prix, et « Mettre sur ma ligne » ; celui de la ligne est borde d'or.
   Une canne : son image, ou elle est, sa zone verte et son lancer. */
function ouvrirEtabliPecheur() {
  const P = etatPeche(), E = cannesEues(), img = (n) => '<img src="assets/icones/' + n + '.png?v=' + VERSION_MODELES + '" alt="">', RANG = ['communs', 'peu communs', 'rares'];
  const appat = ([k, A]) => { const n = P.appats[k] || 0, sur = P.appat === k, tot = A.poids.reduce((t, x) => t + x, 0);
    return '<div class="pe-carte' + (sur ? ' choisi' : '') + '">' + img('appat-' + k) + '<b class="pe-nom">' + A.nom + '</b><span class="puce' + (n ? ' bonne' : '') + '">' + fmt(n) + ' en réserve</span>' +
      '<div class="pe-chances">' + A.poids.map((x, i) => '<i class="r' + i + '" style="width:' + (x / tot * 100).toFixed(1) + '%"></i>').join('') + '</div>' +
      '<div class="pe-legende">' + A.poids.map((x, i) => '<span class="r' + i + '">' + Math.round(x / tot * 100) + ' % ' + RANG[i] + '</span>').join('') + (A.dore ? '<span class="r3">' + String(A.dore * 100).replace('.', ',') + ' % Poisson-Chaton doré</span>' : '') + '</div>' +
      '<div class="pe-achats"><button class="btn kamas mini" data-peche="acheter:' + k + ':1"' + (S_.kamas >= A.prix ? '' : ' disabled') + '>Acheter ' + fmt(A.prix) + ' ' + KAMA + '</button><button class="btn kamas mini" data-peche="acheter:' + k + ':10"' + (S_.kamas >= A.prix * 10 ? '' : ' disabled') + '>×10 : ' + fmt(A.prix * 10) + ' ' + KAMA + '</button></div>' + /* (comme a l'HDV : « Acheter 40 » et « ×10 : 400 », la piece a cote ; « le 1 - 40 c'est pas tres explicite », Mathieu, 11/11/2026) */
      (sur ? '<span class="pe-ligne">✓ Sur ta ligne</span>' : '<button class="btn discret mini" data-peche="appat:' + k + '">Mettre sur ma ligne</button>') + '</div>'; };
  const canne = (k) => { const a = E.includes(k), main = P.main === k, C = CANNES_PECHE[k];
    return '<div class="pe-carte pe-canne' + (main ? ' choisi' : a ? '' : ' absent') + '">' + img('canne-' + k) + '<b class="pe-nom">' + CANNES[k].nom + '</b><span class="puce' + (main ? ' or' : a ? ' bonne' : '') + '">' + (main ? 'dans ta main' : a ? 'sur le râtelier' : CANNE_ESPECES[k] + ' espèces à pêcher') + '</span>' +
      '<div class="pe-legende"><span>Zone verte : ' + C.zone + ' %</span><span>Lancer : ' + String(Math.round(C.portee / S * 10) / 10).replace('.', ',') + ' cases</span></div></div>'; };
  ouvrirModale('pecheur', entete('L\'atelier du pêcheur') + '<p class="hdv-aide">Chaque lancer prend un appât. Choisis celui de ta ligne, puis va pêcher au bout de la terrasse, une canne en main.</p>' +
    '<div class="hdv-section">Les appâts</div><div class="pe-grille">' + Object.entries(APPATS).map(appat).join('') + '</div>' +
    '<div class="hdv-section">Tes cannes</div><p class="hdv-aide">Sur le râtelier, au mur du fond : touche une canne pour la prendre, touche sa place pour la reposer. Les suivantes se gagnent en pêchant de nouvelles espèces.</p><div class="pe-grille cinq">' + [1, 2, 3, 4, 5].map(canne).join('') + '</div>');
}
/* LES SUCCES DE LA PECHE (11/11/2026, par Discord : « et si on peche tous les poissons ca fait un succes ? On gagne une recompense ? », « des kamas c'est bien mais
   bof », « B ? Et un bonus de dps de +5 % sur les monstres de type eau ? », « on fait comme ca », Mathieu). Les neuf especes courantes comptent (le Poisson-Chaton
   dore a part : son trophee est accroche au mur de la cabane, 14g-cabane.js) :
     3 especes : la Longue perche ; 5 : la Canne vernie ; 7 : la Canne de mer ; 9 : la Canne doree et « Pecheur accompli », +5 % de degats du perso contre les
     monstres d'eau (les Tortues, et tout monstre d'element eau ; pas les defenses), affiche dans la fiche du perso sous les panoplies (25-interface.js). */
const CANNE_ESPECES = [0, 0, 3, 5, 7, 9], BONUS_EAU = 0.05, MONSTRES_EAU = new Set(['tortueBleue', 'tortueJaune', 'tortueRouge', 'tortueVerte', 'tortueCorail']);
const especesPechees = () => { const P = etatPeche(); return POISSONS.filter((q) => q.rang < 3 && P.vues[q.id]).length; };
const pecheurAccompli = () => !!S_ && !!S_.peche && (S_.peche.cannes || []).includes(5);
const monstreDEau = (mo) => !!mo && (MONSTRES_EAU.has(mo.type) || !!(mo.d && mo.d.element === 'eau'));
function majSuccesPeche() { /* donne ce qui est du (sans risque de doublon) : a chaque nouvelle espece, et a l'ouverture du tonneau */
  if (!S_ || !S_.peche) return; const P = etatPeche(), n = especesPechees(); let neuf = 0;
  for (let k = 2; k <= 5; k++) if (n >= CANNE_ESPECES[k] && !P.cannes.includes(k)) { P.cannes.push(k); neuf = k;
    toast(k === 5 ? 'Succès : Pêcheur accompli ! Les 9 espèces sont pêchées. La Canne dorée est à toi, et tu frappes 5 % plus fort les monstres d\'eau.' : n + ' espèces pêchées : la ' + CANNES[k].nom + ' t\'attend sur le râtelier.', 'or'); }
  if (neuf) { son('quete'); if (typeof majRatelier === 'function' && cabaneSalle) majRatelier(); sauver(); }
}
const suiteSuccesPeche = () => { const n = especesPechees(), k = [2, 3, 4, 5].find((q) => n < CANNE_ESPECES[q]); return k ? ' À ' + CANNE_ESPECES[k] + ' espèces : la ' + CANNES[k].nom + '.' : ' Pêcheur accompli : les 9 espèces sont pêchées.'; };
function blocSuccesPeche() { /* la ligne « Succes » de la fiche du perso */
  if (!S_ || !cabaneLa()) return ''; const n = especesPechees(), ok = pecheurAccompli();
  return '<h4>Succès</h4><div class="pano-bonus"><b>' + (ok ? '✓ Pêcheur accompli' : 'Pêcheur accompli : ' + n + '/9 espèces pêchées') + '</b><div class="paliers"><span class="' + (ok ? 'actif' : '') + '">' + (ok ? '✓ ' : '') + 'Dégâts contre les monstres d\'eau +' + Math.round(BONUS_EAU * 100) + ' % (les Tortues)</span></div></div>';
}
/* LA VENTE DES POISSONS (11/11/2026, par Discord : « on peut les vendre ouais », puis « ouais nickel » sur les prix) : au tonneau, un bouton par espece.
   Ce qui est affiche est ce qui est paye, la baisse de 10 % comprise (kamasGagnes) : 600, 1 400, 2 500, et 100 000 pour le Poisson-Chaton dore
   (« les poissons prix de vente : 600 / 1400 / 2500 », Mathieu, 11/11/2026 au soir ; d'abord 150, 500, 2 000). */
const VENTE_POISSON = [667, 1556, 2778, 111111];
/* L'XP D'UNE PRISE (« et faut que ca xp un peu aussi », Mathieu, 11/11/2026 au soir) : un peu, selon le rang ; elle passe par gagnerXp (la baisse de 10 % et la
   Sagesse comprises). Au ver de terre, a peu pres 26 par lancer avant Sagesse : un appoint, loin derriere une recolte. */
const XP_POISSON = [20, 45, 100, 1500];
const prixPoisson = (p) => kamasGagnes(VENTE_POISSON[p.rang]);
function vendrePoisson(id, n) {
  const P = etatPeche(), p = POISSONS.find((q) => q.id === id), a = P.prises[id] || 0; if (!p || !(a > 0)) return; n = Math.max(1, Math.min(n, a));
  P.prises[id] = a - n; S_.kamas += prixPoisson(p) * n; son('kamas'); toast('Vendu : ' + (n > 1 ? n + ' × ' : '') + p.nom + ', +' + fmt(prixPoisson(p) * n) + ' kamas.'); rendreHaut(); sauver(); ouvrirPrises();
}
function ouvrirPrises() {
  majSuccesPeche(); const P = etatPeche(), total = POISSONS.reduce((t, p) => t + (P.prises[p.id] || 0), 0), especes = POISSONS.filter((p) => P.vues[p.id]).length;
  ouvrirModale('prises', entete('Le tonneau à poissons') + '<p class="hdv-aide">' + (especes ? total + ' poisson' + (total > 1 ? 's' : '') + ' au tonneau, ' + especes + ' espèce' + (especes > 1 ? 's' : '') + ' pêchée' + (especes > 1 ? 's' : '') + ' sur ' + POISSONS.length + '. Vends-les ici, ou garde tes plus beaux dans l\'aquarium, à droite de la cheminée.' + suiteSuccesPeche() : 'Encore vide : prends une canne au râtelier et va pêcher au bout de la terrasse.') + '</p>' +
    POISSONS.map((p) => { const n = P.prises[p.id] || 0, vu = !!P.vues[p.id], px = prixPoisson(p);
      return '<div class="art">' + (vu ? ico('poisson-' + p.id) : '<span class="pic img" style="filter:grayscale(1) brightness(.4) contrast(1.3)"><img src="assets/icones/poisson-' + p.id + '.png?v=' + VERSION_MODELES + '" alt=""></span>') + '<div><b>' + (vu ? p.nom : '???') + '</b><div class="desc">' + RANGS_PECHE[p.rang].nom + (vu ? ' · ' + fmt(px) + ' kamas pièce' : '') + '</div></div><div class="act">' +
        (n ? '<span class="puce bonne">× ' + n + '</span><button class="btn kamas mini" data-peche="vendre:' + p.id + ':1">Vendre ' + fmt(px) + ' ' + KAMA + '</button>' + (n > 1 ? '<button class="btn discret mini" data-peche="vendre:' + p.id + ':' + n + '">Tout : ' + fmt(px * n) + ' ' + KAMA + '</button>' : '') : '<span class="puce">' + (vu ? 'plus aucun' : 'pas encore pêché') + '</span>') + '</div></div>'; }).join(''));
}
/* LA FENETRE DE L'AQUARIUM : ses poissons (« Remettre au tonneau »), ceux du tonneau (« Mettre dans l'aquarium », tant qu'il reste une place), et l'agrandir */
function ouvrirAquarium() {
  const P = etatPeche(), A = etatAquarium(), cap = AQUARIUM.places[A.niv - 1], suiv = AQUARIUM.places[A.niv], prix = AQUARIUM.prix[A.niv], plein = A.poissons.length >= cap;
  const ligne = (p, desc, bouton) => '<div class="art">' + ico('poisson-' + p.id) + '<div><b>' + p.nom + '</b><div class="desc">' + desc + '</div></div><div class="act">' + bouton + '</div></div>';
  const dedans = A.poissons.map((id, i) => { const p = POISSONS.find((q) => q.id === id); return p ? ligne(p, RANGS_PECHE[p.rang].nom, '<button class="btn discret mini" data-peche="sortir:' + i + '">Remettre au tonneau</button>') : ''; }).join('');
  const tonneau = POISSONS.filter((p) => P.prises[p.id] > 0).map((p) => ligne(p, RANGS_PECHE[p.rang].nom + ' · × ' + P.prises[p.id] + ' au tonneau', '<button class="btn kamas mini" data-peche="entrer:' + p.id + '"' + (plein ? ' disabled' : '') + '>Mettre dans l\'aquarium</button>')).join('');
  ouvrirModale('aquarium', entete('L\'aquarium') + '<p class="hdv-aide">' + A.poissons.length + ' poisson' + (A.poissons.length > 1 ? 's' : '') + ' sur ' + cap + ' places. Garde ici tes plus belles prises : elles nagent dans le bac.</p>' +
    (suiv ? '<div class="act" style="margin:0 0 10px"><button class="btn kamas" data-peche="agrandir"' + (S_.kamas >= prix ? '' : ' disabled') + '>Agrandir à ' + suiv + ' places · ' + fmt(prix) + ' ' + KAMA + '</button></div>' : '<p class="hdv-aide">L\'aquarium est à sa plus grande taille.</p>') +
    '<div class="hdv-section">Dans l\'aquarium</div>' + (dedans || '<p class="hdv-aide">Encore vide.</p>') +
    '<div class="hdv-section">Dans le tonneau</div>' + (tonneau || '<p class="hdv-aide">Rien au tonneau : va pêcher au bout de la terrasse.</p>'));
}
function actionAquarium(a, k) {
  const P = etatPeche(), A = etatAquarium();
  if (a === 'entrer') { if (!(P.prises[k] > 0) || A.poissons.length >= AQUARIUM.places[A.niv - 1]) return; P.prises[k]--; A.poissons.push(k); son('plouf'); }
  else if (a === 'sortir') { const id = A.poissons[+k]; if (!id) return; A.poissons.splice(+k, 1); P.prises[id] = (P.prises[id] || 0) + 1; }
  else if (a === 'agrandir') { const prix = AQUARIUM.prix[A.niv]; if (!AQUARIUM.places[A.niv] || S_.kamas < prix) return; S_.kamas -= prix; A.niv++; son('kamas'); rendreHaut(); toast('L\'aquarium est agrandi : ' + AQUARIUM.places[A.niv - 1] + ' places.', 'or'); }
  sauver(); majAquarium(); ouvrirAquarium();
}
document.addEventListener('click', (e) => {
  const b = e.target && e.target.closest ? e.target.closest('[data-peche]') : null; if (!b) return; const [a, k, n] = b.dataset.peche.split(':');
  if (a === 'acheter') acheterAppat(k, +n); else if (a === 'appat' && APPATS[k]) { etatPeche().appat = k; sauver(); ouvrirEtabliPecheur(); }
  else if (a === 'vendre') vendrePoisson(k, +n); else if (a === 'entrer' || a === 'sortir' || a === 'agrandir') actionAquarium(a, k);
});
