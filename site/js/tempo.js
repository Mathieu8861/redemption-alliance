/* ============================================ */
/* Redemption     - Tempo                        */
/* 3e resultat d'un combat : y aller en         */
/* inferiorite pour faire perdre du temps a     */
/* l'ennemi, pas pour gagner. Bareme a part     */
/* (table bareme_tempo), paye a la duree par    */
/* tranche de 5 minutes, jamais cumule avec une */
/* victoire ou une defaite (sql/075).           */
/* ============================================ */
(function () {
    'use strict';

    var bareme = [];       /* [{ minutes, points }] par duree croissante */
    var charge = null;     /* promesse du chargement, partagee */
    var choix = null;      /* debut de la tranche choisie (5, 10...) */

    function charger() {
        if (!charge) {
            charge = window.REN.supabase.from('bareme_tempo').select('minutes, points').order('minutes')
                .then(function (res) { bareme = res.data || []; return bareme; });
        }
        return charge;
    }

    /* "10 à 15 min", et "20 min et +" pour la derniere tranche */
    function libelle(minutes) {
        var m = Number(minutes);
        var i = bareme.findIndex(function (b) { return Number(b.minutes) === m; });
        if (i !== -1 && i < bareme.length - 1) return m + ' à ' + bareme[i + 1].minutes + ' min';
        if (i === -1 && bareme.length && m < Number(bareme[bareme.length - 1].minutes)) return m + ' à ' + (m + 5) + ' min';
        return m + ' min et +';
    }

    function pointsDe(minutes) {
        var b = bareme.find(function (x) { return Number(x.minutes) === Number(minutes); });
        return b ? Number(b.points) : 0;
    }

    function fmt(n) { return window.REN.formatNumber(n); }

    /* === Formulaire (pages Attaque et Defense) === */
    function rendreTranches() {
        var box = document.getElementById('tempo-tranches');
        if (!box || !bareme.length) return;
        var html = '<div class="tempo__tranche tempo__tranche--zero"><span class="tempo__duree">moins de ' + bareme[0].minutes + ' min</span><span class="tempo__pts">pas un tempo</span></div>';
        bareme.forEach(function (b) {
            html += '<button type="button" class="tempo__tranche" data-minutes="' + b.minutes + '">'
                + '<span class="tempo__duree">' + libelle(b.minutes) + '</span>'
                + '<span class="tempo__pts">+' + fmt(Number(b.points)) + '</span></button>';
        });
        box.innerHTML = html;
        box.querySelectorAll('button.tempo__tranche').forEach(function (btn) {
            btn.addEventListener('click', function () {
                choix = parseInt(btn.getAttribute('data-minutes'), 10);
                box.querySelectorAll('button.tempo__tranche').forEach(function (b) { b.classList.toggle('active', b === btn); });
                majTotal();
            });
        });
    }

    function majTotal() {
        var total = document.getElementById('tempo-total');
        if (!total) return;
        if (choix === null) { total.style.display = 'none'; return; }
        var pts = pointsDe(choix);
        total.innerHTML = '<span>Tenu ' + libelle(choix) + '</span><span class="tempo__egal">+' + fmt(pts) + (pts > 1 ? ' points' : ' point') + '</span>';
        total.style.display = '';
    }

    window.REN.tempo = {
        charger: charger,
        libelle: libelle,

        /* Branche le bloc du formulaire (bouton #btn-tempo, section #section-tempo) */
        initFormulaire: function () {
            return charger().then(rendreTranches);
        },

        /* Affiche ou masque le choix de la duree ; masquer efface le choix */
        afficher: function (on) {
            var section = document.getElementById('section-tempo');
            if (section) section.style.display = on ? '' : 'none';
            if (!on) {
                choix = null;
                document.querySelectorAll('#tempo-tranches button.tempo__tranche').forEach(function (b) { b.classList.remove('active'); });
                majTotal();
            }
        },

        /* Un tempo se joue en inferiorite : le bouton s'eteint sinon */
        dispo: function (nbAllies, nbEnnemis) {
            var ok = nbAllies < nbEnnemis;
            var btn = document.getElementById('btn-tempo');
            if (btn) btn.classList.toggle('off', !ok);
            return ok;
        },

        minutes: function () { return choix; },

        messageIndispo: 'Le tempo se déclare quand vous êtes moins nombreux qu\'eux (1 contre 5, 2 contre 4...).'
    };
})();
