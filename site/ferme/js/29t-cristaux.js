'use strict';
/* LES CRISTAUX RUNIQUES (24/11/2026, Mathieu par Discord : « on peut recuperer comme des runes, mais ca s'appelle des cristaux runiques : ca permet de booster les
   stats d'un item qui est deja a 100 % »). Version dev, chiffres proposes a Mathieu, a regler :
   - un cristal ne se pose que sur une piece au jet maximum (qualiteJet a 100 %) ; chacun ajoute CRISTAL.gain (5 %) a toutes ses caracteristiques (au moins +1),
     jusqu'a CRISTAL.max (4) cristaux par piece, soit +20 % au plus ;
   - la reserve : runes().cristal ; les cristaux poses : S_.cristaux[cle de la piece], a part des jets (jetsDansFourchette ramene chaque jet dans sa fourchette
     a chaque chargement) ; ils s'appliquent dans obj(), apres l'eveil d'un legendaire ;
   - ils tombent dans le donjon des Wabbits : 3 % sur un mutant ou un drone, 1 sur un specimen des cuves, 2 sur un mini-boss, 3 dans le coffre du labo.
   On les pose dans l'atelier de forgemagie, sur une piece « jet max ». Icone : assets/icones/rune-cristal.png (le jeton des runes, email violet, un cristal taille) */
const CRISTAL = { gain: 0.05, max: 4, nom: 'Cristal runique', court: 'Cristaux runiques', mutant: 0.03, specimen: 1, chef: 2, coffre: 3 };
const cristauxDe = (k) => (S_ && S_.cristaux && S_.cristaux[k]) || 0;
const cristauxVisibles = () => (typeof MODE_TEST !== 'undefined' && !!MODE_TEST) || (runes().cristal || 0) > 0 || Object.keys((S_ && S_.cristaux) || {}).length > 0;
const imgCristal = () => '<img src="assets/icones/rune-cristal.png?v=' + VERSION_MODELES + '" alt="">';
{ const objCristal = obj; obj = function (k) { const o = objCristal.apply(this, arguments), n = o ? cristauxDe(k) : 0; if (!n) return o;
    const f = 1 + CRISTAL.gain * n; return Object.assign({}, o, { stats: Object.fromEntries(Object.entries(o.stats).map(([c, v]) => [c, typeof v === 'number' && v > 0 ? Math.max(v + n, Math.round(v * f)) : v])), cristaux: n }); }; }
function gagnerCristaux(n) { if (!(n > 0)) return; runes().cristal = (runes().cristal || 0) + n; }
/* dans l'atelier de forgemagie : la ligne d'une piece au jet maximum (03-equipements.js, ouvrirForge) */
function ligneCristal(k) {
  if (!cristauxVisibles()) return ''; const n = cristauxDe(k), stock = runes().cristal || 0;
  if (n >= CRISTAL.max) return '<span class="cadenas">✓ jet max · ' + n + ' cristaux</span>';
  return '<span class="cadenas">✓ jet max' + (n ? ' · ' + n + '/' + CRISTAL.max + ' cristaux' : '') + '</span><button class="btn mini ' + (stock ? 'kamas' : 'discret') + '" data-cristal="' + k + '"' + (stock ? '' : ' disabled') +
    ' data-info="' + CRISTAL.nom + ' : +' + Math.round(CRISTAL.gain * 100) + ' % à toutes ses caractéristiques, au-delà du maximum">' + imgCristal() + '+' + Math.round(CRISTAL.gain * 100) + ' %</button>';
}
{ const ouvrirForgeCristal = ouvrirForge; ouvrirForge = function () { const r = ouvrirForgeCristal.apply(this, arguments);
    try { if (!cristauxVisibles() || modaleOuverte !== 'forge') return r; const st = document.querySelector('#carte .forge-stock'), n = runes().cristal || 0;
      if (st) st.insertAdjacentHTML('beforeend', '<span class="puce">' + imgCristal() + '<b>' + n + '</b> ' + (n > 1 ? CRISTAL.court : CRISTAL.nom).toLowerCase() + '</span>');
      const aide = document.querySelector('#carte .hdv-aide'); if (aide) aide.insertAdjacentHTML('beforeend', ' Un <b>cristal runique</b> (version dev, donjon des Wabbits) se pose sur une pièce déjà au jet maximum : +' + Math.round(CRISTAL.gain * 100) + ' % à toutes ses caractéristiques, jusqu\'à ' + CRISTAL.max + ' cristaux.'); } catch (e) { /* rien */ }
    return r; }; }
function confirmerCristal(k) {
  const o = obj(k), B = OBJETS[baseObjet(k)], n = cristauxDe(k), stock = runes().cristal || 0; if (!o || !B) return;
  if (!(stock > 0)) { toast('Il te faut un cristal runique : il y en a dans le donjon des Wabbits.'); return; }
  if (qualiteJet(k) < 0.999) { toast('Un cristal ne se pose que sur une pièce au jet maximum (100 %).'); return; }
  if (n >= CRISTAL.max) { toast('Cette pièce a déjà ' + CRISTAL.max + ' cristaux.'); return; }
  S_.cristaux = S_.cristaux || {}; S_.cristaux[k] = n + 1; const o2 = obj(k); if (n) S_.cristaux[k] = n; else delete S_.cristaux[k];
  const L = Object.keys(o.stats).map((c) => { const C = CARACS[c] || [c, '', '']; return '<div class="fg-val">' + (C[2] || '') + ' ' + C[0] + ' : <span>' + fmt(o.stats[c]) + '</span> → <b>' + fmt(o2.stats[c]) + '</b>' + C[1] + ' <em>+' + fmt(o2.stats[c] - o.stats[c]) + '</em></div>'; }).join('');
  ouvrirModale('forge-confirme', entete('Poser un cristal runique ?') +
    '<div class="art rune-ce-quelle-fait">' + (typeof ico === 'function' ? ico('rune-cristal') : imgCristal()) + '<div><b>' + CRISTAL.nom + '</b><div class="desc">Il fait passer la pièce au-delà de son maximum : +' + Math.round(CRISTAL.gain * 100) + ' % à toutes ses caractéristiques. ' + CRISTAL.max + ' cristaux au plus par pièce (celle-ci en a ' + n + '). Le cristal est consommé : on ne peut pas revenir en arrière.</div></div></div>' +
    '<div class="art">' + icoObjet(k) + '<div><b>' + (o.leg ? '✦ ' : o.rare ? '★ ' : '') + o.nom + '</b>' + L + '</div></div>' +
    '<p class="hdv-aide">Il te reste <b>' + stock + ' ' + (stock > 1 ? CRISTAL.court : CRISTAL.nom).toLowerCase() + '</b>. <b>Es-tu sûr de vouloir le poser ?</b></p>' +
    '<div class="act-bas"><button class="btn kamas" data-cristal-oui="' + k + '">Oui, le poser</button><button class="btn discret" data-cristal-non>Non</button></div>');
}
function poserCristal(k) {
  const n = cristauxDe(k), R = runes(); if (!(R.cristal > 0) || qualiteJet(k) < 0.999 || n >= CRISTAL.max || !obj(k)) return;
  S_.cristaux = S_.cristaux || {}; S_.cristaux[k] = n + 1; R.cristal--; son('niveau'); confettis(25);
  toast('Cristal runique posé : ' + obj(k).nom + ' passe à +' + Math.round(CRISTAL.gain * 100 * (n + 1)) + ' % (' + (n + 1) + '/' + CRISTAL.max + ').', 'or'); rendreHaut(); sauver(); ouvrirForge();
}
document.addEventListener('click', (ev) => { const b = ev.target.closest('[data-cristal], [data-cristal-oui], [data-cristal-non]'); if (!b || b.disabled) return;
  if (b.dataset.cristal) confirmerCristal(b.dataset.cristal); else if (b.dataset.cristalOui) poserCristal(b.dataset.cristalOui); else ouvrirForge(); });
