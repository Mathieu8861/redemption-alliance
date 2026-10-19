'use strict';
/* ===================== LES COMPTES ET LA SAUVEGARDE EN LIGNE (beta, 11/10/2026) =====================
   Decisions de Mathieu : beta fermee a 4 ou 5 testeurs (« pour toute l'alli j'ouvrirai quand on aura passe les phases de beta test ») ;
   les membres de l'alliance se connectent avec leur compte du site (Discord, comme Steam : pas de mot de passe), les autres avec un compte
   de jeu (pseudo + mot de passe, cree a la main, le mot de passe se choisit a la premiere connexion). La ferme va dans la base du site
   (DAMOCLES/sql/065), avec la progression en clair (niveau, vague...) pour plus tard ; rien n'est affiche sur le site pour l'instant.
   Chaque envoi dit sur quelle version on a travaille : si un autre appareil (ou onglet) a sauve entre-temps, la base refuse (conflit) et
   le jeu propose de recharger. En local et en mode test, rien ne part (sauf avec &nuage=1). */
const SB_URL = 'https://yebfbdgxikbnqdkbycam.supabase.co', SB_CLE = 'sb_publishable_2bEkqhNcB3JXYG1yQ7pivg_T__Q5OIq';
const LOCALHOTE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const NUAGE_URL = (LOCALHOTE && new URLSearchParams(location.search).get('nuageUrl')) || SB_URL + '/rest/v1/rpc/';
const ENLIGNE = /[?&]nuage=1/.test(location.search) || !(TEST || LOCALHOTE);
const NUAGE_META = CLE + '-nuage', JETON = 'ferme-amakna-jeton';
/* le client du site : meme adresse, meme cle, meme stockage, donc un membre connecte sur le site l'est aussi ici */
const sb = ENLIGNE && window.supabase ? window.supabase.createClient(SB_URL, SB_CLE) : null;
const enLigneSv = { joueur: null, version: 0, sale: false, ecraser: false, compte: null, pseudo: '', invite: false, refus: '', pseudoRefus: '', etat: '', dernier: 0, envoi: false, bloque: false, jwt: null };
try { const m = JSON.parse(localStorage.getItem(NUAGE_META)) || {}; ['joueur', 'version', 'sale', 'ecraser'].forEach((k) => { if (m[k] !== undefined) enLigneSv[k] = m[k]; }); } catch (err) { /* rien */ }
function sauverMeta() { try { localStorage.setItem(NUAGE_META, JSON.stringify({ joueur: enLigneSv.joueur, version: enLigneSv.version, sale: enLigneSv.sale, ecraser: enLigneSv.ecraser })); } catch (err) { /* rien */ } }
function nuageMarquer() { if (!ENLIGNE || enLigneSv.sale) return; enLigneSv.sale = true; sauverMeta(); }
const jetonInvite = () => { try { return localStorage.getItem(JETON) || null; } catch (err) { return null; } };
async function jetonSite() { /* la session du site, rafraichie par supabase-js (en local, &membreTest=1 joue un membre face au faux serveur) */
  const mt = LOCALHOTE && new URLSearchParams(location.search).get('membreTest'); if (mt) return mt === 'autre' ? 'membre-autre' : 'membre-test';
  if (!sb) return null; try { const { data } = await sb.auth.getSession(); return data && data.session ? data.session.access_token : null; } catch (err) { return null; }
}
async function rpc(nom, args, jwt) {
  const corps = JSON.stringify(args), h = { apikey: SB_CLE, 'Content-Type': 'application/json' }; if (jwt) h.Authorization = 'Bearer ' + jwt;
  const r = await fetch(NUAGE_URL + nom, { method: 'POST', headers: h, body: corps, keepalive: corps.length < 60000 });
  if (!r.ok) throw new Error('HTTP ' + r.status); return r.json();
}
async function identifier() { /* au demarrage, en meme temps que les modeles : qui joue, et sa ferme en ligne */
  if (!ENLIGNE) return null;
  try {
    const jeton = jetonInvite(), jwt = jeton ? null : await jetonSite(); enLigneSv.jwt = jwt;
    if (!jeton && !jwt) { enLigneSv.refus = 'deconnecte'; return null; }
    const r = await rpc('ferme_moi', { p_jeton: jeton }, jwt);
    if (!r.ok) { enLigneSv.refus = r.erreur === 'jeton' ? 'deconnecte' : r.erreur; enLigneSv.pseudoRefus = r.pseudo || ''; if (r.erreur === 'jeton') try { localStorage.removeItem(JETON); } catch (err) { /* rien */ } return null; }
    Object.assign(enLigneSv, { compte: r.id, pseudo: r.pseudo || '', invite: !!r.invite, refus: '' }); if (jwt && !r.invite) chargerAvatar(); return r;
  } catch (err) { enLigneSv.refus = 'hors ligne'; return null; }
}
function choisirVersion(n) { /* la ferme de ce navigateur ou celle du compte : la plus recente, et jamais la ferme d'un compte donnee a un autre */
  const ici = charger(), aMoi = enLigneSv.joueur === n.id;
  let prendre = false;
  if (enLigneSv.ecraser && aMoi) prendre = false; /* il vient de recommencer sa ferme */
  else if (n.etat && (!ici || !ici.perso || !aMoi)) prendre = true; /* rien ici, ou la ferme d'un autre compte : celle du compte */
  else if (n.etat) prendre = n.version > enLigneSv.version; /* un autre appareil a joue depuis */
  if (prendre) { localStorage.setItem(CLE, JSON.stringify(n.etat)); S_ = charger() || S_; completerTerrains(); enLigneSv.sale = false; }
  else if (!n.etat && ici && ici.perso && enLigneSv.joueur && !aMoi) { localStorage.removeItem(CLE); S_ = etatInitial(); completerTerrains(); enLigneSv.sale = false; } /* ferme d'un autre compte : pas pour celui-ci */
  else if (!aMoi || n.version !== enLigneSv.version || enLigneSv.ecraser) enLigneSv.sale = true; /* celle d'ici gagne (ou la premiere partie en ligne) : elle part */
  Object.assign(enLigneSv, { joueur: n.id, version: n.version, etat: 'ok', dernier: n.etat ? Date.now() : 0 }); sauverMeta();
}
const resumeFerme = () => ({ niveau: niveau(S_.xp), vague: Math.max(0, valeurCompteur('vagueMax') || 0), kamas: Math.round(S_.kamas || 0), classe: S_.perso && S_.perso.classe, nom: S_.perso && S_.perso.nom });
async function nuageEnvoyer(rapide) { /* rapide : la page se ferme, pas le temps de rafraichir la session */
  if (!ENLIGNE || enLigneSv.envoi || enLigneSv.bloque || !S_ || !S_.perso || enAccueil) return;
  if (!enLigneSv.compte) { if (enLigneSv.refus === 'hors ligne' && !rapide) rattraper(); return; }
  if (!enLigneSv.sale) return;
  enLigneSv.envoi = true; enLigneSv.sale = false; const ecraser = enLigneSv.ecraser; /* (ce qui change pendant l'envoi repartira au suivant) */
  try {
    const jeton = jetonInvite(), jwt = jeton ? null : rapide ? enLigneSv.jwt : await jetonSite(); if (jwt) enLigneSv.jwt = jwt;
    const r = await rpc('ferme_sauver', { p_jeton: jeton, p_etat: S_, p_version: ecraser ? null : enLigneSv.version, p_resume: resumeFerme() }, jwt);
    if (r.ok) { enLigneSv.version = r.version; enLigneSv.ecraser = false; enLigneSv.etat = 'ok'; enLigneSv.dernier = Date.now(); }
    else { enLigneSv.sale = true; if (r.erreur === 'conflit') { enLigneSv.bloque = true; conflitNuage(); } else if (r.erreur === 'deconnecte') { enLigneSv.compte = null; enLigneSv.refus = 'expire'; toast('Ta connexion a expiré : recharge la page pour te reconnecter, ta ferme est gardée ici en attendant.', 'alerte'); } }
  } catch (err) { enLigneSv.sale = true; enLigneSv.etat = 'hors ligne'; } finally { enLigneSv.envoi = false; sauverMeta(); }
}
async function rattraper() { /* pas de connexion au demarrage : des qu'elle revient, la ferme d'ici repart en ligne (ou on demande, si le compte a bouge) */
  if (rattraper.en) return; rattraper.en = true; const n = await identifier(); rattraper.en = false; if (!n) return;
  if (n.etat && (enLigneSv.joueur !== n.id || n.version !== enLigneSv.version)) { enLigneSv.joueur = n.id; enLigneSv.version = n.version; enLigneSv.bloque = true; conflitNuage(); }
  else { enLigneSv.joueur = n.id; enLigneSv.version = n.version; enLigneSv.sale = true; sauverMeta(); nuageEnvoyer(); }
}
function conflitNuage() {
  ouvrirModale('nuage', entete('Ta ferme a avancé ailleurs') + '<div class="confirme"><div class="gros"><img src="assets/icones/grange.png" alt=""></div><p>Elle a été jouée sur un autre appareil ou dans un autre onglet depuis. Recharge-la pour reprendre là où elle en est, ou garde celle-ci : elle remplacera l\'autre.</p><div class="boutons"><button class="btn discret" id="b-nuage-garder">Garder celle-ci</button><button class="btn kamas" id="b-nuage-recharger">Recharger</button></div></div>');
}
function connexionDiscord() { if (sb) sb.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: location.origin + location.pathname } }); }
async function connexionInvite(pseudo, mdp) {
  const r = await rpc('ferme_connexion', { p_pseudo: pseudo, p_mdp: mdp });
  if (!r.ok) return ({ mdp_court: 'Choisis un mot de passe de 6 caractères au moins.', pseudo: 'Ton pseudo : de 3 à 20 lettres ou chiffres (espaces, - et _ permis).',
    pseudo_membre: 'Ce pseudo est celui d\'un membre de Redemption : connecte-toi avec Discord, ou choisis-en un autre.', trop: 'Trop de nouveaux comptes en ce moment : réessaie dans une heure.' })[r.erreur] || 'Pseudo ou mot de passe incorrect.'; /* (19/10/2026 : un pseudo inconnu cree le compte, sql/072) */
  try { localStorage.setItem(JETON, r.jeton); } catch (err) { /* rien */ } location.reload(); return '';
}
async function deconnecter() {
  if (enLigneSv.compte && enLigneSv.sale) await nuageEnvoyer();
  if (enLigneSv.compte && enLigneSv.sale) { toast('Ta ferme n\'a pas pu partir en ligne : reste connecté et réessaie dans un moment.', 'alerte'); return; }
  const j = jetonInvite();
  if (j) { try { await rpc('ferme_deconnexion', { p_jeton: j }); } catch (err) { /* rien */ } try { localStorage.removeItem(JETON); } catch (err) { /* rien */ } }
  else if (sb) { try { await sb.auth.signOut(); } catch (err) { /* rien */ } }
  try { localStorage.removeItem(CLE); localStorage.removeItem(NUAGE_META); } catch (err) { /* rien */ } /* la ferme est en ligne : ce navigateur l'oublie */
  location.reload();
}
function ecranConnexion(carte) {
  const tete = '<h1>Ferme d\'Incarnam</h1><span class="beta">BÊTA</span>';
  if (enLigneSv.refus === 'pas_testeur') { carte.innerHTML = tete + '<div class="bloc"><h3>Bonjour' + (enLigneSv.pseudoRefus ? ' ' + echapper(enLigneSv.pseudoRefus) : '') + ' !</h3><p>La bêta de la ferme est réservée à quelques testeurs pour l\'instant. Elle ouvrira à toute l\'alliance ensuite.</p></div><button class="lien" data-deconnexion>Se connecter avec un autre compte</button>'; return; }
  const formulaire = (msg) => { carte.innerHTML = tete + '<div class="bloc"><h3>Pas de Discord ?</h3><p>Déjà un compte de jeu : ton pseudo et ton mot de passe. Nouveau : choisis un pseudo libre et un mot de passe, ton compte est créé. Note-les bien, ils te servent sur tous tes appareils.</p><label for="cx-pseudo">Ton pseudo</label><input id="cx-pseudo" autocomplete="username" maxlength="30"><label for="cx-mdp">Ton mot de passe <small>(6 caractères au moins)</small></label><input id="cx-mdp" type="password" autocomplete="current-password" maxlength="72">' + (msg ? '<p class="erreur">' + msg + '</p>' : '') + '<button class="btn grand kamas" data-cx-entrer>Entrer dans la ferme</button></div><button class="lien" data-cx-retour>Retour : se connecter avec Discord</button>'; };
  const accueilCx = () => { carte.innerHTML = tete + '<div class="bloc"><h3>Connecte-toi avec Discord</h3><p>Le même compte que sur le site de Redemption : ta ferme est liée à ton profil, tu la retrouves sur tous tes appareils.</p><button class="discord" data-cx-discord>Se connecter avec Discord</button></div><button class="lien" data-cx-mdp>Pas de Discord ? Joue avec un pseudo et un mot de passe</button>'; };
  accueilCx();
  carte.onclick = async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-cx-discord')) { b.disabled = true; b.textContent = 'Direction Discord...'; connexionDiscord(); }
    else if (b.hasAttribute('data-cx-mdp')) { formulaire(''); document.getElementById('cx-pseudo').focus(); }
    else if (b.hasAttribute('data-cx-retour')) accueilCx();
    else if (b.hasAttribute('data-deconnexion')) deconnecter();
    else if (b.hasAttribute('data-cx-entrer')) {
      const p = document.getElementById('cx-pseudo').value.trim(), m = document.getElementById('cx-mdp').value; if (!p || !m) return;
      b.disabled = true; b.textContent = 'Connexion...';
      let msg = ''; try { msg = await connexionInvite(p, m); } catch (err) { msg = 'Pas de connexion au serveur, réessaie dans un moment.'; }
      if (msg) { formulaire(msg); document.getElementById('cx-pseudo').value = p; }
    }
  };
  carte.onkeydown = (e) => { if (e.key === 'Enter') { const b = carte.querySelector('[data-cx-entrer]'); if (b) b.click(); } };
}
/* la photo du profil du site (13/10/2026, « on peut pas voir notre PP Discord ? ») : profiles.avatar_url, la photo Discord reprise a la connexion ou celle
   choisie sur la page Profil, sinon celle de la connexion Discord ; seulement pour un membre connecte au site (pas un compte de jeu) */
const imgAvatar = () => (enLigneSv.avatar ? '<img src="' + echapper(enLigneSv.avatar) + '" alt="" referrerpolicy="no-referrer" onerror="this.remove()">' : '');
async function chargerAvatar() {
  try {
    if (!sb) return; const { data } = await sb.auth.getSession(), u = data && data.session && data.session.user; if (!u) return;
    const { data: p } = await sb.from('profiles').select('avatar_url').eq('id', u.id).maybeSingle(), m = u.user_metadata || {};
    const url = (p && p.avatar_url) || m.avatar_url || m.picture; if (!url || !/^https:\/\//.test(url)) return;
    enLigneSv.avatar = url; const av = document.querySelector('.connecte .av'); if (av && !av.querySelector('img')) av.insertAdjacentHTML('beforeend', imgAvatar());
  } catch (err) { /* l'initiale reste */ }
}
function bandeauCompte() { /* en haut de l'accueil : qui est connecte */
  if (!ENLIGNE) return '';
  if (!enLigneSv.compte) return '<div class="connecte hors"><div><b>Pas de connexion</b><span>Ta ferme se charge depuis ce navigateur et partira en ligne dès que possible.</span></div></div>';
  return '<div class="connecte"><span class="av">' + echapper((enLigneSv.pseudo || '?').charAt(0).toUpperCase()) + imgAvatar() + '</span><div><b>' + echapper(enLigneSv.pseudo) + '</b><span>' + (enLigneSv.invite ? 'Compte de jeu' : 'Membre de Redemption, connecté avec Discord') + '</span></div><button data-deconnexion>Changer</button></div>';
}
function infoCompte() {
  if (!ENLIGNE) return 'Mode test : la ferme reste dans ce navigateur.';
  if (!enLigneSv.compte) return 'Pas de connexion pour l\'instant : ta ferme est gardée dans ce navigateur et partira en ligne dès que possible.';
  return 'Connecté : ' + echapper(enLigneSv.pseudo) + (enLigneSv.invite ? ' (compte de jeu). ' : ' (compte Discord du site). ') +
    (enLigneSv.etat === 'hors ligne' ? 'Pas de connexion pour l\'instant : elle partira en ligne dès que possible.' : enLigneSv.dernier ? 'Sauvegardée en ligne il y a ' + dureeLisible(Date.now() - enLigneSv.dernier) + '.' : 'Elle part en ligne dans un instant.') +
    ' Connecte-toi sur n\'importe quel appareil pour la retrouver.';
}
const echapper = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
setInterval(() => { if (enLigneSv.bloque) { if (!modaleOuverte) conflitNuage(); return; } nuageEnvoyer(); }, 15000);
document.addEventListener('visibilitychange', () => { if (document.hidden) nuageEnvoyer(true); });
addEventListener('pagehide', () => nuageEnvoyer(true));
/* plus de champ fixe : l'ile est en herbe, toute parcelle (y compris celles du depart) se deplace ou se remet en herbe */
const parcelleAjoutee = (p) => p.type === 'champ';
/* le quota de parcelles : 8 sur l'ile, plus 70 % des cases de chaque terrain achete ; on laboure ou l'on veut dans ce quota */
const QUOTA_ILE = 8;
const quotaParcelles = () => QUOTA_ILE + TERRAINS.filter((t) => S_.terrains[t.id]).reduce((n, t) => n + t.parcelles, 0); /* chaque terrain : beaucoup de cases, quelques parcelles */
const parcelles = () => S_.cases.filter((c) => c.type === 'champ').length;
let mode = null, aDeplacer = null, aPoser = null; /* (aPoser : la decoration a poser, en mode 'poserDeco') mode amenagement : 'choisir' une parcelle, puis 'deplacer' vers une case d'herbe */
/* choisir un element a deplacer : une parcelle, un batiment, une tour, ou l'enclos (qu'on amenage) */
function selectionner(p) {
  if (p.type === 'champ') { aDeplacer = p; mode = 'deplacer'; }
  else if (BATIS[p.type]) { aDeplacer = { bat: p.type }; mode = 'deplacerBat'; }
  else if (p.type === 'tour') { aDeplacer = { tour: p }; mode = 'deplacerBat'; }
  else if (p.type === 'arbre') { aDeplacer = { arbre: p.arbre }; mode = 'deplacerBat'; }
  else if (p.type === 'deco') { aDeplacer = { deco: p }; mode = 'deplacerBat'; }
  else if (p.type === 'enclos') { aDeplacer = null; mode = 'enclos'; }
  else return false;
  majBandeau(); return true;
}
let selectionMesh = null;
/* les cases ou l'element choisi peut aller (en vert) : herbe libre, la place pour son emprise, et rien ne devient inaccessible */
function destinationsValides() {
  const libres = S_.cases.filter((c) => c.type === 'libre' && !(S_.sauvage && S_.sauvage.id === c.id));
  if (mode === 'deplacer' || mode === 'poserTour' || mode === 'poserDeco') return libres;
  const coupe = () => false; /* plus de refus pour un acces coupe */
  if (aDeplacer.tour || aDeplacer.arbre || aDeplacer.deco || aDeplacer.piece !== undefined) {
    const src = aDeplacer.tour || aDeplacer.deco || S_.cases.find((c) => c.type === 'arbre' && c.arbre === aDeplacer.arbre), t0 = src && src.type;
    return libres.filter((c) => { if (src) src.type = 'libre'; c.type = 'tour'; const ok = !coupe(); c.type = 'libre'; if (src) src.type = t0; return ok; });
  }
  const type = aDeplacer.bat, o = blocBati(type); if (!o) return [];
  return libres.filter((c) => {
    const cells = essaiPose(type, c); if (!cells) return false;
    o.B.forEach((x) => { x.type = 'libre'; }); cells.forEach((x) => { x.type = type; }); const ok = !coupe();
    cells.forEach((x) => { x.type = 'libre'; }); o.B.forEach((x) => { x.type = type; }); return ok;
  });
}
function majSelection() { /* l'element choisi : ses cases en jaune */
  if (selectionMesh) { scene.remove(selectionMesh); selectionMesh = null; }
  if (mode === 'poserTour' || mode === 'poserDeco') return; /* (retour de Mathieu : pas de cases vertes, on pose ou l'on veut) */
  if (!aDeplacer || !(mode === 'deplacer' || mode === 'deplacerBat')) return;
  const vert = new T.Group(); scene.add(vert);
  /* (plus de cases vertes) */
  if ((aDeplacer.arbre || aDeplacer.piece !== undefined) && mode === 'deplacerBat') { /* un arbre, ou une lanterne a sa place : un rond jaune a son pied */
    const m = aDeplacer.arbre ? arbresMesh[aDeplacer.arbre] : { position: MODELES.piecesIle[aDeplacer.piece].base }; if (!m) return; const r = new T.Mesh(new T.RingGeometry(0.6, 0.85, 32), new T.MeshBasicMaterial({ color: '#f2b630', transparent: true, opacity: 0.8, depthWrite: false, depthTest: false, side: T.DoubleSide }));
    r.rotation.x = -Math.PI / 2; r.position.set(m.position.x, m.position.y + 0.1, m.position.z); r.renderOrder = 3; vert.add(r); selectionMesh = vert; return;
  }
  const cells = mode === 'deplacer' ? [aDeplacer] : aDeplacer.tour ? [aDeplacer.tour] : aDeplacer.deco ? [aDeplacer.deco] : S_.cases.filter((c) => c.type === aDeplacer.bat);
  const g = new T.Group(), m = new T.MeshBasicMaterial({ color: '#f2b630', transparent: true, opacity: 0.4, depthWrite: false, depthTest: false });
  cells.forEach((c) => { const q = posCase(c), pl = new T.Mesh(new T.PlaneGeometry(S - 0.15, S - 0.15), m); pl.rotation.x = -Math.PI / 2; pl.position.set(q.x, q.y + 0.1, q.z); pl.renderOrder = 3; g.add(pl); });
  vert.add(g); selectionMesh = vert;
}
function majBandeau() {
  const b = document.getElementById('bandeau'); b.hidden = !mode;
  document.getElementById('b-tourner').hidden = !((mode === 'deplacerBat' && aDeplacer && (aDeplacer.bat || aDeplacer.arbre || aDeplacer.deco)) || mode === 'enclosDeplacer');
  document.getElementById('b-ranger').hidden = !(mode === 'deplacerBat' && aDeplacer && (aDeplacer.arbre || aDeplacer.deco || aDeplacer.piece !== undefined)); document.getElementById('b-mes-decos').hidden = mode !== 'choisir';
  { const be = document.getElementById('b-enclos-bouger'); be.hidden = !(mode === 'enclos' || mode === 'enclosDeplacer'); be.textContent = mode === 'enclosDeplacer' ? 'Ajouter ou rendre des cases' : 'Déplacer tout l\'enclos'; }
  majSelection();
  const o = mode === 'deplacerBat' && aDeplacer && blocBati(aDeplacer.bat);
  document.getElementById('bandeau-texte').textContent = mode === 'deplacer' ? 'Parcelle choisie : touche une case d\'herbe libre pour la déplacer, autant de fois que tu veux, puis Terminer.'
    : mode === 'deplacerBat' && aDeplacer && aDeplacer.deco ? texteDeco(aDeplacer.deco.deco)
    : mode === 'deplacerBat' && aDeplacer && aDeplacer.piece !== undefined ? DECOS[MODELES.piecesIle[aDeplacer.piece].genre].nom + ' : touche une case d\'herbe libre pour la poser ailleurs, ou Ranger pour la mettre dans tes décorations.'
    : mode === 'deplacerBat' && aDeplacer && aDeplacer.arbre ? 'Arbre choisi : touche une case d\'herbe libre pour le replanter, Tourner pour le pivoter, Ranger pour le mettre dans tes décorations, puis Terminer.'
    : mode === 'deplacerBat' && aDeplacer && aDeplacer.tour ? 'Tour choisie : touche une case d\'herbe libre pour la poser, autant de fois que tu veux, puis Terminer.'
    : mode === 'deplacerBat' ? BATIS[aDeplacer.bat][0].toUpperCase() + BATIS[aDeplacer.bat].slice(1) + ' : touche où le poser, autant de fois que tu veux, Tourner pour le pivoter, puis Terminer' + (o ? ' (' + o.w + ' x ' + o.h + ' case' + (o.w * o.h > 1 ? 's' : '') + ' d\'herbe libre' + (o.w * o.h > 1 ? 's' : '') + ')' : '') + '.'
    : mode === 'poserDeco' && DECOS[aPoser] ? DECOS[aPoser].nom + ' (' + nbDecos(aPoser) + ' en réserve) : touche une case d\'herbe libre pour ' + DECOS[aPoser].pr + ' poser.'
    : mode === 'poserTour' ? 'Tour de défense (' + fmt(PRIX_TOUR[Math.min(nbTours(), PRIX_TOUR.length - 1)]) + ' kamas) : touche une case d\'herbe pour la construire.'
    : mode === 'enclos' ? texteEnclos()
    : mode === 'enclosDeplacer' ? 'Déplacer l\'enclos : touche une case d\'herbe, il s\'y installe autour, Bouftous compris' + (DOIGT ? '.' : ' (en vert : il rentre, en rouge : pas la place).')
    : 'Aménagement : touche une parcelle, un bâtiment, une tour, un arbre, une décoration ou l\'enclos pour le déplacer.';
  marquerEnclos();
}
const occupees = () => S_.cases.filter((c) => c.type !== 'libre' && c.type !== 'chemin').length;
const plafond = () => Math.floor(S_.cases.length * PART_CONSTRUCTIBLE);

