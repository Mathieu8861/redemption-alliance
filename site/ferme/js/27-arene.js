'use strict';
/* ===================== L'ARENE (14/10/2026) =====================
   « tu peux creer les iles qu'on voulait dev », puis « arene a partir du 50 ; 3 par jour, mais la difficulte est elevee et tu paies un ticket ;
   celle que tu veux, allez go, developpe a fond » (Mathieu). L'ile de l'Arene (blender/arene-jeu.py), en montgolfiere depuis la ferme :
   des vagues sans fin, de plus en plus dures, avec les monstres des paliers deja battus, qui sortent par trois herses et foncent tous sur toi ;
   un boss toutes les 5 vagues, puis un souffle pour boire et manger. Chaque vague tenue rapporte de l'experience et un peu de kamas, chaque boss
   un coffre (des kamas, parfois une piece de ta panoplie, rarement des runes : voir vagueAreneTenue). Ton record de la semaine compte au classement de l'alliance (DAMOCLES/sql/068) ;
   pour l'honneur (le podium et ses primes retires le 14/10/2026). L'entree : un ticket, trois par jour. Pendant ce temps, ni vague ni simu VSA sur la ferme. */
const NIV_ARENE = 50, ENTREES_ARENE = 3, TICKET_ARENE = 10000, ARENE = new T.Vector3(240, 0, 0), ROT_ARENE = Math.PI / 4, R_ARENE = 9.2; /* (le podium et ses primes retires le 14/10/2026 : « oublie-le, si on a personne Moon va gagner les 100k », Mathieu) */
const PORTES_ARENE = [[0, -1], [-1, 0], [1, 0]].map(([dx, dz]) => { const d = new T.Vector3(dx, 0, dz).applyAxisAngle(new T.Vector3(0, 1, 0), ROT_ARENE); return { x: ARENE.x + d.x * 8.9, z: ARENE.z + d.z * 8.9, ox: ARENE.x + d.x * 11.6, oz: ARENE.z + d.z * 11.6 }; }); /* les trois herses : le fond, la gauche, la droite */
let ileArene = null, areneSuite = false;
const RUNE_COFFRE = 0.02, RUNE_PARFAITE_COFFRE = 0.02, PIECE_COFFRE = 0.3, ITEM_MONSTRE_ARENE = 0.0025, /* (0,5 avant le 19/10/2026) */ KAMAS_ARENE = 0.1, JET_ARENE = 0.5; /* (simule sur la ferme de Moon, Osamodas 65, 9 a 12 vagues : environ 6 500 kamas pour un ticket de 10 000, 0,1 niveau, une demi-rune et 0,4 piece par entree) */ /* (14/10/2026, Mathieu : « faut pas donner gratos les recompenses », « sois moins gentil » ; la Prospection augmente runes et pieces, comme tout butin) */
const runeParMonstre = (k) => k < 3 ? 0 : k < 10 ? 0.001 : k < 15 ? 0.0025 : 0.005; /* plus on va loin, plus les monstres lachent de runes (moitie moins depuis le 19/10/2026 : 0,2, 0,5 et 1 % avant) */
function etatArene() { S_.arene = S_.arene || { record: 0, semaines: {}, parties: 0 }; if (!S_.arene.semaines) S_.arene.semaines = {}; const j = jourJeu(); if (S_.arene.jour !== j) Object.assign(S_.arene, { jour: j, entrees: 0 }); return S_.arene; }
const semaineJeu = (t) => { const d = new Date(t == null ? tempsReel() : t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7); const s1 = new Date(d.getFullYear(), 0, 4); return d.getFullYear() + '-S' + String(1 + Math.round(((d - s1) / 864e5 - 3 + (s1.getDay() + 6) % 7) / 7)).padStart(2, '0'); }; /* (la semaine ISO, du lundi au dimanche) */
const recordSemaine = (sem) => etatArene().semaines[sem || semaineJeu()] || 0;
const entreesRestantes = () => Math.max(0, ENTREES_ARENE - (etatArene().entrees || 0));
const multArene = (k) => 1 + 0.08 * Math.max(0, k - 20); /* au-dela de la vague 20, les monstres grossissent encore de 8 % par vague */
let forceBossArene = 1; /* (20/10/2026, « les boss, je les ai trouves trop faciles », Mathieu : a pleine force ; la moitie datait du temps ou tout le monde affrontait le boss de la vague 55) */
/* LES BONUS DE L'ARENE (20/10/2026, Mathieu : « tous les 10 niveaux de vague, qu'on puisse choisir un petit bonus : +10 agilite, +10 puissance, +10 esquive,
   +1 % de vol de vie ») : apres le boss de la 10e, de la 20e..., trois bonus au hasard ; tu en choisis un, il dure jusqu'a la fin de la partie et se cumule */
const BONUS_ARENE = {
  puissance: { nom: 'Rage de l\'arène', txt: '+10 Puissance (+10 % de dégâts)', ico: 'puissance' },
  agilite: { nom: 'Mains rapides', txt: '+10 Agilité (+10 % de vitesse d\'attaque)', ico: 'agilite' },
  vita: { nom: 'Second souffle', txt: '+10 % de PV max', ico: 'vita' },
  esquive: { nom: 'Esquive', txt: '10 % de chances d\'esquiver un coup (50 % au plus)', ico: 'vitesse' },
  vol: { nom: 'Vol de vie', txt: 'tes coups te soignent de 2 % des dégâts infligés', ico: 'soin' },
  foule: { nom: 'Chouchou de la foule', txt: '+6 % de vie rendue à chaque vague tenue', ico: 'etoile' },
  recharge: { nom: 'Concentration', txt: 'tes sorts se rechargent 15 % plus vite', ico: 'cadence' },
  butin: { nom: 'Flair', txt: '+20 Prospection (+20 % de butin)', ico: 'prospection' },
};
const bonusA = () => (combat && combat.genre === 'arene' && combat.arene && combat.arene.bonus) || null; /* (les bonus pris dans cette partie) */
const nbBonus = (id) => { try { return (bonusA() || {})[id] || 0; } catch (e) { return 0; } };
function tirerBonusArene() { const L = Object.keys(BONUS_ARENE); for (let i = L.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [L[i], L[j]] = [L[j], L[i]]; } return L.slice(0, 3); }
function prendreBonusArene(id) {
  const c = combat; if (!c || !c.entracte || !c.arene || !c.arene.choix || !c.arene.choix.includes(id)) return;
  const b = c.arene.bonus = c.arene.bonus || {}; b[id] = (b[id] || 0) + 1; c.arene.choix = null;
  if (id === 'vita') { const plus = Math.round(c.pvMax * 0.1); c.pvMax += plus; c.pv += plus; }
  son('niveau'); toast('Bonus de l\'Arène : ' + BONUS_ARENE[id].nom + ' (' + BONUS_ARENE[id].txt + ') jusqu\'à la fin de la partie.', 'or'); ouvrirEntracte();
}
let soinArene = 0.12; /* la foule t'acclame : chaque vague tenue te rend 12 % de ta vie */
let forceArene = (k) => (0.35 + 0.045 * (k - 1)) * multArene(k); /* (19/10/2026, « pas trouve ca si dur », Mathieu, record 19 en Cra 62 : 35 % a la vague 1 et +4,5 % par vague, soit 116 % a la 19e ; avant 25 % et +3 %, 79 % a la 19e) */ /* (seul et sans defenses, tout le monde sur lui : a la force d'une vague normale, le perso tombait des la premiere. Simule avec la ferme de Moon, niveau 61, le 14/10/2026 : 9 a 11 vagues tenues selon la classe, soit environ 29 000 kamas et deux coffres pour un ticket de 10 000) */
const nArene = () => Math.max(VAGUES_PALIER, VAGUES_PALIER * Math.floor((Math.min(S_.vague.num, VAGUES_TOTAL + 1) - 1) / VAGUES_PALIER)); /* (20/10/2026, « au niveau du boss que t'as passe juste avant », Mathieu : la vague du dernier boss battu, 55 pour tous avant) */ /* leur base : la force d'une vague 55, toujours la meme (en montant de vague, le palier 7 faisait un saut brutal a la 11e) ; c'est forceArene qui monte, en douceur */
const partNiveauArene = (k) => k <= 10 ? 0.15 * k / 55 : 0.03; /* la part d'un niveau que rapporte la vague k (15 % pour les 10 premieres, 3 % ensuite ; le double avant le 19/10/2026 : 0,84 niveau pour 19 vagues, 2,5 par jour) */
function gainsArene(k, niv0) { const n = Math.min(69, 50 + k), b = gainsVagueBrut(n % VAGUES_PALIER === 0 ? n - 1 : n, false), L = niv0 || niveau(S_.xp);
  return { kamas: kamasGagnes(b.kamas * KAMAS_ARENE * multArene(k)), xp: Math.max(1, Math.round((seuil(L + 1) - seuil(L)) * partNiveauArene(k))) }; } /* (kamas : 40 % d'une vague avant le 14/10/2026) */
/* L'ARENE PLUS VARIEE (20/10/2026, « je tombe que contre les memes monstres ; plus de diversite, mais adaptes au niveau », Mathieu) : les monstres de
   toutes les vagues battues (sans les boss, les voleurs ni les Boufcouls du Koulosse), par famille (un palier = une famille) ; avant, ceux des 30 dernieres
   vagues seulement. Chaque vague de l'Arene tire 3 familles au hasard, et statsArene remet chaque monstre a la force de l'Arene */
const hautArene = () => Math.max(9, Math.min(S_.vague.num - 1, VAGUES_TOTAL - 1));
function famillesArene() {
  const F = new Map();
  for (let n = 1; n <= hautArene(); n++) { if (n % VAGUES_PALIER === 0) continue; const p = palierDe(n);
    compoVague(n).forEach(([t]) => { const d = MONSTRES[t]; if (d && !d.boss && !d.vole && !d.fabrique) { if (!F.has(p)) F.set(p, new Set()); F.get(p).add(t); } }); }
  return F.size ? [...F.values()].map((s) => [...s]) : [['bouftou']];
}
/* la force d'un monstre dans l'Arene : celle de sa vague d'origine (la derniere battue ou il vient), multipliee par le rapport entre la moyenne d'une
   vague 55 et la moyenne de sa vague d'origine ; il garde son role dans sa famille (costaud, fragile), au niveau de l'Arene */
const STATS_ARENE = new Map();
function statsArene(t) {
  const haut = hautArene(), cle = t + '|' + haut + '|' + nArene(); if (STATS_ARENE.has(cle)) return STATS_ARENE.get(cle);
  let nt = 0; for (let n = haut; n >= 1 && !nt; n--) if (n % VAGUES_PALIER && compoVague(n).some(([x]) => x === t)) nt = n;
  const N = nArene() - 1; if (!nt) nt = N; /* (la reference : la vague normale juste avant le dernier boss battu) */
  const moy = (n, f) => { let s = 0, c = 0; compoVague(n).forEach(([x, q]) => { if (MONSTRES[x] && !MONSTRES[x].boss) { s += f(x, n) * q; c += q; } }); return c ? s / c : 1; };
  const r = { pv: pvMonstre(t, nt) * moy(N, pvMonstre) / moy(nt, pvMonstre), deg: degMonstre(t, nt) * moy(N, degMonstre) / moy(nt, degMonstre), p: palierDe(nt) };
  STATS_ARENE.set(cle, r); return r;
}
/* un boss dans l'Arene : la force du dernier boss que tu as battu (nArene), quel que soit le boss tire ; avant, le Bouftou Royal y gardait sa fiche de
   la vague 10 et tombait en deux fleches (« je le tue plus vite que les monstres », Mathieu, 20/10/2026) */
const statsBossArene = () => { const N = nArene(), R = PALIERS[palierDe(N)].boss; return { pv: pvMonstre(R, N), deg: degMonstre(R, N), sort: MONSTRES[R].degSort * 0.8 }; };
const bossArene = () => PALIERS.slice(0, Math.max(1, Math.min(PALIERS.length, Math.floor((S_.vague.num - 1) / VAGUES_PALIER)))).map((p) => p.boss).filter((b) => MONSTRES[b]);
function vagueArene(k) {
  const fam = famillesArene(); for (let i = fam.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [fam[i], fam[j]] = [fam[j], fam[i]]; } /* (3 familles au hasard par vague) */
  const choix = fam.slice(0, 3), boss = k % 5 === 0, nb = Math.min(20, 6 + Math.floor(k * 0.7)) - (boss ? 2 : 0), f = [];
  for (let i = 0; i < nb; i++) f.push(hasard(hasard(choix)));
  if (boss) f.push(hasard(bossArene()));
  return { k, n: nArene(k), f, nom: 'la vague ' + k };
}
function appliquerVagueArene(c, p) {
  c.arene.k = p.k; c.n = p.n; c.file = p.f.slice(); c.total = p.f.length; c.attente = 2.2; c.victoire = 0; son('vague');
  const b = p.f.find((t) => MONSTRES[t].boss); toast('Arène, vague ' + p.k + ' : ' + p.f.length + ' monstres' + (b ? ', dont ' + leNom(MONSTRES[b], true) : '') + ' !', 'alerte'); majCombatHud();
}
function humainPublic(classe, sexe, equip) { /* un spectateur fait comme le perso : sa classe, son sexe, une coiffe, une cape, parfois une arme legendaire */
  const nom = modeleDe(classe, null, sexe), mUse = MODELES[nom] ? nom : ({ iop: 'iop3', osa: 'osa', cra: 'cra' }[classe] || 'iop3'); if (!MODELES[mUse]) return null;
  const g = cloner(mUse), e0 = g.scale.x; g.scale.setScalar(1); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0);
  const sv = { equip: S_.equip, perso: S_.perso }; /* (l'habillage lit l'equipement et la classe du perso : on les lui prete le temps de l'habiller) */
  try { S_.equip = equip; S_.perso = Object.assign({}, S_.perso || {}, { classe, sexe }); elargirPerso(g, LARGEUR_PERSO[mUse] ? mUse : classe); habillerPerso(g); }
  catch (e) { /* tant pis pour la tenue */ } finally { S_.equip = sv.equip; S_.perso = sv.perso; }
  g.scale.setScalar(e0); return g;
}
function tenueAuHasard(classe) {
  const de = (emp) => Object.keys(OBJETS).filter((id) => { const o = OBJETS[id]; return o.emp === emp && !o.rare && !o.leg && !/~/.test(id) && PANOS[o.pano] && PANOS[o.pano].id !== 'boufcoul'; }); /* (sans la panoplie Boufcoul ni les armes legendaires : mal calees sur le public, enormes) */
  const e = {}; if (Math.random() < 0.8) e.coiffe = hasard(de('coiffe')); if (Math.random() < 0.6) e.cape = hasard(de('cape'));
  return e;
}
const ILE_BOSS = new T.Vector3(0, 0, 240), ROT_ILE_BOSS = Math.PI / 4, R_ILE_BOSS = 9.0; let ileBoss = null, VARIANTE_SCEAU = 'crane'; /* (le sceau du milieu : le crane, choisi par Mathieu le 15/10/2026, « je prefere le crane » ; l'etoile et l'oeil restent dans sceauIleBoss) */
const numRepere = (nom) => { let d = ((nom.split('_')[2] || '').match(/^\d+/) || [''])[0]; if (d.length >= 5) d = d.slice(0, -3); return parseInt(d, 10); }; /* (le suffixe de Blender, colle par three.js : « 30001 » = 30) */
const SOL_ILE = 65; /* (le sol : les cases (i, j) de 2 de cote, i * i + j * j <= 65, comme dans blender/boss-ile.py) */
const versLocalIle = (x, z) => { const dx = x - ILE_BOSS.x, dz = z - ILE_BOSS.z, c = Math.cos(ROT_ILE_BOSS), s = Math.sin(ROT_ILE_BOSS); return [dx * c - dz * s, dx * s + dz * c]; };
const versMondeIle = (lx, lz) => { const c = Math.cos(ROT_ILE_BOSS), s = Math.sin(ROT_ILE_BOSS); return [lx * c + lz * s + ILE_BOSS.x, -lx * s + lz * c + ILE_BOSS.z]; };
const solIle = (lx, lz, m) => [[-m, -m], [m, -m], [-m, m], [m, m]].every(([a, b]) => { const i = Math.round((lx + a) / 2), j = Math.round((lz + b) / 2); return i * i + j * j <= SOL_ILE; });
function bornerIle(x, z, m) { /* le point le plus proche ou l'on peut se tenir : sur le sol, hors des piliers, braseros, arbres, carcasses */
  m = m == null ? 0.4 : m; let [lx, lz] = versLocalIle(x, z);
  if (!solIle(lx, lz, m)) { const L = Math.hypot(lx, lz) || 1; let a = 0, b = 1; for (let k = 0; k < 14; k++) { const t = (a + b) / 2; if (solIle(lx * t, lz * t, m)) a = t; else b = t; } lx *= a; lz *= a; }
  const blocs = (ileBoss && ileBoss.userData.blocs) || [];
  for (let n = 0; n < 2; n++) blocs.forEach((o) => { const dx = lx - o.x, dz = lz - o.z, d = Math.hypot(dx, dz), R = o.r + m; if (d >= R) return; if (d < 0.001) lx = o.x + R; else { lx = o.x + dx / d * R; lz = o.z + dz / d * R; } });
  return versMondeIle(lx, lz);
}
const dansIle = (x, z, m) => { const [lx, lz] = versLocalIle(x, z); if (!solIle(lx, lz, m == null ? 0.4 : m)) return false; return !((ileBoss && ileBoss.userData.blocs) || []).some((o) => Math.hypot(lx - o.x, lz - o.z) < o.r + (m == null ? 0.4 : m)); };
async function chargerIleBoss() { /* l'ile des boss (blender/boss-ile.py), rendue comme la ferme, et ses effets animes */
  if (ileBoss) return ileBoss;
  const sc = await chargerGlb('assets/modeles/jeu/boss-ile.glb?v=' + VERSION_MODELES), reperes = [];
  sc.updateMatrixWorld(true); sc.traverse((o) => { if (/^repere_/.test(o.name)) { const p = new T.Vector3(); o.getWorldPosition(p); reperes.push({ nom: o.name, p }); } });
  versToon(sc, { echelle: 0.012, souple: SOUPLE_ILE, sansContour: SC_ILE, douce: true });
  const g = new T.Group(); g.add(fusionner(sc.getObjectByName('BossIle') || sc, {})); g.position.copy(ILE_BOSS); g.rotation.y = ROT_ILE_BOSS;
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const fx = { t: 0, cercles: [], motes: [], flammes: [], bulles: [], flaques: [], feux: [] }, add = (m) => { m.raycast = () => {}; g.add(m); return m; };
  const brille = (c, op) => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
  /* le cercle magique : deux anneaux qui respirent, six rayons, et des etincelles qui montent */
  [[6.2, 0.22], [3.0, 0.12]].forEach(([R, l], k) => { const m = add(new T.Mesh(new T.RingGeometry(R - l, R + l, 72), brille('#b98cff', 0.35))); m.rotation.x = -Math.PI / 2; m.position.y = 0.07 + k * 0.005; fx.cercles.push({ m, k }); });
  { const m = add(new T.Mesh(new T.CircleGeometry(6.0, 64), brille('#7a3fe0', 0.06))); m.rotation.x = -Math.PI / 2; m.position.y = 0.06; fx.cercles.push({ m, k: 2 }); }
  /* les flammes violettes des cranes */
  reperes.filter((x) => /^repere_(grande)?flamme/.test(x.nom)).forEach((x) => { const gr = /grande/.test(x.nom) ? 2.4 : 1.15, f = new T.Group(); f.position.copy(x.p); add(f); /* (une goutte de flamme violette, douce, pas un cone blanc : « des animations bizarres », Mathieu) */
    const doux = (c, op) => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false });
    const a = new T.Mesh(new T.SphereGeometry(0.075 * gr, 10, 8), doux('#8f55e0', 0.7)), b = new T.Mesh(new T.SphereGeometry(0.04 * gr, 8, 6), doux('#c9a2ff', 0.85));
    a.scale.set(1, 2.1, 1); b.scale.set(1, 1.7, 1); a.position.y = 0.13 * gr; b.position.y = 0.1 * gr; f.add(a, b);
    fx.flammes.push({ f, a, b, ph: Math.random() * 6, gr }); });
  /* les flaques de poison : un voile vert qui palpite, des bulles qui montent et eclatent */
  reperes.filter((x) => /^repere_flaque/.test(x.nom)).forEach((x) => { const e = (numRepere(x.nom) || 100) / 100;
    const v = add(new T.Mesh(new T.CircleGeometry(0.7 * e, 20), brille('#8be05a', 0.3))); v.rotation.x = -Math.PI / 2; v.scale.set(1, 0.72, 1); v.position.set(x.p.x, 0.045, x.p.z); fx.flaques.push({ v, ph: Math.random() * 6 });
    for (let k = 0; k < 2; k++) { const m = add(new T.Mesh(new T.SphereGeometry(0.08 + Math.random() * 0.05, 8, 6), new T.MeshBasicMaterial({ color: k % 2 ? '#b6f27a' : '#c9a2ff', transparent: true, opacity: 0.9 })));
      fx.bulles.push({ m, x: x.p.x + (Math.random() - 0.5) * 0.6 * e, z: x.p.z + (Math.random() - 0.5) * 0.4 * e, t: Math.random() * 4, v: 0.8 + Math.random() * 0.4 }); } });
  /* les bols de feu du bord */
  reperes.filter((x) => /^repere_feu/.test(x.nom)).forEach((x) => { const f = new T.Group(); f.position.copy(x.p); add(f);
    const a = new T.Mesh(new T.ConeGeometry(0.26, 0.7, 7), new T.MeshBasicMaterial({ color: '#ff8a1e' })), b = new T.Mesh(new T.ConeGeometry(0.14, 0.45, 6), new T.MeshBasicMaterial({ color: '#ffe07a' })); a.position.y = 0.32; b.position.y = 0.24; f.add(a, b);
    fx.feux.push({ f, a, b, ph: Math.random() * 6 }); });
  fx.sceau = sceauIleBoss(VARIANTE_SCEAU); g.add(fx.sceau);
  g.userData.blocs = reperes.filter((x) => /^repere_bloc_/.test(x.nom)).map((x) => ({ x: x.p.x, z: x.p.z, r: (numRepere(x.nom) || 40) / 100 })); /* (les gros elements du decor, on bute dessus) */
  g.userData.fx = fx; scene.add(g); ileBoss = g; if (!soleil.target.parent) scene.add(soleil.target); return g;
}
function sceauIleBoss(v) { /* le sceau au milieu du cercle magique, a plat ; v : 'etoile', 'crane' ou 'oeil' */
  const g = new T.Group(), c = new T.Group(); g.add(c); c.rotation.x = -Math.PI / 2; g.rotation.y = 0; g.position.y = 0.035; g.userData.v = v; /* (le haut du dessin vers le haut de l'ecran) */
  let rang = 3; const plat = (geo, col, op, add, z) => { const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide, blending: add ? T.AdditiveBlending : T.NormalBlending })); m.position.z = z || 0; m.renderOrder = 3 + Math.round((z || 0) * 1000); m.raycast = () => {}; c.add(m); return m; }; /* (l'ordre des couches suit leur hauteur : tout est transparent, sinon le disque recouvrait le dessin) */
  plat(new T.CircleGeometry(1.15, 48), '#1d1430', 0.92, false, 0); g.userData.halo = plat(new T.RingGeometry(1.12, 1.22, 48), '#b98cff', 0.35, true, 0.002);
  const barre = (x1, y1, x2, y2, e, col, op) => { const L = Math.hypot(x2 - x1, y2 - y1), m = plat(new T.PlaneGeometry(L, e), col, op, true, 0.004); m.position.x = (x1 + x2) / 2; m.position.y = (y1 + y2) / 2; m.rotation.z = Math.atan2(y2 - y1, x2 - x1); return m; };
  if (v === 'etoile') { /* deux triangles de lumiere violette et un petit cercle au coeur */
    for (const d of [Math.PI / 2, -Math.PI / 2]) { const P3 = [0, 1, 2].map((k) => [Math.cos(d + k * 2 * Math.PI / 3) * 0.95, Math.sin(d + k * 2 * Math.PI / 3) * 0.95]); for (let k = 0; k < 3; k++) barre(P3[k][0], P3[k][1], P3[(k + 1) % 3][0], P3[(k + 1) % 3][1], 0.07, '#c9a2ff', 0.7); }
    plat(new T.RingGeometry(0.26, 0.33, 32), '#c9a2ff', 0.7, true, 0.005); plat(new T.CircleGeometry(0.12, 20), '#8f55e0', 0.9, false, 0.006);
  } else if (v === 'crane') { /* un crane d'os incruste, les yeux qui luisent */
    const sh = new T.Shape(); sh.moveTo(-0.34, -0.42); sh.lineTo(-0.36, -0.2); sh.absarc(0, 0.12, 0.6, Math.PI * 1.18, Math.PI * -0.18, true); sh.lineTo(0.36, -0.2); sh.lineTo(0.34, -0.42); sh.quadraticCurveTo(0, -0.58, -0.34, -0.42);
    const oeil = (x) => { const h = new T.Path(); h.absellipse(x, 0.08, 0.15, 0.17, 0, Math.PI * 2, false); return h; }; sh.holes.push(oeil(-0.22), oeil(0.22));
    const nez = new T.Path(); nez.moveTo(0, -0.08); nez.lineTo(-0.07, -0.22); nez.lineTo(0.07, -0.22); nez.lineTo(0, -0.08); sh.holes.push(nez);
    plat(new T.ShapeGeometry(sh, 24), '#e9dfc6', 1, false, 0.004);
    for (const x of [-0.22, 0.22]) { const m = plat(new T.CircleGeometry(0.11, 18), '#b98cff', 0.85, true, 0.003); m.position.x = x; m.position.y = 0.08; m.scale.set(1, 1.15, 1); }
    for (let k = 0; k < 4; k++) barre(-0.27 + k * 0.18, -0.36, -0.27 + k * 0.18, -0.5, 0.05, '#1d1430', 1);
  } else { /* l'oeil du boss : une amande violette, l'iris, une pupille fendue qui te suit */
    const sh = new T.Shape(); sh.moveTo(-0.95, 0); sh.quadraticCurveTo(0, 0.95, 0.95, 0); sh.quadraticCurveTo(0, -0.95, -0.95, 0);
    plat(new T.ShapeGeometry(sh, 24), '#8f55e0', 0.95, false, 0.003); g.userData.iris = plat(new T.CircleGeometry(0.3, 28), '#d6bcff', 1, false, 0.005);
    g.userData.pupille = plat(new T.CircleGeometry(0.12, 20), '#16121e', 1, false, 0.007); g.userData.pupille.scale.set(0.45, 2.2, 1);
    const cil = new T.Shape(); cil.moveTo(-1.0, 0); cil.quadraticCurveTo(0, 1.04, 1.0, 0); cil.quadraticCurveTo(0, 0.86, -1.0, 0); plat(new T.ShapeGeometry(cil, 24), '#c9a2ff', 0.6, true, 0.004);
  }
  return g;
}
let JOUR_ILE_BOSS = 5; /* (le vendredi : chaque semaine de l'ile commence ce jour-la ; let : les tests le changent) */
const ESSAIS_ILE_BOSS = 3, PV_ILE_BOSS = 500000, /* (500 000, Mathieu le 15/10/2026, apres son premier essai a 39 246 avec son Cra 38 ; 5 000 000 au depart, puis 100 000 « en attendant ») */ NIV_ILE_BOSS = 15, ENRAGE_ILE = { periode: 30, pas: 0.05 }; /* (3 essais par compte et par semaine) */
const ROTATION_ILE_BOSS = ['koulosse', 'waWabbit', 'crocabulia', 'craqLegendaire', 'bworker', 'cuirasse', 'royal', 'dragonCochon']; /* (le Dragon Cochon en dernier, 20/10/2026 : la semaine en cours garde son boss, il arrive la semaine du vendredi 4/12/2026) */
let ileBossTotal = null, ileBossListe = null; /* (le total de l'alliance, lu dans la base) */
const RECOMPENSES_ILE = { participation: { kamas: kamasGagnes(10000), forge: 1, xp: 0.15 }, tombe: { kamas: kamasGagnes(40000), forge: 3, xp: 0.4, piece: 0.75, leg: 0.1 }, podium: [{ kamas: kamasGagnes(30000), parfaite: 1 }, { kamas: kamasGagnes(20000), forge: 3 }, { kamas: kamasGagnes(10000), forge: 2 }] };
const cleJour = (t) => { const d = new Date(t == null ? tempsReel() : t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
/* L'ILE A LA SEMAINE (18/10/2026, « dispo du vendredi au vendredi, ca reset les PV ; 3 essais comme d'hab mais sur toute la semaine », Mathieu ; l'acces libre de
   test de son compte est retire, « remets-moi en mode joueur normal ») : la semaine de l'ile va du vendredi 0 h au jeudi 23 h 59 ; sa cle est la date de son
   vendredi (le format que lit la base). Chaque vendredi : un nouveau boss (la rotation), une vie commune neuve, 3 essais neufs, et le coffre de la semaine finie. */
const semaineIleBoss = (t) => { const d = new Date(t == null ? tempsReel() : t); d.setDate(d.getDate() - ((d.getDay() - JOUR_ILE_BOSS + 7) % 7)); return cleJour(d.getTime()); };
const finSemaineIle = () => { const d = new Date(tempsReel()); d.setDate(d.getDate() + ((JOUR_ILE_BOSS - 1 - d.getDay() + 7) % 7)); return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); }; /* (le jeudi, dernier jour) */
function bossDuJour(cle) { const [y, m, d] = cle.split('-').map(Number), sem = parseInt(semaineJeu(new Date(y, m - 1, d, 12).getTime()).split('-S')[1], 10); const L = ROTATION_ILE_BOSS.length; return ROTATION_ILE_BOSS[(((sem - 42) % L) + L) % L]; } /* (le Koulosse le vendredi 16/10/2026, puis la rotation) */
const palierDuBoss = (t) => Math.max(0, PALIERS.findIndex((p) => p.boss === t)), vagueDuBoss = (t) => (palierDuBoss(t) + 1) * VAGUES_PALIER;
function etatIleBoss() { S_.ileBoss = S_.ileBoss || { jours: {}, recus: {} }; const J = S_.ileBoss.jours; Object.keys(J).sort().slice(0, -8).forEach((k) => { delete J[k]; }); return S_.ileBoss; }
const partiesIle = () => [S_].concat(Object.values(S_.parties || {}).filter((e) => e && e.perso)); /* (la partie en cours et les autres du compte) */
const jourIleDe = (e, cle) => (e.ileBoss && e.ileBoss.jours && e.ileBoss.jours[cle]) || null;
const essaisCompte = (cle) => partiesIle().reduce((a, e) => a + ((jourIleDe(e, cle) || {}).essais || 0), 0); /* (3 essais par compte, toutes parties confondues) */
const meilleurCompte = (cle) => Math.max(0, ...partiesIle().map((e) => (jourIleDe(e, cle) || {}).meilleur || 0));
const aReclamerIle = () => Object.entries(etatIleBoss().jours).filter(([k, J]) => new Date(k + 'T12:00:00').getDay() === JOUR_ILE_BOSS && k !== semaineIleBoss() && J.meilleur > 0 && J.meilleur >= meilleurCompte(k) && !etatIleBoss().recus[k]); /* (le coffre va a la partie du meilleur essai) */
const jourIle = (cle) => (etatIleBoss().jours[cle] = etatIleBoss().jours[cle] || { essais: 0, meilleur: 0, boss: bossDuJour(cle) });
const prochainVendredi = () => { const d = new Date(tempsReel()); d.setDate(d.getDate() + ((JOUR_ILE_BOSS - d.getDay() + 7) % 7 || 7)); return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); };
async function classementIleBoss(cle) { /* le total et le classement de l'alliance ce jour-la (DAMOCLES/sql/069) */
  if (!ENLIGNE || !enLigneSv.compte) return null;
  try { const jeton = jetonInvite(), jwt = jeton ? null : (enLigneSv.jwt || await jetonSite()); const r = await rpc('ferme_ile_boss', { p_jeton: jeton, p_jour: cle }, jwt); return r && r.ok ? r : null; } catch (e) { return null; }
}
function ouvrirIleBoss() { /* la fiche de l'ile : le boss du jour, tes essais, la vie commune, les recompenses, le classement */
  const cle = semaineIleBoss(), l = niveau(S_.xp), v = '?v=' + VERSION_MODELES, aReclamer = aReclamerIle();
  const t = bossDuJour(cle), B = MONSTRES[t], J = jourIle(cle), reste = Math.max(0, ESSAIS_ILE_BOSS - essaisCompte(cle));
  const raison = l < NIV_ILE_BOSS ? 'Il faut le niveau ' + NIV_ILE_BOSS + '.' : !reste ? 'Tes ' + ESSAIS_ILE_BOSS + ' essais de la semaine sont pris : un nouveau boss arrive ' + prochainVendredi() + '.' : '';
  const total = ileBossTotal != null && cle ? ileBossTotal : null, pc = total != null ? Math.min(100, 100 * total / PV_ILE_BOSS) : 0;
  const R = RECOMPENSES_ILE, rec = (titre, txt) => '<div class="rc-l"><span>' + titre + '</span><b>' + txt + '</b></div>';
  ouvrirModale('ileboss', entete('L\'Île des boss') + '<div class="arene-tete"><img src="assets/icones/' + B.icone + '.png' + v + '" alt=""><div><b>' + B.nom + ' colossal' + (B.fem ? 'e' : '') + ' est là</b><p>Toute la semaine, jusqu\'à ' + finSemaineIle() + ' à 23 h 59 : un nouveau boss chaque vendredi, avec une vie neuve. Toute l\'alliance tape sur la même vie.</p></div></div>' +
    '<div class="puces arene-puces"><span class="puce ' + (l >= NIV_ILE_BOSS ? 'bonne' : 'mauvaise') + '">niveau ' + NIV_ILE_BOSS + '</span>' + '<span class="puce ' + (reste ? 'bonne' : 'mauvaise') + '">' + reste + ' essai' + (reste > 1 ? 's' : '') + ' sur ' + ESSAIS_ILE_BOSS + ' cette semaine</span><span class="puce">ton meilleur : ' + fmt(meilleurCompte(cle)) + '</span>' + '<span class="puce">gratuit</span></div>' +
    ('<div class="hdv-section">La vie du boss, pour toute l\'alliance</div><div class="ib-barre"><i style="width:' + (100 - pc).toFixed(1) + '%"></i><span>' + (total != null ? fmt(Math.max(0, PV_ILE_BOSS - total)) + ' / ' + fmt(PV_ILE_BOSS) + ' PV' : 'Connecte-toi pour voir la vie commune') + '</span></div>') +
    '<ul class="arene-regles"><li><b>3 essais par semaine, seul le meilleur compte</b> : tes dégâts sur le boss pendant ton meilleur essai s\'ajoutent à ceux de l\'alliance. Les essais sont par compte, toutes tes parties confondues.</li>' +
    '<li><b>Il s\'adapte à ton niveau</b> et enrage de plus en plus : toutes les ' + ENRAGE_ILE.periode + ' s, lui et sa troupe gagnent ' + Math.round(ENRAGE_ILE.pas * 100) + ' % de dégâts, de vitesse de déplacement et de vitesse d\'attaque, et leurs sorts reviennent ' + Math.round(ENRAGE_ILE.pas * 100) + ' % plus vite. Toute l\'île est à toi : esquive tant que tu peux, et tape le plus fort possible.</li>' +
    '<li><b>Sa troupe le protège</b>, comme sur ta ferme : dégage-la pour bien le toucher. Ni tours ni arbalète ici, ton perso seul.</li></ul>' +
    '<div class="hdv-section">Les récompenses, le vendredi suivant</div><div class="ib-rec">' + rec('Si tu as participé', fmt(R.participation.kamas) + ' kamas, 1 rune de forgemagie, ' + Math.round(R.participation.xp * 100) + ' % d\'un niveau') +
    rec('Si le boss tombe (pour tous)', fmt(R.tombe.kamas) + ' kamas, ' + R.tombe.forge + ' runes, une pièce au jet de 75 % ou plus, ' + Math.round(R.tombe.leg * 100) + ' % de sa pièce légendaire, ' + Math.round(R.tombe.xp * 100) + ' % d\'un niveau') +
    rec('1er du classement', 'en plus : ' + fmt(R.podium[0].kamas) + ' kamas et 1 rune parfaite') + rec('2e', 'en plus : ' + fmt(R.podium[1].kamas) + ' kamas et ' + R.podium[1].forge + ' runes') + rec('3e', 'en plus : ' + fmt(R.podium[2].kamas) + ' kamas et ' + R.podium[2].forge + ' runes') + '</div>' +
    '<div class="hdv-section">Le classement de la semaine</div><div id="ileboss-classement"><p class="hdv-aide">Chargement…</p></div>' +
    '<div class="act-bas">' + (raison ? '<small>' + raison + '</small>' : '') + '<button class="btn discret" data-montgolfiere="carte">La carte des vents</button>' + (aReclamer.length ? '<button class="btn kamas" data-montgolfiere="reclamerIleBoss">Ouvrir le coffre de la semaine</button>' : '') + '<button class="btn kamas" data-montgolfiere="partirIleBoss"' + (raison ? ' disabled' : '') + '>Partir</button></div>');
  classementIleBoss(cle).then((r) => { const e = document.getElementById('ileboss-classement'); if (!e) return; ileBossTotal = r ? r.total : null; ileBossListe = r ? r.joueurs : null;
    if (!r) { e.innerHTML = '<p class="hdv-aide">Le classement s\'affiche quand tu joues connecté à ton compte.</p>'; return; }
    e.innerHTML = r.joueurs.length ? r.joueurs.slice(0, 10).map((j, i) => '<div class="rc-l' + (j.moi ? ' moi' : '') + '"><span>' + (i < 3 ? '<span class="rang r' + (i + 1) + '">' + (i + 1) + '</span>' : (i + 1) + '.') + ' ' + echapper(j.nom) + '</span><b>' + fmt(j.degats) + '</b></div>').join('') : '<p class="hdv-aide">Personne n\'a encore frappé : à toi l\'honneur !</p>';
    const b = document.querySelector('.ib-barre'); if (b) { b.querySelector('i').style.width = Math.max(0, 100 - 100 * r.total / PV_ILE_BOSS).toFixed(1) + '%'; b.querySelector('span').textContent = fmt(Math.max(0, PV_ILE_BOSS - r.total)) + ' / ' + fmt(PV_ILE_BOSS) + ' PV'; } });
}
async function partirIleBoss() {
  const cle = semaineIleBoss();
  const J = jourIle(cle); if (essaisCompte(cle) >= ESSAIS_ILE_BOSS) { toast('Tes ' + ESSAIS_ILE_BOSS + ' essais de la semaine sont pris : un nouveau boss arrive ' + prochainVendredi() + '.', 'alerte'); return; }
  if (niveau(S_.xp) < NIV_ILE_BOSS) { toast('L\'île des boss ouvre au niveau ' + NIV_ILE_BOSS + '.'); return; }
  if (!peutPartir('ile')) return;
  areneSuite = true; fermerModale(); areneSuite = false;
  if (lieu !== 'ile') {
    if (!(await allerSur('ile'))) { toast('Le ballon n\'a pas pu décoller (chargement de l\'île), réessaie.', 'alerte'); return; }
    compter('ileBossVisites');
  }
  const p = new T.Vector3(2.2, 0, 3.0).applyAxisAngle(new T.Vector3(0, 1, 0), ROT_ILE_BOSS).add(ILE_BOSS), u = paysanMesh.userData; paysanMesh.position.set(p.x, 0, p.z); u.y = 0; u.angle = Math.atan2(ILE_BOSS.x - p.x, ILE_BOSS.z - p.z); paysanMesh.rotation.set(0, u.angle, 0); u.charge = false;
  if (ileBossTotal == null) classementIleBoss(cle).then((r) => { if (r) { ileBossTotal = r.total; ileBossListe = r.joueurs; } });
  toast('L\'île des boss ! ' + MONSTRES[bossDuJour(cle)].nom + ' sort de l\'arche-crâne...', 'alerte');
  setTimeout(() => { if (lieu === 'ile' && !combat) lancerIleBoss(); }, 1800);
}
function lancerIleBoss() {
  const cle = semaineIleBoss(); if (combat || !paysanMesh || lieu !== 'ile') return; const J = jourIle(cle); if (essaisCompte(cle) >= ESSAIS_ILE_BOSS) return;
  J.essais++; sauver(); /* (l'essai compte des qu'il commence) */
  const t = J.boss = bossDuJour(cle), n = vagueDuBoss(t);
  nouveauCombat('ile', { n, arene: { k: 0, ileBoss: true, cle, boss: t, deg: 0, t: 0, pas: 0, avant: Math.max(0, (ileBossTotal || 0) - meilleurCompte(cle)) }, attente: 99, ...potsDeVague() }); /* (chaque essai part avec toute sa vie) */
  { const repas = appliquerRepas(); if (repas.length) setTimeout(() => toast('Repas avant l\'essai : ' + texteRepas(repas) + '.', 'or'), 2600); }
  ouvrirHudCombat();
  const g = new T.Vector3(-6.4, 0, -6.4).applyAxisAngle(new T.Vector3(0, 1, 0), ROT_ILE_BOSS).add(ILE_BOSS); apparaitre(t, { x: g.x, z: g.z }); /* (il sort de l'arche-crane) */
  son('vague'); toast(MONSTRES[t].nom + ' colossal' + (MONSTRES[t].fem ? 'e' : '') + ' ! Tape le plus fort possible : il enrage toutes les ' + ENRAGE_ILE.periode + ' s.', 'alerte'); majCombatHud();
}
function finIleBoss(abandon, tombe) {
  const c = combat; if (!c || c.fin || c.genre !== 'ile') return;
  nettoyerCombat(c, true);
  /* (la vie de la ferme reste celle d'avant le voyage : un essai rate ne te renvoie pas a 1 PV) */
  const A = c.arene, J = jourIle(A.cle), d = Math.round(A.deg), mc = meilleurCompte(A.cle), record = d > mc; if (record && ileBossTotal != null) ileBossTotal += d - mc; if (d > J.meilleur) J.meilleur = d; /* (record : le meilleur du compte, toutes parties) */ compter('ileBossEssais');
  son(tombe || record ? 'victoire' : 'defaite'); if (tombe || record) confettis(tombe ? 80 : 40);
  const reste = Math.max(0, ESSAIS_ILE_BOSS - essaisCompte(A.cle)), B = MONSTRES[A.boss], m = Math.floor(A.t / 60), sec = Math.round(A.t % 60);
  ouvrirModale('ileboss-fin', entete(tombe ? B.nom + ' est tombé !' : abandon ? 'Tu quittes l\'île' : 'À terre !') +
    '<div class="arene-bilan"><div class="gros">' + fmt(d) + '</div><div class="sous">dégâts sur ' + leNom(B, true) + '</div>' + (record ? '<div class="record">★ Ton meilleur essai de la semaine !</div>' : '<div class="sous">ton meilleur cette semaine : ' + fmt(meilleurCompte(A.cle)) + '</div>') + '</div>' +
    '<div class="recap-combat">' + ligneRecap('cadence', 'Tenu', (m ? m + ' min ' : '') + sec + ' s') + ligneRecap('rage', 'Sa rage', '+' + Math.round(A.pas * ENRAGE_ILE.pas * 100) + ' %') + ligneRecap('renfort', 'Monstres abattus', c.st.tues) + '</div>' +
    '<p class="hdv-aide">Le coffre de la semaine s\'ouvre ' + prochainVendredi() + ', selon ton meilleur essai et si l\'alliance l\'a fait tomber.</p>' +
    '<div class="act-bas"><small style="color:#6b5a48">' + reste + ' essai' + (reste > 1 ? 's' : '') + ' restant' + (reste > 1 ? 's' : '') + ' cette semaine</small><button class="btn discret" data-montgolfiere="rentrer">Rentrer à la ferme</button><button class="btn kamas" data-montgolfiere="partirIleBoss"' + (reste ? '' : ' disabled') + '>Réessayer</button></div>');
  rendreHaut(); sauver();
}
async function reclamerIleBoss() { /* le coffre de la semaine finie : la participation, ou mieux s'il est tombe, et le podium */
  if (reclamerIleBoss.enCours) return; const S0 = etatIleBoss(), L = aReclamerIle(); if (!L.length) return;
  reclamerIleBoss.enCours = true; /* (un double clic ne paie plus deux fois) */
  try {
  const lignes = [];
  for (const [k, J] of L) {
    const r = await classementIleBoss(k); if (!r) { toast('Le classement de l\'île n\'est pas lisible pour l\'instant (hors connexion ?) : ton coffre t\'attend, réessaie dans un moment.', 'alerte'); continue; } /* (avant le 16/10/2026 : la participation, et la recompense du boss tombe perdue) */
    const tombe = !!(r && r.total >= PV_ILE_BOSS), rang = r ? r.joueurs.findIndex((j) => j.moi) : -1, R = tombe ? RECOMPENSES_ILE.tombe : RECOMPENSES_ILE.participation, B = MONSTRES[J.boss] || MONSTRES.koulosse;
    S0.recus[k] = true; S_.kamas += R.kamas; runes().forge = (runes().forge || 0) + R.forge; let xp = Math.round((seuil(niveau(S_.xp) + 1) - seuil(niveau(S_.xp))) * R.xp); gagnerXp(xp); xp = gagnerXp.dernier; /* (le vrai gain, affiche) */
    /* « on pourrait etre plus explicite sur les gains, c'est pas tres clair » (Mathieu, 17/10/2026) : ce qui s'est passe, puis ce que tu recois ligne par
       ligne (la participation ou le boss tombe, le bonus du classement), le total, et ce que le boss tombe aurait donne */
    const runesTxt = (n, parf) => [n ? n + ' rune' + (n > 1 ? 's' : '') + ' de forgemagie' : '', parf ? parf + ' rune' + (parf > 1 ? 's' : '') + ' parfaite' + (parf > 1 ? 's' : '') : ''].filter(Boolean).join(', ');
    const base = [fmt(R.kamas) + ' kamas', runesTxt(R.forge, 0), fmt(xp) + ' XP'];
    let totK = R.kamas, totF = R.forge, totP = 0; const objets = [];
    if (tombe) { const id = tirerPiece(panoDe(palierCourant()), 1 + caracs().prospection / 100), cle = donnerObjet(id, R.piece); /* (une piece neuve en priorite, parfois rare, comme les autres coffres : 16/10/2026) */ objets.push(OBJETS[id].nom + ' (jet ' + Math.round(100 * qualiteJet(cle)) + ' %)');
      const leg = LEGENDAIRES.find((x) => x.boss === J.boss); if (leg && Math.random() < R.leg) { const idl = idLeg(leg); donnerObjet(idl); objets.push('✦ ' + OBJETS[idl].nom); } }
    const L2 = [ligneRecap('kama', tombe ? 'Le boss est tombé' : 'Ta participation', base.concat(objets).join(', '))];
    if (rang >= 0 && rang < 3) { const Pd = RECOMPENSES_ILE.podium[rang]; S_.kamas += Pd.kamas; if (Pd.parfaite) runes().parfaite = (runes().parfaite || 0) + Pd.parfaite; if (Pd.forge) runes().forge += Pd.forge;
      totK += Pd.kamas; totF += Pd.forge || 0; totP += Pd.parfaite || 0; L2.push(ligneRecap('couronne', 'Bonus ' + (rang + 1) + (rang ? 'e' : 'er') + ' du classement', '+' + fmt(Pd.kamas) + ' kamas, ' + runesTxt(Pd.forge || 0, Pd.parfaite || 0))); }
    const total = [fmt(totK) + ' kamas', runesTxt(totF, totP), fmt(xp) + ' XP'].concat(objets).join(', ');
    const T2 = RECOMPENSES_ILE.tombe, siTombe = !tombe && r ? '<p class="hdv-aide">S’il était tombé, chacun aurait reçu ' + fmt(T2.kamas) + ' kamas au lieu de ' + fmt(R.kamas) + ', ' + T2.forge + ' runes au lieu d’une, une pièce de sa panoplie (jet de ' + Math.round(T2.piece * 100) + ' % ou plus) et ' + Math.round(T2.leg * 100) + ' % de chance d’avoir sa pièce légendaire.</p>' : '';
    const etat = r ? (tombe ? 'Tombé ! L’alliance lui a fait ' + fmt(r.total) + ' dégâts sur ' + fmt(PV_ILE_BOSS) + '.' : 'Il a tenu : l’alliance lui a fait ' + fmt(r.total) + ' dégâts sur ' + fmt(PV_ILE_BOSS) + '.') : 'Classement non disponible hors connexion.';
    lignes.push('<div class="art">' + ico(B.icone) + '<div><b>' + B.nom + ' colossal' + (B.fem ? 'e' : '') + ', semaine du ' + k.split('-').reverse().join('/') + '</b><div class="desc">' + etat + ' Ton meilleur essai : ' + fmt(J.meilleur) + ' dégâts' + (rang >= 0 && r ? ', ' + (rang + 1) + (rang ? 'e' : 'er') + ' sur ' + r.joueurs.length + ' joueur' + (r.joueurs.length > 1 ? 's' : '') : '') + '.</div></div><div></div></div>' +
      '<div class="hdv-section">Ce que tu reçois</div><div class="ib-rec">' + L2.join('') + '<div class="rc-l ib-total">' + picto('etoile', '#7a4fc9') + '<span>Au total</span><b>' + total + '</b></div></div>' + siTombe);
  }
  son('niveau'); confettis(50); rendreHaut(); sauver();
  ouvrirModale('ileboss', entete('Le coffre de l\'île des boss') + lignes.join('') + '<div class="act-bas"><button class="btn kamas" data-montgolfiere="ileBoss">Retour à l\'île</button></div>');
  } finally { reclamerIleBoss.enCours = false; }
}
function animerIleBoss(dt) { /* tout en douceur (« plus lent, tranquille, que ca ne bouille pas dans tous les sens, que ca ne clignote pas : leger, fluide, joli », Mathieu, 15/10/2026) */
  if (!ileBoss || !ileBoss.visible) return; const fx = ileBoss.userData.fx; fx.t += dt; const t = fx.t;
  fx.cercles.forEach(({ m, k }) => { m.material.opacity = k === 2 ? 0.06 + 0.015 * Math.sin(t * 0.8) : (k ? 0.24 : 0.3) + 0.05 * Math.sin(t * 0.9 + k * 1.3); if (k < 2) m.rotation.z = t * (k ? -0.025 : 0.018); }); /* (une respiration de 7 s, a peine) */
  fx.flammes.forEach((o) => { o.a.scale.set(1, 2.1 * (0.94 + 0.06 * Math.sin(t * 2.2 + o.ph)), 1); o.b.scale.set(1, 1.7 * (0.94 + 0.06 * Math.sin(t * 2.9 + o.ph)), 1); o.f.rotation.z = Math.sin(t * 0.8 + o.ph) * 0.08; });
  fx.flaques.forEach((o) => { o.v.material.opacity = 0.24 + 0.06 * Math.sin(t * 0.9 + o.ph); });
  fx.bulles.forEach((o) => { o.t += dt * o.v * 0.3; if (o.t > 1) o.t = 0; const k = o.t; o.m.position.set(o.x, 0.04 + k * 0.28, o.z); const e = k < 0.8 ? 0.5 + k * 0.6 : (1 - k) * 4.5; o.m.scale.setScalar(Math.max(0.01, e)); o.m.material.opacity = k < 0.8 ? 0.8 : (1 - k) * 4; }); /* (une bulle toutes les 3 a 4 s, qui monte doucement) */
  if (fx.sceau) { const u = fx.sceau.userData; u.halo.material.opacity = 0.28 + 0.07 * Math.sin(t * 0.9);
    if (u.pupille && paysanMesh) { const loc = ileBoss.worldToLocal(paysanMesh.position.clone()), L = Math.hypot(loc.x, loc.z) || 1, d = Math.min(1, L / 6) * 0.12; /* (la pupille regarde le perso, en douceur) */
      const tx = loc.x / L * d, ty = -loc.z / L * d; u.pupille.position.x += (tx - u.pupille.position.x) * Math.min(1, dt * 2); u.pupille.position.y += (ty - u.pupille.position.y) * Math.min(1, dt * 2); u.iris.position.x = u.pupille.position.x * 0.6; u.iris.position.y = u.pupille.position.y * 0.6; } }
  fx.feux.forEach((o) => { o.a.scale.set(1, 0.94 + 0.08 * Math.sin(t * 3.2 + o.ph) + 0.03 * Math.sin(t * 5.3 + o.ph), 1); o.b.scale.set(1, 0.92 + 0.08 * Math.sin(t * 4.1 + o.ph * 2), 1); o.f.rotation.y = t * 0.15 + o.ph; });
}
async function chargerArene() { /* l'ile de l'Arene (blender/arene-ile.py), faite avec les outils de la ferme et rendue comme elle ; le fond est deja tourne loin de la camera */
  if (ileArene) return;
  await Promise.all([assurerVisuels(), assurerLook('feminin-iop'), assurerLook('feminin-cra'), assurerLook('feminin-osa')].map((p) => p.catch(() => false))); /* (les tenues et les versions feminines, pour les humains du public) */
  const sc = await chargerGlb('assets/modeles/jeu/arene-ile.glb?v=' + VERSION_MODELES); versToon(sc, { echelle: 0.012, souple: SOUPLE_ILE, sansContour: SC_ILE, douce: true });
  const g = new T.Group(); g.add(fusionner(sc.getObjectByName('AreneIle') || sc, {})); g.position.copy(ARENE);
  if (MODELES.montgolfiere) { const m = MODELES.montgolfiere.clone(true); m.traverse((o) => { delete o.userData.montgolfiere; }); m.position.set(13, 0, 3.2); m.rotation.set(0, -Math.PI / 2, 0); m.visible = true; g.add(m); } /* (la montgolfiere de la ferme, posee a cote) */
  { /* le public : les monstres du jeu a leur taille de combat, assis sur les trois gradins du fond (blender/arene-ile.py), tournes vers le sable */
    const types = [...new Set(Object.values(MONSTRES).filter((d) => !d.boss && !d.vole && !d.fabrique && MODELES[d.modele]).map((d) => d.modele))].filter((nom) => (MODELES[nom].userData.hauteur || 1.8) <= 2.7).concat(MODELES.voleur ? ['voleur', 'voleur'] : []);
    const pub = new T.Group(), fond = 225 * Math.PI / 180;
    if (types.length) [[11.3, 1.4, 1.7], [12.15, 2.2, 2.0], [13.0, 3.0, 1.75]].forEach(([rr, y, pas], ri) => {
      const a0 = 150 * Math.PI / 180, a1 = 300 * Math.PI / 180, n = Math.floor((a1 - a0) * rr / pas);
      for (let q = 0; q < n; q++) {
        const a = a0 + (a1 - a0) * (q + (ri % 2 ? 0.9 : 0.4)) / n; if (Math.abs(Math.atan2(Math.sin(a - fond), Math.cos(a - fond))) < 0.33) continue;
        const cl = hasard(['iop', 'cra', 'osa']), m = (Math.random() < 0.42 && humainPublic(cl, Math.random() < 0.5 ? 'f' : 'm', tenueAuHasard(cl))) || cloner(hasard(types)), x = Math.cos(a) * rr, z = Math.sin(a) * rr; m.position.set(x, y + 0.03, z); m.rotation.y = Math.atan2(-x, -z) + (Math.random() - 0.5) * 0.4; pub.add(m);
      }
    });
    g.add(pub); }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(g); ileArene = g; if (!soleil.target.parent) scene.add(soleil.target);
}
async function classementArene(sem) { /* le classement de l'alliance pour une semaine (il faut etre connecte ; DAMOCLES/sql/068) */
  if (!ENLIGNE || !enLigneSv.compte) return null;
  try { const jeton = jetonInvite(), jwt = jeton ? null : (enLigneSv.jwt || await jetonSite()); const r = await rpc('ferme_arene_classement', { p_jeton: jeton, p_semaine: sem }, jwt); return r && r.ok ? (r.joueurs || []) : null; }
  catch (e) { return null; }
}
async function afficherClassementArene() {
  const sem = semaineJeu(), moi = recordSemaine(sem), L = await classementArene(sem), e = document.getElementById('arene-classement'); if (!e) return;
  const ligne = (rang, nom, v, estMoi) => '<div class="rc-l' + (estMoi ? ' moi' : '') + '"><span>' + rang + ' ' + echapper(nom) + '</span><b>' + v + ' vague' + (v > 1 ? 's' : '') + '</b></div>';
  if (!L) { e.innerHTML = ligne('', 'Ton record cette semaine', moi, true) + '<p class="hdv-aide">Le classement de l\'alliance s\'affiche quand tu joues connecté à ton compte.</p>'; return; }
  e.innerHTML = L.length ? L.slice(0, 10).map((j, i) => ligne(i < 3 ? '<span class="rang r' + (i + 1) + '">' + (i + 1) + '</span>' : (i + 1) + '.', j.nom, j.vagues, j.moi)).join('') + (L.some((j) => j.moi) ? '' : ligne('', 'Toi', moi, true)) : '<p class="hdv-aide">Personne n\'est encore entré cette semaine : à toi l\'honneur !</p>';
}
function ouvrirArene() {
  const l = niveau(S_.xp), reste = entreesRestantes(), a = etatArene(), sem = semaineJeu();
  const raison = l < NIV_ARENE ? 'Il faut le niveau ' + NIV_ARENE + '.' : !reste ? 'Tes ' + ENTREES_ARENE + ' entrées du jour sont prises : l\'Arène te rouvre demain.' : S_.kamas < TICKET_ARENE ? 'Il te manque ' + fmt(TICKET_ARENE - S_.kamas) + ' kamas pour le ticket.' : '';
  ouvrirModale('arene', entete('L\'Arène') + '<div class="arene-tete"><img src="assets/icones/ile-arene.png?v=' + VERSION_MODELES + '" alt=""><div><b>Tiens le plus longtemps possible</b><p>Des vagues sans fin, de plus en plus dures, devant toute l\'alliance.</p></div></div>' +
    '<div class="puces arene-puces"><span class="puce ' + (l >= NIV_ARENE ? 'bonne' : 'mauvaise') + '">niveau ' + NIV_ARENE + '</span><span class="puce ' + (reste ? 'bonne' : 'mauvaise') + '">' + reste + ' entrée' + (reste > 1 ? 's' : '') + ' sur ' + ENTREES_ARENE + ' aujourd\'hui</span><span class="puce">ticket ' + fmt(TICKET_ARENE) + ' kamas</span><span class="puce">record : ' + (a.record || 0) + ' vague' + ((a.record || 0) > 1 ? 's' : '') + '</span></div>' +
    '<ul class="arene-regles"><li><b>Vagues sans fin</b> : les monstres de tous tes paliers déjà battus, trois familles au hasard par vague, tous à la force du dernier boss que tu as battu (celui de la vague ' + nArene() + '), puis de plus en plus forts. Ils sortent des herses et foncent tous sur toi.</li>' +
    '<li><b>Un boss toutes les 5 vagues</b>, lui aussi à la force de ce boss, puis un souffle pour boire tes pots et manger (un repas vaut pour toute la partie, il ne se cumule pas avec lui-même).</li>' +
    '<li><b>Toutes les 10 vagues, un bonus au choix</b> parmi trois (Puissance, Agilité, esquive, vol de vie...), gardé jusqu\'à la fin de la partie.</li>' +
    '<li><b>À chaque vague tenue</b> : de l\'expérience (10 vagues valent environ un sixième de ton niveau) et un peu de kamas. L\'Arène ne se fait pas pour l\'argent : à 10 vagues, tu récupères environ les deux tiers de ton ticket. On y vient pour le record, les pièces aux bons jets et les runes.</li>' +
    '<li><b>Les runes se méritent</b> : plus tu vas loin, plus les monstres en lâchent. Une <b>rune de forgemagie</b> (+20 % de jet sur la caractéristique de ton choix) tombe sur 0,1 % des monstres de la vague 3 à la 9, 0,25 % de la 10e à la 14e, 0,5 % dès la 15e.</li>' +
    '<li><b>Les monstres lâchent des pièces</b> : dès la 5e vague, 0,25 % de chance par monstre d\'une pièce de <b>sa</b> panoplie (un Bouftou, une pièce du Bouftou), avec un jet de 50 % au moins. De quoi revendre à l\'HDV.</li>' +
    '<li><b>Le coffre de chaque boss</b> (toutes les 5 vagues) : des kamas ; dès le boss de la 5e, 30 % de chance d\'une pièce de ta panoplie, <b>avec un jet jamais sous la moyenne</b> ; 2 % de chance de runes de forgemagie ; dès le boss de la 10e aussi, 2 % de chance de <b>rune parfaite</b> (jet maximum). Ta Prospection augmente ces chances.</li>' +
    '<li><b>Ton record de la semaine</b> compte au classement de l\'alliance, pour l\'honneur.</li>' +
    '<li>Tomber ne coûte rien de plus : tu gardes tout ce que tu as gagné et tu rentres avec la vie que tu avais en entrant. Le bouton Fuir arrête la partie quand tu veux.</li></ul>' + blocVie() +
    '<div class="hdv-section">Classement de la semaine (' + sem.replace('-S', ', semaine ') + ')</div><div id="arene-classement"><p class="hdv-aide">Chargement…</p></div>' +
    '<div class="act-bas">' + (raison ? '<small>' + raison + '</small>' : '') + '<button class="btn discret" data-montgolfiere="carte">La carte des vents</button><button class="btn kamas" data-montgolfiere="entrerArene"' + (raison ? ' disabled' : '') + '>Entrer : ' + fmt(TICKET_ARENE) + ' ' + KAMA + '</button></div>');
  afficherClassementArene();
}
async function partirArene() {
  const a = etatArene();
  if (niveau(S_.xp) < NIV_ARENE) { toast('L\'Arène ouvre au niveau ' + NIV_ARENE + '.'); return; }
  if (!entreesRestantes()) { toast('Tes ' + ENTREES_ARENE + ' entrées du jour sont prises : l\'Arène te rouvre demain.', 'alerte'); return; }
  if (S_.kamas < TICKET_ARENE) { toast('Il te faut ' + fmt(TICKET_ARENE) + ' kamas pour le ticket.', 'alerte'); return; }
  if (!peutPartir('arene')) return;
  areneSuite = true; fermerModale(); areneSuite = false;
  S_.kamas -= TICKET_ARENE; a.entrees = (a.entrees || 0) + 1; rendreHaut(); sauver();
  if (lieu !== 'arene') {
    if (!(await allerSur('arene'))) { S_.kamas += TICKET_ARENE; a.entrees--; rendreHaut(); sauver(); toast('Le ballon n\'a pas pu décoller (chargement de l\'Arène), réessaie : ton ticket t\'est rendu.', 'alerte'); return; }
    compter('areneVisites');
  }
  const u = paysanMesh.userData; paysanMesh.position.set(ARENE.x + 0.6, 0, ARENE.z + 0.6); u.y = 0; u.angle = ROT_ARENE + Math.PI; paysanMesh.rotation.set(0, u.angle, 0); u.charge = false;
  toast('Bienvenue dans l\'Arène ! Ticket payé : ' + fmt(TICKET_ARENE) + ' kamas. Tiens le plus longtemps possible.', 'or');
  setTimeout(() => { if (lieu === 'arene' && !combat) lancerArene(); }, 1600);
}
function lancerArene() {
  if (combat || !paysanMesh || lieu !== 'arene') return;
  const a = etatArene();
  nouveauCombat('arene', { n: nArene(1), arene: { k: 0, tenues: 0, kamas: 0, xp: 0, objets: [], runes: {}, niv0: niveau(S_.xp), record: a.record || 0, recordSem: recordSemaine() }, pv: vieActuelle(), ...potsDeVague() });
  { const repas = appliquerRepas(); if (repas.length) setTimeout(() => toast('Repas avant l\'Arène : ' + texteRepas(repas) + ' pendant toute la partie.', 'or'), 1200); } /* (valable pour toute la partie) */
  ouvrirHudCombat();
  appliquerVagueArene(combat, vagueArene(1));
}
function vagueAreneTenue(c) { /* une vague nettoyee : ses gains, le coffre du boss, le record ; puis la suivante (apres un souffle, si c'etait un boss) */
  const k = c.arene.k, g = gainsArene(k, c.arene.niv0), a = etatArene(), sem = semaineJeu(), soin = soinArene + 0.06 * nbBonus('foule'); c.arene.tenues = k; c.pv = Math.min(c.pvMax, c.pv + c.pvMax * soin);
  S_.kamas += g.kamas; c.arene.kamas += g.kamas; gagnerXp(g.xp); c.arene.xp += gagnerXp.dernier; const xpV = gagnerXp.dernier; /* (le vrai gain, affiche) */
  if (k > (a.record || 0)) a.record = k; if (k > (a.semaines[sem] || 0)) a.semaines[sem] = k;
  Object.keys(a.semaines).sort().slice(0, -8).forEach((x) => { delete a.semaines[x]; }); /* (les 8 dernieres semaines) */
  let coffre = '';
  const gagneRune = (t, nb) => { runes()[t] = (runes()[t] || 0) + nb; c.arene.runes[t] = (c.arene.runes[t] || 0) + nb; };
  if (k % 5 === 0) { /* le coffre du boss : des kamas (deux fois la vague) ; des le boss de la 10e, 30 % de chance d'une piece de ta panoplie (50 % avant le 19/10/2026) ; 2 % de runes de forgemagie
       (1 a la 5e vague, 2 a la 10e, 3 a la 20e) ; des la 10e, 2 % de rune parfaite. La piece tombe avec un jet jamais sous la moyenne (JET_ARENE) */
    const pros = 1 + caracs().prospection / 100, nf = 1 + Math.floor(k / 10), bonus = 2 * g.kamas, dans = ['+' + fmt(bonus) + ' kamas'];
    S_.kamas += bonus; c.arene.kamas += bonus;
    if (k >= 5 && Math.random() < PIECE_COFFRE * pros) { const id = tirerPiece(panoDe(palierCourant()), pros); /* (des le boss de la 5e depuis le 20/10/2026, la 10e avant) */
      const cle = donnerObjet(id, JET_ARENE); c.arene.objets.push(cle); dans.push((OBJETS[id].rare ? '★ ' : '') + OBJETS[id].nom + ' (jet ' + Math.round(100 * qualiteJet(cle)) + ' %)'); }
    if (Math.random() < RUNE_COFFRE * pros) { gagneRune('forge', nf); dans.push('★ ' + nf + ' rune' + (nf > 1 ? 's' : '') + ' de forgemagie'); }
    if (k >= 10 && Math.random() < RUNE_PARFAITE_COFFRE * pros) { gagneRune('parfaite', 1); dans.push('★ une RUNE PARFAITE'); } /* (des le boss de la 10e depuis le 15/10/2026 : « la rune parfaite descend a la 10 », Mathieu ; la 15e avant) */
    son('niveau'); confettis(dans.length > 1 ? 30 : 10); coffre = ' Coffre du boss : ' + dans.join(', ') + '.';
  }
  toast('Vague ' + k + ' tenue, la foule t\'acclame (+' + Math.round(100 * soin) + ' % de vie) : +' + fmt(g.kamas) + ' kamas, +' + xpV + ' XP.' + coffre, 'or'); rendreHaut(); sauver();
  const p = vagueArene(k + 1);
  if (k % 5 === 0) { c.phases = [p]; c.entracte = true; c.repasEntracte = {}; if (k % 10 === 0) c.arene.choix = tirerBonusArene(); ouvrirEntracte(); } else appliquerVagueArene(c, p);
}
function finArene(abandon) {
  if (combat && combat.genre === 'ile') { finIleBoss(abandon); return; } /* (l'ile des boss a son bilan) */
  const c = combat; if (!c || c.fin || !c.arene) return;
  nettoyerCombat(c, true);
  { const max = statsPerso().pvMax; S_.pv = Math.max(1, vieActuelle(), Math.min(max, Math.round(c.pv))); } /* (au moins la vie d'avant l'Arene, comme a l'ile des boss : a terre, on ne rentre plus a 1 PV, 20/10/2026) */
  const a = etatArene(), A = c.arene, t = A.tenues, rec = t > A.record, recSem = !rec && t > A.recordSem; a.parties = (a.parties || 0) + 1; compter('arenes');
  son(rec || recSem ? 'victoire' : abandon ? 'gelee' : 'defaite'); if (rec) confettis(60);
  const objets = A.objets.map((id) => { const o = obj(id); return o ? '<div class="art">' + icoObjet(id) + '<div><b>' + (o.rare ? '★ ' : '') + o.nom + '</b><div class="puces">' + statsTexte(o.stats) + '</div></div><div class="act"></div></div>' : ''; }).join('');
  const reste = entreesRestantes(), peut = reste > 0 && S_.kamas >= TICKET_ARENE;
  ouvrirModale('arene-fin', entete(abandon ? 'Tu quittes l\'Arène' : 'À terre dans l\'Arène !') +
    '<div class="arene-bilan"><div class="gros">' + t + '</div><div class="sous">vague' + (t > 1 ? 's' : '') + ' tenue' + (t > 1 ? 's' : '') + '</div>' + (rec ? '<div class="record">★ Nouveau record !</div>' : recSem ? '<div class="record">★ Record de la semaine !</div>' : '<div class="sous">record : ' + Math.max(A.record, t) + ', cette semaine : ' + Math.max(A.recordSem, t) + '</div>') + '</div>' +
    '<div class="recap-combat">' + ligneRecap('kama', 'Kamas gagnés', fmt(A.kamas)) + ligneRecap('etoile', 'Expérience', fmt(A.xp)) +
    ligneRecap('tofu', 'Monstres abattus', c.st.tues) + ligneRecap('degats', 'Dégâts infligés', fmt(Math.round(c.st.inflige))) + '</div>' +
    (objets ? '<div class="hdv-section">Les pièces</div>' + objets : '') +
    (Object.keys(A.runes).length ? '<div class="hdv-section">Les runes</div>' + Object.entries(A.runes).map(([t, nb]) => '<div class="art">' + ico('rune-' + t) + '<div><b>' + nb + ' ' + (nb > 1 ? RUNES[t].court : RUNES[t].nom).toLowerCase() + '</b><div class="desc">' + RUNES[t].bref + ' sur une pièce, à ton atelier de forgemagie (Améliorer, ' + fmt(100000) + ' kamas).</div></div><div class="act"></div></div>').join('') : '') +
    '<div class="act-bas"><small style="color:#6b5a48">' + reste + ' entrée' + (reste > 1 ? 's' : '') + ' restante' + (reste > 1 ? 's' : '') + ' aujourd\'hui</small><button class="btn discret" data-montgolfiere="rentrer">Rentrer à la ferme</button>' +
    '<button class="btn kamas" data-montgolfiere="entrerArene"' + (peut ? '' : ' disabled') + '>Rejouer : ' + fmt(TICKET_ARENE) + ' ' + KAMA + '</button></div>');
  rendreHaut(); sauver();
}

