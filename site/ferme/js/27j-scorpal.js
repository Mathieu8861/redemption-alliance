'use strict';
/* SCORPAL, LE BOSS SCORPION DE L'ILE (19/11/2026). Dessine par la copine de Mathieu (« ma copine a dessine ce boss pour le boss de l'ile, tu penses on peut
   le faire ? »), passe en 3D par Rodin (qualite haute), raccourci, colore d'apres le dessin, squelette et mouvements faits main (blender/palier11/scorpion-*.py,
   maquettes/boss-scorpion/SCORPION.md). Son nom : « Scorpal » (Mathieu). Boss de l'ile la semaine du samedi 21/11/2026 (« oui, samedi 21/11 »).
   Son kit (« comment on peut le rendre interessant comme boss de l'ile pour qu'il soit pas trop simple », puis au formulaire : la carapace, et le dard + venin,
   les pinces, le balayage de queue) :
   - la CARAPACE : il encaisse 60 % de moins, sauf quand son dard reste plante dans le sol (2,5 s apres chaque piqure) : la, chaque coup compte x2,5. Le
     classement recompense celui qui esquive et punit au bon moment ;
   - le DARD : un cercle rouge sur toi (1,2 s), la queue s'abat ; touche, un venin qui s'empile (5 doses : paralyse 1,5 s) ; le dard reste plante : point faible ;
   - les PINCES : un eventail rouge devant lui (0,9 s) ; pris, il t'attire contre lui et te tient 2 s ;
   - le BALAYAGE de queue : un cercle autour de lui (1 s), il tourne sur lui-meme et te repousse.
   Chiffres de depart, a regler avec Mathieu (mesures sur l'ile, perso de 6 090 PV : coup 250 toutes les 1,5 s, dard 900, pinces 610, balayage 1 000, avant la rage).
   Ses sorts coupent ses coups au contact (comme le Croco, sortCoupe) : sinon, ses coups enchaines ne lui laissaient jamais le temps de piquer. Sur l'ile : 1 500 000 PV pour l'alliance, une fois et demie plus grand, pas de troupe (un duel). */
SQUELETTES_A_CHARGER.push(['scorpion', 'assets/modeles/jeu/scorpion-anime.glb', 3.4]); VITESSE_FAMILLE.scorpion = 1.1; ALLURES.scorpion = { marche: 1.39, course: 3.495 };
const KIT_SCORPAL = {
  carapace: 0.6, ouverture: 2.5,
  dard: { periode: 6.0, prepa: 1.2, R: 2.2, x: 1.25, plante: 2.5, portee: 4.4, venin: { pct: 0.005, duree: 6, max: 5 }, paralysie: 1.5, impact: 0.56 },
  pinces: { periode: 8.0, prepa: 0.9, R: 4.4, ouv: 0.55, x: 0.85, tenu: 2.0, impact: 0.47 },
  balayage: { periode: 7.5, prepa: 1.0, R: 3.6, x: 1.4, repousse: 2.4, tour: 0.6 },
};
MONSTRES.scorpal = { element: 'terre', nom: 'Scorpal', modele: 'scorpion', icone: 'scorpal-v2', boss: true, vagueIle: 100, stable: true, coupDuree: 1.0,
  desc: 'le seigneur scorpion en armure : sa carapace encaisse 60 % de tes coups, sauf quand son dard reste planté au sol après une piqûre (frappe alors : x2,5). Son dard empoisonne (5 doses : paralysé), ses pinces t\'attirent et te tiennent, sa queue balaie tout autour de lui',
  pv: () => 60000, deg: () => 112, cadence: 1.5, vitesse: 2.6, portee: 3.0, ombre: 4.2, degSort: 3.2, scorpKit: KIT_SCORPAL, appelStun: KIT_SCORPAL.pinces.tenu };
PV_ILE_BOSS_PAR.scorpal = 1500000;
/* SCORPAL RENFORCE SUR L'ILE (20/11/2026, « vu que c'est l'ile du boss, boost-le comme pour le Bworker », Mathieu) : les memes leviers et les memes proportions que
   le Bworker et le Craqueleur (RENFORT_ILE, 27-arene.js) : ses trois sorts reviennent plus souvent (dard toutes les 4,5 s au lieu de 6, pinces 6 au lieu de 8,
   balayage 5,5 au lieu de 7,5), moins de temps pour sortir des cercles (0,9 / 0,7 / 0,75 s au lieu de 1,2 / 0,9 / 1), des cercles plus grands (+20 %), des sorts
   qui tapent +30 %, un coup toutes les 1,2 s au lieu de 1,5, ses coups +30 %, une carapace de 65 % au lieu de 60 (comme l'armure du Bworker, +10 points sur 30),
   la marche +15 % et 25 % plus vite sur l'ile (VITESSE_ILE). Le dard reste plante 2,5 s (le moment de taper ne raccourcit pas). Toujours sans troupe : un duel. */
const KIT_SCORPAL_ILE = { carapace: 0.65, ouverture: 2.5,
  dard: Object.assign({}, KIT_SCORPAL.dard, { periode: 4.5, prepa: 0.9, R: 2.65, x: 1.62, portee: 5.2 }),
  pinces: Object.assign({}, KIT_SCORPAL.pinces, { periode: 6.0, prepa: 0.7, R: 5.0, x: 1.1 }),
  balayage: Object.assign({}, KIT_SCORPAL.balayage, { periode: 5.5, prepa: 0.75, R: 4.2, x: 1.82 }) };
RENFORT_ILE.scorpal = { d: { cadence: 1.2, scorpKit: KIT_SCORPAL_ILE }, deg: 1.3, vit: 1.15 }; VITESSE_ILE.scorpal = 1.25;
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
function capScorpDard(mo, ctx) {
  const K = mo.d.scorpKit; if (!K || mo.etat !== 'actif' || (mo.geste && !mo.geste.coup) || mo.dardPlante > 0 || mo.tourne) return; const D = K.dard, { pp, sortPret } = ctx, e = echelleS(mo);
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('scorpDardT', D.periode) || dP > D.portee * e + 2.5) return;
  const c0 = combat; mo.scorpDardT = 0; const a = Math.atan2(pp.x - mo.x, pp.z - mo.z), r = Math.min(dP, D.portee * e), x = mo.x + Math.sin(a) * r, z = mo.z + Math.cos(a) * r;
  mo.ry = a; mo.bloqueT = D.prepa + D.plante + 0.6; mo.cd = Math.max(mo.cd || 0, D.prepa + D.plante + 0.5);
  const an = jouerGeste(mo, 'sort', D.prepa, D.impact); mo.geste = { t: 0, d: D.prepa + D.plante + 0.7 };
  if (!c0.dardVu) { c0.dardVu = true; toast(leNom(mo.d) + ' lève son dard sur toi : sors du cercle rouge ! Après la piqûre, son dard reste planté : c\'est là qu\'il faut frapper.', 'alerte'); }
  zoneDanger({ mo, x, z, r: D.R * Math.min(1.3, e), duree: D.prepa, effet: (d) => {
    const y = solA(x, z); onde(x, y + 0.05, z, D.R * e, '#c7a2ff', 0.4, 0.7); poussiere(x, y, z, 10, 1.2, '#9a8a70'); secousse(0.1, 0.22);
    const p = paysanMesh.position, c = combat;
    if (dansDanger(d, p.x, p.z) && c === c0 && !c.fin) {
      if (blesserPerso(Math.max(1, Math.round(degSort(mo) * D.x)), mo) && !(c.invincible > 0)) {
        const V = D.venin, P = (c.poisons = c.poisons || []), L = P.filter((q) => q.scorpVenin);
        if (L.length >= V.max - 1) { P.splice(0, P.length, ...P.filter((q) => !q.scorpVenin)); etourdir(D.paralysie); const q = p.clone(); q.y += 2.2; chiffre('Paralysé !', q, 'vol'); toast('Cinq doses de venin : tu es paralysé !', 'alerte'); }
        else P.push({ pct: V.pct, t: V.duree, scorpVenin: true });
      }
    }
    /* le dard reste plante : le point faible */
    mo.dardPlante = D.plante; if (an) an.paused = true; const q = mo.m.position.clone(); q.y += (mo.haut || 3) * 0.6; chiffre('Point faible !', q, 'vol'); marquerPointFaible(mo, D.plante);
    let t = 0; effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') { mo.dardPlante = 0; return true; } mo.dardPlante = Math.max(0, D.plante - t); if (t >= D.plante) { mo.dardPlante = 0; if (an) { an.paused = false; an.timeScale = 1; } return true; } return false; });
  } });
}
/* le point faible : une lueur doree qui pulse au bout de la queue, tant que le dard est plante */
let texPointFaible = null;
function marquerPointFaible(mo, duree) {
  texPointFaible = texPointFaible || texCanvas(64, (g, n) => { const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); r.addColorStop(0, 'rgba(255,250,200,1)'); r.addColorStop(0.4, 'rgba(255,200,60,0.7)'); r.addColorStop(1, 'rgba(255,140,0,0)'); g.fillStyle = r; g.fillRect(0, 0, n, n); });
  const s = new T.Sprite(new T.SpriteMaterial({ map: texPointFaible, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending })); s.renderOrder = 8; scene.add(s);
  const os = mo.m.getObjectByName('queue8') || mo.m.getObjectByName('queue7'), v = new T.Vector3(), c0 = combat; let t = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif' || t >= duree) { scene.remove(s); s.material.dispose(); return true; }
    if (os) os.getWorldPosition(v); else v.set(mo.x, (mo.haut || 3) * 0.5, mo.z); s.position.copy(v); s.scale.setScalar((1.4 + 0.35 * Math.sin(t * 12)) * echelleS(mo)); return false; });
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
  const c0 = combat; mo.scorpPincesT = 0; const a = Math.atan2(pp.x - mo.x, pp.z - mo.z); mo.ry = a; mo.bloqueT = P.prepa + 0.6; mo.cd = Math.max(mo.cd || 0, P.prepa + 0.5);
  jouerGeste(mo, 'coup', P.prepa, P.impact); mo.geste = { t: 0, d: P.prepa + 0.5 };
  if (!c0.pincesVu) { c0.pincesVu = true; toast(leNom(mo.d) + ' ouvre ses pinces : sors de l\'éventail rouge, sinon il t\'attire et te tient 2 s !', 'alerte'); }
  zoneDanger({ mo, x: mo.x, z: mo.z, r: P.R * e, a, ouv: P.ouv, duree: P.prepa, effet: (d) => { const p = paysanMesh.position, c = combat; secousse(0.06, 0.15);
    if (dansDanger(d, p.x, p.z) && c === c0 && !c.fin && blesserPerso(Math.max(1, Math.round(degSort(mo) * P.x)), mo) && !(c.invincible > 0)) attirerScorpal(mo, 1.7 * e); } });
}
/* ---------------- le balayage de queue ---------------- */
function capScorpBalayage(mo, ctx) {
  const K = mo.d.scorpKit; if (!K || mo.etat !== 'actif' || (mo.geste && !mo.geste.coup) || mo.dardPlante > 0 || mo.tourne) return; const B = K.balayage, { pp, sortPret } = ctx, e = echelleS(mo);
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('scorpBalayageT', B.periode) || dP > B.R * e - 0.3) return;
  const c0 = combat, x0 = mo.x, z0 = mo.z; mo.scorpBalayageT = 0; mo.bloqueT = B.prepa + B.tour + 0.3; mo.cd = Math.max(mo.cd || 0, B.prepa + B.tour + 0.2); mo.geste = { t: 0, d: B.prepa + B.tour + 0.2 };
  if (!c0.balayageVu) { c0.balayageVu = true; toast(leNom(mo.d) + ' arme sa queue pour tout balayer autour de lui : sors du cercle !', 'alerte'); }
  let t = 0; effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') { mo.tourne = 0; return true; }
    if (t < B.prepa) { const k = Math.min(1, t / B.prepa); mo.tourne = -0.6 * k * k; return false; }
    const u = Math.min(1, (t - B.prepa) / B.tour), s = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; mo.tourne = -0.6 + s * (Math.PI * 2 + 0.6);
    if (u >= 1) { mo.tourne = 0; return true; } return false; });
  zoneDanger({ mo, x: x0, z: z0, r: B.R * e, duree: B.prepa, effet: (d) => { const y = solA(x0, z0); onde(x0, y + 0.05, z0, B.R * e, '#ffffff', 0.4, 0.8); secousse(0.08, 0.2);
    const p = paysanMesh.position; if (dansDanger(d, p.x, p.z) && combat === c0 && !c0.fin && blesserPerso(Math.max(1, Math.round(degSort(mo) * B.x)), mo)) repousserPerso(mo, B.repousse); } });
}
CAPACITES.unshift(capScorpDard, capScorpPinces, capScorpBalayage);
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
