'use strict';
/* ================= LE GANTELET DE LA GORGOUILLE (26/11/2026, « faire un item sur la Gorgouille, on n'en a pas sur ce demi-boss ; un anneau qui ressemble a un de
   ses gants, qui donne de la vitesse d'attaque, beaucoup, ou de l'Agilite ; vitesse de deplacement +2 a +4 ; un petit peu de prospection », Mathieu, puis au
   formulaire : l'Agilite, « oui comme ca », 3 % et niveau 75). Un anneau hors panoplie (o.labo : le monstre qui le lache), niveau 75 (le palier 8 : la
   Gorgouille sort aux vagues 75 et 80), rare x1,5 comme les autres pieces. Modele : blender/objets-labo.py (anneau_gorgouille : anneau de pierre fendillee,
   brassard d'or a la croix, poing de pierre griffu), icone obj-gorgouille-anneau. Butin : 3 % sur la Gorgouille, Prospection comprise (un monstre, pas un
   coffre), dans les vagues et les revanches (ni l'Arene, ni l'ile des boss, ni le labo). Il sort avec la mise a jour du palier 11 (p11Ouvert, SORTIE_P11 :
   « on le sortira en meme temps que la mise a jour du palier 11, comme ca on fait une grosse maj de fou pour les joueurs », Mathieu) ; avant, mode test seulement.
   (Le meme jour, les pieces du corps portees sur le perso, amulette, ceinture, bottes, anneau, ont ete faites puis retirees : « je t'ai jamais demande de faire
   les items portes ; fais que coiffe et cape comme avant », Mathieu) ================= */
const GANT_GORGOUILLE = { id: 'gorgouille-anneau', nom: 'Gantelet de la Gorgouille', niv: 75, chance: 0.03, joueurs: false, bornes: { agilite: [30, 45], vitDep: [2, 4], prospection: [10, 20] } };
{ const A = GANT_GORGOUILLE, ref = (a, b) => Math.round((a + b) / 2), rid = A.id + '-rare', moy = (B) => Object.fromEntries(Object.entries(B).map(([c, [a, b]]) => [c, ref(a, b)]));
  const bR = Object.fromEntries(Object.entries(A.bornes).map(([c, [a, b]]) => [c, [Math.ceil(a * 1.5), Math.ceil(b * 1.5)]]));
  OBJETS[A.id] = { id: A.id, emp: 'anneau', nom: A.nom, niv: A.niv, labo: 'gorgouille', stats: moy(A.bornes) };
  OBJETS[rid] = Object.assign({}, OBJETS[A.id], { id: rid, base: A.id, rare: true, nom: A.nom + ' ★', stats: moy(bR) });
  BORNES_JET[A.id] = A.bornes; BORNES_JET[rid] = bR; }
const gantGorgouilleOuvert = () => GANT_GORGOUILLE.joueurs || p11Ouvert(); /* (le palier 11 sorti, ou le mode test) */
const prosGant = () => Math.min(PLAFOND_PROS.rare, 1 + (caracs().prospection || 0) / 100);
{ const butinGant = butin; butin = function (mo) { const r = butinGant.apply(this, arguments);
    try { const c = combat;
      if (mo && mo.type === 'gorgouille' && !mo.invoque && !mo.renfort && c && !c.arene && !c.sansObjets && c.genre !== 'ile' && c.genre !== 'donjon' && gantGorgouilleOuvert() && Math.random() < GANT_GORGOUILLE.chance * prosGant()) {
        const id = tirerRare(GANT_GORGOUILLE.id, prosGant()), k = donnerObjet(id), o = OBJETS[id], L = c.loot || (c.loot = { res: {}, objets: [] }); (L.objets = L.objets || []).push(k);
        if (typeof chiffre === 'function') chiffre('✦ ' + o.nom, new T.Vector3(mo.x, (mo.m ? mo.m.position.y : 0) + (mo.haut || 2) + 0.8, mo.z), 'butin');
        toast('✦ ' + o.nom + (o.rare ? ' (rare !)' : '') + ' : la Gorgouille l\'a lâché, il est dans ton sac.', 'or'); son('quete'); if (typeof rendreHaut === 'function') rendreHaut(); }
    } catch (e) { /* rien */ } return r; }; }
/* sa ligne dans la fiche de la Gorgouille (bestiaire) */
{ const fmGant = ficheMonstre; ficheMonstre = function (t) { let h = fmGant.apply(this, arguments);
    try { if (t === 'gorgouille' && gantGorgouilleOuvert()) { const p = (Math.round(Math.min(1, GANT_GORGOUILLE.chance * prosGant()) * 1000) / 10).toString().replace('.', ',') + ' %';
      const d = '<div class="bx-drop"><img src="assets/icones/obj-gorgouille-anneau.png?v=' + VERSION_MODELES + '" alt=""><span>' + GANT_GORGOUILLE.nom + ' · ' + p + '</span></div>', i = h.indexOf('<div class="bx-drop">');
      if (i >= 0) h = h.slice(0, i) + d + h.slice(i); } } catch (e) { /* rien */ } return h; }; }

/* le mode test : le Gantelet de la Gorgouille au jet moyen (a cote du bouton des objets du labo) */
{ const omtGant = ouvrirModeTest; ouvrirModeTest = function () { const r = omtGant.apply(this, arguments);
    try { const b = document.querySelector('[data-test-labo-sac]'); if (b && !document.querySelector('[data-test-gant-sac]')) b.insertAdjacentHTML('afterend', '<button class="btn discret" data-test-gant-sac>Me donner le Gantelet de la Gorgouille</button>'); } catch (e) { /* rien */ }
    return r; }; }
document.addEventListener('click', (e) => { if (!e.target.closest('[data-test-gant-sac]') || !estAdmin() || !MODE_TEST || combat) return;
  const id = GANT_GORGOUILLE.id, k = creerObjet(id); S_.jets[k] = Object.assign({}, OBJETS[id].stats); S_.sac[k] = 1; marquerNeuf(k);
  const monte = niveau(S_.xp) < GANT_GORGOUILLE.niv; if (monte) S_.xp = seuil(GANT_GORGOUILLE.niv); vieAuMax(); rendreHaut();
  toast('Le Gantelet de la Gorgouille dans ton sac, au jet moyen' + (monte ? ' ; te voilà niveau ' + GANT_GORGOUILLE.niv + ' pour le porter' : '') + '. Bouton Perso pour le voir.', 'or');
  if (modaleOuverte === 'mode-test') ouvrirModeTest();
});
