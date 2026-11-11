'use strict';
/* ---------- LE JOUR ET LA NUIT SUR LA FERME, au palier 10 (11/11/2026) ----------
   « j'aimerais bien que pour les vagues 90 a 100, la nuit soit maintenant en jeu, et que la nouvelle plante soit une plante qui pousse de nuit, et -50 % de jour.
   Et pendant la nuit les autres recoltes poussent 50 % moins vite. Apres, a l'atelier, on peut craft des "lanternes UV" qui permettent de faire pousser les champs
   la nuit a 100 % » (Mathieu). C'est le mode jour-nuit annonce le 09/11 (« a un moment, on mettra un mode jour-nuit », 11-ferme-3d.js, nuitSurLaCarte).
   - Les heures : la nuit va de JOUR_NUIT.debut a JOUR_NUIT.fin, heure française, la meme pour tout le monde (« de 18 h heure française a 7 h du matin c'est la nuit,
     et le reste du temps c'est le jour », Mathieu, 11/11/2026 ; un cycle de 20 min de jour et 10 min de nuit avant). C'est l'heure VRAIE qui compte, pas l'horloge du
     jeu : le curseur du temps accelere la pousse, pas le soleil. Elle n'existe que pour une ferme arrivee au palier 10 (nuitDebloquee : la vague 91 ou plus ; en mode
     test, des qu'on regle une vague du palier 10 ; la, on peut aussi forcer le jour ou la nuit, ETAT_TEST.nuit, pour essayer a toute heure).
   - La pousse (avancer, 06-temps.js) : la nuit, les cultures poussent deux fois moins vite, sauf sous une lanterne UV ; la plante de nuit (nuit: true dans CULTURES),
     elle, pousse a plein la nuit et deux fois moins vite le jour. Sur un intervalle, on compte la part de nuit (partNuit) : juste aussi au retour d'une absence.
   - La lanterne UV (DECOS, fabriquee a l'atelier) : les champs a UV_PORTEE d'elle poussent a plein la nuit. Elle eclaire aussi, comme une lanterne.
   - Ce qu'on voit : hors combat, la nuit tombe sur la ferme en quelques secondes (voile bleu, lumieres baissees), les lanternes s'allument et percent
     le voile ; au lever du jour, tout revient. Une vague du palier 10 garde sa nuit a elle (nuitForet, 21-combat.js) : la nuit de la ferme lui laisse la place.
   La plante (son nom, ses chiffres, son modele) est un premier jet a regler avec Mathieu. */
const JOUR_NUIT = { debut: 18, fin: 7, fuseau: 'Europe/Paris', lent: 0.5, fondu: 6 }; /* (debut, fin : les heures de la nuit, heure française ; lent : ce que la nuit, ou le jour pour la plante de nuit, retire a la pousse ; fondu : les secondes du crepuscule) */
const HEURE_MS = 3600000, JOURNEE_MS = 24 * HEURE_MS;
const VAGUE_NUIT = 90, UV_PORTEE = 4.0; /* (la nuit vient apres la vague 90 ; la lanterne UV couvre les champs a deux cases en ligne droite : le carre de 3 x 3 autour d'elle et une case de plus dans
   les quatre directions, 12 cases ; « rajoute 4 cases en plus, celles ou j'ai mis des points violets », Mathieu, 11/11/2026 : 3.0 et les 8 cases du carre avant. Les cases en L, a 4,47, restent dehors) */
let NUIT_J = null, nuitAnnoncee = 0;
const nuitDebloquee = () => !!S_ && !!S_.vague && ((S_.vague.num > VAGUE_NUIT && vaguesOuvertes() > VAGUE_NUIT) || (MODE_TEST && (ETAT_TEST.n > VAGUE_NUIT || !!ETAT_TEST.nuit))); /* (vaguesOuvertes : tant que le palier 10 est ferme aux joueurs, une ferme qui a fini la vague 90 reste en plein jour ; seul le mode test voit la nuit : a une vague du palier 10, ou des qu'on y force le jour ou la nuit) */
const heureVraie = () => new Date().getTime(); /* (Date.now est l'horloge du jeu, 01-horloge.js : new Date() reste l'heure vraie) */
const avanceJeu = () => Date.now() - heureVraie(); /* l'avance de l'horloge du jeu sur l'heure vraie (le curseur du temps) */
const nuitForcee = () => (MODE_TEST && ETAT_TEST.nuit) || null; /* (le mode test : 'jour' ou 'nuit', pour essayer a toute heure) */
function decalageParis(t) { /* l'avance de l'heure française sur l'heure universelle (une heure l'hiver, deux l'ete), recalculee une fois par heure */
  const h = Math.floor(t / HEURE_MS); if (decalageParis.h === h) return decalageParis.v;
  let v = HEURE_MS; try { const p = {}; new Intl.DateTimeFormat('en-US', { timeZone: JOUR_NUIT.fuseau, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(new Date(t)).forEach((x) => { p[x.type] = +x.value; });
    v = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000; } catch (e) { /* (pas de fuseau sur cet appareil : l'heure d'hiver) */ }
  decalageParis.h = h; decalageParis.v = v; return v;
}
const heureLocale = (t) => { const L = t + decalageParis(t); return L - Math.floor(L / JOURNEE_MS) * JOURNEE_MS; }; /* les millisecondes depuis minuit, heure française */
const estNuitA = (r) => r >= JOUR_NUIT.debut * HEURE_MS || r < JOUR_NUIT.fin * HEURE_MS; /* (la nuit passe minuit) */
const nuitEcoulee = (t) => { const L = t + decalageParis(t), n = Math.floor(L / JOURNEE_MS), r = L - n * JOURNEE_MS; return n * (24 - JOUR_NUIT.debut + JOUR_NUIT.fin) * HEURE_MS + Math.min(r, JOUR_NUIT.fin * HEURE_MS) + Math.max(0, r - JOUR_NUIT.debut * HEURE_MS); }; /* les millisecondes de nuit ecoulees a l'heure vraie t */
/* la part de nuit de l'intervalle [a, b], donne a l'horloge du jeu (avancer, 06-temps.js) : on le ramene a l'heure vraie. Juste aussi au retour d'une absence */
const partNuit = (a, b) => { if (!nuitDebloquee() || !(b > a)) return 0; const f = nuitForcee(); if (f) return f === 'nuit' ? 1 : 0; const av = avanceJeu(); return Math.min(1, Math.max(0, (nuitEcoulee(b - av) - nuitEcoulee(a - av)) / (b - a))); };
const ilFaitNuit = () => { if (!nuitDebloquee()) return false; const f = nuitForcee(); return f ? f === 'nuit' : estNuitA(heureLocale(heureVraie())); };
const avantBascule = () => { const r = heureLocale(heureVraie()), d = JOUR_NUIT.debut * HEURE_MS, f = JOUR_NUIT.fin * HEURE_MS; return r >= d ? JOURNEE_MS - r + f : r < f ? f - r : d - r; }; /* le temps vrai avant la nuit (de jour) ou avant le jour (de nuit) */
/* la vitesse de pousse d'une culture sur un intervalle dont pn est la part de nuit ; uv : le champ est sous une lanterne UV */
const pousseNuit = (c, pn, uv) => (c.nuit ? 1 - JOUR_NUIT.lent * (1 - pn) : 1 - JOUR_NUIT.lent * pn * (uv ? 0 : 1));
function champsUV() { /* dit, pour un champ, s'il est a portee d'une lanterne UV posee ; null s'il n'y en a aucune */
  const L = S_.cases.filter((c) => c.type === 'deco' && c.deco === 'lanterne_uv').map(posCase); if (!L.length) return null;
  return (p) => { const q = posCase(p); return L.some((l) => Math.hypot(l.x - q.x, l.z - q.z) <= UV_PORTEE + 0.01); };
}
/* la zone des lanternes UV, montree pendant l'amenagement (« montre-moi, 8 cases autour, ca represente quoi », Mathieu, 11/11/2026) : en violet, les cases qu'elles
   couvrent ; plein sur un champ (il pousse a plein la nuit), pale sur l'herbe (un champ pose la serait couvert). Appelee par majSelection (05-nuage.js) */
let zoneUVMesh = null;
function majZoneUV() {
  if (zoneUVMesh) { scene.remove(zoneUVMesh); zoneUVMesh.children.forEach((o) => o.material.dispose()); if (zoneUVMesh.children[0]) zoneUVMesh.children[0].geometry.dispose(); zoneUVMesh = null; }
  if (!mode || !S_) return; const sous = champsUV(); if (!sous) return;
  const g = new T.Group(), geo = new T.PlaneGeometry(S - 0.15, S - 0.15), mat = (o) => new T.MeshBasicMaterial({ color: '#a070ff', transparent: true, opacity: o, depthWrite: false, depthTest: false });
  S_.cases.forEach((c) => { if ((c.type !== 'champ' && c.type !== 'libre') || !sous(c)) return; const q = posCase(c), pl = new T.Mesh(geo, mat(c.type === 'champ' ? 0.55 : 0.22)); pl.rotation.x = -Math.PI / 2; pl.position.set(q.x, q.y + 0.12, q.z); pl.renderOrder = 3; g.add(pl); });
  scene.add(g); zoneUVMesh = g;
}
const nuitFermeLa = () => typeof lieu !== 'undefined' && lieu === 'ferme' && !combat && !enAccueil && ilFaitNuit(); /* (la nuit se voit : sur la ferme, hors combat) */
/* ----- ce qu'on voit ----- */
function voileNuitFerme() {
  if (NUIT_J) return NUIT_J;
  const v = document.createElement('div'); v.className = 'nuit-ferme'; v.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;z-index:1;background:radial-gradient(ellipse at 50% 46%,rgba(22,36,86,.20) 0%,rgba(10,18,52,.44) 55%,rgba(4,8,26,.64) 100%)';
  /* (ni lune ni etoiles : dessinees sur l'ecran, elles flottaient au-dessus des champs et du chateau, la camera ne montre pas le ciel ; « bizarre la lune ici », puis
     « c'est quoi les points blancs qu'on voit sur l'ecran ? », Mathieu, 11/11/2026. Le voile bleu, les lumieres baissees et les lanternes font la nuit) */
  canvas.insertAdjacentElement('afterend', v);
  NUIT_J = { v, L: null, k: 0 }; return NUIT_J;
}
function teinterNuitFerme(N) { /* les lumieres de la scene, baissees et bleuies selon N.k ; leurs valeurs de plein jour sont notees une fois, quand aucune autre nuit ne les tient */
  if (!N.L) { if ((typeof NUIT !== 'undefined' && NUIT && NUIT.actif) || (typeof NUIT_F !== 'undefined' && NUIT_F && NUIT_F.actif)) return; N.L = []; scene.traverse((o) => { if (o.isLight) N.L.push({ o, i: o.intensity, c: o.color.clone() }); }); N.bleu = new T.Color('#8fa8ff'); }
  N.L.forEach((l) => { l.o.intensity = l.i * (1 - 0.45 * N.k); l.o.color.copy(l.c).lerp(N.bleu, 0.45 * N.k); });
}
function couperNuitFerme() { /* tout de suite : un combat commence, ou l'on quitte la ferme (la nuit de la foret note alors les lumieres a leur plein jour) */
  const N = NUIT_J; if (!N || !(N.k > 0)) return; N.k = 0; N.v.style.opacity = '0'; if (N.masque) { N.v.style.webkitMaskImage = N.v.style.maskImage = ''; N.masque = false; } teinterNuitFerme(N); animerLanternes.t = 0;
}
function majNuitFerme(dt) { /* a chaque image */
  majPastilleNuit();
  const veut = nuitFermeLa(); if (!veut && !(NUIT_J && NUIT_J.k > 0)) return;
  if (!veut && (combat || lieu !== 'ferme')) { couperNuitFerme(); return; }
  const N = voileNuitFerme(), avant = N.k; N.k = veut ? Math.min(1, N.k + dt / JOUR_NUIT.fondu) : Math.max(0, N.k - dt / JOUR_NUIT.fondu);
  if (veut && !avant) { animerLanternes.t = 0; if (heureVraie() - nuitAnnoncee > 6 * HEURE_MS) { nuitAnnoncee = heureVraie(); /* (une fois par nuit, pas a chaque retour de combat) */ toast('Il fait nuit jusqu\'à ' + JOUR_NUIT.fin + ' h, heure française : tes cultures poussent deux fois moins vite, sauf la ' + (PAR_ID.noctiflore ? PAR_ID.noctiflore.nom : 'plante de nuit') + ' et les champs sous une lanterne UV.'); } }
  if (!veut && avant && !N.k) animerLanternes.t = 0;
  N.v.style.opacity = String(N.k); teinterNuitFerme(N); if (typeof trousNuit === 'function') trousNuit(N); /* (les lanternes allumees percent le voile, comme dans la nuit de la foret) */
}
/* LE BOUTON DU JOUR ET DE LA NUIT (11/11/2026, « il faudrait un bouton pour savoir quand arrivent le jour et la nuit sur le jeu », « a cote du temps x1 ou x1,5,
   un truc dans le style », Mathieu) : dans la barre du haut, juste avant le bouton de la vitesse du temps et fait comme lui. Un soleil ou une lune (ce qu'il fait
   maintenant) et le temps qu'il reste avant que ca bascule ; un clic ouvre la fenetre qui dit les heures (a l'heure française, et a la montre du joueur si elle
   differe) et ce que la nuit change pour les champs. Une pastille sous la barre avant : elle ne se cliquait pas. */
const dureeCourte = (ms) => { const m = Math.max(1, Math.ceil(ms / 60000)); return m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + String(m % 60).padStart(2, '0') : '') : m + ' min'; };
function heureChezToi(h) { /* l'heure française h (18, 7), lue a la montre du joueur */
  const t = heureVraie(), d = new Date(t + (((h * HEURE_MS - heureLocale(t)) % JOURNEE_MS) + JOURNEE_MS) % JOURNEE_MS); return d.getHours() + ' h' + (d.getMinutes() ? ' ' + String(d.getMinutes()).padStart(2, '0') : '');
}
function ouvrirJourNuit() {
  if (combat && !combat.fin) return; /* (pas de fenetre en pleine vague) */
  const nuit = ilFaitNuit(), f = nuitForcee(), D = JOUR_NUIT.debut, F = JOUR_NUIT.fin, ici = heureChezToi(D), ici2 = heureChezToi(F), ailleurs = ici !== D + ' h';
  const quand = f ? 'Mode test : ' + (nuit ? 'la nuit' : 'le jour') + ' est forcé' + (nuit ? 'e' : '') + '. Avec « L\'heure vraie », ' + (estNuitA(heureLocale(heureVraie())) ? 'il ferait nuit, et le jour se lèverait dans ' : 'il ferait jour, et la nuit tomberait dans ') + '<b>' + dureeCourte(avantBascule()) + '</b>.'
    : nuit ? 'Il fait <b>nuit</b>. Le jour se lève dans <b>' + dureeCourte(avantBascule()) + '</b>.' : 'Il fait <b>jour</b>. La nuit tombe dans <b>' + dureeCourte(avantBascule()) + '</b>.';
  const ligne = (nom, j, k) => '<tr><td>' + nom + '</td><td>' + j + '</td><td>' + k + '</td></tr>';
  ouvrirModale('jour-nuit', entete('Le jour et la nuit') + '<p class="hdv-aide">' + quand + '</p>' +
    '<div class="hdv-section">Les heures</div><p class="hdv-aide">La nuit va de <b>' + D + ' h à ' + F + ' h</b>, heure française, tous les jours et pour tout le monde' + (ailleurs ? ' : de <b>' + ici + ' à ' + ici2 + '</b> à ta montre' : '') + '. Le reste du temps, il fait jour.</p>' +
    '<div class="hdv-section">La pousse des champs</div><table class="jn-table"><tr><th></th><th>Le jour</th><th>La nuit</th></tr>' + ligne('Une culture', '100 %', '50 %') + ligne('Une culture près d\'une lanterne UV', '100 %', '100 %') + ligne(PAR_ID.noctiflore ? PAR_ID.noctiflore.nom + ' (la plante de nuit)' : 'La plante de nuit', '50 %', '100 %') + '</table>' +
    '<p class="hdv-aide">La lanterne UV se fabrique à l\'atelier : la nuit, elle fait pousser à pleine vitesse les champs des 12 cases autour d\'elle. Les lumières de tes bâtiments, elles, ne changent rien aux cultures ni aux monstres.</p>');
}
function majPastilleNuit() {
  const now = performance.now(); if (now - (majPastilleNuit.t || 0) < 1000) return; majPastilleNuit.t = now;
  let b = document.getElementById('b-nuit'); const ok = nuitDebloquee() && !!S_.perso;
  if (!b) { const v = document.getElementById('b-vitesse'); if (!ok || !v) return; b = document.createElement('button'); b.type = 'button'; b.id = 'b-nuit'; b.className = 'pastille vitesse';
    b.innerHTML = '<i class="astre"></i><span class="lib"></span><span class="reste"></span>'; b.addEventListener('click', (e) => { e.stopPropagation(); ouvrirJourNuit(); }); v.insertAdjacentElement('beforebegin', b); }
  b.hidden = !ok; if (b.parentElement) b.parentElement.classList.toggle('avec-nuit', ok); /* (la barre replie ses libelles plus tot : tout tient sur une ligne, css/jeu.css) */ if (!ok) return; const nuit = ilFaitNuit(), f = nuitForcee(), reste = dureeCourte(avantBascule()); b.classList.toggle('nuit', nuit);
  b.querySelector('.lib').textContent = nuit ? 'Nuit ' : 'Jour '; b.querySelector('.reste').textContent = f ? 'test' : reste;
  b.dataset.info = f ? (nuit ? 'La nuit est forcée (mode test).' : 'Le jour est forcé (mode test).') + ' Touche pour tout savoir.' : (nuit ? 'Il fait nuit : le jour se lève dans ' : 'Il fait jour : la nuit tombe dans ') + reste + '. Touche pour tout savoir.';
}

/* ---------- LES LUMIERES D'APPOINT DES BATIMENTS (11/11/2026) ----------
   « de nuit, il faudrait que le chateau et les autres batiments aient des petites lumieres d'appoint, qui s'allument que de nuit ; mais elles n'ont pas d'impact
   sur les monstres ni sur les cultures » (Mathieu). On n'ajoute rien aux modeles : la nuit, ce qui eclaire deja sur eux s'allume. Leurs flammes et leurs lanternes
   (les pieces en matiere lumiere : BRILLE, 09-modeles.js) prennent un halo chaud ; leurs fenetres (VITRES, 09-modeles.js : leur matiere porte userData.vitre)
   s'eclairent de l'interieur. Sur la ferme, elles percent le voile de la nuit (trousBatiments, lu par trousNuit, 21-combat.js), regroupees : une tour ou une
   facade, un seul trou (le chateau a 48 lumieres : autant de calques de masque, c'etait trop). Pendant une vague, aucun trou : la nuit de la foret reste entiere,
   rien n'est revele autour des batiments. Elles ne sont PAS dans lanternesAnim : ni portee, ni monstres eclaires, ni UV.
   Allumees comme les lanternes (lanternesAllumees : la nuit de la ferme, celle de la foret, la nuit lunaire).
   LES FOYERS (« pour les fours et les fourneaux, il faut qu'on voie des flammes mouvantes, pour donner un peu de dynamisme ; la, juste une lumiere, ce n'est pas
   realiste pour l'atelier et la forgemagie », Mathieu, 11/11/2026) : sur le feu de la forgemagie et de l'atelier (FOYERS), de vraies flammes qui dansent (le
   shader des incendies, FEU_FS, 13-batiments-pv.js) et quelques braises qui montent. Elles brulent le jour comme la nuit ; la nuit s'y ajoute le halo. */
let lumieresBat = [], vitresBat = [], trousBat = [], flammesBat = [], lumieresBatSig = '', lumieresBatA = 0, texLueurBat = null;
const FOYERS = { forge: 0.5, atelier: 0.24, montgolfiere: 0.8 } /* (la hauteur de flamme permise : a l'atelier, une petite flamme de brasero, « la, le feu brulerait le toit dans la vraie vie », Mathieu, 11/11/2026) */, HEX_LANTERNE = 'ffe08a'; /* (la montgolfiere : « le feu aussi ici, de nuit et de jour », Mathieu, 11/11/2026 ; son bruleur, une fois qu'elle est reparee) */
const hotesLumieres = () => batisMesh.concat(typeof toursMesh !== 'undefined' ? toursMesh : [], typeof montgolfiereMesh !== 'undefined' && montgolfiereMesh && montgolfiereMesh.visible ? [montgolfiereMesh] : []);
const foyerAllume = (hote) => !!FOYERS[hote.userData.modele] && (hote.userData.modele === 'montgolfiere' ? !!(S_ && S_.montgolfiere) : MODE_TEST); /* (la montgolfiere : pour tout le monde, une fois reparee (« la montgolfiere, tu peux le push pour les membres », Mathieu, 11/11/2026) ; les flammes de la forgemagie et de l'atelier : en version dev d'abord, il teste avant les joueurs) */
/* (HEX_LANTERNE : la couleur des pieces 'lanterne', 09-modeles.js : une lanterne n'est pas un foyer) */
const LUEUR_VITRE = '#ffc45e';
function grappesLumiere(mesh, pas) { /* les points d'une piece soudee, regroupes par voisinage : une lanterne, une flamme ou une fenetre par grappe */
  const P = mesh.geometry.attributes.position, v = new T.Vector3(), G = [];
  const pres = (a, b) => a.min.x < b.max.x + pas && a.max.x > b.min.x - pas && a.min.y < b.max.y + pas && a.max.y > b.min.y - pas && a.min.z < b.max.z + pas && a.max.z > b.min.z - pas;
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(mesh.matrixWorld); const moi = { min: v, max: v }, g = G.find((x) => pres(x, moi)); if (g) { g.min.min(v); g.max.max(v); } else G.push({ min: v.clone(), max: v.clone() }); }
  for (let fait = true; fait;) { fait = false; for (let a = 0; a < G.length && !fait; a++) for (let b = a + 1; b < G.length; b++) if (pres(G[a], G[b])) { G[a].min.min(G[b].min); G[a].max.max(G[b].max); G.splice(b, 1); fait = true; break; } }
  return G;
}
function poserLumieresBat() {
  lumieresBat.forEach((L) => { scene.remove(L.halo); L.halo.material.dispose(); }); lumieresBat = []; vitresBat = []; trousBat = [];
  flammesBat.forEach((F) => F.m.concat(F.b).forEach((o) => { scene.remove(o); o.material.dispose(); })); flammesBat = [];
  texLueurBat = texLueurBat || texCanvas(64, (g, k) => { const r = g.createRadialGradient(k / 2, k / 2, 0, k / 2, k / 2, k / 2); r.addColorStop(0, 'rgba(255,240,200,0.95)'); r.addColorStop(0.3, 'rgba(255,200,95,0.5)'); r.addColorStop(1, 'rgba(255,160,40,0)'); g.fillStyle = r; g.fillRect(0, 0, k, k); });
  const hsl = {}, vues = new Set();
  hotesLumieres().forEach((hote) => { hote.updateMatrixWorld(true);
    hote.traverse((m) => { if (!m.isMesh || !m.material || Array.isArray(m.material) || m.material.side === T.BackSide || m.material.map || !m.geometry || !m.geometry.attributes.position) return;
      const M = m.material, vitre = !!(M.userData && M.userData.vitre);
      if (!vitre) { if (!M.isMeshBasicMaterial) return; M.color.getHSL(hsl); if (!(hsl.h > 0.02 && hsl.h < 0.17 && hsl.s > 0.5)) return; } /* (les flammes et les lanternes : de l'orange au jaune ; l'eau et les reflets, en matiere lumiere eux aussi, restent dehors) */
      else if (!vues.has(M)) { vues.add(M); if (M.emissive) { M.emissive.set(LUEUR_VITRE); M.emissiveIntensity = 0; vitresBat.push(M); } }
      grappesLumiere(m, 0.25).forEach((g) => { const c = g.min.clone().add(g.max).multiplyScalar(0.5), r = g.min.distanceTo(g.max) / 2; if (r > 1.6) return;
        const halo = new T.Sprite(new T.SpriteMaterial({ map: texLueurBat, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); halo.visible = false; halo.renderOrder = 6; halo.raycast = () => {};
        const t = Math.min(2.2, Math.max(0.7, r * (vitre ? 3.2 : 4.2))); halo.scale.setScalar(t); halo.position.copy(c); scene.add(halo);
        lumieresBat.push({ halo, c, t, vitre, hote, ph: Math.random() * 6, min: g.min, max: g.max, foyer: !vitre && foyerAllume(hote) && M.color.getHexString() !== HEX_LANTERNE }); }); }); });
  /* les foyers : les pieces de feu voisines (le feu et son coeur clair) font un seul foyer, avec deux flammes et quatre braises */
  const foyers = []; lumieresBat.filter((L) => L.foyer).forEach((L) => { let F = foyers.find((x) => x.hote === L.hote && x.c.distanceTo(L.c) < 0.7); if (!F) { F = { hote: L.hote, c: L.c.clone(), min: L.min.clone(), max: L.max.clone() }; foyers.push(F); } else { F.min.min(L.min); F.max.max(L.max); F.c.copy(F.min).add(F.max).multiplyScalar(0.5); } });
  foyers.forEach((F) => { const hh = Math.min(FOYERS[F.hote.userData.modele] || 0.5, Math.max(0.2, (F.max.y - F.min.y) * 2.4)), y = F.min.y + 0.02;
    const flamme = (dx, k) => { const m = new T.Mesh(GEO_PLAN, new T.ShaderMaterial({ uniforms: { uT: { value: 0 }, uS: { value: Math.random() * 10 } }, vertexShader: FEU_VS, fragmentShader: FEU_FS, transparent: true, depthWrite: false, side: T.DoubleSide }));
      m.scale.set(hh * k * 0.8, hh * k, 1); m.position.set(F.c.x + dx, y + hh * k * 0.42, F.c.z); m.renderOrder = 6; m.raycast = () => {}; scene.add(m); return m; };
    const b = [0, 1, 2, 3].map((i) => { const o = new T.Mesh(GEO_PLAN, new T.MeshBasicMaterial({ color: i % 2 ? '#ffd04a' : '#ff7a1e', transparent: true, depthWrite: false, blending: T.AdditiveBlending })); o.scale.setScalar(0.045); o.userData = { t: Math.random(), a: Math.random() * 6.28 }; o.raycast = () => {}; o.renderOrder = 6; scene.add(o); return o; });
    flammesBat.push({ hote: F.hote, m: [flamme(-0.05, 1), flamme(0.09, 0.68)], b, x: F.c.x, y, z: F.c.z, hh, s: Math.random() * 10 }); });
  /* leurs trous dans le voile : les lumieres voisines d'un meme batiment (a moins de 1,4 m) n'en font qu'un */
  lumieresBat.forEach((L) => { let g = trousBat.find((x) => x.hote === L.hote && x.c.distanceTo(L.c) < 1.4); if (!g) { g = { hote: L.hote, c: L.c.clone(), L: [], r: 0 }; trousBat.push(g); } g.L.push(L); g.c.set(0, 0, 0); g.L.forEach((x) => g.c.add(x.c)); g.c.multiplyScalar(1 / g.L.length); });
  trousBat.forEach((g) => { g.r = Math.max(...g.L.map((x) => x.c.distanceTo(g.c) + x.t * 0.45)) + 0.25; });
}
function allumerLumieresBat(a, s) { /* a : de 0 (eteintes) a 1 */
  vitresBat.forEach((M) => { M.emissiveIntensity = 0.85 * a; });
  if (!lumieresBat.length) return; const versCam = new T.Vector3(); camera.getWorldDirection(versCam).multiplyScalar(-0.3); /* (le halo d'une fenetre : un peu devant le mur) */
  lumieresBat.forEach((L) => { const vu = a > 0.01 && !!L.hote.parent && L.hote.visible !== false; L.halo.visible = vu; if (!vu) return;
    L.halo.position.copy(L.c).add(versCam); L.halo.material.opacity = a * (L.vitre ? 0.5 : (L.foyer ? 0.32 : 0.8) * (0.9 + 0.1 * Math.sin((s || 0) * 6 + L.ph))); }); /* (un foyer : son halo se fait discret, on doit voir ses flammes) */
}
function animerFlammesBat(dt) { /* les flammes des foyers, le jour comme la nuit */
  const q = camera.quaternion;
  flammesBat.forEach((F) => { const vu = !!F.hote.parent && F.hote.visible !== false; F.s += dt; F.m.forEach((m) => { m.visible = vu; if (vu) { m.material.uniforms.uT.value = F.s; m.quaternion.copy(q); } });
    F.b.forEach((o) => { o.visible = vu; if (!vu) return; const u = o.userData; u.t += dt * 0.6; if (u.t > 1) { u.t = 0; u.a = Math.random() * 6.28; } o.position.set(F.x + Math.cos(u.a) * 0.1 + Math.sin(u.t * 9 + u.a) * 0.04, F.y + F.hh * 0.45 + u.t * F.hh * 1.5 /* (les braises montent selon la flamme : pas jusqu'au toit de l'atelier) */, F.z + Math.sin(u.a) * 0.1); o.quaternion.copy(q); o.material.opacity = 1 - u.t; }); });
}
function majLumieresBat(dt, s) { /* a chaque image ; les batiments sont relus une fois par seconde (deplaces, ameliores : leurs lumieres suivent) */
  if (typeof lieu === 'undefined' || lieu !== 'ferme' || enAccueil) { if (lumieresBatA > 0) { lumieresBatA = 0; allumerLumieresBat(0, s); } return; }
  const now = performance.now(); if (!majLumieresBat.t || now - majLumieresBat.t > 1000) { majLumieresBat.t = now; majLumieresBat.cible = MODE_TEST && lanternesAllumees() ? 1 : 0; /* (les lumieres d'appoint : en version dev seulement pour l'instant, la nuit etant du palier 10 ; les flammes des foyers, elles, brulent pour tout le monde) */
    const sig = hotesLumieres().map((m) => m.uuid + Math.round(m.position.x * 10) + '_' + Math.round(m.position.z * 10)).join('') + (S_ && S_.montgolfiere ? 'M' : '') + (MODE_TEST ? 'D' : ''); if (sig !== lumieresBatSig) { lumieresBatSig = sig; poserLumieresBat(); } }
  if (flammesBat.length) animerFlammesBat(dt);
  const c = majLumieresBat.cible || 0; if (!c && !lumieresBatA) return;
  lumieresBatA = c > lumieresBatA ? Math.min(c, lumieresBatA + dt) : Math.max(c, lumieresBatA - dt); allumerLumieresBat(lumieresBatA, s);
}
function trousBatiments(N) { /* les trous que ces lumieres percent dans le voile de la nuit de la ferme : [x, y, rayon] a l'ecran ; aucun dans une autre nuit */
  if (N !== NUIT_J || !(lumieresBatA > 0.05) || !trousBat.length) return [];
  const W = innerWidth, H = innerHeight, D = new T.Vector3(1, 0, 0).applyQuaternion(camera.quaternion), p = new T.Vector3(), q = new T.Vector3(), trous = [];
  trousBat.forEach((g) => { if (!g.hote.parent || g.hote.visible === false) return; p.copy(g.c).project(camera); if (p.z > 1) return; const x = (p.x + 1) / 2 * W, y = (1 - p.y) / 2 * H;
    q.copy(g.c).addScaledVector(D, g.r * lumieresBatA).project(camera); const r = Math.max(3, Math.hypot((q.x + 1) / 2 * W - x, (1 - q.y) / 2 * H - y)); if (x < -r || x > W + r || y < -r || y > H + r) return; trous.push([x, y, r]); });
  return trous;
}
