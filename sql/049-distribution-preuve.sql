/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* Preuve de la distribution.

   L'admin peut joindre la capture de l'echange en jeu, pour garder une
   trace de ce qui a reellement ete verse. La date, elle, est deja
   enregistree toute seule dans distribue_le.

   La taxe BDA de 10 % n'est volontairement PAS stockee : c'est une aide
   au calcul pour savoir combien verser, pas une donnee a suivre
   (decision de Mathieu le 20/09). Si l'admin veut en garder une trace,
   elle est proposee dans le champ note, qu'il reste libre d'effacer. */

ALTER TABLE public.recyclages_distributions
    ADD COLUMN IF NOT EXISTS preuve_url TEXT;

/* ⚠️ L'ancienne signature a deux parametres DOIT etre supprimee, sinon
   deux surcharges peuvent repondre au meme appel et PostgREST renvoie
   PGRST203 (deja rencontre sur calculer_points le 16/09). */
DROP FUNCTION IF EXISTS public.distribuer_recyclages(TEXT, UUID[]);

CREATE OR REPLACE FUNCTION public.distribuer_recyclages(
    p_note       TEXT   DEFAULT NULL,
    p_user_ids   UUID[] DEFAULT NULL,
    p_preuve_url TEXT   DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id        INTEGER;
    v_nb        INTEGER := 0;
    v_recyc     INTEGER := 0;
    v_alliance  BIGINT  := 0;
    v_perso     BIGINT  := 0;
    v_pv        BIGINT  := 0;
    v_debut     TIMESTAMPTZ;
    v_reste     INTEGER := 0;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND is_admin = true) THEN
        RETURN json_build_object('ok', false, 'erreur', 'not_admin');
    END IF;

    IF p_user_ids IS NOT NULL AND cardinality(p_user_ids) = 0 THEN
        RETURN json_build_object('ok', false, 'erreur', 'aucun_membre');
    END IF;

    INSERT INTO public.recyclages_distributions (distribue_par, note, preuve_url)
    VALUES (auth.uid(),
            NULLIF(TRIM(COALESCE(p_note, '')), ''),
            NULLIF(TRIM(COALESCE(p_preuve_url, '')), ''))
    RETURNING id INTO v_id;

    WITH soldes AS (
        UPDATE public.recyclages
           SET distribution_id = v_id
         WHERE distribution_id IS NULL
           AND (p_user_ids IS NULL OR user_id = ANY (p_user_ids))
        RETURNING user_id, pepites_alliance, pepites_perso, plus_value, created_at
    )
    SELECT COUNT(*), COUNT(DISTINCT user_id),
           COALESCE(SUM(pepites_alliance), 0), COALESCE(SUM(pepites_perso), 0),
           COALESCE(SUM(plus_value), 0), MIN(created_at)
      INTO v_nb, v_recyc, v_alliance, v_perso, v_pv, v_debut
      FROM soldes;

    IF v_nb = 0 THEN
        DELETE FROM public.recyclages_distributions WHERE id = v_id;
        RETURN json_build_object('ok', false, 'erreur', 'rien_a_distribuer');
    END IF;

    UPDATE public.recyclages_distributions
       SET debut_periode    = v_debut,
           nb_recyclages    = v_nb,
           nb_recycleurs    = v_recyc,
           total_alliance   = v_alliance,
           total_perso      = v_perso,
           total_plus_value = v_pv
     WHERE id = v_id;

    SELECT COUNT(*) INTO v_reste
      FROM public.recyclages WHERE distribution_id IS NULL;

    RETURN json_build_object(
        'ok', true, 'id', v_id,
        'nb_recyclages', v_nb, 'nb_recycleurs', v_recyc,
        'total_alliance', v_alliance,
        'partielle', p_user_ids IS NOT NULL,
        'reste_en_cours', v_reste
    );
END;
$$;

NOTIFY pgrst, 'reload schema';
