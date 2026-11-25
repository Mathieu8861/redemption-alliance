'use strict';
/* LES NOUVELLES CARTES DE L'ARENE (26/11/2026, Mathieu par Discord : « vas-y fais-les toutes, on les mettra aussi au palier 11 ; faudra aussi faire des cartes
   legendaires qui donnent de meilleurs bonus, des trucs un peu inedits, du style invisibilite 3 secondes toutes les x secondes, degats x2 sur les 4 premieres
   secondes de vague ») : avec le palier 11 seulement (cartesArenePct : sa sortie, ou le mode test ; 27-arene.js).
   - onze cartes en plus (A a K proposees le 26/11), qui se cumulent comme les autres ; le Vol de vie passe de 1 a 2 % par carte ;
   - cinq cartes LEGENDAIRES, a cadre dore : une chance sur sept par carte tiree d'en voir une (s'il en reste a prendre), une seule fois chacune par partie.
   Les effets se branchent sur les coups recus (blesserPerso), les coups donnes (blesser), la force (boostDegats), les gains (gainsArene), la chute (persoATerre)
   et une petite boucle par partie, lancee a chaque vague (appliquerVagueArene). */
const CARTES_P11 = { pierre: 0.1, critique: 0.1, course: 10, epines: 0.2, ulti: 0.25, moisson: 0.01, bouclier: 0.15, souffle: 0.3, fureur: 0.25, bourse: 0.25, explosion: 0.15, volP11: 0.01 };
const LEG_CARTES = { chance: 1 / 7, ombre: { periode: 15, duree: 3 }, ouverture: { attente: 2.2, duree: 4, x: 2 }, temps: { periode: 20, duree: 2, boss: 1 }, aura: { R: 3.2, pas: 0.5, part: 0.1 }, frenesie: { pas: 0.04, max: 0.6 } };
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
  souffle: { p11: true, nom: 'Dernier souffle', c: ['#e8b23a', '#a0711a', '#fff1c4'], effet: 'une seconde vie (30 %)', txt: 'une fois par partie, au lieu de tomber, tu te relèves',
    svg: SVG_C('<path d="M60 80C30 62 18 46 18 31c0-12 10-21 21-21 9 0 17 6 21 14 4-8 12-14 21-14 11 0 21 9 21 21 0 15-12 31-42 49Z" fill="#ffd04a"/><path d="M14 52c-8-10-6-22 2-28 0 10 6 16 14 20M106 52c8-10 6-22-2-28 0 10-6 16-14 20" fill="#fff6d8"/><path d="M60 30v26M48 42h24" stroke="#fffaf0" stroke-width="6"/>') },
  fureur: { p11: true, nom: 'Fureur', c: ['#c8401e', '#7a2410', '#ffd3c2'], effet: '+25 % de dégâts sous 30 % de vie', txt: 'blessé, tu frappes plus fort',
    svg: SVG_C('<path d="M60 86c-20 0-30-14-30-28 0-16 12-22 14-38 8 8 10 16 10 22 4-6 6-14 4-26 14 10 24 26 24 42 0 16-10 28-22 28Z" fill="#ff7a2e"/><path d="M60 86c-10 0-14-8-14-14 0-8 6-12 8-20 6 6 8 12 8 16 2-2 4-6 4-10 6 6 8 12 8 16 0 6-6 12-14 12Z" fill="#ffd04a"/>') },
  bourse: { p11: true, nom: 'Bourse', c: ['#c9a032', '#8a6a16', '#fbefc4'], effet: '+25 % de kamas de l\'Arène', txt: 'chaque vague tenue rapporte plus',
    svg: SVG_C('<path d="M44 26h32l-6 10c16 6 24 20 22 34-2 12-14 18-32 18S30 82 28 70c-2-14 6-28 22-34Z" fill="#c8945a"/><path d="M44 26c4-8 28-8 32 0" fill="#a8693a"/><circle cx="86" cy="70" r="12" fill="#ffd04a"/><circle cx="22" cy="74" r="10" fill="#ffd04a"/>') + '<path d="M86 64v12M80 70h12" stroke="#a0711a" stroke-width="3"/>' },
  explosion: { p11: true, nom: 'Explosion', c: ['#e07c0a', '#9a4f06', '#ffe2b8'], effet: 'les monstres tués explosent', txt: '15 % de leur vie max aux monstres autour',
    svg: SVG_C('<path d="M60 6 70 28 94 14 84 38 112 42 88 54 104 76 78 66 72 88 58 68 40 86 40 62 12 66 30 48 8 32 34 32 30 8 50 24Z" fill="#ff9a2e"/><path d="M60 26 66 38 80 32 74 46 88 50 74 56 80 70 66 62 60 74 54 62 40 70 46 56 32 50 46 46 40 32 54 38Z" fill="#ffe27a"/>') },
  /* les legendaires */
  ombre: { leg: true, p11: true, nom: 'Voile d\'ombre', c: ['#6b3fb8', '#3a1f6e', '#e2d4fb'], effet: 'invisible 3 s toutes les 15 s', txt: 'plus rien ne te touche pendant ce temps',
    svg: SVG_C('<path d="M60 10c-18 0-28 14-28 30v42c6-4 10-4 14 0 4-4 10-4 14 0 4-4 10-4 14 0 4-4 8-4 14 0V40c0-16-10-30-28-30Z" fill="#5a3a9e" fill-opacity=".75"/>') + '<circle cx="50" cy="40" r="5" fill="#e2d4fb"/><circle cx="70" cy="40" r="5" fill="#e2d4fb"/><g fill="#b48cff" opacity=".7"><circle cx="18" cy="30" r="4"/><circle cx="102" cy="60" r="5"/><circle cx="96" cy="22" r="3"/></g>' },
  ouverture: { leg: true, p11: true, nom: 'Entrée fracassante', c: ['#d9443a', '#7a1f1a', '#ffe0b8'], effet: 'dégâts ×2 en début de vague', txt: 'les 4 premières secondes de chaque vague',
    svg: SVG_C('<path d="M20 70 48 16l8 26 22-20-8 30 30-6-34 38Z" fill="#ffb02e"/>') + '<text x="86" y="36" font-family="Lilita One, sans-serif" font-size="30" fill="#ffd04a" stroke="#3b2a1a" stroke-width="3" paint-order="stroke" text-anchor="middle">×2</text>' },
  temps: { leg: true, p11: true, nom: 'Arrêt du temps', c: ['#3fb0d0', '#1f6a80', '#d8f4fb'], effet: 'monstres figés 2 s toutes les 20 s', txt: 'les boss, 1 s seulement',
    svg: SVG_C('<path d="M36 10h48M36 82h48" fill="none" stroke-width="5"/><path d="M40 12c0 22 20 26 20 34S40 58 40 80h40c0-22-20-26-20-34s20-12 20-34Z" fill="#d8f4fb"/><path d="M48 76h24c-2-10-12-14-12-20-0 6-10 10-12 20Z" fill="#ffd04a"/>') + '<g stroke="#9fe3f5" stroke-width="3" stroke-linecap="round"><path d="M14 40l8 8M22 40l-8 8M98 30l8 8M106 30l-8 8"/></g>' },
  aura: { leg: true, p11: true, nom: 'Aura brûlante', c: ['#e8541c', '#8e2a0c', '#ffd8b8'], effet: 'les monstres proches brûlent', txt: '20 % de tes dégâts par seconde, à moins de 3 cases',
    svg: '<circle cx="60" cy="48" r="34" fill="none" stroke="#ff7a2e" stroke-width="7" stroke-dasharray="10 6"/>' + SVG_C('<path d="M60 70c-10 0-16-8-16-16 0-10 8-14 10-24 6 6 8 12 8 16 4-4 6-10 6-14 6 6 10 14 10 22 0 10-8 16-18 16Z" fill="#ffb02e"/>') },
  frenesie: { leg: true, p11: true, nom: 'Frénésie', c: ['#b0243a', '#6a1224', '#f7ccd4'], effet: '+4 % de dégâts par monstre tué', txt: 'jusqu\'à la fin de la vague, 60 % au plus',
    svg: SVG_C('<path d="M34 12c10 16 16 26 16 36a16 16 0 0 1-32 0c0-10 6-20 16-36Z" fill="#d0243a"/><path d="M80 80V30M66 44l14-14 14 14M96 66V40M86 50l10-10 10 10" fill="none" stroke-width="5"/>') } });
Object.assign(BONUS_ARENE.vol, { effetP11: '2 % de vol de vie', txtP11: 'tes coups te soignent de 2 % des dégâts infligés' });

/* le tirage : les cartes du palier 11 seulement avec lui ; une legendaire (pas deja prise) a une chance sur sept par carte */
{ const tirer0 = tirerBonusArene; tirerBonusArene = function () { if (!cartesArenePct()) { const L = tirer0.apply(this, arguments).filter((id) => !BONUS_ARENE[id].p11); return L.length ? L : tirer0.apply(this, arguments); }
  const pris = (bonusA() || {}), norm = Object.keys(BONUS_ARENE).filter((id) => !BONUS_ARENE[id].leg), leg = Object.keys(BONUS_ARENE).filter((id) => BONUS_ARENE[id].leg && !pris[id]), out = [];
  for (let k = 0; k < 3; k++) { const L = leg.length && Math.random() < LEG_CARTES.chance ? leg : norm; const i = Math.floor(Math.random() * L.length); out.push(L.splice(i, 1)[0]); }
  return out; }; }
/* le cadre dore des legendaires */
{ const carte0 = carteArene; carteArene = function (id) { const h = carte0.apply(this, arguments); return BONUS_ARENE[id] && BONUS_ARENE[id].leg ? h.replace('<button class="bca', '<button class="bca leg').replace('<span class="bca-gemme"></span>', '<span class="bca-gemme"></span><span class="bca-leg">Légendaire</span>') : h; }; }
/* une carte prise : la vitesse (Pas de course) passe par les caracteristiques, on les relit ; les legendaires s'annoncent */
{ const prendre0 = prendreBonusArene; prendreBonusArene = function (id) { const r = prendre0.apply(this, arguments); if (combat) { combat.p11 = null; if (BONUS_ARENE[id] && BONUS_ARENE[id].leg) son('niveau'); } return r; }; }

/* ---------- les effets ---------- */
const nbC = (id) => (cartesArenePct() ? nbBonus(id) : 0);
const auPerso = (txt) => { if (!paysanMesh) return; const p = paysanMesh.position.clone(); p.y += 1.9; chiffre(txt, p, 'perso'); };
{ const bp0 = blesserPerso; blesserPerso = function (n, mo) { const c = combat; if (!c || !c.arene || c.fin || !cartesArenePct()) return bp0.apply(this, arguments);
  if (c.ombreT > 0) { if ((c.ombreTxt || 0) < performance.now()) { c.ombreTxt = performance.now() + 500; auPerso('Invisible'); } return; } /* (Voile d'ombre) */
  const kP = nbC('pierre'); if (kP) n = Math.max(1, Math.round(n * Math.max(0.5, 1 - CARTES_P11.pierre * kP)));
  const kE = nbC('epines'); if (kE && mo && mo.etat === 'actif' && !coupDeLoin(mo)) blesser(mo, Math.max(1, Math.round(n * CARTES_P11.epines * kE)));
  if (c.bouclierCarte > 0 && n > 0) { const a = Math.min(c.bouclierCarte, n); c.bouclierCarte -= a; n -= a; if (a > 0 && (c.bouclierTxt || 0) < performance.now()) { c.bouclierTxt = performance.now() + 350; auPerso('Bouclier -' + fmt(a)); } if (n <= 0) return true; }
  return bp0.call(this, n, mo); }; }
let EXPLOSION_EN_COURS = false;
{ const b0 = blesser; blesser = function (mo, n, gros, src) { const c = combat; if (!c || !c.arene || !cartesArenePct() || !mo || mo.etat !== 'actif') return b0.apply(this, arguments);
  const kC = nbC('critique'); if (kC && src !== 'def' && n > 0 && Math.random() < Math.min(0.5, CARTES_P11.critique * kC)) { n *= 2; const p = new T.Vector3(mo.x, mo.m.position.y + (mo.haut || 1.6) + 0.6, mo.z); chiffre('Critique !', p, 'gros'); }
  const pv0 = mo.pv, r = b0.call(this, mo, n, gros, src), fait = Math.max(0, pv0 - Math.max(0, mo.pv));
  if (fait > 0 && src !== 'def') { const kV = nbC('vol'); if (kV) c.pv = Math.min(c.pvMax, c.pv + fait * CARTES_P11.volP11 * kV); } /* (le Vol de vie a 2 % : 1 % de plus, ici) */
  if (mo.etat === 'mort' && pv0 > 0) {
    const kM = nbC('moisson'); if (kM) c.pv = Math.min(c.pvMax, c.pv + c.pvMax * CARTES_P11.moisson * kM);
    if (nbC('frenesie')) c.frenesie = Math.min(LEG_CARTES.frenesie.max, (c.frenesie || 0) + LEG_CARTES.frenesie.pas);
    const kX = nbC('explosion'); if (kX && !EXPLOSION_EN_COURS) { EXPLOSION_EN_COURS = true; try { const y = mo.m ? mo.m.position.y : 0; pouf(mo.x, y + 0.4, mo.z, 2.2, '#ff9a2e'); onde(mo.x, y + 0.05, mo.z, 2.6, '#ffb04a', 0.35, 0.8);
        emettre(FX_VIF, 14, { x: mo.x, y: y + 0.6, z: mo.z, r: 0.3, dv: 5, haut: true, vie: [0.35, 0.6], taille: [0.12, 0.04], c: ['#fff1a8', '#ff9a2e', '#c8401e'], grav: 8, frein: 1 });
        const dg = Math.max(1, Math.round((mo.pvMax || 0) * CARTES_P11.explosion * kX)); c.monstres.forEach((o) => { if (o !== mo && o.etat === 'actif' && Math.hypot(o.x - mo.x, o.z - mo.z) < 2.6) blesser(o, dg); }); } finally { EXPLOSION_EN_COURS = false; } } }
  return r; }; }
{ const bd0 = boostDegats; boostDegats = function () { let k = bd0.apply(this, arguments); const c = combat; if (!c || !c.arene || !cartesArenePct()) return k;
  if (nbC('fureur') && c.pv < c.pvMax * 0.3) k *= 1 + CARTES_P11.fureur * nbC('fureur');
  if (nbC('ouverture') && c.ouvertureJusque && performance.now() < c.ouvertureJusque && performance.now() > c.ouvertureDebut) k *= LEG_CARTES.ouverture.x;
  if (c.frenesie) k *= 1 + c.frenesie; return k; }; }
{ const g0 = gainsArene; gainsArene = function () { const g = g0.apply(this, arguments); const k = nbC('bourse'); if (k && g) g.kamas = Math.round(g.kamas * (1 + CARTES_P11.bourse * k)); return g; }; }
{ const at0 = persoATerre; persoATerre = function () { const c = combat; if (c && c.arene && c.genre === 'arene' && nbC('souffle') && !c.souffleFait) { c.souffleFait = true; c.pv = Math.round(c.pvMax * CARTES_P11.souffle); c.invincible = Math.max(c.invincible || 0, 1.5);
    const p = paysanMesh.position; pouf(p.x, p.y + 0.6, p.z, 2.4, '#ffd04a'); flashLumiere(p.x, p.y + 1.5, p.z, '#ffd04a', 4, 8, 0.5); auPerso('Dernier souffle !'); toast('Dernier souffle : tu te relèves avec ' + Math.round(CARTES_P11.souffle * 100) + ' % de ta vie !', 'or'); majCombatHud(); return; }
  return at0.apply(this, arguments); }; }
/* la boucle de la partie : lancee a chaque vague (une seule par partie) ; le bouclier se remplit a chaque vague, la Frenesie repart de zero, l'Entree fracassante s'arme */
function bouclierVisuel(c) { if (c.bouclierM || !paysanMesh) return; const m = new T.Mesh(new T.SphereGeometry(1.05, 20, 14), new T.MeshBasicMaterial({ color: '#7fc0f0', transparent: true, opacity: 0.22, depthWrite: false })); m.position.y = 0.95; m.raycast = () => {}; paysanMesh.add(m); c.bouclierM = m; }
{ const av0 = appliquerVagueArene; appliquerVagueArene = function (c, p) { const r = av0.apply(this, arguments); if (!c || !cartesArenePct()) return r;
  const kB = nbC('bouclier'); if (kB) { c.bouclierCarte = Math.round(c.pvMax * CARTES_P11.bouclier * kB); bouclierVisuel(c); }
  c.frenesie = 0; if (nbC('ouverture')) { const O = LEG_CARTES.ouverture; c.ouvertureDebut = performance.now() + O.attente * 1000; c.ouvertureJusque = c.ouvertureDebut + O.duree * 1000; setTimeout(() => { if (combat === c && !c.fin) { auPerso('Dégâts ×2 !'); flashLumiere(paysanMesh.position.x, 1.5, paysanMesh.position.z, '#ff7a2e', 3, 7, 0.4); } }, O.attente * 1000); }
  if (!c.carteTick) { c.carteTick = true; effets.push((dt) => { if (combat !== c || c.fin) { if (c.bouclierM) { c.bouclierM.parent && c.bouclierM.parent.remove(c.bouclierM); c.bouclierM = null; } return true; } tickCartes(c, dt); return false; }); }
  return r; }; }
function tickCartes(c, dt) {
  if (enPause || c.entracte) return;
  const kU = nbC('ulti'); if (kU && c.cdUlti > 0) c.cdUlti = Math.max(0, c.cdUlti - dt * CARTES_P11.ulti * kU); /* (Ulti charge : en plus de la recharge normale) */
  if (c.bouclierM) { c.bouclierM.visible = c.bouclierCarte > 0; c.bouclierM.material.opacity = 0.14 + 0.08 * Math.sin(performance.now() / 300); }
  const pp = paysanMesh.position;
  if (nbC('ombre')) { const O = LEG_CARTES.ombre; c.ombreCycle = (c.ombreCycle || 0) + dt; if (c.ombreCycle >= O.periode) { c.ombreCycle = 0; c.ombreT = O.duree; auPerso('Voile d\'ombre'); pouf(pp.x, pp.y + 0.8, pp.z, 1.8, '#5a3a9e'); }
    if (c.ombreT > 0) { c.ombreT -= dt; paysanMesh.visible = Math.floor(performance.now() / 90) % 3 !== 0; if (Math.random() < 0.5) emettre(FX_FUM, 1, { x: pp.x, y: pp.y + 0.6, z: pp.z, r: 0.5, v: [0, 0.6, 0], vie: [0.5, 0.8], taille: [0.4, 1.0], c: ['#3a1f6e', '#6b3fb8'], a: 0.35, frein: 1 }); if (c.ombreT <= 0) paysanMesh.visible = true; } }
  if (nbC('temps')) { const Tm = LEG_CARTES.temps; c.tempsCycle = (c.tempsCycle || 0) + dt; if (c.tempsCycle >= Tm.periode) { c.tempsCycle = 0; let n = 0;
      c.monstres.forEach((o) => { if (o.etat !== 'actif') return; const d = o.d.boss ? Tm.boss : Tm.duree; o.bloqueT = Math.max(o.bloqueT || 0, d); o.cd = Math.max(o.cd || 0, d); n++;
        emettre(FX_VIF, 6, { x: o.x, y: (o.m ? o.m.position.y : 0) + 0.8, z: o.z, r: 0.5, dv: 1.2, vie: [0.6, 1.0], taille: [0.1, 0.05], c: ['#ffffff', '#bfefff', '#7fd8f0'], grav: 1, frein: 1 }); });
      if (n) { auPerso('Arrêt du temps !'); flashLumiere(pp.x, 2, pp.z, '#9fe3f5', 4, 14, 0.5); } } }
  if (nbC('aura')) { const A = LEG_CARTES.aura; c.auraT = (c.auraT || 0) + dt; if (c.auraT >= A.pas) { c.auraT = 0; const dg = Math.max(1, Math.round(statsPerso().deg * A.part));
      c.monstres.forEach((o) => { if (o.etat === 'actif' && Math.hypot(o.x - pp.x, o.z - pp.z) < A.R) blesser(o, dg); });
      for (let k = 0; k < 4; k++) { const a = Math.random() * Math.PI * 2, rr = A.R * (0.6 + 0.4 * Math.random()); emettre(FX_VIF, 1, { x: pp.x + Math.cos(a) * rr, y: pp.y + 0.15, z: pp.z + Math.sin(a) * rr, v: [0, 1.6, 0], dv: 0.4, vie: [0.35, 0.6], taille: [0.28, 0.06], c: ['#ffd25a', '#ff6a12', '#b0280e'], a: 0.9, frein: 1 }); } } }
}
