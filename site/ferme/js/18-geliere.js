'use strict';
/* ===================== LA GELIERE (13/10/2026) =====================
   L'elevage des Gelees, au niveau 25 (« les grandes etapes d'elevage, tous les 25 niveaux »), sur 6 cases d'herbe (3 x 2 ; Amenager la deplace et la tourne
   comme la grange), avec de l'eau : « des creatures semi-aquatiques, elles vivent pas dans l'eau mais ont besoin d'humidite, comme un batracien » (Mathieu).
   Modele blender/geliere-niveaux.py (4 niveaux), charge seulement quand elle existe. Les Gelees mangent tes fruits et font chacune un pot de leur couleur en
   20 min ; recette validee par Mathieu (« on valide comme ca, on ajustera par la suite ») : Bleue 4 Cawottes, Fraise 4 Fraises, Citron 3 Fraises et 3 Cawottes,
   Royale 6 Fraises et 4 Cawottes (Menthe 3 Cawottes et 2 Fraises, par defaut). Croiser deux couleurs fait parfois naitre une Gelee Royale. Effets des pots :
   la maquette du plan (Bleue +25 %, Menthe soigne pendant la vague, Citron +25 % et le perso court plus vite, Fraise +40 %, Royale toute la vie). */
const NIV_GELIERE = 25, PLACES_GELIERE = [0, 2, 4, 6, 8], PROD_GELEE = 30 * MIN, PROD_ROYALE = 4 * 60 * MIN, CROISEMENT = { fraise: 5, cawotte: 5 }, REPOS_CROISEMENT = 3 * MIN, CHANCE_ROYALE = 0.18, ROYALES_MAX = 3, VITESSE_CITRON = 1.3;
const GELEES = {
  bleue: { nom: 'Gelée Bleue', pot: 'petit', recette: { cawotte: 4 }, prix: 2000 },
  menthe: { nom: 'Gelée Menthe', pot: 'menthe', recette: { cawotte: 3, fraise: 2 }, prix: 3500 },
  fraise: { nom: 'Gelée Fraise', pot: 'fraise', recette: { fraise: 4 }, prix: 5000 },
  citron: { nom: 'Gelée Citron', pot: 'citron', recette: { fraise: 3, cawotte: 3 }, prix: 6500 },
  royale: { nom: 'Gelée Royale', pot: 'royale', recette: { fraise: 6, cawotte: 4 }, rare: true }
};
const GELEES_HDV = ['bleue', 'menthe', 'fraise', 'citron'];
const NOMS_GELEES = ['Bloubi', 'Gloup', 'Tremblotte', 'Gélatine', 'Slurpy', 'Pudding', 'Mochi', 'Gigotte', 'Clafouti', 'Confiote', 'Marmelade', 'Sirop', 'Bonbon', 'Guimauve', 'Nougat', 'Berlingot'];
const REPERES_GELIERE = {"1": [[-1.95, 0.29, -1.1], [0.4, 0.0, 0.6]], "2": [[-2.05, 0.29, -1.15], [0.05, 0.0, 0.5], [-0.75, 0.0, 1.0], [2.15, 0.0, -0.75]], "3": [[0.25, 0.29, -1.3], [2.2, 0.0, -0.3], [-0.45, 0.0, 0.5], [-2.0, 0.0, 0.7], [0.35, 0.0, 0.75], [2.25, 0.0, 1.2]], "4": [[-2.25, 0.26, 1.15], [-1.05, 0.0, 0.35], [-0.05, 0.0, 0.6], [0.6, 0.0, 0.0], [1.45, 0.03, 0.8], [2.45, 0.0, 0.35], [2.4, 0.0, -0.45], [-0.95, 0.0, 1.4]]}, PRE_GELIERE = {"1": [[-2.2, 0, 0.4], [-1.4, 0, 0.5], [-0.4, 0, 0.2], [0.3, 0, 1.0], [2.3, 0, 1.2], [2.3, 0, -0.6], [0.5, 0, -0.6], [-1.0, 0, 1.3], [1.35, 0, 1.0], [0.5, 0, 0.4]], "2": [[-1.6, 0, 0.6], [-0.6, 0, 0.9], [0.05, 0, 0.6], [0.5, 0, 1.2], [1.6, 0, 1.2], [2.3, 0, -0.9], [0.7, 0, -0.8], [-2.3, 0, 1.2], [0.2, 0, -0.5], [2.4, 0, 0.3]], "3": [[-2.2, 0, 0.0], [-1.4, 0, -0.2], [-2.3, 0, 0.9], [-0.3, 0, 0.9], [0.4, 0, 0.1], [0.9, 0, -0.5], [2.4, 0, -0.4], [2.3, 0, 1.4], [-0.6, 0, 1.3], [1.0, 0, 0.3]], "4": [[-1.6, 0, 0.3], [-0.9, 0, 0.9], [-0.2, 0, 0.0], [0.7, 0, -0.6], [2.5, 0, 0.3], [-1.4, 0, 1.45], [1.0, 0, 0.0], [2.5, 0, 0.95], [0.2, 0, 0.55], [-0.3, 0, 1.45]]}; /* (les places du modele, puis des points libres du pre : ou les Gelees se posent entre deux bonds) */
const placesGeliere = () => PLACES_GELIERE[niv('geliere')] || 0;
const nomFruit = (id, n) => PAR_ID[id].nom + (n > 1 ? 's' : '');
const recetteTxt = (r) => Object.entries(r).map(([id, n]) => n + ' ' + nomFruit(id, n)).join(' et ');
const manqueRecette = (r) => Object.entries(r).filter(([id, n]) => (S_.grange[id] || 0) < n).map(([id, n]) => (n - (S_.grange[id] || 0)) + ' ' + nomFruit(id, n - (S_.grange[id] || 0)));
const nbRoyales = () => (S_.gelees || []).filter((g) => g.c === 'royale').length;
const prodGelee = (g) => g.c === 'royale' ? PROD_ROYALE : PROD_GELEE; /* (14/10/2026 : 30 min par pot, 4 h pour la Royale ; 1 min avant, « n'importe quoi ») */
const etatGelee = (g) => g.fin ? (Date.now() >= g.fin ? 'pret' : 'prod') : 'faim';
const potsPretsGeliere = () => (S_.gelees || []).filter((g) => etatGelee(g) === 'pret').length;
function nouveauNomGelee() { const pris = (S_.gelees || []).map((g) => g.nom), L = NOMS_GELEES.filter((n) => !pris.includes(n)); return L.length ? hasard(L) : hasard(NOMS_GELEES) + ' ' + ((S_.gelees || []).length + 1); }
function parentsCroisement() { /* deux Gelees de couleurs differentes, reposees (pas la Royale), et une place libre */
  if ((S_.gelees || []).length >= placesGeliere()) return null;
  const L = (S_.gelees || []).filter((g) => g.c !== 'royale' && Date.now() >= (g.repos || 0));
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (L[i].c !== L[j].c) return [L[i], L[j]];
  return null;
}
function blocLibreGeliere() { /* 6 cases d'herbe libres d'un seul tenant (3 sur 2, ou 2 sur 3), au meme niveau, sans couper un acces : l'ile d'abord, puis les terrains */
  const deja = inaccessibles(), libre = (c) => c && c.type === 'libre' && !(S_.sauvage && S_.sauvage.id === c.id);
  const tri = S_.cases.filter(libre).sort((a, b) => (a.terrain === 'main' ? 0 : 1) - (b.terrain === 'main' ? 0 : 1));
  for (const c0 of tri) for (const [w, h] of [[3, 2], [2, 3]]) {
    const cells = []; let ok = true;
    for (let a = 0; a < w && ok; a++) for (let b = 0; b < h && ok; b++) { const c = S_.cases.find((x) => x.terrain === c0.terrain && x.i === c0.i + a && x.j === c0.j + b); if (!libre(c) || !memeNiveau(c, c0)) ok = false; else cells.push(c); }
    if (!ok) continue;
    cells.forEach((c) => { c.type = 'geliere'; }); const bloque = inaccessibles().some((x) => !deja.includes(x)); cells.forEach((c) => { c.type = 'libre'; });
    if (!bloque) return { cells, tourne: w === 2 };
  }
  return null;
}
/* le modele de la Geliere et les Gelees : charges la premiere fois qu'on en a besoin (1,4 Mo), pas au demarrage */
let geliereCharge = null;
function assurerGeliere() {
  if (MODELES.geliere1) return Promise.resolve(); if (geliereCharge) return geliereCharge;
  geliereCharge = Promise.all(['geliere-niveaux', 'gelees-cubes'].map((f) => chargerGlb('assets/modeles/jeu/' + f + '.glb?v=' + VERSION_MODELES))).then(([G, Gc]) => {
    versToon(G, { normales: 0.01, sansContour: SC_BATI }); versToon(Gc, { normales: 0.01, sansContour: SC_MONSTRES });
    const O = new T.Vector3(0, 0, 0); for (let n = 1; n <= 4; n++) MODELES['geliere' + n] = gabaritEchelle(G, 'Geliere' + n, 1, O); /* (modele a l'echelle du jeu : une case = 2 unites) */
    Object.keys(GELEES).forEach((c) => { MODELES['gelee_' + c] = gabarit(Gc, 'Gelee' + c[0].toUpperCase() + c.slice(1), c === 'royale' ? 0.46 : 0.36, 'y'); });
    if (S_ && S_.perso) construireBatiments();
  }).catch((e) => { console.warn('Gelière', e); geliereCharge = null; });
  return geliereCharge;
}
/* les Gelees : elles sautillent d'un point a l'autre du pre, au bord de l'eau (par bonds, comme valide) */
let geleesMesh = [];
const spotsGeliere = (n) => (REPERES_GELIERE[n] || []).concat(PRE_GELIERE[n] || []);
function rendreGelees() {
  geleesMesh.forEach((m) => scene.remove(m)); geleesMesh = [];
  const o = blocBati('geliere'); if (!o || !niv('geliere') || !MODELES.gelee_bleue) return;
  const n = Math.min(4, niv('geliere')), a = rotDe('geliere'), pts = spotsGeliere(n);
  (S_.gelees || []).forEach((g, k) => {
    const m = marquer(cloner('gelee_' + g.c), o.c0.id), p = pts[k % pts.length], [dx, dz] = tourne(p[0], p[2], a);
    m.position.set(o.x + dx, o.y + p[1], o.z + dz); m.rotation.y = a + 0.5 + k; m.userData.s0 = m.scale.x;
    m.userData.g = { spot: k % pts.length, cible: null, attente: 1 + Math.random() * 4, saut: null, pose: 0, k };
    scene.add(m); geleesMesh.push(m);
  });
}
function animerGelees(dt, s) {
  if (!geleesMesh.length || combat) return; const o = blocBati('geliere'); if (!o) return;
  const a = rotDe('geliere'), pts = spotsGeliere(Math.min(4, niv('geliere')));
  geleesMesh.forEach((m) => {
    const u = m.userData.g, s0 = m.userData.s0;
    if (u.saut) { /* en l'air : une parabole, etiree en montant */
      const S = u.saut; S.t = Math.min(1, S.t + dt / S.d); const t = S.t;
      m.position.set(S.x0 + (S.x1 - S.x0) * t, S.y0 + (S.y1 - S.y0) * t + Math.sin(t * Math.PI) * S.h, S.z0 + (S.z1 - S.z0) * t);
      const e = Math.sin(t * Math.PI) * 0.12; m.scale.set(s0 * (1 - e * 0.5), s0 * (1 + e), s0 * (1 - e * 0.5));
      if (t >= 1) { u.saut = null; u.pose = 0.2; } return;
    }
    if (u.pose > 0) { u.pose = Math.max(0, u.pose - dt); const q = u.pose / 0.2; m.scale.set(s0 * (1 + 0.16 * q), s0 * (1 - 0.22 * q), s0 * (1 + 0.16 * q)); return; } /* il s'ecrase en touchant le sol */
    m.scale.set(s0, s0 * (1 + Math.sin(s * 2.6 + u.k * 1.9) * 0.025), s0); /* il respire */
    u.attente -= dt; if (u.attente > 0) return;
    if (!u.cible) { /* une nouvelle place, libre, pas trop loin */
      const pris = new Set(geleesMesh.map((x) => x.userData.g.spot)), ici = m.position;
      const L = pts.map((p, i) => i).filter((i) => !pris.has(i)).map((i) => { const [dx, dz] = tourne(pts[i][0], pts[i][2], a); return { i, x: o.x + dx, y: o.y + pts[i][1], z: o.z + dz }; }).filter((q) => Math.hypot(q.x - ici.x, q.z - ici.z) < 2.2);
      if (!L.length) { u.attente = 1.5 + Math.random() * 2; return; }
      const q = hasard(L); u.spot = q.i; u.cible = q;
    }
    const c = u.cible, dx = c.x - m.position.x, dz = c.z - m.position.z, L = Math.hypot(dx, dz);
    if (L < 0.04) { u.cible = null; u.attente = 2.5 + Math.random() * 6; return; }
    const pas = Math.min(L, 0.5), fin = L <= 0.5; m.rotation.y = Math.atan2(dx, dz);
    u.saut = { t: 0, d: 0.36, x0: m.position.x, y0: m.position.y, z0: m.position.z, x1: m.position.x + dx / L * pas, z1: m.position.z + dz / L * pas, y1: fin ? c.y : o.y, h: 0.14 + pas * 0.14 };
    u.attente = 0.12 + Math.random() * 0.3;
  });
}
/* la fenetre de la Geliere */
function ouvrirGeliere() {
  const nv = niv('geliere'); if (!nv) { ouvrirHdv('ameliorer'); return; } S_.gelees = S_.gelees || [];
  const L = S_.gelees, places = placesGeliere(), prets = potsPretsGeliere(), faim = L.filter((g) => etatGelee(g) === 'faim'), look = GAINS.geliere.looks[Math.min(4, nv)];
  const ligne = (g, k) => {
    const G = GELEES[g.c], e = etatGelee(g), m = manqueRecette(G.recette);
    const etat = e === 'pret' ? '<span class="puce bonne">son pot est prêt</span>' : e === 'prod' ? '<span class="puce">son pot dans ' + dureeLisible(g.fin - Date.now()) + '</span>' : '<span class="puce mauvaise">a faim : ' + recetteTxt(G.recette) + '</span>';
    const repos = g.repos && Date.now() < g.repos ? '<span class="puce">se repose ' + dureeLisible(g.repos - Date.now()) + '</span>' : '';
    const act = e === 'pret' ? '<button class="btn kamas" data-gelee-ramasser>Ramasser</button>' : e === 'faim' ? (m.length ? '<span class="a-manque">il manque ' + m.join(' et ') + '</span>' : '') + '<button class="btn kamas" data-gelee-nourrir="' + k + '"' + (m.length ? ' disabled' : '') + '>Nourrir</button>' : '';
    return '<div class="art">' + ico('gelee-' + g.c) + '<div><b>' + g.nom + '</b> <small>' + G.nom + '</small><div class="puces">' + etat + '<span class="puce">' + BREF_POT[G.pot] + '</span>' + repos + '</div></div><div class="act">' + act + '</div></div>';
  };
  const parents = parentsCroisement(), mc = manqueRecette(CROISEMENT);
  ouvrirModale('geliere', entete('La Gelière') + '<p class="hdv-aide">' + look[0].toUpperCase() + look.slice(1) + ', niveau ' + nv + '. Tes Gelées vivent au bord de l\'eau. Nourris-les de fruits : chacune te fait un pot de sa couleur en ' + dureeLisible(PROD_GELEE) + ' (la Royale en ' + dureeLisible(PROD_ROYALE) + ').</p>' +
    (prets ? '<div class="vie-alerte"><div><b>' + prets + ' pot' + (prets > 1 ? 's' : '') + ' de gelée prêt' + (prets > 1 ? 's' : '') + '</b><small>Ils iront avec tes autres pots : bouton potion, à côté de ta vie.</small></div><div class="va-pots"><button class="btn kamas" data-gelee-ramasser>Ramasser</button></div></div>' : '') +
    (faim.length > 1 ? '<div style="display:flex;justify-content:flex-end;margin:0 0 6px"><button class="btn kamas" data-gelee-nourrir="tout">Nourrir toutes celles qui ont faim</button></div>' : '') +
    '<div class="hdv-section">Tes Gelées : ' + L.length + ' sur ' + places + ' place' + (places > 1 ? 's' : '') + '</div>' +
    (L.length ? L.map(ligne).join('') : '<p class="hdv-aide">Aucune Gelée pour l\'instant : achète ta première à l\'HDV, catégorie Gelées.</p>') +
    '<div class="hdv-section">Croiser deux Gelées</div><p class="hdv-aide">Deux Gelées de couleurs différentes et ' + recetteTxt(CROISEMENT) + ' : un petit de la couleur d\'un parent, et parfois (environ une fois sur ' + Math.round(1 / CHANCE_ROYALE) + ') une <b>Gelée Royale</b>, dont le pot rend toute ta vie et donne +20 Agilité pour la vague (un pot toutes les ' + dureeLisible(PROD_ROYALE) + ', ' + ROYALES_MAX + ' Royales au plus' + (nbRoyales() >= ROYALES_MAX ? ' : tu les as, les croisements n\'en donnent plus' : ', tu en as ' + nbRoyales()) + '). Les parents se reposent ensuite ' + dureeLisible(REPOS_CROISEMENT) + '.</p>' +
    '<div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px">' + (!parents ? '<small class="gel-note">' + (L.length >= places ? 'La Gelière est pleine.' : 'Il faut deux Gelées de couleurs différentes, reposées.') + '</small>' : mc.length ? '<small class="gel-note">Il manque ' + mc.join(' et ') + '.</small>' : '') +
    '<button class="btn discret" data-hdv-cat="animaux" data-hdv-voir="[data-gelee-achat]">Acheter une Gelée</button><button class="btn kamas" data-gelee-croiser' + (parents && !mc.length ? '' : ' disabled') + '>' + (parents ? 'Croiser ' + parents[0].nom + ' et ' + parents[1].nom : 'Croiser') + '</button></div>' +
    lignesAmelio(['geliere'], 'Agrandir la Gelière'));
}
/* equilibrage des classes (11/10/2026, « faut equilibrer les classes ») : le Iop encaisse mieux (Peau de Iop) et sa Charge le soigne ;
   l'Osamodas vise ou poser son Bouftou, qui retombe en frappant autour de lui, au lieu d'un Bouftou qui sortait tout seul et restait en permanence */
const PEAU_IOP = 0.15, SOIN_CHARGE = 0.03, RECHARGE_INVOC = 10, DUREE_INVOC = 12, RAYON_INVOC = 1.8, PORTEE_INVOC = 8;
const RECHARGE_PERCANTE = 20; /* (la Fleche percante du Cra : 20 s, elle traverse toute une ligne a 3 fois les degats ; avant le 16/10/2026 : 30 monstres a abattre) */
const rechargeSort = () => classeDe() === 'osa' ? RECHARGE_INVOC : classeDe() === 'cra' ? RECHARGE_PERCANTE : RECHARGE_SORT;
/* le rythme : la vague suivante se prepare un moment apres chaque victoire (plus longtemps aux paliers eleves), et il faut un niveau
   minimum pour la lancer. Sans ca, l'experience des vagues suffisait a tout enchainer en moins d'une heure (bot de test). */
const PREPA_VAGUE = 1, /* (1 minute avant la vague suivante, quel que soit le palier : « tu mets 1 minute d'attente, peu importe le niveau de vague », Mathieu, 18/10/2026 ; avant, de 30 s au palier 1 a 16 min 30 au palier 7 ; le niveau requis reste la vraie limite) */ niveauRequis = (n) => Math.max(1, n - 2);
const CADENCE_RAID = 30 * MIN, ANNONCE_RAID = 30000, NIV_SIMU = 20; /* une simu VSA toutes les 30 min pile quand on joue, des le niveau 20, annoncee 30 s avant (17/10/2026) */
/* le joueur est-il la ? pas de raid ni de voleur s'il n'a rien touche depuis 3 vraies minutes : on ne se fait pas piller en son absence */
let derniereAction = Date.now(); ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((ev) => addEventListener(ev, () => { derniereAction = Date.now(); }, { passive: true }));
const joueurPresent = () => Date.now() - derniereAction < 180000 && !document.hidden && lieu === 'ferme'; /* au Casino, a l'Arene, sur l'ile des boss : pas de raid */
let raidAnnonce = null;
/* LA SIMU VSA, UNE SEULE REGLE (17/10/2026, « trop aleatoire, je vois pas la limite », Mathieu) : elle suit ta vague, de la 20e (la premiere simu, niveau 20)
   a la 70e. 4 voleurs, un de plus toutes les 5 vagues, 12 au plus (vague 60), un sur trois sur Dragodinde ; 40 PV + 12 par vague a pied, le double monte. */
const vagueSimu = () => Math.max(20, Math.min(VAGUES_TOTAL, S_.vague.num));
const tailleSimu = () => { const v = vagueSimu(), nb = Math.min(12, 4 + Math.floor((v - 20) / 5)); return { v, nb, montes: Math.floor(nb / 3), demenageurs: v >= 50 ? 2 : v >= 30 ? 1 : 0 }; }; /* (les Demenageurs en plus des voleurs, 19/10/2026) */
const pvSimu = (monte) => (40 + 12 * vagueSimu()) * (monte ? 2 : 1);
