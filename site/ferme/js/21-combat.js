'use strict';
function boostDegats() { try { return combat && combat.boostDeg ? 1 + combat.boostDeg : 1; } catch (e) { return 1; } } /* la Cawotte mangee avant la vague */
const statsPerso = () => { const st = STATS_CLASSE[classeDe()], l = niveau(S_.xp), c = caracs(); return { pvMax: st.pv(l) + c.vita, deg: Math.round(st.deg(l) * (1 + c.puissance / 100) * boostDegats() * (meuteActive() ? 1 + MEUTE : 1)), cadence: +(st.cadence / (1 + c.agilite / 100)).toFixed(2), /* L'AGILITE (13/10/2026) : X % de coups en plus, et non plus X % de temps en moins entre deux coups (60 d'agilite : 1,6 fois plus de coups, et non 2,5 ; a 100, 2 fois et non infini). Pas de plafond, les objets gardent leurs chiffres */ portee: st.portee, niveau: l, base: { pv: st.pv(l), deg: st.deg(l), cadence: st.cadence }, c }; };
let combat = null;
/* LES CLASSES EN CHIFFRES (22/10/2026) : la fenetre du passage de niveau, la page Perso et le choix du personnage lisent tout ici, d'apres STATS_CLASSE
   (rien n'est recopie a la main : une classe reequilibree s'affiche juste partout) */
const degInvoc = (l) => 6 + 2 * l; /* un coup du Bouftou invoque par l'Osamodas */
/* LA MEUTE, passif de classe de l'Osamodas (23/10/2026, « pour l'Osa fais comme tu veux, on revoit ca plus tard », Mathieu) : tant que son Bouftou
   invoque est en vie, l'Osamodas et son Bouftou font 15 % de degats en plus */
const MEUTE = 0.15, meuteActive = () => !!(combat && combat.invoc && classeDe() === 'osa'), degBouftou = (l) => Math.round(degInvoc(l) * (1 + MEUTE));
const berserkerIop = () => !!(combat && !combat.fin && combat.deroute == null && classeDe() === 'iop' && combat.pv > 0 && combat.pv < combat.pvMax * SEUIL_BERSERKER_IOP); /* le Berserker du Iop (18-geliere.js) */
/* chaque classe en trois lignes : son passif de classe (toujours actif, sans rien faire), son sort (le bouton), le passif de son sort (ce qu'il fait en plus) */
const enBref = (id) => ({ /* (une fonction : VITESSE_CRA n'est defini que plus loin, dans 24-deplacement.js) */
  iop: { passif: ['Peau de Iop : il encaisse ' + Math.round(PEAU_IOP * 100) + ' % de dégâts en moins', 'Régénération : il regagne ' + Math.round(REGEN_IOP * 100) + ' % de sa vie toutes les ' + PAS_REGEN_IOP + ' s en combat', 'Berserker : sous ' + Math.round(SEUIL_BERSERKER_IOP * 100) + ' % de vie, ses coups d\'épée font deux fois plus de dégâts (pas ses sorts)'], /* (une puce par passif, 31/10/2026 : « mets-le en bullet points, pas tout sur une meme ligne » ; le balayage est dans le Coup d'epee, l'invincibilite dans l'ulti, Mathieu) */ sort: 'Bond du Iop : il saute sur un monstre, 3 fois ses dégâts', passifSort: 'il se soigne de 3 % par monstre touché (12 % au plus)' },
  cra: { passif: 'il court ' + Math.round((VITESSE_CRA - 1) * 100) + ' % plus vite, et une flèche sur ' + TIR_FEU + ' fait double dégâts (la cible brûle 3 s)', sort: 'Flèche perçante : toute une ligne de monstres, 3 fois ses dégâts', passifSort: null },
  osa: { passif: 'tant que son Bouftou est en vie, lui et son Bouftou font ' + Math.round(MEUTE * 100) + ' % de dégâts en plus (Meute)', sort: 'Invocation : un Bouftou tombe sur les monstres, 2 fois ses dégâts', passifSort: 'le Bouftou se bat ensuite ' + DUREE_INVOC + ' s à ses côtés : 6 + 2 dégâts par niveau, plus la Meute, un coup toutes les 0,8 s' } })[id];
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
  const bilan = 'Au niveau ' + NIV_MAX + ', le Iop a ' + Math.round((I.pvMax / C.pvMax - 1) * 100) + ' % de PV en plus que le Cra et l\'Osamodas, il encaisse 15 % de dégâts en moins, se régénère en combat, ses coups d\'épée font deux fois plus mal sous 50 % de vie et il devient invincible 3 s à chaque ulti : c\'est ce qui paie le corps à corps. Le Cra frappe presque aussi fort (' + C.degMax + ' contre ' + I.degMax + ') sans se faire toucher. L\'Osamodas frappe moins fort lui-même (' + O.degMax + '), mais son Bouftou ajoute ses coups aux siens (' + degBouftou(NIV_MAX) + ' par coup au niveau ' + NIV_MAX + ', selon le seul niveau : l\'équipement ne les change pas), et tant qu\'il est en vie, la Meute leur donne 15 % de dégâts en plus à tous les deux. Pour le reste, l\'équipement compte autant que la classe.';
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
  repas.forEach((id) => { const m = PAR_ID[id].mange; if (m.deg) combat.boostDeg = (combat.boostDeg || 0) + m.deg; if (m.pros) combat.boostPros = (combat.boostPros || 0) + m.pros; (combat.repasActifs = combat.repasActifs || {})[id] = true; });
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
  (c.fumees || []).forEach((f) => jeter(f.g)); /* (les nuages du Koulosse se dissipent) */
  if (c.invoc) jeter(c.invoc.m);
  combat = null; ANNEAU.visible = false; annulerVisee(); chemin = []; arrivee = null; const u = paysanMesh.userData; u.attaque = null; if (releve) { u.charge = false; paysanMesh.rotation.x = 0; } $('b-fuir').hidden = false;
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
/* l'anneau jaune sous le monstre cible */
const ANNEAU = new T.Mesh(new T.RingGeometry(0.5, 0.64, 32), new T.MeshBasicMaterial({ color: '#f2b630', transparent: true, opacity: 0.95, side: T.DoubleSide, depthWrite: false }));
partager(ANNEAU);
ANNEAU.rotation.x = -Math.PI / 2; ANNEAU.renderOrder = 2; ANNEAU.visible = false; scene.add(ANNEAU);

function ouvrirVagues() {
  const fini = S_.vague.num > VAGUES_TOTAL, n = vagueCourante(), P = palierDe(n), base = P * VAGUES_PALIER, B = MONSTRES[PALIERS[P].boss], st = statsPerso(), cl = CLASSES.find((c) => c.id === classeDe()), g = gainsVague(n, fini), repos = S_.vague.repos - Date.now();
  const piste = Array.from({ length: VAGUES_PALIER - 1 }, (_, k) => { const v = base + k + 1; return '<i class="' + (v < S_.vague.num ? 'fait' : v === n ? 'ici' : '') + '">' + v + '</i>'; }).join('') + '<img class="' + (fini || S_.vague.num > base + VAGUES_PALIER ? 'fait' : n === base + VAGUES_PALIER ? 'ici' : '') + '" src="assets/icones/' + PALIERS[P].icone + '.png" alt="' + B.nom + '" data-info="' + B.nom + '">';
  /* chaque monstre : ses PV, ses degats, et combien de coups il te faut pour l'abattre */
  completerBestiaire(); const vusB = bestiaire(); /* (chaque monstre : une pastille a toucher, sa fiche s'ouvre ; « Nouveau ! » s'il n'a jamais ete croise) */
  const monstres = compoTotale(n).map(([t, k]) => { const M = MONSTRES[t], pv = pvMonstre(t, n), coups = Math.ceil(pv / st.deg), neuf = !vusB[t];
    return '<button class="vg-monstre' + (M.boss ? ' boss' : '') + (neuf ? ' neuf' : '') + '" data-fiche-monstre="' + t + '" data-info="Sa fiche">' + (neuf ? '<em class="vg-neuf">Nouveau !</em>' : '') + '<img src="assets/icones/' + M.icone + '.png" alt=""><b>× ' + k + '</b><small>' + M.nom + '</small><div class="vg-stats"><span class="puce">' + picto('vita') + fmt(pv) + '</span><span class="puce">' + picto('degats') + Math.round(degMonstre(t, n) * multDegats(n)) + '</span><span class="puce ' + (coups <= 1 ? 'bonne' : coups >= 6 ? 'mauvaise' : '') + '">' + coups + ' coup' + (coups > 1 ? 's' : '') + '</span></div><span class="vg-fiche">' + picto('livre') + 'Sa fiche</span></button>'; }).join('');
  const ok = st.niveau >= n;
  const perso = '<div class="art">' + ico(classeDe()) + '<div><b>' + cl.nom + ' niveau ' + st.niveau + '</b><div class="puces"><span class="puce">' + picto('vita') + st.pvMax + ' PV</span><span class="puce">' + picto('degats') + st.deg + ' toutes les ' + String(st.cadence).replace('.', ',') + ' s</span><span class="puce">Sort : ' + cl.sort + (classeDe() === 'cra' ? ' (recharge ' + RECHARGE_PERCANTE + ' s)' : '') + '</span>' + (classeDe() === 'cra' ? '<span class="puce">' + picto('rage') + '1 tir sur ' + TIR_FEU + ' en feu</span>' : '') + '<span class="puce ' + (st.niveau >= niveauRequis(n) ? 'bonne' : 'mauvaise') + '">Niveau requis ' + niveauRequis(n) + '</span></div><div class="desc">Ton niveau de Paysan est aussi ton niveau de combat.</div></div><div></div></div>' +
    '<div class="art">' + (S_.ulti ? '<span class="pic img trois-d"><img src="' + srcUlti(S_.ulti) + '" alt=""></span>' : '<span class="pic img trio">' + ['gel', 'zone', 'mono'].map((u) => '<img src="' + srcUlti(u) + '" alt="">').join('') + '</span>') + '<div><b>' + (S_.ulti ? 'Ulti : ' + nomUlti(S_.ulti) : 'Ulti') + '</b><div class="desc">' + (S_.ulti ? descUlti(S_.ulti) : st.niveau >= NIV_ULTI ? 'Débloqué : gel, zone ou coup fatal, à choisir une fois pour toutes.' : 'Se débloque au niveau ' + NIV_ULTI + ' : gel, zone ou coup fatal, à choisir une fois pour toutes.') + '</div></div><div class="act"><button class="btn' + (S_.ulti || st.niveau < NIV_ULTI ? ' discret' : ' kamas') + '" data-voir-ulti>' + (S_.ulti ? 'Voir' : st.niveau >= NIV_ULTI ? 'Choisir' : 'Voir') + '</button></div></div>';
  const arb = niv('arbalete') ? '<div class="art">' + ico('arbalete') + '<div><b>Arbalète de la grange</b><div class="puces"><span class="puce ' + (S_.carreaux > 0 ? 'bonne' : 'mauvaise') + '">' + (S_.carreaux > 0 ? S_.carreaux + '/' + capaciteArbalete() + ' chargé' + (rechargeAuto() ? ', se recharge seule' : '') : rechargeAuto() ? 'plus de flèches' : 'à recharger') + ', ' + degatsArbalete() + ' dégâts, ' + S_.fleches + ' flèche' + (S_.fleches > 1 ? 's' : '') + '</span></div><div class="desc">Elle tire aussi sur les monstres qui approchent de la grange.</div></div><div></div></div>' : '';
  const simu = '<div class="art">' + ico('voleur') + '<div><b>Simu VSA</b><div class="desc">' + (st.niveau < NIV_SIMU ? 'Les simus VSA commencent au niveau ' + NIV_SIMU + '.' : (() => { const T0 = tailleSimu(); return 'Prochaine dans ' + dureeLisible(Math.max(0, (S_.prochainRaid || 0) - Date.now())) + ' : ' + T0.nb + ' voleurs, dont ' + T0.montes + ' sur Dragodinde, ' + fmt(pvSimu(false)) + ' PV à pied, ' + fmt(pvSimu(true)) + ' montés. Une toutes les ' + dureeLisible(CADENCE_RAID) + ' quand tu joues.'; })()) + '</div></div><div></div></div>'; /* (17/10/2026 : le temps restant et sa taille, sans surprise) */
  const gains = '<div class="art">' + ico('kama') + '<div><b>' + fmt(g.kamas) + ' ' + KAMA + ' et ' + xpReel(g.xp) + ' points d\'expérience</b>' + (fini ? '<div class="desc">Plus de vague à lancer pour l\'instant : rejoue un boss plus bas, une fois par jour chacun.</div>' : n === base + VAGUES_PALIER ? '<div class="desc">Battre ' + leNom(B, true) + ' termine le palier ' + PALIERS[P].nom + (P + 1 < PALIERS.length ? ' et ouvre le suivant : ' + PALIERS[P + 1].nom + '.' : '.') + '</div>' : '') + '</div><div></div></div>';
  const prepa = fini ? 0 : (S_.vague.prepa || 0) - Date.now(), requis = niveauRequis(n), tropBas = !fini && st.niveau < requis;
  const bouton = repos > 0 ? '<button class="btn vg-lancer" disabled>Ton perso se repose encore ' + dureeLisible(repos) + '</button>' : prepa > 0 ? '<button class="btn vg-lancer" disabled>La vague ' + n + ' se prépare : ' + dureeLisible(prepa) + '</button>' : tropBas ? '<button class="btn vg-lancer" disabled>Niveau ' + requis + ' requis (tu es niveau ' + st.niveau + ')</button>' : (fini ? '<button class="btn vg-lancer" disabled>La suite arrive bientôt</button>' : '<button class="btn kamas vg-lancer" data-lancer-vague>Lancer la vague ' + n + '</button>');
  ouvrirModale('vagues', entete(fini ? 'Tous les paliers terminés' : 'Vague ' + n + ' (' + (n - base) + ' sur ' + VAGUES_PALIER + ')') + (fini ? '' : blocVie()) + '<div class="vg-sous">' + nomPalier(P) + ' : ' + PALIERS[P].nom + '. ' + (fini ? leNom(B) + ' est tombé' + ac(B) + ', la suite arrive bientôt.' : leNom(B) + ' attend à la vague ' + (base + VAGUES_PALIER) + '.') + '</div><div class="vg-piste">' + piste + '</div>' +
    '<div class="hdv-section">Ils arrivent</div><div class="vg-monstres">' + monstres + '</div>' + (vagueBoss(n) ? '<p class="vg-boss">Sa troupe protège le boss : chaque monstre près de lui lui retire 12 % de tes dégâts (jusqu\'à 60 %), et il en rappelle deux toutes les ' + RAPPEL_TROUPE + ' s. Dégage sa troupe, puis frappe-le avant qu\'elle revienne.</p>' : '') + '<div class="hdv-section">Ton perso</div>' + perso + arb + simu + '<div class="hdv-section">À gagner</div>' + gains + sectionRepas() + bouton + sectionRejouerBoss() +
    '<p class="vg-note">Les vagues n\'arrivent que quand tu les lances. Pendant la vague, touche un monstre pour le cibler : ton perso y va et frappe tout seul. Touche une case pour te déplacer. Certains monstres vont frapper tes bâtiments : va les chasser, sinon il faudra réparer. Après chaque victoire, la vague suivante se prépare ' + PREPA_VAGUE + ' min : le temps de faire tourner ta ferme. Chaque vague demande un niveau minimum. Perdu : ils saccagent une culture et ton perso se repose ' + dureeLisible(REPOS_VAGUE) + '.</p>' +
    '<div class="btn-bestiaire"><button class="btn discret" data-bestiaire="monstres">' + picto('livre') + 'Bestiaire et butin</button></div>');
}
/* le Bestiaire et butin (valide le 11/10/2026) : chaque monstre avec ses PV, ses degats et ce qu'il lache (avec ta Prospection),
   chaque panoplie avec ses pieces, son arme, ses bonus et ou la trouver. Les paliers pas encore atteints restent a decouvrir. */
const vaguesDe = (t) => (vaguesDe.c || (vaguesDe.c = {}))[t] || (vaguesDe.c[t] = Array.from({ length: VAGUES_TOTAL }, (_, k) => k + 1).filter((n) => compoTotale(n).some(([x]) => x === t)));
const casesDe = (u) => Math.round(u / S * 2) / 2; /* (une case : 2 unites) */
function ficheMonstre(t) {
  const d = MONSTRES[t], B = bestiaire()[t] || {}, V = vaguesDe(t), n = V.length ? Math.min(Math.max(S_.vague.num, V[0]), V[V.length - 1]) : Math.max(1, Math.min(S_.vague.num, VAGUES_TOTAL));
  const pv = pvMonstre(t, n), deg = Math.round(degMonstre(t, n) * multDegats(n)), dSort = d.boss ? Math.round(degMonstre(t, n) / BOSS_DEG[palierDe(n)] * (d.degSort || 0)) : Math.round(deg * (d.degSort || 1.5));
  const P = V.length ? palierDe(V[0]) : null, pros = 1 + caracs().prospection / 100, pc = (x) => (Math.round(Math.min(1, x) * 1000) / 10).toString().replace('.', ',') + ' %';
  const vis = d.grignote ? 'Tes cultures' : d.bandit ? 'Ta grange' : d.casse ? 'Toi ou tes bâtiments' : 'Toi', vM = vitesseMonstre(d), vit = vM <= VITESSE_MIN_MONSTRES ? 'lent' : vM < 2.7 ? 'moyen' : 'rapide';
  const tag = (p, t2, cl) => '<span class="puce ' + (cl || '') + '">' + picto(p) + t2 + '</span>', num = (t2, cl) => '<span class="puce ' + (cl || '') + '">' + t2 + '</span>';
  const tags = [d.boss && tag('couronne', 'Boss', 'or'), d.armure && tag('bouclier', 'Armure ' + Math.round(d.armure * 100) + ' %'), d.distance && tag('carreaux', 'Tire de loin'), d.casse && tag('casse', 'Casse les bâtiments'),
    !d.boss && d.charge && tag('charge', 'Charge', 'violet'), d.pique && tag('pique', 'Pique en vol', 'violet'), !d.boss && peutSauter({ d, aggro: true }) && tag('saut', 'Saute', 'violet'), d.vol && tag('vol', 'Vole'),
    d.soigne && tag('soin', 'Soigne', 'vert'), d.protege && tag('protege', 'Protège'), d.galvanise && tag('galvanise', 'Galvanise'), d.revit && tag('revit', 'Se relève'), d.grignote && tag('grignote', 'Grignote tes cultures'), d.rage && tag('rage', 'Enragé sous 30 %', 'rouge')].filter(Boolean).join('');
  const stat = (p, t2, v, em) => '<div class="bx-stat"><small>' + picto(p) + t2 + '</small><b>' + v + '</b>' + (em ? ' <em>' + em + '</em>' : '') + '</div>';
  const stats = stat('vita', 'Vie', fmt(pv), 'à la vague ' + n) + stat('degats', 'Coup', fmt(deg), 'toutes les ' + String(d.cadence).replace('.', ',') + ' s') + stat('bouclier', 'Armure', Math.round((d.armure || 0) * 100) + ' %', 'de tes dégâts') +
    stat('vitesse', 'Vitesse', String(vM).replace('.', ','), vit) + stat('portee', 'Portée', d.distance ? casesDe(d.portee) + ' cases' : 'Au contact', d.distance ? 'il tire' : 'corps à corps') + stat('cases', 'Vise', vis);
  const capa = (p, titre, txt, chiffres, cl) => '<div class="bx-capa"><span class="bx-ic ' + (cl || '') + '">' + picto(p) + '</span><div><b>' + titre + '</b><p>' + txt + '</p>' + (chiffres ? '<div class="puces">' + chiffres + '</div>' : '') + '</div></div>';
  const L = [], recup = (k) => num('toutes les ' + String(d[k]).replace('.', ',') + ' s');
  if (!d.boss && peutSauter({ d, aggro: true })) L.push(capa('saut', 'Saute sur toi', 'À moins de 3 cases, il se ramasse, puis bondit là où tu es. Reste dans le rond rouge et il t\'agrippe.', num('3 cases') + num(fmt(deg) + ' dégâts', 'rouge') + num('ralentit ' + String(AGRIPPE).replace('.', ',') + ' s', 'bleu') + num(secondes(ESQUIVE.saut) + ' pour esquiver') + num('toutes les ' + SAUT_RECHARGE + ' s'), 'violet'));
  if (!d.boss && (d.charge || d.pique)) L.push(capa(d.pique ? 'pique' : 'charge', d.pique ? 'Vol en piqué' : 'Charge', d.pique ? 'À moins de 3 cases, il prend de la hauteur, puis plonge sur toi en ligne droite. Une bande rouge te prévient.' : 'Il baisse la tête et fonce sur toi en ligne droite. Une bande rouge te prévient.',
    num((d.chargeMax ? '3' : '5') + ' cases') + num(fmt(dSort) + ' dégâts', 'rouge') + num(secondes(d.chargeMax ? ESQUIVE.charge : ESQUIVE.grandeCharge) + ' pour esquiver') + num('toutes les ' + (d.charge || d.pique) + ' s') + num('un bâtiment sur sa route prend le coup', 'vert'), 'violet'));
  if (d.casse) L.push(capa('casse', 'Démolit les bâtiments', 'Souvent, il fonce sur un bâtiment plutôt que sur toi. Frappe-le et il te prend pour cible.' + (d.bucheron ? ' Il tape deux fois plus fort sur les tours.' : ''), num(Math.round((d.casse || 0) * 100) + ' % de chances') + num(fmt(Math.round(dpsBatiments(n))) + ' dégâts par seconde sur un bâtiment', 'rouge')));
  if (d.distance) L.push(capa('carreaux', 'Tire de loin', 'Il reste à distance et te tire dessus' + (d.casse ? ', ou sur tes bâtiments' : '') + '. Va le chercher.', num(casesDe(d.portee) + ' cases') + num(fmt(deg) + ' dégâts', 'rouge')));
  if (d.ralentit) L.push(capa('lenteur', 'Te ralentit', 'Chacun de ses coups te fait marcher plus lentement.', num(String(d.ralentit).replace('.', ',') + ' s', 'bleu'), 'bleu'));
  if (d.menotte) L.push(capa('assomme', 'Te menotte', 'Si sa charge te touche, tu restes sur place un instant. Tu peux encore frapper.', num(secondes(d.menotte), 'rouge'), 'or'));
  if (d.assomme) L.push(capa('assomme', 'T\'assomme', 'Touché, tu ne frappes plus un instant.', num(String(d.assomme).replace('.', ',') + ' s', 'rouge'), 'or'));
  if (d.poison) L.push(capa('poison', 'T\'empoisonne', 'Son coup t\'empoisonne quelques secondes.', num(d.poison[0] + ' % de ta vie par seconde', 'rouge') + num(d.poison[1] + ' s'), 'vert'));
  if (d.soigne) L.push(capa('soin', 'Soigne ses alliés', 'Il soigne les monstres autour de lui : abats-le en premier.', '', 'vert'));
  if (d.protege) L.push(capa('protege', 'Bouclier de cristal', 'Il protège trois monstres autour de lui.', num('-40 % de dégâts') + num('4 s') + recup('protege')));
  if (d.galvanise) L.push(capa('galvanise', 'Galvanise la horde', 'Les monstres autour de lui frappent et courent plus vite.', num('4 s') + recup('galvanise'), 'or'));
  if (d.revit) L.push(capa('revit', 'Se relève', 'Abattu, il se relève une fois.'));
  if (d.demonte) L.push(capa('revit', 'Continue à pied', 'Quand sa monture tombe, il continue à pied.'));
  if (d.grignote) L.push(capa('grignote', 'Grignote tes cultures', d.gourmand ? 'Il file vers tes Cawottes, puis tes Fraises : une récolte de moins toutes les 5 s.' : 'Il file picorer tes champs : une récolte de moins toutes les 5 s.', '', 'or'));
  if (d.bandit) L.push(capa('kama', 'Vole tes kamas', 'Il file à ta grange, y vole des kamas, puis repart par où il est venu.', '', 'or'));
  if (d.fouisseur) L.push(capa('cases', 'Surgit de terre', 'Il sort de terre au pied de tes bâtiments, derrière tes défenses.'));
  /* les sorts des boss */
  if (d.boss && d.charge) L.push(capa('charge', d.poings ? 'Ruée' : 'Charge', 'Une bande ' + teinteSorts(d, true) + ' jusqu\'à toi, puis il fonce. Cache-toi derrière un bâtiment : il s\'y écrase.', num(fmt(Math.round(dSort * ((d.sortsX || {}).charge || 1))) + ' dégâts', 'rouge') + num(secondes(ESQUIVE.grandeCharge) + ' pour esquiver') + recup('charge'), 'violet'));
  if (d.lance) L.push(capa('sort', 'Lance d\'os', 'De loin, une bande rouge jusqu\'à toi, puis sa lance file. Un bâtiment sur sa route prend la moitié du coup.', num(fmt(dSort) + ' dégâts', 'rouge') + (d.lanceLoin ? num('+' + Math.round(d.lanceLoin.parCase * 100) + ' % par case au-delà de 2, jusqu\'à ×' + String(d.lanceLoin.max).replace('.', ','), 'rouge') : '') + num('1 s pour esquiver') + recup('lance'), 'violet'));
  if (d.carapace) L.push(capa('bouclier', 'Carapace d\'épines', 'Il se replie sous sa carapace : presque aucun dégât, et il renvoie un cinquième des coups reçus au corps à corps. Frappe ses soldats en attendant.', num('3,5 s') + recup('carapace')));
  if (d.marteau || d.poings) L.push(capa('sort', d.poings ? 'Coups de poing' : 'Coup de marteau', d.poings ? 'Il se tourne vers toi et abat son poing là où tu es : un cercle ' + teinteSorts(d) + ' sous tes pieds pour un coup au sol, un éventail devant lui pour un coup de poing ou un revers. Sors-en avant l\'impact.' : 'Il se tourne vers toi et abat son marteau là où tu es : un cercle orange sous tes pieds pour un coup au sol, un éventail devant lui pour un coup qui balaie. Sors-en avant l\'impact.', num(fmt(Math.round(dSort * ((d.sortsX || {}).marteau || 0.5))) + ' dégâts au sol', 'rouge') + num(fmt(Math.round(dSort * ((d.sortsX || {}).balaye || 0.25))) + ' en balayant', 'rouge'), 'violet'));
  if (d.marteau || d.poings) L.push(capa('sort', 'Moulinet', d.poings ? 'Il tend le bras et tourne trois fois sur lui-même : un grand cercle ' + teinteSorts(d) + ' autour de lui, chaque tour frappe dedans.' : 'Il tend son marteau et tourne trois fois sur lui-même : un grand cercle orange autour de lui, chaque tour frappe dedans.', num(fmt(Math.round(dSort * ((d.sortsX || {}).moulinet || 0.35))) + ' dégâts par tour', 'rouge') + num(TOURS_MOULINET + ' tours'), 'violet'));
  if (d.bondit) L.push(capa('saut', 'Bond écrasant', d.marteau ? 'De loin, il saute et abat son marteau là où tu es : un cercle orange et son ombre qui grandit, sors-en.' : d.poings ? 'De loin, il saute et abat ses deux poings là où tu es : un cercle ' + teinteSorts(d) + ' et son ombre qui grandit, sors-en.' : (d.fem ? 'Elle' : 'Il') + ' saute là où tu es : un cercle rouge, sors-en.', num(fmt(Math.round(dSort * ((d.sortsX || {}).bond || 1))) + ' dégâts', 'rouge') + num(secondes(d.marteau || d.poings ? +(ESQUIVE.bond / ((d.vivacite || 1) * (d.bondVif || 1))).toFixed(2) : ESQUIVE.bond) + ' pour esquiver') + recup('bondit'), 'violet'));
  if (d.seisme) L.push(capa('sort', d.seismeNom || 'Séisme', (d.poings ? 'Il saute et abat ses deux poings sur le sol' : 'Il frappe le sol') + ' : un ' + (d.seismeR ? '' : 'grand ') + 'cercle ' + teinteSorts(d) + ' autour de lui' + (d.repousse ? ', qui te repousse' : '') + '. Tes bâtiments proches prennent aussi.', num(fmt(Math.round(dSort * ((d.sortsX || {}).seisme || 1))) + ' dégâts', 'rouge') + num(secondes(d.seismeDuree || 1.3) + ' pour esquiver') + recup('seisme'), 'violet'));
  if (d.bourrasque) L.push(capa('lenteur', 'Bourrasque', 'Il bande son arc : un cône rouge devant lui, puis sa flèche de vent soulève une rafale. Dedans, elle te repousse de 2 cases et te ralentit.', num(fmt(Math.round(dSort * ((d.sortsX || {}).bourrasque || 1))) + ' dégâts', 'rouge') + num('repoussé de 2 cases') + num('ralenti ' + secondes(LENTEUR_BOURRASQUE), 'bleu') + num(secondes(ESQUIVE.bourrasque) + ' pour esquiver') + recup('bourrasque'), 'bleu'));
  if (d.boue) L.push(capa('lenteur', 'Bain de boue', 'Il frappe le sol : un cercle rouge sous toi. Reste dedans et la boue te colle sur place. Tant que tu es collé, il ne charge pas.', num('collé ' + secondes(DUREE_COLLE), 'rouge') + num(secondes(ESQUIVE.boue) + ' pour esquiver') + recup('boue'), 'bleu'));
  if (d.brassard) L.push(capa('sort', 'Coup de brassard', 'Un arc rouge devant elle, puis un grand coup de brassard qui te repousse.', num(fmt(dSort) + ' dégâts', 'rouge') + num('te repousse') + num(secondes(ESQUIVE.brassard) + ' pour esquiver') + recup('brassard'), 'violet'));
  if (d.pierre) L.push(capa('bouclier', 'Peau de pierre', 'Elle se change en pierre : moitié moins de dégâts pendant 4 s. Frappe sa troupe en attendant.', num('4 s') + recup('pierre')));
  if (d.souffle) L.push(capa('sort', 'Souffle de feu', 'Il crache un cône de feu vers toi, sur tes bâtiments aussi.', num(fmt(dSort) + ' dégâts', 'rouge') + num('1 s pour esquiver') + recup('souffle'), 'violet'));
  if (d.pluie) L.push(capa('sort', d.pluieFleches ? 'Pluie de flèches' : 'Pluie de cawottes', d.pluieFleches ? 'Cinq cercles rouges : un sur toi, quatre autour.' : 'Cinq cercles orange : un sur toi, quatre autour.', num(fmt(dSort) + ' dégâts', 'rouge') + num(secondes(ESQUIVE.pluie) + ' pour esquiver') + recup('pluie'), 'violet'));
  if (d.cawotteRoyale) L.push(capa('assomme', 'Cawotte royale', 'Une petite cible rouge te suit, puis se fige. File : la cawotte géante t\'assomme.', num(fmt(dSort) + ' dégâts', 'rouge') + num('assommé 1 s', 'rouge') + num(secondes(ESQUIVE.cawotteRoyale) + ' pour esquiver') + recup('cawotteRoyale'), 'or'));
  if (d.fumee) L.push(capa('poison', 'Nuages de fumée', 'Il crache de la fumée, ses nuages restent 24 s au sol : les toucher t\'empoisonne, 2 s de poison dès le contact puis 2 s de plus par seconde passée dedans.', num('2 % de ta vie par seconde', 'rouge') + recup('fumee'), 'vert'));
  if (d.appel) L.push(capa('sort', 'Il t\'attire à lui', 'Une bande verte jusqu\'à toi, même de très loin : reste dedans et il te tire jusqu\'à lui.', recup('appel'), 'violet'));
  if (d.geyser) L.push(capa('sort', 'Geyser', 'Un cercle bleu sous tes pieds : l\'eau jaillit 1,4 s plus tard, sors-en.', num(fmt(Math.round(dSort * ((d.sortsX || {}).geyser || 1))) + ' dégâts', 'rouge') + recup('geyser'), 'rouge'));
  if (d.geyserRage) L.push(capa('sort', 'Geysers de rage', 'Sous 30 % de vie : ' + d.geyserRage.n + ' cercles bleus au hasard sur le terrain toutes les ' + d.geyserRage.periode + ' s, l\'eau jaillit 1,4 s plus tard ; ils ne te visent pas, mais sors-en.', num(fmt(Math.round(dSort * ((d.sortsX || {}).geyser || 1))) + ' dégâts chacun', 'rouge'), 'rouge'));
  if (d.garde) L.push(capa('carreaux', 'Garde ses distances', 'Approche-toi à moins de ' + casesDe(d.garde) + ' cases : elle recule pour lancer ses sorts de loin.', '', 'bleu'));
  if (d.invoque) L.push(capa('renfort', 'Invocation', (d.fem ? 'Elle' : 'Il') + ' lève son bâton de corail et invoque ' + d.invoque.n + ' tortues toutes les ' + d.invoque.periode + ' s (' + d.invoque.max + ' au plus) : des monstres de niveau 80 à 90 qui ' + (d.fem ? 'la' : 'le') + ' protègent comme une troupe.', '', 'vert'));
  if (d.renforts) L.push(capa('renfort', 'Renforts','Il appelle deux ' + d.renforts[1] + ' toutes les ' + RAPPEL_TROUPE + ' s (' + TROUPE_MAX + ' au plus)' + (d.renfortsRage ? ', puis des ' + d.renfortsRage[1] + ' une fois enragé' : '') + '. Sa troupe le protège : chaque monstre près de lui lui retire 12 % de tes dégâts.', '', 'vert'));
  if (d.affaibli) { const A = d.affaibli, pc = Math.round(A.seuil * 100); L.push(capa('bouclier', 'Affaibli', 'Sous ' + pc + ' % de vie, il tombe à genoux : invulnérable, sa vie bloquée à ' + pc + ' %, il appelle ' + A.n + ' ' + A.noms + '. Tant qu\'un seul est debout, il regagne ' + Math.round(A.regen * 100) + ' % de sa vie toutes les ' + A.pas + ' s. Abats-les tous : il se relève enragé.', num(fmt(A.pv) + ' PV par Gorille') + num('+' + Math.round(A.regen * 100) + ' % toutes les ' + A.pas + ' s', 'vert'), 'violet')); }
  if (d.rage) L.push(capa('rage', 'Rage', (d.affaibli ? 'Une fois ses ' + d.affaibli.noms + ' abattus' : 'Sous 30 % de vie') + ', il frappe 1,7 fois plus vite et lance ses sorts plus souvent.', '', 'rouge'));
  if (!L.length) L.push(capa('degats', 'Au contact', 'Il vient te frapper, sans rien de plus.'));
  /* le butin */
  const r = d.res || RES_MONSTRE[t], Pn = P != null ? PANOS[Math.min(P, PANOS.length - 1)] : null, leg = d.boss && LEGENDAIRES.find((x) => x.boss === t);
  const drop = (ic, t2) => '<div class="bx-drop">' + ic + '<span>' + t2 + '</span></div>';
  const drops = [r && PAR_ID[r] ? drop('<img src="assets/icones/' + r + '.png?v=' + VERSION_MODELES + '" alt="">', PAR_ID[r].nom + ' · ' + (d.boss ? '5, à coup sûr' : pc(0.35 * pros))) : '',
    Pn && !d.vole ? drop('<img src="assets/icones/' + iconeObjet(Pn.id + '-cape') + '.png?v=' + VERSION_MODELES + '" alt="">', 'Une pièce ' + Pn.de + ' · ' + (d.boss ? 'à coup sûr la 1re fois, puis 40 %' : pc((t === 'tofu' ? 0.02 : 0.07) * pros))) : '',
    leg ? drop('<img src="assets/icones/' + iconeObjet(idLeg(leg)) + '.png?v=' + VERSION_MODELES + '" alt="">', '✦ ' + OBJETS[idLeg(leg)].nom + ' · ' + pc(CHANCE_LEG * pros)) : ''].filter(Boolean).join('');
  const ou = P != null ? PALIERS[P].nom.replace(/^./, (c) => c.toUpperCase()) + ' · vague' + (V.length > 1 ? 's ' + V[0] + ' à ' + V[V.length - 1] : ' ' + V[0]) : 'Hors des paliers';
  return '<div class="bx-fiche"><div class="bx-tete"><div class="bx-portrait' + (d.boss ? ' boss' : '') + '"><img src="assets/icones/' + d.icone + '.png?v=' + VERSION_MODELES + '" alt=""></div><div><h3>' + d.nom + '</h3><p>' + ou + (B.tues ? ' · abattu ' + fmt(B.tues) + ' fois' : '') + '</p><div class="puces">' + tags + '</div></div></div>' +
    '<div class="bx-stats">' + stats + '</div><h4>' + (d.boss ? 'Ses sorts et ce qu\'il fait' : 'Ce qu\'il fait') + '</h4>' + L.join('') + (drops ? '<h4>Butin</h4><div class="bx-drops">' + drops + '</div>' : '') + '</div>';
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
  const leN = (M) => { const n = leNom(M); return n.charAt(0).toLowerCase() + n.slice(1); }; /* « sur le Bouftou Royal » */
  const tete = '<div class="hdv-tete">' + [['monstres', 'Monstres'], ['panoplies', 'Panoplies']].map(([k, t]) => '<button class="btn" data-bestiaire="' + k + '" aria-pressed="' + (onglet === k) + '">' + t + '</button>').join('') + '</div>' +
    '<p class="best-note">Les chances tiennent compte de ta Prospection (+' + c.prospection + ' %). Chaque pièce tombe avec ses propres stats, tirées dans la fourchette indiquée. Une sur 100 sort <b>rare ★</b> : stats +50 %.</p>';
  const corps = PALIERS.map((Pa, P) => {
    const base = P * VAGUES_PALIER, titre = '<div class="hdv-section">' + nomPalier(P) + ' : ' + Pa.nom + ' (vagues ' + (base + 1) + ' à ' + (base + VAGUES_PALIER) + ')</div>';
    if (!atteint(P)) return titre + '<p class="best-verrou">' + picto('cadenas') + 'À découvrir en atteignant la vague ' + (base + 1) + '.</p>';
    const Pn = PANOS[Math.min(P, PANOS.length - 1)], B = MONSTRES[Pa.boss], leg = LEGENDAIRES.find((x) => x.boss === Pa.boss);
    const pieces = EMPLACEMENTS.map(([e]) => Pn.id + '-' + e).concat(ar ? ['arme-' + ar[0] + '-' + Pn.id] : []);
    return titre + pieces.map((id) => { const o = OBJETS[id], eu = possede(id) || possede(id + '-rare'); /* (les stats : la fourchette des jets) */
      return '<div class="art' + (eu ? '' : ' pas-eu') + '">' + icoObjet(id) + '<div><b>' + o.nom + (eu ? ' <span class="puce bonne">✓ obtenue</span>' : '') + '</b><div class="puces">' + statsFourchette(o) + '<span class="puce">niveau ' + o.niv + '</span></div>' +
        '<div class="desc">' + (o.arme ? 'Sur ' + leN(B) + ' seulement, pour ta classe.' : 'Sur les monstres des vagues ' + (base + 1) + ' à ' + (base + VAGUES_PALIER) + ', et sur ' + leN(B) + '.') + '</div></div><div></div></div>'; }).join('') +
      blocPano(P, comptePanos()[P] || 0) + (leg ? '<div class="art">' + icoObjet(idLeg(leg)) + '<div><b>✦ ' + OBJETS[idLeg(leg)].nom + '</b><div class="puces">' + statsFourchette(OBJETS[idLeg(leg)]) + '</div><div class="desc">' + pc(CHANCE_LEG * pros) + ' sur ' + leN(B) + (leg.arme ? ', l\'arme de ta classe' : '') + '. Elle ne compte dans aucune panoplie.</div></div><div></div></div>' : '');
  }).join('');
  ouvrirModale('bestiaire', entete('Bestiaire et butin') + tete + corps); /* (l'onglet Panoplies) */
}
/* rejouer un boss deja battu : une fois par jour et par boss, remis a ton niveau, la moitie des kamas et de l'XP, son butin et sa coiffe legendaire (2 %) */
const jourJeu = () => new Date(tempsReel()).toDateString();
const bossRejouable = (P) => S_.vague.num > (P + 1) * VAGUES_PALIER && ((S_.bossRejoue || {})[P] !== jourJeu());
/* « a chaque fois que tu le rejoues ca divise les recompenses, en dehors du drop d'item » (Mathieu, 11/10/2026) : kamas et XP divises par deux a chaque victoire de plus (5 % au minimum) */
const partRejoue = (P) => Math.max(0.05, Math.pow(0.5, ((S_.bossFois || {})[P] || 0) + 1));
const gainsBoss = (P) => { const g = gainsVague((P + 1) * VAGUES_PALIER, false), k = partRejoue(P); return { kamas: Math.round(g.kamas * k), xp: Math.round(g.xp * k) }; };
const DUR = { pv: 1, deg: 1, garde: 0.6, sorts: 1.1, rappel: 15, troupe: 6, rage: 0.35, leg: 2 }; /* (pv et deg : le boss ; garde : sa troupe, en plus du rapport de niveau. LA REVANCHE DIFFICILE, 15/10/2026, « ca s'adapte a ton niveau, tu doubles tes chances d'item legendaire, mais c'est beaucoup, beaucoup, beaucoup plus dur », Mathieu. Simule avec le bot attentif (esquive 7 fois sur 10) sur ses fermes niveau 52, Iop, Cra, Osamodas : remis au niveau seul, il gagnait 3 a 4 fois sur 4 les boss 1 et 3 ; avec PV x2 et coups x1,5, plus jamais ; avec sorts x1,15, renforts 14 s, rage 40 %, 0 a 15 % de victoires. Reglage retenu entre les deux) */
function forceRef(l) { /* un joueur type de ce niveau : sa classe, la panoplie complete de son palier au jet moyen */
  const st = STATS_CLASSE[classeDe()], k = palierDe(Math.min(VAGUES_TOTAL, l + 2)), V = (c) => VALEURS[c][k], b = bonusPano(k, EMPLACEMENTS.length);
  return { pv: st.pv(l) + 3 * V('vita') + (b.vita || 0), dps: st.deg(l) * (1 + (3 * V('puissance') + (b.puissance || 0)) / 100) * (1 + (2 * V('agilite') + (b.agilite || 0)) / 100) / st.cadence };
}
const facteurRejoue = (quoi, t) => { if (!combat || combat.rejoueBoss == null) return 1; const L = niveau(S_.xp), Lb = niveauRequis(combat.n);
  if (combat.difficile) { const a = forceRef(Math.max(L, Lb)), b = forceRef(Lb), boss = t && MONSTRES[t] && MONSTRES[t].boss; return (quoi === 'deg' ? a.pv / b.pv : a.dps / b.dps) * (boss ? DUR[quoi === 'deg' ? 'deg' : 'pv'] : DUR.garde); } /* la revanche difficile : remis a ton niveau, puis bien plus dur */
  return Math.min(1.5, 1 + 0.025 * Math.max(0, L - Lb)); };
/* la Cawotte et la Fraise (« une nouvelle recolte qui donne un boost », Mathieu, 11/10/2026) : on en mange une avant de lancer, pour cette vague seulement */
function sectionRepas() {
  const L = CULTURES.filter((c) => c.mange && (niveau(S_.xp) >= c.niv || (S_.grange[c.id] || 0) > 0)); if (!L.length) return '';
  S_.mange = S_.mange || {};
  return '<div class="hdv-section">Avant la bataille : manger</div><p class="hdv-aide">Un repas se prend ici, juste avant de lancer : une récolte de ta grange, et son bonus dure toute la vague qui suit. La Cawotte et la Fraise se cumulent. Elles se plantent comme les autres cultures (graines à l\'HDV).</p>' + L.map((c) => { const n = S_.grange[c.id] || 0, pris = !!S_.mange[c.id];
    return '<div class="art">' + ico(c.id) + '<div><b>' + c.nom + (pris ? ' : mangée !' : '') + '</b><div class="puces"><span class="puce ' + (pris ? 'bonne' : '') + '">' + c.mange.txt + ' pendant la prochaine vague</span><span class="puce">' + n + ' en grange</span></div></div><div class="act">' +
      (pris ? '<span class="cadenas">✓ Prête</span>' : '<button class="btn mini" data-manger="' + c.id + '"' + (n > 0 ? '' : ' disabled') + '>' + (n > 0 ? 'Manger' : 'Aucune') + '</button>') + '</div></div>'; }).join('');
}
function sectionRejouerBoss() {
  const L = PALIERS.map((p, P) => P).filter((P) => S_.vague.num > (P + 1) * VAGUES_PALIER); if (!L.length) return '';
  return '<div class="hdv-section">Rejouer un boss</div><p style="font-size:.76rem;font-weight:600;margin:0 0 4px">Un boss battu se rejoue une fois par jour, remis à ton niveau. Ses kamas et son XP sont divisés par deux à chaque nouvelle victoire (la moitié, puis un quart...), mais son butin et ses 2 % de chance sur la pièce légendaire ne baissent jamais.</p>' +
    '<p style="font-size:.76rem;font-weight:600;margin:0 0 4px"><b>Difficile</b> : le boss et toute sa troupe remis à TON niveau (leur vie suit tes dégâts, leurs coups suivent ta vie : seul un équipement meilleur que la moyenne t\'aide), puis plus vicieux : des sorts plus fréquents, des renforts plus souvent, enragé dès ' + Math.round(DUR.rage * 100) + ' % de sa vie. En échange, <b>deux fois plus de chances sur la pièce légendaire</b>. Une seule revanche par jour et par boss : normale ou difficile.</p>' +
    L.map((P) => { const B = MONSTRES[PALIERS[P].boss], leg = LEGENDAIRES.find((x) => x.boss === PALIERS[P].boss), ok = bossRejouable(P), g = gainsBoss(P);
      return '<div class="art">' + ico(B.icone) + '<div><b>' + B.nom + '</b><div class="puces"><span class="puce">+' + fmt(g.kamas) + ' ' + KAMA + '</span><span class="puce">+' + xpReel(g.xp) + ' XP</span>' + (leg ? '<span class="puce leg">✦ ' + (leg.nom || OBJETS[idLeg(leg)].nom) + ' : 2 %, 4 % en difficile' + (possede(idLeg(leg)) ? ' (déjà à toi)' : '') + '</span>' : '') + '</div></div><div class="act"><button class="btn kamas mini" data-rejouer-boss="' + P + '"' + (ok ? '' : ' disabled') + '>' + (ok ? 'Rejouer' : 'Demain') + '</button>' + (ok ? '<button class="btn mini dur" data-rejouer-dur="' + P + '">Difficile</button>' : '') + '</div></div>'; }).join('');
}
function lancerVague(pBoss, difficile) {
  if (combat || enAccueil || !paysanMesh) return;
  if (lieu !== 'ferme') { toast('Rentre d\'abord à la ferme en montgolfière.'); return; }
  if (Date.now() < S_.vague.repos) { toast('Ton perso se repose encore ' + dureeLisible(S_.vague.repos - Date.now()) + '.'); return; }
  const rejoueB = pBoss != null && pBoss >= 0;
  if (rejoueB && !bossRejouable(pBoss)) { toast('Tu as déjà rejoué ce boss aujourd\'hui : reviens demain.'); return; }
  if (!rejoueB && S_.vague.num > VAGUES_TOTAL) { toast('Tous les paliers sont terminés : la suite arrive bientôt. En attendant, chaque boss se rejoue une fois par jour (fenêtre Vagues).'); return; } /* (« on peut rejouer la vague 60 a l'infini », Mathieu, 13/10/2026 : apres le dernier boss, plus de vague a la chaine ; il se rejoue une fois par jour, comme les autres) */
  const n = rejoueB ? (pBoss + 1) * VAGUES_PALIER : vagueCourante(), file = [], rejoueV = rejoueB || S_.vague.num > VAGUES_TOTAL;
  if (!rejoueV && Date.now() < (S_.vague.prepa || 0)) { toast('La vague ' + n + ' se prépare : elle sera là dans ' + dureeLisible(S_.vague.prepa - Date.now()) + '. Profites-en pour cultiver.'); return; }
  if (!rejoueV && niveau(S_.xp) < niveauRequis(n)) { toast('Il faut le niveau ' + niveauRequis(n) + ' pour la vague ' + n + ' : cultive et élève tes bêtes pour gagner de l\'expérience.', 'alerte'); return; }
  compoVague(n).forEach(([t, k]) => { for (let i = 0; i < k; i++) file.push(t); });
  file.sort(() => Math.random() - 0.5); file.sort((a, b) => (MONSTRES[a].boss ? 1 : 0) - (MONSTRES[b].boss ? 1 : 0)); /* le boss arrive en dernier */
  nouveauCombat('vague', { n, file, total: file.length, attente: 0.8, pv: vieActuelle(), ...potsDeVague(), rejoueBoss: rejoueB ? pBoss : null, difficile: rejoueB && !!difficile });
  combat.phases = (PHASES_BOSS[n] || []).map((p) => { const f = []; p.L.forEach(([t, k]) => { for (let i = 0; i < k; i++) f.push(t); }); f.sort(() => Math.random() - 0.5); return { nom: p.nom, f }; }); /* (la vague 70 : ses temps suivants) */
  if (rejoueB) { S_.bossRejoue = S_.bossRejoue || {}; S_.bossRejoue[pBoss] = jourJeu(); sauver(); }
  { const repas = appliquerRepas(); if (repas.length) setTimeout(() => toast('Repas avant la bataille : ' + texteRepas(repas) + ' pendant cette vague.', 'or'), 1200); }
  fermerModale(); ouvrirHudCombat();
  toast(rejoueB ? leNom(MONSTRES[PALIERS[pBoss].boss]) + (difficile ? ' revient en mode DIFFICILE : remis à ton niveau, bien plus coriace, plus vicieux, et deux fois plus de chances de lâcher sa pièce légendaire. Bonne chance !' : ' revient pour la revanche, remis à ton niveau !') : (combat.phases.length ? 'Vague ' + n + ' en ' + (combat.phases.length + 1) + ' temps : d\'abord la horde (' + file.length + ' monstres), puis ' + combat.phases.map((p) => p.nom).join(', puis ') + ' !' : 'Vague ' + n + ' : ' + file.length + ' monstres arrivent par les bords de ta ferme !'), 'alerte'); majCombatHud(); son('vague');
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
  while (file.length) { const c = file.shift(); voisins(c).forEach((v) => { if (!dist.has(v.id) && PASSABLE[v.type]) { dist.set(v.id, dist.get(c.id) + 1); file.push(v); } }); }
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
  if (o.d.boss) { o.deg = o.deg0 = Math.max(1, Math.round(o.deg * a.pv / b.pv)); o.pvMax = PV_ILE_BOSS; o.pv = Math.max(1, PV_ILE_BOSS - combat.arene.avant); o.echelle = (o.echelle || 1) * 1.5; o.m.scale.setScalar(o.echelle); o.haut *= 1.5; }
  else { o.pv = o.pvMax = Math.max(1, Math.round(o.pvMax * a.dps / b.dps * 0.6)); o.deg0 = Math.max(1, Math.round(o.deg * a.pv / b.pv * 0.6)); o.deg = Math.max(1, Math.round(o.deg0 * mR)); }
}
function apparaitre(type, pres) {
  const d = MONSTRES[type]; noterVu(type);
  if (!d.fabrique && !MODELES[d.modele]) { /* son modele n'est pas encore la (un monstre a squelette, charge a la demande) : il sort des qu'il est charge ; sans modele, il ne vient pas (26/10/2026 : cloner plantait et l'image se figeait) */
    const c0 = combat; chargerSquelettes([d.modele]).then(() => { if (combat !== c0 || c0.fin) return; if (MODELES[d.modele]) apparaitre(type, pres); else if (c0.total > 0) c0.total--; }); return; }
  if (combat.arene && !pres) { const g = hasard(PORTES_ARENE); pres = { x: g.x + (Math.random() - 0.5) * 1.4, z: g.z + (Math.random() - 0.5) * 1.4, porte: g }; } /* l'Arene : ils sortent des herses */
  if (!pres && d.fouisseur && !combat.raid && !combat.arene) { pres = pointPresBat(); if (pres && !combat.fouisseurVu) { combat.fouisseurVu = true; toast('Un ' + d.nom + ' surgit de terre au pied de tes bâtiments, derrière tes défenses !', 'alerte'); } }
  const L0 = pres ? [] : (combat.bords || (combat.bords = bordsFerme())), L = L0.length && !combat.raid ? bordsDirects(L0) : L0, b = !pres && combat.raid && combat.entrees && combat.entrees.length ? combat.entrees.shift() : L.length ? hasard(L) : null; /* (la simu VSA : chaque voleur par sa case rouge) */
  const c = pres ? (caseIci(pres.x, pres.z) || S_.cases.find((x) => PASSABLE[x.type])) : b ? b.c : hasard(S_.cases.filter((x) => PASSABLE[x.type])), q = posCase(c);
  const m = d.fabrique ? d.fabrique() : cloner(d.modele), ombreM = ombrePieds(m, d.ombre); const id = ++combat.id; m.traverse((o) => { o.userData.monstre = id; });
  const zone = new T.Mesh(new T.SphereGeometry(Math.max(0.6, d.ombre * 0.5), 8, 6), CIBLE); zone.position.y = d.ombre * 0.4; zone.userData.monstre = id; m.add(zone); /* plus facile a toucher */
  let x, z, ry, dep;
  if (b) { /* il grimpe depuis le vide, sous le bord, et se hisse sur la case ; ou il sort de la friche (les hautes herbes du terrain voisin), d'un bond */
    const le = (Math.random() - 0.5) * 1.2; x = q.x + b.di * 0.55 + (b.dj ? le : 0); z = q.z + b.dj * 0.55 + (b.di ? le : 0); ry = Math.atan2(-b.di, -b.dj);
    dep = b.friche ? { x: x + b.di * 1.9, y: q.y, z: z + b.dj * 1.9, friche: true } : { x: x + b.di * 1.1, y: q.y - 2.4, z: z + b.dj * 1.1 };
  } else { /* les renforts sortent de terre, pres du boss */
    x = pres ? pres.x : q.x; z = pres ? pres.z : q.z; ry = Math.random() * 6.28; dep = { x, y: q.y - 1.6, z };
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
function cibler(id) { const o = combat && combat.monstres.find((x) => x.id === id && x.etat === 'actif'); if (o) { combat.cible = o; combat.ordre = false; combat.tenir = false; } }
const m0Anim = (mo) => !!(mo.m && mo.m.userData.anim);
function blesser(mo, n, gros, src) { /* src 'def' : un coup de tes defenses (tour, arbalete, epouvantail), compte a part dans le bilan */
  if (!combat || combat.fin || !mo || mo.etat !== 'actif') return;
  if (mo.esquive > 0) { if (!(mo.esquiveVu > 0)) { mo.esquiveVu = 0.4; const p = mo.m.position.clone(); p.y += mo.haut; chiffre('Esquive !', p); } return; }
  if (mo.faible) { if (!((mo.faibleVu || 0) > performance.now())) { mo.faibleVu = performance.now() + 450; const p = mo.m.position.clone(); p.y += mo.haut * 0.75; chiffre('Invulnérable', p); } return; } /* (Moon affaibli, 22c-squelettes.js) */ /* (une Tortue en pleine roulade : tes coups la manquent) */
  mo.recent = 1.2; /* (il vient d'etre touche : une Tortue peut rouler pour esquiver la suite) */
  if (mo.d.armure) n = Math.max(1, Math.round(n * (1 - mo.d.armure))); /* les boss encaissent moins */
  if (mo.bouclier > 0) n = Math.max(1, Math.round(n * 0.6)); /* bouclier de cristal */
  if (mo.d.boss && mo.protege > 0) n = Math.max(1, Math.round(n * (1 - mo.protege))); /* sa troupe le protege */
  if (mo.carapace > 0) n = Math.max(1, Math.round(n * 0.2)); /* la carapace d'epines du Chafer Cuirasse (ses epines renvoient les coups du perso : voir majPerso) */
  if (mo.pierre > 0) n = Math.max(1, Math.round(n * 0.5)); /* la peau de pierre de la Gorgouille (20/10/2026) */
  if (paysanMesh && Math.hypot(paysanMesh.position.x - mo.x, paysanMesh.position.z - mo.z) < 8) mo.aggro = true; /* le perso le frappe : il se retourne contre lui */
  if (combat.genre === 'ile' && mo.d.boss) combat.arene.deg += Math.min(n, Math.max(0, mo.pv)); /* (l'ile des boss : tes degats sur le boss) */
  { const v = 0.01 * nbBonus('vol'); if (v) { const a0 = combat.pv; combat.pv = Math.min(combat.pvMax, combat.pv + Math.min(n, Math.max(0, mo.pv)) * v); if (combat.st) combat.st.soins += combat.pv - a0; } } /* (le bonus Vol de vie de l'Arene) */
  mo.pv -= n; mo.coup = m0Anim(mo) ? 0 : 0.18; if (m0Anim(mo)) { eclatSquelette(mo); if (gros || n > mo.pvMax * 0.012) reactionSquelette(mo); } /* (un monstre a squelette rougit sous le coup, sans gonfler ni s'arreter ; un boss sursaute) */ if (combat.st) { combat.st.inflige += n; if (src === 'def') combat.st.def = (combat.st.def || 0) + n; else if (n > combat.st.max) combat.st.max = n; } chiffre('-' + n, new T.Vector3(mo.x, mo.m.position.y + mo.haut - 0.2, mo.z), gros ? 'gros' : '');
  if (mo.d.affaibli && !mo.faible && !mo.faibleFini && m0Anim(mo) && mo.pv <= mo.pvMax * mo.d.affaibli.seuil) { mo.pv = Math.ceil(mo.pvMax * mo.d.affaibli.seuil); entrerFaible(mo); return; } /* (Moon, sa vie bloquee a 30 %, 31/10/2026) */
  if (mo.pv <= 0 && mo.d.revit && !mo.revenu) { /* le Wabbit Squelette se releve une fois, a mi-vie */
    mo.revenu = true; mo.pv = Math.round(mo.pvMax * 0.5); pouf(mo.x, mo.m.position.y, mo.z, 2.2, '#ece0b8'); chiffre('Il se relève !', new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.2, mo.z), 'butin');
    if (!combat.revitVu) { combat.revitVu = true; toast(leNom(mo.d) + ' se relève : il faut l\'abattre deux fois !', 'alerte'); } return;
  }
  if (mo.pv <= 0 && mo.butinK > 1) { S_.kamas += mo.butinK; chiffre('+' + fmt(mo.butinK) + ' kamas', new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.3, mo.z), 'butin'); toast('Le ' + mo.d.nom + ' est abattu : tes ' + fmt(mo.butinK) + ' kamas reviennent à la grange !', 'or'); mo.butinK = 0; rendreHaut(); }
  if (mo.pv <= 0 && mo.d.demonte && !combat.raid) { const x = mo.x, z = mo.z, y = mo.m.position.y; setTimeout(() => { if (!combat || combat.fin) return; apparaitre(mo.d.demonte, { x, z }); const nm = combat.monstres[combat.monstres.length - 1]; nm.dep = { x, y: y + 1.3, z }; nm.t = 0.25; combat.total++;
    chiffre('Il continue à pied !', new T.Vector3(x, y + 2.6, z), 'butin'); if (!combat.demonteVu) { combat.demonteVu = true; toast('Sa monture tombe, mais le ' + mo.d.nom + ' continue à pied !', 'alerte'); } }, 0); }
  if (mo.pv <= 0 && combat.arene && Math.random() < runeParMonstre(combat.arene.k) * (1 + caracs().prospection / 100)) { /* l'Arene : une rune, rarement, sur un monstre abattu (0,1 % des la vague 3, 0,25 % des la 10e, 0,5 % des la 15e) */
    runes().forge = (runes().forge || 0) + 1; combat.arene.runes.forge = (combat.arene.runes.forge || 0) + 1; son('niveau'); pouf(mo.x, mo.m.position.y, mo.z, 3, '#b48cff');
    chiffre('★ Rune de forgemagie !', new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.5, mo.z), 'butin'); toast('★ Une rune de forgemagie ! Elle t\'attend à l\'atelier de forgemagie.', 'or'); }
  if (mo.pv <= 0 && combat.arene && combat.genre !== 'ile' && !mo.d.boss && combat.arene.k >= 5) { const pros = 1 + caracs().prospection / 100; /* l'Arene : une piece de SA panoplie, des la 5e vague (0,25 % par monstre, jet de 50 % au moins ; 20/10/2026, « c'est pour la revente », Mathieu) */
    if (Math.random() < ITEM_MONSTRE_ARENE * pros) { const P = panoDe(statsArene(mo.type).p), id = tirerPiece(P, pros), cle = donnerObjet(id, JET_ARENE); combat.arene.objets.push(cle); son('niveau'); pouf(mo.x, mo.m.position.y, mo.z, 3, '#f2b630');
      chiffre((OBJETS[id].rare ? '★ RARE : ' : '+ ') + OBJETS[id].nom + ' !', new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.5, mo.z), 'butin'); toast((OBJETS[id].rare ? '★ PIÈCE RARE : ' : 'Butin : ') + OBJETS[id].nom + ' (jet ' + Math.round(100 * qualiteJet(cle)) + ' %) : dans ton sac.', 'or'); } }
  if (mo.pv <= 0) { if (combat.st) combat.st.tues++; noterTue(mo.type); compter('monstres'); son('touche'); if (combat.raid) { combat.tues++; if (mo.porte) { S_.grange[mo.porte.id] = (S_.grange[mo.porte.id] || 0) + mo.porte.n; (combat.recup = combat.recup || []).push(mo.porte); chiffre('+' + mo.porte.n + ' ' + mo.porte.nom, new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.3, mo.z), 'butin'); mo.porte = null; rendreGrange(); } combat.lootV = butinVoleur(mo.d.vole || 1, combat.lootV); } else butin(mo); mo.etat = 'mort'; mo.t = 0; mo.barre.remove(); pouf(mo.x, mo.m.position.y, mo.z, 2.5); if (combat.cible === mo) combat.cible = null; }
}
/* le butin : une ressource du monstre (35 %), parfois une piece d'equipement de la panoplie du palier (7 %, le boss : toujours la premiere fois) */
/* (le Bouftou des vagues 1 a 10 lache de la laine depuis le 14/10/2026 : « ouais applique », Mathieu ; il ne lachait aucune ressource) */
const RES_MONSTRE = { bwork: 'dent_bwork', bworkArcher: 'dent_bwork', bworkMage: 'dent_bwork', bworkette: 'dent_bwork', bworker: 'dent_bwork', tofu: 'plume', bouftou: 'laine', chafer: 'os_chafer', fantassin: 'os_chafer', gardien: 'os_chafer', archer: 'os_chafer', cuirasse: 'os_chafer', royal: 'laine' };
function butin(mo) {
  if (combat.genre === 'ile' || combat.arene) return; /* (15/10/2026, « j'ai gagne 51 branches de Kaliptus, ca fait beaucoup non ? » : sur l'ile des boss, aucun butin ; les recompenses sont dans le coffre de la semaine. L'Arene aussi depuis le 19/10/2026 : « le fait de loot des ressources, il faut le retirer », Mathieu, 78 Poils de Wabbit en une partie ; ses runes tombent a part, ses pieces sont dans les coffres des boss) */
  const L = combat.loot || (combat.loot = { res: {}, objets: [] }), pros = 1 + caracs().prospection / 100, r = mo.d.res || RES_MONSTRE[mo.type];
  if (r && Math.random() < (mo.d.boss ? 1 : 0.35) * pros) { const n = mo.d.boss ? 5 : 1; S_.grange[r] = (S_.grange[r] || 0) + n; L.res[r] = (L.res[r] || 0) + n; }
  const deja = S_.vague.num > combat.n, chance = mo.d.boss ? (deja ? 0.4 : 1) : (mo.type === 'tofu' ? 0.02 : 0.07) * pros;
  if (Math.random() < chance) {
    const id = tirerPiece(panoDe(palierDe(combat.n)), pros);
    L.objets.push(donnerObjet(id)); if (OBJETS[id].rare) { son('niveau'); pouf(mo.x, mo.m.position.y, mo.z, 3, '#f2b630'); }
    chiffre((OBJETS[id].rare ? '★ RARE : ' : '+ ') + OBJETS[id].nom, new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.3, mo.z), 'butin'); toast((OBJETS[id].rare ? '★ PIÈCE RARE : ' : 'Butin : ') + OBJETS[id].nom + ' ! Équipe-la dans la fiche du perso.', 'or'); rendreHaut();
  }
  const ar = mo.d.boss && ARMES[classeDe()], arme = ar && 'arme-' + ar[0] + '-' + panoDe(palierDe(combat.n)).id;
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
const pointValide = (x0, z0, x, z) => { const ok = (a, b) => { if (lieu === 'arene') return solSort(a, b); const q = caseIci(a, b); return q && PASSABLE[q.type]; }; /* (a l'Arene, son cercle : elle n'a pas de cases de ferme, tout y tombait a zero ; les Tortues roulaient sur place, « elles avancent pas », Mathieu, 29/10/2026) */ let k = 1; while (k > 0 && !ok(x0 + (x - x0) * k, z0 + (z - z0) * k)) k -= 0.05; k = Math.max(0, k); return { x: x0 + (x - x0) * k, z: z0 + (z - z0) * k }; };
function zoneDanger(o) {
  const c0 = combat, g = new T.Group(), mat0 = (op) => new T.MeshBasicMaterial({ color: o.couleur || (o.mo && o.mo.d.couleurSorts && o.mo.d.couleurSorts[0]) || '#e2413a', transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide });
  const d = o.r ? { x: o.x, z: o.z, r: o.r, a: o.a, ouv: o.ouv } : { x: o.x, z: o.z, x2: o.x2, z2: o.z2, larg: o.larg }; let fond, plein;
  if (o.r) { const a0 = o.ouv != null ? o.a - Math.PI / 2 - o.ouv : 0, da = o.ouv != null ? o.ouv * 2 : Math.PI * 2; /* (l'eventail : l'angle du jeu a devient a - pi/2 dans le disque couche) */
    fond = new T.Mesh(new T.CircleGeometry(o.r, 40, a0, da), mat0(0.3)); plein = new T.Mesh(new T.CircleGeometry(o.r, 40, a0, da), mat0(0.38)); const bord = new T.Mesh(new T.RingGeometry(o.r - 0.16, o.r, 48, 1, a0, da), mat0(0.95)); [fond, plein, bord].forEach((m) => { m.rotation.x = -Math.PI / 2; g.add(m); }); g.position.set(o.x, solA(o.x, o.z) + 0.07, o.z); }
  else { const L = Math.hypot(o.x2 - o.x, o.z2 - o.z) || 0.1; fond = new T.Mesh(new T.PlaneGeometry(o.larg, L), mat0(0.3)); plein = new T.Mesh(new T.PlaneGeometry(o.larg, L), mat0(0.38)); [fond, plein].forEach((m) => { m.geometry.translate(0, -L / 2, 0); m.rotation.x = -Math.PI / 2; g.add(m); }); g.rotation.y = Math.atan2(o.x2 - o.x, o.z2 - o.z); g.position.set(o.x, Math.max(solA(o.x, o.z), solA(o.x2, o.z2)) + 0.07, o.z); }
  g.children.forEach((m) => { m.renderOrder = 2; }); scene.add(g); (c0.dangers = c0.dangers || []).push(d); let t = 0;
  const fin = () => { jeter(g); const i = c0.dangers.indexOf(d); if (i >= 0) c0.dangers.splice(i, 1); return true; };
  effets.push((dt) => {
    t += dt; const k = Math.min(1, t / o.duree); if (o.r) plein.scale.setScalar(Math.max(0.01, k)); else plein.scale.y = Math.max(0.01, k); fond.material.opacity = 0.22 + 0.2 * Math.abs(Math.sin(t * 9));
    if (combat !== c0 || c0.fin || (o.mo && o.mo.etat !== 'actif')) return fin();
    if (t >= o.duree) { fin(); o.effet(d); return true; }
  });
  return d;
}
/* LE PALIER DES KOALAKS (14/10/2026) : ce que certains coups font en plus, la fumee du Koulosse, son appel, le Fossoyeur, le bandit */
function ouvrirEntracte() {
  const c = combat; if (!c || !c.entracte || !c.phases.length) return; const pc = Math.round(100 * c.pv / c.pvMax), p = c.phases[0]; S_.pots = S_.pots || {};
  const pots = Object.keys(POTS).filter((t) => (S_.pots[t] || 0) > 0).map((t) => { const P = POTS[t], non = (c.pv >= c.pvMax && !P.menthe && !P.citron && !P.agi) || (P.menthe && c.regen) || (P.citron && c.citron) || (P.agi && c.agi);
    return '<div class="art">' + ico('pot-' + t) + '<div><b>' + P.nom + ' ×' + S_.pots[t] + '</b><div class="puces"><span class="puce bonne">' + BREF_POT[t] + (P.menthe || P.citron || P.agi ? ' (jusqu\'à la fin du combat)' : '') + '</span></div></div><div class="act"><button class="btn kamas" data-entracte-pot="' + t + '"' + (non ? ' disabled' : '') + '>Boire</button></div></div>'; }).join('');
  const actifs = c.repasActifs || {}, jusqua = c.arene ? ' jusqu\'à la fin de la partie' : ' jusqu\'à la fin de la vague'; /* (un repas deja actif ne se reprend pas : il ne se cumule pas avec lui-meme, 20/10/2026) */
  const repas = CULTURES.filter((cu) => cu.mange && ((S_.grange[cu.id] || 0) > 0 || actifs[cu.id])).map((cu) => { const pris = !!actifs[cu.id];
    return '<div class="art">' + ico(cu.id) + '<div><b>' + cu.nom + (pris ? ' : déjà active' : '') + '</b><div class="puces"><span class="puce ' + (pris ? 'bonne' : '') + '">' + cu.mange.txt + jusqua + '</span><span class="puce">' + (S_.grange[cu.id] || 0) + ' en grange</span></div></div><div class="act">' +
      (pris ? '<span class="cadenas">✓ Active</span>' : '<button class="btn mini" data-entracte-manger="' + cu.id + '">Manger</button>') + '</div></div>'; }).join('');
  const choix = c.arene && c.arene.choix, pris = c.arene && c.arene.bonus ? Object.entries(c.arene.bonus) : []; /* (les bonus de l'Arene, toutes les 10 vagues) */
  const bonus = choix ? '<div class="hdv-section">Choisis une carte (une seule, tirée au hasard)</div><div class="bca-rang">' + choix.map((id, i) => carteArene(id, i, c.arene.choixVu)).join('') + '</div>' /* (les cartes, 20/10/2026) */
    : pris.length ? '<p class="hdv-aide">Tes bonus : ' + pris.map(([id, n]) => BONUS_ARENE[id].nom + (n > 1 ? ' ×' + n : '')).join(', ') + '.</p>' : '';
  if (choix) c.arene.choixVu = true; /* (re-dessinee apres un pot : les cartes restent retournees) */
  ouvrirModale('entracte', entete(c.arene ? 'Arène : ' + c.arene.tenues + ' vagues tenues, souffle un instant' : 'Vague ' + c.n + ' : souffle un instant') + '<p class="hdv-aide">Ce temps-là est nettoyé. Le suivant, <b>' + p.nom + '</b>, n\'attend que toi : ' + (choix ? 'choisis ta carte, ' : '') + 'bois un pot, mange une Cawotte ou une Fraise, puis lance-le.</p>' +
    '<div class="vie-alerte' + (pc < 40 ? ' bas' : '') + '"><div><b>Ta vie : ' + pc + ' %</b><div class="pvb"><i style="width:' + pc + '%"></i></div><small>' + Math.ceil(c.pv) + ' / ' + c.pvMax + ' PV' + (c.regen ? '. La Menthe te soigne pendant la vague.' : '') + '</small></div></div>' +
    bonus + (pots ? '<div class="hdv-section">Tes pots</div>' + pots : '<p class="hdv-aide">Tu n\'as plus de pot de gelée.</p>') + (repas ? '<div class="hdv-section">Manger</div>' + repas : '') +
    '<div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn kamas" data-entracte-suite' + (choix ? ' disabled' : '') + '>' + (choix ? 'Choisis d\'abord ta carte' : 'Lancer : ' + p.nom) + '</button></div>');
}
function boireEntracte(t) {
  const c = combat, P = POTS[t]; S_.pots = S_.pots || {}; if (!c || !c.entracte || !P || !(S_.pots[t] > 0)) return;
  const avant = c.pv; S_.pots[t]--; c.pv = Math.min(c.pvMax, c.pv + c.pvMax * P.soin); if (c.st) c.st.soins += c.pv - avant; if (P.menthe) c.regen = REGEN_MENTHE; if (P.citron) c.citron = true; if (P.agi) c.agi = P.agi; son('boire'); compter('pots');
  toast('Glou glou : ' + Math.round(100 * avant / c.pvMax) + ' % de vie, puis ' + Math.round(100 * c.pv / c.pvMax) + ' %' + (P.menthe ? ', et la Menthe te soigne jusqu\'à la fin.' : P.citron ? ', et tu cours plus vite jusqu\'à la fin.' : P.agi ? ', et +' + P.agi + ' Agilité jusqu\'à la fin.' : '.'), 'or'); rendreHaut(); sauver(); ouvrirEntracte();
}
function mangerEntracte(id) {
  const c = combat, cu = PAR_ID[id]; if (!c || !c.entracte || !cu || !cu.mange || (c.repasActifs || {})[id] || !((S_.grange[id] || 0) > 0)) return;
  S_.grange[id]--; c.repasEntracte[id] = true; (c.repasActifs = c.repasActifs || {})[id] = true; if (cu.mange.deg) c.boostDeg = (c.boostDeg || 0) + cu.mange.deg; if (cu.mange.pros) c.boostPros = (c.boostPros || 0) + cu.mange.pros;
  son('manger'); toast('Miam ! ' + cu.nom + ' : ' + cu.mange.txt + (c.arene ? ' jusqu\'à la fin de la partie.' : ' jusqu\'à la fin de la vague.'), 'or'); rendreGrange(); sauver(); ouvrirEntracte();
}
function tempsSuivant() {
  const c = combat; if (!c || !c.entracte || !c.phases.length) return; if (c.arene && c.arene.choix) prendreBonusArene(c.arene.choix[0]); /* (le bouton attend le choix ; les bots de test prennent le premier) */
  c.entracte = false; if (modaleOuverte === 'entracte') fermerModale();
  if (c.arene) { appliquerVagueArene(c, c.phases.shift()); return; }
  const p = c.phases.shift(); c.file = p.f; c.total += p.f.length; c.attente = 1.5; c.bords = null; son('vague'); toast((c.phases.length ? 'Deuxième temps' : 'Dernier temps') + ' : ' + p.nom + ' arrivent !', 'alerte');
}
function effetsCoup(mo) { /* la Momie ralentit, la pomme de la Reinette assomme, la baie de l'Indigo empoisonne */
  const c = combat; if (!c || c.fin || !mo || c.deroute != null) return; const d = mo.d, p = paysanMesh.position.clone(); p.y += 2.1;
  if (d.ralentit) { if (!c.lenteurVu) { c.lenteurVu = true; toast(leNom(d) + ' te ralentit à chaque coup : éloigne-toi !', 'alerte'); } c.lenteur = d.ralentit; }
  if (d.assomme) { c.assomme = d.assomme; chiffre('Assommé !', p, 'vol'); }
  if (d.poison) { (c.poisons = c.poisons || []).push({ pct: d.poison[0], t: d.poison[1] }); if (!c.poisonVuB) { c.poisonVuB = true; toast((d.poisonObjet || 'La baie') + ' du ' + d.nom + ' t\'empoisonne quelques secondes !', 'alerte'); } }
}
function poisonPerso(pct, dt) { /* des PV qui fondent, montres en un chiffre vert toutes les 0,6 s */
  const c = combat; if (!c || c.fin || c.deroute != null) return;
  c.poisonAcc = (c.poisonAcc || 0) + c.pvMax * pct * dt; const n = Math.floor(c.poisonAcc); if (n < 1) return;
  c.poisonAcc -= n; c.pv = Math.max(0, c.pv - n); if (c.st) c.st.recus += n; c.poisonCumul = (c.poisonCumul || 0) + n;
  if (performance.now() - (c.poisonT || 0) > 600) { const p = paysanMesh.position.clone(); p.y += 1.7; chiffre('-' + c.poisonCumul, p, 'perso'); c.poisonCumul = 0; c.poisonT = performance.now(); }
  if (c.pv <= 0) persoATerre();
}
function majAfflictions(dt) {
  const c = combat; if (!c) return;
  if (c.lenteur > 0) c.lenteur -= dt; if (c.assomme > 0) c.assomme -= dt; if (c.colle > 0) c.colle -= dt;
  if (c.poisons && c.poisons.length) { c.poisons.forEach((p) => { p.t -= dt; }); c.poisons = c.poisons.filter((p) => p.t > 0); const pct = c.poisons.reduce((a, p) => a + p.pct, 0); if (pct) poisonPerso(pct, dt); }
}
function cracherFumee(mo, x, z, r, duree, delai) { /* une boule de fumee part de sa bouche et s'ecrase au sol en nuage */
  const c0 = combat, de = new T.Vector3(mo.x, mo.m.position.y + mo.haut * 0.8, mo.z), vers = new T.Vector3(x, solA(x, z) + 0.4, z);
  const boule = new T.Mesh(new T.IcosahedronGeometry(0.4, 1), new T.MeshToonMaterial({ color: '#9ad86a', gradientMap: grad, transparent: true, opacity: 0.85 })); scene.add(boule); let t = -delai;
  effets.push((dt) => { t += dt / 0.6; if (combat !== c0 || c0.fin) { jeter(boule); return true; } if (t < 0) { boule.visible = false; return; } boule.visible = true;
    const k = Math.min(1, t); boule.position.lerpVectors(de, vers, k); boule.position.y += Math.sin(k * Math.PI) * 1.5;
    if (k >= 1) { jeter(boule); pouf(x, solA(x, z), z, 2.2, '#9ad86a'); poserFumee(x, z, r, duree, null); return true; } });
}
function poserFumee(x, z, r, duree, suit) { /* un nuage vert au sol (duree 0 : il suit le Koulosse jusqu'a la fin) ; il compte comme un danger, que le bot evite */
  const c = combat; if (!c || c.fin) return null; c.fumees = c.fumees || []; if (c.fumees.length >= 20) retirerFumee(c.fumees.find((f) => !f.suit) || c.fumees[0]);
  const g = new T.Group(), matF = new T.MeshToonMaterial({ color: '#a8de78', gradientMap: grad, transparent: true, opacity: 0.66, depthWrite: false });
  const sol = new T.Mesh(new T.CircleGeometry(r, 32), new T.MeshBasicMaterial({ color: '#6cc43c', transparent: true, opacity: 0.34, depthWrite: false, side: T.DoubleSide })); sol.rotation.x = -Math.PI / 2; sol.position.y = 0.06; sol.renderOrder = 2; g.add(sol);
  const bouffees = []; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + Math.random(), d = r * (0.15 + Math.random() * 0.65), m = new T.Mesh(new T.IcosahedronGeometry(0.45 + Math.random() * 0.4, 1), matF); m.position.set(Math.cos(a) * d, 0.4, Math.sin(a) * d); m.userData.p = Math.random() * 6; m.castShadow = false; g.add(m); bouffees.push(m); }
  g.position.set(x, solA(x, z), z); scene.add(g);
  const f = { x, z, r, fin: duree, t: 0, g, bouffees, suit, matF, danger: { x, z, r } }; c.fumees.push(f); (c.dangers = c.dangers || []).push(f.danger); return f;
}
function retirerFumee(f) { if (!f) return; jeter(f.g); const c = combat; if (!c) return; c.fumees = (c.fumees || []).filter((x) => x !== f); const i = (c.dangers || []).indexOf(f.danger); if (i >= 0) c.dangers.splice(i, 1); }
function majFumees(dt, s) { /* toucher un nuage : 2 s de poison tout de suite, puis 2 s de plus par seconde passee dedans ; le poison court encore une fois sorti (2 % des PV par seconde) */
  const c = combat; if (!c) return;
  if (c.poisonFumee > 0) { poisonPerso(0.02 * (c.genre === 'ile' ? 1 + ENRAGE_ILE.pas * c.arene.pas : 1), Math.min(dt, c.poisonFumee)); if (!combat || combat !== c) return; c.poisonFumee = Math.max(0, c.poisonFumee - dt); } /* (sur l'ile, la rage renforce aussi sa fumee) */
  if (!c.fumees || !c.fumees.length) { c.dansFumee = false; return; }
  const pp = paysanMesh.position; let dedans = false;
  c.fumees.slice().forEach((f) => {
    f.t += dt; if (f.suit) { if (f.suit.etat !== 'actif') { retirerFumee(f); return; } f.x = f.suit.x; f.z = f.suit.z; f.g.position.set(f.x, solA(f.x, f.z), f.z); f.danger.x = f.x; f.danger.z = f.z; }
    if (f.fin && f.t >= f.fin) { retirerFumee(f); return; }
    f.matF.opacity = 0.66 * Math.min(1, f.t / 0.6, f.fin ? Math.max(0, (f.fin - f.t) / 1.2) : 1);
    f.bouffees.forEach((m) => { m.position.y = 0.4 + Math.sin(s * 1.3 + m.userData.p) * 0.14; m.rotation.y += dt * 0.3; });
    if (Math.hypot(pp.x - f.x, pp.z - f.z) < f.r) dedans = true;
  });
  if (dedans) {
    if (!c.dansFumee) { c.dansFumee = true; c.fumeeT = 0; c.poisonFumee = (c.poisonFumee || 0) + 2; if (!c.poisonFumeeVu) { c.poisonFumeeVu = true; toast('Empoisonné par la fumée : 2 s de poison dès que tu la touches, puis 2 s de plus par seconde passée dedans (2 % de tes PV par seconde) !', 'alerte'); } } /* (le premier contact compte pour une seconde) */
    else { c.fumeeT += dt; while (c.fumeeT >= 1) { c.fumeeT -= 1; c.poisonFumee += 2; } }
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
function attirerPerso(mo) { /* l'appel du Koulosse : le perso glisse jusqu'a lui */
  const p = paysanMesh.position, a = Math.atan2(p.x - mo.x, p.z - mo.z), f = pointValide(mo.x, mo.z, mo.x + Math.sin(a) * 2.4, mo.z + Math.cos(a) * 2.4), x0 = p.x, z0 = p.z, c0 = combat; let t = 0;
  chemin = []; arrivee = null; pouf(x0, p.y, z0, 1.4, '#7ad04a'); const q = p.clone(); q.y += 2.1; chiffre('Attiré !', q, 'vol');
  effets.push((dt) => { t += dt / 0.35; if (combat !== c0) return true; const k = Math.min(1, t); paysanMesh.position.x = x0 + (f.x - x0) * k; paysanMesh.position.z = z0 + (f.z - z0) * k; if (k >= 1) { const c = caseIci(f.x, f.z); if (c) paysanMesh.userData.cellule = c; return true; } });
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
function blesserPerso(n, mo) {
  if (!combat || combat.fin || combat.deroute != null) return; /* (a terre, plus rien ne l'atteint) */
  if (combat.invincible > 0) { if ((blesserPerso.inv || 0) < performance.now()) { blesserPerso.inv = performance.now() + 400; const p = paysanMesh.position.clone(); p.y += 1.7; chiffre('Invincible', p, 'perso'); } return; } /* l'ulti du Iop (18-geliere.js) */
  { const e = Math.min(0.5, 0.1 * nbBonus('esquive')); if (e && Math.random() < e) { const p = paysanMesh.position.clone(); p.y += 1.7; chiffre('Esquive !', p, 'perso'); return; } } /* (le bonus Esquive de l'Arene) */
  if (!combat.raid) n = Math.max(1, Math.round(n * multDegats(combat.n)));
  if (legPorte('chafer')) { n = Math.max(1, Math.round(n * 0.9)); if (mo && mo.etat === 'actif') { const r = Math.max(1, Math.round(n * 0.1)); blesser(mo, r); } } /* Heaume du Chafer Cuirasse : -10 %, et 10 % renvoyes au corps a corps */
  if (classeDe() === 'iop') { n = Math.max(1, Math.round(n * (1 - PEAU_IOP))); peauDeIop(); } /* Peau de Iop : 15 % de degats en moins (et un bouclier dore qui s'eclaire, 22b-effets.js) */
  if (combat.st) combat.st.recus += Math.min(n, combat.pv); combat.pv = Math.max(0, combat.pv - n); const p = paysanMesh.position.clone(); p.y += 1.7; chiffre('-' + n, p, 'perso');
  if (combat.pv <= 0) persoATerre(); /* a terre : les monstres saccagent la ferme avant de repartir */
}
/* LE TEMPS POUR ESQUIVER les elans des monstres, du signal (rond ou bande rouge) au coup (18/10/2026, « entre 1,5 et 2 secondes », Mathieu) */
const DUREE_COLLE = 1.5; /* colle dans la boue du Dragon Cochon (20/10/2026) */
const ESQUIVE = { saut: 1.5, charge: 1.5, grandeCharge: 1.7, bond: 2, pluie: 1.4, cawotteRoyale: 0.8, boue: 1.5, brassard: 1.5, bourrasque: 1.1 }, /* (pluie et Cawotte royale du Wa Wabbit : 1,2 et 0,5 s avant le 19/10/2026) */ secondes = (x) => String(x).replace('.', ',') + ' s';
const SAUT_PORTEE = 3 * S, SAUT_VOL = 0.6, SAUT_PREPA = ESQUIVE.saut - SAUT_VOL, AGRIPPE = 1.5; let SAUT_RECHARGE = 6; /* (let : les tests le mettent a Infinity pour comparer sans bond) */
const peutSauter = (mo) => !mo.d.distance && !mo.d.boss && !mo.d.vole && !mo.d.bandit && !mo.d.roule && !mo.d.charge && !mo.d.pique && mo.d.vitesse < 2.5 && (!mo.d.grignote || mo.aggro); /* (les rapides n'en ont pas besoin ; ceux qui chargent ou piquent ont leur elan a eux) */
const ELANS = { bouftou: 'charge', boufcoul: 'charge', craqueleur: 'charge', craqCristal: 'charge', chevaucheurKoalak: 'charge', dragNoir: 'pique', dragDore: 'pique' };
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
function capRage(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.rage && !mo.enrage && !(mo.d.affaibli && m0Anim(mo) && !mo.faibleFini) && mo.pv < mo.pvMax * (combat.difficile ? DUR.rage : 0.3)) { /* (Moon : sa rage vient apres ses Gorilles, finFaible) */ mo.enrage = true; pouf(mo.x, mo.m.position.y, mo.z, 3, '#e2413a');
    if (mo.d.calumet) { mo.deg = Math.round(mo.deg * 1.25); if (mo.deg0 != null) mo.deg0 = Math.round(mo.deg0 * 1.25); /* (sur l'ile, la rage repart de deg0 : le calumet y reste) */ poserFumee(mo.x, mo.z, 2.8, 0, mo); toast('Le Koulosse tire sur son calumet de la paix : il s\'entoure de fumée, frappe plus fort et bien plus vite. Ne reste pas collé à lui !', 'alerte'); }
    else toast(leNom(mo.d) + ' entre en rage : ' + (mo.d.fem ? 'elle' : 'il') + ' frappe bien plus vite !', 'alerte'); }
}
function capProtege(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.protege) { /* le Craqueleur de Cristal : un bouclier de cristal sur trois monstres autour de lui (-40 % de degats, 4 s) */
    mo.protT = (mo.protT || 0) + dt;
    if (mo.protT >= mo.d.protege) { mo.protT = 0; combat.monstres.filter((o) => o !== mo && o.etat === 'actif' && Math.hypot(o.x - mo.x, o.z - mo.z) < 7).sort((a, c) => a.pv / a.pvMax - c.pv / c.pvMax).slice(0, 3).forEach((o) => { o.bouclier = 4; pouf(o.x, o.m.position.y, o.z, 1.4, '#6fe0e8'); }); }
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
    geyserEau(x0, y, z0, R, C, petit); if (!petit) secousse(0.12, 0.3);
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
function capTroupe(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.boss) { /* sa troupe : il la rappelle toutes les 16 s (deux monstres, s'il n'en a pas deja 6 debout), et elle le protege tant qu'elle est pres de lui */
    if (mo.renfortT == null) mo.renfortT = 4; /* (le premier rappel 12 s apres son arrivee) */
    if (mo.d.renforts && sortPret('renfortT', combat.difficile ? DUR.rappel : RAPPEL_TROUPE)) {
      mo.renfortT = 0;
      if (combat.monstres.filter((o) => o !== mo && o.etat !== 'mort' && !o.d.boss).length < (combat.difficile ? DUR.troupe : TROUPE_MAX)) {
        const rf = (mo.enrage && mo.d.renfortsRage) || mo.d.renforts; /* (le Chafer Cuirasse enrage appelle des Archers) */
        if (!combat.rappelVu) { combat.rappelVu = true; toast(leNom(mo.d) + ' appelle deux ' + rf[1] + ' : ' + (mo.d.fem ? 'elle' : 'il') + ' en rappellera toutes les ' + RAPPEL_TROUPE + ' s tant qu\'' + (mo.d.fem ? 'elle' : 'il') + ' sera debout !', 'alerte'); }
        else if (rf !== mo.d.renforts && !combat.rappelRageVu) { combat.rappelRageVu = true; toast(leNom(mo.d) + ' enragé appelle maintenant des ' + rf[1] + ' : ils tirent de loin !', 'alerte'); }
        else chiffre('Renforts !', new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.4, mo.z), 'butin');
        mo.frappe = 0.3; for (let k = 0; k < 2; k++) { const a = k * 2.6 + 0.4 + Math.random(); apparaitre(rf[0], { x: mo.x + Math.cos(a) * 1.8, z: mo.z + Math.sin(a) * 1.8 }); combat.total++; }
      }
    }
    const pr = protectionBoss(mo); if (pr > 0 && !(mo.protege > 0) && !combat.protegeVu) { combat.protegeVu = true; toast('Sa troupe protège ' + leNom(mo.d, true) + ' : chaque monstre près ' + (mo.d.fem ? 'd\'elle' : 'de lui') + ' lui retire 12 % de tes dégâts. Dégage-les, puis frappe le boss !', 'alerte'); }
    mo.protege = pr;
    if (!mo.halo) { mo.halo = new T.Mesh(new T.RingGeometry(0.55, 0.72, 40), new T.MeshBasicMaterial({ color: '#f2d27a', transparent: true, opacity: 0.8, side: T.DoubleSide, depthWrite: false })); mo.halo.rotation.x = -Math.PI / 2; mo.halo.position.y = 0.08; mo.halo.scale.setScalar(Math.max(1, mo.d.ombre * 0.8)); m.add(mo.halo); }
    mo.halo.visible = pr > 0; if (pr > 0) mo.halo.material.opacity = 0.35 + pr; /* le halo dore : plus il est vif, plus il est protege */
  }
}
function capCharge(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.charge || mo.d.pique) { /* le Bouftou Royal baisse la tete : une bande rouge jusqu'a toi (ESQUIVE.grandeCharge pour en sortir), puis il fonce et renverse tout sur son passage ;
       les petits monstres qui chargent, et les Dragoeufs qui piquent (15/10/2026), font pareil, de plus pres (3 cases), en ESQUIVE.charge */
    const piq = !!mo.d.pique, per = mo.d.charge || mo.d.pique, petit = !mo.d.boss && !!mo.d.chargeMax, prepa = petit ? ESQUIVE.charge : ESQUIVE.grandeCharge;
    if (petit && mo.chargeT == null) mo.chargeT = Math.random() * per * 0.7; /* (pas tous en meme temps) */
    const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
    if (sortPret('chargeT', per) && dP > (petit ? mo.d.portee + 0.8 : 1.2) && dP < (mo.d.chargeMax || 10) && (!petit || mo.chasse) && !(combat.colle > 0)) { /* (jamais quand le perso est colle : il doit pouvoir sortir de la bande, 20/10/2026) */
      mo.chargeT = 0; const a = Math.atan2(pp.x - mo.x, pp.z - mo.z), L = Math.min(petit ? mo.d.chargeMax + 1.5 : 10, dP + (petit ? 1.2 : 2.5)), f = pointValide(mo.x, mo.z, mo.x + Math.sin(a) * L, mo.z + Math.cos(a) * L);
      /* « si il y a un batiment entre deux, que ca endommage le batiment » (Mathieu, 12/10/2026) : il s'ecrase sur le premier batiment de sa route, la bande
         rouge s'arrete la ; cache derriere, le perso ne prend rien */
      let cleB = null; { const L0 = Math.hypot(f.x - mo.x, f.z - mo.z), bats = clesBats().filter((k) => !enRuine(k)).map((k) => [k, zoneBat(k)]).filter(([, z]) => z);
        for (let d = 1.2; d <= L0 && !cleB; d += 0.2) { const x = mo.x + Math.sin(a) * d, z = mo.z + Math.cos(a) * d, b = bats.find(([, zb]) => Math.abs(x - zb.x) < zb.hw + 0.2 && Math.abs(z - zb.z) < zb.hd + 0.2);
          if (b) { cleB = b[0]; const d2 = Math.max(0.5, d - 0.4); f.x = mo.x + Math.sin(a) * d2; f.z = mo.z + Math.cos(a) * d2; } } }
      mo.ry = a; mo.bloqueT = prepa + 0.6; mo.frappe = 0.3; gesteSort(mo, gesteDe(mo, 'charge', 'bond'), prepa + (mo.d.poings ? 0.45 : 0.25)); /* (le Gorille retombe poings au sol au bout de sa ruee) */
      if (piq) { let t0 = 0; effets.push((dt2) => { t0 += dt2; if (!combat || combat.fin || mo.etat !== 'actif') { mo.hop = 0; return true; } mo.hop = 1.7 * Math.min(1, t0 / prepa); return t0 >= prepa; }); } /* le Dragoeuf prend de la hauteur */
      if (!combat[piq ? 'piqueVu' : 'chargeVu']) { combat[piq ? 'piqueVu' : 'chargeVu'] = true; toast(piq ? leNom(mo.d) + ' prend son envol pour piquer sur toi : sors de la bande rouge, ou cache-toi derrière un bâtiment !' : leNom(mo.d) + (mo.d.poings ? ' se rue sur toi' : ' baisse la tête') + ' : sors de la bande ' + teinteSorts(mo.d, true) + ' !', 'alerte'); }
      zoneDanger({ mo, x: mo.x, z: mo.z, x2: f.x, z2: f.z, larg: petit ? 1.3 : 1.9, duree: prepa, effet: () => {
        const x0 = mo.x, z0 = mo.z; let t = 0, touche = false;
        effets.push((dt2) => { t += dt2; const k = Math.min(1, t / (piq ? 0.4 : 0.45)); if (!combat || combat.fin || mo.etat !== 'actif') { mo.hop = 0; return true; } mo.x = x0 + (f.x - x0) * k; mo.z = z0 + (f.z - z0) * k;
          if (piq) mo.hop = 1.7 * (1 - k) * (1 - k); else if (Math.random() < 0.5) pouf(mo.x, solA(mo.x, mo.z), mo.z, 0.9, '#d8c8a8');
          const p2 = paysanMesh.position; if (!touche && (!piq || k > 0.5) && Math.hypot(p2.x - mo.x, p2.z - mo.z) < (petit ? 1.1 : 1.3)) { touche = true; blesserPerso(Math.round(degSort(mo) * ((mo.d.sortsX || {}).charge || 1)), mo); if (mo.d.menotte) coller(mo.d.menotte, 'Menotté !'); }
          if (k >= 1) { mo.hop = 0; mo.bloqueT = cleB ? 0.8 : 0.25; pouf(mo.x, solA(mo.x, mo.z), mo.z, 2.2, '#d8c8a8');
            const an = mo.d.poings && mo.m.userData.anim; if (an && an.frappe) { const q = an.frappe().p; impactMarteau(q.x, solA(q.x, q.z), q.z, mo.d.couleurSorts); } /* (le Gorille : ses poings au sol, 31/10/2026) */
            if (cleB && combat && !combat.fin) { pouf(f.x, solA(f.x, f.z) + 0.6, f.z, 3, '#8e7a5e'); blesserBat(cleB, degatsBatiment(1, mo)); if (!combat.chargeBatVu) { combat.chargeBatVu = true; chiffre('Bam !', new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.3, mo.z), 'gros'); } } /* sonne, il reste un instant sur place */
            return true; } });
      } });
    }
  }
}
function capBond(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.bondit) { /* le Bworker vise ou tu es : un cercle rouge au sol, il saute et ecrase tout dedans en retombant */
    const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
    const loin = mo.d.bonditLoin ? mo.d.portee * (mo.allonge || 1) + 0.6 : 1.5; /* (bonditLoin, le Gorille roi : il ne saute que pour revenir au corps a corps) */
    const vise = !!(mo.d.marteau || mo.d.poings); /* (Moon et le Gorille roi, 31/10/2026) */
    if (sortPret('bonditT', mo.d.bondit) && dP > (vise ? Math.max(loin, 4.5) : loin) && dP < 11) { /* (Moon ne bondit plus de pres : il atterrit a la longueur de son marteau du point vise) */
      if (vise && m.userData.anim) { mo.bonditT = 0; bondMarteau(mo, pp.x, pp.z); return; } /* (Moon, le Gorille : 22c-squelettes.js) */
      mo.bonditT = 0; const cx = pp.x, cz = pp.z, x0 = mo.x, z0 = mo.z, R = mo.d.bonditR || (mo.d.marteau ? 2.8 : 2.3); mo.ry = Math.atan2(cx - x0, cz - z0); mo.bloqueT = ESQUIVE.bond + 0.3; /* (bonditR : le pique de la Gorgouille, 31/10/2026) */
      const an = m.userData.anim, H = an ? 1.2 : 2.8; /* (un monstre a squelette : son geste de saut, recale pour retomber a la fin du cercle ; le saut du geste porte deja une partie de la hauteur, 27/10/2026) */
      const fb = gesteDe(mo, 'bondit', 'bond');
      if (an && an.F[fb]) { const nom = piocher(an, fb), D = an.A[nom].getClip().duration, imp = ((m.userData.impacts || {})[nom] || [])[0], ts = Math.max(0.6, (imp ? imp.t : D * 0.6) / ESQUIVE.bond), a = jouerAnim(an, nom, 0.1); a.timeScale = ts; mo.geste = { t: 0, d: Math.min(D / ts, ESQUIVE.bond + 0.5) }; }
      if (!combat.bonditVu) { combat.bonditVu = true; toast(leNom(mo.d) + ' va te sauter dessus : sors du cercle rouge !', 'alerte'); }
      let t = 0; effets.push((dt2) => { t += dt2; if (!combat || combat.fin || mo.etat !== 'actif') { mo.hop = 0; return true; } if (t > ESQUIVE.bond - 0.6) { const k = Math.min(1, (t - (ESQUIVE.bond - 0.6)) / 0.6); mo.x = x0 + (cx - x0) * k; mo.z = z0 + (cz - z0) * k; mo.hop = Math.sin(k * Math.PI) * H; } if (t >= ESQUIVE.bond) { mo.hop = 0; return true; } });
      zoneDanger({ mo, x: cx, z: cz, r: R, duree: ESQUIVE.bond, effet: (d) => { mo.frappe = 0.4; pouf(cx, solA(cx, cz), cz, 7, '#8e7a5e'); pouf(cx, solA(cx, cz), cz, 3.5, '#c9b28a'); if (mo.d.marteau) impactMarteau(cx, solA(cx, cz), cz);
        const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) blesserPerso(Math.round(degSort(mo) * ((mo.d.sortsX || {}).bond || 1)), mo); } });
    }
  }
}
/* la lance prend de la force en volant (29/10/2026, « plus tu es loin, plus tu prends de degats, prorata par case d'eloignement, dans toutes les directions,
   jusqu'a x2 ou x3 au max a la distance max », Mathieu) : la distance du lanceur a toi au moment de l'impact, en vraie ligne droite (une diagonale compte
   pour sa longueur), en cases ; lanceLoin : { parCase, max } dans la fiche, rien sinon */
const lanceDeLoin = (mo, dist) => { const L = mo.d.lanceLoin; return L ? Math.min(L.max, 1 + L.parCase * Math.max(0, dist / S - 2)) : 1; };
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
      zoneDanger({ mo, x: mo.x, z: mo.z, x2: f.x, z2: f.z, larg: 1.3, duree: 1.0, effet: (d) => {
        mo.frappe = 0.4; const y0 = mo.m.position.y + mo.haut * 0.6, de = new T.Vector3(mo.x, y0, mo.z), vers = new T.Vector3(f.x, solA(f.x, f.z) + 0.7, f.z);
        const os = mo.d.projectile === 'rocher' ? new T.Mesh(new T.DodecahedronGeometry(0.5, 0), mat('#d9d4c4')) /* (le rocher de lune du Golem lunaire, 28/10/2026) */ : mo.d.projectile === 'sagaie' ? sagaieVolante() : new T.Mesh(new T.CylinderGeometry(0.06, 0.09, 1.5, 6), new T.MeshLambertMaterial({ color: '#efe6cf' })); os.rotation.order = 'YXZ'; if (mo.d.projectile === 'sagaie') os.rotation.set(0, a, 0); else os.rotation.set(Math.PI / 2, a, 0); scene.add(os); /* (la sagaie de Jav, ou la lance d'os du Chafer) */
        const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) { const k = lanceDeLoin(mo, Math.hypot(p2.x - d.x, p2.z - d.z)); blesserPerso(Math.round(degSort(mo) * k), mo); if (k >= 1.5) chiffre('De loin ×' + String(Math.round(k * 10) / 10).replace('.', ','), new T.Vector3(p2.x, p2.y + 2.6, p2.z), 'gros'); }
        if (cleB && combat && !combat.fin) blesserBat(cleB, degatsBatiment(1, mo));
        let t = 0; effets.push((dt2) => { t += dt2 / 0.25; os.position.lerpVectors(de, vers, Math.min(1, t)); if (t >= 1) { jeter(os); pouf(vers.x, vers.y - 0.5, vers.z, 1.4, mo.d.projectile === 'sagaie' ? '#a8a294' : '#efe6cf'); return true; } });
      } });
    }
  }
}
function capCarapace(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.carapace) { /* le Chafer Cuirasse se replie sous sa carapace d'epines : 3,5 s presque invulnerable, il renvoie un cinquieme des coups du perso */
    if (mo.carapace > 0) mo.carapace -= dt;
    else if (sortPret('carapaceT', mo.d.carapace)) { mo.carapaceT = 0; mo.carapace = 3.5; pouf(mo.x, mo.m.position.y, mo.z, 3, '#f2d27a'); if (mo.d.gestes && mo.d.gestes.carapace) gesteSort(mo, mo.d.gestes.carapace); if (!combat.carapaceVu) { combat.carapaceVu = true; toast(leNom(mo.d) + ' ' + (mo.d.carapaceTexte || 'se replie sous sa carapace d\'épines : il renvoie tes coups, frappe ses soldats en attendant !'), 'alerte'); } }
    if (!mo.bulleC) { mo.bulleC = new T.Mesh(new T.IcosahedronGeometry(1, 1), new T.MeshBasicMaterial({ color: '#f2d27a', transparent: true, opacity: 0.32, depthWrite: false, wireframe: false })); m.add(mo.bulleC); }
    mo.bulleC.visible = mo.carapace > 0; if (mo.bulleC.visible) { mo.bulleC.scale.setScalar(mo.haut * 0.62 * (1 + 0.04 * Math.sin(s * 10))); mo.bulleC.position.y = mo.haut * 0.45; mo.bulleC.rotation.y += dt * 0.8; }
  }
}
function capSeisme(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.seisme) { /* le Craqueleur Legendaire frappe le sol : un cercle rouge s'annonce autour de lui (1,3 s pour en sortir), puis l'onde de choc, sur le perso et les batiments */
    if (sortPret('seismeT', mo.d.seisme) && (!mo.d.seismeProche || Math.hypot(pp.x - mo.x, pp.z - mo.z) <= (mo.d.seismeR || 4.5) + mo.d.seismeProche)) { /* (seismeProche, 29/10/2026 : il attend que tu sois a portee, sinon le sort part dans le vide ; le sort reste pret) */
      mo.seismeT = 0; const R = mo.d.seismeR || 4.5, duree = mo.d.seismeDuree || 1.3, x0 = mo.x, z0 = mo.z; mo.bloqueT = duree + 0.3; gesteSort(mo, gesteDe(mo, 'seisme', 'sort'), duree); /* (le rayon et le temps : ceux du Craqueleur Legendaire, ou de la fiche ; l'ecrasement du Dragon Cochon, 20/10/2026) */
      if (!combat.seismeVu) { combat.seismeVu = true; toast((mo.d.seismeNom || 'Séisme') + ' ! ' + leNom(mo.d) + ' va frapper le sol : sors du cercle ' + teinteSorts(mo.d) + '.', 'alerte'); }
      zoneDanger({ mo, x: x0, z: z0, r: R, duree, effet: (d) => {
        const an = mo.d.poings && mo.m.userData.anim; if (an && an.frappe) { const q = an.frappe().p, y = mo.m.position.y; impactMarteau(q.x, y, q.z, mo.d.couleurSorts); onde(x0, y, z0, R, (mo.d.couleurSorts || [])[1] || '#fff3d6', 0.6, 0.8); } /* (le Gorille : ses deux poings au sol, 31/10/2026) */
        pouf(x0, mo.m.position.y, z0, 9 * R / 4.5, '#8e7a5e'); pouf(x0, mo.m.position.y, z0, 5 * R / 4.5, '#c9b28a'); mo.frappe = 0.4;
        const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) { blesserPerso(Math.round(degSort(mo) * ((mo.d.sortsX || {}).seisme || 1)), mo); if (mo.d.repousse && combat && !combat.fin) repousserPerso(mo, mo.d.repousse); }
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
      const a = Math.atan2(pp.x - mo.x, pp.z - mo.z); mo.ry = a;
      const c = new T.Mesh(new T.CircleGeometry(7, 24, Math.PI / 2 - 0.5, 1.0), new T.MeshBasicMaterial({ color: '#ff5a1e', transparent: true, opacity: 0.25, depthWrite: false, side: T.DoubleSide }));
      c.rotation.set(-Math.PI / 2, 0, a - Math.PI); c.position.set(mo.x, mo.m.position.y + 0.06, mo.z); c.renderOrder = 2; scene.add(c);
      effets.push(() => { if (!combat || mo.etat !== 'actif' || !mo.vise) { jeter(c); if (mo.vise && mo.vise.c === c) mo.vise = null; return true; } }); /* le cone disparait si elle tombe avant de cracher */
      mo.vise = { a, t: 0, c };
      if (!combat.souffleVu) { combat.souffleVu = true; toast('Crocabulia prend son souffle : sors du cône rouge !', 'alerte'); }
    }
    if (mo.vise) { mo.vise.t += dt; mo.vise.c.material.opacity = 0.2 + 0.25 * Math.abs(Math.sin(mo.vise.t * 9)); }
    if (mo.vise && mo.vise.t >= 1.0) {
      const a = mo.vise.a; jeter(mo.vise.c); mo.vise = null; mo.souffleT = 0; souffleFeu(mo, a);
      const dans = (x, z) => { const d = Math.hypot(x - mo.x, z - mo.z); let e = Math.atan2(x - mo.x, z - mo.z) - a; e = Math.atan2(Math.sin(e), Math.cos(e)); return d < 7 && Math.abs(e) < 0.5; };
      if (dans(pp.x, pp.z)) blesserPerso(degSort(mo), mo);
      clesBats().forEach((k) => { const z = zoneBat(k); if (z && !enRuine(k) && dans(z.x, z.z)) blesserBat(k, degatsBatiment(1, mo)); });
      if (!combat || combat.fin) return;
    }
  }
}
function capPluie(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.pluie && combat.deroute == null) { /* le Wa Wabbit fait pleuvoir des cawottes explosives : des cercles au sol, une seconde pour en sortir */
    if (mo.pluieT == null) mo.pluieT = mo.d.pluie - 3; mo.pluieT += vSort;
    if (mo.pluieT >= mo.d.pluie) {
      mo.pluieT = 0; mo.frappe = 0.4;
      gesteSort(mo, 'tir'); const fleches = !!mo.d.pluieFleches; /* (Ark : une pluie de flèches, 25/10/2026) */
      if (!combat[fleches ? 'pluieFVu' : 'pluieVu']) { combat[fleches ? 'pluieFVu' : 'pluieVu'] = true; toast(fleches ? leNom(mo.d) + ' tire une pluie de flèches : sors des cercles rouges !' : 'Le Wa Wabbit fait pleuvoir des cawottes explosives : sors des cercles orange !', 'alerte'); }
      [[pp.x, pp.z]].concat([0, 1, 2, 3].map(() => [pp.x + (Math.random() - 0.5) * 7, pp.z + (Math.random() - 0.5) * 7])).forEach(([x, z]) => {
        const cel = caseIci(x, z), y = cel ? hauteurSol(x, z, cel) : 0, c0 = combat, dz = { x, z, r: 1.3 }; (c0.dangers = c0.dangers || []).push(dz); const oter = () => { const i = c0.dangers.indexOf(dz); if (i >= 0) c0.dangers.splice(i, 1); };
        const rond = new T.Mesh(new T.CircleGeometry(1.3, 24), new T.MeshBasicMaterial({ color: fleches ? '#e2413a' : '#f08a24', transparent: true, opacity: 0.3, depthWrite: false, side: T.DoubleSide })); rond.rotation.x = -Math.PI / 2; rond.position.set(x, y + 0.07, z); rond.renderOrder = 2; scene.add(rond);
        const cw = fleches ? volee() : new T.Mesh(new T.ConeGeometry(0.2, 0.7, 8), new T.MeshBasicMaterial({ color: '#f08a24' })); if (!fleches) cw.rotation.x = Math.PI; scene.add(cw); let t = 0;
        effets.push((dt2) => {
          t += dt2; rond.material.opacity = 0.2 + 0.25 * Math.abs(Math.sin(t * 9)); cw.position.set(x, y + 0.35 + 9 * Math.max(0, 1 - t / ESQUIVE.pluie), z);
          if (!combat || combat.fin) { jeter(rond); jeter(cw); oter(); return true; }
          if (t >= ESQUIVE.pluie) { jeter(rond); jeter(cw); oter(); if (fleches) { pouf(x, y, z, 2.2, '#c9b28a'); fichees(x, y, z); } else { pouf(x, y, z, 3, '#f08a24'); pouf(x, y, z, 1.6, '#ffd04a'); } const p2 = paysanMesh.position; if (Math.hypot(p2.x - x, p2.z - z) < 1.3) blesserPerso(degSort(mo), mo); return true; }
        });
      });
      if (!combat || combat.fin) return;
    }
  }
}
/* la Bourrasque d'Ark (31/10/2026, « des sorts de fleche et de vent », Mathieu, qui l'a choisie parmi quatre) : face a toi, il bande son arc pendant
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
  mo.ry = a; mo.bloqueT = duree + 0.35; mo.cd = Math.max(mo.cd || 0, duree + 0.6); mo.frappe = 0.3; gesteSort(mo, 'tir', duree);
  if (!c0.bourrasqueVu) { c0.bourrasqueVu = true; toast(leNom(mo.d) + ' bande son arc : sors du cône rouge, sa bourrasque te repousse et te ralentit !', 'alerte'); }
  zoneDanger({ mo, x: x0, z: z0, r: R, a, ouv: OUV_BOURRASQUE, duree, effet: (d) => {
    const p0 = (mainSquelette(mo) || new T.Vector3(x0, mo.m.position.y + 1.2, z0)); bourrasqueVent(p0, solA(x0, z0), a, R, OUV_BOURRASQUE);
    const p2 = paysanMesh.position; if (!dansDanger(d, p2.x, p2.z)) return;
    blesserPerso(Math.max(1, Math.round(degSort(mo) * ((mo.d.sortsX || {}).bourrasque || 1))), mo); if (!combat || combat.fin) return;
    repousserPerso(mo, RECUL_BOURRASQUE); c0.lenteur = Math.max(c0.lenteur || 0, LENTEUR_BOURRASQUE); } });
}
/* la pluie de flèches d'Ark : une volée de cinq flèches qui tombe sur le cercle, puis reste fichée au sol un instant */
const volee = () => { const g = new T.Group(); for (let i = 0; i < 5; i++) { const f = boite(0.03, 0.6, 0.03, '#8a5a30'), p = new T.Mesh(new T.ConeGeometry(0.05, 0.14, 4), mat('#a8a294')); p.rotation.x = Math.PI; p.position.y = -0.36; f.add(p); f.position.set(Math.sin(i * 2.4) * 0.5 * (i % 3) / 2, 0.3, Math.cos(i * 2.4) * 0.5 * (i % 3) / 2); f.rotation.z = (i - 2) * 0.06; g.add(f); } return g; };
function fichees(x, y, z) { const g = volee(); g.position.set(x, y - 0.12, z); fxVie(g, 1.6, (k) => { g.position.y = y - 0.12 - Math.max(0, k - 0.6) * 1.2; }); }
function capCawotteRoyale(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.cawotteRoyale && combat.deroute == null) { /* la Cawotte royale du Wa Wabbit : une petite cible te suit, se fige, puis la cawotte geante s'abat */
    const V0 = mo.royVise;
    if (!V0) { if (mo.royT == null) mo.royT = mo.d.cawotteRoyale - 5; mo.royT += vSort; }
    if (!V0 && mo.royT >= mo.d.cawotteRoyale) {
      mo.royT = 0; mo.frappe = 0.4; const R = 0.95, c0 = combat;
      const rond = new T.Mesh(new T.RingGeometry(R - 0.14, R, 32), new T.MeshBasicMaterial({ color: '#e2413a', transparent: true, opacity: 0.9, depthWrite: false, side: T.DoubleSide })); rond.rotation.x = -Math.PI / 2; rond.renderOrder = 3;
      const fond = new T.Mesh(new T.CircleGeometry(R, 28), new T.MeshBasicMaterial({ color: '#e2413a', transparent: true, opacity: 0.25, depthWrite: false, side: T.DoubleSide })); fond.rotation.x = -Math.PI / 2; fond.renderOrder = 2;
      const cw = new T.Group(), corps = new T.Mesh(new T.ConeGeometry(0.42, 1.6, 10), new T.MeshLambertMaterial({ color: '#f08a24' })); corps.rotation.x = Math.PI; cw.add(corps);
      for (let k = 0; k < 3; k++) { const f = new T.Mesh(new T.ConeGeometry(0.1, 0.6, 5), new T.MeshLambertMaterial({ color: '#4fae3a' })); f.position.set((k - 1) * 0.14, 1.0, 0); f.rotation.z = (k - 1) * 0.4; cw.add(f); }
      cw.visible = false; scene.add(rond, fond, cw);
      mo.royVise = { t: 0, x: pp.x, z: pp.z, rond, fond, cw, d: null, R, c0 };
      if (!combat.royVu) { combat.royVu = true; toast('La Cawotte royale du Wa Wabbit : la cible rouge te suit, puis se fige. File, sinon la cawotte géante t\'assomme !', 'alerte'); }
    }
    const V = mo.royVise;
    if (V) {
      const fin = () => { jeter(V.rond, V.fond, V.cw); if (V.d && V.c0.dangers) { const i = V.c0.dangers.indexOf(V.d); if (i >= 0) V.c0.dangers.splice(i, 1); } mo.royVise = null; };
      if (combat !== V.c0 || combat.fin || mo.etat !== 'actif') fin();
      else {
        V.t += dt; if (V.t < 1.4) { V.x = pp.x; V.z = pp.z; } else if (!V.d) { V.d = { x: V.x, z: V.z, r: V.R }; (V.c0.dangers = V.c0.dangers || []).push(V.d); V.rond.material.color.set('#ff2a1a'); } /* (figee : le bot aussi peut l'esquiver) */
        const cel = caseIci(V.x, V.z), y = cel ? hauteurSol(V.x, V.z, cel) : 0; V.rond.position.set(V.x, y + 0.08, V.z); V.fond.position.set(V.x, y + 0.07, V.z); V.fond.material.opacity = 0.18 + 0.2 * Math.abs(Math.sin(V.t * (V.t < 1.4 ? 6 : 14)));
        if (V.t >= 1.4) { const k = Math.min(1, (V.t - 1.4) / ESQUIVE.cawotteRoyale); V.cw.visible = true; V.cw.position.set(V.x, y + 0.8 + 12 * (1 - k), V.z); V.cw.rotation.y += dt * 6; }
        if (V.t >= 1.4 + ESQUIVE.cawotteRoyale) { pouf(V.x, y, V.z, 3.2, '#f08a24'); pouf(V.x, y, V.z, 1.8, '#ffd04a'); const p2 = paysanMesh.position, x = V.x, z = V.z; fin();
          if (Math.hypot(p2.x - x, p2.z - z) < V.R) { blesserPerso(degSort(mo), mo); /* (autant que sa pluie depuis le 15/10/2026 : 1,8 fois avant, 567, « c'est enorme, le Koulosse c'est 275 et 275 », Mathieu ; c'est l'assommement qui la rend dangereuse) */ if (combat && !combat.fin) { combat.assomme = Math.max(combat.assomme || 0, 1.0); chiffre('Assommé !', new T.Vector3(p2.x, p2.y + 2.2, p2.z), 'gros'); } }
          if (!combat || combat.fin) return; }
      }
    }
  }
}
function capFumee(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.fumee && combat.deroute == null) { /* le Koulosse crache des nuages de fumee verte : un sur toi, deux autour */
    if (mo.fumeeT == null) mo.fumeeT = mo.d.fumee - 3; mo.fumeeT += vSort;
    if (mo.fumeeT >= mo.d.fumee) { mo.fumeeT = 0; mo.frappe = 0.4;
      if (!combat.fumeeVu) { combat.fumeeVu = true; toast('Le Koulosse crache de la fumée : la toucher t\'empoisonne (2 s de poison par seconde passée dedans, 2 % de tes PV par seconde). Évite les nuages verts !', 'alerte'); }
      [[pp.x, pp.z]].concat([0, 1].map(() => [pp.x + (Math.random() - 0.5) * 8, pp.z + (Math.random() - 0.5) * 8])).forEach(([x, z], k) => cracherFumee(mo, x, z, 1.9, 24, k * 0.15));
      if (!combat || combat.fin) return; }
  }
}
function capAppel(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.appel && combat.deroute == null) { /* il t'attire a lui (souvent en pleine fumee) : une bande verte jusqu'a toi, une seconde pour en sortir */
    const dP = Math.hypot(pp.x - mo.x, pp.z - mo.z);
    if (sortPret('appelT', mo.d.appel) && dP > 4 && dP < 28) { /* (portee doublee le 15/10/2026 : de 14 a 28, un Cra ne lui echappe plus en reculant) */ mo.appelT = 0; mo.bloqueT = 1.1; mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z); mo.frappe = 0.3;
      if (!combat.appelVu) { combat.appelVu = true; toast('Le Koulosse te lance son appel : sors de la bande verte, ou il t\'attire à lui !', 'alerte'); }
      zoneDanger({ mo, x: mo.x, z: mo.z, x2: pp.x, z2: pp.z, larg: 1.6, duree: 1.0, couleur: '#7ad04a', effet: (d) => { const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) attirerPerso(mo); } });
    }
  }
}
function capAuras(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.bouclier > 0) { mo.bouclier -= dt; if (!mo.bulleB) { mo.bulleB = new T.Mesh(new T.SphereGeometry(1, 16, 12), new T.MeshBasicMaterial({ color: '#6fe0e8', transparent: true, opacity: 0.25, depthWrite: false })); m.add(mo.bulleB); } mo.bulleB.visible = true; mo.bulleB.scale.setScalar(mo.haut * 0.62); mo.bulleB.position.y = mo.haut * 0.45; } else if (mo.bulleB) mo.bulleB.visible = false;
  if (mo.galva > 0) { mo.galva -= dt; if (!mo.anneauG) { mo.anneauG = new T.Mesh(new T.RingGeometry(0.45, 0.62, 24), new T.MeshBasicMaterial({ color: '#f2b630', transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false })); mo.anneauG.rotation.x = -Math.PI / 2; mo.anneauG.position.y = 0.07; mo.anneauG.scale.setScalar(Math.max(1, mo.d.ombre * 0.8)); m.add(mo.anneauG); } mo.anneauG.visible = true; mo.anneauG.material.color.set(mo.galvaC || '#f2b630');
    if (mo.galvaC && Math.random() < dt * 6) emettre(FX_LUM, 1, { x: mo.x + (Math.random() - 0.5) * 0.9, y: m.position.y + 0.2, z: mo.z + (Math.random() - 0.5) * 0.9, v: [0, 1.7, 0], vie: [0.5, 0.8], taille: [0.15, 0.03], c: ['#ffffff', mo.galvaC], a: 0.85 }); } else if (mo.anneauG) mo.anneauG.visible = false;
}
function capSoin(mo, ctx) {
  const { m, dt, s, pp, bloque, vSort, sortPret } = ctx; /* (m : le modele du monstre, pp : la position du perso, bloque : il prepare un sort ou s'abrite) */
  if (mo.d.soigne) { /* le Mage soigne le Bwork le plus blesse autour de lui */
    mo.soinT = (mo.soinT || 0) + dt;
    if (mo.soinT >= mo.d.soigne) {
      mo.soinT = 0;
      const b = combat.monstres.filter((o) => o.etat === 'actif' && o.pv < o.pvMax && Math.hypot(o.x - mo.x, o.z - mo.z) < 7).sort((a, c) => a.pv / a.pvMax - c.pv / c.pvMax)[0];
      if (b) { const h = Math.max(1, Math.round(b.pvMax * (b.d.boss ? 0.025 : 0.12))); /* (un boss, 2,5 % : 12 % de ses PV, c'etait un boss increvable) */ b.pv = Math.min(b.pvMax, b.pv + h); chiffre('+' + h, new T.Vector3(b.x, b.m.position.y + b.haut - 0.2, b.z), 'soin'); pouf(b.x, b.m.position.y, b.z, 1.6, '#5fe0e8'); }
    }
  }
}
function capBoue(mo, ctx) { /* le Bain de boue du Dragon Cochon (20/10/2026) : il frappe le sol, un cercle rouge sous toi (ESQUIVE.boue pour en sortir) ; dedans, la boue te colle sur place */
  const { pp, sortPret } = ctx;
  if (!mo.d.boue || combat.deroute != null || !sortPret('boueT', mo.d.boue)) return;
  mo.boueT = 0; mo.bloqueT = ESQUIVE.boue + 0.3; mo.frappe = 0.4; const x0 = pp.x, z0 = pp.z;
  if (!combat.boueVu) { combat.boueVu = true; toast(leNom(mo.d) + ' prépare un bain de boue : sors du cercle rouge, sinon tu restes collé !', 'alerte'); }
  zoneDanger({ mo, x: x0, z: z0, r: 1.6, duree: ESQUIVE.boue, effet: (d) => { pouf(x0, solA(x0, z0), z0, 4, '#6a4524'); pouf(x0, solA(x0, z0), z0, 2.2, '#8e6640');
    const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) coller(DUREE_COLLE, 'Collé !', true); } });
}
function capBrassard(mo, ctx) { /* le coup de brassard de la Gorgouille (20/10/2026) : un arc rouge devant elle (ESQUIVE.brassard pour en sortir), puis le coup, qui repousse */
  const { dt, pp, sortPret } = ctx;
  if (!mo.d.brassard || combat.deroute != null) return;
  if (!mo.viseB && Math.hypot(pp.x - mo.x, pp.z - mo.z) < Math.max(6, (mo.d.brassardR || 4.2) + 1) && sortPret('brassardT', mo.d.brassard)) {
    mo.brassardT = 0; const a = Math.atan2(pp.x - mo.x, pp.z - mo.z), R = mo.d.brassardR || 4.2, OUV = 1.3, /* (brassardR : la Gorgouille, 5,2 depuis le 31/10/2026) */ c0 = combat; mo.ry = a; mo.bloqueT = ESQUIVE.brassard + 0.4;
    const c = new T.Mesh(new T.CircleGeometry(R, 24, Math.PI / 2 - OUV / 2, OUV), new T.MeshBasicMaterial({ color: '#e2413a', transparent: true, opacity: 0.3, depthWrite: false, side: T.DoubleSide }));
    c.rotation.set(-Math.PI / 2, 0, a - Math.PI); c.position.set(mo.x, mo.m.position.y + 0.07, mo.z); c.renderOrder = 2; scene.add(c);
    mo.viseB = { a, t: 0, c, R, OUV, x: mo.x, z: mo.z }; gesteSort(mo, gesteDe(mo, 'brassard', 'coup'), ESQUIVE.brassard); /* (un monstre a squelette arme son coup pendant que l'arc s'affiche, 28/10/2026) */
    effets.push(() => { if (combat !== c0 || mo.etat !== 'actif' || !mo.viseB || mo.viseB.c !== c) { jeter(c); if (mo.viseB && mo.viseB.c === c) mo.viseB = null; return true; } }); /* (l'arc s'efface si elle tombe avant de frapper) */
    if (!combat.brassardVu) { combat.brassardVu = true; toast(leNom(mo.d) + ' ' + (mo.d.brassardNom || 'arme son brassard') + ' : sors de l\'arc rouge, sinon ' + (mo.d.fem ? 'elle' : 'il') + ' te repousse !', 'alerte'); }
  }
  const V = mo.viseB; if (!V) return;
  V.t += dt; V.c.material.opacity = 0.22 + 0.25 * Math.abs(Math.sin(V.t * 9));
  if (V.t >= ESQUIVE.brassard) { mo.viseB = null; mo.frappe = 0.4; pouf(V.x + Math.sin(V.a) * 1.8, mo.m.position.y, V.z + Math.cos(V.a) * 1.8, 4, '#8e7a5e');
    const d = Math.hypot(pp.x - V.x, pp.z - V.z); let e = Math.atan2(pp.x - V.x, pp.z - V.z) - V.a; e = Math.atan2(Math.sin(e), Math.cos(e));
    if (d < V.R && Math.abs(e) < V.OUV / 2) { blesserPerso(degSort(mo), mo); if (combat && !combat.fin && mo.d.repousse) repousserPerso(mo, mo.d.repousse); } }
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
function capPierre(mo, ctx) { /* la peau de pierre de la Gorgouille (20/10/2026) : 4 s, elle prend moitie moins de degats */
  const { m, dt, sortPret } = ctx;
  if (!mo.d.pierre) return;
  if (mo.pierre > 0) mo.pierre -= dt;
  else if (sortPret('pierreT', mo.d.pierre)) { mo.pierreT = 0; mo.pierre = 4; pouf(mo.x, mo.m.position.y, mo.z, 3, '#9aa0a2'); if (mo.d.gestes && mo.d.gestes.pierre) gesteSort(mo, mo.d.gestes.pierre); if (!combat.pierreVu) { combat.pierreVu = true; toast(leNom(mo.d) + ' ' + (mo.d.pierreTexte || 'se change en pierre : elle prend moitié moins de dégâts, frappe sa troupe en attendant !'), 'alerte'); } }
  if (!mo.bulleP) { mo.bulleP = new T.Mesh(new T.IcosahedronGeometry(1, 1), new T.MeshBasicMaterial({ color: '#9aa0a2', transparent: true, opacity: 0.35, depthWrite: false })); m.add(mo.bulleP); }
  mo.bulleP.visible = mo.pierre > 0; if (mo.bulleP.visible) { mo.bulleP.scale.setScalar(mo.haut * 0.6); mo.bulleP.position.y = mo.haut * 0.45; mo.bulleP.rotation.y += dt * 0.5; }
}
function capInvoque(mo, ctx) { /* la Tortue Corail invoque ses tortues (29/10/2026, « un bâton de mage, invocateur de tortues, il en invoque 4 toutes les 8 s », Mathieu) :
     elle leve son baton, un cercle s'allume au sol a chaque place, les tortues en sortent ; 12 debout au plus, sinon elle reessaie 2 s plus tard */
  const { bloque, vSort } = ctx, I = mo.d.invoque; if (!I) return;
  mo.invoqueT = (mo.invoqueT == null ? I.periode - 3 : mo.invoqueT) + vSort; /* (le compte tourne meme pendant ses coups de baton : avec sortPret, 1 invocation en 17 s au lieu de 2) */
  if (mo.invoqueT < I.periode || bloque || mo.bloqueT > 0 || mo.vise || combat.deroute != null) return;
  const debout = combat.monstres.filter((o) => o.invoqueur === mo.id && o.etat !== 'mort').length;
  if (debout >= I.max) { mo.invoqueT = I.periode - 2; return; }
  mo.invoqueT = 0; mo.bloqueT = 1.2; mo.frappe = 0.3; gesteSort(mo, gesteDe(mo, 'invoque', 'sort'), 0.9);
  if (!combat.invoqueVu) { combat.invoqueVu = true; toast(leNom(mo.d) + ' lève son bâton et invoque ' + I.n + ' tortues : ' + (mo.d.fem ? 'elle' : 'il') + ' en invoquera toutes les ' + I.periode + ' s !', 'alerte'); }
  else chiffre('Invocation !', new T.Vector3(mo.x, mo.m.position.y + mo.haut + 0.4, mo.z), 'butin');
  const places = [];
  for (let k = 0; k < Math.min(I.n, I.max - debout); k++) { const a = mo.ry + (k + 0.5) / I.n * Math.PI * 2, p = pointValide(mo.x, mo.z, mo.x + Math.sin(a) * 2.4, mo.z + Math.cos(a) * 2.4); places.push(p); cercleInvocation(p.x, solA(p.x, p.z), p.z, mo.d.couleurSorts); } /* (a sa couleur, 30/10/2026) */
  let t = 0; effets.push((dt) => { t += dt; if (!combat || combat.fin) return true; if (t < 0.8) return false;
    places.forEach((p, k) => { pouf(p.x, solA(p.x, p.z), p.z, 2.4, '#7fe0d8'); apparaitre(I.types[k % I.types.length], { x: p.x, z: p.z, apres: (o) => { o.invoqueur = mo.id; o.invoque = true; } }); combat.total++; });
    return true; });
}
const CAPACITES_AVANT = [capRage, capProtege, capGalvanise];
const CAPACITES = [capTroupe, capInvoque, capGeyser, capGeyserRage, capCharge, capBond, capLance, capCarapace, capSeisme, capSouffle, capPluie, capBourrasque, capCawotteRoyale, capFumee, capAppel, capAuras, capSoin, capBoue, capBrassard, capPierre, capRoulade];
/* l'archer tire de loin : une fleche vole jusqu'au perso (ou jusqu'au batiment qu'il vise) ; d'un monstre a squelette, elle part de sa main.
   Le Mage : magie ; le Lanceur : un rocher ; l'Ardoise : une boule de feu ; Jav : une sagaie ; Sarbak : une flechette */
/* LES TIRS DES MONSTRES (refaits le 29/10/2026, « quand un mec te jette un caillou, on est cense voir le caillou partir et te toucher ; il y a pas
   l'impact, il y a rien », Mathieu) : avant, 0,4 s quelle que soit la distance, une fleche de 0,5 de long, aucun effet a l'arrivee des fleches ni de
   la magie. Maintenant chaque tir a sa forme a la bonne taille, sa vitesse (on le suit des yeux), son arc, sa trainee, et un impact sur toi ou sur le
   batiment vise. Les briques sont celles des sorts du perso (22b-effets.js). */
const TIRS = { /* v : vitesse (unites par seconde), arc : hauteur de la courbe (en plus d'une part de la distance), long : il pointe ou il va */
  fleche: { v: 15, arc: 0.3, parD: 0.03, long: true }, flechette: { v: 17, arc: 0.2, parD: 0.02, long: true }, sagaie: { v: 13, arc: 0.5, parD: 0.05, long: true },
  rocher: { v: 9.5, arc: 0.8, parD: 0.12 }, fruit: { v: 10, arc: 0.7, parD: 0.1 }, feu: { v: 11, arc: 0.35, parD: 0.04 }, magie: { v: 12, arc: 0.25, parD: 0.02 } };
function projectileMonstre(type, mo) {
  if (type === 'magie') { const g = new T.Group(), c = new T.Mesh(new T.IcosahedronGeometry(0.2, 1), new T.MeshBasicMaterial({ color: mo.d.couleurMagie || '#5fe0e8' })), b = new T.Mesh(new T.IcosahedronGeometry(0.11, 1), new T.MeshBasicMaterial({ color: '#ffffff' })); g.add(c, b); return g; }
  if (type === 'fruit') return new T.Mesh(new T.SphereGeometry(mo.d.grosFruit ? 0.28 : 0.17, 10, 8), mat(mo.d.fruit));
  if (type === 'rocher') return new T.Mesh(new T.DodecahedronGeometry(0.4, 0), mat('#9a948c'));
  if (type === 'feu') { const g = new T.Group(); g.add(new T.Mesh(new T.IcosahedronGeometry(0.3, 1), new T.MeshBasicMaterial({ color: '#ff7a1e' })), new T.Mesh(new T.IcosahedronGeometry(0.17, 1), new T.MeshBasicMaterial({ color: '#ffe27a' }))); return g; }
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
  if (type === 'rocher' || type === 'fruit') { if (fxAlea() < 0.5) emettre(FX_FUM, 1, { x: p.x, y: p.y, z: p.z, vie: [0.3, 0.45], taille: [0.25, 0.45], c: type === 'rocher' ? ['#c9b28a', '#d8c6a0'] : [mo.d.fruit, '#ffffff'], a: 0.4 }); return; }
  traineeFleche(p);
}
function impactTir(type, p, mo, perso) {
  const y = solA(p.x, p.z);
  if (type === 'feu') { boule(p.x, p.y, p.z, 0.55, ['#ff9a2e', '#e8541e']); return; }
  if (type === 'magie') { etoileImpact(p, 0.8, mo.d.couleurMagie || '#5fe0e8'); onde(p.x, y, p.z, 1.4, mo.d.couleurMagie || '#5fe0e8', 0.35, 0.7); return; }
  if (type === 'rocher') { pouf(p.x, y, p.z, 1.8, '#9a948c'); poussiere(p.x, y, p.z, 8, 0.8, '#d8c6a0'); mottes(p.x, y, p.z, 5, 0.6); if (perso) secousse(0.08, 0.18); return; }
  if (type === 'fruit') { pouf(p.x, y, p.z, 1.4, mo.d.fruit); emettre(FX_VIF, 10, { x: p.x, y: p.y, z: p.z, r: 0.1, dv: 4, haut: true, vie: [0.25, 0.45], taille: [0.12, 0.04], c: ['#ffffff', mo.d.fruit], grav: 9, frein: 1.5 }); return; }
  etoileImpact(p, type === 'sagaie' ? 0.9 : 0.65); poussiere(p.x, y, p.z, 4, 0.4);
}
function tirMonstre(mo, bat) {
  const main = mainSquelette(mo), type = mo.d.magie ? 'magie' : TIRS[mo.d.projectile] ? mo.d.projectile : 'fleche', T0 = TIRS[type];
  const de = main || new T.Vector3(mo.x, mo.m.position.y + Math.max(1.0, (mo.haut || 1.6) * 0.6), mo.z), vers = bat ? new T.Vector3(bat.x, bat.y + 1.0, bat.z) : paysanMesh.position.clone(); if (!bat) vers.y += 0.9; const deg = mo.deg, cleB = bat && bat.cle, c0 = combat;
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
function majMonstre(mo, dt, s) {
  if (!combat || combat.fin) return;
  const m = mo.m;
  if (mo.etat === 'grimpe') { /* il se hisse : remonte de sous le bord, puis un petit saut pour passer la falaise */
    mo.t += dt / 0.9; const k = Math.max(0, Math.min(1, mo.t)), e = k * k * (3 - 2 * k), dp = mo.dep;
    m.position.set(dp.x + (mo.x - dp.x) * Math.max(0, (k - 0.55) / 0.45), dp.y + (mo.y - dp.y) * Math.min(1, e * 1.25) + Math.sin(Math.max(0, (k - 0.55) / 0.45) * Math.PI) * 0.45, dp.z + (mo.z - dp.z) * Math.max(0, (k - 0.55) / 0.45));
    m.rotation.x = dp.friche ? 0 : -0.5 * (1 - Math.min(1, k * 1.6)); m.visible = mo.t > 0;
    if (k >= 1) { mo.etat = 'actif'; m.rotation.x = 0; pouf(mo.x, mo.y, mo.z, 1.2); } return;
  }
  if (mo.d.boss && !mo.invoque) majBarreBoss(mo); /* (les Gorilles appeles par Moon sont des boss : la barre reste a Moon, sinon elle sautait de l'un a l'autre) */
  if (mo.etat === 'mort' && m.userData.anim) { mortSquelette(mo, dt); return; } /* (un monstre a squelette tombe, puis s'enfonce dans le sol) */
  if (mo.etat === 'mort') { mo.t += dt / 0.35; m.scale.setScalar(Math.max(0.001, 1 - mo.t)); m.rotation.y += dt * 12; if (mo.t >= 1 && m.parent) jeter(m); return; }
  if (mo.d.vole) { majVoleurRaid(mo, dt, s); return; }
  const lent = mo.lent > 0; if (lent) mo.lent -= dt; mo.cd -= dt * (lent ? 0.5 : 1) * (mo.enrage ? 1.7 : 1) * (mo.galva > 0 ? 1.5 : 1) * (mo.rageM || 1); /* (rageM : la rage de l'ile des boss, il frappe plus vite) */ /* gele : il frappe deux fois moins vite ; enrage : bien plus vite */
  if (mo.bloqueT > 0) mo.bloqueT -= dt;
  mo.sautT = mo.sautT == null ? Math.random() * SAUT_RECHARGE * 0.75 : mo.sautT + dt; /* (le premier bond : entre 2 et 8 s apres son arrivee, pas tous en meme temps) */
  const pp = paysanMesh.position, bloque = mo.bloqueT > 0 || !!mo.vise || mo.carapace > 0; let v = 0; /* (un boss qui prepare son sort ne marche pas) */
  if (!bloque) {
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
  let recule = false; /* garde : l'incantatrice (la Tortue Corail, 30/10/2026) recule quand le perso l'approche, pour lancer ses sorts de loin */
  if (mo.tientT > 0) mo.tientT -= dt; /* (apres 1,6 s de recul, elle se plante 2,5 s pour tirer : le perso court bien plus vite qu'elle, sinon elle ne ferait que fuir, essai du 30/10) */
  if (versPerso && mo.d.garde && !(mo.bloqueT > 0) && !(mo.tientT > 0)) { const dp = Math.hypot(pp.x - mo.x, pp.z - mo.z); if (dp < mo.d.garde) { /* (dos au mur, elle file de cote : droit devant elle, puis de plus en plus de biais ; essai du 30/10 : arrivee par une herse, elle restait collee au bord) */
    const a0 = Math.atan2(mo.x - pp.x, mo.z - pp.z), L = mo.d.garde + 2.5 - dp;
    for (const da of [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8]) { const f = pointValide(mo.x, mo.z, mo.x + Math.sin(a0 + da) * L, mo.z + Math.cos(a0 + da) * L); if (Math.hypot(f.x - mo.x, f.z - mo.z) > Math.min(1.5, L * 0.6)) { tx = f.x; tz = f.z; recule = true; break; } } } }
  if (recule) { mo.reculT = (mo.reculT || 0) + dt; if (mo.reculT > 1.6) { mo.reculT = 0; mo.tientT = 2.5; recule = false; tx = pp.x; tz = pp.z; } } else if (mo.reculT > 0) mo.reculT = Math.max(0, mo.reculT - dt * 0.5);
  const d = Math.hypot(tx - mo.x, tz - mo.z), portee = recule ? 0.3 : versPerso ? mo.d.portee * (mo.allonge || 1) : bat ? mo.d.portee : 0.3; /* (allonge : le boss colossal de l'ile frappe plus loin, a sa taille) */
  if (versPerso && !combat.raid && d > portee + 0.8 && d <= SAUT_PORTEE && mo.sautT >= SAUT_RECHARGE && peutSauter(mo)) sauterSurPerso(mo); /* le bond : a moins de 3 cases, il te saute dessus */
  else if (d > portee) {
    const w = prochainPas(mo, tx, tz, dt), dx = w.x - mo.x, dz = w.z - mo.z, L = Math.hypot(dx, dz) || 1;
    v = vitesseMonstre(mo.d) * (lent ? 0.4 : 1) * (mo.galva > 0 ? 1.3 : 1) * (mo.rageM || 1); const pas = Math.min(L, v * dt); mo.x += dx / L * pas; mo.z += dz / L * pas; tourner(mo, Math.atan2(dx, dz), dt); mo.picore = 0;
  } else if (versPerso || bat) {
    tourner(mo, Math.atan2(tx - mo.x, tz - mo.z), dt);
    if (mo.cd <= 0) {
      mo.cd = mo.d.cadence; mo.frappe = 0.25;
      const frapper = () => { /* (le coup lui-meme ; un monstre a squelette le porte a l'instant de son geste : s'il t'a vu filer, il frappe dans le vide) */
        if (bat && !mo.d.distance) blesserBat(bat.cle, degatsBatiment(mo.d.cadence, mo) * (mo.d.bucheron && /^tour:/.test(bat.cle) ? mo.d.bucheron : 1)); /* il cogne le batiment : un coup, ses degats par seconde de la vague fois l'intervalle entre deux coups (le Forestier : double sur les tours) */
        else if (mo.d.distance) tirMonstre(mo, bat);
        else if (!m.userData.anim || Math.hypot(paysanMesh.position.x - mo.x, paysanMesh.position.z - mo.z) <= portee + 1.0) { blesserPerso(mo.deg, mo); effetsCoup(mo); } };
      if ((mo.d.marteau || mo.d.poings) && m.userData.anim && !bat) coupMarteau(mo); /* (Moon, et le Gorille roi avec ses poings : le coup tombe a l'impact, 22c-squelettes.js) */
      else if (m.userData.anim) attaqueSquelette(mo, mo.d.distance ? 'tir' : 'coup', frapper); /* (les Kannibouls et les Tortues : a l'instant de leur geste) */
      else frapper();
    }
  } else { /* il picore : une recolte volee toutes les 5 s */
    mo.picore += dt;
    if (mo.picore >= 5) { mo.picore = 0.01; const p = mo.champ; p.vole = (p.vole || 0) + 1; rendreCase(p.id);
      { const V = combat.cultures || (combat.cultures = {}), v = V[p.c] || (V[p.c] = { n: 0, par: [] }); v.n++; if (!v.par.includes(mo.type)) v.par.push(mo.type); } /* (pour le bilan : « Cultures perdues ») */ { const q = posCase(p), C = PAR_ID[p.c]; chiffre('-1 ' + C.nom, new T.Vector3(q.x, q.y + 0.9, q.z), 'vol'); pouf(q.x, q.y + 0.2, q.z, 1.1, C.couleur); } toast('Un ' + mo.d.nom + ' ' + (mo.type === 'tofu' ? 'picore' : 'grignote') + ' ton ' + PAR_ID[p.c].nom + ' : 1 récolte de moins !', 'alerte'); }
  }
  }
  if (!combat || combat.fin) return; /* le coup qui vient d'achever le perso a clos la vague */
  const ctx = { m, dt, s, pp, bloque };
  for (const cap of CAPACITES_AVANT) { cap(mo, ctx); if (!combat || combat.fin) return; } /* (la rage d'abord : la vitesse des sorts en depend) */
  const vSort = dt * (mo.enrage ? 1.3 : 1) * (combat.difficile ? DUR.sorts : 1) * (mo.rageM || 1); /* enrage, il lance ses sorts plus souvent (et en revanche difficile) */
  const sortPret = (cle, periode) => { if (mo[cle] == null) mo[cle] = periode - 3; if (bloque || mo.bloqueT > 0 || mo.vise || combat.deroute != null) return false; mo[cle] += vSort; return mo[cle] >= periode; }; /* le premier, 3 s apres son arrivee */
  /* (29/10/2026, « il saute sur moi et revient sur sa case de depart », Mathieu) bloque est lu une fois au debut de l'image : le Gorille roi lancait sa
     ruee, son bond et son martelement dans la meme image (tous prets 3 s apres son arrivee), puis la ruee et le bond le deplacaient en meme temps,
     chacun depuis son point de depart. On relit le blocage a chaque sort : un seul a la fois, les autres attendent la fin du premier (le Dragon Cochon aussi) */
  ctx.vSort = vSort; ctx.sortPret = sortPret;
  for (const cap of CAPACITES) { cap(mo, ctx); if (!combat || combat.fin) return; } /* (un sort qui acheve le perso clot le combat) */
  /* ils ne se marchent pas dessus et ne traversent pas le perso */
  combat.monstres.forEach((o) => { if (o === mo || o.etat !== 'actif') return; const dx = mo.x - o.x, dz = mo.z - o.z, L = Math.hypot(dx, dz), mn = 0.35 * (mo.d.ombre + o.d.ombre); if (L > 0.001 && L < mn) { const k = (mn - L) * 0.5; mo.x += dx / L * k; mo.z += dz / L * k; } });
  { const dx = mo.x - pp.x, dz = mo.z - pp.z, L = Math.hypot(dx, dz), mn = 0.35 + mo.d.ombre * 0.3; if (L > 0.001 && L < mn) { mo.x += dx / L * (mn - L); mo.z += dz / L * (mn - L); } }
  mo.pas += v * dt * 5; if (m.userData.pattes || m.userData.membres) animerPattes(m, mo.pas * 0.8, Math.min(1, v * 0.7)); /* (les Bouftous des vagues marchent sur leurs pattes) */
  if (m.userData.anim) majSquelette(mo, v, dt); /* (les monstres a squelette : marche, repos, coup de marteau) */
  const y = hauteurSol(mo.x, mo.z, caseIci(mo.x, mo.z));
  const saut = m.userData.anim ? 0 : mo.d.grignote ? Math.abs(Math.sin(mo.pas)) * (v > 3 ? 0.2 : 0.28) * Math.min(1, v) : mo.d.roule ? Math.abs(Math.sin(mo.pas * 0.8)) * 0.12 * Math.min(1, v) : (1 - Math.cos(mo.pas * 2)) * 0.03;
  let elan = 0; if (mo.frappe > 0) { mo.frappe -= dt; if (!m.userData.anim) elan = Math.sin((1 - Math.max(0, mo.frappe) / 0.25) * Math.PI) * 0.35; } /* (un monstre a squelette a son propre geste) */
  const pique = mo.picore > 0 ? Math.abs(Math.sin(s * 9)) : 0;
  const vol = mo.d.vol ? mo.d.vol + Math.sin(s * 2.4 + mo.id) * 0.14 : 0; if (vol && mo.ombreM) { mo.ombreM.position.y = 0.03 - vol; mo.ombreM.scale.setScalar(mo.d.ombre * (1 - vol * 0.15)); } /* il vole : ses ailes le portent, son ombre reste au sol */
  m.position.set(mo.x + Math.sin(mo.ry) * elan, y + vol + saut + (mo.hop || 0) + (mo.picore > 0 && mo.champ && mo.champ.c ? (etape(mo.champ) === 'mur' ? 0.75 : 0.25) + pique * 0.1 : 0), mo.z + Math.cos(mo.ry) * elan);
  m.rotation.y = mo.ry; m.rotation.z = m.userData.anim ? 0 : Math.sin(mo.pas) * 0.07; /* (un monstre a squelette se dandine dans son animation) */ m.rotation.x = pique * 0.35;
  if (mo.brule > 0) { /* il brule : des degats toutes les demi-secondes, une flamme au-dessus de lui */
    mo.brule -= dt; mo.bruleT = (mo.bruleT || 0) + dt; if (mo.bruleT >= 0.5) { mo.bruleT = 0; blesser(mo, mo.bruleDeg); }
    if (!mo.flamme) { mo.flamme = new T.Mesh(new T.ConeGeometry(0.18, 0.5, 6), new T.MeshBasicMaterial({ color: '#ff7a1e', transparent: true, opacity: 0.85 })); m.add(mo.flamme); }
    mo.flamme.visible = true; mo.flamme.position.set(0, mo.haut - 0.1, 0); mo.flamme.scale.set(1, 0.8 + Math.abs(Math.sin(s * 14)) * 0.5, 1);
  } else if (mo.flamme) mo.flamme.visible = false;
  if (!combat || mo.etat !== 'actif') return;
  if (mo.coup > 0) { mo.coup -= dt; m.scale.setScalar((mo.echelle || 1) * (1 + Math.max(0, mo.coup) * 0.9)); } else m.scale.setScalar(mo.echelle || 1);
  if (lent && !mo.givre) { mo.givre = new T.Mesh(new T.RingGeometry(0.3, 0.55, 24), new T.MeshBasicMaterial({ color: '#9fd8ff', transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false })); mo.givre.rotation.x = -Math.PI / 2; mo.givre.position.y = 0.06; mo.givre.scale.setScalar(Math.max(1, mo.d.ombre)); m.add(mo.givre); }
  if (mo.givre) mo.givre.visible = lent;
}
/* la portee du perso sur un monstre : un gros monstre compte sa carrure (trouve le 12/10/2026 en simulant les boss : Crocabulia etait tenue a 1,55 case
   du perso par l'ecartement des corps, l'epee du Iop porte a 1,5, il lui tournait autour sans la toucher) */
const porteeSur = (o, st) => st.portee + Math.max(0, 0.35 + o.d.ombre * 0.3 - 1);
/* le perso : il va vers sa cible (ou le monstre le plus proche) et frappe des qu'il est a portee */
function majPerso(dt) {
  const u = paysanMesh.userData, st = statsPerso(), classe = classeDe();
  combat.cdAttaque -= dt; { const r = dt * (1 + 0.15 * nbBonus('recharge')); combat.cdSort = Math.max(0, combat.cdSort - r); combat.cdUlti = Math.max(0, combat.cdUlti - r); } /* (le bonus Concentration de l'Arene) */
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
  const pp = paysanMesh.position, d = Math.hypot(c.x - pp.x, c.z - pp.z);
  if (d > porteeSur(c, st)) {
    const h = combat.heros; h.x = pp.x; h.z = pp.z; const w = prochainPas(h, c.x, c.z, dt);
    chemin = [{ c: caseIci(w.x, w.z) || u.cellule, x: w.x, z: w.z }]; arrivee = null; combat.poursuite = true; return;
  }
  if (combat.poursuite) { chemin = []; combat.poursuite = false; }
  u.angle = Math.atan2(c.x - pp.x, c.z - pp.z);
  if (combat.cdAttaque <= 0 && !u.attaque) {
    const rage = legPorte('bworker') && combat.pv < combat.pvMax * 0.3; if (rage && !combat.rage) { combat.rage = true; toast('Casque du Bworker : tu entres en rage !', 'alerte'); pouf(pp.x, pp.y, pp.z, 2.5, '#e2413a'); }
    combat.cdAttaque = st.cadence * (rage ? 0.7 : 1); const cible = c; son(classe === 'cra' ? 'arc' : classe === 'osa' ? 'fouet' : 'epee'); /* (l'arme de la classe : l'arc du Cra, le fouet de l'Osamodas, l'epee du Iop) */
    combat.tirs = (combat.tirs || 0) + 1; const feu = classe === 'cra' && combat.tirs % TIR_FEU === 0; /* une fleche de feu toutes les 10 */
    u.attaque = { t: 0, classe, base: u.angle, tour: false, surFrappe: () => { const p = new T.Vector3(cible.x, cible.m.position.y + cible.haut * 0.5, cible.z); effetFrappe(classe, p, () => { const epines = cible.carapace > 0 && classe !== 'cra', bk = classe === 'iop' && berserkerIop() ? BERSERKER_IOP : 1; blesser(cible, Math.round((feu ? st.deg * 2 : st.deg) * bk), feu); if (classe === 'iop') coupIop(cible, st, bk); /* (bk : le Berserker du Iop, sur ses coups d'epee seulement) */ if (epines && combat && !combat.fin) blesserPerso(Math.max(1, Math.round(st.deg * 0.2 / multDegats(combat.n))), cible); if (!combat || combat.fin) return; if (feu && cible.etat === 'actif') { cible.brule = 3; cible.bruleDeg = Math.max(1, Math.round(st.deg * 0.25)); pouf(cible.x, cible.m.position.y, cible.z, 2, '#ff7a1e'); } }, feu); } };
  }
}
function coupIop(cible, st, bk) { /* le balayage du Iop (18-geliere.js) ; bk : le Berserker, x2 sous 50 % de vie */
  if (!combat || combat.fin || !(BALAYAGE_IOP > 0)) return; let k = 0;
  combat.monstres.slice().forEach((o) => { if (o === cible || o.etat !== 'actif' || Math.hypot(o.x - cible.x, o.z - cible.z) > RAYON_BALAYAGE) return; blesser(o, Math.max(1, Math.round(st.deg * BALAYAGE_IOP * (bk || 1)))); k++; });
  if (k) onde(cible.x, cible.m.position.y + 0.05, cible.z, RAYON_BALAYAGE, '#ffd27a', 0.3, 0.3);
}
/* le sort de classe : Charge (Iop), Fleche percante (Cra), Invocation d'un Bouftou (Osamodas) */
