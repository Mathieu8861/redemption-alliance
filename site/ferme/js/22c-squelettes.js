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
const SQUELETTES_A_CHARGER = [['moon', 4.6], ['jav', 2.1], ['sarbak', 1.7], ['ark', 2.2], ['tam', 1.9], ['ebil', 3.0], ['tortue-bleue', 1.8], ['tortue-jaune', 1.8], ['tortue-rouge', 1.8], ['tortue-verte', 1.8]]
  .map(([n, h]) => [n, 'assets/modeles/jeu/' + n + '-anime.glb', h]); /* (charges a la demande : chargerSquelettes(noms), pour l'Arene dev) */
const FAMILLES_BOUCLE = new Set(['repos', 'marche', 'course']);
/* (26/10/2026, « les monstres sont au ralenti, t'as l'impression qu'ils sont en x0.5 », Mathieu : les mouvements de Mixamo ont le rythme d'un vrai
   corps, plus lent que nos monstres de dessin anime ; tous un peu plus vifs, et une course ou une marche jamais jouee sous 90 % de sa vitesse) */
const VIF = 1.2, ALLURE_MIN = 0.9, ALLURE_MAX = 1.8;
/* la vitesse de toutes leurs animations, par-dessus (26/10/2026, « pourquoi je ressens ca moi ? j'ai pas ce ressenti sur les autres monstres », Mathieu) :
   les mouvements captures sur de vrais acteurs paraissent au ralenti sur nos petits monstres de dessin anime ; Mathieu la regle dans l'Arene dev */
let VITESSE_ANIM = (() => { try { return +localStorage.getItem('ferme-vitesse-anim') || 1.25; } catch (e) { return 1.25; } })();
const vif = () => VIF * VITESSE_ANIM;
const FAMILLES_COUP = ['coup', 'tourbillon'];
const FAMILLES_GESTE = ['coup', 'tir', 'sort', 'bond']; /* (les monstres sans marteau : l'instant du coup, celui ou une main ou un pied va le plus vite) */
const BOUTS = ['mixamorigRightHand', 'mixamorigLeftHand', 'mixamorigRightFoot', 'mixamorigLeftFoot'];
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
function instantsCoup(g, clip) {
  const c = T.SkeletonUtils.clone(g), caisse = trouverCaisse(c); if (!caisse) return [{ t: clip.duration * 0.45, sol: true }];
  const mx = new T.AnimationMixer(c); mx.clipAction(clip).play(); const b = new T.Box3(), P = [], dt = 1 / 60;
  for (let t = 0; t <= clip.duration; t += dt) { mx.setTime(t); c.updateMatrixWorld(true); b.setFromObject(caisse); P.push({ t, y: b.min.y, p: b.getCenter(new T.Vector3()) }); }
  const L = [];
  for (let i = 2; i < P.length - 2; i++) { const y = P[i].y; if (!(y < 1.1 && y <= P[i - 1].y && y <= P[i - 2].y && y < P[i + 1].y && y <= P[i + 2].y)) continue;
    let haut = y; for (let j = i; j >= 0 && P[i].t - P[j].t <= 0.4; j--) haut = Math.max(haut, P[j].y); /* (un vrai coup : le marteau vient de tomber d'au moins 1,3 ; pas la pose de garde, marteau bas, du debut ou de la fin) */
    if (haut - y > 1.3 && P[i].p.z > 0.6 && P[i].t > 0.15 && P[i].t < clip.duration - 0.2 && (!L.length || P[i].t - L[L.length - 1].t > 0.3)) L.push({ t: P[i].t, sol: y < 0.35, d: Math.hypot(P[i].p.x, P[i].p.z) }); }
  /* (P[i].p.z > 0.6 : devant lui ; le modele est a l'origine, tourne vers +z, l'avant du jeu. Un creux derriere lui, c'est l'elan, pas le coup) */
  if (!L.length) { let best = 0, k = 1; for (let i = 1; i < P.length; i++) { const v = P[i].p.distanceTo(P[i - 1].p); if (v > best) { best = v; k = i; } } L.push({ t: P[k].t, sol: false }); }
  return L;
}
function instantGeste(g, clip) {
  const c = T.SkeletonUtils.clone(g), os = BOUTS.map((n) => c.getObjectByName(n)).filter(Boolean); if (!os.length) return [{ t: clip.duration * 0.45 }];
  const mx = new T.AnimationMixer(c); mx.clipAction(clip).play(); const dt = 1 / 60, av = os.map(() => null); let best = 0, tb = clip.duration * 0.45;
  for (let t = 0; t <= clip.duration; t += dt) { mx.setTime(t); c.updateMatrixWorld(true);
    os.forEach((o, i) => { const p = o.getWorldPosition(new T.Vector3()); if (av[i] && t > clip.duration * 0.12 && t < clip.duration * 0.85) { const v = p.distanceTo(av[i]); if (v > best) { best = v; tb = t; } } av[i] = p; }); }
  return [{ t: tb }];
}
async function chargerSquelettes(noms) {
  for (const [nom, url, h] of SQUELETTES_A_CHARGER) {
    if (MODELES[nom] || (noms && !noms.includes(nom))) continue;
    try { const gl = await new Promise((ok, ko) => chargeur.load(url + '?v=' + VERSION_MODELES, ok, undefined, ko)); preparerSquelette(gl.scene);
      gl.scene.updateMatrixWorld(true); const hips = gl.scene.getObjectByName('mixamorigHips');
      const vit = {}, impacts = {}, trajets = {}; gl.animations.forEach((c) => { if (familleDe(c.name) === 'roulade') trajets[c.name] = trajet(c, hips); vit[c.name] = surPlace(c, hips); });
      gl.scene.userData = { squelette: true, hauteur: h, clips: gl.animations, vit, trajets };
      const aCaisse = !!trouverCaisse(gl.scene);
      gl.animations.forEach((c) => { const f = familleDe(c.name); if (aCaisse && (FAMILLES_COUP.includes(f) || f === 'bond')) impacts[c.name] = instantsCoup(gl.scene, c); else if (!aCaisse && FAMILLES_GESTE.includes(f)) impacts[c.name] = instantGeste(gl.scene, c); });
      gl.scene.userData.impacts = impacts;
      /* sa portee : la ou tombent ses coups au sol, en moyenne (il ne frappe que si tu es dedans) */
      const D = aCaisse ? [].concat(...Object.values(impacts)).filter((x) => x.sol && x.d).map((x) => x.d).sort((x, y) => x - y) : []; gl.scene.userData.portee = D.length ? D[Math.floor(D.length / 2)] : 0; /* (sans marteau : la portee de sa fiche) */
      MODELES[nom] = gl.scene; } catch (err) { console.error('squelette', nom, err); }
  }
}
function clonerSquelette(nom) {
  const M = MODELES[nom], g = T.SkeletonUtils.clone(M); g.userData = Object.assign({}, M.userData);
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
function geste(mo, fam, bloque, choisi) { /* (choisi : le mouvement deja tire, celui dont on a lu les impacts) */
  const an = mo.m.userData.anim, nom = choisi || piocher(an, fam); if (!nom) return 0;
  const a = jouerAnim(an, nom, 0.15); a.timeScale = vif(); const d = a.getClip().duration / vif(); mo.geste = { t: 0, d: d - 0.2 }; if (bloque) mo.bloqueT = Math.max(mo.bloqueT || 0, d - 0.25); return d;
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
      if (an.A[an.cour]) an.A[an.cour].timeScale = Math.max(ALLURE_MIN, Math.min(ALLURE_MAX, v / nv)) * VITESSE_ANIM; }
    else if (an.fam !== 'repos' || (an.repT -= dt) <= 0) { const a = jouerAnim(an, piocher(an, 'repos'), 0.4); if (a) a.timeScale = vif(); an.repT = 5 + Math.random() * 5; }
  }
  if (an.eclat > 0) { an.eclat = Math.max(0, an.eclat - dt); const k = an.eclat / 0.16; an.peau.forEach((m) => m.emissive.setRGB(0.32 * k, 0.06 * k, 0.03 * k)); /* (un eclat leger : plus fort, une Tortue jaune virait au rose) */ }
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
  const k = Math.max(1, Math.min(2.4, t0 / (mo.d.distance ? 0.5 : 0.42))) * VITESSE_ANIM; a.timeScale = k; const ti = t0 / k, c0 = combat;
  mo.geste = { t: 0, d: Math.min(d0 / k - 0.1, ti + 0.4) }; mo.bloqueT = Math.max(mo.bloqueT || 0, ti + 0.08); let t = 0;
  effets.push((dt) => { t += dt; if (t < ti) return false; if (combat === c0 && !c0.fin && mo.etat === 'actif') frapper(); return true; });
}
/* la roulade des Tortues (26/10/2026) : elle se tourne dans la direction a, culbute, et avance comme dans l'animation ; pendant la culbute, les coups
   la manquent (mo.esquive, voir blesser) */
function rouladeSquelette(mo, a) {
  const an = mo.m.userData.anim, nom = an.F.roulade && an.F.roulade[0], tj = nom && (mo.m.userData.trajets || {})[nom]; if (!nom || mo.geste) return false;
  const ac = jouerAnim(an, nom, 0.08), k = 1.3 * VITESSE_ANIM; ac.timeScale = k; const d0 = ac.getClip().duration, D = d0 / k;
  const L = (mo.m.userData.vit[nom] || 1.5) * d0, f = pointValide(mo.x, mo.z, mo.x + Math.sin(a) * L, mo.z + Math.cos(a) * L), x0 = mo.x, z0 = mo.z, c0 = combat;
  mo.ry = a; mo.geste = { t: 0, d: D - 0.05 }; mo.bloqueT = Math.max(mo.bloqueT || 0, D); mo.esquive = D * 0.8; let t = 0;
  const part = (u) => { if (!tj) return u; const T0 = u * d0; let i = 1; while (i < tj.t.length - 1 && tj.t[i] < T0) i++;
    const a2 = tj.t[i - 1], b2 = tj.t[i], w = b2 > a2 ? Math.min(1, Math.max(0, (T0 - a2) / (b2 - a2))) : 1; return tj.s[i - 1] + (tj.s[i] - tj.s[i - 1]) * w; };
  effets.push((dt) => { t += dt; if (combat !== c0 || mo.etat !== 'actif') return true; const s = part(Math.min(1, t / D)); mo.x = x0 + (f.x - x0) * s; mo.z = z0 + (f.z - z0) * s; return t >= D; });
  return true;
}
/* le geste d'un sort (le tambour de Tam, la sagaie que Jav arme...) : il le joue, sans bloquer plus que le sort lui-meme */
function gesteSort(mo, fam) { const an = mo.m && mo.m.userData.anim; if (an && an.F[fam] && !mo.geste) geste(mo, fam, false); }
/* d'ou part un tir : la main qui tient l'arme (l'arc dans la main gauche) */
function mainSquelette(mo) { const o = mo.m && mo.m.getObjectByName(mo.d.tirGauche ? 'mixamorigLeftHand' : 'mixamorigRightHand'); return o ? o.getWorldPosition(new T.Vector3()) : null; }
/* sa mort : la chute, puis il s'enfonce dans le sol */
function mortSquelette(mo, dt) {
  const an = mo.m.userData.anim; if (!mo.chute) { mo.chute = { t: 0, d: geste(mo, 'mort', false) || 1.5 }; mo.geste = null; }
  mo.chute.t += dt; an.mixer.update(dt);
  if (mo.chute.t > mo.chute.d + 0.6) { mo.m.position.y -= dt * 1.4; if (mo.chute.t > mo.chute.d + 2.4 && mo.m.parent) jeter(mo.m); }
}
/* le coup de marteau : un coup au hasard (parfois le tourbillon), ses degats a chaque instant ou le marteau arrive en bas, sur une bande du pied du
   monstre jusqu'a la caisse ou autour d'elle (un coup a plusieurs temps partage ses degats) */
function coupMarteau(mo) {
  const an = mo.m.userData.anim, fam = an.F.tourbillon && Math.random() < 0.2 ? 'tourbillon' : 'coup', nom = piocher(an, fam), c0 = combat;
  const d = geste(mo, fam, true, nom), ts = vif(), L = ((mo.m.userData.impacts || {})[nom] || [{ t: d * 0.45 * ts, sol: true }]).map((x) => Object.assign({}, x, { t: x.t / ts })), part = L.length > 1 ? 0.6 : 1; let t = 0, k = 0;
  /* (26/10/2026 : les impacts sont lus en temps du mouvement, ramenes au temps du jeu ; et le geste joue bien le coup tire, pas un autre) */
  mo.cd = Math.max(mo.cd, d + 0.7); /* (un souffle entre deux coups : un enchainement long ne repart pas aussitot) */
  effets.push((dt) => { t += dt;
    while (k < L.length && t >= L[k].t) { const imp = L[k++];
      if (combat !== c0 || c0.fin || mo.etat !== 'actif' || !an.caisse) return true;
      const p = new T.Box3().setFromObject(an.caisse).getCenter(new T.Vector3()), y = mo.m.position.y;
      if (imp.sol) impactMarteau(p.x, y, p.z); else { secousse(0.12, 0.25); onde(p.x, y, p.z, 3.2, '#fff3d6', 0.4, 0.7); poussiere(p.x, y, p.z, 10, 1.2, '#d8c6a0'); }
      const pp = paysanMesh.position, ax = p.x - mo.x, az = p.z - mo.z, L2 = ax * ax + az * az || 1, u = Math.max(0, Math.min(1, ((pp.x - mo.x) * ax + (pp.z - mo.z) * az) / L2));
      if (Math.hypot(pp.x - (mo.x + ax * u), pp.z - (mo.z + az * u)) < 1.6 || Math.hypot(pp.x - p.x, pp.z - p.z) < 2.0) { blesserPerso(Math.max(1, Math.round(mo.deg * part)), mo); effetsCoup(mo); }
    }
    return t >= d || k >= L.length && t > L[L.length - 1].t + 0.1; });
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
function impactMarteau(x, y, z) {
  secousse(0.32, 0.45); flashLumiere(x, y + 0.6, z, '#fff1d0', 3.2, 9, 0.22);
  emettre(FX_LUM, 1, { x, y: y + 0.3, z, vie: [0.12, 0.14], taille: [3.5, 5.5], c: ['#ffffff', '#ffe2a0'], a: 0.85, entree: 0.01 });
  onde(x, y, z, 5.5, '#fff3d6', 0.5, 0.95); onde(x, y, z, 3.6, '#8b6a45', 0.7, 0.55, true);
  solFendu(x, y, z, 3.0, false); poussiere(x, y, z, 18, 1.8, '#d8c6a0'); mottes(x, y, z, 12, 1.4); cratere(x, y, z, 1.15, 4);
}
