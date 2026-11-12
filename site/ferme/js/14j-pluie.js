'use strict';
/* ===================== LA PLUIE (palier 11, la Saison des pluies : A L'ESSAI, mode test seulement) =====================
   12/11/2026, Mathieu, devant les maquettes de la ferme sous la pluie (des retouches Artlist d'une capture) : « je trouve ca tres tres beau. Par contre, ca
   correspond pas exactement a ce a quoi ressemble notre ile. C'est ce que tu es capable de faire ou c'est juste des images creees par Artlist ? ». Voici donc
   la pluie pour de vrai, dans le style du jeu, pour juger sur pieces. Rien pour les joueurs : tout passe par ETAT_TEST.pluie (les reglages du mode test).
     - 'pluie' : les gouttes, leurs ronds au sol, le ciel d'orage (un voile gris-bleu), les lanternes et les fenetres allumees, la mare qui deborde sur les
       cases d'herbe voisines, la foudre annoncee par un cercle ;
     - 'maree' : la meme chose en plus sombre, et l'eau sur toute l'herbe libre de l'ile (la maree haute du boss).
   Ce n'est qu'une ambiance : rien ne ralentit, rien ne blesse, les cultures ne se noient pas. Les lumieres de la scene ne sont pas touchees (le jour et la nuit
   du palier 10 et la nuit de la foret notent leurs valeurs de plein jour : le voile suffit, pose en « multiplie » par-dessus l'image). */
const PLUIE = { gouttes: 1400, haut: 16, chute: 26, vent: [-3.2, 0, 2.1], long: 0.95, fondu: 2.5, foudre: [7, 12], annonce: 1.2 };
const PLUIE_J = { k: 0, v: null, flash: null, mesh: null, pos: null, G: null, eau: null, eauSig: '', mode: null, t: 0, prochaine: 0, eclair: 0 };
const pluieVoulue = () => (typeof MODE_TEST !== 'undefined' && MODE_TEST && ETAT_TEST.pluie) || null;
const pluieLa = () => !!pluieVoulue() && typeof lieu !== 'undefined' && lieu === 'ferme' && !enAccueil; /* (sur la ferme, en vague comme au calme) */

function voilePluie() {
  const J = PLUIE_J; if (J.v) return J;
  J.v = document.createElement('div'); J.v.className = 'pluie-ferme'; J.v.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;z-index:1;mix-blend-mode:multiply;background:#8b9db8';
  J.flash = document.createElement('div'); J.flash.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;z-index:1;background:#eaf4ff';
  canvas.insertAdjacentElement('afterend', J.v); J.v.insertAdjacentElement('afterend', J.flash); return J;
}
/* les gouttes : des traits qui tombent en biais autour du point que la camera regarde */
function gouttesPluie() {
  const J = PLUIE_J; if (J.mesh) return;
  const n = PLUIE.gouttes; J.G = new Float32Array(n * 3); J.pos = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) { J.G[i * 3] = Math.random() * 2 - 1; J.G[i * 3 + 1] = Math.random() * PLUIE.haut; J.G[i * 3 + 2] = Math.random() * 2 - 1; }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(J.pos, 3));
  J.mesh = new T.LineSegments(g, new T.LineBasicMaterial({ color: '#dcebff', transparent: true, opacity: 0, depthWrite: false })); J.mesh.frustumCulled = false; J.mesh.renderOrder = 5; J.mesh.raycast = () => {};
  scene.add(J.mesh);
}
function animerGouttes(dt, k) {
  const J = PLUIE_J, n = PLUIE.gouttes, R = Math.min(60, 27 / Math.max(0.36, zoom)), v = PLUIE.vent, L = PLUIE.long / Math.hypot(v[0], PLUIE.chute, v[2]), P = J.pos, G = J.G;
  const dx = v[0] * L, dy = -PLUIE.chute * L, dz = v[2] * L;
  for (let i = 0; i < n; i++) { const a = i * 3;
    G[a + 1] -= PLUIE.chute * dt; G[a] += v[0] * dt / R; G[a + 2] += v[2] * dt / R;
    if (G[a + 1] < 0) { if (Math.random() < 0.016 * k) onde(VISEE.x + G[a] * R, 0.06, VISEE.z + G[a + 2] * R, 0.34, '#e6f2ff', 0.42, 0.55); /* (son rond au sol, pour une goutte sur soixante) */
      G[a] = Math.random() * 2 - 1; G[a + 1] = PLUIE.haut * (0.75 + 0.5 * Math.random()); G[a + 2] = Math.random() * 2 - 1; }
    const x = VISEE.x + G[a] * R, y = G[a + 1], z = VISEE.z + G[a + 2] * R, b = i * 6;
    P[b] = x; P[b + 1] = y; P[b + 2] = z; P[b + 3] = x + dx; P[b + 4] = y + dy; P[b + 5] = z + dz; }
  J.mesh.geometry.attributes.position.needsUpdate = true; J.mesh.material.opacity = 0.72 * k; J.mesh.visible = k > 0.01;
}
/* les cases inondees : l'herbe libre pres de la mare ('pluie'), ou toute l'herbe libre de l'ile ('maree'). Une seule piece, refaite quand la ferme change */
function casesInondees(mode) {
  const mares = [], L = [];
  ILE.code.forEach((ch, cle) => { if (ch !== '~') return; const [i, j] = cle.split('_').map(Number); if (i >= 10 && j >= 6) mares.push([i, j]); }); /* (l'etang de devant, a droite sur le plan de l'ile ; l'autre eau est la riviere du fond) */
  ILE.code.forEach((ch, cle) => { if (ch === '~' || ch === ',' || ch === '=') return; const [i, j] = cle.split('_').map(Number), c = caseAt(i, j);
    if (c && (c.type !== 'libre' || c.pave)) return; /* (un champ, un batiment, une route pavee restent au sec) */
    if (mode !== 'maree') { const d = mares.reduce((m, [a, b]) => Math.min(m, Math.hypot(a - i, b - j)), 99), bruit = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; if (d > 2.3 + 0.9 * (bruit - Math.floor(bruit))) return; }
    L.push([i, j]); });
  return L;
}
let matEauPluie = null;
function majEauPluie(mode, k) {
  const J = PLUIE_J, sig = !mode ? '' : mode + ':' + S_.cases.length + ':' + S_.cases.reduce((n, c) => n + (c.type === 'libre' && !c.pave ? 1 : 0), 0);
  if (sig !== J.eauSig) { J.eauSig = sig; if (J.eau) { jeter(J.eau); J.eau = null; }
    const L = mode ? casesInondees(mode) : [];
    if (L.length) { const pos = [], nor = [], idx = [], h = S / 2;
      L.forEach(([i, j], n) => { const x = cx(i), z = cz(j), b = n * 4; pos.push(x - h, 0, z - h, x + h, 0, z - h, x + h, 0, z + h, x - h, 0, z + h); nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0); idx.push(b, b + 2, b + 1, b, b + 3, b + 2); });
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
      if (!matEauPluie) { matEauPluie = mat('#6fc4e6', { transparent: true, opacity: 0, depthWrite: false }); eauAnimee(matEauPluie); partager(matEauPluie); }
      J.eau = new T.Mesh(g, matEauPluie); J.eau.receiveShadow = true; J.eau.renderOrder = 2; J.eau.raycast = () => {}; scene.add(J.eau); } }
  if (J.eau) { J.eau.position.y = 0.02 + 0.12 * k; matEauPluie.opacity = 0.62 * k; J.eau.visible = k > 0.01; } /* (l'eau monte avec la pluie) */
}
/* la foudre : un cercle au sol l'annonce, puis l'eclair tombe (un trait brise, une lueur sur tout l'ecran, une secousse) */
const GEO_ECLAIR = new T.BoxGeometry(1, 1, 1), MAT_ECLAIR = new T.MeshBasicMaterial({ color: '#f8fcff' }), GEO_ANNONCE = new T.RingGeometry(0.78, 0.96, 40); GEO_ANNONCE.rotateX(-Math.PI / 2); partager(GEO_ECLAIR, MAT_ECLAIR, GEO_ANNONCE);
function traitEclair(g, A, B, ep) { const d = new T.Vector3().subVectors(B, A), m = new T.Mesh(GEO_ECLAIR, MAT_ECLAIR); m.position.copy(A).addScaledVector(d, 0.5); m.scale.set(ep, d.length(), ep); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize()); g.add(m); }
function foudrePluie(x, z) {
  const J = PLUIE_J, an = new T.Mesh(GEO_ANNONCE, new T.MeshBasicMaterial({ color: '#fff4b0', transparent: true, opacity: 0, depthWrite: false })); an.position.set(x, 0.16, z); an.renderOrder = 4;
  fxVie(an, PLUIE.annonce, (k, m) => { m.material.opacity = 0.35 + 0.55 * k * (0.6 + 0.4 * Math.sin(k * 40)); m.scale.setScalar(1.45 - 0.45 * k); });
  setTimeout(() => { if (!pluieLa()) return;
    const g = new T.Group(), haut = 19, pts = [new T.Vector3(x, 0, z)]; for (let i = 1; i <= 9; i++) pts.push(new T.Vector3(x + (Math.random() - 0.5) * 1.5 + i * 0.22, haut * i / 9, z + (Math.random() - 0.5) * 1.5 - i * 0.12));
    for (let i = 0; i < 9; i++) traitEclair(g, pts[i], pts[i + 1], 0.2 - i * 0.008);
    const b = pts[4].clone(); traitEclair(g, b, b.clone().add(new T.Vector3(1.6, -2.6, 0.5)), 0.09); traitEclair(g, pts[6], pts[6].clone().add(new T.Vector3(-1.4, -2.2, -0.8)), 0.08);
    fxVie(g, 0.26, (k, m) => { m.visible = k < 0.32 || (k > 0.5 && k < 0.85); });
    onde(x, 0.1, z, 1.9, '#fffbe2', 0.5, 1); secousse(0.14, 0.28); J.eclair = 0.2; /* (l'eclair eclaire la ferme : le voile s'efface un instant) */
    J.flash.style.transition = 'none'; J.flash.style.opacity = '0.55'; requestAnimationFrame(() => { J.flash.style.transition = 'opacity .35s ease-out'; J.flash.style.opacity = '0'; });
  }, PLUIE.annonce * 1000);
}
function couperPluie() { /* tout de suite : on quitte la ferme (un batiment, l'Arene, le Casino) */
  const J = PLUIE_J; if (!J.v) return; J.k = 0; J.v.style.opacity = '0'; if (J.mesh) J.mesh.visible = false; if (J.eau) J.eau.visible = false;
}
function majPluie(dt) { /* a chaque image */
  const J = PLUIE_J, mode = pluieVoulue(), la = pluieLa();
  if (!la && !(J.k > 0)) return;
  if (!la && typeof lieu !== 'undefined' && lieu !== 'ferme') { couperPluie(); return; }
  voilePluie(); gouttesPluie(); if (la && mode !== J.mode) { J.mode = mode; J.prochaine = 0; if (typeof animerLanternes === 'function') animerLanternes.t = 0; }
  const avant = J.k; J.k = la ? Math.min(1, J.k + dt / PLUIE.fondu) : Math.max(0, J.k - dt / PLUIE.fondu);
  if ((!avant && J.k) || (avant && !J.k)) { if (typeof animerLanternes === 'function') animerLanternes.t = 0; if (typeof majLumieresBat === 'function') majLumieresBat.t = 0; } /* (les lanternes et les fenetres s'allument avec la pluie) */
  const maree = J.mode === 'maree'; J.v.style.background = maree ? '#5f7096' : '#7387aa'; if (J.eclair > 0) J.eclair -= dt; J.v.style.opacity = String((maree ? 0.92 : 0.88) * J.k * (J.eclair > 0 ? 0.3 : 1));
  animerGouttes(dt, J.k); majEauPluie(J.k > 0 ? J.mode : null, J.k);
  if (la && J.k >= 1) { J.t += dt; if (!J.prochaine) J.prochaine = J.t + 2.5;
    if (J.t >= J.prochaine) { J.prochaine = J.t + PLUIE.foudre[0] + Math.random() * (PLUIE.foudre[1] - PLUIE.foudre[0]) * (maree ? 0.5 : 1);
      const R = 8 / Math.max(0.6, zoom), i = Math.round((VISEE.x + (Math.random() * 2 - 1) * R) / S + (COLS - 1) / 2), j = Math.round((VISEE.z + (Math.random() * 2 - 1) * R) / S + (ROWS - 1) / 2);
      if (codeIle(i, j)) foudrePluie(cx(i), cz(j)); } }
  if (!J.k) { J.mode = null; }
}
