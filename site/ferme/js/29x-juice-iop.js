'use strict';
/* L'EPEE DU IOP « JUICY » (25/11/2026, au formulaire, apres la fleche du Cra : « L'epee du Iop »). Version dev : seulement dans le mode test tant que Mathieu
   ne l'a pas validee (JUICE_IOP.force : true / false pour comparer avant et apres dans les essais). Le coup d'epee de base, pas les ultis.
   L'epee avait deja son arc de lumiere en trois couches, ses traits de vitesse, son arret sur image (35 ms), sa secousse et ses epines d'impact
   (22b-effets.js) ; il lui manquait ce qui arrive AU MONSTRE, d'apres « make hits punchy » (IDEES-JUICE.md) :
   - il devient blanc deux ou trois images et s'ecrase un instant (les monstres animes ; les autres gonflent deja), comme sous la fleche du Cra ;
   - il recule un instant dans le sens du coup puis revient (un recul a l'image seulement : sa vraie position ne bouge pas) ; ceux du balayage aussi, moins ;
   - les etincelles partent dans le sens du coup, a travers lui ;
   - un coup sourd sur l'image de l'impact, et le sifflement de l'epee un peu plus haut ou plus bas a chaque coup ;
   - les chiffres sautent en arc (29w-juice-cra.js), plus gros et dores sous le Berserker (degats x2 sous 50 % de vie) ;
   - le coup qui abat un boss ou un demi-boss marque un temps de plus. */
const JUICE_IOP = { force: null };
const juiceIop = () => (JUICE_IOP.force != null ? JUICE_IOP.force : true); /* (ouverte a tous le 25/11/2026, « Ouvrir les deux », Mathieu au formulaire ; mode test seulement avant) */
const JI = { delai: 0.06, recul: 0.3, reculVoisin: 0.16, reculD: 0.18 };

/* le recul a l'image : pose apres la mise a jour du monstre, il ne touche jamais sa vraie position */
function reculVisuel(mo, dir, force) { if (!mo || mo.etat !== 'actif' || !mo.m) return; if (mo.d && (mo.d.boss || mo.d.stable)) force *= 0.35; mo.reculV = { x: dir.x * force, z: dir.z * force, t: 0 }; }
{ const majMonstreJI = majMonstre; majMonstre = function (mo, dt) { const r = majMonstreJI.apply(this, arguments); const R = mo && mo.reculV;
  if (R) { R.t += dt || 0; const k = R.t / JI.reculD; if (k >= 1 || mo.etat !== 'actif' || !mo.m) mo.reculV = null; else { const e = k < 0.25 ? k / 0.25 : 1 - (k - 0.25) / 0.75; mo.m.position.x += R.x * e; mo.m.position.z += R.z * e; } }
  return r; }; }

{ const effetFrappeJI = effetFrappe; effetFrappe = function (classe, pv, auImpact, feu) {
  const style = feu === true ? 'feu' : (feu || '');
  if (classe !== 'iop' || style !== '' || !juiceIop()) return effetFrappeJI.apply(this, arguments);
  const pp = paysanMesh.position.clone(), dir = new T.Vector3(pv.x - pp.x, 0, pv.z - pp.z); if (dir.lengthSq() < 1e-6) dir.set(Math.sin(paysanMesh.rotation.y), 0, Math.cos(paysanMesh.rotation.y)); dir.normalize();
  const berserk = typeof berserkerIop === 'function' && berserkerIop(), C = { style: '', gros: berserk, mos: [] };
  const r = effetFrappeJI.call(this, classe, pv, () => { JUICE_CRA.coup = C; try { auImpact(); } finally { JUICE_CRA.coup = null; } }, feu);
  C.mos.forEach((mo, i) => { reactionJuicy(mo, i === 0 && berserk); flashSansSquelette(mo); }); /* (le flash tout de suite, avec le coup : sinon l'eclat jaune passait avant le blanc) */
  let t = 0; effets.push((dt) => { t += dt; if (t < JI.delai) return false; /* (au passage de la lame sur la cible, comme l'arret sur image de l'entaille) */
    emettre(FX_VIF, berserk ? 14 : 10, { x: pv.x, y: pv.y, z: pv.z, r: 0.06, v: [dir.x * 7, 1.3, dir.z * 7], dv: 2.6, vie: [0.15, 0.32], taille: [0.09, 0.02], c: ['#ffffff', '#ffd36a', '#e8601a', '#b8400e'], grav: 9, frein: 2.4, etire: 0.055 });
    son('impactFleche', undefined, berserk ? 3 : 1.5, -600 + hasardCents(80));
    C.mos.forEach((mo, i) => { const d = new T.Vector3(mo.x - pp.x, 0, mo.z - pp.z); if (d.lengthSq() < 1e-6) d.copy(dir); d.normalize(); const tue = mo.etat !== 'actif' || mo.pv <= 0;
      if (!tue) reculVisuel(mo, d, i === 0 ? JI.recul * (berserk ? 1.3 : 1) : JI.reculVoisin);
      if (i === 0 && tue && mo.d && (mo.d.boss || mo.d.demi)) { arretImage(JC.arretBoss); secousse(0.12, 0.22); etoileImpact(pv, 1.2, '#ffffff'); } });
    return true; });
  return r;
}; }

/* le sifflement de l'epee, a hauteur variable */
{ const sonJI = son; son = function (nom, variante, db, cents) { if (nom === 'epee' && cents == null && juiceIop()) cents = hasardCents(70); return sonJI.call(this, nom, variante, db, cents); }; }
