'use strict';
/* ---------- L'EASTER EGG DU MILLION (10/11/2026, « si quelqu'un arrive a faire 1 million de gain au total depuis le debut de sa partie, il obtient une cle
   donnee par l'un des gardes ; le garde donne pas trop d'info et il faut chercher ; avec la cle, un passage s'ouvre derriere le tableau du 1er createur du
   casino, on peut jouer une partie de poker contre le boss du casino ; si on gagne, un anneau legendaire, la bague du joueur pro, des stats de fou en
   prospection ; si on perd, il donne rendez-vous dans une semaine, et en attendant on ne peut plus rejoindre la piece secrete, le bureau du patron », Mathieu)
   - Le million : tout ce que les jeux t'ont rendu depuis le debut (S_.stats.casinoGains, « gagné en tout » dans ton bilan).
   - Filou t'appelle depuis la porte du hall, te glisse la cle et une enigme (« le premier de la famille sait ou »).
   - La serrure est sous le portrait de Dore Ier : le pan de mur pivote vers l'arriere (blender/casino.py, passage_secret), un couloir descend.
   - Le bureau est une salle a part, comme le hall (blender/casino.py --bureau) ; le patron : Dore III, dit l'Ombre.
   - Le poker : cinq cartes, un echange, dix jetons chacun, une mise d'entree d'un jeton ; le premier a sec perd, sinon le plus riche apres 12 mains.
   L'etat est dans S_.casino.patron : cle (date), porte (ouvertures), parties, perdues, enCours (une partie commencee), rdv (date), gagne (date). ---------- */
const MILLION = 1000000, SEMAINE = 7 * 24 * 3600 * 1000, MAINS_POKER = 12, JETONS_POKER = 10;
const PORTE_FONDATEUR = { xa: -5.45, xb: -3.35, xm: -4.4, ouvert: 1.45 }; /* (blender/casino.py, PORTE_SECRETE ; ouvert : l'angle du pan de mur, vers le couloir) */
const BUREAU_CASINO = new T.Vector3(-720, 0, 480); /* (loin du hall et des iles, rien derriere dans l'axe de la camera) */
const BUREAU_PLACES = { entree: [-7.2, 2.7, -6.2, 2.7], table: [0, 2.2, 0, 0.6] };
let bureauCasino = null, casinoBureau = false, patronB = null, feuB = null, poissonsB = null, porteFondateur = null, porteAnim = null, lumieresSalvees = null, appelFait = false;
const fumeeB = [];
function etatPatron() { const c = etatCasino(); c.patron = c.patron || {}; return c.patron; }
const millionFait = () => ((S_.stats || {}).casinoGains || 0) >= MILLION;
const cleAttendue = () => millionFait() && !etatPatron().cle;
const quandRdv = (t) => { const d = new Date(t); return 'le ' + d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) + ' à ' + d.getHours() + ' h ' + String(d.getMinutes()).padStart(2, '0'); };
function partieInterrompue() { /* une partie commencee puis quittee (page fermee) : pour le patron, c'est perdu */
  const P = etatPatron(); if (!P.enCours || (poker && !poker.fini)) return false;
  P.rdv = P.enCours + SEMAINE; P.enCours = 0; P.perdues = (P.perdues || 0) + 1; sauver(); return true;
}

/* ---------- Filou et la cle ---------- */
function appelFilou() {
  if (appelFait || !cleAttendue() || lieu !== 'casino' || !casinoDedans || casinoBureau) return; const f = gardesSalle.find((m) => m.userData.garde === 'filou'); if (!f) return;
  appelFait = true; f.userData.regard = performance.now() + 7000; direSalle(f, hasard(['Psst. Toi.', 'Hé. Toi. Viens par là.', 'Approche. Discrètement.']), 4200);
  if (modaleOuverte) toast('Filou, depuis la porte : « Psst. Toi. Approche. »');
}
function parlerGardePatron(m) { /* ce que les gardes disent du patron ; true : la replique est donnee (et ne compte pas pour les agacer) */
  const n = m.userData.garde, P = etatPatron(), t = performance.now();
  if (cleAttendue()) {
    if (n === 'bouboule') { m.userData.regard = t + 3000; direSalle(m, 'C\'est Filou qui veut te voir. Pas moi.', 2600); return true; }
    donnerCle(m); return true;
  }
  if (n !== 'filou' || !P.cle) return false;
  if (Math.random() < 0.5) return false; /* (une fois sur deux, il redevient glacial comme d'habitude) */
  m.userData.regard = t + 4000; m.userData.penche = t;
  const L = P.gagne ? ['Joueur pro. Respect.', 'Le patron boude depuis. Merci, hein.', 'Il paraît que t\'as sa bague. Fais gaffe à toi.']
    : P.rdv && Date.now() < P.rdv ? ['Le patron t\'a donné rendez-vous. Sois à l\'heure.', 'Il t\'a plumé, hein ? Il plume tout le monde.', 'Une semaine. Il compte les jours, lui aussi.']
      : P.porte ? ['Il t\'attend. Il déteste attendre.', 'Garde ta clé sur toi. Toujours.']
        : ['On s\'est jamais parlé.', 'Quelle clé ?', 'Le premier. Pas le deuxième, pas le troisième.', 'Les vieux gardent toujours quelque chose derrière eux.', 'Moins fort. Le patron a des oreilles partout.'];
  direSalle(m, autreLigne(L, m.userData.parole.dit), 3000); return true;
}
function donnerCle(m) {
  const P = etatPatron(); P.cle = Date.now(); compter('clePatron'); sauver(); son('quete');
  m.userData.regard = performance.now() + 6000; m.userData.penche = performance.now(); direSalle(m, 'Tiens. T\'as rien vu.', 3200);
  ouvrirModale('cle', entete('Filou') + '<div class="art">' + ico('cadenas') + '<div><b>« Un million. Le patron a entendu parler de toi. »</b><div class="desc">Filou jette un œil à Bouboule, puis à la salle. Sans te regarder, il te glisse quelque chose dans la main : une petite clé dorée, encore tiède, la tête en forme de kama.</div></div><div></div></div>' +
    '<div class="art">' + ico('kama') + '<div><b>« Il aime les gens qui gagnent. Il aime encore plus les faire perdre. »</b><div class="desc">« Il reçoit pas ici. Le premier de la famille sait où. Et on s\'est jamais parlé. »</div></div><div></div></div>' +
    '<button class="btn kamas grand" data-fermer style="width:100%">Ranger la clé</button>');
  toast('Tu as reçu une petite clé dorée.', 'or');
}

/* ---------- le portrait du fondateur : la serrure, le pan de mur qui pivote ---------- */
const porteTouchee = (x, z, y) => x > PORTE_FONDATEUR.xa - 0.1 && x < PORTE_FONDATEUR.xb + 0.1 && z < -9.2 && y > 0.25;
function allerFondateur() { aller(PORTE_FONDATEUR.xm, -9.0, PORTE_FONDATEUR.xm, -10, toucherFondateur); }
function toucherFondateur() {
  const P = etatPatron(), txt = 'Doré Ier, le fondateur : un chat de gouttière qui gagna l\'île en un seul lancer de dés.';
  if (!P.cle) { toast(txt); return; }
  const titre = entete('Doré Ier, le fondateur');
  if (partieInterrompue()) { ouvrirModale('fondateur', titre + '<div class="art">' + ico('cadenas') + '<div><b>La clé refuse de tourner.</b><div class="desc">Tu as quitté la table du patron en pleine partie : pour Doré III, tu as perdu. Il t\'attend ' + quandRdv(P.rdv) + '.</div></div><div></div></div>'); return; }
  if (P.rdv && Date.now() < P.rdv) { ouvrirModale('fondateur', titre + '<div class="art">' + ico('cadenas') + '<div><b>La clé refuse de tourner.</b><div class="desc">Doré III t\'a donné rendez-vous ' + quandRdv(P.rdv) + '. D\'ici là, le passage reste fermé.</div></div><div></div></div>'); return; }
  ouvrirModale('fondateur', titre + '<div class="art">' + ico('cadenas') + '<div><b>' + (P.porte ? 'Le passage du patron.' : 'La clé chauffe dans ta poche.') + '</b><div class="desc">' +
    (P.porte ? 'La petite serrure en forme de kama, sous le portrait. Derrière le mur, le bureau de Doré III.' : 'Sous le portrait, dans la moulure du mur, une minuscule serrure en forme de kama. La clé de Filou a exactement la même forme.') +
    '</div></div><div></div></div><button class="btn kamas grand" data-cas="patron:ouvrir" style="width:100%">Tourner la clé</button>');
}
function ouvrirPassage() {
  const P = etatPatron(); if (!P.cle || (P.rdv && Date.now() < P.rdv)) return; fermerModale();
  if (!P.porte) { son('quete'); toast('Un déclic. Le mur pivote dans un grondement de pierre...', 'or'); }
  P.porte = (P.porte || 0) + 1; sauver(); const xm = PORTE_FONDATEUR.xm;
  bougerPorte(1, () => setTimeout(() => { if (lieu === 'casino' && casinoDedans && !casinoBureau) casinoMarche = { pts: [[xm, -9.4], [xm, -11.2]], i: 0, vers: null, fn: entrerBureau, O: SALLE_CASINO }; }, 600)); /* (un temps pour voir le couloir et sa torche, puis on y entre) */
}
function bougerPorte(sens, fn) { /* sens 1 : il s'ouvre (1,4 s) ; 0 : il se referme */
  if (!porteFondateur) { if (fn) fn(); return; } const a0 = porteFondateur.rotation.y - porteFondateur.userData.r0.y;
  porteAnim = { t: 0, de: a0, a: sens ? PORTE_FONDATEUR.ouvert : 0, d: 1.4, fn };
}
function animerPorte(dt) {
  const A = porteAnim; if (!A || !porteFondateur) return; A.t += dt; const k = Math.min(1, A.t / A.d), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  porteFondateur.rotation.y = porteFondateur.userData.r0.y + A.de + (A.a - A.de) * e; porteFondateur.position.y = porteFondateur.userData.p0.y + Math.sin(k * Math.PI * 9) * 0.004 * (1 - k);
  if (k >= 1) { porteAnim = null; rendu.shadowMap.needsUpdate = true; if (A.fn) A.fn(); }
}

/* ---------- le bureau du patron : la salle, ses places, ses chemins ---------- */
const SC_BUREAU = new Set([...SC_CASINO, 'rayure', 'joint_parquet', 'livre_or', 'graduation', 'pupille', 'boucle', 'cigare_bague', 'toile_halo', 'eau_vasque', 'poisson_queue', 'joint_pierre', 'marche_nez', 'serrure']);
async function chargerBureau() {
  if (bureauCasino) return;
  const sc = await chargerGlb('assets/modeles/jeu/casino-bureau.glb?v=' + VERSION_MODELES);
  versToon(sc, { normales: 0.012, souple: SOUPLE_CASINO, sansContour: SC_BUREAU });
  const g = new T.Group(); g.position.copy(BUREAU_CASINO); g.add(sc); g.updateMatrixWorld(true);
  const piv = {}; ['Patron', 'Patron_tete', 'Patron_bras', 'Patron_bague', 'Patron_queue', 'Feu', 'Poissons'].forEach((n) => { const p = sc.getObjectByName(n); if (p) { g.attach(p); piv[n] = p; } });
  fusionner(sc); Object.values(piv).forEach((p) => { fusionner(p); p.userData.r0 = p.rotation.clone(); p.userData.p0 = p.position.clone(); });
  if (piv.Patron_bague && piv.Patron_bras) piv.Patron_bras.attach(piv.Patron_bague); /* (la bague suit la patte) */
  patronB = piv.Patron && piv.Patron_tete && piv.Patron_bras && piv.Patron_queue ? { corps: piv.Patron, tete: piv.Patron_tete, bras: piv.Patron_bras, bague: piv.Patron_bague || null, queue: piv.Patron_queue, geste: 0, fume: 0 } : null;
  if (patronB) patronB.tete.userData.parole = { nom: 'Doré III', genre: 'chat', cle: 'bureau_patron' };
  feuB = piv.Feu || null; poissonsB = piv.Poissons || null;
  const l1 = new T.PointLight('#ffd49a', 1.5, 9.5, 1.3); l1.position.set(0, 2.9, 0.6); g.add(l1); /* (la lumiere chaude au-dessus de la table) */
  const l2 = new T.PointLight('#ff8a3a', 1.1, 6.5, 1.5); l2.position.set(-4.0, 1.0, -4.8); g.add(l2); if (feuB) feuB.userData.lum = l2;
  g.visible = false; scene.add(g); bureauCasino = g; grilleBureau();
}
const OBST_BUREAU = { R: [[7.0, 7.6, 0.0, 1.2], [-1.75, 1.75, -0.45, 1.65], [-0.6, 0.6, -1.5, -0.35], [-5.5, -2.5, -6, -5.1], [2.6, 4.0, -6, -5.2], [5.25, 7.95, -6, -3.55], [-8.5, -7.95, -6, 1.15], [-8.5, -6.8, 1.3, 1.95], [-7.8, -6.95, 4.5, 5.35]],
  C: [[-2.15, -5.4, 0.5], [2.15, -5.4, 0.5], [-1.45, -1.55, 0.3], [1.45, -1.55, 0.3], [7.0, 3.9, 0.7], [-5.6, 4.0, 0.6], [-3.6, 4.8, 0.6], [-4.6, 4.2, 0.4]] };
function libreBureau(x, z, marge) {
  const m = marge == null ? 0.3 : marge;
  if (x < -8.5 + m || x > 8.5 - m || z < -6 + m || z > 6 - m) return false;
  for (const [x0, x1, z0, z1] of OBST_BUREAU.R) if (x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m) return false;
  for (const [cx, cz, r] of OBST_BUREAU.C) if ((x - cx) * (x - cx) + (z - cz) * (z - cz) < (r + m) * (r + m)) return false;
  return true;
}
const GRILLE_BUREAU = { pas: 0.4, min: -9.2, n: 47, libre: null, allee: null };
const grilleBureau = () => grilleDe(GRILLE_BUREAU, libreBureau, null), cheminBureau = (x0, z0, x1, z1) => cheminSur(grilleBureau(), libreBureau, null, x0, z0, x1, z1);
function zoneBureau(x, z) {
  if (x < -7.5 && z > 1.8 && z < 3.6) return 'sortie';
  if ((x > -1.9 && x < 1.9 && z > -0.55 && z < 1.8) || (Math.abs(x) < 0.75 && z > -1.6 && z < -0.3)) return 'table';
  return null;
}
const CURIOSITES_BUREAU = [
  [-4.0, -5.4, 1.5, 'La cheminée de marbre noir. Le feu ne s\'éteint jamais : le patron déteste avoir froid aux moustaches.'],
  [3.3, -5.4, 0.9, 'Le coffre-fort du patron. La molette a douze crans, et personne ne connaît la combinaison. Pas même Filou.'],
  [6.6, -4.4, 1.5, 'Le bureau du patron : un grand livre plein de chiffres, une plume, un petit Chat Doré... et ton nom, souligné deux fois.'],
  [-8.2, -2.4, 3.6, 'Des livres reliés de cuir : « Le hasard n\'existe pas », « Mille façons de lire un tricheur », « Les Bouftous et le poker ».'],
  [-7.4, 4.9, 0.9, 'Un vieux gramophone. Sur le disque : « Tango pour chat seul ».'],
  [7.0, 3.9, 1.0, 'Des poissons rouges dans une vasque d\'or. Le patron est un chat : ils nagent vite.'],
  [-4.6, 4.4, 1.6, 'Deux fauteuils club et une carafe de whisky. C\'est ici que le patron reçoit ceux qui lui doivent de l\'argent.'],
  [7.3, 0.6, 0.8, 'La desserte à liqueurs du patron. Tu n\'as pas été invité à te servir.'],
  [-2.15, -5.4, 0.6, 'Un palmier en pot. Même lui a l\'air de compter les jetons.'], [2.15, -5.4, 0.6, 'Un palmier en pot. Même lui a l\'air de compter les jetons.'],
];
const CURIOSITES_BUREAU_HAUT = [
  [-4.0, -5.9, 1.4, 'Le double six : le lancer qui fit perdre son île au dragon. Dans le noir du tableau, deux yeux rouges te regardent encore.'],
  [0, -5.9, 1.1, 'Doré III, dit l\'Ombre, en peinture au-dessus de Doré III, dit l\'Ombre, en personne. On raconte qu\'il n\'a jamais perdu à la roulette. Au poker non plus.'],
];
function clicBureau(hits) {
  for (const h of hits) {
    let o = h.object, perso = false, dans = false; while (o) { if (o === paysanMesh) perso = true; if (o === bureauCasino) dans = true; o = o.parent; }
    if (perso || !dans) continue;
    const O = BUREAU_CASINO, lx = h.point.x - O.x, lz = h.point.z - O.z, ly = h.point.y - O.y;
    if (ly > 2.2) { const c = curiosite(CURIOSITES_BUREAU_HAUT, lx, lz); if (c) { aller(c[0], -4.6, c[0], -6, () => toast(c[3])); return; } }
    const j = zoneBureau(lx, lz);
    if (j === 'sortie') { const [x, z] = BUREAU_PLACES.entree; aller(x, z, -9, z, quitterBureau); return; }
    if (j === 'table') { const [x, z, vx, vz] = BUREAU_PLACES.table; aller(x, z, vx, vz, ouvrirPoker); return; }
    const cu = curiosite(CURIOSITES_BUREAU, lx, lz); if (cu) { aller(cu[0], cu[1], cu[0], cu[1], () => toast(cu[3])); return; }
    aller(lx, lz, null, null, null); return;
  }
}
function assombrir(on) { /* le bureau est sombre : moins de ciel et de soleil, la lampe de la table et le feu font le reste */
  const hemi = scene.children.find((o) => o.isHemisphereLight);
  if (on && !lumieresSalvees) { lumieresSalvees = [hemi ? hemi.intensity : 0, soleil.intensity, contre.intensity]; if (hemi) hemi.intensity *= 0.6; soleil.intensity *= 0.5; contre.intensity *= 0.4; }
  else if (!on && lumieresSalvees) { if (hemi) hemi.intensity = lumieresSalvees[0]; soleil.intensity = lumieresSalvees[1]; contre.intensity = lumieresSalvees[2]; lumieresSalvees = null; }
}
async function entrerBureau() {
  $('voile').classList.add('on'); await attendreMs(450);
  try { await Promise.all([chargerBureau(), attendreMs(300)]); } catch (e) { $('voile').classList.remove('on'); toast('Le couloir est trop sombre, tu rebrousses chemin. Réessaie.', 'alerte'); revenirAuHall(); return; }
  taireSalle(); casinoBureau = true; casinoMarche = null; porteAnim = null; if (porteFondateur) porteFondateur.rotation.y = porteFondateur.userData.r0.y;
  montrerIles(); majBarreCasino(); assombrir(true);
  const u = paysanMesh.userData, [x, z] = BUREAU_PLACES.entree; paysanMesh.position.set(BUREAU_CASINO.x + x, BUREAU_CASINO.y, BUREAU_CASINO.z + z); u.y = BUREAU_CASINO.y; u.angle = Math.PI / 2; paysanMesh.rotation.y = u.angle;
  angleCam = ANGLE_DEPART; zoom = innerWidth < innerHeight ? 0.72 : 0.98; cadrer(); VISEE.set(BUREAU_CASINO.x + 0.4, 0.6, BUREAU_CASINO.z + 0.5); placerCamera(); soleilVers(BUREAU_CASINO); rendu.shadowMap.needsUpdate = true;
  if (patronB && patronB.bague) patronB.bague.visible = !etatPatron().gagne; /* (il l'a perdue a sa table) */
  setTimeout(() => $('voile').classList.remove('on'), 150); compter('bureauVisites');
  setTimeout(accueilPatron, 900);
}
function accueilPatron() {
  if (!casinoBureau || !patronB) return; const P = etatPatron();
  direPatron(P.gagne ? hasard(['Toi. Tu viens me narguer avec ma propre bague ?', 'Le joueur pro. Un cigare ? Non ? Tant pis.']) : (P.perdues || 0) > 0 ? hasard(['Revoilà mon paysan. Ponctuel. J\'aime ça.', 'Une revanche ? Assieds-toi.']) : 'Ah. Le paysan au million. Assieds-toi.', 4200);
  if (!P.gagne) toast('Touche la table de poker pour t\'asseoir face à Doré III.');
}
function quitterBureau() {
  if (poker && !poker.fini) { ouvrirAbandon(); return; }
  sortirBureau();
}
async function sortirBureau() {
  $('voile').classList.add('on'); fermerModale(); await attendreMs(500); taireBureau();
  casinoBureau = false; casinoMarche = null; montrerIles(); majBarreCasino(); assombrir(false); revenirAuHall();
  setTimeout(() => $('voile').classList.remove('on'), 150);
}
function revenirAuHall() { /* le perso ressort du couloir, le pan de mur se referme derriere lui */
  const u = paysanMesh.userData, xm = PORTE_FONDATEUR.xm; paysanMesh.position.set(SALLE_CASINO.x + xm, SALLE_CASINO.y, SALLE_CASINO.z - 11.0); u.y = SALLE_CASINO.y; u.angle = 0; paysanMesh.rotation.y = 0;
  if (porteFondateur) porteFondateur.rotation.y = porteFondateur.userData.r0.y + PORTE_FONDATEUR.ouvert;
  angleCam = ANGLE_DEPART; zoom = innerWidth < innerHeight ? 0.6 : 0.8; cadrer(); VISEE.set(SALLE_CASINO.x + 0.6, 0.6, SALLE_CASINO.z + 1.0); placerCamera(); soleilVers(SALLE_CASINO); rendu.shadowMap.needsUpdate = true;
  casinoMarche = { pts: [[xm, -9.0]], i: 0, vers: null, fn: () => bougerPorte(0), O: SALLE_CASINO };
}
function direPatron(texte, duree) { if (patronB && casinoBureau) direSalle(patronB.tete, texte, duree || 3400); }
function taireBureau() { const P = patronB && patronB.tete.userData.parole; if (P) { P.fin = 0; delete ancres[P.cle]; } }
function animerBureau(dt) { /* le patron respire, te suit des yeux, remue la queue, fait un geste quand il mise ; la fumee du cigare, le feu, les poissons */
  const t = performance.now() / 1000, now = performance.now(), pp = paysanMesh.position, O = BUREAU_CASINO, B = patronB;
  if (B) {
    const r = (p) => p.userData.r0, q = (p) => p.userData.p0, souffle = Math.sin(t * 1.3) * 0.008;
    [B.corps, B.tete, B.bras, B.queue].forEach((p) => { p.position.y = q(p).y + souffle; });
    const dx = pp.x - (O.x + q(B.tete).x), dz = pp.z - (O.z + q(B.tete).z), vise = Math.max(-0.75, Math.min(0.75, Math.atan2(dx, dz)));
    B.tete.rotation.y += (r(B.tete).y + vise - B.tete.rotation.y) * Math.min(1, dt * 3);
    B.tete.rotation.z = r(B.tete).z + Math.sin(t * 0.7) * 0.035; B.tete.rotation.x = r(B.tete).x + Math.sin(t * 0.5) * 0.02;
    const agace = poker && !poker.fini ? pkLisse(poker.jetons.j - poker.jetons.b, 0, 10) : 0; /* (quand il perd, sa queue fouette l'air) */
    B.queue.rotation.x = r(B.queue).x + Math.sin(t * (1.4 + 4 * agace)) * (0.16 + 0.18 * agace); B.queue.rotation.y = r(B.queue).y + Math.sin(t * (0.9 + 3 * agace)) * (0.12 + 0.1 * agace);
    if (B.geste > 0) { B.geste = Math.max(0, B.geste - dt); B.bras.rotation.x = r(B.bras).x - 0.28 * Math.sin((1 - B.geste / 0.9) * Math.PI); }
    else B.bras.rotation.x += (r(B.bras).x + Math.sin(t * 1.1) * 0.025 - B.bras.rotation.x) * Math.min(1, dt * 6);
    B.fume -= dt; if (B.fume <= 0) { B.fume = 0.55 + Math.random() * 0.4; boufeeCigare(); }
    const P = B.tete.userData.parole; if (P && P.bulle) { if (now > P.fin) delete ancres[P.cle]; else { const a = ancres[P.cle] || (ancres[P.cle] = new T.Vector3()); B.tete.getWorldPosition(a); a.y += 1.05; } }
  }
  for (let i = fumeeB.length - 1; i >= 0; i--) { const f = fumeeB[i]; f.t += dt; const k = f.t / 2.2; f.m.position.y += dt * 0.28; f.m.position.x += dt * (0.2 + 0.05 * Math.sin(t * 2 + i)); f.m.position.z += dt * 0.12; f.m.scale.setScalar(1 + k * 1.3); f.m.material.opacity = 0.32 * (1 - k); /* (elle s'ecarte du visage, vers sa gauche et vers la table) */
    if (k >= 1) { bureauCasino.remove(f.m); f.m.geometry.dispose(); f.m.material.dispose(); fumeeB.splice(i, 1); } }
  if (feuB) { feuB.scale.y = 1 + Math.sin(t * 9) * 0.08 + Math.sin(t * 13.7) * 0.05; feuB.scale.x = 1 + Math.sin(t * 7.3) * 0.04; if (feuB.userData.lum) feuB.userData.lum.intensity = 1.05 + Math.sin(t * 11) * 0.12 + Math.sin(t * 17) * 0.08; }
  if (poissonsB) poissonsB.rotation.y = poissonsB.userData.r0.y + t * 0.55;
}
const _bout = new T.Vector3();
function boufeeCigare() { /* une petite volute grise au bout du cigare, qui monte et s'efface */
  if (!bureauCasino || fumeeB.length > 14) return; const B = patronB; _bout.set(0.21, 0.077, 0.44); B.tete.localToWorld(_bout); bureauCasino.worldToLocal(_bout);
  const m = new T.Mesh(new T.SphereGeometry(0.03, 7, 5), new T.MeshBasicMaterial({ color: '#c9c2d2', transparent: true, opacity: 0.32, depthWrite: false })); m.position.copy(_bout); bureauCasino.add(m); fumeeB.push({ m, t: 0 });
}

/* ---------- LE POKER DU PATRON : cinq cartes, un echange, des jetons ----------
   Dix jetons chacun ; chaque main, une mise d'entree d'un jeton ; on recoit 5 cartes, on en echange autant qu'on veut une seule fois, puis on parle :
   parole, miser 2, suivre, relancer de 2 (une seule relance), tapis, se coucher. Une mise ne depasse jamais ce que l'autre peut suivre (pas de pot a part).
   Le patron parle le premier aux mains impaires. Le premier a sec perd ; apres 12 mains, le plus riche gagne (a egalite, on continue). Le patron joue
   proprement : il garde ses paires, tente couleurs et quintes, mise ses bonnes mains, bluffe de temps en temps et lit ton echange (3 cartes : une paire). */
let poker = null;
const PK_COUL = ['♠', '♥', '♦', '♣'], PK_TEINTE = ['', ' rouge', ' bleu', ' vert'], /* (un jeu a quatre couleurs : le trefle et le pique se confondaient en petit) */ PK_LETTRE = { 11: 'V', 12: 'D', 13: 'R', 14: 'A' }, PK_NOM = { 11: 'Valet', 12: 'Dame', 13: 'Roi', 14: 'As' }, PK_PLUR = { 11: 'Valets', 12: 'Dames', 13: 'Rois', 14: 'As' };
const pkPl = (r) => PK_PLUR[r] || String(r), pkDe = (r) => (r === 14 ? 'd\'As' : 'de ' + pkPl(r));
function pkPaquet() { const p = []; for (let c = 0; c < 4; c++) for (let r = 2; r <= 14; r++) p.push({ r, c }); for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return p; }
function pkEvaluer(m) {
  const rs = m.map((k) => k.r).sort((a, b) => b - a), n = {}; rs.forEach((r) => { n[r] = (n[r] || 0) + 1; });
  const grp = Object.keys(n).map(Number).sort((a, b) => n[b] - n[a] || b - a), c = grp.map((r) => n[r]), couleur = m.every((k) => k.c === m[0].c);
  let haut = 0; if (grp.length === 5) { if (rs[0] - rs[4] === 4) haut = rs[0]; else if (rs.join() === '14,5,4,3,2') haut = 5; }
  if (haut && couleur) return { cat: 8, val: [haut], nom: haut === 14 ? 'Quinte flush royale' : 'Quinte flush' };
  if (c[0] === 4) return { cat: 7, val: grp, nom: 'Carré ' + pkDe(grp[0]) };
  if (c[0] === 3 && c[1] === 2) return { cat: 6, val: grp, nom: 'Full aux ' + pkPl(grp[0]) + ' par les ' + pkPl(grp[1]) };
  if (couleur) return { cat: 5, val: rs, nom: 'Couleur' };
  if (haut) return { cat: 4, val: [haut], nom: 'Quinte' };
  if (c[0] === 3) return { cat: 3, val: grp, nom: 'Brelan ' + pkDe(grp[0]) };
  if (c[0] === 2 && c[1] === 2) return { cat: 2, val: grp, nom: 'Double paire, ' + pkPl(grp[0]) + ' et ' + pkPl(grp[1]) };
  if (c[0] === 2) return { cat: 1, val: grp, nom: 'Paire ' + pkDe(grp[0]) };
  return { cat: 0, val: rs, nom: 'Carte haute : ' + (PK_NOM[rs[0]] || rs[0]) };
}
function pkComparer(a, b) { if (a.cat !== b.cat) return a.cat - b.cat; for (let i = 0; i < Math.max(a.val.length, b.val.length); i++) if ((a.val[i] || 0) !== (b.val[i] || 0)) return (a.val[i] || 0) - (b.val[i] || 0); return 0; }
const PK_CLE = (k) => k.r * 4 + k.c;
function pkEchangeBoss(m, type) { /* les cartes que le patron jette ; type : la facon d'un joueur ordinaire, sans ruse ni hasard (pour deviner ta main) */
  const e = pkEvaluer(m); if (e.cat >= 4) return [];
  const n = {}; m.forEach((k) => { n[k.r] = (n[k.r] || 0) + 1; });
  if (e.cat === 3 && !type && Math.random() < 0.3) { const kick = m.map((k, i) => [k.r, i]).filter(([r]) => n[r] === 1).sort((a, b) => b[0] - a[0])[0][1]; return m.map((k, i) => (n[k.r] === 1 && i !== kick ? i : -1)).filter((i) => i >= 0); } /* (un brelan deguise : il garde une carte en plus, il n'en prend qu'une) */
  if (e.cat >= 1) return m.map((k, i) => (n[k.r] >= 2 ? -1 : i)).filter((i) => i >= 0);
  const pc = {}; m.forEach((k) => { pc[k.c] = (pc[k.c] || 0) + 1; }); const cf = Object.keys(pc).find((c) => pc[c] === 4);
  if (cf != null) return m.map((k, i) => (k.c !== +cf ? i : -1)).filter((i) => i >= 0);
  for (let i = 0; i < 5; i++) { const r = m.filter((_, j) => j !== i).map((k) => k.r); if (new Set(r).size === 4 && Math.max(...r) - Math.min(...r) <= 4 && (type || Math.random() < 0.75)) return [i]; }
  if (!type && Math.random() < 0.05) return []; /* (le bluff du servi : rien en main, il ne change rien pour faire peur, puis il mise) */
  const ord = m.map((k, i) => [k.r, i]).sort((a, b) => b[0] - a[0]); return ord.slice(ord[1][0] >= 11 ? 2 : 1).map(([, i]) => i);
}
const pkForce = (e) => { const r = e.val[0]; return [0.05 + 0.12 * (r - 2) / 12, 0.3 + 0.36 * (r - 2) / 12, 0.7 + 0.1 * (r - 2) / 12, 0.84 + 0.05 * (r - 2) / 12, 0.9, 0.93, 0.96, 0.99, 1][e.cat]; };
/* CE QU'IL SAIT DE TOI (10/11/2026, « faut qu'il ait un bon niveau », Mathieu) : il retient, d'une main a l'autre, combien de fois tu as mise puis montre une
   main faible (tes bluffs), combien de fois tu te couches quand il mise, et combien de mains tu joues a l'attaque. Au depart, il te croit un bluffeur sur cinq. */
const pkTauxBluff = (L) => (L.bluffs + 0.6) / (L.montres + 3), pkTauxCouche = (L) => (L.couches + 1) / (L.faces + 3), pkTauxAttaque = (L) => (L.attaques + 1) / (L.mains + 3);
const pkLisse = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)));
function pkPoids(K) { /* la vraisemblance de ce que tu as fait dans cette main, pour une main donnee : on mise plutot avec du jeu, on passe plutot sans */
  const tb = pkTauxBluff(K.lu), acts = K.actJ;
  return (e) => { const s = pkForce(e); let w = 1;
    acts.forEach((a) => { if (a === 'miser' || a === 'relancer') w *= tb + (1 - tb) * pkLisse(s, 0.35, 0.75); else if (a === 'tapis') w *= tb * 0.8 + (1 - tb * 0.8) * pkLisse(s, 0.5, 0.88);
      else if (a === 'parole') w *= 1 - 0.75 * pkLisse(s, 0.5, 0.85); else if (a === 'suivre') w *= 0.12 + 0.88 * pkLisse(s, 0.25, 0.6); });
    return w; };
}
function pkProba(K) { /* sa chance de gagner : il imagine des centaines de mains pour toi, compatibles avec ton echange et ta facon de parler, et compte celles qu'il bat */
  const eb = pkEvaluer(K.cartes.b), vus = new Set(K.cartes.b.concat(K.jetesB).map(PK_CLE)), reste = [];
  for (let c = 0; c < 4; c++) for (let r = 2; r <= 14; r++) if (!vus.has(r * 4 + c)) reste.push({ r, c });
  const n = K.echJ, poids = pkPoids(K); let pris = 0, tot = 0, gagne = 0;
  for (let essai = 0; essai < 6000 && pris < 400; essai++) {
    for (let i = 0; i < 10; i++) { const j = i + Math.floor(Math.random() * (reste.length - i)), t = reste[i]; reste[i] = reste[j]; reste[j] = t; }
    const main = reste.slice(0, 5), jette = pkEchangeBoss(main, true);
    if (n >= 4 ? jette.length < 4 : Math.abs(jette.length - n) > (essai > 3000 ? 1 : 0)) continue;
    pris++; jette.forEach((i, k) => { main[i] = reste[5 + k]; });
    const ej = pkEvaluer(main), w = poids(ej); if (!(w > 0)) continue; tot += w; const c = pkComparer(eb, ej); gagne += w * (c > 0 ? 1 : c === 0 ? 0.5 : 0);
  }
  return tot > 0 ? gagne / tot : 0.5;
}
const PK_DIRE = {
  miser: ['Je mise.', 'Deux jetons. Pour voir.', 'Tu trembles ? Je mise.', 'Mise.'], parole: ['Parole.', 'Je passe.', 'À toi.'], relancer: ['Je relance.', 'Relance. Ta main tient le coup ?', 'Plus haut.'],
  tapis: ['Tapis.', 'Tout. Maintenant.', 'Tapis. Montre-moi qui tu es.'], suivre: ['Je suis.', 'Je paie pour voir.', 'Montre.'], coucher: ['Garde-les. Je n\'en veux pas.', 'Je me couche. Profite.', 'Hm. Pas cette fois.'],
  gagne: ['La maison gagne toujours.', 'Merci pour les jetons.', 'C\'est ça, le métier.'], perd: ['Hm. Joli.', 'Pas mal, paysan.', 'Profite. Ça ne dure jamais.'],
  bluffReussi: ['Tu ne sauras jamais ce que j\'avais.', 'Sage décision. Ou pas.', 'Hé hé. Merci.'], couche: ['Prudent, le paysan.', 'Tu as bien fait. Peut-être.'],
  bluffPris: ['Je le savais. Tu bluffes mal.', 'Trop facile. Je lis en toi comme dans un livre.', 'La prochaine fois, bluffe avec des cartes.'],
  bluffRate: ['Hm. Tu as payé pour voir. Bien joué.', 'Tss. Une fois n\'est pas coutume.'], malchance: ['Impossible...', 'Avec ça ?! Tu as une chance insolente.', 'Ce paquet est truqué. Le mien, en plus.'],
  grosPotB: ['Merci pour la contribution.', 'Le pot est à moi. Comme la bague.'], grosPotJ: ['...Joli coup.', 'Je m\'en souviendrai.'],
  echange: [['Servi ? Tu me fais peur... ou pas.', 'Rien à changer ? Voyons ça.'], ['Une seule carte. Tu cherches une couleur ?', 'Une carte... Double paire, ou tu rêves d\'une quinte.'], ['Deux cartes. Un brelan, peut-être.'],
    ['Trois cartes. Une petite paire, je parie.', 'Trois cartes. Je vois.'], ['Quatre cartes ? Ta main était si mauvaise ?', 'Tout changer... Courageux.'], ['Tout changer... Courageux.']] };
const pkDire = (cle) => { const t = hasard(PK_DIRE[cle]); poker.ligne = t; direPatron(t, 2800); if (patronB && /miser|relancer|tapis|suivre/.test(cle)) patronB.geste = 0.9; return t; };
function pkSituation() { /* ce qu'il dit en distribuant, selon le score */
  const K = poker, av = K.jetons.b - K.jetons.j, reste = MAINS_POKER - K.main;
  if (K.serieJ >= 3) return 'Trois mains de suite. Tu triches, ou quoi ?';
  if (K.serieB >= 3 && Math.random() < 0.5) return 'La maison gagne toujours. Toujours.';
  if (reste === 0) return av > 0 ? 'Dernière main. Je mène, et je compte bien le rester.' : av < 0 ? 'Dernière main. Tout se joue maintenant.' : 'Dernière main, à égalité. Enfin un peu de suspense.';
  if (K.jetons.j <= 3) return hasard(['Plus que ' + K.jetons.j + ' jeton' + (K.jetons.j > 1 ? 's' : '') + '. Ta grange va pleurer.', 'Tu sens le vent tourner, paysan ?']);
  if (K.jetons.b <= 3) return hasard(['Ne t\'emballe pas. J\'ai déjà remonté pire.', 'Rien n\'est fini tant que j\'ai un jeton.']);
  if (av >= 6) return hasard(['Tu veux que je te prête des jetons ?', 'Ma bague est bien au chaud.', 'Ça sent la fin, paysan.']);
  if (av >= 2) return hasard(['Je mène. Comme d\'habitude.', 'Continue comme ça, ça me va très bien.', 'Tu joues pour moi, en fait.']);
  if (av <= -6) return hasard(['...', 'Tu commences à m\'agacer.', 'Personne ne me fait ça dans mon propre casino.']);
  if (av <= -2) return hasard(['Profite. La chance tourne vite, ici.', 'Hm. Tu as de la chance, ce soir.', 'Ne prends pas l\'habitude.']);
  return hasard(['Serré. J\'aime ça.', 'À égalité. Pas pour longtemps.', 'On s\'amuse enfin.']);
}
const pkAutre = (q) => (q === 'j' ? 'b' : 'j');
const pkDu = (q) => poker.mises[pkAutre(q)] - poker.mises[q];
function pkMettre(q, n) { n = Math.max(0, Math.min(n, poker.jetons[q])); poker.jetons[q] -= n; poker.mises[q] += n; poker.pot += n; }
function ouvrirPoker() {
  const P = etatPatron(); if (patronB) patronB.tete.userData.regard = performance.now() + 3000;
  if (P.gagne) { direPatron(hasard(['Tu as déjà ma bague. Je ne joue plus contre toi : question d\'honneur.', 'Non. Une fois m\'a suffi.']), 3600); return; }
  if (poker && !poker.fini) { pkRendu(); return; }
  ouvrirModale('poker', entete('La table du patron') + '<div class="pk-dit">« ' + ((P.perdues || 0) ? 'Revoilà mon paysan. Même table, même enjeu : ma bague.' : 'Le paysan au million. Ici, on ne joue pas des kamas : on joue ma bague.') + ' »<small>Doré III, dit l\'Ombre</small></div>' +
    '<div class="hdv-section">Les règles</div><ul class="pk-regles">' +
    '<li><b>Poker à cinq cartes.</b> Tu reçois 5 cartes et tu peux en échanger autant que tu veux, une seule fois.</li>' +
    '<li><b>' + JETONS_POKER + ' jetons chacun</b>, 1 jeton de mise d\'entrée à chaque main. Après l\'échange, on parle : parole, miser 2, suivre, relancer, tapis ou se coucher.</li>' +
    '<li><b>Le premier à sec a perdu.</b> Après ' + MAINS_POKER + ' mains, celui qui a le plus de jetons gagne.</li>' +
    '<li><b>L\'enjeu :</b> si tu gagnes, sa bague. Si tu perds, il te donne rendez-vous dans une semaine. Quitter la table en pleine partie, c\'est perdre.</li></ul>' +
    '<div class="hdv-section">Des mains les plus faibles aux plus fortes</div><p class="pk-ordre">Carte haute · Paire · Double paire · Brelan · Quinte · Couleur · Full · Carré · Quinte flush</p>' +
    '<button class="btn kamas grand" data-cas="pk:jouer" style="width:100%;margin-top:8px">S\'asseoir et jouer</button>');
}
function pkNouvellePartie() {
  const P = etatPatron(); if (P.gagne || (P.rdv && Date.now() < P.rdv)) return;
  P.enCours = Date.now(); P.parties = (P.parties || 0) + 1; P.rdv = 0; sauver(); compter('pokerPatron');
  poker = { main: 0, jetons: { j: JETONS_POKER, b: JETONS_POKER }, fini: false, serieJ: 0, serieB: 0, lu: { bluffs: 0, montres: 0, couches: 0, faces: 0, attaques: 0, mains: 0 } }; pkNouvelleMain();
}
function pkNouvelleMain() {
  const K = poker; K.main++; K.paquet = pkPaquet(); K.pot = 0; K.mises = { j: 0, b: 0 }; K.res = null; K.abattage = false;
  pkMettre('j', 1); pkMettre('b', 1); K.mises = { j: 0, b: 0 }; /* (la mise d'entree va au pot, elle ne compte pas dans le tour de parole) */
  K.cartes = { j: K.paquet.splice(0, 5), b: K.paquet.splice(0, 5) }; K.choix = new Set(); K.echJ = null; K.echB = null; K.jetesB = [];
  K.phase = 'echange'; K.premier = K.main % 2 ? 'b' : 'j'; K.parles = 0; K.relance = 0; K.actJ = []; K.agresJ = false; K.bluffB = false; K.piege = false; K.servi = false;
  K.ligne = K.main === 1 ? 'Coupe. Je distribue.' : Math.random() < 0.75 ? pkSituation() : hasard(['Main suivante.', 'Je distribue.', 'On continue.', 'Encore une.']);
  direPatron(K.ligne, 3000); pkRendu();
}
function pkEchanger() {
  const K = poker; if (!K || K.phase !== 'echange') return;
  [...K.choix].forEach((i) => { K.cartes.j[i] = K.paquet.shift(); }); K.echJ = K.choix.size; K.choix = new Set();
  const jette = pkEchangeBoss(K.cartes.b); K.jetesB = jette.map((i) => K.cartes.b[i]); K.servi = !jette.length && pkEvaluer(K.cartes.b).cat === 0;
  jette.forEach((i) => { K.cartes.b[i] = K.paquet.shift(); }); K.echB = jette.length;
  K.phase = 'mise'; K.mises = { j: 0, b: 0 }; K.parles = 0; K.relance = 0; K.aParler = K.premier;
  K.ligne = (K.echB ? 'J\'en prends ' + K.echB + '.' : 'Servi. Je garde tout.') + (Math.random() < 0.45 ? ' ' + hasard(PK_DIRE.echange[Math.min(5, K.echJ)]) : ''); direPatron(K.ligne, 3000);
  if (!K.jetons.j || !K.jetons.b) { pkAbattage(); return; } /* (l'un des deux est deja a sec : on montre) */
  if (K.aParler === 'b') pkBoss(); else pkRendu();
}
/* LE JEU DU PATRON (10/11/2026) : sa chance de gagner (pkProba), la cote du pot (ce que suivre coute contre ce qu'il y a a gagner), et la situation :
   devant de 6 jetons a 3 mains de la fin, il protege son avance ; a 3 jetons ou moins, ou derriere a la derniere main, il joue le tout pour le tout ;
   quand tu es presque a sec, il te met la pression. Il bluffe surtout si tu te couches souvent, et tend des pieges (parole avec un gros jeu) aux joueurs
   qui attaquent beaucoup. Avec rien en main, il garde parfois tout (le servi) puis mise pour faire peur. */
function pkBoss() {
  const K = poker, du = pkDu('b'), jb = K.jetons.b, jj = K.jetons.j, r = Math.random(), L = K.lu, tc = pkTauxCouche(L), tb = pkTauxBluff(L), p = pkProba(K);
  const reste = MAINS_POKER - K.main, avance = jb - jj, desespoir = jb <= 3 || (reste <= 0 && avance < 0), prudence = avance >= 6 && reste <= 3 ? 0.08 : 0, presse = jj <= 3 ? 0.1 : 0;
  let a;
  if (du === 0) {
    if (K.servi && p < 0.5) { a = 'miser'; K.bluffB = true; }
    else if (desespoir && p > 0.42) a = 'tapis';
    else if (p > 0.85 && !K.actJ.length && pkTauxAttaque(L) > 0.4 && r < 0.35) { a = 'parole'; K.piege = true; }
    else if (p > 0.88 && r < 0.3) a = 'tapis';
    else if (p > 0.6 - presse) a = r < 0.9 ? 'miser' : 'parole';
    else if (p < 0.35) { const pb = Math.max(0, 0.06 + 0.4 * tc * (K.echJ >= 3 ? 1.3 : 0.8) * (K.actJ.includes('parole') ? 1.3 : 1) - prudence); if (r < pb) { a = 'miser'; K.bluffB = true; } else a = 'parole'; }
    else a = 'parole';
  } else {
    const cote = du / (K.pot + du), marge = p - cote - prudence;
    if (K.relance) a = marge > 0 || (desespoir && p > 0.33) ? 'suivre' : 'coucher';
    else if (K.piege || p > 0.8) a = r < 0.8 ? (desespoir || p > 0.92 ? 'tapis' : 'relancer') : 'suivre';
    else if (marge > 0) a = p > 0.65 && r < 0.35 ? 'relancer' : 'suivre';
    else if (p < 0.25 && tb < 0.3 && r < 0.05 + 0.08 * tc) { a = 'relancer'; K.bluffB = true; }
    else a = r < 0.06 ? 'suivre' : 'coucher';
  }
  if (a === 'relancer' && (K.relance || jb <= du || !jj)) a = 'suivre';
  if (a === 'tapis' && (jb <= du || (!du && !jj))) a = du ? 'suivre' : 'parole';
  if (a === 'miser' && !jj) a = 'parole';
  K.p = p; pkAgir('b', a);
}
function pkAgir(q, a) {
  const K = poker; if (!K || K.phase !== 'mise' || K.aParler !== q) return; const o = pkAutre(q), du = pkDu(q);
  if (a === 'parole' && du) return; if ((a === 'relancer' && (!du || K.relance)) || (a === 'miser' && du)) return;
  if (q === 'b') pkDire(a);
  else { K.actJ.push(a); if (du) { K.lu.faces++; if (a === 'coucher') K.lu.couches++; } if (/miser|relancer|tapis/.test(a)) K.agresJ = true; }
  if (a === 'coucher') { pkFinMain(o, (q === 'j' ? 'Tu te couches.' : 'Doré III se couche.'), q === 'b' ? 'garder' : K.bluffB ? 'bluffReussi' : 'couche'); return; }
  if (a === 'parole') { K.parles++; if (K.parles >= 2) { pkAbattage(); return; } }
  else if (a === 'suivre') { pkMettre(q, du); pkAbattage(); return; }
  else if (a === 'miser') pkMettre(q, Math.min(2, K.jetons[q], K.jetons[o]));
  else if (a === 'relancer') { pkMettre(q, du + Math.min(2, K.jetons[q] - du, K.jetons[o])); K.relance++; }
  else if (a === 'tapis') { pkMettre(q, du + Math.min(K.jetons[q] - du, K.jetons[o])); K.relance++; }
  if (q === 'j') son('kamas');
  K.aParler = o; if (o === 'b') { pkBoss(); return; } pkRendu();
}
function pkAbattage() {
  const K = poker, ej = pkEvaluer(K.cartes.j), eb = pkEvaluer(K.cartes.b), c = pkComparer(ej, eb); K.abattage = true;
  if (K.agresJ) { K.lu.montres++; if (pkForce(ej) < 0.45) K.lu.bluffs++; } /* (il retient tes bluffs) */
  const cle = c < 0 ? (K.agresJ && pkForce(ej) < 0.45 ? 'bluffPris' : null) : c > 0 ? (K.bluffB ? 'bluffRate' : eb.cat >= 3 ? 'malchance' : null) : null;
  K.nomB = eb.nom; pkFinMain(c > 0 ? 'j' : c < 0 ? 'b' : null, c ? 'Toi : ' + ej.nom + '. Lui : ' + eb.nom + '.' : 'Égalité parfaite (' + ej.nom + ') : le pot est partagé.', cle);
}
function pkFinMain(g, pourquoi, cle) {
  const K = poker, pot = K.pot; K.phase = 'abattage';
  K.lu.mains++; if (K.agresJ) K.lu.attaques++;
  if (g) K.jetons[g] += pot; else { K.jetons.j += Math.floor(pot / 2); K.jetons.b += pot - Math.floor(pot / 2); } K.pot = 0;
  K.serieJ = g === 'j' ? K.serieJ + 1 : 0; K.serieB = g === 'b' ? K.serieB + 1 : 0;
  K.res = { gagne: g === 'j', html: (g === 'j' ? 'Main gagnée !' : g === 'b' ? 'Main perdue' : 'Égalité') + '<small>' + pourquoi + (g ? ' ' + (g === 'j' ? 'Tu' : 'Il') + ' ramasse ' + pot + ' jeton' + (pot > 1 ? 's' : '') + '.' : '') + '</small>' };
  if (g && cle !== 'garder') { K.ligne = hasard(PK_DIRE[cle || (pot >= 8 ? (g === 'b' ? 'grosPotB' : 'grosPotJ') : g === 'b' ? 'gagne' : 'perd')]); direPatron(K.ligne, 3000); }
  if (g === 'j') son('kamas');
  if (!K.jetons.j || !K.jetons.b || (K.main >= MAINS_POKER && K.jetons.j !== K.jetons.b)) K.finale = K.jetons.j > K.jetons.b ? 'j' : 'b';
  pkRendu();
}
function pkFinPartie() {
  const K = poker, P = etatPatron(); if (!K || K.fini) return; K.fini = true; P.enCours = 0;
  if (K.finale === 'j') {
    P.gagne = Date.now(); const k = donnerObjet('leg-joueur'); compter('patronBattu'); sauver(); son('victoire'); if (patronB && patronB.bague) patronB.bague.visible = false;
    direPatron('Personne... Personne ne m\'avait jamais battu.', 5000);
    ouvrirModale('poker', entete('La table du patron') + '<div class="pk-dit">« Personne... Personne ne m\'avait jamais battu. »<small>Doré III retire lentement sa bague et la fait glisser vers toi sur le tapis vert.</small></div>' +
      '<div class="art">' + icoObjet(k) + '<div><b>✦ ' + OBJETS['leg-joueur'].nom + '</b><div class="desc">« Elle est à toi. Porte-la bien, joueur pro. Et ne remets jamais les pattes à ma table. »</div><div class="puces">' + statsTexte(obj(k).stats) + '</div></div><div></div></div>' +
      '<p class="hdv-aide">Elle t\'attend dans ton sac : un anneau légendaire, hors panoplie.</p><button class="btn kamas grand" data-fermer style="width:100%">Merci, patron</button>');
    return;
  }
  P.rdv = Date.now() + SEMAINE; P.perdues = (P.perdues || 0) + 1; sauver(); son('defaite');
  direPatron('La maison gagne toujours. Une semaine, paysan.', 4500);
  ouvrirModale('poker', entete('La table du patron') + '<div class="pk-dit">« Pas mal, pour un paysan. Mais la maison gagne toujours. »<small>Doré III ramasse les jetons sans te quitter des yeux.</small></div>' +
    '<div class="art">' + ico('cadenas') + '<div><b>« Reviens dans une semaine. Même heure. Ma bague t\'attendra. »</b><div class="desc">Rendez-vous ' + quandRdv(P.rdv) + '. D\'ici là, le passage derrière le portrait reste fermé.</div></div><div></div></div>' +
    '<button class="btn kamas grand" data-cas="pk:sortir" style="width:100%">Retourner au hall</button>');
}
function ouvrirAbandon() {
  ouvrirModale('poker', entete('Quitter la table ?') + '<p class="hdv-aide">Une partie commencée se finit à la table. Si tu te lèves maintenant, Doré III considère que tu as perdu : rendez-vous dans une semaine.</p>' +
    '<div class="bj-actions"><button class="btn kamas" data-cas="pk:rester">Rester à la table</button><button class="btn discret" data-cas="pk:abandon">Quitter quand même</button></div>');
}
const pkCarteHtml = (k, cachee, i, sel) => (cachee ? '<span class="bj-carte dos"></span>'
  : '<' + (i != null ? 'button data-cas="pk:c' + i + '"' : 'span') + ' class="bj-carte pk-carte' + PK_TEINTE[k.c] + (sel ? ' sel' : '') + '"><b>' + (PK_LETTRE[k.r] || k.r) + '</b><i>' + PK_COUL[k.c] + '</i></' + (i != null ? 'button' : 'span') + '>');
function pkRendu() {
  const K = poker; if (!K) return; const ech = K.phase === 'echange', ej = pkEvaluer(K.cartes.j), voir = K.phase === 'abattage' && K.abattage, du = pkDu('j'), o = K.jetons.b;
  const jet = (n) => '<span class="pk-jetons">' + '<i></i>'.repeat(Math.min(n, 20)) + '<b>' + n + '</b></span>';
  const tete = '<div class="pk-score"><span>Main ' + K.main + ' / ' + MAINS_POKER + '</span><span>Pot <b>' + K.pot + '</b></span></div>';
  const mainB = '<div class="bj-main"><div class="bj-titre">Doré III ' + jet(K.jetons.b) + (K.echB != null && !voir ? ' <small>a pris ' + K.echB + ' carte' + (K.echB > 1 ? 's' : '') + '</small>' : '') + (voir ? ' <b>' + K.nomB + '</b>' : '') + '</div><div class="bj-cartes">' + K.cartes.b.map((k) => pkCarteHtml(k, !voir)).join('') + '</div></div>';
  const mainJ = '<div class="bj-main"><div class="bj-titre">Toi ' + jet(K.jetons.j) + ' <b>' + ej.nom + '</b></div><div class="bj-cartes">' + K.cartes.j.map((k, i) => pkCarteHtml(k, false, ech ? i : null, K.choix.has(i))).join('') + '</div>' + (ech ? '<div class="pk-aide">Touche les cartes à échanger.</div>' : '') + '</div>';
  let act = '';
  if (ech) act = '<button class="btn kamas" data-cas="pk:echanger">' + (K.choix.size ? 'Échanger ' + K.choix.size + ' carte' + (K.choix.size > 1 ? 's' : '') : 'Servi, je garde tout') + '</button>';
  else if (K.phase === 'mise' && K.aParler === 'j') {
    const b = (a, txt, cl) => '<button class="btn ' + (cl || '') + '" data-cas="pk:' + a + '">' + txt + '</button>';
    act = du ? b('suivre', 'Suivre (' + Math.min(du, K.jetons.j) + ')', 'kamas') + (!K.relance && K.jetons.j > du && o ? b('relancer', 'Relancer (+' + Math.min(2, K.jetons.j - du, o) + ')') : '') + (!K.relance && K.jetons.j > du + 2 && o > 2 ? b('tapis', 'Tapis') : '') + b('coucher', 'Se coucher', 'discret')
      : b('parole', 'Parole', 'kamas') + (o ? b('miser', 'Miser ' + Math.min(2, K.jetons.j, o)) : '') + (K.jetons.j > 2 && o > 2 ? b('tapis', 'Tapis') : '');
  } else if (K.phase === 'abattage') act = K.finale ? '<button class="btn kamas" data-cas="pk:fin">' + (K.finale === 'j' ? 'Il n\'a plus rien à miser...' : 'Fin de la partie') + '</button>' : '<button class="btn kamas" data-cas="pk:suivante">Main suivante</button>';
  ouvrirModale('poker', entete('La table du patron') + tete + '<div class="pk-dit">« ' + (K.ligne || '...') + ' »<small>Doré III' + (K.phase === 'mise' && K.aParler === 'j' ? (du ? ' a misé : à toi' : ', à toi de parler') : '') + '</small></div>' + mainB +
    '<div class="cas-res' + (K.res && K.res.gagne ? ' gagne' : '') + '">' + (K.res ? K.res.html : '') + '</div>' + mainJ +
    '<div class="bj-actions">' + act + '</div>' + (K.phase !== 'abattage' || !K.finale ? '<button class="btn discret pk-quitter" data-cas="pk:quitter">Quitter la table</button>' : ''));
}
function actionPoker(a) {
  if (a === 'jouer') { pkNouvellePartie(); return; }
  if (a === 'rester') { if (poker && !poker.fini) pkRendu(); return; }
  if (a === 'abandon') { if (poker && !poker.fini) { poker.finale = 'b'; pkFinPartie(); } return; }
  if (a === 'sortir') { poker = null; sortirBureau(); return; }
  if (a === 'quitter') { if (poker && !poker.fini) ouvrirAbandon(); else fermerModale(); return; }
  const K = poker; if (!K || K.fini) return;
  if (a[0] === 'c' && /^c\d$/.test(a)) { if (K.phase !== 'echange') return; const i = +a.slice(1); if (K.choix.has(i)) K.choix.delete(i); else K.choix.add(i); pkRendu(); return; }
  if (a === 'echanger') pkEchanger();
  else if (a === 'suivante') { if (K.phase === 'abattage' && !K.finale) pkNouvelleMain(); }
  else if (a === 'fin') pkFinPartie();
  else pkAgir('j', a);
}
function actionPatron(a) {
  if (a === 'ouvrir') ouvrirPassage();
  else if (a === 'test-million' && ultiLibre()) { S_.stats = S_.stats || {}; S_.stats.casinoGains = Math.max(S_.stats.casinoGains || 0, MILLION); sauver(); appelFait = false; toast('Test : gains du Casino à 1 million.', 'or'); fermerModale(); setTimeout(appelFilou, 600); }
  else if (a === 'test-rdv' && ultiLibre()) { const P = etatPatron(); P.rdv = 0; P.enCours = 0; sauver(); toast('Test : rendez-vous du patron effacé.', 'or'); fermerModale(); }
  else if (a === 'test-zero' && ultiLibre()) { const c = etatCasino(); delete c.patron; poker = null; sauver(); toast('Test : clé, rendez-vous et victoire effacés.', 'or'); fermerModale(); }
}
const testsPatron = () => (ultiLibre() ? '<div class="hdv-section">Test (ton compte seulement)</div><div class="puces dev-groupes"><button class="btn discret" data-cas="patron:test-million">Gains à 1 million</button><button class="btn discret" data-cas="patron:test-rdv">Effacer le rendez-vous</button><button class="btn discret" data-cas="patron:test-zero">Tout remettre à zéro</button></div>' : '');
