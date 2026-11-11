'use strict';
/* ---------- LA CABANE DU PECHEUR (11/11/2026) ----------
   « une cabane du pecheur qu'on debloque en meme temps que le terrain niveau 105, sur les emplacements que je t'ai designes, avec une petite terrasse qui deborde un
   peu sur l'eau », puis, sur le design 3 (maquettes/cabane-pecheur) : « il faudrait que l'on puisse monter sur le porche et qu'on puisse rentrer dans la cabane, comme
   on fait dans le casino, et a l'interieur un atelier de pecheur + nos cannes a peche exposees, a prendre et a reposer », et « pareil, mets pas le ciel en fond, mais
   fond noir comme au casino » (Mathieu).
   - Le modele : blender/cabane-pecheur.py (l'exterieur, la piece, les quatre cannes), charge au premier besoin (assurerCabane).
   - Sur la ferme : elle vient avec le terrain T9. Ses deux cases du nord sont la maison (type 'cabane', on ne passe pas), ses deux cases du sud la terrasse (type
     'ponton', on y marche, a 0,38 de haut : hauteurSol) ; la terrasse deborde d'une demi-case sur la mare, on y avance en la touchant.
   - Dedans : une piece a part, posee loin de la ferme derriere le voile (lieu = 'cabane'), comme le hall du palais. On y marche librement (majCabane), on touche le
     ratelier pour prendre ou reposer une canne, l'etabli pour l'atelier du pecheur, la porte pour sortir.
   - La canne prise se voit dans la main droite du perso, a la ferme aussi (tenirCanne) ; pas pendant un combat.
   Rien n'est encore peche : la peche elle-meme et ce qu'on fait des poissons restent a faire (IDEES-APRES-100.md). */
const CABANE_T = 9, CABANE_MAISON = [[14, 5], [15, 5]], CABANE_PONTON = [[14, 6], [15, 6]];
const CABANE_X = (14.5 - (COLS - 1) / 2) * S, CABANE_Z = (5.5 - (ROWS - 1) / 2) * S; /* le centre de ses 2 x 2 cases (x 22, z 7) */
const PONTON_Y = 0.38, PORTE_CABANE = [-0.55, 0.85]; /* le dessus de la terrasse ; ou l'on se tient devant la porte (dans le repere de la cabane) */
const CABANE_DEDANS = new T.Vector3(300, 0, -300); /* la piece, loin de tout (rien derriere elle dans l'axe de la camera) */
const CANNES = [null, { nom: 'Canne de bambou', desc: 'Cinq brins de bambou, une poignée de liège, un bouchon rouge et blanc.' }, { nom: 'Longue perche', desc: 'Un seul bambou très long, pour aller chercher le poisson au milieu de la mare.' },
  { nom: 'Canne vernie', desc: 'Bois verni, moulinet de laiton, anneaux dorés.' }, { nom: 'Canne de mer', desc: 'Bois sombre et gros moulinet d\'acier : pour les grosses prises.' }];
let pontonActif = false, cabaneCharge = null, cabaneSalle = null, cabaneMarche = null, cabaneAvant = null, cannesRatelier = [];
const cabaneLa = () => !!S_ && !!S_.terrains && !!S_.terrains[TERRAINS[CABANE_T].id];
const etatPeche = () => S_.peche || (S_.peche = { cannes: [1], main: 0 });
const cannesEues = () => (typeof MODE_TEST !== 'undefined' && MODE_TEST ? [1, 2, 3, 4] : etatPeche().cannes); /* (le mode test : les quatre, pour les voir) */
/* ses cases : posees a l'achat du terrain et au chargement (une case deja occupee reste comme elle est) */
function poserCasesCabane() {
  if (!cabaneLa()) return false; invaliderIndex(); let change = false;
  [[CABANE_MAISON, 'cabane'], [CABANE_PONTON, 'ponton']].forEach(([L, ty]) => L.forEach(([i, j]) => { const c = caseAt(i, j); if (c && c.type === 'libre' && !(S_.sauvage && S_.sauvage.id === c.id)) { c.type = ty; change = true; } }));
  return change;
}
/* la hauteur de la terrasse sous (x, z) : 0,38 sur les planches, une marche de chaque cote */
const hauteurPonton = (x, z) => { if (!pontonActif) return 0; const lx = Math.abs(x - CABANE_X), lz = z - CABANE_Z; return lz > 0.1 && lz < 3.05 && lx < 2.05 ? PONTON_Y * Math.max(0, Math.min(1, (2.0 - lx) / 0.3)) : 0; };
function assurerCabane() { /* le modele, au premier besoin */
  if (MODELES.cabanePecheur) return Promise.resolve(); if (cabaneCharge) return cabaneCharge;
  if (performance.now() < (assurerCabane.pause || 0)) return Promise.reject(new Error('cabane : nouvel essai plus tard')); /* (un chargement rate : on ne redemande pas le modele a chaque image, tenirCanne) */
  cabaneCharge = chargerGlb('assets/modeles/jeu/cabane-pecheur.glb?v=' + VERSION_MODELES).then((G) => {
    versToon(G, { normales: 0.012, sansContour: SC_BATI });
    const brut = (...noms) => { const env = new T.Group(); noms.forEach((nom) => { const n = G.getObjectByName(nom); if (!n) return; const g = n.clone(true); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.scale.set(1, 1, 1); env.add(g); }); return fusionner(env); }; /* (sans recalage : ses pilotis descendent sous le sol) */
    MODELES.cabanePecheur = brut('CabanePecheur', 'CabaneLigne'); MODELES.cabaneInterieur = brut('CabaneInterieur'); [1, 2, 3, 4].forEach((k) => { MODELES['canne' + k] = brut('Canne' + k); });
    if (S_ && lieu === 'ferme') construireBatiments();
  }).catch((e) => { cabaneCharge = null; assurerCabane.pause = performance.now() + 30000; throw e; });
  return cabaneCharge;
}
function poserCabane(pose) { /* appelee par construireBatiments (11-ferme-3d.js) */
  const c0 = caseAt(CABANE_MAISON[0][0], CABANE_MAISON[0][1]); pontonActif = !!c0 && c0.type === 'cabane'; if (!pontonActif) return;
  if (!MODELES.cabanePecheur) { assurerCabane().catch(() => {}); return; }
  pose('cabanePecheur', CABANE_X, 0, CABANE_Z, c0.id, 0).traverse((o) => { o.userData.cabane = true; });
}
/* un clic sur la cabane, dehors : la terrasse, on y marche (jusqu'au bout, au-dessus de l'eau) ; la maison, on va a la porte, et on entre si le clic agit */
function clicCabaneDehors(pt, agir) {
  const lx = pt.x - CABANE_X, lz = pt.z - CABANE_Z;
  if (pt.y < 0.8 && lz > 0.35) {
    const c = caseAt(lx < 0 ? 14 : 15, 6); if (!c) return;
    const x = CABANE_X + Math.max(-1.4, Math.min(1.4, lx)), z = CABANE_Z + Math.max(0.8, Math.min(2.65, lz)), zc = Math.min(z, CABANE_Z + 1.6);
    pointVise = { c: c.id, x, z: zc }; allerPuis(c, () => { if (z > zc + 0.05 && lieu === 'ferme' && !combat) { chemin = [{ c, x, z }]; arrivee = null; } }); pointVise = null; return; /* (le bout de la terrasse deborde de sa case : il fait les derniers pas tout droit) */
  }
  allerPorteCabane(agir);
}
function allerPorteCabane(entrer) {
  const c = caseAt(14, 6); if (!c || combat || lieu !== 'ferme') return;
  pointVise = { c: c.id, x: CABANE_X + PORTE_CABANE[0], z: CABANE_Z + PORTE_CABANE[1] };
  allerPuis(c, () => { paysanMesh.userData.angle = Math.PI; if (entrer) entrerCabane(); else if (performance.now() - (allerPorteCabane.t || 0) > 6000) { allerPorteCabane.t = performance.now(); toast((matchMedia('(pointer: coarse)').matches ? 'Touche la cabane' : 'Clic droit sur la cabane') + ' pour entrer.'); } });
  pointVise = null;
}
/* ---------- la piece ---------- (coordonnees dans la piece : x de -3,2 a 3,2, z de -2,6 a 2,6, la porte au sud) */
const RATELIER_X = (k) => -1.6 + (k - 1) * 0.8;
const OBST_CABANE = [[-3.2, -2.15, -1.9, 1.05], [-2.2, -1.55, -0.95, -0.25], [-2.15, 1.3, -2.6, -1.95], [1.6, 3.2, -2.6, -1.45], [1.1, 1.75, -2.6, -1.8], [-3.2, -2.1, 1.5, 2.6], [-2.15, -1.25, 1.75, 2.6]]; /* l'etabli, le tabouret, le ratelier, le foyer, les buches, le tonneau, la caisse */
const libreCabane = (x, z, m = 0.3) => x > -3.2 + m && x < 3.2 - m && z > -2.6 + m && (z < 2.6 - m || (Math.abs(x) < 0.5 && z < 2.3)) && !OBST_CABANE.some(([x0, x1, z0, z1]) => x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m);
function construireSalleCabane() {
  const g = new T.Group(); g.position.copy(CABANE_DEDANS); g.add(cloner('cabaneInterieur'));
  cannesRatelier = [1, 2, 3, 4].map((k) => { const c = cloner('canne' + k); c.position.set(RATELIER_X(k), 0.235, -2.3); c.rotation.x = -0.06; c.traverse((o) => { o.userData.canne = k; }); g.add(c); return c; });
  g.visible = false; scene.add(g); cabaneSalle = g; majRatelier();
}
function majRatelier() { const E = cannesEues(), main = etatPeche().main; cannesRatelier.forEach((c, i) => { c.visible = E.includes(i + 1) && main !== i + 1; }); }
function barreCabane(on) {
  let b = $('cabane-sortir');
  if (!b) { b = document.createElement('button'); b.id = 'cabane-sortir'; b.className = 'btn'; b.textContent = 'Sortir de la cabane'; b.addEventListener('click', () => { if (lieu === 'cabane') allerCabane(0, 1.9, 0, 3, sortirCabane); }); document.body.appendChild(b); }
  b.hidden = !on; $('hud').classList.toggle('en-cabane', on);
}
async function entrerCabane() {
  if (combat || lieu !== 'ferme' || entrerCabane.enCours) return; entrerCabane.enCours = true;
  $('voile').classList.add('on'); fermerModale(); chemin = []; arrivee = null; fileActions.length = 0;
  try { await Promise.all([assurerCabane(), attendreMs(600)]); } catch (e) { /* (le modele n'a pas pu se charger) */ }
  entrerCabane.enCours = false;
  if (!MODELES.cabaneInterieur || combat || lieu !== 'ferme') { $('voile').classList.remove('on'); if (!MODELES.cabaneInterieur) toast('La porte est coincée (chargement de la cabane), réessaie.', 'alerte'); return; }
  if (!cabaneSalle) construireSalleCabane();
  lieu = 'cabane'; cabaneMarche = null; montrerIles(); majRatelier(); barreCabane(true);
  const u = paysanMesh.userData, O = CABANE_DEDANS; paysanMesh.position.set(O.x, O.y, O.z + 1.9); u.y = O.y; u.angle = Math.PI; paysanMesh.rotation.y = u.angle;
  cabaneAvant = { angle: angleCam, zoom }; angleCam = ANGLE_DEPART; /* (la piece se regarde du sud-est : ses murs hauts sont au nord et a l'ouest) */
  zoom = innerWidth < innerHeight ? 1.1 : 1.9; cadrer(); VISEE.set(O.x + 0.2, 0.6, O.z + 0.1); placerCamera(); soleilVers(O);
  Object.assign(soleil.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, far: 100 }); soleil.shadow.camera.updateProjectionMatrix(); suivreOmbres.r = null; rendu.shadowMap.needsUpdate = true;
  setTimeout(() => $('voile').classList.remove('on'), 120);
  toast('La cabane du pêcheur. Touche le râtelier pour prendre ou reposer une canne, l\'établi pour l\'atelier, la porte pour sortir.', 'or');
}
async function sortirCabane() {
  if (lieu !== 'cabane') return;
  $('voile').classList.add('on'); fermerModale(); await attendreMs(500);
  lieu = 'ferme'; cabaneMarche = null; montrerIles(); barreCabane(false);
  const u = paysanMesh.userData, c = caseAt(14, 6), x = CABANE_X + PORTE_CABANE[0], z = CABANE_Z + PORTE_CABANE[1];
  if (c) u.cellule = c; u.y = hauteurPonton(x, z); paysanMesh.position.set(x, u.y, z); u.angle = 0; paysanMesh.rotation.y = 0; chemin = []; arrivee = null;
  if (cabaneAvant) { angleCam = cabaneAvant.angle; zoom = cabaneAvant.zoom; cabaneAvant = null; }
  cadrer(); VISEE.set(x, 0.6, z + 1); placerCamera(); soleilVers(new T.Vector3(0, 0, 0)); suivreOmbres.r = null; rendu.shadowMap.needsUpdate = true;
  setTimeout(() => $('voile').classList.remove('on'), 120); sauver();
}
/* marcher dans la piece : tout droit si rien ne gene, sinon par le milieu ; un point pris par un meuble est ramene vers le milieu */
function allerCabane(x, z, lx, lz, fn) {
  const O = CABANE_DEDANS, px = paysanMesh.position.x - O.x, pz = paysanMesh.position.z - O.z, M = [0.4, 0.3];
  for (let k = 0; k < 30 && !libreCabane(x, z); k++) { x += (M[0] - x) * 0.1; z += (M[1] - z) * 0.1; }
  const droit = (a, b) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.15); for (let s = 1; s < n; s++) { const t = s / n; if (!libreCabane(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0.22)) return false; } return true; };
  cabaneMarche = { pts: droit([px, pz], [x, z]) ? [[x, z]] : [M, [x, z]], i: 0, vers: lx != null ? [lx, lz] : null, fn };
}
function majCabane(dt) {
  const u = paysanMesh.userData, P = paysanMesh.position, O = CABANE_DEDANS; tenirCanne();
  if (u.angle !== undefined) { let d = u.angle - paysanMesh.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); paysanMesh.rotation.y += d * Math.min(1, dt * 10); }
  if (!cabaneMarche) { animerPas(u, dt, 0); P.y += (O.y - P.y) * Math.min(1, dt * 12); return; }
  const m = cabaneMarche, q = m.pts[m.i], tx = O.x + q[0], tz = O.z + q[1], dx = tx - P.x, dz = tz - P.z, d = Math.hypot(dx, dz), v = vitesse() * 0.8 * dt;
  if (d > 0.001) u.angle = Math.atan2(dx, dz);
  if (d <= v) { P.x = tx; P.z = tz; m.i++; if (m.i < m.pts.length) return; cabaneMarche = null; if (m.vers) u.angle = Math.atan2(O.x + m.vers[0] - tx, O.z + m.vers[1] - tz); if (m.fn) m.fn(); return; }
  P.x += dx / d * v; P.z += dz / d * v; u.pas = (u.pas || 0) + v * 4.6; animerPas(u, dt, 1);
  P.y = O.y + (1 - Math.cos(u.pas * 2)) * 0.012 * (u.ampl || 0);
}
function zoneCabane(x, z, y) { /* ce qu'on touche dans la piece */
  if (z > 2.0 && Math.abs(x) < 0.95) return 'porte';
  if (z < -1.7 && x > -2.15 && x < 1.3) return 'ratelier';
  if (x < -2.9 && z > 1.3 && y > 1.3) return 'trophee';
  if (x < -2.0 && z > -1.95 && z < 1.1) return 'etabli';
  if (x > 1.55 && z < -1.3) return 'foyer';
  if (x < -1.2 && z > 1.45) return 'tonneau';
  return null;
}
function clicCabane(hits) {
  for (const h of hits) {
    let o = h.object, perso = false, dans = false, canne = 0; while (o) { if (o === paysanMesh) perso = true; if (o === cabaneSalle) dans = true; if (o.userData && o.userData.canne && !canne) canne = o.userData.canne; o = o.parent; }
    if (perso || !dans) continue;
    const O = CABANE_DEDANS, lx = h.point.x - O.x, lz = h.point.z - O.z, ly = h.point.y - O.y, j = canne ? 'ratelier' : zoneCabane(lx, lz, ly);
    if (j === 'ratelier') { const k = canne || Math.max(1, Math.min(4, Math.round((lx + 1.6) / 0.8) + 1)); allerCabane(RATELIER_X(k), -1.45, RATELIER_X(k), -2.6, () => toucherRatelier(k)); return; }
    if (j === 'porte') { allerCabane(0, 1.9, 0, 3, sortirCabane); return; }
    if (j === 'etabli') { allerCabane(-1.6, 0.4, -3, 0.4, ouvrirEtabliPecheur); return; }
    if (j === 'foyer') { allerCabane(1.9, -0.75, 2.4, -2.1, () => toast('Le feu crépite. De quoi fumer le poisson, un jour.')); return; }
    if (j === 'tonneau') { allerCabane(-1.75, 1.25, -2.6, 2.0, () => toast('Le tonneau à poissons : tes prises iront ici.')); return; }
    if (j === 'trophee') { allerCabane(-2.4, 1.2, -3.2, 1.9, () => toast('Une belle prise, clouée au mur. Le pêcheur d\'avant devait être fier.')); return; }
    allerCabane(lx, lz, null, null, null); return;
  }
}
/* le ratelier : toucher une canne la prend (celle qu'on tenait retourne a sa place) ; toucher une place vide, ou sa propre place, repose la canne tenue */
function toucherRatelier(k) {
  const P = etatPeche(), E = cannesEues();
  if (P.main && (P.main === k || !E.includes(k))) { const nom = CANNES[P.main].nom; P.main = 0; majRatelier(); tenirCanne(); son('poser'); toast(nom + ' reposée sur le râtelier.'); sauver(); return; }
  if (!E.includes(k)) { toast('Une place libre : cette canne (' + CANNES[k].nom + '), tu ne l\'as pas encore.'); return; }
  P.main = k; majRatelier(); tenirCanne(); son('poser'); toast(CANNES[k].nom + ' en main. ' + CANNES[k].desc, 'or'); sauver();
}
function ouvrirEtabliPecheur() {
  const P = etatPeche(), E = cannesEues();
  ouvrirModale('pecheur', entete('L\'atelier du pêcheur') + '<p class="hdv-aide">Tes cannes sont exposées sur le râtelier, au mur du fond : touche-en une pour la prendre, touche sa place pour la reposer. La pêche dans la mare arrive bientôt.</p>' +
    [1, 2, 3, 4].map((k) => '<div class="art" style="grid-template-columns:minmax(0,1fr) auto"><div><b>' + CANNES[k].nom + '</b><div class="desc">' + CANNES[k].desc + '</div></div><div class="act"><span class="puce' + (P.main === k ? ' or' : E.includes(k) ? ' bonne' : '') + '">' + (P.main === k ? 'dans ta main' : E.includes(k) ? 'sur le râtelier' : 'pas encore à toi') + '</span></div></div>').join(''));
}
/* LA CANNE EN MAIN : celle qu'on a prise au ratelier, dans la main droite, tenue droite comme un baton (le bras ne se balance plus) ; rangee pendant un combat */
const BRAS_CANNE = -0.32, TAILLE_CANNE = 0.82, GROS_CANNE = 1.5; /* (en main, elle fait a peu pres la taille du perso, et son bois est epaissi pour se lire de loin) */
const mainCanne = (b) => { b.updateWorldMatrix(true, true); const P = []; b.traverse((o) => { if (o.isMesh && /^(paume|doigts|main)$/.test(nomP(o))) P.push(o); }); return P.length ? b.worldToLocal(unionDe(P).getCenter(new T.Vector3())) : new T.Vector3(0, -0.5, 0); }; /* (le poing, dans le repere du bras) */
function tenirCanne() {
  if (!paysanMesh || !S_) return; const u = paysanMesh.userData, k = !combat && S_.peche ? S_.peche.main || 0 : 0;
  if ((u.canneMain || 0) === k && (!k || (u.canneObj && u.canneObj.parent))) return;
  if (u.canneObj && u.canneObj.parent) u.canneObj.parent.remove(u.canneObj); u.canneObj = null; u.canneMain = k; if (!k) return;
  if (!MODELES['canne' + k]) { u.canneMain = 0; assurerCabane().catch(() => {}); return; }
  const bras = (u.membres || [])[3]; if (!bras) return;
  const c = cloner('canne' + k), e = bras.getWorldScale(new T.Vector3()), s = TAILLE_CANNE / (e.y || 1), main = mainCanne(bras);
  c.traverse((o) => { o.raycast = () => {}; if (o.isMesh) o.castShadow = false; });
  c.scale.set(s * GROS_CANNE, s, s * GROS_CANNE); c.rotation.set(-BRAS_CANNE + 0.1, 0, 0); c.position.set(main.x, main.y - 0.2 * s, main.z + 0.03); /* (la poignee dans le poing ; le bras est leve de BRAS_CANNE, la canne reste presque droite) */
  bras.add(c); u.canneObj = c;
}
