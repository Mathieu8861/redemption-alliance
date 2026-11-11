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
const CANNES_PECHE = [null, { zone: 26, portee: 4.5, long: 2.0, bouchon: '#d8402f' }, { zone: 29, portee: 6.5, long: 2.6, bouchon: '#f4efe2' }, { zone: 33, portee: 5.0, long: 2.2, bouchon: '#f2c53d' }, { zone: 38, portee: 5.5, long: 2.3, bouchon: '#f08a2e' }];
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
function poissonPeche(p) { /* une silhouette simple, a sa couleur : elle ne se voit qu'une seconde, quand la prise saute hors de l'eau */
  const g = new T.Group(), m = new T.MeshLambertMaterial({ color: p.teinte }), raie = p.id === 'raie', t = 1.5 + p.rang * 0.3;
  const corps = new T.Mesh(new T.SphereGeometry(1, 12, 8), m); corps.scale.set(raie ? 0.3 : 0.11, raie ? 0.05 : 0.15, 0.34);
  const queue = new T.Mesh(new T.ConeGeometry(0.13, 0.24, 4), m); queue.rotation.x = Math.PI / 2; queue.position.z = -0.42; queue.scale.set(0.5, 1, 1);
  g.add(corps, queue); g.scale.setScalar(t); g.traverse((o) => { o.raycast = () => {}; }); return g;
}
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
  const P = etatPeche(), F = p.poisson, neuf = !P.prises[F.id]; P.prises[F.id] = (P.prises[F.id] || 0) + 1; P.total = (P.total || 0) + 1;
  p.etat = 'prise'; p.t = 0; p.de = p.bouchon.position.clone(); p.bouchon.visible = false; p.fil.visible = false; p.prise = poissonPeche(F); p.prise.position.copy(p.de); scene.add(p.prise);
  eclaboussure(p.de.x, p.de.z, 1.1); son(F.rang >= 2 ? 'quete' : 'plouf'); const H = hudPeche(); H.jauge.hidden = true; H.avance.hidden = true; H.d.querySelector('button').hidden = true;
  direPeche((neuf ? 'Nouveau poisson : ' : '') + F.nom + ' !', true, 'poisson-' + F.id);
  toast((neuf ? 'Nouveau poisson ! ' : '') + 'Tu as pêché ' + unPoisson(F) + ' (' + RANGS_PECHE[F.rang].nom + '). ' + (F.fem ? 'Elle' : 'Il') + ' rejoint le tonneau de la cabane.', F.rang >= 2 ? 'or' : undefined);
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
  } else if (p.etat === 'prise') { /* la prise saute hors de l'eau, en cloche, jusque dans ses mains */
    const a = Math.min(1, p.t / 0.8), vers = new T.Vector3(pp.x, pp.y + 2.25, pp.z); p.prise.position.lerpVectors(p.de, vers, a); p.prise.position.y += Math.sin(a * Math.PI) * 1.2; /* (elle retombe au-dessus de sa tete : il la brandit) */
    p.prise.rotation.x = a < 1 ? a * 9.42 : 0; p.prise.rotation.y = a < 1 ? 0 : (p.t - 0.8) * 2.2 + Math.PI / 2; cible = 0.2; p.bras = a < 1 ? -0.7 : -2.4;
    if (p.t > 2.4) { finPeche(null); return; }
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
function ouvrirEtabliPecheur() {
  const P = etatPeche(), E = cannesEues(), deux = ' style="grid-template-columns:minmax(0,1fr) auto"';
  ouvrirModale('pecheur', entete('L\'atelier du pêcheur') + '<p class="hdv-aide">Achète tes appâts ici, choisis celui que tu mets sur ta ligne, puis va pêcher au bout de la terrasse, une canne en main : chaque lancer prend un appât.</p><h4>Les appâts</h4>' +
    Object.entries(APPATS).map(([k, A]) => '<div class="art"' + deux + '><div><b>' + A.nom + '</b> <span class="puce' + (P.appat === k ? ' or' : '') + '">' + (P.appats[k] || 0) + ' en réserve' + (P.appat === k ? ', sur ta ligne' : '') + '</span><div class="desc">' + A.desc + '</div></div><div class="act">' +
      (P.appat === k ? '' : '<button class="btn discret mini" data-peche="appat:' + k + '">Utiliser</button>') + '<button class="btn kamas mini" data-peche="acheter:' + k + ':1">1 : ' + fmt(A.prix) + '</button><button class="btn kamas mini" data-peche="acheter:' + k + ':10">10 : ' + fmt(A.prix * 10) + '</button></div></div>').join('').replace(/<div class="act">/g, '<div class="act" style="display:flex;flex-direction:row;gap:6px;align-items:center">') +
    '<h4>Tes cannes</h4><p class="hdv-aide">Elles sont exposées sur le râtelier, au mur du fond : touche-en une pour la prendre, touche sa place pour la reposer. Une meilleure canne élargit la zone verte de la jauge.</p>' +
    [1, 2, 3, 4].map((k) => '<div class="art"' + deux + '><div><b>' + CANNES[k].nom + '</b><div class="desc">' + CANNES[k].desc + '</div></div><div class="act"><span class="puce' + (P.main === k ? ' or' : E.includes(k) ? ' bonne' : '') + '">' + (P.main === k ? 'dans ta main' : E.includes(k) ? 'sur le râtelier' : 'pas encore à toi') + '</span></div></div>').join(''));
}
function ouvrirPrises() {
  const P = etatPeche(), total = POISSONS.reduce((t, p) => t + (P.prises[p.id] || 0), 0), especes = POISSONS.filter((p) => P.prises[p.id]).length;
  ouvrirModale('prises', entete('Le tonneau à poissons') + '<p class="hdv-aide">' + (total ? total + ' prise' + (total > 1 ? 's' : '') + ', ' + especes + ' espèce' + (especes > 1 ? 's' : '') + ' sur ' + POISSONS.length + '.' : 'Encore vide : prends une canne au râtelier et va pêcher au bout de la terrasse.') + '</p>' +
    POISSONS.map((p) => { const n = P.prises[p.id] || 0; return '<div class="art">' + (n ? ico('poisson-' + p.id) : '<span class="pic img" style="filter:grayscale(1) brightness(.4) contrast(1.3)"><img src="assets/icones/poisson-' + p.id + '.png?v=' + VERSION_MODELES + '" alt=""></span>') + '<div><b>' + (n ? p.nom : '???') + '</b><div class="desc">' + RANGS_PECHE[p.rang].nom + '</div></div><div class="act"><span class="puce' + (n ? ' bonne' : '') + '">' + (n ? '× ' + n : 'pas encore pêché') + '</span></div></div>'; }).join(''));
}
document.addEventListener('click', (e) => {
  const b = e.target && e.target.closest ? e.target.closest('[data-peche]') : null; if (!b) return; const [a, k, n] = b.dataset.peche.split(':');
  if (a === 'acheter') acheterAppat(k, +n); else if (a === 'appat' && APPATS[k]) { etatPeche().appat = k; sauver(); ouvrirEtabliPecheur(); }
});
