'use strict';
/* LES SPHERES RUNIQUES, LES LEGENDAIRES DU PALIER 11 (21/11/2026, « est-ce qu'on ne ferait pas des spheres runiques ? », puis « les designs 1 sont bien, faut voir
   comment on arrive a les rendre en jeu », Mathieu). Un nouvel emplacement (la Relique de IDEES-APRES-100.md) : pas de stats, un effet permanent.
   - Sphere des Marees (le Croco, vague 110) : une bulle d'eau absorbe un coup, toutes les 15 s a distance et toutes les 10 s au corps a corps (Mathieu) ;
   - Sphere de la Couvee (la Mere Crapustule, vague 105) : un tetard allie combat avec toi et renait 10 s apres sa mort (ses degats restent a regler).
   ICI, POUR L'INSTANT, SEULEMENT LEUR RENDU (version dev) : la sphere flotte pres de l'epaule du perso et tourne lentement autour de lui, en se balancant, son
   halo a sa couleur, des gouttes (Marees) ou des bulles (Couvee) qui s'en echappent. Modeles : Rodin d'apres les dessins 1 (maquettes/spheres-runiques/),
   blender/sphere-ia-preparer.py. Mode test : « Sphere runique (apercu) » dans le panneau. */
const SPHERES_RUNIQUES = {
  marees: { nom: 'Sphère des Marées', fichier: 'sphere-marees.glb', couleur: '#3ff0e2', part: '#9ff6ff' },
  couvee: { nom: 'Sphère de la Couvée', fichier: 'sphere-couvee.glb', couleur: '#8fe03a', part: '#d8ff8a' } };
const SPH = { cle: null, g: null, modele: null, halo: null, parts: [], t: 0, prec: performance.now(), charge: {} };
function chargerSphere(cle) {
  const S = SPHERES_RUNIQUES[cle]; if (!S) return Promise.reject(new Error('sphere ' + cle));
  if (!SPH.charge[cle]) SPH.charge[cle] = chargerGlb('assets/modeles/jeu/' + S.fichier + '?v=' + VERSION_MODELES).catch((e) => { delete SPH.charge[cle]; throw e; });
  return SPH.charge[cle];
}
async function porterSphere(cle) { /* montre (ou retire, cle = null) la sphere qui flotte pres du perso */
  if (SPH.g) { scene.remove(SPH.g); SPH.g = null; SPH.parts = []; } SPH.cle = cle || null; if (!cle) return;
  const S = SPHERES_RUNIQUES[cle], src = await chargerSphere(cle); if (SPH.cle !== cle) return;
  const g = new T.Group(), m = src.clone(true);
  m.traverse((o) => { if (!o.isMesh) return; const map = o.material.map; if (map) { map.encoding = T.LinearEncoding; map.needsUpdate = true; } o.material = new T.MeshToonMaterial({ color: '#ffffff', map: map || null, gradientMap: grad, emissive: '#ffffff', emissiveMap: map || null, emissiveIntensity: 0.38 }); o.castShadow = true; }); /* (une lueur propre : c'est un objet magique ; sans elle, la Couvee sortait boueuse) */
  m.scale.setScalar(0.62); g.add(m); /* (62 cm : a 42, on ne la voyait plus a la distance du jeu) */
  SPH.tetard = null;
  if (cle === 'couvee') { /* (la poche de liquide vert vif et son tetard qui en fait le tour, comme sur le dessin : Rodin a rendu une boule verte terne
       de 0,40 de rayon sous les barreaux, on l'enveloppe d'un liquide lumineux a 0,435 et le tetard nage a sa surface, en silhouette sombre) */
    const sombre = new T.MeshBasicMaterial({ color: '#173a0c', transparent: true, opacity: 0.85, side: T.DoubleSide }), tet = new T.Group(), nage = new T.Group(), piv = new T.Group();
    const tete = new T.Mesh(new T.CircleGeometry(0.06, 16), sombre); tete.scale.set(1.25, 0.95, 1); nage.add(tete);
    const fq = new T.Shape(); fq.moveTo(0, 0.04); fq.quadraticCurveTo(-0.09, 0.03, -0.17, 0); fq.quadraticCurveTo(-0.09, -0.03, 0, -0.04); fq.closePath();
    const queue = new T.Mesh(new T.ShapeGeometry(fq), sombre); piv.add(queue); piv.position.x = -0.05; nage.add(piv);
    nage.position.set(0, 0.03, 0.418); tet.add(nage); m.add(tet); SPH.tetard = tet; SPH.queue = piv;
    const orbe = new T.Mesh(new T.SphereGeometry(0.435, 32, 24), new T.MeshBasicMaterial({ color: '#b4ff3c', transparent: true, opacity: 0.42, depthWrite: false }));
    m.add(orbe);
  }
  if (!TEX_HALO_COFFRE) TEX_HALO_COFFRE = texCanvas(64, (c2, n) => { const r = c2.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(0.35, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); c2.fillStyle = r; c2.fillRect(0, 0, n, n); });
  const plus = { transparent: true, depthWrite: false, blending: T.AdditiveBlending };
  const halo = new T.Sprite(new T.SpriteMaterial(Object.assign({ map: TEX_HALO_COFFRE, color: S.couleur, opacity: 0.55 }, plus))); halo.scale.setScalar(1.35); g.add(halo);
  SPH.parts = []; for (let i = 0; i < 7; i++) { const p = new T.Sprite(new T.SpriteMaterial(Object.assign({ map: TEX_HALO_COFFRE, color: S.part, opacity: 0 }, plus))); p.scale.setScalar(0.1); scene.add(p); SPH.parts.push({ s: p, vie: Math.random() * 1.2, d: 1.2, v: new T.Vector3() }); }
  scene.add(g); SPH.g = g; SPH.modele = m; SPH.halo = halo;
}
function animerSphere(dt) {
  const g = SPH.g; if (!g || !paysanMesh) { SPH.parts.forEach((p) => { p.s.visible = false; }); return; } SPH.t += dt; const t = SPH.t, P = paysanMesh.position;
  g.visible = paysanMesh.visible !== false;
  const a = t * 0.9, r = 0.85, h = (paysanMesh.userData.hanche || 0.5) + 1.45; /* (elle tourne autour de lui, a hauteur d'epaule, et se balance) */
  g.position.set(P.x + Math.cos(a) * r, P.y + h + Math.sin(t * 2.3) * 0.07, P.z + Math.sin(a) * r);
  SPH.modele.rotation.y += dt * 0.8; SPH.modele.rotation.z = Math.sin(t * 1.3) * 0.12;
  SPH.halo.material.opacity = 0.45 + 0.15 * Math.sin(t * 3);
  if (SPH.tetard) { SPH.tetard.rotation.y = t * 1.5; SPH.queue.rotation.z = Math.sin(t * 10) * 0.45; }
  SPH.parts.forEach((p) => { p.vie -= dt; if (p.vie <= 0) { p.vie = p.d = 0.8 + Math.random() * 0.7; p.s.position.copy(g.position).add(new T.Vector3((Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.25));
      p.v.set((Math.random() - 0.5) * 0.25, SPH.cle === 'marees' ? -0.35 - Math.random() * 0.3 : 0.25 + Math.random() * 0.3, (Math.random() - 0.5) * 0.25); } /* (des gouttes qui tombent, ou des bulles qui montent) */
    p.s.position.addScaledVector(p.v, dt); const k = Math.max(0, p.vie / p.d); p.s.material.opacity = 0.9 * Math.sin(k * Math.PI); p.s.visible = g.visible; });
}
(function boucleSphere(now) { const dt = Math.min(0.05, Math.max(0, (now - SPH.prec) / 1000)); SPH.prec = now; try { animerSphere(dt); } catch (e) { /* rien */ } requestAnimationFrame(boucleSphere); })(performance.now());
/* l'apercu du mode test (27b-arene-dev.js) */
document.addEventListener('click', (e) => { const b = e.target.closest('[data-test-sphere]'); if (!b) return; const c = b.dataset.testSphere;
  ETAT_TEST.sphere = c === 'aucune' || ETAT_TEST.sphere === c ? null : c; porterSphere(ETAT_TEST.sphere).catch(() => toast('La sphère n\'a pas pu se charger.'));
  if (typeof ouvrirModeTest === 'function' && modaleOuverte === 'mode-test') ouvrirModeTest(); });
