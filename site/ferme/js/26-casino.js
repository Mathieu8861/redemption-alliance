'use strict';
/* ===================== LE CASINO (« une ile qu'on visite en montgolfiere, avec un casino ou jouer nos kamas », Mathieu, 11/10/2026) =====================
   La montgolfiere est amarree au bord de la ferme. L'ile du Casino (blender/iles.py version 9 et casino.py --jeu) est chargee au premier voyage
   et posee loin de la ferme, dans la meme scene ; la camera et le perso y vont. Le perso s'y promene en ligne droite ; on touche un jeu pour y aller.
   Trois jeux : machine a sous, roulette rouge et noir, course de Dragodindes (jouee en vrai sur la piste de l'ile).
   Garde-fous : une mise maximale selon le niveau, un plafond de pertes par jour ; la maison garde un petit avantage (environ 93 % rendus). */
const NIV_MONTGOLFIERE = 15, PRIX_MONTGOLFIERE = 3000;
const CASINO = new T.Vector3(0, 0, 240), POS_MONTGOLFIERE = new T.Vector3((MONTGOLFIERE_CASE[0] - (COLS - 1) / 2) * S, 0, (MONTGOLFIERE_CASE[1] - (ROWS - 1) / 2) * S); /* (x -11, z -4 : sa case, au bord du depart) */
let ileCasino = null, casinoMarche = null, montgolfiereMesh = null, course = null, casinoTourne = false;
let casinoMise = 100, casinoJeton = 10, casinoParis = {}, casinoRoue = 0, casinoDrago = 0;
const miseMax = () => 100 + 15 * niveau(S_.xp);
const plafondPertes = () => 1000 + 100 * niveau(S_.xp);
const attendreMs = (ms) => new Promise((r) => setTimeout(r, ms));
function etatCasino() { S_.casino = S_.casino || { jackpot: 5000 }; const j = jourJeu(); if (S_.casino.jour !== j) Object.assign(S_.casino, { jour: j, pertes: 0 }); return S_.casino; }
const perteJour = () => Math.max(0, etatCasino().pertes || 0);
const creditMax = () => 3 * miseMax();
const dette = () => (S_.ardoise && S_.ardoise.dette) || 0;
function peutMiser(m) {
  if (m <= 0) { toast('Pose d\'abord une mise.'); return false; }
  if (m > S_.kamas + Math.max(0, creditMax() - dette())) { toast('Même à crédit, la maison ne te suit pas jusque-là : ardoise maximale ' + fmt(creditMax()) + ' kamas.'); return false; }
  if (perteJour() + m > plafondPertes()) { toast('Plafond de pertes du jour atteint (' + fmt(plafondPertes()) + ' kamas) : le Casino te revoit demain.', 'alerte'); return false; }
  return true;
}
function miser(m) {
  const pris = Math.min(S_.kamas, m), credit = m - pris; S_.kamas -= pris;
  if (credit > 0) { S_.ardoise = S_.ardoise || { dette: 0, visites: 0 }; S_.ardoise.dette += credit; toast('Le croupier note ' + fmt(credit) + ' kamas sur ton ardoise.', 'alerte'); }
  etatCasino().pertes += m; compter('casinoMises', m); rendreHaut(); majBarreCasino(); }
function payer(g) {
  if (g > 0) { const d = Math.min(dette(), g); if (d) { S_.ardoise.dette -= d; toast('Tes gains remboursent d\'abord ton ardoise : -' + fmt(d) + '.', 'or'); } S_.kamas += g - d; etatCasino().pertes -= g; compter('casinoGains', g); son('kamas'); }
  rendreHaut(); majBarreCasino(); sauver();
  if (dette() > 0 && S_.kamas <= 0 && lieu === 'casino') setTimeout(expulser, 900); /* fini en negatif : les gros bras te raccompagnent */
}
function majBarreCasino() { if (!S_) return; const c = etatCasino(); $('casino-info').innerHTML = '<b>Île du Casino</b> · pertes du jour ' + fmt(perteJour()) + ' / ' + fmt(plafondPertes()) + ' ' + KAMA + ' · jackpot ' + fmt(c.jackpot) + ' ' + KAMA + (dette() ? ' · <span style="color:var(--rouge)">ardoise ' + fmt(dette()) + '</span>' : ''); }

/* ---------- la montgolfiere de la ferme ---------- */
function poserMontgolfiere() { /* sur sa case (type montgolfiere), tournee comme on l'a choisi dans Amenager ; POS_MONTGOLFIERE suit (retour du Casino, gros bras) */
  if (!MODELES.montgolfiere) return;
  const c = S_ && S_.cases.find((x) => x.type === 'montgolfiere'); if (!c) { if (montgolfiereMesh) montgolfiereMesh.visible = false; return; }
  const q = posCase(c); POS_MONTGOLFIERE.set(q.x, 0, q.z);
  const g = montgolfiereMesh || MODELES.montgolfiere; g.visible = true; g.position.copy(POS_MONTGOLFIERE); g.rotation.set(0, Math.PI + rotDe('montgolfiere'), 0);
  g.traverse((o) => { o.userData.montgolfiere = true; o.userData.cellule = c.id; }); if (!montgolfiereMesh) { scene.add(g); montgolfiereMesh = g; }
}
function ouvrirMontgolfiere() {
  const l = niveau(S_.xp), ok = S_.montgolfiere;
  if (!ok) { ouvrirModale('montgolfiere', entete('La montgolfière') + '<div class="art">' + ico('kama') + '<div><b>Une vieille montgolfière, à réparer</b><div class="desc">Une fois réparée, elle t\'emmènera sur les îles autour de la ferme : le Casino pour jouer tes kamas, puis l\'Arène.</div><div class="puces">' +
    '<span class="puce ' + (l >= NIV_MONTGOLFIERE ? 'bonne' : 'mauvaise') + '">niveau ' + NIV_MONTGOLFIERE + '</span><span class="puce">' + fmt(PRIX_MONTGOLFIERE) + ' kamas</span></div></div>' +
    '<div class="act"><button class="btn kamas" data-montgolfiere="reparer"' + (l < NIV_MONTGOLFIERE || S_.kamas < PRIX_MONTGOLFIERE ? ' disabled' : '') + '>Réparer ' + fmt(PRIX_MONTGOLFIERE) + ' ' + KAMA + '</button></div></div>'); return; }
  /* LA CARTE DES VENTS (14/10/2026) : la montgolfiere emmene sur les iles autour de la ferme ; on choisit sa destination */
  const ile = (img, nom, desc, puces, bouton) => '<div class="art">' + (img ? '<span class="pic img ile"><img src="assets/icones/' + img + '.png?v=' + VERSION_MODELES + '" alt=""></span>' : '<span class="pic ile brume">?</span>') + '<div><b>' + nom + '</b><div class="desc">' + desc + '</div><div class="puces">' + puces + '</div></div><div class="act">' + bouton + '</div></div>';
  const reste = entreesRestantes();
  ouvrirModale('montgolfiere', entete('La carte des vents') + '<p class="hdv-aide">Où t\'emmène la montgolfière ? Pendant ton voyage, ni vague ni simu VSA sur ta ferme.</p>' +
    ile('ile-casino', 'Le Casino', 'Machine à sous, roulette et course de Dragodindes.' + (dette() ? ' <b style="color:var(--rouge)">Fermé tant que ton ardoise de ' + fmt(dette()) + ' kamas n\'est pas réglée.</b>' : ''), '<span class="puce">mise max ' + fmt(miseMax()) + '</span><span class="puce">pertes max ' + fmt(plafondPertes()) + ' par jour</span>', '<button class="btn kamas" data-montgolfiere="partir"' + (dette() ? ' disabled' : '') + '>Partir</button>') +
    ile('ile-arene', 'L\'Arène', 'Des vagues sans fin, de plus en plus dures. Ton record compte au classement de l\'alliance.', '<span class="puce ' + (l >= NIV_ARENE ? 'bonne' : 'mauvaise') + '">niveau ' + NIV_ARENE + '</span><span class="puce ' + (reste ? '' : 'mauvaise') + '">' + reste + ' entrée' + (reste > 1 ? 's' : '') + ' sur ' + ENTREES_ARENE + '</span><span class="puce">ticket ' + fmt(TICKET_ARENE) + '</span>', '<button class="btn kamas" data-montgolfiere="arene">Voir</button>') +
    ile('ile-boss', 'L\'Île des boss', 'Toute la semaine, un nouveau chaque vendredi : un boss colossal, une vie commune pour toute l\'alliance, 3 essais.', '<span class="puce ' + (l >= NIV_ILE_BOSS ? 'bonne' : 'mauvaise') + '">niveau ' + NIV_ILE_BOSS + '</span><span class="puce bonne">cette semaine</span>', '<button class="btn kamas" data-montgolfiere="ileBoss">Voir</button>') +
    ile(null, 'Les donjons', 'Encore dans la brume.', '<span class="puce">bientôt</span>', ''));
}
function actionMontgolfiere(a) {
  if (a === 'reparer') { if (S_.montgolfiere || niveau(S_.xp) < NIV_MONTGOLFIERE || S_.kamas < PRIX_MONTGOLFIERE) return; S_.kamas -= PRIX_MONTGOLFIERE; S_.montgolfiere = true; son('niveau'); toast('La montgolfière est réparée : cap sur l\'île du Casino quand tu veux !', 'or'); rendreHaut(); sauver(); ouvrirMontgolfiere(); }
  else if (a === 'partir') partirCasino();
  else if (a === 'rentrer') { areneSuite = true; rentrerFerme(); areneSuite = false; }
  else if (a === 'arene') ouvrirArene();
  else if (a === 'ileBoss') ouvrirIleBoss();
  else if (a === 'partirIleBoss') partirIleBoss();
  else if (a === 'reclamerIleBoss') reclamerIleBoss();
  else if (a === 'entrerArene') partirArene();
  else if (a === 'carte') ouvrirMontgolfiere();
}

/* ---------- l'ardoise et les gros bras (« si tu finis en negatif au casino, des mecs te renvoient sur ton ile et reviennent te reclamer
   des sous avec interet ; si tu ne les as pas, ils te pillent un peu », Mathieu, 11/10/2026) ----------
   Fini a 0 kama avec une ardoise : Bouboule et Filou te raccompagnent a la ferme. Ensuite, environ toutes les 6 min (et seulement quand tu es la),
   ils debarquent pres de la montgolfiere : l'ardoise prend 10 % d'interets, tu payes tout, une partie, ou ils pillent la grange (la moitie de la dette). */
const VISITE_ARDOISE = 6, INTERETS = 0.1; /* (en vraies minutes) */
let grosBras = null; /* les deux modeles poses sur la ferme pendant une visite */
async function chargerGrosBras() {
  if (MODELES.bouboule) return;
  const sc = await chargerGlb('assets/modeles/jeu/gros-bras.glb?v=' + VERSION_MODELES); versToon(sc, { normales: 0.01, sansContour: SC_MONSTRES });
  MODELES.bouboule = gabarit(sc, 'Bouboule', 2.1, 'y'); MODELES.filou = gabarit(sc, 'Filou', 2.05, 'y');
}
function expulser() {
  if (lieu !== 'casino' || !dette()) return;
  S_.ardoise.prochaine = Date.now() + VISITE_ARDOISE * MIN; sauver();
  ouvrirModale('ardoise', entete('Les gros bras du Casino') + '<div class="art">' + ico('cadenas') + '<div><b>« T\'as plus un kama, et tu nous dois ' + fmt(dette()) + '. »</b><div class="desc">Bouboule et Filou t\'attrapent par le col et te raccompagnent à ta montgolfière. « On passera chez toi récupérer ça. Avec les intérêts. »</div></div><div></div></div><button class="btn kamas grand" data-montgolfiere="rentrer" style="width:100%">Rentrer à la ferme</button>');
}
function verifierRecouvreurs(maintenant) {
  const a = S_.ardoise; if (!a || !a.dette || lieu === 'casino' || combat || raidAnnonce || voleur || grosBras || enAccueil || !joueurPresent()) return;
  if (!a.prochaine) a.prochaine = maintenant + VISITE_ARDOISE * MIN;
  if (maintenant >= a.prochaine) visiteGrosBras();
}
async function visiteGrosBras() {
  if (grosBras) return; grosBras = [];
  try { await chargerGrosBras(); } catch (e) { grosBras = null; return; }
  const a = S_.ardoise; a.visites = (a.visites || 0) + 1; a.dette = Math.round(a.dette * (1 + INTERETS)); a.prochaine = Date.now() + VISITE_ARDOISE * MIN;
  const pp = paysanMesh.position, ici = paysanMesh.userData.cellule; /* ils se plantent juste devant toi */
  const libres = S_.cases.filter((c) => PASSABLE[c.type] && c !== ici).map((c) => [c, posCase(c)]).sort((x, y) => Math.hypot(x[1].x - pp.x, x[1].z - pp.z) - Math.hypot(y[1].x - pp.x, y[1].z - pp.z));
  ['bouboule', 'filou'].forEach((n, k) => { const q = libres[k] ? libres[k][1] : POS_MONTGOLFIERE, g = cloner(n); g.position.set(q.x, q.y || 0, q.z); g.rotation.y = Math.atan2(paysanMesh.position.x - q.x, paysanMesh.position.z - q.z); scene.add(g); pouf(q.x, q.y || 0, q.z, 2.5, '#3a3f4a'); grosBras.push(g); });
  son('alerte'); toast('Les gros bras du Casino débarquent pour ton ardoise !', 'alerte'); ouvrirArdoise();
}
function ouvrirArdoise(msg) {
  const d = dette(), k = S_.kamas;
  ouvrirModale('ardoise', entete('Les gros bras du Casino') + (msg ? '<div class="art">' + ico('grange') + '<div><b>' + msg + '</b></div><div></div></div>' : '') +
    (d ? '<div class="art">' + ico('cadenas') + '<div><b>Filou : « Le patron veut ses ' + fmt(d) + ' kamas. »</b><div class="desc">Ton ardoise prend 10 % d\'intérêts à chaque visite. Bouboule fait tourner sa batte en regardant ta grange.</div></div><div></div></div>' +
      '<div class="boutons" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:8px">' + (k >= d ? '<button class="btn kamas" data-ardoise="tout">Tout payer (' + fmt(d) + ')</button>' : '') +
      (k > 0 && k < d ? '<button class="btn kamas" data-ardoise="partie">Payer ce que j\'ai (' + fmt(k) + ')</button>' : '') + '<button class="btn discret" data-ardoise="refus">Ne pas payer</button></div>'
    : '<div class="art">' + ico('kama') + '<div><b>Ardoise réglée.</b><div class="desc">« Un plaisir de faire affaire. Le Casino t\'attend. » Ils repartent, et tu peux retourner jouer.</div></div><div></div></div><button class="btn grand" data-ardoise="fin" style="width:100%">Au revoir messieurs</button>'));
}
function actionArdoise(a) {
  const ar = S_.ardoise; if (!ar) return;
  if (a === 'tout' && S_.kamas >= ar.dette) { S_.kamas -= ar.dette; ar.dette = 0; son('kamas'); rendreHaut(); sauver(); ouvrirArdoise(); return; }
  if (a === 'partie' && S_.kamas > 0) { const v = Math.min(S_.kamas, ar.dette); S_.kamas -= v; ar.dette -= v; rendreHaut(); sauver(); partirGrosBras('Ils prennent tes ' + fmt(v) + ' kamas. « Il en manque ' + fmt(ar.dette) + '. On repassera. »'); return; }
  if (a === 'refus') { /* ils pillent la grange : des ressources pour la moitie de la dette, au prix de l'HDV */
    let reste = Math.ceil(ar.dette / 2); const pris = [];
    Object.keys(S_.grange).filter((id) => S_.grange[id] > 0 && PAR_ID[id] && PAR_ID[id].prix).sort((x, y) => PAR_ID[y].prix - PAR_ID[x].prix).forEach((id) => {
      if (reste <= 0) return; const prix = PAR_ID[id].prix, n = Math.min(S_.grange[id], Math.ceil(reste / prix)); if (!n) return;
      S_.grange[id] -= n; reste -= n * prix; ar.dette = Math.max(0, Math.round(ar.dette - n * prix)); pris.push(n + ' ' + PAR_ID[id].nom); });
    rendreGrange(); rendreHaut(); sauver(); son('alerte');
    partirGrosBras(pris.length ? 'Bouboule se sert dans ta grange : ' + pris.join(', ') + '. ' + (ar.dette ? '« Il en manque encore ' + fmt(ar.dette) + '. On repassera. »' : '« On est quittes. »') : 'Ta grange est vide... Filou note tout dans son carnet. « On repassera. »');
    return;
  }
  if (a === 'fin') partirGrosBras();
}
function partirGrosBras(msg) {
  if (msg) toast(msg, 'alerte'); fermerModale();
  (grosBras || []).forEach((g) => { pouf(g.position.x, g.position.y, g.position.z, 2.5, '#3a3f4a'); scene.remove(g); }); grosBras = null;
  if (S_.ardoise && !S_.ardoise.dette) toast('Ardoise réglée : le Casino te rouvre ses portes.', 'or');
}

