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
  const L = CULTURES.filter((c) => c.niv > avant && c.niv <= apres && !(c.nuit && !nuitDebloquee()) && !(S_.cultAcquises || []).includes(c.id)).map((c) => 'Nouvelle culture : ' + c.nom); /* (pas celles deja acquises avant le 12/10) */
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
    S_.jour = { date: auj, defis: choix.map(([cle, but, txt]) => { const b = Math.round(but * (1 + L / 25)); return { cle, but: b, txt: txt.replace('{n}', b), fait: 0, reclame: false, kamas: Math.max(kamasGagnes(40 + 15 * L), Math.round(PART_DEFI * vagueDeNiveau(L))), xp: 5 + Math.round(L / 2) }; }), coffre: false };
  }
  return S_.jour;
}
const CADEAUX = [[100, 'des graines de Blé', () => { S_.graines.ble = (S_.graines.ble || 0) + 5; }], [150, '20 flèches', () => { S_.fleches += 20; }], [200, '3 filets de capture', () => { S_.filets += 3; }], [300, 'des graines de la meilleure culture que tu puisses planter', () => { const c = CULTURES.filter(debloquee).pop(); S_.graines[c.id] = (S_.graines[c.id] || 0) + 5; }], [400, '40 flèches', () => { S_.fleches += 40; }], [500, '5 filets de capture', () => { S_.filets += 5; }], [800, 'une pièce d\'équipement de ton palier', () => { donnerObjet(tirerPiece(panoDe(palierCourant()))); /* (un vrai jet ; avant le 16/10/2026, la piece s'empilait sans caracteristiques) */ }]];
const kamasCoffreJour = () => Math.max(kamasGagnes(150 + 40 * niveau(S_.xp)), Math.round(PART_COFFRE * vagueDeNiveau(niveau(S_.xp)))); /* (le coffre des trois defis : le meme chiffre affiche et verse) */
/* (14/11/2026, « au prorata des niveaux », Mathieu, 1,7 vague par jour choisie : chaque defi vaut 30 % d'une vague de ton niveau, le coffre 80 % ; avant, 40 + 15 par niveau
   et 150 + 40 par niveau, soit 0,9 vague au niveau 90 contre 2,9 au niveau 5 ; jamais moins qu'avant, les petits niveaux gardent leurs chiffres) */
const PART_DEFI = 0.3, PART_COFFRE = 0.8, PARTS_CADEAU = [0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 1];
const kamasCadeau = (j) => Math.max(CADEAUX[j][0], Math.round(PARTS_CADEAU[j] * vagueDeNiveau(niveau(S_.xp)))); /* (la serie de connexion au niveau : du jour 1 au jour 7, de 15 % a 100 % d'une vague de ton niveau, jamais moins qu'avant, 14/11/2026) */
CADEAUX.forEach((c) => { c[0] = kamasGagnes(c[0]); }); OBJECTIFS.forEach((o) => { o[3] = kamasGagnes(o[3]); }); /* (le cadeau du jour et les objectifs de Pepito, -10 %) */
function cadeauDuJour() {
  if (!S_ || !S_.perso || combat) return; const auj = jourDe(tempsReel()), hier = jourDe(tempsReel() - 86400000); S_.serie = S_.serie || { n: 0, date: null };
  if (S_.serie.date === auj) return;
  S_.serie.n = S_.serie.date === hier ? S_.serie.n + 1 : 1; S_.serie.date = auj; const k = (S_.serie.n - 1) % 7, [, quoi, donner] = CADEAUX[k], kamas = kamasCadeau(k);
  S_.kamas += kamas; donner(); sauver(); rendreHaut(); rendreGrange();
  const montrer = () => { if (modaleOuverte || document.querySelector('.fete')) { setTimeout(montrer, 1500); return; } son('quete'); confettis(30); ouvrirModale('cadeau', entete('Cadeau du jour') + '<p style="text-align:center;font-size:.86rem;font-weight:700;margin:0">Jour ' + S_.serie.n + ' de ta série. Reviens demain pour un cadeau plus gros !</p><div class="serie">' + CADEAUX.map((c, j) => '<i class="' + (j < k ? 'fait' : j === k ? 'ici' : '') + '">J' + (j + 1) + '<br>' + (j === 6 ? '★' : fmt(kamasCadeau(j))) + '</i>').join('') + '</div><div class="art">' + ico('coffre') + '<div><b>+' + fmt(kamas) + ' ' + KAMA + ' et ' + quoi + '</b><div class="desc">Une série qui se casse repart au jour 1. Au jour 7 : une pièce d\'équipement.</div></div><div></div></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn kamas" data-fermer>Merci Pépito !</button></div>'); }; setTimeout(montrer, 900); /* (il attend qu'aucune autre fenetre ne soit ouverte) */
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
function placerElevage() { limiterGrange(); const g = $('panneau-grange'), e = $('panneau-elevage'); if (g && e && !e.hidden) e.style.top = (g.getBoundingClientRect().bottom + 10) + 'px'; }
/* (06/11/2026, « que ca se limite a la taille de l'ecran, et s'il y a des ressources en plus, il faut scroller a l'interieur du bloc », Mathieu) : la liste de la
   grange s'arrete au bas de l'ecran, au-dessus de la barre d'actions si elle passe dessous, en laissant la place de « Tes betes » ; au-dela, elle defile */
function limiterGrange() {
  const g = $('panneau-grange'), d = g && g.querySelector('.defile'); if (!d || !d.offsetParent) return;
  const e = $('panneau-elevage'), a = document.querySelector('.actions'), r = g.getBoundingClientRect(), ra = a && a.offsetParent ? a.getBoundingClientRect() : null;
  const bas = ra && ra.right > r.left - 6 && ra.left < r.right + 6 ? ra.top - 10 : innerHeight - 12, betes = e && !e.hidden ? e.offsetHeight + 10 : 0;
  d.style.maxHeight = Math.max(110, bas - betes - r.top - (g.offsetHeight - d.offsetHeight)) + 'px';
}
/* replier un panneau d'un clic sur son titre (la grange, « Tes betes »), retenu dans le navigateur (06/11/2026, « qu'on puisse reduire la fenetre », Mathieu) */
['panneau-grange', 'panneau-elevage'].forEach((id) => { const p = document.getElementById(id); if (!p) return; const cle = 'ferme-replie-' + id; /* ($ n'est defini qu'en 25-interface.js) */
  try { p.classList.toggle('replie', localStorage.getItem(cle) === '1'); } catch (e) { /* rien */ }
  p.addEventListener('click', (ev) => { if (!ev.target.closest('h2')) return; const r = p.classList.toggle('replie'); try { localStorage.setItem(cle, r ? '1' : '0'); } catch (e) { /* rien */ } placerPanneaux(); }); });
function rendreElevage() {
  const e = $('panneau-elevage'); if (!e || !S_) return;
  const L = [['tofu', 'Tofus', 'volière', S_.tofus || 0, capaciteVoliere()], ['bouftou', 'Bouftous', 'enclos', S_.bouftous.length, capacite()]]
    .concat(niv('geliere') ? [['gelee-fraise', 'Gelées', 'gelière', (S_.gelees || []).length, placesGeliere()]] : []);
  const h = '<h2 class="pli">Tes bêtes<span class="chev"></span></h2>' + L.map(([ic, nom, ou, n, max]) => '<div class="l"><span class="n">' + icoGrange(ic) + nom + ' <small>(' + ou + ')</small></span><span class="cpt' + (n >= max ? ' plein' : '') + '">' + n + '/' + max + '</span></div>').join('');
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
  if (Math.random() < 0.5) { objet = donnerObjet(tirerPiece(panoAuHasard(palierCourant()))); } /* (l'identifiant : l'animation montre la piece) */
  rendreHaut(); rendreObjectif(); sauver(); animerCoffre(kamas, objet);
}
/* le coffre arrive ferme, tremble, s'ouvre dans un eclair, puis les gains sortent un par un ; le coffre est en 3D et anime (coffre3d, 05/11/2026),
   les images coffre-ferme / coffre-ouvert (generer-coffre.html) ne servent plus que si la 3D manque */
/* la scene du coffre (le coffre 3D, et les images si la 3D manque) et son ouverture, pour toute fenetre : le coffre du jour, celui de l'ile des boss,
   ceux des boss de l'Arene (05/11/2026) ; cle : la fenetre ouverte (l'ouverture s'arrete si on la ferme) */
const sceneCoffre = () => { const v = '?v=' + VERSION_MODELES; return '<div class="scene-coffre"><div class="rayons"></div><img class="c-ferme" src="assets/icones/coffre-ferme.png' + v + '" alt=""><img class="c-ouvert" src="assets/icones/coffre-ouvert.png' + v + '" alt=""><canvas class="coffre3d" width="520" height="460"></canvas><div class="eclair"></div></div>'; };
function jouerCoffre(cle) {
  const z = document.querySelector('.ouverture-coffre'), sc = z && z.querySelector('.scene-coffre'); if (!sc) return; const plus = (f, ms) => setTimeout(() => { if (modaleOuverte === cle && z.isConnected) f(); }, ms);
  const gains = [...z.querySelectorAll('.gain-coffre')];
  try { if (coffre3d(sc.querySelector('canvas.coffre3d'))) sc.classList.add('avec3d'); } catch (e) { console.warn('coffre 3D', e); }
  plus(() => sc.classList.add('tremble'), 450);
  plus(() => { sc.classList.remove('tremble'); sc.classList.add('flash', 'ouvert'); son('niveau'); confettis(50); }, 1450);
  gains.forEach((g, k) => plus(() => { g.classList.add('vu'); son('kamas'); }, 1850 + k * 450));
  plus(() => z.classList.add('fini'), 1850 + gains.length * 450);
}
function animerCoffre(kamas, id) {
  const o = id && obj(id), v = '?v=' + VERSION_MODELES;
  ouvrirModale('coffre', entete('Le coffre du jour') + '<div class="ouverture-coffre">' + sceneCoffre() +
    '<div class="gains-coffre"><div class="gain-coffre"><img src="assets/icones/kama.png' + v + '" alt=""><b>+' + fmt(kamas) + ' kamas</b></div>' +
    (o ? '<div class="gain-coffre objet"><img src="assets/icones/' + iconeObjet(id) + '.png' + v + '" alt=""' + (o.rare ? ' class="rare"' : '') + '><div class="desc"><b>' + o.nom + '</b> <span class="puce neuf">nouveau</span><div class="puces">' + statsObjet(o) + '</div></div></div>' : '') + '</div>' +
    '<div class="boutons">' + (o ? '<button class="btn discret" data-coffre-fiche>Voir dans ma fiche</button>' : '') + '<button class="btn kamas" data-coffre-ok>Super !</button></div></div>');
  jouerCoffre('coffre');
}
/* LE COFFRE EN 3D (05/11/2026, « le coffre, c'est celui-la qu'on va prendre et animer quand on ouvre nos coffres en jeu ; on a un coffre trop fade »,
   Mathieu) : le coffre au tresor de l'icone du jackpot (generer-icone-jackpot.html, piste B), construit ici en toon comme le reste du jeu : bois
   rouge-brun, ferrures et coins d'or, serrure, couvercle bombe ; dedans un tas de kamas du jeu en or franc et des gemmes. Son ouverture suit le rythme
   de la fenetre (animerCoffre) : il tombe et rebondit (0 a 0,4 s), tremble, le couvercle claque (0,45 a 1,45 s), s'ouvre d'un coup en rebondissant
   sur sa charniere, une lumiere d'or jaillit du dedans et des kamas et des gemmes sautent en l'air et retombent autour ; puis il tourne doucement. */
const COFFRE3D = { r: null, sc: null, cam: null, base: null, R: 0.1, EP: 0.02, piece: null };
const COF_OR = { kama_bord: '#ffcd38', kama_cran: '#8a4b00', kama_motif: '#ffd95a', kama: '#e89b06' };
function cofPiece() { /* un kama du jeu en or franc, centre et couche a plat */
  if (!COFFRE3D.piece) {
    const src = MODELES.kamaPiece; if (!src) return null;
    const k = src.clone(true); k.position.set(0, 0, 0); k.rotation.set(0, 0, 0); k.scale.set(1, 1, 1);
    k.traverse((x) => { if (!x.isMesh || x.material.side === T.BackSide) return; const n = x.name.replace(/\.?\d+$/, ''); x.material = toon(new T.Color(COF_OR[n] || COF_OR.kama)); x.castShadow = false; });
    const b = new T.Box3().setFromObject(k), s = b.getSize(new T.Vector3()), c = b.getCenter(new T.Vector3());
    const R = Math.max(s.x, s.y, s.z) / 2, EP = Math.min(s.x, s.y, s.z); k.position.sub(c);
    const p = new T.Group(); p.add(k); if (s.x === EP) p.rotation.z = Math.PI / 2; else if (s.z === EP) p.rotation.x = Math.PI / 2;
    const g = new T.Group(); g.add(p); g.scale.setScalar(0.1 / R); COFFRE3D.piece = g; COFFRE3D.EP = EP * 0.1 / R; /* (le kama ramene a un rayon de 0,1) */
  }
  return COFFRE3D.piece.clone(true);
}
function cofMaille(geo, c, sansContour) { const g = new T.Group(), m = new T.Mesh(geo, toon(new T.Color(c))); g.add(m); if (!sansContour) g.add(new T.Mesh(geo, contourMat(0.006))); return g; }
function cofGemme(c, t, rond) { const g = cofMaille(rond ? new T.IcosahedronGeometry(t, 0) : new T.OctahedronGeometry(t, 0), c); if (!rond) g.scale.set(1, 1.35, 1);
  const r = new T.Mesh(new T.SphereGeometry(t * 0.22, 8, 6), new T.MeshBasicMaterial({ color: '#ffffff' })); r.position.set(-t * 0.35, t * 0.45, t * 0.55); g.add(r); return g; }
function construireCoffre3d() {
  const R = 0.1, L = R * 7.2, P = R * 4.4, H = R * 3.4, BOISC = '#9a4b22', BOISF = '#6e3214', FERR = '#f0b52a', g = new T.Group();
  const pose = (o, x, y, z, rx, ry, rz, par) => { o.position.set(x, y, z); o.rotation.set(rx || 0, ry || 0, rz || 0); (par || g).add(o); return o; };
  const B = (w, h, d, c) => cofMaille(new T.BoxGeometry(w, h, d), c);
  pose(B(L, H, P, BOISC), 0, H / 2, 0);
  [-1, 1].forEach((s) => { pose(B(R * 0.5, H * 1.02, P * 1.04, FERR), s * L * 0.33, H / 2, 0); [-1, 1].forEach((t) => pose(B(R * 0.55, H * 1.03, R * 0.55, FERR), s * L * 0.49, H / 2, t * P * 0.49)); });
  [0.3, 0.7].forEach((k) => pose(B(L * 1.005, R * 0.12, P * 1.005, BOISF), 0, H * k, 0));
  pose(B(R * 1.1, R * 1.3, R * 0.3, FERR), 0, H * 0.72, P / 2 + R * 0.12); pose(cofMaille(new T.CircleGeometry(R * 0.22, 12), '#3a1a06', true), 0, H * 0.74, P / 2 + R * 0.28);
  pose(B(L * 0.94, R * 0.05, P * 0.9, '#2a1206'), 0, H * 0.985, 0);   /* (le fond sombre, sous le tas) */
  const tas = new T.Group(); tas.position.y = H * 0.9; g.add(tas);
  let s0 = 7; const h = () => (s0 = (s0 * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 30; i++) { const a = i * 2.4, r = R * 3.0 * Math.sqrt((i + 0.5) / 30), y = (1 - (r / (R * 3.0)) ** 2) * R * 1.4 + h() * R * 0.15, k = cofPiece(); if (!k) return null;
    pose(k, Math.cos(a) * r * 1.05, y, Math.sin(a) * r * (P / (R * 6.6)), (h() - 0.5) * 0.9, h() * 6, (h() - 0.5) * 0.9, tas); }
  [[-L * 0.28, R * 1.1, R * 0.5, '#e0233c'], [L * 0.2, R * 1.2, -R * 0.4, '#25b864', true], [L * 0.04, R * 1.6, R * 0.6, '#2f7fe8'], [-L * 0.06, R * 1.5, -R * 0.9, '#a23ae0']].forEach(([x, y, z, c, rond], i) => pose(cofGemme(c, R * 0.4, rond), x, y, z, 0.3, i, 0.2, tas));
  const ch = new T.Group(); ch.position.set(0, H, -P / 2); g.add(ch);   /* (la charniere a l'arriere) */
  const cv = cofMaille(new T.CylinderGeometry(P / 2, P / 2, L, 28, 1, false, 0, Math.PI), BOISC); cv.rotation.z = Math.PI / 2; cv.position.set(0, 0, P / 2); ch.add(cv);
  pose(B(L, R * 0.18, P, BOISF), 0, -R * 0.09, P / 2, 0, 0, 0, ch);
  [-1, 1].forEach((s) => { const ba = cofMaille(new T.TorusGeometry(P / 2 * 1.02, R * 0.14, 6, 24, Math.PI), FERR); ba.rotation.y = Math.PI / 2; ba.position.set(s * L * 0.33, 0, P / 2); ch.add(ba);
    const bo = cofMaille(new T.CylinderGeometry(P / 2 * 1.02, P / 2 * 1.02, R * 0.5, 28, 1, false, 0, Math.PI), FERR); bo.rotation.z = Math.PI / 2; bo.position.set(s * L * 0.49, 0, P / 2); ch.add(bo); });
  pose(B(R * 1.0, R * 0.7, R * 0.25, FERR), 0, -R * 0.25, P + R * 0.1, 0, 0, 0, ch);   /* (le moraillon de la serrure) */
  const lum = new T.PointLight('#ffc845', 0, R * 14); lum.position.set(0, H + R * 1.2, 0); g.add(lum);
  return { g, ch, lum, L, P, H, R };
}
function coffre3d(cv) {
  if (!cv || !MODELES.kamaPiece) return false;
  const C = COFFRE3D;
  if (!C.r) { C.r = new T.WebGLRenderer({ canvas: document.createElement('canvas'), antialias: true, alpha: true }); C.r.setPixelRatio(1); C.r.setClearColor(0x000000, 0);
    C.sc = new T.Scene(); C.sc.add(new T.HemisphereLight('#fff1d6', '#7f5a2e', 0.5)); const d = new T.DirectionalLight('#fff0d0', 0.8); d.position.set(-3, 6, 5); C.sc.add(d); const r = new T.DirectionalLight('#ffd27a', 0.35); r.position.set(4, 2, -5); C.sc.add(r);
    C.cam = new T.PerspectiveCamera(30, cv.width / cv.height, 0.05, 50); }
  if (C.base) C.sc.remove(C.base.g);
  const B = construireCoffre3d(); if (!B) return false; C.base = B; C.sc.add(B.g);
  C.r.setSize(cv.width, cv.height, false); C.cam.aspect = cv.width / cv.height; C.cam.updateProjectionMatrix();
  C.cam.position.set(B.L * 1.35, B.H * 4.4, B.L * 3.3); C.cam.lookAt(0, B.H * 1.15, 0);   /* (assez de recul pour le couvercle ouvert et les kamas qui sautent) */
  const ctx = cv.getContext('2d'), sauts = [], debut = performance.now(), G = 3.2;
  const lancer = () => { for (let i = 0; i < 18; i++) { const gm = i >= 14, o = gm ? cofGemme(['#e0233c', '#25b864', '#2f7fe8', '#a23ae0'][i - 14], B.R * 0.35, i === 15) : cofPiece(); if (!o) break;
      const a = Math.random() * Math.PI * 2, v = 0.4 + Math.random() * 0.45; if (!gm) o.scale.multiplyScalar(0.78); o.position.set((Math.random() - 0.5) * B.L * 0.5, B.H * 1.05, (Math.random() - 0.5) * B.P * 0.4); B.g.add(o);
      sauts.push({ o, v: new T.Vector3(Math.cos(a) * v * 0.42, 1.35 + Math.random() * 0.8, Math.sin(a) * v * 0.3 + 0.12), w: new T.Vector3(Math.random() * 9, Math.random() * 9, Math.random() * 9), pose: false }); } };
  let lance = false, prec = debut;
  const image = (now) => {
    if (!cv.isConnected) { C.sc.remove(B.g); return; } /* (la fenetre fermee ou redessinee : il s'arrete) */
    const t = (now - debut) / 1000, dt = Math.min(0.05, (now - prec) / 1000); prec = now;
    const g = B.g; g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.scale.set(1, 1, 1);
    if (t < 0.4) { const k = t / 0.4; g.position.y = B.H * 2.6 * (1 - k) * (1 - k); }   /* (il tombe) */
    else if (t < 0.6) { const k = (t - 0.4) / 0.2, e = Math.sin(k * Math.PI); g.scale.set(1 + 0.12 * e, 1 - 0.16 * e, 1 + 0.12 * e); }   /* (il s'ecrase en touchant le sol) */
    let ang = 0;
    if (t >= 0.45 && t < 1.45) { const k = (t - 0.45) / 1.0; g.rotation.z = Math.sin(t * 62) * 0.045 * (0.4 + k); g.position.x = Math.sin(t * 47) * B.R * 0.12 * k; ang = -0.16 * Math.abs(Math.sin(t * 24)) * k; }   /* (il tremble, le couvercle claque) */
    if (t >= 1.45) { const k = t - 1.45; ang = -1.92 - 0.35 * Math.exp(-k * 5) * Math.cos(k * 16); if (k < 0.12) ang = -1.92 * (k / 0.12) - 0.1; /* (il s'ouvre d'un coup et rebondit sur sa charniere) */
      if (!lance) { lance = true; lancer(); }
      B.lum.intensity = 2.6 * Math.exp(-k * 1.6) + 0.6;
      g.rotation.y = Math.sin(k * 0.7) * 0.32 * Math.min(1, k / 1.5); }
    B.ch.rotation.x = ang;
    sauts.forEach((s) => { if (s.pose) return; s.v.y -= G * dt; s.o.position.addScaledVector(s.v, dt); s.o.rotation.x += s.w.x * dt; s.o.rotation.y += s.w.y * dt; s.o.rotation.z += s.w.z * dt;
      if (s.o.position.y <= B.R * 0.04 && s.v.y < 0) { if (Math.abs(s.v.y) > 0.6) { s.v.y *= -0.35; s.v.x *= 0.5; s.v.z *= 0.5; s.w.multiplyScalar(0.4); } else { s.o.position.y = B.R * 0.04; s.o.rotation.set(-Math.PI / 2 * 0 + (Math.random() - 0.5) * 0.3, s.o.rotation.y, (Math.random() - 0.5) * 0.3); s.pose = true; } } });
    C.r.render(C.sc, C.cam); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(C.r.domElement, 0, 0);
    requestAnimationFrame(image);
  };
  requestAnimationFrame(image); return true;
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


