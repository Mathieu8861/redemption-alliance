'use strict';
/* LA TOUR A FILETS A L'ESSAI (19/11/2026, version dev : mode test seulement). Proposition de la nuit pour « un nouveau moyen de defense contre les simu VSA »
   (PROPOSITIONS-2026-11-19.md) : avant que Mathieu choisisse, il peut la poser et la voir travailler. Le bouton « Tour à filets » du bandeau du mode test
   la pose a cote du chateau (piste A, puis B, puis C, puis plus rien), pour la session seulement : rien n'est enregistre. Pendant une simu VSA, toutes les
   6 s, elle lance un filet leste sur le voleur le plus charge a 5 cases (sinon le plus proche) : il reste pris 2 s et lache la moitie de son butin, qui
   revient a la grange. Modeles : blender/tour-filet-pistes.py. */
const TOUR_FILET = { cadence: 6, portee: 10, pris: 2, part: 0.5 };
let tourFiletEssai = null; /* { piste, m, x, z, haut, cd } */
let tourFiletModeles = null;
async function chargerToursFilet() { if (tourFiletModeles) return tourFiletModeles; const sc = await chargerGlb('assets/modeles/jeu/tour-filet-pistes.glb?v=' + VERSION_MODELES); versToon(sc, { normales: 0.01, sansContour: SC_BATI }); return (tourFiletModeles = sc); }
function caseTourFilet() { /* une case libre a deux cases du chateau, cote camera */
  const G = S_.cases.filter((c) => c.type === 'grange'), L = S_.cases.filter((c) => c.type === 'libre'); let best = null;
  for (const t of G) for (const c of L) { if (Math.abs(c.i - t.i) === 2 && c.j === t.j && (!best || c.i + c.j > best.i + best.j)) best = c; } return best || L[0];
}
async function poserTourFilet(piste) {
  if (tourFiletEssai) { jeter(tourFiletEssai.m); tourFiletEssai = null; } if (!piste) { toast('Tour à filets retirée.'); return; }
  const sc = await chargerToursFilet(), m = gabaritEchelle(sc, 'TourFilet' + piste, ECH_TOUR * 1.3, new T.Vector3(0, 0, 0)), c = caseTourFilet(), q = posCase(c); poser(m, q.x, q.y, q.z); sansClic(m);
  tourFiletEssai = { piste, m, x: q.x, z: q.z, y: q.y, haut: (m.userData.hauteur || 4) * 0.82, cd: 2 };
  toast('Tour à filets (piste ' + piste + ', essai) posée à côté du château. Lance une simu VSA dans les réglages du mode test pour la voir travailler.', 'or');
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
  const T0 = tourFiletEssai; if (!T0 || !MODE_TEST || !combat || !combat.raid || combat.fin) return;
  if (T0.piste === 'B') { if (!T0.sonne) { T0.sonne = true; toast('La cloche de la tour sonne : les voleurs de VSA vont 15 % moins vite près de la tour.', 'or'); } combat.monstres.forEach((o) => { o.cloche = o.etat === 'actif' && Math.hypot(o.x - T0.x, o.z - T0.z) <= TOUR_FILET.portee ? 0.3 : 0; }); } /* (la cloche de la piste B : 15 % plus lents a sa portee) */
  T0.cd -= dt; if (T0.cd > 0) return;
  const L = combat.monstres.filter((o) => o.etat === 'actif' && !(o.coince > 0) && Math.hypot(o.x - T0.x, o.z - T0.z) <= TOUR_FILET.portee); if (!L.length) { T0.cd = 0.3; return; }
  const charges = L.filter((o) => o.porte), d = (o) => Math.hypot(o.x - T0.x, o.z - T0.z), cible = charges.length ? charges.reduce((a, b) => (b.porte.n > a.porte.n ? b : a)) : L.reduce((a, b) => (d(b) < d(a) ? b : a));
  T0.cd = TOUR_FILET.cadence; lancerFilet(cible);
}
effets.push((dt) => { majTourFilet(dt); return false; });
/* le bouton du bandeau du mode test : A, B, C, puis plus rien */
const bandeauTestFilet = bandeauTest; bandeauTest = function () { bandeauTestFilet(); const b = document.getElementById('bandeau-test'); if (b && !b.querySelector('[data-tour-filet]')) b.insertAdjacentHTML('beforeend', '<button class="btn mini" data-tour-filet="1">Tour à filets</button>'); };
document.addEventListener('click', (e) => { const b = e.target.closest('[data-tour-filet]'); if (!b || !MODE_TEST || !estAdmin()) return; if (lieu !== 'ferme') { toast('Rentre d\'abord à la ferme.'); return; }
  const suite = { '': 'A', A: 'B', B: 'C', C: '' }[tourFiletEssai ? tourFiletEssai.piste : ''], p = poserTourFilet(suite); b.textContent = suite ? 'Tour à filets : ' + suite : 'Tour à filets'; return p; });
