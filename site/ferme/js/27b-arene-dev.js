'use strict';
/* L'ARENE DEV (26/10/2026, « faudrait que tu me crees sur le cra un espace admin avec une arene.dev, un truc comme ca, visible que par moi, ou tu
   pourrais me faire tester les monstres en avant-premiere », Mathieu). Reservee a son compte (TESTEURS_ULTI, le meme que l'ulti libre), ouverte
   depuis les Options. Il choisit les monstres, leur nombre et leur vague, part a l'Arene : ils sortent des herses trois par trois, avec leur propre
   force (pas les regles de l'Arene). Rien ne se gagne ni ne se perd : ni XP, ni kamas, ni butin, ni record ; pas de ticket, de repas ni de potions ;
   sa vie d'avant est gardee. Les modeles des monstres a squelette (palier 9, Moon) ne se chargent qu'ici (chargerSquelettes). */
const estAdmin = () => ultiLibre();
const AVANT_PREMIERE = ['cheneMou', 'ancestral', 'abrakleur', 'arbreCollant', 'araknotron', 'abrakneSombre', 'abrakne', 'sombre', 'venerable', 'semeur', 'tronknyde', 'abraknyde', 'lemurienTiki', 'gorilleRoi', 'golemLune', 'tortueCorail', 'kannibJav', 'kannibSarbak', 'kannibArk', 'kannibTam', 'tortueBleue', 'tortueJaune', 'tortueRouge', 'tortueVerte', 'kannibEbil', 'moon', 'gorgouille', 'crocabulia', 'royal', 'cuirasse', 'bworker', 'craqLegendaire', 'waWabbit', 'koulosse', 'dragonCochon']; /* (31/10/2026, par Discord, « mets-moi tous les nouveaux boss dans l'arene que je teste » : les boss des paliers 1 a 8 aux sorts refaits) */ /* (la Gorgouille refaite, 30/10/2026 au soir : a tester ici) */ /* (Crocabulia, qui vole sur ses grandes ailes, 31/10/2026 : « le croca est pas dispo en arene », Mathieu) */
const GROUPES_DEV = {
  foret: { nom: 'La Forêt des Abraknydes', liste: { abraknyde: 1, sombre: 1, venerable: 1, abrakne: 1, abrakneSombre: 1, araknotron: 1 } }, /* (08/11/2026 : la troupe du palier 10, a montrer ensemble) */
  troupe: { nom: 'La troupe', liste: { tortueJaune: 1, tortueRouge: 1, kannibJav: 1, kannibSarbak: 1, kannibArk: 1, kannibTam: 1 } },
  tortues: { nom: 'Les 4 Tortues', liste: { tortueBleue: 1, tortueJaune: 1, tortueRouge: 1, tortueVerte: 1 } },
  kannibouls: { nom: 'Les Kannibouls', liste: { kannibJav: 2, kannibSarbak: 2, kannibArk: 1, kannibTam: 1 } },
  ebil: { nom: 'Ebil et sa garde', liste: { kannibEbil: 1, kannibJav: 1, tortueBleue: 1, tortueVerte: 1 } },
  moon: { nom: 'Moon', liste: { moon: 1 } },
  bossRefaits: { nom: 'Les boss refaits', liste: { royal: 1, cuirasse: 1, bworker: 1, craqLegendaire: 1, waWabbit: 1, koulosse: 1 } }, /* (31/10/2026, sorts refaits par Discord) */
  lesBoss: { nom: 'Les 9 boss', liste: { royal: 1, cuirasse: 1, bworker: 1, craqLegendaire: 1, crocabulia: 1, waWabbit: 1, koulosse: 1, dragonCochon: 1, moon: 1 } }, /* (01/11/2026, « mets-les tous en arène », Mathieu : un de chaque, dans l'ordre des paliers) */
  demiBoss: { nom: 'Les 5 demi-boss', liste: { gorgouille: 1, golemLune: 1, tortueCorail: 1, lemurienTiki: 1, kannibEbil: 1 } }, /* (le Gorille Roi n'en est plus un, 01/11/2026) */
  lemurien: { nom: 'Les Lémuriens', liste: { lemurienTiki: 3 } }, /* (28/10/2026, le premier monstre anime a la main) */
  nouveaux: { nom: 'Les 3 boss et la Tortue Corail', liste: { lemurienTiki: 1, gorilleRoi: 1, golemLune: 1, tortueCorail: 1 } }, /* (28/10/2026, les 4 dessins de Mathieu, des boss) */
};
const NB_DEV_MAX = 6;
let choixDev = null;
const etatDev = () => (choixDev = choixDev || { n: 81, liste: Object.assign({}, GROUPES_DEV.troupe.liste) });
function ouvrirAreneDev() {
  if (!estAdmin()) return;
  const E = etatDev(), total = Object.values(E.liste).reduce((a, k) => a + k, 0);
  const ligne = (t) => { const d = MONSTRES[t], k = E.liste[t] || 0; if (!d) return '';
    return '<div class="art">' + ico(d.icone) + '<div><b>' + d.nom + (d.boss ? ' <span class="puce">boss</span>' : '') + '</b><div class="desc">' + d.desc + '</div><div class="puces"><span class="puce">' + fmt(pvMonstre(t, E.n)) + ' PV</span><span class="puce">' + fmt(degMonstre(t, E.n)) + ' par coup</span><span class="puce">vitesse ' + String(vitesseMonstre(d)).replace('.', ',') + '</span></div></div>' +
      '<div class="act dev-nb"><button class="btn discret" data-dev-moins="' + t + '"' + (k ? '' : ' disabled') + '>−</button><b>' + k + '</b><button class="btn discret" data-dev-plus="' + t + '"' + (k < NB_DEV_MAX ? '' : ' disabled') + '>+</button></div></div>'; };
  ouvrirModale('arene-dev', entete('Arène dev') +
    '<p class="hdv-aide">Réservée à ton compte. Les monstres en avant-première sortent des herses de l\'Arène avec leur propre force. Rien ne se gagne ni ne se perd : ni XP, ni kamas, ni butin, ni record ; pas de ticket, de repas ni de potions ; tu rentres avec ta vie d\'avant.</p>' +
    '<div class="hdv-section">Les groupes</div><div class="puces dev-groupes">' + Object.entries(GROUPES_DEV).map(([id, g]) => '<button class="btn discret" data-dev-groupe="' + id + '">' + g.nom + '</button>').join('') + '<button class="btn discret" data-dev-groupe="vider">Vider</button></div>' +
    (() => { const L = LEGENDAIRES.find((x) => x.cle === 'moon'), o = L && OBJETS[idLeg(L)]; return o ? '<div class="hdv-section">Essayer une arme légendaire</div><p class="hdv-aide">Le temps du combat seulement : elle remplace ton arme, sort en touche 4, puis tu retrouves la tienne.</p><div class="puces dev-groupes"><button class="btn ' + (E.essai === 'moon' ? 'kamas' : 'discret') + '" data-dev-essai="moon">' + (E.essai === 'moon' ? '✓ ' : '') + o.nom + '</button></div>' : ''; })() + /* (« bouton admin Arene dev », choix de Mathieu, 02/11/2026) */
    "<div class=\"hdv-section\">Les vagues 91 à 100 : la Forêt des Abraknydes</div><p class=\"hdv-aide\">La vraie composition de chaque vague, à sa force (pas encore ouvertes aux joueurs). La 100 : la horde, puis l'Ancestral et sa garde, puis le Chêne Mou.</p><div class=\"puces dev-groupes\">" +
      Array.from({ length: 10 }, (_, i) => 91 + i).map((n) => '<button class="btn ' + (E.vague === n ? 'kamas' : 'discret') + '" data-dev-vague="' + n + '">' + n + '</button>').join('') + '</div>' +
    '<div class="hdv-section">La force des monstres : vague ' + E.n + '</div><div class="act dev-nb"><button class="btn discret" data-dev-n="-1"' + (E.n > 1 ? '' : ' disabled') + '>−</button><b>vague ' + E.n + '</b><button class="btn discret" data-dev-n="1"' + (E.n < 100 ? '' : ' disabled') + '>+</button></div>' +
    '<div class="hdv-section">Vitesse des animations de Moon</div><p class="hdv-aide">Les Kannibouls sont réglés à ×1,75 et les Tortues à ×1,25, comme tu l\'as choisi. Reste Moon : choisis celle qui te paraît juste, elle sera mise pour tout le monde.</p><div class="puces dev-groupes">' +
      [1, 1.25, 1.5, 1.75].map((x) => '<button class="btn ' + (VITESSE_ANIM === x ? 'kamas' : 'discret') + '" data-dev-vit="' + x + '">×' + String(x).replace('.', ',') + '</button>').join('') + '</div>' +
    '<div class="hdv-section">Les monstres du palier 10 : deux versions</div><p class="hdv-aide">A : la version réaliste (écorce détaillée). B : la version à la DA du jeu (aplats, couleurs franches, contours marqués). Même forme, mêmes mouvements ; ça change aussi les monstres déjà en combat.</p><div class="puces dev-groupes">' +
      [['A', 'Version A (réaliste)'], ['B', 'Version B (DA du jeu)']].map(([v, t]) => '<button class="btn ' + (VERSION_P10 === v ? 'kamas' : 'discret') + '" data-dev-version="' + v + '">' + t + '</button>').join('') + '</div>' +
    '<div class="hdv-section">Les monstres en avant-première</div>' + AVANT_PREMIERE.map(ligne).join('') +
    '<div class="act-bas"><small>' + total + ' monstre' + (total > 1 ? 's' : '') + '</small><button class="btn kamas" data-montgolfiere="lancerDev"' + (total ? '' : ' disabled') + '>Lancer</button></div>');
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-dev-plus],[data-dev-moins],[data-dev-groupe],[data-dev-n],[data-dev-vit],[data-dev-essai],[data-dev-version],[data-dev-vague]'); if (!b || !estAdmin()) return;
  const E = etatDev();
  if (b.dataset.devVague) { const n = +b.dataset.devVague; E.vague = n; E.n = n; E.liste = {}; compoVague(n).forEach(([t, k]) => { E.liste[t] = (E.liste[t] || 0) + k; }); } /* (la vague telle qu'elle arrive a la ferme, horde comprise, 08/11/2026) */ /* (une vraie vague du palier 10, 08/11/2026) */
  else if (b.dataset.devPlus || b.dataset.devMoins || b.dataset.devGroupe) E.vague = null;
  if (b.dataset.devVague) { /* deja fait */ } else if (b.dataset.devPlus) E.liste[b.dataset.devPlus] = Math.min(NB_DEV_MAX, (E.liste[b.dataset.devPlus] || 0) + 1);
  else if (b.dataset.devMoins) E.liste[b.dataset.devMoins] = Math.max(0, (E.liste[b.dataset.devMoins] || 0) - 1);
  else if (b.dataset.devGroupe) E.liste = b.dataset.devGroupe === 'vider' ? {} : Object.assign({}, GROUPES_DEV[b.dataset.devGroupe].liste);
  else if (b.dataset.devN) E.n = Math.max(1, Math.min(100, E.n + Number(b.dataset.devN)));
  else if (b.dataset.devEssai) E.essai = E.essai === b.dataset.devEssai ? null : b.dataset.devEssai;
  else if (b.dataset.devVersion) { choisirVersionP10(b.dataset.devVersion).then(() => { if (modaleOuverte === 'arene-dev') ouvrirAreneDev(); }); }
  else if (b.dataset.devVit) { VITESSE_ANIM = Number(b.dataset.devVit); try { localStorage.setItem('ferme-vitesse-anim', String(VITESSE_ANIM)); } catch (err) { /* rien */ } }
  ouvrirAreneDev();
});
async function partirDev() {
  if (!estAdmin() || combat) return;
  const E = etatDev(), file = []; Object.entries(E.liste).forEach(([t, k]) => { for (let i = 0; i < k; i++) if (MONSTRES[t]) file.push(t); });
  if (!file.length) { toast('Choisis au moins un monstre.'); return; }
  if (!peutPartir('arene')) return;
  areneSuite = true; fermerModale(); areneSuite = false;
  toast('Arène dev : chargement des monstres…');
  const suite = E.vague && PHASES_BOSS[E.vague] ? PHASES_BOSS[E.vague].map((p) => ({ nom: p.nom, f: [].concat(...p.L.map(([t, k]) => Array(k).fill(t))).filter((t) => MONSTRES[t]) })) : []; /* (les temps suivants de la vague 100) */
  const avecRenforts = [].concat(...file.concat(...suite.map((p) => p.f)).map((t) => [t].concat(MONSTRES[t].renforts ? [MONSTRES[t].renforts[0]] : [], MONSTRES[t].renfortsRage ? [MONSTRES[t].renfortsRage[0]] : [], MONSTRES[t].invoque ? MONSTRES[t].invoque.types : [], MONSTRES[t].affaibli ? [MONSTRES[t].affaibli.invoque] : [], MONSTRES[t].enracine ? ['tronknyde', 'arbreCollant'] : []))).filter((t) => MONSTRES[t]); /* (affaibli : les Gorilles de Moon, 31/10/2026) */
  await chargerSquelettes([...new Set(avecRenforts.map((t) => MONSTRES[t].modele))]); /* (et ceux qu'ils appellent : Ebil seul appelait des Jav jamais charges, et l'image se figeait, 26/10/2026) */
  prechaufferSquelettes([...new Set(avecRenforts.map((t) => MONSTRES[t].modele))]); /* (leurs shaders prets avant le combat, 27/10/2026) */
  const manque = file.filter((t) => !MODELES[MONSTRES[t].modele]); if (manque.length) { toast('Arène dev : le modèle de ' + MONSTRES[manque[0]].nom + ' n\'a pas pu se charger.', 'alerte'); return; }
  if (lieu !== 'arene' && !(await allerSur('arene'))) { toast('Arène dev : le ballon n\'a pas pu décoller, réessaie.', 'alerte'); return; }
  const u = paysanMesh.userData; paysanMesh.position.set(ARENE.x + 0.6, 0, ARENE.z + 0.6); u.y = 0; u.angle = ROT_ARENE + Math.PI; paysanMesh.rotation.set(0, u.angle, 0); u.charge = false;
  setTimeout(() => { if (lieu === 'arene' && !combat) lancerDev(file.sort(() => Math.random() - 0.5), E.n, suite); }, 1200);
}
/* L'ARME A L'ESSAI (02/11/2026) : portee le temps du combat ; S_.essaiArme garde la vraie, rendue a la fin (ou au prochain lancement du jeu si la page
   s'est fermee en plein combat). Si une autre arme a ete mise entre-temps, elle retourne au sac ; l'arme a l'essai rangee dans le sac en repart */
function essayerArme(cle) {
  rendreArmeEssai(); const L = cle && LEGENDAIRES.find((x) => x.cle === cle); if (!L) return; const id = idLeg(L);
  S_.essaiArme = { id, avant: S_.equip.arme || null, n0: (S_.sac && S_.sac[id]) || 0 }; S_.equip.arme = id; rafraichirTenue(); toast('À l\'essai : ' + OBJETS[id].nom + ' (sort en touche 4), le temps du combat.', 'or');
}
function rendreArmeEssai(sansRhabiller) {
  const E = S_ && S_.essaiArme; if (!E) return; const sac = S_.sac = S_.sac || {}, cur = S_.equip.arme;
  if (cur && cur !== E.id) sac[cur] = (sac[cur] || 0) + 1;
  if ((sac[E.id] || 0) > (E.n0 || 0)) { sac[E.id]--; if (!sac[E.id]) delete sac[E.id]; }
  if (E.avant) S_.equip.arme = E.avant; else delete S_.equip.arme; delete S_.essaiArme; if (!sansRhabiller) rafraichirTenue();
}
function lancerDev(file, n, suite) {
  essayerArme(etatDev().essai);
  nouveauCombat('arene', { dev: { t0: performance.now(), liste: file.slice(), suite: (suite || []).map((p) => ({ nom: p.nom, f: p.f.slice() })) }, n, file: file.slice(), total: file.length, attente: 1.5, arene: { k: 1, tenues: 0, kamas: 0, xp: 0, objets: [], runes: {}, niv0: niveau(S_.xp), record: 0, recordSem: 0 }, regen: false, citron: false, agi: false });
  ouvrirHudCombat(); son('vague'); toast('Arène dev, vague ' + n + ' : ' + file.length + ' monstre' + (file.length > 1 ? 's' : '') + ' !', 'alerte'); majCombatHud();
}
/* la fin : tous abattus, a terre ou en fuyant ; un bilan, puis relancer ou rentrer */
function finDev(abandon, gagne) {
  const c = combat; if (!c || c.fin || !c.dev) return;
  const duree = Math.round((performance.now() - c.dev.t0) / 1000), tues = c.st.tues, total = c.dev.liste.length; nettoyerCombat(c, true); rendreArmeEssai();
  son(gagne ? 'victoire' : abandon ? 'gelee' : 'defaite');
  ouvrirModale('arene-dev-fin', entete(gagne ? 'Tous abattus !' : abandon ? 'Tu quittes l\'Arène dev' : 'À terre dans l\'Arène dev') +
    '<div class="recap-combat">' + ligneRecap('tofu', 'Monstres abattus', tues + ' sur ' + total) + ligneRecap('degats', 'Dégâts infligés', fmt(Math.round(c.st.inflige))) +
    ligneRecap('degats', 'Dégâts reçus', fmt(Math.round(c.st.recus))) + ligneRecap('etoile', 'Durée', duree + ' s') + ligneRecap('etoile', 'Vie restante', fmt(Math.max(0, Math.round(c.pv))) + ' sur ' + fmt(c.pvMax)) + '</div>' +
    '<p class="hdv-aide">Rien n\'a été gagné ni perdu : ta vie, tes potions et ta ferme sont comme avant.</p>' +
    '<div class="act-bas"><button class="btn discret" data-montgolfiere="rentrer">Rentrer à la ferme</button><button class="btn discret" data-montgolfiere="areneDev">Changer les monstres</button><button class="btn kamas" data-montgolfiere="lancerDev">Relancer</button></div>');
}

/* LE MODE TEST (05/11/2026, « il me faudrait un espace dev où je peux lancer des vagues sur ma partie, réadapter mon niveau ; une partie fake où je peux tout
   commander : telle classe avec tel stuff, tel niveau, lancer toutes les vagues que je veux à l'infini, remettre mes PV au max », Mathieu). Réservé à son compte,
   ouvert depuis les Options. On part de sa vraie ferme, puis plus rien n'est enregistré (MODE_TEST : sauver, rpc, nuageEnvoyer) : Quitter recharge la page,
   qui reprend la vraie partie telle qu'elle était. Les vagues se lancent sans attente, sans repos ni niveau requis ; les boss se rejouent à volonté. */
function bandeauTest() {
  let b = document.getElementById('bandeau-test'); if (!b) { b = document.createElement('div'); b.id = 'bandeau-test'; document.body.appendChild(b); }
  b.innerHTML = '<b>MODE TEST</b><span>rien n\'est enregistré</span><button class="btn mini" data-test="ouvrir">Réglages</button><button class="btn mini" data-test="relancer">Relancer la vague ' + ETAT_TEST.n + '</button><button class="btn mini" data-test="pv">Vie au max</button><button class="btn mini discret" data-test="quitter">Quitter</button>';
}
function entrerModeTest() { if (!estAdmin() || MODE_TEST) return; MODE_TEST = true; ETAT_TEST.n = Math.max(1, Math.min(VAGUES_MAX, S_.vague.num)); bandeauTest(); son('niveau'); toast('Mode test : plus rien n\'est enregistré. « Quitter » te rend ta vraie partie.', 'or'); ouvrirModeTest(); }
/* RELANCER UNE VAGUE SANS QUITTER LE MODE TEST (08/11/2026, « je suis a chaque fois oblige de quitter et de relancer pour pouvoir relancer une vague comme je
   veux », Mathieu) : le combat en cours, gagne, perdu ou en plein milieu, s'arrete net, sans bilan ; la vie remonte, et la vague choisie (ou la revanche) repart */
function relancerTest(a) {
  if (lieu !== 'ferme') { toast('Rentre d\'abord à la ferme.'); return; }
  if (combat) nettoyerCombat(combat, true); fermerModale(); vieAuMax(); ETAT_TEST.dernier = a; const n = ETAT_TEST.n; bandeauTest();
  setTimeout(() => { if (combat || !MODE_TEST) return; if (a === 'vague') { S_.vague.num = n; S_.vague.prepa = 0; S_.vague.repos = 0; lancerVague(); } else lancerVague(palierDe(n), a === 'difficile'); }, 250);
}
function vieAuMax() { const m = statsPerso().pvMax; S_.pv = m; if (combat && combat.pvMax) { combat.pv = combat.pvMax; majCombatHud(); } rendreHaut(); }
function equiperTest(P) { /* la panoplie entiere au jet moyen, et l'arme de ta classe de cette panoplie */
  if (combat) return; const cl = classeDe(), t = ARMES[cl][0];
  EMPLACEMENTS.forEach(([e]) => { S_.equip[e] = P ? P.id + '-' + e : null; });
  S_.equip.arme = P && OBJETS['arme-' + t + '-' + P.id] ? 'arme-' + t + '-' + P.id : null; rhabiller(); rendreHaut();
}
function changerClasseTest(cl) {
  if (combat || !CLASSES.some((c) => c.id === cl)) return; const a = S_.equip.arme && obj(S_.equip.arme), t = ARMES[cl][0]; S_.perso.classe = cl;
  if (a && a.leg) S_.equip.arme = OBJETS['leg-' + a.leg + '-' + t] ? 'leg-' + a.leg + '-' + t : null; /* (l'arme suit la classe) */
  else if (a) S_.equip.arme = OBJETS['arme-' + t + '-' + PANOS[a.pano].id] ? 'arme-' + t + '-' + PANOS[a.pano].id : null;
  rhabiller(); vieAuMax();
}
function ouvrirModeTest() {
  if (!estAdmin()) return;
  if (!MODE_TEST) { ouvrirModale('mode-test', entete('Mode test') + '<p class="hdv-aide">Tu pars de ta vraie ferme, puis <b>plus rien n\'est enregistré</b>, ni sur cet appareil ni en ligne. Choisis ta classe, ton niveau et ton équipement, lance n\'importe quelle vague autant de fois que tu veux, remets ta vie au max. « Quitter » recharge la page et te rend ta vraie partie, telle qu\'elle était.</p><div class="act-bas"><button class="btn kamas" data-test="entrer">Entrer en mode test</button></div>'); return; }
  const cl = classeDe(), L = niveau(S_.xp), E = S_.equip || {}, n = ETAT_TEST.n, P = palierDe(n), bouton = (attr, v, txt, on) => '<button class="btn ' + (on ? 'kamas' : 'discret') + '" data-' + attr + '="' + v + '">' + (on ? '✓ ' : '') + txt + '</button>';
  const panoPortee = (() => { const o = E.coiffe && obj(E.coiffe), o2 = E.bottes && obj(E.bottes); return o && !o.leg ? PANOS[o.pano].id : o2 ? PANOS[o2.pano].id : null; })(), arme = E.arme && obj(E.arme), coiffe = E.coiffe && obj(E.coiffe);
  const pas = (attr, v) => '<div class="act dev-nb">' + [-10, -1].map((d) => '<button class="btn discret" data-' + attr + '="' + d + '">' + d + '</button>').join('') + '<b>' + v + '</b>' + [1, 10].map((d) => '<button class="btn discret" data-' + attr + '="' + d + '">+' + d + '</button>').join('') + '</div>';
  ouvrirModale('mode-test', entete('Mode test') + '<p class="hdv-aide">Plus rien n\'est enregistré. « Quitter le mode test » recharge la page et te rend ta vraie partie.</p>' +
    '<div class="hdv-section">Ton perso</div><div class="puces dev-groupes">' + CLASSES.map((c) => bouton('test-classe', c.id, c.nom, c.id === cl)).join('') + bouton('test-sexe', 'm', 'Homme', sexeDe() === 'm') + bouton('test-sexe', 'f', 'Femme', sexeDe() === 'f') + '</div>' +
    '<div class="hdv-aide">Niveau ' + L + ', ' + fmt(statsPerso().pvMax) + ' PV avec ton équipement</div>' + pas('test-niv', L) +
    '<div class="hdv-section">Ton équipement</div><p class="hdv-aide">La panoplie entière au jet moyen, et l\'arme de ta classe de cette panoplie.</p><div class="puces dev-groupes">' + bouton('test-pano', '', 'Rien', !panoPortee && !arme) + PANOS.map((x) => bouton('test-pano', x.id, x.nom + ' (' + x.niv + ')', panoPortee === x.id)).join('') + '</div>' +
    '<p class="hdv-aide">Arme légendaire, à la place de celle de la panoplie :</p><div class="puces dev-groupes">' + LEGENDAIRES.filter((x) => x.arme && OBJETS['leg-' + x.cle + '-' + ARMES[cl][0]]).map((x) => bouton('test-leg-arme', x.cle, OBJETS['leg-' + x.cle + '-' + ARMES[cl][0]].nom, arme && arme.leg === x.cle)).join('') + '</div>' +
    '<p class="hdv-aide">Coiffe légendaire, à la place de celle de la panoplie :</p><div class="puces dev-groupes">' + LEGENDAIRES.filter((x) => !x.arme && OBJETS['leg-' + x.cle]).map((x) => bouton('test-leg-coiffe', x.cle, OBJETS['leg-' + x.cle].nom, coiffe && coiffe.leg === x.cle)).join('') + '</div>' +
    '<div class="hdv-section">La vague</div><div class="hdv-aide"><b>Vague ' + n + (n % VAGUES_PALIER ? '' : ' : ' + MONSTRES[PALIERS_TOUS[P].boss].nom) + '</b>, ' + PALIERS_TOUS[P].nom + ' (vagues ' + (P * VAGUES_PALIER + 1) + ' à ' + ((P + 1) * VAGUES_PALIER) + ')' + (P >= PALIERS.length ? ', <b>en avant-première</b> (fermé aux joueurs)' : '') + (multVague(n) > 1 ? ', la horde : ' + String(multVague(n)).replace('.', ',') + ' fois plus de monstres' : '') + '</div>' + pas('test-n', n) +
    '<div class="puces dev-groupes">' + bouton('test', 'vague', 'Lancer la vague ' + n, false) + (n % VAGUES_PALIER || P >= PALIERS.length ? '' : bouton('test', 'revanche', 'Revanche normale', false) + bouton('test', 'difficile', 'Revanche difficile', false)) + '</div>' +
    '<div class="hdv-section">Tes défenses</div><p class="hdv-aide">Tes ' + nbTours() + ' tourelles : les tiennes, coupées, ou toutes au niveau de ton choix (6 : celles du château).</p><div class="puces dev-groupes">' + bouton('test-tours', 'tiennes', 'Les tiennes', ETAT_TEST.tours == null) + bouton('test-tours', '0', 'Coupées', ETAT_TEST.tours === 0) + [1, 2, 3, 4, 5, 6].map((k) => bouton('test-tours', String(k), 'Niveau ' + k, ETAT_TEST.tours === k)).join('') + '</div>' +
    '<div class="puces dev-groupes">' + bouton('test', 'sansdef', 'Arbalète de la grange et Pépito-Tron coupés', ETAT_TEST.sansDef) + '</div>' +
    '<div class="hdv-section">En combat</div><div class="puces dev-groupes">' + bouton('test', 'immortel', 'Immortel (les coups s\'affichent, tu ne tombes pas)', ETAT_TEST.immortel) + bouton('test', 'pv', 'Vie au max', false) + '</div>' +
    '<div class="act-bas"><button class="btn discret" data-test="quitter">Quitter le mode test</button></div>');
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-test],[data-test-classe],[data-test-sexe],[data-test-niv],[data-test-pano],[data-test-leg-arme],[data-test-leg-coiffe],[data-test-n],[data-test-tours]'); if (!b || !estAdmin()) return;
  const d = b.dataset, a = d.test;
  if (a === 'ouvrir') { ouvrirModeTest(); return; }
  if (a === 'entrer') { entrerModeTest(); return; }
  if (!MODE_TEST) return;
  if (a === 'quitter') { location.reload(); return; }
  if (a === 'relancer') { relancerTest(ETAT_TEST.dernier || 'vague'); return; }
  if (a === 'pv') { vieAuMax(); if (modaleOuverte === 'mode-test') ouvrirModeTest(); return; }
  if (a === 'immortel') ETAT_TEST.immortel = !ETAT_TEST.immortel;
  else if (a === 'sansdef') ETAT_TEST.sansDef = !ETAT_TEST.sansDef;
  else if (d.testTours) ETAT_TEST.tours = d.testTours === 'tiennes' ? null : Number(d.testTours);
  else if (a === 'vague' || a === 'revanche' || a === 'difficile') {
    relancerTest(a); return; /* (un combat en cours s'arrete, la vague choisie repart) */
  }
  else if (d.testClasse) changerClasseTest(d.testClasse);
  else if (d.testSexe) { if (combat) return; S_.perso.sexe = d.testSexe; rhabiller(); }
  else if (d.testNiv) { if (combat) return; S_.xp = seuil(Math.max(1, Math.min(NIV_MAX, niveau(S_.xp) + Number(d.testNiv)))); vieAuMax(); }
  else if (d.testPano != null && b.hasAttribute('data-test-pano')) equiperTest(PANOS.find((x) => x.id === d.testPano) || null);
  else if (d.testLegArme) { if (combat) return; const id = 'leg-' + d.testLegArme + '-' + ARMES[classeDe()][0], o = S_.equip.arme && obj(S_.equip.arme); S_.equip.arme = o && o.leg === d.testLegArme ? null : id; rhabiller(); }
  else if (d.testLegCoiffe) { if (combat) return; const o = S_.equip.coiffe && obj(S_.equip.coiffe); S_.equip.coiffe = o && o.leg === d.testLegCoiffe ? null : 'leg-' + d.testLegCoiffe; rhabiller(); }
  else if (d.testN) { ETAT_TEST.n = Math.max(1, Math.min(VAGUES_MAX, ETAT_TEST.n + Number(d.testN))); bandeauTest(); }
  vieAuMax(); ouvrirModeTest();
});
