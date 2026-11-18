'use strict';
/* LES ENSEMBLES (18/11/2026, « pouvoir créer dans l'espace personnage des ensembles sort / item à sauvegarder pour en changer quand on veut : équiper telle
   pano avec tel sort pour tel moment, tu vois ? », Mathieu) : dans la fiche du perso (onglet Équipement), on enregistre sous un nom les pièces portées et
   l'ulti du moment, puis on les remet d'un clic, hors combat. Une pièce revendue, ou un ulti qu'on ne possède pas, est simplement sautée (et signalée) ;
   un emplacement vide dans l'ensemble se vide aussi (la pièce retourne au sac) : on retrouve l'équipement tel qu'il était. S_.ensembles : [{ nom, equip: { emplacement: id }, ulti }], ENSEMBLES_MAX au plus. */
const ENSEMBLES_MAX = 6;
const ensembles = () => (Array.isArray(S_.ensembles) ? S_.ensembles : (S_.ensembles = []));
function blocEnsembles() {
  const L = ensembles(), mini = (src, t) => '<img src="' + src + '" alt="" title="' + echapper(t) + '">';
  const ligne = (E, i) => { const pieces = EMPLACEMENTS_PERSO.map(([emp]) => E.equip[emp]).filter(Boolean), porte = pieces.length && EMPLACEMENTS_PERSO.every(([emp]) => (E.equip[emp] || null) === (S_.equip[emp] || null)) && (!E.ulti || E.ulti === S_.ulti);
    return '<div class="fp-ens' + (porte ? ' porte' : '') + '"><div class="fp-ens-tete"><b>' + echapper(E.nom) + '</b>' + (porte ? '<span class="fp-pil porte">porté</span>' : '') + '</div>' +
      '<div class="fp-ens-icos">' + pieces.map((id) => { const o = obj(id); return mini('assets/icones/' + iconeObjet(id) + '.png?v=' + VERSION_MODELES, o ? o.nom : id); }).join('') + (E.ulti && ULTIS[E.ulti] ? mini(srcUlti(E.ulti), 'Ulti : ' + nomUlti(E.ulti)) : '') + '</div>' +
      '<div class="fp-ens-act"><button class="btn mini kamas" data-ens-mettre="' + i + '"' + (porte ? ' disabled' : '') + '>Mettre</button><button class="btn mini discret" data-ens-maj="' + i + '" data-info="Remplacer par ton équipement et ton ulti actuels">Mettre à jour</button><button class="btn mini discret" data-ens-suppr="' + i + '" aria-label="Supprimer">✕</button></div></div>'; };
  return '<div class="fp-ensembles"><h4>Mes ensembles <small>tes pièces et ton ulti, à remettre d\'un clic</small></h4>' + L.map(ligne).join('') +
    (L.length < ENSEMBLES_MAX ? '<div class="fp-ens-nouveau"><input id="ens-nom" maxlength="24" placeholder="Nom (ex. Vagues de la forêt)"><button class="btn mini kamas" data-ens-garder>Enregistrer</button></div>'
      : '<p class="fp-astuce">' + ENSEMBLES_MAX + ' ensembles au plus : mets-en un à jour ou supprime-le.</p>') + '</div>';
}
const photoEnsemble = () => ({ equip: Object.fromEntries(Object.entries(S_.equip || {}).filter(([, id]) => id)), ulti: S_.ulti || null });
function mettreEnsemble(i) {
  if (combat) { toast('Pas pendant un combat.'); return; }
  const E = ensembles()[i]; if (!E) return; const manque = [];
  Object.entries(E.equip).forEach(([emp, id]) => {
    if (S_.equip[emp] === id) return; const o = obj(id);
    if (!o || !(S_.sac[id] > 0)) { manque.push(o ? o.nom : 'une pièce revendue'); return; }
    if (niveau(S_.xp) < o.niv || (o.classe && o.classe !== classeDe())) { manque.push(o.nom); return; }
    const avant = S_.equip[emp]; S_.sac[id]--; if (!S_.sac[id]) delete S_.sac[id]; if (avant) S_.sac[avant] = (S_.sac[avant] || 0) + 1; S_.equip[emp] = id;
  });
  EMPLACEMENTS_PERSO.forEach(([emp]) => { const id = S_.equip[emp]; if (id && !E.equip[emp]) { S_.sac[id] = (S_.sac[id] || 0) + 1; delete S_.equip[emp]; } }); /* (un emplacement vide dans l'ensemble) */
  if (E.ulti && E.ulti !== S_.ulti && ULTIS[E.ulti]) {
    if (ultiLibre()) S_.ulti = E.ulti;
    else if (peutChangerUlti() && ultiPossede(E.ulti)) { S_.ultisAchetes = [...new Set((S_.ultisAchetes || []).concat([S_.ulti]))]; S_.ulti = E.ulti; }
    else manque.push('l\'ulti ' + nomUlti(E.ulti));
  }
  rafraichirTenue(); sauver(); rendreHaut(); son('niveau');
  toast(E.nom + ' : c\'est équipé' + (manque.length ? ', sauf ' + manque.join(', ') + '.' : '.'), manque.length ? 'alerte' : 'or'); ouvrirPerso();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ens-mettre],[data-ens-maj],[data-ens-suppr],[data-ens-garder]'); if (!b || modaleOuverte !== 'perso') return;
  const L = ensembles();
  if (b.hasAttribute('data-ens-garder')) {
    if (L.length >= ENSEMBLES_MAX) return; const P = photoEnsemble(); if (!Object.keys(P.equip).length) { toast('Équipe d\'abord quelques pièces.'); return; }
    const champ = document.getElementById('ens-nom'), nom = ((champ && champ.value) || '').trim().slice(0, 24) || 'Ensemble ' + (L.length + 1);
    L.push(Object.assign({ nom }, P)); sauver(); toast('Ensemble « ' + nom + ' » enregistré.', 'or'); ouvrirPerso(); return;
  }
  const i = +(b.dataset.ensMettre ?? b.dataset.ensMaj ?? b.dataset.ensSuppr); if (!L[i]) return;
  if (b.hasAttribute('data-ens-mettre')) mettreEnsemble(i);
  else if (b.hasAttribute('data-ens-maj')) { Object.assign(L[i], photoEnsemble()); sauver(); toast('« ' + L[i].nom + ' » mis à jour avec ton équipement actuel.', 'or'); ouvrirPerso(); }
  else { const nom = L[i].nom; L.splice(i, 1); sauver(); toast('Ensemble « ' + nom + ' » supprimé.'); ouvrirPerso(); }
});
