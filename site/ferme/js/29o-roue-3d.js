'use strict';
/* LA ROUE LEGENDAIRE EN 3D DANS LE HALL DU PALAIS (21/11/2026, « attends, on doit aller ou quand on gagne le jeton ? y'a une roue quelque part ? », puis
   « fais une vraie roue en 3D dans le casino, fais-la en entier », Mathieu).
   Pres de l'entree, a gauche du tapis rouge, tournee vers la camera du hall : une estrade rouge cerclee d'or, un socle, un pilier, la grande roue (ses cases :
   les legendaires de ton palier ou d'avant, leurs icones peintes dessus), ses clous d'or, son moyeu serti, une couronne d'ampoules qui defilent, la fleche a
   clapet en haut et l'enseigne « Roue legendaire ». La toucher : le perso y va, la camera s'approche, un panneau en bas pour lancer (un jeton) ou partir.
   Elle tourne pour de vrai : six tours au moins, le clapet saute a chaque clou, et elle s'arrete sur le legendaire gagne (tire et donne au lancer, comme la
   roue de la fenetre, 29n-roue-legendaire.js). Le bouton « Roue legendaire » de la barre du Casino y emmene. Dans le mode test : tours gratuits, rien n'est donne. */
const ROUE3D = { x: -4.4, z: 3.4, R: 1.15, H: 1.95, g: null, disque: null, clapet: null, lampes: [], tex: null, cv: null, anim: null, ouvert: false, cam: null, L: [], kick: 0, flash: 0, repeint: 0 };
const roue3dEssai = () => typeof MODE_TEST !== 'undefined' && MODE_TEST;
const roue3dNormale = () => ({ x: Math.cos(ANGLE_DEPART), z: Math.sin(ANGLE_DEPART) }); /* (tournee vers la camera du hall) */
const roue3dPlace = () => { const n = roue3dNormale(); return [ROUE3D.x + n.x * 1.5 + n.z * 1.75, ROUE3D.z + n.z * 1.5 - n.x * 1.75]; }; /* (devant elle, un peu de cote : le perso ne la cache pas) */
/* la face peinte : les cases, leurs bords d'or, les icones (le meme dessin que la roue de la fenetre) */
function dessinerFaceRoue(cv, L) {
  const c = cv.getContext('2d'), N = L.length, R = cv.width / 2, a0 = -Math.PI / 2, pas = Math.PI * 2 / Math.max(1, N); let manque = false;
  c.clearRect(0, 0, cv.width, cv.height); c.save(); c.translate(R, R);
  for (let i = 0; i < N; i++) { const a = a0 + i * pas;
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R - 2, a, a + pas); c.closePath(); c.fillStyle = i % 2 ? '#3a1b6e' : '#5b2a9a'; c.fill(); c.lineWidth = R * 0.014; c.strokeStyle = '#f2c14a'; c.stroke();
    if (!OBJETS[L[i]]) continue;
    const nom = iconeObjet(L[i]), img = ROUE.imgs[nom] || (ROUE.imgs[nom] = Object.assign(new Image(), { src: 'assets/icones/' + nom + '.png?v=' + VERSION_MODELES }));
    if (!img.complete || !img.naturalWidth) { manque = true; continue; }
    const am = a + pas / 2, rr = R * 0.6, t = Math.min(R * 0.58, R * pas * 0.62); c.save(); c.translate(Math.cos(am) * rr, Math.sin(am) * rr); c.rotate(am + Math.PI / 2); c.drawImage(img, -t / 2, -t / 2, t, t); c.restore(); }
  c.restore(); return manque;
}
function roue3dFace() { /* repeint la face pour ce joueur (ses legendaires) ; encore, quand les icones finissent de charger */
  const R = ROUE3D; R.L = legendairesRoue(); if (!R.cv) return; const manque = dessinerFaceRoue(R.cv, R.L.length ? R.L : ['?']); R.tex.needsUpdate = true;
  clearTimeout(R.repeint); if (manque) R.repeint = setTimeout(roue3dFace, 400);
}
function construireRoue3d() {
  if (ROUE3D.g || !salleCasino) return; const R = ROUE3D, r = R.R, H = R.H, g = new T.Group(), n = roue3dNormale();
  g.position.set(R.x, 0, R.z); g.rotation.y = Math.atan2(n.x, n.z); salleCasino.add(g); R.g = g;
  const pose = (o, x, y, z, par) => { o.position.set(x, y, z); (par || g).add(o); return o; }, OR = '#f2c14a', ORF = '#b8801a', ROUGE = '#b3262d';
  /* l'estrade, le socle, le pilier, l'axe */
  pose(maille(new T.CylinderGeometry(1.45, 1.5, 0.08, 40), ROUGE), 0, 0.04, 0);
  pose(maille(new T.TorusGeometry(1.46, 0.045, 8, 48), OR), 0, 0.085, 0).rotation.x = Math.PI / 2;
  pose(maille(new T.BoxGeometry(1.5, 0.32, 0.8), '#5b2a9a'), 0, 0.24, -0.15); pose(maille(new T.BoxGeometry(1.58, 0.08, 0.88), OR), 0, 0.42, -0.15);
  pose(maille(new T.CylinderGeometry(0.11, 0.16, H - 0.4, 12), OR), 0, 0.42 + (H - 0.4) / 2, -0.28);
  pose(maille(new T.CylinderGeometry(0.2, 0.2, 0.3, 16), ORF), 0, H, -0.18).rotation.x = Math.PI / 2;
  /* la couronne d'or fixe, et ses ampoules */
  pose(maille(new T.TorusGeometry(r * 1.09, 0.07, 10, 64), OR), 0, H, -0.04);
  R.lampes = []; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, b = new T.Mesh(new T.SphereGeometry(0.045, 10, 8), new T.MeshBasicMaterial({ color: '#fff2b0' })); b.position.set(Math.cos(a) * r * 1.09, H + Math.sin(a) * r * 1.09, 0.06); g.add(b); R.lampes.push(b); }
  /* la roue qui tourne : le disque, la face peinte, les clous, le moyeu */
  const d = new T.Group(); d.position.set(0, H, 0); g.add(d); R.disque = d;
  const corps = maille(new T.CylinderGeometry(r, r, 0.12, 64), OR); corps.rotation.x = Math.PI / 2; d.add(corps);
  R.cv = document.createElement('canvas'); R.cv.width = R.cv.height = 1024; R.tex = new T.CanvasTexture(R.cv); R.tex.anisotropy = 4;
  const face = new T.Mesh(new T.CircleGeometry(r * 0.955, 64), new T.MeshBasicMaterial({ map: R.tex })); face.position.z = 0.062; d.add(face);
  roue3dFace();
  R.clous = new T.Group(); d.add(R.clous); roue3dClous();
  pose(maille(new T.CylinderGeometry(0.24, 0.28, 0.12, 24), OR), 0, 0, 0.1, d).rotation.x = Math.PI / 2;
  const gemme = pose(maille(new T.OctahedronGeometry(0.13, 0), '#a465e6', 0.03), 0, 0, 0.2, d); gemme.scale.set(1, 1.3, 0.6);
  /* la fleche a clapet, en haut */
  const f = new T.Group(); f.position.set(0, H + r * 1.13, 0.1); g.add(f);
  const cone = maille(new T.ConeGeometry(0.13, 0.3, 4), '#e0233c'); cone.rotation.x = Math.PI; cone.position.y = -0.05; f.add(cone);
  pose(maille(new T.SphereGeometry(0.1, 12, 10), OR), 0, 0.12, 0, f); R.clapet = f;
  /* l'enseigne */
  const ce = document.createElement('canvas'); ce.width = 512; ce.height = 128; const x = ce.getContext('2d');
  x.fillStyle = '#2e1556'; x.beginPath(); if (x.roundRect) x.roundRect(6, 6, 500, 116, 30); else x.rect(6, 6, 500, 116); x.fill(); x.lineWidth = 8; x.strokeStyle = '#f2c14a'; x.stroke();
  x.font = '400 56px "Lilita One", "Arial Black", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ffd24a'; x.fillText('✦ Roue légendaire ✦', 256, 68);
  const ens = new T.Mesh(new T.PlaneGeometry(1.9, 0.475), new T.MeshBasicMaterial({ map: new T.CanvasTexture(ce), transparent: true })); ens.position.set(0, H + r * 1.13 + 0.5, -0.05); g.add(ens);
  pose(maille(new T.BoxGeometry(0.06, 0.5, 0.06), OR), -0.8, H + r * 1.13 + 0.16, -0.08); pose(maille(new T.BoxGeometry(0.06, 0.5, 0.06), OR), 0.8, H + r * 1.13 + 0.16, -0.08);
}
function roue3dClous() { /* un clou d'or a chaque bord de case (le clapet saute dessus) */
  const R = ROUE3D; if (!R.clous) return; while (R.clous.children.length) R.clous.remove(R.clous.children[0]);
  const N = Math.max(1, R.L.length); for (let i = 0; i < N; i++) { const a = Math.PI / 2 - i / N * Math.PI * 2, c = maille(new T.SphereGeometry(0.045, 10, 8), '#fff3c4', 0.02); c.position.set(Math.cos(a) * R.R * 0.9, Math.sin(a) * R.R * 0.9, 0.09); R.clous.add(c); }
}
/* le panneau, en bas de l'ecran, quand on est devant elle */
function roue3dPanneau(res) {
  let ui = document.getElementById('roue3d-ui'); if (!ui) { ui = document.createElement('div'); ui.id = 'roue3d-ui'; ui.className = 'roue3d-ui'; document.body.appendChild(ui); }
  const essai = roue3dEssai(), n = jetonsLeg(), peut = (essai || n > 0) && ROUE3D.L.length > 0, R = ROUE3D;
  ui.innerHTML = '<div class="r3-tete"><img src="assets/icones/jeton-legendaire.png?v=' + VERSION_MODELES + '" alt=""><div><b>La roue légendaire</b><small>' + (essai ? 'Mode test : tours gratuits, rien n\'est donné.' : n + ' jeton' + (n > 1 ? 's' : '') + ' légendaire' + (n > 1 ? 's' : '')) + '</small></div></div>' +
    (res || '<p>' + (peut ? 'Un jeton, un tour. ' + R.L.length + ' cases : chaque légendaire de ton palier ou d\'avant, toutes à la même chance.' : 'Il te faut un jeton légendaire : il se gagne dans les coffres de l\'île des boss, avec plus de chances en haut du classement.') + '</p>') +
    '<div class="r3-boutons"><button class="btn discret" data-r3-quitter' + (R.anim ? ' disabled' : '') + '>Partir</button>' + (peut ? '<button class="btn kamas" data-r3-lancer' + (R.anim ? ' disabled' : '') + '>' + (res && !R.anim ? 'Relancer' : 'Lancer la roue') + '</button>' : '') + '</div>';
  ui.hidden = false;
}
function roue3dOuvrir() {
  const R = ROUE3D; if (!R.g) construireRoue3d(); if (!R.g) return; roue3dFace(); roue3dClous();
  if (!R.ouvert) { R.cam = { v: VISEE.clone(), z: zoom }; R.ouvert = true; }
  const p = new T.Vector3(0, R.H - 0.15, 0); R.g.localToWorld(p); VISEE.copy(p); zoom = innerWidth < innerHeight ? 2.0 : 2.6; cadrer(); placerCamera();
  roue3dPanneau(); if (!R.L.length) toast('Aucune pièce légendaire n\'est encore à ta portée.');
}
function roue3dQuitter(sansCamera) {
  const R = ROUE3D; if (R.anim) return; const ui = document.getElementById('roue3d-ui'); if (ui) ui.hidden = true;
  if (R.ouvert && R.cam && !sansCamera) { VISEE.copy(R.cam.v); zoom = R.cam.z; cadrer(); placerCamera(); } R.ouvert = false; R.cam = null;
}
function roue3dLancer() {
  const R = ROUE3D, essai = roue3dEssai(), N = R.L.length; if (R.anim || !N || !R.disque) return;
  if (!essai) { if (jetonsLeg() <= 0) return; S_.jetonsLeg = jetonsLeg() - 1; }
  const i = Math.floor(Math.random() * N), id = R.L[i]; let cle = null;
  if (!essai) { cle = donnerObjet(id); compter('roueLegendaire'); sauver(); rendreHaut(); majBoutonRoue(); } /* (donne tout de suite : rien ne se perd si on s'en va pendant qu'elle tourne) */
  const pas = Math.PI * 2 / N, c = (i + 0.5) * pas + (Math.random() - 0.5) * pas * 0.7, r0 = R.disque.rotation.z; let r1 = c; while (r1 > r0 - Math.PI * 2 * 6) r1 -= Math.PI * 2; /* (dans le sens des aiguilles d'une montre, six tours au moins) */
  R.anim = { r0, r1, t: 0, d: 6.0, id, cle, essai, idx: null }; roue3dPanneau('<p class="r3-tourne">La roue tourne...</p>');
}
function roue3dAnimer(dt) {
  const R = ROUE3D; if (!R.g) return; const t = performance.now() / 1000; R.g.visible = roueDispo(); if (!R.g.visible) { if (R.ouvert) roue3dQuitter(true); return; } /* (version dev : seulement dans le mode test) */
  if (R.ouvert && !R.anim && paysanMesh) { const [px, pz] = roue3dPlace(), P = paysanMesh.position; if (Math.hypot(P.x - SALLE_CASINO.x - px, P.z - SALLE_CASINO.z - pz) > 2.2) roue3dQuitter(); } /* (le perso s'en va : le panneau se ferme) */
  /* les ampoules qui defilent (plus vite quand elle tourne, en eclairs quand elle s'arrete) */
  const vit = R.anim ? 14 : 3, fl = R.flash > 0; if (fl) R.flash -= dt;
  R.lampes.forEach((b, k) => { const on = fl ? Math.sin(t * 18) > 0 : ((k + Math.floor(t * vit)) % 4) < 2; b.material.color.set(on ? (fl ? '#ffffff' : '#fff2b0') : '#9a6a1a'); });
  if (R.anim) { const A = R.anim; A.t += dt; const k = Math.min(1, A.t / A.d), e = 1 - Math.pow(1 - k, 4); R.disque.rotation.z = A.r0 + (A.r1 - A.r0) * e;
    const N = Math.max(1, R.L.length), pas = Math.PI * 2 / N, c = ((R.disque.rotation.z % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2), idx = Math.floor(c / pas + 0.5) % N; /* (un clou passe sous la fleche) */
    if (A.idx !== null && idx !== A.idx) { R.kick = 1; son('touche'); } A.idx = idx;
    if (k >= 1) { R.anim = null; roue3dFin(A); } }
  R.kick *= Math.exp(-dt * 10); if (R.clapet) R.clapet.rotation.z = -0.5 * R.kick * Math.sin(t * 40);
}
function roue3dFin(A) {
  const o = OBJETS[A.id]; son('victoire'); if (typeof confettis === 'function') confettis(70); ROUE3D.flash = 2.2;
  roue3dPanneau('<div class="r3-gain"><img src="assets/icones/' + iconeObjet(A.cle || A.id) + '.png?v=' + VERSION_MODELES + '" alt=""><div><small>' + (A.essai ? 'Tu aurais gagné' : 'Tu gagnes') + '</small><b>✦ ' + (o ? o.nom : A.id) + '</b><span>' + (A.essai ? 'Essai : rien n\'est donné.' : 'Elle est dans ton sac (Perso).') + '</span></div></div>');
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-r3-lancer],[data-r3-quitter]'); if (!b) return; if (b.hasAttribute('data-r3-lancer')) roue3dLancer(); else roue3dQuitter(); });
/* son coin du hall : un obstacle, une zone qu'on touche, une place devant elle (26b-casino-decor.js, 29-casino-jeux.js) */
if (ROUE_SORTIE) OBST_SALLE.C.push([ROUE3D.x, ROUE3D.z, 1.4]); /* (en version dev, pas d'obstacle invisible pour les joueurs : on la traverse dans le mode test) */
SALLE_PLACES.roue = roue3dPlace().concat([ROUE3D.x, ROUE3D.z]);
{ const zs = zoneSalle; zoneSalle = function (x, z) { return roueDispo() && Math.hypot(x - ROUE3D.x, z - ROUE3D.z) < 1.6 ? 'roue' : zs(x, z); }; }
{ const oj = ouvrirJeuSalle; ouvrirJeuSalle = function (j) { if (j === 'roue') { roue3dOuvrir(); return; } oj(j); }; }
{ const cs = chargerSalle; chargerSalle = async function () { await cs(); construireRoue3d(); }; }
{ const as = animerSalle; animerSalle = function (dt) { as(dt); roue3dAnimer(dt); }; }
{ const sp = sortirPalais; sortirPalais = async function () { ROUE3D.anim = null; roue3dQuitter(true); return sp.apply(this, arguments); }; } /* (en sortant du palais, le panneau se ferme) */
/* le bouton « Roue legendaire » de la barre du Casino : il emmene a la roue */
function allerRoue3d() {
  if (!roueDispo()) return;
  if (lieu !== 'casino') { toast('La roue légendaire est au Casino, dans le hall du palais, près de l\'entrée.'); return; }
  const go = () => { const [x, z] = SALLE_PLACES.roue; aller(x, z, ROUE3D.x, ROUE3D.z, roue3dOuvrir); };
  if (casinoDedans) go(); else entrerPalais().then(() => { if (casinoDedans) setTimeout(go, 300); });
}
