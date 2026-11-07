'use strict';
/* ---------- se promener sur l'ile (07/11/2026 : le nouveau Casino, le Palais du Chat Dore ; « il faut penser avec une logique humaine de deplacement : pour
   aller dans le casino, aller devant l'entree ; pour la course de Dragodindes, aller devant l'entree », Mathieu) ----------
   Chaque jeu a son endroit : la porte du palais au bout du tapis rouge (la salle de jeux, en attendant le grand hall), le guichet des paris de l'hippodrome
   (avec le tableau des cotes), le ponton de la montgolfiere. Le perso y va par les allees en contournant le decor (cheminCasino, js/26b-casino-decor.js).
   Coordonnees sur l'ile [x, z, et le point qu'il regarde en arrivant] ; le jeu ajoute CASINO. */
const SPOTS = { casino: [0, -14.6, 0, -20], course: [6.7, 10.0, 8.0, 10.0], retour: [-26.2, 0, -29, 0], tribune: [0, 12.4, 0, 14.9] };
function zoneCasino(x, z) { /* le jeu touche, d'apres le point de l'ile (l'export cuit la hierarchie des groupes : le jeu se reconnait a l'endroit touche) */
  if (x < -24.6 && Math.abs(z) < 3.2) return 'retour';
  if (Math.abs(x) < 6.4 && z < -14.9 && z > -27) return 'casino';
  if (x > 7.0 && x < 9.0 && z > 8.8 && z < 11.2) return 'course'; /* le guichet des paris */
  if ((Math.abs(x) < 6.6 && z > 11.1 && z < 13.8) || Math.hypot(Math.max(Math.abs(x - STADE_CASINO.cx) - STADE_CASINO.a, 0), z - STADE_CASINO.cz) < STADE_CASINO.R + 1.6) return 'course'; /* la tribune, la piste */
  if (Math.hypot(x, z) < 4.2) return 'fontaine';
  return null;
}
/* LES CURIOSITES (08/11/2026, « teste tout comme un joueur qui veut prendre du plaisir a jouer », Mathieu) : ce qui ne se joue pas a quand meme quelque chose
   a dire ; on y va, on le regarde, un petit mot. [x, z, rayon, texte], sur l'ile puis dans le hall */
const CURIOSITES = [
  [-14, -12, 3.2, 'Le kiosque à musique du palais. Les soirs de gros gain, on dit qu\'un orchestre de chats y joue jusqu\'à l\'aube.'],
  [-21, -8, 1.5, 'Un kama géant en or massif. Personne n\'a jamais réussi à le soulever... ni à le dépenser.'],
  [-18.2, 8.4, 2.4, 'Des dés et des cartes géants : le Chat Doré y jouait avec les dragons, les soirs de pleine lune.'],
  [-25.6, 4.0, 1.0, 'Les chats d\'or gardent l\'entrée de l\'île. Ils ont l\'œil sur ta bourse.'], [-25.6, -4.0, 1.0, 'Les chats d\'or gardent l\'entrée de l\'île. Ils ont l\'œil sur ta bourse.'],
  [17, 0, 3.6, 'Le bassin des jardins. On dit que ses lotus ne s\'ouvrent que pour les grands gagnants.'],
  [26, 0, 1.6, 'L\'eau du canal se jette dans le vide, sous les nuages. Un kama lancé ici ne revient jamais.'],
  [16, 12, 2.9, 'Les écuries des Dragodindes. On entend Rousse taper du sabot : elle a hâte de courir.'],
  [9.5, -16.9, 1.2, 'Un coffre qui déborde de kamas. Pas touche : les gros bras veillent.'], [-9.5, -16.9, 1.2, 'Un coffre qui déborde de kamas. Pas touche : les gros bras veillent.'], [15.5, -9.4, 1.2, 'Un coffre qui déborde de kamas. Pas touche : les gros bras veillent.'],
  [8.6, -20.5, 2.0, 'Une tour du palais. Tout là-haut, le kama doré sert de girouette.'], [-8.6, -20.5, 2.0, 'Une tour du palais. Tout là-haut, le kama doré sert de girouette.'],
];
const CURIOSITES_SALLE = [
  [-12.9, -1.0, 4.8, 'La grande tapisserie : le Chat Doré lance ses dés face au dragon, et la fortune change de camp.'],
  [-9.2, -9.6, 1.0, 'Doré Ier, le fondateur : un chat de gouttière qui gagna l\'île en un seul lancer de dés.'],
  [-5.0, -9.6, 1.0, 'Doré II, dit le Magnifique : il fit couler la fontaine et creuser le canal.'],
  [-12.9, 6.4, 1.0, 'Doré III, dit l\'Ombre : on raconte qu\'il n\'a jamais perdu à la roulette. Personne ne sait comment.'],
  [10.2, 7.6, 2.0, 'Un petit salon pour souffler entre deux parties. Les coussins sentent la menthe et l\'or.'],
];
const curiosite = (L, x, z) => L.find(([a, b, r]) => Math.hypot(x - a, z - b) < r);
function aller(x, z, lx, lz, fn) { /* marcher jusqu'a (x, z) de l'ile (ou de la salle du palais), par les allees, puis regarder (lx, lz) et faire fn */
  const O = origineCasino(), px = paysanMesh.position.x - O.x, pz = paysanMesh.position.z - O.z, ch = (casinoDedans ? cheminSalle : cheminCasino)(px, pz, x, z) || [[x, z]];
  casinoMarche = { pts: ch, i: 0, vers: lx != null ? { x: O.x + lx, z: O.z + lz } : null, fn, O };
}
function clicCasino(hits) {
  if (course) return; if (casinoDedans) { clicSalle(hits); return; }
  for (const h of hits) {
    let o = h.object, perso = false, dansIle = false;
    while (o) { if (o === paysanMesh) perso = true; if (o === ileCasino) dansIle = true; o = o.parent; }
    if (perso) continue; if (!dansIle) continue;
    const lx = h.point.x - CASINO.x, lz = h.point.z - CASINO.z, jeu = zoneCasino(lx, lz);
    if (jeu === 'fontaine') { const px = paysanMesh.position.x - CASINO.x, pz = paysanMesh.position.z - CASINO.z, a = Math.atan2(pz, px); aller(Math.cos(a) * 5.7, Math.sin(a) * 5.7, 0, 0, () => ouvrirJeu('fontaine')); return; } /* (au bord, du cote ou l'on arrive) */
    if (jeu) { const [x, z, vx, vz] = SPOTS[jeu]; aller(x, z, vx, vz, () => ouvrirJeu(jeu)); return; }
    const cu = curiosite(CURIOSITES, lx, lz); if (cu) { aller(cu[0], cu[1], cu[0], cu[1], () => toast(cu[3])); return; }
    aller(lx, lz, null, null, null); return;
  }
}
function majCasino(dt) {
  if (casinoAnim && !casinoDedans) casinoAnim.animer(dt, performance.now() / 1000);
  majCourse(dt);
  const u = paysanMesh.userData, P = paysanMesh.position, sol = (x, z) => (casinoDedans ? SALLE_CASINO.y : CASINO.y + hauteurCasino(x - CASINO.x, z - CASINO.z));
  if (u.angle !== undefined) { let d = u.angle - paysanMesh.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); paysanMesh.rotation.y += d * Math.min(1, dt * 10); }
  if (!casinoMarche) { animerPas(u, dt, 0); P.y += (sol(P.x, P.z) - P.y) * Math.min(1, dt * 12); return; }
  const m = casinoMarche, q = m.pts[m.i], tx = m.O.x + q[0], tz = m.O.z + q[1], dx = tx - P.x, dz = tz - P.z, d = Math.hypot(dx, dz), v = vitesse() * dt;
  if (d > 0.001) u.angle = Math.atan2(dx, dz);
  if (d <= v) { P.x = tx; P.z = tz; m.i++; if (m.i < m.pts.length) return; casinoMarche = null; if (m.vers) u.angle = Math.atan2(m.vers.x - tx, m.vers.z - tz); if (m.fn) m.fn(); return; }
  P.x += dx / d * v; P.z += dz / d * v; u.pas = (u.pas || 0) + v * 4.6; animerPas(u, dt, 1);
  P.y = sol(P.x, P.z) + (1 - Math.cos(u.pas * 2)) * 0.012 * (u.ampl || 0);
}
function ouvrirJeu(j) {
  if (j === 'course') ouvrirCourse(); else if (j === 'casino') entrerPalais(); /* (la porte du palais : le grand hall, 08/11/2026) */
  else if (j === 'retour') ouvrirModale('montgolfiere', entete('La montgolfière') + '<div class="art">' + ico('kama') + '<div><b>Rentrer à la ferme ?</b><div class="desc">Le ballon te ramène au bord de ta ferme.</div></div><div class="act"><button class="btn kamas" data-montgolfiere="rentrer">Rentrer</button></div></div>');
  else if (j === 'fontaine') toast('La fontaine du Chat Doré. On dit qu\'un kama jeté au fond porte chance au jeu...');
}
/* la porte du palais : la salle de jeux (en attendant le grand hall, qui viendra avec le blackjack) */
function ouvrirSalle() {
  const c = etatCasino(), ligne = (icone, titre, desc, cle, bouton) => '<div class="art">' + ico(icone) + '<div><b>' + titre + '</b><div class="desc">' + desc + '</div></div><div class="act"><button class="btn ' + (cle === 'bilan' ? 'discret' : 'kamas') + '" data-cas="salle:' + cle + '">' + bouton + '</button></div></div>';
  ouvrirModale('salle', entete('Le Palais du Chat Doré') + '<p class="hdv-aide">Bienvenue, voyageur. Le grand hall ouvrira bientôt ses portes ; en attendant, les jeux t\'attendent dans le vestibule.</p>' +
    ligne('jackpot', 'La machine à sous', 'Le jackpot : ' + fmt(c.jackpot) + ' kamas.', 'machine', 'Jouer') + ligne('kama', 'La roulette', 'Rouge ou noir, pair ou impair, ou ton numéro.', 'roulette', 'Jouer') +
    ligne('cadenas', 'Ton bilan et les règles de la maison', 'Ce que tu as misé et gagné, la mise maximale, les pertes du jour.', 'bilan', 'Voir'));
}
/* ---------- LE GRAND HALL DU PALAIS (08/11/2026, « le palais on peut pas rentrer dedans ? », puis « fini-moi ce casino, rends-le viable », Mathieu) ----------
   La porte du palais emmene dans une salle a part (blender/casino.py --salle), posee loin des iles, derriere le voile, comme un voyage : six machines a sous,
   la roulette, la table de blackjack, le bar, l'accueil et le coffre du jackpot ; les gros bras gardent la porte. On y marche comme sur l'ile (cheminSalle). */
const SALLE_CASINO = new T.Vector3(-240, 0, 480); /* (loin de tout, et rien derriere elle dans l'axe de la camera : la ferme se voyait au fond du hall) */
let salleCasino = null, casinoDedans = false, angleAvantSalle = null;
const origineCasino = () => (casinoDedans ? SALLE_CASINO : CASINO);
async function chargerSalle() {
  if (salleCasino) return;
  const sc = await chargerGlb('assets/modeles/jeu/casino-salle.glb?v=' + VERSION_MODELES);
  versToon(sc, { normales: 0.012, souple: SOUPLE_CASINO, sansContour: SC_CASINO });
  const g = new T.Group(); g.position.copy(SALLE_CASINO); g.add(sc); g.updateMatrixWorld(true); fusionner(sc);
  try { await chargerGrosBras(); [['bouboule', -2.2], ['filou', 2.2]].forEach(([n, x]) => { const m = cloner(n); m.position.set(x, 0, 8.9); m.rotation.y = Math.PI; g.add(m); }); } catch (e) { /* (sans eux, la salle reste ouverte) */ }
  g.visible = false; scene.add(g); salleCasino = g; grilleSalle();
}
async function entrerPalais() {
  $('voile').classList.add('on'); fermerModale();
  try { await Promise.all([chargerSalle(), attendreMs(700)]); } catch (e) { $('voile').classList.remove('on'); ouvrirSalle(); return; } /* (le hall n'a pas pu se charger : le vestibule, comme avant) */
  casinoDedans = true; casinoMarche = null; montrerIles(); majBarreCasino();
  const u = paysanMesh.userData, [x, z] = SALLE_PLACES.porte; paysanMesh.position.set(SALLE_CASINO.x + x, SALLE_CASINO.y, SALLE_CASINO.z + z); u.y = SALLE_CASINO.y; u.angle = Math.PI; paysanMesh.rotation.y = u.angle;
  angleAvantSalle = angleCam; angleCam = ANGLE_DEPART; /* (la salle se regarde du sud-est : ses murs hauts sont au nord et a l'ouest) */
  zoom = 0.8; cadrer(); VISEE.set(SALLE_CASINO.x + 0.6, 0.6, SALLE_CASINO.z + 1.0); placerCamera(); soleilVers(SALLE_CASINO); rendu.shadowMap.needsUpdate = true;
  setTimeout(() => $('voile').classList.remove('on'), 120); compter('palaisVisites');
  toast('Bienvenue au Palais du Chat Doré ! Touche une machine, une table ou le bar pour y aller.', 'or');
}
async function sortirPalais() {
  $('voile').classList.add('on'); fermerModale(); await attendreMs(600);
  casinoDedans = false; casinoMarche = null; montrerIles(); majBarreCasino();
  const u = paysanMesh.userData, [x, z] = SPOTS.casino; paysanMesh.position.set(CASINO.x + x, CASINO.y, CASINO.z + z); u.y = CASINO.y; u.angle = 0; paysanMesh.rotation.y = 0;
  if (angleAvantSalle != null) { angleCam = angleAvantSalle; angleAvantSalle = null; }
  zoom = Math.max(0.6, Math.min(zoom, 1)); cadrer(); VISEE.set(paysanMesh.position.x, 0.6, paysanMesh.position.z + 4); placerCamera(); soleilVers(CASINO); rendu.shadowMap.needsUpdate = true;
  setTimeout(() => $('voile').classList.remove('on'), 120);
}
function clicSalle(hits) {
  for (const h of hits) {
    let o = h.object, perso = false, dans = false; while (o) { if (o === paysanMesh) perso = true; if (o === salleCasino) dans = true; o = o.parent; }
    if (perso || !dans) continue;
    const lx = h.point.x - SALLE_CASINO.x, lz = h.point.z - SALLE_CASINO.z, ly = h.point.y - SALLE_CASINO.y;
    if (ly > 2.2) { const cm = curiosite(CURIOSITES_SALLE, lx, lz); if (cm) { aller(cm[0], cm[1], cm[0], cm[1], () => toast(cm[3])); return; } } /* (ce qui est accroche haut au mur passe avant ce qui est au sol dessous : le portrait au-dessus du coffre) */
    const j = zoneSalle(lx, lz);
    if (j && j.startsWith('machine')) { const z = MACHINES_SALLE[+j.slice(7)]; aller(-10.7, z, -11.7, z, () => ouvrirJeuSalle('machine')); return; }
    if (j) { const [x, z, vx, vz] = SALLE_PLACES[j]; aller(x, z, vx, vz, () => ouvrirJeuSalle(j)); return; }
    const cu = curiosite(CURIOSITES_SALLE, lx, lz); if (cu) { aller(cu[0], cu[1], cu[0], cu[1], () => toast(cu[3])); return; }
    aller(lx, lz, null, null, null); return;
  }
}
const LEGENDE_CHAT = 'Il y a bien longtemps, un chat de gouttière nommé Doré gagna une île entière en un seul lancer de dés : un double six, contre un dragon qui misait tout son trésor. Avec l\'or du dragon, il fit bâtir ce palais et jura que chacun y aurait sa chance. Ses descendants tiennent toujours la maison : ce sont eux, sur les portraits du hall. On raconte que le Chat Doré n\'a jamais perdu une partie... sauf contre sa propre queue.';
function ouvrirJeuSalle(j) {
  if (j === 'porte') sortirPalais(); else if (j === 'machine') ouvrirMachine(); else if (j === 'roulette') ouvrirRoulette(); else if (j === 'blackjack') ouvrirBlackjack();
  else if (j === 'bar') ouvrirBar(); else if (j === 'accueil') ouvrirCasinoInfo('L\'accueil du palais');
  else if (j === 'statue') toast('Le Chat Doré, fondateur du palais. On dit qu\'il n\'a jamais perdu une partie... sauf contre sa propre queue.');
  else if (j === 'coffre') toast('Le coffre du jackpot : ' + fmt(etatCasino().jackpot) + ' kamas. Il tombe avec trois Jackpots à la machine à sous.', 'or');
}
function ouvrirBar() {
  ouvrirModale('bar', entete('Le bar du Chat Doré') + '<div class="art">' + ico('kama') + '<div><b>« Qu\'est-ce que je te sers, voyageur ? »</b><div class="desc">Minou, le barman, essuie un verre et te raconte l\'histoire de la maison.</div></div><div class="act"><button class="btn kamas" data-cas="bar:verre">Un lait doré</button></div></div>' +
    '<div class="hdv-section">La légende du Chat Doré</div><p class="hdv-aide" style="font-size:.84rem;line-height:1.45">' + LEGENDE_CHAT + '</p>');
}

/* ---------- LE BLACKJACK (le plan du 07/11/2026, valide : le croupier tire jusqu'a 17, gagne : deux fois la mise, blackjack d'entree : deux fois et demie,
   egalite : la mise rendue ; Tirer, Rester, Doubler ; la meme mise maximale et le meme plafond de pertes que les autres jeux) ---------- */
const BJ_RANGS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R'], BJ_COULEURS = ['♠', '♥', '♦', '♣'];
let bj = null; /* la main en cours : { joueur, croupier, mise, double, fini } */
const bjCarte = () => ({ r: BJ_RANGS[Math.floor(Math.random() * 13)], c: BJ_COULEURS[Math.floor(Math.random() * 4)] }); /* (un sabot sans fin : chaque carte au hasard) */
function bjTotal(main) { let t = 0, as = 0; main.forEach((k) => { if (k.r === 'A') { t += 11; as++; } else t += ['10', 'V', 'D', 'R'].includes(k.r) ? 10 : +k.r; }); while (t > 21 && as) { t -= 10; as--; } return t; }
const bjNaturel = (main) => main.length === 2 && bjTotal(main) === 21;
const bjCarteHtml = (k, cachee) => (cachee ? '<span class="bj-carte dos"></span>' : '<span class="bj-carte' + ('♥♦'.includes(k.c) ? ' rouge' : '') + '"><b>' + k.r + '</b><i>' + k.c + '</i></span>');
function ouvrirBlackjack(res) {
  const enCours = !!(bj && !bj.fini), b = bj || { joueur: [], croupier: [] };
  const main = (titre, cartes, cache) => '<div class="bj-main"><div class="bj-titre">' + titre + (cartes.length ? ' <b>' + (cache ? bjTotal([cartes[0]]) + ' + ?' : bjTotal(cartes)) + '</b>' : '') + '</div><div class="bj-cartes">' +
    (cartes.length ? cartes.map((k, i) => bjCarteHtml(k, cache && i === 1)).join('') : '<span class="bj-vide">pas encore de carte</span>') + '</div></div>';
  ouvrirModale('blackjack', entete('Le blackjack du Chat Doré') + '<p class="hdv-aide">Approche-toi de 21 sans le dépasser. Le croupier tire jusqu\'à 17. Gagné : deux fois ta mise. Blackjack d\'entrée : deux fois et demie. Égalité : ta mise est rendue.</p>' +
    main('Le croupier', b.croupier, enCours) + main('Toi' + (b.mise ? ' (mise ' + fmt(b.mise) + ')' : ''), b.joueur, false) +
    '<div class="cas-res' + (res && res.gain ? ' gagne' : '') + '">' + (res ? res.html : '') + '</div>' +
    (enCours ? '<div class="bj-actions"><button class="btn kamas" data-cas="bj:tirer">Tirer</button><button class="btn" data-cas="bj:rester">Rester</button>' + (b.joueur.length === 2 && !b.double ? '<button class="btn discret" data-cas="bj:doubler">Doubler</button>' : '') + '</div>'
      : piedMise() + '<button class="btn kamas grand" data-cas="bj:donner" style="width:100%;margin-top:8px">' + (casinoMise > S_.kamas ? 'Distribuer à crédit' : 'Distribuer') + '</button>'));
}
function bjDonner() {
  if (bj && !bj.fini) return; const m = casinoMise; if (!peutMiser(m)) return; miser(m);
  bj = { joueur: [bjCarte(), bjCarte()], croupier: [bjCarte(), bjCarte()], mise: m, double: false, fini: false }; compter('blackjack');
  if (bjNaturel(bj.joueur)) { bjFin(); return; }
  ouvrirBlackjack();
}
function bjTirer() { if (!bj || bj.fini) return; bj.joueur.push(bjCarte()); if (bjTotal(bj.joueur) >= 21) { bjFin(); return; } ouvrirBlackjack(); }
function bjDoubler() { if (!bj || bj.fini || bj.joueur.length !== 2 || bj.double || !peutMiser(bj.mise)) return; miser(bj.mise); bj.mise *= 2; bj.double = true; bj.joueur.push(bjCarte()); bjFin(); }
function bjFin() {
  const b = bj; b.fini = true; const j = bjTotal(b.joueur), nat = bjNaturel(b.joueur);
  if (j <= 21 && !nat) while (bjTotal(b.croupier) < 17) b.croupier.push(bjCarte()); /* (le croupier tire jusqu'a 17, et reste sur tous les 17) */
  const c = bjTotal(b.croupier), natC = bjNaturel(b.croupier); let gain = 0, html;
  if (j > 21) html = 'Perdu...<small>Tu dépasses 21 (' + j + ').</small>';
  else if (nat && !natC) { gain = Math.round(b.mise * 2.5); html = 'Blackjack !<small>+' + fmt(gain) + ' kamas</small>'; }
  else if (nat && natC) { gain = b.mise; html = 'Égalité<small>Deux blackjacks : ta mise est rendue.</small>'; }
  else if (natC) html = 'Perdu...<small>Blackjack du croupier.</small>';
  else if (c > 21 || j > c) { gain = b.mise * 2; html = 'Gagné !<small>' + j + (c > 21 ? ', le croupier saute (' + c + ')' : ' contre ' + c) + ' : +' + fmt(gain) + ' kamas</small>'; }
  else if (j === c) { gain = b.mise; html = 'Égalité<small>' + j + ' partout : ta mise est rendue.</small>'; }
  else html = 'Perdu...<small>' + j + ' contre ' + c + '.</small>';
  payer(gain); ouvrirBlackjack({ gain: gain > b.mise ? gain : 0, html });
}

/* le pied commun des jeux : la mise, la mise maximale, la jauge des pertes du jour */
function piedMise(sansMise) {
  const max = miseMax(), p = perteJour(), pl = plafondPertes(); casinoMise = Math.max(10, Math.min(casinoMise, max));
  return '<div class="cas-mise">' + (sansMise ? '<span>mise max ' + fmt(max) + ' ' + KAMA + '</span>' : '<div class="m"><button class="btn discret" data-cas="moins">−</button><b>' + fmt(casinoMise) + ' ' + KAMA + '</b><button class="btn discret" data-cas="plus">+</button></div><span>max ' + fmt(max) + '</span>') +
    '<span>Pertes du jour : ' + fmt(p) + ' / ' + fmt(pl) + '<div class="cas-jauge"><i style="width:' + Math.min(100, 100 * p / pl).toFixed(0) + '%"></i></div></span></div>';
}
const pasMise = () => Math.max(10, Math.round(miseMax() / 10 / 10) * 10);

/* ---------- la machine a sous du Bouftou ---------- */
const SYMBOLES = [['couronne', 'jackpot', 1, 'Jackpots'], /* (05/11/2026 : une machine a sous doree a la place de la Couronne du Bouftou Royal, « j'ai cru qu'il avait gagne la coiffe Bouf legendaire », Mathieu ; l'id reste « couronne ») */ ['dragoeuf', 'drag-dore', 3, 'Dragoeufs'], ['kama', 'kama', 5, 'Kamas'], ['bouftou', 'bouftou', 7, 'Bouftous'], ['tofu', 'tofu', 9, 'Tofus']];
const PAIE = { dragoeuf: 20, kama: 8, bouftou: 5, tofu: 3 }; /* trois identiques ; deux identiques : la mise est rendue ; trois couronnes : le jackpot */
const tirerSymbole = () => { let r = Math.random() * 25; for (const s of SYMBOLES) { r -= s[2]; if (r < 0) return s[0]; } return 'tofu'; };
const icoSym = (id) => 'assets/icones/' + SYMBOLES.find((s) => s[0] === id)[1] + '.png?v=' + VERSION_MODELES;
function ouvrirMachine(res) {
  const c = etatCasino(), der = c.rouleaux || ['kama', 'bouftou', 'tofu'];
  ouvrirModale('machine', entete('La machine à sous du Bouftou') + '<div class="cas-borne"><div class="cas-bandeau">JACKPOT ' + fmt(c.jackpot) + ' ' + KAMA + '</div><div class="cas-rouleaux">' +
    der.map((id, i) => '<div class="cas-rouleau" id="rouleau' + i + '"><img src="' + icoSym(id) + '" alt=""></div>').join('') + '<div class="cas-ligne"></div></div><div class="cas-levier"></div></div>' +
    '<div class="cas-res' + (res && res.gain ? ' gagne' : '') + '" id="cas-res">' + (res ? res.html : '') + '</div>' +
    '<div class="hdv-section">Ce que ça rapporte (fois la mise)</div><div class="cas-gains">' + SYMBOLES.map(([id, ic, , nom]) => '<div><img src="' + icoSym(id) + '" alt="">×3 ' + nom + ' <b>' + (id === 'couronne' ? 'jackpot' : '×' + PAIE[id]) + '</b></div>').join('') + '<div>2 identiques <b>mise rendue</b></div></div>' +
    piedMise() + '<button class="btn kamas grand" data-cas="tirer" style="width:100%;margin-top:8px"' + (casinoTourne ? ' disabled' : '') + '>' + (casinoMise > S_.kamas ? 'Tirer le levier à crédit' : 'Tirer le levier') + '</button>');
}
function tirerMachine() {
  if (casinoTourne) return; const m = casinoMise; if (!peutMiser(m)) return;
  miser(m); const c = etatCasino(); c.jackpot += Math.round(m * 0.05);
  const r = [tirerSymbole(), tirerSymbole(), tirerSymbole()], n = {}; r.forEach((x) => { n[x] = (n[x] || 0) + 1; });
  let gain = 0, html;
  if (n.couronne === 3) { gain = Math.max(m * 50, Math.round(c.jackpot * Math.min(1, m / miseMax()))); c.jackpot = Math.max(5000, c.jackpot - gain); html = 'JACKPOT !<small>3 Jackpots : +' + fmt(gain) + ' kamas</small>'; }
  else { const t = Object.keys(n).find((k) => n[k] === 3), d = Object.keys(n).find((k) => n[k] === 2);
    if (t) { gain = m * PAIE[t]; html = 'Gagné !<small>3 ' + SYMBOLES.find((s) => s[0] === t)[3] + ' : +' + fmt(gain) + ' kamas</small>'; }
    else if (d) { gain = m; html = 'Presque...<small>2 identiques : ta mise est rendue</small>'; }
    else html = 'Perdu<small>Retente ta chance !</small>'; }
  c.rouleaux = r; casinoTourne = true; ouvrirMachine();
  const els = [0, 1, 2].map((i) => $('rouleau' + i)), defile = setInterval(() => els.forEach((e, i) => { if (e && e.classList.contains('tourne')) e.firstChild.src = icoSym(SYMBOLES[Math.floor(Math.random() * 5)][0]); }), 80);
  els.forEach((e) => e && e.classList.add('tourne')); son('plouf');
  r.forEach((x, i) => setTimeout(() => { const e = $('rouleau' + i); if (e) { e.classList.remove('tourne'); e.firstChild.src = icoSym(x); } }, 650 + i * 380));
  setTimeout(() => { clearInterval(defile); casinoTourne = false; payer(gain); if (modaleOuverte === 'machine') ouvrirMachine({ gain, html }); else if (gain) toast('Machine à sous : +' + fmt(gain) + ' kamas', 'or'); }, 650 + 2 * 380 + 250);
}

/* ---------- la roulette rouge et noir ---------- */
const ORDRE_ROUE = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const ROUGES = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const coulNum = (n) => (n === 0 ? '#2fae5a' : ROUGES.has(n) ? '#c8323e' : '#2a2630');
const fondRoue = 'conic-gradient(' + ORDRE_ROUE.map((n, i) => coulNum(n) + ' ' + (i * 360 / 37).toFixed(2) + 'deg ' + ((i + 1) * 360 / 37).toFixed(2) + 'deg').join(', ') + ')';
const totalParis = () => Object.values(casinoParis).reduce((a, b) => a + b, 0);
function ouvrirRoulette(res) {
  const jet = (k) => (casinoParis[k] ? '<span class="cas-jeton">' + fmt(casinoParis[k]) + '</span>' : '');
  const nums = [3, 2, 1].map((r) => Array.from({ length: 12 }, (_, c) => { const n = c * 3 + r; return '<button data-cas="pari:n' + n + '" style="background:' + coulNum(n) + '">' + n + jet('n' + n) + '</button>'; }).join('')).join('');
  ouvrirModale('roulette', entete('La roulette') + '<div class="cas-roue-zone"><div style="position:relative"><div class="cas-roue" id="cas-roue" style="background:' + fondRoue + ';transform:rotate(' + casinoRoue + 'deg)"></div><div style="position:absolute;left:50%;top:-6px;margin-left:-7px;width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid var(--bord)"></div></div>' +
    '<div style="flex:1"><div class="cas-res' + (res && res.gain ? ' gagne' : '') + '">' + (res ? res.html : 'Faites vos jeux !<small>Pose tes jetons puis lance la bille.</small>') + '</div><div style="font-size:.72rem;margin-top:6px">Mise posée : <b>' + fmt(totalParis()) + '</b> / ' + fmt(miseMax()) + ' ' + KAMA + '</div></div></div>' +
    '<div class="cas-tapis"><div class="cas-paris"><button class="cas-pari r" data-cas="pari:rouge">Rouge<small>×2</small>' + jet('rouge') + '</button><button class="cas-pari n" data-cas="pari:noir">Noir<small>×2</small>' + jet('noir') + '</button><button class="cas-pari c" data-cas="pari:pair">Pair<small>×2</small>' + jet('pair') + '</button><button class="cas-pari c" data-cas="pari:impair">Impair<small>×2</small>' + jet('impair') + '</button></div>' +
    '<div class="cas-numeros"><button class="z" data-cas="pari:n0" style="background:#2fae5a">0' + jet('n0') + '</button>' + nums + '</div></div>' +
    '<div class="cas-jetons">' + [[10, '#5aa02c'], [50, '#3a95d1'], [100, '#c8323e'], [500, '#2a2630']].filter(([v]) => v <= miseMax()).map(([v, c]) => '<button data-cas="jeton:' + v + '" class="' + (casinoJeton === v ? 'sel' : '') + '" style="background:' + c + '">' + v + '</button>').join('') + '<button class="btn discret" data-cas="effacer">Effacer</button></div>' +
    '<div style="font-size:.7rem;text-align:center;margin-top:6px">Un numéro paie ×36 · sur le 0 vert, la maison gagne les chances simples</div>' +
    piedMise(true) + '<button class="btn kamas grand" data-cas="bille" style="width:100%;margin-top:8px"' + (casinoTourne ? ' disabled' : '') + '>Lancer la bille</button>');
}
function lancerBille() {
  if (casinoTourne) return; const tot = totalParis(); if (!peutMiser(tot)) return;
  miser(tot); const n = Math.floor(Math.random() * 37), paris = casinoParis; casinoParis = {};
  let gain = 0; Object.entries(paris).forEach(([k, v]) => {
    if (k === 'rouge' && ROUGES.has(n)) gain += v * 2; else if (k === 'noir' && n && !ROUGES.has(n)) gain += v * 2;
    else if (k === 'pair' && n && n % 2 === 0) gain += v * 2; else if (k === 'impair' && n % 2 === 1) gain += v * 2; else if (k === 'n' + n) gain += v * 36; });
  const i = ORDRE_ROUE.indexOf(n), cible = -(i + 0.5) * 360 / 37; casinoRoue = casinoRoue - (casinoRoue % 360) - 360 * 5 + cible; casinoTourne = true;
  const html = '<span style="color:' + coulNum(n) + '">' + n + '</span><small>' + (n === 0 ? 'Le zéro vert' : (ROUGES.has(n) ? 'Rouge' : 'Noir') + ', ' + (n % 2 ? 'impair' : 'pair')) + (gain ? ' : tu gagnes ' + fmt(gain) + ' kamas !' : ' : perdu') + '</small>';
  ouvrirRoulette({ gain: 0, html: 'La bille roule...<small>&nbsp;</small>' }); son('plouf');
  const roue = $('cas-roue'); if (roue) { roue.style.transform = 'rotate(' + (casinoRoue + 360 * 5) + 'deg)'; requestAnimationFrame(() => { roue.style.transform = 'rotate(' + casinoRoue + 'deg)'; }); }
  setTimeout(() => { casinoTourne = false; payer(gain); if (modaleOuverte === 'roulette') ouvrirRoulette({ gain, html }); else toast('Roulette : ' + n + (gain ? ', +' + fmt(gain) + ' kamas' : ', perdu'), gain ? 'or' : ''); }, 3400);
}

/* ---------- la course de Dragodindes ---------- */
const DRAGOS = [{ id: 'DragoRousse', nom: 'Rousse', coul: '#c8642e', cote: 2.5, trait: 'rapide au départ' }, { id: 'DragoIndigo', nom: 'Indigo', coul: '#4a5aa8', cote: 3, trait: 'régulière' },
  { id: 'DragoEbene', nom: 'Ébène', coul: '#3a3440', cote: 4, trait: 'finit fort' }, { id: 'DragoDoree', nom: 'Dorée', coul: '#e8b84a', cote: 7.5, trait: 'imprévisible' }];
function ouvrirCourse(res) {
  ouvrirModale('course', entete('La course de Dragodindes') + (res ? '<div class="cas-res' + (res.gain ? ' gagne' : '') + '">' + res.html + '</div>' : '<p style="font-size:.78rem;font-weight:600;margin:0 0 6px">Choisis ta Dragodinde et ta mise : elles font un tour de la grande piste, et tu regardes l\'arrivée depuis la tribune.</p>') +
    DRAGOS.map((d, i) => '<div class="cas-coureur' + (casinoDrago === i ? ' sel' : '') + '"><span class="pastille" style="background:' + d.coul + '"></span><div><b>' + d.nom + '</b><br><span class="puce">' + d.trait + '</span></div><span class="cas-cote">×' + String(d.cote).replace('.', ',') + '</span><button class="btn ' + (casinoDrago === i ? '' : 'discret') + '" data-cas="drago:' + i + '">' + (casinoDrago === i ? '✓ Choisie' : 'Choisir') + '</button></div>').join('') +
    piedMise() + '<button class="btn kamas grand" data-cas="course" style="width:100%;margin-top:8px"' + (course ? ' disabled' : '') + '>Lancer la course</button>');
}
/* LA COURSE SUR LA GRANDE PISTE (07/11/2026 : « un vrai hippodrome, plus grand, et une course un peu plus longue », Mathieu) : un tour complet du stade,
   depart et arrivee sous le portique d'or, devant la tribune ; le gagnant boucle le tour en COURSE_TOUR s, chacun dans son couloir ; le perso regarde
   depuis le passage de la tribune, la camera cadre toute la piste */
const COURSE_TOUR = 22, COULOIRS = [-0.84, -0.28, 0.28, 0.84];
function lancerCourse() {
  if (course || !ileCasino) return; const m = casinoMise; if (!peutMiser(m)) return;
  miser(m); fermerModale();
  const poids = DRAGOS.map((d) => 0.9 / d.cote), tot = poids.reduce((a, b) => a + b, 0); let r = Math.random() * tot, gagnant = 0; for (let i = 0; i < 4; i++) { r -= poids[i]; if (r < 0) { gagnant = i; break; } }
  const autres = [0, 1, 2, 3].filter((i) => i !== gagnant).sort(() => Math.random() - 0.5), temps = []; temps[gagnant] = COURSE_TOUR;
  autres.forEach((i, k) => { temps[i] = COURSE_TOUR + 0.6 + k * (0.7 + Math.random() * 1.1); });
  const meshes = DRAGOS.map((d) => { const g = cloner('course_' + d.id); scene.add(g); return g; });
  course = { t: -1.5, temps, gagnant, choix: casinoDrago, mise: m, meshes, fin: Math.max(...temps) + 1, alea: DRAGOS.map(() => Math.random() * 6) };
  course.zoom = zoom; zoom = 0.95; cadrer(); VISEE.set(CASINO.x + STADE_CASINO.cx, 0.6, CASINO.z + STADE_CASINO.cz - 0.5); placerCamera(); /* la camera cadre toute la piste */
  const [x, z, vx, vz] = SPOTS.tribune; aller(x, z, vx, vz, null);
  toast('À vos marques... Partez !', 'or'); majCourse(0);
}
function majCourse(dt) {
  if (!course) return; const c = course; c.t += dt;
  const S = STADE_CASINO, tour = 4 * S.a + 2 * Math.PI * S.R;
  c.meshes.forEach((g, i) => {
    const T_ = c.temps[i], t = Math.max(0, c.t), u = Math.min(1, t / T_);
    const f = u >= 1 ? 1 : Math.min(0.998, u + 0.03 * Math.sin(t * 0.9 + c.alea[i]) * u * (1 - u) * 4); /* (des remontees et des coups de mou, sans changer l'arrivee) */
    const p = stadePoint(S.a + f * tour), o = COULOIRS[i];
    g.position.set(CASINO.x + p.x + p.nx * o, CASINO.y + (u < 1 && c.t > 0 ? Math.abs(Math.sin(c.t * 11 + i)) * 0.12 : 0), CASINO.z + p.z + p.nz * o);
    g.rotation.y = Math.atan2(p.tx, p.tz);
  });
  if (c.t >= c.fin) {
    const d = DRAGOS[c.gagnant], gagne = c.choix === c.gagnant, gain = gagne ? Math.round(c.mise * DRAGOS[c.choix].cote) : 0;
    c.meshes.forEach((g) => scene.remove(g)); course = null; payer(gain); compter('courses');
    zoom = c.zoom || 1; cadrer(); VISEE.set(paysanMesh.position.x, 0.6, paysanMesh.position.z); placerCamera();
    ouvrirCourse({ gain, html: (gagne ? 'Gagné !' : 'Perdu...') + '<small>' + d.nom + ' gagne la course' + (gagne ? ' : +' + fmt(gain) + ' kamas' : ', ta ' + DRAGOS[c.choix].nom + ' n\'a pas suffi') + '</small>' });
  }
}

/* ---------- le casino lui-meme : le bilan ---------- */
function ouvrirCasinoInfo(titre) {
  const c = etatCasino(), st = S_.stats || {};
  ouvrirModale('casino', entete(titre || 'Le Casino') + '<div class="art">' + ico('kama') + '<div><b>Ton bilan</b><div class="puces"><span class="puce">misé en tout : ' + fmt(st.casinoMises || 0) + '</span><span class="puce">gagné en tout : ' + fmt(st.casinoGains || 0) + '</span><span class="puce">courses : ' + (st.courses || 0) + '</span></div></div><div></div></div>' +
    '<div class="art">' + ico('jackpot') + '<div><b>Le jackpot : ' + fmt(c.jackpot) + ' kamas</b><div class="desc">Il grossit de 5 % de chaque mise à la machine à sous, et tombe avec 3 Jackpots.</div></div><div></div></div>' +
    '<div class="art">' + ico('cadenas') + '<div><b>Les règles de la maison</b><div class="desc">Mise maximale ' + fmt(miseMax()) + ' kamas (elle monte avec ton niveau). Pertes plafonnées à ' + fmt(plafondPertes()) + ' kamas par jour : aujourd\'hui ' + fmt(perteJour()) + '. Comme dans un vrai casino, la maison garde un petit avantage.</div></div><div></div></div>');
}
function actionCasino(b) {
  const a = b.dataset.cas;
  if (a === 'moins' || a === 'plus') { casinoMise = Math.max(10, Math.min(miseMax(), casinoMise + (a === 'plus' ? 1 : -1) * pasMise())); ({ machine: ouvrirMachine, course: ouvrirCourse, blackjack: ouvrirBlackjack })[modaleOuverte] && ({ machine: ouvrirMachine, course: ouvrirCourse, blackjack: ouvrirBlackjack })[modaleOuverte](); }
  else if (a === 'tirer') tirerMachine();
  else if (a.startsWith('jeton:')) { casinoJeton = +a.slice(6); ouvrirRoulette(); }
  else if (a.startsWith('pari:')) { if (casinoTourne) return; const k = a.slice(5); if (totalParis() + casinoJeton > miseMax()) { toast('Mise maximale : ' + fmt(miseMax()) + ' kamas par lancer.'); return; } casinoParis[k] = (casinoParis[k] || 0) + casinoJeton; ouvrirRoulette(); }
  else if (a === 'effacer') { if (casinoTourne) return; casinoParis = {}; ouvrirRoulette(); }
  else if (a === 'bille') lancerBille();
  else if (a.startsWith('drago:')) { casinoDrago = +a.slice(6); ouvrirCourse(); }
  else if (a === 'bj:donner') bjDonner(); else if (a === 'bj:tirer') bjTirer(); else if (a === 'bj:rester') { if (bj && !bj.fini) bjFin(); } else if (a === 'bj:doubler') bjDoubler();
  else if (a === 'bar:verre') toast('Minou pousse vers toi un lait doré, mousseux et tiède. « Offert par la maison ! »', 'or');
  else if (a.startsWith('salle:')) { const j = a.slice(6); if (j === 'machine') ouvrirMachine(); else if (j === 'roulette') ouvrirRoulette(); else ouvrirCasinoInfo(); }
  else if (a === 'course') lancerCourse();
}

