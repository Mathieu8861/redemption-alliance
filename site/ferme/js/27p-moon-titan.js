'use strict';
/* MOON LE TITAN, BOSS DE L'ILE (26/11/2026, par Discord, la nuit : « j'aimerais bien que le prochain boss de l'ile ce soit le Moon en version hardcore, plus de sorts,
   lance plus souvent son marteau, comme les 3 derniers boss, un titan quoi », Mathieu). Sa semaine : celle du samedi 28/11/2026 (cle du vendredi 27/11).
   - Renforce sur l'ile comme le Craqueleur, le Bworker et Scorpal (RENFORT_ILE, 27-arene.js) : son Marteau de Moon bien plus souvent (son minuteur a 2,5 s au lieu de 7 ; avec le lancer, le ramassage et le rebond, environ toutes les 5,5 s au lieu de 10),
     cercles plus grands (5 au lieu de 4,2, l'onde du rebond 4,3 au lieu de 3,6), son bond ecrasant toutes les 4,2 s (6), jusqu'a 15 (13), une attaque toutes les 1,5 s (1,9),
     une armure de 45 % (35), un moulinet plus large, ses coups +30 %, et 4,5 de vitesse sur l'ile (comme Scorpal contre le kite).
   - Deux sorts en plus, sur l'ile seulement (MONSTRES.moon.titan) :
     . le TAMBOUR DE GUERRE : il frappe trois fois le sol de son marteau-caisse ; trois ondes partent de lui l'une apres l'autre (un disque, puis deux anneaux) : il faut entrer
       dans la zone qui vient d'eclater. Contre celui qui reste colle a lui comme contre celui qui tire de loin ;
     . la PLUIE DE NOIX DE COCO : il rugit et secoue la jungle ; 6 noix de coco tombent autour de toi, chacune annoncee par un cercle (de loin seulement, comme son marteau).
   Sa vie est sans fin sur l'ile (les paliers de l'alliance) : il ne passe donc jamais sous 30 %, et ne tombe pas a genoux avec ses Gorilles. Duel, sans troupe. */
const MOON_TITAN = {
  tambour: { periode: 9, prepa: 1.0, ecart: 0.6, anneaux: [[0, 4.5], [4.5, 9], [9, 13.5]], x: 0.9 },
  noix: { periode: 8, prepa: 1.1, ecart: 0.16, n: 6, R: 1.8, rayon: 5.5, x: 0.7, portee: 18 },
};
MONSTRES.moon.titan = MOON_TITAN;
/* (le titan reste une surprise jusqu'a sa semaine : sa description et ses deux sorts dans la fiche, seulement dans le mode test avant le samedi 28/11/2026 a 0 h) */
const SORTIE_MOON_TITAN = Date.parse('2026-11-28T00:00:00+01:00'), titanVisible = () => (typeof MODE_TEST !== 'undefined' && MODE_TEST) || tempsReel() >= SORTIE_MOON_TITAN;
{ const D0 = MONSTRES.moon.desc, plus = ' ; sur l\'île des boss, en titan, il frappe aussi son tambour de guerre (trois ondes qui partent de lui l\'une après l\'autre) et fait pleuvoir des noix de coco autour de toi';
  Object.defineProperty(MONSTRES.moon, 'desc', { get: () => D0 + (titanVisible() ? plus : ''), enumerable: true, configurable: true }); }
RENFORT_ILE.moon = { d: { cadence: 1.5, armure: 0.45, bondit: 4.2, bonditPortee: 15, moulinetR: 1.6, marteauMoon: { periode: 2.5, portee: 18, R: 5.0, x: 1.4, R2: 4.3, xBond: 1.4 } }, deg: 1.3, vit: 1.15 };
VITESSE_ILE.moon = 4.5 / ((MONSTRES.moon.vitesse + VITESSE_PLUS_MONSTRES) * RENFORT_ILE.moon.vit); /* (4,5 de vitesse sur l'ile) */
SORTS_LOIN.moonNoix = 'moonNoixT'; LOIN_T.add('moonNoixT'); /* (la pluie de noix de coco : de loin seulement, comme son marteau) */
/* sa semaine sur l'ile, et dans le choix du boss de l'ile du mode test */
const SEMAINES_MOON = { '2026-11-27': 'moon' }; BOSS_ILE_HORS_ROTATION.push('moon');
const bossDuJourMoon = bossDuJour; bossDuJour = function (cle) { if (!(MODE_TEST && ETAT_TEST.ileBoss) && SEMAINES_MOON[cle]) return SEMAINES_MOON[cle]; return bossDuJourMoon.apply(this, arguments); };
const titanIci = (mo) => !!(combat && combat.genre === 'ile' && mo && mo.d && mo.d.titan && mo.etat === 'actif' && !mo.faible && combat.deroute == null);
/* un coup de marteau dont l'impact tombe dans « dans » secondes */
function frappeMoon(mo, dans) {
  const an = mo.m && mo.m.userData.anim; if (!an) return; const nom = an.A.coup_1 ? 'coup_1' : piocher(an, 'coup'), imp = ((mo.m.userData.impacts || {})[nom] || [{ t: 0.9 }])[0].t, a = jouerAnim(an, nom, 0.08);
  if (a) a.timeScale = imp / Math.max(0.15, dans); mo.geste = { t: 0, d: dans + 0.2, ts: a ? a.timeScale : 1 };
}
/* un anneau annonce au sol, a la couleur de ses sorts (le disque du centre : zoneDanger) */
function anneauDanger(o) {
  if (!o.r0) return zoneDanger({ mo: o.mo, x: o.x, z: o.z, r: o.r1, duree: o.duree, effet: o.effet });
  const c0 = combat, C = (o.mo && o.mo.d.couleurSorts && o.mo.d.couleurSorts[0]) || '#e2413a', g = new T.Group();
  const m0 = (op) => new T.MeshBasicMaterial({ color: C, transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide });
  const fond = new T.Mesh(new T.RingGeometry(o.r0, o.r1, 72, 1), m0(0.3)), plein = new T.Mesh(new T.RingGeometry(o.r0, o.r1, 72, 1), m0(0)), b0 = new T.Mesh(new T.RingGeometry(o.r0, o.r0 + 0.14, 72), m0(0.95)), b1 = new T.Mesh(new T.RingGeometry(o.r1 - 0.16, o.r1, 72), m0(0.95));
  [fond, plein, b0, b1].forEach((m) => { m.rotation.x = -Math.PI / 2; m.renderOrder = 2; g.add(m); }); g.position.set(o.x, solA(o.x, o.z) + 0.07, o.z); sansClic(g); scene.add(g);
  const d = { x: o.x, z: o.z, r: o.r1, r0: o.r0 }; let t = 0;
  effets.push((dt) => { t += dt; plein.material.opacity = 0.42 * Math.min(1, t / o.duree); fond.material.opacity = 0.22 + 0.2 * Math.abs(Math.sin(t * 9));
    if (combat !== c0 || c0.fin || (o.mo && o.mo.etat === 'mort')) { jeter(g); return true; }
    if (t >= o.duree) { jeter(g); o.effet(d); return true; } return false; });
  return d;
}
/* ---------------- le tambour de guerre ---------------- */
function capMoonTambour(mo, ctx) {
  if (!titanIci(mo) || !mo.d.titan.tambour) return; const K = mo.d.titan.tambour, { pp, sortPret } = ctx, dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
  if (dP > K.anneaux[K.anneaux.length - 1][1] + 1 || !sortPret('moonTambourT', K.periode)) return;
  const c0 = combat, cx = mo.x, cz = mo.z, C = mo.d.couleurSorts || ['#e2413a', '#ffd0c0', '#8a1a12'], N = K.anneaux.length; mo.moonTambourT = 0;
  mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z); mo.bloqueT = Math.max(mo.bloqueT || 0, K.prepa + (N - 1) * K.ecart + 0.5); mo.cd = Math.max(mo.cd || 0, K.prepa + (N - 1) * K.ecart + 0.6);
  if (!c0.tambourVu) { c0.tambourVu = true; toast(leNom(mo.d) + ' frappe son tambour de guerre : trois ondes partent de lui l\'une après l\'autre. Entre dans la zone qui vient d\'éclater !', 'alerte'); }
  frappeMoon(mo, K.prepa);
  K.anneaux.forEach(([r0, r1], i) => anneauDanger({ mo, x: cx, z: cz, r0, r1, duree: K.prepa + i * K.ecart, effet: () => {
    const y = solA(cx, cz), rm = (r0 + r1) / 2; onde(cx, y, cz, r1, C[1], 0.45, 0.75); secousse(0.12 + 0.05 * i, 0.2);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2 + i * 0.4; emettre(FX_FUM, 1, { x: cx + Math.cos(a) * rm, y: y + 0.2, z: cz + Math.sin(a) * rm, r: (r1 - r0) * 0.35, vie: [0.4, 0.7], taille: [0.6, 1.2], c: ['#d8c6a0', '#b8a888'], a: 0.5 }); }
    const p = paysanMesh.position, dd = Math.hypot(p.x - cx, p.z - cz); if (combat === c0 && !c0.fin && dd >= r0 && dd < r1) blesserPerso(Math.max(1, Math.round(degSort(mo) * K.x)), mo); } }));
  /* le deuxieme et le troisieme coup de marteau, cales sur leur onde */
  let t = 0, n = 1; effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif' || mo.faible) return true;
    if (n < N && t >= K.prepa + (n - 1) * K.ecart + 0.04) { frappeMoon(mo, K.ecart - 0.04); n++; } return n >= N; });
}
/* ---------------- la pluie de noix de coco ---------------- */
function noixCoco() {
  const g = new T.Group(), c = new T.Mesh(new T.IcosahedronGeometry(0.46, 1), mat('#6b4423')); c.scale.set(1, 1.12, 1); g.add(c);
  for (let i = 0; i < 3; i++) { const o = new T.Mesh(new T.SphereGeometry(0.075, 6, 4), mat('#2e1c0e')), a = i * 2.1; o.position.set(Math.cos(a) * 0.12, 0.47, Math.sin(a) * 0.12); g.add(o); } /* (ses trois yeux) */
  for (let i = 0; i < 5; i++) { const f = new T.Mesh(new T.BoxGeometry(0.05, 0.22, 0.05), mat('#a07a4a')), a = i * 1.26; f.position.set(Math.cos(a) * 0.4, 0.15, Math.sin(a) * 0.4); f.rotation.set(Math.sin(a) * 0.6, 0, Math.cos(a) * 0.6); g.add(f); } /* (sa bourre) */
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); sansClic(g); return g;
}
function capMoonNoix(mo, ctx) {
  if (!titanIci(mo) || !mo.d.titan.noix) return; const K = mo.d.titan.noix, { pp, sortPret } = ctx, dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
  if (dP > K.portee || !sortPret('moonNoixT', K.periode)) return;
  const c0 = combat; mo.moonNoixT = 0; mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z); mo.bloqueT = Math.max(mo.bloqueT || 0, K.prepa * 0.6 + 0.2); mo.cd = Math.max(mo.cd || 0, K.prepa * 0.6 + 0.3);
  gesteSort(mo, 'rugir', K.prepa * 0.6);
  if (!c0.noixVu) { c0.noixVu = true; toast(leNom(mo.d) + ' rugit et secoue la jungle : des noix de coco vont tomber dans les cercles, ne reste pas dessous !', 'alerte'); }
  /* une sur toi, les autres autour, jamais l'une sur l'autre (au bord de l'ile, pointValide les ramenait sur le perso : 4 noix sur 6 au meme endroit) ; une noix sans place est retiree */
  const cibles = [{ x: pp.x, z: pp.z }], libre = (q) => cibles.every((c) => Math.hypot(q.x - c.x, q.z - c.z) >= K.R * 1.25);
  for (let k = 1; k < K.n; k++) for (let e = 0; e < 10; e++) { const a = Math.random() * Math.PI * 2, r = K.rayon * (0.45 + 0.55 * Math.random()), q = pointValide(pp.x, pp.z, pp.x + Math.cos(a) * r, pp.z + Math.sin(a) * r); if (libre(q)) { cibles.push(q); break; } }
  cibles.forEach((q, k) => { const duree = K.prepa + k * K.ecart, y = solA(q.x, q.z);
    zoneDanger({ mo, x: q.x, z: q.z, r: K.R, duree, effet: (d) => {
      pouf(q.x, y + 0.3, q.z, 1.4, '#a07a4a'); emettre(FX_VIF, 12, { x: q.x, y: y + 0.4, z: q.z, r: 0.25, dv: 4, haut: true, vie: [0.3, 0.6], taille: [0.16, 0.05], c: ['#6b4423', '#f2ead8', '#3a2412'], grav: 10, frein: 1.4 }); secousse(0.05, 0.1);
      const p = paysanMesh.position; if (combat === c0 && !c0.fin && dansDanger(d, p.x, p.z)) blesserPerso(Math.max(1, Math.round(degSort(mo) * K.x)), mo); } });
    /* la noix tombe du ciel et arrive juste a la fin du cercle ; son ombre grandit au sol (vue de dessus, la chute se lit a l'ombre) */
    const chute = 0.55, n = noixCoco(), om = new T.Mesh(new T.CircleGeometry(0.7, 20), new T.MeshBasicMaterial({ color: '#2a1a0e', transparent: true, opacity: 0, depthWrite: false }));
    om.rotation.x = -Math.PI / 2; om.position.set(q.x, y + 0.09, q.z); om.renderOrder = 3; n.visible = false; scene.add(n); scene.add(om); let t = 0;
    effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin) { jeter(n); jeter(om); return true; }
      const u = (t - (duree - chute)) / chute; if (u < 0) return false; n.visible = true; const e = Math.min(1, u);
      n.position.set(q.x, y + 0.45 + 16 * (1 - e * e), q.z); n.rotation.x += dt * 5; n.rotation.z += dt * 3; om.scale.setScalar(0.3 + 0.9 * e); om.material.opacity = 0.5 * e;
      if (u >= 1) { jeter(n); jeter(om); return true; } return false; }); });
}
CAPACITES.push(capMoonTambour, capMoonNoix);
