'use strict';
/* LES CONTACTS, ETAPE 1 DU MULTIJOUEUR (27/11/2026, « un petit carre qui s'appelle Contacts ; pour inviter quelqu'un en ami, il faut avoir son pseudo ou son ID,
   lui envoyer une invitation, et qu'il puisse l'accepter ; dans Contacts, il faut plusieurs onglets », Mathieu ; proposition et choix dans MULTIJOUEUR.md) :
   - un bouton « Contacts » dans la barre du bas, avec une pastille quand une demande d'ami attend ;
   - trois onglets : Amis (pseudo, classe, niveau, en ligne ou vu il y a combien), Demandes (recues : accepter ou refuser ; envoyees : annuler),
     Ajouter (son pseudo a donner, un champ pour le pseudo d'un autre ; le code ami est retire le 27/11 : « comment quelqu'un connait son ID ? via le pseudo, chaque pseudo unique ») ; l'onglet Groupe viendra a l'etape 2 ;
   - le serveur : DAMOCLES/sql/088-ferme-amis.sql (ferme_amis, ferme_ami_demander, ferme_ami_repondre, ferme_ami_retirer), avec le jeton du joueur
     comme la sauvegarde ; en local, outils/faux-nuage.mjs fait pareil.
   VERSION DEV : le bouton n'apparait que dans le mode test. Les Contacts parlent au serveur meme en mode test (ce ne sont pas des donnees de la ferme,
   que le mode test n'enregistre pas). */
const CONTACTS = { onglet: 'amis', data: null, gr: null, charge: null, recues: 0, invitesGr: 0, msg: '', msgOk: false, retirer: null, quitter: false, tPoll: 0 };
/* (27/11/2026, « Mirabelle c'est ma copine, ça irait pour test ? », Mathieu : les Contacts s'ouvrent aussi, hors mode test, aux comptes de ferme d'essai :
   celui de Mathieu et celui de Mirabelle ; les autres joueurs ne voient rien) */
const CONTACTS_TESTEURS = TESTEURS_ULTI.concat(['0e4a38df-c77a-4785-a60d-cea6ccd0914f', '0bcec130-844c-4a2f-b9f0-1dc63d358e3c']); /* (Mirabelle ; Madazezette, « ajoute le bouton a Mada aussi », Mathieu, 27/11/2026) */
/* (« au palier 11 », Mathieu, 27/11/2026 : les Contacts sortent pour tous avec le palier 11, au meme interrupteur, SORTIE_P11, 02-donnees.js ; p11Ouvert = sortie ou mode test) */
const contactsVisibles = () => (typeof p11Ouvert === 'function' ? p11Ouvert() : typeof MODE_TEST !== 'undefined' && !!MODE_TEST) || !!(typeof enLigneSv !== 'undefined' && enLigneSv.compte && CONTACTS_TESTEURS.includes(enLigneSv.compte));
const CLASSES_CONTACT = { iop: 'Iop', cra: 'Cra', osa: 'Osamodas' };
async function appelContacts(nom, args) { /* (comme rpc(), 05-nuage.js, mais permis en mode test) */
  if (!ENLIGNE) throw new Error('hors ligne');
  const jeton = jetonInvite(), jwt = jeton ? null : await jetonSite(), h = { apikey: SB_CLE, 'Content-Type': 'application/json' }; if (jwt) h.Authorization = 'Bearer ' + jwt;
  const r = await fetch(NUAGE_URL + nom, { method: 'POST', headers: h, body: JSON.stringify(Object.assign({ p_jeton: jeton }, args || {})) });
  if (!r.ok) throw new Error('HTTP ' + r.status); return r.json();
}
async function chargerContacts() {
  if (CONTACTS.charge) return CONTACTS.charge;
  return (CONTACTS.charge = Promise.all([appelContacts('ferme_amis', {}), appelContacts('ferme_groupe_moi', {}).catch(() => null)]).then(([r, g]) => { CONTACTS.data = r; CONTACTS.gr = g && g.ok ? g : null; CONTACTS.recues = r && r.ok ? (r.recues || []).length : 0;
      const nG = CONTACTS.gr ? (CONTACTS.gr.recues || []).length : 0; if (nG > CONTACTS.invitesGr && CONTACTS.gr.recues[0]) toast(echapper(CONTACTS.gr.recues[0].chef) + ' t\'invite dans son groupe : ouvre Contacts, onglet Groupe.', 'or'); CONTACTS.invitesGr = nG; majPastilleContacts(); return r; })
    .catch((e) => { CONTACTS.data = { ok: false, erreur: String(e.message) === 'hors ligne' ? 'hors ligne' : 'reseau' }; return CONTACTS.data; }).finally(() => { CONTACTS.charge = null; }));
}
const ERREURS_CONTACTS = { inconnu: 'Aucun joueur ne porte ce pseudo.', plusieurs: 'Deux joueurs portent ce pseudo : préviens Mathieu.', toi: 'C’est toi !',
  deja_amis: 'Vous êtes déjà amis.', deja_demande: 'Ta demande est déjà partie, elle attend sa réponse.', trop_amis: 'Tu as atteint 50 amis.', trop_demandes: 'Tu as déjà 20 demandes en attente.',
  trop_vite: 'Trop de demandes d’un coup : réessaie dans une heure.', plein_ami: 'Ce joueur a trop de demandes en attente.', deconnecte: 'Connecte-toi pour retrouver tes amis.',
  introuvable: 'Cette demande n’existe plus.', sans_groupe: 'Tu n’es dans aucun groupe.', pas_chef: 'Seul le chef du groupe peut faire ça.', pas_ami: 'Tu ne peux inviter que tes amis.',
  deja_groupe: 'Tu es déjà dans un groupe.', deja_groupe_lui: 'Ce joueur est déjà dans un groupe.', deja_invite: 'Il est déjà invité, il doit répondre.', plein: 'Le groupe est complet : 5 joueurs au plus.', reseau: 'Le serveur ne répond pas : réessaie dans un instant.', 'hors ligne': 'Les Contacts ont besoin d’être en ligne.' };
const errContacts = (e) => ERREURS_CONTACTS[e] || 'Ça n’a pas marché, réessaie.';
const vuIlYa = (t) => { if (!t) return 'pas encore venu'; const m = Math.max(0, Math.round((Date.now() - new Date(t).getTime()) / 60000)); return m < 60 ? 'vu il y a ' + Math.max(1, m) + ' min' : m < 1440 ? 'vu il y a ' + Math.round(m / 60) + ' h' : 'vu il y a ' + Math.round(m / 1440) + ' j'; };
const icoClasseContact = (c) => (CLASSES_CONTACT[c] ? ico(c === 'osa' ? 'osa' : c) : ico('opt-compte'));
(() => { const st = document.createElement('style'); st.textContent = '.ct-ligne{display:flex;align-items:center;gap:10px;padding:7px 4px;border-bottom:2px solid rgba(255,255,255,.06)}.ct-ligne:last-child{border-bottom:0}'
  + '.ct-ligne .pic{width:42px;height:42px;flex:0 0 42px;margin:0}.ct-ligne .pic img{width:100%;height:100%;object-fit:contain}.ct-ligne .ct-nom{flex:1;min-width:0}.ct-ligne .ct-nom b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ct-ligne small{font-size:.7rem;font-weight:700;color:#a9adb5}'
  + '.ct-point{display:inline-block;width:8px;height:8px;border-radius:50%;background:#6b6f78;margin-right:5px;vertical-align:middle}.ct-point.on{background:#5fd35f;box-shadow:0 0 6px #5fd35f}'
  + '.ct-vide{font-size:.82rem;font-weight:600;color:#a9adb5;padding:10px 4px}.ct-moi{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:4px 0 12px}'
  + '.ct-ajout{display:flex;gap:8px}.ct-ajout input{flex:1;min-width:0;background:#1d1e22;color:#fff;border:3px solid var(--bord);border-radius:10px;padding:8px 10px;font:700 .9rem var(--f-texte)}'
  + '#b-contacts .tuile{--t1:#17707a;--t2:#62d0d6}.ct-msg{font-size:.8rem;font-weight:700;margin-top:8px;color:#ff9b8a}.ct-msg.ok{color:#8fe08a}.ct-act{display:flex;gap:6px;align-items:center}.ct-etiq{font-size:.72rem;font-weight:800;color:#8fe08a}.ct-chef{font-size:.66rem;font-weight:800;background:#f2b630;color:#2a1d05;border-radius:99px;padding:1px 7px;vertical-align:middle}'
  + '.ct-pret{font-size:.66rem;font-weight:800;background:#3d8f3d;color:#fff;border-radius:99px;padding:1px 7px;vertical-align:middle}.ct-boutons{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}';
  document.head.appendChild(st); })();
/* le bouton de la barre du bas, apres le Bestiaire */
function boutonContacts() {
  let b = document.getElementById('b-contacts'); if (b) return b; const best = document.getElementById('b-bestiaire'); if (!best) return null;
  best.insertAdjacentHTML('afterend', '<button class="action" id="b-contacts" hidden><span class="tuile"><img src="assets/icones/barre-contacts.png?v=' + VERSION_MODELES + '" alt=""><b id="contacts-nb" hidden>0</b></span>Contacts</button>');
  return document.getElementById('b-contacts');
}
function majPastilleContacts() { const b = boutonContacts(); if (!b) return; b.hidden = !contactsVisibles(); const n = document.getElementById('contacts-nb'), k = CONTACTS.recues + CONTACTS.invitesGr; if (n) { n.hidden = !(k > 0); n.textContent = k; } }
/* la fenetre */
function vueContacts() {
  const D = CONTACTS.data, o = CONTACTS.onglet, nR = D && D.ok ? (D.recues || []).length : 0, G = CONTACTS.gr, nG = G ? (G.recues || []).length : 0;
  const tete = '<div class="hdv-tete">' + [['amis', 'Amis'], ['demandes', 'Demandes' + (nR ? ' (' + nR + ')' : '')], ['ajouter', 'Ajouter'], ['groupe', 'Groupe' + (nG ? ' (' + nG + ')' : '')]].map(([k, t]) => '<button class="btn" data-contacts-onglet="' + k + '" aria-pressed="' + (o === k) + '">' + t + '</button>').join('') + '</div>';
  if (!D) return tete + '<p class="ct-vide">Chargement…</p>';
  if (!D.ok) return tete + '<p class="ct-vide">' + errContacts(D.erreur) + '</p>' + (D.erreur === 'deconnecte' || D.erreur === 'hors ligne' ? '' : '<button class="btn" data-contacts-onglet="' + o + '">Réessayer</button>');
  const nom = (j) => '<b>' + echapper(j.pseudo) + '</b>', info = (j) => [CLASSES_CONTACT[j.classe], j.niveau ? 'niveau ' + j.niveau : ''].filter(Boolean).join(', ');
  let corps = '';
  if (o === 'amis') corps = (D.amis || []).length ? (D.amis || []).map((j) => '<div class="ct-ligne">' + icoClasseContact(j.classe) + '<div class="ct-nom">' + nom(j) + '<small><span class="ct-point' + (j.en_ligne ? ' on' : '') + '"></span>' + (j.en_ligne ? 'en ligne' : vuIlYa(j.vu)) + (info(j) ? ' · ' + info(j) : '') + '</small></div>'
      + '<div class="ct-act">' + boutonInviter(j) + (CONTACTS.retirer === j.id ? '<button class="btn discret" data-contacts-retirer-non>Non</button><button class="btn" data-contacts-retirer="' + j.id + '" data-sur="1">Retirer ?</button>' : '<button class="btn discret" data-contacts-retirer="' + j.id + '">Retirer</button>') + '</div></div>').join('')
    : '<p class="ct-vide">Pas encore d’ami. Ajoute quelqu’un dans l’onglet « Ajouter » avec son pseudo.</p>';
  else if (o === 'demandes') {
    const R = D.recues || [], E = D.envoyees || [];
    corps = '<div class="hdv-section">Reçues</div>' + (R.length ? R.map((j) => '<div class="ct-ligne">' + icoClasseContact(j.classe) + '<div class="ct-nom">' + nom(j) + '<small>' + (info(j) || 'veut être ton ami') + '</small></div><div class="ct-act"><button class="btn discret" data-contacts-repondre="' + j.id + '" data-ok="0">Refuser</button><button class="btn kamas" data-contacts-repondre="' + j.id + '" data-ok="1">Accepter</button></div></div>').join('') : '<p class="ct-vide">Aucune demande reçue.</p>')
      + '<div class="hdv-section">Envoyées</div>' + (E.length ? E.map((j) => '<div class="ct-ligne">' + ico('opt-compte') + '<div class="ct-nom">' + nom(j) + '<small>en attente de sa réponse</small></div><div class="ct-act"><button class="btn discret" data-contacts-retirer="' + j.id + '" data-sur="1">Annuler</button></div></div>').join('') : '<p class="ct-vide">Aucune demande en attente.</p>');
  } else if (o === 'groupe') corps = vueGroupe();
  else {
    const M = D.moi || {};
    corps = '<p class="hdv-aide">Pour qu’un joueur t’ajoute, donne-lui ton pseudo.</p><div class="ct-moi"><span>Ton pseudo : <b>' + echapper(M.pseudo || '') + '</b></span></div>'
      + '<div class="hdv-section">Ajouter un ami</div><div class="ct-ajout"><input id="ct-qui" type="text" maxlength="40" autocomplete="off" placeholder="Son pseudo"><button class="btn kamas" data-contacts-demander>Envoyer</button></div>'
      + (CONTACTS.msg ? '<div class="ct-msg' + (CONTACTS.msgOk ? ' ok' : '') + '">' + CONTACTS.msg + '</div>' : '');
  }
  return tete + corps;
}
/* LE GROUPE, ETAPE 2 DU MULTIJOUEUR (28/11/2026, « passe au groupe », Mathieu ; DAMOCLES/sql/089-ferme-groupes.sql) : 5 joueurs au plus ; le chef invite ses
   amis (bouton Inviter dans l'onglet Amis), chacun se dit pret ou non, on quitte quand on veut ; si le chef part, le plus ancien membre devient chef. Accepter
   une invitation fait quitter l'ancien groupe. Le lancement d'un donjon a plusieurs viendra a l'etape 3. */
const monGroupe = () => (CONTACTS.gr && CONTACTS.gr.groupe) || null;
const suisChef = () => { const g = monGroupe(); return !!(g && CONTACTS.gr && g.chef === CONTACTS.gr.moi); };
function boutonInviter(j) { const g = monGroupe(); if (!g || !suisChef()) return ''; if ((g.membres || []).some((m) => m.id === j.id)) return '<small class="ct-etiq">dans ton groupe</small>';
  if ((g.invites || []).some((m) => m.id === j.id)) return '<small class="ct-etiq">invité</small>'; if ((g.membres || []).length + (g.invites || []).length >= 5) return '';
  return '<button class="btn kamas" data-groupe-inviter="' + j.id + '">Inviter</button>'; }
function vueGroupe() {
  const G = CONTACTS.gr; if (!G) return '<p class="ct-vide">Le groupe ne répond pas : réessaie dans un instant.</p>';
  const g = G.groupe, info = (j) => [CLASSES_CONTACT[j.classe], j.niveau ? 'niveau ' + j.niveau : ''].filter(Boolean).join(', '), msg = CONTACTS.msg ? '<div class="ct-msg' + (CONTACTS.msgOk ? ' ok' : '') + '">' + CONTACTS.msg + '</div>' : '';
  if (!g) { const R = G.recues || [];
    return '<p class="hdv-aide">Forme une équipe de 5 joueurs au plus avec tes amis : le chef invite, chacun se dit prêt.</p><button class="btn kamas" data-groupe-creer>Créer un groupe</button>'
      + '<div class="hdv-section">Invitations reçues</div>' + (R.length ? R.map((r) => '<div class="ct-ligne">' + ico('barre-contacts') + '<div class="ct-nom"><b>Groupe de ' + echapper(r.chef) + '</b><small>' + r.membres + '/5 joueurs' + (r.de !== r.chef ? ' · invité par ' + echapper(r.de) : '') + '</small></div>'
        + '<div class="ct-act"><button class="btn discret" data-groupe-repondre="' + r.groupe + '" data-ok="0">Refuser</button><button class="btn kamas" data-groupe-repondre="' + r.groupe + '" data-ok="1">Rejoindre</button></div></div>').join('') : '<p class="ct-vide">Aucune invitation.</p>') + msg; }
  const M = g.membres || [], I = g.invites || [], chef = suisChef(), moi = M.find((m) => m.id === G.moi) || {};
  return '<div class="hdv-section">Ton groupe (' + M.length + '/5)</div>' + M.map((j) => '<div class="ct-ligne">' + icoClasseContact(j.classe) + '<div class="ct-nom"><b>' + echapper(j.pseudo) + (j.chef ? ' <span class="ct-chef">chef</span>' : '') + (j.pret ? ' <span class="ct-pret">prêt ✓</span>' : '') + '</b>'
      + '<small><span class="ct-point' + (j.en_ligne || j.id === G.moi ? ' on' : '') + '"></span>' + (j.id === G.moi ? 'toi' : j.en_ligne ? 'en ligne' : vuIlYa(j.vu)) + (info(j) ? ' · ' + info(j) : '') + '</small></div>'
      + '<div class="ct-act">' + (chef && j.id !== G.moi ? (CONTACTS.retirer === 'g' + j.id ? '<button class="btn discret" data-contacts-retirer-non>Non</button><button class="btn" data-groupe-exclure="' + j.id + '" data-sur="1">Exclure ?</button>' : '<button class="btn discret" data-groupe-exclure="' + j.id + '">Exclure</button>') : '') + '</div></div>').join('')
    + (I.length ? '<div class="hdv-section">Invités, en attente</div>' + I.map((j) => '<div class="ct-ligne">' + ico('opt-compte') + '<div class="ct-nom"><b>' + echapper(j.pseudo) + '</b><small>doit répondre à ton invitation</small></div><div class="ct-act">' + (chef ? '<button class="btn discret" data-groupe-exclure="' + j.id + '" data-sur="1">Annuler</button>' : '') + '</div></div>').join('') : '')
    + (chef && M.length + I.length < 5 ? '<p class="hdv-aide">Invite tes amis depuis l’onglet Amis : un bouton « Inviter » est à côté de chacun.</p>' : '')
    + '<div class="ct-boutons">' + (moi.pret ? '<button class="btn discret" data-groupe-pret="0">Pas prêt</button>' : '<button class="btn kamas" data-groupe-pret="1">Je suis prêt</button>')
    + (CONTACTS.quitter ? '<button class="btn discret" data-groupe-quitter-non>Non</button><button class="btn" data-groupe-quitter data-sur="1">Quitter ?</button>' : '<button class="btn discret" data-groupe-quitter>Quitter le groupe</button>') + '</div>' + msg;
}
function ouvrirContacts(onglet) { if (onglet) CONTACTS.onglet = onglet; ouvrirModale('contacts', entete('Contacts') + '<div id="ct-corps">' + vueContacts() + '</div>'); chargerContacts().then(redessinerContacts); }
function redessinerContacts() { if (modaleOuverte !== 'contacts') return; const z = document.getElementById('ct-corps'); if (!z) return; const v = (document.getElementById('ct-qui') || {}).value; z.innerHTML = vueContacts(); const i = document.getElementById('ct-qui'); if (i && v) i.value = v; }
async function actionContacts(nom, args, msgOk) {
  try { const r = await appelContacts(nom, args); if (!r || !r.ok) { CONTACTS.msg = errContacts(r && r.erreur === 'plein' && nom === 'ferme_ami_demander' ? 'plein_ami' : r && r.erreur); CONTACTS.msgOk = false; if (CONTACTS.onglet !== 'ajouter') toast(CONTACTS.msg, 'alerte'); }
    else { CONTACTS.msg = typeof msgOk === 'function' ? msgOk(r) : msgOk || ''; CONTACTS.msgOk = true; if (CONTACTS.msg && CONTACTS.onglet !== 'ajouter') toast(CONTACTS.msg, 'or'); } }
  catch (e) { CONTACTS.msg = errContacts('reseau'); CONTACTS.msgOk = false; toast(CONTACTS.msg, 'alerte'); }
  CONTACTS.retirer = null; CONTACTS.quitter = false; await chargerContacts(); redessinerContacts();
}
document.addEventListener('click', (ev) => {
  const t = ev.target && ev.target.closest ? ev.target : null; if (!t) return;
  if (t.closest('#b-contacts')) { CONTACTS.msg = ''; ouvrirContacts(); return; }
  if (modaleOuverte !== 'contacts') return;
  const g = t.closest('[data-contacts-onglet]'); if (g) { CONTACTS.onglet = g.dataset.contactsOnglet; CONTACTS.msg = ''; CONTACTS.retirer = null; redessinerContacts(); chargerContacts().then(redessinerContacts); return; }
  const d = t.closest('[data-contacts-demander]'); if (d) { const i = document.getElementById('ct-qui'), q = i ? i.value.trim() : ''; if (!q) return; d.disabled = true;
    actionContacts('ferme_ami_demander', { p_qui: q }, (r) => (r.etat === 'amis' ? 'Vous êtes maintenant amis avec ' + echapper(r.pseudo) + ' !' : 'Demande envoyée à ' + echapper(r.pseudo) + '.')).then(() => { const j = document.getElementById('ct-qui'); if (j && CONTACTS.msgOk) j.value = ''; }); return; }
  const rp = t.closest('[data-contacts-repondre]'); if (rp) { rp.disabled = true; const ok = rp.dataset.ok === '1'; actionContacts('ferme_ami_repondre', { p_id: rp.dataset.contactsRepondre, p_ok: ok }, ok ? 'Nouvel ami ajouté.' : ''); return; }
  const rt = t.closest('[data-contacts-retirer]'); if (rt) { if (!rt.dataset.sur) { CONTACTS.retirer = rt.dataset.contactsRetirer; redessinerContacts(); return; } rt.disabled = true; actionContacts('ferme_ami_retirer', { p_id: rt.dataset.contactsRetirer }, ''); return; }
  if (t.closest('[data-contacts-retirer-non]')) { CONTACTS.retirer = null; redessinerContacts(); return; }
  if (t.closest('[data-groupe-creer]')) { actionContacts('ferme_groupe_creer', {}, 'Groupe créé : invite tes amis depuis l’onglet Amis.'); return; }
  const gi = t.closest('[data-groupe-inviter]'); if (gi) { gi.disabled = true; actionContacts('ferme_groupe_inviter', { p_id: gi.dataset.groupeInviter }, (r) => 'Invitation envoyée à ' + echapper(r.pseudo) + '.'); return; }
  const gr = t.closest('[data-groupe-repondre]'); if (gr) { gr.disabled = true; const ok = gr.dataset.ok === '1'; actionContacts('ferme_groupe_repondre', { p_groupe: gr.dataset.groupeRepondre, p_ok: ok }, ok ? 'Tu as rejoint le groupe.' : ''); return; }
  const gx = t.closest('[data-groupe-exclure]'); if (gx) { if (!gx.dataset.sur) { CONTACTS.retirer = 'g' + gx.dataset.groupeExclure; redessinerContacts(); return; } gx.disabled = true; actionContacts('ferme_groupe_exclure', { p_id: gx.dataset.groupeExclure }, (r) => (r.etat === 'exclu' ? 'Joueur retiré du groupe.' : 'Invitation annulée.')); return; }
  const gp = t.closest('[data-groupe-pret]'); if (gp) { gp.disabled = true; actionContacts('ferme_groupe_pret', { p_pret: gp.dataset.groupePret === '1' }, ''); return; }
  if (t.closest('[data-groupe-quitter-non]')) { CONTACTS.quitter = false; redessinerContacts(); return; }
  const gq = t.closest('[data-groupe-quitter]'); if (gq) { if (!gq.dataset.sur) { CONTACTS.quitter = true; redessinerContacts(); return; } gq.disabled = true; actionContacts('ferme_groupe_quitter', {}, 'Tu as quitté le groupe.'); return; }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && modaleOuverte === 'contacts' && e.target && e.target.id === 'ct-qui') { const b = document.querySelector('#carte [data-contacts-demander]'); if (b) b.click(); } });
/* le bouton suit le mode test ; les demandes recues sont relues toutes les 60 s quand le bouton est visible (et a l'ouverture de la fenetre) */
{ const entrerModeTestCt = entrerModeTest; entrerModeTest = function () { const r = entrerModeTestCt.apply(this, arguments); try { majPastilleContacts(); if (contactsVisibles()) chargerContacts(); } catch (e) { /* rien */ } return r; }; }
setInterval(() => { try { majPastilleContacts(); const maint = Date.now(), pas = monGroupe() ? 20000 : 60000; if (contactsVisibles() && ENLIGNE && !document.hidden && !combat && maint - (CONTACTS.tPoll || 0) >= pas - 500) { CONTACTS.tPoll = maint; chargerContacts().then(redessinerContacts); } } catch (e) { /* (avant le chargement de la ferme) */ } }, 20000); /* (20 s dans un groupe, pour voir qui est pret ; 60 s sinon) */
[0, 4000, 10000, 20000].forEach((ms) => setTimeout(() => { try { majPastilleContacts(); if (ms && contactsVisibles() && ENLIGNE && !CONTACTS.data) chargerContacts().then(majPastilleContacts); } catch (e) { /* rien */ } }, ms)); /* (le compte est connu quelques secondes apres le chargement) */
