'use strict';
/* ===================== ACTIONS ===================== */
const ACTIONS = {
  toucherCase(id) {
    const p = S_.cases.find((c) => c.id === id); if (!p) return;
    if (p.type === 'montgolfiere' && !mode && !combat) { ouvrirMontgolfiere(); return; }
    if (mode === 'deplacer' || mode === 'deplacerBat') {
      const lui = mode === 'deplacer' ? p === aDeplacer : aDeplacer && (aDeplacer.piece !== undefined ? false : aDeplacer.tour ? aDeplacer.tour === p : aDeplacer.deco ? aDeplacer.deco === p : aDeplacer.arbre ? p.arbre === aDeplacer.arbre : p.type === aDeplacer.bat);
      if (!lui && p.type !== 'libre' && selectionner(p)) return; /* un autre element : on le prend a la place */
      if (mode === 'deplacer') ACTIONS.deplacerVers(p); else ACTIONS.deplacerBatiment(p); return;
    }
    if (mode === 'enclos') { ACTIONS.caseEnclos(p); return; }
    if (mode === 'enclosDeplacer') { if (p.type === 'libre') ACTIONS.deplacerEnclos(p); else if (p.type !== 'enclos') toast('Touche une case d\'herbe libre.'); return; }
    if (mode === 'poserDeco') { ACTIONS.poserDeco(p); return; }
    if (mode === 'poserTour') { if (p.type !== 'libre') { toast('Il faut une case d\'herbe libre.'); return; } ACTIONS.construireTour(p.id); return; }
    if (mode === 'choisir') {
      if (parcelleAjoutee(p)) ouvrirParcelle(p);
      else if (!selectionner(p)) toast('Touche une parcelle, un bâtiment, une tour, une décoration ou l\'enclos.');
      return;
    }
    if (combat) { if (PASSABLE[p.type]) { combat.ordre = true; combat.tenir = true; allerPuis(p, () => {}); } else toast('Pendant la vague : touche un monstre pour le cibler, ou une case libre pour t\'y déplacer.'); return; }
    if (p.type === 'libre') {
      if (S_.sauvage && S_.sauvage.id === p.id) { if (peutCapturer()) ouvrirTofu(p, true); else chasserDeLoin(p, () => ACTIONS.chasserSauvage()); return; }
      allerPuis(p, () => ouvrirConstruire(p)); return; /* (le clic gauche, lui, deplace seulement : voir allerVers) */
    }
    if (p.type === 'champ' && p.tofu) { if (peutCapturer()) ouvrirTofu(p); else chasserDeLoin(p, () => ACTIONS.chasser(p)); return; }
    allerPuis(p, () => ACTIONS.agirSurCase(p));
  },
  agirSurCase(p) {
    { const k = cleDeCase(p); if (k && enRuine(k)) { ouvrirBatPv(k); return; } } /* en ruine : il faut d'abord le reconstruire */
    if (p.type === 'enclos') { ouvrirEnclos(); return; }
    if (p.type === 'hdv') { ouvrirHdv(); return; }
    if (p.type === 'grange') { ouvrirGrange(); return; }
    if (p.type === 'puits') { if ((S_.eau >= capaciteEau() && citernePleine()) || degatsBat('puits')) ouvrirPuits(); else ACTIONS.remplir(); return; }
    if (p.type === 'epouvantail') { ouvrirEpouvantail(); return; }
    if (p.type === 'tour') { ouvrirTour(p); return; }
    if (p.type === 'voliere') { ouvrirVoliere(); return; }
    if (p.type === 'geliere') { if (potsPretsGeliere()) ACTIONS.ramasserPots(); ouvrirGeliere(); return; }
    if (p.type === 'forge') { ouvrirForge(); return; }
    if (p.type === 'chemin') return;
    if (p.type !== 'champ') { toast(({ epouvantail: 'L\'épouvantail fait fuir une partie des Tofus.', foin: 'Des bottes de foin pour les Bouftous.', deco: 'Une décoration : passe par Aménager pour la déplacer, la tourner ou la ranger.' })[p.type] || ''); return; }
    if (!p.c) { ACTIONS.planter(p); return; }
    if (p.tofu) { if (peutCapturer()) ouvrirTofu(p); else chasserDeLoin(p, () => ACTIONS.chasser(p)); return; }
    const d = duree(PAR_ID[p.c]);
    if (p.pousse >= d) { ACTIONS.recolter(p); return; }
    if (!p.arrose) { ACTIONS.arroser(p); return; }
    toast(PAR_ID[p.c].nom + ' : encore ' + dureeLisible((d - p.pousse) / (p.arrose ? 1 : 0.4)) + (p.arrose ? '.' : ' à sec, arrose pour aller plus vite.'));
  },
  arroser(p) {
    if (S_.eau <= 0 && enRuine('puits')) { toast('Arrosoir vide, et le puits est en ruine : reconstruis-le d\'abord.', 'alerte'); return; }
    if (S_.eau <= 0 && niv('poulie')) {
      const puits = S_.cases.find((c) => c.type === 'puits'), ici = paysanMesh && paysanMesh.userData.cellule;
      if (puits && ici && ici.terrain === 'main' && Math.max(Math.abs(ici.i - puits.i), Math.abs(ici.j - puits.j)) <= 2) { S_.eau = capaciteEau(); if (niv('arrosoir')) S_.citerne = capaciteCiterne(); toast('La poulie remonte un seau : arrosoir plein' + (niv('arrosoir') ? ', citerne aussi.' : '.')); }
    }
    if (S_.eau <= 0) {
      const puits = S_.cases.find((c) => c.type === 'puits');
      toast('Arrosoir vide : ' + (S_.perso ? S_.perso.nom : 'le paysan') + ' file au puits.', 'alerte');
      if (puits) allerPuis(puits, () => { ACTIONS.remplir(); allerPuis(p, () => ACTIONS.arroser(p)); });
      return;
    }
    S_.eau--; p.arrose = true; son('arrosage'); compter('arrosages'); toast('Arrosé (' + S_.eau + '/' + capaciteEau() + ' dans l\'arrosoir). Ça pousse deux fois et demie plus vite.'); rendreCase(p.id); rendreHaut();
  },
  remplir() {
    if (enRuine('puits')) { toast('Le puits est en ruine : reconstruis-le pour remplir l\'arrosoir.', 'alerte'); return; }
    if (S_.eau >= capaciteEau() && citernePleine()) { toast(niv('arrosoir') ? 'L\'arrosoir et la citerne sont déjà pleins.' : 'L\'arrosoir est déjà plein.'); return; }
    S_.eau = capaciteEau(); if (niv('arrosoir')) S_.citerne = capaciteCiterne(); son('puits');
    toast('Rempli au puits : arrosoir ' + capaciteEau() + '/' + capaciteEau() + (niv('arrosoir') ? ', citerne ' + capaciteCiterne() + '/' + capaciteCiterne() : '') + '.'); rendreHaut(); rendreCasesBulles();
  },
  planter(p, id) {
    /* plusieurs sortes de graines en grange : on demande laquelle planter ; une seule : on la plante ; aucune : direction l'HDV */
    if (!id) {
      const dispo = CULTURES.filter((c) => debloquee(c) && (S_.graines[c.id] || 0) > 0);
      if (dispo.length > 1) { ouvrirPlanter(p, dispo); return; }
      if (!dispo.length) { toast('Plus aucune graine dans la grange : achète-en à l\'HDV.', 'alerte'); ouvrirHdv('acheter'); return; }
      id = dispo[0].id;
    }
    const c = PAR_ID[id]; if (!c || !debloquee(c) || !(S_.graines[c.id] > 0) || p.c) return;
    S_.graines[c.id]--; S_.graine = c.id; compter('plantes'); son('planter'); const auto = niv('arrosoir') && (S_.citerne || 0) > 0; if (auto) { S_.citerne--; if (!S_.citerne) toast('La citerne est vide : passe au puits pour la remplir.', 'alerte'); }
    Object.assign(p, champVide(), { c: c.id, arrose: !!auto });
    rendreCase(p.id); rendreHaut();
  },
  acheterPots(t, n) {
    const P = POTS[t]; if (!P || !(n > 0)) return; const cout = prixPot(t) * n;
    if (S_.kamas < cout) { toast('Il te manque ' + fmt(cout - S_.kamas) + ' kamas.'); return; }
    S_.kamas -= cout; S_.pots = S_.pots || {}; S_.pots[t] = (S_.pots[t] || 0) + n; compter('achatsPots'); son('gelee');
    toast('+' + n + ' ' + (n > 1 ? P.court.toLowerCase() : P.nom.toLowerCase()) + ' : bois-les avec le bouton potion, à côté de ta vie.'); rendreHaut(); rendreGrange(); sauver(); ouvrirHdv('acheter');
  },
  acheterGelee(c) {
    const G = GELEES[c]; if (!G || G.rare) return;
    if (!niv('geliere')) { toast('Construis d\'abord la Gelière (Améliorer, catégorie Animaux).', 'alerte'); return; }
    S_.gelees = S_.gelees || []; if (S_.gelees.length >= placesGeliere()) { toast('Ta Gelière est pleine : ' + placesGeliere() + ' places. Agrandis-la pour en loger plus.', 'alerte'); return; }
    if (S_.kamas < G.prix) { toast('Il te manque ' + fmt(G.prix - S_.kamas) + ' kamas.'); return; }
    S_.kamas -= G.prix; const g = { c, nom: nouveauNomGelee(), fin: 0 }; S_.gelees.push(g); compter('gelees'); son('gelee');
    toast(g.nom + ', ta ' + G.nom + ', saute dans la Gelière. Nourris-la : ' + recetteTxt(G.recette) + ' par pot.', 'or');
    rendreGelees(); rendreCasesBulles(); rendreHaut(); sauver(); if (modaleOuverte === 'hdv') ouvrirHdv('acheter');
  },
  nourrirGelee(k, muet) {
    const g = (S_.gelees || [])[k]; if (!g || etatGelee(g) !== 'faim') return false; const r = GELEES[g.c].recette, m = manqueRecette(r);
    if (m.length) { if (!muet) toast('Il manque ' + m.join(' et ') + ' pour nourrir ' + g.nom + '.', 'alerte'); return false; }
    Object.entries(r).forEach(([id, n]) => { S_.grange[id] -= n; }); g.fin = Date.now() + prodGelee(g); compter('repasGelees');
    if (!muet) { son('gelee'); toast(g.nom + ' mange : son pot sera prêt dans ' + dureeLisible(prodGelee(g)) + '.'); rendreGrange(); rendreCasesBulles(); sauver(); if (modaleOuverte === 'geliere') ouvrirGeliere(); }
    return true;
  },
  nourrirGelees() {
    let n = 0, roy = 0; (S_.gelees || []).forEach((g, k) => { if (ACTIONS.nourrirGelee(k, true)) { n++; if (g.c === 'royale') roy++; } });
    if (!n) { toast('Pas assez de fruits pour tes Gelées qui ont faim.', 'alerte'); return; }
    son('gelee'); toast(n + ' Gelée' + (n > 1 ? 's mangent' : ' mange') + ' : pot' + (n > 1 ? 's' : '') + ' prêt' + (n > 1 ? 's' : '') + ' dans ' + dureeLisible(roy === n ? PROD_ROYALE : PROD_GELEE) + (roy && roy < n ? ' (' + dureeLisible(PROD_ROYALE) + ' pour la Royale)' : '') + '.');
    rendreGrange(); rendreCasesBulles(); sauver(); if (modaleOuverte === 'geliere') ouvrirGeliere();
  },
  ramasserPots() {
    const L = (S_.gelees || []).filter((g) => etatGelee(g) === 'pret'); if (!L.length) return; S_.pots = S_.pots || {};
    const par = {}; L.forEach((g) => { const t = GELEES[g.c].pot; S_.pots[t] = (S_.pots[t] || 0) + 1; par[t] = (par[t] || 0) + 1; g.fin = 0; }); compter('potsGeliere', L.length); son('quete');
    toast('Ramassé : ' + Object.entries(par).map(([t, n]) => n + ' ' + (n > 1 ? POTS[t].court.toLowerCase() : POTS[t].nom.toLowerCase())).join(', ') + '.', 'or');
    rendreGrange(); rendreHaut(); rendreCasesBulles(); sauver(); if (modaleOuverte === 'geliere') ouvrirGeliere();
  },
  croiserGelees() {
    const L = parentsCroisement(); if (!L) { toast('Il faut deux Gelées de couleurs différentes, reposées, et une place libre.', 'alerte'); return; }
    const m = manqueRecette(CROISEMENT); if (m.length) { toast('Il manque ' + m.join(' et ') + ' pour les croiser.', 'alerte'); return; }
    Object.entries(CROISEMENT).forEach(([id, n]) => { S_.grange[id] -= n; }); const [a, b] = L; a.repos = b.repos = Date.now() + REPOS_CROISEMENT;
    const royale = nbRoyales() < ROYALES_MAX && Math.random() < CHANCE_ROYALE, c = royale ? 'royale' : hasard([a.c, b.c]), g = { c, nom: nouveauNomGelee(), fin: 0 }; S_.gelees.push(g); compter('croisements');
    son(royale ? 'niveau' : 'gelee'); if (royale) { compter('royales'); confettis(40); }
    toast(royale ? 'Incroyable : ' + a.nom + ' et ' + b.nom + ' donnent naissance à ' + g.nom + ', une GELÉE ROYALE ! Son pot rend toute ta vie et donne +20 Agilité pour la vague.' : a.nom + ' et ' + b.nom + ' ont un petit : ' + g.nom + ', ' + GELEES[c].nom.toLowerCase() + '.', 'or');
    rendreGrange(); rendreGelees(); sauver(); if (modaleOuverte === 'geliere') ouvrirGeliere();
  },
  acheterGraines(id, n) {
    const c = PAR_ID[id]; if (!c || !debloquee(c)) return;
    const cout = prixGraine(c) * n;
    if (S_.kamas < cout) { toast('Il te manque ' + fmt(cout - S_.kamas) + ' kamas.'); return; }
    S_.kamas -= cout; S_.graines[id] = (S_.graines[id] || 0) + n; compter('achatsGraines'); S_.graine = id;
    toast('+' + n + ' graine' + (n > 1 ? 's' : '') + ' ' + de(c.nom) + ' dans la grange.'); rendreHaut(); ouvrirHdv('acheter');
  },
  recolter(p) {
    const c = PAR_ID[p.c]; const qte = recolte(p);
    S_.grange[c.id] = (S_.grange[c.id] || 0) + qte; const xpRecolte = xpRecolteReel(c); if (xpRecolte > 0) { const q = posCase(p); if (niveau(S_.xp) < capNiveau()) gainFlottant('+' + xpRecolte + ' XP', q.x, q.y + 1.1, q.z, null, 'gain-xp'); } /* seulement l'XP (la bulle affichait deja la recolte) : celle vraiment gagnee */ son(c.glb === 'cultures3' ? 'cueillette' : 'fauchage'); compter('recoltes'); compter('recolte_' + c.id); Object.assign(p, champVide());
    const rendue = niv('semences') && Math.random() < 0.25; if (rendue) S_.graines[c.id] = (S_.graines[c.id] || 0) + 1;
    toast('+' + qte + ' ' + c.nom + ' à la grange.' + (rendue ? ' Et une graine récupérée !' : '')); if (xpRecolte > 0) gagnerXp(xpRecolte, true); rendreCase(p.id); rendreGrange();
  },
  capturer(p) {
    if (!p.tofu || S_.filets <= 0) return; if (S_.tofus >= capaciteVoliere()) { fermerModale(); toast('Ta volière est pleine (' + S_.tofus + '/' + capaciteVoliere() + ') : agrandis-la à l\'HDV, onglet Améliorations.', 'alerte'); return; } S_.filets--; fermerModale();
    if (Math.random() < CHANCE_CAPTURE) { compter('captures'); S_.tofus++; p.tofu = 0; p.tofuParti = Date.now(); toast('Tofu capturé ! Il rejoint ta volière (' + S_.tofus + '/' + capaciteVoliere() + ') et te donnera des plumes.', 'or'); gagnerXp(5); }
    else { p.tofu = 0; p.tofuParti = Date.now(); toast('Raté, le Tofu s\'est échappé avec ton filet, mais il a lâché ta culture.', 'alerte'); }
    rendreCase(p.id); rendreHaut(); rendreGrange();
  },
  acheterFleches(n) {
    const cout = PRIX_FLECHE * n; if (S_.kamas < cout) { toast('Il te manque ' + fmt(cout - S_.kamas) + ' kamas.'); return; }
    S_.kamas -= cout; S_.fleches += n; toast('+' + n + ' flèche' + (n > 1 ? 's' : '') + ' d\'arbalète.'); rendreHaut(); rendreGrange(); rendreArbaleteBulle(); ouvrirHdv('acheter');
  },
  recharger() {
    if (!niv('arbalete') || S_.carreaux >= capaciteArbalete()) return;
    if (S_.fleches <= 0) { toast('Plus de flèches pour l\'arbalète : achète-en à l\'HDV, onglet Acheter.', 'alerte'); return; }
    const n = Math.min(capaciteArbalete() - S_.carreaux, S_.fleches); S_.fleches -= n; S_.carreaux += n;
    toast('Arbalète rechargée : ' + S_.carreaux + '/' + capaciteArbalete() + ' carreau' + (S_.carreaux > 1 ? 'x' : '') + ' prêt' + (S_.carreaux > 1 ? 's' : '') + ', ' + S_.fleches + ' flèche' + (S_.fleches > 1 ? 's' : '') + ' en réserve.'); rendreArbaleteBulle(); rendreGrange(); if (modaleOuverte === 'grange') ouvrirGrange(); sauver();
  },
  acheterFilets(n) {
    const cout = PRIX_FILET * n; if (S_.kamas < cout) { toast('Il te manque ' + fmt(cout - S_.kamas) + ' kamas.'); return; }
    S_.kamas -= cout; S_.filets += n; toast('+' + n + ' filet' + (n > 1 ? 's' : '') + ' de capture.'); rendreHaut(); rendreGrange(); ouvrirHdv('acheter');
  },
  tofuSauvage(p) {
    if (!S_.sauvage || S_.sauvage.id !== p.id) return;
    if (peutCapturer()) { ouvrirTofu(p, true); return; }
    if (S_.filets > 0) { chasserDeLoin(p, () => { if (S_.sauvage) ACTIONS.chasserSauvage(); }); return; } /* (des filets mais la voliere pleine : il le chasse) */
    S_.sauvage = null; rendreSauvage(); gagnerXp(1); toast('Le Tofu s\'envole. Avec un filet de capture (HDV, onglet Acheter), tu l\'aurais attrapé.');
  },
  capturerSauvage() {
    if (!S_.sauvage || S_.filets <= 0) return; if (S_.tofus >= capaciteVoliere()) { fermerModale(); toast('Ta volière est pleine (' + S_.tofus + '/' + capaciteVoliere() + ') : agrandis-la à l\'HDV, onglet Améliorations.', 'alerte'); return; } S_.filets--; fermerModale(); S_.sauvage = null;
    if (Math.random() < CHANCE_SAUVAGE) { compter('captures'); S_.tofus++; toast('Tofu capturé ! Il rejoint ta volière (' + S_.tofus + '/' + capaciteVoliere() + ') et te donnera des plumes.', 'or'); gagnerXp(5); }
    else toast('Raté, le Tofu s\'est échappé avec ton filet.', 'alerte');
    rendreSauvage(); rendreHaut(); rendreGrange();
  },
  chasserSauvage() { compter('tofusChasses'); S_.sauvage = null; fermerModale(); rendreSauvage(); gagnerXp(1); toast('Le Tofu s\'envole.'); },
  ramasserPlumes() {
    const n = S_.voliere.plumes; if (!n) { toast('Pas encore de plume à ramasser.'); return; }
    S_.grange.plume = (S_.grange.plume || 0) + n; compter('plumes'); S_.voliere.plumes = 0; xpFerme(PLUME.xp * n);
    toast('+' + n + ' Plume' + (n > 1 ? 's' : '') + ' de Tofu à la grange. Elles se vendent à l\'HDV.', 'or'); rendreGrange(); ouvrirVoliere();
  },
  chasser(p) { compter('tofusChasses'); son('tofu'); const w = p.nuisible === 'wabbit'; p.tofu = 0; p.nuisible = null; p.tofuParti = Date.now(); toast(w ? 'Wabbit chassé ! Il retourne sur son île.' : 'Tofu chassé ! Il ira picorer chez VSA.'); gagnerXp(1); rendreCase(p.id); },
  nourrir(j) {
    const b = S_.bouftous[j]; if (!b) return;
    const r = repasDe(b), d = dureeRepasDe(b), bebe = !adulte(b);
    if ((S_.grange.ble || 0) < r) { toast('Il faut ' + r + ' Blé dans la grange pour nourrir ' + b.nom + (bebe ? ' (un bébé mange trois fois plus)' : '') + '.'); return; }
    const t = Date.now(); S_.grange.ble -= r; compter('repas'); son('nourri'); b.rassasie = Math.min(Math.max(t, b.rassasie) + d, t + 3 * d); b.affame = false;
    toast(bebe ? b.nom + ' mange : il grandit tant qu\'il est repu.' : b.nom + ' mange. Il donnera de la laine tant qu\'il est repu.'); rendreBouftous(); rendreGrange();
  },
  reproduire() {
    if (S_.bouftous.length + enGestation() >= capacite()) { toast('Plus de place pour un petit : il faut 2 cases d\'enclos par Bouftou (les petits à naître comptent). Aménage ou agrandis l\'enclos.', 'alerte'); return; }
    const prets = S_.bouftous.filter(peutReproduire).sort((a, b) => (b.noir ? 1 : 0) - (a.noir ? 1 : 0)); /* les noirs d'abord : plus de chances */
    if (prets.length < 2) { toast('Il faut deux Bouftous adultes, repus et reposés.', 'alerte'); return; }
    if ((S_.grange.houblon || 0) < COUT_REPRO) { toast('Il faut ' + COUT_REPRO + ' Houblon dans la grange (tu en as ' + (S_.grange.houblon || 0) + ').' + (debloquee(PAR_ID.houblon) ? '' : ' Le Houblon se cultive au niveau ' + PAR_ID.houblon.niv + '.'), 'alerte'); return; }
    const [pa, ma] = prets, t = Date.now(); S_.grange.houblon -= COUT_REPRO; pa.repro = ma.repro = t + REPOS_REPRO;
    /* LE BOUFTOU NOIR (13/10/2026, « 1 chance sur 20 quand t'as 0 noir au depart, le 2e a 1 sur 40, et deux noirs qui font un petit, 1 chance sur 2 », Mathieu) :
       deux parents noirs : 1 sur 2 ; sinon 1 sur 20 sans aucun noir dans l'enclos, 1 sur 40 des qu'il y en a un (10 %, 25 %, 50 % selon les parents avant) */
    const dejaNoirs = S_.bouftous.some((x) => x.noir), noir = Math.random() < (pa.noir && ma.noir ? CHANCE_NOIR.deuxParents : dejaNoirs ? CHANCE_NOIR.deja : CHANCE_NOIR.aucun);
    ma.gestation = { fin: t + DUREE_GESTATION, noir, pere: pa.nom }; son('nourri'); /* la gestation : le petit nait dans 1 h (voir avancer) */
    toast(pa.nom + ' et ' + ma.nom + ' attendent un petit : il naîtra dans ' + dureeLisible(DUREE_GESTATION) + '. ' + ma.nom + ' s\'arrondit déjà !', 'or');
    rendreBouftous(); rendreGrange(); rendreHaut(); if (modaleOuverte === 'enclos') ouvrirEnclos();
  },
  vendreBouftou(j, confirme) {
    const b = S_.bouftous[j]; if (!b) return;
    if (b.gestation) { toast(b.nom + ' attend un petit : attends la naissance pour la vendre.', 'alerte'); return; }
    const gain = b.noir ? REVENTE_NOIR : adulte(b) ? REVENTE_BOUFTOU : REVENTE_BEBE;
    if (b.noir && !confirme) { ouvrirModale('enclos', entete('Vendre ' + b.nom + ' ?') + '<div class="confirme"><div class="gros"><img src="assets/icones/bouftou.png" alt="" style="filter:brightness(.35) sepia(.3)"></div><p>' + b.nom + ' est un Bouftou noir : sa laine vaut ' + LAINE_NOIRE.prix + ' kamas pièce, et il augmente les chances d\'avoir un petit noir. Un autre éleveur t\'en donne ' + fmt(gain) + ' kamas.</p><div class="boutons"><button class="btn discret" data-garder-bouftou>Le garder</button><button class="btn kamas" data-vendre-noir="' + j + '">Le vendre ' + fmt(gain) + ' ' + KAMA + '</button></div></div>'); return; }
    S_.bouftous.splice(j, 1); erre.splice(j, 1); S_.kamas += gain;
    toast(b.nom + ' part chez un autre éleveur : +' + gain + ' kamas.'); rendreBouftous(); rendreHaut();
  },
  tondre(j) {
    const b = S_.bouftous[j]; if (!b || !b.laine) return;
    const L = b.noir ? LAINE_NOIRE : LAINE; compter('laines', b.laine); son('tonte'); S_.grange[L.id] = (S_.grange[L.id] || 0) + b.laine; toast('+' + b.laine + ' ' + L.nom + ' grâce à ' + b.nom + '.', b.noir ? 'or' : undefined); xpFerme(L.xp * b.laine); b.laine = 0;
    rendreBouftous(); rendreGrange();
  },
  acheterBouftou() {
    if (S_.bouftous.length + enGestation() >= capacite()) { toast('L\'enclos est plein : il faut 2 cases par Bouftou. Aménage-le ou agrandis-le.'); return; }
    const cout = prixBouftou(); if (S_.kamas < cout) { toast('Un Bouftou coûte ' + fmt(cout) + ' kamas.'); return; }
    S_.kamas -= cout; S_.bouftousAchetes = (S_.bouftousAchetes || 0) + 1; const libres = NOMS.filter((n) => !S_.bouftous.some((b) => b.nom === n));
    S_.bouftous.push({ nom: hasard(libres.length ? libres : NOMS), rassasie: Date.now(), laine: 0, accu: 0, affame: true }); /* achete adulte */
    toast('Bienvenue à ' + S_.bouftous[S_.bouftous.length - 1].nom + ' ! Il a déjà faim.'); rendreBouftous(); rendreHaut();
  },
  vendre(id, n) {
    const stock = S_.grange[id] || 0; if (!stock) return;
    n = Math.max(1, Math.min(n || stock, stock)); const gain = n * prix(id); son('kamas'); compter('ventes'); S_.grange[id] = stock - n; S_.kamas += gain;
    toast(n + ' ' + PAR_ID[id].nom + ' vendu' + (n > 1 ? 's' : '') + ' pour ' + fmt(gain) + ' kamas.');
    rendreGrange(); rendreHaut(); if (modaleOuverte === 'hdv') ouvrirHdv('vendre');
  },
  amelio(id) {
    const a = AMELIOS.find((x) => x.id === id), n = niv(id);
    if (!a || n >= a.couts.length || niveau(S_.xp) < nivRequis(a, n) || S_.kamas < a.couts[n] || (a.requiert && !niv(a.requiert))) return;
    if (id === 'voliere' && n === 0 && bloqueursVoliere().length) { toast('Pas la place : libère une case à côté de la volière (une parcelle se déplace avec Aménager).', 'alerte'); return; }
    const caseForge = id === 'forge' && n === 0 ? caseLibreForge() : null;
    if (id === 'forge' && n === 0 && !caseForge) { toast('Pas la place : l\'atelier prend une case d\'herbe libre. Libère-en une avec Aménager, ou achète un terrain.', 'alerte'); return; }
    const blocGel = id === 'geliere' && n === 0 ? blocLibreGeliere() : null;
    if (id === 'geliere' && n === 0 && !blocGel) { toast('Pas la place : la Gelière prend 6 cases d\'herbe libres d\'un seul tenant (3 sur 2). Libère-les avec Aménager, ou achète un terrain.', 'alerte'); return; }
    S_.kamas -= a.couts[n]; S_.amelio[id] = n + 1; compter('amelios'); son('quete');
    toast(a.nom + (a.couts.length > 1 ? ' (niveau ' + (NIVBAT[id] ? nivBat(id) : n + 1) + ')' : '') + ' : c\'est fait.', 'or'); /* (un batiment : son vrai niveau, l'enclos ameliore une fois est au niveau 2) */
    if (id === 'enclos') { /* « quand on l'agrandit et qu'on doit ajouter des places, c'est un enfer » : elles se posent toutes seules, collees a lui, le plus compact possible */
      const k = agrandirEnclosAuto(), reste = maxCasesEnclos() - casesEnclos().length; appliquerEnclos(); rendreEnclosBulles();
      if (reste > 0) { sauver(); fermerModale(); mode = 'enclos'; aDeplacer = null; majBandeau(); rendreHaut(); rendreBouftous(); toast((k ? '+' + k + ' case' + (k > 1 ? 's' : '') + ' posée' + (k > 1 ? 's' : '') + '. ' : '') + 'Il manque la place pour ' + reste + ' case' + (reste > 1 ? 's' : '') + ' : libère de l\'herbe à côté de l\'enclos, puis touche les +.', 'alerte'); return; }
      toast('L\'enclos s\'agrandit : +' + k + ' case' + (k > 1 ? 's' : '') + ', posée' + (k > 1 ? 's' : '') + ' toute' + (k > 1 ? 's' : '') + ' seule' + (k > 1 ? 's' : '') + ' à côté de lui. Pour changer sa forme : Aménager l\'enclos.', 'or');
    }
    if (id === 'voliere') { appliquerVoliere(); rendreCasesBulles(); }
    if (id === 'forge' && caseForge) { /* construit : sur sa case, pres de la grange */
      caseForge.type = 'forge'; const u = paysanMesh.userData; if (u.cellule === caseForge || caseIci(paysanMesh.position.x, paysanMesh.position.z) === caseForge) { const v = voisins(caseForge).find((c) => PASSABLE[c.type]); if (v) { const q = posCase(v); paysanMesh.position.set(q.x, q.y, q.z); u.cellule = v; } }
      rendreCase(caseForge.id); construireBatiments(); sauver(); fermerModale(); rendreHaut(); toast('L\'atelier de forgemagie est construit, près de ta grange : touche-le pour forger tes pièces avec tes runes.', 'or'); ouvrirForge(); return; }
    if (id === 'geliere') { /* construite : ses 6 cases ; puis a chaque niveau, son nouveau modele */
      if (blocGel) { S_.rot = S_.rot || {}; S_.rot.geliere = blocGel.tourne ? 1 : 0; blocGel.cells.forEach((c) => { c.type = 'geliere'; }); S_.gelees = S_.gelees || [];
        const u = paysanMesh.userData; if (blocGel.cells.includes(u.cellule) || blocGel.cells.includes(caseIci(paysanMesh.position.x, paysanMesh.position.z))) { const v = S_.cases.find((c) => PASSABLE[c.type] && voisins(c).some((x) => blocGel.cells.includes(x))); if (v) { const q = posCase(v); paysanMesh.position.set(q.x, q.y, q.z); u.cellule = v; u.y = q.y; chemin = []; } }
        blocGel.cells.forEach((c) => rendreCase(c.id)); }
      assurerGeliere().then(() => { construireBatiments(); rendreCasesBulles(); }); sauver();
      if (n === 0) { fermerModale(); toast('La Gelière est construite ! Achète ta première Gelée à l\'HDV, catégorie Gelées.', 'or'); rendreHaut(); ouvrirGeliere(); return; }
    }
    if (id === 'epouvantail') { equiperEpouvantail(); if (n + 1 === 3) toast('L\'épouvantail porte une arbalète : il tire seul sur les Tofus qui picorent, avec les flèches de ta réserve.', 'or'); if (n + 1 === 5) toast('PÉPITO-TRON en ligne. Les Tofus de ta ferme ont été prévenus.', 'or'); }
    if (id === 'nivPuits' && capaciteCiterne()) { S_.citerne = capaciteCiterne(); toast('Citerne d\'arrosage : ' + capaciteCiterne() + ' arrosages, livrée pleine. Elle se remplit au puits.', 'or'); }
    if (NIVBAT[id] || id === 'arbalete') { construireBatiments(); if (id === 'voliere') appliquerVoliere(); if (id === 'enclos') appliquerEnclos(); }
    if (id === 'arbalete') { if (n === 0) { S_.carreaux = capaciteArbalete(); toast('L\'arbalète est montée sur le toit de la grange, armée de ' + S_.carreaux + ' carreaux.', 'or'); } construireArbalete(); rendreArbaleteBulle(); }
    if (id === 'arbalete' && n > 0) toast('Arbalète : ' + degatsArbalete() + ' dégâts, ' + capaciteArbalete() + ' carreaux chargés au plus, un tir toutes les ' + String(cadenceArbalete()).replace('.', ',') + ' s.', 'or');
    rendreHaut(); rendreBouftous();
    ({ enclos: ouvrirEnclos, voliere: ouvrirVoliere, geliere: ouvrirGeliere, grange: ouvrirGrange, epouvantail: ouvrirEpouvantail, puits: ouvrirPuits }[modaleOuverte] || (() => ouvrirHdv('ameliorer')))();
  },
  construireParcelle(id) {
    const p = S_.cases.find((c) => c.id === id); if (!p || p.type !== 'libre') return;
    if (parcelles() >= quotaParcelles()) { toast('Quota atteint : ' + parcelles() + ' parcelles sur ' + quotaParcelles() + '. Déplace une parcelle, ou achète un terrain pour en labourer plus.', 'alerte'); return; }
    const cout = PRIX_PARCELLE[Math.min(S_.parcellesAchetees, PRIX_PARCELLE.length - 1)];
    if (S_.kamas < cout) { toast('Une parcelle coûte ' + fmt(cout) + ' kamas ici.'); return; }
    S_.kamas -= cout; S_.parcellesAchetees++; compter('parcelles'); Object.assign(p, { type: 'champ', prixPaye: cout }, champVide());
    toast('Nouvelle parcelle labourée.', 'or'); fermerModale(); rendreCase(p.id); rendreHaut();
  },
  deplacerVers(dest) {
    const src = aDeplacer; if (!src) return;
    if (dest === src) { toast('Choisis une autre case.'); return; }
    if (dest.type !== 'libre') { toast('Il faut une case d\'herbe libre.', 'alerte'); return; }
    if (S_.sauvage && S_.sauvage.id === dest.id) { toast('Un Tofu sauvage est posé là, chasse-le d\'abord.'); return; }
    const champ = {}; ['c', 'pousse', 'arrose', 'pretDepuis', 'tofu', 'vole', 'tofuParti', 'picore', 'prixPaye'].forEach((k) => { champ[k] = src[k]; delete src[k]; });
    src.type = 'libre'; Object.assign(dest, { type: 'champ' }, champ);
    rendreCase(src.id); rendreCase(dest.id); rendreCasesBulles(); toast('Parcelle déplacée.', 'or');
    aDeplacer = dest; majBandeau(); sauver(); /* il reste choisi : on peut le redeplacer jusqu'a Terminer */
  },
  deplacerBatiment(cible) {
    if (aDeplacer && aDeplacer.piece !== undefined) { /* une lanterne quitte sa place d'origine : elle devient une decoration sur une case */
      const k = aDeplacer.piece, R = MODELES.piecesIle[k];
      if (cible.type !== 'libre' || (S_.sauvage && S_.sauvage.id === cible.id)) { toast('Il faut une case d\'herbe libre.', 'alerte'); return; }
      const deja = inaccessibles(), avant = avantCases([cible]); cible.type = 'deco'; if (refuserSiBloque(deja, avant)) return;
      Object.assign(cible, { deco: R.genre, ile: k, rotD: 0 }); delete S_.ileLibre[k]; rendreCase(cible.id); construireDecos(); son('planter'); aDeplacer = { deco: cible }; majBandeau(); sauver(); return;
    }
    if (aDeplacer && aDeplacer.deco) { /* une decoration : une seule case, elle emporte son genre et son orientation */
      const src = aDeplacer.deco; if (cible === src) { toast('Choisis une autre case.'); return; }
      if (cible.type !== 'libre' || (S_.sauvage && S_.sauvage.id === cible.id)) { toast('Il faut une case d\'herbe libre.', 'alerte'); return; }
      const deja = inaccessibles(), avant = avantCases([src, cible]); src.type = 'libre'; cible.type = 'deco'; if (refuserSiBloque(deja, avant)) return;
      ['deco', 'rotD', 'ile'].forEach((x) => { if (src[x] !== undefined) cible[x] = src[x]; delete src[x]; }); delete src.orig;
      rendreCase(src.id); rendreCase(cible.id); construireDecos(); son('planter'); aDeplacer = { deco: cible }; majBandeau(); sauver(); return;
    }
    if (aDeplacer && aDeplacer.arbre) { /* replanter un arbre sur une case d'herbe libre */
      const nom = aDeplacer.arbre; S_.arbres = S_.arbres || {}; const st = S_.arbres[nom] || (S_.arbres[nom] = {});
      if (cible.type !== 'libre' || (S_.sauvage && S_.sauvage.id === cible.id)) { toast('Il faut une case d\'herbe libre.', 'alerte'); return; }
      const ancienne = st.cell ? S_.cases.find((x) => x.id === st.cell && x.type === 'arbre') : null, deja = inaccessibles(), avant = avantCases([ancienne, cible]);
      if (ancienne) { ancienne.type = 'libre'; delete ancienne.arbre; } cible.type = 'arbre'; cible.arbre = nom;
      if (refuserSiBloque(deja, avant)) return;
      st.cell = cible.id; delete st.orig; if (ancienne) rendreCase(ancienne.id); rendreCase(cible.id); construireArbres(); toast('L\'arbre est replanté.', 'or'); majBandeau(); sauver(); return;
    }
    if (aDeplacer && aDeplacer.tour) { /* une tour : une seule case */
      const src = aDeplacer.tour; if (cible === src) { toast('Choisis une autre case.'); return; }
      if (cible.type !== 'libre' || (S_.sauvage && S_.sauvage.id === cible.id)) { toast('Il faut une case d\'herbe libre.', 'alerte'); return; }
      const deja = inaccessibles(), avant = avantCases([src, cible]); src.type = 'libre'; cible.type = 'tour'; if (refuserSiBloque(deja, avant)) return;
      if (S_.bats && S_.bats['tour:' + src.id]) { S_.bats['tour:' + cible.id] = S_.bats['tour:' + src.id]; delete S_.bats['tour:' + src.id]; } /* ses degats le suivent */
      cible.prixPaye = src.prixPaye; delete src.prixPaye; cible.niv = src.niv; delete src.niv; rendreCase(src.id); rendreCase(cible.id); construireTours(); toast('La tour a déménagé.', 'or'); aDeplacer = { tour: cible }; majBandeau(); sauver(); return;
    }
    const type = aDeplacer && aDeplacer.bat; if (!type) return;
    const o = blocBati(type), cells = essaiPose(type, cible);
    if (!cells) { toast('Pas la place ici : il faut ' + o.w + ' x ' + o.h + ' case' + (o.w * o.h > 1 ? 's' : '') + ' d\'herbe libre' + (o.w * o.h > 1 ? 's' : '') + ', au même niveau.', 'alerte'); return; }
    const deja = inaccessibles(), anciennes = o.B.slice(), avant = avantCases(anciennes.concat(cells)); anciennes.forEach((c) => { c.type = 'libre'; }); cells.forEach((c) => { c.type = type; });
    if (refuserSiBloque(deja, avant)) return;
    const u = paysanMesh.userData; if (cells.includes(u.cellule) || cells.includes(caseIci(paysanMesh.position.x, paysanMesh.position.z))) { const v = S_.cases.find((c) => PASSABLE[c.type] && voisins(c).some((x) => cells.includes(x))); if (v) { const q = posCase(v); paysanMesh.position.set(q.x, q.y, q.z); u.cellule = v; u.y = q.y; chemin = []; } } /* il s'ecarte */
    anciennes.concat(cells).forEach((c) => rendreCase(c.id));
    construireBatiments(); if (type === 'voliere') appliquerVoliere(); rendreCasesBulles();
    toast(BATIS[type][0].toUpperCase() + BATIS[type].slice(1) + ' a déménagé.', 'or'); majBandeau(); sauver();
  },
  rangerDeco() { /* Ranger : la decoration (ou l'arbre) choisie part dans « Mes décorations », sa case redevient de l'herbe */
    S_.decos = S_.decos || {};
    if (aDeplacer && aDeplacer.deco) { const c = aDeplacer.deco, k = c.deco; if (c.type !== 'deco' || !DECOS[k]) return;
      S_.decos[k] = nbDecos(k) + 1; c.type = 'libre'; ['deco', 'rotD', 'ile', 'orig'].forEach((x) => { delete c[x]; });
      rendreCase(c.id); construireDecos(); toast(DECOS[k].nom + ' ' + accordDeco(k, 'rangé') + ' dans tes décorations.', 'or'); }
    else if (aDeplacer && aDeplacer.piece !== undefined) { const k = MODELES.piecesIle[aDeplacer.piece].genre; delete S_.ileLibre[aDeplacer.piece]; S_.decos[k] = nbDecos(k) + 1; construireDecos(); toast(DECOS[k].nom + ' ' + accordDeco(k, 'rangé') + ' dans tes décorations.', 'or'); }
    else if (aDeplacer && aDeplacer.arbre) { /* un arbre de l'ile revient comme l'arbre du meme genre (Pommier, Sapin, Arbre rond) */
      const nom = aDeplacer.arbre, A = (MODELES.arbres || []).find((x) => x.nom === nom), k = (A && A.genre) || 'arbre_rond'; S_.arbres = S_.arbres || {}; const st = S_.arbres[nom] || (S_.arbres[nom] = {});
      const c = st.cell ? S_.cases.find((x) => x.id === st.cell && x.type === 'arbre') : null; if (c) { c.type = 'libre'; delete c.arbre; rendreCase(c.id); }
      delete st.cell; delete st.orig; st.range = true; S_.decos[k] = nbDecos(k) + 1; construireArbres(); toast(DECOS[k].nom + ' ' + accordDeco(k, 'rangé') + ' dans tes décorations.', 'or'); }
    else return;
    son('planter'); aDeplacer = null; mode = 'choisir'; majBandeau(); rendreHaut(); sauver();
  },
  poserDeco(p) { /* depuis « Mes décorations » : sur une case d'herbe libre, puis elle reste choisie pour l'ajuster */
    const k = aPoser; if (!DECOS[k]) return;
    if (!nbDecos(k)) { toast('Plus de ' + DECOS[k].nom + ' dans tes décorations.'); mode = null; majBandeau(); rendreHaut(); return; }
    if (p.type !== 'libre' || (S_.sauvage && S_.sauvage.id === p.id)) { toast('Il faut une case d\'herbe libre.', 'alerte'); return; }
    const deja = inaccessibles(), avant = avantCases([p]); p.type = 'deco'; if (refuserSiBloque(deja, avant)) return;
    p.deco = k; p.rotD = 0; S_.decos[k]--; son('planter'); rendreCase(p.id); construireDecos();
    toast('Décoration posée. Touche une autre case pour ' + DECOS[k].pr + ' déplacer, ou Terminer.', 'or');
    aDeplacer = { deco: p }; mode = 'deplacerBat'; majBandeau(); rendreHaut(); sauver();
  },
  acheterDeco(k) {
    const D = DECOS[k]; if (!D) return;
    if (niveau(S_.xp) < D.niv) { toast(D.nom + ' : niveau ' + D.niv + '.'); return; }
    if (S_.kamas < D.prix) { toast('Il te manque ' + fmt(D.prix - S_.kamas) + ' kamas.'); return; }
    S_.kamas -= D.prix; S_.decos = S_.decos || {}; S_.decos[k] = nbDecos(k) + 1; son('kamas'); assurerDecos();
    toast(D.nom + ' : dans tes décorations, pose-' + D.pr + ' où tu veux.', 'or'); rendreHaut(); ouvrirHdv('acheter'); sauver();
  },
  tournerBatiment() { /* un quart de tour ; un batiment pas carre change d'emprise, il faut la place */
    if (mode === 'enclosDeplacer') { ACTIONS.tournerEnclos(); return; }
    if (aDeplacer && aDeplacer.deco) { const c = aDeplacer.deco; c.rotD = ((c.rotD || 0) + 1) % 4; construireDecos(); sauver(); return; }
    if (aDeplacer && aDeplacer.arbre) { S_.arbres = S_.arbres || {}; const st = S_.arbres[aDeplacer.arbre] || (S_.arbres[aDeplacer.arbre] = {}); st.rot = ((st.rot || 0) + 1) % 4; construireArbres(); sauver(); return; }
    const type = aDeplacer && aDeplacer.bat; if (!type) return; const o = blocBati(type); if (!o) return;
    const cells = o.w === o.h ? o.B.slice() : essaiPose(type, o.c0, o.h, o.w);
    if (!cells) { toast('Pas la place pour le tourner ici : déplace-le d\'abord.', 'alerte'); return; }
    const deja = inaccessibles(), anciennes = o.B.slice(), avant = avantCases(anciennes.concat(cells)); anciennes.forEach((c) => { c.type = 'libre'; }); cells.forEach((c) => { c.type = type; });
    if (refuserSiBloque(deja, avant)) return;
    S_.rot = S_.rot || {}; S_.rot[type] = ((S_.rot[type] || 0) + 1) % 4;
    anciennes.concat(cells).forEach((c) => rendreCase(c.id)); construireBatiments(); if (type === 'voliere') appliquerVoliere(); rendreCasesBulles(); majBandeau(); sauver();
  },
  caseEnclos(p) {
    const E = casesEnclos();
    if (p.type === 'enclos') {
      if (E.length - 1 < minCasesEnclos()) { toast('Il faut au moins 2 cases par Bouftou : tes ' + S_.bouftous.length + ' Bouftous ont besoin de ' + minCasesEnclos() + ' cases.', 'alerte'); return; }
      if (!connexe(E.filter((c) => c !== p))) { toast('L\'enclos doit rester d\'un seul tenant.', 'alerte'); return; }
      p.type = 'libre';
    } else if (p.type === 'libre') {
      if (!ajoutablesEnclos().includes(p)) { toast('Touche un + : une case d\'herbe collée à l\'enclos. Pour l\'emmener ailleurs : Déplacer tout l\'enclos.'); return; } /* (avant : une case loin de l'enclos le faisait demenager par surprise) */
      if (E.length >= maxCasesEnclos()) { toast('L\'enclos est plein (' + E.length + '/' + maxCasesEnclos() + ' cases) : rends d\'abord une case (−), ou améliore l\'enclos pour en avoir plus.', 'alerte'); return; }
      const deja = inaccessibles(), avant = avantCases([p]); p.type = 'enclos'; if (refuserSiBloque(deja, avant)) return; ecarterPerso([p]);
    } else { toast('Il faut une case d\'herbe libre.'); return; }
    rendreCase(p.id); appliquerEnclos(); majBandeau(); rendreHaut(); rendreEnclosBulles(); son('planter'); sauver();
  },
  enclosAuto() { /* le bouton « Placer toutes seules » de la fenetre de l'enclos */
    const k = agrandirEnclosAuto(); appliquerEnclos(); rendreEnclosBulles(); rendreHaut(); sauver();
    toast(k ? k + ' case' + (k > 1 ? 's' : '') + ' ajoutée' + (k > 1 ? 's' : '') + ' à l\'enclos, collée' + (k > 1 ? 's' : '') + ' à lui.' : 'Pas de place autour de l\'enclos : libère de l\'herbe à côté de lui (Aménager).', k ? 'or' : 'alerte'); ouvrirEnclos();
  },
  deplacerEnclos(p, ordre) { /* tout l'enclos demenage avec sa forme, sa case du milieu sur la case touchee ; tourne tout seul s'il ne rentre pas (ordre : Tourner) */
    const E = casesEnclos(); if (!E.length || (p.type !== 'libre' && !ordre)) return;
    if (S_.sauvage && S_.sauvage.id === p.id) { toast('Un Tofu sauvage est posé là, chasse-le d\'abord.'); return; }
    const cells = placeEnclos(p, ordre);
    if (!cells) { toast(ordre ? 'Pas la place pour le tourner ici : déplace-le d\'abord.' : 'Pas la place ici : il faut ' + E.length + ' cases d\'herbe libres autour, dans la forme de l\'enclos, au même niveau. Essaie plus au large.', 'alerte'); return; }
    const deja = inaccessibles(), avant = avantCases(E.concat(cells)); E.forEach((c) => { c.type = 'libre'; }); cells.forEach((c) => { c.type = 'enclos'; }); if (refuserSiBloque(deja, avant)) return;
    ecarterPerso(cells);
    E.concat(cells).forEach((c) => rendreCase(c.id));
    erre.forEach((e) => { if (e) Object.assign(e, pointEnclos(), { cible: null }); }); /* les Bouftous suivent leur enclos */
    appliquerEnclos(); majBandeau(); rendreHaut(); rendreEnclosBulles(); son('planter'); toast(ordre ? 'L\'enclos a tourné.' : 'L\'enclos a déménagé, Bouftous compris.', 'or'); sauver();
  },
  tournerEnclos() { const E = casesEnclos(); if (E.length) ACTIONS.deplacerEnclos(milieuEnclos(E), [1, 2, 3]); },
  construireTour(id) {
    const p = S_.cases.find((c) => c.id === id); if (!p || p.type !== 'libre') return;
    if (niveau(S_.xp) < NIV_TOUR) { toast('Les tours de défense se débloquent au niveau ' + NIV_TOUR + ' de Paysan.'); return; }
    if (nbTours() >= TOURS_MAX) { toast('Tu as déjà ' + TOURS_MAX + ' tours de défense.', 'alerte'); return; }
    const cout = PRIX_TOUR[nbTours()]; if (S_.kamas < cout) { toast('Une tour coûte ' + fmt(cout) + ' kamas.'); return; }
    const deja = inaccessibles(), avant = avantCases([p]); p.type = 'tour'; if (refuserSiBloque(deja, avant)) return;
    S_.kamas -= cout; p.prixPaye = cout; p.niv = 1; fermerModale(); rendreCase(p.id); construireTours(); rendreHaut(); if (mode === 'poserTour') { mode = null; majBandeau(); }
    toast('Tour de défense construite : elle tire seule, avec les flèches de ta réserve (' + S_.fleches + ').', 'or'); sauver();
  },
  ameliorerTour(id) {
    const p = caseTour(id); if (!p) return; const n = nivTour(p); if (n >= 4) return;
    const prix = NIV_TOURS.prix[n]; if (niveau(S_.xp) < NIV_TOURS.nivs[n]) { toast('Il faut le niveau ' + NIV_TOURS.nivs[n] + ' de Paysan.'); return; }
    if (S_.kamas < prix) { toast('Il manque ' + fmt(prix - S_.kamas) + ' kamas.'); return; }
    S_.kamas -= prix; p.niv = n + 2; p.prixPaye = (p.prixPaye || PRIX_TOUR[0]) + prix; compter('amelios'); son('quete');
    toast('Tour de défense : niveau ' + p.niv + ' ! ' + NIV_TOURS.deg[n + 1] + ' dégâts, ' + enCases(NIV_TOURS.portee[n + 1]) + ' cases de portée.', 'or');
    construireTours(); majBarresBat(); rendreHaut(); ouvrirTour(p); sauver();
  },
  demonterTour(id) {
    const p = S_.cases.find((c) => c.id === id); if (!p || p.type !== 'tour') return;
    const rendu = Math.round((p.prixPaye || PRIX_TOUR[0]) / 2); p.type = 'libre'; delete p.prixPaye; delete p.niv; S_.kamas += rendu; if (S_.bats) delete S_.bats['tour:' + p.id];
    fermerModale(); rendreCase(p.id); construireTours(); rendreHaut(); toast('Tour démontée : ' + fmt(rendu) + ' kamas rendus.', 'or'); sauver();
  },
  remettreEnHerbe(id) {
    const p = S_.cases.find((c) => c.id === id); if (!p || !parcelleAjoutee(p)) return;
    const rendu = Math.round((p.prixPaye || 0) / 2);
    ['c', 'pousse', 'arrose', 'pretDepuis', 'tofu', 'vole', 'tofuParti', 'picore', 'prixPaye'].forEach((k) => delete p[k]);
    p.type = 'libre'; S_.kamas += rendu; if (rendu) S_.parcellesAchetees = Math.max(0, S_.parcellesAchetees - 1);
    fermerModale(); rendreCase(p.id); rendreCasesBulles(); rendreHaut(); toast('La case redevient de l\'herbe' + (rendu ? ' : ' + fmt(rendu) + ' kamas rendus.' : '. Tu peux labourer ailleurs.'), 'or'); sauver();
  },
  equiper(id) {
    const o = obj(id); if (!o || !(S_.sac[id] > 0)) return;
    if (niveau(S_.xp) < o.niv) { toast(o.nom + ' : il faut le niveau ' + o.niv + '.'); return; }
    if (o.classe && o.classe !== classeDe()) { toast(o.nom + ' : arme du ' + nomClasse(o.classe) + ', tu peux la revendre.'); return; }
    const avant = S_.equip[o.emp]; setTimeout(() => compter('equipes', 0), 0); S_.sac[id]--; if (!S_.sac[id]) delete S_.sac[id]; if (avant) S_.sac[avant] = (S_.sac[avant] || 0) + 1; S_.equip[o.emp] = id;
    toast(o.nom + ' équipé' + (o.emp === 'coiffe' || o.emp === 'cape' || o.emp === 'amulette' || o.emp === 'ceinture' || o.emp === 'arme' ? 'e' : o.emp === 'bottes' ? 'es' : '') + '.', 'or'); ouvrirPerso(o.emp); sauver(); if (o.emp === 'coiffe' || o.emp === 'cape' || o.emp === 'arme') rafraichirTenue();
  },
  retirer(emp) { const id = S_.equip[emp]; if (!id) return; S_.sac[id] = (S_.sac[id] || 0) + 1; delete S_.equip[emp]; ouvrirPerso(emp); sauver(); if (emp === 'coiffe' || emp === 'cape' || emp === 'arme') rafraichirTenue(); },
  revendreObjet(id) {
    if (!(S_.sac[id] > 0)) return; const o = obj(id), gain = reventeObjet(id); S_.sac[id]--; if (!S_.sac[id]) { delete S_.sac[id]; if (S_.jets) delete S_.jets[id]; } S_.kamas += gain;
    toast(o.nom + ' revendu' + (o.emp === 'coiffe' || o.emp === 'cape' || o.emp === 'amulette' || o.emp === 'ceinture' || o.emp === 'arme' ? 'e' : o.emp === 'bottes' ? 'es' : '') + ' : +' + fmt(gain) + ' kamas.'); rendreHaut(); if (modaleOuverte === 'perso') ouvrirPerso(o.emp); else ouvrirGrange(); sauver();
  },
  reparer(cle) {
    if (combat || !degatsBat(cle) || enRuine(cle)) return; const cout = coutReparer(cle);
    if (S_.kamas < cout) { toast('La réparation coûte ' + fmt(cout) + ' kamas.'); return; }
    const z = zoneBat(cle); fermerModale();
    const fini = () => { if (!degatsBat(cle) || S_.kamas < cout) return; S_.kamas -= cout; S_.bats[cle].deg = 0; majFeu(cle); majBarresBat(); if (z) { pouf(z.x, z.y, z.z, 3, '#fff3c4'); } toast(Maj(nomBat(cle)) + ' est réparé' + (typeCle(cle) === 'grange' || typeCle(cle) === 'tour' ? 'e' : '') + ' : ' + fmt(pvMaxBat(cle)) + ' PV.', 'or'); rendreHaut(); sauver(); };
    if (z) allerPuis(z.cell, fini); else fini();
  },
  reconstruire(cle) {
    if (combat || !enRuine(cle)) return; const cout = coutReconstruire(cle);
    if (S_.kamas < cout) { toast('La reconstruction coûte ' + fmt(cout) + ' kamas.'); return; }
    const z = zoneBat(cle); fermerModale();
    const fini = () => { if (!enRuine(cle) || S_.kamas < cout) return; S_.kamas -= cout; delete S_.bats[cle]; majFeu(cle, true); majBarresBat(); if (typeCle(cle) === 'grange') rendreArbaleteBulle(); if (z) { pouf(z.x, z.y, z.z, 4, '#fff3c4'); pouf(z.x, z.y, z.z, 2, '#f2b630'); } toast(Maj(nomBat(cle)) + ' est reconstruit' + (typeCle(cle) === 'grange' || typeCle(cle) === 'tour' ? 'e' : '') + ', tout neuf !', 'or'); gagnerXp(10); rendreHaut(); sauver(); };
    if (z) allerPuis(z.cell, fini); else fini();
  },
  reparerDansBilan(cles) { /* depuis le bilan (vague, simu) : tout de suite, sur place, et la fenetre reste ouverte (le moins cher d'abord si les kamas manquent) */
    if (combat) return;
    const L = cles.filter((k) => degatsBat(k) || enRuine(k)).map((k) => ({ k, ruine: enRuine(k), cout: enRuine(k) ? coutReconstruire(k) : coutReparer(k) })).sort((a, b) => a.cout - b.cout);
    if (!L.length) { toast('Tout est déjà réparé : rien à payer.'); majReparationsModale(); return; } /* (un bilan relu : plus rien a faire) */
    let faits = 0, paye = 0;
    L.forEach((x) => {
      if (S_.kamas < x.cout) return; S_.kamas -= x.cout; paye += x.cout; faits++;
      if (x.ruine) { delete S_.bats[x.k]; majFeu(x.k, true); gagnerXp(10); if (typeCle(x.k) === 'grange') rendreArbaleteBulle(); } else { S_.bats[x.k].deg = 0; majFeu(x.k); }
      const z = zoneBat(x.k); if (z) pouf(z.x, z.y, z.z, 3, '#fff3c4');
      document.querySelectorAll('.modale [data-reparer="' + x.k + '"], .modale [data-reconstruire="' + x.k + '"]').forEach((e) => {
        const ligne = e.closest('.art'), d = ligne && ligne.querySelector('.desc'); if (d) d.textContent = (x.ruine ? 'Reconstruit : ' : 'Réparé : ') + fmt(pvMaxBat(x.k)) + ' PV sur ' + fmt(pvMaxBat(x.k)) + '.';
        e.outerHTML = '<span class="cadenas">✓ ' + (x.ruine ? 'Reconstruit' : 'Réparé') + '</span>'; });
    });
    majBarresBat(); rendreHaut(); sauver();
    const tb = document.querySelector('.modale [data-tout-reparer]');
    if (tb) { const reste = tb.dataset.toutReparer.split(',').filter((k) => degatsBat(k) || enRuine(k)), total = reste.reduce((t, k) => t + (enRuine(k) ? coutReconstruire(k) : coutReparer(k)), 0);
      if (reste.length < 2) tb.parentNode.remove(); else { tb.dataset.toutReparer = reste.join(','); tb.innerHTML = 'Tout réparer ' + fmt(total) + ' ' + KAMA; } }
    if (!faits) { toast('Il faut ' + fmt(L.length ? L[0].cout : 0) + ' kamas pour cette réparation.'); return; }
    son('kamas'); toast(faits === L.length ? (faits > 1 ? 'Tout est réparé : ' : Maj(nomBat(L[0].k)) + (L[0].ruine ? ' est reconstruit : ' : ' est réparé : ')) + fmt(paye) + ' kamas.' : faits + ' bâtiment' + (faits > 1 ? 's' : '') + ' réparé' + (faits > 1 ? 's' : '') + ' pour ' + fmt(paye) + ' kamas. Il en reste ' + (L.length - faits) + ', faute de kamas.', 'or');
  },
  toutReparer(cles) { /* le bouton « Tout réparer » : tout d'un coup, sans aller jusqu'a chaque batiment ; le moins cher d'abord si les kamas manquent */
    if (combat) return;
    const L = cles.filter((k) => degatsBat(k) || enRuine(k)).map((k) => ({ k, ruine: enRuine(k), cout: enRuine(k) ? coutReconstruire(k) : coutReparer(k) })).sort((a, b) => a.cout - b.cout);
    let faits = 0, paye = 0;
    L.forEach((x) => {
      if (S_.kamas < x.cout) return; S_.kamas -= x.cout; paye += x.cout; faits++;
      if (x.ruine) { delete S_.bats[x.k]; majFeu(x.k, true); gagnerXp(10); if (typeCle(x.k) === 'grange') rendreArbaleteBulle(); } else { S_.bats[x.k].deg = 0; majFeu(x.k); }
      const z = zoneBat(x.k); if (z) pouf(z.x, z.y, z.z, 3, '#fff3c4');
    });
    majBarresBat(); fermerModale(); rendreHaut(); sauver();
    if (!faits) { toast('Il faut ' + fmt(L.length ? L[0].cout : 0) + ' kamas pour commencer les réparations.'); return; }
    toast(faits === L.length ? 'Tout est réparé : ' + fmt(paye) + ' kamas.' : faits + ' bâtiment' + (faits > 1 ? 's' : '') + ' réparé' + (faits > 1 ? 's' : '') + ' pour ' + fmt(paye) + ' kamas. Il en reste ' + (L.length - faits) + ', faute de kamas.', 'or');
  },
  acheterTerrain(k) {
    const t = TERRAINS[k]; if (!t || S_.terrains[t.id]) return;
    if (!aVendre(t)) { const u = prochainTerrain(); toast('Les terrains s\u2019achètent dans l\u2019ordre : d\u2019abord celui du niveau ' + u.niv + '.'); return; }
    if (!nivTerrainOk(t)) { toast('Ce terrain s\u2019achète à partir du niveau ' + t.niv + ' de Paysan.'); return; }
    if (S_.kamas < t.prix) { toast('Ce terrain (' + t.cases.length + ' cases, +' + t.parcelles + ' parcelles) coûte ' + fmt(t.prix) + ' kamas.'); return; }
    S_.kamas -= t.prix; S_.terrains[t.id] = true; compter('terrains');
    t.cases.forEach(([i, j]) => { if (!caseAt(i, j)) S_.cases.push({ id: idCase(i, j), i, j, terrain: 'main', type: 'libre' }); });
    toast('Terrain défriché : ' + t.cases.length + ' cases de plus, ' + quotaParcelles() + ' parcelles possibles au total.', 'or');
    construireTerrain(k); if (combat) combat.bords = null; /* les monstres sortent maintenant du nouveau bord */
    rendreHaut(); placerBulles();
  }
};

