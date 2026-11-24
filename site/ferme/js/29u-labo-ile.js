'use strict';
/* L'ILE DU LABO, CE QU'ON Y TROUVE (24/11/2026, Mathieu : « pour debloquer la premiere salle du donjon, il faut trouver la cle, la ou t'as mis un wabbit mutant geant,
   au fond de la map : faut se taper beaucoup de combats avant d'y aller ; une fois qu'on a cette cle-la, a chaque salle on recupere la cle de la suivante », puis
   « qu'on puisse recolter des carottes comme si c'etait des champs, recolter certaines ressources, qu'il y ait des petits coffres a certains endroits, avec des
   choses dedans : des potions, des bananagrumes, une rune de forgemagie au bout d'un moment, plus on avance loin dans l'ile ; des coffres aleatoires, en fonction
   de ta chance, 10 % que ce soit ca... »). Version dev : le labo n'existe que dans le mode test.
   - LA CLE DU LABO : le Garou alpha (le mini-boss du sommet de la butte, au fond de l'ile) la lache en tombant ; sans elle, la premiere porte de la tour reste
     fermee (29c-ile-wabbits.js, tickDonjon) ; ensuite chaque salle nettoyee ouvre la grille de la suivante, comme avant.
   - LES RECOLTES : dans les cinq champs, des Cawottes mures (plus grosses, une lueur verte au pied) ; on passe dessus ou on les touche : 3 a 5 Cawottes, plus avec
     la prospection ; elles repoussent au bout de 6 min.
   - LES COFFRES : neuf petits coffres poses dans l'ile, plus riches a mesure qu'on s'eloigne du ponton (commun pres des champs, rare a la lisiere et au marais,
     precieux au fond de la foret, sur la butte et pres de la plage du fond) ; on les ouvre en passant contre ou en les touchant ; ce qu'ils donnent est tire au
     hasard (COFFRES_ILE_LABO), la prospection augmente les chances ; un par partie. Le modele : les coffres du podium de l'ile des boss (29k), en petit. */
/* (24/11/2026 au soir, « faudrait peut-etre une esthetique de coffre adaptee a l'ile ; la rarete du coffre, c'est en fonction de ta chance, on va pas faire des coffres
   differents sur l'ile », Mathieu) : un seul coffre, celui du labo (une caisse de fer cerclee de cuivre, une fenetre de mutagene qui luit, un cadenas vert ;
   coffreLaboMesh), et son rang se tire a l'ouverture (TIRAGE_COFFRE_LABO : precieux 10 %, rare 30 %, sinon commun, fois la prospection) */
const RECOLTE_LABO = { parChamp: 4, min: 3, max: 5, repousse: 360, contact: 1.25 };
const COFFRES_ILE_LABO = {
  commun: { look: 'rare', nom: 'Petit coffre', kamas: [3000, 6000], L: [[0.6, 'pot', ['petit', 'grand'], 1, 2], [0.5, 'res', 'bananagrume', 2, 4], [0.4, 'res', 'poil_wabbit', 1, 3], [0.05, 'forge', 1, 1]] },
  rare: { look: 'epique', nom: 'Coffre rare', kamas: [8000, 14000], L: [[0.7, 'pot', ['menthe', 'fraise', 'citron'], 1, 2], [0.5, 'res', 'bananagrume', 3, 5], [0.6, 'res', 'poil_wabbit', 2, 4], [0.25, 'forge', 1, 1], [0.05, 'cristal', 1, 1]] },
  precieux: { look: 'legendaire', nom: 'Coffre précieux', kamas: [18000, 28000], L: [[1, 'forge', 1, 1], [0.6, 'pot', ['menthe', 'fraise', 'citron'], 2, 2], [0.1, 'pot', ['royale'], 1, 1], [0.2, 'cristal', 1, 1], [0.04, 'parfaite', 1, 1]] } };
const TIRAGE_COFFRE_LABO = { precieux: 0.10, rare: 0.30 };
function rangCoffreLabo() { const k = prosLabo(), u = Math.random(); return u < TIRAGE_COFFRE_LABO.precieux * k ? 'precieux' : u < (TIRAGE_COFFRE_LABO.precieux + TIRAGE_COFFRE_LABO.rare) * k ? 'rare' : 'commun'; }
/* LE COFFRE DU LABO : une caisse de fer sombre cerclee de cuivre, des coins de laiton rivetes, une fenetre de mutagene qui luit devant, un couvercle a charniere
   (ch, il pivote sur l'arete du fond) avec sa poignee et son cadenas vert ; dedans, une lueur verte qu'on voit a l'ouverture */
function coffreLaboMesh() {
  const g = new T.Group(), ch = new T.Group(), fer = mat('#3c4047'), ferF = mat('#2b2e33'), cu = mat('#b8743a'), cuF = mat('#8a521f'), la = mat('#c9a24a'), lum = new T.MeshBasicMaterial({ color: '#8dff6a' }), lumF = new T.MeshBasicMaterial({ color: '#4fd14a' });
  const B = (w, h, d, m, x, y, z, par) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); (par || g).add(o); return o; };
  const riv = (x, y, z, par) => { const o = new T.Mesh(new T.SphereGeometry(0.022, 6, 5), la); o.position.set(x, y, z); (par || g).add(o); };
  B(1.06, 0.06, 0.72, ferF, 0, 0.03, 0); B(1.0, 0.5, 0.66, fer, 0, 0.3, 0); /* (le socle, la caisse) */
  [-0.3, 0.3].forEach((x) => { B(0.1, 0.52, 0.69, cu, x, 0.3, 0); [0.12, 0.3, 0.48].forEach((y) => { riv(x, y, 0.35); riv(x, y, -0.35); }); }); /* (deux cercles de cuivre rivetes) */
  [[-0.49, -0.32], [0.49, -0.32], [-0.49, 0.32], [0.49, 0.32]].forEach(([x, z]) => B(0.07, 0.54, 0.07, la, x, 0.3, z)); /* (les coins de laiton) */
  B(0.38, 0.25, 0.03, cuF, 0, 0.3, 0.335); B(0.3, 0.17, 0.02, lum, 0, 0.3, 0.348); B(0.3, 0.03, 0.025, lumF, 0, 0.245, 0.349); /* (la fenetre de mutagene, son niveau plus sombre en bas) */
  [-0.12, 0.12].forEach((x) => [0.205, 0.395].forEach((y) => riv(x * 1.45, y, 0.355)));
  B(0.9, 0.02, 0.58, lumF, 0, 0.552, 0); /* (la lueur dedans) */
  ch.position.set(0, 0.55, -0.33); g.add(ch); /* (le couvercle : sa charniere sur l'arete du fond) */
  B(1.02, 0.14, 0.68, fer, 0, 0.07, 0.33, ch); B(0.94, 0.05, 0.6, ferF, 0, 0.16, 0.33, ch);
  [-0.3, 0.3].forEach((x) => { B(0.1, 0.16, 0.71, cu, x, 0.07, 0.33, ch); riv(x, 0.155, 0.12, ch); riv(x, 0.155, 0.55, ch); });
  [[-0.5, 0], [0.5, 0], [-0.5, 0.66], [0.5, 0.66]].forEach(([x, z]) => B(0.06, 0.16, 0.06, la, x, 0.07, z, ch));
  { const an = new T.Mesh(new T.TorusGeometry(0.11, 0.022, 6, 14, Math.PI), la); an.position.set(0, 0.19, 0.33); ch.add(an); } /* (la poignee) */
  B(0.14, 0.16, 0.06, la, 0, -0.02, 0.69, ch); B(0.06, 0.06, 0.02, lum, 0, -0.02, 0.725, ch); /* (le cadenas, son voyant vert) */
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  ch.userData.articule = true; fusionner(g); fusionner(ch); /* (une quarantaine de pieces : soudees par matiere, le corps d'un cote, le couvercle de l'autre ; sinon les 9 coffres doublaient les dessins de l'ile, le lag du 24/11/2026) */
  return { g, ch };
}
/* leurs places (en coordonnees de l'ile) : la premiere libre autour de chaque point ; le rang suit l'eloignement du ponton */
const PLACES_COFFRES_LABO = [['commun', () => leLongDuChemin(41, 10.5)], ['commun', () => leLongDuChemin(30, -12)], ['commun', () => polL(0.15, 38)],
  ['rare', () => polL(2.0, 33)], ['rare', () => polL(5.6, 26)], ['rare', () => polL(1.35, 25)],
  ['precieux', () => polL(2.8, 44)], ['precieux', () => polL(4.15, 37)], ['precieux', () => polL(3.45, 46.5)]];
const butinLabo = { recoltes: [], coffres: [] };
/* ---------- 1. LA CLE ---------- */
{ const butinCle = butin; butin = function (mo) { const r = butinCle.apply(this, arguments);
    try { const E = donjonEtat; if (E && combat && combat.genre === 'donjon' && mo.chef && mo.type === 'wabGarou' && !E.cleLabo) { E.cleLabo = true;
        if (typeof chiffre === 'function') chiffre('🔑 Clé du labo', new T.Vector3(mo.x, (mo.m ? mo.m.position.y : 0) + (mo.haut || 3) + 0.8, mo.z), 'gros');
        toast('🔑 Le Garou alpha lâche la clé du labo ! La première porte de la tour s\'ouvrira pour toi.', 'or'); son('quete'); confettis(30); majCombatHud(); } } catch (e) { /* rien */ }
    return r; }; }
{ const majHudCle = majCombatHud; majCombatHud = function () { const r = majHudCle.apply(this, arguments);
    try { if (combat && combat.genre === 'donjon' && donjonEtat && donjonEtat.cleLabo) { const t = $('combat-titre'); if (t && t.textContent.indexOf('🔑') < 0) t.textContent += ' · 🔑 clé du labo'; } } catch (e) { /* rien */ }
    return r; }; }
/* ---------- 2. LA POSE : recoltes et coffres, une fois l'ile construite (avant la grille des chemins : les coffres sont des obstacles) ---------- */
{ const construireButin = construireIleWabbits; construireIleWabbits = async function () { const g = await construireButin.apply(this, arguments);
    try { await poserButinLabo(g); } catch (e) { console.warn('butin du labo', e); } delete GRILLES_CH.sol; grilleCh('sol'); return g; }; }
async function poserButinLabo(g) {
  const P0 = g.userData.protos || {};
  /* les Cawottes mures, dans les rangs des champs */
  CHAMPS_LABO.forEach((F) => { const c = Math.cos(F.a), s = Math.sin(F.a), en = (u, v) => ({ x: F.x + c * u - s * v, z: F.z + s * u + c * v });
    for (let k = 0; k < RECOLTE_LABO.parChamp; k++) { const q = en(-2.6 + k * 1.75, k % 2 ? 1.0 : -1.0); if (!P0.cawotte) break;
      const grp = new T.Group(), m = new T.Group(), f = P0.cawotte.clone(true); f.position.set(0, 0.05, 0); f.rotation.set(0, 0, 0); f.scale.setScalar(2.1); m.add(f); fusionner(m); grp.add(m); /* (soudee : 14 dessins par cawotte, 280 pour les 20 de l'ile, la moitie du lag du 24/11/2026) */ /* (les fanes sur la racine ; la piece garde sinon sa place dans le fichier) */
      const lueur = new T.Mesh(new T.RingGeometry(0.28, 0.45, 20), new T.MeshBasicMaterial({ color: '#b6ff7a', transparent: true, opacity: 0.55, depthWrite: false, side: T.DoubleSide })); lueur.rotation.x = -Math.PI / 2; lueur.position.y = 0.05; lueur.raycast = () => {}; grp.add(lueur);
      grp.position.set(q.x, hTerrainLabo(q.x, q.z) + 0.04, q.z); grp.rotation.y = k * 1.3; g.add(grp); butinLabo.recoltes.push({ x: q.x, z: q.z, grp, m, lueur, ph: k * 0.9 }); } });
  /* les coffres */
  PLACES_COFFRES_LABO.forEach(([rang, f], k) => { let q = f(), ok = null;
    for (let i = 0; i < 40 && !ok; i++) { const a = i * 2.4, d = i * 0.35, x = q.x + Math.cos(a) * d, z = q.z + Math.sin(a) * d; if (libreSolLabo(x, z, 1.1) && hTerrainLabo(x, z) > -0.2) ok = { x, z }; }
    if (!ok) return; const C = coffreLaboMesh(); void rang;
    const grp = C.g; grp.scale.setScalar(1.05); grp.position.set(ok.x, hTerrainLabo(ok.x, ok.z), ok.z); grp.rotation.y = Math.atan2(-ok.x, -ok.z); g.add(grp);
    ajouterBlocLabo(ok.x, ok.z, 0.55); butinLabo.coffres.push({ rang: null, x: ok.x, z: ok.z, grp, ch: C.ch, ouvert: false }); }); /* (rang : tire a l'ouverture) */
}
/* une nouvelle partie : tout repousse, les coffres se referment */
{ const partirButin = partirDonjon; partirDonjon = async function () { butinLabo.recoltes.forEach((R) => { R.pret = 0; R.grp.visible = true; R.m.scale.setScalar(1); });
    butinLabo.coffres.forEach((C) => { C.ouvert = false; if (C.ch) C.ch.rotation.x = 0; }); return partirButin.apply(this, arguments); }; }
/* ---------- 3. RECOLTER ET OUVRIR : au contact, ou en les touchant (le perso y va) ---------- */
const prosLabo = () => 1 + (caracs().prospection || 0) / 100;
function recolterLabo(R) {
  const E = donjonEtat; if (!E || R.pret > E.t) return; R.pret = E.t + RECOLTE_LABO.repousse; const n = Math.round((RECOLTE_LABO.min + Math.random() * (RECOLTE_LABO.max - RECOLTE_LABO.min)) * Math.min(2, prosLabo()));
  const G = S_.grange = S_.grange || {}; G.cawotte = (G.cawotte || 0) + n; const y = hTerrainLabo(R.x, R.z);
  if (typeof chiffre === 'function') chiffre('+' + n + ' ' + nomRessources('cawotte', n), new T.Vector3(DONJON.x + R.x, y + 1.6, DONJON.z + R.z), 'butin');
  mottes(DONJON.x + R.x, y, DONJON.z + R.z, 6, 0.5); son('fauchage'); rendreGrange();
  let t = 0; effets.push((dt) => { t += dt; const k = Math.min(1, t / 0.35); R.m.position.y = k * 0.9; R.m.scale.setScalar(1 - k); if (k < 1) return false; R.grp.visible = false; R.m.position.y = 0; return true; }); /* (elle saute hors de terre, puis disparait) */
}
function tirerCoffreLabo(rang) {
  const T0 = COFFRES_ILE_LABO[rang], pros = prosLabo(), G = S_.grange = S_.grange || {}, txt = [], hasard = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const kamas = kamasGagnes(hasard(T0.kamas[0], T0.kamas[1])); S_.kamas += kamas; txt.push(fmt(kamas) + ' kamas');
  T0.L.forEach(([p, type, a, b, c]) => { if (Math.random() >= Math.min(1, p * pros)) return;
    if (type === 'pot') { const t = a[Math.floor(Math.random() * a.length)], n = hasard(b, c); S_.pots[t] = (S_.pots[t] || 0) + n; txt.push(n + ' ' + (n > 1 ? POTS[t].court : POTS[t].nom).toLowerCase()); }
    else if (type === 'res') { const n = hasard(b, c); G[a] = (G[a] || 0) + n; txt.push(n + ' ' + nomRessources(a, n)); }
    else if (type === 'forge') { runes().forge = (runes().forge || 0) + a; txt.push(a + ' rune de forgemagie'); }
    else if (type === 'parfaite') { runes().parfaite = (runes().parfaite || 0) + a; txt.push('une rune parfaite !'); }
    else if (type === 'cristal' && typeof gagnerCristaux === 'function') { gagnerCristaux(a); txt.push(a + ' cristal runique'); } });
  return txt;
}
function ouvrirCoffreLabo(C) {
  if (C.ouvert) return; C.ouvert = true; C.rang = rangCoffreLabo(); const T0 = COFFRES_ILE_LABO[C.rang], txt = tirerCoffreLabo(C.rang), y = hTerrainLabo(C.x, C.z);
  son(C.rang === 'precieux' ? 'niveau' : 'quete'); confettis(C.rang === 'precieux' ? 30 : 12); rendreHaut(); rendreGrange(); sauver();
  if (typeof chiffre === 'function') chiffre('✦ ' + T0.nom, new T.Vector3(DONJON.x + C.x, y + 1.8, DONJON.z + C.z), 'butin');
  emettre(FX_VIF, 18, { x: DONJON.x + C.x, y: y + 0.6, z: DONJON.z + C.z, r: 0.3, dv: 3, haut: true, vie: [0.4, 0.8], taille: [0.14, 0.05], c: ['#fff3c4', '#ffd27a', '#ffffff'], grav: 6 });
  toast('✦ ' + T0.nom + ' : ' + txt.join(', ') + '.', 'or');
  if (C.rang !== 'commun') { const col = C.rang === 'precieux' ? '#c27dff' : '#5fd4ff'; emettre(FX_LUM, 26, { x: DONJON.x + C.x, y: y + 0.7, z: DONJON.z + C.z, r: 0.35, v: [0, 2.6, 0], dv: 1.2, vie: [0.6, 1.0], taille: [0.22, 0.04], c: ['#ffffff', col], a: 0.95, frein: 0.4 }); } /* (un rare jaillit en bleu, un precieux en violet) */
  let t = 0; effets.push((dt) => { t += dt; if (C.ch) C.ch.rotation.x = -1.9 * Math.min(1, t / 0.45); return t >= 0.45; }); /* (le couvercle s'ouvre) */
}
/* un clic pres d'une recolte ou d'un coffre : le perso y va (on ouvre a l'arrivee, au contact) */
{ const cheminButin = cheminDonjon; cheminDonjon = function (p) { const E = donjonEtat; if (E && E.perso && E.perso.mode === 'sol') {
      const lx = p.x - DONJON.x, lz = p.z - DONJON.z, pres = (o, r) => Math.hypot(o.x - lx, o.z - lz) < r;
      const C = butinLabo.coffres.find((o) => !o.ouvert && pres(o, 1.6)), R = !C && butinLabo.recoltes.find((o) => o.grp.visible && pres(o, 0.9));
      const o = C || R; if (o) { const d = Math.hypot(o.x, o.z) || 1; return cheminButin.call(this, { x: DONJON.x + o.x * (1 - 1.0 / d), y: p.y, z: DONJON.z + o.z * (1 - 1.0 / d) }); } }
    return cheminButin.apply(this, arguments); }; }
{ const tickButin = tickDonjon; tickDonjon = function (dt) { const r = tickButin.apply(this, arguments);
    try { const E = donjonEtat; if (!E || lieu !== 'donjon' || E.arrivee || !E.perso || E.perso.mode !== 'sol') return r; const p = paysanMesh.position, lx = p.x - DONJON.x, lz = p.z - DONJON.z, t = E.t;
      butinLabo.recoltes.forEach((R) => { if (!R.grp.visible && !(R.pret > t)) { R.grp.visible = true; R.m.scale.setScalar(1); } /* (repousse) */
        if (R.grp.visible && Math.random() < dt * 1.5 && Math.abs(R.x - lx) + Math.abs(R.z - lz) < 30) emettre(FX_LUM, 1, { x: DONJON.x + R.x + (Math.random() - 0.5) * 0.5, y: hTerrainLabo(R.x, R.z) + 0.4, z: DONJON.z + R.z + (Math.random() - 0.5) * 0.5, r: 0.05, v: [0, 0.9, 0], dv: 0.2, vie: [0.6, 1.0], taille: [0.12, 0.03], c: ['#fff3a0', '#b6ff7a'], a: 0.9, frein: 0.5 }); /* (des etincelles : elle est mure) */
        if (R.grp.visible) { R.lueur.material.opacity = 0.35 + 0.25 * Math.sin(t * 3 + R.ph); if (Math.hypot(R.x - lx, R.z - lz) < RECOLTE_LABO.contact && !(R.pret > t)) recolterLabo(R); } });
      butinLabo.coffres.forEach((C) => { if (!C.ouvert && Math.hypot(C.x - lx, C.z - lz) < 1.55) ouvrirCoffreLabo(C); }); } catch (e) { /* rien */ }
    return r; }; }
