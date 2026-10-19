/* ============================================ */
/* Redemption - Admin : la Ferme d'Incarnam     */
/* Qui a acces, la progression et le temps de   */
/* jeu de chacun (19/10/2026, sql/072)          */
/* ============================================ */
(function () {
    'use strict';

    var CLASSES = { iop: 'Iop', cra: 'Cra', osa: 'Osamodas' };
    var MODES = [
        ['tous', 'Tout le monde qui a le lien', 'Un compte Discord du site (validé ou non), ou un pseudo et un mot de passe créés dans le jeu.'],
        ['membres', 'Membres validés du site', 'Seuls les profils validés de Redemption, connectés avec Discord.'],
        ['testeurs', 'Testeurs seulement', 'Seuls les joueurs déjà inscrits ci-dessous.']
    ];
    var tri = { cle: 'derniere_partie', sens: -1 };

    function esc(t) { return window.REN.escapeHtml(t == null ? '' : String(t)); }
    function duree(s) {
        s = Math.max(0, Math.round(s || 0));
        if (s < 60) return s ? s + ' s' : '0';
        var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
        return h ? h + ' h ' + (m < 10 ? '0' : '') + m : m + ' min';
    }
    function ilYa(d) {
        if (!d) return '<span class="text-muted">jamais</span>';
        var s = (Date.now() - new Date(d).getTime()) / 1000;
        if (s < 300) return '<strong style="color:var(--color-success);">en jeu</strong>';
        if (s < 3600) return 'il y a ' + Math.round(s / 60) + ' min';
        if (s < 86400) return 'il y a ' + Math.round(s / 3600) + ' h';
        if (s < 86400 * 30) return 'il y a ' + Math.round(s / 86400) + ' j';
        return new Date(d).toLocaleDateString('fr-FR');
    }
    function nombre(n) { return n == null ? '<span class="text-muted">-</span>' : Number(n).toLocaleString('fr-FR'); }

    function valeurTri(j, cle) {
        if (cle === 'nom') return (j.nom || '').toLowerCase();
        if (cle === 'derniere_partie' || cle === 'cree_le') return j[cle] ? new Date(j[cle]).getTime() : 0;
        return j[cle] == null ? -1 : Number(j[cle]);
    }

    function carte(titre, valeur, sous) {
        return '<div style="flex:1 1 150px;background:var(--color-bg-tertiary);border:1px solid var(--color-border);border-radius:12px;padding:12px 14px;">'
            + '<div class="text-muted" style="font-size:.8rem;">' + titre + '</div>'
            + '<div style="font-family:var(--font-title);font-size:1.5rem;font-weight:700;">' + valeur + '</div>'
            + (sous ? '<div class="text-muted" style="font-size:.75rem;">' + sous + '</div>' : '') + '</div>';
    }

    function rendre(container, data) {
        var joueurs = (data.joueurs || []).slice();
        var maintenant = Date.now();
        var actifs7 = joueurs.filter(function (j) { return j.derniere_partie && maintenant - new Date(j.derniere_partie).getTime() < 7 * 86400000; }).length;
        var enJeu = joueurs.filter(function (j) { return j.derniere_partie && maintenant - new Date(j.derniere_partie).getTime() < 300000; }).length;
        var total = joueurs.reduce(function (n, j) { return n + (j.temps_jeu || 0); }, 0);
        joueurs.sort(function (a, b) { var x = valeurTri(a, tri.cle), y = valeurTri(b, tri.cle); return x < y ? -tri.sens : x > y ? tri.sens : 0; });

        var html = '<div class="admin-panel__title">Ferme d\'Incarnam : les joueurs</div>';
        html += '<div class="admin-panel__desc">Qui peut jouer, où en est chacun et combien de temps il a joué. Le temps de jeu est compté depuis le 19/10/2026.</div>';

        /* qui peut jouer */
        html += '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:var(--spacing-md, 16px);">';
        html += '<label for="ferme-acces" style="font-weight:700;">Qui peut jouer</label>';
        html += '<select id="ferme-acces" class="form-input" style="max-width:320px;">';
        MODES.forEach(function (m) { html += '<option value="' + m[0] + '"' + (data.acces === m[0] ? ' selected' : '') + '>' + m[1] + '</option>'; });
        html += '</select><button class="btn btn--primary btn--small" id="ferme-acces-ok">Enregistrer</button>';
        html += '<button class="btn btn--secondary btn--small" id="ferme-rafraichir">Rafraîchir</button></div>';
        var mode = MODES.filter(function (m) { return m[0] === data.acces; })[0];
        html += '<p class="text-muted" id="ferme-acces-aide" style="margin:-6px 0 var(--spacing-md, 16px);font-size:.85rem;">' + (mode ? mode[2] : '') + '</p>';

        /* les chiffres */
        html += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:var(--spacing-lg, 24px);">';
        html += carte('Joueurs inscrits', joueurs.length, '');
        html += carte('Actifs sur 7 jours', actifs7, '');
        html += carte('En jeu maintenant', enJeu, 'sauvegarde il y a moins de 5 min');
        html += carte('Temps de jeu total', duree(total), 'depuis le 19/10/2026');
        html += '</div>';

        /* le tableau */
        var cols = [['nom', 'Joueur'], ['classe', 'Classe'], ['niveau', 'Niveau'], ['vague', 'Vague'], ['boss', 'Boss battus'], ['kamas', 'Kamas'],
            ['temps_jeu', 'Temps de jeu'], ['sessions', 'Sessions'], ['derniere_partie', 'Dernière partie'], ['cree_le', 'Inscrit le']];
        html += '<style>#ferme-joueurs th, #ferme-joueurs td { padding: 8px 12px; text-align: left; vertical-align: middle; border-bottom: 1px solid var(--color-border); }'
            + ' #ferme-joueurs th { color: var(--color-text-muted); font-size: .8rem; font-weight: 600; } #ferme-joueurs tbody tr:hover { background: var(--color-bg-tertiary); }</style>';
        html += '<div style="overflow-x:auto;"><table class="admin-table" id="ferme-joueurs" style="width:100%;border-collapse:collapse;"><thead><tr>';
        cols.forEach(function (c) {
            var fl = tri.cle === c[0] ? (tri.sens > 0 ? ' ▲' : ' ▼') : '';
            html += '<th data-tri="' + c[0] + '" style="cursor:pointer;white-space:nowrap;">' + c[1] + fl + '</th>';
        });
        html += '</tr></thead><tbody>';
        if (!joueurs.length) html += '<tr><td colspan="' + cols.length + '" class="text-muted">Personne n\'a encore joué.</td></tr>';
        joueurs.forEach(function (j) {
            var type = j.invite ? '<span class="text-muted" style="font-size:.75rem;">compte de jeu</span>' : '<span class="text-muted" style="font-size:.75rem;">Discord</span>';
            html += '<tr>';
            html += '<td><strong>' + esc(j.nom) + '</strong><br>' + type + (j.nom_fermier && j.nom_fermier !== j.nom ? ' <span class="text-muted" style="font-size:.75rem;">(perso : ' + esc(j.nom_fermier) + ')</span>' : '') + '</td>';
            html += '<td>' + (j.classe ? esc(CLASSES[j.classe] || j.classe) : '<span class="text-muted">-</span>') + '</td>';
            html += '<td>' + nombre(j.niveau) + '</td>';
            html += '<td>' + nombre(j.vague) + '</td>';
            html += '<td>' + nombre(j.boss) + '</td>';
            html += '<td>' + (j.kamas == null ? '<span class="text-muted">-</span>' : window.REN.formatKamas ? window.REN.formatKamas(j.kamas) : nombre(j.kamas)) + '</td>';
            html += '<td>' + duree(j.temps_jeu) + '</td>';
            html += '<td>' + nombre(j.sessions) + '</td>';
            html += '<td style="white-space:nowrap;">' + ilYa(j.derniere_partie) + '</td>';
            html += '<td style="white-space:nowrap;">' + (j.cree_le ? new Date(j.cree_le).toLocaleDateString('fr-FR') : '') + '</td>';
            html += '</tr>';
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;

        container.querySelectorAll('th[data-tri]').forEach(function (th) {
            th.addEventListener('click', function () {
                var c = th.getAttribute('data-tri');
                tri = { cle: c, sens: tri.cle === c ? -tri.sens : (c === 'nom' || c === 'classe' ? 1 : -1) };
                rendre(container, data);
            });
        });
        var sel = document.getElementById('ferme-acces');
        sel.addEventListener('change', function () {
            var m = MODES.filter(function (x) { return x[0] === sel.value; })[0];
            document.getElementById('ferme-acces-aide').textContent = m ? m[2] : '';
        });
        document.getElementById('ferme-acces-ok').addEventListener('click', async function () {
            var b = this; b.disabled = true;
            var r = await window.REN.supabase.rpc('ferme_admin_acces', { p_mode: sel.value });
            b.disabled = false;
            if (r.error || !r.data || !r.data.ok) { alert('Le changement n\'est pas passé : ' + (r.error ? r.error.message : (r.data && r.data.erreur) || '?')); return; }
            data.acces = r.data.acces; b.textContent = 'Enregistré ✓'; setTimeout(function () { b.textContent = 'Enregistrer'; }, 1500);
        });
        document.getElementById('ferme-rafraichir').addEventListener('click', function () { window.tabFerme(container); });
    }

    window.tabFerme = async function (container) {
        var r = await window.REN.supabase.rpc('ferme_admin_joueurs');
        if (r.error || !r.data || !r.data.ok) {
            container.innerHTML = '<div class="admin-panel__title">Ferme d\'Incarnam : les joueurs</div><p class="text-muted">Impossible de lire les joueurs : '
                + esc(r.error ? r.error.message : (r.data && r.data.erreur) || '?') + '</p>';
            return;
        }
        rendre(container, r.data);
    };
})();
