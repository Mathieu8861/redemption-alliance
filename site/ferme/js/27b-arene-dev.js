'use strict';
/* L'ARENE DEV (26/10/2026, « faudrait que tu me crees sur le cra un espace admin avec une arene.dev, un truc comme ca, visible que par moi, ou tu
   pourrais me faire tester les monstres en avant-premiere », Mathieu). Reservee a son compte (TESTEURS_ULTI, le meme que l'ulti libre), ouverte
   depuis les Options. Il choisit les monstres, leur nombre et leur vague, part a l'Arene : ils sortent des herses trois par trois, avec leur propre
   force (pas les regles de l'Arene). Rien ne se gagne ni ne se perd : ni XP, ni kamas, ni butin, ni record ; pas de ticket, de repas ni de potions ;
   sa vie d'avant est gardee. Les modeles des monstres a squelette (palier 9, Moon) ne se chargent qu'ici (chargerSquelettes). */
const estAdmin = () => ultiLibre();
const AVANT_PREMIERE = ['lemurienTiki', 'gorilleRoi', 'golemLune', 'tortueCorail', 'kannibJav', 'kannibSarbak', 'kannibArk', 'kannibTam', 'tortueBleue', 'tortueJaune', 'tortueRouge', 'tortueVerte', 'kannibEbil', 'moon'];
const GROUPES_DEV = {
  troupe: { nom: 'La troupe', liste: { tortueJaune: 1, tortueRouge: 1, kannibJav: 1, kannibSarbak: 1, kannibArk: 1, kannibTam: 1 } },
  tortues: { nom: 'Les 4 Tortues', liste: { tortueBleue: 1, tortueJaune: 1, tortueRouge: 1, tortueVerte: 1 } },
  kannibouls: { nom: 'Les Kannibouls', liste: { kannibJav: 2, kannibSarbak: 2, kannibArk: 1, kannibTam: 1 } },
  ebil: { nom: 'Ebil et sa garde', liste: { kannibEbil: 1, kannibJav: 1, tortueBleue: 1, tortueVerte: 1 } },
  moon: { nom: 'Moon', liste: { moon: 1 } },
  lemurien: { nom: 'Les Lémuriens', liste: { lemurienTiki: 3 } }, /* (28/10/2026, le premier monstre anime a la main) */
  nouveaux: { nom: 'Les 4 boss', liste: { lemurienTiki: 1, gorilleRoi: 1, golemLune: 1, tortueCorail: 1 } }, /* (28/10/2026, les 4 dessins de Mathieu, des boss) */
};
const NB_DEV_MAX = 6;
let choixDev = null;
const etatDev = () => (choixDev = choixDev || { n: 81, liste: Object.assign({}, GROUPES_DEV.troupe.liste) });
function ouvrirAreneDev() {
  if (!estAdmin()) return;
  const E = etatDev(), total = Object.values(E.liste).reduce((a, k) => a + k, 0);
  const ligne = (t) => { const d = MONSTRES[t], k = E.liste[t] || 0; if (!d) return '';
    return '<div class="art">' + ico(d.icone) + '<div><b>' + d.nom + (d.boss ? ' <span class="puce">boss</span>' : '') + '</b><div class="desc">' + d.desc + '</div><div class="puces"><span class="puce">' + fmt(pvMonstre(t, E.n)) + ' PV</span><span class="puce">' + fmt(degMonstre(t, E.n)) + ' par coup</span><span class="puce">vitesse ' + String(d.vitesse).replace('.', ',') + '</span></div></div>' +
      '<div class="act dev-nb"><button class="btn discret" data-dev-moins="' + t + '"' + (k ? '' : ' disabled') + '>−</button><b>' + k + '</b><button class="btn discret" data-dev-plus="' + t + '"' + (k < NB_DEV_MAX ? '' : ' disabled') + '>+</button></div></div>'; };
  ouvrirModale('arene-dev', entete('Arène dev') +
    '<p class="hdv-aide">Réservée à ton compte. Les monstres en avant-première sortent des herses de l\'Arène avec leur propre force. Rien ne se gagne ni ne se perd : ni XP, ni kamas, ni butin, ni record ; pas de ticket, de repas ni de potions ; tu rentres avec ta vie d\'avant.</p>' +
    '<div class="hdv-section">Les groupes</div><div class="puces dev-groupes">' + Object.entries(GROUPES_DEV).map(([id, g]) => '<button class="btn discret" data-dev-groupe="' + id + '">' + g.nom + '</button>').join('') + '<button class="btn discret" data-dev-groupe="vider">Vider</button></div>' +
    '<div class="hdv-section">La force des monstres : vague ' + E.n + '</div><div class="act dev-nb"><button class="btn discret" data-dev-n="-1"' + (E.n > 1 ? '' : ' disabled') + '>−</button><b>vague ' + E.n + '</b><button class="btn discret" data-dev-n="1"' + (E.n < 90 ? '' : ' disabled') + '>+</button></div>' +
    '<div class="hdv-section">Vitesse des animations de Moon</div><p class="hdv-aide">Les Kannibouls sont réglés à ×1,75 et les Tortues à ×1,25, comme tu l\'as choisi. Reste Moon : choisis celle qui te paraît juste, elle sera mise pour tout le monde.</p><div class="puces dev-groupes">' +
      [1, 1.25, 1.5, 1.75].map((x) => '<button class="btn ' + (VITESSE_ANIM === x ? 'kamas' : 'discret') + '" data-dev-vit="' + x + '">×' + String(x).replace('.', ',') + '</button>').join('') + '</div>' +
    '<div class="hdv-section">Les monstres en avant-première</div>' + AVANT_PREMIERE.map(ligne).join('') +
    '<div class="act-bas"><small>' + total + ' monstre' + (total > 1 ? 's' : '') + '</small><button class="btn kamas" data-montgolfiere="lancerDev"' + (total ? '' : ' disabled') + '>Lancer</button></div>');
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-dev-plus],[data-dev-moins],[data-dev-groupe],[data-dev-n],[data-dev-vit]'); if (!b || !estAdmin()) return;
  const E = etatDev();
  if (b.dataset.devPlus) E.liste[b.dataset.devPlus] = Math.min(NB_DEV_MAX, (E.liste[b.dataset.devPlus] || 0) + 1);
  else if (b.dataset.devMoins) E.liste[b.dataset.devMoins] = Math.max(0, (E.liste[b.dataset.devMoins] || 0) - 1);
  else if (b.dataset.devGroupe) E.liste = b.dataset.devGroupe === 'vider' ? {} : Object.assign({}, GROUPES_DEV[b.dataset.devGroupe].liste);
  else if (b.dataset.devN) E.n = Math.max(1, Math.min(90, E.n + Number(b.dataset.devN)));
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
  const avecRenforts = [].concat(...file.map((t) => [t].concat(MONSTRES[t].renforts ? [MONSTRES[t].renforts[0]] : [], MONSTRES[t].renfortsRage ? [MONSTRES[t].renfortsRage[0]] : [], MONSTRES[t].invoque ? MONSTRES[t].invoque.types : []))).filter((t) => MONSTRES[t]);
  await chargerSquelettes([...new Set(avecRenforts.map((t) => MONSTRES[t].modele))]); /* (et ceux qu'ils appellent : Ebil seul appelait des Jav jamais charges, et l'image se figeait, 26/10/2026) */
  prechaufferSquelettes([...new Set(avecRenforts.map((t) => MONSTRES[t].modele))]); /* (leurs shaders prets avant le combat, 27/10/2026) */
  const manque = file.filter((t) => !MODELES[MONSTRES[t].modele]); if (manque.length) { toast('Arène dev : le modèle de ' + MONSTRES[manque[0]].nom + ' n\'a pas pu se charger.', 'alerte'); return; }
  if (lieu !== 'arene' && !(await allerSur('arene'))) { toast('Arène dev : le ballon n\'a pas pu décoller, réessaie.', 'alerte'); return; }
  const u = paysanMesh.userData; paysanMesh.position.set(ARENE.x + 0.6, 0, ARENE.z + 0.6); u.y = 0; u.angle = ROT_ARENE + Math.PI; paysanMesh.rotation.set(0, u.angle, 0); u.charge = false;
  setTimeout(() => { if (lieu === 'arene' && !combat) lancerDev(file.sort(() => Math.random() - 0.5), E.n); }, 1200);
}
function lancerDev(file, n) {
  nouveauCombat('arene', { dev: { t0: performance.now(), liste: file.slice() }, n, file: file.slice(), total: file.length, attente: 1.5, arene: { k: 1, tenues: 0, kamas: 0, xp: 0, objets: [], runes: {}, niv0: niveau(S_.xp), record: 0, recordSem: 0 }, regen: false, citron: false, agi: false });
  ouvrirHudCombat(); son('vague'); toast('Arène dev, vague ' + n + ' : ' + file.length + ' monstre' + (file.length > 1 ? 's' : '') + ' !', 'alerte'); majCombatHud();
}
/* la fin : tous abattus, a terre ou en fuyant ; un bilan, puis relancer ou rentrer */
function finDev(abandon, gagne) {
  const c = combat; if (!c || c.fin || !c.dev) return;
  const duree = Math.round((performance.now() - c.dev.t0) / 1000), tues = c.st.tues, total = c.dev.liste.length; nettoyerCombat(c, true);
  son(gagne ? 'victoire' : abandon ? 'gelee' : 'defaite');
  ouvrirModale('arene-dev-fin', entete(gagne ? 'Tous abattus !' : abandon ? 'Tu quittes l\'Arène dev' : 'À terre dans l\'Arène dev') +
    '<div class="recap-combat">' + ligneRecap('tofu', 'Monstres abattus', tues + ' sur ' + total) + ligneRecap('degats', 'Dégâts infligés', fmt(Math.round(c.st.inflige))) +
    ligneRecap('degats', 'Dégâts reçus', fmt(Math.round(c.st.recus))) + ligneRecap('etoile', 'Durée', duree + ' s') + ligneRecap('etoile', 'Vie restante', fmt(Math.max(0, Math.round(c.pv))) + ' sur ' + fmt(c.pvMax)) + '</div>' +
    '<p class="hdv-aide">Rien n\'a été gagné ni perdu : ta vie, tes potions et ta ferme sont comme avant.</p>' +
    '<div class="act-bas"><button class="btn discret" data-montgolfiere="rentrer">Rentrer à la ferme</button><button class="btn discret" data-montgolfiere="areneDev">Changer les monstres</button><button class="btn kamas" data-montgolfiere="lancerDev">Relancer</button></div>');
}
