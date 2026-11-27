'use strict';
/* LA MEMOIRE DU JEU (27/11/2026, « le jeu consomme entre 1,3 et 1,6 Go de memoire, c'est normal ? » puis « il faut que l'on n'ait pas besoin de tout garder :
   la ferme quand t'es a la ferme, l'ile quand t'es sur l'ile, l'arene quand t'es sur l'arene, et quand tu bouges, ca garde pas la ou tu etais ; les gens qui ont
   des petits PC, et sur telephone... », Mathieu). Mesure du 27/11 (traces/chargement/plans-memoire*.js) : la ferme garde 194 Mo de modeles ; une visite du labo
   en laissait 33 Mo de plus (son ile, cachee mais gardee) et 236 Mo de textures (11 textures de 2048 x 2048 pour ses mutants), meme rentre a la ferme.
   1. LES TEXTURES des modeles a squelette (les monstres faits par IA) ramenees a 1024 au chargement : quatre fois moins de memoire, la meme image a la
      distance ou l'on joue ;
   2. LE LABO DES WABBITS VIDE en rentrant a la ferme : son ile, ses salles, ses coffres, ses mutants et leurs textures ; tout se recharge a la visite suivante
      (comme au premier voyage). Ses obstacles fixes (le decor, toujours le meme) restent : ils ne pesent rien et ne se dedoublent pas a la reconstruction */
const MEMOIRE = { texMax: 1024, vides: 0 };
function plafonnerTextures(root, max) { /* chaque texture plus grande que max (en largeur ou en hauteur) redessinee a max, dans la meme texture */
  const faits = new Set(); let n = 0;
  root.traverse((o) => { (Array.isArray(o.material) ? o.material : o.material ? [o.material] : []).forEach((m) => {
    const T0 = []; Object.values(m).forEach((v) => { if (v && v.isTexture) T0.push(v); }); if (m.uniforms) Object.values(m.uniforms).forEach((u) => { if (u && u.value && u.value.isTexture) T0.push(u.value); });
    T0.forEach((t) => { if (faits.has(t)) return; faits.add(t); const im = t.image, w = im && im.width, h = im && im.height; if (!(w > max || h > max)) return;
      const s = max / Math.max(w, h), cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w * s)); cv.height = Math.max(1, Math.round(h * s));
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); t.image = cv; t.needsUpdate = true; n++; if (im.close) try { im.close(); } catch (e) { /* rien */ } }); }); });
  return n;
}
{ const preparerSqMem = preparerSquelette; preparerSquelette = function (sc) { try { plafonnerTextures(sc, MEMOIRE.texMax); } catch (e) { console.warn('textures', e); } return preparerSqMem.apply(this, arguments); }; }
if (typeof chargerDrone === 'function') { const droneMem = chargerDrone; chargerDrone = function () { const p = droneMem.apply(this, arguments);
    if (p && !p.plafond) { p.plafond = true; p.then(() => { if (DRONE_GLB) plafonnerTextures(DRONE_GLB, MEMOIRE.texMax); }).catch(() => {}); } return p; }; }
/* tout ce que dessine un groupe, rendu a la carte graphique (geometries, matieres, textures), sauf ce que la ferme ou un modele garde utilise aussi
   (la montgolfiere, les monstres du public de l'Arene, les matieres partagees) : ressourcesGardees */
function ressourcesGardees(sauf) { const G = new Set(), ajouter = (r) => r && r.traverse && r.traverse((o) => { if (o.geometry) G.add(o.geometry);
    (Array.isArray(o.material) ? o.material : o.material ? [o.material] : []).forEach((m) => { G.add(m); Object.values(m).forEach((v) => { if (v && v.isTexture) G.add(v); }); if (m.uniforms) Object.values(m.uniforms).forEach((u) => { if (u && u.value && u.value.isTexture) G.add(u.value); }); }); });
  scene.children.forEach((o) => { if (!sauf.includes(o)) ajouter(o); });
  Object.values(MODELES).forEach((r) => { if (sauf.includes(r)) return; if (Array.isArray(r)) r.forEach(ajouter); else if (r && r.isObject3D) ajouter(r); else if (r && typeof r === 'object') Object.values(r).forEach((x) => { if (x && x.isObject3D) ajouter(x); else if (x && typeof x === 'object') Object.values(x).forEach(ajouter); }); });
  return G; }
function jeterTout(root, garder) { const vus = new Set(), g = garder || new Set();
  root.traverse((o) => { if (o.geometry && !vus.has(o.geometry)) { vus.add(o.geometry); if (!g.has(o.geometry)) o.geometry.dispose(); }
    (Array.isArray(o.material) ? o.material : o.material ? [o.material] : []).forEach((m) => { if (vus.has(m)) return; vus.add(m);
      Object.values(m).forEach((v) => { if (v && v.isTexture && !vus.has(v)) { vus.add(v); if (!g.has(v)) v.dispose(); } });
      if (m.uniforms) Object.values(m.uniforms).forEach((u) => { const v = u && u.value; if (v && v.isTexture && !vus.has(v)) { vus.add(v); if (!g.has(v)) v.dispose(); } }); if (!g.has(m)) m.dispose(); }); });
}
/* vide un lieu : ses groupes sortis de la scene et rendus a la carte graphique */
function viderGroupes(L) { L = L.filter(Boolean); if (!L.length) return; L.forEach((x) => scene.remove(x)); const G = ressourcesGardees(L); L.forEach((x) => jeterTout(x, G)); }
function retirerBlocLabo(o) { BLOCS_LABO.forEach((L) => { const i = L.indexOf(o); if (i >= 0) L.splice(i, 1); }); }
function viderLabo() {
  if (typeof ileWabbits === 'undefined' || !ileWabbits || lieu === 'donjon' || (combat && combat.genre === 'donjon')) return false;
  const g = ileWabbits; ileWabbits = null; ileWabbitsPromesse = null; viderGroupes([g]);
  try { butinLabo.coffres.forEach((C) => { if (C.ob) retirerBlocLabo(C.ob); }); butinLabo.coffres.length = 0; butinLabo.recoltes.length = 0; } catch (e) { /* rien */ }
  try { contoursTrou.clear(); } catch (e) { /* rien */ }
  try { if (CUVE_WAB) { clearInterval(CUVE_WAB.userData.bulles); scene.remove(CUVE_WAB); jeterTout(CUVE_WAB); CUVE_WAB = null; } } catch (e) { /* rien */ }
  { const N = MUTANTS_LABO.map(([n]) => n).concat(['wabbenstein']).filter((n) => MODELES[n] && !SQ_EN_COURS[n]), M = N.map((n) => MODELES[n]); N.forEach((n) => { delete MODELES[n]; }); const G = ressourcesGardees([]); M.forEach((x) => jeterTout(x, G)); } /* (ils se rechargent au depart vers l'ile, ou a l'arrivee du Docteur) */
  try { if (DRONE_GLB) { jeterTout(DRONE_GLB); DRONE_GLB = null; chargerDrone.p = null; } } catch (e) { /* rien */ }
  MEMOIRE.vides++; return true;
}
/* L'ARENE (son colisee et ses cartes : temple, volcan, mine, ciel), L'ILE DES BOSS ET LE CASINO (l'ile, la salle du palais, le bureau du patron) : vides en
   rentrant a la ferme, recharges a la visite suivante (leurs chargeurs ne construisent que ce qui manque) */
function viderArene() { if (lieu === 'arene' || (combat && combat.arene)) return false; const L = [ileArene]; Object.values(CARTES_ARENE).forEach((C) => { if (C.g) L.push(C.g); });
  if (!L.some(Boolean)) return false; viderGroupes(L); ileArene = null; Object.values(CARTES_ARENE).forEach((C) => { C.g = null; }); if (typeof DV !== 'undefined') DV.arene = null; MEMOIRE.vides++; return true; }
function viderIleBoss() { if (!ileBoss || lieu === 'ile' || (combat && combat.genre === 'ile')) return false; viderGroupes([ileBoss]); ileBoss = null; if (typeof DV !== 'undefined') DV.ile = null; MEMOIRE.vides++; return true; }
function viderCasino() { if (lieu === 'casino' || course || !(ileCasino || salleCasino || bureauCasino)) return false;
  viderGroupes([ileCasino, salleCasino, bureauCasino]); ileCasino = null; casinoAnim = null; salleCasino = null; barman = null; gardesSalle = []; bureauCasino = null; patronB = null; feuB = null; poissonsB = null; porteFondateur = null;
  try { porteAnim = null; } catch (e) { /* rien */ } try { fumeeB.length = 0; } catch (e) { /* rien */ }
  try { Object.assign(ROUE3D, { g: null, disque: null, clapet: null, lampes: [], anim: null, ouvert: false }); } catch (e) { /* rien */ } /* (la roue du hall : reconstruite avec la salle, 29o-roue-3d.js) */ MEMOIRE.vides++; return true; }
function viderLieux() { const R = {}; [['labo', viderLabo], ['arene', viderArene], ['ile', viderIleBoss], ['casino', viderCasino]].forEach(([k, f]) => { try { R[k] = f(); } catch (e) { R[k] = 'erreur'; console.warn('vider ' + k, e); } }); return R; }
/* en rentrant a la ferme : on vide ce qu'on quitte (une seconde apres, le voile leve) */
{ const rentrerMem = rentrerFerme; rentrerFerme = async function () { const r = await rentrerMem.apply(this, arguments);
    setTimeout(() => { if (lieu === 'ferme' && !combat) viderLieux(); }, 1200); return r; }; }
/* LES NIVEAUX DEPASSES DES BATIMENTS (27/11/2026) : tous les niveaux de la grange, de l'HDV, du puits et de la geliere etaient gardes (52 Mo de batiments sur
   la ferme) ; seul le niveau actuel s'affiche, et un batiment ne redescend jamais : les niveaux en dessous sont rendus. Gardes : le niveau actuel et ceux au-dessus
   (les ameliorations), la geliere 1 (le jeu s'en sert pour savoir que les gelieres sont chargees), les granges 5 et 6 avec le chateau. Si un niveau rendu est
   quand meme demande (une autre partie chargee dans le mode test), le plus proche le remplace au lieu de planter */
const NIVEAUX_PASSES = { grange: () => (nivBat('qg') >= 6 ? 4 : nivBat('qg') - 1), hdv: () => nivBat('nivEtal') - 1, puits: () => nivBat('nivPuits') - 1, geliere: () => (niv('geliere') ? nivModeleGeliere() - 1 : 0) };
function libererNiveauxPasses() { if (!S_ || !S_.amelio) return 0; const L = [];
  Object.entries(NIVEAUX_PASSES).forEach(([f, k]) => { let max = 0; try { max = k(); } catch (e) { return; }
    for (let n = f === 'geliere' ? 2 : 1; n <= max; n++) { const M = MODELES[f + n]; if (M && (MODELES[f + (max + 1)] || f === 'grange')) { L.push(M); delete MODELES[f + n]; } } });
  if (!L.length) return 0; const G = ressourcesGardees([]); L.forEach((M) => jeterTout(M, G)); MEMOIRE.niveaux = (MEMOIRE.niveaux || 0) + L.length; return L.length; }
{ const clonerMem = cloner; cloner = function (nom) { if (!MODELES[nom]) { const m = /^(grange|hdv|puits|geliere)(\d+)$/.exec(nom); if (m) { const f = m[1], n = +m[2]; let r = null;
      for (let d = 1; d < 8 && !r; d++) { if (MODELES[f + (n + d)]) r = f + (n + d); else if (n - d >= 1 && MODELES[f + (n - d)]) r = f + (n - d); } if (r) nom = r; } }
    return clonerMem.call(this, nom); }; }
{ const construireMem = construireBatiments; construireBatiments = function () { const r = construireMem.apply(this, arguments); clearTimeout(MEMOIRE.tNiv); MEMOIRE.tNiv = setTimeout(() => { try { libererNiveauxPasses(); } catch (e) { console.warn('niveaux passes', e); } }, 3000); return r; }; }
/* LES FAMILLES DE MONSTRES CHARGEES AU BESOIN (27/11/2026, FAMILLES_MONSTRES, 09-modeles.js) : tout monstre demande passe par chargerSquelettes (le lancement d'une
   vague, une revanche, un monstre qui arrive sans son modele, l'Arene dev) : sa famille se charge d'abord. L'Arene charge toutes les familles avant son public
   (des monstres de tous les paliers sur les gradins). Apres un combat et en rentrant a la ferme, les familles qui ne servent pas a la prochaine vague sont rendues */
{ const chargerSqMem = chargerSquelettes; chargerSquelettes = async function (noms) { try { await chargerModelesMonstres(noms); } catch (e) { console.warn('familles de monstres', e); } return chargerSqMem.apply(this, arguments); }; }
{ const chargerAreneMem = chargerArene; chargerArene = async function () { try { await Promise.all(Object.keys(FAMILLES_MONSTRES).map(chargerFamille)); } catch (e) { console.warn('familles pour l\'Arene', e); } return chargerAreneMem.apply(this, arguments); }; }
function famillesDeLaVague(n) { const F = new Set(); try { const T = [].concat(compoTotale(n).map(([t]) => t), (PHASES_BOSS[n] || []).flatMap((p) => p.L.map(([t]) => t)));
    T.forEach((t) => { const d = MONSTRES[t]; if (!d) return; [d.modele].concat(d.renforts ? [MONSTRES[d.renforts[0]] && MONSTRES[d.renforts[0]].modele] : [], d.invoque && d.invoque.types ? d.invoque.types.map((x) => MONSTRES[x] && MONSTRES[x].modele) : []).forEach((m) => { const f = m && familleDuModele(m); if (f) F.add(f); }); }); } catch (e) { /* rien */ }
  return F; }
function libererFamilles() { if (combat || lieu !== 'ferme') return 0; const garder = famillesDeLaVague(vagueCourante()), L = Object.keys(FAMILLES_MONSTRES).filter((k) => FAMILLES_MONSTRES[k].pret && !garder.has(k)); if (!L.length) return 0;
  const G = ressourcesGardees([]); L.forEach((k) => libererFamille(k, G)); MEMOIRE.familles = (MEMOIRE.familles || 0) + L.length; return L.length; }
{ const viderLieuxMem = viderLieux; viderLieux = function () { const R = viderLieuxMem.apply(this, arguments); try { R.familles = libererFamilles(); } catch (e) { console.warn('familles', e); } return R; }; }
{ const finVagueMem = finVague; finVague = function () { const r = finVagueMem.apply(this, arguments); clearTimeout(MEMOIRE.tFam); MEMOIRE.tFam = setTimeout(() => { try { libererFamilles(); } catch (e) { /* rien */ } }, 2500); return r; }; }
/* LES FRICHES DES TERRAINS ACHETES (27/11/2026, la memoire) : chaque terrain de l'ile existe en herbe et en friche (ronces, buissons, rochers : 120 000 triangles
   en tout) ; une fois le terrain achete, sa friche ne se montre plus jamais : elle est rendue 3 s apres (sortie de la scene, sa geometrie rendue a la carte
   graphique). Un terrain pas encore achete garde les deux (son herbe sert au moment de l'achat). Si une ferme chargee ensuite n'a pas ce terrain (les bancs
   d'essai qui enchainent des fermes dans la meme page), il se montre en herbe plutot que vide. */
function libererFriches() { if (!S_ || !S_.terrains || !MODELES.ileTerrains) return 0; const L = [];
  TERRAINS.forEach((t) => { const G = MODELES.ileTerrains[t.id]; if (G && G.friche && G.herbe && S_.terrains[t.id]) { L.push(G.friche); scene.remove(G.friche); G.friche = null; } });
  if (!L.length) return 0; const Gd = ressourcesGardees([]); L.forEach((M) => jeterTout(M, Gd)); MEMOIRE.friches = (MEMOIRE.friches || 0) + L.length; return L.length; }
{ const majTerrainsMem = majTerrains; majTerrains = function () { const r = majTerrainsMem.apply(this, arguments);
    try { TERRAINS.forEach((t) => { const G = MODELES.ileTerrains[t.id]; if (G && !G.friche && G.herbe && !S_.terrains[t.id]) G.herbe.visible = true; }); } catch (e) { /* rien */ }
    clearTimeout(MEMOIRE.tFri); MEMOIRE.tFri = setTimeout(() => { try { libererFriches(); } catch (e) { console.warn('friches', e); } }, 3000); return r; }; }
/* LES PERSONNAGES DE LA SIMU VSA, CHARGES AU BESOIN (27/11/2026, la memoire) : Omeho, le voleur, le voleur monte, le Parachutiste et le Demenageur (plus le
   Fumigene et le Saboteur en version dev) restaient charges du demarrage a la fin, pour une simu toutes les 30 min : 11 Mo. Maintenant :
   - au demarrage, seul le marchand (chargerPersonnagesVsa(['marchand']), 09-modeles.js) ;
   - l'annonce d'une simu charge ses personnages puis s'affiche (une a trois secondes plus tard, ses 30 s commencent a l'affichage) ; un modele rate : l'annonce
     part quand meme, comme avant (sans Demenageur, ou la simu s'annule faute de voleurs) ;
   - le voleur de la ferme (toutes les 7 min 30 environ) charge le sien a sa premiere visite et le garde ;
   - 4 s apres le depart d'Omeho, les personnages de la simu sont rendus (pas le voleur, qui revient souvent).
   Les bancs d'essai (window.__banc) gardent tout charge et l'ancien deroulement, pour rester comparables. */
const VSA_SIMU = ['omeho', 'voleur', 'voleurMonte', 'parachutiste', 'demenageur'], VSA_RENDUS = ['omeho', 'voleurMonte', 'parachutiste', 'demenageur', 'fumigene', 'saboteur'];
const vsaComplet = () => VSA_SIMU.every((k) => MODELES[k]) && !(typeof vsaDev === 'function' && vsaDev() && !(MODELES.fumigene && MODELES.saboteur));
{ const annoncerRaidMem = annoncerRaid; annoncerRaid = function (muet) {
    if (window.__banc || MEMOIRE.vsaEssaye || vsaComplet()) return annoncerRaidMem.apply(this, arguments);
    if (raidAnnonce || combat || enAccueil || MEMOIRE.vsaAttendu) return; MEMOIRE.vsaAttendu = true;
    chargerPersonnagesVsa().catch(() => {}).then(() => { MEMOIRE.vsaAttendu = false; MEMOIRE.vsaEssaye = true; try { annoncerRaid(muet); } finally { MEMOIRE.vsaEssaye = false; } }); }; }
/* (27/11/2026, « c'est normal que quand la simu VSA pop on a 2 fois le message a valider pour la lancer ? », Mathieu) : pendant que ses personnages se chargent,
   apres « Defendre la ferme », il n'y a encore ni fenetre ni annonce ; la boucle (S_.simuDue, 30-boucle.js) reproposait alors la simu, 34 ms apres le clic.
   Tant que l'annonce attend ses personnages, rien n'est repropose */
{ const proposerSimuMem = proposerSimu; proposerSimu = function () { if (MEMOIRE.vsaAttendu) return; return proposerSimuMem.apply(this, arguments); }; }
{ const lancerVoleurMem = lancerVoleur; lancerVoleur = function () {
    if (window.__banc || MEMOIRE.voleurEssaye || MODELES.voleur) return lancerVoleurMem.apply(this, arguments);
    if (MEMOIRE.voleurAttendu) return; MEMOIRE.voleurAttendu = true;
    chargerPersonnagesVsa(['voleur']).catch(() => {}).then(() => { MEMOIRE.voleurAttendu = false; MEMOIRE.voleurEssaye = true; try { lancerVoleur(); } finally { MEMOIRE.voleurEssaye = false; } }); }; }
function libererVsa() { if (window.__banc || raidAnnonce || omeho || MEMOIRE.vsaAttendu || (combat && combat.raid) || lieu !== 'ferme') return 0; const L = [];
  VSA_RENDUS.forEach((k) => { if (MODELES[k]) { L.push(MODELES[k]); delete MODELES[k]; } }); if (!L.length) return 0;
  const G = ressourcesGardees([]); L.forEach((M) => jeterTout(M, G)); MEMOIRE.vsa = (MEMOIRE.vsa || 0) + 1; return L.length; }
{ const partirOmehoMem = partirOmeho; partirOmeho = function () { const r = partirOmehoMem.apply(this, arguments); clearTimeout(MEMOIRE.tVsa); MEMOIRE.tVsa = setTimeout(() => { try { libererVsa(); } catch (e) { console.warn('personnages VSA', e); } }, 12000); return r; }; } /* (la fin d'une simu : Omeho s'en va, sa caleche met quelques secondes a sortir) */
{ const retirerOmehoMem = retirerOmeho; retirerOmeho = function () { const r = retirerOmehoMem.apply(this, arguments); clearTimeout(MEMOIRE.tVsa); MEMOIRE.tVsa = setTimeout(() => { try { libererVsa(); } catch (e) { console.warn('personnages VSA', e); } }, 4000); return r; }; }
/* LE BOUTON « LIBERER LA MEMOIRE » DES OPTIONS (27/11/2026, « on n'a pas un moyen de vider le cache ou reset la memoire ? », puis « ok why not, rajoute dans les
   options », Mathieu) : il lance d'un coup tous les nettoyages que le jeu fait deja tout seul (les lieux quittes, les familles de monstres, les personnages de la
   simu VSA, les niveaux depasses des batiments, les friches des terrains achetes), sur la ferme et hors combat, puis dit ce qu'il a rendu a la carte graphique.
   Le vrai remise a zero reste le rechargement de la page : la ligne le dit. La ligne se glisse dans la fenetre des Options, sous « Graphismes ». */
function libererMemoire() {
  if (lieu !== 'ferme' || combat) { toast('Rentre à la ferme, hors combat, pour libérer la mémoire.'); return null; }
  const R = { lieux: 0, familles: 0, vsa: 0, niveaux: 0, friches: 0 }, essai = (f) => { try { return f() || 0; } catch (e) { console.warn('liberer la memoire', e); return 0; } };
  const RL = essai(viderLieux) || {}; R.lieux = ['labo', 'arene', 'ile', 'casino'].filter((k) => RL[k] === true).length; /* (viderLieux rend aussi les familles : RL.familles) */
  R.familles = (+RL.familles || 0) + essai(libererFamilles); R.vsa = essai(libererVsa); R.niveaux = essai(libererNiveauxPasses); R.friches = essai(libererFriches);
  try { rendu.renderLists.dispose(); } catch (e) { /* rien */ }
  const pl = (n, un, des) => n + ' ' + (n > 1 ? des : un), L = [R.lieux && pl(R.lieux, 'lieu quitté', 'lieux quittés'), R.familles && pl(R.familles, 'famille de monstres', 'familles de monstres'), R.vsa && 'les personnages de la simu VSA', R.niveaux && pl(R.niveaux, 'ancien niveau de bâtiment', 'anciens niveaux de bâtiments'), R.friches && pl(R.friches, 'friche de terrain acheté', 'friches de terrains achetés')].filter(Boolean);
  MEMOIRE.manuel = (MEMOIRE.manuel || 0) + 1; toast(L.length ? 'Mémoire libérée : ' + L.join(', ') + '.' : 'Tout était déjà propre : rien à libérer.', 'or');
  return R;
}
document.addEventListener('click', (ev) => {
  const b = ev.target && ev.target.closest ? ev.target.closest('#b-memoire') : null; if (b) { libererMemoire(); return; }
  try { if (modaleOuverte !== 'options' || document.querySelector('#carte #b-memoire')) return; const g = document.querySelector('#carte #b-graphismes'), art = g && g.closest('.art'); if (!art) return;
    art.insertAdjacentHTML('afterend', '<div class="art">' + ico('opt-graphismes') + '<div><b>Mémoire</b><div class="desc">Le jeu libère tout seul ce qui ne sert plus. Ce bouton le fait tout de suite. Pour repartir de zéro, recharge la page : ta partie est sauvegardée.</div></div><div class="act"><button class="btn discret" id="b-memoire">Libérer</button></div></div>'); } catch (e) { /* rien */ }
});
