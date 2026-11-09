'use strict';
/* ===================== LES PANCARTES DES BATIMENTS (22/10/2026) =====================
   « Les titres au-dessus des batiments, des fois ca peut cacher quelque chose ; plutot une petite pancarte au niveau du toit, ou sur l'etal de l'HDV,
   avec le nom ecrit dessus » (Mathieu), puis « pas si mal mais c'est pose n'importe ou » : la planche est accrochee au batiment lui-meme.
   - Une planche de bois cloutee, le nom peint dessus (la police des titres), dessinee une fois par nom.
   - Ses pieds sont plantes la ou ils touchent le modele : un rayon tire vers le bas sur le batiment (le pan du toit, l'auvent de l'etal, le dessus
     du tonneau) ; l'enclos et le Pepito-tron ont la leur plantee dans l'herbe.
   - Elle suit la facade du batiment qui regarde la camera, et elle est enfant du batiment : elle bouge, tourne et disparait avec lui, et la toucher,
     c'est toucher le batiment. Un batiment refait (deplace, tourne, ameliore) est un nouvel objet : la pancarte est reposee au controle suivant. */
const plancheCache = new Map();
function dessinerPlanche(c, texte) {
  const x = c.getContext('2d'), Hp = 128; x.font = '400 84px "Lilita One", "Arial Black", sans-serif'; const cw = Math.ceil(x.measureText(texte).width + 96); c.width = cw; c.height = Hp;
  const rr = (a, b, w, h, r) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); };
  const g = x.createLinearGradient(0, 0, 0, Hp); g.addColorStop(0, '#d39a5c'); g.addColorStop(0.5, '#b97c43'); g.addColorStop(1, '#94602f'); rr(5, 5, cw - 10, Hp - 10, 18); x.fillStyle = g; x.fill();
  x.save(); x.clip(); x.strokeStyle = 'rgba(80, 45, 18, .28)'; x.lineWidth = 2; /* le fil du bois, puis la jointure des deux planches */
  for (let k = 0; k < 9; k++) { const y0 = 14 + k * 12 + (k % 3) * 2; x.beginPath(); x.moveTo(0, y0); x.bezierCurveTo(cw * 0.3, y0 + 4, cw * 0.6, y0 - 4, cw, y0 + 2); x.stroke(); }
  x.strokeStyle = 'rgba(60, 32, 12, .55)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, Hp / 2); x.lineTo(cw, Hp / 2); x.stroke(); x.restore();
  rr(5, 5, cw - 10, Hp - 10, 18); x.lineWidth = 9; x.strokeStyle = '#3b2a1a'; x.stroke();
  [[22, 24], [cw - 22, 24], [22, Hp - 24], [cw - 22, Hp - 24]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 6, 0, 7); x.fillStyle = '#4a3420'; x.fill(); x.beginPath(); x.arc(a - 1.5, b - 1.5, 2.2, 0, 7); x.fillStyle = '#c9b59a'; x.fill(); });
  x.font = '400 84px "Lilita One", "Arial Black", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.lineWidth = 14; x.strokeStyle = '#3b2a1a';
  x.strokeText(texte, cw / 2, Hp / 2 + 5); x.fillStyle = '#fff3d4'; x.fillText(texte, cw / 2, Hp / 2 + 5);
  return cw / Hp;
}
function plancheDe(texte) {
  let p = plancheCache.get(texte); if (p) return p;
  const c = document.createElement('canvas'), ratio = dessinerPlanche(c, texte), tex = new T.CanvasTexture(c); tex.anisotropy = 8;
  p = { tex, ratio, c }; plancheCache.set(texte, p);
  if (document.fonts && !document.fonts.check('84px "Lilita One"')) document.fonts.load('84px "Lilita One"').then(() => { dessinerPlanche(c, texte); tex.needsUpdate = true; }).catch(() => {}); /* (la police arrive apres : on repeint, la largeur ne change presque pas) */
  return p;
}
const rayonPancarte = new T.Raycaster(), BAS_PANCARTE = new T.Vector3(0, -1, 0);
function toucherModele(obj, x, z) { rayonPancarte.set(new T.Vector3(x, 60, z), BAS_PANCARTE); const h = rayonPancarte.intersectObject(obj, true).find((i) => i.object.visible && !i.object.userData.pancarte && !(i.object.material && i.object.material.side === T.BackSide)); return h ? h.point.y : null; }
/* o : h (hauteur de la planche), avance (vers la facade, en part de la demi-profondeur), pied (de la planche au plus haut point touche), cotes (les cotes
   permis, 0 devant 1 droite 2 derriere 3 gauche, le plus tourne vers la camera l'emporte), origine (centre : l'origine du modele, pas sa boite), poteau (un seul pied),
   sol (les pieds plantes a cette hauteur), x / z (un centre impose), ry (l'orientation de reference, celle du batiment sinon) */
function poserPancarte(texte, obj, o = {}) {
  obj.updateMatrixWorld(true); const H = (o.h || 0.42) * 1.45, { tex, ratio } = plancheDe(texte), W = H * ratio, g = new T.Group();
  const bois = mat('#7a4a24'), face = mat('#ffffff', { map: tex });
  const ry = o.ry != null ? o.ry : obj.rotation.y, cx0 = Math.cos(angleCam), cz0 = Math.sin(angleCam);
  const cotes = [0, 1, 2, 3].map((k) => { const a = ry + k * Math.PI / 2; return { a, s: Math.sin(a) * cx0 + Math.cos(a) * cz0 }; });
  const f = (o.cotes ? o.cotes.map((k) => cotes[k]) : cotes).reduce((m, c) => (c.s > m.s + 0.01 ? c : m)), nx = Math.sin(f.a), nz = Math.cos(f.a), tx = Math.cos(f.a), tz = -Math.sin(f.a);
  const box = new T.Box3().setFromObject(obj), c = o.origine ? obj.getWorldPosition(new T.Vector3()) : box.getCenter(new T.Vector3());
  const prof = Math.abs(nx) * (box.max.x - box.min.x) / 2 + Math.abs(nz) * (box.max.z - box.min.z) / 2, av = (o.avance || 0) * prof;
  const px = (o.x != null ? o.x : c.x) + nx * av, pz = (o.z != null ? o.z : c.z) + nz * av;
  const pieds = (o.poteau ? [0] : [-W * 0.32, W * 0.32]).map((d) => { const y = o.sol != null ? o.sol : toucherModele(obj, px + tx * d, pz + tz * d); return { d, y: y == null ? box.max.y : y }; });
  const bas = Math.max(...pieds.map((p) => p.y)) + (o.pied != null ? o.pied : 0.22);
  const b = new T.Mesh(new T.BoxGeometry(W, H, 0.06), [bois, bois, bois, bois, face, face]); b.position.set(0, bas + H / 2, 0); g.add(b);
  pieds.forEach((p) => { const y0 = p.y - 0.06, y1 = bas + H * 0.8, m = new T.Mesh(new T.CylinderGeometry(0.035, 0.04, y1 - y0, 8), bois); m.position.set(p.d, (y0 + y1) / 2, -0.045); g.add(m); });
  g.position.set(px, 0, pz); g.rotation.y = f.a;
  const cel = o.cellule || obj.userData.cellule; g.traverse((m) => { m.userData.pancarte = true; if (cel) m.userData.cellule = cel; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  obj.attach(g); return g;
}
/* les batiments qui portent une pancarte : [cle, () => [objet, texte, options] ou null] */
/* LA PANCARTE DE LA GELIERE (02/11/2026, « le panneau de la geliere est bizarre », Mathieu) : « avance 0,3 » la poussait vers la facade de toute la Geliere
   (2 x 3 cases), dans le pre devant le portail ou, la camera tournee, derriere la maison, ses pieds plantes sur ce que le rayon touchait. Elle a sa place
   a chaque niveau, dans le repere du modele (blender/geliere-niveaux.py) : au faitage de la maison (niveau 4 et plus), en haut de l'appentis (3), sur le
   toit du portique de l'entree (2), plantee dans le pre a cote de l'entree (1) ; tournee vers l'avant ou l'arriere, le cote qui regarde la camera */
const PANCARTE_GELIERE = { 1: { x: -2.2, z: 1.45, h: 0.3, sol: true, pied: 0.55 }, 2: { x: 0, z: 1.91, h: 0.3, pied: 0.04 }, 3: { x: -1.6, z: -1.7, h: 0.32, pied: 0.04 }, 4: { x: -2.0, z: -1.0, h: 0.33, pied: 0.03 } }; /* (niveau 4 : a gauche de la cheminee, a x = -0,85) */
const batiPose = (type) => { const o = blocBati(type); return o && batisMesh.find((m) => m.userData.cellule === o.c0.id); };
const PANCARTES = [
  ['grange', () => { const g = batiPose('grange'); return g && !aChateau() && [g, 'Grange', { h: 0.5, avance: 0.45, cotes: [1, 3] }]; }], /* (sur un des longs pans du toit, loin de la cheminee ; le chateau-grange n'en a pas : « retire la pancarte chateau », Mathieu, 02/11/2026) */
  ['hdv', () => { const g = batiPose('hdv'); return g && [g, 'HDV', nivBat('nivEtal') >= 4 ? { h: 0.55, avance: 0, pied: 0.05 } : { h: 0.46, avance: 0, pied: 0.06, cotes: [0, 2] }]; }], /* (05/11/2026, « la pancarte ca fait bizarre la », Mathieu : avant le niveau 4, elle partait vers le cote qui regarde la camera, au bord de l'auvent ou de travers sur sa pente, un pied tres long ; au milieu de l'auvent maintenant, tournee vers l'avant ou l'arriere, ses deux pieds a la meme hauteur) */ /* (posee sur l'auvent de l'etal ; des le niveau 4, en haut du toit, a la place de l'enseigne aux trois kamas : « mets le HDV sur le toit », Mathieu, 01/11/2026) */
  ['voliere', () => { const v = volieresMesh[0]; if (!v) return null; const nv = nivBat('voliere'), Dm = VOLIERE_DIM[nv] || VOLIERE_DIM[1], K = MODELES.voliereK || 1, C = nv === 1 && MODELES.voliereC ? MODELES.voliereC : { x: 0, z: 0 }; /* (plantee sur le faite : la voliere-jardin n'a plus de toit, le rayon tombait dans la cage, 08/11/2026) */
    v.updateMatrixWorld(true); const q = v.localToWorld(new T.Vector3(-C.x * K, 0, -C.z * K)); return [v, 'Volière', { h: 0.34, x: q.x, z: q.z, cotes: [0, 2], sol: v.position.y + Dm[2] * K * v.scale.x, pied: 0.03 }]; }],
  ['forge', () => { const g = batiPose('forge'); return g && [g, 'Forgemagie', { h: 0.27, avance: -0.15, pied: 0.06 }]; }], /* (01/11/2026, « refais la pancarte et le toit », Mathieu : elle faisait 3 de large pour une case de 2 et cachait le toit ; a la largeur du batiment, en haut du toit) */
  ['geliere', () => { const g = batiPose('geliere'); if (!g) return null; const P = PANCARTE_GELIERE[Math.min(4, niv('geliere'))]; g.updateMatrixWorld(true); const q = g.localToWorld(new T.Vector3(P.x, 0, P.z));
    return [g, 'Gelière', { h: P.h, x: q.x, z: q.z, cotes: [0, 2], pied: P.pied, sol: P.sol ? q.y : undefined, poteau: !!P.sol }]; }],
  ['niche', () => { const g = batiPose('niche'), G = gardienDe(); return g && G && [g, G.nom, G.espece === 'chat' ? { h: 0.3, origine: true, cotes: [1, 3], pied: 0.1 } : { h: 0.3, avance: 0.2, pied: 0.1 }]; }], /* (Newton : sur son tonneau) */
  /* (le Pépito-tron n'a plus de pancarte : « retire la pancarte », Mathieu, 31/10/2026) */
  ['enclos', () => { const E = casesEnclos(); if (!E.length || !clotureMesh) return null; const P = E.map(posCase), xs = P.map((q) => q.x), zs = P.map((q) => q.z); /* plantee dans l'herbe le long du cote droit, qui regarde aussi
      la camera : le portillon est au milieu du devant, la pancarte le cachait (« enclos a Bouftous devant le portail, pas dingue », Mathieu) */
    return [clotureMesh, 'Enclos à Boufs', /* (« Enclos a Boufs, Bouf avec un S », Mathieu, 09/11/2026) */ { h: 0.4, poteau: false, ry: 0, cotes: [1], sol: P[0].y, pied: 0.62, x: Math.max(...xs) + S * 0.62, z: (Math.min(...zs) + Math.max(...zs)) / 2, cellule: E[0].id }]; }],
];
let pancartesT = 0;
function majPancartes(dt) { /* deux fois par seconde : un batiment refait (nouvel objet), un nom change ou la camera tournee d'un quart de tour, la pancarte est reposee */
  pancartesT -= dt; if (pancartesT > 0) return; pancartesT = 0.5;
  const quart = Math.floor(angleCam / (Math.PI / 2)); /* (02/11/2026 : la camera tourne depuis le 29/10, une pancarte posee pour une vue restait tournee vers elle, de dos ou derriere le batiment dans les autres) */
  PANCARTES.forEach(([cle, f]) => { const r = f(); if (!r) return; const [obj, texte, o] = r, etiquette = texte + '|' + quart;
    if (obj.userData['pancarte_' + cle] === etiquette) return;
    obj.children.filter((k) => k.userData.pancarte && k.userData.pancarteCle === cle).forEach((k) => { obj.remove(k); k.traverse((m) => { if (m.isMesh) { m.geometry.dispose(); [].concat(m.material).forEach((x) => x.dispose()); } }); }); /* (sa planche et ses pieds ; l'image du nom reste en cache) */
    const g = poserPancarte(texte, obj, o); g.userData.pancarteCle = cle; obj.userData['pancarte_' + cle] = etiquette; });
}
