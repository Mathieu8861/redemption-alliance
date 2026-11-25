'use strict';
/* QUATRE SORTS LEGENDAIRES REFAITS (25/11/2026, au formulaire : « Bain de boue, Lance d'os, Pluies de cawottes, Fleche maudite », Mathieu, apres la recette
   commune de 29zb-juice-leg.js) : l'effet lui-meme refait. Ouverts a tous le 25/11/2026 (« Ouvrir aux joueurs », Mathieu au formulaire ;
   juiceSort('boue' | 'lance' | 'cawottes' | 'maudite'), 29z-juice-sorts.js ; JUICE_SORTS.force pour comparer avant et apres).
   Les degats, les zones et le moment ou ils tombent ne changent pas : chaque fonction reprend a l'identique le calcul de l'ancienne. */

/* ---- LE BAIN DE BOUE (Heaume et armes du Dragon Cochon) : la boue gicle en couronne, des paquets retombent et rebondissent, une flaque luisante aux bords
   irreguliers s'etale d'un coup en debordant un peu, des bulles gonflent et crevent, puis elle seche (palit) et s'efface ; les monstres pris dedans ont une
   tache de boue a leurs pieds et degoulinent tant qu'ils sont colles ---- */
const JS_BOUE = { duree: 2 };
const TEX_BOUE = texCanvas(256, (g, n) => { /* une flaque de boue aux bords irreguliers, des remous plus clairs, des reflets luisants */
  const c = n / 2; g.save(); g.beginPath();
  for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2, rr = c * (0.86 + 0.07 * Math.sin(a * 5 + 1) + 0.04 * Math.sin(a * 11) + 0.03 * Math.sin(a * 17 + 2)), X = c + Math.cos(a) * rr, Y = c + Math.sin(a) * rr; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }
  g.closePath(); g.clip(); const d = g.createRadialGradient(c, c, 0, c, c, c); d.addColorStop(0, '#45290f'); d.addColorStop(0.7, '#5a3a1c'); d.addColorStop(0.95, '#7a5230'); g.fillStyle = d; g.fillRect(0, 0, n, n);
  for (let k = 0; k < 40; k++) { const a = fxAlea() * 6.28, r = Math.sqrt(fxAlea()) * c * 0.8, x = c + Math.cos(a) * r, y = c + Math.sin(a) * r, s = 4 + fxAlea() * 14, e = g.createRadialGradient(x, y, 0, x, y, s);
    e.addColorStop(0, 'rgba(120,82,46,0.7)'); e.addColorStop(1, 'rgba(120,82,46,0)'); g.fillStyle = e; g.fillRect(x - s, y - s, s * 2, s * 2); }
  for (let k = 0; k < 16; k++) { const a = fxAlea() * 6.28, r = Math.sqrt(fxAlea()) * c * 0.75; g.fillStyle = 'rgba(255,238,210,0.6)'; g.beginPath(); g.ellipse(c + Math.cos(a) * r, c + Math.sin(a) * r, 2 + fxAlea() * 6, 1 + fxAlea() * 2, -0.6, 0, 6.28); g.fill(); }
  g.restore(); });
const MAT_BULLE_BOUE = mat('#5a3a1c'), MAT_REFLET_BOUE = new T.MeshBasicMaterial({ color: '#ecd8b8', transparent: true, opacity: 0.7, depthWrite: false }); partager(MAT_BULLE_BOUE, MAT_REFLET_BOUE);
function bulleBoue(x, y, z, r, vie) { /* une bulle de boue qui gonfle puis creve en projetant des gouttes */
  const b = sansClic(new T.Mesh(GEO_BULLE, MAT_BULLE_BOUE)), reflet = sansClic(new T.Mesh(GEO_BULLE, MAT_REFLET_BOUE)); reflet.scale.setScalar(0.25); reflet.position.set(-0.35, 0.5, 0.35); b.add(reflet);
  b.position.set(x, y, z); scene.add(b); let t = 0;
  effets.push((dt) => { t += dt; const k = Math.min(1, t / vie), s = r * (0.2 + 0.8 * Math.sin(k * Math.PI / 2)); b.scale.set(s, s * 0.7, s); b.position.y = y + s * 0.2;
    if (k >= 1) { jeter(b); emettre(FX_VIF, 4, { x, y: y + r * 0.4, z, dv: 1.4, haut: true, vie: [0.25, 0.4], taille: [0.07, 0.03], c: ['#7a5230', '#45290f'], grav: 10 }); return true; } });
}
function colleBoue(mo, duree) { /* un monstre colle : une tache de boue a ses pieds, il degouline */
  const c0 = combat, R = 0.45 + 0.3 * (mo.d.ombre || 1), y = solA(mo.x, mo.z); tacheSol(mo.x, y, mo.z, R, '#45290f', 0.75, duree, '#8a6038'); let t = 0, acc = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || mo.etat !== 'actif' || !mo.m || t >= duree) return true; acc += dt * 9;
    while (acc >= 1) { acc -= 1; const h = mo.haut || 1.5, a = fxAlea() * 6.28, d = R * 0.5 * fxAlea();
      emettre(FX_VIF, 1, { x: mo.x + Math.cos(a) * d, y: mo.m.position.y + h * fxEntre(0.2, 0.7), z: mo.z + Math.sin(a) * d, v: [0, -0.4, 0], vie: [0.35, 0.5], taille: [0.1, 0.06], c: ['#6a4524', '#3a2410'], grav: 9, sol: y + 0.05, rebond: 0 }); }
    return false; });
}
function boueJuicy(x, z, r, st) {
  const c0 = combat, y = solA(x, z);
  son('plouf', undefined, 3, -350 + hasardCents(80)); secousse(0.14, 0.25);
  const f = sansClic(new T.Mesh(new T.CircleGeometry(r * 1.05, 40), new T.MeshBasicMaterial({ map: TEX_BOUE, transparent: true, opacity: 0, depthWrite: false })));
  f.rotation.x = -Math.PI / 2; f.rotation.z = fxAlea() * 6; f.position.set(x, y + 0.06, z); f.renderOrder = 2; scene.add(f);
  for (let i = 0; i < 40; i++) { const a = i / 40 * 6.28 + fxAlea() * 0.2, v = 1.8 + fxAlea() * 1.8; /* la couronne qui gicle */
    emettre(FX_VIF, 1, { x: x + Math.cos(a) * r * 0.25, y: y + 0.15, z: z + Math.sin(a) * r * 0.25, v: [Math.cos(a) * v, 3 + fxAlea() * 2.4, Math.sin(a) * v], vie: [0.7, 1.0], taille: [0.17, 0.1], c: ['#7a5230', '#45290f'], grav: 11, sol: y + 0.06, rebond: 0.12 }); }
  for (let i = 0; i < 10; i++) { const a = fxAlea() * 6.28, v = 1 + fxAlea() * 1.6; /* de gros paquets */
    emettre(FX_VIF, 1, { x: x + Math.cos(a) * 0.3, y: y + 0.2, z: z + Math.sin(a) * 0.3, v: [Math.cos(a) * v, 4 + fxAlea() * 2, Math.sin(a) * v], vie: [0.8, 1.1], taille: [0.34, 0.24], c: ['#6a4524', '#45290f'], grav: 12, sol: y + 0.06, rebond: 0.05 }); }
  emettre(FX_VIF, 16, { x, y: y + 0.1, z, r: 0.15, v: [0, 5.8, 0], dv: 1.3, vie: [0.5, 0.7], taille: [0.22, 0.09], c: ['#8a6038', '#45290f'], grav: 12, sol: y + 0.06, rebond: 0.05 }); /* (la gerbe du centre) */
  emettre(FX_FUM, 8, { x, y: y + 0.3, z, r: r * 0.5, v: [0, 0.6, 0], vie: [0.6, 1.0], taille: [0.6, 1.4], c: ['#9a7650', '#7a5a3a'], a: 0.45 });
  mottes(x, y, z, 12, 1.1); onde(x, y, z, r + 0.6, '#6a4524', 0.4, 0.9); onde(x, y, z, r * 0.7, '#a07850', 0.3, 0.8);
  /* les degats et la colle : a l'identique de boueLeg (21-combat.js) */
  c0.monstres.slice().forEach((o) => { if (o.etat !== 'actif' || Math.hypot(o.x - x, o.z - z) > r) return; blesser(o, Math.round(st.deg * 2), true); if (o.etat === 'actif') { o.bloqueT = Math.max(o.bloqueT || 0, o.d.boss ? 1 : 2); colleBoue(o, o.d.boss ? 1 : 2); } });
  let t = 0, bulle = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || t >= JS_BOUE.duree) { jeter(f); return true; }
    const e = Math.min(1, t / 0.18), s = e < 1 ? 0.35 + 0.8 * (1 - (1 - e) * (1 - e)) : 1.15 - 0.15 * Math.min(1, (t - 0.18) / 0.25), seche = Math.max(0, (t - 1.2) / 0.8); /* (elle s'etale en debordant un peu, puis seche) */
    f.scale.setScalar(s); f.material.opacity = Math.min(1, t / 0.05) * (1 - Math.max(0, (t - 1.5) / 0.5)); f.material.color.setScalar(1 + 0.45 * seche);
    if ((bulle += dt) > 0.08 && t < 1.5) { bulle = 0; const a = fxAlea() * 6.28, d = fxAlea() * r * 0.8; bulleBoue(x + Math.cos(a) * d, y + 0.06, z + Math.sin(a) * d, fxEntre(0.08, 0.18), fxEntre(0.3, 0.6)); }
    return false; });
}
{ const boueJS = boueLeg; boueLeg = function (x, z, r, st) { if (!juiceSort('boue')) return boueJS.apply(this, arguments); return boueJuicy(x, z, r, st); }; }

/* ---- LA LANCE D'OS (Heaume du Chafer Cuirasse) : la lance, plus grande, file dans une aura spectrale vert d'eau, une spirale d'ames autour du fut et un sillage
   qui luit au sol ; chaque monstre transperce : un eclat, un anneau qui se referme sur lui, des eclats d'os, une petite ame qui s'echappe ; au bout, elle se plante
   dans un impact d'esprit plus grand ---- */
function lanceOsJuicy(pt, st) {
  const pp = paysanMesh.position, u = paysanMesh.userData, c0 = combat, a = Math.hypot(pt.x - pp.x, pt.z - pp.z) > 0.05 ? Math.atan2(pt.x - pp.x, pt.z - pp.z) : paysanMesh.rotation.y, dir = new T.Vector3(Math.sin(a), 0, Math.cos(a));
  chemin = []; arrivee = null; combat.ordre = false; u.angle = a; paysanMesh.rotation.y = a; u.attaque = { t: 0, classe: classeDe(), base: a, tour: false, surFrappe: () => {} }; /* (le geste de lancer) */
  const p0 = pp.clone(), de = pp.clone().addScaledVector(dir, 0.5), fin = pp.clone().addScaledVector(dir, PORTEE_LANCE_OS); de.y += 1.8; fin.y = solA(fin.x, fin.z) + 0.3; /* (elle part plus haut : a 1,15, elle passait cachee derriere les monstres) */
  const os = lanceOs(), touches = new Set(), vol = 0.45, avant = new T.Vector3(); os.scale.setScalar(1.0); os.position.copy(de); os.lookAt(fin); sansClic(os); scene.add(os);
  secousse(0.06, 0.14); flashLumiere(de.x, de.y, de.z, '#bfffe8', 2, 5, 0.25); anneauSouffle(de.clone().addScaledVector(dir, 0.4), dir, 0.08, 0.7, 0.16, '#c8fff0', 0.85); son('arc', undefined, 0, -400);
  let t = 0, sillage = 0; effets.push((dt) => { t += dt; if (combat !== c0) { jeter(os); return true; } const k = Math.min(1, t / vol); avant.copy(os.position); os.position.lerpVectors(de, fin, k); os.position.y += Math.sin(k * Math.PI) * 0.35;
    if (os.position.distanceToSquared(avant) > 1e-6) os.lookAt(os.position.clone().multiplyScalar(2).sub(avant));
    const P = os.position; emettre(FX_LUM, 1, { x: P.x, y: P.y, z: P.z, vie: [0.05, 0.06], taille: [1.0, 0.7], c: ['#bfffe8', '#2fbf8a'], a: 0.6 }); /* (l'aura) */
    for (let i = 0; i < 3; i++) { const q = (i + 0.5) / 3, x = avant.x + (P.x - avant.x) * q, y = avant.y + (P.y - avant.y) * q, z = avant.z + (P.z - avant.z) * q; /* (la trainee) */
      emettre(FX_VIF, 1, { x, y, z, vie: [0.18, 0.28], taille: [0.24, 0.04], c: ['#7fe8c0', '#1f8a6a'], a: 0.95 }); emettre(FX_VIF, 1, { x, y, z, vie: [0.1, 0.16], taille: [0.1, 0.02], c: ['#ffffff', '#5fe8b0'], a: 1 }); } /* (une trainee opaque vert d'eau : en lumiere, elle disparaissait sur le sable clair) */
    for (let i = 0; i < 2; i++) { const s = t * 38 + i * Math.PI, r = 0.3; emettre(FX_VIF, 1, { x: P.x + Math.cos(a) * Math.cos(s) * r, y: P.y + Math.sin(s) * r, z: P.z - Math.sin(a) * Math.cos(s) * r, vie: [0.2, 0.3], taille: [0.12, 0.03], c: ['#dfffee', '#2fbf8a'], a: 1 }); } /* (la spirale) */
    if (fxAlea() < 0.5) emettre(FX_FUM, 1, { x: P.x, y: P.y, z: P.z, vie: [0.3, 0.5], taille: [0.25, 0.6], c: ['#9fdcc4', '#5fa88c'], a: 0.45 });
    if ((sillage += dt) > 0.03) { sillage = 0; tacheSol(P.x, solA(P.x, P.z), P.z, 0.32, '#3fd8a0', 0.4, 0.8); } /* (le sillage au sol) */
    if (!c0.fin) c0.monstres.slice().forEach((o) => { if (o.etat !== 'actif' || touches.has(o) || Math.hypot(o.x - os.position.x, o.z - os.position.z) > 0.7 + 0.25 * (o.d.ombre || 1)) return; touches.add(o);
      const f = Math.min(3, 1.5 + 0.25 * Math.hypot(o.x - p0.x, o.z - p0.z) / 2), q = new T.Vector3(o.x, o.m.position.y + o.haut * 0.5, o.z); /* (les degats : a l'identique de lanceOsPerso, 22-sorts.js) */
      etoileImpact(q, 1.2, '#c8fff0'); anneauSouffle(q, dir, 0.9, 0.12, 0.18, '#9ff0d0', 0.9); eclatsRoche(o.x, solA(o.x, o.z), o.z, 4, 0.6, MATS_OS); ameEnvol(o.x, o.m.position.y + o.haut * 0.4, o.z, 0.55, 0.05);
      blesser(o, Math.round(st.deg * f), true);
      if (f >= 2) chiffre('De loin ×' + String(Math.round(f * 10) / 10).replace('.', ','), new T.Vector3(o.x, o.m.position.y + o.haut + 0.6, o.z), 'gros'); });
    if (k < 1) return false;
    impactElement('esprit', fin.x, fin.z, 1.6); secousse(0.1, 0.2); flashLumiere(fin.x, fin.y + 0.5, fin.z, '#5fffc0', 2.4, 6, 0.4); const y0 = os.position.y; let s2 = 0;
    effets.push((d3) => { s2 += d3; if (combat !== c0) { jeter(os); return true; } if (s2 > 1.0) os.position.y = y0 - (s2 - 1.0) * 1.5; if (s2 > 1.6) { jeter(os); return true; } return false; }); /* (plantee au sol, puis elle s'enfonce) */
    return true; });
}
{ const lanceJS = lanceOsPerso; lanceOsPerso = function (pt, st) { if (!juiceSort('lance')) return lanceJS.apply(this, arguments); return lanceOsJuicy(pt, st); }; }

/* ---- LES PLUIES DE CAWOTTES (Iop et Cra) : de vraies cawottes (corps tourne, stries, fanes), une cible orange se resserre au sol avant chacune ; elle tombe en
   sifflant et en tournant, etiree par la vitesse, dans une trainee ; au sol elle eclate en morceaux orange, des fanes s'envolent, le jus gicle, un petit cratere.
   Meme instant de chute qu'avant (0,2 s apres son depart) : les degats tombent avec elle ---- */
let GEO_CAWOTTE_V2 = null;
const MATS_CAWOTTE_V2 = [mat('#f08a24', { flatShading: true }), mat('#c95d14'), mat('#5fae3a'), mat('#4f9a2e')], MATS_ECLAT_CAWOTTE = ['#f08a24', '#c95d14', '#ffb06a'].map((c) => mat(c)); partager(...MATS_CAWOTTE_V2, ...MATS_ECLAT_CAWOTTE);
function modeleCawotte() { /* la pointe en bas (y negatif), l'epaule en haut, les fanes au-dessus */
  if (!GEO_CAWOTTE_V2) { const prof = [[0, -0.62], [0.05, -0.45], [0.11, -0.15], [0.16, 0.12], [0.19, 0.3], [0.18, 0.38], [0.12, 0.43], [0, 0.44]].map(([x, y]) => new T.Vector2(x, y)); GEO_CAWOTTE_V2 = new T.LatheGeometry(prof, 10); partager(GEO_CAWOTTE_V2); }
  const g = new T.Group(); g.add(new T.Mesh(GEO_CAWOTTE_V2, MATS_CAWOTTE_V2[0]));
  [[-0.05, 0.12], [-0.25, 0.135], [0.18, 0.17]].forEach(([y, r]) => { const s = new T.Mesh(new T.TorusGeometry(r, 0.012, 3, 10, 2.2), MATS_CAWOTTE_V2[1]); s.rotation.x = Math.PI / 2; s.rotation.z = y * 9; s.position.y = y; g.add(s); }); /* (des stries) */
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4, f = new T.Mesh(new T.ConeGeometry(0.05, 0.42, 4), MATS_CAWOTTE_V2[2 + (i % 2)]); f.position.set(Math.sin(a) * 0.05, 0.62, Math.cos(a) * 0.05); f.rotation.set(Math.cos(a) * 0.45, 0, -Math.sin(a) * 0.45); g.add(f); } /* (les fanes) */
  return sansClic(g);
}
function cawotteJuicy(x, y, z, retard) {
  const g = modeleCawotte(); g.visible = false; scene.add(g); cibleSol(x, y, z, (retard || 0) + 0.2);
  const ox = fxEntre(-0.6, 0.6), oz = fxEntre(-0.6, 0.6), H = 7; let t = -(retard || 0), fini = false; const prec = new T.Vector3();
  effets.push((dt) => { t += dt; if (t < 0) return false; if (!g.visible) { g.visible = true; g.position.set(x + ox, y + H, z + oz); }
    const k = Math.min(1, t / 0.2), e = k * k; prec.copy(g.position); g.position.set(x + ox * (1 - k), y + 0.4 + (1 - e) * H, z + oz * (1 - k)); /* (elle accelere en tombant, un peu en biais) */
    g.rotation.set(-oz * 0.25, t * 22, ox * 0.25); g.scale.set(0.9, 1.25 + 0.35 * k, 0.9); /* (elle tourne, etiree par la vitesse) */
    for (let i = 0; i < 2; i++) { const q = (i + 0.5) / 2, px = prec.x + (g.position.x - prec.x) * q, py = prec.y + (g.position.y - prec.y) * q + 0.5, pz = prec.z + (g.position.z - prec.z) * q;
      emettre(FX_LUM, 1, { x: px, y: py, z: pz, vie: [0.16, 0.24], taille: [0.36, 0.05], c: ['#ffffff', '#ffb46a'], a: 0.75 }); emettre(FX_VIF, 1, { x: px, y: py, z: pz, vie: [0.1, 0.16], taille: [0.08, 0.02], c: ['#fff3d8', '#f08a24'], a: 0.95 }); }
    if (k < 1 || fini) return false; fini = true; jeter(g); const p = new T.Vector3(x, y + 0.35, z);
    etoileImpact(p, 1.05, '#f08a24'); flashLumiere(x, y + 0.5, z, '#ffa040', 2, 5, 0.3); onde(x, y, z, 1.8, '#f08a24', 0.3, 0.9); onde(x, y, z, 1.0, '#ffffff', 0.22, 0.7);
    eclatsRoche(x, y, z, 9, 0.9, MATS_ECLAT_CAWOTTE); feuillesVolantes(x, y + 0.3, z, 0.6, 5, false); /* (elle eclate en morceaux, ses fanes s'envolent) */
    emettre(FX_VIF, 14, { x, y: y + 0.3, z, r: 0.1, dv: 3.2, haut: true, vie: [0.3, 0.55], taille: [0.09, 0.03], c: ['#ffd08a', '#f08a24', '#c95d14'], grav: 10, sol: y + 0.04, rebond: 0.2 }); /* (le jus) */
    tacheSol(x, y, z, 0.55, '#6a4524', 0.5, 1.3); mottes(x, y, z, 6, 0.9); poussiere(x, y, z, 6, 1); secousse(0.08, 0.15); son('croque', undefined, 0, hasardCents(150));
    return true; });
}
{ const cawotteJS = pluieCawotte; pluieCawotte = function (x, y, z, retard) { if (!juiceSort('cawottes')) return cawotteJS.apply(this, arguments); return cawotteJuicy(x, y, z, retard); }; }

/* ---- LA FLECHE MAUDITE (Arc des Tetes Maudites, Cra) : une fleche noire a pointe violette qui luit, dans une trainee violette et une fumee sombre, des ames
   maudites s'en detachent ; a l'impact, un eclat violet ; la malediction enveloppe le monstre : un anneau qui se referme sur lui, un cercle de runes sous ses
   pieds, une spirale violette qui monte autour de lui, de la fumee noire. Les degats et la malediction : flecheMaudite et maudire, inchanges (22-sorts.js) ---- */
let MAT_AME_MAUDITE = null;
function ameMaudite(p) { /* une petite ame violette qui se detache de la fleche et s'efface */
  if (!MAT_AME_MAUDITE) { MAT_AME_MAUDITE = new T.SpriteMaterial({ map: TEX_FANTOME, color: '#c77dff', transparent: true, depthWrite: false }); partager(MAT_AME_MAUDITE); }
  const sp = sansClic(new T.Sprite(MAT_AME_MAUDITE.clone())), ph = fxAlea() * 6; sp.renderOrder = 7; sp.position.copy(p); scene.add(sp); let t = 0;
  effets.push((dt) => { t += dt; const k = t / 0.55; sp.position.y += dt * 1.1; sp.position.x += Math.sin(t * 9 + ph) * dt * 0.6; sp.scale.set(0.28 + 0.12 * k, 0.35 + 0.15 * k, 1); sp.material.opacity = Math.min(1, t / 0.08) * Math.max(0, 1 - k) * 0.9;
    if (k >= 1) { jeter(sp); return true; } });
}
function maledictionEnveloppe(mo) {
  const c0 = combat, h = mo.haut || 1.5, R = 0.45 * (mo.d.ombre || 1) + 0.35; let t = 0;
  const an = sansClic(new T.Mesh(new T.RingGeometry(0.85, 1, 40), fxMat('#a64dff', 0.9))); an.rotation.x = -Math.PI / 2; an.renderOrder = 4; scene.add(an);
  impactMagie(mo.x, mo.z, R * 1.7, '#8f55e0');
  effets.push((dt) => { t += dt; if (combat !== c0 || !mo.m) { jeter(an); return true; } const y0 = mo.m.position.y, k = Math.min(1, t / 0.3);
    an.position.set(mo.x, y0 + 0.08, mo.z); an.scale.setScalar(R * (3 - 2.2 * k)); an.material.opacity = 0.9 * (k < 1 ? 1 : Math.max(0, 1 - (t - 0.3) / 0.2)); /* (l'anneau se referme sur lui) */
    if (t > 0.1 && t < 0.9) for (let i = 0; i < 2; i++) { const ph = t * 14 + i * Math.PI, hy = (t - 0.1) / 0.8 * h * 1.1, px = mo.x + Math.cos(ph) * R, pz = mo.z + Math.sin(ph) * R; /* (la spirale qui monte autour de lui) */
      emettre(FX_LUM, 1, { x: px, y: y0 + hy, z: pz, v: [0, 0.6, 0], vie: [0.3, 0.45], taille: [0.24, 0.03], c: ['#f3e0ff', '#a64dff'], a: 0.9 }); emettre(FX_VIF, 1, { x: px, y: y0 + hy, z: pz, vie: [0.2, 0.3], taille: [0.08, 0.02], c: ['#ffffff', '#c77dff'], a: 0.95 }); }
    if (t < 0.6 && fxAlea() < 0.5) emettre(FX_FUM, 1, { x: mo.x + fxEntre(-R, R) * 0.6, y: y0 + 0.2, z: mo.z + fxEntre(-R, R) * 0.6, v: [0, 0.9, 0], vie: [0.6, 0.9], taille: [0.3, 0.9], c: ['#3a1a50', '#1a0a28'], a: 0.5, entree: 0.1 });
    if (t > 0.95) { jeter(an); return true; } return false; });
}
function flecheMauditeVol(pv, auImpact) {
  const de = pointeArc(paysanMesh), fl = new T.Group(), d0 = pv.clone().sub(de).normalize(); fl.add(boite(0.045, 0.045, 0.6, '#2a1240'));
  const pointe = cone(0.06, 0.16, '#c77dff', 5); pointe.rotation.x = Math.PI / 2; pointe.position.z = 0.36; fl.add(pointe);
  const coeur = new T.Mesh(new T.IcosahedronGeometry(0.11, 1), new T.MeshBasicMaterial({ color: '#e3bcff' })); coeur.position.z = 0.36; fl.add(coeur);
  for (const s of [-1, 1]) { const pl = boite(0.14, 0.006, 0.12, '#6a2a9a'); pl.position.set(0, 0, -0.26); pl.rotation.z = s * 0.8; fl.add(pl); }
  sansClic(fl); fl.scale.z = 1.35; scene.add(fl); fl.position.copy(de); fl.lookAt(pv);
  decocher(de, pv); flashLumiere(de.x, de.y, de.z, '#a64dff', 1.6, 4, 0.25); anneauSouffle(de.clone().addScaledVector(d0, 0.3), d0, 0.05, 0.5, 0.14, '#c77dff', 0.85);
  const vol = 0.32, prec = de.clone(), suiv = new T.Vector3(), bout = new T.Vector3(); let t = 0, ame = 0;
  effets.push((dt) => { t += dt / vol; const k = Math.min(1, t); prec.copy(fl.position); posFleche(de, pv, k, fl.position); posFleche(de, pv, Math.min(1, k + 0.04), suiv); if (k < 1) fl.lookAt(suiv);
    fl.updateMatrixWorld(); bout.set(0, 0, 0.36).applyMatrix4(fl.matrixWorld);
    emettre(FX_LUM, 1, { x: bout.x, y: bout.y, z: bout.z, vie: [0.04, 0.05], taille: [0.6, 0.35], c: ['#f3e0ff', '#a64dff'], a: 0.9 });
    for (let i = 0; i < 3; i++) { const q = (i + 0.5) / 3, x = prec.x + (fl.position.x - prec.x) * q, y = prec.y + (fl.position.y - prec.y) * q, z = prec.z + (fl.position.z - prec.z) * q;
      emettre(FX_LUM, 1, { x, y, z, vie: [0.14, 0.22], taille: [0.34, 0.04], c: ['#d9a8ff', '#6a1fb0'], a: 0.7 }); emettre(FX_VIF, 1, { x, y, z, vie: [0.1, 0.15], taille: [0.08, 0.02], c: ['#f3e0ff', '#8f3fd8'], a: 0.95 }); }
    if (fxAlea() < 0.6) emettre(FX_FUM, 1, { x: prec.x, y: prec.y, z: prec.z, v: [0, 0.4, 0], vie: [0.4, 0.6], taille: [0.25, 0.7], c: ['#3a1a50', '#1a0a28'], a: 0.45, entree: 0.05 });
    if ((ame += dt) > 0.1 && k < 0.9) { ame = 0; ameMaudite(prec); }
    if (t < 1) return false;
    jeter(fl); const dir = pv.clone().sub(prec).normalize();
    etoileImpact(pv, 1.0, '#a64dff'); flashLumiere(pv.x, pv.y, pv.z, '#a64dff', 3, 6, 0.35); anneauSouffle(pv.clone(), dir, 0.1, 0.9, 0.18, '#c77dff', 0.9);
    emettre(FX_VIF, 14, { x: pv.x, y: pv.y, z: pv.z, r: 0.05, v: [dir.x * 6, dir.y * 6 + 0.8, dir.z * 6], dv: 2.6, vie: [0.2, 0.4], taille: [0.09, 0.02], c: ['#ffffff', '#e3bcff', '#a64dff', '#4a1f73'], grav: 6, frein: 2.4, etire: 0.05 });
    son('impactFleche', undefined, 1, -700 + hasardCents(80));
    auImpact(); /* (flecheMaudite : les degats et la malediction, inchanges) */
    const mo = combat && combat.monstres.filter((o) => o.etat === 'actif' && o.maudit > 0 && Math.hypot(o.x - pv.x, o.z - pv.z) < 3).sort((p1, p2) => Math.hypot(p1.x - pv.x, p1.z - pv.z) - Math.hypot(p2.x - pv.x, p2.z - pv.z))[0];
    if (mo) maledictionEnveloppe(mo);
    return true; });
}
{ const effetFrappeFM = effetFrappe; effetFrappe = function (classe, pv, auImpact, feu) {
  if (classe !== 'cra' || feu || !combat || !juiceSort('maudite') || typeof SRC_DEG !== 'string' || SRC_DEG !== nomSortLeg(sortLeg('ancestral'), 'arme')) return effetFrappeFM.apply(this, arguments);
  return flecheMauditeVol(pv, auImpact); }; } /* (la fleche du geste de l'Arc des Tetes Maudites : on la reconnait a la source de ses degats, 23-fin-combat.js) */
