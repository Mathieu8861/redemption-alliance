'use strict';
/* LES MUTANTS DU LABO DE LA CAWOTTE (24/11/2026, Mathieu, par Discord : « faudrait creer les autres mobs que le boss du labo : des gardes qui sont des lapins
   machines, et apres tous les Wabbits mutants (s'inspirer en partie de ceux de Dofus), et dans chaque salle un lapin mutant dans une cuve qui sort a un certain
   moment de la vague », puis « faudrait penser a faire du loot a certains, des endroits de mini-boss ou on gagne des recompenses exceptionnelles » ; « attends
   pas mes validations »). Version dev : le donjon n'existe que dans le mode test (ILE-DONJON.md).
   Six mutants dessines dans le style du Docteur (maquettes/labo-cawotte/mutants/dessins), Rodin haute, texture au dosage C (outils/donjon/cuire_mutants.py),
   squelette du Creature Pack (placer-squelette.py wab*, lier-squelette.py), gestes des mutants (monstre-anime.py wab*), rendu doux sans contour :
   - le garde lapin-machine (les camps et la passerelle) : robot de cuivre, tire des cawottes de son canon, blinde ;
   - le Wabbit enrage (1, les cages) : rapide, griffe vite, en meute ;
   - le Wabbit fluo (2, la serre) : en mourant, il laisse une flaque de mutagene qui empoisonne ;
   - le Wabbit greffe (3, la chirurgie) : cousu, blinde, sa pince frappe fort ;
   - le Wabbit vampire (4, les cuves) : il se soigne de la moitie de ce qu'il te prend ;
   - le Wabbit garou (5, le labo, et les appels du Docteur) : enorme, il cogne tres fort.
   Icones rendues depuis leurs modeles (blender/icone-glb.py, recadrees : assets/icones/wab-<nom>.png), a faire valider par Mathieu.
   Leurs forces partent des Wabbits du jeu (meme vague que le donjon, la vague du niveau du joueur, 51 au moins) : a regler avec Mathieu. */
const MUTANTS_LABO = [['wab-garde', 2.6], ['wab-enrage', 2.0], ['wab-fluo', 2.3], ['wab-greffe', 2.4], ['wab-vampire', 2.3], ['wab-garou', 3.1]];
MUTANTS_LABO.forEach(([n, h]) => { SQUELETTES_A_CHARGER.push([n, 'assets/modeles/jeu/' + n + '-anime.glb', h]); NOMS_BW2.add(n); VITESSE_FAMILLE[n] = 1.3;
  RENDU_B_PAR[n] = Object.assign({}, RENDU_B, { ombre: { value: new T.Vector3(0.8, 0.81, 0.84) }, lisse: [-0.12, 0.32], cle: 'wabc', sansContour: true }); }); /* (le dosage C : ombre douce a 80 %, sans la coque du contour) */
const fW = (t, c, k) => (n) => Math.max(1, Math.round(MONSTRES[t][c](n) * k)); /* (la force d'un mutant : celle d'un Wabbit du jeu, a la meme vague, fois k) */
Object.assign(MONSTRES, {
  wabGarde: { element: 'feu', nom: 'Garde lapin-machine', modele: 'wab-garde', icone: 'wab-garde', desc: 'le robot de cuivre du Docteur, armure (-30 %) : il monte la garde et te tire des cawottes de son canon, de loin',
    pv: fW('woWabbit', 'pv', 1.2), deg: fW('wabbitSorciere', 'deg', 1.2), cadence: 2.0, vitesse: 1.8, portee: 5, distance: true, armure: 0.3, ombre: 2.0 },
  wabEnrage: { element: 'terre', nom: 'Wabbit enragé', modele: 'wab-enrage', icone: 'wab-enrage', desc: 'échappé des cages, l\'œil rouge : il court très vite et griffe vite, en meute',
    pv: fW('wabbitFonceur', 'pv', 1), deg: fW('wabbitFonceur', 'deg', 1.1), cadence: 0.8, vitesse: 3.6, portee: 1.3, ombre: 1.4 },
  wabFluo: { element: 'poison', nom: 'Wabbit fluo', modele: 'wab-fluo', icone: 'wab-fluo', desc: 'gorgé de mutagène qui luit : en mourant, il laisse une flaque verte qui empoisonne (sors-en)',
    pv: fW('wabbitNoir', 'pv', 1.1), deg: fW('wabbitNoir', 'deg', 1), cadence: 1.8, vitesse: 2.0, portee: 1.6, ombre: 1.8, flaqueMort: { R: 1.9, duree: 5, pct: 0.012 } },
  wabGreffe: { element: 'terre', nom: 'Wabbit greffé', modele: 'wab-greffe', icone: 'wab-greffe', desc: 'cousu de partout et blindé, armure (-35 %) : sa pince mécanique frappe fort',
    pv: fW('woWabbit', 'pv', 1), deg: fW('gwandWabbit', 'deg', 0.9), cadence: 2.0, vitesse: 1.6, portee: 1.7, armure: 0.35, ombre: 1.9 },
  wabVampire: { element: 'esprit', nom: 'Wabbit vampire', modele: 'wab-vampire', icone: 'wab-vampire', desc: 'sorti des cuves, les oreilles en ailes : il te vole la vie, chaque morsure le soigne de la moitié des dégâts',
    pv: fW('wabbitNoir', 'pv', 1), deg: fW('wabbitNoir', 'deg', 1), cadence: 1.3, vitesse: 2.8, portee: 1.4, ombre: 1.6, volVie: 0.5 },
  wabGarou: { element: 'terre', nom: 'Wabbit garou', modele: 'wab-garou', icone: 'wab-garou', desc: 'la créature la plus forte du Docteur, armure (-15 %) : énorme, il cogne très fort',
    pv: fW('gwandWabbit', 'pv', 1.6), deg: fW('gwandWabbit', 'deg', 1.3), cadence: 2.0, vitesse: 2.2, portee: 2.0, armure: 0.15, ombre: 2.6 } });
/* LE VOL DE VIE du vampire : il se soigne de la moitie de ce qu'il t'enleve */
{ const blesserPersoMut = blesserPerso; blesserPerso = function (n, mo) { const c = combat, a0 = c ? c.pv : 0, ok = blesserPersoMut.apply(this, arguments);
    try { if (mo && mo.d && mo.d.volVie && c && mo.etat === 'actif') { const pris = Math.max(0, a0 - c.pv); if (pris > 0) { const h = Math.round(pris * mo.d.volVie); mo.pv = Math.min(mo.pvMax, mo.pv + h); if (typeof chiffre === 'function') chiffre('+' + h, new T.Vector3(mo.x, (mo.m ? mo.m.position.y : 0) + (mo.haut || 2), mo.z), 'soin'); } } } catch (e) { /* rien */ }
    return ok; }; }
/* LA FLAQUE DU FLUO : un disque vert au sol, 5 s, qui empoisonne qui s'y tient (1,2 % de la vie par seconde) */
const FLAQUES_FLUO = [];
function flaqueFluo(mo) {
  const F = mo.d.flaqueMort, y = (mo.m ? mo.m.position.y : 0) + 0.04;
  const m = new T.Mesh(new T.CircleGeometry(F.R, 28), new T.MeshBasicMaterial({ color: '#8dff4a', transparent: true, opacity: 0.55, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(mo.x, y, mo.z); m.renderOrder = 3; scene.add(m);
  FLAQUES_FLUO.push({ m, x: mo.x, z: mo.z, y, R: F.R, fin: performance.now() + F.duree * 1000, pct: F.pct, c: combat });
}
setInterval(() => {
  try {
    const now = performance.now();
    for (let i = FLAQUES_FLUO.length - 1; i >= 0; i--) { const Q = FLAQUES_FLUO[i];
      if (now > Q.fin || combat !== Q.c || !combat || combat.fin) { scene.remove(Q.m); Q.m.geometry.dispose(); Q.m.material.dispose(); FLAQUES_FLUO.splice(i, 1); continue; }
      Q.m.material.opacity = 0.35 + 0.2 * Math.sin(now / 180); if (enPause) continue;
      if (typeof emettre === 'function' && Math.random() < 0.6) emettre(FX_LUM, 1, { x: Q.x + (Math.random() - 0.5) * Q.R, y: Q.y + 0.1, z: Q.z + (Math.random() - 0.5) * Q.R, r: 0.1, v: [0, 0.9, 0], dv: 0.2, vie: [0.5, 0.9], taille: [0.16, 0.05], c: ['#8dff4a', '#c8ff7a'], a: 0.6, frein: 0.3 });
      const p = paysanMesh.position; if (Math.hypot(p.x - Q.x, p.z - Q.z) < Q.R && combat.pv > 0) blesserPerso(Math.max(1, Math.round(combat.pvMax * Q.pct * 0.2)), null);
    }
  } catch (e) { /* rien */ }
}, 200);
/* LES RECOMPENSES DU DONJON (24/11/2026, « du loot a certains, des endroits de mini-boss ou on gagne des recompenses exceptionnelles ») : chaque mutant a
   une chance de lacher un Poil de Wabbit ; un specimen d'une cuve et un mini-boss du dehors donnent plus (kamas, runes, a la fin un coffre). Version dev */
const LOOT_LABO = { poil: 0.35, specimen: { kamas: kamasGagnes(20000), poils: 4 }, chef: { kamas: kamasGagnes(50000), poils: 8, forge: 1, parfaite: 0.2 } };
function gagnerLabo(mo, R, titre) {
  const G = S_.grange = S_.grange || {}; let txt = [];
  if (R.kamas) { S_.kamas += R.kamas; txt.push(fmt(R.kamas) + ' kamas'); }
  if (R.poils) { G.poil_wabbit = (G.poil_wabbit || 0) + R.poils; txt.push(R.poils + ' Poils de Wabbit'); }
  if (R.forge) { runes().forge = (runes().forge || 0) + R.forge; txt.push(R.forge + ' rune de forgemagie'); }
  if (R.parfaite && Math.random() < R.parfaite) { runes().parfaite = (runes().parfaite || 0) + 1; txt.push('une rune parfaite !'); }
  if (typeof chiffre === 'function') chiffre('✦ ' + titre, new T.Vector3(mo.x, (mo.m ? mo.m.position.y : 0) + (mo.haut || 2) + 0.6, mo.z), 'butin');
  toast('✦ ' + titre + ' : ' + txt.join(', ') + '.', 'or'); rendreHaut(); rendreGrange(); son('quete');
}
{ const butinMut = butin; butin = function (mo) {
    const c = combat; if (!(c && c.genre === 'donjon')) return butinMut(mo);
    try {
      if (mo.d && mo.d.flaqueMort) flaqueFluo(mo);
      if (mo.specimen) gagnerLabo(mo, LOOT_LABO.specimen, mo.d.nom + ' vaincu');
      else if (mo.chef) gagnerLabo(mo, LOOT_LABO.chef, 'Coffre de ' + mo.d.nom);
      else if (Math.random() < LOOT_LABO.poil) { const G = S_.grange = S_.grange || {}; G.poil_wabbit = (G.poil_wabbit || 0) + 1; if (typeof chiffre === 'function') chiffre('+ Poil de Wabbit', new T.Vector3(mo.x, (mo.m ? mo.m.position.y : 0) + (mo.haut || 2), mo.z), 'butin'); rendreGrange(); }
    } catch (e) { /* rien */ }
    return butinMut(mo); }; }
/* LE SPECIMEN D'UNE CUVE et LE MINI-BOSS d'un camp : le meme mutant, plus grand et plus fort (vie x3, coups x1,3, taille x1,35), une lueur a lui */
function grandirMutant(o, k, couleur, nom) {
  o.pvMax = o.pv = Math.round(o.pvMax * k.pv); o.deg = o.deg0 = Math.round(o.deg * k.deg); if (o.m) { o.m.scale.multiplyScalar(k.taille); o.echelle = o.m.scale.x; }
  o.haut = (o.haut || 2) * k.taille; o.d = Object.assign({}, o.d, { nom }); o.aggro = true;
  if (o.m) o.m.traverse((q) => { if (!q.isMesh || !q.material || q.name === 'contour') return; q.material = q.material.clone(); if (q.material.emissive) { q.material.emissive.set(couleur); q.material.emissiveIntensity = 0.28; } });
}
const SPECIMEN = { pv: 3, deg: 1.3, taille: 1.35 }, CHEF_LABO = { pv: 5, deg: 1.5, taille: 1.5 };
