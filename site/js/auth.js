/* ============================================ */
/* Redemption - Auth                            */
/* Connexion par compte Discord uniquement.     */
/* Le pseudo en jeu est demande au premier      */
/* passage, par l'onboarding de script.js.      */
/* ============================================ */
(function () {
    'use strict';

    var loginMessage = document.getElementById('login-message');

    function showMessage(el, text, type) {
        if (!el) return;
        el.textContent = text;
        el.className = 'auth-message auth-message--' + type;
    }

    /* === CONNEXION DISCORD (OAuth) === */
    var discordBtn = document.getElementById('btn-discord-login');
    if (discordBtn) {
        discordBtn.addEventListener('click', async function () {
            if (!window.REN.supabase) {
                showMessage(loginMessage, 'Supabase non configure.', 'error');
                return;
            }
            discordBtn.disabled = true;
            var original = discordBtn.innerHTML;
            discordBtn.textContent = 'Redirection vers Discord...';
            try {
                var { error } = await window.REN.supabase.auth.signInWithOAuth({
                    provider: 'discord',
                    options: { redirectTo: window.location.origin }
                });
                if (error) {
                    showMessage(loginMessage, 'Erreur Discord : ' + error.message, 'error');
                    discordBtn.disabled = false;
                    discordBtn.innerHTML = original;
                }
                /* si pas d'erreur, le navigateur part vers Discord */
            } catch (err) {
                showMessage(loginMessage, 'Erreur inattendue.', 'error');
                discordBtn.disabled = false;
                discordBtn.innerHTML = original;
            }
        });
    }
})();
