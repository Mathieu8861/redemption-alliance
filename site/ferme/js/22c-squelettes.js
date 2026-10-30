'use strict';
/* LES MONSTRES A SQUELETTE (25/10/2026, palier 9, l'ile de Moon). Premier essai le matin : un squelette fait main et 3 animations, « on dirait un robot,
   il marche et tape tout le temps de la meme maniere, il est vide ce boss » (Mathieu). Le soir : Moon rige par Mixamo (le squelette d'un vrai
   personnage : dos, cou, tete) et une selection de mouvements de ses packs (blender/moon-anime.py), rangee par familles : repos, marche, course,
   coup, tourbillon, bond, rugir, touche, mort, saut. Le jeu tire au hasard dans une famille (jamais deux fois le meme d'affilee), change de repos
   toutes les quelques secondes, regle la marche sur sa vitesse, le fait encaisser les gros coups, rugir a son arrivee et quand il enrage,
   tomber a sa mort. Les coups touchent aux instants ou le marteau arrive en bas (lus sur chaque animation au chargement) : au sol, le grand
   impact et son petit cratere ; dans l'air (un coup balaye), une onde et de la poussiere. Chaque monstre a sa copie du squelette. */
/* Le soir du 25/10 : les Kannibouls et les Tortues, rattaches a leur squelette Mixamo (blender/lier-squelette.py : masques, cheveux et carapace
   rigides) puis assembles avec leurs mouvements et leur arme (blender/monstre-anime.py). Leurs coups et leurs tirs partent a l'instant ou une main ou
   un pied va le plus vite, lu sur chaque animation (attaqueSquelette) ; leurs sorts jouent un geste (gesteSort). */
const SQUELETTES_A_CHARGER = [['moon', 4.6], ['jav', 2.1], ['sarbak', 1.7], ['ark', 2.2], ['tam', 1.9], ['ebil', 3.0], ['tortue-bleue', 1.8], ['tortue-jaune', 1.8], ['tortue-rouge', 1.8], ['tortue-verte', 1.8], ['lemurien', 2.3], ['gorille-roi', 3.4], ['golem-lune', 3.4], ['tortue-corail', 3.0]]
  .map(([n, h]) => [n, 'assets/modeles/jeu/' + n + '-anime.glb', h]); /* (charges a la demande : chargerSquelettes(noms), pour l'Arene dev) */
/* (28/10/2026) le Lemurien tiki, anime a la main dans Blender (blender/lemurien-anime.py, lemurien-export.py), pas par Mixamo (« c'est des creatures,
   Mixamo c'est plus pour des humanoides », Mathieu) : son squelette n'a pas de hanches Mixamo, la vitesse naturelle de sa marche et de sa course
   (sur place) est donnee ici, en unites du jeu par seconde */
const ALLURES = { lemurien: { marche: 0.97, course: 2.97 } }; /* (a 2,3 de haut, boss du 28/10/2026 : 0,8 et 2,45 a 1,9) */
const FAMILLES_BOUCLE = new Set(['repos', 'marche', 'course']);
/* (26/10/2026, « les monstres sont au ralenti, t'as l'impression qu'ils sont en x0.5 », Mathieu : les mouvements de Mixamo ont le rythme d'un vrai
   corps, plus lent que nos monstres de dessin anime ; tous un peu plus vifs, et une course ou une marche jamais jouee sous 90 % de sa vitesse) */
const VIF = 1.2, ALLURE_MIN = 0.9, ALLURE_MAX = 1.8;
/* la vitesse de toutes leurs animations, par-dessus (26/10/2026, « pourquoi je ressens ca moi ? j'ai pas ce ressenti sur les autres monstres », Mathieu) :
   les mouvements captures sur de vrais acteurs paraissent au ralenti sur nos petits monstres de dessin anime ; Mathieu la regle dans l'Arene dev */
let VITESSE_ANIM = (() => { try { return +localStorage.getItem('ferme-vitesse-anim') || 1.25; } catch (e) { return 1.25; } })();
/* (27/10/2026, apres ses essais : « les Kannibouls a x1,75, sinon ca fait l'effet de ralenti », les Tortues a x1,25 ; le reglage ne sert plus qu'a Moon) */
const VITESSE_FAMILLE = { jav: 1.75, sarbak: 1.75, ark: 1.75, tam: 1.75, ebil: 1.75, 'tortue-bleue': 1.25, 'tortue-jaune': 1.25, 'tortue-rouge': 1.25, 'tortue-verte': 1.25, lemurien: 1.15, 'gorille-roi': 1.45, 'golem-lune': 1.25, 'tortue-corail': 1.4 }; /* (les 4 boss du 28/10/2026, « vifs », Mathieu ; le golem, de pierre, un peu plus lourd) */
const vitAnim = (mo) => ((mo && mo.d && VITESSE_FAMILLE[mo.d.modele]) || VITESSE_ANIM) * ((mo && mo.d && mo.d.vivacite) || 1); /* (vivacite : un monstre plus vif que sa famille, Moon a +25 %, 30/10/2026) */
const vif = (mo) => VIF * vitAnim(mo);
const FAMILLES_COUP = ['coup', 'tourbillon'];
const FAMILLES_GESTE = ['coup', 'tir', 'sort', 'bond', 'fouet', 'toupie', 'ruee']; /* (les monstres sans marteau : l'instant du coup, celui ou une main ou un pied va le plus vite ; fouet, toupie et ruee : les sorts des boss du 28/10/2026) */
const BOUTS = ['mixamorigRightHand', 'mixamorigLeftHand', 'mixamorigRightFoot', 'mixamorigLeftFoot', 'mainD', 'mainG', 'queue7']; /* (mainD, mainG, queue7 : les pattes et le bout de la queue du Lemurien) */
const MAT_CONTOUR_SQ = (() => { const m = new T.MeshBasicMaterial({ color: '#3a2b1f', side: T.BackSide, skinning: true });
  m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(objectNormal) * 0.006;'); }; m.customProgramCacheKey = () => 'contour-squelette'; return m; })();
/* le rendu du jeu : la peau en toon, texture prise telle quelle, sans ombre recue (elle faisait des taches « feuillage »), un contour qui suit le
   squelette ; le marteau, fait main, passe par versToon comme les autres modeles */
function preparerSquelette(sc) {
  const peau = []; sc.traverse((o) => { if (o.isSkinnedMesh) peau.push(o); });
  const mart = sc.getObjectByName('marteau'); if (mart) versToon(mart, { normales: 0.01, sansContour: SC_MONSTRES });
  peau.forEach((m) => { const map = m.material.map || null; if (map) { map.encoding = T.LinearEncoding; map.needsUpdate = true; }
    m.material = new T.MeshToonMaterial({ color: '#ffffff', map, gradientMap: grad, skinning: true, side: T.DoubleSide }); m.castShadow = true; m.receiveShadow = false; m.frustumCulled = false;
    const k = new T.SkinnedMesh(m.geometry, MAT_CONTOUR_SQ); k.name = 'contour'; k.bind(m.skeleton, m.bindMatrix); k.frustumCulled = false; m.parent.add(k); });
}
const trouverCaisse = (g) => { let c = null; g.traverse((o) => { if (!c && o.isMesh && /^caisse/.test(o.name)) c = o; }); return c; };
const familleDe = (nom) => nom.replace(/_\d+$/, '');
/* sur place : le jeu deplace le monstre lui-meme ; la vitesse naturelle de la marche et de la course est notee avant (pour regler leur cadence).
   La piste des hanches est dans le repere du squelette, tourne d'un quart de tour : la verticale du jeu y est un autre axe. On garde la hauteur
   des hanches (elles montent et descendent, s'accroupissent, tombent a la mort) et on retire seulement le deplacement a plat. (26/10/2026 : on
   gardait l'avance et on figeait la hauteur, les monstres avancaient puis reculaient a chaque pas, et leur chute de mort flottait) */
/* le chemin d'une roulade, avant de la mettre sur place : la part du trajet faite a chaque instant (le jeu fait avancer la Tortue comme ses pieds) */
function trajet(clip, hips) {
  const tr = clip.tracks.find((t) => /Hips\.position$/.test(t.name)); if (!tr || !hips || !hips.parent) return null;
  const up = new T.Vector3(0, 1, 0).applyQuaternion(hips.parent.getWorldQuaternion(new T.Quaternion()).invert()).normalize();
  const v = tr.values, n = v.length / 3, plat = (i) => { const p = new T.Vector3(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]); return p.addScaledVector(up, -p.dot(up)); };
  const h0 = plat(0), dir = plat(n - 1).sub(h0), L = dir.length() || 1; dir.normalize();
  return { t: Array.from(tr.times), s: Array.from({ length: n }, (_, i) => Math.max(0, Math.min(1, plat(i).sub(h0).dot(dir) / L))) };
}
function surPlace(clip, hips) {
  const tr = clip.tracks.find((t) => /Hips\.position$/.test(t.name)); if (!tr || !hips || !hips.parent) return 0;
  const up = new T.Vector3(0, 1, 0).applyQuaternion(hips.parent.getWorldQuaternion(new T.Quaternion()).invert()).normalize(), ech = hips.parent.getWorldScale(new T.Vector3()).x;
  const v = tr.values, n = v.length / 3, P = (i) => new T.Vector3(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]), plat = (p) => p.clone().addScaledVector(up, -p.dot(up));
  const h0 = plat(P(0)), d = h0.distanceTo(plat(P(n - 1))) * ech;
  for (let i = 0; i < n; i++) { const r = h0.clone().addScaledVector(up, P(i).dot(up)); v[i * 3] = r.x; v[i * 3 + 1] = r.y; v[i * 3 + 2] = r.z; }
  return clip.duration > 0 ? d / clip.duration : 0;
}
/* les instants ou le marteau arrive en bas pendant un coup : les creux de la hauteur de la caisse (au sol, ou a hauteur de taille pour un coup
   balaye) ; a defaut, l'instant ou il va le plus vite */
/* un clone du squelette sans recopier ses donnees (27/10/2026, « j'ai des petits freeze », Mathieu) : Object3D.copy recopie userData en JSON, et celui
   du modele porte toutes ses animations ; chaque arrivee de monstre les serialisait, 11 a 57 ms d'un bloc */
function cloneNu(M) { const ud = M.userData; M.userData = {}; try { return T.SkeletonUtils.clone(M); } finally { M.userData = ud; } }
function instantsCoup(g, clip) {
  const c = cloneNu(g), caisse = trouverCaisse(c); if (!caisse) return [{ t: clip.duration * 0.45, sol: true }];
  const mx = new T.AnimationMixer(c); mx.clipAction(clip).play(); const b = new T.Box3(), P = [], dt = 1 / 60;
  for (let t = 0; t <= clip.duration; t += dt) { mx.setTime(t); c.updateMatrixWorld(true); b.setFromObject(caisse); P.push({ t, y: b.min.y, p: b.getCenter(new T.Vector3()) }); }
  const L = [];
  for (let i = 2; i < P.length - 2; i++) { const y = P[i].y; if (!(y < 1.1 && y <= P[i - 1].y && y <= P[i - 2].y && y < P[i + 1].y && y <= P[i + 2].y)) continue;
    let haut = y; for (let j = i; j >= 0 && P[i].t - P[j].t <= 0.4; j--) haut = Math.max(haut, P[j].y); /* (un vrai coup : le marteau vient de tomber d'au moins 1,3 ; pas la pose de garde, marteau bas, du debut ou de la fin) */
    if (haut - y > 1.3 && P[i].p.z > 0.6 && P[i].t > 0.15 && P[i].t < clip.duration - 0.2 && (!L.length || P[i].t - L[L.length - 1].t > 0.3)) L.push({ t: P[i].t, sol: y < 0.35, d: Math.hypot(P[i].p.x, P[i].p.z), x: P[i].p.x, z: P[i].p.z }); }
  /* (P[i].p.z > 0.6 : devant lui ; le modele est a l'origine, tourne vers +z, l'avant du jeu. Un creux derriere lui, c'est l'elan, pas le coup) */
  if (!L.length) { let best = 0, k = 1; for (let i = 1; i < P.length; i++) { const v = P[i].p.distanceTo(P[i - 1].p); if (v > best) { best = v; k = i; } } L.push({ t: P[k].t, sol: false }); }
  return L;
}
/* un bond : quand ses hanches quittent le sol et quand elles y reviennent (0,4 au-dessus de leur hauteur de depart) */
function envol(g, clip) {
  const c = cloneNu(g), h = c.getObjectByName('mixamorigHips'); if (!h) return null; const mx = new T.AnimationMixer(c); mx.clipAction(clip).play(); const v = new T.Vector3(); let y0 = null, t0 = null, t1 = null;
  for (let t = 0; t <= clip.duration; t += 1 / 60) { mx.setTime(t); c.updateMatrixWorld(true); const y = h.getWorldPosition(v).y; if (y0 == null) y0 = y; if (y > y0 + 0.4) { if (t0 == null) t0 = t; t1 = t; } }
  return t0 == null ? null : [t0, t1];
}
/* le tourbillon : l'instant ou la caisse est la plus loin de lui, a mi-hauteur (le marteau tendu du moulinet), et ou elle est alors */
function brasTendu(g, clip) {
  const c = cloneNu(g), ca = trouverCaisse(c); if (!ca) return null; const mx = new T.AnimationMixer(c); mx.clipAction(clip).play(); const b = new T.Box3(); let m = null;
  for (let t = 0; t <= clip.duration; t += 1 / 60) { mx.setTime(t); c.updateMatrixWorld(true); const p = b.setFromObject(ca).getCenter(new T.Vector3()), d = Math.hypot(p.x, p.z);
    if (p.y > 0.6 && p.y < 2.2 && (!m || d > m.d)) m = { t, d, x: p.x, z: p.z, y: p.y }; }
  return m;
}
function instantGeste(g, clip) {
  const c = cloneNu(g), os = BOUTS.map((n) => c.getObjectByName(n)).filter(Boolean); if (!os.length) return [{ t: clip.duration * 0.45 }];
  const mx = new T.AnimationMixer(c); mx.clipAction(clip).play(); const dt = 1 / 60, av = os.map(() => null); let best = 0, tb = clip.duration * 0.45;
  for (let t = 0; t <= clip.duration; t += dt) { mx.setTime(t); c.updateMatrixWorld(true);
    os.forEach((o, i) => { const p = o.getWorldPosition(new T.Vector3()); if (av[i] && t > clip.duration * 0.12 && t < clip.duration * 0.85) { const v = p.distanceTo(av[i]); if (v > best) { best = v; tb = t; } } av[i] = p; }); }
  return [{ t: tb }];
}
function prechaufferSquelettes(noms) { /* (les shaders de leurs matieres prepares au chargement, pas au premier affichage en plein combat, 27/10/2026) */
  const L = noms.filter((n) => MODELES[n] && MODELES[n].userData.squelette).map((n) => clonerSquelette(n)); if (!L.length) return;
  L.forEach((g) => scene.add(g)); try { rendu.compile(scene, camera); } catch (e) { /* rien */ } L.forEach((g) => { scene.remove(g); g.userData.anim.mixer.stopAllAction(); });
}
const SQ_EN_COURS = {}; /* (un seul chargement par modele : les deux renforts d'un meme appel ne le chargent pas deux fois) */
async function chargerSquelettes(noms) {
  for (const [nom, url, h] of SQUELETTES_A_CHARGER) {
    if (MODELES[nom] || (noms && !noms.includes(nom))) continue;
    await (SQ_EN_COURS[nom] = SQ_EN_COURS[nom] || chargerSquelette(nom, url, h).finally(() => { delete SQ_EN_COURS[nom]; }));
  }
}
async function chargerSquelette(nom, url, h) {
  {
    try { const gl = await new Promise((ok, ko) => chargeur.load(url + '?v=' + VERSION_MODELES, ok, undefined, ko)); preparerSquelette(gl.scene);
      gl.scene.updateMatrixWorld(true); const hips = gl.scene.getObjectByName('mixamorigHips');
      const vit = {}, impacts = {}, trajets = {}; gl.animations.forEach((c) => { if (familleDe(c.name) === 'roulade') trajets[c.name] = trajet(c, hips); vit[c.name] = surPlace(c, hips); });
      if (ALLURES[nom]) gl.animations.forEach((c) => { const x = ALLURES[nom][familleDe(c.name)]; if (x) vit[c.name] = x; });
      gl.scene.userData = { squelette: true, hauteur: h, clips: gl.animations, vit, trajets };
      const aCaisse = !!trouverCaisse(gl.scene);
      gl.animations.forEach((c) => { const f = familleDe(c.name); if (aCaisse && (FAMILLES_COUP.includes(f) || f === 'bond')) impacts[c.name] = instantsCoup(gl.scene, c); else if (!aCaisse && FAMILLES_GESTE.includes(f)) impacts[c.name] = instantGeste(gl.scene, c); });
      gl.scene.userData.impacts = impacts;
      if (aCaisse) { const vols = {}, bras = {}; gl.animations.forEach((c) => { const f = familleDe(c.name); if (f === 'bond') vols[c.name] = envol(gl.scene, c); if (f === 'tourbillon') bras[c.name] = brasTendu(gl.scene, c); });
        gl.scene.userData.vols = vols; gl.scene.userData.bras = bras; } /* (le bond et le moulinet de Moon) */
      /* sa portee : la ou tombent ses coups au sol, en moyenne (il ne frappe que si tu es dedans) */
      const D = aCaisse ? [].concat(...Object.values(impacts)).filter((x) => x.sol && x.d).map((x) => x.d).sort((x, y) => x - y) : []; gl.scene.userData.portee = D.length ? D[Math.floor(D.length / 2)] : 0; /* (sans marteau : la portee de sa fiche) */
      MODELES[nom] = gl.scene; } catch (err) { console.error('squelette', nom, err); }
  }
}
function clonerSquelette(nom) {
  const M = MODELES[nom], g = cloneNu(M); g.userData = Object.assign({}, M.userData);
  const mixer = new T.AnimationMixer(g), A = {}, F = {};
  M.userData.clips.forEach((c) => { const a = mixer.clipAction(c), f = familleDe(c.name); A[c.name] = a; (F[f] = F[f] || []).push(c.name);
    if (!FAMILLES_BOUCLE.has(f)) { a.setLoop(T.LoopOnce, 1); a.clampWhenFinished = true; } });
  const peau = []; g.traverse((o) => { if (o.isSkinnedMesh && o.name !== 'contour') { o.material = o.material.clone(); peau.push(o.material); } }); /* (sa propre matiere : l'eclat d'un coup ne touche que lui) */
  g.userData.anim = { mixer, A, F, cour: null, fam: null, dernier: {}, repT: 0, caisse: trouverCaisse(g), peau, eclat: 0 };
  jouerAnim(g.userData.anim, piocher(g.userData.anim, 'repos'), 0); return g;
}
function piocher(an, fam) { const L = an.F[fam] || an.F.repos || []; if (!L.length) return null; let n = L[Math.floor(Math.random() * L.length)]; if (L.length > 1 && n === an.dernier[fam]) n = L[(L.indexOf(n) + 1) % L.length]; an.dernier[fam] = n; return n; }
function jouerAnim(an, nom, fondu) {
  const a = nom && an.A[nom]; if (!a) return null; if (an.cour === nom && FAMILLES_BOUCLE.has(an.fam)) return a;
  const avant = an.cour && an.A[an.cour]; a.reset(); a.timeScale = 1; a.setEffectiveWeight(1); a.play();
  if (avant && avant !== a && fondu > 0) avant.crossFadeTo(a, fondu, false); else if (avant && avant !== a) avant.stop();
  an.cour = nom; an.fam = familleDe(nom); return a;
}
/* un geste d'un coup (rugir, encaisser...) : il garde la main jusqu'a sa fin, le monstre ne marche pas pendant */
/* (26/10/2026, « c'est surtout le boss le souci », Mathieu : un geste long est joue plus vite, jamais plus de ces durees en temps du jeu ;
   le cri d'arrivee d'Ebil durait 3,4 s, ses sorts 2 s, les combos du marteau de Moon jusqu'a 3 s) */
const GESTE_MAX = { rugir: 1.6, sort: 1.4, coup: 2, tourbillon: 2 };
function geste(mo, fam, bloque, choisi, tsMax) { /* (choisi : le mouvement deja tire, celui dont on a lu les impacts ; tsMax : pas plus vite, le coup de Moon s'annonce au moins 0,9 s) */
  const an = mo.m.userData.anim, nom = choisi || piocher(an, fam); if (!nom) return 0;
  const a = jouerAnim(an, nom, 0.15), D = a.getClip().duration, ts = Math.min(tsMax || 99, Math.max(vif(mo), GESTE_MAX[fam] ? D / GESTE_MAX[fam] : 0)); a.timeScale = ts; const d = D / ts;
  mo.geste = { t: 0, d: d - 0.2, ts }; if (bloque) mo.bloqueT = Math.max(mo.bloqueT || 0, d - 0.25); return d;
}
/* chaque image : un geste en cours garde la main ; sinon il marche (ou court) a sa vitesse, ou il attend en changeant de repos de temps en temps.
   Il rugit a son arrivee, puis quand il enrage */
function majSquelette(mo, v, dt) {
  const an = mo.m.userData.anim; if (!an) return;
  if (mo.geste) { mo.geste.t += dt; if (mo.geste.t >= mo.geste.d) mo.geste = null; }
  if (mo.reactT > 0) mo.reactT -= dt;
  if (mo.esquive > 0) mo.esquive -= dt; if (mo.recent > 0) mo.recent -= dt;
  const face = () => { const pp = paysanMesh.position; mo.ry = Math.atan2(pp.x - mo.x, pp.z - mo.z); }; /* (il te fait face pour rugir) */
  if (!mo.geste && !mo.rugiArrivee) { mo.rugiArrivee = true; if (mo.d.boss) { face(); geste(mo, 'rugir', true); } } /* (un boss rugit a son arrivee ; la horde fonce tout de suite) */
  else if (!mo.geste && mo.enrage && !mo.rugiRage) { mo.rugiRage = true; face(); geste(mo, 'rugir', true); }
  if (!mo.geste) {
    if (v > 0.05) { /* l'allure qui colle a sa vitesse, jouee entre 90 % et 180 % : jamais de course au ralenti (une marche acceleree vaut mieux) */
      const nat = (f) => { const L = an.F[f]; const x = L && mo.m.userData.vit[L[0]]; return x > 0.2 ? x : 0; };
      const C = ['marche', 'course'].map((f) => [f, nat(f)]).filter(([, x]) => x); if (!C.length) C.push(['marche', 1.4]);
      const ecart = ([, x]) => { const r = v / x; return r < ALLURE_MIN ? (ALLURE_MIN - r) * 3 : r > ALLURE_MAX ? r - ALLURE_MAX : Math.abs(Math.log(r / 1.15)) * 0.1; };
      const [fam, nv] = C.sort((a, b) => ecart(a) - ecart(b))[0]; if (an.fam !== fam) jouerAnim(an, piocher(an, fam), 0.25);
      if (an.A[an.cour]) an.A[an.cour].timeScale = Math.max(ALLURE_MIN, Math.min(ALLURE_MAX, v / nv)) * vitAnim(mo); }
    else if (an.fam !== 'repos' || (an.repT -= dt) <= 0) { const a = jouerAnim(an, piocher(an, 'repos'), 0.4); if (a) a.timeScale = vif(mo); an.repT = 5 + Math.random() * 5; }
  }
  const rage = mo.enrage && mo.d.auraRage && mo.etat === 'actif'; if (rage) auraRage(mo, an, dt);
  if (an.eclat > 0 || rage) { an.eclat = Math.max(0, an.eclat - dt); const k = an.eclat / 0.16, g = rage ? 0.16 + 0.12 * Math.sin(performance.now() / 150) : 0; an.peau.forEach((m) => m.emissive.setRGB(0.32 * k + g, 0.06 * k + g * 0.3, 0.03 * k + g * 0.04)); /* (un eclat leger : plus fort, une Tortue jaune virait au rose ; enrage, Moon rougeoie en battant) */ }
  an.mixer.update(dt);
}
/* un coup recu : un eclat rouge, sans s'arreter (26/10/2026, « l'animation de degat pris ralentit le mob, du coup on prend 0 degat », Mathieu :
   il jouait un geste de 1 a 2 s, fige, a chaque gros coup, donc presque tout le temps contre un Cra). Seul un boss encaisse encore, d'un sursaut
   court (0,35 s), au plus toutes les 6 s */
function eclatSquelette(mo) { const an = mo.m && mo.m.userData.anim; if (an) an.eclat = 0.16; }
function reactionSquelette(mo) { if (!mo.d.boss || mo.geste || mo.reactT > 0 || mo.etat !== 'actif') return; mo.reactT = 6; if (geste(mo, 'touche', false)) { mo.geste.d = Math.min(mo.geste.d, 0.7); mo.bloqueT = Math.max(mo.bloqueT || 0, 0.35); } }
/* son coup ou son tir (les monstres sans marteau) : un geste de la famille au hasard, accelere pour que le coup tombe vite (0,42 s au plus, 0,5 pour
   un tir) ; l'effet (frapper : les degats, la fleche, le coup sur le batiment) part a l'instant du geste lu au chargement, puis le geste s'arrete
   peu apres et il repart. Sans ce geste, tout de suite */
function attaqueSquelette(mo, fam, frapper) {
  const an = mo.m.userData.anim; if (!an.F[fam]) fam = an.F.coup ? 'coup' : null;
  if (!fam || mo.geste) { frapper(); return; }
  const nom = piocher(an, fam), a = jouerAnim(an, nom, 0.1), d0 = a.getClip().duration, t0 = (((mo.m.userData.impacts || {})[nom] || [])[0] || { t: d0 * 0.45 }).t;
  const k = Math.max(1, Math.min(2.4, t0 / (mo.d.distance ? 0.5 : 0.42))) * vitAnim(mo); a.timeScale = k; const ti = t0 / k, c0 = combat;
  mo.geste = { t: 0, d: Math.min(d0 / k - 0.1, ti + 0.4) }; mo.bloqueT = Math.max(mo.bloqueT || 0, ti + 0.08); let t = 0;
  effets.push((dt) => { t += dt; if (t < ti) return false; if (combat === c0 && !c0.fin && mo.etat === 'actif') frapper(); return true; });
}
/* la roulade des Tortues (26/10/2026) : elle se tourne dans la direction a, culbute, et avance comme dans l'animation ; pendant la culbute, les coups
   la manquent (mo.esquive, voir blesser) */
function rouladeSquelette(mo, a) {
  const an = mo.m.userData.anim, nom = an.F.roulade && an.F.roulade[0], tj = nom && (mo.m.userData.trajets || {})[nom]; if (!nom || mo.geste) return false;
  const ac = jouerAnim(an, nom, 0.08), k = 1.3 * vitAnim(mo); ac.timeScale = k; const d0 = ac.getClip().duration, D = d0 / k;
  const L = (mo.m.userData.vit[nom] || 1.5) * d0, f = pointValide(mo.x, mo.z, mo.x + Math.sin(a) * L, mo.z + Math.cos(a) * L), x0 = mo.x, z0 = mo.z, c0 = combat;
  mo.ry = a; mo.geste = { t: 0, d: D - 0.05 }; mo.bloqueT = Math.max(mo.bloqueT || 0, D); mo.esquive = D * 0.8; let t = 0;
  const part = (u) => { if (!tj) return u; const T0 = u * d0; let i = 1; while (i < tj.t.length - 1 && tj.t[i] < T0) i++;
    const a2 = tj.t[i - 1], b2 = tj.t[i], w = b2 > a2 ? Math.min(1, Math.max(0, (T0 - a2) / (b2 - a2))) : 1; return tj.s[i - 1] + (tj.s[i] - tj.s[i - 1]) * w; };
  effets.push((dt) => { t += dt; if (combat !== c0 || mo.etat !== 'actif') return true; const s = part(Math.min(1, t / D)); mo.x = x0 + (f.x - x0) * s; mo.z = z0 + (f.z - z0) * s; return t >= D; });
  return true;
}
/* le geste d'un sort (le tambour de Tam, la sagaie que Jav arme...) : il le joue, sans bloquer plus que le sort lui-meme */
function gesteSort(mo, fam, dans) { const an = mo.m && mo.m.userData.anim; if (!an || !an.F[fam] || mo.geste) return;
  if (!dans) { geste(mo, fam, false); return; }
  /* (28/10/2026, « des vraies attaques avec des animations », Mathieu) dans : le temps jusqu'a l'impact du sort (la fin de sa zone rouge) ; le geste
     est accelere ou ralenti pour que son instant de frappe tombe la, l'elan remplit l'attente */
  const nom = piocher(an, fam), imp = ((mo.m.userData.impacts || {})[nom] || [])[0], a = jouerAnim(an, nom, 0.12), D = a.getClip().duration, t0 = imp ? imp.t : D * 0.5;
  const ts = Math.max(0.5, Math.min(2.5, t0 / dans)); a.timeScale = ts; mo.geste = { t: 0, d: Math.min(D / ts, dans + 0.6), ts }; }
/* d'ou part un tir : la main qui tient l'arme (l'arc dans la main gauche) */
function mainSquelette(mo) { const o = mo.m && mo.m.getObjectByName(mo.d.tirGauche ? 'mixamorigLeftHand' : 'mixamorigRightHand'); return o ? o.getWorldPosition(new T.Vector3()) : null; }
/* sa mort : la chute, puis il s'enfonce dans le sol */
function mortSquelette(mo, dt) {
  const an = mo.m.userData.anim; if (!mo.chute) { mo.chute = { t: 0, d: geste(mo, 'mort', false) || 1.5 }; mo.geste = null; }
  mo.chute.t += dt; an.mixer.update(dt);
  if (mo.chute.t > mo.chute.d + 0.6) { mo.m.position.y -= dt * 1.4; if (mo.chute.t > mo.chute.d + 2.4 && mo.m.parent) jeter(mo.m); }
}
/* le coup de marteau : un coup au hasard (parfois le moulinet), ses degats a chaque instant ou le marteau arrive en bas.
   (30/10/2026 au soir, « les animations sont vraiment bizarres, le cratere au sol est pas sur moi, le saut est decale », Mathieu) : chaque coup
   tombait la ou son animation pose le marteau, jusqu'a 70 degres sur le cote et a plus de 3 de lui, presque jamais sous le perso. Maintenant il se
   tourne et se recale d'un pas, avant de frapper, pour que le premier impact au sol tombe la ou tu es : le cercle est sous tes pieds, le cratere
   dans le cercle. Un coup qui balaie (sans impact au sol) frappe en eventail devant lui, face a toi. Ses zones sont a la couleur de ses sorts */
const ALERTE_MARTEAU = 0.9; /* (le premier impact jamais moins de 0,9 s apres l'annonce : 0,5 a 0,65 s avant, on n'avait pas le temps de lire le cercle) */
const echelleSq = (mo) => mo.m.scale.x / ((MODELES[mo.d.modele] || mo.m).scale.x || 1) / (1 + Math.max(0, mo.coup || 0) * 0.9); /* (sans le gonflement d'un coup recu) */
const versMonde = (x0, z0, ry, lx, lz) => ({ x: x0 + lx * Math.cos(ry) + lz * Math.sin(ry), z: z0 - lx * Math.sin(ry) + lz * Math.cos(ry) }); /* (un point du modele, tourne de ry, pose en x0, z0) */
/* il se tourne et glisse jusqu'a sa place de frappe, en douceur */
function recaler(mo, x1, z1, ry1, duree) {
  const x0 = mo.x, z0 = mo.z, r0 = mo.ry, dr = Math.atan2(Math.sin(ry1 - r0), Math.cos(ry1 - r0)), c0 = combat; let t = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || mo.etat !== 'actif') return true; const k = Math.min(1, t / Math.max(0.01, duree)), e = k * k * (3 - 2 * k);
    mo.x = x0 + (x1 - x0) * e; mo.z = z0 + (z1 - z0) * e; mo.ry = r0 + dr * e; return k >= 1; });
}
function coupMarteau(mo) {
  const an = mo.m.userData.anim; if (an.F.tourbillon && Math.random() < 0.2) { moulinet(mo); return; }
  const nom = piocher(an, 'coup'), c0 = combat, pp = paysanMesh.position, e = echelleSq(mo), X = mo.d.sortsX || {};
  const brut = (mo.m.userData.impacts || {})[nom] || [{ t: 1, sol: true, x: 0, z: 2.6 }];
  const d = geste(mo, 'coup', true, nom, brut[0].t / (ALERTE_MARTEAU / (mo.d.vivacite || 1))), ts = (mo.geste && mo.geste.ts) || vif(mo), L = brut.map((x) => Object.assign({}, x, { t: x.t / ts }));
  mo.cd = Math.max(mo.cd, d + 0.7); /* (un souffle entre deux coups : un enchainement long ne repart pas aussitot) */
  const aP = Math.atan2(pp.x - mo.x, pp.z - mo.z), dP = Math.hypot(pp.x - mo.x, pp.z - mo.z), sol = L.find((x) => x.sol && x.x != null);
  let ry = aP, x1 = mo.x, z1 = mo.z;
  if (sol) { const lx = sol.x * e, lz = sol.z * e, k = Math.max(-1.6, Math.min(1.6, dP - Math.hypot(lx, lz))), f = pointValide(mo.x, mo.z, mo.x + Math.sin(aP) * k, mo.z + Math.cos(aP) * k);
    ry = aP - Math.atan2(lx, lz); x1 = f.x; z1 = f.z; } /* (le pas qu'il fait vers toi, ou en arriere, pour que le marteau tombe sur toi) */
  recaler(mo, x1, z1, ry, Math.min(0.3, L[0].t * 0.4));
  L.forEach((imp) => {
    const dg = Math.max(1, Math.round(degSort(mo) * (imp.sol ? X.marteau || 0.5 : X.balaye || 0.25)));
    const z = imp.sol && imp.x != null ? Object.assign({ r: 1.9 }, versMonde(x1, z1, ry, imp.x * e, imp.z * e)) : { x: x1, z: z1, r: 3.7 * e, a: ry, ouv: 1.0 };
    const touche = (dz) => { const p2 = paysanMesh.position; if (combat === c0 && !c0.fin && mo.etat === 'actif' && dansDanger(dz, p2.x, p2.z)) { blesserPerso(dg, mo); if (combat && !combat.fin) effetsCoup(mo); } };
    zoneDanger(Object.assign({ mo, duree: Math.max(0.3, imp.t), effet: touche }, z));
  });
  if (!c0.marteauVu) { c0.marteauVu = true; toast(leNom(mo.d) + ' abat son marteau sur toi : sors du cercle avant qu\'il tombe !', 'alerte'); }
  let t = 0, k = 0;
  effets.push((dt) => { t += dt;
    while (k < L.length && t >= L[k].t) { const imp = L[k++];
      if (combat !== c0 || c0.fin || mo.etat !== 'actif' || !an.caisse) return true;
      const p = new T.Box3().setFromObject(an.caisse).getCenter(new T.Vector3()), y = mo.m.position.y;
      if (imp.sol) impactMarteau(p.x, y, p.z, mo.d.couleurSorts);
      else { secousse(0.16, 0.3); balayage(mo, x1, y, z1, ry, 3.4 * e); poussiere(p.x, y, p.z, 12, 1.4, '#d8c6a0'); } }
    return t >= d || k >= L.length && t > L[L.length - 1].t + 0.1; });
}
/* la trainee d'un coup qui balaie : une lame de vent en eventail devant lui, a sa couleur */
function balayage(mo, x, y, z, ry, r) {
  const C = mo.d.couleurSorts || ['#ff7a3a', '#ffe0c0', '#8a2a12'], g = new T.Group(); g.position.set(x, y + 1.1, z); g.rotation.y = ry;
  const lames = [['#ffffff', C[1], 1, 1.0, true], [C[1], C[0], 0.75, 1.12, false]].map(([c, b, o, sc, plein]) => { const m = new T.Mesh(GEO_RUBAN, matRuban(c, b, o, plein)); m.rotation.x = Math.PI / 2; m.scale.set(sc * r / 1.15, sc * r / 1.15, 1); m.renderOrder = plein ? 9 : 8; g.add(m); return m; });
  fxVie(g, 0.3, (k) => { const u = 1 - Math.pow(1 - k, 2.2); lames.forEach((m, i) => { m.material.uniforms.uP.value = u * 1.5; m.material.uniforms.uA.value = (i ? 0.75 : 1) * (k < 0.7 ? 1 : (1 - k) / 0.3); }); });
  onde(x, y, z, r * 1.1, C[1], 0.45, 0.6);
}
/* le moulinet (30/10/2026 au soir, « 3 tours, un coup par tour », propose a Mathieu) : il te fait face et arme son coup, le grand cercle s'annonce ;
   puis, marteau tendu (la pose du tourbillon ou la caisse est la plus loin de lui), il tourne trois fois sur lui-meme, une lame de vent derriere le
   marteau, de la poussiere au sol ; chaque tour frappe dans le cercle, qui reste affiche tant qu'il tourne */
const TOURS_MOULINET = 3, VITESSE_MOULINET = 2.6; /* (tours par seconde, fois sa vivacite ; 2,2 avant le 30/10/2026 au soir, « le tour qu'il fait sur lui-meme faudrait que ce soit plus rapide », Mathieu) */
function moulinet(mo) {
  const an = mo.m.userData.anim, nom = piocher(an, 'tourbillon'), c0 = combat, pp = paysanMesh.position, e = echelleSq(mo), C = mo.d.couleurSorts || ['#e2413a', '#ffd0c0', '#8a1a12'];
  const bras = ((mo.m.userData.bras || {})[nom]) || { t: 1.1, d: 2.6, y: 1.3 }, R = (bras.d + 0.9) * e, viv = mo.d.vivacite || 1, Ds = TOURS_MOULINET / (VITESSE_MOULINET * viv), alerte = ALERTE_MARTEAU / viv;
  const dg = Math.max(1, Math.round(degSort(mo) * ((mo.d.sortsX || {}).moulinet || 0.35)));
  const a = jouerAnim(an, nom, 0.12); a.timeScale = bras.t / alerte; mo.geste = { t: 0, d: alerte + Ds + 0.15, ts: a.timeScale };
  mo.bloqueT = Math.max(mo.bloqueT || 0, alerte + Ds + 0.25); mo.cd = Math.max(mo.cd, alerte + Ds + 1.1);
  recaler(mo, mo.x, mo.z, Math.atan2(pp.x - mo.x, pp.z - mo.z) - Math.atan2(bras.x || 0, bras.z || 1), 0.25);
  if (!c0.moulinetVu) { c0.moulinetVu = true; toast(leNom(mo.d) + ' tourne trois fois sur lui-même : sors du grand cercle !', 'alerte'); }
  const touche = () => { const p2 = paysanMesh.position; if (combat === c0 && !c0.fin && mo.etat === 'actif' && Math.hypot(p2.x - mo.x, p2.z - mo.z) < R) { blesserPerso(dg, mo); if (combat && !combat.fin) effetsCoup(mo); }
    const y = mo.m.position.y; onde(mo.x, y, mo.z, R * 1.05, C[1], 0.4, 0.75); onde(mo.x, y, mo.z, R * 0.8, C[2], 0.5, 0.45, true); secousse(0.12, 0.25); };
  zoneDanger({ mo, x: mo.x, z: mo.z, r: R, duree: alerte, effet: () => {
    if (combat !== c0 || c0.fin || mo.etat !== 'actif') return;
    a.time = bras.t; a.timeScale = 0; touche(); /* (le marteau tendu, fige ; c'est lui qui tourne) */
    const d = { x: mo.x, z: mo.z, r: R }; (c0.dangers = c0.dangers || []).push(d);
    const g = new T.Group(), y0 = mo.m.position.y; g.position.set(mo.x, y0 + 0.07, mo.z);
    const fond = new T.Mesh(new T.CircleGeometry(R, 48), new T.MeshBasicMaterial({ color: C[0], transparent: true, opacity: 0.22, depthWrite: false, side: T.DoubleSide })), bord = new T.Mesh(new T.RingGeometry(R - 0.16, R, 56), new T.MeshBasicMaterial({ color: C[0], transparent: true, opacity: 0.9, depthWrite: false, side: T.DoubleSide }));
    [fond, bord].forEach((m) => { m.rotation.x = -Math.PI / 2; m.renderOrder = 2; g.add(m); }); scene.add(g);
    const lame = new T.Group(); lame.position.set(mo.x, y0 + bras.y * e, mo.z);
    const lames = [['#ffffff', C[1], 0.9, 1.0, true], [C[1], C[0], 0.6, 1.1, false]].map(([c, b, o, sc, plein]) => { const m = new T.Mesh(GEO_RUBAN, matRuban(c, b, o, plein)); m.rotation.x = Math.PI / 2; m.scale.set(sc * (R - 0.3) / 1.15, sc * (R - 0.3) / 1.15, 1); m.material.uniforms.uP.value = 1; m.material.uniforms.uQ.value = 0.85; m.renderOrder = plein ? 9 : 8; lame.add(m); return m; });
    scene.add(lame);
    const r0 = mo.ry, a0 = Math.atan2(bras.x || 0, bras.z || 1); let t = 0, tours = 0, pf = 0;
    const fin = () => { jeter(g); jeter(lame); const i = c0.dangers.indexOf(d); if (i >= 0) c0.dangers.splice(i, 1); if (mo.geste) mo.geste.d = Math.min(mo.geste.d, mo.geste.t); return true; };
    effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') return fin();
      const k = Math.min(1, t / Ds); mo.ry = r0 + k * TOURS_MOULINET * Math.PI * 2; lame.rotation.y = mo.ry + a0 - 1.25; /* (la tete de la lame, a +1,25 dans le ruban, sur le marteau) */
      lames.forEach((m, i) => { m.material.uniforms.uA.value = (i ? 0.6 : 0.9) * Math.min(1, t / 0.12) * Math.min(1, (Ds - t) / 0.15 + 0.2); });
      fond.material.opacity = 0.16 + 0.1 * Math.abs(Math.sin(t * 9));
      if ((pf -= dt) <= 0) { pf = 0.06; const am = mo.ry + a0, rx = mo.x + Math.sin(am) * (R - 0.6), rz = mo.z + Math.cos(am) * (R - 0.6);
        emettre(FX_FUM, 2, { x: rx, y: y0 + 0.15, z: rz, v: [Math.cos(am) * 2.2, 0.9, -Math.sin(am) * 2.2], dv: 0.6, vie: [0.5, 0.8], taille: [0.6, 1.4], c: ['#e6d6b4', '#d2bf98'], a: 0.5, frein: 2.5, vrot: 1.2 }); }
      const n = Math.floor(k * TOURS_MOULINET + 1e-6); if (n > tours && tours < TOURS_MOULINET - 1) { tours = n; touche(); } else tours = Math.max(tours, n);
      if (k >= 1) { mo.ry = r0; return fin(); } });
  } });
}
/* le bond de Moon (30/10/2026 au soir) : il vise l'endroit ou tu es ; son animation est recalee pour que le marteau s'abatte sur le centre du cercle
   a la fin du temps pour esquiver (le dernier impact au sol, pas le premier : celui-la, c'etait l'elan, et les degats tombaient une seconde avant
   le marteau), et il ne quitte le sol qu'entre le moment ou ses hanches decollent et celui ou elles retombent (lus sur l'animation). Il atterrit a la
   longueur de son marteau du centre, plus au centre ; son ombre grandit sur le cercle pendant qu'il est en l'air */
function bondMarteau(mo, cx, cz) {
  const an = mo.m.userData.anim, U = mo.m.userData, nom = piocher(an, 'bond'), E = ESQUIVE.bond / ((mo.d.vivacite || 1) * (mo.d.bondVif || 1)), c0 = combat, e = echelleSq(mo), C = mo.d.couleurSorts || ['#e2413a', '#ffd0c0', '#8a1a12'];
  if (!nom) return;
  const S = ((U.impacts || {})[nom] || []).filter((x) => x.sol && x.x != null), imp = S[S.length - 1] || { t: 1.75, x: 0, z: 1.8 }, vol = (U.vols || {})[nom] || [imp.t * 0.35, imp.t * 0.9];
  const a = jouerAnim(an, nom, 0.1), D = a.getClip().duration, ts = imp.t / E; a.timeScale = ts; mo.geste = { t: 0, d: Math.min(D / ts - 0.15, E + 0.7), ts }; mo.bloqueT = Math.max(mo.bloqueT || 0, E + 0.6); /* (il se releve en marchant : la fin du bond, 1,6 s debout sur place, est coupee) */
  const x0 = mo.x, z0 = mo.z, lx = imp.x * e, lz = imp.z * e, ry = Math.atan2(cx - x0, cz - z0) - Math.atan2(lx, lz), q = versMonde(0, 0, ry, lx, lz);
  const f = pointValide(x0, z0, cx - q.x, cz - q.z), c = { x: f.x + q.x, z: f.z + q.z }, R = 2.8; /* (c : la ou le marteau tombe vraiment, si un mur l'a arrete avant) */
  recaler(mo, x0, z0, ry, 0.2);
  if (!c0.bonditVu) { c0.bonditVu = true; toast(leNom(mo.d) + ' va bondir et abattre son marteau sur toi : sors du cercle !', 'alerte'); }
  const ombre = new T.Mesh(GEO_DISQUE, fxMat('#1c120a', 0.5)); ombre.rotation.x = -Math.PI / 2; ombre.position.set(c.x, solA(c.x, c.z) + 0.09, c.z); ombre.renderOrder = 3; ombre.scale.setScalar(0.01); scene.add(ombre);
  const t0 = vol[0] / ts, t1 = Math.max(t0 + 0.2, vol[1] / ts); let t = 0;
  effets.push((dt) => { t += dt; if (combat !== c0 || c0.fin || mo.etat !== 'actif') { jeter(ombre); return true; }
    if (t > t0) { const k = Math.min(1, (t - t0) / (t1 - t0)), e2 = k * k * (3 - 2 * k); mo.x = x0 + (f.x - x0) * e2; mo.z = z0 + (f.z - z0) * e2; }
    const o = Math.max(0, Math.min(1, (t - t0) / (E - t0))); ombre.scale.setScalar(Math.max(0.01, R * (0.25 + 0.65 * o))); ombre.material.opacity = 0.2 + 0.4 * o;
    if (t >= E) { jeter(ombre); return true; } });
  zoneDanger({ mo, x: c.x, z: c.z, r: R, duree: E, effet: (d) => { mo.frappe = 0.4; const y = solA(c.x, c.z); impactMarteau(c.x, y, c.z, C); onde(c.x, y, c.z, 7.5, C[1], 0.7, 0.6);
    pouf(c.x, y, c.z, 5, '#8e7a5e'); const p2 = paysanMesh.position; if (dansDanger(d, p2.x, p2.z)) blesserPerso(Math.round(degSort(mo) * ((mo.d.sortsX || {}).bond || 1)), mo); } });
}
/* sa colere (enrage, auraRage dans sa fiche) : sa peau rougeoie en battant, des braises montent autour de lui et de la vapeur sort de sa tete */
function auraRage(mo, an, dt) {
  if (!an.rageVu) { an.rageVu = true; const y = mo.m.position.y; onde(mo.x, y, mo.z, 6, '#ff9a4a', 0.6, 0.8); flashLumiere(mo.x, y + 2, mo.z, '#ff7a2e', 3, 9, 0.35); emettre(FX_VIF, 30, { x: mo.x, y: y + 2, z: mo.z, r: 1.2, dv: 5, vie: [0.4, 0.8], taille: [0.12, 0.03], c: ['#fff1c0', '#ff9a3a', '#e2413a'], grav: 4, frein: 1.5, etire: 0.03 }); }
  if ((an.rageT = (an.rageT || 0) - dt) > 0) return; an.rageT = 0.08; const h = mo.haut || 4, y = mo.m.position.y, a = Math.random() * Math.PI * 2, r = 0.6 + Math.random() * 1.2;
  emettre(FX_VIF, 2, { x: mo.x + Math.sin(a) * r, y: y + 0.3 + Math.random() * h * 0.7, z: mo.z + Math.cos(a) * r, r: 0.3, v: [0, 2.2, 0], dv: 0.5, vie: [0.5, 0.9], taille: [0.13, 0.03], c: ['#ffb02e', '#e8411a', '#9a1a08'], frein: 0.6 }); /* (des braises en couleur pleine : en lumiere, elles disparaissaient sur le sable clair) */
  if ((an.vapeurT = (an.vapeurT || 0) - 1) > 0) return; an.vapeurT = 5;
  const tete = an.tete || (an.tete = mo.m.getObjectByName('mixamorigHead')); if (!tete) return; const p = tete.getWorldPosition(new T.Vector3());
  emettre(FX_FUM, 4, { x: p.x, y: p.y + 0.6, z: p.z, r: 0.35, v: [0, 2.2, 0], dv: 0.6, vie: [0.7, 1.1], taille: [0.6, 1.8], c: ['#d8cfc8', '#b8aca4'], a: 0.7, frein: 1.5, vrot: 1 });
}
/* le petit cratere (« l'impact doit faire comme un pti cratere », Mathieu) : un creux sombre, un bourrelet de terre souleve tout autour, des mottes et
   des touffes d'herbe sur le bord ; il jaillit en 0,1 s, reste, puis s'enfonce dans le sol et s'efface */
const GEO_BOURRELET = new T.TorusGeometry(1, 0.2, 8, 28); GEO_BOURRELET.rotateX(Math.PI / 2); partager(GEO_BOURRELET);
const MAT_CRATERE = { terre: mat('#7a5a3a'), terreF: mat('#5e4129'), herbe: mat('#6fa443') }; partager(...Object.values(MAT_CRATERE));
function cratere(x, y, z, r, duree) {
  const g = new T.Group(); g.position.set(x, y, z);
  const fond = new T.Mesh(GEO_DISQUE, fxMat('#3a2716', 0.92)), bord = new T.Mesh(GEO_DISQUE, fxMat('#5c4128', 0.85));
  fond.rotation.x = bord.rotation.x = -Math.PI / 2; fond.position.y = 0.035; bord.position.y = 0.03; fond.scale.setScalar(r * 0.72); bord.scale.setScalar(r * 1.02); fond.renderOrder = 3; bord.renderOrder = 2;
  const tore = new T.Mesh(GEO_BOURRELET, MAT_CRATERE.terre); tore.scale.set(r, 0.55, r); tore.position.y = 0.02; tore.castShadow = tore.receiveShadow = true; g.add(bord, fond, tore);
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + fxEntre(-0.2, 0.2), d = r * fxEntre(0.92, 1.2), m = new T.Mesh(GEO_MOTTE, i % 4 === 0 ? MAT_CRATERE.herbe : i % 2 ? MAT_CRATERE.terreF : MAT_CRATERE.terre);
    m.position.set(Math.sin(a) * d, 0.1 + fxAlea() * 0.06, Math.cos(a) * d); m.rotation.set(fxAlea() * 3, fxAlea() * 3, fxAlea() * 3); m.scale.setScalar(fxEntre(1.4, 2.6)); m.castShadow = true; g.add(m); }
  fxVie(g, duree, (k) => { const tk = k * duree, monte = Math.min(1, tk / 0.1), fin = Math.max(0, (tk - (duree - 0.7)) / 0.7);
    g.scale.set(0.6 + 0.4 * monte, monte * (1 - fin) + 0.001, 0.6 + 0.4 * monte); fond.material.opacity = 0.92 * (1 - fin); bord.material.opacity = 0.85 * (1 - fin); });
}
function impactMarteau(x, y, z, C) { /* (C : la couleur de ses sorts, pour l'onde) */
  secousse(0.32, 0.45); flashLumiere(x, y + 0.6, z, '#fff1d0', 3.2, 9, 0.22);
  emettre(FX_LUM, 1, { x, y: y + 0.3, z, vie: [0.12, 0.14], taille: [3.5, 5.5], c: ['#ffffff', C ? C[1] : '#ffe2a0'], a: 0.85, entree: 0.01 });
  onde(x, y, z, 5.5, C ? C[1] : '#fff3d6', 0.5, 0.95); onde(x, y, z, 3.6, '#8b6a45', 0.7, 0.55, true);
  solFendu(x, y, z, 3.0, false); poussiere(x, y, z, 18, 1.8, '#d8c6a0'); mottes(x, y, z, 12, 1.4); cratere(x, y, z, 1.15, 4);
}
