'use strict';
/* LE LABO A PLUSIEURS, PREMIER TEMPS DE L'ETAPE 3 DU MULTIJOUEUR (28/11/2026, « ok vas-y lance », Mathieu ; jeu-ferme/MULTIJOUEUR.md) :
   - le chef du groupe lance le laboratoire du Docteur Wabbenstein quand tous les membres sont connectes, sur leur ferme et prets ; tout le groupe part en
     montgolfiere en meme temps et arrive au meme ponton ;
   - dans le labo, chacun voit les autres persos : position, direction, marche ou arret, classe (apparence de base, sans leur equipement), nom au-dessus de la tete ;
   - PAS ENCORE le combat partage (deuxieme temps) : chacun a ses propres monstres, dans son propre labo ; on se voit, on ne se bat pas ensemble.
   - Rien n'est enregistre ni gagne : un joueur qui n'est pas deja en mode test passe dans un « essai » le temps du labo (comme le mode test : pas de sauvegarde,
     ni locale ni en ligne), et « Rentrer a la ferme » recharge la page, qui rend la vraie partie.
   Comment : les canaux temps reel du serveur de l'alliance (Supabase Realtime, diffusion et presence), un canal par groupe, nomme par l'identifiant du groupe
   (impossible a deviner) ; presence = qui est connecte et ou (ferme, combat, labo) ; diffusion = le depart et les positions (10 par seconde au plus, seulement
   quand on bouge, et une fois toutes les 2 s a l'arret). Aucune table, aucune fonction serveur de plus.
   Version dev : seulement pour ceux qui voient les Contacts (contactsVisibles : mode test, sortie du palier 11, comptes d'essai). */
const MULTI = { sb: null, canal: null, groupe: null, moi: null, pret: false, presents: {}, etatEnvoye: '', avatars: new Map(), essai: false, dernier: null, tEnvoi: 0, nEnvoi: 0, nRecu: 0, boucle: false, depart: 0 };
const MULTI_PAS = { envoi: 100, battement: 2000, perdu: 8000, saut: 8 }; /* (envoi : 10 par seconde au plus ; battement : a l'arret ; perdu : plus de nouvelles ; saut : au-dela, il se pose d'un coup) */
const multiOk = () => typeof contactsVisibles === 'function' && contactsVisibles() && !!window.supabase;
const etatMulti = () => (typeof lieu !== 'undefined' && lieu === 'donjon' ? 'donjon' : combat ? 'combat' : typeof lieu !== 'undefined' && lieu === 'ferme' ? 'ferme' : 'ailleurs');
const pseudoMulti = () => (CONTACTS.data && CONTACTS.data.moi && CONTACTS.data.moi.pseudo) || (S_ && S_.perso && S_.perso.nom) || 'Joueur';
function clientTempsReel() { if (!MULTI.sb) MULTI.sb = window.supabase.createClient(SB_URL, SB_CLE, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'ferme-temps-reel' }, realtime: { params: { eventsPerSecond: 20 } } }); return MULTI.sb; }
function fermerCanalMulti() {
  if (MULTI.canal) { try { MULTI.canal.send({ type: 'broadcast', event: 'quitte', payload: { id: MULTI.moi } }); } catch (e) { /* rien */ } try { MULTI.sb.removeChannel(MULTI.canal); } catch (e) { /* rien */ } }
  MULTI.canal = null; MULTI.groupe = null; MULTI.pret = false; MULTI.presents = {}; MULTI.etatEnvoye = ''; viderAvatars();
}
/* le canal suit le groupe : ouvert des qu'on est dans un groupe (relu par les Contacts), ferme sinon */
function majCanalGroupe() {
  const g = typeof monGroupe === 'function' ? monGroupe() : null, id = g && g.id, moi = CONTACTS.gr && CONTACTS.gr.moi;
  if (!multiOk() || !id || !moi) { if (MULTI.canal) fermerCanalMulti(); return; }
  if (MULTI.canal && MULTI.groupe === id) { suivrePresence(); return; }
  fermerCanalMulti(); MULTI.groupe = id; MULTI.moi = moi;
  const ch = clientTempsReel().channel('ferme-grp-' + id, { config: { broadcast: { self: false, ack: false }, presence: { key: moi } } });
  ch.on('presence', { event: 'sync' }, () => { const st = ch.presenceState(), P = {}; Object.keys(st).forEach((k) => { const L = st[k] || []; if (L.length) P[k] = L[L.length - 1]; }); MULTI.presents = P;
    MULTI.avatars.forEach((A, k) => { if (!P[k]) retirerAvatar(k); }); if (typeof modaleOuverte !== 'undefined' && modaleOuverte === 'contacts' && CONTACTS.onglet === 'groupe') redessinerContacts(); });
  ch.on('broadcast', { event: 'pos' }, ({ payload }) => recevoirPos(payload));
  ch.on('broadcast', { event: 'depart' }, ({ payload }) => recevoirDepart(payload));
  ch.on('broadcast', { event: 'quitte' }, ({ payload }) => { if (payload && payload.id) retirerAvatar(payload.id); });
  ch.subscribe((s) => { if (s === 'SUBSCRIBED') { MULTI.pret = true; suivrePresence(true); } });
  MULTI.canal = ch;
}
function suivrePresence(force) {
  if (!MULTI.canal || !MULTI.pret) return; const e = etatMulti(), cl = (S_ && S_.perso && S_.perso.classe) || 'iop', cle = e + '|' + cl + '|' + pseudoMulti();
  if (!force && cle === MULTI.etatEnvoye) return; MULTI.etatEnvoye = cle;
  try { MULTI.canal.track({ id: MULTI.moi, pseudo: pseudoMulti(), classe: cl, etat: e }); } catch (e2) { /* rien */ }
}
/* ---- le depart ---- */
function departPossible() { /* [ok, raison] : tous les membres connectes au canal, sur leur ferme, et prets (le chef lance : il n'a pas besoin de se dire pret) */
  const g = monGroupe(); if (!g || !MULTI.canal || !MULTI.pret) return [false, 'Connexion au groupe…'];
  if (combat || lieu !== 'ferme') return [false, 'Rentre sur ta ferme, hors combat.'];
  const manque = []; (g.membres || []).forEach((m) => { if (m.id === MULTI.moi) return; const p = MULTI.presents[m.id];
    if (!p) manque.push(echapper(m.pseudo) + ' (pas connecté)'); else if (p.etat !== 'ferme') manque.push(echapper(m.pseudo) + (p.etat === 'donjon' ? ' (déjà au labo)' : ' (en combat)')); else if (!m.pret) manque.push(echapper(m.pseudo) + ' (pas prêt)'); });
  if ((g.membres || []).length < 2) return [false, 'Invite au moins un ami.'];
  return manque.length ? [false, 'En attente : ' + manque.join(', ') + '.'] : [true, ''];
}
function lancerDepartGroupe() {
  const [ok, raison] = departPossible(); if (!ok) { toast(raison || 'Pas encore.', 'alerte'); return; }
  const g = monGroupe(), ids = (g.membres || []).map((m) => m.id);
  try { MULTI.canal.send({ type: 'broadcast', event: 'depart', payload: { chef: MULTI.moi, membres: ids, t: Date.now() } }); } catch (e) { toast('Le départ n\'a pas pu partir, réessaie.', 'alerte'); return; }
  lancerLaboMulti();
}
function recevoirDepart(P) {
  if (!P || !Array.isArray(P.membres) || !P.membres.includes(MULTI.moi) || P.chef === MULTI.moi) return;
  if (combat || lieu !== 'ferme') { toast('Ton groupe part au labo, mais tu es occupé : il partira sans toi.', 'alerte'); return; }
  toast('Ton chef lance le laboratoire du Docteur Wabbenstein : en route !', 'or'); lancerLaboMulti();
}
function lancerLaboMulti() {
  if (!MODE_TEST) { try { sauver(); } catch (e) { /* rien */ } MULTI.essai = true; MODE_TEST = true; } /* (l'essai : plus rien n'est enregistre, comme le mode test ; la vraie partie revient au retour) */
  MULTI.depart = Date.now(); MULTI.dernier = null; suivrePresence(true);
  try { fermerModale(); } catch (e) { /* rien */ } Promise.resolve(partirDonjon()).catch(() => {}).then(() => suivrePresence(true));
}
/* le retour : dans l'essai, la page se recharge et rend la vraie partie */
{ const am0 = actionMontgolfiere; actionMontgolfiere = function (a) { if (MULTI.essai && a === 'rentrer') { fermerCanalMulti(); toast('Retour à la ferme…', 'or'); setTimeout(() => location.reload(), 300); return; } return am0.apply(this, arguments); }; }
{ const rf0 = rentrerFerme; rentrerFerme = function () { if (MULTI.essai) { fermerCanalMulti(); setTimeout(() => location.reload(), 300); return Promise.resolve(false); } return rf0.apply(this, arguments); }; }
/* ---- les positions ---- */
setInterval(() => {
  try { if (!MULTI.canal || !MULTI.pret) return; suivrePresence(); if (lieu !== 'donjon' || !paysanMesh) return;
    const p = paysanMesh.position, a = paysanMesh.userData.angle != null ? paysanMesh.userData.angle : paysanMesh.rotation.y, d = MULTI.dernier, now = performance.now();
    const bouge = !d || Math.hypot(p.x - d.x, p.z - d.z) > 0.02 || Math.abs(p.y - d.y) > 0.05, tourne = !d || Math.abs(a - d.a) > 0.05, m = bouge ? 1 : 0;
    if (!(bouge || tourne || !d || m !== d.m || now - MULTI.tEnvoi > MULTI_PAS.battement)) return;
    const P = { id: MULTI.moi, x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), a: +a.toFixed(2), m, c: (S_ && S_.perso && S_.perso.classe) || 'iop', n: pseudoMulti() };
    MULTI.canal.send({ type: 'broadcast', event: 'pos', payload: P }).catch(() => {}); MULTI.dernier = { x: p.x, y: p.y, z: p.z, a, m }; MULTI.tEnvoi = now; MULTI.nEnvoi++;
  } catch (e) { /* rien */ }
}, MULTI_PAS.envoi);
function recevoirPos(P) {
  if (!P || !P.id || P.id === MULTI.moi) return; MULTI.nRecu++;
  if (lieu !== 'donjon') return; let A = MULTI.avatars.get(P.id); if (!A) { A = creerAvatar(P); if (!A) return; MULTI.avatars.set(P.id, A); }
  A.cible = P; A.vu = performance.now(); if (!MULTI.boucle) { MULTI.boucle = true; requestAnimationFrame(boucleAvatars); }
}
/* l'apparence de base de sa classe (sans son equipement) et son nom au-dessus de la tete */
function creerAvatar(P) {
  const cl = { iop: 'iop', cra: 'cra', osa: 'osa' }[P.c] || 'iop', mUse = { iop: 'iop3', osa: 'osa', cra: 'cra' }[cl]; if (!MODELES[mUse]) return null;
  const g = cloner(mUse); { const e0 = g.scale.x; g.scale.setScalar(1); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); try { elargirPerso(g, cl); } catch (e) { /* rien */ } g.scale.setScalar(e0); }
  g.rotation.order = 'YXZ'; g.traverse((o) => { o.raycast = () => {}; });
  const u = { membres: ['pivot_jambeG', 'pivot_jambeD', 'pivot_brasG', 'pivot_brasD'].map((n) => g.getObjectByName(n)), genoux: ['pivot_genouG', 'pivot_genouD'].map((n) => g.getObjectByName(n)), haut: g.getObjectByName('haut'), pas: 0, ampl: 0 };
  const W = new T.Group(); W.add(g); try { ombrePieds(g, 1.4); } catch (e) { /* rien */ }
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const cx = cv.getContext('2d'); cx.font = 'bold 30px Lilita One, Quicksand, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.lineWidth = 7; cx.strokeStyle = 'rgba(20,16,12,0.9)'; const nom = String(P.n || (MULTI.presents[P.id] || {}).pseudo || 'Joueur').slice(0, 18); cx.strokeText(nom, 128, 34); cx.fillStyle = '#ffe7a6'; cx.fillText(nom, 128, 34);
  const tex = new T.CanvasTexture(cv), mat = new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }), sp = new T.Sprite(mat); sp.scale.set(2.4, 0.6, 1); sp.position.y = 2.55; sp.renderOrder = 8; W.add(sp);
  W.position.set(P.x, P.y, P.z); g.rotation.y = P.a; scene.add(W);
  return { W, g, u, tex, sp, cible: P, vu: performance.now(), classe: cl };
}
function retirerAvatar(id) { const A = MULTI.avatars.get(id); if (!A) return; MULTI.avatars.delete(id); try { A.tex.dispose(); A.sp.material.dispose(); } catch (e) { /* rien */ } jeter(A.W); }
function viderAvatars() { [...MULTI.avatars.keys()].forEach(retirerAvatar); }
let tAvatars = 0;
function boucleAvatars(t) {
  const dt = Math.min(0.1, tAvatars ? (t - tAvatars) / 1000 : 0.016); tAvatars = t;
  if (lieu !== 'donjon') viderAvatars();
  const now = performance.now();
  MULTI.avatars.forEach((A, id) => {
    if (now - A.vu > MULTI_PAS.perdu && !MULTI.presents[id]) { retirerAvatar(id); return; }
    const P = A.cible, W = A.W, dx = P.x - W.position.x, dy = P.y - W.position.y, dz = P.z - W.position.z, D = Math.hypot(dx, dz);
    if (D > MULTI_PAS.saut) W.position.set(P.x, P.y, P.z); else { const k = 1 - Math.exp(-dt * 12); W.position.x += dx * k; W.position.y += dy * k; W.position.z += dz * k; }
    let da = P.a - A.g.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); A.g.rotation.y += da * (1 - Math.exp(-dt * 14));
    const u = A.u, marche = P.m && now - A.vu < 600 ? 1 : 0; u.ampl += (marche - u.ampl) * Math.min(1, dt * 8); u.pas += dt * 9 * marche; if (u.ampl < 0.01 && u.pas) u.pas = Math.round(u.pas / Math.PI) * Math.PI;
    const a = u.ampl, ph = u.pas, m = u.membres; /* (la marche du perso, animerPas de 24-deplacement.js, appliquee a cet avatar) */
    if (m[0]) m[0].rotation.x = Math.sin(ph) * 0.62 * a; if (m[1]) m[1].rotation.x = -Math.sin(ph) * 0.62 * a; if (m[2]) m[2].rotation.x = -Math.sin(ph - 0.3) * 0.48 * a; if (m[3]) m[3].rotation.x = Math.sin(ph - 0.3) * 0.48 * a;
    const gn = u.genoux; if (gn[0]) gn[0].rotation.x = Math.pow(Math.max(0, -Math.cos(ph)), 1.3) * 0.95 * a; if (gn[1]) gn[1].rotation.x = Math.pow(Math.max(0, Math.cos(ph)), 1.3) * 0.95 * a;
    if (u.haut) u.haut.rotation.y = -Math.sin(ph) * 0.1 * a; A.g.rotation.z = Math.sin(ph) * 0.03 * a; A.g.rotation.x = 0.08 * a; A.g.position.y = Math.abs(Math.sin(ph)) * 0.05 * a;
  });
  if (MULTI.avatars.size) requestAnimationFrame(boucleAvatars); else { MULTI.boucle = false; tAvatars = 0; }
}
/* ---- l'onglet Groupe : le depart du labo ---- */
{ const vg0 = vueGroupe; vueGroupe = function () { const h = vg0.apply(this, arguments), g = monGroupe(); if (!g || !multiOk()) return h;
    const chef = suisChef(), [ok, raison] = departPossible(), co = (g.membres || []).filter((m) => m.id === MULTI.moi || MULTI.presents[m.id]).length;
    return h + '<div class="hdv-section">Le labo à plusieurs (essai)</div><p class="hdv-aide">Le chef lance le laboratoire du Docteur Wabbenstein quand tout le monde est prêt et sur sa ferme : vous partez ensemble et vous vous voyez sur l’île. Pour l’instant, chacun a ses propres monstres, et rien n’est enregistré ni gagné.</p>'
      + '<p class="hdv-aide">Connectés au groupe : ' + co + ' sur ' + (g.membres || []).length + '.</p>'
      + (chef ? '<div class="ct-boutons"><button class="btn kamas" data-multi-lancer' + (ok ? '' : ' disabled') + '>Lancer le labo</button></div>' + (ok ? '' : '<div class="ct-msg">' + raison + '</div>') : '<p class="ct-vide">Le chef lancera le départ quand tout le monde sera prêt.</p>'); }; }
document.addEventListener('click', (ev) => { const b = ev.target && ev.target.closest ? ev.target.closest('[data-multi-lancer]') : null; if (b) { ev.stopPropagation(); lancerDepartGroupe(); } }, true);
/* le canal suit chaque relecture des Contacts (et l'entree en mode test) */
{ const cc0 = chargerContacts; chargerContacts = function () { return cc0.apply(this, arguments).then((r) => { try { majCanalGroupe(); } catch (e) { /* rien */ } return r; }); }; }
window.addEventListener('pagehide', () => { try { fermerCanalMulti(); } catch (e) { /* rien */ } });
