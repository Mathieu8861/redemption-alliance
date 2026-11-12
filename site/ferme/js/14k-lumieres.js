'use strict';
/* ===================== LES VRAIES LUMIERES (A L'ESSAI, mode test seulement) =====================
   12/11/2026, Mathieu, devant la maquette de la ferme la nuit sous l'orage : « pour les lampadaires et les lumieres, on n'a pas moyen d'avoir ce rendu-la ?
   On n'a pas l'espece de halo lumineux autour, mais on voit bien que le lampadaire emet de la lumiere : au sol et dans les airs, elle reflechit au sol, elle
   reflechit sur les murs, elle reflechit quand tu passes. Il faudrait que ce soit un peu plus comme ca dans le jeu. »
   Jusque-la, une lanterne allumee, c'etait un halo colle sur son verre et un rond clair peint au sol : rien n'eclairait vraiment. Ici, chaque lanterne allumee
   (et chaque batiment aux fenetres allumees) porte une vraie lumiere chaude, qui eclaire le sol, les murs et le perso qui passe ; le halo se reduit a la lueur
   du verre et le rond peint disparait.
   - Les lumieres coutent a chaque pixel : douze au plus, toujours les memes (les lanternes d'abord, puis les batiments) ; une source de trop garde son halo et son rond peints. Allumees en
     fondu. Elles sont creees a la premiere nuit (un court arret, le temps que les matieres se refassent) puis gardees.
   - En version dev seulement pour l'instant (MODE_TEST), et jamais en graphismes legers. Pour l'ouvrir a tous : retirer MODE_TEST de vraiesLumieresLa, apres
     avoir mesure la fluidite sur une tablette (la nuit lunaire du Golem allume deja les lanternes des joueurs). */
const VRAIES_LUMIERES = { n: 12, couleur: '#ffad55', force: 1.0, portee: 7.5, chute: 1.8, haut: 0.35, fondu: 2.5, relu: 0.4, verre: 0.5, bati: 0.55, jour: 0.35 };
const LUM_J = { P: null, t: 0, actif: false, teinte: null };
const vraiesLumieresLa = () => /* (pour tous depuis le 12/11/2026, « je valide tout », Mathieu ; la fluidite sur tablette n'a pas ete mesuree : en cas de souci, les graphismes legers les coupent) */ !ETAT_TEST.sansLum && graphismes() !== 'leger' && typeof lieu !== 'undefined' && lieu === 'ferme' && !enAccueil;
function sourcesLumiere() { /* ce qui eclaire en ce moment : [cle, x, y, z, force, rang], dans un ordre qui ne depend pas de la camera */
  const L = [];
  lanternesAnim.forEach((A) => { if (A.a > 0.02 && A.halo && A.halo.parent && !(A.halo.material.color.b > A.halo.material.color.r)) { const p = A.halo.position; /* (pas la lanterne UV, violette) */ L.push(['l' + Math.round(p.x * 4) + '_' + Math.round(p.z * 4), p.x, p.y + VRAIES_LUMIERES.haut, p.z, A.a, 0]); } });
  if (typeof lumieresBatA !== 'undefined' && lumieresBatA > 0.02) { const B = new Map(); /* (un batiment : une seule lumiere, au milieu de ses fenetres) */
    trousBat.forEach((g) => { if (!g.hote.parent || g.hote.visible === false) return; let b = B.get(g.hote); if (!b) { b = { x: 0, y: 0, z: 0, n: 0 }; B.set(g.hote, b); } b.x += g.c.x; b.y += g.c.y; b.z += g.c.z; b.n++; });
    B.forEach((b, hote) => { const x = b.x / b.n, z = b.z / b.n, dx = x - hote.position.x, dz = z - hote.position.z, d = Math.hypot(dx, dz) || 1; /* (poussee un peu hors des murs, pour eclairer le sol devant) */
      L.push(['b' + Math.round(x * 4) + '_' + Math.round(z * 4), x + dx / d * 0.6, b.y / b.n + 0.2, z + dz / d * 0.6, lumieresBatA * VRAIES_LUMIERES.bati, 3]); }); }
  /* LES MEMES LUMIERES OU QUE REGARDE LA CAMERA (12/11/2026, « pourquoi, quand je deplace la cam, les lumieres s'intensifient ou baissent ? », Mathieu : elles
     allaient aux sources les plus proches du point regarde, et passaient de l'une a l'autre en fondu quand la camera bougeait). L'ordre ne depend plus de la
     camera : les lanternes d'abord, les plus proches du milieu de la ferme, puis les batiments. */
  L.forEach((s) => { s[6] = s[5] * 1000 + Math.hypot(s[1], s[3]); }); L.sort((a, b) => a[6] - b[6]); return L;
}
function majVraiesLumieres(dt) { /* a chaque image, apres les lanternes */
  const J = LUM_J, V = VRAIES_LUMIERES, la = vraiesLumieresLa();
  if (!la && !J.actif) return;
  J.t -= dt; if (J.t <= 0 || !la) { J.t = V.relu; J.S = la ? sourcesLumiere().slice(0, V.n) : []; }
  const S0 = J.S || [];
  if (!J.P) { if (!S0.length) return; /* (creees a la premiere lanterne allumee) */
    J.teinte = new T.Color(V.couleur); J.P = []; for (let i = 0; i < V.n; i++) { const o = new T.PointLight(V.couleur, 0, V.portee, V.chute); o.castShadow = false; scene.add(o); J.P.push({ o, cle: null, cible: 0 }); } }
  /* chaque lumiere garde sa source tant qu'elle est voulue ; une lumiere libre (eteinte) prend une source pas encore servie */
  const sombre = Math.max(typeof NUIT_J !== 'undefined' && NUIT_J ? NUIT_J.k : 0, (typeof NUIT_F !== 'undefined' && NUIT_F && NUIT_F.actif) || (typeof NUIT !== 'undefined' && NUIT && NUIT.actif) ? 1 : 0), F = V.force * (V.jour + (1 - V.jour) * sombre); /* (sous la pluie en plein jour, elles eclairent bien moins : le soleil est encore la) */
  const voulues = new Map(S0.map((s) => [s[0], s]));
  J.P.forEach((p) => { const s = p.cle && voulues.get(p.cle); if (s) { p.cible = s[4] * F; p.o.position.set(s[1], s[2], s[3]); voulues.delete(p.cle); } else p.cible = 0; });
  J.P.forEach((p) => { if (p.cible || p.o.intensity > 0.01 || !voulues.size) return; const [cle, s] = voulues.entries().next().value; voulues.delete(cle); p.cle = cle; p.o.position.set(s[1], s[2], s[3]); p.cible = s[4] * F; });
  let allume = false;
  J.P.forEach((p) => { const i = p.o.intensity; p.o.intensity = p.cible > i ? Math.min(p.cible, i + dt * V.fondu) : Math.max(p.cible, i - dt * V.fondu); p.o.color.copy(J.teinte); /* (sa couleur : les nuits du jeu bleuissent toutes les lumieres de la scene) */
    if (p.o.intensity > 0.01) allume = true; else if (!p.cible) p.cle = null; });
  /* les lanternes : celle qui porte une vraie lumiere ne garde que la lueur de son verre, sans le rond peint au sol ; une lanterne sans vraie lumiere (plus de
     sources que de lumieres, la ferme vue de loin) garde son halo et son rond, sinon elle parait eteinte (« sur ma map on voit rien », Mathieu, 12/11/2026) */
  const servie = new Map(); J.P.forEach((p) => { if (p.cle) servie.set(p.cle, Math.min(1, p.o.intensity / Math.max(0.01, F))); });
  lanternesAnim.forEach((A) => { const q = A.halo.position, t = la ? servie.get('l' + Math.round(q.x * 4) + '_' + Math.round(q.z * 4)) || 0 : 0;
    A.halo.scale.setScalar(A.r * 1.9 * (1 - (1 - V.verre) * t)); if (A.sol) { A.sol.material.opacity = 1 - t; A.sol.visible = A.a > 0.01 && t < 0.99; } });
  J.actif = la || allume;
}
