/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* Preuve obligatoire sur les recyclages.

   Les pepites d'alliance sont redistribuees entre les membres : une
   declaration doit donc toujours etre verifiable. Le formulaire refuse
   deja l'envoi sans screenshot, mais un membre peut appeler l'API
   directement, d'ou le verrou en base.

   NOT NULL couvre l'insertion ET la modification : la policy
   recyclages_update_self_or_admin autorise chacun a editer ses propres
   lignes, il ne doit pas pouvoir retirer la preuve apres coup.

   Le CHECK complete le NOT NULL, qui laisserait passer une chaine vide. */

/* Verification prealable : ne rien casser s'il reste des lignes sans preuve.
   Au 16/09/2026 : 1 recyclage, 1 avec preuve, 0 sans. */
DO $$
DECLARE v_sans INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_sans FROM public.recyclages WHERE preuve_url IS NULL;
    IF v_sans > 0 THEN
        RAISE EXCEPTION 'Abandon : % recyclage(s) sans preuve. Les traiter avant de passer ce script.', v_sans;
    END IF;
END $$;

ALTER TABLE public.recyclages
    ALTER COLUMN preuve_url SET NOT NULL;

ALTER TABLE public.recyclages
    DROP CONSTRAINT IF EXISTS recyclages_preuve_non_vide;

ALTER TABLE public.recyclages
    ADD CONSTRAINT recyclages_preuve_non_vide
    CHECK (length(btrim(preuve_url)) > 0);

NOTIFY pgrst, 'reload schema';
