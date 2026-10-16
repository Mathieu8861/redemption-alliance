'use strict';
/* ===================== SCENE 3D ===================== */
const T = THREE;
const canvas = document.getElementById('scene');
const rendu = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
rendu.setClearColor(0x000000, 0); rendu.setPixelRatio(Math.min(matchMedia('(pointer: coarse)').matches ? 1.5 : 2, window.devicePixelRatio || 1));
rendu.shadowMap.enabled = true; rendu.shadowMap.type = T.PCFSoftShadowMap;
rendu.shadowMap.autoUpdate = false; /* la carte des ombres (le tiers du temps de chaque image) n'est redessinee qu'une image sur deux, voir la boucle */
const scene = new T.Scene();
const camera = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
const VISEE = new T.Vector3(0.6, 0.6, 0.6);
camera.position.set(VISEE.x + 30, VISEE.y + 27, VISEE.z + 30); camera.lookAt(VISEE);
let zoom = 1, angleCam = Math.PI / 4, enAccueil = true, departAngle = performance.now();
const ZOOM_MIN = 0.36; /* (l'ile ronde : de quoi la voir en entier) */
function placerCamera() { const r = 42.4; camera.position.set(VISEE.x + Math.cos(angleCam) * r, VISEE.y + 27, VISEE.z + Math.sin(angleCam) * r); camera.lookAt(VISEE); }
function cadrer() {
  const w = innerWidth, h = innerHeight, a = w / h;
  const d = (a < 1 ? 9.6 / a : 11.2) / zoom; /* en portrait l'ile deborde un peu, on glisse et on pince pour zoomer */
  camera.left = -d * a; camera.right = d * a; camera.top = d; camera.bottom = -d; camera.updateProjectionMatrix();
  rendu.setSize(w, h, false); canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
}
scene.add(new T.HemisphereLight('#fff6e0', '#8aa6c0', 0.5));
const soleil = new T.DirectionalLight('#ffe9c4', 0.75); soleil.position.set(-16, 28, 12); soleil.castShadow = true;
soleil.shadow.mapSize.set(...(matchMedia('(pointer: coarse)').matches ? [1024, 1024] : [2048, 2048])); /* (tablette : moitie moins de calcul d'ombres) */ Object.assign(soleil.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 100 }); soleil.shadow.bias = -0.0008; scene.add(soleil);
const contre = new T.DirectionalLight('#bfe2ff', 0.22); contre.position.set(18, 10, -20); scene.add(contre);
/* les graphismes : complets, ou legers pour les petits appareils (sans ombres, sans contours, resolution normale) */
const DOIGT = matchMedia('(pointer: coarse)').matches; /* tablette, telephone */
const graphismes = () => { try { return localStorage.getItem('ferme-graphismes') || ''; } catch (e) { return ''; } };
function appliquerGraphismes() {
  const leger = graphismes() === 'leger';
  rendu.setPixelRatio(leger ? 1 : Math.min(DOIGT ? 1.5 : 2, window.devicePixelRatio || 1)); soleil.castShadow = !leger; /* au doigt : 1,5 au plus, presque pareil a l'oeil et bien plus leger */
  Object.values(contours).forEach((m) => { m.visible = !leger; }); /* les contours doublent presque tout le dessin */
  CONTOUR.visible = !leger; /* et ceux des pieces faites dans la page (Bouftous, arbaletes...), oublies jusque-la */
  if (typeof cadrer === 'function') cadrer();
}
/* au premier lancement, s'il rame (moins de 35 images par seconde), il passe tout seul en graphismes legers */
const surveillance = { n: 0, somme: 0, fini: false };
function surveillerFluidite(dt) {
  if (surveillance.fini || enAccueil || document.hidden || graphismes()) return;
  if (dt > 0.2) return; surveillance.n++; surveillance.somme += dt;
  if (surveillance.n < 240) return; surveillance.fini = true;
  if (surveillance.somme / surveillance.n > 1 / 35) { try { localStorage.setItem('ferme-graphismes', 'leger'); } catch (e) { /* rien */ } appliquerGraphismes(); toast('Graphismes allégés pour que le jeu reste fluide sur cet appareil (Options pour changer).', 'or'); }
}

const grad = new T.DataTexture(new Uint8Array([120, 120, 120, 180, 180, 180, 235, 235, 235]), 3, 1, T.RGBFormat);
grad.minFilter = grad.magFilter = T.NearestFilter; grad.needsUpdate = true;
const CONTOUR = new T.MeshBasicMaterial({ color: '#3a2b1f', side: T.BackSide });
const mat = (c, o) => new T.MeshToonMaterial(Object.assign({ color: c, gradientMap: grad }, o || {}));
function maille(geo, couleur, o) {
  const materiau = typeof couleur === 'string' ? mat(couleur, typeof o === 'object' ? o : undefined) : couleur;
  const m = new T.Mesh(geo, materiau); m.castShadow = true; m.receiveShadow = true;
  if (materiau.transparent) return m;
  const g = new T.Group(); g.add(m); const c = new T.Mesh(geo, CONTOUR); c.scale.setScalar(1 + (typeof o === 'number' ? o : 0.04)); g.add(c); return g;
}
const boite = (w, h, d, c, o) => maille(new T.BoxGeometry(w, h, d), c, o);
const cyl = (rh, rb, h, c, s) => maille(new T.CylinderGeometry(rh, rb, h, s || 7), c);
const sphere = (r, c, d) => maille(new T.IcosahedronGeometry(r, d || 1), c);
const cone = (r, h, c, s) => maille(new T.ConeGeometry(r, h, s || 6), c);
function poser(o, x, y, z, ry, parent) { o.position.set(x, y, z); if (ry) o.rotation.y = ry; (parent || scene).add(o); return o; }

