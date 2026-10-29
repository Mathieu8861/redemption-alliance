'use strict';
/* ===================== BOUCLE ===================== */
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
let tours = 0; const t0 = performance.now();
/* LA PAUSE : au retour (accueil quitte, onglet de nouveau visible, jeu rouvert, sur ce navigateur ou un autre), toutes les dates de la ferme
   (repas et croissance des Bouftous, pousses, voleurs, raids, cours de l'HDV, vague en preparation, Casino...) sont decalees de la duree de
   la pause : rien n'a bouge entre-temps. Les defis du jour et la reprise des boss suivent le calendrier, eux. Le decalage marche dans les deux
   sens : une ferme jouee en temps accelere sur un autre appareil (horlogeJeu) se recale sur l'horloge d'ici au lieu d'arriver « dans le futur ». */
function reprendreTemps(maintenant) {
  const d = maintenant - S_.vu; if (!d) return;
  if (d > 0 && !combat && S_.perso) { fermeSansToi(maintenant, d); return; } /* (13/10/2026 : une pause ou une absence, la ferme continue de pousser) */
  const decaler = (o) => { for (const k in o) { if (k === 'parties') continue; const v = o[k]; if (typeof v === 'number') { if (v > 1.5e12 && v < 4e12) o[k] = v + d; } else if (v && typeof v === 'object') decaler(v); } }; /* (pas les parties rangees) */
  decaler(S_); S_.vu = maintenant; if (raidAnnonce) raidAnnonce.fin += d;
}
/* LA FERME VIT SANS TOI (13/10/2026, la « recompense du retour » de l'etude du rythme) : pendant une pause ou une absence, les cultures, la laine, les plumes,
   les bebes et la preparation de la vague continuent, 10 h au plus. Rien de dangereux en revanche : Tofus nuisibles, voleurs, raids, crises de l'HDV et
   recouvreurs du Casino attendent ton retour (leurs dates sont decalees, comme pendant l'ancienne pause). Le temps avance par petits pas, pour que la
   mangeoire serve ses repas un par un. Au retour, Pepito resume ce qui a pousse (montrerAbsence). */
/* Puis (« on va se connecter, on va faire 50000 kamas lol », Mathieu) : sans toi, la ferme pousse au rythme d'avant le x20, 20 fois moins vite qu'en jeu
   (VITESSE_ABSENCE) : une nuit de 8 h compte comme 24 min de jeu, une Fraise plantee le soir est mure le matin, un Millet a pousse d'un tiers. 10 h comptent au plus. */
const ABSENCE_MAX = 10 * 3600e3, VITESSE_ABSENCE = 1 / 20; /* (« quand la personne met en pause ou quitte le jeu, le temps sera ralenti de x20 tout simplement », Mathieu, 14/10/2026) */
function fermeSansToi(maintenant, d) {
  const avant = photoFerme(), garde = Math.round(Math.min(d, ABSENCE_MAX) * VITESSE_ABSENCE); /* (le temps qui compte pour la ferme ; le reste est une pause) */
  if (d > garde) { const x = d - garde; const decaler = (o) => { for (const k in o) { if (k === 'parties') continue; const v = o[k]; if (typeof v === 'number') { if (v > 1.5e12 && v < 4e12) o[k] = v + x; } else if (v && typeof v === 'object') decaler(v); } }; decaler(S_); if (raidAnnonce) raidAnnonce.fin += x; } /* (ce qui ne compte pas : comme une pause, toutes les dates avancent d'autant) */
  ['prochainRaid', 'prochainVoleur', 'prochaineCrise'].forEach((k) => { if (S_[k]) S_[k] += garde; });
  if (S_.ardoise && S_.ardoise.prochaine) S_.ardoise.prochaine += garde;
  if (S_.sauvage && S_.sauvage.fin) S_.sauvage.fin += garde;
  S_.cases.forEach((p) => { if (p.tofu) p.tofu += garde; if (p.tofuParti) p.tofuParti += garde; });
  if (raidAnnonce) raidAnnonce.fin += garde;
  const de = S_.vu, pas = Math.max(1000, garde / 300);
  for (let t = de + pas; ; t += pas) { const tt = Math.min(t, maintenant); avancer(tt, false); if (tt >= maintenant) break; }
  S_.vu = maintenant; regenVie(Math.min(d, ABSENCE_MAX) - garde); /* (la vie remonte au rythme normal, pas ralentie : le reste des 10 h) */
  S_.cases.forEach((p) => rendreCase(p.id)); rendreEnclosBulles(); rendreHaut(); sauver();
  const apres = photoFerme(), a = { duree: d, murs: Math.max(0, apres.murs - avant.murs), laine: Math.max(0, apres.laine - avant.laine), plumes: Math.max(0, apres.plumes - avant.plumes) };
  if (d >= 2 * 60000 && (a.murs || a.laine || a.plumes)) { absence = a; setTimeout(montrerAbsence, 600); }
}
function tick() {
  if (enAccueil || enPause || document.hidden) return; /* en pause */
  { const m = Date.now(); if (Math.abs(m - S_.vu) > 4000 * horlogeJeu.vitesse()) reprendreTemps(m); } /* (une boucle toutes les 500 ms : un trou plus long, c'est une pause) */
  const ch = avancer(Date.now(), !combat); /* pendant une vague : pas de Tofu nuisible ni de voleur en plus */
  if (!combat) majVieHaut(); /* (la vie qui remonte doucement, a vue d'oeil) */
  rendreElevage();
  ch.cases.forEach((id) => rendreCase(id));
  if (ch.enclos) rendreEnclosBulles();
  if (ch.sauvage) rendreSauvage();
  if (ch.voleur) lancerVoleur();
  if (ch.raid && !combat) proposerSimu(); /* (une fenetre d'abord : la simu attend l'accord du joueur) */
  if (rechargerSeule()) { rendreGrange(); if (modaleOuverte === 'grange') ouvrirGrange(); } /* l'arbalete se recharge seule a partir du niveau 3 */
  if (raidAnnonce) { if (Date.now() >= raidAnnonce.fin) { if (combat) raidAnnonce.fin = Date.now() + 10000; else lancerRaid(); } else majRaidAnnonce(); }
  if (ch.hdv) { rendreGrange(); if (modaleOuverte === 'hdv') ouvrirHdv(); }
  rendreCasesBulles(); rendreEnclosBulles();
  if (tofusVoliere.length !== S_.tofus) rendreTofusVoliere();
  if (++tours % 10 === 0) { rendreHaut(); rendreObjectif(); sauver(); }
  if (tours % 60 === 1) $('commis').innerHTML = '<b>Pépito :</b> « ' + hasard(niv('epouvantail') >= 5 && Math.random() < 0.5 ? PEPITO_TRON : PEPITO) + ' »';
  surveillerLecons(); /* les lecons de Pepito, au bon moment */
}
/* LE BOUTON PAUSE (« il faudrait un bouton pause aussi », Mathieu, 12/10/2026) : tout s'arrete, combats compris, comme sur l'accueil ou onglet cache ;
   a la reprise, les dates de la ferme sont decalees de la duree de la pause (reprendreTemps) */
let enPause = false;
function mettrePause(oui, sansEcran) { /* (sansEcran : une lecon de Pepito fige le jeu sans afficher l'ecran de pause) */
  oui = !!oui; if (oui === enPause || (oui && (!S_ || !S_.perso || enAccueil)) || (!oui && simuEnAttente)) return; /* (la simu en attente : seul son bouton relance le jeu) */
  enPause = oui; $('ecran-pause').hidden = !oui || !!sansEcran;
  if (audio) { try { if (pauseEcran()) audio.suspend(); else if (sonActif() && !document.hidden) audio.resume(); } catch (e) { /* rien */ } } /* (en pause : plus aucun son, la musique reprend ou elle en etait) */
  if (oui) { if (visee) annulerVisee(); sauver(); } else if (S_) reprendreTemps(Date.now());
}
/* une erreur dans la mise a jour d'une image ne fige plus jamais le jeu (26/10/2026, « l'image est figee », Mathieu) : elle est notee une fois, l'image
   suivante repart */
function erreurBoucle(err) { const m = String(err && err.stack || err).slice(0, 400), L = (window.__erreursBoucle = window.__erreursBoucle || []); if (!L.includes(m) && L.length < 20) { L.push(m); console.error('boucle', err); } }
function boucle(t) {
  const s = (t - t0) / 1000;
  if (enAccueil && !reduit) { angleCam = Math.PI / 4 + (t - departAngle) / 1000 * 0.12; placerCamera(); }
  else if (angleVise != null) { const d = angleVise - angleCam; if (Math.abs(d) < 0.002) { angleCam = angleVise; angleVise = null; } else angleCam += d * 0.18; placerCamera(); } /* (le quart de tour au clavier, en douceur) */
  if (!reduit && !enPause) {
    errer(Math.min(0.05, (t - (boucle.t1 || t)) / 1000), s);
    nuages.forEach((n, k) => { n.position.x += Math.sin(s * 0.2 + k) * 0.002; });
    const dtv = Math.min(0.05, (t - (boucle.t1 || t)) / 1000); /* les Tofus picorent, regardent autour d'eux, font quelques pas (14f-tofus.js) */
    Object.values(casesDyn).forEach((g) => g.children.forEach((o) => { if (o.userData && o.userData.tofu) vieTofu(o, dtv, VIE_CHAMP); }));
    if (marchandMesh) { marchandMesh.rotation.y = (marchandMesh.userData.ry0 !== undefined ? marchandMesh.userData.ry0 : -0.5) + Math.sin(s * 0.45) * 0.3; marchandMesh.position.y = (marchandMesh.userData.y0 || 0) + Math.sin(s * 1.6) * 0.008; } /* il regarde autour de lui */
    animerGelees(Math.min(0.05, (t - (boucle.t1 || t)) / 1000), s);
    tofusVoliere.forEach((o) => vieTofu(o, dtv, VIE_VOLIERE));
    if (sauvageMesh) vieTofu(sauvageMesh, dtv, VIE_SAUVAGE);
  }
  surveillerFluidite((t - (boucle.t1 || t)) / 1000);
  const dtb = Math.min(0.05, (t - (boucle.t1 || t)) / 1000);
  if (!enPause) { try { deplacerVoleur(dtb, s); viserArbalete(dtb, s); majTours(dtb, s); majEpouvantail(dtb, s); animerLeurre(s);
    majCombat(dtb, s); marcher(dtb, s); tenirEpee(); majMeute(s); majPassifs(dtb); animerAttaque(dtb); majEffets(dtb); animerFeux(dtb); animerFumees(s); animerOmeho(dtb, s); majGardien(dtb, s); animerIleBoss(dtb); animerCascade(dtb); }
    catch (err) { erreurBoucle(err); } } boucle.t1 = t; /* (en pause : la scene reste affichee, plus rien ne bouge) */
  vent.mettreAJour(reduit ? 0 : s); dessinerCiel(reduit ? 0 : s);
  boucle.n = (boucle.n || 0) + 1; rendu.shadowMap.needsUpdate = boucle.n % 2 === 0; /* les ombres de ce qui bouge suivent a 30 images par seconde : invisible, et ~3 ms de gagnees par image */
  if (lieu === 'ferme') suivreOmbres();
  majPancartes(dtb); /* (meme en pause : un batiment pose ou refait recoit sa pancarte) */
  if (SECOUSSE.v.lengthSq()) { camera.position.add(SECOUSSE.v); rendu.render(scene, camera); camera.position.sub(SECOUSSE.v); camera.updateMatrixWorld(); } else rendu.render(scene, camera); placerBulles(); /* (la secousse des gros coups : le temps du rendu seulement ; la matrice de la camera est remise d'aplomb, sinon les clics et la visee partaient de la vue secouee, 22b-effets.js) */ placerBarresBat(); requestAnimationFrame(boucle);
}
/* PLUSIEURS PARTIES (13/10/2026, « qu'un joueur puisse avoir plusieurs parties, la j'ai celle de l'Osa, si je veux faire une partie Iop que je ne sois pas
   oblige de supprimer celle de l'Osa ; limite a 3 pour le moment », Mathieu) : la partie en cours EST la sauvegarde ; les autres y sont rangees
   (S_.parties = { 2: {...}, 3: {...} }, S_.emplacement = le numero de celle en cours). Une seule sauvegarde, ici et en ligne, rien de change dans la base
   (environ 20 Ko par partie). Changer de partie se fait depuis l'accueil : la sauvegarde est ecrite, la page se recharge et lance la partie choisie. */
const MAX_PARTIES = 3;
const sansParties = (e) => { const x = Object.assign({}, e); delete x.parties; delete x.emplacement; return x; };
function ecrirePartie(etat, lancerApres) { S_ = etat; try { localStorage.setItem(CLE, JSON.stringify(etat)); if (lancerApres) sessionStorage.setItem('ferme-lancer', '1'); } catch (err) { /* rien */ } nuageMarquer(); location.reload(); }
function prendrePartie(sauve, k) { /* la partie k devient celle en cours, celle en cours est rangee */
  const actif = sauve.emplacement || 1, autres = Object.assign({}, sauve.parties || {}); autres[actif] = sansParties(sauve);
  const nv = Object.assign({}, autres[k]); delete autres[k]; nv.parties = autres; nv.emplacement = k; return nv;
}
function sansPartieActive(sauve) { /* effacer la partie en cours : la premiere des autres prend sa place (null s'il n'y en a pas) */
  const autres = Object.assign({}, sauve.parties || {}), ks = Object.keys(autres).map(Number).filter((k) => autres[k] && autres[k].perso).sort((a, b) => a - b); if (!ks.length) return null;
  const nv = Object.assign({}, autres[ks[0]]); delete autres[ks[0]]; nv.parties = autres; nv.emplacement = ks[0]; return nv;
}
/* LES PARTIES MONTRENT LE PERSO HABILLE (23/10/2026, « tu penses y'a moyen que ca affiche ton personnage avec tes equipements etc de visible comme en jeu ? », Mathieu) :
   le portrait de la fiche perso, rendu pour chaque partie (sa classe, son apparence, sa coiffe, sa cape, son arme) ; l'icone de la classe reste le temps du rendu.
   Le temps de fabriquer le modele, la partie a montrer devient la partie en cours (tout ce qui habille le perso lit S_), puis on la rend */
/* (23/10/2026, « ils sont tous un peu decales, pas au centre du socle ; on dirait qu'ils sont sur la pointe des pieds ; le Cra est plus petit que les autres »,
   Mathieu) : la camera se cale sur le CORPS (sans chapeau, coiffe, cape ni arme), toujours a la meme echelle ; l'image est recadree de facon symetrique autour
   du corps : son milieu est le milieu du perso, son bas les semelles. Le corps fait toujours PORTRAIT_HEROS.corps de la hauteur rendue */
let herosR = null; const PORTRAIT_HEROS = { w: 360, h: 460, corps: 0.56 };
async function portraitDePartie(e) {
  const eq = e.equip || {}, m = modeleDe(e.perso.classe, e.perso.look, e.perso.sexe === 'f' ? 'f' : 'm');
  await assurerLook(m); if (eq.coiffe || eq.cape || eq.arme) await assurerVisuels();
  const S0 = S_; S_ = e.equip ? e : Object.assign({}, e, { equip: {} }); let g;
  try { g = paysan(0, 0, 0, e.perso.classe); } finally { S_ = S0; }
  scene.remove(g); g.rotation.set(0, 0, 0); g.traverse((o) => { if ((o.userData && o.userData.ombre) || o.material === OMBRE_PIEDS) o.visible = false; }); g.updateMatrixWorld(true);
  const eqG = g.getObjectByName('equipement_porte'), porte = (o) => { for (let x = o; x; x = x.parent) if (x === eqG || P_CHAPEAU.test(nomP(x)) || P_DOS.test(nomP(x))) return true; return false; };
  const bb = new T.Box3(); g.traverse((o) => { if (o.isMesh && o.geometry && !(o.material && o.material.side === T.BackSide) && !porte(o)) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bb.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
  const c = bb.getCenter(new T.Vector3()), hb = Math.max(0.1, bb.max.y - bb.min.y), W = PORTRAIT_HEROS.w, H = PORTRAIT_HEROS.h;
  if (!herosR) { herosR = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); herosR.setPixelRatio(1); herosR.setSize(W, H); herosR.setClearColor(0x000000, 0); herosR.outputEncoding = rendu.outputEncoding; }
  const sc = new T.Scene(); sc.add(new T.HemisphereLight('#fff8ec', '#9db7cf', 0.75)); const d = new T.DirectionalLight('#fff3dc', 0.85); d.position.set(3, 6, 8); sc.add(d); sc.add(g);
  const cam = new T.PerspectiveCamera(24, W / H, 0.05, 50), dist = hb / PORTRAIT_HEROS.corps / (2 * Math.tan(12 * Math.PI / 180));
  cam.position.copy(c).add(new T.Vector3(Math.sin(0.4), 0.12, Math.cos(0.4)).normalize().multiplyScalar(dist)); cam.lookAt(c);
  herosR.render(sc, cam); const src = herosR.domElement.toDataURL('image/png'); sc.remove(g);
  return rognerPortrait(src, true);
}
function rognerPortrait(src, symetrique) { /* l'image recadree sur le perso (sans le vide autour) : ses pieds touchent le bas de l'image, et donc son socle ; symetrique : autant de vide coupe a gauche qu'a droite, le milieu reste le milieu du corps */
  return new Promise((ok) => { const im = new Image(); im.onerror = () => ok(src); im.onload = () => {
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1; for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 8) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { ok(src); return; } if (symetrique) { const mg = Math.min(x0, c.width - 1 - x1); x0 = mg; x1 = c.width - 1 - mg; } const r = document.createElement('canvas'); r.width = x1 - x0 + 1; r.height = y1 - y0 + 1; r.getContext('2d').drawImage(c, x0, y0, r.width, r.height, 0, 0, r.width, r.height); ok(r.toDataURL('image/png')); }; im.src = src; });
}
/* L'ECRAN « TES PARTIES » DE NUIT (23/10/2026, « je veux un truc qui claque de fou » puis « je prefere le mode nuit, j'en ai marre du blanc », Mathieu) :
   une carte de heros par partie, sous un ciel etoile un peu transparent (l'ile tourne derriere), le perso pose sur son ilot aux couleurs de sa classe */
const ECHELLE_HEROS = 128 / (460 * 0.56); /* (le corps fait 128 px de haut sur la carte, quelle que soit la classe) */
const COUL_CLASSE = { iop: ['#d9443a', '#ffb347'], cra: ['#4f9a2c', '#c4ea6a'], osa: ['#2b8c9e', '#9ff0dc'] };
/* le decor vit (23/10/2026, « des petites animations dans le fond », Mathieu) : des braises qui montent chez le Iop, des feuilles qui tombent chez le Cra,
   des etincelles de magie chez l'Osamodas ; en CSS, rien a telecharger */
const PARTICULES_HEROS = (classe) => '<span class="parts parts-' + classe + '">' + [8, 22, 35, 49, 61, 74, 88, 15, 67].map((x, k) => '<i style="left:' + x + '%;animation-delay:' + (-k * 0.73).toFixed(2) + 's;animation-duration:' + (4.2 + (k * 37 % 5) * 0.6).toFixed(1) + 's"></i>').join('') + '</span>';
function ouvrirAccueil() {
  const sauve = charger();
  let classe = (sauve && sauve.perso && sauve.perso.classe) || 'cra', look = (sauve && sauve.perso && sauve.perso.look) || 'classique', sexe = (sauve && sauve.perso && sauve.perso.sexe) || 'm';
  const carte = document.getElementById('accueil-carte');
  if (ENLIGNE && !enLigneSv.compte && enLigneSv.refus !== 'hors ligne') { ecranConnexion(carte); return; } /* beta fermee : il faut un compte */
  { let go = false; try { go = sessionStorage.getItem('ferme-lancer') === '1'; sessionStorage.removeItem('ferme-lancer'); } catch (err) { /* rien */ } if (go && sauve && sauve.perso) { lancer(sauve); return; } } /* (on vient de choisir une partie) */
  const actif = (sauve && sauve.emplacement) || 1; let creer = null; /* creer : l'emplacement d'une nouvelle partie */
  const partieDe = (k) => (k === actif ? (sauve && sauve.perso ? sauve : null) : (sauve && sauve.parties && sauve.parties[k] && sauve.parties[k].perso ? sauve.parties[k] : null));
  const ligneP = (k) => { const e = partieDe(k); if (!e) return '<div class="heros vide"><div class="scene"><span class="plus">+</span></div><div class="cl">Emplacement ' + k + ' libre</div><button class="btn" data-creer="' + k + '">Nouvelle partie</button></div>';
    const cl = CLASSES.find((c) => c.id === e.perso.classe), vg = Math.max(0, ((e.vague && e.vague.num) || 1) - 1), co = COUL_CLASSE[e.perso.classe] || COUL_CLASSE.iop;
    const ico0 = e.perso.sexe === 'f' ? 'feminin-' + e.perso.classe : e.perso.classe === 'iop' && e.perso.look && e.perso.look !== 'classique' ? 'iop-look-' + e.perso.look : e.perso.classe;
    const look = e.perso.classe === 'iop' && e.perso.sexe !== 'f' && e.perso.look && e.perso.look !== 'classique' ? (LOOKS_IOP.find((l) => l[0] === e.perso.look) || [])[1] : '';
    return '<div class="heros' + (k === actif ? ' actif choisie' : '') + '" data-carte="' + k + '" tabindex="0" style="--c1:' + co[0] + ';--c2:' + co[1] + '">' + (k === actif ? '<span class="encours">En cours</span>' : '') +
      '<button class="partie-suppr" data-suppr="' + k + '" aria-label="Supprimer cette partie" title="Supprimer cette partie">✕</button>' +
      '<div class="scene"><span class="fond" style="background-image:url(assets/icones/fond-heros-' + (COUL_CLASSE[e.perso.classe] ? e.perso.classe : 'iop') + '.jpg?v=' + VERSION_MODELES + ')"></span>' + PARTICULES_HEROS(COUL_CLASSE[e.perso.classe] ? e.perso.classe : 'iop') + '<span class="ombre-pieds"></span><img class="perso" data-portrait="' + k + '" src="assets/icones/' + ico0 + '.png?v=' + VERSION_MODELES + '" alt=""><span class="niv"><small>NIV</small>' + niveau(e.xp) + '</span></div>' +
      '<div class="nom">' + echapper(e.perso.nom) + '</div><div class="cl">' + (cl ? cl.nom : '') + (look ? ' · ' + look : '') + '</div>' +
      '<div class="stats">' + (vg ? '<span class="pil">Vague ' + vg + '</span>' : '') + '<span class="pil">' + fmt(e.kamas) + ' kamas</span></div>' +
      '<button class="btn kamas" data-jouer="' + k + '">' + (k === actif ? 'Reprendre' : 'Jouer') + '</button></div>'; };
  const rendre = () => {
    const choix = !!(sauve && sauve.perso && creer == null); carte.classList.toggle('nuit', choix); /* (le ciel de nuit : l'ecran des parties seulement) */
    if (choix) { carte.innerHTML = '<h1>Ferme d\'Incarnam</h1>' + bandeauCompte() + '<p class="parties-titre">Tes parties (' + MAX_PARTIES + ' au plus)</p><div class="heros-grille">' + [1, 2, 3].map(ligneP).join('') + '</div>';
      carte.querySelectorAll('img[data-portrait]').forEach((im) => { const e = partieDe(+im.dataset.portrait); if (e) portraitDePartie(e).then((src) => { if (!src || !im.isConnected) return; const n = new Image(); n.onload = () => { if (!im.isConnected) return; im.style.width = (n.naturalWidth * ECHELLE_HEROS).toFixed(1) + 'px'; im.src = src; im.classList.add('rendu'); }; n.src = src; }).catch(() => {}); });
      return; }
    carte.innerHTML = '<h1>Ferme d\'Incarnam</h1>' + bandeauCompte() + (creer != null ? '' : '<p>Une île de 40 cases dans le ciel d\'Incarnam. Cultive, élève des Bouftous, vends à l\'HDV, et défends ta ferme contre les Tofus et les vagues qui viendront.</p>') + /* (la presentation : seulement pour une premiere ferme) */
      (creer != null ? '<button class="retour-parties" data-retour-parties>← Mes parties</button><p class="parties-titre">Nouvelle partie, emplacement ' + creer + '</p>' : '') +
      ('<div class="nom-sexe"><input id="perso-nom" maxlength="16" placeholder="Ton nom de fermier" value="' + echapper(creer != null ? '' : (sauve && sauve.perso && sauve.perso.nom) || (enLigneSv.pseudo || '').slice(0, 16)) + '"><div class="sexes" role="group" aria-label="Version de ton personnage"><button class="sexe" data-sexe="m" aria-pressed="' + (sexe === 'm') + '">Masculin</button><button class="sexe" data-sexe="f" aria-pressed="' + (sexe === 'f') + '">Féminin</button></div></div><p class="choix-classe">Choisis ton personnage. À la ferme, ils font tous pareil : la classe change seulement ta façon de te battre quand les monstres attaquent. <button class="lien" data-comparer>Comparer les trois classes</button></p><div class="classes">' + CLASSES.slice().sort((x, y) => x.rang - y.rang).map((c) => '<button class="classe" data-classe="' + c.id + '" aria-pressed="' + (classe === c.id) + '"><span class="ico"><img src="assets/icones/' + (sexe === 'f' ? 'feminin-' : '') + c.id + '.png?v=' + VERSION_MODELES + '" alt=""></span><b>' + c.nom + '</b><span class="etiquettes"><i>' + c.role + '</i><i class="' + c.niveau[1] + '">' + c.niveau[0] + '</i></span>' + (() => { const P = progressionClasse(c.id); return '<span class="chiffres"><span>' + picto('vita') + P.pv1 + ' PV <b>+' + P.pvN + '</b>/niv</span><span>' + picto('degats') + P.deg1 + ' dégâts <b>+' + virgule(P.degN) + '</b>/niv</span></span>'; })() + c.lignes.map((t, i) => '<span class="ligne' + (i ? ' l2' : '') + '">' + t + '</span>').join('') + '<span class="sort"><em>Son sort, ' + c.sort + ' :</em> ' + c.sortTxt + '<br><em>Passif de classe :</em> ' + (enBref(c.id).passif || 'aucun pour l\'instant') + '</span></button>').join('') + '</div>' +
      (classe === 'iop' && sexe === 'm' ? '<div class="looks"><p>Ton Iop : choisis son apparence</p><div class="looks-grille">' + LOOKS_IOP.map(([id, nom]) => '<button class="look" data-look="' + id + '" aria-pressed="' + (look === id) + '"><img src="assets/icones/iop-look-' + id + '.png?v=' + VERSION_MODELES + '" alt=""><b>' + nom + '</b></button>').join('') + '</div></div>' : '') +
      '<button class="btn grand" data-commencer>Commencer</button>');
  };
  rendre();
  /* (23/10/2026, « si on clique sur la carte sans cliquer sur jouer, que ca la selectionne, que ca reste », Mathieu) */
  const choisirCarte = (h) => { carte.querySelectorAll('.heros.choisie').forEach((x) => x.classList.remove('choisie')); h.classList.add('choisie'); };
  carte.ondblclick = (e) => { const h = e.target.closest('.heros[data-carte]'); if (h && !e.target.closest('button')) { const j = h.querySelector('[data-jouer]'); if (j) j.click(); } };
  carte.onkeydown = (e) => { if (e.key !== 'Enter' || e.target.closest('input')) return; const j = carte.querySelector('.heros.choisie [data-jouer]'); if (j) j.click(); };
  carte.onclick = (e) => {
    const b = e.target.closest('button'); if (!b) { const h = e.target.closest('.heros[data-carte]'); if (h) choisirCarte(h); return; }
    if (b.hasAttribute('data-deconnexion')) { deconnecter(); return; }
    if (b.hasAttribute('data-comparer')) { const k = document.createElement('div'); k.className = 'fc-calque'; k.innerHTML = '<div class="fc-calque-tete"><b>Les trois classes, sans équipement</b><button class="fp-fermer" data-fermer-comparer aria-label="Fermer">✕</button></div>' + comparaisonClasses(classe); carte.appendChild(k); return; } /* (par-dessus l'ecran : il ne pousse rien, l'ecran tient toujours sans defiler) */
    if (b.hasAttribute('data-fermer-comparer')) { const k = carte.querySelector('.fc-calque'); if (k) k.remove(); return; }
    if (b.dataset.classe || b.dataset.look || b.dataset.sexe) { if (b.dataset.classe) classe = b.dataset.classe; if (b.dataset.look) look = b.dataset.look; if (b.dataset.sexe) sexe = b.dataset.sexe; const nom = document.getElementById('perso-nom').value; rendre(); document.getElementById('perso-nom').value = nom; }
    else if (b.hasAttribute('data-reprendre')) lancer(sauve);
    else if (b.dataset.jouer) { const k = +b.dataset.jouer; if (k === actif) lancer(sauve); else ecrirePartie(prendrePartie(sauve, k), true); }
    else if (b.dataset.creer) { creer = +b.dataset.creer; classe = 'cra'; look = 'classique'; sexe = 'm'; rendre(); const n = document.getElementById('perso-nom'); if (n) n.focus(); }
    else if (b.hasAttribute('data-retour-parties')) { creer = null; rendre(); }
    else if (b.dataset.suppr) { const k = +b.dataset.suppr, e = partieDe(k); if (!e) return; const cl = CLASSES.find((c) => c.id === e.perso.classe), autres = Object.keys((sauve && sauve.parties) || {}).length + (k === actif ? 0 : 1);
      carte.innerHTML = '<h1>Ferme d\'Incarnam</h1><div class="confirme"><div class="gros" style="background:#3d2624"><img src="assets/icones/grange.png" alt=""></div><p><b>Supprimer cette partie ?</b><br>La ferme de ' + echapper(e.perso.nom) + ' (' + (cl ? cl.nom + ', ' : '') + 'Paysan niveau ' + niveau(e.xp) + ', ' + fmt(e.kamas) + ' kamas) sera effacée' + (ENLIGNE && enLigneSv.compte ? ', ici et en ligne' : '') + ', pour de bon.' + (autres > 1 || (k === actif && autres) ? ' Tes autres parties ne bougent pas.' : '') + '</p><div class="boutons"><button class="btn discret" data-garder>Garder</button><button class="btn" data-suppr-ok="' + k + '" style="background:var(--rouge);color:#fff">Supprimer</button></div></div>'; }
    else if (b.dataset.supprOk) { const k = +b.dataset.supprOk;
      if (k !== actif) { const nv = Object.assign({}, sauve); nv.parties = Object.assign({}, sauve.parties || {}); delete nv.parties[k]; ecrirePartie(nv, false); return; }
      const nv = sansPartieActive(sauve); if (nv) { ecrirePartie(nv, false); return; }
      enLigneSv.ecraser = !!enLigneSv.compte; enLigneSv.sale = false; sauverMeta(); localStorage.removeItem(CLE); location.reload(); }
    else if (b.hasAttribute('data-nouvelle')) { /* plus la fenetre grise du navigateur (capture de Mathieu, 11/10/2026) : la confirmation aux couleurs du jeu, dans la carte */
      const cl = CLASSES.find((c) => c.id === sauve.perso.classe);
      carte.innerHTML = '<h1>Ferme d\'Incarnam</h1><div class="confirme"><div class="gros" style="background:#3d2624"><img src="assets/icones/grange.png" alt=""></div><p><b>Recommencer une ferme ?</b><br>La ferme de ' + echapper(sauve.perso.nom) + ' (' + (cl ? cl.nom + ', ' : '') + 'Paysan niveau ' + niveau(sauve.xp) + ', ' + fmt(sauve.kamas) + ' kamas) sera effacée' + (ENLIGNE && enLigneSv.compte ? ', ici et en ligne' : '') + ', pour de bon.</p><div class="boutons"><button class="btn discret" data-garder>Garder ma ferme</button><button class="btn" data-effacer style="background:var(--rouge);color:#fff">Tout effacer</button></div></div>';
    }
    else if (b.hasAttribute('data-garder')) rendre();
    else if (b.hasAttribute('data-effacer')) { enLigneSv.ecraser = !!enLigneSv.compte; enLigneSv.sale = false; sauverMeta(); localStorage.removeItem(CLE); location.reload(); }
    else if (b.hasAttribute('data-commencer')) {
      const nom = (document.getElementById('perso-nom').value || '').trim();
      if (nom.length < 2) { document.getElementById('perso-nom').focus(); document.getElementById('perso-nom').placeholder = 'Il faut un nom (2 lettres au moins)'; return; }
      if (creer != null && sauve && sauve.perso) { /* une nouvelle partie a cote des autres : celle en cours est rangee */
        const e0 = etatInitial(); e0.perso = { nom, classe, niveau: 1, xp: 0 }; if (classe === 'iop') e0.perso.look = look; if (sexe === 'f') e0.perso.sexe = 'f';
        const autres = Object.assign({}, sauve.parties || {}); autres[actif] = sansParties(sauve); delete autres[creer]; e0.parties = autres; e0.emplacement = creer; ecrirePartie(e0, true); return;
      }
      const e0 = sauve || etatInitial(); e0.perso = { nom, classe, niveau: 1, xp: 0 }; if (classe === 'iop') e0.perso.look = look; if (sexe === 'f') e0.perso.sexe = 'f'; lancer(e0);
    }
  };
}
/* les cases du depart (92), dont celle de la montgolfiere */
function casesDepart() { return ILE.depart.map(([i, j]) => ({ id: idCase(i, j), i, j, terrain: 'main', type: i === MONTGOLFIERE_CASE[0] && j === MONTGOLFIERE_CASE[1] ? 'montgolfiere' : 'libre' })); }
function completerTerrains() {
  migrerIleRonde(S_); invaliderIndex();
  { const L = LEGENDAIRES.find((x) => x.cle === 'wa'), nv = L && idLeg(L, (S_.perso && S_.perso.classe) || 'iop'); /* (la Couronne du Wa Wabbit est devenue une arme, 14/10/2026) */
    if (nv && S_.sac && S_.sac['leg-wa']) { S_.sac[nv] = (S_.sac[nv] || 0) + S_.sac['leg-wa']; delete S_.sac['leg-wa']; }
    if (nv && S_.equip && S_.equip.coiffe === 'leg-wa') { delete S_.equip.coiffe; S_.sac = S_.sac || {}; S_.sac[nv] = (S_.sac[nv] || 0) + 1; } }
  const ids = new Set(S_.cases.map((c) => c.id)), ajouter = (c) => { if (!ids.has(c.id)) { S_.cases.push(c); ids.add(c.id); } };
  casesDepart().forEach(ajouter);
  TERRAINS.forEach((t) => { if (S_.terrains[t.id]) t.cases.forEach(([i, j]) => ajouter({ id: idCase(i, j), i, j, terrain: 'main', type: 'libre' })); });
  if (S_.sauvage && !ids.has(S_.sauvage.id)) S_.sauvage = null;
  if (!S_.cases.some((c) => c.type === 'montgolfiere')) { const x0 = (MONTGOLFIERE_CASE[0] - (COLS - 1) / 2) * S, z0 = (MONTGOLFIERE_CASE[1] - (ROWS - 1) / 2) * S;
    const c = S_.cases.filter((c) => c.type === 'libre' && codeIle(c.i, c.j) === '.' && !(S_.sauvage && S_.sauvage.id === c.id)).sort((a, b) => Math.hypot(cx(a.i) - x0, cz(a.j) - z0) - Math.hypot(cx(b.i) - x0, cz(b.j) - z0))[0]; if (c) c.type = 'montgolfiere'; }
  invaliderIndex();
}
/* L'ILE RONDE, les anciennes sauvegardes (14/10/2026) : la ferme 8 x 5 et sa bordure restent ou elles sont (elles font partie du depart) ; les N terrains achetes
   deviennent les N premiers terrains de l'ile ronde (plus grands, aux memes prix) ; ce qui etait pose dessus (champs et leurs cultures, enclos, batiments, tours,
   decorations) est repose sur une case libre de la ferme, au plus pres de son ancienne place. Les arbres et les pieces de l'ancienne ile (rochers, lanternes de
   l'escalier) deviennent des decorations ordinaires : sur leur case, ou dans « Mes decorations » s'ils n'en avaient pas. Une seule fois (e.ileRonde). */
function migrerIleRonde(e) {
  if (!e || e.ileRonde) return; e.ileRonde = 1;
  const vieux = e.cases.filter((c) => c.terrain !== 'main'); e.cases = e.cases.filter((c) => c.terrain === 'main');
  const n = Object.keys(e.terrains || {}).filter((id) => ANCIENS_TERRAINS[id] && e.terrains[id]).length;
  e.terrains = {}; TERRAINS.slice(0, n).forEach((t) => { e.terrains[t.id] = true; });
  e.cases.forEach((c) => { if (c.type === 'chemin') c.type = 'libre'; });
  const ids = new Set(e.cases.map((c) => c.id)), ajouter = (c) => { if (!ids.has(c.id)) { e.cases.push(c); ids.add(c.id); } };
  casesDepart().forEach(ajouter); TERRAINS.slice(0, n).forEach((t) => t.cases.forEach(([i, j]) => ajouter({ id: idCase(i, j), i, j, terrain: 'main', type: 'libre' })));
  /* les arbres de l'ancienne ile (arbre_0 a arbre_7, blender/iles.py version 7) : leur genre, dans l'ordre ou ils y etaient plantes */
  const GENRES = ['arbre_rond', 'pommier', 'sapin', 'sapin', 'arbre_rond', 'sapin', 'arbre_rond', 'arbre_rond'], genreDe = (nom) => GENRES[+String(nom || '').replace(/\D/g, '')] || 'arbre_rond';
  const decos = e.decos = e.decos || {}, stock = (k) => { decos[k] = (decos[k] || 0) + 1; };
  Object.entries(e.arbres || {}).forEach(([nom, st]) => { if (!st || st.range) return; const c = st.cell && (e.cases.find((x) => x.id === st.cell) || vieux.find((x) => x.id === st.cell)); if (!c || c.type !== 'arbre') stock(genreDe(nom)); });
  e.arbres = {};
  e.cases.concat(vieux).forEach((c) => {
    if (c.type === 'arbre') { Object.assign(c, { type: 'deco', deco: genreDe(c.arbre), rotD: c.rotD || 0 }); delete c.arbre; }
    if (c.type === 'deco') { delete c.ile; delete c.orig; }
  });
  Object.keys(e.ileLibre || {}).forEach((k) => { if (e.ileLibre[k]) stock('lanterne'); }); e.ileLibre = {};
  /* ce qui etait sur les anciens terrains */
  const par = new Map(e.cases.map((c) => [c.i + '_' + c.j, c])), libre = (i, j) => { const c = par.get(i + '_' + j); return c && c.type === 'libre' && !(e.sauvage && e.sauvage.id === c.id) ? c : null; };
  const avant = (t, i, j) => { const A = ANCIENS_TERRAINS[t] || { cols: 1, rows: 1, ox: 0, oz: 0 }; return { x: A.ox + (i - (A.cols - 1) / 2) * S, z: A.oz + (j - (A.rows - 1) / 2) * S }; };
  const BLOCS = ['grange', 'hdv', 'enclos', 'voliere', 'geliere'], groupes = [];
  BLOCS.forEach((ty) => { const L = vieux.filter((c) => c.type === ty); if (L.length) groupes.push(L); });
  vieux.forEach((c) => { if (c.type !== 'libre' && !BLOCS.includes(c.type)) groupes.push([c]); });
  const perdus = [];
  groupes.forEach((L) => {
    const i0 = Math.min(...L.map((c) => c.i)), j0 = Math.min(...L.map((c) => c.j)), forme = L.map((c) => [c.i - i0, c.j - j0, c]), p0 = avant(L[0].terrain, i0, j0);
    let best = null, bd = Infinity;
    e.cases.forEach((a) => { if (!forme.every(([di, dj]) => libre(a.i + di, a.j + dj))) return; const d = Math.hypot(cx(a.i) - p0.x, cz(a.j) - p0.z); if (d < bd) { bd = d; best = a; } });
    if (!best) { perdus.push(L); return; }
    forme.forEach(([di, dj, v]) => { const c = libre(best.i + di, best.j + dj), copie = Object.assign({}, v); ['id', 'i', 'j', 'terrain'].forEach((k) => { delete copie[k]; }); Object.assign(c, copie);
      if (v.type === 'tour' && e.bats && e.bats['tour:' + v.id]) { e.bats['tour:' + c.id] = e.bats['tour:' + v.id]; delete e.bats['tour:' + v.id]; } });
  });
  perdus.forEach((L) => { if (L[0].type === 'deco') stock(L[0].deco); }); /* (ne devrait pas arriver : l'ile ronde a toujours plus de place) */
  if (e.sauvage && !e.cases.some((c) => c.id === e.sauvage.id)) e.sauvage = null;
  if (e.perso) e.migreIleRonde = { terrains: n, replaces: groupes.length - perdus.length, perdus: perdus.length }; /* (pour le message d'accueil, seulement a une vraie ferme d'avant) */
}
