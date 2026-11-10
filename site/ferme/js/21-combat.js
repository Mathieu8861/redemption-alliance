'use strict';
function boostDegats() { try { return combat && combat.boostDeg ? 1 + combat.boostDeg : 1; } catch (e) { return 1; } } /* la Cawotte mangee avant la vague */
function carapaceActive() { try { return !!(combat && combat.carapace > 0); } catch (e) { return false; } } /* (statsPerso peut tourner avant la declaration de combat) */
const statsPerso = () => { const st = STATS_CLASSE[classeDe()], l = NIV_ESSAI || niveau(S_.xp), c = caracs(); /* (NIV_ESSAI : le niveau d'essai de l'Arene dev, 09/11/2026) */ const mt = meuteActive() ? 1 + MEUTE : 1; return { pvMax: Math.round((st.pv(l) + c.vita) * mt), deg: Math.round(st.deg(l) * (1 + c.puissance / 100) * boostDegats() * mt * (carapaceActive() ? 1.3 : 1)), /* (la Carapace de corail du Iop : +30 %, 05/11/2026) */ cadence: +(st.cadence / (1 + c.agilite / 100) / mt).toFixed(2), /* L'AGILITE (13/10/2026) : X % de coups en plus, et non plus X % de temps en moins entre deux coups (60 d'agilite : 1,6 fois plus de coups, et non 2,5 ; a 100, 2 fois et non infini). Pas de plafond, les objets gardent leurs chiffres */ portee: st.portee * mt, niveau: l, base: { pv: st.pv(l), deg: st.deg(l), cadence: st.cadence }, c }; };
let combat = null;
/* LES CLASSES EN CHIFFRES (22/10/2026) : la fenetre du passage de niveau, la page Perso et le choix du personnage lisent tout ici, d'apres STATS_CLASSE
   (rien n'est recopie a la main : une classe reequilibree s'affiche juste partout) */
const degInvoc = (l) => 6 + 2 * l; /* un coup du Bouftou invoque par l'Osamodas */
/* LA MEUTE, passif de classe de l'Osamodas (23/10/2026, « pour l'Osa fais comme tu veux, on revoit ca plus tard », Mathieu) : tant que son Bouftou
   invoque est en vie, l'Osamodas et son Bouftou font 15 % de degats en plus. Puis (09/11/2026, « quand il a son Bouftou invoque sur le terrain, ca augmente de
   15 % toutes ses stats : sa vitesse d'attaque, sa puissance, sa vitesse de deplacement, sa tankiness, sa vitalite, son agilite, ses degats, et de 15 % sa portee
   aussi », Mathieu) : chaque stat finale de l'Osamodas monte de 15 % (vie, degats, coups par seconde, portee, vitesse, degats recus divises par 1,15), une
   seule fois (pas 15 % de Puissance puis encore 15 % de degats) ; sa vie suit (majMeute, 22b-effets.js) */
/* LE BOUFTOU SUIT L'EQUIPEMENT DE L'OSAMODAS (09/11/2026, « que le Bouftou suive un minimum les stats de Dario, qu'il prenne 30 % des stats des equipements », puis « mets 35 %,
   la vitesse de deplacement a 3,5, et il dure 2 secondes de plus », Mathieu) : il reprend PART_BOUFTOU de la Puissance et de l'Agilite de l'Osamodas, qui agissent sur lui
   comme sur l'Osamodas (la Puissance sur ses degats, l'Agilite sur son nombre de coups). Avant, ses degats ne suivaient que le niveau : 202 par coup pour Daryoo
   (Osamodas 85), toutes les 0,8 s ; avec 35 % : 381 toutes les 0,61 s */
const PART_BOUFTOU = 0.35, CADENCE_BOUFTOU = 0.8, VITESSE_BOUFTOU = 3.5;
const MEUTE = 0.10, /* (09/11/2026, « le up de l'osa a 15 % de stats all, reduit le a 10 % », Mathieu) */ meuteActive = () => !!(combat && combat.invoc && classeDe() === 'osa'), degBouftou = (l) => Math.round(degInvoc(l) * (1 + PART_BOUFTOU * caracs().puissance / 100) * (1 + MEUTE)),
  cadenceBouftou = () => +(CADENCE_BOUFTOU / (1 + PART_BOUFTOU * caracs().agilite / 100)).toFixed(2);
const berserkerIop = () => !!(combat && !combat.fin && combat.deroute == null && classeDe() === 'iop' && combat.pv > 0 && combat.pv < combat.pvMax * SEUIL_BERSERKER_IOP); /* le Berserker du Iop (18-geliere.js) */
/* chaque classe en trois lignes : son passif de classe (toujours actif, sans rien faire), son sort (le bouton), le passif de son sort (ce qu'il fait en plus) */
const enBref = (id) => ({ /* (une fonction : VITESSE_CRA n'est defini que plus loin, dans 24-deplacement.js) */
  iop: { passif: ['Peau de Iop : il encaisse ' + Math.round(PEAU_IOP * 100) + ' % de dégâts en moins sur les coups reçus de loin', 'Régénération : il regagne ' + Math.round(REGEN_IOP * 100) + ' % de sa vie toutes les ' + PAS_REGEN_IOP + ' s en combat', 'Berserker : sous ' + Math.round(SEUIL_BERSERKER_IOP * 100) + ' % de vie, ses coups d\'épée font ' + Math.round((BERSERKER_IOP - 1) * 100) + ' % de dégâts en plus (pas ses sorts)'], /* (une puce par passif, 31/10/2026 : « mets-le en bullet points, pas tout sur une meme ligne » ; le balayage est dans le Coup d'epee, l'invincibilite dans l'ulti, Mathieu) */ sort: 'Bond du Iop : il saute sur un monstre, 3 fois ses dégâts ; chaque monstre touché lui rend ' + Math.round(SOIN_CHARGE * 100) + ' % de sa vie (' + Math.round(SOIN_BOND_MAX * 100) + ' % au plus)', passifSort: 'il se soigne de ' + Math.round(SOIN_CHARGE * 100) + ' % par monstre touché (' + Math.round(SOIN_BOND_MAX * 100) + ' % au plus)' },
  cra: { passif: 'il court ' + Math.round((VITESSE_CRA - 1) * 100) + ' % plus vite, et une flèche sur ' + TIR_FEU + ' fait double dégâts (la cible brûle 3 s)', sort: 'Flèche perçante : toute une ligne de monstres, 3 fois ses dégâts', passifSort: null },
  osa: { passif: 'tant que son Bouftou est en vie, toutes ses stats montent de ' + Math.round(MEUTE * 100) + ' % : vie, dégâts, vitesse d\'attaque, portée, vitesse de déplacement, et il encaisse mieux ; son Bouftou frappe ' + Math.round(MEUTE * 100) + ' % plus fort (Meute)', sort: 'Invocation : un Bouftou tombe sur les monstres, 2 fois ses dégâts', passifSort: 'le Bouftou se bat ensuite ' + DUREE_INVOC + ' s à ses côtés : 6 + 2 dégâts par niveau, plus ' + Math.round(PART_BOUFTOU * 100) + ' % de ta Puissance et de ton Agilité, plus la Meute ; un coup toutes les 0,8 s, moins avec ton Agilité' } })[id];
const listePassif = (p) => '<ul class="passifs">' + p.map((x) => '<li>' + x + '</li>').join('') + '</ul>'; /* (un passif en plusieurs points : une liste) */
const lignesEnBref = (id) => { const E = enBref(id); return '<span class="eb"><em>Passif de classe :</em> ' + (Array.isArray(E.passif) ? listePassif(E.passif) : E.passif || 'aucun pour l\'instant') + '</span><span class="eb"><em>Sort :</em> ' + E.sort + '</span><span class="eb"><em>Passif du sort :</em> ' + (E.passifSort || 'aucun') + '</span>'; };
function progressionClasse(id) { const st = STATS_CLASSE[id]; return { pv1: st.pv(1), pvN: st.pv(2) - st.pv(1), deg1: st.deg(1), degN: +((st.deg(NIV_MAX) - st.deg(1)) / (NIV_MAX - 1)).toFixed(1), pvMax: st.pv(NIV_MAX), degMax: st.deg(NIV_MAX), portee: Math.round(st.portee / S), cadence: st.cadence }; }
function gainsNiveau(avant, n) { /* ce que le niveau vient de donner (les totaux comptent l'equipement) */
  const id = classeDe(), st = STATS_CLASSE[id], s = statsPerso(), dp = st.pv(n) - st.pv(avant), dd = st.deg(n) - st.deg(avant);
  return '<div class="fete-gains"><span>' + picto('vita') + 'PV max <b>+' + dp + '</b> (' + fmt(s.pvMax) + ' au total)</span><span>' + picto('degats') + 'Dégâts <b>+' + dd + '</b> (' + s.deg + ' par coup)</span>' +
    (id === 'osa' ? '<span>' + picto('bouftou') + 'Ton Bouftou <b>+' + (degBouftou(n) - degBouftou(avant)) + '</b> (' + degBouftou(n) + ' par coup)</span>' : '') + '</div>';
}
/* « TA CLASSE » EN ANNEAUX (23/10/2026, « on peut faire mieux pour les stats, + stats par niveau gagne » puis « comme ca c'est pas mal, mais il faut que ce
   soit clair : 3 cases ca dit pas que c'est la portee d'attaque ; +2 Bouftou, on pourrait croire qu'on gagne 2 invocations ; le coeur est a l'envers ;
   le 0,9 par coup on sait pas ce que c'est », Mathieu) : un panneau de nuit, le perso sur son ilot, quatre anneaux qui se remplissent jusqu'au niveau max
   (sans equipement ; ce qu'il ajoute en dore dessous), et ce que donne chaque niveau, avec la barre d'XP */
const portraitsRognes = {};
function blocClasse() {
  const id = classeDe(), st = statsPerso(), b = st.base, P = progressionClasse(id), cl = CLASSES.find((x) => x.id === id), e = st.c, l = st.niveau, co = COUL_CLASSE[id] || COUL_CLASSE.iop;
  const porteeMax = Math.max(...['iop', 'cra', 'osa'].map((c) => progressionClasse(c).portee)), src = portraitPerso(), rogne = portraitsRognes[src];
  if (!rogne) rognerPortrait(src).then((r) => { portraitsRognes[src] = r; const im = document.querySelector('.tc-scene img[data-rogner]'); if (im) { im.src = r; im.removeAttribute('data-rogner'); im.classList.add('rogne'); } });
  const anneau = (k, frac, val, unite, nom, eq) => '<div class="tc-ann"><div class="tc-r"><svg class="tc-anneau" viewBox="0 0 100 100"><circle class="tc-f" cx="50" cy="50" r="40"/><circle class="tc-p" cx="50" cy="50" r="40" style="stroke:' + PICTOS[k][0] + ';stroke-dasharray:' + (Math.max(0.03, Math.min(1, frac)) * 251.3).toFixed(1) + ' 252"/></svg>' +
    '<span class="tc-ic" style="background:' + PICTOS[k][0] + '">' + picto(k, '#fff') + '</span><div class="tc-m"><b>' + val + '</b><small>' + unite + '</small></div></div><span class="tc-nom">' + nom + '</span>' + (eq ? '<span class="tc-eq">' + eq + '</span>' : '') + '</div>';
  const gain = (k, n, t) => '<span class="tc-gain">' + picto(k, '#fff') + n + ' <small>' + t + '</small></span>', bf = id === 'osa' ? degBouftou(l + 1) - degBouftou(l) : 0;
  const max = l >= capNiveau(), x0 = seuil(l), x1 = seuil(l + 1), fx = max ? 1 : Math.max(0, Math.min(1, (S_.xp - x0) / Math.max(1, x1 - x0)));
  return '<div class="fc"><h4>Ta classe</h4><div class="tc-panneau" style="--c1:' + co[0] + ';--c2:' + co[1] + '"><div class="tc-scene"><span class="tc-socle"></span><img class="tc-perso' + (rogne ? ' rogne' : '') + '" src="' + (rogne || src) + '"' + (rogne ? '' : ' data-rogner') + ' alt=""></div><div class="tc-droite">' +
    '<div class="tc-titre">' + cl.nom + ' niveau ' + l + '</div><div class="tc-sous">Tes stats de classe, sans équipement. Chaque anneau se remplit jusqu\'au niveau ' + NIV_MAX + '.</div><div class="tc-anns">' +
    anneau('vita', b.pv / P.pvMax, fmt(b.pv), 'PV', 'Points de vie', e.vita ? '+' + fmt(e.vita) + ' PV avec l\'équipement' : '') +
    anneau('degats', b.deg / P.degMax, b.deg, 'par coup', 'Dégâts', e.puissance ? '+' + e.puissance + ' % avec l\'équipement' : '') +
    anneau('cadence', (1 / b.cadence) / 1.6, virgule(b.cadence) + ' s', 'entre 2 coups', 'Vitesse d\'attaque', e.agilite ? '+' + e.agilite + ' % de coups avec l\'équipement' : '') +
    anneau('portee', P.portee / porteeMax, P.portee, P.portee > 1 ? 'cases' : 'case', 'Portée d\'attaque', '') + '</div>' +
    '<div class="tc-suiv"><span class="tc-lv">' + (max ? 'Niveau maximum' : 'Chaque niveau gagné') + '</span>' + (max ? '' : gain('vita', '+' + P.pvN, 'PV') + gain('degats', '+' + virgule(P.degN), 'dégâts') + (bf ? gain('bouftou', '+' + bf, 'dégâts à ton Bouftou') : '')) +
    '<div class="tc-xp"><i style="width:' + (fx * 100).toFixed(1) + '%"></i><b>' + (max ? 'Niveau maximum pour l\'instant' : fmt(S_.xp - x0) + ' / ' + fmt(x1 - x0) + ' XP vers le niveau ' + (l + 1)) + '</b></div></div></div></div></div>';
}
function comparaisonClasses(id) { /* les trois classes cote a cote, sans equipement, et le bilan (id : celle qui est choisie, mise en avant) */
  const cases = (n) => n + ' case' + (n > 1 ? 's' : '');
  const cartes = CLASSES.slice().sort((x, y) => x.rang - y.rang).map((k) => { const Q = progressionClasse(k.id);
    return '<div class="fc-carte' + (k.id === id ? ' moi' : '') + '"><div class="fc-nom"><img src="assets/icones/' + k.id + '.png?v=' + VERSION_MODELES + '" alt=""><b>' + k.nom + '</b><i>' + k.role + '</i></div>' +
      '<span>' + picto('vita') + Q.pv1 + ' PV au départ, <b>+' + Q.pvN + '</b> par niveau</span><span>' + picto('degats') + Q.deg1 + ' dégâts au départ, <b>+' + virgule(Q.degN) + '</b> par niveau</span>' +
      '<span>' + picto('etoile') + 'Au niveau ' + NIV_MAX + ' : <b>' + fmt(Q.pvMax) + ' PV</b>, <b>' + Q.degMax + ' dégâts</b></span><span>' + picto('portee') + 'Portée ' + cases(Q.portee) + ', un coup toutes les ' + virgule(Q.cadence) + ' s</span>' + lignesEnBref(k.id) + '</div>'; }).join('');
  const I = progressionClasse('iop'), C = progressionClasse('cra'), O = progressionClasse('osa');
  const bilan = 'Au niveau ' + NIV_MAX + ', le Iop a ' + Math.round((I.pvMax / C.pvMax - 1) * 100) + ' % de PV en plus que le Cra et l\'Osamodas, il encaisse 15 % de dégâts en moins sur les coups de loin, se régénère en combat, ses coups d\'épée font 50 % de dégâts en plus sous 50 % de vie et il devient invincible 2,5 s à chaque ulti : c\'est ce qui paie le corps à corps. Le Cra frappe presque aussi fort (' + C.degMax + ' contre ' + I.degMax + ') sans se faire toucher. L\'Osamodas frappe moins fort lui-même (' + O.degMax + '), mais son Bouftou ajoute ses coups aux siens (' + degBouftou(NIV_MAX) + ' par coup au niveau ' + NIV_MAX + ', selon le seul niveau : l\'équipement ne les change pas), et tant qu\'il est en vie, la Meute leur donne ' + Math.round(MEUTE * 100) + ' % de dégâts en plus à tous les deux. Pour le reste, l\'équipement compte autant que la classe.';
  return '<div class="fc"><div class="fc-grille">' + cartes + '</div><p class="fc-bilan">' + bilan + '</p></div>';
}
/* LE DEBUT ET LA FIN D'UN COMBAT (refonte du 16/10/2026) : la vague, la simu VSA, l'Arene et l'ile des boss partent tous de nouveauCombat
   et finissent tous par nettoyerCombat (avant : quatre copies qui divergeaient). genre : 'vague', 'raid', 'arene' ou 'ile'.
   Les pots bus avant la vague (Menthe, Citron, Royale) ne sont pris que par les combats qui les consomment (potsDeVague) : la simu VSA les laisse. */
const potsDeVague = () => ({ regen: menthePrete(), citron: citronPret(), agi: royalePrete() });
function nouveauCombat(genre, champs) {
  const st = statsPerso();
  return (combat = Object.assign({ genre, n: 0, file: [], total: 1, attente: 1, st: { inflige: 0, max: 0, recus: 0, soins: 0, menthe: 0, sorts: 0, tues: 0 }, monstres: [], cible: null, pv: st.pvMax, pvMax: st.pvMax,
    cdAttaque: 0, cdSort: 0, cdUlti: 0, invoc: null, ordre: false, heros: {}, id: 0, fin: false, victoire: 0, phases: [] }, champs));
}
function appliquerRepas() { /* LE REPAS D'AVANT COMBAT (16/10/2026) : ce que le perso a mange vaut pour ce combat (vague, Arene, ile des boss) ;
  avec l'arme du Wa Wabbit, pour deux combats. Renvoie les repas pris (pour le message). */
  const repas = Object.keys(S_.mange || {}).filter((id) => S_.mange[id] && PAR_ID[id] && PAR_ID[id].mange);
  repas.forEach((id) => { const m = PAR_ID[id].mange; if (m.deg) combat.boostDeg = (combat.boostDeg || 0) + m.deg; if (m.pros) combat.boostPros = (combat.boostPros || 0) + m.pros; if (m.recharge) combat.boostRecharge = (combat.boostRecharge || 0) + m.recharge; (combat.repasActifs = combat.repasActifs || {})[id] = true; });
  if (repas.length) { if (legPorte('wa') && !S_.mangeDeux) S_.mangeDeux = true; else { S_.mange = {}; S_.mangeDeux = false; } sauver(); }
  return repas;
}
const texteRepas = (repas) => repas.map((id) => PAR_ID[id].nom + ' ' + PAR_ID[id].mange.txt).join(', ');
function ouvrirHudCombat() { /* l'interface de combat : la classe et le niveau du perso, son sort et son ulti */
  const st = statsPerso(), cl = CLASSES.find((c) => c.id === classeDe());
  mode = null; aDeplacer = null; majBandeau(); chemin = []; arrivee = null;
  $('hud').classList.add('en-combat'); $('combat').hidden = false;
  $('combat-ico').src = 'assets/icones/' + icoClasse() + '.png?v=' + VERSION_MODELES; $('combat-nom').textContent = cl.nom + ' niveau ' + st.niveau; { const m3 = 'sort3d-' + modeleDe(classeDe(), S_.perso.look) + '-sort'; $('sort-rond').innerHTML = (ICONES_3D.has(m3) ? '<img class="trois-d" src="assets/icones/' + m3 + '.png?v=' + VERSION_MODELES + V_ICONES_3D + '" alt="">' : '<img src="assets/icones/btn-sort-' + modeleDe(classeDe(), S_.perso.look) + '.png?v=' + VERSION_MODELES + '" alt="">') + '<span>' + cl.sort + '</span>'; }
  $('ulti-rond').innerHTML = S_.ulti ? '<img class="trois-d" src="' + srcUlti(S_.ulti) + '" alt=""><span>' + nomUlti(S_.ulti) + '</span>' : '<img class="trois-d" src="' + srcUlti('zone') + '" alt="" style="filter:grayscale(1) brightness(1.2);opacity:.75"><span>Ulti</span>'; $('ulti-rond').style.setProperty('--teinte', S_.ulti ? ULTIS[S_.ulti].teinte : '#9b6cff');
}
function nettoyerCombat(c, releve) { /* les monstres et leurs effets disparaissent, l'interface de combat se ferme ; releve : le perso se remet debout */
  c.fin = true;
  c.monstres.forEach((o) => { if (o.m.parent) { pouf(o.x, o.m.position.y, o.z, 1.5); jeter(o.m); } o.barre.remove(); });
  (c.fumees || []).forEach((f) => jeter(f.g)); (c.solsPara || []).forEach((g) => jeter(g)); /* (les cercles d'atterrissage des parachutistes) */ /* (les nuages du Koulosse se dissipent) */
  if (c.invoc) jeter(c.invoc.m);
  if (c.bouture && c.bouture.m) jeter(c.bouture.m); /* (la Bouture de l'Osa, 09/11/2026) */
  combat = null; ANNEAU.visible = false; annulerVisee(); chemin = []; arrivee = null; const u = paysanMesh.userData; u.attaque = null; u.enVol = false; u.tempete = false; if (releve) { u.charge = false; paysanMesh.rotation.x = 0; } $('b-fuir').hidden = false;
  $('hud').classList.remove('en-combat'); $('combat').hidden = true; $('combat-zone').innerHTML = ''; $('boss-barre').hidden = true; $('boss-barre')._mo = null; if (modaleOuverte === 'entracte') fermerModale();
}
function persoATerre() { /* la vie du perso tombe a 0 : la simu VSA s'arrete, l'Arene et l'ile ont leur bilan, une vague tourne a la deroute */
  if (combat.raid) finVague(false); else if (combat.arene) finArene(false); else commencerDeroute();
}
const caseIci = (x, z) => caseSous(x, z);
/* le prochain point vers lequel marcher : en ligne droite si la cible est sur la meme case ou une voisine, sinon par les cases (muret, batiments) */
function prochainPas(e, x, z, dt) {
  const a = caseIci(e.x, e.z), b = caseIci(x, z);
  if (!a || !b || a === b || voisins(a).includes(b)) return { x, z };
  e.routeT = (e.routeT || 0) - dt;
  if (!e.route || e.routeT <= 0 || e.routeB !== b.id) { e.route = trajet(a, b); /* une cible sur un batiment : le trajet s'arrete a cote */ e.routeB = b.id; e.routeT = 0.5; }
  if (e.route) { const k = e.route.indexOf(a), nx = e.route[k >= 0 ? k + 1 : 1]; if (nx) { const q = posCase(nx); return { x: q.x, z: q.z }; } }
  return { x, z };
}
/* LE TRAJET VERS LA CIBLE (09/11/2026, « quand on selectionne un monstre, parfois il prend un chemin qui nous met grave en danger et qui n'est pas logique »,
   Mathieu) : en ligne droite quand rien ne bloque (avant, il passait par le centre de chaque case) ; loin de sa cible, il evite les zones rouges ou il n'est pas
   deja et les autres monstres : l'axe direct d'abord, puis des ecarts de 20 en 20 degres de chaque cote ; par les cases seulement si un batiment barre la route */
const DEVIATIONS = [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05];
function pasVersCible(e, c, dt) {
  const dx = c.x - e.x, dz = c.z - e.z, D = Math.hypot(dx, dz);
  if (!ligneLibre({ x: e.x, z: e.z }, { x: c.x, z: c.z })) return prochainPas(e, c.x, c.z, dt);
  if (D < 3) return { x: c.x, z: c.z }; /* (tout pres : droit sur elle, meme au milieu de sa troupe) */
  const Z = (combat.dangers || []).filter((d) => !dansDanger(d, e.x, e.z)), autres = combat.monstres.filter((o) => o !== c && o.etat === 'actif');
  const risque = (x, z) => Z.some((d) => dansDanger(d, x, z)) || autres.some((o) => Math.hypot(o.x - x, o.z - z) < 0.9 + (o.d.ombre || 1) * 0.35);
  const a0 = Math.atan2(dx, dz), L = Math.min(D, 1.6);
  for (const da of DEVIATIONS) { const a = a0 + da, x = e.x + Math.sin(a) * L, z = e.z + Math.cos(a) * L;
    if (risque(x, z) || risque(e.x + Math.sin(a) * L * 0.5, e.z + Math.cos(a) * L * 0.5) || !ligneLibre({ x: e.x, z: e.z }, { x, z })) continue;
    return da === 0 ? { x: c.x, z: c.z } : { x, z }; }
  return { x: c.x, z: c.z };
}
/* LES COUPS EN ROUTE (09/11/2026, « tres souvent mes auto-attaques partent alors que ma fleche precedente va le tuer, ca me fait perdre mon timing », Mathieu) :
   chaque coup lance note ses degats prevus sur sa cible jusqu'a l'impact (2,5 s au plus) ; une cible deja condamnee par ce qui est en vol est laissee,
   le perso passe a la suivante. Estimation prudente (90 %, les reductions du monstre comprises) : au pire il retire sur un monstre qui a survecu */
const degatsPrevus = (mo, n) => n * (mo.d.armure ? 1 - mo.d.armure : 1) * (mo.bouclier > 0 ? 0.6 : 1) * (mo.d.boss && mo.protege > 0 ? 1 - mo.protege : 1) * (mo.carapace > 0 ? 0.2 : 1) * (mo.pierre > 0 ? 0.5 : 1) * 0.9;
const prevuSur = (o) => { const L = o.prevus; if (!L || !L.length) return 0; const t = performance.now(); let n = 0; for (let i = L.length - 1; i >= 0; i--) { if (L[i].fin < t) L.splice(i, 1); else n += L[i].n; } return n; };
const condamne = (o) => !!o.prevus && o.prevus.length > 0 && prevuSur(o) >= o.pv;
function monstreAViser(p, max) { /* les tours et l'arbalete : d'abord un monstre qui s'en prend a un batiment (un casseur que le perso n'est pas venu chercher), sinon le plus proche */
  let best = null, bd = max || Infinity, cas = null, bc = max || Infinity;
  if (combat) combat.monstres.forEach((o) => { if (o.etat !== 'actif') return; const d = Math.hypot(o.x - p.x, o.z - p.z); if (d < bd) { bd = d; best = o; } if (o.casseur && !o.aggro && o.bat && d < bc) { bc = d; cas = o; } });
  return cas || best;
}
function plusProcheMonstre(p, max) {
  let best = null, bd = max || Infinity;
  if (combat) combat.monstres.forEach((o) => { if (o.etat !== 'actif') return; const d = Math.hypot(o.x - p.x, o.z - p.z); if (d < bd) { bd = d; best = o; } });
  return best;
}
const tourner = (o, ang, dt) => { let d = ang - o.ry; d = Math.atan2(Math.sin(d), Math.cos(d)); o.ry += d * Math.min(1, dt * 8); };
const vecC = new T.Vector3();
function versEcran(p, el) { vecC.copy(p).project(camera); el.style.left = ((vecC.x + 1) / 2 * innerWidth).toFixed(1) + 'px'; el.style.top = ((1 - vecC.y) / 2 * innerHeight).toFixed(1) + 'px'; }
/* un nombre qui monte et s'efface : degats sur un monstre, ou sur le perso (en rouge) */
function chiffre(txt, pos, genre) {
  if (typeof txt === 'string') txt = txt.replace(/\d+\.\d+/g, (x) => String(Math.round(parseFloat(x)))); /* (jamais de chiffre a virgule affiche, 07/11/2026) */
  const e = document.createElement('div'); e.className = 'degat ' + (genre || ''); e.textContent = txt; (combat ? $('combat-zone') : zoneBulles).appendChild(e);
  const p = pos.clone(); p.x += (Math.random() - 0.5) * 0.4; let t = 0; const vie = genre === 'vol' ? 1.6 : 0.9; /* une recolte volee reste lisible un peu plus longtemps */
  effets.push((dt) => { t += dt; const q = p.clone(); q.y += t * (genre === 'vol' ? 0.7 : 1.3); versEcran(q, e); e.style.opacity = String(Math.max(0, 1 - Math.max(0, t - (vie - 0.4)) / 0.4)); if (t >= vie) { e.remove(); return true; } });
}
/* un petit nuage de poussiere : un anneau qui s'ecarte au sol */
function pouf(x, y, z, r, couleur) {
  const m = new T.Mesh(new T.RingGeometry(0.2, 0.45, 20), new T.MeshBasicMaterial({ color: couleur || '#fffaf0', transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y + 0.05, z); scene.add(m);
  let t = 0; effets.push((dt) => { t += dt / 0.4; m.scale.setScalar(1 + t * (r || 2)); m.material.opacity = 0.85 * (1 - t); if (t >= 1) { jeter(m); return true; } });
}
/* l'anneau sous le monstre cible : pour un monstre au corps a corps, son rayon est sa portee exacte (16/10/2026). (01/11/2026, par Discord, « le cercle jaune
   autour des ennemis, c'est leur portee d'attaque au corps a corps ? Faudrait rendre ca plus joli », Mathieu) Un disque en degrade, un anneau fin, des tirets
   qui tournent et quatre fleches qui pointent vers lui ; il passe au rouge quand tu es a sa portee. Rayon 1 : le jeu l'agrandit au rayon voulu */
const ANNEAU = (() => {
  const g = new T.Group(), cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'), gr = x.createRadialGradient(64, 64, 10, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.08)'); gr.addColorStop(1, 'rgba(255,255,255,0.4)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  const mt = (o) => new T.MeshBasicMaterial(Object.assign({ color: '#f2b630', transparent: true, depthWrite: false, side: T.DoubleSide }, o)), plat = (geo, m) => { const o = new T.Mesh(geo, m); o.rotation.x = -Math.PI / 2; o.renderOrder = 2; return o; };
  const fond = plat(new T.CircleGeometry(1, 64), mt({ map: new T.CanvasTexture(cv), opacity: 0.9 })), trait = plat(new T.RingGeometry(0.965, 1, 96), mt({ opacity: 0.95 }));
  const tirets = new T.Group(); for (let k = 0; k < 12; k++) tirets.add(plat(new T.RingGeometry(1.05, 1.1, 6, 1, k / 12 * Math.PI * 2, 0.26), mt({ opacity: 0.85 })));
  const fleches = new T.Group(), tri = new T.Shape(); tri.moveTo(0, -0.07); tri.lineTo(0.09, 0.06); tri.lineTo(-0.09, 0.06); tri.lineTo(0, -0.07);
  for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2, m = plat(new T.ShapeGeometry(tri), mt({ opacity: 0.95 })); m.position.set(Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2); m.rotation.z = -a - Math.PI / 2; m.rotation.order = 'XYZ'; fleches.add(m); }
  g.add(fond, trait, tirets, fleches); g.userData = { tirets, fleches, mats: [fond, trait, ...tirets.children, ...fleches.children].map((o) => o.material) }; return g;
})();
partager(ANNEAU);
ANNEAU.visible = false; scene.add(ANNEAU);

/* LA FENETRE DES VAGUES REFAITE (09/11/2026, « c'est un peu le bazar ; ton perso, ton ulti, la simu VSA, je vois pas pourquoi ; devoir scroller pour refaire
   les boss », puis la proposition 1 : « niquel ca », Mathieu) : trois onglets en haut (la vague, refaire un boss, le bestiaire) ; la vague montre ses monstres,
   puis trois colonnes avant la bataille (manger, boire, la defense avec les carreaux d'acier), et le bouton Lancer reste en bas. Ce qui est deja mange ou bu
   pour la prochaine vague le dit (« pas juste mettre aucune ou boire/manger », Mathieu). La fiche du perso, l'ulti et la simu VSA restent dans leurs fenetres. */
function ouvrirVagues(onglet) {
  const fini = S_.vague.num > VAGUES_TOTAL, n = vagueCourante(), P = palierDe(n), base = P * VAGUES_PALIER, B = MONSTRES[PALIERS_TOUS[P].boss], st = statsPerso(), g = gainsVague(n, fini), repos = S_.vague.repos - Date.now();
  const battus = PALIERS.map((p, k) => k).filter((k) => S_.vague.num > (k + 1) * VAGUES_PALIER);
  if (typeof onglet === 'string') { ouvrirVagues.onglet = onglet; ouvrirVagues.prep = null; } else if (modaleOuverte !== 'vagues') { ouvrirVagues.onglet = fini ? 'boss' : 'vague'; ouvrirVagues.prep = null; }
  if (!battus.length) ouvrirVagues.onglet = 'vague'; const ong = ouvrirVagues.onglet;
  const img = (x) => '<img src="assets/icones/' + x + '.png?v=' + VERSION_MODELES + '" alt="">';
  const titre = entete(fini ? 'Tous les paliers terminés' : 'Vague ' + n + ' (' + (n - base) + ' sur ' + VAGUES_PALIER + ')') + blocVie(true) +
    '<div class="vg-onglets"><button class="' + (ong === 'vague' ? 'on' : '') + '" data-vg-onglet="vague">' + (fini ? 'Les vagues' : 'Vague ' + n) + '<small>' + PALIERS_TOUS[P].nom + '</small></button>' +
    '<button class="' + (ong === 'boss' ? 'on' : '') + '" data-vg-onglet="boss"' + (battus.length ? '' : ' disabled') + '>Refaire un boss<small>' + (battus.length ? battus.length + ' boss battu' + (battus.length > 1 ? 's' : '') : 'aucun boss battu') + '</small></button>' +
    '<button data-vg-onglet="bestiaire">Bestiaire<small>et butin</small></button></div>';
  if (ouvrirVagues.prep && battus.includes(ouvrirVagues.prep.k)) { ouvrirModale('vagues', vueRevanche(ouvrirVagues.prep.k, ouvrirVagues.prep.dur, repos)); return; }
  if (ong === 'boss') { ouvrirModale('vagues', titre + ongletBoss(battus, repos)); return; }
  if (fini) { ouvrirModale('vagues', titre + '<p class="vg-aide">' + leNom(B) + ' est tombé' + ac(B) + ' : tous les paliers sont terminés, la suite arrive bientôt. En attendant, chaque boss se rejoue une fois par jour (onglet Refaire un boss).</p>' + avantBataille()); return; }
  const piste = Array.from({ length: VAGUES_PALIER - 1 }, (_, k) => { const v = base + k + 1; return '<i class="' + (v < S_.vague.num ? 'fait' : v === n ? 'ici' : '') + '">' + v + '</i>'; }).join('') + '<img class="' + (fini || S_.vague.num > base + VAGUES_PALIER ? 'fait' : n === base + VAGUES_PALIER ? 'ici' : '') + '" src="assets/icones/' + PALIERS_TOUS[P].icone + '.png" alt="' + B.nom + '" data-info="' + B.nom + '">';
  completerBestiaire(); const vusB = bestiaire(); /* (chaque monstre se touche : sa fiche s'ouvre ; « Nouveau ! » s'il n'a jamais ete croise) */
  const monstres = compoTotale(n).map(([t, k]) => { const M = MONSTRES[t], neuf = !vusB[t];
    return '<button class="vg-mon' + (M.boss ? ' boss' : '') + '" data-fiche-monstre="' + t + '" data-info="Sa fiche">' + (neuf ? '<em class="vg-neuf">Nouveau !</em>' : '') + img(M.icone) + '<b>× ' + k + '</b><span>' + M.nom + '</span><small>' + fmt(pvMonstre(t, n)) + ' PV · ' + fmt(Math.round(degMonstre(t, n) * multDegats(n) * multHautes(n) * autoFiche(M, t, n))) + ' par coup</small></button>'; }).join('');
  /* en bas : les gains et le bouton, toujours visibles */
  const prepa = (S_.vague.prepa || 0) - Date.now(), requis = niveauRequis(n);
  const bouton = repos > 0 ? '<button class="btn vg-lancer" disabled>Ton perso se repose encore ' + dureeLisible(repos) + '</button>' : prepa > 0 ? '<button class="btn vg-lancer" disabled>La vague ' + n + ' se prépare : ' + dureeLisible(prepa) + '</button>' : st.niveau < requis ? '<button class="btn vg-lancer" disabled>Niveau ' + requis + ' requis (tu es niveau ' + st.niveau + ')</button>' : '<button class="btn kamas vg-lancer" data-lancer-vague>Lancer la vague ' + n + '</button>';
  const pied = '<div class="vg-pied">' + img('kama') + '<span class="vg-gain">' + fmt(g.kamas) + ' kamas et ' + xpReel(g.xp) + ' XP à gagner' + (n === base + VAGUES_PALIER ? '<small>Battre ' + leNom(B, true) + ' termine le palier ' + PALIERS_TOUS[P].nom + (P + 1 < vaguesOuvertes() / VAGUES_PALIER ? ' et ouvre le suivant : ' + PALIERS_TOUS[P + 1].nom + '.' : '.') + '</small>' : '') + '</span>' + bouton + '</div>';
  ouvrirModale('vagues', titre + '<div class="vg-entete"><span class="hdv-section">Ils arrivent</span><div class="vg-piste petite">' + piste + '</div></div><div class="vg-mons">' + monstres + '</div>' + (vagueBoss(n) ? '<p class="vg-boss">Sa troupe protège le boss : chaque monstre près de lui lui retire 12 % de tes dégâts (jusqu\'à 60 %), et il en rappelle deux toutes les ' + RAPPEL_TROUPE + ' s. Dégage sa troupe, puis frappe-le avant qu\'elle revienne.</p>' : '') +
    avantBataille() + pied);
}
/* AVANT LA BATAILLE : manger, boire, la defense ; ce qui est deja pris pour la prochaine vague est coche en vert. Dans la vague, quand tous les paliers
   sont termines, et avant chaque revanche (09/11/2026, « vu que je suis niveau 90, ca me propose pas les potions pour refaire les boss », Mathieu) */
function avantBataille() {
  const st = statsPerso(), img = (x) => '<img src="assets/icones/' + x + '.png?v=' + VERSION_MODELES + '" alt="">';
  S_.mange = S_.mange || {}; S_.pots = S_.pots || {};
  const ligne = (icone, nom, sous, act, pris) => '<div class="vg-ligne' + (pris ? ' pris' : '') + '">' + img(icone) + '<span>' + nom + '<small>' + sous + '</small></span>' + act + '</div>';
  const repas = CULTURES.filter((c) => c.mange && (niveau(S_.xp) >= c.niv || (S_.grange[c.id] || 0) > 0)).map((c) => { const k = S_.grange[c.id] || 0, pris = !!S_.mange[c.id];
    return ligne(c.id, c.nom, c.mange.txt + (pris ? ', pendant cette vague' : ''), pris ? '<b class="vg-ok">✓ ' + (c.id === 'bananagrume' ? 'Mangé' : 'Mangée') + '</b>' : k ? '<button class="btn mini" data-manger="' + c.id + '">Manger (' + fmt(k) + ')</button>' : '<span class="vg-zero">0 en grange</span>', pris); }).join('') || '<p class="vg-vide">Pas encore de récolte à manger : la Cawotte se plante au niveau ' + PAR_ID.cawotte.niv + '.</p>';
  const bu = (t) => (POTS[t].menthe && S_.menthe) || (POTS[t].citron && S_.citron) || (POTS[t].agi && S_.royale), plein = vieActuelle() >= st.pvMax;
  const pots = Object.keys(POTS).filter((t) => POTS_HDV.includes(t) || (S_.pots[t] || 0) > 0 || bu(t)).map((t) => { const k = S_.pots[t] || 0, b = bu(t), bonus = POTS[t].menthe || POTS[t].citron || POTS[t].agi;
    return ligne('pot-' + t, POTS[t].court, BREF_POT[t], b ? '<b class="vg-ok">✓ Bu</b>' : !k ? (POTS_HDV.includes(t) ? '<button class="btn mini discret" data-hdv-cat="gelees">Acheter</button>' : '<span class="vg-zero">0 en grange</span>') : plein && !bonus ? '<span class="vg-zero">Vie pleine</span>' : '<button class="btn mini" data-boire="' + t + '">Boire (' + fmt(k) + ')</button>', b); }).join('');
  const a = niv('arbalete'), cap = a ? capaciteArbalete() : 0;
  const defense = a ? ligne('arbalete', 'Arbalète de la grange', (S_.carreaux > 0 ? S_.carreaux + '/' + cap + ' chargée' + (rechargeAuto() ? ', se recharge seule' : '') : rechargeAuto() ? 'plus de flèches en réserve' : 'à recharger à la grange') + ', ' + degatsArbalete() + ' dégâts, ' + fmt(S_.fleches) + ' flèche' + (S_.fleches > 1 ? 's' : ''), '') + (a >= 6 ? blocAcier() : '')
    : '<p class="vg-vide">Pas encore d\'arbalète : elle se construit sur la grange (HDV, Améliorer).</p>';
  /* (le bouclier de carapace, 10/11/2026 : fabrique a l'atelier, pose ici avant la vague, il part avec elle ; 03-equipements.js) */
  const nB = S_.boucliers || 0, bouclier = nB || S_.bouclierPose || (niv('atelier') && !amelioCachee('atelier')) ? ligne('bouclier-ecailles', 'Bouclier de carapace', nomQG() + ' gagne ' + fmt(Math.round(pvMaxBat('grange') * BOUCLIER_BASE)) + ' PV de bouclier (' + Math.round(BOUCLIER_BASE * 100) + ' % de sa vie)' + (S_.bouclierPose ? ', pendant cette vague' : ''), S_.bouclierPose ? '<b class="vg-ok">✓ Posé</b>' : nB ? '<button class="btn mini" data-poser-bouclier>Poser (' + fmt(nB) + ')</button>' : '<span class="vg-zero">0, à fabriquer à l\'atelier</span>', !!S_.bouclierPose) : '';
  return '<div class="hdv-section">Avant la bataille</div><div class="vg-trois"><div class="vg-col"><h4>Manger</h4>' + repas + '</div><div class="vg-col"><h4>Boire</h4>' + pots + '</div><div class="vg-col"><h4>Défense</h4>' + defense + bouclier + '</div></div>';
}
/* l'onglet Refaire un boss : chaque boss battu en carte, Normal ou Difficile, sans defiler toute la fenetre (09/11/2026) */
function ongletBoss(battus, repos) {
  const ref = vagueRefDifficile(niveau(S_.xp)), Bref = MONSTRES[PALIERS_TOUS[palierDe(ref)].boss];
  return '<p class="vg-aide">Un boss battu se rejoue une fois par jour, remis à ton niveau. Ses kamas et son XP baissent de moitié à chaque nouvelle victoire, pas son butin. <b>Difficile</b> : la vie et les coups du boss de ton niveau (' + leNom(Bref, true) + ', vague ' + ref + ') avec ' + Math.round((DUR.pv - 1) * 100) + ' % de vie en plus, plus vicieux, et deux fois plus de chances sur sa pièce légendaire. Une seule revanche par jour et par boss.</p>' +
    (repos > 0 ? '<p class="vg-repos">Ton perso se repose encore ' + dureeLisible(repos) + ' : les revanches attendent aussi.</p>' : '') +
    '<div class="vg-bgrille">' + battus.map((k) => { const Bk = MONSTRES[PALIERS_TOUS[k].boss], leg = LEGENDAIRES.find((x) => x.boss === PALIERS_TOUS[k].boss), ok = bossRejouable(k), gk = gainsBoss(k);
      return '<div class="vg-bcarte' + (ok ? '' : ' fait') + '"><img src="assets/icones/' + Bk.icone + '.png?v=' + VERSION_MODELES + '" alt=""><div><b>' + Bk.nom + '</b><small>Vague ' + ((k + 1) * VAGUES_PALIER) + ' · +' + fmt(gk.kamas) + ' kamas · +' + xpReel(gk.xp) + ' XP</small>' +
        (leg ? '<small class="vg-leg">✦ ' + (leg.nom || OBJETS[idLeg(leg)].nom) + ' : 2 %, 4 % en difficile' + (possede(idLeg(leg)) ? ' (déjà à toi)' : '') + '</small>' : '') +
        '<span class="vg-btns">' + (ok ? '<button class="btn kamas mini" data-vg-prep="' + k + '|0">Normal</button><button class="btn mini dur" data-vg-prep="' + k + '|1">Difficile</button>' : '<span class="vg-zero">Déjà rejoué aujourd\'hui, reviens demain</span>') + '</span></div></div>'; }).join('') + '</div>';
}
/* LA PREPARATION D'UNE REVANCHE (09/11/2026, « quand tu cliques sur normal ou difficile, ca t'ouvre une pop-up ou tu selectionnes ce que tu veux avant de lancer »,
   Mathieu) : le boss choisi, normal ou difficile, puis manger, boire et la defense, et le bouton qui lance ; Retour revient a la liste des boss */
function vueRevanche(k, dur, repos) {
  const Bk = MONSTRES[PALIERS_TOUS[k].boss], leg = LEGENDAIRES.find((x) => x.boss === PALIERS_TOUS[k].boss), ok = bossRejouable(k), gk = gainsBoss(k), ref = vagueRefDifficile(niveau(S_.xp));
  const lancer = !ok ? '<button class="btn vg-lancer" disabled>Déjà rejoué aujourd\'hui</button>' : repos > 0 ? '<button class="btn vg-lancer" disabled>Ton perso se repose encore ' + dureeLisible(repos) + '</button>'
    : '<button class="btn ' + (dur ? 'dur' : 'kamas') + ' vg-lancer" data-rejouer-' + (dur ? 'dur' : 'boss') + '="' + k + '">' + (dur ? 'Lancer en difficile' : 'Lancer la revanche') + '</button>';
  return entete('Revanche : ' + Bk.nom) + blocVie(true) +
    '<div class="vg-revanche' + (dur ? ' dur' : '') + '"><img src="assets/icones/' + Bk.icone + '.png?v=' + VERSION_MODELES + '" alt=""><div><b>' + Bk.nom + '<em>' + (dur ? 'Difficile' : 'Normal') + '</em></b>' +
    '<small>Vague ' + ((k + 1) * VAGUES_PALIER) + ' · +' + fmt(gk.kamas) + ' kamas · +' + xpReel(gk.xp) + ' XP</small>' + (leg ? '<small class="vg-leg">✦ ' + (leg.nom || OBJETS[idLeg(leg)].nom) + ' : ' + (dur ? '4' : '2') + ' % de chances' + (possede(idLeg(leg)) ? ' (déjà à toi)' : '') + '</small>' : '') +
    (dur ? '<small>La vie et les coups du boss de ton niveau (' + leNom(MONSTRES[PALIERS_TOUS[palierDe(ref)].boss], true) + ', vague ' + ref + ') avec ' + Math.round((DUR.pv - 1) * 100) + ' % de vie en plus, et plus vicieux.</small>' : '') + '</div></div>' +
    avantBataille() + '<div class="vg-pied"><button class="btn discret" data-vg-onglet="boss">Retour</button><span class="vg-gain"></span>' + lancer + '</div>';
}
/* le Bestiaire et butin (valide le 11/10/2026) : chaque monstre avec ses PV, ses degats et ce qu'il lache (avec ta Prospection),
   chaque panoplie avec ses pieces, son arme, ses bonus et ou la trouver. Les paliers pas encore atteints restent a decouvrir. */
const vaguesDe = (t) => (vaguesDe.c || (vaguesDe.c = {}))[t] || (vaguesDe.c[t] = Array.from({ length: VAGUES_TOTAL }, (_, k) => k + 1).filter((n) => compoTotale(n).some(([x]) => x === t)));
const casesDe = (u) => Math.round(u / S * 2) / 2; /* (une case : 2 unites) */
function ficheMonstre(t) {
  const d = MONSTRES[t], B = bestiaire()[t] || {}, V = vaguesDe(t), n = V.length ? Math.min(Math.max(S_.vague.num, V[0]), V[V.length - 1]) : Math.max(1, Math.min(S_.vague.num, VAGUES_TOTAL));
  const pv = pvMonstre(t, n), deg = Math.round(degMonstre(t, n) * multDegats(n) * multHautes(n) * autoFiche(d, t, n)), dSort = d.boss ? Math.round(degMonstre(t, n) / BOSS_DEG[palierDe(n)] * (d.degSort || 0) * multHautes(n)) : Math.round(deg * (d.degSort || 1.5));
  const P = V.length ? palierDe(V[0]) : null, pros = 1 + caracs().prospection / 100, pc = (x) => (Math.round(Math.min(1, x) * 1000) / 10).toString().replace('.', ',') + ' %';
  const vis = d.grignote ? 'Tes cultures' : d.bandit ? 'Ta grange' : d.casse ? 'Toi ou tes bâtiments' : 'Toi', vM = vitesseMonstre(d), vit = vM <= VITESSE_MIN_MONSTRES ? 'lent' : vM < 2.7 ? 'moyen' : 'rapide';
  const tag = (p, t2, cl) => '<span class="puce ' + (cl || '') + '">' + picto(p) + t2 + '</span>', num = (t2, cl) => '<span class="puce ' + (cl || '') + '">' + t2 + '</span>';
  const tags = [d.boss && tag('couronne', d.demi ? 'Demi-boss' : 'Boss', 'or'), d.armure && tag('bouclier', 'Armure ' + Math.round(d.armure * 100) + ' %'), d.distance && tag('carreaux', 'Tire de loin'), d.casse && tag('casse', 'Casse les bâtiments'),
    !d.boss && d.charge && tag('charge', 'Charge', 'violet'), d.pique && tag('pique', 'Pique en vol', 'violet'), !d.boss && peutSauter({ d, aggro: true }) && tag('saut', 'Saute', 'violet'), d.vol && tag('vol', 'Vole'),
    d.soigne && tag('soin', 'Soigne', 'vert'), d.protege && tag('protege', 'Protège'), d.galvanise && tag('galvanise', 'Galvanise'), d.revit && tag('revit', 'Se relève'), d.grignote && tag('grignote', 'Grignote tes cultures'), d.rage && tag('rage', 'Enragé sous 30 %', 'rouge')].filter(Boolean).join('');
  const stat = (p, t2, v, em) => '<div class="bx-stat"><small>' + picto(p) + t2 + '</small><b>' + v + '</b>' + (em ? ' <em>' + em + '</em>' : '') + '</div>';
  const stats = stat('vita', 'Vie', fmt(pv), 'à la vague ' + n) + stat('degats', 'Coup', fmt(deg), 'toutes les ' + String(d.cadence).replace('.', ',') + ' s') + stat('bouclier', 'Armure', Math.round((d.armure || 0) * 100) + ' %', 'de tes dégâts') +
    stat('vitesse', 'Vitesse', String(vM).replace('.', ','), vit) + stat('portee', 'Portée', d.distance ? casesDe(d.portee) + ' cases' : 'Au contact', d.distance ? 'il tire' : 'corps à corps') + stat('cases', 'Vise', vis);
  const capa = (p, titre, txt, chiffres, cl) => '<div class="bx-capa"><span class="bx-ic ' + (cl || '') + '">' + picto(p) + '</span><div><b>' + titre + '</b><p>' + txt + '</p>' + (chiffres ? '<div class="puces">' + chiffres + '</div>' : '') + '</div></div>';
  const L = [], K = new Map(), met = (cle, ...a) => { if (d.boss) K.set(cle, a); else L.push(capa(...a)); }, recup = (k) => num('toutes les ' + String(d[k]).replace('.', ',') + ' s'); /* (met : un boss range ses lignes a la fin, 03/11/2026) */
  if (!d.boss && peutSauter({ d, aggro: true })) met('sauteP', 'saut', 'Saute sur toi', 'À moins de 3 cases, il se ramasse, puis bondit là où tu es. Reste dans le rond rouge et il t\'agrippe.', num('3 cases') + num(fmt(deg) + ' dégâts', 'rouge') + num('ralentit ' + String(AGRIPPE).replace('.', ',') + ' s', 'bleu') + num(secondes(ESQUIVE.saut) + ' pour esquiver') + num('toutes les ' + SAUT_RECHARGE + ' s'), 'violet');
  if (!d.boss && (d.charge || d.pique)) met('chargeP', d.pique ? 'pique' : 'charge', d.pique ? 'Vol en piqué' : 'Charge', d.pique ? 'À moins de 3 cases, il prend de la hauteur, puis plonge sur toi en ligne droite. Une bande rouge te prévient.' : 'Il baisse la tête et fonce sur toi en ligne droite. Une bande rouge te prévient.',
    num((d.chargeMax ? '3' : '5') + ' cases') + num(fmt(dSort) + ' dégâts', 'rouge') + num(secondes(d.chargeMax ? ESQUIVE.charge : ESQUIVE.grandeCharge) + ' pour esquiver') + num('toutes les ' + (d.charge || d.pique) + ' s') + num('un bâtiment sur sa route prend le coup', 'vert'), 'violet');
  if (d.casse) met('casse', 'casse', 'Démolit les bâtiments', 'Souvent, il fonce sur un bâtiment plutôt que sur toi. Frappe-le et il te prend pour cible.' + (d.bucheron ? ' Il tape deux fois plus fort sur les tours.' : ''), num(Math.round((d.casse || 0) * 100) + ' % de chances') + num(fmt(Math.round(dpsBatiments(n))) + ' dégâts par seconde sur un bâtiment', 'rouge'));
  if (d.distance) met('distance', 'carreaux', 'Tire de loin', 'Il reste à distance et te tire dessus' + (d.casse ? ', ou sur tes bâtiments' : '') + '. Va le chercher : collé à lui (moins d\'1,5 case), il ne peut plus te toucher.', num(casesDe(d.portee) + ' cases') + num(fmt(deg) + ' dégâts', 'rouge'));
  if (d.ralentit) met('ralentit', 'lenteur', 'Te ralentit', 'Chacun de ses coups te fait marcher plus lentement.', num(String(d.ralentit).replace('.', ',') + ' s', 'bleu'), 'bleu');
  if (d.menotte) met('menotte', 'assomme', 'Te menotte', 'Si sa charge te touche, tu restes sur place un instant. Tu peux encore frapper.', num(secondes(d.menotte), 'rouge'), 'or');
  if (d.assomme) met('assomme', 'assomme', 'T\'assomme', 'Touché, tu ne frappes plus un instant.', num(String(d.assomme).replace('.', ',') + ' s', 'rouge'), 'or');
  if (d.poisonFixe) met('poisonFixe', 'poison', 'Morsure empoisonnée', 'Sa morsure t\'empoisonne ; une nouvelle morsure relance le poison.', num(d.poisonFixe[0] + ' par seconde', 'rouge') + num(d.poisonFixe[1] + ' s'), 'vert');
  if (d.poison) met('poison', 'poison', 'T\'empoisonne', 'Son coup t\'empoisonne quelques secondes.', num(d.poison[0] + ' % de ta vie par seconde', 'rouge') + num(d.poison[1] + ' s'), 'vert');
  if (d.soigne) met('soigne', 'soin', 'Soigne ses alliés', 'Il soigne les monstres autour de lui : abats-le en premier.', '', 'vert');
  if (d.protege) met('protege', 'protege', d.protegeNom || 'Bouclier de cristal', 'Il protège trois monstres autour de lui.', num('-40 % de dégâts') + num('4 s') + recup('protege'));
  if (d.malefice && d.malefice.brule) met('malefice', 'rage', d.malefice.nom || 'Boule de feu', 'Un cercle orange sous toi, puis la boule de feu tombe. Dedans, tu brûles.', num(fmt(Math.round(dSort * d.malefice.x)) + ' dégâts', 'rouge') + num('brûle ' + secondes(d.malefice.brule[1]) + ' (' + String(d.malefice.brule[0] * 100).replace('.', ',') + ' % de ta vie par seconde)', 'rouge') + num(secondes(d.malefice.prepa) + ' pour esquiver') + num('toutes les ' + d.malefice.periode + ' s'), 'orange');
  else if (d.malefice) met('malefice', 'lenteur', 'Maléfice', 'Un cercle violet sous toi, puis le sort éclate. Dedans, tu es ralenti.', num(fmt(Math.round(dSort * d.malefice.x)) + ' dégâts', 'rouge') + num('ralenti ' + secondes(d.malefice.duree), 'bleu') + num(secondes(d.malefice.prepa) + ' pour esquiver') + num('toutes les ' + d.malefice.periode + ' s'), 'violet');
  if (d.galvanise) met('galvanise', 'galvanise', 'Galvanise la horde', 'Les monstres autour de lui frappent et courent plus vite.', num('4 s') + recup('galvanise'), 'or');
  if (d.revit) met('revit', 'revit', 'Se relève', 'Abattu, il se relève une fois' + (d.revitRage ? ', enragé : il court et frappe plus vite, et cogne plus fort.' : '.'));
  if (d.demonte) met('demonte', 'revit', 'Continue à pied', 'Quand sa monture tombe, il continue à pied.');
  if (d.grignote) met('grignote', 'grignote', 'Grignote tes cultures', d.gourmand ? 'Il file vers tes Cawottes, puis tes Fraises : une récolte de moins toutes les 5 s.' : 'Il file picorer tes champs : une récolte de moins toutes les 5 s.', '', 'or');
  if (d.bandit) met('bandit', 'kama', 'Vole tes kamas', 'Il file à ta grange, y vole des kamas, puis repart par où il est venu.', '', 'or');
  if (d.fouisseur) met('fouisseur', 'cases', 'Surgit de terre', 'Il sort de terre au pied de tes bâtiments, derrière tes défenses.');
  /* les sorts des boss */
  if (d.boss && d.charge) met('charge', 'charge', d.poings ? 'Ruée' : 'Charge', 'Une bande ' + teinteSorts(d, true) + ' jusqu\'à toi, puis il fonce. Cache-toi derrière un bâtiment : il s\'y écrase.', num(fmt(Math.round(dSort * ((d.sortsX || {}).charge || 1))) + ' dégâts', 'rouge') + num(secondes(d.chargePrepa || ESQUIVE.grandeCharge) + ' pour esquiver') + recup('charge'), 'violet');
  if (d.lance) met('lance', 'sort', 'Lance d\'os', 'De loin, une bande rouge jusqu\'à toi, puis sa lance file. Un bâtiment sur sa route prend la moitié du coup.', num(fmt(dSort) + ' dégâts', 'rouge') + (d.lanceLoin ? num('+' + Math.round(d.lanceLoin.parCase * 100) + ' % par case au-delà de 2, jusqu\'à ×' + String(d.lanceLoin.max).replace('.', ','), 'rouge') : '') + num('1 s pour esquiver') + recup('lance'), 'violet');
  if (d.carapace) met('carapace', 'bouclier', 'Carapace d\'épines', 'Il se replie sous sa carapace : presque aucun dégât, et il renvoie un cinquième des coups reçus au corps à corps. Frappe ses soldats en attendant.', num('3,5 s') + recup('carapace'));
  if (d.marteau || d.poings) met('marteau', 'sort', d.poings ? 'Coups de poing' : 'Coup de marteau', d.poings ? 'Il se tourne vers toi et abat son poing là où tu es : un cercle ' + teinteSorts(d) + ' sous tes pieds pour un coup au sol, un éventail devant lui pour un coup de poing ou un revers. Sors-en avant l\'impact.' : 'Il se tourne vers toi et abat son marteau là où tu es : un cercle orange sous tes pieds pour un coup au sol, un éventail devant lui pour un coup qui balaie. Sors-en avant l\'impact.', num(fmt(Math.round(dSort * ((d.sortsX || {}).marteau || 0.5))) + ' dégâts au sol', 'rouge') + num(fmt(Math.round(dSort * ((d.sortsX || {}).balaye || 0.25))) + ' en balayant', 'rouge'), 'violet');
  if (d.marteau || d.poings) met('moulinet', 'sort', 'Moulinet', d.poings ? 'Il tend le bras et tourne trois fois sur lui-même : un grand cercle bleu autour de lui, chaque tour frappe dedans.' : 'Il tend son marteau et tourne trois fois sur lui-même : un grand cercle bleu autour de lui, chaque tour frappe dedans.', num(fmt(Math.round(dSort * ((d.sortsX || {}).moulinet || 0.35))) + ' dégâts par tour', 'rouge') + num(TOURS_MOULINET + ' tours'), 'violet');
  if (d.bondit) met('bondit', 'saut', d.bonditNom || 'Bond écrasant', d.bonditTexte ? d.bonditTexte : d.marteau ? 'De loin, il saute et abat son marteau là où tu es : un cercle orange et son ombre qui grandit, sors-en.' : d.poings ? 'De loin, il saute et abat ses deux poings là où tu es : un cercle ' + teinteSorts(d) + ' et son ombre qui grandit, sors-en.' : (d.fem ? 'Elle' : 'Il') + ' saute là où tu es : un cercle rouge, sors-en.', num(fmt(Math.round(dSort * ((d.sortsX || {}).bond || 1))) + ' dégâts', 'rouge') + num(secondes(d.marteau || d.poings ? +(ESQUIVE.bond / ((d.vivacite || 1) * (d.bondVif || 1))).toFixed(2) : d.bondPrepa || ESQUIVE.bond) + ' pour esquiver') + recup('bondit'), 'violet');
  if (d.seisme) met('seisme', 'sort', d.seismeNom || 'Séisme', (d.poings ? 'Il saute et abat ses deux poings sur le sol' : 'Il frappe le sol') + ' : un ' + (d.seismeR && d.seismeR < 6 ? '' : 'grand ') + 'cercle bleu autour de lui' + (d.repousse ? ', qui te repousse' : '') + (d.seismeCentre ? ', et l\'onde frappe plus fort près de lui qu\'au bord' : '') + '. Tes bâtiments proches prennent aussi.', num(fmt(Math.round(dSort * ((d.sortsX || {}).seisme || 1))) + ' dégâts', 'rouge') + (d.seismeCentre ? num('×' + String(d.seismeCentre.centre).replace('.', ',') + ' au centre, ×' + String(d.seismeCentre.bord).replace('.', ',') + ' au bord', 'rouge') : '') + num(secondes(d.seismeDuree || 1.3) + ' pour esquiver') + recup('seisme'), 'violet');
  if (d.marteauMoon) met('marteauMoon', 'sort', 'Marteau de Moon', 'Il jette son marteau là où tu es : le cercle s\'annonce, plus foncé au centre, et l\'onde de choc fait d\'autant plus mal que tu es près de l\'impact. Il saute le ramasser, puis rebondit sur toi et frappe à deux mains, avec la même onde.', num('jusqu\'à ×' + String(d.marteauMoon.x).replace('.', ','), 'rouge') + num('toutes les ' + d.marteauMoon.periode + ' s'), 'rouge');
  if (d.boomerang) met('boomerang', 'sort', 'Boomerang lunaire', 'Il décroche le croissant de lune de sa tête et le lance : une bande s\'annonce vers toi, le croissant file en tournoyant et revient se poser sur sa tête. Il touche à l\'aller et au retour.', num('toutes les ' + d.boomerang.periode + ' s'), 'rouge');
  if (d.lianes) met('lianes', 'lenteur', 'Lianes', 'De loin, une bande ' + (d.lianes.couleurNom || 'verte') + ' s\'annonce : ses lianes jaillissent. Si elles t\'attrapent, elles te tirent contre lui, puis il charge un gros coup tout autour de lui : sors du cercle.', num('coup ×' + String(d.lianes.x).replace('.', ','), 'rouge') + num('toutes les ' + String(+d.lianes.periode.toFixed(1)).replace('.', ',') + ' s'), 'bleu');
  if (d.ultime) met('ultime', 'sort', 'La nuit lunaire', 'Il lève les bras : la nuit tombe, et des météorites s\'abattent sur toute la zone pendant ' + secondes(d.ultime.duree) + ', chacune annoncée par un cercle.', num(d.ultime.n + ' météorites', 'rouge') + num('toutes les ' + d.ultime.periode + ' s'), 'rouge');
  if (d.lanceVent) met('lanceVent', 'sort', 'Lance de vent', 'De loin, un trait rouge part de lui jusqu\'à toi et finit par un petit cercle : sa lance quitte sa main et lévite au-dessus de lui, pointée sur toi, dans un tourbillon de vent. Puis elle part d\'un coup : portée par le vent, elle file très vite le long du trait et se plante dans le cercle. Sur son passage ou dans le cercle, la rafale te repousse. Le vent la lui ramène ensuite en main.', num(secondes(d.lanceVent.prepa) + ' pour esquiver') + num('toutes les ' + d.lanceVent.periode + ' s'), 'rouge');
  if (d.totems) met('totems', 'renfort', 'Totems-masques', 'Il plante ' + d.totems.n + ' totems-masques autour de toi : ils sortent de terre et te crachent des fléchettes. Casse-les ; ils tombent aussi avec lui.', num('toutes les ' + d.totems.periode + ' s'), 'rouge');
  if (d.danse) met('danse', 'sort', 'Danse vaudou', 'Des masques tournent autour de lui pendant ' + secondes(d.danse.duree) + ' : il court et frappe plus vite.', num('×' + String(d.danse.vit).replace('.', ',')) + num('toutes les ' + d.danse.periode + ' s'), 'rouge');
  if (d.malediction) met('malediction', 'sort', 'Malédiction', 'Un masque fantôme vole au-dessus de toi et te suit pendant ' + secondes(d.malediction.duree) + ', puis s\'arrête : un cercle s\'annonce là où il tombe, sors-en. S\'il te touche, tu es maudit : tu ne peux plus bouger pendant ' + secondes(d.malediction.maudit) + ' (tu frappes encore).', num('coup ×' + String(d.malediction.x).replace('.', ','), 'rouge') + num('toutes les ' + d.malediction.periode + ' s'), 'rouge');
  if (d.tornades) met('tornades', 'saut', 'Tornades', 'Il lève sa lance : ' + d.tornades.n + ' cercles s\'annoncent, un sous toi et les autres autour. Une petite tornade jaillit de chacun et tourne ' + secondes(d.tornades.duree) + '. Dedans, tu es projeté en l\'air 1,5 s : tu ne bouges ni ne frappes.', num('en l\'air 1,5 s', 'rouge') + num('toutes les ' + d.tornades.periode + ' s'), 'bleu');
  if (d.bourrasque) met('bourrasque', 'lenteur', 'Bourrasque', 'Il ' + (d.bourrasqueGeste || 'bande son arc') + ' : un cône rouge devant lui, puis sa flèche de vent soulève une rafale. Dedans, elle te repousse de 2 cases et te ralentit.', num(fmt(Math.round(dSort * ((d.sortsX || {}).bourrasque || 1))) + ' dégâts', 'rouge') + num('repoussé de 2 cases') + num('ralenti ' + secondes(LENTEUR_BOURRASQUE), 'bleu') + num(secondes(ESQUIVE.bourrasque) + ' pour esquiver') + recup('bourrasque'), 'bleu');
  if (d.bain) met('bain', 'lenteur', 'Bain de boue', 'Il frappe le sol : la boue jaillit et recouvre la plus grande partie du terrain pendant ' + secondes(d.bain.duree) + '. Dedans, tu marches presque deux fois moins vite et lui court bien plus vite. Cherche les coins restés secs.', num('lui x' + String(d.bain.v).replace('.', ','), 'rouge') + num('toi x0,55', 'bleu') + num('toutes les ' + d.bain.periode + ' s'), 'bleu');
  if (d.boue) met('boue', 'lenteur', 'Crachat de boue', 'Il te crache une boule de boue : un cercle rouge sous toi. Reste dedans et elle te frappe, puis la boue te colle sur place. Tant que tu es collé, il ne charge pas.', ((d.sortsX || {}).boue ? num(fmt(Math.round(dSort * d.sortsX.boue)) + ' dégâts', 'rouge') : '') + num('collé ' + secondes(DUREE_COLLE), 'rouge') + num(secondes(ESQUIVE.boue) + ' pour esquiver') + recup('boue'), 'bleu');
  if (d.racines) met('racines', 'lenteur', d.racines.graine ? 'Graine collante' : 'Racines', d.racinesFiche || 'Quand tu es à mi-distance, il plante ses branches dans le sol : un cercle rouge sous toi, puis ses racines jaillissent. Dedans, elles t\'enracinent : tu ne marches plus, tu frappes encore.', num(fmt(Math.round(dSort * d.racines.x)) + ' dégâts', 'rouge') + num('enraciné ' + secondes(d.racines.duree)) + num(secondes(d.racines.prepa) + ' pour esquiver') + num('toutes les ' + d.racines.periode + ' s'), 'violet');
  if (d.pluieGlands) { const G = d.pluieGlands; met('pluieGlands', 'renfort', 'Pluie de glands (ulti)', 'Il jette ' + G.n + ' glands en l\'air : ils retombent autour de toi, chacun dans un cercle vert qui se remplit. Marche sur un gland et il explose (ça fait mal) ; laisse-le et, le cercle plein, un Tronknyde sort de terre.', num(fmt(Math.round(dSort * G.x)) + ' dégâts par gland', 'rouge') + num(secondes(G.pousse) + ' avant qu\'ils germent') + num('toutes les ' + G.periode + ' s'), 'violet'); }
  if (d.galvanise && d.gestes && d.gestes.galvanise === 'seve') met('seve', 'sort', 'Sève', 'Son cœur de sève luit : ses alliés autour de lui frappent et courent plus vite pendant 4 s. Éloigne-les de lui.', num('toutes les ' + d.galvanise + ' s'), 'violet');
  if (d.tourbillon) met('tourbillon', 'sort', 'Tourbillon de hache', 'Il lève sa hache : un cercle bleu autour de lui, puis il tourne deux fois sur lui-même, la hache tendue. Sors du cercle.', num(fmt(Math.round(dSort * d.tourbillon.x)) + ' dégâts', 'rouge') + num(secondes(d.tourbillon.prepa) + ' pour esquiver') + num('toutes les ' + d.tourbillon.periode + ' s'), 'violet');
  if (d.brassard) met('brassard', 'sort', d.brassardTitre || 'Coup de brassard', 'Un arc bleu devant ' + (d.fem ? 'elle' : 'lui') + ', puis ' + (d.brassardCoup || 'un grand coup de brassard') + ' qui te repousse.', num(fmt(Math.round(dSort * ((d.sortsX || {}).brassard || 1))) + ' dégâts', 'rouge') + num('te repousse') + num(secondes(ESQUIVE.brassard) + ' pour esquiver') + recup('brassard'), 'violet'); /* (sortsX : le Coup d'aile de Crocabulia, a moitie, 03/11/2026) */
  if (d.pierre) met('pierre', 'bouclier', 'Peau de pierre', 'Elle se change en pierre : moitié moins de dégâts pendant 4 s. Frappe sa troupe en attendant.', num('4 s') + recup('pierre'));
  if (d.souffle) met('souffle', 'sort', 'Souffle de feu', d.souffleSol ? (d.fem ? 'Elle' : 'Il') + ' crache un long jet de feu vers toi, sur ' + casesDe(d.souffleR) + ' cases dans un cône étroit : il brûle tout sur son passage, tes bâtiments aussi, et le sol reste en feu ' + d.souffleSol + ' s.' : 'Il crache un cône de feu vers toi, sur tes bâtiments aussi.', num(fmt(dSort) + ' dégâts', 'rouge') + (d.souffleSol ? num(fmt(Math.max(1, Math.round(dSort * 0.1))) + ' toutes les 0,5 s dans les flammes', 'rouge') : '') + num('1 s pour esquiver') + recup('souffle'), 'violet');
  if (d.pluie) met('pluie', 'sort', d.pluieFleches ? 'Pluie de flèches' : 'Pluie de cawottes', d.pluieFleches ? 'Cinq cercles rouges : un sur toi, quatre autour.' : 'Cinq cercles orange : un sur toi, quatre autour.', num(fmt(dSort) + ' dégâts', 'rouge') + num(secondes(ESQUIVE.pluie) + ' pour esquiver') + recup('pluie'), 'violet');
  if (d.cawotteRoyale) met('cawotteRoyale', 'assomme', 'Cawotte royale', 'Une petite cible rouge te suit, puis se fige. File : la cawotte géante t\'assomme.', num(fmt(dSort) + ' dégâts', 'rouge') + num('assommé 1 s', 'rouge') + num(secondes(ESQUIVE.cawotteRoyale) + ' pour esquiver') + recup('cawotteRoyale'), 'or');
  if (d.fumee) met('fumee', 'poison', 'Nuages de fumée', 'Il crache ' + (d.fumeeN || 3) + ' nuages de fumée (un sur toi), ils restent ' + DUREE_FUMEE + ' s au sol et se dissipent à sa mort : les toucher t\'empoisonne, 2 s de poison dès le contact puis 2 s de plus par seconde passée dedans, ' + CUMULS_FUMEE * PAS_FUMEE + ' s au plus (' + CUMULS_FUMEE + ' cumuls).', num(Math.round(POISON_FUMEE * 100) + ' % de ta vie par seconde', 'rouge') + recup('fumee'), 'vert');
  if (d.appel) met('appel', 'sort', 'Il t\'attire à lui', 'Une bande verte jusqu\'à toi, même de très loin : reste dedans et il te tire jusqu\'à lui' + (d.appelStun ? ', te frappe et t\'étourdit.' : '.'), (d.appelX ? num(fmt(Math.round(dSort * d.appelX)) + ' dégâts', 'rouge') + num('étourdi ' + secondes(d.appelStun)) : '') + recup('appel'), 'violet');
  if (d.geyser) met('geyser', 'sort', 'Geyser', 'Un cercle bleu sous tes pieds : l\'eau jaillit 1,4 s plus tard, sors-en.', num(fmt(Math.round(dSort * ((d.sortsX || {}).geyser || 1))) + ' dégâts', 'rouge') + recup('geyser'), 'rouge');
  if (d.geyserRage) met('geyserRage', 'sort', 'Geysers de rage', 'Sous 30 % de vie : ' + d.geyserRage.n + ' cercles bleus au hasard sur le terrain toutes les ' + d.geyserRage.periode + ' s, l\'eau jaillit 1,4 s plus tard ; ils ne te visent pas, mais sors-en.', num(fmt(Math.round(dSort * ((d.sortsX || {}).geyser || 1))) + ' dégâts chacun', 'rouge'), 'rouge');
  if (d.enfouit) { const E0 = d.enfouit; met('enfouit', 'sort', 'S\'enfouit', 'Quand tu l\'approches, il s\'enfonce sous terre (on ne peut plus le viser), file sous le sol et ressort plus loin ; là où il était, un cercle, puis ses racines jaillissent et t\'enracinent 1 s. Pendant qu\'il est sous terre, ses têtes surgissent près de toi, une de plus à chaque quart de vie perdu : la tête de sève crache un jet en ligne qui reste au sol et ralentit, la tête des feuilles lance deux éventails tranchants, la tête des racines les fait jaillir en croix sous tes pieds, la tête qui hurle repousse et étourdit dans un grand cercle violet.', num('toutes les ' + String(E0.periode).replace('.', ',') + ' s'), 'vert'); }
  if (d.garde) met('garde', 'carreaux', 'Garde ses distances', 'Approche-toi à moins de ' + casesDe(d.garde) + ' cases : ' + (d.fem ? 'elle' : 'il') + ' recule pour lancer ses sorts de loin.', '', 'bleu');
  if (d.invoque) met('invoque', 'renfort', 'Invocation', (d.fem ? 'Elle' : 'Il') + ' ' + (d.invoque.geste || 'lève son bâton de corail et invoque') + ' ' + d.invoque.n + ' ' + (d.invoque.noms || 'tortues') + ' toutes les ' + d.invoque.periode + ' s (' + d.invoque.max + ' au plus)' + (d.invoque.noms ? '.' : ' : des monstres de niveau 80 à 90 qui ' + (d.fem ? 'la' : 'le') + ' protègent comme une troupe.'), '', 'vert'); /* (noms, geste : les Tronknydes de l'Ancestral et du Chene Mou, 08/11/2026) */
  if (d.renforts) met('renforts', 'renfort', 'Renforts', (d.fem ? 'Elle' : 'Il') + ' appelle deux ' + d.renforts[1] + ' toutes les ' + RAPPEL_TROUPE + ' s (' + TROUPE_MAX + ' au plus)' + (d.renfortsRage ? ', puis des ' + d.renfortsRage[1] + ' une fois enragé' + (d.fem ? 'e' : '') : '') + '. Sa troupe ' + (d.fem ? 'la' : 'le') + ' protège : chaque monstre près d\'' + (d.fem ? 'elle' : 'lui') + ' lui retire 12 % de tes dégâts.', '', 'vert'); /* (au feminin pour Crocabulia, 03/11/2026) */
  if (d.jet) met('jet', 'sort', d.jet.nom, 'Quand tu restes loin ' + (d.fem ? 'd\'elle' : 'de lui') + ', ' + (d.jet.arme === 'hache' ? 'il lève sa grande hache et te la lance' : 'il arrache un rocher du sol et te le lance') + ' : un grand cercle rouge sous toi, sors-en.', num(fmt(Math.round(dSort * d.jet.x)) + ' dégâts', 'rouge') + num(secondes(d.jet.prepa) + ' pour esquiver') + num('toutes les ' + d.jet.periode + ' s'), 'violet');
  if (d.faille && d.faille.poursuite) { const P = d.faille.poursuite; met('faille', 'sort', 'Racines à ta poursuite', (P.n > 1 ? 'Deux buttes de terre partent de lui, une de chaque côté, et filent' : 'Une butte de terre part de lui et file') + ' vers toi, plus vite que toi, pendant ' + P.duree + ' s : elles tournent mal, esquive d\'un pas de côté au dernier moment. Rattrapé, tu es enraciné ' + String(P.colle).replace('.', ',') + ' s.' + (P.ancre ? ' Il les lance même enraciné.' : ''), num(fmt(Math.round(dSort * d.faille.x)) + ' dégâts chacune', 'rouge') + num('toutes les ' + String(+d.faille.periode.toFixed(1)).replace('.', ',') + ' s'), 'violet'); }
  else if (d.faille) met('faille', 'sort', d.faille.racines ? 'Racines en ligne' : 'Faille', d.faille.racines ? 'Il fait courir ses racines jusqu\'à toi : une bande, puis elles jaillissent du sol de lui vers toi. Sors-en par le côté.' : 'Il fend le sol jusqu\'à toi : une bande, puis le sol éclate de lui vers toi. Sors-en par le côté.', num(fmt(Math.round(dSort * d.faille.x)) + ' dégâts', 'rouge') + num('1 s pour esquiver') + num('toutes les ' + d.faille.periode + ' s'), 'violet');
  if (d.affaibli) { const A = d.affaibli, pc = Math.round(A.seuil * 100); met('affaibli', 'bouclier', 'Affaibli', 'Sous ' + pc + ' % de vie, il tombe à genoux : invulnérable, sa vie bloquée à ' + pc + ' %, il appelle ' + A.n + ' ' + A.noms + '. Tant qu\'un seul est debout, il regagne ' + Math.round(A.regen * 100) + ' % de sa vie toutes les ' + A.pas + ' s. Abats-les tous : il se relève enragé.', num(fmt(A.pv) + ' PV par Gorille') + num('+' + Math.round(A.regen * 100) + ' % toutes les ' + A.pas + ' s', 'vert'), 'violet'); }
  if (d.enracine) { const E = d.enracine; met('enracine', 'bouclier', 'Enraciné', 'Il arrive enfoncé dans le sol, invulnérable, et ' + E.noeuds + ' nœuds de racine sortent de terre autour de toi. Tant qu\'ils vivent, ' + (E.types ? 'toute la forêt en sort, un monstre au hasard à chaque fois (' + E.max + ' en vie au plus' + (E.casse ? ', un sur deux file casser tes bâtiments' : '') + '),' : 'la forêt pousse autour d\'eux (des Tronknydes, des Arbres Collants)') + ' et lui fait jaillir ses racines sous toi.' + ' Chaque nœud coupé lui arrache un morceau d\'écorce ; le dernier tombe, il s\'arrache du sol et marche sur toi.' + (E.reSeuil ? ' À ' + Math.round(E.reSeuil * 100) + ' % de vie, il replonge une fois, avec ' + E.renoeuds + ' nouveaux nœuds.' : ''), num('-' + Math.round(E.ecorce * 100) + ' % de sa vie par nœud', 'rouge') + num((E.types ? 'un monstre par nœud toutes les ' : 'la forêt pousse toutes les ') + E.pousse + ' s', 'vert'), 'violet'); }
  if (d.regard) met('regard', 'sort', 'Regard du Chêne', 'Toutes les ' + d.regard.periode + ' s, il plante ses racines et s\'enfonce, son œil rouge se charge, puis il fait deux tours sur lui-même et le rayon de son œil balaie toute la carte. Cache-toi derrière un bâtiment ou derrière une des souches qui sortent de terre près de toi : le rayon s\'y arrête.' + (d.regard.bat ? ' Il arrache ' + Math.round(d.regard.bat * 100) + ' % de sa vie au bâtiment à chaque passage ; rasé, il ne t\'abrite plus.' : '') + ' Puis il arrache ses racines, bondit et retombe : un séisme dans le grand cercle rouge, plus fort près de lui.', num(fmt(Math.round(dSort * d.regard.x)) + ' dégâts à chaque tour qui te touche, séisme jusqu\'à ' + fmt(Math.round(dSort * d.regard.saut.x)), 'rouge'), 'rouge');
  if (d.lancer) met('lancer', 'sort', 'Lancer de Tronknyde', 'Il attrape un de ses Tronknydes, le hisse au-dessus de sa tête et te le jette dessus : sors du cercle rouge. Le Tronknyde se relève et t\'attaque. S\'il n\'en a pas, il en fait sortir un de terre.', num(fmt(Math.round(dSort * d.lancer.x)) + ' dégâts, sonné 0,5 s', 'rouge'), 'rouge');
  if (d.avale) met('avale', 'renfort', 'Il avale sa troupe', 'Toutes les ' + d.avale.periode + ' s, s\'il a un monstre de sa troupe à portée de bras, il l\'attrape et l\'avale pour se soigner. Abats sa troupe avant qu\'il ne la mange.', num('+' + Math.round(d.avale.soin * 100) + ' % de sa vie', 'vert'), 'vert');
  if (d.rage) met('rage', 'rage', 'Rage', (d.affaibli ? 'Une fois ses ' + d.affaibli.noms + ' abattus' : 'Sous 30 % de vie') + ', ' + (d.fem ? 'elle' : 'il') + ' frappe 1,7 fois plus vite et lance ses sorts plus souvent' + (d.tempete ? ', et déchaîne une tempête de feuilles : des tourbillons s\'abattent sans arrêt, un sur deux sous toi, chacun annoncé par un cercle rouge.' : '.'), d.tempete ? num(fmt(Math.round(dSort * d.tempete.x)) + ' dégâts par tourbillon', 'rouge') + num('toutes les ' + secondes(d.tempete.periode)) : '', 'rouge');
  if (d.boss) { /* LES SORTS D'UN BOSS RANGES (03/11/2026, « que chaque truc soit sur la meme ligne : la rage, le renfort avec des allies, un sort ultime, a distance ou un
       saut au corps a corps, et apres un petit sort en plus ; pour tous les boss ; je sais qu'il y a des boss qui ont des sorts en plus », Mathieu) : toujours les
       quatre memes lignes dans le meme ordre (une ligne grisee si le boss n'en a pas), puis ses sorts en plus, puis ce qu'il fait d'autre. Son ultime et son petit
       sort : KITS_BOSS (20-monstres.js). « de loin seulement » : colle a lui, il ne le lance pas (SORTS_LOIN) */
    const kit = KITS_BOSS[t] || {}, ligne = (k, et) => { const a = K.get(k); K.delete(k); const plus = (SORTS_LOIN[k] ? num('de loin seulement', 'bleu') : '') + (SORTS_CAC[k] ? num('plus souvent au corps à corps', 'rouge') : '');
      return capa(a[0], (et ? '<span class="bx-etiq ' + et[1] + '">' + et[0] + '</span>' : '') + a[1], a[2], (a[3] || '') + plus, a[4]); };
    const place = (cles, et, rien) => { const k = cles.find((x) => x && K.has(x)); L.push(k ? ligne(k, et) : '<div class="bx-capa vide"><span class="bx-ic"></span><div><b><span class="bx-etiq ' + et[1] + '">' + et[0] + '</span>' + rien + '</b></div></div>'); };
    place(['rage'], ['Rage', 'rage'], 'Pas de rage'); place(['renforts', 'invoque', 'totems', 'affaibli'], ['Renforts', 'renfort'], 'Pas de renforts');
    place([kit.ultime], ['Ultime', 'ultime'], 'Pas d\'ultime'); place([kit.sort], ['Sort', 'sort'], 'Pas de petit sort');
    [...K.keys()].filter((k) => !TRAITS_BOSS.has(k)).forEach((k) => L.push(ligne(k, ['En plus', 'plus']))); [...K.keys()].forEach((k) => L.push(ligne(k)));
  }
  if (!L.length) L.push(capa('degats', 'Au contact', 'Il vient te frapper, sans rien de plus.'));
  /* le butin */
  const r = d.res || RES_MONSTRE[t], Pn = P != null ? panoMonstre(t, P) : null, leg = d.boss && LEGENDAIRES.find((x) => x.boss === t);
  const drop = (ic, t2) => '<div class="bx-drop">' + ic + '<span>' + t2 + '</span></div>';
  const drops = [r && PAR_ID[r] ? drop('<img src="assets/icones/' + r + '.png?v=' + VERSION_MODELES + '" alt="">', PAR_ID[r].nom + ' · ' + (d.boss ? '5, à coup sûr' : pc(0.35 * pros))) : '',
    Pn && !d.vole ? drop('<img src="assets/icones/' + iconeObjet(Pn.id + '-cape') + '.png?v=' + VERSION_MODELES + '" alt="">', 'Une pièce ' + Pn.de + ' · ' + (d.boss ? 'à coup sûr la 1re fois, puis 40 %' : pc((t === 'tofu' ? 0.02 : 0.07) * pros))) : '',
    (() => { const ar = d.boss && Pn && ARMES[classeDe()], id = ar && 'arme-' + ar[0] + '-' + Pn.id; /* (l'arme de ta classe : la Tortue Corail donne celle de la Tortue, 07/11/2026) */
      return id && OBJETS[id] ? drop('<img src="assets/icones/' + iconeObjet(id) + '.png?v=' + VERSION_MODELES + '" alt="">', OBJETS[id].nom + ' · à coup sûr la 1re fois, puis ' + pc(0.25 * pros)) : ''; })(),
    leg ? drop('<img src="assets/icones/' + iconeObjet(idLeg(leg)) + '.png?v=' + VERSION_MODELES + '" alt="">', '✦ ' + OBJETS[idLeg(leg)].nom + ' · ' + pc(CHANCE_LEG * pros)) : ''].filter(Boolean).join('');
  const ou = P != null ? PALIERS_TOUS[P].nom.replace(/^./, (c) => c.toUpperCase()) + ' · vague' + (V.length > 1 ? 's ' + V[0] + ' à ' + V[V.length - 1] : ' ' + V[0]) : 'Hors des paliers';
  return '<div class="bx-fiche"><div class="bx-tete"><div class="bx-portrait' + (d.boss ? ' boss' : '') + '"><img src="assets/icones/' + d.icone + '.png?v=' + VERSION_MODELES + '" alt=""></div><div><h3>' + d.nom + '</h3><p>' + ou + (B.tues ? ' · abattu ' + fmt(B.tues) + ' fois' : '') + '</p><div class="puces">' + tags + '</div></div></div>' +
    '<div class="bx-stats">' + stats + '</div><h4>' + (d.boss ? 'Ses sorts et ce qu\'il fait' : 'Ce qu\'il fait') + '</h4>' + (d.boss ? '<p class="bx-note">Colle-toi à ' + (d.fem ? 'elle' : 'lui') + ' : ses sorts « de loin » ne partent plus, mais ses sorts au corps à corps reviennent plus vite.</p>' : '') + L.join('') + (drops ? '<h4>Butin</h4><div class="bx-drops">' + drops + '</div>' : '') + '</div>';
}
function ouvrirBestiaire(onglet, sel) { /* le bestiaire (15/10/2026) : les monstres affrontes en cases, la fiche de celui qu'on touche ; l'onglet Panoplies reste l'ancien */
  onglet = onglet || ouvrirBestiaire.dernier || 'monstres'; if (onglet === 'panoplies') return ouvrirPanoplies('panoplies'); ouvrirBestiaire.dernier = onglet;
  completerBestiaire(); const B = bestiaire(), v = '?v=' + VERSION_MODELES;
  if (sel) ouvrirBestiaire.sel = sel; let choix = ouvrirBestiaire.sel && B[ouvrirBestiaire.sel] ? ouvrirBestiaire.sel : null;
  const tete = '<div class="hdv-tete">' + [['monstres', 'Monstres'], ['panoplies', 'Panoplies']].map(([k, t]) => '<button class="btn" data-bestiaire="' + k + '" aria-pressed="' + (onglet === k) + '">' + t + '</button>').join('') + (ouvrirBestiaire.retour === 'vagues' ? '<button class="btn discret" data-retour-vagues>Retour aux vagues</button>' : '') + '</div>';
  const vusTous = new Set(); let total = 0, vus = 0;
  const sections = PALIERS.map((Pa, P) => {
    const base = P * VAGUES_PALIER, types = []; for (let n = base + 1; n <= base + VAGUES_PALIER; n++) compoTotale(n).forEach(([t]) => { if (!types.includes(t)) types.push(t); });
    types.sort((a, b) => (MONSTRES[a].boss ? 1 : 0) - (MONSTRES[b].boss ? 1 : 0)); types.forEach((t) => vusTous.add(t)); total += types.length; const nv = types.filter((t) => B[t]).length; vus += nv;
    const titre = '<h3 class="bx-titre">' + Pa.nom.replace(/^./, (c) => c.toUpperCase()) + '<small>vagues ' + (base + 1) + ' à ' + (base + VAGUES_PALIER) + ' · ' + nv + '/' + types.length + '</small></h3>';
    if (!nv && S_.vague.num <= base) return titre + '<p class="bx-verrou">' + picto('cadenas') + 'Atteins la vague ' + (base + 1) + ' pour croiser ses premiers monstres.</p>';
    if (!choix) choix = types.find((t) => B[t]);
    return titre + '<div class="bx-grille">' + types.map((t) => { const M = MONSTRES[t], vu = !!B[t];
      return '<button class="bx-case' + (M.boss ? ' boss' : '') + (vu ? '' : ' inconnu') + (t === choix ? ' choisie' : '') + '"' + (vu ? ' data-fiche-monstre="' + t + '" data-info="' + M.nom + '"' : ' disabled data-info="Pas encore rencontré"') + '><img src="assets/icones/' + M.icone + '.png' + v + '" alt="">' + (vu && B[t].tues ? '<i>×' + fmt(B[t].tues) + '</i>' : '') + '</button>'; }).join('') + '</div>';
  }).join('');
  const autres = Object.keys(B).filter((t) => MONSTRES[t] && !vusTous.has(t)); /* (les voleurs des simus, les monstres hors paliers) */
  const ailleurs = autres.length ? '<h3 class="bx-titre">Ailleurs<small>' + autres.length + '</small></h3><div class="bx-grille">' + autres.map((t) => '<button class="bx-case' + (t === choix ? ' choisie' : '') + '" data-fiche-monstre="' + t + '" data-info="' + MONSTRES[t].nom + '"><img src="assets/icones/' + MONSTRES[t].icone + '.png' + v + '" alt="">' + (B[t].tues ? '<i>×' + fmt(B[t].tues) + '</i>' : '') + '</button>').join('') + '</div>' : '';
  ouvrirModale('bestiaire', '<h2>Bestiaire<span class="bx-compte"><b>' + vus + '</b> monstres rencontrés sur ' + total + '</span><button data-fermer aria-label="Fermer">✕</button></h2>' + tete +
    '<div class="bx-corps"><div class="bx-gauche">' + sections + ailleurs + '</div><div class="bx-droite">' + (choix ? ficheMonstre(choix) : '<p class="bx-verrou">Aucun monstre rencontré pour l\'instant.</p>') + '</div></div>');
}
function ouvrirPanoplies(onglet) {
  onglet = onglet || ouvrirBestiaire.dernier || 'monstres'; ouvrirBestiaire.dernier = onglet;
  const c = caracs(), pros = 1 + c.prospection / 100, ar = ARMES[classeDe()];
  const pc = (x) => { const v = Math.min(1, x) * 100; return (v < 10 ? (Math.round(v * 10) / 10) : Math.round(v)).toString().replace('.', ',') + ' %'; };
  const atteint = (P) => S_.vague.num > P * VAGUES_PALIER;
  const leN = (M) => leNom(M, true); /* « sur le Bouftou Royal », « sur Moon » (le nom propre garde sa majuscule, 05/11/2026 : « sur moon ») */
  const tete = '<div class="hdv-tete">' + [['monstres', 'Monstres'], ['panoplies', 'Panoplies']].map(([k, t]) => '<button class="btn" data-bestiaire="' + k + '" aria-pressed="' + (onglet === k) + '">' + t + '</button>').join('') + '</div>' +
    '<p class="best-note">Les chances tiennent compte de ta Prospection (+' + c.prospection + ' %). Chaque pièce tombe avec ses propres stats, tirées dans la fourchette indiquée. Une sur 100 sort <b>rare ★</b> : stats +50 %.</p>';
  const corps = PALIERS.map((Pa, P) => {
    const base = P * VAGUES_PALIER, titre = '<div class="hdv-section">' + nomPalier(P) + ' : ' + Pa.nom + ' (vagues ' + (base + 1) + ' à ' + (base + VAGUES_PALIER) + ')</div>';
    if (!atteint(P)) return titre + '<p class="best-verrou">' + picto('cadenas') + 'À découvrir en atteignant la vague ' + (base + 1) + '.</p>';
    const Pn = panoDe(P), B = MONSTRES[Pa.boss], leg = LEGENDAIRES.find((x) => x.boss === Pa.boss), bis = panosDuPalier(P).slice(1); /* (bis : la Tortue sur l'ile de Moon) */
    const dequi = (x) => Object.values(MONSTRES).filter((M) => M.pano === x.id).map((M) => leN(M)).join(', ');
    const pieces = EMPLACEMENTS.map(([e]) => Pn.id + '-' + e).concat(ar ? ['arme-' + ar[0] + '-' + Pn.id] : [], ...bis.map((x) => EMPLACEMENTS.map(([e]) => x.id + '-' + e).concat(ar && OBJETS['arme-' + ar[0] + '-' + x.id] ? ['arme-' + ar[0] + '-' + x.id] : [])));
    return titre + pieces.map((id) => { const o = OBJETS[id], eu = possede(id) || possede(id + '-rare'); /* (les stats : la fourchette des jets) */
      return '<div class="art' + (eu ? '' : ' pas-eu') + '">' + icoObjet(id) + '<div><b>' + o.nom + (eu ? ' <span class="puce bonne">✓ obtenue</span>' : '') + '</b><div class="puces">' + statsFourchette(o) + '<span class="puce">niveau ' + o.niv + '</span></div>' +
        '<div class="desc">' + (o.arme ? 'Sur ' + (PANOS[o.pano].bis != null ? Object.values(MONSTRES).filter((M) => M.pano === PANOS[o.pano].id && M.boss).map((M) => leN(M)).join(', ') : leN(B)) + ' seulement, pour ta classe.' : PANOS[o.pano].bis != null ? 'Sur ' + dequi(PANOS[o.pano]) + ', des vagues ' + (base + 1) + ' à ' + (base + VAGUES_PALIER) + '.' : 'Sur les monstres des vagues ' + (base + 1) + ' à ' + (base + VAGUES_PALIER) + ', et sur ' + leN(B) + '.') + '</div></div><div></div></div>'; }).join('') +
      blocPano(P, comptePanos()[P] || 0) + bis.map((x) => { const k = PANOS.indexOf(x); return blocPano(k, comptePanos()[k] || 0); }).join('') + (leg ? '<div class="art">' + icoObjet(idLeg(leg)) + '<div><b>✦ ' + OBJETS[idLeg(leg)].nom + '</b><div class="puces">' + statsFourchette(OBJETS[idLeg(leg)]) + '</div><div class="desc">' + pc(CHANCE_LEG * pros) + ' sur ' + leN(B) + (leg.arme ? ', l\'arme de ta classe' : '') + '. Elle ne compte dans aucune panoplie.</div></div><div></div></div>' : '');
  }).join('');
  ouvrirModale('bestiaire', entete('Bestiaire et butin') + tete + corps); /* (l'onglet Panoplies) */
}
/* rejouer un boss deja battu : une fois par jour et par boss, remis a ton niveau, la moitie des kamas et de l'XP, son butin et sa coiffe legendaire (2 %) */
const jourJeu = () => new Date(tempsReel()).toDateString();
const bossRejouable = (P) => MODE_TEST || (S_.vague.num > (P + 1) * VAGUES_PALIER && ((S_.bossRejoue || {})[P] !== jourJeu())); /* (le mode test : chaque boss, a volonte) */
/* « a chaque fois que tu le rejoues ca divise les recompenses, en dehors du drop d'item » (Mathieu, 11/10/2026) : kamas et XP divises par deux a chaque victoire de plus (5 % au minimum) */
const partRejoue = (P) => Math.max(0.05, Math.pow(0.5, ((S_.bossFois || {})[P] || 0) + 1));
const gainsBoss = (P) => { const g = gainsVague((P + 1) * VAGUES_PALIER, false), k = partRejoue(P); return { kamas: Math.round(g.kamas * k), xp: Math.round(g.xp * k) }; };
const DUR = { pv: 1.5, deg: 1, garde: 0.6, sorts: 1.1, rappel: 15, troupe: 6, rage: 0.35, leg: 2 }; /* (pv et deg : le boss ; garde : sa troupe, en plus du rapport de niveau. LA REVANCHE DIFFICILE, 15/10/2026, « ca s'adapte a ton niveau, tu doubles tes chances d'item legendaire, mais c'est beaucoup, beaucoup, beaucoup plus dur », Mathieu. Simule avec le bot attentif (esquive 7 fois sur 10) sur ses fermes niveau 52, Iop, Cra, Osamodas : remis au niveau seul, il gagnait 3 a 4 fois sur 4 les boss 1 et 3 ; avec PV x2 et coups x1,5, plus jamais ; avec sorts x1,15, renforts 14 s, rage 40 %, 0 a 15 % de victoires. Reglage retenu entre les deux) */
function forceRef(l) { /* un joueur type de ce niveau : sa classe, la panoplie complete de son palier au jet moyen */
  const st = STATS_CLASSE[classeDe()], k = palierDe(Math.min(VAGUES_TOTAL, l + 2)), V = (c) => VALEURS[c][k], b = bonusPano(k, EMPLACEMENTS.length, true);
  return { pv: st.pv(l) + 3 * V('vita') + (b.vita || 0), dps: st.deg(l) * (1 + (3 * V('puissance') + (b.puissance || 0)) / 100) * (1 + (2 * V('agilite') + (b.agilite || 0)) / 100) / st.cadence };
}
const vagueRefDifficile = (L) => Math.min(VAGUES_TOTAL, Math.max(VAGUES_PALIER, VAGUES_PALIER * Math.round((L - 0.5) / VAGUES_PALIER))); /* la vague de boss la plus proche de ton niveau (75 -> 70, 76 -> 80) */
const facteurRejoue = (quoi, t) => { if (!combat || combat.rejoueBoss == null) return 1; const L = niveau(S_.xp), Lb = niveauRequis(combat.n);
  const boss = t && MONSTRES[t] && MONSTRES[t].boss, normale = Math.min(1.5, 1 + 0.025 * Math.max(0, L - Lb)); /* (la revanche normale : +2,5 % par niveau d'avance, x1,5 au plus) */
  if (combat.difficile && boss) { /* (06/11/2026, « il aura les memes PV que le boss du niveau 70, et les degats qui se rapprochent du boss 70 ; ca se calque sur le boss dont le niveau
     est le plus proche du tien : a 75 ca prend le 70, au 76 le 80 », Mathieu) : le boss prend la vie et les coups du boss de palier le plus proche de ton niveau, puis DUR */
    const nr = vagueRefDifficile(L), ref = PALIERS_TOUS[palierDe(nr)].boss;
    if (quoi === 'deg') return degMonstre(ref, nr) * multDegats(nr) * multHautes(nr) / Math.max(1, degMonstre(t, combat.n) * multDegats(combat.n) * multHautes(combat.n, combat.genre)) * DUR.deg; /* (les coups recus prennent ensuite multDegats et multHautes de SA vague : on les compense) */
    return pvMonstre(ref, nr) / Math.max(1, pvMonstre(t, combat.n)) * DUR.pv; }
  if (combat.difficile) { const a = forceRef(Math.max(L, Lb)), b = forceRef(Lb), r = quoi === 'deg' ? a.pv / b.pv : a.dps / b.dps; return Math.max(normale, r * DUR.garde); } /* sa troupe, remise a ton niveau */
  /* (06/11/2026, « en difficile je one-shot les monstres ; les monstres laisse-les pareil, mais le boss plus dur a tuer », Mathieu) : la troupe, remise a ton niveau puis x0,6
     (DUR.garde), tombait sous la vague normale pour les derniers boss (Dragon Cochon, Moon) ; elle prend maintenant le plus fort des deux, ce calcul ou la revanche normale
     (les premiers boss ne changent pas : leur troupe reste remise a ton niveau). Le boss, lui : vie x1,5 de plus (DUR.pv 1 -> 1,5) */
  return normale; };
/* LES AUTOS DES BOSS (07/11/2026, « les autos du boss ca devrait retirer environ 4 % des HP, et en difficile +50 %, donc environ 6 % », Mathieu) : un coup simple
   du boss enleve environ 4 % des PV d'un Iop de son niveau (panoplie complete du palier, jet moyen ; avant 1,6 a 2,3 % des le Bworker). Seulement les autos (le coup
   au contact, le tir de Crocabulia) : ses sorts ne bougent pas. En revanche difficile : l'auto du boss de reference (vagueRefDifficile), x1,5. Combats de vague et
   revanches seulement, pas l'Arene ni l'ile. Le Bouftou Royal et le Chafer y etaient deja (4,4 %) */
const AUTO_BOSS = [1, 1, 1.75, 2.04, 2.49, 1.82, 1.93, 2.04, 2.09, 1], AUTO_DIFFICILE = 1.5; /* (le Chene Mou, 08/11/2026 : 178 par coup, 4 a 4,5 % des PV d'un Iop 90) */ /* (Moon : ce chiffre ne joue pas sur ses coups, qui passent tous par son marteau (coupMarteau, ses sortsX) ; il sert a la fiche et a la revanche difficile des joueurs de niveau 90, 07/11/2026) */
/* LES DEMI-BOSS AUSSI (07/11/2026 au soir, « augmente les degats, faut reequilibrer les demi-boss comme ce qu'on a fait pour les boss de base », Mathieu) : leur
   auto (coup ou tir) enlevait environ 1 % des PV d'un Iop de leur niveau (panoplie complete du palier, jet moyen) ; a 4 % comme les boss. Calcule sur leurs vagues :
   Gorgouille 29 aux vagues 75 et 80 (x4,1), Kanniboul Ebil 31 a la 85 (x3,5), Tortue Corail 32 a la 90 (x3,5). Leurs sorts ne bougent pas */
const AUTO_DEMI = { gorgouille: 5.17, kannibEbil: 5.16, tortueCorail: 4.69, ancestral: 2.5, ancestralMaudit: 2.5 }; /* (l'Ancestral, 08/11/2026 : 178 par coup) */ /* (puis le meme soir, Mathieu : « Gorgouille a 150 les autos, Kanniboul a 160 et Tortue a 150 ») */
const autoFiche = (d, t, n) => d.boss ? (d.demi ? AUTO_DEMI[t] || 1 : (AUTO_BOSS[palierDe(n)] || 1) * (d.autoX || 1)) : 1; /* (la fiche et la carte de la vague) */
function autoBoss(mo) {
  if (!combat || combat.genre !== 'vague' || !mo || !mo.d.boss || mo.invoque) return 1;
  if (mo.d.demi) return (AUTO_DEMI[mo.type] || 1) * (combat.difficile && combat.rejoueBoss != null ? AUTO_DIFFICILE : 1);
  const P = combat.difficile && combat.rejoueBoss != null ? palierDe(vagueRefDifficile(niveau(S_.xp))) : palierDe(combat.n);
  return (AUTO_BOSS[P] || 1) * (mo.d.autoX || 1) * (combat.difficile && combat.rejoueBoss != null ? AUTO_DIFFICILE : 1); /* (autoX : Moon, ses coups directs a 220, 07/11/2026) */
}
/* la Cawotte et la Fraise (« une nouvelle recolte qui donne un boost », Mathieu, 11/10/2026) : on en mange une avant de lancer, pour cette vague seulement */
function sectionRepas(quand) { /* quand : 'arene' ou 'ile' (07/11/2026, les repas aussi a l'entree de l'Arene et de l'ile des boss), sinon la vague */
  const L = CULTURES.filter((c) => c.mange && (niveau(S_.xp) >= c.niv || (S_.grange[c.id] || 0) > 0)); if (!L.length) return '';
  S_.mange = S_.mange || {};
  const pendant = quand === 'arene' ? 'pendant toute la partie' : quand === 'ile' ? 'pendant l\'essai' : 'pendant la prochaine vague';
  return '<div class="hdv-section">Avant la bataille : manger</div><p class="hdv-aide">Un repas se prend ici, juste avant de ' + (quand === 'arene' ? 'partir' : quand === 'ile' ? 'partir' : 'lancer') + ' : une récolte de ta grange, et son bonus dure ' + (quand === 'arene' ? 'toute la partie d\'Arène' : quand === 'ile' ? 'tout l\'essai' : 'toute la vague qui suit') + '. La Cawotte et la Fraise se cumulent. Elles se plantent comme les autres cultures (graines à l\'HDV).</p>' + L.map((c) => { const n = S_.grange[c.id] || 0, pris = !!S_.mange[c.id];
    return '<div class="art">' + ico(c.id) + '<div><b>' + c.nom + (pris ? ' : mangée !' : '') + '</b><div class="puces"><span class="puce ' + (pris ? 'bonne' : '') + '">' + c.mange.txt + ' ' + pendant + '</span><span class="puce">' + n + ' en grange</span></div></div><div class="act">' +
      (pris ? '<span class="cadenas">✓ Prête</span>' : '<button class="btn mini" data-manger="' + c.id + '"' + (n > 0 ? '' : ' disabled') + '>' + (n > 0 ? 'Manger' : 'Aucune') + '</button>') + '</div></div>'; }).join('');
}
function sectionRejouerBoss() {
  const L = PALIERS.map((p, P) => P).filter((P) => S_.vague.num > (P + 1) * VAGUES_PALIER); if (!L.length) return '';
  return '<div class="hdv-section">Rejouer un boss</div><p style="font-size:.76rem;font-weight:600;margin:0 0 4px">Un boss battu se rejoue une fois par jour, remis à ton niveau. Ses kamas et son XP sont divisés par deux à chaque nouvelle victoire (la moitié, puis un quart...), mais son butin et ses 2 % de chance sur la pièce légendaire ne baissent jamais.</p>' +
    '<p style="font-size:.76rem;font-weight:600;margin:0 0 4px"><b>Difficile</b> : le boss prend la vie et les coups du boss de ton niveau (' + leNom(MONSTRES[PALIERS_TOUS[palierDe(vagueRefDifficile(niveau(S_.xp)))].boss], true) + ', vague ' + vagueRefDifficile(niveau(S_.xp)) + '), avec ' + Math.round((DUR.pv - 1) * 100) + ' % de vie en plus, et sa troupe est remise à ton niveau (seul un équipement meilleur que la moyenne t\'aide), puis plus vicieux : des sorts plus fréquents, des renforts plus souvent, enragé dès ' + Math.round(DUR.rage * 100) + ' % de sa vie. En échange, <b>deux fois plus de chances sur la pièce légendaire</b>. Une seule revanche par jour et par boss : normale ou difficile.</p>' +
    L.map((P) => { const B = MONSTRES[PALIERS_TOUS[P].boss], leg = LEGENDAIRES.find((x) => x.boss === PALIERS_TOUS[P].boss), ok = bossRejouable(P), g = gainsBoss(P);
      return '<div class="art">' + ico(B.icone) + '<div><b>' + B.nom + '</b><div class="puces"><span class="puce">+' + fmt(g.kamas) + ' ' + KAMA + '</span><span class="puce">+' + xpReel(g.xp) + ' XP</span>' + (leg ? '<span class="puce leg">✦ ' + (leg.nom || OBJETS[idLeg(leg)].nom) + ' : 2 %, 4 % en difficile' + (possede(idLeg(leg)) ? ' (déjà à toi)' : '') + '</span>' : '') + '</div></div><div class="act"><button class="btn kamas mini" data-rejouer-boss="' + P + '"' + (ok ? '' : ' disabled') + '>' + (ok ? 'Rejouer' : 'Demain') + '</button>' + (ok ? '<button class="btn mini dur" data-rejouer-dur="' + P + '">Difficile</button>' : '') + '</div></div>'; }).join('');
}
function lancerVague(pBoss, difficile, charges) {
  if (combat || enAccueil || !paysanMesh || lancerVague.charge) return;
  if (lieu !== 'ferme') { toast('Rentre d\'abord à la ferme en montgolfière.'); return; }
  if (!MODE_TEST && Date.now() < S_.vague.repos) { toast('Ton perso se repose encore ' + dureeLisible(S_.vague.repos - Date.now()) + '.'); return; }
  const rejoueB = pBoss != null && pBoss >= 0;
  if (rejoueB && !bossRejouable(pBoss)) { toast('Tu as déjà rejoué ce boss aujourd\'hui : reviens demain.'); return; }
  if (!rejoueB && S_.vague.num > vaguesOuvertes()) { toast('Tous les paliers sont terminés : la suite arrive bientôt. En attendant, chaque boss se rejoue une fois par jour (fenêtre Vagues).'); return; } /* (« on peut rejouer la vague 60 a l'infini », Mathieu, 13/10/2026 : apres le dernier boss, plus de vague a la chaine ; il se rejoue une fois par jour, comme les autres) */
  const n = rejoueB ? (pBoss + 1) * VAGUES_PALIER : vagueCourante(), file = [], rejoueV = rejoueB || S_.vague.num > vaguesOuvertes();
  if (!rejoueV && !MODE_TEST && Date.now() < (S_.vague.prepa || 0)) { toast('La vague ' + n + ' se prépare : elle sera là dans ' + dureeLisible(S_.vague.prepa - Date.now()) + '. Profites-en pour cultiver.'); return; }
  if (!rejoueV && !MODE_TEST && niveau(S_.xp) < niveauRequis(n)) { toast('Il faut le niveau ' + niveauRequis(n) + ' pour la vague ' + n + ' : cultive et élève tes bêtes pour gagner de l\'expérience.', 'alerte'); return; }
  if (!charges) { /* les monstres a squelette (l'ile de Moon, 02/11/2026) : charges avant la vague, avec ceux qu'ils appellent, leurs shaders prets (sinon l'image se fige a leur arrivee) */
    const T0 = [...new Set(compoTotale(n).map(([t]) => t))], tous = [].concat(...T0.map((t) => [t].concat(MONSTRES[t].renforts ? [MONSTRES[t].renforts[0]] : [], MONSTRES[t].renfortsRage ? [MONSTRES[t].renfortsRage[0]] : [], MONSTRES[t].invoque ? MONSTRES[t].invoque.types : [], MONSTRES[t].affaibli ? [MONSTRES[t].affaibli.invoque] : [], MONSTRES[t].enracine ? (MONSTRES[t].enracine.types || ['tronknyde', 'arbreCollant']) : []))).filter((t) => MONSTRES[t]);
    const sq = [...new Set(tous.map((t) => MONSTRES[t].modele))].filter((x) => !MODELES[x] && SQUELETTES_A_CHARGER.some(([s]) => s === x));
    if (sq.length) { lancerVague.charge = true; toast('Les monstres de ' + PALIERS_TOUS[palierDe(n)].nom + ' arrivent…', 'or');
      chargerSquelettes(sq).then(() => { prechaufferSquelettes(sq); }).catch(() => {}).finally(() => { lancerVague.charge = false; lancerVague(pBoss, difficile, true); }); return; } }
  compoVague(n).forEach(([t, k]) => { for (let i = 0; i < k; i++) file.push(t); });
  file.sort(() => Math.random() - 0.5); file.sort((a, b) => (MONSTRES[a].boss ? 1 : 0) - (MONSTRES[b].boss ? 1 : 0)); /* le boss arrive en dernier */
  const groupe = multVague(n) > 1 ? Math.ceil(file.length / multVague(n)) : 0; /* (la horde de la Phase 2 : autant de monstres a la fois qu'avant, les autres en renfort, 04/11/2026) */
  nouveauCombat('vague', { n, file, total: file.length, attente: 0.8, groupe, pv: vieActuelle(), ...potsDeVague(), bouclierBat: bouclierPret(), rejoueBoss: rejoueB ? pBoss : null, difficile: rejoueB && !!difficile });
  if (combat.bouclierBat && !enRuine('grange')) { combat.bouclierMax = combat.bouclierPv = Math.round(pvMaxBat('grange') * BOUCLIER_BASE); poserCarapace(combat); majBarresBat(); /* (la carapace se referme sur la grange, sa reserve de points sur la barre, 13-batiments-pv.js) */
    const pts = combat.bouclierMax; setTimeout(() => toast('Bouclier de carapace : ' + fmt(pts) + ' PV de bouclier sur ' + nomQG() + ', les coups l\'entament avant sa vie.', 'or'), 2200); }
  combat.phases = (PHASES_BOSS[n] || []).map((p) => { const f = []; p.L.forEach(([t, k]) => { for (let i = 0; i < k; i++) f.push(t); }); f.sort(() => Math.random() - 0.5); return { nom: p.nom, f }; }); /* (la vague 70 : ses temps suivants) */
  if (rejoueB) { S_.bossRejoue = S_.bossRejoue || {}; S_.bossRejoue[pBoss] = jourJeu(); sauver(); }
  { const repas = appliquerRepas(); if (repas.length) setTimeout(() => toast('Repas avant la bataille : ' + texteRepas(repas) + ' pendant cette vague.', 'or'), 1200); }
  fermerModale(); ouvrirHudCombat();
  toast(rejoueB ? leNom(MONSTRES[PALIERS_TOUS[pBoss].boss]) + (difficile ? ' revient en mode DIFFICILE : remis à ton niveau, bien plus coriace, plus vicieux, et deux fois plus de chances de lâcher sa pièce légendaire. Bonne chance !' : ' revient pour la revanche, remis à ton niveau !') : (combat.phases.length ? 'Vague ' + n + ' en ' + (combat.phases.length + 1) + ' temps : d\'abord la horde (' + file.length + ' monstres), puis ' + combat.phases.map((p) => p.nom).join(', puis ') + ' !' : 'Vague ' + n + ' : ' + file.length + ' monstres ' + (groupe ? 'arrivent par groupes, ' + groupe + ' d\'abord, les autres en renfort !' : 'arrivent par les bords de ta ferme !')), 'alerte'); majCombatHud(); son('vague');
}
/* LA FORET ARRIVE DE PARTOUT (08/11/2026, « pour les vagues d'Abraknydes, j'aimerais qu'on les voie apparaitre depuis les zones qu'on n'a pas debloquees, les
   terrains pas encore achetes, histoire d'etre encore plus terrifie, ca arrive de partout », Mathieu) : un monstre du palier 10 qui entre par la friche part
   de 5 a 14 de plus loin dans les hautes herbes, en biais, et traverse la friche en marchant jusqu'au bord (majMonstre), puis il saute sur la ferme comme
   avant. Seulement si toute la route est en friche (ni la mer, ni la plage, ni une de tes cases) ; sinon il sort du bord, comme les autres. */
const fricheIci = (x, z) => { const i = Math.round(x / S + (COLS - 1) / 2), j = Math.round(z / S + (ROWS - 1) / 2); if (caseAt(i, j)) return false; const c = codeIle(i, j); return !!c && c !== '~' && c !== ',' && c !== '='; };
function departFriche(dep, b) {
  const a0 = Math.atan2(b.di, b.dj);
  for (let essai = 0; essai < 8; essai++) { const a = a0 + (Math.random() - 0.5) * 1.3, L = 5 + Math.random() * 9; let ok = true;
    for (let s = 0.6; s <= L && ok; s += 0.6) ok = fricheIci(dep.x + Math.sin(a) * s, dep.z + Math.cos(a) * s);
    if (ok) return { x: dep.x + Math.sin(a) * L, z: dep.z + Math.cos(a) * L, k: 0 }; }
  return null;
}
/* les bords de la ferme : une case praticable dont un cote ne donne sur aucune de tes cases. L'ILE RONDE : sur la friche (un terrain pas encore achete),
   les monstres sortent des broussailles ; sur le vide, ils grimpent comme avant ; jamais par l'eau ni par la berge */
function bordsFerme() {
  const L = []; S_.cases.forEach((c) => { if (!PASSABLE[c.type]) return; COTES.forEach(([di, dj]) => { if (caseAt(c.i + di, c.j + dj)) return; const code = codeIle(c.i + di, c.j + dj); if (code === '~' || code === ',' || code === '=') return; L.push({ c, di, dj, friche: !!code }); }); }); return L;
}
/* « les mobs qui attaquent de par la (la terrasse du fond, derriere la grange), surtout quand ils doivent nous attaquer nous et pas un batiment, ils galerent
   trop a nous rejoindre, le boss a pop de par la, il a meme pas eu le temps de me toucher » (Mathieu, 15/10/2026) : la terrasse ne descend que par l'escalier.
   On n'apparait que sur un bord dont le chemin jusqu'au perso n'est pas un long detour (au plus 1,25 fois la ligne droite, plus 1 case) */
function bordsDirects(L) {
  const pc = paysanMesh && caseIci(paysanMesh.position.x, paysanMesh.position.z); if (!pc) return L;
  const dist = new Map([[pc.id, 0]]), file = [pc];
  while (file.length) { const c = file.shift(); voisins(c).forEach((v) => { if (!dist.has(v.id) && praticable(v)) { dist.set(v.id, dist.get(c.id) + 1); file.push(v); } }); }
  const q0 = posCase(pc), ok = L.filter((b) => { const d = dist.get(b.c.id), q = posCase(b.c); return d != null && d <= Math.hypot(q.x - q0.x, q.z - q0.z) / S * 1.25 + 1; });
  return ok.length >= 3 ? ok : L;
}
const bestiaire = () => (S_.bestiaire = S_.bestiaire || {}); /* { type: { vus, tues } } : le bestiaire se remplit des monstres affrontes (15/10/2026) */
function noterVu(t) { const B = bestiaire(); (B[t] = B[t] || { vus: 0, tues: 0 }).vus++; }
function noterTue(t) { const B = bestiaire(); (B[t] = B[t] || { vus: 1, tues: 0 }).tues++; }
function completerBestiaire() { /* les sauvegardes d'avant : les monstres des vagues deja battues comptent comme vus */
  const B = bestiaire(); for (let n = 1; n < Math.min(S_.vague.num, VAGUES_TOTAL + 1); n++) compoTotale(n).forEach(([t]) => { if (!B[t]) B[t] = { vus: 1, tues: 0 }; });
}
/* LES REGLES D'ARRIVEE (refonte du 16/10/2026) : l'Arene et l'ile des boss changent la force d'un monstre a son arrivee, et ils s'en prennent tous au perso */
function regleArene(o) { /* l'Arene : chacun remis a la force de l'Arene (statsArene, le boss a celle du boss de reference), puis tous plus forts au fil des vagues (forceArene), le boss a moitie */
  const mu = forceArene(combat.arene.k) * (o.d.boss ? forceBossArene : 1), s = o.d.boss ? statsBossArene() : statsArene(o.type); o.aggro = true; o.casseur = false;
  o.pv = o.pvMax = Math.max(1, Math.round(s.pv * mu)); o.deg = Math.max(1, Math.round(s.deg * mu)); if (o.d.boss) o.degSortA = Math.max(o.d.degSort || 0, s.sort); /* (20/10/2026) */
}
function regleIleBoss(o) { /* l'ile des boss : tout a ton niveau ; le boss colossal (une fois et demie plus grand) a les PV de toute l'alliance */
  const L = niveau(S_.xp), Lb = niveauRequis(combat.n), a = forceRef(L), b = forceRef(Lb); o.aggro = true; o.casseur = false;
  const mR = 1 + ENRAGE_ILE.pas * (combat.arene.pas || 0); o.rageM = mR; /* (sa troupe arrive deja enragee comme lui) */
  if (o.d.boss) { o.deg = o.deg0 = Math.max(1, Math.round(o.deg * a.pv / b.pv)); o.pvMax = pvIleBoss(o.type); o.pv = Math.max(1, o.pvMax - combat.arene.avant); o.echelle = (o.echelle || 1) * 1.5; o.m.scale.setScalar(o.echelle); o.haut *= 1.5; o.vitM = VITESSE_ILE[o.type] || 1;  renforcerIle(o); } /* (renforcerIle : le Craqueleur legendaire renforce sur l'ile, 07/11/2026) */
  else { o.pv = o.pvMax = Math.max(1, Math.round(o.pvMax * a.dps / b.dps * 0.6)); o.deg0 = Math.max(1, Math.round(o.deg * a.pv / b.pv * 0.6)); o.deg = Math.max(1, Math.round(o.deg0 * mR)); }
}
function apparaitre(type, pres) {
  const d = MONSTRES[type]; noterVu(type);
  if (combat && !combat.nuitForet && typeof VERSIONS_P10 !== 'undefined' && VERSIONS_P10.has(d.modele)) { combat.nuitForet = true; nuitForet(); toast('La Forêt des Abraknydes plonge la ferme dans la nuit…', 'alerte'); } /* (la nuit de la foret, 08/11/2026) */
  if (!d.fabrique && !MODELES[d.modele]) { /* son modele n'est pas encore la (un monstre a squelette, charge a la demande) : il sort des qu'il est charge ; sans modele, il ne vient pas (26/10/2026 : cloner plantait et l'image se figeait) */
    const c0 = combat; chargerSquelettes([d.modele]).then(() => { if (combat !== c0 || c0.fin) return; if (MODELES[d.modele]) apparaitre(type, pres); else if (c0.total > 0) c0.total--; }); return; }
  if (combat.arene && !pres) { const g = hasard(PORTES_ARENE); pres = { x: g.x + (Math.random() - 0.5) * 1.4, z: g.z + (Math.random() - 0.5) * 1.4, porte: g }; } /* l'Arene : ils sortent des herses */
  if (!pres && d.parachute && combat.raid) pres = pointParachute(); /* (le Parachutiste de VSA se pose pres de la grange, 06/11/2026) */
  if (!pres && d.fouisseur && !combat.raid && !combat.arene) { pres = pointPresBat(); if (pres && !combat.fouisseurVu) { combat.fouisseurVu = true; toast('Un ' + d.nom + ' surgit de terre au pied de tes bâtiments, derrière tes défenses !', 'alerte'); } }
  const L0 = pres ? [] : (combat.bords || (combat.bords = bordsFerme())), L = L0.length && !combat.raid ? bordsDirects(L0) : L0, b = !pres && combat.raid && combat.entrees && combat.entrees.length ? combat.entrees.shift() : L.length ? hasard(L) : null; /* (la simu VSA : chaque voleur par sa case rouge) */
  const c = pres ? (caseIci(pres.x, pres.z) || S_.cases.find((x) => PASSABLE[x.type])) : b ? b.c : hasard(S_.cases.filter((x) => PASSABLE[x.type])), q = posCase(c);
  const m = d.fabrique ? d.fabrique() : cloner(d.modele), ombreM = ombrePieds(m, d.ombre); if (d.teinte) teinterMonstre(m, d); const id = ++combat.id; m.traverse((o) => { o.userData.monstre = id; });
  const zone = new T.Mesh(new T.SphereGeometry(Math.max(0.6, d.ombre * 0.5), 8, 6), CIBLE); zone.position.y = d.ombre * 0.4; zone.userData.monstre = id; m.add(zone); /* plus facile a toucher */
  let x, z, ry, dep;
  if (b) { /* il grimpe depuis le vide, sous le bord, et se hisse sur la case ; ou il sort de la friche (les hautes herbes du terrain voisin), d'un bond */
    const le = (Math.random() - 0.5) * 1.2; x = q.x + b.di * 0.55 + (b.dj ? le : 0); z = q.z + b.dj * 0.55 + (b.di ? le : 0); ry = Math.atan2(-b.di, -b.dj);
    dep = b.friche ? { x: x + b.di * 1.9, y: q.y, z: z + b.dj * 1.9, friche: true } : { x: x + b.di * 1.1, y: q.y - 2.4, z: z + b.dj * 1.1 };
    if (b.friche && typeof VERSIONS_P10 !== 'undefined' && VERSIONS_P10.has(d.modele) && !combat.arene && !combat.raid) dep.loin = departFriche(dep, b); /* (la Foret des Abraknydes arrive du fond des terrains pas encore achetes, 08/11/2026) */
  } else { /* les renforts sortent de terre, pres du boss */
    x = pres ? pres.x : q.x; z = pres ? pres.z : q.z; ry = Math.random() * 6.28; dep = d.parachute && combat.raid ? { x, y: q.y + HAUT_PARACHUTE, z, parachute: true } : { x, y: q.y - 1.6, z };
    if (pres && pres.porte) { ry = Math.atan2(ARENE.x - x, ARENE.z - z); dep = { x: pres.porte.ox, y: 0, z: pres.porte.oz, friche: true }; } /* (il bondit hors de la herse) */
  }
  poser(m, dep.x, dep.y, dep.z, ry); if (d.boss) son(type === 'royal' ? 'royal' : 'vague', null, type === 'royal' ? 0 : 2); /* (le boss arrive : le Royal bele, les autres ont le cor) */
  const barre = document.createElement('div'); barre.className = 'pv-monstre'; barre.innerHTML = '<i></i>'; barre.hidden = true; $('combat-zone').appendChild(barre);
  combat.monstres.push({ id, type, d, m, echelle: m.scale.x, barre, pv: Math.round(pvMonstre(type, combat.n) * facteurRejoue('pv', type)), pvMax: Math.round(pvMonstre(type, combat.n) * facteurRejoue('pv', type)), deg: Math.round(degMonstre(type, combat.n) * facteurRejoue('deg', type)), x, z, y: q.y, ry, dep, sortie: combat.raid && combat.sortie ? { x: combat.sortie.x, z: combat.sortie.z } : { x, z }, t: -Math.random() * 0.8, etat: 'grimpe', cd: 0.6 + Math.random() * 0.6, pas: 0, picore: 0, champ: null, frappe: 0, coup: 0, haut: (m.userData.hauteur || 1) + 0.35 + (d.vol || 0), ombreM });
  { const o = combat.monstres[combat.monstres.length - 1]; if (combat.genre === 'ile') regleIleBoss(o); else if (combat.dev) { o.aggro = true; o.casseur = false; } else if (combat.arene) regleArene(o); } /* (l'Arene dev : leur propre force, mais tous sur le perso comme a l'Arene ; sans ca, un casseur visait les batiments de la ferme et traversait la mer, 26/10/2026) */
  { const o = combat.monstres[combat.monstres.length - 1]; if (o && o.d.boss && o.m && !o.d.vole) { o.m.updateMatrixWorld(true); const b = new T.Box3().setFromObject(o.m), r = o.m.userData.anim ? (o.m.userData.hauteur || 2) * 0.32 : Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2; o.allonge = Math.max(1, (r * 0.85 + 1.0) / o.d.portee); } }
  /* (29/10/2026) un monstre a squelette : sa carrure vient de sa hauteur, pas de sa boite. La boite d'une peau Mixamo est celle du fichier, couchee et
     dans un autre repere (12 sur 12 pour le Golem lunaire) : il frappait a 6 cases et te touchait de la, le Gorille roi a 5, Ebil a 3,9 */
  { const o = combat.monstres[combat.monstres.length - 1]; if (o && o.m.userData.portee) o.allonge = Math.max(0.6, (o.m.userData.portee + 0.6) / o.d.portee); } /* (un monstre a squelette : sa portee est celle de ses coups, mesuree sur ses animations) */
  { const o = combat.monstres[combat.monstres.length - 1]; if (o && o.dep && o.dep.parachute) equiperParachute(o); }
  if (pres && pres.apres) pres.apres(combat.monstres[combat.monstres.length - 1]); /* (une invocation : marquee par son invocateur, meme chargee apres coup) */
  /* (16/10/2026, « quand on passe dans la zone d'un boss, il doit nous attaquer » : sa portee ne depassait guere son corps ; il frappe maintenant jusqu'a environ 1 au-dela, mesure sur son modele, colosse de l'ile compris) */
}
/* le monstre (ou le voleur) le plus proche du clic a l'ecran : sa silhouette des pieds a la tete, elargie d'une marge (plus grande au doigt) */
function bouftouEcran(e) { /* le Bouftou le plus proche du clic a l'ecran (trouve en jouant le tuto au PC le 12/10/2026 : un Bouftou colle a la cloture, le clic droit tombait sur la cloture et ouvrait l'enclos au lieu de le nourrir) */
  const r = rendu.domElement.getBoundingClientRect(), marge = e.pointerType === 'touch' || e.pointerType === 'pen' ? 22 : 8, ecran = (v) => { v.project(camera); return [(v.x + 1) / 2 * r.width + r.left, (1 - v.y) / 2 * r.height + r.top]; };
  let best = null, bd = Infinity;
  bouftousMesh.forEach((m, k) => { if (!m.visible || !S_.bouftous[k]) return; const b = new T.Box3().setFromObject(m), c = b.getCenter(new T.Vector3()), [x, y] = ecran(c.clone()), [, yh] = ecran(c.clone().setY(b.max.y)), d = Math.hypot(e.clientX - x, e.clientY - y);
    if (d < Math.abs(y - yh) * 1.15 + marge && d < bd) { bd = d; best = k; } });
  return best;
}
function cibleEcran(e) {
  const L = [], marge = e.pointerType === 'touch' || e.pointerType === 'pen' ? 30 : 16, r = rendu.domElement.getBoundingClientRect();
  if (combat) combat.monstres.forEach((mo) => { if (mo.etat === 'actif' && mo.m) L.push([mo.m.position, mo.haut || 1.6, mo.id]); });
  if (voleur && voleur.m && voleurCiblable()) L.push([voleur.m.position, 1.6, 'voleur']);
  const ecran = (v) => { v.project(camera); return [(v.x + 1) / 2 * r.width + r.left, (1 - v.y) / 2 * r.height + r.top]; };
  let best = null, bd = Infinity;
  L.forEach(([p, h, id]) => {
    const [ax, ay] = ecran(p.clone()), [bx, by] = ecran(p.clone().setY(p.y + h)), dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((e.clientX - ax) * dx + (e.clientY - ay) * dy) / l2)), d = Math.hypot(e.clientX - ax - t * dx, e.clientY - ay - t * dy);
    if (d < Math.max(10, 0.28 * Math.sqrt(l2)) + marge && d < bd) { bd = d; best = id; }
  });
  return best;
}
function cibler(id) { const o = combat && combat.monstres.find((x) => x.id === id && x.etat === 'actif'); if (!o) return;
  combat.cible = o; combat.ordre = false; combat.tenir = false;
  if (paysanMesh && paysanMesh.userData.tempete) allerTournoyant(o); /* (pendant la Tempete de lames, un monstre touche : il y va en tournoyant, 07/11/2026) */
}
/* (07/11/2026, « l'ultime ou on tourne sur nous-memes, parfois on peut se deplacer, des fois on ne peut pas », Mathieu) : pendant la Tempete de lames, un clic sur un
   monstre le ciblait sans faire bouger le Iop (il ne repart vers sa cible qu'apres le tourbillon) ; autour de lui il n'y a que des monstres, d'ou les clics « morts ».
   Maintenant il va vers le monstre touche, comme sur un clic au sol */
function allerTournoyant(o) {
  combat.ordre = true; combat.tenir = true; arrivee = null;
  if (lieu === 'ferme' && !combat.arene) { const q = caseIci(o.x, o.z); if (q && praticable(q)) { pointVise = { c: q.id, x: o.x, z: o.z }; allerPuis(q, () => {}); pointVise = null; return; } }
  chemin = [{ c: paysanMesh.userData.cellule, x: o.x, z: o.z }];
}
const m0Anim = (mo) => !!(mo.m && mo.m.userData.anim);
function blesser(mo, n, gros, src) { /* src 'def' : un coup de tes defenses (tour, arbalete, epouvantail), compte a part dans le bilan */
  if (!combat || combat.fin || !mo || mo.etat !== 'actif') return;
  if (mo.esquive > 0) { if (!(mo.esquiveVu > 0)) { mo.esquiveVu = 0.4; const p = mo.m.position.clone(); p.y += mo.haut; chiffre('Esquive !', p); } return; }
  if (mo.faible || mo.ancre) { if (!((mo.faibleVu || 0) > performance.now())) { mo.faibleVu = performance.now() + 450; const p = mo.m.position.clone(); p.y += mo.haut * 0.75; chiffre('Invulnérable', p); } return; } /* (Moon affaibli, 22c-squelettes.js) */ /* (une Tortue en pleine roulade : tes coups la manquent) */
  mo.recent = 1.2; /* (il vient d'etre touche : une Tortue peut rouler pour esquiver la suite) */
  if (src == null && combat.venin == null) combat.venin = (caracs().venin || 0) / 100; if (src == null && combat.venin > 0) { const dps = n * combat.venin / 3; if (!mo.venin || mo.venin.dps < dps) mo.venin = { dps, t: 3, tic: 0 }; else mo.venin.t = 3; } /* (le venin de l'Arakne complete, 08/11/2026 : 10 % du coup en poison sur 3 s) */
  if (mo.d.armure) n = Math.max(1, Math.round(n * (1 - mo.d.armure))); /* les boss encaissent moins */
  if (mo.bouclier > 0) n = Math.max(1, Math.round(n * 0.6)); /* bouclier de cristal */
  if (mo.d.boss && mo.protege > 0) n = Math.max(1, Math.round(n * (1 - mo.protege))); /* sa troupe le protege */
  if (mo.carapace > 0) n = Math.max(1, Math.round(n * 0.2)); /* la carapace d'epines du Chafer Cuirasse (ses epines renvoient les coups du perso : voir majPerso) */
  if (mo.pierre > 0) n = Math.max(1, Math.round(n * 0.5)); /* la peau de pierre de la Gorgouille (20/10/2026) */
  if (mo.maudit > 0) n = Math.round(n * 1.25); /* (maudit par la Fleche maudite du Cra : +25 %, 09/11/2026) */
  if (paysanMesh && Math.hypot(paysanMesh.position.x - mo.x, paysanMesh.position.z - mo.z) < 8) mo.aggro = true; /* le perso le frappe : il se retourne contre lui */
  if (combat.genre === 'ile' && mo.d.boss) combat.arene.deg += Math.min(n, Math.max(0, mo.pv)); /* (l'ile des boss : tes degats sur le boss) */
  { const v = 0.01 * nbBonus('vol'); if (v) { const a0 = combat.pv; combat.pv = Math.min(combat.pvMax, combat.pv + Math.min(n, Math.max(0, mo.pv)) * v); if (combat.st) combat.st.soins += combat.pv - a0; } } /* (le bonus Vol de vie de l'Arene) */
  mo.pv -= n; mo.coup = m0Anim(mo) ? 0 : 0.18; if (m0Anim(mo)) { eclatSquelette(mo); if (gros || n > mo.pvMax * 0.012) reactionSquelette(mo); } /* (un monstre a squelette rougit sous le coup, sans gonfler ni s'arreter ; un boss sursaute) */ if (combat.st) { combat.st.inflige += n; if (src === 'def') combat.st.def = (combat.st.def || 0) + n; else if (n > combat.st.max) combat.st.max = n; } chiffre('-' + n, new T.Vector3(mo.x, mo.m.position.y + mo.haut - 0.2, mo.z), gros ? 'gros' : '');
  if (mo.d.affaibli && !mo.faible && !mo.faibleFini && m0Anim(mo) && mo.pv <= mo.pvMax * mo.d.affaibli.seuil) { mo.pv = Math.ceil(mo.pvMax * mo.d.affaibli.seuil); entrerFaible(mo); return; } /* (Moon, sa vie bloquee a 30 %, 31/10/2026) */
  if (mo.pv <= 0 && mo.d.revit && !mo.revenu) { /* le Wabbit Squelette se releve une fois, a mi-vie */
    mo.revenu = true; mo.pv = Math.round(mo.pvMax * 0.5); pouf(mo.x, mo.m.position.y, mo.z, 2.2, '#ece0b8'); chiffre(mo.d.revitRage ? 'Il se relève, enragé !' : 'Il se relève !', new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.2, mo.z), 'butin');
    if (mo.d.revitRage) { mo.deg = Math.round(mo.deg * mo.d.revitRage); mo.galva = 1e9; mo.galvaC = '#e8412e'; pouf(mo.x, mo.m.position.y, mo.z, 1.6, '#e8412e'); } /* (06/11/2026 : enrage jusqu'a sa mort, plus rapide et plus vif (comme galvanise), et frappe x1,3) */
    if (!combat.revitVu) { combat.revitVu = true; toast(leNom(mo.d) + ' se relève : il faut l\'abattre deux fois !', 'alerte'); } return;
  }
  if (mo.pv <= 0 && mo.butinK > 1) { S_.kamas += mo.butinK; chiffre('+' + fmt(mo.butinK) + ' kamas', new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.3, mo.z), 'butin'); toast('Le ' + mo.d.nom + ' est abattu : tes ' + fmt(mo.butinK) + ' kamas reviennent à la grange !', 'or'); mo.butinK = 0; rendreHaut(); }
  if (mo.pv <= 0 && mo.d.demonte && !combat.raid) { const x = mo.x, z = mo.z, y = mo.m.position.y; setTimeout(() => { if (!combat || combat.fin) return; apparaitre(mo.d.demonte, { x, z }); const nm = combat.monstres[combat.monstres.length - 1]; nm.dep = { x, y: y + 1.3, z }; nm.t = 0.25; combat.total++;
    chiffre('Il continue à pied !', new T.Vector3(x, y + 2.6, z), 'butin'); if (!combat.demonteVu) { combat.demonteVu = true; toast('Sa monture tombe, mais le ' + mo.d.nom + ' continue à pied !', 'alerte'); } }, 0); }
  if (mo.pv <= 0 && combat.arene && !mo.d.sansButin && Math.random() < runeParMonstre(combat.arene.k) * prosArene()) { /* l'Arene : une rune, rarement, sur un monstre abattu (0,1 % des la vague 3, 0,25 % des la 10e, 0,5 % des la 15e) */
    runes().forge = (runes().forge || 0) + 1; combat.arene.runes.forge = (combat.arene.runes.forge || 0) + 1; son('niveau'); pouf(mo.x, mo.m.position.y, mo.z, 3, '#b48cff');
    chiffre('★ Rune de forgemagie !', new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.5, mo.z), 'butin'); toast('★ Une rune de forgemagie ! Elle t\'attend à l\'atelier de forgemagie.', 'or'); }
  if (mo.pv <= 0 && combat.arene && combat.genre !== 'ile' && !mo.d.boss && !mo.d.sansButin && combat.arene.k >= 5) { const pros = prosArene(); /* l'Arene : une piece de SA panoplie, des la 5e vague (0,25 % par monstre, jet de 50 % au moins ; 20/10/2026, « c'est pour la revente », Mathieu) */
    if (panoExiste(statsArene(mo.type).p) && Math.random() < ITEM_MONSTRE_ARENE * pros) { const P = panoMonstre(mo.type, statsArene(mo.type).p), id = tirerPiece(P, pros), cle = donnerObjet(id, JET_ARENE); combat.arene.objets.push(cle); son('niveau'); pouf(mo.x, mo.m.position.y, mo.z, 3, '#f2b630');
      chiffre((OBJETS[id].rare ? '★ RARE : ' : '+ ') + OBJETS[id].nom + ' !', new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.5, mo.z), 'butin'); toast((OBJETS[id].rare ? '★ PIÈCE RARE : ' : 'Butin : ') + OBJETS[id].nom + ' (jet ' + Math.round(100 * qualiteJet(cle)) + ' %) : dans ton sac.', 'or'); } }
  if (mo.pv <= 0 && mo.maudit > 0) { mo.maudit = 0; propagerMalediction(mo); } /* (il meurt maudit : la malediction saute sur 2 voisins) */
  if (mo.pv <= 0) { if (combat.st && !mo.d.sansButin) combat.st.tues++; if (!mo.d.sansButin) { noterTue(mo.type); compter('monstres'); } son('touche'); if (combat.raid) { combat.tues++; if (mo.porte) { S_.grange[mo.porte.id] = (S_.grange[mo.porte.id] || 0) + mo.porte.n; (combat.recup = combat.recup || []).push(mo.porte); chiffre('+' + mo.porte.n + ' ' + mo.porte.nom, new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.3, mo.z), 'butin'); mo.porte = null; rendreGrange(); } combat.lootV = butinVoleur(mo.d.vole || 1, combat.lootV); } else if (!mo.d.sansButin) butin(mo); mo.etat = 'mort'; mo.t = 0; mo.barre.remove(); if (!((mo.d.boss || mo.d.demi) && !mo.invoque)) pouf(mo.x, mo.m.position.y, mo.z, 2.5); if (combat.cible === mo) combat.cible = null; } /* (un boss tombe, sans anneau, 01/11/2026) */
}
/* le butin : une ressource du monstre (35 %), parfois une piece d'equipement de la panoplie du palier (7 %, le boss : toujours la premiere fois) */
/* (le Bouftou des vagues 1 a 10 lache de la laine depuis le 14/10/2026 : « ouais applique », Mathieu ; il ne lachait aucune ressource) */
const RES_MONSTRE = { bwork: 'dent_bwork', bworkArcher: 'dent_bwork', bworkMage: 'dent_bwork', bworkette: 'dent_bwork', bworker: 'dent_bwork', tofu: 'plume', bouftou: 'laine', chafer: 'os_chafer', fantassin: 'os_chafer', gardien: 'os_chafer', archer: 'os_chafer', cuirasse: 'os_chafer', royal: 'laine' };
function butin(mo) {
  if (combat.genre === 'ile' || combat.arene) return; /* (15/10/2026, « j'ai gagne 51 branches de Kaliptus, ca fait beaucoup non ? » : sur l'ile des boss, aucun butin ; les recompenses sont dans le coffre de la semaine. L'Arene aussi depuis le 19/10/2026 : « le fait de loot des ressources, il faut le retirer », Mathieu, 78 Poils de Wabbit en une partie ; ses runes tombent a part, ses pieces sont dans les coffres des boss) */
  const L = combat.loot || (combat.loot = { res: {}, objets: [] }), pros = 1 + caracs().prospection / 100, r = mo.d.res || RES_MONSTRE[mo.type], horde = mo.d.boss ? 1 : multVague(combat.n); /* (la horde de la Phase 2 : le meme butin par vague, partage entre plus de monstres, 04/11/2026) */
  if (r && Math.random() < (mo.d.boss ? 1 : 0.35) * pros / horde) { const n = mo.d.boss ? 5 : 1; S_.grange[r] = (S_.grange[r] || 0) + n; L.res[r] = (L.res[r] || 0) + n; }
  const deja = S_.vague.num > combat.n, chance = mo.d.boss ? (deja ? 0.4 : 1) : (mo.type === 'tofu' ? 0.02 : 0.07) * pros / horde, aPano = panoExiste(palierDe(combat.n)); /* (un palier sans sa panoplie, l'ile de Moon : ni piece ni arme, plutot que celles du Dragon Cochon, 04/11/2026) */
  if (aPano && Math.random() < chance) {
    const id = tirerPiece(panoMonstre(mo.type, palierDe(combat.n)), pros); /* (les Tortues : la panoplie de la Tortue) */
    L.objets.push(donnerObjet(id)); if (OBJETS[id].rare) { son('niveau'); pouf(mo.x, mo.m.position.y, mo.z, 3, '#f2b630'); }
    chiffre((OBJETS[id].rare ? '★ RARE : ' : '+ ') + OBJETS[id].nom, new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.3, mo.z), 'butin'); toast((OBJETS[id].rare ? '★ PIÈCE RARE : ' : 'Butin : ') + OBJETS[id].nom + ' ! Équipe-la dans la fiche du perso.', 'or'); rendreHaut();
  }
  const ar = aPano && mo.d.boss && ARMES[classeDe()], arme = ar && 'arme-' + ar[0] + '-' + panoMonstre(mo.type, palierDe(combat.n)).id; /* (la Tortue Corail, boss d'une phase de la 90 : pas l'arme du Kanniboul, que Moon seul donne, mais celle de la Tortue depuis le 07/11/2026) */
  if (arme && OBJETS[arme] && Math.random() < (deja ? 0.25 * pros : 1)) { /* l'arme de ta classe : a coup sur la premiere fois, puis une fois sur 4 */
    const id = tirerRare(arme, pros); L.objets.push(donnerObjet(id));
    chiffre('Arme : ' + OBJETS[id].nom, new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.9, mo.z), 'butin'); toast('Arme : ' + OBJETS[id].nom + ' ! Équipe-la dans la fiche du perso.', 'or'); rendreHaut();
  }
  const leg = mo.d.boss && LEGENDAIRES.find((x) => x.boss === mo.type);
  if (leg && Math.random() < CHANCE_LEG * pros * (combat.difficile ? DUR.leg : 1)) { /* la piece legendaire du boss (coiffe, ou l'arme de ta classe) ; deux fois plus de chances en revanche difficile */
    const id = idLeg(leg); L.objets.unshift(donnerObjet(id)); compter('legendaires');
    chiffre('✦ ' + OBJETS[id].nom, new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.6, mo.z), 'butin'); pouf(mo.x, mo.m.position.y, mo.z, 4, '#b57cf0'); son('niveau');
    toast('✦ LÉGENDAIRE : ' + OBJETS[id].nom + ' ! ' + OBJETS[id].pouvoir, 'or'); rendreHaut();
  }
}
/* les sorts des boss s'annoncent au sol : une zone rouge clignote et se remplit, on a le temps d'en sortir. Un cercle ({ x, z, r }) ou une bande
   ({ x, z, x2, z2, larg }) ; elle reste dans combat.dangers jusqu'au coup (le bot et les simulations l'esquivent comme un joueur) */
const dansDanger = (d, x, z) => { if (d.r && d.ouv != null) { const dx = x - d.x, dz = z - d.z; let e = Math.atan2(dx, dz) - d.a; e = Math.atan2(Math.sin(e), Math.cos(e)); return Math.hypot(dx, dz) < d.r && Math.abs(e) < d.ouv; } /* (un eventail : a, la direction ; ouv, le demi-angle) */
  if (d.r) return Math.hypot(x - d.x, z - d.z) < d.r; const ax = d.x2 - d.x, az = d.z2 - d.z, L2 = ax * ax + az * az || 1, k = Math.max(0, Math.min(1, ((x - d.x) * ax + (z - d.z) * az) / L2)); return Math.hypot(x - d.x - k * ax, z - d.z - k * az) < d.larg / 2; };
const solA = (x, z) => { const c = caseIci(x, z); return c ? hauteurSol(x, z, c) : 0; };
const pointValide = (x0, z0, x, z) => { const ok = (a, b) => { if (lieu === 'arene') return solSort(a, b); const q = caseIci(a, b); return q && praticable(q); }; /* (a l'Arene, son cercle : elle n'a pas de cases de ferme, tout y tombait a zero ; les Tortues roulaient sur place, « elles avancent pas », Mathieu, 29/10/2026) */ let k = 1; while (k > 0 && !ok(x0 + (x - x0) * k, z0 + (z - z0) * k)) k -= 0.05; k = Math.max(0, k); return { x: x0 + (x - x0) * k, z: z0 + (z - z0) * k }; };
function zoneDanger(o) {
  const c0 = combat, g = new T.Group(), mat0 = (op) => new T.MeshBasicMaterial({ color: o.couleur || (o.mo && o.mo.d.couleurSorts && o.mo.d.couleurSorts[0]) || '#e2413a', transparent: true, opacity: Math.min(0.95, op * (o.fort || 1)), depthWrite: false, side: T.DoubleSide }); /* (fort : une zone plus opaque, la bande verte du Koulosse sur l'herbe, 31/10/2026) */
  const d = o.r ? { x: o.x, z: o.z, r: o.r, a: o.a, ouv: o.ouv } : { x: o.x, z: o.z, x2: o.x2, z2: o.z2, larg: o.larg }; let fond, plein;
  if (o.r) { const a0 = o.ouv != null ? o.a - Math.PI / 2 - o.ouv : 0, da = o.ouv != null ? o.ouv * 2 : Math.PI * 2; /* (l'eventail : l'angle du jeu a devient a - pi/2 dans le disque couche) */
    fond = new T.Mesh(new T.CircleGeometry(o.r, 40, a0, da), mat0(0.3)); plein = new T.Mesh(new T.CircleGeometry(o.r, 40, a0, da), mat0(0.38)); const bord = new T.Mesh(new T.RingGeometry(o.r - 0.16, o.r, 48, 1, a0, da), mat0(0.95)); [fond, plein, bord].forEach((m) => { m.rotation.x = -Math.PI / 2; g.add(m); }); g.position.set(o.x, solA(o.x, o.z) + 0.07, o.z); }
  else { const L = Math.hypot(o.x2 - o.x, o.z2 - o.z) || 0.1; fond = new T.Mesh(new T.PlaneGeometry(o.larg, L), mat0(0.3)); plein = new T.Mesh(new T.PlaneGeometry(o.larg, L), mat0(0.38)); [fond, plein].forEach((m) => { m.geometry.translate(0, -L / 2, 0); m.rotation.x = -Math.PI / 2; g.add(m); });
    if (o.bord) for (const s of [-1, 1]) { const b = new T.Mesh(new T.PlaneGeometry(0.12, L), mat0(0.95 / (o.fort || 1))); b.geometry.translate(s * (o.larg / 2 - 0.06), -L / 2, 0); b.rotation.x = -Math.PI / 2; g.add(b); } /* (bord : deux liseres pleins le long de la bande) */ g.rotation.y = Math.atan2(o.x2 - o.x, o.z2 - o.z); g.position.set(o.x, Math.max(solA(o.x, o.z), solA(o.x2, o.z2)) + 0.07, o.z); }
  g.children.forEach((m) => { m.renderOrder = 2; }); scene.add(g); (c0.dangers = c0.dangers || []).push(d); let t = 0;
  const fin = () => { jeter(g); const i = c0.dangers.indexOf(d); if (i >= 0) c0.dangers.splice(i, 1); return true; };
  effets.push((dt) => {
    t += dt; const k = Math.min(1, t / o.duree); if (o.r) plein.scale.setScalar(Math.max(0.01, k)); else plein.scale.y = Math.max(0.01, k); fond.material.opacity = Math.min(0.9, (0.22 + 0.2 * Math.abs(Math.sin(t * 9))) * (o.fort || 1));
    if (combat !== c0 || c0.fin || (o.mo && o.mo.etat === 'mort')) return fin(); /* (09/11/2026 : seulement s'il est mort ; avant, tout etat autre qu'« actif » l'annulait, et l'Ancestral, « enfoui » pendant sa plongee, ne touchait jamais : ni ses racines au depart, ni ses tetes, « il n'a aucune strategie », Mathieu) */
    if (t >= o.duree) { fin(); o.effet(d); return true; }
  });
  return d;
}
/* LE PALIER DES KOALAKS (14/10/2026) : ce que certains coups font en plus, la fumee du Koulosse, son appel, le Fossoyeur, le bandit */
function ouvrirEntracte() {
  const c = combat; if (!c || !c.entracte || !c.phases.length) return; const pc = Math.round(100 * c.pv / c.pvMax), p = c.phases[0]; S_.pots = S_.pots || {};
  const sansPot = !c.arene; /* (05/11/2026, « la vague du boss en 3 temps tu devrais pas pouvoir prendre de potion entre les 3 etapes », Mathieu : les repas restent) */
  const pots = sansPot ? '' : Object.keys(POTS).filter((t) => (S_.pots[t] || 0) > 0).map((t) => { const P = POTS[t], non = (c.pv >= c.pvMax && !P.menthe && !P.citron && !P.agi) || (P.menthe && c.regen) || (P.citron && c.citron) || (P.agi && c.agi);
    return '<div class="art">' + ico('pot-' + t) + '<div><b>' + P.nom + ' ×' + S_.pots[t] + '</b><div class="puces"><span class="puce bonne">' + BREF_POT[t] + (P.menthe || P.citron || P.agi ? ' (jusqu\'à la fin du combat)' : '') + '</span></div></div><div class="act"><button class="btn kamas" data-entracte-pot="' + t + '"' + (non ? ' disabled' : '') + '>Boire</button></div></div>'; }).join('');
  const actifs = c.repasActifs || {}, jusqua = c.arene ? ' jusqu\'à la fin de la partie' : ' jusqu\'à la fin de la vague'; /* (un repas deja actif ne se reprend pas : il ne se cumule pas avec lui-meme, 20/10/2026) */
  const repas = CULTURES.filter((cu) => cu.mange && ((S_.grange[cu.id] || 0) > 0 || actifs[cu.id])).map((cu) => { const pris = !!actifs[cu.id];
    return '<div class="art">' + ico(cu.id) + '<div><b>' + cu.nom + (pris ? ' : déjà active' : '') + '</b><div class="puces"><span class="puce ' + (pris ? 'bonne' : '') + '">' + cu.mange.txt + jusqua + '</span><span class="puce">' + (S_.grange[cu.id] || 0) + ' en grange</span></div></div><div class="act">' +
      (pris ? '<span class="cadenas">✓ Active</span>' : '<button class="btn mini" data-entracte-manger="' + cu.id + '">Manger</button>') + '</div></div>'; }).join('');
  const choix = c.arene && c.arene.choix, pris = c.arene && c.arene.bonus ? Object.entries(c.arene.bonus) : []; /* (les bonus de l'Arene, toutes les 10 vagues) */
  const bonus = choix ? '<div class="hdv-section">Choisis une carte (une seule, tirée au hasard)</div><div class="bca-rang">' + choix.map((id, i) => carteArene(id, i, c.arene.choixVu)).join('') + '</div>' /* (les cartes, 20/10/2026) */
    : pris.length ? '<p class="hdv-aide">Tes bonus : ' + pris.map(([id, n]) => BONUS_ARENE[id].nom + (n > 1 ? ' ×' + n : '')).join(', ') + '.</p>' : '';
  if (choix) c.arene.choixVu = true; /* (re-dessinee apres un pot : les cartes restent retournees) */
  /* le coffre du boss de l'Arene (toutes les 5 vagues) : ouvert en 3D en haut de l'entracte, une seule fois (05/11/2026) ; redessinee, l'entracte n'en garde qu'une ligne */
  const CF = c.arene && c.arene.coffre, v = '?v=' + VERSION_MODELES;
  const gainsCoffre = CF ? '<div class="gain-coffre"><img src="assets/icones/kama.png' + v + '" alt=""><b>+' + fmt(CF.kamas) + ' kamas</b></div>' + CF.objets.map((cle) => { const o = obj(cle); return o ? '<div class="gain-coffre objet"><img src="assets/icones/' + iconeObjet(cle) + '.png' + v + '" alt=""' + (o.rare ? ' class="rare"' : '') + '><div class="desc"><b>' + o.nom + '</b> <span class="puce neuf">jet ' + Math.round(100 * qualiteJet(cle)) + ' %</span></div></div>' : ''; }).join('') +
      CF.dans.filter((x) => /rune/i.test(x)).map((x) => '<div class="gain-coffre"><img src="assets/icones/' + (/parfaite/i.test(x) ? 'rune-parfaite' : 'rune-forge') + '.png' + v + '" alt=""><b>' + x.replace('★ ', '') + '</b></div>').join('') : '';
  const coffreHtml = !CF ? '' : !CF.vu ? '<div class="ouverture-coffre">' + sceneCoffre() + '<div class="hdv-section">Le coffre du boss</div><div class="gains-coffre">' + gainsCoffre + '</div></div>' : '<p class="hdv-aide">Le coffre du boss : +' + fmt(CF.kamas) + ' kamas' + (CF.dans.length ? ', ' + CF.dans.join(', ') : '') + '.</p>';
  ouvrirModale('entracte', entete(c.arene ? 'Arène : ' + c.arene.tenues + ' vagues tenues, souffle un instant' : 'Vague ' + c.n + ' : souffle un instant') + coffreHtml + '<p class="hdv-aide">Ce temps-là est nettoyé. Le suivant, <b>' + p.nom + '</b>, n\'attend que toi : ' + (choix ? 'choisis ta carte, ' : '') + (sansPot ? 'mange une Cawotte ou une Fraise si tu veux, puis lance-le. Pas de pot entre les temps du boss.' : 'bois un pot, mange une Cawotte ou une Fraise, puis lance-le.') + '</p>' +
    '<div class="vie-alerte' + (pc < 40 ? ' bas' : '') + '"><div><b>Ta vie : ' + pc + ' %</b><div class="pvb"><i style="width:' + pc + '%"></i></div><small>' + Math.ceil(c.pv) + ' / ' + c.pvMax + ' PV' + (c.regen ? '. La Menthe te soigne pendant la vague.' : '') + '</small></div></div>' +
    bonus + (sansPot ? '' : pots ? '<div class="hdv-section">Tes pots</div>' + pots : '<p class="hdv-aide">Tu n\'as plus de pot de gelée.</p>') + (repas ? '<div class="hdv-section">Manger</div>' + repas : '') +
    '<div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn kamas" data-entracte-suite' + (choix ? ' disabled' : '') + '>' + (choix ? 'Choisis d\'abord ta carte' : 'Lancer : ' + p.nom) + '</button></div>');
  if (CF && !CF.vu) { CF.vu = true; jouerCoffre('entracte'); } /* (le coffre du boss s'ouvre, une fois, 05/11/2026) */
}
function boireEntracte(t) {
  const c = combat, P = POTS[t]; S_.pots = S_.pots || {}; if (!c || !c.entracte || !c.arene || !P || !(S_.pots[t] > 0)) return; /* (pas de pot entre les temps d'une vague de boss, 05/11/2026) */
  const avant = c.pv; S_.pots[t]--; c.pv = Math.min(c.pvMax, c.pv + c.pvMax * P.soin); if (c.st) c.st.soins += c.pv - avant; if (P.menthe) c.regen = REGEN_MENTHE; if (P.citron) c.citron = true; if (P.agi) c.agi = P.agi; son('boire'); compter('pots');
  toast('Glou glou : ' + Math.round(100 * avant / c.pvMax) + ' % de vie, puis ' + Math.round(100 * c.pv / c.pvMax) + ' %' + (P.menthe ? ', et la Menthe te soigne jusqu\'à la fin.' : P.citron ? ', et tu cours plus vite jusqu\'à la fin.' : P.agi ? ', et +' + P.agi + ' Agilité jusqu\'à la fin.' : '.'), 'or'); rendreHaut(); sauver(); ouvrirEntracte();
}
function mangerEntracte(id) {
  const c = combat, cu = PAR_ID[id]; if (!c || !c.entracte || !cu || !cu.mange || (c.repasActifs || {})[id] || !((S_.grange[id] || 0) > 0)) return;
  S_.grange[id]--; c.repasEntracte[id] = true; (c.repasActifs = c.repasActifs || {})[id] = true; if (cu.mange.deg) c.boostDeg = (c.boostDeg || 0) + cu.mange.deg; if (cu.mange.recharge) c.boostRecharge = (c.boostRecharge || 0) + cu.mange.recharge; if (cu.mange.pros) c.boostPros = (c.boostPros || 0) + cu.mange.pros;
  son('manger'); toast('Miam ! ' + cu.nom + ' : ' + cu.mange.txt + (c.arene ? ' jusqu\'à la fin de la partie.' : ' jusqu\'à la fin de la vague.'), 'or'); rendreGrange(); sauver(); ouvrirEntracte();
}
function tempsSuivant() {
  const c = combat; if (!c || !c.entracte || !c.phases.length) return; if (c.arene && c.arene.choix) prendreBonusArene(c.arene.choix[0]); /* (le bouton attend le choix ; les bots de test prennent le premier) */
  c.entracte = false; if (modaleOuverte === 'entracte') fermerModale();
  if (c.arene) { appliquerVagueArene(c, c.phases.shift()); return; }
  const p = c.phases.shift(); c.file = p.f; c.total += p.f.length; c.attente = 1.5; c.bords = null; c.horde = false; c.sansHorde = true; /* (06/11/2026 : chaque temps arrive d'un bloc, la horde ne vaut que pour le premier ; sa troupe, pas plus nombreuse, garde sa pleine force) */ son('vague'); toast((c.phases.length ? 'Deuxième temps' : 'Dernier temps') + ' : ' + p.nom + ' arrivent !', 'alerte');
}
function effetsCoup(mo) { /* la Momie ralentit, la pomme de la Reinette assomme, la baie de l'Indigo empoisonne */
  const c = combat; if (!c || c.fin || !mo || c.deroute != null) return; const d = mo.d, p = paysanMesh.position.clone(); p.y += 2.1;
  if (d.ralentit) { if (!c.lenteurVu) { c.lenteurVu = true; toast(leNom(d) + ' te ralentit à chaque coup : éloigne-toi !', 'alerte'); } c.lenteur = d.ralentit; }
  if (d.assomme) { c.assomme = d.assomme; chiffre('Assommé !', p, 'vol'); }
  if (d.poisonFixe) { const P = (c.poisons = c.poisons || []), e = P.find((x) => x.src === mo); if (e) e.t = d.poisonFixe[1]; else P.push({ pct: d.poisonFixe[0] / (c.pvMax || statsPerso().pvMax), t: d.poisonFixe[1], src: mo }); if (!c.poisonFixeVu) { c.poisonFixeVu = true; toast(leNom(d) + ' t\'a mordu : ' + d.poisonFixe[0] + ' dégâts de poison par seconde pendant ' + d.poisonFixe[1] + ' s !', 'alerte'); } } /* (l'Abrakne Sombre, 08/11/2026 : 32 par seconde pendant 4 s, chaque morsure relance les 4 s) */
  if (d.poison) { (c.poisons = c.poisons || []).push({ pct: d.poison[0], t: d.poison[1] }); if (!c.poisonVuB) { c.poisonVuB = true; toast((d.poisonObjet || 'La baie') + ' du ' + d.nom + ' t\'empoisonne quelques secondes !', 'alerte'); } }
}
function poisonPerso(pct, dt) { /* des PV qui fondent, montres en un chiffre vert toutes les 0,6 s */
  const c = combat; if (!c || c.fin || c.deroute != null) return;
  c.poisonAcc = (c.poisonAcc || 0) + c.pvMax * pct * dt; if (paysanMesh && paysanMesh.userData.enVol) return; /* (en l'air : le poison attend l'atterrissage) */ const n = Math.floor(c.poisonAcc); if (n < 1) return;
  c.poisonAcc -= n; c.pv = Math.max(MODE_TEST && ETAT_TEST.immortel ? 1 : 0, c.pv - n); /* (le mode test, « immortel » : le poison non plus ne le fait pas tomber, 10/11/2026) */ if (c.st) c.st.recus += n; c.poisonCumul = (c.poisonCumul || 0) + n;
  if (performance.now() - (c.poisonT || 0) > 600) { const p = paysanMesh.position.clone(); p.y += 1.7; chiffre('-' + c.poisonCumul, p, 'perso'); c.poisonCumul = 0; c.poisonT = performance.now(); }
  if (c.pv <= 0) persoATerre();
}
function majAfflictions(dt) {
  const c = combat; if (!c) return;
  const kE = c.kEntrave != null ? c.kEntrave : (c.kEntrave = 1 / (1 - Math.min(0.6, (caracs().entrave || 0) / 100))); /* (les entraves plus courtes des panoplies du palier 10, 08/11/2026 : -25 %, elles s'usent 1,33 fois plus vite) */
  if (c.lenteur > 0) c.lenteur -= dt * kE; if (c.assomme > 0) c.assomme -= dt * kE; if (c.colle > 0) c.colle -= dt * kE;
  if (c.poisons && c.poisons.length) { c.poisons.forEach((p) => { p.t -= dt; }); c.poisons = c.poisons.filter((p) => p.t > 0); const pct = c.poisons.reduce((a, p) => a + p.pct, 0); if (pct) poisonPerso(pct * (c.kPoison != null ? c.kPoison : (c.kPoison = 1 - Math.min(0.8, (caracs().resPoison || 0) / 100))), dt); } /* (la resistance aux poisons, l'Arakne complete) */
}
function cracherFumee(mo, x, z, r, duree, delai) { /* une boule de fumee part de sa bouche et s'ecrase au sol en nuage (31/10/2026 : plus grosse, elle tourne, laisse une trainee et eclate) */
  const c0 = combat, vers = new T.Vector3(x, solA(x, z) + 0.4, z), gros = mo.d.boss ? 1.6 : 1;
  const boule = new T.Mesh(new T.IcosahedronGeometry(0.4 * gros, 1), new T.MeshToonMaterial({ color: '#9ad86a', gradientMap: grad, transparent: true, opacity: 0.85 })); scene.add(boule); let t = -delai, de = null;
  effets.push((dt) => { t += dt / 0.6; if (combat !== c0 || c0.fin) { jeter(boule); return true; } if (t < 0) { boule.visible = false; return; } boule.visible = true;
    if (!de) { de = new T.Vector3(mo.x + Math.sin(mo.ry) * mo.d.ombre * 0.35, mo.m.position.y + mo.haut * 0.8, mo.z + Math.cos(mo.ry) * mo.d.ombre * 0.35); if (gros > 1) emettre(FX_FUM, 6, { x: de.x, y: de.y, z: de.z, r: 0.3, v: [(x - de.x) * 0.8, 0.5, (z - de.z) * 0.8], dv: 1, vie: [0.4, 0.7], taille: [0.6, 1.6], c: ['#c8f0a0', '#8ac85a'], a: 0.6, frein: 2 }); }
    const k = Math.min(1, t); boule.position.lerpVectors(de, vers, k); boule.position.y += Math.sin(k * Math.PI) * 2.2; boule.rotation.set(k * 6, k * 4, 0); boule.scale.setScalar(1 + 0.15 * Math.sin(k * 20));
    if (gros > 1) emettre(FX_FUM, 1, { x: boule.position.x, y: boule.position.y, z: boule.position.z, r: 0.2, vie: [0.4, 0.7], taille: [0.4, 1.1], c: ['#c8f0a0', '#9ad86a'], a: 0.55, frein: 1, entree: 0.05 });
    if (k >= 1) { jeter(boule); if (mo.etat !== 'actif' && mo.d.boss) return true; const y = solA(x, z); pouf(x, y, z, 2.2 * gros, '#9ad86a'); if (gros > 1 && mo.d.element === 'poison') impactPoison(x, z, r * 1.1); /* (la flaque de poison du gros nuage, 01/11/2026) */ if (gros > 1) { onde(x, y, z, r * 1.6, '#a8de78', 0.45, 0.8, true); emettre(FX_FUM, 14, { x, y: y + 0.4, z, r: r * 0.5, dv: 2.5, haut: true, vie: [0.6, 1], taille: [0.6, 2], c: ['#c8f0a0', '#8ac85a'], a: 0.6, frein: 2, vrot: 1 }); secousse(0.06, 0.15); } const f = poserFumee(x, z, r, duree, null); if (f && mo.d.boss) f.de = mo; return true; } });
}
/* le Koulosse inspire avant de cracher (31/10/2026) : il se cambre, la fumee monte de sa bouche et tourbillonne, puis il se penche en avant en crachant */
function inspireKoulosse(mo, t0) {
  const c0 = combat; let t = 0, f = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || mo.etat !== 'actif') { mo.penche = 0; return true; } const bx = mo.x + Math.sin(mo.ry) * mo.d.ombre * 0.35, by = mo.m.position.y + mo.haut * 0.8, bz = mo.z + Math.cos(mo.ry) * mo.d.ombre * 0.35;
    if (t < t0) { mo.penche = -0.28 * (t / t0); if ((f -= dt) <= 0) { f = 0.04; const a = Math.random() * Math.PI * 2; emettre(FX_FUM, 1, { x: bx + Math.cos(a) * 1.2, y: by + 0.3, z: bz + Math.sin(a) * 1.2, v: [-Math.cos(a) * 2.5, 0.3, -Math.sin(a) * 2.5], vie: [0.35, 0.5], taille: [0.6, 0.15], c: ['#c8f0a0', '#9ad86a'], a: 0.55, frein: 0.5 }); } return false; }
    const u = Math.min(1, (t - t0) / 0.5); mo.penche = -0.28 + 0.68 * Math.sin(u * Math.PI / 2) * (1 - u) + 0.0; if (u >= 1) { mo.penche = 0; return true; } });
}
/* son appel (31/10/2026) : une langue de fumee verte qui file de sa bouche jusqu'au bout de la bande ; si elle t'attrape, elle te ramene a lui */
function langueFumee(mo, x2, z2, prise) {
  const c0 = combat, bx = () => mo.x + Math.sin(mo.ry) * mo.d.ombre * 0.35, by = () => mo.m.position.y + mo.haut * 0.75, bz = () => mo.z + Math.cos(mo.ry) * mo.d.ombre * 0.35, N = 16, B = [];
  const matL = new T.MeshToonMaterial({ color: '#9ad86a', gradientMap: grad, transparent: true, opacity: 0.85 });
  for (let i = 0; i < N; i++) { const b = new T.Mesh(new T.IcosahedronGeometry(0.48 - i * 0.012, 1), matL); scene.add(b); B.push(b); }
  let t = 0; const aller = 0.22, tient = prise ? 0.38 : 0.1, retour = 0.25;
  effets.push((dt) => { t += dt; if (combat !== c0 || mo.etat !== 'actif') { B.forEach((b) => jeter(b)); return true; }
    const p = paysanMesh.position, fx = prise && t > aller ? p.x : x2, fz = prise && t > aller ? p.z : z2, fy = prise && t > aller ? p.y + 1 : solA(x2, z2) + 0.9;
    const ext = t < aller ? t / aller : t < aller + tient ? 1 : Math.max(0, 1 - (t - aller - tient) / retour); mo.penche = prise && t > aller ? -0.3 * Math.min(1, (t - aller) / 0.1) : 0;
    B.forEach((b, i) => { const u = (i + 1) / N * ext, x = bx() + (fx - bx()) * u, z = bz() + (fz - bz()) * u, y = by() + (fy - by()) * u + Math.sin(u * Math.PI) * 0.6 + 0.15 * Math.sin(t * 25 + i); b.position.set(x, y, z); b.visible = ext > 0.02; });
    if (Math.random() < 0.5) { const b = B[Math.floor(Math.random() * N)]; emettre(FX_FUM, 1, { x: b.position.x, y: b.position.y, z: b.position.z, r: 0.2, vie: [0.3, 0.5], taille: [0.4, 0.9], c: ['#c8f0a0', '#8ac85a'], a: 0.5 }); }
    if (t >= aller + tient + retour) { B.forEach((b) => jeter(b)); mo.penche = 0; return true; } });
}
function poserFumee(x, z, r, duree, suit) { /* un nuage vert au sol (duree 0 : il suit le Koulosse jusqu'a la fin) ; il compte comme un danger, que le bot evite */
  const c = combat; if (!c || c.fin) return null; c.fumees = c.fumees || []; if (c.fumees.length >= 30) retirerFumee(c.fumees.find((f) => !f.suit) || c.fumees[0]);
  const g = new T.Group(), matF = new T.MeshToonMaterial({ color: '#a8de78', gradientMap: grad, transparent: true, opacity: 0.66, depthWrite: false });
  const sol = new T.Mesh(new T.CircleGeometry(r, 32), new T.MeshBasicMaterial({ color: '#6cc43c', transparent: true, opacity: 0.34, depthWrite: false, side: T.DoubleSide })); sol.rotation.x = -Math.PI / 2; sol.position.y = 0.06; sol.renderOrder = 2; g.add(sol);
  const bouffees = []; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + Math.random(), d = r * (0.15 + Math.random() * 0.65), m = new T.Mesh(new T.IcosahedronGeometry(0.45 + Math.random() * 0.4, 1), matF); m.position.set(Math.cos(a) * d, 0.4, Math.sin(a) * d); m.userData.p = Math.random() * 6; m.castShadow = false; g.add(m); bouffees.push(m); }
  g.position.set(x, solA(x, z), z); scene.add(g);
  const f = { x, z, r, fin: duree, t: 0, g, bouffees, suit, matF, danger: { x, z, r } }; c.fumees.push(f); (c.dangers = c.dangers || []).push(f.danger); return f;
}
function retirerFumee(f) { if (!f) return; jeter(f.g); const c = combat; if (!c) return; c.fumees = (c.fumees || []).filter((x) => x !== f); const i = (c.dangers || []).indexOf(f.danger); if (i >= 0) c.dangers.splice(i, 1); }
/* la fumee du Koulosse (06/11/2026, « les nuages restent 14 s, et tu perds 3 % de ta vie », Mathieu ; avant 24 s et 4 %) */
const DUREE_FUMEE = 14, POISON_FUMEE = 0.03, CUMULS_FUMEE = 5, PAS_FUMEE = 2; /* (06/11/2026, « le max de stacks que tu prends, cape a 5 en simultane », Mathieu : chaque contact ou seconde dedans ajoute 2 s, jamais plus de 5 cumuls, 10 s de poison) */
const poisonFumeePlus = (c) => { c.poisonFumee = Math.min(CUMULS_FUMEE * PAS_FUMEE, (c.poisonFumee || 0) + PAS_FUMEE); };
function majFumees(dt, s) { /* toucher un nuage : 2 s de poison tout de suite, puis 2 s de plus par seconde passee dedans ; le poison court encore une fois sorti (2 % des PV par seconde) */
  const c = combat; if (!c) return;
  if (c.poisonFumee > 0) { poisonPerso(POISON_FUMEE * (c.genre === 'ile' ? 1 + ENRAGE_ILE.pas * c.arene.pas : 1), Math.min(dt, c.poisonFumee)); if (!combat || combat !== c) return; c.poisonFumee = Math.max(0, c.poisonFumee - dt); } /* (sur l'ile, la rage renforce aussi sa fumee) */
  if (!c.fumees || !c.fumees.length) { c.dansFumee = false; return; }
  const pp = paysanMesh.position; let dedans = false;
  c.fumees.slice().forEach((f) => {
    f.t += dt; if (f.suit) { if (f.suit.etat !== 'actif') { retirerFumee(f); return; } f.x = f.suit.x; f.z = f.suit.z; f.g.position.set(f.x, solA(f.x, f.z), f.z); f.danger.x = f.x; f.danger.z = f.z; }
    if (f.fin && f.t >= f.fin) { retirerFumee(f); return; }
    if (f.de && f.de.etat !== 'actif' && !f.dissipe) f.dissipe = f.fin = f.t + 1.2; /* (son boss est mort : ses nuages se dissipent, 31/10/2026) */
    f.matF.opacity = 0.66 * Math.min(1, f.t / 0.6, f.fin ? Math.max(0, (f.fin - f.t) / 1.2) : 1);
    f.bouffees.forEach((m) => { m.position.y = 0.4 + Math.sin(s * 1.3 + m.userData.p) * 0.14; m.rotation.y += dt * 0.3; });
    if (Math.hypot(pp.x - f.x, pp.z - f.z) < f.r) dedans = true;
  });
  if (dedans) {
    if (!c.dansFumee) { c.dansFumee = true; c.fumeeT = 0; poisonFumeePlus(c); if (!c.poisonFumeeVu) { c.poisonFumeeVu = true; toast('Empoisonné par la fumée : 2 s de poison dès que tu la touches, puis 2 s de plus par seconde passée dedans, ' + CUMULS_FUMEE * PAS_FUMEE + ' s au plus (' + Math.round(POISON_FUMEE * 100) + ' % de tes PV par seconde) !', 'alerte'); } } /* (le premier contact compte pour une seconde) */
    else { c.fumeeT += dt; while (c.fumeeT >= 1) { c.fumeeT -= 1; poisonFumeePlus(c); } }
  } else c.dansFumee = false;
}
function repousserPerso(mo, dist) { /* repousse (l'ecrasement du Dragon Cochon, le brassard de la Gorgouille, 20/10/2026) : le perso glisse loin du monstre */
  const p = paysanMesh.position, a = Math.atan2(p.x - mo.x, p.z - mo.z), f = pointValide(p.x, p.z, p.x + Math.sin(a) * dist, p.z + Math.cos(a) * dist), x0 = p.x, z0 = p.z, c0 = combat; let t = 0;
  chemin = []; arrivee = null; const q = p.clone(); q.y += 2.1; chiffre('Repoussé !', q, 'vol');
  effets.push((dt) => { t += dt / 0.3; if (combat !== c0) return true; const k = Math.min(1, t); paysanMesh.position.x = x0 + (f.x - x0) * k; paysanMesh.position.z = z0 + (f.z - z0) * k; if (k >= 1) { const c = caseIci(f.x, f.z); if (c) paysanMesh.userData.cellule = c; return true; } });
}
function coller(duree, txt, boue) { /* colle sur place (la boue du Dragon Cochon, les menottes du Don Dorgan, 20/10/2026) : il ne marche plus, il frappe encore */
  const c0 = combat; if (!c0 || c0.fin || !paysanMesh) return; c0.colle = Math.max(c0.colle || 0, duree); chemin = []; arrivee = null;
  const q = paysanMesh.position.clone(); q.y += 2.1; chiffre(txt, q, 'vol');
  if (boue && !c0.flaque) { const f = new T.Mesh(new T.CircleGeometry(0.95, 20), new T.MeshBasicMaterial({ color: '#5a3a1e', transparent: true, opacity: 0.85, depthWrite: false })); f.rotation.x = -Math.PI / 2; f.renderOrder = 2; scene.add(f); c0.flaque = f;
    effets.push(() => { if (combat !== c0 || c0.fin || !(c0.colle > 0)) { jeter(f); c0.flaque = null; return true; } const p = paysanMesh.position; f.position.set(p.x, p.y + 0.06, p.z); }); }
}
/* ETOURDI (01/11/2026, « quand tu te fais attirer, peu importe le monstre qui t'attire, tu te prends un stun de 0,5 seconde », puis « faut que ca ecrive
   l'effet aussi, sinon le joueur pourrait ne pas comprendre », Mathieu) : il ne bouge ni ne frappe (assomme), « Étourdi ! » au-dessus de lui, des etoiles
   tournent autour de sa tete ; la premiere fois du combat, un message explique */
function etourdir(duree) {
  const c0 = combat; if (!c0 || c0.fin || !paysanMesh) return; c0.assomme = Math.max(c0.assomme || 0, duree); chemin = []; arrivee = null;
  const q = paysanMesh.position.clone(); q.y += 2.6; chiffre('Étourdi !', q, 'vol'); /* (au-dessus de « Attiré ! », qui le cachait) */
  if (!c0.etourdiVu) { c0.etourdiVu = true; toast('Étourdi : tu ne peux ni bouger ni frapper pendant ' + String(duree).replace('.', ',') + ' s.', 'alerte'); }
  const E = [0, 1, 2].map(() => { const m = new T.Mesh(GEO_ETOILE, new T.MeshBasicMaterial({ color: '#ffd84a', transparent: true, depthWrite: false, side: T.DoubleSide })); m.scale.setScalar(0.55); m.renderOrder = 7; m.raycast = () => {}; scene.add(m); return m; });
  let t = 0; effets.push((dt) => { t += dt; const p = paysanMesh.position;
    if (combat !== c0 || t > duree + 0.1) { jeter(...E); return true; }
    E.forEach((m, i) => { const a = t * 9 + i / 3 * Math.PI * 2; m.position.set(p.x + Math.sin(a) * 0.45, p.y + 2.05 + 0.06 * Math.sin(t * 14 + i), p.z + Math.cos(a) * 0.45); m.lookAt(camera.position); m.material.opacity = Math.min(1, (duree + 0.1 - t) / 0.15); }); return false; });
}
function attirerPerso(mo) { /* l'appel du Koulosse : le perso glisse jusqu'a lui */
  const p = paysanMesh.position, a = Math.atan2(p.x - mo.x, p.z - mo.z), f = pointValide(mo.x, mo.z, mo.x + Math.sin(a) * 2.4, mo.z + Math.cos(a) * 2.4), x0 = p.x, z0 = p.z, c0 = combat; let t = 0;
  chemin = []; arrivee = null; pouf(x0, p.y, z0, 1.4, '#7ad04a'); const q = p.clone(); q.y += 2.1; chiffre('Attiré !', q, 'vol');
  effets.push((dt) => { t += dt / 0.35; if (combat !== c0) return true; const k = Math.min(1, t); paysanMesh.position.x = x0 + (f.x - x0) * k; paysanMesh.position.z = z0 + (f.z - z0) * k; if (k >= 1) { const c = caseIci(f.x, f.z); if (c) paysanMesh.userData.cellule = c; etourdir(mo.d.appelStun || 0.5);
    if (mo.d.appelX && mo.etat === 'actif') { blesserPerso(Math.max(1, Math.round(degSort(mo) * mo.d.appelX)), mo); secousse(0.14, 0.25); pouf(f.x, paysanMesh.position.y, f.z, 2.2, '#7ad04a'); } return true; } }); /* (puis etourdi ; le Koulosse : 1,5 s et un gros coup, 05/11/2026) */
}
function pointPresBat() { /* le Fossoyeur : une case praticable collee a un batiment debout */
  const L = clesBats().filter((k) => !enRuine(k)); if (!L.length) return null;
  const k = hasard(L), t = typeCle(k), cells = t === 'tour' ? S_.cases.filter((c) => c.id === k.slice(5)) : S_.cases.filter((c) => c.type === t);
  const v = cells.flatMap((c) => voisins(c)).filter((c) => PASSABLE[c.type]); if (!v.length) return null; const q = posCase(hasard(v)); return { x: q.x, z: q.z };
}
function volerKamas(mo) { /* le Koalak Farouche a la grange : il prend des kamas, et file */
  const n = Math.min(Math.max(0, Math.floor(S_.kamas)), 250 + 45 * Math.max(0, (combat.n || 60) - 60)); mo.butinK = Math.max(1, n); S_.kamas -= n; rendreHaut();
  mo.m.add(sacVole()); const z = zoneBat('grange'); if (z) chiffre('-' + fmt(n) + ' kamas', new T.Vector3(z.x, z.y + 3, z.z), 'vol');
  toast('Un ' + mo.d.nom + ' a volé ' + fmt(n) + ' kamas dans ta grange : abats-le avant qu\'il s\'enfuie !', 'alerte');
}
function fuiteBandit(mo) { pouf(mo.x, mo.m.position.y, mo.z, 1.6, '#d8c8a8'); mo.etat = 'mort'; mo.t = 0; mo.barre.remove(); if (combat && combat.cible === mo) combat.cible = null; if (mo.butinK > 1) toast('Le ' + mo.d.nom + ' s\'est enfui avec ' + fmt(mo.butinK) + ' kamas.', 'alerte'); mo.butinK = 0; }
function nuageLeg(x, z) { /* l'arme du Koulosse : un nuage de fumee sur ta cible, qui ronge les monstres dedans pendant 4 s */
  const c0 = combat, r = 2.2, g = new T.Group(), matN = new T.MeshToonMaterial({ color: '#dfe8cf', gradientMap: grad, transparent: true, opacity: 0.55, depthWrite: false });
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, m = new T.Mesh(new T.IcosahedronGeometry(0.5 + Math.random() * 0.35, 1), matN); m.position.set(Math.cos(a) * r * 0.5, 0.5 + Math.random() * 0.3, Math.sin(a) * r * 0.5); g.add(m); }
  g.position.set(x, solA(x, z), z); scene.add(g); let t = 0, tic = 0, bulle = 0; onde(x, solA(x, z), z, r + 0.4, '#a6d27a', 0.45, 0.8); /* (23/10/2026 : des bulles vertes montent du nuage, 22b-effets.js) */
  effets.push((dt) => { t += dt; tic += dt; bulle += dt; if (combat !== c0 || c0.fin) { jeter(g); return true; } matN.opacity = 0.55 * Math.min(1, t / 0.3, Math.max(0, (4 - t) / 0.5)); g.rotation.y += dt * 0.4;
    if (bulle >= 0.12 && t < 3.6) { bulle = 0; lueur(new T.Vector3(x + (fxAlea() - 0.5) * r * 1.4, g.position.y + 0.3 + fxAlea() * 0.8, z + (fxAlea() - 0.5) * r * 1.4), fxAlea() < 0.5 ? '#9be36a' : '#d8f5a8', 1.3, 0.7); }
    if (tic >= 0.5) { tic = 0; c0.monstres.forEach((o) => { if (o.etat === 'actif' && Math.hypot(o.x - x, o.z - z) < r) blesser(o, Math.max(1, Math.round(o.pvMax * (o.d.boss ? 0.01 : 0.03) * 0.5))); }); }
    if (t >= 4) { jeter(g); return true; } });
}
function boueLeg(x, z, r, st) { /* le Heaume du Dragon Cochon (20/10/2026) : une flaque de boue la ou tu vises, 2 fois tes degats, les monstres dedans collent 2 s (1 s un boss) */
  const c0 = combat, y = solA(x, z), mat = new T.MeshBasicMaterial({ color: '#6a4524', transparent: true, opacity: 0.75, depthWrite: false }), f = new T.Mesh(new T.CircleGeometry(r, 28), mat);
  f.rotation.x = -Math.PI / 2; f.position.set(x, y + 0.06, z); f.renderOrder = 2; scene.add(f); pouf(x, y, z, r * 1.6, '#6a4524'); pouf(x, y, z, r, '#8e6640');
  secousse(0.14, 0.25); onde(x, y, z, r + 0.6, '#8e6640', 0.4, 0.9); mottes(x, y, z, 12, 1.1); poussiere(x, y, z, 8, r, '#9a7650'); /* (23/10/2026 : la boue gicle, des bulles crevent a la surface, 22b-effets.js) */
  c0.monstres.slice().forEach((o) => { if (o.etat !== 'actif' || Math.hypot(o.x - x, o.z - z) > r) return; blesser(o, Math.round(st.deg * 2), true); if (o.etat === 'actif') o.bloqueT = Math.max(o.bloqueT || 0, o.d.boss ? 1 : 2); });
  let t = 0, bulle = 0; effets.push((dt) => { t += dt; bulle += dt; if (combat !== c0 || c0.fin || t >= 2) { jeter(f); return true; } mat.opacity = 0.75 * Math.min(1, (2 - t) / 0.5);
    if (bulle >= 0.15 && t < 1.6) { bulle = 0; const a = fxAlea() * Math.PI * 2, d = fxAlea() * r * 0.85; lueur(new T.Vector3(x + Math.cos(a) * d, y + 0.12, z + Math.sin(a) * d), '#4a2f18', 1.6, 0.4); } });
}
/* le souffle de Crocabulia : des flammes qui filent en cone devant elle */
function souffleFeu(mo, a) {
  const y = mo.m.position.y + 1.4, L = [];
  for (let i = 0; i < 9; i++) { const e = (Math.random() - 0.5) * 0.9, m = new T.Mesh(new T.IcosahedronGeometry(0.25, 1), new T.MeshBasicMaterial({ color: i % 3 ? '#ff7a1e' : '#ffd04a', transparent: true })); scene.add(m); L.push({ m, a: a + e, v: 6 + Math.random() * 2, t: -i * 0.04 }); }
  effets.push((dt) => { let fini = true; L.forEach((f) => { f.t += dt; if (f.t < 0) { f.m.visible = false; fini = false; return; } const d = f.t * f.v; if (d < 7) fini = false; f.m.visible = d < 7; f.m.position.set(mo.x + Math.sin(f.a) * d, y - d * 0.12, mo.z + Math.cos(f.a) * d); f.m.scale.setScalar(1 + d * 0.35); f.m.material.opacity = Math.max(0, 1 - d / 7); }); if (fini) { L.forEach((f) => jeter(f.m)); return true; } });
}
/* ce qu'un voleur de VSA abattu a sur lui : sa bourse */
function butinVoleur(monte, L) {
  L = L || { res: {}, objets: [], kamas: 0 };
  /* « il faudrait que les mecs de VSA n'aient pas de loot sur eux, a part des kamas » (Mathieu, 12/10/2026) : plus de ressources ni de pieces, leur bourse seulement */
  const bourse = kamasGagnes((3 + 1.2 * forceVoleur()) * (typeof monte === 'number' ? monte : monte ? 2 : 1) * (0.6 + Math.random() * 0.8)); /* (monte : vrai, faux, ou ce qu'il vole : 1, 2, 4 pour le Demenageur) */ S_.kamas += bourse; L.kamas = (L.kamas || 0) + bourse; /* sa bourse */
  rendreGrange(); rendreHaut(); return L;
}
const texteButin = (L) => [L.kamas ? fmt(L.kamas) + ' kamas' : ''].concat(Object.entries(L.res || {}).map(([r, n]) => n + ' ' + PAR_ID[r].nom), (L.objets || []).map((id) => obj(id).nom)).filter(Boolean).join(', ');
const sacVole = () => { const sac = sphere(0.22, '#a8743f', 1); sac.scale.set(1, 1.15, 0.9); sac.position.set(0, 1.25, -0.35); sac.userData.sac = true; return sac; }; /* (marque : le Bond de Newton le fait lacher) */ /* le sac de butin sur son dos */
const DEGATS_MONSTRES = [1.6, 1.4, 1.25, 1, 1, 1], multDegats = (n) => DEGATS_MONSTRES[Math.max(0, palierDe(Math.max(1, n || 1)))] || 1;
/* (06/11/2026, « reduis de 10 % les degats des monstres des vagues 51 a 90 », Mathieu) : les combats de vague seulement (pas l'Arene, ni l'ile des boss) */
const REDUC_HAUTES = 0.9, multHautes = (n, genre) => ((genre || 'vague') === 'vague' && n > 50 && n <= VAGUES_MAX ? REDUC_HAUTES : 1); /* (jusqu'a la 100 depuis le 08/11/2026 : la Foret des Abraknydes comme les autres) */
/* un coup recu de loin (la Peau de Iop, 06/11/2026) : un tir (sans monstre), un monstre qui tire, ou un monstre hors de sa portee de corps a corps quand le coup tombe */
/* un tireur colle par le perso (06/11/2026, « tu ne prends pas de degats quand tu es vraiment a leur corps a corps, une case et demie », Mathieu) : il ne tire plus,
   ses sorts attendent ; les boss et demi-boss gardent les leurs */
const PORTEE_MIN_LOIN = 1.5 * S, tropPresDuTireur = (mo) => !!mo.d.distance && !mo.d.boss && !mo.d.demi && !!paysanMesh && Math.hypot(mo.x - paysanMesh.position.x, mo.z - paysanMesh.position.z) < PORTEE_MIN_LOIN;
const coupDeLoin = (mo) => !mo || !mo.d || !!mo.d.distance || !paysanMesh || Math.hypot(mo.x - paysanMesh.position.x, mo.z - paysanMesh.position.z) > (mo.d.portee || 1.5) * (mo.allonge || 1) + 1.0;
function blesserPerso(n, mo) {
  if (!combat || combat.fin || combat.deroute != null) return; /* (a terre, plus rien ne l'atteint) */
  if (paysanMesh && paysanMesh.userData.enVol) return; /* (en l'air pendant un bond, rien ne l'atteint : « qu'on prenne des degats quand on reatterrit, oui, mais dans les airs qu'on ne puisse pas se faire tuer », Mathieu, 07/11/2026) */
  if (combat.invincible > 0) { if ((blesserPerso.inv || 0) < performance.now()) { blesserPerso.inv = performance.now() + 400; const p = paysanMesh.position.clone(); p.y += 1.7; chiffre('Invincible', p, 'perso'); } return; } /* l'ulti du Iop (18-geliere.js) */
  { const e = Math.min(0.5, 0.1 * nbBonus('esquive')); if (e && Math.random() < e) { const p = paysanMesh.position.clone(); p.y += 1.7; chiffre('Esquive !', p, 'perso'); return; } } /* (le bonus Esquive de l'Arene) */
  if (!combat.raid) n = Math.max(1, Math.round(n * multDegats(combat.n) * multHautes(combat.n, combat.genre)));
  if (combat.mauditJusque && performance.now() < combat.mauditJusque) n = Math.round(n * (combat.mauditX || 1.25)); /* (maudit par l'Ancestral Maudit, 09/11/2026) */
  if (meuteActive()) n = Math.max(1, Math.round(n / (1 + MEUTE))); /* (la Meute : l'Osamodas encaisse mieux tant que son Bouftou est la, 09/11/2026) */
  if (legPorte('chafer')) { n = Math.max(1, Math.round(n * 0.9)); if (mo && mo.etat === 'actif') { const r = Math.max(1, Math.round(n * 0.1)); blesser(mo, r); } } /* Heaume du Chafer Cuirasse : -10 %, et 10 % renvoyes au corps a corps */
  if (combat.carapace > 0) n = Math.max(1, Math.round(n * 0.6)); /* (la Carapace de corail : -40 %) */
  { const ca = caracs(), r = Math.min(50, coupDeLoin(mo) ? ca.resLoin : ca.resCac); if (r > 0) n = Math.max(1, Math.round(n * (1 - r / 100))); } /* les resistances des panoplies completes : Tortue au corps a corps, Kanniboul a distance (06/11/2026) */
  if (classeDe() === 'iop' && coupDeLoin(mo)) { n = Math.max(1, Math.round(n * (1 - PEAU_IOP))); peauDeIop(); } /* Peau de Iop : 15 % de degats en moins sur les coups recus de loin (06/11/2026 ; avant, tous les coups), et un bouclier dore qui s'eclaire (22b-effets.js) */
  if (combat.st) combat.st.recus += Math.min(n, combat.pv); combat.pv = Math.max(0, combat.pv - n); if (MODE_TEST && ETAT_TEST.immortel) combat.pv = Math.max(1, combat.pv); /* (le mode test, « immortel » : les coups s'affichent, il ne tombe jamais) */ const p = paysanMesh.position.clone(); p.y += 1.7; chiffre('-' + n, p, 'perso');
  if (combat.pv <= 0) persoATerre(); /* a terre : les monstres saccagent la ferme avant de repartir */
  return true; /* (le coup a touche : la malediction du Lemurien s'en sert, 01/11/2026) */
}
/* LE TEMPS POUR ESQUIVER les elans des monstres, du signal (rond ou bande rouge) au coup (18/10/2026, « entre 1,5 et 2 secondes », Mathieu) */
const DUREE_COLLE = 1.5; /* colle dans la boue du Dragon Cochon (20/10/2026) */
const COULEUR_CAC = '#25e3ff'; /* (05/11/2026 : la couleur des sorts au corps a corps des boss, bleu electrique, qui ressort sur l'anneau rouge de sa portee) */
const ESQUIVE = { saut: 1.5, charge: 1.5, grandeCharge: 1.7, bond: 2, pluie: 1.4, cawotteRoyale: 0.8, boue: 1.1 /* (1,5 avant le 07/11/2026 : la boue part plus vite) */, brassard: 1.5, bourrasque: 1.1 }, /* (pluie et Cawotte royale du Wa Wabbit : 1,2 et 0,5 s avant le 19/10/2026) */ secondes = (x) => String(x).replace('.', ',') + ' s';
const SAUT_PORTEE = 3 * S, SAUT_VOL = 0.6, SAUT_PREPA = ESQUIVE.saut - SAUT_VOL, AGRIPPE = 1.5; let SAUT_RECHARGE = 6; /* (let : les tests le mettent a Infinity pour comparer sans bond) */
const peutSauter = (mo) => !mo.d.distance && !mo.d.boss && !mo.d.vole && !mo.d.bandit && !mo.d.roule && !mo.d.charge && !mo.d.pique && mo.d.vitesse < 2.5 && (!mo.d.grignote || mo.aggro); /* (les rapides n'en ont pas besoin ; ceux qui chargent ou piquent ont leur elan a eux) */
const ELANS = { bouftou: 'charge', boufcoul: 'charge', craqueleur: 'charge', craqCristal: 'charge', chevaucheurKoalak: 'charge', sanglier: 'charge', sanglierFouisseur: 'charge', dragNoir: 'pique', dragDore: 'pique' }; /* (les sangliers chargent au lieu de sauter, 09/11/2026) */
Object.entries(ELANS).forEach(([t, e]) => { const d = MONSTRES[t]; if (!d || d.charge || d.pique) return; Object.assign(d, e === 'charge' ? { charge: 7 } : { pique: 7 }, { chargeMax: SAUT_PORTEE, degSort: d.degSort || 1.5 }); });
function sauterSurPerso(mo) {
  const x0 = mo.x, z0 = mo.z, pp0 = paysanMesh.position, cx = pp0.x, cz = pp0.z; let f = null, t = 0; /* (il vise la ou tu es quand il se ramasse : le rond rouge s'y pose tout de suite) */
  mo.sautT = 0; mo.bloqueT = SAUT_PREPA + SAUT_VOL; mo.frappe = 0.2; gesteSort(mo, 'bond'); /* (un monstre a squelette : son geste de saut, s'il en a un) */
  zoneDanger({ mo, x: cx, z: cz, r: 1.05, duree: ESQUIVE.saut, effet: (d) => { if (f) pouf(f.x, solA(f.x, f.z), f.z, 1.6, '#c9b28a'); const p2 = paysanMesh.position;
    if (dansDanger(d, p2.x, p2.z) && combat && !combat.fin && mo.etat === 'actif') { blesserPerso(mo.deg, mo); if (!combat || combat.fin) return; /* (le saut l'a acheve : le combat est fini) */ effetsCoup(mo); combat.agrippe = AGRIPPE; if (!combat.agrippeVu) { combat.agrippeVu = true; toast(leNom(mo.d) + ' t\'agrippe : tu marches deux fois moins vite un instant !', 'alerte'); } }
    mo.cd = Math.min(mo.cd, 0.5); } });
  if (!combat.sautVu) { combat.sautVu = true; toast('Attention : à moins de 3 cases, les monstres te sautent dessus. Sors du rond rouge, sinon ils t\'agrippent !', 'alerte'); }
  effets.push((dt2) => { t += dt2; if (!combat || combat.fin || mo.etat !== 'actif') { mo.hop = 0; return true; }
    if (t < SAUT_PREPA) { mo.ry = Math.atan2(cx - mo.x, cz - mo.z); mo.hop = -0.06 * Math.sin(t / SAUT_PREPA * Math.PI); return; } /* il se ramasse, les yeux sur le rond rouge */
    if (!f) { /* l'envol : vers le rond rouge, un peu avant son centre */
      const a = Math.atan2(cx - x0, cz - z0), dP = Math.hypot(cx - x0, cz - z0), L = Math.max(0, dP - mo.d.portee * 0.5);
      f = pointValide(x0, z0, x0 + Math.sin(a) * L, z0 + Math.cos(a) * L); mo.ry = a; }
    const k = Math.min(1, (t - SAUT_PREPA) / SAUT_VOL); mo.x = x0 + (f.x - x0) * k; mo.z = z0 + (f.z - z0) * k; mo.hop = Math.sin(k * Math.PI) * 1.1;
    if (t >= SAUT_PREPA + SAUT_VOL) { mo.hop = 0; return true; } });
}
/* LES CAPACITES DES MONSTRES (refonte du 16/10/2026) : ce que certains monstres font en plus de marcher et de frapper, une fonction chacune, appelees
   dans cet ordre a chaque image par majMonstre (avant : 16 blocs a la suite dans majMonstre). La rage passe d'abord (CAPACITES_AVANT) : la vitesse
   a laquelle les sorts se rechargent (vSort) en depend. Ajouter un sort de boss : une fonction capX ici, son entree dans CAPACITES, et sa cle
   dans la fiche du monstre (MONSTRES). ctx : m (le modele), dt, s, pp (la position du perso), bloque (il prepare un sort ou s'abrite), vSort, sortPret. */
/* le geste joue par un monstre a squelette pour un sort : celui de sa fiche (gestes : { seisme: 'toupie', ... }, 28/10/2026), sinon celui d'usage */
const gesteDe = (mo, cap, def) => (mo.d.gestes && mo.d.gestes[cap]) || def;
/* L'AURA DE RAGE (01/11/2026, par Discord : « retravailler la rage esthetiquement, une aura visiblement autour de leur corps », Mathieu) : deux coques qui epousent
   son corps (gonflees le long des normales, comme le contour : elles suivent ses mouvements et ses animations), une rouge dehors, une orange plus serree, qui
   ondulent vers le haut comme des flammes ; un halo rouge qui bat au sol ; des volutes rouges qui montent. Tous les boss et demi-boss, a squelette ou non */
const AURA_T = { value: 0 };
function matAura(couleur, ep, r, op, additif, peau) {
  const m = new T.MeshBasicMaterial({ color: couleur, transparent: true, opacity: op, depthWrite: false, side: T.BackSide, blending: additif ? T.AdditiveBlending : T.NormalBlending, skinning: peau });
  m.onBeforeCompile = (sh) => { sh.uniforms.uT = AURA_T; sh.uniforms.uEp = { value: ep }; sh.uniforms.uR = { value: r };
    sh.vertexShader = 'uniform float uT; uniform float uEp; uniform float uR;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  float hA = position.y / uR;\n  float fA = 0.7 + 0.35 * sin(uT * 8.0 - hA * 7.0) + 0.18 * sin(uT * 21.0 + position.x / uR * 9.0) + 0.25 * max(0.0, hA);\n  transformed += normalize(normal) * uEp * fA;'); }; /* (plus haut, plus gonfle, et ca monte : des flammes ; normal et pas objectNormal : la matiere de base ne le definit qu'avec un squelette, le shader ne compilait pas) */
  m.customProgramCacheKey = () => 'aura-rage-' + (additif ? 'a' : 'n') + (peau ? 's' : ''); return m;
}
/* l'aura de son element (« il faudrait que l'aura soit adaptee a l'element du monstre », Mathieu, le meme jour) : ses couleurs (dehors, dedans, halo) et ce qui
   monte de lui ; sans element (Moon), le rouge de la rage */
const AURAS = {
  feu: { ext: '#ff2a10', int: '#ffb02e', halo: '#ff3a1e', c: ['#ffb02e', '#ff3a1e', '#7a1408'], v: 2.6, t: 0.22 },
  terre: { ext: '#5a3818', int: '#d8a050', halo: '#8a5a2a', op: 0.55, /* (plus fonce et plus opaque : sur la laine blanche du Royal, elle ne se voyait pas) */ c: ['#c9a06a', '#8a6a46', '#5a4028'], v: 1.4, t: 0.16, grav: -1, fum: ['#b89a72', '#9a8262'] },
  eau: { ext: '#1e78d8', int: '#a8e4ff', halo: '#3a9be0', c: ['#ffffff', '#8fd8ff', '#3a9be0'], v: 2.4, t: 0.14, grav: 3 },
  poison: { ext: '#3f9a1e', int: '#c8f58a', halo: '#5fbf2a', c: ['#d8ff9a', '#7ad04a', '#3f6a1e'], v: 1.2, t: 0.2, fum: ['#9fd060', '#5f9a2e'] },
  magie: { ext: '#7a3fd8', int: '#e0c4ff', halo: '#9a5af0', c: ['#ffffff', '#d0a8ff', '#7a3fd8'], v: 1.8, t: 0.14, lum: true },
  vent: { ext: '#7fb8d0', int: '#ffffff', halo: '#a8d8ec', c: ['#ffffff', '#cfe7f2', '#8fb8cc'], v: 0.8, t: 0.14, tourne: 4 },
  lune: { ext: '#6fa8ff', int: '#eef8ff', halo: '#9fc8ff', c: ['#ffffff', '#bfe6ff', '#6f9ae0'], v: 1.0, t: 0.12, lum: true },
  feuille: { ext: '#3f9a2a', int: '#d8ff9a', halo: '#5fb83a', c: ['#e8ffb0', '#8fd050', '#3f7a1e'], v: 1.2, t: 0.16, lum: true }, /* (01/11/2026) */
  fumee: { ext: '#5a5550', int: '#c8c2b8', halo: '#7a746c', c: ['#d8d2c8', '#8a847c', '#4a4540'], v: 1.0, t: 0.18, fum: ['#8a847c', '#5a5550'] },
  esprit: { ext: '#2fc890', int: '#d8fff0', halo: '#3fd8a0', c: ['#e8fff4', '#7ff0c8', '#2f9a78'], v: 1.3, t: 0.15, lum: true, fum: ['#9ff0d0', '#3f8a70'] }, /* (le mort-vivant, 01/11/2026) */
};
function auraRageCorps(mo) {
  if (mo.aura || !mo.m) return; const L = [], c0 = combat, St = AURAS[mo.d.element] || AURAS.feu, w = new T.Vector3(), H = mo.haut || 3;
  mo.m.updateMatrixWorld(true); mo.m.traverse((o) => { if (o.isMesh && o.material && o.material.isMeshToonMaterial && o.geometry && !(o.userData && o.userData.ep != null) && o.name !== 'contour') L.push(o); });
  const A = []; L.forEach((o) => { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); let ep, uR;
    if (o.isSkinnedMesh) { const r = o.geometry.boundingSphere.radius || 1; ep = r * 0.045; uR = r; } /* (un corps a squelette : son rayon, dans ses unites) */
    else { o.getWorldScale(w); const s = Math.max(1e-4, Math.abs(w.y)); ep = H * 0.045 / s; uR = H / s; } /* (des pieces : la meme epaisseur pour toutes, a la taille du monstre) */
    [[St.ext, 1.0, St.op || 0.32, false], [St.int, 0.45, 0.45, true]].forEach(([coul, e, op, add]) => { const mt = matAura(coul, ep * e, uR, op, add, !!o.isSkinnedMesh); let k;
      if (o.isSkinnedMesh) { k = new T.SkinnedMesh(o.geometry, mt); k.bind(o.skeleton, o.bindMatrix); o.parent.add(k); } else { k = new T.Mesh(o.geometry, mt); o.add(k); }
      k.frustumCulled = false; k.raycast = () => {}; k.renderOrder = 5; A.push(k); }); });
  mo.aura = A;
  const halo = new T.Mesh(new T.RingGeometry(0.55, 1, 40), new T.MeshBasicMaterial({ color: St.halo, transparent: true, opacity: 0.5, depthWrite: false, side: T.DoubleSide })); halo.rotation.x = -Math.PI / 2; halo.renderOrder = 3; halo.raycast = () => {}; scene.add(halo);
  const R = (mo.d.ombre || 2) * 0.75; let tic = 0, ang = 0;
  effets.push((dt) => { const fin = combat !== c0 || mo.etat !== 'actif'; if (fin) { A.forEach((k) => { if (k.parent) k.parent.remove(k); k.material.dispose(); }); jeter(halo); mo.aura = null; return true; }
    AURA_T.value = performance.now() / 1000; const b = 0.5 + 0.5 * Math.sin(AURA_T.value * 5);
    halo.position.set(mo.x, solA(mo.x, mo.z) + 0.05, mo.z); halo.scale.setScalar(R * (1 + 0.12 * b)); halo.material.opacity = 0.35 + 0.25 * b; /* (le halo bat au sol) */
    ang += dt * (St.tourne || 0);
    if ((tic += dt) > 0.07) { tic = 0; const a = Math.random() * Math.PI * 2 + ang, rr = R * (0.5 + 0.4 * Math.random()), y = mo.m.position.y, x = mo.x + Math.cos(a) * rr, z = mo.z + Math.sin(a) * rr, vt = St.tourne ? St.tourne * rr : 0;
      emettre(St.lum ? FX_LUM : FX_VIF, 1, { x, y: y + 0.2 + Math.random() * H * 0.5, z, v: [-Math.sin(a) * vt, St.v, Math.cos(a) * vt], dv: 0.4, vie: [0.5, 0.8], taille: [St.t, 0.03], c: St.c, frein: 0.5, grav: St.grav || 0 }); /* (ce qui monte de lui, a son element) */
      if (St.fum && Math.random() < 0.35) emettre(FX_FUM, 1, { x, y: y + 0.3, z, v: [0, St.v * 0.6, 0], vie: [0.7, 1.1], taille: [0.5, 1.2], c: St.fum, a: 0.45 }); }
    return false; });
}
function capRage(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.rage && !mo.enrage && !(mo.d.affaibli && m0Anim(mo) && !mo.faibleFini) && mo.pv < mo.pvMax * (combat.difficile ? DUR.rage : 0.3)) { /* (Moon : sa rage vient apres ses Gorilles, finFaible) */ mo.enrage = true; pouf(mo.x, mo.m.position.y, mo.z, 3, '#e2413a'); if (mo.d.boss) auraRageCorps(mo); /* (l'aura de rage, 01/11/2026) */
    if (mo.d.calumet) { mo.deg = Math.round(mo.deg * 1.25); if (mo.deg0 != null) mo.deg0 = Math.round(mo.deg0 * 1.25); /* (sur l'ile, la rage repart de deg0 : le calumet y reste) */ poserFumee(mo.x, mo.z, 2.8, 0, mo); toast('Le Koulosse tire sur son calumet de la paix : il s\'entoure de fumée, frappe plus fort et bien plus vite. Ne reste pas collé à lui !', 'alerte'); }
    else toast(leNom(mo.d) + ' entre en rage : ' + (mo.d.fem ? 'elle' : 'il') + ' frappe bien plus vite !', 'alerte'); }
}
function capProtege(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.protege) { /* le Craqueleur de Cristal : un bouclier de cristal sur trois monstres autour de lui (-40 % de degats, 4 s) */
    mo.protT = (mo.protT || 0) + dt;
    if (mo.protT >= mo.d.protege) { mo.protT = 0; combat.monstres.filter((o) => o !== mo && o.etat === 'actif' && Math.hypot(o.x - mo.x, o.z - mo.z) < 7).sort((a, c) => a.pv / a.pvMax - c.pv / c.pvMax).slice(0, 3).forEach((o) => { o.bouclier = 4; o.bouclierC = mo.d.protegeCouleur || null; pouf(o.x, o.m.position.y, o.z, 1.4, mo.d.protegeCouleur || '#6fe0e8'); }); }
  }
}
function capGalvanise(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.galvanise) { /* le Dragoeuf Dore : la horde autour de lui frappe et court plus vite pendant 4 s */
    mo.galvT = (mo.galvT || 0) + dt;
    if (mo.galvT >= mo.d.galvanise) { const A = combat.monstres.filter((o) => o !== mo && o.etat === 'actif' && Math.hypot(o.x - mo.x, o.z - mo.z) < 7);
      if (mo.d.galvaCouleurs && !A.length) { mo.galvT = mo.d.galvanise - 1; return; } /* (la Tortue Corail : seulement si une alliee est a cote, sinon elle reessaie 1 s plus tard, 30/10/2026) */
      mo.galvT = 0; gesteSort(mo, gesteDe(mo, 'galvanise', 'sort'));
      if (mo.d.galvaCouleurs) galvaniser(mo, A, mo.d.galvaCouleurs); /* (« on a l'impression que c'est un sort d'attaque », Mathieu, 30/10/2026 : plus d'onde, un sort de soutien, 22b-effets.js) */
      else { if (mo.d.tambour) { onde(mo.x, mo.m.position.y, mo.z, 7, '#f2b630', 0.55, 0.8); onde(mo.x, mo.m.position.y, mo.z, 4.5, '#ffe9a8', 0.4, 0.6); } pouf(mo.x, mo.m.position.y, mo.z, 5, '#f2b630'); }
      A.forEach((o) => { o.galva = 4; o.galvaC = mo.d.galvaCouleurs ? mo.d.galvaCouleurs[0] : null; }); if (mo.d.galvaCouleurs && !combat.galvaVu) { combat.galvaVu = true; toast(leNom(mo.d) + ' galvanise ses alliés autour d\'' + (mo.d.fem ? 'elle' : 'lui') + ' : ils frappent et courent plus vite 4 s. Éloigne-les d\'' + (mo.d.fem ? 'elle' : 'lui') + ' !', 'alerte'); } }
  }
}
function capGeyser(mo, ctx) { /* le geyser de la Tortue Corail (30/10/2026, « elle lance des sorts de loin ») : un cercle bleu sous le perso, 1,4 s pour en sortir, puis l'eau jaillit
     (le soir : « fais une animation de geyser sous mes pieds, au niveau du cercle », Mathieu : l'eau bouillonne dans le cercle, puis une colonne en jaillit, geyserEau, 22b-effets.js) */
  const { pp, sortPret } = ctx;
  if (!mo.d.geyser) return; const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
  if (!sortPret('geyserT', mo.d.geyser) || dP > 16) return;
  mo.geyserT = 0; const x0 = pp.x, z0 = pp.z, R = 2.2, duree = 1.4; mo.ry = Math.atan2(x0 - mo.x, z0 - mo.z); mo.bloqueT = 1.0; gesteSort(mo, gesteDe(mo, 'geyser', 'tir'), 0.8);
  if (!combat.geyserVu) { combat.geyserVu = true; toast(leNom(mo.d) + ' fait jaillir un geyser sous tes pieds : sors du cercle bleu !', 'alerte'); }
  lancerGeyser(mo, x0, z0, R, duree);
}
function lancerGeyser(mo, x0, z0, R, duree, petit) { /* un geyser : le cercle bleu, l'eau qui bouillonne de plus en plus fort, puis le jet (petit : ceux de sa rage, moitie moins de gouttes) */
  const C = mo.d.couleurSorts, c0 = combat, y0 = solA(x0, z0), q = petit ? 0.5 : 1; let tb = 0, nb = 0;
  effets.push((dt) => { tb += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif' || tb >= duree) return true; nb += dt * (25 + 110 * tb / duree) * q;
    const n = Math.floor(nb); nb -= n; if (n) emettre(FX_VIF, n, { x: x0, y: y0 + 0.05, z: z0, r: R * 0.85, plat: true, v: [0, 1.3 + 2.4 * tb / duree, 0], dv: 0.6, vie: [0.25, 0.5], taille: [0.24, 0.07], c: ['#ffffff', C[1], C[0]], a: 0.9, grav: 4 }); });
  zoneDanger({ mo, x: x0, z: z0, r: R, duree, effet: (d) => { const y = solA(x0, z0);
    geyserEau(x0, y, z0, R, C, petit); if (!petit) secousse(0.12, 0.3); if (!petit && mo.d.element === 'eau') impactEau(x0, z0, R); /* (l'eau couvre le cercle, 01/11/2026) */
    const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) blesserPerso(Math.round(degSort(mo) * ((mo.d.sortsX || {}).geyser || 1)), mo); } });
}
/* SA RAGE (30/10/2026, « sous 30 % de sa vie elle envoie des geysers partout sur la map, a differents endroits, qu'il faut esquiver assez souvent ; ca nous
   cible pas forcement mais ca peut nous toucher ; genre 6 qui spawnent a des endroits aleatoires toutes les 5 s », Mathieu) : enragee, toutes les 5 s,
   6 geysers un peu plus petits (rayon 1,8 au lieu de 2,2) tombent au hasard sur le terrain (toute l'Arene ; ailleurs, a 10 autour du perso), ecartes
   d'au moins deux rayons ; meme annonce (cercle bleu, l'eau bouillonne 1,4 s), memes degats que son geyser. Elle leve son baton si elle n'est pas occupee */
function pointsGeysers(n, R, ecart) {
  const arene = lieu === 'arene', pp = paysanMesh.position, cx = arene ? ARENE.x : pp.x, cz = arene ? ARENE.z : pp.z, Rm = arene ? R_ARENE - 0.5 - R : 10, L = [];
  for (let k = 0; k < 90 && L.length < n; k++) { const a = Math.random() * Math.PI * 2, r = Rm * Math.sqrt(Math.random()), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    if (solSort(x, z) && L.every((p) => Math.hypot(p.x - x, p.z - z) >= (k < 60 ? ecart : ecart * 0.6))) L.push({ x, z }); } /* (s'il n'y a plus la place, un peu plus serres) */
  return L;
}
function capGeyserRage(mo, ctx) {
  const G = mo.d.geyserRage; if (!G || !mo.enrage) return;
  mo.geyRT = (mo.geyRT == null ? G.periode - 1 : mo.geyRT) + ctx.vSort; /* (le premier 1 s apres l'entree en rage) */
  if (mo.geyRT < G.periode || combat.deroute != null) return; mo.geyRT = 0;
  if (!combat.geyRageVu) { combat.geyRageVu = true; toast(leNom(mo.d) + (mo.d.fem ? ' enragée' : ' enragé') + ' fait jaillir des geysers partout toutes les ' + G.periode + ' s : surveille les cercles bleus et sors-en !', 'alerte'); }
  if (!(mo.bloqueT > 0)) { mo.bloqueT = 0.9; gesteSort(mo, gesteDe(mo, 'invoque', 'sort'), 1.4); }
  pointsGeysers(G.n, G.r, G.r * 2).forEach((p) => lancerGeyser(mo, p.x, p.z, G.r, 1.4, true));
}
/* L'APPEL DES RENFORTS (01/11/2026, dans la liste de Mathieu : « un geste quand ils appellent des renforts » ; avant, ses soldats sortaient de terre
   sans qu'il bouge) : il se dresse, la tete levee, et pousse un cri (trois ondes a sa couleur partent de sa tete, l'ecran tremble) ; au sol, deux cercles
   d'invocation a sa couleur s'ouvrent la ou vont sortir ses soldats ; il s'abat, et ils jaillissent de terre. Un monstre a squelette rugit (son animation) */
function criAppel(mo, C) {
  const y = mo.m.position.y + (mo.haut || 3) * 0.85, s0 = (mo.haut || 3) / 3;
  for (let i = 0; i < 3; i++) { const m = new T.Mesh(new T.RingGeometry(0.82, 1, 40), new T.MeshBasicMaterial({ color: C, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide })); m.renderOrder = 6; m.raycast = () => {}; m.position.set(mo.x, y, mo.z); scene.add(m); let t = -i * 0.14;
    effets.push((dt) => { t += dt; if (t < 0) return false; const k = t / 0.6; m.lookAt(camera.position); m.scale.setScalar(s0 * (0.4 + 2.4 * k)); m.material.opacity = 0.85 * (1 - k); if (k >= 1) { jeter(m); return true; } }); }
}
function gesteAppel(mo, points, apres) {
  const St = AURAS[mo.d.element], C = St ? [St.ext, St.int, St.halo] : ['#e0b050', '#fff1c0', '#a07020'], c0 = combat, sq = mo.m.userData.anim, neutre = () => { mo.penche = 0; mo.dresse = 0; mo.hop = 0; mo.teteB = 0; }; let t = 0, cri = false, choc = false;
  mo.bloqueT = Math.max(mo.bloqueT || 0, 1.3); if (sq) gesteSort(mo, gesteDe(mo, 'appel', 'rugir'), 0.6);
  points.forEach((p, i) => { let tw = 0; effets.push((dt) => { tw += dt; if (combat !== c0 || mo.etat !== 'actif') return true; if (tw < 0.15 + i * 0.1) return false; cercleInvocation(p.x, solA(p.x, p.z), p.z, C); return true; }); });
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') { if (!sq) neutre(); return true; }
    if (!sq) { if (t < 0.55) { const u = Math.sin(Math.min(1, t / 0.55) * Math.PI / 2); mo.penche = -0.3 * u; mo.dresse = 0.1 * u; mo.hop = 0.3 * u; mo.teteB = -0.45 * u; } /* (il se dresse, la tete levee) */
      else if (t < 0.72) { const u = (t - 0.55) / 0.17; mo.penche = -0.3 + 0.62 * u; mo.dresse = 0.1 * (1 - u); mo.hop = 0.3 * (1 - u) - 0.15 * u; mo.teteB = -0.45 + 0.6 * u; } /* (il s'abat) */
      else { const u = Math.min(1, (t - 0.72) / 0.45); mo.penche = 0.32 * (1 - u); mo.dresse = 0; mo.hop = -0.15 * (1 - u); mo.teteB = 0.15 * (1 - u); } }
    if (!cri && t > 0.3) { cri = true; criAppel(mo, C[0]); secousse(0.08, 0.45); }
    if (!choc && t > 0.72) { choc = true; const y = mo.m.position.y; poussiere(mo.x, y, mo.z, 14, (mo.d.ombre || 2) * 0.8, '#d8c6a0'); onde(mo.x, y, mo.z, (mo.d.ombre || 2) * 1.6, C[0], 0.4, 0.7, true);
      points.forEach((p) => { const y2 = solA(p.x, p.z); mottes(p.x, y2, p.z, 8, 1.2); poussiere(p.x, y2, p.z, 10, 1.1, '#d8c6a0'); }); apres(); } /* (ils jaillissent de terre) */
    if (t > 1.2) { if (!sq) neutre(); return true; } return false; });
}
function capTroupe(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.boss) { /* sa troupe : il la rappelle toutes les 16 s (deux monstres, s'il n'en a pas deja 6 debout), et elle le protege tant qu'elle est pres de lui */
    if (mo.renfortT == null) mo.renfortT = 4; /* (le premier rappel 12 s apres son arrivee) */
    if (mo.d.renforts && sortPret('renfortT', combat.difficile ? DUR.rappel : (mo.rappel || RAPPEL_TROUPE))) {
      mo.renfortT = 0;
      if (combat.monstres.filter((o) => o !== mo && o.etat !== 'mort' && !o.d.boss).length < (combat.difficile ? DUR.troupe : TROUPE_MAX)) {
        const rf = (mo.enrage && mo.d.renfortsRage) || mo.d.renforts; /* (le Chafer Cuirasse enrage appelle des Archers) */
        if (!combat.rappelVu) { combat.rappelVu = true; toast(leNom(mo.d) + ' appelle deux ' + rf[1] + ' : ' + (mo.d.fem ? 'elle' : 'il') + ' en rappellera toutes les ' + RAPPEL_TROUPE + ' s tant qu\'' + (mo.d.fem ? 'elle' : 'il') + ' sera debout !', 'alerte'); }
        else if (rf !== mo.d.renforts && !combat.rappelRageVu) { combat.rappelRageVu = true; toast(leNom(mo.d) + ' enragé appelle maintenant des ' + rf[1] + ' : ils tirent de loin !', 'alerte'); }
        else chiffre('Renforts !', new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.4, mo.z), 'butin');
        const r = Math.max(1.8, (mo.d.ombre || 2) * 0.85), c0 = combat, P = [0, 1].map((k) => { const a = k * 2.6 + 0.4 + Math.random(); return pointValide(mo.x, mo.z, mo.x + Math.cos(a) * r, mo.z + Math.sin(a) * r); }); /* (a l'ecart de son corps, meme chez les grands) */
        gesteAppel(mo, P, () => { if (combat !== c0 || c0.fin) return; P.forEach((p) => { apparaitre(rf[0], { x: p.x, z: p.z }); combat.total++; }); });
      }
    }
    const pr = protectionBoss(mo); if (pr > 0 && !(mo.protege > 0) && !combat.protegeVu) { combat.protegeVu = true; toast('Sa troupe protège ' + leNom(mo.d, true) + ' : chaque monstre près ' + (mo.d.fem ? 'd\'elle' : 'de lui') + ' lui retire 12 % de tes dégâts. Dégage-les, puis frappe le boss !', 'alerte'); }
    mo.protege = pr;
    if (!mo.halo) { mo.halo = new T.Mesh(new T.RingGeometry(0.55, 0.72, 40), new T.MeshBasicMaterial({ color: '#f2d27a', transparent: true, opacity: 0.8, side: T.DoubleSide, depthWrite: false })); mo.halo.rotation.x = -Math.PI / 2; mo.halo.position.y = 0.08; mo.halo.scale.setScalar(Math.max(1, mo.d.ombre * 0.8)); m.add(mo.halo); }
    mo.halo.visible = pr > 0; if (pr > 0) mo.halo.material.opacity = 0.35 + pr; /* le halo dore : plus il est vif, plus il est protege */
  }
}
/* LA CHARGE D'UN BOSS (31/10/2026, par Discord, « refais le Bouftou Royal, pour voir », Mathieu ; avant, la bande s'affichait et il glissait jusqu'a toi
   avec un peu de poussiere). Pendant l'annonce : il recule d'un pas, baisse la tete (mo.penche, applique dans majMonstre), gratte le sol d'un sabot
   (mottes et poussiere derriere lui, un petit sursaut), souffle par les naseaux. Pendant la ruee : penche en avant, un sillage de poussiere et des mottes.
   Il te percute : un choc (etoile, onde, secousse, tu es bouscule). Au bout : il se redresse, sonne s'il s'est ecrase sur un batiment */
function prepaCharge(mo, a, prepa) {
  const c0 = combat, dx = Math.sin(a), dz = Math.cos(a), x0 = mo.x, z0 = mo.z, R = mo.d.ombre * 0.5; let t = 0, gratte = 0.2, souffle = 0.35;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') { mo.penche = 0; mo.hop = 0; return true; } const k = Math.min(1, t / prepa);
    if (t < 0.3) { const r = 0.45 * Math.sin(t / 0.3 * Math.PI / 2); mo.x = x0 - dx * r; mo.z = z0 - dz * r; } /* (il recule d'un pas) */
    mo.penche = 0.3 * Math.min(1, t / 0.4); mo.ry = a;
    if ((gratte -= dt) <= 0 && k < 0.92) { gratte = 0.38; const bx = mo.x - dx * R, bz = mo.z - dz * R, y = solA(bx, bz); mo.hop = 0.12; poussiere(bx, y, bz, 6, 0.7, '#d8c6a0'); mottes(bx, y, bz, 4, 0.7); } else mo.hop = Math.max(0, (mo.hop || 0) - dt * 0.8);
    if ((souffle -= dt) <= 0) { souffle = 0.45; const nx = mo.x + dx * R * 1.15, nz = mo.z + dz * R * 1.15, y = mo.m.position.y + (mo.haut || 2) * 0.35;
      for (const s of [-1, 1]) emettre(FX_FUM, 2, { x: nx - dz * 0.25 * s, y, z: nz + dx * 0.25 * s, v: [dx * 1.2 - dz * 0.5 * s, -0.2, dz * 1.2 + dx * 0.5 * s], dv: 0.3, vie: [0.4, 0.6], taille: [0.25, 0.7], c: ['#ffffff', '#e8e2d6'], a: 0.7, frein: 2, entree: 0.05 }); }
    if (k >= 1) { mo.hop = 0; return true; } });
}
/* LE SILLON DE LA CHARGE (01/11/2026 ; deuxieme version, par Discord : « pas top, la trainee du Bouftou », Mathieu : des rectangles poses l'un apres l'autre) : une
   seule bande de terre retournee qui suit exactement son chemin et s'allonge pendant qu'il fonce ; bords irreguliers, deux rainures creusees par ses sabots, des
   mottes le long des bords ; elle s'efface en douceur apres la charge */
let TEX_SILLON = null; /* (cree au premier sillon : texCanvas vient de 22b-effets.js, charge apres ce fichier ; au chargement, il cassait toute la suite du fichier) */
const texSillon = () => TEX_SILLON || (TEX_SILLON = (() => { const t = texCanvas(128, (g, n) => { /* de la terre retournee, raccord haut et bas (elle se repete le long du sillon) */
  const im = g.createImageData(n, n), D = im.data;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const u = x / n, bord = 0.5 - Math.abs(u - 0.5), b = 0.07 * Math.sin(y / n * Math.PI * 6 + 1) + 0.05 * Math.sin(y / n * Math.PI * 14), a = Math.max(0, Math.min(1, (bord - 0.06 - b) / 0.08));
    const rainure = Math.exp(-(((u - 0.33) / 0.05) ** 2)) + Math.exp(-(((u - 0.67) / 0.05) ** 2)), mot = 0.5 + 0.5 * Math.sin(x * 0.9 + Math.sin(y * 0.7) * 2) * Math.sin(y * 0.8 + Math.sin(x * 0.5) * 2), i = (y * n + x) * 4;
    const v = 0.78 + 0.32 * mot - 0.4 * rainure; D[i] = 118 * v; D[i + 1] = 84 * v; D[i + 2] = 52 * v; D[i + 3] = 255 * a * 0.9; }
  g.putImageData(im, 0, 0); }); t.wrapT = T.RepeatWrapping; return t; })());
function sillonCharge(mo, larg) { /* cree le sillon d'une charge ; renvoie { ajouter(x, z), finir() } */
  const P = [], mt = new T.MeshBasicMaterial({ map: texSillon(), transparent: true, depthWrite: false, opacity: 1, side: T.DoubleSide }), m = new T.Mesh(new T.BufferGeometry(), mt), c0 = combat; m.renderOrder = 2; m.raycast = () => {}; scene.add(m); let fini = false, long = 0;
  effets.push(() => { if (combat !== c0 || c0.fin) { jeter(m); fini = true; return true; } return fini; }); /* (fin du combat avant la fin de la charge : on le retire) */
  const refaire = () => { if (P.length < 2) return; const pos = [], uv = [], idx = [];
    P.forEach((p, k) => { const a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L, w = larg * p.w * (k === 0 ? 0.4 : 1);
      pos.push(p.x + nx * w, p.y, p.z + nz * w, p.x - nx * w, p.y, p.z - nz * w); uv.push(0, p.l / 1.4, 1, p.l / 1.4); if (k) { const q = (k - 1) * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } });
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); m.geometry.dispose(); m.geometry = g; };
  return {
    ajouter(x, z) { if (fini) return; const d = P.length ? Math.hypot(x - P[P.length - 1].x, z - P[P.length - 1].z) : 0; if (P.length && d < 0.18) return; long += d;
      P.push({ x, z, y: solA(x, z) + 0.035, l: long, w: 0.85 + 0.3 * fxAlea() }); refaire();
      if (fxAlea() < 0.55) { const s = fxAlea() < 0.5 ? -1 : 1, b = P[Math.max(0, P.length - 2)], dx = x - b.x, dz = z - b.z, L = Math.hypot(dx, dz) || 1; mottes(x - dz / L * larg * 1.05 * s, solA(x, z), z + dx / L * larg * 1.05 * s, 1, 0.5); } }, /* (des mottes rejetees sur les bords) */
    finir() { if (fini) return; fini = true; let t = 0; effets.push((dt) => { t += dt; if (combat !== c0 || t >= 3.5) { jeter(m); return true; } mt.opacity = t < 2.2 ? 1 : 1 - (t - 2.2) / 1.3; }); } };
}
function sillageCharge(mo, a, dt) {
  const dx = Math.sin(a), dz = Math.cos(a), R = mo.d.ombre * 0.5, y = solA(mo.x, mo.z); mo.penche = 0.38;
  if (mo.d.boss) { if (!mo.sillon) mo.sillon = sillonCharge(mo, R * 0.85); mo.sillon.ajouter(mo.x - dx * R * 0.2, mo.z - dz * R * 0.2); } /* (la charge laboure le sol derriere lui, un seul sillon continu, 01/11/2026) */
  emettre(FX_FUM, 3, { x: mo.x - dx * R, y: y + 0.2, z: mo.z - dz * R, r: R * 0.6, v: [-dx * 2.5, 1.2, -dz * 2.5], dv: 0.8, vie: [0.5, 0.9], taille: [0.7, 2], c: ['#e6d6b4', '#cbb68c'], a: 0.55, frein: 2, vrot: 1, entree: 0.08 });
  if (Math.random() < dt * 14) mottes(mo.x - dx * R, y, mo.z - dz * R, 2, 0.9);
  if (Math.random() < dt * 20) for (const s of [-1, 1]) emettre(FX_VIF, 1, { x: mo.x + dz * R * 0.9 * s, y: y + 0.5 + Math.random() * (mo.haut || 2) * 0.5, z: mo.z - dx * R * 0.9 * s, v: [-dx * 9, 0, -dz * 9], vie: [0.18, 0.28], taille: [0.07, 0.03], c: ['#ffffff', '#efe2c0'], a: 0.9, etire: 0.04 }); /* (des filets d'air le long de ses flancs) */
}
function chocCharge(mo, a, p) {
  const y = p.y + 1.0; secousse(0.3, 0.35); if (mo.d.element) impactElement(mo.d.element, p.x, p.z, 2.2); else { etoileImpact(new T.Vector3(p.x, y, p.z), 1.5, '#ffd27a'); onde(p.x, solA(p.x, p.z), p.z, 3, '#fff1c0', 0.4, 0.8); } /* (le Bouftou Royal : la terre, 01/11/2026) */ poussiere(p.x, solA(p.x, p.z), p.z, 12, 1.4, '#d8c6a0');
  if (combat && !combat.fin) repousserPerso(mo, 2.4 * S); /* (bouscule, projete un peu plus loin ; plus loin encore le 01/11/2026, « quand il te charge, ca te repousse ») */
}
function finCharge(mo, a, mur) {
  if (mo.sillon) { mo.sillon.finir(); mo.sillon = null; } /* (le sillon s'arrete et s'efface) */
  const c0 = combat; let t = 0; if (mur) { secousse(0.25, 0.3); for (let k = 0; k < 4; k++) setTimeout(() => { if (combat === c0 && mo.etat === 'actif') emettre(FX_VIF, 3, { x: mo.x, y: mo.m.position.y + (mo.haut || 2) + 0.2, z: mo.z, r: 0.5, v: [0, 0.6, 0], dv: 0.6, vie: [0.4, 0.6], taille: [0.16, 0.06], c: ['#fff6a0', '#ffd23a'], a: 1 }); }, k * 180); } /* (des etoiles au-dessus de sa tete : sonne) */
  effets.push((dt) => { t += dt; if (combat !== c0 || mo.etat !== 'actif') { mo.penche = 0; return true; } mo.penche = 0.38 * Math.max(0, 1 - t / 0.35); return t >= 0.35; });
}
function capCharge(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.charge || mo.d.pique) { /* le Bouftou Royal baisse la tete : une bande rouge jusqu'a toi (ESQUIVE.grandeCharge pour en sortir), puis il fonce et renverse tout sur son passage ;
       les petits monstres qui chargent, et les Dragoeufs qui piquent (15/10/2026), font pareil, de plus pres (3 cases), en ESQUIVE.charge */
    const piq = !!mo.d.pique, per = mo.d.charge || mo.d.pique, petit = !mo.d.boss && !!mo.d.chargeMax, prepa = petit ? (mo.d.chargePrepa || ESQUIVE.charge) : (mo.d.chargePrepa || ESQUIVE.grandeCharge); /* (chargePrepa des petits : les sangliers, 1,1 s, 09/11/2026) */ /* (chargePrepa : le Royal, 31/10/2026) */
    if (petit && mo.chargeT == null) mo.chargeT = Math.random() * per * 0.7; /* (pas tous en meme temps) */
    const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
    if (sortPret('chargeT', per) && dP > (petit ? mo.d.portee + 0.8 : 1.2) && dP < (mo.d.chargeMax || 10) && (!petit || mo.chasse) && !(combat.colle > 0)) { /* (jamais quand le perso est colle : il doit pouvoir sortir de la bande, 20/10/2026) */
      mo.chargeT = 0; const a = Math.atan2(pp.x - mo.x, pp.z - mo.z), L = Math.min(petit ? mo.d.chargeMax + 1.5 : (mo.d.chargeMax || 10), dP + (petit ? 1.2 : 2.5)), f = pointValide(mo.x, mo.z, mo.x + Math.sin(a) * L, mo.z + Math.cos(a) * L);
      /* « si il y a un batiment entre deux, que ca endommage le batiment » (Mathieu, 12/10/2026) : il s'ecrase sur le premier batiment de sa route, la bande
         rouge s'arrete la ; cache derriere, le perso ne prend rien */
      let cleB = null; { const L0 = Math.hypot(f.x - mo.x, f.z - mo.z), bats = clesBats().filter((k) => !enRuine(k)).map((k) => [k, zoneBat(k)]).filter(([, z]) => z);
        for (let d = 1.2; d <= L0 && !cleB; d += 0.2) { const x = mo.x + Math.sin(a) * d, z = mo.z + Math.cos(a) * d, b = bats.find(([, zb]) => Math.abs(x - zb.x) < zb.hw + 0.2 && Math.abs(z - zb.z) < zb.hd + 0.2);
          if (b) { cleB = b[0]; const d2 = Math.max(0.5, d - 0.4); f.x = mo.x + Math.sin(a) * d2; f.z = mo.z + Math.cos(a) * d2; } } }
      mo.ry = a; mo.bloqueT = prepa + 0.6; mo.frappe = 0.3; gesteSort(mo, gesteDe(mo, 'charge', 'bond'), prepa + (mo.d.poings ? 0.45 : 0.25)); /* (le Gorille retombe poings au sol au bout de sa ruee) */
      if (piq) { let t0 = 0; effets.push((dt2) => { t0 += dt2; if (!combat || combat.fin || mo.etat !== 'actif') { mo.hop = 0; return true; } mo.hop = 1.7 * Math.min(1, t0 / prepa); return t0 >= prepa; }); } /* le Dragoeuf prend de la hauteur */
      const tete = !piq && mo.d.boss && !m.userData.anim; if (tete) prepaCharge(mo, a, prepa); /* (le Royal, 31/10/2026 : il recule, baisse la tete, gratte le sol, souffle) */
      if (!combat[piq ? 'piqueVu' : 'chargeVu']) { combat[piq ? 'piqueVu' : 'chargeVu'] = true; toast(piq ? leNom(mo.d) + ' prend son envol pour piquer sur toi : sors de la bande rouge, ou cache-toi derrière un bâtiment !' : leNom(mo.d) + (mo.d.poings ? ' se rue sur toi' : ' baisse la tête') + ' : sors de la bande ' + teinteSorts(mo.d, true) + ' !', 'alerte'); }
      zoneDanger({ mo, x: mo.x, z: mo.z, x2: f.x, z2: f.z, larg: petit ? 1.3 : 1.9, duree: prepa, effet: () => {
        const x0 = mo.x, z0 = mo.z, ruee = piq ? 0.4 : mo.d.chargeVitesse ? Math.max(0.18, Math.hypot(f.x - x0, f.z - z0) / mo.d.chargeVitesse) : 0.45; let t = 0, touche = false; /* (chargeVitesse : sa vitesse de ruee, 31/10/2026) */
        effets.push((dt2) => { t += dt2; const k = Math.min(1, t / ruee); if (!combat || combat.fin || mo.etat !== 'actif') { mo.hop = 0; return true; } mo.x = x0 + (f.x - x0) * k; mo.z = z0 + (f.z - z0) * k;
          if (piq) mo.hop = 1.7 * (1 - k) * (1 - k); else if (tete) sillageCharge(mo, a, dt2); else if (Math.random() < 0.5) pouf(mo.x, solA(mo.x, mo.z), mo.z, 0.9, '#d8c8a8');
          const p2 = paysanMesh.position; if (!touche && (!piq || k > 0.5) && Math.hypot(p2.x - mo.x, p2.z - mo.z) < (petit ? 1.1 : 1.3) * (tete ? Math.max(1, mo.d.ombre * 0.55) : 1)) { touche = true; blesserPerso(Math.round(degSort(mo) * ((mo.d.sortsX || {}).charge || 1)), mo); if (mo.d.menotte) coller(mo.d.menotte, 'Menotté !'); if (tete) chocCharge(mo, a, p2); }
          if (k >= 1) { if (mo.sillon) { mo.sillon.finir(); mo.sillon = null; } mo.hop = 0; mo.bloqueT = cleB ? 0.8 : 0.25; pouf(mo.x, solA(mo.x, mo.z), mo.z, 2.2, '#d8c8a8'); if (tete) finCharge(mo, a, !!cleB);
            const an = mo.d.poings && mo.m.userData.anim; if (an && an.frappe) { const q = an.frappe().p; if (mo.d.element) impactElement(mo.d.element, q.x, q.z, 2.2); else impactMarteau(q.x, solA(q.x, q.z), q.z, mo.d.couleurSorts); } /* (le Gorille : ses poings au sol, 31/10/2026 ; son element, 01/11/2026) */
            if (cleB && combat && !combat.fin) { pouf(f.x, solA(f.x, f.z) + 0.6, f.z, 3, '#8e7a5e'); blesserBat(cleB, degatsBatiment(1, mo)); if (!combat.chargeBatVu) { combat.chargeBatVu = true; chiffre('Bam !', new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.3, mo.z), 'gros'); } } /* sonne, il reste un instant sur place */
            return true; } });
      } });
    }
  }
}
/* LA VIE D'UN BOSS A PIVOTS (01/11/2026, par Discord, du Dragon Cochon : « on dirait qu'il est en une seule piece, il a rien qui bouge, c'est une pierre », Mathieu) :
   par-dessus animerPattes (la marche). Au repos il respire, tourne la tete, fouette de la queue, ses ailes fremissent et il gratte le sol du sabot comme un
   taureau ; quand il se cabre (penche < 0) ses pattes avant se levent, en l'air il replie les quatre, quand il fonce ses pattes arriere poussent, quand il
   tourne sur lui-meme il pietine, et ses gestes tirent la tete (teteB : + baisse la tete, - la releve). Ordre des pattes : avant G, avant D, arriere G, arriere D */
function vieBoss(mo, m, v, dt, s) {
  const u = m.userData, repos = 1 - Math.min(1, v * 0.7), ph = s + mo.id * 1.7, occupe = mo.bloqueT > 0 || mo.hop || mo.elanB || mo.tourne;
  mo.respire = repos * 0.022 * Math.sin(ph * 1.9);
  if (u.tete) { u.tete.rotation.x += (mo.teteB || 0) + repos * 0.06 * Math.sin(ph * 1.9 + 1); u.tete.rotation.y = repos * 0.3 * Math.sin(ph * 0.55) * (occupe ? 0.2 : 1); }
  if (u.queue) { u.queue.rotation.y += repos * 0.4 * Math.sin(ph * 1.5); u.queue.rotation.x = 0.12 * Math.sin(ph * 0.9) + 0.25 * Math.max(0, -(mo.penche || 0)) * 2; }
  if (u.ailes && !mo.ailesVite) { const fr = Math.pow(Math.max(0, Math.sin(ph * 0.8)), 8); u.ailes.forEach((a, i) => { if (a) a.rotation.z += (i ? -1 : 1) * fr * 0.45 * Math.sin(s * 30); }); } /* (de temps en temps, ses petites ailes fremissent) */
  const P = u.pattes; if (!P || P.length < 4) return;
  const leve = Math.max(0, Math.min(1, -(mo.penche || 0) * 2.6)) * (mo.hop > 1 ? 0 : 1), vol = Math.max(0, Math.min(1, (mo.hop || 0) / 1.5)), pousse = Math.max(0, Math.min(1, (mo.elanB || 0) / 1.2));
  for (let i = 0; i < 4; i++) { const av = i < 2, p = P[i];
    p.hanche.rotation.x += av ? -0.95 * leve - 0.55 * vol - 0.3 * pousse : 0.55 * vol + 0.5 * pousse; p.genou.rotation.x += av ? 0.9 * leve + 0.9 * vol : 0.8 * vol;
    if (mo.tourne) p.hanche.rotation.x += Math.sin(mo.tourne * 5 + i * 1.6) * 0.45; } /* (il pietine en tournant) */
  if (repos > 0.8 && !occupe && !(mo.cd < 0.5)) { mo.gratteT = (mo.gratteT || 0) + dt; } else mo.gratteT = Math.min(mo.gratteT || 0, 2.5);
  if (mo.gratteT > 4) { const g = mo.gratteT - 4, p = P[1], c = Math.sin(g * Math.PI * 2.5); /* (il gratte le sol trois fois du sabot avant droit, comme un taureau, puis repart pour 4 s) */
    p.hanche.rotation.x += -0.45 + 0.5 * c; p.genou.rotation.x += 0.5 + 0.3 * Math.max(0, -c); if (u.tete) u.tete.rotation.x += 0.12;
    if (c < -0.9 && !(mo.gratteP > 0)) { mo.gratteP = 0.3; const k = (mo.d.ombre || 2) * 0.32, x = mo.x + Math.sin(mo.ry) * k - Math.cos(mo.ry) * k * 0.4, z = mo.z + Math.cos(mo.ry) * k + Math.sin(mo.ry) * k * 0.4; poussiere(x, solA(x, z), z, 4, 0.5, '#d8c6a0'); }
    if (g >= 1.2) mo.gratteT = 0; }
  if (mo.gratteP > 0) mo.gratteP -= dt;
}
/* LES COUPS D'UN BOSS SANS SQUELETTE (01/11/2026, par Discord, du Dragon Cochon : « je le trouve tres limite quand il attaque sur place, il bouge meme pas », Mathieu) :
   au lieu d'un petit glissement, il enchaine ses gestes ; le coup tombe a l'instant du geste (s'il t'a vu filer, il frappe dans le vide, comme les monstres a squelette).
   groin : il recule, puis se jette en avant tete baissee ; pietine : il se cabre et retombe des pattes avant, la terre tremble ; queue : il tourne sur lui-meme, sa queue balaie.
   Fiche : coups: ['groin', 'pietine', 'queue'] (joues dans l'ordre) */
const GESTES_LOURDS = { groin: { d: 0.6, imp: 0.36 }, pietine: { d: 0.78, imp: 0.5 }, queue: { d: 0.62, imp: 0.34 } };
function coupLourd(mo, portee, frapper) {
  const c0 = combat, L = mo.d.coups, g = L[(mo.coupN = (mo.coupN || 0) + 1) % L.length], G = GESTES_LOURDS[g], k = Math.max(1, (mo.haut || 3) / 3.2), av = (mo.d.ombre || 2) * 0.5;
  let t = 0, tape = false; mo.frappe = 0;
  const devant = (r) => ({ x: mo.x + Math.sin(mo.ry) * r, z: mo.z + Math.cos(mo.ry) * r }), fin = () => { mo.elanB = 0; mo.penche = 0; mo.hop = 0; mo.dresse = 0; mo.tourne = 0; mo.queueB = 0; mo.teteB = 0; };
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') { fin(); return true; } const u = Math.min(1, t / G.d);
    if (g === 'groin') { if (t < 0.28) { const a = t / 0.28; mo.elanB = -0.45 * k * a; mo.penche = -0.16 * a; mo.teteB = -0.25 * a; }
      else if (t < 0.4) { const a = (t - 0.28) / 0.12; mo.elanB = (-0.45 + 1.95 * a) * k; mo.penche = -0.16 + 0.56 * a; mo.teteB = -0.25 + 0.7 * a; }
      else { const a = Math.min(1, (t - 0.4) / 0.2); mo.elanB = 1.5 * k * (1 - a); mo.penche = 0.4 * (1 - a); mo.teteB = 0.45 * (1 - a); } }
    else if (g === 'pietine') { if (t < 0.42) { const a = Math.sin(Math.min(1, t / 0.42) * Math.PI / 2); mo.penche = -0.38 * a; mo.hop = 0.7 * k * a; mo.dresse = 0.08 * a; mo.teteB = -0.3 * a; }
      else if (t < 0.5) { const a = (t - 0.42) / 0.08; mo.penche = -0.38 + 0.58 * a; mo.hop = 0.7 * k * (1 - a) - 0.2 * a; mo.dresse = 0.08 * (1 - a); mo.teteB = -0.3 + 0.55 * a; }
      else { const a = Math.min(1, (t - 0.5) / 0.28); mo.penche = 0.2 * (1 - a); mo.hop = -0.2 * (1 - a); mo.teteB = 0.25 * (1 - a); } }
    else { const a = u * u * (3 - 2 * u); mo.tourne = a * Math.PI * 2; mo.queueB = 0.9 * Math.sin(u * Math.PI); mo.hop = 0.25 * k * Math.sin(u * Math.PI); mo.penche = 0.08 * Math.sin(u * Math.PI);
      if (u > 0.2 && u < 0.8 && Math.random() < dt * 20) { const b = mo.ry + mo.tourne + Math.PI, q = { x: mo.x + Math.sin(b) * av * 1.3, z: mo.z + Math.cos(b) * av * 1.3 }; poussiere(q.x, solA(q.x, q.z), q.z, 2, 0.5, '#d8c6a0'); } } /* (la queue rase le sol) */
    if (!tape && t >= G.imp) { tape = true; const q = devant(g === 'queue' ? 0 : av * 1.2), y = solA(q.x, q.z);
      if (g === 'groin') { secousse(0.07, 0.14); poussiere(q.x, y, q.z, 8, 0.9, '#d8c6a0'); emettre(FX_LUM, 1, { x: q.x, y: y + 1.2 * k, z: q.z, vie: [0.1, 0.14], taille: [1.4, 2.2], c: ['#ffffff', '#ffe2a0'], a: 0.7, entree: 0.01 }); }
      else if (g === 'pietine') { secousse(0.16, 0.3); onde(q.x, y, q.z, 3.2, '#c9b28a', 0.45, 0.85); poussiere(q.x, y, q.z, 12, 1.4, '#d8c6a0'); mottes(q.x, y, q.z, 8, 1); }
      else { secousse(0.06, 0.12); onde(mo.x, solA(mo.x, mo.z), mo.z, av * 2.4, '#d8c6a0', 0.35, 0.6); }
      const p = paysanMesh.position; if (Math.hypot(p.x - mo.x, p.z - mo.z) <= portee + 1.0) frapper(); }
    if (t >= G.d) { fin(); return true; } });
}
/* L'ENVOL DU DRAGON COCHON (01/11/2026, par Discord : « et pour l'attaque en vol qui fait trembler ? », Mathieu) : il prend son elan, ses petites ailes battent
   a toute vitesse, il monte au-dessus de toi, plane un instant, bascule tete en bas et pique ; la terre tremble fort, boue et mottes giclent. Fiche : bondVol */
function volDragon(mo, x0, z0, cx, cz, EB, R, ombre) {
  const c0 = combat, tE = EB * 0.32, tM = EB * 0.34, tP = EB * 0.2, tC = EB - tE - tM - tP, H = 6; let t = 0, parti = false;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') { mo.hop = 0; mo.penche = 0; mo.ailesVite = 0; jeter(ombre); return true; }
    if (t < tE) { const k = t / tE; mo.hop = -0.4 * Math.sin(Math.min(1, k * 1.3) * Math.PI / 2); mo.penche = -0.2 * k; mo.ry = Math.atan2(cx - mo.x, cz - mo.z); mo.ailesVite = k;
      if (Math.random() < dt * 8) poussiere(mo.x, solA(mo.x, mo.z), mo.z, 3, 1, '#d8c6a0'); } /* (il se tasse, les ailes se mettent a vrombir) */
    else if (t < tE + tM) { const k = (t - tE) / tM, e = 1 - (1 - k) * (1 - k); if (!parti) { parti = true; secousse(0.08, 0.2); poussiere(x0, solA(x0, z0), z0, 16, 1.6, '#d8c6a0'); mottes(x0, solA(x0, z0), z0, 8, 1.1); }
      mo.x = x0 + (cx - x0) * e; mo.z = z0 + (cz - z0) * e; mo.hop = H * e; mo.penche = -0.25 + 0.1 * k; mo.ailesVite = 1; }
    else if (t < tE + tM + tP) { const k = (t - tE - tM) / tP; mo.x = cx; mo.z = cz; mo.hop = H + Math.sin(k * Math.PI) * 0.35; mo.penche = -0.15 + 0.6 * k; mo.ailesVite = 1; } /* (il plane au-dessus de toi, puis bascule) */
    else { const k = Math.min(1, (t - tE - tM - tP) / tC); mo.hop = H * (1 - k * k); mo.penche = 0.45; mo.ailesVite = 0.3; } /* (le pique) */
    const o = Math.min(1, t / EB); ombre.scale.setScalar(Math.max(0.01, R * (0.2 + 0.8 * o))); ombre.material.opacity = 0.15 + 0.45 * o;
    if (t >= EB) { mo.hop = 0; mo.ailesVite = 0; jeter(ombre); let r = 0; effets.push((d3) => { r += d3; if (mo.etat !== 'actif') { mo.penche = 0; mo.hop = 0; return true; } mo.penche = 0.45 * Math.max(0, 1 - r / 0.5); mo.hop = -0.35 * Math.sin(Math.min(1, r / 0.5) * Math.PI); return r >= 0.5; }); return true; } });
}
function capBond(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.bondit) { /* le Bworker vise ou tu es : un cercle rouge au sol, il saute et ecrase tout dedans en retombant */
    const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
    const loin = mo.d.bonditLoin ? mo.d.portee * (mo.allonge || 1) + 0.6 : 1.5; /* (bonditLoin, le Gorille roi : il ne saute que pour revenir au corps a corps) */
    const vise = !!(mo.d.marteau || mo.d.poings); /* (Moon et le Gorille roi, 31/10/2026) */
    if (mo.bonditT == null && mo.d.bonditMax) mo.bonditT = mo.d.bondit; /* (l'Abrakne Sombre saute des son arrivee : sinon elle etait deja au contact quand son premier saut etait pret, 08/11/2026) */
    if (sortPret('bonditT', mo.d.bondit) && dP > (vise ? Math.max(loin, 4.5) : loin) && dP < (mo.d.bonditMax || 11)) { /* (bonditMax : l'Abrakne Sombre, 3 cases, 08/11/2026) */ /* (Moon ne bondit plus de pres : il atterrit a la longueur de son marteau du point vise) */
      if (vise && m.userData.anim) { mo.bonditT = 0; bondMarteau(mo, pp.x, pp.z); return; } /* (Moon, le Gorille : 22c-squelettes.js) */
      const EB = mo.d.bondPrepa || ESQUIVE.bond; /* (bondPrepa : le temps pour esquiver le bond, propre au boss, le Bworker 1,3 s, 31/10/2026) */
      mo.bonditT = 0; const cx = pp.x, cz = pp.z, x0 = mo.x, z0 = mo.z, R = mo.d.bonditR || (mo.d.marteau ? 2.8 : 2.3); mo.ry = Math.atan2(cx - x0, cz - z0); mo.bloqueT = EB + 0.3; /* (bonditR : le pique de la Gorgouille, 31/10/2026) */
      const an = m.userData.anim, H = mo.d.bonditH || (an ? 1.2 : 2.8); /* (un monstre a squelette : son geste de saut, recale pour retomber a la fin du cercle ; le saut du geste porte deja une partie de la hauteur, 27/10/2026) */
      const fb = gesteDe(mo, 'bondit', 'bond');
      if (an && an.F[fb]) { const nom = piocher(an, fb), D = an.A[nom].getClip().duration, imp = ((m.userData.impacts || {})[nom] || [])[0], ts = Math.max(0.6, (imp ? imp.t : D * 0.6) / EB), a = jouerAnim(an, nom, 0.1); a.timeScale = ts; mo.geste = { t: 0, d: Math.min(D / ts, EB + 0.5) }; }
      if (!combat.bonditVu) { combat.bonditVu = true; toast(leNom(mo.d) + ' va te sauter dessus : sors du cercle rouge !', 'alerte'); }
      const lourd = mo.d.boss && !an; /* (31/10/2026, un boss sans squelette, le Bworker : un vrai bond, elan, envol haut, ombre, ecrasement) */
      let t = 0, ombre = null; if (lourd) { ombre = new T.Mesh(GEO_DISQUE, fxMat('#1c120a', 0.5)); ombre.rotation.x = -Math.PI / 2; ombre.position.set(cx, solA(cx, cz) + 0.09, cz); ombre.renderOrder = 3; ombre.scale.setScalar(0.01); scene.add(ombre); }
      const vol = lourd ? 0.75 : 0.6, Hl = lourd ? 5.5 : H;
      if (lourd && mo.d.bondVol) volDragon(mo, x0, z0, cx, cz, EB, R, ombre); else effets.push((dt2) => { t += dt2; if (!combat || combat.fin || mo.etat !== 'actif') { mo.hop = 0; mo.penche = 0; if (ombre) jeter(ombre); return true; }
        if (lourd && t < EB - vol) { const k = t / (EB - vol); mo.hop = -0.35 * Math.sin(Math.min(1, k * 1.3) * Math.PI / 2); mo.penche = -0.15 * k; mo.ry = Math.atan2(cx - mo.x, cz - mo.z); /* (il se tasse et se cambre : l'elan) */
          if (Math.random() < dt2 * 6) poussiere(mo.x, solA(mo.x, mo.z), mo.z, 3, 0.8, '#d8c6a0'); }
        if (t > EB - vol) { const k = Math.min(1, (t - (EB - vol)) / vol); if (lourd && !mo.envol) { mo.envol = true; poussiere(x0, solA(x0, z0), z0, 14, 1.4, '#d8c6a0'); mottes(x0, solA(x0, z0), z0, 6, 1); }
          mo.x = x0 + (cx - x0) * k; mo.z = z0 + (cz - z0) * k; mo.hop = Math.sin(k * Math.PI) * Hl; if (lourd) mo.penche = 0.45 * Math.sin(k * Math.PI) - 0.15 * (1 - k); }
        if (ombre) { const o = Math.max(0, Math.min(1, t / EB)); ombre.scale.setScalar(Math.max(0.01, R * (0.2 + 0.7 * o))); ombre.material.opacity = 0.15 + 0.4 * o; }
        if (t >= EB) { mo.hop = 0; mo.envol = false; if (ombre) jeter(ombre); if (lourd) { let r = 0; effets.push((d3) => { r += d3; if (mo.etat !== 'actif') { mo.penche = 0; return true; } mo.penche = 0.3 * Math.max(0, 1 - r / 0.4); mo.hop = -0.3 * Math.sin(Math.min(1, r / 0.4) * Math.PI); return r >= 0.4; }); } return true; } });
      zoneDanger({ mo, x: cx, z: cz, r: R, duree: EB, effet: (d) => { mo.frappe = 0.4; if (mo.d.element) { impactElement(mo.d.element, cx, cz, R * 1.1); secousse(0.3, 0.4); } else { pouf(cx, solA(cx, cz), cz, 7, '#8e7a5e'); pouf(cx, solA(cx, cz), cz, 3.5, '#c9b28a'); if (mo.d.marteau || lourd) impactMarteau(cx, solA(cx, cz), cz); } /* (l'impact de son element, 01/11/2026) */ /* (le Bworker s'ecrase comme Moon : choc, onde, sol fendu, cratere) */
        if (mo.d.bondVol) { const y = solA(cx, cz); secousse(0.42, 0.6); onde(cx, y, cz, R * 2.6, '#c9b28a', 0.7, 1); mottes(cx, y, cz, 16, 1.4); emettre(FX_VIF, 24, { x: cx, y: y + 0.3, z: cz, r: 0.6, dv: 6, haut: true, vie: [0.45, 0.8], taille: [0.2, 0.08], c: ['#6a4524', '#4a2f18', '#8e6640'], grav: 12, frein: 0.6 }); } /* (le Dragon Cochon : la terre tremble plus fort, la boue gicle) */
        const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) { blesserPerso(Math.round(degSort(mo) * ((mo.d.sortsX || {}).bond || 1)), mo); if (mo.d.poisonFixe) effetsCoup(mo); } } }); /* (le saut de l'Abrakne Sombre mord : son poison) */
    }
  }
}
/* la lance prend de la force en volant (29/10/2026, « plus tu es loin, plus tu prends de degats, prorata par case d'eloignement, dans toutes les directions,
   jusqu'a x2 ou x3 au max a la distance max », Mathieu) : la distance du lanceur a toi au moment de l'impact, en vraie ligne droite (une diagonale compte
   pour sa longueur), en cases ; lanceLoin : { parCase, max } dans la fiche, rien sinon */
const lanceDeLoin = (mo, dist) => { const L = mo.d.lanceLoin; return L ? Math.min(L.max, 1 + L.parCase * Math.max(0, dist / S - 2)) : 1; };
/* la lance d'os du Chafer Cuirasse (31/10/2026) : un long os, une pointe d'os taillee, une bande de cuir, un noeud d'os au bout ; elle pointe vers +z */
/* le bras qui lance (31/10/2026, « on la voit etre lancee par son bras ? », Mathieu) : son bras libre tourne a l'epaule (pivot bras_lance) ; sa main est le
   point de ce bras le plus loin de l'epaule, lu une fois sur le modele */
const ease = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
function mainDuBras(bras) {
  if (bras.userData.main) return bras.userData.main; bras.updateMatrixWorld(true); const inv = new T.Matrix4().copy(bras.matrixWorld).invert(), v = new T.Vector3(); let best = new T.Vector3(0, -1, 0), d = 0;
  bras.traverse((o) => { if (!o.isMesh || !o.geometry.attributes.position) return; const P = o.geometry.attributes.position, M = new T.Matrix4().multiplyMatrices(inv, o.matrixWorld);
    for (let i = 0; i < P.count; i += 3) { v.fromBufferAttribute(P, i).applyMatrix4(M); if (v.length() > d) { d = v.length(); best = v.clone(); } } });
  return (bras.userData.main = best.multiplyScalar(0.85)); /* (la paume, un peu avant le bout des doigts) */
}
/* le bras arme (angle a), le lance (vers -0,6), puis revient au repos ; theta autour de x (le bras part en arriere et en haut), un peu ecarte de la tete */
const poseBras = (bras, th) => bras.rotation.set(th, 0, -0.7 * Math.min(1, Math.max(0, th) / 2.7)); /* (ecarte de 0,6 une fois arme : sa main a cote de la tete, pas cachee derriere le casque) */
const lanceOs = () => { const g = new T.Group(), L = 3.0, piece = (geo, c, z) => { const m = new T.Mesh(geo, mat(c)); m.rotation.x = Math.PI / 2; m.position.z = z; g.add(m); return m; };
  piece(new T.CylinderGeometry(0.11, 0.13, L, 8), '#efe6cf', 0); piece(new T.ConeGeometry(0.24, 0.75, 6), '#f6efdc', L / 2 + 0.35); piece(new T.CylinderGeometry(0.15, 0.15, 0.36, 8), '#7a4a28', -0.2);
  const n = new T.Mesh(new T.SphereGeometry(0.2, 8, 6), mat('#e2d8bf')); n.position.z = -L / 2; g.add(n); return g; };
/* LA LANCE ET LES TORNADES D'EBIL (01/11/2026, « le Kanniboul Ebil, il a rien en sort ? Il a un grand baton dans sa main, transforme-le en lance, qu'il peut
   lancer, quand il la lance il y a un effet de vent autour. Et il peut declencher des petites tornades a distance qui te propulsent dans les airs pendant 1,5 s »,
   Mathieu). Son baton est devenu une lance (armes-kannibouls.py, lance_ebil, dans sa main droite). */
const Y_HAUT = new T.Vector3(0, 1, 0);
/* L'IMPACT DE VENT (01/11/2026, par Discord : « les sorts d'impact, a chaque fois ca fait un cercle blanc un peu explosif ; la, comme c'est du vent, on pourrait
   faire un cercle de vent ? Comme si une tornade se formait, mais en forme de cercle au ras du sol, pas un truc qui part en hauteur », Mathieu) : des arcs de vent
   couches sur le sol qui tournoient en s'ouvrant, la poussiere et des feuilles emportees en rond, rien qui monte, pas d'eclair blanc */
function rafaleVent(x, y, z, r) { /* LE VENT AU SOL (cinquieme version, 02/11/2026, « l'animation au sol quand il jette sa lance, et sur un autre sort aussi », Mathieu ;
     voir entonnoirVent dans 22b-effets.js) : la poussiere se couche en spirale et s'ouvre du centre a tout le cercle en tournant de moins en moins vite, un mur
     de poussiere bas roule vers le bord, du sable et des feuilles emportes en rond, des filets d'air. Plus de bras blancs ni de boucles dessinees */
  const y0 = solA(x, z) + 0.05, sol = solVent(r), U = sol.userData.u, mur = entonnoirVent({ rb: 1, rh: 1.1, exp: 1, ond: 0.1, a: 0.65, vit: 3.6, monte: 0.5, c1: '#7a6448', c2: '#ecdfc0', ordre: 5 }), M = mur.userData.u;
  sol.position.set(x, y0, z); mur.position.set(x, y0 - 0.02, z); scene.add(sol, mur);
  let t = 0; effets.push((dt) => { t += dt; const k = Math.min(1, t / 1.4), e = 1 - (1 - k) * (1 - k), o = Math.min(1, t / 0.12);
    U.uT.value += dt * (2.8 - 2 * k); U.uOuv.value = 0.2 + 1.1 * e; U.uA.value = o * (1 - k * k * k);
    const rm = r * (0.3 + 0.75 * e); mur.scale.set(rm, 0.6 * (1 - 0.5 * k), rm); M.uT.value += dt; M.uA.value = 0.65 * o * Math.pow(1 - k, 1.5); /* (le mur de poussiere roule vers le bord et retombe) */
    if (k >= 1) { jeter(sol, mur); return true; } });
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, d = r * fxEntre(0.55, 0.95), v = fxEntre(2.5, 4); emettre(FX_FUM, 1, { x: x + Math.cos(a) * d, y: y0 + 0.15, z: z + Math.sin(a) * d, v: [-Math.sin(a) * v, 0.25, Math.cos(a) * v], vie: [0.8, 1.2], taille: [0.4, 1.0], c: ['#e2d2ac', '#c9b48a'], a: 0.5, frein: 1.2 }); } /* (le sable tourbillonne au bord) */
  feuillesVolantes(x, y0, z, r * 0.8, 8, true); /* (de vraies feuilles emportees en rond, 22b-effets.js) */
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, d = r * (0.35 + 0.4 * Math.random()), v = 4 + Math.random() * 2; emettre(FX_VIF, 1, { x: x + Math.cos(a) * d, y: y0 + 0.1 + Math.random() * 0.3, z: z + Math.sin(a) * d, v: [-Math.sin(a) * v, 0.1, Math.cos(a) * v], vie: [0.3, 0.45], taille: [0.06, 0.02], c: ['#ffffff', '#cfe7f2'], etire: 0.12, frein: 0.8 }); } /* (des filets d'air etires) */
}
function souffleMain(h) { /* le vent qui rend sa lance a sa main : une petite spirale d'air, sans rien d'explosif */
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r = 0.5; emettre(FX_VIF, 1, { x: h.x + Math.cos(a) * r, y: h.y + (i % 3 - 1) * 0.2, z: h.z + Math.sin(a) * r, v: [-Math.sin(a) * 2.5 - Math.cos(a) * 1.2, 0.3, Math.cos(a) * 2.5 - Math.sin(a) * 1.2], vie: [0.3, 0.4], taille: [0.1, 0.02], c: ['#ffffff', '#cfe7f2'], frein: 1 }); }
}
/* la lance de vent : de loin (lanceVent.loin), un trait rouge de lui a toi et un petit cercle sous toi (02/11/2026) ; il CHARGE sa lance : le vent se leve autour de lui en tourbillon, de plus en plus
   vite, l'air est aspire vers sa lance qui s'illumine. Puis il la jette d'un coup : un claquement d'air a sa main, et portee par le vent elle file en ligne droite,
   tres vite, dans un sillage d'anneaux de vent ; elle se plante, une rafale jaillit et repousse. Puis le vent la lui ramene en main.
   (01/11/2026, « le vent on le ressent pas : il faut qu'il la charge, mais quand il la lance elle est super rapide grace au vent », Mathieu) Fiche : lanceVent: { periode, loin, R, larg, prepa, x, repousse } */
function anneauChoc(pos, dir, r0, r1, duree, couleur) { /* un anneau d'air qui s'ouvre en travers d'une direction et s'efface */
  const m = new T.Mesh(new T.TorusGeometry(1, 0.06, 6, 28), new T.MeshBasicMaterial({ color: couleur || '#f2fbff', transparent: true, opacity: 0.9, depthWrite: false })); m.position.copy(pos);
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), dir); m.scale.setScalar(r0); scene.add(m); let t = 0;
  effets.push((dt) => { t += dt; const k = Math.min(1, t / duree); m.scale.setScalar(r0 + (r1 - r0) * (1 - (1 - k) * (1 - k))); m.material.opacity = 0.9 * (1 - k); if (k >= 1) { jeter(m); return true; } });
}
function capLanceVent(mo, ctx) { /* (01/11/2026, par Discord : « la lance, elle part d'ou ? Faudrait qu'on la voie dans sa main, ou alors grace au vent il la fait leviter
     et ensuite elle part grace au vent », Mathieu : tenue, elle restait cachee derriere sa criniere. Elle quitte sa main des le debut de la charge, monte au-dessus
     de lui et pointe vers toi, tourne dans son tourbillon de vent, recule d'un coup sec et part) */
  const { pp, sortPret } = ctx, J = mo.d.lanceVent; if (!J || combat.deroute != null) return;
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('lanceVT', J.periode) || mo.geste) return; if (dP < J.loin || dP > 16) { mo.lanceVT = J.periode; return; } /* (pret, il attend que tu sois loin) */
  const c0 = combat, cx = pp.x, cz = pp.z, vol = 0.14, tl = J.prepa - vol, monte = 0.45, recul = 0.18, tenue = mo.m.getObjectByName('lance_ebil');
  mo.lanceVT = 0; const a0 = Math.atan2(cx - mo.x, cz - mo.z); mo.ry = a0; mo.bloqueT = J.prepa + 0.4; mo.cd = Math.max(mo.cd || 0, J.prepa + 0.6); mo.frappe = 0.3; gesteSort(mo, gesteDe(mo, 'lanceVent', 'sort'), monte);
  if (!c0.lanceVentVu) { c0.lanceVentVu = true; toast(leNom(mo.d) + ' fait léviter sa lance dans le vent : sors du trait rouge, elle part d\'un coup !', 'alerte'); }
  const vers = new T.Vector3(cx, solA(cx, cz) + 0.35, cz), haut = new T.Vector3(mo.x + Math.sin(a0) * 1.0, mo.m.position.y + (mo.haut || 2.6) * 1.15, mo.z + Math.cos(a0) * 1.0), dir = new T.Vector3().subVectors(vers, haut).normalize();
  const vise = new T.Quaternion().setFromUnitVectors(Y_HAUT, dir), q0 = new T.Quaternion(), p0 = new T.Vector3(), p = new T.Vector3();
  let L; if (tenue) { L = tenue.clone(true); tenue.getWorldPosition(p0); tenue.getWorldQuaternion(q0); tenue.getWorldScale(L.scale); L.scale.multiplyScalar(1.2); tenue.visible = false; } else { L = lanceOs(); p0.set(mo.x, mo.m.position.y + 1.6, mo.z); }
  L.visible = true; L.position.copy(p0); L.quaternion.copy(q0); scene.add(L); /* (elle quitte sa main) */
  const tour = new T.Group(), manchon = entonnoirVent({ rb: 0.3, rh: 0.42, exp: 1, ond: 0.14, a: 0.3, vit: 7, monte: 2.4, c1: '#9db6c2', c2: '#f6fcff', ordre: 6 }); manchon.position.y = -0.9; manchon.scale.y = 1.8; tour.add(manchon);
  tour.scale.setScalar(0.4); scene.add(tour); /* (le tourbillon autour de la lance : un manchon d'air qui file vers sa pointe, 02/11/2026, plus d'anneaux) */
  let t = 0, de = null, trace = null, fin = false, tic = 0, choc = 0; const rendre = () => { if (tenue) tenue.visible = true; };
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || (!de && mo.etat !== 'actif')) { if (L) jeter(L); jeter(tour); if (trace) jeter(trace); rendre(); return true; }
    if (t < tl) { const k = t / tl;
      if (t < monte) { const u = t / monte, e = u * u * (3 - 2 * u); p.lerpVectors(p0, haut, e); p.y += Math.sin(u * Math.PI) * 0.4; L.position.copy(p); L.quaternion.slerpQuaternions(q0, vise, e); } /* (elle monte au-dessus de lui et se tourne vers toi) */
      else { const r = Math.max(0, (t - (tl - recul)) / recul), v = 0.015 + 0.05 * k; p.copy(haut); p.y += Math.sin(t * 5) * 0.08 * (1 - r); p.addScaledVector(dir, -0.6 * r * r); p.x += (Math.random() - 0.5) * v; p.y += (Math.random() - 0.5) * v; p.z += (Math.random() - 0.5) * v;
        L.position.copy(p); L.quaternion.copy(vise); L.rotateY((t - monte) * (4 + 14 * k)); } /* (elle flotte et vrille de plus en plus vite, tremble, puis recule d'un coup sec) */
      tour.position.copy(L.position); tour.quaternion.copy(vise); tour.scale.setScalar(0.4 + 0.9 * k); manchon.userData.u.uT.value += dt * (0.6 + 2 * k); manchon.userData.u.uA.value = 0.3 + 0.5 * k;
      if ((tic += dt) > 0.035 - 0.02 * k) { tic = 0; const a = Math.random() * Math.PI * 2, r = 2.0 - 0.6 * k, h = L.position, s0 = new T.Vector3(h.x + Math.cos(a) * r, h.y + (Math.random() - 0.5) * 1.6, h.z + Math.sin(a) * r), v = h.clone().sub(s0).multiplyScalar(2.6);
        emettre(FX_VIF, 1, { x: s0.x, y: s0.y, z: s0.z, v: [v.x - Math.sin(a) * 1.5, v.y, v.z + Math.cos(a) * 1.5], vie: [0.32, 0.4], taille: [0.12, 0.02], c: ['#ffffff', '#a9cfe0'], a: 1 }); /* (l'air est aspire vers la lance) */
        if (Math.random() < 0.5) { const b = Math.random() * Math.PI * 2; emettre(FX_VIF, 1, { x: mo.x + Math.cos(b) * 1.2, y: solA(mo.x, mo.z) + 0.1, z: mo.z + Math.sin(b) * 1.2, v: [-Math.sin(b) * 4, 1.2, Math.cos(b) * 4], vie: [0.35, 0.5], taille: [0.14, 0.05], c: ['#d8c6a0', '#b8a888'], frein: 1 }); } } /* (la poussiere tourne a ses pieds) */
      emettre(FX_LUM, 1, { x: L.position.x + dir.x * 0.9, y: L.position.y + dir.y * 0.9, z: L.position.z + dir.z * 0.9, vie: [0.06, 0.08], taille: [0.3 + 0.9 * k, 0.2], c: ['#ffffff', '#bfe6ff'], a: 0.35 + 0.5 * k }); /* (sa pointe s'illumine) */
      if ((choc += dt) > 0.3) { choc = 0; secousse(0.02 + 0.05 * k, 0.12); }
      return false; }
    if (!de) { jeter(tour); de = L.position.clone(); dir.subVectors(vers, de).normalize(); L.quaternion.setFromUnitVectors(Y_HAUT, dir);
      trace = new T.Mesh(new T.CylinderGeometry(0.16, 0.03, 1, 10, 1, true), new T.MeshBasicMaterial({ color: '#eef8ff', transparent: true, opacity: 0.75, depthWrite: false })); scene.add(trace); /* (le sillage d'air derriere elle) */
      secousse(0.16, 0.22); anneauChoc(de, dir, 0.3, 1.6, 0.35); anneauChoc(de, dir, 0.2, 1.0, 0.25, '#bfe6ff'); rafaleVent(mo.x, 0, mo.z, 1.8); }
    const u = Math.min(1, (t - tl) / vol);
    if (!fin) { p.lerpVectors(de, vers, u); L.position.copy(p); L.quaternion.setFromUnitVectors(Y_HAUT, dir); L.rotateY(u * 6);
      const lg = Math.max(0.01, p.distanceTo(de)); trace.position.lerpVectors(de, p, 0.5); trace.quaternion.setFromUnitVectors(Y_HAUT, dir); trace.scale.set(1, lg, 1);
      if (u > 0.3 && u < 0.95 && Math.random() < 0.7) anneauChoc(p, dir, 0.2, 0.8, 0.3); emettre(FX_VIF, 3, { x: p.x, y: p.y, z: p.z, r: 0.25, dv: 2, vie: [0.25, 0.4], taille: [0.12, 0.03], c: ['#ffffff', '#a9cfe0'] }); }
    if (u < 1) return false;
    if (!fin) { fin = true; L.position.copy(vers).addScaledVector(dir, 0.35); } /* (plantee, un peu enfoncee) */
    const r = t - tl - vol; trace.material.opacity = 0.75 * Math.max(0, 1 - r / 0.35); L.rotation.z += Math.sin(r * 60) * 0.02 * Math.max(0, 1 - r / 0.5); /* (le sillage s'efface, la lance vibre) */
    if (r < 0.9) return false;
    jeter(trace); trace = null; rafaleVent(vers.x, vers.y - 0.3, vers.z, 1.0); jeter(L); L = null; rendre(); const h = mainSquelette(mo); if (h) souffleMain(h); return true; }); /* (le vent la reprend et la lui rend) */
  /* (02/11/2026, « la lance, ca doit faire un trait rouge ou tu dois pas etre dans la ligne, et lorsqu'elle atterrit c'est un petit cercle, environ la taille d'une
     case », Mathieu : un cercle de 1,9 sous toi, et une rafale de 3,8 a l'arrivee) : le trait de sa main a toi, et le cercle d'une case ou elle se plante */
  const bande = zoneDanger({ mo, x: mo.x + Math.sin(a0) * 0.8, z: mo.z + Math.cos(a0) * 0.8, x2: cx, z2: cz, larg: J.larg || 0.8, bord: true, duree: J.prepa, effet: () => {} });
  zoneDanger({ mo, x: cx, z: cz, r: J.R, duree: J.prepa, effet: (d) => { const y = solA(cx, cz); secousse(0.22, 0.32); rafaleVent(cx, y, cz, J.R * 1.15); mottes(cx, y, cz, 4, 0.6);
    const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z) || dansDanger(bande, p2.x, p2.z)) { blesserPerso(Math.max(1, Math.round(degSort(mo) * J.x)), mo); if (J.repousse) repousserPerso(mo, J.repousse); } } }); /* (sur le trait ou dans le cercle : touche, la rafale te repousse) */
}
/* les tornades : il leve sa lance, des cercles s'annoncent (un sous toi, les autres autour) ; une petite tornade jaillit de chacun et tourne sur place. Dedans,
   tu es aspire et projete en l'air (1,5 s : tu ne bouges ni ne frappes), puis tu retombes. Fiche : tornades: { periode, n, R, prepa, duree, x, loin } */
function propulserPerso(mo, x, z, dg) { /* aspire par une tornade : il monte en tournoyant, reste en l'air 1,5 s en tout, puis retombe */
  const c0 = combat; if (!c0 || c0.fin || c0.envol > 0 || !paysanMesh) return; const D = 1.5; c0.envol = D; c0.assomme = Math.max(c0.assomme || 0, D); chemin = []; arrivee = null;
  const p = paysanMesh.position, y0 = p.y, ry0 = paysanMesh.rotation.y; let t = 0; const q = p.clone(); q.y += 2.1; chiffre('Projeté !', q, 'vol'); blesserPerso(dg, mo);
  effets.push((dt) => { t += dt; if (combat !== c0) { c0.envol = 0; return true; } const k = Math.min(1, t / D), h = k < 0.35 ? Math.sin(k / 0.35 * Math.PI / 2) : k < 0.7 ? 1 : 1 - Math.pow((k - 0.7) / 0.3, 2);
    p.y = y0 + 3.2 * h; p.x += (x - p.x) * Math.min(1, dt * 3) * (1 - k); p.z += (z - p.z) * Math.min(1, dt * 3) * (1 - k); paysanMesh.rotation.y = ry0 + t * 13 * (1 - k * 0.6); /* (aspire vers le coeur de la tornade, il tournoie) */
    if (k >= 1) { c0.envol = 0; p.y = y0; paysanMesh.rotation.y = ry0; poussiere(p.x, y0, p.z, 8, 0.8, '#d8c6a0'); secousse(0.08, 0.15); return true; } });
}
function capTornades(mo, ctx) {
  const { pp, sortPret } = ctx, TO = mo.d.tornades; if (!TO || combat.deroute != null) return;
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('tornadesT', TO.periode) || mo.geste) return; if (dP < (TO.loin || 0) || dP > 20) { mo.tornadesT = TO.periode; return; } /* (a distance : pas collee a lui) */
  const c0 = combat; mo.tornadesT = 0; mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z); mo.bloqueT = TO.prepa + 0.3; mo.cd = Math.max(mo.cd || 0, TO.prepa + 0.4); mo.frappe = 0.3; gesteSort(mo, gesteDe(mo, 'tornades', 'sort'), TO.prepa);
  if (!c0.tornadesVu) { c0.tornadesVu = true; toast(leNom(mo.d) + ' déchaîne des tornades : sors des cercles, elles te projettent en l\'air !', 'alerte'); }
  const P = [{ x: pp.x, z: pp.z }]; for (let e = 0; e < 40 && P.length < TO.n; e++) { const a = Math.random() * Math.PI * 2, d = 2.2 + Math.random() * 2.2, f = pointValide(pp.x, pp.z, pp.x + Math.cos(a) * d, pp.z + Math.sin(a) * d);
    if (P.every((o) => Math.hypot(o.x - f.x, o.z - f.z) > TO.R * 2.2)) P.push({ x: f.x, z: f.z }); } /* (une sous toi, les autres a cote : ou que tu fuies, il faut regarder) */
  const dg = Math.max(1, Math.round(degSort(mo) * TO.x));
  P.forEach((o) => { /* (02/11/2026, « les tornades et l'espace de cercle au sol, on peut faire bcp plus realiste », Mathieu : tornadeVent, 22b-effets.js) pendant
      l'annonce, la poussiere se met a tourner dans le cercle, de plus en plus vite, et l'air y est aspire ; puis la tornade monte du sol */
    const y0 = solA(o.x, o.z), pre = solVent(TO.R * 1.5, { ombre: 0.3 }), U = pre.userData.u; pre.position.set(o.x, y0 + 0.045, o.z); scene.add(pre); let tp = 0;
    effets.push((dt) => { tp += dt; const k = Math.min(1, tp / TO.prepa); if (k >= 1 || combat !== c0 || c0.fin) { jeter(pre); return true; } U.uT.value += dt * (0.6 + 2.6 * k); U.uA.value = 0.65 * k * k; U.uOuv.value = 0.3 + 0.9 * k;
      if (Math.random() < dt * 12 * k) { const a = Math.random() * Math.PI * 2, d = TO.R * 1.3; emettre(FX_FUM, 1, { x: o.x + Math.cos(a) * d, y: y0 + 0.12, z: o.z + Math.sin(a) * d, v: [-Math.sin(a) * 2.2 - Math.cos(a) * 1.4, 0.15, Math.cos(a) * 2.2 - Math.sin(a) * 1.4], vie: [0.5, 0.7], taille: [0.3, 0.7], c: ['#d6c7a6', '#b3a284'], a: 0.4, frein: 0.6 }); } /* (le sable aspire vers le centre, en tournant) */
      return false; });
    zoneDanger({ mo, x: o.x, z: o.z, r: TO.R, duree: TO.prepa, effet: () => { const g = tornadeVent(TO.R, 3.6); g.position.set(o.x, y0, o.z); g.scale.set(0.5, 0.01, 0.5); scene.add(g); rafaleVent(o.x, y0, o.z, TO.R * 1.3);
    let t = 0, tic = 0; effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || t >= TO.duree) { jeter(g); return true; }
      const k = Math.min(1, t / 0.45), f = Math.min(1, (TO.duree - t) / 0.5), s = 0.5 + 0.5 * Math.min(k, f); g.scale.set(s, Math.max(0.01, k * (0.6 + 0.4 * f)), s); g.userData.maj(dt, Math.min(k, f)); /* (elle monte du sol, puis se dissipe en s'affaissant) */
      if ((tic += dt) > 0.06) { tic = 0; const a = Math.random() * Math.PI * 2; emettre(FX_VIF, 2, { x: o.x + Math.cos(a) * TO.R * 0.6, y: y0 + 0.1, z: o.z + Math.sin(a) * TO.R * 0.6, v: [-Math.sin(a) * 3, 2.5, Math.cos(a) * 3], vie: [0.4, 0.6], taille: [0.14, 0.05], c: ['#b8a888', '#8a7a62'], frein: 1 }); emettre(FX_FUM, 1, { x: o.x, y: y0 + 0.2, z: o.z, r: TO.R * 0.5, vie: [0.4, 0.6], taille: [0.4, 0.9], c: ['#c9bfa8', '#a89c84'], a: 0.5 }); } /* (la poussiere tourne a son pied) */
      const p2 = paysanMesh.position; if (f > 0.5 && !(c0.envol > 0) && Math.hypot(p2.x - o.x, p2.z - o.z) < TO.R * 0.9) { propulserPerso(mo, o.x, o.z, dg); t = Math.max(t, TO.duree - 0.4); } /* (une tornade qui t'a projete se dissipe : tu ne retombes pas dedans) */
      return false; }); } }); });
}
/* LE KIT DU GOLEM LUNAIRE (01/11/2026, par Discord : « pour moi il fait une invocation, ca s'assombrit comme si la nuit tombait, et il fait tomber des meteorites sur la
   map : c'est son ultime ; sinon il envoie un boomerang lunaire qu'il decroche de sa tete, et il utilise ses lianes, les lance pour attirer au corps a corps et charger un
   coup au cac qui fait mal », Mathieu). Le croissant de sa tete pend a un os a lui (blender/golem-croissant.py) : le jeu le reduit a rien pendant le lancer. */
function croissantVolant() { /* le croissant de lune lance : epais, blanc bleute, qui luit */
  const s = new T.Shape(); s.absarc(0, 0, 0.62, Math.PI * 0.15, Math.PI * 1.85, false); s.absarc(0.24, 0.02, 0.48, Math.PI * 1.75, Math.PI * 0.25, true);
  const geo = new T.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 }); geo.center();
  const g = new T.Group(), c = new T.Mesh(geo, new T.MeshBasicMaterial({ color: '#eef7ff' })), h = new T.Mesh(geo, new T.MeshBasicMaterial({ color: '#9fdcff', transparent: true, opacity: 0.35, depthWrite: false })); h.scale.setScalar(1.25); g.add(c, h); g.traverse((o) => { o.raycast = () => {}; }); return g;
}
function capBoomerang(mo, ctx) {
  const { pp, sortPret } = ctx, B = mo.d.boomerang; if (!B || combat.deroute != null) return;
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('boomT', B.periode) || mo.geste) return; if (dP < 3 || dP > B.portee + 3) { mo.boomT = B.periode; return; }
  const c0 = combat, a = Math.atan2(pp.x - mo.x, pp.z - mo.z), f = pointValide(mo.x, mo.z, mo.x + Math.sin(a) * B.portee, mo.z + Math.cos(a) * B.portee), prepa = 0.9, os = mo.m.getObjectByName('croissant');
  mo.boomT = 0; mo.ry = a; mo.bloqueT = prepa + 0.3; mo.cd = Math.max(mo.cd || 0, prepa + 0.4); gesteSort(mo, gesteDe(mo, 'boomerang', 'tir'), prepa);
  if (!c0.boomVu) { c0.boomVu = true; toast(leNom(mo.d) + ' décroche le croissant de sa tête : sors de la bande, il touche à l\'aller et au retour !', 'alerte'); }
  zoneDanger({ mo, x: mo.x, z: mo.z, x2: f.x, z2: f.z, larg: B.larg, duree: prepa, effet: () => {} });
  const dg = Math.max(1, Math.round(degSort(mo) * B.x)), tete = () => (os ? os.getWorldPosition(new T.Vector3()) : new T.Vector3(mo.x, mo.m.position.y + (mo.haut || 3), mo.z));
  let t = 0, cr = null, de = null, touche = [false, false];
  effets.push((dt) => { t += dt; const fin = () => { if (cr) jeter(cr); if (os) os.scale.setScalar(1); };
    if (combat !== c0 || c0.fin) { fin(); return true; }
    if (t < prepa) { if (os && Math.random() < dt * 14) { const p = tete(); emettre(FX_LUM, 1, { x: p.x, y: p.y + 0.3, z: p.z, r: 0.3, vie: [0.3, 0.5], taille: [0.16, 0.02], c: ['#ffffff', '#bfe6ff'] }); } return false; } /* (le croissant s'illumine sur sa tete) */
    if (!cr) { de = tete(); cr = croissantVolant(); cr.scale.setScalar((mo.haut || 3) / 3.2); cr.position.copy(de); scene.add(cr); if (os) os.scale.setScalar(0.001); secousse(0.05, 0.1); } /* (il le decroche) */
    const u = (t - prepa) / B.duree, aller = u < 0.5, k = aller ? Math.sin(u / 0.5 * Math.PI / 2) : 1 - Math.sin((u - 0.5) / 0.5 * Math.PI / 2), retour = tete(), ici = aller ? de : retour;
    const p = new T.Vector3(ici.x + (f.x - ici.x) * k, 0, ici.z + (f.z - ici.z) * k), cote = aller ? 0 : Math.sin((u - 0.5) / 0.5 * Math.PI) * 1.6; p.x += Math.cos(a) * cote; p.z -= Math.sin(a) * cote; p.y = (aller ? de.y : retour.y) * (1 - k) + (solA(p.x, p.z) + 1.0) * k; /* (il file droit, revient en courbe) */
    cr.position.copy(p); cr.rotation.set(Math.PI / 2 - 0.25, 0, t * 16); emettre(FX_LUM, 2, { x: p.x, y: p.y, z: p.z, r: 0.25, vie: [0.25, 0.4], taille: [0.2, 0.02], c: ['#ffffff', '#9fdcff'] });
    const p2 = paysanMesh.position, n = aller ? 0 : 1; if (!touche[n] && Math.hypot(p2.x - p.x, p2.z - p.z) < 1.1 * Math.max(1, (mo.haut || 3) / 3.2)) { touche[n] = true; blesserPerso(dg, mo); emettre(FX_LUM, 10, { x: p2.x, y: p2.y + 1, z: p2.z, r: 0.3, dv: 3, vie: [0.3, 0.5], taille: [0.18, 0.03], c: ['#ffffff', '#bfe6ff'] }); }
    if (u >= 1) { fin(); const q = tete(); emettre(FX_LUM, 12, { x: q.x, y: q.y + 0.3, z: q.z, r: 0.3, dv: 2.5, vie: [0.3, 0.5], taille: [0.18, 0.02], c: ['#ffffff', '#bfe6ff'] }); return true; } /* (il revient se poser sur sa tete) */
    return false; });
}
function lianeVolante() { /* une liane : une chaine de maillons verts avec des feuilles, qu'on etire entre deux points */
  const g = new T.Group(), M = []; for (let i = 0; i < 18; i++) { const s = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1, 6), mat(i % 2 ? '#4a7a2e' : '#3f6a27')); g.add(s); M.push(s);
    if (i % 3 === 1) { const f = new T.Mesh(new T.SphereGeometry(0.11, 6, 4), mat('#5fae3a')); f.scale.set(1.4, 0.4, 0.8); s.add(f); f.position.x = 0.1; } } g.traverse((o) => { o.raycast = () => {}; }); return { g, M };
}
function poserLiane(L, a, b, t) { /* la liane de a a b, qui ondule */
  const n = L.M.length, d = new T.Vector3().subVectors(b, a), lg = d.length(), u = d.clone().normalize(), w = new T.Vector3(-u.z, 0, u.x);
  L.M.forEach((s, i) => { const k0 = i / n, k1 = (i + 1) / n, o = (k) => a.clone().addScaledVector(d, k).addScaledVector(w, Math.sin(k * Math.PI * 3 + t * 14) * 0.18 * Math.sin(k * Math.PI)).setY(a.y + (b.y - a.y) * k + Math.sin(k * Math.PI) * 0.4);
    const p = o(k0), q = o(k1); s.position.copy(p).add(q).multiplyScalar(0.5); s.scale.set(1, Math.max(0.01, p.distanceTo(q)), 1); s.quaternion.setFromUnitVectors(Y_HAUT, q.clone().sub(p).normalize()); });
  return lg;
}
function capLianes(mo, ctx) {
  const { pp, sortPret } = ctx, L = mo.d.lianes; if (!L || mo.ancre || mo.regard || mo.lance || combat.deroute != null) return;
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('lianesT', L.periode) || mo.geste) return; if (dP < L.loin || dP > 13) { mo.lianesT = L.periode; return; }
  const c0 = combat, a = Math.atan2(pp.x - mo.x, pp.z - mo.z), f = pointValide(mo.x, mo.z, mo.x + Math.sin(a) * (dP + 1.5), mo.z + Math.cos(a) * (dP + 1.5));
  mo.lianesT = 0; mo.ry = a; mo.bloqueT = L.prepa + 0.6; mo.cd = Math.max(mo.cd || 0, L.prepa + 0.8); gesteSort(mo, gesteDe(mo, 'lianes', 'tir'), L.prepa);
  if (!c0.lianesVu) { c0.lianesVu = true; toast(leNom(mo.d) + ' lance ses lianes : sors de la bande ' + (L.couleurNom || 'verte') + ', sinon il te tire contre lui pour un gros coup !', 'alerte'); }
  zoneDanger({ mo, x: mo.x, z: mo.z, x2: f.x, z2: f.z, larg: 1.3, duree: L.prepa, couleur: L.couleur || '#14501a', fort: L.couleur ? 1 : 1.7, bord: true, effet: (d) => {
    const p2 = paysanMesh.position, prise = dansDanger(d, p2.x, p2.z), main = () => mainSquelette(mo) || new T.Vector3(mo.x, mo.m.position.y + (mo.haut || 3) * 0.6, mo.z), lv = lianeVolante(); scene.add(lv.g);
    const bout = prise ? null : new T.Vector3(f.x, solA(f.x, f.z) + 0.6, f.z); let t = 0, tire = false; const x0 = p2.x, z0 = p2.z, devant = 2.3 * Math.max(1, (mo.haut || 3) / 3.2);
    if (prise) { chemin = []; arrivee = null; const q = p2.clone(); q.y += 2.1; chiffre('Attrapé !', q, 'vol'); c0.colle = Math.max(c0.colle || 0, 0.8); }
    effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') { jeter(lv.g); return true; } const h = main();
      if (t < 0.18) { const k = t / 0.18, cible = prise ? new T.Vector3(p2.x, p2.y + 1, p2.z) : bout; poserLiane(lv, h, h.clone().lerp(cible, k), t); return false; } /* (elle jaillit) */
      if (!prise) { const k = Math.min(1, (t - 0.18) / 0.3); poserLiane(lv, h, bout.clone().lerp(h, k), t); if (k >= 1) { jeter(lv.g); return true; } return false; } /* (ratee : elle revient) */
      const k = Math.min(1, (t - 0.18) / 0.45), e = k * k * (3 - 2 * k), cx = mo.x + Math.sin(mo.ry) * devant, cz = mo.z + Math.cos(mo.ry) * devant; paysanMesh.position.x = x0 + (cx - x0) * e; paysanMesh.position.z = z0 + (cz - z0) * e; /* (elle te tire contre lui) */
      poserLiane(lv, h, new T.Vector3(paysanMesh.position.x, paysanMesh.position.y + 1, paysanMesh.position.z), t);
      if (k >= 1 && !tire) { tire = true; const cc = caseIci(cx, cz); if (cc) paysanMesh.userData.cellule = cc; jeter(lv.g); etourdir(0.5); coupLianes(mo); return true; } return false; }); /* (etourdi a l'arrivee) */
  } });
}
function coupLianes(mo) { /* le gros coup charge apres les lianes : un cercle tout autour de lui, puis il abat ses poings, le sol devient lunaire */
  const L = mo.d.lianes, c0 = combat, x0 = mo.x, z0 = mo.z; mo.bloqueT = L.coupPrepa + 0.3; mo.cd = Math.max(mo.cd || 0, L.coupPrepa + 0.6); gesteSort(mo, gesteDe(mo, 'coupLianes', 'sort'), L.coupPrepa);
  zoneDanger({ mo, x: x0, z: z0, r: L.R, duree: L.coupPrepa, effet: (d) => { secousse(0.4, 0.55); if (L.element) impactElement(L.element, x0, z0, L.R); else impactLune(x0, z0, L.R); const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) blesserPerso(Math.max(1, Math.round(degSort(mo) * L.x)), mo); } });
}
let NUIT = null;
function nuitTombe(duree) { /* la nuit tombe : les lumieres baissent et bleuissent, un voile de nuit avec une lune et des etoiles, puis le jour revient */
  if (!NUIT) { const v = document.createElement('div'); v.className = 'nuit-lunaire'; v.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;z-index:0;background:radial-gradient(ellipse at 50% 35%,rgba(40,60,120,.22) 0%,rgba(8,12,35,.68) 100%)';
    v.innerHTML = '<div style="position:absolute;right:16%;top:9%;width:84px;height:84px;border-radius:50%;box-shadow:inset -24px 8px 0 0 #eef6ff;filter:drop-shadow(0 0 18px rgba(190,230,255,.9));transform:rotate(-25deg)"></div>' +
      Array.from({ length: 34 }, () => '<i style="position:absolute;left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (Math.random() * 55).toFixed(1) + '%;width:3px;height:3px;border-radius:50%;background:#fff;opacity:' + (0.4 + Math.random() * 0.6).toFixed(2) + '"></i>').join('');
    canvas.insertAdjacentElement('afterend', v);
    const L = []; scene.traverse((o) => { if (o.isLight) L.push({ o, i: o.intensity, c: o.color.clone() }); }); NUIT = { v, L, t: 0, d: 0 }; }
  NUIT.d = Math.max(NUIT.d - NUIT.t, duree); NUIT.t = 0; const N = NUIT, bleu = new T.Color('#8fa8ff');
  if (N.actif) return; N.actif = true; animerLanternes.t = 0; /* (les lanternes s'allument tout de suite, 09/11/2026) */
  effets.push((dt) => { N.t += dt; const k = Math.min(1, N.t / 1.0) * Math.min(1, Math.max(0, (N.d - N.t) / 1.2)); N.v.style.opacity = String(k);
    N.L.forEach((l) => { l.o.intensity = l.i * (1 - 0.55 * k); l.o.color.copy(l.c).lerp(bleu, 0.5 * k); });
    if (N.t >= N.d || !combat) { N.v.style.opacity = '0'; N.L.forEach((l) => { l.o.intensity = l.i; l.o.color.copy(l.c); }); N.actif = false; animerLanternes.t = 0; return true; } });
}
/* LA NUIT DE LA FORET (08/11/2026, par Discord : « les Abraknydes, ils nous plongent dans la nuit pendant les vagues », Mathieu) : des qu'un monstre du
   palier 10 sort, la nuit tombe sur la ferme jusqu'a la fin du combat. Pas de lune comme la nuit lunaire du Golem : un voile bleu-vert profond, la lumiere
   baisse davantage et bleuit, des lucioles qui flottent ; les yeux des Abraknydes (leur image d'emission) ressortent dans le noir. Le jour revient a la fin */
let NUIT_F = null;
/* LA LUMIERE DES LANTERNES ET DES TORCHES DANS LA NUIT DE LA FORET (08/11/2026, « il faudra acheter des lampadaires », puis « rajoute aussi des lampes torches »,
   Mathieu, qui garde la nuit telle quelle) : chaque lanterne ou torche allumee perce le voile de la nuit d'une ellipse de lumiere sur l'herbe autour d'elle,
   les monstres y redeviennent visibles. Le voile garde ses calques de masque, un par lumiere, croises (mask-composite: intersect) */
const TROU_NUIT = 4.2; /* (3,5 puis 4,2 : « ameliore un peu la luminosite des lampadaires », Mathieu, 09/11/2026) */ /* (2,6 puis 3,5 : « les lampadaires n'eclairent pas trop trop en vrai », Mathieu, 08/11/2026) */ /* (le rayon du cercle de lumiere, en lueurs de la lanterne : 1,6 m pour la petite, 2,6 pour celle sur pied, 3,2 pour la torche) */
/* (08/11/2026, « il faudrait que les monstres ressortent un tout petit peu plus dans le noir », puis « quoique non, juste la lumiere des lampes les revele un
   peu plus », Mathieu) : un monstre qui passe dans le cercle d'une lanterne ou d'une torche allumee s'eclaire (sa couleur relevee de ECLAT_LUMIERE au centre,
   rien au bord) ; ailleurs, la nuit reste entiere. Chaque monstre touche recoit ses propres matieres (elles etaient partagees entre monstres du meme type) */
const ECLAT_LUMIERE = 1.4; /* (1,1 puis 1,4, 09/11/2026) */
function eclaircirMonstres(N, k, rendre) {
  N.mats = N.mats || new Set();
  if (rendre) { N.mats.forEach((M) => { if (M.userData.cNuit) M.color.copy(M.userData.cNuit); }); N.mats.clear(); return; }
  if (!combat) return; const L = (typeof lanternesAnim !== 'undefined' ? lanternesAnim : []).filter((A) => A.a > 0.05 && A.sol && A.sol.parent);
  combat.monstres.forEach((o) => { if (!o.m || o.etat === 'mort') return; const p = o.m.position; let lum = 0;
    L.forEach((A) => { const R = A.portee * A.a, d = Math.hypot(p.x - A.sol.position.x, p.z - A.sol.position.z); if (d < R) lum = Math.max(lum, 1 - (d / R) * (d / R)); });
    if (!lum && !o.m.userData.eclaire) return; o.m.userData.eclaire = lum > 0; const f = 1 + ECLAT_LUMIERE * lum * k;
    o.m.traverse((x) => { if (!x.isMesh || !x.material) return; const pro = (M) => { if (!M.userData.cNuit) { M = M.clone(); M.userData.cNuit = M.color.clone(); N.mats.add(M); } return M; };
      if (Array.isArray(x.material)) { if (x.material.some((M) => !M.color || M.side === T.BackSide || M.transparent)) return; x.material = x.material.map(pro); x.material.forEach((M) => M.color.copy(M.userData.cNuit).multiplyScalar(f)); }
      else { if (!x.material.color || x.material.side === T.BackSide || x.material.transparent) return; x.material = pro(x.material); x.material.color.copy(x.material.userData.cNuit).multiplyScalar(f); } }); });
}
function trousNuit(N) {
  const L = (typeof lanternesAnim !== 'undefined' ? lanternesAnim : []).filter((A) => A.a > 0.05 && A.sol && A.sol.parent);
  const Y = N.trousYeux || []; /* (les yeux des monstres, yeuxNuit) */
  if (!L.length && !Y.length) { if (N.masque) { N.v.style.webkitMaskImage = N.v.style.maskImage = ''; N.masque = false; } return; }
  const W = innerWidth, H = innerHeight, D = new T.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); D.y = 0; D.normalize(); const D2 = new T.Vector3(-D.z, 0, D.x), p = new T.Vector3(), q = new T.Vector3(), g = [];
  const ecran = (v) => [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H];
  L.forEach((A) => { const R = A.portee * A.a; p.copy(A.sol.position).project(camera); const [x, y] = ecran(p);
    q.copy(A.sol.position).addScaledVector(D, R).project(camera); const [x1, y1] = ecran(q); q.copy(A.sol.position).addScaledVector(D2, R).project(camera); const [x2, y2] = ecran(q);
    const rx = Math.hypot(x1 - x, y1 - y), ry = Math.max(4, Math.hypot(x2 - x, y2 - y)); if (x < -rx || x > W + rx || y < -ry || y > H + ry) return;
    g.push('radial-gradient(' + rx.toFixed(0) + 'px ' + ry.toFixed(0) + 'px at ' + x.toFixed(0) + 'px ' + y.toFixed(0) + 'px, transparent 0, transparent 52%, #000 100%)'); });
  Y.forEach(([x, y, r]) => g.push('radial-gradient(' + r.toFixed(1) + 'px ' + r.toFixed(1) + 'px at ' + x.toFixed(1) + 'px ' + y.toFixed(1) + 'px, transparent 0, transparent 55%, #000 100%)'));
  const m = g.join(','); N.v.style.webkitMaskImage = N.v.style.maskImage = m; N.v.style.webkitMaskComposite = 'source-in'; N.v.style.maskComposite = 'intersect'; N.masque = !!m;
}
/* les yeux dans la nuit (08/11/2026, « on a bien travaille les yeux, j'aimerais que ce soit toujours les memes, juste les rendre visibles », Mathieu, apres
   une premiere version en boules de lumiere) : le voile est perce d'un petit trou sur chaque oeil des monstres tournes vers la camera (poserYeux,
   22c-squelettes.js), comme pour les lampes : on voit le vrai oeil du modele, qui luit (son image d'emission). Il disparait le temps d'un clignement. */
function yeuxNuit(N, k, fin) {
  const L = N.trousYeux = []; if (fin && typeof VERSIONS_P10 !== 'undefined') VERSIONS_P10.forEach((nom) => { if (MODELES[nom]) MODELES[nom].traverse((x) => { if (x.isSkinnedMesh && x.material && x.material.emissiveMap) x.material.emissiveIntensity = 1; }); }); /* (le jour revenu, leurs yeux reprennent leur eclat normal : les copies partagent les matieres du modele) */
  if (fin || !(k > 0) || !combat) return;
  const W = innerWidth, H = innerHeight, vers = camera.getWorldDirection(new T.Vector3()).negate(), droite = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize(), p = new T.Vector3(), q = new T.Vector3(), nw = new T.Vector3(), sc = new T.Vector3(), t = performance.now() / 1000;
  combat.monstres.forEach((o) => { if (!o.m || o.etat === 'mort' || !o.m.visible) return;
    if (!o.yeux) { o.yeux = []; o.m.traverse((x) => { if (x.userData && x.userData.oeil) o.yeux.push(x); }); }
    if (!o.yeux.length) return;
    if (!o.peauxYeux) { o.peauxYeux = []; o.m.traverse((x) => { if (x.isSkinnedMesh && x.material && x.material.emissiveMap) o.peauxYeux.push(x); }); } o.peauxYeux.forEach((x) => { x.material.emissiveIntensity = 1 + 1.8 * k; }); /* (« rends un peu plus lumineux leurs yeux », Mathieu, 08/11/2026 : la nuit, l'image d'emission luit 2,8 fois plus) */
    if (t > (o.clignSuivant || 0)) { o.clign = t; o.clignSuivant = t + 2.5 + Math.random() * 4; } if (t - (o.clign || -9) < 0.13) return; /* (il cligne) */
    o.yeux.forEach((e) => { const D = e.userData.oeil; e.getWorldPosition(p); nw.fromArray(D.n).transformDirection(e.matrixWorld); if (nw.dot(vers) < 0.05) return; /* (de dos, pas d'yeux) */
      e.getWorldScale(sc); q.copy(p).addScaledVector(droite, D.r * sc.x); p.project(camera); q.project(camera); if (p.z > 1) return;
      const x = (p.x + 1) / 2 * W, y = (1 - p.y) / 2 * H, r = Math.min(46, Math.max(6, Math.hypot((q.x - p.x) / 2 * W, (q.y - p.y) / 2 * H) * 2.4));
      if (x < -r || x > W + r || y < -r || y > H + r) return; L.push([x, y, r]); }); });
  (combat.tetesAnc || []).forEach((h) => { p.copy(h.m.position); q.copy(p).addScaledVector(droite, h.r); p.project(camera); q.project(camera); if (p.z > 1) return; /* (les tetes de l'Ancestral, sorties de terre) */
    const x = (p.x + 1) / 2 * W, y = (1 - p.y) / 2 * H, r = Math.min(160, Math.max(14, Math.hypot((q.x - p.x) / 2 * W, (q.y - p.y) / 2 * H) * 2)); L.push([x, y, r]); });
}
function nuitForet() {
  if (!NUIT_F) { const v = document.createElement('div'); v.className = 'nuit-foret'; v.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;z-index:1;background:radial-gradient(ellipse at 50% 48%,rgba(10,40,48,.16) 0%,rgba(6,22,30,.38) 45%,rgba(3,10,16,.66) 100%)'; /* (au-dessus de la scene, sous l'interface : la nuit lunaire, elle, ne teinte que le ciel) */
    const st = document.createElement('style'); st.textContent = '@keyframes luciole{0%{transform:translate(0,0);opacity:.2}25%{opacity:1}50%{transform:translate(18px,-22px);opacity:.4}75%{opacity:.95}100%{transform:translate(-10px,8px);opacity:.2}}'; document.head.appendChild(st);
    v.innerHTML = Array.from({ length: 26 }, () => '<i style="position:absolute;left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (20 + Math.random() * 75).toFixed(1) + '%;width:5px;height:5px;border-radius:50%;background:#e8ff9a;box-shadow:0 0 10px 3px rgba(214,255,120,.75);animation:luciole ' + (4 + Math.random() * 5).toFixed(1) + 's ease-in-out ' + (-Math.random() * 6).toFixed(1) + 's infinite alternate"></i>').join('');
    canvas.insertAdjacentElement('afterend', v);
    const L = []; scene.traverse((o) => { if (o.isLight) L.push({ o, i: o.intensity, c: o.color.clone() }); }); NUIT_F = { v, L, t: 0 }; }
  const N = NUIT_F, bleu = new T.Color('#7fa6d8'), c0 = combat; N.c0 = c0; N.fin = 0; if (N.actif) return; /* (deja la, d'une vague relancee en mode test : elle se rattache au nouveau combat, 08/11/2026) */ N.actif = true; N.t = 0; animerLanternes.t = 0; /* (les lanternes s'allument tout de suite) */
  effets.push((dt) => { N.t += dt; const vivant = combat === N.c0 && combat && !combat.fin; if (!vivant) N.fin += dt; const fin = N.fin;
    const k = Math.min(1, N.t / 1.6) * Math.max(0, 1 - fin / 1.4); N.v.style.opacity = String(k); yeuxNuit(N, k); trousNuit(N); eclaircirMonstres(N, k);
    N.L.forEach((l) => { l.o.intensity = l.i * (1 - 0.62 * k); l.o.color.copy(l.c).lerp(bleu, 0.55 * k); });
    if (fin >= 1.4) { N.v.style.opacity = '0'; animerLanternes.t = 0; eclaircirMonstres(N, 0, true); yeuxNuit(N, 0, true); N.v.style.webkitMaskImage = N.v.style.maskImage = ''; N.masque = false; N.L.forEach((l) => { l.o.intensity = l.i; l.o.color.copy(l.c); }); N.actif = false; return true; } return false; });
}
function meteorite(mo, x, z, U, c0) { /* une meteorite : un cercle s'annonce, une pierre de lune tombe du ciel en biais dans une trainee, cratere et eclats a l'impact */
  const prepa = 1.25, g = rocherLune(), y = solA(x, z), de = new T.Vector3(x - 7, y + 20, z - 4); g.scale.setScalar(1.3); g.visible = false; scene.add(g); let t = 0;
  zoneDanger({ mo, x, z, r: U.R, duree: prepa, effet: (d) => { jeter(g); secousse(0.16, 0.25); craterLune(x, y + 0.02, z, U.R * 0.7, 2.6); eclatsRoche(x, y, z, 7, 0.9); onde(x, y, z, U.R * 1.6, '#bfe6ff', 0.45, 0.8, true);
    emettre(FX_LUM, 14, { x, y: y + 0.3, z, r: 0.3, dv: 3.5, haut: true, vie: [0.4, 0.7], taille: [0.16, 0.03], c: ['#ffffff', '#a8ecff'], grav: 6 }); emettre(FX_FUM, 8, { x, y: y + 0.4, z, r: 0.5, v: [0, 0.8, 0], vie: [0.8, 1.2], taille: [0.6, 1.4], c: ['#e2e6ee', '#b8bec8'], a: 0.5 });
    const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) blesserPerso(Math.max(1, Math.round(degSort(mo) * U.x)), mo); } });
  effets.push((dt) => { t += dt; if (combat !== c0) { jeter(g); return true; } const k = (t - 0.45) / (prepa - 0.45); if (k < 0) return false; if (k >= 1) return true; g.visible = true;
    g.position.lerpVectors(de, new T.Vector3(x, y + 0.4, z), k * k); g.rotation.x += dt * 8; g.rotation.y += dt * 5;
    emettre(FX_LUM, 3, { x: g.position.x, y: g.position.y, z: g.position.z, r: 0.35, vie: [0.25, 0.45], taille: [0.4, 0.04], c: ['#ffffff', k > 0.5 ? '#ffd27a' : '#9fdcff'] }); emettre(FX_FUM, 1, { x: g.position.x, y: g.position.y, z: g.position.z, vie: [0.4, 0.6], taille: [0.4, 0.9], c: ['#c8d4e8', '#8a96aa'], a: 0.4 }); });
}
function capUltime(mo, ctx) {
  const { pp, sortPret } = ctx, U = mo.d.ultime; if (!U || combat.deroute != null) return;
  if (mo.ultimeT == null) mo.ultimeT = U.periode - 12; /* (la premiere, 12 s apres son arrivee) */
  if (!sortPret('ultimeT', U.periode) || mo.geste) return;
  const c0 = combat; mo.ultimeT = 0; mo.bloqueT = 1.6; mo.cd = Math.max(mo.cd || 0, 1.8); gesteSort(mo, gesteDe(mo, 'ultime', 'sort'), 1.2); nuitTombe(U.duree + 2.2); flashLumiere(mo.x, mo.m.position.y + 3, mo.z, '#bfe6ff', 2.5, 9, 0.6);
  toast(leNom(mo.d) + ' invoque la nuit lunaire : des météorites vont tomber, sors des cercles !', 'alerte');
  let t = 0, n = 0; effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') return true; if (t < 1.2) return false;
    while (n < U.n && t >= 1.2 + n * (U.duree / U.n)) { const p = paysanMesh.position, versToi = n % 2 === 0, a = Math.random() * Math.PI * 2, r = versToi ? Math.random() * 1.2 : 2.5 + Math.random() * 7, q = pointValide(p.x, p.z, p.x + Math.cos(a) * r, p.z + Math.sin(a) * r); meteorite(mo, q.x, q.z, U, c0); n++; } /* (une sur deux vers toi, les autres tout autour) */
    return n >= U.n; });
}
function capLance(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.lance && !(mo.carapace > 0)) { /* le Chafer Cuirasse lance sa lance d'os quand le perso se tient loin : une bande rouge jusqu'a lui (1 s pour en sortir), puis la lance file ;
       un batiment sur sa route l'arrete et prend le coup (« il est tellement lent et avec un sort de cac que c'est facile a mort », Mathieu, 14/10/2026) */
    const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
    if (sortPret('lanceT', mo.d.lance) && dP > 3.2 && dP < 14) {
      mo.lanceT = 0; const a = Math.atan2(pp.x - mo.x, pp.z - mo.z), L = Math.min(14, dP + 3), f = pointValide(mo.x, mo.z, mo.x + Math.sin(a) * L, mo.z + Math.cos(a) * L);
      let cleB = null; { const L0 = Math.hypot(f.x - mo.x, f.z - mo.z), bats = clesBats().filter((k) => !enRuine(k)).map((k) => [k, zoneBat(k)]).filter(([, z]) => z);
        for (let d = 1.2; d <= L0 && !cleB; d += 0.2) { const x = mo.x + Math.sin(a) * d, z = mo.z + Math.cos(a) * d, b = bats.find(([, zb]) => Math.abs(x - zb.x) < zb.hw + 0.2 && Math.abs(z - zb.z) < zb.hd + 0.2);
          if (b) { cleB = b[0]; f.x = x; f.z = z; } } }
      mo.ry = a; mo.bloqueT = 1.0 + 0.35; mo.frappe = 0.3; gesteSort(mo, gesteDe(mo, 'lance', 'tir'), 1.0);
      if (!combat.lanceVu) { combat.lanceVu = true; toast(leNom(mo.d) + ' ' + (mo.d.lanceNom || 'lève sa lance d\'os') + ' : sors de la bande rouge, ou cache-toi derrière un bâtiment !', 'alerte'); }
      /* (31/10/2026, « il me semble n'avoir jamais vu une lance partir », Mathieu : un petit cylindre partait du ventre du Chafer a la fin de la bande et
         traversait 14 cases en un quart de seconde, invisible) Maintenant le tir part avant la fin de la bande et y arrive pile, a une vitesse qu'on suit
         des yeux, en cloche ; la lance d'os du Chafer apparait au-dessus de son epaule des l'annonce, il l'arme en la tirant en arriere, la jette, et elle
         reste plantee au sol un instant. La sagaie de Jav et le rocher du Golem partent de leur main, au meme rythme */
      const c0 = combat, estOs = !mo.d.projectile, vers = new T.Vector3(f.x, solA(f.x, f.z) + 0.25, f.z), haut0 = mo.m.position.y + mo.haut * (estOs ? 0.95 : 0.6);
      const dist = Math.hypot(f.x - mo.x, f.z - mo.z), vol = Math.max(0.3, Math.min(0.6, dist / 18)), H = 0.6 + dist * 0.05, dx = Math.sin(a), dz = Math.cos(a), cote = 0.35 * mo.d.ombre;
      const os = mo.d.projectile === 'rocher' ? rocherLune() /* (le rocher de lune du Golem lunaire, 28/10/2026 ; veine de cristaux, 01/11/2026) */ : mo.d.projectile === 'sagaie' ? sagaieVolante() : lanceOs();
      if (mo.d.projectile === 'rocher') { const q = new T.Vector3(mo.x + dx * mo.d.ombre * 0.4, solA(mo.x, mo.z), mo.z + dz * mo.d.ombre * 0.4); craterLune(q.x, q.y + 0.02, q.z, 0.6, 1.8); mottes(q.x, q.y, q.z, 5, 0.7); emettre(FX_FUM, 5, { x: q.x, y: q.y + 0.3, z: q.z, r: 0.3, v: [0, 0.8, 0], vie: [0.6, 0.9], taille: [0.5, 1.0], c: ['#e2e6ee', '#b8bec8'], a: 0.5 }); } /* (il l'arrache du sol : un trou, de la terre, 01/11/2026) */
      os.visible = estOs; scene.add(os); let t = 0, de = null; const avant = new T.Vector3(), bras = estOs && mo.m.getObjectByName('bras_lance');
      effets.push((dt2) => { t += dt2;
        if (combat !== c0 || c0.fin || (!de && mo.etat !== 'actif')) { jeter(os); return true; }
        if (!de) { /* l'annonce : la lance d'os au-dessus de son epaule, pointee vers toi, qu'il tire en arriere ; s'il a un bras qui lance, elle est dans sa main et le bras l'arme */
          if (t < 1.0 - vol && bras) { const k = Math.min(1, t / (1.0 - vol)); poseBras(bras, 2.7 * ease(k * 1.4)); bras.updateMatrixWorld(true); const h = bras.localToWorld(mainDuBras(bras).clone()), u = new T.Vector3(vers.x - h.x, 0, vers.z - h.z).normalize();
            os.position.copy(h).addScaledVector(u, 0.35); os.position.y += 0.15; os.lookAt(vers.x, vers.y + 2.5 * (1 - k * 0.6), vers.z); if (Math.random() < dt2 * 12) lueur(os.localToWorld(new T.Vector3(0, 0, 1.5)), (AURAS[mo.d.element] || { int: '#fff1c0' }).int, 1.4, 0.3); return false; }
          if (t < 1.0 - vol) { if (estOs) { const k = Math.min(1, t / (1.0 - vol)), r = 0.2 + 0.55 * k * k; os.position.set(mo.x + dz * cote - dx * r, haut0 + 0.25 * k, mo.z - dx * cote - dz * r); os.lookAt(vers.x, vers.y + 1.5 * (1 - k), vers.z);
              if (Math.random() < dt2 * 12) lueur(os.localToWorld(new T.Vector3(0, 0, 1.3)), (AURAS[mo.d.element] || { int: '#fff1c0' }).int, 1.4, 0.3); } return false; }
          de = estOs ? os.position.clone() : (mainSquelette(mo) || new T.Vector3(mo.x + dx * 0.6, haut0, mo.z + dz * 0.6)); os.visible = true; os.position.copy(de); mo.frappe = 0.4; if (estOs) secousse(0.06, 0.15);
          if (bras) { let s3 = 0; effets.push((d4) => { s3 += d4; if (!bras.parent) return true; poseBras(bras, s3 < 0.16 ? 2.7 - 3.7 * ease(s3 / 0.16) : -1.0 * (1 - ease((s3 - 0.35) / 0.45))); return s3 > 0.8; }); } } /* (le grand mouvement vers l'avant, puis le bras retombe) */
        const k = Math.min(1, (t - (1.0 - vol)) / vol); avant.copy(os.position); os.position.lerpVectors(de, vers, k); os.position.y += Math.sin(k * Math.PI) * H;
        if (mo.d.projectile === 'rocher') { os.rotation.x += dt2 * 9; os.rotation.y += dt2 * 6; } else if (os.position.distanceToSquared(avant) > 1e-6) os.lookAt(os.position.clone().multiplyScalar(2).sub(avant));
        if (mo.d.projectile === 'rocher' && Math.random() < 0.8) emettre(FX_LUM, 2, { x: os.position.x, y: os.position.y, z: os.position.z, r: 0.3, vie: [0.3, 0.5], taille: [0.16, 0.02], c: ['#ffffff', '#a8ecff'] }); /* (une trainee bleutee) */
        traineeFleche(os.position); if (estOs && Math.random() < 0.6) emettre(FX_FUM, 1, { x: os.position.x, y: os.position.y, z: os.position.z, vie: [0.25, 0.4], taille: [0.2, 0.45], c: ['#efe6cf', '#d8cfb8'], a: 0.5 });
        if (estOs && AURAS[mo.d.element]) emettre(FX_LUM, 2, { x: os.position.x, y: os.position.y, z: os.position.z, r: 0.25, v: [0, 0.6, 0], vie: [0.4, 0.7], taille: [0.14, 0.02], c: AURAS[mo.d.element].c }); /* (une trainee a son element : l'esprit du Chafer, 01/11/2026) */
        if (k < 1) return false;
        if (mo.d.projectile === 'rocher') { jeter(os); impactRocherLune(vers); return true; } /* (01/11/2026) */
        if (estOs && mo.d.element) impactElement(mo.d.element, vers.x, vers.z, 1.6); /* (la lance d'os du Chafer : l'esprit, 01/11/2026) */
        else { pouf(vers.x, vers.y - 0.2, vers.z, 1.8, mo.d.projectile === 'sagaie' ? '#a8a294' : '#efe6cf'); poussiere(vers.x, vers.y - 0.25, vers.z, 8, 0.9, '#d8c6a0'); etoileImpact(vers.clone().setY(vers.y + 0.3), 0.8, '#efe6cf'); }
        const y0 = os.position.y; let s2 = 0; effets.push((d3) => { s2 += d3; if (combat !== c0) { jeter(os); return true; } if (s2 > 1.2) os.position.y = y0 - (s2 - 1.2) * 1.5; if (s2 > 1.8) { jeter(os); return true; } }); /* (plantee au sol, puis elle s'enfonce) */
        return true; });
      zoneDanger({ mo, x: mo.x, z: mo.z, x2: f.x, z2: f.z, larg: 1.3, duree: 1.0, effet: (d) => {
        const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) { const k = lanceDeLoin(mo, Math.hypot(p2.x - d.x, p2.z - d.z)); blesserPerso(Math.round(degSort(mo) * k), mo); if (k >= 1.5) chiffre('De loin ×' + String(Math.round(k * 10) / 10).replace('.', ','), new T.Vector3(p2.x, p2.y + 2.6, p2.z), 'gros'); }
        if (cleB && combat && !combat.fin) blesserBat(cleB, degatsBatiment(1, mo));
      } });
    }
  }
}
function epinesTouche(mo) { /* ses epines te renvoient le coup : elles etincellent, un eclat file de lui jusqu'a toi (31/10/2026) */
  const p = paysanMesh.position, de = new T.Vector3(mo.x, mo.m.position.y + (mo.haut || 3) * 0.5, mo.z), vers = new T.Vector3(p.x, p.y + 1, p.z);
  etincelle(de, 1, '#fff1c0'); etoileImpact(vers, 0.8, '#efe0b8'); emettre(FX_VIF, 8, { x: de.x, y: de.y, z: de.z, r: 0.3, v: [(vers.x - de.x) * 3, (vers.y - de.y) * 3, (vers.z - de.z) * 3], dv: 1.5, vie: [0.2, 0.3], taille: [0.1, 0.03], c: ['#ffffff', '#efe0b8'], a: 1, etire: 0.04 });
  if (mo.epinesC) mo.epinesK = 1.25; /* (elles se herissent un instant) */
}
/* LE JET D'UN BOSS (31/10/2026, par Discord) : quand tu restes loin de lui, il arme son arme au-dessus de sa tete (la hache du Bworker, un rocher
   arrache du sol par le Craqueleur), un grand cercle rouge s'annonce sous toi, puis l'arme part en cloche, tourne sur elle-meme et s'ecrase a la fin
   du cercle (choc, onde, sol fendu) ; la hache reste plantee un instant, le rocher eclate. Fiche : jet: { nom, arme, periode, loin, R, prepa, x } */
function armeJet(type, k) {
  const g = new T.Group();
  if (type === 'fagot') { /* (le fagot de l'Abrakleur, 08/11/2026 : six branches liees de deux brins de lierre) */
    for (let i = 0; i < 6; i++) { const b = new T.Mesh(new T.CylinderGeometry(0.05 * k, 0.07 * k, (1.5 + (i % 3) * 0.2) * k, 6), mat(i % 2 ? '#8a6a48' : '#a5865f')), u = i * 1.05; b.position.set(Math.cos(u) * 0.11 * k, (i % 3) * 0.05 * k, Math.sin(u) * 0.11 * k); b.rotation.set(Math.sin(u) * 0.08, 0, Math.cos(u) * 0.08); g.add(b); }
    for (const y of [-0.35, 0.3]) { const l = new T.Mesh(new T.TorusGeometry(0.19 * k, 0.035 * k, 6, 14), mat('#4f7a2c')); l.rotation.x = Math.PI / 2; l.position.y = y * k; g.add(l); }
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return g; }
  if (type === 'lanceBois') { /* (la lance de l'Abrakleur, 08/11/2026, « une espece de branche pointue, comme une lance en bois », Mathieu : une longue branche droite,
       l'ecorce, deux noeuds, une feuille, la pointe taillee en bois clair ; la pointe vers +Z, elle vole pointe en avant) */
    const L = 2.4 * k, tige = new T.Mesh(new T.CylinderGeometry(0.05 * k, 0.075 * k, L, 7), mat('#7a5634')); tige.rotation.x = Math.PI / 2; g.add(tige);
    const pointe = new T.Mesh(new T.ConeGeometry(0.075 * k, 0.55 * k, 7), mat('#dcbc8c')); pointe.rotation.x = Math.PI / 2; pointe.position.z = L / 2 + 0.27 * k; g.add(pointe);
    for (const z of [-0.55, 0.3]) { const n = new T.Mesh(new T.SphereGeometry(0.08 * k, 6, 5), mat('#5e4128')); n.position.set(0.045 * k, 0, z * k); g.add(n); }
    const f = new T.Mesh(new T.SphereGeometry(0.13 * k, 6, 4), mat('#5f9a3a')); f.scale.set(1, 0.3, 1.7); f.position.set(0.12 * k, 0, -L / 2 + 0.25 * k); g.add(f);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return g; }
  if (type === 'hache') { const manche = new T.Mesh(new T.CylinderGeometry(0.06 * k, 0.07 * k, 2.2 * k, 8), mat('#6a4528')); g.add(manche);
    const f = new T.Shape(); f.moveTo(0, -0.55); f.quadraticCurveTo(0.95, -0.6, 0.85, 0); f.quadraticCurveTo(0.95, 0.6, 0, 0.55); f.lineTo(0.1, 0); f.lineTo(0, -0.55);
    for (const s of [-1, 1]) { const l = new T.Mesh(new T.ExtrudeGeometry(f, { depth: 0.06, bevelEnabled: false }), mat('#9aa3ad')); l.geometry.translate(0, 0, -0.03); l.scale.set(s * k, k, k); l.position.y = 0.7 * k; g.add(l);
      const fil = new T.Mesh(new T.ExtrudeGeometry(f, { depth: 0.07, bevelEnabled: false }), mat('#dfe6ec')); fil.geometry.translate(0, 0, -0.035); fil.scale.set(s * k * 1.02, k * 0.92, k); fil.position.y = 0.7 * k; fil.position.x = s * 0.06 * k; g.add(fil); }
    const pique = new T.Mesh(new T.ConeGeometry(0.1 * k, 0.4 * k, 6), mat('#9aa3ad')); pique.position.y = 1.3 * k; g.add(pique); }
  else { const r = new T.Mesh(new T.DodecahedronGeometry(0.75 * k, 0), mat('#7d7468')); r.scale.set(1, 0.8, 1.1); g.add(r); const r2 = new T.Mesh(new T.DodecahedronGeometry(0.4 * k, 0), mat('#5f5850')); r2.position.set(0.45 * k, 0.3 * k, 0.2 * k); g.add(r2);
  } /* (un rocher brut : plus de fentes de lave, le Craqueleur est tout en terre, 01/11/2026) */
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return g;
}
function capJet(mo, ctx) {
  const { pp, sortPret } = ctx, J = mo.d.jet; if (!J || combat.deroute != null || mo.carapace > 0) return;
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('jetT', J.periode)) return; if (dP < J.loin || dP > 15) { mo.jetT = J.periode; return; } /* (pret, il attend que tu sois loin) */
  mo.jetT = 0; const c0 = combat, cx = pp.x, cz = pp.z, a = Math.atan2(cx - mo.x, cz - mo.z), k = Math.max(1, (mo.haut || 3) / 3.2), arme = armeJet(J.arme, k), hache = J.arme === 'hache', lanceB = J.arme === 'lanceBois';
  mo.ry = a; mo.bloqueT = J.prepa + 0.4; mo.frappe = 0.3; scene.add(arme);
  if (!c0['jetVu' + J.arme]) { c0['jetVu' + J.arme] = true; toast(leNom(mo.d) + (hache ? ' lève sa grande hache pour te la lancer' : J.arme === 'fagot' ? ' arme son fagot pour te le lancer en cloche' : lanceB ? ' arme sa lance de bois pour te la lancer en cloche' : ' arrache un rocher du sol pour te le lancer') + ' : sors du cercle rouge !', 'alerte'); }
  gesteSort(mo, gesteDe(mo, 'jet', 'sort'), Math.max(0.3, J.prepa - 0.5)); /* (un monstre a squelette : son geste de lancer, l'Abrakleur, 08/11/2026) */
  if (!hache && !lanceB && J.arme !== 'fagot') { const y = solA(mo.x, mo.z); poussiere(mo.x + Math.sin(a) * 1.2, y, mo.z + Math.cos(a) * 1.2, 10, 1, '#d8c6a0'); mottes(mo.x + Math.sin(a) * 1.2, y, mo.z + Math.cos(a) * 1.2, 6, 0.9); }
  const vol = Math.max(0.45, Math.min(0.75, dP / 16)), tl = J.prepa - vol; let t = 0, de = null; const vers = new T.Vector3(cx, solA(cx, cz) + (hache ? 0.6 : 0.5) * k, cz), H = 2.5 + dP * 0.12;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || (!de && mo.etat !== 'actif')) { jeter(arme); mo.penche = 0; return true; }
    if (t < tl) { const u = Math.min(1, t / tl), h = mo.m.position.y + (mo.haut || 3) * (0.75 + 0.45 * u); /* (il l'arme au-dessus de sa tete, tire en arriere) */
      arme.position.set(mo.x - Math.sin(a) * 0.6 * u, h, mo.z - Math.cos(a) * 0.6 * u); if (lanceB) arme.lookAt(arme.position.x + Math.sin(a), arme.position.y + 0.9 - 0.5 * u, arme.position.z + Math.cos(a)); else arme.rotation.set(-1.2 * u, a, 0); mo.penche = -0.22 * u; return false; } /* (la lance, tenue pointe en l'air vers toi) */
    if (!de) { de = arme.position.clone(); mo.penche = 0.3; secousse(0.06, 0.15); }
    const u = Math.min(1, (t - tl) / vol), prevL = lanceB ? arme.position.clone() : null; mo.penche = 0.3 * (1 - u); arme.position.lerpVectors(de, vers, u); arme.position.y += Math.sin(u * Math.PI) * H;
    if (hache) arme.rotation.set(-1.2 - u * Math.PI * 4, a, 0); else if (lanceB) { if (arme.position.distanceToSquared(prevL) > 1e-6) arme.lookAt(arme.position.clone().multiplyScalar(2).sub(prevL)); } else arme.rotation.set(u * 9, a + u * 5, 0); traineeFleche(arme.position); /* (la lance vole pointe en avant, sur sa courbe) */
    if (u < 1) return false;
    if (lanceB) { arme.position.y = vers.y - 0.35 * k; poussiere(cx, solA(cx, cz), cz, 8, 0.8, '#b89a72'); let s2 = 0; effets.push((d3) => { s2 += d3; if (combat !== c0) { jeter(arme); return true; } if (s2 > 1.0) arme.position.y -= d3 * 1.6; if (s2 > 1.6) { pouf(cx, solA(cx, cz), cz, 1.2, '#a5865f'); jeter(arme); return true; } }); } /* (plantee dans le sol un instant, puis elle s'enfonce) */
    else if (hache) { arme.rotation.set(-2.3, a, 0); arme.position.y = vers.y - 0.2; let s2 = 0; effets.push((d3) => { s2 += d3; if (combat !== c0) { jeter(arme); return true; } if (s2 > 1.2) arme.position.y -= d3 * 2; if (s2 > 1.7) { pouf(cx, solA(cx, cz), cz, 1.5, '#9aa3ad'); jeter(arme); return true; } }); }
    else { jeter(arme); emettre(FX_VIF, 20, { x: cx, y: vers.y, z: cz, r: 0.5, dv: 5, haut: true, vie: [0.4, 0.8], taille: [0.16, 0.06], c: ['#8a8070', '#5f5850'], grav: 10, frein: 1 }); emettre(FX_FUM, 6, { x: cx, y: vers.y, z: cz, r: 0.4, v: [0, 0.8, 0], vie: [0.6, 0.9], taille: [0.5, 1.1], c: ['#b89a72', '#9a8262'], a: 0.55 }); } /* (de la poussiere, plus d'etincelles de lave) */
    return true; });
  zoneDanger({ mo, x: cx, z: cz, r: J.R, duree: J.prepa, effet: (d) => { const y = solA(cx, cz), el = J.element || mo.d.element; if (el) { impactElement(el, cx, cz, J.R * 1.1); secousse(0.2, 0.3); } else { impactMarteau(cx, y, cz); onde(cx, y, cz, J.R * 1.6, '#ffd27a', 0.5, 0.7); } /* (la hache : terre ; le rocher de lave : feu, 01/11/2026) */
    const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) blesserPerso(Math.max(1, Math.round(degSort(mo) * J.x)), mo); } });
}
/* LA FAILLE du Craqueleur Legendaire (31/10/2026) : il frappe le sol, une bande s'annonce jusqu'a toi, puis le sol eclate en chapelet depuis ses pieds
   jusqu'au bout de la bande, rochers et braises, une eruption toutes les 0,09 s : tu as le temps d'en sortir de cote. Fiche : faille: { periode, L, x } */
function capFaille(mo, ctx) {
  const { pp, sortPret } = ctx, F = mo.d.faille; if (!F || (mo.ancre && !(F.poursuite && F.poursuite.ancre)) || mo.regard || mo.lance || combat.deroute != null) return; /* (poursuite.ancre : meme enracine, il lance ses racines a ta poursuite, 10/11/2026) */
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('failleT', F.periode)) return; /* (31/10/2026, par Discord, « la faille, ca te touche peu importe ou tu es et ou est le Craqueleur, faut esquiver, pas de portee minimum », Mathieu : plus de portee mini ni maxi, elle court jusqu'a toi et un peu au-dela) */
  mo.failleT = 0; const c0 = combat, a = Math.atan2(pp.x - mo.x, pp.z - mo.z), x0 = mo.x + Math.sin(a) * 1.2, z0 = mo.z + Math.cos(a) * 1.2, L = Math.max(4, dP + 3), f = pointValide(x0, z0, x0 + Math.sin(a) * L, z0 + Math.cos(a) * L), prepa = F.poursuite ? 0.6 : 1.0;
  if (!mo.ancre) { mo.ry = a; prepaSeisme(mo, mo.x, mo.z, 0.01, prepa); } else { const y = mo.m.position.y; secousse(0.15, 0.3); mottes(mo.x, y, mo.z, 10, 2.2); poussiere(mo.x, y, mo.z, 8, 2.4, '#8a6a48'); } /* (enracine, il garde sa pose : la terre se souleve autour de lui) */ mo.bloqueT = prepa + 0.5;
  if (F.poursuite) { const N = F.poursuite.n || 1; if (!c0.poursuiteVu) { c0.poursuiteVu = true; toast(leNom(mo.d) + ' lance ' + (N > 1 ? 'deux racines' : 'ses racines') + ' à ta poursuite : elles vont plus vite que toi mais tournent mal, esquive sur le côté au dernier moment !', 'alerte'); }
    let tp = 0, k = 0; effets.push((dt) => { tp += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') return true; /* (N racines, 0,7 s l'une apres l'autre, une de chaque cote : en tenaille) */
      while (k < N && tp >= prepa + k * 0.7) { const pq = paysanMesh.position, ap = Math.atan2(pq.x - mo.x, pq.z - mo.z); racinesPoursuite(mo, F, ap + (N > 1 ? (k % 2 ? -0.9 : 0.9) : 0)); k++; } return k >= N; }); return; }
  if (!c0.failleVu) { c0.failleVu = true; toast(leNom(mo.d) + (F.racines ? ' fait courir ses racines jusqu\'à toi : sors de la bande, elles jaillissent de lui vers toi !' : ' fend le sol jusqu\'à toi : sors de la bande, la faille éclate de lui vers toi !'), 'alerte'); }
  let touche = false; const dg = Math.max(1, Math.round(degSort(mo) * F.x));
  zoneDanger({ mo, x: x0, z: z0, x2: f.x, z2: f.z, larg: 1.6, duree: prepa, effet: () => {
    const Lr = Math.hypot(f.x - x0, f.z - z0), n = Math.max(3, Math.round(Lr / 1.3)); secousse(0.2, 0.4);
    for (let i = 0; i <= n; i++) { const u = i / n, x = x0 + (f.x - x0) * u, z = z0 + (f.z - z0) * u; setTimeout(() => { if (combat !== c0 || c0.fin) return; const y = solA(x, z);
      solFendu(x, y, z, 1.4, false); poussiere(x, y, z, 6, 0.8, F.racines ? '#8a6a48' : '#b89a72'); mottes(x, y, z, 3, 1.1); emettre(FX_VIF, 5, { x, y: y + 0.1, z, r: 0.4, dv: 3, haut: true, vie: [0.4, 0.6], taille: [0.1, 0.05], c: F.racines ? ['#5a4030', '#6f9a3a'] : ['#7a5a3a', '#9a7a52'], grav: 10 }); /* (la faille : de la terre et du gravier, plus de braises, 01/11/2026) */
      if (F.racines) racineJaillit(x, y, z, i);
      else if (i % 2 === 0) { const r = new T.Mesh(new T.DodecahedronGeometry(0.3, 0), mat('#7d7468')); r.castShadow = true; fxVie(r, 0.7, (k) => { r.position.set(x + (k - 0.5) * 0.3, y + Math.sin(k * Math.PI) * 1.6, z); r.rotation.set(k * 8, k * 5, 0); }); }
      const p2 = paysanMesh.position; if (!touche && Math.hypot(p2.x - x, p2.z - z) < 1.1) { touche = true; blesserPerso(dg, mo); } }, i * 90); }
  } });
}
/* LES RACINES QUI TE POURSUIVENT (10/11/2026, « soit ca nous pourchasse, soit faut que ce soit moins simple a eviter comme c'est actuellement », Mathieu) : une butte
   de terre et son cercle rouge partent de lui et filent vers toi (P.v unites par seconde, plus vite que toi), en braquant vers toi d'au plus P.tour radians par
   seconde : on ne la distance pas, on l'esquive d'un pas de cote au dernier moment, puis elle fait demi-tour. Des racines jaillissent dans son sillage ; elle te
   rattrape : ses degats (F.x fois ses sorts) et enracine P.colle s ; au bout de P.duree s, elle eclate sur place */
function racinesPoursuite(mo, F, a0) { /* (a0 : de quel cote de lui elle part ; elle file d'abord tout droit, puis braque vers toi) */
  const c0 = combat, P = F.poursuite, dg = Math.max(1, Math.round(degSort(mo) * F.x)), p0 = paysanMesh.position, dep = a0 == null ? mo.ry : a0;
  let x = mo.x + Math.sin(dep) * 1.4, z = mo.z + Math.cos(dep) * 1.4, a = a0 == null ? Math.atan2(p0.x - x, p0.z - z) : a0, t = 0, tr = 0, k = 0;
  const g = new T.Group(), disque = new T.Mesh(new T.CircleGeometry(P.R, 28), new T.MeshBasicMaterial({ color: '#e2413a', transparent: true, opacity: 0.3, depthWrite: false })),
    bord = new T.Mesh(new T.RingGeometry(P.R - 0.12, P.R, 28), new T.MeshBasicMaterial({ color: '#e2413a', transparent: true, opacity: 0.95, depthWrite: false, side: T.DoubleSide }));
  [disque, bord].forEach((m) => { m.rotation.x = -Math.PI / 2; m.renderOrder = 2; g.add(m); });
  const butte = maille(new T.SphereGeometry(0.5, 9, 6), '#5a4030'); butte.scale.set(1, 0.35, 1); g.add(butte); scene.add(g);
  const danger = { x, z, r: P.R }; (c0.dangers = c0.dangers || []).push(danger);
  const fin = (touche) => { const y = solA(x, z); secousse(touche ? 0.3 : 0.15, 0.35); mottes(x, y, z, 10, 1.2); poussiere(x, y, z, 10, 1.2, '#8a6a48');
    for (let i = 0; i < 5; i++) racineJaillit(x + Math.sin(i * 1.26) * 0.5, y, z + Math.cos(i * 1.26) * 0.5, i);
    jeter(g); const j = c0.dangers ? c0.dangers.indexOf(danger) : -1; if (j >= 0) c0.dangers.splice(j, 1); };
  effets.push((dt) => {
    if (combat !== c0 || c0.fin || mo.etat !== 'actif') { jeter(g); const j = c0.dangers ? c0.dangers.indexOf(danger) : -1; if (j >= 0) c0.dangers.splice(j, 1); return true; }
    t += dt; const pp = paysanMesh.position, d = Math.atan2(Math.sin(Math.atan2(pp.x - x, pp.z - z) - a), Math.cos(Math.atan2(pp.x - x, pp.z - z) - a));
    a += Math.max(-P.tour * dt, Math.min(P.tour * dt, d)); const q = pointValide(x, z, x + Math.sin(a) * P.v * dt, z + Math.cos(a) * P.v * dt); x = q.x; z = q.z; danger.x = x; danger.z = z;
    const y = solA(x, z); g.position.set(x, y + 0.06, z); butte.rotation.y += dt * 6;
    if ((tr += dt) >= 0.1) { tr = 0; k++; mottes(x, y, z, 2, 0.5); poussiere(x, y, z, 2, 0.6, '#8a6a48'); racineJaillit(x - Math.sin(a) * 0.7, y, z - Math.cos(a) * 0.7, k); }
    if (Math.hypot(pp.x - x, pp.z - z) < P.R) { blesserPerso(dg, mo); if (combat && !combat.fin) coller(P.colle || 0.6, 'Enraciné !'); fin(true); return true; }
    if (t >= P.duree) { fin(false); return true; }
    return false;
  });
}
/* une racine du Chene Mou qui jaillit du sol, se dresse en se tordant et replonge (08/11/2026, ses racines en ligne) */
function racineJaillit(x, y, z, i) {
  const g = new T.Group(), a = i * 2.39, pique = maille(new T.ConeGeometry(0.24, 1.6, 6), i % 2 ? '#5a4030' : '#4a3424'); pique.position.y = 0.8; g.add(pique);
  const bout = maille(new T.ConeGeometry(0.1, 0.35, 4), '#6f9a3a'); bout.position.set(0.12, 1.35, 0); bout.rotation.z = -0.8; g.add(bout); g.rotation.y = a;
  fxVie(g, 0.85, (k) => { const h = k < 0.3 ? k / 0.3 : k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3; g.position.set(x, y - 1.6 + 1.75 * h, z); g.rotation.x = Math.sin(a) * 0.35 * h; g.rotation.z = Math.cos(a) * 0.35 * h; });
}
function capCarapace(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.carapace) { /* le Chafer Cuirasse se replie sous sa carapace d'epines : 3,5 s presque invulnerable, il renvoie un cinquieme des coups du perso */
    if (mo.carapace > 0) mo.carapace -= dt;
    else if (sortPret('carapaceT', mo.d.carapace)) { mo.carapaceT = 0; mo.carapace = 3.5; pouf(mo.x, mo.m.position.y, mo.z, 3, '#e8dfc6'); if (mo.d.gestes && mo.d.gestes.carapace) gesteSort(mo, mo.d.gestes.carapace); if (!combat.carapaceVu) { combat.carapaceVu = true; toast(leNom(mo.d) + ' ' + (mo.d.carapaceTexte || 'se replie sous sa carapace d\'épines : il renvoie tes coups, frappe ses soldats en attendant !'), 'alerte'); } }
    /* (31/10/2026, par Discord, « refais la carapace du Chafer, pour voir », Mathieu : une bulle doree l'entourait) des epines d'os jaillissent de tout
       son corps en 0,2 s, il se tasse, elles vibrent ; elles rentrent a la fin. Elles etincellent quand elles te renvoient un coup (epinesTouche) */
    /* (puis « les pics du Chafer devraient etre sur la boule du bouclier, un genre de bouclier avec des pics », Mathieu) : la bulle doree revient, et les
       epines sont plantees sur elle, pointees vers l'exterieur */
    if (!mo.epinesC) { const g = new T.Group(), mo1 = mat('#efe0b8'), mo2 = mat('#c9b48a'), n = 26, h = mo.haut || 3, R = h * 0.62;
      const bulle = new T.Mesh(new T.IcosahedronGeometry(R, 2), new T.MeshBasicMaterial({ color: '#e8dfc6', transparent: true, opacity: 0.36, depthWrite: false })), fil = new T.Mesh(new T.IcosahedronGeometry(R * 1.002, 1), new T.MeshBasicMaterial({ color: '#b8a87e', wireframe: true, transparent: true, opacity: 0.6, depthWrite: false })); /* (couleur os, comme ses epines : « la bulle du Chafer couleur os, non ? », Mathieu, 01/11/2026 ; elle etait doree) */
      g.add(bulle, fil); g.userData.bulle = bulle;
      for (let i = 0; i < n; i++) { const y = 1 - (i + 0.5) / n * 1.7, r = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.399, dir = new T.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).normalize();
        const L = h * (0.13 + 0.06 * ((i * 7) % 3)), c = new T.Mesh(new T.ConeGeometry(h * 0.04, L, 6), i % 3 ? mo1 : mo2); c.geometry.translate(0, L / 2, 0);
        c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir); c.position.copy(dir).multiplyScalar(R * 0.97); g.add(c); }
      g.position.y = (mo.haut || 3) * 0.45; g.visible = false; m.add(g); mo.epinesC = g; mo.epinesK = 0; }
    const voulu = mo.carapace > 0 ? 1 : 0; mo.epinesK += (voulu - mo.epinesK) * Math.min(1, dt * (voulu ? 14 : 8)); const k = mo.epinesK;
    mo.epinesC.visible = k > 0.02; if (mo.epinesC.visible) { mo.epinesC.scale.setScalar(Math.max(0.01, k) * (1 + 0.03 * Math.sin(s * 23))); mo.epinesC.rotation.y += dt * 0.15; }
    if (mo.carapace > 0 && mo.epinesVu !== mo.carapaceT) { mo.epinesVu = mo.carapaceT; const y = mo.m.position.y; onde(mo.x, y, mo.z, 3.2, '#e8dfc6', 0.4, 0.8); poussiere(mo.x, y, mo.z, 10, 1.2, '#d8c6a0'); secousse(0.08, 0.2); }
  }
}
/* le seisme d'un boss sans squelette (31/10/2026, « on passe a la suite », Mathieu, apres l'audit : le cercle s'affichait puis presque rien) : il se
   dresse en levant les bras (il grandit et se cambre), le sol tremble de plus en plus fort, des fissures rougeoyantes et des cailloux sautent dans le
   cercle ; a la fin il s'abat (penche en avant, tasse) au moment du seisme */
/* le seisme lui-meme : tout le cercle se fend et rougeoie (fissures en couronne, pas seulement sous ses pieds, sinon on ne les voyait pas), des
   rochers jaillissent et retombent dans le cercle, eclair, ondes, poussiere, grosse secousse ; un cratere la ou tombent ses poings */
const MAT_ROCHER = mat('#8a8070'); partager(MAT_ROCHER);
function seismeBoss(mo, x, y, z, R) {
  if (mo.d.element) { secousse(0.4, 0.55); impactElement(mo.d.element, x, z, R); return; } /* (l'impact de son element sur tout le cercle, 01/11/2026) */
  seisme(x, y, z, R); secousse(0.45, 0.6); flashLumiere(x, y + 1, z, '#ff8a2e', 4, 10, 0.4); onde(x, y, z, R * 1.5, '#ffb26a', 0.6, 0.9); onde(x, y, z, R * 1.1, '#7a5a3a', 0.8, 0.6, true);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + fxAlea() * 0.5, r = R * (0.45 + fxAlea() * 0.35); solFendu(x + Math.cos(a) * r, y, z + Math.sin(a) * r, R * 0.45, true); }
  cratere(x + Math.sin(mo.ry) * mo.d.ombre * 0.45, y, z + Math.cos(mo.ry) * mo.d.ombre * 0.45, 1.4, 3);
  for (let i = 0; i < 10; i++) { const m = new T.Mesh(new T.DodecahedronGeometry(0.18 + fxAlea() * 0.22, 0), MAT_ROCHER), a = fxAlea() * Math.PI * 2, r0 = fxAlea() * R * 0.8, r1 = r0 + 0.5 + fxAlea() * 1.2;
    const x0 = x + Math.cos(a) * r0, z0 = z + Math.sin(a) * r0, x1 = x + Math.cos(a) * r1, z1 = z + Math.sin(a) * r1, H = 1.5 + fxAlea() * 2, D = 0.6 + fxAlea() * 0.3; m.castShadow = true;
    fxVie(m, D + 0.5, (k) => { const u = Math.min(1, k * (D + 0.5) / D); m.position.set(x0 + (x1 - x0) * u, y + 0.1 + Math.sin(u * Math.PI) * H, z0 + (z1 - z0) * u); m.rotation.set(k * 9, k * 7, 0); m.scale.setScalar(k > 0.85 ? Math.max(0.01, (1 - k) / 0.15) : 1);
      if (u >= 1 && !m.userData.pose) { m.userData.pose = true; poussiere(x1, y, z1, 3, 0.5, '#d8c6a0'); } }); }
  emettre(FX_FUM, 24, { x, y: y + 0.3, z, r: R * 0.8, plat: true, v: [0, 1.6, 0], dv: 1.2, vie: [0.8, 1.4], taille: [1, 3], c: ['#d8c6a0', '#b8a07a'], a: 0.55, frein: 1.5, vrot: 1, entree: 0.1 });
}
function prepaSeisme(mo, x0, z0, R, duree) {
  const c0 = combat, y = solA(x0, z0); let t = 0, tic = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') { mo.penche = 0; mo.hop = 0; mo.dresse = 0; return true; } const k = Math.min(1, t / duree);
    if (k < 0.85) { const u = Math.min(1, k / 0.6); mo.penche = -0.28 * u; mo.dresse = 0.12 * u; mo.hop = 0.25 * u; } /* (il se dresse, les bras leves) */
    else { const u = (k - 0.85) / 0.15; mo.penche = -0.28 + 0.68 * u; mo.dresse = 0.12 * (1 - u); mo.hop = 0.25 * (1 - u) - 0.25 * u; } /* (il s'abat) */
    if ((tic -= dt) <= 0) { tic = 0.12 - 0.07 * k; secousse(0.03 + 0.1 * k, 0.15); const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * R * 0.95, x = x0 + Math.cos(a) * r, z = z0 + Math.sin(a) * r;
      emettre(FX_VIF, 2, { x, y: y + 0.1, z, r: 0.2, v: [0, 2.5 + 2 * k, 0], dv: 1, vie: [0.4, 0.7], taille: [0.12, 0.06], c: ['#8e7a5e', '#6a5a44'], a: 1, grav: 9 });
      if (k > 0.3 && !mo.d.element) emettre(FX_LUM, 1, { x, y: y + 0.08, z, plat: true, vie: [0.3, 0.5], taille: [0.6 + k, 0.2], c: ['#ffd27a', '#ff6a1e'], a: 0.5 * k }); } /* (la lueur de lave sous lui : seulement sans element, 01/11/2026) */
    if (k >= 1) { let r = 0; effets.push((d2) => { r += d2; if (mo.etat !== 'actif') { mo.penche = 0; mo.hop = 0; return true; } mo.penche = 0.4 * Math.max(0, 1 - r / 0.5); mo.hop = -0.25 * Math.max(0, 1 - r / 0.5); return r >= 0.5; }); return true; } });
}
function croissantLune(mo, duree) { /* un croissant de lune qui grandit et luit au-dessus de sa tete pendant qu'il charge l'onde, puis s'eteint d'un coup */
  const c0 = combat, s = new T.Sprite(new T.SpriteMaterial({ map: TEX_CROISSANT, transparent: true, depthWrite: false })); s.raycast = () => {}; s.renderOrder = 7; scene.add(s); let t = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || mo.etat !== 'actif' || t >= duree) { jeter(s); if (combat === c0 && mo.etat === 'actif') emettre(FX_LUM, 14, { x: s.position.x, y: s.position.y, z: s.position.z, r: 0.4, dv: 3, vie: [0.3, 0.5], taille: [0.2, 0.03], c: ['#ffffff', '#bfe6ff'] }); return true; }
    const k = Math.min(1, t / (duree * 0.6)), h = (mo.haut || 3); s.position.set(mo.x, mo.m.position.y + h * 1.15 + Math.sin(t * 3) * 0.08, mo.z); s.scale.setScalar(h * 0.55 * (0.3 + 0.7 * k) * (1 + 0.06 * Math.sin(t * 9))); s.material.opacity = 0.5 + 0.5 * k;
    if (Math.random() < dt * 12) emettre(FX_LUM, 1, { x: s.position.x + fxEntre(-0.5, 0.5), y: s.position.y + fxEntre(-0.4, 0.4), z: s.position.z + fxEntre(-0.5, 0.5), v: [0, -0.4, 0], vie: [0.4, 0.7], taille: [0.12, 0.02], c: ['#ffffff', '#bfe6ff'] }); }); /* (de la poussiere de lune en tombe) */
}
function rocherLune() { /* la pierre de lune du Golem : un rocher gris bleute, veine de cristaux qui luisent */
  const g = new T.Group(), r = new T.Mesh(new T.DodecahedronGeometry(0.6, 0), mat('#8d929c')); r.scale.set(1, 0.85, 1.1); g.add(r);
  for (let i = 0; i < 6; i++) { const q = new T.Mesh(new T.OctahedronGeometry(0.12 + fxAlea() * 0.08, 0), new T.MeshBasicMaterial({ color: i % 2 ? '#a8ecff' : '#e8f8ff' })), a = i * 1.1, b = (i % 3 - 1) * 0.6;
    q.position.set(Math.cos(a) * Math.cos(b) * 0.52, Math.sin(b) * 0.45, Math.sin(a) * Math.cos(b) * 0.55); q.scale.set(1, 1.8, 1); q.lookAt(0, 0, 0); g.add(q); } return g;
}
function impactRocherLune(v) { /* le rocher de lune s'ecrase : un cratere, des eclats de pierre, des eclats de cristal qui luisent, une onde de clair de lune */
  const y = v.y - 0.25; secousse(0.12, 0.22); craterLune(v.x, y + 0.02, v.z, 0.9, 2.2); eclatsRoche(v.x, y, v.z, 6, 0.8); onde(v.x, y, v.z, 2.2, '#bfe6ff', 0.45, 0.8, true);
  emettre(FX_LUM, 16, { x: v.x, y: y + 0.3, z: v.z, r: 0.3, dv: 3.5, haut: true, vie: [0.4, 0.7], taille: [0.14, 0.03], c: ['#ffffff', '#a8ecff'], grav: 6 }); flashLumiere(v.x, y + 0.6, v.z, '#bfe6ff', 1.6, 5, 0.3);
  emettre(FX_FUM, 6, { x: v.x, y: y + 0.3, z: v.z, r: 0.4, v: [0, 0.6, 0], vie: [0.7, 1.0], taille: [0.6, 1.2], c: ['#e2e6ee', '#b8bec8'], a: 0.5 });
}
function capSeisme(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.seisme) { /* le Craqueleur Legendaire frappe le sol : un cercle rouge s'annonce autour de lui (1,3 s pour en sortir), puis l'onde de choc, sur le perso et les batiments */
    if (sortPret('seismeT', mo.d.seisme) && (!mo.d.seismeProche || Math.hypot(pp.x - mo.x, pp.z - mo.z) <= (mo.d.seismeR || 4.5) + mo.d.seismeProche)) { /* (seismeProche, 29/10/2026 : il attend que tu sois a portee, sinon le sort part dans le vide ; le sort reste pret) */
      mo.seismeT = 0; const R = mo.d.seismeR || 4.5, duree = mo.d.seismeDuree || 1.3, x0 = mo.x, z0 = mo.z; mo.bloqueT = duree + 0.3; gesteSort(mo, gesteDe(mo, 'seisme', 'sort'), duree); /* (le rayon et le temps : ceux du Craqueleur Legendaire, ou de la fiche ; l'ecrasement du Dragon Cochon, 20/10/2026) */
      if (!combat.seismeVu) { combat.seismeVu = true; toast((mo.d.seismeNom || 'Séisme') + ' ! ' + leNom(mo.d) + ' va frapper le sol : sors du cercle bleu.', 'alerte'); }
      const lourdS = !m.userData.anim; if (lourdS) prepaSeisme(mo, x0, z0, R, duree); /* (31/10/2026 : le Craqueleur Legendaire se dresse, le sol tremble et rougeoie) */
      if (mo.d.element === 'lune') croissantLune(mo, duree); /* (le Golem lunaire : un croissant de lune s'allume au-dessus de sa tete, 01/11/2026) */
      zoneDanger({ mo, x: x0, z: z0, r: R, duree, couleur: COULEUR_CAC, effet: (d) => {
        if (lourdS && mo.d.seismeLeger) { secousse(0.12, 0.25); onde(mo.x, mo.m.position.y, mo.z, R * 1.1, '#ffb26a', 0.5, 0.6); mottes(x0, mo.m.position.y, z0, 8, R * 0.6); } /* (le coup de massue du Gwand Wabbit, 06/11/2026 : plus leger que le seisme d'un boss) */
        else if (lourdS) seismeBoss(mo, x0, mo.m.position.y, z0, R); /* (il abat ses poings : le vrai seisme, 31/10/2026) */
        const an = mo.d.poings && mo.m.userData.anim; if (an && an.frappe) { const q = an.frappe().p, y = mo.m.position.y; if (mo.d.element) impactElement(mo.d.element, x0, z0, R); else { impactMarteau(q.x, y, q.z, mo.d.couleurSorts); onde(x0, y, z0, R, (mo.d.couleurSorts || [])[1] || '#fff3d6', 0.6, 0.8); } } /* (le Gorille : ses deux poings au sol, 31/10/2026 ; son element sur tout le cercle, 01/11/2026) */
        else if (!lourdS && mo.d.element) { secousse(0.35, 0.5); impactElement(mo.d.element, x0, z0, R); } /* (un monstre anime sans poings, le Golem, Ebil : son element sur tout le cercle ; il n'y avait que deux bouffees, 01/11/2026) */
        if (!mo.d.element) { pouf(x0, mo.m.position.y, z0, 9 * R / 4.5, '#8e7a5e'); pouf(x0, mo.m.position.y, z0, 5 * R / 4.5, '#c9b28a'); } mo.frappe = 0.4;
        const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) { const SC = mo.d.seismeCentre, kl = SC ? SC.centre + (SC.bord - SC.centre) * Math.min(1, Math.hypot(p2.x - x0, p2.z - z0) / R) : 1; blesserPerso(Math.round(degSort(mo) * ((mo.d.sortsX || {}).seisme || 1) * kl), mo); /* (seismeCentre : l'onde frappe plus fort pres de lui qu'au bord du cercle, le Craqueleur Legendaire ; c'etait l'inverse du 31/10 au 05/11/2026, x2 au bord : « il m'a one shot », Mathieu) */ if (mo.d.repousse && combat && !combat.fin) repousserPerso(mo, mo.d.repousse); }
        if (combat && !combat.fin) clesBats().forEach((k) => { const z = zoneBat(k); if (z && !enRuine(k) && Math.hypot(z.x - x0, z.z - z0) < R + Math.max(z.hw, z.hd)) blesserBat(k, degatsBatiment(1, mo)); });
      } });
    }
  }
}
function capSouffle(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.souffle && combat.deroute == null) { /* Crocabulia crache un cone de feu vers le perso */
    if (mo.souffleT == null) mo.souffleT = mo.d.souffle - 3; if (!mo.vise && !(mo.bloqueT > 0)) mo.souffleT += vSort;
    if (mo.souffleT >= mo.d.souffle && !mo.vise) { /* elle prend son souffle : le cone s'affiche au sol, on a une seconde pour en sortir */
      const a = Math.atan2(pp.x - mo.x, pp.z - mo.z), R = mo.d.souffleR || 7, OUV = mo.d.souffleOuv || 0.5; mo.ry = a; /* (souffleR, souffleOuv : sa longueur et sa demi-ouverture, 31/10/2026) */
      const c = new T.Mesh(new T.CircleGeometry(R, 32, Math.PI / 2 - OUV, OUV * 2), new T.MeshBasicMaterial({ color: '#ff5a1e', transparent: true, opacity: 0.25, depthWrite: false, side: T.DoubleSide }));
      c.rotation.set(-Math.PI / 2, 0, a - Math.PI); c.position.set(mo.x, (mo.d.vol ? solA(mo.x, mo.z) : mo.m.position.y) + 0.06, mo.z); c.renderOrder = 2; scene.add(c); /* (au sol : elle vole, son cone flottait a 1,5 au-dessus et paraissait decale vu d'en haut, 03/11/2026) */
      effets.push(() => { if (!combat || mo.etat !== 'actif' || !mo.vise) { jeter(c); if (mo.vise && mo.vise.c === c) mo.vise = null; return true; } }); /* le cone disparait si elle tombe avant de cracher */
      mo.vise = { a, t: 0, c };
      if (!combat.souffleVu) { combat.souffleVu = true; toast('Crocabulia prend son souffle : sors du cône rouge !', 'alerte'); }
    }
    if (mo.vise) { mo.vise.t += dt; mo.vise.c.material.opacity = 0.2 + 0.25 * Math.abs(Math.sin(mo.vise.t * 9)); }
    if (mo.vise && mo.vise.t >= 1.0) {
      const a = mo.vise.a, R = mo.d.souffleR || 7, OUV = mo.d.souffleOuv || 0.5; jeter(mo.vise.c); mo.vise = null; mo.souffleT = 0;
      if (mo.d.souffleR) { const tete = mo.m.getObjectByName('tete'), src = () => tete ? tete.getWorldPosition(new T.Vector3()) : new T.Vector3(mo.x + Math.sin(a) * mo.d.ombre * 0.4, mo.m.position.y + (mo.haut || 2) * 0.6, mo.z + Math.cos(a) * mo.d.ombre * 0.4);
        souffleDeFeu(new T.Vector3(mo.x, mo.m.position.y, mo.z), a, R, { src, ouv: OUV }); } else souffleFeu(mo, a); /* (le grand jet de flammes du perso, parti de sa gueule, 31/10/2026) */
      if (mo.d.souffleSol) solEnFeu(mo, a, R, OUV, mo.d.souffleSol);
      const dans = (x, z) => { const d = Math.hypot(x - mo.x, z - mo.z); let e = Math.atan2(x - mo.x, z - mo.z) - a; e = Math.atan2(Math.sin(e), Math.cos(e)); return d < R && Math.abs(e) < OUV; };
      if (dans(pp.x, pp.z)) blesserPerso(degSort(mo), mo);
      clesBats().forEach((k) => { const z = zoneBat(k); if (z && !enRuine(k) && dans(z.x, z.z)) blesserBat(k, degatsBatiment(1, mo)); });
      if (!combat || combat.fin) return;
    }
  }
}
/* le sol en feu derriere le souffle de Crocabulia (31/10/2026, « qui brule tout sur son passage », Mathieu) : des flammes au ras du sol dans tout le
   cone pendant duree secondes ; dedans, tu brules, un dixieme de son souffle toutes les 0,5 s (le bot de test l'evite comme une zone) */
function solEnFeu(mo, a, R, ouv, duree) {
  const c0 = combat, x0 = mo.x, z0 = mo.z, d = { x: x0, z: z0, r: R, a, ouv }, dg = Math.max(1, Math.round(degSort(mo) * 0.1)); (c0.dangers = c0.dangers || []).push(d); let t = 0, tic = 0.25, fx = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || t >= duree) { const i = c0.dangers.indexOf(d); if (i >= 0) c0.dangers.splice(i, 1); return true; }
    if ((fx += dt) > 0.04) { fx = 0; const n = t < duree - 0.6 ? 8 : 3;
      for (let i = 0; i < n; i++) { const u = 1.2 + Math.sqrt(fxAlea()) * (R - 1.2), e = a + (fxAlea() - 0.5) * 2 * ouv * 0.9, x = x0 + Math.sin(e) * u, z = z0 + Math.cos(e) * u, y = solA(x, z);
        emettre(FX_VIF, 1, { x, y: y + 0.1, z, r: 0.25, v: [0, 1.6, 0], dv: 0.5, vie: [0.35, 0.6], taille: [0.35, 0.9], c: ['#fff1a8', '#ffb02e', '#ff5a1e', '#7a1a06'], a: 0.9, grav: -1.5, frein: 1, vrot: 3, entree: 0.05 });
        if (i === 0 && fxAlea() < 0.4) emettre(FX_FUM, 1, { x, y: y + 0.6, z, r: 0.3, v: [0, 1.4, 0], vie: [0.8, 1.2], taille: [0.6, 1.8], c: ['#3a2e28', '#6a605a'], a: 0.4, frein: 1, vrot: 1, entree: 0.2 }); } }
    if ((tic += dt) >= 0.5) { tic = 0; const p = paysanMesh.position; if (dansDanger(d, p.x, p.z)) { blesserPerso(dg, mo); if (!c0.solFeuVu && combat && !combat.fin) { c0.solFeuVu = true; toast('Le sol brûle derrière le souffle de ' + leNom(mo.d) + ' : sors des flammes !', 'alerte'); } } } });
}
/* LE WA WABBIT LANCE SES CAWOTTES (31/10/2026, par Discord, « fais le Wa Wabbit », Mathieu ; avant, de petits cones orange tombaient du ciel et un pouf).
   sautLancer : il se tasse, puis saute en se cabrant au moment du lancer (t0), et retombe. cawotteVolante : une cawotte (corps orange, fanes vertes) part
   de lui, monte au-dessus de l'ecran puis retombe pointe en bas sur son cercle a l'instant voulu, en tournant, avec une trainee ; elle explose */
function sautLancer(mo, t0) {
  const c0 = combat; let t = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || mo.etat !== 'actif') { mo.hop = 0; mo.penche = 0; return true; }
    if (t < t0) { const u = t / t0; mo.hop = -0.3 * Math.sin(u * Math.PI / 2); mo.penche = 0.15 * u; }
    else { const u = Math.min(1, (t - t0) / 0.55); mo.hop = Math.sin(u * Math.PI) * 1.4 - 0.3 * (1 - Math.min(1, u * 4)); mo.penche = -0.3 * Math.sin(u * Math.PI); if (u >= 1) { mo.hop = 0; mo.penche = 0; pouf(mo.x, solA(mo.x, mo.z), mo.z, 2.5, '#d8c6a0'); return true; } } });
}
function cawotteMesh(k) { const g = new T.Group(), c = new T.Mesh(GEO_CAWOTTE, mat('#f08a24')); g.add(c); for (let i = 0; i < 3; i++) { const f = new T.Mesh(new T.ConeGeometry(0.06, 0.32, 5), mat(i === 1 ? '#5fae3a' : '#4f9a2e')); f.position.set((i - 1) * 0.07, 0.42, 0); f.rotation.z = (i - 1) * 0.45; g.add(f); } g.scale.setScalar(k); g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return g; }
function planterCawotte(x, y, z, k) { /* la cawotte reste plantee pointe en bas dans son cratere, puis s'enfonce (01/11/2026) */
  const g = cawotteMesh(k); g.rotation.set(Math.PI, fxAlea() * 6, 0.25); g.position.set(x, y + 0.3 * k, z); g.traverse((o) => { o.raycast = () => {}; }); scene.add(g); let t = 0;
  effets.push((dt) => { t += dt; if (t > 1.8) g.position.y -= dt * 0.8 * k; if (t > 2.4) { jeter(g); return true; } });
}
function cawotteVolante(de, x, y, z, depart, arrivee, k, grosse) {
  const c0 = combat, g = cawotteMesh(k); g.visible = false; scene.add(g); let t = 0; const H = 14;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin) { jeter(g); return true; } if (t < depart) return false; g.visible = true;
    const montee = Math.min(0.55, (arrivee - depart) * 0.45);
    if (t < depart + montee) { const u = (t - depart) / montee; g.position.set(de.x + (x - de.x) * u * 0.25, de.y + H * (1 - (1 - u) * (1 - u)), de.z + (z - de.z) * u * 0.25); g.rotation.set(0, t * 12, 0); } /* (elle part de lui vers le ciel) */
    else { const chute = Math.min(0.4, arrivee - depart - montee), u = Math.min(1, (t - (arrivee - chute)) / chute); if (t < arrivee - chute) { g.visible = false; return false; } g.visible = true;
      g.position.set(x, y + 0.3 + H * (1 - u * u), z); g.rotation.set(Math.PI, t * 14, 0); emettre(FX_LUM, 2, { x, y: g.position.y + 0.4 * k, z, r: 0.05, vie: [0.18, 0.3], taille: [0.3 * k, 0.05], c: ['#ffffff', '#ffb46a'], a: 0.85 }); }
    if (t < arrivee) return false;
    jeter(g); cratere(x, y, z, grosse ? 1.3 : 0.8, 3); planterCawotte(x, y, z, k); onde(x, y, z, grosse ? 3.2 : 2.2, '#8b6a45', 0.45, 0.8, true); /* (un cratere, la cawotte plantee dedans, plus de feu, 01/11/2026) */
    mottes(x, y, z, grosse ? 12 : 6, grosse ? 1.4 : 0.9); poussiere(x, y, z, grosse ? 14 : 6, grosse ? 1.6 : 1, '#d8c6a0'); secousse(grosse ? 0.3 : 0.1, grosse ? 0.4 : 0.18); if (grosse) solFendu(x, y, z, 2.2, false);
    return true; });
}
function capPluie(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.pluie && combat.deroute == null) { /* le Wa Wabbit fait pleuvoir des cawottes explosives : des cercles au sol, une seconde pour en sortir */
    if (mo.pluieT == null) mo.pluieT = mo.d.pluie - 3; mo.pluieT += vSort;
    if (mo.pluieT >= mo.d.pluie) {
      mo.pluieT = 0; mo.frappe = 0.4;
      gesteSort(mo, 'tir'); const fleches = !!mo.d.pluieFleches; /* (Ark : une pluie de flèches, 25/10/2026) */
      if (!combat[fleches ? 'pluieFVu' : 'pluieVu']) { combat[fleches ? 'pluieFVu' : 'pluieVu'] = true; toast(fleches ? leNom(mo.d) + ' tire une pluie de flèches : sors des cercles rouges !' : 'Le Wa Wabbit fait pleuvoir des cawottes du ciel : sors des cercles orange !', 'alerte'); }
      const lanceur = !fleches && !m.userData.anim; if (lanceur) sautLancer(mo, 0.35); /* (le Wa Wabbit saute en lancant ses cawottes, 31/10/2026) */
      [[pp.x, pp.z]].concat([0, 1, 2, 3].map(() => [pp.x + (Math.random() - 0.5) * 7, pp.z + (Math.random() - 0.5) * 7])).forEach(([x, z], ic) => {
        const cel = caseIci(x, z), y = cel ? hauteurSol(x, z, cel) : 0, c0 = combat, dz = { x, z, r: 1.3 }; (c0.dangers = c0.dangers || []).push(dz); const oter = () => { const i = c0.dangers.indexOf(dz); if (i >= 0) c0.dangers.splice(i, 1); };
        const rond = new T.Mesh(new T.CircleGeometry(1.3, 24), new T.MeshBasicMaterial({ color: fleches ? '#e2413a' : '#f08a24', transparent: true, opacity: 0.3, depthWrite: false, side: T.DoubleSide })); rond.rotation.x = -Math.PI / 2; rond.position.set(x, y + 0.07, z); rond.renderOrder = 2; scene.add(rond);
        const cw = fleches ? volee() : lanceur ? new T.Group() : new T.Mesh(new T.ConeGeometry(0.2, 0.7, 8), new T.MeshBasicMaterial({ color: '#f08a24' })); if (!fleches && !lanceur) cw.rotation.x = Math.PI; scene.add(cw); let t = 0;
        if (lanceur) cawotteVolante(new T.Vector3(mo.x, mo.m.position.y + (mo.haut || 3) * 0.8, mo.z), x, y, z, 0.35 + ic * 0.04, ESQUIVE.pluie, 1.6, false);
        effets.push((dt2) => {
          t += dt2; rond.material.opacity = 0.2 + 0.25 * Math.abs(Math.sin(t * 9)); cw.position.set(x, y + 0.35 + 9 * Math.max(0, 1 - t / ESQUIVE.pluie), z);
          if (!combat || combat.fin) { jeter(rond); jeter(cw); oter(); return true; }
          if (t >= ESQUIVE.pluie) { jeter(rond); jeter(cw); oter(); if (fleches) { pouf(x, y, z, 2.2, '#c9b28a'); fichees(x, y, z); } else if (!lanceur) { pouf(x, y, z, 3, '#f08a24'); pouf(x, y, z, 1.6, '#ffd04a'); } const p2 = paysanMesh.position; if (Math.hypot(p2.x - x, p2.z - z) < 1.3) blesserPerso(degSort(mo), mo); return true; }
        });
      });
      if (!combat || combat.fin) return;
    }
  }
}
/* la Bourrasque (31/10/2026, « des sorts de fleche et de vent », Mathieu, qui l'a choisie parmi quatre ; faite pour l'Ark, passee a Ebil le meme jour,
   « la bourrasque de l'Ark tu la donnes a Ebil ») : face a toi, il bande son arc (Ebil pointe son baton, bourrasqueGeste) pendant
   qu'un cone rouge s'annonce devant lui, puis il decoche une fleche de vent ; la rafale balaie le cone (bourrasqueVent, 22b-effets.js) : dedans, tu
   prends le coup, tu es repousse de 2 cases et ralenti 1,5 s. Toute la horde ne le lance pas en meme temps */
const RECUL_BOURRASQUE = 2 * S, LENTEUR_BOURRASQUE = 1.5, OUV_BOURRASQUE = 0.42;
function capBourrasque(mo, ctx) {
  const { pp, sortPret } = ctx; if (!mo.d.bourrasque || combat.deroute != null) return;
  if (mo.bourrasqueT == null) mo.bourrasqueT = mo.d.bourrasque - 3 - Math.random() * 4; /* (le premier 3 a 7 s apres son arrivee) */
  const R = mo.d.bourrasqueR || 6, dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
  if (!sortPret('bourrasqueT', mo.d.bourrasque) || mo.geste) return;
  if (dP > R - 0.4) { mo.bourrasqueT = mo.d.bourrasque; return; } /* (pret, il attend que tu sois a portee) */
  mo.bourrasqueT = 0; const a = Math.atan2(pp.x - mo.x, pp.z - mo.z), x0 = mo.x, z0 = mo.z, duree = ESQUIVE.bourrasque, c0 = combat;
  mo.ry = a; mo.bloqueT = duree + 0.35; mo.cd = Math.max(mo.cd || 0, duree + 0.6); mo.frappe = 0.3; gesteSort(mo, gesteDe(mo, 'bourrasque', 'tir'), duree); /* (Ebil : son geste de magie, gestes de sa fiche) */
  if (!c0.bourrasqueVu) { c0.bourrasqueVu = true; toast(leNom(mo.d) + ' ' + (mo.d.bourrasqueGeste || 'bande son arc') + ' : sors du cône rouge, sa bourrasque te repousse et te ralentit !', 'alerte'); }
  zoneDanger({ mo, x: x0, z: z0, r: R, a, ouv: OUV_BOURRASQUE, duree, effet: (d) => {
    const p0 = (mainSquelette(mo) || new T.Vector3(x0, mo.m.position.y + 1.2, z0)); bourrasqueVent(p0, solA(x0, z0), a, R, OUV_BOURRASQUE);
    const p2 = paysanMesh.position; if (!dansDanger(d, p2.x, p2.z)) return;
    blesserPerso(Math.max(1, Math.round(degSort(mo) * ((mo.d.sortsX || {}).bourrasque || 1))), mo); if (!combat || combat.fin) return;
    repousserPerso(mo, RECUL_BOURRASQUE); c0.lenteur = Math.max(c0.lenteur || 0, LENTEUR_BOURRASQUE); } });
}
/* la pluie de flèches d'Ark : une volée de cinq flèches qui tombe sur le cercle, puis reste fichée au sol un instant */
const volee = () => { const g = new T.Group(); for (let i = 0; i < 5; i++) { const f = boite(0.03, 0.6, 0.03, '#8a5a30'), p = new T.Mesh(new T.ConeGeometry(0.05, 0.14, 4), mat('#a8a294')); p.rotation.x = Math.PI; p.position.y = -0.36; f.add(p); f.position.set(Math.sin(i * 2.4) * 0.5 * (i % 3) / 2, 0.3, Math.cos(i * 2.4) * 0.5 * (i % 3) / 2); f.rotation.z = (i - 2) * 0.06; g.add(f); } return g; };
function fichees(x, y, z) { const g = volee(); g.position.set(x, y - 0.12, z); fxVie(g, 1.6, (k) => { g.position.y = y - 0.12 - Math.max(0, k - 0.6) * 1.2; }); }
const SUIT_ROYALE = 0.9; /* (le temps pendant lequel la cible de la Cawotte royale te suit, 1,4 avant le 31/10/2026) */
function capCawotteRoyale(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.cawotteRoyale && combat.deroute == null) { /* la Cawotte royale du Wa Wabbit : une petite cible te suit, se fige, puis la cawotte geante s'abat */
    const V0 = mo.royVise;
    if (!V0) { if (mo.royT == null) mo.royT = mo.d.cawotteRoyale - 5; mo.royT += vSort; }
    if (!V0 && mo.royT >= mo.d.cawotteRoyale) {
      mo.royT = 0; mo.frappe = 0.4; const R = 1.9, c0 = combat; /* (31/10/2026, par Discord, « elle met du temps a tomber, et la zone d'impact est un peu petite », Mathieu : rayon 1,9 au lieu de 0,95, la cible te suit 0,9 s au lieu de 1,4) */
      const rond = new T.Mesh(new T.RingGeometry(R - 0.14, R, 32), new T.MeshBasicMaterial({ color: '#e2413a', transparent: true, opacity: 0.9, depthWrite: false, side: T.DoubleSide })); rond.rotation.x = -Math.PI / 2; rond.renderOrder = 3;
      const fond = new T.Mesh(new T.CircleGeometry(R, 28), new T.MeshBasicMaterial({ color: '#e2413a', transparent: true, opacity: 0.25, depthWrite: false, side: T.DoubleSide })); fond.rotation.x = -Math.PI / 2; fond.renderOrder = 2;
      const cw = new T.Group(), corps = new T.Mesh(new T.ConeGeometry(0.42, 1.6, 10), new T.MeshLambertMaterial({ color: '#f08a24' })); corps.rotation.x = Math.PI; cw.add(corps);
      for (let k = 0; k < 3; k++) { const f = new T.Mesh(new T.ConeGeometry(0.1, 0.6, 5), new T.MeshLambertMaterial({ color: '#4fae3a' })); f.position.set((k - 1) * 0.14, 1.0, 0); f.rotation.z = (k - 1) * 0.4; cw.add(f); }
      cw.visible = false; scene.add(rond, fond, cw); cw.scale.setScalar(2.2); cw.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      mo.royVise = { t: 0, x: pp.x, z: pp.z, rond, fond, cw, d: null, R, c0 };
      if (!m.userData.anim) { sautLancer(mo, 0.3); const de = new T.Vector3(mo.x, mo.m.position.y + (mo.haut || 3) * 0.8, mo.z), up = cawotteMesh(2.6); up.rotation.x = 0; scene.add(up); let t = -0.3; /* (31/10/2026 : il lance la cawotte geante vers le ciel) */
        effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || t > 0.55) { jeter(up); return true; } if (t < 0) { up.visible = false; return false; } up.visible = true; const u = t / 0.55; up.position.set(de.x, de.y + 16 * (1 - (1 - u) * (1 - u)), de.z); up.rotation.y = t * 10;
          emettre(FX_LUM, 2, { x: up.position.x, y: up.position.y - 0.5, z: up.position.z, r: 0.1, vie: [0.2, 0.35], taille: [0.5, 0.08], c: ['#ffffff', '#ffb46a'], a: 0.85 }); return false; }); }
      if (!combat.royVu) { combat.royVu = true; toast('La Cawotte royale du Wa Wabbit : la cible rouge te suit, puis se fige. File, sinon la cawotte géante t\'assomme !', 'alerte'); }
    }
    const V = mo.royVise;
    if (V) {
      const fin = () => { jeter(V.rond, V.fond, V.cw); if (V.d && V.c0.dangers) { const i = V.c0.dangers.indexOf(V.d); if (i >= 0) V.c0.dangers.splice(i, 1); } mo.royVise = null; };
      if (combat !== V.c0 || combat.fin || mo.etat !== 'actif') fin();
      else {
        V.t += dt; if (V.t < SUIT_ROYALE) { V.x = pp.x; V.z = pp.z; } else if (!V.d) { V.d = { x: V.x, z: V.z, r: V.R }; (V.c0.dangers = V.c0.dangers || []).push(V.d); V.rond.material.color.set('#ff2a1a'); } /* (figee : le bot aussi peut l'esquiver) */
        const cel = caseIci(V.x, V.z), y = cel ? hauteurSol(V.x, V.z, cel) : 0; V.rond.position.set(V.x, y + 0.08, V.z); V.fond.position.set(V.x, y + 0.07, V.z); V.fond.material.opacity = 0.18 + 0.2 * Math.abs(Math.sin(V.t * (V.t < SUIT_ROYALE ? 6 : 14)));
        if (V.t >= SUIT_ROYALE) { const k = Math.min(1, (V.t - SUIT_ROYALE) / ESQUIVE.cawotteRoyale); V.cw.visible = true; V.cw.position.set(V.x, y + 1.3 + 14 * (1 - k * k), V.z); V.cw.rotation.y += dt * 6;
          emettre(FX_LUM, 3, { x: V.x, y: V.cw.position.y + 1.2, z: V.z, r: 0.2, vie: [0.25, 0.4], taille: [0.7, 0.1], c: ['#ffffff', '#ffb46a'], a: 0.9 }); emettre(FX_FUM, 1, { x: V.x, y: V.cw.position.y + 1.5, z: V.z, r: 0.3, vie: [0.4, 0.6], taille: [0.4, 1], c: ['#f6e6c8', '#d8c6a0'], a: 0.5 }); } /* (une trainee derriere elle) */
        if (V.t >= SUIT_ROYALE + ESQUIVE.cawotteRoyale) { const x = V.x, z = V.z; cratere(x, y, z, 2.0, 3.5); solFendu(x, y, z, 3.0, false); planterCawotte(x, y, z, 2.6); onde(x, y, z, 4.5, '#8b6a45', 0.5, 0.85, true); /* (un grand cratere, la cawotte royale plantee dedans, plus de feu, 01/11/2026) */ mottes(x, y, z, 14, 1.5); poussiere(x, y, z, 16, 1.8, '#d8c6a0'); secousse(0.4, 0.5); const p2 = paysanMesh.position; fin();
          if (Math.hypot(p2.x - x, p2.z - z) < V.R) { blesserPerso(degSort(mo), mo); /* (autant que sa pluie depuis le 15/10/2026 : 1,8 fois avant, 567, « c'est enorme, le Koulosse c'est 275 et 275 », Mathieu ; c'est l'assommement qui la rend dangereuse) */ if (combat && !combat.fin) { combat.assomme = Math.max(combat.assomme || 0, 1.0); chiffre('Assommé !', new T.Vector3(p2.x, p2.y + 2.2, p2.z), 'gros'); for (let i = 0; i < 4; i++) setTimeout(() => { const q = paysanMesh.position; emettre(FX_VIF, 3, { x: q.x, y: q.y + 2, z: q.z, r: 0.4, v: [0, 0.5, 0], dv: 0.5, vie: [0.4, 0.6], taille: [0.14, 0.05], c: ['#fff6a0', '#ffd23a'], a: 1 }); }, i * 220); } } /* (des etoiles autour de sa tete, 31/10/2026) */
          if (!combat || combat.fin) return; }
      }
    }
  }
}
/* (06/11/2026, « le Koulosse en Arene, retire-lui 2 flaques, l'Arene est petite et il recouvre trop facilement la map », Mathieu) : 2 nuages de moins par jet dans l'Arene seulement */
const FUMEES_EN_MOINS_ARENE = 2, nbFumees = (mo) => Math.max(1, (mo.d.fumeeN || 3) - (combat && combat.genre === 'arene' ? FUMEES_EN_MOINS_ARENE : 0));
function capFumee(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.fumee && combat.deroute == null) { /* le Koulosse crache des nuages de fumee verte : un sur toi, deux autour */
    if (mo.fumeeT == null) mo.fumeeT = mo.d.fumee - 3; mo.fumeeT += vSort;
    if (mo.fumeeT >= mo.d.fumee) { mo.fumeeT = 0; mo.frappe = 0.4;
      if (!combat.fumeeVu) { combat.fumeeVu = true; toast('Le Koulosse crache de la fumée : la toucher t\'empoisonne (2 s de poison par seconde passée dedans, ' + Math.round(POISON_FUMEE * 100) + ' % de tes PV par seconde). Évite les nuages verts !', 'alerte'); }
      const geste = !m.userData.anim; if (geste) { inspireKoulosse(mo, 0.45); mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z); mo.bloqueT = Math.max(mo.bloqueT || 0, 0.9); } /* (31/10/2026 : il inspire, puis crache) */
      const nf = nbFumees(mo), rf = mo.d.fumeeR || 1.9; /* (31/10/2026, par Discord, « il devrait en jeter beaucoup plus, plus de zones de brume, sur la carte c'est tres facile a esquiver », Mathieu : fumeeN nuages par jet, de rayon fumeeR) */
      [[pp.x, pp.z]].concat(Array.from({ length: nf - 1 }, (_, i) => { const a = (i / (nf - 1)) * Math.PI * 2 + Math.random() * 0.8, r = 3 + Math.random() * 5; return [pp.x + Math.cos(a) * r, pp.z + Math.sin(a) * r]; })).forEach(([x, z], k) => cracherFumee(mo, x, z, rf, DUREE_FUMEE, (geste ? 0.45 : 0) + k * 0.1));
      if (!combat || combat.fin) return; }
  }
}
function capAppel(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.appel && combat.deroute == null) { /* il t'attire a lui (souvent en pleine fumee) : une bande verte jusqu'a toi, une seconde pour en sortir */
    const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
    if (sortPret('appelT', mo.d.appel) && dP > 4 && dP < 28) { /* (portee doublee le 15/10/2026 : de 14 a 28, un Cra ne lui echappe plus en reculant) */ mo.appelT = 0; mo.bloqueT = 1.1; mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z); mo.frappe = 0.3;
      if (!combat.appelVu) { combat.appelVu = true; toast('Le Koulosse te lance son appel : sors de la bande verte, ou il t\'attire à lui, te frappe et t\'étourdit !', 'alerte'); }
      const geste = !m.userData.anim, c0 = combat; if (geste) { let t = 0, f = 0; effets.push((dt) => { t += dt; if (combat !== c0 || mo.etat !== 'actif' || t > 1) return true; mo.penche = -0.15 * Math.min(1, t / 0.3); const bx = mo.x + Math.sin(mo.ry) * mo.d.ombre * 0.4, by = mo.m.position.y + mo.haut * 0.75, bz = mo.z + Math.cos(mo.ry) * mo.d.ombre * 0.4;
        if ((f -= dt) <= 0) { f = 0.03; const a = t * 14 + Math.random(); emettre(FX_FUM, 1, { x: bx + Math.cos(a) * 0.7, y: by + Math.sin(a) * 0.7, z: bz, v: [0, 0.2, 0], vie: [0.25, 0.4], taille: [0.5, 0.2], c: ['#c8f0a0', '#9ad86a'], a: 0.7 }); } return false; }); } /* (31/10/2026 : la fumee tourbillonne devant sa bouche) */
      const x2 = pp.x, z2 = pp.z; zoneDanger({ mo, x: mo.x, z: mo.z, x2, z2, larg: 1.6, duree: 1.0, couleur: '#14501a', fort: 1.7, bord: true, effet: (d) => { const p2 = paysanMesh.position, pris = dansDanger(d, p2.x, p2.z); if (geste) langueFumee(mo, x2, z2, pris); if (pris) { if (geste) setTimeout(() => { if (combat === c0 && !c0.fin && mo.etat === 'actif') attirerPerso(mo); }, 220); else attirerPerso(mo); } } });
    }
  }
}
function capAuras(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.bouclier > 0) { mo.bouclier -= dt; if (!mo.bulleB) { mo.bulleB = new T.Mesh(new T.SphereGeometry(1, 16, 12), new T.MeshBasicMaterial({ color: '#6fe0e8', transparent: true, opacity: 0.25, depthWrite: false })); m.add(mo.bulleB); } mo.bulleB.visible = true; mo.bulleB.material.color.set(mo.bouclierC || '#6fe0e8'); mo.bulleB.scale.setScalar(mo.haut * 0.62); mo.bulleB.position.y = mo.haut * 0.45; } else if (mo.bulleB) mo.bulleB.visible = false;
  if (mo.galva > 0) { mo.galva -= dt; if (!mo.anneauG) { mo.anneauG = new T.Mesh(new T.RingGeometry(0.45, 0.62, 24), new T.MeshBasicMaterial({ color: '#f2b630', transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false })); mo.anneauG.rotation.x = -Math.PI / 2; mo.anneauG.position.y = 0.07; mo.anneauG.scale.setScalar(Math.max(1, mo.d.ombre * 0.8)); m.add(mo.anneauG); } mo.anneauG.visible = true; mo.anneauG.material.color.set(mo.galvaC || '#f2b630');
    if (mo.galvaC && Math.random() < dt * 6) emettre(FX_LUM, 1, { x: mo.x + (Math.random() - 0.5) * 0.9, y: m.position.y + 0.2, z: mo.z + (Math.random() - 0.5) * 0.9, v: [0, 1.7, 0], vie: [0.5, 0.8], taille: [0.15, 0.03], c: ['#ffffff', mo.galvaC], a: 0.85 }); } else if (mo.anneauG) mo.anneauG.visible = false;
}
function capSoin(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.soigne) { /* le Mage soigne le Bwork le plus blesse autour de lui */
    mo.soinT = (mo.soinT || 0) + dt;
    if (mo.soinT >= mo.d.soigne) {
      mo.soinT = 0;
      const b = combat.monstres.filter((o) => o.etat === 'actif' && o.pv < o.pvMax && Math.hypot(o.x - mo.x, o.z - mo.z) < 7 && !(o === mo && (mo.d.boss || mo.d.demi))).sort( /* (un boss ou un demi-boss qui soigne soigne sa troupe, pas lui-meme : l'Ancestral, 08/11/2026) */(a, c) => a.pv / a.pvMax - c.pv / c.pvMax)[0];
      if (b && mo.d.gesteSoin && !mo.geste) gesteSort(mo, 'sort', 0.5); /* (le Venerable leve son baton quand il soigne, 08/11/2026) */
      if (b) { const h = Math.max(1, Math.round(b.pvMax * (b.d.boss ? (mo.d.soinBoss || 0.025) : 0.12))); /* (soinBoss : la Tortue Verte, 1 % sur un boss, 07/11/2026) */ /* (un boss, 2,5 % : 12 % de ses PV, c'etait un boss increvable) */ b.pv = Math.min(b.pvMax, b.pv + h); chiffre('+' + h, new T.Vector3(b.x, b.m.position.y + b.haut - 0.2, b.z), 'soin'); pouf(b.x, b.m.position.y, b.z, 1.6, '#5fe0e8'); }
    }
  }
}
/* LE BAIN DE BOUE du Dragon Cochon (01/11/2026, par Discord : « un sort qu'il lance qui s'appelle bain de boue : ca remplit la plupart de la map de boue, qui booste
   la vitesse du Dragon Cochon et qui nous ralentit nous », Mathieu). Il se dresse et s'abat, la boue jaillit en geysers et s'etale en grandes flaques sur la plus grande
   partie du terrain, des ilots secs entre elles. Dedans, tu es ralenti (la lenteur de la Momie, x0,55) ; lui court x v. Les flaques sechent au bout de duree, ou a sa mort.
   Fiche : bain: { periode, duree, R (le rayon couvert autour de vous deux), n (le nombre de flaques), v } */
function flaqueBoue(x, z, r) { /* une grande flaque aux bords irreguliers, son liseré plus clair dessous */
  const g = new T.Group(), y = solA(x, z), forme = (rr, dec) => { const geo = new T.CircleGeometry(rr, 40), P = geo.attributes.position;
    for (let i = 1; i < P.count; i++) { const a = Math.atan2(P.getY(i), P.getX(i)), k = 1 + 0.12 * Math.sin(a * 3 + dec) + 0.07 * Math.sin(a * 7 + dec * 2.3); P.setXY(i, P.getX(i) * k, P.getY(i) * k); } return geo; };
  const dec = fxAlea() * 6, mB = new T.MeshBasicMaterial({ color: '#7a5230', transparent: true, opacity: 0.55, depthWrite: false }), mF = new T.MeshBasicMaterial({ color: '#4e321a', transparent: true, opacity: 0.85, depthWrite: false });
  const bord = new T.Mesh(forme(r * 1.08, dec), mB), fond = new T.Mesh(forme(r, dec), mF); [bord, fond].forEach((o, i) => { o.rotation.x = -Math.PI / 2; o.position.y = 0.04 + i * 0.01; o.renderOrder = 2; g.add(o); });
  g.position.set(x, y, z); g.scale.setScalar(0.01); scene.add(g); return { g, x, z, r, y, mB, mF };
}
function capBain(mo, ctx) {
  const { pp, sortPret } = ctx, B = mo.d.bain; if (!B || combat.deroute != null || combat.bain) return;
  if (!sortPret('bainT', B.periode)) return;
  mo.bainT = 0; const c0 = combat, prepa = 1.0; mo.bloqueT = prepa + 0.4; mo.frappe = 0.4; prepaSeisme(mo, mo.x, mo.z, 3, prepa);
  if (!c0.bainVu) { c0.bainVu = true; toast(leNom(mo.d) + ' répand un bain de boue : dedans tu es ralenti et lui court plus vite, cherche les coins secs !', 'alerte'); }
  const cx = (mo.x + pp.x) / 2, cz = (mo.z + pp.z) / 2, P = [{ x: mo.x, z: mo.z, r: 3.8 }, { x: pp.x, z: pp.z, r: 3.2 }]; /* (une sous lui, une sous toi : pas d'esquive au moment ou elle jaillit) */
  for (let e = 0; e < 60 && P.length < B.n; e++) { const a = fxAlea() * Math.PI * 2, d = Math.sqrt(fxAlea()) * B.R, q = pointValide(cx, cz, cx + Math.cos(a) * d, cz + Math.sin(a) * d);
    if (P.every((o) => Math.hypot(o.x - q.x, o.z - q.z) > 3.4)) P.push({ x: q.x, z: q.z, r: 2.6 + fxAlea() * 1.6 }); } /* (assez ecartees pour laisser des ilots secs) */
  const F = []; c0.bain = { F, de: mo }; let t = 0, tic = 0, pas = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin) { F.forEach((f) => jeter(f.g)); mo.boueV = 0; return true; }
    if (!c0.bain.fin && mo.etat !== 'actif') c0.bain.fin = t + 1; /* (il meurt : sa boue seche en 1 s) */
    const fin = c0.bain.fin || prepa + B.duree + 1; if (t >= fin) { F.forEach((f) => jeter(f.g)); mo.boueV = 0; c0.bain = null; return true; }
    if (t < prepa) return false;
    if (!F.length && mo.etat === 'actif') { secousse(0.22, 0.45); const y0 = solA(mo.x, mo.z); onde(mo.x, y0, mo.z, B.R, '#8e6640', 0.7, 1); mottes(mo.x, y0, mo.z, 12, 1.2);
      P.forEach((p) => { const f = flaqueBoue(p.x, p.z, p.r); f.t0 = 0.1 * fxAlea() + Math.hypot(p.x - mo.x, p.z - mo.z) * 0.05; F.push(f); }); } /* (elle s'etale depuis lui) */
    const u = t - prepa, finK = Math.min(1, fin - t), pp2 = paysanMesh.position; let dedans = false, lui = false;
    F.forEach((f) => { const k = Math.max(0, Math.min(1, (u - f.t0) / 0.7)); if (k > 0 && !f.jailli) { f.jailli = true; emettre(FX_VIF, 14, { x: f.x, y: f.y + 0.2, z: f.z, r: 0.4, v: [0, 5, 0], dv: 2.5, vie: [0.5, 0.9], taille: [0.22, 0.08], c: ['#6a4524', '#4a2f18', '#8e6640'], grav: 11 }); pouf(f.x, f.y, f.z, f.r * 0.6, '#6a4524'); } /* (un geyser de boue, puis elle s'etale) */
      f.g.scale.setScalar(Math.max(0.01, 1 - Math.pow(1 - k, 3))); f.mF.opacity = 0.85 * Math.min(1, finK); f.mB.opacity = 0.55 * Math.min(1, finK);
      if (k >= 1 && finK > 0.3) { if (Math.hypot(pp2.x - f.x, pp2.z - f.z) < f.r * 0.95) dedans = true; if (mo.etat === 'actif' && Math.hypot(mo.x - f.x, mo.z - f.z) < f.r) lui = true; } });
    if ((tic += dt) > 0.16 && finK > 0.5) { tic = 0; const f = F[Math.floor(fxAlea() * F.length)]; if (f) { const a = fxAlea() * Math.PI * 2, d = fxAlea() * f.r * 0.8; lueur(new T.Vector3(f.x + Math.cos(a) * d, f.y + 0.12, f.z + Math.sin(a) * d), '#3e2814', 1.8, 0.45); } } /* (des bulles crevent) */
    if (dedans) { c0.lenteur = Math.max(c0.lenteur || 0, 0.15); } mo.boueV = lui ? B.v : 0;
    if ((pas += dt) > 0.14) { pas = 0; if (lui && !(mo.bloqueT > 0)) emettre(FX_VIF, 3, { x: mo.x, y: solA(mo.x, mo.z) + 0.15, z: mo.z, r: 0.6, v: [0, 2, 0], dv: 1.5, vie: [0.3, 0.5], taille: [0.16, 0.06], c: ['#6a4524', '#4a2f18'], grav: 10 }); /* (il patauge, ca gicle) */
      if (dedans) emettre(FX_VIF, 2, { x: pp2.x, y: pp2.y + 0.1, z: pp2.z, r: 0.25, v: [0, 1.5, 0], dv: 1, vie: [0.25, 0.4], taille: [0.12, 0.05], c: ['#6a4524', '#4a2f18'], grav: 10 }); }
    return false; });
}
function capBoue(mo, ctx) { /* le Crachat de boue du Dragon Cochon (le Bain de boue jusqu'au 01/11/2026, 20/10/2026) : un cercle rouge sous toi (ESQUIVE.boue pour en sortir) ; dedans, la boue te colle sur place.
     31/10/2026 (par Discord, la revue des boss un par un) : il se cabre, gonfle une boule de boue dans sa gueule et te la crache en cloche ; elle s'ecrase sur le cercle
     a la fin du delai, gicle en mottes et en gouttes, et laisse une flaque qui bouillonne 3 s (le decor, les regles ne changent pas) */
  const { pp, sortPret } = ctx;
  if (!mo.d.boue || combat.deroute != null || !sortPret('boueT', mo.d.boue)) return;
  mo.boueT = 0; mo.bloqueT = ESQUIVE.boue + 0.3; mo.frappe = 0.4; const x0 = pp.x, z0 = pp.z, c0 = combat;
  /* (la toile de l'Abrakne, 08/11/2026 : le meme crachat, en blanc ; le geste « sort » des monstres a squelette, sa gueule qui crache) */
  const C_ = mo.d.toile ? ['#e9ede4', '#ffffff', '#c7cfbf', '#f4f6f0', '#e3e8de', '#ffffff'] : ['#5a3a1e', '#7a5230', '#4a2f18', '#6a4524', '#9a7650', '#8e6640']; gesteSort(mo, gesteDe(mo, 'boue', 'sort'), 0.5);
  if (!combat.boueVu) { combat.boueVu = true; toast(leNom(mo.d) + (mo.d.toile ? ' te crache une toile collante' : ' te crache de la boue') + ' : sors du cercle rouge, sinon tu restes collé !', 'alerte'); }
  const a = Math.atan2(x0 - mo.x, z0 - mo.z), k = Math.max(1, (mo.haut || 3) / 3.2), av = (mo.d.ombre || 2) * 0.45, R = mo.d.boueR || 1.6; mo.ry = a; /* (boueR : 2,6 pour le Dragon Cochon depuis le 07/11/2026) */
  const boule = new T.Group(), coeur = new T.Mesh(new T.IcosahedronGeometry(0.5 * k, 1), mat(C_[0])); boule.add(coeur);
  for (let i = 0; i < 4; i++) { const b = new T.Mesh(new T.IcosahedronGeometry(0.22 * k, 0), mat(i % 2 ? C_[1] : C_[2])), u = i * 1.7; b.position.set(Math.cos(u) * 0.4 * k, Math.sin(u * 1.3) * 0.3 * k, Math.sin(u) * 0.4 * k); boule.add(b); } /* (des grumeaux, pas une bille lisse) */
  boule.traverse((o) => { if (o.isMesh) o.castShadow = true; }); boule.scale.setScalar(0.01); scene.add(boule);
  const tg = 0.55, vol = ESQUIVE.boue - tg, dP = Math.hypot(x0 - mo.x, z0 - mo.z), H = 2 + dP * 0.15, vers = new T.Vector3(x0, solA(x0, z0) + 0.35 * k, z0);
  const bouche = () => new T.Vector3(mo.x + Math.sin(a) * av, mo.m.position.y + (mo.haut || 3) * 0.5, mo.z + Math.cos(a) * av);
  let t = 0, de = null, goutte = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || (!de && mo.etat !== 'actif')) { jeter(boule); mo.penche = 0; mo.teteB = 0; return true; }
    if (t < tg) { const u = Math.min(1, t / tg); boule.position.copy(bouche()); boule.scale.setScalar(0.15 + 0.85 * u); boule.rotation.y += dt * 3; mo.penche = -0.25 * u; mo.teteB = -0.3 * u; /* (il se cabre, la boule gonfle dans sa gueule) */
      if ((goutte += dt) > 0.08) { goutte = 0; emettre(FX_VIF, 2, { x: boule.position.x, y: boule.position.y - 0.3 * k, z: boule.position.z, r: 0.3 * k, dv: 0.6, vie: [0.3, 0.5], taille: [0.14, 0.06], c: [C_[3], C_[2]], grav: 9 }); }
      return false; }
    if (!de) { de = boule.position.clone(); mo.penche = 0.3; mo.teteB = 0.35; secousse(0.05, 0.12); poussiere(de.x, solA(de.x, de.z), de.z, 6, 0.8, C_[4]); }
    const u = Math.min(1, (t - tg) / vol); mo.penche = 0.3 * (1 - u); mo.teteB = 0.35 * (1 - u); boule.position.lerpVectors(de, vers, u); boule.position.y += Math.sin(u * Math.PI) * H; boule.rotation.set(u * 7, a, u * 4); boule.scale.setScalar(1);
    if ((goutte += dt) > 0.05) { goutte = 0; emettre(FX_VIF, 2, { x: boule.position.x, y: boule.position.y, z: boule.position.z, r: 0.25 * k, dv: 0.8, vie: [0.35, 0.6], taille: [0.16, 0.06], c: [C_[3], C_[2]], grav: 10 }); } /* (elle goutte en vol) */
    if (u < 1) return false; jeter(boule); return true; });
  zoneDanger({ mo, x: x0, z: z0, r: R, duree: ESQUIVE.boue, effet: (d) => { const y = solA(x0, z0); pouf(x0, y, z0, 4, C_[3]); pouf(x0, y, z0, 2.2, C_[5]);
    secousse(0.12, 0.22); onde(x0, y, z0, R + 0.8, C_[5], 0.45, 0.9); mottes(x0, y, z0, 14, 1.2); poussiere(x0, y, z0, 8, R, C_[4]);
    emettre(FX_VIF, 26, { x: x0, y: y + 0.3, z: z0, r: 0.5, dv: 6, haut: true, vie: [0.45, 0.8], taille: [0.2, 0.08], c: [C_[3], C_[2], C_[5]], grav: 12, frein: 0.6 }); /* (la boue gicle) */
    const mf = new T.MeshBasicMaterial({ color: C_[0], transparent: true, opacity: 0.8, depthWrite: false }), fl = new T.Mesh(new T.CircleGeometry(R * 0.9, 28), mf);
    fl.rotation.x = -Math.PI / 2; fl.position.set(x0, y + 0.05, z0); fl.renderOrder = 2; scene.add(fl); let s2 = 0, bulle = 0;
    effets.push((d2) => { s2 += d2; bulle += d2; if (combat !== c0 || c0.fin || s2 >= 3) { jeter(fl); return true; } mf.opacity = 0.8 * Math.min(1, (3 - s2) / 0.6); fl.scale.setScalar(Math.min(1, 0.6 + s2 * 2));
      if (bulle >= 0.18 && s2 < 2.5) { bulle = 0; const b = fxAlea() * Math.PI * 2, r2 = fxAlea() * R * 0.8; lueur(new T.Vector3(x0 + Math.cos(b) * r2, y + 0.12, z0 + Math.sin(b) * r2), C_[2], 1.6, 0.4); } }); /* (la flaque bouillonne puis seche) */
    const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) { if (mo.d.boss && (mo.d.sortsX || {}).boue) { blesserPerso(Math.max(1, Math.round(degSort(mo) * mo.d.sortsX.boue)), mo); effetsCoup(mo); if (!combat || combat.fin || combat !== c0) return; } coller(DUREE_COLLE, 'Collé !', true); } } }); /* (07/11/2026 : la boule de boue frappe aussi, sortsX.boue fois ses degats de sort) */
}
/* LE COUP D'AILE DE CROCABULIA (03/11/2026, « ouais coup d'aile vas y », Mathieu) : pendant l'arc rouge (ESQUIVE.brassard), une aile se leve et se tire en
   arriere, le corps tourne pour armer, l'aile tremble de tension ; puis elle la balaie vers l'avant en 0,2 s, a l'horizontale, le corps tourne avec, des braises
   filent du bout de l'aile ; puis l'aile revient a son battement. cote : 1 l'aile droite (aile_pivot_D, cote +x, en arriere vers +y), -1 la gauche (en miroir) */
function coupDAile(mo, A, dt) {
  const C = mo.coupAile; C.t += dt; const t = C.t, ARME = ESQUIVE.brassard - 0.13, FRAPPE = 0.2, FIN = 0.5, /* (le balayage part 0,13 s avant le coup : l'aile passe devant elle quand il touche, capBrassard) */ i = C.cote > 0 ? 1 : 0, P = A[i], sg = i ? 1 : -1;
  if (t >= ARME + FRAPPE + FIN || mo.etat !== 'actif') { if (C.trace) C.trace(2); mo.coupAile = null; mo.tourne = 0; mo.hop = 0; mo.penche = 0; return; }
  let y, z, tr, h, pe, w; /* y : l'aile en arriere (+) ou en avant (-) ; z : levee (+) ; tr : le corps qui arme (-) puis suit le coup (+) ; h, pe : il se hisse et se cambre, puis plonge ; w : la part du geste sur le battement */
  if (t < ARME) { const k = Math.min(1, t / 0.45), e = k * k * (3 - 2 * k), fr = Math.sin(t * 31) * 0.035 * e; y = 1.0 * e + fr; z = 1.15 * e - fr; tr = -0.45 * e; h = 0.35 * e; pe = -0.12 * e; w = e; }
  else if (t < ARME + FRAPPE) { const u = (t - ARME) / FRAPPE, e = 1 - Math.pow(1 - u, 3); y = 1.0 - 2.6 * e; z = 1.15 - 1.55 * e; tr = -0.45 + 1.05 * e; h = 0.35 - 0.5 * e; pe = -0.12 + 0.34 * e; w = 1;
    if (!C.trace) C.trace = traineeAile(mo, sg); C.trace(u);
    if (P) { const B = boiteAile(mo, P, i), fx = Math.sin(mo.ry), fz = Math.cos(mo.ry); for (let k = 0; k < 2; k++) { const f = 0.55 + Math.random() * 0.45, q = P.localToWorld(new T.Vector3(sg > 0 ? B.min.x + (B.max.x - B.min.x) * f : B.max.x - (B.max.x - B.min.x) * f, B.max.y - (B.max.y - B.min.y) * 0.2, (B.min.z + B.max.z) / 2)), v = 6 + Math.random() * 4;
      emettre(FX_VIF, 1, { x: q.x, y: q.y, z: q.z, r: 0.15, v: [fx * v, 0.8, fz * v], dv: 1.5, vie: [0.18, 0.3], taille: [0.09, 0.03], c: ['#fff1a8', '#ffb02e', '#ff5a1e'], a: 1, grav: 3, frein: 1.2, etire: 0.04 }); } } } /* (de fines etincelles etirees, lancees vers l'avant depuis un point au hasard du bord de l'aile : plus de braises rondes en rangs) */
  else { const u = (t - ARME - FRAPPE) / FIN, e = u * u * (3 - 2 * u); if (C.trace) { C.trace(1 + u); } y = -1.6; z = -0.4; tr = 0.6 * (1 - e); h = -0.15 * (1 - e); pe = 0.22 * (1 - e); w = 1 - e; }
  if (P) { P.rotation.y = P.rotation.y * (1 - w) + sg * y * w; P.rotation.z = P.rotation.z * (1 - w) + sg * z * w; }
  mo.tourne = -sg * tr; mo.hop = h; mo.penche = pe;
}
/* le bord de l'aile, dans le repere de son pivot (calcule une fois) : les braises partent du bord d'attaque, du milieu jusqu'au bout */
function boiteAile(mo, P, i) {
  const K = mo.boitesAile || (mo.boitesAile = []); if (K[i]) return K[i];
  P.updateMatrixWorld(true); const inv = new T.Matrix4().copy(P.matrixWorld).invert(), b = new T.Box3();
  P.traverse((o) => { if (!o.isMesh) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.union(o.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inv, o.matrixWorld))); });
  return (K[i] = b);
}
/* la trainee de feu du Coup d'aile : une flamme a hauteur d'aile, du flanc de l'aile vers l'avant et au-dela, qui suit le bout de l'aile comme une
   comete (vive a la tete, qui s'eteint derriere elle, les bords fondus et dechiquetes, jamais un arc de cercle parfait, 03/11/2026) ; apres le coup, la queue la rattrape et elle s'efface en s'evasant.
   sg : 1 l'aile droite (flanc +x), -1 la gauche. Rend une fonction f(u) : u de 0 a 1, le coup ; de 1 a 2, l'effacement ; 2, la fin */
function traineeAile(mo, sg) {
  const N = 32, L = 2.6, th0 = sg > 0 ? -0.4 : Math.PI - 0.4, W = [-1, -0.5, 0, 0.5, 1], J = W.length, AL = [0, 0.8, 1, 0.75, 0], CO = ['#a81e0a', '#ff4a12', '#ffb03a', '#ff6a1e', '#b8240e'].map((x) => new T.Color(x)); /* (cinq rangs en travers : bords transparents, donc fondus ; orange vif au coeur, rouge aux bords) */
  const ph = [0, 1, 2, 3].map(() => Math.random() * 6.28), pos = new Float32Array((N + 1) * J * 3), col = new Float32Array((N + 1) * J * 4), ind = []; /* (des phases au hasard : deux coups d'aile ne se ressemblent pas) */
  for (let k = 0; k <= N; k++) { for (let j = 0; j < J; j++) { const v = k * J + j, cc = CO[j].clone().lerp(CO[2], Math.random() * 0.3); col.set([cc.r, cc.g, cc.b, 0], v * 4); }
    if (k < N) for (let j = 0; j < J - 1; j++) { const p = k * J + j; ind.push(p, p + J, p + 1, p + 1, p + J, p + J + 1); } }
  const geo = new T.BufferGeometry(), C = new T.BufferAttribute(col, 4), P = new T.BufferAttribute(pos, 3); geo.setAttribute('position', P); geo.setAttribute('color', C); geo.setIndex(ind);
  const m = new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: T.DoubleSide })); if (sg > 0) m.scale.y = -1; m.renderOrder = 6; m.frustumCulled = false; /* (a droite, retournee : elle se dessine du flanc vers l'avant ; sa forme change a chaque image, d'ou pas de tri par la boite) */
  const g = new T.Group(); g.add(m); g.rotation.order = 'YXZ'; g.rotation.set(-Math.PI / 2, mo.ry, 0); g.position.set(mo.x, mo.m.position.y + 2.1, mo.z); scene.add(g);
  let fini = false; const c0 = combat; effets.push(() => { if (fini || combat !== c0) { jeter(g); return true; } });
  return (u) => { if (u >= 2) { fini = true; return; } const tete = u <= 1 ? u * N : N + (u - 1) * N * 0.8, f = u <= 1 ? 1 : 2 - u, q = u * 7;
    for (let k = 0; k <= N; k++) { const a = k / N, d = tete - k, e = Math.min(1, Math.max(0, (d + 0.5) / 3)), hw = 1.5 * (0.4 + 0.6 * Math.exp(-Math.max(0, d) / (N * 0.5))) * e * e * (3 - 2 * e); /* (large a la tete, effilee a la queue, pointue au bout) */
      const rc = 3.0 + 0.8 * a + Math.sin(k * 0.5 + ph[0] + q) * 0.12, th = th0 + L * a, zc = 0.3 - 0.6 * a + Math.sin(k * 0.42 + ph[2] + q * 0.6) * 0.15; /* (une spirale qui s'ouvre, et qui descend avec l'aile en ondulant) */
      const al = k > tete + 0.5 ? 0 : Math.exp(-Math.max(0, d) / (N * 0.45)) * f * (0.78 + 0.22 * Math.sin(k * 2.3 + ph[3] + q * 3)); /* (des stries de lumiere le long) */
      for (let j = 0; j < J; j++) { const w = W[j], v = k * J + j, r = rc + w * hw + Math.abs(w) * 0.17 * (Math.sin(k * 1.9 + j * 2.7 + q * 2.1 + ph[j % 4]) + 0.6 * Math.sin(k * 0.71 - q * 1.3 + j)); /* (des bords dechiquetes qui bougent, comme une flamme) */
        pos[v * 3] = r * Math.cos(th); pos[v * 3 + 1] = r * Math.sin(th); pos[v * 3 + 2] = zc + Math.abs(w) * Math.sin(k * 1.3 + j + q) * 0.06; C.array[v * 4 + 3] = AL[j] * al; } }
    P.needsUpdate = true; C.needsUpdate = true; const s = u <= 1 ? 1 : 1 + (u - 1) * 0.12; g.scale.set(s, s, 1); };
}
function capBrassard(mo, ctx) { /* le coup de brassard de la Gorgouille (20/10/2026) : un arc rouge devant elle (ESQUIVE.brassard pour en sortir), puis le coup, qui repousse */
  const { dt, pp, sortPret } = ctx;
  if (!mo.d.brassard || mo.ancre || combat.deroute != null) return;
  if (!mo.viseB && Math.hypot(pp.x - mo.x, pp.z - mo.z) < Math.max(6, (mo.d.brassardR || 4.2) + 1) && sortPret('brassardT', mo.d.brassard)) {
    mo.brassardT = 0; const a = Math.atan2(pp.x - mo.x, pp.z - mo.z), R = mo.d.brassardR || 4.2, OUV = 1.3, /* (brassardR : la Gorgouille, 5,2 depuis le 31/10/2026) */ c0 = combat, ESQ = mo.d.brassardEsquive || ESQUIVE.brassard; /* (brassardEsquive : le Chene Mou, 1,2 s, 10/11/2026) */ mo.ry = a; mo.bloqueT = ESQ + 0.4;
    const c = new T.Mesh(new T.CircleGeometry(R, 24, Math.PI / 2 - OUV / 2, OUV), new T.MeshBasicMaterial({ color: COULEUR_CAC, transparent: true, opacity: 0.3, depthWrite: false, side: T.DoubleSide }));
    c.rotation.set(-Math.PI / 2, 0, a - Math.PI); c.position.set(mo.x, (mo.d.vol ? solA(mo.x, mo.z) : mo.m.position.y) + 0.07, mo.z); c.renderOrder = 2; scene.add(c);
    { const b = new T.Mesh(new T.RingGeometry(R - 0.16, R, 24, 1, Math.PI / 2 - OUV / 2, OUV), new T.MeshBasicMaterial({ color: COULEUR_CAC, transparent: true, opacity: 0.95, depthWrite: false, side: T.DoubleSide })); b.renderOrder = 2; c.add(b); } /* (un liseré vif au bout de l'arc, comme les cercles : l'arc seul etait pale, 05/11/2026) */ /* (au sol sous Crocabulia, qui vole : son arc flottait a 1,3 au-dessus, 03/11/2026) */
    if (mo.d.coupAile) mo.coupAile = { t: 0, cote: (mo.coteAile = -(mo.coteAile || -1)) }; /* (une aile puis l'autre, majMonstre) */
    mo.viseB = { a, t: 0, c, R, OUV, x: mo.x, z: mo.z, esq: ESQ }; gesteSort(mo, gesteDe(mo, 'brassard', 'coup'), ESQ); /* (un monstre a squelette arme son coup pendant que l'arc s'affiche, 28/10/2026) */
    effets.push(() => { if (combat !== c0 || mo.etat !== 'actif' || !mo.viseB || mo.viseB.c !== c) { jeter(c); if (mo.viseB && mo.viseB.c === c) mo.viseB = null; return true; } }); /* (l'arc s'efface si elle tombe avant de frapper) */
    if (!combat.brassardVu) { combat.brassardVu = true; toast(leNom(mo.d) + ' ' + (mo.d.brassardNom || 'arme son brassard') + ' : sors de l\'arc bleu, sinon ' + (mo.d.fem ? 'elle' : 'il') + ' te repousse !', 'alerte'); }
  }
  const V = mo.viseB; if (!V) return;
  V.t += dt; V.c.material.opacity = 0.3 + 0.28 * Math.abs(Math.sin(V.t * 9));
  if (V.t >= (V.esq || ESQUIVE.brassard)) { mo.viseB = null; mo.frappe = 0.4; pouf(V.x + Math.sin(V.a) * 1.8, mo.m.position.y, V.z + Math.cos(V.a) * 1.8, 4, '#8e7a5e');
    const d = Math.hypot(pp.x - V.x, pp.z - V.z); let e = Math.atan2(pp.x - V.x, pp.z - V.z) - V.a; e = Math.atan2(Math.sin(e), Math.cos(e));
    if (mo.d.coupAile) { const y0 = solA(V.x, V.z); rafaleVent(V.x + Math.sin(V.a) * 3, y0, V.z + Math.cos(V.a) * 3, 1.6); flashLumiere(V.x + Math.sin(V.a) * 2.5, y0 + 2, V.z + Math.cos(V.a) * 2.5, '#ff8a2e', 2.2, 7, 0.35); secousse(0.05, 0.25); } /* (l'air balaye devant elle) */
    if (d < V.R && Math.abs(e) < V.OUV / 2) { blesserPerso(Math.max(1, Math.round(degSort(mo) * ((mo.d.sortsX || {}).brassard || 1))), mo); if (combat && !combat.fin && mo.d.repousse) repousserPerso(mo, mo.d.repousse); } }
}
/* LE TOURBILLON DE HACHE (05/11/2026, le Bworker : ses deux sorts, le Bond et la Hache lancee, attendent quand on est colle a lui, il n'avait plus rien
   au corps a corps) : il leve sa hache et se tord, un cercle bleu autour de lui ; a la fin du cercle il tourne deux fois sur lui-meme, la hache tendue,
   et tout ce qui est dans le cercle prend le coup. Fiche : tourbillon: { periode, R, prepa, x } (x : part de ses degats de sort) */
function capTourbillon(mo, ctx) {
  const { pp, sortPret } = ctx, W = mo.d.tourbillon; if (!W || mo.tourb) return;
  if (!sortPret('tourbillonT', W.periode) || Math.hypot(pp.x - mo.x, pp.z - mo.z) > W.R + 0.5) return; /* (pret, il attend que tu sois dans son cercle) */
  mo.tourbillonT = 0; mo.tourb = true; const c0 = combat, x0 = mo.x, z0 = mo.z, TOUR = 0.6; mo.bloqueT = W.prepa + TOUR + 0.15; mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z);
  if (!c0.tourbillonVu) { c0.tourbillonVu = true; toast(leNom(mo.d) + ' lève sa hache pour tournoyer : sors du cercle bleu !', 'alerte'); }
  let t = 0; const fin = () => { mo.tourne = 0; mo.penche = 0; mo.hop = 0; mo.tourb = false; return true; };
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') return fin();
    if (t < W.prepa) { const a = Math.min(1, t / W.prepa), e = a * a * (3 - 2 * a); mo.tourne = -0.7 * e; mo.penche = -0.18 * e; mo.hop = 0; return; } /* (il arme : le buste tordu, la hache en arriere) */
    const u = Math.min(1, (t - W.prepa) / TOUR), e = 1 - Math.pow(1 - u, 2.2); mo.tourne = -0.7 + e * (Math.PI * 4 + 0.7); mo.penche = -0.18 * (1 - u) + 0.12 * Math.sin(u * Math.PI); mo.hop = 0.18 * Math.sin(u * Math.PI);
    if (u > 0.1 && u < 0.9 && Math.random() < dt * 30) { const b = mo.ry + mo.tourne, r = W.R * 0.8, q = { x: mo.x + Math.sin(b) * r, z: mo.z + Math.cos(b) * r }; poussiere(q.x, solA(q.x, q.z), q.z, 2, 0.6, '#d8c6a0'); } /* (la hache rase le sol) */
    if (u >= 1) return fin(); });
  zoneDanger({ mo, x: x0, z: z0, r: W.R, duree: W.prepa, couleur: COULEUR_CAC, effet: (d) => {
    const y = mo.m.position.y; onde(x0, y + 0.05, z0, W.R, '#dffbff', 0.4, 0.85); onde(x0, y + 0.05, z0, W.R * 0.75, COULEUR_CAC, 0.5, 0.5, true); secousse(0.1, 0.22); mo.frappe = 0.4;
    const p = paysanMesh.position; if (dansDanger(d, p.x, p.z)) { blesserPerso(Math.max(1, Math.round(degSort(mo) * W.x)), mo); if (W.repousse && combat && !combat.fin) repousserPerso(mo, W.repousse); }
    if (combat && !combat.fin) clesBats().forEach((k) => { const z = zoneBat(k); if (z && !enRuine(k) && Math.hypot(z.x - x0, z.z - z0) < W.R + Math.max(z.hw, z.hd)) blesserBat(k, degatsBatiment(1, mo)); }); } });
}
/* LES RACINES (05/11/2026, l'Abraknyde : « un sort d'entrave a mi-distance », Mathieu) : il leve ses branches et les plante dans le sol (son geste « sort »),
   un cercle rouge sous toi ; a la fin, des racines brunes jaillissent du cercle en tournant et retombent ; dedans, tu es enracine (coller, comme la boue
   du Dragon Cochon) et tu prends un peu de degats. Un sort de loin : colle a lui, il attend (SORTS_LOIN) */
function capRacines(mo, ctx) {
  const { pp, sortPret } = ctx, R = mo.d.racines; if (!R || combat.deroute != null) return;
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('racinesT', R.periode) || mo.geste) return; if (dP < R.min || dP > R.max) { mo.racinesT = R.periode; return; } /* (pret, il attend que tu sois a mi-distance) */
  mo.racinesT = 0; const c0 = combat, x0 = pp.x, z0 = pp.z; mo.ry = Math.atan2(x0 - mo.x, z0 - mo.z); mo.bloqueT = R.prepa + 0.5; mo.cd = Math.max(mo.cd || 0, R.prepa + 0.6);
  gesteSort(mo, gesteDe(mo, 'racines', 'sort'), R.prepa);
  if (!c0.racinesVu) { c0.racinesVu = true; toast(leNom(mo.d) + (mo.d.racinesTxt || ' plante ses branches dans le sol : sors du cercle rouge, sinon ses racines t\'enracinent !'), 'alerte'); }
  if (R.graine) { /* (le Semeur, 05/11/2026 : une graine collante qui vole de sa main jusqu'au cercle, elle y tombe a la fin de l'attente) */
    const g = glandVolant(0.7), H = 2.2, vers = new T.Vector3(x0, solA(x0, z0) + 0.1, z0); let de = null, tv = 0; const vol = R.prepa * 0.55, part = R.prepa - vol;
    effets.push((dt) => { tv += dt; if (combat !== c0 || c0.fin) { if (de) jeter(g); return true; } if (tv < part) return false; if (!de) { de = mainSquelette(mo) || new T.Vector3(mo.x, mo.m.position.y + 2.2, mo.z); scene.add(g); }
      const k = Math.min(1, (tv - part) / vol); g.position.lerpVectors(de, vers, k); g.position.y += Math.sin(k * Math.PI) * H; g.rotation.x += dt * 9;
      if (fxAlea() < 0.6) emettre(FX_LUM, 1, { x: g.position.x, y: g.position.y, z: g.position.z, vie: [0.2, 0.3], taille: [0.4, 0.08], c: ['#eaffb8', '#9be35a'], a: 0.7 }); if (k >= 1) { jeter(g); return true; } }); }
  let t = 0; const y0 = solA(x0, z0);
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || t >= R.prepa) return true; if (Math.random() < dt * 14) { const b = Math.random() * Math.PI * 2, r = Math.random() * R.R; poussiere(x0 + Math.cos(b) * r, y0, z0 + Math.sin(b) * r, 1, 0.3, '#8a6a44'); } }); /* (la terre fremit dans le cercle) */
  zoneDanger({ mo, x: x0, z: z0, r: R.R, duree: R.prepa, effet: (d) => {
    const y = solA(x0, z0); secousse(0.08, 0.2); impactElement('feuille', x0, z0, R.R); mottes(x0, y, z0, 10, R.R * 0.8); poussiere(x0, y, z0, 8, R.R, '#8a6a44');
    const p2 = paysanMesh.position, pris = dansDanger(d, p2.x, p2.z), cx = pris ? p2.x : x0, cz = pris ? p2.z : z0;
    racinesQuiSaisissent(cx, solA(cx, cz), cz, pris, R.duree);
    if (pris) { blesserPerso(Math.max(1, Math.round(degSort(mo) * R.x)), mo); if (combat && !combat.fin) coller(R.duree, 'Enraciné !'); } } });
}
/* IL S'ENFOUIT (08/11/2026, l'Abraknyde Ancestral, « sa mecanique est un poil trop simple », puis « on teste la B ? », Mathieu) : quand tu l'approches, il tremble,
   s'enfonce sous terre (on ne peut plus le viser), une trainee de terre court sous le sol jusqu'a plus loin, a l'oppose de toi, il ressort de terre comme un monstre
   qui grimpe, et la ou il etait, un cercle s'annonce puis ses racines jaillissent (degats, enracine 1 s). Fiche : enfouit: { periode, R (a moins de R de toi),
   loin (il ressort a peu pres a cette distance de toi), Rr (le cercle des racines), x (leurs degats, fois ses sorts) } */
function capEnfouit(mo, ctx) {
  const { pp, sortPret } = ctx, E = mo.d.enfouit; if (!E || combat.deroute != null || mo.etat !== 'actif') return;
  if (mo.enfouiT == null) mo.enfouiT = E.periode - 0.5; /* (pret presque des son arrivee : ses autres sorts retardaient sa recharge, il restait 7 s colle a toi) */
  if (E.maudit && mo.m.visible && Math.random() < ctx.dt * 12) { const a = Math.random() * 6.28, r = 0.8 + Math.random() * 1.6; emettre(FX_VIF, 1, { x: mo.x + Math.sin(a) * r, y: mo.m.position.y + Math.random() * (mo.haut || 4), z: mo.z + Math.cos(a) * r, r: 0.05, v: [0, 1.2, 0], dv: 0.3, vie: [0.6, 1.0], taille: [0.16, 0.02], c: ['#e6c2ff', '#8a3fc8'] }); } /* (l'aura de malefices de l'Ancestral Maudit) */
  /* (09/11/2026, « l'Ancestral classique est nul, il n'a pas ses sorts ou il s'enterre », Mathieu : il attendait qu'on l'approche a moins de E.R, un Cra qui tire de loin
     ne le voyait jamais plonger ; et sa recharge s'arretait pendant chacun de ses autres sorts, une plongee toutes les 15 a 20 s. Il plonge maintenant ou que tu sois,
     E.periode secondes apres etre ressorti, la recharge tourne meme pendant ses autres sorts ; il attend seulement d'avoir fini celui en cours) */
  if (mo.plonge) return; /* (10/11/2026 : sa recharge ne tourne plus pendant la plongee ; elle faisait 5,3 s sur les 6 de la recharge, il replongeait des qu'il ressortait et ne tirait jamais) */
  mo.enfouiT += ctx.dt * (mo.enrage ? 1.3 : 1); if (mo.enfouiT < E.periode || mo.bloqueT > 0 || mo.vise) return;
  let f = null; for (let k = 0; k < 16 && !f; k++) { const a = Math.atan2(mo.x - pp.x, mo.z - pp.z) + (Math.random() - 0.5) * (k < 8 ? 1.6 : 6), L = E.loin * (0.85 + Math.random() * 0.3), q = pointValide(pp.x, pp.z, pp.x + Math.sin(a) * L, pp.z + Math.cos(a) * L);
    if (Math.hypot(q.x - pp.x, q.z - pp.z) > E.loin * 0.6 && solSort(q.x, q.z)) f = q; } /* (plutot de l'autre cote de lui, loin de toi ; solSort et non caseIci : a l'Arene, sans cases de ferme, il ne s'enfouissait jamais, ni ses tetes, « il s'est pas enfonce une seule fois », Mathieu, 09/11/2026) */
  if (!f) { mo.enfouiT = E.periode - 2; return; }
  mo.enfouiT = 0; mo.plonge = true; const c0 = combat, x0 = mo.x, z0 = mo.z, y0 = solA(x0, z0), H = (mo.haut || 4) * 1.05, vie0 = mo.pv / mo.pvMax, nT = E.tetes ? E.tetes - 1 : vie0 > 0.75 ? 0 : vie0 > 0.5 ? 1 : vie0 > 0.25 ? 2 : 3, /* (E.tetes : l'Ancestral Maudit, ses quatre tetes a chaque fois) */ TELL = 0.5, DESC = 0.8, TRAJ = Math.max(2.7 + 0.35 * nT, Math.hypot(f.x - x0, f.z - z0) / 9); /* (2,7 s au moins : le temps qu'une de ses tetes surgisse, agisse et replonge) */
  mo.bloqueT = TELL + DESC + TRAJ + 1.3;
  if (!c0.enfouiVu) { c0.enfouiVu = true; toast(leNom(mo.d) + ' s\'enfonce sous terre : il ressort plus loin, et ses racines jaillissent là où il était !', 'alerte'); }
  let t = 0, sous = false;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat === 'mort') { mo.hop = 0; mo.plonge = false; if (mo.etat === 'enfoui') mo.etat = 'actif'; mo.m.visible = true; return true; }
    if (t < TELL) { if (Math.random() < dt * 20) poussiere(x0 + (Math.random() - 0.5) * 3, y0, z0 + (Math.random() - 0.5) * 3, 1, 0.5, '#8a6a44'); return false; } /* (la terre fremit autour de lui) */
    if (t < TELL + DESC) { const k = (t - TELL) / DESC; mo.hop = -H * k * k; if (Math.random() < dt * 25) mottes(x0, y0, z0, 2, 1.6); return false; } /* (il s'enfonce) */
    if (!sous) { sous = true; { const a0 = Math.random() * Math.PI * 2; for (let k = 0; k <= nT; k++) teteSurgit(mo, k, c0, a0 + k * Math.PI * 2 / (nT + 1), k * 0.35); } /* (les tetes s'additionnent : une de plus par quart de vie perdu, chacune ailleurs autour de toi, l'une apres l'autre, 08/11/2026, « A oui », Mathieu) */
      mo.hop = 0; mo.etat = 'enfoui'; mo.m.visible = false; mo.barre.hidden = true; secousse(0.12, 0.3); mottes(x0, y0, z0, 10, 2); poussiere(x0, y0, z0, 12, 2.2, '#8a6a44');
      zoneDanger({ mo, x: x0, z: z0, r: E.Rr, duree: 0.9, effet: (d) => { const y = solA(x0, z0); impactElement('feuille', x0, z0, E.Rr); mottes(x0, y, z0, 10, E.Rr * 0.8);
        const p2 = paysanMesh.position, pris = dansDanger(d, p2.x, p2.z), cx = pris ? p2.x : x0, cz = pris ? p2.z : z0; racinesQuiSaisissent(cx, solA(cx, cz), cz, pris, 1.0);
        if (pris) { blesserPerso(Math.max(1, Math.round(degSort(mo) * E.x)), mo); if (combat && !combat.fin) coller(1.0, 'Enraciné !'); if (E.maudit) maudirPerso(E.maudit.duree, E.maudit.x); } } });
      if (E.maudit) mareMaudite(mo, x0, z0, E.Rr * 1.15, E.maudit.mare, c0); }
    if (t < TELL + DESC + TRAJ) { const k = (t - TELL - DESC) / TRAJ, x = x0 + (f.x - x0) * k, z = z0 + (f.z - z0) * k, y = solA(x, z); if (Math.random() < dt * 30) { mottes(x, y, z, 2, 0.7); poussiere(x, y, z, 2, 0.6, '#8a6a44'); } return false; } /* (la trainee sous le sol) */
    mo.x = f.x; mo.z = f.z; mo.y = solA(f.x, f.z); mo.dep = { x: f.x, y: mo.y - H, z: f.z, friche: true }; mo.t = 0; mo.etat = 'grimpe'; mo.m.visible = true; mo.hop = 0; /* (il ressort de terre, comme un monstre qui grimpe) */
    mo.ry = Math.atan2(paysanMesh.position.x - f.x, paysanMesh.position.z - f.z); mo.m.rotation.y = mo.ry; secousse(0.1, 0.25); mottes(f.x, mo.y, f.z, 12, 2); impactElement('feuille', f.x, f.z, 2.5); mo.plonge = false; mo.enfouiT = 0; mo.bloqueT = 0.3; mo.cd = Math.min(mo.cd || 0, 0.6); return true; }); /* (ressorti : sa recharge repart de la, et il tire presque aussitot ; bloqueT : il ne se decompte pas sous terre, il restait 4 s sans rien faire apres chaque sortie) */
}
/* LA MALEDICTION DE L'ANCESTRAL MAUDIT (09/11/2026) : maudit, tu prends E.maudit.x fois les degats (blesserPerso) tant que l'anneau violet tourne sous tes pieds */
function teinterMonstre(m, d) { const L = d.lueur ? new T.Color(d.lueur) : null; m.traverse((o) => { if (o.isSkinnedMesh && o.name !== 'contour' && o.material) { o.material.color.set(d.teinte); if (L && o.material.emissive) o.material.emissive.copy(L); } }); if (L && m.userData.anim) m.userData.anim.lueur = L; }
function maudirPerso(duree, x) {
  const c0 = combat; if (!c0 || c0.fin) return; const deja = performance.now() < (c0.mauditJusque || 0); c0.mauditJusque = Math.max(c0.mauditJusque || 0, performance.now() + duree * 1000); c0.mauditX = x || 1.25;
  if (deja) return; { const p = paysanMesh.position.clone(); p.y += 2.2; chiffre('Maudit !', p, 'perso'); }
  if (!c0.mauditVu) { c0.mauditVu = true; toast('Tu es maudit : tu prends ' + Math.round(((x || 1.25) - 1) * 100) + ' % de dégâts en plus tant que l\'anneau violet tourne sous tes pieds. Évite ses racines et ses mares violettes !', 'alerte'); }
  const r = new T.Mesh(new T.RingGeometry(0.7, 0.95, 32), fxMat('#b05cff', 0.85)); r.rotation.x = -Math.PI / 2; r.material.blending = T.AdditiveBlending; sansClic(r); scene.add(r);
  effets.push((dt) => { if (combat !== c0 || c0.fin || performance.now() >= c0.mauditJusque) { scene.remove(r); r.geometry.dispose(); r.material.dispose(); return true; }
    const q = paysanMesh.position; r.position.set(q.x, solA(q.x, q.z) + 0.08, q.z); r.rotation.z += dt * 2;
    if (Math.random() < dt * 8) emettre(FX_VIF, 1, { x: q.x, y: q.y + 0.3, z: q.z, r: 0.5, v: [0, 1.6, 0], dv: 0.3, vie: [0.5, 0.8], taille: [0.12, 0.02], c: ['#e0b0ff', '#8a3fc8'] }); return false; });
}
function mareMaudite(mo, x, z, R, duree, c0) { /* une mare violette la ou il a plonge : dedans, tu es maudit */
  const y = solA(x, z) + 0.06, disque = new T.Mesh(new T.CircleGeometry(R, 32), fxMat('#7a2fc8', 0)), bord = new T.Mesh(new T.RingGeometry(R - 0.15, R, 40), fxMat('#c88cff', 0));
  [disque, bord].forEach((m) => { m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); sansClic(m); scene.add(m); });
  let t = 0; effets.push((dt) => { t += dt; const fin = combat !== c0 || c0.fin || t >= duree, k = Math.min(1, t / 0.4) * Math.max(0, Math.min(1, (duree - t) / 0.6)); disque.material.opacity = 0.35 * k; bord.material.opacity = 0.8 * k;
    if (fin) { [disque, bord].forEach((m) => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); }); return true; }
    if (Math.random() < dt * 14) { const a = Math.random() * 6.28, r = Math.random() * R; emettre(FX_VIF, 1, { x: x + Math.cos(a) * r, y: y + 0.1, z: z + Math.sin(a) * r, r: 0.05, v: [0, 1.4, 0], dv: 0.3, vie: [0.5, 0.9], taille: [0.14, 0.02], c: ['#e0b0ff', '#7a2fc8'] }); }
    const p = paysanMesh.position; if (t > 0.4 && Math.hypot(p.x - x, p.z - z) < R) maudirPerso(2.5, mo.d.enfouit.maudit.x); return false; });
}
/* SES TETES SURGISSENT (08/11/2026, « quand il est sous terre, ses tetes ressortent, en fonction de ses HP, tous les 25 % : une premiere tete de 100 a 75, une autre
   de 75 a 50, etc., et elles font des choses differentes », Mathieu) : pendant qu'il est sous terre, une tete sort du sol pres de toi, agit, et replonge.
   Les tetes sont decoupees dans son vrai modele (tetesAncestral, autour de ses yeux), avec sa texture et ses yeux qui luisent ; elles sortent 1,8 fois plus grosses.
   Puis (« A oui », Mathieu, 08/11/2026) elles s'additionnent : la seve seule, puis seve et feuilles, puis seve, feuilles et racines, sous 25 % les quatre, l'une apres l'autre.
   100-75 % la tete de seve (sous toi : degats et lenteur), 75-50 % la tete des feuilles (une tempete autour d'elle), 50-25 % la tete des racines (a cote de toi :
   degats et enracine 1,5 s), 25-0 % la tete qui hurle (la terre tremble, 2 Tronknydes sortent du sol) */
const TETES_NOMS = ['la tête de sève', 'la tête des feuilles', 'la tête des racines', 'la tête qui hurle'];
let TETES_ANC = null;
/* LE COU DES TETES DE L'ANCESTRAL (09/11/2026, « il faudrait que l'on voie aussi la branche qui sort du sol et que la tete soit un peu plus haute, la on
   dirait une tete qui flotte ; elles sont rattachees au corps qui est sous terre », Mathieu) : une branche brune en S, comme sur le dessin de l'Ancestral,
   sort d'une butte de terre et porte la tete par l'arriere. Le tube est recalcule a chaque image : il pousse avec la tete, ondule et la suit quand elle mord.
   f : la taille (1 pour les tetes de l'Osa) */
const NS_COU = 22, NR_COU = 10; let TEX_COU = null, GEO_BUTTE_COU = null;
function texCou() {
  if (TEX_COU) return TEX_COU;
  TEX_COU = texCanvas(128, (x, n) => { x.fillStyle = '#9a6c48'; x.fillRect(0, 0, n, n); /* (l'ecorce : des sillons le long de la branche) */
    for (let k = 0; k < 16; k++) { const u = (k + Math.random() * 0.6) / 16 * n; x.strokeStyle = k % 3 ? 'rgba(58,34,18,0.6)' : 'rgba(196,150,104,0.55)'; x.lineWidth = 1.5 + Math.random() * 3;
      x.beginPath(); x.moveTo(u, 0); for (let v = 8; v <= n; v += 8) x.lineTo(u + Math.sin(v * 0.07 + k * 1.3) * 3, v); x.stroke(); } });
  TEX_COU.wrapS = TEX_COU.wrapT = T.RepeatWrapping; return TEX_COU;
}
function couAncestral(f) {
  const n = (NS_COU + 1) * (NR_COU + 1), g = new T.BufferGeometry(), uv = new Float32Array(n * 2), idx = [];
  for (let i = 0; i <= NS_COU; i++) for (let j = 0; j <= NR_COU; j++) { const k = i * (NR_COU + 1) + j; uv[k * 2] = j / NR_COU; uv[k * 2 + 1] = i / NS_COU * 2.5; }
  for (let i = 0; i < NS_COU; i++) for (let j = 0; j < NR_COU; j++) { const a = i * (NR_COU + 1) + j, b = a + NR_COU + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  g.setIndex(idx); g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('normal', new T.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('uv', new T.BufferAttribute(uv, 2));
  const m = new T.Mesh(g, new T.MeshToonMaterial({ map: texCou(), gradientMap: grad, side: T.DoubleSide })); m.frustumCulled = false; m.castShadow = true; sansClic(m);
  const b = new T.Mesh(GEO_BUTTE_COU || (GEO_BUTTE_COU = partagerGabarit(new T.SphereGeometry(1, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2))), new T.MeshToonMaterial({ color: '#4e3826', gradientMap: grad })); b.receiveShadow = true; sansClic(b);
  scene.add(m); scene.add(b);
  const P = g.attributes.position.array, N = g.attributes.normal.array, pts = [0, 1, 2, 3].map(() => new T.Vector3()), v = new T.Vector3(), tg = new T.Vector3(), nv = new T.Vector3(), bv = new T.Vector3(), S = new T.Vector3(), F = new T.Vector3(), UP = new T.Vector3(0, 1, 0);
  const bez = (s) => { const a = 1 - s; v.set(0, 0, 0).addScaledVector(pts[0], a * a * a).addScaledVector(pts[1], 3 * a * a * s).addScaledVector(pts[2], 3 * a * s * s).addScaledVector(pts[3], s * s * s);
    tg.set(0, 0, 0).addScaledVector(pts[0], -3 * a * a).addScaledVector(pts[1], 3 * a * a - 6 * a * s).addScaledVector(pts[2], 6 * a * s - 3 * s * s).addScaledVector(pts[3], 3 * s * s).normalize(); };
  return { m, b,
    poser(x, y0, z, tete, ang, e) { /* x, z : le trou ; y0 : le sol ; tete : le centre de la tete ; ang : ou elle regarde ; e : sortie de terre, de 0 a 1 */
      F.set(Math.sin(ang), 0, Math.cos(ang)); S.set(Math.cos(ang), 0, -Math.sin(ang));
      pts[3].copy(tete).addScaledVector(F, -0.22 * f).addScaledVector(UP, -0.3 * f); /* (elle tient la tete par l'arriere, sous la nuque) */
      pts[0].set(x, Math.min(y0 - 0.5 * f, pts[3].y - f), z); const L = pts[3].y - pts[0].y;
      pts[1].copy(pts[0]).addScaledVector(UP, L * 0.45).addScaledVector(F, 0.35 * f); pts[2].copy(pts[3]).addScaledVector(F, -0.6 * f).addScaledVector(UP, -L * 0.3); /* (le S du dessin) */
      for (let i = 0; i <= NS_COU; i++) { const s = i / NS_COU; bez(s); nv.crossVectors(tg, S).normalize(); bv.crossVectors(tg, nv); const r = f * (0.25 - 0.1 * s + 0.12 * Math.max(0, 1 - s * 5));
        for (let j = 0; j <= NR_COU; j++) { const th = j / NR_COU * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th), k = (i * (NR_COU + 1) + j) * 3, nx = nv.x * c + bv.x * sn, ny = nv.y * c + bv.y * sn, nz = nv.z * c + bv.z * sn;
          P[k] = v.x + nx * r; P[k + 1] = v.y + ny * r; P[k + 2] = v.z + nz * r; N[k] = nx; N[k + 1] = ny; N[k + 2] = nz; } }
      g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
      const eb = Math.max(0.05, Math.min(1, e * 1.6)); b.position.set(x, y0 - 0.02, z); b.scale.set(0.55 * f * eb, 0.2 * f * eb, 0.55 * f * eb); },
    jeter() { scene.remove(m); scene.remove(b); g.dispose(); m.material.dispose(); b.material.dispose(); } };
}
function tetesAncestral() {
  if (TETES_ANC) return TETES_ANC; const M = MODELES.ancestral; if (!M || typeof YEUX_P10 === 'undefined') return null; M.updateMatrixWorld(true);
  let sk = null; M.traverse((o) => { if (!sk && o.isSkinnedMesh && o.name !== 'contour') sk = o; }); if (!sk) return null;
  const rel = sk.bindMatrix.clone(), G = sk.geometry, /* (le repere du modele au chargement, celui des yeux : la peau est agrandie ensuite) */ P = G.attributes.position, N = G.attributes.normal, UV = G.attributes.uv, I = G.index, Y = YEUX_P10.ancestral;
  const pos = []; for (let k = 0; k < P.count; k++) pos.push(new T.Vector3().fromBufferAttribute(P, k).applyMatrix4(rel));
  TETES_ANC = [0, 2, 4, 6].map((e) => { const C = new T.Vector3((Y[e][0] + Y[e + 1][0]) / 2, (Y[e][1] + Y[e + 1][1]) / 2 - 0.02, (Y[e][2] + Y[e + 1][2]) / 2 - 0.13), R = 0.36, L = [];
    const n = I ? I.count : P.count; for (let k = 0; k < n; k += 3) { const a = I ? I.getX(k) : k, b = I ? I.getX(k + 1) : k + 1, c = I ? I.getX(k + 2) : k + 2; if (pos[a].distanceTo(C) < R && pos[b].distanceTo(C) < R && pos[c].distanceTo(C) < R) L.push(a, b, c); }
    const g = new T.BufferGeometry(), pa = [], na = [], ua = [], v = new T.Vector3();
    L.forEach((k) => { const q = pos[k]; pa.push(q.x - C.x, q.y - C.y, q.z - C.z); if (N) { v.fromBufferAttribute(N, k).transformDirection(rel); na.push(v.x, v.y, v.z); } if (UV) ua.push(UV.getX(k), UV.getY(k)); });
    g.setAttribute('position', new T.Float32BufferAttribute(pa, 3)); if (N) g.setAttribute('normal', new T.Float32BufferAttribute(na, 3)); else g.computeVertexNormals(); if (UV) g.setAttribute('uv', new T.Float32BufferAttribute(ua, 2));
    return { geo: g, tri: L.length / 3 }; });
  return TETES_ANC;
}
function teteSurgit(mo, i, c0, angle, retard) {
  const T0 = tetesAncestral(); if (!T0 || !T0[i] || !T0[i].tri) return;
  const pp = paysanMesh.position; let p = null;
  for (let k = 0; k < 12 && !p; k++) { const a = angle != null ? angle + (Math.random() - 0.5) * (k < 6 ? 0.5 : 3) : Math.random() * Math.PI * 2, L = i === 2 ? 1.4 : 3 + Math.random() * 1.5, q = pointValide(pp.x, pp.z, pp.x + Math.sin(a) * L, pp.z + Math.cos(a) * L); if (solSort(q.x, q.z)) p = q; } /* (solSort : l'Arene aussi, 09/11/2026) */
  if (!p) return; const y0 = solA(p.x, p.z); let src = null; mo.m.traverse((o) => { if (!src && o.isSkinnedMesh && o.name !== 'contour') src = o.material; });
  const mat = new T.MeshToonMaterial({ map: src && src.map, emissiveMap: src && src.emissiveMap, emissive: new T.Color(mo.d.lueur || '#ffffff'), emissiveIntensity: 2, gradientMap: grad, side: T.DoubleSide, color: mo.d.teinte || '#ffffff' }); /* (violettes pour l'Ancestral Maudit) */
  const h = new T.Mesh(T0[i].geo, mat), k = (mo.m.scale.x || 1) * 1.8, taille = 0.75 * k; h.scale.setScalar(k); h.castShadow = true; scene.add(h);
  const info = { m: h, r: taille * 0.55 }; h.visible = false; const f = k / 1.7, cou = couAncestral(f); cou.m.visible = cou.b.visible = false; /* (09/11/2026 : sa branche, voir couAncestral) */
  const MONTE = 0.45, ACTE = 1.6, DESCEND = 0.45; let t = -(retard || 0), sortie = false;
  effets.push((dt) => { t += dt;
    if (combat !== c0 || c0.fin || t >= MONTE + ACTE + DESCEND) { scene.remove(h); mat.dispose(); cou.jeter(); c0.tetesAnc = (c0.tetesAnc || []).filter((x) => x !== info); return true; }
    if (t < 0) return false; /* (elle attend son tour : les tetes sortent l'une apres l'autre) */
    if (!sortie) { sortie = true; h.visible = cou.m.visible = cou.b.visible = true; (c0.tetesAnc = c0.tetesAnc || []).push(info); mottes(p.x, y0, p.z, 8, 1.2); poussiere(p.x, y0, p.z, 8, 1.4, '#8a6a44');
      if (!c0['teteVu' + i]) { c0['teteVu' + i] = true; toast('Sous terre, ' + leNom(mo.d, true) + ' fait surgir ' + TETES_NOMS[i] + ' : ' + TETES_AIDE[i] + ' !', 'alerte'); } }
    const u = t < MONTE ? t / MONTE : t < MONTE + ACTE ? 1 : 1 - (t - MONTE - ACTE) / DESCEND; const e = u * (2 - u); h.position.set(p.x, y0 - 0.9 * f + 2.65 * f * e, p.z); /* (au bout de sa branche, 1,75 fois f au-dessus du sol : avant, elle sortait a peine et semblait flotter) */
    h.rotation.y = Math.atan2(paysanMesh.position.x - p.x, paysanMesh.position.z - p.z) + Math.sin(t * 9) * 0.06; /* (elle te regarde, et frissonne) */
    cou.poser(p.x, y0, p.z, h.position, h.rotation.y, e);
    if (!info.fait && t >= MONTE) { info.fait = true; actionTete(mo, i, p, c0); }
    return false; });
}
/* CE QUE FONT SES TETES, refait le 10/11/2026 (« on esquive trop facilement ce que font les tetes, on comprend pas trop, y'a des cercles de differentes tailles mais sans
   plus », Mathieu) : avant, quatre cercles rouges d'une seconde. Chaque tete a maintenant sa forme, sa couleur et son nom affiche au-dessus d'elle quand elle agit :
   - la tete de seve crache un JET DE SEVE en ligne, d'elle jusqu'au-dela de toi (une bande jaune-vert, 0,7 s) ; touche, tu es ralenti, et la seve reste au sol 4 s
     (dedans, tu restes ralenti) ;
   - la tete des feuilles lance deux EVENTAILS de feuilles tranchantes, l'un apres l'autre (0,7 s chacun), le second vise a nouveau : il faut passer sur le cote deux fois ;
   - la tete des racines fait jaillir ses RACINES EN CROIX sous tes pieds (deux bandes qui se croisent, 0,75 s) : on en sort en diagonale ; touche, enracine 1,5 s ;
   - la tete qui hurle pousse un CRI : un grand cercle violet autour d'elle (0,8 s), qui repousse, etourdit 0,4 s, et fait sortir 2 Tronknydes.
   Celles de l'Ancestral Maudit maudissent en plus. */
const TETES_ACTE = ['Jet de sève', 'Feuilles tranchantes', 'Racines en croix', 'Cri'];
const TETES_AIDE = ['elle crache un jet de sève en ligne : sors de la bande, la sève reste au sol et te ralentit', 'elle lance deux éventails de feuilles tranchantes, l\'un après l\'autre : passe sur le côté, deux fois', 'ses racines jaillissent en croix sous tes pieds : sors en diagonale, sinon tu es enraciné', 'son cri te repousse et t\'étourdit dans le grand cercle violet, et des Tronknydes sortent du sol'];
function actionTete(mo, i, p, c0) {
  const pp = paysanMesh.position, ds = degSort(mo), M = mo.d.enfouit && mo.d.enfouit.maudit, maud = () => { if (M) maudirPerso(M.duree, M.x); }, yT = solA(p.x, p.z), vif = () => combat === c0 && !c0.fin; /* (les tetes de l'Ancestral Maudit maudissent) */
  chiffre(TETES_ACTE[i] + ' !', new T.Vector3(p.x, yT + 3.6, p.z), 'butin');
  const a = Math.atan2(pp.x - p.x, pp.z - p.z);
  if (i === 0) { /* le jet de seve : une bande de la tete jusqu'au-dela du perso, puis la seve reste au sol */
    const L = Math.max(6, Math.hypot(pp.x - p.x, pp.z - p.z) + 3.5), f = pointValide(p.x, p.z, p.x + Math.sin(a) * L, p.z + Math.cos(a) * L), Lr = Math.hypot(f.x - p.x, f.z - p.z) || 1, ux = (f.x - p.x) / Lr, uz = (f.z - p.z) / Lr, larg = 1.9;
    zoneDanger({ mo, x: p.x, z: p.z, x2: f.x, z2: f.z, larg, duree: 0.7, couleur: '#b7dc3a', fort: 1.5, bord: true, effet: (d) => { if (!vif()) return;
      for (let k = 0; k <= 10; k++) { const u = k / 10 * Lr, x = p.x + ux * u, z = p.z + uz * u; emettre(FX_VIF, 4, { x, y: solA(x, z) + 0.4, z, r: 0.5, v: [ux * 6, 1.5, uz * 6], dv: 2, vie: [0.3, 0.6], taille: [0.22, 0.05], c: ['#eaffb0', '#b7dc3a', '#6f9a2a'], grav: 7 }); }
      const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) { blesserPerso(Math.max(1, Math.round(ds * 0.6)), mo); maud(); if (vif()) { c0.lenteur = Math.max(c0.lenteur || 0, 2.5); const q = p2.clone(); q.y += 2; chiffre('Sève collante !', q, 'perso'); } }
      /* la seve au sol, 4 s : une bande verte qui s'efface ; dedans, on reste ralenti */
      const flaque = new T.Mesh(new T.PlaneGeometry(larg, Lr), new T.MeshBasicMaterial({ color: '#8fbf2e', transparent: true, opacity: 0.4, depthWrite: false })); flaque.geometry.translate(0, -Lr / 2, 0); flaque.rotation.x = -Math.PI / 2; const piv = new T.Group(); piv.add(flaque); piv.rotation.y = Math.atan2(f.x - p.x, f.z - p.z); piv.position.set(p.x, Math.max(yT, solA(f.x, f.z)) + 0.05, p.z); sansClic(piv); flaque.renderOrder = 2; scene.add(piv);
      let t = 0; effets.push((dt) => { t += dt; if (!vif() || t >= 4) { scene.remove(piv); flaque.geometry.dispose(); flaque.material.dispose(); return true; } flaque.material.opacity = 0.4 * Math.min(1, (4 - t) / 0.8);
        const q = paysanMesh.position, w = (q.x - p.x) * ux + (q.z - p.z) * uz, e = Math.abs((q.x - p.x) * uz - (q.z - p.z) * ux); if (w > 0 && w < Lr && e < larg / 2) c0.lenteur = Math.max(c0.lenteur || 0, 0.4);
        if (Math.random() < dt * 8) { const u = Math.random() * Lr; emettre(FX_VIF, 1, { x: p.x + ux * u, y: yT + 0.15, z: p.z + uz * u, r: 0.5, v: [0, 0.8, 0], dv: 0.2, vie: [0.5, 0.9], taille: [0.14, 0.03], c: ['#eaffb0', '#8fbf2e'] }); } return false; }); } }); }
  else if (i === 1) { /* les feuilles tranchantes : deux eventails, le second vise a nouveau */
    const salve = (ang) => zoneDanger({ mo, x: p.x, z: p.z, r: 7, a: ang, ouv: 0.55, duree: 0.7, couleur: '#3fae4a', fort: 1.3, effet: (d) => { if (!vif()) return;
      for (let k = 0; k < 14; k++) { const b = ang + (Math.random() - 0.5) * 1.1, u = 1 + Math.random() * 2; emettre(FX_VIF, 1, { x: p.x + Math.sin(b) * u, y: yT + 0.8 + Math.random() * 0.8, z: p.z + Math.cos(b) * u, r: 0.1, v: [Math.sin(b) * 13, 0.3, Math.cos(b) * 13], dv: 0.6, vie: [0.3, 0.45], taille: [0.3, 0.06], c: ['#d8ff9a', '#3fae4a', '#2a6a2a'], etire: 0.05 }); }
      feuillesVolantes(p.x + Math.sin(ang) * 3.5, yT + 0.4, p.z + Math.cos(ang) * 3.5, 3, 8);
      const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) { blesserPerso(Math.max(1, Math.round(ds * 0.7)), mo); maud(); } } });
    salve(a); let t = 0; effets.push((dt) => { t += dt; if (!vif()) return true; if (t < 0.6) return false; const q = paysanMesh.position; salve(Math.atan2(q.x - p.x, q.z - p.z)); return true; }); }
  else if (i === 2) { /* les racines en croix, sous le perso : deux bandes qui se croisent */
    const x0 = pp.x, z0 = pp.z, D = 5; let touche = false;
    [a + Math.PI / 4, a - Math.PI / 4].forEach((b, k) => { const sx = Math.sin(b), sz = Math.cos(b), A = pointValide(x0, z0, x0 - sx * D, z0 - sz * D), B = pointValide(x0, z0, x0 + sx * D, z0 + sz * D);
      zoneDanger({ mo, x: A.x, z: A.z, x2: B.x, z2: B.z, larg: 1.5, duree: 0.75, couleur: '#c9772e', fort: 1.4, bord: true, effet: (d) => { if (!vif()) return; const Lb = Math.hypot(B.x - A.x, B.z - A.z), n = Math.max(3, Math.round(Lb / 1.2));
        for (let j = 0; j <= n; j++) { const x = A.x + (B.x - A.x) * j / n, z = A.z + (B.z - A.z) * j / n, y = solA(x, z); racineJaillit(x, y, z, j + k * 3); if (j % 2 === 0) mottes(x, y, z, 3, 0.8); }
        if (!k) secousse(0.15, 0.3);
        const p2 = paysanMesh.position; if (!touche && dansDanger(d, p2.x, p2.z)) { touche = true; racinesQuiSaisissent(p2.x, solA(p2.x, p2.z), p2.z, true, 1.5); blesserPerso(Math.max(1, Math.round(ds * 0.7)), mo); maud(); if (vif()) coller(1.5, 'Enraciné !'); } } }); }); }
  else { /* le cri : un grand cercle violet autour d'elle, il repousse et etourdit ; 2 Tronknydes sortent du sol */
    const Rc = 5.5; let tc = 0; effets.push((dt) => { tc += dt; if (!vif() || tc >= 0.8) return true; if (Math.random() < dt * 9) onde(p.x, yT, p.z, 1.5 + tc * 4, '#d9b8ff', 0.35, 0.4); return false; }); /* (elle prend son souffle) */
    zoneDanger({ mo, x: p.x, z: p.z, r: Rc, duree: 0.8, couleur: '#a46cff', fort: 1.2, effet: (d) => { if (!vif()) return; secousse(0.3, 0.5); onde(p.x, yT, p.z, Rc * 1.1, '#e6d2ff', 0.7, 0.8); onde(p.x, yT, p.z, Rc * 0.6, '#a46cff', 0.6, 0.6, true);
      const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) { blesserPerso(Math.max(1, Math.round(ds * 0.6)), mo); maud(); if (vif()) { repousserPerso({ x: p.x, z: p.z }, 3.2); etourdir(0.4); } }
      for (let k = 0; k < 2; k++) { const b = Math.random() * Math.PI * 2, q = pointValide(p.x, p.z, p.x + Math.sin(b) * 2, p.z + Math.cos(b) * 2); apparaitre('tronknyde', { x: q.x, z: q.z, apres: (o) => { o.invoqueur = mo.id; o.invoque = true; } }); c0.total++; } } }); }
}
/* LE MALEFICE (06/11/2026, la Wabbit Sorciere : « un sort qui te ralentit dans un cercle ») : quand tu es entre min et max d'elle, un cercle violet
   sous toi ; a la fin, le sort eclate : dedans, un peu de degats et ralenti (c.lenteur, comme la Momie Koalak) */
function capMalefice(mo, ctx) {
  const { pp, sortPret } = ctx, M = mo.d.malefice; if (!M || combat.deroute != null) return;
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (!sortPret('maleficeT', M.periode) || mo.geste) return; if (dP < M.min || dP > M.max) { mo.maleficeT = M.periode; return; }
  mo.maleficeT = 0; const c0 = combat, x0 = pp.x, z0 = pp.z, C = mo.d.couleurMagie || '#b06ae0'; mo.ry = Math.atan2(x0 - mo.x, z0 - mo.z); mo.bloqueT = 0.6; mo.frappe = 0.3;
  if (M.brule) { if (!c0.bouleFeuVu) { c0.bouleFeuVu = true; toast(leNom(mo.d) + ' te lance une ' + (M.nom || 'boule de feu').toLowerCase() + ' : sors du cercle orange, sinon tu brûles !', 'alerte'); } } /* (le Dragoeuf Ardoise, 06/11/2026) */
  else if (!c0.maleficeVu) { c0.maleficeVu = true; toast(leNom(mo.d) + ' te jette un maléfice : sors du cercle violet, sinon tu es ralenti !', 'alerte'); }
  zoneDanger({ mo, x: x0, z: z0, r: M.R, duree: M.prepa, couleur: C, effet: (d) => { const y = solA(x0, z0); etoileImpact(new T.Vector3(x0, y + 0.6, z0), 1.0, C); onde(x0, y + 0.05, z0, M.R * 1.2, C, 0.4, 0.6);
    emettre(FX_LUM, 14, { x: x0, y: y + 0.3, z: z0, r: M.R * 0.6, v: [0, 1.8, 0], dv: 1, vie: [0.5, 0.8], taille: [0.25, 0.05], c: ['#ffffff', C], a: 0.85 });
    const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z) && combat === c0 && !c0.fin) { blesserPerso(Math.max(1, Math.round(degSort(mo) * M.x)), mo); const q = p2.clone(); q.y += 2.1;
      if (M.brule) { (c0.poisons = c0.poisons || []).push({ pct: M.brule[0], t: M.brule[1] }); chiffre('Tu brûles !', q, 'vol'); } else { c0.lenteur = Math.max(c0.lenteur || 0, M.duree); chiffre('Ralenti !', q, 'vol'); } } } });
}
/* LE SEMIS (05/11/2026, le Semeur : « seme des graines qui deviennent des Tronknydes si on ne les ecrase pas », le monstre propose a Mathieu et
   retenu) : il plonge la main droite dans sa coupe de glands et jette une poignee a la volee (son geste « sort ») ; les graines volent en cloche et
   tombent autour de toi, chacune dans un petit cercle de terre retournee ; un disque vert s'y remplit (le temps qui reste, le bord clignote a la fin)
   et une pousse grandit. Marche dessus pour l'ecraser ; sinon, le disque plein, un Tronknyde sort de terre et file sur toi. Pas plus de max
   Tronknydes a lui, graines comprises */
function capSemis(mo, ctx) {
  const { pp, sortPret } = ctx, G = mo.d.pluieGlands; if (!G || combat.deroute != null) return;
  if (!sortPret('semisT', G.periode) || mo.geste) return;
  const debout = combat.monstres.filter((o) => o.invoqueur === mo.id && o.etat !== 'mort').length + (mo.graines || 0);
  if (debout >= G.max) { mo.semisT = G.periode - 2; return; }
  mo.semisT = 0; const c0 = combat, n = Math.min(G.n, G.max - debout); mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z); mo.bloqueT = G.lance + 0.5; mo.cd = Math.max(mo.cd || 0, G.lance + 0.6);
  gesteSort(mo, gesteDe(mo, 'pluie', 'sort'), G.lance);
  if (!c0.semisVu) { c0.semisVu = true; toast(leNom(mo.d) + ' jette une pluie de glands : marche dessus et ils explosent, laisse-les et des Tronknydes en sortent au bout de ' + G.pousse + ' s !', 'alerte'); }
  else chiffre('Pluie de glands !', new T.Vector3(mo.x, mo.m.position.y + (mo.haut || 3) + 0.4, mo.z), 'butin');
  const places = []; for (let k = 0; k < n; k++) { const a = (k + Math.random() * 0.7) / n * Math.PI * 2, r = G.loin[0] + Math.sqrt(Math.random()) * (G.loin[1] - G.loin[0]); places.push(pointValide(pp.x, pp.z, pp.x + Math.sin(a) * r, pp.z + Math.cos(a) * r)); }
  mo.graines = (mo.graines || 0) + n; let t = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin) { mo.graines = 0; return true; } if (t < G.lance) return false;
    const de = mainSquelette(mo) || new T.Vector3(mo.x, mo.m.position.y + 2.2, mo.z); places.forEach((p, k) => graineSemee(mo, de, p, G, c0, k * 0.07)); return true; });
}
function graineSemee(mo, de, p, G, c0, retard) { /* la graine qui vole en cloche, de sa main jusqu'a sa place */
  const vers = new T.Vector3(p.x, solA(p.x, p.z) + 0.08, p.z), g = glandVolant(0.75), dist = de.distanceTo(vers), duree = Math.min(1.4, Math.max(0.9, dist / 5)), H = 4.5 + dist * 0.3; /* (jetes vers le ciel : ils montent haut et retombent) */ let t = -retard, mis = false;
  const fini = () => { jeter(g); mo.graines = Math.max(0, (mo.graines || 0) - 1); return true; };
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin) return fini(); if (t < 0) return false; if (!mis) { mis = true; scene.add(g); }
    const k = Math.min(1, t / duree); g.position.lerpVectors(de, vers, k); g.position.y += Math.sin(k * Math.PI) * H; g.rotation.x += dt * 9;
    if (fxAlea() < 0.6) emettre(FX_LUM, 1, { x: g.position.x, y: g.position.y, z: g.position.z, vie: [0.2, 0.3], taille: [0.4, 0.08], c: ['#fff1a8', '#ff9a2e'], a: 0.7 });
    if (k >= 1) { jeter(g); planterGraine(mo, p, G, c0); return true; } });
}
function planterGraine(mo, p, G, c0) { /* la graine plantee : la terre retournee, le disque vert qui se remplit, la pousse qui grandit */
  const y = solA(p.x, p.z), grp = new T.Group(); grp.position.set(p.x, y + 0.04, p.z); grp.userData.graine = true; scene.add(grp);
  const plat = (geo, couleur, op, dy) => { const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: couleur, transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.y = dy; m.renderOrder = 2; grp.add(m); return m; };
  plat(new T.CircleGeometry(0.4, 20), '#5b3d22', 0.85, 0); const fond = plat(new T.CircleGeometry(G.ecrase, 32), '#7fdc4a', 0.16, 0.01), plein = plat(new T.CircleGeometry(G.ecrase, 32), '#9be35a', 0.32, 0.015), bord = plat(new T.RingGeometry(G.ecrase - 0.09, G.ecrase, 40), '#b8f06a', 0.9, 0.02);
  const gl = glandVolant(0.6); gl.position.y = 0.04; gl.rotation.z = 0.6; grp.add(gl);
  const pousse = new T.Group(), tige = new T.Mesh(new T.CylinderGeometry(0.02, 0.035, 0.45, 6), mat('#6a8a2a')); tige.position.y = 0.22; pousse.add(tige);
  [-1, 1].forEach((s2) => { const f = new T.Mesh(new T.SphereGeometry(0.1, 8, 6), mat('#7cc63e')); f.scale.set(1.5, 0.3, 0.75); f.position.set(s2 * 0.11, 0.36 + (s2 > 0 ? 0.06 : 0), 0); f.rotation.z = s2 * 0.5; pousse.add(f); });
  pousse.scale.setScalar(0.05); grp.add(pousse); mottes(p.x, y, p.z, 4, 0.4); poussiere(p.x, y, p.z, 4, 0.4, '#8a6a44');
  let t = 0; /* (la graine compte deja dans mo.graines depuis le semis) */
  const fin = () => { jeter(grp); mo.graines = Math.max(0, (mo.graines || 0) - 1); return true; };
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin) return fin(); const k = Math.min(1, t / G.pousse);
    plein.scale.setScalar(Math.max(0.01, k)); fond.material.opacity = 0.12 + 0.08 * Math.abs(Math.sin(t * 6)); bord.material.color.set(k > 0.75 && Math.sin(t * 18) > 0 ? '#ff6a3a' : '#b8f06a');
    pousse.scale.setScalar(0.2 + 0.8 * k); pousse.rotation.z = 0.12 * Math.sin(t * 3);
    const q = paysanMesh.position;
    if (Math.hypot(q.x - p.x, q.z - p.z) < G.ecrase) { /* (marche dessus : le gland explose, ca fait mal, mais pas de Tronknyde) */
      fin(); boule(p.x, y + 0.4, p.z, 0.7, ['#ffb53c', '#e8541e']); onde(p.x, y + 0.05, p.z, 1.4, '#ffb53c', 0.4, 0.5); mottes(p.x, y, p.z, 6, 0.7); secousse(0.08, 0.18);
      emettre(FX_VIF, 14, { x: p.x, y: y + 0.3, z: p.z, r: 0.1, dv: 4, haut: true, vie: [0.3, 0.55], taille: [0.12, 0.03], c: ['#fff1a8', '#ff9a2e', '#c8641e'], grav: 8, frein: 1.5 });
      if (combat === c0 && !c0.fin) blesserPerso(Math.max(1, Math.round(degSort(mo) * (G.x || 0.5))), mo); return true; }
    if (t >= G.pousse) { fin(); pouf(p.x, y, p.z, 1.8, '#7a5a34'); mottes(p.x, y, p.z, 8, 0.8); apparaitre(G.type, { x: p.x, z: p.z, apres: (o) => { o.invoqueur = mo.id; o.invoque = true; } }); combat.total++; return true; } });
}
/* LES RACINES DE L'ABRAKNYDE (05/11/2026, « des racines qui viennent te saisir et t'entourer, au style de l'Abraknyde, pendant 1,25 s », puis « plus
   naturelles ? meme texture que l'Abraknyde ? », Mathieu) : n racines sortent du sol autour de (x, z) ; pris : elles montent en serrant jusqu'a sa taille
   (rayon 0,8 -> 0,3, environ un tour), en se tordant au hasard ; rate : elles jaillissent plus droites dans le cercle vide. La texture est celle de
   l'Abraknyde (sa peau : un morceau d'ecorce moussue de son atlas, le grain dans le sens de la racine), l'epaisseur varie (des noeuds), le bout se
   recourbe ; une radicelle sur une racine sur deux, une feuille au bout. Elles poussent (0,25 s), tiennent (duree), se retirent (0,3 s) */
const ECORCE_UV = [0.622, 0.677, 0.521, 0.729]; /* (u0, u1, v0, v1 : un morceau d'ecorce brun chaud, veinee et moussue, de l'atlas de l'Abraknyde ; la premiere zone, plus sombre, ne lui ressemblait pas) */
function texAbraknyde() { if (texAbraknyde.t !== undefined) return texAbraknyde.t; let t = null; const M = MODELES.abraknyde; if (M) M.traverse((o) => { if (!t && o.isSkinnedMesh && o.material && o.material.map) t = o.material.map; }); return (texAbraknyde.t = t || null); }
function tubeRacine(pts, rayon, T_SEG, R_SEG, noeuds) {
  const courbe = new T.CatmullRomCurve3(pts), geo = new T.TubeGeometry(courbe, T_SEG, rayon, R_SEG, false), pos = geo.attributes.position, uv = geo.attributes.uv, [u0, u1, v0, v1] = ECORCE_UV;
  for (let s = 0; s <= T_SEG; s++) { const w = s / T_SEG, ctr = courbe.getPointAt(w), ef = (1 - 0.82 * w) * (1 + 0.16 * Math.sin(w * noeuds * Math.PI * 2) ** 2); /* (effilee, avec des noeuds) */
    for (let j = 0; j <= R_SEG; j++) { const k = s * (R_SEG + 1) + j; pos.setXYZ(k, ctr.x + (pos.getX(k) - ctr.x) * ef, ctr.y + (pos.getY(k) - ctr.y) * ef, ctr.z + (pos.getZ(k) - ctr.z) * ef);
      uv.setXY(k, u0 + (u1 - u0) * (j / R_SEG), v0 + (v1 - v0) * w); } }
  pos.needsUpdate = true; uv.needsUpdate = true; geo.computeVertexNormals(); return { geo, courbe };
}
function racinesQuiSaisissent(x, y, z, pris, duree, echelle) { /* (echelle : autour d'un monstre, a sa taille ; l'Etreinte du Chene du Iop, 09/11/2026) */
  const c0 = combat, g = new T.Group(), n = pris ? 4 : 5, T_SEG = 40, R_SEG = 8, L = [], own = [], tex = texAbraknyde(), A = () => Math.random() - 0.5;
  const mt = tex ? new T.MeshToonMaterial({ map: tex, gradientMap: grad }) : mat('#6b4528'), mf = mat('#86b84a'); own.push(mt, mf);
  const ajouter = (pts, rayon, T2, noeuds, feuille) => { const { geo, courbe } = tubeRacine(pts, rayon, T2, R_SEG, noeuds), m = new T.Mesh(geo, mt), k2 = new T.Mesh(geo, contourMat(0.016)); m.castShadow = true; g.add(m, k2);
    let f = null; if (feuille) { const bout = courbe.getPointAt(1), dir = courbe.getTangentAt(1); f = new T.Mesh(new T.SphereGeometry(0.075, 8, 6), mf); f.scale.set(1, 0.3, 2); f.position.copy(bout).addScaledVector(dir, 0.06); f.lookAt(bout.clone().add(dir)); f.visible = false; g.add(f); }
    const o = { geo, f, pas: R_SEG * 6, T: T2 }; L.push(o); return { o, courbe }; };
  for (let i = 0; i < n; i++) {
    const sens = i % 2 ? 1 : -1, a0 = i / n * Math.PI * 2 + A() * 0.6, tours = pris ? 0.85 + Math.random() * 0.35 : 0.2 + Math.random() * 0.25;
    const h = pris ? 1.05 + Math.random() * 0.45 : 0.75 + Math.random() * 0.6, r0 = pris ? 0.8 + A() * 0.2 : 0.45 + Math.random() * 0.7, r1 = pris ? 0.28 + Math.random() * 0.06 : r0 * 0.55;
    const pts = []; for (let k = 0; k <= 14; k++) { const u = k / 14, a = a0 + u * tours * Math.PI * 2 * sens + A() * 0.25, r = (r0 + (r1 - r0) * Math.min(1, u * 1.5)) * (1 + A() * 0.18);
      pts.push(new T.Vector3(Math.cos(a) * r + A() * 0.05, -0.18 + u * h + A() * 0.06, Math.sin(a) * r + A() * 0.05)); }
    { const p = pts[pts.length - 1], q = pts[pts.length - 2], d = p.clone().sub(q); pts.push(p.clone().add(new T.Vector3(-d.z, 0.04, d.x).multiplyScalar(0.9))); } /* (le bout se recourbe) */
    const { courbe } = ajouter(pts, 0.1 + Math.random() * 0.03, T_SEG, 2 + Math.floor(Math.random() * 2), true);
    if (i % 2 === 0) { const w = 0.35 + Math.random() * 0.2, b = courbe.getPointAt(w), tg = courbe.getTangentAt(w), dh = new T.Vector3(b.x, 0, b.z).normalize(); /* (une radicelle qui part vers l'exterieur) */
      ajouter([b.clone(), b.clone().addScaledVector(dh, 0.18).add(new T.Vector3(0, 0.12, 0)).addScaledVector(tg, 0.05), b.clone().addScaledVector(dh, 0.32).add(new T.Vector3(A() * 0.1, 0.3, A() * 0.1))], 0.045, 16, 1, true); } }
  g.position.set(x, y, z); g.rotation.y = Math.random() * Math.PI * 2; if (echelle) g.scale.setScalar(echelle); scene.add(g); let s = 0;
  const fin = () => { g.parent && g.parent.remove(g); L.forEach((o) => { o.geo.dispose(); if (o.f) o.f.geometry.dispose(); }); own.forEach((o) => o.dispose()); return true; }; /* (la texture reste : c'est celle de l'Abraknyde) */
  effets.push((dt) => { s += dt; if (combat !== c0 || s >= duree + 0.3) return fin();
    const k = s < 0.25 ? s / 0.25 : s > duree ? Math.max(0, 1 - (s - duree) / 0.3) : 1, e = 1 - Math.pow(1 - k, 2);
    L.forEach((o) => { o.geo.setDrawRange(0, Math.max(1, Math.round(e * o.T)) * o.pas); if (o.f) o.f.visible = e > 0.97; });
    g.scale.set(1, 1 + 0.025 * Math.sin(s * 11), 1); }); /* (elles serrent, un leger frisson) */
  if (pris) { poussiere(x, y, z, 6, 0.6, '#8a6a44'); mottes(x, y, z, 6, 0.6); }
}
function capRoulade(mo, ctx) { /* les Tortues roulent pour esquiver (26/10/2026, « ce serait rigolo de les voir faire ça et esquiver de temps en temps », Mathieu) : touchée, une fois
     toutes les quelques secondes, elle part en roulade sur le côté, un peu vers toi ; pendant la culbute, tes coups la manquent */
  const { pp, dt, sortPret } = ctx;
  if (!mo.d.roulade || !mo.m.userData.anim || mo.invoque) return; /* (les tortues de la Tortue Corail ne roulent pas : « les roulages, ça marche pas du tout », Mathieu, 29/10/2026) */
  if (mo.esquiveVu > 0) mo.esquiveVu -= dt;
  const pret = sortPret('rouladeT', mo.d.roulade + (mo.id % 3)); if (!pret || !(mo.recent > 0) || mo.geste) return;
  const vers = Math.atan2(pp.x - mo.x, pp.z - mo.z), cote = Math.random() < 0.5 ? 1 : -1;
  if (rouladeSquelette(mo, vers + cote * (Math.PI / 2 - 0.45))) { mo.rouladeT = 0; if (!combat.rouladeVu) { combat.rouladeVu = true; toast(leNom(mo.d) + ' roule pour esquiver : pendant sa culbute, tes coups la manquent !', 'alerte'); } }
}
function capPierre(mo, ctx) { /* la peau de pierre de la Gorgouille (20/10/2026) : 4 s, elle prend moitie moins de degats. (01/11/2026, du Golem lunaire : « travaille ses
     sorts », Mathieu) A la place d'une bulle grise : des rochers tournent autour de lui comme un bouclier, son corps se grise ; a la fin, les rochers tombent */
  const { m, dt, sortPret } = ctx;
  if (!mo.d.pierre) return;
  if (mo.pierre > 0) mo.pierre -= dt;
  else if (sortPret('pierreT', mo.d.pierre)) { mo.pierreT = 0; mo.pierre = 4; pouf(mo.x, mo.m.position.y, mo.z, 3, '#9aa0a2'); if (mo.d.gestes && mo.d.gestes.pierre) gesteSort(mo, mo.d.gestes.pierre); if (!combat.pierreVu) { combat.pierreVu = true; toast(leNom(mo.d) + ' ' + (mo.d.pierreTexte || 'se change en pierre : elle prend moitié moins de dégâts, garde tes gros sorts pour après !'), 'alerte'); }
    const h = mo.haut || 3, c0 = combat, rocs = []; for (let k = 0; k < 8; k++) { const r = new T.Mesh(new T.DodecahedronGeometry(h * fxEntre(0.06, 0.1), 0), mat(k % 3 ? '#8d929c' : '#6f747e')); r.castShadow = true; r.raycast = () => {}; scene.add(r); rocs.push({ r, a: k / 8 * Math.PI * 2, y: h * fxEntre(0.3, 0.8), w: fxEntre(-2, 2) }); }
    let t = 0; effets.push((d2) => { t += d2; const fini = combat !== c0 || !(mo.pierre > 0) || mo.etat !== 'actif', R = (mo.d.ombre || 2) * 0.62;
      if (!fini) { rocs.forEach((o) => { o.a += d2 * 2.4; const k = Math.min(1, t / 0.35); o.r.position.set(mo.x + Math.cos(o.a) * R * k, mo.m.position.y + o.y * (0.4 + 0.6 * k), mo.z + Math.sin(o.a) * R * k); o.r.rotation.x += d2 * o.w; o.r.rotation.y += d2 * 2; }); return false; } /* (ils tournent autour de lui) */
      if (combat !== c0) { rocs.forEach((o) => jeter(o.r)); return true; }
      rocs.forEach((o) => { let vy = 0; effets.push((d3) => { vy -= 14 * d3; o.r.position.y += vy * d3; const sol = solA(o.r.position.x, o.r.position.z) + 0.1; if (o.r.position.y <= sol) { poussiere(o.r.position.x, sol, o.r.position.z, 2, 0.4, '#b8bec8'); jeter(o.r); return true; } }); }); return true; }); } /* (a la fin, ils tombent) */
  const an = m.userData.anim; if (an && an.peau) { const g = mo.pierre > 0 ? 0.68 : 1; an.peau.forEach((x) => { if (x.color) x.color.setRGB(g, g * 1.02, g * 1.08); }); } /* (son corps se grise, un monstre a squelette) */
  else { if (!mo.bulleP) { mo.bulleP = new T.Mesh(new T.IcosahedronGeometry(1, 1), new T.MeshBasicMaterial({ color: '#9aa0a2', transparent: true, opacity: 0.35, depthWrite: false })); m.add(mo.bulleP); }
    mo.bulleP.visible = mo.pierre > 0; if (mo.bulleP.visible) { mo.bulleP.scale.setScalar(mo.haut * 0.6); mo.bulleP.position.y = mo.haut * 0.45; mo.bulleP.rotation.y += dt * 0.5; } } /* (la Gorgouille garde sa bulle et prend aussi les rochers) */
}
function capInvoque(mo, ctx) { /* la Tortue Corail invoque ses tortues (29/10/2026, « un bâton de mage, invocateur de tortues, il en invoque 4 toutes les 8 s », Mathieu) :
     elle leve son baton, un cercle s'allume au sol a chaque place, les tortues en sortent ; 12 debout au plus, sinon elle reessaie 2 s plus tard */
  const { bloque, vSort } = ctx, I = mo.d.invoque; if (!I || mo.ancre) return;
  mo.invoqueT = (mo.invoqueT == null ? I.periode - 3 : mo.invoqueT) + vSort; /* (le compte tourne meme pendant ses coups de baton : avec sortPret, 1 invocation en 17 s au lieu de 2) */
  if (mo.invoqueT < I.periode || bloque || mo.bloqueT > 0 || mo.vise || combat.deroute != null) return;
  const debout = combat.monstres.filter((o) => o.invoqueur === mo.id && o.etat !== 'mort').length;
  if (debout >= I.max) { mo.invoqueT = I.periode - 2; return; }
  mo.invoqueT = 0; mo.bloqueT = 1.2; mo.frappe = 0.3; gesteSort(mo, gesteDe(mo, 'invoque', 'sort'), 0.9);
  if (!combat.invoqueVu) { combat.invoqueVu = true; toast(leNom(mo.d) + ' ' + (I.geste || 'lève son bâton et invoque') + ' ' + I.n + ' ' + (I.noms || 'tortues') + ' : ' + (mo.d.fem ? 'elle' : 'il') + ' en invoquera toutes les ' + I.periode + ' s !', 'alerte'); }
  else chiffre('Invocation !', new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.4, mo.z), 'butin');
  const places = [];
  for (let k = 0; k < Math.min(I.n, I.max - debout); k++) { const a = mo.ry + (k + 0.5) / I.n * Math.PI * 2, p = pointValide(mo.x, mo.z, mo.x + Math.sin(a) * 2.4, mo.z + Math.cos(a) * 2.4); places.push(p); cercleInvocation(p.x, solA(p.x, p.z), p.z, mo.d.couleurSorts); } /* (a sa couleur, 30/10/2026) */
  let t = 0; effets.push((dt) => { t += dt; if (!combat || combat.fin) return true; if (t < 0.8) return false;
    places.forEach((p, k) => { pouf(p.x, solA(p.x, p.z), p.z, 2.4, '#7fe0d8'); apparaitre(I.types[k % I.types.length], { x: p.x, z: p.z, apres: (o) => { o.invoqueur = mo.id; o.invoque = true; } }); combat.total++; });
    return true; });
}
/* LE LEMURIEN TIKI, BETE SAUVAGE ET INCANTATEUR VAUDOU (01/11/2026, par Discord : « ses etats, c'est : bete sauvage, incantateur, en gros malediction
   vaudou et nature, feuille, arbre », Mathieu, qui garde les quatre idees proposees) : element feuille (sa toupie et son bond font pousser l'herbe et voler
   les feuilles), des totems-masques plantes autour de toi qui crachent des flechettes, une danse vaudou ou des masques tournent autour de lui et le rendent
   plus vif, et une malediction : un masque fantome te suit, s'arrete, et explose */
/* le masque tiki : une face de bois sculpte, des yeux qui luisent vert, une bouche aux dents, une couronne de feuilles (spectre : le masque fantome) */
function masqueTiki(spectre) {
  const g = new T.Group(), P = (geo, c, x, y, z, rz) => { const o = spectre ? new T.Mesh(geo, new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8, depthWrite: false })) : maille(geo, c); o.position.set(x, y, z); if (rz) o.rotation.z = rz; g.add(o); return o; };
  P(new T.BoxGeometry(0.56, 0.72, 0.12), spectre ? '#7fffb0' : '#c8873a', 0, 0, 0); P(new T.BoxGeometry(0.6, 0.12, 0.15), spectre ? '#3fd890' : '#8a4a20', 0, 0.28, 0);
  [-1, 1].forEach((s) => { P(new T.BoxGeometry(0.16, 0.12, 0.04), '#1e1410', 0.13 * s, 0.08, 0.07); P(new T.BoxGeometry(0.2, 0.05, 0.05), spectre ? '#2f9a68' : '#5a2a10', 0.13 * s, 0.19, 0.075, -0.3 * s); P(new T.BoxGeometry(0.05, 0.14, 0.02), spectre ? '#2f9a68' : '#c83a2a', 0.22 * s, -0.08, 0.065);
    const o = new T.Mesh(new T.SphereGeometry(0.035, 8, 6), new T.MeshBasicMaterial({ color: '#b8ff5a' })); o.position.set(0.13 * s, 0.08, 0.1); g.add(o); }); /* (les yeux, les sourcils froncés, les peintures de guerre) */
  P(new T.BoxGeometry(0.08, 0.16, 0.08), spectre ? '#5fe8a0' : '#a86a2a', 0, -0.03, 0.09); P(new T.BoxGeometry(0.36, 0.14, 0.04), '#1e1410', 0, -0.21, 0.07);
  for (let i = 0; i < 4; i++) P(new T.BoxGeometry(0.05, 0.05, 0.03), '#f0ead8', -0.105 + i * 0.07, -0.165, 0.09); /* (les dents) */
  for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.32, f = P(new T.ConeGeometry(0.08, 0.42, 4), spectre ? '#7fffb0' : (i % 2 ? '#7fc24f' : '#4f8f2e'), Math.sin(a) * 0.22, 0.36 + Math.cos(a) * 0.18, -0.02, -a); f.scale.z = 0.35; } /* (la couronne de feuilles) */
  return g;
}
/* le totem-masque : un poteau de bois sculpte, deux anneaux, le masque en haut, une butte de terre et des feuilles au pied */
function fabriquerTotem() {
  const g = new T.Group(), a = (o, y) => { o.position.y = y; g.add(o); return o; };
  a(maille(new T.CylinderGeometry(0.45, 0.6, 0.18, 10), '#6a5236'), 0.09); a(maille(new T.CylinderGeometry(0.2, 0.26, 1.3, 8), '#6f4a2a'), 0.75);
  [0.4, 0.95].forEach((y) => a(maille(new T.CylinderGeometry(0.25, 0.25, 0.07, 8), '#4a2e18'), y));
  const mq = masqueTiki(); mq.position.set(0, 1.5, 0.12); mq.scale.setScalar(1.1); g.add(mq);
  for (let i = 0; i < 5; i++) { const b = i * 1.26, f = maille(new T.ConeGeometry(0.07, 0.35, 4), i % 2 ? '#5fae3a' : '#7fc24f'); f.position.set(Math.cos(b) * 0.42, 0.25, Math.sin(b) * 0.42); f.rotation.set(Math.sin(b) * 0.6, 0, -Math.cos(b) * 0.6); f.scale.z = 0.35; g.add(f); }
  const env = new T.Group(); env.add(g); env.userData.hauteur = 2.0; return fusionner(env);
}
/* le noeud de racine du Chene Mou (08/11/2026) : une souche de grosses racines nouees qui sortent de terre en arcs, l'ecorce sombre, de la mousse, et au milieu une
   fente de seve rouge qui luit, de la couleur de l'oeil du Chene Mou ; une butte de terre au pied */
function fabriquerNoeud() { /* (refait le 08/11/2026 : la premiere version, des arcs fins et sombres, faisait une araignee noire dans la nuit de la foret) */
  const g = new T.Group(), a = (o, x, y, z) => { o.position.set(x, y, z); g.add(o); return o; }, B = ['#8a6440', '#7a5638', '#946c46'];
  a(maille(new T.CylinderGeometry(0.85, 1.05, 0.2, 12), '#6b5236'), 0, 0.08, 0); /* (la butte de terre) */
  a(maille(new T.CylinderGeometry(0.42, 0.62, 0.95, 9), B[0]), 0, 0.5, 0); /* (la souche) */
  const loupe = a(maille(new T.DodecahedronGeometry(0.5, 1), B[1]), 0.05, 1.0, 0); loupe.scale.set(1.0, 0.75, 0.95); /* (la loupe noueuse du dessus) */
  a(maille(new T.SphereGeometry(0.22, 7, 6), B[2]), -0.3, 0.75, 0.2); a(maille(new T.SphereGeometry(0.18, 7, 6), B[2]), 0.32, 0.62, -0.18); /* (des noeuds sur le flanc) */
  for (let i = 0; i < 5; i++) { const b = i / 5 * Math.PI * 2 + 0.4, R = 0.32 + (i % 2) * 0.1, arc = maille(new T.TorusGeometry(R, 0.15, 6, 10, Math.PI), B[i % 3]); /* (de grosses racines qui sortent de la souche et replongent) */
    const piv = new T.Group(); piv.rotation.y = b; arc.position.set(0.45 + R, 0.04, 0); piv.add(arc); g.add(piv); }
  for (let i = 0; i < 3; i++) { const b = i * 2.1 + 1, c = maille(new T.ConeGeometry(0.1, 0.55, 5), '#6a4a2e'); c.position.set(Math.cos(b) * 1.15, 0.22, Math.sin(b) * 1.15); c.rotation.set(Math.sin(b) * 0.4, 0, -Math.cos(b) * 0.4); g.add(c); } /* (des pointes de racine qui percent le sol) */
  for (let i = 0; i < 5; i++) { const b = i * 1.26 + 0.6, m = maille(new T.SphereGeometry(0.17, 6, 5), i % 2 ? '#7fb04a' : '#93c25a'); m.scale.set(1.3, 0.45, 1.1); m.position.set(Math.cos(b) * 0.38, 1.18 - (i % 2) * 0.12, Math.sin(b) * 0.38); g.add(m); } /* (la mousse) */
  const seve = new T.Mesh(new T.SphereGeometry(0.15, 10, 8), new T.MeshBasicMaterial({ color: '#ff5a24' })); seve.scale.set(0.7, 2.2, 0.5); seve.position.set(0, 0.62, 0.5); g.add(seve); /* (la fente de seve, l'oeil du Chene Mou) */
  const halo = new T.Mesh(new T.SphereGeometry(0.3, 10, 8), new T.MeshBasicMaterial({ color: '#ff8a3a', transparent: true, opacity: 0.35, depthWrite: false })); halo.scale.set(0.9, 1.6, 0.5); halo.position.set(0, 0.62, 0.48); g.add(halo);
  const env = new T.Group(); env.add(g); env.userData.hauteur = 1.5; return fusionner(env);
}
/* LE CHENE MOU ENRACINE (08/11/2026, PALIER10.md : « premier temps, il est enracine au bord de la ferme, immobile et invulnerable ; trois ou quatre noeuds de
   racine sortent de terre ; chaque noeud abattu lui arrache un morceau d'armure, mais tant qu'ils vivent ils font pousser des Arbres Collants et sortir des
   Tronknydes ; second temps, il s'arrache du sol quand le dernier noeud tombe »). Il arrive enfonce dans le sol jusqu'aux bras (son geste arrache_1 fige au
   debut, il se debat, 22c-squelettes.js), invulnerable, et fait encore jaillir ses racines sous toi (ses autres sorts attendent). Ses noeuds sortent de terre
   autour du perso, l'herbe devient sous-bois autour d'eux. Toutes les « pousse » s, un noeud (chacun son tour) fait sortir un Tronknyde, ou un Arbre Collant
   une fois sur trois (« max » en tout). Chaque noeud coupe lui arrache un morceau d'ecorce (« ecorce » : une part de sa vie). Le dernier tombe : il s'arrache
   du sol (arrache_1 en entier), rugit et marche sur toi. mo.ancre : il ne marche pas, ne frappe pas, rien ne le pousse */
const C_FORET = ['#6a8a3a', '#c8e08a', '#3e2c1e'];
function capEnracine(mo, ctx) {
  const E = mo.d.enracine; if (!E || !mo.m) return;
  const c0 = combat;
  if (!mo.racine) { const pp = ctx.pp; mo.racine = { t: 0, phase: 'enfonce', pousse: E.pousse - 4, tour: 0, liste: [], morts: 0 }; mo.ancre = true;
    toast(leNom(mo.d) + ' est enraciné, invulnérable tant que ses ' + E.noeuds + ' nœuds de racine vivent : coupe-les !', 'alerte');
    sortirNoeuds(mo, c0, pp, E.noeuds); secousse(0.25, 0.6);
    return; }
  const R = mo.racine; R.t += ctx.dt;
  if (R.phase === 'libre') { if (!R.re && E.reSeuil && mo.pv < mo.pvMax * E.reSeuil && !(mo.bloqueT > 0) && !mo.lance && !mo.regard) reEnraciner(mo, ctx); return; }
  const N = R.liste.filter((o) => o.etat !== 'mort'), morts = R.liste.length - N.length; /* (un noeud qui sort encore de terre est « grimpe », pas encore actif) */
  if (morts > R.morts) { /* des noeuds sont tombes : un morceau d'ecorce par noeud */
    const k = morts - R.morts, y = mo.m.position.y, perte = Math.min(mo.pv - 1, Math.round(mo.pvMax * E.ecorce * k)); R.morts = morts;
    if (perte > 0) { mo.pv -= perte; if (c0.st) c0.st.inflige += perte; chiffre('-' + fmt(perte), new T.Vector3(mo.x, y + mo.haut * 0.8, mo.z), 'gros'); }
    eclatsRoche(mo.x, y + mo.haut * 0.5, mo.z, 16, 1.4, MATS_BOIS); feuillesVolantes(mo.x, y + mo.haut * 0.7, mo.z, 1.4, 10); secousse(0.15, 0.3);
    if (N.length) toast('Un nœud de racine tombe : ' + leNom(mo.d, true) + ' perd un morceau d\'écorce. Encore ' + N.length + ' !', 'or'); }
  if (R.phase !== 'enfonce') { if (R.phase === 'arrache' && !m0Anim(mo)) libererChene(mo); return; }
  if (R.t > 2.5 && R.liste.length && !N.length) { R.phase = 'arrache'; toast('Ses nœuds sont tombés : ' + leNom(mo.d, true) + ' s\'arrache du sol et marche sur toi !', 'alerte'); return; }
  /* (10/11/2026, « les noeuds invoquent pas tous des Tronknydes », Mathieu : chaque noeud fait pousser les siens toutes les E.pousse s, a tour de role ; E.max en vie au plus) */
  const A = N.filter((o) => o.etat === 'actif'); if (!A.length) return; let place = E.max - c0.monstres.filter((o) => o.pousseDe === mo.id && o.etat !== 'mort').length;
  A.forEach((nd, i) => { if (nd.pousseT == null) nd.pousseT = E.pousse - 3 - i * E.pousse / A.length; if ((nd.pousseT += ctx.dt) < E.pousse) return; if (place <= 0) { nd.pousseT = E.pousse - 1; return; }
    nd.pousseT = 0; place--; R.tour++; pousserNoeud(mo, nd, E.types ? hasard(E.types) : R.tour % 3 === 0 ? 'arbreCollant' : 'tronknyde', c0); });
  if (!c0.pousseVu && R.tour) { c0.pousseVu = true; toast(E.types ? 'Toute la forêt sort des nœuds, un monstre au hasard à chaque fois' + (casseursNoeuds(c0, E) ? ', et la moitié file casser tes bâtiments' : '') + ' : coupe les nœuds !' : 'La forêt pousse autour des nœuds : des Tronknydes et des Arbres Collants en sortent tant qu\'ils vivent !', 'alerte'); }
}
const casseursNoeuds = (c0, E) => !!E.casse && lieu === 'ferme' && !c0.arene && !c0.dev && !c0.raid; /* (a la ferme seulement : a l'Arene, il n'y a pas de batiment) */
function pousserNoeud(mo, n, ty, c0) { /* un monstre sort de terre pres d'un noeud */
  [ty].forEach((ty) => { const a = Math.random() * Math.PI * 2, p = pointValide(n.x, n.z, n.x + Math.sin(a) * 1.9, n.z + Math.cos(a) * 1.9); cercleInvocation(p.x, solA(p.x, p.z), p.z, C_FORET);
    let t = 0; effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin) return true; if (t < 0.8) return false; const y = solA(p.x, p.z); mottes(p.x, y, p.z, 6, 1); feuillesVolantes(p.x, y + 0.3, p.z, 0.5, 5);
      apparaitre(ty, { x: p.x, z: p.z, apres: (o) => { o.invoqueur = mo.id; o.invoque = true; o.pousseDe = mo.id; const E = mo.d.enracine; if (casseursNoeuds(c0, E) && o.d.vitesse > 0 && !o.d.plante && Math.random() < E.casse) { o.casseur = true; o.aggro = false; } } }); c0.total++; return true; }); }); /* (un sur deux file sur les batiments, 10/11/2026) */ /* (invoqueur : le Chene Mou, ils comptent avec ses Tronknydes une fois libre, 4 en tout) */
}
function sortirNoeuds(mo, c0, pp, n) { /* ses noeuds sortent de terre autour du perso (un cercle d'invocation, 0,9 s, puis le noeud) */
  const E = mo.d.enracine, a0 = Math.random() * Math.PI * 2, places = [];
  for (let k = 0; k < n; k++) { const a = a0 + k / n * Math.PI * 2, p = pointValide(pp.x, pp.z, pp.x + Math.sin(a) * E.R, pp.z + Math.cos(a) * E.R); places.push(p); cercleInvocation(p.x, solA(p.x, p.z), p.z, C_FORET); }
  let t = 0; effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin) return true; if (t < 0.9) return false;
    places.forEach((p, k) => { const y = solA(p.x, p.z); mottes(p.x, y, p.z, 10, 1.3); poussiere(p.x, y, p.z, 10, 1.2, '#8a6a48'); feuillesVolantes(p.x, y + 0.3, p.z, 0.8, 8);
      apparaitre('noeudRacine', { x: p.x, z: p.z, apres: (o) => { o.invoqueur = mo.id; o.invoque = true; o.noeudDe = mo.id; mo.racine.liste.push(o); sousBois(o, c0); const RN = o.d.racines; if (RN) o.racinesT = RN.periode - 3 - k * RN.periode / n; } }); c0.total++; }); /* (leurs racines a tour de role, pas toutes ensemble) */
    return true; });
}
/* IL S'ENRACINE A NOUVEAU (09/11/2026, « a 25 % de vie, j'aime bien l'idee qu'il puisse reinvoquer les trucs qu'il fait au debut ; deux ou quatre, c'est a toi
   de decider », Mathieu : deux, pour garder un combat rapide) : sous E.reSeuil de sa vie, une seule fois, il replonge dans le sol (son geste arrache_1 a l'envers),
   invulnerable, et E.renoeuds noeuds sortent autour de toi ; la suite est celle du debut : la foret pousse, chaque noeud coupe lui arrache un morceau d'ecorce,
   le dernier tombe, il s'arrache du sol */
function reEnraciner(mo, ctx) {
  const E = mo.d.enracine, R = mo.racine, c0 = combat; R.re = true; R.phase = 'replonge'; R.liste = []; R.morts = 0; R.t = 0; R.lance = false; R.rp = false; R.pousse = E.pousse - 4; R.tour = 0;
  mo.ancre = true; mo.geste = null; mo.tourne = 0; mo.bloqueT = 0; const y = mo.m.position.y;
  toast(leNom(mo.d) + ' replonge dans le sol : invulnérable tant que ses ' + E.renoeuds + ' nouveaux nœuds vivent, coupe-les !', 'alerte');
  secousse(0.3, 0.6); mottes(mo.x, y, mo.z, 16, 2.2); poussiere(mo.x, y, mo.z, 14, 2.6, '#8a6a48'); feuillesVolantes(mo.x, y + 1, mo.z, 2, 12); onde(mo.x, y, mo.z, 6, '#c8e08a', 0.5, 0.8);
  sortirNoeuds(mo, c0, ctx.pp, E.renoeuds); if (!m0Anim(mo)) R.phase = 'enfonce';
}
function libererChene(mo) { /* il est sorti du sol : il marche, frappe, et ses autres sorts reprennent */
  mo.racine.phase = 'libre'; mo.ancre = false; mo.cd = 1.2; mo.bloqueT = 0.2; const y = mo.m.position.y;
  secousse(0.35, 0.6); mottes(mo.x, y, mo.z, 18, 2.2); poussiere(mo.x, y, mo.z, 16, 2.6, '#8a6a48'); feuillesVolantes(mo.x, y + 1, mo.z, 2, 14); onde(mo.x, y, mo.z, 6, '#c8e08a', 0.6, 0.8);
  if (m0Anim(mo)) { const pp = paysanMesh.position; mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z); geste(mo, 'rugir', true); }
}
/* le sous-bois autour d'un noeud : l'herbe s'assombrit sous lui, des feuilles mortes et des fougeres ; il se fane quand le noeud tombe */
function sousBois(o, c0) {
  const g = new T.Group(), y = solA(o.x, o.z) + 0.03, disque = new T.Mesh(new T.CircleGeometry(2.1, 28), new T.MeshBasicMaterial({ color: '#24341a', transparent: true, opacity: 0, depthWrite: false })); disque.rotation.x = -Math.PI / 2; g.add(disque);
  for (let i = 0; i < 9; i++) { const b = i * 2.4, r = 0.9 + (i % 3) * 0.38, f = new T.Mesh(new T.ConeGeometry(0.12, 0.5, 4), mat(i % 2 ? '#3f6a26' : '#5a4a2a')); f.position.set(Math.cos(b) * r, 0.2, Math.sin(b) * r); f.rotation.set(Math.sin(b) * 0.5, b, Math.cos(b) * 0.5); f.scale.z = 0.3; g.add(f); }
  g.position.set(o.x, y, o.z); scene.add(g); let t = 0, fin = 0;
  effets.push((dt) => { t += dt; const vivant = combat === c0 && !c0.fin && o.etat === 'actif'; if (!vivant) fin += dt;
    const k = Math.min(1, t / 1.2) * Math.max(0, 1 - fin / 1.2); disque.material.opacity = 0.55 * k; g.scale.setScalar(0.4 + 0.6 * Math.min(1, t / 1.2));
    if (fin >= 1.2) { jeter(g); return true; } return false; });
}
/* LE CHENE MOU AVALE SA TROUPE (08/11/2026, PALIER10.md : « il avale un monstre de la troupe pour se soigner ») : toutes les « periode » s, s'il a un monstre de
   sa troupe a portee de bras, il plonge le bras, l'attrape, le ramene a sa bouche et l'avale (son geste avale_1) : il regagne « soin » de sa vie. Le perso qui
   abat le monstre a temps l'en prive. Fiche : avale: { periode, R, soin } */
function capAvale(mo, ctx) {
  const A = mo.d.avale, { sortPret } = ctx; if (!A || mo.ancre || combat.deroute != null) return;
  if (!sortPret('avaleT', A.periode) || mo.geste) return;
  const dist = (o) => Math.hypot(o.x - mo.x, o.z - mo.z), proie = combat.monstres.filter((o) => o !== mo && o.etat === 'actif' && !o.attrape && !o.d.boss && !o.d.demi && !o.d.totem && !o.d.plante && dist(o) < A.R).sort((a, b) => dist(a) - dist(b))[0];
  if (!proie) { mo.avaleT = A.periode - 2; return; }
  mo.avaleT = 0; const c0 = combat; mo.ry = Math.atan2(proie.x - mo.x, proie.z - mo.z); mo.bloqueT = 2.0; mo.cd = Math.max(mo.cd || 0, 2.1);
  if (m0Anim(mo)) geste(mo, 'avale', true);
  proie.attrape = true; proie.bloqueT = 9; proie.cd = 9;
  if (!c0.avaleVu) { c0.avaleVu = true; toast(leNom(mo.d) + ' attrape ' + leNom(proie.d, true) + ' et l\'avale pour se soigner : abats sa troupe avant qu\'il ne la mange !', 'alerte'); }
  const x0 = proie.x, z0 = proie.z, s0 = proie.m.scale.x; let t = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin) return true;
    if (proie.etat !== 'actif') return true; /* (abattu a temps : pas de soin) */
    if (mo.etat !== 'actif') { proie.attrape = false; proie.bloqueT = 0; proie.cd = 1; proie.hop = 0; proie.m.scale.setScalar(s0); return true; }
    if (t < 0.45) return false;
    const k = Math.min(1, (t - 0.45) / 0.5), bx = mo.x + Math.sin(mo.ry) * 0.9, bz = mo.z + Math.cos(mo.ry) * 0.9;
    proie.x = x0 + (bx - x0) * k; proie.z = z0 + (bz - z0) * k; proie.hop = Math.sin(k * Math.PI * 0.5) * mo.haut * 0.62; proie.m.scale.setScalar(s0 * (1 - 0.6 * k));
    if (k < 1) return false;
    proie.m.visible = false; proie.pv = 0; proie.etat = 'mort'; proie.t = 0; if (proie.barre) proie.barre.remove(); if (combat.cible === proie) combat.cible = null;
    const a0 = mo.pv, y = mo.m.position.y; mo.pv = Math.min(mo.pvMax, mo.pv + Math.round(mo.pvMax * A.soin));
    if (mo.pv > a0) chiffre('+' + fmt(mo.pv - a0), new T.Vector3(mo.x, y + mo.haut * 0.85, mo.z), 'soin');
    emettre(FX_VIF, 18, { x: mo.x, y: y + mo.haut * 0.6, z: mo.z, r: 1.2, v: [0, 2.4, 0], dv: 0.8, vie: [0.5, 0.8], taille: [0.14, 0.04], c: ['#d8ffd8', '#4fd06a'], a: 1, frein: 0.8 }); onde(mo.x, y, mo.z, 3.5, '#4fd06a', 0.5, 0.7, true);
    return true; });
}
/* LA TEMPETE DE FEUILLES du Chene Mou (08/11/2026, PALIER10.md : « rage sous 30 % : une tempete de feuilles, l'ecran se couvre de feuilles, des zones tombent
   au hasard ») : en rage, des feuilles tombent en tourbillonnant sur tout l'ecran ; toutes les « periode » s, un tourbillon de feuilles s'abat dans un cercle
   rouge, une fois sur deux sous toi, sinon pres de toi. Fiche : tempete: { periode, R, x } */
let TEMPETE_F = null;
function voileTempete(mo, c0) {
  if (!TEMPETE_F) { const v = document.createElement('div'); v.className = 'tempete-feuilles'; v.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;opacity:0;z-index:1;transition:opacity .8s';
    const st = document.createElement('style'); st.textContent = '@keyframes feuilleTombe{0%{transform:translate(0,-8vh) rotate(0deg)}50%{transform:translate(-14vw,50vh) rotate(380deg)}100%{transform:translate(-32vw,112vh) rotate(760deg)}}'; document.head.appendChild(st);
    const C = ['#6fae3a', '#9ccc4a', '#c8a03a', '#8a6a30', '#4f8a2a'];
    v.innerHTML = Array.from({ length: 42 }, (_, i) => '<i style="position:absolute;left:' + (8 + Math.random() * 115).toFixed(1) + '%;top:0;width:' + (11 + Math.random() * 10).toFixed(0) + 'px;height:' + (6 + Math.random() * 4).toFixed(0) + 'px;border-radius:60% 0;background:' + C[i % C.length] + ';opacity:.88;animation:feuilleTombe ' + (2.4 + Math.random() * 2.4).toFixed(1) + 's linear ' + (-Math.random() * 5).toFixed(1) + 's infinite"></i>').join('');
    canvas.insertAdjacentElement('afterend', v); TEMPETE_F = v; }
  const v = TEMPETE_F; v.style.opacity = '1';
  effets.push(() => { if (combat === c0 && !c0.fin && mo.etat === 'actif') return false; v.style.opacity = '0'; return true; });
}
function capTempete(mo, ctx) {
  const TP = mo.d.tempete; if (!TP || !(mo.enrage || (TP.seuil && mo.pv < mo.pvMax * TP.seuil)) || (mo.ancre && !TP.seuil) || combat.deroute != null) return; /* (seuil : elle commence avant la rage et continue quand il replonge, 10/11/2026) */
  const c0 = combat; if (!mo.tempeteOn) { mo.tempeteOn = true; mo.tempeteT = 0; voileTempete(mo, c0); toast(leNom(mo.d) + ' déchaîne une tempête de feuilles : des tourbillons tombent sans arrêt, sors des cercles rouges !', 'alerte'); }
  if ((mo.tempeteT += ctx.dt) < (mo.enrage ? TP.periode : TP.avant || TP.periode)) return; mo.tempeteT = 0;
  const p = paysanMesh.position, n = mo.tempeteN = (mo.tempeteN || 0) + 1, a = Math.random() * Math.PI * 2, r = n % 2 ? 0 : 2 + Math.random() * 4, q = pointValide(p.x, p.z, p.x + Math.cos(a) * r, p.z + Math.sin(a) * r);
  const prepa = 1.1, y = solA(q.x, q.z); let t = 0, f = 0;
  zoneDanger({ mo, x: q.x, z: q.z, r: TP.R, duree: prepa, effet: (d) => { impactElement('feuille', q.x, q.z, TP.R); const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) blesserPerso(Math.max(1, Math.round(degSort(mo) * TP.x)), mo); } });
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || t >= prepa) return true; if ((f += dt) >= 0.1) { f = 0; feuillesVolantes(q.x, y + 3.2 - t * 2.4, q.z, TP.R * 0.6, 6, true); } return false; }); /* (plus de feuilles, 10/11/2026) */
}
/* LE REGARD DU CHENE, premiere version (09/11/2026, « le coup du rayon laser avec son oeil, j'aime beaucoup : qu'il fasse un 360 sur lui-meme et qu'il tire un rayon qui touche
   toute la map ; il faut se cacher derriere un batiment, sinon tu perds environ 1 500 PV », Mathieu) : il rugit, son oeil rouge enfle et la lumiere s'y engouffre
   (RG.charge s) ; trois souches jaillissent pres de toi (a l'Arene, il n'y a pas de batiment) ; puis il tourne sur lui-meme en RG.tour s et son rayon balaie toute
   la carte. Le rayon s'arrete sur les batiments de la ferme et sur les souches : derriere, tu es a l'abri. Il part a l'oppose de toi : il te faut un demi-tour
   pour t'atteindre. Il touche une fois. Fiche : regard: { periode, charge, tour, x (fois ses sorts), souches } */
const L_REGARD = 40;
function obstaclesRegard(c0, tient, cum) { /* les batiments debout de la ferme (leur rectangle au sol) et les souches debout ; une ruine n'abrite plus, sauf celle que le rayon vient de raser, un demi-tour encore (tient) */
  const L = []; if (lieu === 'ferme') clesBats().forEach((k) => { if (enRuine(k) && !(tient && tient[k] != null && cum - tient[k] < Math.PI)) return; const z = zoneBat(k); if (z) L.push({ x: z.x, z: z.z, hw: z.hw + 0.2, hd: z.hd + 0.2, cle: k }); });
  (c0.souches || []).forEach((q) => { if (q.debout) L.push({ x: q.x, z: q.z, r: q.r }); }); return L;
}
function rayonObstacle(ox, oz, dx, dz, L, obs) { /* la distance du premier obstacle sur le rayon (ox, oz) + t (dx, dz), sinon L */
  let best = L; rayonObstacle.o = null; /* (rayonObstacle.o : l'obstacle touche, pour abimer le batiment) */
  obs.forEach((o) => {
    if (o.r) { const fx = o.x - ox, fz = o.z - oz, t = fx * dx + fz * dz; if (t <= 0) return; const d2 = fx * fx + fz * fz - t * t; if (d2 > o.r * o.r) return; const t0 = t - Math.sqrt(o.r * o.r - d2); if (t0 > 0 && t0 < best) { best = t0; rayonObstacle.o = o; } return; }
    if (Math.abs(ox - o.x) <= o.hw && Math.abs(oz - o.z) <= o.hd) return; /* (s'il se tient dans un rectangle, il ne compte pas) */
    let t0 = 0, t1 = best;
    for (const [q, d, c, h] of [[ox, dx, o.x, o.hw], [oz, dz, o.z, o.hd]]) { if (Math.abs(d) < 1e-6) { if (Math.abs(q - c) > h) return; continue; } let a = (c - h - q) / d, b = (c + h - q) / d; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) return; }
    if (t0 > 0 && t0 < best) { best = t0; rayonObstacle.o = o; } });
  return best;
}
function soucheRegard(c0, x, z) { /* une grosse souche qui jaillit du sol en 0,3 s : on se cache derriere ; elle replonge a la fin du rayon */
  const g = new T.Group(), y = solA(x, z), tronc = maille(new T.CylinderGeometry(0.62, 0.8, 1.9, 10), '#5a3e26'); tronc.position.y = 0.95; g.add(tronc);
  const dessus = maille(new T.CylinderGeometry(0.58, 0.62, 0.06, 10), '#c79a62'); dessus.position.y = 1.92; g.add(dessus);
  const cerne = maille(new T.TorusGeometry(0.34, 0.025, 4, 16), '#8a6440'); cerne.rotation.x = Math.PI / 2; cerne.position.y = 1.96; g.add(cerne);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.3, r = maille(new T.ConeGeometry(0.22, 0.9, 5), '#4a3220'); r.position.set(Math.sin(a) * 0.75, 0.18, Math.cos(a) * 0.75); r.rotation.set(Math.cos(a) * 1.2, 0, -Math.sin(a) * 1.2); g.add(r); }
  const mousse = maille(new T.SphereGeometry(0.35, 8, 6), '#4f7a2a'); mousse.scale.set(1.2, 0.4, 1); mousse.position.set(0.2, 1.95, -0.1); g.add(mousse);
  sansClic(g); g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); g.position.set(x, y - 2.1, z); scene.add(g);
  const q = { x, z, r: 0.78, debout: true }; (c0.souches = c0.souches || []).push(q);
  mottes(x, y, z, 10, 1.2); poussiere(x, y, z, 8, 1.2, '#8a6a48'); let t = 0, f = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin) { jeter(g); return true; }
    if (t < 0.3) { const k = t / 0.3; g.position.y = y - 2.1 + 2.1 * (1 - (1 - k) * (1 - k)); return false; } g.position.y = y;
    if (!q.debout) { f += dt; const k = Math.min(1, f / 0.5); g.position.y = y - 2.1 * k * k; if (k >= 1) { jeter(g); c0.souches = (c0.souches || []).filter((x2) => x2 !== q); return true; } }
    return false; });
}
/* LE REGARD DU CHENE, refait le 09/11/2026 (« le laser doit partir que de son oeil, la il part de son dos et de son oeil ; il plante ses racines dans le sol,
   il s'enfonce et il fait deux tours sur lui-meme, assez vite ; une fois fini, il ressort ses racines, fait un saut assez haut, et quand il retombe ca fait
   comme un petit tremblement de terre : plus t'es proche, plus tu prends ; et le laser, rends-le plus epique, un truc de malade », Mathieu).
   1. il plante ses racines (RG.plante s) : ses huit pattes s'enfoncent dans le sol (mo.pattesMode), il s'enfonce en se vissant et se retrouve dos a toi ;
   2. son oeil se charge (RG.charge s) : la lumiere s'y engouffre, le sol rougeoie sous lui, tout tremble ;
   3. il fait RG.tours tours en RG.tour s : le rayon part de son oeil (sa direction est celle de l'oeil, plus jamais du centre du tronc), un coeur blanc,
      une gaine orange, un halo rouge, des etincelles qui filent, le sol qui brule et noircit, l'ecran qui rougit ; il s'arrete sur les batiments et les
      souches ; il te touche au plus une fois par tour (RG.x fois ses sorts) ;
   4. il arrache ses racines, bondit tres haut (SA.H) et retombe : un seisme dans un cercle rouge de SA.R, SA.x fois ses sorts au centre, 20 % au bord.
   Fiche : regard: { periode, plante, charge, tours, tour, x, souches, saut: { H, monte, chute, R, x } } */
let VOILE_LASER = null, TEX_LUEUR_SOL = null;
function texLueurSol() { /* un disque de lumiere : blanc-orange au centre, transparent au bord */
  if (TEX_LUEUR_SOL) return TEX_LUEUR_SOL; const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,214,140,0.85)'); g.addColorStop(0.35, 'rgba(255,120,40,0.5)'); g.addColorStop(1, 'rgba(255,60,20,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); TEX_LUEUR_SOL = new T.CanvasTexture(cv); return TEX_LUEUR_SOL;
}
function voileLaser(op) {
  if (!VOILE_LASER) { const v = document.createElement('div'); v.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;z-index:1;transition:opacity .25s;background:radial-gradient(ellipse at center, rgba(255,90,40,0) 40%, rgba(190,20,10,.55) 100%)'; canvas.insertAdjacentElement('afterend', v); VOILE_LASER = v; }
  VOILE_LASER.style.opacity = String(op);
}
function capRegard(mo, ctx) {
  const RG = mo.d.regard, { pp, sortPret } = ctx; if (!RG || mo.ancre || combat.deroute != null || mo.regard || mo.lance) return;
  if (mo.regardT == null) mo.regardT = RG.periode - 6; /* (le premier, 6 s apres qu'il s'est arrache du sol) */
  if (!sortPret('regardT', RG.periode)) return;
  const c0 = combat, SA = RG.saut, NT = RG.tours || 2, ENF = 0.9, APEX = 0.12;
  const t1 = RG.plante, t2 = t1 + RG.charge, t3 = t2 + RG.tour, t4 = t3 + 0.3, t5 = t4 + 0.3, t6 = t5 + SA.monte + APEX + SA.chute;
  mo.regardT = 0; mo.regard = true; mo.fixe = true; mo.geste = null; mo.tourne = 0;
  const sens = Math.random() < 0.5 ? 1 : -1, x0 = mo.x, z0 = mo.z, y0 = mo.m.position.y; mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z);
  mo.bloqueT = t6 + 0.35; mo.cd = Math.max(mo.cd || 0, t6 + 0.5);
  toast(leNom(mo.d) + ' plante ses racines : son œil va balayer toute la carte, deux fois. Cache-toi derrière un bâtiment ou une souche' + (RG.bat && lieu === 'ferme' ? ' (son rayon arrache un quart de sa vie au bâtiment à chaque passage)' : '') + ', puis éloigne-toi avant qu\'il ne retombe !', 'alerte');
  const a0 = mo.ry; for (let i = 0; i < RG.souches; i++) { const a = a0 + [0, 1.1, -1.1][i % 3], d = i ? 3.3 : 2.6, q = pointValide(pp.x, pp.z, pp.x + Math.sin(a) * d, pp.z + Math.cos(a) * d); soucheRegard(c0, q.x, q.z); } /* (de l'autre cote de toi, par rapport a lui) */
  mo.pattesMode = 'plante'; /* (ce sont ses pattes qui se plantent dans le sol : « t'as pas besoin d'en recreer de nouvelles en forme de pique », Mathieu, 09/11/2026) */
  /* l'oeil, le rayon et ses effets */
  const oeil = mo.m.getObjectByName('oeilP10'), E = new T.Vector3(), posOeil = () => (oeil ? oeil.getWorldPosition(E) : E.set(mo.x + Math.sin(mo.ry + mo.tourne) * 1.2, mo.m.position.y + 2.7, mo.z + Math.cos(mo.ry + mo.tourne) * 1.2));
  const add = (m) => { m.material.blending = T.AdditiveBlending; sansClic(m); m.renderOrder = 3; scene.add(m); return m; };
  const boule = add(new T.Mesh(new T.SphereGeometry(0.28, 14, 10), fxMat('#ff3a22', 0.95))), halo0 = add(new T.Mesh(new T.SphereGeometry(0.5, 14, 10), fxMat('#ff7a4a', 0.35)));
  const GEO_C = new T.CylinderGeometry(1, 1, 1, 12, 1, true), GEO_A = new T.RingGeometry(0.75, 1, 32);
  const couches = [['#fffaf2', 0.98, 0.14], ['#ffb04a', 0.7, 0.36], ['#ff2a14', 0.24, 0.85], ['#ff4a20', 0.08, 1.6]].map(([c, o, r]) => { const m = add(new T.Mesh(GEO_C, fxMat(c, o))); m.visible = false; m.userData.r = r; return m; });
  const anneaux = [0, 1].map((i) => { const m = add(new T.Mesh(GEO_A, fxMat(i ? '#ff7a3a' : '#ffd0a0', i ? 0.55 : 0.8))); m.visible = false; return m; });
  const impact = add(new T.Mesh(new T.SphereGeometry(0.5, 12, 8), fxMat('#ffb04a', 0.8))); impact.visible = false;
  const sol0 = add(new T.Mesh(new T.CircleGeometry(1, 40), new T.MeshBasicMaterial({ map: texLueurSol(), transparent: true, opacity: 0, depthWrite: false }))); sol0.rotation.x = -Math.PI / 2; sol0.position.set(x0, y0 + 0.06, z0); /* (un degrade orange doux : un disque rouge plein se prenait pour une zone de danger) */
  const UP = new T.Vector3(0, 1, 0), d3 = new T.Vector3(), Q = new T.Quaternion();
  const poserRayon = (A, B, t) => { d3.subVectors(B, A); const L = d3.length(); if (L < 0.05) return; const dir = d3.clone().normalize(); Q.setFromUnitVectors(UP, dir);
    couches.forEach((m, i) => { m.visible = true; m.position.copy(A).addScaledVector(d3, 0.5); m.quaternion.copy(Q); const r = m.userData.r * (1 + Math.sin(t * (40 + i * 13)) * (0.06 + i * 0.05)); m.scale.set(r, L, r); });
    anneaux.forEach((m, i) => { m.visible = true; m.position.copy(A).addScaledVector(dir, 0.35 + i * 0.6); m.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), dir); m.rotateZ(t * (i ? -9 : 7)); const s = (i ? 0.9 : 0.6) + Math.sin(t * 30 + i) * 0.08; m.scale.setScalar(s); }); };
  const cacher = () => { couches.concat(anneaux, [impact]).forEach((m) => { m.visible = false; }); };
  const pente = (O, L) => { const s = solA(x0, z0); return Math.max(s + 0.25, O.y - (O.y - s - 0.25) * Math.min(1, L / 22)); }; /* (le rayon descend doucement : a hauteur de poitrine a 8 cases, au ras du sol au loin) */
  const angApres = (k) => sens * (Math.PI + NT * Math.PI * 2 * (0.25 * k * k * (3 - 2 * k) + 0.75 * k)); /* (il demarre a peine plus doucement, puis file) */
  let t = 0, prev = null, cum = 0, dernier = -99, fb = 0, fs = 0, sautLance = false, arrache = false, decolle = false; const Pf = new T.Vector3(), vuBat = {}, tient = {};
  const finir = () => { [boule, halo0, impact, sol0].concat(couches, anneaux).forEach((m) => { scene.remove(m); if (m.geometry !== GEO_C && m.geometry !== GEO_A) m.geometry.dispose(); m.material.dispose(); }); /* (material.dispose ne jette pas sa texture : la lueur du sol est partagee) */ GEO_C.dispose(); GEO_A.dispose(); mo.pattesMode = null;
    voileLaser(0); if (mo.etat === 'actif') mo.ry += mo.tourne || 0; mo.tourne = 0; mo.hop = 0; mo.regard = false; mo.fixe = false; if (mo.ombreM) { mo.ombreM.position.y = 0.03; mo.ombreM.scale.setScalar(mo.d.ombre); }
    (c0.souches || []).forEach((q) => { q.debout = false; }); return true; };
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif' || mo.ancre || t >= t6 + 0.25) return finir();
    const sc = mo.m.scale.y || 1, ombre = (h) => { if (mo.ombreM) { mo.ombreM.position.y = (0.03 - h) / sc; mo.ombreM.scale.setScalar(mo.d.ombre * (1 - 0.5 * Math.max(0, Math.min(1, h / SA.H)))); } };
    const O = posOeil(); boule.position.copy(O); halo0.position.copy(O);
    /* 1. il plante ses racines et s'enfonce en se vissant, dos a toi */
    if (t < t1) { const k = t / t1, e = k * k * (3 - 2 * k); mo.hop = -ENF * e; ombre(mo.hop); mo.tourne = sens * Math.PI * e;
      if ((fs += dt) > 0.12) { fs = 0; poussiere(x0, y0, z0, 4, 2.2, '#8a6a48'); secousse(0.08, 0.15); }
      boule.scale.setScalar(0.4 + 0.4 * k); halo0.scale.setScalar(0.4 + 0.4 * k); return false; }
    /* 2. son oeil se charge : la lumiere s'y engouffre, le sol rougeoie, tout tremble de plus en plus */
    if (t < t2) { const k = (t - t1) / (t2 - t1); mo.tourne = sens * Math.PI; boule.scale.setScalar(0.8 + 1.0 * k + Math.sin(t * 34) * 0.15 * k); halo0.scale.setScalar(0.8 + 1.6 * k);
      sol0.material.opacity = 0.9 * k; sol0.scale.setScalar(1.2 + 2.0 * k);
      if (Math.random() < dt * 70) { const a = Math.random() * 6.28, r = 1.5 + Math.random() * 1.2; emettre(FX_VIF, 1, { x: O.x + Math.sin(a) * r, y: O.y + (Math.random() - 0.5) * 1.6, z: O.z + Math.cos(a) * r, r: 0.05, v: [-Math.sin(a) * r * 3.2, 0, -Math.cos(a) * r * 3.2], dv: 0.1, vie: [0.28, 0.34], taille: [0.16, 0.02], c: ['#ffe0d4', '#ff3a22'], etire: 0.02 }); }
      if (Math.random() < dt * 25) { const a = Math.random() * 6.28, r = 1 + Math.random() * 3; emettre(FX_VIF, 1, { x: x0 + Math.sin(a) * r, y: y0 + 0.1, z: z0 + Math.cos(a) * r, r: 0.1, v: [0, 2.2, 0], dv: 0.6, vie: [0.5, 0.9], taille: [0.12, 0.02], c: ['#ffd27a', '#ff6a2a'], grav: -1 }); } /* (des braises montent des fentes du sol) */
      if ((fs += dt) > 0.15) { fs = 0; secousse(0.05 + 0.12 * k, 0.2); flashLumiere(O.x, O.y, O.z, '#ff3a22', 2 + 3 * k, 8 + 6 * k, 0.2); }
      if (t + dt >= t2) { secousse(0.35, 0.5); flashLumiere(O.x, O.y, O.z, '#ffffff', 6, 16, 0.35); voileLaser(1); onde(x0, y0, z0, 6, '#ff5a2a', 0.5, 0.8); }
      return false; }
    /* 3. deux tours, le rayon part de son oeil */
    if (t < t3) { const k = (t - t2) / (t3 - t2); mo.pattesMode = 'vrille'; mo.tourne = angApres(k); sol0.material.opacity = 0.9; sol0.scale.setScalar(3.2 + Math.sin(t * 20) * 0.25);
      let dx = O.x - mo.x, dz = O.z - mo.z, l = Math.hypot(dx, dz); if (l < 0.2) { const f = mo.ry + mo.tourne; dx = Math.sin(f); dz = Math.cos(f); l = 1; } dx /= l; dz /= l; /* (la direction de l'oeil, vue d'en haut) */
      const ang = Math.atan2(dx, dz), obs = obstaclesRegard(c0, tient, cum), Lr = rayonObstacle(O.x, O.z, dx, dz, L_REGARD, obs), ob = rayonObstacle.o;
      if (ob && ob.cle && RG.bat && !enRuine(ob.cle) && (vuBat[ob.cle] == null || cum - vuBat[ob.cle] > Math.PI)) { /* (le rayon bute sur un batiment : il lui arrache RG.bat de sa vie, une fois par tour ; rase, il abrite encore jusqu'au bout de ce passage) */
        vuBat[ob.cle] = cum; const al = c0.alerteBat || (c0.alerteBat = {}), deja = al[ob.cle]; al[ob.cle] = true; blesserBat(ob.cle, Math.ceil(pvMaxBat(ob.cle) * RG.bat)); if (!deja) delete al[ob.cle]; if (enRuine(ob.cle)) tient[ob.cle] = cum;
        if (!c0.rayonBatVu) { c0.rayonBatVu = true; toast('Le rayon brûle tes bâtiments : un quart de leur vie à chaque passage. Rasé, il ne t\'abrite plus !', 'alerte'); } }
      Pf.set(O.x + dx * Lr, pente(O, Lr), O.z + dz * Lr); poserRayon(O, Pf, t);
      boule.scale.setScalar(1.6 + Math.sin(t * 40) * 0.15); halo0.scale.setScalar(2.4 + Math.sin(t * 25) * 0.2);
      if (Lr < L_REGARD - 0.1) { impact.visible = true; impact.position.copy(Pf); impact.scale.setScalar(1 + Math.sin(t * 50) * 0.25); if (Math.random() < dt * 70) emettre(FX_VIF, 3, { x: Pf.x, y: Pf.y, z: Pf.z, r: 0.1, dv: 4.5, vie: [0.2, 0.45], taille: [0.16, 0.03], c: ['#fff4d0', '#ff8a3a', '#e2413a'], grav: 6, etire: 0.03 }); } else impact.visible = false; /* (il bute sur un abri : une gerbe d'etincelles) */
      if (Math.random() < dt * 60) { const u = 0.5 + Math.random() * Math.min(Lr, 16); emettre(FX_VIF, 1, { x: O.x + dx * u, y: O.y + (Pf.y - O.y) * u / Lr, z: O.z + dz * u, r: 0.08, v: [dx * 22, 0, dz * 22], dv: 0.3, vie: [0.12, 0.2], taille: [0.2, 0.05], c: ['#ffffff', '#ffb04a'], etire: 0.05 }); } /* (des traits de lumiere filent dans le rayon) */
      if (Math.random() < dt * 45) { const u = 2.5 + Math.random() * Math.min(Lr - 2.5, 14), gx = O.x + dx * u, gz = O.z + dz * u, gy = solA(gx, gz); if (Lr > 3) { emettre(FX_VIF, 2, { x: gx, y: gy + 0.1, z: gz, r: 0.2, v: [0, 1.8, 0], dv: 0.9, vie: [0.35, 0.7], taille: [0.14, 0.03], c: ['#ffd27a', '#ff6a2a', '#c8241a'], grav: -1 });
        emettre(FX_FUM, 1, { x: gx, y: gy + 0.04, z: gz, r: 0.1, plat: true, v: [0, 0, 0], vie: [1.6, 2.4], taille: [0.7, 1.1], c: ['#2a160c', '#1a0e08'], a: 0.55, frein: 0 }); } } /* (le sol brule et noircit sous le rayon) */
      if ((fb += dt) > 0.11) { fb = 0; flashLumiere(O.x, O.y, O.z, '#ff3a22', 5, 14, 0.18); if (impact.visible) flashLumiere(Pf.x, Pf.y + 0.5, Pf.z, '#ffa040', 3, 8, 0.15); secousse(0.1, 0.15); voileLaser(0.75 + Math.sin(t * 18) * 0.25); }
      if (prev != null) { let d = ang - prev; d = Math.atan2(Math.sin(d), Math.cos(d)); const ap = Math.atan2(pp.x - O.x, pp.z - O.z); let e = (ap - prev) * Math.sign(d || 1); e = ((e % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (Math.abs(d) > 1e-4 && e <= Math.abs(d) && cum - dernier > Math.PI) { dernier = cum; const dp = Math.hypot(pp.x - O.x, pp.z - O.z), abri = rayonObstacle(O.x, O.z, Math.sin(ap), Math.cos(ap), dp, obs) < dp - 0.15, q = pp.clone(); q.y += 2;
          if (!abri) { blesserPerso(Math.max(1, Math.round(degSort(mo) * RG.x)), mo); flashLumiere(pp.x, pp.y + 1, pp.z, '#ff3a22', 5, 7, 0.35); emettre(FX_VIF, 16, { x: pp.x, y: pp.y + 1, z: pp.z, r: 0.2, dv: 4, vie: [0.25, 0.5], taille: [0.16, 0.03], c: ['#fff4d0', '#ff6a2a'], grav: 5, etire: 0.03 }); chiffre('Rayon !', q, 'perso'); }
          else chiffre('À l\'abri !', q, 'or'); }
        cum += Math.abs(d); }
      prev = ang; if (Math.random() < dt * 12) poussiere(x0, y0, z0, 2, 2.4, '#8a6a48'); return false; }
    /* fin du rayon : il s'eteint en se resserrant */
    if (t < t4) { const k = (t - t3) / (t4 - t3); cacher(); boule.scale.setScalar(1.6 * (1 - k) + 0.01); halo0.scale.setScalar(2.4 * (1 - k) + 0.01); sol0.material.opacity = 0.9 * (1 - k); voileLaser(0); return false; }
    boule.visible = halo0.visible = false;
    /* 4. il arrache ses racines, remonte, bondit tres haut et retombe : le seisme */
    if (t < t5) { const k = (t - t4) / (t5 - t4); mo.hop = -ENF * (1 - k); ombre(mo.hop);
      if (!arrache) { arrache = true; mo.pattesMode = 'arrache'; secousse(0.2, 0.3); if (mo.p8) mo.p8.L.forEach((l) => { if (l.pos) mottes(l.pos.x, solA(l.pos.x, l.pos.z), l.pos.z, 8, 1.2); }); feuillesVolantes(x0, y0 + 1.5, z0, 2, 10); }
      return false; }
    const tm = t - t5, H = SA.H;
    if (!sautLance) { sautLance = true; mottes(x0, y0, z0, 18, 2.2); poussiere(x0, y0, z0, 14, 2.6, '#8a6a48'); onde(x0, y0, z0, 4, '#c8e08a', 0.4, 0.7); if (m0Anim(mo)) geste(mo, 'rugir', true);
      zoneDanger({ mo, x: x0, z: z0, r: SA.R, duree: t6 - t5, effet: (d) => { if (mo.etat !== 'actif') return; const yy = solA(x0, z0);
        seismeBoss({ d: { ombre: mo.d.ombre }, ry: mo.ry }, x0, yy, z0, Math.min(6, SA.R * 0.6)); impactElement('feuille', x0, z0, SA.R * 0.7); secousse(0.6, 0.9); onde(x0, yy, z0, SA.R * 1.05, '#ffb26a', 0.7, 0.9); onde(x0, yy, z0, SA.R * 0.6, '#7a5a3a', 0.9, 0.7, true);
        const p2 = paysanMesh.position, dp = Math.hypot(p2.x - x0, p2.z - z0); if (dansDanger(d, p2.x, p2.z) && combat === c0 && !c0.fin) { const kl = 1 - 0.8 * Math.min(1, dp / SA.R); blesserPerso(Math.max(1, Math.round(degSort(mo) * SA.x * kl)), mo); } } }); }
    mo.pattesMode = tm < SA.monte + APEX + SA.chute - 0.03 ? 'saut' : null; /* (repliees en l'air, au sol a l'atterrissage) */
    if (tm < SA.monte) { const k = tm / SA.monte; mo.hop = H * (1 - (1 - k) * (1 - k)); }
    else if (tm < SA.monte + APEX) mo.hop = H;
    else { const k = Math.min(1, (tm - SA.monte - APEX) / SA.chute); mo.hop = H * (1 - k * k); }
    ombre(mo.hop); return false; });
}
/* LES HUIT PATTES DU CHENE MOU (09/11/2026, « il devrait avoir 8 pattes, un peu comme une araignee, mais ca reste un arbre ; il reste exactement comme il est,
   il lui manque juste des pattes devant et derriere, et c'est ces pattes-la qui se plantent dans le sol », Mathieu). Huit pattes de bois faites ici, accrochees
   au modele : la cuisse monte du bas du tronc, le genou en l'air, le bas de la patte redescend en pointe de racine. Elles marchent pas a pas comme celles
   d'une araignee : chaque pied reste pose au sol et ne repart que quand le corps s'en est eloigne, quatre pattes a la fois en alternance (les deux groupes
   ne se levent jamais ensemble). Le genou se place tout seul (deux segments, la loi des cosinus). Ses deux petites racines d'origine sont rentrees sous le tronc.
   mo.pattesMode : 'plante' (les pieds s'enfoncent dans le sol), 'vrille' (plantees, elles tournent avec lui et labourent), 'saut' (repliees sous lui). */
const PATTES8 = { hanche: 0.95, hy: 0.75, pied: 3.0, L1: 1.55, L2: 2.25, seuil: 0.75, pas: 0.24, haut: 0.7,
  angles: [0.44, -0.44, 1.13, -1.13, 2.01, -2.01, 2.7, -2.7], groupes: [0, 1, 1, 0, 0, 1, 1, 0] }; /* (devant, puis vers l'arriere, a gauche et a droite ; les bras sont a +-90 degres) */
let TEX_ECORCE = null;
/* (09/11/2026, « des pattes en arbre : tu gardes le style et la forme, mais version bois, plus epaisses ; la ca fait trop arachnoide », Mathieu) : une ecorce
   brune a sillons, des reliefs, des noeuds et de la mousse ; des segments epais aux sillons tordus et bosseles, un gros noeud au genou, la base evasee contre
   le tronc, et au bout trois petites racines qui s'etalent sur le sol au lieu d'une pointe */
function texEcorce() {
  if (TEX_ECORCE) return TEX_ECORCE; const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256; const x = cv.getContext('2d');
  x.fillStyle = '#5a412c'; x.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 40; i++) { x.fillStyle = i % 2 ? '#74563a' : '#4a3424'; x.fillRect(Math.random() * 128, Math.random() * 256, 2 + Math.random() * 4, 10 + Math.random() * 30); } /* (les reliefs de l'ecorce) */
  for (let i = 0; i < 14; i++) { const cx = (i + Math.random() * 0.5) / 14 * 128; x.strokeStyle = '#2f2117'; x.lineWidth = 2 + Math.random() * 2.5; x.beginPath(); x.moveTo(cx, 0); for (let y = 16; y <= 256; y += 16) x.lineTo(cx + Math.sin(y * 0.05 + i) * 3, y); x.stroke(); } /* (les sillons) */
  for (let i = 0; i < 6; i++) { x.fillStyle = '#2a1d14'; x.beginPath(); x.ellipse(Math.random() * 128, Math.random() * 256, 4 + Math.random() * 4, 6 + Math.random() * 5, 0, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#7a5a3e'; x.lineWidth = 1.5; x.stroke(); } /* (des noeuds) */
  for (let i = 0; i < 7; i++) { x.fillStyle = i % 2 ? '#5f8a33' : '#7fb04a'; x.beginPath(); x.ellipse(Math.random() * 128, Math.random() * 256, 5 + Math.random() * 8, 6 + Math.random() * 10, 0, 0, Math.PI * 2); x.fill(); } /* (la mousse) */
  const t = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; partager(t); TEX_ECORCE = t; return t;
}
function geoPatte(L, r0, r1, courbe, graine) { /* un segment de bois le long de +Y, de 0 a L, plus fin au bout, arque vers +X, aux sillons tordus et bosseles */
  const g = new T.CylinderGeometry(r1, r0, L, 12, 8, false); g.translate(0, L / 2, 0); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = y / L, x = p.getX(i), z = p.getZ(i), th = Math.atan2(z, x);
    const f = Math.hypot(x, z) < 1e-5 ? 1 : 1 + 0.1 * Math.sin(5 * th + k * 2.2 + graine) + 0.07 * Math.sin(k * 9 + graine * 2) * Math.sin(2 * th + graine);
    p.setX(i, x * f + Math.sin(Math.PI * k) * courbe * L); p.setZ(i, z * f); }
  g.computeVertexNormals(); return g;
}
function geoNoeud(r, graine) { const g = new T.IcosahedronGeometry(r, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const f = 1 + 0.14 * Math.sin(p.getX(i) * 9 + graine) * Math.cos(p.getZ(i) * 7 + p.getY(i) * 5); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * 0.9, p.getZ(i) * f); } g.computeVertexNormals(); return g; }
function creerPattes8(mo) {
  const P = PATTES8, M = new T.MeshToonMaterial({ map: texEcorce(), gradientMap: grad, color: '#ffffff' }), g = new T.Group(); g.name = 'pattes8'; mo.m.add(g);
  const L = P.angles.map((a, i) => { const G1 = geoPatte(P.L1, 0.44, 0.34, 0.06, i * 1.7), G2 = geoPatte(P.L2, 0.34, 0.16, -0.06, i * 2.3 + 1);
    const haut = maille(G1, M, 0.04), bas = maille(G2, M, 0.04), genou = maille(geoNoeud(0.44, i), M, 0.04), base = maille(geoNoeud(0.52, i + 4), M, 0.04);
    for (let r = 0; r < 3; r++) { const rad = maille(new T.ConeGeometry(0.1, 0.7, 6), M, 0.04), piv = new T.Group(); piv.position.y = P.L2 - 0.18; piv.rotation.y = r / 3 * Math.PI * 2 + i; rad.rotation.z = -1.25; rad.position.set(0.3, 0, 0); piv.add(rad); bas.add(piv); } /* (trois petites racines qui s'etalent sur le sol au bout de la patte) */
    const H = new T.Vector3(Math.sin(a) * P.hanche, P.hy, Math.cos(a) * P.hanche); base.position.copy(H); base.scale.set(1, 0.8, 1); /* (la base evasee, contre le tronc) */
    [haut, bas, genou, base].forEach((o) => { sansClic(o); g.add(o); o.traverse((x) => { if (x.isMesh) x.castShadow = true; }); });
    return { a, grp: P.groupes[i], H, out: new T.Vector3(Math.sin(a), 0, Math.cos(a)), haut, bas, genou, pos: null, de: new T.Vector3(), vers: new T.Vector3(), t: -1 }; });
  const os = ['cuisseD', 'cuisseG'].map((n) => mo.m.getObjectByName(n)).filter(Boolean);
  return { g, L, os, prev: null, mode: null };
}
const _p8 = { v: new T.Vector3(), w: new T.Vector3(), K: new T.Vector3(), F: new T.Vector3(), X: new T.Vector3(), Y: new T.Vector3(), Z: new T.Vector3(), M: new T.Matrix4(), inv: new T.Matrix4() };
function poserSegment(o, A, B, indice, L0) { /* le segment o (fait le long de +Y, arque vers +X) de A a B, arque du cote d'indice */
  const { X, Y, Z, M } = _p8; Y.subVectors(B, A); const L = Y.length() || 0.001; Y.multiplyScalar(1 / L);
  X.copy(indice).addScaledVector(Y, -indice.dot(Y)); if (X.lengthSq() < 1e-6) X.set(1, 0, 0); X.normalize(); Z.crossVectors(X, Y);
  M.makeBasis(X, Y, Z); o.quaternion.setFromRotationMatrix(M); o.position.copy(A); o.scale.set(1, L / L0, 1);
}
function majPattes8(mo, dt) {
  const m = mo.m; if (!m) return; const P = PATTES8, S = mo.p8 || (mo.p8 = creerPattes8(mo));
  S.os.forEach((o) => o.scale.setScalar(0.001)); /* (ses deux petites racines d'origine rentrent sous le tronc) */
  const visible = !mo.racine || mo.racine.phase === 'libre'; S.g.visible = visible; if (!visible || mo.etat !== 'actif') { if (!visible) S.L.forEach((l) => { l.pos = null; }); return; }
  m.updateMatrix(); m.matrixWorld.copy(m.matrix); _p8.inv.copy(m.matrixWorld).invert(); /* (le modele est pose directement dans la scene) */
  const mode = mo.pattesMode || null, sc = m.scale.x || 1, x0 = m.position.x, z0 = m.position.z;
  const vit = S.prev ? Math.hypot(x0 - S.prev.x, z0 - S.prev.z) / Math.max(dt, 1e-3) : 0; const dirx = S.prev && vit > 0.05 ? (x0 - S.prev.x) / (vit * Math.max(dt, 1e-3)) : 0, dirz = S.prev && vit > 0.05 ? (z0 - S.prev.z) / (vit * Math.max(dt, 1e-3)) : 0; S.prev = { x: x0, z: z0 };
  const cible = (l, out) => { const r = mode === 'plante' || mode === 'vrille' ? P.pied * 1.08 : P.pied; out.set(Math.sin(l.a) * r, 0, Math.cos(l.a) * r).applyMatrix4(m.matrixWorld); out.y = solA(out.x, out.z) + (mode === 'plante' || mode === 'vrille' ? -0.75 * sc : 0); return out; };
  if (mode !== S.mode) { const ancien = S.mode; S.mode = mode; S.L.forEach((l) => { if (l.pos && mode !== 'saut' && ancien !== 'saut') { l.de.copy(l.pos); l.t = 0; cible(l, l.vers); } if (ancien === 'saut' && l.pos) { cible(l, l.pos); l.t = -1; } }); /* (au changement de mode, chaque pied va a sa nouvelle place ; a l'atterrissage, il est deja au sol) */
    if (ancien === 'saut') S.L.forEach((l) => { poussiere(l.pos.x, l.pos.y, l.pos.z, 3, 0.6, '#8a6a48'); }); }
  const pasD = P.pas * (vit > 2 ? 0.75 : 1), haut = P.haut * sc; let leveA = 0, leveB = 0; S.L.forEach((l) => { if (l.t >= 0) { if (l.grp) leveB++; else leveA++; } });
  S.L.forEach((l) => {
    const T0 = cible(l, _p8.v);
    if (!l.pos) { l.pos = T0.clone(); l.t = -1; }
    if (mode === 'saut') { l.pos.set(Math.sin(l.a) * P.pied * 0.62, -0.9, Math.cos(l.a) * P.pied * 0.62).applyMatrix4(m.matrixWorld); l.t = -1; } /* (en l'air, repliees sous lui) */
    else if (mode === 'vrille') { l.pos.copy(T0); l.t = -1; if (Math.random() < dt * 4) poussiere(T0.x, T0.y + 0.75 * sc, T0.z, 1, 0.5, '#8a6a48'); } /* (plantees, elles tournent avec lui et labourent le sol) */
    else if (l.t >= 0) { l.t += dt / pasD; const k = Math.min(1, l.t), e = k * k * (3 - 2 * k); if (mode == null) cible(l, l.vers).addScaledVector(_p8.w.set(dirx, 0, dirz), Math.min(0.9, vit * 0.12) * sc);
      l.pos.lerpVectors(l.de, l.vers, e); l.pos.y += Math.sin(Math.PI * k) * haut * (mode === 'plante' ? 0.6 : 1);
      if (k >= 1) { l.t = -1; if (mode === 'plante') mottes(l.pos.x, l.pos.y + 0.75 * sc, l.pos.z, 5, 0.8); else if (Math.random() < 0.5) poussiere(l.pos.x, l.pos.y, l.pos.z, 2, 0.4, '#8a6a48'); } }
    else if (mode == null) { const d = Math.hypot(l.pos.x - T0.x, l.pos.z - T0.z), libre = l.grp ? leveA === 0 : leveB === 0;
      if ((d > P.seuil * sc && libre) || d > P.seuil * sc * 2.6) { l.de.copy(l.pos); l.vers.copy(T0); l.t = 0; if (l.grp) leveB++; else leveA++; } } /* (il ne repart que quand le corps s'en est eloigne, et jamais en meme temps que l'autre groupe) */
    /* la patte : la hanche fixe, le pied ou il est, le genou en l'air (loi des cosinus) */
    const H = l.H, F = _p8.F.copy(l.pos).applyMatrix4(_p8.inv), d3 = _p8.w.subVectors(F, H), D0 = d3.length() || 0.001, D = Math.min(P.L1 + P.L2 - 0.02, Math.max(Math.abs(P.L1 - P.L2) + 0.02, D0)); d3.multiplyScalar(1 / D0);
    const indice = _p8.Z.copy(l.out).multiplyScalar(0.55).add(_p8.Y.set(0, 1, 0)), perp = indice.clone().addScaledVector(d3, -indice.dot(d3)).normalize();
    const a = (P.L1 * P.L1 - P.L2 * P.L2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, P.L1 * P.L1 - a * a)), K = _p8.K.copy(H).addScaledVector(d3, a).addScaledVector(perp, h);
    const Fv = F.clone(); if (D0 > D) Fv.copy(H).addScaledVector(d3, D0); /* (trop loin : le bas de la patte s'etire un peu plutot que de decrocher) */
    poserSegment(l.haut, H, K, perp, P.L1); poserSegment(l.bas, K, Fv, l.out, P.L2); l.genou.position.copy(K);
  });
}
/* LE LANCER DE TRONKNYDE (09/11/2026, « il invoque des Tronknydes et il les jette, je trouve ca genial ; il faut des animations rapides, qu'on ait le temps
   d'esquiver mais que ce soit chaud patate », Mathieu) : il attrape un Tronknyde a lui (a moins de LA.R), le hisse au-dessus de sa tete (0,3 s) ; un cercle
   rouge s'annonce sous toi et il le jette en cloche (0,55 s) : dans le cercle, LA.x fois ses sorts et tu es sonne 0,5 s ; le Tronknyde se releve et t'attaque.
   S'il n'en a pas, il en fait sortir un de terre a ses pieds et le jette au tour d'apres (2,5 s). Fiche : lancer: { periode, R, Rz (le cercle), x } */
function capLancer(mo, ctx) {
  const LA = mo.d.lancer, { pp, sortPret } = ctx; if (!LA || mo.ancre || combat.deroute != null || mo.regard || mo.lance) return;
  if (!sortPret('lancerT', LA.periode)) return;
  const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (dP < 2.4 || dP > 16) { mo.lancerT = LA.periode - 0.8; return; } /* (colle a lui, il te frappe plutot) */
  const c0 = combat, dist = (o) => Math.hypot(o.x - mo.x, o.z - mo.z);
  const proie = c0.monstres.filter((o) => o.type === 'tronknyde' && o.etat === 'actif' && !o.attrape && dist(o) < LA.R).sort((a, b) => dist(a) - dist(b))[0];
  if (!proie) { /* il en fait sortir un de terre, a ses pieds */
    if (c0.monstres.filter((o) => o.invoqueur === mo.id && o.etat !== 'mort' && o.type === 'tronknyde').length >= 5) { mo.lancerT = LA.periode - 2; return; }
    mo.lancerT = LA.periode - 2.5; if (m0Anim(mo) && geste(mo, 'coup', true)) { const an = mo.m.userData.anim, a = an.A[an.cour]; if (a) { a.timeScale = a.getClip().duration / 0.6; mo.geste.d = 0.5; } } mo.bloqueT = 0.45;
    const a = mo.ry + (Math.random() < 0.5 ? 1 : -1) * 0.9, q = pointValide(mo.x, mo.z, mo.x + Math.sin(a) * 2.4, mo.z + Math.cos(a) * 2.4); cercleInvocation(q.x, solA(q.x, q.z), q.z, C_FORET);
    let t = 0; effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin) return true; if (t < 0.35) return false; mottes(q.x, solA(q.x, q.z), q.z, 8, 1.1); feuillesVolantes(q.x, solA(q.x, q.z) + 0.3, q.z, 0.6, 5);
      apparaitre('tronknyde', { x: q.x, z: q.z, apres: (o) => { o.invoqueur = mo.id; o.invoque = true; } }); c0.total++; return true; });
    return; }
  mo.lancerT = 0; mo.lance = true; const HISSE = 0.3, VOL = 0.55; mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z); mo.bloqueT = HISSE + 0.45; mo.cd = Math.max(mo.cd || 0, HISSE + 0.5);
  if (m0Anim(mo) && geste(mo, 'sort', true)) { const an = mo.m.userData.anim, a = an.A[an.cour]; if (a) { a.timeScale = a.getClip().duration / (HISSE + 0.45); mo.geste.d = HISSE + 0.35; } } mo.bloqueT = HISSE + 0.45;
  if (!c0.lancerVu) { c0.lancerVu = true; toast(leNom(mo.d) + ' attrape un Tronknyde et te le jette dessus : sors du cercle rouge !', 'alerte'); }
  proie.attrape = true; proie.bloqueT = 9; proie.cd = 9; const x0 = proie.x, z0 = proie.z, H = mo.haut * 1.02; let cible = null, t = 0, xl = 0, zl = 0;
  const lacher = () => { proie.attrape = false; proie.hop = 0; proie.tourne = 0; proie.bloqueT = 0.45; proie.cd = 0.7; mo.lance = false; };
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin) { mo.lance = false; return true; }
    if (proie.etat !== 'actif') { mo.lance = false; return true; } /* (abattu en l'air) */
    if (mo.etat !== 'actif' && !cible) { lacher(); return true; }
    if (t < HISSE) { const k = t / HISSE, e = 1 - (1 - k) * (1 - k); proie.x = x0 + (mo.x - x0) * e; proie.z = z0 + (mo.z - z0) * e; proie.hop = H * e; return false; } /* (il le hisse au-dessus de sa tete) */
    if (!cible) { const p = paysanMesh.position; cible = { x: p.x, z: p.z }; xl = proie.x; zl = proie.z; /* (le cercle part sur toi, la ou tu es) */
      zoneDanger({ mo, x: cible.x, z: cible.z, r: LA.Rz, duree: VOL + 0.12, effet: (d) => { if (proie.etat !== 'actif') return; const y = solA(cible.x, cible.z); secousse(0.2, 0.35); mottes(cible.x, y, cible.z, 12, 1.6); poussiere(cible.x, y, cible.z, 12, 1.8, '#8a6a48'); impactElement('feuille', cible.x, cible.z, LA.Rz);
        const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z) && combat === c0 && !c0.fin) { blesserPerso(Math.max(1, Math.round(degSort(mo) * LA.x)), mo); if (combat && !combat.fin) coller(0.5, 'Sonné !'); } } }); }
    const k = Math.min(1, (t - HISSE - 0.12) / VOL); if (k < 0) return false; /* (un temps, bras leve, puis il le jette) */
    proie.x = xl + (cible.x - xl) * k; proie.z = zl + (cible.z - zl) * k; proie.hop = H * (1 - k) + Math.sin(k * Math.PI) * 2.6; proie.tourne = (proie.tourne || 0) + dt * 16;
    if (k >= 1) { lacher(); return true; } return false; });
}
function capTotems(mo, ctx) { /* il plante ses totems autour de toi : un cercle d'invocation vert a chaque place, ils sortent de terre 0,8 s apres */
  const { pp, sortPret } = ctx, TO = mo.d.totems; if (!TO || combat.deroute != null || !sortPret('totemsT', TO.periode)) return;
  const debout = combat.monstres.filter((o) => o.invoqueur === mo.id && o.d.totem && o.etat !== 'mort').length; if (debout >= TO.n) { mo.totemsT = TO.periode - 3; return; }
  mo.totemsT = 0; mo.bloqueT = 1.1; gesteSort(mo, gesteDe(mo, 'totems', 'rugir'), 0.9);
  if (!combat.totemsVu) { combat.totemsVu = true; toast(leNom(mo.d) + ' plante des totems-masques autour de toi : ils crachent des fléchettes, casse-les !', 'alerte'); }
  else chiffre('Totems !', new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.4, mo.z), 'butin');
  const a0 = Math.random() * Math.PI * 2, C = ['#5fae3a', '#c8f08a', '#3f7a1e'], places = [], c0 = combat;
  for (let k = 0; k < TO.n - debout; k++) { const a = a0 + k / TO.n * Math.PI * 2, p = pointValide(pp.x, pp.z, pp.x + Math.sin(a) * TO.R, pp.z + Math.cos(a) * TO.R); places.push(p); cercleInvocation(p.x, solA(p.x, p.z), p.z, C); }
  let t = 0; effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') return true; if (t < 0.8) return false;
    places.forEach((p) => { const y = solA(p.x, p.z); mottes(p.x, y, p.z, 8, 1.1); feuillesVolantes(p.x, y + 0.3, p.z, 0.6, 6); apparaitre('totemTiki', { x: p.x, z: p.z, apres: (o) => { o.invoqueur = mo.id; o.invoque = true; } }); combat.total++; }); return true; });
}
function capTotem(mo, ctx) { /* un totem te regarde ; son sorcier tombe, il s'effondre */
  if (!mo.d.totem) return; const { pp } = ctx; mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z);
  const inv = combat.monstres.find((o) => o.id === mo.invoqueur); if (!inv || inv.etat === 'mort') { mo.pv = 0; mo.etat = 'mort'; mo.t = 0; mo.barre.remove(); if (combat.cible === mo) combat.cible = null; }
}
function capDanse(mo, ctx) { /* la danse vaudou : des masques tournent autour de lui en montant et descendant, des lueurs vertes ; il court et frappe plus vite */
  const { sortPret } = ctx, D = mo.d.danse; if (!D || combat.deroute != null || !sortPret('danseT', D.periode)) return;
  mo.danseT = 0; mo.bloqueT = 0.9; gesteSort(mo, gesteDe(mo, 'danse', 'rugir'), 0.8);
  if (!combat.danseVu) { combat.danseVu = true; toast(leNom(mo.d) + ' entre dans sa danse vaudou : des masques tournent autour de lui, il court et frappe plus vite !', 'alerte'); }
  else chiffre('Danse vaudou !', new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.4, mo.z), 'butin');
  const c0 = combat, M = []; for (let i = 0; i < D.n; i++) { const q = sansClic(masqueTiki()); q.scale.setScalar(0.05); scene.add(q); M.push(q); }
  mo.danseV = D.vit; let t = 0, tic = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif' || t > D.duree) { mo.danseV = 0; M.forEach((q) => { if (combat === c0) pouf(q.position.x, q.position.y - 0.4, q.position.z, 1.2, '#7fc24f'); jeter(q); }); return true; }
    const y0 = mo.m.position.y, o = Math.min(1, t / 0.3) * Math.min(1, (D.duree - t) / 0.3);
    M.forEach((q, i) => { const a = t * 2.6 + i / M.length * Math.PI * 2, r = 1.5 * (0.6 + 0.4 * o); q.position.set(mo.x + Math.sin(a) * r, y0 + 1.2 + 0.25 * Math.sin(t * 5 + i * 1.3), mo.z + Math.cos(a) * r); q.rotation.y = a; q.scale.setScalar(0.7 * Math.max(0.05, o)); }); /* (ils regardent dehors) */
    if ((tic += dt) > 0.06) { tic = 0; const q = M[Math.floor(Math.random() * M.length)]; emettre(FX_LUM, 1, { x: q.position.x, y: q.position.y, z: q.position.z, r: 0.15, v: [0, 0.6, 0], vie: [0.4, 0.7], taille: [0.12, 0.02], c: ['#e8ffb0', '#7fc24f'] }); }
    return false; });
}
function capMalediction(mo, ctx) { /* la malediction : un masque fantome part de sa tete, vole au-dessus de toi et te suit (un anneau violet sous tes pieds, qui bat de plus en plus
     vite) ; puis il s'arrete : le cercle rouge s'annonce la ou tu etais, le masque tombe en gonflant, et explose (runes violettes, fumee verte, eclats de bois) */
  const { pp, sortPret } = ctx, MA = mo.d.malediction; if (!MA || combat.deroute != null || !sortPret('maledictionT', MA.periode)) return;
  mo.maledictionT = 0; mo.bloqueT = 0.9; mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z); gesteSort(mo, gesteDe(mo, 'malediction', 'rugir'), 0.8);
  if (!combat.maledictionVu) { combat.maledictionVu = true; toast(leNom(mo.d) + ' te maudit : un masque fantôme te suit, puis s\'arrête et tombe. Sors du cercle dès qu\'il s\'arrête, sinon tu es maudit ' + secondes(MA.maudit) + ' sans pouvoir bouger !', 'alerte'); }
  const c0 = combat, q = sansClic(masqueTiki(true)), dg = Math.max(1, Math.round(degSort(mo) * MA.x)), de = new T.Vector3(mo.x, mo.m.position.y + (mo.haut || 2) * 0.9, mo.z), vers = new T.Vector3();
  q.scale.setScalar(0.9); q.position.copy(de); scene.add(q);
  const anneau = new T.Mesh(new T.RingGeometry(0.86, 1, 48), new T.MeshBasicMaterial({ color: '#8a3fc8', transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide })); anneau.rotation.x = -Math.PI / 2; anneau.renderOrder = 3; anneau.raycast = () => {}; scene.add(anneau);
  let t = 0, fx = 0, arret = null;
  effets.push((dt) => { t += dt; const p = paysanMesh.position;
    if (combat !== c0 || c0.fin || (mo.etat !== 'actif' && !arret)) { jeter(q, anneau); return true; }
    if (t < 0.5) { const k = t / 0.5, e = k * k * (3 - 2 * k); vers.set(p.x, p.y + 2.5, p.z); q.position.lerpVectors(de, vers, e); q.position.y += Math.sin(k * Math.PI) * 1.2; } /* (il vole jusqu'au-dessus de toi) */
    else if (t < 0.5 + MA.duree) { const u = t - 0.5, presse = u / MA.duree; q.position.set(p.x + Math.sin(u * 3) * 0.2, p.y + 2.5 + 0.15 * Math.sin(u * 6), p.z);
      anneau.position.set(p.x, solA(p.x, p.z) + 0.06, p.z); anneau.scale.setScalar(MA.R * (1 + 0.07 * Math.sin(u * (8 + 18 * presse)))); anneau.material.opacity = 0.75; } /* (il te suit) */
    else if (!arret) { arret = { x: p.x, z: p.z }; anneau.visible = false;
      zoneDanger({ mo, x: arret.x, z: arret.z, r: MA.R, duree: MA.prepa, couleur: '#8a3fc8', effet: (dz) => { const p2 = paysanMesh.position; if (combat === c0 && !c0.fin && dansDanger(dz, p2.x, p2.z) && blesserPerso(dg, mo) && combat === c0 && !c0.fin && c0.deroute == null) { coller(MA.maudit, 'Maudit !'); envoutement(MA.maudit); } } }); } /* (maudit seulement si le coup touche, 01/11/2026) */
    if (arret) { const u = t - 0.5 - MA.duree, y = solA(arret.x, arret.z), k = Math.min(1, u / MA.prepa); q.position.set(arret.x, y + 2.5 - k * k * 1.7, arret.z); q.scale.setScalar(0.9 * (1 + 0.6 * k)); /* (il tombe en gonflant) */
      if (u >= MA.prepa) { jeter(q, anneau); secousse(0.18, 0.3); impactMagie(arret.x, arret.z, MA.R, '#8a3fc8'); eclatsRoche(arret.x, y + 0.8, arret.z, 10, 0.8, MATS_BOIS);
        emettre(FX_FUM, 14, { x: arret.x, y: y + 0.6, z: arret.z, r: MA.R * 0.5, v: [0, 1.2, 0], dv: 1.2, vie: [0.8, 1.3], taille: [0.6, 1.4], c: ['#9ff0c0', '#5a2f8a'], a: 0.55, frein: 1 }); return true; } }
    q.rotation.y = Math.atan2(camera.position.x - q.position.x, camera.position.z - q.position.z); /* (il te fait face, a l'ecran) */
    if ((fx += dt) > 0.05) { fx = 0; emettre(FX_LUM, 1, { x: q.position.x, y: q.position.y, z: q.position.z, r: 0.25, v: [0, 0.4, 0], vie: [0.4, 0.7], taille: [0.12, 0.02], c: ['#e8ffe0', '#8a3fc8', '#5fe8a0'] }); }
    return false; });
}
/* maudit (« quand le masque te touche, tu es maudit pendant 2 secondes et tu ne peux pas bouger », Mathieu, le meme jour) : colle sur place (il frappe encore),
   trois petits masques fantomes tournent autour de sa tete, un cercle violet bat a ses pieds, des lueurs violettes montent */
function envoutement(duree) {
  const c0 = combat, M = [0, 1, 2].map(() => { const q = sansClic(masqueTiki(true)); q.scale.setScalar(0.7); scene.add(q); return q; }); /* (plus gros : « trop discrets », 01/11/2026) */
  const anneau = new T.Mesh(new T.RingGeometry(0.7, 0.85, 40), new T.MeshBasicMaterial({ color: '#8a3fc8', transparent: true, opacity: 0.8, depthWrite: false, side: T.DoubleSide })); anneau.rotation.x = -Math.PI / 2; anneau.renderOrder = 3; anneau.raycast = () => {}; scene.add(anneau);
  let t = 0, fx = 0; effets.push((dt) => { t += dt; const p = paysanMesh.position;
    if (combat !== c0 || c0.fin || t > duree) { M.forEach((q) => { if (combat === c0) pouf(q.position.x, q.position.y - 0.3, q.position.z, 0.8, '#8a3fc8'); }); jeter(anneau, ...M); return true; }
    const o = Math.min(1, t / 0.2) * Math.min(1, (duree - t) / 0.25); anneau.position.set(p.x, p.y + 0.06, p.z); anneau.scale.setScalar(1 + 0.12 * Math.sin(t * 14)); anneau.material.opacity = 0.8 * o;
    M.forEach((q, i) => { const a = t * 3.2 + i / 3 * Math.PI * 2; q.position.set(p.x + Math.sin(a) * 0.95, p.y + 2.1 + 0.12 * Math.sin(t * 6 + i), p.z + Math.cos(a) * 0.95); q.rotation.y = a; q.scale.setScalar(0.7 * Math.max(0.05, o)); });
    if ((fx += dt) > 0.06) { fx = 0; const a = Math.random() * Math.PI * 2; emettre(FX_LUM, 1, { x: p.x + Math.cos(a) * 0.6, y: p.y + 0.2, z: p.z + Math.sin(a) * 0.6, v: [0, 1.4, 0], vie: [0.5, 0.8], taille: [0.12, 0.02], c: ['#e0c4ff', '#8a3fc8'] }); }
    return false; });
}
/* LE MARTEAU DE MOON (01/11/2026, « fais-lui une attaque marteau de Moon : il lance son marteau, cree une onde de choc, il saute de la ou il est jusqu'a son
   marteau pour le ramasser et ensuite resaute jusqu'a nous avec son marteau en main, dans les deux mains, et il frappe la ou on est ; si on se trouve dans
   l'onde de choc, plus on est proche du point d'impact plus on prend cher », Mathieu) : il arme son marteau au-dessus de sa tete et le jette la ou tu es (le
   cercle s'annonce, plus fonce au centre) ; le marteau tournoie, s'ecrase et reste plante ; il bondit a cote, le ramasse, puis son bond a deux mains sur
   toi (bondMarteau), avec la meme onde. Une onde : tous ses degats au centre, 0,3 au bord */
function degatsOnde(mo, cx, cz, R, x) { const p = paysanMesh.position, d = Math.hypot(p.x - cx, p.z - cz); if (d > R) return 0; return Math.max(1, Math.round(degSort(mo) * x * (0.3 + 0.7 * (1 - d / R)))); }
function capMarteauMoon(mo, ctx) {
  const MM = mo.d.marteauMoon, an = mo.m && mo.m.userData.anim; if (!MM || !an || mo.faible || combat.deroute != null) return;
  const { pp, sortPret } = ctx, dP = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (dP < 3.5 || dP > 14 || !sortPret('marteauMoonT', MM.periode)) return;
  const mart = mo.m.getObjectByName('marteau'); if (!mart) return;
  mo.marteauMoonT = 0; const c0 = combat, C = mo.d.couleurSorts || ['#e2413a', '#ffd0c0', '#8a1a12'], TA = 1.0 / (mo.d.vivacite || 1), TV = 0.55, TJ = 0.85;
  const c = pointValide(mo.x, mo.z, pp.x, pp.z), ry = Math.atan2(c.x - mo.x, c.z - mo.z); recaler(mo, mo.x, mo.z, ry, 0.15);
  mo.bloqueT = Math.max(mo.bloqueT || 0, TA + TV + TJ + 1.2);
  const nom = an.A.coup_1 ? 'coup_1' : piocher(an, 'coup'), imp = ((mo.m.userData.impacts || {})[nom] || [{ t: 0.9 }])[0].t, a = jouerAnim(an, nom, 0.12); a.timeScale = imp / TA; mo.geste = { t: 0, d: TA + 0.25, ts: a.timeScale }; /* (il l'abat au-dessus de sa tete : il le lache au moment ou il tomberait) */
  if (!c0.marteauMoonVu) { c0.marteauMoonVu = true; toast(leNom(mo.d) + ' lance son marteau sur toi : son onde de choc fait plus mal près du centre. Puis il le ramasse et bondit sur toi !', 'alerte'); }
  zoneDanger({ mo, x: c.x, z: c.z, r: MM.R * 0.45, duree: TA + TV, fort: 1.6, effet: () => {} }); /* (le centre, plus fonce : la ou ca fait le plus mal) */
  zoneDanger({ mo, x: c.x, z: c.z, r: MM.R, duree: TA + TV, effet: () => { if (mo.faible) return; const dg = degatsOnde(mo, c.x, c.z, MM.R, MM.x); if (dg && combat === c0 && !c0.fin) blesserPerso(dg, mo); } }); /* (a genoux pendant le lancer : son onde ne frappe plus) */
  let t = 0, vol = null, pose = null, saut = null; const rendre = () => { if (vol) jeter(vol.m); vol = null; mart.visible = true; };
  effets.push((dt) => { t += dt;
    if (combat !== c0 || c0.fin || mo.etat !== 'actif' || mo.faible) { rendre(); return true; }
    if (!vol && pose == null && t >= TA) { /* il le lache : le marteau quitte sa main */
      mart.updateMatrixWorld(true); const m2 = mart.clone(true); mart.matrixWorld.decompose(m2.position, m2.quaternion, m2.scale); m2.traverse((o) => { o.raycast = () => {}; }); scene.add(m2); mart.visible = false;
      vol = { m: m2, de: m2.position.clone(), vers: new T.Vector3(c.x, solA(c.x, c.z) + 0.4, c.z), axe: new T.Vector3(Math.cos(ry), 0, -Math.sin(ry)), t: 0 }; }
    if (vol && pose == null) { vol.t += dt; const k = Math.min(1, vol.t / TV); vol.m.position.lerpVectors(vol.de, vol.vers, k); vol.m.position.y += Math.sin(k * Math.PI) * 3.2; vol.m.rotateOnWorldAxis(vol.axe, dt * 16); /* (il tournoie) */
      if (Math.random() < 0.6) emettre(FX_FUM, 1, { x: vol.m.position.x, y: vol.m.position.y, z: vol.m.position.z, vie: [0.25, 0.4], taille: [0.3, 0.6], c: ['#d8c6a0', '#b8a888'], a: 0.4 });
      if (k >= 1) { pose = t; const y = solA(c.x, c.z), b = new T.Box3().setFromObject(vol.m); vol.m.position.y += y - b.min.y - 0.15; /* (il reste plante dans le sol) */
        impactMarteau(c.x, y, c.z, C); onde(c.x, y, c.z, MM.R * 1.6, C[1], 0.6, 0.7); secousse(0.4, 0.5); } }
    if (pose != null && !saut && t >= pose + 0.3) { /* il bondit le ramasser : il atterrit a cote, de son cote */
      const dx = mo.x - c.x, dz = mo.z - c.z, L = Math.hypot(dx, dz) || 1, f = pointValide(mo.x, mo.z, c.x + dx / L * 1.3, c.z + dz / L * 1.3);
      const ns = an.A.saut_1 ? 'saut_1' : piocher(an, 'bond'), as = jouerAnim(an, ns, 0.1); as.timeScale = as.getClip().duration / (TJ + 0.3); mo.geste = { t: 0, d: TJ + 0.3, ts: as.timeScale };
      mo.ry = Math.atan2(c.x - mo.x, c.z - mo.z); saut = { x0: mo.x, z0: mo.z, x1: f.x, z1: f.z, t: 0 }; }
    if (saut) { saut.t += dt; const k = Math.min(1, Math.max(0, (saut.t - 0.12) / TJ)), e = k * k * (3 - 2 * k); mo.x = saut.x0 + (saut.x1 - saut.x0) * e; mo.z = saut.z0 + (saut.z1 - saut.z0) * e;
      if (saut.t >= TJ + 0.15) { const y = solA(mo.x, mo.z); poussiere(mo.x, y, mo.z, 14, 1.6, '#d8c6a0'); secousse(0.15, 0.25); rendre(); /* il le ramasse */
        let w = 0; effets.push((d2) => { w += d2; if (combat !== c0 || c0.fin || mo.etat !== 'actif' || mo.faible) return true; if (w < 0.3) return false;
          const p = paysanMesh.position; mo.bloqueT = 0; bondMarteau(mo, p.x, p.z, { R: MM.R2, x: MM.xBond }); return true; }); /* (puis il rebondit sur toi, a deux mains) */
        return true; } }
    return false; });
}
/* LES SORTS SELON LA DISTANCE (03/11/2026, « quand tu es au corps a corps et que tu te prends le sort a distance, tu peux pas l'esquiver ; quand tu rentres
   dans le perimetre du boss, il peut plus lancer ses sorts a distance, mais il te fait ses sorts au corps a corps ; il faut un avantage a etre au corps a
   corps », puis « la lance du Chafer, on la voit meme pas la lancer quand on est au cac, tu la prends, t'es mort », Mathieu). Le perimetre : la ou se tient
   un Iop qui le frappe, un peu plus large, et jamais jusqu'a l'Osamodas (3 cases). Dedans, et 0,8 s apres en etre sorti, les sorts « de loin » d'un boss ou
   demi-boss attendent (prets, ils partent des que tu t'eloignes) ; ses sorts au corps a corps se rechargent 30 % plus vite. Cle de la fiche : son minuteur */
const SORTS_LOIN = { racines: 'racinesT', lance: 'lanceT', jet: 'jetT', faille: 'failleT', charge: 'chargeT', bondit: 'bonditT', boomerang: 'boomT', lianes: 'lianesT', lanceVent: 'lanceVT', tornades: 'tornadesT', bourrasque: 'bourrasqueT', appel: 'appelT', boue: 'boueT', marteauMoon: 'marteauMoonT' };
const SORTS_CAC = { seisme: 'seismeT', brassard: 'brassardT', tourbillon: 'tourbillonT' }, LOIN_T = new Set(Object.values(SORTS_LOIN)), CAC_T = new Set(Object.values(SORTS_CAC));
const TRAITS_BOSS = new Set(['distance', 'casse', 'garde', 'ralentit', 'menotte', 'assomme', 'poison', 'soigne', 'protege', 'revit', 'demonte', 'grignote', 'bandit', 'fouisseur']); /* (ce qu'il fait, sans etiquette, en dernier dans sa fiche) */
const cacBoss = (mo) => Math.min(porteeSur(mo, STATS_CLASSE.osa) - 0.5, Math.max(porteeSur(mo, STATS_CLASSE.iop) + 1.8, mo.d.portee * (mo.allonge || 1) + 0.3));
const CAPACITES_AVANT = [capEnracine, capRage, capProtege, capGalvanise];
const CAPACITES = [capTroupe, capInvoque, capGeyser, capGeyserRage, capCharge, capBond, capEnfouit, capLance, capJet, capFaille, capCarapace, capSeisme, capSouffle, capPluie, capBourrasque, capLanceVent, capTornades, capBoomerang, capLianes, capUltime, capCawotteRoyale, capFumee, capAppel, capAuras, capSoin, capBoue, capBain, capBrassard, capTourbillon, capRacines, capSemis, capMalefice, capPierre, capRoulade, capTotems, capTotem, capDanse, capMalediction, capMarteauMoon, capAvale, capTempete, capRegard, capLancer];
/* l'archer tire de loin : une fleche vole jusqu'au perso (ou jusqu'au batiment qu'il vise) ; d'un monstre a squelette, elle part de sa main.
   Le Mage : magie ; le Lanceur : un rocher ; l'Ardoise : une boule de feu ; Jav : une sagaie ; Sarbak : une flechette */
/* LES TIRS DES MONSTRES (refaits le 29/10/2026, « quand un mec te jette un caillou, on est cense voir le caillou partir et te toucher ; il y a pas
   l'impact, il y a rien », Mathieu) : avant, 0,4 s quelle que soit la distance, une fleche de 0,5 de long, aucun effet a l'arrivee des fleches ni de
   la magie. Maintenant chaque tir a sa forme a la bonne taille, sa vitesse (on le suit des yeux), son arc, sa trainee, et un impact sur toi ou sur le
   batiment vise. Les briques sont celles des sorts du perso (22b-effets.js). */
const TIRS = { /* v : vitesse (unites par seconde), arc : hauteur de la courbe (en plus d'une part de la distance), long : il pointe ou il va */
  fleche: { v: 15, arc: 0.3, parD: 0.03, long: true }, flechette: { v: 17, arc: 0.2, parD: 0.02, long: true }, sagaie: { v: 13, arc: 0.5, parD: 0.05, long: true },
  rocher: { v: 9.5, arc: 0.8, parD: 0.12 }, fruit: { v: 10, arc: 0.7, parD: 0.1 }, feu: { v: 11, arc: 0.35, parD: 0.04 }, magie: { v: 12, arc: 0.25, parD: 0.02 }, gland: { v: 10.5, arc: 0.8, parD: 0.1 } }; /* (gland : le Semeur, 05/11/2026) */
/* un gland qui luit (le Semeur, 05/11/2026) : le fruit orange clair, sa cupule brune, une petite queue ; k : sa taille */
function glandVolant(k) { const g = new T.Group(), f = new T.Mesh(new T.SphereGeometry(0.15, 10, 8), new T.MeshBasicMaterial({ color: '#ffb53c' })), cu = new T.Mesh(new T.SphereGeometry(0.165, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('#6e4a26')), q = boite(0.035, 0.09, 0.035, '#5a3a1e');
  f.scale.set(1, 1.3, 1); cu.position.y = 0.05; q.position.y = 0.2; g.add(f, cu, q); g.scale.setScalar(k || 1); return g; }
function projectileMonstre(type, mo) {
  if (type === 'gland') return glandVolant(1.1);
  if (type === 'magie') { const g = new T.Group(), c = new T.Mesh(new T.IcosahedronGeometry(0.2, 1), new T.MeshBasicMaterial({ color: mo.d.couleurMagie || '#5fe0e8' })), b = new T.Mesh(new T.IcosahedronGeometry(0.11, 1), new T.MeshBasicMaterial({ color: '#ffffff' })); g.add(c, b); return g; }
  if (type === 'fruit') return new T.Mesh(new T.SphereGeometry(mo.d.grosFruit ? 0.28 : 0.17, 10, 8), mat(mo.d.fruit));
  if (type === 'rocher') return new T.Mesh(new T.DodecahedronGeometry(0.4, 0), mat('#9a948c'));
  if (type === 'feu') { const g = new T.Group(); g.add(new T.Mesh(new T.IcosahedronGeometry(0.3, 1), new T.MeshBasicMaterial({ color: '#ff7a1e' })), new T.Mesh(new T.IcosahedronGeometry(0.17, 1), new T.MeshBasicMaterial({ color: '#ffe27a' }))); if (mo.d.feuTaille) g.scale.setScalar(mo.d.feuTaille); return g; } /* (feuTaille : les boules de Crocabulia, 31/10/2026) */
  if (type === 'sagaie') return sagaieVolante();
  /* la fleche (et la flechette, plus courte et rouge) : le fut, la pointe, l'empennage ; elle pointe vers +z */
  const fl = type === 'flechette', g = new T.Group(), L = fl ? 0.5 : 0.9, fut = boite(0.05, 0.05, L, fl ? '#e8683a' : '#8a5a30'), pointe = new T.Mesh(new T.ConeGeometry(fl ? 0.06 : 0.08, 0.22, 5), mat('#c9c4b8'));
  pointe.rotation.x = Math.PI / 2; pointe.position.z = L / 2 + 0.08; g.add(fut, pointe);
  if (!fl) [-1, 1].forEach((s) => { const e = boite(0.01, 0.16, 0.2, '#efe6cf'); e.position.set(0, s * 0.05, -L / 2 + 0.1); e.rotation.z = s * 0.5; g.add(e); });
  return g;
}
function traineeTir(type, p, mo) {
  if (type === 'feu') return traineeFleche(p, true);
  if (type === 'magie') { emettre(FX_LUM, 1, { x: p.x, y: p.y, z: p.z, vie: [0.2, 0.3], taille: [0.5, 0.1], c: ['#ffffff', mo.d.couleurMagie || '#5fe0e8'], a: 0.8 }); return; }
  if (type === 'gland') { emettre(FX_LUM, 1, { x: p.x, y: p.y, z: p.z, vie: [0.2, 0.35], taille: [0.5, 0.1], c: ['#fff1a8', '#ff9a2e'], a: 0.75 }); return; }
  if (type === 'rocher' || type === 'fruit') { if (fxAlea() < 0.5) emettre(FX_FUM, 1, { x: p.x, y: p.y, z: p.z, vie: [0.3, 0.45], taille: [0.25, 0.45], c: type === 'rocher' ? ['#c9b28a', '#d8c6a0'] : [mo.d.fruit, '#ffffff'], a: 0.4 }); return; }
  traineeFleche(p);
}
function impactTir(type, p, mo, perso) {
  const y = solA(p.x, p.z);
  if (type === 'feu') { boule(p.x, p.y, p.z, 0.55 * (mo.d.feuTaille || 1), ['#ff9a2e', '#e8541e']); if (mo.d.boss && mo.d.element === 'feu') impactFeu(p.x, p.z, 1.0); return; } /* (Crocabulia : ses boules de feu brulent le sol, 01/11/2026) */
  if (type === 'magie') { etoileImpact(p, 0.8, mo.d.couleurMagie || '#5fe0e8'); onde(p.x, y, p.z, 1.4, mo.d.couleurMagie || '#5fe0e8', 0.35, 0.7); return; }
  if (type === 'gland') { pouf(p.x, y, p.z, 1.2, '#ffb53c'); emettre(FX_VIF, 12, { x: p.x, y: p.y, z: p.z, r: 0.1, dv: 4, haut: true, vie: [0.3, 0.5], taille: [0.12, 0.04], c: ['#fff1a8', '#ff9a2e', '#c8641e'], grav: 8, frein: 1.5 }); poussiere(p.x, y, p.z, 4, 0.5, '#8a6a44'); return; }
  if (type === 'rocher') { pouf(p.x, y, p.z, 1.8, '#9a948c'); poussiere(p.x, y, p.z, 8, 0.8, '#d8c6a0'); mottes(p.x, y, p.z, 5, 0.6); if (perso) secousse(0.08, 0.18); return; }
  if (type === 'fruit') { pouf(p.x, y, p.z, 1.4, mo.d.fruit); emettre(FX_VIF, 10, { x: p.x, y: p.y, z: p.z, r: 0.1, dv: 4, haut: true, vie: [0.25, 0.45], taille: [0.12, 0.04], c: ['#ffffff', mo.d.fruit], grav: 9, frein: 1.5 }); return; }
  etoileImpact(p, type === 'sagaie' ? 0.9 : 0.65); poussiere(p.x, y, p.z, 4, 0.4);
}
function tirMonstre(mo, bat) {
  const main = mainSquelette(mo), type = mo.d.magie ? 'magie' : TIRS[mo.d.projectile] ? mo.d.projectile : 'fleche', T0 = TIRS[type];
  const de = main || new T.Vector3(mo.x, mo.m.position.y + Math.max(1.0, (mo.haut || 1.6) * 0.6), mo.z), vers = bat ? new T.Vector3(bat.x, bat.y + 1.0, bat.z) : paysanMesh.position.clone(); if (!bat) vers.y += 0.9; const deg = mo.deg * (bat ? 1 : autoBoss(mo)), cleB = bat && bat.cle, c0 = combat; /* (le tir de Crocabulia : une auto de boss, 07/11/2026) */
  const fl = projectileMonstre(type, mo); scene.add(fl); fl.position.copy(de); fl.lookAt(vers);
  if (T0.long) decocher(de, vers); else pouf(de.x, de.y - 0.3, de.z, 0.7, type === 'feu' ? '#ff9a2e' : '#d8c6a0');
  const dist = de.distanceTo(vers), duree = Math.min(0.9, Math.max(0.3, dist / T0.v)), H = T0.arc + dist * T0.parD, avant = new T.Vector3(); let t = 0;
  effets.push((dt2) => { t += dt2 / duree; const k = Math.min(1, t); avant.copy(fl.position);
    fl.position.lerpVectors(de, vers, k); fl.position.y += Math.sin(k * Math.PI) * H;
    if (T0.long) { if (fl.position.distanceToSquared(avant) > 1e-6) fl.lookAt(fl.position.clone().multiplyScalar(2).sub(avant)); } else { fl.rotation.x += dt2 * 9; fl.rotation.y += dt2 * 6; } /* (une fleche suit sa courbe, un caillou tourne sur lui-meme) */
    traineeTir(type, fl.position, mo);
    if (t >= 1) { jeter(fl); impactTir(type, vers, mo, !cleB); if (combat === c0 && !c0.fin) { if (cleB) blesserBat(cleB, degatsBatiment(mo.d.cadence, mo)); else { blesserPerso(deg); effetsCoup(mo); } } return true; } }); /* (le combat fini, le tir ne touche plus rien) */
}
const sagaieVolante = () => { const g = new T.Group(), h = boite(0.05, 0.05, 1.3, '#8a5a30'), p = new T.Mesh(new T.ConeGeometry(0.07, 0.24, 5), mat('#a8a294')); p.rotation.x = Math.PI / 2; p.position.z = 0.75; g.add(h, p); return g; };
/* la mort d'un monstre qui vole en battant des ailes (31/10/2026, « animation de sa mort pas top », Mathieu : Crocabulia tournait sur elle-meme en
   retrecissant) : ses ailes se crispent vers le haut, elle se cabre ; puis elles retombent, molles, et elle chute en roulant sur le flanc, une
   trainee de fumee et de braises derriere elle ; elle s'ecrase dans la poussiere (secousse, onde, braises), rebondit un peu, reste au sol,
   puis s'enfonce dedans. Le combat attend qu'elle ait touche le sol (23-fin-combat.js) */
function mortVolante(mo, dt) {
  const m = mo.m, M = mo.mort || (mo.mort = { t: 0, y0: m.position.y, sol: hauteurSol(mo.x, mo.z, caseIci(mo.x, mo.z)), cote: Math.random() < 0.5 ? -1 : 1, rx0: m.rotation.x, rz0: m.rotation.z, fx: 0 });
  M.t += dt; const t = M.t, A = mo.ailes || [m.getObjectByName('aile_pivot_G'), m.getObjectByName('aile_pivot_D')], lis = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
  const chute = Math.max(0, Math.min(1, (t - 0.3) / 0.7)), crispe = lis(t / 0.15) * (1 - lis((t - 0.3) / 0.35));
  const th = 0.75 * crispe - 0.7 * lis((t - 0.3) / 0.6); /* (crispees vers le haut, puis molles et pendantes) */
  if (A[0]) A[0].rotation.set(0, 0, -(th - (M.cote < 0 ? 0.25 : 0) * chute)); if (A[1]) A[1].rotation.set(0, 0, th - (M.cote > 0 ? 0.25 : 0) * chute); /* (celle du cote ou elle tombe se froisse un peu plus) */
  let y = M.y0 + 0.18 * Math.sin(Math.min(1, t / 0.3) * Math.PI) - (M.y0 - M.sol) * chute * chute; /* (un sursaut, puis la chute qui accelere) */
  if (t > 1 && t < 1.3) y = M.sol + 0.22 * Math.sin((t - 1) / 0.3 * Math.PI); else if (t >= 1.3) y = M.sol; if (t > 2.2) y = M.sol - (t - 2.2) * 1.3; /* (le rebond, puis elle s'enfonce) */
  m.position.y = y; m.rotation.z = M.rz0 + M.cote * 1.05 * lis((t - 0.3) / 0.8); m.rotation.x = M.rx0 - 0.25 * crispe + 0.3 * lis((t - 0.3) / 0.7);
  if (mo.ombreM) { mo.ombreM.position.y = 0.03 - Math.max(0, y - M.sol); mo.ombreM.visible = t < 1; }
  if (t > 0.3 && t < 1 && (M.fx += dt) > 0.05) { M.fx = 0; const p = m.position; emettre(FX_FUM, 2, { x: p.x, y: y + 1.6, z: p.z, r: 0.6, v: [0, 1, 0], vie: [0.6, 1], taille: [0.6, 1.6], c: ['#4a3a32', '#7a706a'], a: 0.5, frein: 1, vrot: 1, entree: 0.1 });
    emettre(FX_VIF, 3, { x: p.x, y: y + 1.6, z: p.z, r: 0.8, v: [0, 1.5, 0], dv: 1, vie: [0.4, 0.7], taille: [0.1, 0.03], c: ['#ffd27a', '#ff6a1e'], a: 1, frein: 1 }); }
  if (t >= 1 && !M.choc) { M.choc = true; const x = mo.x, z = mo.z; secousse(0.28, 0.4); pouf(x, M.sol, z, 6, '#8e7a5e'); poussiere(x, M.sol, z, 22, 2.4, '#d8c6a0'); onde(x, M.sol, z, 6, '#ffb26a', 0.5, 0.7); mottes(x, M.sol, z, 10, 1.6);
    emettre(FX_VIF, 30, { x, y: M.sol + 0.6, z, r: 1.4, dv: 5, haut: true, vie: [0.4, 0.9], taille: [0.12, 0.03], c: ['#fff1a8', '#ff8a1e', '#c8302e'], grav: 6, frein: 1.4, etire: 0.03 }); }
  if (t > 3.4 && m.parent) jeter(m);
}
/* LA MORT D'UN BOSS (01/11/2026, « une vraie chute pour chacun », au lieu de tourner sur lui-meme en retrecissant comme un petit monstre) : il vacille,
   secoue de ses derniers spasmes, puis bascule de tout son poids (sur le flanc, en avant ou en arriere : chute de sa fiche), de plus en plus vite ; il
   s'ecrase (l'ecran tremble, la poussiere : ni l'impact de son element ni anneau, « juste il meurt », Mathieu), rebondit un peu, un dernier soubresaut.
   (« et le fais pas disparaitre en s'enfoncant dans le sol », Mathieu, le meme jour : son corps reste couche jusqu'a la fin du combat ; a
   l'Arene, il se dissipe en poussiere quand la vague suivante arrive, sinon ils s'entasseraient.) Ceux de pierre (chute: 'eclats') se fendent, des eclats
   se detachent d'eux. Plus il est grand, plus c'est lent. Le combat attend qu'il soit a terre (attente, 23-fin-combat.js) */
const CHUTES = { flanc: 1.45, avant: 1.38, arriere: 1.32, eclats: 1.38 };
/* le bas de son corps tel qu'il est tourne, pris sur les sommets de ses pieces (pas sa boite) en laissant de cote les 2 % les plus bas : une pointe
   d'epee, un manche de hache, le bord d'un chapeau peuvent entrer dans le sol, sinon il retombe appuye dessus, couche en l'air (le Chafer, le Bworker,
   le Wa Wabbit, 01/11/2026 ; leurs pieces sont fusionnees, on ne peut pas les reconnaitre a leur nom) ; sans son ombre ni sa sphere de clic invisible */
const V_BAS = new T.Vector3();
function basCorps(mo) {
  const L = []; mo.m.updateMatrixWorld(true);
  mo.m.traverse((o) => { if (!o.isMesh || o === mo.ombreM || !o.visible || !o.geometry || !o.geometry.attributes.position || (o.material && o.material.visible === false)) return;
    const P = o.geometry.attributes.position, n = P.count, pas = Math.max(1, Math.floor(n / 1500));
    for (let i = 0; i < n; i += pas) { V_BAS.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); L.push(V_BAS.y); } });
  if (!L.length) return Infinity; L.sort((a, b) => a - b); return L[Math.floor(L.length * (mo.d.basCorps || 0.02))]; /* (basCorps : plus pour un grand chapeau) */
}
function mortLourde(mo, dt) {
  const m = mo.m; let M = mo.mort;
  if (!M) { const r0 = m.rotation.clone(); m.rotation.set(0, 0, 0); m.updateMatrixWorld(true); const bx = new T.Box3();
    m.traverse((o) => { if (o.isMesh && o !== mo.ombreM && o.visible) bx.expandByObject(o); }); const sz = bx.getSize(new T.Vector3()); m.rotation.copy(r0); m.rotation.order = 'YXZ'; /* (sa taille, de face ; puis le tangage dans son repere a lui) */
    const ch = mo.d.chute || 'flanc', h = sz.y || mo.haut || 3, k = Math.max(0.85, Math.min(1.4, h / 3));
    M = mo.mort = { t: 0, ch, k, h, A: CHUTES[ch] || 1.4, cote: Math.random() < 0.5 ? -1 : 1, y0: m.position.y, sol: solA(mo.x, mo.z), rx0: m.rotation.x, rz0: m.rotation.z, fx: 0 };
    M.tv = 0.55 * k; M.tc = M.tv + 0.6 * k; M.ts = M.tc + 1.1 * k; M.attente = M.tc + 1.2 + (ch === 'eclats' ? 0.3 : 0); /* (le bilan s'ouvre 0,8 s plus tard : 2 s apres le choc, 01/11/2026) */ corpsInerte(mo);
    const off = h * 0.5, L = ch === 'flanc' ? [-M.cote * off, 0] : [0, ch === 'arriere' ? -off : off]; M.p = versMonde(mo.x, mo.z, m.rotation.y, L[0], L[1]); /* (la ou tombe son corps) */
  }
  M.t += dt; const t = M.t, k = M.k, p = M.p;
  let a = 0, y = M.sol, tr = 0;
  if (t < M.tv) { const u = t / M.tv; tr = 0.07 * (1 - u * 0.5) * Math.sin(t * 38); a = 0.12 * u * u * (3 - 2 * u); y = M.y0 + (M.sol - M.y0) * Math.min(1, u * 2); } /* (il vacille, ses spasmes, il penche deja ; en plein bond, il retombe d'abord) */
  else if (t < M.tc) { const u = (t - M.tv) / (M.tc - M.tv); a = 0.12 + (M.A - 0.12) * u * u; } /* (il bascule de tout son poids, de plus en plus vite) */
  else if (t < M.tc + 0.35 * k) { const u = (t - M.tc) / (0.35 * k); a = M.A - 0.12 * Math.sin(u * Math.PI); y += 0.06 * M.h * Math.sin(u * Math.PI); } /* (le rebond) */
  else { a = M.A; const u = t - M.tc - 0.85 * k; if (u > 0 && u < 0.4) tr = 0.04 * Math.sin(u * 55) * (1 - u / 0.4); } /* (le dernier soubresaut) */
  if (M.ch === 'flanc') { m.rotation.z = M.rz0 + M.cote * a + tr; m.rotation.x = M.rx0; } else { m.rotation.x = M.rx0 + (M.ch === 'arriere' ? -a : a) + tr; m.rotation.z = M.rz0 + tr * 0.6; }
  if (M.yFixe == null) { m.position.y = y; const bas = basCorps(mo), dessus = Math.max(0, M.sol - 0.04 - bas); m.position.y = y + dessus; /* (ce qui touche le sol y reste pose, il ne s'y enfonce pas en basculant) */
    if (t > M.tc + 0.85 * k + 0.45) M.yFixe = m.position.y; } /* (a terre et immobile : on ne recalcule plus) */
  if (t >= M.tc && !M.choc) { M.choc = true; const R = Math.max(2, M.h * 0.65);
    secousse(0.3, 0.5); poussiere(p.x, M.sol, p.z, 22, R, '#d8c6a0'); mottes(p.x, M.sol, p.z, 8, 1.4); /* (« quand un boss meurt, juste il meurt : evite la flaque en dessous et l'espece d'explosion », Mathieu, 01/11/2026 : plus d'impact de son element ni d'anneau) */
    if (mo.ombreM) mo.ombreM.visible = false; }
  if (finCorps(mo, M)) return;
  if (M.ch === 'eclats' && t > M.ts && !M.eclats) { M.eclats = true; const cx = (mo.x + p.x) / 2, cz = (mo.z + p.z) / 2; /* (la pierre se fend, des eclats s'en detachent) */
    secousse(0.12, 0.25); eclatsRoche(cx, M.sol + 0.5, cz, 9, 0.6); poussiere(cx, M.sol, cz, 12, M.h * 0.5, '#b8ab98'); } /* (discret : quelques eclats) */
}
/* son corps ne se clique plus (un clic dessus deplace le perso), et il garde le numero de la vague ou il est tombe */
function corpsInerte(mo) { mo.m.traverse((o) => { o.raycast = () => {}; }); mo.vagueMort = combat && combat.arene ? combat.arene.k : null;
  [mo.halo, mo.epinesC, mo.bulleB, mo.anneauG, mo.bulleP, mo.flamme, mo.givre].forEach((o) => { if (o) o.visible = false; }); } /* (ce qui flottait sur lui s'eteint : la bulle d'os du Chafer restait sur son corps couche, 01/11/2026) */
/* a l'Arene, la vague suivante arrive : son corps se dissipe dans un nuage de poussiere et de ce qui montait de lui */
function finCorps(mo, M) {
  if (!combat || !combat.arene || combat.arene.k === mo.vagueMort || !mo.m.parent) return false;
  const b = new T.Box3().setFromObject(mo.m), q = b.getCenter(new T.Vector3()), r = Math.max(1, b.getSize(new T.Vector3()).length() * 0.3);
  poussiere(q.x, M.sol, q.z, 20, r, '#d8c6a0'); /* (juste de la poussiere) */
  jeter(mo.m); return true;
}
/* (01/11/2026) un boss a squelette : quand son corps touche le sol (ses hanches presque au ras du sol), l'ecran tremble, la poussiere et l'impact de son
   element la ou il tombe ; le combat attend qu'il soit a terre */
function chuteSquelette(mo) {
  const C = mo.chute, H = mo.m.getObjectByName('mixamorigHips'), p = H ? H.getWorldPosition(new T.Vector3()) : new T.Vector3(mo.x, mo.m.position.y + (mo.haut || 2) * 0.5, mo.z), sol = solA(mo.x, mo.z); /* (sans os Mixamo, le Lemurien : on suit la duree de sa chute) */
  if (C.h0 == null) { C.h0 = Math.max(0.3, p.y - sol); mo.mort = { t: 0, attente: C.d + 0.4, sol }; corpsInerte(mo); } mo.mort.t = C.t; if (finCorps(mo, mo.mort) || C.choc) return;
  if ((H && p.y - sol < C.h0 * 0.4) || C.t > C.d * (H ? 0.9 : 0.6)) { C.choc = true; const R = Math.max(2, (mo.haut || 3) * 0.6);
    mo.mort.attente = C.t + 1.2; /* (le bilan 2 s apres le choc) */ if (mo.ombreM) mo.ombreM.visible = false; secousse(0.26, 0.45); poussiere(p.x, sol, p.z, 22, R, '#d8c6a0'); mottes(p.x, sol, p.z, 8, 1.4); }
}
/* LE PARACHUTISTE DE VSA (06/11/2026, « un nouveau monstre VSA a partir du niveau 80, il arrive en etant parachute depuis le ciel », Mathieu) : il saute de haut,
   descend en parachute pres de la grange (derriere les defenses), un cercle rouge au sol montre ou il se pose ; intouchable en l'air ; pose, il plie sa voile */
const HAUT_PARACHUTE = 16, DUREE_PARACHUTE = 4.5;
function pointParachute() {
  const G = S_.cases.filter((c) => c.type === 'grange').map(posCase); if (!G.length) return null;
  const pris = combat.parasPris || (combat.parasPris = []), dG = (q) => Math.min(...G.map((g) => Math.hypot(g.x - q.x, g.z - q.z)));
  const L = S_.cases.filter((c) => PASSABLE[c.type]).map((c) => posCase(c)).filter((q) => { const d = dG(q); return d >= 1.5 * S && d <= 4 * S && !pris.some((p) => Math.hypot(p.x - q.x, p.z - q.z) < 2 * S); });
  const q = L.length ? hasard(L) : null; if (!q) return null; pris.push(q); return { x: q.x + (Math.random() - 0.5) * 0.6, z: q.z + (Math.random() - 0.5) * 0.6 };
}
function voileParachute(h) { /* la voile aux couleurs de VSA (violet et creme), et ses suspentes jusqu'aux epaules */
  const g = new T.Group(), R = 2.1, N = 10, yc = h + 2.0; /* (assez grande pour se voir de loin) */
  for (let i = 0; i < N; i++) { const p = new T.Mesh(new T.SphereGeometry(R, 3, 6, (i / N) * Math.PI * 2, Math.PI * 2 / N, 0, Math.PI * 0.42), new T.MeshToonMaterial({ color: i % 2 ? '#f2e6c8' : '#6a3a9a', gradientMap: grad, side: T.DoubleSide })); p.scale.y = 0.62; p.position.y = yc - R * 0.62 * Math.cos(Math.PI * 0.42); g.add(p); }
  const bord = R * Math.sin(Math.PI * 0.42), corde = new T.MeshBasicMaterial({ color: '#3a2a1a' });
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, A = new T.Vector3(Math.cos(a) * bord, yc - R * 0.62 * Math.cos(Math.PI * 0.42), Math.sin(a) * bord), B = new T.Vector3(Math.cos(a) * 0.18, h * 0.82, Math.sin(a) * 0.12), v = new T.Vector3().subVectors(A, B);
    const l = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, v.length(), 4), corde); l.position.copy(B).addScaledVector(v, 0.5); l.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.clone().normalize()); g.add(l); }
  return g;
}
function equiperParachute(o) {
  const h = o.m.userData.hauteur || 1.7; o.voile = voileParachute(h / (o.m.scale.y || 1)); o.m.add(o.voile);
  const y = solA(o.x, o.z) + 0.07, sol = new T.Group(); /* (le cercle rouge ou il se pose) */
  const disque = new T.Mesh(new T.CircleGeometry(1.1, 28), new T.MeshBasicMaterial({ color: '#d9443a', transparent: true, opacity: 0.22, depthWrite: false })), bord = new T.Mesh(new T.RingGeometry(1.0, 1.15, 32), new T.MeshBasicMaterial({ color: '#ff5a3a', transparent: true, opacity: 0.85, depthWrite: false }));
  [disque, bord].forEach((x) => { x.rotation.x = -Math.PI / 2; x.renderOrder = 3; sol.add(x); }); sol.position.set(o.x, y, o.z); sol.visible = false; scene.add(sol); o.solPara = sol; (combat.solsPara = combat.solsPara || []).push(sol);
}
function majParachute(mo, dt, s) {
  const m = mo.m, dp = mo.dep; mo.t += dt / DUREE_PARACHUTE; const k = Math.max(0, Math.min(1, mo.t)), e = 1 - (1 - k) * (1 - k), libre = 1 - k;
  m.visible = mo.t > 0; if (mo.solPara) { mo.solPara.visible = mo.t > 0; const p = 0.6 + 0.4 * Math.sin(s * 6); mo.solPara.children[1].material.opacity = 0.85 * p; mo.solPara.scale.setScalar(1 + 0.25 * libre); }
  m.position.set(mo.x + Math.sin(s * 1.3 + mo.id) * 0.5 * libre, dp.y + (mo.y - dp.y) * e, mo.z + Math.cos(s * 1.1 + mo.id) * 0.4 * libre); m.rotation.z = Math.sin(s * 1.7 + mo.id) * 0.14 * libre; m.rotation.x = Math.cos(s * 1.4 + mo.id) * 0.08 * libre;
  if (mo.t > 0 && !mo.paraSon) { mo.paraSon = true; if (!combat.paraVu) { combat.paraVu = true; toast('Des parachutistes de VSA tombent du ciel près de ta grange : guette les cercles rouges et cueille-les à l\'atterrissage !', 'alerte'); } }
  if (k < 1) return;
  mo.etat = 'actif'; m.rotation.set(0, mo.ry, 0); m.position.set(mo.x, mo.y, mo.z); pouf(mo.x, mo.y, mo.z, 1.3); poussiere(mo.x, mo.y, mo.z, 8, 0.8, '#d8c6a0');
  if (mo.solPara) { jeter(mo.solPara); mo.solPara = null; }
  if (mo.voile) { const v = mo.voile, w = new T.Vector3(); v.getWorldPosition(w); m.remove(v); v.position.copy(w); v.scale.multiplyScalar(m.scale.x || 1); scene.add(v); mo.voile = null; let t = 0; const c0 = combat;
    effets.push((dt2) => { t += dt2 / 0.9; if (combat !== c0 || t >= 1) { jeter(v); return true; } v.scale.y = Math.max(0.05, (1 - t)) * (m.scale.x || 1); v.position.y -= dt2 * 1.6; v.rotation.z += dt2 * 0.8; v.position.x += dt2 * 0.6; }); } /* (la voile se replie et retombe a cote de lui) */
}
function majMonstre(mo, dt, s) {
  if (!combat || combat.fin) return;
  const m = mo.m;
  if (mo.etat === 'grimpe' && mo.dep && mo.dep.parachute) { majParachute(mo, dt, s); return; } /* (le Parachutiste de VSA descend, 06/11/2026) */
  if (mo.venin && mo.etat === 'actif') { const V = mo.venin; V.t -= dt; V.tic += dt; if (V.tic >= 0.5) { V.tic = 0; blesser(mo, Math.max(1, Math.round(V.dps * 0.5)), false, 'venin'); } if (V.t <= 0) mo.venin = null; } /* (le venin, toutes les 0,5 s) */
  if (mo.etat === 'enfoui') { mo.barre.hidden = true; return; } /* (sous terre : son effet le deplace, capEnfouit) */
  if (mo.etat === 'grimpe' && mo.dep && mo.dep.loin && mo.dep.loin.k < 1) { /* il traverse la friche jusqu'au bord, en marchant (departFriche) */
    const dp = mo.dep, L = dp.loin, vx = dp.x - L.x, vz = dp.z - L.z, D = Math.max(0.1, Math.hypot(vx, vz)), v = Math.max(2, mo.d.vitesse || 2) * 0.9;
    L.k = Math.min(1, L.k + dt * v / D); m.visible = true; m.position.set(L.x + vx * L.k, dp.y, L.z + vz * L.k); m.rotation.y = Math.atan2(vx, vz);
    if (m.userData.anim) majSquelette(mo, v, dt); if (L.k >= 1) mo.t = 0.55; /* (arrive au bord : le petit bond sur la ferme, tout de suite) */
    return;
  }
  if (mo.etat === 'grimpe') { /* il se hisse : remonte de sous le bord, puis un petit saut pour passer la falaise */
    mo.t += dt / 0.9; const k = Math.max(0, Math.min(1, mo.t)), e = k * k * (3 - 2 * k), dp = mo.dep;
    m.position.set(dp.x + (mo.x - dp.x) * Math.max(0, (k - 0.55) / 0.45), dp.y + (mo.y - dp.y) * Math.min(1, e * 1.25) + Math.sin(Math.max(0, (k - 0.55) / 0.45) * Math.PI) * 0.45, dp.z + (mo.z - dp.z) * Math.max(0, (k - 0.55) / 0.45));
    m.rotation.x = dp.friche ? 0 : -0.5 * (1 - Math.min(1, k * 1.6)); m.visible = mo.t > 0;
    if (k >= 1) { mo.etat = 'actif'; m.rotation.x = 0; pouf(mo.x, mo.y, mo.z, 1.2); } return;
  }
  if (mo.d.boss && !mo.invoque) majBarreBoss(mo); /* (les Gorilles appeles par Moon sont des boss : la barre reste a Moon, sinon elle sautait de l'un a l'autre) */
  if (mo.etat === 'mort' && m.userData.anim) { mortSquelette(mo, dt); return; } /* (un monstre a squelette tombe, puis s'enfonce dans le sol) */
  if (mo.etat === 'mort' && mo.d.battements) { mortVolante(mo, dt); return; } /* (Crocabulia : elle tombe du ciel, 31/10/2026) */
  if (mo.etat === 'mort' && mo.d.totem) { if (m.parent) { const y = solA(mo.x, mo.z); eclatsRoche(mo.x, y + 0.6, mo.z, 14, 1.0, MATS_BOIS); feuillesVolantes(mo.x, y + 1.3, mo.z, 0.6, 8); poussiere(mo.x, y, mo.z, 10, 1, '#b8a07a'); jeter(m); } return; } /* (un totem-masque se brise en eclats de bois et en feuilles, 01/11/2026) */
  if (mo.etat === 'mort' && (mo.d.boss || mo.d.demi) && !mo.invoque && mo.pv <= 0) { mortLourde(mo, dt); return; } /* (un boss tombe de tout son poids, 01/11/2026) */
  if (mo.etat === 'mort') { mo.t += dt / 0.35; m.scale.setScalar(Math.max(0.001, 1 - mo.t)); m.rotation.y += dt * 12; if (mo.t >= 1 && m.parent) jeter(m); return; }
  if (mo.d.vole) { majVoleurRaid(mo, dt, s); return; }
  const lent = mo.lent > 0; if (lent) mo.lent -= dt; if (mo.ventT > 0) mo.ventT -= dt; if (mo.maudit > 0) mo.maudit -= dt; /* (maudit : la Fleche maudite du Cra) */ /* (ventT : dans la Tempete de feuilles du Cra, -30 % de vitesse, 09/11/2026) */ mo.cd -= dt * (lent ? 0.5 : 1) * (mo.enrage ? 1.7 : 1) * (mo.galva > 0 ? 1.5 : 1) * (mo.rageM || 1) * (mo.danseV || 1); /* (rageM : la rage de l'ile des boss, il frappe plus vite ; danseV : la danse vaudou du Lemurien Tiki) */ /* gele : il frappe deux fois moins vite ; enrage : bien plus vite */
  if (mo.bloqueT > 0) mo.bloqueT -= dt;
  mo.sautT = mo.sautT == null ? Math.random() * SAUT_RECHARGE * 0.75 : mo.sautT + dt; /* (le premier bond : entre 2 et 8 s apres son arrivee, pas tous en meme temps) */
  const pp = paysanMesh.position, bloque = mo.bloqueT > 0 || !!mo.vise || mo.carapace > 0; let v = 0; /* (un boss qui prepare son sort ne marche pas) */
  const x0f = mo.x, z0f = mo.z; /* (fluide : la marche lissee, apres le deplacement) */
  if (!bloque && !mo.ancre) { /* (ancre : le Chene Mou enracine, 08/11/2026) */
  /* sa cible : un Tofu va picorer une culture tant qu'il en reste a voler, sinon (et pour les autres) c'est le perso */
  let tx, tz, versPerso = true;
  if (mo.d.grignote && !mo.aggro) {
    if (mo.champ && !(mo.champ.type === 'champ' && mo.champ.c && recolte(mo.champ) > 1)) mo.champ = null;
    if (!mo.champ) {
      const libres = S_.cases.filter((c) => c.type === 'champ' && c.c && recolte(c) > 1);
      const gout = (c) => (mo.d.gourmand ? (c.c === 'cawotte' ? 0 : c.c === 'fraise' ? 1 : 2) * 100 : 0); /* le Wabbit : les Cawottes d'abord, puis les Fraises */
      const note = (c) => Math.hypot(posCase(c).x - mo.x, posCase(c).z - mo.z) + 5 * combat.monstres.filter((o) => o !== mo && o.champ === c && o.etat === 'actif').length; /* proche, et peu de monde dessus */
      mo.champ = libres.sort((a, b) => gout(a) - gout(b) || note(a) - note(b))[0] || null;
    }
    if (mo.champ) { const q = posCase(mo.champ), [ox, oz] = [[0, 0], [0.45, 0.25], [-0.4, 0.3], [0.15, -0.45], [-0.35, -0.35]][mo.id % 5]; tx = q.x + ox; tz = q.z + oz; versPerso = false; }
  }
  let bandit = false;
  if (mo.d.bandit && (!mo.aggro || mo.butinK)) { /* le Koalak Farouche : il file a la grange, y vole des kamas, puis repart par ou il est venu */
    const zg = !mo.butinK && zoneBat('grange');
    if (zg) { tx = zg.x; tz = zg.z; versPerso = false; bandit = true; if (Math.hypot(Math.max(0, Math.abs(mo.x - zg.x) - zg.hw), Math.max(0, Math.abs(mo.z - zg.z) - zg.hd)) < 1.3) volerKamas(mo); }
    else if (mo.butinK) { tx = mo.sortie.x; tz = mo.sortie.z; versPerso = false; bandit = true; if (Math.hypot(tx - mo.x, tz - mo.z) < 1.0) { fuiteBandit(mo); return; } }
  }
  let bat = null;
  if (!mo.d.grignote && !bandit) { bat = cibleBatiment(mo, dt); if (bat) { tx = bat.x; tz = bat.z; versPerso = false; } } /* un casseur : direction le batiment */
  if (!versPerso && !bandit && !mo.d.distance && combat.deroute == null && Math.hypot(pp.x - mo.x, pp.z - mo.z) <= mo.d.portee * (mo.allonge || 1)) { versPerso = true; bat = null; } /* passer a sa portee : il te frappe, meme s'il visait un batiment ou une culture */
  if (versPerso) { tx = pp.x; tz = pp.z; } mo.chasse = versPerso;
  const bo = combat.bouture, surBo = !!(bo && bo.m && bo.pv > 0 && versPerso && !mo.d.boss && !mo.d.demi && !mo.d.distance && combat.deroute == null && Math.hypot(bo.x - mo.x, bo.z - mo.z) < RAYON_BOUTURE); if (surBo) { tx = bo.x; tz = bo.z; } /* (LA BOUTURE de l'Osa, 09/11/2026 : a moins de 3 cases du Tronknyde allie, il le prend pour cible au lieu de toi) */
  let recule = false; /* garde : l'incantatrice (la Tortue Corail, 30/10/2026) recule quand le perso l'approche, pour lancer ses sorts de loin */
  if (mo.tientT > 0) mo.tientT -= dt; /* (apres 1,6 s de recul, elle se plante 2,5 s pour tirer : le perso court bien plus vite qu'elle, sinon elle ne ferait que fuir, essai du 30/10) */
  if (versPerso && mo.d.garde && !(mo.bloqueT > 0) && !(mo.tientT > 0)) { const dp = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (dp < mo.d.garde) { /* (dos au mur, elle file de cote : droit devant elle, puis de plus en plus de biais ; essai du 30/10 : arrivee par une herse, elle restait collee au bord) */
    const a0 = Math.atan2(mo.x - pp.x, mo.z - pp.z), L = mo.d.garde + 2.5 - dp;
    for (const da of [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8]) { const f = pointValide(mo.x, mo.z, mo.x + Math.sin(a0 + da) * L, mo.z + Math.cos(a0 + da) * L); if (Math.hypot(f.x - mo.x, f.z - mo.z) > Math.min(1.5, L * 0.6)) { tx = f.x; tz = f.z; recule = true; break; } } } }
  if (recule) { mo.reculT = (mo.reculT || 0) + dt; if (mo.reculT > 1.6) { mo.reculT = 0; mo.tientT = 2.5; recule = false; tx = pp.x; tz = pp.z; } } else if (mo.reculT > 0) mo.reculT = Math.max(0, mo.reculT - dt * 0.5);
  const d = Math.hypot(tx - mo.x, tz - mo.z), portee = recule ? 0.3 : versPerso ? mo.d.portee * (mo.allonge || 1) : bat ? mo.d.portee : 0.3; /* (allonge : le boss colossal de l'ile frappe plus loin, a sa taille) */
  if (versPerso && !surBo && !combat.raid && d > portee + 0.8 && d <= SAUT_PORTEE && mo.sautT >= SAUT_RECHARGE && peutSauter(mo)) sauterSurPerso(mo); /* le bond : a moins de 3 cases, il te saute dessus */
  else if (d > (mo.d.fluide && mo.arrete ? portee + 1 : portee)) { /* (fluide : arretee a sa portee, elle ne repart qu'une case plus loin ; sans ca elle repartait et s'arretait a chaque image) */
    mo.arrete = false;
    const w = prochainPas(mo, tx, tz, dt), dx = w.x - mo.x, dz = w.z - mo.z, L = Math.hypot(dx, dz) || 1;
    v = vitesseMonstre(mo.d) * (lent ? 0.4 : 1) * (mo.galva > 0 ? 1.3 : 1) * (mo.rageM || 1) * (mo.boueV || 1) * (mo.danseV || 1) * (mo.vitM || 1) * (mo.ventT > 0 ? 0.7 : 1); /* (vitM : un boss de l'ile plus rapide, VITESSE_ILE) */ const pas = Math.min(L, v * dt); mo.x += dx / L * pas; mo.z += dz / L * pas; tourner(mo, Math.atan2(dx, dz), dt); mo.picore = 0;
  } else if (versPerso || bat) {
    mo.arrete = true; tourner(mo, Math.atan2(tx - mo.x, tz - mo.z), dt);
    if (mo.cd <= 0 && !(versPerso && !bat && tropPresDuTireur(mo))) { /* (un tireur colle par le perso ne tire pas) */
      mo.cd = mo.d.cadence; mo.frappe = 0.25;
      const frapper = () => { /* (le coup lui-meme ; un monstre a squelette le porte a l'instant de son geste : s'il t'a vu filer, il frappe dans le vide) */
        if (bat && !mo.d.distance) blesserBat(bat.cle, degatsBatiment(mo.d.cadence, mo) * (mo.d.bucheron && /^tour:/.test(bat.cle) ? mo.d.bucheron : 1)); /* il cogne le batiment : un coup, ses degats par seconde de la vague fois l'intervalle entre deux coups (le Forestier : double sur les tours) */
        else if (mo.d.distance) { if (!bat && tropPresDuTireur(mo)) return; tirMonstre(mo, bat); } /* (le perso s'est colle a lui pendant son geste : rien ne part) */
        else if (surBo) { if (combat.bouture === bo && bo.pv > 0 && Math.hypot(bo.x - mo.x, bo.z - mo.z) <= portee + 1.0) blesserBouture(bo, mo.deg * autoBoss(mo)); } /* (le Tronknyde de la Bouture encaisse a ta place) */
        else if (!m.userData.anim || Math.hypot(paysanMesh.position.x - mo.x, paysanMesh.position.z - mo.z) <= portee + 1.0) { blesserPerso(mo.deg * autoBoss(mo), mo); effetsCoup(mo); } }; /* (autoBoss : les autos des boss, 07/11/2026) */
      if ((mo.d.marteau || mo.d.poings) && m.userData.anim && !bat && !(mo.d.coupDirect && (mo.direct = !mo.direct))) coupMarteau(mo); /* (coupDirect : une attaque sur deux, Moon frappe direct, sans cercle, 07/11/2026) */ /* (Moon, et le Gorille roi avec ses poings : le coup tombe a l'impact, 22c-squelettes.js) */
      else if (m.userData.anim) attaqueSquelette(mo, mo.d.distance ? 'tir' : 'coup', frapper); /* (les Kannibouls et les Tortues : a l'instant de leur geste) */
      else if (mo.d.coups && !bat) coupLourd(mo, portee, frapper); /* (le Dragon Cochon : ses trois coups, 01/11/2026) */
      else frapper();
    }
  } else { /* il picore : une recolte volee toutes les 5 s */
    mo.picore += dt;
    if (mo.picore >= 5) { mo.picore = 0.01; const p = mo.champ; p.vole = (p.vole || 0) + 1; rendreCase(p.id);
      { const V = combat.cultures || (combat.cultures = {}), v = V[p.c] || (V[p.c] = { n: 0, par: [] }); v.n++; if (!v.par.includes(mo.type)) v.par.push(mo.type); } /* (pour le bilan : « Cultures perdues ») */ { const q = posCase(p), C = PAR_ID[p.c]; chiffre('-1 ' + C.nom, new T.Vector3(q.x, q.y + 0.9, q.z), 'vol'); pouf(q.x, q.y + 0.2, q.z, 1.1, C.couleur); } toast('Un ' + mo.d.nom + ' ' + (mo.type === 'tofu' ? 'picore' : 'grignote') + ' ton ' + PAR_ID[p.c].nom + ' : 1 récolte de moins !', 'alerte'); }
  }
  }
  if (!combat || combat.fin) return; /* le coup qui vient d'achever le perso a clos la vague */
  if (mo.d.fluide && dt > 0) { /* (31/10/2026, Crocabulia) son pas de l'image devient une vitesse visee ; sa vraie vitesse la rejoint en un quart de seconde : elle accelere, tourne et freine en douceur */
    const vv = mo.vel || (mo.vel = { x: 0, z: 0 }), k = Math.min(1, dt * 4), wx = (mo.x - x0f) / dt, wz = (mo.z - z0f) / dt;
    vv.x += (wx - vv.x) * k; vv.z += (wz - vv.z) * k; mo.x = x0f + vv.x * dt; mo.z = z0f + vv.z * dt; v = Math.hypot(vv.x, vv.z); }
  const ctx = { m, dt, s, pp, bloque };
  for (const cap of CAPACITES_AVANT) { cap(mo, ctx); if (!combat || combat.fin) return; } /* (la rage d'abord : la vitesse des sorts en depend) */
  const vSort = dt * (mo.enrage ? 1.3 : 1) * (combat.difficile ? DUR.sorts : 1) * (mo.rageM || 1); /* enrage, il lance ses sorts plus souvent (et en revanche difficile) */
  const cac = !!mo.d.boss && Math.hypot(pp.x - mo.x, pp.z - mo.z) <= cacBoss(mo); mo.horsCac = cac ? 0 : (mo.horsCac || 0) + dt; const tenu = !!mo.d.boss && mo.horsCac < 0.8; /* (colle a lui : ses sorts de loin attendent, 03/11/2026) */
  const colle = tropPresDuTireur(mo); /* (un tireur colle par le perso : ses sorts attendent, 06/11/2026) */
  const sortPret = (cle, periode) => { if (mo[cle] == null) mo[cle] = periode - 3; if (bloque || mo.bloqueT > 0 || mo.vise || combat.deroute != null) return false; if (colle) { mo[cle] = Math.min(periode, mo[cle] + vSort); return false; } mo[cle] += vSort * (cac && CAC_T.has(cle) ? 1.3 : 1); return mo[cle] >= periode && !(tenu && LOIN_T.has(cle)); }; /* le premier, 3 s apres son arrivee */
  /* (29/10/2026, « il saute sur moi et revient sur sa case de depart », Mathieu) bloque est lu une fois au debut de l'image : le Gorille roi lancait sa
     ruee, son bond et son martelement dans la meme image (tous prets 3 s apres son arrivee), puis la ruee et le bond le deplacaient en meme temps,
     chacun depuis son point de depart. On relit le blocage a chaque sort : un seul a la fois, les autres attendent la fin du premier (le Dragon Cochon aussi) */
  ctx.vSort = vSort; ctx.sortPret = sortPret;
  for (const cap of CAPACITES) { cap(mo, ctx); if (!combat || combat.fin) return; } /* (un sort qui acheve le perso clot le combat) */
  /* ils ne se marchent pas dessus et ne traversent pas le perso */
  if (!mo.d.totem && !mo.d.plante && !mo.ancre && !mo.fixe && !mo.attrape) { /* (un totem est plante : rien ne le pousse, 01/11/2026 ; l'Arbre Collant non plus, ni le Chene Mou enracine, 08/11/2026 ; ni pendant son Regard, ni le monstre qu'il tient, 09/11/2026) */
  combat.monstres.forEach((o) => { if (o === mo || o.etat !== 'actif' || o.attrape) return; /* (09/11/2026, « quand il lance le Tronknyde, ca le fait reculer, le Tronknyde part a l'autre bout de la map », Mathieu : le Tronknyde tenu au-dessus de sa tete etait a son centre, et l'ecart entre monstres repoussait le Chene de 13 cases en 0,3 s) */ const dx = mo.x - o.x, dz = mo.z - o.z, L = Math.hypot(dx, dz), mn = 0.35 * (mo.d.ombre + o.d.ombre); if (L > 0.001 && L < mn) { const k = (mn - L) * 0.5; mo.x += dx / L * k; mo.z += dz / L * k; } });
  { const dx = mo.x - pp.x, dz = mo.z - pp.z, L = Math.hypot(dx, dz), mn = 0.35 + mo.d.ombre * 0.3; if (L > 0.001 && L < mn) { mo.x += dx / L * (mn - L); mo.z += dz / L * (mn - L); } } }
  mo.pas += v * dt * 5; if (m.userData.pattes || m.userData.membres) animerPattes(m, mo.pas * 0.8, Math.min(1, v * 0.7)); /* (les Bouftous des vagues marchent sur leurs pattes) */
  if (mo.queueB && m.userData.queue) m.userData.queue.rotation.y += mo.queueB; /* (le coup de queue du Dragon Cochon, 01/11/2026) */
  if (mo.ailesVite && m.userData.ailes) m.userData.ailes.forEach((a, i) => { if (a) a.rotation.z = (i ? -1 : 1) * (0.2 + mo.ailesVite * 0.6 * Math.sin(s * 34)); }); /* (ses petites ailes battent a toute vitesse pour le porter, son envol) */
  if (mo.d.boss && m.userData.membres) vieBoss(mo, m, v, dt, s); /* (le Dragon Cochon respire, gratte le sol, leve les pattes, 01/11/2026) */
  if (m.userData.anim) majSquelette(mo, v, dt); /* (les monstres a squelette : marche, repos, coup de marteau) */
  const y = hauteurSol(mo.x, mo.z, caseIci(mo.x, mo.z));
  const allure = mo.d.fluide ? Math.min(1, v / Math.max(0.1, vitesseMonstre(mo.d))) : 1; /* (fluide : son balancement suit sa vitesse, il s'eteint quand elle s'arrete) */
  const saut = m.userData.anim || mo.d.battements ? 0 : mo.d.fluide ? (1 - Math.cos(mo.pas * 2)) * 0.03 * allure : mo.d.grignote ? Math.abs(Math.sin(mo.pas)) * (v > 3 ? 0.2 : 0.28) * Math.min(1, v) : mo.d.roule ? Math.abs(Math.sin(mo.pas * 0.8)) * 0.12 * Math.min(1, v) : (1 - Math.cos(mo.pas * 2)) * 0.03;
  let elan = mo.elanB || 0; if (mo.frappe > 0) { mo.frappe -= dt; if (!m.userData.anim) elan += Math.sin((1 - Math.max(0, mo.frappe) / 0.25) * Math.PI) * 0.35; } /* (un monstre a squelette a son propre geste) */
  const pique = mo.picore > 0 ? Math.abs(Math.sin(s * 9)) : 0;
  const bat = mo.d.battements ? (mo.batPh = (mo.batPh || mo.id) + dt * mo.d.battements * Math.PI * 2 * (v > 0.3 ? 1.15 : 1)) : 0; /* (Crocabulia, 31/10/2026 : la phase de ses ailes) */
  if (mo.d.battements) { const A = mo.ailes || (mo.ailes = [m.getObjectByName('aile_pivot_G'), m.getObjectByName('aile_pivot_D')]), th = 0.12 + 0.55 * Math.sin(bat), av = 0.12 * Math.cos(bat);
    if (A[0]) A[0].rotation.set(0, -av, -th); if (A[1]) A[1].rotation.set(0, av, th); m.rotation.order = 'YXZ'; /* (ailes levees quand sin > 0 ; en descendant, elles balaient vers l'avant) */
    if (mo.coupAile) coupDAile(mo, A, dt); }
  const vol = mo.d.vol ? mo.d.vol + (mo.d.battements ? -0.16 * Math.sin(bat) : Math.sin(s * 2.4 + mo.id) * 0.14) : 0; /* (avec des ailes qui battent, le corps monte quand elles s'abaissent) */ if (vol && mo.ombreM) { mo.ombreM.position.y = 0.03 - vol; mo.ombreM.scale.setScalar(mo.d.ombre * (1 - vol * 0.15)); } /* il vole : ses ailes le portent, son ombre reste au sol */
  m.position.set(mo.x + Math.sin(mo.ry) * elan, y + vol + saut + (mo.hop || 0) + (mo.picore > 0 && mo.champ && mo.champ.c ? (etape(mo.champ) === 'mur' ? 0.75 : 0.25) + pique * 0.1 : 0), mo.z + Math.cos(mo.ry) * elan);
  m.rotation.y = mo.ry + (mo.tourne || 0); m.rotation.z = m.userData.anim ? 0 : mo.d.battements ? Math.sin(bat * 0.5) * 0.03 : Math.sin(mo.pas) * 0.07 * allure; /* (un monstre a squelette se dandine dans son animation) */ m.rotation.x = pique * 0.35 + (mo.d.battements ? 0.13 * allure : 0) + (m.userData.anim ? 0 : mo.penche || 0); /* (penche : il baisse la tete pour charger, 31/10/2026) */ /* (en volant vers toi, elle penche le nez) */
  if (mo.d.pattes8) majPattes8(mo, dt); /* (les huit pattes du Chene Mou, 09/11/2026) */
  if (mo.brule > 0) { /* il brule : des degats toutes les demi-secondes, une flamme au-dessus de lui */
    mo.brule -= dt; mo.bruleT = (mo.bruleT || 0) + dt; if (mo.bruleT >= 0.5) { mo.bruleT = 0; blesser(mo, mo.bruleDeg); }
    if (!mo.flamme) { mo.flamme = new T.Mesh(new T.ConeGeometry(0.18, 0.5, 6), new T.MeshBasicMaterial({ color: '#ff7a1e', transparent: true, opacity: 0.85 })); m.add(mo.flamme); }
    mo.flamme.visible = true; mo.flamme.position.set(0, mo.haut - 0.1, 0); mo.flamme.scale.set(1, 0.8 + Math.abs(Math.sin(s * 14)) * 0.5, 1);
  } else if (mo.flamme) mo.flamme.visible = false;
  if (!combat || mo.etat !== 'actif') return;
  if (mo.coup > 0) { mo.coup -= dt; m.scale.setScalar((mo.echelle || 1) * (1 + Math.max(0, mo.coup) * (mo.d.fluide ? 0.25 : 0.9))); } /* (fluide : elle gonfle a peine sous les coups, une fleche du Cra la faisait sursauter a chaque tir) */ else m.scale.setScalar(mo.echelle || 1);
  if (mo.dresse) m.scale.y *= 1 + mo.dresse; if (mo.respire) m.scale.y *= 1 + mo.respire; /* (il respire, vieBoss) */ /* (dresse : il se grandit pour frapper le sol, le seisme du Craqueleur Legendaire, 31/10/2026) */
  if (lent && !mo.givre) { mo.givre = new T.Mesh(new T.RingGeometry(0.3, 0.55, 24), new T.MeshBasicMaterial({ color: '#9fd8ff', transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false })); mo.givre.rotation.x = -Math.PI / 2; mo.givre.position.y = 0.06; mo.givre.scale.setScalar(Math.max(1, mo.d.ombre)); m.add(mo.givre); }
  if (mo.givre) mo.givre.visible = lent;
}
/* la portee du perso sur un monstre : un gros monstre compte sa carrure (trouve le 12/10/2026 en simulant les boss : Crocabulia etait tenue a 1,55 case
   du perso par l'ecartement des corps, l'epee du Iop porte a 1,5, il lui tournait autour sans la toucher) */
const porteeSur = (o, st) => st.portee + Math.max(0, 0.35 + o.d.ombre * 0.3 - 1);
/* le perso : il va vers sa cible (ou le monstre le plus proche) et frappe des qu'il est a portee */
function majPerso(dt) {
  const u = paysanMesh.userData, st = statsPerso(), classe = classeDe();
  combat.cdAttaque -= dt; { const r = dt * (1 + 0.15 * nbBonus('recharge') + (combat.boostRecharge || 0)); /* (+ le Bananagrume mange, 03/11/2026) */ combat.cdSort = Math.max(0, combat.cdSort - r); combat.cdUlti = Math.max(0, combat.cdUlti - r); } /* (le bonus Concentration de l'Arene) */
  if (combat.assomme > 0) return; /* assomme par la pomme d'un Koalak Reinette : il ne frappe plus un instant */
  if (u.charge) return;
  if (combat.ordre) { if (chemin.length) return; combat.ordre = false; }
  if (combat.tenir) { /* il tient la position ou on l'a envoye : il frappe ce qui passe a portee, sans courir apres (toucher un monstre le relance) */
    const pp0 = paysanMesh.position, aPortee = combat.monstres.filter((o) => o.etat === 'actif' && Math.hypot(o.x - pp0.x, o.z - pp0.z) <= porteeSur(o, st)).sort((a, b) => Math.hypot(a.x - pp0.x, a.z - pp0.z) - Math.hypot(b.x - pp0.x, b.z - pp0.z));
    if (!aPortee.length) { if (combat.poursuite) { chemin = []; combat.poursuite = false; } return; }
    if (!combat.cible || combat.cible.etat !== 'actif' || Math.hypot(combat.cible.x - pp0.x, combat.cible.z - pp0.z) > porteeSur(combat.cible, st)) combat.cible = aPortee[0];
  }
  let c = combat.cible; if (!c || c.etat !== 'actif') c = combat.cible = plusProcheMonstre(paysanMesh.position);
  if (!c) { if (combat.poursuite) { chemin = []; combat.poursuite = false; } return; }
  if (condamne(c)) { /* ce qui est en vol va l'achever : le suivant, sans attendre (en tenant la position, seulement un monstre a portee) */
    const p0 = paysanMesh.position, alt = combat.monstres.filter((o) => o.etat === 'actif' && o !== c && !condamne(o) && (!combat.tenir || Math.hypot(o.x - p0.x, o.z - p0.z) <= porteeSur(o, st))).sort((a, b) => Math.hypot(a.x - p0.x, a.z - p0.z) - Math.hypot(b.x - p0.x, b.z - p0.z))[0];
    if (!alt) { if (combat.poursuite) { chemin = []; combat.poursuite = false; } return; } c = alt; }
  const pp = paysanMesh.position, d = Math.hypot(c.x - pp.x, c.z - pp.z);
  if (d > porteeSur(c, st)) {
    const h = combat.heros; h.x = pp.x; h.z = pp.z; const w = pasVersCible(h, c, dt);
    chemin = [{ c: caseIci(w.x, w.z) || u.cellule, x: w.x, z: w.z }]; arrivee = null; combat.poursuite = true; return;
  }
  if (combat.poursuite) { chemin = []; combat.poursuite = false; }
  u.angle = Math.atan2(c.x - pp.x, c.z - pp.z);
  if (combat.cdAttaque <= 0 && !u.attaque) {
    const rage = legPorte('bworker') && combat.pv < combat.pvMax * 0.3; if (rage && !combat.rage) { combat.rage = true; toast('Casque du Bworker : tu entres en rage !', 'alerte'); pouf(pp.x, pp.y, pp.z, 2.5, '#e2413a'); }
    combat.cdAttaque = st.cadence * (rage ? 0.7 : 1); let cible = c; son(classe === 'cra' ? 'arc' : classe === 'osa' ? 'fouet' : 'epee'); /* (l'arme de la classe : l'arc du Cra, le fouet de l'Osamodas, l'epee du Iop) */
    combat.tirs = (combat.tirs || 0) + 1; const feu = classe === 'cra' && combat.tirs % TIR_FEU === 0; /* une fleche de feu toutes les 10 */
    const prevu = { n: degatsPrevus(cible, feu ? st.deg * 2 : st.deg), fin: performance.now() + 2500 }; (cible.prevus = cible.prevus || []).push(prevu); /* (le coup en route, 09/11/2026) */
    u.attaque = { t: 0, classe, base: u.angle, tour: false, surFrappe: () => { if (cible.etat !== 'actif') { /* (09/11/2026, « check s'il n'y a pas des trucs similaires a corriger sur Osa et Iop », Mathieu : la cible tombee pendant l'elan, le coup part sur le plus proche a portee au lieu d'etre perdu) */
      const p0 = paysanMesh.position, alt = combat && combat.monstres.filter((o) => o.etat === 'actif' && Math.hypot(o.x - p0.x, o.z - p0.z) <= porteeSur(o, st) + 0.3).sort((a, b) => (condamne(a) - condamne(b)) || Math.hypot(a.x - p0.x, a.z - p0.z) - Math.hypot(b.x - p0.x, b.z - p0.z))[0];
      { const ip = (cible.prevus || []).indexOf(prevu); if (ip >= 0) cible.prevus.splice(ip, 1); } if (!alt) return; cible = alt; (cible.prevus = cible.prevus || []).push(prevu); u.angle = Math.atan2(cible.x - p0.x, cible.z - p0.z); }
      const p = new T.Vector3(cible.x, cible.m.position.y + cible.haut * 0.5, cible.z); effetFrappe(classe, p, () => { const ip = (cible.prevus || []).indexOf(prevu); if (ip >= 0) cible.prevus.splice(ip, 1); const epines = cible.carapace > 0 && classe !== 'cra', bk = classe === 'iop' && berserkerIop() ? BERSERKER_IOP : 1; blesser(cible, Math.round((feu ? st.deg * 2 : st.deg) * bk), feu); if (classe === 'iop') coupIop(cible, st, bk); /* (bk : le Berserker du Iop, sur ses coups d'epee seulement) */ if (epines && combat && !combat.fin) { blesserPerso(Math.max(1, Math.round(st.deg * 0.2 / multDegats(combat.n))), cible); epinesTouche(cible); } if (!combat || combat.fin) return; if (feu && cible.etat === 'actif') { cible.brule = 3; cible.bruleDeg = Math.max(1, Math.round(st.deg * 0.25)); pouf(cible.x, cible.m.position.y, cible.z, 2, '#ff7a1e'); } }, feu); } };
  }
}
function coupIop(cible, st, bk) { /* le balayage du Iop (18-geliere.js) ; bk : le Berserker, x2 sous 50 % de vie */
  if (!combat || combat.fin || !(BALAYAGE_IOP > 0)) return; let k = 0;
  combat.monstres.slice().forEach((o) => { if (o === cible || o.etat !== 'actif' || Math.hypot(o.x - cible.x, o.z - cible.z) > RAYON_BALAYAGE) return; blesser(o, Math.max(1, Math.round(st.deg * BALAYAGE_IOP * (bk || 1)))); k++; });
  if (k) onde(cible.x, cible.m.position.y + 0.05, cible.z, RAYON_BALAYAGE, '#ffd27a', 0.3, 0.3);
}
/* le sort de classe : Charge (Iop), Fleche percante (Cra), Invocation d'un Bouftou (Osamodas) */
