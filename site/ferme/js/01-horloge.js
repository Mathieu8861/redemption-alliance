'use strict';
/* BETA : la vitesse du temps, de x1 a x30 (le curseur du bandeau ; x50 avant le 12/10/2026 au soir, « mets max x30, retire le x50 », Mathieu). Une horloge de jeu remplace Date.now : tout ce qui se compte en temps
   (pousse, repas, preparation des vagues, raids, Tofus) va plus vite ; les combats, rythmes par l'affichage, gardent leur vitesse.
   L'avance prise est gardee d'une visite a l'autre, sinon les cultures rajeuniraient au rechargement. */
/* LE RYTHME (13/10/2026, apres l'etude du rythme : « ok alors commence a coder de cette maniere », Mathieu) : le x20 d'avant est la vitesse normale
   (depuis le 14/10/2026, c'est le x1 et toutes les durees du code sont ecrites en vraies minutes : voir LE TEMPS, plus bas). Puis, par Discord : « laisse le curseur, juste si le mode normal est en x20. Met le x20
   = normal, le x30 = x1,5, x40 = x2, et basta ». Le curseur va donc de x1 a x2 par pas de 0,5 ; jusqu'a x10 pour les tests (?test=1 en local, ?curseur=1).
   Une seule fois, au passage au rythme, l'avance et la vitesse de l'ancien curseur s'effacent (elles etaient comptees a l'ancienne minute) : les dates
   de la ferme se recalent toutes seules sur l'heure vraie (reprendreTemps). */
const CURSEUR_LIBRE = /[?&](test|curseur)=1/.test(location.search) && !/[?&]curseur=0/.test(location.search), VITESSE_MAX = CURSEUR_LIBRE ? 10 : 2; /* (curseur=0 : un test qui joue comme tout le monde) */
const pasVitesse = (v) => Math.min(VITESSE_MAX, Math.max(1, Math.round(v * 2) / 2));
const horlogeJeu = (() => {
  const vrai = Date.now.bind(Date); let avance = 0, vitesse = 1, ancre = vrai();
  try { if (localStorage.getItem('ferme-horloge') !== 'rythme') { localStorage.removeItem('ferme-avance'); localStorage.removeItem('ferme-vitesse'); localStorage.setItem('ferme-horloge', 'rythme'); }
    avance = +localStorage.getItem('ferme-avance') || 0; vitesse = pasVitesse(+localStorage.getItem('ferme-vitesse') || 1); } catch (e) { /* rien */ }
  const jeu = () => { const t = vrai(); return t + avance + (t - ancre) * (vitesse - 1); };
  const fixer = () => { avance = jeu() - vrai(); ancre = vrai(); try { localStorage.setItem('ferme-avance', String(Math.round(avance))); } catch (e) { /* rien */ } };
  Date.now = jeu; setInterval(fixer, 2000); addEventListener('pagehide', fixer);
  return { vitesse: () => vitesse, regler(v) { fixer(); vitesse = pasVitesse(v); try { localStorage.setItem('ferme-vitesse', String(vitesse)); } catch (e) { /* rien */ } } };
})();
