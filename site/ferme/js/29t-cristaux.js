'use strict';
/* LES CRISTAUX RUNIQUES (24/11/2026, Mathieu par Discord : « on peut recuperer comme des runes, mais ca s'appelle des cristaux runiques : ca permet de booster les
   stats d'un item qui est deja a 100 % »), puis dans l'app : « l'atelier de forgemagie, mais faut le faire evoluer niveau 2 » et « au hasard, de 1 a 5 % ».
   Version dev, seulement dans le mode test tant que le donjon des Wabbits n'est pas sorti :
   - un cristal ne se pose qu'a la forge runique (l'atelier de forgemagie au niveau 2, 02-donnees.js : PRIX_FORGE2, NIV_FORGE2), sur une piece au jet
     maximum (qualiteJet a 100 %) ; chacun ajoute de 1 a 5 % au hasard a toutes ses caracteristiques (au moins +1 par cristal), jusqu'a CRISTAL_PLAFOND (20 %)
     au total : le dernier cristal est rogne au plafond ;
   - la reserve : runes().cristal ; les cristaux poses : S_.cristaux[cle de la piece] = { p: pourcentage total, n: nombre de cristaux }, a part des jets
     (jetsDansFourchette ramene chaque jet dans sa fourchette a chaque chargement) ; ils s'appliquent dans obj(), apres l'eveil d'un legendaire ;
   - ils tombent dans le donjon des Wabbits : 3 % sur un mutant ou un drone, 1 sur un specimen des cuves, 2 sur un mini-boss, 3 dans le coffre du labo.
   Icone : assets/icones/rune-cristal.png (le dessin « cristal 2 » choisi par Mathieu). Le modele de la forge runique : blender/forgemagie2.py niv2 */
const CRISTAL = { min: 1, max: 5, plafond: CRISTAL_PLAFOND, nom: 'Cristal runique', court: 'Cristaux runiques', mutant: 0.003, specimen: 0.1, chef: 0.1, coffre: 0.3 };
/* PLUS AUCUN CRISTAL GARANTI (26/11/2026, « les cristaux, sur le papier la ressource la plus rare du jeu, on les gagne gratuitement ; il faut des pourcentages de
   chances comme dans les coffres », Mathieu) : avant, 1 sur chaque specimen, 2 dans le coffre des mini-boss, 3 dans le coffre du labo, 3 % par mutant, 5 et 20 %
   dans les petits coffres rares et precieux. Maintenant une chance d'en avoir 1, toujours plus rare que la rune parfaite au meme endroit : 0,3 % par mutant,
   10 % sur un specimen, 10 % dans le coffre d'un mini-boss, 30 % dans le coffre du labo (« specimen 10 %, coffre du labo 30 % », Mathieu, 26/11/2026), 1 et 3 % dans les petits coffres rares et precieux ; la Prospection
   l'augmente (prosLabo). tirerCristaux : une valeur sous 1 est une chance d'en avoir 1 */
const tirerCristaux = (v) => (!(v > 0) ? 0 : v >= 1 ? Math.round(v) : Math.random() < v * (typeof prosLabo === 'function' ? prosLabo() : 1) ? 1 : 0);
const cristauxDe = (k) => { const c = S_ && S_.cristaux && S_.cristaux[k]; return !c ? { p: 0, n: 0 } : typeof c === 'number' ? { p: c * 5, n: c } : c; }; /* (un nombre : l'ancien format, 5 % par cristal) */
const cristauxVisibles = () => (typeof MODE_TEST !== 'undefined' && !!MODE_TEST) || (runes().cristal || 0) > 0 || Object.keys((S_ && S_.cristaux) || {}).length > 0;
const forgeRunique = () => niv('forge') >= 2;
const imgCristal = () => '<img src="assets/icones/rune-cristal.png?v=' + VERSION_MODELES + '" alt="">';
{ const objCristal = obj; obj = function (k) { const o = objCristal.apply(this, arguments), C = o ? cristauxDe(k) : null; if (!C || !C.p) return o;
    const f = 1 + C.p / 100; return Object.assign({}, o, { stats: Object.fromEntries(Object.entries(o.stats).map(([c, v]) => [c, typeof v === 'number' && v > 0 ? Math.max(v + C.n, Math.round(v * f)) : v])), cristaux: C.n, cristalPct: C.p }); }; }
function gagnerCristaux(n) { if (!(n > 0)) return; runes().cristal = (runes().cristal || 0) + n; }
/* ce que peut donner le prochain cristal sur cette piece : de 1 a 5 %, rogne au plafond */
const gainsCristal = (k) => { const reste = Math.max(0, CRISTAL.plafond - cristauxDe(k).p); return { min: Math.min(CRISTAL.min, reste), max: Math.min(CRISTAL.max, reste) }; };
/* dans l'atelier de forgemagie : la ligne d'une piece au jet maximum (03-equipements.js, ouvrirForge) */
function ligneCristal(k) {
  if (!cristauxVisibles()) return ''; const C = cristauxDe(k), stock = runes().cristal || 0, deja = C.p ? ' · +' + C.p + ' %' : '';
  if (C.p >= CRISTAL.plafond) return '<span class="cadenas">✓ jet max · +' + C.p + ' %, le plafond</span>';
  if (!forgeRunique()) return '<span class="cadenas">✓ jet max' + deja + '</span><button class="btn mini discret" data-cristal="' + k + '" data-info="Il faut la forge runique : l\'atelier de forgemagie au niveau 2">' + imgCristal() + '🔒 Forge niv. 2</button>';
  const G = gainsCristal(k);
  return '<span class="cadenas">✓ jet max' + deja + '</span><button class="btn mini ' + (stock ? 'kamas' : 'discret') + '" data-cristal="' + k + '"' + (stock ? '' : ' disabled') +
    ' data-info="' + CRISTAL.nom + ' : de +1 à +5 % au hasard à toutes ses caractéristiques, au-delà du maximum, jusqu\'à +' + CRISTAL.plafond + ' %">' + imgCristal() + '+' + G.min + (G.max > G.min ? ' à ' + G.max : '') + ' %</button>';
}
{ const ouvrirForgeCristal = ouvrirForge; ouvrirForge = function () { const r = ouvrirForgeCristal.apply(this, arguments);
    try { if (!cristauxVisibles() || modaleOuverte !== 'forge') return r; const st = document.querySelector('#carte .forge-stock'), n = runes().cristal || 0;
      if (st) st.insertAdjacentHTML('beforeend', '<span class="puce">' + imgCristal() + '<b>' + n + '</b> ' + (n > 1 ? CRISTAL.court : CRISTAL.nom).toLowerCase() + '</span>');
      const aide = document.querySelector('#carte .hdv-aide'); if (aide) aide.insertAdjacentHTML('beforeend', ' Un <b>cristal runique</b> (version dev, laboratoire du Docteur Wabbenstein) se pose ' + (forgeRunique() ? 'ici' : 'à la <b>forge runique</b> (cet atelier au niveau 2, Améliorer)') + ', sur une pièce déjà au jet maximum : de +1 à +5 % au hasard à toutes ses caractéristiques, jusqu\'à +' + CRISTAL.plafond + ' %.'); } catch (e) { /* rien */ }
    return r; }; }
function confirmerCristal(k) {
  const o = obj(k), B = OBJETS[baseObjet(k)], C = cristauxDe(k), stock = runes().cristal || 0; if (!o || !B) return;
  if (!forgeRunique()) { toast('Il te faut la forge runique : l\'atelier de forgemagie au niveau 2 (Améliorer, onglet Ferme).'); return; }
  if (!(stock > 0)) { toast('Il te faut un cristal runique : il y en a dans le laboratoire du Docteur Wabbenstein.'); return; }
  if (qualiteJet(k) < 0.999) { toast('Un cristal ne se pose que sur une pièce au jet maximum (100 %).'); return; }
  if (C.p >= CRISTAL.plafond) { toast('Cette pièce est déjà à +' + CRISTAL.plafond + ' %, le plafond.'); return; }
  const G = gainsCristal(k), avec = (p) => { S_.cristaux = S_.cristaux || {}; const avant = S_.cristaux[k]; S_.cristaux[k] = { p, n: C.n + 1 }; const r = obj(k); if (avant === undefined) delete S_.cristaux[k]; else S_.cristaux[k] = avant; return r; };
  const bas = avec(C.p + G.min), haut = avec(C.p + G.max);
  const L = Object.keys(o.stats).map((c) => { const X = CARACS[c] || [c, '', ''], a = bas.stats[c], b = haut.stats[c]; return '<div class="fg-val">' + (X[2] || '') + ' ' + X[0] + ' : <span>' + fmt(o.stats[c]) + '</span> → <b>' + fmt(a) + (b !== a ? ' à ' + fmt(b) : '') + '</b>' + X[1] + '</div>'; }).join('');
  ouvrirModale('forge-confirme', entete('Poser un cristal runique ?') +
    '<div class="art rune-ce-quelle-fait">' + (typeof ico === 'function' ? ico('rune-cristal') : imgCristal()) + '<div><b>' + CRISTAL.nom + '</b><div class="desc">Il fait passer la pièce au-delà de son maximum : de +1 à +5 % <b>au hasard</b> à toutes ses caractéristiques, jusqu\'à +' + CRISTAL.plafond + ' % au total (celle-ci est à +' + C.p + ' %' + (G.max < CRISTAL.max ? ' : ce cristal donnera au plus +' + G.max + ' %' : '') + '). Le cristal est consommé : on ne peut pas revenir en arrière.</div></div></div>' +
    '<div class="art">' + icoObjet(k) + '<div><b>' + (o.leg ? '✦ ' : o.rare ? '★ ' : '') + o.nom + '</b>' + L + '</div></div>' +
    '<p class="hdv-aide">Il te reste <b>' + stock + ' ' + (stock > 1 ? CRISTAL.court : CRISTAL.nom).toLowerCase() + '</b>. <b>Es-tu sûr de vouloir le poser ?</b></p>' +
    '<div class="act-bas"><button class="btn kamas" data-cristal-oui="' + k + '">Oui, le poser</button><button class="btn discret" data-cristal-non>Non</button></div>');
}
function poserCristal(k) {
  const C = cristauxDe(k), R = runes(); if (!forgeRunique() || !(R.cristal > 0) || qualiteJet(k) < 0.999 || C.p >= CRISTAL.plafond || !obj(k)) return;
  const g = Math.min(CRISTAL.min + Math.floor(Math.random() * (CRISTAL.max - CRISTAL.min + 1)), CRISTAL.plafond - C.p), p = C.p + g; /* (de 1 a 5 au hasard, rogne au plafond) */
  S_.cristaux = S_.cristaux || {}; S_.cristaux[k] = { p, n: C.n + 1 }; R.cristal--; son('niveau'); confettis(g >= 4 ? 45 : 25);
  toast('Cristal runique : +' + g + ' % ! ' + obj(k).nom + ' passe à +' + p + ' %' + (p >= CRISTAL.plafond ? ', le plafond.' : ' (plafond ' + CRISTAL.plafond + ' %).'), 'or'); rendreHaut(); sauver(); ouvrirForge();
}
document.addEventListener('click', (ev) => { const b = ev.target.closest('[data-cristal], [data-cristal-oui], [data-cristal-non]'); if (!b || b.disabled) return;
  if (b.dataset.cristal) confirmerCristal(b.dataset.cristal); else if (b.dataset.cristalOui) poserCristal(b.dataset.cristalOui); else ouvrirForge(); });
/* LA FORGE RUNIQUE, le modele du niveau 2 (blender/forgemagie2.py niv2) : charge seulement quand une ferme a l'atelier de forgemagie au niveau 2 ; il remplace
   le modele du niveau 1 (cloner) et la ferme se redessine quand le niveau change (achat, mode test) */
let FORGE2_CHARGE = false, nivForgeVu = -1;
function chargerForgeNiv2() { if (FORGE2_CHARGE || !MODELES.forge) return; FORGE2_CHARGE = true;
  chargerGlb('assets/modeles/jeu/forgemagie2-niv2.glb?v=' + (VERSIONS_FICHIERS['forgemagie2-niv2.glb'] || VERSION_MODELES)).then((sc) => {
    versToon(sc, { normales: 0.012, sansContour: SC_BATI }); sc.updateMatrixWorld(true);
    /* les cristaux luisent de leur couleur ; les eclats sont sortis du modele (il est fusionne) pour flotter a part */
    const lum = new Map(), eclats = [], nomDe = (m) => m.name.replace(/[._]?\d+$/, '');
    sc.traverse((m) => { if (!m.isMesh || !m.material || !m.material.color) return; const n = nomDe(m);
      if (n === 'cristal' || n === 'eclat') { const h = m.material.color.getHexString(); if (!lum.has(h)) { const M = m.material.clone(); M.emissive = M.color.clone(); M.emissiveIntensity = n === 'eclat' ? 0.55 : 0.32; lum.set(h, M); } m.material = lum.get(h); }
      if (n === 'eclat') eclats.push(m); });
    const posE = eclats.map((m) => m.getWorldPosition(new T.Vector3())); eclats.forEach((m) => m.parent.remove(m));
    const g = gabaritEchelle(sc, 'AtelierForge2', 1, new T.Vector3(0, 0, 0)); g.userData.v2 = true; const dy = -(g.userData.solY || 0);
    eclats.forEach((m, i) => { const e = new T.Mesh(m.geometry, m.material); e.position.set(posE[i].x, posE[i].y + dy, posE[i].z); e.scale.copy(m.getWorldScale(new T.Vector3())); e.castShadow = false; e.userData.eclat = { y0: e.position.y, ph: i * 2.1 }; g.add(e); });
    if (posE.length) { const c = posE.reduce((a, p) => a.add(p), new T.Vector3()).multiplyScalar(1 / posE.length);
      const halo = new T.Sprite(new T.SpriteMaterial({ map: typeof lueurDe === 'function' ? lueurDe('violet') : null, color: '#c79bff', transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.5 }));
      halo.position.set(c.x, 0.72 + dy, c.z); halo.scale.setScalar(1.25); halo.renderOrder = 6; halo.raycast = () => {}; halo.userData.haloCristal = true; g.add(halo); }
    MODELES.forgeNiv2 = g;
    if (S_ && niv('forge') >= 2) construireBatiments(); }).catch((e) => { console.warn('forge runique', e); FORGE2_CHARGE = false; }); }
/* les eclats flottent et tournent, le halo respire (a chaque image, avec les lumieres des batiments, 14i-nuit.js) */
{ const majLumieresBatCristal = majLumieresBat; let forgeVue = null, tCh = 0, tF = 0;
  majLumieresBat = function (dt) { try { if (MODELES.forgeNiv2) { tF += dt || 0; if (!forgeVue || !forgeVue.parent || tCh++ > 60) { tCh = 0; forgeVue = batisMesh.find((m) => m.userData.modele === 'forge' && m.userData.v2 && m.children.some((o) => o.userData.eclat)) || null; }
      if (forgeVue) forgeVue.children.forEach((o) => { const E = o.userData.eclat; if (E) { o.position.y = E.y0 + 0.045 * Math.sin(tF * 1.6 + E.ph); o.rotation.y = tF * 0.9 + E.ph; } else if (o.userData.haloCristal) o.material.opacity = 0.42 + 0.14 * Math.sin(tF * 1.3); }); } } catch (e) { /* rien */ }
    return majLumieresBatCristal.apply(this, arguments); }; }
{ const clonerForge = cloner; cloner = function (nom) { if (nom === 'forge' && MODELES.forgeNiv2 && S_ && niv('forge') >= 2) { const g = MODELES.forgeNiv2.clone(true); g.userData = Object.assign({}, MODELES.forgeNiv2.userData);
      g.children.forEach((o) => { if (o.isSprite || o.userData.eclat) o.raycast = () => {}; }); return g; } /* (la copie perd le raycast vide : celui d'un Sprite plante sans camera) */
    return clonerForge.apply(this, arguments); }; }
setInterval(() => { try { if (!S_ || !MODELES.forge) return; const n = niv('forge'); if (n >= 2 && !MODELES.forgeNiv2) chargerForgeNiv2();
    if (nivForgeVu >= 0 && n !== nivForgeVu && MODELES.forgeNiv2) construireBatiments(); nivForgeVu = n; } catch (e) { /* rien */ } }, 1500);
