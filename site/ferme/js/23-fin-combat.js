'use strict';
/* LA DEROUTE (12/10/2026, « que la mort soit plus punitive : les monstres ont 10/15 secondes pour attaquer tes batiments, ils repartent et tu dois
   reconstruire », Mathieu) : a 0 PV, le perso tombe ; pendant 12 s, tous les monstres s'en prennent aux batiments (le boss aussi, sans ses sorts), les
   tours et l'arbalete tirent toujours ; puis ils repartent, la vague est perdue (champ saccage et 1 h de repos, comme avant) et il faut reparer */
const DUREE_DEROUTE = 12;
function commencerDeroute() {
  const c = combat; if (!c || c.fin || c.deroute != null) return;
  c.deroute = DUREE_DEROUTE; c.pv = 0; chemin = []; arrivee = null; annulerVisee();
  if (c.invoc) { jeter(c.invoc.m); if (c.invoc.barre) c.invoc.barre.remove(); c.invoc = null; }
  const u = paysanMesh.userData; u.attaque = null; u.charge = true; paysanMesh.rotation.x = -1.3; /* il tombe a la renverse */
  c.monstres.forEach((o) => { o.casseur = true; o.aggro = false; o.bat = null; o.batT = 0; });
  pouf(paysanMesh.position.x, paysanMesh.position.y, paysanMesh.position.z, 2.4, '#e2413a'); son('touche', null, 5);
  toast('Ton perso est à terre ! Les monstres saccagent ta ferme pendant ' + DUREE_DEROUTE + ' s, puis ils repartent. Tes tours et ton arbalète tirent toujours.', 'alerte');
}
function majCombat(dt, s) {
  if (!combat) { ANNEAU.visible = false; return; }
  const c = combat;
  if (c.fin) return;
  if (c.regen && c.deroute == null && c.pv > 0) c.pv = Math.min(c.pvMax, c.pv + c.pvMax * c.regen * dt); /* le pot de Menthe */
  if (c.deroute != null) { /* a terre : le compte a rebours du saccage */
    c.deroute -= dt;
    if (c.deroute <= 0 || (!c.file.length && !c.monstres.some((o) => o.etat === 'actif' || o.etat === 'grimpe'))) {
      c.monstres.forEach((o) => { if (o.etat === 'actif' || o.etat === 'grimpe') { pouf(o.x, o.m.position.y, o.z, 1.6, '#d8c8a8'); o.etat = 'mort'; o.t = 0; } }); /* ils repartent */
      finVague(false); return;
    }
  }
  c.attente -= dt; c.duree = (c.duree || 0) + dt;
  if (c.arene && c.file.length && c.attente <= 0) { for (let i = 0; i < 3 && c.file.length; i++) apparaitre(c.file.shift()); c.attente = 2.5; } /* l'Arene : ils sortent des herses trois par trois */
  else if (c.raid && c.file.length && c.attente <= 0) { apparaitre(c.file.shift()); c.attente = 1; } /* la simu VSA : un par seconde, chacun par sa case rouge, tout autour de la ferme (18/10/2026) */
  else if (c.file.length && c.attente <= 0) { /* toute la vague tombe d'un coup */ const boss = c.file.find((t) => MONSTRES[t].boss); while (c.file.length) apparaitre(c.file.shift()); if (boss) toast(leNom(MONSTRES[boss]) + ' en personne débarque avec sa troupe !', 'alerte'); }
  c.monstres.forEach((o) => majMonstre(o, dt, s)); if (c.fin) return;
  majFumees(dt, s); majAfflictions(dt); if (combat !== c || c.fin) return;
  c.monstres = c.monstres.filter((o) => !(o.etat === 'mort' && !o.m.parent));
  if (c.deroute == null) { majInvoc(dt); majLegendaire(dt); } if (combat !== c || c.fin) return; if (c.deroute == null) majPerso(dt); if (combat !== c || c.fin) return; majVisee(s);
  const cb = c.cible && c.cible.etat === 'actif' ? c.cible : null; ANNEAU.visible = !!cb;
  if (cb) { ANNEAU.position.set(cb.x, cb.m.position.y + 0.04, cb.z); const rA = cb.d.distance ? Math.max(1, cb.d.ombre * 0.75) * 0.64 : cb.d.portee * (cb.allonge || 1); ANNEAU.scale.setScalar(rA / 0.64 * (1 + Math.sin(s * 6) * 0.04)); }
  /* (16/10/2026, « pour moi sa portee de coup au cac, c'etait le cercle jaune » : pour un monstre au corps a corps, le cercle jaune est maintenant sa portee exacte ; entre dedans, il te frappe) */
  majCombatHud();
  if (c.genre === 'ile' && ileBoss) c.monstres.forEach((o) => { if (o.etat !== 'actif' || o.d.vole) return; const q = bornerIle(o.x, o.z, o.d.boss ? 0.9 : 0.3); o.x = q[0]; o.z = q[1]; }); /* (les monstres aussi restent sur l'ile et butent sur le decor) */
  if (c.genre === 'ile') { c.arene.t += dt; const pas = Math.floor(c.arene.t / ENRAGE_ILE.periode); if (pas > c.arene.pas) { c.arene.pas = pas; const b = c.monstres.find((o) => o.d.boss && o.etat === 'actif');
      const mR = 1 + ENRAGE_ILE.pas * pas; c.monstres.forEach((o) => { if (o.etat === 'mort') return; o.rageM = mR; if (o.deg0 != null && !o.d.boss) o.deg = Math.max(1, Math.round(o.deg0 * mR)); }); /* (sa troupe enrage avec lui) */
      if (b) { b.deg = Math.round(b.deg0 * mR); chiffre('Rage +' + Math.round(ENRAGE_ILE.pas * pas * 100) + ' %', new T.Vector3(b.x, b.m.position.y + b.haut + 0.5, b.z), 'gros'); if (pas === 1) toast(b.d.nom + ' enrage : toutes les ' + ENRAGE_ILE.periode + ' s, lui et sa troupe gagnent ' + Math.round(ENRAGE_ILE.pas * 100) + ' % de dégâts, de vitesse, d\'attaque et de sorts. Tiens bon !', 'alerte'); } } }
  if (!c.file.length && c.monstres.every((o) => o.etat === 'mort')) {
    if (c.genre === 'ile') { finIleBoss(false, true); return; } /* (le boss est tombe : toute l'alliance l'a abattu) */
    if (c.arene && !c.entracte) { c.victoire += dt; if (c.victoire > 0.8) { c.victoire = 0; vagueAreneTenue(c); } return; } /* l'Arene : la vague suivante */
    if (c.phases && c.phases.length) { if (!c.entracte) { c.entracte = true; c.repasEntracte = {}; ouvrirEntracte(); } else if (modaleOuverte !== 'entracte') tempsSuivant(); return; } /* (l'entracte, puis le temps suivant) */
    c.victoire += dt; if (c.victoire > 0.6) finVague(true); }
}
/* UNE LIGNE DE RECAP DE FIN DE COMBAT, la meme partout (vagues, simu VSA, Arene, ile des boss ; 16/10/2026 : l'Arene et l'ile etaient en gris, les vagues
   en couleur), chaque picto avec sa couleur */
const COULEURS_RECAP = { vitesse: '#3d8fd6', cadence: '#3d8fd6', tofu: '#d9443a', renfort: '#d9443a', rage: '#d9443a', vita: '#d9443a', degats: '#e07c0a', carreaux: '#2f9a8a', puissance: '#e0a10a', etoile: '#7a4fc9', casse: '#9a6a3a', kama: '#e0a31e', couronne: '#e0a10a' };
const ligneRecap = (e, t, v) => '<div class="rc-l">' + picto(e, COULEURS_RECAP[e]) + '<span>' + t + '</span><b>' + v + '</b></div>';
/* le recap de la vague : sa duree, les monstres abattus, les degats donnes (toi, ta defense, ton Bouftou) et recus, le plus gros coup, les sorts lances */
function recapCombat(c) {
  const st = c.st; if (!st) return '';
  const d = Math.round(c.duree || 0), duree = d >= 60 ? Math.floor(d / 60) + ' min ' + String(d % 60).padStart(2, '0') + ' s' : d + ' s', pv = Math.max(0, Math.round(100 * c.pv / c.pvMax)), bats = Object.values(c.bats || {}).reduce((a, b) => a + b, 0);
  const l = ligneRecap, def = Math.round(st.def || 0);
  return '<div class="hdv-section">Le combat</div><div class="recap-combat">' + l('vitesse', 'Durée', duree) + l('tofu', 'Monstres abattus', st.tues + ' sur ' + c.total) +
    l('degats', 'Tes dégâts', fmt(Math.max(0, Math.round(st.inflige) - def))) + l('carreaux', 'Dégâts de tes défenses', fmt(def)) + l('puissance', 'Ton plus gros coup', fmt(Math.round(st.max))) +
    l('vita', 'Dégâts reçus', fmt(Math.round(st.recus)) + ' (' + pv + ' % de PV en fin)') + l('etoile', 'Sorts et ultis lancés', st.sorts) + (bats ? l('casse', 'Dégâts sur tes bâtiments', fmt(Math.round(bats))) : '') + '</div>';
}
function finVague(gagne, fuite) {
  if (!combat || combat.fin) return; if (combat.arene) { finArene(true); return; }
  const c = combat; if (!fuite) son(gagne ? 'victoire' : 'defaite'); const n = c.n, rejoue = S_.vague.num > VAGUES_TOTAL || c.rejoueBoss != null;
  nettoyerCombat(c, c.deroute != null); /* (le perso ne se releve que s'il etait a terre ; en pleine charge, sa charge finit d'elle-meme) */
  if (c.raid) partirOmeho((c.butin || []).length > 0); /* (Omeho s'en va avec sa troupe : ravi s'ils ont vole quelque chose, vexe sinon) */
  if (c.raid) { /* le Raid VSA : une prime par voleur abattu ; si on fuit, chaque voleur encore la emporte sa part */
    if (fuite) c.monstres.forEach((o) => { if (o.etat === 'mort') return; if (o.porte) c.butin.push(o.porte); else if (!o.fuite) { const r = volerRaid(o.d.vole); if (r) c.butin.push(r); } }); /* tu fuis : ceux qui sont encore la repartent avec leur part */
    const f = forceVoleur(), prime = kamasGagnes(c.tues * (15 + 5 * f)); S_.kamas += prime; /* la prime d'un raid entier : environ la moitie des kamas d'une vague du meme moment */ if (c.tues) gagnerXp(c.tues * 10);
    /* « c'est pas tres clair, on sait pas si y'a vraiment des voleurs qui ont reussi a s'echapper et avec combien de butin » (Mathieu, 12/10/2026) :
       le bilan dit maintenant combien se sont enfuis, ce qui est perdu pour de bon (et ce que ca vaut), et ce qui a ete repris sur les voleurs abattus */
    const somme = (L) => { const t = {}; L.forEach((r) => { (t[r.id] = t[r.id] || { nom: r.nom, n: 0 }).n += r.n; }); return Object.entries(t); };
    const liste = (E) => E.map(([, r]) => r.n + ' ' + r.nom).join(', '), valeur = (E) => E.reduce((v, [id, r]) => v + r.n * prix(id), 0);
    const perdu = somme(c.butin), enfuis = Math.max(0, (c.total || c.tues) - c.tues), vPerdu = valeur(perdu);
    /* « faut trop lire pour voir ce que l'on a gagne / perdu » (Mathieu, 13/10/2026) : la proposition C, en vignettes. Les tetes des voleurs (barrees : abattus,
       fleche : enfuis), puis une vignette par gain (vert), par recolte reprise (blanc) et par recolte volee (rouge), gros chiffres et presque pas de texte */
    const tetes = Math.min(c.tues + enfuis, 14), abattus = Math.min(c.tues, tetes);
    const vol = '<div class="bv-vol">' + Array.from({ length: tetes }, (_, k) => '<span class="' + (k < abattus ? 'abattu' : 'enfui') + '"><img src="assets/icones/voleur.png?v=' + VERSION_MODELES + '" alt=""></span>').join('') + '</div><div class="bv-leg">' + c.tues + ' abattu' + (c.tues > 1 ? 's' : '') + ', ' + (enfuis ? enfuis + ' enfui' + (enfuis > 1 ? 's' : '') : 'aucun enfui') + '</div>';
    const vignette = (cls, icone, chiffre, texte) => '<div class="bv-t ' + cls + '"><img src="assets/icones/' + icone + '.png?v=' + VERSION_MODELES + '" alt=""><b>' + chiffre + '</b><span>' + texte + '</span></div>';
    const V = [];
    if (prime) V.push(vignette('g', 'kama', '+' + fmt(prime), 'prime'));
    if (c.lootV && c.lootV.kamas) V.push(vignette('g', 'kama', '+' + fmt(c.lootV.kamas), 'trouvés sur eux'));
    /* « on comprend pas si j'ai perdu 12 fraises de ma grange ou si perdu + repris » (Mathieu, 16/10/2026) : une vignette par recolte prise. En gros, ce qui
       manque vraiment dans la grange (0 : tout repris sur les voleurs abattus), en dessous ce qu'ils avaient pris et ce que tu as repris */
    const pris = {}; [[c.recup || [], 'repris'], [c.butin, 'perdu']].forEach(([L, k]) => L.forEach((r) => { const o = pris[r.id] = pris[r.id] || { nom: r.nom, repris: 0, perdu: 0 }; o[k] += r.n; }));
    Object.entries(pris).sort(([a, x], [b, y]) => y.perdu * prix(b) - x.perdu * prix(a) || y.repris - x.repris).forEach(([id, r]) =>
      V.push(vignette(r.perdu ? 'p' : 'g', id, r.perdu ? '−' + fmt(r.perdu) : '0', r.nom + ' en moins<small>pris ' + fmt(r.perdu + r.repris) + ' · repris ' + fmt(r.repris) + '</small>' + (r.perdu && prix(id) ? '<small>≈ ' + fmt(r.perdu * prix(id)) + ' kamas</small>' : ''))));
    if (!Object.keys(pris).length) V.push(vignette('g', 'grange', '0', 'rien de volé'));
    /* « il faudrait aussi indiquer combien on a gagne / perdu au total sur cette attaque » (Mathieu, 13/10/2026) : la prime et les kamas trouves, moins la valeur
       des recoltes volees au prix de l'HDV (les recoltes reprises reviennent dans la grange : elles ne comptent pas) */
    const bilan = prime + ((c.lootV && c.lootV.kamas) || 0) - vPerdu;
    const pied = '<div class="bv-pied"><div class="bv-bilan ' + (bilan >= 0 ? 'plus' : 'moins') + '"><img src="assets/icones/kama.png?v=' + VERSION_MODELES + '" alt=""><div class="bv-txt"><span>Bilan de l\'attaque</span>' + (vPerdu ? '<small>récoltes perdues au prix de l\'HDV</small>' : '') + '</div><b>' + (bilan >= 0 ? '+' : '−') + fmt(Math.abs(bilan)) + ' kamas</b></div><button class="btn kamas" data-fermer>Retour à la ferme</button></div>';
    ouvrirModale('vague-fin', entete(perdu.length ? 'Simu VSA terminée' : 'Simu VSA repoussée !') + vol + '<div class="bv-grille" style="--n:' + Math.min(4, V.length) + '">' + V.join('') + '</div>' + recapCombat(c) + pied); /* (le recap du combat, comme apres une vague, 16/10/2026) */ memoriserCombat();
    rendreHaut(); rendreGrange(); sauver(); return;
  }
  { const max = statsPerso().pvMax, reste = Math.max(0, Math.min(max, Math.round(c.pv))); S_.pv = gagne || fuite ? Math.max(1, reste) : Math.max(Math.round(max * VIE_APRES_DEFAITE), reste); }
  if (!gagne && !c.raid) { compter(fuite ? 'fuites' : 'defaites'); const D = S_.defaitesVague || (S_.defaitesVague = {}), k = c.rejoueBoss != null ? (c.difficile ? 'dur' : 'rejoue') + (c.rejoueBoss + 1) : String(n); D[k] = (D[k] || 0) + 1; } /* (ou les joueurs perdent, vague par vague : pour regler la difficulte sur de vrais joueurs, 15/10/2026) */ /* la vie qui reste ; perdu : il revient a 30 % au moins */
  let corps;
  if (gagne) {
    const g = c.rejoueBoss != null ? gainsBoss(c.rejoueBoss) : gainsVague(n, rejoue); if (c.rejoueBoss != null) { S_.bossFois = S_.bossFois || {}; S_.bossFois[c.rejoueBoss] = (S_.bossFois[c.rejoueBoss] || 0) + 1; } S_.kamas += g.kamas; compter('vagues'); if (!rejoue) { S_.vague.num = n + 1; if (n < VAGUES_TOTAL) S_.vague.prepa = Date.now() + PREPA_VAGUE * MIN; } gagnerXp(g.xp); g.xpVrai = gagnerXp.dernier; /* « 12 xp a la vague 33, mouais » (Mathieu, 12/10/2026) : le frein ne touche plus les vagues gagnees */
    const P = palierDe(n), finPalier = !rejoue && n % VAGUES_PALIER === 0;
    const suite = S_.vague.num > VAGUES_TOTAL ? '<p style="font-size:.82rem;font-weight:600">' + leNom(MONSTRES[PALIERS[P].boss]) + ' est tombé' + ac(MONSTRES[PALIERS[P].boss]) + ' : tous les paliers sont terminés. La suite arrive bientôt.</p>'
      : '<p style="font-size:.82rem;font-weight:600">' + (finPalier ? leNom(MONSTRES[PALIERS[P].boss]) + ' est tombé' + ac(MONSTRES[PALIERS[P].boss]) + ' ! ' + (P === 4 ? '<b>Phase 1 terminée.</b> Place à la <b>Phase 2</b> : ' + PALIERS[P + 1].nom + ', et ton niveau maximum passe à 60. ' : P === 5 ? 'Place au ' + nomPalier(P + 1).toLowerCase() + ' : ' + PALIERS[P + 1].nom + ', et ton niveau maximum passe à 70. ' : 'Place au ' + nomPalier(P + 1).toLowerCase() + ' : ' + PALIERS[P + 1].nom + '. ') : '') + 'La vague ' + S_.vague.num + ' t\'attend : ' + compoVague(S_.vague.num).map(([t, k]) => k + ' ' + (k > 1 ? pluriel(MONSTRES[t].nom) : MONSTRES[t].nom)).join(', ') + '.</p>';
    corps = entete(c.rejoueBoss != null ? (c.difficile ? 'Revanche DIFFICILE gagnée : ' : 'Revanche gagnée : ') + MONSTRES[PALIERS[c.rejoueBoss].boss].nom + ' !' : 'Vague ' + n + ' gagnée !') + '<div class="art">' + ico('kama') + '<div><b>+' + fmt(g.kamas) + ' ' + KAMA + ' et +' + fmt(g.xpVrai != null ? g.xpVrai : g.xp) + ' points d\'expérience</b><div class="desc">Il te restait ' + Math.ceil(c.pv) + ' PV sur ' + c.pvMax + '.' + '</div></div><div></div></div>' + suite;
  } else {
    const champs = S_.cases.filter((x) => x.type === 'champ' && x.c).sort((a, b) => recolte(b) * prix(b.c) - recolte(a) * prix(a.c));
    let perte = 'Ils n\'ont trouvé aucune culture à saccager.';
    if (champs.length) { const p = champs[0], nom = PAR_ID[p.c].nom; c.saccage = { c: p.c, n: recolte(p) }; Object.assign(p, champVide()); rendreCase(p.id); perte = 'Ils ont saccagé ton champ ' + de(nom) + ' en repartant.'; }
    if (!fuite) S_.vague.repos = Date.now() + REPOS_VAGUE;
    if (c.deroute != null) { const touches = Object.keys(c.bats || {}).filter((k) => c.bats[k] > 0); perte += touches.length ? ' Pendant que tu étais à terre, ils ont frappé ' + touches.map((k) => nomBat(k) + (enRuine(k) ? ' (en ruine)' : '')).join(', ') + ' : répare avant la prochaine vague.' : ' Pendant que tu étais à terre, ta défense les a tenus loin de tes bâtiments.'; }
    corps = entete(fuite ? 'Tu as fui la vague ' + n : 'Vague ' + n + ' perdue') + '<div class="art">' + ico(classeDe()) + '<div><b>' + perte + '</b><div class="desc">' + (fuite ? 'Ton perso n\'a pas besoin de repos : tu peux relancer quand tu veux.' : 'Ton perso se repose ' + dureeLisible(REPOS_VAGUE) + ' avant de pouvoir relancer, et revient à ' + Math.round(VIE_APRES_DEFAITE * 100) + ' % de vie au moins : bois un pot de gelée pour repartir plus fort. Monte de niveau en cultivant, ou équipe la grange d\'une arbalète.') + '</div></div><div></div></div>';
  }
  corps += recapCombat(c); /* « recap fin de combat » (testeurs, 12/10/2026) */
  if (c.loot && (Object.keys(c.loot.res).length || c.loot.objets.length)) corps += '<div class="hdv-section">Butin</div>' + /* une ligne par objet et par ressource, chacun avec son icone (demande de Mathieu, 11/10/2026) */
    [...new Set(c.loot.objets)].map((id) => { const o = obj(id), nb = c.loot.objets.filter((x) => x === id).length; return '<div class="art">' + icoObjet(id) + '<div><b>' + (o.leg ? '✦ ' : '★ ') + o.nom + (nb > 1 ? ' ×' + nb : '') + '</b><div class="puces">' + statsTexte(o.stats) + '</div></div><div class="act"><button class="btn kamas" data-perso-sel="' + id + '">Voir</button></div></div>'; }).join('') +
    Object.entries(c.loot.res).map(([r, n]) => '<div class="art">' + ico(r) + '<div><b>' + n + ' ' + PAR_ID[r].nom + '</b><div class="desc">À la grange, se vend à l’HDV (' + fmt(Math.round(prix(r))) + ' ' + KAMA + ' pièce).</div></div><div></div></div>').join('');
  { const V = Object.entries(c.cultures || {}); if (V.length || c.saccage) corps += '<div class="hdv-section">Cultures perdues</div>' + /* une ligne par culture, comme les batiments (19/10/2026) */
    V.map(([id, v]) => '<div class="art">' + ico(id) + '<div><b>' + PAR_ID[id].nom + ' : -' + v.n + ' récolte' + (v.n > 1 ? 's' : '') + '</b><div class="desc">' + (v.par.every((t) => t === 'tofu') ? 'Picorée' : 'Grignotée') + (v.n > 1 ? 's' : '') + ' par ' + v.par.map((t) => 'les ' + pluriel(MONSTRES[t].nom)).join(' et ') + ', soit environ ' + fmt(Math.round(v.n * prix(id))) + ' ' + KAMA + ' à l\'HDV.</div></div><div></div></div>').join('') +
    (c.saccage ? '<div class="art">' + ico(c.saccage.c) + '<div><b>Champ ' + de(PAR_ID[c.saccage.c].nom) + ' saccagé : -' + c.saccage.n + ' récolte' + (c.saccage.n > 1 ? 's' : '') + '</b><div class="desc">Tout le champ, en repartant après ta défaite, soit environ ' + fmt(Math.round(c.saccage.n * prix(c.saccage.c))) + ' ' + KAMA + ' à l\'HDV.</div></div><div></div></div>' : ''); }
  if (c.bats) { const L = Object.entries(c.bats); if (L.length) corps += '<div class="hdv-section">Bâtiments touchés</div>' + L.map(([k, n]) => '<div class="art">' + ico(ICO_BAT[typeCle(k)]) + '<div><b>' + Maj(nomBat(k)) + (enRuine(k) ? ' : en ruine' : ' : -' + fmt(n) + ' PV') + '</b><div class="desc">' + (enRuine(k) ? PERTE_RUINE[typeCle(k)] : 'Il lui reste ' + fmt(pvBat(k)) + ' PV sur ' + fmt(pvMaxBat(k)) + '.') + '</div></div><div class="act"><button class="btn kamas" ' + (enRuine(k) ? 'data-reconstruire="' + k + '">Reconstruire ' + fmt(coutReconstruire(k)) : 'data-reparer="' + k + '">Réparer ' + fmt(coutReparer(k))) + ' ' + KAMA + '</button></div></div>').join('');
    const aFaire = L.map(([k]) => k).filter((k) => degatsBat(k) || enRuine(k)), total = aFaire.reduce((t, k) => t + (enRuine(k) ? coutReconstruire(k) : coutReparer(k)), 0);
    if (aFaire.length >= 2) corps += '<div style="display:flex;justify-content:flex-end;margin-top:8px"><button class="btn kamas" data-tout-reparer="' + aFaire.join(',') + '">Tout réparer ' + fmt(total) + ' ' + KAMA + '</button></div>'; }
  ouvrirModale('vague-fin', corps + '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn discret" data-fermer>Retour à la ferme</button>' + (gagne && !S_.ulti && niveau(S_.xp) >= NIV_ULTI ? '<button class="btn kamas" data-voir-ulti>Choisir mon ulti</button>' : '') + '<button class="btn kamas" data-voir-vagues>Voir les vagues</button></div>'); memoriserCombat();
  rendreHaut(); rendreGrange(); rendreCasesBulles(); sauver();
}

