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
const descUlti = (id) => id === 'zone' && classeDe() === 'iop' ? 'Il fonce au point visé, puis tournoie ' + DUREE_TEMPETE + ' s épée tendue : ' + COUPS_TEMPETE + ' coups sur tous les monstres autour de lui, trois fois son attaque en tout. Tu peux le déplacer pendant qu\'il tournoie.' : ULTIS[id].desc; /* (la Tempete de lames du Iop n'est pas l'effet de zone commun) */
/* « faut revoir l'esthetisme des sorts sur Osa et Iop, ca affiche les memes icones que Cra » (Mathieu, 11/10/2026) : chaque classe a ses icones
   (generer-ultis.html) ; celles du Cra gardent leur nom d'origine */
/* les icones 3D des ultis, une par classe, dans le style des sorts (23/10/2026) ; les autres Iop ont les leurs, avec leur tete
   (23/10/2026, « refait les icones des autres iops quand y'a besoin, genre l'ulti », Mathieu) */
const ULTIS_PAR_LOOK = new Set([]); /* (les modeles qui ont leurs icones : 'iop-berserker-a', 'iop-berserker-b', 'iop-berserker-c', 'feminin-iop' une fois faites) */
const srcUlti = (id) => { const m = modeleDe(classeDe(), S_.perso.look); return 'assets/icones/ulti3d-' + id + '-' + (ULTIS_PAR_LOOK.has(m) ? m : classeDe()) + '.png?v=' + VERSION_MODELES + V_ICONES_3D; };
/* LES ULTIS AU CHOIX POUR LES TESTS (23/10/2026, « sur mon truc a moi, Rorschach, laisse-moi la possibilite de changer d'ultimate comme je veux, pour faire
   des tests », Mathieu) : le compte de Mathieu change d'ulti quand il veut, sans confirmation ; pour tous les autres, le choix reste definitif */
const TESTEURS_ULTI = ['9a67160a-0234-46dc-aeb3-f52e3d03408b']; /* (son compte de ferme, le meme que l'ancien acces libre de l'ile) */
const ultiLibre = () => !!(enLigneSv.compte && TESTEURS_ULTI.includes(enLigneSv.compte));
function ouvrirUlti() {
  const l = niveau(S_.xp), d = statsPerso().deg, cl = CLASSES.find((c) => c.id === classeDe());
  const carte = (id) => { const U = ULTIS[id], pris = S_.ulti === id;
    return '<div class="ulti-carte"' + (S_.ulti && !pris ? ' style="opacity:.45"' : '') + '><span class="rond" style="background:radial-gradient(circle at 50% 40%, #fffaf0, ' + U.teinte + ')"><img src="' + srcUlti(id) + '" alt=""></span><div><b>' + nomUlti(id) + '</b><div class="art" style="border:0;padding:0;display:block"><div class="puces"><span class="puce" style="background:' + U.teinte + ';color:#fff">' + U.genre + '</span>' + U.chiffres(d).map((t) => '<span class="puce">' + t + '</span>').join('') + '<span class="puce">recharge ' + RECHARGE_ULTI + ' s</span></div></div><div class="desc">' + descUlti(id) + '</div></div>' +
      (S_.ulti ? (pris ? '<span class="cadenas">✓ Ton ulti</span>' : ultiLibre() ? '<button class="btn discret" data-confirmer-ulti="' + id + '">Prendre (test)</button>' : '<span></span>') : '<button class="btn kamas" data-choisir-ulti="' + id + '"' + (l < NIV_ULTI ? ' disabled' : '') + '>Choisir</button>') + '</div>'; };
  ouvrirModale('ulti', entete('L\'ulti du ' + cl.nom) + '<p style="font-size:.8rem;font-weight:600;margin:0 0 4px">' + (S_.ulti ? (ultiLibre() ? 'Compte de test : tu changes d\'ulti quand tu veux.' : 'Ton choix est fait, il est définitif.') : l < NIV_ULTI ? 'Il se débloque au niveau ' + NIV_ULTI + ' de Paysan (tu es niveau ' + l + ').' : 'Il s\'ajoute à ton attaque et à ton sort. <b>Tu le choisis une seule fois : impossible d\'en changer ensuite.</b>') + ' Les dégâts indiqués sont ceux de ton niveau actuel, ils montent avec toi.</p>' + ['gel', 'zone', 'mono'].map(carte).join(''));
}
function choisirUlti(id, confirme) {
  if ((S_.ulti && !ultiLibre()) || !ULTIS[id] || niveau(S_.xp) < NIV_ULTI) return;
  if (!confirme) { const U = ULTIS[id]; ouvrirModale('ulti', entete('Prendre ' + nomUlti(id) + ' ?') + '<div class="confirme"><div class="gros" style="background:radial-gradient(circle at 50% 40%, #fffaf0, ' + U.teinte + ')"><img src="' + srcUlti(id) + '" alt=""></div><b>' + U.genre + '</b><p>' + descUlti(id) + '<br><b>C\'est pour de bon : tu ne pourras plus changer d\'ulti.</b></p><div class="boutons"><button class="btn discret" data-voir-ulti>Revoir les trois</button><button class="btn kamas" data-confirmer-ulti="' + id + '">Oui, je le prends</button></div></div>'); return; }
  S_.ulti = id; sauver(); toast(nomUlti(id) + ' est ton ulti. Il t\'attend pendant les vagues, à côté de ton sort.', 'or'); ouvrirUlti();
  if (combat && $('ulti-rond')) $('ulti-rond').innerHTML = '<img class="trois-d" src="' + srcUlti(id) + '" alt=""><span>' + nomUlti(id) + '</span>'; /* (change en pleine vague, pour les tests : le bouton suit) */
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
/* le sol ou un sort peut tomber (24/10/2026, « en Arene et ile du boss, le Bouftou, peu importe ou tu mets le sort, il spawn sur toi » : seules les cases
   de la ferme comptaient ; l'Arene et l'ile n'en ont pas, le point reculait jusqu'au perso. Le bond du Iop y retombait aussi sur place) */
const solSort = (a, b) => lieu === 'arene' ? Math.hypot(a - ARENE.x, b - ARENE.z) < R_ARENE - 0.5 : lieu === 'ile' && ileBoss ? dansIle(a, b) : (() => { const c = caseIci(a, b); return !!c && !!PASSABLE[c.type]; })();
function pointSort(pt, portee) {
  const pp = paysanMesh.position; let x = pt.x, z = pt.z; const L = Math.hypot(x - pp.x, z - pp.z);
  if (portee && L > portee) { x = pp.x + (x - pp.x) * portee / L; z = pp.z + (z - pp.z) * portee / L; }
  const ok = (a, b) => solSort(a, b) && (!portee || Math.hypot(a - pp.x, b - pp.z) <= portee + 0.01);
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
  /* l'animation (23/10/2026) : un tourbillon autour de lui, trois lames qui tournent a hauteur d'epee, des rubans de vent a plusieurs hauteurs, l'anneau
     orange de la zone au sol, de la poussiere soulevee sur le bord ; a chaque coup, une onde et un eclat sur chaque monstre touche */
  const dash = Math.min(0.4, Math.hypot(x - pp.x, z - pp.z) / 18), fx = new T.Group(), lames = new T.Group(); scene.add(fx); fx.add(lames); lames.position.y = 0.78;
  for (let i = 0; i < 3; i++) { const bras3 = new T.Group(); bras3.rotation.y = i * Math.PI * 2 / 3; lames.add(bras3); [['#ffffff', '#ffe9a8', 0.95, 1.45, true], ['#ffd27a', '#ff7a1e', 0.6, 1.6, false]].forEach(([c, b, o, s, plein]) => { const l = new T.Mesh(GEO_RUBAN, matRuban(c, b, o, plein)); l.material.uniforms.uP.value = 1; l.material.uniforms.uQ.value = 0.95; l.userData.o = o; l.rotation.x = Math.PI / 2; l.scale.set(-s, s, 1); bras3.add(l); }); } /* (des lames de lumiere dont la queue s'efface, 22b-effets.js) */
  const vents = [[0.25, 1.9, 14], [0.6, 2.3, -10], [1.0, 2.0, 12], [1.4, 1.5, 17]].map(([h, r, v], i) => { const g = new T.Mesh(new T.RingGeometry(r - 0.07, r, 40, 1, i, 1.7), fxMat('#ffffff', 0.45)); g.material.blending = T.AdditiveBlending; g.rotation.x = -Math.PI / 2; g.position.y = h; g.userData.v = v; fx.add(g); return g; });
  const sol = new T.Mesh(new T.RingGeometry(R - 0.14, R, 56), fxMat('#ee8a34', 0.55)); sol.rotation.x = -Math.PI / 2; sol.position.y = 0.05; fx.add(sol);
  let fant = dash > 0.05 ? fantomes(paysanMesh, 3, '#ffd27a', 1.4) : null; /* (des silhouettes pendant l'elan, 22b-effets.js) */
  let t = 0, coups = 0, tour = u.angle || 0, souffle = 0, trace = 0; /* (son propre angle : la marche reecrit u.angle a chaque image, il ne tournait plus en marchant) */
  effets.push((dt) => {
    t += dt; const p = paysanMesh.position;
    if (t < dash) { const k = t / dash; p.x = de.x + (x - de.x) * k; p.z = de.z + (z - de.z) * k; trace += dt; if (trace > 0.02) { trace = 0; lueur(new T.Vector3(p.x, p.y + 0.8, p.z), '#ffd24a', 1.2, 0.25); } }
    else { tour += dt * 17; paysanMesh.rotation.y = tour; if (bras) { bras.rotation.x = -0.25; bras.rotation.z = -1.25; } /* (le bras tendu sur le cote, la lame a plat qui balaie autour de lui) ; il tournoie, epee tendue ; et il se deplace ou on le guide (« bloque a faire la toupie, c'est naze », Mathieu, 22/10/2026) : les coups frappent autour de lui, la ou il est */
      while (combat && !combat.fin && coups < COUPS_TEMPETE && t - dash >= coups * (DUREE_TEMPETE / COUPS_TEMPETE)) { coups++; onde(p.x, p.y, p.z, R, '#fff3c4', 0.3, 0.7); flashLumiere(p.x, p.y + 1, p.z, '#ffd27a', 2, 6, 0.2); combat.monstres.slice().forEach((o) => { if (o.etat === 'actif' && Math.hypot(o.x - p.x, o.z - p.z) <= R) { etoileImpact(new T.Vector3(o.x, o.m.position.y + o.haut * 0.5, o.z), 0.7); blesser(o, Math.round(st.deg * 3 / COUPS_TEMPETE), true); } }); }
      souffle += dt; if (souffle > 0.07) { souffle = 0; const b = tour * 0.7; poussiere(p.x + Math.sin(b) * R * 0.8, p.y, p.z + Math.cos(b) * R * 0.8, 1, 0.6); }
      for (let w = 0; w < 4; w++) { const th = tour * 0.6 + w * 1.57 + t * 3, rr = 1.1 + ((w * 0.37 + t * 1.7) % 1.5), h = 0.2 + ((w * 0.41 + t * 2.3) % 1.3); /* le vent du tourbillon : des filets qui tournent autour de lui */
        emettre(FX_LUM, 1, { x: p.x + Math.sin(th) * rr, y: p.y + h, z: p.z + Math.cos(th) * rr, v: [Math.cos(th) * 9, 0.6, -Math.sin(th) * 9], vie: [0.16, 0.24], taille: [0.07, 0.03], c: ['#ffffff', '#fff1c0'], a: 0.55, etire: 0.045 }); } }
    const cel = caseIci(p.x, p.z); u.y = hauteurSol(p.x, p.z, cel); p.y = u.y; fx.position.set(p.x, p.y, p.z);
    if (fant) { if (t < dash + 0.12) fant.maj(dt, Math.min(1, (dash + 0.12 - t) / 0.12)); else { fant.fin(); fant = null; } }
    const f = Math.min(1, t / 0.15, (dash + DUREE_TEMPETE - t) / 0.2); /* (le tourbillon se forme puis se defait) */
    lames.rotation.y = tour + 0.3; lames.scale.setScalar(0.6 + 0.4 * f); vents.forEach((g) => { g.rotation.z += dt * g.userData.v; g.material.opacity = 0.45 * f; }); sol.material.opacity = (0.35 + 0.2 * Math.sin(t * 12)) * f;
    lames.children.forEach((b3) => b3.children.forEach((l) => { l.material.uniforms.uA.value = l.userData.o * f; }));
    if (t >= dash + DUREE_TEMPETE || !combat) { jeter(fx); if (fant) { fant.fin(); fant = null; } u.charge = false; if (bras) { bras.rotation.x = 0; bras.rotation.z = 0; } if (cel && PASSABLE[cel.type]) u.cellule = cel; onde(p.x, p.y, p.z, R + 0.6, '#ffffff', 0.4, 0.8); poussiere(p.x, p.y, p.z, 12, R * 0.7); flashLumiere(p.x, p.y + 1, p.z, '#ffd27a', 2.5, 7, 0.3); return true; }
  });
}
function executerUlti(id, c, pt) {
  if (id === 'zone' && classeDe() === 'iop' && !c && pt) { tempeteDeLames(pt); return; } /* le Iop tournoie au lieu de lancer l'effet de zone commun */
  const st = statsPerso(), classe = classeDe(), u = paysanMesh.userData, pp = paysanMesh.position, cx0 = c ? c.x : pt.x, cz0 = c ? c.z : pt.z;
  combat.cdUlti = RECHARGE_ULTI; chemin = []; arrivee = null; combat.ordre = false; u.angle = Math.atan2(cx0 - pp.x, cz0 - pp.z); paysanMesh.rotation.y = u.angle;
  toast(nomUlti(id) + ' !', 'or');
  const sol = caseIci(cx0, cz0), y0 = c ? c.m.position.y : sol ? posCase(sol).y : 0, point = new T.Vector3(cx0, y0 + (c ? c.haut * 0.5 : 0.3), cz0);
  /* chaque ulti a son ton (« faut que ça reste en cohérence avec le type de sort », Mathieu, 23/10/2026) : le givre gele sans trembler ; Iop : colonne de lumiere ;
     Cra : fleche de feu puis pluie de fleches enflammees, fleche fatale rouge ; Osamodas : ruee de Bouftous, morsure du Dragoeuf (22b-effets.js) */
  const style = id === 'gel' ? 'gel' : id === 'mono' ? 'fatal' : classe === 'cra' ? 'feu' : '';
  u.attaque = { t: 0, classe, base: u.angle, tour: false, surFrappe: () => effetFrappe(classe, point, () => {
    if (!combat) return;
    if (id === 'mono') { const p = new T.Vector3(c.x, c.m.position.y + c.haut * 0.5, c.z); (classe === 'cra' ? impactFatal : classe === 'osa' ? morsure : coupFatal)(p); blesser(c, st.deg * 5, true); return; }
    const r = id === 'zone' ? 2.8 : 3;
    if (id === 'gel') explosionGel(cx0, y0, cz0, r); else if (classe === 'cra') pluieFlechesFeu(cx0, y0, cz0, r); else if (classe === 'osa') rueeTroupeau(cx0, y0, cz0, r); else explosionZone(cx0, y0, cz0, r, ULTIS[id].teinte);
    combat.monstres.slice().forEach((o) => { if (o.etat !== 'actif' || Math.hypot(o.x - cx0, o.z - cz0) > r) return; if (id === 'gel') { o.lent = 5; blesser(o, st.deg); } else blesser(o, st.deg * 3, true); });
  }, style) };
}
/* la Ruee du troupeau de l'Osamodas : quatre Bouftous chargent a travers la zone, depuis l'Osamodas, dans un nuage de poussiere, puis disparaissent (pour l'oeil seulement) */
const modeleBouftouInvoque = () => copieGabarit('bouftouInvoque', () => { const g = fusionnerBouftou(creerBouftou(T, maille)); ombrePieds(g, 2.4); return g; });
function rueeTroupeau(x, y, z, r) {
  const pp = paysanMesh.position, L = Math.hypot(x - pp.x, z - pp.z) || 1, dx = (x - pp.x) / L, dz = (z - pp.z) / L, cx = -dz, cz = dx; secousse(0.08, 0.8);
  for (let i = 0; i < 4; i++) {
    const m = modeleBouftouInvoque(), lat = (i - 1.5) * r * 0.45, de = { x: x - dx * (r + 1.8) + cx * lat, z: z - dz * (r + 1.8) + cz * lat }, vers = { x: x + dx * (r + 1.2) + cx * lat, z: z + dz * (r + 1.2) + cz * lat }, retard = (i % 2) * 0.08 + i * 0.03;
    m.scale.setScalar(0.001); poser(m, de.x, solA(de.x, de.z), de.z, Math.atan2(dx, dz)); m.traverse((o) => { o.raycast = () => {}; });
    let t = -retard, poudre = 0;
    effets.push((dt) => { t += dt; if (t < 0) return false; const k = Math.min(1, t / 0.75), X = de.x + (vers.x - de.x) * k, Z = de.z + (vers.z - de.z) * k;
      m.position.set(X, solA(X, Z) + Math.abs(Math.sin(t * 18)) * 0.18, Z); m.rotation.x = Math.sin(t * 18) * 0.12; m.scale.setScalar(0.42 * Math.min(1, t / 0.08, (1 - k) / 0.12 + 0.001));
      poudre += dt; if (poudre > 0.09) { poudre = 0; emettre(FX_FUM, 1, { x: X - dx * 0.5, y: solA(X, Z) + 0.2, z: Z - dz * 0.5, v: [-dx * 0.6, fxEntre(0.3, 0.8), -dz * 0.6], vie: [0.4, 0.7], taille: [0.3, 0.9], c: ['#e9dcc0', '#e9dcc0'], a: 0.4, frein: 3, vrot: 1.5, entree: 0.1 }); } /* (peu de poussiere, vite retombee : elle noyait toute la zone une seconde apres le passage) */
      if (k >= 1) { jeter(m); return true; } return false; });
  }
  onde(x, y, z, r + 0.3, '#e9dcc0', 0.6, 0.6, true);
}
/* le Bond du Iop : il saute vers le point vise (jusqu'a PORTEE_BOND cases), retombe et frappe tout autour : 3 fois ses degats sur le monstre le plus
   proche du point d'impact, 1,5 fois sur les autres, et chaque monstre touche lui rend 3 % de sa vie */
const RAYON_BOND = 2.1, PORTEE_BOND = 7;
function bondIop(pt) {
  const st = statsPerso(), pp = paysanMesh.position, u = paysanMesh.userData;
  const q0 = pointSort(pt, PORTEE_BOND); let x = q0.x, z = q0.z; /* (la ou le cercle de visee l'a montre) */
  combat.cdSort = RECHARGE_SORT; son('sort'); chemin = []; arrivee = null; combat.ordre = false; if (Math.hypot(x - pp.x, z - pp.z) > 0.05) u.angle = Math.atan2(x - pp.x, z - pp.z); paysanMesh.rotation.y = u.angle;
  const de = pp.clone(), fin = new T.Vector3(x, 0, z), cible = combat.monstres.filter((o) => o.etat === 'actif' && Math.hypot(o.x - x, o.z - z) < RAYON_BOND).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
  /* l'animation (23/10/2026, « des trucs stylés », Mathieu) : il prend son elan dans la poussiere, fait un salto epee levee en laissant une trainee, et retombe
     en plantant l'epee : la camera tremble, deux ondes de choc, le sol se fend, des mottes de terre volent, des croix vertes montent s'il se soigne.
     Le saut dure toujours 0,3 s et frappe au meme instant qu'avant */
  const a = u.angle, H = 0.55, m = u.membres || [], bras = m[3] || m[2];
  const roue = new T.Group(); roue.rotation.order = 'YXZ'; roue.rotation.y = a; scene.add(roue); /* (la trainee de l'epee qui suit le salto) */
  const lames = [['#ffffff', '#ffe9a8', 1, 1.0, true], ['#ffd27a', '#ff7a1e', 0.6, 1.12, false]].map(([c, b, o, s, plein]) => { const l = new T.Mesh(GEO_RUBAN, matRuban(c, b, o, plein)); l.material.uniforms.uP.value = 1; l.material.uniforms.uQ.value = 0.95; l.rotation.y = Math.PI / 2; l.scale.setScalar(s * 0.95); roue.add(l); return l; });
  /* (le salto est porte par le modele seul, tourne autour du milieu du corps : la position du perso, que lisent les monstres, suit exactement le meme saut qu'avant) */
  const corps = paysanMesh.children.filter((c) => !(c.isMesh && !c.name)).map((c) => ({ c, p: c.position.clone(), q: c.quaternion.clone() })), R = new T.Quaternion(), CENTRE = new T.Vector3(0, H, 0), AXE = new T.Vector3(1, 0, 0);
  const salto = (phi, dy) => { R.setFromAxisAngle(AXE, phi); corps.forEach(({ c, p, q }) => { c.position.copy(p).sub(CENTRE).applyQuaternion(R).add(CENTRE); c.position.y += dy; c.quaternion.copy(R).multiply(q); }); };
  const fant = fantomes(paysanMesh, 3, '#ffd27a', 1.6); /* (des silhouettes dorees suivent le saut, 22b-effets.js) */
  let t = 0, trace = 0; u.charge = true; poussiere(de.x, de.y, de.z, 6, 0.9); onde(de.x, de.y, de.z, 1.4, '#fff3c4', 0.3, 0.7);
  effets.push((dt) => {
    t += dt / 0.3; const k = Math.min(1, t), x0 = de.x + (fin.x - de.x) * k, z0 = de.z + (fin.z - de.z) * k;
    const cel = caseIci(x0, z0); u.y = hauteurSol(x0, z0, cel); const yv = u.y + Math.sin(k * Math.PI) * 1.5, vole = combat && !combat.fin;
    paysanMesh.position.set(x0, u.y + Math.sin(k * Math.PI) * 0.9, z0); /* (le saut que lit le jeu, inchange) */
    const phi = vole ? Math.PI * 2 * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2) : 0; /* le salto, autour du milieu du corps */
    salto(phi, Math.sin(k * Math.PI) * 0.6); /* (pour l'oeil : plus haut, et le salto) */
    if (bras && vole) bras.rotation.x = k < 0.85 ? -2.7 : -2.7 + (k - 0.85) / 0.15 * 2.1; /* l'epee levee, puis abattue */
    roue.position.set(x0, yv + H, z0); roue.rotation.x = phi - 0.9; lames.forEach((l, i) => { l.material.uniforms.uA.value = (i ? 0.55 : 1) * Math.sin(k * Math.PI); });
    trace += dt; if (trace > 0.02) { trace = 0; lueur(new T.Vector3(x0, yv + H, z0), k % 0.1 < 0.05 ? '#ffffff' : '#ffd24a', 1.3, 0.28); }
    fant.maj(dt, Math.sin(k * Math.PI));
    if (t >= 1) {
      jeter(roue); fant.fin(); corps.forEach(({ c, p, q }) => { c.position.copy(p); c.quaternion.copy(q); }); if (!combat || !combat.fin) { if (bras) bras.rotation.x = 0; }
      u.charge = false; if (cel && PASSABLE[cel.type]) u.cellule = cel; flashLumiere(fin.x, u.y + 1, fin.z, '#ffd27a', 3.5, 7, 0.35);
      emettre(FX_VIF, 30, { x: fin.x, y: u.y + 0.2, z: fin.z, r: 0.5, plat: true, dv: 7, haut: true, vie: [0.25, 0.55], taille: [0.1, 0.02], c: ['#ffffff', '#ffd27a', '#ff8a2e'], grav: 9, frein: 1.5, etire: 0.04 });
      secousse(0.22, 0.32); onde(fin.x, u.y, fin.z, RAYON_BOND + 0.4, '#ffffff', 0.3, 0.95); onde(fin.x, u.y, fin.z, RAYON_BOND + 1.1, '#ffc24a', 0.55, 0.75);
      solFendu(fin.x, u.y, fin.z, RAYON_BOND); mottes(fin.x, u.y, fin.z, 12, 1.1); poussiere(fin.x, u.y, fin.z, 14, RAYON_BOND);
      let k = 0; if (combat) combat.monstres.slice().forEach((o) => { if (o.etat === 'actif' && Math.hypot(o.x - fin.x, o.z - fin.z) < RAYON_BOND) { k++; etoileImpact(new T.Vector3(o.x, o.m.position.y + o.haut * 0.5, o.z), o === cible ? 1.1 : 0.8); blesser(o, Math.round(st.deg * (o === cible ? 3 : 1.5)), true); } });
      if (combat && !combat.fin && k) { const h = Math.min(combat.pvMax - combat.pv, Math.round(st.pvMax * SOIN_CHARGE * Math.min(4, k))); if (h > 0) { combat.pv += h; if (combat.st) combat.st.soins += h; chiffre('+' + h, new T.Vector3(fin.x, u.y + 1.7, fin.z), 'soin'); croixSoin(fin.x, u.y, fin.z, Math.min(4, k)); } } /* chaque monstre touche lui rend 3 % de sa vie (4 au plus) */
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
  /* l'animation (23/10/2026) : un eclat a l'arc, un rayon dore qui s'etire derriere la fleche puis s'efface, un eclat sur chaque monstre transperce */
  decocher(de, fin); onde(pp.x, pp.y, pp.z, 1.3, '#ffe08a', 0.3, 0.8);
  const rayon = new T.Group(), geoR = new T.BoxGeometry(1, 1, 1); geoR.translate(0, 0, 0.5); [['#ffd24a', 0.55, 0.16], ['#ffffff', 0.95, 0.06]].forEach(([c, o, l]) => { const m = new T.Mesh(geoR, fxMat(c, o)); m.scale.set(l, l, 1); m.userData.o = o; rayon.add(m); });
  rayon.position.copy(de); rayon.lookAt(fin); scene.add(rayon);
  effets.push((dt) => {
    t += dt / 0.45; fl.position.lerpVectors(de, fin, Math.min(1, t)); rayon.scale.z = Math.max(0.01, de.distanceTo(fl.position)); traineeFleche(fl.position, false);
    if (combat) combat.monstres.slice().forEach((o) => { if (o.etat === 'actif' && !touches.has(o) && Math.hypot(o.x - fl.position.x, o.z - fl.position.z) < LARGEUR_PERCANTE) { touches.add(o); etoileImpact(new T.Vector3(o.x, o.m.position.y + o.haut * 0.5, o.z), 1.0, '#ffc93a'); blesser(o, Math.round(st.deg * 3), true); } });
    if (t >= 1) { jeter(fl); let f = 0; effets.push((d2) => { f += d2 / 0.3; rayon.children.forEach((m) => { m.material.opacity = m.userData.o * Math.max(0, 1 - f); m.scale.x = m.scale.y = m.scale.x * (1 - d2 * 2); }); if (f >= 1) { jeter(rayon); return true; } }); return true; }
  });
}
function invoquer(pt) {
  const pp = paysanMesh.position, st = statsPerso(), u = paysanMesh.userData; if (combat.invoc) { jeter(combat.invoc.m); if (combat.invoc.barre) combat.invoc.barre.remove(); }
  const q0 = pointSort(pt || { x: pp.x + 0.9, z: pp.z + 0.3 }, PORTEE_INVOC), x = q0.x, z = q0.z; /* (la ou le cercle de visee l'a montre) */
  const y = hauteurSol(x, z, caseIci(x, z)); u.angle = Math.atan2(x - pp.x, z - pp.z); paysanMesh.rotation.y = u.angle;
  const m = copieGabarit('bouftouInvoque', () => { const g = fusionnerBouftou(creerBouftou(T, maille)); ombrePieds(g, 2.4); return g; }); m.scale.setScalar(0.45); poser(m, x, y, z, 0); /* (fabrique une fois, copie ensuite) */
  /* « mieux reperer le Bouftou allie, et voir le temps avant qu'il disparaisse » (testeurs, 12/10/2026) : un anneau vert a ses pieds, une barre verte
     au-dessus de lui qui se vide en 12 s ; il reste pose 0,6 s la ou il est tombe avant de foncer sur un monstre */
  const anneauA = new T.Mesh(new T.RingGeometry(1.35, 1.65, 36), new T.MeshBasicMaterial({ color: '#56d27a', transparent: true, opacity: 0.9, side: T.DoubleSide, depthWrite: false })); anneauA.rotation.x = -Math.PI / 2; anneauA.position.y = 0.08; m.add(anneauA);
  const barre = document.createElement('div'); barre.className = 'pv-monstre allie'; barre.innerHTML = '<i></i>'; $('combat-zone').appendChild(barre);
  combat.invoc = { m, x, z, ry: u.angle, vie: DUREE_INVOC, cd: 0.4, pas: 0, frappe: 0, pose: 0.6, barre, chute: CHUTE_INVOC }; pouf(x, y, z, 3.2, '#d9c2ff'); cercleInvocation(x, y, z); /* (il tombe du ciel dans un cercle magique, 22b-effets.js) */
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
  cochon: { nom: 'Bain de boue', teinte: '#8e6640', recharge: 12, portee: 10, zone: 3 },
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
    seisme(x, y, z, S.zone);
    actifs.forEach((o) => { if (Math.hypot(o.x - x, o.z - z) < S.zone) blesser(o, Math.round(st.deg * 2), true); });
  } else if (cle === 'croc') { /* le souffle de feu : un cone vers ou tu vises, les monstres touches brulent */
    const a = Math.atan2(x - pp.x, z - pp.z);
    souffleDeFeu(pp, a, S.portee); /* (« pourquoi c'est des cercles au sol ? Faut que ce soit un souffle de feu, comme s'il crachait du feu de sa bouche », Mathieu : un jet de flammes, 22b-effets.js) */
    actifs.forEach((o) => { const d = Math.hypot(o.x - pp.x, o.z - pp.z); let e = Math.atan2(o.x - pp.x, o.z - pp.z) - a; e = Math.atan2(Math.sin(e), Math.cos(e));
      if (d < S.portee && Math.abs(e) < 0.55) { blesser(o, Math.round(st.deg * 3), true); if (o.etat === 'actif') { o.brule = 3; o.bruleDeg = Math.max(1, Math.round(st.deg * 0.3)); } } });
  } else if (cle === 'wa') { /* la pluie de cawottes : quatre cawottes dans la zone visee */
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.random(), r = k ? 0.6 + Math.random() * 1.0 : 0, X = x + Math.cos(a) * r, Z = z + Math.sin(a) * r; pluieCawotte(X, y, Z, k * 0.06);
      actifs.forEach((o) => { if (o.etat === 'actif' && Math.hypot(o.x - X, o.z - Z) < 1.4) blesser(o, Math.round(st.deg * 2), true); }); }
  } else if (cle === 'koulosse') nuageLeg(x, z); /* la fumee : un nuage la ou tu vises */
  else if (cle === 'cochon') boueLeg(x, z, S.zone, st); /* le bain de boue : une flaque la ou tu vises, les monstres dedans restent colles */
  majCombatHud();
}
function majLegendaire(dt) { /* la recharge des deux sorts legendaires */
  const c = combat; if (!c || c.fin) return;
  const r = dt * (1 + 0.15 * nbBonus('recharge')); c.cdLegC = Math.max(0, (c.cdLegC || 0) - r); c.cdLegA = Math.max(0, (c.cdLegA || 0) - r);
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
const CHUTE_INVOC = 0.22;
function majInvoc(dt) {
  const iv = combat.invoc; if (!iv) return;
  iv.vie -= dt; if (iv.vie <= 0) { pouf(iv.x, iv.m.position.y, iv.z, 2, '#d9c2ff'); jeter(iv.m); if (iv.barre) iv.barre.remove(); combat.invoc = null; return; }
  if (iv.barre) { iv.barre.firstChild.style.width = (100 * iv.vie / DUREE_INVOC).toFixed(0) + '%'; versEcran(VEC_INVOC.set(iv.x, iv.m.position.y + 1.25, iv.z), iv.barre); }
  if (iv.pose > 0) iv.pose -= dt; /* il se pose la ou il est tombe */
  let haut = 0; if (iv.chute > 0) { iv.chute -= dt; haut = Math.pow(Math.max(0, iv.chute) / CHUTE_INVOC, 2) * 4; if (iv.chute <= 0) atterrirBouftou(iv.x, hauteurSol(iv.x, iv.z, caseIci(iv.x, iv.z)), iv.z); } /* (la chute du ciel, en 0,22 s : pour l'oeil seulement) */
  iv.cd -= dt; const c = iv.pose > 0 ? null : plusProcheMonstre(iv); let v = 0;
  if (c) {
    const d = Math.hypot(c.x - iv.x, c.z - iv.z);
    if (d > 1.0) { const w = prochainPas(iv, c.x, c.z, dt), dx = w.x - iv.x, dz = w.z - iv.z, L = Math.hypot(dx, dz) || 1; v = 3; iv.x += dx / L * Math.min(L, v * dt); iv.z += dz / L * Math.min(L, v * dt); tourner(iv, Math.atan2(dx, dz), dt); }
    else { tourner(iv, Math.atan2(c.x - iv.x, c.z - iv.z), dt); if (iv.cd <= 0) { iv.cd = 0.8; iv.frappe = 0.25; blesser(c, degBouftou(statsPerso().niveau)); } }
  }
  iv.pas += v * dt * 6; let elan = 0; if (iv.frappe > 0) { iv.frappe -= dt; elan = Math.sin((1 - Math.max(0, iv.frappe) / 0.25) * Math.PI) * 0.4; }
  iv.m.position.set(iv.x + Math.sin(iv.ry) * elan, hauteurSol(iv.x, iv.z, caseIci(iv.x, iv.z)) + (1 - Math.cos(iv.pas * 2)) * 0.03 + haut, iv.z + Math.cos(iv.ry) * elan);
  iv.m.rotation.y = iv.ry; iv.m.rotation.z = Math.sin(iv.pas) * 0.05; iv.m.scale.setScalar(0.45 * Math.min(1, iv.vie / 0.3));
}
function majBarreBoss(mo) {
  const el = $('boss-barre'); if (!el) return;
  if (mo.etat === 'mort') { el.hidden = true; return; }
  if (el.hidden || el._mo !== mo) { el.hidden = false; el._mo = mo; el._w = el._e = null; $('boss-nom').textContent = mo.d.nom; } /* (un nouveau boss : tout se redessine) */
  const pv = Math.max(0, Math.ceil(mo.pv)), w = (100 * pv / mo.pvMax).toFixed(1) + '%';
  if (el._w !== w) { el._w = w; $('boss-pv').style.width = w; $('boss-pv-txt').textContent = fmt(pv) + ' / ' + fmt(mo.pvMax) + ' PV'; }
  el.classList.toggle('rage', !!mo.enrage); el.classList.toggle('carapace', mo.carapace > 0); el.classList.toggle('protege', mo.protege > 0);
  const etat = mo.carapace > 0 ? 'sous sa carapace' : mo.pierre > 0 ? 'en pierre' : mo.protege > 0 ? 'protégé' + ac(mo.d) + ' à ' + Math.round(100 * mo.protege) + ' %' : mo.enrage ? 'en rage' : ''; /* (« protégée » pour la Gorgouille, et sa peau de pierre, 20/10/2026) */
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
