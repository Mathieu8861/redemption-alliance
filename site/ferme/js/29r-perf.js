'use strict';
/* LES PERFORMANCES (22/11/2026, « analyse tout et ameliore, si on lag maintenant on pourra jamais ameliorer sur des trucs plus chauds », puis « y a-t-il des
   ameliorations qui ne degradent pas la qualite ni le gameplay ? » ; « ok » pour les trois sans perte, Mathieu). Mesures sur la ferme de Madazezette avec
   une vraie carte graphique (traces/chargement/plans-perf*.js, outils/banc/apercu.mjs avec APERCU_GPU=1) : 60 images/s sur la ferme tout juste, 42 en vague ;
   le rendu est le goulot (2 800 appels de dessin), et les a-coups ressentis comme du lag tombent quand les monstres arrivent : la premiere fois qu'un type de
   monstre ou un effet s'affiche, ses textures et ses matieres partent vers la carte graphique en plein combat (jusqu'a 77 ms d'un coup, 34 ms au premier
   tir du Libeclair).
   1. LE PRECHAUFFAGE DE LA VAGUE : au lancement, un exemplaire de chaque monstre attendu (renforts, invocations et temps d'une vague de boss compris) et les
      effets du Libeclair sont dessines une fois hors de l'ecran, dans une petite image a part : leurs textures, leurs squelettes et leurs matieres sont prets
      quand les vrais arrivent. L'attente passe au lancement (le moment « les monstres arrivent »), plus en plein combat. Rien ne change a l'image. */
function typesDeVague(n) {
  const T0 = new Set(); try { compoTotale(n).forEach(([t]) => T0.add(t)); } catch (e) { /* rien */ }
  try { (PHASES_BOSS[n] || []).forEach((p) => p.L.forEach(([t]) => T0.add(t))); } catch (e) { /* rien */ }
  [...T0].forEach((t) => { const M = MONSTRES[t]; if (!M) return; [].concat(M.renforts ? [M.renforts[0]] : [], M.renfortsRage ? [M.renfortsRage[0]] : [], M.invoque ? M.invoque.types || [] : [], M.affaibli ? [M.affaibli.invoque] : [], M.enracine ? (M.enracine.types || []) : []).forEach((x) => { if (MONSTRES[x]) T0.add(x); }); });
  return [...T0];
}
function prechaufferVague(types) {
  if (typeof rendu === 'undefined' || !rendu || !camera) return 0; const t0 = performance.now(), g = new T.Group(), noms = new Set();
  types.forEach((t) => { const d = MONSTRES[t]; if (!d) return;
    if (d.fabrique) { try { g.add(d.fabrique()); } catch (e) { /* rien */ } return; }
    [d.modele, d.modele + '-v2'].forEach((nm) => { if (MODELES[nm] && !noms.has(nm)) { noms.add(nm); try { g.add(cloner(nm)); } catch (e) { /* rien */ } } }); });
  if (types.includes('libeclair') && typeof orbeFoudre === 'function') { try { g.add(orbeFoudre()); if (typeof spriteEclair === 'function') g.add(spriteEclair(1, 0.3)); } catch (e) { /* rien */ } }
  if (!g.children.length) return 0;
  const dir = new T.Vector3(); camera.getWorldDirection(dir); g.position.copy(camera.position).addScaledVector(dir, 10); g.children.forEach((o, i) => { o.position.set((i % 6) * 1.5 - 4, 0, Math.floor(i / 6) * 1.5); });
  scene.add(g); g.updateMatrixWorld(true);
  const rt = new T.WebGLRenderTarget(96, 96), avant = rendu.getRenderTarget();
  try { rendu.compile(scene, camera); rendu.setRenderTarget(rt); rendu.render(scene, camera); } catch (e) { /* rien */ } finally { rendu.setRenderTarget(avant); scene.remove(g); rt.dispose(); }
  g.traverse((o) => { const an = o.userData && o.userData.anim; if (an && an.mixer) an.mixer.stopAllAction(); });
  return Math.round(performance.now() - t0);
}
{ const lancerVagueP = lancerVague; lancerVague = function () {
    const avant = combat, r = lancerVagueP.apply(this, arguments);
    if (combat && combat !== avant && combat.genre === 'vague' && !window.__sansPrechauffage) { /* (__sansPrechauffage : pour les mesures avant / apres) */ try { combat.prechauffe = prechaufferVague(typesDeVague(combat.n)); } catch (e) { /* (le jeu continue sans) */ } }
    return r; }; }
