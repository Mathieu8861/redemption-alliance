'use strict';
/* ---------- les gains qui s'envolent ---------- */
function gainFlottant(texte, x, y, z, icone, genre) {
  const e = document.createElement('div'); e.className = 'gain' + (genre ? ' ' + genre : ''); e.innerHTML = (icone ? '<img src="assets/icones/' + icone + '.png?v=' + VERSION_MODELES + '" alt="">' : '') + '<span>' + texte + '</span>';
  (combat ? $('combat-zone') : zoneBulles).appendChild(e); const p = new T.Vector3(x, y, z); let t = 0;
  effets.push((dt) => { t += dt; const q = p.clone(); q.y += t * 1.1; versEcran(q, e); e.style.opacity = String(Math.max(0, 1 - Math.max(0, t - 0.9) / 0.5)); e.style.scale = String(Math.min(1, 0.6 + t * 4)); if (t >= 1.4) { e.remove(); return true; } });
}
/* ---------- la fete du passage de niveau ---------- */
function confettis(n) { const cols = ['#f2b630', '#e07c0a', '#5aa02c', '#3a95d1', '#d9443a', '#c87ae0']; for (let i = 0; i < n; i++) { const c = document.createElement('i'); c.className = 'confetti'; c.style.left = (Math.random() * 100) + 'vw'; c.style.background = hasard(cols); c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's'; c.style.animationDelay = (Math.random() * 0.4) + 's'; document.body.appendChild(c); setTimeout(() => c.remove(), 3800); } }
function feterNiveau(n, nouveautes, avant) { /* (avant : le niveau d'avant ; les PV et les degats gagnes s'affichent, 22/10/2026) */
  son('niveau'); confettis(70); const f = document.createElement('div'); f.className = 'fete';
  f.innerHTML = '<div class="ban"><span>Paysan</span><b>Niveau ' + n + ' !</b>' + gainsNiveau(avant || n - 1, n) + (nouveautes.length ? '<ul>' + nouveautes.map((x) => '<li>' + x + '</li>').join('') + '</ul>' : '') + '<button class="btn kamas">Super !</button></div>';
  document.body.appendChild(f); const fin = () => f.remove(); f.querySelector('.btn').addEventListener('click', fin); setTimeout(fin, 8000);
}
function nouveautesNiveau(avant, apres) {
  const L = CULTURES.filter((c) => c.niv > avant && c.niv <= apres && !(S_.cultAcquises || []).includes(c.id)).map((c) => 'Nouvelle culture : ' + c.nom); /* (pas celles deja acquises avant le 12/10) */
  AMELIOS.filter((a) => nivRequis(a, 0) > avant && nivRequis(a, 0) <= apres).forEach((a) => L.push('Amélioration débloquée : ' + a.nom));
  if (avant < NIV_TOUR && apres >= NIV_TOUR) L.push('Tours de défense débloquées');
  if (avant < NIV_ULTI && apres >= NIV_ULTI) L.push('Ton ulti est à choisir !');
  return L.slice(0, 5);
}
/* ---------- les compteurs (objectifs et defis) ---------- */
function compter(cle, n) {
  if (!S_) return; n = n === undefined ? 1 : n; S_.stats = S_.stats || {}; S_.stats[cle] = (S_.stats[cle] || 0) + n;
  const J = jourCourant(); if (J) J.defis.forEach((d) => { if (d.cle === cle && !d.reclame) d.fait = Math.min(d.but, (d.fait || 0) + n); });
  rendreObjectif();
}
const valeurCompteur = (cle) => cle === 'niveau' ? niveau(S_.xp) : cle === 'vagueMax' ? S_.vague.num - 1 : cle === 'equipes' ? Object.values(S_.equip || {}).filter(Boolean).length : cle === 'terrainsAchetes' ? Object.keys(S_.terrains || {}).length : ((S_.stats || {})[cle] || 0);
/* ---------- les objectifs de Pepito : un fil qui apprend le jeu ---------- */
const OBJECTIFS = [
  ['recoltes', 1, 'Récolte ton Blé : clic droit sur le champ mûr, ou sur sa bulle.', 20, 5],
  ['plantes', 3, 'Plante 3 graines : clic droit sur une parcelle vide.', 25, 5],
  ['arrosages', 3, 'Arrose 3 semis (clic droit dessus) : ça pousse deux fois et demie plus vite.', 25, 5],
  ['ventes', 1, 'Vends ta récolte à l\'HDV (bouton HDV, onglet Vendre).', 30, 5],
  ['achatsGraines', 1, 'Achète des graines à l\'HDV (onglet Acheter).', 25, 5],
  ['repas', 1, 'Nourris ton Bouftou : clic droit sur lui quand il a faim.', 25, 5],
  ['laines', 2, 'Tonds 2 laines sur tes Bouftous.', 40, 8],
  ['parcelles', 1, 'Laboure une nouvelle parcelle : clic droit sur une case d\'herbe.', 60, 8],
  ['niveau', 3, 'Atteins le niveau 3 de Paysan.', 80, 0],
  ['tofusChasses', 1, 'Chasse un Tofu qui picore tes champs.', 40, 8],
  ['vagues', 1, 'Lance et gagne ta première vague (bouton Vagues).', 100, 15],
  ['amelios', 1, 'Achète ta première amélioration (HDV, onglet Améliorer).', 80, 10],
  ['recolte_orge', 1, 'Récolte de l\'Orge (niveau 5).', 100, 10],
  ['vagueMax', 5, 'Gagne la vague 5.', 200, 20],
  ['terrainsAchetes', 1, 'Achète un terrain pour agrandir ta ferme.', 250, 20],
  ['vagueMax', 10, 'Bats le Bouftou Royal à la vague 10.', 500, 40],
  ['equipes', 1, 'Équipe une pièce d\'équipement (bouton Perso).', 200, 20],
  ['naissances', 1, 'Fais naître un petit Bouftou (' + COUT_REPRO + ' Houblon, dans l\'enclos).', 600, 40],
  ['vagueMax', 20, 'Bats le Chafer Cuirassé à la vague 20.', 1500, 80],
  ['equipes', 6, 'Porte 6 pièces d\'équipement.', 2000, 100],
  ['vagueMax', 30, 'Bats le Bworker à la vague 30.', 5000, 150],
  ['vagueMax', 40, 'Bats le Craqueleur Légendaire à la vague 40.', 10000, 250],
  ['vagueMax', 50, 'Bats Crocabulia à la vague 50 : tu es le meilleur fermier d\'Incarnam.', 25000, 400]
];
const objectifCourant = () => OBJECTIFS[(S_.obj || 0)] || null;
/* ---------- trois defis par jour, et le cadeau de connexion en serie ---------- */
const POOL_DEFIS = [['recoltes', 6, 'Récolte {n} cultures'], ['ventes', 3, 'Vends {n} fois à l\'HDV'], ['arrosages', 8, 'Arrose {n} semis'], ['laines', 4, 'Tonds {n} laines'], ['repas', 3, 'Nourris tes Bouftous {n} fois'], ['tofusChasses', 2, 'Chasse {n} Tofus'], ['monstres', 12, 'Abats {n} monstres'], ['vagues', 1, 'Gagne {n} vague'], ['plantes', 6, 'Plante {n} graines'], ['plumes', 2, 'Ramasse des plumes {n} fois']];
const jourDe = (t) => { const d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const tempsReel = () => new Date().getTime(); /* l'heure vraie : Date.now est l'horloge du jeu, qui peut aller x50 */
function jourCourant() {
  if (!S_ || !S_.perso) return null; const auj = jourDe(tempsReel());
  if (!S_.jour || S_.jour.date !== auj) {
    const L = niveau(S_.xp), pool = POOL_DEFIS.filter(([c]) => !(c === 'laines' || c === 'repas') || S_.bouftous.length).filter(([c]) => !(c === 'plumes') || S_.tofus).filter(([c]) => !(c === 'monstres' || c === 'vagues') || S_.vague.num > 1);
    const choix = pool.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    S_.jour = { date: auj, defis: choix.map(([cle, but, txt]) => { const b = Math.round(but * (1 + L / 25)); return { cle, but: b, txt: txt.replace('{n}', b), fait: 0, reclame: false, kamas: kamasGagnes(40 + 15 * L), xp: 5 + Math.round(L / 2) }; }), coffre: false };
  }
  return S_.jour;
}
const CADEAUX = [[100, 'des graines de Blé', () => { S_.graines.ble = (S_.graines.ble || 0) + 5; }], [150, '20 flèches', () => { S_.fleches += 20; }], [200, '3 filets de capture', () => { S_.filets += 3; }], [300, 'des graines de la meilleure culture que tu puisses planter', () => { const c = CULTURES.filter(debloquee).pop(); S_.graines[c.id] = (S_.graines[c.id] || 0) + 5; }], [400, '40 flèches', () => { S_.fleches += 40; }], [500, '5 filets de capture', () => { S_.filets += 5; }], [800, 'une pièce d\'équipement de ton palier', () => { donnerObjet(tirerPiece(panoDe(palierCourant()))); /* (un vrai jet ; avant le 16/10/2026, la piece s'empilait sans caracteristiques) */ }]];
const kamasCoffreJour = () => kamasGagnes(150 + 40 * niveau(S_.xp)); /* (le coffre des trois defis : le meme chiffre affiche et verse) */
CADEAUX.forEach((c) => { c[0] = kamasGagnes(c[0]); }); OBJECTIFS.forEach((o) => { o[3] = kamasGagnes(o[3]); }); /* (le cadeau du jour et les objectifs de Pepito, -10 %) */
function cadeauDuJour() {
  if (!S_ || !S_.perso || combat) return; const auj = jourDe(tempsReel()), hier = jourDe(tempsReel() - 86400000); S_.serie = S_.serie || { n: 0, date: null };
  if (S_.serie.date === auj) return;
  S_.serie.n = S_.serie.date === hier ? S_.serie.n + 1 : 1; S_.serie.date = auj; const k = (S_.serie.n - 1) % 7, [kamas, quoi, donner] = CADEAUX[k];
  S_.kamas += kamas; donner(); sauver(); rendreHaut(); rendreGrange();
  const montrer = () => { if (modaleOuverte || document.querySelector('.fete')) { setTimeout(montrer, 1500); return; } son('quete'); confettis(30); ouvrirModale('cadeau', entete('Cadeau du jour') + '<p style="text-align:center;font-size:.86rem;font-weight:700;margin:0">Jour ' + S_.serie.n + ' de ta série. Reviens demain pour un cadeau plus gros !</p><div class="serie">' + CADEAUX.map((c, j) => '<i class="' + (j < k ? 'fait' : j === k ? 'ici' : '') + '">J' + (j + 1) + '<br>' + (j === 6 ? '★' : c[0]) + '</i>').join('') + '</div><div class="art">' + ico('coffre') + '<div><b>+' + fmt(kamas) + ' ' + KAMA + ' et ' + quoi + '</b><div class="desc">Une série qui se casse repart au jour 1. Au jour 7 : une pièce d\'équipement.</div></div><div></div></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn kamas" data-fermer>Merci Pépito !</button></div>'); }; setTimeout(montrer, 900); /* (il attend qu'aucune autre fenetre ne soit ouverte) */
}
/* ---------- le panneau ---------- */
const texteDoigt = (t) => t.replace('clic droit sur lui', 'touche-le').replace('(clic droit dessus)', '(touche-les)').replace(/clic droit sur /g, 'touche ').replace(/clic droit/g, 'toucher'); /* au doigt, on touche */
function rendreObjectif() {
  const e = $('objectif'); if (!e || !S_ || enAccueil) return;
  if (tuto.actif && ETAPES_TUTO[tuto.etape].id !== 'fin') { e.hidden = true; return; } /* pendant le tuto, Pepito parle dans sa carte */
  const o = objectifCourant(), J = jourCourant(), prets = J ? J.defis.filter((d) => d.fait >= d.but && !d.reclame).length : 0, faits = J ? J.defis.filter((d) => d.reclame).length : 0;
  if (S_.objCache && !prets) { e.hidden = true; return; }
  e.hidden = false;
  let h = '';
  if (o && !S_.objCache) { const v = Math.min(o[1], valeurCompteur(o[0])), fini = v >= o[1];
    e.classList.toggle('fini', fini);
    h = '<div class="tete">Objectif de Pépito<button data-cacher-obj>masquer</button></div><div class="txt">' + (matchMedia('(pointer: coarse)').matches ? texteDoigt(o[2]) : o[2]) + '</div><div class="barre"><i style="width:' + (100 * v / o[1]).toFixed(0) + '%"></i></div><small><span>' + fmt(v) + ' / ' + fmt(o[1]) + '</span><span>+' + fmt(o[3]) + ' kamas' + (o[4] ? ', +' + xpReel(o[4]) + ' XP' : '') + '</span></small>' + (fini ? '<button class="btn kamas" data-reclamer-obj>Réclamer la récompense</button>' : ''); }
  else { e.classList.remove('fini'); h = '<div class="tete">Défis du jour' + (S_.objCache ? '' : '') + '</div>'; }
  if (J) h += '<div class="defis"><span>Défis du jour : ' + faits + '/3' + (prets ? ', ' + prets + ' à réclamer' : '') + '</span><button class="btn' + (prets ? ' kamas pret' : ' discret') + '" data-voir-defis>Voir</button></div>';
  e.innerHTML = h; placerPanneaux();
}
function placerPanneaux() { const h = document.querySelector('.haut'); if (!h) return; const b = h.getBoundingClientRect().bottom + 8; ['objectif', 'panneau-grange'].forEach((id) => { const e = $(id); if (e) e.style.top = b + 'px'; }); placerElevage(); }
/* « Tes betes », juste sous le panneau de la grange : les Tofus de la voliere, les Bouftous de l'enclos, les Gelees de la geliere, chacun sur sa capacite */
function placerElevage() { const g = $('panneau-grange'), e = $('panneau-elevage'); if (g && e && !e.hidden) e.style.top = (g.getBoundingClientRect().bottom + 10) + 'px'; }
function rendreElevage() {
  const e = $('panneau-elevage'); if (!e || !S_) return;
  const L = [['tofu', 'Tofus', 'volière', S_.tofus || 0, capaciteVoliere()], ['bouftou', 'Bouftous', 'enclos', S_.bouftous.length, capacite()]]
    .concat(niv('geliere') ? [['gelee-fraise', 'Gelées', 'gelière', (S_.gelees || []).length, placesGeliere()]] : []);
  const h = '<h2>Tes bêtes</h2>' + L.map(([ic, nom, ou, n, max]) => '<div class="l"><span class="n">' + icoGrange(ic) + nom + ' <small>(' + ou + ')</small></span><span class="cpt' + (n >= max ? ' plein' : '') + '">' + n + '/' + max + '</span></div>').join('');
  if (h !== rendreElevage.dernier) { rendreElevage.dernier = h; e.innerHTML = h; } e.hidden = false; placerElevage();
}
function reclamerObjectif() {
  const o = objectifCourant(); if (!o || valeurCompteur(o[0]) < o[1]) return;
  S_.kamas += o[3]; if (o[4]) gagnerXp(o[4]); const xpObj = o[4] ? gagnerXp.dernier : 0; /* (le vrai gain : plafond de niveau compris) */ S_.obj = (S_.obj || 0) + 1; son('quete'); confettis(18);
  const pp = paysanMesh.position; gainFlottant('+' + fmt(o[3]), pp.x, pp.y + 2, pp.z, 'kama', 'kamas');
  toast('Objectif réussi : +' + fmt(o[3]) + ' kamas' + (xpObj ? ' et ' + xpObj + ' XP' : '') + '. ' + (objectifCourant() ? 'Le suivant t\'attend.' : 'Tu as réussi tous les objectifs de Pépito !'), 'or');
  rendreHaut(); rendreObjectif(); sauver();
}
function ouvrirDefis() {
  const J = jourCourant(); if (!J) return; const tous = J.defis.every((d) => d.reclame);
  ouvrirModale('defis', entete('Défis du jour') + '<p style="font-size:.8rem;font-weight:600;margin:0 0 4px">Trois défis, renouvelés chaque jour. Les trois réussis ouvrent le coffre du jour.</p>' +
    J.defis.map((d, k) => '<div class="defi"><div><b>' + d.txt + '</b><div class="pv-grand"><i style="width:' + (100 * Math.min(1, d.fait / d.but)).toFixed(0) + '%;background:var(--vert)"></i></div><small style="font-size:.7rem;font-weight:700;color:#a9adb5">' + Math.min(d.fait, d.but) + ' / ' + d.but + ' : +' + fmt(d.kamas) + ' kamas, +' + xpReel(d.xp) + ' XP</small></div><div class="act">' + (d.reclame ? '<span class="cadenas">✓ Réclamé</span>' : '<button class="btn kamas" data-reclamer-defi="' + k + '"' + (d.fait >= d.but ? '' : ' disabled') + '>Réclamer</button>') + '</div></div>').join('') +
    '<div class="art">' + ico('coffre') + '<div><b>Le coffre du jour</b><div class="desc">' + (J.coffre ? 'Ouvert ! Reviens demain pour de nouveaux défis.' : 'Réussis les trois défis : ' + fmt(kamasCoffreJour()) + ' kamas et une chance sur deux de trouver une pièce d\'équipement.') + '</div></div><div class="act">' + (J.coffre ? '<span class="cadenas">✓ Ouvert</span>' : '<button class="btn kamas" data-coffre' + (tous ? '' : ' disabled') + '>Ouvrir</button>') + '</div></div>');
}
function reclamerDefi(k) {
  const J = jourCourant(), d = J && J.defis[k]; if (!d || d.reclame || d.fait < d.but) return;
  d.reclame = true; S_.kamas += d.kamas; gagnerXp(d.xp); son('kamas'); toast('Défi réussi : +' + fmt(d.kamas) + ' kamas.', 'or'); rendreHaut(); rendreObjectif(); ouvrirDefis(); sauver();
}
function ouvrirCoffre() {
  const J = jourCourant(); if (!J || J.coffre || !J.defis.every((d) => d.reclame)) return;
  J.coffre = true; const kamas = kamasCoffreJour(); S_.kamas += kamas; let objet = '';
  if (Math.random() < 0.5) { objet = donnerObjet(tirerPiece(panoDe(palierCourant()))); } /* (l'identifiant : l'animation montre la piece) */
  rendreHaut(); rendreObjectif(); sauver(); animerCoffre(kamas, objet);
}
/* le coffre arrive ferme, tremble, s'ouvre dans un eclair (images coffre-ferme / coffre-ouvert, generer-coffre.html), puis les gains sortent un par un */
function animerCoffre(kamas, id) {
  const o = id && obj(id), v = '?v=' + VERSION_MODELES;
  ouvrirModale('coffre', entete('Le coffre du jour') + '<div class="ouverture-coffre"><div class="scene-coffre"><div class="rayons"></div><img class="c-ferme" src="assets/icones/coffre-ferme.png' + v + '" alt=""><img class="c-ouvert" src="assets/icones/coffre-ouvert.png' + v + '" alt=""><div class="eclair"></div></div>' +
    '<div class="gains-coffre"><div class="gain-coffre"><img src="assets/icones/kama.png' + v + '" alt=""><b>+' + fmt(kamas) + ' kamas</b></div>' +
    (o ? '<div class="gain-coffre objet"><img src="assets/icones/' + iconeObjet(id) + '.png' + v + '" alt=""' + (o.rare ? ' class="rare"' : '') + '><div class="desc"><b>' + o.nom + '</b> <span class="puce neuf">nouveau</span><div class="puces">' + statsObjet(o) + '</div></div></div>' : '') + '</div>' +
    '<div class="boutons">' + (o ? '<button class="btn discret" data-coffre-fiche>Voir dans ma fiche</button>' : '') + '<button class="btn kamas" data-coffre-ok>Super !</button></div></div>');
  const sc = document.querySelector('.scene-coffre'), z = document.querySelector('.ouverture-coffre'), plus = (f, ms) => setTimeout(() => { if (modaleOuverte === 'coffre') f(); }, ms);
  const gains = [...z.querySelectorAll('.gain-coffre')];
  plus(() => sc.classList.add('tremble'), 450);
  plus(() => { sc.classList.remove('tremble'); sc.classList.add('flash', 'ouvert'); son('niveau'); confettis(50); }, 1450);
  gains.forEach((g, k) => plus(() => { g.classList.add('vu'); son('kamas'); }, 1850 + k * 450));
  plus(() => z.classList.add('fini'), 1850 + gains.length * 450);
}
/* ---------- la file d'actions : on touche plusieurs bulles, le paysan les enchaine ---------- */
let fileActions = [];
function enchainer() { while (fileActions.length && !arrivee && !chemin.length && !combat) { const id = fileActions.shift(); const b = bullesDyn.get('c' + id); if (b) b.classList.remove('file'); const p = S_.cases.find((c) => c.id === id); if (p) { ACTIONS.toucherCase(id); return; } } }
/* ---------- pendant ton absence ---------- */
function photoFerme() { return { murs: S_.cases.filter((c) => c.type === 'champ' && c.c && etape(c) === 'mur').length, laine: S_.bouftous.reduce((t, b) => t + (b.laine || 0), 0), plumes: S_.voliere ? S_.voliere.plumes : 0, vu: S_.vu }; }
let absence = null;
function montrerAbsence() {
  if (!absence) return; if (modaleOuverte || tuto.actif || combat || enPause || lecon.ouverte) { setTimeout(montrerAbsence, 1500); return; } /* (pas par-dessus une autre fenetre) */
  const a = absence; absence = null;
  const L = []; if (a.murs) L.push(['ble', a.murs + ' culture' + (a.murs > 1 ? 's' : '') + ' prête' + (a.murs > 1 ? 's' : '') + ' à récolter']); if (a.laine) L.push(['laine', a.laine + ' laine' + (a.laine > 1 ? 's' : '') + ' à tondre']); if (a.plumes) L.push(['plume', a.plumes + ' plume' + (a.plumes > 1 ? 's' : '') + ' à la volière']);
  if (!L.length) return;
  ouvrirModale('absence', entete('Pendant ton absence') + '<p style="font-size:.84rem;font-weight:700;margin:0 0 6px">Tu es parti ' + dureeLisible(a.duree) + '. Pépito a gardé la ferme : les monstres t\'ont attendu, mais ça a poussé.</p>' + L.map(([i, t]) => '<div class="art">' + ico(i) + '<div><b>' + t + '</b></div><div></div></div>').join('') + '<div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn kamas" data-fermer>Au travail !</button></div>');
}


