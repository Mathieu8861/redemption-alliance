'use strict';
/* LA TOUR A FILETS (a l'essai le 19/11/2026, vrai batiment le 20/11/2026 : « ok fais la tour à filets en vrai bâtiment », Mathieu ; version dev : seulement
   dans le mode test tant que le palier 11 n'est pas sorti, amelioCachee 25-interface.js). La tour mecanique C2 (blender/tour-filet-pistes.py), choisie par
   Mathieu le 19/11 parmi trois pistes (PROPOSITIONS-2026-11-19.md : « tour mecanique j'aime bien mais le design on peut l'ameliorer un peu »).
   - Elle s'achete a l'HDV (Ameliorer, Defense ; 02-donnees.js), se pose toute seule sur une case d'herbe libre pres de la grange (BATIS_CASE), bloque le
     passage comme les autres batiments et se deplace (et se tourne) avec Amenager.
   - Pendant une simu VSA, toutes les 6 s, elle lance un filet leste sur le voleur le plus charge a 10 cases autour d'elle (sinon le plus proche) : il reste
     pris 2 s et lache la moitie de son butin, qui revient a la grange.
   - Elle marche au feu (29e-combustible.js) : la toucher ouvre sa reserve ; sans feu, elle ne tire plus.
   Le modele (le fichier des pistes) ne se charge que si elle est construite. */
const TOUR_FILET = { cadence: 6, portee: 10, pris: 2, part: 0.5 };
let tourFiletEssai = null; /* la tour posee sur la ferme : { m, x, y, z, haut, cd } (construireBatiments la refait) */
let chargeTourFilet = null;
function assurerTourFilet() {
  if (chargeTourFilet) return chargeTourFilet;
  chargeTourFilet = chargerGlb('assets/modeles/jeu/tour-filet-pistes.glb?v=' + VERSION_MODELES).then((sc) => { versToon(sc, { normales: 0.01, sansContour: SC_BATI });
    MODELES.tourFilet = gabaritEchelle(sc, 'TourFiletC2', ECH_TOUR * 1.3, new T.Vector3(0, 0, 0)); construireBatiments(); }).catch(() => { chargeTourFilet = null; });
  return chargeTourFilet;
}
function poserTourFiletBati(pose) { /* (construireBatiments, 11-ferme-3d.js) sur sa case, un huitieme de tour en plus : porte, hublots et barillet face a la camera */
  const b = blocBati('tourFilet'), cd = tourFiletEssai ? tourFiletEssai.cd : 2; tourFiletEssai = null;
  if (!b) return; if (!MODELES.tourFilet) { assurerTourFilet(); return; }
  const m = pose('tourFilet', b.x, b.y, b.z, b.c0.id, Math.PI / 4 + rotDe('tourFilet'));
  tourFiletEssai = { m, x: b.x, y: b.y, z: b.z, haut: (m.userData.hauteur || 4) * 0.82, cd };
}
function lancerFilet(mo) { /* le filet part du haut de la tour, en cloche, et retombe sur le voleur */
  const T0 = tourFiletEssai, a = new T.Vector3(T0.x, T0.y + T0.haut, T0.z), c0 = combat, D = 0.55; let t = 0;
  const filet = new T.Mesh(new T.SphereGeometry(0.35, 8, 6), new T.MeshBasicMaterial({ color: '#e2cf9c', wireframe: true })); sansClic(filet); scene.add(filet);
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') { jeter(filet); return true; }
    const k = Math.min(1, t / D), b = new T.Vector3(mo.x, (mo.m ? mo.m.position.y : 0) + 0.8, mo.z); filet.position.lerpVectors(a, b, k); filet.position.y += Math.sin(Math.PI * k) * 2.2; filet.rotation.y += dt * 9; filet.scale.setScalar(0.6 + k * 1.2);
    if (k < 1) return false; jeter(filet); prendreAuFilet(mo); return true; });
}
function prendreAuFilet(mo) { /* il reste pris, un filet sur le dos, et lache la moitie de ce qu'il porte */
  mo.coince = Math.max(mo.coince || 0, TOUR_FILET.pris); const c0 = combat;
  const f = new T.Mesh(new T.SphereGeometry(0.9, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshBasicMaterial({ color: '#e2cf9c', wireframe: true, transparent: true, opacity: 0.95 })); sansClic(f); scene.add(f); let t = 0;
  effets.push((dt) => { t += dt; const y = mo.m ? mo.m.position.y : 0; f.position.set(mo.x, y + 0.05, mo.z); f.scale.set(1, 1.3, 1); f.material.opacity = t > TOUR_FILET.pris - 0.3 ? Math.max(0, (TOUR_FILET.pris - t) / 0.3) : 0.95; if (t >= TOUR_FILET.pris || combat !== c0 || mo.etat !== 'actif') { jeter(f); return true; } return false; });
  chiffre('Pris au filet !', new T.Vector3(mo.x, (mo.m ? mo.m.position.y : 0) + 2.2, mo.z), 'butin');
  if (mo.porte) { const r = mo.porte, k = Math.max(1, Math.ceil(r.n * TOUR_FILET.part)); S_.grange[r.id] = (S_.grange[r.id] || 0) + k; r.n -= k; chiffre('+' + k + ' ' + r.nom, new T.Vector3(mo.x, 2.8, mo.z), 'butin');
    if (r.n <= 0) { mo.porte = null; if (mo.m) mo.m.children.filter((o) => o.userData && o.userData.sac).forEach((o) => mo.m.remove(o)); } rendreGrange(); }
}
function majTourFilet(dt) { /* chaque image : pendant une simu VSA, un filet toutes les 6 s */
  const T0 = tourFiletEssai; if (!T0 || amelioCachee('tourFilet') || !combat || !combat.raid || combat.fin) return;
  T0.cd -= dt; if (T0.cd > 0) return;
  const L = combat.monstres.filter((o) => o.etat === 'actif' && !(o.coince > 0) && Math.hypot(o.x - T0.x, o.z - T0.z) <= TOUR_FILET.portee); if (!L.length) { T0.cd = 0.3; return; }
  const charges = L.filter((o) => o.porte), d = (o) => Math.hypot(o.x - T0.x, o.z - T0.z), cible = charges.length ? charges.reduce((a, b) => (b.porte.n > a.porte.n ? b : a)) : L.reduce((a, b) => (d(b) < d(a) ? b : a));
  T0.cd = TOUR_FILET.cadence; lancerFilet(cible);
}
effets.push((dt) => { majTourFilet(dt); return false; });
