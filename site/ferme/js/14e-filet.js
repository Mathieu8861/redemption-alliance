'use strict';
/* ===================== LE FILET : CE QU'ON VOIT D'UNE CAPTURE (22/10/2026) =====================
   « Quand on essaie de le capturer et qu'on echoue, que le Tofu s'enfuie : de sa position jusqu'a ce qu'il coure en dehors de notre terrain,
   pour voir quand on le capture et quand on le capture pas ; et une petite animation quand on le capture » (Mathieu).
   - Le filet tombe sur le Tofu, il se debat dedans (un peu moins d'une seconde).
   - Pris : le filet se referme, le paquet file en cloche jusqu'a la voliere et s'y pose dans un petit nuage dore, « +1 Tofu ».
   - Rate : le filet retombe a plat et s'efface ; le Tofu detale a toutes pattes, droit devant lui (loin du perso), jusqu'au bord de l'ile, saute
     et tombe dans le vide.
   La capture est deja decidee quand l'animation part : ce n'est que ce qu'on voit (sans tirage au hasard, pour ne rien changer a la suite des tirages). */
function filet3D() { /* un filet de corde en cloche : huit cotes du sommet au bord, deux rangs de mailles, un bord plus epais leste de petits plombs */
  const g = new T.Group(), corde = mat('#a8763f'), plomb = mat('#6f6a64'), r = 0.55, h = 0.72;
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, pts = [];
    for (let i = 0; i <= 8; i++) { const u = i / 8 * Math.PI / 2; pts.push(new T.Vector3(Math.sin(u) * r * Math.cos(a), Math.cos(u) * h, Math.sin(u) * r * Math.sin(a))); }
    g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 10, 0.018, 5), corde));
    const p = new T.Mesh(new T.SphereGeometry(0.045, 8, 6), plomb); p.position.set(r * Math.cos(a), 0.01, r * Math.sin(a)); g.add(p); }
  [[Math.PI / 6, 0.016], [Math.PI / 3, 0.016], [Math.PI / 2, 0.03]].forEach(([u, e]) => { const m = new T.Mesh(new T.TorusGeometry(Math.sin(u) * r, e, 5, 28), corde); m.rotation.x = Math.PI / 2; m.position.y = Math.cos(u) * h; g.add(m); });
  return g;
}
/* d'ou part l'animation : le Tofu tel qu'on le voit (sur son champ ou dans l'herbe), avant que la case ne soit redessinee sans lui */
function tofuVu(o) {
  if (!o) return null; o.updateMatrixWorld(true);
  const p = o.getWorldPosition(new T.Vector3()), s = o.getWorldScale(new T.Vector3()), q = o.getWorldQuaternion(new T.Quaternion()), e = new T.Euler().setFromQuaternion(q, 'YXZ');
  return { x: p.x, y: p.y, z: p.z, ry: e.y, k: s.y / MODELES.tofu.scale.y };
}
const tofuDuChamp = (p) => { const g = casesDyn[p.id]; let t = null; if (g) g.traverse((o) => { if (!t && o.userData.tofu && o.userData.cellule === p.id && o.parent === g) t = o; }); return tofuVu(t); };
function animerFilet(v, pris) {
  if (!v || !MODELES.tofu || lieu !== 'ferme') return;
  const t = cloner('tofu'); poser(t, v.x, v.y, v.z, v.ry); t.scale.multiplyScalar(v.k);
  const K = 0.85 * v.k, f = filet3D(); f.scale.setScalar(K); f.position.set(v.x, v.y + 1.8 * K, v.z); scene.add(f);
  let s = 0;
  effets.push((dt) => {
    s += dt;
    if (s < 0.3) { const u = s / 0.3; f.position.y = v.y + (1 - u * u) * 1.8 * K; return; } /* il tombe */
    if (s < 1.1) { const w = Math.sin(s * 38) * 0.2 * (1.15 - s); t.rotation.z = w; t.rotation.x = Math.cos(s * 31) * 0.08; f.position.y = v.y; f.rotation.y = w * 0.5; f.scale.set(K * (1 - w * 0.15), K * (1 + Math.abs(w) * 0.3), K * (1 + w * 0.15)); return; } /* il se debat */
    t.rotation.set(0, v.ry, 0); f.rotation.set(0, 0, 0);
    if (pris) emporterFilet(t, f, v, K); else { lacherFilet(f, K); fuirTofu(t, v); }
    return true;
  });
}
function emporterFilet(t, f, v, K) { /* le filet se referme sur lui, et le paquet file a la voliere */
  const vo = volieresMesh[0], A = new T.Vector3(v.x, v.y, v.z), B = vo ? (ancres.voliere ? ancres.voliere.clone() : vo.position.clone().add(new T.Vector3(0, 1.5, 0))) : A.clone().add(new T.Vector3(0, 3, 0));
  const g = new T.Group(); g.userData.paquet = true; g.position.copy(A); scene.add(g); [t, f].forEach((o) => { o.position.sub(A); g.add(o); });
  pouf(v.x, v.y + 0.3, v.z, 1.5, '#ffe08a'); gainFlottant('+1 Tofu', v.x, v.y + 1.2, v.z, 'tofu', 'gain-xp'); son('plouf');
  const d = A.distanceTo(B), haut = 1.5 + d * 0.25, duree = 0.5 + d * 0.06; let s = 0;
  effets.push((dt) => {
    s += dt;
    if (s < 0.25) { const u = s / 0.25; f.scale.set(K * (1 - u * 0.25), K * (1 + u * 0.15), K * (1 - u * 0.25)); return; } /* il se referme */
    const u = Math.min(1, (s - 0.25) / duree); g.position.lerpVectors(A, B, u); g.position.y += Math.sin(u * Math.PI) * haut; g.rotation.y += dt * 9; g.scale.setScalar(1 - u * 0.45);
    if (u >= 1) { pouf(B.x, B.y - 0.6, B.z, 1.6, '#ffd54a'); jeter(g); return true; }
  });
}
function lacherFilet(f, K) { /* il a dechire le filet : il retombe a plat, et s'efface */
  f.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; } }); let s = 0;
  effets.push((dt) => { s += dt; const u = Math.min(1, s / 0.6); f.scale.set(K * (1 + u * 0.3), K * (1 - u * 0.85), K * (1 + u * 0.3)); f.traverse((o) => { if (o.isMesh) o.material.opacity = 1 - Math.max(0, s - 0.4) / 0.5; }); if (s >= 0.9) { jeter(f); return true; } });
}
function fuirTofu(t, v) { /* droit devant lui, loin du perso, a toutes pattes jusqu'au bord de l'ile ; la, il saute, et tombe dans le vide */
  let dx = v.x - (paysanMesh ? paysanMesh.position.x : 0), dz = v.z - (paysanMesh ? paysanMesh.position.z : 0); if (Math.hypot(dx, dz) < 0.2) { dx = v.x; dz = v.z; }
  const n = Math.hypot(dx, dz) || 1; dx /= n; dz /= n; t.rotation.y = Math.atan2(dx, dz); t.userData.fuyard = true; son('tofu');
  const V = 4.6; let s = 0, x = v.x, z = v.z, y = v.y, vy = 0, enLair = false;
  effets.push((dt) => {
    s += dt; x += dx * V * dt; z += dz * V * dt;
    const c = enLair ? null : caseIci(x, z);
    if (c) { y = posCase(c).y + Math.abs(Math.sin(s * 15)) * 0.22 * v.k; t.rotation.x = 0.25; } /* il galope, penche en avant */
    else { if (!enLair) { enLair = true; vy = 3.2; } vy -= 11 * dt; y += vy * dt; t.rotation.x = Math.min(1.2, t.rotation.x + dt * 2); } /* le saut, puis la chute */
    t.position.set(x, y, z);
    if (y < v.y - 8 || s > 9) { jeter(t); return true; }
  });
}
