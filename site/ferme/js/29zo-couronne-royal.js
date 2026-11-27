'use strict';
/* LA COURONNE DU BOUFTOU ROYAL, UN SORT PAR CLASSE (27/11/2026, « la coiffe bouftou royal on la refait en fonction des classes ? », Mathieu) :
   - Iop, Charge rapide : il fonce en ligne droite vers ou tu vises (5 cases) et passe a travers les monstres ; chacun sur sa route prend 2 fois ses degats et
     reste sonne 0,5 s (« tu charges, tous les monstres sur ta route sont touches, tu passes a travers, et eux prennent des degats et un petit stun de 0,5 s ») ;
   - Cra, Dash : un long bond en ligne droite (7 cases), intouchable pendant le dash (« permet d'esquiver des sorts ») ; a la sortie, 4 s a +10 % de vitesse
     de deplacement et +30 d'Agilite ;
   - Osamodas, Bouftou Royal : sans viser (« il lance son sort en instantane, pas de chargement »), son Bouftou devient un Bouftou Royal 6 s : +30 % de degats,
     +20 % de vitesse de deplacement, et il charge un monstre en arrivant.
   Avant, la meme Charge pour les trois (chargeRoyale, 22-sorts.js : 2 fois tes degats, bouscule et sonne 1 s). La laine des Bouftous (+25 %) reste pour les trois.
   Les cristaux (29zn-cristaux-barres.js) montent les durees et les bonus (mxc), les degats par la source du sort. */
const COURONNE = {
  iop: { portee: 10, vit: 40, mult: 2, sonne: 0.5 }, /* (vit : 40 de vitesse de charge, 26 pour l'ancienne Charge) */
  cra: { portee: 14, duree: 0.3, buff: 4, vit: 0.10, agi: 30, grace: 0.12 }, /* (duree : le dash entier, 7 cases en 0,3 s ; grace : encore intouchable un instant a l'arrivee) */
  osa: { duree: 6, deg: 0.30, vit: 0.20, charge: 12, mult: 2, sonne: 1, sonneBoss: 0.5, taille: 1.7 } /* (charge : jusqu'a 6 cases du Bouftou ; taille : le Royal 1,7 fois plus haut que le Bouftou) */
};
SORTS_LEG.royal.parClasse = {
  iop: { nom: 'Charge rapide', recharge: 12, portee: COURONNE.iop.portee, ligne: true, largeur: 1.0 },
  cra: { nom: 'Dash', teinte: '#8fd8ff', recharge: 12, portee: COURONNE.cra.portee, ligne: true, largeur: 0.8 },
  osa: { nom: 'Bouftou Royal', recharge: 15, portee: COURONNE.osa.charge, instant: true, ligne: false }
};
/* le texte de la Couronne suit la classe du perso (comme le Heaume de Crocabulia, 03-equipements.js) */
{ const L = LEGENDAIRES.find((l) => l.cle === 'royal'), laine = ' Et tes Bouftous donnent 25 % de laine en plus.';
  L.pouvoirs = {
    epee: 'Sort Charge rapide (touche 3) : tu fonces en ligne droite vers où tu vises (jusqu\'à 5 cases) et tu passes à travers les monstres : chacun sur ta route prend 2 fois tes dégâts et reste sonné 0,5 s. Recharge 12 s.' + laine,
    arc: 'Sort Dash (touche 3) : tu bondis loin en ligne droite vers où tu vises (jusqu\'à 7 cases), intouchable pendant le dash : tu esquives les coups et les sorts. À la sortie, pendant 4 s, tu cours 10 % plus vite et tu as 30 d\'Agilité en plus. Recharge 12 s.' + laine,
    fouet: 'Sort Bouftou Royal (touche 3) : sans viser, ton Bouftou invoqué devient un Bouftou Royal pendant 6 s : il frappe 30 % plus fort, court 20 % plus vite et charge un monstre en arrivant (2 fois son coup, sonné 1 s, 0,5 s pour un boss). Recharge 15 s.' + laine };
  Object.defineProperty(OBJETS['leg-royal'], 'pouvoir', { get: () => (typeof S_ !== 'undefined' && S_ && S_.perso && L.pouvoirs[ARMES[classeDe()][0]]) || L.pouvoir, enumerable: true, configurable: true }); }
/* la fiche des cristaux : les effets du sort, classe par classe */
{ const laine = cxE('Laine des Bouftous', 25, ' %', '+');
  EFFETS_LEG.royal = { iop: [cxDg(COURONNE.iop.mult), cxSec('Sonné', COURONNE.iop.sonne), laine],
    cra: [cxSec('Durée du bonus', COURONNE.cra.buff), cxE('Vitesse', COURONNE.cra.vit * 100, ' %', '+'), cxE('Agilité', COURONNE.cra.agi, '', '+'), laine],
    osa: [cxSec('Durée', COURONNE.osa.duree), cxE('Dégâts du Bouftou', COURONNE.osa.deg * 100, ' %', '+'), cxE('Vitesse du Bouftou', COURONNE.osa.vit * 100, ' %', '+'), cxDg(COURONNE.osa.mult, 'Charge du Bouftou'), cxSec('Sonné', COURONNE.osa.sonne), laine] }; }

/* le sort part ici (executerLeg appelle chargeRoyale pour la Couronne) : un par classe */
chargeRoyale = function (pt, st) { const cl = classeDe(); if (cl === 'cra') return dashCra(pt, st); if (cl === 'osa') return bouftouRoyalOsa(); return chargeRapideIop(pt, st); };
/* sans Bouftou, le sort ne part pas (et sa recharge ne court pas) */
{ const B = BOUTONS_SORT.coiffe, refus0 = B.refus; B.refus = () => (refus0 && refus0()) || (legDe('coiffe') === 'royal' && classeDe() === 'osa' && !(combat && combat.invoc) ? 'Invoque d\'abord ton Bouftou : la Couronne en fait un Bouftou Royal.' : ''); }

/* LA CHARGE RAPIDE (Iop) : l'ancienne Charge, plus vive (vit), a travers les monstres, qui restent sur place (plus de bousculade), sonnes 0,5 s, boss compris */
function chargeRapideIop(pt, st) {
  const C = COURONNE.iop, M = mxc(), pp = paysanMesh.position, u = paysanMesh.userData, de = pp.clone(), c0 = combat, a = Math.hypot(pt.x - pp.x, pt.z - pp.z) > 0.05 ? Math.atan2(pt.x - pp.x, pt.z - pp.z) : paysanMesh.rotation.y, dx = Math.sin(a), dz = Math.cos(a);
  let L = 0; while (L < C.portee && solSort(de.x + dx * (L + 0.25), de.z + dz * (L + 0.25))) L += 0.25; /* (jusqu'au premier obstacle) */
  const fin = { x: de.x + dx * L, z: de.z + dz * L }, duree = Math.max(0.1, L / C.vit), touches = new Set(), dir = new T.Vector3(dx, 0, dz);
  chemin = []; arrivee = null; c0.ordre = false; u.angle = a; paysanMesh.rotation.y = a; u.charge = true;
  const fant = fantomes(paysanMesh, 5, '#ffd36a', 1.4); secousse(0.08, 0.18); poussiere(de.x, de.y, de.z, 8, 0.8, '#d8c6a0'); onde(de.x, de.y, de.z, 1.3, '#fff1c0', 0.3, 0.6);
  let t = 0, poudre = 0, choc = 0;
  effets.push((dt) => { t += dt; if (combat !== c0) { fant.fin(); u.charge = false; return true; }
    const k = Math.min(1, t / duree), x = de.x + (fin.x - de.x) * k, z = de.z + (fin.z - de.z) * k, cel = caseIci(x, z);
    u.y = hauteurSol(x, z, cel); paysanMesh.position.set(x, u.y, z); paysanMesh.rotation.y = a; fant.maj(dt, 1 - 0.5 * k);
    if ((poudre += dt) > 0.02) { poudre = 0; emettre(FX_FUM, 1, { x: x - dx * 0.5, y: u.y + 0.2, z: z - dz * 0.5, v: [-dx * 1.5, fxEntre(0.4, 0.9), -dz * 1.5], vie: [0.35, 0.6], taille: [0.4, 1.0], c: ['#e6d6b2', '#cdb98f'], a: 0.5, frein: 2.5 }); }
    if ((choc += dt) > 0.05) { choc = 0; anneauChoc(new T.Vector3(x + dx * 0.8, u.y + 0.8, z + dz * 0.8), dir, 0.3, 1.0, 0.2, '#ffe6a0'); } /* (l'air qui claque devant lui) */
    if (!c0.fin) c0.monstres.slice().forEach((o) => { if (o.etat !== 'actif' || touches.has(o) || Math.hypot(o.x - x, o.z - z) > 1.0 + 0.3 * (o.d.ombre || 1)) return; touches.add(o);
      etoileImpact(new T.Vector3(o.x, o.m.position.y + o.haut * 0.5, o.z), 1.0, '#f6d27a'); secousse(0.08, 0.1); blesser(o, Math.round(st.deg * C.mult), true); if (o.etat !== 'actif') return;
      o.bloqueT = Math.max(o.bloqueT || 0, C.sonne * M); });
    if (k < 1) return false;
    fant.fin(); u.charge = false; if (cel && praticable(cel)) u.cellule = cel;
    secousse(0.12, 0.2); onde(fin.x, u.y, fin.z, 1.6, '#ffffff', 0.3, 0.8); onde(fin.x, u.y, fin.z, 2.2, '#f0c96a', 0.45, 0.6); poussiere(fin.x, u.y, fin.z, 10, 1.2, '#d8c6a0'); return true; });
}

/* LE DASH (Cra) : il file en ligne droite vers ou il vise (7 cases, jusqu'au premier obstacle), en rase-motte, dans une trainee bleu clair ; intouchable (enVol,
   comme en l'air pendant un bond : blesserPerso n'y fait rien) du depart a un instant apres l'arrivee ; a la sortie, son bonus : vitesse et Agilite pendant 4 s */
function dashCra(pt, st) {
  const C = COURONNE.cra, M = mxc(), pp = paysanMesh.position, u = paysanMesh.userData, de = pp.clone(), c0 = combat, a = Math.hypot(pt.x - pp.x, pt.z - pp.z) > 0.05 ? Math.atan2(pt.x - pp.x, pt.z - pp.z) : paysanMesh.rotation.y, dx = Math.sin(a), dz = Math.cos(a);
  let L = 0; while (L < C.portee && solSort(de.x + dx * (L + 0.25), de.z + dz * (L + 0.25))) L += 0.25;
  const fin = { x: de.x + dx * L, z: de.z + dz * L }, duree = Math.max(0.1, C.duree * L / C.portee), dir = new T.Vector3(dx, 0, dz);
  chemin = []; arrivee = null; c0.ordre = false; u.angle = a; paysanMesh.rotation.y = a; u.charge = true; u.enVol = true;
  const fant = fantomes(paysanMesh, 6, '#9fdcff', 1.2); onde(de.x, de.y + 0.05, de.z, 1.2, '#cfeeff', 0.3, 0.7); emettre(FX_VIF, 14, { x: de.x, y: de.y + 0.4, z: de.z, r: 0.4, dv: 2.4, haut: true, vie: [0.3, 0.5], taille: [0.12, 0.03], c: ['#ffffff', '#9fdcff', '#4aa8e0'], grav: 3 });
  let t = 0, trace = 0, fini = false;
  const lacher = () => { u.charge = false; u.enVol = false; };
  effets.push((dt) => { t += dt; if (combat !== c0) { if (!fini) fant.fin(); lacher(); return true; }
    if (!fini) { const k = Math.min(1, t / duree), e = 1 - (1 - k) * (1 - k), x = de.x + (fin.x - de.x) * e, z = de.z + (fin.z - de.z) * e, cel = caseIci(x, z); /* (il part vite et se freine en arrivant) */
      u.y = hauteurSol(x, z, cel); paysanMesh.position.set(x, u.y + Math.sin(k * Math.PI) * 0.35, z); paysanMesh.rotation.y = a; fant.maj(dt, 1 - 0.6 * k);
      if ((trace += dt) > 0.016) { trace = 0; emettre(FX_LUM, 2, { x: x - dx * 0.3, y: u.y + 0.7, z: z - dz * 0.3, r: 0.25, v: [-dx * 2, 0.2, -dz * 2], vie: [0.18, 0.3], taille: [0.5, 0.06], c: ['#ffffff', '#9fdcff'], a: 0.7 }); }
      if (k < 1) return false;
      fini = true; t = 0; fant.fin(); paysanMesh.position.y = u.y; if (cel && praticable(cel)) u.cellule = cel;
      c0.dashCra = C.buff * M; c0.dashCraV = C.vit * M; c0.dashCraA = Math.round(C.agi * M); /* (le bonus de la sortie, majCombat le fait courir) */
      onde(x, u.y + 0.05, z, 1.4, '#9fdcff', 0.3, 0.7); poussiere(x, u.y, z, 6, 0.8, '#d8e6f0'); flechesBonus(x, u.y + 1.2, z, '#4aa8e0');
      chiffre('Vitesse +' + Math.round(c0.dashCraV * 100) + ' %, Agilité +' + c0.dashCraA, new T.Vector3(x, u.y + 2.2, z), 'soin'); return false; }
    if (t < C.grace) return false; lacher(); return true; });
}
/* le bonus du Dash : l'Agilite ici, la vitesse dans vitesse() (24-deplacement.js), le temps qui court et la lueur aux pieds dans majCombat */
{ const caracsCR = caracs; caracs = function () { const t = caracsCR.apply(this, arguments); try { if (combat && combat.dashCra > 0) t.agilite += combat.dashCraA || 0; } catch (e) { /* (avant la declaration de combat) */ } return t; }; }
{ const majCombatCR = majCombat; majCombat = function (dt) { const c = combat;
    if (c && !c.fin && c.dashCra > 0) { c.dashCra -= dt || 0; const p = paysanMesh.position;
      if (Math.random() < (dt || 0) * 14) emettre(FX_VIF, 1, { x: p.x + (Math.random() - 0.5) * 0.7, y: p.y + 0.1, z: p.z + (Math.random() - 0.5) * 0.7, r: 0.04, v: [0, 1.3, 0], dv: 0.2, vie: [0.35, 0.6], taille: [0.1, 0.02], c: ['#ffffff', '#9fdcff'] }); /* (des eclats bleu clair qui montent de ses pieds tant que ca dure) */
      if (c.dashCra <= 0) { c.dashCra = 0; c.dashCraV = 0; c.dashCraA = 0; } }
    return majCombatCR.apply(this, arguments); }; }

/* LE BOUFTOU ROYAL (Osamodas) : un coup de fouet vers son Bouftou, qui grossit en Bouftou Royal (le modele du boss, a 1,7 fois sa taille) dans une gerbe doree ;
   6 s plus fort et plus vif (iv.royalD, iv.royalV : majInvoc, 22-sorts.js) ; il charge le monstre que tu vises, sinon le plus proche de lui (6 cases) :
   tete baissee, il renverse tout sur son passage (2 fois son coup, sonne 1 s, 0,5 s un boss). A la fin, il redevient un Bouftou dans un pouf */
function bouftouRoyalOsa() {
  const c0 = combat, iv = c0 && c0.invoc, C = COURONNE.osa, M = mxc(); if (!iv) { if (c0) c0.cdLegC = 0; return; } /* (le bot de test : rien sans Bouftou, sans recharge) */
  const pp = paysanMesh.position, u = paysanMesh.userData, a = Math.atan2(iv.x - pp.x, iv.z - pp.z); u.angle = a; paysanMesh.rotation.y = a; chemin = []; arrivee = null; c0.ordre = false;
  u.attaque = { t: 0.08, classe: 'osa', base: a, tour: false, surFrappe: () => { if (combat === c0) coupDeFouet(mainDe(paysanMesh), new T.Vector3(iv.x, iv.m.position.y + 0.5, iv.z), paysanMesh, ''); } };
  iv.royal = C.duree * M; iv.royal0 = iv.royal; iv.royalD = 1 + C.deg * M; iv.royalV = 1 + C.vit * M; iv.royalM = M; iv.royalAttend = 0.35; iv.vie = Math.max(iv.vie, iv.royal + 0.4); /* (il ne disparait pas en plein Royal) */
  mettreRoyal(iv); const y = iv.m.position.y;
  son('royal'); secousse(0.08, 0.2); flashLumiere(iv.x, y + 1, iv.z, '#ffd36a', 3, 6, 0.4); onde(iv.x, y + 0.05, iv.z, 2.0, '#f0c96a', 0.45, 0.85); onde(iv.x, y + 0.05, iv.z, 1.2, '#ffffff', 0.3, 0.6);
  emettre(FX_LUM, 26, { x: iv.x, y: y + 0.6, z: iv.z, r: 0.6, dv: 3.2, haut: true, vie: [0.4, 0.8], taille: [0.16, 0.03], c: ['#fff6c8', '#ffd36a', '#e8a838'], a: 1, grav: 4, etire: 0.03 });
  flechesBonus(iv.x, y + 1.4, iv.z, '#e8b84a'); chiffre('Bouftou Royal !', new T.Vector3(iv.x, y + 2.4, iv.z), 'gros');
}
/* le modele : le Bouftou Royal des vagues pose dans le Bouftou invoque (ses morceaux caches, sauf son anneau vert et son ombre), qui le suit et le porte */
const platRoyal = (o) => !!(o.geometry && /Ring|Circle|Plane/.test(o.geometry.type));
function mettreRoyal(iv) {
  if (iv.royalM3 || !MODELES.royal) return;
  const r = cloner('royal'); r.traverse((o) => { o.raycast = () => {}; }); r.updateMatrixWorld(true);
  const s = iv.m.scale.y || 1, hB = new T.Box3().setFromObject(iv.m).getSize(new T.Vector3()).y / s, hR = new T.Box3().setFromObject(r).getSize(new T.Vector3()).y || 1;
  iv.royalK = r.scale.x * COURONNE.osa.taille * Math.max(0.3, hB) / hR; r.scale.setScalar(iv.royalK * 0.3); r.position.set(0, 0, 0); r.rotation.set(0, 0, 0);
  iv.royalCaches = iv.m.children.filter((o) => !platRoyal(o)); iv.royalCaches.forEach((o) => { o.visible = false; }); iv.m.add(r); iv.royalM3 = r; iv.royalT = 0;
}
function oterRoyal(iv) {
  const r = iv.royalM3; if (!r) return; iv.royalM3 = null; jeter(r); (iv.royalCaches || []).forEach((o) => { o.visible = true; }); iv.royalCaches = null;
  const y = iv.m.position.y; pouf(iv.x, y, iv.z, 2.2, '#f0c96a'); emettre(FX_VIF, 14, { x: iv.x, y: y + 0.5, z: iv.z, r: 0.4, dv: 2.4, vie: [0.3, 0.55], taille: [0.13, 0.03], c: ['#fff6c8', '#ffd36a'], grav: 5 });
}
/* sa charge : vers le monstre vise par le perso s'il est a 6 cases du Bouftou, sinon le plus proche de lui ; il s'arrete juste devant (ou au premier obstacle) */
function chargeBouftouRoyal(iv) {
  const c0 = combat, C = COURONNE.osa, d = (o) => Math.hypot(o.x - iv.x, o.z - iv.z), ok = (o) => o && o.etat === 'actif' && !o.ancre && !o.faible && d(o) <= C.charge;
  const cib = ok(c0.cible) ? c0.cible : c0.monstres.filter(ok).sort((p, q) => d(p) - d(q))[0]; if (!cib) return;
  const a = Math.atan2(cib.x - iv.x, cib.z - iv.z), dx = Math.sin(a), dz = Math.cos(a), x0 = iv.x, z0 = iv.z, but = Math.max(0, d(cib) - 0.6 - 0.3 * (cib.d.ombre || 1));
  let L = 0; while (L < but && solSort(x0 + dx * (L + 0.25), z0 + dz * (L + 0.25))) L += 0.25;
  const duree = Math.max(0.12, L / 22), touches = new Set(), dir = new T.Vector3(dx, 0, dz), M = iv.royalM || 1, coup = Math.round(degBouftou(statsPerso().niveau) * iv.royalD * C.mult * M); /* (le coup passe par la source du Bouftou invoque, que les cristaux ne multiplient pas : M ici, comme le dit la fiche) */
  iv.pose = duree + 0.15; iv.ry = a; let t = 0, poudre = 0, choc = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.invoc !== iv || c0.fin) return true;
    const k = Math.min(1, t / duree), x = x0 + dx * L * k, z = z0 + dz * L * k; iv.x = x; iv.z = z; iv.ry = a; const y = iv.m.position.y;
    if ((poudre += dt) > 0.025) { poudre = 0; emettre(FX_FUM, 1, { x: x - dx * 0.5, y: y + 0.2, z: z - dz * 0.5, v: [-dx * 1.4, fxEntre(0.4, 0.9), -dz * 1.4], vie: [0.4, 0.7], taille: [0.4, 1.0], c: ['#e6d6b2', '#cdb98f'], a: 0.5, frein: 2.5 }); }
    if ((choc += dt) > 0.07) { choc = 0; anneauChoc(new T.Vector3(x + dx * 0.9, y + 0.7, z + dz * 0.9), dir, 0.3, 1.0, 0.22, '#f6e2a8'); }
    c0.monstres.slice().forEach((o) => { if (o.etat !== 'actif' || touches.has(o) || (o !== cib && Math.hypot(o.x - x, o.z - z) > 0.9 + 0.3 * (o.d.ombre || 1)) || (o === cib && k < 1)) return; touches.add(o);
      etoileImpact(new T.Vector3(o.x, o.m.position.y + o.haut * 0.5, o.z), 1.1, '#f6d27a'); secousse(0.1, 0.12); blesser(o, coup); if (o.etat !== 'actif') return;
      o.bloqueT = Math.max(o.bloqueT || 0, (o.d.boss ? C.sonneBoss : C.sonne) * M); if (!o.d.boss && o !== cib) bousculer(o, a, x, z); });
    if (k < 1) return false;
    secousse(0.14, 0.22); onde(x, y + 0.05, z, 1.8, '#ffffff', 0.3, 0.8); onde(x, y + 0.05, z, 2.3, '#f0c96a', 0.45, 0.65); poussiere(x, y, z, 10, 1.3, '#d8c6a0'); mottes(x, y, z, 6, 0.8); return true; });
}
/* chaque image : il grossit en Royal, charge apres un souffle, scintille d'or tant que ca dure, puis rapetisse et redevient un Bouftou */
{ const majInvocCR = majInvoc; majInvoc = function (dt) { const c = combat, iv = c && c.invoc; const r = majInvocCR.apply(this, arguments);
    try { if (!iv || !combat || combat.invoc !== iv || !(iv.royal > 0)) return r; iv.royal -= dt;
      if (iv.royalAttend > 0) { iv.royalAttend -= dt; if (iv.royalAttend <= 0) chargeBouftouRoyal(iv); }
      const R3 = iv.royalM3; if (R3) { iv.royalT += dt; const t = iv.royalT, f = t < 0.3 ? 0.3 + 0.7 * (t / 0.3) + 0.18 * Math.sin(t / 0.3 * Math.PI) : 1, g = iv.royal < 0.25 ? Math.max(0.3, iv.royal / 0.25) : 1; R3.scale.setScalar(iv.royalK * f * g); }
      if (Math.random() < dt * 10) emettre(FX_LUM, 1, { x: iv.x + (Math.random() - 0.5) * 1.2, y: iv.m.position.y + 0.3 + Math.random() * 0.8, z: iv.z + (Math.random() - 0.5) * 1.2, r: 0.04, v: [0, 1.0, 0], dv: 0.2, vie: [0.4, 0.7], taille: [0.12, 0.02], c: ['#fff6c8', '#ffd36a'], a: 0.9 }); /* (des paillettes d'or) */
      if (iv.royal <= 0) { iv.royal = 0; iv.royalD = 1; iv.royalV = 1; oterRoyal(iv); } } catch (e) { console.warn('Bouftou Royal', e); }
    return r; }; }
