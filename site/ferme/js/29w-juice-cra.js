'use strict';
/* LA FLECHE DU CRA « JUICY » (25/11/2026, Mathieu : « commence par la fleche du Cra », d'apres les videos de vasilev.yegor, IDEES-JUICE.md). Pour tous les joueurs
   depuis le 25/11/2026 (JUICE_CRA.force : true / false pour comparer avant et apres dans les essais).
   La fleche de base et la fleche de feu (une sur dix) ; les fleches de glace et du coup fatal des ultis gardent leur effet.
   1. la charge : pendant qu'il bande l'arc, des etincelles sont aspirees vers la pointe et une lueur y gonfle ;
   2. le coeur : la pointe brille en vol, la fleche s'etire un peu et suit son arc (elle pique du nez en descendant) ;
   3. la trainee : un filet de lumiere blanc et or, continu, derriere la fleche ;
   4. l'eclat : a l'impact, un flash, une etoile, et des etincelles projetees A TRAVERS le monstre, dans le sens de la fleche, avec un anneau de souffle ;
   5. la reaction : le monstre devient blanc deux ou trois images et s'ecrase un instant avant de revenir (les monstres animes ; les autres gonflent deja) ;
   6. le son : la corde un peu plus haut ou plus bas a chaque tir, et un claquement sec a l'impact, lui aussi a hauteur variable ;
   7. la trace : la fleche reste plantee dans le monstre un court instant ;
   8. les chiffres : ils sautent en arc avec un petit rebond d'echelle, plus gros sur la fleche de feu.
   Les coups qui comptent marquent un temps : la fleche de feu fige le jeu 45 ms avec une petite secousse ; le coup qui abat un boss ou un demi-boss, 70 ms.
   Jamais d'arret sur image sur les coups ordinaires : le Cra tire trop vite, et les hordes seraient illisibles. */
const JUICE_CRA = { force: null, coup: null };
const juiceCra = () => (JUICE_CRA.force != null ? JUICE_CRA.force : true); /* (ouverte a tous le 25/11/2026, « Ouvrir aux joueurs », Mathieu au formulaire ; mode test seulement avant) */
const JC = { charge: 0.32, vol: 0.28, arc: 0.35, etire: 1.3, flash: 0.06, ecrase: 0.17, plantee: 0.7, maxPlantees: 3, arretFeu: 0.045, arretBoss: 0.07 };
const hasardCents = (a) => Math.round((Math.random() * 2 - 1) * a);

/* ---- 1. la charge, pendant que l'arc se bande ---- */
function chargeArc(a) {
  const u = paysanMesh.userData, duree = Math.min(JC.charge, 0.5 * (a.d || 0.5)); let t = 0;
  effets.push((dt) => {
    t += dt; if (u.attaque !== a || t >= duree) return true; const k = t / duree, p = pointeArc(paysanMesh);
    for (let i = 0; i < 2; i++) { const ox = (fxAlea() - 0.5) * 0.9, oy = (fxAlea() - 0.2) * 0.7, oz = (fxAlea() - 0.5) * 0.9, v = 1 / 0.14;
      emettre(FX_VIF, 1, { x: p.x + ox, y: p.y + oy, z: p.z + oz, v: [-ox * v, -oy * v, -oz * v], vie: [0.12, 0.14], taille: [0.05, 0.02], c: ['#ffffff', '#ffe08a'], a: 0.9, etire: 0.03 }); }
    emettre(FX_LUM, 1, { x: p.x, y: p.y, z: p.z, vie: [0.04, 0.05], taille: [0.12 + 0.4 * k, 0.1 + 0.35 * k], c: ['#ffffff', '#fff1c0'], a: 0.55 + 0.35 * k });
  });
}
{ const animerAttaqueJC = animerAttaque; animerAttaque = function (dt) {
  const u = paysanMesh && paysanMesh.userData, a = u && u.attaque;
  if (a && a.classe === 'cra' && !a.jc && juiceCra()) { a.jc = true; chargeArc(a); }
  return animerAttaqueJC.apply(this, arguments); }; }

/* ---- 2 et 3. la fleche en vol : pointe qui brille, etirement, trainee continue ---- */
const posFleche = (de, pv, k, o) => o.lerpVectors(de, pv, k).setY(o.y + Math.sin(k * Math.PI) * JC.arc);
function traineeJuicy(a, b, style) {
  const n = 3; for (let i = 0; i < n; i++) { const k = (i + 0.5) / n, x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k, z = a.z + (b.z - a.z) * k;
    emettre(FX_LUM, 1, { x, y, z, vie: [0.1, 0.16], taille: [0.26, 0.03], c: style === 'feu' ? ['#fff3b0', '#ff8a1e'] : ['#ffffff', '#ffd98a'], a: 0.6 });
    emettre(FX_VIF, 1, { x, y, z, vie: [0.08, 0.13], taille: [0.07, 0.015], c: style === 'feu' ? ['#fff3b0', '#e8601a'] : ['#ffffff', '#f0a640'], a: 0.95 }); } /* (le coeur opaque : en lumiere seule, la trainee disparaissait sur le sable clair) */
  if (fxAlea() < 0.35) emettre(FX_VIF, 1, { x: b.x, y: b.y, z: b.z, r: 0.04, dv: 0.6, vie: [0.16, 0.26], taille: [0.05, 0.015], c: ['#ffffff', '#ffd36a'], grav: 3, etire: 0.02 });
}
function impactJuicy(p, dir, style) {
  const feu = style === 'feu', c = feu ? '#ff7a1e' : '#ffc93a';
  etoileImpact(p, feu ? 1.0 : 0.75, c);
  emettre(FX_VIF, feu ? 18 : 12, { x: p.x, y: p.y, z: p.z, r: 0.05, v: [dir.x * 6.5, dir.y * 6.5 + 0.8, dir.z * 6.5], dv: 2.8, vie: [0.16, 0.34], taille: [0.09, 0.02], c: ['#ffffff', c, '#e8601a', '#b8400e'], grav: 8, frein: 2.4, etire: 0.055 }); /* (a travers le monstre, dans le sens de la fleche) */
  anneauSouffle(p.clone().addScaledVector(dir, 0.1), dir, 0.08, feu ? 0.85 : 0.6, 0.16, feu ? '#ffb46a' : '#fff1c0', 0.85);
  if (feu) { boule(p.x, p.y, p.z, 0.6, ['#ff9a2e', '#d8380e'], false); flashLumiere(p.x, p.y + 0.3, p.z, '#ff8a2e', 3, 6, 0.3); const ys = solA(p.x, p.z); brulure(p.x, ys, p.z, 0.6); }
}

/* ---- 5. la reaction : flash blanc et ecrasement (monstres animes) ---- */
/* (26/11/2026, « certains mobs, quand on les frappe, ca fait une animation blanche sur eux, et ils restent bloques en blanc », Mathieu : sous les tirs rapides du Cra,
   les tours, les sorts, chaque coup relancait le flash, le monstre restait blanc. Un flash au plus toutes les 0,3 s, un peu moins blanc ; mort, il reprend sa couleur
   tout de suite) */
const FLASH_JC = { ecart: 0.3, blanc: 0.8 };
function reactionJuicy(mo, fort) {
  if (!mo || !mo.m) return; const now = performance.now() / 1000; if (!(mo.flashT0 && now - mo.flashT0 < FLASH_JC.ecart)) { mo.flashB = JC.flash; mo.flashT0 = now; }
  const e = mo.echelle || mo.m.scale.x; if (mo.etat === 'actif' && m0Anim(mo) && !mo.attrape && (mo.ecraseT != null || Math.abs(mo.m.scale.x - e) <= e * 0.03)) { mo.ecraseB = e; mo.ecraseT = 0; /* (jamais pendant qu'autre chose le grandit ou le retrecit) */ mo.ecraseA = (mo.d && (mo.d.boss || mo.d.stable) ? 0.08 : 0.2) * (fort ? 1.4 : 1); }
}
{ const majSqJC = majSquelette; majSquelette = function (mo, v, dt) { const r = majSqJC.apply(this, arguments);
  const an = mo.m && mo.m.userData.anim;
  if (mo.flashB > 0 && an && an.peau && mo.etat !== 'actif') { mo.flashB = 0; an.peau.forEach((m) => { if (m.emissive) { const b0 = m.emissiveMap ? 1 : 0, Lu = an.lueur; m.emissive.setRGB(Lu ? Lu.r : b0, Lu ? Lu.g : b0, Lu ? Lu.b : b0); } }); } /* (mort pendant le flash : sa couleur revient tout de suite) */
  if (mo.flashB > 0 && an && an.peau) { mo.flashB -= dt; if (mo.flashB <= 0) an.eclat = Math.max(an.eclat || 0, 1e-4); /* (la fin du flash : la couleur d'origine revient a l'image suivante (22c-squelettes.js) ; sans eclat en cours, le monstre restait pale, vu au fouet de l'Osa le 25/11) */
    else { const k = (mo.flashB / JC.flash > 0.35 ? 1 : 0.5) * FLASH_JC.blanc; an.peau.forEach((m) => { if (m.emissive) m.emissive.setRGB(0.95 * k, 0.95 * k, 0.9 * k); }); } }
  if (mo.ecraseT != null && mo.m) { mo.ecraseT += dt; const t = mo.ecraseT, b = mo.ecraseB || 1;
    if (t >= JC.ecrase || mo.etat !== 'actif') { mo.m.scale.setScalar(b); mo.ecraseT = null; }
    else { const s = mo.ecraseA * Math.exp(-t * 16) * Math.cos(t * 38); mo.m.scale.set(b * (1 + s * 0.6), b * (1 - s), b * (1 + s * 0.6)); } }
  return r; }; }
function flashSansSquelette(mo) { /* un monstre sans squelette : un halo blanc a sa taille (il gonfle deja sous les coups) */
  if (!mo.m || m0Anim(mo)) return; const h = mo.haut || 1.5; emettre(FX_LUM, 1, { x: mo.x, y: mo.m.position.y + h * 0.5, z: mo.z, vie: [0.06, 0.07], taille: [h * 1.1, h * 1.2], c: ['#ffffff', '#ffffff'], a: 0.55, entree: 0.005 });
}

/* ---- 7. la fleche plantee ---- */
function flechePlantee(mo, p, dir, style) {
  if (!mo || mo.etat !== 'actif' || !mo.m) return; const L = (mo.plantees = (mo.plantees || []).filter((x) => x.parent));
  if (L.length >= JC.maxPlantees) jeter(L.shift());
  const g = new T.Group(), fut = boite(0.03, 0.03, 0.5, COULEUR_FLECHE[style === 'feu' ? 'feu' : '']); fut.position.z = -0.12; g.add(fut);
  for (const s of [-1, 1]) { const pl = boite(0.12, 0.005, 0.1, '#f4efe2'); pl.position.set(0, 0, -0.34); pl.rotation.z = s * 0.8; g.add(pl); } /* (l'empennage) */
  const ox = p.x - mo.x, oy = p.y - mo.m.position.y, oz = p.z - mo.z; g.position.copy(p).addScaledVector(dir, 0.1); g.lookAt(g.position.clone().add(dir));
  g.traverse((o) => { o.raycast = () => {}; }); scene.add(g); L.push(g); let t = 0;
  effets.push((dt) => { t += dt; if (!g.parent) return true; if (mo.etat !== 'actif' || !mo.m || t >= JC.plantee) { jeter(g); return true; }
    g.position.set(mo.x + ox + dir.x * 0.1, mo.m.position.y + oy + dir.y * 0.1, mo.z + oz + dir.z * 0.1); const fin = Math.max(0, t - JC.plantee * 0.7) / (JC.plantee * 0.3); g.scale.setScalar(1 - fin); });
}

/* ---- 8. les chiffres qui sautent en arc ---- */
{ const chiffreJC = chiffre; chiffre = function (txt, pos, genre) {
  const C = JUICE_CRA.coup; if (!C || !(genre == null || genre === 'gros') || !pos) return chiffreJC.apply(this, arguments);
  if (typeof txt === 'string') txt = txt.replace(/\d+\.\d+/g, (x) => String(Math.round(parseFloat(x))));
  const gros = genre === 'gros' || C.style === 'feu' || !!C.gros, e = document.createElement('div'); e.className = 'degat' + (gros ? ' gros' : ''); e.textContent = txt; (combat ? $('combat-zone') : zoneBulles).appendChild(e);
  const droite = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), cote = (fxAlea() < 0.5 ? -1 : 1) * fxEntre(0.7, 1.3), p = pos.clone(), q = new T.Vector3(), vie = 0.9, base = (gros ? 1.35 : 1.1) * (C.taille || 1), P0 = C.pop || 1.9; /* (C.taille, C.pop : plus petits et moins de rebond quand un sort de zone en fait sauter plusieurs, 29zb-juice-leg.js) */
  let t = 0; effets.push((dt) => { t += dt; q.copy(p).addScaledVector(droite, cote * t).setY(p.y + 3.8 * t - 4.6 * t * t); versEcran(q, e);
    const pop = t < 0.12 ? P0 - (P0 - 1) * (t / 0.12) : t < 0.22 ? 1 - 0.12 * Math.sin((t - 0.12) / 0.1 * Math.PI) : 1;
    e.style.transform = 'translate(-50%, -100%) scale(' + (base * pop).toFixed(3) + ')'; e.style.opacity = String(Math.max(0, 1 - Math.max(0, t - (vie - 0.3)) / 0.3));
    if (t >= vie) { e.remove(); return true; } }); }; }

/* ---- le monstre touche : on le reconnait au premier coup porte pendant l'impact ---- */
{ const blesserJC = blesser; blesser = function (mo) { const C = JUICE_CRA.coup; if (C && mo) { if (!C.mo) { C.mo = mo; C.pv0 = mo.pv; } if (C.mos && !C.mos.includes(mo)) C.mos.push(mo); } return blesserJC.apply(this, arguments); }; } /* (C.mos : tous ceux qu'un coup touche, le balayage du Iop) */

/* ---- la fleche entiere ---- */
{ const effetFrappeJC = effetFrappe; effetFrappe = function (classe, pv, auImpact, feu) {
  const style = feu === true ? 'feu' : (feu || '');
  if (classe !== 'cra' || !(style === '' || style === 'feu') || !juiceCra()) return effetFrappeJC.apply(this, arguments);
  const de = pointeArc(paysanMesh), gros = style !== '', fl = boite(gros ? 0.05 : 0.035, gros ? 0.05 : 0.035, 0.55, COULEUR_FLECHE[style]);
  const pointe = cone(0.045, 0.12, '#c9ced6', 6); pointe.rotation.x = Math.PI / 2; pointe.position.z = 0.31; fl.add(pointe);
  if (gros) { const b = new T.Mesh(new T.IcosahedronGeometry(0.13, 1), new T.MeshBasicMaterial({ color: '#ffcf3e' })); b.position.z = 0.32; fl.add(b); }
  fl.scale.z = JC.etire; scene.add(fl); fl.position.copy(de); fl.lookAt(pv);
  decocher(de, pv); { const d0 = pv.clone().sub(de).normalize(); anneauSouffle(de.clone().addScaledVector(d0, 0.3), d0, 0.05, 0.4, 0.12, '#fff1c0', 0.75); }
  const prec = de.clone(), suiv = new T.Vector3(), bout = new T.Vector3(); let t = 0;
  effets.push((dt) => {
    t += dt / JC.vol; const k = Math.min(1, t); prec.copy(fl.position); posFleche(de, pv, k, fl.position); posFleche(de, pv, Math.min(1, k + 0.04), suiv);
    if (k < 1) fl.lookAt(suiv); fl.updateMatrixWorld(); bout.set(0, 0, 0.36).applyMatrix4(fl.matrixWorld);
    emettre(FX_LUM, 1, { x: bout.x, y: bout.y, z: bout.z, vie: [0.04, 0.05], taille: [gros ? 0.5 : 0.34, 0.25], c: ['#ffffff', gros ? '#ffb84a' : '#fff1c0'], a: 0.9 });
    traineeJuicy(prec, fl.position, style); if (gros) traineeFleche(fl.position, 'feu');
    if (t < 1) return;
    const dir = pv.clone().sub(prec).normalize(); jeter(fl); impactJuicy(pv, dir, style); son('impactFleche', undefined, gros ? 2 : 0, hasardCents(gros ? 40 : 90));
    const C = JUICE_CRA.coup = { style }; try { auImpact(); } finally { JUICE_CRA.coup = null; }
    const mo = C.mo; if (mo) { const tue = mo.etat !== 'actif' || mo.pv <= 0;
      reactionJuicy(mo, gros); flashSansSquelette(mo); if (!tue) flechePlantee(mo, pv, dir, style);
      if (tue && mo.d && (mo.d.boss || mo.d.demi)) { arretImage(JC.arretBoss); secousse(0.12, 0.22); etoileImpact(pv, 1.2, '#ffffff'); }
      else if (gros) { arretImage(JC.arretFeu); secousse(0.08, 0.16); }
      else if (tue) emettre(FX_VIF, 10, { x: pv.x, y: pv.y, z: pv.z, r: 0.1, dv: 4, haut: true, vie: [0.2, 0.4], taille: [0.08, 0.02], c: ['#ffffff', '#ffd36a'], grav: 9, frein: 2, etire: 0.04 }); }
    return true;
  });
}; }

/* ---- 6. la corde de l'arc, a hauteur variable ---- */
{ const sonJC = son; son = function (nom, variante, db, cents) { if (nom === 'arc' && cents == null && juiceCra()) cents = hasardCents(70); return sonJC.call(this, nom, variante, db, cents); }; }
