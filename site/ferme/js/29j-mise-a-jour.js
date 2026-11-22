'use strict';
/* LA MISE A JOUR DES PAGES (19/11/2026, Mathieu : « on peut forcer la maj pour tout le monde meme sans refresh ? », puis « recharge seule, au calme ») :
   la page porte sa version (meta version-jeu, posee par outils/copier_vers_site.py) et le site publie la derniere dans version.txt. Toutes les 2 minutes,
   le jeu la relit. En local (version « dev »), rien ne se passe.
   (22/11/2026, « le truc d'autorefresh, on fait des modifs toutes les deux secondes, ca nous fait refresh a chaque fois, faut changer le fonctionnement »,
   Mathieu, au formulaire : « bandeau + vraies MAJ ») : plus de rechargement force. La version ne change plus a chaque mise en ligne, seulement quand une
   vraie mise a jour des joueurs est publiee (copier_vers_site.py --joueurs) ; alors un petit bandeau propose de recharger, le joueur clique quand il veut
   (sa partie est sauvegardee avant). Il ne s'affiche pas en combat ; ferme, il revient a la prochaine version. */
(() => {
  const meta = document.querySelector('meta[name="version-jeu"]'), moi = meta && meta.content;
  if (!moi || moi === 'dev') return;
  let nouvelle = null, ecartee = null, bandeau = null;
  const verifier = () => fetch('version.txt?t=' + Date.now(), { cache: 'no-store' }).then((r) => (r.ok ? r.text() : '')).then((v) => { v = (v || '').trim(); if (/^[0-9a-f]{8,}$/.test(v) && v !== moi) nouvelle = v; }).catch(() => {});
  const enCombat = () => { try { return !!combat; } catch (e) { return false; } };
  const recharger = () => { try { sauver(); } catch (e) { /* (la sauvegarde la plus recente reste) */ } location.reload(); };
  const montrer = () => {
    if (bandeau) return; bandeau = document.createElement('div'); bandeau.className = 'maj-bandeau';
    bandeau.innerHTML = '<span>Une nouvelle version du jeu est disponible.</span><button class="btn kamas" data-maj-recharger>Recharger</button><button class="maj-fermer" data-maj-fermer aria-label="Plus tard">×</button>';
    bandeau.addEventListener('click', (e) => { if (e.target.closest('[data-maj-recharger]')) recharger(); else if (e.target.closest('[data-maj-fermer]')) { ecartee = nouvelle; cacher(); } });
    document.body.appendChild(bandeau);
  };
  const cacher = () => { if (bandeau) { bandeau.remove(); bandeau = null; } };
  setTimeout(verifier, 30000); setInterval(verifier, 120000);
  setInterval(() => { if (nouvelle && nouvelle !== ecartee && !enCombat()) montrer(); else cacher(); }, 3000);
})();
