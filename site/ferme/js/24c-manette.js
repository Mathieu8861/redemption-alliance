'use strict';
/* LA MANETTE ET LES TOUCHES DES SORTS (21/11/2026, « tu penses qu'on peut mettre un mode manette Xbox sur le jeu ? », puis « ouais, meme logique que sur tel »,
   et « pour les spells, tu peux mettre sur des boutons qu'on peut parametrer aussi dans les Options en fonction de si on choisit souris / manette », Mathieu).
   - Une manette Xbox (ou toute manette reconnue par le navigateur, en USB ou en Bluetooth, PC comme telephone Android), en combat, comme les commandes au doigt :
     le stick gauche fait marcher le perso (le meme joystick que le telephone : 10 % moins vite, JOYSTICK_LENT ; le Iop va seul au contact quand on le lache) ;
     un bouton de sort appuye puis lache : le sort part tout seul (visee automatique, recharge +15 %, RECHARGE_AUTO_DOIGT) ; garde-le appuye et vise au stick
     droit : le cercle suit le stick, il part au lacher, sans malus ; LT annule la visee ; le stick droit tourne et incline la camera hors visee ; LB et RB font un
     quart de tour ; View remet la camera de depart ; Menu met en pause.
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
function mnLacherVisee(sansTir) { /* le bouton du sort lache : le cercle vise au stick droit part tel quel ; sinon, visee automatique (+15 % de recharge) */
  const V = mnEtat.vise; mnEtat.vise = null; if (!V || sansTir || !visee || visee.bouton !== V.cle) return;
  if (V.max >= 0.25 && visee.point) { tirerVisee(visee.point); return; }
  const p = dgPointAuto(visee); if (!p) { annulerVisee(); return; } visee.point = p; const B = BOUTONS_SORT[V.cle], c = combat, avant = c && B ? c[B.cd] || 0 : 0; tirerVisee(p);
  if (c && B && (c[B.cd] || 0) > avant) { c[B.cd] *= RECHARGE_AUTO_DOIGT; (c.cdMaxDoigt = c.cdMaxDoigt || {})[B.cd] = c[B.cd]; }
}
function mnMaj(dt) {
  const p = mnPad(); if (!p) { if (mnEtat.vise) mnEtat.vise = null; return; }
  if (!mnEtat.annonce) { mnEtat.annonce = true; if (!commandesJeu.choisi) { commandesJeu.mode = 'manette'; cmdSauver(); } if (typeof toast === 'function') toast(commandesJeu.mode === 'manette' ? 'Manette détectée : stick gauche pour marcher, ' + ['sort', 'ulti', 'leg3', 'leg4'].map((a) => libelleTouche(a)).join(', ') + ' pour les sorts. Options > Commandes pour régler.' : 'Manette détectée : choisis « Manette » dans Options > Commandes pour jouer avec.'); }
  if (commandesJeu.mode !== 'manette') return;
  const B = p.buttons.map((b) => !!(b && (b.pressed || b.value > 0.5))), prec = mnEtat.avant, appui = (i) => B[i] && !prec[i], lache = (i) => !B[i] && prec[i]; mnEtat.avant = B; /* (l'etat d'avant, garde a part : sinon aucun appui n'etait vu) */
  if (mnEtat.capture) { const i = B.findIndex((b, k) => b && !mnEtat.capture.avant[k]); mnEtat.capture.avant = B; if (i >= 0) cmdCapturer(i); return; } /* (Options > Commandes : un bouton a regler) */
  if (appui(9) && typeof mettrePause === 'function' && !(typeof lecon !== 'undefined' && lecon.ouverte)) mettrePause(!enPause);
  const ax = (i) => { const v = p.axes[i] || 0; return Math.abs(v) < 0.12 ? 0 : v; }, lx = ax(0), ly = ax(1), rx = ax(2), ry = ax(3);
  const enCombat = !!(combat && !combat.fin && paysanMesh && lieu !== 'casino' && lieu !== 'cabane' && !enPause && !enAccueil && !(typeof modaleOuverte !== 'undefined' && modaleOuverte));
  if (!enCombat) { if (dg.joy && dg.joy.id === 'manette') dg.joy = null; if (mnEtat.vise) mnLacherVisee(true); return; }
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
  /* la camera : le stick droit, LB et RB, View */
  if (Math.abs(rx) > 0.25) tournerCamera(rx * dt * 2.4);
  if (Math.abs(ry) > 0.35) inclinerCamera(-ry * dt * 0.9);
  const base = angleVise != null ? angleVise : angleCam;
  if (appui(4)) tournerCameraVers(base - Math.PI / 2); else if (appui(5)) tournerCameraVers(base + Math.PI / 2);
  if (appui(8)) { tournerCameraVers(ANGLE_DEPART + Math.round((angleCam - ANGLE_DEPART) / (2 * Math.PI)) * 2 * Math.PI); inclinerCameraVers(ELEV_DEPART); }
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
  const aide = m === 'manette' ? '<p class="hdv-aide">En combat : <b>stick gauche</b> pour marcher (10 % moins vite qu\'au clic, comme le joystick du téléphone). Appuie puis lâche un bouton de sort : il vise tout seul (recharge +15 %). Garde-le appuyé et vise au <b>stick droit</b> : il part au lâcher, sans malus. <b>LT</b> annule. Hors visée, le stick droit tourne la caméra, <b>LB</b> et <b>RB</b> font un quart de tour, <b>View</b> la remet, <b>Menu</b> met en pause.' + (mnPad() ? '' : ' <b>Aucune manette détectée</b> : branche-la et appuie sur un bouton.') + '</p>'
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
