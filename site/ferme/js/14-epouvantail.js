'use strict';
/* ===================== L'EPOUVANTAIL CHASSEUR =====================
   Niveau 3 : une arbalete sur l'epaule, il tire sur un Tofu qui picore depuis un moment (portee 8 cases, une fleche de la reserve par tir).
   Niveau 4 : il reagit vite et couvre toute l'ile. Niveau 5 : le PEPITO-TRON, le mini terminator du bot de Redemption : armure doree,
   visiere rouge, canon laser, pepites en orbite ; il couvre toute la ferme, abat aussi les Tofus des vagues, et facture 15 kamas par tir.
   Il ne s'occupe que des Tofus. */
const DEG_PEPITO_VSA = 90; /* le niveau 6 : son laser sur les voleurs de VSA (14/10/2026) */
const pepitoTire = (k) => !(S_ && S_.pepito && S_.pepito[k] === false); /* les reglages du Pepito-Tron : 'champs' (les Tofus qui picorent), 'sauvage' (le Tofu sauvage) */
const EPOU = [null, null, null, { portee: 8 * S, delai: 3 * SEC, cadence: 3.5, deg: 40 }, { portee: 99, delai: 1 * SEC, cadence: 2.2, deg: 60 }, /* (« l'epouvantail tape pas les Tofus » : portee 8 en unites du jeu, soit 4 cases, pour « 8 cases » promises ; le niveau 4 couvre toute l'ile, comme annonce) */ { portee: 99, delai: 0.45 * SEC, cadence: 1.0, deg: 150 }];
const PRIX_LASER = 15;
const PEPITO_TRON = ['PÉPITO-TRON en ligne. Les Tofus ont été prévenus. Ils n\'ont pas aimé.', 'chaque tir de laser : 15 kamas. la sécurité, ça se paie. en pépites.', 'un Tofu abattu, c\'est une récolte sauvée. ma marge : 100 %.', 'mode terminator activé. je reviendrai... pour la facture.', 'j\'ai scanné ta ferme : 0 Tofu, 100 % de pépites. de rien.'];
let epou = null; /* { g: arme et armure posees sur l'epouvantail, tete, canon, pepites, cd, base } */
const epouvantailMesh = () => batisMesh.find((m) => { const c = S_.cases.find((x) => x.id === m.userData.cellule); return c && c.type === 'epouvantail'; });
function equiperEpouvantail() {
  if (epou) { scene.remove(epou.g); if (epou.remplace) epou.remplace.visible = !enRuine('epouvantail'); if (epou.corps) epou.corps.rotation.y = epou.ry0; epou = null; } delete ancres.epouvantail;
  const n = niv('epouvantail'), m = epouvantailMesh(); if (!m || n < 3) return;
  const b = new T.Box3().setFromObject(m), H = b.max.y - b.min.y, g = new T.Group(); g.position.set(m.position.x, m.position.y, m.position.z); scene.add(g);
  const tete = new T.Group(); tete.position.y = H * 0.62; g.add(tete); /* la tourelle qui vise, a hauteur d'epaule */
  let canon;
  if (n >= 5) { /* le PEPITO-TRON : un vrai petit robot a la place de l'epouvantail (il garde son chapeau de paille) */
    const or = '#e8b84a', acier = '#9aa6ad', fonce = '#3d434a', rouge = new T.MeshBasicMaterial({ color: '#ff2a2a' });
    tete.position.y = 0; /* tout le haut du corps pivote vers la cible */
    const socle = cyl(0.42, 0.48, 0.1, or, 16); socle.position.y = 0.05; g.add(socle);
    [-1, 1].forEach((sg) => { /* deux jambes d'acier */
      const cuisse = cyl(0.09, 0.08, 0.45, acier, 10); cuisse.position.set(sg * 0.16, 0.78, 0); g.add(cuisse);
      const genou = sphere(0.1, or, 1); genou.position.set(sg * 0.16, 0.55, 0.02); g.add(genou);
      const tibia = cyl(0.08, 0.09, 0.42, acier, 10); tibia.position.set(sg * 0.16, 0.33, 0); g.add(tibia);
      const pied = boite(0.18, 0.1, 0.3, fonce); pied.position.set(sg * 0.16, 0.12, 0.05); g.add(pied);
    });
    const bassin = boite(0.46, 0.16, 0.3, fonce); bassin.position.y = 1.02; g.add(bassin);
    const torse = sphere(0.36, acier, 2); torse.scale.set(1, 1.05, 0.8); torse.position.y = 1.42; tete.add(torse);
    const plastron = boite(0.42, 0.34, 0.08, or); plastron.position.set(0, 1.45, 0.26); tete.add(plastron);
    const coeurR = new T.Mesh(new T.CircleGeometry(0.09, 20), rouge); coeurR.position.set(0, 1.47, 0.305); tete.add(coeurR); /* le coeur du reacteur */
    const P = cyl(0.06, 0.06, 0.03, '#fff3c4', 12); P.rotation.x = Math.PI / 2; P.position.set(0, 1.3, 0.3); tete.add(P);
    const cou = cyl(0.08, 0.1, 0.12, fonce, 10); cou.position.y = 1.82; tete.add(cou);
    const crane = sphere(0.24, acier, 2); crane.scale.set(1.05, 0.9, 1); crane.position.y = 2.0; tete.add(crane);
    const visiere = new T.Mesh(new T.BoxGeometry(0.42, 0.08, 0.1), rouge.clone()); visiere.position.set(0, 2.02, 0.19); tete.add(visiere);
    const bord = cyl(0.42, 0.44, 0.04, '#d9b24a', 20); bord.position.y = 2.17; bord.rotation.z = 0.12; tete.add(bord); /* le chapeau de paille de l'epouvantail */
    const calotte = cone(0.24, 0.32, '#e8c35a', 14); calotte.position.set(0.02, 2.34, 0); calotte.rotation.z = 0.12; tete.add(calotte);
    const ruban = cyl(0.2, 0.22, 0.05, '#c83a22', 14); ruban.position.set(0.01, 2.22, 0); ruban.rotation.z = 0.12; tete.add(ruban);
    const antenne = cyl(0.015, 0.015, 0.32, fonce, 6); antenne.position.set(-0.16, 2.3, -0.05); tete.add(antenne);
    const voyant = new T.Mesh(new T.SphereGeometry(0.05, 10, 8), new T.MeshBasicMaterial({ color: '#ff4040' })); voyant.position.set(-0.16, 2.48, -0.05); tete.add(voyant);
    [-1, 1].forEach((sg) => { const ep = sphere(0.15, or, 1); ep.position.set(sg * 0.42, 1.62, 0); tete.add(ep); });
    /* bras gauche : un sac de pepites */
    const brasG = cyl(0.06, 0.06, 0.45, acier, 8); brasG.position.set(-0.48, 1.36, 0.06); brasG.rotation.z = -0.25; tete.add(brasG);
    const sac = sphere(0.18, '#a8743f', 1); sac.scale.set(1, 1.1, 1); sac.position.set(-0.56, 1.05, 0.12); tete.add(sac);
    [[-0.5, 1.22, 0.2], [-0.62, 1.2, 0.16], [-0.56, 1.25, 0.08]].forEach(([x, y, z]) => { const pp = maille(new T.DodecahedronGeometry(0.06, 0), or); pp.position.set(x, y, z); tete.add(pp); });
    /* bras droit : le canon laser, pointe vers l'avant */
    canon = new T.Group(); canon.position.set(0.5, 1.45, 0.05); tete.add(canon);
    const tube = cyl(0.08, 0.1, 0.7, fonce, 12); tube.rotation.x = Math.PI / 2; tube.position.z = 0.25; canon.add(tube);
    [0.02, 0.28, 0.48].forEach((z) => { const a = cyl(0.11, 0.11, 0.05, or, 14); a.rotation.x = Math.PI / 2; a.position.z = z; canon.add(a); });
    const bout = new T.Mesh(new T.SphereGeometry(0.07, 10, 8), rouge.clone()); bout.position.z = 0.62; canon.add(bout); canon.userData.bout = bout;
    const pepites = new T.Group(); pepites.position.y = 1.5; g.add(pepites);
    for (let k = 0; k < 5; k++) { const pp = maille(new T.DodecahedronGeometry(0.08, 0), or); const a = k / 5 * Math.PI * 2; pp.position.set(Math.cos(a) * 0.75, Math.sin(a * 2) * 0.12, Math.sin(a) * 0.75); pepites.add(pp); }
    g.scale.setScalar(H / 2.6); /* a la taille de l'epouvantail qu'il remplace */
    epou = { g, tete, canon, pepites, voyant, visiere, coeur: coeurR, cd: 1, n, remplace: m }; ancres.epouvantail = new T.Vector3(m.position.x, m.position.y + H + 0.35, m.position.z);
  } else { /* niveaux 3 et 4 : il tient l'arbalete contre sa poitrine et pivote tout entier sur son piquet vers sa cible
       (11/10/2026, « l'animation de l'arbalete n'est pas tres clean » : avant, l'arbalete et son socle tournaient autour de lui en le traversant) */
    const a = modeleArbalete(), arme = a.userData.tete; a.remove(arme); arme.position.set(0, -0.08, 0.5); arme.scale.setScalar(n >= 4 ? 1.05 : 0.92); tete.add(arme);
    const ry0 = m.rotation.y; tete.rotation.y = ry0;
    canon = arme; canon.userData.bout = a.userData.pointe; epou = { g, tete, canon, cd: 1, n, corps: m, ry0 };
  }
  epou.g.visible = !enRuine('epouvantail');
}
/* chaque image : il guette, pivote vers sa cible, tire */
function majEpouvantail(dt, s) { if (lieu === 'arene' || lieu === 'ile') return; /* (Pepito reste a la ferme) */
  if (!epou || !S_) return;
  const n = niv('epouvantail'), E = EPOU[Math.min(5, n)], pos = epou.g.position; epou.g.visible = !enRuine('epouvantail'); /* (le niveau 6 garde les reglages du 5, plus les voleurs) */
  if (epou.remplace) epou.remplace.visible = false;
  if (epou.pepites) { epou.pepites.rotation.y += dt * 1.6; epou.coeur.material.color.setHSL(0, 1, 0.5 + Math.sin(s * 5) * 0.12); epou.voyant.visible = Math.sin(s * 6) > -0.3; epou.visiere.material.color.setHSL(0, 1, 0.5 + Math.sin(s * 4) * 0.08); }
  if (!E || enRuine('epouvantail')) return;
  epou.cd = Math.max(0, epou.cd - dt);
  /* la cible : pendant une vague, le Pepito-Tron tire sur les grignoteurs, ou qu'ils soient (les Tofus, et les petits Wabbits qui foncent vers tes champs),
     jamais sur les autres monstres (« il faut qu'il tire que sur les tofus, pas les monstres, juste il tapait pas ceux sur le terrain, que ceux dans les champs »,
     Mathieu, 14/10/2026) ; hors vague, un Tofu (ou un Wabbit) qui picore un champ depuis assez longtemps */
  let cible = null, x = 0, z = 0, y = 0;
  if (combat && n >= 5) { const t = combat.monstres.filter((o) => o.etat === 'actif' && o.m && (o.d.grignote || (n >= 6 && o.d.vole))).sort((a, b) => (a.d.vole ? 0 : 1) - (b.d.vole ? 0 : 1) || Math.hypot(a.x - pos.x, a.z - pos.z) - Math.hypot(b.x - pos.x, b.z - pos.z))[0]; if (t) { cible = { mo: t, vsa: !!t.d.vole }; x = t.x; z = t.z; y = t.m.position.y + (t.d.vole ? 1.0 : 0.4); } } /* (niveau 6 : les voleurs des raids d'abord) */
  if (!cible && !combat && n >= 5 && S_.sauvage && pepitoTire('sauvage')) { /* le Tofu sauvage pose dans l'herbe (« pepito tire pas sur le tofu », Mathieu, 14/10/2026), a vue, sauf si on le lui interdit (reglage) */
    const c = S_.cases.find((x) => x.id === S_.sauvage.id); if (c) { const q = posCase(c); cible = { sauvage: true }; x = q.x; z = q.z; y = q.y + 0.6; } }
  if (!cible && !combat && n >= 6 && voleurCiblable()) { const q = voleur.m.position; cible = { voleur: true }; x = q.x; z = q.z; y = q.y + 1.0; } /* niveau 6 : le voleur de VSA qui file a ta grange */
  if (!cible && !combat && (n < 5 || pepitoTire('champs'))) { const now = Date.now(); const p = S_.cases.filter((c) => c.type === 'champ' && c.tofu && now - c.tofu >= E.delai).map((c) => [c, posCase(c)]).filter(([, q]) => Math.hypot(q.x - pos.x, q.z - pos.z) <= E.portee).sort((a, b) => a[0].tofu - b[0].tofu)[0]; if (p) { cible = { champ: p[0] }; x = p[1].x; z = p[1].z; y = p[1].y + 0.7; } }
  let ang = (epou.ry0 || 0) + Math.sin(s * (n >= 5 ? 1.3 : 0.5)) * (n >= 5 ? 2.2 : 0.8); if (cible) ang = Math.atan2(x - pos.x, z - pos.z); /* il scanne, puis se fige sur sa cible */
  let d = ang - epou.tete.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); epou.tete.rotation.y += d * Math.min(1, dt * (cible ? 8 : 1.5));
  if (epou.corps) epou.corps.rotation.y = epou.tete.rotation.y; /* l'epouvantail entier pivote sur son piquet */
  if (!cible || epou.cd > 0 || Math.abs(d) > 0.2) return;
  if (n >= 5) { if (S_.kamas < PRIX_LASER) { if (!majEpouvantail.fauche) { majEpouvantail.fauche = true; toast('PÉPITO-TRON : fonds insuffisants. Pas de pépites, pas de laser.', 'alerte'); } return; } S_.kamas -= PRIX_LASER; majEpouvantail.fauche = false; rendreHaut(); }
  else { if (S_.fleches <= 0) { if (!majEpouvantail.vide) { majEpouvantail.vide = true; toast('L\'épouvantail n\'a plus de flèches : achète-en à l\'HDV.', 'alerte'); } return; } S_.fleches--; majEpouvantail.vide = false; }
  epou.cd = E.cadence;
  const de = new T.Vector3(); (epou.canon.userData.bout || epou.canon).getWorldPosition(de); const vers = new T.Vector3(x, y, z);
  const touche = () => {
    if (cible.sauvage) { if (!S_.sauvage) return; compter('tofusChasses'); S_.sauvage = null; rendreSauvage(); gagnerXp(1); toast('PÉPITO-TRON : Tofu sauvage neutralisé. Facture : ' + PRIX_LASER + ' kamas.', 'or'); sauver(); return; }
    if (cible.voleur) { blesserVoleur(DEG_PEPITO_VSA, 'PÉPITO-TRON : voleur de VSA neutralisé. Facture : ' + PRIX_LASER + ' kamas.', 0.5); return; }
    if (cible.mo) { if (combat && cible.mo.etat === 'actif') blesser(cible.mo, cible.vsa ? DEG_PEPITO_VSA : E.deg, true, 'def'); return; }
    const p = cible.champ; if (!p.tofu) return; const nuisible = p.nuisible; p.tofu = 0; p.nuisible = null; p.tofuParti = Date.now(); rendreCase(p.id); gagnerXp(1); p.nuisible = nuisible; /* (le nom du toast, puis on l'oublie) */
    const bete = p.nuisible === 'wabbit' ? 'Wabbit' : 'Tofu'; p.nuisible = null; toast(n >= 5 ? 'PÉPITO-TRON : ' + bete + ' neutralisé sur ton ' + PAR_ID[p.c].nom + '. Facture : ' + PRIX_LASER + ' kamas.' : 'L\'épouvantail a chassé un ' + bete + ' de ton ' + PAR_ID[p.c].nom + ' !', 'or'); sauver();
  };
  if (n >= 5) { /* le laser : un trait rouge instantane qui s'eteint */
    const L = de.distanceTo(vers), rayon = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, L, 6, 1, true), new T.MeshBasicMaterial({ color: '#ff2a2a', transparent: true, opacity: 0.95, depthWrite: false }));
    const coeur = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, L, 6, 1, true), new T.MeshBasicMaterial({ color: '#fff0f0', transparent: true, depthWrite: false })); rayon.add(coeur);
    rayon.position.copy(de).lerp(vers, 0.5); rayon.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), vers.clone().sub(de).normalize()); scene.add(rayon);
    pouf(x, y - 0.6, z, 2, '#ff3a3a'); pouf(x, y - 0.6, z, 1.2, '#f2b630'); touche();
    let t = 0; effets.push((dt2) => { t += dt2 / 0.25; rayon.material.opacity = 0.95 * (1 - t); coeur.material.opacity = 1 - t; rayon.scale.x = rayon.scale.z = 1 + t; if (t >= 1) { scene.remove(rayon); return true; } });
    return;
  }
  const fl = boite(0.035, 0.035, 0.5, '#d9c08a'); scene.add(fl); fl.position.copy(de); fl.lookAt(vers); let t = 0;
  effets.push((dt2) => { t += dt2 / 0.32; fl.position.lerpVectors(de, vers, Math.min(1, t)); fl.position.y += Math.sin(Math.min(1, t) * Math.PI) * 0.4; if (t >= 1) { scene.remove(fl); touche(); return true; } });
}

