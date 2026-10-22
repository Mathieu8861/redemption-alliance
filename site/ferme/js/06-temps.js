'use strict';
/* ===================== LOGIQUE TEMPS REEL ===================== */
function avancer(maintenant, enDirect) {
  const dt = borne(maintenant - S_.vu, 0, 10 * 3600e3); /* la ferme vit 10 h sans toi, puis s'arrete */
  /* « y'a plus de Tofu qui apparaissent, meme en x40 » (Mathieu, 11/10/2026) : ce qui arrive en direct (Tofus, voleurs, raids, crises) exigeait
     moins de 5 s de jeu depuis le dernier passage ; avec le temps accelere, chaque passage en fait bien plus (x40 : 20 s), donc plus rien ne venait */
  const direct = enDirect && dt < 5000 * horlogeJeu.vitesse();
  S_.vu = maintenant; if (!combat) regenVie(dt / horlogeJeu.vitesse()); /* (la vie : en temps reel) */
  const ch = new Set();
  S_.cases.forEach((p) => {
    if (p.type !== 'champ' || !p.c) return;
    const c = PAR_ID[p.c], d = duree(c);
    if (p.pousse < d) {
      const avant = etape(p);
      p.pousse = Math.min(d, p.pousse + dt * (p.arrose ? 1 : 0.4));
      if (p.pousse >= d) p.pretDepuis = maintenant;
      if (etape(p) !== avant) ch.add(p.id);
    }
    if (direct) { /* les nuisibles des champs : les Tofus, et apres la vague 50 les Wabbits sur les Cawottes et les Fraises (02-donnees.js, WABBIT_MANGE) */
      if (!p.tofu) {
        const lapin = mangeWabbit(p.c), pret = recolte(p) > 1 && maintenant - (p.tofuParti || 0) > ACCALMIE_TOFU;
        if (pret && lapin && wabbitsDehors() < WABBITS_MAX && Math.random() < dt / RYTHME_WABBIT) arriveeWabbit(p, maintenant, ch); /* (l'epouvantail ne leur fait pas peur ; le leurre les attire peut-etre : 14b-leurre.js) */
        else if (pret && !lapin && tofusDehors() < TOFUS_MAX && Math.random() < (dt / RYTHME_TOFU) * [1, 0.5, 0.33, 0.33, 0.33, 0.33][Math.min(5, niv('epouvantail'))] * (enRuine('epouvantail') ? 1.8 : 1) * freinTofus()) {
          p.tofu = maintenant; p.nuisible = 'tofu'; ch.add(p.id); toast('Un Tofu picore ton ' + c.nom + ' ! Chasse-le dans les ' + dureeLisible(DUREE_PICORAGE * (niv('cloche') ? 2 : 1)) + ', sinon il te vole une récolte.', 'alerte');
        }
      } else if (maintenant - p.tofu > DUREE_PICORAGE * (niv('cloche') ? 2 : 1)) {
        p.tofu = 0; p.tofuParti = maintenant; p.vole = (p.vole || 0) + 1; ch.add(p.id);
        toast('Trop tard : le ' + (p.nuisible === 'wabbit' ? 'Wabbit file' : 'Tofu s\'envole') + ' avec 1 ' + c.nom + '. Il en restera ' + recolte(p) + ' à récolter.', 'alerte');
      }
    }
  });
  if (S_.leurreWabbit && niv('leurre') < 2 && maintenant - S_.leurreWabbit.depuis > DUREE_PICORAGE) { /* la fausse Cawotte en bois : le Wabbit se lasse et repart, sans rien voler */
    S_.leurreWabbit = null; majLeurre(); rendreCasesBulles(); if (direct) toast('Le Wabbit en a assez de ronger du bois : il repart sur son île, sans rien t\'avoir volé.');
  }
  let encl = false, hdv = false;
  S_.bouftous.forEach((b) => {
    if (niv('mangeoire') && maintenant >= b.rassasie && (S_.grange.ble || 0) >= repasDe(b)) { S_.grange.ble -= repasDe(b); b.rassasie = maintenant + dureeRepasDe(b); encl = true; hdv = true; }
    if (b.ne && !adulte(b)) {
      if (b.grandi == null) b.grandi = Math.max(0, maintenant - dt - b.ne);
      b.grandi += Math.max(0, Math.min(maintenant, b.rassasie) - (maintenant - dt));
      if (adulte(b)) { encl = true; toast(b.nom + ' est devenu adulte : il fera de la laine.', 'or'); }
    }
    if (b.laine < laineMax() && adulte(b)) {
      const nourri = Math.max(0, Math.min(maintenant, b.rassasie) - (maintenant - dt));
      if (nourri > 0) { b.accu += nourri * (legPorte('royal') ? 1.25 : 1); /* Couronne du Bouftou Royal : 25 % de laine en plus */ while (b.accu >= CADENCE_LAINE && b.laine < laineMax()) { b.laine++; b.accu -= CADENCE_LAINE; encl = true; } if (b.laine >= laineMax()) b.accu = 0; }
    }
    const affame = maintenant >= b.rassasie;
    if (affame !== !!b.affame) { b.affame = affame; encl = true; }
  });
  S_.bouftous.filter((b) => b.gestation && maintenant >= b.gestation.fin).forEach((m) => { naissance(m); encl = true; hdv = true; }); /* les naissances (15/10/2026) */
  let sauv = false;
  if (S_.tofus > 0 && !enRuine('voliere')) { /* la voliere : chaque Tofu donne une plume toutes les 90 min, deux en attente au plus par Tofu */
    const max = S_.tofus * plumesParTofu(), v = S_.voliere;
    if (v.plumes < max) { v.accu += dt * S_.tofus; while (v.accu >= CADENCE_PLUME && v.plumes < max) { v.plumes++; v.accu -= CADENCE_PLUME; sauv = true; } if (v.plumes >= max) v.accu = 0; } /* (« bug sur le spawn de plume », testeurs, 12/10/2026 : l'horloge avancait au meme pas avec 1 ou 6 Tofus) */
  }
  if (direct) { /* de temps en temps un Tofu sauvage se pose dans l'herbe libre : on l'attrape au filet */
    if (S_.sauvage && maintenant >= S_.sauvage.fin) { S_.sauvage = null; sauv = true; }
    else if (!S_.sauvage && Math.random() < (dt / MIN) / 2.25 * freinTofus()) {
      const libres = S_.cases.filter((c) => c.type === 'libre');
      if (libres.length) { S_.sauvage = { id: hasard(libres).id, fin: maintenant + DUREE_SAUVAGE }; sauv = true; toast('Un Tofu sauvage se pose dans l\'herbe.' + (S_.filets ? ' Sors ton filet !' : ' Avec un filet de capture, tu pourrais l\'attraper.'), 'or'); }
    }
  }
  if (maintenant >= S_.prochainCours) {
    S_.coursAvant = Object.assign({}, S_.cours);
    VENDABLES.forEach((v) => { S_.cours[v.id] = borne((S_.cours[v.id] || 1) + (Math.random() - 0.5) * 0.14, 0.8, 1.2); });
    S_.prochainCours = maintenant + CADENCE_COURS; hdv = true;
  }
  if (S_.crise && maintenant >= S_.crise.fin) { S_.crise = null; hdv = true; }
  if (direct && !S_.crise && maintenant >= S_.prochaineCrise) {
    S_.prochaineCrise = maintenant + CADENCE_CRISE;
    const visibles = VENDABLES.filter((v) => v.id === 'laine' ? S_.bouftous.length : v.id === 'plume' ? S_.tofus : debloquee(v));
    if (Math.random() < 0.3 && visibles.length) { const v = hasard(visibles); S_.crise = { id: v.id, fin: maintenant + DUREE_CRISE }; toast('Les bots de VSA inondent l\'HDV : le prix ' + de(v.nom) + ' chute pendant une minute.', 'alerte'); hdv = true; }
  }
  let voleur = false;
  if (direct && maintenant >= S_.prochainVoleur) {
    S_.prochainVoleur = maintenant + CADENCE_VOLEUR * (0.6 + Math.random() * 0.8);
    if (valeurGrange() >= 100 && joueurPresent()) voleur = true;
  }
  if (S_.vague.prepa > maintenant + PREPA_VAGUE * MIN) S_.vague.prepa = maintenant + PREPA_VAGUE * MIN; /* (jamais plus d'1 min d'attente : une attente plus longue d'avant le 18/10/2026, meme decalee par une absence, retombe a 1 min) */
  let raid = false; /* la simu VSA : un groupe de voleurs, annonce 30 s avant (des le niveau 20) */
  if (enDirect) verifierRecouvreurs(maintenant); /* l'ardoise du Casino (meme en temps accelere) */
  if (niveau(S_.xp) < NIV_SIMU) S_.prochainRaid = Math.max(S_.prochainRaid || 0, maintenant + CADENCE_RAID); /* (avant le niveau 20, pas de simu ; la premiere, 30 min apres) */
  else if (direct && !raidAnnonce && maintenant >= S_.prochainRaid && joueurPresent()) { /* absent : le raid attend son retour */
    S_.prochainRaid = maintenant + CADENCE_RAID;
    if (valeurGrange() >= 150) raid = true;
  }
  return { cases: ch, enclos: encl, hdv, sauvage: sauv, voleur, raid };
}
const valeurGrange = () => VENDABLES.reduce((t, v) => t + (S_.grange[v.id] || 0) * prix(v.id), 0);
function etape(p) { if (!p.c) return 'vide'; const d = duree(PAR_ID[p.c]); const r = p.pousse / d; return r >= 1 ? 'mur' : r >= 0.45 ? 'pousse' : 'graine'; }
const xpReel = (n) => n > 0 ? Math.max(1, Math.round(n * NERF_XP * (1 + caracs().sagesse / 100))) : n; /* ce que rapporte vraiment n points, la baisse de 10 % et la Sagesse comprises (le chiffre a afficher) */
function xpParRecolte(c) { return c.xp * NERF_XP; } /* l'XP d'une recolte : celle de la culture, fixe (16/10/2026 : plus de baisse selon le niveau ni de plafond) */
const xpRecolteReel = (c) => { /* ce que rapporte vraiment une recolte, Sagesse comprise ; la fraction se tire au sort (1,4 XP : 2 quatre fois sur dix, 1 sinon) */
  const x = xpParRecolte(c) * (1 + caracs().sagesse / 100); return Math.floor(x) + (Math.random() < x - Math.floor(x) ? 1 : 0); };
function gagnerXp(n, exact) { /* toute l'XP du jeu passe par ici (exact : deja calcule, une recolte) */
  if (n > 0 && !exact) n = xpReel(n);
  const avant = niveau(S_.xp), x0 = S_.xp; S_.xp = Math.min(S_.xp + n, Math.max(S_.xp, seuil(capNiveau()))); const apres = niveau(S_.xp); gagnerXp.dernier = S_.xp - x0; /* plus rien a gagner au niveau maximum (de la phase) */
  if (apres > avant) { if (!combat && !enAccueil) feterNiveau(apres, nouveautesNiveau(avant, apres), avant); else toast('Niveau ' + apres + ' de Paysan !', 'or'); rendreObjectif(); }
  { const t = prochainTerrain(); if (t && avant < t.niv && apres >= t.niv) { const k = TERRAINS.indexOf(t), b = document.querySelector('[data-vente="' + k + '"]'); if (b) b.remove(); bulleVente(t, k); toast('Un nouveau terrain est à vendre : ' + t.cases.length + ' cases de plus pour ta ferme !', 'or'); } }
  if (avant < NIV_ULTI && apres >= NIV_ULTI && !S_.ulti) { toast('Niveau ' + NIV_ULTI + ' : ton ulti se débloque ! Choisis-le dans la fiche des vagues.', 'or'); if (!combat && !modaleOuverte) ouvrirUlti(); }
  if (avant < NIV_GARDIEN && apres >= NIV_GARDIEN && !S_.gardien) { toast('Niveau ' + NIV_GARDIEN + ' : un gardien pour ta ferme ! Newton le chat ou Masdog le chien (HDV, onglet Construire).', 'or'); if (!combat && !modaleOuverte) ouvrirChoixGardien(); }
  rendreHaut();
}

