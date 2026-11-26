'use strict';
/* LES ARENES A RELIEF (26/11/2026, la nuit, Mathieu par Discord : « ensuite cree encore 2 nouvelles arenes, des arenes ou on peut monter aussi sur des plateformes
   avec des escaliers etc, des decors differents. Map a trous, des ponts etc, faut pas hesiter. Si on tombe on peut mourir, ou si on tombe on perd des HP ») :
   - la mine des Craqueleurs (ce fichier) : une grande crevasse et une faille sans fond, deux ponts de planches, la plateforme du chevalement et ses deux escaliers,
     un belvedere au fond ;
   - les ruines celestes (28f-arene-ciel.js) : des ilots de pierre dans le ciel relies par des ponts, un autel sur l'ilot du milieu, une terrasse au fond reliee a
     l'autel par un pont haut.
   LE PLAN d'une carte : 24 lignes de 24 cases d'une unite (x de -12 a 12, z de -12 au fond a 12 cote camera), le meme dans blender/arenes-relief.py qui la modele :
     . le sol (hauteur 0)        _ le vide (on y tombe)        = un pont de planches (hauteur 0)
     H une plateforme (hauteur H)  - un pont haut (hauteur H)  # un obstacle (rochers, wagonnet, colonne)
     n s e w un escalier qui monte vers le fond (-z), vers la camera (+z), vers +x ou vers -x ; sa pente va du sol a H sur toute la volee.
   LES BORNES : un point est libre s'il n'est ni dans un obstacle, ni dans le vide, et si rien autour (a 0,45 au plus) n'est plus haut ou plus bas que ce que permet
   la pente (0,25 + 0,8 x la distance) : les bords des plateformes sont des falaises, on n'y monte que par les escaliers. Les monstres ne vont jamais dans le vide ;
   le perso, si : en marchant (joystick, clavier), pousse par un coup ou en sautant. Au clic, son chemin passe par les ponts et les escaliers.
   LA CHUTE : le perso tombe dans le vide (0,85 s), revient au dernier endroit sur ou il se tenait, perd 25 % de sa vie (il peut en mourir) et reste invincible 1,2 s.
   La hauteur du sol (hauteurSol) suit le plan : le perso, les monstres, les zones des sorts (solA, 21-combat.js) se posent sur les plateformes et les escaliers. */
const RELIEF = { pente: 0.8, marche: 0.25, mi: 0.45, chute: { pv: 0.25, duree: 0.85, invincible: 1.2 } };
const PORTES_RELIEF = [{ axe: 'z', s: -1, l: 1.2 }, { axe: 'x', s: -1, l: 1.0 }, { axe: 'x', s: 1, l: 1.0 }, { axe: 'z', s: 1, l: 1.0 }]; /* (le fond, la gauche, la droite, devant : comme le temple) */
const reliefIci = () => { const K = typeof carteDuJour === 'function' ? carteDuJour() : null; return K && K.relief ? K : null; };
function preparerRelief(K) { /* les volees d'escalier : pour chaque case, ou commence et ou finit la sienne */
  K.G = K.plan.map((l) => l.padEnd(24, '.').slice(0, 24)); K.vol = [];
  for (let j = 0; j < 24; j++) { K.vol.push([]); for (let i = 0; i < 24; i++) { const ch = K.G[j][i]; if (!'nsew'.includes(ch)) { K.vol[j].push(null); continue; }
    let a, b; if (ch === 'n' || ch === 's') { a = j; while (a > 0 && K.G[a - 1][i] === ch) a--; b = j; while (b < 23 && K.G[b + 1][i] === ch) b++; }
    else { a = i; while (a > 0 && K.G[j][a - 1] === ch) a--; b = i; while (b < 23 && K.G[j][b + 1] === ch) b++; }
    K.vol[j].push([a - 12, b + 1 - 12]); } }
  return K;
}
const tuileR = (K, x, z) => { const i = Math.floor(x) + 12, j = Math.floor(z) + 12; return i < 0 || j < 0 || i > 23 || j > 23 ? null : K.G[j][i]; };
function hauteurR(K, x, z) {
  const i = Math.floor(x) + 12, j = Math.floor(z) + 12; if (i < 0 || j < 0 || i > 23 || j > 23) return 0; const t = K.G[j][i];
  if (t === 'H' || t === '-') return K.H;
  if (t === 'n' || t === 's' || t === 'e' || t === 'w') { const [a, b] = K.vol[j][i], u = ((t === 'n' || t === 's') ? z - a : x - a) / (b - a); return K.H * Math.max(0, Math.min(1, t === 's' || t === 'e' ? u : 1 - u)); }
  return 0;
}
function dansPorteR(K, lx, lz, m) { const B = K.mur - m; return PORTES_RELIEF.some((p) => { const a = p.axe === 'z' ? lz : lx, t = p.axe === 'z' ? lx : lz; return a * p.s > B && a * p.s < 12.8 && Math.abs(t) < p.l; }); }
/* un point ou l'on peut se tenir (trous : le vide compte comme du sol, pour le perso qui y marche ; sansDecor : un boss coince traverse les obstacles et les falaises, pas le vide) */
function libreR(K, x, z, m, porte, trous, sansDecor) {
  const B = K.mur - m; if (Math.abs(x) > B || Math.abs(z) > B) return !!(porte && dansPorteR(K, x, z, m));
  const t = tuileR(K, x, z); if (t === null) return false; if (t === '_') return !!trous; if (t === '#' && !sansDecor) return false;
  if (sansDecor) return true;
  const h0 = hauteurR(K, x, z), mi = Math.min(m, RELIEF.mi);
  for (let k = 0; k < 8; k++) { const ca = Math.cos(k * Math.PI / 4), sa = Math.sin(k * Math.PI / 4);
    for (let n = 1; n <= 2; n++) { const r = mi / n, qx = x + ca * r, qz = z + sa * r, q = tuileR(K, qx, qz); if (q === null) continue;
      if (q === '#') return false; if (q === '_') { if (!trous) return false; continue; }
      if (Math.abs(hauteurR(K, qx, qz) - h0) > RELIEF.marche + RELIEF.pente * r) return false; } }
  return true;
}
/* le point libre le plus proche : en glissant le long de ce qui bloque depuis le point d'avant (prec), sinon le plus proche autour */
function bornerR(K, x, z, m, porte, trous, sansDecor, prec) {
  const ok = (a, b) => libreR(K, a, b, m, porte, trous, sansDecor); if (ok(x, z)) return [x, z];
  if (prec) { if (ok(x, prec[1])) return [x, prec[1]]; if (ok(prec[0], z)) return [prec[0], z]; if (ok(prec[0], prec[1])) return [prec[0], prec[1]]; }
  for (let r = 0.15; r <= 4; r += 0.15) for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, qx = x + Math.cos(a) * r, qz = z + Math.sin(a) * r; if (ok(qx, qz)) return [qx, qz]; }
  return [x, z];
}
/* une carte a relief dans le registre de 28b : ses bornes pour l'A* et le chemin au clic (sans le vide) */
function carteRelief(K) {
  preparerRelief(K); K.relief = true; K.mur = K.mur || 11.5; K.portes = K.portes || PORTES_4;
  K.libre = (lx, lz, m, porte) => libreR(K, lx, lz, m, porte, false, false);
  K.borner = (lx, lz, m, monstre, sansDecor) => bornerR(K, lx, lz, m, monstre, false, sansDecor, null);
  CARTES_ARENE[K.nom] = K; return K;
}

/* ---------- les crochets : par-dessus ceux de 28b, seulement sur une carte a relief ---------- */
{ const dansAreneR = dansArene; dansArene = function (x, z) { const K = reliefIci(); if (!K) return dansAreneR.apply(this, arguments); const [lx, lz] = versLocalArene(x, z); return libreR(K, lx, lz, 0.4, false, true, false); }; } /* (le point d'un sort, d'une poussee : le vide compte, on peut y etre pousse) */
{ const bornerAreneR = bornerArene; bornerArene = function (x, z) { const K = reliefIci(); if (!K) return bornerAreneR.apply(this, arguments); const [lx, lz] = versLocalArene(x, z), pp = paysanMesh.position, prec = versLocalArene(pp.x, pp.z);
  const q = bornerR(K, lx, lz, M_PERSO_ARENE, false, true, false, prec); return versMondeArene(q[0], q[1]); }; } /* (le perso qui marche : il glisse contre les falaises et les obstacles, il peut aller dans le vide) */
{ const bornerMonstresAreneR = bornerMonstresArene; bornerMonstresArene = function (c) { const K = reliefIci(); if (!K) return bornerMonstresAreneR.apply(this, arguments);
  c.monstres.forEach((o) => { if (o.etat !== 'actif' || o.d.vole || (o.hop || 0) > 0.05) return; const m = o.d.boss ? 0.9 : 0.3, [lx, lz] = versLocalArene(o.x, o.z); /* (un monstre qui saute, au-dessus du vide ou d'une falaise : borne a l'atterrissage) */
    const q = bornerR(K, lx, lz, m, true, false, o.traverseT > 0, o.precR || null); o.precR = q; const [wx, wz] = versMondeArene(q[0], q[1]); o.x = wx; o.z = wz; }); }; }
{ const hauteurSolR = hauteurSol; hauteurSol = function (x, z) { if (typeof lieu === 'undefined' || lieu !== 'arene') return hauteurSolR.apply(this, arguments); const K = reliefIci(); if (!K) return hauteurSolR.apply(this, arguments);
  const [lx, lz] = versLocalArene(x, z); return hauteurR(K, lx, lz); }; }
if (typeof NOMS_CARTES !== 'undefined') Object.assign(NOMS_CARTES, { mine: 'mine', ciel: 'ruines célestes' });

/* ---------- la chute dans le vide ---------- */
function majChuteRelief(dt) {
  const K = reliefIci(), c = combat; if (!K || lieu !== 'arene' || !c || c.fin || !paysanMesh) return;
  const p = paysanMesh.position, u = paysanMesh.userData, C = RELIEF.chute;
  if (c.chuteT > 0) { c.chuteT -= dt; c.assomme = Math.max(c.assomme || 0, 0.1); c.invincible = Math.max(c.invincible || 0, 0.1); chemin = []; arrivee = null;
    c.chuteV = (c.chuteV || 0) + 22 * dt; p.y -= c.chuteV * dt; paysanMesh.rotation.x = Math.min(1.2, (paysanMesh.rotation.x || 0) + dt * 2.5);
    if (Math.random() < 0.5) emettre(FX_FUM, 1, { x: p.x, y: p.y + 0.8, z: p.z, v: [0, 1.5, 0], vie: [0.3, 0.5], taille: [0.3, 0.8], c: K.chuteCouleurs || ['#ffffff', '#dfe8f0'], a: 0.35 });
    if (c.chuteT <= 0) reapparaitreRelief(K, c); return; }
  if (u.enVol || c.deroute != null) return;
  const [lx, lz] = versLocalArene(p.x, p.z);
  if (tuileR(K, lx, lz) === '_' && Math.abs(lx) < K.mur && Math.abs(lz) < K.mur) { tomberRelief(K, c); return; }
  if (libreR(K, lx, lz, 0.45, false, false, false)) c.reliefSur = { x: p.x, z: p.z }; /* (le dernier endroit sur, un peu loin du bord) */
}
function tomberRelief(K, c) {
  c.chuteT = RELIEF.chute.duree; c.chuteV = 0; chemin = []; arrivee = null; if (typeof annulerVisee === 'function' && visee) annulerVisee();
  const p = paysanMesh.position, q = p.clone(); q.y += 1.6; chiffre('Chute !', q, 'perso'); son('alerte');
}
function reapparaitreRelief(K, c) {
  const C = RELIEF.chute, u = paysanMesh.userData, s = c.reliefSur || (() => { const [x, z] = versMondeArene(K.depart[0], K.depart[1]); return { x, z }; })(), y = hauteurSol(s.x, s.z);
  paysanMesh.position.set(s.x, y, s.z); u.y = y; paysanMesh.rotation.x = 0; c.chuteT = 0; c.chuteV = 0; c.assomme = 0; c.invincible = Math.max(c.invincible || 0, C.invincible); if (typeof bulleInvincible === 'function') bulleInvincible(C.invincible);
  pouf(s.x, y, s.z, 2.2, '#fffaf0'); flashLumiere(s.x, y + 1.2, s.z, '#ffffff', 2.5, 5, 0.3); son('touche');
  const dg = Math.round(c.pvMax * C.pv); if (c.st) c.st.recus += Math.min(dg, c.pv); c.pv = Math.max(0, c.pv - dg); if (MODE_TEST && ETAT_TEST.immortel) c.pv = Math.max(1, c.pv);
  const q = paysanMesh.position.clone(); q.y += 1.8; chiffre('-' + fmt(dg) + ' (chute)', q, 'perso'); majCombatHud();
  if (c.pv <= 0) persoATerre();
}
effets.push((dt) => { try { majChuteRelief(dt); } catch (e) { (window.__erreursEffets = window.__erreursEffets || []).push(String(e && e.stack || e).slice(0, 300)); } return false; }); /* (toute la partie : elle ne fait rien hors d'une carte a relief) */

/* ---------- la mine des Craqueleurs ---------- */
const PLAN_MINE = [ /* (genere par blender/arenes-relief-plans.py, a garder identique) */
'........................',
  '.HHH....................',
  '.HHH....................',
  '.nnn...___===____....#..',
  '.nnn._____===______.....',
  '.nnn______===______.....',
  '....______===______...#.',
  '....______===______.....',
  '......____===_____......',
  '......____===___........',
  '..#.....................',
  '........................',
  '..................sss...',
  '.........#........sss...',
  '.._____...........sss...',
  '.______.........HHHHHH..',
  '.======.........HHHHHH..',
  '.======......eeeHHHHHH..',
  '.======......eeeHHHHHH..',
  '._____..#....eeeHHHHHH..',
  '................HHHHHH..',
  '........................',
  '..............#.....#...',
  '........................'];
carteRelief({ nom: 'mine', sortie: 'p11', fichier: 'arene-mine.glb', racine: 'AreneMine', plan: PLAN_MINE, H: 1.5, depart: [0.5, 0.5], chuteCouleurs: ['#6a5a4a', '#3a302a'],
  decor: (g, reperes) => decorMine(g, reperes) });
/* le decor qui vit : de la poussiere qui tombe dans la crevasse (les cristaux et les lanternes brillent seuls, fusionnes avec le reste : lueur, flamme) */
function decorMine(g, reperes) {
  const poussiere = reperes.filter((r) => /repere_poussiere/.test(r.nom));
  effets.push((dt) => { if (!g.parent) return true; if (!g.visible || !poussiere.length) return false;
    if (Math.random() < dt * 6) { const r = poussiere[Math.floor(Math.random() * poussiere.length)], w = g.localToWorld(r.p.clone());
      emettre(FX_FUM, 1, { x: w.x + (Math.random() - 0.5) * 2, y: w.y, z: w.z + (Math.random() - 0.5) * 2, v: [0, -1.2, 0], vie: [1.4, 2.2], taille: [0.5, 1.4], c: ['#8a7a68', '#5a4a3a'], a: 0.22 }); }
    return false; });
}
