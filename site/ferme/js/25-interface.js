'use strict';
/* ===================== INTERFACE ===================== */
const $ = (id) => document.getElementById(id);
/* BETA : le curseur de vitesse du temps (voir horlogeJeu tout en haut) */
function majVitesse() { if (horlogeJeu.vitesse() > vitesseMaxi()) horlogeJeu.regler(vitesseMaxi()); /* (x1,5 au plus a partir du niveau 51, 06/11/2026) */ const v = horlogeJeu.vitesse(), b = $('b-vitesse'), t = 'x' + String(v).replace('.', ','); /* (« x1 » au lieu de « normal », 07/11/2026) */ /* (virgule() n'est pas encore definie ici) */ b.innerHTML = '<span class="lib">Temps </span>' + t; b.classList.toggle('rapide', v > 1); $('vitesse').max = vitesseMaxi(); $('vitesse').value = v; $('vitesse-val').textContent = t; }
$('b-vitesse').addEventListener('click', (e) => { e.stopPropagation(); $('vitesse-panneau').hidden = !$('vitesse-panneau').hidden; majVitesse(); });
$('vitesse').addEventListener('input', (e) => { horlogeJeu.regler(+e.target.value); majVitesse(); });
document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#vitesse-panneau, #b-vitesse')) $('vitesse-panneau').hidden = true; });
majVitesse();
/* le plein ecran au telephone (12/10/2026) : le bouton du bandeau quand on tient le telephone couche, et dans les Options */
const pleinEcranPossible = () => !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
const enPleinEcran = () => !!(document.fullscreenElement || document.webkitFullscreenElement) || matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
function pleinEcran(sortir) {
  if (sortir) { const f = document.exitFullscreen || document.webkitExitFullscreen; try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { /* rien */ } if (f && (document.fullscreenElement || document.webkitFullscreenElement)) f.call(document); return; }
  const el = document.documentElement, f = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!f) { ouvrirModale('plein', entete('Plein écran') + '<p style="font-size:.95rem;font-weight:700;line-height:1.4">Sur iPhone, Safari ne laisse pas une page passer en plein écran. La solution : ajoute la ferme à ton écran d\'accueil (bouton <b>Partager</b>, puis <b>Sur l\'écran d\'accueil</b>). Lancée de là, elle s\'ouvre en plein écran, sans les barres du navigateur.</p><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn kamas" data-fermer>Compris</button></div>'); return; }
  try { const r = f.call(el, { navigationUI: 'hide' }); if (r && r.then) r.then(() => { if (innerWidth > innerHeight && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); }).catch(() => {}); } catch (e) { /* rien */ } /* (couche : l'ecran reste couche, plus de bascule en vertical par megarde) */
}
function majPleinEcran() { const b = $('b-plein'); if (b) b.hidden = !(DOIGT && innerWidth > innerHeight && !enPleinEcran()); }
['fullscreenchange', 'webkitfullscreenchange', 'resize', 'orientationchange'].forEach((t) => (t === 'resize' || t === 'orientationchange' ? window : document).addEventListener(t, () => setTimeout(majPleinEcran, 120)));
function rendreHaut() {
  { const h = document.querySelector('.haut'); if (h) document.documentElement.style.setProperty('--haut-hud', Math.round(h.getBoundingClientRect().bottom) + 'px'); } /* (la hauteur du bandeau du haut : la barre de combat se place dessous au telephone) */
  const n = niveau(S_.xp), a = seuil(n), b = seuil(n + 1), max = n >= capNiveau();
  majVieHaut();
  if (MODE_TEST) S_.kamas = KAMAS_TEST; $('kamas').textContent = MODE_TEST ? '∞' : fmt(S_.kamas); $('niv').textContent = n; $('xp').style.width = max ? '100%' : (100 * (S_.xp - a) / (b - a)).toFixed(1) + '%';
  $('xp-txt').textContent = max ? 'max' : Math.floor(100 * (S_.xp - a) / (b - a)) + ' %'; /* (11/11/2026, « reduis la taille de ca, ca prend trop de place pour pas grand-chose », Mathieu : une petite barre et un pourcentage ; les points exacts restent dans l'infobulle. « Niveau max » ou « 1 234 / 5 678 XP » dans une barre de 132 px avant) */
  $('xp-barre').parentNode.dataset.info = max ? (capNiveau() < NIV_MAX ? 'Niveau ' + capNiveau() + ' : ' + texteCap() + '.' : 'Niveau ' + NIV_MAX + ' : le niveau maximum de Paysan.') :'Niveau ' + n + ' : encore ' + fmt(b - S_.xp) + ' points d\'expérience pour passer niveau ' + (n + 1) + ' (' + Math.floor(100 * (S_.xp - a) / (b - a)) + ' %)';
  if (rendreHaut.xp !== undefined && S_.xp > rendreHaut.xp) { const e = $('xp-barre'); e.classList.remove('gagne'); void e.offsetWidth; e.classList.add('gagne'); } rendreHaut.xp = S_.xp;
  $('cases').innerHTML = 'Parcelles <b style="color:var(--kamas)">' + parcelles() + '/' + quotaParcelles() + '</b>'; { const n = parcelles(), q = quotaParcelles(); $('cases').dataset.info = 'Tes parcelles : ' + n + ' labourée' + (n > 1 ? 's' : '') + ' sur ' + q + ' possibles. Une parcelle, c\'est une case de terre où tu sèmes tes graines. Ton île en permet ' + QUOTA_ILE + ', chaque terrain acheté en ajoute. Pour en labourer une : touche une case d\'herbe libre.' + (n >= q ? ' Quota atteint : achète un terrain pour en avoir plus, ou déplace tes parcelles avec Aménager.' : ''); }
  $('graine-ico').src = 'assets/icones/' + S_.graine + '.png'; $('graine-nb').textContent = S_.graines[S_.graine] || 0; $('b-graine').dataset.info = 'Graine choisie : ' + PAR_ID[S_.graine].nom + ' (' + (S_.graines[S_.graine] || 0) + ' en grange). Touche pour en choisir une autre';
  $('b-amenager').setAttribute('aria-pressed', !!mode);
  $('eau').innerHTML = '<svg class="goutte" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5C9 7 5.5 10.6 5.5 14.6a6.5 6.5 0 0 0 13 0C18.5 10.6 15 7 12 2.5z" fill="#3a95d1" stroke="#1f5f8b" stroke-width="1.6"/><path d="M9.2 14.2a3 3 0 0 0 2.6 3" fill="none" stroke="#dff1fb" stroke-width="1.6" stroke-linecap="round"/></svg> ' + S_.eau + '/' + capaciteEau() + (niv('arrosoir') ? ' <small style="font-weight:700;color:#3a95d1" data-info="Citerne d\'arrosage">· citerne ' + (S_.citerne || 0) + '/' + capaciteCiterne() + '</small>' : ''); $('eau').classList.toggle('vide', !S_.eau);
  $('eau').dataset.info = niv('arrosoir') ? 'Arrosoir, et citerne qui arrose seule les nouveaux semis : les deux se remplissent au puits' : 'Arrosoir : il se remplit au puits';
  { const f = $('fleches-stock'), defense = niv('arbalete') || nbTours() || niv('epouvantail') >= 3; f.hidden = !defense && !S_.fleches; /* les fleches, des qu'une defense en tire (arbalete, tour, epouvantail arme) */
    f.innerHTML = '<img src="assets/icones/fleches.png?v=' + VERSION_MODELES + '" alt="">' + fmt(S_.fleches); f.classList.toggle('vide', !!defense && !S_.fleches);
    f.dataset.info = S_.fleches ? 'Flèches en réserve : l\'arbalète, les tours et l\'épouvantail en tirent une par tir. Touche pour en acheter' : 'Plus de flèches : ta défense ne tire plus. Touche pour en acheter à l\'HDV'; }
  const repos = S_.vague.repos - Date.now(), fini = S_.vague.num > VAGUES_TOTAL;
  const prepaV = fini ? 0 : (S_.vague.prepa || 0) - Date.now(), attenteV = Math.max(repos, prepaV);
  { const ic = 'assets/icones/' + PALIERS_TOUS[palierDe(Math.min(S_.vague.num, VAGUES_TOTAL))].icone + '.png?v=' + VERSION_MODELES, im = $('b-vagues').querySelector('img'); if (im && im.getAttribute('src') !== ic) im.src = ic; } /* « adapte le bouton aux vagues, tous les 10 » (Mathieu, 13/10/2026) : l'embleme du palier en cours */
  $('vague-nb').textContent = attenteV > 0 ? dureeLisible(attenteV).replace(' min', 'm').replace(' s', 's') : fini ? '✓' : S_.vague.num; $('b-vagues').classList.toggle('repos', attenteV > 0);
  $('b-vagues').dataset.info = repos > 0 ? 'Ton perso se repose encore ' + dureeLisible(repos) : prepaV > 0 ? 'La vague ' + S_.vague.num + ' se prépare : ' + dureeLisible(prepaV) : fini ? 'Tous les paliers terminés' : 'La vague ' + S_.vague.num + ' (palier ' + (palierDe(S_.vague.num) + 1) + ') attend que tu la lances';
  $('mode-test').hidden = !RAPIDE;
  $('perso-ico').src = 'assets/icones/' + icoClasse() + '.png?v=' + VERSION_MODELES; $('perso-nb').hidden = !S_.nouveaux; $('perso-nb').textContent = S_.nouveaux || 0;
  if (S_.perso) $('titre').textContent = 'Ferme de ' + S_.perso.nom;
}
/* le panneau Grange, une icone devant chaque ligne (13/10/2026) : le produit, ou la culture avec une pousse pour ses graines */
const icoGrange = (nom, graine) => '<span class="gi"><img src="assets/icones/' + nom + '.png?v=' + VERSION_MODELES + '" alt="">' + (graine ? '<i>' + picto('pousse', '#3f8a2e') + '</i>' : '') + '</span>';
function rendreGrange() {
  const lignes = VENDABLES.filter((v) => (S_.grange[v.id] || 0) > 0);
  const corps = (lignes.length ? lignes.map((v) => '<div class="l"><span class="n">' + icoGrange(v.id) + v.nom + '</span><span>' + fmt(S_.grange[v.id]) + '</span></div>').join('') : '<div class="l"><span>Rien pour l\'instant</span></div>') + CULTURES.filter((c) => (S_.graines[c.id] || 0) > 0).map((c) => '<div class="l"><span class="n">' + icoGrange(c.id, true) + 'Graines ' + de(c.nom) + '</span><span>' + S_.graines[c.id] + '</span></div>').join('') + Object.keys(POTS).filter((t) => S_.pots && S_.pots[t] > 0).map((t) => '<div class="l"><span class="n">' + icoGrange('pot-' + t) + POTS[t].court + '</span><span>' + S_.pots[t] + '</span></div>').join('') + (S_.filets ? '<div class="l"><span class="n">' + icoGrange('filet') + 'Filets</span><span>' + S_.filets + '</span></div>' : '');
  /* (06/11/2026) un titre qui replie le panneau, et la liste dans un bloc qui defile, reecrit seulement s'il change (sinon il remonterait en haut a chaque recolte) */
  const g = $('panneau-grange'); if (!g.querySelector('.defile')) { g.innerHTML = '<h2 class="pli">Grange<span class="chev"></span></h2><div class="defile"></div>'; rendreGrange.dernier = null; }
  if (corps !== rendreGrange.dernier) { rendreGrange.dernier = corps; g.querySelector('.defile').innerHTML = corps; }
  rendreElevage();
}
function toast(msg, genre) {
  if (genre === 'alerte' && mode && /^Pas /.test(msg)) { const b = document.getElementById('bandeau-texte'); b.textContent = msg; clearTimeout(toast.t); toast.t = setTimeout(majBandeau, 3500); }
  noterJournal(msg, genre);
  const z = $('toasts'), deja = [...z.children].find((e) => e.dataset.msg === msg);
  if (deja) { /* le meme message deja affiche : un compteur au lieu d'un doublon, et il reste un peu plus */
    const n = (parseInt(deja.dataset.n, 10) || 1) + 1; deja.dataset.n = n; let b = deja.querySelector('b.fois'); if (!b) { b = document.createElement('b'); b.className = 'fois'; deja.appendChild(b); } b.textContent = '×' + n;
    clearTimeout(deja._t); deja._t = setTimeout(() => deja.remove(), dureeToast(genre)); z.appendChild(deja); return;
  }
  const el = document.createElement('div'); el.className = 'toast' + (genre ? ' ' + genre : ''); el.textContent = msg; el.dataset.msg = msg; z.appendChild(el);
  while (z.children.length > 3) { /* (3 messages au plus a l'ecran, 07/11/2026 ; 4 avant) */ const vieux = [...z.children].find((e) => e !== el && !e.classList.contains('or')) || z.firstChild; clearTimeout(vieux._t); vieux.remove(); } /* les orange ne sont pas chasses par les petits messages */
  el._t = setTimeout(() => el.remove(), dureeToast(genre));
}
/* combien de temps un message reste : les orange (raids, defis, coffre...) le plus longtemps, puis les alertes */
const dureeToast = (genre) => genre === 'or' ? 12000 : genre === 'alerte' ? 8000 : 6000;
/* l'historique : les 60 derniers messages, relus avec le bouton Messages (heure reelle, pas celle du jeu, qui peut aller x50) */
const JOURNAL = [];
/* L'HISTORIQUE DE COMBAT (13/10/2026) : chaque fenetre de fin de vague ou de simu VSA est gardee (les 10 dernieres), et le journal des messages a une
   ligne cliquable « Historique de combat » qui la rouvre telle qu'elle etait (Reparer ou Voir les vagues la fermaient, on ne pouvait plus la revoir) */
function memoriserCombat() {
  const t = $('carte').querySelector('h2'), titre = t ? t.firstChild.textContent.trim() : 'Fin du combat', h = new Date(performance.timeOrigin + performance.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  JOURNAL.push({ msg: titre, genre: 'combat', h, n: 1, combat: $('carte').innerHTML }); if (JOURNAL.length > 60) JOURNAL.shift();
  let k = 0; for (let i = JOURNAL.length - 1; i >= 0; i--) if (JOURNAL[i].combat && ++k > 10) delete JOURNAL[i].combat; /* (les 10 dernieres seulement) */
  if (!$('chat').hidden) remplirChat();
}
function majReparationsModale() { /* les boutons de reparation d'un bilan (ou d'un bilan relu dans l'historique) suivent l'etat reel des batiments */
  document.querySelectorAll('.modale [data-reparer], .modale [data-reconstruire]').forEach((e) => {
    const k = e.dataset.reparer || e.dataset.reconstruire, ligne = e.closest('.art'), d = ligne && ligne.querySelector('.desc');
    let abime = false, ruine = false; try { ruine = enRuine(k); abime = ruine || degatsBat(k) > 0; } catch (err) { abime = false; } /* (un batiment vendu depuis : plus rien a faire) */
    if (!abime) { if (d) d.textContent = 'Réparé depuis.'; e.outerHTML = '<span class="cadenas">✓ Réparé</span>'; return; }
    if (ruine) { delete e.dataset.reparer; e.dataset.reconstruire = k; e.innerHTML = 'Reconstruire ' + fmt(coutReconstruire(k)) + ' ' + KAMA; }
    else { delete e.dataset.reconstruire; e.dataset.reparer = k; e.innerHTML = 'Réparer ' + fmt(coutReparer(k)) + ' ' + KAMA; if (d) d.textContent = 'Il lui reste ' + fmt(pvBat(k)) + ' PV sur ' + fmt(pvMaxBat(k)) + '.'; }
  });
  const tb = document.querySelector('.modale [data-tout-reparer]');
  if (tb) { let reste = []; try { reste = tb.dataset.toutReparer.split(',').filter((k) => degatsBat(k) || enRuine(k)); } catch (err) { reste = []; }
    if (reste.length < 2) tb.parentNode.remove(); else { tb.dataset.toutReparer = reste.join(','); tb.innerHTML = 'Tout réparer ' + fmt(reste.reduce((t, k) => t + (enRuine(k) ? coutReconstruire(k) : coutReparer(k)), 0)) + ' ' + KAMA; } }
}
function revoirCombat(i) {
  const m = JOURNAL[i]; if (!m || !m.combat) { toast('Ce combat est trop ancien pour être revu.'); return; }
  ouvrirModale('vague-fin', m.combat.replace('</h2>', '</h2><p class="hist-note">Historique de combat : ' + m.h + '</p>')); majReparationsModale(); /* (l'etat des batiments d'aujourd'hui, pas celui de la copie) */
}
function noterJournal(msg, genre) {
  const d = JOURNAL[JOURNAL.length - 1], h = new Date(performance.timeOrigin + performance.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (d && d.msg === msg && !d.combat) { d.n++; d.h = h; } else { JOURNAL.push({ msg, genre: genre || '', h, n: 1 }); if (JOURNAL.length > 60) JOURNAL.shift(); }
  if (!$('chat').hidden) remplirChat();
}
/* le chat deplie : l'historique a la place de la pile de messages ; s'il etait en bas, il y reste quand un message arrive */
function remplirChat() {
  const l = $('chat-liste'), enBas = l.scrollHeight - l.scrollTop - l.clientHeight < 30;
  l.innerHTML = JOURNAL.length ? JOURNAL.map((m, i) => m.genre === 'combat' ? '<li class="combat"><time>' + m.h + '</time><span><button data-revoir-combat="' + i + '">Historique de combat : ' + echapper(m.msg) + '</button></span></li>'
    : '<li class="' + m.genre + '"><time>' + m.h + '</time><span>' + echapper(m.msg) + (m.n > 1 ? ' <b class="fois">×' + m.n + '</b>' : '') + '</span></li>').join('') : '<li><time></time><span>Aucun message pour l\'instant.</span></li>';
  if (enBas || !l._vu) { l.scrollTop = l.scrollHeight; l._vu = true; }
}
function basculerChat(ouvrir) {
  const c = $('chat'), o = ouvrir === undefined ? c.hidden : ouvrir; c.hidden = !o; $('fil').classList.toggle('ouvert', o); $('b-journal').setAttribute('aria-expanded', String(o)); $('b-journal').innerHTML = picto('message') + (o ? ' Refermer' : ' Messages');
  if (o) { $('chat-liste')._vu = false; remplirChat(); }
}

/* modales */
let modaleOuverte = null;
/* les icones de la grange chargees a l'avance (07/11/2026 : a la premiere ouverture, les cases restaient vides un instant) */
function prechargerIcones() {
  if (prechargerIcones.fait || !S_) return; prechargerIcones.fait = true; const v = '?v=' + VERSION_MODELES;
  const L = CULTURES.map((c) => c.id).concat(VENDABLES.map((x) => x.id), Object.keys(POTS).map((t) => 'pot-' + t), ['filet', 'fleches', 'rune-forge', 'rune-parfaite'], Object.keys(S_.sac || {}).filter((k) => obj(k)).map((k) => iconeObjet(k)));
  [...new Set(L)].forEach((n, k) => setTimeout(() => { const im = new Image(); im.src = 'assets/icones/' + n + '.png' + v; }, 20 * k));
}
function ouvrirModale(nom, html) { const neuve = modaleOuverte !== nom || !$('modale').classList.contains('ouverte'); modaleOuverte = nom; $('carte').innerHTML = html; $('carte').classList.toggle('hdv', nom === 'hdv'); $('carte').classList.toggle('large', nom === 'vagues' || nom === 'pecheur'); $('carte').classList.toggle('grange', nom === 'grange'); $('carte').classList.toggle('bestiaire', nom === 'bestiaire'); $('carte').classList.toggle('fiche', nom === 'perso'); /* la fiche des vagues, plus large */ $('modale').classList.add('ouverte'); if (neuve) { $('carte').scrollTop = 0; requestAnimationFrame(() => { if (modaleOuverte === nom) $('carte').scrollTop = 0; }); } /* (une autre fenetre s'ouvre en haut, pas au defilement de la precedente, 07/11/2026 ; apres l'affichage : une fenetre cachee ne defile pas) */ }
function fermerModale() { const m = modaleOuverte; modaleOuverte = null; $('modale').classList.remove('ouverte'); if (m === 'arene-fin' && lieu === 'arene' && !combat && !areneSuite) setTimeout(rentrerFerme, 30); if (m === 'ileboss-fin' && lieu === 'ile' && !combat && !areneSuite) setTimeout(rentrerFerme, 30); } /* (fermer le bilan de l'Arene, c'est rentrer a la ferme) */
$('modale').addEventListener('click', (e) => { if (e.target === $('modale')) fermerModale(); });
const entete = (titre) => '<h2>' + titre + '<button data-fermer aria-label="Fermer">✕</button></h2>';
/* une carte de graine : l'icone de la culture et le nombre en grange en pastille, le temps de pousse et ce que rapporte la recolte */
function carteGraine(c, attrs, ok) {
  const n = S_.graines[c.id] || 0, vide = ok && !n;
  return '<button class="graine' + (vide ? ' vide' : '') + '" ' + attrs + ' aria-pressed="' + (S_.graine === c.id) + '"' + (ok ? '' : ' disabled') + '>' +
    '<span class="g-ico"><img src="assets/icones/' + c.id + '.png?v=' + VERSION_MODELES + '" alt="">' + (ok ? '<i class="g-nb">' + n + '</i>' : '<i class="g-cad">' + picto('cadenas') + '</i>') + '</span>' +
    '<b>' + c.nom + '</b>' + (ok ? '<span class="g-info"><span>' + picto('cadence') + dureeLisible(duree(c)) + '</span><span>' + picto('epi') + '×' + c.rendement + '</span></span>' + (c.mange ? '<span class="g-mange">' + c.mange.txt + '</span>' : '') : '<span class="g-info"><span>niveau ' + c.niv + '</span></span>') + '</button>';
}
function ouvrirGraines() {
  ouvrirModale('graines', entete('Quelle graine planter ?') + '<p style="font-size:.78rem;font-weight:600;margin:0 0 8px">Celle-ci se plante sur tout le champ d\'une touche. Le nombre sur l\'icône : tes graines en grange. À 0, touche-la pour l\'acheter à l\'HDV.</p><div class="grille-graines">' + CULTURES.map((c) => carteGraine(c, 'data-graine="' + c.id + '"', debloquee(c))).join('') + '</div>' +
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;font-size:.8rem;font-weight:700"><span>Après la récolte, il replante tout seul la même culture (s\'il en a les graines).</span><span style="display:grid;justify-items:end;gap:2px"><button class="inter' + (S_.replanter !== false ? ' on' : '') + '" role="switch" aria-checked="' + (S_.replanter !== false) + '" aria-label="Replanter après la récolte" data-replanter></button><span class="etat-inter' + (S_.replanter !== false ? ' on' : '') + '">' + (S_.replanter !== false ? 'Oui' : 'Non') + '</span></span></div>');
}
/* les icones : rendues depuis nos modeles 3D (generer-icones.html + exporter-icones.mjs -> assets/icones/) */
const ICONES = { forge: 'forgemagie' /* (la forge a runes, rendue depuis forgemagie2.glb par icones-forge.html ; validee par Mathieu le 13/11/2026 ; l'ancienne : atelier-forge) */, atelier: 'atelier', geliere: 'geliere', qg: 'grange', nivPuits: 'puits', nivEtal: 'etal', voliere: 'voliere', arbalete: 'arbalete', enclos: 'cloture', arbPortee: 'arbalete', toursPortee: 'tour', arbChargeur: 'fleches', arbCadence: 'arbalete', arbDegats: 'fleches', tours: 'tour', reservoir: 'arrosoir', poulie: 'poulie', arrosoir: 'arrosoir', enclos: 'cloture', engrais: 'engrais', charrette: 'charrette', epouvantail: 'epouvantail', leurre: 'cawotte', mangeoire: 'auge', bottes: 'bottes', cloche: 'cloche', remise: 'kama', semences: 'sac', faux: 'faux', abreuvoir: 'abreuvoir', cisailles: 'cisailles', voliere: 'voliere', cadenas: 'cadenas', arbalete: 'arbalete', murs: 'grange', toursPv: 'tour' };
/* LES ICONES 3D DES SORTS ET DES PASSIFS (23/10/2026, « refais les visuels des sorts », Mathieu) : peintes a partir du rendu du perso, une par apparence,
   toutes dans le meme style, en pleine image (« faut qu'on ait tous le meme ton ») ; tant qu'une apparence n'a pas la sienne, l'ancienne image reste */
const ICONES_3D = new Set(['iop3', 'iop-berserker-a', 'iop-berserker-b', 'iop-berserker-c', 'feminin-iop', 'cra', 'feminin-cra', 'osa', 'feminin-osa'].flatMap((m) => ['sort3d-' + m + '-attaque', 'sort3d-' + m + '-sort', 'passif-' + m]));
const V_ICONES_3D = 'i6'; /* (a changer quand on repeint les icones 3D : le navigateur garde sinon les anciennes, sans recharger tous les modeles) */
const icone3d = (nom) => '<span class="pic img trois-d"><img src="assets/icones/' + nom + '.png?v=' + VERSION_MODELES + V_ICONES_3D + '" alt=""></span>';
const ico = (nom) => '<span class="pic img' + (/^obj-leg-/.test(nom) ? ' leg' : '') + '"><img src="assets/icones/' + nom + '.png?v=' + VERSION_MODELES + '" alt=""></span>';
/* « Comment jouer » dans les Options (23/10/2026, « a refaire ca », Mathieu, devant l'ancien pave de texte) : les commandes de l'appareil
   (souris ou doigt) en deux cartes, puis six petites cartes d'une ligne, chacune avec son icone */
const guideJeu = () => {
  const cmd = (svg, t, d) => '<div class="gj-cmd">' + svg + '<div><b>' + t + '</b><span>' + d + '</span></div></div>';
  const carte = (i, t, d, large) => '<div class="gj' + (large ? ' gj-large' : '') + '">' + ico(i) + '<div><b>' + t + '</b><span>' + d + '</span></div></div>';
  return '<div class="guide-jeu"><div class="gj-cmds">' + (DOIGT
    ? cmd(DOIGT_SVG(false), 'Touche une case', 'Ton paysan y va et agit : il plante, arrose, récolte, nourrit…') + cmd(DOIGT_SVG(true), 'Reste appuyé', 'Il va seulement sur la case, sans rien y faire.')
    : cmd(SOURIS_SVG('gauche'), 'Clic gauche', 'Ton paysan se déplace, ou vise un monstre.') + cmd(SOURIS_SVG('droit'), 'Clic droit', 'Il agit sur la case : il plante, arrose, récolte, nourrit…')) +
    '</div><p class="gj-vue">' + (DOIGT ? 'Glisse pour déplacer la vue, pince pour zoomer, tourne deux doigts pour faire pivoter la caméra.' : 'Glisse pour déplacer la vue, molette pour zoomer.<br><b>Ctrl + clic droit</b> ou <b>clic molette</b> en glissant : tourner et incliner la caméra. <b>A / E</b> : un quart de tour. <b>Z / S</b> : la caméra monte ou descend. <b>R</b> : la vue de départ.<br><b>P</b> : pause. <b>Échap</b> : fermer une fenêtre, annuler une visée ou quitter la pause.') + '</p><div class="gj-grille">' + /* (14/11/2026, « dans Comment jouer, y'a toutes les infos de commande ? », Mathieu : manquaient les touches des sorts, P, Echap, le clic molette, les deux doigts qui tournent et le combat) */
    carte('bouftou-royal', 'En combat', DOIGT ? 'Touche un monstre pour le cibler, le sol pour t’y placer : ton paysan frappe ce qui est à portée. Touche un sort, puis le sol là où le lancer ; retouche le sort pour annuler.' : 'Clique un monstre pour le cibler, le sol pour t’y placer : ton paysan frappe ce qui est à portée. <b>1</b> : ton sort, <b>2</b> : ton ulti, <b>3</b> et <b>4</b> : tes légendaires ; puis clique là où le lancer (clic droit ou Échap pour annuler).', true) +
    carte('ble', 'Les cultures', 'Plante sur une parcelle libre, arrose quand c’est sec, récolte quand c’est mûr.') +
    carte('arrosoir', 'L’arrosoir', 'Il se remplit au puits : 10 arrosages par plein.') +
    carte('bouftou', 'Les bêtes', 'Nourris et tonds tes Bouftous, chasse les Tofus.') +
    carte('pelle', 'Les cases d’herbe', 'Elles se labourent en parcelles, ou accueillent un bâtiment.') +
    carte('etal', 'L’HDV', 'Graines et Bouftous s’y achètent, tes récoltes s’y vendent.') +
    carte('cloche', 'Les bulles', 'Les icônes au-dessus des cases se touchent aussi. Touches-en plusieurs : ton paysan les enchaîne.') +
    '</div></div>';
};
const pastille = (c) => '<span class="pic" style="background:' + c.couleur + '">' + c.nom[0] + '</span>'; /* une graine : sa couleur et son initiale */
const pic = (e) => '<span class="pic emoji">' + e + '</span>';
/* sous un bouton grise faute de kamas : ce qui manque */
const manque = (cout) => S_.kamas < cout ? '<small class="manque">Il manque ' + fmt(cout - S_.kamas) + ' ' + KAMA + '</small>' : '';
/* ce que donne chaque amelioration, niveau par niveau : stats[k] = [emoji, libelle, valeurs indexees par niv(id), mise en forme] ;
   0 ou '' : pas encore (la ligne apparait alors comme nouvelle). looks : l'apparence au niveau suivant. neufs[k] : ce qui arrive au niveau k. */
const virgule = (x) => String(x).replace('.', ',');
const enCases = (u) => virgule(Math.round(u / S * 10) / 10); /* une portee en unites du jeu, dite en cases (une case fait S = 2 unites) */
const GAINS = {
  qg: { role: 'Elle garde tes récoltes. Plus elle a de PV, plus elle tient face aux monstres.', looks: ['la grange à colombages', 'cheminée et hangar à foin', 'un soubassement de pierre', 'la tourelle de guet', 'le QG de Redemption', 'le château de Redemption'],
    stats: [['vita', 'Points de vie', [500, 900, 1500, 2400, 3600, 12000]]], neufs: { 1: [['bouclier', 'Les voleurs de VSA emportent 2 fois moins']], 5: [['degats', 'Tes 4 tours fusionnent : elles tirent comme des tours niveau 6'], ['cases', 'Il prend 4 cases sur 4, là où tu veux']] } },
  arbalete: { role: 'Elle tire seule sur les voleurs et les monstres, tant qu\'elle a des carreaux.', looks: [null, 'de bois', 'cerclée de fer', 'double, avec lunette', 'à répétition', 'la baliste de Redemption', 'la baliste d\'acier, la tourelle blindée'],
    stats: [['degats', 'Dégâts', [0].concat(DEG_ARBALETE)], ['carreaux', 'Carreaux chargés', [0, 3, 6, 9, 12, 15, 18]], ['cadence', 'Un tir toutes les', [0, 1.1, 1.0, 0.9, 0.8, 0.65, 0.6], (x) => virgule(x) + ' s'], ['portee', 'Portée', [0, 7, 8, 9.5, 10.5, 12, 13], (x) => enCases(x) + ' cases']], neufs: { 3: [['auto', 'Elle se recharge toute seule avec ta réserve de flèches']], 6: [['degats', 'Les carreaux d\'acier de l\'atelier : deux fois ses dégâts, et ils traversent le premier monstre']] } },
  nivPuits: { role: 'Il remplit ton arrosoir.', looks: ['le puits', 'la poulie', 'la citerne d\'arrosage', 'dallage et abreuvoir', 'le château d\'eau'],
    stats: [['eau', 'Arrosoir', [10, 15, 20, 30, 45], (x) => x + ' doses'], ['eau', 'La citerne arrose seule tes semis', [0, 0, 12, 20, 32], (x) => x + ' fois']], neufs: { 1: [['auto', 'Il remplit ton arrosoir dès que ton perso passe à 2 cases']] } },
  enclos: { role: 'Tes Bouftous y vivent et font de la laine.', looks: ['l\'enclos', 'portique et abreuvoir', 'clôture peinte et mangeoire', 'la bergerie et les cisailles', 'le ranch de Redemption'],
    stats: [['bouftou', 'Bouftous', [2, 3, 4, 5, 6]], ['cases', 'Cases d\'enclos', [6, 8, 10, 12, 14]], ['laine', 'Laines avant la tonte', [3, 3, 5, 7, 9]], ['repas', 'Repus après un repas', [1, 1.5, 1.5, 1.5, 1.5].map((k) => Math.round(DUREE_REPAS * k / MIN)), (x) => x + ' min']], neufs: { 2: [['etoile', 'Ils mangent seuls le Blé de la grange']] } },
  voliere: { role: 'Tes Tofus capturés y donnent des plumes.', looks: ['le petit module', 'la grande volière à lattes', 'le chalet-volière', 'piliers de pierre et treillis', 'la halle de Redemption'],
    stats: [['tofu', 'Places pour tes Tofus', [2, 4, 6, 8, 10]]], neufs: { 1: [['cases', 'Elle prend une case de plus, à côté']] } },
  nivEtal: { role: 'Tu y vends tes récoltes et y achètes tes graines.', looks: ['l\'étal', 'la charrette', 'graines et balance', 'le comptoir couvert', 'le comptoir de Redemption'],
    stats: [['kama', 'Tes ventes', [0, 10, 10, 15, 20], (x) => '+' + x + ' %'], ['pousse', 'Prix des graines', [0, 0, 15, 15, 20], (x) => '-' + x + ' %']] },
  engrais: { stats: [['pousse', 'Temps de pousse de tes cultures', [0, 15, 28, 39, 48], (x) => '-' + x + ' %']] }, /* (0,85 a la puissance du niveau) */
  epouvantail: { role: 'Il éloigne les Tofus de tes champs. Les Wabbits, eux, n\'en ont pas peur.', looks: [null, null, null, 'il prend une arbalète', null, 'le PÉPITO-TRON', null],
    stats: [['tofu', 'Tofus qui viennent picorer', ['', '2 fois moins', '3 fois moins', '3 fois moins', '3 fois moins', '3 fois moins', '3 fois moins'], (x) => x],
      ['degats', 'Il tire sur les Tofus : dégâts', [0, 0, 0, 40, 60, 150, 150]], ['portee', 'Portée', ['', '', '', enCases(EPOU[3].portee) + ' cases', 'toute ta ferme', 'toute ta ferme', 'toute ta ferme'], (x) => x],
      ['cadence', 'Il tire au bout de', ['', '', '', dureeLisible(EPOU[3].delai), dureeLisible(EPOU[4].delai), dureeLisible(EPOU[5].delai), dureeLisible(EPOU[5].delai)], (x) => x], ['cadence', 'Un tir toutes les', [0, 0, 0, 3.5, 2.2, 1, 1], (x) => virgule(x) + ' s']],
    neufs: { 3: [['carreaux', 'Une flèche par tir, prise dans ta réserve']], 4: [['tofu', 'Il tire aussi sur le Tofu sauvage dans l\'herbe'], ['auto', 'Des réglages : tu choisis sur quels Tofus il tire']], 5: [['kama', 'Le laser est gratuit : plus de flèche ni de kamas'], ['tofu', 'Chaque Tofu abattu laisse sa Plume de Tofu']], 6: [['degats', 'Il tire aussi sur les voleurs de VSA, ceux des raids compris : ' + DEG_PEPITO_VSA + ' dégâts par tir']] } },
  bottes: { stats: [['vitesse', 'Ton perso marche plus vite', [0, Math.round(BOTTES * 100)], (x) => '+' + x + ' %']] },
  leurre: { role: 'Une fausse Cawotte qui attire les Wabbits loin de tes Cawottes et de tes Fraises (pas ceux des vagues). Il ne les chasse pas : c\'est à toi de venir.', looks: [null, 'la fausse Cawotte en bois peint', 'la Cawotte au caramel', 'le panier à ressort'],
    stats: [['protege', 'Wabbits qui filent dessus', ['', '1 sur 2', '3 sur 4', 'tous'], (x) => x], ['cadence', 'Le Wabbit y reste', ['', dureeLisible(DUREE_PICORAGE), 'jusqu\'à ce que tu viennes', 'pris au panier'], (x) => x]] },
  cloche: { stats: [['cadence', 'Temps pour chasser un Tofu ou un Wabbit avant qu\'il vole', [1, 2], (x) => dureeLisible(x * DUREE_PICORAGE)]] },
  semences: { stats: [['pousse', 'Graine rendue à la récolte', ['', '1 fois sur 4'], (x) => x]] },
  forge: { stats: [['etoile', 'Forgemagie de tes pièces', ['', '+20 % de jet par rune'], (x) => x]] },
  atelier: { stats: [['etoile', 'Fabrication', ['', 'carreaux d\'acier'], (x) => x]] },
  faux: { stats: [['epi', 'Récolte de chaque parcelle', ['', '+1 (Blé : 3 → 4)'], (x) => x]] },
  geliere: { role: 'Tes Gelées y vivent au bord de l\'eau et font tes pots de gelée avec tes fruits.', looks: [null, 'le pré aux gelées', 'le parc à gelées', 'l\'atelier de confiture', 'la confiserie de Redemption'], stats: [['cases', 'Places pour tes Gelées', [0, 2, 4, 6, 8]]], neufs: { 1: [['cases', 'Elle prend 6 cases d\'herbe (3 sur 2)']] } }
};
/* les deux parties de l'onglet Ameliorations */
/* « le systeme qu'on a fait a l'HDV dans Achat est super, on pourrait faire le meme principe pour les ameliorations ? » (Mathieu, 13/10/2026) : trois categories
   en haut, chacune avec le nombre d'ameliorations que tu peux acheter tout de suite ; dedans, une phrase sur leur role, ce qui s'achete d'abord, puis ce qui attend
   un niveau, puis ce qui est au maximum */
const CATS_AMELIO = [['ferme', 'Ferme', 'puits', 'Ton puits, ton étal de l\'HDV et tes ateliers.', ['nivPuits', 'nivEtal', 'forge', 'atelier']], /* (l'atelier de forgemagie ici depuis le 15/10/2026, « pas dans Défense », Mathieu) */
  ['animaux', 'Animaux', 'bouftou', 'Plus de place pour tes Bouftous, tes Tofus et tes Gelées : plus de laine, de plumes et de pots de gelée.', ['enclos', 'voliere', 'geliere']],
  ['defense', 'Défense', 'tour', 'Protéger ta ferme : la grange et son arbalète contre les voleurs de VSA, l\'épouvantail contre les Tofus, le leurre contre les Wabbits, et ton gardien.', ['qg', 'arbalete', 'epouvantail', 'leurre', 'gardien']]];
/* CONSTRUIRE (22/10/2026) : ce qui se construit une premiere fois ; une fois construit, ca passe dans Ameliorer (les tours restent ici jusqu'a la derniere,
   chacune se monte de niveau depuis sa propre fenetre). OUTILS : les achats qui rendent le travail plus facile, dans Acheter. */
const CONSTRUCTIONS = ['arbalete', 'tours', 'geliere', 'forge', 'atelier', 'leurre', 'gardien'], OUTILS = ['engrais', 'semences', 'faux', 'bottes', 'cloche'];
const construit = (id) => (id === 'gardien' ? !!S_.gardien : id === 'tours' ? nbTours() >= TOURS_MAX : niv(id) > 0);
/* L'ATELIER CACHE AUX JOUEURS (09/11/2026, « retire l'atelier pour le moment aux joueurs aussi, tant qu'on n'a pas tout fini », Mathieu) : seuls les testeurs
   (TESTEURS_ULTI, comme le Casino) le voient a l'HDV et peuvent l'ouvrir ; aucun joueur ne l'avait construit (seul Rorschach, le compte de Mathieu) */
const amelioCachee = (id) => false; /* (l'atelier : visible de tous depuis le 12/11/2026 ; la fonction reste pour la prochaine construction a cacher) */
const aConstruire = () => CONSTRUCTIONS.filter((id) => !construit(id) && !amelioCachee(id));
/* ou en est une amelioration : 'dispo' (ok : assez de kamas), 'bloque' (un niveau ou une amelioration d'abord), 'fini' */
function etatAmelio(id) {
  if (id === 'gardien') return etatGardien(); /* (le gardien n'est pas une amelioration : un choix, au niveau 60) */
  if (id === 'tours') { const n = nbTours(), ct = PRIX_TOUR[Math.min(n, PRIX_TOUR.length - 1)]; return niveau(S_.xp) < NIV_TOUR ? { e: 'bloque' } : n >= TOURS_MAX ? { e: 'fini' } : { e: 'dispo', ok: S_.kamas >= ct }; }
  const a = AMELIOS.find((x) => x.id === id), n = niv(id); if (n >= a.couts.length) return { e: 'fini' };
  if ((a.requiert && !niv(a.requiert)) || niveau(S_.xp) < nivRequis(a, n) || verrouVague(a)) return { e: 'bloque' };
  return { e: 'dispo', ok: S_.kamas >= a.couts[n] && !(id === 'qg' && n === 4 && manqueChateau()) };
}
const PARTIES_AMELIO = [['', 'Productivité', 'Produire plus et plus vite : eau, Bouftous, Tofus, ventes.', ['nivPuits', 'enclos', 'voliere', 'nivEtal']],
  ['', 'Défense', 'Protéger ta ferme des voleurs de VSA, des monstres des vagues, des Tofus et des Wabbits.', ['qg', 'arbalete', 'tours', 'epouvantail', 'cloche', 'leurre']]];
/* les cellules d'amelioration, style A (« la A pour arbalete, niquel », Mathieu, 12/10/2026, sur design-amelio-cellules.html) : l'icone, le nom en grand,
   le niveau en crans, une phrase, puis ce que change le prochain achat en lignes nettes (picto gris, libelle, avant → apres), sans cases ni emojis */
const GRIS_PICTO = '#a3957a';
const crans = (on, total, txt) => '<div class="a-niv">' + (total ? Array.from({ length: total }, (_, k) => '<i' + (k < on ? ' class="on"' : '') + '></i>').join('') : '') + '<span>' + (txt || 'niveau ' + on + ' sur ' + total) + '</span></div>';
const ligneGain = (e, t, v) => '<dt>' + (PICTOS[e] ? picto(e, GRIS_PICTO) : '<i></i>') + '<span class="lib">' + t + '</span></dt><dd>' + v + '</dd>';
const ilManque = (cout) => S_.kamas < cout ? '<span class="a-manque">il manque ' + fmt(cout - S_.kamas) + ' ' + KAMA + '</span>' : '';
/* ce que change le prochain achat (ou, au maximum, ce qu'on a) */
function lignesGain(G, n, fini) {
  const k = fini ? n : n + 1;
  const L = G.stats.map(([e, t, V, f]) => { f = f || fmt; const av = V[n], ap = V[Math.min(k, V.length - 1)];
    if (fini) return av ? ligneGain(e, t, '<b>' + f(av) + '</b>') : '';
    if (av === ap) return '';
    return av ? ligneGain(e, t, '<s>' + f(av) + '</s> → <b>' + f(ap) + '</b>') : ligneGain(e, t, '<b' + (n ? ' class="nouv"' : '') + '>' + f(ap) + '</b>');
  }).join('') + (!fini && G.neufs && G.neufs[k] ? G.neufs[k].map(([e, t]) => ligneGain(e, t, '<b class="nouv">nouveau</b>')).join('') : '');
  return L ? '<dl class="a-gains">' + L + '</dl>' : '';
}
function artAmelio(a) {
  const nv = niveau(S_.xp), n = niv(a.id), fini = n >= a.couts.length, cout = fini ? 0 : a.couts[n], bloque = !fini && (nv < nivRequis(a, n) || verrouVague(a)), manqueReq = a.requiert && !niv(a.requiert), bat = NIVBAT[a.id] || a.id === 'arbalete';
  const place = fini ? '' : a.id === 'qg' && n === 4 && !bloque && manqueChateau() ? manqueChateau() : a.id === 'voliere' && n === 0 && bloqueursVoliere().length ? 'Libère une case à côté de la volière' : a.id === 'geliere' && n === 0 && !bloque && !blocLibreGeliere() ? 'Libère 6 cases d\'herbe d\'un seul tenant (3 sur 2)' : a.id === 'forge' && n === 0 && !bloque && !caseLibreForge() ? 'Libère une case d\'herbe' : a.id === 'leurre' && n === 0 && !bloque && !caseLibreLeurre() ? 'Libère une case d\'herbe' : '';
  const plusieurs = a.couts.length > 1, numSuiv = NIVBAT[a.id] ? n + 2 : n + 1, G = GAINS[a.id];
  const total = bat ? (a.id === 'qg' ? 6 : a.id === 'arbalete' ? a.couts.length : 5) : plusieurs ? a.couts.length : 0, actuel = bat ? (a.id === 'arbalete' ? n : n + 1) : n; /* (la grange : 6 niveaux, le 6e est le chateau ; l'arbalete : 6 avec la baliste d'acier, 14/11/2026, elle affichait « 5 sur 5 ») */
  const look = !fini && G && G.looks && G.looks[n + 1];
  const suiv = fini ? (plusieurs ? 'Niveau maximum' : 'Acquis') : plusieurs ? ((a.id === 'arbalete' || a.id === 'geliere') && !n ? 'En la construisant' : 'Au niveau ' + numSuiv + (look ? ', ' + look : '')) : 'En l\'achetant';
  const achat = fini ? '<span class="a-etat">' + (plusieurs ? 'Niveau maximum atteint' : 'Déjà acheté') + '</span>'
    : manqueReq ? '<span class="a-etat">' + picto('cadenas', GRIS_PICTO) + AMELIOS.find((x) => x.id === a.requiert).nom.split(' sur ')[0] + ' d\'abord</span>'
    : bloque ? '<span class="a-etat">' + picto('cadenas', GRIS_PICTO) + (verrouVague(a) ? 'Après la vague ' + a.apresVague : 'Paysan niveau ' + nivRequis(a, n)) + '</span>'
    : (place ? '<span class="a-manque">' + place + '</span>' : ilManque(cout)) + '<button class="btn kamas" data-amelio="' + a.id + '"' + (S_.kamas < cout || place ? ' disabled' : '') + '>' + (a.id === 'qg' && n === 4 ? 'Bâtir le château' : (a.id === 'arbalete' || a.id === 'geliere' || a.id === 'leurre') && !n ? 'Construire' : plusieurs ? 'Niveau ' + numSuiv : 'Acheter') + ' · ' + fmt(cout) + ' ' + KAMA + '</button>';
  const gains = G ? lignesGain(G, n, fini) : '';
  return '<div class="amel' + (bloque ? ' verrou' : '') + '"><img class="a-ico" src="assets/icones/' + (ICONES[a.id] || 'coffre') + '.png?v=' + VERSION_MODELES + '" alt=""><h3>' + a.nom + '</h3>' + crans(actuel, total, total ? '' : fini ? 'acquis' : 'achat unique') +
    '<p class="a-desc">' + (G && G.role ? G.role : a.desc) + '</p>' + (gains ? '<div class="a-prochain">' + suiv + '</div>' + gains : '') + '<div class="a-achat">' + achat + '</div></div>';
}
/* un batiment : ce qu'on a, puis ce qu'apporte le niveau suivant ; une amelioration simple : sa description */
function descAmelio(a, n, bat) {
  const P = PALIERS_BAT[a.id]; if (!bat || !P) return a.desc;
  const ici = n, suiv = n + 1, numSuiv = a.id === 'arbalete' ? suiv : suiv + 1; /* (l'arbalete compte depuis 0 : pas construite) */
  return '<b>Maintenant</b> : ' + P[ici] + (P[suiv] ? '<br><b>Niveau ' + numSuiv + '</b> : ' + P[suiv] : '');
}
/* les ameliorations d'un lieu, proposees directement dans sa fenetre */
const lignesAmelio = (ids, titre) => '<div class="hdv-section">' + titre + '</div>' + ids.map((id) => AMELIOS.find((a) => a.id === id)).filter(Boolean).map(artAmelio).join('');
const qteDe = (id, opts) => { const q = (ouvrirHdv.qtes || {})[id]; return opts.some(([v]) => v === q) ? q : opts[0][0]; }; /* la quantite choisie pour cet article */
const segQte = (id, opts) => '<span class="seg mini">' + opts.map(([v, t]) => '<button data-qte-item="' + id + '" data-qte-v="' + v + '" aria-pressed="' + (qteDe(id, opts) === v) + '">' + t + '</button>').join('') + '</span>';
/* LES PRIX DE L'HDV, EN CLAIR (14/11/2026, « revoir, rendre plus comprehensible le systeme de hausse et de baisse des ventes de ressources », Mathieu) :
   chaque ressource dit l'ecart de son prix au prix normal, en pourcentage colore (vert : bon prix, gris : normal, rouge : prix bas ; « plus simple », sans jauge) ;
   avant, « en hausse » ou « en baisse » ne comparait qu'au prix d'il y a 2 minutes, et le Ble en crise a -40 % pouvait s'afficher « en hausse » */
function etatCours(id) { const pct = Math.round(((S_.cours[id] || 1) - 1) * 100);
  return '<span class="cours ' + (pct >= 8 ? 'c-haut' : pct <= -8 ? 'c-bas' : 'c-normal') + '" title="Écart au prix normal">' + (pct > 0 ? '+' : pct < 0 ? '−' : '') + Math.abs(pct) + ' %</span>'; } /* (classes prefixees : .haut est la barre du haut de l'ecran) */
const aideCours = () => '<p class="hdv-aide cours-aide">Le % donne l\'écart au prix normal. Toutes les 2 min, chaque prix bouge un peu et revient vers la normale : un prix bas remonte, un bon prix redescend. Prochain changement dans ' + dureeLisible(Math.max(0, (S_.prochainCours || 0) - Date.now())) + '.</p>';
function ouvrirHdv(onglet) { /* (redessinee sur le meme onglet et la meme categorie : on reste au meme endroit de la liste) */
  const avant = modaleOuverte === 'hdv' ? { o: ouvrirHdv.dernier, c: ouvrirHdv.cat, y: $('carte').scrollTop } : null;
  ouvrirHdv0(onglet); if (avant && avant.o === ouvrirHdv.dernier && avant.c === ouvrirHdv.cat) $('carte').scrollTop = avant.y;
}
function ouvrirHdv0(onglet) {
  onglet = onglet || ouvrirHdv.dernier || 'vendre'; ouvrirHdv.dernier = onglet;
  const nConstruire = aConstruire().filter((id) => { const x = etatAmelio(id); return x.e === 'dispo' && x.ok; }).length; /* (ce qu'on peut construire tout de suite : la pastille orange de l'onglet) */
  const tete = '<div class="hdv-tete">' + [['acheter', 'Acheter'], ['vendre', 'Vendre'], ['construire', 'Construire'], ['ameliorer', 'Améliorer']].map(([k, t]) => '<button class="btn" data-hdv-onglet="' + k + '" aria-pressed="' + (onglet === k) + '">' + t + (k === 'construire' && nConstruire ? '<span class="hdv-pret" title="' + nConstruire + ' à construire tout de suite">' + nConstruire + '</span>' : '') + '</button>').join('') + '<span class="solde">' + fmt(S_.kamas) + ' ' + KAMA + '</span></div>';
  const choixQte = (options) => { const q = ouvrirHdv.qte = options.some(([v]) => v === ouvrirHdv.qte) ? ouvrirHdv.qte : 1; return '<div class="hdv-qte">Quantité <span class="seg">' + options.map(([v, t]) => '<button data-hdv-qte="' + v + '" aria-pressed="' + (q === v) + '">' + t + '</button>').join('') + '</span></div>'; };
  const etatHdv = S_.cases.some((c) => c.type === 'hdv') && (degatsBat('hdv') || enRuine('hdv')) ? artPv('hdv') : '';
  if (onglet !== 'ameliorer' && onglet !== 'construire' && enRuine('hdv')) { ouvrirModale('hdv', entete('Hôtel de vente') + tete + etatHdv); return; }
  const carte = (id) => id === 'tours' ? artTour() : id === 'gardien' ? artGardien() : artAmelio(AMELIOS.find((a) => a.id === id));
  if (onglet === 'construire') {
    const L = aConstruire(), par = (e) => L.filter((id) => etatAmelio(id).e === e), faits = CONSTRUCTIONS.filter((id) => !L.includes(id) && !amelioCachee(id));
    ouvrirModale('hdv', entete('Hôtel de vente') + tete + etatHdv + '<p class="hdv-aide">Les bâtiments que tu n\'as pas encore. Une fois construits, ils passent dans <b>Améliorer</b>, où ils montent de niveau. Ils se posent tout seuls sur une case libre, puis se déplacent avec Aménager.</p>' +
      par('dispo').map(carte).join('') + (par('bloque').length ? '<div class="hdv-section">À débloquer</div>' + par('bloque').map(carte).join('') : '') +
      (L.length ? '' : '<p class="hdv-aide">Tout est construit ! Leurs niveaux se montent dans Améliorer.</p>') +
      (faits.length ? '<p class="hdv-aide" style="margin-top:10px">Déjà construits : ' + faits.map((id) => ({ tours: 'tes ' + TOURS_MAX + ' tours', gardien: gardienDe() ? gardienDe().nom : '', arbalete: 'l\'arbalète de la grange', geliere: 'la Gelière', forge: 'l\'atelier de forgemagie', leurre: 'le leurre à Wabbits' })[id]).join(', ') + '.</p>' : '')); return;
  }
  if (onglet === 'ameliorer') {
    const pretes = (L) => L.filter((id) => !amelioCachee(id) && (construit(id) || !CONSTRUCTIONS.includes(id))).filter((id) => { const x = etatAmelio(id); return x.e === 'dispo' && x.ok; }).length;
    if (!ouvrirHdv.catA) ouvrirHdv.catA = (CATS_AMELIO.find((C) => pretes(C[4])) || CATS_AMELIO[0])[0]; /* (la premiere fois : la ou il y a quelque chose a acheter) */
    const C = CATS_AMELIO.find(([k]) => k === ouvrirHdv.catA) || CATS_AMELIO[0], ici = C[4].filter((id) => !amelioCachee(id) && (!CONSTRUCTIONS.includes(id) || construit(id))), par = (e) => ici.filter((id) => etatAmelio(id).e === e);
    const versConstruire = nConstruire ? '<p class="hdv-aide">' + nConstruire + ' bâtiment' + (nConstruire > 1 ? 's' : '') + ' à construire : <button class="lien" data-hdv-onglet="construire">onglet Construire</button>.</p>' : '';
    const cats = '<div class="hdv-cats">' + CATS_AMELIO.map(([k, t, i, , L]) => { const n = pretes(L); return '<button data-hdv-cat-a="' + k + '" aria-pressed="' + (C[0] === k) + '"><img src="assets/icones/' + i + '.png?v=' + VERSION_MODELES + '" alt="">' + t + (n ? '<span class="hdv-pret" title="' + n + ' à acheter tout de suite">' + n + '</span>' : '') + '</button>'; }).join('') + '</div>';
    const bloque = par('bloque'), fini = par('fini');
    ouvrirModale('hdv', entete('Hôtel de vente') + tete + cats + '<p class="hdv-aide">' + C[3] + '</p>' + versConstruire + (ici.length ? '' : '<p class="hdv-aide">Rien encore : construis d\'abord (onglet Construire).</p>') + par('dispo').map(carte).join('') +
      (bloque.length ? '<div class="hdv-section">À débloquer</div>' + bloque.map(carte).join('') : '') + (fini.length ? renvoiMaFerme(fini.length, 'amélioration au maximum', 'améliorations au maximum') : '')); return;
  }
  if (onglet === 'acheter') {
    /* « le x1 ou x10, faudrait le mettre partout au meme endroit que le bouton d'achat ; pour les nouveaux joueurs, c'est pas intuitif de scroller pour voir
       qu'il y a les Bouftous, les filets et les fleches ; et expliquer a quoi ils servent, les rendre plus visibles avant ce qui n'est pas debloque »
       (Mathieu, 12/10/2026) : trois categories visibles en haut, la quantite a cote de chaque bouton, une phrase sur l'usage, les graines a debloquer en dernier */
    const cat = ouvrirHdv.cat || 'graines', cap = capacite(), pc = (e, t) => '<span class="puce">' + picto(e, '#8a7a5c') + t + '</span>';
    const cats = '<div class="hdv-cats q6">' + [['graines', 'Graines', 'ble'], ['animaux', 'Animaux', 'bouftou'], ['materiel', 'Matériel', 'fleches'], ['outils', 'Outils', 'faux'], ['gelees', 'Gelées', 'pot-petit'], ['deco', 'Déco', 'deco-lanterne']].map(([k, t, i]) => '<button data-hdv-cat="' + k + '" aria-pressed="' + (cat === k) + '"><img src="assets/icones/' + i + '.png?v=' + VERSION_MODELES + '" alt="">' + t + '</button>').join('') + '</div>';
    let corps = '';
    if (cat === 'graines') {
      const ouvertes = CULTURES.filter(debloquee), fermees = CULTURES.filter((c) => !debloquee(c) && !(c.nuit && !nuitDebloquee())); /* (la plante de nuit ne s'annonce pas avant le palier 10) */
      corps = '<p class="hdv-aide">Une graine plantée sur une parcelle donne une récolte à revendre. Les plus longues à pousser rapportent plus.</p>' + ouvertes.map((c) => {
        const p = prixGraine(c), st = S_.graines[c.id] || 0, opts = c.max ? [[1, '×1']] : [[1, '×1'], [10, '×10']], n = qteDe('g:' + c.id, opts), plein = c.max && arbresAchetables(c) <= 0; /* (le bananier : un a la fois, 2 au plus, 06/11/2026) */
        return '<div class="art">' + ico(c.id) + '<div><b>Graines ' + de(c.nom) + '</b><div class="puces">' + pc('vitesse', dureeLisible(duree(c))) + pc('epi', '×' + c.rendement + ' à la récolte') + '<span class="puce">' + st + ' en grange</span>' + (c.mange ? '<span class="puce bonne">repas : ' + c.mange.txt + '</span>' : '') + '</div>' +
          (c.arbre ? '<div class="desc">Un arbre rare : ' + c.max + ' au plus sur ta ferme, sur une parcelle ou directement dans l\'herbe (une parcelle labourée pour lui). Il pousse une fois, puis reste et redonne un régime de ' + c.rendement + ' toutes les ' + dureeLisible(duree(c) * (1 - c.arbre)) + '. Avant une vague, ton perso en mange un : ' + c.mange.txt + ' pendant toute la vague.</div>'
            : c.mange ? '<div class="desc">Une culture à manger : avant une vague, dans la fenêtre Vagues, ton perso en mange une récolte et gagne ' + c.mange.txt + ' pendant toute la vague. Elle se vend aussi.</div>' : '') + '</div>' +
          '<div class="act"><small>' + fmt(p) + ' ' + KAMA + (c.arbre ? ' le bananier' : ' la graine') + '</small>' + (c.max ? '' : segQte('g:' + c.id, opts)) + (plein ? '<span class="cadenas">Tu as tes ' + c.max + ' bananiers</span>' : '<button class="btn kamas" data-graines="' + c.id + '" data-n="' + n + '"' + (S_.kamas >= n * p ? '' : ' disabled') + '>Acheter ×' + n + ' = ' + fmt(n * p) + ' ' + KAMA + '</button>' + manque(n * p)) + '</div></div>';
      }).join('') + (fermees.length ? '<div class="hdv-section">À débloquer en montant de niveau</div>' + fermees.map((c) => '<div class="art verrou">' + ico(c.id) + '<div><b>Graines ' + de(c.nom) + '</b></div><div class="act"><span class="cadenas">' + picto('cadenas', '#a3957a') + 'Niveau ' + c.niv + '</span></div></div>').join('') : '');
    } else if (cat === 'animaux') {
      const plein = S_.bouftous.length + enGestation() >= cap;
      corps = '<div class="art">' + ico('bouftou') + '<div><b>Bouftou</b><div class="puces"><span class="puce' + (plein ? ' mauvaise' : '') + '">' + picto('bouftou', '#8a7a5c') + S_.bouftous.length + '/' + cap + ' dans l\'enclos</span>' + pc('repas', 'mange ' + REPAS + ' Blé') + pc('laine', 'sa laine : ' + LAINE.prix + ' ' + KAMA) + '</div>' +
        '<div class="desc">Il vit dans l\'enclos. Nourri, il fait de la laine que tu revends. Deux adultes peuvent faire un petit (' + COUT_REPRO + ' Houblon). Pour plus de place, améliore l\'enclos.</div></div>' +
        '<div class="act"><small>' + (plein ? 'Enclos plein' : S_.bouftousAchetes ? 'à l\'unité' : 'le premier à prix doux') + '</small><button class="btn kamas" data-bouftou' + (plein || S_.kamas < prixBouftou() ? ' disabled' : '') + '>Acheter ' + fmt(prixBouftou()) + ' ' + KAMA + '</button>' + (plein ? '' : manque(prixBouftou())) + '</div></div>' +
        (() => { const pb = prixAchatBle(), opts = [[10, '×10'], [50, '×50']], n = qteDe('ble-achat', opts); /* (05/11/2026 : du Ble pour les Bouftous quand les parcelles sont prises) */
          return '<div class="art">' + ico('ble') + '<div><b>Blé pour tes Bouftous</b><div class="puces">' + pc('repas', 'un repas : ' + REPAS + ' Blé') + '<span class="puce">' + (S_.grange.ble || 0) + ' en grange</span></div><div class="desc">Quand tes parcelles sont occupées. Il coûte plus cher que le faire pousser (le double de son prix de vente).</div></div>' +
            '<div class="act"><small>' + pb + ' ' + KAMA + ' le Blé</small>' + segQte('ble-achat', opts) + '<button class="btn kamas" data-ble-achat="' + n + '"' + (S_.kamas >= n * pb ? '' : ' disabled') + '>Acheter ×' + n + ' = ' + fmt(n * pb) + ' ' + KAMA + '</button></div></div>'; })() +
        (niv('geliere') ? '<div class="hdv-section">Les Gelées, pour ta Gelière : ' + (S_.gelees || []).length + ' sur ' + placesGeliere() + ' places</div>' + GELEES_HDV.map((c) => { const G = GELEES[c], pl = (S_.gelees || []).length < placesGeliere(), ok = pl && S_.kamas >= G.prix;
          return '<div class="art">' + ico('gelee-' + c) + '<div><b>' + G.nom + '</b><div class="puces"><span class="puce bonne">son pot : ' + BREF_POT[G.pot] + '</span><span class="puce">mange ' + recetteTxt(G.recette) + ' par pot</span></div><div class="desc">Elle vit au bord de l\'eau, dans ta Gelière, et te fait un pot de sa couleur en ' + dureeLisible(c === 'royale' ? PROD_ROYALE : PROD_GELEE) + ' quand tu la nourris. Une Gelée achetée se croise, mais ne fusionne pas.</div></div>' +
            '<div class="act"><small>' + (pl ? 'à l\'unité' : 'Gelière pleine') + '</small><button class="btn kamas" data-gelee-achat="' + c + '"' + (ok ? '' : ' disabled') + '>Acheter ' + fmt(G.prix) + ' ' + KAMA + '</button>' + (pl ? manque(G.prix) : '') + '</div></div>'; }).join('')
        : '<div class="hdv-section">À débloquer : les Gelées</div>' + GELEES_HDV.map((c) => '<div class="art verrou">' + ico('gelee-' + c) + '<div><b>' + GELEES[c].nom + '</b><div class="puces"><span class="puce">son pot : ' + BREF_POT[GELEES[c].pot] + '</span></div></div><div class="act"><span class="cadenas">' + picto('cadenas', '#a3957a') + (niveau(S_.xp) < NIV_GELIERE ? 'Niveau ' + NIV_GELIERE : 'Construis la Gelière') + '</span></div></div>').join(''));
    } else if (cat === 'gelees') {
      S_.pots = S_.pots || {}; const pv = vieActuelle(), max = statsPerso().pvMax;
      corps = '<p class="hdv-aide">Ta vie remonte doucement toute seule, un pot de gelée la remonte d\'un coup. Tu les bois avec le bouton potion, à côté de ta vie, ou depuis la fenêtre des vagues. Ta vie : ' + Math.round(100 * pv / max) + ' %.</p>' +
        POTS_HDV.map((t) => { const P = POTS[t], o = [[1, '×1'], [5, '×5']], n = qteDe('pot:' + t, o), pr = prixPot(t);
          return '<div class="art">' + ico('pot-' + t) + '<div><b>' + P.nom + '</b><div class="puces"><span class="puce bonne">' + P.effet + '</span><span class="puce">' + (S_.pots[t] || 0) + ' en réserve</span></div><div class="desc">' + P.desc + '</div></div>' +
            '<div class="act"><small>' + fmt(pr) + ' ' + KAMA + ' le pot</small>' + segQte('pot:' + t, o) + '<button class="btn kamas" data-pot-achat="' + t + '" data-n="' + n + '"' + (S_.kamas >= n * pr ? '' : ' disabled') + '>Acheter ×' + n + ' = ' + fmt(n * pr) + ' ' + KAMA + '</button>' + manque(n * pr) + '</div></div>'; }).join('') +
        '<p class="hdv-aide">Les Gelées elles-mêmes, qui font ces pots à ta Gelière, sont dans la catégorie Animaux.</p>';
    } else if (cat === 'outils') { /* (22/10/2026 : sortis d'Ameliorer, ce ne sont pas des batiments) */
      const par = (e) => OUTILS.filter((id) => etatAmelio(id).e === e);
      corps = '<p class="hdv-aide">Des outils pour travailler plus vite : tes cultures poussent plus vite, tu récoltes plus, tu cours plus vite. Achetés une fois, ils servent pour toujours.</p>' + par('dispo').map(carte).join('') +
        (par('bloque').length ? '<div class="hdv-section">À débloquer</div>' + par('bloque').map(carte).join('') : '') + (par('fini').length ? renvoiMaFerme(par('fini').length, 'outil déjà acheté', 'outils déjà achetés') : '');
    } else if (cat === 'deco') { corps = corpsDecoHdv();
    } else {
      const oF = [[1, '×1'], [5, '×5']], nF = qteDe('filets', oF), oA = [[10, '×10'], [50, '×50'], [100, '×100']], nA = qteDe('fleches', oA); /* (×100 le 06/11/2026, « rajoute un x100 en achat pour les flèches », Mathieu) */
      corps = '<div class="art">' + ico('fleches') + '<div><b>Flèches</b><div class="puces"><span class="puce">' + fmt(S_.fleches) + ' en réserve</span>' + (niv('arbalete') ? '<span class="puce ' + (S_.carreaux > 0 ? 'bonne' : 'mauvaise') + '">' + (S_.carreaux > 0 ? 'arbalète : ' + S_.carreaux + '/' + capaciteArbalete() + ' chargé' : 'arbalète à recharger') + '</span>' : '') + '</div>' +
          '<div class="desc">Les munitions de ta défense : l\'arbalète de la grange, les tours et l\'épouvantail tirent une flèche par tir. Sans flèches, ils ne tirent plus.' + (niv('arbalete') ? '' : ' L\'arbalète se construit à l\'HDV, onglet Construire.') + '</div></div>' +
          '<div class="act"><small>' + PRIX_FLECHE + ' ' + KAMA + ' la flèche</small>' + segQte('fleches', oA) + '<button class="btn kamas" data-fleches="' + nA + '"' + (S_.kamas >= nA * PRIX_FLECHE ? '' : ' disabled') + '>Acheter ×' + nA + ' = ' + fmt(nA * PRIX_FLECHE) + ' ' + KAMA + '</button>' + manque(nA * PRIX_FLECHE) + '</div></div>' +
        '<div class="art">' + ico('filet') + '<div><b>Filet de capture</b><div class="puces">' + pc('tofu', 'sur un champ : ' + Math.round(CHANCE_CAPTURE * 100) + ' %') + pc('pousse', 'dans l\'herbe : ' + Math.round(CHANCE_SAUVAGE * 100) + ' %') + '<span class="puce">' + S_.filets + ' en grange</span></div>' +
          '<div class="desc">Pour capturer un Tofu au lieu de le chasser : touche-le avec un filet en poche. Il part dans ta volière et donne des plumes à revendre. Un Tofu sauvage posé dans l\'herbe se laisse mieux attraper.</div></div>' +
          '<div class="act"><small>' + PRIX_FILET + ' ' + KAMA + ' le filet</small>' + segQte('filets', oF) + '<button class="btn kamas" data-filets="' + nF + '"' + (S_.kamas >= nF * PRIX_FILET ? '' : ' disabled') + '>Acheter ×' + nF + ' = ' + fmt(nF * PRIX_FILET) + ' ' + KAMA + '</button>' + manque(nF * PRIX_FILET) + '</div></div>';
    }
    ouvrirModale('hdv', entete('Hôtel de vente') + tete + etatHdv + cats + corps);
    return;
  }
  /* seulement ce qu'on a en grange (« quand on a 0 de quelque chose, ca sert a rien de le mettre dans la liste », Mathieu, 15/10/2026) */
  const lignes = VENDABLES.filter((v) => (S_.grange[v.id] || 0) > 0);
  ouvrirModale('hdv', entete('Hôtel de vente') + tete + etatHdv + aideCours() +
    (lignes.length ? lignes.map((v) => {
      const oV = [[1, '×1'], [10, '×10'], [0, 'Tout']], q = qteDe('v:' + v.id, oV), st = S_.grange[v.id] || 0, p = prix(v.id), avant = (S_.coursAvant && S_.coursAvant[v.id]) || 1, mtn = S_.cours[v.id] || 1, n = q === 0 ? st : Math.min(q, st);
      const tend = etatCours(v.id); /* (14/11/2026 : l'ecart au prix normal, plus « en hausse / en baisse » depuis 2 min) */
      return '<div class="art">' + ico(v.id) + '<div><b>' + v.nom + '</b><div class="puces"><span class="puce">' + fmt(st) + ' en grange</span>' + tend + '</div></div>' +
        '<div class="act"><small>' + p + ' ' + KAMA + ' l\'unité</small>' + segQte('v:' + v.id, oV) + '<button class="btn kamas" data-vendre="' + v.id + '" data-n="' + n + '"' + (n ? '' : ' disabled') + '>Vendre' + (n ? ' ×' + n + ' = ' + fmt(n * p) + ' ' + KAMA : '') + '</button></div></div>';
    }).join('') : '<p style="font-size:.8rem;font-weight:600">Rien à vendre pour l\'instant : récolte, tonds tes Bouftous, ramasse les plumes.</p>'));
}
function ouvrirAmelio() {
  const nv = niveau(S_.xp);
  ouvrirModale('amelio', entete('Améliorer la ferme') + AMELIOS.map((a) => { const n = niv(a.id), fini = n >= a.couts.length, cout = fini ? 0 : a.couts[n], bloque = nv < nivRequis(a, n); const lib = fini ? 'Acquis' : bloque ? 'Niveau ' + nivRequis(a, n) : fmt(cout) + ' ' + KAMA ;
    return '<div class="ligne"><div><b>' + a.nom + (a.couts.length > 1 ? ' ' + n + '/' + a.couts.length : '') + '</b><small>' + a.desc + '</small></div><button class="btn kamas" data-amelio="' + a.id + '"' + (fini || bloque || S_.kamas < cout ? ' disabled' : '') + '>' + lib + '</button></div>'; }).join(''));
}
function ouvrirEnclos() {
  const cap = capacite(), plein = S_.bouftous.length + enGestation() >= cap; /* (les petits a naitre comptent) */
  const betes = S_.bouftous.map((b, j) => {
    const now = Date.now(), faim = now >= b.rassasie, bebe = !adulte(b), repos = Math.max(0, (b.repro || 0) - now), lmax = laineMax(), pleine = b.laine >= lmax, revente = b.noir ? REVENTE_NOIR : bebe ? REVENTE_BEBE : REVENTE_BOUFTOU;
    const etatFaim = faim ? '<span class="eb-mal">' + picto('repas', '#c0392b') + 'A faim : ' + (bebe ? 'il ne grandit plus' : 'plus de laine') + '</span>' : '<span class="eb-bien">' + picto('repas', '#3f8a22') + 'Repu encore ' + dureeLisible(b.rassasie - now) + '</span>';
    const laine = bebe ? '<div class="eb-ligne">' + picto('pousse', GRIS_PICTO) + '<span>Bébé</span><b>grandi à ' + Math.floor(100 * croissance(b)) + ' %</b></div>'
      : '<div class="eb-ligne">' + picto('laine', GRIS_PICTO) + '<span>Laine' + (b.noir ? ' noire' : '') + '</span>' + crans(b.laine, lmax, b.laine + ' sur ' + lmax) + '<b class="eb-suite">' + (pleine ? 'pleine : tonds-le' : faim ? 'en pause' : 'la suivante dans ' + dureeLisible(Math.max(0, CADENCE_LAINE - (b.accu || 0)))) + '</b></div>';
    return '<div class="art eb">' + ico(b.noir ? 'bouftou-noir' : 'bouftou').replace('<img', '<img style="' + (bebe ? 'transform:scale(.7)' : '') + '"') /* (le Bouftou noir a sa propre icone depuis le 07/11/2026 ; avant, la blanche assombrie par un filtre) */ + '<div><b>' + b.nom + (b.noir ? ' <span style="color:var(--or)">★ noir</span>' : '') + '</b><div class="eb-etat">' + etatFaim + (repos ? '<span>' + picto('vitesse', GRIS_PICTO) + 'se repose ' + dureeLisible(repos) + '</span>' : '') + '</div>' + laine + '</div>' +
      '<div class="act mini"><button class="btn ' + (faim ? 'kamas' : 'discret') + ' mini" data-nourrir="' + j + '">Nourrir · ' + repasDe(b) + ' Blé</button><button class="btn mini' + (pleine ? ' kamas' : '') + '" data-tondre="' + j + '"' + (b.laine ? '' : ' disabled') + '>Tondre' + (b.laine ? ' ' + b.laine : '') + '</button><button class="btn discret mini" data-vendre-bouftou="' + j + '" data-info="Le vendre à un autre éleveur : ' + fmt(revente) + ' kamas">Vendre ' + fmt(revente) + '</button></div></div>';
  }).join('');
  const achat = '<div class="art">' + ico('bouftou') + '<div><b>Un Bouftou de plus</b><div class="puces"><span class="puce' + (plein ? ' mauvaise' : '') + '">' + picto('bouftou', '#8a7a5c') + S_.bouftous.length + '/' + cap + ' places</span></div>' + (plein ? '<div class="desc">L\'enclos est plein : agrandis-le juste en dessous.</div>' : '') + '</div>' +
    '<div class="act"><button class="btn kamas" data-bouftou' + (plein || S_.kamas < prixBouftou() ? ' disabled' : '') + '>Acheter ' + fmt(prixBouftou()) + ' ' + KAMA + '</button>' + (plein ? '' : manque(prixBouftou())) + '</div></div>';
  const aPlacer = maxCasesEnclos() - casesEnclos().length;
  const amenager = '<div class="art">' + ico('cloture') + '<div><b>Aménager l\'enclos</b><div class="puces"><span class="puce">' + casesEnclos().length + '/' + maxCasesEnclos() + ' cases</span>' + (aPlacer > 0 ? '<span class="puce bonne">' + aPlacer + ' case' + (aPlacer > 1 ? 's' : '') + ' à placer</span>' : '') + '<span class="puce">2 cases par Bouftou</span></div><div class="desc">Change sa forme (+ pour ajouter une case, − pour en rendre une) ou emmène-le ailleurs, Bouftous compris.</div></div><div class="act">' + (aPlacer > 0 ? '<button class="btn kamas" data-enclos-auto>Placer toute' + (aPlacer > 1 ? 's' : '') + ' seule' + (aPlacer > 1 ? 's' : '') + '</button>' : '') + '<button class="btn ' + (aPlacer > 0 ? 'discret' : 'kamas') + '" data-amenager-enclos>Aménager</button></div></div>';
  const prets = S_.bouftous.filter(peutReproduire).length, noirs = S_.bouftous.filter((b) => b.noir).length, houblon = S_.grange.houblon || 0;
  const attente = S_.bouftous.filter((b) => b.gestation).map((b) => '<span class="puce" style="background:#4a2636">' + b.nom + ' : naissance dans ' + dureeLisible(Math.max(0, b.gestation.fin - Date.now())) + '</span>').join('');
  const repro = '<div class="art">' + ico('bouftou') + '<div><b>Faire un petit</b><div class="puces"><span class="puce ' + (prets >= 2 ? 'bonne' : 'mauvaise') + '">' + prets + ' adulte' + (prets > 1 ? 's' : '') + ' prêt' + (prets > 1 ? 's' : '') + '</span><span class="puce ' + (houblon >= COUT_REPRO ? 'bonne' : 'mauvaise') + '">' + picto('pousse', '#8a7a5c') + COUT_REPRO + ' Houblon (' + houblon + ' en grange)</span><span class="puce">' + (noirs ? 'Noir : 1 chance sur 40 (tu en as ' + noirs + ' ★)' : 'Noir : 1 chance sur 20') + '</span></div><div class="desc"><b>Il faut</b> 2 adultes qui ont mangé et ' + COUT_REPRO + ' Houblon' + (debloquee(PAR_ID.houblon) ? '' : ' (il se cultive au niveau ' + PAR_ID.houblon.niv + ')') + '. Le petit naît après <b>' + dureeLisible(DUREE_GESTATION) + ' de gestation</b> (la future maman s\'arrondit, une bulle rose compte les minutes), et les parents se reposent ' + dureeLisible(REPOS_REPRO) + '.<br>' +
      '<b>Le bébé</b> ne grandit que le ventre plein : ' + REPAS_BEBE + ' Blé par repas, un repas le nourrit ' + dureeLisible(dureeRepas() / 2) + '. Il devient adulte après ' + dureeLisible(DUREE_CROISSANCE) + ' le ventre plein (' + Math.ceil(DUREE_CROISSANCE / (dureeRepas() / 2) - 1e-9) + ' repas), ' + dureeLisible(DUREE_CROISSANCE_NOIR) + ' pour un noir.<br>' +
      '<b>Le Bouftou noir</b> : 1 chance sur 20 puis 1 chance sur 40 si tu en as déjà un, 1 chance sur 2 si les deux parents sont noirs.</div>' + (attente ? '<div class="puces">' + attente + '</div>' : '') + '</div><div class="act"><button class="btn kamas" data-reproduire' + (prets < 2 || plein || houblon < COUT_REPRO ? ' disabled' : '') + '>Faire un petit</button>' + (plein ? '<small class="manque">Plus de place</small>' : '') + '</div></div>';
  ouvrirModale('enclos', entete('Enclos à Bouftous') + amenager + betes + repro + achat + lignesAmelio(['enclos'], 'Améliorer l\'enclos'));
}
function reglagesPepito() {
  const n = niv('epouvantail'); if (n < 4) return ''; /* (des le niveau 4 depuis le 05/11/2026) */
  const ligne = (k, icone, nom, aide, laisse) => { const on = pepitoTire(k); return '<div class="art">' + ico(icone) + '<div><b>' + nom + '</b><div class="desc">' + aide + '</div></div><div class="act"><button class="inter' + (on ? ' on' : '') + '" role="switch" aria-checked="' + on + '" aria-label="' + nom + '" data-pepito="' + k + '"></button><span class="etat-inter' + (on ? ' on' : '') + '">' + (on ? 'Il tire' : laisse) + '</span></div></div>'; }; /* (une icone par reglage : sans elle, le texte tombait dans sa colonne, 19/10/2026) */
  /* (24/10/2026, « je l'ai monte au niveau max, j'ai bien coche les cases, il tire pas » : sa sauvegarde avait les deux reglages coupes. Le bouton « Il tire »
     montrait l'etat mais se lisait comme une action : en cliquant pour le faire tirer, on le coupait. Un vrai interrupteur, vert et pousse a droite quand il tire) */
  return '<div class="hdv-section">' + (n >= 5 ? 'Réglages du PÉPITO-TRON' : 'Réglages de l\'épouvantail') + '</div><p class="hdv-aide">' + (n >= 5 ? 'Pendant les vagues, il tire tout seul. En dehors, à toi de choisir :' : 'À toi de choisir sur quels Tofus il tire :') + '</p>' +
    ligne('champs', 'tofu', 'Les Tofus qui picorent tes champs', (n >= 5 ? 'Chacun te laisse sa Plume de Tofu.' : 'Une flèche par tir.') + ' S\'il les laisse, chasse-les toi-même.', 'Il les laisse') + ligne('sauvage', 'filet', 'Le Tofu sauvage dans l\'herbe', 'Laisse-le si tu veux le capturer au filet pour ta volière.', 'Il le laisse');
}
function ouvrirEpouvantail() {
  ouvrirModale('epouvantail', entete('L\'épouvantail') + (degatsBat('epouvantail') ? artPv('epouvantail') : '') + (() => { const n = niv('epouvantail'), E = EPOU[Math.min(5, n)];
    const etat = n >= 6 ? 'Un laser sur toute ta ferme : les Tofus qui picorent tes parcelles, le Tofu sauvage dans l\'herbe, et les voleurs de VSA (' + DEG_PEPITO_VSA + ' dégâts par tir). Le laser est gratuit, et chaque Tofu abattu te laisse sa Plume de Tofu.' : n >= 5 ? 'Un laser sur toute ta ferme : les Tofus qui picorent tes parcelles et le Tofu sauvage dans l\'herbe. Les monstres des vagues, c\'est à toi. Le laser est gratuit, et chaque Tofu abattu te laisse sa Plume de Tofu.' : n >= 3 ? 'Il tire à l\'arbalète sur les Tofus qui picorent tes parcelles' + (n >= 4 ? ' et sur le Tofu sauvage dans l\'herbe, partout sur ta ferme' : ', à ' + enCases(E.portee) + ' cases autour de lui') + ', ' + dureeLisible(E.delai) + ' après leur arrivée' + '. Une flèche par tir (' + S_.fleches + ' en réserve).' : n === 2 ? 'Les Tofus viennent trois fois moins souvent.' : n === 1 ? 'Les Tofus viennent deux fois moins souvent.' : 'Il fait fuir une partie des Tofus qui viennent picorer tes champs.';
    return '<div class="art">' + ico('epouvantail') + '<div><b>' + (n >= 6 ? 'PÉPITO-TRON blindé' : n >= 5 ? 'PÉPITO-TRON' : 'Épouvantail niveau ' + n) + '</b><div class="desc">' + etat + (n >= 5 ? ' Les Wabbits, il ne les vise pas.' : ' Il ne s\'occupe que des Tofus.') + '</div></div><div></div></div>'; })() + reglagesPepito() + lignesAmelio(['epouvantail', 'cloche'], 'Contre les Tofus'));
}
function ouvrirPuits() {
  ouvrirModale('puits', entete('Le puits') + (degatsBat('puits') ? artPv('puits') + (S_.eau < capaciteEau() || !citernePleine() ? '<div class="ligne"><div><b>Remplir</b><small>Arrosoir ' + S_.eau + '/' + capaciteEau() + (niv('arrosoir') ? ', citerne ' + (S_.citerne || 0) + '/' + capaciteCiterne() : '') + '.</small></div><button class="btn eau" data-remplir>Remplir</button></div>' : '') : '') + '<p style="font-size:.8rem;font-weight:600;margin:0 0 4px">Arrosoir : ' + S_.eau + '/' + capaciteEau() + (niv('arrosoir') ? '. Citerne : ' + (S_.citerne || 0) + '/' + capaciteCiterne() + ' (elle arrose seule les nouveaux semis)' : '') + '. Touche le puits pour remplir ' + (niv('arrosoir') ? 'les deux' : 'l\'arrosoir') + '.</p>' + lignesAmelio(['nivPuits'], 'Améliorer le puits'));
}
function ouvrirGrange(choix) {
  if (choix !== undefined) ouvrirGrange.choix = choix === ouvrirGrange.choix ? null : choix; /* (toucher la meme case la referme) */
  const sel = ouvrirGrange.choix, v = '?v=' + VERSION_MODELES, img = (n) => '<img src="assets/icones/' + n + '.png' + v + '" alt="">';
  const nomCourt = (t) => String(t).replace(/^Graines (du |de la |de l'|des |de )/, ''); /* (le nom sous la case ; « Graines » est deja le titre de la section) */
  const kase = (cle, icone, n, titre, extra) => '<div class="gr-item"><button class="gr-case' + (sel === cle ? ' choisie' : '') + (extra || '') + '" data-grange-case="' + cle + '" data-info="' + titre + '">' + icone + (n != null ? '<b>' + fmt(n) + '</b>' : '') + '</button><i class="gr-nom">' + nomCourt(titre) + '</i></div>'; /* (le nom sous chaque case, 07/11/2026) */
  const grille = (L) => { const vides = (7 - (L.length % 7)) % 7; return '<div class="gr-grille">' + L.join('') + '<span class="gr-item"><span class="gr-case vide"></span></span>'.repeat(vides) + '</div>'; };
  const section = (titre, L, compte) => L.length ? '<h3 class="gr-titre">' + titre + (compte != null ? '<small>' + fmt(compte) + '</small>' : '') + '</h3>' + grille(L) : '';
  const somme = (L, f) => L.reduce((t, x) => t + f(x), 0);
  /* les cases */
  const recoltes = CULTURES.filter((c) => (S_.grange[c.id] || 0) > 0), autres = VENDABLES.filter((x) => !PAR_ID[x.id].temps && (S_.grange[x.id] || 0) > 0);
  const graines = CULTURES.filter((c) => (S_.graines[c.id] || 0) > 0);
  const pots = Object.keys(POTS).filter((t) => S_.pots && S_.pots[t] > 0), R = runes();
  const materiel = pots.map((t) => kase('p:' + t, img('pot-' + t), S_.pots[t], POTS[t].nom))
    .concat(S_.filets ? [kase('filets', img('filet'), S_.filets, 'Filets de capture')] : [])
    .concat(niv('arbalete') && S_.fleches ? [kase('fleches', img('fleches'), S_.fleches, 'Flèches pour l\'arbalète')] : [])
    .concat(R.forge ? [kase('rune:forge', img('rune-forge'), R.forge, RUNES.forge.court)] : []).concat(R.parfaite ? [kase('rune:parfaite', img('rune-parfaite'), R.parfaite, RUNES.parfaite.court)] : []);
  const sac = Object.keys(S_.sac).filter((k) => S_.sac[k] > 0 && obj(k)).sort((x, y) => obj(y).niv - obj(x).niv);
  const gauche = section('Récoltes', recoltes.map((c) => kase('r:' + c.id, img(c.id), S_.grange[c.id], c.nom)), somme(recoltes, (c) => S_.grange[c.id])) +
    section('Laine, plumes et ressources de monstres', autres.map((x) => kase('r:' + x.id, img(x.id), S_.grange[x.id], x.nom)), somme(autres, (x) => S_.grange[x.id])) +
    section('Graines', graines.map((c) => kase('g:' + c.id, '<span class="gr-graine">' + img(c.id) + '</span>', S_.graines[c.id], 'Graines ' + de(c.nom))), somme(graines, (c) => S_.graines[c.id])) +
    section('Pots, matériel et runes', materiel) +
    section('Butin des vagues', sac.map((k) => kase('o:' + k, img(iconeObjet(k)), S_.sac[k] > 1 ? S_.sac[k] : null, obj(k).nom, obj(k).rare ? ' rare' : '')), null).replace(/<small><\/small>/, '') +
    (!recoltes.length && !autres.length && !graines.length && !materiel.length && !sac.length ? '<p class="gr-aide">Ta grange est vide : récolte une culture, tonds un Bouftou, ou passe à l\'HDV.</p>' : '');
  /* le detail de la case touchee */
  let det = '<span class="gr-aide">Touche une case pour voir son détail.</span>';
  if (sel) {
    const [t, id] = sel.includes(':') ? [sel.slice(0, sel.indexOf(':')), sel.slice(sel.indexOf(':') + 1)] : [sel, ''];
    if (t === 'r' && (S_.grange[id] || 0) > 0) { const x = PAR_ID[id], n = S_.grange[id];
      det = img(id) + '<span><b>' + x.nom + '</b> : ' + fmt(n) + ' en grange, ' + fmt(prix(id)) + ' kamas pièce (' + fmt(Math.round(n * prix(id))) + ' en tout).' + (id === 'ble' ? ' Les Bouftous en mangent ' + REPAS + ' par repas.' : '') + '</span><button class="btn kamas" data-hdv-onglet="vendre">Vendre à l\'HDV</button>'; }
    else if (t === 'g' && (S_.graines[id] || 0) > 0) { const c = PAR_ID[id];
      det = '<span class="gr-graine petite">' + img(id) + '</span><span><b>Graines ' + de(c.nom) + '</b> : ' + fmt(S_.graines[id]) + '. ' + Maj(c.nom) + ' pousse en ' + dureeLisible(duree(c)) + ' et rend ' + c.rendement + ' récoltes.</span><button class="btn kamas" data-graine="' + id + '">Planter</button>'; }
    else if (t === 'p' && POTS[id] && S_.pots[id] > 0) det = img('pot-' + id) + '<span><b>' + POTS[id].nom + '</b> (' + S_.pots[id] + ') : ' + POTS[id].effet + '</span>' + (combat ? '' : '<button class="btn kamas" data-boire="' + id + '">Boire</button>');
    else if (t === 'filets' && S_.filets) det = img('filet') + '<span><b>Filets de capture</b> (' + S_.filets + ') : pour attraper un Tofu sauvage quand il se pose dans l\'herbe, et le mettre dans ta volière.</span>';
    else if (t === 'fleches') det = img('fleches') + '<span><b>Flèches</b> (' + fmt(S_.fleches) + ') : la réserve de l\'arbalète' + (nbTours() ? ' et de tes tours' : '') + '. Elles s\'achètent à l\'HDV.</span>';
    else if (t === 'rune' && RUNES[id] && R[id]) det = img('rune-' + id) + '<span><b>' + RUNES[id].court + '</b> (' + R[id] + ') : ' + RUNES[id].bref + ' sur une pièce, à l\'atelier de forgemagie.</span>' + (niv('forge') ? '<button class="btn kamas" data-ouvrir-forge>Atelier</button>' : '<small class="gr-aide">Atelier : Améliorer, catégorie Ferme</small>');
    else if (t === 'o' && obj(id) && (S_.sac[id] || 0) > 0) { const o = obj(id);
      det = img(iconeObjet(id)) + '<span><b>' + (o.rare ? '★ ' : '') + o.nom + '</b> · niveau ' + o.niv + (S_.jets && S_.jets[id] ? ' · jet ' + nomJet(qualiteJet(id)) + ' (' + Math.round(100 * qualiteJet(id)) + ' %)' : '') + '<span class="puces">' + statsObjet(o) + '</span></span>' +
        '<span class="gr-act"><button class="btn kamas" data-perso-slot="' + o.emp + '">Équiper</button><button class="btn discret" data-revendre-objet="' + id + '">Revendre ' + fmt(reventeObjet(id)) + ' ' + KAMA + '</button></span>'; }
  }
  /* a droite : la grange elle-meme */
  const nq = niv('qg'), arb = niv('arbalete'), cap = arb ? capaciteArbalete() : 0, abime = degatsBat('grange') || enRuine('grange');
  const pvG = abime ? artPv('grange') : '<div class="gr-pv"><i></i></div><p class="gr-aide">' + fmt(pvMaxBat('grange')) + ' / ' + fmt(pvMaxBat('grange')) + ' PV : intacte.</p>';
  const arbal = arb ? '<div class="gr-arb">' + img('arbalete') + '<div><b>Arbalète ' + arb + '/' + AMELIOS.find((x) => x.id === 'arbalete').couts.length + '</b><br>' + degatsArbalete() + ' dégâts, ' + enCases(porteeArbalete()) + ' cases<div class="gr-jauge"><i style="width:' + Math.round(100 * S_.carreaux / cap) + '%"></i></div></div><div class="gr-arb-etat">' + S_.carreaux + '/' + cap + ' · ' + fmt(S_.fleches) + ' flèche' + (S_.fleches > 1 ? 's' : '') +
    (rechargeAuto() ? '<br>' + (S_.fleches ? 'se recharge seule' : '<span style="color:var(--rouge)">réserve vide</span>') : S_.carreaux >= cap ? '' : '<br><button class="btn kamas mini" data-recharger' + (S_.fleches ? '' : ' disabled') + '>Recharger</button>') + '</div></div>' + (arb >= 6 ? blocAcier() : '') : ''; /* (l'interrupteur des carreaux d'acier, 09/11/2026) */
  const ligneA = (id, icone) => { const a = AMELIOS.find((x) => x.id === id); if (!a) return ''; const n = niv(id), e = etatAmelio(id), bat = !!NIVBAT[id] || id === 'arbalete', total = bat ? (id === 'qg' ? 6 : id === 'arbalete' ? a.couts.length : 5) : a.couts.length, actuel = bat ? (id === 'arbalete' ? n : n + 1) : n;
    const act = e.e === 'fini' ? '<span class="gr-aide">Niveau max</span>' : e.e === 'bloque' ? '<span class="gr-aide">' + picto('cadenas', GRIS_PICTO) + 'Niveau ' + nivRequis(a, n) + '</span>' : '<button class="btn kamas" data-amelio="' + id + '"' + (e.ok ? '' : ' disabled') + '>' + fmt(a.couts[n]) + ' ' + KAMA + '</button>';
    return '<div class="gr-amel">' + img(icone) + '<span>' + (id === 'qg' ? 'La grange' : 'L\'arbalète') + ' ' + actuel + '/' + total + '</span>' + act + '</div>'; };
  const nt = nbTours(), ct = PRIX_TOUR[Math.min(nt, PRIX_TOUR.length - 1)];
  const tours = '<div class="gr-amel">' + img('tour') + '<span>Tours : ' + nt + ' sur ' + TOURS_MAX + '</span>' + (niveau(S_.xp) < NIV_TOUR ? '<span class="gr-aide">' + picto('cadenas', GRIS_PICTO) + 'Niveau ' + NIV_TOUR + '</span>' : nt >= TOURS_MAX ? '<span class="gr-aide">Toutes construites</span>' : '<button class="btn kamas" data-poser-tour' + (S_.kamas < ct ? ' disabled' : '') + '>Construire ' + fmt(ct) + ' ' + KAMA + '</button>') + '</div>';
  const bA = bouclierActif(), bouclier = '<div class="gr-amel">' + img('bouclier-vsa') + '<span>Bouclier anti-VSA<br><small class="gr-aide">' + (bA ? 'actif encore ' + dureeLisible(S_.bouclierVsa - Date.now()) : '2 h sans simu ni voleur de VSA') + '</small></span>' + /* (07/11/2026) */
    (nq < QG_BOUCLIER ? '<span class="gr-aide">' + picto('cadenas', GRIS_PICTO) + 'Grange niveau 6</span>' : bA ? '<span class="gr-aide">Actif</span>' : '<button class="btn kamas" data-bouclier' + (S_.kamas < PRIX_BOUCLIER ? ' disabled' : '') + '>' + fmt(PRIX_BOUCLIER) + ' ' + KAMA + '</button>') + '</div>';
  const droite = '<div class="gr-carte"><h3 class="gr-titre">La grange<small>niveau ' + (nq + 1) + '</small></h3>' + pvG + arbal + '<h3 class="gr-titre" style="margin-top:12px">Améliorer</h3>' + ligneA('qg', 'grange') + ligneA('arbalete', 'arbalete') + tours + bouclier +
    '<div class="gr-menace">Les voleurs de VSA ont maintenant <b>' + pvVoleur() + ' PV</b> : ils se renforcent à chaque vague gagnée.</div></div>' +
    '<div class="gr-pied"><button class="btn discret" data-perso-slot="">Fiche du perso</button><button class="btn discret" data-hdv-onglet="vendre">Aller à l\'HDV</button></div>';
  ouvrirModale('grange', '<h2>Grange<span class="gr-valeur">Ton stock vaut <b>' + fmt(Math.round(valeurGrange())) + ' kamas</b> à l\'HDV</span><button data-fermer aria-label="Fermer">✕</button></h2>' +
    '<div class="gr-corps"><div class="gr-gauche">' + gauche + '<div class="gr-detail' + (sel ? ' plein' : '') + '">' + det + '</div></div><div class="gr-droite">' + droite + '</div></div>');
}
const SORTS = {
  iop: [['Coup d\'épée', 'Au corps à corps, il frappe le monstre ciblé, et son épée touche aussi les monstres collés à sa cible (' + Math.round(BALAYAGE_IOP * 100) + ' % de ses dégâts).'], ['Bond du Iop', 'Tu vises où il saute (jusqu\'à ' + enCases(PORTEE_BOND) + ' cases) : en retombant, 3 fois ses dégâts sur le monstre le plus proche, 1,5 fois tout autour ; chaque monstre touché lui rend ' + Math.round(SOIN_CHARGE * 100) + ' % de sa vie (' + Math.round(SOIN_BOND_MAX * 100) + ' % au plus). Recharge ' + RECHARGE_SORT + ' s.'], ['Peau de Iop', 'Toujours actif : il encaisse ' + Math.round(PEAU_IOP * 100) + ' % de dégâts en moins sur les coups reçus de loin.'], ['Régénération', 'Toujours active en combat : il regagne ' + Math.round(REGEN_IOP * 100) + ' % de sa vie toutes les ' + PAS_REGEN_IOP + ' s.'], ['Berserker', 'Sous ' + Math.round(SEUIL_BERSERKER_IOP * 100) + ' % de vie, ses coups d\'épée font ' + Math.round((BERSERKER_IOP - 1) * 100) + ' % de dégâts en plus.']],
  cra: [['Flèche', 'À distance (' + Math.round(STATS_CLASSE.cra.portee / S) + ' cases), il tire sur le monstre ciblé.'], ['Flèche perçante', 'Tu vises une ligne de ' + Math.round(PORTEE_PERCANTE / S) + ' cases : la flèche part tout de suite et traverse tous les monstres, 3 fois tes dégâts. Recharge ' + RECHARGE_PERCANTE + ' s.']],
  osa: [['Coup de fouet', 'À portée de fouet (3 cases), il frappe le monstre ciblé.'], ['Invocation', 'Tu vises où poser un Bouftou (jusqu\'à ' + enCases(PORTEE_INVOC) + ' cases) : il retombe en frappant tout autour, 2 fois tes dégâts. Recharge ' + RECHARGE_INVOC + ' s.']]
};
let persoCarac = null; /* la caracteristique dont on lit l'explication */
/* « il faudrait qu'on puisse cliquer dessus pour savoir a quoi ca correspond, meme moi l'agilite je sais pas a quoi elle sert » (Mathieu, 12/10/2026) */
function expliquerCarac(k, st) {
  const c = st.c, virg = (x) => String(x).replace('.', ','), cle = { vita: 'vita', degats: 'puissance', cadence: 'agilite' }[k] || k, cl = CLASSES.find((x) => x.id === classeDe());
  const TXT = {
    vita: ['Points de vie', 'Ta vie pendant les vagues et les simus VSA : à 0, la vague est perdue. Ils montent avec ton niveau (' + fmt(st.base.pv) + ' au niveau ' + st.niveau + '), et la Vitalité de tes équipements en ajoute.'],
    degats: ['Dégâts', 'Ce que fait chacun de tes coups, et la base de tes sorts. Ils montent avec ton niveau (' + st.base.deg + ' au niveau ' + st.niveau + '), puis ta Puissance les augmente de ' + c.puissance + ' %.'],
    cadence: ['Attaque', 'Le temps entre deux attaques : plus il est court, plus tu frappes souvent. Pour un ' + cl.nom + ', c\'est ' + virg(st.base.cadence) + ' s de base ; ton Agilité te fait frapper ' + c.agilite + ' % plus souvent.'],
    portee: ['Portée', 'La distance à laquelle tu touches un monstre : 1 case pour le Iop au corps à corps, 3 cases pour le fouet de l\'Osamodas, 5 cases pour l\'arc du Cra. Elle dépend de ta classe, pas de ton équipement.'],
    puissance: ['Puissance', 'Augmente tes dégâts : +' + c.puissance + ' % sur chacun de tes coups et sur tes sorts.'],
    agilite: ['Agilité', 'Te fait attaquer plus vite : ' + c.agilite + ' % de coups en plus (' + virg(st.base.cadence) + ' s entre deux coups sans elle, ' + virg(st.cadence) + ' s avec).'],
    sagesse: ['Sagesse', 'Te fait gagner plus d\'expérience : +' + c.sagesse + ' % sur tout ce qui en rapporte (récoltes, vagues gagnées, défis, Tofus).'],
    prospection: ['Prospection', 'Augmente tes chances de butin sur les monstres : ressources, pièces d\'équipement et pièces rares (+' + c.prospection + ' %). Une Fraise mangée avant une vague en ajoute 30 %. Dans l\'Arène, celle de ton équipement ne compte pas : seules la Fraise et la carte Flair y comptent.']
  }[k];
  const src = [];
  if (['vita', 'puissance', 'agilite', 'sagesse', 'prospection'].includes(cle)) {
    Object.values(S_.equip || {}).forEach((id) => { const o = obj(id); if (o && o.stats[cle]) src.push(o.nom + ' : +' + o.stats[cle] + CARACS[cle][1]); });
    Object.entries(comptePanos()).forEach(([p, n]) => { const v = bonusPano(+p, n)[cle]; if (v) src.push('Panoplie ' + PANOS[p].de + ' (' + n + ' pièces) : +' + v + CARACS[cle][1]); });
  }
  return '<div class="fp-explique"><b>' + picto(k) + ' ' + TXT[0] + '</b><p>' + TXT[1] + '</p>' + (src.length ? '<div class="fp-src">D\'où vient ta ' + CARACS[cle][0] + ' :<ul>' + src.map((x) => '<li>' + x + '</li>').join('') + '</ul></div>' : (['vita', 'puissance', 'agilite', 'sagesse', 'prospection'].includes(cle) ? '<div class="fp-src">Aucune pièce portée ne t\'en donne pour l\'instant.</div>' : '')) + '</div>';
}
let persoNeufs = {}, persoSel = null, persoFiltre = 'tout', persoOnglet = 'equip', persoEmp = null; /* (persoEmp : l'emplacement touche, ses pieces passent en tete du sac) */ /* les nouveautes de cette ouverture, la piece choisie, le filtre du sac, l'onglet */
const NOMS_EMP = Object.fromEntries(EMPLACEMENTS_PERSO), PLURIELS_EMP = { coiffe: 'Coiffes', cape: 'Capes', amulette: 'Amulettes', anneau: 'Anneaux', ceinture: 'Ceintures', bottes: 'Bottes', arme: 'Armes' };
const accordE = (emp) => emp === 'coiffe' || emp === 'cape' || emp === 'amulette' || emp === 'ceinture' || emp === 'arme' ? 'e' : emp === 'bottes' ? 'es' : '';
/* le portrait du perso habille, rendu a part (une petite scene) et garde tant que sa tenue ne change pas */
let portraitR = null; const portraits = {};
function portraitPerso() {
  const cle = classeDe() + '|' + sexeDe() + '|' + (S_.perso.look || '') + '|' + !!MODELES[modeleDe(classeDe(), S_.perso.look)] + '|' + (S_.equip.coiffe || '') + '|' + (S_.equip.cape || '') + '|' + (S_.equip.arme || '') + '|' + visuelsPrets(); if (portraits[cle]) return portraits[cle];
  try {
    if (!portraitR) { portraitR = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); portraitR.setPixelRatio(1); portraitR.setSize(300, 360); portraitR.setClearColor(0x000000, 0); portraitR.outputEncoding = rendu.outputEncoding; }
    const sc = new T.Scene(); sc.add(new T.HemisphereLight('#fff8ec', '#9db7cf', 0.75)); const d = new T.DirectionalLight('#fff3dc', 0.85); d.position.set(3, 6, 8); sc.add(d);
    const p = paysan(0, 0, 0, classeDe()); scene.remove(p); p.rotation.set(0, 0, 0); p.traverse((o) => { if ((o.userData && o.userData.ombre) || o.material === OMBRE_PIEDS) o.visible = false; }); /* (sans l'ombre ronde sous les pieds : le portrait recadre s'arrete aux semelles) */ sc.add(p); p.updateMatrixWorld(true);
    const bb = new T.Box3().setFromObject(p), c = bb.getCenter(new T.Vector3()), t = bb.getSize(new T.Vector3()), cam = new T.PerspectiveCamera(24, 300 / 360, 0.05, 50);
    cam.position.copy(c).add(new T.Vector3(Math.sin(0.4), 0.22, Math.cos(0.4)).multiplyScalar(t.y * 2.6)); cam.lookAt(c);
    portraitR.render(sc, cam); portraits[cle] = portraitR.domElement.toDataURL('image/png'); sc.remove(p);
  } catch (e) { portraits[cle] = 'assets/icones/' + classeDe() + '.png?v=' + VERSION_MODELES; }
  return portraits[cle];
}
/* LES RUNES DANS L'INVENTAIRE (02/11/2026, « les runes on sait pas ou elles sont, faudrait les rendre plus visibles dans l'inventaire du stuff », Mathieu) :
   en tete du sac, tes runes de forgemagie et tes runes parfaites, et le chemin de l'atelier (avant : une petite ligne, seulement quand on choisissait une piece) */
function blocRunes() {
  const r = runes(), n = r.forge || 0, p = r.parfaite || 0; if (!n && !p && !niv('forge')) return '';
  const rune = (t, x, un, plus) => '<span class="fp-rune' + (x ? '' : ' vide') + '"><img src="assets/icones/rune-' + t + '.png?v=' + VERSION_MODELES + '" alt=""><b>' + x + '</b><small>' + (x > 1 ? plus : un) + '</small></span>';
  return '<div class="fp-runes"><div class="fp-runes-l">' + rune('forge', n, 'rune de forgemagie', 'runes de forgemagie') + rune('parfaite', p, 'rune parfaite', 'runes parfaites') + '</div>' +
    (niv('forge') ? '<button class="btn mini kamas" data-ouvrir-forge>Forger</button>' : '<small>À utiliser à l\'atelier de forgemagie (Améliorer, ' + fmt(100000) + ' kamas).</small>') + '</div>';
}
/* LE BANANIER (03/11/2026) : touché pendant qu'il pousse, il dit quand vient son prochain regime ; on peut l'arracher */
function ouvrirBananier(p) {
  const c = PAR_ID[p.c], d = duree(c), reste = Math.max(0, d - p.pousse), premier = p.pousse < d * c.arbre;
  ouvrirModale('bananier', entete('Ton bananier') + '<div class="art">' + ico(c.id) + '<div><b>' + (premier ? 'Il grandit encore' : 'Un nouveau régime mûrit') + '</b><div class="desc">' + (premier ? 'Son premier régime' : 'Le prochain régime') + ' dans ' + dureeLisible(reste) + '. Ensuite, il reste en place et redonne un régime de ' + c.rendement + ' ' + c.nom + 's toutes les ' + dureeLisible(d * (1 - c.arbre)) + '.</div></div></div>' +
    '<p class="hdv-aide">Un Bananagrume se mange avant un combat : ' + c.mange.txt + '.</p><div class="act-bas"><button class="btn discret" data-arracher="' + p.id + '">Arracher le bananier</button><button class="btn kamas" data-fermer>OK</button></div>');
}
/* LA FICHE D'UNE PANOPLIE (10/11/2026, « quand on clique sur un item d'une panoplie, qu'on ait un bouton panoplie associee », Mathieu) : dans la fiche du perso, a la
   place du detail de la piece : ses six pieces et l'arme de ta classe (portee, dans le sac ou a trouver ; on touche une piece qu'on a pour la voir), ses bonus par
   palier avec leur total actif, et ou elle tombe. On y entre par « Voir la panoplie » (sur une piece, ou sous une panoplie portee), on en sort par « Retour » ou
   en touchant une piece. */
let persoPano = null;
function fichePano(k, sacL) {
  const P = PANOS[k], ar = ARMES[classeDe()], n = comptePanos()[k] || 0, rang = rangPano(k), base = rang * VAGUES_PALIER;
  const ids = EMPLACEMENTS.map(([e]) => P.id + '-' + e).concat(ar && OBJETS['arme-' + ar[0] + '-' + P.id] ? ['arme-' + ar[0] + '-' + P.id] : []);
  const lignes = ids.map((id) => { const o = OBJETS[id]; if (!o) return ''; const meme = (x) => { const b = baseObjet(x); return b === id || b === id + '-rare'; };
    const porte = Object.values(S_.equip).find((x) => x && meme(x)), auSac = sacL.filter(meme).sort((x, y) => qualiteJet(y) - qualiteJet(x)), cle = porte || auSac[0];
    const etat = porte ? '<span class="puce bonne">✓ portée</span>' : auSac.length ? '<span class="puce or">dans ton sac' + (auSac.length > 1 ? ' ×' + auSac.length : '') + '</span>' : '<span class="puce">à trouver</span>';
    return '<button class="fp-pp' + (cle ? '' : ' absent') + '"' + (cle ? ' data-fp-sel="' + cle + '"' : ' disabled') + '><img src="assets/icones/' + iconeObjet(cle || id) + '.png?v=' + VERSION_MODELES + '" alt=""><span><b>' + o.nom + ' ' + etat + '</b><span class="puces">' + statsFourchette(o) + '</span></span></button>'; }).join('');
  const qui = Object.values(MONSTRES).filter((M) => M.pano === P.id && !M.boss).map((M) => M.nom), vagues = 'des vagues ' + (base + 1) + ' à ' + (base + VAGUES_PALIER);
  const ou = (qui.length ? 'Ses pièces tombent sur ' + [...new Set(qui)].join(', ') + ' (' + vagues.replace('des ', '') + ').' : 'Ses pièces tombent sur les monstres ' + vagues + '.') + (ids.length > EMPLACEMENTS.length ? ' L\'arme tombe sur le boss seulement, et compte comme une pièce (6 au plus).' : '');
  return '<div class="fp-bloc fp-detail"><div class="fp-entete"><span class="fp-grosse"><img src="assets/icones/' + iconeObjet(ids[0]) + '.png?v=' + VERSION_MODELES + '" alt=""></span><div><div class="fp-nom">Panoplie ' + P.de + '</div><div class="fp-pils"><span class="fp-pil">niveau ' + OBJETS[ids[0]].niv + '</span><span class="fp-pil' + (n ? ' porte' : '') + '">' + n + '/6 pièces portées</span></div></div></div>' +
    '<div class="fp-pp-liste">' + lignes + '</div>' + blocPano(k, n) + '<p class="fp-aide">' + ou + ' Chaque pièce a ses propres stats, tirées dans la fourchette indiquée.</p>' +
    '<div class="fp-actions"><button class="btn discret" data-fp-pano="">Retour</button></div></div>';
}
/* MA FERME (14/11/2026, « dans l'HDV / Ameliorer, lorsque quelque chose est a son niveau maximum, il n'est plus necessaire de le laisser ici ; par contre les boosts
   qu'on a grace a ces achats devraient etre visibles quelque part », Mathieu) : un onglet de la fiche du perso qui montre tout ce que la ferme a deja (ameliorations,
   batiments, outils), son niveau et ce qu'il te donne aujourd'hui ; les cartes au maximum quittent l'HDV, qui y renvoie */
const renvoiMaFerme = (n, un, des) => '<p class="hdv-aide mf-renvoi">' + n + ' ' + (n > 1 ? des : un) + ' : ' + (n > 1 ? 'leurs' : 'ses') + ' bonus sont dans ta fiche Perso, <button class="lien" data-ma-ferme>onglet Ma ferme</button>.</p>';
function blocMaFerme() {
  const carte = (img, nom, etat, corps) => '<div class="mf-carte"><img src="assets/icones/' + img + '.png?v=' + VERSION_MODELES + '" alt=""><div><b>' + nom + '</b><small>' + etat + '</small>' + corps + '</div></div>';
  const ligne = (id) => {
    if (id === 'tours') { const n = nbTours(); return n ? carte('tour', 'Tours de défense', n + ' sur ' + TOURS_MAX + (n >= TOURS_MAX ? ' · toutes construites' : ''), '<p class="mf-desc">Elles tirent seules sur les monstres et les voleurs. Chacune monte de niveau depuis sa fenêtre.</p>') : ''; }
    if (id === 'gardien') { const G = gardienDe(); return G ? carte(G.ico || 'gardiens', G.nom, 'Ton gardien', '<p class="mf-desc">' + G.nom + ' garde ta ferme et mord les voleurs de VSA.</p>') : ''; }
    const a = AMELIOS.find((x) => x.id === id); if (!a) return ''; const n = niv(id); if (!n) return '';
    const fini = n >= a.couts.length, plusieurs = a.couts.length > 1, bat = NIVBAT[id] || id === 'arbalete', total = bat ? (id === 'qg' ? 6 : id === 'arbalete' ? a.couts.length : 5) : plusieurs ? a.couts.length : 0, actuel = bat ? (id === 'arbalete' ? n : n + 1) : n;
    const G = GAINS[id], gains = G ? lignesGain(G, n, true) : '';
    return carte(ICONES[id] || 'coffre', a.nom, (total ? 'Niveau ' + actuel + ' sur ' + total : 'Acquis') + (fini && total ? ' · maximum' : ''), gains || '<p class="mf-desc">' + a.desc + '</p>');
  };
  const groupes = CATS_AMELIO.map(([, t, , , L]) => [t, L.concat(t === 'Défense' ? ['tours'] : [])]).concat([['Outils', OUTILS]]);
  const html = groupes.map(([t, L]) => { const h = L.map(ligne).join(''); return h ? '<h4 class="fc-sorts">' + t + '</h4><div class="mf-grille">' + h + '</div>' : ''; }).join('');
  return '<p class="hdv-aide">Tout ce que ta ferme a déjà, et ce que ça te donne aujourd\'hui. Les niveaux suivants s\'achètent à l\'HDV.</p>' + (html || '<p class="hdv-aide">Rien encore : améliore ta ferme à l\'HDV.</p>');
}
function ouvrirPerso(sel) {
  if (modaleOuverte !== 'perso') { persoNeufs = Object.assign({}, S_.neufs || {}); S_.neufs = {}; persoOnglet = 'equip'; persoFiltre = 'tout'; persoSel = null; persoCarac = null; persoEmp = null; persoPano = null; }
  if (sel) persoPano = null;
  const dansSac = (k) => S_.sac[k] > 0 && obj(k), sacL = Object.keys(S_.sac).filter(dansSac), equipe = (k) => Object.values(S_.equip).includes(k);
  if (sel && NOMS_EMP[sel]) { persoSel = S_.equip[sel] || sacL.filter((k) => obj(k).emp === sel).sort((x, y) => qualiteJet(y) - qualiteJet(x))[0] || null; } /* un emplacement */
  else if (sel) persoSel = sel; /* une piece */
  const quete = typeof objetsQuete === 'function' ? objetsQuete() : []; /* (les objets de quete, non equipables : la cle du patron, 29b-casino-patron.js) */
  if (persoSel && !(String(persoSel).startsWith('q:') && quete.some((q) => 'q:' + q.id === persoSel)) && !dansSac(persoSel) && !equipe(persoSel)) persoSel = null;
  const ordre = (x, y) => (persoNeufs[y] ? 1 : 0) - (persoNeufs[x] ? 1 : 0) || (comparer(y).mieux ? 1 : 0) - (comparer(x).mieux ? 1 : 0) || obj(y).niv - obj(x).niv || qualiteJet(y) - qualiteJet(x);
  if (!persoSel) persoSel = sacL.filter((k) => persoNeufs[k]).sort(ordre)[0] || sacL.filter((k) => comparer(k).mieux).sort(ordre)[0] || S_.equip.coiffe || Object.values(S_.equip).find(Boolean) || sacL.sort(ordre)[0] || null;
  const st = statsPerso(), c = st.c, cl = CLASSES.find((x) => x.id === classeDe()), l = st.niveau, a = seuil(l), b = seuil(l + 1); S_.nouveaux = 0; rendreHaut();
  const nbNeufs = sacL.filter((k) => persoNeufs[k]).length;
  const tete = '<div class="fp-tete"><span class="fp-mini"><img src="assets/icones/' + icoClasse() + '.png?v=' + VERSION_MODELES + '" alt=""></span><div><b>' + echapper(S_.perso.nom) + '</b><small>' + cl.nom + ' niveau ' + l + '</small></div>' +
    '<div class="fp-xp"><div class="barre"><i style="width:' + (l >= capNiveau() ? 100 : (100 * (S_.xp - a) / Math.max(1, b - a)).toFixed(1)) + '%"></i></div><small>' + (l >= capNiveau() ? (capNiveau() < NIV_MAX ? 'Niveau maximum pour l\'instant : ' + texteCap() : 'Niveau maximum') : fmt(S_.xp - a) + ' / ' + fmt(b - a) + ' XP vers le niveau ' + (l + 1)) + '</small></div>' +
    '<span class="fp-kamas">' + fmt(S_.kamas) + ' ' + KAMA + '</span><button class="fp-fermer" data-fermer aria-label="Fermer">✕</button></div>' +
    '<div class="fp-onglets"><button data-fp-onglet="equip" aria-pressed="' + (persoOnglet === 'equip') + '">Équipement' + (nbNeufs ? '<em>' + nbNeufs + '</em>' : '') + '</button><button data-fp-onglet="sorts" aria-pressed="' + (persoOnglet === 'sorts') + '">Classe et sorts</button><button data-fp-onglet="ferme" aria-pressed="' + (persoOnglet === 'ferme') + '">Ma ferme</button><button data-bestiaire="panoplies">Bestiaire</button></div>';
  const [att, sort] = SORTS[classeDe()], E = enBref(classeDe());
  const icoSort = (q) => { const m = modeleDe(classeDe(), S_.perso.look); return ICONES_3D.has('sort3d-' + m + '-' + q) ? icone3d('sort3d-' + m + '-' + q) : ico('sort-' + m + '-' + q); }; /* (le perso en train d'attaquer ou de lancer son sort, selon sa classe et son apparence) */
  const sorts = '<div class="art">' + icoSort('attaque') + '<div><b>' + att[0] + '</b><div class="puces"><span class="puce">' + picto('degats') + st.deg + ' dégâts</span><span class="puce">toutes les ' + String(st.cadence).replace('.', ',') + ' s</span></div><div class="desc">' + att[1] + '</div></div><div></div></div>' +
    '<div class="art passif">' + (ICONES_3D.has('passif-' + modeleDe(classeDe(), S_.perso.look)) ? icone3d('passif-' + modeleDe(classeDe(), S_.perso.look)) : '<span class="pic">' + picto({ iop: 'bouclier', cra: 'vitesse', osa: 'bouftou' }[classeDe()]) + '</span>') + '<div><b>Passif de classe</b><div class="desc">' + (E.passif ? (Array.isArray(E.passif) ? 'Toujours actif :' + listePassif(E.passif) : 'Toujours actif : ' + E.passif + '.') : 'L\'Osamodas n\'en a pas encore.') + '</div></div><div></div></div>' +
    '<div class="art">' + icoSort('sort') + '<div><b>Sort : ' + sort[0] + '</b><div class="desc">' + sort[1] + '</div>' + (E.passifSort ? '<div class="desc passif-sort"><b>Passif du sort :</b> ' + E.passifSort + (classeDe() === 'osa' ? ' (' + degBouftou(niveau(S_.xp)) + ' au tien)' : '') + '.</div>' : '') + '</div><div></div></div>' +
    '<div class="art">' + (S_.ulti ? '<span class="pic img trois-d"><img src="' + srcUlti(S_.ulti) + '" alt=""></span>' : '<span class="pic img trois-d"><img src="' + srcUlti('zone') + '" alt=""></span>') + '<div><b>' + (S_.ulti ? 'Ulti : ' + nomUlti(S_.ulti) : 'Ulti') + '</b><div class="desc">' + (S_.ulti ? descUlti(S_.ulti) + ' Recharge ' + rechargeUlti() + ' s.' : l >= NIV_ULTI ? 'Débloqué : à choisir une fois pour toutes.' : 'Se débloque au niveau ' + NIV_ULTI + '.') + '</div></div><div class="act' + (peutChangerUlti() ? ' duo' : '') + '"><button class="btn discret" data-voir-ulti>' + (S_.ulti || l < NIV_ULTI ? 'Voir' : 'Choisir') + '</button>' + (peutChangerUlti() ? '<button class="btn kamas" data-changer-ulti>Changer d\'ulti (' + fmt(PRIX_CHANGE_ULTI) + ' ' + KAMA + ')</button>' : '') + '</div></div>'; /* (au niveau 90, 08/11/2026) */
  if (persoOnglet === 'sorts') { ouvrirModale('perso', tete + '<div class="fp-sorts">' + blocClasse() + '<h4 class="fc-sorts">Tes sorts</h4>' + sorts + '</div>'); return; }
  if (persoOnglet === 'ferme') { ouvrirModale('perso', tete + '<div class="fp-sorts">' + blocMaFerme() + '</div>'); return; }
  /* a gauche : le perso au milieu de ses 7 emplacements, et ses caracteristiques */
  const slot = (e) => { const id = S_.equip[e], o = id && obj(id), mieux = sacL.some((k) => obj(k).emp === e && comparer(k).mieux), neuf = sacL.some((k) => obj(k).emp === e && persoNeufs[k]);
    return '<button class="fp-slot' + (o ? '' : ' vide') + (o && o.rare ? ' rare' : '') + (o && o.leg ? ' leg' : '') + (id && id === persoSel ? ' choisi' : '') + '" data-fp-slot="' + e + '" data-info="' + (o ? echapper(o.nom) : NOMS_EMP[e] + ' : vide') + '">' + (o ? '<img src="assets/icones/' + iconeObjet(id) + '.png?v=' + VERSION_MODELES + '" alt="">' : '<span>' + NOMS_EMP[e] + '</span>') +
      (mieux ? '<i class="fp-mieux">Up</i>' : neuf ? '<i class="fp-n">N</i>' : '') + '<small>' + NOMS_EMP[e] + '</small></button>'; };
  const virg = (x) => String(x).replace('.', ',');
  const carac = [['vita', 'PV', fmt(st.pvMax), c.vita ? '+' + c.vita : ''], ['degats', 'Dégâts', st.deg, c.puissance ? '+' + c.puissance + ' %' : ''], ['cadence', 'Attaque', virg(st.cadence) + ' s', c.agilite ? '-' + Math.round(100 - 100 / (1 + c.agilite / 100)) + ' %' : ''], ['portee', 'Portée', (st.portee / S) + (st.portee / S > 1 ? ' cases' : ' case'), ''],
    ['puissance', 'Puissance', '+' + c.puissance + ' %', ''], ['agilite', 'Agilité', '+' + c.agilite + ' %', ''], ['sagesse', 'Sagesse', '+' + c.sagesse + ' %', ''], ['prospection', 'Prospection', '+' + c.prospection + ' %', '']];
  const gauche = '<div class="fp-bloc"><h3>Équipement <small>touche une case, ou glisse une pièce du sac ici</small></h3><div class="fp-poupee">' +
    ['coiffe', 'cape', 'amulette'].map((e, k) => '<div style="grid-column:1;grid-row:' + (k + 1) + '">' + slot(e) + '</div>').join('') +
    '<div class="fp-perso"><img src="' + portraitPerso() + '" alt=""></div>' +
    ['anneau', 'ceinture', 'bottes'].map((e, k) => '<div style="grid-column:3;grid-row:' + (k + 1) + '">' + slot(e) + '</div>').join('') +
    '<div class="fp-arme">' + slot('arme') + '</div></div>' +
    '<div class="fp-carac">' + carac.map(([k, n, v, bo]) => '<button class="fp-cr' + (persoCarac === k ? ' choisi' : '') + '" data-fp-carac="' + k + '"><span class="rond" style="background:' + PICTOS[k][0] + '">' + picto(k, '#fff') + '</span><span class="nom">' + n + '</span><b>' + v + '</b></button>').join('') + '</div>' + /* (le detail des bonus est dans l'explication, au toucher) */
    (persoCarac ? expliquerCarac(persoCarac, st) : '<p class="fp-astuce">Touche une caractéristique pour savoir à quoi elle sert.</p>') + '</div>';
  /* au milieu : la piece choisie, comparee a celle qui est portee */
  let milieu;
  if (persoSel && String(persoSel).startsWith('q:')) { const q = quete.find((x) => 'q:' + x.id === persoSel);
    milieu = '<div class="fp-bloc fp-detail"><div class="fp-entete"><span class="fp-grosse quete"><img src="assets/icones/' + q.icone + '.png?v=' + VERSION_MODELES + '" alt=""></span><div><div class="fp-nom">' + q.nom + '</div><div class="fp-pils"><span class="fp-pil quete">objet de quête</span><span class="fp-pil">non équipable</span></div></div></div>' +
      '<div class="fp-quete-desc">' + q.desc + '</div><p class="fp-aide">Elle ne s\'équipe pas et ne se revend pas : elle reste dans ton sac.</p></div>'; }
  else if (!persoSel) milieu = '<div class="fp-bloc fp-detail"><h3>Aucune pièce</h3><p class="fp-aide">Les monstres des vagues lâchent des pièces d\'équipement, chaque boss en lâche une à coup sûr la première fois. Elles arrivent ici.</p><div class="fp-actions"><button class="btn discret" data-bestiaire="panoplies">' + picto('livre') + ' Voir le butin possible</button></div></div>';
  else {
    const k = persoSel, o = obj(k), porte = S_.equip[o.emp], porteeIci = porte === k, q = porte && !porteeIci ? obj(porte) : null, cmp = comparer(k), qj = qualiteJet(k), B = OBJETS[baseObjet(k)];
    const pils = (persoNeufs[k] ? '<span class="fp-pil neuf">nouveau</span>' : '') + (porteeIci ? '<span class="fp-pil porte">portée</span>' : cmp.mieux ? '<span class="fp-pil mieux"><b>Up</b> mieux que la tienne</span>' : '') +
      '<span class="fp-pil' + (niveau(S_.xp) < o.niv ? ' rouge' : '') + '">niveau ' + o.niv + '</span>' + (o.rare ? '<span class="fp-pil rare">★ rare</span>' : '') + (o.leg ? '<span class="fp-pil leg">✦ légendaire</span>' : '') + (o.arme ? '<span class="fp-pil">arme du ' + nomClasse(o.classe) + '</span>' : !o.leg ? '<span class="fp-pil">panoplie ' + PANOS[o.pano].de + '</span>' : '') +
      (S_.sac[k] > 1 ? '<span class="fp-pil">×' + S_.sac[k] + '</span>' : '');
    /* (09/11/2026, « pourquoi il y a 4 lignes de stats ? » puis « pas tres clair hein », Mathieu, devant une ceinture de l'Ecorce comparee a sa ceinture Kanniboul : un seul
       tableau melait les caracteristiques des deux pieces, et celles de la piece portee s'affichaient « +0 » dans la colonne de la nouvelle, comme si elle les donnait.
       Deux blocs maintenant : ce que la piece donne, puis ce qui change si elle remplace la piece portee, gains d'abord) */
    const unite = (cc) => (CARACS[cc][1].trim().startsWith('%') ? ' %' : ''), nomC = (cc) => CARACS[cc][2] + ' ' + CARACS[cc][0];
    const ligne = (cc) => { const v = o.stats[cc] || 0, [fa, fb] = B.stats[cc] ? fourchette(B.stats[cc]) : [v, v], u = unite(cc);
      return '<div class="fp-ligne"><span>' + nomC(cc) + '<small>' + (B.stats[cc] ? 'de ' + fa + ' à ' + fb + u : '') + '</small></span><span><b>+' + v + u + '</b></span></div>'; };
    const ecarts = q ? [...new Set(Object.keys(o.stats).concat(Object.keys(q.stats)))].map((cc) => [cc, (o.stats[cc] || 0) - (q.stats[cc] || 0)]).filter(([, d]) => d).sort((x, y) => (y[1] > 0) - (x[1] > 0)) : [];
    const table = '<div class="fp-compare seule"><div class="fp-ligne th"><span>' + (porteeIci ? 'Ce qu\'elle te donne' : 'Ce qu\'elle donne') + '</span><span></span></div>' + Object.keys(o.stats).map(ligne).join('') + '</div>' +
      (q ? '<div class="fp-compare seule"><div class="fp-ligne th"><span>À la place de ta pièce : ' + q.nom + '</span><span>Tu gagnes ou tu perds</span></div>' +
        (ecarts.length ? ecarts.map(([cc, d]) => '<div class="fp-ligne"><span>' + nomC(cc) + '</span><span class="' + (d > 0 ? 'fp-gain' : 'fp-perte') + '">' + (d > 0 ? '▲ +' : '▼ ') + d + unite(cc) + '</span></div>').join('') : '<div class="fp-ligne"><span>Rien ne change</span><span></span></div>') +
        (q.pouvoir && !o.pouvoir ? '<div class="fp-ligne"><span>✦ Son pouvoir</span><span class="fp-perte">▼ perdu</span></div>' : '') + '</div>' : '');
    const jet = '<div class="fp-jet"><span>Jet <b>' + nomJet(qj) + '</b></span><div class="barre"><i style="width:' + Math.round(qj * 100) + '%"></i></div><small>' + Math.round(qj * 100) + ' %</small></div>';
    const nr = runes(), maxi = qj >= 0.999, aRunes = nr.forge > 0 || nr.parfaite > 0; /* la forgemagie : elle se fait a l'atelier (le lien est ici) */
    const forge = (niv('forge') || aRunes || niveau(S_.xp) >= NIV_ARENE) ? '<div class="fp-forge"><span class="fp-forge-t">Forgemagie</span><small>' + (maxi ? 'Jet maximum.' : niv('forge') ? 'Tes runes : ' + (nr.forge || 0) + ' de forgemagie, ' + (nr.parfaite || 0) + ' parfaite' + ((nr.parfaite || 0) > 1 ? 's' : '') + '.' : 'Construis l\'atelier de forgemagie (Améliorer, ' + fmt(100000) + ' kamas) pour utiliser tes runes.') + '</small>' + (niv('forge') && !maxi ? '<button class="btn mini kamas" data-ouvrir-forge>À l\'atelier</button>' : '') + '</div>' : '';
    const pano = !o.leg && o.pano != null ? (() => { const n0 = comptePanos()[o.pano] || 0, n1 = porteeIci ? n0 : n0 + (q && q.pano === o.pano && !q.leg ? 0 : 1);
      return '<div class="fp-pano">Panoplie ' + PANOS[o.pano].de + ' : ' + (porteeIci ? n0 + '/6 pièces portées.' : 'tu passes à ' + Math.min(6, n1) + '/6 pièces.') + (o.arme ? ' L\'arme compte comme une pièce : elle peut en remplacer une (6 au plus).' : '') + ((P) => P ? ' À ' + P[0] + ' : ' + texteBonus(bonusPalier(P[1], o.pano, false, P[0])) + '.' : ' Panoplie complète !')(paliersDe(o.pano).find(([m]) => m > n1)) + '<button class="btn mini discret" data-fp-pano="' + o.pano + '">Voir la panoplie</button></div>'; })() : '';
    const raison = !cmp.ok ? (o.classe && o.classe !== classeDe() ? 'Arme du ' + nomClasse(o.classe) + ' : tu peux seulement la revendre.' : 'Il faut le niveau ' + o.niv + ' pour la porter.') : '';
    const actions = porteeIci ? '<div class="fp-actions"><button class="btn discret" data-retirer="' + o.emp + '">Retirer</button></div><p class="fp-aide">Touche une pièce du sac pour la comparer à celle-ci.</p>'
      : '<div class="fp-actions"><button class="btn kamas fp-principal" data-equiper="' + k + '"' + (cmp.ok ? '' : ' disabled') + '>Équiper</button><button class="btn discret" data-revendre-objet="' + k + '">Revendre ' + fmt(reventeObjet(k)) + ' ' + KAMA + '</button></div>' +
        '<p class="fp-aide">' + (raison || (q ? q.nom + ' retournera dans ton sac.' : 'L\'emplacement ' + NOMS_EMP[o.emp].toLowerCase() + ' est vide.')) + '</p>';
    milieu = '<div class="fp-bloc fp-detail"><div class="fp-entete"><span class="fp-grosse' + (o.rare ? ' rare' : '') + (o.leg ? ' leg' : '') + '"><img src="assets/icones/' + iconeObjet(k) + '.png?v=' + VERSION_MODELES + '" alt=""></span><div><div class="fp-nom">' + o.nom + '</div><div class="fp-pils">' + pils + '</div></div></div>' +
      jet + forge + table + (o.pouvoir ? '<div class="fp-pouvoir">✦ ' + o.pouvoir + '</div>' : '') + pano + actions + '</div>';
  }
  if (persoPano != null && PANOS[persoPano]) milieu = fichePano(persoPano, sacL);
  /* a droite : le sac en cases, et les panoplies */
  const presents = EMPLACEMENTS_PERSO.map(([e]) => e).filter((e) => sacL.some((k) => obj(k).emp === e));
  if (persoFiltre !== 'tout' && !presents.includes(persoFiltre) && !NOMS_EMP[persoFiltre]) persoFiltre = 'tout';
  const vus = sacL.filter((k) => persoFiltre === 'tout' || obj(k).emp === persoFiltre).sort((x, y) => (persoEmp ? (obj(y).emp === persoEmp) - (obj(x).emp === persoEmp) : 0) || ordre(x, y)), vusQ = persoFiltre === 'tout' ? quete : [], nCases = Math.max(20, Math.ceil((vus.length + vusQ.length + 1) / 5) * 5);
  const cases = vusQ.map((q) => '<button class="fp-case plein quete' + ('q:' + q.id === persoSel ? ' choisi' : '') + '" data-fp-sel="q:' + q.id + '" data-info="' + echapper(q.nom) + '"><img src="assets/icones/' + q.icone + '.png?v=' + VERSION_MODELES + '" alt=""></button>').join('') + vus.map((k) => { const o = obj(k); return '<button class="fp-case plein' + (k === persoSel ? ' choisi' : '') + (persoEmp && o.emp === persoEmp ? ' meme' : '') + (o.rare ? ' rare' : '') + (o.leg ? ' leg' : '') + (persoNeufs[k] ? ' nouveau' : '') + (comparer(k).ok ? '' : ' verrou') + '" data-fp-sel="' + k + '" data-info="' + echapper(o.nom) + '"><img src="assets/icones/' + iconeObjet(k) + '.png?v=' + VERSION_MODELES + '" alt="">' +
    (S_.sac[k] > 1 ? '<span class="fp-nb">×' + S_.sac[k] + '</span>' : '') + (comparer(k).mieux ? '<i class="fp-mieux">Up</i>' : '') + '</button>'; }).join('') + Array.from({ length: nCases - vus.length - vusQ.length }, () => '<span class="fp-case"></span>').join('');
  const panos = Object.entries(comptePanos()); const droite = '<div class="fp-bloc"><h3>Sac <small>' + sacL.length + ' pièce' + (sacL.length > 1 ? 's' : '') + '</small></h3>' +
    '<div class="fp-filtres">' + [['tout', 'Tout', sacL.length]].concat(presents.map((e) => [e, PLURIELS_EMP[e], sacL.filter((k) => obj(k).emp === e).length])).map(([f, t, n]) => '<button data-fp-filtre="' + f + '" aria-pressed="' + (persoFiltre === f) + '">' + t + ' <small>' + n + '</small></button>').join('') + '</div>' +
    blocRunes() + '<div class="fp-sac">' + cases + '</div><div class="fp-legende"><span><i class="fp-n">N</i> nouvelle pièce</span><span><i class="fp-mieux">Up</i> mieux que celle que tu portes</span><span class="r">rare ★</span><span class="l">légendaire</span></div>' +
    (panos.length ? '<h4>Panoplies portées</h4>' + panos.map(([kk, n]) => blocPano(+kk, n, true)).join('') + (() => { const T = {}; let nb = 0; panos.forEach(([kk, n]) => { const b = bonusPano(+kk, n); if (Object.keys(b).length) nb++; Object.entries(b).forEach(([c0, v]) => { T[c0] = (T[c0] || 0) + v; }); }); return nb > 1 ? '<div class="pano-bonus"><b>Total de tes panoplies</b><div class="pano-total seul">' + texteBonus(T) + '</div></div>' : ''; })() : '') + blocSuccesPeche() + '</div>'; /* (le total de toutes les panoplies portees, des qu'il y en a deux qui donnent un bonus) */
  ouvrirModale('perso', tete + '<div class="fp-corps">' + gauche + milieu + droite + '</div>');
}
function ouvrirTofu(p, sauvage) {
  const dore = sauvage && doreIci(), titre = dore ? 'Un Tofu doré dans l\'herbe' : sauvage ? 'Un Tofu sauvage dans l\'herbe' : 'Un Tofu picore ton ' + PAR_ID[p.c].nom, chance = sauvage ? CHANCE_SAUVAGE : CHANCE_CAPTURE;
  if (dore) { const ok = peutCapturer(true); ouvrirModale('tofu', entete(titre) + '<div class="ligne"><div><b>Très rare</b><small>Il ne se chasse pas et le Pépito-Tron ne lui tire jamais dessus : seul un filet peut l\'attraper. Raté, il file sur une autre case : cours-lui après et retente ta chance, jusqu\'à ce qu\'il s\'envole, une minute après son arrivée.</small></div></div>' +
    '<div class="ligne"><div><b>Le capturer au filet</b><small>' + (ok ? Math.round(chance * 100) + ' % de chance, le filet est perdu dans tous les cas (' + S_.filets + ' en grange). Capturé, il prend sa place dans ta volière' + (S_.tofus >= capaciteVoliere() ? ' (à la place d\'un Tofu normal)' : '') + ' et donne des Plumes dorées.' : S_.filets > 0 ? 'Ta volière est pleine de Tofus dorés : agrandis-la à l\'HDV, onglet Améliorer.' : 'Il te faut un filet de capture : HDV, onglet Acheter.') + '</small></div><button class="btn kamas" data-capturer-sauvage="1"' + (ok ? '' : ' disabled') + '>Capturer</button></div>'); return; }
  ouvrirModale('tofu', entete(titre) + '<div class="ligne"><div><b>Le chasser</b><small>Gratuit, ton perso le chasse à distance' + (classeDe() === 'cra' ? ', d\'une flèche' : '') + ' : il s\'envole.</small></div><button class="btn discret" ' + (sauvage ? 'data-chasser-sauvage="1"' : 'data-chasser="' + p.id + '"') + '>Chasser</button></div>' +
    (S_.tofus >= capaciteVoliere() ? '<div class="ligne"><div><b>Le capturer au filet</b><small>Ta volière est pleine (' + S_.tofus + '/' + capaciteVoliere() + ' places). Agrandis-la à l\'HDV, onglet Améliorer.</small></div><button class="btn kamas" disabled>Pleine</button></div>' :
    '<div class="ligne"><div><b>Le capturer au filet</b><small>' + Math.round(chance * 100) + ' % de chance, le filet est perdu dans tous les cas (' + S_.filets + ' en grange). Capturé, il va à la volière (' + S_.tofus + '/' + capaciteVoliere() + ' places) et donne des plumes.</small></div><button class="btn kamas" ' + (sauvage ? 'data-capturer-sauvage="1"' : 'data-capturer="' + p.id + '"') + '>Capturer</button></div>'));
}
function ouvrirPlanter(p, dispo) {
  ouvrirModale('planter', entete('Que planter ?') + '<div class="grille-graines">' + dispo.map((c) => carteGraine(c, 'data-planter="' + c.id + '" data-case="' + p.id + '"', true)).join('') + '</div>');
}
/* LA FICHE DE LA VOLIERE, refaite le 08/11/2026 (« c'est quoi cette fiche toute moche », Mathieu), dans le style de la Geliere : les plumes en tete (un anneau qui
   se remplit jusqu'a la volière pleine, le bouton), puis les Tofus en vignettes avec leur nom (le dore en or), et les places libres en pointilles */
function ouvrirVoliere() {
  const ameliorer = lignesAmelio(['voliere'], 'Agrandir la volière');
  const nD = Math.min(S_.tofusDores || 0, S_.tofus), max = Math.max(1, (S_.tofus - nD) * plumesParTofu()), v = S_.voliere, cap = capaciteVoliere(), ic = (n) => 'assets/icones/' + n + '.png?v=' + VERSION_MODELES, pD = v.plumesD || 0;
  const suite = v.plumes >= max ? 'La volière est pleine : ramasse-les.' : 'La prochaine dans ' + dureeLisible((CADENCE_PLUME - v.accu) / Math.max(1, S_.tofus)) + '.';
  const plumes = '<div class="vl-plumes" style="--p:' + Math.min(1, v.plumes / max).toFixed(3) + '"><div class="vl-rond"><span><img src="' + ic('plume') + '" alt=""></span></div><div><div><span class="vl-titre">Plumes de Tofu</span><b class="vl-nb">' + v.plumes + ' / ' + max + '</b></div>' +
    '<div class="vl-l2">' + suite + '</div>' + (nD ? '<div class="vl-l2 vl-or"><img src="' + ic('plume_doree') + '" alt="">' + pD + ' Plume' + (pD > 1 ? 's' : '') + ' dorée' + (pD > 1 ? 's' : '') + ' prête' + (pD > 1 ? 's' : '') + '</div>' : '') +
    '<div class="vl-l3">Une plume toutes les ' + dureeLisible(CADENCE_PLUME) + ' par Tofu, ' + plumesParTofu() + ' en attente au plus. Elles se vendent à l\'HDV.</div></div>' +
    '<button class="btn kamas" data-plumes' + (v.plumes || pD ? '' : ' disabled') + '>Ramasser</button></div>';
  const tuiles = Array.from({ length: cap }, (_, k) => k < S_.tofus ? '<div class="vl-tofu' + (k < nD ? ' dore' : '') + '"><span><img src="' + ic('tofu') + '" alt=""></span><b>' + nomTofu(k) + '</b>' + (k < nD ? '<small>doré</small>' : '') + '</div>' : '<div class="vl-tofu libre"><span></span><b>place libre</b></div>').join('');
  ouvrirModale('voliere', entete('Volière à Tofus') + (degatsBat('voliere') ? artPv('voliere') : '') +
    (S_.tofus ? plumes : '<p class="hdv-aide">La volière est vide. Achète des filets de capture à l\'HDV : quand un Tofu picore un champ ou se pose dans l\'herbe, touche-le pour l\'attraper.</p>') +
    '<div class="hdv-section">Tes Tofus : ' + S_.tofus + ' sur ' + cap + ' places' + (nD ? ', dont ' + nD + ' doré' + (nD > 1 ? 's' : '') : '') + '</div><div class="vl-grille">' + tuiles + '</div>' +
    '<p class="vl-note">Plus tard, l\'Osamodas pourra invoquer ses Tofus en combat.</p>' + ameliorer);
}
function ouvrirParcelle(p) {
  const rendu = Math.round((p.prixPaye || 50) / 2), culture = p.c ? PAR_ID[p.c].nom : null;
  ouvrirModale('parcelle', entete('Parcelle labourée') +
    '<div class="art">' + ico(p.c || 'ble') + '<div><b>Déplacer</b><div class="desc">Elle part sur une case d\'herbe libre' + (culture ? ', avec ton ' + culture + ' et son arrosage' : '') + '. Gratuit.</div></div><div class="act"><button class="btn kamas" data-deplacer="' + p.id + '">Déplacer</button></div></div>' +
    '<div class="art">' + ico('cloture') + '<div><b>Remettre en herbe</b><div class="desc">La moitié du prix payé t\'est rendue' + (culture ? ', la culture est perdue' : '') + '.</div></div><div class="act"><small>+' + fmt(rendu) + ' ' + KAMA + '</small><button class="btn" data-herbe="' + p.id + '">Remettre en herbe</button></div></div>');
}
function ouvrirConstruire(p) {
  const cout = prixParcelle(); const plein = parcelles() >= quotaParcelles();
  ouvrirModale('construire', entete('Case d\'herbe libre') + '<p style="font-size:.8rem;font-weight:600">Parcelles : ' + parcelles() + ' sur ' + quotaParcelles() + '. Tu laboures où tu veux, dans la limite de ton quota. ' + (plein ? 'Quota atteint : déplace une parcelle (Aménager) ou achète un terrain.' : '') + '</p>' +
    '<div class="ligne"><div><b>Labourer une parcelle</b><small>Pour planter une culture de plus.</small></div><button class="btn kamas" data-parcelle="' + p.id + '"' + (plein || S_.kamas < cout ? ' disabled' : '') + '>' + fmt(cout) + ' ' + KAMA + '</button></div>' +
    (() => { const c = CULTURES.find((x) => x.arbre); if (!c || !debloquee(c)) return ''; const n = S_.cases.filter((x) => x.type === 'champ' && x.c === c.id).length, g = S_.graines[c.id] || 0, max = n >= c.max; /* (le bananier planté dans l'herbe, 04/11/2026) */
      return '<div class="ligne"><div><b>Planter un bananier</b><small>' + (max ? 'Tu as déjà tes ' + c.max + ' bananiers.' : !g ? 'Achète d\'abord une graine ' + de(c.nom) + ' à l\'HDV.' : 'Une parcelle labourée pour l\'arbre (elle compte dans ton quota), et ta graine plantée tout de suite (' + n + '/' + c.max + ' bananiers).') + '</small></div><button class="btn kamas" data-bananier="' + p.id + '"' + (plein || max || !g || S_.kamas < cout ? ' disabled' : '') + '>' + fmt(cout) + ' ' + KAMA + '</button></div>'; })() +
    (() => { const n = nbTours(), ct = PRIX_TOUR[Math.min(n, PRIX_TOUR.length - 1)], bloque = niveau(S_.xp) < NIV_TOUR, max = n >= TOURS_MAX;
      return '<div class="ligne"><div><b>Tour de défense</b><small>' + (bloque ? 'Au niveau ' + NIV_TOUR + ' de Paysan.' : max ? 'Tu as déjà tes ' + TOURS_MAX + ' tours.' : 'Tire seule sur les voleurs et les monstres (' + n + '/' + TOURS_MAX + ' tours), avec les flèches de ta réserve.') + '</small></div><button class="btn kamas" data-tour="' + p.id + '"' + (bloque || max || S_.kamas < ct ? ' disabled' : '') + '>' + (bloque ? picto('cadenas') : fmt(ct) + ' ' + KAMA) + '</button></div>'; })());
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.id === 'b-journal') { basculerChat(); return; }
  if (b.dataset.bestiaire) { ouvrirBestiaire(b.dataset.bestiaire); return; }
  if (b.dataset.vgPrep) { const [k, d] = b.dataset.vgPrep.split('|'); ouvrirVagues.prep = { k: +k, dur: d === '1' }; ouvrirVagues(); return; } /* (la preparation d'une revanche, 09/11/2026) */
  if (b.dataset.vgOnglet) { if (b.dataset.vgOnglet === 'bestiaire') { ouvrirBestiaire.retour = 'vagues'; ouvrirBestiaire('monstres'); } else ouvrirVagues(b.dataset.vgOnglet); return; } /* (les onglets de la fenetre des vagues, 09/11/2026) */
  if (b.id === 'b-chat-fermer') { basculerChat(false); return; }
  if (b.dataset.revoirCombat) { revoirCombat(+b.dataset.revoirCombat); return; }
  if (b.id === 'b-bestiaire') { ouvrirBestiaire.retour = null; ouvrirBestiaire('monstres'); } else if (b.id === 'b-graine') ouvrirGraines(); else if (b.id === 'b-hdv') ouvrirHdv(); else if (b.id === 'b-amelio') ouvrirHdv('ameliorer'); else if (b.id === 'b-grange') ouvrirGrange();
  else if (b.hasAttribute('data-carnet')) ouvrirCarnet();
  else if (b.hasAttribute('data-guide-jeu')) ouvrirModale('guide', entete('Comment jouer') + guideJeu() + '<div class="boutons" style="margin-top:12px"><button class="btn discret" data-retour-options>Retour aux options</button></div>');
  else if (b.hasAttribute('data-retour-options')) $('b-options').click();
  else if (b.dataset.relire) { fermerModale(); ouvrirLecon(b.dataset.relire, true); }
  else if (b.hasAttribute('data-lecons-bascule')) { if (S_.leconsOff) delete S_.leconsOff; else S_.leconsOff = true; sauver(); ouvrirCarnet(); }
  else if (b.dataset.sexeOpt) { if (b.dataset.sexeOpt === 'f') S_.perso.sexe = 'f'; else delete S_.perso.sexe; sauver(); const m = modeleDe(classeDe(), S_.perso.look); assurerLook(m).then(() => { rhabiller(); rendreHaut(); }); $('b-options').click(); }
  else if (b.dataset.lookOpt) { S_.perso.look = b.dataset.lookOpt; sauver(); const m = modeleDe('iop', S_.perso.look); assurerLook(m).then(() => rhabiller()); $('b-options').click(); }
  else if (b.id === 'b-plein') { pleinEcran(); return; }
  else if (b.id === 'b-plein-opt') { pleinEcran(enPleinEcran()); setTimeout(() => $('b-options').click(), 400); return; }
  else if (b.id === 'b-options') { ouvrirModale('options', entete('Options') + (DOIGT ? '<div class="art">' + ico('opt-plein-ecran') + '<div><b>Plein écran</b><div class="desc">Cache les barres du navigateur. Couché, le téléphone reste à l\'horizontale.</div></div><div class="act"><button class="btn discret" id="b-plein-opt">' + (enPleinEcran() ? 'Quitter le plein écran' : 'Passer en plein écran') + '</button></div></div>' : '') + '<div class="hdv-section">Ton personnage</div><div class="sexes">' + [['m', 'Masculin'], ['f', 'Féminin']].map(([v, t]) => '<button class="sexe" data-sexe-opt="' + v + '" aria-pressed="' + (sexeDe() === v) + '">' + t + '</button>').join('') + '</div>' + (classeDe() === 'iop' && sexeDe() === 'm' ? '<div class="hdv-section">L\'apparence de ton Iop</div><div class="looks-grille">' + LOOKS_IOP.map(([id, nom]) => '<button class="look" data-look-opt="' + id + '" aria-pressed="' + ((S_.perso.look || 'classique') === id) + '"><img src="assets/icones/iop-look-' + id + '.png?v=' + VERSION_MODELES + '" alt=""><b>' + nom + '</b></button>').join('') + '</div>' : '') + '<div class="hdv-section">Le son et la musique</div><div class="art">' + ico('cloche') + '<div><b>Les sons</b><div class="desc">La faux dans le blé, l\'eau, les coups, les bêê des Bouftous, les fêtes.</div><label class="curseur-son" for="vol-sons">Volume <input type="range" id="vol-sons" min="0" max="100" step="5" value="' + volSons() + '"></label></div><div class="act"><button class="btn discret" id="b-son">' + (sonActif() ? 'Couper le son' : 'Remettre le son') + '</button></div></div>' +
      '<div class="art">' + ico('cloche') + '<div><b>La musique de fond</b><div class="desc">Elle tourne sans fin et ne joue jamais deux fois la même chose.</div><div class="musiques-opt">' + MUSIQUES_JEU.map(([id, nom, d]) => '<button class="sexe" data-musique-opt="' + id + '" aria-pressed="' + (musiqueChoisie() === id) + '" data-info="' + d + '">' + nom + '</button>').join('') + '</div><label class="curseur-son" for="vol-musique">Volume <input type="range" id="vol-musique" min="0" max="100" step="5" value="' + volMusique() + '"></label></div><div></div></div><div class="art">' + ico('opt-objectifs') + '<div><b>Les objectifs de Pépito</b><div class="desc">Le petit panneau en haut à gauche.</div></div><div class="act"><button class="btn discret" id="b-objectifs">' + (S_.objCache ? 'Les afficher' : 'Les masquer') + '</button></div></div><div class="art">' + ico('opt-graphismes') + '<div><b>Graphismes</b><div class="desc">' + (graphismes() === 'leger' ? 'Légers : sans ombres ni contours, pour les petits appareils.' : 'Complets : ombres et détails.') + ' Si le jeu rame, passe en légers.</div></div><div class="act"><button class="btn discret" id="b-graphismes">' + (graphismes() === 'leger' ? 'Passer en complets' : 'Passer en légers') + '</button></div></div><div class="hdv-section">Apprendre à jouer</div><div class="art">' + ico('opt-tuto') + '<div><b>Le tuto du début</b><div class="desc">Pépito te remontre les bases en ' + ETAPES_TUTO.length + ' étapes. Coupé, il ne se lance plus au début d\'une nouvelle partie, et Pépito ne donne plus ses leçons ni ses objectifs du début (pour qui connaît déjà le jeu).</div></div><div class="act act-tuto"><button class="btn discret" id="b-tuto">Revoir le tuto</button><span class="tuto-auto"><button class="inter' + (tutoCoupe() ? '' : ' on') + '" role="switch" aria-checked="' + !tutoCoupe() + '" aria-label="Le tuto au début d\'une nouvelle partie" id="b-tuto-auto"></button><span class="etat-inter' + (tutoCoupe() ? '' : ' on') + '">' + (tutoCoupe() ? 'Coupé' : 'Activé') + '</span></span></div></div><div class="art">' + ico('opt-carnet') + '<div><b>Le carnet de Pépito</b><div class="desc">Ses leçons sur les vagues, les boss, l\'équipement, l\'élevage... à relire quand tu veux.</div></div><div class="act"><button class="btn discret" data-carnet>Ouvrir</button></div></div>' + '<div class="art"><span class="pic img gj-pic">' + (DOIGT ? DOIGT_SVG(false) : SOURIS_SVG('droit')) + '</span><div><b>Comment jouer</b><div class="desc">Les commandes ' + (DOIGT ? 'au doigt' : 'à la souris et au clavier') + ', la caméra et les bases de ta ferme.</div></div><div class="act"><button class="btn discret" data-guide-jeu>Voir</button></div></div>' + (estAdmin() ? /* (14/11/2026, « dans les options, la partie Comment jouer devrait etre une ligne comme les autres avec un bouton, et quand on clique dessus on a plus d'info », Mathieu) */ '<div class="hdv-section">Espace admin</div><div class="art">' + ico('ile-arene') + '<div><b>Arène dev</b><div class="desc">Les monstres en avant-première. Rien ne se gagne ni ne se perd. Visible seulement par toi.</div></div><div class="act"><button class="btn" data-montgolfiere="areneDev">Ouvrir</button></div></div>' + '<div class="art">' + ico('opt-test') + '<div><b>Mode test</b><div class="desc">Ta ferme, sans rien enregistrer : ta classe, ton niveau, ton équipement, n\'importe quelle vague à volonté, ta vie au max. Visible seulement par toi.</div></div><div class="act"><button class="btn" data-test="ouvrir">Ouvrir</button></div></div>' : '') + '<div class="hdv-section">Ta ferme</div><div class="art">' + ico('opt-compte') + '<div><b>Ton compte</b><div class="desc">' + infoCompte() + '</div></div><div class="act">' + (ENLIGNE && (enLigneSv.compte || jetonInvite()) ? '<button class="btn discret" id="b-deconnexion">Se déconnecter</button>' : '') + '</div></div>' +
      '<div class="art">' + ico(S_.perso.sexe === 'f' ? 'feminin-' + S_.perso.classe : S_.perso.classe) + '<div><b>Mes parties</b><div class="desc">Jusqu\'à ' + MAX_PARTIES + ' parties sur ton compte (' + (1 + Object.keys(S_.parties || {}).length) + ' en cours) : change de partie, ou commence une autre classe sans perdre celle-ci.</div></div><div class="act"><button class="btn" id="b-parties">Mes parties</button></div></div>' +
      '<div class="art">' + ico('grange') + '<div><b>Recommencer une ferme</b><div class="desc">' + (ENLIGNE && enLigneSv.compte ? 'Repart de zéro : la nouvelle ferme remplace celle-ci, ici et en ligne.' : 'Efface la sauvegarde de ce navigateur et repart de zéro.') + '</div></div><div class="act"><button class="btn" id="b-reset" style="background:var(--rouge);color:#fff">Recommencer</button></div></div>'); return; }
  else if (b.id === 'b-reset') { ouvrirModale('options', entete('Recommencer ?') + '<div class="confirme"><div class="gros" style="background:#3d2624"><img src="assets/icones/grange.png" alt=""></div><p>Une ferme toute neuve : ' + (ENLIGNE && enLigneSv.compte ? 'celle-ci sera effacée, ici et en ligne, pour de bon.' : 'la sauvegarde de ce navigateur sera effacée, pour de bon.') + (Object.keys(S_.parties || {}).length ? ' Tes autres parties ne bougent pas.' : '') + '</p><div class="boutons"><button class="btn discret" data-fermer>Garder ma ferme</button><button class="btn" id="b-reset-ok" style="background:var(--rouge);color:#fff">Tout effacer</button></div></div>'); return; }
  else if (b.id === 'b-parties') { sauver(); location.reload(); return; } /* (l'accueil : la liste des parties) */
  else if (b.id === 'b-reset-ok') { { const nv = sansPartieActive(S_); if (nv) { ecrirePartie(nv, false); return; } } /* (les autres parties restent) */ enLigneSv.ecraser = !!enLigneSv.compte; enLigneSv.sale = false; sauverMeta(); localStorage.removeItem(CLE); location.reload(); return; }
  else if (b.id === 'b-nuage-recharger') { enLigneSv.version = 0; enLigneSv.sale = false; sauverMeta(); location.reload(); return; } /* au rechargement, la version en ligne gagne */
  else if (b.id === 'b-nuage-garder') { enLigneSv.bloque = false; enLigneSv.ecraser = true; enLigneSv.sale = true; fermerModale(); nuageEnvoyer(); toast('Cette version de ta ferme remplace l\u2019autre.'); return; }
  else if (b.id === 'b-deconnexion') { fermerModale(); deconnecter(); return; }
  else if (b.id === 'b-tuto') { fermerModale(); if (!combat) demarrerTuto(1, true); else toast('Pendant une vague, on se bat : le tuto attendra.'); return; }
  else if (b.hasAttribute('data-fermer')) fermerModale();
  else if (b.dataset.graine) { const id = b.dataset.graine; S_.graine = id; rendreHaut();
    if (!(S_.graines[id] || 0)) { ouvrirHdv.cat = 'graines'; ouvrirHdv('acheter'); const art = (document.querySelector('[data-graines="' + id + '"]') || { closest: () => null }).closest('.art'); if (art) { art.scrollIntoView({ block: 'center' }); art.classList.add('repere'); } return; } /* (a 0 : direction l'HDV, sur sa ligne, 05/11/2026) */
    fermerModale(); }
  else if (b.hasAttribute('data-replanter')) { S_.replanter = S_.replanter === false; sauver(); ouvrirGraines(); }
  else if (b.dataset.grangeCase) ouvrirGrange(b.dataset.grangeCase); /* une case de la grange : son detail */
  else if (b.dataset.ficheMonstre) { if (modaleOuverte === 'vagues') ouvrirBestiaire.retour = 'vagues'; else if (modaleOuverte !== 'bestiaire') ouvrirBestiaire.retour = null; ouvrirBestiaire('monstres', b.dataset.ficheMonstre); } /* la fiche d'un monstre */
  else if (b.hasAttribute('data-retour-vagues')) { ouvrirBestiaire.retour = null; ouvrirVagues(); }
  else if (b.dataset.vendre) ACTIONS.vendre(b.dataset.vendre, parseInt(b.dataset.n, 10));
  else if (b.dataset.hdvQte !== undefined) { ouvrirHdv.qte = parseInt(b.dataset.hdvQte, 10); ouvrirHdv(); }
  else if (b.id === 'fleches-stock') { ouvrirHdv.cat = 'materiel'; ouvrirHdv('acheter'); }
  else if (b.dataset.qteItem) { ouvrirHdv.qtes = ouvrirHdv.qtes || {}; ouvrirHdv.qtes[b.dataset.qteItem] = parseInt(b.dataset.qteV, 10); ouvrirHdv(); }
  else if (b.dataset.hdvCat) { ouvrirHdv.cat = b.dataset.hdvCat; ouvrirHdv('acheter'); $('carte').scrollTop = 0; if (b.dataset.hdvVoir) { const e = document.querySelector('#carte ' + b.dataset.hdvVoir), l = e && (e.closest('.art') || e); if (l) l.scrollIntoView({ block: 'center' }); } } /* (16/10/2026 : « Acheter une Gelée » de la Gelière ouvrait les pots ; les Gelees sont dans Animaux, on y descend) */
  else if (b.dataset.hdvCatA) { ouvrirHdv.catA = b.dataset.hdvCatA; ouvrirHdv('ameliorer'); $('carte').scrollTop = 0; }
  else if (b.dataset.amelio) ACTIONS.amelio(b.dataset.amelio);
  else if (b.dataset.chateau) { if (b.dataset.chateau === 'batir') ACTIONS.batirChateau(); else fermerModale(); } /* (le chateau-grange : bâtir ici, ou choisir ailleurs) */
  else if (b.dataset.gardien) actionGardien(b.dataset.gardien, b.dataset.type);
  else if (b.dataset.nourrir) { ACTIONS.nourrir(parseInt(b.dataset.nourrir, 10)); ouvrirEnclos(); }
  else if (b.hasAttribute('data-reproduire')) { ACTIONS.reproduire(); ouvrirEnclos(); }
  else if (b.dataset.vendreBouftou) { const j = parseInt(b.dataset.vendreBouftou, 10), noir = S_.bouftous[j] && S_.bouftous[j].noir; ACTIONS.vendreBouftou(j); if (!noir) ouvrirEnclos(); }
  else if (b.dataset.vendreNoir) { ACTIONS.vendreBouftou(parseInt(b.dataset.vendreNoir, 10), true); ouvrirEnclos(); }
  else if (b.hasAttribute('data-garder-bouftou')) ouvrirEnclos();
  else if (b.dataset.tondre) { ACTIONS.tondre(parseInt(b.dataset.tondre, 10)); ouvrirEnclos(); }
  else if (b.hasAttribute('data-bouftou')) { ACTIONS.acheterBouftou(); if (modaleOuverte === 'hdv') ouvrirHdv('acheter'); else ouvrirEnclos(); }
  else if (b.dataset.hdvOnglet) ouvrirHdv(b.dataset.hdvOnglet);
  else if (b.dataset.graines) ACTIONS.acheterGraines(b.dataset.graines, parseInt(b.dataset.n, 10));
  else if (b.dataset.potAchat) ACTIONS.acheterPots(b.dataset.potAchat, parseInt(b.dataset.n, 10));
  else if (b.dataset.pepito) { const k = b.dataset.pepito; S_.pepito = S_.pepito || {}; S_.pepito[k] = !pepitoTire(k); toast((niv('epouvantail') >= 5 ? 'PÉPITO-TRON : ' : 'Épouvantail : ') + (pepitoTire(k) ? 'cible autorisée.' : 'cible ignorée.') + (k === 'sauvage' ? ' (le Tofu sauvage)' : ' (les Tofus des champs)'), 'or'); sauver(); ouvrirEpouvantail(); }
  else if (b.dataset.entractePot) boireEntracte(b.dataset.entractePot);
  else if (b.dataset.entracteManger) mangerEntracte(b.dataset.entracteManger);
  else if (b.dataset.bonusArene) prendreBonusArene(b.dataset.bonusArene);
  else if (b.hasAttribute('data-entracte-suite')) tempsSuivant();
  else if (b.dataset.boire) boirePot(b.dataset.boire);
  else if (b.dataset.geleeAchat) ACTIONS.acheterGelee(b.dataset.geleeAchat);
  else if (b.dataset.bleAchat) ACTIONS.acheterBle(parseInt(b.dataset.bleAchat, 10));
  else if (b.dataset.nuOk) ACTIONS.mettreANu(b.dataset.nuOk, true);
  else if (b.hasAttribute('data-pots-fusion')) fusionnerPetitsPots();
  else if (b.dataset.geleeNourrir) { if (b.dataset.geleeNourrir === 'tout') ACTIONS.nourrirGelees(); else ACTIONS.nourrirGelee(parseInt(b.dataset.geleeNourrir, 10)); }
  else if (b.dataset.terrainOk) ACTIONS.acheterTerrain(parseInt(b.dataset.terrainOk, 10), true);
  else if (b.hasAttribute('data-gelee-ramasser')) ACTIONS.ramasserPots();
  else if (b.hasAttribute('data-gelee-croiser')) ACTIONS.croiserGelees();
  else if (b.dataset.geleeRelacher) ACTIONS.relacherGelee(parseInt(b.dataset.geleeRelacher, 10), b.dataset.nom); else if (b.dataset.geleeRelacherOk) ACTIONS.relacherGelee(parseInt(b.dataset.geleeRelacherOk, 10), b.dataset.nom, true);
  else if (b.hasAttribute('data-gelee-fusion')) ACTIONS.fusionnerGelees(); else if (b.hasAttribute('data-gelee-fusion-ok')) ACTIONS.fusionnerGelees(true); else if (b.hasAttribute('data-gelee-retour')) ouvrirGeliere();
  else if (b.hasAttribute('data-geliere')) ouvrirGeliere();
  else if (b.id === 'b-vie' || b.id === 'b-pots') { if (combat) toast('Les pots de gelée se boivent entre les vagues.'); else ouvrirPots(); }
  else if (b.dataset.filets) ACTIONS.acheterFilets(parseInt(b.dataset.filets, 10));
  else if (b.dataset.fleches) ACTIONS.acheterFleches(parseInt(b.dataset.fleches, 10));
  else if (b.hasAttribute('data-bouclier')) { acheterBouclier(); ouvrirGrange(); } /* (le bouclier anti-VSA, 07/11/2026) */
  else if (b.hasAttribute('data-recharger')) { ACTIONS.recharger(); if (raidAnnonce) majRaidAnnonce(); }
  else if (b.hasAttribute('data-raid-go')) { if (raidAnnonce && !combat) lancerRaid(); } /* (la simu VSA tout de suite, sans attendre les 30 s) */
  else if (b.hasAttribute('data-remplir')) { ACTIONS.remplir(); ouvrirPuits(); }
  else if (b.dataset.capturer) { const p = S_.cases.find((c) => c.id === b.dataset.capturer); fermerModale(); if (p) allerPuis(p, () => ACTIONS.capturer(p)); } /* le filet, lui, se lance de pres */
  else if (b.dataset.chasser) { const p = S_.cases.find((c) => c.id === b.dataset.chasser); fermerModale(); if (p) chasserDeLoin(p, () => { if (p.tofu) ACTIONS.chasser(p); }); }
  else if (b.dataset.parcelle) ACTIONS.construireParcelle(b.dataset.parcelle);
  else if (b.dataset.bananier) ACTIONS.planterArbre(b.dataset.bananier);
  else if (b.dataset.tour) ACTIONS.construireTour(b.dataset.tour);
  else if (b.hasAttribute('data-poser-tour')) { fermerModale(); aDeplacer = null; mode = 'poserTour'; majBandeau(); rendreHaut(); }
  else if (b.dataset.ameliorerTour) ACTIONS.ameliorerTour(b.dataset.ameliorerTour);
  else if (b.dataset.demonterTour) ACTIONS.demonterTour(b.dataset.demonterTour);
  else if (b.dataset.planter) { const p = S_.cases.find((c) => c.id === b.dataset.case); if (p) ACTIONS.planter(p, b.dataset.planter); fermerModale(); }
  else if (b.hasAttribute('data-plumes')) ACTIONS.ramasserPlumes();
  else if (b.dataset.deplacer) { aDeplacer = S_.cases.find((c) => c.id === b.dataset.deplacer); mode = 'deplacer'; fermerModale(); majBandeau(); }
  else if (b.dataset.herbe) ACTIONS.remettreEnHerbe(b.dataset.herbe);
  else if (b.dataset.toutReparer) { if (modaleOuverte === 'vague-fin') ACTIONS.reparerDansBilan(b.dataset.toutReparer.split(',')); else ACTIONS.toutReparer(b.dataset.toutReparer.split(',')); }
  else if (b.dataset.reparer) { if (modaleOuverte === 'vague-fin') ACTIONS.reparerDansBilan([b.dataset.reparer]); else ACTIONS.reparer(b.dataset.reparer); } /* (depuis le bilan : sur place, la fenetre reste ouverte) */
  else if (b.hasAttribute('data-reclamer-obj')) reclamerObjectif();
  else if (b.hasAttribute('data-cacher-obj')) { S_.objCache = true; rendreObjectif(); toast('Objectifs masqués : tu les retrouves dans Options.'); }
  else if (b.hasAttribute('data-voir-defis')) ouvrirDefis();
  else if (b.dataset.reclamerDefi) reclamerDefi(parseInt(b.dataset.reclamerDefi, 10));
  else if (b.hasAttribute('data-coffre')) ouvrirCoffre();
  else if (b.hasAttribute('data-coffre-ok')) { fermerModale(); ouvrirDefis(); }
  else if (b.hasAttribute('data-coffre-fiche')) { fermerModale(); ouvrirPerso(); }
  else if (b.dataset.musiqueOpt) { ecrireReglage('ferme-musique', b.dataset.musiqueOpt); document.querySelectorAll('[data-musique-opt]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); deverrouillerSon(); majMusique(); return; }
  else if (b.id === 'b-son') { try { localStorage.setItem('ferme-son', sonActif() ? 'non' : 'oui'); } catch (err) { /* rien */ } son('quete'); majMusique(); b.textContent = sonActif() ? 'Couper le son' : 'Remettre le son'; return; }
  else if (b.id === 'b-graphismes') { try { localStorage.setItem('ferme-graphismes', graphismes() === 'leger' ? 'complet' : 'leger'); } catch (err) { /* rien */ } appliquerGraphismes(); b.textContent = graphismes() === 'leger' ? 'Passer en complets' : 'Passer en légers'; const d = b.closest('.art').querySelector('.desc'); if (d) d.textContent = (graphismes() === 'leger' ? 'Légers : sans ombres ni contours, pour les petits appareils.' : 'Complets : ombres et détails.') + ' Si le jeu rame, passe en légers.'; return; }
  else if (b.id === 'b-tuto-auto') { const off = !tutoCoupe(); try { localStorage.setItem('ferme-tuto-off', off ? '1' : '0'); } catch (err) { /* rien */ } if (off && tuto.actif) finirTuto('coupe'); if (off && lecon.ouverte) fermerLecon(); S_.objCache = off; rendreObjectif(); sauver(); /* (06/11/2026 : coupe le tuto, les lecons et les objectifs du debut) */
    b.classList.toggle('on', !off); b.setAttribute('aria-checked', String(!off)); const e = b.nextElementSibling; if (e) { e.classList.toggle('on', !off); e.textContent = off ? 'Coupé' : 'Activé'; } }
  else if (b.id === 'b-objectifs') { S_.objCache = !S_.objCache; rendreObjectif(); fermerModale(); }
  else if (b.id === 'b-perso') ouvrirPerso();
  else if (b.dataset.slot) ouvrirPerso(b.getAttribute('aria-pressed') === 'true' ? null : b.dataset.slot);
  else if (b.dataset.fpPano != null) { persoPano = b.dataset.fpPano === '' ? null : +b.dataset.fpPano; ouvrirPerso(); }
  else if (b.dataset.fpSel) ouvrirPerso(b.dataset.fpSel);
  else if (b.dataset.fpSlot) { const k = S_.equip[b.dataset.fpSlot]; persoFiltre = 'tout'; persoEmp = b.dataset.fpSlot; ouvrirPerso(k || b.dataset.fpSlot); }
  else if (b.dataset.fpFiltre) { persoFiltre = b.dataset.fpFiltre; persoEmp = null; ouvrirPerso(); }
  else if (b.dataset.fpOnglet) { persoOnglet = b.dataset.fpOnglet; ouvrirPerso(); }
  else if (b.hasAttribute('data-ma-ferme')) { ouvrirPerso(); persoOnglet = 'ferme'; ouvrirPerso(); }
  else if (b.dataset.fpCarac) { persoCarac = persoCarac === b.dataset.fpCarac ? null : b.dataset.fpCarac; ouvrirPerso(); }
  else if (b.dataset.persoSel) ouvrirPerso(b.dataset.persoSel);
  else if (b.dataset.persoSlot !== undefined) ouvrirPerso(b.dataset.persoSlot || null);
  else if (b.dataset.forger) { const [t, k] = b.dataset.forger.split('|'); if (t === 'forge') { ouvrirChoixForge(k); return; } confirmerRune(k, t, null, modaleOuverte === 'forge' ? 'forge' : 'perso'); } /* (la rune de forgemagie demande d'abord la caracteristique ; toute rune demande confirmation, 13/11/2026, 03-equipements.js) */
  else if (b.dataset.forgerCarac) { const [k, c] = b.dataset.forgerCarac.split('|'); confirmerRune(k, 'forge', c, 'choix'); }
  else if (b.dataset.runeOui) { const [t, k, c, retour] = b.dataset.runeOui.split('|'); const cle = forgerObjet(k, t, c || undefined); if (retour === 'perso') ouvrirPerso(cle || k); else ouvrirForge(); }
  else if (b.dataset.runeNon) { const [retour, k] = b.dataset.runeNon.split('|'); if (retour === 'choix') ouvrirChoixForge(k); else if (retour === 'perso') ouvrirPerso(k); else ouvrirForge(); }
  else if (b.hasAttribute('data-forge-retour')) ouvrirForge();
  else if (b.hasAttribute('data-ouvrir-forge')) ouvrirForge();
  else if (b.hasAttribute('data-ouvrir-atelier')) ouvrirAtelier(); /* (la torche, depuis les decorations de l'HDV, 09/11/2026) */
  else if (b.dataset.equiper) ACTIONS.equiper(b.dataset.equiper);
  else if (b.dataset.retirer) ACTIONS.retirer(b.dataset.retirer);
  else if (b.dataset.revendreObjet) ACTIONS.revendreObjet(b.dataset.revendreObjet);
  else if (b.dataset.vendreButin) { const k = b.dataset.vendreButin; ACTIONS.revendreObjet(k, true); if (!(S_.sac[k] > 0)) { b.closest('.act').querySelectorAll('button').forEach((y) => { y.disabled = true; }); b.textContent = 'Vendu'; } } /* (le butin d'un bilan, vendu sur place, 04/11/2026) */
  else if (b.dataset.vendreRes) { ACTIONS.vendre(b.dataset.vendreRes, +b.dataset.n); b.disabled = true; b.textContent = 'Vendu'; sauver(); }
  else if (b.dataset.reconstruire) { if (modaleOuverte === 'vague-fin') ACTIONS.reparerDansBilan([b.dataset.reconstruire]); else ACTIONS.reconstruire(b.dataset.reconstruire); }
  else if (b.id === 'b-amenager') { mode = mode ? null : 'choisir'; aDeplacer = null; majBandeau(); rendreHaut(); }
  else if (b.hasAttribute('data-enclos-auto')) ACTIONS.enclosAuto();
  else if (b.id === 'b-enclos-bouger') { mode = mode === 'enclosDeplacer' ? 'enclos' : 'enclosDeplacer'; aDeplacer = null; majBandeau(); rendreHaut(); }
  else if (b.hasAttribute('data-amenager-enclos')) { fermerModale(); mode = 'enclos'; aDeplacer = null; majBandeau(); rendreHaut(); }
  else if (b.id === 'b-tourner') ACTIONS.tournerBatiment();
  else if (b.id === 'b-ranger') ACTIONS.rangerDeco();
  else if (b.id === 'b-mes-decos' || b.hasAttribute('data-mes-decos')) ouvrirDecos();
  else if (b.dataset.poserDeco) { fermerModale(); const D = DECOS[b.dataset.poserDeco]; if (nbDecos(b.dataset.poserDeco) || (D && (D.bord || (D.sol && S_.cases.some((c) => c.pave === b.dataset.poserDeco))))) { /* (clotures et paves : meme sans reserve, pour ranger ceux qui sont poses) */ aPoser = b.dataset.poserDeco; aDeplacer = null; mode = 'poserDeco'; assurerDecos(); majBandeau(); rendreHaut(); } }
  else if (b.dataset.decoAchat) ACTIONS.acheterDeco(b.dataset.decoAchat, +b.dataset.n || 1);
  else if (b.id === 'b-terminer') { mode = null; aDeplacer = null; majBandeau(); rendreHaut(); }
  else if (b.id === 'b-vagues' || b.hasAttribute('data-voir-vagues')) ouvrirVagues();
  else if (b.hasAttribute('data-lancer-vague')) lancerVague();
  else if (b.hasAttribute('data-rejouer-boss')) lancerVague(+b.dataset.rejouerBoss);
  else if (b.hasAttribute('data-rejouer-dur')) lancerVague(+b.dataset.rejouerDur, true); /* la revanche difficile */
  else if (b.id === 'b-rentrer') rentrerFerme();
  else if (b.hasAttribute('data-montgolfiere')) actionMontgolfiere(b.dataset.montgolfiere);
  else if (b.hasAttribute('data-cas')) actionCasino(b);
  else if (b.hasAttribute('data-ardoise')) actionArdoise(b.dataset.ardoise);
  else if (b.dataset.arracher) ACTIONS.arracher(b.dataset.arracher); else if (b.dataset.arracherOk) ACTIONS.arracher(b.dataset.arracherOk, true); /* (le bananier, 03/11/2026) */
  else if (b.hasAttribute('data-poser-bouclier')) { if ((S_.boucliers || 0) > 0 && !S_.bouclierPose) { S_.boucliers--; S_.bouclierPose = true; son('niveau'); toast('Bouclier de carapace posé : ' + nomQG() + ' aura ' + fmt(Math.round(pvMaxBat('grange') * BOUCLIER_BASE)) + ' PV de bouclier pendant la prochaine vague.', 'or'); sauver(); } if (modaleOuverte === 'vagues') ouvrirVagues(); } /* (10/11/2026, l'atelier) */
  else if (b.hasAttribute('data-manger')) { const id = b.dataset.manger; if ((S_.grange[id] || 0) > 0 && !(S_.mange || {})[id]) { S_.grange[id]--; S_.mange = S_.mange || {}; S_.mange[id] = true; son('manger'); toast('Miam ! ' + PAR_ID[id].nom + ' : ' + PAR_ID[id].mange.txt + (modaleOuverte === 'arene' ? ' pendant toute ta partie d\'Arène.' : modaleOuverte === 'ileboss' ? ' pendant ton essai sur l\'île.' : ' pendant ta prochaine vague.'), 'or'); sauver(); rendreGrange(); rafraichirAvantCombat(); } }
  else if (b.id === 'b-sort') lancerSort();
  else if (b.id === 'b-ulti') lancerUlti();
  else if (b.id === 'b-leg-coiffe') lancerLeg('coiffe');
  else if (b.id === 'b-leg-arme') lancerLeg('arme');
  else if (b.hasAttribute('data-voir-ulti')) ouvrirUlti();
  else if (b.hasAttribute('data-changer-ulti')) ouvrirUlti(true);
  else if (b.dataset.changerUltiPour) changerUlti(b.dataset.changerUltiPour);
  else if (b.dataset.confirmerChangeUlti) changerUlti(b.dataset.confirmerChangeUlti, true);
  else if (b.dataset.choisirUlti) choisirUlti(b.dataset.choisirUlti);
  else if (b.dataset.confirmerUlti) choisirUlti(b.dataset.confirmerUlti, true);
  else if (b.id === 'b-fuir') { if (combat && combat.arene) finArene(true); else if (!(combat && combat.deroute != null)) finVague(false, true); } /* (a terre, on ne fuit plus) */
  else if (b.dataset.capturerSauvage) { const p = S_.sauvage && S_.cases.find((c) => c.id === S_.sauvage.id); fermerModale(); if (p) allerPuis(p, () => ACTIONS.capturerSauvage()); }
  else if (b.dataset.chasserSauvage) { const p = S_.sauvage && S_.cases.find((c) => c.id === S_.sauvage.id); fermerModale(); if (p) chasserDeLoin(p, () => { if (S_.sauvage) ACTIONS.chasserSauvage(); }); }
  else return;
  sauver();
});
/* GLISSER UNE PIECE DU SAC SUR L'EQUIPEMENT (10/11/2026, « qu'on puisse faire glisser un item de l'inventaire jusqu'a l'equipement, a gauche de mon personnage : tu cliques
   et tu maintiens un objet, tu peux le faire glisser pour remplacer un autre item », Mathieu) : dans la fiche du perso, une piece du sac se prend a la souris (des qu'elle
   bouge de 8 px) ou au doigt (un appui de 0,2 s, pour ne pas gener le defilement) ; une vignette suit le pointeur, la case ou elle ira s'allume en vert (en rouge si le
   niveau ou la classe l'interdit) ; lachee n'importe ou sur le perso et ses cases, elle s'equipe a sa place et l'ancienne retourne au sac. Dans l'autre sens, une piece
   portee glissee sur le sac se retire. Un simple clic choisit toujours la piece, comme avant. */
let glisse = null, glisseFin = 0;
const SEUIL_GLISSE = 8, APPUI_TACTILE = 220;
function debutGlisse(g) {
  const img = g.src.querySelector('img'); if (g.actif || !img || !document.body.contains(g.src)) { if (!g.actif) glisse = null; return; }
  g.actif = true; const f = document.createElement('div'); f.className = 'fp-fantome' + (g.src.classList.contains('leg') ? ' leg' : g.src.classList.contains('rare') ? ' rare' : ''); f.innerHTML = '<img src="' + img.src + '" alt="">'; document.body.appendChild(f); g.fant = f;
  g.src.classList.add('glisse'); document.body.classList.add('fp-en-glisse');
  if (g.id) { const o = obj(g.id), s = o && document.querySelector('.fp-poupee .fp-slot[data-fp-slot="' + o.emp + '"]'); if (s) s.classList.add(comparer(g.id).ok ? 'cible' : 'refus'); }
  const z = document.querySelector(g.id ? '.fp-poupee' : '.fp-sac'); if (z) z.classList.add('depot');
  placerGlisse(g);
}
function placerGlisse(g) {
  g.fant.style.transform = 'translate(' + (g.x - 30) + 'px,' + (g.y - 30) + 'px)';
  const el = document.elementFromPoint(g.x, g.y); g.sur = !!(el && el.closest(g.id ? '.fp-poupee' : '.fp-sac'));
  document.querySelectorAll('.depot').forEach((d) => d.classList.toggle('survol', g.sur));
}
function finGlisse(lacher) {
  const g = glisse; glisse = null; if (!g) return; clearTimeout(g.minuterie); if (!g.actif) return;
  g.fant.remove(); document.body.classList.remove('fp-en-glisse'); document.querySelectorAll('.fp-slot.cible, .fp-slot.refus, .depot, .glisse').forEach((e) => e.classList.remove('cible', 'refus', 'depot', 'survol', 'glisse'));
  glisseFin = performance.now(); /* (le clic qui suit le lacher ne choisit pas une autre piece) */
  if (lacher && g.sur && modaleOuverte === 'perso') { if (g.id) ACTIONS.equiper(g.id); else ACTIONS.retirer(g.emp); }
}
document.addEventListener('pointerdown', (e) => {
  if (modaleOuverte !== 'perso' || e.button > 0 || glisse) return;
  const c = e.target.closest('.fp-sac .fp-case.plein[data-fp-sel]'), s = c ? null : e.target.closest('.fp-poupee .fp-slot:not(.vide)');
  if ((!c && !s) || (c && String(c.dataset.fpSel).startsWith('q:'))) return; /* (un objet de quete ne s'equipe pas) */
  const g = glisse = { src: c || s, id: c ? c.dataset.fpSel : null, emp: s ? s.dataset.fpSlot : null, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, actif: false, tactile: e.pointerType === 'touch', pid: e.pointerId };
  if (g.tactile) g.minuterie = setTimeout(() => { if (glisse === g) { debutGlisse(g); if (g.actif && navigator.vibrate) navigator.vibrate(12); } }, APPUI_TACTILE);
});
document.addEventListener('pointermove', (e) => {
  const g = glisse; if (!g || e.pointerId !== g.pid) return; g.x = e.clientX; g.y = e.clientY; const d = Math.hypot(g.x - g.x0, g.y - g.y0);
  if (!g.actif) { if (g.tactile) { if (d > 10) finGlisse(false); return; } /* (au doigt, bouger avant la fin de l'appui : c'est un defilement) */ if (d < SEUIL_GLISSE) return; debutGlisse(g); if (!g.actif) return; }
  placerGlisse(g);
});
document.addEventListener('pointerup', (e) => { if (glisse && e.pointerId === glisse.pid) finGlisse(true); });
document.addEventListener('pointercancel', (e) => { if (glisse && e.pointerId === glisse.pid) finGlisse(false); });
document.addEventListener('touchmove', (e) => { if (glisse && glisse.actif) e.preventDefault(); }, { passive: false }); /* (la piece en main, la fenetre ne defile plus) */
document.addEventListener('click', (e) => { if (performance.now() - glisseFin < 80) { e.stopPropagation(); e.preventDefault(); } }, true);
document.addEventListener('dragstart', (e) => { if (e.target && e.target.closest && e.target.closest('.fp-corps')) e.preventDefault(); }); /* (pas l'image fantome du navigateur) */
document.addEventListener('contextmenu', (e) => { if (glisse && glisse.actif) e.preventDefault(); });
