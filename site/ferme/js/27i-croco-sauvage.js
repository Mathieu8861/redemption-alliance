'use strict';
/* LE KIT DU CROCO SAUVAGE, boss de la vague 110 (18/11/2026, « ok maintenant fais son kit de sorts », Mathieu ; tout le detail dans PALIER11.md).
   L'esprit : « un croco qui te charge, qui est rapide, qui te laisse pas respirer », « a la Warwick un peu, je dis pas qu'il faut reprendre tous ces spells
   mais c'est l'idee » (le chasseur qui traque, se soigne en mordant, va plus vite vers une proie blessee). En avant-premiere dans l'Arene dev (version dev).
   - la traque : la ruee des boss (capCharge, 21-combat.js), souvent et de pres, une bande rouge breve ;
   - l'odeur du sang (passif) : plus tu as perdu de PV, plus il court et frappe vite ; sous la moitie de sa vie, ses coups le soignent ;
   - la Machoire qui retient : il bondit sur toi ; pris dans le cercle, tu es happe et secoue, plusieurs morsures ;
   - la Plongee dans la vase : il s'enfonce, une bosse de boue te suit, puis il jaillit sous toi apres un cercle rouge ;
   - la Crue de la mare : des flaques s'etalent autour de toi, elles te ralentissent et lui donnent de la vitesse ;
   - sous 30 % de sa vie, la Frenesie de sang : a quatre pattes pour de bon, plus rapide, morsures plus frequentes (22c-squelettes.js, choixAllure).
   Chiffres proposes, a valider avec Mathieu. */
const KIT_CROCO = {
  traque: { periode: 4.5, prepa: 0.8, max: 12, vitesse: 24 },
  odeur: { vit: 0.4, cad: 0.6, vol: 0.3, seuilVol: 0.5 }, /* (vit et cad : en plus, PV du perso a 0 ; vol : la part des degats qui le soigne, sous seuilVol de sa vie) */
  machoire: { periode: 9, min: 0, max: 10, prepa: 0.85, R: 1.4, tenu: 1.5, morsures: 3, x: 0.8, saut: 2.4 },
  plongee: { periode: 15, suit: 1.8, vBosse: 7.5, prepa: 1.0, R: 1.8, x: 1.6, assomme: 0.6 },
  crue: { periode: 22, n: 5, R: [1.8, 2.6], duree: 12, vit: 1.35 },
  frenesie: { seuil: 0.3, vit: 1.3, sorts: 0.7 },
};
/* (« pas assez fluide et rapide dans ses mouvements, et il fait aucun degat », Mathieu : ses coups passaient par les poings du Gorille, 57 toutes les 3 s avec un
   cercle a eviter ; ce sont maintenant des coups de griffes directs, a la cadence des boss (autoX : environ 290 par coup), plus vite, et sa ruee court a quatre pattes) */
Object.assign(MONSTRES.crocoBoss, { boss: true, element: 'eau', couleurSorts: ['#e2413a', '#ffb3a8', '#8a1c14'], pv: () => pvBoss(11), deg: () => 66, autoX: 2.0, degSort: 1.7, cadence: 1.0, vitesse: 4.2, portee: 3.0, ombre: 4.2, armure: 0.2, gestes: { charge: 'charge' },
  charge: KIT_CROCO.traque.periode, chargePrepa: KIT_CROCO.traque.prepa, chargeMax: KIT_CROCO.traque.max, chargeVitesse: KIT_CROCO.traque.vitesse,
  machoire: KIT_CROCO.machoire, plongeeVase: KIT_CROCO.plongee, crue: KIT_CROCO.crue, odeurSang: KIT_CROCO.odeur, frenesie: KIT_CROCO.frenesie,
  desc: 'le chasseur de la mare, il ne te laisse pas respirer : il fonce sur toi dès que tu t\'éloignes (sors de la bande rouge), plus tu es blessé plus il est rapide, et sous la moitié de sa vie ses coups le soignent. Il bondit pour te happer et te secouer (sors du cercle rouge), plonge dans la vase et jaillit sous toi, fait déborder la mare (les flaques te ralentissent, lui accélèrent), et sous 30 % de vie il passe à quatre pattes : la frénésie de sang' });

/* ses coups le soignent : la part des degats qu'il vient de te faire, sous la moitie de sa vie (l'odeur du sang) */
const blesserPerso0 = blesserPerso; blesserPerso = function (n, mo) { /* (renvoie le resultat du coup : la malediction du Lemurien ne s'accroche que si le coup touche ; oublie le 18/11/2026, corrige le soir meme) */
  const c = combat, avant = c && c.pv, ok = blesserPerso0(n, mo);
  const O = mo && mo.d && mo.d.odeurSang; if (!O || !c || avant == null || mo.etat === 'mort' || mo.pv >= mo.pvMax * O.seuilVol) return ok;
  const pris = avant - c.pv; if (pris <= 0) return ok; const h = Math.max(1, Math.round(pris * O.vol)); mo.pv = Math.min(mo.pvMax, mo.pv + h);
  chiffre('+' + h, new T.Vector3(mo.x, mo.m.position.y + (mo.haut || 4) - 0.2, mo.z), 'soin');
  if (!c.volCrocoVu) { c.volCrocoVu = true; toast(leNom(mo.d) + ' se nourrit de tes blessures : sous la moitié de sa vie, chacun de ses coups le soigne !', 'alerte'); }
  return ok;
};
function capOdeurSang(mo, ctx) { /* le passif, et la frenesie sous 30 % */
  const O = mo.d.odeurSang; if (!O || mo.etat !== 'actif' || !combat) return; const c = combat, F = mo.d.frenesie;
  const f = Math.max(0, Math.min(1, 1 - c.pv / Math.max(1, c.pvMax)));
  if (F && !mo.frenesie && mo.pv < mo.pvMax * (c.difficile ? DUR.rage : F.seuil)) {
    mo.frenesie = true; mo.enrage = true; auraRageCorps(mo); pouf(mo.x, mo.m.position.y, mo.z, 3.5, '#e2413a'); secousse(0.12, 0.4); gesteSort(mo, 'rugir', 0.6); mo.bloqueT = Math.max(mo.bloqueT || 0, 0.9);
    toast('Frénésie de sang ! ' + leNom(mo.d) + ' passe à quatre pattes : plus rapide, il mord bien plus souvent !', 'alerte'); }
  if (mo.vitBase == null) mo.vitBase = mo.vitM || 1;
  mo.vitM = mo.vitBase * (1 + O.vit * f) * (mo.dansCrue ? mo.d.crue.vit : 1) * (mo.frenesie ? F.vit : 1);
  if (mo.cd > 0) mo.cd -= ctx.dt * (O.cad * f + (mo.frenesie ? 0.4 : 0)); /* (il frappe plus vite : sa recharge fond plus vite) */
  if (f > 0.5 && !c.odeurVu) { c.odeurVu = true; toast(leNom(mo.d) + ' sent ton sang : plus tu es blessé, plus il est rapide !', 'alerte'); }
}
/* LA MACHOIRE QUI RETIENT : il bondit sur le cercle rouge ; pris dedans, tu es happe (colle sur place) et il te secoue, plusieurs morsures */
function capMachoire(mo, ctx) {
  const M = mo.d.machoire; if (!M || mo.etat !== 'actif' || mo.plonge || mo.geste) return; const { pp, sortPret } = ctx, dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
  const per = M.periode * (mo.frenesie ? mo.d.frenesie.sorts : 1);
  if (!sortPret('machoireT', per)) return; if (dP < M.min || dP > M.max || combat.colle > 0) { mo.machoireT = per - 0.4; return; }
  const c0 = combat, x0 = mo.x, z0 = mo.z, cx = pp.x, cz = pp.z, a = Math.atan2(cx - x0, cz - z0), fx = cx - Math.sin(a) * 1.1, fz = cz - Math.cos(a) * 1.1;
  mo.machoireT = 0; mo.ry = a; mo.bloqueT = M.prepa + M.tenu + 0.5; mo.cd = Math.max(mo.cd || 0, M.prepa + M.tenu + 0.3); mo.frappe = 0.3; mo.saute = true;
  gesteSort(mo, gesteDe(mo, 'bond', 'coup'), M.prepa);
  if (!c0.machoireVu) { c0.machoireVu = true; toast(leNom(mo.d) + ' bondit pour te happer : sors du cercle rouge, sinon il te tient et te secoue !', 'alerte'); }
  let t = 0; effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') { mo.hop = 0; mo.saute = false; return true; }
    const k = Math.min(1, t / M.prepa); mo.x = x0 + (fx - x0) * k; mo.z = z0 + (fz - z0) * k; mo.hop = M.saut * 4 * k * (1 - k); if (k >= 1) { mo.hop = 0; mo.saute = false; return true; } return false; });
  zoneDanger({ mo, x: cx, z: cz, r: M.R, duree: M.prepa, effet: (d) => {
    const y = solA(cx, cz); secousse(0.1, 0.25); impactEau(cx, cz, M.R); const p2 = paysanMesh.position;
    if (!dansDanger(d, p2.x, p2.z) || combat !== c0 || c0.fin) { mo.bloqueT = 0.3; return; }
    coller(M.tenu, 'Happé !'); let u = 0, n = 0; const pas = M.tenu / M.morsures;
    effets.push((dt) => { u += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') { mo.m.rotation.z = 0; return true; }
      mo.m.rotation.z = Math.sin(u * 28) * 0.14; /* (il secoue la tete) */
      if (u >= pas * (n + 0.5) && n < M.morsures) { n++; blesserPerso(Math.max(1, Math.round(degSort(mo) * M.x)), mo); const q = paysanMesh.position.clone(); q.y += 1.2; pouf(q.x, q.y, q.z, 0.9, '#b3261e'); }
      if (u >= M.tenu) { mo.m.rotation.z = 0; mo.bloqueT = 0.3; return true; } return false; }); } });
}
/* LA PLONGEE DANS LA VASE : il s'enfonce, une bosse de boue te suit sous le sol, puis il jaillit sous toi apres un cercle rouge */
function capPlongeeVase(mo, ctx) {
  const P = mo.d.plongeeVase; if (!P || mo.etat !== 'actif' || mo.plonge || mo.geste) return; const { sortPret } = ctx;
  if (!sortPret('plongeeT', P.periode * (mo.frenesie ? mo.d.frenesie.sorts : 1)) || combat.colle > 0) return;
  const c0 = combat, x0 = mo.x, z0 = mo.z, y0 = solA(x0, z0), H = (mo.haut || 4) * 1.05, TELL = 0.4, DESC = 0.6;
  mo.plongeeT = 0; mo.plonge = true; mo.bloqueT = TELL + DESC + P.suit + P.prepa + 1.2;
  if (!c0.plongeeVu) { c0.plongeeVu = true; toast(leNom(mo.d) + ' plonge dans la vase : la bosse de boue te suit, il va jaillir sous toi. Sors du cercle rouge !', 'alerte'); }
  const bosse = new T.Mesh(new T.SphereGeometry(0.95, 14, 8), new T.MeshLambertMaterial({ color: '#5a3d22' })); bosse.scale.set(1, 0.32, 1); bosse.visible = false; scene.add(bosse);
  let t = 0, etape = 0, bx = x0, bz = z0, cx = 0, cz = 0;
  const finir = () => { jeter(bosse); mo.hop = 0; mo.plonge = false; if (mo.etat === 'enfoui') mo.etat = 'actif'; mo.m.visible = true; if (mo.ombreM) mo.ombreM.visible = true; };
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat === 'mort') { finir(); return true; }
    if (t < TELL) { if (Math.random() < dt * 20) poussiere(x0 + (Math.random() - 0.5) * 3, y0, z0 + (Math.random() - 0.5) * 3, 1, 0.5, '#5a3d22'); return false; } /* (la vase bouillonne autour de lui) */
    if (t < TELL + DESC) { const k = (t - TELL) / DESC; mo.hop = -H * k * k; if (Math.random() < dt * 25) mottes(x0, y0, z0, 2, 1.4); return false; } /* (il s'enfonce) */
    if (etape === 0) { etape = 1; mo.hop = 0; mo.etat = 'enfoui'; mo.m.visible = false; mo.barre.hidden = true; if (mo.ombreM) mo.ombreM.visible = false; secousse(0.1, 0.25); impactEau(x0, z0, 2.2); bosse.visible = true; }
    const p2 = paysanMesh.position;
    if (t < TELL + DESC + P.suit) { const dx = p2.x - bx, dz = p2.z - bz, L = Math.hypot(dx, dz); if (L > 0.3) { const s = Math.min(L, P.vBosse * dt); bx += dx / L * s; bz += dz / L * s; }
      bosse.position.set(bx, solA(bx, bz) + 0.05, bz); bosse.scale.y = 0.28 + 0.06 * Math.sin(t * 18); if (Math.random() < dt * 22) mottes(bx, solA(bx, bz), bz, 1, 0.6); return false; } /* (la bosse de boue te suit) */
    if (etape === 1) { etape = 2; cx = bx; cz = bz;
      zoneDanger({ mo, x: cx, z: cz, r: P.R, duree: P.prepa, effet: (d) => { const p3 = paysanMesh.position; impactEau(cx, cz, P.R * 1.2); mottes(cx, solA(cx, cz), cz, 12, 2.2); secousse(0.16, 0.35);
        if (dansDanger(d, p3.x, p3.z) && combat === c0 && !c0.fin) { blesserPerso(Math.max(1, Math.round(degSort(mo) * P.x)), mo); c0.assomme = Math.max(c0.assomme || 0, P.assomme); const q = p3.clone(); q.y += 2.1; chiffre('Assommé !', q, 'vol'); } } }); }
    if (t < TELL + DESC + P.suit + P.prepa) { bosse.scale.y = 0.3 + 0.1 * Math.sin(t * 30); return false; }
    jeter(bosse); mo.x = cx; mo.z = cz; mo.y = solA(cx, cz); mo.dep = { x: cx, y: mo.y - H, z: cz, friche: true }; mo.t = 0; mo.etat = 'grimpe'; mo.m.visible = true; if (mo.ombreM) mo.ombreM.visible = true; mo.hop = 0;
    mo.ry = Math.atan2(paysanMesh.position.x - cx, paysanMesh.position.z - cz); mo.m.rotation.y = mo.ry; mo.plonge = false; mo.plongeeT = 0; mo.bloqueT = 0.3; mo.cd = Math.min(mo.cd || 0, 0.5); return true; });
}
/* LA CRUE DE LA MARE : il rugit, des flaques s'etalent autour de toi ; dedans tu es ralenti (comme la vase du Crapaud), lui court plus vite */
function capCrue(mo, ctx) {
  const C = mo.d.crue; if (!C || mo.etat !== 'actif' || mo.plonge || mo.geste) return; const { pp, sortPret } = ctx; mo.dansCrue = false;
  const c0 = combat, fl = (c0.flaquesCrue || []).filter((f) => f.vie > 0);
  if (fl.length) { const dedans = (x, z) => fl.some((f) => Math.hypot(x - f.x, z - f.z) < f.r * f.k); mo.dansCrue = dedans(mo.x, mo.z); if (dedans(pp.x, pp.z)) c0.vase = Math.max(c0.vase || 0, 0.2); return; }
  if (!sortPret('crueT', C.periode * (mo.frenesie ? mo.d.frenesie.sorts : 1))) return;
  mo.crueT = 0; mo.bloqueT = 1.0; mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z); gesteSort(mo, gesteDe(mo, 'crue', 'rugir'), 0.5);
  if (!c0.crueVu) { c0.crueVu = true; toast(leNom(mo.d) + ' fait déborder la mare : dans les flaques, tu es ralenti et lui court plus vite. Restes-en dehors !', 'alerte'); }
  const L = []; for (let k = 0; k < C.n * 3 && L.length < C.n; k++) { const a = Math.random() * 6.28, d = k === 0 ? 0 : 2.5 + Math.random() * 5, q = pointValide(pp.x, pp.z, pp.x + Math.sin(a) * d, pp.z + Math.cos(a) * d);
    if (solSort(q.x, q.z) && !L.some((f) => Math.hypot(f.x - q.x, f.z - q.z) < 2.2)) L.push({ x: q.x, z: q.z, r: C.R[0] + Math.random() * (C.R[1] - C.R[0]), k: 0, vie: C.duree }); }
  L.forEach((f) => { const y = solA(f.x, f.z) + 0.04, g = new T.Group(); g.position.set(f.x, y, f.z);
    const eau = new T.Mesh(new T.CircleGeometry(1, 32), new T.MeshBasicMaterial({ color: '#3d6b6e', transparent: true, opacity: 0.6, depthWrite: false })); eau.rotation.x = -Math.PI / 2; eau.renderOrder = 2;
    const bord = new T.Mesh(new T.RingGeometry(0.9, 1, 40), new T.MeshBasicMaterial({ color: '#8fc4c0', transparent: true, opacity: 0.75, depthWrite: false })); bord.rotation.x = -Math.PI / 2; bord.renderOrder = 3; g.add(eau); g.add(bord); g.scale.setScalar(0.01); scene.add(g); f.g = g; f.eau = eau; impactEau(f.x, f.z, 1.2); });
  c0.flaquesCrue = L; let t = 0;
  effets.push((dt) => { t += dt; const fin = combat !== c0 || c0.fin; L.forEach((f) => { f.vie -= dt; f.k = fin ? 0 : Math.min(1, t / 0.8) * Math.min(1, Math.max(0, f.vie) / 1.0); f.g.scale.setScalar(Math.max(0.01, f.r * f.k));
      f.eau.material.opacity = 0.5 + 0.1 * Math.sin(t * 3 + f.x); if (!fin && f.k > 0.5 && Math.random() < dt * 2.5) onde(f.x + (Math.random() - 0.5) * f.r, solA(f.x, f.z) + 0.06, f.z + (Math.random() - 0.5) * f.r, 0.5, '#bfe6e2', 0.6); });
    if (fin || L.every((f) => f.vie <= 0)) { L.forEach((f) => jeter(f.g)); if (c0.flaquesCrue === L) c0.flaquesCrue = null; return true; } return false; });
}
CAPACITES_AVANT.push(capOdeurSang); CAPACITES.push(capMachoire, capPlongeeVase, capCrue);
