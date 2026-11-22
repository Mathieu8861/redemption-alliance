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
  marees: { nom: 'Sphère des Marées', fichier: 'sphere-marees.glb', couleur: '#3ff0e2', part: '#9ff6ff', taille: 0.62 },
  couvee: { nom: 'Sphère de la Couvée', fichier: 'sphere-couvee-eclose.glb', couleur: '#8fe03a', part: '#d8ff8a', taille: 0.72 } };
const SPH = { cle: null, g: null, modele: null, halo: null, parts: [], t: 0, prec: performance.now(), charge: {}, suivi: null };
const texHaloSph = () => TEX_HALO_COFFRE || (TEX_HALO_COFFRE = texCanvas(64, (c2, n) => { const r = c2.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(0.35, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); c2.fillStyle = r; c2.fillRect(0, 0, n, n); }));
function chargerSphere(cle) {
  const S = SPHERES_RUNIQUES[cle]; if (!S) return Promise.reject(new Error('sphere ' + cle));
  if (!SPH.charge[cle]) SPH.charge[cle] = chargerGlb('assets/modeles/jeu/' + S.fichier + '?v=' + VERSION_MODELES).catch((e) => { delete SPH.charge[cle]; throw e; });
  return SPH.charge[cle];
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
  if (SPH.g) { scene.remove(SPH.g); SPH.g = null; SPH.parts.forEach((p) => scene.remove(p.s)); SPH.parts = []; } SPH.cle = cle || null; SPH.suivi = null; porterGrenouille(cle === 'couvee').catch(() => {}); if (!cle) return;
  const S = SPHERES_RUNIQUES[cle], src = await chargerSphere(cle); if (SPH.cle !== cle) return;
  const g = new T.Group(), m = src.clone(true), dedans = cle === 'couvee';
  m.traverse((o) => { if (!o.isMesh) return; const map = o.material.map; if (map) { map.encoding = T.LinearEncoding; map.needsUpdate = true; } o.material = new T.MeshToonMaterial({ color: '#ffffff', map: map || null, gradientMap: grad, emissive: '#ffffff', emissiveMap: map || null, emissiveIntensity: 0.38, side: dedans ? T.DoubleSide : T.FrontSide }); o.castShadow = true; }); /* (une lueur propre : c'est un objet magique ; la Couvee ouverte montre aussi son dedans) */
  m.scale.setScalar(S.taille); g.add(m);
  if (dedans) garnirCouvee(m);
  const plus = { transparent: true, depthWrite: false, blending: T.AdditiveBlending };
  const halo = new T.Sprite(new T.SpriteMaterial(Object.assign({ map: texHaloSph(), color: S.couleur, opacity: 0.55 }, plus))); halo.scale.setScalar(dedans ? 1.25 : 1.35); g.add(halo);
  SPH.parts = []; for (let i = 0; i < 7; i++) { const p = new T.Sprite(new T.SpriteMaterial(Object.assign({ map: texHaloSph(), color: S.part, opacity: 0 }, plus))); p.scale.setScalar(0.1); scene.add(p); SPH.parts.push({ s: p, vie: Math.random() * 1.2, d: 1.2, v: new T.Vector3() }); }
  scene.add(g); SPH.g = g; SPH.modele = m; SPH.halo = halo; SPH.dedans = dedans; accrocherGrenouille();
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
  if (!SPH.dedans) SPH.modele.rotation.y += dt * 0.8; /* (les anneaux de la Marees tournent ; la Couvee ouverte reste droite) */
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
const GREN = { g: null, corps: null, charge: null, oui: false, t: 0, crache: 2, squash: 0, vise: 0, viseT: 0, bulles: [] };
const HAUT_GREN = 0.8, ROT_GREN = 0, TAILLE_GREN = 0.3; /* (HAUT_GREN : sa hauteur dans son groupe ; TAILLE_GREN : 30 cm en jeu, assise dans la sphere ; ROT_GREN : de quel cote le modele regarde) */
async function porterGrenouille(oui) {
  if (GREN.g) { if (GREN.g.parent) GREN.g.parent.remove(GREN.g); GREN.g = null; } GREN.oui = !!oui; if (!oui) return;
  if (!GREN.charge) GREN.charge = chargerGlb('assets/modeles/jeu/grenouille-couvee.glb?v=' + VERSION_MODELES).catch((e) => { GREN.charge = null; throw e; });
  const src = await GREN.charge; if (!GREN.oui || GREN.g) return;
  const m = src.clone(true); m.traverse((o) => { if (!o.isMesh) return; const map = o.material.map; if (map) { map.encoding = T.LinearEncoding; map.needsUpdate = true; } o.material = new T.MeshToonMaterial({ color: '#ffffff', map: map || null, gradientMap: grad }); o.castShadow = true; });
  const b = new T.Box3().setFromObject(m), s = HAUT_GREN / Math.max(0.001, b.max.y - b.min.y); m.scale.setScalar(s); m.position.y = -b.min.y * s; m.rotation.y = ROT_GREN; /* (les pattes posees sur le nenuphar) */
  const g = new T.Group(), corps = new T.Group(); corps.add(m); g.add(corps); g.scale.setScalar(TAILLE_GREN / HAUT_GREN); GREN.g = g; GREN.corps = corps; accrocherGrenouille();
}
function accrocherGrenouille() { /* sur le nenuphar de la Couvee eclose (la grenouille et la sphere se chargent chacune de leur cote : la premiere arrivee attend l'autre) */
  if (!GREN.g || !SPH.g || !SPH.dedans || GREN.g.parent === SPH.g) return;
  SPH.g.add(GREN.g); GREN.g.position.set(0, (NIV_LIQUIDE + 0.025) * SPHERES_RUNIQUES.couvee.taille, 0);
}
function crachatGrenouille() { /* une bulle verte, de sa bouche vers le monstre le plus proche (en combat), sinon devant elle */
  const g = GREN.g; if (!g || !g.parent) return; g.updateMatrixWorld(true);
  const dep = GREN.corps.localToWorld(new T.Vector3(0, HAUT_GREN * 0.55, HAUT_GREN * 0.35)); let fin = null;
  if (combat && combat.monstres) { let best = 7; combat.monstres.forEach((o) => { if (o.etat !== 'actif') return; const d = Math.hypot(o.x - dep.x, o.z - dep.z); if (d < best) { best = d; fin = new T.Vector3(o.x, o.m.position.y + (o.haut || 1) * 0.5, o.z); } }); }
  if (!fin) { if (combat) return; fin = GREN.corps.localToWorld(new T.Vector3(0, HAUT_GREN * 0.4, 2.2 * HAUT_GREN / TAILLE_GREN)); fin.y = Math.max(0.15, fin.y - 1.2); }
  const loc = g.worldToLocal(fin.clone()); GREN.vise = Math.atan2(loc.x, loc.z); GREN.viseT = 0.9; GREN.squash = 1;
  if (!GREN.texBulle) GREN.texBulle = texCanvas(64, (c2, n) => { const r = n / 2 - 3, g2 = c2.createRadialGradient(n * 0.42, n * 0.4, 2, n / 2, n / 2, r); g2.addColorStop(0, '#f2ffc4'); g2.addColorStop(0.55, '#b4ff3c'); g2.addColorStop(1, '#3f9a12');
    c2.fillStyle = g2; c2.beginPath(); c2.arc(n / 2, n / 2, r, 0, Math.PI * 2); c2.fill(); c2.lineWidth = 3; c2.strokeStyle = '#1f5c0a'; c2.stroke(); c2.fillStyle = 'rgba(255,255,255,0.85)'; c2.beginPath(); c2.arc(n * 0.36, n * 0.33, n * 0.09, 0, Math.PI * 2); c2.fill(); }); /* (une vraie bulle : verte, bord sombre, reflet blanc ; en lueur seule, on ne la voyait pas sur l'herbe) */
  const s = new T.Sprite(new T.SpriteMaterial({ map: GREN.texBulle, transparent: true, depthWrite: false })); s.scale.setScalar(0.24); s.position.copy(dep); scene.add(s);
  GREN.bulles.push({ s, dep, fin, t: 0, d: Math.max(0.25, Math.min(0.55, dep.distanceTo(fin) / 12)), pop: 0 });
}
function animerGrenouille(dt) {
  GREN.bulles = GREN.bulles.filter((b) => { b.t += dt; const k = Math.min(1, b.t / b.d);
    if (k < 1) { b.s.position.lerpVectors(b.dep, b.fin, k); b.s.position.y += Math.sin(k * Math.PI) * 0.6; return true; } /* (un petit arc) */
    b.pop += dt; b.s.position.copy(b.fin); b.s.scale.setScalar(0.24 + b.pop * 2.6); b.s.material.opacity = Math.max(0, 1 - b.pop / 0.18); /* (elle eclate) */
    if (b.pop < 0.18) return true; scene.remove(b.s); b.s.material.dispose(); return false; });
  if (!GREN.g || !paysanMesh) return; if (GREN.g.parent !== SPH.g) accrocherGrenouille(); if (!GREN.g.parent) return;
  GREN.g.rotation.y = paysanMesh.rotation.y; /* (elle regarde dans le sens du perso) */
  GREN.t += dt; const t = GREN.t, c = GREN.corps; GREN.squash = Math.max(0, GREN.squash - dt * 5); GREN.viseT = Math.max(0, GREN.viseT - dt);
  const resp = 1 + 0.04 * Math.sin(t * 3.1), q = GREN.squash; c.scale.set(1 + q * 0.2, resp * (1 - q * 0.25), 1 + q * 0.2); /* (elle respire, et s'ecrase un peu en crachant) */
  const regard = GREN.viseT > 0 ? GREN.vise : Math.sin(t * 0.45) * 0.5 + Math.sin(t * 1.7) * 0.08; c.rotation.y += (regard - c.rotation.y) * Math.min(1, dt * 8); /* (elle regarde autour d'elle, ou sa cible) */
  GREN.crache -= dt; if (GREN.crache <= 0) { GREN.crache = combat ? 1 : 3 + Math.random() * 2; crachatGrenouille(); }
}
(function boucleSphere(now) { const dt = Math.min(0.05, Math.max(0, (now - SPH.prec) / 1000)); SPH.prec = now; try { animerSphere(dt); } catch (e) { /* rien */ } try { animerGrenouille(dt); } catch (e) { /* rien */ } requestAnimationFrame(boucleSphere); })(performance.now());
/* l'apercu du mode test (27b-arene-dev.js) */
document.addEventListener('click', (e) => { const b = e.target.closest('[data-test-sphere]'); if (!b) return; const c = b.dataset.testSphere;
  ETAT_TEST.sphere = c === 'aucune' || ETAT_TEST.sphere === c ? null : c; porterSphere(ETAT_TEST.sphere).catch(() => toast('La sphère n\'a pas pu se charger.'));
  if (typeof ouvrirModeTest === 'function' && modaleOuverte === 'mode-test') ouvrirModeTest(); });
