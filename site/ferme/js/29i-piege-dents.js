'use strict';
/* LE PIEGE A DENTS (19/11/2026, version dev : mode test seulement). Mathieu, sur la maquette des fabrications de l'atelier : « piege a dents », « oui, comme
   la maquette ». Il se fabrique a l'atelier (20 Dents de Bwork, 10 Os de Chafer et 50 000 kamas pour 3 : « il faut plus de ressources et de kamas pour les
   crafts », Mathieu, 19/11) et se pose comme une decoration (Amenager, Mes decorations). En vague, le premier monstre qui passe dessus perd 15 % de sa vie
   et reste bloque 2 s ; le piege se referme (son modele ferme) ; trois pieges au plus se declenchent par vague, et tous se rearment a la vague suivante.
   Les boss, les demi-boss et les monstres volants passent au-dessus (15 % de la vie d'un boss, ce serait un coup enorme).
   Modele : blender/piege-dents.py (arme et referme), icone : icones-piege.html. Il n'existe que dans le mode test : ajoute a son entree. */
const PIEGE = { degats: 0.15, bloque: 2, parVague: 3, rayon: 0.9 };
RECETTES_DEV_ATELIER.push({ id: 'piege_dents', nom: 'Piège à dents', donne: 3, kamas: 50000, deco: 'piege_dents', il: [['dent_bwork', 20], ['os_chafer', 10]], ico: 'deco-piege_dents',
  desc: 'Trois pièges à poser sur ta ferme (ils vont dans tes décorations). En vague, le premier monstre qui passe dessus perd 15 % de sa vie et reste bloqué 2 s. Trois pièges au plus se déclenchent par vague, puis ils se réarment. Les boss, les demi-boss et les monstres volants passent au-dessus.' });
let piegeCharge = null;
function chargerPiege() {
  if (piegeCharge) return piegeCharge;
  return (piegeCharge = chargerGlb('assets/modeles/jeu/piege-dents.glb?v=' + VERSION_MODELES).then((sc) => {
    versToon(sc, { normales: 0.01, sansContour: new Set(['dent', 'maillon', 'brin', 'signe']) });
    MODELES.deco_piege_dents = gabaritEchelle(sc, 'Deco_piege_dents', 1); MODELES.deco_piege_dents_ferme = gabaritEchelle(sc, 'Deco_piege_dents_ferme', 1);
    if (S_.cases.some((c) => c.type === 'deco' && c.deco === 'piege_dents')) construireDecos();
  }).catch(() => { piegeCharge = null; }));
}
const entrerModeTestPiege = entrerModeTest; entrerModeTest = function () {
  const r = entrerModeTestPiege.apply(this, arguments);
  if (MODE_TEST) { DECOS.piege_dents = DECOS.piege_dents || { nom: 'Piège à dents', prix: 0, niv: 90, pr: 'le', atelier: true }; chargerPiege(); }
  return r;
};
/* le declenchement : toutes les 0,1 s pendant une vague a la ferme */
let piegesFermes = [], piegeCombat = null;
function rearmerPieges() { piegesFermes.forEach(({ m, o }) => { scene.remove(m); if (o) o.visible = true; }); piegesFermes = []; }
function fermerPiege(k) {
  const o = decosMesh.find((m) => m.parent === scene && m.userData && m.userData.cellule === k.id); if (!o || !MODELES.deco_piege_dents_ferme) return;
  const f = MODELES.deco_piege_dents_ferme.clone(true); f.position.copy(o.position); f.rotation.copy(o.rotation); f.traverse((q) => { q.raycast = () => {}; }); scene.add(f); o.visible = false; piegesFermes.push({ m: f, o });
}
setInterval(() => {
  try {
    const c = combat; if (piegeCombat && piegeCombat !== c) { piegeCombat = null; rearmerPieges(); } /* (la vague finie : tous se rearment) */
    if (!MODE_TEST || !c || c.fin || c.genre !== 'vague' || lieu !== 'ferme' || enPause) return;
    piegeCombat = c; const P = c.pieges || (c.pieges = { pris: new Set(), n: 0 }); if (P.n >= PIEGE.parVague) return;
    S_.cases.forEach((k) => {
      if (P.n >= PIEGE.parVague || k.type !== 'deco' || k.deco !== 'piege_dents' || P.pris.has(k.id)) return; const q = posCase(k);
      const mo = c.monstres.find((o) => o.etat === 'actif' && o.m && !o.d.boss && !o.d.demi && !o.d.vol && Math.hypot(o.x - q.x, o.z - q.z) < PIEGE.rayon); if (!mo) return;
      P.pris.add(k.id); P.n++; mo.bloqueT = Math.max(mo.bloqueT || 0, PIEGE.bloque);
      const pos = mo.m.position.clone(); pos.y += (mo.haut || 1) * 0.9;
      blesser(mo, Math.max(1, Math.round(mo.pvMax * PIEGE.degats)), true, 'def'); chiffre('Piège !', pos); try { son('touche'); } catch (e) { /* (sans le son) */ }
      fermerPiege(k);
    });
  } catch (e) { /* (avant le chargement de la ferme) */ }
}, 100);
