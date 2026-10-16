'use strict';
/* ---------- l'ulti : en plus de l'attaque et du sort, un des trois au choix, a partir du niveau 5, pour de bon ----------
   gel : petits degats en zone, les monstres touches sont ralentis 5 s (ils marchent et frappent moins vite) ;
   zone : 3 fois les degats a tous les monstres autour de la cible ; coup fatal : 8 fois les degats, sur la cible seule. */
const NIV_ULTI = 5, RECHARGE_ULTI = 20;
const ULTIS = {
  gel: { nom: { iop: 'Épée de givre', cra: 'Flèche glacée', osa: 'Fouet de givre' }, genre: 'Gel', teinte: '#5fb4ef', desc: 'Petits dégâts autour de la cible, et tous les monstres touchés sont ralentis pendant 5 s : ils marchent bien plus lentement et frappent deux fois moins vite.', chiffres: (d) => [d + ' dégâts en zone', 'ralentit 5 s'] },
  zone: { nom: { iop: 'Tempête de lames', cra: 'Flèches enflammées', osa: 'Ruée du troupeau' }, genre: 'Zone', teinte: '#ee8a34', desc: 'Frappe tous les monstres autour de la cible, trois fois plus fort que ton attaque.', chiffres: (d) => [3 * d + ' dégâts à chacun', 'tout autour de la cible'] },
  mono: { nom: { iop: 'Colère de Iop', cra: 'Flèche fatale', osa: 'Morsure du Dragoeuf' }, genre: 'Coup fatal', teinte: '#d9443a', desc: 'Un seul monstre, mais cinq fois ton attaque : de quoi entamer sérieusement un boss.', chiffres: (d) => [5 * d + ' dégâts', 'une seule cible'] }
};
const nomUlti = (id) => ULTIS[id].nom[classeDe()];
/* « faut revoir l'esthetisme des sorts sur Osa et Iop, ca affiche les memes icones que Cra » (Mathieu, 11/10/2026) : chaque classe a ses icones
   (generer-ultis.html) ; celles du Cra gardent leur nom d'origine */
const sufUlti = () => classeDe() === 'cra' ? '' : '-' + classeDe();
const srcUlti = (id) => 'assets/icones/ulti-' + id + sufUlti() + '.png?v=' + VERSION_MODELES + 'u2'; /* (u2 : les icones du Cra redessinees le 14/10/2026, sans recharger tous les modeles) */
function ouvrirUlti() {
  const l = niveau(S_.xp), d = statsPerso().deg, cl = CLASSES.find((c) => c.id === classeDe());
  const carte = (id) => { const U = ULTIS[id], pris = S_.ulti === id;
    return '<div class="ulti-carte"' + (S_.ulti && !pris ? ' style="opacity:.45"' : '') + '><span class="rond" style="background:radial-gradient(circle at 50% 40%, #fffaf0, ' + U.teinte + ')"><img src="' + srcUlti(id) + '" alt=""></span><div><b>' + nomUlti(id) + '</b><div class="art" style="border:0;padding:0;display:block"><div class="puces"><span class="puce" style="background:' + U.teinte + ';color:#fff">' + U.genre + '</span>' + U.chiffres(d).map((t) => '<span class="puce">' + t + '</span>').join('') + '<span class="puce">recharge ' + RECHARGE_ULTI + ' s</span></div></div><div class="desc">' + U.desc + '</div></div>' +
      (S_.ulti ? (pris ? '<span class="cadenas">✓ Ton ulti</span>' : '<span></span>') : '<button class="btn kamas" data-choisir-ulti="' + id + '"' + (l < NIV_ULTI ? ' disabled' : '') + '>Choisir</button>') + '</div>'; };
  ouvrirModale('ulti', entete('L\'ulti du ' + cl.nom) + '<p style="font-size:.8rem;font-weight:600;margin:0 0 4px">' + (S_.ulti ? 'Ton choix est fait, il est définitif.' : l < NIV_ULTI ? 'Il se débloque au niveau ' + NIV_ULTI + ' de Paysan (tu es niveau ' + l + ').' : 'Il s\'ajoute à ton attaque et à ton sort. <b>Tu le choisis une seule fois : impossible d\'en changer ensuite.</b>') + ' Les dégâts indiqués sont ceux de ton niveau actuel, ils montent avec toi.</p>' + ['gel', 'zone', 'mono'].map(carte).join(''));
}
function choisirUlti(id, confirme) {
  if (S_.ulti || !ULTIS[id] || niveau(S_.xp) < NIV_ULTI) return;
  if (!confirme) { const U = ULTIS[id]; ouvrirModale('ulti', entete('Prendre ' + nomUlti(id) + ' ?') + '<div class="confirme"><div class="gros" style="background:radial-gradient(circle at 50% 40%, #fffaf0, ' + U.teinte + ')"><img src="' + srcUlti(id) + '" alt=""></div><b>' + U.genre + '</b><p>' + U.desc + '<br><b>C\'est pour de bon : tu ne pourras plus changer d\'ulti.</b></p><div class="boutons"><button class="btn discret" data-voir-ulti>Revoir les trois</button><button class="btn kamas" data-confirmer-ulti="' + id + '">Oui, je le prends</button></div></div>'); return; }
  S_.ulti = id; sauver(); toast(nomUlti(id) + ' est ton ulti. Il t\'attend pendant les vagues, à côté de ton sort.', 'or'); ouvrirUlti();
}
/* ---------- viser soi-meme : un cercle sur le sol pour les ultis de zone, la cible sous la souris pour le coup fatal,
   une ligne depuis le perso pour la Fleche percante. On deplace a la souris (ou au doigt), on clique pour lancer, clic droit ou Echap pour annuler ---------- */
let visee = null;
const VISEUR = new T.Group(); VISEUR.visible = false; VISEUR.renderOrder = 3; scene.add(VISEUR);
const viseurDisque = new T.Mesh(new T.CircleGeometry(1, 48), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.22, depthWrite: false, depthTest: false, side: T.DoubleSide }));
const viseurBord = new T.Mesh(new T.RingGeometry(0.93, 1, 56), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.95, depthWrite: false, depthTest: false, side: T.DoubleSide }));
[viseurDisque, viseurBord].forEach((m) => { m.rotation.x = -Math.PI / 2; m.renderOrder = 3; VISEUR.add(m); });
const geoLigne = new T.BoxGeometry(1, 0.02, 1); geoLigne.translate(0, 0, 0.5);
const VISEE_LIGNE = new T.Mesh(geoLigne, new T.MeshBasicMaterial({ color: '#ffe08a', transparent: true, opacity: 0.4, depthWrite: false, depthTest: false })); VISEE_LIGNE.visible = false; VISEE_LIGNE.renderOrder = 3; scene.add(VISEE_LIGNE);
const VISEE_CONE = new T.Group(); { const m = new T.Mesh(new T.CircleGeometry(1, 40, -Math.PI / 2 - 0.55, 1.1), new T.MeshBasicMaterial({ color: '#ff7a1e', transparent: true, opacity: 0.35, depthWrite: false, depthTest: false, side: T.DoubleSide })); m.rotation.x = -Math.PI / 2; m.renderOrder = 3; VISEE_CONE.add(m);
  const bord = new T.Mesh(new T.RingGeometry(0.95, 1, 40, 1, -Math.PI / 2 - 0.55, 1.1), new T.MeshBasicMaterial({ color: '#ff5a10', transparent: true, opacity: 0.9, depthWrite: false, depthTest: false, side: T.DoubleSide })); bord.rotation.x = -Math.PI / 2; bord.renderOrder = 4; VISEE_CONE.add(bord);
  for (const t0 of [-Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55]) { const l = new T.Mesh(new T.CircleGeometry(1, 1, t0 - 0.014, 0.028), bord.material); l.rotation.x = -Math.PI / 2; l.renderOrder = 4; VISEE_CONE.add(l); } } /* (les deux cotes : de fines parts, du perso au bord) */ VISEE_CONE.visible = false; /* (un bord net : l'arc et les deux cotes) */ scene.add(VISEE_CONE); /* (le cone du Souffle de feu, vers +z, mis a l'echelle de sa portee) */
const PORTEE_PERCANTE = 10, LARGEUR_PERCANTE = 0.9;
const solPlan = new T.Plane(new T.Vector3(0, 1, 0), 0);
function pointSol(ev) { /* le point du sol sous la souris : la case touchee, sinon le plan du sol */
  souris.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1); ray.setFromCamera(souris, camera);
  const h = ray.intersectObjects(Object.values(casesMesh), false)[0]; if (h) return h.point.clone();
  const q = new T.Vector3(); return ray.ray.intersectPlane(solPlan, q) ? q : null;
}
function viser(v) {
  const pp = paysanMesh.position, c = (combat.cible && combat.cible.etat === 'actif') ? combat.cible : plusProcheMonstre(pp);
  visee = Object.assign(v, { point: c ? new T.Vector3(c.x, c.m.position.y, c.z) : pp.clone().add(new T.Vector3(Math.sin(paysanMesh.rotation.y) * 3, 0, Math.cos(paysanMesh.rotation.y) * 3)) });
  toast(v.cone ? 'Vise : le souffle part vers la souris. Clique pour lancer (clic droit pour annuler).' : v.ligne ? 'Vise : la flèche part en ligne droite vers la souris. Clique pour tirer (clic droit pour annuler).' : v.rayon < 1 ? 'Vise un monstre et clique (clic droit pour annuler).' : 'Place le cercle avec la souris, clique pour lancer (clic droit pour annuler).', 'or');
}
function annulerVisee() { visee = null; VISEUR.visible = false; VISEE_LIGNE.visible = false; VISEE_CONE.visible = false; if (typeof PORTEE_VUE !== 'undefined') PORTEE_VUE.visible = false; }
/* le point ou un sort vise tombe vraiment : a portee du perso, et sur une case ou l'on marche (sinon la plus proche autour du point vise).
   « malgre le ciblage, le Bouftou de l'Osa ne tombe pas a l'endroit cible » (testeurs, 12/10/2026) : au-dela de la portee, le cercle restait sous
   la souris et le Bouftou tombait plus pres ; le cercle de visee utilise maintenant ce meme point */
function pointSort(pt, portee) {
  const pp = paysanMesh.position; let x = pt.x, z = pt.z; const L = Math.hypot(x - pp.x, z - pp.z);
  if (portee && L > portee) { x = pp.x + (x - pp.x) * portee / L; z = pp.z + (z - pp.z) * portee / L; }
  const ok = (a, b) => { const c = caseIci(a, b); return c && PASSABLE[c.type] && (!portee || Math.hypot(a - pp.x, b - pp.z) <= portee + 0.01); };
  if (ok(x, z)) return { x, z };
  for (let r = 0.5; r <= 3; r += 0.5) { let best = null, bd = Infinity; for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, X = x + Math.sin(a) * r, Z = z + Math.cos(a) * r; if (ok(X, Z)) { const d = Math.hypot(X - pt.x, Z - pt.z); if (d < bd) { bd = d; best = { x: X, z: Z }; } } } if (best) return best; }
  const x0 = x, z0 = z; let k = 1; while (k > 0 && !ok(pp.x + (x0 - pp.x) * k, pp.z + (z0 - pp.z) * k)) k -= 0.05; k = Math.max(0, k); return { x: pp.x + (x0 - pp.x) * k, z: pp.z + (z0 - pp.z) * k };
}
function pointLibre(pt, portee) { const pp = paysanMesh.position, L = Math.hypot(pt.x - pp.x, pt.z - pp.z); return L > portee ? { x: pp.x + (pt.x - pp.x) * portee / L, z: pp.z + (pt.z - pp.z) * portee / L } : { x: pt.x, z: pt.z }; } /* (un sort legendaire tombe partout a portee) */
function monstreVise(pt) { let best = null, bd = 1.4; if (combat) combat.monstres.forEach((o) => { if (o.etat !== 'actif') return; const d = Math.hypot(o.x - pt.x, o.z - pt.z); if (d < bd) { bd = d; best = o; } }); return best; }
function majVisee(s) {
  if (!visee || !combat) { if (visee) annulerVisee(); return; }
  const pp = paysanMesh.position, pt = visee.point;
  if (visee.cone) { VISEUR.visible = false; VISEE_LIGNE.visible = false; PORTEE_VUE.visible = false; VISEE_CONE.visible = true; VISEE_CONE.position.set(pp.x, pp.y + 0.08, pp.z); VISEE_CONE.rotation.y = Math.atan2(pt.x - pp.x, pt.z - pp.z); VISEE_CONE.scale.setScalar(visee.portee); VISEE_CONE.children[0].material.opacity = 0.42 + Math.sin(s * 6) * 0.06; return; }
  VISEE_CONE.visible = false;
  if (visee.ligne) {
    VISEUR.visible = false; VISEE_LIGNE.visible = true; VISEE_LIGNE.position.set(pp.x, pp.y + 0.08, pp.z); VISEE_LIGNE.rotation.y = Math.atan2(pt.x - pp.x, pt.z - pp.z);
    VISEE_LIGNE.scale.set(LARGEUR_PERCANTE * 2, 1, PORTEE_PERCANTE); VISEE_LIGNE.material.opacity = 0.5 + Math.sin(s * 6) * 0.1; return;
  }
  VISEE_LIGNE.visible = false; VISEUR.visible = true;
  let x = pt.x, z = pt.z, y = pt.y; const m = visee.rayon < 1 && monstreVise(pt); if (m) { x = m.x; z = m.z; y = m.m.position.y; } /* le coup fatal s'accroche au monstre le plus proche */
  if (visee.portee) { const q = visee.libre ? pointLibre(pt, visee.portee) : pointSort(pt, visee.portee); x = q.x; z = q.z; PORTEE_VUE.visible = true; PORTEE_VUE.position.set(pp.x, pp.y + 0.08, pp.z); PORTEE_VUE.scale.setScalar(visee.portee); } /* (la ou il tombera vraiment, et jusqu'ou il porte) */
  const c = caseIci(x, z); VISEUR.position.set(x, (c ? posCase(c).y : y) + 0.09, z); VISEUR.scale.setScalar(visee.rayon * (m ? Math.max(1, m.d.ombre * 0.8) : 1) * (1 + Math.sin(s * 6) * 0.03));
  const t = new T.Color(visee.teinte); viseurDisque.material.color.copy(t); viseurBord.material.color.copy(t); viseurDisque.material.opacity = visee.rayon < 1 && !m ? 0.1 : 0.25;
}
/* (« l'animation de Tempete de lames, c'est la meme que fleche de feu du Cra : il faudrait que le personnage tourne sur lui-meme pendant quelques secondes »,
   Mathieu, 12/10/2026) : il file au centre du cercle vise, tournoie 2 s epee tendue, et frappe tout autour a chaque demi-seconde (4 fois 0,75 de ses degats,
   les 3 fois de l'ulti, en tout) */
const DUREE_TEMPETE = 2, COUPS_TEMPETE = 4;
function tempeteDeLames(pt) {
  const st = statsPerso(), u = paysanMesh.userData, pp = paysanMesh.position, R = 2.8, de = pp.clone(), m = u.membres || [], bras = m[3] || m[2];
  let x = pt.x, z = pt.z; const ok = (a, b) => { const q = caseIci(a, b); return q && PASSABLE[q.type]; };
  if (!ok(x, z)) { const x0 = x, z0 = z; let k = 1; while (k > 0 && !ok(pp.x + (x0 - pp.x) * k, pp.z + (z0 - pp.z) * k)) k -= 0.05; x = pp.x + (x0 - pp.x) * Math.max(0, k); z = pp.z + (z0 - pp.z) * Math.max(0, k); }
  combat.cdUlti = RECHARGE_ULTI; chemin = []; arrivee = null; combat.ordre = false; u.charge = true; toast(nomUlti('zone') + ' !', 'or');
  const dash = Math.min(0.4, Math.hypot(x - pp.x, z - pp.z) / 18), fx = new T.Group(); scene.add(fx);
  [[0.95, 1.18, '#ffffff', 0.9, 0], [1.28, 1.42, '#ffd28a', 0.75, Math.PI], [R - 0.12, R, '#ee8a34', 0.55, 0]].forEach(([r0, r1, c, o, a], i) => { const g = new T.Mesh(new T.RingGeometry(r0, r1, 48, 1, a, i === 2 ? Math.PI * 2 : Math.PI * 1.25), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: o, side: T.DoubleSide, depthWrite: false })); g.rotation.x = -Math.PI / 2; g.position.y = i === 2 ? 0.05 : 0.7 + i * 0.12; g.userData.tourne = i < 2 ? (i ? -1 : 1) : 0; fx.add(g); });
  let t = 0, coups = 0;
  effets.push((dt) => {
    t += dt; const p = paysanMesh.position;
    if (t < dash) { const k = t / dash; p.x = de.x + (x - de.x) * k; p.z = de.z + (z - de.z) * k; }
    else { p.x = x; p.z = z; u.angle = (u.angle || 0) + dt * 17; paysanMesh.rotation.y = u.angle; if (bras) bras.rotation.x = -1.45; /* il tournoie, epee tendue */
      while (combat && !combat.fin && coups < COUPS_TEMPETE && t - dash >= coups * (DUREE_TEMPETE / COUPS_TEMPETE)) { coups++; combat.monstres.slice().forEach((o) => { if (o.etat === 'actif' && Math.hypot(o.x - x, o.z - z) <= R) blesser(o, Math.round(st.deg * 3 / COUPS_TEMPETE), true); }); } }
    const cel = caseIci(p.x, p.z); u.y = hauteurSol(p.x, p.z, cel); p.y = u.y; fx.position.set(p.x, p.y, p.z);
    fx.children.forEach((g) => { if (g.userData.tourne) g.rotation.z += dt * 15 * g.userData.tourne; else g.material.opacity = 0.35 + 0.2 * Math.sin(t * 12); });
    if (t >= dash + DUREE_TEMPETE || !combat) { jeter(fx); u.charge = false; if (bras) bras.rotation.x = 0; if (cel && PASSABLE[cel.type]) u.cellule = cel; pouf(p.x, p.y, p.z, 3.5, '#ffd28a'); return true; }
  });
}
function executerUlti(id, c, pt) {
  if (id === 'zone' && classeDe() === 'iop' && !c && pt) { tempeteDeLames(pt); return; } /* le Iop tournoie au lieu de lancer l'effet de zone commun */
  const st = statsPerso(), classe = classeDe(), u = paysanMesh.userData, pp = paysanMesh.position, cx0 = c ? c.x : pt.x, cz0 = c ? c.z : pt.z;
  combat.cdUlti = RECHARGE_ULTI; chemin = []; arrivee = null; combat.ordre = false; u.angle = Math.atan2(cx0 - pp.x, cz0 - pp.z); paysanMesh.rotation.y = u.angle;
  toast(nomUlti(id) + ' !', 'or');
  const sol = caseIci(cx0, cz0), y0 = c ? c.m.position.y : sol ? posCase(sol).y : 0, point = new T.Vector3(cx0, y0 + (c ? c.haut * 0.5 : 0.3), cz0);
  u.attaque = { t: 0, classe, base: u.angle, tour: false, surFrappe: () => effetFrappe(classe, point, () => {
    if (!combat) return;
    if (id === 'mono') { pouf(c.x, c.m.position.y, c.z, 3, '#ffd75e'); pouf(c.x, c.m.position.y, c.z, 1.5, '#d9443a'); blesser(c, st.deg * 5, true); return; }
    const r = id === 'zone' ? 2.8 : 3;
    pouf(cx0, y0, cz0, r / 0.45 - 1, ULTIS[id].teinte); pouf(cx0, y0, cz0, r / 0.7, id === 'gel' ? '#e6f6ff' : '#fff3c4');
    combat.monstres.slice().forEach((o) => { if (o.etat !== 'actif' || Math.hypot(o.x - cx0, o.z - cz0) > r) return; if (id === 'gel') { o.lent = 5; blesser(o, st.deg); } else blesser(o, st.deg * 3, true); });
  }) };
}
/* le Bond du Iop : il saute vers le point vise (jusqu'a PORTEE_BOND cases), retombe et frappe tout autour : 3 fois ses degats sur le monstre le plus
   proche du point d'impact, 1,5 fois sur les autres, et chaque monstre touche lui rend 3 % de sa vie */
const RAYON_BOND = 2.1, PORTEE_BOND = 7;
function bondIop(pt) {
  const st = statsPerso(), pp = paysanMesh.position, u = paysanMesh.userData;
  const q0 = pointSort(pt, PORTEE_BOND); let x = q0.x, z = q0.z; /* (la ou le cercle de visee l'a montre) */
  combat.cdSort = RECHARGE_SORT; son('sort'); chemin = []; arrivee = null; combat.ordre = false; if (Math.hypot(x - pp.x, z - pp.z) > 0.05) u.angle = Math.atan2(x - pp.x, z - pp.z); paysanMesh.rotation.y = u.angle;
  const de = pp.clone(), fin = new T.Vector3(x, 0, z), cible = combat.monstres.filter((o) => o.etat === 'actif' && Math.hypot(o.x - x, o.z - z) < RAYON_BOND).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
  let t = 0; u.charge = true;
  effets.push((dt) => {
    t += dt / 0.3; const k = Math.min(1, t); paysanMesh.position.x = de.x + (fin.x - de.x) * k; paysanMesh.position.z = de.z + (fin.z - de.z) * k;
    const cel = caseIci(paysanMesh.position.x, paysanMesh.position.z); u.y = hauteurSol(paysanMesh.position.x, paysanMesh.position.z, cel); paysanMesh.position.y = u.y + Math.sin(k * Math.PI) * 0.9;
    if (t >= 1) {
      u.charge = false; if (cel && PASSABLE[cel.type]) u.cellule = cel; pouf(fin.x, u.y, fin.z, 3.5, '#ffe08a');
      let k = 0; if (combat) combat.monstres.slice().forEach((o) => { if (o.etat === 'actif' && Math.hypot(o.x - fin.x, o.z - fin.z) < RAYON_BOND) { k++; blesser(o, Math.round(st.deg * (o === cible ? 3 : 1.5)), true); } });
      if (combat && !combat.fin && k) { const h = Math.min(combat.pvMax - combat.pv, Math.round(st.pvMax * SOIN_CHARGE * Math.min(4, k))); if (h > 0) { combat.pv += h; chiffre('+' + h, new T.Vector3(fin.x, u.y + 1.7, fin.z), 'soin'); } } /* chaque monstre touche lui rend 3 % de sa vie (4 au plus) */
      return true;
    }
  });
}
/* cra : une fleche doree qui part vers le point vise et traverse tous les monstres sur sa ligne */
function flechePercante(pt) {
  const st = statsPerso(), pp = paysanMesh.position, u = paysanMesh.userData;
  const dir = new T.Vector3(pt.x - pp.x, 0, pt.z - pp.z); if (dir.lengthSq() < 0.01) dir.set(Math.sin(paysanMesh.rotation.y), 0, Math.cos(paysanMesh.rotation.y)); dir.normalize();
  combat.cdSort = rechargeSort(); chemin = []; arrivee = null; combat.ordre = false; u.angle = Math.atan2(dir.x, dir.z); paysanMesh.rotation.y = u.angle; /* (sa recharge : 20 s) */
  u.attaque = { t: 0, classe: 'cra', base: u.angle, tour: false, surFrappe: () => {} };
  const de = pp.clone(); de.y += 0.95; const fin = de.clone().add(dir.multiplyScalar(PORTEE_PERCANTE));
  const fl = boite(0.07, 0.07, 0.9, '#ffe08a'); scene.add(fl); fl.position.copy(de); fl.lookAt(fin); const touches = new Set(); let t = 0;
  effets.push((dt) => {
    t += dt / 0.45; fl.position.lerpVectors(de, fin, Math.min(1, t));
    if (combat) combat.monstres.slice().forEach((o) => { if (o.etat === 'actif' && !touches.has(o) && Math.hypot(o.x - fl.position.x, o.z - fl.position.z) < LARGEUR_PERCANTE) { touches.add(o); blesser(o, Math.round(st.deg * 3), true); } });
    if (t >= 1) { jeter(fl); return true; }
  });
}
function invoquer(pt) {
  const pp = paysanMesh.position, st = statsPerso(), u = paysanMesh.userData; if (combat.invoc) { jeter(combat.invoc.m); if (combat.invoc.barre) combat.invoc.barre.remove(); }
  const q0 = pointSort(pt || { x: pp.x + 0.9, z: pp.z + 0.3 }, PORTEE_INVOC), x = q0.x, z = q0.z; /* (la ou le cercle de visee l'a montre) */
  const y = hauteurSol(x, z, caseIci(x, z)); u.angle = Math.atan2(x - pp.x, z - pp.z); paysanMesh.rotation.y = u.angle;
  const m = fusionnerBouftou(creerBouftou(T, maille)); ombrePieds(m, 2.4); m.scale.setScalar(0.45); poser(m, x, y, z, 0);
  /* « mieux reperer le Bouftou allie, et voir le temps avant qu'il disparaisse » (testeurs, 12/10/2026) : un anneau vert a ses pieds, une barre verte
     au-dessus de lui qui se vide en 12 s ; il reste pose 0,6 s la ou il est tombe avant de foncer sur un monstre */
  const anneauA = new T.Mesh(new T.RingGeometry(1.35, 1.65, 36), new T.MeshBasicMaterial({ color: '#56d27a', transparent: true, opacity: 0.9, side: T.DoubleSide, depthWrite: false })); anneauA.rotation.x = -Math.PI / 2; anneauA.position.y = 0.08; m.add(anneauA);
  const barre = document.createElement('div'); barre.className = 'pv-monstre allie'; barre.innerHTML = '<i></i>'; $('combat-zone').appendChild(barre);
  combat.invoc = { m, x, z, ry: u.angle, vie: DUREE_INVOC, cd: 0.4, pas: 0, frappe: 0, pose: 0.6, barre }; pouf(x, y, z, 3.2, '#d9c2ff');
  combat.monstres.slice().forEach((o) => { if (o.etat === 'actif' && Math.hypot(o.x - x, o.z - z) < RAYON_INVOC) blesser(o, Math.round(st.deg * 2), true); }); /* il retombe en frappant tout autour */
  toast('Un Bouftou retombe sur les monstres et se bat pendant ' + DUREE_INVOC + ' s.', 'or');
}
/* les pouvoirs des coiffes legendaires qui agissent seuls pendant les vagues : le seisme du Craqueleur, le souffle de Crocabulia */
/* LES SORTS LEGENDAIRES (16/10/2026) : la coiffe (touche 3) et l'arme (touche 4) ; on les lance sur sa cible (ou le monstre le plus proche a portee) */
const SORTS_LEG = {
  craq: { nom: 'Séisme', teinte: '#a08a6a', recharge: 12, portee: 10, zone: 3 },
  croc: { nom: 'Souffle de feu', teinte: '#ff7a1e', recharge: 12, portee: 7 },
  wa: { nom: 'Pluie de cawottes', teinte: '#f08a24', recharge: 13, portee: 10, zone: 2.4 },
  koulosse: { nom: 'Fumée', teinte: '#79b54a', recharge: 13, portee: 10, zone: 2.2 },
};
const legDe = (emp) => { const k = S_ && S_.equip && S_.equip[emp], o = k && obj(k); return o && o.leg && SORTS_LEG[o.leg] ? o.leg : null; };
const cdLeg = (emp) => emp === 'coiffe' ? 'cdLegC' : 'cdLegA';
function cibleLeg(portee) { const c = combat, pp = paysanMesh.position, d = (o) => Math.hypot(o.x - pp.x, o.z - pp.z);
  if (c.cible && c.cible.etat === 'actif' && d(c.cible) <= portee) return c.cible;
  return c.monstres.filter((o) => o.etat === 'actif' && d(o) <= portee).sort((a, b) => d(a) - d(b))[0] || null; }
function lancerLegAuto(emp) { /* (les bots de test : sur la cible, sans viser) */
  const c = combat; if (!c || c.fin || c.deroute != null) return; const cle = legDe(emp); if (!cle || (c[cdLeg(emp)] || 0) > 0) return;
  const cib = cibleLeg(SORTS_LEG[cle].portee); if (cib) executerLeg(emp, { x: cib.x, z: cib.z }, true);
}
function executerLeg(emp, pt, compter) {
  const c = combat; if (!c || c.fin) return; const cle = legDe(emp); if (!cle) return;
  const S = SORTS_LEG[cle], pp = paysanMesh.position, st = statsPerso(), actifs = c.monstres.filter((o) => o.etat === 'actif'), x = pt.x, z = pt.z, y = solA(x, z);
  c[cdLeg(emp)] = S.recharge; if (compter && c.st) c.st.sorts++; son('sort'); paysanMesh.userData.angle = Math.atan2(x - pp.x, z - pp.z);
  if (cle === 'craq') { /* le seisme : la terre s'ouvre la ou tu vises */
    pouf(x, y, z, S.zone * 2, '#9a948c'); pouf(x, y, z, S.zone, '#ff7a1e');
    actifs.forEach((o) => { if (Math.hypot(o.x - x, o.z - z) < S.zone) blesser(o, Math.round(st.deg * 2), true); });
  } else if (cle === 'croc') { /* le souffle de feu : un cone vers ou tu vises, les monstres touches brulent */
    const a = Math.atan2(x - pp.x, z - pp.z);
    for (let k = 1; k <= 5; k++) pouf(pp.x + Math.sin(a) * k * 1.3, pp.y + 0.6, pp.z + Math.cos(a) * k * 1.3, 1 + k * 0.5, k % 2 ? '#ff7a1e' : '#ffd04a');
    actifs.forEach((o) => { const d = Math.hypot(o.x - pp.x, o.z - pp.z); let e = Math.atan2(o.x - pp.x, o.z - pp.z) - a; e = Math.atan2(Math.sin(e), Math.cos(e));
      if (d < S.portee && Math.abs(e) < 0.55) { blesser(o, Math.round(st.deg * 3), true); if (o.etat === 'actif') { o.brule = 3; o.bruleDeg = Math.max(1, Math.round(st.deg * 0.3)); } } });
  } else if (cle === 'wa') { /* la pluie de cawottes : quatre cawottes dans la zone visee */
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.random(), r = k ? 0.6 + Math.random() * 1.0 : 0, X = x + Math.cos(a) * r, Z = z + Math.sin(a) * r; pouf(X, y, Z, 2.4, '#f08a24');
      actifs.forEach((o) => { if (o.etat === 'actif' && Math.hypot(o.x - X, o.z - Z) < 1.4) blesser(o, Math.round(st.deg * 2), true); }); }
  } else if (cle === 'koulosse') nuageLeg(x, z); /* la fumee : un nuage la ou tu vises */
  majCombatHud();
}
function majLegendaire(dt) { /* la recharge des deux sorts legendaires */
  const c = combat; if (!c || c.fin) return;
  c.cdLegC = Math.max(0, (c.cdLegC || 0) - dt); c.cdLegA = Math.max(0, (c.cdLegA || 0) - dt);
}
function majEtatSort(id, cd) { /* sous un bouton : « prêt », ou « prêt dans 12 s » (« 12 s » au doigt) ; reecrit seulement quand ca change */
  const t = cd > 0 ? '<span class="long">prêt dans </span>' + Math.ceil(cd) + ' s' : 'prêt', el = $(id); if (el._t !== t) { el._t = t; el.innerHTML = t; }
}
function majBoutonsLeg() { /* les boutons 3 et 4 : seulement si on porte une coiffe ou une arme legendaire a sort */
  const c = combat; [['coiffe', 'cdLegC'], ['arme', 'cdLegA']].forEach(([emp, cd]) => { const b = $('b-leg-' + emp), cle = c && legDe(emp); b.hidden = !cle; if (!cle) return;
    const S = SORTS_LEG[cle], r = $('leg-' + emp + '-rond'), k = S_.equip[emp];
    if (r.dataset.cle !== k) { r.dataset.cle = k; r.innerHTML = '<img src="assets/icones/' + iconeObjet(k) + '.png?v=' + VERSION_MODELES + '" alt=""><span>' + S.nom + '</span>'; r.style.setProperty('--teinte', S.teinte); }
    r.style.setProperty('--cd', (100 * (c[cd] || 0) / S.recharge).toFixed(1) + '%'); b.classList.toggle('pret', !(c[cd] > 0)); majEtatSort('leg-' + emp + '-etat', c[cd] || 0); });
}
/* LES QUATRE BOUTONS DE SORT (refonte du 16/10/2026) : 1 le sort de classe, 2 l'ulti, 3 et 4 les sorts des coiffes et armes legendaires.
   Une seule regle pour les armer (armerSort) : retoucher le bouton annule la visee ; rien tant que la recharge court ; rien sans monstre a viser.
   Chaque bouton dit ce qu'on vise (visee) et ce qui part au clic (tirer). Un nouveau sort : une entree ici et sa fonction d'effet. */
const viseeClasse = () => ({ osa: { id: 'invoc', rayon: RAYON_INVOC, teinte: '#b48cff', portee: PORTEE_INVOC }, cra: { ligne: true, teinte: '#ffe08a' },
  iop: { id: 'bond', rayon: RAYON_BOND, teinte: '#ffe08a', portee: PORTEE_BOND } })[classeDe()]; /* (iop : on vise ou sauter, « qu'on puisse nous-meme cibler ou on saute », Mathieu, 12/10/2026) */
const boutonLeg = (emp) => ({ cd: cdLeg(emp), dispo: () => !!legDe(emp),
  visee: () => { const cle = legDe(emp), S = SORTS_LEG[cle]; return { quoi: 'leg', emp, cle, rayon: S.zone || 1, portee: S.portee, teinte: S.teinte, cone: cle === 'croc', libre: true }; }, /* (la zone au sol, la portee autour du perso) */
  tirer: (v, pt) => { annulerVisee(); executerLeg(v.emp, v.cone ? { x: pt.x, z: pt.z } : pointLibre(pt, v.portee), true); } });
const BOUTONS_SORT = {
  sort: { cd: 'cdSort', visee: () => Object.assign({ quoi: 'sort' }, viseeClasse()),
    tirer: (v, pt) => { annulerVisee(); if (combat.st) combat.st.sorts++; son('sort'); if (v.id === 'invoc') { invoquer(pt); combat.cdSort = RECHARGE_INVOC; } else if (v.id === 'bond') bondIop(pt); else flechePercante(pt); } },
  ulti: { cd: 'cdUlti', refus: () => S_.ulti ? '' : niveau(S_.xp) >= NIV_ULTI ? 'Choisis ton ulti dans la fiche des vagues, après ce combat.' : 'L\'ulti se débloque au niveau ' + NIV_ULTI + ' de Paysan.',
    visee: () => { const id = S_.ulti; return { quoi: 'ulti', id, rayon: id === 'mono' ? 0.75 : id === 'zone' ? 2.8 : 3, teinte: ULTIS[id].teinte }; },
    tirer: (v, pt) => { if (v.id === 'mono') { const m = monstreVise(pt); if (!m) { toast('Vise un monstre.'); return; } annulerVisee(); if (combat.st) combat.st.sorts++; executerUlti('mono', m); return; } /* (le coup fatal : un monstre) */
      annulerVisee(); if (combat.st) combat.st.sorts++; son('sort'); executerUlti(v.id, null, pt); } },
  coiffe: boutonLeg('coiffe'), arme: boutonLeg('arme'),
};
function armerSort(bouton) {
  const c = combat; if (!c || c.fin || c.deroute != null) return; /* (a terre : plus de sort) */ const B = BOUTONS_SORT[bouton];
  if (B.dispo && !B.dispo()) return;
  if (visee && visee.bouton === bouton) { annulerVisee(); return; } /* retoucher le bouton annule */
  if (B.refus) { const r = B.refus(); if (r) { toast(r); return; } }
  if ((c[B.cd] || 0) > 0) return;
  if (!c.monstres.some((o) => o.etat === 'actif')) { toast('Aucun monstre à viser pour l\'instant.'); return; }
  viser(Object.assign({ bouton }, B.visee()));
}
function tirerVisee(pt) { const v = visee; if (!v || !combat || combat.fin) { annulerVisee(); return; } BOUTONS_SORT[v.bouton].tirer(v, pt); }
function lancerSort() { armerSort('sort'); }
function lancerUlti() { armerSort('ulti'); }
function lancerLeg(emp) { armerSort(emp); }
const VEC_INVOC = new T.Vector3();
function majInvoc(dt) {
  const iv = combat.invoc; if (!iv) return;
  iv.vie -= dt; if (iv.vie <= 0) { pouf(iv.x, iv.m.position.y, iv.z, 2, '#d9c2ff'); jeter(iv.m); if (iv.barre) iv.barre.remove(); combat.invoc = null; return; }
  if (iv.barre) { iv.barre.firstChild.style.width = (100 * iv.vie / DUREE_INVOC).toFixed(0) + '%'; versEcran(VEC_INVOC.set(iv.x, iv.m.position.y + 1.25, iv.z), iv.barre); }
  if (iv.pose > 0) iv.pose -= dt; /* il se pose la ou il est tombe */
  iv.cd -= dt; const c = iv.pose > 0 ? null : plusProcheMonstre(iv); let v = 0;
  if (c) {
    const d = Math.hypot(c.x - iv.x, c.z - iv.z);
    if (d > 1.0) { const w = prochainPas(iv, c.x, c.z, dt), dx = w.x - iv.x, dz = w.z - iv.z, L = Math.hypot(dx, dz) || 1; v = 3; iv.x += dx / L * Math.min(L, v * dt); iv.z += dz / L * Math.min(L, v * dt); tourner(iv, Math.atan2(dx, dz), dt); }
    else { tourner(iv, Math.atan2(c.x - iv.x, c.z - iv.z), dt); if (iv.cd <= 0) { iv.cd = 0.8; iv.frappe = 0.25; blesser(c, 6 + 2 * statsPerso().niveau); } }
  }
  iv.pas += v * dt * 6; let elan = 0; if (iv.frappe > 0) { iv.frappe -= dt; elan = Math.sin((1 - Math.max(0, iv.frappe) / 0.25) * Math.PI) * 0.4; }
  iv.m.position.set(iv.x + Math.sin(iv.ry) * elan, hauteurSol(iv.x, iv.z, caseIci(iv.x, iv.z)) + (1 - Math.cos(iv.pas * 2)) * 0.03, iv.z + Math.cos(iv.ry) * elan);
  iv.m.rotation.y = iv.ry; iv.m.rotation.z = Math.sin(iv.pas) * 0.05; iv.m.scale.setScalar(0.45 * Math.min(1, iv.vie / 0.3));
}
function majBarreBoss(mo) {
  const el = $('boss-barre'); if (!el) return;
  if (mo.etat === 'mort') { el.hidden = true; return; }
  if (el.hidden || el._mo !== mo) { el.hidden = false; el._mo = mo; el._w = el._e = null; $('boss-nom').textContent = mo.d.nom; } /* (un nouveau boss : tout se redessine) */
  const pv = Math.max(0, Math.ceil(mo.pv)), w = (100 * pv / mo.pvMax).toFixed(1) + '%';
  if (el._w !== w) { el._w = w; $('boss-pv').style.width = w; $('boss-pv-txt').textContent = fmt(pv) + ' / ' + fmt(mo.pvMax) + ' PV'; }
  el.classList.toggle('rage', !!mo.enrage); el.classList.toggle('carapace', mo.carapace > 0); el.classList.toggle('protege', mo.protege > 0);
  const etat = mo.carapace > 0 ? 'sous sa carapace' : mo.protege > 0 ? 'protégé à ' + Math.round(100 * mo.protege) + ' %' : mo.enrage ? 'en rage' : '';
  if (el._e !== etat) { el._e = etat; $('boss-etat').textContent = etat; }
}
function majCombatHud() {
  const c = combat; if (!c) return;
  const rest = c.file.length + c.monstres.filter((o) => o.etat !== 'mort').length;
  $('combat-titre').textContent = c.deroute != null ? 'À terre : ils saccagent ta ferme, ' + Math.max(0, Math.ceil(c.deroute)) + ' s' : c.raid ? 'Simu VSA : ' + rest + ' voleur' + (rest > 1 ? 's' : '') : c.arene ? (c.genre === 'ile' ? 'Île des boss : ' + MONSTRES[c.arene.boss].nom + ' colossal' + (MONSTRES[c.arene.boss].fem ? 'e' : '') : 'Arène, vague ' + c.arene.k + ' : ' + rest + ' monstre' + (rest > 1 ? 's' : '')) : 'Vague ' + c.n + ' : ' + rest + ' monstre' + (rest > 1 ? 's' : '') + ' restant' + (rest > 1 ? 's' : '');
  $('combat-barre').style.width = (100 * rest / c.total).toFixed(0) + '%'; $('b-fuir').hidden = c.deroute != null; /* (a terre, on ne fuit plus) */
  const f = c.pv / c.pvMax; $('combat-pv').style.width = (100 * f).toFixed(1) + '%'; $('combat-pv').style.background = f < 0.3 ? 'var(--rouge)' : '';
  $('combat-pv-txt').textContent = Math.ceil(c.pv) + ' / ' + c.pvMax + ' PV'; majVieHaut();
  if (!S_.ulti) { $('ulti-rond').style.setProperty('--cd', '100%'); $('ulti-etat').textContent = niveau(S_.xp) >= NIV_ULTI ? 'à choisir' : 'niveau ' + NIV_ULTI; $('ulti-etat')._t = null; }
  else { $('ulti-rond').style.setProperty('--cd', (100 * c.cdUlti / RECHARGE_ULTI).toFixed(1) + '%'); majEtatSort('ulti-etat', c.cdUlti); }
  { $('sort-rond').style.setProperty('--cd', (100 * c.cdSort / rechargeSort()).toFixed(1) + '%'); majEtatSort('sort-etat', c.cdSort); }
  $('b-sort').classList.toggle('pret', c.cdSort <= 0); $('b-ulti').classList.toggle('pret', !!S_.ulti && c.cdUlti <= 0); /* (le liseré dore : pret) */
  majBoutonsLeg();
  { let b = majCombatHud.barrePerso; /* la barre de vie au-dessus de la tete du perso, comme celles des monstres */
    if (!b || !b.isConnected) { b = majCombatHud.barrePerso = document.createElement('div'); b.className = 'pv-monstre pv-perso'; b.innerHTML = '<i></i>'; $('combat-zone').appendChild(b); }
    b.firstChild.style.width = (100 * Math.max(0, f)).toFixed(1) + '%'; b.classList.toggle('bas', f < 0.3);
    if (paysanMesh) versEcran(new T.Vector3(paysanMesh.position.x, paysanMesh.position.y + 2.1, paysanMesh.position.z), b); }
  c.monstres.forEach((o) => {
    if (o.etat !== 'actif') { o.barre.hidden = true; return; }
    o.barre.hidden = false; o.barre.classList.toggle('cible', o === c.cible); o.barre.firstChild.style.width = (100 * Math.max(0, o.pv) / o.pvMax).toFixed(0) + '%';
    versEcran(new T.Vector3(o.x, o.m.position.y + o.haut, o.z), o.barre);
  });
}
