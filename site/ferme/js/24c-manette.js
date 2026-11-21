'use strict';
/* LA MANETTE ET LES TOUCHES DES SORTS (21/11/2026, « tu penses qu'on peut mettre un mode manette Xbox sur le jeu ? », puis « ouais, meme logique que sur tel »,
   et « pour les spells, tu peux mettre sur des boutons qu'on peut parametrer aussi dans les Options en fonction de si on choisit souris / manette », Mathieu).
   - Une manette Xbox (ou toute manette reconnue par le navigateur, en USB ou en Bluetooth, PC comme telephone Android), en combat, comme les commandes au doigt :
     le stick gauche fait marcher le perso (le meme joystick que le telephone : 10 % moins vite, JOYSTICK_LENT ; le Iop va seul au contact quand on le lache) ;
     un bouton de sort appuye puis lache : le sort part tout seul (visee automatique, recharge +15 %, RECHARGE_AUTO_DOIGT) ; garde-le appuye et vise au stick
     droit : le cercle suit le stick, il part au lacher, sans malus ; LT annule la visee ; le stick droit tourne et incline la camera hors visee ; LB et RB font un
     quart de tour ; View remet la camera de depart ; Menu met en pause.
   - Hors combat (21/11/2026, « fais toutes les autres etapes, pas que le boss de l'ile a la manette », Mathieu) : sur la ferme, le stick gauche fait marcher le
     perso (a sa vitesse normale), un cadre dore montre la case devant lui et A y agit comme le clic droit (labourer, planter, recolter, ouvrir un batiment, caresser
     le gardien, chasser le voleur) ; B termine l'amenagement ; Y passe sur les boutons du jeu (la barre du bas, Options, la vitesse...) ; X sort un curseur, pour
     tout le reste (un terrain a acheter, la montgolfiere, le Casino) : le stick gauche le bouge, A agit (clic droit), Y deplace (clic gauche), B le range.
     Dans toutes les fenetres (et l'accueil, la pause, les lecons de Pepito, la simu VSA) : la croix ou le stick gauche passent d'un bouton a l'autre, A clique,
     B ferme, le stick droit fait defiler, LB et RB changent d'onglet.
   - Les touches des quatre sorts (le sort de classe, l'ulti, la 1re et la 2e legendaire) se reglent dans Options > Commandes, au clavier pour « Souris et clavier »
     et aux boutons pour « Manette ». Le choix et les touches restent dans ce navigateur. Les touches de la camera et de la pause ne bougent pas. */
const CMD_CLE = 'ferme-commandes';
const CMD_DEFAUT = { mode: 'souris', clavier: { sort: ['Digit1', '1'], ulti: ['Digit2', '2'], leg3: ['Digit3', '3'], leg4: ['Digit4', '4'] }, manette: { sort: 0, ulti: 1, leg3: 2, leg4: 3 } };
const CMD_ACTIONS = [['sort', 'Le sort de classe'], ['ulti', 'L\'ulti'], ['leg3', 'La 1re légendaire'], ['leg4', 'La 2e légendaire']];
const NOMS_BOUTONS = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', 'Menu', 'Stick G', 'Stick D', '↑', '↓', '←', '→'];
const TOUCHES_RESERVEES = ['KeyQ', 'KeyE', 'KeyR', 'KeyW', 'KeyS', 'KeyP', 'Space', 'Escape', 'Enter', 'Tab'], BOUTONS_RESERVES = [4, 5, 6, 8, 9]; /* (la camera, la pause, l'annulation) */
const commandesJeu = (() => { let c = null; try { c = JSON.parse(localStorage.getItem(CMD_CLE) || 'null'); } catch (e) { c = null; }
  const d = JSON.parse(JSON.stringify(CMD_DEFAUT)); if (!c) return Object.assign(d, { choisi: false });
  return { mode: c.mode === 'manette' ? 'manette' : 'souris', clavier: Object.assign(d.clavier, c.clavier || {}), manette: Object.assign(d.manette, c.manette || {}), choisi: true }; })();
function cmdSauver() { commandesJeu.choisi = true; try { localStorage.setItem(CMD_CLE, JSON.stringify({ mode: commandesJeu.mode, clavier: commandesJeu.clavier, manette: commandesJeu.manette })); } catch (e) { /* rien */ } majToucheSorts(); }
const mnPad = () => { let L = []; try { L = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { L = []; } for (const p of L || []) if (p && p.connected) return p; return null; };
const manetteEnJeu = () => commandesJeu.mode === 'manette' && !!mnPad();
/* les libelles des touches, sur les boutons de sort (data-touche, css : le petit rond) */
const libelleTouche = (a) => (commandesJeu.mode === 'manette' ? NOMS_BOUTONS[commandesJeu.manette[a]] || '?' : (commandesJeu.clavier[a] || [])[1] || '?');
function majToucheSorts() {
  const co = !!(typeof combat !== 'undefined' && combat && legDe('coiffe')), r = (id) => document.getElementById(id);
  if (r('sort-rond')) r('sort-rond').dataset.touche = libelleTouche('sort'); if (r('ulti-rond')) r('ulti-rond').dataset.touche = libelleTouche('ulti');
  if (r('leg-coiffe-rond')) r('leg-coiffe-rond').dataset.touche = libelleTouche('leg3'); if (r('leg-arme-rond')) r('leg-arme-rond').dataset.touche = libelleTouche(co ? 'leg4' : 'leg3');
  document.body.classList.toggle('mode-manette', commandesJeu.mode === 'manette');
}
/* le clavier : la touche reglee (et son double du pave numerique pour les chiffres) */
const LANCER_ACTION = { sort: () => lancerSort(), ulti: () => lancerUlti(), leg3: () => legTouche(3), leg4: () => legTouche(4) };
function actionTouche(code) { /* (dans les deux modes : le clavier reste branche avec la manette) */
  for (const [a] of CMD_ACTIONS) { const k = (commandesJeu.clavier[a] || [])[0]; if (k && (k === code || (/^Digit\d$/.test(k) && code === 'Numpad' + k.slice(5)))) return LANCER_ACTION[a]; }
  return null;
}
/* ---------- la manette en combat ---------- */
const mnEtat = { avant: [], vise: null, t: performance.now(), annonce: false };
const cleAction = (a) => (a === 'sort' ? 'sort' : a === 'ulti' ? 'ulti' : typeof empTouche === 'function' ? empTouche(a === 'leg3' ? 3 : 4) : null);
function mnHorsJeu() { if (mnEtat.marche) mnStopMarche(); mnCurseur(false); mnCadreVu(false); mnFocus(null); mnEtat.hud = false; mnEtat.couche = null; }
function mnLacherVisee(sansTir) { /* le bouton du sort lache : le cercle vise au stick droit part tel quel ; sinon, visee automatique (+15 % de recharge) */
  const V = mnEtat.vise; mnEtat.vise = null; if (!V || sansTir || !visee || visee.bouton !== V.cle) return;
  if (V.max >= 0.25 && visee.point) { tirerVisee(visee.point); return; }
  const p = dgPointAuto(visee); if (!p) { annulerVisee(); return; } visee.point = p; const B = BOUTONS_SORT[V.cle], c = combat, avant = c && B ? c[B.cd] || 0 : 0; tirerVisee(p);
  if (c && B && (c[B.cd] || 0) > avant) { c[B.cd] *= RECHARGE_AUTO_DOIGT; (c.cdMaxDoigt = c.cdMaxDoigt || {})[B.cd] = c[B.cd]; }
}
function mnMaj(dt) {
  const p = mnPad(); if (!p) { if (mnEtat.vise) mnEtat.vise = null; mnHorsJeu(); return; }
  if (!mnEtat.annonce) { mnEtat.annonce = true; if (!commandesJeu.choisi) { commandesJeu.mode = 'manette'; cmdSauver(); } if (typeof toast === 'function') toast(commandesJeu.mode === 'manette' ? 'Manette détectée : stick gauche pour marcher, A pour agir sur la case devant toi, Y pour les boutons du jeu, X pour le curseur ; en combat, ' + ['sort', 'ulti', 'leg3', 'leg4'].map((a) => libelleTouche(a)).join(', ') + ' pour les sorts. Options > Commandes pour régler.' : 'Manette détectée : choisis « Manette » dans Options > Commandes pour jouer avec.'); }
  if (commandesJeu.mode !== 'manette') { mnHorsJeu(); return; }
  const B = p.buttons.map((b) => !!(b && (b.pressed || b.value > 0.5))), prec = mnEtat.avant, appui = (i) => B[i] && !prec[i], lache = (i) => !B[i] && prec[i]; mnEtat.avant = B; /* (l'etat d'avant, garde a part : sinon aucun appui n'etait vu) */
  if (mnEtat.capture) { const i = B.findIndex((b, k) => b && !mnEtat.capture.avant[k]); mnEtat.capture.avant = B; if (i >= 0) cmdCapturer(i); return; } /* (Options > Commandes : un bouton a regler) */
  if (appui(9) && typeof mettrePause === 'function' && !(typeof lecon !== 'undefined' && lecon.ouverte)) mettrePause(!enPause);
  const ax = (i) => { const v = p.axes[i] || 0; return Math.abs(v) < 0.12 ? 0 : v; }, lx = ax(0), ly = ax(1), rx = ax(2), ry = ax(3);
  /* hors combat, le cadre et le bouton entoure ne se montrent que si la manette a servi depuis 90 s (un joueur a la souris, manette branchee, ne les voit pas) ;
     la premiere pression apres un repos ne fait que les reveiller */
  const tm = performance.now(), dormait = tm - (mnEtat.actif == null ? -1e9 : mnEtat.actif) > 90000; if (B.some(Boolean) || p.axes.some((v) => Math.abs(v || 0) > 0.3)) mnEtat.actif = tm;
  const couche = mnCouche();
  if (couche) { if (dg.joy && dg.joy.id === 'manette') dg.joy = null; if (mnEtat.vise) mnLacherVisee(true); mnStopMarche(); mnCurseur(false); mnCadreVu(false); if (dormait) { mnFocus(null); mnEtat.couche = null; return; } mnFenetre(couche, B, appui, lx, ly, ry, dt); return; }
  mnFocus(null); mnEtat.couche = null;
  const enCombat = !!(combat && !combat.fin && paysanMesh && lieu !== 'casino' && lieu !== 'cabane' && !enPause && !enAccueil);
  if (!enCombat) { if (dg.joy && dg.joy.id === 'manette') dg.joy = null; if (mnEtat.vise) mnLacherVisee(true); if (dormait) { mnStopMarche(); mnCurseur(false); mnCadreVu(false); mnEtat.hud = false; return; } mnFerme(dt, B, appui, lx, ly, rx, ry); return; }
  mnStopMarche(); mnCurseur(false); mnCadreVu(false); mnEtat.hud = false;
  /* marcher : le joystick du telephone */
  const n = Math.min(1, Math.hypot(lx, ly));
  if (n >= 0.22) dg.joy = { id: 'manette', ox: 0, oy: 0, vx: lx / (n || 1), vy: ly / (n || 1), n }; else if (dg.joy && dg.joy.id === 'manette') dg.joy = null;
  if (!dg.on) dgMarcher(); /* (au telephone, dgMaj le fait deja) */
  /* les sorts */
  CMD_ACTIONS.forEach(([a]) => { const i = commandesJeu.manette[a]; if (i == null) return;
    if (appui(i) && !mnEtat.vise) { const cle = cleAction(a); if (!cle) return; const v = dgArmer(cle); if (v && v !== 'instant') mnEtat.vise = { cle, action: a, max: 0 }; }
    else if (lache(i) && mnEtat.vise && mnEtat.vise.action === a) mnLacherVisee(false); });
  if (mnEtat.vise) {
    if (appui(6)) { mnLacherVisee(true); annulerVisee(); return; } /* (LT : annuler) */
    if (!visee) { mnEtat.vise = null; return; }
    const nr = Math.min(1, Math.hypot(rx, ry)); mnEtat.vise.max = Math.max(mnEtat.vise.max, nr); const q = nr >= 0.25 ? dgPointGlisse(visee, rx, ry) : dgPointAuto(visee); if (q) visee.point = q;
    return; }
  mnCamera(dt, rx, ry, appui);
}
function mnCamera(dt, rx, ry, appui) { /* la camera : le stick droit, LB et RB, View */
  if (Math.abs(rx) > 0.25) tournerCamera(rx * dt * 2.4);
  if (Math.abs(ry) > 0.35) inclinerCamera(-ry * dt * 0.9);
  const base = angleVise != null ? angleVise : angleCam;
  if (appui(4)) tournerCameraVers(base - Math.PI / 2); else if (appui(5)) tournerCameraVers(base + Math.PI / 2);
  if (appui(8)) { tournerCameraVers(ANGLE_DEPART + Math.round((angleCam - ANGLE_DEPART) / (2 * Math.PI)) * 2 * Math.PI); inclinerCameraVers(ELEV_DEPART); }
}
/* ---------- la manette hors combat : la ferme ---------- */
function mnStopMarche() { if (!mnEtat.marche) return; mnEtat.marche = false; if (!combat) { chemin = []; arrivee = null; } if (paysanMesh && mnEtat.dir != null) paysanMesh.userData.angle = mnEtat.dir; }
const mnAngle = () => (mnEtat.dir != null ? mnEtat.dir : paysanMesh.userData.angle != null ? paysanMesh.userData.angle : paysanMesh.rotation.y);
function mnLibre(x0, z0, x, z) { /* sur la ferme : jusqu'ou il marche en ligne droite, a 0,3 d'un champ ou d'un batiment (il peut longer un champ) ; ailleurs, le sol du lieu */
  if (lieu !== 'ferme' || combat) return dgLibre(x0, z0, x, z);
  const L = Math.hypot(x - x0, z - z0); if (L < 0.01) return { x: x0, z: z0 }; const ux = (x - x0) / L, uz = (z - z0) / L; let ok = 0, prec = caseSous(x0, z0);
  for (let t = 0.2; t < L + 0.1; t += 0.2) { const tt = Math.min(t, L), qx = x0 + ux * tt, qz = z0 + uz * tt, c = caseSous(qx, qz), d = caseSous(qx + ux * 0.3, qz + uz * 0.3);
    if (!c || !praticable(c) || !d || !praticable(d)) break; if (prec && c !== prec && !voisins(prec).includes(c) && !coinLibre(prec, c)) break; prec = c; ok = tt; }
  return { x: x0 + ux * ok, z: z0 + uz * ok };
}
function mnMarcher(lx, ly) { /* le stick gauche, comme le joystick du telephone en combat, mais a la vitesse normale et sans glisser loin : pousse vers un champ, il s'arrete et le regarde */
  const n = Math.min(1, Math.hypot(lx, ly)), P = paysanMesh.position, u = paysanMesh.userData;
  if (n < 0.22) { mnStopMarche(); return; }
  const a = angleCam, drx = Math.sin(a), drz = -Math.cos(a), avx = -Math.cos(a), avz = -Math.sin(a), vx = lx / n, vy = ly / n, wx = drx * vx - avx * vy, wz = drz * vx - avz * vy, L = 1.6;
  mnEtat.dir = Math.atan2(wx, wz);
  if (!mnEtat.marche) { arrivee = null; fileActions.length = 0; document.querySelectorAll('.bulle.file').forEach((e) => e.classList.remove('file')); u.chasse = null; } /* (le joueur reprend la main : la file d'actions s'arrete) */
  let best = null;
  for (const r of [0, 0.4, -0.4]) { const cs = Math.cos(r), sn = Math.sin(r), dx = wx * cs - wz * sn, dz = wx * sn + wz * cs, f = mnLibre(P.x, P.z, P.x + dx * L, P.z + dz * L), g = Math.hypot(f.x - P.x, f.z - P.z) * Math.cos(r);
    if (!best || g > best.g) best = { x: f.x, z: f.z, g }; if (r === 0 && g > L * 0.6) break; }
  if (!best || best.g < 0.25) { if (mnEtat.marche) { mnEtat.marche = false; chemin = []; } u.angle = mnEtat.dir; return; } /* (bloque : il se tourne vers la ou l'on pousse, la case devant lui est visee) */
  const ici = caseSous(P.x, P.z); if (ici && praticable(ici)) u.cellule = ici;
  chemin = [{ c: caseIci(best.x, best.z) || u.cellule, x: best.x, z: best.z }]; mnEtat.marche = true;
}
function mnCaseVisee() { /* la case devant le perso (pas celle ou il se tient) */
  if (!paysanMesh || !S_ || lieu !== 'ferme') return null; const P = paysanMesh.position, a = mnAngle(), ici = caseSous(P.x, P.z);
  for (const d of [S * 0.7, S * 1.1]) { const c = caseSous(P.x + Math.sin(a) * d, P.z + Math.cos(a) * d); if (c && c !== ici) return c; }
  return null;
}
let mnCadre = null;
function mnCadreVu(c) { /* le cadre dore sur la case visee (le batiment entier s'il en fait plusieurs) */
  if (!c) { if (mnCadre) mnCadre.visible = false; return; }
  if (!mnCadre) { mnCadre = new T.Group(); const mat = new T.MeshBasicMaterial({ color: '#ffd24a', transparent: true, opacity: 0.9, depthTest: false, depthWrite: false });
    for (let i = 0; i < 4; i++) { const m = new T.Mesh(new T.PlaneGeometry(1, 1), mat); m.rotation.x = -Math.PI / 2; m.renderOrder = 998; m.raycast = () => {}; mnCadre.add(m); } /* (jamais touche par un clic) */
    mnCadre.userData.mat = mat; scene.add(mnCadre); }
  const L = blocDe(c).map(posCase), x0 = Math.min(...L.map((q) => q.x)) - S / 2 + 0.12, x1 = Math.max(...L.map((q) => q.x)) + S / 2 - 0.12, z0 = Math.min(...L.map((q) => q.z)) - S / 2 + 0.12, z1 = Math.max(...L.map((q) => q.z)) + S / 2 - 0.12, e = 0.1, W = x1 - x0, H = z1 - z0;
  const [a, b, g, d] = mnCadre.children; a.scale.set(W, e, 1); a.position.set(0, 0, -H / 2); b.scale.set(W, e, 1); b.position.set(0, 0, H / 2); g.scale.set(e, H, 1); g.position.set(-W / 2, 0, 0); d.scale.set(e, H, 1); d.position.set(W / 2, 0, 0);
  mnCadre.position.set((x0 + x1) / 2, 0.06, (z0 + z1) / 2); mnCadre.userData.mat.opacity = 0.65 + 0.3 * Math.sin(performance.now() / 160); mnCadre.visible = true;
}
function mnEcran(x, y, z) { const v = new T.Vector3(x, y, z).project(camera), r = canvas.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; }
function mnClic(x, y, bouton) { /* un vrai clic (droit : agir ; gauche : se deplacer) a l'endroit du curseur, avec tout ce que fait la souris */
  const el = document.elementFromPoint(x, y); if (!el) return;
  if (el !== canvas) { const c = el.closest('button, a[href], [data-cible], .bulle, [role="button"]') || el; if (bouton === 2 && c.closest('#bulles')) { c.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y })); return; } c.click(); return; }
  const o = { clientX: x, clientY: y, button: bouton, buttons: bouton === 2 ? 2 : 1, pointerType: 'mouse', isPrimary: true, pointerId: 1, bubbles: true, cancelable: true };
  canvas.dispatchEvent(new PointerEvent('pointerdown', o)); canvas.dispatchEvent(new PointerEvent('pointerup', Object.assign({}, o, { buttons: 0 })));
}
function mnAgir() { /* A sur la ferme : comme un clic droit sur la case devant le perso */
  const P = paysanMesh.position, u = paysanMesh.userData, a = mnAngle(), ax = P.x + Math.sin(a) * S * 0.8, az = P.z + Math.cos(a) * S * 0.8; u.chasse = null;
  if (!mode) {
    if (typeof voleurCiblable === 'function' && voleurCiblable() && voleur.m && Math.hypot(voleur.m.position.x - P.x, voleur.m.position.z - P.z) < 4) { attaquerVoleur(); return; }
    if (typeof gard !== 'undefined' && gard && gard.x != null && Math.hypot(gard.x - ax, gard.z - az) < 1.3) { caresserGardien(); return; }
  }
  const c = mnCaseVisee();
  if (c && !mode) { S_.clicsDroits = (S_.clicsDroits || 0) + 1; ACTIONS.toucherCase(c.id); sauver(); return; }
  /* sans case (un terrain a acheter, une friche, la montgolfiere) ou en amenageant : le clic droit la ou il regarde */
  const q = c ? posCase(c) : { x: P.x + Math.sin(a) * S * 1.2, z: P.z + Math.cos(a) * S * 1.2 }, e = mnEcran(q.x, 0.3, q.z); mnClic(e.x, e.y, 2);
}
function mnCurseur(oui) { /* X : le curseur, pour tout ce que la case devant le perso ne touche pas */
  let el = document.getElementById('mn-curseur');
  if (!oui) { if (mnEtat.cur) { mnEtat.cur = null; if (el) el.hidden = true; } return; }
  if (!el) { el = document.createElement('div'); el.id = 'mn-curseur'; el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2.5l15 9.2-6.6 1.3 3.9 7.4-2.7 1.4-3.9-7.4L4 19.2z" fill="#ffd24a" stroke="#1d1e22" stroke-width="1.6" stroke-linejoin="round"/></svg>'; document.body.appendChild(el); }
  if (!mnEtat.cur) { const q = paysanMesh ? mnEcran(paysanMesh.position.x, 1, paysanMesh.position.z) : { x: innerWidth / 2, y: innerHeight / 2 }; mnEtat.cur = { x: Math.max(10, Math.min(innerWidth - 10, q.x)), y: Math.max(10, Math.min(innerHeight - 10, q.y)), t: 0 }; }
  el.hidden = false; el.style.transform = 'translate(' + Math.round(mnEtat.cur.x) + 'px,' + Math.round(mnEtat.cur.y) + 'px)';
}
function mnFerme(dt, B, appui, lx, ly, rx, ry) {
  const ok = !!(paysanMesh && S_ && S_.perso && !enAccueil && !enPause && !(typeof peche !== 'undefined' && peche && peche.etat !== 'marche'));
  if (!ok) { mnStopMarche(); mnCurseur(false); mnCadreVu(false); return; }
  const libre = lieu === 'casino' || lieu === 'cabane'; /* (le Casino et la cabane du pecheur se jouent au curseur : ils ont leurs propres chemins) */
  if (appui(2) && !libre) { if (mnEtat.cur) mnCurseur(false); else { mnStopMarche(); mnCurseur(true); if ((mnEtat.aideCur = (mnEtat.aideCur || 0) + 1) <= 2) toast('Curseur : stick gauche pour le bouger, A pour agir, Y pour te déplacer, B pour le ranger.'); } }
  if (mnEtat.cur || libre) { /* le curseur */
    mnStopMarche(); mnCadreVu(false); if (!mnEtat.cur) mnCurseur(true);
    const n = Math.min(1, Math.hypot(lx, ly)), C = mnEtat.cur, v = 950 * n * n * dt, d = (i) => (B[i] ? 1 : 0);
    if (n >= 0.15) { C.x += lx / (n || 1) * v; C.y += ly / (n || 1) * v; }
    if (appui(12) || appui(13) || appui(14) || appui(15)) { C.x += (d(15) - d(14)) * 12; C.y += (d(13) - d(12)) * 12; }
    C.x = Math.max(4, Math.min(innerWidth - 4, C.x)); C.y = Math.max(4, Math.min(innerHeight - 4, C.y)); mnCurseur(true);
    if ((n >= 0.15 || C.bouge) && performance.now() - C.t > 50) { C.t = performance.now(); C.bouge = n >= 0.15; canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: C.x, clientY: C.y, pointerType: 'mouse', isPrimary: true, pointerId: 1, buttons: 0, bubbles: true })); } /* (le survol : la portee d'une lanterne, l'emplacement d'un batiment) */
    if (appui(0)) mnClic(C.x, C.y, libre ? 0 : 2); else if (appui(3)) mnClic(C.x, C.y, 0);
    if (appui(1) && !libre) mnCurseur(false);
    mnCamera(dt, rx, ry, appui); return;
  }
  /* la marche, la case visee, A */
  mnMarcher(lx, ly);
  const c = mnCaseVisee(); mnCadreVu(c);
  if (appui(0)) mnAgir();
  if (appui(1) && mode) { const t = document.getElementById('b-terminer'); if (t && !t.closest('[hidden]')) t.click(); }
  if (appui(3)) { mnStopMarche(); mnEtat.hud = true; mnEtat.hudDepuis = performance.now(); if ((mnEtat.aideHud = (mnEtat.aideHud || 0) + 1) <= 2) toast('Boutons du jeu : la croix pour choisir, A pour ouvrir, B pour revenir à la ferme.'); }
  mnCamera(dt, rx, ry, appui);
}
addEventListener('pointerdown', (e) => { if (e.isTrusted && e.pointerType === 'mouse') { mnEtat.dir = null; mnEtat.actif = null; } }, true); /* (un vrai clic de souris : le perso ne vise plus la ou pointait le stick, et le cadre se range) */ /* (un vrai clic de souris : le perso ne vise plus la ou pointait le stick) */
/* ---------- les fenetres : la croix passe d'un bouton a l'autre ---------- */
const mnVu = (el) => !!(el && !el.hidden && !el.closest('[hidden]') && el.getClientRects().length);
function mnCouche() { /* la fenetre au premier plan, ou rien (la ferme) */
  const $$ = (id) => document.getElementById(id);
  if (mnVu($$('simu-pop'))) return { el: [$$('simu-pop')], genre: 'simu' };
  if (typeof lecon !== 'undefined' && lecon.ouverte && mnVu(lecon.el)) return { el: [lecon.el], genre: 'lecon' };
  const m = $$('modale'); if (m && m.classList.contains('ouverte')) return { el: [$$('carte')], genre: 'modale:' + (modaleOuverte || '') };
  if (enPause && mnVu($$('ecran-pause'))) return { el: [$$('ecran-pause')], genre: 'pause' };
  if (enAccueil && mnVu($$('accueil'))) return { el: [$$('accueil')], genre: 'accueil' };
  if (mnEtat.hud && !combat) return { el: [$$('hud'), $$('tuto')].filter(Boolean), genre: 'hud', exclus: '#bulles, #combat-zone, #bats-pv, #info-survol, #combat, #ecran-pause, #simu-pop' };
  return null;
}
const MN_SEL = 'button, a[href], input, select, summary, [role="button"], [tabindex]:not([tabindex="-1"])';
function mnCibles(C) { /* les elements cliquables visibles de la fenetre (boutons, et tout ce qui montre la main a la souris) */
  const L = [];
  C.el.forEach((r) => r && r.querySelectorAll('*').forEach((el) => {
    if (C.exclus && el.closest(C.exclus)) return; if (el.disabled || el.id === 'mn-curseur') return;
    const cs = getComputedStyle(el);
    if (!el.matches(MN_SEL)) { if (cs.cursor !== 'pointer') return; const pa = el.parentElement; if (pa && getComputedStyle(pa).cursor === 'pointer') return; }
    if (cs.pointerEvents === 'none' || cs.visibility === 'hidden') return; if (el.matches('input[type="hidden"]')) return;
    const R = el.getBoundingClientRect(); if (R.width < 6 || R.height < 6 || !mnVu(el)) return; L.push(el); }));
  return L;
}
const mnSig = (el) => el.tagName + '|' + el.id + '|' + [...el.attributes].filter((a) => a.name.startsWith('data-') || a.name === 'name').map((a) => a.name + '=' + a.value).join(',') + '|' + (el.textContent || '').trim().slice(0, 40);
function mnFocus(el) {
  const a = mnEtat.focus; if (a === el) return; if (a) a.classList.remove('mn-focus'); mnEtat.focus = el || null;
  if (el) { el.classList.add('mn-focus'); mnEtat.sig = mnSig(el); try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { /* rien */ } }
}
function mnDepart(C, L) { /* le premier bouton d'une fenetre : pas la croix qui la ferme */
  if (C.genre === 'hud') return document.getElementById('b-graine') && L.includes(document.getElementById('b-graine')) ? document.getElementById('b-graine') : L[0];
  return L.find((el) => !el.hasAttribute('data-fermer')) || L[0];
}
function mnBouger(L, dx, dy) { /* le bouton le plus proche dans la direction poussee */
  const f = mnEtat.focus; if (!f || !L.includes(f)) { mnFocus(L[0]); return; }
  const a = f.getBoundingClientRect(), cx = a.left + a.width / 2, cy = a.top + a.height / 2; let best = null, bs = Infinity;
  for (const el of L) { if (el === f) continue; const r = el.getBoundingClientRect(), ex = r.left + r.width / 2, ey = r.top + r.height / 2;
    const prim = dx ? (ex - cx) * dx : (ey - cy) * dy; if (prim <= 3) continue;
    const recouvre = dx ? Math.max(r.top, a.top) < Math.min(r.bottom, a.bottom) : Math.max(r.left, a.left) < Math.min(r.right, a.right);
    const sec = recouvre ? 0 : dx ? Math.abs(ey - cy) : Math.abs(ex - cx), sc = prim + sec * 2.2; if (sc < bs) { bs = sc; best = el; } }
  if (best) mnFocus(best);
}
function mnOnglet(L, sens) { /* LB et RB : l'onglet d'a cote (le premier groupe d'onglets de la fenetre) */
  const tab = (el) => el.hasAttribute('aria-pressed') || el.matches('[role="tab"]') || (el.parentElement && el.parentElement.matches('.vg-onglets, .dev-onglets, .fp-onglets, .hdv-cats, .seg'));
  const groupe = L.filter(tab), p0 = groupe[0] && groupe[0].parentElement; if (!p0) return; const G = groupe.filter((el) => el.parentElement === p0); if (G.length < 2) return;
  const i = G.findIndex((el) => el.getAttribute('aria-pressed') === 'true' || el.classList.contains('on') || el.classList.contains('actif')), j = ((i < 0 ? 0 : i + sens) + G.length) % G.length;
  const sg = mnSig(G[j]); mnFocus(null); G[j].click(); mnEtat.sig = sg;
}
function mnFermer(C) { /* B */
  if (C.genre.startsWith('modale')) { const x = document.querySelector('#carte [data-fermer]'); if (x && mnVu(x)) x.click(); else if (!document.getElementById('modale').dataset.aLire) fermerModale(); return; }
  if (C.genre === 'pause') { mettrePause(false); return; }
  if (C.genre === 'hud') { mnEtat.hud = false; return; }
  if (C.genre === 'accueil') { const r = document.querySelector('#accueil .retour-parties'); if (r && mnVu(r)) r.click(); }
}
function mnFenetre(C, B, appui, lx, ly, ry, dt) {
  const t = performance.now(), neuve = mnEtat.couche !== C.genre; mnEtat.couche = C.genre;
  let L = null; const cibles = () => L || (L = mnCibles(C));
  if (neuve) { mnFocus(null); mnEtat.sig = null; mnEtat.essai = 0; }
  if (!mnEtat.focus || !mnEtat.focus.isConnected || !mnVu(mnEtat.focus)) { /* la fenetre vient de s'ouvrir, ou s'est redessinee : le meme bouton qu'avant, sinon le premier */
    if (t - (mnEtat.essai || 0) > 200 || neuve) { mnEtat.essai = t; const l = cibles(); if (l.length) { const m = mnEtat.sig && l.find((el) => mnSig(el) === mnEtat.sig); mnEtat.focus = null; mnFocus(m || mnDepart(C, l)); } } }
  /* la croix ou le stick gauche : un pas, puis ca defile si on tient */
  const s = Math.abs(lx) > Math.abs(ly) ? [Math.abs(lx) > 0.6 ? Math.sign(lx) : 0, 0] : [0, Math.abs(ly) > 0.6 ? Math.sign(ly) : 0];
  const dir = B[12] ? [0, -1] : B[13] ? [0, 1] : B[14] ? [-1, 0] : B[15] ? [1, 0] : s, cle = dir.join(',');
  if (cle === '0,0') mnEtat.dirF = null;
  else if (mnEtat.dirF !== cle || t > mnEtat.rep) { const premier = mnEtat.dirF !== cle; mnEtat.dirF = cle; mnEtat.rep = t + (premier ? 380 : 110); const f = mnEtat.focus;
    if (f && f.matches('input[type="range"]') && dir[0]) { const st = parseFloat(f.step) || 1; f.value = Math.max(parseFloat(f.min) || 0, Math.min(parseFloat(f.max) || 100, (parseFloat(f.value) || 0) + st * dir[0])); f.dispatchEvent(new Event('input', { bubbles: true })); f.dispatchEvent(new Event('change', { bubbles: true })); }
    else { const l = cibles(); if (l.length) mnBouger(l, dir[0], dir[1]); } }
  if (appui(0) && mnEtat.focus && mnEtat.focus.isConnected) { const f = mnEtat.focus; if (f.matches('input[type="text"], input:not([type]), textarea')) f.focus(); else f.click(); }
  if (appui(1)) mnFermer(C);
  if (appui(4) || appui(5)) { const l = cibles(); if (l.length) mnOnglet(l, appui(5) ? 1 : -1); }
  if (Math.abs(ry) > 0.2) { let sc = mnEtat.focus; while (sc && !C.el.includes(sc) && !(sc.scrollHeight > sc.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
    if (!sc || C.el.includes(sc)) sc = C.el.find((r) => r.scrollHeight > r.clientHeight + 4) || C.el[0]; if (sc) sc.scrollTop += ry * dt * 1100; }
  if (C.genre === 'hud' && appui(3) && t - (mnEtat.hudDepuis || 0) > 150) mnEtat.hud = false; /* (Y ressort aussi de la barre) */
}
function mnBoucle(t) { const dt = Math.min(0.05, Math.max(0, (t - mnEtat.t) / 1000)); mnEtat.t = t; try { mnMaj(dt); } catch (e) { console.error(e); } requestAnimationFrame(mnBoucle); }
addEventListener('gamepadconnected', () => { mnEtat.annonce = false; });
/* ---------- Options > Commandes ---------- */
const cmdResume = () => (commandesJeu.mode === 'manette' ? 'Manette' + (mnPad() ? ' (branchée)' : ' (aucune manette branchée)') : 'Souris et clavier') + ' · sorts : ' + CMD_ACTIONS.map(([a]) => libelleTouche(a)).join(', ');
function cmdOptionsHtml() { return '<div id="cmd-opt"><div class="hdv-section">Commandes</div><div class="art">' + ico('opt-doigt') + '<div><b>Souris et clavier, ou manette</b><div class="desc">' + cmdResume() + '</div></div><div class="act"><button class="btn discret" data-cmd-ouvrir>Régler</button></div></div></div>'; }
function cmdOptions() { if (typeof modaleOuverte === 'undefined' || modaleOuverte !== 'options') return; const carte = document.getElementById('carte'); if (!carte) return;
  const ancien = document.getElementById('cmd-opt'); if (ancien) { ancien.outerHTML = cmdOptionsHtml(); return; }
  const dgo = document.getElementById('dg-opt'); if (dgo) { dgo.insertAdjacentHTML('afterend', cmdOptionsHtml()); return; } const s = carte.querySelector('.hdv-section'); if (s) s.insertAdjacentHTML('beforebegin', cmdOptionsHtml()); }
function ouvrirCommandes(msg) {
  const m = commandesJeu.mode, tab = (v, t) => '<button class="sexe" data-cmd-mode="' + v + '" aria-pressed="' + (m === v) + '">' + t + '</button>';
  const lignes = CMD_ACTIONS.map(([a, nom]) => '<div class="art" style="grid-template-columns:1fr auto"><div><b>' + nom + '</b><div class="desc">' + (mnEtat.capture && mnEtat.capture.action === a ? (m === 'manette' ? 'Appuie sur un bouton de la manette…' : 'Appuie sur une touche…') : (m === 'manette' ? 'Bouton' : 'Touche') + ' : <span class="puce" style="font-weight:800">' + libelleTouche(a) + '</span>') + '</div></div><div class="act"><button class="btn discret" data-cmd-changer="' + a + '">Changer</button></div></div>').join('');
  const aide = m === 'manette' ? '<p class="hdv-aide">Sur la ferme : <b>stick gauche</b> pour marcher ; un cadre doré montre la case devant toi, <b>A</b> y agit (labourer, planter, récolter, ouvrir un bâtiment). <b>Y</b> passe sur les boutons du jeu (la barre du bas, Options), <b>X</b> sort un curseur pour tout le reste (A agit, Y déplace, B le range), <b>B</b> termine l\'aménagement. Dans les fenêtres : la croix pour choisir, <b>A</b> pour cliquer, <b>B</b> pour fermer, le stick droit pour défiler, <b>LB</b> et <b>RB</b> pour changer d\'onglet.</p><p class="hdv-aide">En combat : <b>stick gauche</b> pour marcher (10 % moins vite qu\'au clic, comme le joystick du téléphone). Appuie puis lâche un bouton de sort : il vise tout seul (recharge +15 %). Garde-le appuyé et vise au <b>stick droit</b> : il part au lâcher, sans malus. <b>LT</b> annule. Hors visée, le stick droit tourne la caméra, <b>LB</b> et <b>RB</b> font un quart de tour, <b>View</b> la remet, <b>Menu</b> met en pause.' + (mnPad() ? '' : ' <b>Aucune manette détectée</b> : branche-la et appuie sur un bouton.') + '</p>'
    : '<p class="hdv-aide">En combat : clique pour marcher et viser, et lance les sorts avec ces touches (les chiffres marchent aussi au pavé numérique). <b>A</b> et <b>E</b> tournent la caméra, <b>Z</b> et <b>S</b> l\'inclinent, <b>R</b> la remet, <b>P</b> ou <b>Espace</b> met en pause.</p>';
  ouvrirModale('commandes', entete('Commandes') + '<div class="musiques-opt" style="margin-bottom:8px">' + tab('souris', 'Souris et clavier') + tab('manette', 'Manette') + '</div>' + aide +
    '<div class="hdv-section">Les touches des sorts</div>' + lignes + (msg ? '<p class="hdv-aide" style="color:var(--rouge)">' + msg + '</p>' : '') +
    '<div class="boutons" style="margin-top:12px"><button class="btn discret" data-cmd-defaut>Touches par défaut</button><button class="btn discret" data-retour-options>Retour aux Options</button></div>');
}
function cmdCapturer(x) { /* x : le code d'une touche [code, libelle], ou l'indice d'un bouton de manette */
  const C = mnEtat.capture; if (!C) return; const a = C.action, m = commandesJeu.mode; let msg = '';
  if (m === 'manette') { if (BOUTONS_RESERVES.includes(x)) msg = NOMS_BOUTONS[x] + ' sert déjà à la caméra, à annuler ou à la pause : choisis un autre bouton.';
    else { const autre = CMD_ACTIONS.find(([b]) => b !== a && commandesJeu.manette[b] === x); if (autre) commandesJeu.manette[autre[0]] = commandesJeu.manette[a]; commandesJeu.manette[a] = x; } } /* (deja pris : les deux echangent) */
  else { if (TOUCHES_RESERVEES.includes(x[0])) msg = 'Cette touche sert déjà à la caméra ou à la pause : choisis-en une autre.';
    else { const autre = CMD_ACTIONS.find(([b]) => b !== a && (commandesJeu.clavier[b] || [])[0] === x[0]); if (autre) commandesJeu.clavier[autre[0]] = commandesJeu.clavier[a]; commandesJeu.clavier[a] = x; } }
  mnEtat.capture = null; cmdSauver(); ouvrirCommandes(msg);
}
addEventListener('keydown', (e) => { if (!mnEtat.capture || commandesJeu.mode === 'manette') return; e.preventDefault(); e.stopImmediatePropagation(); if (e.code === 'Escape') { mnEtat.capture = null; ouvrirCommandes(); return; }
  const lib = /^Digit\d$/.test(e.code) ? e.code.slice(5) : /^Numpad\d$/.test(e.code) ? e.code.slice(6) : e.key && e.key.length === 1 ? e.key.toUpperCase() : e.code.replace(/^Key/, ''); cmdCapturer([e.code, lib]); }, true);
window.addEventListener('click', (e) => { const t = e.target && e.target.closest ? e.target : null; if (!t) return;
  if (t.closest('#b-options') || t.closest('[data-retour-options]')) { mnEtat.capture = null; setTimeout(cmdOptions, 0); return; }
  const b = t.closest('[data-cmd-ouvrir],[data-cmd-mode],[data-cmd-changer],[data-cmd-defaut]'); if (!b) return;
  if (b.hasAttribute('data-cmd-ouvrir')) { ouvrirCommandes(); return; }
  if (b.dataset.cmdMode) { commandesJeu.mode = b.dataset.cmdMode; mnEtat.capture = null; cmdSauver(); ouvrirCommandes(); return; }
  if (b.dataset.cmdChanger) { mnEtat.capture = { action: b.dataset.cmdChanger, avant: (mnPad() || { buttons: [] }).buttons.map((x) => !!(x && x.pressed)) }; ouvrirCommandes(); return; }
  if (b.hasAttribute('data-cmd-defaut')) { const d = JSON.parse(JSON.stringify(CMD_DEFAUT)); commandesJeu.clavier = d.clavier; commandesJeu.manette = d.manette; mnEtat.capture = null; cmdSauver(); ouvrirCommandes(); }
});
majToucheSorts(); requestAnimationFrame(mnBoucle);
