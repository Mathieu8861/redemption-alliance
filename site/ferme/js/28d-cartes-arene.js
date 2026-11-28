'use strict';
/* LES NOUVELLES CARTES DE L'ARENE (26/11/2026, Mathieu par Discord : « vas-y fais-les toutes, on les mettra aussi au palier 11 ; faudra aussi faire des cartes
   legendaires qui donnent de meilleurs bonus, des trucs un peu inedits, du style invisibilite 3 secondes toutes les x secondes, degats x2 sur les 4 premieres
   secondes de vague ») : avec le palier 11 seulement (cartesArenePct : sa sortie, ou le mode test ; 27-arene.js).
   - onze cartes en plus (A a K proposees le 26/11), qui se cumulent comme les autres ; le Vol de vie passe de 1 a 2 % par carte ;
   - cinq cartes LEGENDAIRES, a cadre dore : une chance sur sept par carte tiree d'en voir une (s'il en reste a prendre), une seule fois chacune par partie.
   Les effets se branchent sur les coups recus (blesserPerso), les coups donnes (blesser), la force (boostDegats), les gains (gainsArene), la chute (persoATerre)
   et une petite boucle par partie, lancee a chaque vague (appliquerVagueArene). */
const CARTES_P11 = { pierre: 0.1, critique: 0.1, course: 10, epines: 0.2, ulti: 0.25, moisson: 0.01, bouclier: 0.15, souffle: 0.3, fureur: 0.25, bourse: 0.5 /* (0,25 avant le 28/11/2026 : « met +50 % bonus kamas », Mathieu) */, explosion: 0.15, volP11: 0.005 }; /* (volP11 : 0,01 avant le 28/11/2026, « Vol de vie 1,5 », Mathieu : 1,5 % au palier 11) */
const LEG_CARTES = { chance: 0.03, /* (3 % par carte tiree : la plus rare ; une sur sept avant les raretes, 26/11/2026) */ ombre: { periode: 15, duree: 3, bonus: 0.2 /* (+20 % de degats pendant l'invisibilite, 28/11/2026 : « peut-etre que ca donne un petit bonus de degats en plus, a voir », Mathieu) */ }, ouverture: { attente: 2.2, duree: 6, x: 2 }, temps: { periode: 20, duree: 2, boss: 1 }, aura: { R: 3.5 /* (1,75 case ; 3,2 soit 1,6 case avant le 28/11/2026, puis 2,5 cases, puis « passe a 1,75 case », Mathieu) */, pas: 0.5, part: 0.1 }, frenesie: { pas: 0.02, max: 0.4 } }; /* (26/11/2026, « Frenesie trop broken, mets 40 %, 2 % par monstre tue ; et up Entree fracassante, 5 ou 6 secondes », Mathieu : 4 % et 60 % avant ; l'Entree passe de 4 a 6 s) */
/* LES RARETES (26/11/2026, « il y a des cartes plus fortes, donc il faut que certaines cartes soient plus rares a avoir que d'autres », Mathieu) : au tirage, une carte
   commune pese 10, une rare 4, une epique 3 ; une legendaire a 3 % de chance par carte tiree (une sur sept avant) : environ 72 % de communes, 20 % de rares,
   4,5 % d'epiques et 3 % de legendaires. Une pastille sur la carte dit sa rarete. */
const RARETE_CARTES = { puissance: 'commune', agilite: 'commune', vita: 'commune', foule: 'commune', recharge: 'commune', butin: 'commune', pierre: 'commune', course: 'commune', moisson: 'rare' /* (commune avant le 28/11/2026 : « Moisson c'est plutot une carte rare », Mathieu) */, bourse: 'commune',
  esquive: 'rare', vol: 'rare', critique: 'rare', epines: 'rare', ulti: 'commune' /* (rare avant le 28/11/2026 : « 19 commune », Mathieu) */, bouclier: 'rare', fureur: 'rare', souffle: 'epique', explosion: 'epique' };
const POIDS_RARETE = { commune: 10, rare: 4, epique: 3 }, NOMS_RARETE = { rare: 'Rare', epique: 'Épique' };
const SVG_C = (s) => '<g ' + TR_CARTE + '>' + s + '</g>';
Object.assign(BONUS_ARENE, {
  pierre: { p11: true, nom: 'Peau de pierre', c: ['#8a8f99', '#7d838e', '#e2e5ea'], effet: '-10 % de dégâts reçus', txt: 'chaque coup qui te touche fait moins mal',
    svg: SVG_C('<path d="M60 8 96 20v26c0 22-16 36-36 44C40 82 24 68 24 46V20Z" fill="#b8bcc4"/><path d="M60 8v82M24 34h72" fill="none"/><path d="M42 22l6 10-4 8M74 52l8 6 2 10M38 58l10 4" fill="none" stroke-width="2.4"/>') },
  critique: { p11: true, nom: 'Coup critique', c: ['#d9443a', '#8e2a24', '#ffd2cc'], effet: '10 % de coups critiques', txt: 'un coup ou un sort critique fait le double de dégâts',
    svg: SVG_C('<path d="M60 4 68 30 96 24 76 44 98 62 70 60 62 88 52 62 24 70 42 48 20 28 48 32Z" fill="#ffd04a"/><path d="M46 60 80 26" stroke-width="7" stroke="#3b2a1a"/><path d="M46 60 80 26" stroke-width="3.5" stroke="#eef2f6"/><path d="M40 66l8-8M52 70 38 56" fill="none" stroke-width="4"/>') },
  course: { p11: true, nom: 'Pas de course', c: ['#3f9ad0', '#245f86', '#d2ecfa'], effet: '+10 % de vitesse de déplacement', txt: 'tu cours plus vite sur le sable',
    svg: SVG_C('<path d="M50 14h22v34l24 10c6 3 8 10 6 16H48Z" fill="#a8693a"/><path d="M48 66h56v8H48Z" fill="#6a4426"/><path d="M50 14h22v8H50Z" fill="#d9a46a"/>') + '<g stroke="#3f9ad0" stroke-width="4.5" stroke-linecap="round"><path d="M10 34h28M4 50h30M14 66h24"/></g>' },
  epines: { p11: true, nom: 'Épines', c: ['#5f9a3a', '#3a6422', '#dbefc9'], effet: 'renvoie 20 % au corps à corps', txt: 'qui te frappe de près se pique : il prend 20 % du coup',
    svg: SVG_C('<circle cx="60" cy="46" r="24" fill="#7fbf4a"/><path d="M60 8l6 14H54ZM60 84l6-14H54ZM22 46l14 6V40ZM98 46l-14 6V40ZM33 19l14 8-8 8ZM87 73l-14-8 8-8ZM87 19l-8 14-8-8ZM33 73l8-14 8 8Z" fill="#e8dcc0"/><circle cx="60" cy="46" r="9" fill="#3a6422"/>') },
  ulti: { p11: true, nom: 'Ulti chargé', c: ['#8a5ad6', '#55309a', '#e6d6fb'], effet: 'ulti 25 % plus vite', txt: 'ton ulti se recharge plus vite',
    svg: SVG_C('<circle cx="60" cy="46" r="30" fill="#b48cff"/><path d="M64 18 44 50h16l-6 26 24-36H62l8-22Z" fill="#ffe27a"/><path d="M96 30c4 12 2 26-8 36" fill="none" stroke-width="4"/><path d="M86 70l2-8 8 4" fill="none" stroke-width="4"/>') },
  moisson: { p11: true, nom: 'Moisson', c: ['#a8324a', '#6e1c2e', '#f6c9d2'], effet: '1 % de vie par monstre tué', txt: 'chaque monstre abattu te soigne',
    svg: SVG_C('<path d="M38 18c-14 0-22 10-22 22 0 8 4 14 10 18v10h24V58c6-4 10-10 10-18 0-12-8-22-22-22Z" fill="#efe7d0"/><circle cx="30" cy="40" r="5" fill="#3b2a1a"/><circle cx="46" cy="40" r="5" fill="#3b2a1a"/><path d="M34 60v8M42 60v8" fill="none" stroke-width="2.4"/><path d="M86 74C70 64 64 56 64 48c0-7 5-12 11-12 5 0 9 3 11 7 2-4 6-7 11-7 6 0 11 5 11 12 0 8-6 16-22 26Z" fill="#e8504a"/>') },
  bouclier: { p11: true, nom: 'Bouclier de la foule', c: ['#3f8fd6', '#21588a', '#d4e9fb'], effet: 'bouclier de 15 % de tes PV', txt: 'au début de chaque vague, il absorbe les coups',
    svg: '<circle cx="60" cy="48" r="36" fill="#7fc0f0" fill-opacity=".45" stroke="#21588a" stroke-width="3"/><path d="M36 26c6-6 14-10 24-10" stroke="#e8f6ff" stroke-width="5" fill="none" stroke-linecap="round"/>' + SVG_C('<circle cx="60" cy="40" r="9" fill="#f6d2b0"/><path d="M48 70c0-12 5-18 12-18s12 6 12 18Z" fill="#e07c0a"/>') },
  souffle: { p11: true, nom: 'Dernier souffle', c: ['#e8b23a', '#a0711a', '#fff1c4'], effet: 'une seconde vie (30 %)', txt: 'une fois par partie, au lieu de tomber, tu te relèves avec 30 % de ta vie, intouchable 1,5 s',
    svg: SVG_C('<path d="M60 80C30 62 18 46 18 31c0-12 10-21 21-21 9 0 17 6 21 14 4-8 12-14 21-14 11 0 21 9 21 21 0 15-12 31-42 49Z" fill="#ffd04a"/><path d="M14 52c-8-10-6-22 2-28 0 10 6 16 14 20M106 52c8-10 6-22-2-28 0 10-6 16-14 20" fill="#fff6d8"/><path d="M60 30v26M48 42h24" stroke="#fffaf0" stroke-width="6"/>') },
  fureur: { p11: true, nom: 'Fureur', c: ['#c8401e', '#7a2410', '#ffd3c2'], effet: '+25 % de dégâts sous 30 % de vie', txt: 'blessé, tu frappes plus fort',
    svg: SVG_C('<path d="M60 86c-20 0-30-14-30-28 0-16 12-22 14-38 8 8 10 16 10 22 4-6 6-14 4-26 14 10 24 26 24 42 0 16-10 28-22 28Z" fill="#ff7a2e"/><path d="M60 86c-10 0-14-8-14-14 0-8 6-12 8-20 6 6 8 12 8 16 2-2 4-6 4-10 6 6 8 12 8 16 0 6-6 12-14 12Z" fill="#ffd04a"/>') },
  bourse: { p11: true, nom: 'Bourse', c: ['#c9a032', '#8a6a16', '#fbefc4'], effet: '+50 % de kamas de l\'Arène', txt: 'chaque vague tenue rapporte plus',
    svg: SVG_C('<path d="M44 26h32l-6 10c16 6 24 20 22 34-2 12-14 18-32 18S30 82 28 70c-2-14 6-28 22-34Z" fill="#c8945a"/><path d="M44 26c4-8 28-8 32 0" fill="#a8693a"/><circle cx="86" cy="70" r="12" fill="#ffd04a"/><circle cx="22" cy="74" r="10" fill="#ffd04a"/>') + '<path d="M86 64v12M80 70h12" stroke="#a0711a" stroke-width="3"/>' },
  explosion: { p11: true, nom: 'Explosion', c: ['#e07c0a', '#9a4f06', '#ffe2b8'], effet: 'les monstres tués explosent', txt: '15 % de leur vie max aux monstres à 1,3 case autour',
    svg: SVG_C('<path d="M60 6 70 28 94 14 84 38 112 42 88 54 104 76 78 66 72 88 58 68 40 86 40 62 12 66 30 48 8 32 34 32 30 8 50 24Z" fill="#ff9a2e"/><path d="M60 26 66 38 80 32 74 46 88 50 74 56 80 70 66 62 60 74 54 62 40 70 46 56 32 50 46 46 40 32 54 38Z" fill="#ffe27a"/>') },
  /* les legendaires */
  ombre: { leg: true, p11: true, nom: 'Voile d\'ombre', c: ['#6b3fb8', '#3a1f6e', '#e2d4fb'], effet: 'invisible 3 s toutes les 15 s', txt: 'rien ne te touche, tu continues de taper, avec +20 % de dégâts',
    svg: SVG_C('<path d="M60 10c-18 0-28 14-28 30v42c6-4 10-4 14 0 4-4 10-4 14 0 4-4 10-4 14 0 4-4 8-4 14 0V40c0-16-10-30-28-30Z" fill="#5a3a9e" fill-opacity=".75"/>') + '<circle cx="50" cy="40" r="5" fill="#e2d4fb"/><circle cx="70" cy="40" r="5" fill="#e2d4fb"/><g fill="#b48cff" opacity=".7"><circle cx="18" cy="30" r="4"/><circle cx="102" cy="60" r="5"/><circle cx="96" cy="22" r="3"/></g>' },
  ouverture: { leg: true, p11: true, nom: 'Entrée fracassante', c: ['#d9443a', '#7a1f1a', '#ffe0b8'], effet: 'dégâts ×2 en début de vague', txt: 'les 6 premières secondes de chaque vague',
    svg: SVG_C('<path d="M20 70 48 16l8 26 22-20-8 30 30-6-34 38Z" fill="#ffb02e"/>') + '<text x="86" y="36" font-family="Lilita One, sans-serif" font-size="30" fill="#ffd04a" stroke="#3b2a1a" stroke-width="3" paint-order="stroke" text-anchor="middle">×2</text>' },
  temps: { leg: true, p11: true, nom: 'Arrêt du temps', c: ['#3fb0d0', '#1f6a80', '#d8f4fb'], effet: 'monstres figés 2 s toutes les 20 s', txt: 'les boss, 1 s seulement',
    svg: SVG_C('<path d="M36 10h48M36 82h48" fill="none" stroke-width="5"/><path d="M40 12c0 22 20 26 20 34S40 58 40 80h40c0-22-20-26-20-34s20-12 20-34Z" fill="#d8f4fb"/><path d="M48 76h24c-2-10-12-14-12-20-0 6-10 10-12 20Z" fill="#ffd04a"/>') + '<g stroke="#9fe3f5" stroke-width="3" stroke-linecap="round"><path d="M14 40l8 8M22 40l-8 8M98 30l8 8M106 30l-8 8"/></g>' },
  aura: { leg: true, p11: true, nom: 'Aura brûlante', c: ['#e8541c', '#8e2a0c', '#ffd8b8'], effet: 'les monstres proches brûlent', txt: '20 % de tes dégâts par seconde, à moins de 1,75 case', /* (la portee reglee a 1,75 case le 28/11/2026, a la demande de Mathieu) */
    svg: '<circle cx="60" cy="48" r="34" fill="none" stroke="#ff7a2e" stroke-width="7" stroke-dasharray="10 6"/>' + SVG_C('<path d="M60 70c-10 0-16-8-16-16 0-10 8-14 10-24 6 6 8 12 8 16 4-4 6-10 6-14 6 6 10 14 10 22 0 10-8 16-18 16Z" fill="#ffb02e"/>') },
  frenesie: { leg: true, p11: true, nom: 'Frénésie', c: ['#b0243a', '#6a1224', '#f7ccd4'], effet: '+2 % de dégâts par monstre tué', txt: 'jusqu\'à la fin de la partie, 40 % au plus',
    svg: SVG_C('<path d="M34 12c10 16 16 26 16 36a16 16 0 0 1-32 0c0-10 6-20 16-36Z" fill="#d0243a"/><path d="M80 80V30M66 44l14-14 14 14M96 66V40M86 50l10-10 10 10" fill="none" stroke-width="5"/>') } });
Object.assign(BONUS_ARENE.vol, { effetP11: '1,5 % de vol de vie', txtP11: 'tes coups te soignent de 1,5 % des dégâts infligés' });
Object.assign(BONUS_ARENE.foule, { txtP11: 'à chaque vague tenue, la foule te rend 6 % de vie en plus (12 % sans la carte)' }); /* (28/11/2026, « fais pareil pour toutes les cartes sans chiffres », Mathieu) */
Object.assign(BONUS_ARENE.esquive, { effetP11: '15 % d\'esquive', txtP11: 'une chance d\'éviter chaque coup (60 % au plus)' }); /* (28/11/2026, Mathieu ; le calcul dans 21-combat.js) */

/* le tirage : les cartes du palier 11 seulement avec lui ; une legendaire (pas deja prise) a une chance sur sept par carte */
{ const tirer0 = tirerBonusArene; tirerBonusArene = function () { if (!cartesArenePct()) { const L = Object.keys(BONUS_ARENE).filter((id) => !BONUS_ARENE[id].p11); for (let i = L.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [L[i], L[j]] = [L[j], L[i]]; } return L.slice(0, 3); } /* (26/11/2026 : les joueurs tirent seulement parmi les anciennes cartes ; avant, trois cartes du palier 11 tirees d'un coup relancaient un tirage SANS filtre, et elles sortaient chez les joueurs sans effet, « j'ai eu Entree fracassante et pas de difference de degats », Dinomight) */
  const pris = (bonusA() || {}), norm = Object.keys(BONUS_ARENE).filter((id) => !BONUS_ARENE[id].leg && okCarte(id)), leg = Object.keys(BONUS_ARENE).filter((id) => BONUS_ARENE[id].leg && !pris[id] && okCarte(id)), out = [];
  const pese = (L) => { const P = L.map((id) => POIDS_RARETE[RARETE_CARTES[id] || 'commune'] || 10), T0 = P.reduce((a, b) => a + b, 0); let x = Math.random() * T0; for (let i = 0; i < L.length; i++) { x -= P[i]; if (x <= 0) return i; } return L.length - 1; };
  for (let k = 0; k < 3; k++) { if (leg.length && Math.random() < LEG_CARTES.chance) { out.push(leg.splice(Math.floor(Math.random() * leg.length), 1)[0]); continue; } out.push(norm.splice(pese(norm), 1)[0]); }
  return out; }; }
/* le cadre dore des legendaires */
{ const carte0 = carteArene; carteArene = function (id) { const h = carte0.apply(this, arguments); if (BONUS_ARENE[id] && BONUS_ARENE[id].leg) return h.replace('<button class="bca', '<button class="bca leg').replace('<span class="bca-gemme"></span>', '<span class="bca-gemme"></span><span class="bca-leg">Légendaire</span>');
  const r = cartesArenePct() && RARETE_CARTES[id]; return r && NOMS_RARETE[r] ? h.replace('<button class="bca', '<button class="bca ' + r).replace('<span class="bca-gemme"></span>', '<span class="bca-gemme"></span><span class="bca-leg bca-rar ' + r + '">' + NOMS_RARETE[r] + '</span>') : h; }; } /* (et la pastille des rares et des epiques) */
/* une carte prise : la vitesse (Pas de course) passe par les caracteristiques, on les relit ; les legendaires s'annoncent */
{ const prendre0 = prendreBonusArene; prendreBonusArene = function (id) { const r = prendre0.apply(this, arguments); if (combat) { combat.p11 = null; if (BONUS_ARENE[id] && BONUS_ARENE[id].leg) son('niveau'); } return r; }; }

/* ---------- les effets ---------- */
const nbC = (id) => (cartesArenePct() ? nbBonus(id) : 0);
const auPerso = (txt) => { if (!paysanMesh) return; const p = paysanMesh.position.clone(); p.y += 1.9; chiffre(txt, p, 'perso'); };
{ const bp0 = blesserPerso; blesserPerso = function (n, mo) { const c = combat; if (!c || !c.arene || c.fin || !cartesArenePct()) return bp0.apply(this, arguments);
  if (c.ombreT > 0) { if ((c.ombreTxt || 0) < performance.now()) { c.ombreTxt = performance.now() + 500; auPerso('Invisible'); } return; } /* (Voile d'ombre) */
  const kP = nbC('pierre'); if (kP) n = Math.max(1, Math.round(n * Math.max(0.5, 1 - CARTES_P11.pierre * kP)));
  const kE = nbC('epines'); if (kE && mo && mo.etat === 'actif' && !coupDeLoin(mo)) { blesser(mo, Math.max(1, Math.round(n * CARTES_P11.epines * kE))); epinesVisibles(c, mo); }
  if (c.bouclierCarte > 0 && n > 0) { const a = Math.min(c.bouclierCarte, n); c.bouclierCarte -= a; n -= a; if (a > 0 && (c.bouclierTxt || 0) < performance.now()) { c.bouclierTxt = performance.now() + 350; auPerso('Bouclier -' + fmt(a)); const q = paysanMesh.position; onde(q.x, q.y + 0.05, q.z, 1.5, '#1e8be0', 0.3, 0.8, true); c.bouclierFlash = 0.25; } if (n <= 0) return true; }
  return bp0.call(this, n, mo); }; }
let EXPLOSION_EN_COURS = false;
{ const b0 = blesser; blesser = function (mo, n, gros, src) { const c = combat; if (!c || !c.arene || !cartesArenePct() || !mo || mo.etat !== 'actif') return b0.apply(this, arguments);
  const kC = nbC('critique'); if (kC && src !== 'def' && n > 0 && Math.random() < Math.min(0.5, CARTES_P11.critique * kC)) { n *= 2; const p = new T.Vector3(mo.x, mo.m.position.y + (mo.haut || 1.6) + 0.6, mo.z); chiffre('Critique !', p, 'gros'); }
  const pv0 = mo.pv, r = b0.call(this, mo, n, gros, src), fait = Math.max(0, pv0 - Math.max(0, mo.pv));
  if (fait > 0 && src !== 'def') { const kV = nbC('vol'); if (kV) c.pv = Math.min(c.pvMax, c.pv + fait * CARTES_P11.volP11 * kV); } /* (le Vol de vie a 1,5 % : 0,5 % de plus, ici) */
  if (mo.etat === 'mort' && pv0 > 0) {
    const kM = nbC('moisson'); if (kM) { const s0 = c.pv; c.pv = Math.min(c.pvMax, c.pv + c.pvMax * CARTES_P11.moisson * kM); soinVisible(c.pv - s0); }
    if (nbC('frenesie')) { const f0 = c.frenesie || 0; c.frenesie = Math.min(LEG_CARTES.frenesie.max, f0 + LEG_CARTES.frenesie.pas); if (c.frenesie > f0) { auPerso('Frénésie +' + Math.round(c.frenesie * 100) + ' %'); const q = paysanMesh.position; onde(q.x, q.y + 0.05, q.z, 1.6, '#d81e1e', 0.35, 0.8, true); } }
    const kX = nbC('explosion'); if (kX && !EXPLOSION_EN_COURS) { EXPLOSION_EN_COURS = true; try { const y = mo.m ? mo.m.position.y : 0; pouf(mo.x, y + 0.4, mo.z, 2.2, '#ff9a2e'); onde(mo.x, y + 0.05, mo.z, 2.6, '#ffb04a', 0.35, 0.8);
        boule(mo.x, y + 0.5, mo.z, 1.0, ['#ffb02e', '#e8541e', '#7a1e0a'], true); onde(mo.x, y + 0.05, mo.z, 2.6, '#d8420e', 0.45, 0.8, true); flashLumiere(mo.x, y + 1, mo.z, '#ff8a2e', 3.5, 7, 0.35); secousse(0.06, 0.15); /* (28/11/2026 : on ne voyait qu'un petit nuage) */
        emettre(FX_VIF, 14, { x: mo.x, y: y + 0.6, z: mo.z, r: 0.3, dv: 5, haut: true, vie: [0.35, 0.6], taille: [0.12, 0.04], c: ['#fff1a8', '#ff9a2e', '#c8401e'], grav: 8, frein: 1 });
        const dg = Math.max(1, Math.round((mo.pvMax || 0) * CARTES_P11.explosion * kX)); c.monstres.forEach((o) => { if (o !== mo && o.etat === 'actif' && Math.hypot(o.x - mo.x, o.z - mo.z) < 2.6) blesser(o, dg); }); } finally { EXPLOSION_EN_COURS = false; } } }
  return r; }; }
{ const bd0 = boostDegats; boostDegats = function () { let k = bd0.apply(this, arguments); const c = combat; if (!c || !c.arene || !cartesArenePct()) return k;
  if (nbC('fureur') && c.pv < c.pvMax * 0.3) k *= 1 + CARTES_P11.fureur * nbC('fureur');
  if (nbC('ouverture') && c.ouvertureJusque && performance.now() < c.ouvertureJusque && performance.now() > c.ouvertureDebut) k *= LEG_CARTES.ouverture.x;
  if (c.frenesie) k *= 1 + c.frenesie;
  if (nbC('ombre') && c.ombreT > 0) k *= 1 + LEG_CARTES.ombre.bonus; /* (Voile d'ombre : +20 % pendant l'invisibilite) */ return k; }; }
{ const g0 = gainsArene; gainsArene = function () { const g = g0.apply(this, arguments); const k = nbC('bourse'); if (k && g) g.kamas = Math.round(g.kamas * (1 + CARTES_P11.bourse * k)); return g; }; }
{ const at0 = persoATerre; persoATerre = function () { const c = combat; if (c && c.arene && c.genre === 'arene' && nbC('souffle') && !c.souffleFait) { c.souffleFait = true; c.pv = Math.round(c.pvMax * CARTES_P11.souffle); c.invincible = Math.max(c.invincible || 0, 1.5);
    const p = paysanMesh.position; pouf(p.x, p.y + 0.6, p.z, 2.4, '#ffd04a'); flashLumiere(p.x, p.y + 1.5, p.z, '#ffd04a', 4, 8, 0.5); auPerso('Dernier souffle !'); souffleVisible(p); toast('Dernier souffle : tu te relèves avec ' + Math.round(CARTES_P11.souffle * 100) + ' % de ta vie !', 'or'); majCombatHud(); return; }
  return at0.apply(this, arguments); }; }
/* la boucle de la partie : lancee a chaque vague (une seule par partie) ; le bouclier se remplit a chaque vague, la Frenesie repart de zero, l'Entree fracassante s'arme */
function bouclierVisuel(c) { if (c.bouclierM || !paysanMesh) return; const m = new T.Mesh(new T.SphereGeometry(1.05, 20, 14), new T.MeshBasicMaterial({ color: '#7fc0f0', transparent: true, opacity: 0.22, depthWrite: false })); m.position.y = 0.95; m.raycast = () => {}; paysanMesh.add(m); c.bouclierM = m;
  const fil = new T.Mesh(new T.IcosahedronGeometry(1.09, 1), new T.MeshBasicMaterial({ color: '#1e8be0', wireframe: true, transparent: true, opacity: 0.55, depthWrite: false })); fil.raycast = () => {}; m.add(fil); m.userData.fil = fil; } /* (28/11/2026 : la bulle bleu pale se perdait sur le sable ; un maillage bleu franc par-dessus) */
{ const av0 = appliquerVagueArene; appliquerVagueArene = function (c, p) { const r = av0.apply(this, arguments); if (!c || !cartesArenePct()) return r;
  const kB = nbC('bouclier'); if (kB) { c.bouclierCarte = Math.round(c.pvMax * CARTES_P11.bouclier * kB); bouclierVisuel(c); }
  /* (la Frenesie ne repart plus a zero a chaque vague : elle se garde jusqu'a la fin de la partie, 40 % au plus ; « garde les 40 % de degats jusqu'a la fin », Mathieu, 28/11/2026) */ if (nbC('ouverture')) { const O = LEG_CARTES.ouverture; c.ouvertureDebut = performance.now() + O.attente * 1000; c.ouvertureJusque = c.ouvertureDebut + O.duree * 1000; setTimeout(() => { if (combat === c && !c.fin) { auPerso('Dégâts ×2 !'); flashLumiere(paysanMesh.position.x, 1.5, paysanMesh.position.z, '#ff7a2e', 3, 7, 0.4); } }, O.attente * 1000); }
  if (!c.carteTick) { c.carteTick = true; effets.push((dt) => { if (combat !== c || c.fin) { if (c.bouclierM) { c.bouclierM.parent && c.bouclierM.parent.remove(c.bouclierM); c.bouclierM = null; } nettoyerAnimCartes(c); return true; } tickCartes(c, dt); return false; }); }
  return r; }; }
function tickCartes(c, dt) {
  if (enPause || c.entracte) return;
  const kU = nbC('ulti'); if (kU && c.cdUlti > 0) c.cdUlti = Math.max(0, c.cdUlti - dt * CARTES_P11.ulti * kU); /* (Ulti charge : en plus de la recharge normale) */
  if (c.bouclierM) { c.bouclierM.visible = c.bouclierCarte > 0; c.bouclierFlash = Math.max(0, (c.bouclierFlash || 0) - dt); const fl = c.bouclierFlash / 0.25; c.bouclierM.material.opacity = 0.2 + 0.08 * Math.sin(performance.now() / 300) + 0.3 * fl; const fil = c.bouclierM.userData.fil; if (fil) { fil.material.opacity = 0.5 + 0.15 * Math.sin(performance.now() / 220) + 0.4 * fl; fil.rotation.y += dt * 0.6; } }
  const pp = paysanMesh.position;
  if (nbC('ombre')) { const O = LEG_CARTES.ombre; c.ombreCycle = (c.ombreCycle || 0) + dt; if (c.ombreCycle >= O.periode) { c.ombreCycle = 0; c.ombreT = O.duree; auPerso('Voile d\'ombre'); pouf(pp.x, pp.y + 0.8, pp.z, 1.8, '#5a3a9e'); }
    if (c.ombreT > 0) { c.ombreT -= dt; paysanMesh.visible = Math.floor(performance.now() / 90) % 3 !== 0; if (Math.random() < 0.5) emettre(FX_FUM, 1, { x: pp.x, y: pp.y + 0.6, z: pp.z, r: 0.5, v: [0, 0.6, 0], vie: [0.5, 0.8], taille: [0.4, 1.0], c: ['#3a1f6e', '#6b3fb8'], a: 0.35, frein: 1 }); if (c.ombreT <= 0) paysanMesh.visible = true; } }
  majAnneauxCartes(c, dt);
  if (nbC('temps')) { const Tm = LEG_CARTES.temps; c.tempsCycle = (c.tempsCycle || 0) + dt; if (c.tempsCycle >= Tm.periode) { c.tempsCycle = 0; let n = 0;
      c.monstres.forEach((o) => { if (o.etat !== 'actif') return; const d = o.d.boss ? Tm.boss : Tm.duree; o.bloqueT = Math.max(o.bloqueT || 0, d); o.cd = Math.max(o.cd || 0, d); n++; glaceCarte(o, d);
        emettre(FX_VIF, 6, { x: o.x, y: (o.m ? o.m.position.y : 0) + 0.8, z: o.z, r: 0.5, dv: 1.2, vie: [0.6, 1.0], taille: [0.1, 0.05], c: ['#ffffff', '#bfefff', '#7fd8f0'], grav: 1, frein: 1 }); });
      if (n) { auPerso('Arrêt du temps !'); flashLumiere(pp.x, 2, pp.z, '#9fe3f5', 4, 14, 0.5); onde(pp.x, pp.y + 0.05, pp.z, 9, '#5fc8f0', 0.7, 0.85, true); onde(pp.x, pp.y + 0.05, pp.z, 5, '#e8fbff', 0.5, 0.9, true); } } }
  if (nbC('aura')) majAuraVisible(c, dt); else if (c.auraM) { jeter(c.auraM); c.auraM = null; }
  if (nbC('aura')) { const A = LEG_CARTES.aura; c.auraT = (c.auraT || 0) + dt; if (c.auraT >= A.pas) { c.auraT = 0; const dg = Math.max(1, Math.round(statsPerso().deg * A.part));
      c.monstres.forEach((o) => { if (o.etat === 'actif' && Math.hypot(o.x - pp.x, o.z - pp.z) < A.R) blesser(o, dg); });
      for (let k = 0; k < 4; k++) { const a = Math.random() * Math.PI * 2, rr = A.R * (0.6 + 0.4 * Math.random()); emettre(FX_VIF, 1, { x: pp.x + Math.cos(a) * rr, y: pp.y + 0.15, z: pp.z + Math.sin(a) * rr, v: [0, 1.6, 0], dv: 0.4, vie: [0.35, 0.6], taille: [0.28, 0.06], c: ['#ffd25a', '#ff6a12', '#b0280e'], a: 0.9, frein: 1 }); } } }
}
/* ---------- LE DEUXIEME LOT DE CARTES (26/11/2026, la nuit, Mathieu par Discord : « cree d'autres cartes, trouve des idees originales, des cartes basiques, des
   fortes et des legendaires ; genre que ca puisse te up certaines choses, sorts, item legendaire, que ca fasse l'effet d'un sort toutes les x secondes,
   reduction de cooldown, des invocations etc. ») : quinze cartes, avec le palier 11 comme les autres.
   - communes : Regeneration, Tueur de geants, Coup de grace, Relique polie (les sorts legendaires) ;
   - rares : Echo (le sort de classe se relance), Meteore, Chaine d'eclairs, Lames tournoyantes, Siphon d'ames (chaque monstre tue recharge les sorts) ;
   - epiques : Totem de guerre et Bouftou de guerre (des invocations), Deluge de fleches ;
   - legendaires : Forme de titan, Relique vivante (les sorts legendaires partent seuls), Ultime en echo (l'ulti se relance seul).
   Une carte qui agit toutes les x secondes fait 50 % de degats de plus par exemplaire en plus ; les cartes des sorts legendaires ne sortent qu'a qui en porte un,
   l'Ultime en echo qu'a qui a un ulti. */
const CARTES_P11B = { regen: { pas: 5 /* (3 avant le 28/11/2026 : « Regeneration toutes les 5 secondes », Mathieu) */, part: 0.01 }, geant: 0.15, grace: { seuil: 0.3, x: 0.25 }, relique: 0.25, echo: { chance: 0.25, max: 0.6 },
  meteore: { periode: 7, portee: 10, R: 1.6, x: 1.5, chute: 0.55 }, eclair: { coups: 5 /* (toutes les 5 s avant le 28/11/2026 : « faudrait que ca fasse le meme effet mais toutes les 5 auto attaques », Mathieu) */, portee: 8, saut: 4.5, n: 3, x: 0.8 },
  lames: { n: 2, max: 4, R: 1.7, w: 4.2, touche: 0.75, x: 0.4, cd: 0.45 }, ames: 0.5,
  totem: { periode: 20, duree: 10, tir: 0.7, portee: 9, x: 0.5 }, bouftou: { periode: 25, duree: 10, x: 0.7, cadence: 0.8, vitesse: 5.5, portee: 1.3 },
  deluge: { periode: 12, R: 2.6, volees: 3, ecart: 0.4, x: 0.6 }, titan: { periode: 30, duree: 6, x: 1.5, recus: 0.7, taille: 1.35 }, relvive: 0.3, ultecho: { delai: 1.2 } };
Object.assign(RARETE_CARTES, { regen: 'commune', geant: 'commune', grace: 'commune', relique: 'commune', echo: 'rare', meteore: 'rare', eclair: 'rare', lames: 'rare', ames: 'rare', totem: 'epique', bouftou: 'epique', deluge: 'epique' });
const okCarte = (id) => { const B = BONUS_ARENE[id]; return !!B && (!B.requiert || B.requiert()); }; /* (une carte qui demande une piece legendaire ou un ulti) */
const aLegendaire = () => { try { return !!(legDe('coiffe') || legDe('arme')); } catch (e) { return false; } };
const flecheSvg = (x, y) => { const dx = 0.5, dy = 0.866, L = 30, tx = x + dx * L, ty = y + dy * L, px = -dy, py = dx, f = (v) => v.toFixed(1);
  return '<path d="M' + x + ' ' + y + 'L' + f(tx) + ' ' + f(ty) + '" stroke-width="4"/><path d="M' + f(tx + dx * 4) + ' ' + f(ty + dy * 4) + 'L' + f(tx - dx * 6 + px * 5) + ' ' + f(ty - dy * 6 + py * 5) + 'L' + f(tx - dx * 6 - px * 5) + ' ' + f(ty - dy * 6 - py * 5) + 'Z" fill="#ffd04a"/>' +
    '<path d="M' + x + ' ' + y + 'l' + f(px * 5 - dx * 4) + ' ' + f(py * 5 - dy * 4) + 'M' + x + ' ' + y + 'l' + f(-px * 5 - dx * 4) + ' ' + f(-py * 5 - dy * 4) + '" stroke="#e8504a" stroke-width="3.5"/>'; };
const ETOILE_SVG = '<path d="M52 12l9 22 24 2-18 16 6 24-21-13-21 13 6-24-18-16 24-2Z" fill="#ffd04a"/>';
Object.assign(BONUS_ARENE, {
  regen: { p11: true, nom: 'Régénération', c: ['#3fae6a', '#3a9a5e', '#d2f2dc'], effet: '1 % de vie toutes les 5 s', txt: 'tes blessures se referment seules',
    svg: SVG_C('<path d="M54 84C26 68 16 54 16 40c0-11 9-19 19-19 8 0 15 5 19 12 4-7 11-12 19-12 10 0 19 8 19 19 0 14-10 28-38 44Z" fill="#5fd08a"/><path d="M54 38v26M41 51h26" stroke="#ffffff" stroke-width="6.5"/><path d="M98 34v14M91 41h14M104 10v10M99 15h10" fill="none" stroke="#3fae6a" stroke-width="4"/>') },
  geant: { p11: true, nom: 'Tueur de géants', c: ['#d8924e', '#b8783a', '#f2dcc0'], effet: '+15 % de dégâts aux boss', txt: 'et aux demi-boss',
    svg: SVG_C('<path d="M34 30c-8-12-6-20 0-24 2 9 8 13 14 15M86 30c8-12 6-20 0-24-2 9-8 13-14 15" fill="#e8dcc0"/><path d="M60 18c-20 0-32 14-32 32 0 14 8 24 18 28v10h28V78c10-4 18-14 18-28 0-18-12-32-32-32Z" fill="#a8693a"/><circle cx="48" cy="50" r="6" fill="#ffd04a"/><circle cx="72" cy="50" r="6" fill="#ffd04a"/><path d="M50 70h20" fill="none"/>') +
      '<path d="M16 88 98 10" stroke="#3b2a1a" stroke-width="9" stroke-linecap="round"/><path d="M18 86 96 12" stroke="#eef2f6" stroke-width="4.5" stroke-linecap="round"/><path d="M12 72l16 16" stroke="#3b2a1a" stroke-width="6" stroke-linecap="round"/>' },
  grace: { p11: true, nom: 'Coup de grâce', c: ['#ec5a68', '#d84a5a', '#fbd0d6'], effet: '+25 % de dégâts aux blessés', txt: 'sur les monstres sous 30 % de vie',
    svg: SVG_C('<rect x="12" y="64" width="96" height="18" rx="7" fill="#3b2a1a"/><rect x="17" y="69" width="22" height="8" rx="3" fill="#e8504a" stroke="none"/><path d="M78 6l10 6-26 42-8-4Z" fill="#dfe6ee"/><path d="M50 46l16 8" fill="none" stroke-width="6"/><path d="M53 52l-7 10" fill="none" stroke-width="5"/>') },
  relique: { p11: true, requiert: aLegendaire, nom: 'Relique polie', c: ['#d9a632', '#c89a2a', '#fff0c0'], effet: 'légendaires 25 % plus vite', txt: 'les sorts de ta coiffe et de ton arme légendaires se rechargent plus vite',
    svg: SVG_C('<path d="M60 8 86 30 60 84 34 30Z" fill="#b48cff"/><path d="M34 30h52M60 8 50 30l10 54 10-54Z" fill="none"/><path d="M60 8 50 30h20Z" fill="#e2d4fb"/>') + '<g fill="#ffd04a" stroke="#3b2a1a" stroke-width="2"><path d="M18 20l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/><path d="M100 52l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></g>' },
  echo: { p11: true, nom: 'Écho', c: ['#4a9ad6', '#3f8ac6', '#d6ecfb'], effet: '25 % de chances de relancer ton sort', txt: 'ton sort de classe est aussitôt prêt à repartir (60 % au plus)', /* (texte refait le 28/11/2026 : « la 22 est pas tres claire », puis « ouais met cette explication », Mathieu) */
    svg: '<g opacity=".45">' + SVG_C('<circle cx="74" cy="44" r="26" fill="#9fd0ff"/>') + '</g>' + SVG_C('<circle cx="48" cy="50" r="26" fill="#4a9ad6"/><path d="M38 52a11 11 0 1 1 11 11" fill="none" stroke="#e8f6ff" stroke-width="5"/>') +
      '<path d="M94 18c8 7 11 17 9 27M102 9c12 10 16 25 12 40" fill="none" stroke="#4a9ad6" stroke-width="4.5" stroke-linecap="round"/>' },
  meteore: { p11: true, nom: 'Météore', c: ['#e0602a', '#d0602a', '#ffdcc4'], effet: 'une météorite toutes les 7 s', txt: '150 % de tes dégâts sur le monstre le plus proche et autour',
    svg: '<path d="M104 4 54 52" stroke="#ff9a2e" stroke-width="22" stroke-linecap="round" opacity=".5"/><path d="M100 8 58 48" stroke="#ffd04a" stroke-width="9" stroke-linecap="round"/>' + SVG_C('<circle cx="46" cy="58" r="22" fill="#6a5248"/><circle cx="39" cy="52" r="5" fill="#4a3830"/><circle cx="54" cy="65" r="4" fill="#4a3830"/>') + '<path d="M14 88h62" stroke="#ffb02e" stroke-width="4.5" stroke-linecap="round"/>' },
  eclair: { p11: true, nom: 'Chaîne d\'éclairs', c: ['#4ab4e8', '#3a9ac6', '#d6f0fb'], effet: 'un éclair toutes les 5 attaques', txt: 'à ta 5e attaque, il saute sur 3 monstres : 80 % de tes dégâts chacun',
    svg: '<path d="M20 70 34 48 28 45 62 28M62 28 78 52 72 55 100 66" fill="none" stroke="#3b2a1a" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 70 34 48 28 45 62 28M62 28 78 52 72 55 100 66" fill="none" stroke="#bff0ff" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      SVG_C('<circle cx="20" cy="72" r="10" fill="#a8693a"/><circle cx="62" cy="26" r="10" fill="#a8693a"/><circle cx="100" cy="68" r="10" fill="#a8693a"/>') },
  lames: { p11: true, nom: 'Lames tournoyantes', c: ['#b4c2d6', '#8a9ab0', '#e2e8f0'], effet: 'des lames tournent autour de toi', txt: '2 lames (+1 par carte, 4 au plus) : 40 % de tes dégâts à chaque passage',
    svg: '<circle cx="60" cy="48" r="32" fill="none" stroke="#7a8698" stroke-width="4" stroke-dasharray="6 8"/>' + SVG_C('<circle cx="60" cy="48" r="11" fill="#e07c0a"/><path d="M94 46c0-15-7-26-18-30 5 11 5 22 0 30Z" fill="#dfe6ee"/><path d="M26 50c0 15 7 26 18 30-5-11-5-22 0-30Z" fill="#dfe6ee"/>') },
  ames: { p11: true, nom: 'Siphon d\'âmes', c: ['#3fc0a8', '#2fa892', '#d2f6ee'], effet: 'chaque monstre tué recharge tes sorts', txt: '0,5 s de moins sur tous tes sorts, l\'ulti compris',
    svg: SVG_C('<path d="M30 72c-10-4-14-14-10-22 2 8 8 10 12 8-6-8-4-18 4-22-2 8 2 14 8 14 0 12-4 20-14 22Z" fill="#9ff0dc"/><path d="M90 24c10 4 14 14 10 22-2-8-8-10-12-8 6 8 4 18-4 22 2-8-2-14-8-14 0-12 4-20 14-22Z" fill="#9ff0dc"/><circle cx="60" cy="48" r="15" fill="#3fc0a8"/><path d="M60 39v9l7 5" fill="none" stroke="#ffffff" stroke-width="3.5"/>') },
  totem: { p11: true, nom: 'Totem de guerre', c: ['#dc9a52', '#b87a40', '#f2dcc0'], effet: 'un totem toutes les 20 s', txt: 'il sort du sable et tire 10 s : 50 % de tes dégâts toutes les 0,7 s, jusqu\'à 4,5 cases',
    svg: SVG_C('<path d="M44 24h32v64H44Z" fill="#c8945a"/><path d="M44 48h32M44 70h32" fill="none"/><circle cx="53" cy="36" r="4.5" fill="#ffd04a"/><circle cx="67" cy="36" r="4.5" fill="#ffd04a"/><path d="M52 60h16" fill="none"/><path d="M44 24c-7-10-5-17 2-21 0 8 6 10 9 14M76 24c7-10 5-17-2-21 0 8-6 10-9 14" fill="#e8504a"/>') + '<path d="M80 34 108 20" stroke="#ffd04a" stroke-width="5" stroke-linecap="round"/><circle cx="108" cy="20" r="6" fill="#fff6b0" stroke="#3b2a1a" stroke-width="2"/>' },
  bouftou: { p11: true, nom: 'Bouftou de guerre', c: ['#c9b48a', '#a8946a', '#fbf3e2'], effet: 'un Bouftou allié toutes les 25 s', txt: 'il atterrit (105 % de tes dégâts autour), puis frappe 10 s : 70 % de tes dégâts toutes les 0,8 s', /* (ses degats ecrits sur la carte, 28/11/2026 : « c'est quoi les degats de base du Bouftou de guerre ? faudrait que ce soit indique », Mathieu) */
    svg: SVG_C('<circle cx="60" cy="54" r="30" fill="#f4ecdc"/><circle cx="40" cy="38" r="13" fill="#f4ecdc"/><circle cx="80" cy="38" r="13" fill="#f4ecdc"/><circle cx="60" cy="30" r="15" fill="#f4ecdc"/><path d="M46 56c0-8 6-12 14-12s14 4 14 12c0 10-6 18-14 18s-14-8-14-18Z" fill="#8a6a4a"/><circle cx="54" cy="55" r="3" fill="#ffffff"/><circle cx="66" cy="55" r="3" fill="#ffffff"/><path d="M30 46c-10 0-16 8-14 18 4-4 8-6 12-4M90 46c10 0 16 8 14 18-4-4-8-6-12-4" fill="#c9a032"/>') },
  deluge: { p11: true, nom: 'Déluge de flèches', c: ['#d06a2a', '#c0622a', '#ffe0c8'], effet: 'une pluie de flèches toutes les 12 s', txt: 'sur le plus gros groupe : trois volées de 60 % de tes dégâts',
    svg: SVG_C(flecheSvg(18, 6) + flecheSvg(46, 2) + flecheSvg(74, 8) + flecheSvg(30, 44) + flecheSvg(60, 46)) },
  titan: { leg: true, p11: true, nom: 'Forme de titan', c: ['#c8401e', '#6a1e0e', '#ffd8c8'], effet: 'géant 6 s toutes les 30 s', txt: 'pendant ces 6 s : tes dégâts ×1,5, tu reçois 30 % de dégâts en moins, rien ne peut te ralentir ni t\'immobiliser',
    svg: SVG_C('<circle cx="64" cy="22" r="13" fill="#f6d2b0"/><path d="M38 90c0-30 11-52 26-52s26 22 26 52Z" fill="#e07c0a"/><circle cx="22" cy="64" r="6" fill="#f6d2b0"/><path d="M12 90c0-14 4-21 10-21s10 7 10 21Z" fill="#c8945a"/>') + '<path d="M104 62V20M93 31l11-11 11 11" fill="none" stroke="#ffd04a" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>' },
  relvive: { leg: true, p11: true, requiert: aLegendaire, nom: 'Relique vivante', c: ['#9a4ad6', '#4a1f7a', '#ecd8fb'], effet: 'tes légendaires partent seuls', txt: 'ta coiffe et ton arme lancent leur sort dès qu\'il est prêt, recharge 30 % plus rapide',
    svg: SVG_C('<path d="M60 8 84 28 60 78 36 28Z" fill="#ffd04a"/><path d="M36 28h48M60 8 52 28l8 50 8-50Z" fill="none"/>') + '<path d="M20 58a42 42 0 0 0 80 0" fill="none" stroke="#b48cff" stroke-width="5.5" stroke-linecap="round"/><path d="M92 50l7 8 8-5M28 50l-7 8-8-5" fill="none" stroke="#b48cff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>' },
  ultecho: { leg: true, p11: true, requiert: () => !!(S_ && S_.ulti), nom: 'Ultime en écho', c: ['#e8b23a', '#8a5a0e', '#fff0c4'], effet: 'ton ulti se relance seul', txt: 'une deuxième fois, gratuitement, juste après le premier',
    svg: '<g opacity=".42" transform="translate(18 -4)">' + SVG_C(ETOILE_SVG) + '</g>' + SVG_C(ETOILE_SVG) + '<text x="94" y="84" font-family="Lilita One, sans-serif" font-size="28" fill="#ffd04a" stroke="#3b2a1a" stroke-width="3" paint-order="stroke" text-anchor="middle">×2</text>' } });

/* ---------- leurs effets ---------- */
const degCarte = () => { try { return statsPerso().deg; } catch (e) { return 10; } };
const yDe = (o) => (o && o.m ? o.m.position.y : 0);
const multCarte = (id) => 1 + 0.5 * Math.max(0, nbC(id) - 1); /* (toutes les x secondes : +50 % par exemplaire en plus) */
function plusProcheCarte(c, x, z, portee, sauf) { let b = null, bd = portee; c.monstres.forEach((o) => { if (o.etat !== 'actif' || (sauf && sauf.has(o))) return; const d = Math.hypot(o.x - x, o.z - z); if (d < bd) { bd = d; b = o; } }); return b; }
function plusGrosGroupe(c, R, portee) { const pp = paysanMesh.position, L = c.monstres.filter((o) => o.etat === 'actif' && Math.hypot(o.x - pp.x, o.z - pp.z) < portee); let best = null, n0 = 0;
  L.forEach((o) => { let n = 0; L.forEach((q) => { if (Math.hypot(q.x - o.x, q.z - o.z) < R) n++; }); if (n > n0) { n0 = n; best = o; } }); return best; }
const zoneCarte = (c, x, z, R, dg) => c.monstres.slice().forEach((o) => { if (o.etat === 'actif' && Math.hypot(o.x - x, o.z - z) < R + (o.d.boss ? 0.6 : 0)) blesser(o, dg, true, 'carte'); });
/* les coups : Tueur de geants, Coup de grace ; un monstre tue envoie son ame (Siphon d'ames) */
{ const b1 = blesser; blesser = function (mo, n, gros, src) { const c = combat; if (!c || !c.arene || !cartesArenePct() || !mo || mo.etat !== 'actif' || src === 'def' || !(n > 0)) return b1.apply(this, arguments);
  let k = 1; const kG = nbC('geant'); if (kG && mo.d.boss) k += CARTES_P11B.geant * kG;
  const kR = nbC('grace'); if (kR && mo.pv < (mo.pvMax || mo.pv) * CARTES_P11B.grace.seuil) k += CARTES_P11B.grace.x * kR;
  const pv0 = mo.pv, r = b1.call(this, mo, k === 1 ? n : Math.round(n * k), gros, src);
  if (mo.etat === 'mort' && pv0 > 0 && nbC('ames')) ameVersPerso(c, mo);
  return r; }; }
function ameVersPerso(c, mo) {
  const g = new T.Mesh(new T.IcosahedronGeometry(0.24, 1), new T.MeshBasicMaterial({ color: '#4fe0c0' })), bord = new T.Mesh(new T.IcosahedronGeometry(0.3, 1), new T.MeshBasicMaterial({ color: '#0e5a4e', side: T.BackSide })); g.add(bord); bord.raycast = () => {}; g.raycast = () => {}; /* (28/11/2026 : l'ame blanche et transparente ne se voyait pas sur le sable) */
  const de = new T.Vector3(mo.x, yDe(mo) + 1, mo.z), vers = new T.Vector3(); g.position.copy(de); scene.add(g); let t = 0;
  effets.push((dt) => { if (combat !== c || c.fin) { jeter(g); return true; } t += dt; const pp = paysanMesh.position, k = Math.min(1, t / 0.5); vers.set(pp.x, pp.y + 1.1, pp.z);
    g.position.lerpVectors(de, vers, k * k); g.position.y += Math.sin(k * Math.PI) * 1.3;
    emettre(FX_LUM, 1, { x: g.position.x, y: g.position.y, z: g.position.z, vie: [0.16, 0.22], taille: [0.55, 0.2], c: ['#9ff0dc', '#3fc0a8'], a: 0.6 }); emettre(FX_VIF, 2, { x: g.position.x, y: g.position.y, z: g.position.z, r: 0.08, vie: [0.2, 0.35], taille: [0.18, 0.04], c: ['#c8fff0', '#2fb89a', '#0e5a4e'], a: 0.95, frein: 2 });
    if (k < 1) return false; jeter(g); const a = CARTES_P11B.ames * nbC('ames'); ['cdSort', 'cdUlti', 'cdLegC', 'cdLegA'].forEach((cd) => { if (c[cd] > 0) c[cd] = Math.max(0, c[cd] - a); });
    emettre(FX_VIF, 6, { x: pp.x, y: pp.y + 1.1, z: pp.z, r: 0.2, dv: 1.4, vie: [0.25, 0.45], taille: [0.1, 0.03], c: ['#ffffff', '#9ff0dc', '#3fc0a8'], frein: 1 }); onde(pp.x, pp.y + 0.05, pp.z, 1.4, '#1e9a84', 0.35, 0.85, true); return true; });
}
/* Forme de titan : 30 % de degats recus en moins, degats x1,5 */
{ const bp1 = blesserPerso; blesserPerso = function (n, mo) { const c = combat; if (c && c.arene && c.titanT > 0 && n > 0) n = Math.max(1, Math.round(n * CARTES_P11B.titan.recus)); return bp1.call(this, n, mo); }; }
{ const bd1 = boostDegats; boostDegats = function () { const k = bd1.apply(this, arguments), c = combat; return c && c.arene && c.titanT > 0 ? k * CARTES_P11B.titan.x : k; }; }
/* Echo : le sort de classe se recharge aussitot */
{ const t0 = BOUTONS_SORT.sort.tirer; BOUTONS_SORT.sort.tirer = function () { const r = t0.apply(this, arguments), c = combat, k = nbC('echo');
  if (c && c.arene && k && r !== false && Math.random() < Math.min(CARTES_P11B.echo.max, CARTES_P11B.echo.chance * k)) setTimeout(() => { if (combat !== c || c.fin) return; c.cdSort = 0; auPerso('Écho !'); const pp = paysanMesh.position; onde(pp.x, pp.y + 0.05, pp.z, 1.6, '#9fd0ff', 0.35, 0.8); onde(pp.x, pp.y + 0.05, pp.z, 2.2, '#2f7bd6', 0.45, 0.85, true); emettre(FX_VIF, 12, { x: pp.x, y: pp.y + 1, z: pp.z, r: 0.3, dv: 2.2, vie: [0.3, 0.5], taille: [0.12, 0.04], c: ['#ffffff', '#9fd0ff', '#2f7bd6'], a: 1, frein: 2 }); son('niveau'); }, 300);
  return r; }; }
/* Ultime en echo : l'ulti repart seul, gratuitement (la Tempete de lames du Iop, une fois la premiere finie ; le coup fatal, sur le monstre le plus proche si le sien est tombe) */
let ULTI_EN_ECHO = false;
{ const eu1 = executerUlti; executerUlti = function (id, cible, pt) { const r = eu1.apply(this, arguments), c = combat;
  if (!ULTI_EN_ECHO && c && c.arene && !c.fin && nbC('ultecho')) { const iopZone = id === 'zone' && classeDe() === 'iop', delai = iopZone ? (typeof DUREE_TEMPETE !== 'undefined' ? DUREE_TEMPETE : 3) + 0.4 : CARTES_P11B.ultecho.delai, p0 = pt ? { x: pt.x, y: pt.y || 0, z: pt.z } : null;
    setTimeout(() => { if (combat !== c || c.fin || c.deroute != null) return; let cib = cible, q = p0; const pp = paysanMesh.position;
      if (id === 'mono') { if (!cib || cib.etat !== 'actif') cib = plusProcheCarte(c, pp.x, pp.z, 12); if (!cib) return; }
      else if (!iopZone) { const g = plusGrosGroupe(c, 3, 14); if (g) q = { x: g.x, y: 0, z: g.z }; if (!q) return; cib = null; } else q = new T.Vector3(pp.x, pp.y, pp.z);
      const cd0 = c.cdUlti; ULTI_EN_ECHO = true; try { auPerso('Ultime en écho !'); executerUlti(id, cib, cib ? null : (q.isVector3 ? q : new T.Vector3(q.x, q.y, q.z))); } finally { ULTI_EN_ECHO = false; c.cdUlti = cd0; } }, delai * 1000); }
  return r; }; }
/* la boucle de ces cartes : lancee a la premiere vague, comme l'autre */
function lancerBoucleCartes2(c) { if (!c || c.carteTick2) return; c.carteTick2 = true; effets.push((dt) => { if (combat !== c || c.fin) { finCartes2(c); return true; } tickCartes2(c, dt); return false; }); }
{ const av1 = appliquerVagueArene; appliquerVagueArene = function (c, p) { const r = av1.apply(this, arguments); if (c && cartesArenePct()) lancerBoucleCartes2(c); return r; }; }
{ const pb1 = prendreBonusArene; prendreBonusArene = function () { const r = pb1.apply(this, arguments); if (combat && combat.arene && cartesArenePct()) lancerBoucleCartes2(combat); return r; }; } /* (et des qu'une carte est prise) */
function finCartes2(c) { (c.lames || []).forEach((l) => jeter(l.m)); c.lames = null; nettoyerAnimCartes(c); if (c.totemC) { jeter(c.totemC.m); c.totemC = null; } if (c.bouftouC) { jeter(c.bouftouC.m); c.bouftouC = null; }
  if (c.titanT > 0 && paysanMesh) paysanMesh.scale.setScalar(c.titanBase || 1); c.titanT = 0; }
function tickCartes2(c, dt) {
  if (enPause || c.entracte) return; const pp = paysanMesh.position;
  const kR = nbC('regen'); if (kR) { c.regenT = (c.regenT || 0) + dt; if (c.regenT >= CARTES_P11B.regen.pas) { c.regenT = 0; if (c.pv < c.pvMax && c.pv > 0) { const s0 = c.pv; c.pv = Math.min(c.pvMax, c.pv + c.pvMax * CARTES_P11B.regen.part * kR); majCombatHud(); soinVisible(c.pv - s0);
    emettre(FX_VIF, 5, { x: pp.x, y: pp.y + 0.4, z: pp.z, r: 0.45, v: [0, 1.4, 0], dv: 0.3, vie: [0.5, 0.8], taille: [0.12, 0.05], c: ['#d2f2dc', '#5fd08a'], frein: 1 }); } } }
  const kL = nbC('relique') * CARTES_P11B.relique + (nbC('relvive') ? CARTES_P11B.relvive : 0); if (kL) { if (c.cdLegC > 0) c.cdLegC = Math.max(0, c.cdLegC - dt * kL); if (c.cdLegA > 0) c.cdLegA = Math.max(0, c.cdLegA - dt * kL); }
  if (nbC('relvive') && c.deroute == null && !(c.chuteT > 0)) ['coiffe', 'arme'].forEach((emp) => { if (legDe(emp) && !((c[cdLeg(emp)] || 0) > 0) && !(visee && visee.bouton === emp)) { const avant = c[cdLeg(emp)] || 0; try { lancerLegAuto(emp); } catch (e) { c[cdLeg(emp)] = 3; } if ((c[cdLeg(emp)] || 0) > avant) auPerso(sortLeg(legDe(emp)).nom + ' !'); } }); /* (un sort qui plante attend 3 s : la boucle des cartes ne s'arrete pas) */
  if (nbC('meteore')) { const M = CARTES_P11B.meteore; c.meteoreT = (c.meteoreT || 0) + dt; if (c.meteoreT >= M.periode) { const o = plusProcheCarte(c, pp.x, pp.z, M.portee); if (o) { c.meteoreT = 0; meteoreCarte(c, o.x, o.z, Math.round(degCarte() * M.x * multCarte('meteore'))); } } }
  if (nbC('eclair')) { const E = CARTES_P11B.eclair, n = c.tirs || 0; if (c.eclairBase == null) c.eclairBase = n; if (n - c.eclairBase >= E.coups) { const o = plusProcheCarte(c, pp.x, pp.z, E.portee); if (o) { c.eclairBase = n; chaineEclairs(c, o, Math.round(degCarte() * E.x * multCarte('eclair')), E.n + Math.max(0, nbC('eclair') - 1)); } } }
  if (nbC('lames')) majLames(c, dt); else if (c.lames) { c.lames.forEach((l) => jeter(l.m)); c.lames = null; if (c.lamesO) { jeter(c.lamesO); c.lamesO = null; } }
  if (nbC('totem')) { const Tt = CARTES_P11B.totem; c.totemT = (c.totemT || 0) + dt; if (c.totemT >= Tt.periode && !c.totemC) { c.totemT = 0; poserTotemCarte(c); } if (c.totemC) majTotemCarte(c, dt); }
  if (nbC('bouftou')) { const Bf = CARTES_P11B.bouftou; c.bouftouT = (c.bouftouT || 0) + dt; if (c.bouftouT >= Bf.periode && !c.bouftouC) { c.bouftouT = 0; lacherBouftou(c); } if (c.bouftouC) majBouftouCarte(c, dt); }
  if (nbC('deluge')) { const D = CARTES_P11B.deluge; c.delugeT = (c.delugeT || 0) + dt; if (c.delugeT >= D.periode) { const o = plusGrosGroupe(c, D.R, 14); if (o) { c.delugeT = 0; delugeCarte(c, o.x, o.z, Math.round(degCarte() * D.x * multCarte('deluge'))); } } }
  if (nbC('titan')) majTitan(c, dt);
}
/* Meteore : une pierre en feu tombe du ciel sur le monstre le plus proche (un cercle orange au sol juste avant) */
function meteoreCarte(c, x, z, dg) {
  const M = CARTES_P11B.meteore, y = solA(x, z), de = new T.Vector3(x + 4.5, y + 15, z - 3.5), vers = new T.Vector3(x, y + 0.3, z), roc = sphere(0.5, '#6a5248'); roc.traverse((o) => { o.raycast = () => {}; }); roc.position.copy(de); scene.add(roc);
  if (typeof cibleSol === 'function') cibleSol(x, y, z, M.chute + 0.02); let t = 0;
  effets.push((d) => { if (combat !== c) { jeter(roc); return true; } t += d; const k = Math.min(1, t / M.chute); roc.position.lerpVectors(de, vers, k * k); roc.rotation.x += d * 9; roc.rotation.z += d * 6;
    const p = roc.position; emettre(FX_VIF, 4, { x: p.x, y: p.y, z: p.z, r: 0.25, v: [0, 1, 0], dv: 0.8, vie: [0.25, 0.45], taille: [0.55, 0.1], c: ['#fff1a8', '#ff8a1e', '#b0280e'], a: 0.95, frein: 1 });
    emettre(FX_LUM, 1, { x: p.x, y: p.y, z: p.z, vie: [0.08, 0.1], taille: [1.6, 0.8], c: ['#ffd38a', '#ff6a1e'], a: 0.6 }); if (Math.random() < 0.5) emettre(FX_FUM, 1, { x: p.x, y: p.y, z: p.z, v: [0, 0.6, 0], vie: [0.5, 0.8], taille: [0.4, 1.0], c: ['#5a4a42', '#8a8078'], a: 0.3 });
    if (k < 1) return false; jeter(roc); boule(x, y + 0.3, z, 0.8, ['#ffb02e', '#e8541e', '#7a1e0a'], true); onde(x, y + 0.04, z, M.R + 0.3, '#ffb04a', 0.35, 0.85); brulure(x, y, z, M.R * 0.8); flashLumiere(x, y + 1, z, '#ff8a2e', 3.5, 8, 0.4); secousse(0.08, 0.2);
    emettre(FX_VIF, 16, { x, y: y + 0.2, z, r: 0.1, dv: 5, haut: true, vie: [0.4, 0.8], taille: [0.1, 0.03], c: ['#fff1a8', '#ff8a1e', '#5a4a42'], grav: 9, frein: 1, sol: y + 0.04, rebond: 0.35 }); son('touche');
    if (!c.fin) zoneCarte(c, x, z, M.R, dg); return true; });
}
/* Chaine d'eclairs : du perso au monstre le plus proche, puis de monstre en monstre */
function chaineEclairs(c, o0, dg, n) {
  const E = CARTES_P11B.eclair, touches = new Set(), pts = [new T.Vector3(paysanMesh.position.x, paysanMesh.position.y + 1.4, paysanMesh.position.z)]; let o = o0;
  while (o && touches.size < n) { touches.add(o); pts.push(new T.Vector3(o.x, yDe(o) + (o.haut || 1.4) * 0.6, o.z)); o = plusProcheCarte(c, o.x, o.z, E.saut, touches); }
  eclairVisible(pts, 0.42); /* (28/11/2026 : l'ancien trait de particules ne se voyait pas a l'image, « bien visible », Mathieu) */
  pts.slice(1).forEach((p, i) => { flashLumiere(p.x, p.y, p.z, '#9fe3ff', 3, 6, 0.3); emettre(FX_VIF, 10, { x: p.x, y: p.y, z: p.z, r: 0.15, dv: 3.4, vie: [0.2, 0.35], taille: [0.1, 0.03], c: ['#ffffff', '#7fd0ff', '#1e6fd6'], frein: 2 });
    etoileImpact(p, 0.75, '#5fb8ff'); onde(p.x, p.y - 0.75, p.z, 1.3, '#1e7bff', 0.4, 0.8, true); if (typeof eclairsEtoile === 'function') eclairsEtoile(p, 4, 0.9, 0.3);
    const m = [...touches][i], de = pts[i]; if (m && typeof reculVisuel === 'function') { const dx = p.x - de.x, dz = p.z - de.z, d = Math.hypot(dx, dz) || 1; reculVisuel(m, { x: dx / d, z: dz / d }, 0.35); } });
  son('sort'); [...touches].forEach((m) => blesser(m, dg, true, 'carte'));
}
/* Lames tournoyantes : elles tournent autour du perso et coupent ce qu'elles touchent (une seule fois par monstre et par lame toutes les 0,45 s) */
function fabriquerLame() { const g = new T.Group(), lame = boite(0.95, 0.05, 0.2, '#dfe6ee'); lame.position.x = 0.2; g.add(lame); const fil = boite(0.95, 0.06, 0.05, '#ffffff'); fil.position.set(0.2, 0, 0.11); g.add(fil);
  const garde = boite(0.08, 0.1, 0.38, '#c9a032'); garde.position.x = -0.32; g.add(garde); const manche = cyl(0.05, 0.05, 0.3, '#6a4426'); manche.rotation.z = Math.PI / 2; manche.position.x = -0.5; g.add(manche); g.traverse((o) => { o.raycast = () => {}; o.castShadow = false; }); return g; }
function majLames(c, dt) {
  const L = CARTES_P11B.lames, n = Math.min(L.max, L.n + nbC('lames') - 1), pp = paysanMesh.position;
  if (!c.lames || c.lames.length !== n) { (c.lames || []).forEach((l) => jeter(l.m)); c.lames = []; for (let i = 0; i < n; i++) { const m = fabriquerLame(); m.scale.setScalar(1.3); scene.add(m); c.lames.push({ m, vus: new Map() }); } orbiteLames(c); }
  if (c.lamesO) { c.lamesO.position.set(pp.x, pp.y + 0.06, pp.z); c.lamesO.material.opacity = 0.32 + 0.08 * Math.sin(performance.now() / 160); }
  c.lamesA = (c.lamesA || 0) + dt * L.w; const dg = Math.max(1, Math.round(degCarte() * L.x)), now = performance.now();
  c.lames.forEach((l, i) => { const a = c.lamesA + i * Math.PI * 2 / n, x = pp.x + Math.cos(a) * L.R, z = pp.z + Math.sin(a) * L.R; l.m.position.set(x, pp.y + 0.75, z); l.m.rotation.set(0, -a - Math.PI / 2, 0.25);
    if (Math.random() < 0.6) emettre(FX_LUM, 1, { x, y: pp.y + 0.75, z, vie: [0.1, 0.14], taille: [0.6, 0.2], c: ['#ffffff', '#bfd4ea'], a: 0.35 }); emettre(FX_VIF, 1, { x, y: pp.y + 0.75, z, vie: [0.12, 0.2], taille: [0.16, 0.05], c: ['#e8f2ff', '#3f6a9e'], a: 0.9, frein: 3 });
    c.monstres.forEach((o) => { if (o.etat !== 'actif' || Math.hypot(o.x - x, o.z - z) > L.touche + (o.d.ombre || 1) * 0.25) return; if ((l.vus.get(o) || 0) > now) return; l.vus.set(o, now + L.cd * 1000);
      blesser(o, dg, false, 'carte'); emettre(FX_VIF, 4, { x: o.x, y: yDe(o) + 0.8, z: o.z, r: 0.2, dv: 2.4, vie: [0.15, 0.3], taille: [0.08, 0.03], c: ['#ffffff', '#dfe6ee'], frein: 2 }); }); });
}
/* Totem de guerre : il sort du sable pres du perso et tire sur le monstre le plus proche */
function fabriquerTotemCarte() { const g = new T.Group(), corps = cyl(0.34, 0.4, 1.7, '#a8693a', 8); corps.position.y = 0.85; g.add(corps);
  [0.55, 1.15].forEach((y) => { const b = cyl(0.42, 0.42, 0.1, '#6a4426', 8); b.position.y = y; g.add(b); });
  const tete = boite(0.62, 0.5, 0.5, '#c8945a'); tete.position.set(0, 1.55, 0.08); g.add(tete); const bouche = boite(0.36, 0.08, 0.06, '#3b2a1a'); bouche.position.set(0, 1.4, 0.34); g.add(bouche);
  const oeil = new T.MeshBasicMaterial({ color: '#ffe27a' }); [-0.14, 0.14].forEach((x) => { const e = new T.Mesh(new T.IcosahedronGeometry(0.075, 1), oeil); e.position.set(x, 1.62, 0.34); g.add(e); });
  [-1, 1].forEach((s) => { const p = cone(0.09, 0.6, '#e8504a', 5); p.position.set(s * 0.26, 2.0, -0.05); p.rotation.z = -s * 0.35; g.add(p); }); const p2 = cone(0.08, 0.5, '#ffd04a', 5); p2.position.set(0, 2.05, -0.1); g.add(p2);
  g.traverse((o) => { o.raycast = () => {}; }); return g; }
function poserTotemCarte(c) {
  const pp = paysanMesh.position, a = (paysanMesh.userData.angle || 0) + Math.PI * 0.75; let x = pp.x + Math.sin(a) * 1.6, z = pp.z + Math.cos(a) * 1.6;
  if (typeof solSort === 'function' && !solSort(x, z)) { x = pp.x; z = pp.z; } const y = solA(x, z), m = fabriquerTotemCarte(); m.position.set(x, y - 2, z); m.rotation.y = Math.atan2(pp.x - x, pp.z - z) + Math.PI; scene.add(m);
  m.scale.setScalar(1.2); const socle = new T.Mesh(new T.RingGeometry(0.5, 0.78, 32), fxMat('#e8b43a', 0.7)); socle.rotation.x = -Math.PI / 2; socle.raycast = () => {}; socle.renderOrder = 3; m.add(socle); m.userData.socle = socle; /* (28/11/2026 : le socle dore, il est a nous) */
  c.totemC = { m, x, y, z, t: 0, tir: 0.6 }; pouf(x, y, z, 2.4, '#c9b28a'); onde(x, y + 0.05, z, 2, '#c98a1e', 0.45, 0.8, true); emettre(FX_FUM, 8, { x, y: y + 0.3, z, r: 0.6, v: [0, 1.2, 0], vie: [0.6, 1.0], taille: [0.5, 1.2], c: ['#c9b28a', '#a8946a'], a: 0.5 }); son('sort');
}
function majTotemCarte(c, dt) {
  const Tt = CARTES_P11B.totem, o = c.totemC; o.t += dt; const sortie = Math.min(1, o.t / 0.35), fin = Math.max(0, (o.t - Tt.duree) / 0.35); o.m.position.y = o.y - 2 * (1 - sortie) * (1 - sortie) - 2 * fin * fin;
  if (o.m.userData.socle) { o.m.userData.socle.position.y = (o.y + 0.06 - o.m.position.y) / 1.2; o.m.userData.socle.material.opacity = 0.55 + 0.15 * Math.sin(o.t * 6); }
  if (fin >= 1) { pouf(o.x, o.y, o.z, 2, '#c9b28a'); jeter(o.m); c.totemC = null; return; } if (sortie < 1 || o.t > Tt.duree) return;
  o.tir -= dt; const cib = plusProcheCarte(c, o.x, o.z, Tt.portee); if (cib) o.m.rotation.y += Math.atan2(Math.sin(Math.atan2(cib.x - o.x, cib.z - o.z) - o.m.rotation.y), Math.cos(Math.atan2(cib.x - o.x, cib.z - o.z) - o.m.rotation.y)) * Math.min(1, dt * 8);
  if (o.tir > 0 || !cib) return; o.tir = Tt.tir; const de = new T.Vector3(o.x, o.y + 1.62, o.z), dg = Math.max(1, Math.round(degCarte() * Tt.x * multCarte('totem')));
  const bal = new T.Mesh(new T.IcosahedronGeometry(0.2, 1), new T.MeshBasicMaterial({ color: '#ff8a1e' })); bal.raycast = () => {}; bal.position.copy(de); scene.add(bal); let t = 0; const vise = cib;
  effets.push((d) => { t += d; const k = Math.min(1, t / 0.2), vers = new T.Vector3(vise.x, yDe(vise) + (vise.haut || 1.2) * 0.55, vise.z); bal.position.lerpVectors(de, vers, k);
    emettre(FX_LUM, 1, { x: bal.position.x, y: bal.position.y, z: bal.position.z, vie: [0.08, 0.1], taille: [0.5, 0.2], c: ['#fff6b0', '#ffb02e'], a: 0.7 }); emettre(FX_VIF, 2, { x: bal.position.x, y: bal.position.y, z: bal.position.z, r: 0.05, vie: [0.15, 0.25], taille: [0.2, 0.05], c: ['#ffd25a', '#e8541e', '#7a1e0a'], a: 0.95, frein: 3 }); if (k < 1) return false;
    jeter(bal); etoileImpact(vers, 0.45, '#ffd04a'); if (combat === c && !c.fin && vise.etat === 'actif') blesser(vise, dg, false, 'carte'); return true; });
}
/* Bouftou de guerre : un Bouftou allie tombe du ciel pres du perso et fonce sur les monstres, 10 s */
function lacherBouftou(c) {
  const pp = paysanMesh.position, a = Math.random() * Math.PI * 2; let x = pp.x + Math.cos(a) * 1.4, z = pp.z + Math.sin(a) * 1.4; if (typeof solSort === 'function' && !solSort(x, z)) { x = pp.x; z = pp.z; }
  const y = solA(x, z), m = modeleBouftouInvoque(); m.scale.setScalar(0.5); m.position.set(x, y + 5, z); m.traverse((o) => { o.raycast = () => {}; }); scene.add(m);
  marqueAllie(m); c.bouftouC = { m, x, z, ry: a, t: 0, chute: 0.3, cd: 0.5, pas: 0, frappe: 0 }; if (typeof cercleInvocation === 'function') cercleInvocation(x, y, z, ['#e8c25a', '#fff1b0', '#8a6512']);
  toast('Un Bouftou de guerre se bat à tes côtés pendant ' + CARTES_P11B.bouftou.duree + ' s.', 'or');
}
function majBouftouCarte(c, dt) {
  const Bf = CARTES_P11B.bouftou, b = c.bouftouC, m = b.m; b.t += dt; if (m.userData.gemme) m.userData.gemme.rotation.y += dt * 3;
  if (b.t > Bf.duree) { pouf(b.x, solA(b.x, b.z), b.z, 2, '#fff1b0'); jeter(m); c.bouftouC = null; return; }
  let y = solA(b.x, b.z); if (b.chute > 0) { b.chute -= dt; const h = Math.pow(Math.max(0, b.chute) / 0.3, 2) * 5; m.position.set(b.x, y + h, b.z); if (b.chute <= 0) { pouf(b.x, y, b.z, 2.6, '#fff1b0'); secousse(0.05, 0.12); zoneCarte(c, b.x, b.z, 1.6, Math.round(degCarte() * Bf.x * 1.5 * multCarte('bouftou'))); } return; }
  /* LE BOND PAR-DESSUS LE VIDE (28/11/2026, « dans la mine et les ruines celestes, le Bouftou de guerre peut rester bloque par un trou : fais en sorte que non », Mathieu) :
     bloque 0,4 s au bord d'un trou, il bondit en cloche (0,5 s) et retombe sur un sol ferme a cote de sa cible, comme les monstres qui sautent le vide */
  if (b.saut) { const S = b.saut; S.t += dt; const k = Math.min(1, S.t / S.d); b.x = S.x0 + (S.x1 - S.x0) * k; b.z = S.z0 + (S.z1 - S.z0) * k; b.ry = Math.atan2(S.x1 - S.x0, S.z1 - S.z0);
    m.position.set(b.x, S.y0 + (S.y1 - S.y0) * k + Math.sin(k * Math.PI) * S.h, b.z); m.rotation.y = b.ry; if (k >= 1) { b.saut = null; b.bloque = 0; pouf(b.x, S.y1, b.z, 1.6, '#fff1b0'); } return; }
  const cib = plusProcheCarte(c, b.x, b.z, 30); let v = 0;
  if (cib) { const dx = cib.x - b.x, dz = cib.z - b.z, d = Math.hypot(dx, dz), porte = Bf.portee + (cib.d.ombre || 1) * 0.3; b.ry = Math.atan2(dx, dz);
    if (d > porte) { const pas = Math.min(d - porte, Bf.vitesse * dt), nx = b.x + dx / d * pas, nz = b.z + dz / d * pas; if (!(typeof solSort === 'function') || solSort(nx, nz)) { b.x = nx; b.z = nz; v = Bf.vitesse; b.bloque = 0; }
      else if ((b.bloque = (b.bloque || 0) + dt) > 0.4) { const a0 = Math.atan2(b.x - cib.x, b.z - cib.z), r = Math.max(0.6, porte * 0.85); let q = null;
        for (let i = 0; i < 12 && !q; i++) { const a = a0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * Math.PI / 6, x = cib.x + Math.sin(a) * r, z = cib.z + Math.cos(a) * r; if (solSort(x, z)) q = { x, z }; }
        if (!q) q = { x: cib.x, z: cib.z }; const L = Math.hypot(q.x - b.x, q.z - b.z); b.saut = { x0: b.x, z0: b.z, x1: q.x, z1: q.z, y0: solA(b.x, b.z), y1: solA(q.x, q.z), t: 0, d: Math.min(0.8, 0.35 + L * 0.04), h: 1.2 + L * 0.08 }; b.bloque = 0; } }
    else { b.cd -= dt; if (b.cd <= 0) { b.cd = Bf.cadence; b.frappe = 0.25; blesser(cib, Math.max(1, Math.round(degCarte() * Bf.x * multCarte('bouftou'))), false, 'carte'); etoileImpact(new T.Vector3(cib.x, yDe(cib) + 0.7, cib.z), 0.4, '#fff1b0'); son('touche'); } } }
  b.pas += v * dt * 5; y = solA(b.x, b.z); let elan = 0; if (b.frappe > 0) { b.frappe -= dt; elan = Math.sin((1 - b.frappe / 0.25) * Math.PI) * 0.35; }
  m.position.set(b.x + Math.sin(b.ry) * elan, y + Math.abs(Math.sin(b.pas)) * 0.18 * Math.min(1, v), b.z + Math.cos(b.ry) * elan); m.rotation.y = b.ry;
  if (b.t > Bf.duree - 1) m.scale.setScalar(0.5 * Math.max(0.05, Bf.duree - b.t));
}
/* Deluge de fleches : trois volees de la pluie du Cra sur le plus gros groupe */
function delugeCarte(c, x, z, dg) {
  const D = CARTES_P11B.deluge;
  for (let i = 0; i < D.volees; i++) setTimeout(() => { if (combat !== c || c.fin) return; const g = i === 0 ? { x, z } : (plusGrosGroupe(c, D.R, 16) || { x, z }); if (typeof pluieSeule === 'function') pluieSeule(g.x, g.z, D.R, true);
    setTimeout(() => { if (combat === c && !c.fin) zoneCarte(c, g.x, g.z, D.R, dg); }, 480); }, i * D.ecart * 1000);
  auPerso('Déluge de flèches !');
}
/* Forme de titan : toutes les 30 s, il grandit 6 s ; plus rien ne l'entrave (ni colle, ni assomme, ni agrippe, ni lenteur) */
function majTitan(c, dt) {
  const Ti = CARTES_P11B.titan, pp = paysanMesh.position; c.titanCycle = (c.titanCycle || 0) + dt;
  if (!(c.titanT > 0) && c.titanCycle >= Ti.periode && c.deroute == null) { c.titanCycle = 0; c.titanT = Ti.duree; c.titanBase = paysanMesh.scale.x; auPerso('Forme de titan !'); onde(pp.x, pp.y + 0.05, pp.z, 3.2, '#ff7a2e', 0.4, 0.9); pouf(pp.x, pp.y, pp.z, 3, '#ffd04a'); secousse(0.12, 0.3); flashLumiere(pp.x, pp.y + 2, pp.z, '#ff8a2e', 4, 10, 0.5); son('niveau'); }
  if (c.titanT > 0) { c.titanT -= dt; const k = c.titanT > Ti.duree - 0.3 ? (Ti.duree - c.titanT) / 0.3 : c.titanT < 0.3 ? Math.max(0, c.titanT) / 0.3 : 1; paysanMesh.scale.setScalar((c.titanBase || 1) * (1 + (Ti.taille - 1) * k)); /* (la taille du perso, 0,5 dans le jeu, grandie d'un tiers) */
    if (!(c.chuteT > 0)) { c.colle = 0; c.assomme = 0; c.agrippe = 0; c.lenteur = 0; }
    if (Math.random() < 0.5) emettre(FX_VIF, 1, { x: pp.x + (Math.random() - 0.5) * 1.4, y: pp.y + 0.2, z: pp.z + (Math.random() - 0.5) * 1.4, v: [0, 2.2, 0], dv: 0.4, vie: [0.4, 0.7], taille: [0.22, 0.05], c: ['#ffd25a', '#ff6a12'], a: 0.9, frein: 1 });
    if (c.titanT <= 0) paysanMesh.scale.setScalar(c.titanBase || 1); }
}
/* ---------- LES ANIMATIONS DES CARTES (28/11/2026, Mathieu : « je sais pas si t'as code les choses qui font des sorts / animations en jeu via les cartes, mais faut
   le faire ») : chaque effet se voit, camera du dessus au zoom normal, sur le sable clair du colisee comme sur le volcan sombre. Des couleurs franches en melange
   normal (la lumiere additive disparait sur le sable), un trait fonce sous les traits clairs, une duree lisible. Rien ne change aux chiffres ni aux regles.
   Filmees au banc : outils/banc/gabarit-cartes-anim.js (plan) et outils/banc/cartes-anim.py, planches avec outils/banc/montage-film.py */
const GEO_TRAIT_C = (() => { const g = new T.CylinderGeometry(1, 1, 1, 6, 1, true); g.translate(0, 0.5, 0); g.rotateX(Math.PI / 2); partager(g); return g; })(); /* (un tube de longueur 1 le long de +z) */
function traitCarte(g, a, b, ep, mat) { const m = new T.Mesh(GEO_TRAIT_C, mat); m.position.copy(a); m.lookAt(b); m.scale.set(ep, ep, Math.max(0.01, a.distanceTo(b))); m.renderOrder = 8; m.frustumCulled = false; m.raycast = () => {}; g.add(m); return m; }
function zigzagCarte(a, b, n, ampl) { const d = b.clone().sub(a), L = d.length(), u = d.clone().normalize(), p = new T.Vector3(-u.z, 0, u.x), P = [a.clone()];
  for (let i = 1; i < n; i++) { const q = a.clone().addScaledVector(d, i / n); q.addScaledVector(p, (Math.random() - 0.5) * L * ampl); q.y += (Math.random() - 0.5) * L * ampl * 0.6; P.push(q); }
  P.push(b.clone()); return P; }
/* Chaine d'eclairs : un trait bleu vif borde de bleu nuit, un coeur blanc ; il se redessine en zigzag toutes les 70 ms, tient puis s'efface (« bien visible », Mathieu) */
function eclairVisible(pts, duree) {
  const g = new T.Group(), mF = fxMat('#0b3fa8', 0.6), mB = fxMat('#2f9bff', 0.95), mC = fxMat('#f2fbff', 1); scene.add(g); let t = 0, prochain = 0;
  const trait = (Z, e) => { for (let k = 1; k < Z.length; k++) { traitCarte(g, Z[k - 1], Z[k], 0.14 * e, mF); traitCarte(g, Z[k - 1], Z[k], 0.085 * e, mB); traitCarte(g, Z[k - 1], Z[k], 0.035 * e, mC); } };
  const refaire = () => { while (g.children.length) g.remove(g.children[0]); for (let i = 1; i < pts.length; i++) { const Z = zigzagCarte(pts[i - 1], pts[i], 9, 0.3); trait(Z, 1);
    for (let f = 0; f < 2; f++) { const q = Z[2 + Math.floor(Math.random() * (Z.length - 4))], dir = pts[i].clone().sub(pts[i - 1]).normalize(), cote = new T.Vector3(-dir.z, 0, dir.x).multiplyScalar((Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5)), bout = q.clone().addScaledVector(dir, 0.5 + Math.random() * 0.4).add(cote); bout.y -= 0.3 * Math.random(); trait(zigzagCarte(q, bout, 3, 0.35), 0.6); } } }; /* (des fourches : un eclair, pas un tuyau) */
  effets.push((dt) => { t += dt; if (t >= prochain && t < duree * 0.8) { prochain += 0.07; refaire(); }
    const a = t < duree * 0.6 ? 1 : Math.max(0, 1 - (t - duree * 0.6) / (duree * 0.4)); mF.opacity = 0.6 * a; mB.opacity = 0.95 * a; mC.opacity = a;
    if (t >= duree) { while (g.children.length) g.remove(g.children[0]); scene.remove(g); mF.dispose(); mB.dispose(); mC.dispose(); return true; } return false; });
}
/* un cercle au sol, garde dans la partie (c[cle]) tant que l'effet dure */
function anneauSolCarte(c, cle, r0, r1, couleur) { if (!c[cle]) { const m = new T.Mesh(new T.RingGeometry(r0, r1, 56), fxMat(couleur, 0.5)); m.rotation.x = -Math.PI / 2; m.renderOrder = 3; m.raycast = () => {}; scene.add(m); c[cle] = m; } return c[cle]; }
function lacherAnneau(c, cle) { if (c[cle]) { jeter(c[cle]); c[cle] = null; } }
function nettoyerAnimCartes(c) { ['auraM', 'ouvM', 'titanM', 'frenM', 'lamesO'].forEach((k) => lacherAnneau(c, k)); }
/* Aura brulante : un cercle de feu au sol a sa portee (3,5, soit 1,75 case), un voile orange dedans, des flammes qui montent tout autour */
function majAuraVisible(c, dt) {
  const A = LEG_CARTES.aura, pp = paysanMesh.position, t = performance.now() / 1000;
  if (!c.auraM) { const g = new T.Group(), bord = new T.Mesh(new T.RingGeometry(A.R * 0.94, A.R, 72), fxMat('#c8320c', 0.7)), voile = new T.Mesh(new T.CircleGeometry(A.R * 0.94, 72), fxMat('#ff6a1e', 0.1));
    [bord, voile].forEach((m) => { m.rotation.x = -Math.PI / 2; m.renderOrder = 3; m.raycast = () => {}; g.add(m); }); g.userData.bord = bord; g.userData.voile = voile; scene.add(g); c.auraM = g; }
  const g = c.auraM; g.position.set(pp.x, pp.y + 0.06, pp.z); g.userData.bord.material.opacity = 0.6 + 0.15 * Math.sin(t * 9); g.userData.voile.material.opacity = 0.09 + 0.04 * Math.sin(t * 5);
  for (let k = 0; k < Math.ceil(2 * A.R / 3.2); k++) { const a = Math.random() * Math.PI * 2, rr = A.R * (0.82 + 0.18 * Math.random()); /* (autant de flammes par longueur de bord, quelle que soit la portee) */
    emettre(FX_VIF, 1, { x: pp.x + Math.cos(a) * rr, y: pp.y + 0.1, z: pp.z + Math.sin(a) * rr, v: [0, 1.8, 0], dv: 0.3, vie: [0.3, 0.55], taille: [0.34, 0.06], c: ['#ffd25a', '#ff5a12', '#7a1408'], a: 0.95, frein: 1 }); }
}
/* Arret du temps : chaque monstre fige est pris dans un bloc de glace le temps de son arret */
function glaceCarte(o, d) {
  if (!o || !o.m) return; const h = o.haut || 1.4, r = Math.max(0.55, h * 0.5) * Math.min(2.5, o.d.ombre || 1);
  const m = new T.Mesh(new T.IcosahedronGeometry(1, 1), fxMat('#9fe3f5', 0.35)), fil = new T.Mesh(new T.IcosahedronGeometry(1.02, 1), new T.MeshBasicMaterial({ color: '#2f9bd6', wireframe: true, transparent: true, opacity: 0.6, depthWrite: false }));
  m.add(fil); m.scale.set(r, h * 0.62, r); m.renderOrder = 6; onde(o.x, yDe(o) + 0.05, o.z, r * 1.7, '#3fa8e0', 0.5, 0.85, true);
  emettre(FX_VIF, 10, { x: o.x, y: yDe(o) + h * 0.5, z: o.z, r: r * 0.8, dv: 1.4, vie: [0.4, 0.8], taille: [0.12, 0.04], c: ['#ffffff', '#bfefff', '#3fa8e0'], grav: 1, frein: 1 });
  const D = d + 0.3; fxVie(m, D, (k, mm) => { const tt = k * D, a = tt < 0.15 ? tt / 0.15 : tt > d ? Math.max(0, 1 - (tt - d) / 0.3) : 1; mm.material.opacity = 0.35 * a; fil.material.opacity = 0.6 * a; mm.position.set(o.x, yDe(o) + h * 0.5, o.z); });
}
/* Entree fracassante (pendant ses 6 s), Forme de titan (pendant ses 6 s), Frenesie (selon le bonus) : leurs cercles au sol et leurs flammes, chaque image */
function majAnneauxCartes(c, dt) {
  if (!paysanMesh) return; const pp = paysanMesh.position, now = performance.now(), t = now / 1000;
  const ouv = nbC('ouverture') && c.ouvertureJusque && now < c.ouvertureJusque && now > c.ouvertureDebut;
  if (ouv) { const m = anneauSolCarte(c, 'ouvM', 1.5, 1.95, '#e0301e'); m.position.set(pp.x, pp.y + 0.06, pp.z); m.material.opacity = 0.55 + 0.2 * Math.sin(t * 12);
    if (!c.ouvVu) { c.ouvVu = true; onde(pp.x, pp.y + 0.05, pp.z, 3.2, '#e0301e', 0.45, 0.85, true); pouf(pp.x, pp.y, pp.z, 2.4, '#ff7a2e'); }
    if (Math.random() < 0.85) emettre(FX_VIF, 1, { x: pp.x + (Math.random() - 0.5) * 1.6, y: pp.y + 0.2, z: pp.z + (Math.random() - 0.5) * 1.6, v: [0, 2.6, 0], dv: 0.4, vie: [0.35, 0.6], taille: [0.3, 0.06], c: ['#ffd25a', '#ff4a1e', '#8a1208'], a: 0.95, frein: 1 }); }
  else { lacherAnneau(c, 'ouvM'); if (!(c.ouvertureJusque && now < c.ouvertureJusque)) c.ouvVu = false; }
  if (c.titanT > 0) { const m = anneauSolCarte(c, 'titanM', 2.05, 2.5, '#ff7a2e'); m.position.set(pp.x, pp.y + 0.06, pp.z); m.material.opacity = 0.5 + 0.15 * Math.sin(t * 8); } else lacherAnneau(c, 'titanM');
  if (nbC('frenesie') && c.frenesie > 0) { const k = c.frenesie / LEG_CARTES.frenesie.max, m = anneauSolCarte(c, 'frenM', 1.4, 1.7, '#c81414'); m.position.set(pp.x, pp.y + 0.05, pp.z); m.scale.setScalar(1 + 0.25 * k);
    m.material.opacity = Math.min(0.95, 0.3 + 0.5 * k + 0.12 * Math.sin(t * (6 + 10 * k)));
    if (Math.random() < 0.15 + 0.6 * k) emettre(FX_VIF, 1, { x: pp.x + (Math.random() - 0.5) * 1.2, y: pp.y + 0.3, z: pp.z + (Math.random() - 0.5) * 1.2, v: [0, 2, 0], dv: 0.3, vie: [0.3, 0.5], taille: [0.24, 0.05], c: ['#ff6a5a', '#c81414', '#5a0606'], a: 0.95, frein: 1 }); }
  else lacherAnneau(c, 'frenM');
}
/* Moisson et Regeneration : le soin s'ecrit en vert au-dessus du perso, des lueurs vertes montent */
function soinVisible(n) {
  if (!(n > 0) || !paysanMesh) return; const q = paysanMesh.position, p = q.clone(); p.y += 1.6; chiffre('+' + fmt(Math.round(n)), p, 'soin');
  emettre(FX_VIF, 8, { x: q.x, y: q.y + 0.4, z: q.z, r: 0.5, v: [0, 1.6, 0], dv: 0.4, vie: [0.5, 0.8], taille: [0.16, 0.05], c: ['#eaffe8', '#5fd08a', '#1e7a3a'], a: 0.95, frein: 1 }); onde(q.x, q.y + 0.05, q.z, 1.2, '#2e9a4a', 0.4, 0.7, true);
}
/* Epines : des epines partent du perso vers celui qui l'a frappe de pres, et l'ecorchent */
function epinesVisibles(c, mo) {
  const now = performance.now(); if ((c.epinesT || 0) > now || !paysanMesh || !mo) return; c.epinesT = now + 250; const pp = paysanMesh.position, dx = mo.x - pp.x, dz = mo.z - pp.z, d = Math.hypot(dx, dz) || 1;
  emettre(FX_VIF, 10, { x: pp.x, y: pp.y + 0.8, z: pp.z, r: 0.25, v: [dx / d * 7, 0.6, dz / d * 7], dv: 2, vie: [0.15, 0.25], taille: [0.12, 0.03], c: ['#e8f0c0', '#7a9a3a', '#2e3a12'], a: 1, frein: 3, etire: 0.06 });
  etoileImpact(new T.Vector3(mo.x, yDe(mo) + (mo.haut || 1.2) * 0.55, mo.z), 0.55, '#8fc04a'); onde(pp.x, pp.y + 0.05, pp.z, 1.5, '#5a7a1e', 0.3, 0.8, true);
}
/* Dernier souffle : une colonne de lumiere doree, deux ondes au sol, des eclats qui montent */
function souffleVisible(p) {
  if (typeof faisceau === 'function') { const f = faisceau(new T.Vector3(p.x, p.y, p.z), new T.Vector3(p.x, p.y + 7, p.z), [['#fff6c8', '#e8a21e', 1.4, false], ['#ffffff', '#ffe27a', 0.5, false]]); let t = 0;
    effets.push((dt) => { t += dt; const k = Math.min(1, t / 1.1); f.maj(Math.min(1, t / 0.18), k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5, t); if (k >= 1) { jeter(f.g); return true; } return false; }); }
  onde(p.x, p.y + 0.05, p.z, 3.4, '#e8a21e', 0.6, 0.9, true); onde(p.x, p.y + 0.05, p.z, 2, '#fff1b0', 0.45, 0.9, true);
  emettre(FX_VIF, 30, { x: p.x, y: p.y + 0.3, z: p.z, r: 0.6, v: [0, 3.5, 0], dv: 1.2, vie: [0.6, 1.0], taille: [0.16, 0.05], c: ['#ffffff', '#ffe27a', '#c8841e'], a: 1, frein: 0.6 });
}
/* Lames tournoyantes : leur orbite, un cercle acier au sol qui suit le perso */
function orbiteLames(c) { if (c.lamesO) return; const L = CARTES_P11B.lames, m = new T.Mesh(new T.RingGeometry(L.R - 0.07, L.R + 0.07, 64), fxMat('#3f6a9e', 0.35)); m.rotation.x = -Math.PI / 2; m.renderOrder = 3; m.raycast = () => {}; scene.add(m); c.lamesO = m; }
/* Bouftou de guerre : un cercle dore sous lui et une gemme doree au-dessus, pour ne pas le confondre avec les Bouftous des vagues */
function marqueAllie(m) {
  const s = m.scale.x || 1, R = 1.15 / s, ring = new T.Mesh(new T.RingGeometry(R * 0.76, R, 40), fxMat('#e8b43a', 0.85)); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06 / s; ring.renderOrder = 3; ring.raycast = () => {}; m.add(ring);
  const gem = new T.Mesh(new T.OctahedronGeometry(0.17 / s, 0), new T.MeshBasicMaterial({ color: '#ffc61e' })), contour = new T.Mesh(new T.OctahedronGeometry(0.21 / s, 0), new T.MeshBasicMaterial({ color: '#7a4a06', side: T.BackSide }));
  gem.add(contour); gem.position.y = 1.7 / s; gem.raycast = () => {}; contour.raycast = () => {}; m.add(gem); m.userData.gemme = gem;
}
/* LES NOMBRES COLLES A LEUR UNITE (28/11/2026 : « invisible 3 s toutes les 15 / s » coupe en fin de ligne) : sur toutes les cartes, une espace insecable entre un
   nombre et son unite (%, s, case, cases) et avant le signe x ou ×. Seulement l'affichage, aucun chiffre ne change */
Object.values(BONUS_ARENE).forEach((B) => ['effet', 'txt', 'effetP11', 'txtP11'].forEach((k) => { if (typeof B[k] === 'string') B[k] = B[k].replace(/(\d) (%|s\b|cases?\b)/g, '$1 $2'); }));
