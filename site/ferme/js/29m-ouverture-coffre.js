'use strict';
/* L'OUVERTURE DES COFFRES FACON JEUX MOBILES (21/11/2026, « fais l'animation d'ouverture facon jeux mobiles », Mathieu, apres les coffres du podium
   generes par l'IA, 29k-coffres-podium.js). Un ecran plein, au-dessus de tout :
   - le fond prend la couleur du coffre (turquoise legendaire, violet epique, rouge rare, or pour celui des participants), des rayons tournent derriere ;
   - le coffre tombe du ciel, s'ecrase et rebondit (onde au sol, l'ecran tremble) ; son nom s'affiche en grand ;
   - il attend : il respire, son couvercle claque et la lumiere fuit par la fente ; chaque touche le secoue un peu plus, fait jaillir des etincelles et
     allume un point de plus (3 touches, 2 pour le coffre des participants) ;
   - a la derniere : eclair blanc, le couvercle saute et rebondit sur sa charniere, un faisceau de lumiere monte du dedans, une onde, une gerbe d'etincelles
     et des kamas qui sautent ;
   - les recompenses sortent une a une en cartes qui se retournent (touche pour la suivante ; les kamas comptent jusqu'a leur total, une piece
     legendaire ou une rune parfaite brille) ;
   - enfin le recapitulatif de toutes les cartes et « Continuer » : on retrouve la fenetre du coffre (le detail, et les ressources a choisir).
   « Passer » (ou Echap, ou B a la manette) va droit au recapitulatif. Au clavier : espace ou entree pour toucher. Si WebGL manque, rien ne s'affiche et la
   fenetre du coffre reste comme avant. Utilise pour les coffres de l'ile des boss (27-arene.js) et l'essai du mode test. */
const OM = { el: null, r: null, sc: null, cam: null, fx: null, etat: null, raf: 0 };
const OM_COUL = { legendaire: ['#c08cff', '#2e1260', 'Coffre légendaire'], epique: ['#3ff0e2', '#0b4f4c', 'Coffre épique'], /* (violet et turquoise echanges le 22/11/2026, avec les coffres : LOOK_COFFRE, 29k) */ rare: ['#ff7a4a', '#6a160f', 'Coffre rare'], normal: ['#ffc845', '#5a3410', 'Coffre de l\'île'] };
function omTexDegrade() { /* un degrade vertical, opaque en bas, transparent en haut : le faisceau */
  return texCanvas(64, (c, n) => { const g = c.createLinearGradient(0, n, 0, 0); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, n, n); });
}
function omCreer() {
  if (OM.el) return !!OM.r;
  const el = document.createElement('div'); el.id = 'ouv-mobile'; el.className = 'om'; el.hidden = true;
  el.innerHTML = '<button class="om-toucher" aria-label="Toucher le coffre"></button><div class="om-fond"></div><div class="om-rayons"></div><div class="om-scene"></div>' +
    '<div class="om-titre"><small>Ton coffre</small><b></b></div><div class="om-compte"></div><div class="om-indice"></div><div class="om-cartes"></div><div class="om-recap"></div><div class="om-flash"></div>' +
    '<button class="btn discret om-passer">Passer</button><button class="btn kamas om-tout">Voir le total</button>';
  document.body.appendChild(el); OM.el = el;
  el.addEventListener('click', (e) => { const t = e.target;
    if (t.closest('.om-passer') || t.closest('.om-tout')) { omPasser(); return; } /* (« Voir le total » : 21/11/2026, « un petit bouton quand le coffre s'ouvre, pour passer l'animation des items et afficher direct le total », Mathieu) */ if (t.closest('[data-om-fin]')) { omFin(); return; } omToucher(); });
  addEventListener('keydown', (e) => { if (!OM.el || OM.el.hidden) return;
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) omToucher(); }
    else if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); omPasser(); } }, true);
  addEventListener('resize', () => { if (OM.etat) omTaille(); });
  try { OM.r = new T.WebGLRenderer({ antialias: true, alpha: true }); OM.r.setClearColor(0x000000, 0); OM.r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); el.querySelector('.om-scene').appendChild(OM.r.domElement); }
  catch (e) { OM.r = null; return false; }
  const sc = OM.sc = new T.Scene(); sc.add(new T.HemisphereLight('#fff1d6', '#7f5a2e', 0.55)); const d = new T.DirectionalLight('#fff0d0', 0.8); d.position.set(-3, 6, 5); sc.add(d);
  const d2 = new T.DirectionalLight('#ffd27a', 0.35); d2.position.set(4, 2, -5); sc.add(d2);
  OM.cam = new T.PerspectiveCamera(30, 1, 0.05, 80);
  /* les effets : le halo derriere le coffre, le faisceau, l'onde au sol, les etincelles */
  if (!TEX_HALO_COFFRE) TEX_HALO_COFFRE = texCanvas(64, (c2, n) => { const r = c2.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(0.35, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); c2.fillStyle = r; c2.fillRect(0, 0, n, n); });
  const add = (o) => { sc.add(o); return o; }, plus = { transparent: true, depthWrite: false, blending: T.AdditiveBlending };
  const halo = add(new T.Sprite(new T.SpriteMaterial(Object.assign({ map: TEX_HALO_COFFRE, color: '#ffffff', opacity: 0.5 }, plus)))); halo.renderOrder = -1;
  const geoF = new T.CylinderGeometry(1, 0.55, 1, 28, 1, true); geoF.translate(0, 0.5, 0);
  const faisceau = add(new T.Mesh(geoF, new T.MeshBasicMaterial(Object.assign({ map: omTexDegrade(), color: '#ffffff', opacity: 0, side: T.DoubleSide }, plus)))); faisceau.visible = false;
  const onde = add(new T.Mesh(new T.RingGeometry(0.82, 1, 56), new T.MeshBasicMaterial(Object.assign({ color: '#ffffff', opacity: 0, side: T.DoubleSide }, plus)))); onde.rotation.x = -Math.PI / 2;
  const etincelles = []; for (let i = 0; i < 70; i++) { const s = add(new T.Sprite(new T.SpriteMaterial(Object.assign({ map: TEX_HALO_COFFRE, color: '#ffffff', opacity: 0 }, plus)))); s.visible = false; etincelles.push({ s, v: new T.Vector3(), vie: 0, d: 1 }); }
  OM.fx = { halo, faisceau, onde, etincelles };
  return true;
}
function omTaille() { /* la 3D en plein ecran (un cadre plus petit coupait net le halo et le faisceau : un carre clair autour du coffre), cadree comme dans un carre de S pixels */
  const W = innerWidth, H = innerHeight, S = Math.max(240, Math.min(W * 0.96, H * 0.66, 720)); OM.r.setPixelRatio(Math.min(1.5, devicePixelRatio || 1)); OM.r.setSize(W, H);
  OM.cam.aspect = W / H; OM.fov = 2 * Math.atan(Math.tan(15 * Math.PI / 180) * H / S) * 180 / Math.PI; OM.cam.fov = OM.fov; OM.vue = [W, H]; OM.cam.updateProjectionMatrix(); }
const omMobile = () => matchMedia('(pointer: coarse)').matches;
function omIndice() { const E = OM.etat, el = OM.el.querySelector('.om-indice'); if (!E) return;
  if (E.phase !== 'attente') { el.innerHTML = ''; return; }
  const verbe = typeof manetteEnJeu === 'function' && manetteEnJeu() ? 'Appuie sur A' : omMobile() ? 'Touche le coffre' : 'Clique sur le coffre';
  el.innerHTML = verbe + ' pour l\'ouvrir<span class="om-points">' + Array.from({ length: E.nTapes }, (_, i) => '<i' + (i < E.tapes ? ' class="on"' : '') + '></i>').join('') + '</span>'; }
/* le point de depart : { rar, base (le coffre construit, sinon celui du jour), cartes: [{ ico, svg, n, t, brille }], titre, fin } ; false si l'ecran ne peut pas s'ouvrir */
function ouvertureMobile(o) {
  try { if (!omCreer()) return false; } catch (e) { console.warn('ouverture des coffres', e); return false; }
  if (OM.etat) omFin(true);
  const rar = OM_COUL[o.rar] ? o.rar : 'normal', [c, f, nom] = OM_COUL[rar], B = o.base || construireCoffre3d(); if (!B) return false;
  OM.el.style.setProperty('--om-c', c); OM.el.style.setProperty('--om-f', f); OM.el.className = 'om ' + rar; OM.el.hidden = false;
  OM.el.querySelector('.om-titre b').textContent = o.titre || nom; OM.el.querySelector('.om-titre small').textContent = o.sousTitre || 'Ton coffre';
  ['.om-cartes', '.om-recap', '.om-compte'].forEach((s) => { OM.el.querySelector(s).innerHTML = ''; });
  OM.sc.add(B.g); omTaille();
  const fx = OM.fx, couleur = new T.Color(c); fx.halo.material.color.copy(couleur); fx.faisceau.material.color.copy(couleur); fx.onde.material.color.copy(couleur);
  fx.etincelles.forEach((e) => { e.vie = 0; e.s.visible = false; });
  fx.faisceau.visible = false; fx.faisceau.material.opacity = 0; fx.onde.material.opacity = 0;
  OM.cam.position.set(B.L * 0.95, B.H + B.L * 1.75, B.L * 3.3); OM.cam.lookAt(0, B.H * 0.95, 0);
  OM.etat = { B, rar, couleur, cartes: o.cartes || [], fin: o.fin, phase: 'chute', tp: 0, t: 0, prec: performance.now(), tapes: 0, nTapes: rar === 'normal' ? 2 : 3, imp: 0, ang: 0, sauts: [], i: -1, compte: null, onde: null, lum0: B.lum.intensity };
  OM.cam.clearViewOffset(); OM.cam.fov = OM.fov; OM.cam.updateProjectionMatrix();
  omIndice(); cancelAnimationFrame(OM.raf); OM.raf = requestAnimationFrame(omBoucle);
  return true;
}
function omEtincelles(n, y, force, blanc) { const E = OM.etat, B = E.B; let k = 0;
  for (const e of OM.fx.etincelles) { if (k >= n) break; if (e.vie > 0) continue; k++;
    const a = Math.random() * Math.PI * 2, v = force * (0.6 + Math.random() * 0.7);
    e.s.position.set((Math.random() - 0.5) * B.L * 0.6, y, (Math.random() - 0.5) * B.P * 0.5); e.v.set(Math.cos(a) * v * 0.7, v * (0.8 + Math.random() * 0.9), Math.sin(a) * v * 0.5 + 0.15);
    e.vie = e.d = 0.7 + Math.random() * 0.6; e.s.visible = true; e.s.material.color.copy(blanc && Math.random() < 0.5 ? new T.Color('#ffffff') : E.couleur); e.taille = B.R * (0.25 + Math.random() * 0.35); } }
function omOnde(t) { OM.etat.onde = { t: 0, d: t || 0.6 }; }
function omToucher() {
  const E = OM.etat; if (!E) return;
  if (E.phase === 'attente') { E.tapes++; E.imp = 1; omEtincelles(6 + E.tapes * 5, E.B.H, 1.1 + E.tapes * 0.2, true); son('touche'); omIndice();
    if (E.tapes >= E.nTapes) setTimeout(() => { if (OM.etat === E && E.phase === 'attente') omOuvrir(); }, 170); return; }
  if (E.phase === 'cartes') { if (E.tp < 0.22) return; omCarte(E.i + 1); return; }
  if (E.phase === 'recap') omFin();
}
function omOuvrir() {
  const E = OM.etat; E.phase = 'ouverture'; E.tp = 0; E.ang0 = E.ang; omIndice();
  const fl = OM.el.querySelector('.om-flash'); fl.classList.remove('on'); void fl.offsetWidth; fl.classList.add('on'); OM.el.classList.add('ouvert');
  son('niveau'); omEtincelles(60, E.B.H, 2.2, true); omOnde(0.8);
  const B = E.B; /* des kamas et des gemmes qui sautent (comme le coffre du jour) */
  for (let i = 0; i < 20; i++) { const gm = i >= 16, q = gm ? cofGemme(['#e0233c', '#25b864', '#2f7fe8', '#a23ae0'][i - 16], B.R * 0.35, i === 17) : cofPiece(); if (!q) break;
    const a = Math.random() * Math.PI * 2, v = 0.45 + Math.random() * 0.5; if (!gm) q.scale.multiplyScalar(0.78); q.position.set((Math.random() - 0.5) * B.L * 0.4, B.H * 1.02, (Math.random() - 0.5) * B.P * 0.3); B.g.add(q);
    E.sauts.push({ o: q, v: new T.Vector3(Math.cos(a) * v * 0.45, 1.5 + Math.random() * 0.9, Math.sin(a) * v * 0.32 + 0.14), w: new T.Vector3(Math.random() * 9, Math.random() * 9, Math.random() * 9), pose: false }); }
}
const omFmt = (n) => (typeof n === 'number' ? fmt(Math.round(n)) : n);
function omCarteHtml(c, mini) {
  const img = c.svg ? c.svg : '<img src="assets/icones/' + c.ico + '.png?v=' + VERSION_MODELES + '" alt="">';
  return '<div class="' + (mini ? 'om-mini' : 'om-carte') + (c.brille ? ' brille' : '') + '">' + img + '<b>' + (c.n != null ? (c.plus === false ? '' : '+') + omFmt(c.n) : '') + '</b><span>' + c.t + '</span></div>'; }
function omCarte(i) {
  const E = OM.etat, z = OM.el.querySelector('.om-cartes'), prec = z.querySelector('.om-carte:not(.part)');
  if (prec) { prec.classList.add('part'); setTimeout(() => prec.remove(), 320); }
  if (i >= E.cartes.length) { omRecap(); return; }
  E.i = i; E.phase = 'cartes'; E.tp = 0; const c = E.cartes[i];
  z.insertAdjacentHTML('beforeend', omCarteHtml(Object.assign({}, c, { n: typeof c.n === 'number' && c.n > 20 ? 0 : c.n })));
  const el = z.lastElementChild; if (typeof c.n === 'number' && c.n > 20) E.compte = { el: el.querySelector('b'), n: c.n, t: 0, d: 0.7, plus: c.plus !== false };
  OM.el.querySelector('.om-compte').textContent = (i + 1) + ' / ' + E.cartes.length;
  son(c.brille ? 'victoire' : c.son || 'kamas'); omEtincelles(c.brille ? 24 : 10, E.B.H * 1.3, 1.2, true);
}
function omRecap() {
  const E = OM.etat; E.phase = 'recap'; E.tp = 0; OM.el.classList.add('recap'); OM.el.querySelector('.om-compte').textContent = ''; omIndice();
  const z = OM.el.querySelector('.om-recap');
  z.innerHTML = '<div class="om-grille">' + E.cartes.map((c, k) => omCarteHtml(c, true).replace('class="om-mini', 'style="animation-delay:' + (k * 0.07).toFixed(2) + 's" class="om-mini')).join('') + '</div>' +
    '<button class="btn kamas grand om-continuer" data-om-fin>Continuer</button>';
}
function omPasser() { /* droit au recapitulatif, coffre ouvert */
  const E = OM.etat; if (!E) return; if (E.phase === 'recap') { omFin(); return; }
  if (E.phase === 'chute' || E.phase === 'rebond' || E.phase === 'attente') { E.B.g.position.set(0, 0, 0); E.B.g.scale.set(1, 1, 1); omOuvrir(); E.tp = 0.5; }
  const z = OM.el.querySelector('.om-cartes'); z.innerHTML = ''; omRecap();
}
function omFin(sansSuite) {
  const E = OM.etat; if (!E) return; OM.etat = null; cancelAnimationFrame(OM.raf);
  E.sauts.forEach((s) => E.B.g.remove(s.o)); OM.sc.remove(E.B.g); OM.el.hidden = true; OM.el.classList.remove('ouvert', 'recap', 'secousse');
  if (!sansSuite && E.fin) E.fin();
}
function omBoucle(now) {
  const E = OM.etat; if (!E || !OM.el || OM.el.hidden) return; OM.raf = requestAnimationFrame(omBoucle);
  const dt = Math.min(0.05, Math.max(0, (now - E.prec) / 1000)); E.prec = now; E.t += dt; E.tp += dt;
  const B = E.B, g = B.g, fx = OM.fx, t = E.t, ia = B.ia ? 0.5 : 1; let ang = 0;
  g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.scale.set(1, 1, 1);
  if (E.phase === 'chute') { const k = Math.min(1, E.tp / 0.42); g.position.y = B.H * 7 * (1 - k) * (1 - k);
    if (k >= 1) { E.phase = 'rebond'; E.tp = 0; omOnde(0.55); son('poser'); OM.el.classList.remove('secousse'); void OM.el.offsetWidth; OM.el.classList.add('secousse'); omEtincelles(10, B.R * 0.2, 0.7, false); } }
  else if (E.phase === 'rebond') { const k = Math.min(1, E.tp / 0.3), e = Math.sin(k * Math.PI); g.scale.set(1 + 0.14 * e, 1 - 0.18 * e, 1 + 0.14 * e); if (k >= 1) { E.phase = 'attente'; E.tp = 0; omIndice(); } }
  else if (E.phase === 'attente') {
    E.imp *= Math.exp(-dt * 5); const ph = t % 1.6, claque = ph < 0.3 ? Math.max(0, Math.sin(ph / 0.3 * Math.PI * 3)) : 0;
    g.rotation.y = 0.18 * Math.sin(t * 0.7); g.rotation.z = Math.sin(t * 55) * 0.12 * E.imp; const s = 1 + 0.015 * Math.sin(t * 3) + 0.1 * E.imp; g.scale.set(s, s, s);
    ang = -0.05 * claque - 0.28 * E.imp - 0.02 * E.tapes;
    B.lum.intensity = (0.25 + 0.45 * E.tapes + 1.6 * E.imp + 0.6 * claque) * ia;
  } else { /* l'ouverture, les cartes, le recapitulatif : le couvercle ouvert, il tourne doucement */
    const k = E.phase === 'ouverture' ? E.tp : E.tp + 2;
    if (E.phase === 'ouverture' && E.tp < 0.12) ang = E.ang0 + (-2.05 - E.ang0) * (E.tp / 0.12); else { const q = Math.max(0, k - 0.12); ang = -1.92 - 0.35 * Math.exp(-q * 5) * Math.cos(q * 16); }
    E.rot = (E.rot || 0) + dt * 0.25; g.rotation.y = 0.35 * Math.sin(E.rot);
    if (E.phase === 'ouverture') { const p = Math.min(1, E.tp / 0.12), e = Math.sin(p * Math.PI); g.scale.set(1 + 0.1 * e, 1 - 0.08 * e, 1 + 0.1 * e); }
    B.lum.intensity = (2.4 * Math.exp(-(E.phase === 'ouverture' ? E.tp : 3) * 1.4) + 0.7) * ia;
    if (E.phase === 'ouverture' && E.tp > 1.15) omCarte(0);
  }
  E.ang = ang; B.ch.rotation.x = ang; if (B.anim) B.anim(dt);
  /* le halo, le faisceau, l'onde, les etincelles */
  const ouvert = E.phase === 'ouverture' || E.phase === 'cartes' || E.phase === 'recap';
  fx.halo.position.set(0, B.H * 0.9, -B.P * 0.3); fx.halo.scale.setScalar(B.L * (2.6 + 0.45 * E.tapes + (ouvert ? 1.4 : 0)) * (1 + 0.05 * Math.sin(t * 4)));
  fx.halo.material.opacity = Math.min(0.95, 0.35 + 0.12 * E.tapes + (ouvert ? 0.35 : 0) + 0.25 * E.imp);
  if (ouvert) { const k = E.phase === 'ouverture' ? Math.min(1, E.tp / 0.35) : 1; fx.faisceau.visible = true; fx.faisceau.position.set(0, B.H * 0.92, 0);
    fx.faisceau.scale.set(B.L * 0.36 * (0.6 + 0.4 * k), B.H * 9 * k, B.P * 0.36 * (0.6 + 0.4 * k)); fx.faisceau.rotation.y += dt * 0.6;
    fx.faisceau.material.opacity = E.phase === 'ouverture' ? 0.9 * (E.tp < 0.5 ? 1 : Math.max(0.3, 1 - (E.tp - 0.5))) : 0.28 + 0.06 * Math.sin(t * 3); }
  if (E.onde) { E.onde.t += dt; const k = E.onde.t / E.onde.d; fx.onde.position.set(0, B.R * 0.05, 0); fx.onde.scale.setScalar(B.L * (0.4 + 2.2 * k)); fx.onde.material.opacity = Math.max(0, 0.85 * (1 - k)); if (k >= 1) E.onde = null; }
  for (const e of fx.etincelles) { if (e.vie <= 0) continue; e.vie -= dt; e.v.y -= 2.2 * dt; e.s.position.addScaledVector(e.v, dt);
    const k = Math.max(0, e.vie / e.d); e.s.material.opacity = k; e.s.scale.setScalar(e.taille * (0.5 + k)); if (e.vie <= 0) e.s.visible = false; }
  if (E.phase === 'cartes' || E.phase === 'recap') { if (Math.random() < dt * 6) omEtincelles(1, B.H * 1.05, 0.9, true); }
  /* les kamas qui sautent */
  E.sauts.forEach((s) => { if (s.pose) return; s.v.y -= 3.2 * dt; s.o.position.addScaledVector(s.v, dt); s.o.rotation.x += s.w.x * dt; s.o.rotation.y += s.w.y * dt; s.o.rotation.z += s.w.z * dt;
    if (s.o.position.y <= B.R * 0.04 && s.v.y < 0) { if (Math.abs(s.v.y) > 0.6) { s.v.y *= -0.35; s.v.x *= 0.5; s.v.z *= 0.5; s.w.multiplyScalar(0.4); } else { s.o.position.y = B.R * 0.04; s.pose = true; } } });
  /* le compteur de la carte */
  if (E.compte) { const C = E.compte; C.t += dt; const k = Math.min(1, C.t / C.d), v = C.n * (1 - Math.pow(1 - k, 3)); C.el.textContent = (C.plus ? '+' : '') + fmt(Math.round(v)); if (k >= 1) E.compte = null; }
  /* le recapitulatif : la camera recule et le coffre monte, au-dessus des cartes */
  const rk = E.phase === 'recap' ? Math.min(1, E.tp / 0.5) : 0, e2 = rk * rk * (3 - 2 * rk);
  if (rk !== E.rk) { E.rk = rk; OM.cam.fov = OM.fov * (1 + 0.7 * e2); if (e2 > 0) OM.cam.setViewOffset(OM.vue[0], OM.vue[1], 0, OM.vue[1] * 0.3 * e2, OM.vue[0], OM.vue[1]); else OM.cam.clearViewOffset(); OM.cam.updateProjectionMatrix(); }
  OM.r.render(OM.sc, OM.cam);
}
