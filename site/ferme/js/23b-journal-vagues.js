'use strict';
/* LE JOURNAL DES VAGUES (17/11/2026, « t'as aucun moyen de récupérer les datas des joueurs ? nombre de morts etc sur les vagues ? nombre d'essais avant
   de réussir ? », puis « les 50 dernières vagues plutôt », Mathieu) : chaque vague jouée (vague normale, revanche normale ou difficile) laisse une ligne
   dans la sauvegarde, S_.journalVagues, les 50 dernières. Invisible pour le joueur ; elle part en base avec la ferme (ferme_joueurs.etat) et se lit
   pour l'équilibrage : l'issue, la durée, la vie au départ et à la fin, les dégâts reçus par monstre (les 10 premiers : nom, dégâts, coups, plus gros
   coup), les monstres encore là quand le perso tombe (ou à la fuite) et l'instant de sa chute, la préparation (Menthe, Citron, Royale, repas, bouclier de la grange), les bâtiments en ruine à la fin,
   l'ulti et l'équipement porté. Les simus VSA, l'Arène et l'île des boss n'y vont pas. */
const JOURNAL_VAGUES_MAX = 50;
{
  const nouveauCombatJ = nouveauCombat;
  nouveauCombat = function (genre, champs) { const c = nouveauCombatJ(genre, champs); try { c.jT0 = Date.now(); c.jPv0 = Math.round(c.pv); } catch (err) { /* rien */ } return c; };
  /* les monstres encore debout se comptent quand le perso tombe : a la fin de la deroute, ceux qui restent repartent et sont marques morts */
  const deroutJ = commencerDeroute;
  commencerDeroute = function (...a) { const c = combat; try { if (c && !c.fin && c.deroute == null) { c.jChute = c.jT0 ? Math.round((Date.now() - c.jT0) / 1000) : 0; c.jDebout = deboutJ(c); } } catch (err) { /* rien */ } return deroutJ.apply(this, a); };
  const finVagueJ = finVague;
  finVague = function (gagne, fuite) {
    const c = combat;
    if (c && !c.fin && !c.arene && !c.raid && c.genre === 'vague') { try { noterJournalVague(c, !!gagne, !!fuite); } catch (err) { /* (le journal ne doit jamais gêner la fin de vague) */ } }
    return finVagueJ.apply(this, arguments);
  };
}
function deboutJ(c) { /* (les monstres encore la : debout, enfouis ou qui grimpent, et ceux de la file qui ne sont pas encore arrives) */
  const D = {}; c.monstres.forEach((o) => { if (o.etat === 'actif' || o.etat === 'grimpe' || o.etat === 'enfoui') D[o.type] = (D[o.type] || 0) + 1; }); (c.file || []).forEach((t) => { D[t] = (D[t] || 0) + 1; }); return D; }
function noterJournalVague(c, gagne, fuite) {
  const r = (x) => Math.round(x || 0), H = (c.histo && c.histo.recu) || {};
  const e = {
    t: Date.now(), n: c.n, cl: classeDe(), niv: niveau(S_.xp), issue: gagne ? 'gagne' : fuite ? 'fuite' : 'perdu',
    boss: c.rejoueBoss != null ? (c.difficile ? 'difficile' : 'revanche') : '', test: !!(typeof MODE_TEST !== 'undefined' && MODE_TEST),
    duree: c.jT0 ? r((Date.now() - c.jT0) / 1000) : 0, pv0: c.jPv0 || 0, pvMax: r(c.pvMax), pvFin: r(c.pv),
    monstres: c.total || 0, tues: c.st.tues, recus: r(c.st.recus), soins: r(c.st.soins), inflige: r(c.st.inflige), sorts: c.st.sorts || 0,
    parMonstre: Object.entries(H).sort((a, b) => b[1].n - a[1].n).slice(0, 10).map(([k, h]) => [k, r(h.n), h.coups, r(h.max)]),
    debout: c.jDebout || deboutJ(c), chute: c.jChute || 0,
    prep: { menthe: !!c.regen, citron: !!c.citron, royale: !!c.agi, repas: Object.keys(c.repasActifs || {}), bouclier: !!c.bouclierBat },
    ruines: Object.keys(S_.bats || {}).filter((k) => S_.bats[k] && S_.bats[k].ruine),
    ulti: S_.ulti || '', equip: Object.values(S_.equip || {}).filter(Boolean).map((id) => String(id).split('~')[0])
  };
  const J = Array.isArray(S_.journalVagues) ? S_.journalVagues : (S_.journalVagues = []);
  J.push(e); while (J.length > JOURNAL_VAGUES_MAX) J.shift();
}
