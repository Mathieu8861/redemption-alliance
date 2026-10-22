'use strict';
/* ===================== INTERFACE ===================== */
const $ = (id) => document.getElementById(id);
/* BETA : le curseur de vitesse du temps (voir horlogeJeu tout en haut) */
function majVitesse() { const v = horlogeJeu.vitesse(), b = $('b-vitesse'), t = v === 1 ? 'normal' : 'x' + String(v).replace('.', ','); /* (virgule() n'est pas encore definie ici) */ b.innerHTML = '<span class="lib">Temps </span>' + t; b.classList.toggle('rapide', v > 1); $('vitesse').max = VITESSE_MAX; $('vitesse').value = v; $('vitesse-val').textContent = t; }
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
  $('kamas').textContent = fmt(S_.kamas); $('niv').textContent = n; $('xp').style.width = max ? '100%' : (100 * (S_.xp - a) / (b - a)).toFixed(1) + '%';
  $('xp-txt').textContent = max ? 'Niveau max' : fmt(S_.xp - a) + ' / ' + fmt(b - a) + ' XP';
  $('xp-barre').parentNode.dataset.info = max ? (capNiveau() < NIV_MAX ? 'Niveau ' + capNiveau() + ' : ' + texteCap() + '.' : 'Niveau ' + NIV_MAX + ' : le niveau maximum de Paysan.') :'Niveau ' + n + ' : encore ' + fmt(b - S_.xp) + ' points d\'expérience pour passer niveau ' + (n + 1) + ' (' + Math.floor(100 * (S_.xp - a) / (b - a)) + ' %)';
  if (rendreHaut.xp !== undefined && S_.xp > rendreHaut.xp) { const e = $('xp-barre'); e.classList.remove('gagne'); void e.offsetWidth; e.classList.add('gagne'); } rendreHaut.xp = S_.xp;
  $('cases').innerHTML = 'Parcelles <b style="color:var(--kamas)">' + parcelles() + '/' + quotaParcelles() + '</b>'; { const n = parcelles(), q = quotaParcelles(); $('cases').dataset.info = 'Tes parcelles : ' + n + ' labourée' + (n > 1 ? 's' : '') + ' sur ' + q + ' possibles. Une parcelle, c\'est une case de terre où tu sèmes tes graines. Ton île en permet ' + QUOTA_ILE + ', chaque terrain acheté en ajoute. Pour en labourer une : touche une case d\'herbe libre.' + (n >= q ? ' Quota atteint : achète un terrain pour en avoir plus, ou déplace tes parcelles avec Aménager.' : ''); }
  $('graine-ico').src = 'assets/icones/' + S_.graine + '.png'; $('graine-nb').textContent = S_.graines[S_.graine] || 0; $('b-graine').dataset.info = 'Graine choisie : ' + PAR_ID[S_.graine].nom;
  $('b-amenager').setAttribute('aria-pressed', !!mode);
  $('eau').innerHTML = '<svg class="goutte" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5C9 7 5.5 10.6 5.5 14.6a6.5 6.5 0 0 0 13 0C18.5 10.6 15 7 12 2.5z" fill="#3a95d1" stroke="#1f5f8b" stroke-width="1.6"/><path d="M9.2 14.2a3 3 0 0 0 2.6 3" fill="none" stroke="#dff1fb" stroke-width="1.6" stroke-linecap="round"/></svg> ' + S_.eau + '/' + capaciteEau() + (niv('arrosoir') ? ' <small style="font-weight:700;color:#3a95d1" data-info="Citerne d\'arrosage">· citerne ' + (S_.citerne || 0) + '/' + capaciteCiterne() + '</small>' : ''); $('eau').classList.toggle('vide', !S_.eau);
  $('eau').dataset.info = niv('arrosoir') ? 'Arrosoir, et citerne qui arrose seule les nouveaux semis : les deux se remplissent au puits' : 'Arrosoir : il se remplit au puits';
  { const f = $('fleches-stock'), defense = niv('arbalete') || nbTours() || niv('epouvantail') >= 3; f.hidden = !defense && !S_.fleches; /* les fleches, des qu'une defense en tire (arbalete, tour, epouvantail arme) */
    f.innerHTML = '<img src="assets/icones/fleches.png?v=' + VERSION_MODELES + '" alt="">' + fmt(S_.fleches); f.classList.toggle('vide', !!defense && !S_.fleches);
    f.dataset.info = S_.fleches ? 'Flèches en réserve : l\'arbalète, les tours et l\'épouvantail en tirent une par tir. Touche pour en acheter' : 'Plus de flèches : ta défense ne tire plus. Touche pour en acheter à l\'HDV'; }
  const repos = S_.vague.repos - Date.now(), fini = S_.vague.num > VAGUES_TOTAL;
  const prepaV = fini ? 0 : (S_.vague.prepa || 0) - Date.now(), attenteV = Math.max(repos, prepaV);
  { const ic = 'assets/icones/' + PALIERS[palierDe(Math.min(S_.vague.num, VAGUES_TOTAL))].icone + '.png?v=' + VERSION_MODELES, im = $('b-vagues').querySelector('img'); if (im && im.getAttribute('src') !== ic) im.src = ic; } /* « adapte le bouton aux vagues, tous les 10 » (Mathieu, 13/10/2026) : l'embleme du palier en cours */
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
  $('panneau-grange').innerHTML = '<h2>Grange</h2>' + (lignes.length ? lignes.map((v) => '<div class="l"><span class="n">' + icoGrange(v.id) + v.nom + '</span><span>' + fmt(S_.grange[v.id]) + '</span></div>').join('') : '<div class="l"><span>Rien pour l\'instant</span></div>') + CULTURES.filter((c) => (S_.graines[c.id] || 0) > 0).map((c) => '<div class="l"><span class="n">' + icoGrange(c.id, true) + 'Graines ' + de(c.nom) + '</span><span>' + S_.graines[c.id] + '</span></div>').join('') + Object.keys(POTS).filter((t) => S_.pots && S_.pots[t] > 0).map((t) => '<div class="l"><span class="n">' + icoGrange('pot-' + t) + POTS[t].court + '</span><span>' + S_.pots[t] + '</span></div>').join('') + (S_.filets ? '<div class="l"><span class="n">' + icoGrange('filet') + 'Filets</span><span>' + S_.filets + '</span></div>' : '') +
    (S_.crise ? '<div class="crise">Les bots de VSA cassent le prix ' + de(PAR_ID[S_.crise.id].nom) + ' à l\'HDV : -40 %</div>' : '');
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
  while (z.children.length > 4) { const vieux = [...z.children].find((e) => e !== el && !e.classList.contains('or')) || z.firstChild; clearTimeout(vieux._t); vieux.remove(); } /* les orange ne sont pas chasses par les petits messages */
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
function ouvrirModale(nom, html) { modaleOuverte = nom; $('carte').innerHTML = html; $('carte').classList.toggle('large', nom === 'vagues'); $('carte').classList.toggle('grange', nom === 'grange'); $('carte').classList.toggle('bestiaire', nom === 'bestiaire'); $('carte').classList.toggle('fiche', nom === 'perso'); /* la fiche des vagues, plus large */ $('modale').classList.add('ouverte'); }
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
  ouvrirModale('graines', entete('Quelle graine planter ?') + '<p style="font-size:.78rem;font-weight:600;margin:0 0 8px">Le nombre sur l\'icône : tes graines en grange. Elles s\'achètent à l\'HDV, onglet Acheter.</p><div class="grille-graines">' + CULTURES.map((c) => carteGraine(c, 'data-graine="' + c.id + '"', debloquee(c))).join('') + '</div>');
}
/* les icones : rendues depuis nos modeles 3D (generer-icones.html + exporter-icones.mjs -> assets/icones/) */
const ICONES = { forge: 'atelier-forge', geliere: 'geliere', qg: 'grange', nivPuits: 'puits', nivEtal: 'etal', voliere: 'voliere', arbalete: 'arbalete', enclos: 'cloture', arbPortee: 'arbalete', toursPortee: 'tour', arbChargeur: 'fleches', arbCadence: 'arbalete', arbDegats: 'fleches', tours: 'tour', reservoir: 'arrosoir', poulie: 'poulie', arrosoir: 'arrosoir', enclos: 'cloture', engrais: 'engrais', charrette: 'charrette', epouvantail: 'epouvantail', leurre: 'cawotte', mangeoire: 'auge', bottes: 'bottes', cloche: 'cloche', remise: 'kama', semences: 'sac', faux: 'faux', abreuvoir: 'abreuvoir', cisailles: 'cisailles', voliere: 'voliere', cadenas: 'cadenas', arbalete: 'arbalete', murs: 'grange', toursPv: 'tour' };
const ico = (nom) => '<span class="pic img' + (/^obj-leg-/.test(nom) ? ' leg' : '') + '"><img src="assets/icones/' + nom + '.png?v=' + VERSION_MODELES + '" alt=""></span>';
const pastille = (c) => '<span class="pic" style="background:' + c.couleur + '">' + c.nom[0] + '</span>'; /* une graine : sa couleur et son initiale */
const pic = (e) => '<span class="pic emoji">' + e + '</span>';
/* sous un bouton grise faute de kamas : ce qui manque */
const manque = (cout) => S_.kamas < cout ? '<small class="manque">Il manque ' + fmt(cout - S_.kamas) + ' ' + KAMA + '</small>' : '';
/* ce que donne chaque amelioration, niveau par niveau : stats[k] = [emoji, libelle, valeurs indexees par niv(id), mise en forme] ;
   0 ou '' : pas encore (la ligne apparait alors comme nouvelle). looks : l'apparence au niveau suivant. neufs[k] : ce qui arrive au niveau k. */
const virgule = (x) => String(x).replace('.', ',');
const enCases = (u) => virgule(Math.round(u / S * 10) / 10); /* une portee en unites du jeu, dite en cases (une case fait S = 2 unites) */
const GAINS = {
  qg: { role: 'Elle garde tes récoltes. Plus elle a de PV, plus elle tient face aux monstres.', looks: ['la grange à colombages', 'cheminée et hangar à foin', 'un soubassement de pierre', 'la tourelle de guet', 'le QG de Redemption'],
    stats: [['vita', 'Points de vie', [500, 900, 1500, 2400, 3600]]], neufs: { 1: [['bouclier', 'Les voleurs de VSA emportent 2 fois moins']] } },
  arbalete: { role: 'Elle tire seule sur les voleurs et les monstres, tant qu\'elle a des carreaux.', looks: [null, 'de bois', 'cerclée de fer', 'double, avec lunette', 'à répétition', 'la baliste de Redemption'],
    stats: [['degats', 'Dégâts', [0].concat(DEG_ARBALETE)], ['carreaux', 'Carreaux chargés', [0, 3, 6, 9, 12, 15]], ['cadence', 'Un tir toutes les', [0, 1.1, 1.0, 0.9, 0.8, 0.65], (x) => virgule(x) + ' s'], ['portee', 'Portée', [0, 7, 8, 9.5, 10.5, 12], (x) => enCases(x) + ' cases']], neufs: { 3: [['auto', 'Elle se recharge toute seule avec ta réserve de flèches']] } },
  nivPuits: { role: 'Il remplit ton arrosoir.', looks: ['le puits', 'la poulie', 'la citerne d\'arrosage', 'dallage et abreuvoir', 'le château d\'eau'],
    stats: [['eau', 'Arrosoir', [10, 15, 20, 30, 45], (x) => x + ' doses'], ['eau', 'La citerne arrose seule tes semis', [0, 0, 12, 20, 32], (x) => x + ' fois']], neufs: { 1: [['auto', 'Il remplit ton arrosoir dès que ton perso passe à 2 cases']] } },
  enclos: { role: 'Tes Bouftous y vivent et font de la laine.', looks: ['l\'enclos', 'portique et abreuvoir', 'clôture peinte et mangeoire', 'la bergerie et les cisailles', 'le ranch de Redemption'],
    stats: [['bouftou', 'Bouftous', [2, 3, 4, 5, 6]], ['cases', 'Cases d\'enclos', [6, 8, 10, 12, 14]], ['laine', 'Laines avant la tonte', [3, 3, 5, 7, 9]], ['repas', 'Repus après un repas', [4, 6, 6, 6, 6], (x) => x + ' h']], neufs: { 2: [['etoile', 'Ils mangent seuls le Blé de la grange']] } },
  voliere: { role: 'Tes Tofus capturés y donnent des plumes.', looks: ['le petit module', 'la grande volière à lattes', 'le chalet-volière', 'piliers de pierre et treillis', 'la halle de Redemption'],
    stats: [['tofu', 'Places pour tes Tofus', [2, 4, 6, 8, 10]]], neufs: { 1: [['cases', 'Elle prend une case de plus, à côté']] } },
  nivEtal: { role: 'Tu y vends tes récoltes et y achètes tes graines.', looks: ['l\'étal', 'la charrette', 'graines et balance', 'le comptoir couvert', 'le comptoir de Redemption'],
    stats: [['kama', 'Tes ventes', [0, 10, 10, 15, 20], (x) => '+' + x + ' %'], ['pousse', 'Prix des graines', [0, 0, 15, 15, 20], (x) => '-' + x + ' %']] },
  engrais: { stats: [['pousse', 'Temps de pousse de tes cultures', [0, 15, 28, 39, 48], (x) => '-' + x + ' %']] }, /* (0,85 a la puissance du niveau) */
  epouvantail: { role: 'Il éloigne les Tofus de tes champs. Les Wabbits, eux, n\'en ont pas peur.', looks: [null, null, null, 'il prend une arbalète', null, 'le PÉPITO-TRON', null],
    stats: [['tofu', 'Tofus qui viennent picorer', ['', '2 fois moins', '3 fois moins', '3 fois moins', '3 fois moins', '3 fois moins', '3 fois moins'], (x) => x],
      ['degats', 'Il tire sur les Tofus : dégâts', [0, 0, 0, 40, 60, 150, 150]], ['portee', 'Portée', ['', '', '', '8 cases', 'toute l\'île', 'toute la ferme', 'toute la ferme'], (x) => x],
      ['cadence', 'Il tire au bout de', ['', '', '', dureeLisible(EPOU[3].delai), dureeLisible(EPOU[4].delai), dureeLisible(EPOU[5].delai), dureeLisible(EPOU[5].delai)], (x) => x], ['cadence', 'Un tir toutes les', [0, 0, 0, 3.5, 2.2, 1, 1], (x) => virgule(x) + ' s']],
    neufs: { 3: [['carreaux', 'Une flèche par tir, prise dans ta réserve']], 5: [['auto', 'Il tire aussi sur les Tofus des vagues'], ['kama', '15 kamas par tir : Pépito facture tout']], 6: [['degats', 'Il tire aussi sur les voleurs de VSA, ceux des raids compris : ' + DEG_PEPITO_VSA + ' dégâts par tir']] } },
  bottes: { stats: [['vitesse', 'Ton perso marche plus vite', [0, 30], (x) => '+' + x + ' %']] },
  leurre: { role: 'Une fausse Cawotte qui attire les Wabbits loin de tes Cawottes et de tes Fraises (pas ceux des vagues). Il ne les chasse pas : c\'est à toi de venir.', looks: [null, 'la fausse Cawotte en bois peint', 'la Cawotte au caramel', 'le panier à ressort'],
    stats: [['protege', 'Wabbits qui filent dessus', ['', '1 sur 2', '3 sur 4', 'tous'], (x) => x], ['cadence', 'Le Wabbit y reste', ['', dureeLisible(DUREE_PICORAGE), 'jusqu\'à ce que tu viennes', 'pris au panier'], (x) => x]] },
  cloche: { stats: [['cadence', 'Temps pour chasser un Tofu ou un Wabbit avant qu\'il vole', [1, 2], (x) => dureeLisible(x * DUREE_PICORAGE)]] },
  semences: { stats: [['pousse', 'Graine rendue à la récolte', ['', '1 fois sur 4'], (x) => x]] },
  forge: { stats: [['etoile', 'Forgemagie de tes pièces', ['', '+20 % de jet par rune'], (x) => x]] },
  faux: { stats: [['epi', 'Récolte de chaque parcelle', ['', '+1 (Blé : 3 → 4)'], (x) => x]] },
  geliere: { role: 'Tes Gelées y vivent au bord de l\'eau et font tes pots de gelée avec tes fruits.', looks: [null, 'le pré aux gelées', 'le parc à gelées', 'l\'atelier de confiture', 'la confiserie de Redemption'], stats: [['cases', 'Places pour tes Gelées', [0, 2, 4, 6, 8]]], neufs: { 1: [['cases', 'Elle prend 6 cases d\'herbe (3 sur 2)']] } }
};
/* les deux parties de l'onglet Ameliorations */
/* « le systeme qu'on a fait a l'HDV dans Achat est super, on pourrait faire le meme principe pour les ameliorations ? » (Mathieu, 13/10/2026) : trois categories
   en haut, chacune avec le nombre d'ameliorations que tu peux acheter tout de suite ; dedans, une phrase sur leur role, ce qui s'achete d'abord, puis ce qui attend
   un niveau, puis ce qui est au maximum */
const CATS_AMELIO = [['ferme', 'Ferme', 'puits', 'Ton puits, ton étal de l\'HDV et ton atelier de forgemagie.', ['nivPuits', 'nivEtal', 'forge']], /* (l'atelier de forgemagie ici depuis le 15/10/2026, « pas dans Défense », Mathieu) */
  ['animaux', 'Animaux', 'bouftou', 'Plus de place pour tes Bouftous, tes Tofus et tes Gelées : plus de laine, de plumes et de pots de gelée.', ['enclos', 'voliere', 'geliere']],
  ['defense', 'Défense', 'tour', 'Protéger ta ferme : la grange et son arbalète contre les voleurs de VSA, l\'épouvantail contre les Tofus, le leurre contre les Wabbits, et ton gardien.', ['qg', 'arbalete', 'epouvantail', 'leurre', 'gardien']]];
/* CONSTRUIRE (22/10/2026) : ce qui se construit une premiere fois ; une fois construit, ca passe dans Ameliorer (les tours restent ici jusqu'a la derniere,
   chacune se monte de niveau depuis sa propre fenetre). OUTILS : les achats qui rendent le travail plus facile, dans Acheter. */
const CONSTRUCTIONS = ['arbalete', 'tours', 'geliere', 'forge', 'leurre', 'gardien'], OUTILS = ['engrais', 'semences', 'faux', 'bottes', 'cloche'];
const construit = (id) => (id === 'gardien' ? !!S_.gardien : id === 'tours' ? nbTours() >= TOURS_MAX : niv(id) > 0);
const aConstruire = () => CONSTRUCTIONS.filter((id) => !construit(id));
/* ou en est une amelioration : 'dispo' (ok : assez de kamas), 'bloque' (un niveau ou une amelioration d'abord), 'fini' */
function etatAmelio(id) {
  if (id === 'gardien') return etatGardien(); /* (le gardien n'est pas une amelioration : un choix, au niveau 80) */
  if (id === 'tours') { const n = nbTours(), ct = PRIX_TOUR[Math.min(n, PRIX_TOUR.length - 1)]; return niveau(S_.xp) < NIV_TOUR ? { e: 'bloque' } : n >= TOURS_MAX ? { e: 'fini' } : { e: 'dispo', ok: S_.kamas >= ct }; }
  const a = AMELIOS.find((x) => x.id === id), n = niv(id); if (n >= a.couts.length) return { e: 'fini' };
  if ((a.requiert && !niv(a.requiert)) || niveau(S_.xp) < nivRequis(a, n) || verrouVague(a)) return { e: 'bloque' };
  return { e: 'dispo', ok: S_.kamas >= a.couts[n] };
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
  const place = fini ? '' : a.id === 'voliere' && n === 0 && bloqueursVoliere().length ? 'Libère une case à côté de la volière' : a.id === 'geliere' && n === 0 && !bloque && !blocLibreGeliere() ? 'Libère 6 cases d\'herbe d\'un seul tenant (3 sur 2)' : a.id === 'forge' && n === 0 && !bloque && !caseLibreForge() ? 'Libère une case d\'herbe' : a.id === 'leurre' && n === 0 && !bloque && !caseLibreLeurre() ? 'Libère une case d\'herbe' : '';
  const plusieurs = a.couts.length > 1, numSuiv = NIVBAT[a.id] ? n + 2 : n + 1, G = GAINS[a.id];
  const total = bat ? 5 : plusieurs ? a.couts.length : 0, actuel = bat ? (a.id === 'arbalete' ? n : n + 1) : n;
  const look = !fini && G && G.looks && G.looks[n + 1];
  const suiv = fini ? (plusieurs ? 'Niveau maximum' : 'Acquis') : plusieurs ? ((a.id === 'arbalete' || a.id === 'geliere') && !n ? 'En la construisant' : 'Au niveau ' + numSuiv + (look ? ', ' + look : '')) : 'En l\'achetant';
  const achat = fini ? '<span class="a-etat">' + (plusieurs ? 'Niveau maximum atteint' : 'Déjà acheté') + '</span>'
    : manqueReq ? '<span class="a-etat">' + picto('cadenas', GRIS_PICTO) + AMELIOS.find((x) => x.id === a.requiert).nom.split(' sur ')[0] + ' d\'abord</span>'
    : bloque ? '<span class="a-etat">' + picto('cadenas', GRIS_PICTO) + (verrouVague(a) ? 'Après la vague ' + a.apresVague : 'Paysan niveau ' + nivRequis(a, n)) + '</span>'
    : (place ? '<span class="a-manque">' + place + '</span>' : ilManque(cout)) + '<button class="btn kamas" data-amelio="' + a.id + '"' + (S_.kamas < cout || place ? ' disabled' : '') + '>' + ((a.id === 'arbalete' || a.id === 'geliere' || a.id === 'leurre') && !n ? 'Construire' : plusieurs ? 'Niveau ' + numSuiv : 'Acheter') + ' · ' + fmt(cout) + ' ' + KAMA + '</button>';
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
    const L = aConstruire(), par = (e) => L.filter((id) => etatAmelio(id).e === e), faits = CONSTRUCTIONS.filter((id) => !L.includes(id));
    ouvrirModale('hdv', entete('Hôtel de vente') + tete + etatHdv + '<p class="hdv-aide">Les bâtiments que tu n\'as pas encore. Une fois construits, ils passent dans <b>Améliorer</b>, où ils montent de niveau. Ils se posent tout seuls sur une case libre, puis se déplacent avec Aménager.</p>' +
      par('dispo').map(carte).join('') + (par('bloque').length ? '<div class="hdv-section">À débloquer</div>' + par('bloque').map(carte).join('') : '') +
      (L.length ? '' : '<p class="hdv-aide">Tout est construit ! Leurs niveaux se montent dans Améliorer.</p>') +
      (faits.length ? '<p class="hdv-aide" style="margin-top:10px">Déjà construits : ' + faits.map((id) => ({ tours: 'tes ' + TOURS_MAX + ' tours', gardien: gardienDe() ? gardienDe().nom : '', arbalete: 'l\'arbalète de la grange', geliere: 'la Gelière', forge: 'l\'atelier de forgemagie', leurre: 'le leurre à Wabbits' })[id]).join(', ') + '.</p>' : '')); return;
  }
  if (onglet === 'ameliorer') {
    const pretes = (L) => L.filter((id) => construit(id) || !CONSTRUCTIONS.includes(id)).filter((id) => { const x = etatAmelio(id); return x.e === 'dispo' && x.ok; }).length;
    if (!ouvrirHdv.catA) ouvrirHdv.catA = (CATS_AMELIO.find((C) => pretes(C[4])) || CATS_AMELIO[0])[0]; /* (la premiere fois : la ou il y a quelque chose a acheter) */
    const C = CATS_AMELIO.find(([k]) => k === ouvrirHdv.catA) || CATS_AMELIO[0], ici = C[4].filter((id) => !CONSTRUCTIONS.includes(id) || construit(id)), par = (e) => ici.filter((id) => etatAmelio(id).e === e);
    const versConstruire = nConstruire ? '<p class="hdv-aide">' + nConstruire + ' bâtiment' + (nConstruire > 1 ? 's' : '') + ' à construire : <button class="lien" data-hdv-onglet="construire">onglet Construire</button>.</p>' : '';
    const cats = '<div class="hdv-cats">' + CATS_AMELIO.map(([k, t, i, , L]) => { const n = pretes(L); return '<button data-hdv-cat-a="' + k + '" aria-pressed="' + (C[0] === k) + '"><img src="assets/icones/' + i + '.png?v=' + VERSION_MODELES + '" alt="">' + t + (n ? '<span class="hdv-pret" title="' + n + ' à acheter tout de suite">' + n + '</span>' : '') + '</button>'; }).join('') + '</div>';
    const bloque = par('bloque'), fini = par('fini');
    ouvrirModale('hdv', entete('Hôtel de vente') + tete + cats + '<p class="hdv-aide">' + C[3] + '</p>' + versConstruire + (ici.length ? '' : '<p class="hdv-aide">Rien encore : construis d\'abord (onglet Construire).</p>') + par('dispo').map(carte).join('') +
      (bloque.length ? '<div class="hdv-section">À débloquer</div>' + bloque.map(carte).join('') : '') + (fini.length ? '<div class="hdv-section">Déjà au maximum</div>' + fini.map(carte).join('') : '')); return;
  }
  if (onglet === 'acheter') {
    /* « le x1 ou x10, faudrait le mettre partout au meme endroit que le bouton d'achat ; pour les nouveaux joueurs, c'est pas intuitif de scroller pour voir
       qu'il y a les Bouftous, les filets et les fleches ; et expliquer a quoi ils servent, les rendre plus visibles avant ce qui n'est pas debloque »
       (Mathieu, 12/10/2026) : trois categories visibles en haut, la quantite a cote de chaque bouton, une phrase sur l'usage, les graines a debloquer en dernier */
    const cat = ouvrirHdv.cat || 'graines', cap = capacite(), pc = (e, t) => '<span class="puce">' + picto(e, '#8a7a5c') + t + '</span>';
    const cats = '<div class="hdv-cats q6">' + [['graines', 'Graines', 'ble'], ['animaux', 'Animaux', 'bouftou'], ['materiel', 'Matériel', 'fleches'], ['outils', 'Outils', 'faux'], ['gelees', 'Gelées', 'pot-petit'], ['deco', 'Déco', 'deco-lanterne']].map(([k, t, i]) => '<button data-hdv-cat="' + k + '" aria-pressed="' + (cat === k) + '"><img src="assets/icones/' + i + '.png?v=' + VERSION_MODELES + '" alt="">' + t + '</button>').join('') + '</div>';
    let corps = '';
    if (cat === 'graines') {
      const ouvertes = CULTURES.filter(debloquee), fermees = CULTURES.filter((c) => !debloquee(c));
      corps = '<p class="hdv-aide">Une graine plantée sur une parcelle donne une récolte à revendre. Les plus longues à pousser rapportent plus.</p>' + ouvertes.map((c) => {
        const p = prixGraine(c), st = S_.graines[c.id] || 0, opts = [[1, '×1'], [10, '×10']], n = qteDe('g:' + c.id, opts);
        return '<div class="art">' + ico(c.id) + '<div><b>Graines ' + de(c.nom) + '</b><div class="puces">' + pc('vitesse', dureeLisible(duree(c))) + pc('epi', '×' + c.rendement + ' à la récolte') + '<span class="puce">' + st + ' en grange</span>' + (c.mange ? '<span class="puce bonne">repas : ' + c.mange.txt + '</span>' : '') + '</div>' +
          (c.mange ? '<div class="desc">Une culture à manger : avant une vague, dans la fenêtre Vagues, ton perso en mange une récolte et gagne ' + c.mange.txt + ' pendant toute la vague. Elle se vend aussi.</div>' : '') + '</div>' +
          '<div class="act"><small>' + p + ' ' + KAMA + ' la graine</small>' + segQte('g:' + c.id, opts) + '<button class="btn kamas" data-graines="' + c.id + '" data-n="' + n + '"' + (S_.kamas >= n * p ? '' : ' disabled') + '>Acheter ×' + n + ' = ' + fmt(n * p) + ' ' + KAMA + '</button>' + manque(n * p) + '</div></div>';
      }).join('') + (fermees.length ? '<div class="hdv-section">À débloquer en montant de niveau</div>' + fermees.map((c) => '<div class="art verrou">' + ico(c.id) + '<div><b>Graines ' + de(c.nom) + '</b></div><div class="act"><span class="cadenas">' + picto('cadenas', '#a3957a') + 'Niveau ' + c.niv + '</span></div></div>').join('') : '');
    } else if (cat === 'animaux') {
      const plein = S_.bouftous.length + enGestation() >= cap;
      corps = '<div class="art">' + ico('bouftou') + '<div><b>Bouftou</b><div class="puces"><span class="puce' + (plein ? ' mauvaise' : '') + '">' + picto('bouftou', '#8a7a5c') + S_.bouftous.length + '/' + cap + ' dans l\'enclos</span>' + pc('repas', 'mange ' + REPAS + ' Blé') + pc('laine', 'sa laine : ' + LAINE.prix + ' ' + KAMA) + '</div>' +
        '<div class="desc">Il vit dans l\'enclos. Nourri, il fait de la laine que tu revends. Deux adultes peuvent faire un petit (' + COUT_REPRO + ' Houblon). Pour plus de place, améliore l\'enclos.</div></div>' +
        '<div class="act"><small>' + (plein ? 'Enclos plein' : S_.bouftousAchetes ? 'à l\'unité' : 'le premier à prix doux') + '</small><button class="btn kamas" data-bouftou' + (plein || S_.kamas < prixBouftou() ? ' disabled' : '') + '>Acheter ' + fmt(prixBouftou()) + ' ' + KAMA + '</button>' + (plein ? '' : manque(prixBouftou())) + '</div></div>' +
        (niv('geliere') ? '<div class="hdv-section">Les Gelées, pour ta Gelière : ' + (S_.gelees || []).length + ' sur ' + placesGeliere() + ' places</div>' + GELEES_HDV.map((c) => { const G = GELEES[c], pl = (S_.gelees || []).length < placesGeliere(), ok = pl && S_.kamas >= G.prix;
          return '<div class="art">' + ico('gelee-' + c) + '<div><b>' + G.nom + '</b><div class="puces"><span class="puce bonne">son pot : ' + BREF_POT[G.pot] + '</span><span class="puce">mange ' + recetteTxt(G.recette) + ' par pot</span></div><div class="desc">Elle vit au bord de l\'eau, dans ta Gelière, et te fait un pot de sa couleur en ' + dureeLisible(c === 'royale' ? PROD_ROYALE : PROD_GELEE) + ' quand tu la nourris.</div></div>' +
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
        (par('bloque').length ? '<div class="hdv-section">À débloquer</div>' + par('bloque').map(carte).join('') : '') + (par('fini').length ? '<div class="hdv-section">Déjà achetés</div>' + par('fini').map(carte).join('') : '');
    } else if (cat === 'deco') { corps = corpsDecoHdv();
    } else {
      const oF = [[1, '×1'], [5, '×5']], nF = qteDe('filets', oF), oA = [[10, '×10'], [50, '×50']], nA = qteDe('fleches', oA);
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
  ouvrirModale('hdv', entete('Hôtel de vente') + tete + etatHdv + (S_.crise ? '<div class="crise" style="background:#fde3df;border:2px solid var(--rouge);border-radius:10px;padding:5px 8px;font-size:.75rem;margin-bottom:8px">Les bots de VSA cassent le prix ' + de(PAR_ID[S_.crise.id].nom) + ' : -40 % jusqu\'à ce qu\'ils s\'en aillent.</div>' : '') +
    (lignes.length ? lignes.map((v) => {
      const oV = [[1, '×1'], [10, '×10'], [0, 'Tout']], q = qteDe('v:' + v.id, oV), st = S_.grange[v.id] || 0, p = prix(v.id), avant = (S_.coursAvant && S_.coursAvant[v.id]) || 1, mtn = S_.cours[v.id] || 1, n = q === 0 ? st : Math.min(q, st);
      const tend = mtn > avant + 0.005 ? '<span class="puce bonne">▲ en hausse</span>' : mtn < avant - 0.005 ? '<span class="puce mauvaise">▼ en baisse</span>' : '';
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
    return '<div class="art eb">' + ico('bouftou').replace('<img', '<img style="' + (b.noir ? 'filter:brightness(.35) sepia(.3)' : '') + (bebe ? ';transform:scale(.7)' : '') + '"') + '<div><b>' + b.nom + (b.noir ? ' <span style="color:var(--or)">★ noir</span>' : '') + '</b><div class="eb-etat">' + etatFaim + (repos ? '<span>' + picto('vitesse', GRIS_PICTO) + 'se repose ' + dureeLisible(repos) + '</span>' : '') + '</div>' + laine + '</div>' +
      '<div class="act mini"><button class="btn ' + (faim ? 'kamas' : 'discret') + ' mini" data-nourrir="' + j + '">Nourrir · ' + repasDe(b) + ' Blé</button><button class="btn mini' + (pleine ? ' kamas' : '') + '" data-tondre="' + j + '"' + (b.laine ? '' : ' disabled') + '>Tondre' + (b.laine ? ' ' + b.laine : '') + '</button><button class="btn discret mini" data-vendre-bouftou="' + j + '" data-info="Le vendre à un autre éleveur : ' + fmt(revente) + ' kamas">Vendre ' + fmt(revente) + '</button></div></div>';
  }).join('');
  const achat = '<div class="art">' + ico('bouftou') + '<div><b>Un Bouftou de plus</b><div class="puces"><span class="puce' + (plein ? ' mauvaise' : '') + '">' + picto('bouftou', '#8a7a5c') + S_.bouftous.length + '/' + cap + ' places</span></div>' + (plein ? '<div class="desc">L\'enclos est plein : agrandis-le juste en dessous.</div>' : '') + '</div>' +
    '<div class="act"><button class="btn kamas" data-bouftou' + (plein || S_.kamas < prixBouftou() ? ' disabled' : '') + '>Acheter ' + fmt(prixBouftou()) + ' ' + KAMA + '</button>' + (plein ? '' : manque(prixBouftou())) + '</div></div>';
  const aPlacer = maxCasesEnclos() - casesEnclos().length;
  const amenager = '<div class="art">' + ico('cloture') + '<div><b>Aménager l\'enclos</b><div class="puces"><span class="puce">' + casesEnclos().length + '/' + maxCasesEnclos() + ' cases</span>' + (aPlacer > 0 ? '<span class="puce bonne">' + aPlacer + ' case' + (aPlacer > 1 ? 's' : '') + ' à placer</span>' : '') + '<span class="puce">2 cases par Bouftou</span></div><div class="desc">Change sa forme (+ pour ajouter une case, − pour en rendre une) ou emmène-le ailleurs, Bouftous compris.</div></div><div class="act">' + (aPlacer > 0 ? '<button class="btn kamas" data-enclos-auto>Placer toute' + (aPlacer > 1 ? 's' : '') + ' seule' + (aPlacer > 1 ? 's' : '') + '</button>' : '') + '<button class="btn ' + (aPlacer > 0 ? 'discret' : 'kamas') + '" data-amenager-enclos>Aménager</button></div></div>';
  const prets = S_.bouftous.filter(peutReproduire).length, noirs = S_.bouftous.filter((b) => b.noir).length, houblon = S_.grange.houblon || 0;
  const attente = S_.bouftous.filter((b) => b.gestation).map((b) => '<span class="puce" style="background:#f6c3d6">' + b.nom + ' : naissance dans ' + dureeLisible(Math.max(0, b.gestation.fin - Date.now())) + '</span>').join('');
  const repro = '<div class="art">' + ico('bouftou') + '<div><b>Faire un petit</b><div class="puces"><span class="puce ' + (prets >= 2 ? 'bonne' : 'mauvaise') + '">' + prets + ' adulte' + (prets > 1 ? 's' : '') + ' prêt' + (prets > 1 ? 's' : '') + '</span><span class="puce ' + (houblon >= COUT_REPRO ? 'bonne' : 'mauvaise') + '">' + picto('pousse', '#8a7a5c') + COUT_REPRO + ' Houblon (' + houblon + ' en grange)</span><span class="puce">' + (noirs ? 'Noir : 1 chance sur 40 (tu en as ' + noirs + ' ★)' : 'Noir : 1 chance sur 20') + '</span></div><div class="desc"><b>Il faut</b> 2 adultes qui ont mangé et ' + COUT_REPRO + ' Houblon' + (debloquee(PAR_ID.houblon) ? '' : ' (il se cultive au niveau ' + PAR_ID.houblon.niv + ')') + '. Le petit naît après <b>' + dureeLisible(DUREE_GESTATION) + ' de gestation</b> (la future maman s\'arrondit, une bulle rose compte les minutes), et les parents se reposent ' + dureeLisible(REPOS_REPRO) + '.<br>' +
      '<b>Le bébé</b> ne grandit que le ventre plein : ' + REPAS_BEBE + ' Blé par repas, un repas le nourrit ' + dureeLisible(dureeRepas() / 2) + '. Il devient adulte après ' + dureeLisible(DUREE_CROISSANCE) + ' le ventre plein (' + Math.ceil(DUREE_CROISSANCE / (dureeRepas() / 2) - 1e-9) + ' repas), ' + dureeLisible(DUREE_CROISSANCE_NOIR) + ' pour un noir.<br>' +
      '<b>Le Bouftou noir</b> : 1 chance sur 20 puis 1 chance sur 40 si tu en as déjà un, 1 chance sur 2 si les deux parents sont noirs.</div>' + (attente ? '<div class="puces">' + attente + '</div>' : '') + '</div><div class="act"><button class="btn kamas" data-reproduire' + (prets < 2 || plein || houblon < COUT_REPRO ? ' disabled' : '') + '>Faire un petit</button>' + (plein ? '<small class="manque">Plus de place</small>' : '') + '</div></div>';
  ouvrirModale('enclos', entete('Enclos à Bouftous') + amenager + betes + repro + achat + lignesAmelio(['enclos'], 'Améliorer l\'enclos'));
}
function reglagesPepito() {
  if (niv('epouvantail') < 5) return '';
  const ligne = (k, icone, nom, aide, laisse) => { const on = pepitoTire(k); return '<div class="art">' + ico(icone) + '<div><b>' + nom + '</b><div class="desc">' + aide + '</div></div><div class="act"><button class="btn ' + (on ? 'kamas' : 'discret') + '" data-pepito="' + k + '">' + (on ? 'Il tire' : laisse) + '</button></div></div>'; }; /* (une icone par reglage : sans elle, le texte tombait dans sa colonne, 19/10/2026) */
  return '<div class="hdv-section">Réglages du PÉPITO-TRON</div><p class="hdv-aide">Pendant les vagues, il tire tout seul. En dehors, à toi de choisir :</p>' +
    ligne('champs', 'tofu', 'Les Tofus qui picorent tes champs', PRIX_LASER + ' kamas par tir. S\'il les laisse, chasse-les toi-même.', 'Il les laisse') + ligne('sauvage', 'filet', 'Le Tofu sauvage dans l\'herbe', 'Laisse-le si tu veux le capturer au filet pour ta volière.', 'Il le laisse');
}
function ouvrirEpouvantail() {
  ouvrirModale('epouvantail', entete('L\'épouvantail') + (degatsBat('epouvantail') ? artPv('epouvantail') : '') + (() => { const n = niv('epouvantail'), E = EPOU[Math.min(5, n)];
    const etat = n >= 6 ? 'Un laser sur toute la ferme : les Tofus qui picorent tes champs, les monstres qui grignotent tes cultures pendant les vagues, et les voleurs de VSA (' + DEG_PEPITO_VSA + ' dégâts par tir). ' + PRIX_LASER + ' kamas par tir.' : n >= 5 ? 'Un laser sur toute la ferme : les Tofus qui picorent tes champs, et pendant les vagues, les monstres qui grignotent tes cultures. ' + PRIX_LASER + ' kamas par tir.' : n >= 3 ? 'Il tire à l\'arbalète sur les Tofus qui picorent, ' + (n >= 4 ? 'sur toute l\'île' : 'à ' + enCases(E.portee) + ' cases') + ', ' + dureeLisible(E.delai) + ' après leur arrivée' + '. Une flèche par tir (' + S_.fleches + ' en réserve).' : n === 2 ? 'Les Tofus viennent trois fois moins souvent.' : n === 1 ? 'Les Tofus viennent deux fois moins souvent.' : 'Il fait fuir une partie des Tofus qui viennent picorer tes champs.';
    return '<div class="art">' + ico('epouvantail') + '<div><b>' + (n >= 6 ? 'PÉPITO-TRON blindé' : n >= 5 ? 'PÉPITO-TRON' : 'Épouvantail niveau ' + n) + '</b><div class="desc">' + etat + (n >= 5 ? ' Les Wabbits, il ne les vise pas.' : ' Il ne s\'occupe que des Tofus.') + '</div></div><div></div></div>'; })() + reglagesPepito() + lignesAmelio(['epouvantail', 'cloche'], 'Contre les Tofus'));
}
function ouvrirPuits() {
  ouvrirModale('puits', entete('Le puits') + (degatsBat('puits') ? artPv('puits') + (S_.eau < capaciteEau() || !citernePleine() ? '<div class="ligne"><div><b>Remplir</b><small>Arrosoir ' + S_.eau + '/' + capaciteEau() + (niv('arrosoir') ? ', citerne ' + (S_.citerne || 0) + '/' + capaciteCiterne() : '') + '.</small></div><button class="btn eau" data-remplir>Remplir</button></div>' : '') : '') + '<p style="font-size:.8rem;font-weight:600;margin:0 0 4px">Arrosoir : ' + S_.eau + '/' + capaciteEau() + (niv('arrosoir') ? '. Citerne : ' + (S_.citerne || 0) + '/' + capaciteCiterne() + ' (elle arrose seule les nouveaux semis)' : '') + '. Touche le puits pour remplir ' + (niv('arrosoir') ? 'les deux' : 'l\'arrosoir') + '.</p>' + lignesAmelio(['nivPuits'], 'Améliorer le puits'));
}
function ouvrirGrange(choix) {
  if (choix !== undefined) ouvrirGrange.choix = choix === ouvrirGrange.choix ? null : choix; /* (toucher la meme case la referme) */
  const sel = ouvrirGrange.choix, v = '?v=' + VERSION_MODELES, img = (n) => '<img src="assets/icones/' + n + '.png' + v + '" alt="">';
  const kase = (cle, icone, n, titre, extra) => '<button class="gr-case' + (sel === cle ? ' choisie' : '') + (extra || '') + '" data-grange-case="' + cle + '" data-info="' + titre + '">' + icone + (n != null ? '<b>' + fmt(n) + '</b>' : '') + '</button>';
  const grille = (L) => { const vides = (7 - (L.length % 7)) % 7; return '<div class="gr-grille">' + L.join('') + '<span class="gr-case vide"></span>'.repeat(vides) + '</div>'; };
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
  const arbal = arb ? '<div class="gr-arb">' + img('arbalete') + '<div><b>Arbalète ' + arb + '/5</b><br>' + degatsArbalete() + ' dégâts, ' + enCases(porteeArbalete()) + ' cases<div class="gr-jauge"><i style="width:' + Math.round(100 * S_.carreaux / cap) + '%"></i></div></div><div class="gr-arb-etat">' + S_.carreaux + '/' + cap + ' · ' + fmt(S_.fleches) + ' flèche' + (S_.fleches > 1 ? 's' : '') +
    (rechargeAuto() ? '<br>' + (S_.fleches ? 'se recharge seule' : '<span style="color:var(--rouge)">réserve vide</span>') : S_.carreaux >= cap ? '' : '<br><button class="btn kamas mini" data-recharger' + (S_.fleches ? '' : ' disabled') + '>Recharger</button>') + '</div></div>' : '';
  const ligneA = (id, icone) => { const a = AMELIOS.find((x) => x.id === id); if (!a) return ''; const n = niv(id), e = etatAmelio(id), bat = !!NIVBAT[id] || id === 'arbalete', total = bat ? 5 : a.couts.length, actuel = bat ? (id === 'arbalete' ? n : n + 1) : n;
    const act = e.e === 'fini' ? '<span class="gr-aide">Niveau max</span>' : e.e === 'bloque' ? '<span class="gr-aide">' + picto('cadenas', GRIS_PICTO) + 'Niveau ' + nivRequis(a, n) + '</span>' : '<button class="btn kamas" data-amelio="' + id + '"' + (e.ok ? '' : ' disabled') + '>' + fmt(a.couts[n]) + ' ' + KAMA + '</button>';
    return '<div class="gr-amel">' + img(icone) + '<span>' + (id === 'qg' ? 'La grange' : 'L\'arbalète') + ' ' + actuel + '/' + total + '</span>' + act + '</div>'; };
  const nt = nbTours(), ct = PRIX_TOUR[Math.min(nt, PRIX_TOUR.length - 1)];
  const tours = '<div class="gr-amel">' + img('tour') + '<span>Tours : ' + nt + ' sur ' + TOURS_MAX + '</span>' + (niveau(S_.xp) < NIV_TOUR ? '<span class="gr-aide">' + picto('cadenas', GRIS_PICTO) + 'Niveau ' + NIV_TOUR + '</span>' : nt >= TOURS_MAX ? '<span class="gr-aide">Toutes construites</span>' : '<button class="btn kamas" data-poser-tour' + (S_.kamas < ct ? ' disabled' : '') + '>Construire ' + fmt(ct) + ' ' + KAMA + '</button>') + '</div>';
  const droite = '<div class="gr-carte"><h3 class="gr-titre">La grange<small>niveau ' + (nq + 1) + '</small></h3>' + pvG + arbal + '<h3 class="gr-titre" style="margin-top:12px">Améliorer</h3>' + ligneA('qg', 'grange') + ligneA('arbalete', 'arbalete') + tours +
    '<div class="gr-menace">Les voleurs de VSA ont maintenant <b>' + pvVoleur() + ' PV</b> : ils se renforcent à chaque vague gagnée.</div></div>' +
    '<div class="gr-pied"><button class="btn discret" data-perso-slot="">Fiche du perso</button><button class="btn discret" data-hdv-onglet="vendre">Aller à l\'HDV</button></div>';
  ouvrirModale('grange', '<h2>Grange<span class="gr-valeur">Ton stock vaut <b>' + fmt(Math.round(valeurGrange())) + ' kamas</b> à l\'HDV</span><button data-fermer aria-label="Fermer">✕</button></h2>' +
    '<div class="gr-corps"><div class="gr-gauche">' + gauche + '<div class="gr-detail' + (sel ? ' plein' : '') + '">' + det + '</div></div><div class="gr-droite">' + droite + '</div></div>');
}
const SORTS = {
  iop: [['Coup d\'épée', 'Au corps à corps, il frappe le monstre ciblé.'], ['Bond du Iop', 'Tu vises où il saute (jusqu\'à ' + PORTEE_BOND + ' cases) : en retombant, 3 fois ses dégâts sur le monstre le plus proche, 1,5 fois tout autour, et chaque monstre touché lui rend 3 % de sa vie. Recharge ' + RECHARGE_SORT + ' s.'], ['Peau de Iop', 'Toujours actif : il encaisse 15 % de dégâts en moins.']],
  cra: [['Flèche', 'À distance (' + Math.round(STATS_CLASSE.cra.portee / S) + ' cases). Une flèche sur ' + TIR_FEU + ' est une flèche de feu : double dégâts, et la cible brûle 3 s.'], ['Flèche perçante', 'Tu vises une ligne : elle traverse tous les monstres, 3 fois tes dégâts. Recharge ' + RECHARGE_PERCANTE + ' s.']],
  osa: [['Coup de fouet', 'À portée de fouet (3 cases), il frappe le monstre ciblé.'], ['Invocation', 'Tu vises où poser un Bouftou (jusqu\'à ' + PORTEE_INVOC + ' cases) : il retombe en frappant tout autour (2 fois tes dégâts), puis se bat ' + DUREE_INVOC + ' s. Recharge ' + RECHARGE_INVOC + ' s.']]
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
    prospection: ['Prospection', 'Augmente tes chances de butin sur les monstres : ressources, pièces d\'équipement et pièces rares (+' + c.prospection + ' %). Une Fraise mangée avant une vague en ajoute 30 %.']
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
    const p = paysan(0, 0, 0, classeDe()); scene.remove(p); p.rotation.set(0, 0, 0); p.traverse((o) => { if (o.userData && o.userData.ombre) o.visible = false; }); sc.add(p); p.updateMatrixWorld(true);
    const bb = new T.Box3().setFromObject(p), c = bb.getCenter(new T.Vector3()), t = bb.getSize(new T.Vector3()), cam = new T.PerspectiveCamera(24, 300 / 360, 0.05, 50);
    cam.position.copy(c).add(new T.Vector3(Math.sin(0.4), 0.22, Math.cos(0.4)).multiplyScalar(t.y * 2.6)); cam.lookAt(c);
    portraitR.render(sc, cam); portraits[cle] = portraitR.domElement.toDataURL('image/png'); sc.remove(p);
  } catch (e) { portraits[cle] = 'assets/icones/' + classeDe() + '.png?v=' + VERSION_MODELES; }
  return portraits[cle];
}
function ouvrirPerso(sel) {
  if (modaleOuverte !== 'perso') { persoNeufs = Object.assign({}, S_.neufs || {}); S_.neufs = {}; persoOnglet = 'equip'; persoFiltre = 'tout'; persoSel = null; persoCarac = null; persoEmp = null; }
  const dansSac = (k) => S_.sac[k] > 0 && obj(k), sacL = Object.keys(S_.sac).filter(dansSac), equipe = (k) => Object.values(S_.equip).includes(k);
  if (sel && NOMS_EMP[sel]) { persoSel = S_.equip[sel] || sacL.filter((k) => obj(k).emp === sel).sort((x, y) => qualiteJet(y) - qualiteJet(x))[0] || null; } /* un emplacement */
  else if (sel) persoSel = sel; /* une piece */
  if (persoSel && !dansSac(persoSel) && !equipe(persoSel)) persoSel = null;
  const ordre = (x, y) => (persoNeufs[y] ? 1 : 0) - (persoNeufs[x] ? 1 : 0) || (comparer(y).mieux ? 1 : 0) - (comparer(x).mieux ? 1 : 0) || obj(y).niv - obj(x).niv || qualiteJet(y) - qualiteJet(x);
  if (!persoSel) persoSel = sacL.filter((k) => persoNeufs[k]).sort(ordre)[0] || sacL.filter((k) => comparer(k).mieux).sort(ordre)[0] || S_.equip.coiffe || Object.values(S_.equip).find(Boolean) || sacL.sort(ordre)[0] || null;
  const st = statsPerso(), c = st.c, cl = CLASSES.find((x) => x.id === classeDe()), l = st.niveau, a = seuil(l), b = seuil(l + 1); S_.nouveaux = 0; rendreHaut();
  const nbNeufs = sacL.filter((k) => persoNeufs[k]).length;
  const tete = '<div class="fp-tete"><span class="fp-mini"><img src="assets/icones/' + icoClasse() + '.png?v=' + VERSION_MODELES + '" alt=""></span><div><b>' + echapper(S_.perso.nom) + '</b><small>' + cl.nom + ' niveau ' + l + '</small></div>' +
    '<div class="fp-xp"><div class="barre"><i style="width:' + (l >= capNiveau() ? 100 : (100 * (S_.xp - a) / Math.max(1, b - a)).toFixed(1)) + '%"></i></div><small>' + (l >= capNiveau() ? (capNiveau() < NIV_MAX ? 'Niveau maximum pour l\'instant : ' + texteCap() : 'Niveau maximum') : fmt(S_.xp - a) + ' / ' + fmt(b - a) + ' XP vers le niveau ' + (l + 1)) + '</small></div>' +
    '<span class="fp-kamas">' + fmt(S_.kamas) + ' ' + KAMA + '</span><button class="fp-fermer" data-fermer aria-label="Fermer">✕</button></div>' +
    '<div class="fp-onglets"><button data-fp-onglet="equip" aria-pressed="' + (persoOnglet === 'equip') + '">Équipement' + (nbNeufs ? '<em>' + nbNeufs + '</em>' : '') + '</button><button data-fp-onglet="sorts" aria-pressed="' + (persoOnglet === 'sorts') + '">Classe et sorts</button><button data-bestiaire="panoplies">Bestiaire</button></div>';
  const [att, sort] = SORTS[classeDe()];
  const icoSort = (q) => ico('sort-' + modeleDe(classeDe(), S_.perso.look) + '-' + q); /* (le perso en train d'attaquer ou de lancer son sort, selon sa classe et son apparence) */
  const sorts = '<div class="art">' + icoSort('attaque') + '<div><b>' + att[0] + '</b><div class="puces"><span class="puce">' + picto('degats') + st.deg + ' dégâts</span><span class="puce">toutes les ' + String(st.cadence).replace('.', ',') + ' s</span></div><div class="desc">' + att[1] + '</div></div><div></div></div>' +
    '<div class="art">' + icoSort('sort') + '<div><b>Sort : ' + sort[0] + '</b><div class="desc">' + sort[1] + '</div></div><div></div></div>' +
    '<div class="art">' + (S_.ulti ? '<span class="pic img" style="background:radial-gradient(circle at 50% 40%, #fffaf0, ' + ULTIS[S_.ulti].teinte + ')"><img src="' + srcUlti(S_.ulti) + '" alt=""></span>' : ico('ulti-zone' + sufUlti())) + '<div><b>' + (S_.ulti ? 'Ulti : ' + nomUlti(S_.ulti) : 'Ulti') + '</b><div class="desc">' + (S_.ulti ? ULTIS[S_.ulti].desc + ' Recharge ' + RECHARGE_ULTI + ' s.' : l >= NIV_ULTI ? 'Débloqué : à choisir une fois pour toutes.' : 'Se débloque au niveau ' + NIV_ULTI + '.') + '</div></div><div class="act"><button class="btn discret" data-voir-ulti>' + (S_.ulti || l < NIV_ULTI ? 'Voir' : 'Choisir') + '</button></div></div>';
  if (persoOnglet === 'sorts') { ouvrirModale('perso', tete + '<div class="fp-sorts">' + blocClasse() + '<h4 class="fc-sorts">Tes sorts</h4>' + sorts + '</div>'); return; }
  /* a gauche : le perso au milieu de ses 7 emplacements, et ses caracteristiques */
  const slot = (e) => { const id = S_.equip[e], o = id && obj(id), mieux = sacL.some((k) => obj(k).emp === e && comparer(k).mieux), neuf = sacL.some((k) => obj(k).emp === e && persoNeufs[k]);
    return '<button class="fp-slot' + (o ? '' : ' vide') + (o && o.rare ? ' rare' : '') + (o && o.leg ? ' leg' : '') + (id && id === persoSel ? ' choisi' : '') + '" data-fp-slot="' + e + '" data-info="' + (o ? echapper(o.nom) : NOMS_EMP[e] + ' : vide') + '">' + (o ? '<img src="assets/icones/' + iconeObjet(id) + '.png?v=' + VERSION_MODELES + '" alt="">' : '<span>' + NOMS_EMP[e] + '</span>') +
      (mieux ? '<i class="fp-mieux">Up</i>' : neuf ? '<i class="fp-n">N</i>' : '') + '<small>' + NOMS_EMP[e] + '</small></button>'; };
  const virg = (x) => String(x).replace('.', ',');
  const carac = [['vita', 'PV', fmt(st.pvMax), c.vita ? '+' + c.vita : ''], ['degats', 'Dégâts', st.deg, c.puissance ? '+' + c.puissance + ' %' : ''], ['cadence', 'Attaque', virg(st.cadence) + ' s', c.agilite ? '-' + Math.round(100 - 100 / (1 + c.agilite / 100)) + ' %' : ''], ['portee', 'Portée', (st.portee / S) + (st.portee / S > 1 ? ' cases' : ' case'), ''],
    ['puissance', 'Puissance', '+' + c.puissance + ' %', ''], ['agilite', 'Agilité', '+' + c.agilite + ' %', ''], ['sagesse', 'Sagesse', '+' + c.sagesse + ' %', ''], ['prospection', 'Prospection', '+' + c.prospection + ' %', '']];
  const gauche = '<div class="fp-bloc"><h3>Équipement <small>touche une case</small></h3><div class="fp-poupee">' +
    ['coiffe', 'cape', 'amulette'].map((e, k) => '<div style="grid-column:1;grid-row:' + (k + 1) + '">' + slot(e) + '</div>').join('') +
    '<div class="fp-perso"><img src="' + portraitPerso() + '" alt=""></div>' +
    ['anneau', 'ceinture', 'bottes'].map((e, k) => '<div style="grid-column:3;grid-row:' + (k + 1) + '">' + slot(e) + '</div>').join('') +
    '<div class="fp-arme">' + slot('arme') + '</div></div>' +
    '<div class="fp-carac">' + carac.map(([k, n, v, bo]) => '<button class="fp-cr' + (persoCarac === k ? ' choisi' : '') + '" data-fp-carac="' + k + '"><span class="rond" style="background:' + PICTOS[k][0] + '">' + picto(k, '#fff') + '</span><span class="nom">' + n + '</span><b>' + v + '</b></button>').join('') + '</div>' + /* (le detail des bonus est dans l'explication, au toucher) */
    (persoCarac ? expliquerCarac(persoCarac, st) : '<p class="fp-astuce">Touche une caractéristique pour savoir à quoi elle sert.</p>') + '</div>';
  /* au milieu : la piece choisie, comparee a celle qui est portee */
  let milieu;
  if (!persoSel) milieu = '<div class="fp-bloc fp-detail"><h3>Aucune pièce</h3><p class="fp-aide">Les monstres des vagues lâchent des pièces d\'équipement, chaque boss en lâche une à coup sûr la première fois. Elles arrivent ici.</p><div class="fp-actions"><button class="btn discret" data-bestiaire="panoplies">' + picto('livre') + ' Voir le butin possible</button></div></div>';
  else {
    const k = persoSel, o = obj(k), porte = S_.equip[o.emp], porteeIci = porte === k, q = porte && !porteeIci ? obj(porte) : null, cmp = comparer(k), qj = qualiteJet(k), B = OBJETS[baseObjet(k)];
    const pils = (persoNeufs[k] ? '<span class="fp-pil neuf">nouveau</span>' : '') + (porteeIci ? '<span class="fp-pil porte">portée</span>' : cmp.mieux ? '<span class="fp-pil mieux"><b>Up</b> mieux que la tienne</span>' : '') +
      '<span class="fp-pil' + (niveau(S_.xp) < o.niv ? ' rouge' : '') + '">niveau ' + o.niv + '</span>' + (o.rare ? '<span class="fp-pil rare">★ rare</span>' : '') + (o.leg ? '<span class="fp-pil leg">✦ légendaire</span>' : '') + (o.arme ? '<span class="fp-pil">arme du ' + nomClasse(o.classe) + '</span>' : !o.leg ? '<span class="fp-pil">panoplie ' + PANOS[o.pano].de + '</span>' : '') +
      (S_.sac[k] > 1 ? '<span class="fp-pil">×' + S_.sac[k] + '</span>' : '');
    const cles = [...new Set(Object.keys(o.stats).concat(q ? Object.keys(q.stats) : []))];
    const ligne = (cc) => { const v = o.stats[cc] || 0, w = q ? q.stats[cc] || 0 : null, [fa, fb] = B.stats[cc] ? fourchette(B.stats[cc]) : [v, v], u = CARACS[cc][1].trim().startsWith('%') ? ' %' : '';
      return '<div class="fp-ligne"><span>' + CARACS[cc][2] + ' ' + CARACS[cc][0] + '<small>' + (B.stats[cc] ? 'de ' + fa + ' à ' + fb + u : '') + '</small></span><span><b>+' + v + u + '</b></span>' + (q ? '<span>+' + w + u + '</span><span class="' + (v > w ? 'fp-gain' : v < w ? 'fp-perte' : '') + '">' + (v > w ? '▲ +' + (v - w) : v < w ? '▼ ' + (v - w) : '=') + u + '</span>' : '') + '</div>'; };
    const table = '<div class="fp-compare' + (q ? '' : ' seule') + '"><div class="fp-ligne th"><span>Caractéristique</span><span>' + (porteeIci ? 'Portée' : 'Elle') + '</span>' + (q ? '<span>Ta pièce</span><span>Écart</span>' : '') + '</div>' + cles.map(ligne).join('') + '</div>';
    const jet = '<div class="fp-jet"><span>Jet <b>' + nomJet(qj) + '</b></span><div class="barre"><i style="width:' + Math.round(qj * 100) + '%"></i></div><small>' + Math.round(qj * 100) + ' %</small></div>';
    const nr = runes(), maxi = qj >= 0.999, aRunes = nr.forge > 0 || nr.parfaite > 0; /* la forgemagie : elle se fait a l'atelier (le lien est ici) */
    const forge = (niv('forge') || aRunes || niveau(S_.xp) >= NIV_ARENE) ? '<div class="fp-forge"><span class="fp-forge-t">Forgemagie</span><small>' + (maxi ? 'Jet maximum.' : niv('forge') ? 'Tes runes : ' + (nr.forge || 0) + ' de forgemagie, ' + (nr.parfaite || 0) + ' parfaite' + ((nr.parfaite || 0) > 1 ? 's' : '') + '.' : 'Construis l\'atelier de forgemagie (Améliorer, ' + fmt(100000) + ' kamas) pour utiliser tes runes.') + '</small>' + (niv('forge') && !maxi ? '<button class="btn mini kamas" data-ouvrir-forge>À l\'atelier</button>' : '') + '</div>' : '';
    const pano = !o.leg && !o.arme ? (() => { const n0 = comptePanos()[o.pano] || 0, n1 = porteeIci ? n0 : n0 + (q && q.pano === o.pano && !q.leg ? 0 : 1);
      return '<div class="fp-pano">Panoplie ' + PANOS[o.pano].de + ' : ' + (porteeIci ? n0 + '/6 pièces portées.' : 'tu passes à ' + Math.min(6, n1) + '/6 pièces.') + (PALIERS_PANO.find(([m]) => m > n1) ? ' À ' + PALIERS_PANO.find(([m]) => m > n1)[0] + ' : ' + texteBonus(PALIERS_PANO.find(([m]) => m > n1)[1](o.pano)) + '.' : ' Panoplie complète !') + '</div>'; })() : '';
    const raison = !cmp.ok ? (o.classe && o.classe !== classeDe() ? 'Arme du ' + nomClasse(o.classe) + ' : tu peux seulement la revendre.' : 'Il faut le niveau ' + o.niv + ' pour la porter.') : '';
    const actions = porteeIci ? '<div class="fp-actions"><button class="btn discret" data-retirer="' + o.emp + '">Retirer</button></div><p class="fp-aide">Touche une pièce du sac pour la comparer à celle-ci.</p>'
      : '<div class="fp-actions"><button class="btn kamas fp-principal" data-equiper="' + k + '"' + (cmp.ok ? '' : ' disabled') + '>Équiper</button><button class="btn discret" data-revendre-objet="' + k + '">Revendre ' + fmt(reventeObjet(k)) + ' ' + KAMA + '</button></div>' +
        '<p class="fp-aide">' + (raison || (q ? q.nom + ' retournera dans ton sac.' : 'L\'emplacement ' + NOMS_EMP[o.emp].toLowerCase() + ' est vide.')) + '</p>';
    milieu = '<div class="fp-bloc fp-detail"><div class="fp-entete"><span class="fp-grosse' + (o.rare ? ' rare' : '') + (o.leg ? ' leg' : '') + '"><img src="assets/icones/' + iconeObjet(k) + '.png?v=' + VERSION_MODELES + '" alt=""></span><div><div class="fp-nom">' + o.nom + '</div><div class="fp-pils">' + pils + '</div></div></div>' +
      jet + forge + table + (o.pouvoir ? '<div class="fp-pouvoir">✦ ' + o.pouvoir + '</div>' : '') + pano + actions + '</div>';
  }
  /* a droite : le sac en cases, et les panoplies */
  const presents = EMPLACEMENTS_PERSO.map(([e]) => e).filter((e) => sacL.some((k) => obj(k).emp === e));
  if (persoFiltre !== 'tout' && !presents.includes(persoFiltre) && !NOMS_EMP[persoFiltre]) persoFiltre = 'tout';
  const vus = sacL.filter((k) => persoFiltre === 'tout' || obj(k).emp === persoFiltre).sort((x, y) => (persoEmp ? (obj(y).emp === persoEmp) - (obj(x).emp === persoEmp) : 0) || ordre(x, y)), nCases = Math.max(20, Math.ceil((vus.length + 1) / 5) * 5);
  const cases = vus.map((k) => { const o = obj(k); return '<button class="fp-case plein' + (k === persoSel ? ' choisi' : '') + (persoEmp && o.emp === persoEmp ? ' meme' : '') + (o.rare ? ' rare' : '') + (o.leg ? ' leg' : '') + (persoNeufs[k] ? ' nouveau' : '') + (comparer(k).ok ? '' : ' verrou') + '" data-fp-sel="' + k + '" data-info="' + echapper(o.nom) + '"><img src="assets/icones/' + iconeObjet(k) + '.png?v=' + VERSION_MODELES + '" alt="">' +
    (S_.sac[k] > 1 ? '<span class="fp-nb">×' + S_.sac[k] + '</span>' : '') + (comparer(k).mieux ? '<i class="fp-mieux">Up</i>' : '') + '</button>'; }).join('') + Array.from({ length: nCases - vus.length }, () => '<span class="fp-case"></span>').join('');
  const panos = Object.entries(comptePanos()); const droite = '<div class="fp-bloc"><h3>Sac <small>' + sacL.length + ' pièce' + (sacL.length > 1 ? 's' : '') + '</small></h3>' +
    '<div class="fp-filtres">' + [['tout', 'Tout', sacL.length]].concat(presents.map((e) => [e, PLURIELS_EMP[e], sacL.filter((k) => obj(k).emp === e).length])).map(([f, t, n]) => '<button data-fp-filtre="' + f + '" aria-pressed="' + (persoFiltre === f) + '">' + t + ' <small>' + n + '</small></button>').join('') + '</div>' +
    '<div class="fp-sac">' + cases + '</div><div class="fp-legende"><span><i class="fp-n">N</i> nouvelle pièce</span><span><i class="fp-mieux">Up</i> mieux que celle que tu portes</span><span class="r">rare ★</span><span class="l">légendaire</span></div>' +
    (panos.length ? '<h4>Panoplies portées</h4>' + panos.map(([kk, n]) => blocPano(+kk, n)).join('') : '') + '</div>';
  ouvrirModale('perso', tete + '<div class="fp-corps">' + gauche + milieu + droite + '</div>');
}
function ouvrirTofu(p, sauvage) {
  const titre = sauvage ? 'Un Tofu sauvage dans l\'herbe' : 'Un Tofu picore ton ' + PAR_ID[p.c].nom, chance = sauvage ? CHANCE_SAUVAGE : CHANCE_CAPTURE;
  ouvrirModale('tofu', entete(titre) + '<div class="ligne"><div><b>Le chasser</b><small>Gratuit, ton perso le chasse à distance' + (classeDe() === 'cra' ? ', d\'une flèche' : '') + ' : il s\'envole.</small></div><button class="btn discret" ' + (sauvage ? 'data-chasser-sauvage="1"' : 'data-chasser="' + p.id + '"') + '>Chasser</button></div>' +
    (S_.tofus >= capaciteVoliere() ? '<div class="ligne"><div><b>Le capturer au filet</b><small>Ta volière est pleine (' + S_.tofus + '/' + capaciteVoliere() + ' places). Agrandis-la à l\'HDV, onglet Améliorer.</small></div><button class="btn kamas" disabled>Pleine</button></div>' :
    '<div class="ligne"><div><b>Le capturer au filet</b><small>' + Math.round(chance * 100) + ' % de chance, le filet est perdu dans tous les cas (' + S_.filets + ' en grange). Capturé, il va à la volière (' + S_.tofus + '/' + capaciteVoliere() + ' places) et donne des plumes.</small></div><button class="btn kamas" ' + (sauvage ? 'data-capturer-sauvage="1"' : 'data-capturer="' + p.id + '"') + '>Capturer</button></div>'));
}
function ouvrirPlanter(p, dispo) {
  ouvrirModale('planter', entete('Que planter ?') + '<div class="grille-graines">' + dispo.map((c) => carteGraine(c, 'data-planter="' + c.id + '" data-case="' + p.id + '"', true)).join('') + '</div>');
}
function ouvrirVoliere() {
  const ameliorer = lignesAmelio(['voliere'], 'Agrandir la volière');
  const max = S_.tofus * plumesParTofu(), v = S_.voliere;
  ouvrirModale('voliere', entete('Volière à Tofus') + (degatsBat('voliere') ? artPv('voliere') : '') + (S_.tofus ?
    '<div class="ligne"><div><b>' + S_.tofus + ' Tofu' + (S_.tofus > 1 ? 's' : '') + ' sur ' + capaciteVoliere() + ' places</b><small>Chacun donne une Plume de Tofu toutes les ' + dureeLisible(CADENCE_PLUME) + ', ' + plumesParTofu() + ' en attente au plus.</small></div></div>' +
    '<div class="ligne"><div><b>Plumes prêtes</b><small>' + v.plumes + '/' + max + (v.plumes < max ? ', la prochaine dans ' + dureeLisible((CADENCE_PLUME - v.accu) / S_.tofus) : ', la volière est pleine') + '. Elles se vendent à l\'HDV.</small></div><button class="btn kamas" data-plumes' + (v.plumes ? '' : ' disabled') + '>Ramasser</button></div>' :
    '<p style="font-size:.8rem;font-weight:600">La volière est vide. Achète des filets de capture à l\'HDV : quand un Tofu picore un champ ou se pose dans l\'herbe, touche-le pour l\'attraper.</p>') +
    '<p style="font-size:.74rem;font-weight:600;margin:8px 0 0;color:#5b5240">Plus tard, l\'Osamodas pourra invoquer ses Tofus en combat.</p>' + ameliorer);
}
function ouvrirParcelle(p) {
  const rendu = Math.round((p.prixPaye || 50) / 2), culture = p.c ? PAR_ID[p.c].nom : null;
  ouvrirModale('parcelle', entete('Parcelle labourée') +
    '<div class="art">' + ico(p.c || 'ble') + '<div><b>Déplacer</b><div class="desc">Elle part sur une case d\'herbe libre' + (culture ? ', avec ton ' + culture + ' et son arrosage' : '') + '. Gratuit.</div></div><div class="act"><button class="btn kamas" data-deplacer="' + p.id + '">Déplacer</button></div></div>' +
    '<div class="art">' + ico('cloture') + '<div><b>Remettre en herbe</b><div class="desc">La moitié du prix payé t\'est rendue' + (culture ? ', la culture est perdue' : '') + '.</div></div><div class="act"><small>+' + fmt(rendu) + ' ' + KAMA + '</small><button class="btn" data-herbe="' + p.id + '">Remettre en herbe</button></div></div>');
}
function ouvrirConstruire(p) {
  const cout = PRIX_PARCELLE[Math.min(S_.parcellesAchetees, PRIX_PARCELLE.length - 1)]; const plein = parcelles() >= quotaParcelles();
  ouvrirModale('construire', entete('Case d\'herbe libre') + '<p style="font-size:.8rem;font-weight:600">Parcelles : ' + parcelles() + ' sur ' + quotaParcelles() + '. Tu laboures où tu veux, dans la limite de ton quota. ' + (plein ? 'Quota atteint : déplace une parcelle (Aménager) ou achète un terrain.' : '') + '</p>' +
    '<div class="ligne"><div><b>Labourer une parcelle</b><small>Pour planter une culture de plus.</small></div><button class="btn kamas" data-parcelle="' + p.id + '"' + (plein || S_.kamas < cout ? ' disabled' : '') + '>' + fmt(cout) + ' ' + KAMA + '</button></div>' +
    (() => { const n = nbTours(), ct = PRIX_TOUR[Math.min(n, PRIX_TOUR.length - 1)], bloque = niveau(S_.xp) < NIV_TOUR, max = n >= TOURS_MAX;
      return '<div class="ligne"><div><b>Tour de défense</b><small>' + (bloque ? 'Au niveau ' + NIV_TOUR + ' de Paysan.' : max ? 'Tu as déjà tes ' + TOURS_MAX + ' tours.' : 'Tire seule sur les voleurs et les monstres (' + n + '/' + TOURS_MAX + ' tours), avec les flèches de ta réserve.') + '</small></div><button class="btn kamas" data-tour="' + p.id + '"' + (bloque || max || S_.kamas < ct ? ' disabled' : '') + '>' + (bloque ? picto('cadenas') : fmt(ct) + ' ' + KAMA) + '</button></div>'; })());
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.id === 'b-journal') { basculerChat(); return; }
  if (b.dataset.bestiaire) { ouvrirBestiaire(b.dataset.bestiaire); return; }
  if (b.id === 'b-chat-fermer') { basculerChat(false); return; }
  if (b.dataset.revoirCombat) { revoirCombat(+b.dataset.revoirCombat); return; }
  if (b.id === 'b-bestiaire') { ouvrirBestiaire.retour = null; ouvrirBestiaire('monstres'); } else if (b.id === 'b-graine') ouvrirGraines(); else if (b.id === 'b-hdv') ouvrirHdv(); else if (b.id === 'b-amelio') ouvrirHdv('ameliorer'); else if (b.id === 'b-grange') ouvrirGrange();
  else if (b.hasAttribute('data-carnet')) ouvrirCarnet();
  else if (b.dataset.relire) { fermerModale(); ouvrirLecon(b.dataset.relire, true); }
  else if (b.hasAttribute('data-lecons-bascule')) { if (S_.leconsOff) delete S_.leconsOff; else S_.leconsOff = true; sauver(); ouvrirCarnet(); }
  else if (b.dataset.sexeOpt) { if (b.dataset.sexeOpt === 'f') S_.perso.sexe = 'f'; else delete S_.perso.sexe; sauver(); const m = modeleDe(classeDe(), S_.perso.look); assurerLook(m).then(() => { rhabiller(); rendreHaut(); }); $('b-options').click(); }
  else if (b.dataset.lookOpt) { S_.perso.look = b.dataset.lookOpt; sauver(); const m = modeleDe('iop', S_.perso.look); assurerLook(m).then(() => rhabiller()); $('b-options').click(); }
  else if (b.id === 'b-plein') { pleinEcran(); return; }
  else if (b.id === 'b-plein-opt') { pleinEcran(enPleinEcran()); setTimeout(() => $('b-options').click(), 400); return; }
  else if (b.id === 'b-options') { ouvrirModale('options', entete('Options') + (DOIGT ? '<div class="art">' + ico('apercu') + '<div><b>Plein écran</b><div class="desc">Cache les barres du navigateur. Couché, le téléphone reste à l\'horizontale.</div></div><div class="act"><button class="btn discret" id="b-plein-opt">' + (enPleinEcran() ? 'Quitter le plein écran' : 'Passer en plein écran') + '</button></div></div>' : '') + '<div class="hdv-section">Ton personnage</div><div class="sexes">' + [['m', 'Masculin'], ['f', 'Féminin']].map(([v, t]) => '<button class="sexe" data-sexe-opt="' + v + '" aria-pressed="' + (sexeDe() === v) + '">' + t + '</button>').join('') + '</div>' + (classeDe() === 'iop' && sexeDe() === 'm' ? '<div class="hdv-section">L\'apparence de ton Iop</div><div class="looks-grille">' + LOOKS_IOP.map(([id, nom]) => '<button class="look" data-look-opt="' + id + '" aria-pressed="' + ((S_.perso.look || 'classique') === id) + '"><img src="assets/icones/iop-look-' + id + '.png?v=' + VERSION_MODELES + '" alt=""><b>' + nom + '</b></button>').join('') + '</div>' : '') + '<div class="hdv-section">Le son et la musique</div><div class="art">' + ico('cloche') + '<div><b>Les sons</b><div class="desc">La faux dans le blé, l\'eau, les coups, les bêê des Bouftous, les fêtes.</div><label class="curseur-son" for="vol-sons">Volume <input type="range" id="vol-sons" min="0" max="100" step="5" value="' + volSons() + '"></label></div><div class="act"><button class="btn discret" id="b-son">' + (sonActif() ? 'Couper le son' : 'Remettre le son') + '</button></div></div>' +
      '<div class="art">' + ico('cloche') + '<div><b>La musique de fond</b><div class="desc">Elle tourne sans fin et ne joue jamais deux fois la même chose.</div><div class="musiques-opt">' + MUSIQUES_JEU.map(([id, nom, d]) => '<button class="sexe" data-musique-opt="' + id + '" aria-pressed="' + (musiqueChoisie() === id) + '" data-info="' + d + '">' + nom + '</button>').join('') + '</div><label class="curseur-son" for="vol-musique">Volume <input type="range" id="vol-musique" min="0" max="100" step="5" value="' + volMusique() + '"></label></div><div></div></div><div class="art">' + ico('etal') + '<div><b>Les objectifs de Pépito</b><div class="desc">Le petit panneau en haut à gauche.</div></div><div class="act"><button class="btn discret" id="b-objectifs">' + (S_.objCache ? 'Les afficher' : 'Les masquer') + '</button></div></div><div class="art">' + ico('apercu') + '<div><b>Graphismes</b><div class="desc">' + (graphismes() === 'leger' ? 'Légers : sans ombres ni contours, pour les petits appareils.' : 'Complets : ombres et détails.') + ' Si le jeu rame, passe en légers.</div></div><div class="act"><button class="btn discret" id="b-graphismes">' + (graphismes() === 'leger' ? 'Passer en complets' : 'Passer en légers') + '</button></div></div><div class="art">' + ico('etal') + '<div><b>Le tuto du début</b><div class="desc">Pépito te remontre les bases en ' + ETAPES_TUTO.length + ' étapes.</div></div><div class="act"><button class="btn discret" id="b-tuto">Revoir le tuto</button></div></div><div class="art">' + ico('coffre') + '<div><b>Le carnet de Pépito</b><div class="desc">Ses leçons sur les vagues, les boss, l\'équipement, l\'élevage... à relire quand tu veux.</div></div><div class="act"><button class="btn discret" data-carnet>Ouvrir</button></div></div><div class="art">' + ico('pelle') + '<div><b>Comment jouer</b><div class="desc">' + $('aide').textContent + ' Touche plusieurs bulles d\'affilée : ton paysan enchaîne les tâches. Glisse pour déplacer la vue, molette pour zoomer.</div></div><div></div></div><div class="art">' + ico('coffre') + '<div><b>Ton compte</b><div class="desc">' + infoCompte() + '</div></div><div class="act">' + (ENLIGNE && (enLigneSv.compte || jetonInvite()) ? '<button class="btn discret" id="b-deconnexion">Se déconnecter</button>' : '') + '</div></div>' +
      '<div class="art">' + ico(S_.perso.sexe === 'f' ? 'feminin-' + S_.perso.classe : S_.perso.classe) + '<div><b>Mes parties</b><div class="desc">Jusqu\'à ' + MAX_PARTIES + ' parties sur ton compte (' + (1 + Object.keys(S_.parties || {}).length) + ' en cours) : change de partie, ou commence une autre classe sans perdre celle-ci.</div></div><div class="act"><button class="btn" id="b-parties">Mes parties</button></div></div>' +
      '<div class="art">' + ico('grange') + '<div><b>Recommencer une ferme</b><div class="desc">' + (ENLIGNE && enLigneSv.compte ? 'Repart de zéro : la nouvelle ferme remplace celle-ci, ici et en ligne.' : 'Efface la sauvegarde de ce navigateur et repart de zéro.') + '</div></div><div class="act"><button class="btn" id="b-reset" style="background:var(--rouge);color:#fff">Recommencer</button></div></div>'); return; }
  else if (b.id === 'b-reset') { ouvrirModale('options', entete('Recommencer ?') + '<div class="confirme"><div class="gros" style="background:#fde3df"><img src="assets/icones/grange.png" alt=""></div><p>Une ferme toute neuve : ' + (ENLIGNE && enLigneSv.compte ? 'celle-ci sera effacée, ici et en ligne, pour de bon.' : 'la sauvegarde de ce navigateur sera effacée, pour de bon.') + (Object.keys(S_.parties || {}).length ? ' Tes autres parties ne bougent pas.' : '') + '</p><div class="boutons"><button class="btn discret" data-fermer>Garder ma ferme</button><button class="btn" id="b-reset-ok" style="background:var(--rouge);color:#fff">Tout effacer</button></div></div>'); return; }
  else if (b.id === 'b-parties') { sauver(); location.reload(); return; } /* (l'accueil : la liste des parties) */
  else if (b.id === 'b-reset-ok') { { const nv = sansPartieActive(S_); if (nv) { ecrirePartie(nv, false); return; } } /* (les autres parties restent) */ enLigneSv.ecraser = !!enLigneSv.compte; enLigneSv.sale = false; sauverMeta(); localStorage.removeItem(CLE); location.reload(); return; }
  else if (b.id === 'b-nuage-recharger') { enLigneSv.version = 0; enLigneSv.sale = false; sauverMeta(); location.reload(); return; } /* au rechargement, la version en ligne gagne */
  else if (b.id === 'b-nuage-garder') { enLigneSv.bloque = false; enLigneSv.ecraser = true; enLigneSv.sale = true; fermerModale(); nuageEnvoyer(); toast('Cette version de ta ferme remplace l\u2019autre.'); return; }
  else if (b.id === 'b-deconnexion') { fermerModale(); deconnecter(); return; }
  else if (b.id === 'b-tuto') { fermerModale(); if (!combat) demarrerTuto(1, true); else toast('Pendant une vague, on se bat : le tuto attendra.'); return; }
  else if (b.hasAttribute('data-fermer')) fermerModale();
  else if (b.dataset.graine) { S_.graine = b.dataset.graine; rendreHaut(); fermerModale(); }
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
  else if (b.dataset.pepito) { const k = b.dataset.pepito; S_.pepito = S_.pepito || {}; S_.pepito[k] = !pepitoTire(k); toast('PÉPITO-TRON : ' + (pepitoTire(k) ? 'cible autorisée.' : 'cible ignorée.') + (k === 'sauvage' ? ' (le Tofu sauvage)' : ' (les Tofus des champs)'), 'or'); sauver(); ouvrirEpouvantail(); }
  else if (b.dataset.entractePot) boireEntracte(b.dataset.entractePot);
  else if (b.dataset.entracteManger) mangerEntracte(b.dataset.entracteManger);
  else if (b.dataset.bonusArene) prendreBonusArene(b.dataset.bonusArene);
  else if (b.hasAttribute('data-entracte-suite')) tempsSuivant();
  else if (b.dataset.boire) boirePot(b.dataset.boire);
  else if (b.dataset.geleeAchat) ACTIONS.acheterGelee(b.dataset.geleeAchat);
  else if (b.dataset.geleeNourrir) { if (b.dataset.geleeNourrir === 'tout') ACTIONS.nourrirGelees(); else ACTIONS.nourrirGelee(parseInt(b.dataset.geleeNourrir, 10)); }
  else if (b.hasAttribute('data-gelee-ramasser')) ACTIONS.ramasserPots();
  else if (b.hasAttribute('data-gelee-croiser')) ACTIONS.croiserGelees();
  else if (b.hasAttribute('data-geliere')) ouvrirGeliere();
  else if (b.id === 'b-vie' || b.id === 'b-pots') { if (combat) toast('Les pots de gelée se boivent entre les vagues.'); else ouvrirPots(); }
  else if (b.dataset.filets) ACTIONS.acheterFilets(parseInt(b.dataset.filets, 10));
  else if (b.dataset.fleches) ACTIONS.acheterFleches(parseInt(b.dataset.fleches, 10));
  else if (b.hasAttribute('data-recharger')) { ACTIONS.recharger(); if (raidAnnonce) majRaidAnnonce(); }
  else if (b.hasAttribute('data-raid-go')) { if (raidAnnonce && !combat) lancerRaid(); } /* (la simu VSA tout de suite, sans attendre les 30 s) */
  else if (b.hasAttribute('data-remplir')) { ACTIONS.remplir(); ouvrirPuits(); }
  else if (b.dataset.capturer) { const p = S_.cases.find((c) => c.id === b.dataset.capturer); fermerModale(); if (p) allerPuis(p, () => ACTIONS.capturer(p)); } /* le filet, lui, se lance de pres */
  else if (b.dataset.chasser) { const p = S_.cases.find((c) => c.id === b.dataset.chasser); fermerModale(); if (p) chasserDeLoin(p, () => { if (p.tofu) ACTIONS.chasser(p); }); }
  else if (b.dataset.parcelle) ACTIONS.construireParcelle(b.dataset.parcelle);
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
  else if (b.id === 'b-objectifs') { S_.objCache = !S_.objCache; rendreObjectif(); fermerModale(); }
  else if (b.id === 'b-perso') ouvrirPerso();
  else if (b.dataset.slot) ouvrirPerso(b.getAttribute('aria-pressed') === 'true' ? null : b.dataset.slot);
  else if (b.dataset.fpSel) ouvrirPerso(b.dataset.fpSel);
  else if (b.dataset.fpSlot) { const k = S_.equip[b.dataset.fpSlot]; persoFiltre = 'tout'; persoEmp = b.dataset.fpSlot; ouvrirPerso(k || b.dataset.fpSlot); }
  else if (b.dataset.fpFiltre) { persoFiltre = b.dataset.fpFiltre; persoEmp = null; ouvrirPerso(); }
  else if (b.dataset.fpOnglet) { persoOnglet = b.dataset.fpOnglet; ouvrirPerso(); }
  else if (b.dataset.fpCarac) { persoCarac = persoCarac === b.dataset.fpCarac ? null : b.dataset.fpCarac; ouvrirPerso(); }
  else if (b.dataset.persoSel) ouvrirPerso(b.dataset.persoSel);
  else if (b.dataset.persoSlot !== undefined) ouvrirPerso(b.dataset.persoSlot || null);
  else if (b.dataset.forger) { const [t, k] = b.dataset.forger.split('|'); if (t === 'forge') { ouvrirChoixForge(k); return; } const cle = forgerObjet(k, t); if (modaleOuverte === 'forge') ouvrirForge(); else ouvrirPerso(cle || k); } /* (la rune de forgemagie demande d'abord la caracteristique) */
  else if (b.dataset.forgerCarac) { const [k, c] = b.dataset.forgerCarac.split('|'); forgerObjet(k, 'forge', c); ouvrirForge(); }
  else if (b.hasAttribute('data-forge-retour')) ouvrirForge();
  else if (b.hasAttribute('data-ouvrir-forge')) ouvrirForge();
  else if (b.dataset.equiper) ACTIONS.equiper(b.dataset.equiper);
  else if (b.dataset.retirer) ACTIONS.retirer(b.dataset.retirer);
  else if (b.dataset.revendreObjet) ACTIONS.revendreObjet(b.dataset.revendreObjet);
  else if (b.dataset.reconstruire) { if (modaleOuverte === 'vague-fin') ACTIONS.reparerDansBilan([b.dataset.reconstruire]); else ACTIONS.reconstruire(b.dataset.reconstruire); }
  else if (b.id === 'b-amenager') { mode = mode ? null : 'choisir'; aDeplacer = null; majBandeau(); rendreHaut(); }
  else if (b.hasAttribute('data-enclos-auto')) ACTIONS.enclosAuto();
  else if (b.id === 'b-enclos-bouger') { mode = mode === 'enclosDeplacer' ? 'enclos' : 'enclosDeplacer'; aDeplacer = null; majBandeau(); rendreHaut(); }
  else if (b.hasAttribute('data-amenager-enclos')) { fermerModale(); mode = 'enclos'; aDeplacer = null; majBandeau(); rendreHaut(); }
  else if (b.id === 'b-tourner') ACTIONS.tournerBatiment();
  else if (b.id === 'b-ranger') ACTIONS.rangerDeco();
  else if (b.id === 'b-mes-decos' || b.hasAttribute('data-mes-decos')) ouvrirDecos();
  else if (b.dataset.poserDeco) { fermerModale(); if (nbDecos(b.dataset.poserDeco)) { aPoser = b.dataset.poserDeco; aDeplacer = null; mode = 'poserDeco'; assurerDecos(); majBandeau(); rendreHaut(); } }
  else if (b.dataset.decoAchat) ACTIONS.acheterDeco(b.dataset.decoAchat);
  else if (b.id === 'b-terminer') { mode = null; aDeplacer = null; majBandeau(); rendreHaut(); }
  else if (b.id === 'b-vagues' || b.hasAttribute('data-voir-vagues')) ouvrirVagues();
  else if (b.hasAttribute('data-lancer-vague')) lancerVague();
  else if (b.hasAttribute('data-rejouer-boss')) lancerVague(+b.dataset.rejouerBoss);
  else if (b.hasAttribute('data-rejouer-dur')) lancerVague(+b.dataset.rejouerDur, true); /* la revanche difficile */
  else if (b.id === 'b-rentrer') rentrerFerme();
  else if (b.hasAttribute('data-montgolfiere')) actionMontgolfiere(b.dataset.montgolfiere);
  else if (b.hasAttribute('data-cas')) actionCasino(b);
  else if (b.hasAttribute('data-ardoise')) actionArdoise(b.dataset.ardoise);
  else if (b.hasAttribute('data-manger')) { const id = b.dataset.manger; if ((S_.grange[id] || 0) > 0 && !(S_.mange || {})[id]) { S_.grange[id]--; S_.mange = S_.mange || {}; S_.mange[id] = true; son('manger'); toast('Miam ! ' + PAR_ID[id].nom + ' : ' + PAR_ID[id].mange.txt + ' pendant ta prochaine vague.', 'or'); sauver(); rendreGrange(); ouvrirVagues(); } }
  else if (b.id === 'b-sort') lancerSort();
  else if (b.id === 'b-ulti') lancerUlti();
  else if (b.id === 'b-leg-coiffe') lancerLeg('coiffe');
  else if (b.id === 'b-leg-arme') lancerLeg('arme');
  else if (b.hasAttribute('data-voir-ulti')) ouvrirUlti();
  else if (b.dataset.choisirUlti) choisirUlti(b.dataset.choisirUlti);
  else if (b.dataset.confirmerUlti) choisirUlti(b.dataset.confirmerUlti, true);
  else if (b.id === 'b-fuir') { if (combat && combat.arene) finArene(true); else if (!(combat && combat.deroute != null)) finVague(false, true); } /* (a terre, on ne fuit plus) */
  else if (b.dataset.capturerSauvage) { const p = S_.sauvage && S_.cases.find((c) => c.id === S_.sauvage.id); fermerModale(); if (p) allerPuis(p, () => ACTIONS.capturerSauvage()); }
  else if (b.dataset.chasserSauvage) { const p = S_.sauvage && S_.cases.find((c) => c.id === S_.sauvage.id); fermerModale(); if (p) chasserDeLoin(p, () => { if (S_.sauvage) ACTIONS.chasserSauvage(); }); }
  else return;
  sauver();
});

