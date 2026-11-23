'use strict';
/* LE PIEGE A DENTS (19/11/2026, version dev : mode test seulement). Mathieu, sur la maquette des fabrications de l'atelier : « piege a dents », « oui, comme
   la maquette ». Il se fabrique a l'atelier (20 Dents de Bwork, 10 Os de Chafer et 50 000 kamas pour 3 : « il faut plus de ressources et de kamas pour les
   crafts », Mathieu, 19/11) et se pose comme une decoration (Amenager, Mes decorations). En vague, le premier monstre qui passe dessus perd 15 % de sa vie
   et reste bloque 2 s ; le piege se referme (son modele ferme) ; trois pieges au plus se declenchent par vague, et tous se rearment a la vague suivante.
   Les boss et les demi-boss sont pris aussi, mais moins fort : 3 % de leur vie max et 1 s (« ca marche aussi sur les boss, pas les volants, le boss prend
   3 % hp max et 1 s de stun, ca permettra de faire le boss 110 qui est super rapide », Mathieu, 19/11). Les monstres volants passent au-dessus.
   Le monstre pris est etourdi : il ne bouge plus, n'attaque plus et ne lance plus de sort (majMonstre saute ce temps-la ; le Croco a ses propres
   deplacements, que le simple blocage de la marche n'arretait pas).
   Modele : blender/piege-dents.py (arme et referme), icone : icones-piege.html. Il n'existe que dans le mode test : ajoute a son entree. */
const PIEGE = { degats: 0.15, bloque: 2, boss: { degats: 0.03, bloque: 1 }, parVague: 3, rayon: 0.9 };
RECETTES_DEV_ATELIER.push({ id: 'piege_dents', nom: 'Piège à dents', donne: 3, kamas: 50000, deco: 'piege_dents', il: [['dent_bwork', 20], ['os_chafer', 10]], ico: 'deco-piege_dents',
  desc: 'Trois pièges à poser sur ta ferme (ils vont dans tes décorations). En vague, le premier monstre qui passe dessus perd 15 % de sa vie et reste étourdi 2 s (un boss : 3 % de sa vie et 1 s). Trois pièges au plus se déclenchent par vague, puis ils se réarment. Les monstres volants passent au-dessus.' });
let piegeCharge = null;
function chargerPiege() {
  if (piegeCharge) return piegeCharge;
  return (piegeCharge = chargerGlb('assets/modeles/jeu/piege-dents.glb?v=' + VERSION_MODELES).then((sc) => {
    versToon(sc, { normales: 0.01, sansContour: new Set(['dent', 'maillon', 'brin', 'signe']) });
    MODELES.deco_piege_dents = gabaritEchelle(sc, 'Deco_piege_dents', 1); MODELES.deco_piege_dents_ferme = gabaritEchelle(sc, 'Deco_piege_dents_ferme', 1);
    if (S_ && S_.cases.some((c) => c.type === 'deco' && c.deco === 'piege_dents')) construireDecos();
  }).catch(() => { piegeCharge = null; }));
}
const entrerModeTestPiege = entrerModeTest; entrerModeTest = function () {
  const r = entrerModeTestPiege.apply(this, arguments);
  if (MODE_TEST) ouvrirPiege();
  return r;
};
function ouvrirPiege() { DECOS.piege_dents = DECOS.piege_dents || { nom: 'Piège à dents', prix: 0, niv: 90, pr: 'le', atelier: true }; chargerPiege(); }
if (SORTIE_P11) ouvrirPiege(); /* (la sortie du palier 11 : avant le chargement de la partie, sinon ses pieges poses seraient perdus) */
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
    if (!p11Ouvert() || !c || c.fin || c.genre !== 'vague' || lieu !== 'ferme' || enPause) return;
    piegeCombat = c; const P = c.pieges || (c.pieges = { pris: new Set(), n: 0 }); if (P.n >= PIEGE.parVague) return;
    S_.cases.forEach((k) => {
      if (P.n >= PIEGE.parVague || k.type !== 'deco' || k.deco !== 'piege_dents' || P.pris.has(k.id)) return; const q = posCase(k);
      const mo = c.monstres.find((o) => o.etat === 'actif' && o.m && !o.d.vol && !o.plonge && Math.hypot(o.x - q.x, o.z - q.z) < PIEGE.rayon); if (!mo) return;
      const R = mo.d.boss || mo.d.demi ? PIEGE.boss : PIEGE; P.pris.add(k.id); P.n++; mo.piegeT = Math.max(mo.piegeT || 0, R.bloque); mo.bloqueT = Math.max(mo.bloqueT || 0, R.bloque);
      const pos = mo.m.position.clone(); pos.y += (mo.haut || 1) * 0.9;
      blesser(mo, Math.max(1, Math.round(mo.pvMax * R.degats)), true, 'def'); chiffre('Piège !', pos); try { son('touche'); } catch (e) { /* (sans le son) */ }
      fermerPiege(k);
    });
  } catch (e) { /* (avant le chargement de la ferme) */ }
}, 100);
/* l'etourdissement : le monstre pris saute son tour (ni marche, ni coup, ni sort) ; ses minuteries attendent avec lui */
const majMonstrePiege = majMonstre; majMonstre = function (mo, dt) { if (mo && mo.piegeT > 0 && mo.etat === 'actif' && combat && !combat.fin) { mo.piegeT -= dt; return; } return majMonstrePiege.apply(this, arguments); };
