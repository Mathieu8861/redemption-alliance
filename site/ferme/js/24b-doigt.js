/* LES COMMANDES AU DOIGT EN COMBAT (14/11/2026, ESSAI : mode test de Mathieu seulement, estAdmin()).
   « Ok vas-y, je pense qu'on va tester ca dans un premier temps, on ajustera en fonction des retours » (Mathieu), apres les maquettes de maquettes/mobile/ :
   - un joystick a gauche (fixe ou sous le doigt) : le perso va dans la direction du pouce ; lache, il tient sa position et frappe ce qui est a portee ;
   - les sorts : appui court = le sort part tout seul (zone sur le plus gros groupe, ligne ou cone la ou ca touche le plus, coup unique sur la cible) ;
     glisser depuis le bouton = on place le cercle (l'anneau autour du doigt = la portee autour du perso) ; lacher sur la croix = rien ne part ;
   - la camera suit le perso (avec un cadre, toujours au centre, ou libre), distance et inclinaison choisies, quart de tour, vue d'ensemble a l'oeil ;
   - des fleches au bord de l'ecran vers les monstres qu'on ne voit pas (en rouge un boss, avec sa distance) ;
   - deux dispositions : A (sorts en eventail sur l'arene) et C (deux bandes sur les cotes, rien devant l'action).
   Les reglages se font dans les Options (section visible du seul admin) et restent dans ce navigateur. Les potions ne sont pas en combat (elles ne s'y boivent pas). */
const dgId = (id) => document.getElementById(id); /* (le $ du jeu est dans 25-interface, charge apres) */
const DG_CLE = 'ferme-doigt-reglages';
const DG_DEFAUT = { actif: 'auto', disp: 'a', joy: 'fixe', suivi: 'cadre', dist: 'moyenne', incl: 'normale', tour: true, fleches: true };
const dgReglages = (() => { try { return Object.assign({}, DG_DEFAUT, JSON.parse(localStorage.getItem(DG_CLE) || '{}')); } catch (e) { return Object.assign({}, DG_DEFAUT); } })();
const dgSauver = () => { try { localStorage.setItem(DG_CLE, JSON.stringify(dgReglages)); } catch (e) { /* rien */ } };
const DG_ZOOM = { proche: 2.4, moyenne: 1.8, loin: 1.3 }, DG_ELEV = { plongee: 0.9, normale: ELEV_DEPART, rasante: 0.4 };
const DG_BOUTONS = { 'b-sort': 'sort', 'b-ulti': 'ulti', 'b-leg-coiffe': 'coiffe', 'b-leg-arme': 'arme' };
const DG_PORTEE_LIBRE = 10, DG_SEUIL = 14, DG_RAYON = 52, DG_CADRE = 0.2; /* (une zone sans portee, l'ulti de zone : 5 cases autour du perso ; 14 px avant de viser ; l'anneau ; le cadre de la camera, 20 % de chaque cote) */
const doigtActif = () => typeof estAdmin === 'function' && estAdmin() && (dgReglages.actif === 'toujours' || (dgReglages.actif === 'auto' && DOIGT));
const dg = { on: false, el: null, joy: null, marche: false, sort: null, oeil: null, zoomJeu: null, avant: null, t: performance.now(), fl: [], k: 0 };

/* ----- les elements de l'interface, crees une fois dans le cadre du combat ----- */
function dgCreer() {
  if (dg.el) return dg.el; const z = dgId('combat'), mk = (cls, html, parent) => { const d = document.createElement('div'); d.className = cls; if (html) d.innerHTML = html; (parent || z).appendChild(d); return d; };
  const svgTour = (miroir) => '<svg viewBox="0 0 24 24"' + (miroir ? ' style="transform:scaleX(-1)"' : '') + '><path d="M7 7h6a5 5 0 1 1-5 5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M9.5 3.5 6 7l3.5 3.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const el = dg.el = {};
  el.bg = mk('dg dg-bande g'); el.bd = mk('dg dg-bande d');
  el.zone = mk('dg dg-zone'); el.base = mk('dg dg-joy'); el.bouton = mk('dg dg-joy-b');
  el.cam = mk('dg dg-cam', '<button data-dg-cam="g" aria-label="Tourner à gauche">' + svgTour(false) + '</button><button data-dg-cam="d" aria-label="Tourner à droite">' + svgTour(true) + '</button><button class="oeil" data-dg-cam="oeil" aria-label="Vue d\'ensemble (garder le doigt)"><svg viewBox="0 0 24 24"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/></svg></button>');
  el.anneau = mk('dg dg-anneau'); el.tige = mk('dg dg-tige'); el.croix = mk('dg dg-croix', '✕<small>Annuler</small>');
  el.fleches = mk('dg dg-fleches');
  [el.anneau, el.tige, el.croix].forEach((d) => { d.hidden = true; });
  dgBrancherJoystick(); dgBrancherCamera();
  return el;
}
const dgEncoche = (() => { let p = null; return () => { if (!p) { p = document.createElement('div'); p.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)'; document.body.appendChild(p); } const s = getComputedStyle(p); return { h: parseFloat(s.paddingTop) || 0, d: parseFloat(s.paddingRight) || 0, b: parseFloat(s.paddingBottom) || 0, g: parseFloat(s.paddingLeft) || 0 }; }; })(); /* (l'encoche du telephone couche) */
const dgBande = () => (dgReglages.disp === 'c' ? 140 : 0);
function dgCentreJoy() { const e = dgEncoche(); return dgReglages.disp === 'c' ? { x: e.g + 70, y: innerHeight - e.b - 80 } : { x: e.g + 98, y: innerHeight - e.b - 92 }; }

/* ----- le joystick ----- */
function dgPlacerJoy(x, y, kx, ky) { const el = dg.el; el.base.style.left = x + 'px'; el.base.style.top = y + 'px'; el.bouton.style.left = (x + (kx || 0)) + 'px'; el.bouton.style.top = (y + (ky || 0)) + 'px'; }
function dgBrancherJoystick() {
  const z = dg.el.zone, R = 50;
  z.addEventListener('pointerdown', (e) => { if (!dg.on || dg.joy) return; e.preventDefault(); const flot = dgReglages.joy === 'flottant', c = flot ? { x: e.clientX, y: e.clientY } : dgCentreJoy();
    dg.joy = { id: e.pointerId, ox: c.x, oy: c.y, vx: 0, vy: 0, n: 0 }; try { z.setPointerCapture(e.pointerId); } catch (er) { /* rien */ } dg.el.base.classList.add('vu'); dg.el.bouton.classList.add('vu'); dgBougerJoy(e); });
  const fin = (e) => { if (!dg.joy || e.pointerId !== dg.joy.id) return; dg.joy = null; dgArreter(); const c = dgCentreJoy(); dgPlacerJoy(c.x, c.y); if (dgReglages.joy === 'flottant') { dg.el.base.classList.remove('vu'); dg.el.bouton.classList.remove('vu'); } };
  z.addEventListener('pointermove', (e) => { if (dg.joy && e.pointerId === dg.joy.id) dgBougerJoy(e); });
  z.addEventListener('pointerup', fin); z.addEventListener('pointercancel', fin); z.addEventListener('lostpointercapture', fin);
  function dgBougerJoy(e) { const j = dg.joy; let dx = e.clientX - j.ox, dy = e.clientY - j.oy; const l = Math.hypot(dx, dy);
    if (l > R && dgReglages.joy === 'flottant' && l > R * 1.25) { const k = (l - R * 1.25) / l; j.ox += dx * k; j.oy += dy * k; dx = e.clientX - j.ox; dy = e.clientY - j.oy; } /* (sous le doigt : la base suit le pouce s'il va trop loin) */
    const l2 = Math.hypot(dx, dy), m = Math.min(l2, R); j.n = Math.min(1, l2 / R); j.vx = l2 ? dx / l2 : 0; j.vy = l2 ? dy / l2 : 0;
    dgPlacerJoy(j.ox, j.oy, j.vx * m, j.vy * m); }
}
function dgArreter() { if (!dg.marche) return; dg.marche = false; if (combat) { chemin = []; arrivee = null; combat.ordre = false; combat.tenir = true; } } /* (lache : il s'arrete et tient sa position, il frappe ce qui est a portee) */
function dgLibre(x0, z0, x, z) { /* le point ou il peut aller, en ligne droite, depuis (x0, z0) vers (x, z) */
  if (lieu === 'ile' && typeof ileBoss !== 'undefined' && ileBoss) { const q = bornerIle(x, z); return { x: q[0], z: q[1] }; }
  if (combat && combat.arene && typeof ARENE !== 'undefined') { const f = pointValide(x0, z0, x, z), d = Math.hypot(f.x - ARENE.x, f.z - ARENE.z), r = R_ARENE - 0.4; return d > r ? { x: ARENE.x + (f.x - ARENE.x) * r / d, z: ARENE.z + (f.z - ARENE.z) * r / d } : f; }
  return pointValide(x0, z0, x, z);
}
function dgMarcher() {
  const j = dg.joy, c = combat; if (!j || j.n < 0.22 || !c || c.fin || c.deroute != null || enPause) { if (dg.marche && (!j || j.n < 0.22)) dgArreter(); return; }
  const a = angleCam, drx = Math.sin(a), drz = -Math.cos(a), avx = -Math.cos(a), avz = -Math.sin(a); /* (droite et haut de l'ecran, dans le monde : le joystick suit la camera) */
  const wx = drx * j.vx - avx * j.vy, wz = drz * j.vx - avz * j.vy, pp = paysanMesh.position, L = 1.6; let best = null;
  for (const r of [0, 0.5, -0.5, 1, -1]) { /* (un mur droit devant : il glisse le long, en essayant un peu a gauche et a droite) */
    const cs = Math.cos(r), sn = Math.sin(r), dx = wx * cs - wz * sn, dz = wx * sn + wz * cs, f = dgLibre(pp.x, pp.z, pp.x + dx * L, pp.z + dz * L), g = Math.hypot(f.x - pp.x, f.z - pp.z) * Math.cos(r);
    if (!best || g > best.g) best = { x: f.x, z: f.z, g }; if (r === 0 && g > L * 0.6) break; }
  if (!best || best.g < 0.08) { if (dg.marche) dgArreter(); return; }
  chemin = [{ c: caseIci(best.x, best.z) || paysanMesh.userData.cellule, x: best.x, z: best.z }]; arrivee = null; c.ordre = true; c.tenir = true; c.poursuite = false; dg.marche = true;
}

/* ----- les sorts : appui court, glisser, croix ----- */
function dgArmer(cle) { /* les memes refus qu'armerSort, sans le message de visee a la souris */
  const c = combat; if (!c || c.fin || c.deroute != null) return null; const B = BOUTONS_SORT[cle]; if (!B) return null;
  if (B.dispo && !B.dispo()) return null;
  if (B.refus) { const r = B.refus(); if (r) { toast(r); return null; } }
  if ((c[B.cd] || 0) > 0) return null;
  if (!c.monstres.some((o) => o.etat === 'actif')) { toast('Aucun monstre à viser pour l\'instant.'); return null; }
  if (visee) annulerVisee();
  const v = Object.assign({ bouton: cle }, B.visee()); if (v.instant) { B.tirer(v, null); return 'instant'; }
  visee = Object.assign(v, { point: paysanMesh.position.clone() }); return visee;
}
const dgActifs = () => combat.monstres.filter((o) => o.etat === 'actif');
function dgPointAuto(v) { /* l'appui court : ou le sort part tout seul */
  const pp = paysanMesh.position, L = dgActifs(); if (!L.length) return null; const d = (o) => Math.hypot(o.x - pp.x, o.z - pp.z), poids = (o) => (o.d.boss || o.d.demi ? 1.6 : 1);
  if (v.ligne || v.cone) { const P = v.portee || PORTEE_PERCANTE, larg = (v.largeur || LARGEUR_PERCANTE) + 0.45; let best = null;
    L.filter((o) => d(o) <= P + 1).forEach((o) => { const ux = (o.x - pp.x) / (d(o) || 1), uz = (o.z - pp.z) / (d(o) || 1); let s = 0;
      L.forEach((m) => { const rx = m.x - pp.x, rz = m.z - pp.z, t = rx * ux + rz * uz; if (t < 0 || t > P + 0.5) return; if (v.cone ? Math.acos(Math.max(-1, Math.min(1, t / (Math.hypot(rx, rz) || 1)))) <= 0.6 : Math.abs(rx * uz - rz * ux) <= larg) s += poids(m); });
      if (!best || s > best.s + 0.01 || (Math.abs(s - best.s) <= 0.01 && d(o) < best.d)) best = { s, d: d(o), ux, uz }; });
    if (!best) { const o = L.sort((a, b) => d(a) - d(b))[0]; best = { ux: (o.x - pp.x) / (d(o) || 1), uz: (o.z - pp.z) / (d(o) || 1) }; }
    return new T.Vector3(pp.x + best.ux * P, pp.y, pp.z + best.uz * P); }
  const P = v.portee || DG_PORTEE_LIBRE;
  if (v.rayon < 1) { const c = combat.cible && combat.cible.etat === 'actif' && d(combat.cible) <= P ? combat.cible : L.filter((o) => d(o) <= P).sort((a, b) => (poids(b) - poids(a)) || d(a) - d(b))[0] || L.sort((a, b) => d(a) - d(b))[0]; return new T.Vector3(c.x, c.m.position.y, c.z); }
  const R = Math.max(1, v.rayon || 1); let best = null; /* une zone : sur le plus gros groupe a portee (le centre des monstres qu'elle couvre) */
  L.filter((o) => d(o) <= P + R).forEach((o) => { const dans = L.filter((m) => Math.hypot(m.x - o.x, m.z - o.z) <= R * 0.95), s = dans.reduce((a, m) => a + poids(m), 0);
    if (!best || s > best.s + 0.01 || (Math.abs(s - best.s) <= 0.01 && d(o) < best.d)) best = { s, d: d(o), x: dans.reduce((a, m) => a + m.x, 0) / dans.length, z: dans.reduce((a, m) => a + m.z, 0) / dans.length }; });
  if (!best) { const o = L.sort((a, b) => d(a) - d(b))[0]; best = { x: o.x, z: o.z }; }
  const l = Math.hypot(best.x - pp.x, best.z - pp.z); if (l > P) { best.x = pp.x + (best.x - pp.x) * P / l; best.z = pp.z + (best.z - pp.z) * P / l; }
  return new T.Vector3(best.x, pp.y, best.z);
}
function dgPointGlisse(v, nx, ny) { /* glisser : le petit rond dans l'anneau = le cercle dans la portee, vus de la camera */
  const n = Math.min(1, Math.hypot(nx, ny)); if (n < 0.12) return dgPointAuto(v);
  const a = angleCam, ux0 = Math.sin(a) * nx + Math.cos(a) * ny, uz0 = -Math.cos(a) * nx + Math.sin(a) * ny, l = Math.hypot(ux0, uz0) || 1, ux = ux0 / l, uz = uz0 / l, pp = paysanMesh.position;
  if (v.ligne || v.cone) { const P = v.portee || PORTEE_PERCANTE; return new T.Vector3(pp.x + ux * P, pp.y, pp.z + uz * P); }
  const P = v.portee || DG_PORTEE_LIBRE; let x = pp.x + ux * P * n, z = pp.z + uz * P * n;
  { const r = v.rayon < 1 ? 2.2 : 0.9; let m = null, md = r; dgActifs().forEach((o) => { const dd = Math.hypot(o.x - x, o.z - z); if (dd < md) { md = dd; m = o; } }); if (m) { x = m.x; z = m.z; } } /* (l'aimant : le cercle s'accroche au monstre qu'il frole) */
  return new T.Vector3(x, pp.y, z);
}
function dgPlacerCroix() { const el = dg.el, e = dgEncoche(), c = dgReglages.disp === 'c'; const x = innerWidth - e.d - (c ? 70 : 32), y = c ? innerHeight - e.b - 178 : e.h + 118; /* (en A : a la place des boutons de camera, caches pendant la visee) */ el.croix.style.left = x + 'px'; el.croix.style.top = y + 'px'; return { x, y }; }
function dgBrancherSorts() {
  const z = dgId('combat-sorts');
  z.addEventListener('pointerdown', (e) => { if (!dg.on || dg.sort) return; const b = e.target.closest('.combat-sort'); if (!b || b.hidden || !DG_BOUTONS[b.id]) return; e.preventDefault();
    dg.sort = { id: e.pointerId, cle: DG_BOUTONS[b.id], b, x0: e.clientX, y0: e.clientY, vise: false }; try { b.setPointerCapture(e.pointerId); } catch (er) { /* rien */ } b.classList.add('appui'); });
  z.addEventListener('pointermove', (e) => { const s = dg.sort; if (!s || e.pointerId !== s.id) return; const dx = e.clientX - s.x0, dy = e.clientY - s.y0;
    if (!s.vise) { if (Math.hypot(dx, dy) < DG_SEUIL) return; const v = dgArmer(s.cle); if (!v || v === 'instant') { dgFinSort(); return; } s.vise = true; const el = dg.el;
      el.anneau.style.left = s.x0 + 'px'; el.anneau.style.top = s.y0 + 'px'; el.anneau.style.width = el.anneau.style.height = (DG_RAYON * 2) + 'px'; el.anneau.hidden = false; el.tige.hidden = false; el.croix.hidden = false; s.croix = dgPlacerCroix(); dgId('hud').classList.add('dg-vise'); }
    const l = Math.hypot(dx, dy), m = Math.min(l, DG_RAYON), kx = l ? dx / l * m : 0, ky = l ? dy / l * m : 0; dg.el.tige.style.left = (s.x0 + kx) + 'px'; dg.el.tige.style.top = (s.y0 + ky) + 'px';
    s.surCroix = Math.hypot(e.clientX - s.croix.x, e.clientY - s.croix.y) < 46; dg.el.croix.classList.toggle('sur', s.surCroix);
    if (visee && !s.surCroix) { const p = dgPointGlisse(visee, dx / DG_RAYON, dy / DG_RAYON); if (p) visee.point = p; } });
  const fin = (e) => { const s = dg.sort; if (!s || e.pointerId !== s.id) return;
    if (e.type === 'pointerup') { if (!s.vise) { const v = dgArmer(s.cle); if (v && v !== 'instant') { const p = dgPointAuto(v); if (p) { visee.point = p; tirerVisee(p); } else annulerVisee(); } }
      else if (s.surCroix || !visee) annulerVisee(); else tirerVisee(visee.point); }
    else if (s.vise) annulerVisee();
    dgFinSort(); };
  z.addEventListener('pointerup', fin); z.addEventListener('pointercancel', fin);
  window.addEventListener('click', (e) => { if (dg.on && e.target && e.target.closest && e.target.closest('#combat-sorts .combat-sort')) { e.stopPropagation(); e.preventDefault(); } }, true); /* (au doigt, le bouton ne passe plus par la visee a la souris) */
}
function dgFinSort() { const s = dg.sort; if (s && s.b) s.b.classList.remove('appui'); dg.sort = null; dgId('hud').classList.remove('dg-vise'); if (dg.el) { dg.el.anneau.hidden = true; dg.el.tige.hidden = true; dg.el.croix.hidden = true; dg.el.croix.classList.remove('sur'); } }

/* ----- la camera ----- */
function dgBrancherCamera() {
  dg.el.cam.addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-dg-cam]'); if (!b || !dg.on) return; e.preventDefault(); const k = b.dataset.dgCam, base = angleVise != null ? angleVise : angleCam;
    if (k === 'g') tournerCameraVers(base - Math.PI / 2); else if (k === 'd') tournerCameraVers(base + Math.PI / 2);
    else { dg.oeil = { id: e.pointerId }; try { b.setPointerCapture(e.pointerId); } catch (er) { /* rien */ } b.classList.add('appui'); } });
  const fin = (e) => { if (dg.oeil && e.pointerId === dg.oeil.id) { dg.oeil = null; dg.retour = true; dg.el.cam.querySelector('.oeil').classList.remove('appui'); } };
  dg.el.cam.addEventListener('pointerup', fin); dg.el.cam.addEventListener('pointercancel', fin);
}
function dgVueEnsemble() { /* ce que l'oeil montre : toute l'arene, toute l'ile des boss ou toute la ferme */
  if (combat && combat.arene && lieu === 'arene' && typeof ARENE !== 'undefined') return { x: ARENE.x, z: ARENE.z, zoom: innerWidth > innerHeight ? 0.75 : 0.55 };
  if (lieu === 'ile' && typeof VOYAGES !== 'undefined' && VOYAGES.ile && VOYAGES.ile.centre) return { x: VOYAGES.ile.centre.x, z: VOYAGES.ile.centre.z, zoom: 0.6 };
  return { x: 0.6, z: 0.6, zoom: innerWidth > innerHeight ? 0.5 : 0.42 };
}
function dgCamera(dt) {
  if (dg.zoomJeu == null) return;
  if (dg.oeil) { const v = dgVueEnsemble(), k = Math.min(1, dt * 9); zoom += (v.zoom - zoom) * k; VISEE.x += (v.x - VISEE.x) * k; VISEE.z += (v.z - VISEE.z) * k; cadrer(); placerCamera(); return; }
  if (Math.abs(zoom - dg.zoomJeu) > 0.003 && dg.retour) { zoom += (dg.zoomJeu - zoom) * Math.min(1, dt * 9); cadrer(); } else dg.retour = false;
  if (dgReglages.suivi === 'libre') return;
  const pp = paysanMesh.position, a = angleCam, drx = Math.sin(a), drz = -Math.cos(a), avx = -Math.cos(a), avz = -Math.sin(a);
  const ox = (pp.x - VISEE.x) * drx + (pp.z - VISEE.z) * drz, oz = (pp.x - VISEE.x) * avx + (pp.z - VISEE.z) * avz;
  const centre = dgReglages.suivi === 'centre', l = (camera.right - camera.left) / 2 * (dgReglages.disp === 'c' ? (innerWidth - 2 * dgBande()) / innerWidth : 1), h = (camera.top - camera.bottom) / 2 / Math.max(0.3, Math.sin(elevActuelle()));
  const kx = centre ? 0 : DG_CADRE * l, kz = centre ? 0 : DG_CADRE * h, mx = Math.abs(ox) > kx ? ox - Math.sign(ox) * kx : 0, mz = Math.abs(oz) > kz ? oz - Math.sign(oz) * kz : 0;
  if (!mx && !mz) return; const k = Math.min(1, dt * (dg.retour || centre ? 6 : 14)); VISEE.x += (drx * mx + avx * mz) * k; VISEE.z += (drz * mx + avz * mz) * k; placerCamera();
}

/* ----- les fleches vers les monstres hors de l'ecran ----- */
const dgVec = new T.Vector3();
function dgFleches() {
  const box = dg.el.fleches; if (!dgReglages.fleches || dg.oeil) { box.hidden = true; return; } box.hidden = false;
  const e = dgEncoche(), b = dgBande(), hb = document.querySelector('#combat .combat-haut'), x0 = e.g + b + 30, x1 = innerWidth - e.d - b - (b ? 30 : 74), y0 = (b ? e.h + 30 : Math.round((hb ? hb.getBoundingClientRect().bottom : 60) + 22)), y1 = innerHeight - e.b - 40, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, pp = paysanMesh.position, groupes = [];
  dgActifs().forEach((o) => { if (o.d.oeuf || o.d.plante) return; dgVec.set(o.x, o.m.position.y + (o.haut || 1.5) * 0.5, o.z).project(camera); const sx = (dgVec.x + 1) / 2 * innerWidth, sy = (1 - dgVec.y) / 2 * innerHeight;
    if (sx > x0 - 20 && sx < x1 + 20 && sy > y0 - 30 && sy < y1 + 20 && dgVec.z < 1) return;
    let dx = sx - cx, dy = sy - cy; if (dgVec.z > 1) { dx = -dx; dy = -dy; } const k = Math.min(Math.abs((x1 - cx) / (dx || 1e-6)), Math.abs((y1 - cy) / (dy || 1e-6))), px = cx + dx * k, py = cy + dy * k, ang = Math.atan2(dy, dx);
    const boss = !!(o.d.boss || o.d.demi), g = groupes.find((q) => Math.hypot(q.x - px, q.y - py) < 56 && q.boss === boss);
    if (g && !boss) g.n++; else groupes.push({ x: px, y: py, ang, n: 1, boss, o, d: Math.hypot(o.x - pp.x, o.z - pp.z) }); });
  while (dg.fl.length < groupes.length) { const d = document.createElement('div'); d.className = 'dg-fl'; d.innerHTML = '<i></i><span></span>'; box.appendChild(d); dg.fl.push(d); }
  dg.fl.forEach((d, i) => { const g = groupes[i]; if (!g) { d.hidden = true; return; } d.hidden = false; d.style.left = g.x.toFixed(0) + 'px'; d.style.top = g.y.toFixed(0) + 'px'; d.classList.toggle('boss', g.boss);
    d.firstChild.style.transform = 'rotate(' + g.ang.toFixed(2) + 'rad)';
    const txt = g.boss ? '<img src="assets/icones/' + g.o.d.icone + '.png?v=' + VERSION_MODELES + '" alt=""><b>' + Math.max(1, Math.round(g.d / S)) + ' cases</b>' : '<b>' + g.n + '</b>';
    if (d._t !== txt) { d._t = txt; d.lastChild.innerHTML = txt; } });
}

/* ----- entrer et sortir du mode, chaque image ----- */
function dgClasses() { const h = dgId('hud'); h.classList.toggle('doigt', dg.on); h.classList.toggle('dg-a', dg.on && dgReglages.disp !== 'c'); h.classList.toggle('dg-c', dg.on && dgReglages.disp === 'c'); h.classList.toggle('dg-flottant', dg.on && dgReglages.joy === 'flottant'); h.classList.toggle('dg-sans-tour', !dgReglages.tour); h.classList.toggle('dg-h1', dg.on); } /* (dg-h1 : le haut de l'ecran fin, la version 1 retenue par Mathieu le 14/11/2026) */
function dgCamReglages() { dg.zoomJeu = DG_ZOOM[dgReglages.dist] || DG_ZOOM.moyenne; dg.retour = true; inclinerCameraVers(DG_ELEV[dgReglages.incl] != null ? DG_ELEV[dgReglages.incl] : ELEV_DEPART); }
function dgEntrer() {
  dgCreer(); dg.on = true; dg.avant = { zoom, elev: elevCam }; dgClasses(); dgCamReglages(); const c = dgCentreJoy(); dgPlacerJoy(c.x, c.y);
  dg.el.base.classList.toggle('vu', dgReglages.joy !== 'flottant'); dg.el.bouton.classList.toggle('vu', dgReglages.joy !== 'flottant');
  if (dgReglages.suivi !== 'libre') { const pp = paysanMesh.position; VISEE.x = pp.x; VISEE.z = pp.z; placerCamera(); }
}
function dgSortir() {
  dg.on = false; dg.joy = null; dgArreter(); dgFinSort(); dg.oeil = null; dgClasses(); { const t = dgId('fil'); if (t) t.style.top = ''; }
  if (dg.avant) { zoom = dg.avant.zoom; cadrer(); inclinerCameraVers(dg.avant.elev); dg.avant = null; } dg.zoomJeu = null;
}
function dgMaj(dt) {
  const veut = !!(combat && !combat.fin && paysanMesh && lieu !== 'casino' && lieu !== 'cabane' && doigtActif());
  if (veut !== dg.on) { if (veut) dgEntrer(); else dgSortir(); }
  if (!dg.on) return;
  dgMarcher(); dgCamera(dt);
  if (dgReglages.joy !== 'flottant' && !dg.joy) { const c = dgCentreJoy(); dgPlacerJoy(c.x, c.y); }
  if ((dg.k = (dg.k + 1) % 2) === 0) { dgFleches(); dgAlertes(); }
}
function dgAlertes() { /* les alertes : couche, en bas entre les pouces (le CSS) ; debout, juste sous la barre de la vague (elle grandit avec celle du boss) */
  const t = dgId('fil'), h = document.querySelector('#combat .combat-haut'); if (!t) return; t.style.top = innerHeight > innerWidth ? Math.round((h ? h.getBoundingClientRect().bottom : 50) + 6) + 'px' : '';
  Object.keys(DG_BOUTONS).forEach((id) => { const b = dgId(id); if (!b || b.hidden) return; const r = b.querySelector('.rond'), sm = b.querySelector('small'); if (!r || !sm) return; let sp = r.querySelector('.dg-cd'); if (!sp) { sp = document.createElement('i'); sp.className = 'dg-cd'; r.appendChild(sp); }
    const m = /(\d+)\s*s\b/.exec(sm.textContent || ''), txt = m && !b.classList.contains('pret') ? m[1] : ''; if (sp.textContent !== txt) sp.textContent = txt; }); /* (le decompte, en chiffre dans le bouton) */ }
function dgBoucle(t) { const dt = Math.min(0.05, Math.max(0, (t - dg.t) / 1000)); dg.t = t; try { dgMaj(dt); } catch (e) { console.error(e); } requestAnimationFrame(dgBoucle); }

/* ----- les Options (section visible du seul admin) ----- */
function dgOptionsHtml() {
  const R = dgReglages, ch = (titre, cle, L) => '<div class="dg-opt-l"><b>' + titre + '</b><div class="musiques-opt">' + L.map(([v, t]) => '<button class="sexe" data-dg="' + cle + ':' + v + '" aria-pressed="' + (String(R[cle]) === String(v)) + '">' + t + '</button>').join('') + '</div></div>';
  return '<div id="dg-opt"><div class="hdv-section">Commandes au doigt en combat (essai, toi seul)</div><div class="dg-opt">' +
    ch('Activer', 'actif', [['auto', 'Au téléphone'], ['toujours', 'Toujours'], ['jamais', 'Jamais']]) + ch('Disposition', 'disp', [['a', 'A : éventail'], ['c', 'C : deux bandes']]) +
    ch('Joystick', 'joy', [['fixe', 'Fixe'], ['flottant', 'Sous le doigt']]) + ch('Caméra', 'suivi', [['cadre', 'Avec un cadre'], ['centre', 'Toujours au centre'], ['libre', 'Libre']]) +
    ch('Distance', 'dist', [['proche', 'Proche'], ['moyenne', 'Moyenne'], ['loin', 'Loin']]) + ch('Inclinaison', 'incl', [['plongee', 'Plongée'], ['normale', 'Normale'], ['rasante', 'Rasante']]) +
    ch('Quart de tour', 'tour', [[true, 'Oui'], [false, 'Non']]) + ch('Flèches vers les monstres cachés', 'fleches', [[true, 'Oui'], [false, 'Non']]) +
    '<p class="dg-opt-p">Joystick à gauche. Sorts : appui court, il part tout seul ; glisser depuis le bouton pour placer le cercle ; lâcher sur la croix pour annuler.</p></div></div>';
}
function dgOptions() { if (typeof modaleOuverte === 'undefined' || modaleOuverte !== 'options' || typeof estAdmin !== 'function' || !estAdmin()) return; const carte = dgId('carte'); if (!carte) return;
  const ancien = dgId('dg-opt'); if (ancien) { ancien.outerHTML = dgOptionsHtml(); return; } const s = carte.querySelector('.hdv-section'); if (s) s.insertAdjacentHTML('beforebegin', dgOptionsHtml()); }
window.addEventListener('click', (e) => { const b = e.target && e.target.closest ? e.target.closest('[data-dg]') : null; if (!b) return; e.stopPropagation(); e.preventDefault();
  const [k, v] = b.dataset.dg.split(':'); dgReglages[k] = v === 'true' ? true : v === 'false' ? false : v; dgSauver(); dgOptions();
  if (dg.on) { if (!doigtActif()) dgSortir(); else { dgClasses(); dgCamReglages(); dg.el.base.classList.toggle('vu', dgReglages.joy !== 'flottant'); dg.el.bouton.classList.toggle('vu', dgReglages.joy !== 'flottant'); } } }, true);
window.addEventListener('click', (e) => { if (e.target && e.target.closest && e.target.closest('#b-options')) setTimeout(dgOptions, 0); }); /* (apres la fenetre des Options, construite par 25-interface.js) */
dgBrancherSorts(); requestAnimationFrame(dgBoucle);
