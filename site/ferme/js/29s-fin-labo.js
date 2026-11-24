'use strict';
/* LA FIN DU DONJON DES WABBITS (24/11/2026, Mathieu par Discord : « continue de construire et de creer sur le donjon Wabbit, que ce soit les monstres, les
   animations, les decors... go go go »). Version dev : le donjon n'existe que dans le mode test (ILE-DONJON.md).
   L'histoire (20/11) : vaincre le Docteur Wabbenstein dans son labo pour liberer les Wabbits. Quand il tombe :
   - ses creatures encore debout s'effondrent ;
   - les Wabbits prisonniers sortent des cages du labo (deux par cage), sautillent de joie autour du perso (petits coeurs), puis filent par la porte ;
   - le coffre du labo s'ouvre (l'ecran des coffres, 29m) : kamas, Poils de Wabbit, runes ; la premiere victoire ajoute une rune parfaite sure ;
   - le bilan garde le record de temps (S_.donjons.wabbits : record en secondes, nombre de victoires). */
const FIN_LABO = { duree: 6.2, parCage: 2, coffre: { kamas: kamasGagnes(100000), poils: 12, forge: 2, parfaite: 0.35 } };
const etatDonjons = () => (S_.donjons = S_.donjons || {}), etatDonjonWab = () => (etatDonjons().wabbits = etatDonjons().wabbits || { record: 0, fois: 0 });
let wabbitsLibres = [];
/* les cages du labo : les obstacles ronds de rayon 1 contre le mur, a R - 1,2 du centre (ile-labo-salles.py, salle_labo) */
function cagesLabo() { const S = SALLES_LABO[4]; return (S.blocs || []).filter((b) => Math.abs(b.r - 1.0) < 0.1 && Math.abs(Math.hypot(b.x, b.z) - (S.R - 1.2)) < 0.3); } /* (les cages sont a R - 1,2 ; les paillasses, de meme rayon, a R - 2) */
function liberationLabo() {
  const c = combat, E = donjonEtat; if (!c || !E || E.liberes) return; E.liberes = true;
  c.monstres.forEach((o) => { if (o.etat === 'actif' && !o.d.boss) { try { blesser(o, o.pv + 10, true); } catch (e) { /* rien */ } } }); /* (ses creatures tombent avec lui) */
  const S = SALLES_LABO[4], cx = DONJON.x + S.x, cz = DONJON.z + S.z, sortie = { x: cx + Math.cos(ENTREE_SALLE) * (S.R - 1.1), z: cz + Math.sin(ENTREE_SALLE) * (S.R - 1.1) };
  let cages = cagesLabo(); if (!cages.length) cages = [0, 1, 2, 3].map((k) => { const a = ENTREE_SALLE + Math.PI + (k - 1.5) * 0.5; return { x: Math.cos(a) * (S.R - 1.4), z: Math.sin(a) * (S.R - 1.4) }; });
  const p = paysanMesh.position;
  cages.forEach((g, k) => { for (let j = 0; j < FIN_LABO.parCage; j++) {
    const m = cloner('wabbit'), x0 = cx + g.x * 0.9, z0 = cz + g.z * 0.9; m.position.set(x0, Y_SALLE, z0); m.traverse((q) => { q.raycast = () => {}; }); scene.add(m);
    const a = Math.random() * Math.PI * 2, rr = 1.6 + Math.random() * 1.8; /* (sa place pour sauter de joie, autour du perso) */
    wabbitsLibres.push({ m, x: x0, z: z0, ry: 0, t: -(k * 0.35 + j * 0.2), joie: { x: p.x + Math.cos(a) * rr, z: p.z + Math.sin(a) * rr }, sortie, coeur: Math.random(), ech: m.scale.x });
    pouf(x0, Y_SALLE, z0, 1.0, '#cfeaff'); } });
  toast('Les cages s\'ouvrent : les Wabbits sont libres ! Ils viennent te remercier.', 'or'); son('quete');
  effets.push((dt) => {
    if (!wabbitsLibres.length) return true;
    wabbitsLibres.forEach((W) => { W.t += dt; if (W.t < 0) return;
      const vise = W.t < 3.4 ? W.joie : W.sortie, dx = vise.x - W.x, dz = vise.z - W.z, d = Math.hypot(dx, dz), v = W.t < 3.4 ? 2.6 : 4.2;
      if (d > 0.25) { const pas = Math.min(d, v * dt); W.x += dx / d * pas; W.z += dz / d * pas; W.ry = Math.atan2(dx, dz); }
      else if (W.t < 3.4) { W.ry += dt * 2.2; } /* (arrive : il tourne sur lui-meme en sautant) */
      const saut = Math.abs(Math.sin(W.t * (W.t < 3.4 && d <= 0.25 ? 7 : 9))) * (d <= 0.25 ? 0.55 : 0.32);
      W.m.position.set(W.x, Y_SALLE + saut, W.z); W.m.rotation.y = W.ry;
      if (W.t > 0.6 && W.t < 3.4 && (W.coeur += dt) > 0.55) { W.coeur = Math.random() * 0.2; emettre(FX_LUM, 1, { x: W.x, y: Y_SALLE + 1.1 + saut, z: W.z, r: 0.05, v: [0, 1.0, 0], dv: 0.15, vie: [0.8, 1.1], taille: [0.32, 0.08], c: ['#ff8fb3', '#ff6f9a', '#ffd1e0'], a: 0.95, frein: 1 }); }
      if (W.t >= 3.4 && d < 0.6 && !W.parti) { W.parti = true; pouf(W.x, Y_SALLE, W.z, 0.8, '#d9ffd0'); } /* (il passe la porte) */
      if (W.parti) { W.fin = (W.fin || 0) + dt; W.m.scale.setScalar(W.ech * Math.max(0.01, 1 - W.fin * 3)); } });
    wabbitsLibres = wabbitsLibres.filter((W) => { if (W.fin > 0.35 || !combat) { scene.remove(W.m); return false; } return true; });
    return !wabbitsLibres.length;
  });
}
function retirerWabbitsLibres() { wabbitsLibres.forEach((W) => scene.remove(W.m)); wabbitsLibres = []; }
/* le coffre et le record, au bilan d'une victoire */
{ const finDonjonLabo = finDonjon; finDonjon = function (gagne) {
    const E = donjonEtat, c = combat, t = E ? E.t : 0, enJeu = !!(c && !c.fin && c.genre === 'donjon');
    retirerWabbitsLibres(); const r = finDonjonLabo.apply(this, arguments);
    if (!gagne || !enJeu) return r;
    try {
      const W = etatDonjonWab(), ancien = W.record, premier = !W.fois, nouveau = !ancien || t < ancien; W.fois++; if (nouveau) W.record = Math.round(t);
      const C = FIN_LABO.coffre, G = S_.grange = S_.grange || {}, parfaite = premier || Math.random() < C.parfaite ? 1 : 0;
      S_.kamas += C.kamas; G.poil_wabbit = (G.poil_wabbit || 0) + C.poils; runes().forge = (runes().forge || 0) + C.forge; if (parfaite) runes().parfaite = (runes().parfaite || 0) + 1;
      sauver(); rendreHaut(); rendreGrange();
      const duree = (s) => { s = Math.round(s); const m = Math.floor(s / 60); return (m ? m + ' min ' : '') + (s % 60) + ' s'; };
      const recap = document.querySelector('#carte .recap-combat');
      if (recap) recap.insertAdjacentHTML('beforeend', ligneRecap('etoile', 'Record', nouveau ? duree(t) + (ancien ? ' (nouveau record ! avant : ' + duree(ancien) + ')' : ' (ton premier)') : duree(ancien) + ' (cette fois : ' + duree(t) + ')'));
      const aide = document.querySelector('#carte .hdv-aide'); if (aide) aide.textContent = 'Essai (version dev) : les Wabbits sont libres ! Coffre du labo : ' + fmt(C.kamas) + ' kamas, ' + C.poils + ' Poils de Wabbit, ' + C.forge + ' runes de forgemagie' + (parfaite ? ', 1 rune parfaite' : '') + '. Victoire n° ' + W.fois + '.';
      const cartes = [{ ico: 'kama', n: C.kamas, t: 'kamas', son: 'kamas' }, { ico: 'poil_wabbit', n: C.poils, t: 'Poils de Wabbit' }, { ico: 'rune-forge', n: C.forge, t: 'runes de forgemagie', son: 'quete' }].concat(parfaite ? [{ ico: 'rune-parfaite', n: 1, t: premier ? 'rune parfaite (première victoire)' : 'rune parfaite', brille: true }] : []);
      if (typeof ouvertureMobile === 'function') ouvertureMobile({ rar: premier ? 'legendaire' : 'epique', cartes, titre: 'Le coffre du labo', sousTitre: nouveau ? 'Nouveau record : ' + duree(t) : 'Les Wabbits sont libres !' });
    } catch (e) { console.warn('fin du labo', e); }
    return r; }; }
