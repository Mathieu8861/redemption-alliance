'use strict';
/* LES SORTS LEGENDAIRES « JUICY » (25/11/2026, « fais les sorts legendaires », Mathieu) : une recette commune pour la vingtaine de sorts des coiffes et des armes
   legendaires (executerLeg, 22-sorts.js). Ouverte a tous le 25/11/2026 (« Ouvrir aux joueurs », Mathieu au formulaire ; juiceSort('leg'), 29z-juice-sorts.js ;
   JUICE_SORTS.force : true / false pour comparer avant et apres dans les essais).
   Les sorts gardent leurs effets, leurs degats et le moment ou ils tombent ; ce qui change, c'est ce qui arrive au monstre touche (IDEES-JUICE.md) :
   - il devient blanc deux ou trois images et s'ecrase un instant (comme sous la fleche du Cra, l'epee du Iop et le fouet de l'Osa), et recule un peu (a l'image) ;
   - des etincelles partent a travers lui, a la couleur du sort : depuis le centre du sort pour une zone, dans le sens de la charge ou de la lance, depuis le perso
     pour un tir ou un souffle ;
   - un coup sourd, un peu plus haut ou plus bas a chaque fois, un seul toutes les 70 ms (une zone ne fait pas un mur de bruit) ;
   - les chiffres sautent en arc (29w-juice-cra.js) ;
   - le premier coup du sort marque un court temps fort (35 ms, pas en horde) ; le coup qui abat un boss ou un demi-boss, un temps de plus.
   Comment on reconnait un coup de sort legendaire : SRC_DEG commence par « Sort legendaire » (23-fin-combat.js : la source suit la fleche en vol, les setTimeout et
   les effets). Les brulures, la fumee, le venin, les defenses, le Dragonnet et la Bouture ont leur propre source : ils ne changent pas. */
const JL = { recul: 0.26, son: 70, arret: 0.035, gerbe: 9, salve: 60, max: 8, horde: 20 };
/* LA VERSION PLUS MARQUEE (25/11/2026, « je vois pas de grosses differences », Mathieu devant la video) : en mode test seulement (juiceSort('legfort')) tant qu'il
   ne l'a pas validee. Le blanc dure presque deux fois plus, le monstre fait un petit bond (pas les boss), recule deux fois plus, une etoile d'impact et un anneau
   au sol a la couleur du sort sur chaque monstre touche, plus d'etincelles et plus grandes, un temps fort de 55 ms et une petite secousse au premier coup */
const JL_FORT = { force: null, flash: 0.11, recul: 0.5, saut: 0.35, gerbe: 14, etoile: 0.8, arret: 0.055 }; /* (force : true / false pour comparer dans les essais) */
const LEG_LANCERS = {}; /* (par sort : son centre, sa forme, sa teinte, son premier coup) */
let LEG_SON_T = -1e9, LEG_SALVE = { t: -1e9, n: 0 };
const nomSortLeg = (S, emp) => 'Sort légendaire : ' + (S ? S.nom : emp); /* (le meme nom que la source des degats, 23-fin-combat.js) */
const estCoupLeg = () => typeof SRC_DEG === 'string' && SRC_DEG.indexOf('Sort légendaire') === 0;

/* le lancer : on note d'ou part le sort (ou il frappe, dans quel sens) */
{ const executerLegJL = executerLeg; executerLeg = function (emp, pt, compter, tire) {
  if (!juiceSort('leg') || !combat) return executerLegJL.apply(this, arguments);
  const cle = legDe(emp), S = cle && sortLeg(cle);
  if (S && pt) { const nom = nomSortLeg(S, emp), cl = classeDe(), pp = paysanMesh.position, L = (!tire || !LEG_LANCERS[nom]) ? (LEG_LANCERS[nom] = { premier: false }) : LEG_LANCERS[nom];
    let dx = pt.x - pp.x, dz = pt.z - pp.z, n = Math.hypot(dx, dz); if (n < 0.05) { dx = Math.sin(paysanMesh.rotation.y); dz = Math.cos(paysanMesh.rotation.y); n = 1; }
    Object.assign(L, { x: pt.x, z: pt.z, dx: dx / n, dz: dz / n, teinte: S.teinte || '#ffd36a',
      mode: cle === 'royal' || cle === 'chafer' ? 'ligne' : S.ouv || (cl === 'cra' && (cle === 'wa' || cle === 'ancestral')) ? 'perso' : 'zone' }); }
  const C0 = JUICE_CRA.coup; JUICE_CRA.coup = null; /* (le sort qui part au bout de la fleche, de l'epee ou du fouet : ses coups sont les siens, pas ceux de l'arme) */
  try { return executerLegJL.apply(this, arguments); } finally { JUICE_CRA.coup = C0; }
}; }

/* le monstre touche par un sort legendaire */
function coupLegJuicy(mo) {
  const L = LEG_LANCERS[SRC_DEG], pp = paysanMesh.position, maintenant = performance.now(), tue = mo.etat !== 'actif' || mo.pv <= 0;
  const h = mo.haut || 1.5, q = new T.Vector3(mo.x, (mo.m ? mo.m.position.y : solA(mo.x, mo.z)) + h * 0.5, mo.z), d = new T.Vector3();
  if (L && L.mode === 'ligne') d.set(L.dx, 0, L.dz); else if (L && L.mode === 'zone') d.set(mo.x - L.x, 0, mo.z - L.z);
  if (d.lengthSq() < 0.16) d.set(mo.x - pp.x, 0, mo.z - pp.z); if (d.lengthSq() < 1e-6) d.set(Math.sin(paysanMesh.rotation.y), 0, Math.cos(paysanMesh.rotation.y)); d.normalize();
  const rang = LEG_SALVE.n, F = (JL_FORT.force != null ? JL_FORT.force : juiceSort('legfort')) ? JL_FORT : null, c = L ? L.teinte : '#ffd36a'; /* (son rang parmi les monstres touches ensemble : seuls les premiers jettent des etincelles) */
  reactionJuicy(mo, rang === 1 || !!F); flashSansSquelette(mo); if (F) mo.flashB = F.flash;
  if (!tue) { reculVisuel(mo, d, F ? F.recul : JL.recul); if (F && !(mo.d && (mo.d.boss || mo.d.demi || mo.d.stable))) mo.sautV = { t: 0, h: F.saut }; }
  if (rang <= JL.max) {
    emettre(FX_VIF, F ? F.gerbe : JL.gerbe, { x: q.x, y: q.y, z: q.z, r: 0.08, v: [d.x * (F ? 8 : 6), F ? 2 : 1.4, d.z * (F ? 8 : 6)], dv: F ? 3.2 : 2.6, vie: [0.16, F ? 0.42 : 0.34], taille: [F ? 0.13 : 0.09, 0.02], c: ['#ffffff', '#ffe9b0', c, c], grav: 8, frein: 2.4, etire: F ? 0.07 : 0.05 });
    if (F) { etoileImpact(q, rang === 1 ? F.etoile * 1.25 : F.etoile, c); const ys = solA(mo.x, mo.z); onde(mo.x, ys + 0.05, mo.z, 0.6 + 0.35 * (mo.d && mo.d.ombre || 1), c, 0.3, 0.8); } }
  if (maintenant - LEG_SON_T >= JL.son) { LEG_SON_T = maintenant; son('impactFleche', undefined, rang === 1 ? (F ? 3 : 1.5) : 0, -450 + hasardCents(140)); }
  if (L && !L.premier) { L.premier = true; if (combat.monstres.filter((o) => o.etat === 'actif').length <= JL.horde) { arretImage(F ? F.arret : JL.arret); if (F) secousse(0.08, 0.16); } }
  if (tue && mo.d && (mo.d.boss || mo.d.demi)) { arretImage(JC.arretBoss); secousse(0.12, 0.22); etoileImpact(q, 1.2, '#ffffff'); }
}
{ const blesserJL = blesser; blesser = function (mo, n, gros, src) {
  if (gros !== true || src != null || JUICE_CRA.coup || !mo || mo.etat !== 'actif' || !combat || combat.fin || !estCoupLeg() || !juiceSort('leg')) return blesserJL.apply(this, arguments);
  const maintenant = performance.now(), neuve = maintenant - LEG_SALVE.t > JL.salve, rang = neuve ? 1 : LEG_SALVE.n + 1;
  const vu = mo.recent; mo.recent = -7; JUICE_CRA.coup = { style: '', gros: true, mos: [], pop: rang === 1 ? 1.6 : 1.25, taille: rang === 1 ? 1 : 0.8 }; /* (les chiffres en arc, le premier plus gros, les autres plus petits : une zone ne couvre pas l'ecran de chiffres ; recent : blesser le pose quand le coup porte vraiment, pas sur une esquive) */
  let r; try { r = blesserJL.apply(this, arguments); } finally { JUICE_CRA.coup = null; }
  if (mo.recent === -7) { mo.recent = vu; return r; } /* (esquive, invulnerable, fumigene : rien ne porte) */
  if (neuve) LEG_SALVE = { t: maintenant, n: 1 }; else LEG_SALVE.n = rang;
  coupLegJuicy(mo); return r;
}; }
