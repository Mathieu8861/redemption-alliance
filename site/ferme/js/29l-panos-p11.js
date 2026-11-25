'use strict';
/* LE PALIER 11 : SES MONSTRES RENOMMES ET SES DEUX PANOPLIES (20/11/2026, version dev : le palier 11 n'est que dans le mode test).
   Mathieu : « panoplie Amphibienne et Reptilienne. Mais faudrait trouver des noms aux mobs et au pano comme dans Dofus. La reptilienne pour tank / cac, l'amphibienne
   dps dist, un peu comme d'hab mais tu peux mettre un peu plus de subtilite dans les bonus de pano » ; noms et bonus choisis au formulaire le meme soir.
   - Les monstres, en jeux de mots : Tetaclaque, Crachopaud, Tritonnerre, Claquelangue, Axolutin, Mere Crapustule ; Croquevase, Piranhargne, Brocheroce, Silurmage,
     et le boss de la 110, le Machefange.
   - La panoplie du Crachopaud (amphibienne, degats a distance) tombe sur les amphibiens ; celle du Croquevase (reptilienne, tank au contact) sur la tribu de la mare.
     Leurs pieces et leurs bonus : 03-equipements.js (PANOS, MOTIF_PANO, PALIERS_PROPRES) ; ici, ce que leurs bonus font en combat :
       Croquevase : Sang-froid (sous la moitie de ta vie, -12 % de degats recus), Ecailles (15 % des coups recus au contact renvoyes), Mue (une fois par combat, sous
       25 % de vie, +20 % de ta vie) ;
       Crachopaud : Oeil de crapaud (+12 % de degats sur un monstre a plus de 4 cases), Bond (+25 % de vitesse 2 s quand on te frappe au contact, toutes les 6 s au
       plus), Mucus (tes coups ralentissent le monstre de 20 % pendant 1,5 s) ;
       Sang-mele (3 pieces de chacune) : +5 % de degats et +15 % de resistance a l'entrave.
   - Les stats de combat (25/11/2026, STATS_COMBAT_P11, 03-equipements.js) : degats fixes, resistance fixe et en % (21-combat.js), et la Ruee (+15 % de vitesse 3 s
     apres un monstre abattu, ici), a la place du Bond a 6 pieces du Crachopaud.
   - Sans look pour l'instant : les pieces prennent l'icone de leur monstre (le Croquevase, le Crachopaud). */
const NOMS_P11 = { tetard: 'Têtaclaque', crapaud: 'Crachopaud', triton: 'Tritonnerre', fouette: 'Claquelangue', axolotl: 'Axolutin', mereCrapaude: 'Mère Crapustule',
  crocoVase: 'Croquevase', piranha: 'Piranhargne', brochet: 'Brochéroce', silure: 'Silurmage', crocoBoss: 'Mâchefange' };
Object.entries(NOMS_P11).forEach(([t, nom]) => { if (MONSTRES[t]) MONSTRES[t].nom = nom; });
['tetard', 'crapaud', 'triton', 'fouette', 'axolotl', 'mereCrapaude'].forEach((t) => { if (MONSTRES[t]) MONSTRES[t].pano = 'crachopaud'; });
['crocoVase', 'piranha', 'brochet', 'silure', 'crocoBoss'].forEach((t) => { if (MONSTRES[t]) MONSTRES[t].pano = 'croquevase'; });
/* (les icones des 12 pieces, 22/11/2026 : obj-croquevase-* et obj-crachopaud-*, photographiees par icones-palier11-objets.html ; plus d'icone d'attente) */
['croquevase-coiffe', 'crachopaud-coiffe'].forEach((id) => { if (OBJETS[id]) OBJETS[id].rond = true; }); /* (des coiffes rondes, enfoncees sur la tete, jamais ecrasees : 12-perso.js, 21/11/2026) */
/* les reglages de leurs bonus en combat (les pourcentages viennent des bonus de panoplie, caracs()) */
const P11_COMBAT = { oeilCases: 4, bondDuree: 2, bondRecharge: 6, mucusDuree: 1.5, mueSous: 0.25, rueeDuree: 3 };
const p11 = () => { if (!combat) return {}; if (!combat.p11) { const c = caracs(); combat.p11 = { sangFroid: c.sangFroid, ecailles: c.ecailles, mue: c.mue, oeil: c.oeilCrapaud, bond: c.bond, mucus: c.mucus, mele: c.sangMele, degFixe: c.degFixe, ruee: c.ruee, vitDep: c.vitDep }; } return combat.p11; };
/* LA VITESSE DE DEPLACEMENT DES OBJETS (les bottes du Croquevase, 25/11/2026) : en combat, celle du debut du combat (p11) ; hors combat, recalculee quand l'equipement change */
let vitDepCache = { k: null, v: 0 };
const vitDepEquip = () => { if (combat) return p11().vitDep || 0; const k = S_ && S_.equip ? Object.values(S_.equip).join('|') : ''; if (k !== vitDepCache.k) vitDepCache = { k, v: caracs().vitDep || 0 }; return vitDepCache.v; };
/* LES DEGATS FIXES (25/11/2026 au soir, « les degats fixes marchent sur les autos et les sorts, et ne comptent pas comme des degats bonus de stats ou la Puissance agit
   dessus », Mathieu) : ajoutes a chaque coup que le perso porte lui-meme (attaque de base et son balayage, sort de classe, ulti, sorts legendaires : SRC_DEG, 23-fin-combat.js),
   une fois par monstre touche ; pas les invocations (Bouftou, Bouture, Dragonnet), ni les brulures, le venin, la fumee ou les defenses */
const SORTS_CLASSE_P11 = ['Flèche perçante', 'Bond du Iop', 'Invocation du Bouftou'];
const coupDirectP11 = () => typeof SRC_DEG === 'string' && (SRC_DEG === 'Coups automatiques' || SRC_DEG.indexOf('Ulti : ') === 0 || SRC_DEG.indexOf('Sort légendaire') === 0 || SORTS_CLASSE_P11.includes(SRC_DEG));
const degFixeP11 = () => (combat ? p11().degFixe || 0 : 0); /* (les degats fixes de l'attaque de base, 21-combat.js) */ /* (une fois par combat : l'equipement ne change pas en plein combat) */
/* tes coups : Oeil de crapaud, Sang-mele, puis le Mucus sur le monstre touche */
const blesserP11 = blesser; blesser = function (mo, n, gros, src) {
  if (src == null && combat && !combat.fin && mo && mo.etat === 'actif' && n > 1) { const B = p11();
    if (B.oeil && paysanMesh && Math.hypot(mo.x - paysanMesh.position.x, mo.z - paysanMesh.position.z) > P11_COMBAT.oeilCases * S) n = Math.round(n * (1 + B.oeil / 100));
    if (B.mele) n = Math.round(n * (1 + B.mele / 100));
    if (B.mucus && SRC_DEG === 'Coups automatiques') { mo.mucus = P11_COMBAT.mucusDuree; mo.mucusV = 1 - B.mucus / 100; } /* (le Mucus : les attaques de base seulement, pas les sorts, 26/11/2026, Mathieu) */
    if (B.degFixe && coupDirectP11()) n += B.degFixe; } /* (les degats fixes, a la fin : apres la Puissance et les pourcentages, avant l'armure du monstre) */
  const vivant = !!combat && !combat.fin && !!mo && mo.etat === 'actif' && mo.pv > 0, r = blesserP11(mo, n, gros, src);
  if (vivant && src !== 'def' && mo.pv <= 0 && combat && !combat.fin) { const B = p11(); if (B.ruee) { const neuf = !(combat.rueeP11T > 0); combat.rueeP11T = P11_COMBAT.rueeDuree; combat.rueeP11V = B.ruee / 100; /* (la Ruee : un monstre abattu, +15 % de vitesse 3 s ; un autre relance les 3 s) */
    if (neuf && paysanMesh) { const pp = paysanMesh.position; chiffre('Ruée !', new T.Vector3(pp.x, pp.y + 2.1, pp.z), 'perso'); } } }
  return r;
};
/* les coups recus : Sang-froid avant, puis Ecailles, Bond et Mue */
const blesserPersoP11 = blesserPerso; blesserPerso = function (n, mo) {
  if (!combat || combat.fin) return blesserPersoP11(n, mo); const B = p11(), n0 = n;
  if (B.sangFroid && combat.pv < combat.pvMax / 2) n = Math.max(1, Math.round(n * (1 - B.sangFroid / 100)));
  const r = blesserPersoP11(n, mo); if (!r || !combat || combat.fin) return r;
  const contact = !!mo && mo.etat === 'actif' && !coupDeLoin(mo), pp = paysanMesh.position;
  if (B.ecailles && contact) { const k = Math.max(1, Math.round(n0 * B.ecailles / 100)); blesser(mo, k, false, 'def'); }
  if (B.bond && contact && !(combat.bondCd > 0)) { combat.bondT = P11_COMBAT.bondDuree; combat.bondCd = P11_COMBAT.bondRecharge; combat.bondV = B.bond / 100; chiffre('Bond !', new T.Vector3(pp.x, pp.y + 2.1, pp.z), 'perso'); }
  if (B.mue && !combat.mueFaite && combat.pv > 0 && combat.pv < combat.pvMax * P11_COMBAT.mueSous) { combat.mueFaite = true; const k = Math.round(combat.pvMax * B.mue / 100); combat.pv = Math.min(combat.pvMax, combat.pv + k); chiffre('Mue ! +' + k, new T.Vector3(pp.x, pp.y + 2.4, pp.z), 'soin'); }
  return r;
};
effets.push((dt) => { if (!combat) return false; if (combat.bondT > 0) combat.bondT -= dt; if (combat.rueeP11T > 0) combat.rueeP11T -= dt; if (combat.bondCd > 0) combat.bondCd -= dt;
  combat.monstres.forEach((mo) => { if (mo.mucus > 0) mo.mucus -= dt; }); return false; });
/* la tenue des spectateurs de l'Arene : pas les pieces sans look (le palier 11) */
const tenueAuHasardP11 = tenueAuHasard; tenueAuHasard = function (classe) { const e = tenueAuHasardP11(classe); Object.keys(e).forEach((k) => { const o = OBJETS[e[k]]; if (o && PANOS[o.pano] && PANOS[o.pano].dev) delete e[k]; }); return e; };
