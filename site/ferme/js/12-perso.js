'use strict';
/* ---------- le perso elargi et habille (12/10/2026, valide sur design-perso-equipe.html) ----------
   « est-ce qu'on peut elargir un peu les personnages ? », « le Iop un peu plus baraque » : le corps s'elargit (la tete garde sa forme), cuit dans
   la geometrie des pieces (une echelle de groupe aurait deforme les bras et les jambes qui tournent) ; l'epee, l'arc, le carquois et la queue
   sont deplaces sans etre epaissis. Puis la coiffe et la cape portees : la coiffe calee sur le crane (le chapeau de paille et les cornes de
   l'Osamodas s'effacent), la cape enroulee autour du dos, l'arme portee par-dessus. */
const LARGEUR_PERSO = { iop: [1, 1], 'iop-berserker-a': [1.55, 1.28], 'iop-berserker-b': [1.55, 1.28], 'iop-berserker-c': [1.55, 1.28], cra: [1.25, 1.12], osa: [1, 1], 'feminin-iop': [1, 1], 'feminin-cra': [1.15, 1.06], 'feminin-osa': [1, 1] }; /* (l'Osa puis le Iop refaits le 23/10/2026 a leurs propres proportions : on ne les elargit plus, leurs bras se decollaient du corps ; les looks berserker gardent l'ancien gabarit, elargi) */ /* (les versions feminines un peu moins elargies, comme sur la planche) */
const P_CHAPEAU = /^(cone|paille|chapeau)/, P_RIGIDE = /^(lame|gorge|garde|poignee|pommeau|pointe|sangle|carquois|fleche|empennage|arc|corde|bout_arc|queue|fouet|fleche_queue)/, /* (la sangle tient l'epee : elle bouge avec elle, sans s'etirer) */
  P_ARME_DOS = /^(lame|gorge|garde|poignee|pommeau|pointe|sangle|carquois|fleche|empennage)/, P_DOS = /^(lame|gorge|garde|poignee|pommeau|pointe|sangle|carquois|fleche|empennage|arc|corde|bout_arc|queue|fouet|baudrier|cape|col|barbe|moustache|tresse|anneau_barbe|criniere|favoris|meche_folle)/, /* (la barbe et les cheveux longs ne comptent pas dans le torse) */
  P_SAILLIE = /^(nasal|corne|anneau_corne|queue|crin|cristal|lueur|plume|feuille|museau|couvre_nuque|garde_joue|crete|dent|oreille|cawotte|cercle|noeud|embleme|gemme|clou|orbite|arcade|fente|visiere|touffe|couronne_pointe|couronne_boule|sillon|couture|roc)/, EP_CAPE = 0.16;
const P_PEND = /^(dread|dread_bout|anneau_dread)$/; /* ce qui pend sous une coiffe (les dreadlocks du Boufcoul) : hors des mesures et du calage (19/10/2026) */
const nomP = (o) => ((o && o.name) || '').replace(/\.?\d+$/, '').replace(/_\d+$/, '');
const boiteDe = (o) => new T.Box3().setFromObject(o), unionDe = (L) => { const b = new T.Box3(); L.forEach((o) => b.union(boiteDe(o))); return b; };
function elargirPerso(g, classe) {
  const [sx, sz] = LARGEUR_PERSO[classe] || [1, 1]; if (sx === 1 && sz === 1) return;
  g.updateMatrixWorld(true);
  const tete = g.getObjectByName('tete'), dans = (o, r) => { for (let x = o; x; x = x.parent) if (x === r) return true; return false; };
  const avant = new Map(); g.traverse((m) => { if (m.isMesh) avant.set(m, m.matrixWorld.clone()); });
  const pivots = []; g.traverse((o) => { if (/^pivot_/.test(o.name)) pivots.push(o); }); /* les bras et les jambes s'ecartent */
  const cibles = pivots.map((o) => { const w = o.getWorldPosition(new T.Vector3()); return new T.Vector3(w.x * sx, w.y, w.z * sz); });
  pivots.forEach((o, i) => { o.parent.updateMatrixWorld(true); o.position.copy(o.parent.worldToLocal(cibles[i].clone())); o.updateMatrixWorld(true); });
  g.updateMatrixWorld(true);
  const S = new T.Matrix4().makeScale(sx, 1, sz);
  /* « le manche de l'epee, il y a un souci » (Mathieu, 12/10/2026) : chaque morceau etait deplace selon son propre centre, la lame et la garde se
     separaient. Les morceaux qui se touchent (l'epee, le carquois et ses fleches, l'arc, la queue) forment un seul objet, deplace d'un bloc */
  const rig = []; g.traverse((m) => { if (m.isMesh && P_RIGIDE.test(nomP(m)) && !(tete && dans(m, tete)) && !(m.material && m.material.side === T.BackSide && m.parent && m.parent.isMesh)) rig.push({ m, b: new T.Box3().setFromBufferAttribute(m.geometry.attributes.position).applyMatrix4(avant.get(m)) }); });
  const grp = rig.map((_, i) => i), chef = (i) => (grp[i] === i ? i : (grp[i] = chef(grp[i])));
  for (let i = 0; i < rig.length; i++) for (let j = i + 1; j < rig.length; j++) if (rig[i].b.clone().expandByScalar(0.06).intersectsBox(rig[j].b)) grp[chef(i)] = chef(j);
  const blocs = {}; rig.forEach((r, i) => { const k = chef(i); (blocs[k] = blocs[k] || new T.Box3()).union(r.b); });
  const centreBloc = new Map(rig.map((r, i) => [r.m, blocs[chef(i)].getCenter(new T.Vector3())]));
  g.traverse((m) => {
    if (!m.isMesh || (tete && dans(m, tete)) || (m.material && m.material.side === T.BackSide && m.parent && m.parent.isMesh)) return;
    const old = m.geometry, A = avant.get(m); let W;
    if (centreBloc.has(m)) { const c = centreBloc.get(m); W = new T.Matrix4().makeTranslation(c.x * (sx - 1), 0, c.z * (sz - 1)).multiply(A); }
    else if (nomP(m) === 'botte') W = new T.Matrix4().makeScale(sx, 1, 0.92).multiply(A); /* « les pieds sont pas un peu longs ? » (Mathieu, 12/10/2026) : la botte s'elargit, mais ne s'allonge plus vers l'avant (un peu plus courte que le modele, meme) */
    else W = S.clone().multiply(A);
    const geo = old.clone().applyMatrix4(new T.Matrix4().copy(m.matrixWorld).invert().multiply(W));
    m.children.forEach((k) => { if (k.isMesh && k.geometry === old) k.geometry = geo; }); m.geometry = geo;
  });
}
/* les modeles des pieces portees (charges seulement quand une coiffe ou une cape est portee) */
const VISUELS = {}; let visuelsPromesse = null;
const assurerVisuels = () => visuelsPromesse || (visuelsPromesse = Promise.all(['equipements', 'coiffes-legendaires', 'equipements-wabbit', 'equipements-boufcoul', 'equipements-cochon'].map((f) => chargerGlb('assets/modeles/jeu/' + f + '.glb?v=' + VERSION_MODELES).then((sc) => { VISUELS[f] = versToon(sc, { normales: 0.012, sansContour: SC_BATI }); })))
  .then(() => true).catch(() => { visuelsPromesse = null; return false; }));
const visuelsPrets = () => !!VISUELS.equipements;
const NOEUD_LEG = { royal: 'Coiffe_Royal', chafer: 'Coiffe_Chafer', bworker: 'Coiffe_Bworker', craq: 'Coiffe_Craq', croc: 'Coiffe_Croc', wa: 'Coiffe_WaWabbit', cochon: 'Coiffe_DragonCochon' };
const FICHIER_PANO = { wabbit: 'equipements-wabbit', boufcoul: 'equipements-boufcoul', dragoncochon: 'equipements-cochon' }; /* (les autres : equipements) */
function noeudVisuel(id) {
  const o0 = obj(id); if (!o0 || !visuelsPrets()) return null; const o = o0.base ? OBJETS[o0.base] : o0;
  if (o.leg) { const L = LEGENDAIRES.find((x) => x.cle === o.leg), F = VISUELS[(L && L.fichier) || 'coiffes-legendaires']; return o.emp === 'coiffe' && F ? F.getObjectByName(NOEUD_LEG[o.leg]) || null : null; } /* (le Heaume du Dragon Cochon : dans equipements-cochon) */
  const P = PANOS[o.pano] && PANOS[o.pano].id; if (!P) return null;
  return VISUELS[FICHIER_PANO[P] || 'equipements'].getObjectByName('Obj_' + P + '_' + o.emp) || null;
}
function porterCapeSur(eq, cape, o) { /* la cape du modele (nappe autour de l'axe vertical, rayon 0,3 a 0,62, angle -1,25 a 1,25) enroulee autour du torse, relief garde */
  const r = cape.clone(true); r.position.set(0, 0, 0); r.rotation.set(0, 0, 0); r.scale.set(1, 1, 1); r.updateMatrixWorld(true);
  const inv = new T.Matrix4().copy(r.matrixWorld).invert(), pieces = []; r.traverse((m) => { if (m.isMesh && !(m.material && m.material.side === T.BackSide)) pieces.push(m); });
  const geos = pieces.map((m) => m.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inv, m.matrixWorld)));
  let sz = 0; geos.forEach((g) => { const P = g.attributes.position; for (let i = 0; i < P.count; i++) sz += P.getZ(i); }); const sgn = sz < 0 ? -1 : 1;
  geos.forEach((g, n) => { const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i) * sgn, t = Math.min(1, Math.max(0, (1.45 - y) / 1.35)), a = Math.atan2(x, z) * (0.62 + 0.18 * t), off = (Math.hypot(x, z) - (0.3 + 0.32 * t)) * o.k;
      P.setXYZ(i, o.cx + Math.sin(a) * (o.rx + o.fl * t + off), o.haut0 - (1.45 - y) * o.k, o.cz - o.avant * Math.cos(a) * (o.rz + o.fl * 0.6 * t + off)); }
    P.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();
    const m = pieces[n]; m.children.forEach((k) => { if (k.isMesh && k.material && k.material.side === T.BackSide) k.geometry = g; });
    m.geometry = g; if (m.material && m.material.isMeshToonMaterial) { m.material = m.material.clone(); m.material.side = T.DoubleSide; }
    m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.scale.set(1, 1, 1); eq.add(m); });
}
function habillerPerso(g) { habillerTenue(g); try { armerPerso(g); } catch (err) { console.warn('arme', err); } }
/* L'ARME LEGENDAIRE PORTEE (14/10/2026, « check comment elles apparaissent sur le joueur », Mathieu) : elle prend la place exacte de l'arme du modele, qu'on cache.
   Iop : l'epee dans le dos, du pommeau a la pointe ; Cra : l'arc le long du flanc, d'un bout a l'autre, le ventre du meme cote ; Osamodas : le manche legendaire
   a la place du manche, et le fouet enroule a la hanche repeint aux couleurs de sa laniere (deroulee, elle depasserait de partout) */
function armerPerso(g) {
  const o = S_ && S_.equip && obj(S_.equip.arme), F = o && VISUELS[o.fichier || 'equipements-wabbit'], V = o && o.visuel && F && F.getObjectByName(o.visuel), K = (o && o.cale) || {}; if (!V) return;
  g.updateMatrixWorld(true);
  const pieces = []; g.traverse((m) => { if (m.isMesh && !(m.parent && m.parent.isMesh)) pieces.push(m); });
  const de = (re) => pieces.filter((m) => re.test(nomP(m))), centre = (L) => unionDe(L).getCenter(new T.Vector3());
  const modele = V.clone(true); modele.position.set(0, 0, 0); modele.rotation.set(0, 0, 0); modele.scale.set(1, 1, 1);
  /* le point m0 du modele va en p0 ; son axe a0 suit a1, son axe b0 suit b1 (rendus perpendiculaires) ; a l'echelle k */
  const caler = (m0, a0, b0, p0, a1, b1, k) => {
    const base = (a, b) => { const A = a.clone().normalize(), B = b.clone().sub(A.clone().multiplyScalar(b.dot(A))).normalize(); return new T.Matrix4().makeBasis(A, B, new T.Vector3().crossVectors(A, B)); };
    const M = new T.Matrix4().makeTranslation(p0.x, p0.y, p0.z).multiply(base(a1, b1)).multiply(base(a0, b0).transpose()).multiply(new T.Matrix4().makeScale(k, k, k)).multiply(new T.Matrix4().makeTranslation(-m0.x, -m0.y, -m0.z));
    const e = new T.Group(); e.name = 'arme_legendaire'; e.add(modele); M.decompose(e.position, e.quaternion, e.scale); return e;
  };
  let e = null, caches = [];
  if (o.type === 'epee') { /* le modele : pommeau en y 0,06, pointe en y 1,57, lame a plat dans le plan xy */
    const L = de(/^(lame|gorge|garde|garde_g|garde_d|poignee|pommeau)$/), pom = L.find((m) => nomP(m) === 'pommeau'); if (!pom) return;
    const p0 = centre([pom]), tip = p0.clone(), v = new T.Vector3(); let dmax = 0;
    L.filter((m) => nomP(m) === 'lame').forEach((m) => { const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); const d = v.distanceTo(p0); if (d > dmax) { dmax = d; tip.copy(v); } } });
    const a1 = tip.clone().sub(p0); e = caler(new T.Vector3(0, K.y0 || 0.06, 0), new T.Vector3(0, 1, 0), new T.Vector3(1, 0, 0), p0, a1, new T.Vector3(a1.y, -a1.x, 0), dmax / (K.L || 1.51)); caches = L;
  } else if (o.type === 'arc') { /* le modele : la corde de y 0,05 a 1,65, le ventre de l'arc vers +x. Porte dans le dos, en travers du carquois (« l'arc est pas tres
       bien mis pour le Cra, place-le dans son dos », Mathieu, 14/10/2026) : la corde contre le dos, le ventre vers l'arriere */
    const L = de(/^(arc|corde_arc|bout_arc|poignee_arc)$/), bouts = L.filter((m) => nomP(m) === 'bout_arc').map((m) => centre([m])).sort((p, q) => p.y - q.y), carq = de(/^(carquois|carquois_bord|carquois_fond)$/);
    if (bouts.length < 2 || !carq.length) return;
    const bq = unionDe(carq), cq = bq.getCenter(new T.Vector3()), dos = Math.sign(cq.z) || -1, haut = de(/^carquois_bord$/), bas = de(/^carquois_fond$/);
    const axeQ = haut.length && bas.length ? centre(haut).sub(centre(bas)) : new T.Vector3(1, 1, 0), axe = new T.Vector3(-axeQ.x, axeQ.y, 0); /* en croix avec le carquois */
    const p0 = new T.Vector3(cq.x * 0.4, cq.y + 0.05, (dos < 0 ? bq.min.z : bq.max.z) + dos * 0.06);
    e = caler(new T.Vector3(0, K.mil || 0.85, 0), new T.Vector3(0, 1, 0), new T.Vector3(1, 0, 0), p0, axe, new T.Vector3(0, 0, dos), bouts[0].distanceTo(bouts[1]) * 1.15 / (K.L || 1.6)); caches = L;
  } else if (o.type === 'fouet') { /* le modele : pommeau en y 0,05, le haut du manche (coussin) en y 0,62 ; on garde le manche, sans laniere */
    const manche = de(/^manche_fouet$/), pom = de(/^pommeau_fouet$/); if (!manche.length || !pom.length) return;
    const cols = []; V.traverse((m) => { if (m.isMesh && nomP(m) === (K.laniere || 'laniere') && m.material && m.material.color && !cols.some((c) => c.equals(m.material.color))) cols.push(m.material.color.clone()); });
    let or = null; V.traverse((m) => { if (!or && m.isMesh && nomP(m) === 'manche' && m.material && m.material.color) or = m.material.color.clone(); });
    const ret = []; modele.traverse((m) => { if (m.isMesh && (K.retirer || /^(laniere|cawotte|sillon|fane)$/).test(nomP(m))) ret.push(m); }); ret.forEach((m) => m.parent && m.parent.remove(m));
    const p0 = centre(pom), axe = centre(manche).sub(p0);
    e = caler(new T.Vector3(0, K.y0 || 0.05, 0), new T.Vector3(0, 1, 0), new T.Vector3(0, 0, 1), p0, axe, new T.Vector3(0, 0, 1), axe.length() * 2 / (K.L || 0.57)); caches = manche.concat(pom);
    de(/^fouet$/).forEach((m, n) => { if (!cols.length) return; m.material = m.material.clone(); m.material.color.copy(cols[n % cols.length]); });
    de(/^meche_fouet$/).forEach((m) => { if (!or) return; m.material = m.material.clone(); m.material.color.copy(or); });
  }
  if (!e) return;
  caches.forEach((m) => { m.visible = false; });
  e.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
  g.add(e);
}
/* L'EPEE EN MAIN PENDANT LES COMBATS (23/10/2026, « le Iop quand il combat il faudrait qu'il ait son épée dans la main, ça a pas de sens qu'elle reste
   dans son dos », Mathieu) : les morceaux de l'epee (et l'arme legendaire posee par-dessus) passent d'un bloc dans la main droite, la poignee dans le
   poing, la lame vers l'avant ; ils suivent alors le bras qui frappe. A la fin du combat, ils reviennent exactement ou ils etaient, dans le dos. */
const P_EPEE = /^(lame|gorge|garde|garde_g|garde_d|poignee|pommeau)$/, AXE_EPEE_MAIN = new T.Vector3(0, 1.5, 1).normalize(); /* (au repos, la lame pointe vers l'avant et vers le haut, en garde) */
function epeeEnMain(g, oui) {
  const u = g.userData; if (!!u.epeeMain === !!oui) return;
  if (!oui) { (u.epeeMain || []).forEach(({ m, parent, p, q, s }) => { parent.add(m); m.position.copy(p); m.quaternion.copy(q); m.scale.copy(s); }); u.epeeMain = null; return; }
  const bras = (u.membres || [])[3]; if (!bras) return;
  const rot0 = bras.rotation.clone(); bras.rotation.set(0, 0, 0); g.updateMatrixWorld(true); /* (le calcul se fait bras au repos : sinon le balancement de la marche restait fige dans l'epee) */
  try { prendreEpee(g, bras); } finally { bras.rotation.copy(rot0); g.updateMatrixWorld(true); }
}
function prendreEpee(g, bras) {
  const u = g.userData;
  const tete = g.getObjectByName('tete'), sous = (o, r) => { for (let x = o; x; x = x.parent) if (x === r) return true; return false; };
  const L = []; g.traverse((m) => { if (m.isMesh && !(m.parent && m.parent.isMesh) && P_EPEE.test(nomP(m)) && !(tete && sous(m, tete)) && !sous(m, bras)) L.push(m); });
  const pom = L.find((m) => nomP(m) === 'pommeau'), poi = L.find((m) => nomP(m) === 'poignee'); if (!pom || !poi) return;
  const p0 = boiteDe(pom).getCenter(new T.Vector3()), prise = boiteDe(poi).getCenter(new T.Vector3()), tip = p0.clone(), v = new T.Vector3(); let dmax = 0;
  L.filter((m) => nomP(m) === 'lame').forEach((m) => { const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); const d = v.distanceTo(p0); if (d > dmax) { dmax = d; tip.copy(v); } } });
  const gG = L.find((m) => nomP(m) === 'garde_g'), gD = L.find((m) => nomP(m) === 'garde_d');
  const a = tip.clone().sub(p0).normalize(), b = gG && gD ? boiteDe(gD).getCenter(new T.Vector3()).sub(boiteDe(gG).getCenter(new T.Vector3())) : new T.Vector3(1, 0, 0);
  const paume = []; bras.traverse((m) => { if (m.isMesh && /^(paume|doigts|main)$/.test(nomP(m))) paume.push(m); }); const main = paume.length ? unionDe(paume).getCenter(new T.Vector3()) : bras.localToWorld(new T.Vector3(0, -0.5, 0));
  const rot = new T.Matrix4().extractRotation(g.matrixWorld), A1 = AXE_EPEE_MAIN.clone().applyMatrix4(rot), B1 = new T.Vector3(1, 0, 0).applyMatrix4(rot); /* (la lame vers l'avant et un peu vers le haut, la garde en travers) */
  const base = (x, y) => { const X = x.clone().normalize(), Y = y.clone().sub(X.clone().multiplyScalar(y.dot(X))).normalize(); return new T.Matrix4().makeBasis(X, Y, new T.Vector3().crossVectors(X, Y)); };
  const M = new T.Matrix4().makeTranslation(main.x, main.y, main.z).multiply(base(A1, B1)).multiply(base(a, b).transpose()).multiply(new T.Matrix4().makeTranslation(-prise.x, -prise.y, -prise.z));
  const leg = g.getObjectByName('arme_legendaire'); if (leg) L.push(leg);
  const inv = new T.Matrix4().copy(bras.matrixWorld).invert();
  u.epeeMain = L.map((m) => { const r = { m, parent: m.parent, p: m.position.clone(), q: m.quaternion.clone(), s: m.scale.clone() };
    new T.Matrix4().multiplyMatrices(inv, new T.Matrix4().multiplyMatrices(M, m.matrixWorld)).decompose(m.position, m.quaternion, m.scale); bras.add(m); return r; });
}
function tenirEpee() { if (!paysanMesh) return; if (classeDe() === 'iop') epeeEnMain(paysanMesh, !!combat); else if (classeDe() === 'osa') fouetEnMain(paysanMesh, !!combat); } /* (a chaque image : en combat dans la main, sinon dans le dos ou a la ceinture) */
/* LE FOUET EN MAIN PENDANT LES COMBATS (23/10/2026, « l'arme dans la main », Mathieu) : comme l'epee du Iop, le fouet enroule de l'Osamodas (et le manche
   legendaire pose dessus) passe d'un bloc dans sa main droite, le manche dans le poing, le pommeau en haut, les boucles qui pendent devant ; la laniere
   du coup part alors du bout du manche (mainDe, 22b-effets.js). A la fin du combat, il revient a la ceinture. */
const P_FOUET = /^(fouet|manche_fouet|pommeau_fouet|bague_fouet|meche_fouet|bout_fouet)$/, AXE_FOUET_MAIN = new T.Vector3(0, -0.55, 1).normalize(); /* (du pommeau vers le bas du manche : vers l'avant et un peu vers le bas) */
function fouetEnMain(g, oui) {
  const u = g.userData; if (!!u.fouetMain === !!oui) return;
  if (!oui) { (u.fouetMain || []).forEach(({ m, parent, p, q, s }) => { parent.add(m); m.position.copy(p); m.quaternion.copy(q); m.scale.copy(s); }); u.fouetMain = null; return; }
  const bras = (u.membres || [])[3]; if (!bras) return;
  const rot0 = bras.rotation.clone(); bras.rotation.set(0, 0, 0); g.updateMatrixWorld(true);
  try { prendreFouet(g, bras); } finally { bras.rotation.copy(rot0); g.updateMatrixWorld(true); }
}
function prendreFouet(g, bras) {
  const u = g.userData, sous = (o, r) => { for (let x = o; x; x = x.parent) if (x === r) return true; return false; };
  const L = []; g.traverse((m) => { if (m.isMesh && !(m.parent && m.parent.isMesh) && P_FOUET.test(nomP(m)) && !sous(m, bras)) L.push(m); });
  const man = L.filter((m) => nomP(m) === 'manche_fouet'), pom = L.find((m) => nomP(m) === 'pommeau_fouet'), bag = L.find((m) => nomP(m) === 'bague_fouet'); if (!man.length || !pom || !bag) return;
  const haut = boiteDe(pom).getCenter(new T.Vector3()), bas = boiteDe(bag).getCenter(new T.Vector3()), prise = haut.clone().lerp(bas, 0.45);
  const a = bas.clone().sub(haut).normalize(), b = new T.Vector3(0, 0, 1).applyMatrix4(new T.Matrix4().extractRotation(g.matrixWorld)); /* (b : l'avant du perso, pour fixer la rotation autour du manche) */
  const paume = []; bras.traverse((m) => { if (m.isMesh && /^(paume|doigts|main)$/.test(nomP(m))) paume.push(m); }); const main = paume.length ? unionDe(paume).getCenter(new T.Vector3()) : bras.localToWorld(new T.Vector3(0, -0.5, 0));
  const rot = new T.Matrix4().extractRotation(g.matrixWorld), A1 = AXE_FOUET_MAIN.clone().applyMatrix4(rot), B1 = new T.Vector3(1, 0, 0).applyMatrix4(rot);
  const base = (x, y) => { const X = x.clone().normalize(), Y = y.clone().sub(X.clone().multiplyScalar(y.dot(X))).normalize(); return new T.Matrix4().makeBasis(X, Y, new T.Vector3().crossVectors(X, Y)); };
  const B0 = new T.Vector3().crossVectors(a, b).lengthSq() > 1e-4 ? new T.Vector3().crossVectors(a, b) : new T.Vector3(1, 0, 0);
  const M = new T.Matrix4().makeTranslation(main.x, main.y, main.z).multiply(base(A1, B1)).multiply(base(a, B0).transpose()).multiply(new T.Matrix4().makeTranslation(-prise.x, -prise.y, -prise.z));
  const leg = g.getObjectByName('arme_legendaire'); if (leg) L.push(leg);
  const inv = new T.Matrix4().copy(bras.matrixWorld).invert();
  u.fouetMain = L.map((m) => { const r = { m, parent: m.parent, p: m.position.clone(), q: m.quaternion.clone(), s: m.scale.clone() };
    new T.Matrix4().multiplyMatrices(inv, new T.Matrix4().multiplyMatrices(M, m.matrixWorld)).decompose(m.position, m.quaternion, m.scale); bras.add(m); return r; });
  u.boutFouet = bag; /* (la laniere du coup part d'ici) */
}
function habillerTenue(g) {
  const idC = S_ && S_.equip && S_.equip.coiffe, idK = S_ && S_.equip && S_.equip.cape, coiffe = idC && noeudVisuel(idC), cape = idK && noeudVisuel(idK);
  if (!coiffe && !cape) return;
  g.updateMatrixWorld(true);
  const pieces = []; g.traverse((o) => { if (o.isMesh && !(o.parent && o.parent.isMesh)) pieces.push(o); });
  const chapeau = pieces.filter((o) => P_CHAPEAU.test(nomP(o))), corpsP = pieces.filter((o) => !P_CHAPEAU.test(nomP(o)));
  const teteN = g.getObjectByName('tete'); if (!teteN) return;
  const sousTete = []; teteN.traverse((o) => { if (o.isMesh && !(o.parent && o.parent.isMesh) && !P_CHAPEAU.test(nomP(o))) sousTete.push(o); }); const craneP = sousTete.filter((o) => /^(crane|cheveux|meches)/.test(nomP(o)));
  /* la tete mesuree sans ce qui pend sous le crane : les longues meches de l'Osa feminine (23/10/2026) faisaient croire a une tete jusqu'au milieu du dos,
     et les coiffes tombaient sur son visage (« bizarre les coiffes sur la femme, limite on voit plus son visage », Mathieu) */
  const bt = unionDe(craneP.length ? craneP : sousTete.length ? sousTete : [teteN]), crP = craneP.filter((o) => /^crane/.test(nomP(o))); if (crP.length) bt.min.y = Math.max(bt.min.y, unionDe(crP).min.y);
  const ct = bt.getCenter(new T.Vector3()), st = bt.getSize(new T.Vector3());
  const corps = unionDe(corpsP), sc = corps.getSize(new T.Vector3());
  const bouche = g.getObjectByName('bouche'), avant = bouche ? Math.sign(boiteDe(bouche).getCenter(new T.Vector3()).z - ct.z) || 1 : 1;
  const torse = corpsP.filter((o) => { if (P_DOS.test(nomP(o))) return false; const c = boiteDe(o).getCenter(new T.Vector3()); return c.y < bt.min.y && c.y > bt.min.y - sc.y * 0.3 && Math.abs(c.x - ct.x) < sc.x * 0.22; });
  const bTorse = unionDe(torse.length ? torse : corpsP), dos = avant > 0 ? bTorse.min.z : bTorse.max.z;
  const eq = new T.Group(); eq.name = 'equipement_porte'; g.add(eq);
  if (coiffe) {
    chapeau.concat(corpsP.filter((o) => /^(corne|anneau_corne)/.test(nomP(o)))).forEach((o) => { o.visible = false; });
    const c = coiffe.clone(true); c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); c.scale.set(1, 1, 1); c.updateMatrixWorld(true);
    const pc = []; c.traverse((m) => { if (m.isMesh && !(m.parent && m.parent.isMesh)) pc.push(m); });
    { /* le crane du Chafer : sa machoire et ses dents pendaient si bas sous le bord qu'elles tombaient sur les yeux, quelle que soit la hauteur du casque.
         Portees, elles remontent juste sous le bord (« genre la pour toi c'est corrige ca ? », Mathieu, 15/10/2026) */
      const bordP = pc.find((m) => /^bord$/.test(nomP(m))), bB = bordP && boiteDe(bordP);
      const pend = bB ? pc.filter((m) => /^(os|dent)$/.test(nomP(m)) && boiteDe(m).max.y < bB.max.y + 0.1 && boiteDe(m).min.y < bB.min.y - 0.1) : [];
      if (pend.length) { const dy = bB.min.y - 0.09 - Math.min(...pend.map((m) => boiteDe(m).min.y)); pend.forEach((m) => { m.position.y += dy; }); c.updateMatrixWorld(true); }
    }
    const pcH = pc.filter((m) => !P_PEND.test(nomP(m))), B0 = pcH.length ? unionDe(pcH) : boiteDe(c), h0 = B0.max.y - B0.min.y || 1; /* (sans ce qui pend dessous) */
    const corpsC = pcH.filter((m) => !P_SAILLIE.test(nomP(m))), bas = corpsC.filter((m) => (boiteDe(m).min.y - B0.min.y) / h0 <= 0.35);
    const pied = (m) => { const z = boiteDe(m).getSize(new T.Vector3()); return z.x * z.z; }, rebord = bas.sort((a, b) => pied(b) - pied(a))[0];
    const r0 = rebord ? boiteDe(rebord).getSize(new T.Vector3()) : B0.getSize(new T.Vector3()), t0 = B0.getSize(new T.Vector3());
    let k = Math.max(st.x * 0.85 / Math.max(r0.x, r0.z), st.x * 1.12 / Math.max(t0.x, t0.z));
    /* « on dirait que j'ai une kippa » (Mathieu, 15/10/2026, Cra en coiffe Bouftou) : un bonnet rond (calotte, bonnet) se calait sur son bord, son dome ne
       couvrait que 80 % de la chevelure et se posait dessus comme une calotte de pretre. Le dome couvre maintenant toute la largeur du crane */
    const dome = corpsC.filter((m) => /^(calotte|bonnet|os)$/.test(nomP(m))).sort((a, b) => pied(b) - pied(a))[0]; /* (os : le casque-crane du Chafer, 15/10/2026 ; le plus large : sa machoire s'appelle os aussi, et le crane devenait deux fois trop gros) */
    if (dome) { const d0 = boiteDe(dome).getSize(new T.Vector3()); k = Math.max(k, st.x * 1.04 / Math.max(d0.x, d0.z)); }
    /* « en format bonnet c'est parfait, fais pareil avec les coiffes legendaires » (Mathieu, 15/10/2026) : couronnes, casques et coussin couvrent tout le crane */
    const oC = obj(idC), estLeg = !!(oC && (oC.base ? OBJETS[oC.base] : oC).leg); if (estLeg) k = Math.max(k, st.x * 1.04 / Math.max(r0.x, r0.z));
    c.scale.multiplyScalar(k); if (t0.y / Math.max(t0.x, t0.z) > 0.6) c.scale.y *= 0.7; if (avant < 0) c.rotation.y = Math.PI; c.updateMatrixWorld(true);
    const b1 = unionDe(corpsC.length ? corpsC : [c]), c1 = b1.getCenter(new T.Vector3()), h1 = b1.max.y - b1.min.y, machoire = pc.some((m) => /^museau/.test(nomP(m))),
      /* le bord de la coiffe se pose juste au-dessus des sourcils (ils s'arretent a 55 % de la tete, sur les quatre persos) ; une coiffe trop basse pour couvrir
         le dessus de la chevelure ne remonte plus (elle laissait une bande de cheveux entre elle et le visage : « genre la tu trouves que c'est corrige ? »,
         Mathieu, 15/10/2026), c'est la chevelure qui s'aplatit dessous. Un casque a machoire (Crocabulia) s'arrete un peu plus haut, pour laisser les yeux */
      bas0 = bt.min.y + st.y * (machoire ? 0.62 : 0.56),
      /* le nasal d'un casque (Bworker) ne compte pas : il pend sur le nez, il ne doit pas soulever le casque ; bord0 : le bas du bord visible de la coiffe */
      dents = pc.filter((m) => /^dent$/.test(nomP(m))), basC = dents.length ? Math.min(b1.min.y, unionDe(dents).min.y) : b1.min.y, /* (les dents du crane du Chafer restent sur le front, pas sur les yeux) */
      decal = bas0 - basC, sommet = b1.max.y + decal, bord0 = (rebord ? boiteDe(rebord).min.y : b1.min.y) + decal;
    c.position.add(new T.Vector3(ct.x - c1.x, decal, ct.z - c1.z)); eq.add(c);
    { const pend = pc.filter((m) => P_PEND.test(nomP(m))); /* ce qui pend (les dreadlocks du Boufcoul) s'arrete sur la nuque, pas aux pieds (19/10/2026) */
      if (pend.length) { c.updateMatrixWorld(true); const bP = unionDe(pend), haut = Math.min(bord0, bP.max.y), limite = bt.min.y - st.y * 0.08;
        if (bP.min.y < limite && haut > limite) { const f = (haut - limite) / Math.max(0.01, haut - bP.min.y), v = new T.Vector3();
          pend.forEach((m) => { const M = m.matrixWorld.clone(), Mi = M.clone().invert(), g0 = m.geometry, geo = g0.clone(), P = geo.attributes.position;
            for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(M); if (v.y < haut) v.y = haut - (haut - v.y) * f; v.applyMatrix4(Mi); P.setXYZ(i, v.x, v.y, v.z); }
            P.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere(); m.children.forEach((k) => { if (k.isMesh && k.geometry === g0) k.geometry = geo; }); m.geometry = geo; }); } } }
    if (estLeg || pc.some((m) => /^(calotte|bonnet|coussin|casque|os|crane|fond)$/.test(nomP(m)))) { /* sous une coiffe fermee (ou une couronne), le dessus de la chevelure s'aplatit jusque sous son sommet ;
      « on dirait qu'il a des trous dans les cheveux » (Mathieu, 12/10/2026) : avant, toute la chevelure retrecissait et decouvrait le crane entre les meches */
      const couronne = estLeg && /^(royal|craq)$/.test((oC.base ? OBJETS[oC.base] : oC).leg); /* (les couronnes du Bouftou Royal et du Craqueleur sont ouvertes : la chevelure en remplit l'interieur, sinon on voyait le crane chauve entre les cristaux) */
      if (couronne) { /* le modele n'a pas de cheveux sur le dessus du crane (il porte son chapeau de paille) : dans une couronne ouverte, on voyait le crane nu.
        Une calotte de cheveux, de la couleur de sa chevelure, garnit l'interieur de la couronne */
        const mc = corpsP.find((o) => /^cheveux/.test(nomP(o)) && o.material), cr = craneP.filter((o) => /^crane/.test(nomP(o))), haut = (cr.length ? unionDe(cr).max.y : bt.max.y) + 0.05;
        if (mc) { const cap = new T.Mesh(new T.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), mc.material); cap.name = 'cheveux_couronne'; cap.scale.set(st.x * 0.5, Math.max(0.02, haut - bas0), st.z * 0.5); cap.position.set(ct.x, bas0, ct.z); eq.add(cap); }
      }
      const yp = Math.min(bt.min.y + st.y * 0.5, bord0), fy = couronne ? 0.78 : Math.max(0.2, Math.min(0.78, (sommet - 0.03 - yp) / Math.max(0.01, bt.max.y - yp)));
      corpsP.filter((o) => /^(cheveux|meches)/.test(nomP(o))).forEach((o) => { const g0 = o.geometry, /* (et la frange : elle ressortait par-dessus le casque du Chafer, 15/10/2026) */ M = o.matrixWorld.clone(), Mi = M.clone().invert(), P = g0.attributes.position, v = new T.Vector3(), geo = g0.clone(), Q = geo.attributes.position;
        for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(M);
          if (!couronne && v.y > bord0 + 0.01) { const f = 1 - 0.24 * Math.min(1, (v.y - bord0 - 0.01) / 0.06); /* (« le casque du Bworker est bien, mais les cheveux juste en dessous ca va pas » : ils se pincaient sous le bord, 15/10/2026) */ /* (a partir du BORD visible : partir du bas de la machoire du crane laissait une bande de front chauve, « genre la pour toi c'est corrige ca ? », Mathieu, 15/10/2026) */ v.x = ct.x + (v.x - ct.x) * f; v.z = ct.z + (v.z - ct.z) * f; } /* (15/10/2026 : au-dessus du bord de la coiffe, la chevelure rentre dessous ; elle traversait le casque du Chafer) */
          if (v.y > yp) v.y = yp + (v.y - yp) * fy; v.applyMatrix4(Mi); Q.setXYZ(i, v.x, v.y, v.z); }
        Q.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere(); o.children.forEach((k) => { if (k.isMesh && k.geometry === g0) k.geometry = geo; }); o.geometry = geo; });
    }
  }
  if (cape) {
    corpsP.filter((o) => /^(cape|col)$/.test(nomP(o))).forEach((o) => { o.visible = false; }); /* la petite cape du Cra disparait sous celle de la panoplie */
    const haut0 = bt.min.y + st.y * 0.04, haut = (haut0 - corps.min.y) * 0.72, LT = bTorse.getSize(new T.Vector3()).x, cz = (bTorse.min.z + bTorse.max.z) / 2;
    porterCapeSur(eq, cape, { cx: ct.x, cz, avant, haut0, k: haut / 1.35, rx: LT * 0.54, rz: (cz - dos) * avant + 0.03, fl: LT * 0.12 });
    const recul = corpsP.filter((o) => { if (!P_ARME_DOS.test(nomP(o))) return false; const z = boiteDe(o).getCenter(new T.Vector3()).z; return avant > 0 ? z < dos + 0.08 : z > dos - 0.08; }), bR = recul.length ? unionDe(recul) : null; /* l'arme collee au dos passe par-dessus la cape */
    if (bR && (avant > 0 ? bR.min.z > dos - EP_CAPE - 0.05 : bR.max.z < dos + EP_CAPE + 0.05)) recul.forEach((o) => { const a = o.parent.worldToLocal(new T.Vector3(0, 0, 0)), b = o.parent.worldToLocal(new T.Vector3(0, 0, -avant * (EP_CAPE + 0.04))); o.position.add(b.sub(a)); });
  }
  fusionner(eq); /* (une coiffe et une cape : quelques centaines de petites pieces, fusionnees par materiau pour la tablette) */
  eq.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
}
/* refaire le perso a sa place (apres un changement d'equipement, ou quand les modeles des pieces arrivent) */
function rhabiller() {
  if (!paysanMesh || !S_ || !S_.perso) return;
  const v = paysanMesh, n = paysan(v.position.x, v.position.y, v.position.z, S_.perso.classe);
  n.rotation.copy(v.rotation); n.position.copy(v.position); const { membres, genoux, haut } = n.userData; Object.assign(n.userData, v.userData, { membres, genoux, haut, hanche: undefined, paumes: undefined, epeeMain: null, fouetMain: null, boutFouet: null }); /* (ce qui pointe vers les pieces de l'ancien modele est recalcule) */
  scene.remove(v); paysanMesh = n; if (modaleOuverte === 'perso') ouvrirPerso();
}
function rafraichirTenue() { /* une coiffe ou une cape portee : on charge leurs modeles si besoin, puis on rhabille */
  const porte = S_ && S_.equip && (S_.equip.coiffe || S_.equip.cape || (obj(S_.equip.arme) || {}).visuel);
  if (porte && !visuelsPrets()) { assurerVisuels().then((ok) => { if (ok) rhabiller(); }); return; }
  rhabiller();
}
const sexeDe = () => (S_ && S_.perso && S_.perso.sexe === 'f' ? 'f' : 'm'); /* la version du perso : 'f' feminine (12/10/2026), masculine sinon */
const icoClasse = () => sexeDe() === 'f' ? 'feminin-' + classeDe() : classeDe() === 'iop' && S_ && S_.perso && S_.perso.look && S_.perso.look !== 'classique' ? 'iop-look-' + S_.perso.look : classeDe(); /* (l'icone du perso suit l'apparence choisie) */
const LOOKS_IOP = [['classique', 'Classique', 'iop3'], ['fourrure', 'Viking', 'iop-berserker-a'], ['cuirasse', 'Berserker', 'iop-berserker-b'], ['sauvage', 'Sauvage', 'iop-berserker-c']]; /* (les identifiants restent ceux des sauvegardes) */
const modeleDe = (classe, look, sexe = sexeDe()) => sexe === 'f' ? 'feminin-' + ({ osa: 'osa', cra: 'cra' }[classe] || 'iop') /* (la version feminine : une seule apparence par classe) */
  : classe === 'iop' ? (LOOKS_IOP.find((l) => l[0] === look) || LOOKS_IOP[0])[2] : ({ osa: 'osa', cra: 'cra' }[classe] || 'iop3');
const looksEnCours = {};
function assurerLook(m) { /* les apparences du Iop autres que la classique : chargees seulement quand on les choisit */
  if (MODELES[m]) return Promise.resolve(true);
  return looksEnCours[m] || (looksEnCours[m] = chargerGlb('assets/modeles/jeu/' + m + '.glb?v=' + VERSION_MODELES).then((sc) => { MODELES[m] = versToon(sc, { echelle: 0.025, sansContour: SC_PERSO }); articuler(MODELES[m]); MODELES[m].scale.setScalar(0.5); return true; })
    .catch(() => { delete looksEnCours[m]; return false; }));
}
function paysan(x, y, z, classe) {
  const mLook = modeleDe(classe, S_ && S_.perso && S_.perso.look); if (!MODELES[mLook]) assurerLook(mLook).then((ok) => { if (ok && paysanMesh) rhabiller(); });
  const mUse = MODELES[mLook] ? mLook : ({ iop: 'iop3', osa: 'osa', cra: 'cra' }[classe] || 'iop3'), g = cloner(mUse);
  { const e0 = g.scale.x; g.scale.setScalar(1); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); elargirPerso(g, LARGEUR_PERSO[mUse] ? mUse : classe); try { habillerPerso(g); } catch (err) { console.warn('tenue', err); } g.scale.setScalar(e0); }
  g.rotation.order = 'YXZ'; g.rotation.y = -2.3; poser(g, x, y, z); g.userData.y = y; g.userData.angle = -2.3; ombrePieds(g, 1.4);
  g.userData.membres = ['pivot_jambeG', 'pivot_jambeD', 'pivot_brasG', 'pivot_brasD'].map((n) => g.getObjectByName(n));
  g.userData.genoux = ['pivot_genouG', 'pivot_genouD'].map((n) => g.getObjectByName(n)); g.userData.haut = g.getObjectByName('haut'); return g; /* (genoux et haut du corps : la marche, 24-deplacement.js) */
}
function nuage(x, y, z, t) { const g = new T.Group(); const blanc = new T.MeshToonMaterial({ color: '#ffffff', gradientMap: grad, transparent: true, opacity: 0.92 }); [[0, 0, 0, 1.4], [1.3, -0.2, 0.3, 1.0], [-1.3, -0.25, -0.2, 1.05], [0.5, 0.45, -0.4, 0.9], [-0.6, 0.35, 0.5, 0.8]].forEach(([a, b, c, r]) => { const m = new T.Mesh(new T.IcosahedronGeometry(r * t, 1), blanc); m.position.set(a * t, b * t, c * t); g.add(m); }); poser(g, x, y, z); return g; }

/* ----- construction de la scene ----- */
const ancres = {};
const casesMesh = {};      /* id -> boite cliquable */
const casesDyn = {};       /* id -> groupe dynamique (cultures, tofu) */
const enclosDef = { x: cx(6), z: (cz(2) + cz(3)) / 2, w: 3 * S, d: 2 * S, cellule: 'm5_2' };
const SLOTS_BOUFTOUS = [[-1.7, 0.3, 0.5], [0.6, 1.0, 1.3], [1.2, -0.6, -0.2], [-0.4, -0.9, 0.9], [0.1, 0.2, 2.2], [-1.5, -1.1, 1.8]];
let bouftousMesh = [], tofusMesh = {};
let paysanMesh = null, chemin = [], arrivee = null;
let nuages = [];

let sauvageMesh = null, marchandMesh = null;
const CASCADE = { x: -4.6, larg: 0.72, source: [-24.02, 3.31],
  pts: [[-24.3, 3.31], [-23.8, 3.3], [-23.64, 3.26], [-23.57, 3.08], [-23.51, 2.78], [-23.47, 2.48], [-23.42, 2.31], [-23.26, 2.3], [-23.12, 2.23], [-23.05, 1.97], [-23.0, 1.58],
    [-22.96, 1.23], [-22.91, 1.01], [-22.6, 1.0], [-22.15, 1.04], [-21.7, 1.1], [-21.32, 1.1], [-21.1, 1.02], [-21.0, 0.78], [-20.88, 0.38], [-20.78, 0.02], [-20.69, -0.25], [-20.4, -0.27]],
  chutes: [[-23.4, 2.31], [-22.88, 1.01], [-20.66, -0.25]] };
let cascade = null;
function cascadeColline() { /* la nappe (un ruban qui suit la roche, ses stries descendent), la source, l'ecume et les embruns */
  if (cascade) return; const C = CASCADE, g = new T.Group(); g.name = 'cascade';
  const courbe = new T.CatmullRomCurve3(C.pts.map(([z, y]) => new T.Vector3(C.x, y, z)), false, 'centripetal'), N = 220, M = 8, A = new T.Vector3(1, 0, 0);
  const pos = [], uv = [], pente = [], idx = []; let L = 0, prec = null;
  for (let i = 0; i <= N; i++) {
    const p = courbe.getPointAt(i / N), t = courbe.getTangentAt(i / N), n = t.clone().cross(A).normalize(), pe = Math.max(0, Math.min(1, -t.y * 1.15)); if (prec) L += p.distanceTo(prec); prec = p;
    const w = C.larg * (1 + 0.18 * pe);
    for (let j = 0; j <= M; j++) { const u = j / M, q = p.clone().addScaledVector(A, (u - 0.5) * w).addScaledVector(n, Math.sin(u * Math.PI) * 0.05 + 0.015); pos.push(q.x, q.y, q.z); uv.push(u, L); pente.push(pe); }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setAttribute('aPente', new T.Float32BufferAttribute(pente, 1)); geo.setIndex(idx);
  const mat = new T.ShaderMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide, uniforms: { uTemps: vent.temps },
    vertexShader: 'attribute float aPente; varying vec2 vUv; varying float vPente; void main() { vUv = uv; vPente = aPente; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: ['uniform float uTemps; varying vec2 vUv; varying float vPente;',
      'float h(float n) { return fract(sin(n * 12.9898) * 43758.5453); }',
      'void main() {',
      '  float u = vUv.x, v = vUv.y, vit = mix(0.45, 1.9, vPente);',
      '  float filets = smoothstep(0.55, 1.0, sin(u * 34.0 + 1.6 * sin(v * 1.7 + u * 6.0)));',
      '  float flot = 0.5 + 0.5 * sin((v * 1.5 - uTemps * vit) * 6.2832 + u * 3.0);',
      '  float bande = smoothstep(0.55, 1.0, sin((v * 0.8 - uTemps * vit * 0.7) * 6.2832 + h(floor(u * 3.0)) * 3.0));',
      '  float levre = smoothstep(0.12, 0.35, vPente) * (1.0 - smoothstep(0.5, 0.85, vPente));',
      '  vec3 clair = vec3(0.56, 0.88, 0.97), profond = vec3(0.33, 0.73, 0.92), blanc = vec3(0.96, 0.99, 1.0);',
      '  vec3 c = mix(clair, profond, 0.25 + 0.5 * vPente - 0.25 * sin(u * 3.1416));',
      '  c = mix(c, blanc, clamp(filets * (0.25 + 0.55 * flot) * (0.35 + 0.65 * vPente) + bande * 0.22 + levre * 0.5, 0.0, 0.85));',
      '  float bord = smoothstep(0.0, 0.14, u) * smoothstep(1.0, 0.86, u);',
      '  c = mix(blanc, c, 0.45 + 0.55 * bord);',
      '  gl_FragColor = vec4(c, mix(0.55, 0.92, bord));',
      '}'].join('\n') });
  const nappe = new T.Mesh(geo, mat); nappe.renderOrder = 2; nappe.raycast = () => {}; g.add(nappe);
  /* la source : une petite vasque cerclee de pierres, des rides qui s'ecartent, un bouillon au fond */
  const [sz, sy] = C.source, eauM = new T.MeshBasicMaterial({ color: '#8fdcf4', transparent: true, opacity: 0.92, depthWrite: false });
  const vasque = new T.Mesh(new T.CircleGeometry(0.4, 28), eauM); vasque.rotation.x = -Math.PI / 2; vasque.position.set(C.x, sy + 0.012, sz); vasque.renderOrder = 2; g.add(vasque);
  const pierreM = new T.MeshToonMaterial({ color: '#a39d92', gradientMap: grad });
  for (let k = 0; k < 7; k++) { const a = Math.PI * (0.62 + k * 0.25); const m = new T.Mesh(new T.DodecahedronGeometry(0.09 + (k % 3) * 0.03, 0), pierreM); m.position.set(C.x + Math.cos(a) * 0.46, sy + 0.04, sz + Math.sin(a) * 0.4); m.rotation.set(k, k * 2, 0); m.scale.y = 0.7; g.add(m); }
  const rides = [0, 1, 2].map((k) => { const m = new T.Mesh(new T.RingGeometry(0.06, 0.09, 28), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(C.x, sy + 0.02, sz - 0.05); m.renderOrder = 3; g.add(m); return { m, ph: k / 3 }; });
  /* l'ecume au pied de chaque chute, et les embruns qui sautent */
  const ecumeM = new T.MeshToonMaterial({ color: '#f2fbff', gradientMap: grad }), voileM = new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.45, depthWrite: false });
  const ecumes = [], gouttes = [];
  C.chutes.forEach(([z, y], c) => { const e = c === 2 ? 1.25 : 1;
    const voile = new T.Mesh(new T.CircleGeometry(0.42 * e, 20), voileM.clone()); voile.rotation.x = -Math.PI / 2; voile.scale.set(1.1, 0.75, 1); voile.position.set(C.x, y + 0.025, z + 0.12); voile.renderOrder = 3; g.add(voile);
    for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2, m = new T.Mesh(new T.IcosahedronGeometry((0.07 + (k % 3) * 0.025) * e, 1), ecumeM); m.position.set(C.x + Math.cos(a) * 0.26 * e, y + 0.04, z + 0.1 + Math.sin(a) * 0.14 * e); g.add(m); ecumes.push({ m, ph: k * 0.9 + c, voile }); }
    for (let k = 0; k < 9; k++) { const m = new T.Mesh(new T.SphereGeometry(0.028 + (k % 3) * 0.012, 6, 4), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false })); m.renderOrder = 4; g.add(m); gouttes.push({ m, z, y, e, t: Math.random() * 0.9, dur: 0.7 + Math.random() * 0.4 }); } });
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.raycast = () => {}; } });
  g.userData = { rides, ecumes, gouttes }; scene.add(g); cascade = g;
}
function animerCascade(dt) { /* la source ride, l'ecume respire, les embruns sautent puis retombent */
  if (!cascade) return; const U = cascade.userData, t = vent.temps.value;
  U.rides.forEach((o) => { const k = (t * 0.45 + o.ph) % 1; o.m.scale.setScalar(1 + k * 4.2); o.m.material.opacity = 0.5 * (1 - k); });
  U.ecumes.forEach((o) => { const q = 0.85 + 0.2 * Math.sin(t * 5.2 + o.ph); o.m.scale.set(q, 0.8 + 0.25 * Math.sin(t * 4.1 + o.ph * 1.7), q); o.voile.material.opacity = 0.36 + 0.1 * Math.sin(t * 2.4 + o.ph); });
  U.gouttes.forEach((o) => { o.t += dt; if (o.t > o.dur) { o.t = 0; o.vx = (Math.random() - 0.5) * 0.6; o.vy = 0.9 + Math.random() * 0.7; o.vz = 0.25 + Math.random() * 0.55; o.x0 = CASCADE.x + (Math.random() - 0.5) * 0.4; }
    if (o.vx == null) { o.m.visible = false; return; } o.m.visible = true; const k = o.t;
    o.m.position.set(o.x0 + o.vx * k * o.e, o.y + 0.05 + (o.vy * k - 2.4 * k * k) * o.e, o.z + 0.1 + o.vz * k * o.e); o.m.material.opacity = 0.85 * Math.min(1, k * 8) * (1 - k / o.dur); });
}
function construireStatique() {
  scene.add(MODELES.ile); cascadeColline(); indexerTouffes(); (MODELES.ileMorceaux || []).forEach((m) => scene.add(m));
  TERRAINS.forEach((t, k) => { const G = MODELES.ileTerrains[t.id]; if (G.herbe) { scene.add(G.herbe); indexerTouffes(G.herbe); } if (G.friche) { G.friche.traverse((o) => { o.userData.friche = k; }); scene.add(G.friche); } });
  majTerrains(); construireArbres();
  construireBatiments();
  appliquerEnclos(); appliquerVoliere();
  construireArbalete();
  const dep = ['m4_3', 'm3_2'].map((id) => S_.cases.find((c) => c.id === id)).find((c) => c && PASSABLE[c.type]); /* hors de l'enclos agrandi */
  const q0 = posCase(dep); paysanMesh = paysan(q0.x, q0.y, q0.z, S_.perso && S_.perso.classe); paysanMesh.userData.cellule = dep;
  nuages = [nuage(-36, -7, 12, 1.9), nuage(30, -8, 22, 1.7), nuage(38, -6, -14, 2.0), nuage(-38, -9, -14, 1.8), nuage(-6, -14, 34, 2.4), nuage(-22, -11, 30, 1.6), nuage(20, -7, 30, 2.2)]; /* (l'ile ronde : autour de son bord) */
}
/* chaque terrain : en herbe s'il est a toi, en friche sinon ; le panneau « a vendre » sur le prochain (au milieu de ses cases) */
let panneauVente = null;
function majTerrains() {
  TERRAINS.forEach((t) => { const G = MODELES.ileTerrains[t.id], a = !!S_.terrains[t.id]; if (G.herbe) G.herbe.visible = a; if (G.friche) G.friche.visible = !a; });
  if (panneauVente) { scene.remove(panneauVente); panneauVente = null; }
  Object.keys(ancres).forEach((k) => { if (/^v\d+$/.test(k)) delete ancres[k]; });
  const t = prochainTerrain(); if (!t || !MODELES.panneau) return; const k = TERRAINS.indexOf(t);
  const [i, j] = t.cases.reduce((b, c) => (Math.hypot(cx(c[0]) - t.x, cz(c[1]) - t.z) < Math.hypot(cx(b[0]) - t.x, cz(b[1]) - t.z) ? c : b));
  const pan = cloner('panneau'); pan.traverse((o) => { o.userData.terrain = k; }); poser(pan, cx(i), 0, cz(j), 0.3); panneauVente = pan;
  ancres['v' + k] = new T.Vector3(cx(i), 1.3, cz(j));
}
/* la partie lancee peut avoir d'autres terrains que celle chargee au demarrage : les cases et la friche se remettent a jour */
function resynchroniserIle() {
  const ids = new Set(S_.cases.map((c) => c.id));
  Object.keys(casesMesh).forEach((id) => { if (ids.has(id)) return; scene.remove(casesMesh[id]); delete casesMesh[id]; if (casesDyn[id]) { scene.remove(casesDyn[id]); delete casesDyn[id]; } });
  S_.cases.forEach((p) => { if (!casesMesh[p.id]) construireCase(p); else rendreCase(p.id); });
  majTerrains(); document.querySelectorAll('.bulle.vente').forEach((e) => e.remove()); const t = prochainTerrain(); if (t) bulleVente(t, TERRAINS.indexOf(t));
}
/* toucher la friche : le prochain terrain s'achete (s'il est a ton niveau) ; les autres disent quand ils se vendront */
function infoFriche(k) {
  const t = TERRAINS[k], u = prochainTerrain(); if (!t) return;
  if (t === u && nivTerrainOk(t)) { ACTIONS.acheterTerrain(k); return; } /* (comme le terrain fantome d'avant : le toucher l'achete) */
  if (t === u) toast('Le prochain terrain : ' + t.cases.length + ' cases et +' + t.parcelles + ' parcelles, à vendre au niveau ' + t.niv + ' pour ' + fmt(t.prix) + ' kamas.');
  else toast('Ce terrain-là (' + t.cases.length + ' cases) se vendra au niveau ' + t.niv + '. ' + (u ? 'Celui à vendre maintenant, c\u2019est celui du panneau : ' + u.cases.length + ' cases pour ' + fmt(u.prix) + ' kamas, ' + (nivTerrainOk(u) ? 'touche sa bulle de prix, au-dessus du panneau, pour l\u2019acheter.' : 'à partir du niveau ' + u.niv + '.') : 'Les terrains s\u2019achètent dans l\u2019ordre, en faisant le tour de l\u2019île.'));
}
/* un terrain qui vient d'etre achete : l'herbe a la place de la friche, ses cases, le panneau et la bulle passent au suivant */
function construireTerrain(k) {
  const bulle = document.querySelector('[data-vente="' + k + '"]'); if (bulle) bulle.remove();
  majTerrains(); S_.cases.forEach((p) => { if (!casesMesh[p.id]) construireCase(p); });
  const u = prochainTerrain(); if (u) bulleVente(u, TERRAINS.indexOf(u));
}
const CIBLE = new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, visible: false }); /* invisible pour le rendu (avant, chaque case
partager(CIBLE);
  transparente coutait quand meme un appel de dessin par image, ~170 en tout) ; le rayon du clic la trouve toujours */
/* les touffes d'herbe de l'ile, rangees par case : on les cache quand une case d'herbe est labouree */
const TOUFFES = new Map();
function caseDeTouffe() {
  const v = new T.Vector3();
  return (h) => { h.getWorldPosition(v); const i = Math.round(v.x / S + (COLS - 1) / 2), j = Math.round(v.z / S + (ROWS - 1) / 2); if (!codeIle(i, j) || Math.abs(v.x - cx(i)) > 0.92 || Math.abs(v.z - cz(j)) > 0.92) return null; return idCase(i, j); };
}
function indexerTouffes(racine) { /* apres la fusion : les paquets de touffes portent l'identifiant de leur case */
  (racine || MODELES.ile).traverse((o) => { if (o.isMesh && o.userData.case) { if (!TOUFFES.has(o.userData.case)) TOUFFES.set(o.userData.case, []); TOUFFES.get(o.userData.case).push(o); } });
}
const SOL_LABOURE = new T.BoxGeometry(1.98, 0.12, 1.98); partager(SOL_LABOURE);
function construireCase(p) {
  const pos = posCase(p), ile = true; /* l'ile et les terrains sont des modeles : la case est une cible invisible */
  /* sur l'ile, la case est une cible invisible juste au-dessus du sol ; sur un terrain achete, une dalle coloree */
  const m = new T.Mesh(new T.BoxGeometry(S - 0.1, ile ? 0.1 : 0.3, S - 0.1), ile ? CIBLE : mat(couleurCase(p)));
  if (!ile) { m.castShadow = true; m.receiveShadow = true; }
  m.position.set(pos.x, pos.y + (ile ? 0.06 : -0.15), pos.z); m.userData.cellule = p.id; scene.add(m); casesMesh[p.id] = m;
  const dyn = new T.Group(); dyn.position.set(pos.x, pos.y, pos.z); dyn.userData.cellule = p.id; scene.add(dyn); casesDyn[p.id] = dyn;
  rendreCase(p.id);
}
function couleurCase(p) {
  if (p.type === 'champ') return !p.c ? TERRE.labour : p.arrose ? TERRE.mouille : (etape(p) === 'mur' ? TERRE.labour : TERRE.sec);
  if (p.type === 'enclos') return TERRE.enclos;
  if (p.type === 'libre') return TERRE.libre;
  return '#7ccb52';
}
function rendreCase(id) {
  const p = S_.cases.find((c) => c.id === id); const g = casesDyn[id]; if (!p || !g) return;
  vider(g); if (casesMesh[id].material !== CIBLE) casesMesh[id].material.color.set(couleurCase(p));
  if (p.type !== 'champ') { const sousBati = !!BATIS[p.type] || p.type === 'tour' || p.type === 'arbre' || (p.type === 'deco' && !p.orig); (TOUFFES.get(p.id) || []).forEach((o) => { o.visible = !sousBati; }); return; }
  /* la parcelle : nue, ou la culture a son stade (semis, en croissance, mure), la terre plus sombre si elle est arrosee */
  const st = etape(p), k = { graine: 0, pousse: 1, mur: 2 }[st];
  const parc = (p.c ? MODELES[p.c + k] : MODELES.nu).clone(true); marquer(parc, p.id);
  if (parcelleAjoutee(p)) { /* une case d'herbe labouree : plus de touffes, une couche de terre comme les champs d'origine */
    (TOUFFES.get(p.id) || []).forEach((o) => { o.visible = false; });
    const sol = marquer(maille(SOL_LABOURE, '#6e4226', 0.01), p.id); sol.position.y = 0; g.add(sol); parc.position.y = 0.06;
  }
  const mouille = p.arrose && p.c && st !== 'mur';
  if (mouille) parc.traverse((o) => { const n = o.name.replace(/\.?\d+$/, ''); if (o.isMesh && (n === 'terre' || n === 'sillon')) o.material = terreMouillee(o.material); });
  g.add(parc);
  if (p.tofu) { const w = p.nuisible === 'wabbit' && MODELES.wabbit, t = marquer(cloner(w ? 'wabbit' : 'tofu'), p.id); t.userData.tofu = true; poser(t, 0.15, st === 'mur' ? 0.75 : 0.25, 0.2, w ? 0.62 : 0.7, g); }
}
let voleur = null;
function modeleVoleur() {
  if (MODELES.voleur) return cloner('voleur');
  /* en attendant son modele : une silhouette sombre tiree du Cra */
  const g = cloner('cra'); g.traverse((o) => { if (o.isMesh && o.material && o.material.color && o.material.type !== 'MeshBasicMaterial') { o.material = o.material.clone(); o.material.color.multiplyScalar(0.45).lerp(new T.Color('#4a2a5e'), 0.35); } }); return g;
}
function lancerVoleur() {
  if (voleur || enAccueil) return; son('alerte');
  const grange = S_.cases.find((c) => c.type === 'grange'); if (!grange) return;
  const bords = bordsFerme(); if (!bords.length) return; /* (l'ile ronde : un bord de la ferme, cote friche ou cote vide) */
  const bd = hasard(bords), depart = bd.c, ch = trajet(depart, grange); if (!ch) return;
  const pts = ch.map((c) => ({ x: posCase(c).x, z: posCase(c).z, c }));
  const fin = ch[ch.length - 1], t = posCase(blocDe(grange).find((v) => voisins(fin).includes(v)) || grange), pf = posCase(fin);
  pts[pts.length - 1] = { x: pf.x + (t.x - pf.x) * 0.35, z: pf.z + (t.z - pf.z) * 0.35, c: fin };
  const q = posCase(depart), m = modeleVoleur(); ombrePieds(m, 1.4); m.rotation.order = 'YXZ'; m.traverse((o) => { o.userData.voleur = true; });
  m.userData.membres = ['pivot_jambeG', 'pivot_jambeD', 'pivot_brasG', 'pivot_brasD'].map((n) => m.getObjectByName(n));
  poser(m, q.x + bd.di * 1.1, 0, q.z + bd.dj * 1.1); m.scale.multiplyScalar(0.01);
  const barre = document.createElement('div'); barre.className = 'pv-monstre'; barre.innerHTML = '<i></i>'; zoneBulles.appendChild(barre);
  voleur = { m, pts, k: 0, etat: 'arrive', depart: { x: q.x + bd.di * 1.1, z: q.z + bd.dj * 1.1 }, pas: 0, t: 0, pv: pvVoleur(), pvMax: pvVoleur(), barre };
  toast('Un voleur de VSA (' + voleur.pv + ' PV) débarque sur ton île et file vers ta grange ! Touche-le pour le frapper.', 'alerte');
}
/* l'arbalete : montee sur le toit de la grange, elle guette, vise le voleur et tire si elle est armee */
let arbalete = null, carreau = null;
function modeleArbalete() {
  const g = new T.Group(), bois = '#9a6a3c', fonce = '#5e3b23', fer = '#7f8b92';
  const tube = (pts, r, c) => { const m = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(([x, y, z]) => new T.Vector3(x, y, z))), 24, r, 8, false), mat(c)); m.castShadow = true; return m; };
  const socle = cyl(0.22, 0.27, 0.12, fonce, 16); socle.position.y = 0.06; g.add(socle);
  const cercle = new T.Mesh(new T.TorusGeometry(0.245, 0.025, 6, 24), mat(fer)); cercle.rotation.x = Math.PI / 2; cercle.position.y = 0.1; g.add(cercle);
  const pivot = cyl(0.06, 0.07, 0.16, fer, 10); pivot.position.y = 0.2; g.add(pivot);
  const mat_ = new T.Group(); mat_.position.set(-0.16, 0.12, -0.16); g.add(mat_); /* un petit fanion rouge */
  const hampe = cyl(0.012, 0.012, 0.55, fonce, 6); hampe.position.y = 0.27; mat_.add(hampe);
  const fanion = new T.Mesh(new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0.52, 0), new T.Vector3(0.2, 0.46, 0), new T.Vector3(0, 0.38, 0)]), new T.MeshToonMaterial({ color: '#c83a22', gradientMap: grad, side: T.DoubleSide })); fanion.geometry.computeVertexNormals(); mat_.add(fanion);
  const tete = new T.Group(); tete.position.y = 0.3; g.add(tete);
  const fut = boite(0.1, 0.09, 0.78, bois); fut.position.z = 0.06; tete.add(fut);
  const crosse = boite(0.13, 0.15, 0.2, fonce); crosse.position.set(0, -0.02, -0.33); tete.add(crosse);
  [-0.12, 0.2].forEach((z) => { const b = boite(0.12, 0.11, 0.035, fer, 0.01); b.position.z = z; tete.add(b); }); /* cerclages de fer */
  tete.add(tube([[-0.44, 0.0, 0.3], [-0.22, 0.03, 0.44], [0, 0.03, 0.47], [0.22, 0.03, 0.44], [0.44, 0.0, 0.3]], 0.028, fonce)); /* l'arc, courbe */
  [-1, 1].forEach((sg) => { const e = sphere(0.04, fer, 1); e.position.set(sg * 0.44, 0.0, 0.3); tete.add(e); });
  const corde = new T.MeshBasicMaterial({ color: '#f3ead2' });
  [-1, 1].forEach((sg) => { const c = new T.Mesh(new T.TubeGeometry(new T.LineCurve3(new T.Vector3(sg * 0.44, 0.0, 0.3), new T.Vector3(0, 0.05, 0.06)), 1, 0.008, 4, false), corde); tete.add(c); });
  const fleche = new T.Group(); tete.add(fleche);
  const tige = boite(0.025, 0.025, 0.46, '#d9c08a', 0.02); tige.position.set(0, 0.07, 0.27); fleche.add(tige);
  [-1, 1].forEach((sg) => { const p = boite(0.07, 0.004, 0.09, '#c83a22', 0); p.position.set(sg * 0.03, 0.07, 0.08); p.rotation.y = sg * 0.2; fleche.add(p); }); /* empennage */
  const pointe = cone(0.035, 0.1, '#9aa1aa', 6); pointe.rotation.x = Math.PI / 2; pointe.position.set(0, 0.07, 0.54); tete.add(pointe);
  g.userData.tete = tete; g.userData.fleche = fleche; g.userData.pointe = pointe; return g;
}
function construireArbalete() {
  if (arbalete || !niv('arbalete') || !ancres.grange) return;
  const g = MODELES.arbalete1 ? arbaleteNiv(niv('arbalete')) : modeleArbalete(); g.scale.setScalar(2.2);
  /* une plateforme de bois sur pilotis entre l'arbalete et le toit : elle ne flotte plus */
  const sup = new T.Group(); g.add(sup); const bois = '#8a5a32', fonce = '#5e3b23';
  const plat = boite(0.6, 0.05, 0.6, bois); plat.position.y = -0.02; sup.add(plat);
  [-0.2, 0, 0.2].forEach((x) => { const l = boite(0.17, 0.02, 0.62, '#a8743f', 0.01); l.position.set(x, 0.01, 0); sup.add(l); }); /* les planches */
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, c]) => { const pt = boite(0.06, 0.8, 0.06, fonce); pt.position.set(a * 0.24, -0.42, c * 0.24); sup.add(pt); });
  [-1, 1].forEach((c) => { const t = boite(0.5, 0.04, 0.04, bois); t.position.set(0, -0.32, c * 0.24); sup.add(t); const u = boite(0.04, 0.04, 0.5, bois); u.position.set(c * 0.24, -0.32, 0); sup.add(u);
    const d = boite(0.035, 0.62, 0.035, bois); d.position.set(0, -0.4, c * 0.24); d.rotation.z = 0.78 * c; sup.add(d); }); /* traverses et croix */
  const p = ancres.grange, gc = S_.cases.find((c) => c.type === 'grange'); const [ax, az] = tourne(0, 0.45, rotDe('grange')); poser(g, p.x + ax, p.y - 0.36, p.z + az); marquer(g, gc ? gc.id : 'm0_0');
  arbalete = g; rendreArbaleteBulle();
}
let toursMesh = [];
/* une arbalete d'un niveau donne : tout le modele pivote pour viser (son socle est rond), la pointe est au bout du carreau */
function arbaleteNiv(n) {
  n = Math.max(1, Math.min(5, n)); const g = new T.Group(), tete = cloner('arbalete' + n); g.add(tete);
  const L = n === 5 ? 1.0 : n >= 3 ? 0.86 + (n - 3) * 0.04 : 0.78 + (n - 1) * 0.04, pointe = new T.Object3D(); pointe.position.set(0, n === 5 ? 0.53 : 0.4, L / 2 + 0.2); tete.add(pointe);
  g.userData.tete = tete; g.userData.pointe = pointe; g.userData.fleche = new T.Group(); return g;
}
function modeleTourNiv(c) {
  const n = nivTour(c) + 1, g = new T.Group(); g.add(cloner('tour' + n));
  const a = arbaleteNiv(n); a.position.y = BAS_TOUR[n - 1]; a.scale.setScalar(ECH_TOUR * (n >= 5 ? 1.15 : n >= 4 ? 1.1 : 1)); g.add(a);
  g.userData.tete = a.userData.tete; g.userData.pointe = a.userData.pointe; return g;
}
function modeleTour() {
  const g = new T.Group(), bois = '#9a6a3c', fonce = '#6b4528';
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const p = boite(0.13, 1.9, 0.13, fonce); p.position.set(a * 0.42, 0.95, b * 0.42); p.rotation.set(b * 0.06, 0, -a * 0.06); g.add(p); });
  [0.55, 1.2].forEach((y) => [[0, -0.42, 0], [0, 0.42, 0], [-0.42, 0, 1], [0.42, 0, 1]].forEach(([x, z, r]) => { const t = boite(0.86, 0.08, 0.08, bois); t.position.set(x, y, z); if (r) t.rotation.y = Math.PI / 2; g.add(t); }));
  const plat = boite(1.25, 0.14, 1.25, bois); plat.position.y = 1.92; g.add(plat);
  [[0, -0.6, 0], [0, 0.6, 0], [-0.6, 0, 1], [0.6, 0, 1]].forEach(([x, z, r]) => { const t = boite(1.2, 0.26, 0.07, '#b07d48'); t.position.set(x, 2.1, z); if (r) t.rotation.y = Math.PI / 2; g.add(t); });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const p = boite(0.08, 0.75, 0.08, fonce); p.position.set(a * 0.55, 2.35, b * 0.55); g.add(p); });
  const toit = cone(1.05, 0.75, '#c2552f', 4); toit.rotation.y = Math.PI / 4; toit.position.y = 3.08; g.add(toit);
  const a = modeleArbalete(); a.position.y = 2.0; a.scale.setScalar(1.1); g.add(a); /* la meme arbalete que sur la grange */
  g.userData.tete = a.userData.tete; g.userData.pointe = a.userData.pointe; g.scale.setScalar(0.85); return g;
}
function construireTours() {
  toursMesh.forEach((t) => scene.remove(t)); toursMesh = [];
  S_.cases.filter((c) => c.type === 'tour').forEach((c) => { const q = posCase(c), g = MODELES.tour1 ? modeleTourNiv(c) : modeleTour(); poser(g, q.x, q.y, q.z); marquer(g, c.id); g.userData.cd = Math.random() * CADENCE_TOUR; toursMesh.push(g); });
  if (S_.bats) majFeux(true);
}
/* chaque tour vise le voleur ou le monstre le plus proche a sa portee, et tire une fleche de la reserve */
const PORTEE_VUE = new T.Group(); PORTEE_VUE.visible = false; scene.add(PORTEE_VUE);
[[new T.CircleGeometry(1, 64), 0.13], [new T.RingGeometry(0.97, 1, 96), 0.85]].forEach(([geo, op]) => { const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: '#f2b630', transparent: true, opacity: op, depthWrite: false, depthTest: false, side: T.DoubleSide })); m.rotation.x = -Math.PI / 2; m.renderOrder = 3; PORTEE_VUE.add(m); });
/* sous la souris : une tour ou la grange armee -> le cercle de sa portee */
function porteeSous(ev) {
  souris.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1); ray.setFromCamera(souris, camera);
  for (const h of ray.intersectObjects(scene.children, true)) {
    if (h.object.material && h.object.material.transparent && !(h.object.userData && h.object.userData.cellule)) continue;
    let o = h.object, cel = null; while (o) { if (typeof o.userData.cellule === 'string') { cel = o.userData.cellule; break; } o = o.parent; }
    const c = cel && S_.cases.find((x) => x.id === cel); if (!c) return null;
    if (c.type === 'tour') { const q = posCase(c); return { x: q.x, y: q.y, z: q.z, r: porteeTour(c), txt: 'Tour niveau ' + (nivTour(c) + 1) + ' · portée ' + enCases(porteeTour(c)) + ' cases · ' + fmt(S_.fleches) + ' flèches en réserve' }; }
    if (c.type === 'grange' && arbalete && niv('arbalete')) return { x: arbalete.position.x, y: posCase(c).y, z: arbalete.position.z, r: porteeArbalete(), txt: 'Arbalète niveau ' + niv('arbalete') + ' · portée ' + enCases(porteeArbalete()) + ' cases · ' + S_.carreaux + '/' + capaciteArbalete() + ' carreaux · ' + fmt(S_.fleches) + ' flèches en réserve' };
    if (c.type === 'epouvantail' && epou && niv('epouvantail') >= 3) { const n = niv('epouvantail'); return { x: epou.g.position.x, y: posCase(c).y, z: epou.g.position.z, r: n >= 4 ? 0 : EPOU[3].portee, txt: (n >= 5 ? 'PÉPITO-TRON · toute la ferme · ' + PRIX_LASER + ' kamas par tir' : 'Épouvantail · ' + (n >= 4 ? 'toute l\'île' : 'portée ' + enCases(EPOU[3].portee) + ' cases') + ' · ' + fmt(S_.fleches) + ' flèches en réserve') }; }
    return null;
  }
  return null;
}
canvas.addEventListener('pointermove', (ev) => {
  if (visee || ev.buttons) return; const t = performance.now(); if (t - (porteeSous.t || 0) < 70) return; porteeSous.t = t;
  const p = porteeSous(ev); PORTEE_VUE.visible = !!(p && p.r); if (p && p.r) { PORTEE_VUE.position.set(p.x, p.y + 0.08, p.z); PORTEE_VUE.scale.setScalar(p.r); }
  const inf = $('info-survol'); if (p && p.txt && ev.pointerType === 'mouse') { inf.hidden = false; inf.textContent = p.txt; inf.style.left = Math.min(ev.clientX + 16, innerWidth - inf.offsetWidth - 8) + 'px'; inf.style.top = (ev.clientY + 18) + 'px'; } else inf.hidden = true; /* « voir le stock de fleches de la tour au survol » (testeurs, 12/10/2026) */
});
canvas.addEventListener('pointerleave', () => { PORTEE_VUE.visible = false; $('info-survol').hidden = true; });
function majTours(dt, s) {
  toursMesh.forEach((g, k) => {
    if (enRuine('tour:' + g.userData.cellule)) return;
    const t = g.userData.tete, pos = g.position, ct = caseTour(g.userData.cellule);
    g.userData.cd = Math.max(0, g.userData.cd - dt);
    const v = voleurCiblable() && Math.hypot(voleur.m.position.x - pos.x, voleur.m.position.z - pos.z) < porteeTour(ct) ? voleur : null;
    const mo = !v && combat ? monstreAViser(pos, porteeTour(ct)) : null, cible = v ? v.m.position : mo ? mo.m.position : null;
    let ang = Math.sin(s * 0.5 + k * 2) * 1.4; if (cible) ang = Math.atan2(cible.x - pos.x, cible.z - pos.z);
    let d = ang - t.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); t.rotation.y += d * Math.min(1, dt * (cible ? 7 : 1.2));
    if (!cible || g.userData.cd > 0 || Math.abs(d) > 0.2) return;
    if (S_.fleches <= 0) { if (!majTours.vide) { majTours.vide = true; toast('Tes tours de défense n\'ont plus de flèches : achète-en à l\'HDV.', 'alerte'); } return; }
    majTours.vide = false; S_.fleches--; g.userData.cd = cadenceTour(ct); son('arc', null, -6); /* (les tours : l'arc, plus bas que celui du perso) */
    const de = new T.Vector3(); g.userData.pointe.getWorldPosition(de); const vers = cible.clone(); vers.y += mo ? 0.5 : 0.8;
    const fl = boite(0.035, 0.035, 0.5, '#d9c08a'); scene.add(fl); fl.position.copy(de); fl.lookAt(vers); let u = 0;
    effets.push((dt2) => { u += dt2 / 0.3; fl.position.lerpVectors(de, vers, Math.min(1, u)); if (u >= 1) { jeter(fl); if (mo) blesser(mo, degatsTour(ct), false, 'def'); else blesserVoleur(degatsTour(ct), 'Une tour de défense fait fuir le voleur de VSA !'); return true; } });
  });
}
function artTour() {
  const n = nbTours(), ct = PRIX_TOUR[Math.min(n, PRIX_TOUR.length - 1)], bloque = niveau(S_.xp) < NIV_TOUR, max = n >= TOURS_MAX;
  const achat = bloque ? '<span class="a-etat">' + picto('cadenas', GRIS_PICTO) + 'Paysan niveau ' + NIV_TOUR + '</span>' : max ? '<span class="a-etat">Les ' + TOURS_MAX + ' tours sont construites</span>' : ilManque(ct) + '<button class="btn kamas" data-poser-tour' + (S_.kamas < ct ? ' disabled' : '') + '>Construire · ' + fmt(ct) + ' ' + KAMA + '</button>';
  return '<div class="amel' + (bloque ? ' verrou' : '') + '"><img class="a-ico" src="assets/icones/tour.png?v=' + VERSION_MODELES + '" alt=""><h3>Tour de défense</h3>' + crans(n, TOURS_MAX, n + ' sur ' + TOURS_MAX + ' construites') +
    '<p class="a-desc">Elle tire seule sur les voleurs et les monstres, d\'abord ceux qui attaquent tes bâtiments. Tu choisis sa case, et chaque tour s\'améliore à part.</p>' + (max ? '' : '<div class="a-prochain">Une tour de plus</div><dl class="a-gains">' + ligneGain('degats', 'Dégâts', '<b>' + degatsTour() + '</b>') + ligneGain('carreaux', 'Une flèche par tir, prise dans ta réserve', '') + '</dl>') + '<div class="a-achat">' + achat + '</div></div>';
}
function ouvrirTour(p) {
  const n = nivTour(p), fini = n >= 4, prix = fini ? 0 : NIV_TOURS.prix[n], req = fini ? 0 : NIV_TOURS.nivs[n], bloque = !fini && niveau(S_.xp) < req;
  const L = (k) => [['degats', 'Dégâts', NIV_TOURS.deg[k], fmt], ['portee', 'Portée', NIV_TOURS.portee[k], (x) => enCases(x) + ' cases'], ['cadence', 'Un tir toutes les', NIV_TOURS.cadence[k], (x) => virgule(x) + ' s'], ['vita', 'Points de vie', NIV_TOURS.pv[k], fmt]];
  const lignes = L(n).map(([e, t, v, f], i) => { const w = fini ? v : L(n + 1)[i][2]; return ligneGain(e, t, v === w ? '<b>' + f(w) + '</b>' : '<s>' + f(v) + '</s> → <b>' + f(w) + '</b>'); }).join('');
  const NOMS = ['le mirador de bois', 'le mirador renforcé', 'la base de pierre', 'la tour de pierre', 'le bastion de Redemption'];
  const achat = fini ? '<span class="a-etat">Niveau maximum atteint</span>' : bloque ? '<span class="a-etat">' + picto('cadenas', GRIS_PICTO) + 'Paysan niveau ' + req + '</span>' : ilManque(prix) + '<button class="btn kamas" data-ameliorer-tour="' + p.id + '"' + (S_.kamas < prix ? ' disabled' : '') + '>Niveau ' + (n + 2) + ' · ' + fmt(prix) + ' ' + KAMA + '</button>';
  ouvrirModale('tour', entete('Tour de défense, niveau ' + (n + 1) + '/5') + artPv('tour:' + p.id) + '<div class="amel' + (bloque ? ' verrou' : '') + '"><img class="a-ico" src="assets/icones/tour.png?v=' + VERSION_MODELES + '" alt=""><h3>' + Maj(NOMS[n]) + '</h3>' + crans(n + 1, 5) +
    '<p class="a-desc">Elle tire toute seule sur les voleurs et les monstres, une flèche par tir (' + S_.fleches + ' en réserve). Chaque niveau monte toutes ses stats et change son apparence ; les autres tours gardent le leur.</p>' +
    '<div class="a-prochain">' + (fini ? 'Niveau maximum' : 'Au niveau ' + (n + 2) + ', ' + NOMS[n + 1]) + '</div><dl class="a-gains">' + lignes + '</dl><div class="a-achat">' + achat + '</div></div>' +
    '<div class="art">' + ico('pelle') + '<div><b>Démonter la tour</b><div class="desc">La case redevient de l\'herbe, la moitié de ce que la tour t\'a coûté t\'est rendue. Pour la déplacer, passe plutôt par Aménager.</div></div><div class="act"><button class="btn" data-demonter-tour="' + p.id + '">Démonter</button></div></div>');
}
/* a partir du niveau 3, l'arbalete se recharge toute seule avec la reserve de fleches (12/10/2026) */
const NIV_RECHARGE_AUTO = 3, rechargeAuto = () => niv('arbalete') >= NIV_RECHARGE_AUTO;
function rechargerSeule() {
  if (!arbalete || !rechargeAuto() || enRuine('grange')) return false;
  const n = Math.min(capaciteArbalete() - S_.carreaux, S_.fleches); if (n <= 0) return false;
  S_.fleches -= n; S_.carreaux += n; rendreArbaleteBulle(); return true;
}
function rendreArbaleteBulle() {
  if (!arbalete) return;
  if (enRuine('grange')) { retirerBulle('arbalete'); return; }
  arbalete.userData.fleche.visible = arbalete.userData.pointe.visible = S_.carreaux > 0;
  if (S_.carreaux > 0) retirerBulle('arbalete');
  else bulle('arbalete', icoB('fleches'), 'eau', [arbalete.position.x, arbalete.position.y + 1.1, arbalete.position.z], 'arbalete:1', S_.fleches || '0', rechargeAuto() ? 'Plus de flèches en réserve : achète-en à l\'HDV, elle se rechargera toute seule' : 'Arbalète à recharger : touche pour y envoyer le paysan');
}
function viserArbalete(dt, s) {
  if (!arbalete || enRuine('grange')) return;
  const t = arbalete.userData.tete, mo = !voleurCiblable() && combat ? monstreAViser(arbalete.position, porteeArbalete()) : null;
  const cible = voleurCiblable() ? voleur.m.position : mo ? mo.m.position : null;
  let ang = Math.sin(s * 0.4) * 1.2; /* elle guette */
  if (cible) ang = Math.atan2(cible.x - arbalete.position.x, cible.z - arbalete.position.z);
  let d = ang - t.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); t.rotation.y += d * Math.min(1, dt * (cible ? 6 : 1.5));
  arbalete.userData.cd = Math.max(0, (arbalete.userData.cd || 0) - dt); /* une seconde entre deux tirs */
  if (cible && S_.carreaux > 0 && !arbalete.userData.cd && Math.hypot(cible.x - arbalete.position.x, cible.z - arbalete.position.z) < porteeArbalete() && Math.abs(d) < 0.15) tirer(mo);
  if (carreau) { /* la fleche file vers le voleur */
    carreau.t += dt / 0.3; const a = carreau.de, b = carreau.vers; carreau.m.position.set(a.x + (b.x - a.x) * carreau.t, a.y + (b.y - a.y) * carreau.t + Math.sin(carreau.t * Math.PI) * 0.4, a.z + (b.z - a.z) * carreau.t);
    if (carreau.t >= 1) { if (carreau.impact) carreau.impact(); jeter(carreau.m); carreau = null; }
  }
}
function tirer(mo) {
  son('arbalete'); S_.carreaux = Math.max(0, S_.carreaux - 1); arbalete.userData.cd = cadenceArbalete(); rechargerSeule(); rendreArbaleteBulle();
  const de = new T.Vector3(); arbalete.userData.pointe.getWorldPosition(de); const vers = (mo ? mo.m.position : voleur.m.position).clone(); vers.y += mo ? 0.5 : 0.8;
  const m = boite(0.04, 0.04, 0.5, '#d9c08a'); m.lookAt(vers.clone().sub(de)); scene.add(m); m.position.copy(de); m.lookAt(vers);
  carreau = { m, de, vers, t: 0, impact: mo ? () => blesser(mo, degatsArbalete(), true, 'def') : () => blesserVoleur(degatsArbalete(), 'Tchac ! L\'arbalète de la grange fait fuir le voleur de VSA.' + (rechargeAuto() ? '' : ' Pense à la recharger.')) };
  sauver();
}
/* chasser le voleur a la main : chaque classe a son geste. Le Cra tire une fleche de loin, le Iop court lui mettre un coup d'epee,
   l'Osamodas s'approche a portee de fouet. A l'impact, le voleur detale. */
const effets = [];
function majEffets(dt) { /* les effets animes ; un effet qui plante est retire et son erreur notee, au lieu d'arreter toute la boucle (16/10/2026) ; les particules avancent avec eux (22b-effets.js) */
  if (typeof majParticules === 'function') majParticules(dt);
  for (let i = effets.length - 1; i >= 0; i--) { let fini; try { fini = effets[i](dt); } catch (err) { fini = true; (window.__erreursEffets = window.__erreursEffets || []).push(String(err && err.stack || err).slice(0, 400)); console.error('effet retiré', err); } if (fini) effets.splice(i, 1); }
}
/* LA PORTEE DES ATTAQUES, LA MEME PARTOUT (13/10/2026 : « des fois je peux taper de loin, des fois au corps a corps, que ce soit un Tofu, un boss ou un mec VSA ;
   si mon perso court au cac alors que je me suis eloigne pour le taper de loin (Osa, Cra), c'est bizarre », Mathieu) : une seule portee par classe, celle des vagues
   (Iop 1 case, Cra 5, Osamodas 3 : STATS_CLASSE), pour les vagues, le voleur et les Tofus des champs (avant, le voleur : Cra 9, Iop 1,7). Trop loin, le perso s'approche juste
   assez pour toucher, jamais jusqu'au corps a corps pour le Cra et l'Osamodas ; et au PC, se deplacer pendant une vague le fait tenir sa position. */
const porteeClasse = (classe) => (STATS_CLASSE[classe] || STATS_CLASSE.iop).portee;
function caseAPortee(x, z, portee) { /* la case praticable la plus proche du perso d'ou il touche le point (x, z) ; aucune : null */
  const pp = paysanMesh.position; let best = null, bd = Infinity;
  S_.cases.forEach((c) => { if (!PASSABLE[c.type]) return; const q = posCase(c); if (Math.hypot(q.x - x, q.z - z) > portee - 0.25) return; const d = Math.hypot(q.x - pp.x, q.z - pp.z); if (d < bd) { bd = d; best = c; } });
  return best;
}
function attaquerVoleur() {
  if (!voleurCiblable() || !paysanMesh || paysanMesh.userData.attaque) return;
  const classe = (S_.perso && S_.perso.classe) || 'iop', pv = voleur.m.position, pp = paysanMesh.position;
  if (Math.hypot(pv.x - pp.x, pv.z - pp.z) > porteeClasse(classe) + 0.3) { /* trop loin : il s'approche juste assez (la case la plus proche d'ou il touche), puis reessaie */
    const aPortee = classe !== 'iop' && caseAPortee(pv.x, pv.z, porteeClasse(classe)); if (aPortee && aPortee !== caseIci(pp.x, pp.z)) { allerPuis(aPortee, () => attaquerVoleur()); return; }
    /* « je viens de tuer le voleur a distance avec le Iop, bizarre nan ? » (Mathieu, 11/10/2026) : caseSous ne connait que l'ile de depart ;
       sur un terrain achete (ou une case ou l'on ne marche pas), il ne courait pas et frappait de loin. Maintenant : la case du voleur,
       sinon la case libre la plus proche de lui, et jamais de coup hors de portee */
    const c = caseIci(pv.x, pv.z);
    if (c && PASSABLE[c.type]) { allerPuis(c, () => attaquerVoleur()); return; }
    const pres = S_.cases.filter((x) => PASSABLE[x.type]).map((x) => [x, posCase(x)]).sort((a, b) => Math.hypot(a[1].x - pv.x, a[1].z - pv.z) - Math.hypot(b[1].x - pv.x, b[1].z - pv.z))[0];
    if (pres && Math.hypot(pres[1].x - pp.x, pres[1].z - pp.z) > 0.5) { allerPuis(pres[0], () => attaquerVoleur()); return; }
    toast(classe === 'cra' ? 'Trop loin, même pour une flèche.' : 'Le voleur est hors de portée : attends qu\'il approche.'); return;
  }
  chemin = []; arrivee = null;
  const u = paysanMesh.userData; u.angle = Math.atan2(pv.x - pp.x, pv.z - pp.z); paysanMesh.rotation.y = u.angle;
  u.attaque = { t: 0, classe, base: u.angle, contreVoleur: true };
}
function animerAttaque(dt) {
  const u = paysanMesh && paysanMesh.userData, a = u && u.attaque;
  if (!a) { if (u && u.reprise > 0) { u.reprise -= dt; if (u.reprise <= 0 && voleurCiblable() && !combat && !chemin.length) attaquerVoleur(); } return; }
  a.t += dt; const k = Math.min(1, a.t / 0.5), m = u.membres || [], bras = m[3] || m[2];
  if (a.classe === 'iop') { if (a.tour !== false) paysanMesh.rotation.y = a.base + Math.PI * 2 * Math.min(1, a.t / 0.4); if (bras) bras.rotation.x = -2.2 * Math.sin(k * Math.PI); } /* il tournoie (contre le voleur), epee en avant */
  else if (a.classe === 'osa') { if (bras) bras.rotation.x = -2.0 * Math.sin(Math.min(1, k * 1.4) * Math.PI); } /* le bras monte devant lui puis claque (le fouet part de la main, 22b-effets.js) */
  else { if (m[3]) m[3].rotation.x = 0.9 * Math.sin(k * Math.PI); paysanMesh.rotation.x = -0.08 * Math.sin(k * Math.PI); } /* il bande l'arc */
  if (!a.frappe && a.t >= (a.classe === 'cra' ? 0.25 : 0.18)) { a.frappe = true; if (a.surFrappe) a.surFrappe(); else frapper(a.classe); }
  if (a.t >= 0.5) { u.attaque = null; paysanMesh.rotation.y = a.base; paysanMesh.rotation.x = 0; if (a.contreVoleur) u.reprise = Math.max(0.05, statsPerso().cadence - 0.5); } /* il continue de frapper le voleur tant qu'il n'a pas fui */
}
/* l'effet du geste de classe vers un point : fleche (Cra, l'impact a l'arrivee), arc d'epee (Iop), coup de fouet (Osamodas).
   style : '' (le coup normal), 'feu' (la fleche de feu, true accepte), 'gel' (les ultis de givre), 'fatal' (le coup fatal) ; chaque sort garde son ton
   (« la fleche de glace, c'est pas cense faire un tremblement ou une explosion », Mathieu, 23/10/2026) */
const COULEUR_FLECHE = { '': '#d9c08a', feu: '#ff7a1e', gel: '#bfe6ff', fatal: '#ff3b2e' };
function effetFrappe(classe, pv, auImpact, feu) {
  const pp = paysanMesh.position.clone(), style = feu === true ? 'feu' : (feu || ''), gros = style !== '';
  if (classe === 'cra') {
    const de = pp.clone(); de.y += 0.95; const fl = boite(gros ? 0.05 : 0.035, gros ? 0.05 : 0.035, style === 'fatal' ? 0.8 : 0.55, COULEUR_FLECHE[style]); scene.add(fl); fl.position.copy(de); fl.lookAt(pv);
    if (gros) { const b = new T.Mesh(new T.IcosahedronGeometry(0.13, style === 'gel' ? 0 : 1), new T.MeshBasicMaterial({ color: { feu: '#ffcf3e', gel: '#eaf8ff', fatal: '#ff8a6a' }[style] })); b.position.z = 0.32; fl.add(b); } /* la pointe en flammes, en glace ou rougeoyante */
    const pointe = cone(0.04, 0.1, '#9aa1aa', 6); pointe.rotation.x = Math.PI / 2; pointe.position.z = 0.3; fl.add(pointe);
    decocher(de, pv); /* (22b-effets.js : l'eclat a l'arc, la trainee, l'eclat a l'impact, chacun a son ton) */
    let t = 0; effets.push((dt) => { t += dt / 0.28; fl.position.lerpVectors(de, pv, Math.min(1, t)); fl.position.y += Math.sin(Math.min(1, t) * Math.PI) * 0.35; traineeFleche(fl.position, style); if (t >= 1) { jeter(fl); impactFleche(pv, style); auImpact(); return true; } });
    return;
  }
  if (classe === 'iop') { /* une lame de lumiere qui balaie devant lui, et l'eclat du coup sur la cible (22b-effets.js, 23/10/2026) */
    entailleIop(pp, pv, style); etoileImpact(pv, 0.85, style === 'gel' ? '#9fd8ff' : style === 'fatal' ? '#ff5a3a' : undefined); auImpact(); return;
  }
  /* osamodas : la laniere du fouet part de la main et claque sur la cible */
  coupDeFouet(mainDe(paysanMesh), pv, paysanMesh, style); /* (22b-effets.js : la laniere part de la main, ondule jusqu'a la cible et claque ; « le fouet est cense partir de sa main, pas de son front », Mathieu) */
  auImpact();
}
function frapper(classe) {
  if (!voleur) return;
  const pv = voleur.m.position.clone(); pv.y += 0.8;
  const msg = { cra: 'Ta flèche siffle : le voleur de VSA détale, bredouille !', iop: 'Un grand coup d\'épée du Iop : le voleur de VSA détale, bredouille !', osa: 'Clac ! Un coup de fouet de l\'Osamodas : le voleur de VSA détale, bredouille !' }[classe];
  const portee = () => Math.hypot(voleur.m.position.x - paysanMesh.position.x, voleur.m.position.z - paysanMesh.position.z) <= porteeClasse(classe) + 0.6; /* (au moment du coup : il a pu s'eloigner) */
  effetFrappe(classe, pv, () => { if (voleur && (classe === 'cra' || portee())) blesserVoleur(statsPerso().deg, msg, classe === 'iop' ? 1.2 : 0.6); }); /* le coup d'epee du Iop le sonne plus longtemps */
}
/* un coup sur le voleur : il ne detale qu'a 0 PV */
function blesserVoleur(n, msg, sonne) {
  if (!voleurCiblable()) return;
  voleur.pv -= n; voleur.etourdi = sonne || 0.6; const p = voleur.m.position.clone(); p.y += 1.7; chiffre('-' + n, p);
  if (voleur.pv > 0) return;
  const L = butinVoleur(false), t = texteButin(L);
  if (voleur.porte) { /* rattrape avec son butin : tout revient a la grange, et il disparait */
    const r = voleur.porte; S_.grange[r.id] = (S_.grange[r.id] || 0) + r.n; voleur.porte = null; chiffre('+' + r.n + ' ' + r.nom, p, 'butin');
    toast('Voleur abattu avant de quitter ta ferme : ' + r.n + ' ' + r.nom + ' récupérés' + (t ? ', et sur lui : ' + t : '') + ' !', 'or');
    if (voleur.barre) { voleur.barre.remove(); voleur.barre = null; } retirerBulle('voleur'); pouf(voleur.m.position.x, voleur.m.position.y, voleur.m.position.z, 2.5); voleur.etat = 'parti'; voleur.t = 0; gagnerXp(5); rendreGrange(); sauver(); return;
  }
  chasserVoleur(t && typeof msg === 'string' ? msg.replace(/ !$/, '') + ' Sur lui : ' + t + '.' : msg);
}
/* chasser un Tofu de loin : le perso vise depuis la ou il est (Cra : 9 cases a l'arc, Osamodas : 3 au fouet, Iop : il s'approche pour l'epee) */
function chasserDeLoin(p, fin, approche) {
  const u = paysanMesh.userData; if (u.attaque) return;
  const classe = classeDe(), q = posCase(p), pp = paysanMesh.position;
  if (!approche && Math.hypot(q.x - pp.x, q.z - pp.z) > Math.max(porteeClasse(classe), 2.4)) { /* depuis une case voisine, tout le monde l'atteint ; le Cra, lui, s'arrete des qu'il est a portee */
    const loin = classe === 'cra' && caseAPortee(q.x, q.z, porteeClasse(classe)); if (loin) { allerPuis(loin, () => chasserDeLoin(p, fin, true)); return; }
    const pres = voisins(p).filter((c) => PASSABLE[c.type]).sort((a, b) => Math.hypot(posCase(a).x - pp.x, posCase(a).z - pp.z) - Math.hypot(posCase(b).x - pp.x, posCase(b).z - pp.z))[0];
    allerPuis(pres || p, () => chasserDeLoin(p, fin, true)); return; /* une fois approche, il frappe d'ou il est */
  }
  chemin = []; arrivee = null; u.angle = Math.atan2(q.x - pp.x, q.z - pp.z);
  const cible = new T.Vector3(q.x, q.y + 0.6, q.z);
  u.attaque = { t: 0, classe, base: u.angle, tour: false, surFrappe: () => effetFrappe(classe, cible, fin) };
}
function chasserVoleur(parArbalete) {
  if (!voleur || voleur.etat === 'fuite' || voleur.etat === 'parti') return; /* (un voleur qui a deja vole se rattrape par blesserVoleur) */
  if (voleur.barre) { voleur.barre.remove(); voleur.barre = null; }
  voleur.etat = 'fuite'; voleur.pts = voleur.pts.slice(0, voleur.k + 1).reverse().concat([voleur.depart]); voleur.k = 0;
  gagnerXp(3); toast(typeof parArbalete === 'string' ? parArbalete : parArbalete ? 'Tchac ! L\'arbalète de la grange fait fuir le voleur de VSA.' + (rechargeAuto() ? '' : ' Pense à la recharger.') : 'Tu as chassé le voleur de VSA, il repart bredouille !', 'or'); retirerBulle('voleur'); sauver();
}
const voleurCiblable = () => voleur && (voleur.etat === 'approche' || voleur.etat === 'arrive' || (voleur.etat === 'fuite' && !!voleur.porte));
function voler() {
  const stocks = VENDABLES.filter((v) => (S_.grange[v.id] || 0) > 0).sort((a, b) => S_.grange[b.id] * prix(b.id) - S_.grange[a.id] * prix(a.id));
  if (stocks.length) {
    const v = stocks[0], f = forceVoleur(), n = Math.min(S_.grange[v.id], 12 + 4 * f, Math.max(1, Math.round(S_.grange[v.id] * Math.min(0.6, ((niv('cadenas') ? 0.15 : 0.3) + 0.004 * f) * (enRuine('grange') ? 2 : 1)))));
    S_.grange[v.id] -= n; toast('Le voleur de VSA a pris ' + n + ' ' + v.nom + ' dans ta grange : rattrape-le avant qu\'il quitte ta ferme !', 'alerte'); rendreGrange(); sauver();
    return { n, nom: v.nom, id: v.id };
  }
  return null;
}
function deplacerVoleur(dt, s) {
  if (!voleur) return;
  const v = voleur, m = v.m; v.t += dt;
  if (v.etat === 'arrive') { /* il apparait au bord de l'ile */
    m.scale.setScalar(Math.min(0.5, 0.5 * v.t / 0.4)); if (v.t >= 0.4) v.etat = 'approche';
  } else if (v.etat === 'parti') {
    m.scale.setScalar(Math.max(0.001, 0.5 * (1 - v.t / 0.4))); if (v.t >= 0.4) { jeter(m); if (v.barre) v.barre.remove(); voleur = null; retirerBulle('voleur'); } return;
  } else {
    const cible = v.pts[v.k];
    if (!cible) {
      if (v.etat === 'approche') { v.porte = voler(); if (v.porte) m.add(sacVole()); else { retirerBulle('voleur'); if (v.barre) { v.barre.remove(); v.barre = null; } } v.etat = 'fuite'; v.pts = v.pts.slice().reverse().concat([v.depart]); v.k = 0; }
      else { if (v.porte) { toast('Le voleur de VSA a quitté ta ferme avec ' + v.porte.n + ' ' + v.porte.nom + '.', 'alerte'); v.porte = null; } retirerBulle('voleur'); if (v.barre) { v.barre.remove(); v.barre = null; } v.etat = 'parti'; v.t = 0; }
    } else {
      const dx = cible.x - m.position.x, dz = cible.z - m.position.z, d = Math.hypot(dx, dz), vit = (v.etourdi > 0 && (v.etat !== 'fuite' || v.porte) ? 0 : 1) * (v.etat === 'fuite' ? (v.porte ? 1.1 : 2.2) : 1) * VITESSE_VOLEUR * (1 + 0.04 * Math.min(15, forceVoleur())) * dt; v.etourdi = Math.max(0, (v.etourdi || 0) - dt); /* sonne une demi-seconde a chaque coup */
      if (d <= vit) { m.position.x = cible.x; m.position.z = cible.z; v.k++; }
      else { m.position.x += dx / d * vit; m.position.z += dz / d * vit; let a = Math.atan2(dx, dz) - m.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); m.rotation.y += a * Math.min(1, dt * 8); }
      v.pas += vit * 4.6;
    }
  }
  const mb = m.userData.membres || [], amp = v.etat === 'approche' || v.etat === 'fuite' ? 1 : 0;
  if (mb[0]) mb[0].rotation.x = Math.sin(v.pas) * 0.62 * amp; if (mb[1]) mb[1].rotation.x = -Math.sin(v.pas) * 0.62 * amp;
  if (mb[2]) mb[2].rotation.x = -Math.sin(v.pas) * 0.45 * amp; if (mb[3]) mb[3].rotation.x = Math.sin(v.pas) * 0.45 * amp;
  m.rotation.x = v.etat === 'approche' ? 0.22 : 0.1; /* courbe, l'air louche */
  m.position.y = hauteurSol(m.position.x, m.position.z) + (1 - Math.cos(v.pas * 2)) * 0.01;
  if (v.barre) { v.barre.firstChild.style.width = (100 * Math.max(0, v.pv) / v.pvMax).toFixed(0) + '%'; versEcran(new T.Vector3(m.position.x, m.position.y + 2.05, m.position.z), v.barre); }
}
function rendreSauvage() {
  if (sauvageMesh) { scene.remove(sauvageMesh); sauvageMesh = null; }
  const p = S_.sauvage && S_.cases.find((c) => c.id === S_.sauvage.id);
  if (p) { const q = posCase(p); sauvageMesh = marquer(cloner('tofu'), p.id); sauvageMesh.userData.base = q.y; poser(sauvageMesh, q.x, q.y, q.z, 0.7); }
  rendreCasesBulles();
}
/* les Bouftous se promenent dans l'enclos : un point au hasard, ils s'y rendent en trottinant, broutent un moment, repartent */
const erre = [];
function cibleEnclos(k) {
  let c = null; const e = erre[k];
  for (let n = 0; n < 12; n++) {
    c = pointEnclos(e);
    const libre = Math.hypot(c.x - augePos.x, c.z - augePos.z) > 1.1 && dansEnclos(c.x, c.z) && erre.every((o, j) => j === k || !o || Math.hypot(c.x - (o.cible ? o.cible.x : o.x), c.z - (o.cible ? o.cible.z : o.z)) > 0.95);
    if (libre) break;
  }
  return c;
}
/* la marche des Bouftous (12/10/2026) : un pas a quatre temps, comme un mouton (arriere gauche, avant gauche, arriere droite, avant droite).
   La hanche balance d'avant en arriere (un angle positif ramene le sabot vers l'arriere : la patte pousse au sol) ; quand la patte revient
   vers l'avant, en l'air, le genou plie et le sabot se leve. L'amplitude suit la vitesse : a l'arret, les pattes sont droites. A la vitesse
   de marche, le sabot recule au sol d'a peu pres ce que le corps avance : il ne glisse pas */
const DEC_PATTES = [Math.PI / 2, Math.PI * 1.5, 0, Math.PI]; /* avant gauche, avant droite, arriere gauche, arriere droite */
function animerPattes(m, pas, f) {
  const u = m.userData, P = u.pattes;
  if (P) P.forEach((p, i) => { const ph = pas + DEC_PATTES[i]; p.hanche.rotation.x = Math.sin(ph) * 0.6 * f; p.genou.rotation.x = Math.max(0, -Math.cos(ph)) * 1.05 * f; });
  /* (le palier 8, 20/10/2026) les bras balancent a l'oppose des jambes, les petites ailes battent, la queue fouette, la larve ondule de la tete a la queue */
  if (u.bras) u.bras.forEach((b, i) => { if (b) b.rotation.x = -Math.sin(pas + DEC_PATTES[i]) * 0.45 * f; });
  if (u.ailes) u.ailes.forEach((a, i) => { if (a) a.rotation.z = (i ? -1 : 1) * (0.1 + Math.sin(pas * 3) * (0.1 + 0.15 * f)); });
  if (u.queue) u.queue.rotation.y = Math.sin(pas * 0.9) * 0.25;
  if (u.anneaux) u.anneaux.forEach((o, i) => { o.position.y = o.userData.y0 + Math.max(0, Math.sin(pas * 1.3 - i * 0.9)) * 0.08 * Math.max(0.3, f); });
  if (u.tete) u.tete.rotation.x = Math.sin(pas * 1.3 + 0.6) * 0.08;
}
function errer(dt, s) {
  bouftousMesh.forEach((m, k) => {
    const e = m.userData.erre; if (!e) return;
    const affame = S_.bouftous[k] && Date.now() >= S_.bouftous[k].rassasie;
    e.v = e.v || 0; e.pas = e.pas || 0;
    let voulue = 0;
    if (e.pause > 0) { e.pause -= dt; m.rotation.x += ((Math.sin(s * 1.8 + k) > 0.3 ? 0.07 : 0) - m.rotation.x) * Math.min(1, dt * 3); } /* il broute : la tete descend doucement */
    else {
      if (!e.cible) e.cible = cibleEnclos(k);
      const dx = e.cible.x - e.x, dz = e.cible.z - e.z, d = Math.hypot(dx, dz);
      if (d < 0.15) { e.cible = null; e.pause = 1.5 + Math.random() * (affame ? 1.5 : 4); }
      else {
        let diff = Math.atan2(dx, dz) - e.ry; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        e.ry += diff * Math.min(1, dt * 3);
        voulue = (affame ? 0.8 : 1.15) * Math.max(0, Math.cos(diff)) * Math.min(1, d / 0.5); /* il ralentit en tournant et en arrivant */
        m.rotation.x += (0 - m.rotation.x) * Math.min(1, dt * 4);
      }
    }
    e.v += (voulue - e.v) * Math.min(1, dt * 3); /* vitesse lissee : pas d'a-coups */
    if (e.v > 0.001) { const nx = e.x + Math.sin(e.ry) * e.v * dt, nz = e.z + Math.cos(e.ry) * e.v * dt; if (dansEnclos(nx, nz) || !dansEnclos(e.x, e.z)) { e.x = nx; e.z = nz; } else { e.v = 0; e.cible = null; } } /* jamais a travers la cloture */
    e.pas += e.v * dt * 9;
    m.rotation.y = e.ry; m.rotation.z = Math.sin(e.pas) * 0.03 * Math.min(1, e.v * 1.5); /* un leger balancement de cote a cote, pas de sauts */
    animerPattes(m, e.pas, Math.min(1, e.v * 1.6));
    if (S_.bouftous[k] && S_.bouftous[k].ne) { const t = 0.5 * (0.55 + 0.45 * croissance(S_.bouftous[k])); if (Math.abs(t - m.userData.taille) > 0.002) { m.userData.taille = t; m.scale.setScalar(t); } }
    const sol = caseIci(e.x, e.z); m.position.set(e.x, (sol ? posCase(sol).y : 0) + (1 - Math.cos(e.pas * 2)) * 0.012 * Math.min(1, e.v * 1.5), e.z);
    const b = bullesDyn.get('b' + k); if (b) b._point = [e.x, 1.6, e.z];
  });
}
/* un Bouftou des vagues : le modele de la ferme, dans un groupe (le combat reecrit l'echelle du monstre a chaque image : celle du Bouftou reste dedans) */
/* le Boufcoul, l'invocation du Koulosse (choisi par Mathieu le 15/10/2026) : notre Bouftou, la laine en trois bandes de l'arriere vers l'avant (rouge, jaune,
   vert sur la tete), cornes brunes, pattes et sabots prune sombre, visage clair */
const TEINTES_BOUFCOUL = { '34506a': '#3e2a36', '7a6e45': '#5c4049', '746538': '#c49a72', '5f5233': '#a87e5a' }; /* sabots, pattes, museau, paupieres */
const fabriquerBoufcoul = () => copieGabarit('boufcoul', construireBoufcoul), fabriquerBouftou = () => copieGabarit('bouftou', construireBouftou); /* (fabriques une fois, copies ensuite, 16/10/2026) */
function construireBoufcoul() {
  const b0 = creerBouftou(T, maille, { laine: '#ff00ff', cornes: '#9a6a3a', corneTip: '#c8955a', peau: '#dcb890' }); b0.updateMatrixWorld(true); const v = new T.Vector3();
  b0.traverse((o) => { if (!o.isMesh || !o.material || !o.material.color || o.material.side === T.BackSide) return; const hex = o.material.color.getHexString();
    if (hex === 'ff00ff') { o.getWorldPosition(v); o.material = o.material.clone(); o.material.color.set(v.z > 0.05 ? '#8fd34a' : v.z > -0.6 ? '#f6c62e' : '#e0322c'); }
    else if (TEINTES_BOUFCOUL[hex]) { o.material = o.material.clone(); o.material.color.set(TEINTES_BOUFCOUL[hex]); } });
  return emballerBouftou(fusionnerBouftou(b0));
}
function construireBouftou() { return emballerBouftou(fusionnerBouftou(creerBouftou(T, maille, {}))); }
function emballerBouftou(b) { /* dans un groupe (le combat reecrit l'echelle du monstre a chaque image : celle du Bouftou reste dedans) ; ses pattes sur le groupe */
  b.scale.setScalar(0.55); const g = new T.Group(); g.add(b); g.updateMatrixWorld(true);
  const bo = new T.Box3().setFromObject(b); g.userData.hauteur = bo.max.y - bo.min.y; g.userData.pattes = b.userData.pattes; delete b.userData.pattes; return g;
}
function rendreBouftous() {
  bouftousMesh.forEach((b) => scene.remove(b)); bouftousMesh = [];
  S_.bouftous.forEach((b, k) => {
    const [dx, dz, ry] = SLOTS_BOUFTOUS[k % SLOTS_BOUFTOUS.length];
    const e = erre[k] || (erre[k] = Object.assign(pointEnclos(), { ry, cible: null, pause: Math.random() * 3 })); /* on garde sa place quand on le redessine */
    const m = fusionnerBouftou(creerBouftou(T, maille, b.noir ? { laine: '#3a3440', peau: '#4d4436', cornes: '#c9a34a', corneTip: '#f2d27a' } : {})); ombrePieds(m, 2.4); /* fusionne : 108 pieces -> une douzaine */ m.userData.taille = 0.5 * (0.55 + 0.45 * croissance(b)); m.scale.setScalar(m.userData.taille); if (b.gestation) { m.scale.x *= 1.16; m.scale.z *= 1.16; m.userData.ronde = true; } /* la future maman s'arrondit */ poser(m, e.x, 0, e.z, e.ry); m.userData.erre = e;
    m.traverse((o) => { o.userData.bouftou = k; }); m.userData.base = enclosDef.z + dz; bouftousMesh.push(m);
  });
  rendreEnclosBulles();
}

