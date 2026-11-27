'use strict';
/* LES CRISTAUX, PALIER 2 DES PIECES (decide le 26/11/2026, code le 27/11/2026, « code pour les cristaux, vas-y », Mathieu ; regles dans CRISTAUX.md) :
   - une piece au jet maximum (100 %) monte jusqu'a 200 % avec des cristaux (CRISTAL_PLAFOND, 02-donnees.js : 100 % au-dela du maximum ; 20 % avant) ; chaque cristal
     ajoute de 1 a 5 % au hasard a toutes ses caracteristiques (29t-cristaux.js, inchange) ;
   - au-dela de 100 %, 10 barres de 10 % : chaque barre franchie fait monter de 10 % tous les effets de la piece (les sorts et passifs des legendaires) :
     multEffets(k) = 1 + 0,1 x barres ; pas les recharges, ni les zones, ni les portees ;
   - LES DEGATS d'un sort legendaire montent par la source des degats (SRC_DEG, 23-fin-combat.js : elle suit les effets differes, fleches, brulures, setTimeout) :
     au lancement, le nom du sort est associe au multiplicateur de sa piece (MULT_SRC), et blesser multiplie ce qui vient de cette source ;
   - les durees, les bonus et les invocations de chaque sort : effetsLeg (plus bas), sort par sort ;
   - a l'eveil (fusion de deux legendaires identiques), les cristaux du doublon sacrifie passent sur la piece gardee, plafonnes a 200 % (27g-eveil-concasseur.js) */
const barresCristal = (k) => (k ? Math.min(10, Math.floor((cristauxDe(k).p || 0) / 10)) : 0);
const multEffets = (k) => 1 + 0.1 * barresCristal(k);
const multEffetsEmp = (emp) => multEffets(S_ && S_.equip && S_.equip[emp]);
const MULT_SRC = {}; /* (nom de la source des degats -> multiplicateur de la piece qui a lance le sort) */
const MX_EN_COURS = { v: 0 }; /* (le multiplicateur du sort legendaire pendant son lancement : les durees et les invocations posees tout de suite, mxc() dans 22-sorts.js) */
const INVOC_LEG = { croc: { osa: 'Dragonnet' }, chene: { osa: 'Bouture' }, docteur: { tous: 'Tourelle à cawottes' } }; /* (les invocations des sorts legendaires : leurs coups ont leur propre source) */
{ const executerLegCx = executerLeg; executerLeg = function (emp) { let m = 1;
    try { const cle = legDe(emp), S = cle && sortLeg(cle); if (S) { m = multEffetsEmp(emp); MULT_SRC['Sort légendaire : ' + S.nom] = m; const I = INVOC_LEG[cle], nom = I && (I[classeDe()] || I.tous); if (nom) MULT_SRC[nom] = m; } } catch (e) { /* rien */ }
    const p = MX_EN_COURS.v; MX_EN_COURS.v = m > 1 ? m : 0; try { return executerLegCx.apply(this, arguments); } finally { MX_EN_COURS.v = p; } }; }
{ const blesserCx = blesser; blesser = function (mo, n, gros, src) { if (src == null && typeof SRC_DEG === 'string' && typeof n === 'number' && n > 0) { const m = MULT_SRC[SRC_DEG]; if (m > 1) n = Math.round(n * m); }
    return blesserCx.call(this, mo, n, gros, src); }; }
/* LA FICHE (la maquette validee le 26/11/2026 au soir, « ok niquel esthetiquement », Mathieu) : sous la barre verte du jet (le palier 1), les 10 crans violets du
   palier 2 (une barre de 10 % par cran, le cran en cours rempli en partie), les effets du sort de la piece en trois colonnes (a 100 %, maintenant, a la prochaine
   barre), la zone et la recharge marquees « ne change pas », et le bouton « Poser un cristal » */
(() => { const st = document.createElement('style'); st.textContent = '.fp-cx{margin-top:8px;font-size:.74rem;color:#a9adb5;font-weight:700}.fp-cx-t{display:flex;justify-content:space-between;align-items:center;gap:8px}.fp-cx-t b{color:#d8b4ff}'
  + '.fp-crans{display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin:5px 0 2px}.fp-crans i{height:9px;border:2px solid var(--bord);border-radius:99px;background:#2b2d31;overflow:hidden;position:relative}'
  + '.fp-crans i::after{content:"";position:absolute;inset:0;width:var(--r,0%);background:linear-gradient(90deg,#8a4dff,#c08cff)}'
  + '.fp-effets{margin-top:7px;border:2px solid var(--bord);border-radius:9px;overflow:hidden}.fp-effets div{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:4px;padding:3px 7px;align-items:center}'
  + '.fp-effets div:nth-child(odd){background:rgba(255,255,255,.03)}.fp-effets .th{color:#c08cff;font-size:.68rem}.fp-effets span:not(:first-child){text-align:right}.fp-effets .fixe{color:#8a8f98;font-style:italic}.fp-effets .maint{color:#fff}'
  + '.fp-cx .btn{margin-top:7px}'; document.head.appendChild(st); })();
/* les effets d'un sort legendaire, pour la fiche : [{ nom, val (a 100 %), unite, fmt, fixe }] ; rempli sort par sort (EFFETS_LEG, plus bas) */
const cxE = (nom, val, unite, avant) => ({ nom, val, unite: unite || '', avant: avant || '' }), cxDg = (v, nom) => cxE(nom || 'Dégâts', v, '', '×'), cxSec = (nom, v) => cxE(nom, v, ' s');
const EFFETS_LEG = { /* (les effets qui montent avec les barres, sort par sort et classe par classe ; les memes chiffres que dans 22-sorts.js et 21-combat.js) */
  royal: { tous: [cxDg(2), cxSec('Sonné', 1), cxE('Laine des Bouftous', 25, ' %', '+')] },
  chafer: { tous: [cxDg(1.5, 'Dégâts (première case)'), cxDg(3, 'Dégâts (dernière case)'), cxE('Dégâts reçus', -10, ' %'), cxE('Coups renvoyés', 10, ' %')] },
  bworker: { tous: [cxDg(2.5), cxE('Rage : attaques plus rapides', 30, ' %', '+')] },
  craq: { tous: [cxDg(2)] },
  croc: { iop: [cxDg(2.4), cxDg(0.2, 'Brûlure, par demi-seconde'), cxSec('Brûlure', 2)], cra: [cxDg(2.4), cxDg(0.2, 'Brûlure, par demi-seconde'), cxSec('Brûlure', 2)],
    osa: [cxSec('Durée du Dragonnet', 8), cxE('Coups du Dragonnet', 100, ' %'), cxSec('Brûlure du Dragonnet', 1)] },
  wa: { iop: [cxDg(2, 'Dégâts par cawotte')], cra: [cxDg(2, 'Dégâts par cawotte')], osa: [cxE('Vie de la Cawotte', 70, ' % de tes PV'), cxSec('Durée', 8), cxE('Coups renvoyés', 1.35, ' fois', '×'), cxSec('Boss retenu', 3)] },
  koulosse: { tous: [cxE('Poison', 3, ' % des PV par seconde'), cxE('Poison, au moins', 200, ' par seconde'), cxE('Poison, au plus', 550, ' par seconde'), cxSec('Durée du nuage et du poison', 4)] },
  cochon: { tous: [cxDg(2), cxSec('Collé', 2)] },
  dcochon: { tous: [cxDg(2), cxSec('Collé', 2)] },
  moon: { tous: [cxDg(3), cxSec('Sonné', 1)] },
  corail: { iop: [cxSec('Durée', 3), cxE('Dégâts reçus', -30, ' %'), cxE('Tes dégâts', 20, ' %', '+')], cra: [cxDg(2.5), cxSec('Sonné', 1)],
    osa: [cxSec('Durée', 8), cxE('Dégâts du Bouftou', 30, ' %', '+'), cxE('Vitesse du Bouftou', 15, ' %', '+'), cxSec('Vie du Bouftou en plus', 3)] },
  chene: { iop: [cxDg(2.5), cxSec('Enraciné', 1.5)], cra: [cxDg(0.8, 'Dégâts par demi-seconde'), cxSec('Durée', 4), cxE('Vitesse des monstres', -30, ' %')],
    osa: [cxE('Vie de la Bouture', 100, ' % de tes PV'), cxDg(0.8, 'Coups de la Bouture'), cxSec('Durée', 10)] },
  ancestral: { iop: [cxDg(2.5), cxSec('Sonné', 0.6)], cra: [cxDg(1), cxE('Dégâts reçus par le maudit', 25, ' %', '+'), cxSec('Malédiction', 6)], osa: [cxDg(0.8, 'Morsure des têtes'), cxSec('Durée', 6)] },
  docteur: { tous: [cxDg(0.4, 'Dégâts par cawotte'), cxSec('Durée de la tourelle', 8), cxE('Tes invocations', 15, ' %', '+')] },
};
function effetsDeLaPiece(k) { const o = obj(k); if (!o || !o.leg) return []; const S = SORTS_LEG[o.leg], cl = classeDe(), E = EFFETS_LEG[o.leg]; const L = E ? (typeof E === 'function' ? E(cl) : E[cl] || E.tous || []) : [];
  const S2 = S && S.parClasse ? Object.assign({}, S, S.parClasse[cl] || {}) : S || {};
  return L.concat(S2.zone ? [{ nom: 'Zone', val: S2.zone, fixe: true, unite: ' cases', cases: true }] : []).concat(S2.recharge ? [{ nom: 'Recharge', val: S2.recharge, fixe: true, unite: ' s' }] : []); }
const valEffet = (e, m) => { let v = e.fixe ? e.val : e.val * m; if (e.cases) v = v / (typeof S !== 'undefined' ? S : 2); const r = Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 100) / 100; return (e.avant || '') + String(r).replace('.', ',') + (e.unite || ''); };
function blocCristaux(k) {
  const o = obj(k); if (!o || !(typeof cristauxVisibles === 'function' && cristauxVisibles())) return ''; const C = cristauxDe(k), b = barresCristal(k), m = multEffets(k), mN = Math.min(2, 1 + 0.1 * (b + 1)), maxi = qualiteJet(k) >= 0.999;
  const crans = Array.from({ length: 10 }, (_, i) => { const r = Math.max(0, Math.min(1, (C.p - i * 10) / 10)); return '<i style="--r:' + Math.round(r * 100) + '%"></i>'; }).join('');
  const E = effetsDeLaPiece(k), stock = (runes().cristal || 0);
  const tab = E.length ? '<div class="fp-effets"><div class="th"><span>Effet du sort</span><span>à 100 %</span><span>maintenant</span><span>prochaine barre</span></div>' +
    E.map((e) => '<div><span>' + e.nom + '</span>' + (e.fixe ? '<span class="fixe" style="grid-column:span 3;text-align:right">' + valEffet(e, 1) + ', ne change pas</span>' : '<span>' + valEffet(e, 1) + '</span><span class="maint">' + valEffet(e, m) + '</span><span>' + (b >= 10 ? '—' : valEffet(e, mN)) + '</span>') + '</div>').join('') + '</div>' : '';
  const bouton = !maxi ? '<small>Un cristal se pose sur une pièce au jet maximum (100 %).</small>' : C.p >= CRISTAL.plafond ? '<small>✓ 200 %, le maximum.</small>'
    : '<button class="btn mini ' + (stock && forgeRunique() ? 'kamas' : 'discret') + '" data-cristal="' + k + '"' + (stock && forgeRunique() ? '' : ' disabled') + ' data-info="' + (forgeRunique() ? (stock ? stock + ' en réserve' : 'Aucun cristal en réserve') : 'Il faut la forge runique (atelier de forgemagie niveau 2)') + '">' + (typeof imgCristal === 'function' ? imgCristal() : '') + 'Poser un cristal</button>';
  return '<div class="fp-cx"><div class="fp-cx-t"><span>Palier 2 : <b>' + (100 + C.p) + ' %</b> de jet' + (C.n ? ' (' + C.n + ' ' + (C.n > 1 ? 'cristaux' : 'cristal') + ')' : '') + '</span><span>barre <b>' + b + '</b>/10' + (b ? ' · effets ×' + String(m.toFixed(1)).replace('.', ',') : '') + '</span></div>' +
    '<div class="fp-crans">' + crans + '</div>' + tab + bouton + '</div>';
}
{ const ouvrirPersoCx = ouvrirPerso; ouvrirPerso = function () { const r = ouvrirPersoCx.apply(this, arguments);
    try { if (modaleOuverte === 'perso' && persoSel) { const j = document.querySelector('#carte .fp-jet'); if (j && !document.querySelector('#carte .fp-cx')) { const h = blocCristaux(persoSel); if (h) j.insertAdjacentHTML('afterend', h); } } } catch (e) { console.warn('fiche cristaux', e); }
    return r; }; }
/* un cristal pose depuis la fiche (fenetre Perso) : on revient a la fiche, pas a l'atelier */
const CX_RETOUR = { perso: false };
document.addEventListener('click', (ev) => { const b = ev.target.closest && ev.target.closest('.fp-cx [data-cristal]'); if (b) CX_RETOUR.perso = true; }, true);
{ const ouvrirForgeCx = ouvrirForge; ouvrirForge = function () { if (CX_RETOUR.perso && (modaleOuverte === 'forge-confirme' || modaleOuverte === 'perso')) { CX_RETOUR.perso = false; return ouvrirPerso(); } CX_RETOUR.perso = false; return ouvrirForgeCx.apply(this, arguments); }; }
