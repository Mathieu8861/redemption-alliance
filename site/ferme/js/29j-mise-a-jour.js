'use strict';
/* LA MISE A JOUR AUTOMATIQUE (19/11/2026, Mathieu : « on peut forcer la maj pour tout le monde meme sans refresh ? », puis « recharge seule, au calme ») :
   la page porte sa version (meta version-jeu, posee par outils/copier_vers_site.py) et le site publie la derniere dans version.txt. Toutes les 2 minutes,
   le jeu la relit ; si elle a change, il attend un moment calme (a la ferme, hors combat, sans fenetre ouverte, pas dans le mode test), sauvegarde,
   previent 3 secondes et recharge. En local (version « dev »), rien ne se passe. */
(() => {
  const meta = document.querySelector('meta[name="version-jeu"]'), moi = meta && meta.content;
  if (!moi || moi === 'dev') return;
  let nouvelle = false, enCours = false;
  const verifier = () => fetch('version.txt?t=' + Date.now(), { cache: 'no-store' }).then((r) => (r.ok ? r.text() : '')).then((v) => { v = (v || '').trim(); if (/^[0-9a-f]{8,}$/.test(v) && v !== moi) nouvelle = true; }).catch(() => {});
  const calme = () => { try { return !!S_ && !!S_.perso && !combat && lieu === 'ferme' && !enAccueil && !modaleOuverte && !MODE_TEST; } catch (e) { return false; } };
  setTimeout(verifier, 30000); setInterval(verifier, 120000);
  setInterval(() => {
    if (!nouvelle || enCours || !calme()) return;
    enCours = true; try { sauver(); } catch (e) { /* (la sauvegarde la plus recente reste) */ }
    try { toast('Mise à jour du jeu : rechargement dans 3 secondes, ta partie est sauvegardée.', 'or'); } catch (e) { /* (sans message) */ }
    setTimeout(() => { if (calme()) { try { sauver(); } catch (e) { /* (rien) */ } location.reload(); } else enCours = false; }, 3000);
  }, 5000);
})();
