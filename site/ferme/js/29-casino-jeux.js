'use strict';
/* ---------- se promener sur l'ile ---------- */
const SPOTS = { roulette: [-3.3, -1.9, -3.3, -3.4], machine: [3.4, -2.3, 3.5, -3.6], course: [1.6, 3.4, 1.6, 6.2], casino: [0, -4.4, 0, -7.6], retour: [-9.6, 2.0, -12, 2.0], fontaine: [1.9, 0.9, 0, 0] };
function zoneCasino(x, z) { /* le jeu touche, d'apres le point de l'ile (repere de l'ile) */
  if (x < -10.3 && Math.abs(z - 2) < 1.6) return 'retour';
  if (Math.hypot(x + 3.3, z + 3.4) < 1.5) return 'roulette';
  if (x > 1.9 && x < 5.1 && z > -4.4 && z < -2.8) return 'machine';
  if (Math.abs(x) < 2.8 && z < -5.4) return 'casino';
  if (Math.hypot(x, z) < 1.6) return 'fontaine';
  if (((x - PISTE.x) / (PISTE.A + 0.8)) ** 2 + ((z - PISTE.z) / (PISTE.B + 0.8)) ** 2 < 1) return 'course';
  return null;
}
function aller(x, z, lx, lz, fn) { casinoMarche = { x: CASINO.x + x, z: CASINO.z + z, vers: lx != null ? { x: CASINO.x + lx, z: CASINO.z + lz } : null, fn }; }
function clicCasino(hits) {
  if (course) return;
  for (const h of hits) {
    let o = h.object, perso = false, dansIle = false;
    while (o) { if (o === paysanMesh) perso = true; if (o === ileCasino) dansIle = true; o = o.parent; }
    if (perso) continue; if (!dansIle) continue;
    const lx = h.point.x - CASINO.x, lz = h.point.z - CASINO.z, jeu = zoneCasino(lx, lz); /* (le jeu se reconnait a l'endroit touche : l'export cuit la hierarchie des groupes) */
    if (jeu) { const [x, z, vx, vz] = SPOTS[jeu]; aller(x, z, vx, vz, () => ouvrirJeu(jeu)); return; }
    const r = Math.hypot(lx, lz), k = r > 9.6 ? 9.6 / r : 1; aller(lx * k, lz * k, null, null, null); return;
  }
}
function majCasino(dt) {
  majCourse(dt);
  const u = paysanMesh.userData;
  if (u.angle !== undefined) { let d = u.angle - paysanMesh.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); paysanMesh.rotation.y += d * Math.min(1, dt * 10); }
  if (!casinoMarche) { animerPas(u, dt, 0); paysanMesh.position.y += (CASINO.y - paysanMesh.position.y) * Math.min(1, dt * 12); return; }
  const m = casinoMarche, px = paysanMesh.position.x, pz = paysanMesh.position.z, dx = m.x - px, dz = m.z - pz, d = Math.hypot(dx, dz), v = vitesse() * dt;
  if (d > 0.001) u.angle = Math.atan2(dx, dz);
  if (d <= v) { paysanMesh.position.x = m.x; paysanMesh.position.z = m.z; casinoMarche = null; if (m.vers) u.angle = Math.atan2(m.vers.x - m.x, m.vers.z - m.z); if (m.fn) m.fn(); return; }
  paysanMesh.position.x = px + dx / d * v; paysanMesh.position.z = pz + dz / d * v; u.pas = (u.pas || 0) + v * 4.6; animerPas(u, dt, 1);
  paysanMesh.position.y = CASINO.y + (1 - Math.cos(u.pas * 2)) * 0.012 * (u.ampl || 0);
}
function ouvrirJeu(j) {
  if (j === 'machine') ouvrirMachine(); else if (j === 'roulette') ouvrirRoulette(); else if (j === 'course') ouvrirCourse(); else if (j === 'casino') ouvrirCasinoInfo();
  else if (j === 'retour') ouvrirModale('montgolfiere', entete('La montgolfière') + '<div class="art">' + ico('kama') + '<div><b>Rentrer à la ferme ?</b><div class="desc">Le ballon te ramène au bord de ta ferme.</div></div><div class="act"><button class="btn kamas" data-montgolfiere="rentrer">Rentrer</button></div></div>');
  else if (j === 'fontaine') toast('La fontaine du Casino. On dit que le kama doré du sommet porte chance...');
}
/* le pied commun des jeux : la mise, la mise maximale, la jauge des pertes du jour */
function piedMise(sansMise) {
  const max = miseMax(), p = perteJour(), pl = plafondPertes(); casinoMise = Math.max(10, Math.min(casinoMise, max));
  return '<div class="cas-mise">' + (sansMise ? '<span>mise max ' + fmt(max) + ' ' + KAMA + '</span>' : '<div class="m"><button class="btn discret" data-cas="moins">−</button><b>' + fmt(casinoMise) + ' ' + KAMA + '</b><button class="btn discret" data-cas="plus">+</button></div><span>max ' + fmt(max) + '</span>') +
    '<span>Pertes du jour : ' + fmt(p) + ' / ' + fmt(pl) + '<div class="cas-jauge"><i style="width:' + Math.min(100, 100 * p / pl).toFixed(0) + '%"></i></div></span></div>';
}
const pasMise = () => Math.max(10, Math.round(miseMax() / 10 / 10) * 10);

/* ---------- la machine a sous du Bouftou ---------- */
const SYMBOLES = [['couronne', 'obj-leg-royal', 1, 'Couronnes'], ['dragoeuf', 'drag-dore', 3, 'Dragoeufs'], ['kama', 'kama', 5, 'Kamas'], ['bouftou', 'bouftou', 7, 'Bouftous'], ['tofu', 'tofu', 9, 'Tofus']];
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
  if (n.couronne === 3) { gain = Math.max(m * 50, Math.round(c.jackpot * Math.min(1, m / miseMax()))); c.jackpot = Math.max(5000, c.jackpot - gain); html = 'JACKPOT !<small>3 Couronnes du Bouftou Royal : +' + fmt(gain) + ' kamas</small>'; }
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
const PISTE = { x: 1.6, z: 6.2, A: 2.6, B: 1.5 };
function ouvrirCourse(res) {
  ouvrirModale('course', entete('La course de Dragodindes') + (res ? '<div class="cas-res' + (res.gain ? ' gagne' : '') + '">' + res.html + '</div>' : '<p style="font-size:.78rem;font-weight:600;margin:0 0 6px">Choisis ta Dragodinde et ta mise : la course se court en vrai, sur la piste de l\'île.</p>') +
    DRAGOS.map((d, i) => '<div class="cas-coureur' + (casinoDrago === i ? ' sel' : '') + '"><span class="pastille" style="background:' + d.coul + '"></span><div><b>' + d.nom + '</b><br><span class="puce">' + d.trait + '</span></div><span class="cas-cote">×' + String(d.cote).replace('.', ',') + '</span><button class="btn ' + (casinoDrago === i ? '' : 'discret') + '" data-cas="drago:' + i + '">' + (casinoDrago === i ? '✓ Choisie' : 'Choisir') + '</button></div>').join('') +
    piedMise() + '<button class="btn kamas grand" data-cas="course" style="width:100%;margin-top:8px"' + (course ? ' disabled' : '') + '>Lancer la course</button>');
}
function lancerCourse() {
  if (course || !ileCasino) return; const m = casinoMise; if (!peutMiser(m)) return;
  miser(m); fermerModale();
  const poids = DRAGOS.map((d) => 0.9 / d.cote), tot = poids.reduce((a, b) => a + b, 0); let r = Math.random() * tot, gagnant = 0; for (let i = 0; i < 4; i++) { r -= poids[i]; if (r < 0) { gagnant = i; break; } }
  const autres = [0, 1, 2, 3].filter((i) => i !== gagnant).sort(() => Math.random() - 0.5), temps = []; temps[gagnant] = 8;
  autres.forEach((i, k) => { temps[i] = 8 + 0.35 + k * (0.3 + Math.random() * 0.5); });
  const meshes = DRAGOS.map((d, i) => { const g = cloner('course_' + d.id); scene.add(g); return g; });
  course = { t: -1.2, temps, gagnant, choix: casinoDrago, mise: m, meshes, fin: Math.max(...temps) + 0.8, alea: DRAGOS.map(() => Math.random() * 6) };
  course.zoom = zoom; zoom = Math.max(zoom, 1.7); cadrer(); VISEE.set(CASINO.x + PISTE.x + 0.6, 0.6, CASINO.z + PISTE.z + 0.4); placerCamera(); /* la camera se rapproche de la piste */
  aller(PISTE.x - 0.6, PISTE.z - PISTE.B - 1.1, PISTE.x, PISTE.z, null);
  toast('À vos marques... Partez !', 'or'); majCourse(0);
}
function majCourse(dt) {
  if (!course) return; const c = course; c.t += dt;
  c.meshes.forEach((g, i) => {
    const T_ = c.temps[i], t = Math.max(0, c.t), u = Math.min(1, t / T_);
    const f = u >= 1 ? 1 : Math.min(0.995, u + 0.035 * Math.sin(t * 1.6 + c.alea[i]) * u * (1 - u) * 4);
    const ra = PISTE.A - 0.42 + i * 0.28, rb = PISTE.B - 0.42 + i * 0.28, th = f * Math.PI * 2;
    g.position.set(CASINO.x + PISTE.x + ra * Math.cos(th), CASINO.y + (u < 1 && c.t > 0 ? Math.abs(Math.sin(c.t * 11 + i)) * 0.12 : 0), CASINO.z + PISTE.z + rb * Math.sin(th));
    g.rotation.y = Math.atan2(-ra * Math.sin(th), rb * Math.cos(th));
  });
  if (c.t >= c.fin) {
    const d = DRAGOS[c.gagnant], gagne = c.choix === c.gagnant, gain = gagne ? Math.round(c.mise * DRAGOS[c.choix].cote) : 0;
    c.meshes.forEach((g) => scene.remove(g)); course = null; payer(gain); compter('courses');
    zoom = c.zoom || 1; cadrer(); VISEE.set(CASINO.x + 0.6, 0.6, CASINO.z + 0.6); placerCamera();
    ouvrirCourse({ gain, html: (gagne ? 'Gagné !' : 'Perdu...') + '<small>' + d.nom + ' gagne la course' + (gagne ? ' : +' + fmt(gain) + ' kamas' : ', ta ' + DRAGOS[c.choix].nom + ' n\'a pas suffi') + '</small>' });
  }
}

/* ---------- le casino lui-meme : le bilan ---------- */
function ouvrirCasinoInfo() {
  const c = etatCasino(), st = S_.stats || {};
  ouvrirModale('casino', entete('Le Casino') + '<div class="art">' + ico('kama') + '<div><b>Ton bilan</b><div class="puces"><span class="puce">misé en tout : ' + fmt(st.casinoMises || 0) + '</span><span class="puce">gagné en tout : ' + fmt(st.casinoGains || 0) + '</span><span class="puce">courses : ' + (st.courses || 0) + '</span></div></div><div></div></div>' +
    '<div class="art">' + ico('obj-leg-royal') + '<div><b>Le jackpot : ' + fmt(c.jackpot) + ' kamas</b><div class="desc">Il grossit de 5 % de chaque mise à la machine à sous, et tombe avec 3 Couronnes.</div></div><div></div></div>' +
    '<div class="art">' + ico('cadenas') + '<div><b>Les règles de la maison</b><div class="desc">Mise maximale ' + fmt(miseMax()) + ' kamas (elle monte avec ton niveau). Pertes plafonnées à ' + fmt(plafondPertes()) + ' kamas par jour : aujourd\'hui ' + fmt(perteJour()) + '. Comme dans un vrai casino, la maison garde un petit avantage.</div></div><div></div></div>');
}
function actionCasino(b) {
  const a = b.dataset.cas;
  if (a === 'moins' || a === 'plus') { casinoMise = Math.max(10, Math.min(miseMax(), casinoMise + (a === 'plus' ? 1 : -1) * pasMise())); ({ machine: ouvrirMachine, course: ouvrirCourse })[modaleOuverte] && ({ machine: ouvrirMachine, course: ouvrirCourse })[modaleOuverte](); }
  else if (a === 'tirer') tirerMachine();
  else if (a.startsWith('jeton:')) { casinoJeton = +a.slice(6); ouvrirRoulette(); }
  else if (a.startsWith('pari:')) { if (casinoTourne) return; const k = a.slice(5); if (totalParis() + casinoJeton > miseMax()) { toast('Mise maximale : ' + fmt(miseMax()) + ' kamas par lancer.'); return; } casinoParis[k] = (casinoParis[k] || 0) + casinoJeton; ouvrirRoulette(); }
  else if (a === 'effacer') { if (casinoTourne) return; casinoParis = {}; ouvrirRoulette(); }
  else if (a === 'bille') lancerBille();
  else if (a.startsWith('drago:')) { casinoDrago = +a.slice(6); ouvrirCourse(); }
  else if (a === 'course') lancerCourse();
}

