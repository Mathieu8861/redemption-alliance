'use strict';
/* LES SPHERES RUNIQUES, LES LEGENDAIRES DU PALIER 11 (21/11/2026, « est-ce qu'on ne ferait pas des spheres runiques ? », puis « les designs 1 sont bien, faut voir
   comment on arrive a les rendre en jeu », Mathieu). Un nouvel emplacement (la Relique de IDEES-APRES-100.md) : pas de stats, un effet permanent.
   - Sphere des Marees (le Croco, vague 110) : une bulle d'eau absorbe un coup, toutes les 15 s a distance (Cra, Osamodas) et toutes les 10 s au corps a corps (Iop) ;
   - Sphere de la Couvee (la Mere Crapustule, vague 105) : une petite grenouille crache des bulles a distance, 15 % des degats du perso, un coup par seconde.
   ICI, POUR L'INSTANT, SEULEMENT LEUR RENDU (version dev). La sphere SUIT le perso (22/11/2026, « la sphere nous suit, mais elle ne tourne pas autour de nous »,
   Mathieu) : elle flotte a cote de son epaule (celle qui ne tient pas l'arc du Cra), un peu en arriere, le rattrape en douceur quand il bouge et se balance ; son
   halo a sa couleur, des gouttes (Marees) ou des bulles (Couvee) qui s'en echappent. Modeles : Rodin d'apres les dessins 1 (maquettes/spheres-runiques/),
   blender/sphere-ia-preparer.py. Mode test : « Sphere runique (apercu) » dans le panneau. */
const SPHERES_RUNIQUES = {
  marees: { nom: 'Sphère des Marées', fichier: 'sphere-marees.glb', fichierB: 'sphere-marees-b.glb', fichierC: 'sphere-marees-c.glb', couleur: '#3ff0e2', part: '#9ff6ff', taille: 0.62 },
  couvee: { nom: 'Sphère de la Couvée', fichier: 'sphere-couvee-eclose.glb', fichierB: 'sphere-couvee-eclose-b.glb', fichierC: 'sphere-couvee-eclose-c.glb', couleur: '#8fe03a', part: '#d8ff8a', taille: 0.72, grenouille: 'dedans' } }; /* (22/11/2026 : la version « grenouille assise sur la sphere fermee » a ete essayee a cote ; « eclose c'est niquel », Mathieu) */
/* LA DA DU JEU, EN ESSAI (22/11/2026, « tout est plutot bien realise, juste tu trouves que c'est notre DA ou pas ? Teste de modifier un peu en aplat / toon /
   contraste pour voir », Mathieu) : la version B, comme les Bworks et la tribu de la mare (27d-bworks-v2.js) : aplats cuits dans la texture
   (outils/spheres/cuire_aplats.py, blender/remplacer-texture.py), ombre teintee a seuil net (matiereB) et contour fin vert fonce (contourB). A : la texture de Rodin.
   Au choix dans le mode test, B par defaut le temps que Mathieu tranche. */
const daSph = () => ((typeof ETAT_TEST !== 'undefined' && ETAT_TEST.sphDA) || 'C'); /* (C, l'entre-deux : texture a moitie en aplats, ombre plus douce, contour plus fin ; « un entre deux ? », Mathieu, 22/11/2026) */
const RENDU_SPH = { ombre: { value: new T.Vector3(0.74, 0.75, 0.78) }, dir: RENDU_B.dir, cle: 'sph', contour: '#1f3a12', ep: 0.007 };
const RENDU_SPH_C = { ombre: { value: new T.Vector3(0.8, 0.81, 0.84) }, dir: RENDU_B.dir, cle: 'sphc', lisse: [-0.12, 0.32], contour: '#2a4a1a', ep: 0.0045 };
function habillerSphB(racine, mats, R) { R = R || RENDU_SPH; /* la matiere B et le contour, sur les morceaux du modele (apres sa mise a l'echelle : l'epaisseur du contour est en unites du jeu) */
  racine.updateMatrixWorld(true); const v = new T.Vector3(), L = []; racine.traverse((o) => { if (o.isMesh && o.name !== 'contour-b' && mats.has(o.material)) L.push(o); });
  L.forEach((o) => { matiereB(o.material, R); const k = new T.Mesh(o.geometry, contourB(R.ep / o.getWorldScale(v).x, false, R.contour)); k.name = 'contour-b'; o.add(k); }); }
const SPH = { cle: null, g: null, modele: null, halo: null, parts: [], t: 0, prec: performance.now(), charge: {}, suivi: null };
const texHaloSph = () => TEX_HALO_COFFRE || (TEX_HALO_COFFRE = texCanvas(64, (c2, n) => { const r = c2.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(0.35, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); c2.fillStyle = r; c2.fillRect(0, 0, n, n); }));
function chargerSphere(cle) {
  const S = SPHERES_RUNIQUES[cle]; if (!S) return Promise.reject(new Error('sphere ' + cle));
  const f = daSph() === 'B' && S.fichierB ? S.fichierB : daSph() === 'C' && S.fichierC ? S.fichierC : S.fichier;
  if (!SPH.charge[f]) SPH.charge[f] = chargerGlb('assets/modeles/jeu/' + f + '?v=' + VERSION_MODELES).catch((e) => { delete SPH.charge[f]; throw e; });
  return SPH.charge[f];
}
/* LA COUVEE ECLOSE (22/11/2026, « mets la grenouille dans la sphere, mais comme si la sphere avait eclos, genre le haut est ouvert et la grenouille dedans sur un
   support », Mathieu ; « nos epaules sont pas tres larges pour accueillir une petite grenouille ») : le haut de la sphere est casse en dents de scie
   (blender/sphere-eclore.py), le dedans est rempli d'un liquide vert lumineux, un nenuphar y flotte et la grenouille est assise dessus. Le tetard a eclos :
   c'est elle. */
const NIV_LIQUIDE = 0.02; /* (la surface du liquide, en unites du modele de la sphere : son centre est a 0, son rayon a 0,5) */
function garnirCouvee(m) {
  const liq = new T.Mesh(new T.CircleGeometry(0.39, 40), new T.MeshBasicMaterial({ color: '#b4ff3c', transparent: true, opacity: 0.9 }));
  liq.rotation.x = -Math.PI / 2; liq.position.y = NIV_LIQUIDE; m.add(liq);
  const reflet = new T.Mesh(new T.RingGeometry(0.3, 0.385, 40), new T.MeshBasicMaterial({ color: '#efffb8', transparent: true, opacity: 0.45, depthWrite: false }));
  reflet.rotation.x = -Math.PI / 2; reflet.position.y = NIV_LIQUIDE + 0.004; m.add(reflet); /* (un liseré clair au bord, comme une surface d'eau) */
  const pad = new T.Mesh(new T.CylinderGeometry(0.2, 0.21, 0.025, 28, 1, false, 0.35, Math.PI * 2 - 0.7), new T.MeshToonMaterial({ color: '#3f8f2a', gradientMap: grad }));
  pad.position.y = NIV_LIQUIDE + 0.012; m.add(pad); /* (le nenuphar, avec son encoche) */
  const veines = new T.Mesh(new T.CircleGeometry(0.17, 28, -Math.PI / 2 + 0.35, Math.PI * 2 - 0.7), new T.MeshToonMaterial({ color: '#5cb83a', gradientMap: grad }));
  veines.rotation.x = -Math.PI / 2; veines.rotation.z = 0; veines.position.y = NIV_LIQUIDE + 0.026; m.add(veines);
}
async function porterSphere(cle) { /* montre (ou retire, cle = null) la sphere qui suit le perso */
  if (SPH.g) { scene.remove(SPH.g); SPH.g = null; SPH.parts.forEach((p) => scene.remove(p.s)); SPH.parts = []; } SPH.cle = cle || null; SPH.suivi = null; porterGrenouille(!!(SPHERES_RUNIQUES[cle] && SPHERES_RUNIQUES[cle].grenouille)).catch(() => {}); if (!cle) return;
  const S = SPHERES_RUNIQUES[cle], src = await chargerSphere(cle); if (SPH.cle !== cle) return;
  const g = new T.Group(), m = src.clone(true), dedans = S.grenouille === 'dedans', dessus = S.grenouille === 'dessus', da = daSph(), B = (da === 'B' && !!S.fichierB) || (da === 'C' && !!S.fichierC), mats = new Set();
  m.traverse((o) => { if (!o.isMesh) return; const map = o.material.map; if (map) { map.encoding = T.LinearEncoding; map.needsUpdate = true; } o.material = new T.MeshToonMaterial({ color: '#ffffff', map: map || null, gradientMap: grad, emissive: '#ffffff', emissiveMap: map || null, emissiveIntensity: B ? 0.22 : 0.38, side: dedans ? T.DoubleSide : T.FrontSide }); mats.add(o.material); o.castShadow = true; }); /* (une lueur propre : c'est un objet magique ; la Couvee ouverte montre aussi son dedans) */
  m.scale.setScalar(S.taille); g.add(m); if (B) habillerSphB(g, mats, da === 'C' ? RENDU_SPH_C : RENDU_SPH);
  if (dedans) garnirCouvee(m);
  if (dessus) m.add(new T.Mesh(new T.SphereGeometry(0.435, 32, 24), new T.MeshBasicMaterial({ color: '#b4ff3c', transparent: true, opacity: 0.42, depthWrite: false }))); /* (la sphère fermee : sa poche de liquide vert vif, la grenouille assise sur le dessus) */
  const plus = { transparent: true, depthWrite: false, blending: T.AdditiveBlending };
  const halo = new T.Sprite(new T.SpriteMaterial(Object.assign({ map: texHaloSph(), color: S.couleur, opacity: 0.55 }, plus))); halo.scale.setScalar(dedans ? 1.25 : 1.35); g.add(halo);
  SPH.parts = []; for (let i = 0; i < 7; i++) { const p = new T.Sprite(new T.SpriteMaterial(Object.assign({ map: texHaloSph(), color: S.part, opacity: 0 }, plus))); p.scale.setScalar(0.1); scene.add(p); SPH.parts.push({ s: p, vie: Math.random() * 1.2, d: 1.2, v: new T.Vector3() }); }
  scene.add(g); SPH.g = g; SPH.modele = m; SPH.halo = halo; SPH.dedans = dedans; SPH.dessus = dessus; SPH.taille = S.taille; accrocherGrenouille();
}
function coteLibre() { /* le cote du perso qui ne tient pas l'arc du Cra (1 ou -1, dans son repere) */
  const arc = paysanMesh.getObjectByName('arc'); if (!arc) return 1;
  const c = new T.Box3().setFromObject(arc).getCenter(new T.Vector3()); paysanMesh.worldToLocal(c); return c.x > 0 ? -1 : 1;
}
function animerSphere(dt) {
  const g = SPH.g; if (!g || !paysanMesh) { SPH.parts.forEach((p) => { p.s.visible = false; }); return; } SPH.t += dt; const t = SPH.t, P = paysanMesh.position;
  g.visible = paysanMesh.visible !== false;
  if (SPH.cote == null || SPH.coteDe !== paysanMesh) { SPH.cote = coteLibre(); SPH.coteDe = paysanMesh; }
  const th = paysanMesh.rotation.y, x = SPH.cote * 0.8, z = -0.35, h = (paysanMesh.userData.hanche || 0.5) + 1.35; /* (a cote de l'epaule, un peu en arriere) */
  const cible = new T.Vector3(P.x + x * Math.cos(th) + z * Math.sin(th), P.y + h, P.z - x * Math.sin(th) + z * Math.cos(th));
  if (!SPH.suivi) SPH.suivi = cible.clone(); else SPH.suivi.lerp(cible, 1 - Math.exp(-dt * 4)); /* (elle le rattrape en douceur) */
  g.position.copy(SPH.suivi); g.position.y += Math.sin(t * 2.3) * 0.06;
  g.rotation.z = Math.sin(t * 1.3) * (SPH.dedans ? 0.06 : 0.1); g.rotation.x = Math.sin(t * 1.1 + 1) * (SPH.dedans ? 0.05 : 0.08); /* (elle se balance) */
  if (!SPH.dedans && !SPH.dessus) SPH.modele.rotation.y += dt * 0.8; /* (les anneaux de la Marees tournent ; la Couvee ouverte reste droite) */
  SPH.halo.material.opacity = (SPH.dedans ? 0.25 : 0.45) + 0.12 * Math.sin(t * 3);
  SPH.parts.forEach((p) => { p.vie -= dt; if (p.vie <= 0) { p.vie = p.d = 0.8 + Math.random() * 0.7; p.s.position.copy(g.position).add(new T.Vector3((Math.random() - 0.5) * 0.25, SPH.dedans ? 0.05 : (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.25));
      p.v.set((Math.random() - 0.5) * 0.25, SPH.cle === 'marees' ? -0.35 - Math.random() * 0.3 : 0.25 + Math.random() * 0.3, (Math.random() - 0.5) * 0.25); } /* (des gouttes qui tombent, ou des bulles qui montent du liquide) */
    p.s.position.addScaledVector(p.v, dt); const k = Math.max(0, p.vie / p.d); p.s.material.opacity = 0.9 * Math.sin(k * Math.PI); p.s.visible = g.visible; });
}
/* LA GRENOUILLE DE LA COUVEE (22/11/2026, « il ressemblera a quoi le tetard sur notre epaule ? j'aurais plutot vu une jeune petite grenouille mignonne mais un peu
   rebelle », puis au formulaire « 1. Le petit punk », Mathieu : crete de roseaux, croc, cicatrice, regard blase, rune verte sur l'epaule). D'abord sur l'epaule, trop
   etroite (« nos epaules sont pas tres larges ») : elle est maintenant assise sur le nenuphar de la sphere eclose, regarde dans le sens du perso et autour d'elle,
   respire, et crache une bulle verte : en combat sur le monstre le plus proche, une par seconde (son effet viendra avec l'emplacement Relique : 15 % des degats du
   perso), sinon devant elle de temps en temps. Modele : Rodin d'apres maquettes/spheres-runiques/grenouille/g1-punk-face-net.png, blender/sphere-ia-preparer.py */
const GREN = { g: null, corps: null, charge: null, oui: false, t: 0, crache: 2, squash: 0, vise: 0, viseT: 0, bulles: [], fx: [] };
const HAUT_GREN = 0.8, ROT_GREN = 0, TAILLE_GREN = 0.3; /* (HAUT_GREN : sa hauteur dans son groupe ; TAILLE_GREN : 30 cm en jeu, assise dans la sphere ; ROT_GREN : de quel cote le modele regarde) */
async function porterGrenouille(oui) {
  if (GREN.g) { if (GREN.g.parent) GREN.g.parent.remove(GREN.g); GREN.g = null; } GREN.oui = !!oui; if (!oui) return;
  const da = daSph(), B = da !== 'A', f = 'grenouille-couvee' + (da === 'A' ? '' : '-' + da.toLowerCase()) + '.glb'; GREN.chargeDe = GREN.chargeDe || {};
  if (!GREN.chargeDe[f]) GREN.chargeDe[f] = chargerGlb('assets/modeles/jeu/' + f + '?v=' + VERSION_MODELES).catch((e) => { delete GREN.chargeDe[f]; throw e; });
  const src = await GREN.chargeDe[f]; if (!GREN.oui || GREN.g) return; const mats = new Set();
  const m = src.clone(true); m.traverse((o) => { if (!o.isMesh) return; const map = o.material.map; if (map) { map.encoding = T.LinearEncoding; map.needsUpdate = true; } o.material = new T.MeshToonMaterial({ color: '#ffffff', map: map || null, gradientMap: grad }); mats.add(o.material); o.castShadow = true; });
  const b = new T.Box3().setFromObject(m), s = HAUT_GREN / Math.max(0.001, b.max.y - b.min.y); m.scale.setScalar(s); m.position.y = -b.min.y * s; m.rotation.y = ROT_GREN; /* (les pattes posees sur le nenuphar) */
  const g = new T.Group(), corps = new T.Group(); corps.rotation.order = 'YXZ'; corps.add(m); /* (YXZ : elle se penche vers ou elle regarde) */ g.add(corps); g.scale.setScalar(TAILLE_GREN / HAUT_GREN); if (B) habillerSphB(g, mats, da === 'C' ? RENDU_SPH_C : RENDU_SPH); GREN.g = g; GREN.corps = corps; accrocherGrenouille();
}
function accrocherGrenouille() { /* sur le nenuphar de la Couvee eclose (la grenouille et la sphere se chargent chacune de leur cote : la premiere arrivee attend l'autre) */
  if (!GREN.g || !SPH.g || !(SPH.dedans || SPH.dessus) || GREN.g.parent === SPH.g) return;
  SPH.g.add(GREN.g); GREN.g.position.set(0, SPH.dessus ? 0.47 * SPH.taille : (NIV_LIQUIDE + 0.025) * SPH.taille, 0); /* (dessus : sur les bouts de la cage) */
}
/* SON ATTAQUE (22/11/2026, par Discord : « pour la petite grenouille qu'on vient de faire, refais son attaque visuellement », Mathieu) : elle se ramasse (0,14 s),
   puis se detend en avant en crachant, la tete basculee vers sa cible. Puis « refais le projectile, il est trop rond, trop flashy pour etre un crachat » : une
   glaire etiree dans le sens du vol (une goutte allongee, une queue de bave et deux petits paquets qui suivent), d'un vert vase, presque sans lueur, cerclee de
   vert tres fonce ; elle se deforme en vol sur un petit arc et laisse tomber quelques gouttes ; a l'impact, un petit paquet de bave qui s'ecrase, des gouttes
   qui retombent et une tache de bave au sol qui seche en 1,6 s. Toujours sans degats (l'effet viendra avec l'emplacement Relique) */
const CRACHAT = { prepa: 0.14, geo: null, cone: null, mat: null, matF: null, matR: null, contour: null, texGoutte: null, texTache: null };
function cibleCrachat() { /* le monstre le plus proche (en combat, a la portee du Cra), sinon un point au sol devant elle ; null en combat sans cible */
  const dep = GREN.corps.localToWorld(new T.Vector3(0, HAUT_GREN * 0.55, HAUT_GREN * 0.35)); let fin = null, sol = 0;
  if (combat && combat.monstres) { let best = STATS_CLASSE.cra.portee; /* (la portee du Cra, 5 cases : « mets-lui la meme portee d'attaque que le Cra », Mathieu, 22/11/2026) */ combat.monstres.forEach((o) => { if (o.etat !== 'actif') return; const d = Math.hypot(o.x - dep.x, o.z - dep.z); if (d < best) { best = d; fin = new T.Vector3(o.x, o.m.position.y + (o.haut || 1) * 0.45, o.z); sol = o.m.position.y; } }); }
  if (!fin) { if (combat) return null; fin = GREN.corps.localToWorld(new T.Vector3(0, 0, 2.4 * HAUT_GREN / TAILLE_GREN)); fin.y = sol = (paysanMesh ? paysanMesh.position.y : 0) + 0.03; }
  return { dep, fin, sol };
}
function crachatGrenouille() { /* elle se ramasse : le crachat part au bout de CRACHAT.prepa (animerGrenouille) */
  const g = GREN.g; if (!g || !g.parent || GREN.tir) return; g.updateMatrixWorld(true); const C = cibleCrachat(); if (!C) return;
  const loc = g.worldToLocal(C.fin.clone()); GREN.vise = Math.atan2(loc.x, loc.z); GREN.viseT = 1; GREN.tir = { t: 0, lance: false };
}
function preparerCrachat() {
  if (CRACHAT.geo) return; CRACHAT.geo = new T.SphereGeometry(1, 16, 12); CRACHAT.cone = new T.ConeGeometry(0.55, 1.6, 10); CRACHAT.cone.rotateX(-Math.PI / 2); /* (la queue pointe vers l'arriere) */
  CRACHAT.mat = new T.MeshToonMaterial({ color: '#6f9f2c', emissive: '#22400a', emissiveIntensity: 0.25, gradientMap: grad, transparent: true, opacity: 0.94 });
  CRACHAT.matF = new T.MeshToonMaterial({ color: '#577f22', gradientMap: grad, transparent: true, opacity: 0.9 });
  CRACHAT.matR = new T.MeshBasicMaterial({ color: '#e4f2c0', transparent: true, opacity: 0.6 });
  CRACHAT.contour = typeof contourB === 'function' ? contourB(0.09, false, '#22380f') : null;
  CRACHAT.texGoutte = texCanvas(32, (c2, n) => { const g2 = c2.createRadialGradient(n * 0.42, n * 0.38, 1, n / 2, n / 2, n / 2 - 1); g2.addColorStop(0, '#c9e08a'); g2.addColorStop(0.55, '#6f9f2c'); g2.addColorStop(1, '#2f4f10'); c2.fillStyle = g2; c2.beginPath(); c2.arc(n / 2, n / 2, n / 2 - 1, 0, Math.PI * 2); c2.fill(); });
  CRACHAT.texTache = texCanvas(64, (c2, n) => { let x = 7; const h = () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; /* (toujours la meme tache) */
    c2.fillStyle = '#4f7a1c'; c2.beginPath(); c2.arc(n / 2, n / 2, n * 0.27, 0, Math.PI * 2); c2.fill();
    for (let i = 0; i < 9; i++) { const a = h() * Math.PI * 2, r = n * (0.22 + h() * 0.18), t = n * (0.04 + h() * 0.07); c2.beginPath(); c2.arc(n / 2 + Math.cos(a) * r, n / 2 + Math.sin(a) * r, t, 0, Math.PI * 2); c2.fill(); }
    const g2 = c2.createRadialGradient(n * 0.45, n * 0.45, 1, n / 2, n / 2, n * 0.26); g2.addColorStop(0, 'rgba(201,224,138,0.55)'); g2.addColorStop(1, 'rgba(201,224,138,0)'); c2.fillStyle = g2; c2.beginPath(); c2.arc(n / 2, n / 2, n * 0.26, 0, Math.PI * 2); c2.fill(); });
}
function lancerCrachat() {
  GREN.g.updateMatrixWorld(true); const C = cibleCrachat(); if (!C) return; preparerCrachat();
  const b = new T.Group(), corps = new T.Group(); b.add(corps);
  const tete = new T.Mesh(CRACHAT.geo, CRACHAT.mat); tete.scale.set(0.85, 0.75, 1.25); corps.add(tete);
  if (CRACHAT.contour) { const k = new T.Mesh(CRACHAT.geo, CRACHAT.contour); k.scale.copy(tete.scale); corps.add(k); }
  const queue = new T.Mesh(CRACHAT.cone, CRACHAT.matF); queue.position.z = -1.35; queue.scale.set(0.9, 0.7, 1); corps.add(queue);
  [[0.38, 0.12, -0.05, -2.5], [0.24, -0.1, 0.06, -3.2]].forEach(([s, x, y, z]) => { const p = new T.Mesh(CRACHAT.geo, CRACHAT.matF); p.scale.setScalar(s); p.position.set(x, y, z); corps.add(p); }); /* (deux petits paquets de bave qui suivent) */
  const r = new T.Mesh(CRACHAT.geo, CRACHAT.matR); r.scale.set(0.16, 0.1, 0.32); r.position.set(-0.32, 0.5, 0.3); corps.add(r); /* (un reflet discret) */
  b.scale.setScalar(0.075); b.position.copy(C.dep); scene.add(b);
  GREN.bulles.push({ b, corps, dep: C.dep, fin: C.fin, sol: C.sol, t: 0, d: Math.max(0.3, Math.min(0.6, C.dep.distanceTo(C.fin) / 10)), trace: 0.05 });
}
function goutteCrachat(p, v, vie, taille, grav) { /* une goutte de bave (sprite) : celles qui tombent en vol et celles de l'impact */
  preparerCrachat(); const s = new T.Sprite(new T.SpriteMaterial({ map: CRACHAT.texGoutte, transparent: true, depthWrite: false }));
  s.position.copy(p); s.scale.setScalar(taille); scene.add(s); GREN.fx.push({ s, v: v.clone(), t: 0, d: vie, taille, grav: grav || 0 });
}
function eclaboussureCrachat(C) { /* l'impact : un paquet de bave qui s'ecrase, des gouttes qui retombent, une tache au sol qui seche */
  const e = new T.Sprite(new T.SpriteMaterial({ map: CRACHAT.texTache, transparent: true, depthWrite: false })); e.position.copy(C.fin); e.scale.setScalar(0.12); scene.add(e);
  GREN.fx.push({ s: e, v: new T.Vector3(), t: 0, d: 0.18, taille: 0.12, grandit: 0.38, grav: 0 });
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + Math.random() * 0.5; goutteCrachat(C.fin, new T.Vector3(Math.cos(a) * (0.7 + Math.random() * 0.8), 1 + Math.random() * 1.2, Math.sin(a) * (0.7 + Math.random() * 0.8)), 0.4 + Math.random() * 0.2, 0.045 + Math.random() * 0.035, 8); }
  const ta = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: CRACHAT.texTache, transparent: true, opacity: 0.85, depthWrite: false }));
  ta.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI * 2); ta.position.set(C.fin.x, C.sol + 0.025, C.fin.z); ta.scale.setScalar(0.1); scene.add(ta);
  GREN.fx.push({ s: ta, v: new T.Vector3(), t: 0, d: 1.6, taille: 0.1, tache: 0.5, grav: 0 });
}
function animerGrenouille(dt) {
  GREN.fx = (GREN.fx || []).filter((f) => { f.t += dt; const k = f.t / f.d; if (k >= 1) { scene.remove(f.s); f.s.material.dispose(); if (f.tache) f.s.geometry.dispose(); return false; }
    if (f.grav) f.v.y -= f.grav * dt; f.s.position.addScaledVector(f.v, dt);
    if (f.tache) { f.s.scale.setScalar(f.taille + f.tache * Math.min(1, f.t / 0.12)); f.s.material.opacity = k < 0.55 ? 0.85 : 0.85 * (1 - (k - 0.55) / 0.45); return true; } /* (la tache s'etale vite, reste, puis seche) */
    if (f.grandit) f.s.scale.setScalar(f.taille + f.grandit * Math.sqrt(k)); else f.s.scale.setScalar(f.taille * (1 - 0.4 * k));
    f.s.material.opacity = 1 - k * k; return true; });
  GREN.bulles = GREN.bulles.filter((b) => { b.t += dt; const k = Math.min(1, b.t / b.d), av = b.b.position.clone();
    b.b.position.lerpVectors(b.dep, b.fin, k); b.b.position.y += Math.sin(k * Math.PI) * Math.min(0.9, 0.25 + b.dep.distanceTo(b.fin) * 0.12); /* (un petit arc) */
    if (b.b.position.distanceToSquared(av) > 1e-8) b.b.lookAt(b.b.position.clone().multiplyScalar(2).sub(av)); /* (etiree dans le sens du vol) */
    const w1 = Math.sin(b.t * 29), w2 = Math.sin(b.t * 17 + 1); b.corps.scale.set(1 + 0.12 * w1, 1 - 0.1 * w1, 1 + 0.15 * w2); /* (elle se deforme) */
    b.trace -= dt; if (b.trace <= 0 && k < 0.9) { b.trace = 0.07; goutteCrachat(b.b.position, new T.Vector3(0, -0.2, 0), 0.4, 0.035, 5); } /* (quelques gouttes qui tombent) */
    if (k < 1) return true; eclaboussureCrachat(b); scene.remove(b.b); return false; });
  if (!GREN.g || !paysanMesh) return; if (GREN.g.parent !== SPH.g) accrocherGrenouille(); if (!GREN.g.parent) return;
  GREN.g.rotation.y = paysanMesh.rotation.y; /* (elle regarde dans le sens du perso) */
  GREN.t += dt; const t = GREN.t, c = GREN.corps; GREN.viseT = Math.max(0, GREN.viseT - dt);
  let sx = 1, sy = 1 + 0.04 * Math.sin(t * 3.1), pench = 0; /* (elle respire) */
  if (GREN.tir) { const T0 = GREN.tir.t += dt, P = CRACHAT.prepa;
    if (T0 < P) { const k = T0 / P; sx = 1 + 0.16 * k; sy = 1 - 0.2 * k; pench = -0.12 * k; } /* (elle se ramasse, un peu en arriere) */
    else { if (!GREN.tir.lance) { GREN.tir.lance = true; lancerCrachat(); } const k = Math.min(1, (T0 - P) / 0.32), e = Math.sin(k * Math.PI);
      sx = 1 - 0.1 * e; sy = 1 + 0.18 * e; pench = 0.42 * e; if (k >= 1) GREN.tir = null; } } /* (elle se detend en avant en crachant, puis revient) */
  c.scale.set(sx, sy, sx); c.rotation.x = pench;
  const regard = GREN.viseT > 0 ? GREN.vise : Math.sin(t * 0.45) * 0.5 + Math.sin(t * 1.7) * 0.08; c.rotation.y += (regard - c.rotation.y) * Math.min(1, dt * (GREN.viseT > 0 ? 14 : 8)); /* (elle regarde autour d'elle, ou sa cible) */
  GREN.crache -= dt; if (GREN.crache <= 0) { GREN.crache = combat ? 1 : 3 + Math.random() * 2; crachatGrenouille(); }
}
(function boucleSphere(now) { const dt = Math.min(0.05, Math.max(0, (now - SPH.prec) / 1000)); SPH.prec = now; try { animerSphere(dt); } catch (e) { /* rien */ } try { animerGrenouille(dt); } catch (e) { /* rien */ } requestAnimationFrame(boucleSphere); })(performance.now());
/* l'apercu du mode test (27b-arene-dev.js) */
document.addEventListener('click', (e) => { const d = e.target.closest('[data-test-sphere-da]'); if (d) { ETAT_TEST.sphDA = d.dataset.testSphereDa; if (ETAT_TEST.sphere) porterSphere(ETAT_TEST.sphere).catch(() => {}); if (typeof ouvrirModeTest === 'function' && modaleOuverte === 'mode-test') ouvrirModeTest(); return; } /* (la DA A ou B, 22/11/2026) */
  const b = e.target.closest('[data-test-sphere]'); if (!b) return; const c = b.dataset.testSphere;
  ETAT_TEST.sphere = c === 'aucune' || ETAT_TEST.sphere === c ? null : c; porterSphere(ETAT_TEST.sphere).catch(() => toast('La sphère n\'a pas pu se charger.'));
  if (typeof ouvrirModeTest === 'function' && modaleOuverte === 'mode-test') ouvrirModeTest(); });
