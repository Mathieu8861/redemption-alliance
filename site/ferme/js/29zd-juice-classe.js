'use strict';
/* LES SORTS DE CLASSE « JUICY » (25/11/2026, au formulaire « les sorts de classe », puis « travaille-les a fond, prends ton temps, je veux un truc de fou
   malade », Mathieu) : la touche 2 des trois classes, refaite d'apres les videos (IDEES-JUICE.md). Ouverts a tous le 25/11/2026 (« Ouvrir aux joueurs », Mathieu ;
   juiceSort('percante' | 'bondiop' | 'invoc'), 29z-juice-sorts.js ; JUICE_SORTS.eteints pour comparer avant et apres).
   Les degats, les zones et la duree des gestes ne changent pas, sauf l'Invocation : ses degats tombent quand le Bouftou touche le sol (0,22 s apres l'appel),
   et non plus pendant qu'il est encore dans le ciel.
   - TIR PERCANT (Cra) : une lance de lumiere (coeur blanc, pointe doree, deux anneaux qui vrillent), un faisceau plus large, trois ondes de choc au depart, une
     gerbe de traits vers l'avant, un coup de zoom ; en vol, une double spirale autour du trait, des eclairs qui crepitent pres de la pointe, la poussiere chassee
     des deux cotes, des cailloux souleves ; chaque monstre transperce blanchit, s'ecrase, est repousse dans le sens du tir et fait un petit bond, un grand anneau
     se referme autour de lui, des etincelles sortent derriere lui, ses chiffres sautent en arc ; au bout du trait, un eclat.
   - BOND DU IOP : un sceau dore se verrouille sur le point de chute ; au decollage, le sol se fend, une onde monte, des traits filent vers le haut ; en l'air, une
     trainee de feu dore ; a l'atterrissage, l'image se fige, la camera encaisse (zoom), des traits d'eclat, un dome de choc dore, huit piliers de lumiere, des
     eclats de roche, un cratere craquele, les monstres repousses en rond et projetes en l'air, chiffres en arc.
   - INVOCATION DU BOUFTOU (Osamodas) : un portail violet tourbillonne dans le ciel au-dessus du cercle, le Bouftou en tombe etire, dans une trainee violette et des
     flocons de laine ; il s'ecrase au sol et rebondit (ecrasement puis etirement), la laine explose, un dome violet ; les monstres autour prennent ses degats a
     ce moment-la, blanchissent, reculent et sautent ; ensuite, chacun de ses coups de tete fait blanchir et reculer sa cible ; a la fin, il repart en laine
     et en paillettes. */
const JSC = { zoom: 1.08, retour: 260 };
let ZOOM_PUNCH = false, SON_BOUFTOU_T = -1e9;
function zoomPunch(z, duree) { /* la camera « encaisse » le coup : un zoom bref qui revient ; pas en animations reduites, ni pendant le temps fort d'un coup fatal */
  if (animationsReduites() || FATAL_ANIME || ZOOM_PUNCH) return; ZOOM_PUNCH = true; const t0 = performance.now(), D = duree || JSC.retour;
  const fin = () => { camera.zoom = 1; camera.updateProjectionMatrix(); ZOOM_PUNCH = false; };
  const pas = () => { try { const k = (performance.now() - t0) / D; if (k >= 1) { fin(); return; } camera.zoom = 1 + (z - 1) * Math.pow(1 - k, 3); camera.updateProjectionMatrix(); requestAnimationFrame(pas); } catch (e) { fin(); } };
  pas();
}
/* le monstre touche par un sort de classe : blanc, ecrase, repousse dans le sens du coup, un petit bond (pas les boss), des etincelles a travers lui */
function coupClasse(mo, dir, o) {
  if (!mo || !mo.m) return null; const tue = mo.etat !== 'actif' || mo.pv <= 0, lourd = mo.d && (mo.d.boss || mo.d.demi || mo.d.stable), h = mo.haut || 1.5, q = new T.Vector3(mo.x, mo.m.position.y + h * 0.5, mo.z);
  reactionJuicy(mo, !!o.fort); flashSansSquelette(mo); mo.flashB = Math.max(mo.flashB || 0, o.flash || 0.1);
  if (!tue) { reculVisuel(mo, dir, o.recul || 0.4); if (!lourd && o.saut) mo.sautV = { t: 0, h: o.saut }; }
  emettre(FX_VIF, o.n || 12, { x: q.x, y: q.y, z: q.z, r: 0.08, v: [dir.x * 7, 1.6, dir.z * 7], dv: 3, vie: [0.16, 0.38], taille: [0.12, 0.02], c: ['#ffffff', '#ffe9b0', o.couleur, o.couleur], grav: 8, frein: 2.4, etire: 0.07 });
  if (tue && mo.d && (mo.d.boss || mo.d.demi)) { arretImage(JC.arretBoss); secousse(0.12, 0.22); etoileImpact(q, 1.2, '#ffffff'); }
  return q;
}
function blesserArc(mo, n, gros, suite) { /* les chiffres en arc (29w-juice-cra.js) : le premier gros, les suivants plus petits */
  JUICE_CRA.coup = { style: '', gros: !!gros, mos: [], pop: suite ? 1.25 : 1.7, taille: suite ? 0.85 : 1.05 }; try { blesser(mo, n, gros); } finally { JUICE_CRA.coup = null; }
}
function domeChoc(x, y, z, R, couleur, duree) { /* un dome de choc qui s'ouvre d'un coup et s'efface */
  const g = new T.Group(), d = new T.Mesh(new T.SphereGeometry(1, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), fxMat(couleur, 0.5)), b = new T.Mesh(GEO_ANNEAU_S, fxMat('#ffffff', 0.9)); b.rotation.x = -Math.PI / 2;
  d.renderOrder = 6; b.renderOrder = 6; g.add(d, b); g.position.set(x, y + 0.04, z);
  fxVie(g, duree || 0.32, (k) => { const e = 1 - Math.pow(1 - k, 3); g.scale.set(R * (0.25 + 0.75 * e), R * (0.25 + 0.75 * e) * (0.9 - 0.4 * k), R * (0.25 + 0.75 * e)); d.material.opacity = 0.55 * (1 - k) * (1 - k); b.material.opacity = 0.95 * (1 - k); });
}
const GEO_PILIER = (() => { const g = new T.CylinderGeometry(0.06, 0.26, 1, 12, 6, true); g.translate(0, 0.5, 0); partager(g); return g; })();
const VS_PILIER = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FS_PILIER = `uniform vec3 uC; uniform float uA, uT; varying vec2 vUv; void main() { float h = vUv.y, f = pow(1.0 - h, 1.7) * smoothstep(0.0, 0.06, h + 0.02), s = 0.85 + 0.15 * sin(h * 26.0 - uT * 40.0); gl_FragColor = vec4(uC, f * s * uA); }`;
const matPilier = (c) => new T.ShaderMaterial({ uniforms: { uC: { value: new T.Color(c) }, uA: { value: 1 }, uT: { value: 0 } }, vertexShader: VS_PILIER, fragmentShader: FS_PILIER, transparent: true, depthWrite: false, side: T.DoubleSide });
function pilierLumiere(x, y, z, h, couleur, retard) { /* un jet de lumiere qui jaillit du sol : plein en bas, il s'efface vers le haut et ondule, puis s'amincit (en cylindre plein, il avait l'air d'un baton) */
  const g = new T.Group(), a = new T.Mesh(GEO_PILIER, matPilier(couleur)), c = new T.Mesh(GEO_PILIER, matPilier('#ffffff')); c.scale.set(0.4, 0.9, 0.4); a.renderOrder = 6; c.renderOrder = 7; g.add(a, c); g.position.set(x, y, z); g.visible = false;
  let t = -(retard || 0); fxVie(g, 0.4 + (retard || 0), () => {}); effets.push((dt) => { t += dt; if (!g.parent) return true; if (t < 0) return false;
    if (!g.visible) { g.visible = true; emettre(FX_VIF, 4, { x, y: y + 0.1, z, r: 0.1, v: [0, 7, 0], dv: 1.2, vie: [0.2, 0.32], taille: [0.1, 0.02], c: ['#ffffff', couleur], frein: 2.5, etire: 0.08 }); }
    const k = Math.min(1, t / 0.4), up = Math.min(1, t / 0.06), w = Math.max(0.01, 1 - Math.max(0, k - 0.2) / 0.8); g.scale.set(w, Math.max(0.01, h * up * (1 + 0.2 * k)), w);
    [a, c].forEach((m) => { m.material.uniforms.uA.value = (m === a ? 0.8 : 0.9) * w; m.material.uniforms.uT.value = t; }); return k >= 1; });
}
function eclairZigzag(a, b, couleur) { /* un eclair : un trace en zigzag aux angles marques, en traits de lumiere tres courts (il est redessine ailleurs toutes les deux images) */
  const n = 6, d = b.clone().sub(a), L = d.length(); if (L < 0.05) return; const u = d.clone().normalize(), p = new T.Vector3(-u.z, 0, u.x); let prec = a.clone();
  for (let i = 1; i <= n; i++) { const k = i / n, q = a.clone().addScaledVector(d, k); if (i < n) { q.addScaledVector(p, (fxAlea() - 0.5) * L * 0.35); q.y += (fxAlea() - 0.5) * L * 0.3; }
    const s = q.clone().sub(prec), m = prec.clone().addScaledVector(s, 0.5), l = s.length(); s.normalize();
    emettre(FX_VIF, 1, { x: m.x, y: m.y, z: m.z, v: [s.x * l * 9, s.y * l * 9, s.z * l * 9], vie: [0.05, 0.07], taille: [0.07, 0.04], c: ['#ffffff', couleur], a: 1, frein: 60, etire: 0.11 });
    emettre(FX_LUM, 1, { x: m.x, y: m.y, z: m.z, vie: [0.06, 0.08], taille: [0.45, 0.2], c: [couleur, couleur], a: 0.45 }); prec = q; }
}

/* ======================= LE TIR PERCANT DU CRA ======================= */
const GEO_LANCE_LUM = (() => { const g = new T.CylinderGeometry(0.075, 0.075, 1.6, 8); g.rotateX(Math.PI / 2); partager(g); return g; })(), GEO_POINTE_LUM = (() => { const g = new T.ConeGeometry(0.14, 0.46, 8); g.rotateX(Math.PI / 2); g.translate(0, 0, 1.02); partager(g); return g; })();
const parDessus = (o, ordre) => { o.traverse((m) => { if (m.material) { m.material.depthTest = false; m.material.depthWrite = false; m.material.transparent = true; } m.renderOrder = ordre; }); return o; }; /* (dessine par-dessus les monstres : a hauteur de leur corps, la fleche et son faisceau disparaissaient dedans) */
function flechePercanteJuicy(pt) {
  const st = statsPerso(), pp = paysanMesh.position, u = paysanMesh.userData;
  const dir = new T.Vector3(pt.x - pp.x, 0, pt.z - pp.z); if (dir.lengthSq() < 0.01) dir.set(Math.sin(paysanMesh.rotation.y), 0, Math.cos(paysanMesh.rotation.y)); dir.normalize();
  combat.cdSort = rechargeSort(); chemin = []; arrivee = null; combat.ordre = false; u.angle = Math.atan2(dir.x, dir.z); paysanMesh.rotation.y = u.angle;
  u.attaque = { t: -0.55, classe: 'cra', base: u.angle, tour: false, surFrappe: () => {} }; u.charge = true;
  const P = (u.tirPercant = { tension: 0, recul: 0 }), c0 = combat; voileEcran(0.6, 1.0); son('arc', undefined, 3, -250);
  const ox = pp.x, oz = pp.z;
  effets.push(() => { if (combat !== c0 || !paysanMesh) { u.tirPercant = null; u.charge = false; return true; } paysanMesh.rotation.y = u.angle; u.charge = false; tirer();
    let tr = 0; effets.push((d2) => { tr += d2; P.tension = Math.max(0, 1 - tr / 0.06); P.recul = Math.sin(Math.min(1, tr / 0.35) * Math.PI); if (tr >= 0.35) { if (u.tirPercant === P) u.tirPercant = null; return true; } }); return true; });
  const tirer = () => {
    const de = pointeArc(paysanMesh), fin = de.clone().addScaledVector(dir, PORTEE_PERCANTE), avance = (de.x - ox) * dir.x + (de.z - oz) * dir.z;
    const fl = new T.Group(), coeur = new T.Mesh(GEO_LANCE_LUM, new T.MeshBasicMaterial({ color: '#fffaf0' })), pointe = new T.Mesh(GEO_POINTE_LUM, new T.MeshBasicMaterial({ color: '#ffd27a' })); fl.add(coeur, pointe);
    const vrilles = [0, 1].map((i) => { const r = new T.Mesh(new T.TorusGeometry(0.26 + i * 0.09, 0.03, 4, 18), new T.MeshBasicMaterial({ color: i ? '#ffb347' : '#fff1c0', transparent: true, opacity: 0.95 })); r.position.z = 0.35 - i * 0.6; fl.add(r); return r; });
    { const halo = new T.Mesh(new T.SphereGeometry(0.32, 12, 8), new T.MeshBasicMaterial({ color: '#ffe9b0', transparent: true, opacity: 0.45 })); halo.scale.set(1, 1, 3.2); halo.position.z = 0.3; fl.add(halo); }
    sansClic(fl); parDessus(fl, 9); scene.add(fl); fl.position.copy(de); fl.lookAt(fin); const touches = new Set(); let t = 0, temps = 0, brume = 0, anneaux = 0, sol = 0, foudre = 0, cote = 0;
    /* le depart : un eclat, trois ondes de choc, une gerbe de traits vers l'avant, la camera encaisse */
    decocher(de, fin); flashLumiere(de.x, de.y, de.z, '#ffd27a', 4, 9, 0.35); secousse(0.09, 0.18); zoomPunch(1.05, 220); etoileImpact(de.clone().addScaledVector(dir, 0.45), 1.3, '#ffd27a');
    [[0.6, 0.3, 3.0, 0.42, '#fffaf0'], [1.3, 0.2, 2.2, 0.36, '#ffd27a'], [2.0, 0.15, 1.5, 0.3, '#ff9a2e']].forEach(([d, r0, r1, du, c]) => anneauSouffle(de.clone().addScaledVector(dir, d), dir, r0, r1, du, c, 0.95));
    emettre(FX_VIF, 26, { x: de.x + dir.x * 0.5, y: de.y, z: de.z + dir.z * 0.5, r: 0.1, v: [dir.x * 13, 0.4, dir.z * 13], dv: 3.5, vie: [0.14, 0.26], taille: [0.1, 0.02], c: ['#ffffff', '#ffe08a', '#ff9a2e'], frein: 4, etire: 0.1 });
    const F = faisceau(de, fin, [['#fffaf0', '#ff6a14', 0.9, false], ['#ffffff', '#ffd27a', 0.42, true]]); parDessus(F.g, 8); const L = PORTEE_PERCANTE, aSol = Math.atan2(dir.x, dir.z), PAS_SOL = 0.7, perp = new T.Vector3(-dir.z, 0, dir.x);
    effets.push((dt) => {
      t += dt / (0.45 * L / 10); temps += dt; const k = Math.min(1, t); fl.position.lerpVectors(de, fin, k); F.maj(k, 1, temps); const p = fl.position;
      vrilles.forEach((r, i) => { r.rotation.z = temps * (i ? -26 : 34); r.scale.setScalar(1 + 0.15 * Math.sin(temps * 40 + i)); });
      emettre(FX_VIF, 3, { x: p.x, y: p.y, z: p.z, r: 0.08, v: [-dir.x * 4, 0.8, -dir.z * 4], dv: 3.2, vie: [0.18, 0.34], taille: [0.12, 0.03], c: ['#ffffff', '#ffd36a', '#ff6a1e'], grav: 6, frein: 2, etire: 0.06 });
      emettre(FX_LUM, 1, { x: p.x, y: p.y, z: p.z, vie: [0.1, 0.14], taille: [1.8, 0.5], c: ['#ffffff', '#ffb347'], a: 0.95, entree: 0.01 }); /* (la tete de la comete) */
      for (let i = 0; i < 2; i++) { const r = Math.min(k * L, 3) * fxAlea(), h = p.clone().addScaledVector(dir, -r); emettre(FX_LUM, 1, { x: h.x, y: h.y, z: h.z, vie: [0.16, 0.26], taille: [1.0, 0.2], c: ['#ffe9b0', '#ff8a2e'], a: 0.55, entree: 0.02 }); }
      for (let i = 0; i < 2; i++) { const s = temps * 30 + i * Math.PI, r = 0.42, q = p.clone().addScaledVector(perp, Math.cos(s) * r); q.y += Math.sin(s) * r; /* (la double spirale autour du trait) */
        emettre(FX_VIF, 1, { x: q.x, y: q.y, z: q.z, vie: [0.24, 0.34], taille: [0.17, 0.03], c: ['#ffffff', i ? '#ff9a2e' : '#ffd27a'], a: 1 }); emettre(FX_LUM, 1, { x: q.x, y: q.y, z: q.z, vie: [0.14, 0.2], taille: [0.4, 0.05], c: ['#fff1c0', '#ffb347'], a: 0.6 }); }
      if ((foudre += dt) > 0.033) { foudre = 0; for (let i = 0; i < 2; i++) { const a0 = p.clone().addScaledVector(dir, -fxEntre(0.2, 1.6)), b0 = a0.clone().addScaledVector(perp, fxEntre(-1, 1)).addScaledVector(dir, fxEntre(-0.6, 0.6)); b0.y += fxEntre(-0.5, 0.7); eclairZigzag(a0, b0, '#ffd27a'); } } /* (des eclairs qui crepitent pres de la pointe) */
      brume += dt; if (brume > 0.03) { brume = 0; emettre(FX_FUM, 1, { x: p.x, y: p.y - 0.1, z: p.z, r: 0.15, v: [-dir.x * 0.6, 0.25, -dir.z * 0.6], vie: [0.35, 0.6], taille: [0.35, 1.1], c: ['#d2b8ff', '#7a5ab8'], a: 0.22, frein: 2, entree: 0.05 }); }
      const parcouru = k * L; while (anneaux + 1.6 <= parcouru) { anneaux += 1.6; anneauSouffle(de.clone().addScaledVector(dir, anneaux), dir, 0.2, 1.2, 0.3, '#ffe3a0', 0.85); }
      while (sol + PAS_SOL <= parcouru) { const x = de.x + dir.x * (sol + PAS_SOL / 2), z = de.z + dir.z * (sol + PAS_SOL / 2); sol += PAS_SOL; if (lieu !== 'ferme' || caseIci(x, z)) braiseSol(x, z, aSol, PAS_SOL, 1.1 + sol / L * 0.3); }
      if ((cote += dt) > 0.025) { cote = 0; const ys = solA(p.x, p.z); for (const s of [-1, 1]) { const v = 2.6 + fxAlea() * 1.4; /* (la poussiere chassee des deux cotes du trait, des cailloux souleves) */
          emettre(FX_FUM, 1, { x: p.x + perp.x * s * 0.3, y: ys + 0.2, z: p.z + perp.z * s * 0.3, v: [perp.x * s * v - dir.x * 0.5, 0.5, perp.z * s * v - dir.z * 0.5], vie: [0.5, 0.8], taille: [0.4, 1.2], c: ['#e8d8b8', '#cbb894'], a: 0.5, frein: 2.6, entree: 0.04 });
          if (fxAlea() < 0.45) emettre(FX_VIF, 1, { x: p.x, y: ys + 0.1, z: p.z, v: [perp.x * s * 3, 3.5, perp.z * s * 3], dv: 1, vie: [0.4, 0.6], taille: [0.08, 0.05], c: ['#9a7a52', '#6e5236'], grav: 12, sol: ys + 0.03, rebond: 0.3 }); } }
      if (combat) combat.monstres.slice().forEach((o) => { if (o.etat !== 'actif' || touches.has(o)) return; const vx = o.x - ox, vz = o.z - oz, sl = vx * dir.x + vz * dir.z - avance, marge = Math.min(0.5, (o.d.ombre || 1) * 0.12); /* (la bande : a l'identique de flechePercante, 22-sorts.js) */
        if (sl >= -marge && sl <= parcouru + marge && Math.abs(vx * dir.z - vz * dir.x) < LARGEUR_PERCANTE + marge) {
          const q = new T.Vector3(o.x, o.m.position.y + o.haut * 0.5, o.z), premier = !touches.size; if (premier) { arretImage(0.08); secousse(0.12, 0.2); zoomPunch(1.07, 240); }
          touches.add(o); etoileImpact(q, 1.5, '#ffb347'); anneauSouffle(q, dir, 2.2, 0.25, 0.22, '#fff1c8', 0.95); anneauSouffle(q, dir, 0.3, 1.8, 0.28, '#ffd27a', 0.9); flashLumiere(q.x, q.y, q.z, '#ffb347', 3.5, 6, 0.25); /* (un anneau se referme sur lui, un autre s'ouvre) */
          emettre(FX_VIF, 20, { x: q.x + dir.x * 0.4, y: q.y, z: q.z + dir.z * 0.4, r: 0.1, v: [dir.x * 9, 1, dir.z * 9], dv: 5, vie: [0.18, 0.38], taille: [0.1, 0.02], c: ['#ffffff', '#ffd36a', '#ff6a1e'], grav: 8, frein: 2.5, etire: 0.06 }); /* (la gerbe qui sort derriere lui) */
          son('impactFleche', undefined, premier ? 3 : 1, -350 + hasardCents(120));
          blesserArc(o, Math.round(st.deg * 3), true, !premier); coupClasse(o, dir, { recul: 0.65, saut: 0.3, fort: true, couleur: '#ffb347', n: 10 });
          if (o.etat === 'mort' && !o.d.boss && !o.d.demi) desintegrer(o); } });
      if (t >= 1) { jeter(fl); const ys = solA(fin.x, fin.z); etoileImpact(fin, 1.1, '#ffd27a'); anneauSouffle(fin.clone(), dir, 0.2, 1.6, 0.3, '#fff1c8', 0.9); if (lieu !== 'ferme' || caseIci(fin.x, fin.z)) onde(fin.x, ys, fin.z, 1.4, '#ffd27a', 0.35, 0.8);
        let f = 0; effets.push((d2) => { f += d2 / 0.28; temps += d2; F.maj(1 + f * 0.25, Math.max(0, 1 - f), temps); if (f >= 1) { jeter(F.g); return true; } }); return true; }
    });
  };
}
{ const percanteJS = flechePercante; flechePercante = function (pt) { if (!juiceSort('percante')) return percanteJS.apply(this, arguments); return flechePercanteJuicy(pt); }; }

/* ======================= LE BOND DU IOP ======================= */
function sceauVise(x, y, z, R, duree) { /* le point de chute se verrouille : un cercle dore, un anneau de runes qui tourne, quatre pointes qui se resserrent */
  const g = new T.Group(), mats = [], plat = (geo, c, o) => { const m = new T.Mesh(geo, fxMat(c, o)); m.rotation.x = -Math.PI / 2; m.renderOrder = 4; mats.push([m.material, o]); g.add(m); return m; };
  plat(new T.RingGeometry(0.92, 1, 56), '#ffd27a', 0.95); plat(new T.RingGeometry(0.6, 0.64, 40), '#fff1c0', 0.8); plat(GEO_DISQUE, '#ffc24a', 0.18);
  const runes = new T.Group(); g.add(runes); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, m = new T.Mesh(new T.PlaneGeometry(0.1, 0.05 + (i % 2) * 0.04), fxMat('#ffd27a', 0.9)); m.rotation.x = -Math.PI / 2; m.rotation.z = -a; m.position.set(Math.cos(a) * 0.78, 0, Math.sin(a) * 0.78); m.renderOrder = 4; mats.push([m.material, 0.9]); runes.add(m); }
  const pointes = []; for (let i = 0; i < 4; i++) { const m = new T.Mesh(new T.ConeGeometry(0.09, 0.3, 3), fxMat('#fff1c0', 0.95)); m.rotation.set(-Math.PI / 2, 0, 0); m.renderOrder = 5; mats.push([m.material, 0.95]); const piv = new T.Group(); piv.rotation.y = i * Math.PI / 2 + Math.PI / 4; piv.add(m); g.add(piv); pointes.push(m); }
  g.position.set(x, y + 0.07, z); g.scale.setScalar(R);
  fxVie(g, duree, (k) => { const o = Math.min(1, k / 0.25); mats.forEach(([m, o0]) => { m.opacity = o0 * o; }); runes.rotation.y = k * 2.4; g.scale.setScalar(R * (1.25 - 0.25 * k)); pointes.forEach((m) => { m.position.set(0, 0.02, -(1.5 - 0.6 * k)); }); });
}
const TEX_CRATERE_IOP = TEX_CRAQUELE;
function bondIopJuicy(pt) {
  const st = statsPerso(), pp = paysanMesh.position, u = paysanMesh.userData;
  const q0 = pointSort(pt, PORTEE_BOND); let x = q0.x, z = q0.z;
  combat.cdSort = RECHARGE_SORT; son('sort'); chemin = []; arrivee = null; combat.ordre = false; if (Math.hypot(x - pp.x, z - pp.z) > 0.05) u.angle = Math.atan2(x - pp.x, z - pp.z); paysanMesh.rotation.y = u.angle;
  const de = pp.clone(), fin = new T.Vector3(x, 0, z), cible = combat.monstres.filter((o) => o.etat === 'actif' && Math.hypot(o.x - x, o.z - z) < RAYON_BOND).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
  const a = u.angle, H = 0.55, m = u.membres || [], bras = m[3] || m[2];
  const roue = new T.Group(); roue.rotation.order = 'YXZ'; roue.rotation.y = a; scene.add(roue);
  const lames = [['#ffffff', '#ffe9a8', 1, 1.0, true], ['#ffd27a', '#ff7a1e', 0.6, 1.12, false]].map(([c, b, o, s, plein]) => { const l = new T.Mesh(GEO_RUBAN, matRuban(c, b, o, plein)); l.material.uniforms.uP.value = 1; l.material.uniforms.uQ.value = 0.95; l.rotation.y = Math.PI / 2; l.scale.setScalar(s * 0.95); roue.add(l); return l; });
  const corps = paysanMesh.children.filter((c) => !(c.isMesh && !c.name)).map((c) => ({ c, p: c.position.clone(), q: c.quaternion.clone() })), R = new T.Quaternion(), CENTRE = new T.Vector3(0, H, 0), AXE = new T.Vector3(1, 0, 0);
  const salto = (phi, dy) => { R.setFromAxisAngle(AXE, phi); corps.forEach(({ c, p, q }) => { c.position.copy(p).sub(CENTRE).applyQuaternion(R).add(CENTRE); c.position.y += dy; c.quaternion.copy(R).multiply(q); }); };
  const fant = fantomes(paysanMesh, 3, '#ffd27a', 1.6);
  /* le decollage : le sol se fend sous lui, une onde monte, des traits filent vers le haut ; le point de chute se verrouille */
  const ySol0 = solA(de.x, de.z), yFin = solA(fin.x, fin.z); sceauVise(fin.x, yFin, fin.z, RAYON_BOND, 0.32);
  poussiere(de.x, de.y, de.z, 10, 1.1); onde(de.x, de.y, de.z, 1.6, '#fff3c4', 0.3, 0.8); solFendu(de.x, ySol0, de.z, 0.9); mottes(de.x, ySol0, de.z, 6, 0.9); secousse(0.08, 0.14);
  anneauSouffle(new T.Vector3(de.x, ySol0 + 0.4, de.z), new T.Vector3(0, 1, 0), 0.3, 1.9, 0.28, '#fff1c0', 0.9);
  emettre(FX_VIF, 18, { x: de.x, y: ySol0 + 0.3, z: de.z, r: 0.5, v: [0, 9, 0], dv: 1.5, vie: [0.16, 0.3], taille: [0.09, 0.02], c: ['#ffffff', '#ffd27a'], frein: 3, etire: 0.09 });
  let t = 0, trace = 0, feu = 0; u.charge = true; u.enVol = true;
  effets.push((dt) => {
    t += dt / 0.3; const k = Math.min(1, t), x0 = de.x + (fin.x - de.x) * k, z0 = de.z + (fin.z - de.z) * k;
    const cel = caseIci(x0, z0); u.y = hauteurSol(x0, z0, cel); const yv = u.y + Math.sin(k * Math.PI) * 1.5, vole = combat && !combat.fin;
    paysanMesh.position.set(x0, u.y + Math.sin(k * Math.PI) * 0.9, z0); /* (le saut que lit le jeu, a l'identique de bondIop) */
    const phi = vole ? Math.PI * 2 * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2) : 0;
    salto(phi, Math.sin(k * Math.PI) * 0.6);
    if (bras && vole) bras.rotation.x = k < 0.85 ? -2.7 : -2.7 + (k - 0.85) / 0.15 * 2.1;
    roue.position.set(x0, yv + H, z0); roue.rotation.x = phi - 0.9; lames.forEach((l, i) => { l.material.uniforms.uA.value = (i ? 0.55 : 1) * Math.sin(k * Math.PI); });
    trace += dt; if (trace > 0.02) { trace = 0; lueur(new T.Vector3(x0, yv + H, z0), k % 0.1 < 0.05 ? '#ffffff' : '#ffd24a', 1.5, 0.3); }
    if ((feu += dt) > 0.012) { feu = 0; emettre(FX_VIF, 2, { x: x0, y: yv + H, z: z0, r: 0.25, v: [0, 0.6, 0], dv: 0.8, vie: [0.25, 0.4], taille: [0.34, 0.05], c: ['#fff3b0', '#ffb347', '#e8601a'], a: 0.95, frein: 1.5 }); } /* (une trainee de feu dore) */
    fant.maj(dt, Math.sin(k * Math.PI));
    if (t >= 1) {
      jeter(roue); fant.fin(); corps.forEach(({ c, p, q }) => { c.position.copy(p); c.quaternion.copy(q); }); if (!combat || !combat.fin) { if (bras) bras.rotation.x = 0; }
      u.charge = false; u.enVol = false; if (cel && praticable(cel)) u.cellule = cel; flashLumiere(fin.x, u.y + 1, fin.z, '#ffd27a', 4.5, 9, 0.4);
      const centre = new T.Vector3(fin.x, u.y + 0.6, fin.z);
      /* l'impact : l'image se fige, la camera encaisse, des traits d'eclat, un dome de choc dore, huit piliers de lumiere, des eclats de roche, un cratere */
      arretImage(0.08); secousse(0.26, 0.36); zoomPunch(1.1, 300); traitsEclat(centre, '#ffc24a', { n: 12, long: 300, duree: 220 }); son('impactFleche', undefined, 4, -900 + hasardCents(80));
      domeChoc(fin.x, u.y, fin.z, RAYON_BOND + 0.6, '#ffd27a', 0.34);
      for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2 + a + 0.5, r = RAYON_BOND * 0.85; pilierLumiere(fin.x + Math.sin(an) * r, u.y, fin.z + Math.cos(an) * r, 1.8 + (i % 2) * 0.7, '#ffc24a', i * 0.02); }
      pilierLumiere(fin.x, u.y, fin.z, 3.6, '#ffe08a', 0);
      emettre(FX_VIF, 34, { x: fin.x, y: u.y + 0.2, z: fin.z, r: 0.5, plat: true, dv: 8, haut: true, vie: [0.25, 0.6], taille: [0.11, 0.02], c: ['#ffffff', '#ffd27a', '#ff8a2e'], grav: 9, frein: 1.5, etire: 0.05 });
      onde(fin.x, u.y, fin.z, RAYON_BOND + 0.4, '#ffffff', 0.3, 0.95); onde(fin.x, u.y, fin.z, RAYON_BOND + 1.3, '#ffc24a', 0.6, 0.8);
      solFendu(fin.x, u.y, fin.z, RAYON_BOND, true); mottes(fin.x, u.y, fin.z, 14, 1.3); poussiere(fin.x, u.y, fin.z, 18, RAYON_BOND * 1.1); eclatsRoche(fin.x, u.y, fin.z, 14, 1.25);
      { const cr = sansClic(new T.Mesh(new T.CircleGeometry(RAYON_BOND * 0.85, 40), new T.MeshBasicMaterial({ map: TEX_CRATERE_IOP, transparent: true, opacity: 0, depthWrite: false }))); cr.rotation.x = -Math.PI / 2; cr.rotation.z = fxAlea() * 6; cr.position.set(fin.x, u.y + 0.045, fin.z); cr.renderOrder = 2;
        fxVie(cr, 2.2, (kk) => { cr.material.opacity = Math.min(1, kk * 2.2 / 0.06) * (kk < 0.7 ? 0.9 : 0.9 * (1 - (kk - 0.7) / 0.3)); cr.scale.setScalar(0.7 + 0.3 * Math.min(1, kk * 2.2 / 0.12)); }); } /* (le cratere craquele) */
      emettre(FX_LUM, 22, { x: fin.x, y: u.y + 0.15, z: fin.z, r: RAYON_BOND * 0.8, plat: true, v: [0, 1.4, 0], dv: 0.4, vie: [0.6, 1.1], taille: [0.12, 0.02], c: ['#ffffff', '#ffc24a'], frein: 0.6 }); /* (des braises qui montent) */
      let kk = 0; if (combat) combat.monstres.slice().forEach((o) => { if (o.etat === 'actif' && Math.hypot(o.x - fin.x, o.z - fin.z) < RAYON_BOND) { kk++; const q = new T.Vector3(o.x, o.m.position.y + o.haut * 0.5, o.z), d = new T.Vector3(o.x - fin.x, 0, o.z - fin.z); if (d.lengthSq() < 1e-4) d.set(Math.sin(a), 0, Math.cos(a)); d.normalize();
        etoileImpact(q, o === cible ? 1.4 : 1.0, '#ffd27a'); blesserArc(o, Math.round(st.deg * (o === cible ? 3 : 1.5)), true, o !== cible); coupClasse(o, d, { recul: o === cible ? 0.85 : 0.65, saut: o === cible ? 0.6 : 0.45, fort: o === cible, couleur: '#ffc24a', n: 12 }); } }); /* (les degats : a l'identique de bondIop) */
      if (combat && !combat.fin && kk) { const h = Math.round(Math.min(combat.pvMax - combat.pv, st.pvMax * soinBond(kk))); if (h > 0) { combat.pv += h; if (combat.st) combat.st.soins += h; chiffre('+' + h, new T.Vector3(fin.x, u.y + 1.7, fin.z), 'soin'); croixSoin(fin.x, u.y, fin.z, Math.min(4, kk)); } }
      return true;
    }
  });
}
{ const bondJS = bondIop; bondIop = function (pt) { if (!juiceSort('bondiop')) return bondJS.apply(this, arguments); return bondIopJuicy(pt); }; }

/* ======================= L'INVOCATION DU BOUFTOU ======================= */
const TEX_PORTAIL_INVOC = texCanvas(128, (g, n) => { /* un tourbillon violet : sombre au coeur, des bras de spirale clairs, un bord qui s'efface */
  const c = n / 2, d = g.createRadialGradient(c, c, 0, c, c, c); d.addColorStop(0, 'rgba(26,6,52,1)'); d.addColorStop(0.35, 'rgba(84,36,160,0.95)'); d.addColorStop(0.78, 'rgba(186,140,255,0.75)'); d.addColorStop(1, 'rgba(220,196,255,0)'); g.fillStyle = d; g.fillRect(0, 0, n, n);
  g.strokeStyle = 'rgba(244,228,255,0.85)'; g.lineWidth = 3; for (let k = 0; k < 5; k++) { g.beginPath(); for (let i = 0; i <= 40; i++) { const t = i / 40, a = k / 5 * Math.PI * 2 + t * 4.5, r = c * (0.1 + 0.8 * t), X = c + Math.cos(a) * r, Y = c + Math.sin(a) * r; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); } g.stroke(); } });
/* (25/11/2026, « etrange l'orientation du portail », puis « a la limite il faudrait qu'il soit au sol, non ? », Mathieu) : le portail s'ouvre au sol, dans le
   cercle d'invocation ; le Bouftou en jaillit, monte en arc et retombe sur les monstres (invoquerJuicy, majInvoc) */
const CHUTE_INVOC_JUICY = 0.34; /* (le jaillissement : 0,34 s du portail au sol, au lieu des 0,22 s de la chute du ciel ; les degats tombent a l'atterrissage) */
function portailInvoc(x, y, z) { /* un portail violet a plat au sol : il s'ouvre d'un coup, tourbillonne, crepite, aspire des lueurs, puis se referme */
  const g = new T.Group(), disque = new T.Mesh(new T.CircleGeometry(1.25, 40), new T.MeshBasicMaterial({ map: TEX_PORTAIL_INVOC, transparent: true, depthWrite: false, side: T.DoubleSide })), bord = new T.Mesh(new T.RingGeometry(1.18, 1.36, 48), fxMat('#e3cfff', 0.95));
  disque.rotation.x = bord.rotation.x = -Math.PI / 2; disque.renderOrder = 4; bord.renderOrder = 5; bord.position.y = 0.01;
  const lueurB = new T.Mesh(new T.RingGeometry(1.3, 1.9, 48), fxMat('#b48cff', 0.45)); lueurB.rotation.x = -Math.PI / 2; lueurB.renderOrder = 3;
  g.add(disque, bord, lueurB); g.position.set(x, y + 0.09, z); flashLumiere(x, y + 0.6, z, '#b48cff', 3, 8, 0.45);
  let foudre = 0; fxVie(g, 0.75, (k, gg) => { const tk = k * 0.75, o = tk > 0.48 ? Math.max(0, 1 - (tk - 0.48) / 0.27) : 1, pop = tk < 0.06 ? 0.3 + 0.7 * tk / 0.06 : 1, r = Math.max(0.01, o * pop * (1 + 0.04 * Math.sin(tk * 34)));
    gg.scale.set(r, 1, r); disque.rotation.z = tk * 9; disque.material.opacity = o; bord.material.opacity = 0.95 * o; lueurB.material.opacity = 0.45 * o * (0.75 + 0.25 * Math.sin(tk * 40));
    if (tk < 0.5) for (let i = 0; i < 2; i++) { const a0 = fxAlea() * Math.PI * 2, r0 = 2.2, px = x + Math.cos(a0) * r0, pz = z + Math.sin(a0) * r0; emettre(FX_LUM, 1, { x: px, y: y + 0.15, z: pz, v: [(x - px) * 3.6 - Math.sin(a0) * 3, 0, (z - pz) * 3.6 + Math.cos(a0) * 3], vie: [0.22, 0.28], taille: [0.16, 0.03], c: ['#ffffff', '#c9a6ff'], a: 0.95 }); } /* (des lueurs aspirees en spirale) */
    if (tk < 0.55 && (foudre += 1) % 2 === 0) { const a0 = fxAlea() * Math.PI * 2, p = new T.Vector3(x + Math.cos(a0) * 1.25, y + 0.1, z + Math.sin(a0) * 1.25), q = p.clone(); q.x += Math.cos(a0) * fxEntre(0.3, 0.8); q.z += Math.sin(a0) * fxEntre(0.3, 0.8); q.y += fxEntre(0.2, 0.9); eclairZigzag(p, q, '#c9a6ff'); } }); /* (des eclairs crepitent au bord) */
  emettre(FX_LUM, 26, { x, y: y + 0.2, z, r: 1.1, plat: true, v: [0, 2.4, 0], dv: 0.6, vie: [0.4, 0.7], taille: [0.16, 0.03], c: ['#ffffff', '#c9a6ff'], a: 0.95 });
}
function jaillirPortail(x, y, z) { /* le Bouftou sort du portail : une gerbe violette, de la laine, une onde */
  emettre(FX_VIF, 18, { x, y: y + 0.2, z, r: 0.5, v: [0, 6, 0], dv: 2.2, vie: [0.3, 0.55], taille: [0.12, 0.03], c: ['#ffffff', '#c9a6ff', '#7a4ad8'], grav: 6, frein: 1.5, etire: 0.05 });
  emettre(FX_FUM, 8, { x, y: y + 0.4, z, r: 0.4, v: [0, 2.2, 0], dv: 1.4, vie: [0.4, 0.7], taille: [0.4, 1.1], c: ['#ffffff', '#efe2ff'], a: 0.7, frein: 2.2 });
  onde(x, y + 0.05, z, 1.6, '#e3cfff', 0.25, 0.8); son('impactFleche', undefined, -2, 600 + hasardCents(100));
}
function invoquerJuicy(pt) {
  const pp = paysanMesh.position, st = statsPerso(), u = paysanMesh.userData; if (combat.invoc) { jeter(combat.invoc.m); if (combat.invoc.barre) combat.invoc.barre.remove(); }
  const q0 = pointSort(pt || { x: pp.x + 0.9, z: pp.z + 0.3 }, PORTEE_INVOC), x = q0.x, z = q0.z;
  const y = hauteurSol(x, z, caseIci(x, z)); u.angle = Math.atan2(x - pp.x, z - pp.z); paysanMesh.rotation.y = u.angle;
  const m = copieGabarit('bouftouInvoque', () => { const g = fusionnerBouftou(creerBouftou(T, maille)); ombrePieds(g, 2.4); return g; }); m.scale.setScalar(0.45); poser(m, x, y, z, 0);
  const anneauA = new T.Mesh(new T.RingGeometry(1.35, 1.65, 36), new T.MeshBasicMaterial({ color: '#56d27a', transparent: true, opacity: 0.9, side: T.DoubleSide, depthWrite: false })); anneauA.rotation.x = -Math.PI / 2; anneauA.position.y = 0.08; m.add(anneauA);
  const barre = document.createElement('div'); barre.className = 'pv-monstre allie'; barre.innerHTML = '<i></i>'; $('combat-zone').appendChild(barre);
  if (!u.attaque) u.attaque = { t: 0.08, classe: 'osa', base: u.angle, tour: false, surFrappe: () => { if (combat) coupDeFouet(mainDe(paysanMesh), new T.Vector3(x, y + 0.5, z), paysanMesh, ''); } };
  combat.invoc = { m, x, z, ry: u.angle, vie: DUREE_INVOC, cd: 0.4, pas: 0, frappe: 0, pose: 0.6, barre, chute: CHUTE_INVOC_JUICY, juicy: { st, atterri: false, src: SRC_DEG, y, sorti: false } }; pouf(x, y, z, 3.2, '#d9c2ff'); cercleInvocation(x, y, z);
  portailInvoc(x, y, z); /* (le Bouftou jaillit du portail, majInvoc) */
  toast('Un Bouftou retombe sur les monstres et se bat pendant ' + DUREE_INVOC + ' s.', 'or'); /* (ses degats autour : a l'atterrissage, atterrissageInvoc) */
}
function atterrissageInvoc(iv, x, y, z) { /* il s'ecrase au sol : la laine explose, un dome violet, les monstres autour prennent ses degats (2 fois les tiens, comme a l'appel avant) */
  const J = iv.juicy; secousse(0.18, 0.28); arretImage(0.045); zoomPunch(1.05, 220); son('impactFleche', undefined, 2, -1000 + hasardCents(100));
  onde(x, y, z, 2.6, '#c9a6ff', 0.38, 0.9); onde(x, y, z, 1.6, '#ffffff', 0.25, 0.8); domeChoc(x, y, z, RAYON_INVOC + 0.4, '#b48cff', 0.3); poussiere(x, y, z, 12, 1.7); mottes(x, y, z, 8, 0.9); solFendu(x, y, z, 1.2);
  emettre(FX_FUM, 14, { x, y: y + 0.5, z, r: 0.5, dv: 3.2, haut: true, vie: [0.5, 0.9], taille: [0.5, 1.4], c: ['#ffffff', '#f2ead8'], a: 0.85, frein: 2.6, entree: 0.03 }); /* (la laine qui explose) */
  emettre(FX_VIF, 22, { x, y: y + 0.6, z, r: 0.4, dv: 4.5, haut: true, vie: [0.4, 0.8], taille: [0.13, 0.07], c: ['#ffffff', '#f2ead8'], grav: 5, frein: 1.6 });
  emettre(FX_LUM, 20, { x, y: y + 0.2, z, r: 0.6, dv: 4, haut: true, vie: [0.3, 0.6], taille: [0.12, 0.02], c: ['#ffffff', '#c9a6ff'], grav: 6, etire: 0.03 });
  iv.ecrase = 0;
  const p0 = SRC_DEG; SRC_DEG = J.src || 'Invocation du Bouftou'; let n = 0; /* (les degats restent ranges sous l'Invocation dans le detail du combat) */
  try { combat.monstres.slice().forEach((o) => { if (o.etat !== 'actif' || Math.hypot(o.x - x, o.z - z) >= RAYON_INVOC) return; const d = new T.Vector3(o.x - x, 0, o.z - z); if (d.lengthSq() < 1e-4) d.set(1, 0, 0); d.normalize();
    blesserArc(o, Math.round(J.st.deg * 2), true, n > 0); coupClasse(o, d, { recul: 0.6, saut: 0.45, fort: n === 0, couleur: '#c9a6ff', n: 10 }); etoileImpact(new T.Vector3(o.x, o.m.position.y + o.haut * 0.5, o.z), 0.9, '#c9a6ff'); n++; }); }
  finally { SRC_DEG = p0; }
}
{ const atterrirJS = atterrirBouftou; atterrirBouftou = function (x, y, z) { const iv = combat && combat.invoc; if (!iv || !iv.juicy || iv.juicy.atterri) return atterrirJS.apply(this, arguments); iv.juicy.atterri = true; return atterrissageInvoc(iv, x, y, z); }; }
function finInvocJuicy(iv) { /* il repart en laine et en paillettes violettes qui montent en spirale */
  const p = iv.m.position, y = solA(iv.x, iv.z);
  emettre(FX_FUM, 10, { x: iv.x, y: y + 0.5, z: iv.z, r: 0.4, dv: 1.6, haut: true, vie: [0.5, 0.8], taille: [0.4, 1.1], c: ['#ffffff', '#f2ead8'], a: 0.8, frein: 2.2 });
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; emettre(FX_LUM, 1, { x: iv.x + Math.cos(a) * 0.6, y: y + 0.2 + i * 0.05, z: iv.z + Math.sin(a) * 0.6, v: [-Math.sin(a) * 1.4, 2.2, Math.cos(a) * 1.4], vie: [0.6, 0.9], taille: [0.14, 0.02], c: ['#ffffff', '#c9a6ff'], frein: 1 }); }
  onde(iv.x, y + 0.05, iv.z, 1.4, '#c9a6ff', 0.35, 0.8); flashLumiere(p.x, p.y + 0.5, p.z, '#b48cff', 2, 5, 0.3);
}
{ const majInvocJS = majInvoc; majInvoc = function (dt) {
  const iv = combat && combat.invoc, J = iv && iv.juicy, frappe0 = iv ? iv.frappe : 0, r = majInvocJS.apply(this, arguments);
  if (!J) return r; if (!combat || combat.invoc !== iv) { if (iv.vie <= 0) finInvocJuicy(iv); return r; }
  const s = iv.m.scale.x;
  if (iv.chute > 0) { const kc = 1 - iv.chute / CHUTE_INVOC_JUICY, sol = hauteurSol(iv.x, iv.z, caseIci(iv.x, iv.z)), A = 0.5; /* il jaillit du portail (sous le sol), monte en arc et retombe en accelerant */
    iv.m.position.y = sol + (kc < A ? -1.3 + 3.1 * (1 - Math.pow(1 - kc / A, 2)) : 1.8 * (1 - Math.pow((kc - A) / (1 - A), 2))); if (!J.sorti && kc > 0.12) { J.sorti = true; jaillirPortail(iv.x, sol, iv.z); }
    iv.m.scale.set(s * 0.8, s * 1.4, s * 0.8); const P = iv.m.position; /* (etire par la vitesse, dans une trainee violette et des flocons de laine) */
    emettre(FX_LUM, 2, { x: P.x, y: P.y + 0.6, z: P.z, r: 0.25, v: [0, 2.5, 0], vie: [0.18, 0.28], taille: [0.7, 0.1], c: ['#ffffff', '#b48cff'], a: 0.7 }); emettre(FX_VIF, 1, { x: P.x, y: P.y + 0.7, z: P.z, r: 0.3, v: [0, 1.5, 0], dv: 0.8, vie: [0.3, 0.5], taille: [0.12, 0.06], c: ['#ffffff', '#f2ead8'], frein: 1.5 }); }
  else if (iv.ecrase != null) { iv.ecrase += dt; const t = iv.ecrase, e = Math.exp(-t * 11) * Math.cos(t * 26); /* il s'ecrase, rebondit en s'etirant, puis se pose */
    if (t > 0.5) iv.ecrase = null; else iv.m.scale.set(s * (1 + 0.32 * e), s * (1 - 0.42 * e), s * (1 + 0.32 * e)); }
  if (iv.frappe > 0) { const k = 1 - iv.frappe / 0.25, e2 = Math.sin(k * Math.PI); iv.m.scale.set(iv.m.scale.x * (1 - 0.1 * e2), iv.m.scale.y * (1 - 0.12 * e2), iv.m.scale.z * (1 + 0.28 * e2)); } /* (le coup de tete : il s'etire vers sa cible) */
  return r; }; }
{ const blesserIV = blesser; blesser = function (mo, n, gros, src) { /* chaque coup de tete du Bouftou : la cible blanchit et recule, des etincelles violettes, chiffres en arc */
  if (src != null || gros || JUICE_CRA.coup || SRC_DEG !== 'Bouftou invoqué' || !combat || !combat.invoc || !combat.invoc.juicy || !mo || mo.etat !== 'actif') return blesserIV.apply(this, arguments);
  const iv = combat.invoc, vu = mo.recent; mo.recent = -7; JUICE_CRA.coup = { style: '', gros: false, mos: [], pop: 1.35, taille: 0.85 };
  let r; try { r = blesserIV.apply(this, arguments); } finally { JUICE_CRA.coup = null; }
  if (mo.recent === -7) { mo.recent = vu; return r; }
  const d = new T.Vector3(mo.x - iv.x, 0, mo.z - iv.z); if (d.lengthSq() < 1e-6) d.set(Math.sin(iv.ry), 0, Math.cos(iv.ry)); d.normalize();
  const q = coupClasse(mo, d, { recul: 0.24, couleur: '#c9a6ff', n: 7, flash: 0.07 }); if (q) etoileImpact(q, 0.55, '#e3cfff');
  const maint = performance.now(); if (maint - SON_BOUFTOU_T > 150) { SON_BOUFTOU_T = maint; son('impactFleche', undefined, -3, -600 + hasardCents(150)); }
  return r; }; }
{ const invoquerJS = invoquer; invoquer = function (pt) { if (!juiceSort('invoc')) return invoquerJS.apply(this, arguments); return invoquerJuicy(pt); }; }
