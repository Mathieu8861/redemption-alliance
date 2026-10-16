'use strict';
/* ---------- le ciel peint : degrade, lueur du soleil, iles lointaines dans la brume, mer de nuages, oiseaux ---------- */
const cielCanvas = document.getElementById('ciel'), cx2 = cielCanvas.getContext('2d');
let gC = 11; const aC = () => { gC = (gC * 16807) % 2147483647; return (gC - 1) / 2147483646; };
const banc = (y, n, rmin, rmax) => Array.from({ length: n }, (_, k) => ({ x: -0.1 + 1.2 * (k + aC() * 0.8) / n, y: y + (aC() - 0.5) * 0.05, r: rmin + aC() * (rmax - rmin), p: aC() * 6.28 }));
const BANCS = [banc(0.6, 22, 0.025, 0.05), banc(0.83, 18, 0.05, 0.1), banc(0.94, 16, 0.07, 0.12)];
/* les iles lointaines : de petites iles volantes peintes (herbe, arbres, falaise en strates, racines), plus pales avec la distance */
const ILES = [[0.1, 0.4, 1.0, 0.42, 1], [0.88, 0.28, 0.75, 0.55, 0], [0.72, 0.52, 0.5, 0.66, 0], [0.33, 0.62, 0.42, 0.72, 1]].map(([x, y, t, brume, maison], k) => {
  const pts = [], n = 9; for (let i = 0; i <= n; i++) { const u = i / n; pts.push([u * 2 - 1, 0.5 + Math.pow(Math.sin(u * Math.PI), 0.8) * (2.6 + aC() * 1.8) + (i % 2 ? aC() * 0.8 : 0)]); } /* le dessous, dechiquete */
  const arbres = Array.from({ length: 2 + Math.floor(aC() * 3) }, () => [aC() * 1.4 - 0.7, 0.55 + aC() * 0.5]);
  const racines = Array.from({ length: 3 }, () => [aC() * 1.2 - 0.6, 1.2 + aC() * 1.6]);
  return { x, y, t, brume, maison, pts, arbres, racines, phase: k * 1.7 };
});
const melange = (a, b, f) => { const A = parseInt(a.slice(1), 16), Bc = parseInt(b.slice(1), 16); const c = (s) => Math.round(((A >> s) & 255) * (1 - f) + ((Bc >> s) & 255) * f); return 'rgb(' + c(16) + ',' + c(8) + ',' + c(0) + ')'; };
/* les iles lointaines en images (nos modeles d'iles de decor, voiles de brume) ; sinon les iles peintes ci-dessous */
const LOINTAINES = [[1, 0.12, 0.34, 0.15, 0.36], [2, 0.87, 0.26, 0.11, 0.5], [3, 0.68, 0.48, 0.07, 0.6], [2, 0.34, 0.56, 0.055, 0.7]].map(([k, x, y, l, brume], n) => ({ k, x, y, l, brume, phase: n * 1.9, toile: null }));
LOINTAINES.forEach((I) => {
  const img = new Image();
  img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(207,233,243,' + I.brume + ')'; x.fillRect(0, 0, c.width, c.height); I.toile = c; };
  img.src = 'assets/icones/ile-loin-' + I.k + '.png?v=' + VERSION_MODELES;
});
function ileLointaine(I, w, h, s, dec) {
  const echelle = I.t * (w / 1440), L = 120 * echelle, H = 22 * echelle, X = I.x * w + dec * 0.5, Y = I.y * h + Math.sin(s * 2 * Math.PI / 6 + I.phase) * 3, BR = '#cfe9f3', f = I.brume;
  const roche = melange('#8a6e55', BR, f), roche2 = melange('#6e5644', BR, f), herbe = melange('#78c25a', BR, f), herbe2 = melange('#5aa848', BR, f), arbre = melange('#3f8f45', BR, f), tronc = melange('#6b4a30', BR, f);
  const g = cx2.createLinearGradient(0, Y, 0, Y + H * 4); g.addColorStop(0, roche); g.addColorStop(1, roche2);
  cx2.fillStyle = g; cx2.beginPath(); cx2.moveTo(X - L, Y); I.pts.forEach(([u, v]) => cx2.lineTo(X + u * L * 0.95, Y + v * H)); cx2.lineTo(X + L, Y); cx2.closePath(); cx2.fill();
  cx2.strokeStyle = roche2; cx2.lineWidth = Math.max(1, H * 0.12); for (let k = 1; k <= 2; k++) { cx2.beginPath(); cx2.moveTo(X - L * (0.9 - k * 0.15), Y + H * k * 0.9); cx2.lineTo(X + L * (0.85 - k * 0.15), Y + H * k * 0.95); cx2.stroke(); } /* strates */
  cx2.strokeStyle = tronc; cx2.lineWidth = Math.max(1, H * 0.08); I.racines.forEach(([u, l]) => { cx2.beginPath(); cx2.moveTo(X + u * L, Y + H * 0.8); cx2.quadraticCurveTo(X + u * L + H * 0.3, Y + H * (0.8 + l * 0.6), X + u * L - H * 0.1, Y + H * (0.8 + l)); cx2.stroke(); });
  cx2.fillStyle = herbe2; cx2.beginPath(); cx2.ellipse(X, Y + H * 0.15, L * 1.03, H * 0.75, 0, 0, Math.PI * 2); cx2.fill(); /* le dessus d'herbe */
  cx2.fillStyle = herbe; cx2.beginPath(); cx2.ellipse(X, Y - H * 0.05, L * 0.98, H * 0.6, 0, 0, Math.PI * 2); cx2.fill();
  if (I.maison) { const mx = X + L * 0.55, my = Y - H * 0.2; cx2.fillStyle = melange('#f2e7d0', BR, f); cx2.fillRect(mx - H * 0.7, my - H * 1.2, H * 1.4, H * 1.2); cx2.fillStyle = melange('#d9733f', BR, f); cx2.beginPath(); cx2.moveTo(mx - H, my - H * 1.1); cx2.lineTo(mx, my - H * 2.1); cx2.lineTo(mx + H, my - H * 1.1); cx2.closePath(); cx2.fill(); }
  I.arbres.forEach(([u, t]) => { const ax = X + u * L, ay = Y - H * 0.25, r = H * (0.9 + t * 0.6); cx2.fillStyle = tronc; cx2.fillRect(ax - r * 0.12, ay - r * 0.9, r * 0.24, r * 0.9); cx2.fillStyle = arbre; cx2.beginPath(); cx2.arc(ax, ay - r * 1.2, r, 0, Math.PI * 2); cx2.fill(); cx2.fillStyle = herbe; cx2.beginPath(); cx2.arc(ax - r * 0.3, ay - r * 1.45, r * 0.45, 0, Math.PI * 2); cx2.fill(); });
}
const OISEAUX = [[0.25, 0.18, 0.0], [0.29, 0.2, 1.3], [0.27, 0.23, 2.1], [0.62, 0.12, 3.4]];
const TEINTE = { haut: ['#3f9fe0', '#86c9ef', '#cfe9f3', '#fbe6c4', '#f6cfa6'], soleil: 'rgba(255,248,220,', nuage: '#fffaf2', ombre: '#e9d6c8', ile: 'rgba(120,165,190,', oiseau: 'rgba(40,60,80,0.45)' };
function dessinerCiel(s) {
  const w = innerWidth, h = innerHeight, d = TEINTE;
  if (cielCanvas.width !== w || cielCanvas.height !== h) { cielCanvas.width = w; cielCanvas.height = h; }
  const g = cx2.createLinearGradient(0, 0, 0, h); d.haut.forEach((c, k) => g.addColorStop(k / (d.haut.length - 1), c)); cx2.fillStyle = g; cx2.fillRect(0, 0, w, h);
  const sx = 0.2 * w, sy = 0.13 * h, sr = 0.5 * h; const gs = cx2.createRadialGradient(sx, sy, 0, sx, sy, sr);
  gs.addColorStop(0, d.soleil + '0.9)'); gs.addColorStop(0.25, d.soleil + '0.35)'); gs.addColorStop(1, d.soleil + '0)'); cx2.fillStyle = gs; cx2.fillRect(0, 0, w, h);
  const dec = Math.sin(s * 2 * Math.PI / 6) * 0.004 * w;
  if (LOINTAINES.every((I) => I.toile)) LOINTAINES.forEach((I) => { const L = I.l * w, H = L * I.toile.height / I.toile.width, Y = I.y * h + Math.sin(s * 2 * Math.PI / 6 + I.phase) * 3; cx2.drawImage(I.toile, I.x * w + dec * 0.5 - L / 2, Y - H / 2, L, H); });
  else ILES.forEach((I) => ileLointaine(I, w, h, s, dec));
  BANCS.forEach((b, k) => {
    cx2.globalAlpha = k === 0 ? 0.7 : 1; cx2.fillStyle = d.ombre;
    b.forEach((c) => { cx2.beginPath(); cx2.arc(c.x * w + dec * (k + 1), c.y * h + c.r * w * 0.28, c.r * w, 0, Math.PI * 2); cx2.fill(); });
    cx2.fillStyle = d.nuage;
    b.forEach((c) => { cx2.beginPath(); cx2.arc(c.x * w + dec * (k + 1), c.y * h + Math.sin(s * 2 * Math.PI / 6 + c.p) * 2, c.r * w * 0.94, 0, Math.PI * 2); cx2.fill(); });
    cx2.globalAlpha = 1;
  });
  cx2.strokeStyle = d.oiseau; cx2.lineWidth = 2; cx2.lineCap = 'round';
  OISEAUX.forEach(([x, y, p]) => {
    const X = (x + 0.03 * Math.sin(s * 2 * Math.PI / 6 + p)) * w, Y = (y + 0.01 * Math.cos(s * 2 * Math.PI / 3 + p)) * h, e = 7 + 3 * Math.sin(s * 2 * Math.PI * 4 / 3 + p);
    cx2.beginPath(); cx2.moveTo(X - 9, Y - e * 0.6); cx2.quadraticCurveTo(X - 4, Y - 2, X, Y); cx2.quadraticCurveTo(X + 4, Y - 2, X + 9, Y - e * 0.6); cx2.stroke();
  });
}
let graine = 11; const alea = () => { graine = (graine * 16807) % 2147483647; return (graine - 1) / 2147483646; };
const cx = (i) => (i - (COLS - 1) / 2) * S, cz = (j) => (j - (ROWS - 1) / 2) * S;
const TERRE = { libre: '#8fd45c', labour: '#6e4226', sec: '#b0844f', mouille: '#4b2f1b', enclos: '#7ccb52' };
function vider(g) { while (g.children.length) g.remove(g.children[0]); }

/* position monde d'une case : l'ile ronde est une seule grille, toute plate */
function posCase(p) { return { x: cx(p.i), y: 0, z: cz(p.j) }; }
/* les cases rangees par (i, j) : les recherches par position (sous le perso, sous chaque monstre, a chaque image) ne parcourent plus toutes les cases.
   L'index se refait tout seul quand la liste change (achat d'un terrain, partie rechargee) */
let idxCases = null, idxListe = null, idxN = -1;
function invaliderIndex() { idxCases = null; }
function caseAt(i, j) {
  if (!S_) return undefined;
  if (!idxCases || idxListe !== S_.cases || idxN !== S_.cases.length) { idxCases = new Map(); S_.cases.forEach((c) => idxCases.set(c.i + '_' + c.j, c)); idxListe = S_.cases; idxN = S_.cases.length; }
  return idxCases.get(i + '_' + j);
}
function socle(ox, oz, cols, rows, fantome, marge) {
  const g = new T.Group(); const w = cols * S + 2 * (marge || 0), d = rows * S + 2 * (marge || 0);
  const terre = fantome ? mat('#b9c8d6', { transparent: true, opacity: 0.32 }) : mat('#8a5634');
  const roche = fantome ? mat('#c6d3de', { transparent: true, opacity: 0.25 }) : mat('#8e8a85');
  const corps = maille(new T.BoxGeometry(w + 0.12, 1.3, d + 0.12), terre); corps.position.y = -0.95; g.add(corps);
  const bande = maille(new T.BoxGeometry(w + 0.2, 0.18, d + 0.2), fantome ? mat('#d5e0ea', { transparent: true, opacity: 0.35 }) : mat('#5f9b3a')); bande.position.y = -0.36; g.add(bande);
  for (let k = 0; k < Math.round(cols * rows / (fantome ? 5 : 3)); k++) {
    const r = 0.8 + alea() * 1.3; const b = maille(new T.DodecahedronGeometry(r, 0), roche);
    const fx = (alea() - 0.5) * (w - 1.5), fz = (alea() - 0.5) * (d - 1.5); const prof = 1 - Math.max(Math.abs(fx) / (w / 2), Math.abs(fz) / (d / 2));
    b.position.set(fx, -1.7 - prof * 2.6 - alea() * 0.6, fz); b.rotation.set(alea() * 3, alea() * 3, alea() * 3); g.add(b);
  }
  g.position.set(ox, 0, oz); scene.add(g); return g;
}
/* un modele pose sur une ou plusieurs cases, cliquable comme ces cases */
function batiment(nom, x, y, z, cellule, ry) { const g = marquer(cloner(nom), cellule); poser(g, x, y, z, ry); return g; }
