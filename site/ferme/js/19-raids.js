'use strict';
/* LA SIMU VSA ACCEPTEE (13/10/2026, idee de Moonsbir, approuvee par UnMortVivant, notee par Mathieu : « mets juste un pop-up qui te bloque le jeu tant que tu
   as pas accepte, et faut l'accepter pour declencher l'attaque ») : la simu ne tombe plus d'elle-meme ; le jeu se fige sur une fenetre, et c'est le joueur qui
   lance les 30 s de preparation. Il ne se fait jamais piller sans le savoir (et toujours rien s'il n'a pas touche au jeu depuis 3 min). */
/* LE BOUCLIER ANTI-VSA (07/11/2026, « pouvoir acheter via la grange niveau 6 un shield pour 50k gold, protege 2 h des attaques VSA », « un bouclier qui entoure
   la base (la grange) », Mathieu) : achete dans la grange niveau 6, il empeche toute simu VSA et tout voleur de VSA pendant 2 h (temps reel) ; un dome bleu
   entoure la grange tant qu'il tient */
const PRIX_BOUCLIER = 50000, DUREE_BOUCLIER = 120 * MIN, QG_BOUCLIER = 5; /* (niv('qg') 5 : la grange niveau 6) */
const bouclierActif = (t) => !!(S_ && S_.bouclierVsa && (t || Date.now()) < S_.bouclierVsa);
function acheterBouclier() {
  if (niv('qg') < QG_BOUCLIER) { toast('Le bouclier anti-VSA demande la grange niveau 6.', 'alerte'); return; }
  if (bouclierActif()) { toast('Ton bouclier anti-VSA tient encore ' + dureeLisible(S_.bouclierVsa - Date.now()) + '.', 'alerte'); return; }
  if (simuEnAttente || raidAnnonce || (combat && combat.raid)) { toast('Trop tard : les voleurs de VSA sont déjà là. Le bouclier se lève après la simu.', 'alerte'); return; }
  if (S_.kamas < PRIX_BOUCLIER) { toast('Il te faut ' + fmt(PRIX_BOUCLIER) + ' kamas pour le bouclier anti-VSA.', 'alerte'); return; }
  S_.kamas -= PRIX_BOUCLIER; S_.bouclierVsa = Date.now() + DUREE_BOUCLIER; son('niveau'); compter('boucliers');
  toast('Bouclier anti-VSA levé autour de ta grange : pendant 2 h, aucune simu ni voleur de VSA.', 'or'); rendreHaut(); sauver();
}
let domeBouclier = null;
/* le dome (07/11/2026, refait le meme jour : « la ca fait bulle en plastique ou en verre, ca manque d'un effet un peu magique », Mathieu) : plus de remplissage
   « verre », un champ de force : une trame d'hexagones qui luit au bord, des cases qui s'allument au hasard, des ondes d'energie qui descendent du sommet,
   cyan en bas et violet en haut ; au sol, un cercle de runes qui tourne ; des etincelles qui montent le long du dome */
const VS_DOME = 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main() { vP = position; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }';
const FS_DOME = [
  'uniform float uT; uniform float uF; varying vec3 vN; varying vec3 vV; varying vec3 vP;',
  'float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
  'void main() {',
  '  float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);',
  '  float th = atan(vP.z, vP.x), ph = acos(clamp(vP.y, 0.0, 1.0));',
  '  vec2 uv = vec2(th * 2.8648, ph * 7.0);',
  '  vec2 r = vec2(1.0, 1.7320508), h = r * 0.5, a = mod(uv, r) - h, b = mod(uv - h, r) - h, gv = dot(a, a) < dot(b, b) ? a : b, id = uv - gv;',
  '  vec2 q = abs(gv); float d = max(dot(q, vec2(0.5, 0.8660254)), q.x);',
  '  float ligne = 1.0 - smoothstep(0.40, 0.47, d);',
  '  float bord = smoothstep(0.38, 0.48, d);',
  '  float hc = hash(floor(id * 10.0)); float allume = pow(0.5 + 0.5 * sin(uT * (0.45 + 0.4 * hc) + hc * 40.0), 40.0);',
  '  float onde = pow(0.5 + 0.5 * sin(ph * 6.0 - uT * 1.1), 14.0);',
  '  float pied = smoothstep(0.35, 0.0, vP.y);',
  '  vec3 cBas = vec3(0.10, 0.72, 1.0), cHaut = vec3(0.62, 0.30, 1.0), c = mix(cBas, cHaut, smoothstep(0.1, 1.0, vP.y));',
  '  float al = 0.03 + 0.2 * f + bord * (0.18 + 0.22 * f) + allume * 0.12 * (1.0 - bord) + onde * (0.02 + 0.10 * bord) + pied * 0.14;',
  '  vec3 col = mix(c, vec3(1.0), bord * 0.25 + allume * 0.3 + onde * bord * 0.15);',
  '  gl_FragColor = vec4(col, al * uF); }'].join('\n');
function texRunes() { /* un cercle de runes dessine une fois : deux anneaux, des glyphes entre eux, des rayons */
  const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d'), c = N / 2;
  x.strokeStyle = '#ffffff'; x.fillStyle = '#ffffff'; x.lineCap = 'round';
  [[0.97, 2.5], [0.88, 1.5]].forEach(([k, w]) => { x.lineWidth = w; x.beginPath(); x.arc(c, c, c * k, 0, Math.PI * 2); x.stroke(); });
  const nb = 24; for (let i = 0; i < nb; i++) { const a = i / nb * Math.PI * 2, rr = c * 0.925; x.save(); x.translate(c + Math.cos(a) * rr, c + Math.sin(a) * rr); x.rotate(a + Math.PI / 2); x.scale(0.6, 0.6); x.lineWidth = 2.6; x.beginPath();
    const g = i % 4; if (g === 0) { x.moveTo(-9, 10); x.lineTo(0, -12); x.lineTo(9, 10); x.moveTo(-5, 3); x.lineTo(5, 3); } else if (g === 1) { x.moveTo(0, -12); x.lineTo(0, 12); x.moveTo(-8, -4); x.lineTo(8, 4); }
    else if (g === 2) { x.arc(0, 0, 8, 0, Math.PI * 1.6); x.moveTo(0, -12); x.lineTo(0, 12); } else { x.moveTo(-9, -9); x.lineTo(9, 9); x.moveTo(9, -9); x.lineTo(-9, 9); x.moveTo(-10, 0); x.lineTo(10, 0); }
    x.stroke(); x.restore(); }
  
  const t = new T.CanvasTexture(cv); t.anisotropy = 4; return t;
}
function creerDome() {
  const g = new T.Group(), add = { transparent: true, depthWrite: false, side: T.DoubleSide }; /* (melange normal : en additif, sur le sol clair, tout virait au blanc laiteux) */
  const mat = new T.ShaderMaterial(Object.assign({ uniforms: { uT: { value: 0 }, uF: { value: 0 } }, vertexShader: VS_DOME, fragmentShader: FS_DOME }, add));
  const d = new T.Mesh(new T.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), mat); d.renderOrder = 6; g.add(d);
  const runes = new T.Mesh(new T.CircleGeometry(1.0, 64), new T.MeshBasicMaterial(Object.assign({ map: texRunes(), color: '#29b8ff', opacity: 0.8 }, add))); runes.rotation.x = -Math.PI / 2; runes.position.y = 0.07; runes.renderOrder = 6; g.add(runes);
  const halo = new T.Mesh(new T.RingGeometry(0.985, 1.0, 96), new T.MeshBasicMaterial(Object.assign({ color: '#8a5cff', opacity: 0.5 }, add))); halo.rotation.x = -Math.PI / 2; halo.position.y = 0.08; halo.renderOrder = 6; g.add(halo);
  g.traverse((o) => { o.raycast = () => {}; }); g.userData = { mat, runes, halo, t: 0, f: 0, etin: 0, R: 1 }; scene.add(g); return g;
}
function majBouclier(dt, s) { /* le dome autour de la grange, tant que le bouclier tient ; un message quand il s'eteint */
  if (!S_) return;
  if (S_.bouclierVsa && Date.now() >= S_.bouclierVsa) { S_.bouclierVsa = 0; toast('Ton bouclier anti-VSA s\'est éteint : les voleurs de VSA peuvent revenir.', 'alerte'); sauver(); }
  if (!bouclierActif()) { if (domeBouclier) { jeter(domeBouclier); domeBouclier = null; } return; }
  if (!domeBouclier) domeBouclier = creerDome();
  const D = domeBouclier, u = D.userData; u.t -= dt; u.f = Math.min(1, u.f + dt / 1.2); /* (il se leve en 1,2 s) */
  if (u.t <= 0) { u.t = 1; const G = S_.cases.filter((c) => c.type === 'grange').map(posCase); D.visible = G.length > 0 && lieu === 'ferme';
    if (G.length) { const x = G.reduce((a, q) => a + q.x, 0) / G.length, z = G.reduce((a, q) => a + q.z, 0) / G.length; u.R = Math.max(...G.map((q) => Math.hypot(q.x - x, q.z - z))) + 1.0 * S; /* (plus pres du batiment, 07/11/2026 ; 1,4 case avant) */
      D.position.set(x, solA(x, z), z); D.children[0].scale.set(u.R, u.R * 1.15, u.R); /* (plus haut que large : serre au sol, il couvre la fleche de la grande tour) */ u.runes.scale.setScalar(u.R); u.halo.scale.setScalar(u.R); } }
  u.mat.uniforms.uT.value = s; u.mat.uniforms.uF.value = u.f; u.runes.rotation.z = s * 0.12; u.runes.material.opacity = (0.5 + 0.08 * Math.sin(s * 0.9)) * u.f; u.halo.material.opacity = (0.45 + 0.08 * Math.sin(s * 1.1 + 1)) * u.f; /* (des pulsations douces, 07/11/2026 : « ca clignote un peu trop de partout ») */
  if (D.visible && (u.etin += dt) > 0.3) { u.etin = 0; const a = Math.random() * Math.PI * 2, h = Math.random() * 0.85, rr = u.R * Math.sqrt(1 - h * h); /* (des etincelles qui montent le long du dome) */
    emettre(FX_LUM, 1, { x: D.position.x + Math.cos(a) * rr, y: D.position.y + h * u.R * 0.9, z: D.position.z + Math.sin(a) * rr, v: [0, 0.7, 0], vie: [1.2, 2.0], taille: [0.2, 0.03], c: [Math.random() < 0.5 ? '#bdf3ff' : '#d4c2ff', '#7a8cff'], a: 0.5, entree: 0.4 }); }
}
let simuEnAttente = false;
function proposerSimu() {
  if (simuEnAttente || raidAnnonce || combat || enAccueil || enPause) return;
  const { nb, montes, parachutistes } = tailleSimu(); simuEnAttente = true;
  $('simu-txt').textContent = nb + ' voleurs de VSA' + (montes ? ', dont ' + montes + ' à dos de Dragodinde,' : '') + (parachutistes ? ' et ' + parachutistes + ' parachutistes' : '') + ' veulent piller ta grange. Le jeu attend ton accord : quand tu acceptes, ils arrivent 30 s plus tard, ou tout de suite avec « Lancer maintenant ». Recharge ton arbalète !';
  if (visee) annulerVisee(); fermerModale(); mettrePause(true, true); $('simu-pop').hidden = false; son.der = {}; son('raid');
}
function accepterSimu() { if (!simuEnAttente) return; simuEnAttente = false; $('simu-pop').hidden = true; mettrePause(false); annoncerRaid(true); }
function annoncerRaid(muet) {
  if (raidAnnonce || combat || enAccueil) return;
  if (!personnagesVsaPrets() || !MODELES.omeho) chargerPersonnagesVsa(); /* (un modele rate au chargement : il a 30 s pour arriver) */
  const { nb, montes } = tailleSimu(), dem = MODELES.demenageur ? tailleSimu().demenageurs : 0; /* (la taille : tailleSimu, 18-geliere.js ; sans son modele, pas de Demenageur) */
  const sortie = sortieVSA(), entrees = entreesVSA(sortie, nb + dem); /* (une case de bord par voleur, tout autour de la ferme, 18/10/2026) */
  const marques = new T.Group(); /* les cases par ou ils arriveront, en rouge */
  /* « les cases rouges sont pas alignees avec les cases en dessous » (Mathieu, 11/10/2026) : elles etaient poussees de 0,45 vers le vide et dessinees
     par-dessus tout (on les voyait a travers la grange). Maintenant : pile sur la case, cachees par les batiments, et une bande plus foncee cote vide */
  entrees.filter((b, k) => entrees.indexOf(b) === k).forEach((b) => { const q = posCase(b.c);
    const r = new T.Mesh(new T.PlaneGeometry(S - 0.15, S - 0.15), new T.MeshBasicMaterial({ color: '#d9443a', transparent: true, opacity: 0.4, depthWrite: false })); r.rotation.x = -Math.PI / 2; r.position.set(q.x, q.y + 0.08, q.z); r.renderOrder = 3; marques.add(r);
    const l = new T.Mesh(new T.PlaneGeometry(b.di ? 0.3 : S - 0.15, b.dj ? 0.3 : S - 0.15), new T.MeshBasicMaterial({ color: '#a8231b', transparent: true, opacity: 0.6, depthWrite: false })); l.rotation.x = -Math.PI / 2; l.position.set(q.x + b.di * (S / 2 - 0.23), q.y + 0.09, q.z + b.dj * (S / 2 - 0.23)); l.renderOrder = 3; marques.add(l); });
  scene.add(marques);
  poserOmeho(sortie);
  raidAnnonce = { fin: Date.now() + ANNONCE_RAID, nb, montes, dem, para: MODELES.parachutiste ? tailleSimu().parachutistes : 0, entrees, marques, sortie }; if (!muet) son('raid');
  construireRaidAnnonce(); majRaidAnnonce(); /* (plus de message en plus : la carte dit tout) */
}
/* LA SORTIE DES VOLEURS, ET OMEHO QUI LES ATTEND (14/10/2026, Mathieu : « ils peuvent apparaitre de n'importe ou, mais pour repartir, ils doivent repartir vers
   la case la plus loin par rapport a la grange, et faut une indication » ; puis « il faut absolument Omeho : imagine un Enutrof, un vieux papi, avec des habits
   de pouilleux, des pattes de poulet bleu a la place des pieds, et un trouillard de fou ; il a juste une couronne en or », modele blender/omeho.py).
   A l'annonce, la simu choisit sa sortie : la case de bord la plus loin de la grange, une case ou l'on passe (libre de preference). Omeho, le chef de VSA, y
   attend ses voleurs en tremblant, sur une case violette ; chaque voleur qui repart court vers lui et disparait a ses pieds. Il s'en va a la fin de la simu.
   (27/10/2026, « Omeho est cache lors des simus : quand on achete la map en bas, il apparait que sur une seule case, pres de l'etang ; il faudrait qu'en fonction
   des terrains qu'on achete il apparaisse a differents endroits, pas forcement au plus loin, mais pas trop pres non plus », Mathieu) : la sortie est tiree au
   hasard parmi les cases de bord a au moins 60 % de la plus grande distance a la grange ; de preference une case qu'on voit a l'ecran (ni sous la barre des
   sorts, ni sous un panneau), une case libre compte double, et jamais deux fois de suite la meme quand on a le choix. */
let sortiePrec = null;
const PANNEAUX_ECRAN = ['panneau-grange', 'panneau-elevage', 'toasts', 'objectif', 'chat'];
function aLEcran(q) { /* (Omeho debout sur cette case, vu par la camera du moment) */
  const v = new T.Vector3(q.x, q.y + 1, q.z).project(camera), w = innerWidth, h = innerHeight, x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h;
  if (x < 40 || x > w - 40 || y < h * 0.17 || y > h - 200) return false; /* (en haut le bandeau du combat, en bas la barre des sorts, pas encore la a l'annonce) */
  return !PANNEAUX_ECRAN.some((id) => { const e = $(id); if (!e || !e.offsetParent) return false; const r = e.getBoundingClientRect(); return r.width > 0 && x > r.left - 30 && x < r.right + 30 && y > r.top - 40 && y < r.bottom + 30; });
}
function sortieVSA() {
  const G = S_.cases.filter((c) => c.type === 'grange'); if (!G.length) return null;
  const gx = G.reduce((t, c) => t + posCase(c).x, 0) / G.length, gz = G.reduce((t, c) => t + posCase(c).z, 0) / G.length;
  const B = bordsFerme().filter((b) => PASSABLE[b.c.type]); if (!B.length) return null;
  const dist = (b) => { const q = posCase(b.c); return Math.hypot(q.x - gx, q.z - gz); }, dmax = Math.max(...B.map(dist));
  let L = B.filter((b) => dist(b) >= dmax * 0.6);
  const vus = L.filter((b) => aLEcran(posCase(b.c))); if (vus.length) L = vus;
  const autres = L.filter((b) => b.c.id !== sortiePrec); if (autres.length) L = autres;
  const poids = L.map((b) => (b.c.type === 'libre' ? 2 : 1)); let p = Math.random() * poids.reduce((t, x) => t + x, 0), k = 0; while (k < L.length - 1 && (p -= poids[k]) > 0) k++;
  const b = L[k], q = posCase(b.c); sortiePrec = b.c.id;
  return { id: b.c.id, di: b.di, dj: b.dj, x: q.x + b.di * 0.25, z: q.z + b.dj * 0.25, cx: q.x, cz: q.z, y: q.y, gx, gz };
}
/* LES ENTREES DES VOLEURS (18/10/2026, « faut que ce soit comme avant, qu'ils arrivent de partout et qu'ils repartent vers Omeho », Mathieu ; l'entree
   unique du 17/10 ne lui plaisait pas) : une case de bord par voleur, reparties sur tout le tour de la ferme (les bords ranges par angle autour de son
   centre, puis pris au nombre d'or : deux voleurs qui se suivent arrivent de cotes opposes), jamais a moins de 2 cases d'Omeho. Toujours un par seconde,
   chacun par sa case, marquee en rouge des l'annonce. */
function entreesVSA(so, nb) {
  const C = S_.cases; if (!C.length) return [];
  const cx = C.reduce((t, c) => t + posCase(c).x, 0) / C.length, cz = C.reduce((t, c) => t + posCase(c).z, 0) / C.length;
  const B0 = bordsFerme().filter((b) => PASSABLE[b.c.type] && !(so && b.c.id === so.id)), loin = B0.filter((b) => { if (!so) return true; const q = posCase(b.c); return Math.hypot(q.x - so.cx, q.z - so.cz) >= 2 * S; }), B = loin.length ? loin : B0;
  if (!B.length) return [];
  const angle = (b) => { const q = posCase(b.c); return Math.atan2(q.x + b.di * S / 2 - cx, q.z + b.dj * S / 2 - cz); };
  B.sort((a, b) => angle(a) - angle(b));
  const o = Math.random(); return Array.from({ length: nb }, (_, k) => B[Math.floor(((o + k * 0.618034) % 1) * B.length)]);
}
/* SON ESCORTE ET SA CALECHE (« ta realisation d'Omeho est super pour le moment, on met pas une caleche, une escorte avec lui ? » puis « ca peut faire plusieurs
   cases, tout n'est pas oblige de tenir sur une case », Mathieu, 14/10/2026) : Omeho sur sa case violette, un voleur de garde de chaque cote ; la caleche
   bachee de VSA (blender/sortie-vsa.py), tiree par la Dragodinde des voleurs, se gare le long du bord sur les deux cases voisines si elles sont libres
   (d'un cote ou de l'autre), sinon il vient sans elle. Ce n'est qu'un decor : les cases restent a toi, rien n'y est bloque. */
let omeho = null; /* { m, marque, bulle, so, saut, decor, gardes } */
const voisinLe = (c, dx, dz) => { if (!c) return null; const q = posCase(c); return voisins(c).find((v) => { const p = posCase(v); return Math.abs(p.x - q.x - dx * S) < 0.3 && Math.abs(p.z - q.z - dz * S) < 0.3; }) || null; };
function poserOmeho(so) {
  retirerOmeho(); if (!so) return;
  const marque = new T.Group(); /* la case de sortie, en violet (comme les cases rouges de l'arrivee) */
  const r = new T.Mesh(new T.PlaneGeometry(S - 0.15, S - 0.15), new T.MeshBasicMaterial({ color: '#9b5cf0', transparent: true, opacity: 0.55, depthWrite: false })); r.rotation.x = -Math.PI / 2; r.position.set(so.cx, so.y + 0.08, so.cz); r.renderOrder = 3; marque.add(r);
  const l = new T.Mesh(new T.PlaneGeometry(so.di ? 0.3 : S - 0.15, so.dj ? 0.3 : S - 0.15), new T.MeshBasicMaterial({ color: '#5a2aa8', transparent: true, opacity: 0.8, depthWrite: false })); l.rotation.x = -Math.PI / 2; l.position.set(so.cx + so.di * (S / 2 - 0.23), so.y + 0.09, so.cz + so.dj * (S / 2 - 0.23)); l.renderOrder = 3; marque.add(l);
  scene.add(marque);
  const tx = -so.dj, tz = so.di, c0 = S_.cases.find((c) => c.id === so.id), libre = (c) => !!c && c.type === 'libre'; /* (tx, tz) : le long du bord */
  const vers = (k) => Math.sign(tx * k * Math.cos(angleCam) + tz * k * Math.sin(angleCam)) || 1; /* (+1 : en partant du cote k, la caleche roule vers la camera) */
  const cotes = [1, -1].filter((k) => { const v = voisinLe(c0, tx * k, tz * k); return libre(v) && libre(voisinLe(v, tx * k, tz * k)); }).sort((a, b) => vers(b) - vers(a));
  const cote = cotes[0] || 0, sens = cote ? vers(cote) : 1; /* sens -1 : garee a l'envers, la Dragodinde vers la case violette, pour qu'Omeho nous fasse face */
  const decor = new T.Group(); scene.add(decor); const ox = so.cx + so.di * 0.35, oz = so.cz + so.dj * 0.35;
  let g = null; if (cote && MODELES.caleche) { /* garee le long du bord, l'arriere de la caisse au ras de la case violette, la Dragodinde tournee vers le large */
    g = MODELES.caleche.clone(true); g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const d = sens > 0 ? 2.7 : 3.15; g.position.set(so.cx + tx * cote * d + so.di * 0.2, so.y, so.cz + tz * cote * d + so.dj * 0.2); g.rotation.y = Math.atan2(tx * cote * sens, tz * cote * sens); decor.add(g);
    if (sens > 0) { so.x = so.cx + tx * cote * 0.55 + so.di * 0.2; so.z = so.cz + tz * cote * 0.55 + so.dj * 0.2; } } /* (les voleurs filent a l'arriere de la caleche quand elle le touche, toujours sur la case violette) */
  const siege = g ? new T.Vector3(0, 1.33, 0.15).applyAxisAngle(new T.Vector3(0, 1, 0), g.rotation.y).add(g.position) : new T.Vector3(ox, so.y, oz); /* debout sur le siege du cocher, ou sur la case */
  let m = null; if (MODELES.omeho) { m = cloner('omeho'); ombrePieds(m, 1.1); m.position.copy(siege); m.rotation.y = g ? g.rotation.y : Math.atan2(so.gx - ox, so.gz - oz); m.userData.x0 = siege.x; m.userData.y0 = siege.y; m.userData.z0 = siege.z; m.userData.ry0 = m.rotation.y; m.userData.fixe = !!g; scene.add(m); }
  const gardes = [], k1 = cote || 1, loin = libre(voisinLe(c0, -tx * k1, -tz * k1)) ? 1.15 : 0.75; /* (le garde du cote sans caleche deborde sur la case voisine si elle est libre) */
  const postes = g ? [[k1, 0.62, 0.55], [-k1, 0.62, 0.55]] : [[k1, 0.85, 0.45], [-k1, loin, 0.45]]; /* (avec la caleche : les deux gardes devant la case violette, comme des portiers) */
  if (MODELES.voleur) postes.forEach(([k, e, av]) => { const v = cloner('voleur'); ombrePieds(v, 1.2); const x = so.cx + (g ? 0 : so.di * 0.35) + tx * k * e - so.di * av, z = so.cz + (g ? 0 : so.dj * 0.35) + tz * k * e - so.dj * av;
    v.position.set(x, so.y, z); v.rotation.y = Math.atan2(so.gx - x, so.gz - z); v.userData.x0 = x; v.userData.z0 = z; v.userData.ry0 = v.rotation.y; v.userData.phase = Math.random() * 6; decor.add(v); gardes.push(v); });
  ancres.omeho = new T.Vector3(siege.x, siege.y + 2.3, siege.z);
  const bulle = document.createElement('div'); bulle.className = 'bulle omeho'; bulle.dataset.ancre = 'omeho'; bulle.innerHTML = 'Omeho<small>la sortie des voleurs</small>'; zoneBulles.appendChild(bulle);
  omeho = { m, marque, bulle, so, saut: 0, decor, gardes, caleche: !!(cote && MODELES.caleche), ancre: ancres.omeho, parleT: 4 + Math.random() * 4, peurT: 0 };
}
const REPLIQUES_OMEHO = {
  raid: ['Plus vite, bande de larves !', 'Je surveille la calèche... de très loin.', 'C\'est pas moi qui ai eu l\'idée, hein !', 'Ramenez-moi des kamas, pas des excuses !', 'Si ça tourne mal, je ne vous connais pas.', 'Ma couronne ne va pas se payer toute seule !', 'Hé hé, cette grange a l\'air bien remplie...'],
  butin: ['Hé hé, merci pour le butin !', 'Ça, c\'est pour ma couronne !', 'Encore, encore !', 'Pose ça dans la calèche, et vite !'],
  peur: ['Pas moi, pas moi ! Prends plutôt les autres !', 'Je suis juste le cocher !', 'Ne t\'approche pas, j\'ai... j\'ai une couronne !', 'Au secours, un paysan !'],
  vole: ['Merci pour les provisions, paysan ! Hé hé !', 'À la prochaine, et garde ta grange bien pleine !', 'Hue, Dragodinde ! On file !'],
  rate: ['Bande d\'incapables ! On s\'en va !', 'Je reviendrai... avec plus de monde !', 'C\'était un repérage, juste un repérage !', 'Fouette cocher, il est fou celui-là !'] };
function direOmeho(genre, duree) { /* une replique dans sa bulle violette, quelques secondes, puis son nom revient */
  if (!omeho) return; const L = REPLIQUES_OMEHO[genre]; if (!L) return; let t = hasard(L); if (L.length > 1 && t === omeho.dit) t = hasard(L.filter((x) => x !== omeho.dit)); omeho.dit = t;
  omeho.bulle.innerHTML = '<small>Omeho</small>« ' + t + ' »'; omeho.bulle.classList.add('parle'); omeho.parleFin = performance.now() + (duree || 3200);
}
function partirOmeho(vole) { /* la fin du raid : sa derniere replique, puis la caleche l'emporte (ou il detale a pied) */
  if (!omeho) return; const o = omeho; omeho = null; direOmehoSur(o, vole ? 'vole' : 'rate');
  o.gardes.forEach((v) => { pouf(v.position.x, v.position.y, v.position.z, 1.1); v.visible = false; }); /* (ses gardes sautent dans la caleche) */
  jeter(o.marque); const m = o.m, cal = o.decor.children.find((x) => x.visible !== false && !o.gardes.includes(x));
  const ry = cal ? cal.rotation.y : Math.atan2(o.so.di, o.so.dj), dx = Math.sin(ry), dz = Math.cos(ry), x0 = cal ? cal.position.x : 0, z0 = cal ? cal.position.z : 0, mx = m ? m.position.x : 0, mz = m ? m.position.z : 0;
  if (m && !cal) m.rotation.y = ry; let t = 0;
  effets.push((dt) => { t += dt; const k = Math.max(0, t - 0.9), d = k * k * 2.2 + k * 0.8; /* un temps pour sa replique, puis la Dragodinde demarre */
    if (cal) { cal.position.x = x0 + dx * d; cal.position.z = z0 + dz * d; }
    if (m) { m.position.x = mx + dx * d; m.position.z = mz + dz * d; m.position.y = m.userData.y0 + (cal ? Math.abs(Math.sin(t * 9)) * 0.05 : Math.abs(Math.sin(t * 14)) * 0.18); }
    if (Math.random() < 0.25 && k > 0) pouf(x0 + dx * (d - 1.5), o.so.y + 0.1, z0 + dz * (d - 1.5), 0.8, '#d8c8a8');
    /* « des fois il s'envole dans le ciel : s'il passe la limite de la map, il disparait » (Mathieu, 23/10/2026) : l'ile flotte, la caleche roulait au-dessus
       du vide ; des que son milieu (un peu en avant) quitte le sol, elle disparait dans un nuage de poussiere */
    const av = cal ? d + 0.8 : d, px = (cal ? x0 : mx) + dx * av, pz = (cal ? z0 : mz) + dz * av; /* (a pied : ses pieds) */
    if (t > 3.6 || (k > 0 && !caseIci(px, pz))) { pouf((cal ? x0 : mx) + dx * d, o.so.y + 0.5, (cal ? z0 : mz) + dz * d, 2.5, '#d8c8a8'); if (m) jeter(m); jeter(o.decor); o.bulle.remove(); if (ancres.omeho === o.ancre) delete ancres.omeho; return true; }
    if (m) { o.ancre.set(m.position.x, m.position.y + 2.3, m.position.z); } });
}
function direOmehoSur(o, genre) { const sv = omeho; omeho = o; direOmeho(genre, 3400); omeho = sv; }
function retirerOmeho() { if (!omeho) return; if (omeho.m) jeter(omeho.m); jeter(omeho.marque); jeter(omeho.decor); omeho.bulle.remove(); delete ancres.omeho; omeho = null; }
const tournerVers = (o, x, z, dt, v) => { let e = Math.atan2(x - o.userData.x0, z - o.userData.z0) - o.userData.ry0; e = Math.atan2(Math.sin(e), Math.cos(e)); o.userData.ry0 += e * Math.min(1, dt * v); o.rotation.y = o.userData.ry0; };
function animerOmeho(dt, s) { /* il tremble de peur, plus fort quand tu approches, et sautille quand un voleur le rejoint ; les gardes te surveillent */
  if (!omeho) return; const m = omeho.m; omeho.marque.children.forEach((o, k) => { o.material.opacity = (k ? 0.85 : 0.6) * (0.65 + 0.35 * Math.abs(Math.sin(s * 3))); });
  const pp = paysanMesh && paysanMesh.position;
  omeho.gardes.forEach((v) => { if (pp) tournerVers(v, pp.x, pp.z, dt, 2); v.position.y = omeho.so.y + Math.abs(Math.sin(s * 2.2 + v.userData.phase)) * 0.015; });
  if (!m) return;
  const d = pp ? Math.hypot(pp.x - m.userData.x0, pp.z - m.userData.z0) : 99, peur = d < 3 ? 2.6 : 1;
  omeho.saut = Math.max(0, omeho.saut - dt * 2.2); const h = Math.sin(omeho.saut * Math.PI) * 0.35;
  if (omeho.parleFin && performance.now() > omeho.parleFin) { omeho.parleFin = 0; omeho.bulle.classList.remove('parle'); omeho.bulle.innerHTML = 'Omeho<small>la sortie des voleurs</small>'; }
  if (combat && combat.raid && !omeho.parleFin) { omeho.parleT -= dt; omeho.peurT -= dt;
    if (d < 3 && omeho.peurT <= 0) { omeho.peurT = 7; direOmeho('peur'); } else if (omeho.parleT <= 0) { omeho.parleT = 8 + Math.random() * 6; direOmeho('raid'); } }
  m.position.set(m.userData.x0 + Math.sin(s * 47) * 0.012 * peur, m.userData.y0 + h + Math.abs(Math.sin(s * 31)) * 0.008 * peur, m.userData.z0 + Math.cos(s * 41) * 0.01 * peur);
  if (pp && !m.userData.fixe) tournerVers(m, pp.x, pp.z, dt, 3); /* a pied, il ne te quitte pas des yeux ; sur la caleche, il regarde droit devant comme la Dragodinde, pret a filer sans attendre ses potes (Mathieu, 14/10/2026) */
  m.rotation.z = Math.sin(s * 38) * 0.025 * peur; m.rotation.x = d < 3 ? -0.12 : 0; /* (tout pres de lui, il recule la tete) */
}
function construireRaidAnnonce() {
  const R = raidAnnonce; if (!R) return; const v = '?v=' + VERSION_MODELES;
  $('raid-annonce').innerHTML = '<div class="ra-tete"><img src="assets/icones/voleur.png' + v + '" alt=""><div><b>Simu VSA</b><span>Les voleurs de VSA arrivent sur ta grange</span></div>' +
    '<div class="ra-rebours"><svg viewBox="0 0 44 44"><circle class="fond" cx="22" cy="22" r="19"/><circle class="arc" id="ra-arc" cx="22" cy="22" r="19"/></svg><em id="ra-s">30</em></div></div>' +
    '<div class="ra-puces"><span><img src="assets/icones/voleur.png' + v + '" alt="">' + R.nb + ' voleurs</span>' + (R.montes ? '<span>dont ' + R.montes + ' à dos de Dragodinde</span>' : '') + (R.dem ? '<span>+ ' + R.dem + ' Déménageur' + (R.dem > 1 ? 's' : '') + ' : lent, coriace, il vide ta grange</span>' : '') +
    '<span class="rouge"><i></i>' + 'de tout autour, par les cases en rouge' + '</span>' + (R.sortie ? '<span class="violet"><i></i>ils repartent par Omeho, en violet</span>' : '') + '</div>' +
    '<div class="ra-actions"><span class="ra-arb" id="ra-arb"></span><button class="btn discret" data-recharger id="ra-recharger">Recharger</button><button class="btn kamas" data-raid-go>Lancer maintenant</button></div>';
}
function majRaidAnnonce() {
  const R = raidAnnonce, e = $('raid-annonce'); if (!R) { e.hidden = true; return; }
  if (!$('ra-s')) construireRaidAnnonce(); e.hidden = false;
  const reste = Math.max(0, Math.ceil((R.fin - Date.now()) / 1000)); $('ra-s').textContent = reste; $('ra-arc').style.strokeDashoffset = (119.4 * (1 - Math.min(1, (R.fin - Date.now()) / ANNONCE_RAID))).toFixed(1);
  e.querySelector('.ra-rebours').classList.toggle('presse', reste <= 10);
  { const a = $('ra-arb'), arb = niv('arbalete'), cap = arb ? capaciteArbalete() : 0, plein = !arb || S_.carreaux >= cap;
    a.className = 'ra-arb' + (arb && !S_.carreaux ? ' vide' : ''); a.innerHTML = arb ? '<img src="assets/icones/arbalete.png?v=' + VERSION_MODELES + '" alt="">Arbalète ' + S_.carreaux + '/' + cap + (S_.carreaux ? '' : ' : vide !') : (nbTours() ? 'Tes tours sont prêtes' : 'Pas d\'arbalète ni de tour : à toi de jouer');
    $('ra-recharger').hidden = plein || S_.fleches <= 0; }
  R.marques.children.forEach((m, k) => { m.material.opacity = (k % 2 ? 0.8 : 0.5) * (0.5 + 0.5 * Math.abs(Math.sin(Date.now() / 300))); }); /* la case, puis sa bande cote vide */
}
function lancerRaid() {
  if (raidAnnonce && !personnagesVsaPrets()) { /* ses voleurs ne sont toujours pas charges : 10 s de plus pendant qu'on les recharge (une fois), sinon la simu s'annule */
    const R0 = raidAnnonce; if (!R0.reessai) { R0.reessai = true; R0.fin = Date.now() + 10 * SEC; chargerPersonnagesVsa(); toast('Les voleurs de VSA arrivent dans quelques secondes.'); return; }
    raidAnnonce = null; S_.simuDue = false; jeter(R0.marques); $('raid-annonce').hidden = true; $('raid-annonce').innerHTML = ''; retirerOmeho();
    toast('La simu VSA est annulée : ses voleurs n\'ont pas pu se charger (connexion ?). Recharge la page si ça se répète.', 'alerte'); return;
  }
  const R = raidAnnonce; raidAnnonce = null; if (R) jeter(R.marques); $('raid-annonce').hidden = true; $('raid-annonce').innerHTML = '';
  if (!R || combat || enAccueil || !paysanMesh) { retirerOmeho(); return; } son('vague');
  const file = []; for (let k = 0; k < (R.dem || 0); k++) file.push('demenageur'); for (let k = 0; k < (R.para || 0); k++) file.push('parachutiste'); /* (les parachutistes tot : ils mettent quelques secondes a descendre) */ for (let k = 0; k < R.nb - R.montes; k++) file.push('voleurRaid'); for (let k = 0; k < R.montes; k++) file.push('monture'); /* (le Demenageur d'abord : il est lent) */
  nouveauCombat('raid', { raid: true, file, total: file.length, attente: 0.3, butin: [], tues: 0, bords: null, entrees: (R.entrees || []).slice(), sortie: R.sortie || null }); /* (un par seconde, chacun par sa case rouge : 23-fin-combat.js et apparaitre) */ /* (ses stats comme tout combat : sorts, degats, coups recus, affichees sous son bilan, 16/10/2026) */
  fermerModale(); ouvrirHudCombat();
  toast('Simu VSA ! Ils foncent sur ta grange : abats-les avant qu\'ils rejoignent Omeho, sur la case violette.', 'alerte'); majCombatHud();
}
/* un voleur du raid : il va a la grange, prend sa part, et repart par ou il est venu */
function volerRaid(mult) {
  const stocks = VENDABLES.filter((v) => (S_.grange[v.id] || 0) > 0).sort((a, b) => S_.grange[b.id] * prix(b.id) - S_.grange[a.id] * prix(a.id));
  if (!stocks.length) return null;
  const v = stocks[0], f = forceVoleur(), st = S_.grange[v.id], nb = Math.min(st, Math.max(1, Math.round(Math.min(st * 0.15, 3 + f) * mult * (niv('cadenas') ? 0.5 : 1) * (enRuine('grange') ? 2 : 1)))); /* chacun prend une part du stock, pas tout */
  S_.grange[v.id] -= nb; rendreGrange(); return { n: nb, nom: v.nom, id: v.id };
}
function cibleGrange(mo) {
  if (mo.cg) return mo.cg;
  const G = S_.cases.filter((c) => c.type === 'grange'), autour = [...new Set(G.flatMap((g) => voisins(g)))].filter((c) => c.type !== 'grange'), libres = autour.filter((c) => PASSABLE[c.type]);
  const loin = (c) => Math.hypot(posCase(c).x - mo.x, posCase(c).z - mo.z), c = (libres.length ? libres : autour).sort((a, b) => loin(a) - loin(b))[0];
  return (mo.cg = posCase(c || G[0] || S_.cases[0]));
}
function majVoleurRaid(mo, dt, s) {
  const m = mo.m, lent = mo.lent > 0; if (lent) mo.lent -= dt; if (mo.coince > 0) mo.coince -= dt; /* (la Gueule de fer de Masdog : coince, il ne bouge plus) */
  const but = mo.fuite ? mo.sortie : cibleGrange(mo), d = Math.hypot(but.x - mo.x, but.z - mo.z); let v = 0;
  if (d > (mo.fuite ? 0.35 : 0.8)) {
    const w = prochainPas(mo, but.x, but.z, dt), dx = w.x - mo.x, dz = w.z - mo.z, L = Math.hypot(dx, dz) || 1;
    v = mo.d.vitesse * (mo.coince > 0 ? 0 : lent ? 0.4 : 1) * (mo.fuite ? (mo.porte ? 0.75 : 1.2) : 1) * (classeDe() === 'iop' ? 0.8 : 1); /* (05/11/2026 : -20 % pour le Iop, au corps a corps il devait courir apres tout le monde) */ /* charge de butin, il repart moins vite */ const pas = Math.min(L, v * dt); mo.x += dx / L * pas; mo.z += dz / L * pas; tourner(mo, Math.atan2(dx, dz), dt);
  } else if (!mo.fuite) {
    const r = volerRaid(mo.d.vole); mo.fuite = true; mo.cg = null;
    if (r) { mo.porte = r; if (mo.type !== 'demenageur') m.add(sacVole()); toast((mo.type === 'demenageur' ? 'Le Déménageur de VSA' : 'Un voleur de VSA') + ' a pris ' + r.n + ' ' + r.nom + ' : abats-le avant qu\'il rejoigne Omeho !', 'alerte'); } /* (le Demenageur a deja son gros sac) */
  } else { /* il a file avec son butin */
    mo.etat = 'mort'; mo.t = 0; mo.barre.remove(); if (combat.cible === mo) combat.cible = null; if (omeho) { omeho.saut = 1; pouf(mo.x, mo.m.position.y, mo.z, 1.2); if (mo.porte) direOmeho('butin'); }
    if (mo.porte) { combat.butin.push(mo.porte); toast('Un voleur de VSA a rejoint Omeho avec ' + mo.porte.n + ' ' + mo.porte.nom + '.', 'alerte'); mo.porte = null; } return;
  }
  mo.pas += v * dt * 5; const y = hauteurSol(mo.x, mo.z, caseIci(mo.x, mo.z));
  m.position.set(mo.x, y + (1 - Math.cos(mo.pas * 2)) * (mo.type === 'monture' ? 0.08 : 0.03), mo.z); m.rotation.y = mo.ry; m.rotation.z = Math.sin(mo.pas) * 0.06; m.rotation.x = mo.type === 'monture' ? 0 : 0.2;
  if (mo.brule > 0) { mo.brule -= dt; mo.bruleT = (mo.bruleT || 0) + dt; if (mo.bruleT >= 0.5) { mo.bruleT = 0; blesser(mo, mo.bruleDeg); } }
  if (mo.coup > 0) { mo.coup -= dt; m.scale.setScalar((mo.echelle || 1) * (1 + Math.max(0, mo.coup) * 0.9)); } else m.scale.setScalar(mo.echelle || 1);
}
