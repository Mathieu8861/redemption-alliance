'use strict';
/* LE FOUET DE L'OSAMODAS « JUICY » (25/11/2026, « fait l'osa et on sera bon », Mathieu, apres l'epee du Iop). Version dev : seulement dans le mode test tant
   que Mathieu ne l'a pas valide (JUICE_OSA.force : true / false pour comparer avant et apres dans les essais). Le coup de fouet de base, pas les ultis.
   Le fouet avait sa laniere qui ondule jusqu'a la cible (0,13 s), un eclat, une onde au sol et un flash au claquement (22b-effets.js) ; ajoutes, d'apres
   IDEES-JUICE.md :
   - le bout de la laniere laisse une trainee de lumiere pendant qu'il file (ce qui va vite se voit : « suivre la pointe tout le geste ») ;
   - au claquement : un anneau de souffle autour du bout (le « clac » qui se voit), des etincelles dans le sens du coup ;
   - le monstre devient blanc et s'ecrase un instant (comme sous la fleche du Cra et l'epee du Iop), et recule un peu (a l'image seulement) ;
   - un petit coup sourd sous le claquement, et le fouet qui claque un peu plus haut ou plus bas a chaque coup ;
   - les chiffres sautent en arc (29w-juice-cra.js) ; le coup qui abat un boss ou un demi-boss marque un temps de plus.
   Les degats tombent au claquement (0,13 s apres le depart du coup, comme la fleche du Cra a l'arrivee) et non plus au depart : le chiffre, l'eclat jaune
   et le flash blanc arrivent ensemble, sur l'image ou la laniere touche. */
const JUICE_OSA = { force: null };
const juiceOsa = () => (JUICE_OSA.force != null ? JUICE_OSA.force : typeof MODE_TEST !== 'undefined' && !!MODE_TEST);
const JO = { file: 0.13, recul: 0.22 };

{ const effetFrappeJO = effetFrappe; effetFrappe = function (classe, pv, auImpact, feu) {
  const style = feu === true ? 'feu' : (feu || '');
  if (classe !== 'osa' || style !== '' || !juiceOsa()) return effetFrappeJO.apply(this, arguments);
  const de = mainDe(paysanMesh), dir = pv.clone().sub(de), cote = new T.Vector3(-dir.z, 0, dir.x).normalize(), plat = new T.Vector3(dir.x, 0, dir.z);
  if (plat.lengthSq() < 1e-6) plat.set(Math.sin(paysanMesh.rotation.y), 0, Math.cos(paysanMesh.rotation.y)); plat.normalize();
  const C = { style: '', mos: [] };
  const r = effetFrappeJO.call(this, classe, pv, () => {}, feu); /* (les degats au claquement, plus bas) */
  /* le bout de la laniere : le meme trajet que dans coupDeFouet (22b-effets.js) */
  const bout = (t, o) => { const k = Math.min(1, t / JO.file), main = mainDe(paysanMesh); o.copy(main).lerp(pv, k).addScaledVector(cote, Math.sin(k * Math.PI * 2.2 - t * 40) * 0.35 * k * (1 - k * 0.8)); o.y += Math.sin(k * Math.PI) * (0.9 * (1 - k) + 0.25); return o; };
  const a = new T.Vector3(), b = new T.Vector3(); let t = 0, claque = false; bout(0, a);
  effets.push((dt) => { t += dt; bout(t, b);
    if (t < JO.file) { /* la trainee du bout qui file */
      for (let i = 0; i < 3; i++) { const q = (i + 0.5) / 3, x = a.x + (b.x - a.x) * q, y = a.y + (b.y - a.y) * q, z = a.z + (b.z - a.z) * q;
        emettre(FX_LUM, 1, { x, y, z, vie: [0.1, 0.15], taille: [0.22, 0.03], c: ['#ffffff', '#ffe3a0'], a: 0.6 });
        emettre(FX_VIF, 1, { x, y, z, vie: [0.07, 0.12], taille: [0.06, 0.015], c: ['#fffaf0', '#e8b45a'], a: 0.95 }); }
      a.copy(b); return false; }
    if (!claque) { claque = true; /* le claquement */
      JUICE_CRA.coup = C; try { auImpact(); } finally { JUICE_CRA.coup = null; }
      anneauSouffle(pv.clone(), dir.clone().normalize(), 0.06, 0.75, 0.16, '#fff1c0', 0.9);
      emettre(FX_VIF, 10, { x: pv.x, y: pv.y, z: pv.z, r: 0.05, v: [plat.x * 6, 1.2, plat.z * 6], dv: 2.6, vie: [0.14, 0.3], taille: [0.08, 0.02], c: ['#ffffff', '#ffe3a0', '#e8b45a', '#a8742e'], grav: 8, frein: 2.4, etire: 0.05 });
      son('impactFleche', undefined, -2, 250 + hasardCents(80));
      C.mos.forEach((mo, i) => { reactionJuicy(mo, false); flashSansSquelette(mo); const tue = mo.etat !== 'actif' || mo.pv <= 0;
        const d = new T.Vector3(mo.x - paysanMesh.position.x, 0, mo.z - paysanMesh.position.z); if (d.lengthSq() < 1e-6) d.copy(plat); d.normalize();
        if (!tue) reculVisuel(mo, d, JO.recul);
        if (i === 0 && tue && mo.d && (mo.d.boss || mo.d.demi)) { arretImage(JC.arretBoss); secousse(0.12, 0.22); etoileImpact(pv, 1.2, '#ffffff'); } });
      return true; }
    return true; });
  return r;
}; }

/* le claquement du fouet, a hauteur variable */
{ const sonJO = son; son = function (nom, variante, db, cents) { if (nom === 'fouet' && cents == null && juiceOsa()) cents = hasardCents(70); return sonJO.call(this, nom, variante, db, cents); }; }
