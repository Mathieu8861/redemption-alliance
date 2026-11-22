'use strict';
/* L'EVEIL DES LEGENDAIRES ET LE CONCASSEUR (18/11/2026, Mathieu : « quelque chose qui permet de faire lvl up un item légendaire en utilisant un autre item
   légendaire (qu'on détruit) », puis « et qu'on puisse concasser des items aussi pour gagner des runes » ; règles au formulaire) :
   - L'EVEIL : on sacrifie un doublon exact du légendaire (même pièce, même boss, même emplacement). Chaque fusion lui donne 10 niveaux et le fait passer au
     palier suivant : la coiffe du Craqueleur Légendaire (niveau 40) passe au niveau 50, avec les stats d'une coiffe du palier de Crocabulia, puis du Wa
     Wabbit, etc. Elle garde ses lignes de stats, proportionnées au palier atteint (et son jet), sans dépasser le dernier palier ouvert (aujourd'hui le 10,
     niveau 100, celui des légendaires du Chêne Mou). S_.eveils : { exemplaire: nombre de fusions } ; obj() applique l'éveil (03-equipements.js).
   - LE CONCASSEUR : une pièce de niveau 60 ou plus se détruit contre des runes. Normale : 1 chance sur 40 d'une rune de forgemagie, 1 sur 100 d'une rune
     parfaite. Rare : une rune de forgemagie à coup sûr, et 1 chance sur 5 d'une parfaite. Les légendaires ne se concassent pas (elles servent à l'éveil).
   - OU : de nouveaux bâtiments débloqués au niveau 100 (à concevoir) ; en attendant, en version dev, depuis l'atelier de forgemagie, dans le mode test. */
const NIV_EVEIL = 100, NIV_CONCASSE = 60;
/* leurs batiments (blender/eveil-concasseur.py, 18/11/2026) : le modele ne se charge que si l'un d'eux est pose, pour ne pas alourdir le chargement de tous */
let chargeEC = null;
function assurerEveilConcasseur() {
  if (chargeEC) return chargeEC;
  chargeEC = chargerGlb('assets/modeles/jeu/eveil-concasseur.glb?v=' + VERSION_MODELES).then((G) => { versToon(G, { normales: 0.012, sansContour: SC_BATI });
    MODELES.eveil = gabaritEchelle(G, 'Eveil', 1, new T.Vector3(0, 0, 0)); MODELES.concasseur = gabaritEchelle(G, 'Concasseur', 1, new T.Vector3(0, 0, 0));
    const n = G.getObjectByName('EveilCouronne'); if (n) { const y0 = new T.Box3().setFromObject(n).min.y, c = gabaritEchelle(G, 'EveilCouronne', 1, new T.Vector3(0, 0, 0)), w = new T.Group(); c.position.y += y0; w.add(c); MODELES.eveilCouronne = w; } /* (la couronne a sa hauteur : gabaritEchelle la pose au sol) */
    construireBatiments(); }).catch(() => { chargeEC = null; });
  return chargeEC;
}
const CONCASSE = { normale: { forge: 1 / 40, parfaite: 1 / 100 }, rare: { forge: 1, parfaite: 1 / 5 } };
const eveilDev = () => !!MODE_TEST; /* (version dev : seulement dans le mode test de Mathieu, tant que les bâtiments ne sont pas faits) */
const rangLeg = (o) => { const L = o && LEGENDAIRES.find((x) => x.cle === o.leg); return L ? (L.rang != null ? L.rang : o.pano) : null; };
const rangMaxLeg = () => Math.max(0, Math.min(VALEURS.vita.length - 1, Math.ceil(vaguesOuvertes() / VAGUES_PALIER) - 1)); /* (le dernier palier ouvert : 10, soit le rang 9) */
const valeurRang = (c, k, arme) => (VALEURS[c] ? VALEURS[c][Math.min(k, VALEURS[c].length - 1)] * nerfP10(k >= 9 ? 91 : 0, c) : null);
function eveillerObjet(o, n) { /* o : la pièce avec son jet ; n : ses fusions. Ses stats passent du palier de son boss au palier atteint, chaque ligne gardée */
  const k0 = rangLeg(o); if (k0 == null || !(n > 0)) return o;
  const k1 = Math.min(rangMaxLeg(), k0 + n), pas = k1 - k0; if (pas <= 0) return o;
  const stats = Object.fromEntries(Object.entries(o.stats).map(([c, v]) => { const a = valeurRang(c, k0, o.arme), b = valeurRang(c, k1, o.arme); return [c, a && b ? Math.round(v * b / a) : v]; }));
  return Object.assign({}, o, { stats, niv: Math.min(NIV_EVEIL, o.niv + 10 * pas), eveil: pas, nom: o.nom + ' +' + pas });
}
const fusionsMax = (k) => { const o = objBrut(k), r = rangLeg(o); return r == null ? 0 : Math.max(0, rangMaxLeg() - r); };
/* LA COURONNE QUI TOURNE (18/11/2026, « que la couronne tourne sur elle-même, lentement, genre vraiment lentement », Mathieu) : un tour en 40 s environ, et elle
   monte et descend d'un rien ; ses deux anneaux d'eclats tournent avec elle (30-boucle.js l'appelle a chaque image) */
function animerCouronnes(dt) { if (typeof batisMesh === 'undefined') return; for (const m of batisMesh) { const c = m.userData.couronne; if (!c) continue; const u = c.userData; u.t = (u.t || 0) + dt; c.rotation.y += dt * 0.16; c.position.y = 0.03 * Math.sin(u.t * 0.7); } }
const eveilDe = (k) => (S_.eveils && S_.eveils[k]) || 0;
const exemplairesLeg = () => { /* chaque légendaire possédé, porté ou dans le sac (un exemplaire par entrée ; un sac à 2 du même exemplaire compte pour 2) */
  const L = []; Object.values(S_.equip || {}).forEach((k) => { if (k && objBrut(k) && objBrut(k).leg) L.push({ k, porte: true }); });
  Object.entries(S_.sac || {}).forEach(([k, n]) => { const o = objBrut(k); if (o && o.leg && rangLeg(o) != null) for (let i = 0; i < n; i++) L.push({ k, porte: false }); }); return L; };
/* L'AUTEL DE L'EVEIL (18/11/2026, « sur la gauche, un endroit ou tu fais glisser l'item legendaire que tu veux modifier, une espece de cercle magique, et au
   milieu le carre ou tu le deposes ; a droite ton inventaire avec les legendaires ; tu deposes une de celles-la dans une case aussi ; tu cliques au milieu sur
   fusionner ; un message de confirmation ; une petite transformation animee, et ca te montre ta coiffe qui a pris 10 niveaux », Mathieu). Une piece se glisse
   a la souris (des qu'elle bouge de 8 px) ou au doigt (un appui de 0,2 s, pour garder le defilement), ou se touche : la premiere va au centre du cercle, un
   doublon qui lui correspond va dans la case de l'offrande ; toucher une case pleine la vide. */
const EV = { cible: null, sac: null, fin: null }; /* (cible et sac : des cles d'exemplaire ; fin : la fusion qui vient d'avoir lieu, a montrer) */
const evPortee = (k) => Object.values(S_.equip || {}).includes(k);
/* le jet de chaque exemplaire, en pastille de couleur (« quand il y a 3 pieces, on ne sait pas c'est laquelle : celle qui a deja 100 % de jet et une autre a 20 %,
   on n'arrive pas a voir la difference, pour pas qu'on brise une a 100 % sur une a 20 % », Mathieu, 18/11/2026) */
const evJet = (k) => Math.round(qualiteJet(k) * 100), evJetPastille = (k) => { const q = qualiteJet(k); return '<span class="ev-jet j-' + nomJet(q) + '">' + Math.round(q * 100) + ' %</span>'; };
const evPeutSac = (x) => !!EV.cible && !x.porte && baseObjet(x.k) === baseObjet(EV.cible) && (x.k !== EV.cible || (S_.sac[x.k] || 0) >= (evPortee(EV.cible) ? 1 : 2));
const EV_CERCLE = '<svg viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="#c890ff" stroke-width="1.6"><circle cx="100" cy="100" r="96" stroke-width="2.4"/><circle cx="100" cy="100" r="88" stroke-dasharray="3 6"/>' +
  '<circle cx="100" cy="100" r="70"/><polygon points="100,12 176,144 24,144"/><polygon points="100,188 24,56 176,56"/></g><g fill="#d7b2ff">' +
  [0, 60, 120, 180, 240, 300].map((a) => { const r = a * Math.PI / 180; return '<circle cx="' + (100 + 92 * Math.sin(r)).toFixed(1) + '" cy="' + (100 - 92 * Math.cos(r)).toFixed(1) + '" r="4"/>'; }).join('') + '</g>' +
  '<g class="inv" fill="none" stroke="#a465e6" stroke-width="1.2"><circle cx="100" cy="100" r="58" stroke-dasharray="14 5 2 5"/><circle cx="100" cy="100" r="50"/></g></svg>';
function ouvrirEveil() {
  const L = exemplairesLeg(), a = (k) => L.some((x) => x.k === k);
  if (EV.cible && !a(EV.cible)) EV.cible = null; if (EV.sac && (!EV.cible || !L.some((x) => x.k === EV.sac && evPeutSac(x)))) EV.sac = null;
  const c = EV.cible, s = EV.sac, oc = c && obj(c), max = !!c && eveilDe(c) >= fusionsMax(c), ap = c && !max ? eveillerObjet(objBrut(c), eveilDe(c) + 1) : null, F = EV.fin;
  let vuC = false, vuS = false;
  const tuiles = L.map((x) => { let e = '';
    if (x.k === c && !vuC) { vuC = true; e = 'au-centre'; } else if (x.k === s && !vuS) { vuS = true; e = 'offerte'; } else if (c) e = evPeutSac(x) ? 'possible' : 'eteinte';
    const o = obj(x.k); return '<div class="ev-case ' + e + '" data-ev-k="' + x.k + '" data-ev-porte="' + (x.porte ? 1 : 0) + '" data-ev-etat="' + e + '" title="' + o.nom.replace(/"/g, '') + ', niveau ' + o.niv + ', jet ' + evJet(x.k) + ' %">' + icoObjet(x.k) +
      '<span class="ev-niv">niv. ' + o.niv + '</span>' + evJetPastille(x.k) + '<i class="ev-jbar" style="width:' + evJet(x.k) + '%"></i>' + (x.porte ? '<span class="ev-porte">portée</span>' : '') + '</div>'; });
  const slot = (k, quoi, vide, eclat) => '<div class="ev-slot ' + quoi + (k ? ' plein' : '') + (eclat ? ' eclat' : '') + '" data-ev-slot="' + quoi + '">' + (k ? icoObjet(k) + evJetPastille(k) : '<span>' + vide + '</span>') + '</div>';
  const apercu = F ? '<div class="ev-apercu ev-resultat"><b>✦ ' + obj(F.k).nom + '</b><div class="ev-plus">Niveau ' + F.avant.niv + ' → ' + obj(F.k).niv + ' (+' + (obj(F.k).niv - F.avant.niv) + ')</div>' + tableEveil(F.avant, obj(F.k)) + '</div>'
    : c ? '<div class="ev-apercu"><b>✦ ' + oc.nom + '</b><div class="ev-jet-ligne">Jet ' + nomJet(qualiteJet(c)) + ' : ' + evJet(c) + ' %</div>' + (ap ? tableEveil(oc, ap) : '<p class="hdv-aide">Elle a atteint le dernier palier ouvert (niveau ' + oc.niv + ') : elle ne peut plus monter pour le moment.</p>') + '</div>'
    : '<div class="ev-apercu vide"><p class="hdv-aide">Chaque fusion donne <b>+10 niveaux</b> à la pièce du centre, et ses stats passent au palier suivant, en gardant ses lignes et son jet, sans dépasser le dernier palier ouvert (niveau ' + (10 * (rangMaxLeg() + 1)) + '). Le doublon est détruit.</p></div>';
  const mieux = c && s && !F && qualiteJet(s) > qualiteJet(c) + 0.005, echange = mieux && !evPortee(c) && eveilDe(c) <= eveilDe(s);
  const alerte = mieux ? '<div class="ev-alerte"><b>Attention</b> : le doublon a un meilleur jet (' + evJet(s) + ' %) que la pièce du centre (' + evJet(c) + ' %). C\'est la pièce du centre qui garde son jet.' +
    (echange ? '<button class="btn mini kamas" data-ev-echange>Échanger les deux</button>' : evPortee(c) ? ' Retire-la d\'abord pour pouvoir échanger.' : '') + '</div>' : '';
  const aide = !c ? 'Dépose une pièce au centre' : max ? 'Au plus haut pour le moment' : s ? 'Il sera détruit' : L.some((x) => evPeutSac(x)) ? 'Dépose un doublon' : 'Aucun doublon dans ton sac';
  ouvrirModale('eveil', entete('L\'éveil des légendaires') + '<div class="ev-autel">' +
    '<div class="ev-gauche"><div class="ev-cercle">' + EV_CERCLE + slot(c, 'cible', 'Glisse ici la pièce à éveiller', !!F) + '</div>' + apercu + '</div>' +
    '<div class="ev-milieu"><div class="ev-fleche">◀</div>' + slot(s, 'sac', 'Le doublon') + '<small>' + aide + '</small>' + alerte +
      (F ? '<button class="btn discret" data-ev-encore>Continuer</button>' : '<button class="btn kamas" data-ev-fusion' + (c && s && !max ? '' : ' disabled') + '>Fusionner</button>') + '</div>' +
    '<div class="ev-droite"><div class="hdv-section">Tes légendaires</div>' + (L.length ? '<div class="ev-grille">' + tuiles.join('') + '</div>' : '<p class="hdv-aide">Tu n\'as aucune pièce légendaire pour l\'instant.</p>') +
      '<p class="hdv-aide ev-astuce">Glisse une pièce dans une case, ou touche-la. Touche une case pleine pour la vider.</p></div></div>' +
    (eveilDev() ? '<div class="act-bas"><small>Version dev (mode test)</small><button class="btn discret" data-ouvrir-fusion-pieces>La fusion des pièces</button><button class="btn discret" data-ouvrir-concasseur>Le concasseur</button></div>' : ''));
}
function evPlacer(k, porte, ou) { /* ou : 'cible', 'sac', ou rien (un simple toucher) */
  if (EV.fin) EV.fin = null; const x = { k, porte: !!porte };
  if (ou === 'sac' || (!ou && EV.cible && evPeutSac(x))) {
    if (!EV.cible) { toast('Dépose d\'abord la pièce à éveiller au centre du cercle.'); return; }
    if (!evPeutSac(x)) { toast(x.porte ? 'Une pièce portée ne peut pas servir de doublon : retire-la d\'abord.' : 'Il faut un doublon exact de la pièce du centre (même pièce, même boss).'); return; }
    EV.sac = k;
  } else { EV.cible = k; EV.sac = null; }
  son('poser'); ouvrirEveil();
}
function evConfirmer() {
  const A = document.querySelector('.ev-autel'), c = EV.cible, s = EV.sac; if (!A || !c || !s || A.querySelector('.ev-confirme')) return;
  const d = document.createElement('div'); d.className = 'ev-confirme';
  d.innerHTML = '<div><p><b>Fusionner ?</b></p><p>' + obj(c).nom + ' passe du niveau ' + obj(c).niv + ' au <b>niveau ' + eveillerObjet(objBrut(c), eveilDe(c) + 1).niv + '</b>.</p><p>Elle garde son jet : <b>' + evJet(c) + ' %</b>.</p><p' + (qualiteJet(s) > qualiteJet(c) + 0.005 ? ' class="ev-perte"' : '') + '>Le doublon (jet ' + evJet(s) + ' %) est <b>détruit</b>' + (eveilDe(s) ? ' (avec ses ' + eveilDe(s) + ' éveils)' : '') + '. Tu ne pourras pas revenir en arrière.</p>' +
    '<div class="boutons"><button class="btn discret" data-ev-non>Non</button><button class="btn kamas" data-ev-oui>Oui, fusionner</button></div></div>';
  A.appendChild(d);
}
function evFusionner() { /* la transformation : le doublon est aspire au centre du cercle, le cercle s'emballe, un eclair, puis la piece eveillee */
  const A = document.querySelector('.ev-autel'), c = EV.cible, s = EV.sac; if (!A || !c || !s || A.classList.contains('ev-fusion')) return;
  const q = A.querySelector('.ev-confirme'); if (q) q.remove();
  const cS = A.querySelector('.ev-slot.cible'), sS = A.querySelector('.ev-slot.sac'), r1 = cS.getBoundingClientRect(), r2 = sS.getBoundingClientRect(), p = sS.firstElementChild;
  if (p) { p.style.setProperty('--dx', (r1.left + r1.width / 2 - r2.left - r2.width / 2) + 'px'); p.style.setProperty('--dy', (r1.top + r1.height / 2 - r2.top - r2.height / 2) + 'px'); }
  A.classList.add('ev-fusion'); A.querySelectorAll('button').forEach((b) => { b.disabled = true; }); son('quete');
  const avant = Object.assign({}, obj(c), { stats: Object.assign({}, obj(c).stats) });
  setTimeout(() => {
    const k = fusionnerLeg(c, s, true, true); if (!k) { EV.sac = null; ouvrirEveil(); return; }
    EV.fin = { k, avant }; EV.cible = k; EV.sac = null; son('niveau'); confettis(50); ouvrirEveil();
  }, 1500);
}
/* le glisser (souris ou doigt) */
let evGlisse = null, evGlisseFin = 0;
function evDebutGlisse(g) {
  const img = g.src.querySelector('img'); if (g.actif || !img || !document.body.contains(g.src)) { if (!g.actif) evGlisse = null; return; }
  g.actif = true; const f = document.createElement('div'); f.className = 'ev-fantome'; f.innerHTML = '<img src="' + img.src + '" alt="">'; document.body.appendChild(f); g.fant = f;
  g.src.classList.add('glisse'); document.body.classList.add('fp-en-glisse'); evPlaceGlisse(g);
}
function evPlaceGlisse(g) {
  g.fant.style.transform = 'translate(' + (g.x - 32) + 'px,' + (g.y - 32) + 'px)';
  const el = document.elementFromPoint(g.x, g.y), sl = el && el.closest('[data-ev-slot]'); g.ou = sl ? sl.dataset.evSlot : null;
  document.querySelectorAll('.ev-slot').forEach((d) => d.classList.toggle('survol', d === sl));
}
function evFinGlisse(lacher) {
  const g = evGlisse; evGlisse = null; if (!g) return; clearTimeout(g.minuterie); if (!g.actif) return;
  g.fant.remove(); document.body.classList.remove('fp-en-glisse'); document.querySelectorAll('.ev-slot.survol, .ev-case.glisse').forEach((e) => e.classList.remove('survol', 'glisse'));
  evGlisseFin = performance.now(); if (lacher && g.ou && modaleOuverte === 'eveil') evPlacer(g.k, g.porte, g.ou); else if (lacher && g.ou && modaleOuverte === 'fusion-pieces') fpPlacer(g.k);
}
document.addEventListener('pointerdown', (e) => {
  if ((modaleOuverte !== 'eveil' && modaleOuverte !== 'fusion-pieces') || e.button > 0 || evGlisse) return; /* (la fusion des pieces glisse pareil, 22/11/2026) */ const c = e.target.closest('.ev-case'); if (!c || document.querySelector('.ev-fusion')) return;
  const g = evGlisse = { src: c, k: c.dataset.evK, porte: c.dataset.evPorte === '1', x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, actif: false, tactile: e.pointerType === 'touch', pid: e.pointerId };
  if (g.tactile) g.minuterie = setTimeout(() => { if (evGlisse === g) { evDebutGlisse(g); if (g.actif && navigator.vibrate) navigator.vibrate(12); } }, 220);
});
document.addEventListener('pointermove', (e) => {
  const g = evGlisse; if (!g || e.pointerId !== g.pid) return; g.x = e.clientX; g.y = e.clientY; const d = Math.hypot(g.x - g.x0, g.y - g.y0);
  if (!g.actif) { if (g.tactile) { if (d > 10) evFinGlisse(false); return; } if (d < 8) return; evDebutGlisse(g); if (!g.actif) return; }
  evPlaceGlisse(g);
});
document.addEventListener('pointerup', (e) => { if (evGlisse && e.pointerId === evGlisse.pid) evFinGlisse(true); });
document.addEventListener('pointercancel', (e) => { if (evGlisse && e.pointerId === evGlisse.pid) evFinGlisse(false); });
document.addEventListener('touchmove', (e) => { if (evGlisse && evGlisse.actif) e.preventDefault(); }, { passive: false });
document.addEventListener('click', (e) => {
  if (modaleOuverte !== 'eveil') return; if (performance.now() - evGlisseFin < 80) { e.stopPropagation(); e.preventDefault(); return; }
  const t = e.target.closest('.ev-case,[data-ev-slot],[data-ev-fusion],[data-ev-oui],[data-ev-non],[data-ev-encore],[data-ev-echange]'); if (!t || document.querySelector('.ev-fusion')) return;
  if (t.matches('.ev-case')) { const et = t.dataset.evEtat; if (et === 'au-centre') { EV.cible = null; EV.sac = null; EV.fin = null; ouvrirEveil(); } else if (et === 'offerte') { EV.sac = null; ouvrirEveil(); } else evPlacer(t.dataset.evK, t.dataset.evPorte === '1'); return; }
  if (t.dataset.evSlot) { if (t.dataset.evSlot === 'cible') { EV.cible = null; EV.sac = null; EV.fin = null; } else EV.sac = null; ouvrirEveil(); return; }
  if (t.hasAttribute('data-ev-fusion')) { evConfirmer(); return; }
  if (t.hasAttribute('data-ev-non')) { const q = document.querySelector('.ev-confirme'); if (q) q.remove(); return; }
  if (t.hasAttribute('data-ev-oui')) { evFusionner(); return; }
  if (t.hasAttribute('data-ev-encore')) { EV.fin = null; ouvrirEveil(); }
  if (t.hasAttribute('data-ev-echange') && EV.cible && EV.sac && !evPortee(EV.cible)) { const c = EV.cible; EV.cible = EV.sac; EV.sac = c; son('poser'); ouvrirEveil(); }
});
const tableEveil = (a, b) => { const u = (c, v) => '+' + v + (CARACS[c] && CARACS[c][1].startsWith(' %') ? ' %' : ''); /* (avant / après, une ligne par stat) */
  return '<table class="eveil-tab"><tr><th></th><th>Avant</th><th>Après</th></tr><tr><td>Niveau</td><td>' + a.niv + '</td><td>' + b.niv + '</td></tr>' +
    Object.keys(b.stats).map((c) => '<tr><td>' + (CARACS[c] ? CARACS[c][2] + CARACS[c][0] : c) + '</td><td>' + u(c, a.stats[c]) + '</td><td>' + u(c, b.stats[c]) + '</td></tr>').join('') + '</table>'; };
function fusionnerLeg(cible, sacrifice, confirme, silencieux) { /* (silencieux : l'autel fait lui-meme le son, les confettis et l'affichage ; renvoie la cle de la piece eveillee) */
  if (combat) { toast('Pas pendant un combat.'); return; }
  const o = objBrut(cible), s = objBrut(sacrifice); if (!o || !s || baseObjet(cible) !== baseObjet(sacrifice) || !o.leg) return;
  const porte = (x) => Object.values(S_.equip || {}).includes(x), dispo = (S_.sac[sacrifice] || 0) - (cible === sacrifice && !porte(cible) ? 1 : 0); /* (un doublon dans le sac, en plus de la pièce qui monte) */
  if (!(dispo > 0)) { toast('Ce doublon n\'est plus dans ton sac.'); return; }
  if (eveilDe(cible) >= fusionsMax(cible)) { toast('Cette pièce est déjà au plus haut pour le moment.'); return; }
  const avant = obj(cible), apres = eveillerObjet(o, eveilDe(cible) + 1);
  if (!confirme) { ouvrirModale('eveil', entete('Fusionner ?') + '<div class="confirme"><div class="gros">' + icoObjet(cible) + '</div><p><b>' + avant.nom + '</b> passe au palier suivant.</p>' + tableEveil(avant, apres) +
    '<p><b>Le doublon est détruit</b>' + (eveilDe(sacrifice) ? ' (et ses ' + eveilDe(sacrifice) + ' éveils avec lui)' : '') + '. Tu ne pourras pas revenir en arrière.</p><div class="boutons"><button class="btn discret" data-eveil-retour>Non</button><button class="btn kamas" data-eveil-ok="' + cible + '|' + sacrifice + '">Oui, fusionner</button></div></div>'); return; }
  let k = cible; /* (une clé partagée par plusieurs exemplaires, vieille sauvegarde : on sort celui qui monte sous sa propre clé, à son jet) */
  if (cible === sacrifice || !(S_.jets && S_.jets[k])) { S_.jets = S_.jets || {}; S_.nInst = (S_.nInst || 0) + 1; const nk = baseObjet(k) + '~' + S_.nInst.toString(36); S_.jets[nk] = Object.assign({}, o.stats); if (eveilDe(k)) (S_.eveils = S_.eveils || {})[nk] = eveilDe(k);
    const emp = Object.keys(S_.equip).find((e) => S_.equip[e] === k); if (emp) S_.equip[emp] = nk; else { S_.sac[k]--; if (!S_.sac[k]) delete S_.sac[k]; S_.sac[nk] = 1; } k = nk; }
  S_.sac[sacrifice]--; if (!S_.sac[sacrifice]) { delete S_.sac[sacrifice]; if (!porte(sacrifice)) { if (S_.jets) delete S_.jets[sacrifice]; if (S_.eveils) delete S_.eveils[sacrifice]; } }
  (S_.eveils = S_.eveils || {})[k] = eveilDe(k) + 1; compter('eveils'); if (Object.values(S_.equip).includes(k)) rafraichirTenue();
  if (silencieux) { sauver(); rendreHaut(); return k; } son('niveau'); confettis(40);
  toast(obj(k).nom + ' s\'éveille : niveau ' + obj(k).niv + ' !', 'or'); sauver(); rendreHaut(); ouvrirEveil();
}
const concassable = (k) => { const o = objBrut(k); return !!o && !o.leg && o.niv >= NIV_CONCASSE && !Object.values(S_.equip || {}).includes(k); };
function ouvrirConcasseur() {
  const L = Object.keys(S_.sac || {}).filter(concassable).sort((a, b) => (objBrut(b).rare ? 1 : 0) - (objBrut(a).rare ? 1 : 0) || objBrut(b).niv - objBrut(a).niv), nr = runes();
  const ligne = (k) => { const o = objBrut(k), T = o.rare ? CONCASSE.rare : CONCASSE.normale, n = S_.sac[k];
    return '<div class="art">' + icoObjet(k) + '<div><b>' + (o.rare ? '★ ' : '') + o.nom + (n > 1 ? ' <span class="puce">×' + n + '</span>' : '') + '</b><div class="desc">Niveau ' + o.niv + ' · ' + (o.rare ? 'une rune de forgemagie à coup sûr, 1 chance sur 5 d\'une rune parfaite' : '1 chance sur 40 d\'une rune de forgemagie, 1 sur 100 d\'une rune parfaite') + '</div></div>' +
      '<div class="act"><button class="btn ' + (o.rare ? 'kamas' : 'discret') + '" data-concasser="' + k + '">Concasser</button></div></div>'; };
  const normales = L.filter((k) => !objBrut(k).rare), nbN = normales.reduce((t, k) => t + S_.sac[k], 0);
  ouvrirModale('concasseur', entete('Le concasseur') + '<p class="hdv-aide">Une pièce de <b>niveau ' + NIV_CONCASSE + ' ou plus</b> se broie contre des runes. <b>Normale</b> : 1 chance sur 40 d\'une rune de forgemagie et 1 sur 100 d\'une rune parfaite. <b>Rare</b> : une rune de forgemagie à coup sûr, et 1 chance sur 5 d\'une parfaite. La pièce est détruite. Les légendaires ne se concassent pas : elles servent à l\'éveil. Les pièces portées ne sont pas proposées.</p>' +
    '<div class="forge-stock">' + Object.keys(RUNES).map((t) => '<span class="puce"><img src="assets/icones/rune-' + t + '.png?v=' + VERSION_MODELES + '" alt=""><b>' + (nr[t] || 0) + '</b> ' + ((nr[t] || 0) > 1 ? RUNES[t].court : RUNES[t].nom).toLowerCase() + '</span>').join('') + '</div>' + /* (comme à la forgemagie) */
    (nbN > 1 ? '<div class="act-bas" style="margin:6px 0"><small>' + nbN + ' pièces normales</small><button class="btn discret" data-concasser-tout>Concasser toutes les normales</button></div>' : '') +
    (L.length ? '<div class="hdv-section">Tes pièces de niveau ' + NIV_CONCASSE + ' et plus</div>' + L.map(ligne).join('') : '<p class="hdv-aide">Aucune pièce de niveau ' + NIV_CONCASSE + ' ou plus dans ton sac.</p>') +
    (eveilDev() ? '<div class="act-bas"><small>Version dev (mode test)</small><button class="btn discret" data-ouvrir-eveil>L\'éveil des légendaires</button><button class="btn discret" data-ouvrir-fusion-pieces>La fusion des pièces</button></div>' : ''));
}
function concasser(liste, confirme) {
  if (combat) { toast('Pas pendant un combat.'); return; }
  const L = liste.filter(concassable); if (!L.length) return; const nb = L.reduce((t, k) => t + (S_.sac[k] || 0), 0), rares = L.filter((k) => objBrut(k).rare).length;
  if (!confirme && (rares || nb > 1)) { ouvrirModale('concasseur', entete('Concasser ?') + '<div class="confirme"><p>' + (nb > 1 ? '<b>' + nb + ' pièces</b> seront détruites' : '<b>' + objBrut(L[0]).nom + '</b> sera détruite') + ' contre des runes. Tu ne pourras pas revenir en arrière.</p><div class="boutons"><button class="btn discret" data-ouvrir-concasseur>Non</button><button class="btn kamas" data-concasser-ok="' + L.join(',') + '">Oui, concasser</button></div></div>'); return; }
  const nr = runes(); let f = 0, p = 0;
  L.forEach((k) => { const o = objBrut(k), T = o.rare ? CONCASSE.rare : CONCASSE.normale; for (let i = S_.sac[k] || 0; i > 0; i--) { if (Math.random() < T.forge) f++; if (Math.random() < T.parfaite) p++; }
    delete S_.sac[k]; if (S_.jets) delete S_.jets[k]; if (S_.eveils) delete S_.eveils[k]; });
  nr.forge = (nr.forge || 0) + f; nr.parfaite = (nr.parfaite || 0) + p; compter('concasses', nb); son(f || p ? 'niveau' : 'kamas'); if (p) confettis(40);
  toast((nb > 1 ? nb + ' pièces concassées' : 'Pièce concassée') + ' : ' + (f || p ? (f ? '+' + f + ' rune' + (f > 1 ? 's' : '') + ' de forgemagie' : '') + (f && p ? ', ' : '') + (p ? '+' + p + ' rune' + (p > 1 ? 's' : '') + ' parfaite' + (p > 1 ? 's' : '') : '') : 'aucune rune cette fois.'), f || p ? 'or' : ''); sauver(); rendreHaut(); ouvrirConcasseur();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-eveil],[data-eveil-ok],[data-eveil-retour],[data-concasser],[data-concasser-ok],[data-concasser-tout],[data-ouvrir-eveil],[data-ouvrir-concasseur]'); if (!b) return;
  if (b.hasAttribute('data-ouvrir-eveil') || b.hasAttribute('data-eveil-retour')) { ouvrirEveil(); return; }
  if (b.hasAttribute('data-ouvrir-concasseur')) { ouvrirConcasseur(); return; }
  if (b.dataset.eveil) { const [c, s] = b.dataset.eveil.split('|'); fusionnerLeg(c, s, false); return; }
  if (b.dataset.eveilOk) { const [c, s] = b.dataset.eveilOk.split('|'); fusionnerLeg(c, s, true); return; }
  if (b.dataset.concasser) { concasser([b.dataset.concasser], false); return; }
  if (b.hasAttribute('data-concasser-tout')) { concasser(Object.keys(S_.sac || {}).filter((k) => concassable(k) && !objBrut(k).rare), false); return; }
  if (b.dataset.concasserOk) { concasser(b.dataset.concasserOk.split(','), true); return; }
});

/* LA FUSION DES PIECES (21/11/2026, idee de Yannick : « une feature pourrait permettre de fusionner X objets identiques (ex : 10) pour les transformer en ce
   meme item rare, ca permet de recompenser le farming et de ne pas compter que sur la chance » ; Mathieu : 10 identiques, « avec les nouveaux batiments du
   niveau 100, celui qui permet de fusionner des items legendaires »). Version dev, comme l'autel.
   (22/11/2026, par Discord : « on fait comme pour une legendaire ? meme concept ? juste on met un item a gauche et il en fait 9 a fusionner pour garder la piece
   qu'on veut pour la passer en rare ; au lieu que tout soit violet comme les legendaires, on fait en jaune comme en rare », Mathieu) : le meme autel que l'eveil,
   en jaune. La piece a garder va au centre du cercle (portee ou dans le sac, glissee ou touchee) ; les 9 autres exemplaires normaux de la meme piece sont pris
   tout seuls dans le sac, les moins bons jets d'abord ; la piece du centre passe en rare ★ (stats +50 %) en GARDANT SON JET, contre 10 fois son prix de revente. */
const FUSION_PIECES = { n: 10, prix: 10 };
const FP = { cible: null, fin: null };
const fusionnable = (k) => { const o = objBrut(k); return !!o && !o.leg && !o.rare && !!OBJETS[baseObjet(k) + '-rare']; };
const exemplairesNormaux = () => { /* chaque piece normale qui a sa version rare, portee ou dans le sac (un exemplaire par entree), rangees par piece puis du meilleur jet au moins bon */
  const L = []; Object.values(S_.equip || {}).forEach((k) => { if (k && fusionnable(k)) L.push({ k, porte: true }); });
  Object.entries(S_.sac || {}).forEach(([k, n]) => { if (fusionnable(k)) for (let i = 0; i < n; i++) L.push({ k, porte: false }); });
  const nb = {}; L.forEach((x) => { const b = baseObjet(x.k); nb[b] = (nb[b] || 0) + 1; });
  return L.sort((a, b) => nb[baseObjet(b.k)] - nb[baseObjet(a.k)] || (baseObjet(a.k) < baseObjet(b.k) ? -1 : baseObjet(a.k) > baseObjet(b.k) ? 1 : qualiteJet(b.k) - qualiteJet(a.k))); };
function sacrificesFusion(c) { /* les 9 exemplaires du sac qui fondent dans la piece c : les moins bons jets d'abord, sans compter c elle-meme */
  const b = baseObjet(c), L = []; Object.entries(S_.sac || {}).forEach(([k, n]) => { if (baseObjet(k) !== b || !fusionnable(k)) return; const m = n - (k === c && !evPortee(c) ? 1 : 0); for (let i = 0; i < m; i++) L.push(k); });
  return L.sort((x, y) => qualiteJet(x) - qualiteJet(y)).slice(0, FUSION_PIECES.n - 1); }
const prixFusionPieces = (b) => FUSION_PIECES.prix * reventeObjet(b);
function statsRares(c) { const r = OBJETS[baseObjet(c) + '-rare'], q = qualiteJet(c); return Object.fromEntries(Object.entries(r.stats).map(([s, v]) => { const [a, m] = fourchette(v, r.id, s); return [s, Math.round(a + q * (m - a))]; })); }
const FP_CERCLE = EV_CERCLE.replace(/#c890ff/g, '#ffd34d').replace(/#d7b2ff/g, '#ffe9a3').replace(/#a465e6/g, '#e0a31e');
function ouvrirFusionPieces() {
  const L = exemplairesNormaux(), N = FUSION_PIECES.n; if (FP.cible && !L.some((x) => x.k === FP.cible)) FP.cible = null;
  const c = FP.cible, F = FP.fin, oc = c && obj(c), sac = c ? sacrificesFusion(c) : [], ok = sac.length >= N - 1, prix = c ? prixFusionPieces(baseObjet(c)) : 0, r = c && OBJETS[baseObjet(c) + '-rare'];
  const pris = {}; sac.forEach((k) => { pris[k] = (pris[k] || 0) + 1; }); let vuC = false;
  const tuiles = L.map((x) => { let e = '';
    if (x.k === c && !vuC && x.porte === evPortee(c)) { vuC = true; e = 'au-centre'; } else if (c && !x.porte && pris[x.k] > 0) { pris[x.k]--; e = 'offerte'; } else if (c) e = baseObjet(x.k) === baseObjet(c) ? 'possible' : 'eteinte';
    const o = obj(x.k); return '<div class="ev-case ' + e + '" data-ev-k="' + x.k + '" data-ev-porte="' + (x.porte ? 1 : 0) + '" data-ev-etat="' + e + '" title="' + o.nom.replace(/"/g, '') + ', niveau ' + o.niv + ', jet ' + evJet(x.k) + ' %">' + icoObjet(x.k) +
      '<span class="ev-niv">niv. ' + o.niv + '</span>' + evJetPastille(x.k) + '<i class="ev-jbar" style="width:' + evJet(x.k) + '%"></i>' + (x.porte ? '<span class="ev-porte">portée</span>' : '') + (e === 'offerte' ? '<span class="fp-fond">fond</span>' : '') + '</div>'; });
  const cible = '<div class="ev-slot cible' + (c || F ? ' plein' : '') + (F ? ' eclat' : '') + '" data-ev-slot="cible">' + (F ? icoObjet(F.k) + evJetPastille(F.k) : c ? icoObjet(c) + evJetPastille(c) : '<span>Glisse ici la pièce à garder</span>') + '</div>';
  const pile = '<div class="ev-slot sac' + (c ? ' plein' : '') + '" data-ev-slot="sac">' + (c ? '<div class="fp-pile">' + icoObjet(c) + '<span class="fp-n' + (ok ? ' ok' : '') + '">' + Math.min(sac.length, N - 1) + ' / ' + (N - 1) + '</span></div>' : '<span>Les 9 autres</span>') + '</div>';
  const apercu = F ? '<div class="ev-apercu ev-resultat"><b>' + obj(F.k).nom + '</b><div class="ev-plus">Pièce rare : stats +50 %</div>' + tableEveil(F.avant, obj(F.k)) + '</div>'
    : c ? '<div class="ev-apercu"><b>' + oc.nom + ' → ★</b><div class="ev-jet-ligne">Elle garde son jet ' + nomJet(qualiteJet(c)) + ' : ' + evJet(c) + ' %</div>' + tableEveil(oc, { niv: r.niv, stats: statsRares(c) }) + '</div>'
    : '<div class="ev-apercu vide"><p class="hdv-aide">Mets au centre la pièce que tu veux garder : <b>' + (N - 1) + ' autres exemplaires</b> de la même pièce, pris dans ton sac (les moins bons jets d\'abord), fondent dedans et elle passe <b>rare ★</b> (stats +50 %), en gardant son jet. Prix : ' + FUSION_PIECES.prix + ' fois sa revente.</p></div>';
  const mieux = c && !F && sac.some((k) => qualiteJet(k) > qualiteJet(c) + 0.005);
  const alerte = mieux ? '<div class="ev-alerte"><b>Attention</b> : parmi les ' + (N - 1) + ' qui fondent, il y en a avec un meilleur jet que la pièce du centre. Mets plutôt ta meilleure au centre.</div>' : '';
  const aide = !c ? 'Dépose une pièce au centre' : ok ? 'Les ' + (N - 1) + ' moins bons jets fondent dedans' : 'Encore ' + (N - 1 - sac.length) + ' exemplaire' + (N - 1 - sac.length > 1 ? 's' : '') + ' à trouver';
  ouvrirModale('fusion-pieces', entete('La fusion des pièces') + '<div class="ev-autel fp">' +
    '<div class="ev-gauche"><div class="ev-cercle">' + FP_CERCLE + cible + '</div>' + apercu + '</div>' +
    '<div class="ev-milieu"><div class="ev-fleche">◀</div>' + pile + '<small>' + aide + '</small>' + alerte +
      (F ? '<button class="btn discret" data-fp-encore>Continuer</button>' : '<button class="btn kamas" data-fp-fusion' + (c && ok && S_.kamas >= prix ? '' : ' disabled') + '>Fusionner' + (c ? ' · ' + fmt(prix) + ' kamas' : '') + '</button>') + '</div>' +
    '<div class="ev-droite"><div class="hdv-section">Tes pièces</div>' + (L.length ? '<div class="ev-grille">' + tuiles.join('') + '</div>' : '<p class="hdv-aide">Aucune pièce normale pour l\'instant.</p>') +
      '<p class="hdv-aide ev-astuce">Glisse une pièce au centre, ou touche-la. Touche le centre pour le vider.</p></div></div>' +
    (eveilDev() ? '<div class="act-bas"><small>Version dev (mode test)</small><button class="btn discret" data-ouvrir-eveil>L\'éveil des légendaires</button><button class="btn discret" data-ouvrir-concasseur>Le concasseur</button></div>' : ''));
}
function fpPlacer(k) { FP.fin = null; FP.cible = k; son('poser'); ouvrirFusionPieces(); }
function fpConfirmer() {
  const A = document.querySelector('.ev-autel.fp'), c = FP.cible; if (!A || !c || A.querySelector('.ev-confirme')) return;
  const sac = sacrificesFusion(c), r = OBJETS[baseObjet(c) + '-rare'], j = sac.map(evJet), d = document.createElement('div'); d.className = 'ev-confirme';
  d.innerHTML = '<div><p><b>Fusionner ?</b></p><p>' + obj(c).nom + ' devient <b>' + r.nom + '</b> (stats +50 %).</p><p>Elle garde son jet : <b>' + evJet(c) + ' %</b>.</p><p' + (sac.some((k) => qualiteJet(k) > qualiteJet(c) + 0.005) ? ' class="ev-perte"' : '') + '>Les ' + sac.length + ' autres (jets de ' + Math.min(...j) + ' à ' + Math.max(...j) + ' %) sont <b>détruits</b>, pour <b>' + fmt(prixFusionPieces(baseObjet(c))) + ' kamas</b>. Tu ne pourras pas revenir en arrière.</p>' +
    '<div class="boutons"><button class="btn discret" data-fp-non>Non</button><button class="btn kamas" data-fp-oui>Oui, fusionner</button></div></div>';
  A.appendChild(d);
}
function fpFusionner() { /* comme l'eveil : la pile est aspiree au centre du cercle, le cercle s'emballe, un eclair, puis la piece rare */
  const A = document.querySelector('.ev-autel.fp'), c = FP.cible; if (!A || !c || A.classList.contains('ev-fusion')) return;
  const q = A.querySelector('.ev-confirme'); if (q) q.remove();
  const cS = A.querySelector('.ev-slot.cible'), sS = A.querySelector('.ev-slot.sac'), r1 = cS.getBoundingClientRect(), r2 = sS.getBoundingClientRect(), p = sS.firstElementChild;
  if (p) { p.style.setProperty('--dx', (r1.left + r1.width / 2 - r2.left - r2.width / 2) + 'px'); p.style.setProperty('--dy', (r1.top + r1.height / 2 - r2.top - r2.height / 2) + 'px'); }
  A.classList.add('ev-fusion'); A.querySelectorAll('button').forEach((b) => { b.disabled = true; }); son('quete');
  const avant = Object.assign({}, obj(c), { stats: Object.assign({}, obj(c).stats) });
  setTimeout(() => { const k = fusionnerPieces(c); if (!k) { ouvrirFusionPieces(); return; } FP.fin = { k, avant }; FP.cible = null; son('niveau'); confettis(50); ouvrirFusionPieces(); }, 1500);
}
function fusionnerPieces(c) { /* la piece c passe rare a son jet ; les 9 autres du sac sont detruites ; renvoie la cle de la piece rare */
  if (combat) { toast('Pas pendant un combat.'); return null; }
  const r = OBJETS[baseObjet(c) + '-rare'], sac = sacrificesFusion(c), N = FUSION_PIECES.n, prix = prixFusionPieces(baseObjet(c)), porte = evPortee(c);
  if (!r || sac.length < N - 1) { toast('Il te faut ' + N + ' exemplaires de cette pièce.'); return null; }
  if (S_.kamas < prix) { toast('Il te faut ' + fmt(prix) + ' kamas.', 'alerte'); return null; }
  const jets = statsRares(c), parti = (k) => { if (!(S_.sac[k] > 0) && !Object.values(S_.equip || {}).includes(k)) { if (S_.jets) delete S_.jets[k]; if (S_.eveils) delete S_.eveils[k]; } };
  sac.forEach((k) => { S_.sac[k]--; if (!(S_.sac[k] > 0)) delete S_.sac[k]; parti(k); });
  const k2 = creerObjet(r.id); S_.jets = S_.jets || {}; S_.jets[k2] = jets;
  if (porte) { const emp = Object.keys(S_.equip).find((e) => S_.equip[e] === c); S_.equip[emp] = k2; } else { S_.sac[c]--; if (!(S_.sac[c] > 0)) delete S_.sac[c]; S_.sac[k2] = 1; marquerNeuf(k2); }
  parti(c); S_.kamas -= prix; compter('fusionsPieces'); if (porte) rafraichirTenue(); sauver(); rendreHaut(); return k2;
}
document.addEventListener('click', (e) => {
  const o = e.target.closest('[data-ouvrir-fusion-pieces]'); if (o) { ouvrirFusionPieces(); return; }
  if (modaleOuverte !== 'fusion-pieces') return; if (performance.now() - evGlisseFin < 80) { e.stopPropagation(); e.preventDefault(); return; }
  const t = e.target.closest('.ev-case,[data-ev-slot],[data-fp-fusion],[data-fp-oui],[data-fp-non],[data-fp-encore]'); if (!t || document.querySelector('.ev-fusion')) return;
  if (t.matches('.ev-case')) { if (t.dataset.evEtat === 'au-centre') { FP.cible = null; FP.fin = null; ouvrirFusionPieces(); } else fpPlacer(t.dataset.evK); return; }
  if (t.dataset.evSlot) { FP.cible = null; FP.fin = null; ouvrirFusionPieces(); return; }
  if (t.hasAttribute('data-fp-fusion')) { fpConfirmer(); return; }
  if (t.hasAttribute('data-fp-non')) { const q = document.querySelector('.ev-confirme'); if (q) q.remove(); return; }
  if (t.hasAttribute('data-fp-oui')) { fpFusionner(); return; }
  if (t.hasAttribute('data-fp-encore')) { FP.fin = null; ouvrirFusionPieces(); }
});
