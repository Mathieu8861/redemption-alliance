/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* 062 : tirage des zones reservees ouvert toute la semaine du 8 au 15
   octobre (demande Mathieu 08/10/2026 : « des gens n'ont pas eu le temps
   avant jeudi 00h01 de mettre leur top, pour cette semaine on peut les
   laisser modifier, et a partir de jeudi prochain 00h01 on retourne en
   mode comme c'est la »).

   - site_config.perco_tirage_ouvert_jusqua : jusqu'a cet instant, chaque
     enregistrement de top (perco_preferences) refait le tirage de la
     periode en cours au lieu d'attendre la suivante. Regle au 2026-10-14
     22:00:01+00, soit jeudi 15/10 a 00:00:01 heure de Paris : ensuite,
     retour au fonctionnement normal (tirage fige au debut de chaque
     periode). Cle vide ou date passee : rien ne change.
   - Le classement de reference ne bouge pas (celui arrete a la remise a
     zero) : seuls les choix de zones suivent les tops, avec la regle
     habituelle (dans l'ordre du classement, premier choix encore libre).
   - calculer_draft_percos(source, garder) : avec garder, un joueur sans
     choix libre garde sa zone actuelle de la periode si elle est encore
     libre, et sa zone n'est pas donnee a un autre joueur sans choix. Le top
     enregistre par un joueur ne deplace donc pas les zones par defaut des
     autres. Sans garder (cron, recalcul admin) : comportement inchange.
   - rafraichir_tirage_ouvert() : refait et enregistre le tirage de la
     periode, sous le meme verrou que attribuer_percos_periode. Appelee par
     le trigger de perco_preferences, et une fois a la fin de cette
     migration pour les tops enregistres depuis minuit. */

-- A. Fin du tirage ouvert
INSERT INTO public.site_config (cle, valeur)
VALUES ('perco_tirage_ouvert_jusqua', '2026-10-14 22:00:01+00')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur;

-- B. Le tirage, avec maintien des zones par defaut (parametre garder)
DROP FUNCTION IF EXISTS public.calculer_draft_percos(TEXT);

CREATE OR REPLACE FUNCTION public.calculer_draft_percos(p_source TEXT DEFAULT 'courante', p_garder BOOLEAN DEFAULT FALSE)
RETURNS TABLE (tour INTEGER, rang INTEGER, user_id UUID, zone_id INTEGER, choix INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_tours     INTEGER;
    v_max_pref  INTEGER;
    v_pris      INTEGER[] := '{}';
    v_t         INTEGER;
    v_j         RECORD;
    v_zone      INTEGER;
    v_choix     INTEGER;
    v_reste_u   UUID[];
    v_reste_r   INTEGER[];
    v_i         INTEGER;
    v_periode   TIMESTAMPTZ := public.debut_periode_pvp();
BEGIN
    SELECT COALESCE(MAX(pal.resa), 0) INTO v_tours FROM public.paliers_percos pal;
    IF v_tours <= 0 THEN
        RETURN;
    END IF;

    v_max_pref := LEAST(50, GREATEST(1, COALESCE(NULLIF(regexp_replace(COALESCE(
        (SELECT sc.valeur FROM public.site_config sc WHERE sc.cle = 'perco_pref_max'), ''), '[^0-9]', '', 'g'), '')::INTEGER, 5)));

    FOR v_t IN 1..v_tours LOOP
        v_reste_u := '{}';
        v_reste_r := '{}';

        /* Passe 1 : dans l'ordre du classement, le choix le mieux place encore libre */
        FOR v_j IN
            SELECT l.uid, l.rg
            FROM (
                SELECT c.id AS uid,
                       (ROW_NUMBER() OVER (ORDER BY c.points DESC, c.username ASC))::INTEGER AS rg
                FROM public.classement_pvp_semaine_passee c
                WHERE p_source = 'passee'
                UNION ALL
                SELECT c.id,
                       (ROW_NUMBER() OVER (ORDER BY c.points DESC, c.username ASC))::INTEGER
                FROM public.classement_pvp_semaine c
                WHERE p_source <> 'passee'
            ) l
            WHERE COALESCE((SELECT pal.resa FROM public.paliers_percos pal
                            WHERE l.rg BETWEEN pal.rang_min AND pal.rang_max
                            ORDER BY pal.rang_min LIMIT 1), 0) >= v_t
            ORDER BY l.rg
        LOOP
            v_zone := NULL;
            v_choix := NULL;
            SELECT pp.zone_id, pp.ordre INTO v_zone, v_choix
            FROM public.perco_preferences pp
            JOIN public.zones_reservation z ON z.id = pp.zone_id AND z.actif = TRUE
            WHERE pp.user_id = v_j.uid
              AND pp.ordre <= v_max_pref
              AND NOT (pp.zone_id = ANY (v_pris))
              AND NOT EXISTS (
                  SELECT 1 FROM public.zones_bda b
                  WHERE lower(trim(b.nom_zone)) = lower(trim(z.nom)))
            ORDER BY pp.ordre ASC
            LIMIT 1;

            IF v_zone IS NOT NULL THEN
                v_pris := v_pris || v_zone;
                tour := v_t; rang := v_j.rg; user_id := v_j.uid; zone_id := v_zone; choix := v_choix;
                RETURN NEXT;
            ELSE
                v_reste_u := v_reste_u || v_j.uid;
                v_reste_r := v_reste_r || v_j.rg;
            END IF;
        END LOOP;

        /* Passe 2 : rien choisi, ou tous les choix pris : premiere zone libre
           de l'ordre de l'alliance (principales puis secondaires). Avec
           garder, d'abord la zone actuelle du joueur sur la periode. */
        IF array_length(v_reste_u, 1) IS NOT NULL THEN
            FOR v_i IN 1..array_length(v_reste_u, 1) LOOP
                v_zone := NULL;

                IF p_garder THEN
                    SELECT r.zone_id INTO v_zone
                    FROM public.perco_reservations r
                    JOIN public.zones_reservation z ON z.id = r.zone_id AND z.actif = TRUE
                    WHERE r.periode_debut = v_periode
                      AND r.tour = v_t
                      AND r.user_id = v_reste_u[v_i]
                      AND NOT (r.zone_id = ANY (v_pris))
                      AND NOT EXISTS (
                          SELECT 1 FROM public.zones_bda b
                          WHERE lower(trim(b.nom_zone)) = lower(trim(z.nom)))
                    LIMIT 1;
                END IF;

                IF v_zone IS NULL THEN
                    SELECT z.id INTO v_zone
                    FROM public.zones_reservation z
                    WHERE z.actif = TRUE
                      AND NOT (z.id = ANY (v_pris))
                      AND NOT EXISTS (
                          SELECT 1 FROM public.zones_bda b
                          WHERE lower(trim(b.nom_zone)) = lower(trim(z.nom)))
                      /* garder : la zone actuelle d'un joueur sans choix pas encore traite lui reste */
                      AND NOT (p_garder AND EXISTS (
                          SELECT 1 FROM public.perco_reservations r
                          WHERE r.periode_debut = v_periode
                            AND r.tour = v_t
                            AND r.zone_id = z.id
                            AND r.user_id = ANY (v_reste_u[v_i + 1 : array_length(v_reste_u, 1)])))
                    ORDER BY CASE z.categorie WHEN 'principale' THEN 0 ELSE 1 END, z.ordre ASC
                    LIMIT 1;
                END IF;

                IF v_zone IS NOT NULL THEN
                    v_pris := v_pris || v_zone;
                    tour := v_t; rang := v_reste_r[v_i]; user_id := v_reste_u[v_i]; zone_id := v_zone; choix := 0;
                    RETURN NEXT;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION public.calculer_draft_percos(TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculer_draft_percos(TEXT, BOOLEAN) TO service_role;

-- C. Refaire le tirage de la periode tant qu'il est ouvert
CREATE OR REPLACE FUNCTION public.rafraichir_tirage_ouvert()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_jusqua  TIMESTAMPTZ;
    v_periode TIMESTAMPTZ;
    v_source  TEXT := 'passee';
    v_tirage  JSONB;
    v_count   INTEGER := 0;
BEGIN
    BEGIN
        v_jusqua := NULLIF(trim((SELECT valeur FROM public.site_config WHERE cle = 'perco_tirage_ouvert_jusqua')), '')::TIMESTAMPTZ;
    EXCEPTION WHEN others THEN
        v_jusqua := NULL;
    END;
    IF v_jusqua IS NULL OR NOW() >= v_jusqua THEN
        RETURN jsonb_build_object('ok', true, 'message', 'Tirage fermé', 'nouvelles', 0);
    END IF;

    IF COALESCE((SELECT valeur FROM public.site_config WHERE cle = 'perco_mode'), 'points') <> 'rang'
       OR COALESCE((SELECT valeur FROM public.site_config WHERE cle = 'perco_reservations'), 'true') <> 'true'
       OR public.pvp_periode_en_direct() THEN
        /* Sans remise a zero, le tirage se calcule deja en direct a l'affichage */
        RETURN jsonb_build_object('ok', true, 'message', 'Rien à refaire', 'nouvelles', 0);
    END IF;

    v_periode := public.debut_periode_pvp();
    PERFORM pg_advisory_xact_lock(hashtext('attribuer_percos_periode'));

    /* Classement de reference : le meme que pour le tirage fige */
    IF NOT EXISTS (SELECT 1 FROM public.classement_pvp_semaine_passee) THEN
        v_source := 'courante';
    END IF;

    /* Calculer avant d'effacer : le maintien des zones par defaut lit le tirage actuel */
    SELECT COALESCE(jsonb_agg(to_jsonb(d)), '[]'::jsonb) INTO v_tirage
    FROM public.calculer_draft_percos(v_source, TRUE) d;

    DELETE FROM public.perco_reservations WHERE periode_debut = v_periode;
    INSERT INTO public.perco_reservations (periode_debut, tour, rang, user_id, zone_id, choix)
    SELECT v_periode, x.tour, x.rang, x.user_id, x.zone_id, x.choix
    FROM jsonb_to_recordset(v_tirage) AS x(tour INTEGER, rang INTEGER, user_id UUID, zone_id INTEGER, choix INTEGER);
    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN jsonb_build_object('ok', true, 'message', 'Tirage refait', 'nouvelles', v_count, 'source', v_source);
END;
$function$;

REVOKE ALL ON FUNCTION public.rafraichir_tirage_ouvert() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rafraichir_tirage_ouvert() TO service_role;

-- D. Chaque enregistrement de top refait le tirage tant qu'il est ouvert
CREATE OR REPLACE FUNCTION public.trg_perco_preferences_tirage_ouvert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    PERFORM public.rafraichir_tirage_ouvert();
    RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS perco_preferences_tirage_ouvert ON public.perco_preferences;
CREATE TRIGGER perco_preferences_tirage_ouvert
    AFTER INSERT OR UPDATE OR DELETE ON public.perco_preferences
    FOR EACH STATEMENT EXECUTE FUNCTION public.trg_perco_preferences_tirage_ouvert();

-- E. Les tops enregistres depuis minuit comptent tout de suite
SELECT public.rafraichir_tirage_ouvert();

NOTIFY pgrst, 'reload schema';
