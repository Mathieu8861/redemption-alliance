'use strict';
/* SCORPAL, LE BOSS SCORPION DE L'ILE (19/11/2026). Dessine par la copine de Mathieu (« ma copine a dessine ce boss pour le boss de l'ile, tu penses on peut
   le faire ? »), passe en 3D par Rodin (qualite haute), raccourci, colore d'apres le dessin, squelette et mouvements faits main (blender/palier11/scorpion-*.py,
   maquettes/boss-scorpion/SCORPION.md). Son nom : « Scorpal » (Mathieu). Boss de l'ile la semaine du samedi 21/11/2026 (« oui, samedi 21/11 »).
   Son kit (« comment on peut le rendre interessant comme boss de l'ile pour qu'il soit pas trop simple », puis au formulaire : la carapace, et le dard + venin,
   les pinces, le balayage de queue) :
   - la CARAPACE : il encaisse 60 % de moins, sauf quand son dard reste plante dans le sol (1,5 s apres chaque piqure) : la, chaque coup compte x2,5. Le
     classement recompense celui qui esquive et punit au bon moment ;
   - le DARD : un cercle rouge sur toi (1,2 s), la queue s'abat ; touche, un venin qui s'empile (5 doses : paralyse 1,5 s) ; le dard reste plante : point faible ;
   - les PINCES : un eventail rouge devant lui (0,9 s) ; pris, il t'attire contre lui et te tient 2 s ;
   - le BALAYAGE de queue : un cercle autour de lui (1 s), il tourne sur lui-meme et te repousse.
   Chiffres de depart, a regler avec Mathieu (mesures sur l'ile, perso de 6 090 PV : coup 250 toutes les 1,5 s, dard 900, pinces 610, balayage 1 000, avant la rage).
   Ses sorts coupent ses coups au contact (comme le Croco, sortCoupe) : sinon, ses coups enchaines ne lui laissaient jamais le temps de piquer. Sur l'ile : 1 500 000 PV pour l'alliance, une fois et demie plus grand, pas de troupe (un duel). */
SQUELETTES_A_CHARGER.push(['scorpion', 'assets/modeles/jeu/scorpion-anime.glb', 3.4]); VITESSE_FAMILLE.scorpion = 1.1; ALLURES.scorpion = { marche: 1.39, course: 3.495 };
const KIT_SCORPAL = {
  carapace: 0.6, ouverture: 2.5,
  dard: { periode: 6.0, prepa: 1.2, R: 2.2, x: 1.25, plante: 1.5, portee: 4.4, venin: { pct: 0.005, duree: 6, max: 5 }, paralysie: 1.5, impact: 0.56 },
  pinces: { periode: 8.0, prepa: 0.9, R: 4.4, ouv: 0.55, x: 0.85, tenu: 2.0, impact: 0.47 },
  balayage: { periode: 7.5, prepa: 1.0, R: 3.6, x: 1.4, repousse: 2.4, tour: 0.6 },
  venin: { periode: 9, leve: 0.45, vol: 1.1, n: 3, R: 1.6, ecart: 2.6, portee: 8, x: 0.6, flaque: { duree: 6, R: 1.6, pct: 0.025 } }, /* (la pluie de venin, 20/11/2026) */
};
MONSTRES.scorpal = { element: 'terre', nom: 'Scorpal', modele: 'scorpion', icone: 'scorpal-v2', boss: true, vagueIle: 100, stable: true, coupDuree: 0.75, sansCri: true, coinceDelai: 2, surCoince: (mo) => fouirScorpal(mo), /* (coince 2 s contre le decor : il s'enfouit et te fonce dessus, 20/11/2026) */ /* (sansCri : il fonce des qu'il sort du portail, sans son cri d'arrivee de 1,6 s sur place, 20/11/2026) */ /* (20/11/2026, « ses attaques sont pas assez rapides » : 0,75 s par coup au lieu de 1, un coup toutes les 1,1 s au lieu de 1,5, 0,85 sur l'ile au lieu de 1,2) */
  desc: 'le seigneur scorpion en armure : sa carapace encaisse 60 % de tes coups, sauf quand son dard reste planté au sol après une piqûre (frappe alors : x2,5). Son dard empoisonne (5 doses : paralysé), ses pinces t\'attirent et te tiennent, sa queue balaie tout autour de lui, et son dard crache du venin en l\'air qui retombe en flaques de poison',
  pv: () => 60000, deg: () => 112, cadence: 1.1, vitesse: 2.6, portee: 3.0, ombre: 4.2, degSort: 3.2, scorpKit: KIT_SCORPAL, appelStun: KIT_SCORPAL.pinces.tenu };
PV_ILE_BOSS_PAR.scorpal = 1500000;
/* SCORPAL RENFORCE SUR L'ILE (20/11/2026, « vu que c'est l'ile du boss, boost-le comme pour le Bworker », Mathieu) : les memes leviers et les memes proportions que
   le Bworker et le Craqueleur (RENFORT_ILE, 27-arene.js) : ses trois sorts reviennent plus souvent (dard toutes les 4,5 s au lieu de 6, pinces 6 au lieu de 8,
   balayage 5,5 au lieu de 7,5), moins de temps pour sortir des cercles (0,9 / 0,7 / 0,75 s au lieu de 1,2 / 0,9 / 1), des cercles plus grands (+20 %), des sorts
   qui tapent +30 %, un coup toutes les 1,2 s au lieu de 1,5, ses coups +30 %, une carapace de 65 % au lieu de 60 (comme l'armure du Bworker, +10 points sur 30),
   la marche +15 % et 25 % plus vite sur l'ile (VITESSE_ILE). Le dard reste plante 1,5 s (2,5 s jusqu'au 20/11/2026 : « il reste trop longtemps a ne plus rien faire », Mathieu). Toujours sans troupe : un duel. */
const KIT_SCORPAL_ILE = { carapace: 0.65, ouverture: 2.5,
  dard: Object.assign({}, KIT_SCORPAL.dard, { periode: 4.5, prepa: 0.9, R: 2.65, x: 1.62, portee: 5.2 }),
  pinces: Object.assign({}, KIT_SCORPAL.pinces, { periode: 6.0, prepa: 0.7, R: 5.0, x: 1.1 }),
  balayage: Object.assign({}, KIT_SCORPAL.balayage, { periode: 5.5, prepa: 0.75, R: 4.2, x: 1.82 }),
  venin: Object.assign({}, KIT_SCORPAL.venin, { periode: 7, vol: 1.0, R: 1.9, x: 0.78, flaque: { duree: 6, R: 1.9, pct: 0.03 } }) }; /* (sur l'ile : plus souvent, plus grand, plus fort, comme ses autres sorts) */
RENFORT_ILE.scorpal = { d: { cadence: 0.85, scorpKit: KIT_SCORPAL_ILE }, deg: 1.3, vit: 1.15 }; VITESSE_ILE.scorpal = 1.25;
GROUPES_DEV.scorpal = { nom: 'Scorpal (le boss de l\'île du 21/11)', liste: { scorpal: 1 } }; AVANT_PREMIERE.unshift('scorpal');
/* sa semaine sur l'ile : celle qui commence le samedi 21/11/2026 (cle du vendredi 20/11) ; le Chafer Cuirasse reviendra a son tour dans la rotation */
const SEMAINES_SCORPAL = { '2026-11-20': 'scorpal' }, BOSS_ILE_HORS_ROTATION = ['scorpal']; /* (et dans le choix du boss de l'ile du mode test) */
const bossDuJourScorpal = bossDuJour; bossDuJour = function (cle) { if (!(MODE_TEST && ETAT_TEST.ileBoss) && SEMAINES_SCORPAL[cle]) return SEMAINES_SCORPAL[cle]; return bossDuJourScorpal.apply(this, arguments); };
/* ---------------- la carapace ---------------- */
const blesserScorpal = blesser; blesser = function (mo, n, gros, src) {
  if (mo && mo.d && mo.d.scorpKit && mo.etat === 'actif' && n > 0) {
    const K = mo.d.scorpKit, ouvert = mo.dardPlante > 0; n = Math.max(1, Math.round(n * (ouvert ? K.ouverture : 1 - K.carapace)));
    const c = combat; if (c && !ouvert && !c.carapaceVu) { c.carapaceVu = true; toast('Sa carapace encaisse ' + Math.round(K.carapace * 100) + ' % de tes coups : frappe quand son dard reste planté au sol (x' + String(K.ouverture).replace('.', ',') + ') !', 'alerte'); }
    if (!ouvert && (mo.carapaceVuT || 0) < performance.now()) { mo.carapaceVuT = performance.now() + 2500; const p = mo.m.position.clone(); p.y += (mo.haut || 3) * 0.7; chiffre('Carapace', p); }
  }
  return blesserScorpal.call(this, mo, n, gros, src);
};
const echelleS = (mo) => mo.echelle || 1;
const jouerGeste = (mo, fam, prepa, impact) => { const an = mo.m && mo.m.userData.anim, nom = an && an.F[fam] && an.F[fam][0]; if (!nom) return null; const a = jouerAnim(an, nom, 0.1); if (a) a.timeScale = impact / prepa; return a; };
/* ---------------- le dard ---------------- */
/* LE DARD SOUTERRAIN (20/11/2026, « on voit pas d'animation ou il reste bloque a cause de son dard, les joueurs vont pas comprendre », Mathieu, puis
   formulaire : « dard souterrain ») : sa queue est trop courte pour piquer le sol devant lui ; il la plonge dans le sable derriere lui (pique_1,
   blender/palier11/scorpion-anime.py) et le dard jaillit du sol sous le cercle rouge. La queue reste enfoncee (coince_1) : il tire dessus deux fois, la
   terre gicle, un anneau dore se vide autour (le temps qui reste pour frapper) ; puis il l'arrache (arrache_1) et le dard rentre sous terre */
function capScorpDard(mo, ctx) {
  const K = mo.d.scorpKit; if (!K || mo.etat !== 'actif' || (mo.geste && !mo.geste.coup) || mo.dardPlante > 0 || mo.tourne) return; const D = K.dard, { pp, sortPret } = ctx, e = echelleS(mo);
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('scorpDardT', D.periode) || dP > D.portee * e + 2.5) return;
  const c0 = combat; mo.scorpDardT = 0; const a = Math.atan2(pp.x - mo.x, pp.z - mo.z), r = Math.min(dP, D.portee * e), x = mo.x + Math.sin(a) * r, z = mo.z + Math.cos(a) * r;
  mo.ry = a; mo.bloqueT = D.prepa + D.plante + 0.3; mo.cd = Math.max(mo.cd || 0, D.prepa + D.plante + 0.25); /* (le dard plante 1,5 s, puis 0,4 s pour l'arracher) */
  const an = jouerGeste(mo, 'pique', D.prepa, D.impact) || jouerGeste(mo, 'sort', D.prepa, D.impact); mo.geste = { t: 0, d: D.prepa + D.plante + 0.4 };
  if (!c0.dardVu) { c0.dardVu = true; toast(leNom(mo.d) + ' plante sa queue dans le sable : sors du cercle rouge, son dard va en jaillir ! Ensuite sa queue reste coincée : c\'est là qu\'il faut frapper.', 'alerte'); }
  zoneDanger({ mo, x, z, r: D.R * Math.min(1.3, e), duree: D.prepa, effet: (d) => {
    const y = solA(x, z); onde(x, y + 0.05, z, D.R * e, '#c7a2ff', 0.4, 0.7); secousse(0.1, 0.22);
    const p = paysanMesh.position, c = combat;
    if (dansDanger(d, p.x, p.z) && c === c0 && !c.fin) {
      if (blesserPerso(Math.max(1, Math.round(degSort(mo) * D.x)), mo) && !(c.invincible > 0)) {
        const V = D.venin, P = (c.poisons = c.poisons || []), L = P.filter((q) => q.scorpVenin);
        if (L.length >= V.max - 1) { P.splice(0, P.length, ...P.filter((q) => !q.scorpVenin)); etourdir(D.paralysie); const q = p.clone(); q.y += 2.2; chiffre('Paralysé !', q, 'vol'); toast('Cinq doses de venin : tu es paralysé !', 'alerte'); }
        else P.push({ pct: V.pct, t: V.duree, scorpVenin: true });
      }
    }
    if (c0.fin || mo.etat !== 'actif') return;
    /* le dard reste plante : la queue coincee, le point faible */
    const dard = dardJaillit(x, z, e, c0, D.plante), Q = queueEnterree(mo), anim = mo.m.userData.anim, nomC = anim && anim.F.coince && anim.F.coince[0], tsC = (24 / 30 * 2) / D.plante;
    if (nomC) { const ac = jouerAnim(anim, nomC, 0.1); if (ac) { ac.setLoop(T.LoopRepeat, Infinity); ac.clampWhenFinished = false; ac.timeScale = tsC; } } else if (an) an.paused = true;
    const yq = solA(Q.x, Q.z); mottes(Q.x, yq, Q.z, 12, 1.3); poussiere(Q.x, yq, Q.z, 10, 1.2 * e, '#d8b67a'); onde(Q.x, yq + 0.05, Q.z, 1.4 * e, '#e8cf9a', 0.35, 0.8);
    const anneau = anneauDard(Q, e), cratere = new T.Mesh(new T.CircleGeometry(0.75 * e, 24), fxMat('#7a5a34', 0.55)); cratere.rotation.x = -Math.PI / 2; cratere.position.set(Q.x, yq + 0.04, Q.z); cratere.renderOrder = 2; sansClic(cratere); scene.add(cratere);
    mo.dardPlante = D.plante; const q = mo.m.position.clone(); q.y += (mo.haut || 3) * 0.6; chiffre('Queue coincée !', q, 'vol'); marquerPointFaible(mo, D.plante);
    let t = 0, tir = 0.28 / tsC; const periode = 0.8 / tsC;
    effets.push((dt) => { t += dt; const fini = combat !== c0 || c0.fin || mo.etat !== 'actif';
      if (fini || t >= D.plante) { mo.dardPlante = 0; anneau.fin(); dard.rentrer();
        if (!fini) { const nomA = anim && anim.F.arrache && anim.F.arrache[0]; if (nomA) jouerAnim(anim, nomA, 0.06); else if (an) { an.paused = false; an.timeScale = 1; }
          mottes(Q.x, yq, Q.z, 16, 1.6); poussiere(Q.x, yq, Q.z, 14, 1.5 * e, '#d8b67a'); secousse(0.08, 0.18); }
        let tc = 0; effets.push((d2) => { tc += d2; cratere.material.opacity = 0.55 * Math.max(0, 1 - tc / 2.5); if (tc >= 2.5 || combat !== c0) { jeter(cratere); return true; } return false; }); return true; }
      mo.dardPlante = Math.max(0, D.plante - t); anneau.maj(1 - t / D.plante);
      if (t >= tir) { tir += periode; mottes(Q.x, yq, Q.z, 5, 0.8); poussiere(Q.x, yq, Q.z, 4, 0.7 * e, '#d8b67a'); dard.secouer(); } /* (chaque traction : la terre gicle, le dard tremble) */
      return false; });
  } });
}
/* ou la queue entre dans le sable : le bout de queue8 (sinon une longueur de corps derriere lui) */
function queueEnterree(mo) { const o = mo.m.getObjectByName('queue8'), v = new T.Vector3(); if (o) { o.getWorldPosition(v); return { x: v.x, z: v.z }; } const L = 3.3 * (mo.m.scale.x || 1); return { x: mo.x - Math.sin(mo.ry) * L, z: mo.z - Math.cos(mo.ry) * L }; }
/* le dard qui jaillit du sol sous le cercle : une pointe sombre et recourbee, une gerbe de sable ; il tremble a chaque traction, puis rentre sous terre */
let GEO_DARD = null;
function dardJaillit(x, z, e, c0, duree) {
  if (!GEO_DARD) { const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push(new T.Vector2(0.34 * Math.pow(1 - u, 0.8) + 0.02, u * 2.4)); } GEO_DARD = { g: new T.LatheGeometry(pts, 12), b: new T.CylinderGeometry(0.42, 0.5, 0.35, 12) }; partager(GEO_DARD.g, GEO_DARD.b); }
  const y = solA(x, z), g = new T.Group(), pointe = new T.Mesh(GEO_DARD.g, mat('#2b3762')), bague = new T.Mesh(GEO_DARD.b, mat('#3b4a80')); pointe.position.y = 0.1; bague.position.y = 0.12; g.add(pointe, bague);
  pointe.rotation.z = 0.18; g.rotation.y = Math.random() * 6.28; g.scale.setScalar(0.75 * Math.min(1.4, e)); g.position.set(x, y - 2.6, z); sansClic(g); scene.add(g);
  mottes(x, y, z, 14, 1.6); poussiere(x, y, z, 12, 1.4, '#d8b67a'); pouf(x, y + 0.3, z, 2.2, '#c7a2ff');
  let t = 0, sec = 0, sort = 1, rentre = false;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin) { jeter(g); return true; }
    if (!rentre) { const k = Math.min(1, t / 0.12); g.position.y = y - 2.6 * (1 - k); } else { sort -= dt / 0.25; g.position.y = y - 2.6 * (1 - Math.max(0, sort)); if (sort <= 0) { jeter(g); return true; } }
    if (sec > 0) { sec -= dt; g.rotation.x = 0.12 * Math.sin(sec * 40) * sec / 0.3; } return false; });
  return { secouer: () => { sec = 0.3; }, rentrer: () => { if (!rentre) { rentre = true; const yy = solA(x, z); mottes(x, yy, z, 8, 1.0); poussiere(x, yy, z, 6, 0.9, '#d8b67a'); } } };
}
/* l'anneau dore autour de la queue enfoncee : il se vide avec le temps qui reste pour frapper */
function anneauDard(Q, e) {
  const y = solA(Q.x, Q.z) + 0.07, R0 = 1.05 * Math.min(1.4, e), fond = new T.Mesh(new T.RingGeometry(R0, R0 + 0.16, 48), fxMat('#ffcf4a', 0.22)), arc = new T.Mesh(new T.RingGeometry(R0, R0 + 0.16, 48), fxMat('#ffd84a', 0.95));
  [fond, arc].forEach((m) => { m.rotation.x = -Math.PI / 2; m.position.set(Q.x, y, Q.z); m.renderOrder = 4; sansClic(m); scene.add(m); }); let der = -1;
  return { maj: (k) => { const n = Math.round(Math.max(0, k) * 48); if (n === der) return; der = n; arc.geometry.dispose(); arc.geometry = new T.RingGeometry(R0, R0 + 0.16, Math.max(1, n), 1, Math.PI / 2, Math.PI * 2 * Math.max(0.001, k)); },
    fin: () => { jeter(fond); jeter(arc); } };
}
/* le point faible : une lueur doree qui pulse au bout de la queue, tant que le dard est plante */
let texPointFaible = null;
function marquerPointFaible(mo, duree) {
  texPointFaible = texPointFaible || texCanvas(64, (g, n) => { const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); r.addColorStop(0, 'rgba(255,250,200,1)'); r.addColorStop(0.4, 'rgba(255,200,60,0.7)'); r.addColorStop(1, 'rgba(255,140,0,0)'); g.fillStyle = r; g.fillRect(0, 0, n, n); });
  const s = new T.Sprite(new T.SpriteMaterial({ map: texPointFaible, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending })); s.renderOrder = 8; scene.add(s);
  const os = mo.m.getObjectByName('queue6') || mo.m.getObjectByName('queue7'), v = new T.Vector3(), c0 = combat; let t = 0; /* (queue6 : le haut de la courbe, au-dessus du sable ou la queue s'enfonce) */
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif' || t >= duree) { scene.remove(s); s.material.dispose(); return true; }
    if (os) os.getWorldPosition(v); else v.set(mo.x, (mo.haut || 3) * 0.5, mo.z); s.position.copy(v); s.scale.setScalar((1.4 + 0.35 * Math.sin(t * 12)) * echelleS(mo)); return false; });
}
/* COINCE, IL S'ENFOUIT (20/11/2026, « plutot que de foncer en ligne betement, pour le scorpion, lorsqu'il reste bloque plus de 2 s contre un obstacle, il
   s'enfouit sous terre et nous fonce dessus », Mathieu) : bloque 2 s (suivreCoince, 21-combat.js), il s'enfonce dans le sable, une trainee de sable file
   sous terre vers toi (7 de vitesse, 3 s au plus), un cercle rouge s'allume 0,6 s sous tes pieds, puis il jaillit : des degats et tu es repousse */
const FOUIR_SCORPAL = { desc: 0.6, vitesse: 7, max: 3, alerte: 0.6, R: 2.4, x: 1.2, repousse: 2.2 };
function fouirScorpal(mo) {
  if (mo.etat !== 'actif' || mo.dardPlante > 0 || mo.tourne || mo.plonge || (mo.geste && !mo.geste.coup)) return false;
  const c0 = combat, F = FOUIR_SCORPAL, e = echelleS(mo), H = (mo.haut || 3) * 1.05, x0 = mo.x, z0 = mo.z, y0 = solA(x0, z0); mo.plonge = true; mo.bloqueT = 99; mo.cd = Math.max(mo.cd || 0, 1);
  if (!c0.fouirVu) { c0.fouirVu = true; toast(leNom(mo.d) + ' s\'enfouit dans le sable et file vers toi : quand le cercle rouge s\'allume sous tes pieds, écarte-toi !', 'alerte'); }
  let t = 0, sous = false, px = x0, pz = z0, alerte = null;
  const fin = () => { mo.hop = 0; mo.plonge = false; if (mo.etat === 'enfoui') mo.etat = 'actif'; mo.m.visible = true; mo.bloqueT = 0.2; };
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat === 'mort') { fin(); return true; }
    if (t < F.desc) { const k = t / F.desc; mo.hop = -H * k * k; if (Math.random() < dt * 25) mottes(x0, y0, z0, 2, 1.4); return false; } /* (il s'enfonce) */
    if (!sous) { sous = true; mo.hop = 0; mo.etat = 'enfoui'; mo.m.visible = false; mo.barre.hidden = true; secousse(0.1, 0.25); mottes(x0, y0, z0, 10, 1.8); poussiere(x0, y0, z0, 12, 2, '#d8b67a'); }
    const p = paysanMesh.position;
    if (alerte == null) { const d = Math.hypot(p.x - px, p.z - pz);
      if (d > 1.0 && t < F.desc + F.max) { const pas = Math.min(d, F.vitesse * dt); px += (p.x - px) / d * pas; pz += (p.z - pz) / d * pas; const y = solA(px, pz); if (Math.random() < dt * 30) { mottes(px, y, pz, 2, 0.8); poussiere(px, y, pz, 2, 0.8, '#d8b67a'); } return false; } /* (la trainee sous le sable, qui te suit) */
      const q = combat.genre === 'ile' && ileBoss ? bornerIle(px, pz, 0.9) : [px, pz]; px = q[0]; pz = q[1]; alerte = t; /* arrive sous toi : le cercle rouge */
      zoneDanger({ mo, x: px, z: pz, r: F.R * Math.min(1.3, e), duree: F.alerte, effet: (dz) => { const y = solA(px, pz), c = combat; mottes(px, y, pz, 16, 2.2); poussiere(px, y, pz, 14, 2.2, '#d8b67a'); onde(px, y + 0.05, pz, F.R * e, '#e8cf9a', 0.4, 0.8); secousse(0.14, 0.3);
        const p2 = paysanMesh.position; if (c === c0 && !c.fin && dansDanger(dz, p2.x, p2.z) && blesserPerso(Math.max(1, Math.round(degSort(mo) * F.x)), mo)) repousserPerso({ x: px, z: pz }, F.repousse); } });
      return false; }
    if (t < alerte + F.alerte) { if (Math.random() < dt * 20) poussiere(px + (Math.random() - 0.5) * 2, solA(px, pz), pz + (Math.random() - 0.5) * 2, 1, 0.6, '#d8b67a'); return false; }
    /* il jaillit, comme un monstre qui grimpe hors du sol */
    mo.x = px; mo.z = pz; mo.y = solA(px, pz); mo.dep = { x: px, y: mo.y - H, z: pz, friche: true }; mo.t = 0.3; mo.etat = 'grimpe'; mo.m.visible = true; mo.hop = 0; mo.plonge = false;
    mo.ry = Math.atan2(p.x - px, p.z - pz); mo.m.rotation.y = mo.ry; mo.bloqueT = 0.3; mo.cd = Math.min(mo.cd || 0, 0.5); mo.route = null; mo.routeIle = null; mo.coinceT = 0; return true; });
  return true;
}
/* ---------------- les pinces ---------------- */
function attirerScorpal(mo, dist) {
  const p = paysanMesh.position, a = Math.atan2(p.x - mo.x, p.z - mo.z), f = pointValide(mo.x, mo.z, mo.x + Math.sin(a) * dist, mo.z + Math.cos(a) * dist), x0 = p.x, z0 = p.z, c0 = combat; let t = 0;
  chemin = []; arrivee = null; const q = p.clone(); q.y += 2.1; chiffre('Saisi !', q, 'vol');
  effets.push((dt) => { t += dt / 0.3; if (combat !== c0) return true; const k = Math.min(1, t); paysanMesh.position.x = x0 + (f.x - x0) * k; paysanMesh.position.z = z0 + (f.z - z0) * k;
    if (k >= 1) { const c = caseIci(f.x, f.z); if (c) paysanMesh.userData.cellule = c; etourdir(mo.d.appelStun || 2); return true; } return false; });
}
function capScorpPinces(mo, ctx) {
  const K = mo.d.scorpKit; if (!K || mo.etat !== 'actif' || (mo.geste && !mo.geste.coup) || mo.dardPlante > 0 || mo.tourne) return; const P = K.pinces, { pp, sortPret } = ctx, e = echelleS(mo);
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('scorpPincesT', P.periode) || dP > P.R * e - 0.4) return;
  const c0 = combat; mo.scorpPincesT = 0; const a = Math.atan2(pp.x - mo.x, pp.z - mo.z); mo.ry = a; mo.bloqueT = P.prepa + 0.25; mo.cd = Math.max(mo.cd || 0, P.prepa + 0.2);
  jouerGeste(mo, 'coup', P.prepa, P.impact); mo.geste = { t: 0, d: P.prepa + 0.3 };
  if (!c0.pincesVu) { c0.pincesVu = true; toast(leNom(mo.d) + ' ouvre ses pinces : sors de l\'éventail rouge, sinon il t\'attire et te tient 2 s !', 'alerte'); }
  zoneDanger({ mo, x: mo.x, z: mo.z, r: P.R * e, a, ouv: P.ouv, duree: P.prepa, effet: (d) => { const p = paysanMesh.position, c = combat; secousse(0.06, 0.15);
    if (dansDanger(d, p.x, p.z) && c === c0 && !c.fin && blesserPerso(Math.max(1, Math.round(degSort(mo) * P.x)), mo) && !(c.invincible > 0)) attirerScorpal(mo, 1.7 * e); } });
}
/* ---------------- le balayage de queue ---------------- */
function capScorpBalayage(mo, ctx) {
  const K = mo.d.scorpKit; if (!K || mo.etat !== 'actif' || (mo.geste && !mo.geste.coup) || mo.dardPlante > 0 || mo.tourne) return; const B = K.balayage, { pp, sortPret } = ctx, e = echelleS(mo);
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('scorpBalayageT', B.periode) || dP > B.R * e - 0.3) return;
  const c0 = combat, x0 = mo.x, z0 = mo.z; mo.scorpBalayageT = 0; mo.bloqueT = B.prepa + B.tour + 0.1; mo.cd = Math.max(mo.cd || 0, B.prepa + B.tour + 0.1); mo.geste = { t: 0, d: B.prepa + B.tour + 0.1 };
  if (!c0.balayageVu) { c0.balayageVu = true; toast(leNom(mo.d) + ' arme sa queue pour tout balayer autour de lui : sors du cercle !', 'alerte'); }
  let t = 0; effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') { mo.tourne = 0; return true; }
    if (t < B.prepa) { const k = Math.min(1, t / B.prepa); mo.tourne = -0.6 * k * k; return false; }
    const u = Math.min(1, (t - B.prepa) / B.tour), s = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; mo.tourne = -0.6 + s * (Math.PI * 2 + 0.6);
    if (u >= 1) { mo.tourne = 0; return true; } return false; });
  zoneDanger({ mo, x: x0, z: z0, r: B.R * e, duree: B.prepa, effet: (d) => { const y = solA(x0, z0); onde(x0, y + 0.05, z0, B.R * e, '#ffffff', 0.4, 0.8); secousse(0.08, 0.2);
    const p = paysanMesh.position; if (dansDanger(d, p.x, p.z) && combat === c0 && !c0.fin && blesserPerso(Math.max(1, Math.round(degSort(mo) * B.x)), mo)) repousserPerso(mo, B.repousse); } });
}
/* ---------------- la pluie de venin (20/11/2026, « il lui faudrait une attaque ou avec son dard il envoie 3 tirs en l'air qui sont en finalite des flaques de
   poison », Mathieu) : il dresse sa queue, trois cercles verts au sol (sur toi et autour), trois boules de venin partent de son dard vers le ciel et retombent
   dedans (touche : des degats) ; la ou elles tombent, une flaque de poison reste 6 s (dedans : 2,5 % de ta vie par seconde, 3 % sur l'ile) ---------------- */
let GEO_VENIN = null;
function bouleVenin() { if (!GEO_VENIN) { GEO_VENIN = { g: new T.IcosahedronGeometry(0.26, 1), c: new T.IcosahedronGeometry(0.14, 1), m: new T.MeshBasicMaterial({ color: '#6fe03a' }), mc: new T.MeshBasicMaterial({ color: '#e8ffb0' }) }; partager(...Object.values(GEO_VENIN)); }
  const g = new T.Group(); g.add(new T.Mesh(GEO_VENIN.g, GEO_VENIN.m), new T.Mesh(GEO_VENIN.c, GEO_VENIN.mc)); return g; }
function flaqueVenin(x, z, F, mo, c0) {
  const y = solA(x, z), g = new T.Group(), disque = new T.Mesh(new T.CircleGeometry(F.R, 32), fxMat('#4fbf2a', 0.62)), bord = new T.Mesh(new T.RingGeometry(F.R * 0.86, F.R, 40), fxMat('#b6ff6a', 0.8));
  [disque, bord].forEach((m) => { m.rotation.x = -Math.PI / 2; g.add(m); }); bord.position.y = 0.01; g.position.set(x, y + 0.06, z); sansClic(g); scene.add(g); let t = 0, bul = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || t >= F.duree) { jeter(g); return true; }
    const f = Math.min(1, t / 0.25) * Math.min(1, (F.duree - t) / 0.6); g.scale.setScalar(0.4 + 0.6 * Math.min(1, t / 0.25)); disque.material.opacity = 0.62 * f; bord.material.opacity = 0.8 * f;
    if ((bul += dt) > 0.12) { bul = 0; const a = Math.random() * 6.28, r = Math.random() * F.R * 0.8; emettre(FX_VIF, 1, { x: x + Math.cos(a) * r, y: y + 0.1, z: z + Math.sin(a) * r, r: 0.05, v: [0, 1.2, 0], dv: 0.3, vie: [0.4, 0.7], taille: [0.14, 0.04], c: ['#d8ff9a', '#6fe03a'] }); }
    const p = paysanMesh.position; if (Math.hypot(p.x - x, p.z - z) < F.R && !(paysanMesh.userData.enVol)) { poisonPerso(F.pct, dt); if (!c0.flaqueVeninVu) { c0.flaqueVeninVu = true; toast('Une flaque de venin : tant que tu restes dedans, le poison te ronge, sors-en !', 'alerte'); } }
    return false; });
}
function capScorpVenin(mo, ctx) {
  const K = mo.d.scorpKit; if (!K || !K.venin || mo.etat !== 'actif' || (mo.geste && !mo.geste.coup) || mo.dardPlante > 0 || mo.tourne) return; const V = K.venin, { pp, sortPret } = ctx, e = echelleS(mo);
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('scorpVeninT', V.periode) || dP > V.portee * e) return;
  const c0 = combat; mo.scorpVeninT = 0; mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z); mo.bloqueT = V.leve + 0.2; mo.cd = Math.max(mo.cd || 0, V.leve + 0.15);
  jouerGeste(mo, 'sort', V.leve, (K.dard && K.dard.impact) || 0.56); mo.geste = { t: 0, d: V.leve + 0.25 };
  if (!c0.veninVu) { c0.veninVu = true; toast(leNom(mo.d) + ' crache du venin en l\'air : sors des cercles verts, des flaques de poison vont y rester !', 'alerte'); }
  const R = V.R * Math.min(1.3, e), cibles = [{ x: pp.x, z: pp.z }];
  for (let k = 1; k < V.n; k++) { const a = Math.random() * Math.PI * 2, r = V.ecart * e * (0.7 + 0.5 * Math.random()), q = pointValide(pp.x, pp.z, pp.x + Math.cos(a) * r, pp.z + Math.sin(a) * r); cibles.push(q); }
  const F = Object.assign({}, V.flaque, { R: V.flaque.R * Math.min(1.3, e) });
  cibles.forEach((q, k) => zoneDanger({ mo, x: q.x, z: q.z, r: R, duree: V.leve + V.vol + k * 0.12, couleur: '#5fd12f', effet: (d) => {
    const y = solA(q.x, q.z); pouf(q.x, y + 0.2, q.z, 1.6, '#6fe03a'); emettre(FX_VIF, 12, { x: q.x, y: y + 0.3, z: q.z, r: 0.2, dv: 4, haut: true, vie: [0.3, 0.6], taille: [0.14, 0.04], c: ['#e8ffb0', '#6fe03a', '#2f8a1e'], grav: 9, frein: 1.4 }); secousse(0.05, 0.12);
    const p = paysanMesh.position; if (combat === c0 && !c0.fin && dansDanger(d, p.x, p.z)) blesserPerso(Math.max(1, Math.round(degSort(mo) * V.x)), mo);
    if (combat === c0 && !c0.fin) flaqueVenin(q.x, q.z, F, mo, c0); } }));
  /* les trois boules partent du dard, montent haut et retombent dans leur cercle */
  let t = 0, partis = false; const B = []; const os = mo.m.getObjectByName('queue8') || mo.m.getObjectByName('queue7'), de = new T.Vector3();
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin) { B.forEach((b) => jeter(b.g)); return true; }
    if (!partis && t >= V.leve) { partis = true; if (os) os.getWorldPosition(de); else de.set(mo.x, (mo.haut || 3) * 1.1, mo.z); pouf(de.x, de.y, de.z, 1.0, '#6fe03a');
      cibles.forEach((q, k) => { const g = bouleVenin(); g.scale.setScalar(Math.min(1.4, e)); g.position.copy(de); scene.add(g); B.push({ g, q, k, h: 5 + 1.5 * k }); }); }
    if (partis) { const u = (t - V.leve) / V.vol; B.forEach((b) => { const k = Math.min(1, u - b.k * 0.12 / V.vol); if (k < 0) return; const y1 = solA(b.q.x, b.q.z) + 0.2;
        b.g.position.set(de.x + (b.q.x - de.x) * k, de.y + (y1 - de.y) * k + Math.sin(k * Math.PI) * b.h, de.z + (b.q.z - de.z) * k); b.g.rotation.x += dt * 6;
        if (Math.random() < 0.5) emettre(FX_VIF, 1, { x: b.g.position.x, y: b.g.position.y, z: b.g.position.z, r: 0.05, dv: 0.3, vie: [0.25, 0.4], taille: [0.12, 0.03], c: ['#d8ff9a', '#6fe03a'] });
        if (k >= 1 && !b.fini) { b.fini = true; jeter(b.g); } });
      if (B.every((b) => b.fini)) return true; }
    return false; });
}
CAPACITES.unshift(capScorpDard, capScorpPinces, capScorpBalayage, capScorpVenin);
/* ---------------- l'arrivee sur l'ile ----------------
   (19/11/2026, essai : son modele a squelette n'etait pas encore charge au lancement de l'essai ; le combat, vide, se croyait gagne et finissait « boss tombe »
   en une image.) Deux gardes, pour tous les boss de l'ile : le lancement attend le modele du boss de la semaine (comme les Bworks, 27d), et un combat de l'ile
   ou le boss n'est jamais apparu ne peut pas finir « tombe » (seul l'abandon le termine) */
const lancerIleBossScorpal = lancerIleBoss; lancerIleBoss = function () {
  let t = null; try { t = bossDuJour(semaineIleBoss()); } catch (e) { t = null; }
  const d = t && MONSTRES[t], m = d && !d.fabrique && d.modele;
  if (m && !MODELES[m] && SQUELETTES_A_CHARGER.some(([n]) => n === m)) {
    if (lancerIleBoss.chargeS) return; lancerIleBoss.chargeS = true; toast(d.nom + ' arrive…', 'or');
    chargerSquelettes([m]).then(() => { try { prechaufferSquelettes([m]); } catch (e) { /* (rien) */ } }).catch(() => {}).finally(() => { lancerIleBoss.chargeS = false; if (MODELES[m]) lancerIleBossScorpal(); else toast('Le boss n\'a pas pu arriver : réessaie dans un instant.', 'alerte'); });
    return;
  }
  return lancerIleBossScorpal.apply(this, arguments);
};
const finIleBossScorpal = finIleBoss; finIleBoss = function (abandon, tombe) { const c = combat; if (tombe && c && c.genre === 'ile' && !c.monstres.some((o) => o.d && o.d.boss)) return; return finIleBossScorpal.apply(this, arguments); };
