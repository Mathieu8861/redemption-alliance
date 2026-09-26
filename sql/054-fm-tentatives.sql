/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* 054 : compteur de tentatives sur une session de forgemagie
   (demande Mathieu 26/09/2026, en pleine session).

   Une tentative = un essai pour passer un jet de l'item sur un gros pui,
   en general un pui PA, PM ou PO (faire sauter la rune, remonter les
   autres jets sur le pui libere, puis repasser la rune quand le pui
   restant approche de zero). Le joueur l'incremente a la main depuis le
   bandeau de session ; la valeur est gardee avec la session et reprise
   dans Mes sessions, l'onglet Alliance et le resume de cloture.
   Mise a jour par le proprietaire via la policy UPDATE existante
   (fm_sessions_update_self_or_admin). */

ALTER TABLE public.fm_sessions
    ADD COLUMN IF NOT EXISTS tentatives INTEGER NOT NULL DEFAULT 0 CHECK (tentatives >= 0);

NOTIFY pgrst, 'reload schema';
