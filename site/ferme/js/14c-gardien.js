'use strict';
/* ===================== LES GARDIENS DE LA FERME : NEWTON ET MASDOG =====================
   (20-21/10/2026, Mathieu : « a partir du niveau 80, un chat ou un chien de garde, il faut faire un choix. Un chat qui s'appelle Newton, tres gentil et docile,
   pareil pour le chien ; quand un VSA ou une simu VSA arrive, ils se transforment, deviennent massifs et violents. Nourris avec des Tofus pour le chat et des
   Bouftous pour le chien » ; « si il a faim il reste dans sa niche ; faut creer un batiment pour le chat et le chien » ; « le chien c'est Masdog ».)
   Modeles valides sur planche (blender/gardiens.py, export leger « --jeu » ; blender/niches.py) : Newton d'apres les photos du chat de Mathieu, en panthere
   quand il se transforme ; Masdog le chiot lavande (les couleurs du perso de Masdov), en Meulou ; la niche et le tonneau, a la meme echelle.
   - Le choix, des le niveau 80, est definitif. Sa maison se pose sur une case d'herbe pres de la grange (elle se deplace dans Amenager).
   - Au calme, il se promene autour de sa maison et s'assoit ; on le caresse en le touchant ; sa maison ouvre sa fenetre (repas, ce qu'il fait en VSA).
   - Un voleur de VSA ou une simu VSA : il se transforme et mord les voleurs (stats validees le 21/10/2026) : Masdog 60 % de tes degats toutes les 0,8 s,
     vitesse 5,5, Gueule de fer (le voleur mordu reste coince 1,5 s), il vise le voleur le plus pres de la grange ; Newton 40 % toutes les 0,6 s,
     vitesse 6,5, le Bond (il saute sur le voleur le plus loin, qui lache ce qu'il porte), il vise celui qui repart avec ton butin.
   - Les repas : Masdog mange un Bouftou (48 h), Newton un Tofu (24 h), 3 repas d'avance au plus. Jamais un Bouftou noir, une femelle qui attend un petit,
     ni tes deux derniers adultes ; un Tofu de la voliere. Affame, il reste dans sa maison, meme en VSA (« si il a faim il reste dans sa niche »).
   Les heures sont celles de la ferme (comme les repas des Bouftous : pendant une absence, elles passent 20 fois moins vite). */
const NIV_GARDIEN = 80, RESERVE_GARDIEN = 3, ECHELLE_GARDIEN = 0.582, RECHARGE_POUVOIR = 8;
const GARDIENS = {
  chat: { nom: 'Newton', espece: 'chat', fichier: 'gardien-chat', calme: 'Newton_D', assis: 'Newton_A', vsa: 'Newton_T1', maison: 'MaisonChat', nomMaison: 'son tonneau', proie: 'Tofu', heures: 24,
    deg: 0.4, cadence: 0.6, vitesse: 6.5, pouvoir: 'bond', ico: 'newton', icoVsa: 'newton-vsa', forme: 'en panthère', ombre: 0.75, ombreVsa: 1.5,
    texte: 'Un matou noir et blanc, tout doux, aux yeux vert pâle. Quand VSA débarque, il devient une panthère aux crocs de sabre.',
    pouvoirNom: 'Le Bond', pouvoirTxt: 'il saute sur le voleur le plus loin, qui lâche ce qu\'il porte', cible: 'celui qui repart avec ton butin',
    caresses: ['Newton ronronne et se frotte contre ta jambe.', 'Newton plisse les yeux de bonheur.', 'Newton te tend la joue, puis l\'autre.', 'Newton fait semblant de ne pas aimer ça. Il adore.'] },
  chien: { nom: 'Masdog', espece: 'chien', fichier: 'gardien-chien', calme: 'Chiot_C1', assis: 'Chiot_C3', vsa: 'Meulou_F', maison: 'Niche', nomMaison: 'sa niche', proie: 'Bouftou', heures: 48,
    deg: 0.6, cadence: 0.8, vitesse: 5.5, pouvoir: 'gueule', ico: 'masdog', icoVsa: 'masdog-vsa', forme: 'en Meulou', ombre: 0.8, ombreVsa: 1.9,
    texte: 'Un petit monstre lavande pas commode, aux couleurs de Masdov. Quand VSA débarque, il devient le Meulou, cornes ivoire et crinière.',
    pouvoirNom: 'Gueule de fer', pouvoirTxt: 'le voleur mordu reste coincé 1,5 s', cible: 'le voleur le plus près de ta grange',
    caresses: ['Masdog remue la queue, l\'air faussement grognon.', 'Masdog grogne pour la forme, puis se roule sur le dos.', 'Masdog te mordille la main, tout doucement.', 'Masdog pousse un petit jappement satisfait.'] },
};
const gardienDe = () => (S_ && S_.gardien && GARDIENS[S_.gardien.type]) || null;
const dureeRepasGardien = (G) => G.heures * 60 * MIN;
const gardienAffame = () => !S_.gardien || Date.now() >= S_.gardien.rassasie;
const repasGardien = () => { const G = gardienDe(); return G ? Math.max(0, Math.ceil((S_.gardien.rassasie - Date.now()) / dureeRepasGardien(G) - 1e-6)) : 0; };
const degGardien = () => Math.max(1, Math.round(statsPerso().deg * gardienDe().deg));
const SC_GARDIEN = new Set([...SC_P8, 'moustache', 'vibrisse', 'narine', 'nez_chat', 'museau_chat', 'chanfrein_chat', 'menton_chat', 'babine_chat', 'paupiere']);

/* ---------- les modeles : charges seulement une fois le gardien choisi (le sien, pas l'autre) ---------- */
let gardienCharge = null;
function chargerGardien() {
  const G = gardienDe(); if (!G) return Promise.resolve();
  if (MODELES.gardienCalme && MODELES.gardienCalme.userData.type === S_.gardien.type) return Promise.resolve();
  return gardienCharge || (gardienCharge = Promise.all([chargerGlb('assets/modeles/jeu/' + G.fichier + '.glb?v=' + VERSION_MODELES), chargerGlb('assets/modeles/jeu/niches.glb?v=' + VERSION_MODELES)]).then(([sc, sn]) => {
    sc.traverse((o) => { if (PIVOT_P8.test(o.name)) o.userData.articule = true; }); versToon(sc, { normales: 0.01, sansContour: SC_GARDIEN }); versToon(sn, { normales: 0.012, sansContour: SC_BATI });
    const O = new T.Vector3(0, 0, 0); /* (l'origine du modele, sous son corps : il tourne sur lui-meme, pas autour du milieu de sa queue) */
    [['gardienCalme', G.calme], ['gardienAssis', G.assis], ['gardienVsa', G.vsa]].forEach(([k, n]) => { const m = gabaritEchelle(sc, n, ECHELLE_GARDIEN, O); fusionnerPivots(m); m.userData.pivots = true; m.userData.type = S_.gardien.type; MODELES[k] = m; });
    MODELES.maisonGardien = gabaritEchelle(sn, G.maison, 2 * ECHELLE_GARDIEN, O); /* (la maison a l'echelle de la planche : deux fois celle de l'animal, une case) */
    if (S_.cases.some((c) => c.type === 'niche')) construireBatiments(); creerGardien();
  }).catch(() => { gardienCharge = null; }));
}
/* chaque membre (hanche, genou, tete, queue) reste un pivot qui bouge, mais ses pieces se soudent entre elles : quelques dessins par membre au lieu de dizaines */
function fusionnerPivots(m) { const P = []; m.traverse((o) => { if (o.userData && o.userData.articule) P.push(o); }); P.forEach((p) => fusionner(p)); }

/* ---------- le choix, au niveau 80 ---------- */
function ouvrirChoixGardien() {
  if (S_.gardien) { ouvrirGardien(); return; }
  const l = niveau(S_.xp), d = statsPerso().deg;
  const carte = (type) => { const G = GARDIENS[type], mo = Math.max(1, Math.round(d * G.deg));
    return '<div class="ulti-carte"><span class="rond gardien"><img src="assets/icones/' + G.ico + '.png?v=' + VERSION_MODELES + '" alt=""></span><div><b>' + G.nom + ', le ' + G.espece + '</b>' +
      '<div class="desc" style="font-size:.78rem;font-weight:600;margin:2px 0 4px">' + G.texte + '</div><div class="puces"><span class="puce">morsure ' + Math.round(G.deg * 100) + ' % de tes dégâts (' + fmt(mo) + ')</span>' +
      '<span class="puce">toutes les ' + String(G.cadence).replace('.', ',') + ' s</span><span class="puce">' + G.pouvoirNom + ' : ' + G.pouvoirTxt + '</span><span class="puce">mange 1 ' + G.proie + ' toutes les ' + G.heures + ' h</span></div>' +
      '<div class="gardien-vsa"><img src="assets/icones/' + G.icoVsa + '.png?v=' + VERSION_MODELES + '" alt="">en VSA, ' + G.forme + '</div></div>' +
      '<button class="btn kamas" data-gardien="confirmer" data-type="' + type + '"' + (l < NIV_GARDIEN ? ' disabled' : '') + '>Adopter ' + G.nom + '</button></div>'; };
  ouvrirModale('gardien', entete('Un gardien pour ta ferme') + '<p style="font-size:.8rem;font-weight:600;margin:0 0 4px">' + (l < NIV_GARDIEN ? 'Il arrive au niveau ' + NIV_GARDIEN + ' de Paysan (tu es niveau ' + l + ').' : 'Il se promène autour de sa maison et se laisse caresser. Quand un voleur de VSA ou une simu VSA débarque, il se transforme et mord les voleurs. <b>Tu le choisis une seule fois : impossible d\'en changer ensuite.</b>') + '</p>' + ['chat', 'chien'].map(carte).join(''));
}
function confirmerGardien(type) {
  const G = GARDIENS[type]; if (!G || S_.gardien) return;
  ouvrirModale('gardien', entete('Adopter ' + G.nom + ' ?') + '<div class="confirme"><div class="gros gardien"><img src="assets/icones/' + G.ico + '.png?v=' + VERSION_MODELES + '" alt=""></div><b>' + G.nom + ', le ' + G.espece + '</b><p>' + G.texte +
    ' Il mange 1 ' + G.proie + ' toutes les ' + G.heures + ' h.<br><b>C\'est pour de bon : tu ne pourras plus changer de gardien.</b></p><div class="boutons"><button class="btn discret" data-gardien="choix">Revoir les deux</button><button class="btn kamas" data-gardien="adopter" data-type="' + type + '">Oui, j\'adopte ' + G.nom + '</button></div></div>');
}
function caseLibreNiche() { /* une case d'herbe libre, la plus proche de la grange, qui ne coupe aucun acces (comme l'atelier de forgemagie) */
  const deja = inaccessibles(), G = blocBati('grange'), d = (c) => (G ? Math.hypot(posCase(c).x - G.x, posCase(c).z - G.z) : 0);
  const L = S_.cases.filter((c) => c.type === 'libre' && !(S_.sauvage && S_.sauvage.id === c.id)).sort((a, b) => d(a) - d(b));
  for (const c of L.slice(0, 80)) { c.type = 'niche'; const bloque = inaccessibles().some((x) => !deja.includes(x)); c.type = 'libre'; if (!bloque) return c; }
  return null;
}
function adopterGardien(type) {
  const G = GARDIENS[type]; if (!G || S_.gardien || niveau(S_.xp) < NIV_GARDIEN) return;
  const c = caseLibreNiche(); if (!c) { toast('Pas la place : sa maison prend une case d\'herbe libre. Libère-en une avec Aménager, ou achète un terrain.', 'alerte'); return; }
  S_.gardien = { type, rassasie: Date.now() + dureeRepasGardien(G), depuis: Date.now() }; /* (il arrive avec un repas dans le ventre) */
  c.type = 'niche'; const u = paysanMesh.userData; if (u.cellule === c || caseIci(paysanMesh.position.x, paysanMesh.position.z) === c) { const v = voisins(c).find((x) => PASSABLE[x.type]); if (v) { const q = posCase(v); paysanMesh.position.set(q.x, q.y, q.z); u.cellule = v; } }
  rendreCase(c.id); sauver(); fermerModale(); son('niveau');
  toast(G.nom + ' s\'installe dans ' + G.nomMaison + ', près de ta grange. Touche-le pour le caresser, touche sa maison pour le nourrir. Tu peux la déplacer avec Aménager.', 'or');
  chargerGardien().then(() => { if (gard) pouf(gard.x, gard.y, gard.z, 2.2, '#fff3c4'); });
}

/* ---------- sa fenetre : son etat, ses repas, ce qu'il fait en VSA ---------- */
function proieGardien() { /* ce qu'il mangerait maintenant, ou pourquoi il ne peut pas */
  const G = gardienDe();
  if (G.proie === 'Tofu') return S_.tofus > 0 ? { ok: true } : { ok: false, txt: 'Il faut un Tofu dans ta volière (attrape-en un au filet).' };
  const adultes = S_.bouftous.filter(adulte).length, L = S_.bouftous.map((b, j) => ({ b, j })).filter(({ b }) => !b.noir && !b.gestation && adulte(b));
  if (adultes <= 2 || !L.length) return { ok: false, txt: 'Aucun Bouftou à lui donner : jamais un noir, une femelle qui attend un petit, ni tes deux derniers adultes.' };
  L.sort((x, y) => (x.b.laine || 0) - (y.b.laine || 0)); return { ok: true, j: L[0].j, b: L[0].b }; /* (celui qui a le moins de laine ; la sienne passe a la grange) */
}
function ouvrirGardien() {
  const G = gardienDe(); if (!G) { ouvrirChoixGardien(); return; }
  const faim = gardienAffame(), n = repasGardien(), P = proieGardien(), plein = n >= RESERVE_GARDIEN, d = degGardien();
  const etat = faim ? '<b style="color:#c0392b">Il a faim</b> : il reste dans ' + G.nomMaison + ' et ne défend plus ta ferme.' : 'Rassasié encore ' + dureeLisible(S_.gardien.rassasie - Date.now()) + ' (' + n + ' repas d\'avance sur ' + RESERVE_GARDIEN + ').';
  const bouton = plein ? '<span class="cadenas">Il a assez mangé</span>' : '<button class="btn kamas" data-gardien="nourrir"' + (P.ok ? '' : ' disabled') + '>Nourrir · 1 ' + G.proie + '</button>';
  ouvrirModale('gardien', entete(G.nom) + '<div class="art">' + ico(G.ico) + '<div><b>' + G.nom + ', ton ' + G.espece + ' de garde</b><div class="desc">' + etat + ' Il mange 1 ' + G.proie + ' toutes les ' + G.heures + ' h, ' + RESERVE_GARDIEN + ' repas d\'avance au plus.' +
    (!plein && !P.ok ? ' <b>' + P.txt + '</b>' : '') + '</div></div><div class="act">' + bouton + '</div></div>' +
    '<div class="art">' + ico(G.icoVsa) + '<div><b>En VSA, ' + G.forme + '</b><div class="desc">Quand un voleur de VSA ou une simu VSA débarque, il se transforme et mord les voleurs : ' + fmt(d) + ' de dégâts (' + Math.round(G.deg * 100) + ' % des tiens) toutes les ' + String(G.cadence).replace('.', ',') + ' s. Il vise ' + G.cible + '. ' +
    G.pouvoirNom + ' : ' + G.pouvoirTxt + ' (toutes les ' + RECHARGE_POUVOIR + ' s).</div></div><div class="act"><button class="btn discret" data-gardien="caresser"' + (faim ? ' disabled' : '') + '>Caresser</button></div></div>');
}
function nourrirGardien() {
  const G = gardienDe(); if (!G) return; if (repasGardien() >= RESERVE_GARDIEN) { toast(G.nom + ' a assez mangé pour l\'instant.'); return; }
  const P = proieGardien(); if (!P.ok) { toast(P.txt, 'alerte'); return; }
  const t = Date.now(), d = dureeRepasGardien(G), affame = gardienAffame();
  if (G.proie === 'Tofu') { S_.tofus--; appliquerVoliere(); toast('Newton croque un Tofu de ta volière. Il est rassasié pour ' + G.heures + ' h de plus.', 'or'); }
  else { const { b, j } = P; if (b.laine) { const L = b.noir ? LAINE_NOIRE : LAINE; S_.grange[L.id] = (S_.grange[L.id] || 0) + b.laine; }
    S_.bouftous.splice(j, 1); erre.splice(j, 1); rendreBouftous(); toast('Masdog emporte ' + b.nom + ' dans ' + G.nomMaison + '. Il est rassasié pour ' + G.heures + ' h de plus.' + (b.laine ? ' Sa laine est passée à la grange.' : ''), 'or'); }
  S_.gardien.rassasie = Math.min(Math.max(t, S_.gardien.rassasie) + d, t + RESERVE_GARDIEN * d); son('nourri'); compter('repasGardien');
  if (gard) { if (affame) { gard.etat = 'pause'; gard.t = 1.5; placerGardien(porcheGardien()); } pouf(gard.x, gard.y, gard.z, 1.4, '#ffd6e0'); chiffre('Miam !', new T.Vector3(gard.x, gard.y + 1.2, gard.z), 'butin'); }
  rendreHaut(); rendreGrange(); sauver(); if (modaleOuverte === 'gardien') ouvrirGardien();
}
function caresserGardien() {
  const G = gardienDe(); if (!G || !gard) return;
  if (gardienAffame()) { toast(G.nom + ' boude dans ' + G.nomMaison + ' : il a faim. Touche sa maison pour le nourrir.'); return; }
  if (gard.forme === 'vsa') return; /* (en pleine VSA, il a mieux a faire) */
  gard.joie = 0.7; gard.etat = 'pause'; gard.t = Math.max(gard.t, 3); montrerForme('assis');
  for (let k = 0; k < 3; k++) setTimeout(() => { if (gard) chiffre('♥', new T.Vector3(gard.x, gard.y + 1.0 + k * 0.1, gard.z), 'butin'); }, k * 180);
  toast(hasard(G.caresses)); compter('caresses');
}
const actionGardien = (a, type) => ({ choix: ouvrirChoixGardien, confirmer: () => confirmerGardien(type), adopter: () => adopterGardien(type), nourrir: nourrirGardien, caresser: caresserGardien, voir: ouvrirGardien }[a] || (() => {}))();
/* sa carte dans l'HDV (Ameliorer, Defense) : verrouillee avant le niveau 80, puis « Choisir », puis son etat */
const etatGardien = () => (S_.gardien ? { e: 'fini' } : niveau(S_.xp) < NIV_GARDIEN ? { e: 'bloque' } : { e: 'dispo', ok: true });
function artGardien() {
  const G = gardienDe(), l = niveau(S_.xp), verrou = !G && l < NIV_GARDIEN;
  const desc = G ? G.nom + ' garde ta ferme. ' + (gardienAffame() ? 'Il a faim : il reste dans ' + G.nomMaison + '.' : 'Rassasié, ' + repasGardien() + ' repas d\'avance.') : 'Un chat ou un chien de garde : Newton ou Masdog. Ils se transforment quand VSA débarque et mordent les voleurs. Un choix définitif.';
  const achat = G ? '<button class="btn" data-gardien="voir">Voir ' + G.nom + '</button>' : verrou ? '<span class="a-etat">' + picto('cadenas', GRIS_PICTO) + 'Paysan niveau ' + NIV_GARDIEN + '</span>' : '<button class="btn kamas" data-gardien="choix">Choisir</button>';
  return '<div class="amel' + (verrou ? ' verrou' : '') + '"><img class="a-ico" src="assets/icones/' + (G ? G.ico : 'gardiens') + '.png?v=' + VERSION_MODELES + '" alt=""><h3>Gardien de la ferme</h3>' + crans(0, 0, G ? 'adopté' : 'un choix définitif') + '<p class="a-desc">' + desc + '</p><div class="a-achat">' + achat + '</div></div>';
}

/* ---------- l'animal sur la ferme ---------- */
let gard = null; /* { calme, assis, vsa : ses trois modeles ; forme : celui qu'on voit ; x, y, z, ry ; etat : pause, marche, vsa, niche ; ... } */
function retirerGardien() { if (!gard) return; ['calme', 'assis', 'vsa'].forEach((k) => jeter(gard[k])); if (gard.bulle) gard.bulle.remove(); gard = null; }
function creerGardien() {
  retirerGardien(); const G = gardienDe(); if (!G || !MODELES.gardienCalme || !blocBati('niche')) return;
  const mk = (k, ombre) => { const m = cloner(k); ombrePieds(m, ombre); m.traverse((o) => { o.userData.gardien = true; }); m.visible = false; scene.add(m); return m; };
  const p = porcheGardien(), bulle = document.createElement('div'); bulle.className = 'bulle lieu'; bulle.dataset.ancre = 'niche'; bulle.textContent = G.nom; zoneBulles.appendChild(bulle);
  gard = { calme: mk('gardienCalme', G.ombre), assis: mk('gardienAssis', G.ombre), vsa: mk('gardienVsa', G.ombreVsa), x: p.x, y: p.y, z: p.z, ry: p.ry, etat: 'pause', t: 2 + Math.random() * 3, pas: 0, recharge: 0, mord: 0, joie: 0, coup: 0, forme: null, bulle, faimVue: false, horsVsa: 0 };
  montrerForme('assis'); placerGardien(p);
}
function porcheGardien() { /* devant la porte de sa maison (la porte regarde +z, tournee avec la maison) */
  const o = blocBati('niche'); if (!o) return { x: 0, y: 0, z: 0, ry: 0 };
  const a = rotDe('niche'), x = o.x + Math.sin(a) * 1.25, z = o.z + Math.cos(a) * 1.25, c = caseIci(x, z);
  if (c && PASSABLE[c.type]) return { x, y: posCase(c).y, z, ry: a, c };
  const v = voisins(o.c0).find((q) => PASSABLE[q.type]); if (v) { const q = posCase(v); return { x: q.x * 0.6 + o.x * 0.4, y: q.y, z: q.z * 0.6 + o.z * 0.4, ry: Math.atan2(q.x - o.x, q.z - o.z), c: v }; }
  return { x: o.x, y: o.y, z: o.z, ry: a, c: o.c0 };
}
function placerGardien(p) { if (!gard || !p) return; gard.x = p.x; gard.z = p.z; gard.y = p.y || 0; if (p.ry !== undefined) gard.ry = p.ry; gard.chemin = null; }
function montrerForme(f) { if (!gard) return; gard.forme = f; ['calme', 'assis', 'vsa'].forEach((k) => { gard[k].visible = k === f; }); }
/* LES MOUVEMENTS (premier jet filme le 21/10/2026) : la marche a quatre temps, le galop par bonds (les deux pattes avant ensemble, puis les deux arriere,
   le corps qui se tend et se ramasse) et la morsure (il se ramasse, se detend, mord, revient) */
function poseGardien(m, P) {
  const u = m.userData; m.rotation.x = P.tg || 0;
  (u.pattes || []).forEach((p, i) => { p.hanche.rotation.x = P.jambes[i][0]; p.genou.rotation.x = P.jambes[i][1]; });
  if (u.tete) { u.tete.rotation.x = P.te || 0; u.tete.rotation.y = P.tey || 0; } if (u.queue) { u.queue.rotation.x = P.qx || 0; u.queue.rotation.y = P.qy || 0; }
}
const REPOS_JAMBES = [[0, 0], [0, 0], [0, 0], [0, 0]];
function marcheGardien(ph) { const D = [Math.PI / 2, Math.PI * 1.5, 0, Math.PI]; return { tg: 0, jambes: D.map((d) => [Math.sin(ph + d) * 0.5, Math.max(0, -Math.cos(ph + d)) * 0.9]), te: Math.sin(2 * ph + 0.6) * 0.05, qy: Math.sin(ph) * 0.25, bond: 0.012 * (1 - Math.cos(2 * ph)) }; }
function galopGardien(ph) { const D = [0, 0.4, Math.PI, Math.PI + 0.4], tg = -0.16 * Math.cos(ph); return { tg, jambes: D.map((d) => [Math.sin(ph + d) * 1.05, Math.max(0, -Math.cos(ph + d)) * 1.35]), te: -tg * 0.8, qx: -0.35 + 0.18 * Math.sin(ph), bond: 0.08 * Math.max(0, Math.sin(2 * ph - 0.6)) }; }
function morsureGardien(k) { /* k de 0 a 1 : ramasse, detente, morsure, retour */
  const f = k < 0.35 ? k / 0.35 : k < 0.6 ? 1 - (k - 0.35) / 0.25 * 2 : -1 + (k - 0.6) / 0.4, c = Math.max(0, f), e = Math.max(0, -f);
  return { tg: 0.1 * c + 0.2 * e, jambes: [[-0.35 * c + 0.35 * e, 0.7 * c + 0.4 * e], [-0.3 * c + 0.3 * e, 0.7 * c + 0.4 * e], [0.5 * c, 0.9 * c], [0.45 * c, 0.9 * c]], te: 0.1 * c + 0.35 * e, qx: -0.2 * e, qy: 0.3 * c, avance: 0.25 * e, bond: 0 };
}
/* ---------- la boucle : le calme, la faim, la VSA ---------- */
function majGardien(dt, s) {
  const G = gardienDe(); if (!G) { if (gard) retirerGardien(); return; }
  if (!MODELES.gardienCalme || MODELES.gardienCalme.userData.type !== S_.gardien.type) { chargerGardien(); return; }
  if (!gard) { creerGardien(); if (!gard) return; }
  const ici = lieu === 'ferme'; gard.bulle.hidden = !ici;
  if (!ici) { ['calme', 'assis', 'vsa'].forEach((k) => { gard[k].visible = false; }); return; }
  const faim = gardienAffame();
  if (faim !== gard.faimVue) { gard.faimVue = faim; gard.bulle.textContent = G.nom + (faim ? ' a faim' : ''); gard.bulle.classList.toggle('faim', faim);
    if (faim) toast(G.nom + ' a faim : il reste dans ' + G.nomMaison + ' et ne défend plus ta ferme. Touche sa maison pour le nourrir (1 ' + G.proie + ').', 'alerte'); }
  gard.recharge = Math.max(0, gard.recharge - dt); gard.mord = Math.max(0, gard.mord - dt); gard.joie = Math.max(0, gard.joie - dt); gard.coup = Math.max(0, gard.coup - dt);
  if (faim) { /* dans sa maison : on ne le voit plus */
    if (gard.forme === 'vsa') pouf(gard.x, gard.y, gard.z, 1.6);
    ['calme', 'assis', 'vsa'].forEach((k) => { gard[k].visible = false; }); gard.forme = null; gard.etat = 'niche'; gard.saut = null; placerGardien(porcheGardien()); return;
  }
  if (gard.etat === 'niche') { gard.etat = 'pause'; gard.t = 2; montrerForme('assis'); pouf(gard.x, gard.y, gard.z, 1.2); }
  const cible = cibleGardien();
  if (cible) { gard.horsVsa = 0; if (gard.forme !== 'vsa') transformer(true); majVsa(dt, s, cible); }
  else if (gard.forme === 'vsa') { gard.horsVsa += dt; poseGardien(gard.vsa, { jambes: REPOS_JAMBES }); if (gard.horsVsa > 1.2) transformer(false); }
  else majCalme(dt, s);
  const m = gard[gard.forme]; if (!m) return;
  m.position.set(gard.x, gard.y + (gard.bond || 0) + (gard.joie > 0 ? Math.abs(Math.sin(gard.joie * 12)) * 0.12 : 0), gard.z); m.rotation.y = gard.ry;
}
function transformer(oui) {
  const G = gardienDe(); pouf(gard.x, gard.y, gard.z, oui ? 2.6 : 1.6, oui ? '#c8ff6e' : '#fffaf0'); gard.saut = null; gard.chemin = null;
  if (oui) { montrerForme('vsa'); gard.etat = 'vsa'; const t = Date.now(); if (!gard.annonce || t - gard.annonce > 20000) { gard.annonce = t; toast(G.nom + ' se transforme ' + G.forme + ' et file sur les voleurs !', 'or'); } }
  else { montrerForme('calme'); gard.etat = 'retour'; gard.t = 0; }
}
/* qui il vise : un voleur de la simu VSA, ou le voleur de VSA qui passe seul */
function cibleGardien() {
  if (combat && combat.raid && !combat.fin) {
    const L = combat.monstres.filter((mo) => mo.etat === 'actif' && mo.d.vole); if (!L.length) return null;
    if (gardienDe().espece === 'chien') { const g = blocBati('grange'), d = (mo) => (g ? Math.hypot(mo.x - g.x, mo.z - g.z) : 0); return { mo: L.reduce((a, b) => (d(b) < d(a) ? b : a)) }; }
    const P = L.filter((mo) => mo.porte), Q = P.length ? P : L, d = (mo) => Math.hypot(mo.x - gard.x, mo.z - gard.z); return { mo: Q.reduce((a, b) => (d(b) < d(a) ? b : a)) };
  }
  if (combat) return null; /* (pendant une vague, une Arene : il garde la maison) */
  if (voleur && voleurCiblable()) return { voleur: true };
  return null;
}
const posCible = (c) => (c.mo ? { x: c.mo.x, z: c.mo.z } : { x: voleur.m.position.x, z: voleur.m.position.z });
function majVsa(dt, s, c) {
  const G = gardienDe(), m = gard.vsa;
  if (gard.saut) { /* le Bond de Newton : un saut en arc, droit sur le voleur le plus loin */
    const S0 = gard.saut; S0.t += dt / S0.duree; const k = Math.min(1, S0.t), q = posCible(S0.c.mo && S0.c.mo.etat !== 'actif' ? c : S0.c);
    gard.x = S0.x0 + (q.x - S0.x0) * k; gard.z = S0.z0 + (q.z - S0.z0) * k; gard.bond = Math.sin(k * Math.PI) * 1.6; gard.ry = Math.atan2(q.x - S0.x0, q.z - S0.z0);
    poseGardien(m, galopGardien(0.9)); if (k >= 1) { gard.saut = null; gard.bond = 0; mordre(S0.c.mo && S0.c.mo.etat === 'actif' ? S0.c : c, true); } return;
  }
  const q = posCible(c), d = Math.hypot(q.x - gard.x, q.z - gard.z);
  if (G.pouvoir === 'bond' && !gard.recharge && combat && combat.raid) { /* le plus loin des voleurs, s'il est vraiment loin */
    const L = combat.monstres.filter((mo) => mo.etat === 'actif' && mo.d.vole), loin = L.reduce((a, b) => (Math.hypot(b.x - gard.x, b.z - gard.z) > Math.hypot(a.x - gard.x, a.z - gard.z) ? b : a), L[0]);
    if (loin && Math.hypot(loin.x - gard.x, loin.z - gard.z) > 4) { gard.recharge = RECHARGE_POUVOIR; gard.saut = { c: { mo: loin }, x0: gard.x, z0: gard.z, t: 0, duree: 0.55 }; chiffre('Le Bond !', new T.Vector3(gard.x, gard.y + 2, gard.z), 'butin'); return; }
  }
  if (d > 1.0) { /* il court sur le voleur */
    const w = prochainPas(gard, q.x, q.z, dt), dx = w.x - gard.x, dz = w.z - gard.z, L = Math.hypot(dx, dz) || 1, pas = Math.min(L, G.vitesse * dt);
    gard.x += dx / L * pas; gard.z += dz / L * pas; let a = Math.atan2(dx, dz) - gard.ry; a = Math.atan2(Math.sin(a), Math.cos(a)); gard.ry += a * Math.min(1, dt * 10);
    const sol = caseIci(gard.x, gard.z); if (sol) gard.y = posCase(sol).y;
    gard.pas += G.vitesse * dt * 0.95; const P = galopGardien(gard.pas); gard.bond = P.bond; poseGardien(m, P);
  } else { /* a portee : il mord */
    let a = Math.atan2(q.x - gard.x, q.z - gard.z) - gard.ry; a = Math.atan2(Math.sin(a), Math.cos(a)); gard.ry += a * Math.min(1, dt * 12); gard.bond = 0;
    if (!gard.mord) { gard.mord = G.cadence; gard.coup = 0.35; mordre(c, false); }
    poseGardien(m, morsureGardien(1 - gard.coup / 0.35));
  }
}
function mordre(c, bond) {
  const G = gardienDe(), n = degGardien(), pouvoir = G.pouvoir === 'gueule' && !gard.recharge;
  if (pouvoir) { gard.recharge = RECHARGE_POUVOIR; chiffre('Gueule de fer !', new T.Vector3(gard.x, gard.y + 2, gard.z), 'butin'); }
  son('touche');
  if (c.mo) { const mo = c.mo; if (mo.etat !== 'actif') return;
    if (pouvoir) mo.coince = 1.5;
    if (bond && mo.porte) lacherButin(mo.porte, mo.m, mo.x, mo.z, () => { mo.porte = null; });
    blesser(mo, n, bond, 'def'); return; }
  if (!voleur) return;
  if (bond && voleur.porte) lacherButin(voleur.porte, voleur.m, voleur.m.position.x, voleur.m.position.z, () => { voleur.porte = null; });
  blesserVoleur(n, G.nom + ' a fait fuir le voleur de VSA !', pouvoir ? 1.5 : 0.4);
}
function lacherButin(r, m, x, z, vide) { /* le Bond : le voleur lache son sac, tout revient a la grange */
  S_.grange[r.id] = (S_.grange[r.id] || 0) + r.n; vide(); m.children.filter((o) => o.userData && o.userData.sac).forEach((o) => m.remove(o));
  chiffre('+' + r.n + ' ' + r.nom, new T.Vector3(x, 2.2, z), 'butin'); toast(gardienDe().nom + ' bondit sur le voleur : il lâche ses ' + r.n + ' ' + r.nom + ', ils reviennent à la grange !', 'or'); rendreGrange(); sauver();
}
/* au calme : il fait un tour autour de sa maison, s'assoit, regarde, revient */
function majCalme(dt, s) {
  const G = gardienDe(), V = 1.25;
  if (gard.etat === 'retour') { const p = porcheGardien(); gard.cibleCase = p.c; gard.chemin = cheminGardien(p.c, p); gard.etat = 'marche'; }
  if (gard.etat === 'pause') {
    gard.t -= dt; if (gard.forme !== 'assis') montrerForme('assis'); gard.bond = 0;
    const pp = paysanMesh && paysanMesh.position, pres = pp && Math.hypot(pp.x - gard.x, pp.z - gard.z) < 3.5; /* tu passes a cote : il tourne la tete vers toi */
    let ty = 0; if (pres) { let a = Math.atan2(pp.x - gard.x, pp.z - gard.z) - gard.ry; a = Math.atan2(Math.sin(a), Math.cos(a)); ty = Math.max(-0.7, Math.min(0.7, a)); }
    gard.tey = (gard.tey || 0) + (ty - (gard.tey || 0)) * Math.min(1, dt * 4);
    poseGardien(gard.assis, { jambes: REPOS_JAMBES, tey: gard.tey, qy: Math.sin(s * 1.3) * 0.18, te: Math.sin(s * 0.7) * 0.03 });
    if (gard.t <= 0) partirBalade();
    return;
  }
  if (gard.etat !== 'marche') { gard.etat = 'pause'; gard.t = 2; return; }
  if (gard.forme !== 'calme') montrerForme('calme');
  const p = gard.chemin && gard.chemin[0];
  if (!p) { gard.etat = 'pause'; gard.t = 5 + Math.random() * 8; poseGardien(gard.calme, { jambes: REPOS_JAMBES }); return; }
  const dx = p.x - gard.x, dz = p.z - gard.z, d = Math.hypot(dx, dz), pas = V * dt;
  if (d <= pas) { gard.x = p.x; gard.z = p.z; gard.chemin.shift(); if (p.y !== undefined) gard.y = p.y; }
  else { gard.x += dx / d * pas; gard.z += dz / d * pas; let a = Math.atan2(dx, dz) - gard.ry; a = Math.atan2(Math.sin(a), Math.cos(a)); gard.ry += a * Math.min(1, dt * 5); }
  gard.pas += V * dt * 3.4; const P = marcheGardien(gard.pas); gard.bond = P.bond; poseGardien(gard.calme, P);
}
function cheminGardien(c, fin) { /* les cases du trajet, en points ; on finit au point voulu dans la derniere */
  const de = caseIci(gard.x, gard.z) || c; const ch = c && de ? trajet(de, c) : null; if (!ch) return [fin];
  const L = ch.slice(1).map((x) => { const q = posCase(x); return { x: q.x + (Math.random() - 0.5) * 0.5, y: q.y, z: q.z + (Math.random() - 0.5) * 0.5 }; });
  if (fin) { if (L.length) L.pop(); L.push(fin); } return L;
}
function partirBalade() {
  if (Math.random() < 0.3) { gard.etat = 'retour'; return; } /* (de temps en temps, il revient s'asseoir devant chez lui) */
  const o = blocBati('niche'); if (!o) return;
  const L = S_.cases.filter((c) => PASSABLE[c.type] && c.type !== 'champ' && Math.hypot(posCase(c).x - o.x, posCase(c).z - o.z) <= 3.2 * S && !(S_.sauvage && S_.sauvage.id === c.id));
  const c = L.length ? hasard(L) : null; if (!c) { gard.t = 4; return; }
  const q = posCase(c); gard.chemin = cheminGardien(c, { x: q.x + (Math.random() - 0.5) * 0.8, y: q.y, z: q.z + (Math.random() - 0.5) * 0.8 }); gard.etat = 'marche';
}
/* un clic sur l'animal : la caresse (le clic qui deplace, lui, emmene le perso pres de lui) */
const clicGardien = (o) => { for (let x = o; x; x = x.parent) if (x.userData && x.userData.gardien) return true; return false; };
