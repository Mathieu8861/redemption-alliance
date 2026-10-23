'use strict';
/* ----- le paysan marche jusqu'a la case touchee, puis agit ----- */
const PASSABLE = { libre: true, champ: true, chemin: true }; /* on contourne le foin et l'epouvantail, comme les batiments */
function voisins(p) { /* les quatre cases qui touchent celle-ci (l'ile ronde : une seule grille, plus de muret) */
  const L = []; for (const [di, dj] of COTES) { const c = caseAt(p.i + di, p.j + dj); if (c) L.push(c); } return L;
}
const blocDe = (cible) => ['grange', 'hdv', 'enclos', 'voliere', 'geliere'].includes(cible.type) ? S_.cases.filter((c) => c.type === cible.type && c.terrain === cible.terrain) : [cible];
function trajet(depart, cible) {
  /* BFS sur les cases, on s'arrete sur la cible si on peut y marcher, sinon sur une case voisine */
  const but = PASSABLE[cible.type] ? cible : null, bloc = blocDe(cible); /* un batiment de plusieurs cases s'aborde par n'importe laquelle */
  const file = [depart], vu = new Map([[depart.id, null]]);
  while (file.length) {
    const c = file.shift();
    if (c === but || (!but && PASSABLE[c.type] && voisins(c).some((v) => bloc.includes(v)))) { const ch = []; let k = c; while (k) { ch.unshift(k); k = vu.get(k.id); } return ch; }
    voisins(c).forEach((v) => { if (!vu.has(v.id) && PASSABLE[v.type]) { vu.set(v.id, c); file.push(v); } });
  }
  return trajetCoupe(depart, cible, but, bloc);
}
/* aucun chemin libre (un placement a ferme l'acces) : il coupe a travers, mais par le plus petit obstacle (foin, epouvantail avant un batiment), jamais par le vide */
const COUT_TRAVERSE = { foin: 6, epouvantail: 6, leurre: 6, arbre: 12 };
function trajetCoupe(depart, cible, but, bloc) {
  const cout = new Map([[depart.id, 0]]), prec = new Map([[depart.id, null]]), ouverts = [depart], fait = new Set();
  while (ouverts.length) {
    let k = 0; ouverts.forEach((c, i) => { if (cout.get(c.id) < cout.get(ouverts[k].id)) k = i; });
    const c = ouverts.splice(k, 1)[0]; if (fait.has(c.id)) continue; fait.add(c.id);
    if (c === but || (!but && PASSABLE[c.type] && voisins(c).some((v) => bloc.includes(v)))) { const ch = []; let x = c; while (x) { ch.unshift(x); x = prec.get(x.id); } return ch; }
    voisins(c).forEach((v) => {
      const d = cout.get(c.id) + (PASSABLE[v.type] ? 1 : (COUT_TRAVERSE[v.type] || 40));
      if (!fait.has(v.id) && d < (cout.has(v.id) ? cout.get(v.id) : Infinity)) { cout.set(v.id, d); prec.set(v.id, c); ouverts.push(v); }
    });
  }
  return null;
}
/* LE PERSO MARCHE AUSSI EN DIAGONALE (23/10/2026, « faudrait qu'on integre les deplacements en diagonale en vrai, qu'on soit plus trop limite et qu'on
   fluidifie encore les deplacements », Mathieu) : son trajet passe par les huit cases voisines, une diagonale seulement si les deux cases qu'elle
   frole sont praticables (il ne coupe pas l'angle d'un batiment). Les monstres, les voleurs et le gardien gardent leur trajet en quatre directions */
const COINS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
function coinLibre(a, b) { const di = b.i - a.i, dj = b.j - a.j; if (Math.abs(di) !== 1 || Math.abs(dj) !== 1) return false; const x = caseAt(a.i + di, a.j), y = caseAt(a.i, a.j + dj); return !!(x && y && PASSABLE[x.type] && PASSABLE[y.type]); }
function voisinsMarche(p) {
  const L = []; for (const [di, dj] of COTES) { const c = caseAt(p.i + di, p.j + dj); if (c && PASSABLE[c.type]) L.push([c, 1]); }
  for (const [di, dj] of COINS) { const c = caseAt(p.i + di, p.j + dj); if (c && PASSABLE[c.type] && coinLibre(p, c)) L.push([c, Math.SQRT2]); }
  return L;
}
function trajetPerso(depart, cible) {
  const but = PASSABLE[cible.type] ? cible : null, bloc = blocDe(cible);
  const cout = new Map([[depart.id, 0]]), prec = new Map([[depart.id, null]]), ouverts = [depart], fait = new Set();
  while (ouverts.length) {
    let k = 0; ouverts.forEach((c, i) => { if (cout.get(c.id) < cout.get(ouverts[k].id)) k = i; });
    const c = ouverts.splice(k, 1)[0]; if (fait.has(c.id)) continue; fait.add(c.id);
    if (c === but || (!but && PASSABLE[c.type] && voisins(c).some((v) => bloc.includes(v)))) { const ch = []; let x = c; while (x) { ch.unshift(x); x = prec.get(x.id); } return ch; }
    for (const [v, pas] of voisinsMarche(c)) { const d = cout.get(c.id) + pas; if (!fait.has(v.id) && d < (cout.has(v.id) ? cout.get(v.id) : Infinity)) { cout.set(v.id, d); prec.set(v.id, c); ouverts.push(v); } }
  }
  return trajetCoupe(depart, cible, but, bloc);
}
/* le point exact touche dans la case (un clic qui deplace seulement) : il y va, au lieu du centre de la case. Pose par le clic, lu par allerPuis */
let pointVise = null;
function pointDansCase(c, p) { const q = posCase(c), m = S / 2 - 0.35; return { x: Math.max(q.x - m, Math.min(q.x + m, p.x)), z: Math.max(q.z - m, Math.min(q.z + m, p.z)) }; }
function paysanAdjacent(cible) { const c = paysanMesh.userData.cellule, bloc = blocDe(cible); return c && (bloc.includes(c) || voisins(c).some((v) => bloc.includes(v))); }
/* le trajet : chemin de cases (BFS), puis lisse en lignes droites quand rien ne bloque, arret au bord du champ ou devant le batiment */
const VITESSE = 5.6, VITESSE_CRA = 1.15, vitesse = () => VITESSE * (niv('bottes') ? 1.3 : 1) * (combat && combat.citron ? VITESSE_CITRON : 1) * (classeDe() === 'cra' ? VITESSE_CRA : 1) * (combat && combat.lenteur > 0 ? 0.55 : 1); /* (ralenti par une Momie Koalak) */ /* (le Cra court 15 % plus vite : plus fragile, il recule pour garder ses distances, c'est au joueur de le faire) */
function hauteurSol() { return 0; } /* l'ile ronde est plate */
function caseSous(x, z) { return caseAt(Math.round(x / S + (COLS - 1) / 2), Math.round(z / S + (ROWS - 1) / 2)); }
function ligneLibre(a, b) {
  /* on avance par petits pas sur la ligne et de part et d'autre (la largeur du perso) : que des cases praticables, et jamais a travers le muret */
  const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz); if (L < 0.01) return true;
  const nx = -dz / L, nz = dx / L; let prec = caseSous(a.x, a.z);
  for (let t = 0; t <= L + 0.001; t += 0.25) {
    for (const o of [0, -0.3, 0.3]) {
      const x = a.x + dx * Math.min(t, L) / L + nx * o, z = a.z + dz * Math.min(t, L) / L + nz * o, c = caseSous(x, z);
      if (!c || !PASSABLE[c.type]) return false;
      if (o === 0) { if (prec && c !== prec && !voisins(prec).includes(c) && !coinLibre(prec, c)) return false; prec = c; } /* (en diagonale par un coin : les deux cases a cote doivent etre praticables) */
    }
  }
  return true;
}
function allerPuis(cible, fn) {
  const u = paysanMesh.userData, ici = caseSous(paysanMesh.position.x, paysanMesh.position.z);
  let depart = (ici && PASSABLE[ici.type] && (u.cellule ? u.cellule.terrain === 'main' : true)) ? ici : (u.cellule || S_.cases[0]);
  if (!PASSABLE[depart.type]) depart = voisins(depart).find((v) => PASSABLE[v.type]) || depart;
  const vise = pointVise && pointVise.c === cible.id && PASSABLE[cible.type] ? pointDansCase(cible, pointVise) : null; pointVise = null;
  if (vise && depart === cible) { if (Math.hypot(vise.x - paysanMesh.position.x, vise.z - paysanMesh.position.z) > 0.05) { chemin = [{ c: cible, x: vise.x, z: vise.z }]; arrivee = { cible, fn, vise }; return; } }
  if (depart === cible || (!PASSABLE[cible.type] && voisins(depart).some((v) => blocDe(cible).includes(v)) && !chemin.length)) { chemin = []; arrivee = null; u.cellule = depart; if (!vise) regarder(posCase(cible)); fn(); return; }
  const ch = trajetPerso(depart, cible), pc = posCase(cible);
  if (!ch) { chemin = []; arrivee = null; regarder(pc); fn(); return; } /* sans chemin (ne devrait plus arriver) : il agit d'ou il est, jamais a travers les batiments ou le vide */
  /* ou s'arreter : devant un batiment (un peu vers lui), au bord d'un champ (cote d'ou l'on vient), sinon au centre de la case */
  const fin = ch[ch.length - 1], pf = posCase(fin); let cellFin = fin, pt = { x: pf.x, z: pf.z };
  if (fin !== cible) { const t = posCase(blocDe(cible).find((v) => voisins(fin).includes(v)) || cible); pt = { x: pf.x + (t.x - pf.x) * 0.3, z: pf.z + (t.z - pf.z) * 0.3 }; }
  else if (vise) pt = { x: vise.x, z: vise.z };
  else if (cible.type === 'champ' && ch.length >= 2) { cellFin = ch[ch.length - 2]; const pv = posCase(cellFin); pt = { x: pc.x + (pv.x - pc.x) * 0.62, z: pc.z + (pv.z - pc.z) * 0.62 }; }
  let pts = ch.slice(1, ch.indexOf(cellFin) + 1).map((c) => ({ c, x: posCase(c).x, z: posCase(c).z }));
  if (pts.length) pts[pts.length - 1] = { c: cellFin, x: pt.x, z: pt.z }; else pts = [{ c: cellFin, x: pt.x, z: pt.z }];
  if (depart.terrain === 'main') { /* lissage : depuis ou l'on est, on vise le point le plus loin qu'on atteint en ligne droite */
    const lisse = []; let cur = { x: paysanMesh.position.x, z: paysanMesh.position.z }, k = 0;
    while (k < pts.length) { let j = pts.length - 1; while (j > k && !ligneLibre(cur, pts[j])) j--; lisse.push(pts[j]); cur = pts[j]; k = j + 1; }
    pts = lisse;
  }
  chemin = pts; arrivee = { cible, fn, vise };
}
function regarder(pt) { const dx = pt.x - paysanMesh.position.x, dz = pt.z - paysanMesh.position.z; if (Math.hypot(dx, dz) > 0.05) paysanMesh.userData.angle = Math.atan2(dx, dz); }
function hancheDe(g) { const p = (g.userData.membres || [])[0]; if (!p) return 0.3; g.updateMatrixWorld(true); return Math.max(0.1, p.getWorldPosition(new T.Vector3()).y - g.position.y); } /* la hauteur de la hanche au-dessus des pieds */
function animerPas(u, dt, cible) {
  u.ampl = (u.ampl || 0) + (cible - (u.ampl || 0)) * Math.min(1, dt * 8); /* l'amplitude monte au depart et retombe a l'arret */
  const a = u.ampl, ph = u.pas || 0, m = u.membres || [];
  if (a < 0.01 && u.pas) u.pas = Math.round(u.pas / Math.PI) * Math.PI; /* a l'arret, les jambes se rejoignent */
  if (m[0]) m[0].rotation.x = Math.sin(ph) * 0.62 * a; if (m[1]) m[1].rotation.x = -Math.sin(ph) * 0.62 * a;
  /* une marche plus souple (23/10/2026, « faut ameliorer la fluidite des deplacements », Mathieu) : les bras suivent avec un petit retard, le haut du corps
     tourne un peu a l'inverse des hanches, et le genou plie quand la jambe passe en avant (les modeles qui en ont un : l'Osa refait) */
  if (m[2]) m[2].rotation.x = -Math.sin(ph - 0.3) * 0.48 * a; if (m[3]) m[3].rotation.x = Math.sin(ph - 0.3) * 0.48 * a;
  const g = u.genoux || []; if (g[0]) g[0].rotation.x = Math.pow(Math.max(0, -Math.cos(ph)), 1.3) * 0.95 * a; if (g[1]) g[1].rotation.x = Math.pow(Math.max(0, Math.cos(ph)), 1.3) * 0.95 * a;
  if (u.haut) u.haut.rotation.y = -Math.sin(ph) * 0.1 * a;
  paysanMesh.rotation.z = Math.sin(ph) * 0.03 * a; paysanMesh.rotation.x = 0.08 * a; /* leger balancement, penche un peu en avant en marchant */
}
function marcher(dt, s) {
  if (combat && combat.agrippe > 0) combat.agrippe -= dt; /* agrippe par un monstre qui lui a saute dessus : il marche deux fois moins vite */
  if (combat && combat.deroute != null) return; /* a terre, il ne marche plus */
  if (combat && combat.assomme > 0) return; /* assomme : il ne bouge plus un instant */
  if (combat && combat.colle > 0) return; /* colle dans la boue du Dragon Cochon, ou menotte par le Don Dorgan : il ne marche plus, il frappe encore (20/10/2026) */
  if (!paysanMesh) return;
  if (lieu === 'casino') { majCasino(dt); return; }
  const u = paysanMesh.userData;
  if (u.angle !== undefined) { let d = u.angle - paysanMesh.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); paysanMesh.rotation.y += d * Math.min(1, dt * 10); } /* il tourne en douceur */
  if (!chemin.length) {
    u.marche = 0; animerPas(u, dt, 0); paysanMesh.position.y += ((u.y || 0) - paysanMesh.position.y) * Math.min(1, dt * 12);
    if (arrivee) { const a = arrivee; arrivee = null; if (!a.vise) regarder(posCase(a.cible)); a.fn(); sauver(); } /* (arrive au point touche, il garde la direction de sa marche) */
    if (fileActions.length && !arrivee && !chemin.length) enchainer(); /* la tache suivante de la file */
    return;
  }
  { /* les virages s'arrondissent : pres d'un point de passage, des que le suivant se voit en ligne droite, il file directement vers lui (23/10/2026) */
    const px = paysanMesh.position.x, pz = paysanMesh.position.z;
    if (chemin.length >= 2 && Math.hypot(chemin[0].x - px, chemin[0].z - pz) < 0.9 && ligneLibre({ x: px, z: pz }, chemin[1])) { const ici = caseSous(px, pz); if (ici && PASSABLE[ici.type]) u.cellule = ici; chemin.shift(); }
  }
  const e = chemin[0], px = paysanMesh.position.x, pz = paysanMesh.position.z, dx = e.x - px, dz = e.z - pz, d = Math.hypot(dx, dz);
  let reste = d; for (let k = 1; k < chemin.length; k++) reste += Math.hypot(chemin[k].x - chemin[k - 1].x, chemin[k].z - chemin[k - 1].z);
  u.marche = Math.min(1, (u.marche || 0) + dt * 3); /* il accelere au depart et ralentit a l'arrivee */
  const v = vitesse() * (combat && combat.agrippe > 0 ? 0.5 : 1) * u.marche * Math.max(0.35, Math.min(1, reste / 0.7)) * dt;
  if (d > 0.001) u.angle = Math.atan2(dx, dz);
  let nx, nz;
  if (d <= v) { nx = e.x; nz = e.z; u.cellule = e.c; chemin.shift(); } else { nx = px + dx / d * v; nz = pz + dz / d * v; }
  u.y = hauteurSol(nx, nz, e.c); u.pas = (u.pas || 0) + v * 4.6; /* une foulee complete tous les 1,4 de distance */
  animerPas(u, dt, Math.min(1, v / (vitesse() * dt)));
  if (lieu === 'ile' && ileBoss) { const q = bornerIle(nx, nz); if (Math.hypot(q[0] - nx, q[1] - nz) > 0.001) { u.bute = Math.hypot(e.x - q[0], e.z - q[1]) > d - v * 0.3 ? (u.bute || 0) + dt : 0; if (u.bute > 0.35 && chemin.length) { chemin.shift(); u.bute = 0; } } else u.bute = 0; nx = q[0]; nz = q[1]; } /* (l'ile des boss : il bute sur le bord et glisse le long du decor ; bloque net, il s'arrete) */
  /* le bassin descend quand les jambes s'ecartent, juste de quoi garder le pied d'appui au sol (des jambes raides qui pivotent levaient les deux pieds),
     et remonte un peu quand elles se croisent (23/10/2026 : c'etait l'inverse, il flottait a chaque grand pas) */
  const hh = u.hanche || (u.hanche = hancheDe(paysanMesh));
  paysanMesh.position.set(nx, u.y - hh * (1 - Math.cos(0.62 * u.ampl * Math.sin(u.pas))) + (1 + Math.cos(u.pas * 2)) * 0.006 * u.ampl, nz);
}

/* ----- bulles HTML accrochees a la scene ----- */
const zoneBulles = document.getElementById('bulles');
const icoB = (nom) => '<img src="assets/icones/' + nom + '.png?v=' + VERSION_MODELES + '" alt="">'; /* une icone de bulle, tiree de nos modeles */
const bullesDyn = new Map();
/* une bulle d'action : une icone (et un petit nombre) au-dessus d'une case ; la toucher agit sur cette case */
function bulle(cle, icone, genre, point, cible, nombre, titre) {
  let e = bullesDyn.get(cle);
  if (!e) { e = document.createElement('div'); zoneBulles.appendChild(e); bullesDyn.set(cle, e); }
  const cls = 'bulle ico ' + (genre || ''), html = icone + (nombre ? '<small>' + nombre + '</small>' : ''); /* rien n'est refait si rien ne change : sur tablette, l'image refaite clignotait */
  if (e.className !== cls) e.className = cls; if (e._html !== html) { e.innerHTML = html; e._html = html; } if (e.dataset.info !== (titre || '')) { e.dataset.info = titre || ''; e.setAttribute('aria-label', titre || ''); }
  e._point = point; e.dataset.cible = cible || ''; e.hidden = false;
}
function retirerBulle(cle) { const e = bullesDyn.get(cle); if (e) { e.remove(); bullesDyn.delete(cle); } }
/* l'infobulle : plus celle du navigateur (attribut title, jaune pale et sans style) mais une etiquette aux couleurs du jeu,
   pour tout element qui porte data-info ; a la souris seulement (au doigt, le survol n'existe pas) */
const infobulle = document.createElement('div'); infobulle.id = 'infobulle'; infobulle.setAttribute('role', 'tooltip'); document.body.appendChild(infobulle);
let infoCible = null, infoMinuteur = 0;
function cacherInfo() { clearTimeout(infoMinuteur); infoCible = null; infobulle.classList.remove('vue'); }
function placerInfo(el) {
  infobulle.textContent = el.dataset.info; const r = el.getBoundingClientRect(), w = infobulle.offsetWidth, h = infobulle.offsetHeight;
  const haut = document.querySelector('.haut'), plafond = haut && haut.offsetParent && !haut.contains(el) ? haut.getBoundingClientRect().bottom + 6 : 8; /* jamais sur la barre des kamas */
  let y = r.top - h - 8; if (y < plafond) y = r.bottom + 8;
  infobulle.style.left = Math.round(Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))) + 'px'; infobulle.style.top = Math.round(y) + 'px';
}
document.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return; const el = e.target.closest ? e.target.closest('[data-info]') : null;
  if (el === infoCible) return; cacherInfo(); if (!el || !el.dataset.info) return;
  infoCible = el; infoMinuteur = setTimeout(() => { if (infoCible !== el || !el.isConnected) return; placerInfo(el); infobulle.classList.add('vue'); }, 400);
});
document.addEventListener('pointerout', (e) => { if (infoCible && !(e.relatedTarget && infoCible.contains(e.relatedTarget))) cacherInfo(); });
['pointerdown', 'wheel'].forEach((t) => document.addEventListener(t, cacherInfo, { capture: true, passive: true }));
setInterval(() => { /* la bulle a disparu sous la souris, ou son texte a change (un compte a rebours) */
  if (!infoCible) return; if (!infoCible.isConnected || infoCible.hidden || !infoCible.dataset.info) { cacherInfo(); return; }
  if (infobulle.classList.contains('vue') && infobulle.textContent !== infoCible.dataset.info) placerInfo(infoCible);
}, 250);
zoneBulles.addEventListener('click', actionBulle);
zoneBulles.addEventListener('contextmenu', (ev) => { if (ev.target.closest('.bulle.ico')) actionBulle(ev); }); /* la bulle est posee sur la case : le clic droit y agit aussi (avant, rien) */
function actionBulle(ev) {
  const e = ev.target.closest('.bulle.ico'); if (!e || !e.dataset.cible || enAccueil || combat) return;
  const [genre, val] = e.dataset.cible.split(':');
  if (genre === 'champ') { /* tout un champ : la case la plus proche d'abord, puis de proche en proche ; le reste va dans la file */
    const pp = paysanMesh.position, L = val.split(',').map((id) => S_.cases.find((c) => c.id === id)).filter(Boolean), ordre = []; let x = pp.x, z = pp.z;
    while (L.length) { let k = 0; L.forEach((c, i) => { const a = posCase(c), b = posCase(L[k]); if (Math.hypot(a.x - x, a.z - z) < Math.hypot(b.x - x, b.z - z)) k = i; }); const c = L.splice(k, 1)[0]; ordre.push(c.id); x = posCase(c).x; z = posCase(c).z; }
    const neufs = ordre.filter((id) => !fileActions.includes(id)); e.classList.add('file'); son('plouf');
    if ((arrivee || chemin.length) && !mode) { fileActions.push(...neufs.slice(0, Math.max(0, 40 - fileActions.length))); return; }
    const [premier, ...reste] = neufs; fileActions.push(...reste.slice(0, Math.max(0, 40 - fileActions.length))); if (premier) ACTIONS.toucherCase(premier); sauver(); return;
  }
  if (genre === 'case' && (arrivee || chemin.length) && !mode) { if (!fileActions.includes(val) && fileActions.length < 10) { fileActions.push(val); e.classList.add('file'); son('plouf'); } return; } /* il travaille deja : en file */
  if (genre === 'case') ACTIONS.toucherCase(val); else if (genre === 'bouftou') toucherBouftou(parseInt(val, 10)); else if (genre === 'voleur') attaquerVoleur(); else if (genre === 'arbalete') { const g = S_.cases.find((c) => c.type === 'grange'); allerPuis(g, () => ACTIONS.recharger()); }
  sauver();
}
function rendreEnclosBulles() {
  S_.bouftous.forEach((b, k) => {
    const [dx, dz] = SLOTS_BOUFTOUS[k % SLOTS_BOUFTOUS.length]; const e = erre[k]; const pt = e ? [e.x, 1.6, e.z] : [enclosDef.x + dx * 0.9, 1.9, enclosDef.z + dz * 0.8];
    if (Date.now() >= b.rassasie) bulle('b' + k, icoB('ble'), 'rouge', pt, 'bouftou:' + k, '', b.nom + ' a faim : touche pour le nourrir');
    else if (b.laine >= laineMax()) bulle('b' + k, icoB('laine'), 'or', pt, 'bouftou:' + k, b.laine, 'Laine prête : touche pour tondre ' + b.nom);
    else if (b.gestation) { const r = Math.max(0, b.gestation.fin - Date.now()); bulle('b' + k, icoB('bouftou'), 'rose', pt, 'bouftou:' + k, r < 60000 ? '< 1 min' : Math.ceil(r / 60000) + ' min', b.nom + ' attend un petit : il naît dans ' + dureeLisible(r)); }
    else retirerBulle('b' + k);
  });
  for (let k = S_.bouftous.length; k < 6; k++) retirerBulle('b' + k);
}
/* UNE BULLE PAR CHAMP (23/10/2026, « les petites bulles, ca fait fouillis », Mathieu, puis « on teste la bulle de BD ») : les cases voisines pretes de la
   meme culture, ou a sec, ne font qu'une bulle, posee au milieu du champ, avec le total de la recolte ; la toucher fait tout le champ, case apres case */
function groupesChamps() {
  const M = new Map(), etat = (c) => (c.type !== 'champ' || !c.c || c.tofu ? null : etape(c) === 'mur' ? 'mur:' + c.c : !c.arrose ? 'sec' : null);
  S_.cases.forEach((c0) => {
    const e0 = etat(c0); if (!e0 || M.has(c0.id)) return; const G = [c0], vu = new Set([c0.id]);
    for (let k = 0; k < G.length; k++) voisins(G[k]).forEach((v) => { if (!vu.has(v.id) && etat(v) === e0) { vu.add(v.id); G.push(v); } });
    const x = G.reduce((t, c) => t + posCase(c).x, 0) / G.length, z = G.reduce((t, c) => t + posCase(c).z, 0) / G.length, d = (c) => Math.hypot(posCase(c).x - x, posCase(c).z - z);
    const g = { cases: G, garde: G.slice().sort((a, b) => d(a) - d(b))[0], x, z, mur: e0 !== 'sec', total: e0 !== 'sec' ? G.reduce((t, c) => t + recolte(c), 0) : 0 };
    G.forEach((c) => M.set(c.id, g));
  });
  return M;
}
function rendreCasesBulles() {
  const groupes = groupesChamps();
  S_.cases.forEach((p) => {
    const cle = 'c' + p.id, pos = posCase(p);
    if (S_.sauvage && S_.sauvage.id === p.id) { bulle(cle, peutCapturer() ? icoB('filet') : icoB('tofu'), 'rouge', [pos.x, pos.y + 1.5, pos.z], 'case:' + p.id, '', peutCapturer() ? 'Un Tofu sauvage : touche pour le capturer au filet' : S_.filets ? 'Un Tofu sauvage : ta volière est pleine, touche pour le chasser' : 'Un Tofu sauvage : touche pour le chasser'); return; }
    if (p.type === 'puits') { if (niv('arrosoir') && !(S_.citerne > 0) && !enRuine('puits') && !combat) bulle(cle, icoB('arrosoir'), 'eau', [pos.x, pos.y + 2.4, pos.z], 'case:' + p.id, '0', 'Citerne vide : touche le puits pour la remplir'); else retirerBulle(cle); return; }
    if (p.type === 'voliere') { if (S_.voliere.plumes && p === S_.cases.find((c) => c.type === 'voliere')) bulle(cle, icoB('plume'), 'or', [pos.x, ancres.voliere ? ancres.voliere.y + 0.95 : pos.y + 3.4, pos.z], 'case:' + p.id, S_.voliere.plumes, 'Plumes de Tofu à ramasser'); else retirerBulle(cle); return; }
    if (p.type === 'geliere') { const o = blocBati('geliere'), n = potsPretsGeliere(), faim = (S_.gelees || []).some((g) => etatGelee(g) === 'faim' && !manqueRecette(GELEES[g.c].recette).length); if (o && p === o.c0 && !combat && (n || faim)) bulle(cle, icoB(n ? 'pot-petit' : 'gelee-bleue'), n ? 'or' : 'eau', [o.x, o.y + 2.2, o.z], 'case:' + p.id, n ? '×' + n : '', n ? 'Pots de gelée prêts : touche pour les ramasser' : 'Tes Gelées ont faim : touche pour les nourrir'); else retirerBulle(cle); return; }
    if (p.type === 'leurre') { if (S_.leurreWabbit && !combat) bulle(cle, icoB('wabbit'), 'rouge', [pos.x, pos.y + 1.8, pos.z], 'case:' + p.id, '', niv('leurre') >= 3 ? 'Un Wabbit pris au panier : touche pour le relâcher' : 'Un Wabbit ronge la fausse Cawotte : touche pour le chasser'); else retirerBulle(cle); return; }
    if (p.type !== 'champ' || !p.c) { retirerBulle(cle); return; }
    const st = etape(p), haut = pos.y + (st === 'mur' ? 1.9 : st === 'pousse' ? 1.4 : 0.9);
    if (p.tofu) { const w = p.nuisible === 'wabbit'; bulle(cle, capturable(p) ? icoB('filet') : icoB(w ? 'wabbit' : 'tofu'), 'rouge', [pos.x, haut + 0.4, pos.z], 'case:' + p.id, '', w ? 'Un Wabbit grignote : touche pour le chasser' : capturable(p) ? 'Un Tofu picore : touche pour le chasser ou le capturer' : 'Un Tofu picore : touche pour le chasser'); }
    else if (st === 'mur' || !p.arrose) {
      const G = groupes.get(p.id); if (!G || G.garde !== p) { retirerBulle(cle); return; } const n = G.cases.length, cible = n > 1 ? 'champ:' + G.cases.map((c) => c.id).join(',') : 'case:' + p.id;
      if (G.mur) bulle(cle, icoB(p.c), 'or', [G.x, haut, G.z], cible, '×' + G.total, PAR_ID[p.c].nom + ' prêt' + (n > 1 ? ' sur ' + n + ' cases : touche pour tout récolter' : ' : touche pour récolter'));
      else bulle(cle, icoB('arrosoir'), 'eau', [G.x, haut, G.z], cible, n > 1 ? '×' + n : '', n > 1 ? n + ' cases à sec : touche pour tout arroser' : 'À sec : touche pour arroser');
    }
    else retirerBulle(cle);
  });
}
const vec = new T.Vector3();
function placerBulles() { /* a chaque image : chaque bulle au-dessus de son point 3D */
  const w = innerWidth, h = innerHeight, placer = (e, x, y, z) => { vec.set(x, y, z).project(camera); e._top = +((1 - vec.y) / 2 * h).toFixed(1); e.style.left = ((vec.x + 1) / 2 * w).toFixed(1) + 'px'; e.style.top = e._top + 'px'; };
  bullesDyn.forEach((e) => { const p = e._point; if (p) placer(e, p[0], p[1], p[2]); });
  document.querySelectorAll('[data-ancre]').forEach((e) => { const a = ancres[e.dataset.ancre]; if (!a) { e.hidden = true; return; } e.hidden = false; placer(e, a.x, a.y + (e.classList.contains('lieu') ? 1.2 : 0), a.z); }); /* (le nom au-dessus du toit, il ne cache plus rien) */
  /* un nom de batiment qui tombe sur une bulle d'action (plumes, arbalete, voleur...) remonte juste au-dessus d'elle ; toutes les mesures d'abord (une seule mise
     en page par image, 16/10/2026 : avant, une par mesure apres chaque deplacement), puis les deplacements, calcules a partir de ces mesures */
  const icones = [...bullesDyn.values()].filter((e) => !e.hidden).map((e) => e.getBoundingClientRect());
  [...document.querySelectorAll('.bulle.lieu')].filter((e) => !e.hidden).map((e) => [e, e.getBoundingClientRect()]).forEach(([e, r]) => {
    const d = r.top - e._top; let haut = r.top, bas = r.bottom, T = null;
    for (let k = 0; k < 3; k++) { const b = icones.find((i) => r.left < i.right + 2 && r.right > i.left - 2 && haut < i.bottom + 2 && bas > i.top - 2); if (!b) break; T = +(b.top - 6).toFixed(1); haut = T + d; bas = haut + r.height; }
    if (T !== null) e.style.top = T + 'px'; });
}
function bullesFixes() {
  { const t = prochainTerrain(); if (t) bulleVente(t, TERRAINS.indexOf(t)); }
}
function bulleVente(t, k) {
  { if (document.querySelector('[data-vente="' + k + '"]')) return; const e = document.createElement('div'); e.className = 'bulle vente'; e.dataset.ancre = 'v' + k; e.dataset.vente = k; const ok = nivTerrainOk(t); e.classList.toggle('verrou', !ok);
    e.innerHTML = '<small>' + (ok ? t.cases.length + ' cases' : 'niv. ' + t.niv) + '</small><b>' + fmt(t.prix) + ' ' + KAMA + '</b>'; /* (le detail : en touchant la friche, et a l'achat) */ e.addEventListener('click', () => ACTIONS.acheterTerrain(k)); zoneBulles.appendChild(e); }
}

/* ----- interaction : toucher une case, un bouftou, un terrain ----- */
const ray = new T.Raycaster(); const souris = new T.Vector2();
let pDown = null;
canvas.addEventListener('pointerdown', (e) => { if (!e.isPrimary) { pDown = null; cacherAppui(); return; } /* deux doigts : on pince, on n'agit pas */
  pDown = { x: e.clientX, y: e.clientY, t: performance.now() }; /* (le vrai temps : Date.now suit la vitesse du jeu) */ if (e.pointerType === 'touch') montrerAppui(e); });
const TOLERANCE = (e) => e.pointerType === 'touch' ? 14 : 8; /* un doigt bouge toujours un peu pendant un appui long */
const appui = document.createElement('div'); appui.id = 'appui'; appui.innerHTML = '<svg viewBox="0 0 58 58"><circle cx="29" cy="29" r="22"/><circle class="arc" cx="29" cy="29" r="22"/></svg>'; document.body.appendChild(appui);
function montrerAppui(e) { appui.style.left = e.clientX + 'px'; appui.style.top = e.clientY + 'px'; appui.classList.remove('actif', 'pret'); void appui.offsetWidth; appui.classList.add('actif'); clearTimeout(montrerAppui.t); montrerAppui.t = setTimeout(() => appui.classList.add('pret'), APPUI_LONG); }
function cacherAppui() { clearTimeout(montrerAppui.t); appui.classList.remove('actif', 'pret'); }
canvas.addEventListener('pointermove', (e) => { if (pDown && e.pointerType === 'touch' && Math.hypot(e.clientX - pDown.x, e.clientY - pDown.y) > TOLERANCE(e)) cacherAppui(); });
canvas.addEventListener('pointercancel', cacherAppui);
/* « clic gauche pour se deplacer et cibler, clic droit pour realiser une action » (Mathieu, 11/10/2026) ; au doigt, toucher = agir et l'appui long deplace seulement */
const APPUI_LONG = 450;
/* pas de menu du navigateur : le clic droit sert a agir. Sur toute la page et pas seulement sur l'ile (« ca m'ouvre mon truc de pc assez souvent »,
   Mathieu, 11/10/2026) : sous Windows le menu part au relacher, donc apres que le clic droit a ouvert une fenetre, et il tombait sur elle */
document.addEventListener('contextmenu', (e) => { if (!(e.target.closest && e.target.closest('input, textarea'))) e.preventDefault(); });
function astuceClics() {
  const doigt = matchMedia('(pointer: coarse)').matches, cle = doigt ? 'astuceDoigt' : 'astuceClics'; if (!S_ || S_[cle]) return; S_[cle] = true; S_.astuceClics = true;
  toast(doigt ? 'Touche une case pour agir : labourer, planter, arroser, récolter, construire. Reste appuyé pour seulement t\'y déplacer.' : 'Clic gauche : te déplacer et cibler. Clic droit : agir sur la case (labourer, planter, récolter, construire, ouvrir un bâtiment).', 'or'); sauver();
}
function allerVers(id) { /* le clic gauche : il y va, sans rien faire (un nuisible, lui, se cible : on le chasse) */
  const p = typeof id === 'string' ? S_.cases.find((c) => c.id === id) : id; if (!p || !paysanMesh) return;
  if ((p.type === 'champ' && p.tofu) || (S_.sauvage && S_.sauvage.id === p.id)) { ACTIONS.toucherCase(p.id); return; }
  if (combat) { if (PASSABLE[p.type]) { combat.ordre = true; combat.tenir = true; allerPuis(p, () => {}); } return; } /* (pendant une vague : il va ou on le pose et y tient sa position, sans repartir vers un monstre) */
  allerPuis(p, () => {}); if (!S_[matchMedia('(pointer: coarse)').matches ? 'astuceDoigt' : 'astuceClics']) astuceClics(); else rappelClicDroit(p);
}
/* « je peux plus planter, ah c'est parce que je dois clic droit » (Mathieu, 11/10/2026) : l'astuce du lancement ne suffit pas, alors un clic gauche
   sur une case ou il y a quelque chose a faire le rappelle, tant que le joueur n'a pas pris l'habitude du clic droit (S_.clicsDroits) */
function verbeDroit(p) {
  const k = cleDeCase(p); if (k && enRuine(k)) return 'reconstruire';
  if (p.type === 'libre') return 'labourer ou construire';
  if (p.type === 'champ') { if (!p.c) return 'planter'; return p.pousse >= duree(PAR_ID[p.c]) ? 'récolter' : !p.arrose ? 'arroser' : ''; }
  return ({ enclos: 'ouvrir l\'enclos', hdv: 'ouvrir l\'HDV', grange: 'ouvrir la grange', puits: 'remplir l\'arrosoir', epouvantail: 'ouvrir l\'épouvantail', leurre: S_.leurreWabbit ? (niv('leurre') >= 3 ? 'relâcher le Wabbit' : 'chasser le Wabbit') : 'ouvrir le leurre', tour: 'ouvrir la tour', voliere: 'ouvrir la volière', niche: 'voir ton gardien' })[p.type] || '';
}
function rappelClicDroit(p) {
  if (tuto.actif || (S_.clicsDroits || 0) >= 6 || performance.now() - (rappelClicDroit.t || 0) < 4000) return; /* (pendant le tuto, Pepito explique deja) */ const v = verbeDroit(p); if (!v) return;
  rappelClicDroit.t = performance.now(); toast((matchMedia('(pointer: coarse)').matches ? 'Touche simplement la case' : 'Clic droit') + ' pour ' + v + '.'); /* (au doigt, apres un appui long qui n'a fait que deplacer) */
}
canvas.addEventListener('pointerup', (e) => {
  if (performance.now() - (lancer.t || 0) < 700) { pDown = null; return; } /* le clic qui a lance la partie ne touche pas l'ile */
  if (visee && e.button === 2) { annulerVisee(); pDown = null; return; } /* le clic droit annule une visee en cours */
  cacherAppui(); if (!pDown) return; const dx = e.clientX - pDown.x, dy = e.clientY - pDown.y; const bouge = Math.hypot(dx, dy) > TOLERANCE(e);
  const doigt = e.pointerType === 'touch' || e.pointerType === 'pen', long = doigt && performance.now() - pDown.t >= APPUI_LONG;
  const agir = e.button === 2 || (doigt && !long); pDown = null; /* au doigt : toucher = agir, appui long = seulement se deplacer */
  if (long && navigator.vibrate) navigator.vibrate(15);
  if (visee) { const pt = pointSol(e); if (pt) tirerVisee(pt); return; } /* « des fois faut cliquer 2 fois » (Mathieu et les testeurs, 12/10/2026) : un clic qui bougeait de quelques pixels passait pour un glisser de la vue ; en visee, la vue ne bouge pas, on lance la ou on relache (au doigt : on glisse pour viser, on leve pour lancer) */
  if (bouge) return;
  if (!mode && lieu !== 'casino') { const c = cibleEcran(e); if (c === 'voleur') { attaquerVoleur(); return; } if (c !== null) { cibler(c); return; } }
  souris.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(souris, camera);
  const hits = ray.intersectObjects(scene.children, true);
  if (lieu === 'casino') { clicCasino(hits); return; }
  if (agir && !mode && !combat) S_.clicsDroits = (S_.clicsDroits || 0) + 1; /* l'habitude du clic droit se prend : voir rappelClicDroit */
  for (const h of hits) {
    { let o = h.object; while (o && o !== paysanMesh) o = o.parent; if (o) continue; } /* le perso ne bloque pas le clic sur la case ou il se tient */
    if (h.object.userData.montgolfiere && !mode) { ouvrirMontgolfiere(); return; }
    if (combat) { /* pendant la vague : un monstre se cible, une case sert a se deplacer */
      let o = h.object, mid, cel; while (o) { if (o.userData.monstre !== undefined && mid === undefined) mid = o.userData.monstre; if (typeof o.userData.cellule === 'string' && !cel) cel = o.userData.cellule; o = o.parent; }
      if (mid !== undefined) { cibler(mid); return; }
      if (combat.genre === 'ile') { const [x, z] = bornerIle(h.point.x, h.point.z); combat.ordre = true; combat.tenir = true; chemin = [{ c: paysanMesh.userData.cellule, x, z }]; arrivee = null; return; }
      if (combat.arene) { const x = h.point.x, z = h.point.z, C0 = ARENE, R0 = R_ARENE; if (Math.hypot(x - C0.x, z - C0.z) < R0) { combat.ordre = true; combat.tenir = true; chemin = [{ c: paysanMesh.userData.cellule, x, z }]; arrivee = null; } return; }
      if (cel) { pointVise = { c: cel, x: h.point.x, z: h.point.z }; ACTIONS.toucherCase(cel); pointVise = null; return; } /* (il va au point touche, pas au centre de la case) */
      if (h.object.material && h.object.material.transparent) continue;
      const sous = caseIci(h.point.x, h.point.z); if (sous) { pointVise = { c: sous.id, x: h.point.x, z: h.point.z }; ACTIONS.toucherCase(sous.id); pointVise = null; } return;
    }
    if (mode === 'choisir' && h.object.userData.piece !== undefined) { aDeplacer = { piece: h.object.userData.piece }; mode = 'deplacerBat'; majBandeau(); return; } /* une lanterne de l'escalier, a sa place */
    if (mode && mode !== 'enclos' && h.object.userData.arbre) { /* en amenageant : toucher un arbre le choisit (le meme : on vise la case dessous) */
      if (mode === 'choisir') { aDeplacer = { arbre: h.object.userData.arbre }; mode = 'deplacerBat'; majBandeau(); return; } /* deja un objet choisi : on vise la case sous le feuillage */
      continue;
    }
    if (h.object.userData.voleur) { attaquerVoleur(); return; }
    if (!mode && clicGardien(h.object)) { if (agir) caresserGardien(); else if (gard) allerVers(caseIci(gard.x, gard.z)); return; } /* le gardien : on le caresse (le clic qui deplace, lui, emmene le perso pres de lui) */
    let o = h.object; let bouftou = null, cellule = null, terrain = null, friche = null;
    while (o) { if (o.userData.bouftou !== undefined && bouftou === null) bouftou = o.userData.bouftou; if (o.userData.cellule && !cellule) cellule = o.userData.cellule; if (o.userData.terrain !== undefined && terrain === null) terrain = o.userData.terrain; if (o.userData.friche !== undefined && friche === null) friche = o.userData.friche; o = o.parent; }
    if (friche !== null && !cellule && !caseIci(h.point.x, h.point.z) && !mode) { infoFriche(friche); return; }
    const action = agir || mode; /* en amenageant, le clic garde son role de selection */
    if (bouftou !== null && mode !== 'enclos' && mode !== 'enclosDeplacer') { if (action) toucherBouftou(bouftou); else allerVers(S_.cases.find((c) => c.type === 'enclos')); return; }
    if (terrain !== null) { ACTIONS.acheterTerrain(terrain); return; }
    if (cellule && action && !mode) { const ce = S_.cases.find((c) => c.id === cellule); if (ce && ce.type === 'enclos') { const k = bouftouEcran(e); if (k !== null) { toucherBouftou(k); return; } } } /* un Bouftou contre la cloture : c'est lui qu'on vise, pas l'enclos */
    if (cellule) { if (action) ACTIONS.toucherCase(cellule); else { pointVise = { c: cellule, x: h.point.x, z: h.point.z }; allerVers(cellule); pointVise = null; } sauver(); return; }
    if (h.object.material && h.object.material.transparent) continue;
    /* un objet de decor (grange, HDV...) : on cherche la case sous lui */
    const sous = S_.cases.find((p) => { const q = posCase(p); return Math.abs(q.x - h.point.x) < S / 2 && Math.abs(q.z - h.point.z) < S / 2; });
    if (sous) { if (action) ACTIONS.toucherCase(sous.id); else { pointVise = { c: sous.id, x: h.point.x, z: h.point.z }; allerVers(sous); pointVise = null; } sauver(); return; }
    return;
  }
});
/* glisser pour deplacer la vue, molette et pincement pour zoomer */
let drag = null, pince = null;
canvas.addEventListener('pointerdown', (e) => { if (e.isPrimary) drag = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointermove', (e) => { if (visee) { const pt = pointSol(e); if (pt) visee.point = pt; return; } if (!drag || !e.isPrimary || e.buttons === 0) return; const k = (camera.right - camera.left) / innerWidth; const dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k; drag = { x: e.clientX, y: e.clientY }; /* « de haut en bas c'est pas inverse ? » (Mathieu, 11/10/2026) : si, la carte suivait la souris a l'horizontale mais fuyait a la verticale ;
     maintenant le point saisi reste sous le curseur dans les deux sens (1 / sinus de l'inclinaison de la camera pour la profondeur) */
  const avant = new T.Vector3(-Math.cos(angleCam), 0, -Math.sin(angleCam)), droite = new T.Vector3(Math.sin(angleCam), 0, -Math.cos(angleCam)), incl = 27 / Math.hypot(27, 42.4);
  const dep = droite.multiplyScalar(-dx).add(avant.multiplyScalar(dy / incl)); camera.position.add(dep); VISEE.add(dep); });
canvas.addEventListener('pointerup', () => { drag = null; }); canvas.addEventListener('pointercancel', () => { drag = null; });
canvas.addEventListener('wheel', (e) => { zoom = borne(zoom * (e.deltaY > 0 ? 0.9 : 1.1), lieu === 'casino' ? 0.6 : ZOOM_MIN, 2.2); cadrer(); }, { passive: true });
canvas.addEventListener('touchstart', (e) => { if (e.touches.length === 2) pince = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
canvas.addEventListener('touchmove', (e) => { if (e.touches.length === 2 && pince) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); zoom = borne(zoom * d / pince, lieu === 'casino' ? 0.6 : ZOOM_MIN, 2.2); pince = d; cadrer(); drag = null; } }, { passive: true });
canvas.addEventListener('touchend', () => { pince = null; }, { passive: true });
function toucherBouftou(k) {
  const b = S_.bouftous[k]; if (!b) return;
  const encl = S_.cases.find((c) => c.type === 'enclos');
  if (encl && !paysanAdjacent(encl)) { allerPuis(encl, () => toucherBouftou(k)); return; }
  if (Date.now() >= b.rassasie) ACTIONS.nourrir(k);
  else if (b.laine > 0) ACTIONS.tondre(k);
  else toast(b.nom + ' est repu, laine dans ' + dureeLisible(CADENCE_LAINE - b.accu) + '.');
  sauver();
}

