'use strict';
/* LES OBJETS RARES ET LES LEGENDAIRES DES COFFRES DE L'ILE, ET LA ROUE LEGENDAIRE DU CASINO (21/11/2026, « dans les coffres, on laisse pas une chance de
   drop un item rare et un item leg au hasard ? », puis au formulaire, Mathieu) :
   - tout le monde peut les avoir, le taux depend du rang de la semaine :
     une piece rare ★ de sa panoplie (le palier de sa vague) : 1er 35 %, 2e 20 %, 3e 10 %, 4e a 10e 5 %, 11e a 25e 2 %, 26e a 50e 1 %, au-dela 0,5 % ;
     un jeton legendaire : 1er 10 %, 2e 5 %, 3e 2 %, les autres 0,5 % (« c'est 10 % d'avoir une legende, pas 10 % par legende ») ;
   - le jeton se joue a la roue du Casino (« un jeton legendaire qu'on peut jouer a la roue du casino, que tu fais tourner, et ensuite c'est toi et ta
     chance », choisi au formulaire) : une case par legendaire de son palier ou d'avant (une arme : celle de sa classe), toutes a la meme chance ;
     le resultat est tire et donne au lancer (rien ne se perd si on ferme pendant qu'elle tourne), la roue montre ensuite ou elle s'arrete.
   La roue s'ouvre par le bouton « Roue legendaire » de la barre du Casino (quand on a un jeton) et en essai dans le mode test (rien n'est donne). */
const CHANCES_ILE = {
  rare: (r) => (r === 0 ? 0.35 : r === 1 ? 0.2 : r === 2 ? 0.1 : r < 10 ? 0.05 : r < 25 ? 0.02 : r < 50 ? 0.01 : 0.005),
  jeton: (r) => (r === 0 ? 0.1 : r === 1 ? 0.05 : r === 2 ? 0.02 : 0.005) };
const jetonsLeg = () => (S_ && S_.jetonsLeg) || 0;
/* le palier de chaque legendaire : celui de son boss (les demi-boss : la Tortue Corail au palier de Moon, l'Ancestral maudit a celui du Chene Mou) */
const PALIER_LEG_HORS = { tortueCorail: 8, ancestralMaudit: 9 };
const palierLeg = (L) => { const i = PALIERS.findIndex((p) => p.boss === L.boss); return i >= 0 ? i : PALIER_LEG_HORS[L.boss] != null ? PALIER_LEG_HORS[L.boss] : 99; };
function legendairesRoue() { const P = palierCourant(); return LEGENDAIRES.filter((L) => palierLeg(L) <= P && OBJETS[idLeg(L)]).map((L) => idLeg(L)); }
/* le butin rare d'un coffre de l'ile (27-arene.js) : rang 0 = 1er ; pas classe = comme les derniers */
function butinRareIle(rang) {
  const r = rang >= 0 ? rang : 99, out = { objets: [], jeton: 0 };
  if (Math.random() < CHANCES_ILE.rare(r)) { const P = panoAuHasard(palierCourant()), ids = EMPLACEMENTS.map(([e]) => P.id + '-' + e).filter((id) => OBJETS[id + '-rare']);
    if (ids.length) { const id = hasard(ids) + '-rare', k = donnerObjet(id); out.objets.push({ ico: iconeObjet(k), t: OBJETS[id].nom, brille: true, nom: OBJETS[id].nom }); } } /* (le nom d'une piece rare porte deja son etoile) */
  if (Math.random() < CHANCES_ILE.jeton(r)) { S_.jetonsLeg = jetonsLeg() + 1; out.jeton = 1; }
  return out;
}
/* ---------- la roue ---------- */
const ROUE = { essai: false, angle: 0, tourne: false, raf: 0, imgs: {} };
function ouvrirRoueLeg(essai) {
  ROUE.essai = !!essai; const L = legendairesRoue();
  if (!L.length) { toast('Aucune pièce légendaire n\'est encore à ta portée.'); return; }
  const n = jetonsLeg();
  ouvrirModale('roue-leg', entete('La roue légendaire' + (essai ? ' (essai)' : '')) +
    '<p class="hdv-aide">' + (essai ? 'Essai du mode test : rien n\'est donné, autant de tours que tu veux. ' : '') + 'Un jeton, un tour. Chaque légendaire de ton palier ou d\'avant a la même chance : ' + L.length + ' cases.</p>' +
    '<div class="roue-zone"><div class="roue-fleche"></div><canvas class="roue-cv" width="680" height="680"></canvas><div class="roue-centre">✦</div></div>' +
    '<div class="roue-res" aria-live="polite"></div>' +
    '<div class="boutons"><span class="roue-jetons"><img src="assets/icones/jeton-legendaire.png?v=' + VERSION_MODELES + '" alt=""> ' + (essai ? '∞' : n) + ' jeton' + (n > 1 || essai ? 's' : '') + '</span><button class="btn kamas grand" data-roue-lancer' + (n > 0 || essai ? '' : ' disabled') + '>Lancer la roue</button></div>');
  ROUE.L = L; ROUE.tourne = false; roueDessiner(); roueTourner(ROUE.angle);
}
function roueDessiner() {
  const cv = document.querySelector('#carte .roue-cv'); if (!cv) return; const c = cv.getContext('2d'), N = ROUE.L.length, R = cv.width / 2, a0 = -Math.PI / 2, pas = Math.PI * 2 / N;
  c.clearRect(0, 0, cv.width, cv.height);
  c.save(); c.translate(R, R);
  for (let i = 0; i < N; i++) { const a = a0 + i * pas;
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R - 14, a, a + pas); c.closePath(); c.fillStyle = i % 2 ? '#3a1b6e' : '#5b2a9a'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#f2c14a'; c.stroke();
    const id = ROUE.L[i], nom = iconeObjet(id), img = ROUE.imgs[nom] || (ROUE.imgs[nom] = Object.assign(new Image(), { src: 'assets/icones/' + nom + '.png?v=' + VERSION_MODELES }));
    if (!img.complete) img.onload = () => { if (document.querySelector('#carte .roue-cv') === cv) roueDessiner(); };
    else { const am = a + pas / 2, rr = R * 0.62, t = Math.min(150, R * pas * 0.5); c.save(); c.translate(Math.cos(am) * rr, Math.sin(am) * rr); c.rotate(am + Math.PI / 2); c.drawImage(img, -t / 2, -t / 2, t, t); c.restore(); } }
  c.beginPath(); c.arc(0, 0, R - 8, 0, Math.PI * 2); c.lineWidth = 14; c.strokeStyle = '#f2c14a'; c.stroke(); c.lineWidth = 3; c.strokeStyle = '#7a5010'; c.stroke();
  for (let i = 0; i < N; i++) { const a = a0 + i * pas; c.beginPath(); c.arc(Math.cos(a) * (R - 8), Math.sin(a) * (R - 8), 7, 0, Math.PI * 2); c.fillStyle = '#fff3c4'; c.fill(); } /* (les clous du bord, a chaque case) */
  c.restore();
}
const roueTourner = (a) => { ROUE.angle = a; const cv = document.querySelector('#carte .roue-cv'); if (cv) cv.style.transform = 'rotate(' + a + 'rad)'; };
function roueLancer() {
  if (ROUE.tourne) return; const L = ROUE.L, N = L.length; if (!N) return;
  if (!ROUE.essai) { if (jetonsLeg() <= 0) return; S_.jetonsLeg = jetonsLeg() - 1; }
  const i = Math.floor(Math.random() * N), id = L[i]; let cle = null;
  if (!ROUE.essai) { cle = donnerObjet(id); compter('roueLegendaire'); sauver(); } /* (donne tout de suite : rien ne se perd si on ferme pendant qu'elle tourne) */
  ROUE.tourne = true; document.querySelectorAll('#carte [data-roue-lancer]').forEach((b) => { b.disabled = true; }); const res = document.querySelector('#carte .roue-res'); if (res) res.innerHTML = '';
  const pas = Math.PI * 2 / N, depart = ROUE.angle, centre = -(i + 0.5) * pas, jeu = (Math.random() - 0.5) * pas * 0.7;
  let fin = centre + jeu; while (fin < depart + Math.PI * 2 * 6) fin += Math.PI * 2; /* (au moins six tours) */
  const D = 5600, t0 = performance.now(); let dernier = Math.floor(((-depart) / pas) + 1e6);
  const image = (now) => { const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 4), a = depart + (fin - depart) * e; roueTourner(a);
    const caseSous = Math.floor((-a) / pas + 1e6); if (caseSous !== dernier) { dernier = caseSous; son('touche'); } /* (le cliquetis, a chaque case qui passe sous la fleche) */
    if (k < 1 && document.querySelector('#carte .roue-cv')) { ROUE.raf = requestAnimationFrame(image); return; }
    ROUE.tourne = false; roueResultat(id, cle); };
  cancelAnimationFrame(ROUE.raf); ROUE.raf = requestAnimationFrame(image);
}
function roueResultat(id, cle) {
  const o = OBJETS[id], res = document.querySelector('#carte .roue-res'); son('victoire'); if (typeof confettis === 'function') confettis(70);
  if (res) res.innerHTML = '<div class="roue-gain"><img src="assets/icones/' + iconeObjet(cle || id) + '.png?v=' + VERSION_MODELES + '" alt=""><div><small>' + (ROUE.essai ? 'Tu aurais gagné' : 'Tu gagnes') + '</small><b>✦ ' + (o ? o.nom : id) + '</b><span>' + (ROUE.essai ? 'Essai : rien n\'est donné.' : 'Elle est dans ton sac (Perso).') + '</span></div></div>';
  const n = jetonsLeg(); document.querySelectorAll('#carte .roue-jetons').forEach((e) => { e.lastChild.textContent = ' ' + (ROUE.essai ? '∞' : n) + ' jeton' + (n > 1 || ROUE.essai ? 's' : ''); });
  document.querySelectorAll('#carte [data-roue-lancer]').forEach((b) => { b.disabled = !(ROUE.essai || n > 0); b.textContent = 'Relancer'; });
  if (!ROUE.essai) { rendreHaut(); if (typeof majBoutonRoue === 'function') majBoutonRoue(); }
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-roue-lancer],#b-roue-leg,[data-roue-essai],[data-roue-ouvrir]'); if (!b) return;
  if (b.hasAttribute('data-roue-lancer')) { roueLancer(); return; }
  if (b.hasAttribute('data-roue-essai')) { ouvrirRoueLeg(true); return; }
  if (b.id === 'b-roue-leg' && typeof allerRoue3d === 'function') { allerRoue3d(); return; } /* (la barre du Casino : la vraie roue, dans le hall, 29o-roue-3d.js) */
  ouvrirRoueLeg(false); });
/* le bouton de la barre du Casino, quand on a un jeton */
function majBoutonRoue() {
  const barre = document.getElementById('casino-barre'); if (!barre) return; let b = document.getElementById('b-roue-leg'); const n = jetonsLeg();
  if (!b) { b = document.createElement('button'); b.id = 'b-roue-leg'; b.className = 'btn roue-btn'; const r = document.getElementById('b-rentrer'); barre.insertBefore(b, r || null); }
  b.hidden = !(n > 0); b.innerHTML = '<img src="assets/icones/jeton-legendaire.png?v=' + VERSION_MODELES + '" alt=""> Roue légendaire (' + n + ')';
}
if (typeof majBarreCasino === 'function') { const avant = majBarreCasino; majBarreCasino = function () { avant.apply(this, arguments); majBoutonRoue(); }; } /* (la barre du Casino, 26-casino.js) */
