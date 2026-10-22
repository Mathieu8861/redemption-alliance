'use strict';
/* ===================== LA VIE DES TOFUS (22/10/2026) =====================
   « Il fait des 360 sur lui-meme, il sautille sur place, il bouge sur les cotes, c'est limite. Un coup il picore, un coup il regarde a gauche,
   un coup a droite, ou il se deplace un petit peu sur la case » (Mathieu).
   Chaque Tofu (sur un champ, dans l'herbe, dans la voliere) enchaine de petits gestes tranquilles : il picore (deux a quatre coups de bec), regarde
   d'un cote puis de l'autre, fait quelques petits sauts jusqu'a un point voisin, s'ebroue, ou reste un moment a respirer. Le corps bascule sur ses
   pattes (l'origine du modele est a ses pieds). Ses tirages sont les siens, une suite fixe par Tofu (jamais Math.random : rien ne change dans la partie). */
function aleaTofu(graine) { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const graineDe = (txt) => { let h = 2166136261; for (const c of String(txt)) { h = Math.imul(h ^ c.charCodeAt(0), 16777619); } return h >>> 0; };
/* rayon : jusqu'ou il s'eloigne de sa place ; saut : la hauteur d'un petit saut ; gestes : le poids de chacun (le Tofu d'un champ picore surtout) */
const VIE_CHAMP = { rayon: 0.3, saut: 0.07, gestes: [['picore', 5], ['regarde', 3], ['pause', 2], ['marche', 2], ['ebroue', 1]] };
const VIE_SAUVAGE = { rayon: 0.5, saut: 0.09, gestes: [['picore', 3], ['regarde', 3], ['pause', 2], ['marche', 3], ['ebroue', 1]] };
const VIE_VOLIERE = { rayon: 0.12, saut: 0.04, gestes: [['picore', 3], ['regarde', 3], ['pause', 3], ['marche', 2], ['ebroue', 1]] };
const lisse = (u) => u * u * (3 - 2 * u);
function gesteSuivant(v, regle) {
  const A = v.alea, total = regle.gestes.reduce((t, g) => t + g[1], 0); let r = A() * total, g = regle.gestes[0][0];
  for (const [nom, p] of regle.gestes) { if (r < p) { g = nom; break; } r -= p; }
  if (g === v.geste && g !== 'picore') g = 'pause'; /* (pas deux fois de suite le meme, sauf picorer) */
  v.geste = g; v.t = 0; v.ry1 = v.ry;
  if (g === 'pause') v.d = 0.7 + A() * 1.5;
  else if (g === 'picore') { v.n = 2 + Math.floor(A() * 3); v.d = v.n * 0.42 + 0.15; }
  else if (g === 'regarde') { v.cote = A() < 0.5 ? -1 : 1; v.deux = A() < 0.55; v.d = v.deux ? 2.3 : 1.4; }
  else if (g === 'ebroue') v.d = 0.55;
  else { /* marche : un point voisin de sa place, quelques petits sauts pour y aller */
    const a = A() * Math.PI * 2, r2 = regle.rayon * (0.35 + 0.65 * A()); v.bx = v.x0 + Math.cos(a) * r2; v.bz = v.z0 + Math.sin(a) * r2; v.ax = v.x; v.az = v.z;
    const d = Math.hypot(v.bx - v.ax, v.bz - v.az); v.cap = Math.atan2(v.bx - v.ax, v.bz - v.az); v.sauts = Math.max(2, Math.round(d / (regle.rayon * 0.28))); v.d = 0.25 + v.sauts * 0.26;
  }
}
function vieTofu(o, dt, regle) {
  let v = o.userData.vie;
  if (!v) { v = o.userData.vie = { x0: o.position.x, y0: o.position.y, z0: o.position.z, ry0: o.rotation.y, sy: o.scale.y, x: o.position.x, z: o.position.z, ry: o.rotation.y, geste: 'pause', t: 0, d: 0.3, alea: aleaTofu(graineDe(o.uuid)) }; }
  v.t += dt; if (v.t >= v.d) { if (v.geste === 'marche') { v.x = v.bx; v.z = v.bz; } gesteSuivant(v, regle); }
  const u = Math.min(1, v.t / v.d); let y = 0, pench = 0, roul = 0, souffle = 0;
  if (v.geste === 'pause') { souffle = Math.sin(v.t * 4) * 0.02; v.ry += (v.ry0 - v.ry) * Math.min(1, dt * 1.5); } /* il respire, et se retourne doucement vers sa place */
  else if (v.geste === 'picore') { const p = (v.t % 0.42) / 0.42; pench = v.t < v.n * 0.42 ? (p < 0.3 ? lisse(p / 0.3) : 1 - lisse((p - 0.3) / 0.7)) * 0.6 : 0; } /* vite en bas, plus lentement en haut */
  else if (v.geste === 'regarde') { /* la tete d'un cote (le corps pivote), un temps, l'autre cote, un temps, puis de face */
    const t = v.t, c = v.cote * 0.75; let k;
    if (!v.deux) k = t < 0.25 ? lisse(t / 0.25) * c : t < 1.1 ? c : c * (1 - lisse((t - 1.1) / 0.3));
    else k = t < 0.25 ? lisse(t / 0.25) * c : t < 0.95 ? c : t < 1.3 ? c - lisse((t - 0.95) / 0.35) * 2 * c : t < 2.0 ? -c : -c * (1 - lisse((t - 2.0) / 0.3));
    v.ry = v.ry1 + k; pench = -0.05;
  } else if (v.geste === 'ebroue') { roul = Math.sin(v.t * 42) * 0.16 * (1 - u); souffle = Math.sin(v.t * 30) * 0.05 * (1 - u); }
  else { /* marche : il se tourne vers le point, puis y va en petits sauts, penche en avant */
    if (v.t < 0.25) { const da = Math.atan2(Math.sin(v.cap - v.ry1), Math.cos(v.cap - v.ry1)); v.ry = v.ry1 + da * lisse(v.t / 0.25); }
    else { const w = Math.min(1, (v.t - 0.25) / (v.d - 0.25)), ph = w * v.sauts; v.x = v.ax + (v.bx - v.ax) * w; v.z = v.az + (v.bz - v.az) * w; y = Math.abs(Math.sin(ph * Math.PI)) * regle.saut; pench = 0.18; }
  }
  o.position.set(v.x, v.y0 + y, v.z); o.rotation.set(pench, v.ry, roul, 'YXZ'); o.scale.y = v.sy * (1 + souffle);
}
