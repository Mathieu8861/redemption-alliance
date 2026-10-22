'use strict';
/* ===================== MODELES BLENDER (rendu toon, contour, vent) ===================== */
const vent = creerVent(T, { sol: 0, plafond: 1.3 });
const toon = (c, sp) => { const m = new T.MeshToonMaterial({ color: c, gradientMap: grad }); return sp != null ? vent.materiau(m, sp) : m; };
/* le contour : la face arriere, soit agrandie depuis le centre de l'objet (pieces separees), soit poussee le long des normales (pieces assemblees) */
const contours = {};
function contourMat(ep, sp, origine) {
  const k = ep + '|' + sp + '|' + !!origine; if (contours[k]) return contours[k];
  const m = new T.MeshBasicMaterial({ color: '#3a2b1f', side: T.BackSide });
  const pousser = (sh) => { if (ep) sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * ' + ep.toFixed(4) + ';'); };
  if (sp != null) { vent.materiau(m, sp, origine); const f = m.onBeforeCompile; m.onBeforeCompile = (sh) => { f(sh); pousser(sh); }; } else m.onBeforeCompile = pousser;
  m.customProgramCacheKey = () => 'contour' + k; m.visible = typeof graphismes !== 'function' || graphismes() !== 'leger'; return (contours[k] = m);
}
/* l'eau de l'ile : des bandes claires descendent la cascade, des rides s'ecartent sur la mare (periodique sur 6 s) */
const MARE = [9.1, 6.1];
function eauAnimee(m) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTemps = vent.temps;
    sh.vertexShader = 'varying vec3 vEauWp; varying vec3 vEauN;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvEauWp = (modelMatrix * vec4(transformed, 1.0)).xyz; vEauN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = 'uniform float uTemps; varying vec3 vEauWp; varying vec3 vEauN;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', [
      '#include <dithering_fragment>',
      'float vertical = 1.0 - abs(vEauN.y);',
      'float chute = smoothstep(0.55, 1.0, sin(vEauWp.y * 4.0 + uTemps * 8.37758 + sin(vEauWp.x * 3.0) * 1.5));',
      'float rides = smoothstep(0.82, 1.0, sin(length(vEauWp.xz - vec2(' + MARE[0].toFixed(2) + ', ' + MARE[1].toFixed(2) + ')) * 9.0 - uTemps * 4.18879));',
      'gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.93, 0.98, 1.0), vertical > 0.5 ? chute * 0.5 : rides * 0.3);'
    ].join('\n'));
  };
  m.customProgramCacheKey = () => 'eau';
}
const SOUPLE_ILE = { herbe: 1, tige: 1, feuille: 1, brin: 1, pousse: 1, fleur: 1, fleurs: 0.15, tronc: 0.12, branche: 0.12, noeud: 0.12, feuillage: 0.12, feuillageClair: 0.12, feuillageSombre: 0.12, etage: 0.12, cime: 0.12, pomme: 0.12, pommeReflet: 0.12 };
const SOUPLE_CULTURES = { tige: 1, epi: 1, barbe: 1, feuille: 1, brin: 1, pousse: 1, grain: 1, fleur: 1, capsule: 1, liane: 0.1, feuille_houblon: 0.1, cone: 0.1 };
const SC_ILE = new Set(['pierre_fond', 'terre_dessous', 'feuillageClair', 'feuillageSombre', 'pommeReflet', 'ecume_filet', 'nenuphar', 'galet', 'barbe', 'pousse', 'herbe', 'caillou', 'reflet', 'joint', 'fleur', 'tige', 'champi_point', 'petale', 'ecume']);
const SC_PERSO = new Set(['peinture', 'muscle', 'cicatrice', 'paupiere', 'croc', 'anneau_barbe', 'reflet', 'pupille', 'iris', 'joue', 'sourcil', 'bouche', 'croix_v', 'croix_h', 'boucle_trou', 'paille_nervure', 'paille_brin', 'gorge', 'clou']);
const SC_BATI = new Set(['craie', 'graine', 'fil', 'carreau', 'grillage', 'feu', 'flamme', 'lueur', 'etincelle', 'visage', 'joue', 'plume', 'tache', 'oeil', 'tige', 'epi', 'maille', 'tressage', 'clou', 'caisse_fond', 'chaume_rang', 'ligature', 'brin', 'fleur', 'vitre', 'lanterne', 'buche_bout', 'botte_bout', 'tonneau_dessus',
  'corde_tour', 'douelle', 'lierre', 'grain_ble', 'trou', 'paille', 'barbe', 'kama_cran', 'kama_motif', 'couture', 'pousse', 'trou_serrure', 'rivet', 'reflet', 'eau']);
const SC_CULT = new Set(['barbe', 'pousse', 'ficelle', 'brin']);
const SC_MONSTRES = new Set(['griffe', 'joue', 'gorge', 'bec_coin', 'pupille', 'reflet', 'iris', 'point_front', 'aile_coeur', 'fissure', 'dent', 'gueule', 'narine', 'orbite', 'gravure', 'lame_fil', 'bouche', 'sourcil', 'flamme_coeur', 'couronne_rouge', 'gemme', 'phalange']);
const SANS_OMBRE = new Set(['cone', 'cone_bord', 'paille_nervure', 'paille_brin', 'eau', 'ecume', 'fumee', 'ecume_filet']);
const BRILLE = new Set(['feu', 'flamme', 'lueur', 'etincelle', 'lanterne']);
/* o : { normales: epaisseur du contour pousse, echelle: epaisseur du contour agrandi, souple: souplesses au vent, sansContour, eauIle } */
function versToon(g, o) {
  const ajouts = [], retirer = [];
  g.traverse((m) => {
    if (!m.isMesh) return;
    const nom = m.name.replace(/\.?\d+$/, '').replace(/_\d+$/, '');
    if (nom === 'terre_battue') { retirer.push(m); return; }
    const sp = o.souple ? o.souple[nom] : undefined;
    const c = m.material.color ? m.material.color.clone().convertLinearToSRGB() : new T.Color('#ffffff');
    if (o.douce) { const h = {}; c.getHSL(h); if (h.h > 0.17 && h.h < 0.45 && h.s > 0.35) c.setHSL(h.h, h.s * 0.7, h.l * 0.93); } /* le vert de l'ile, moins flashy (retour de Mathieu) */
    if (nom.startsWith('lumiere') || (BRILLE.has(nom) && !o.eauIle)) { /* sur l'ile, 'lanterne' est la lanterne de pierre : elle reste en pierre */ m.material = new T.MeshBasicMaterial({ color: nom === 'lanterne' ? '#ffe08a' : c }); m.castShadow = false; return; }
    if (nom === 'eau' && !o.eauIle) { m.material = new T.MeshBasicMaterial({ color: '#86ecbd' }); m.castShadow = false; return; }
    if (nom === 'reflet' && !o.eauIle && o.sansContour === SC_BATI) { m.material = new T.MeshBasicMaterial({ color: '#dcfff0' }); return; }
    m.material = toon(c, sp); m.castShadow = !SANS_OMBRE.has(nom); m.receiveShadow = true; m.userData.souple = sp;
    if (sp != null) m.customDepthMaterial = vent.ombre(sp);
    if (nom === 'eau') { m.material.transparent = true; m.material.opacity = 0.85; eauAnimee(m.material); return; }
    if (!(o.sansContour && o.sansContour.has(nom))) { const k = new T.Mesh(m.geometry, contourMat(o.normales || 0, sp)); k.userData.ep = o.normales || 0; if (o.echelle) k.scale.setScalar(1 + o.echelle); ajouts.push([m, k]); }
  });
  retirer.forEach((m) => m.parent.remove(m));
  ajouts.forEach(([m, k]) => m.add(k)); return g;
}
/* ---------- fusion : les milliers de petits morceaux immobiles d'un modele deviennent quelques gros objets, un par materiau
   (l'ile seule faisait pres de 8 000 appels de dessin). Le vent garde le rythme de chaque morceau (attribut aOrigine),
   les touffes d'une case de jeu restent a part (on les cache quand on laboure), et parNom garde les noms (terre des parcelles). ---------- */
function fusionGeo(liste, inv, avecOrigine) {
  let nv = 0, ni = 0; liste.forEach(({ m }) => { const g = m.geometry; nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; });
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), org = avecOrigine ? new Float32Array(nv * 3) : null, idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let ov = 0, oi = 0; const v = new T.Vector3(), mt = new T.Matrix4(), nm = new T.Matrix3(), o = new T.Vector3();
  liste.forEach(({ m, porteur }) => {
    mt.multiplyMatrices(inv, m.matrixWorld); nm.getNormalMatrix(mt); const g = m.geometry, P = g.attributes.position, N = g.attributes.normal;
    if (org) o.setFromMatrixPosition(porteur.matrixWorld).applyMatrix4(inv);
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(mt); const q = (ov + i) * 3; pos[q] = v.x; pos[q + 1] = v.y; pos[q + 2] = v.z;
      if (N) { v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor[q] = v.x; nor[q + 1] = v.y; nor[q + 2] = v.z; }
      if (org) { org[q] = o.x; org[q + 1] = o.y; org[q + 2] = o.z; }
    }
    /* « pourquoi une partie de la tete du Bouftou est toute noire ? » (Mathieu, 12/10/2026) : une piece faite en miroir (echelle negative, l'oreille
       ou la meche de l'autre cote) a ses triangles a l'envers une fois « cuite » dans la fusion ; Three les retournait tout seul sur la piece
       d'origine, pas ici, donc la piece ne s'affichait plus et son contour noir passait devant. On les retourne. */
    const miroir = mt.determinant() < 0, nb = g.index ? g.index.count : P.count, id = (i) => (g.index ? g.index.getX(i) : i) + ov;
    for (let i = 0; i < nb; i += 3) { idx[oi + i] = id(i); idx[oi + i + 1] = id(miroir ? i + 2 : i + 1); idx[oi + i + 2] = id(miroir ? i + 1 : i + 2); }
    ov += P.count; oi += g.index ? g.index.count : P.count;
  });
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.BufferAttribute(nor, 3));
  if (org) geo.setAttribute('aOrigine', new T.BufferAttribute(org, 3)); geo.setIndex(new T.BufferAttribute(idx, 1)); geo.computeBoundingSphere(); geo.computeBoundingBox(); return geo;
}
/* un Bouftou fusionne, pattes comprises : ses 4 pattes deviennent un seul maillage anime par 8 os (une hanche et un genou chacune), une couleur
   par maillage (pattes, sabots, contour), soit 3 dessins au lieu de 24 ; le corps se fusionne comme avant */
/* COPIER UN MODELE ARTICULE (16/10/2026) : clone() partage le squelette du modele ; ici, chaque os de la copie est retrouve par sa place dans l'arbre
   (les os des pattes n'ont pas de nom) et les maillages a peau sont lies a ces nouveaux os. userData.pattes pointe vers les os de la copie. */
function clonerArticule(g0) {
  const ud = g0.userData; g0.userData = {}; const g = g0.clone(true); g0.userData = ud; /* (clone recopie userData en JSON : pas les os) */
  const a = [], b = []; g0.traverse((o) => a.push(o)); g.traverse((o) => b.push(o)); const lien = new Map(a.map((o, i) => [o, b[i]]));
  b.forEach((o, i) => { if (!o.isSkinnedMesh) return; const s = a[i].skeleton; o.bind(new T.Skeleton(s.bones.map((x) => lien.get(x)), s.boneInverses.map((x) => x.clone())), a[i].bindMatrix); });
  g.userData = Object.assign({}, ud, ud.pattes ? { pattes: ud.pattes.map((p) => ({ hanche: lien.get(p.hanche), genou: lien.get(p.genou) })) } : {}); return g;
}
/* un gabarit fabrique une fois, partage (jeter ne le libere jamais), puis copie a chaque usage */
const GABARITS = {};
const copieGabarit = (nom, fabriquer) => clonerArticule(GABARITS[nom] || (GABARITS[nom] = partagerGabarit(fabriquer())));
const partagerGabarit = (g) => { partager(g); return g; };
function fusionnerBouftou(g) { souderPattes(g); return fusionner(g); }
function souderPattes(g) {
  const P = g.userData.pattes; if (!P || !P.length || P[0].hanche.isBone) return;
  g.updateMatrixWorld(true); const inv = new T.Matrix4().copy(g.matrixWorld).invert();
  const boite = new T.Group(); boite.name = 'pattes'; boite.userData.articule = true; g.add(boite);
  const os = [], paquets = new Map();
  P.forEach((p, i) => {
    const h = new T.Bone(), k = new T.Bone(); h.position.copy(p.hanche.position); k.position.copy(p.genou.position); h.add(k); boite.add(h); os.push(h, k);
    [[p.hanche, 2 * i], [p.genou, 2 * i + 1]].forEach(([grp, b]) => grp.traverse((m) => {
      if (!m.isMesh) return; for (let x = m.parent; x && x !== grp; x = x.parent) if (x.userData.articule) return; /* (les pieces du genou se comptent avec le genou) */
      const cle = m.material === CONTOUR ? 'contour' : m.material.color.getHexString(); if (!paquets.has(cle)) paquets.set(cle, { M: m.material, pieces: [] }); paquets.get(cle).pieces.push({ m, b });
    }));
  });
  g.updateMatrixWorld(true); const squelette = new T.Skeleton(os), mt = new T.Matrix4(), nm = new T.Matrix3(), v = new T.Vector3();
  paquets.forEach(({ M, pieces }) => {
    let nv = 0, ni = 0; pieces.forEach(({ m }) => { const G = m.geometry; nv += G.attributes.position.count; ni += G.index ? G.index.count : G.attributes.position.count; });
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let ov = 0, oi = 0;
    pieces.forEach(({ m, b }) => {
      mt.multiplyMatrices(inv, m.matrixWorld); nm.getNormalMatrix(mt); const G = m.geometry, Pp = G.attributes.position, N = G.attributes.normal;
      for (let i = 0; i < Pp.count; i++) { const q = (ov + i) * 3; v.fromBufferAttribute(Pp, i).applyMatrix4(mt); pos[q] = v.x; pos[q + 1] = v.y; pos[q + 2] = v.z; v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor[q] = v.x; nor[q + 1] = v.y; nor[q + 2] = v.z; si[(ov + i) * 4] = b; sw[(ov + i) * 4] = 1; }
      const nb = G.index ? G.index.count : Pp.count; for (let i = 0; i < nb; i++) idx[oi + i] = (G.index ? G.index.getX(i) : i) + ov;
      ov += Pp.count; oi += nb;
    });
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.BufferAttribute(nor, 3));
    geo.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4)); geo.setIndex(new T.BufferAttribute(idx, 1));
    const M2 = M.clone(); M2.skinning = true; const sm = new T.SkinnedMesh(geo, M2); sm.name = 'patte'; sm.castShadow = M !== CONTOUR; sm.receiveShadow = M !== CONTOUR; boite.add(sm);
    sm.updateMatrixWorld(true); sm.bind(squelette, sm.matrixWorld);
  });
  P.forEach((p) => { if (p.hanche.parent) p.hanche.parent.remove(p.hanche); });
  g.userData.pattes = P.map((_, i) => ({ hanche: os[2 * i], genou: os[2 * i + 1] }));
}
function fusionner(racine, o) {
  o = o || {}; racine.updateMatrixWorld(true); const inv = new T.Matrix4().copy(racine.matrixWorld).invert();
  const base = (x) => ((x && x.name) || '').replace(/\.?\d+$/, '').replace(/_\d+$/, ''), paquets = new Map(), porteurs = new Set();
  const articule = (m) => { for (let x = m.parent; x && x !== racine; x = x.parent) if (x.userData && x.userData.articule) return true; return false; }; /* (une patte de Bouftou : elle bouge, on ne la soude pas au corps) */
  racine.traverse((m) => {
    if (!m.isMesh || articule(m)) return;
    const contour = m.material.side === T.BackSide, porteur = contour && m.parent && m.parent.isMesh ? m.parent : m; /* un contour de maille() (frere de sa piece) se fusionne seul */
    const M = m.material, sp = porteur.userData.souple; /* meme apparence = meme paquet (chaque morceau avait son propre exemplaire de materiau) */
    let cle = contour ? M.uuid + '|c|' + sp : [M.type, M.color ? M.color.getHexString() : '', M.transparent ? 't' : '', M.onBeforeCompile && M.customProgramCacheKey ? M.customProgramCacheKey() : '', sp, M.side].join('|'), cas = null; /* (le cote dessine compte : la cape portee est visible des deux cotes, 12/10/2026) */
    if (o.parNom) cle += '|' + base(porteur);
    if (o.caseDe) { let h = porteur; while (h && h !== racine && base(h) !== 'herbe') h = h.parent; if (h && h !== racine) { cas = o.caseDe(h); if (cas) cle += '|' + cas; } }
    if (!paquets.has(cle)) paquets.set(cle, { liste: [], contour, cas, ex: m, porteur });
    paquets.get(cle).liste.push({ m, porteur }); porteurs.add(porteur);
  });
  paquets.forEach((pq) => {
    const sp = pq.porteur.userData.souple, souple = sp != null;
    let materiau = pq.ex.material;
    if (pq.contour && souple) materiau = contourMat(pq.ex.userData.ep || 0, sp, true);
    else if (!pq.contour && souple) materiau = vent.materiau(new T.MeshToonMaterial({ color: pq.ex.material.color, gradientMap: grad }), sp, true);
    const f = new T.Mesh(fusionGeo(pq.liste, inv, souple), materiau);
    f.name = o.parNom ? base(pq.porteur) : ''; f.castShadow = !pq.contour && pq.porteur.castShadow; f.receiveShadow = !pq.contour;
    if (!pq.contour && souple) f.customDepthMaterial = vent.ombre(sp, true);
    if (pq.cas) f.userData.case = pq.cas;
    racine.add(f);
  });
  porteurs.forEach((m) => { if (m.parent) m.parent.remove(m); });
  /* les groupes vides restants (touffes, morceaux) ne servent plus */
  const vides = []; racine.traverse((x) => { if (x !== racine && !x.isMesh && !x.isBone && x.children.length === 0) vides.push(x); }); vides.forEach((x) => x.parent && x.parent.remove(x));
  return racine;
}
const chargeur = new T.GLTFLoader();
/* les modeles du jeu sont compresses (Draco, blender/compresser.py) dans assets/modeles/jeu/ */
const draco = new T.DRACOLoader(); draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/gltf/'); chargeur.setDRACOLoader(draco);
const chargerGlbUneFois = (url) => new Promise((ok, ko) => chargeur.load(url, (gl) => ok(gl.scene), undefined, ko));
const chargerGlb = (url, essais = 3) => chargerGlbUneFois(url).catch((e) => (essais > 1 ? new Promise((r) => setTimeout(r, 800)).then(() => chargerGlb(url, essais - 1)) : Promise.reject(e))); /* (trois essais : un modele rate ne fait plus planter le jeu plus tard, 16/10/2026) */
const MODELES = {};
const VERSION_MODELES = '20261022b'; /* a changer a chaque nouvel export des modeles : sinon le navigateur garde les anciens en cache */
/* un modele tire d'une planche : on le recentre, on le remet droit, on l'ajuste a la taille voulue (pied au sol, centre en 0) */
/* comme gabarit, mais a une echelle donnee et centre sur un point donne (non mis a l'echelle) : les 5 niveaux d'un batiment gardent la meme echelle,
   le niveau 1 a la taille d'avant et les suivants grandissent vraiment */
function gabaritEchelle(racine, nom, k, centre) {
  const n = racine.getObjectByName(nom); if (!n) { console.warn('modele introuvable', nom); return new T.Group(); }
  const g = n.clone(true); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.scale.set(1, 1, 1); g.updateMatrixWorld(true);
  const b = new T.Box3().setFromObject(g), d = new T.Vector3(); b.getSize(d); g.scale.setScalar(k);
  const c = centre || b.getCenter(new T.Vector3()); g.position.set(-c.x * k, -b.min.y * k, -c.z * k);
  const enveloppe = new T.Group(); enveloppe.add(g); enveloppe.userData.hauteur = d.y * k; enveloppe.userData.solY = b.min.y; return fusionner(enveloppe);
}
const nomBase = (o) => (o.name || '').replace(/[._]?\d+$/, ''); /* (le glTF colle le numero : socle001) */
/* retire d'un modele les pieces dont le nom est dans la liste ; renvoie le bas de ce qui a ete retire (en coordonnees du modele) */
function retirerPieces(racine, nom, noms) {
  const g = racine.getObjectByName(nom); if (!g) return null; g.updateMatrixWorld(true); const L = [], b = new T.Box3(), bb = new T.Box3();
  g.traverse((o) => { if (o.isMesh && noms.has(nomBase(o))) L.push(o); });
  L.forEach((o) => { bb.setFromObject(o); b.union(bb); o.parent.remove(o); });
  return L.length ? b.min.y : null;
}
const ARME_TOUR = new Set(['socle', 'pivot', 'fut', 'crosse', 'arc', 'corde', 'carreau', 'treuil']), TOFUS_DECOR = new Set(['tofu', 'aile', 'bec']);
/* LA FUMEE DE LA CHEMINEE (14/10/2026, « on peut faire en sorte que la fumee de la cheminee ait des mouvements, comme l'eau ? que ca fasse plus naturel », Mathieu) :
   les trois boules figees du modele sont remplacees par des bouffees qui sortent de la cheminee, montent en grossissant, partent avec le vent et s'effacent, en boucle */
const FUMEE_FIGEE = new Set(['fumee']), FUMEE_GRANGE = [], N_BOUFFEES = 6;
let fumeesCheminee = [];
function fumerCheminee(bat, n) {
  const p = FUMEE_GRANGE[n]; if (!p) return;
  const g = new T.Group(); g.position.copy(p); bat.add(g);
  for (let k = 0; k < N_BOUFFEES; k++) { const m = new T.Mesh(new T.IcosahedronGeometry(1, 1), new T.MeshToonMaterial({ color: '#f4f1ea', gradientMap: grad, transparent: true, depthWrite: false })); m.castShadow = false; m.userData.k = k; g.add(m); }
  fumeesCheminee.push(g);
}
function animerFumees(s) {
  fumeesCheminee.forEach((g) => g.children.forEach((m) => {
    const t = (s * 0.32 + m.userData.k / N_BOUFFEES) % 1, e = 1 - Math.pow(1 - t, 1.6); /* (vite a la sortie, puis elle ralentit en montant) */
    const v = (m.userData.k * 0.618) % 1; /* (chaque bouffee a sa taille et sa derive : pas une colonne de boules toutes pareilles) */
    m.position.set(e * (0.45 + 0.3 * v) + Math.sin(s * 1.3 + m.userData.k * 2.1) * 0.08 * t, e * (1.6 + 0.4 * v), -e * 0.18 + Math.cos(s * 1.1 + m.userData.k) * 0.07 * t);
    m.scale.setScalar((0.11 + 0.3 * e) * (0.8 + 0.4 * v)); m.rotation.y = m.userData.k + t * 1.5;
    m.material.opacity = Math.min(1, t / 0.06) * (1 - Math.max(0, (t - 0.45) / 0.55)) * 0.92;
  }));
}
const BAS_TOUR = [0, 0, 0, 0, 0], ECH_TOUR = 0.72;
function modelesNiveaux(G) {
  [G.tours, G['granges-niveaux'], G['puits-niveaux'], G['voliere-niveaux'], G['etal-niveaux'], G.arbaletes, G['enclos-modules']].forEach((sc) => versToon(sc, { normales: 0.01, sansContour: SC_BATI }));
  const kDe = (sc, nom, taille) => { const o = sc.getObjectByName(nom).clone(true); o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrixWorld(true); const b = new T.Box3().setFromObject(o), d = new T.Vector3(); b.getSize(d); return [taille / Math.max(d.x, d.z), b.getCenter(new T.Vector3())]; }; /* (mesure a l'origine, comme gabaritEchelle) */
  const [kg, cg] = kDe(G['granges-niveaux'], 'Grange1', 3.9), [kp, cp] = kDe(G['puits-niveaux'], 'Puits1', 1.75), [ke, ce] = kDe(G['etal-niveaux'], 'Etal1', 3.0), [kv, cv] = kDe(G['voliere-niveaux'], 'Voliere1', 1.85);
  for (let n = 1; n <= 5; n++) {
    { const o = G['granges-niveaux'].getObjectByName('Grange' + n).clone(true); o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrixWorld(true);
      const b = new T.Box3().setFromObject(o), pts = []; o.traverse((m) => { if (m.isMesh && nomBase(m) === 'fumee') pts.push(new T.Box3().setFromObject(m).getCenter(new T.Vector3())); });
      pts.sort((p, q) => p.y - q.y); FUMEE_GRANGE[n] = pts.length ? new T.Vector3((pts[0].x - cg.x) * kg, (pts[0].y - b.min.y) * kg - 0.38, (pts[0].z - cg.z) * kg) : null;
      retirerPieces(G['granges-niveaux'], 'Grange' + n, FUMEE_FIGEE); }
    MODELES['grange' + n] = gabaritEchelle(G['granges-niveaux'], 'Grange' + n, kg, cg);
    MODELES['puits' + n] = gabaritEchelle(G['puits-niveaux'], 'Puits' + n, kp, cp);
    MODELES['hdv' + n] = gabaritEchelle(G['etal-niveaux'], 'Etal' + n, ke, ce);
    retirerPieces(G['voliere-niveaux'], 'Voliere' + n, TOFUS_DECOR); /* le jeu montre ses vrais Tofus */
    MODELES['voliere' + n] = gabaritEchelle(G['voliere-niveaux'], 'Voliere' + n, kv, n === 1 ? cv : new T.Vector3(0, 0, 0));
    const bas = retirerPieces(G.tours, 'Tour' + n, ARME_TOUR); /* le jeu y met l'arbalete du meme niveau, qui vise */
    MODELES['tour' + n] = gabaritEchelle(G.tours, 'Tour' + n, ECH_TOUR, new T.Vector3(0, 0, 0)); BAS_TOUR[n - 1] = ((bas || 2) - (MODELES['tour' + n].userData.solY || 0)) * ECH_TOUR;
    MODELES['arbalete' + n] = gabaritEchelle(G.arbaletes, 'Arbalete' + n, 1, new T.Vector3(0, 0, 0));
  }
  /* l'enclos : ses modules par niveau, a l'echelle de la cloture du jeu */
  const Ge = G['enclos-modules'], [kc] = kDe(Ge, 'Cloture1', 2.0), O = new T.Vector3(0, 0, 0);
  [1, 2, 3, 5].forEach((n) => { MODELES['cloture' + n] = gabaritEchelle(Ge, 'Cloture' + n, kc, O); });
  [2, 3, 5].forEach((n) => { MODELES['portique' + n] = gabaritEchelle(Ge, 'Portique' + n, kc, O); });
  MODELES.abreuvoir = gabaritEchelle(Ge, 'Abreuvoir', kc, O); MODELES.mangeoire = gabaritEchelle(Ge, 'Mangeoire', kc, O);
  [4, 5].forEach((n) => { MODELES['bergerie' + n] = gabaritEchelle(Ge, 'Bergerie' + n, kc * 0.9, O); });
  MODELES.grange = MODELES.grange1; MODELES.puits = MODELES.puits1; MODELES.hdv = MODELES.hdv1; MODELES.voliere = MODELES.voliere1;
  MODELES.toitGrange = MODELES.grange1.userData.hauteur; MODELES.leveGrange = 0.55 * kg; /* le faitage du niveau 1, et de combien la grange monte au niveau 3 */
}
function gabarit(racine, nom, taille, axe) {
  const n = racine.getObjectByName(nom); if (!n) { console.warn('modele introuvable', nom); return new T.Group(); }
  const g = n.clone(true); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.scale.set(1, 1, 1); g.updateMatrixWorld(true);
  const b = new T.Box3().setFromObject(g), d = new T.Vector3(); b.getSize(d);
  const k = taille / (axe === 'y' ? d.y : Math.max(d.x, d.z)); g.scale.setScalar(k);
  const c = new T.Vector3(); b.getCenter(c); g.position.set(-c.x * k, -b.min.y * k, -c.z * k);
  const enveloppe = new T.Group(); enveloppe.add(g); enveloppe.userData.hauteur = d.y * k; return fusionner(enveloppe);
}
/* le personnage marche vraiment : on regroupe chaque jambe (jambe, botte, bande) sous un pivot a la hanche,
   chaque bras (bras, brassard, main) sous un pivot a l'epaule ; le bras qui tient l'arc du Cra ne bouge pas */
function articuler(racine) {
  racine.updateMatrixWorld(true);
  const base = (o) => ((o && o.name) || '').replace(/\.?\d+$/, ''), box = new T.Box3(), c = new T.Vector3();
  const pieces = []; racine.traverse((o) => { if ((o.isMesh || o.isGroup || o.type === 'Object3D') && base(o) && !(o.parent && o.parent.isMesh)) pieces.push(o); });
  let hanche = 0; pieces.filter((o) => o.isMesh && base(o) === 'jambe').forEach((j) => { box.setFromObject(j); hanche = Math.max(hanche, box.max.y); });
  if (!hanche) return;
  const haut = racine.getObjectByName('haut'), corps = pieces.find((o) => o.isMesh && base(o) === 'jambe').parent; /* le groupe du personnage */
  [-1, 1].forEach((sg) => {
    const piv = new T.Group(); piv.name = 'pivot_jambe' + (sg < 0 ? 'G' : 'D'); corps.add(piv); piv.position.copy(corps.worldToLocal(new T.Vector3(sg * 0.19, hanche, 0))); piv.updateMatrixWorld(true);
    pieces.filter((o) => o.isMesh && o.parent === corps && ['jambe', 'botte', 'bande'].includes(base(o))).forEach((o) => { box.setFromObject(o); box.getCenter(c); if (Math.sign(c.x) === sg && box.max.y <= hanche + 0.05) piv.attach(o); });
  });
  if (!haut) return;
  const arc = racine.getObjectByName('arc'); let coteArc = 0; if (arc) { box.setFromObject(arc); box.getCenter(c); coteArc = Math.sign(c.x); }
  [-1, 1].forEach((sg) => {
    if (sg === coteArc) return;
    const piv = new T.Group(); piv.name = 'pivot_bras' + (sg < 0 ? 'G' : 'D'); piv.position.set(sg * 0.46, 1.2, 0.02); haut.add(piv); piv.updateMatrixWorld(true);
    const epaule = haut.localToWorld(new T.Vector3(sg * 0.46, 1.2, 0.02)), poignet = haut.localToWorld(new T.Vector3(sg * 0.6, 0.62, 0.1));
    haut.children.slice().forEach((o) => {
      if (o === piv || /^pivot|epauliere|pointe|col|arc|carquois|fouet|sac|dague|epee|fourreau/.test(base(o))) return;
      box.setFromObject(o); box.getCenter(c); const t = new T.Vector3(); box.getSize(t);
      const seg = new T.Line3(epaule, poignet), proche = seg.closestPointToPoint(c, true, new T.Vector3()).distanceTo(c); /* colle le long du bras (lacets, bracelets, mitaines) */
      const surBras = ['bras', 'brassard', 'main'].includes(base(o)) || (proche < 0.17 && Math.max(t.x, t.y, t.z) < 0.4 && !/queue|garde|kama|bourse|cordon|attache|pelerine|foulard|ceinture|boucle|tunique|baudrier/.test(base(o)));
      if (surBras && Math.sign(c.x) === sg) piv.attach(o);
    });
  });
}
/* une ombre douce sous les pieds : sans elle, l'ombre du soleil tombe de biais et on croit que le personnage flotte */
const OMBRE_PIEDS = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(40,30,20,0.55)'); g.addColorStop(0.6, 'rgba(40,30,20,0.25)'); g.addColorStop(1, 'rgba(40,30,20,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }); })();
partager(OMBRE_PIEDS);
function ombrePieds(g, taille) { g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } }); /* une seule ombre, ronde, sous les pieds ; et plus d'ombre recue : sur tablette, les ombres moins precises noircissaient la tete des Bouftous (photo de Mathieu, 11/10/2026) */ const o = new T.Mesh(new T.PlaneGeometry(1, 1), OMBRE_PIEDS); o.rotation.x = -Math.PI / 2; o.position.y = 0.03; o.scale.setScalar(taille); o.renderOrder = 1; g.add(o); return o; }
/* les pivots d'un modele du palier 8, retrouves par leur nom dans une copie (le glTF colle un numero aux doublons : hanche_G001) */
const PIVOT_P8 = /^(hanche_|genou_|epaule_|aile_(G|D)|queue_pivot|segment_|tete_pivot)/, SC_P8 = new Set([...SC_MONSTRES, 'papier', 'peinture', 'brillant', 'losange', 'spirale', 'clou', 'rivet', 'corde_arc']);
function lierPivots(g) {
  const u = { membres: true, bras: [], ailes: [], anneaux: [] }, H = {}, K = {};
  g.traverse((o) => { let r;
    if ((r = /^hanche_(AG|AD|RG|RD|G|D)\d*$/.exec(o.name))) H[r[1]] = o; else if ((r = /^genou_(AG|AD|RG|RD|G|D)\d*$/.exec(o.name))) K[r[1]] = o;
    else if ((r = /^epaule_(G|D)\d*$/.exec(o.name))) u.bras[r[1] === 'G' ? 0 : 1] = o; else if ((r = /^aile_(G|D)\d*$/.exec(o.name))) u.ailes[r[1] === 'G' ? 0 : 1] = o;
    else if (/^segment_\d/.test(o.name)) u.anneaux.push(o); else if (/^queue_pivot/.test(o.name)) u.queue = o; else if (/^tete_pivot/.test(o.name)) u.tete = o; });
  const P = ['AG', 'AD', 'RG', 'RD', 'G', 'D'].filter((k) => H[k] && K[k]).map((k) => ({ hanche: H[k], genou: K[k] })); if (P.length) u.pattes = P;
  u.anneaux.sort((a, b) => (a.name < b.name ? -1 : 1)); u.anneaux.forEach((o) => { o.userData.y0 = o.position.y; });
  return u;
}
function cloner(nom) { const g = MODELES[nom].clone(true); g.userData = Object.assign({}, MODELES[nom].userData); if (g.userData.pivots) Object.assign(g.userData, lierPivots(g)); return g; }
function marquer(g, cellule) { g.traverse((o) => { o.userData.cellule = cellule; }); return g; }
/* LES PERSONNAGES DE LA SIMU VSA (Omeho, le voleur, le voleur monte) et le marchand, charges a part (16/10/2026) : un modele rate (connexion) se recharge
   a l'annonce d'une simu, au lieu de faire planter la simu a l'apparition de ses voleurs. Ne charge que ce qui manque. */
const TAILLE_VOLEUR = 0.72; /* les voleurs de VSA, a 72 % d'un perso (17/10/2026 : « reduis la taille de ceux qui attaquent », Mathieu ; c'etait deja celle du cavalier) */
let chargementVsa = null; /* (un seul rechargement a la fois) */
function chargerPersonnagesVsa() { return chargementVsa || (chargementVsa = chargerPersonnagesVsa0().finally(() => { chargementVsa = null; })); }
async function chargerPersonnagesVsa0() {
  if (!MODELES.omeho) try { const sc = await chargerGlb('assets/modeles/jeu/omeho.glb?v=' + VERSION_MODELES); MODELES.omeho = versToon(sc, { echelle: 0.025, sansContour: SC_PERSO }); MODELES.omeho.scale.setScalar(0.6); MODELES.omeho.userData.hauteur = 1.75; /* (un peu plus grand que le voleur : c'est un repere) */ } catch (err) { /* pas encore de modele */ }
  for (const f of ['voleur', 'marchand']) { if (MODELES[f]) continue; try { const sc = await chargerGlb('assets/modeles/jeu/' + f + '.glb?v=' + VERSION_MODELES); MODELES[f] = versToon(sc, { echelle: 0.025, sansContour: SC_PERSO }); articuler(MODELES[f]); MODELES[f].scale.setScalar(0.5 * (f === 'voleur' ? TAILLE_VOLEUR : 1)); MODELES[f].userData.hauteur = 1.7 * (f === 'voleur' ? TAILLE_VOLEUR : 1); } catch (err) { /* pas encore de modele */ } }
  if (!MODELES.demenageur) try { const sc = await chargerGlb('assets/modeles/jeu/demenageur.glb?v=' + VERSION_MODELES); MODELES.demenageur = versToon(sc, { echelle: 0.025, sansContour: SC_PERSO }); articuler(MODELES.demenageur); MODELES.demenageur.scale.setScalar(0.5); MODELES.demenageur.userData.hauteur = 1.85; } catch (err) { /* sans lui, la simu part sans Demenageur */ } /* le Demenageur de VSA, a la taille d'un perso (19/10/2026) */
  if (MODELES.voleur && MODELES.monture && !MODELES.voleurMonte) { /* le voleur en selle sur sa Dragodinde */
    const g = new T.Group(), mt = cloner('monture'), v = cloner('voleur'); g.add(mt); v.position.set(0, 0.84, 0.02); v.rotation.x = 0.1; /* assis sur la selle (a 1,28 du sol), a la taille de tous les voleurs */ g.add(v); g.userData.hauteur = 2.4; MODELES.voleurMonte = g;
  }
}
const personnagesVsaPrets = () => !!(MODELES.voleur && MODELES.voleurMonte);
async function chargerModeles() {
  const texte = document.getElementById('chargement-texte');
  const fichiers = ['ile-ronde-jeu', 'koalaks', 'koulosse', 'palier8', 'dragon-cochon', 'batiments', 'tours', 'granges-niveaux', 'puits-niveaux', 'voliere-niveaux', 'etal-niveaux', 'arbaletes', 'enclos-modules', 'objets', 'ble-planche', 'cultures', 'cultures2', 'cultures3', 'casino-jeu', 'wabbits', 'monstres', 'chafers', 'bworks', 'craqueleurs', 'dragoeufs', 'monture', 'iop3', 'osa', 'cra', 'atelier-forge'];
  let faits = 0;
  const scenes = await Promise.all(fichiers.map((f) => chargerGlb('assets/modeles/jeu/' + f + '.glb?v=' + VERSION_MODELES).then((sc) => { faits++; texte.textContent = 'Chargement de l\'île... ' + Math.round(100 * faits / fichiers.length) + ' %'; document.getElementById('chargement-barre').style.width = Math.round(100 * faits / fichiers.length) + '%'; return sc; })));
  const G = Object.fromEntries(fichiers.map((f, k) => [f, scenes[k]]));
  /* L'ILE RONDE (blender/ile-ronde-jeu.py) : chaque terrain existe en herbe (herbe_Tn) et en friche (friche_Tn), on montre l'un ou l'autre (majTerrains) ;
     le reste (le depart, le pourtour, l'eau, la roche du dessous) est fusionne en un seul modele. Plus d'arbres ni de pieces a extraire : ceux des
     anciennes sauvegardes sont devenus des decorations (migrerIleRonde) */
  const ileT = versToon(G['ile-ronde-jeu'], { echelle: 0.012, souple: SOUPLE_ILE, sansContour: SC_ILE, eauIle: true, douce: true }); ileT.updateMatrixWorld(true);
  MODELES.arbres = []; MODELES.piecesIle = []; MODELES.ileTerrains = {};
  const detacher = (nom, touffes) => { const g = ileT.getObjectByName(nom); if (!g) return null; const e = new T.Group(); e.name = nom; g.parent.remove(g); e.add(g); return fusionner(e, touffes ? { caseDe: caseDeTouffe() } : {}); };
  TERRAINS.forEach((t) => { MODELES.ileTerrains[t.id] = { herbe: detacher('herbe_' + t.id, true), friche: detacher('friche_' + t.id, false) }; });
  /* le pourtour et la roche du dessous, en morceaux de 18 de cote : ce qui sort de l'ecran n'est pas dessine (fusionnes d'un bloc, ils l'etaient toujours) */
  MODELES.ileMorceaux = []; ['pourtour', 'dessous'].forEach((nom) => { const g = ileT.getObjectByName(nom); if (!g) return; const paquets = new Map(), v = new T.Vector3();
    g.children.slice().forEach((o) => { o.getWorldPosition(v); const k = Math.floor(v.x / 18) + '_' + Math.floor(v.z / 18); if (!paquets.has(k)) paquets.set(k, new T.Group()); paquets.get(k).attach(o); });
    g.parent.remove(g); paquets.forEach((e) => MODELES.ileMorceaux.push(fusionner(e))); });
  MODELES.ile = fusionner(ileT, { caseDe: caseDeTouffe() });
  const BATI = { normales: 0.012, sansContour: SC_BATI };
  versToon(G.batiments, BATI); versToon(G.objets, BATI);
  if (G['atelier-forge']) { versToon(G['atelier-forge'], BATI); MODELES.forge = gabaritEchelle(G['atelier-forge'], 'AtelierForge', 1, new T.Vector3(0, 0, 0)); } /* l'atelier de forgemagie (blender/atelier-forge.py), d'une case */
  versToon(G['casino-jeu'], BATI); MODELES.montgolfiere = G['casino-jeu'].getObjectByName('MontgolfiereSol') || G['casino-jeu'].getObjectByName('Montgolfiere'); /* (l'ile ronde : posee dans l'herbe, amarree a ses piquets ; plus de ponton au-dessus du vide) */ MODELES.decorCasino = G['casino-jeu'].getObjectByName('DecorVisite'); /* (blender/casino.py --jeu) */
  modelesNiveaux(G); /* 11/10/2026 : les batiments du niveau 1 au niveau 5 */
  MODELES.epouvantail = gabarit(G.batiments, 'epouvantail', 2.6, 'y');
  MODELES.botte = gabarit(G.objets, 'botte', 1.0);
  MODELES.auge = gabarit(G.objets, 'auge', 1.5);
  MODELES.cloture = gabarit(G.objets, 'clotureDroite', 2.0);
  MODELES.panneau = gabarit(G.objets, 'panneau', 1.1);
  MODELES.portillon = gabarit(G.objets, 'portillonFerme', 2.0); /* ferme : l'enclos ne reste pas ouvert */
  versToon(G['ble-planche'], { normales: 0.008, souple: SOUPLE_CULTURES, sansContour: SC_CULT });
  versToon(G.cultures, { normales: 0.008, souple: SOUPLE_CULTURES, sansContour: SC_CULT });
  versToon(G.cultures2, { normales: 0.008, souple: SOUPLE_CULTURES, sansContour: SC_CULT }); /* les cultures de haut niveau (12/10/2026) */
  versToon(G.cultures3, { normales: 0.008, souple: SOUPLE_CULTURES, sansContour: SC_CULT }); /* la Cawotte et la Fraise : oubliees jusqu'au 11/10/2026, leurs couleurs
    restaient brutes (terre #280d03 au lieu de #6e3f20), d'ou des sillons presque noirs (« ca fait un truc bizarre nan ? », Mathieu) */
  CULTURES.forEach((c) => [0, 1, 2].forEach((k) => { const n = c.id === 'ble' ? 'parcelle_A' + k : 'parcelle_' + c.id + '_' + k; const src = (c.id === 'ble' ? G['ble-planche'] : G[c.glb || 'cultures']).getObjectByName(n); const g = src.clone(true); g.position.set(0, 0.02, 0); g.rotation.set(0, 0, 0); MODELES[c.id + k] = g; }));
  const nu = MODELES.ble0.clone(true); /* (la parcelle nue, avant la fusion du ble) */ const enlever = []; nu.children.forEach((o) => { const nom = o.name.replace(/\.?\d+$/, ''); if (nom !== 'terre' && nom !== 'sillon') enlever.push(o); }); enlever.forEach((o) => nu.remove(o)); MODELES.nu = fusionner(nu, { parNom: true });
  CULTURES.forEach((c) => [0, 1, 2].forEach((k) => { MODELES[c.id + k] = fusionner(MODELES[c.id + k], { parNom: true }); }));
  versToon(G.monstres, { normales: 0.01, sansContour: SC_MONSTRES });
  MODELES.tofu = gabarit(G.monstres, 'Tofu', 0.75, 'y'); /* (0,75 et non plus 0,85 depuis ses pattes et sa petite houppe, 22/10/2026 : le corps garde la meme taille) */
  MODELES.chafer = gabarit(G.monstres, 'Chafer', 1.5, 'y'); MODELES.royal = gabarit(G.monstres, 'BouftouRoyal', 2.7, 'y'); /* les vagues */
  versToon(G.chafers, { normales: 0.01, sansContour: SC_MONSTRES }); /* palier 2 (blender/chafers.py) */
  versToon(G.monture, { normales: 0.01, sansContour: SC_MONSTRES }); MODELES.monture = gabarit(G.monture, 'Monture', 2.0, 'y'); /* la Dragodinde des raids (blender/monture.py) */
  MODELES.fantassin = gabarit(G.chafers, 'ChaferFantassin', 1.75, 'y'); MODELES.gardien = gabarit(G.chafers, 'ChaferGardien', 2.1, 'y'); MODELES.archer = gabarit(G.chafers, 'ChaferArcher', 1.75, 'y'); MODELES.cuirasse = gabarit(G.chafers, 'ChaferCuirasse', 3.0, 'y');
  versToon(G.bworks, { normales: 0.01, sansContour: SC_MONSTRES }); /* palier 3 : la Horde des Bworks (blender/bworks.py) */
  MODELES.bwork = gabarit(G.bworks, 'Bwork', 1.9, 'y'); MODELES.bworkArcher = gabarit(G.bworks, 'BworkArcher', 2.0, 'y'); MODELES.bworkMage = gabarit(G.bworks, 'BworkMage', 2.0, 'y'); MODELES.bworkette = gabarit(G.bworks, 'Bworkette', 1.65, 'y'); MODELES.bworker = gabarit(G.bworks, 'Bworker', 3.3, 'y');
  versToon(G.craqueleurs, { normales: 0.01, sansContour: SC_MONSTRES }); versToon(G.dragoeufs, { normales: 0.01, sansContour: SC_MONSTRES }); /* paliers 4 et 5 (blender/craqueleurs.py, dragoeufs.py) */
  [['craqueleur', 'Craqueleur', 2.1], ['craqueboule', 'Craqueboule', 1.25], ['craqLanceur', 'CraqLanceur', 2.5], ['craqCristal', 'CraqCristal', 2.2], ['craqLegendaire', 'CraqLegendaire', 3.7]].forEach(([k, n, h]) => { MODELES[k] = gabarit(G.craqueleurs, n, h, 'y'); });
  versToon(G.wabbits, { normales: 0.01, sansContour: SC_MONSTRES }); /* Phase 2, palier 1 (blender/wabbits.py) */
  [['wabbit', 'Wabbit', 1.35], ['wabbitNoir', 'WabbitNoir', 1.45], ['wabbitSquelette', 'WabbitSquelette', 1.45], ['woWabbit', 'WoWabbit', 1.8], ['wabbitSorciere', 'WabbitSorciere', 1.75], ['gwandWabbit', 'GwandWabbit', 2.3], ['waWabbit', 'WaWabbit', 2.7]].forEach(([k, n, h]) => { MODELES[k] = gabarit(G.wabbits, n, h, 'y'); });
  versToon(G.koalaks, { normales: 0.01, sansContour: SC_MONSTRES }); versToon(G.koulosse, { normales: 0.01, sansContour: SC_MONSTRES }); /* Phase 2, palier 2 (blender/koalaks.py, koulosse.py) */
  [['koalakImmature', 'KoalakImmature', 1.25], ['koalakForestier', 'KoalakForestier', 1.7], ['koalakFossoyeur', 'KoalakFossoyeur', 1.6], ['guerrierKoalak', 'GuerrierKoalak', 2.0], ['koalakFarouche', 'KoalakFarouche', 1.6],
    ['mamaKoalak', 'MamaKoalak', 1.75], ['maitreKoalak', 'MaitreKoalak', 1.7], ['dokAlako', 'DokAlako', 1.75], ['momieKoalak', 'MomieKoalak', 1.65], ['koalakGriotte', 'KoalakGriotte', 1.6], ['koalakReinette', 'KoalakReinette', 1.6],
    ['koalakIndigo', 'KoalakIndigo', 1.6], ['koalakCoco', 'KoalakCoco', 1.6], ['drakoalak', 'Drakoalak', 2.6], ['chevaucheurKoalak', 'ChevaucheurKoalak', 2.6]].forEach(([k, n, h]) => { MODELES[k] = gabarit(G.koalaks, n, h, 'y'); });
  MODELES.koulosse = gabarit(G.koulosse, 'Koulosse', 4.2, 'y');
  /* LE PALIER 8, le Repaire du Dragon Cochon (20/10/2026, blender/palier8.py et dragon-cochon.py) : des modeles a pivots (hanches, genoux, epaules, ailes,
     queue, anneaux de la larve) qui ne se soudent pas au corps ; cloner les relie sur chaque copie, le combat les anime (animerPattes) */
  [G.palier8, G['dragon-cochon']].forEach((sc) => { sc.traverse((o) => { if (PIVOT_P8.test(o.name)) o.userData.articule = true; }); versToon(sc, { normales: 0.01, sansContour: SC_P8 }); });
  [['cochonFarle', 'CochonFarle', 1.1], ['sanglier', 'Sanglier', 1.7], ['sanglierFouisseur', 'SanglierFouisseur', 1.7], ['donDorgan', 'DonDorgan', 2.3], ['donDussAng', 'DonDussAng', 2.3], ['gorgouille', 'Gorgouille', 2.8], ['porsalu', 'Porsalu', 2.0]].forEach(([k, n, ht]) => { MODELES[k] = gabarit(G.palier8, n, ht, 'y'); MODELES[k].userData.pivots = true; });
  MODELES.dragonCochon = gabarit(G['dragon-cochon'], 'DragonCochon', 4.0, 'y'); MODELES.dragonCochon.userData.pivots = true;
  [['dragBlanc', 'DragBlanc', 1.6], ['dragNoir', 'DragNoir', 2.0], ['dragArdoise', 'DragArdoise', 1.8], ['dragDore', 'DragDore', 1.9], ['crocabulia', 'Crocabulia', 4.2]].forEach(([k, n, h]) => { MODELES[k] = gabarit(G.dragoeufs, n, h, 'y'); });
  try { const sc = await chargerGlb('assets/modeles/jeu/sortie-vsa.glb?v=' + VERSION_MODELES); versToon(sc, { normales: 0.012, sansContour: SC_BATI }); MODELES.caleche = sc.getObjectByName('SortieCaleche'); } catch (err) { /* pas encore de modele */ }
  await chargerPersonnagesVsa();
  ['iop3', 'osa', 'cra'].forEach((f) => { MODELES[f] = versToon(G[f], { echelle: 0.025, sansContour: SC_PERSO }); articuler(MODELES[f]); MODELES[f].scale.setScalar(0.5); });
}
/* terre plus sombre quand le champ est arrose */
const MOUILLE = new Map();
function terreMouillee(m) { if (!MOUILLE.has(m.uuid)) { const n = m.clone(); n.color.multiplyScalar(0.62); MOUILLE.set(m.uuid, n); } return MOUILLE.get(m.uuid); }

