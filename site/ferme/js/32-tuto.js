'use strict';
/* ===================== LE TUTO DU DEBUT (11/10/2026) =====================
   « faudrait creer un petit tuto du debut, les trucs de base », puis « y'a pas eu le tuto de depart » (Mathieu, retours de la beta sur tablette).
   Pepito guide 9 etapes (maquette maquettes/ferme-amakna-tuto.png) : la case a toucher brille avec une fleche, la carte en bas dit quoi faire,
   l'etape passe toute seule quand c'est fait. Il se lance pour un debutant (niveau < 5) qui ne l'a jamais vu ; « Revoir le tuto » dans Options. */
const tuto = { actif: false, etape: 0, base: {}, el: null, depart: null, vue: null, revoir: false, h: '', s: '' };
const tutoDoigt = () => matchMedia('(pointer: coarse)').matches;
const SOURIS_SVG = (bouton) => '<svg class="tuto-souris" viewBox="0 0 46 62" aria-hidden="true"><rect x="3" y="3" width="40" height="56" rx="20" fill="#fffdf6" stroke="#3b2a1a" stroke-width="3"/><path d="M23 3 V26 M3 26 H43" stroke="#3b2a1a" stroke-width="3"/>' +
  (bouton === 'droit' ? '<path d="M24.5 4.6 A18.5 18.5 0 0 1 41.5 23 V24.5 H24.5 Z" fill="#f2b630"/>' : bouton === 'gauche' ? '<path d="M21.5 4.6 A18.5 18.5 0 0 0 4.5 23 V24.5 H21.5 Z" fill="#f2b630"/>' : '') + '</svg>';
const DOIGT_SVG = (long) => '<svg class="tuto-souris" viewBox="0 0 46 62" aria-hidden="true"><circle cx="23" cy="24" r="18" fill="none" stroke="#f2b630" stroke-width="4"' + (long ? '' : ' stroke-dasharray="8 6"') + '/><circle cx="23" cy="24" r="8" fill="#f2b630" stroke="#3b2a1a" stroke-width="3"/><text x="23" y="56" text-anchor="middle" font-size="10" font-weight="800" fill="#3b2a1a">' + (long ? 'appui' : 'tap') + '</text></svg>';
const champTuto = () => S_.cases.find((c) => c.id === tuto.champ) || S_.cases.find((c) => c.type === 'champ');
const ETAPES_TUTO = [
  { id: 'accueil' },
  { id: 'deplacer', avant() { const ici = paysanMesh && (paysanMesh.userData.cellule || caseIci(paysanMesh.position.x, paysanMesh.position.z)); tuto.depart = ici ? ici.id : null;
      const L = S_.cases.filter((c) => c.type === 'libre' && c.terrain === 'main' && ici && Math.abs(c.i - ici.i) + Math.abs(c.j - ici.j) >= 2 && Math.abs(c.i - ici.i) + Math.abs(c.j - ici.j) <= 3);
      /* une case vraiment touchable : a l'ecran, loin des bords, et sans rien par-dessus (au telephone, la pancarte d'un terrain a vendre la cachait et le tuto bloquait) */
      const r = rendu.domElement.getBoundingClientRect(), libre = (c) => { const q = posCase(c), v = new T.Vector3(q.x, q.y + 0.1, q.z).project(camera), x = r.left + (v.x + 1) / 2 * r.width, y = r.top + (1 - v.y) / 2 * r.height;
        if (x < 40 || x > innerWidth - 40 || y < 90 || y > innerHeight - 260) return false; const e = document.elementsFromPoint(x, y).find((el) => !el.closest('#tuto')); return !!e && (e === rendu.domElement || e.tagName === 'CANVAS'); }; /* (sous le voile du tuto : la premiere couche doit etre le jeu lui-meme) */
      const vus = L.filter(libre); tuto.cible = ((vus.length ? vus : L).sort((a, b) => Math.abs(a.j - ici.j) - Math.abs(b.j - ici.j))[0] || null); },
    cases: () => tuto.cible ? [tuto.cible] : [], etiq: () => tutoDoigt() ? 'Reste appuyé' : 'Clic gauche', picto: () => tutoDoigt() ? DOIGT_SVG(true) : SOURIS_SVG('gauche'),
    texte: () => tutoDoigt() ? 'Pour te déplacer, <em>reste appuyé</em> sur la case qui brille : ton perso y va, sans rien faire d\'autre.' : 'Pour te déplacer, fais un <em>clic gauche</em> sur la case qui brille : ton perso y va.',
    fait: () => { const c = paysanMesh && paysanMesh.userData.cellule; return !!c && c.id !== tuto.depart; } },
  { id: 'vue', avant() { tuto.vue = { x: VISEE.x, z: VISEE.z, zoom }; }, picto: () => tutoDoigt() ? DOIGT_SVG(false) : SOURIS_SVG(''), suivant: 'Suivant',
    texte: () => tutoDoigt() ? 'Fais <em>glisser un doigt</em> pour bouger la vue, et <em>pince à deux doigts</em> pour zoomer.' : 'Maintiens le clic et <em>fais glisser</em> pour bouger la vue. La <em>molette</em> zoome.',
    fait: () => !pDown && (Math.hypot(VISEE.x - tuto.vue.x, VISEE.z - tuto.vue.z) > 1.5 || Math.abs(zoom - tuto.vue.zoom) > 0.15) }, /* (une fois le doigt leve : sinon la vue bougeait encore apres le recentrage de l'etape suivante) */
  { id: 'recolter', avant() { let p = S_.cases.find((c) => c.type === 'champ' && c.c && !c.tofu && c.pousse >= duree(PAR_ID[c.c])) || S_.cases.find((c) => c.type === 'champ' && c.c && !c.tofu) || S_.cases.find((c) => c.type === 'champ');
      if (p) tuto.champ = p.id; if (p && !tuto.revoir) { if (!p.c) Object.assign(p, { c: 'ble', arrose: true }); p.pousse = duree(PAR_ID[p.c]); rendreCase(p.id); rendreCasesBulles(); } }, /* (en le revoyant : rien d'offert) */
    cases: () => [champTuto()].filter(Boolean), etiq: () => tutoDoigt() ? 'Touche' : 'Clic droit', haut: 1.9, picto: () => tutoDoigt() ? DOIGT_SVG(false) : SOURIS_SVG('droit'),
    texte: () => 'Ton <em>' + (PAR_ID[(champTuto() || {}).c] || PAR_ID.ble).nom + '</em> est mûr ! ' + (tutoDoigt() ? '<em>Touche-le</em>' : 'Fais un <em>clic droit</em> dessus') + ' pour le récolter. Ton perso y va tout seul.',
    compteur: 'recoltes' },
  { id: 'planter', avant() { if (!tuto.revoir && !(S_.graines.ble > 0) && !CULTURES.some((c) => debloquee(c) && S_.graines[c.id] > 0)) S_.graines.ble = 1; },
    cases: () => [champTuto()].filter(Boolean), etiq: () => tutoDoigt() ? 'Touche' : 'Clic droit', picto: () => tutoDoigt() ? DOIGT_SVG(false) : SOURIS_SVG('droit'),
    texte: () => 'La parcelle est vide : ' + (tutoDoigt() ? '<em>touche-la</em>' : 'un <em>clic droit</em> dessus') + ' pour planter une graine.', compteur: 'plantes' },
  { id: 'arroser', cases: () => [champTuto()].filter(Boolean), etiq: () => tutoDoigt() ? 'Touche' : 'Clic droit', picto: () => tutoDoigt() ? DOIGT_SVG(false) : SOURIS_SVG('droit'),
    texte: () => 'Arrose ton semis : ' + (tutoDoigt() ? '<em>touche-le</em> encore' : 'encore un <em>clic droit</em>') + '. Arrosé, il pousse deux fois et demie plus vite. L\'arrosoir se remplit au puits.',
    compteur: 'arrosages', saute: () => { const p = champTuto(); return !tuto.revoir && (!p || !p.c || p.arrose); } },
  { id: 'nourrir', avant() { if (!tuto.revoir && (S_.grange.ble || 0) < REPAS) { S_.grange.ble = (S_.grange.ble || 0) + REPAS; rendreGrange(); } },
    cases: () => S_.cases.filter((c) => c.type === 'enclos'), etiq: () => tutoDoigt() ? 'Touche' : 'Clic droit', haut: 1.6, picto: () => tutoDoigt() ? DOIGT_SVG(false) : SOURIS_SVG('droit'),
    texte: () => '<em>' + ((S_.bouftous[0] || {}).nom || 'Ton Bouftou') + '</em> a faim : ' + (tutoDoigt() ? '<em>touche-le</em>' : 'un <em>clic droit</em> sur lui') + ' pour le nourrir avec du Blé. Nourri, il fait de la laine que tu revends.',
    compteur: 'repas', saute: () => !tuto.revoir && !S_.bouftous.some((b) => Date.now() >= b.rassasie) },
  { id: 'tofu', avant() { if (tuto.revoir) return; const p = champTuto() || S_.cases.find((c) => c.type === 'champ' && c.c); if (p && !p.tofu) { p.tofu = Date.now(); p.nuisible = null; rendreCase(p.id); rendreCasesBulles(); } tuto.tofu = p ? p.id : null; },
    cases: () => [S_.cases.find((c) => c.id === tuto.tofu && c.tofu)].filter(Boolean), etiq: () => tutoDoigt() ? 'Touche' : 'Clic droit', haut: 1.7, picto: () => tutoDoigt() ? DOIGT_SVG(false) : SOURIS_SVG('droit'),
    texte: () => 'Un <em>Tofu</em> picore ton champ ! ' + (tutoDoigt() ? '<em>Touche-le</em>' : 'Un <em>clic droit</em> dessus') + ' pour le chasser, sinon il te vole des récoltes. Plus tard, avec un <em>filet</em> (HDV), tu pourras le capturer pour ta volière.',
    compteur: 'tofusChasses', saute: () => tuto.revoir && !S_.cases.some((c) => c.type === 'champ' && c.tofu && c.nuisible !== 'wabbit') }, /* (22/10/2026) */
  { id: 'vendre', anneaux: () => modaleOuverte === 'hdv' ? [document.querySelector('[data-hdv-onglet="vendre"][aria-pressed="false"]') || document.querySelector('#carte [data-vendre]')] : [$('b-hdv')],
    etiq: () => modaleOuverte === 'hdv' ? (document.querySelector('[data-hdv-onglet="vendre"][aria-pressed="false"]') ? 'Vendre' : 'Ici') : 'HDV',
    texte: () => 'Ta récolte est à la grange. Vends-la à l\'<em>HDV</em> : le bouton en bas, onglet <em>Vendre</em>.', compteur: 'ventes', garder: true },
  { id: 'acheter', avant() { if (!tuto.revoir && S_.kamas < prixGraine(PAR_ID.ble)) { S_.kamas = prixGraine(PAR_ID.ble); rendreHaut(); } }, /* (22/10/2026) */
    anneaux: () => modaleOuverte === 'hdv' ? [document.querySelector('[data-hdv-onglet="acheter"][aria-pressed="false"]') || document.querySelector('#carte [data-graines="ble"]') || document.querySelector('#carte [data-graines]')] : [$('b-hdv')],
    etiq: () => modaleOuverte === 'hdv' ? (document.querySelector('[data-hdv-onglet="acheter"][aria-pressed="false"]') ? 'Acheter' : 'Ici') : 'HDV',
    texte: () => 'Rachète des <em>graines</em> pour replanter : onglet <em>Acheter</em> de l\'HDV. Les autres cultures se débloquent avec ton niveau, et le bouton <em>Graines</em> choisit ce que ton perso plante.', compteur: 'achatsGraines', garder: true },
  { id: 'construire', anneaux: () => modaleOuverte === 'hdv' ? [document.querySelector('[data-hdv-onglet="construire"]')] : [$('b-hdv')], etiq: () => modaleOuverte === 'hdv' ? 'Construire' : 'HDV',
    texte: () => 'L\'onglet <em>Construire</em> : les bâtiments à poser sur ta ferme (arbalète, tours, Gelière...), qui se débloquent avec ton niveau. Ceux que tu as déjà montent de niveau dans <em>Améliorer</em>. Jette un œil !',
    fait: () => modaleOuverte === 'hdv' && ouvrirHdv.dernier === 'construire', garder: true },
  { id: 'fin', anneaux: () => [$('objectif'), $('b-vagues')], suivant: 'À toi de jouer !',
    texte: () => 'C\'est tout pour les bases ! Mes <em>objectifs</em>, en haut à gauche, te guident pour la suite. Quand tu te sens prêt, le bouton <em>Vagues</em> : des monstres grimpent par les bords de l\'île. Défends la ferme pour gagner kamas et équipement : je t\'explique le combat à ta première vague, et chaque nouveauté au moment où tu la découvres.' }
];
function demarrerTuto(depuis, revoir) {
  if (!S_ || !S_.perso || combat) return; tuto.revoir = !!revoir;
  S_.astuceClics = true; S_.astuceDoigt = true; /* le tuto montre les clics : pas besoin de l'astuce en plus */
  if (!tuto.el) {
    tuto.el = document.createElement('div'); tuto.el.id = 'tuto'; document.body.appendChild(tuto.el);
    tuto.el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; e.stopPropagation();
      if (b.hasAttribute('data-tuto-passer')) finirTuto('passe'); else if (b.hasAttribute('data-tuto-go')) allerEtapeTuto(1); else if (b.hasAttribute('data-tuto-suivant')) { if (ETAPES_TUTO[tuto.etape].id === 'fin') finirTuto('fini'); else allerEtapeTuto(tuto.etape + 1); } });
  }
  tuto.actif = true; $('hud').classList.add('en-tuto'); rendreObjectif(); allerEtapeTuto(depuis || 0); requestAnimationFrame(majTuto);
}
function allerEtapeTuto(n) {
  while (n < ETAPES_TUTO.length && ETAPES_TUTO[n].saute && ETAPES_TUTO[n].saute()) n++; /* (deja fait : par exemple la citerne a arrose le semis) */
  if (n >= ETAPES_TUTO.length) { finirTuto('fini'); return; }
  const E = ETAPES_TUTO[n]; tuto.etape = n; S_.tutoEtape = n;
  if (E.avant) E.avant();
  if (E.cases) { /* la case a toucher est hors de l'ecran (on a pu faire glisser la vue a l'etape d'avant, surtout au telephone) : la vue s'y recentre */
    const L = E.cases(), r = rendu.domElement.getBoundingClientRect();
    if (L.length && !L.some((c) => { const q = posCase(c), v = new T.Vector3(q.x, q.y, q.z).project(camera), x = r.left + (v.x + 1) / 2 * r.width, y = r.top + (1 - v.y) / 2 * r.height; return x > 40 && x < innerWidth - 40 && y > 90 && y < innerHeight - 260; })) {
      const q = posCase(L[0]); VISEE.set(q.x + 0.6, VISEE.y, q.z + 0.6); placerCamera();
    }
  }
  if (E.compteur) tuto.base[E.id] = valeurCompteur(E.compteur);
  if (E.id === 'fin') rendreObjectif(); /* les objectifs reapparaissent pour la derniere etape */
  dessinerTuto(); sauver();
}
function etapeFaite(E) { return E.compteur ? valeurCompteur(E.compteur) > (tuto.base[E.id] || 0) : E.fait ? E.fait() : false; }
function finirTuto(comment) {
  tuto.actif = false; S_.tuto = comment; delete S_.tutoEtape; if (tuto.el) tuto.el.innerHTML = ''; $('hud').classList.remove('en-tuto'); rendreObjectif(); sauver();
  if (comment === 'fini') { son('quete'); toast('Bravo, tu connais les bases ! Suis les objectifs de Pépito pour la suite.', 'or'); }
  setTimeout(cadeauDuJour, 900); /* (le cadeau du jour attendait la fin du tuto) */
}
function dessinerTuto() {
  if (!tuto.actif || !tuto.el) return;
  const n = tuto.etape, E = ETAPES_TUTO[n], points = '<span class="tuto-points">' + ETAPES_TUTO.map((_, k) => '<i class="' + (k < n ? 'ok' : k === n ? 'ici' : '') + '"></i>').join('') + '</span>';
  if (E.id === 'accueil') {
    tuto.el.innerHTML = '<div class="tuto-voile"></div><div class="tuto-carte centre"><h2>Bienvenue à la ferme !</h2><p>Salut, moi c\'est <em>Pépito</em>, le commis. Je te montre les bases ? Trois minutes, promis.</p><div class="tuto-boutons"><button class="btn discret" data-tuto-passer>Je connais déjà</button><button class="btn kamas grand" data-tuto-go>C\'est parti !</button></div></div>';
    return;
  }
  tuto.el.innerHTML = '<svg class="tuto-sol"></svg><div class="tuto-reperes"></div><div class="tuto-carte"><div class="tuto-tete"><b>Pépito</b> Étape ' + (n + 1) + ' sur ' + ETAPES_TUTO.length + points + '<button class="tuto-passer" data-tuto-passer>Passer le tuto</button></div>' +
    '<div class="tuto-corps">' + (E.picto ? E.picto() : '') + '<p>' + E.texte() + '</p></div>' + (E.suivant || tuto.revoir ? '<div class="tuto-boutons droite"><button class="btn kamas" data-tuto-suivant>' + (E.suivant || 'Suivant') + '</button></div>' : '') + '</div>';
  tuto.texte = E.texte(); tuto.h = ''; tuto.s = '';
}
const projeterTuto = (x, y, z) => { const v = new T.Vector3(x, y, z).project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; };
function majTuto() { /* chaque image : les reperes suivent la camera, et l'etape passe des qu'elle est faite */
  if (!tuto.actif) return; requestAnimationFrame(majTuto);
  const E = ETAPES_TUTO[tuto.etape]; if (!E || E.id === 'accueil') return;
  if (etapeFaite(E)) { son('quete'); if (E.id === 'fin') return; allerEtapeTuto(tuto.etape + 1); return; }
  const carte = tuto.el.querySelector('.tuto-carte'); if (carte) carte.classList.toggle('cachee', !!modaleOuverte && !(E.garder && modaleOuverte === 'hdv')); /* une fenetre ouverte : la carte s'efface, les reperes restent (sauf les etapes de l'HDV : on lit ce qu'il faut y faire) */
  const svg = tuto.el.querySelector('.tuto-sol'), rep = tuto.el.querySelector('.tuto-reperes'); if (!svg || !rep) return;
  let s = '', h = '';
  const cases = E.cases && !modaleOuverte ? E.cases() : [];
  cases.forEach((p) => { const q = posCase(p), d = S / 2 - 0.05, y = q.y + 0.1; s += '<polygon points="' + [[-d, -d], [d, -d], [d, d], [-d, d]].map(([a, b]) => projeterTuto(q.x + a, y, q.z + b).map((v) => v.toFixed(1)).join(',')).join(' ') + '"/>'; });
  if (cases.length && E.etiq) { const q = posCase(cases[0]), [x, y] = projeterTuto(q.x, q.y + (E.haut || 1.2), q.z); h += '<div class="tuto-fleche" style="left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px"><span>' + E.etiq() + '</span><i></i></div>'; }
  (E.anneaux ? E.anneaux() : []).filter((el) => el && !el.hidden && el.offsetParent !== null).forEach((el, k) => { const r = el.getBoundingClientRect();
    h += '<div class="tuto-anneau" style="left:' + (r.left - 5) + 'px;top:' + (r.top - 5) + 'px;width:' + (r.width + 10) + 'px;height:' + (r.height + 10) + 'px"></div>';
    if (k === 0 && E.etiq) h += '<div class="tuto-fleche" style="left:' + (r.left + r.width / 2) + 'px;top:' + (r.top - 6) + 'px"><span>' + E.etiq() + '</span><i></i></div>'; });
  if (s !== tuto.s) { svg.innerHTML = s; tuto.s = s; } if (h !== tuto.h) { rep.innerHTML = h; tuto.h = h; } /* (rien n'est refait si rien ne bouge : la fleche garde son rebond) */
}
