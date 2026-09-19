/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* Distribution membre par membre.

   Jusqu'ici distribuer_recyclages soldait toute la periode d'un coup.
   On peut desormais ne solder que certains membres : les autres gardent
   leurs pepites en cours et seront distribues plus tard.

   p_user_ids NULL   -> toute la periode (comportement d'origine)
   p_user_ids = {..} -> uniquement ces membres

   ⚠️ L'ancienne version a un seul parametre DOIT etre supprimee. Deux
   surcharges qui acceptent toutes deux un appel a un seul argument nomme
   rendent l'appel ambigu pour PostgREST, qui repond alors PGRST203
   « Could not choose the best candidate function » (deja rencontre le
   16/09 sur calculer_points). */

DROP FUNCTION IF EXISTS public.distribuer_recyclages(TEXT);

CREATE OR REPLACE FUNCTION public.distribuer_recyclages(
    p_note     TEXT   DEFAULT NULL,
    p_user_ids UUID[] DEFAULT NULL
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

    /* Un tableau vide n'est pas la meme chose que NULL : il ne selectionne
       personne, on refuse tout de suite plutot que de creer une ligne vide. */
    IF p_user_ids IS NOT NULL AND cardinality(p_user_ids) = 0 THEN
        RETURN json_build_object('ok', false, 'erreur', 'aucun_membre');
    END IF;

    INSERT INTO public.recyclages_distributions (distribue_par, note)
    VALUES (auth.uid(), NULLIF(TRIM(COALESCE(p_note, '')), ''))
    RETURNING id INTO v_id;

    /* Stampage et calcul des totaux dans la MEME instruction : un recyclage
       insere pendant l'operation ne peut pas etre solde sans etre compte. */
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

    /* Ce qui reste en cours apres l'operation, pour l'afficher a l'admin */
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
