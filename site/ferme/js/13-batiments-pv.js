'use strict';
/* ===================== LES BATIMENTS ONT DES PV =====================
   La grange (ton QG) et les tours : leurs PV montent avec leurs ameliorations (Murs de pierre, Tours cerclees de fer).
   L'HDV, la voliere, le puits et l'epouvantail : des PV de base qui montent avec ton niveau.
   Pendant une vague, une partie des monstres (les « casseurs ») s'en prend aux batiments au lieu du perso, jusqu'a ce que le perso vienne les frapper.
   Un batiment touche brule : flammes legeres, puis un vrai brasier sous 35 % de ses PV. A 0 PV il tombe en ruine et ne sert plus a rien
   tant qu'il n'est pas reconstruit. On repare (ou reconstruit) contre des kamas, en le touchant ou en touchant sa barre de vie. */
const BATS_PV = ['grange', 'hdv', 'voliere', 'puits', 'epouvantail'];
const NOM_BAT = { grange: 'la grange', hdv: 'l\'HDV', voliere: 'la volière', puits: 'le puits', epouvantail: 'l\'épouvantail', tour: 'la tour de défense' };
const ICO_BAT = { grange: 'grange', hdv: 'etal', voliere: 'voliere', puits: 'puits', epouvantail: 'epouvantail', tour: 'tour' };
const PERTE_RUINE = { grange: 'L\'arbalète du toit ne tire plus, et les voleurs de VSA emportent deux fois plus.', hdv: 'Plus d\'achats ni de ventes à l\'HDV.', voliere: 'Tes Tofus ne donnent plus de plumes.', puits: 'Impossible de remplir l\'arrosoir.', epouvantail: 'Les Tofus viennent picorer bien plus souvent.', tour: 'Elle ne tire plus.' };
const typeCle = (cle) => cle.split(':')[0];
const nomBat = (cle) => NOM_BAT[typeCle(cle)];
const Maj = (t) => t[0].toUpperCase() + t.slice(1);
const pvMaxBat = (cle) => { const t = typeCle(cle); if (t === 'grange') return [500, 900, 1500, 2400, 3600][niv('murs')]; if (t === 'tour') return NIV_TOURS.pv[nivTour(caseTour(cle.slice(5)))]; return 150 + 25 * niveau(S_.xp); };
const etatBat = (cle) => (S_.bats && S_.bats[cle]) || null;
const degatsBat = (cle) => { const b = etatBat(cle); return b ? Math.min(b.deg || 0, pvMaxBat(cle)) : 0; };
const enRuine = (cle) => { const b = etatBat(cle); return !!(b && b.ruine); };
const pvBat = (cle) => enRuine(cle) ? 0 : Math.max(0, pvMaxBat(cle) - degatsBat(cle));
const prixPv = () => 0.4 + 0.015 * niveau(S_.xp); /* le kama par PV a reparer : il monte un peu avec le niveau (deux fois moins vite depuis le 12/10/2026) */
const coutReparer = (cle) => Math.max(1, Math.ceil(degatsBat(cle) * prixPv()));
const coutReconstruire = (cle) => Math.ceil(pvMaxBat(cle) * prixPv() * 1.5);
const clesBats = () => BATS_PV.filter((t) => S_.cases.some((c) => c.type === t)).concat(S_.cases.filter((c) => c.type === 'tour').map((c) => 'tour:' + c.id));
const cleDeCase = (c) => !c ? null : c.type === 'tour' ? 'tour:' + c.id : BATS_PV.includes(c.type) ? c.type : null;
/* le rectangle au sol du batiment (les monstres frappent son bord) et ses maillages */
function zoneBat(cle) {
  const t = typeCle(cle);
  if (t === 'tour') { const c = S_.cases.find((x) => x.id === cle.slice(5) && x.type === 'tour'); if (!c) return null; const q = posCase(c); return { x: q.x, y: q.y, z: q.z, hw: 0.55, hd: 0.55, meshes: toursMesh.filter((g) => g.userData.cellule === c.id), cell: c }; }
  const o = blocBati(t); if (!o) return null;
  const meshes = t === 'voliere' ? volieresMesh.slice() : batisMesh.filter((m) => { const c = S_.cases.find((x) => x.id === m.userData.cellule); return c && c.type === t; });
  if (t === 'grange' && arbalete) meshes.push(arbalete);
  if (t === 'epouvantail' && epou && epou.remplace) meshes.push(epou.g); /* le Pepito-Tron brule a sa place */
  return { x: o.x, y: o.y, z: o.z, hw: Math.max(0.5, o.w * S / 2 - 0.3), hd: Math.max(0.5, o.h * S / 2 - 0.3), meshes, cell: o.c0 };
}
function boiteBat(z) { const b = new T.Box3(); z.meshes.forEach((m) => b.expandByObject(m)); if (b.isEmpty()) b.set(new T.Vector3(z.x - z.hw, z.y, z.z - z.hd), new T.Vector3(z.x + z.hw, z.y + 1.5, z.z + z.hd)); return b; }

/* ---------- le feu : des flammes dessinees par un petit shader (bandes rouge, orange, jaune et coeur clair, qui ondulent et se tordent),
   un halo au sol, des braises qui montent, de la fumee (noire quand ca brule fort) ---------- */
const FEU_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FEU_FS = `varying vec2 vUv; uniform float uT; uniform float uS;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int k = 0; k < 5; k++) { v += a * n(p); p = p * 2.07 + vec2(1.7, 9.2); a *= 0.5; } return v; }
  void main(){
    float y = vUv.y, t = uT * 1.6 + uS * 13.0;
    float tord = (fbm(vec2(y * 2.2 - t * 1.1, uS * 3.0)) - 0.5) * 0.55 * y;
    float x = (vUv.x - 0.5 - tord) * 2.0;
    float corps = 0.92 * pow(max(0.0, 1.0 - y), 0.55) * smoothstep(-0.05, 0.22, y);
    float langues = (fbm(vec2(vUv.x * 4.0 + uS * 7.0, y * 3.2 - t * 2.4)) - 0.48) * (0.25 + 0.95 * y);
    float f = corps - abs(x) * (0.85 + 0.6 * y) + langues;
    if (f <= 0.0) { float a = f > -0.2 ? (f + 0.2) / 0.2 * 0.3 * (1.0 - y) : 0.0; if (a <= 0.01) discard; gl_FragColor = vec4(1.0, 0.45, 0.1, a); return; }
    float k = f + 0.06 * (1.0 - y); vec3 c;
    if (k > 0.55) c = vec3(1.0, 0.97, 0.82); else if (k > 0.36) c = vec3(1.0, 0.84, 0.3); else if (k > 0.19) c = vec3(1.0, 0.56, 0.12); else if (k > 0.07) c = vec3(0.92, 0.26, 0.07); else c = vec3(0.6, 0.13, 0.05);
    gl_FragColor = vec4(c, 1.0);
  }`;
const texDouce = (stops) => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); stops.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(cv); };
const LUEUR_TEX = texDouce([[0, 'rgba(255,170,60,0.9)'], [0.5, 'rgba(255,110,30,0.35)'], [1, 'rgba(255,90,20,0)']]);
const FUMEE_TEX = texDouce([[0, 'rgba(255,255,255,1)'], [0.6, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']]);
const GEO_PLAN = new T.PlaneGeometry(1, 1);
/* un foyer : des flammes aux points donnes [x, y, z, hauteur], plus halo, braises et fumee. fort : fumee noire, plus de braises */
function foyer(pts, fort) {
  const grp = new T.Group(); scene.add(grp);
  const fl = pts.map(([x, y, z, hh]) => { const m = new T.Mesh(GEO_PLAN, new T.ShaderMaterial({ uniforms: { uT: { value: 0 }, uS: { value: Math.random() * 10 } }, vertexShader: FEU_VS, fragmentShader: FEU_FS, transparent: true, depthWrite: false, side: T.DoubleSide }));
    m.scale.set(hh * 0.85, hh, 1); m.position.set(x, y + hh * 0.42, z); m.renderOrder = 6; grp.add(m); return m; });
  const lueurs = pts.filter((p, k) => k < 4).map(([x, y, z, hh]) => { const l = new T.Mesh(GEO_PLAN, new T.MeshBasicMaterial({ map: LUEUR_TEX, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); l.position.set(x, y + hh * 0.3, z); l.scale.setScalar(hh * (fort ? 2.6 : 2)); l.renderOrder = 5; grp.add(l); return l; });
  const braises = []; for (let i = 0; i < (fort ? 18 : 7); i++) { const b = new T.Mesh(GEO_PLAN, new T.MeshBasicMaterial({ color: i % 2 ? '#ffd04a' : '#ff7a1e', transparent: true, depthWrite: false, blending: T.AdditiveBlending })); b.scale.setScalar(0.055); b.userData = { t: Math.random(), a: Math.random() * 6.28, r: Math.random() * 0.4, p: pts[i % pts.length] }; grp.add(b); braises.push(b); }
  const fumees = []; for (let i = 0; i < (fort ? 12 : 5); i++) { const m = new T.Mesh(GEO_PLAN, new T.MeshBasicMaterial({ map: FUMEE_TEX, color: fort ? '#2e2826' : '#b9b2aa', transparent: true, depthWrite: false })); m.userData = { t: i / (fort ? 12 : 5), o: Math.random() * 6, p: pts[i % pts.length] }; m.renderOrder = 4; grp.add(m); fumees.push(m); }
  let s = 0;
  grp.userData.maj = (dt) => {
    s += dt; const q = camera.quaternion;
    fl.forEach((m) => { m.material.uniforms.uT.value = s; m.quaternion.copy(q); });
    lueurs.forEach((l, k) => { l.quaternion.copy(q); l.material.opacity = 0.55 + Math.sin(s * 9 + k) * 0.12 + Math.sin(s * 23 + k * 2) * 0.08; });
    braises.forEach((b) => { const u = b.userData; u.t += dt * 0.55; if (u.t > 1) { u.t = 0; u.a = Math.random() * 6.28; } const [x, y, z, hh] = u.p; b.position.set(x + Math.cos(u.a) * u.r + Math.sin(u.t * 9 + u.a) * 0.08, y + hh * 0.5 + u.t * (fort ? 2.6 : 1.6), z + Math.sin(u.a) * u.r); b.quaternion.copy(q); b.material.opacity = 1 - u.t; });
    fumees.forEach((m) => { const u = m.userData; u.t = (u.t + dt * 0.25) % 1; const t = u.t, [x, y, z, hh] = u.p; m.position.set(x + Math.sin(t * 4 + u.o) * 0.2 + t * 0.6, y + hh * 0.85 + t * (fort ? 3.4 : 2.0), z + Math.cos(t * 3 + u.o) * 0.2); m.quaternion.copy(q); m.scale.setScalar((fort ? 1.5 : 0.9) * (0.4 + t * 1.8)); m.material.opacity = (fort ? 0.75 : 0.42) * Math.sin(t * Math.PI); });
  };
  return grp;
}
/* des points sur le toit (et les murs) d'un batiment : on lache des rayons du ciel sur ses maillages */
function pointsSur(z, b, n) {
  const rc = new T.Raycaster(), pts = [], objs = z.meshes.filter((m) => m.visible), bas = new T.Vector3(0, -1, 0);
  for (let e = 0; e < n * 14 && pts.length < n; e++) {
    const x = b.min.x + (0.18 + Math.random() * 0.64) * (b.max.x - b.min.x), zz = b.min.z + (0.18 + Math.random() * 0.64) * (b.max.z - b.min.z);
    rc.set(new T.Vector3(x, b.max.y + 2, zz), bas);
    const h = rc.intersectObjects(objs, true).find((i) => i.object.isMesh && i.object.visible && !(i.object.material && (i.object.material.side === T.BackSide || i.object.material.transparent)));
    if (h && h.point.y > b.min.y + 0.25 && pts.every((p) => Math.hypot(p.x - h.point.x, p.z - h.point.z) > 0.45)) pts.push(h.point.clone());
  }
  return pts;
}
/* les ruines : gravats, poutres calcinees, braises */
function ruines(z) {
  const g = new T.Group(), n = Math.round(8 + (z.hw + z.hd) * 4), cols = ['#77706a', '#5f5852', '#8e8a85', '#4a3a2e'];
  for (let i = 0; i < n; i++) { const p = new T.Mesh(new T.BoxGeometry(0.3 + Math.random() * 0.35, 0.2 + Math.random() * 0.2, 0.25 + Math.random() * 0.3), mat(hasard(cols))); p.position.set((Math.random() - 0.5) * 2 * z.hw, 0.12 + Math.random() * 0.15, (Math.random() - 0.5) * 2 * z.hd); p.rotation.set(Math.random() * 0.7, Math.random() * 3, Math.random() * 0.6); p.castShadow = true; g.add(p); }
  for (let i = 0; i < 4 + Math.round(z.hw + z.hd); i++) { const p = new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.9 + Math.random() * 0.8), mat('#2b211b')); p.position.set((Math.random() - 0.5) * 1.6 * z.hw, 0.28 + Math.random() * 0.2, (Math.random() - 0.5) * 1.6 * z.hd); p.rotation.set(Math.random() - 0.5, Math.random() * 3, (Math.random() - 0.5) * 0.8); p.castShadow = true; g.add(p); }
  g.position.set(z.x, z.y, z.z); scene.add(g); return g;
}
const feux = {}; /* cle -> { etat, grp, ruine, x, z } */
function etatFeu(cle) { if (enRuine(cle)) return 3; if (!degatsBat(cle)) return 0; return pvBat(cle) / pvMaxBat(cle) <= 0.35 ? 2 : 1; }
function eteindre(cle) { const f = feux[cle]; if (!f) return; if (f.grp) scene.remove(f.grp); if (f.ruine) scene.remove(f.ruine); delete feux[cle]; }
function majFeu(cle, force) {
  const z = zoneBat(cle); if (!z) { eteindre(cle); return; }
  const e = etatFeu(cle), f = feux[cle];
  z.meshes.forEach((m) => { m.visible = e !== 3; });
  if (typeCle(cle) === 'hdv' && marchandMesh) marchandMesh.visible = e !== 3; /* le marchand s'est mis a l'abri */
  if (f && f.etat === e && !force && f.x === z.x && f.z === z.z) return;
  eteindre(cle); if (!e) return;
  const b = boiteBat(z), H = b.max.y - b.min.y, hh = borne(0.45 + H * 0.13, 0.5, 0.95), F = { etat: e, x: z.x, z: z.z };
  if (e === 3) { F.ruine = ruines(z); F.grp = foyer([[z.x + 0.2, z.y + 0.25, z.z + 0.1, 0.5], [z.x - 0.35, z.y + 0.3, z.z - 0.2, 0.4]], true); }
  else {
    const toit = pointsSur(z, b, e === 2 ? 5 : 2).map((p) => [p.x, p.y - 0.05, p.z, hh * (e === 2 ? 1.25 : 0.85) * (0.8 + Math.random() * 0.4)]);
    if (!toit.length) toit.push([z.x, b.max.y - 0.3, z.z, hh]);
    if (e === 2) [[1, 1], [-1, 1]].forEach(([a, c]) => toit.push([z.x + a * z.hw * 0.8, z.y + 0.02, z.z + c * z.hd * 0.8, hh * 1.1])); /* le pied des murs prend aussi */
    F.grp = foyer(toit, e === 2);
  }
  feux[cle] = F;
}
function majFeux(force) { const C = clesBats(); C.forEach((k) => majFeu(k, force)); Object.keys(feux).forEach((k) => { if (!C.includes(k)) eteindre(k); }); majBarresBat(); }
function animerFeux(dt) { Object.values(feux).forEach((f) => { if (f.grp && f.grp.userData.maj) f.grp.userData.maj(dt); }); }
/* les barres de vie au-dessus des batiments touches */
const barresBat = new Map();
function majBarresBat() {
  const C = clesBats(), zone = $('bats-pv');
  barresBat.forEach((e, k) => { if (!C.includes(k) || (!degatsBat(k) && !enRuine(k))) { e.remove(); barresBat.delete(k); } });
  C.forEach((k) => {
    if (!degatsBat(k) && !enRuine(k)) return;
    let e = barresBat.get(k); if (!e) { e = document.createElement('div'); e.className = 'pv-bat'; e.dataset.bat = k; zone.appendChild(e); barresBat.set(k, e); e.addEventListener('click', () => { if (!combat && !enAccueil) ouvrirBatPv(k); }); }
    const r = pvBat(k) / pvMaxBat(k), col = r > 0.6 ? 'var(--vert)' : r > 0.35 ? 'var(--or)' : 'var(--rouge)';
    e.classList.toggle('ruine', enRuine(k)); e.dataset.info = Maj(nomBat(k)) + ' : touche pour ' + (enRuine(k) ? 'reconstruire' : 'réparer');
    e.innerHTML = '<img src="assets/icones/marteau.png?v=' + VERSION_MODELES + '" alt="">' + (enRuine(k) ? 'En ruine' : '<span class="b"><i style="width:' + (100 * r).toFixed(0) + '%;background:' + col + '"></i></span>' + fmt(pvBat(k)));
    const z = zoneBat(k); if (z) { const b = boiteBat(z); e.dataset.point = JSON.stringify([z.x, enRuine(k) ? z.y + 1.1 : b.max.y + 0.3, z.z]); }
  });
}
function placerBarresBat() { barresBat.forEach((e) => { if (!e.dataset.point) return; const p = JSON.parse(e.dataset.point); vec.set(p[0], p[1], p[2]).project(camera); e.style.left = ((vec.x + 1) / 2 * innerWidth).toFixed(1) + 'px'; e.style.top = ((1 - vec.y) / 2 * innerHeight).toFixed(1) + 'px'; }); }
/* un coup sur un batiment */
const DEGATS_BATIMENTS = 3; /* les monstres cognent les batiments 3 fois plus fort que le perso (avant : pareil, une grange tenait une centaine de coups ; 4 jusqu'au 12/10/2026 : en milieu de partie, les reparations coutaient plus que la vague ne rapportait) */
function blesserBat(cle, n) {
  if (!S_ || enRuine(cle)) return; n = Math.max(1, Math.round(n * DEGATS_BATIMENTS)); S_.bats = S_.bats || {}; const b = S_.bats[cle] || (S_.bats[cle] = { deg: 0 }), max = pvMaxBat(cle);
  const avant = b.deg || 0; b.deg = Math.min(max, avant + n); n = b.deg - avant; const z = zoneBat(cle);
  if (z) { const bx = boiteBat(z); chiffre('-' + n, new T.Vector3(z.x, bx.max.y + 0.2, z.z), 'bat'); }
  if (combat) { combat.bats = combat.bats || {}; combat.bats[cle] = (combat.bats[cle] || 0) + n; if (!combat.alerteBat) combat.alerteBat = {}; if (!combat.alerteBat[cle]) { combat.alerteBat[cle] = true; toast('Des monstres attaquent ' + nomBat(cle) + ' ! Va les chasser.', 'alerte'); } }
  if (b.deg >= max) { b.ruine = true; if (z) { pouf(z.x, z.y, z.z, 4, '#8e8a85'); pouf(z.x, z.y, z.z, 2.5, '#ff7a1e'); } toast(Maj(nomBat(cle)) + ' s\'effondre en ruine ! ' + PERTE_RUINE[typeCle(cle)] + ' Reconstruis-le après la vague.', 'alerte'); if (typeCle(cle) === 'grange') rendreArbaleteBulle(); }
  majFeu(cle); majBarresBat();
}
/* le casseur : il choisit le batiment debout le plus proche, et y retourne tant que le perso ne vient pas le chercher */
function batLePlusProche(mo) {
  let best = null, bd = 1e9; clesBats().forEach((k) => { if (enRuine(k)) return; const z = zoneBat(k); if (!z) return; const d = Math.hypot(z.x - mo.x, z.z - mo.z); if (d < bd) { bd = d; best = k; } }); return best;
}
function cibleBatiment(mo, dt) {
  if (mo.casseur === undefined) mo.casseur = !mo.d.boss && Math.random() < (mo.d.casse || 0);
  if (!mo.casseur || mo.aggro) return null;
  const pp = paysanMesh.position; if (combat.deroute == null && Math.hypot(pp.x - mo.x, pp.z - mo.z) < 2.2) { mo.aggro = true; return null; } /* le perso est sur lui : il se defend (pas quand il est a terre) */
  mo.batT = (mo.batT || 0) - dt;
  if (!mo.bat || enRuine(mo.bat) || mo.batT <= 0) { mo.batT = 1.5; mo.bat = batLePlusProche(mo);
    if (mo.d.bucheron) { const T0 = clesBats().filter((k) => /^tour:/.test(k) && !enRuine(k)).map((k) => [k, zoneBat(k)]).filter(([, z]) => z).sort((a, b) => Math.hypot(a[1].x - mo.x, a[1].z - mo.z) - Math.hypot(b[1].x - mo.x, b[1].z - mo.z))[0]; if (T0) mo.bat = T0[0]; } } /* (le Forestier : les tours d'abord) */
  if (!mo.bat) return null;
  const z = zoneBat(mo.bat); if (!z) { mo.bat = null; return null; }
  return { cle: mo.bat, x: borne(mo.x, z.x - z.hw, z.x + z.hw), z: borne(mo.z, z.z - z.hd, z.z + z.hd), y: z.y };
}
/* la fenetre : reparer ou reconstruire */
function artPv(cle) {
  const max = pvMaxBat(cle), pv = pvBat(cle), r = pv / max, ruine = enRuine(cle), col = r > 0.6 ? 'var(--vert)' : r > 0.35 ? 'var(--or)' : 'var(--rouge)', cout = ruine ? coutReconstruire(cle) : coutReparer(cle);
  const act = combat ? '<span class="cadenas">Après la vague</span>' : ruine ? '<button class="btn kamas" data-reconstruire="' + cle + '"' + (S_.kamas < cout ? ' disabled' : '') + '>Reconstruire ' + fmt(cout) + ' ' + KAMA + '</button>' + manque(cout) : degatsBat(cle) ? '<button class="btn kamas" data-reparer="' + cle + '"' + (S_.kamas < cout ? ' disabled' : '') + '>Réparer ' + fmt(cout) + ' ' + KAMA + '</button>' + manque(cout) : '<span class="cadenas">✓ Intact</span>';
  return '<div class="art' + (ruine || degatsBat(cle) ? ' alerte-bat' : '') + '">' + ico(ICO_BAT[typeCle(cle)]) + '<div><b>' + (ruine ? Maj(nomBat(cle)) + ' est en ruine' : 'Solidité : ' + fmt(pv) + ' / ' + fmt(max) + ' PV') + '</b>' + (ruine ? '' : '<div class="pv-grand"><i style="width:' + (100 * r).toFixed(1) + '%;background:' + col + '"></i></div>') + '<div class="desc">' + (ruine ? PERTE_RUINE[typeCle(cle)] + ' Reconstruit, il repart avec tous ses PV.' : degatsBat(cle) ? 'Il brûle encore par endroits. Réparé, il retrouve tous ses PV.' : (typeCle(cle) === 'grange' || typeCle(cle) === 'tour' ? 'Ses PV montent avec ses améliorations.' : 'Ses PV montent avec ton niveau de Paysan.') + ' Pendant les vagues, certains monstres viennent le frapper.') + '</div></div><div class="act">' + act + '</div></div>';
}
function ouvrirBatPv(cle) {
  const t = typeCle(cle);
  ouvrirModale('batpv', entete(Maj(nomBat(cle))) + artPv(cle) + (t === 'grange' ? lignesAmelio(['qg'], 'Renforcer la grange') : t === 'tour' ? '<p style="font-size:.78rem;font-weight:600">Pour la renforcer, touche la tour : chaque tour a son propre niveau.</p>' : ''));
  ouvrirBatPv.cle = cle;
}

