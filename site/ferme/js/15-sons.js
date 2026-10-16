'use strict';
/* ===================== LE PLAISIR DE JOUER =====================
   Des sons (synthetises, aucun fichier), les gains qui s'envolent, une fete a chaque niveau, les objectifs de Pepito (un fil
   qui apprend le jeu, recompense a chaque etape), trois defis par jour, un cadeau de connexion en serie, la file d'actions
   (on touche plusieurs taches, le paysan les enchaine) et le resume de ce qui s'est passe pendant l'absence. */
/* ---------- les sons et la musique ----------
   LE SON (13/10/2026) : la page d'ecoute « Sons de la ferme », validee par Mathieu : « on garde tout ; pour la musique on laisse plusieurs choix, celle de base
   la premiere ; dose bien le volume pour qu'un qui arrive sans avoir fait les reglages, faut pas que ce soit agressif du tout ». Tout est synthetise en direct
   (Web Audio, aucun fichier). Au depart : les sons a 50 %, la musique a 35 % (environ 8 dB sous les sons), qui monte en 6 s ; les reglages sont dans Options.
   Les niveaux de chaque son sont mesures hors ligne (scratchpad/sons/mesure-jeu.mjs) : vers -22 dB, un peu plus pour les annonces (vague, VSA, Royal).
   Variantes par defaut : la faux seule, le fouet sec, le bee de mouton. Onglet cache : tout se tait. */
/* ---- le moteur (scratchpad/sons/moteur.js, la page d'ecoute), enferme dans SON ---- */
const SON = (() => {
let ac = null, maitre = null, busSons = null, busMusique = null, BRUIT = null, REVERB = null;
const BASE_SONS = 0.037, BASE_MUSIQUE = 0.0194; /* (le volume de depart, au milieu des curseurs : le reglage de Mathieu du 13/10/2026, « je l'ai regle comme sur mon screen, mets-le comme ca par defaut » ; mesure sur sa capture, environ 9 % puis 28 % des anciens niveaux de depart) */
function init(ctx) {
  if (ac === ctx) return; ac = ctx; maitre = ac.createGain(); maitre.gain.value = 1;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -12; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
  maitre.connect(comp); comp.connect(ac.destination);
  busSons = ac.createGain(); busSons.gain.value = BASE_SONS; busSons.connect(maitre);
  busMusique = ac.createGain(); busMusique.gain.value = BASE_MUSIQUE; busMusique.connect(maitre);
  const n = Math.round(ac.sampleRate * 2); BRUIT = ac.createBuffer(1, n, ac.sampleRate); const d = BRUIT.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const m = Math.round(ac.sampleRate * 2.4), ir = ac.createBuffer(2, m, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const x = ir.getChannelData(c); for (let i = 0; i < m; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / m, 2.6); }
  REVERB = ac.createConvolver(); REVERB.buffer = ir; const retour = ac.createGain(); retour.gain.value = 0.35; REVERB.connect(retour); retour.connect(busMusique);
}
function volumes(vs, vm) { if (!ac) return; busSons.gain.setTargetAtTime(BASE_SONS * Math.pow(vs / 50, 3), ac.currentTime, 0.05); busMusique.gain.setTargetAtTime(BASE_MUSIQUE * Math.pow(vm / 50, 3), ac.currentTime, 0.05); } /* (en cube : le curseur est fin vers le bas, et va jusqu'a 8 fois plus fort a 100 %) */
/* ---------- les briques ---------- */
const G = (v, dest) => { const g = ac.createGain(); g.gain.value = v; if (dest) g.connect(dest); return g; };
const F = (type, f, q, dest) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; if (dest) b.connect(dest); return b; };
function bruit(t, dur, dest) { const s = ac.createBufferSource(); s.buffer = BRUIT; s.loop = true; s.connect(dest); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05); return s; }
function osc(type, f, t, dur, dest) { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (dest) o.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o; }
function env(g, t, a, tenu, r, v) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); if (tenu) g.gain.setValueAtTime(v, t + a + tenu); g.gain.exponentialRampToValueAtTime(0.0001, t + a + tenu + r); }
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
function swish(t, dur, f0, f1, v, dest) { /* un objet qui fend l'air : du bruit filtre dont la couleur glisse */
  const g = G(0, dest || busSons), bp = F('bandpass', f0, 0.9, g), hp = F('highpass', 700, 0.7, bp);
  bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur); bruit(t, dur, hp);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}
function craquements(t, dur, n, v, fmin, fmax, dest) { /* des tiges qui cassent, de la terre qui crisse */
  for (let k = 0; k < n; k++) { const tt = t + Math.random() * dur, g = G(0, dest || busSons), bp = F('bandpass', fmin + Math.random() * (fmax - fmin), 2.5, g); bruit(tt, 0.03, bp); env(g, tt, 0.001, 0, 0.012 + Math.random() * 0.015, v * (0.5 + Math.random() * 0.5)); }
}
function bulle(t, f, v, dest) { const g = G(0, dest || busSons), o = osc('sine', f, t, 0.07, g); o.frequency.exponentialRampToValueAtTime(f * 1.9, t + 0.05); env(g, t, 0.004, 0, 0.05, v); }
function clic(t, f, v, dest) { const g = G(0, dest || busSons); osc('square', f, t, 0.012, g); env(g, t, 0.001, 0, 0.01, v); }
function cloche(t, f, v, dest, dur) { dur = dur || 0.7; [[1, 1], [2.76, 0.3], [5.4, 0.1]].forEach(([m, a]) => { const g = G(0, dest || busSons); osc('sine', f * m, t, dur, g); env(g, t, 0.003, 0, dur / Math.sqrt(m), v * a); }); }
function boiteMusique(t, f, v, dest) { [[1, 1], [3.01, 0.14], [5.97, 0.05]].forEach(([m, a]) => { const g = G(0, dest); osc('sine', f * m, t, 1.6, g); env(g, t, 0.002, 0, 1.5 / Math.sqrt(m), v * a); }); }
function pince(t, f, v, dest, dur) { /* une corde pincee : triangle + octave, le filtre se referme */
  dur = dur || 1.1; const g = G(0, dest), lp = F('lowpass', 4200, 1, g); lp.frequency.setValueAtTime(4200, t); lp.frequency.exponentialRampToValueAtTime(700, t + 0.35);
  osc('triangle', f, t, dur, lp); const g2 = G(0.28, lp); osc('sine', f * 2, t, dur, g2); env(g, t, 0.002, 0, dur, v);
}
function nappe(t, notes, dur, v, dest) { /* des cordes douces et lointaines */
  const g = G(0, dest), lp = F('lowpass', 950, 0.5, g);
  notes.forEach((m) => [-6, 6].forEach((c) => { const o = osc('sawtooth', hz(m), t, dur + 1.6, lp); o.detune.value = c; }));
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 1.2); g.gain.setValueAtTime(v, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.5);
}
function basse(t, f, dur, v, dest) { const g = G(0, dest); osc('sine', f, t, dur, g); const g2 = G(0.25, g); osc('triangle', f, t, dur, g2); env(g, t, 0.01, dur * 0.3, dur * 0.7, v); }
function rhodes(t, f, dur, v, dest) { /* un piano electrique : modulation de frequence qui s'adoucit, un leger tremolo */
  const g = G(0, dest), c = osc('sine', f, t, dur + 0.8, g), mo = osc('sine', f, t, dur + 0.8, null), mg = G(0, c.frequency); mo.connect(mg);
  mg.gain.setValueAtTime(f * 1.6, t); mg.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.7);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(v * 0.45, t + 0.5); g.gain.setValueAtTime(v * 0.45, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.7);
}
function grosseCaisse(t, v, dest) { const g = G(0, dest), o = osc('sine', 110, t, 0.3, g); o.frequency.exponentialRampToValueAtTime(45, t + 0.2); env(g, t, 0.002, 0, 0.28, v); }
function balai(t, v, dest) { const g = G(0, dest), bp = F('bandpass', 1900, 0.7, g); bruit(t, 0.2, bp); env(g, t, 0.006, 0, 0.18, v); }
function charley(t, v, dest) { const g = G(0, dest), hp = F('highpass', 7000, 0.7, g); bruit(t, 0.05, hp); env(g, t, 0.001, 0, 0.035, v); }
function voixBee(t, o) { /* le bêê : une voix en dent de scie, son tremblement rapide (c'est lui qui fait le mouton), les formants de la voyelle « è », un b qui s'ouvre */
  const f = o.f, dur = o.dur, sortie = G(0, busSons), somme = G(1, null), trem = G(0.6, null);
  const vco = osc('sawtooth', f * 0.9, t, dur, somme); vco.frequency.exponentialRampToValueAtTime(f * o.monte, t + 0.09); vco.frequency.exponentialRampToValueAtTime(f * o.descend, t + dur);
  const vib = ac.createOscillator(), vg = G(f * 0.02, null); vib.frequency.value = 5.5; vib.connect(vg); vg.connect(vco.frequency); vib.start(t); vib.stop(t + dur + 0.05);
  if (o.sous) { const s = osc('square', f / 2, t, dur, G(o.sous, somme)); s.frequency.exponentialRampToValueAtTime(f * o.descend / 2, t + dur); }
  somme.connect(trem); const am = ac.createOscillator(), ag = G(0.42, trem.gain); am.frequency.value = o.trem; am.connect(ag); am.start(t); am.stop(t + dur + 0.05);
  const ouvre = F('lowpass', 350, 0.8, null); trem.connect(ouvre); ouvre.frequency.setValueAtTime(350, t); ouvre.frequency.exponentialRampToValueAtTime(5200, t + 0.07);
  const formants = o.mignon ? [[820, 6, 1], [2050, 8, 0.5], [3100, 10, 0.2]] : [[620, 7, 1], [1750, 9, 0.55], [2600, 11, 0.25]];
  formants.forEach(([ff, q, a]) => { const b = F('bandpass', ff, q, null), ga = G(a * 2.4, sortie); ouvre.connect(b); b.connect(ga); });
  const corps = F('lowpass', 900, 0.7, null), gc = G(0.3, sortie); ouvre.connect(corps); corps.connect(gc);
  sortie.gain.setValueAtTime(0.0001, t); sortie.gain.exponentialRampToValueAtTime(o.v, t + 0.04); sortie.gain.setValueAtTime(o.v, t + dur - 0.16); sortie.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}
function croque(t, n) { for (let k = 0; k < n; k++) { const tt = t + k * 0.17 + Math.random() * 0.03, g = G(0, busSons), lp = F('lowpass', 1600, 1, g); bruit(tt, 0.06, lp); env(g, tt, 0.003, 0.01, 0.045, 0.8); craquements(tt, 0.05, 4, 0.35, 1500, 3500); } }
function coupCisaille(t) { const g = G(0, busSons), bp = F('bandpass', 5200, 3, g); bruit(t, 0.04, bp); env(g, t, 0.002, 0.008, 0.03, 1.1); const gm = G(0, busSons); osc('sine', 4300, t, 0.06, gm); env(gm, t, 0.001, 0, 0.05, 0.12); clic(t + 0.012, 2600, 0.3); }

function claquement(t, v, dest) { /* le claquement du fouet : la pointe passe le mur du son, une onde en N de 1,4 ms, puis un souffle tres court ; aucune note */
  const sr = ac.sampleRate, n = Math.round(sr * 0.08), b = ac.createBuffer(1, n, sr), x = b.getChannelData(0), nN = Math.max(8, Math.round(sr * 0.0014));
  for (let i = 0; i < n; i++) { const e = Math.exp(-i / (sr * 0.007)); x[i] = (i < nN ? 1 - 2 * i / nN : 0) * 0.95 + (Math.random() * 2 - 1) * 0.5 * e; }
  const s = ac.createBufferSource(); s.buffer = b; const hp = F('highpass', 350, 0.7, null), g = G(v, dest || busSons); s.connect(hp); hp.connect(g); s.start(t);
}
function laniere(t, dur, v, dest) { /* la laniere qui file : un souffle large et sourd qui s'eclaircit, sans sifflement */
  const g = G(0, dest || busSons), lp = F('lowpass', 350, 0.5, g); lp.frequency.setValueAtTime(350, t); lp.frequency.exponentialRampToValueAtTime(2800, t + dur); bruit(t, dur, lp);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur * 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.02);
}
function piaillement(t, f0, v, dest) { /* un cri d'oisillon : une note qui plonge tres vite, un trille rapide (modulation de frequence), une harmonique */
  const d = 0.075 + Math.random() * 0.04, g = G(0, dest || busSons), bp = F('bandpass', f0, 1.2, g);
  [[1, 1], [2, 0.18]].forEach(([m, a]) => { const ga = G(a, bp), o = osc('sine', f0 * m * 1.25, t, d, ga); o.frequency.exponentialRampToValueAtTime(f0 * m * 0.8, t + d);
    const tr = ac.createOscillator(), tg = G(f0 * m * 0.06, o.frequency); tr.frequency.value = 70 + Math.random() * 40; tr.connect(tg); tr.start(t); tr.stop(t + d + 0.02); });
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + d * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
}
function pattes(t, n, v, dest) { /* des petites pattes qui detalent : des tapotements secs qui s'eloignent (plus doux et plus sourds) */
  let x = t; for (let k = 0; k < n; k++) { const loin = k / n, g = G(0, dest || busSons), lp = F('lowpass', 3200 - 2200 * loin, 0.8, g), bp = F('bandpass', 1400 + Math.random() * 900, 1.4, lp); bruit(x, 0.03, bp); env(g, x, 0.001, 0, 0.014 + Math.random() * 0.008, v * (1 - loin * 0.8)); x += 0.055 + Math.random() * 0.03 + (k % 2 ? 0.012 : 0); }
}
/* ---------- les sons du jeu ---------- */
const SONS = {
  fauchage(t, v) { /* la faux passe deux fois dans le ble ; B : une clochette pour la recolte */
    swish(t, 0.22, 1500, 5200, 0.9); craquements(t + 0.05, 0.15, 9, 0.55, 2500, 6000);
    swish(t + 0.27, 0.2, 1300, 4500, 0.7); craquements(t + 0.31, 0.13, 7, 0.45, 2500, 6000);
    if (v === 'B') { cloche(t + 0.52, 1568, 0.22); cloche(t + 0.62, 2093, 0.18); }
  },
  arrosage(t) { /* l'eau qui se deverse de l'arrosoir : un filet qui frissonne, des gouttes */
    const dur = 1.15, g = G(0, busSons), lp = F('lowpass', 2400, 0.7, g), bp = F('bandpass', 1000, 1.5, lp); bruit(t, dur, bp);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55, t + 0.1); bp.frequency.setValueAtTime(900, t);
    for (let x = 0.12; x < dur - 0.25; x += 0.03) { g.gain.linearRampToValueAtTime(0.35 + Math.random() * 0.35, t + x); bp.frequency.linearRampToValueAtTime(700 + Math.random() * 1000, t + x); }
    g.gain.linearRampToValueAtTime(0.4, t + dur - 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    for (let k = 0; k < 22; k++) bulle(t + 0.1 + Math.random() * (dur - 0.3), 450 + Math.random() * 900, 0.2);
  },
  puits(t) { /* la poulie qui grince, puis le seau qu'on vide */
    for (let k = 0; k < 3; k++) { const tt = t + k * 0.14, g = G(0, busSons), bp = F('bandpass', 800, 9, g), o = osc('sawtooth', 640 + k * 50, tt, 0.12, bp); o.frequency.linearRampToValueAtTime(820 + k * 60, tt + 0.1); env(g, tt, 0.02, 0.04, 0.05, 0.5); }
    const ts = t + 0.5, g = G(0, busSons), bp = F('bandpass', 750, 0.9, g); bp.frequency.setValueAtTime(900, ts); bp.frequency.exponentialRampToValueAtTime(380, ts + 0.6); bruit(ts, 0.65, bp); env(g, ts, 0.02, 0.15, 0.45, 0.9);
    for (let k = 0; k < 10; k++) bulle(ts + 0.05 + Math.random() * 0.5, 250 + Math.random() * 450, 0.18);
  },
  planter(t) { /* la graine qu'on enfonce dans la terre */
    const g = G(0, busSons), lp = F('lowpass', 500, 1, g); bruit(t, 0.12, lp); env(g, t, 0.005, 0.02, 0.09, 1.2);
    const g2 = G(0, busSons), o = osc('sine', 160, t, 0.15, g2); o.frequency.exponentialRampToValueAtTime(70, t + 0.12); env(g2, t, 0.004, 0, 0.13, 0.7);
    craquements(t, 0.08, 4, 0.3, 800, 2000); bulle(t + 0.13, 900, 0.1);
  },
  arc(t) { /* la corde qui claque, puis la fleche qui file */
    const g = G(0, busSons), lp = F('lowpass', 2600, 7, g); lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.18);
    const o = osc('sawtooth', 150, t, 0.3, lp); o.frequency.exponentialRampToValueAtTime(135, t + 0.25); env(g, t, 0.002, 0, 0.26, 0.6);
    const g2 = G(0, busSons); osc('triangle', 300, t, 0.12, g2); env(g2, t, 0.002, 0, 0.1, 0.28);
    swish(t + 0.03, 0.28, 4200, 1300, 0.6);
  },
  arbalete(t) { /* le declic, l'arc d'acier qui claque, le carreau qui file */
    clic(t, 2400, 0.45); const g = G(0, busSons), bp = F('bandpass', 900, 1.2, g); bruit(t + 0.01, 0.08, bp); env(g, t + 0.01, 0.002, 0.01, 0.07, 1.1);
    const g2 = G(0, busSons), lp = F('lowpass', 1800, 5, g2); osc('square', 95, t + 0.01, 0.15, lp); env(g2, t + 0.01, 0.002, 0, 0.13, 0.4);
    swish(t + 0.04, 0.2, 5000, 2000, 0.5);
  },
  fouet(t, v) { /* la laniere file, puis le claquement sec ; B : avec l'echo de la cour */
    laniere(t, 0.22, 0.45); claquement(t + 0.22, 1.0);
    if (v === 'B') [0.09, 0.19].forEach((d, k) => { const lp = F('lowpass', 2200, 0.7, busSons); claquement(t + 0.22 + d, 0.3 / (k + 1), lp); });
  },
  epee(t) { /* la lame qui siffle, le choc, le metal qui resonne */
    swish(t, 0.16, 2600, 1400, 0.65); const ti = t + 0.13, g = G(0, busSons), lp = F('lowpass', 1200, 1, g); bruit(ti, 0.06, lp); env(g, ti, 0.002, 0.005, 0.06, 1.0);
    [[1850, 0.12], [2710, 0.08], [3980, 0.05], [5230, 0.03]].forEach(([f, a]) => { const gm = G(0, busSons); osc('sine', f, ti, 0.5, gm); env(gm, ti, 0.002, 0, 0.45, a); });
  },
  touche(t) { /* un monstre frappe : un coup sourd dans la laine */
    const g = G(0, busSons), o = osc('sine', 170, t, 0.16, g); o.frequency.exponentialRampToValueAtTime(65, t + 0.13); env(g, t, 0.003, 0, 0.14, 1.0);
    const g2 = G(0, busSons), lp = F('lowpass', 900, 1, g2); bruit(t, 0.07, lp); env(g2, t, 0.002, 0, 0.06, 0.8);
  },
  tofu(t) { /* le Tofu chasse : trois piaillements d'oisillon, puis ses pattes qui detalent */
    [0, 0.12, 0.26].forEach((d, k) => piaillement(t + d, 3600 - k * 250 + Math.random() * 200, 0.35)); pattes(t + 0.42, 11, 0.9);
  },
  nourri(t, v) { /* il croque son ble, puis un bêê content ; B : un bêê plus mignon */
    croque(t, 3); voixBee(t + 0.55, v === 'B' ? { f: 420, dur: 0.5, trem: 28, monte: 1.08, descend: 0.96, v: 0.55, mignon: true } : { f: 330, dur: 0.6, trem: 23, monte: 1.07, descend: 0.92, v: 0.55 });
  },
  tonte(t, v) { /* cric, cric, cric, et le Bouftou surpris d'etre tout nu */
    [0, 0.17, 0.34].forEach((d) => coupCisaille(t + d));
    voixBee(t + 0.6, { f: v === 'B' ? 430 : 360, dur: 0.42, trem: 26, monte: 1.14, descend: 1.04, v: 0.55, mignon: v === 'B' });
  },
  bebe(t) { voixBee(t, { f: 540, dur: 0.38, trem: 30, monte: 1.1, descend: 0.95, v: 0.5, mignon: true }); voixBee(t + 0.45, { f: 560, dur: 0.3, trem: 30, monte: 1.08, descend: 0.98, v: 0.45, mignon: true }); },
  royal(t) { /* le Bouftou Royal entre en scene : grave, long, menacant */
    voixBee(t, { f: 165, dur: 1.05, trem: 17, monte: 1.06, descend: 0.85, v: 0.7, sous: 0.35 });
    const g = G(0, busSons), o = osc('sine', 60, t, 0.9, g); o.frequency.exponentialRampToValueAtTime(40, t + 0.8); env(g, t, 0.05, 0.3, 0.5, 0.5);
  },
  boire(t) { /* glou glou glou, puis le petit carillon du soin */
    [0, 0.2, 0.4].forEach((d, k) => { const tt = t + d, g = G(0, busSons), lp = F('lowpass', 900, 4, g), o = osc('sine', 180 + k * 15, tt, 0.14, lp); o.frequency.exponentialRampToValueAtTime(420 + k * 20, tt + 0.1); env(g, tt, 0.01, 0.03, 0.09, 0.9); bulle(tt + 0.05, 700, 0.1); });
    cloche(t + 0.7, 1319, 0.2); cloche(t + 0.79, 1760, 0.17);
  },
  gelee(t) { /* une Gelee qui saute : un boing mou qui tremblote */
    const g = G(0, busSons), lp = F('lowpass', 1400, 3, g), o = osc('triangle', 180, t, 0.42, lp); o.frequency.exponentialRampToValueAtTime(520, t + 0.09); o.frequency.exponentialRampToValueAtTime(250, t + 0.34);
    const w = ac.createOscillator(), wg = G(28, o.frequency); w.frequency.value = 14; w.connect(wg); w.start(t); w.stop(t + 0.45); env(g, t, 0.01, 0.05, 0.3, 0.85);
  },
  kamas(t) { /* des pieces qui tintent */
    [[0, 1976], [0.07, 2637], [0.13, 2349]].forEach(([d, f], k) => { [[1, 1], [2.4, 0.25]].forEach(([m, a]) => { const g = G(0, busSons); osc('sine', f * m, t + d, 0.3, g); env(g, t + d, 0.002, 0, 0.26 - k * 0.04, 0.22 * a); }); });
  },
  niveau(t) { /* un niveau de plus : arpege de cloches et une etincelle */
    [72, 76, 79, 84].forEach((m, k) => cloche(t + k * 0.1, hz(m), 0.3, busSons, 0.9)); [88, 91].forEach((m, k) => cloche(t + 0.45 + k * 0.07, hz(m), 0.16, busSons, 1.1));
  },
  victoire(t) { /* la vague est gagnee : une petite fanfare */
    [[67, 0], [72, 0.12], [76, 0.24], [79, 0.36]].forEach(([m, d]) => { const g = G(0, busSons), lp = F('lowpass', 2600, 1, g); osc('square', hz(m), t + d, 0.14, lp); env(g, t + d, 0.005, 0.05, 0.08, 0.16); });
    [72, 76, 79, 84].forEach((m) => { const g = G(0, busSons), lp = F('lowpass', 2200, 1, g); osc('triangle', hz(m), t + 0.5, 0.9, lp); const g2 = G(0.5, lp); osc('square', hz(m), t + 0.5, 0.9, g2); env(g, t + 0.5, 0.01, 0.3, 0.5, 0.13); });
  }
};

/* ---------- les musiques : un sequenceur qui planifie un pas (une double croche) a la fois, un peu en avance ---------- */
const MUSIQUES = {
  pre: { /* M1 : Matin au pre, une guitare pincee, une nappe lointaine, une basse ronde (76 BPM) */
    bpm: 76, pasParMesure: 16,
    accords: [[48, 55, 64, 67, 71], [45, 52, 60, 64, 67], [41, 48, 57, 60, 64], [43, 50, 59, 62, 69]], /* Do, La mineur, Fa, Sol */
    pas(n, t, d, sortie) {
      const mes = Math.floor(n / 16), p = n % 16, acc = this.accords[Math.floor(mes / 2) % 4];
      if (p === 0 && mes % 2 === 0) nappe(t, acc.slice(1).map((m) => m + 12), d * 32 - 0.2, 0.035, sortie.rev);
      if (p === 0 || p === 8) basse(t, hz(acc[0] - 12), d * 7, 0.32, sortie.sec);
      if (p % 2 === 0 && (p === 0 || Math.random() < 0.72)) { const ton = acc[(p / 2 + mes) % acc.length] + 12; pince(t, hz(ton), 0.13, sortie.sec, 1.2); }
      if (p % 4 === 2 && Math.random() < 0.22) cloche(t, hz([72, 74, 76, 79, 81][Math.floor(Math.random() * 5)] + 12), 0.05, sortie.rev, 1.2);
    }
  },
  boite: { /* M2 : la boite a musique, une berceuse a trois temps, des notes de cloche qui se promenent (84 BPM) */
    bpm: 84, pasParMesure: 12,
    accords: [[41, 53, 57, 60], [38, 50, 53, 57], [46, 50, 53, 58], [36, 52, 55, 58]], /* Fa, Re mineur, Si bemol, Do7 */
    gamme: [65, 67, 69, 72, 74, 77, 79, 81, 84], ici: 3,
    pas(n, t, d, sortie) {
      const mes = Math.floor(n / 12), p = n % 12, acc = this.accords[mes % 4];
      if (p === 0) { basse(t, hz(acc[0]), d * 10, 0.25, sortie.sec); if (mes % 4 === 0) nappe(t, acc.slice(1), d * 48 - 0.2, 0.025, sortie.rev); }
      if (p === 4 || p === 8) [1, 2, 3].forEach((k) => pince(t, hz(acc[k]), 0.05, sortie.sec, 0.6));
      if (p % 2 === 0 && Math.random() < (p === 0 ? 0.95 : 0.6)) { this.ici = Math.max(0, Math.min(this.gamme.length - 1, this.ici + [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)])); boiteMusique(t, hz(this.gamme[this.ici] + 12), 0.11, sortie.rev); }
    }
  },
  lofi: { /* M3 : le lofi d'Incarnam, un piano electrique, une batterie aux balais, le crepitement du vinyle (72 BPM, balance) */
    bpm: 72, pasParMesure: 16,
    accords: [[50, 60, 64, 65, 69], [43, 59, 64, 65, 69], [48, 59, 62, 64, 67], [45, 60, 64, 67, 71]], /* Re m9, Sol13, Do maj9, La m9 */
    pas(n, t, d, sortie) {
      const mes = Math.floor(n / 16), p = n % 16, acc = this.accords[mes % 4], sw = p % 2 ? d * 0.28 : 0, tt = t + sw;
      if (p === 0) acc.slice(1).forEach((m, k) => rhodes(t + k * 0.012, hz(m), d * 12, 0.06, sortie.rev));
      if (p === 10 && Math.random() < 0.5) acc.slice(2).forEach((m) => rhodes(tt, hz(m + 12), d * 4, 0.03, sortie.rev));
      if (p === 0 || p === 10) basse(t, hz(acc[0] - 12), d * 6, 0.34, sortie.sec);
      if (p === 0 || p === 7 || (p === 10 && Math.random() < 0.5)) grosseCaisse(tt, 0.42, sortie.sec);
      if (p === 4 || p === 12) balai(tt, 0.12, sortie.sec);
      if (p % 2 === 0 || Math.random() < 0.3) charley(tt, p % 4 === 0 ? 0.08 : 0.045, sortie.sec);
      if (Math.random() < 0.35) { const g = G(0, sortie.sec), hp = F('highpass', 2500, 0.7, g), x = t + Math.random() * d; bruit(x, 0.01, hp); env(g, x, 0.0005, 0, 0.006, 0.05 + Math.random() * 0.06); } /* le vinyle */
    }
  },
  brise: { /* A1 : l'ambiance seule, sans musique : le vent dans les champs et des oiseaux */
    bpm: 60, pasParMesure: 4,
    pas(n, t, d, sortie) {
      if (n % 8 === 0) { const g = G(0, sortie.sec), lp = F('lowpass', 420, 0.6, g); lp.frequency.setValueAtTime(320, t); lp.frequency.linearRampToValueAtTime(560, t + 4); lp.frequency.linearRampToValueAtTime(300, t + 8.5); bruit(t, 9, lp); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6, t + 2.5); g.gain.setValueAtTime(0.6, t + 6); g.gain.exponentialRampToValueAtTime(0.0001, t + 9); }
      if (Math.random() < 0.3) { const base = 2600 + Math.random() * 1800, nb = 2 + Math.floor(Math.random() * 4); for (let k = 0; k < nb; k++) { const x = t + k * (0.09 + Math.random() * 0.05), g = G(0, sortie.rev), o = osc('sine', base, x, 0.1, g); o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.4), x + 0.06); env(g, x, 0.005, 0.02, 0.05, 0.2); } }
    }
  }
};
function tambour(t, v) { const g = G(0, busSons), o = osc('sine', 140, t, 0.35, g); o.frequency.exponentialRampToValueAtTime(62, t + 0.25); env(g, t, 0.003, 0, 0.32, v); const g2 = G(0, busSons), lp = F('lowpass', 700, 1, g2); bruit(t, 0.1, lp); env(g2, t, 0.002, 0, 0.08, v * 0.6); }
function cor(t, f, dur, v) { /* un cor de guerre : deux dents de scie, un filtre qui s'ouvre, un leger vibrato */
  const g = G(0, busSons), lp = F('lowpass', 400, 1.2, g); lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(1700, t + 0.18); lp.frequency.exponentialRampToValueAtTime(900, t + dur);
  [0, 7].forEach((c) => { const o = osc('sawtooth', f, t, dur + 0.3, lp); o.detune.value = c; const vib = ac.createOscillator(), vg = G(f * 0.006, o.frequency); vib.frequency.value = 5; vib.connect(vg); vib.start(t); vib.stop(t + dur + 0.3); });
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.09); g.gain.setValueAtTime(v, t + dur - 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
}
function alarme(t, v) { [[1, 1], [2.32, 0.45], [4.25, 0.25], [6.63, 0.12]].forEach(([m, a]) => { const g = G(0, busSons); osc('sine', 930 * m, t, 0.6, g); env(g, t, 0.002, 0, 0.55 / Math.sqrt(m), 0.22 * a * v); }); const g = G(0, busSons), hp = F('highpass', 2500, 0.7, g); bruit(t, 0.03, hp); env(g, t, 0.001, 0, 0.02, 0.3 * v); }
Object.assign(SONS, {
  quete(t) { cloche(t, hz(79), 0.22); cloche(t + 0.11, hz(84), 0.2, null, 0.9); },
  alerte(t) { cloche(t, hz(76), 0.26, null, 0.6); cloche(t + 0.17, hz(71), 0.28, null, 0.8); },
  plouf(t) { const g = G(0, busSons), lp = F('lowpass', 1800, 1, g), o = osc('sine', 420, t, 0.12, lp); o.frequency.exponentialRampToValueAtTime(820, t + 0.07); env(g, t, 0.004, 0, 0.09, 0.5); },
  vague(t) { /* deux coups de tambour, puis le cor de guerre (une quinte) */ [0, 0.24].forEach((d) => tambour(t + d, 0.9)); cor(t + 0.5, hz(50), 0.95, 0.5); cor(t + 0.5, hz(57), 0.95, 0.28); tambour(t + 0.5, 0.6); },
  raid(t) { /* la cloche d'alarme a la volee, puis un cor grave : la VSA attaque */ for (let k = 0; k < 4; k++) alarme(t + k * 0.2, k % 2 ? 0.8 : 1); cor(t + 0.85, hz(45), 1.1, 0.45); cor(t + 0.85, hz(52), 1.1, 0.25); },
  defaite(t) { [[67, 0, 0.32], [65, 0.3, 0.32], [62, 0.6, 0.8]].forEach(([m, d, du], k) => { const g = G(0, busSons), lp = F('lowpass', 1500, 1, g), o = osc('triangle', hz(m), t + d, du, lp); if (k === 2) o.frequency.exponentialRampToValueAtTime(hz(m) * 0.94, t + d + du); const g2 = G(0.35, lp); osc('square', hz(m), t + d, du, g2); env(g, t + d, 0.02, du * 0.4, du * 0.6, 0.22); }); },
  cueillette(t) { /* un fruit qu'on cueille : les feuilles, un petit pop */ craquements(t, 0.14, 8, 0.4, 1200, 4000); const g = G(0, busSons), o = osc('sine', 320, t + 0.12, 0.1, g); o.frequency.exponentialRampToValueAtTime(760, t + 0.19); env(g, t + 0.12, 0.004, 0, 0.08, 0.6); cloche(t + 0.24, hz(88), 0.12); },
  manger(t) { croque(t, 3); cloche(t + 0.6, hz(84), 0.16); cloche(t + 0.7, hz(88), 0.13); },
  sort(t) { /* un sort : un souffle qui monte et des etincelles */ swish(t, 0.35, 800, 4200, 0.5); const g = G(0, busSons), o = osc('sine', 380, t, 0.4, g); o.frequency.exponentialRampToValueAtTime(1250, t + 0.32); env(g, t, 0.02, 0.1, 0.25, 0.22); [96, 100, 103].forEach((m, k) => cloche(t + 0.18 + k * 0.06, hz(m), 0.08, null, 0.5)); }
});
/* le niveau de chaque son, mesure hors ligne (mesure-sons.mjs) pour qu'ils sonnent tous a peu pres aussi fort (en dB) */
const NIVEAU_SON = { fauchage: 3, arrosage: 1, puits: -1.5, planter: 3, arc: 3.5, arbalete: 4, fouet: 1, epee: 2.5, touche: 0, tofu: 3, nourri: -2, tonte: 0.5, bebe: 4, royal: -6, boire: -12, gelee: -9, kamas: 4, niveau: -1, victoire: -6, quete: 0, alerte: -2, plouf: 5, vague: -7, raid: -6, defaite: -3, cueillette: 0, manger: 2.5, sort: -1 };
function jouer(nom, variante, db) {
  if (!ac || !SONS[nom]) return; const vrai = busSons, trim = G(Math.pow(10, ((NIVEAU_SON[nom] || 0) + (db || 0)) / 20), vrai); busSons = trim;
  try { SONS[nom](ac.currentTime + 0.02, variante); } finally { busSons = vrai; }
  setTimeout(() => { try { trim.disconnect(); } catch (e) { /* rien */ } }, 4000);
}
let lecture = null;
function sortiesMusique() { const sec = G(1, busMusique), rev = G(1, busMusique); rev.connect(REVERB); return { sec, rev }; }
function jouerMusique(id) {
  arreterMusique(); const M = MUSIQUES[id], d = 60 / M.bpm / 4, sortie = sortiesMusique();
  lecture = { id, n: 0, t: ac.currentTime + 0.12, sortie };
  [sortie.sec, sortie.rev].forEach((g) => { g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(1, ac.currentTime + 6); }); /* (la musique monte en 6 s) */
  const avancer = () => { while (lecture && lecture.t < ac.currentTime + 0.3) { M.pas(lecture.n, lecture.t, d, sortie); lecture.n++; lecture.t += d; } };
  avancer(); lecture.minuteur = setInterval(avancer, 60);
}
function arreterMusique() {
  if (!lecture) return; clearInterval(lecture.minuteur); const s = lecture.sortie, t = ac.currentTime;
  [s.sec, s.rev].forEach((g) => { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value || 0.0001, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8); setTimeout(() => g.disconnect(), 1200); });
  lecture = null;
}

return { init, jouer, volumes, musique: (id) => { if (ac) jouerMusique(id); }, arreter: () => { if (ac) arreterMusique(); }, enCours: () => (lecture ? lecture.id : null), SONS };
})();
let audio = null;
const lireReglage = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
const ecrireReglage = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) { /* rien */ } };
const sonActif = () => lireReglage('ferme-son', 'oui') !== 'non';
const volSons = () => borne(+lireReglage('ferme-vol-sons2', 50) || 0, 0, 100), volMusique = () => borne(+lireReglage('ferme-vol-musique2', 50) || 0, 0, 100), /* (cles neuves : les anciens reglages ne valent plus avec la nouvelle echelle) */ musiqueChoisie = () => lireReglage('ferme-musique', 'pre');
const MUSIQUES_JEU = [['pre', 'Matin au pré', 'Guitare pincée et nappe lointaine'], ['boite', 'La boîte à musique', 'Une berceuse à trois temps'], ['lofi', 'Le lofi d\'Incarnam', 'Piano électrique, balais et vinyle'], ['brise', 'Brise de la ferme', 'Le vent et les oiseaux, sans musique'], ['aucune', 'Pas de musique', 'Seulement les sons']];
function allumerAudio() { if (window.silence) return false; try { if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)(); SON.init(audio); SON.volumes(volSons(), volMusique()); return true; } catch (e) { return false; } }
function majMusique() { /* la musique choisie, si le son est actif (jamais avant le premier geste du joueur : les navigateurs l'interdisent) */
  if (!audio || window.silence) return; const m = musiqueChoisie();
  if (!sonActif() || m === 'aucune' || !SON.SONS) { SON.arreter(); return; }
  if (SON.enCours() !== m) SON.musique(m);
}
const pauseEcran = () => enPause && !$('ecran-pause').hidden; /* (« quand on met pause, ca coupe la musique etc », Mathieu, 13/10/2026 : l'ecran de pause, pas les lecons de Pepito) */
function deverrouillerSon() { /* au premier geste (et apres une interruption), on allume le son avec un son vide : c'est ce qu'exigent iPad et Android ; puis la musique */
  try { if (pauseEcran() || !allumerAudio()) return; if (audio.state !== 'running') { audio.resume(); const b = audio.createBuffer(1, 1, 22050), src = audio.createBufferSource(); src.buffer = b; src.connect(audio.destination); src.start(0); } majMusique(); } catch (e) { /* rien */ }
}
['pointerdown', 'touchend', 'keydown'].forEach((t) => addEventListener(t, deverrouillerSon, { capture: true, passive: true }));
document.addEventListener('input', (e) => { const id = e.target && e.target.id; if (id !== 'vol-sons' && id !== 'vol-musique') return; ecrireReglage(id === 'vol-sons' ? 'ferme-vol-sons2' : 'ferme-vol-musique2', e.target.value); if (allumerAudio()) SON.volumes(volSons(), volMusique()); });
document.addEventListener('change', (e) => { if (e.target && e.target.id === 'vol-sons') { son.der = {}; son('kamas'); } }); /* (un son pour entendre le nouveau volume) */
document.addEventListener('visibilitychange', () => { if (!audio) return; try { if (document.hidden) audio.suspend(); else if (sonActif() && !pauseEcran()) audio.resume(); } catch (e) { /* rien */ } });
function son(nom, variante, db) {
  if (window.silence || !sonActif() || pauseEcran()) return;
  const t = performance.now(); son.der = son.der || {}; if (t - (son.der[nom] || 0) < 120) return; son.der[nom] = t; /* jamais le meme son en rafale */
  if (!allumerAudio()) return; if (audio.state === 'suspended') audio.resume(); SON.jouer(nom, variante, db);
}
