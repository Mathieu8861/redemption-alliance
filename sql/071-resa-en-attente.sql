/* ============================================ */
/* 071 : plus de zone par defaut, « en attente » */
/* ============================================ */
/* Demande de Ror (19/10/2026) : un joueur qui  */
/* a droit a une zone mais n'a pas enregistre   */
/* de top ne recoit plus une zone au hasard de  */
/* l'ordre de l'alliance. Il reste « en attente */
/* de son choix », sa zone reste libre pour les */
/* autres, et des qu'il enregistre son top il   */
/* recoit son premier choix encore libre, meme  */
/* tirage ferme, sans deplacer personne.        */
/* Meme regle pour un joueur dont tout le top   */
/* est deja pris : il complete son top.         */

/* --- Le tirage : seulement les choix des joueurs (l'ancienne passe 2 des
       zones par defaut disparait). p_garder ne sert plus qu'a garder la
       signature appelee par rafraichir_tirage_ouvert(). --- */
CREATE OR REPLACE FUNCTION public.calculer_draft_percos(p_source TEXT DEFAULT 'courante', p_garder BOOLEAN DEFAULT FALSE)
RETURNS TABLE(tour INTEGER, rang INTEGER, user_id UUID, zone_id INTEGER, choix INTEGER)
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
BEGIN
    SELECT COALESCE(MAX(pal.resa), 0) INTO v_tours FROM public.paliers_percos pal;
    IF v_tours <= 0 THEN
        RETURN;
    END IF;

    v_max_pref := LEAST(50, GREATEST(1, COALESCE(NULLIF(regexp_replace(COALESCE(
        (SELECT sc.valeur FROM public.site_config sc WHERE sc.cle = 'perco_pref_max'), ''), '[^0-9]', '', 'g'), '')::INTEGER, 5)));

    FOR v_t IN 1..v_tours LOOP
        /* Dans l'ordre du classement, le choix le mieux place encore libre ;
           sans choix libre, pas de zone : le joueur est « en attente » */
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
            END IF;
        END LOOP;
    END LOOP;
END;
$function$;
REVOKE ALL ON FUNCTION public.calculer_draft_percos(TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculer_draft_percos(TEXT, BOOLEAN) TO service_role;

/* --- Tirage ferme : un joueur « en attente » qui enregistre son top recoit
       son premier choix encore libre, les zones des autres ne bougent pas.
       Rien tant que le tirage de la periode n'est pas fait : il se fera en
       entier (cron ou board) avec ce top. --- */
CREATE OR REPLACE FUNCTION public.completer_tirage_en_attente()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_periode   TIMESTAMPTZ;
    v_source    TEXT := 'passee';
    v_tours     INTEGER;
    v_max_pref  INTEGER;
    v_t         INTEGER;
    v_j         RECORD;
    v_zone      INTEGER;
    v_choix     INTEGER;
    v_count     INTEGER := 0;
BEGIN
    IF COALESCE((SELECT valeur FROM public.site_config WHERE cle = 'perco_mode'), 'points') <> 'rang'
       OR COALESCE((SELECT valeur FROM public.site_config WHERE cle = 'perco_reservations'), 'true') <> 'true'
       OR public.pvp_periode_en_direct() THEN
        RETURN jsonb_build_object('ok', true, 'message', 'Rien à compléter', 'nouvelles', 0);
    END IF;

    v_periode := public.debut_periode_pvp();
    PERFORM pg_advisory_xact_lock(hashtext('attribuer_percos_periode'));

    IF NOT EXISTS (SELECT 1 FROM public.perco_reservations WHERE periode_debut = v_periode) THEN
        RETURN jsonb_build_object('ok', true, 'message', 'Tirage pas encore fait', 'nouvelles', 0);
    END IF;

    /* Classement de reference : le meme que pour le tirage fige */
    IF NOT EXISTS (SELECT 1 FROM public.classement_pvp_semaine_passee) THEN
        v_source := 'courante';
    END IF;

    SELECT COALESCE(MAX(pal.resa), 0) INTO v_tours FROM public.paliers_percos pal;
    v_max_pref := LEAST(50, GREATEST(1, COALESCE(NULLIF(regexp_replace(COALESCE(
        (SELECT sc.valeur FROM public.site_config sc WHERE sc.cle = 'perco_pref_max'), ''), '[^0-9]', '', 'g'), '')::INTEGER, 5)));

    FOR v_t IN 1..v_tours LOOP
        FOR v_j IN
            SELECT l.uid, l.rg
            FROM (
                SELECT c.id AS uid,
                       (ROW_NUMBER() OVER (ORDER BY c.points DESC, c.username ASC))::INTEGER AS rg
                FROM public.classement_pvp_semaine_passee c
                WHERE v_source = 'passee'
                UNION ALL
                SELECT c.id,
                       (ROW_NUMBER() OVER (ORDER BY c.points DESC, c.username ASC))::INTEGER
                FROM public.classement_pvp_semaine c
                WHERE v_source <> 'passee'
            ) l
            WHERE COALESCE((SELECT pal.resa FROM public.paliers_percos pal
                            WHERE l.rg BETWEEN pal.rang_min AND pal.rang_max
                            ORDER BY pal.rang_min LIMIT 1), 0) >= v_t
              AND NOT EXISTS (SELECT 1 FROM public.perco_reservations r
                              WHERE r.periode_debut = v_periode AND r.tour = v_t AND r.user_id = l.uid)
            ORDER BY l.rg
        LOOP
            v_zone := NULL;
            v_choix := NULL;
            SELECT pp.zone_id, pp.ordre INTO v_zone, v_choix
            FROM public.perco_preferences pp
            JOIN public.zones_reservation z ON z.id = pp.zone_id AND z.actif = TRUE
            WHERE pp.user_id = v_j.uid
              AND pp.ordre <= v_max_pref
              AND NOT EXISTS (SELECT 1 FROM public.perco_reservations r
                              WHERE r.periode_debut = v_periode AND r.zone_id = pp.zone_id)
              AND NOT EXISTS (
                  SELECT 1 FROM public.zones_bda b
                  WHERE lower(trim(b.nom_zone)) = lower(trim(z.nom)))
            ORDER BY pp.ordre ASC
            LIMIT 1;

            IF v_zone IS NOT NULL THEN
                INSERT INTO public.perco_reservations (periode_debut, tour, rang, user_id, zone_id, choix)
                VALUES (v_periode, v_t, v_j.rg, v_j.uid, v_zone, v_choix);
                v_count := v_count + 1;
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object('ok', true, 'message', 'Tirage complété', 'nouvelles', v_count, 'source', v_source);
END;
$function$;
REVOKE ALL ON FUNCTION public.completer_tirage_en_attente() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.completer_tirage_en_attente() TO service_role;

/* --- Un top enregistre : tirage ouvert, tout se refait ; sinon on complete
       seulement ceux qui attendaient --- */
CREATE OR REPLACE FUNCTION public.trg_perco_preferences_tirage_ouvert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    PERFORM public.rafraichir_tirage_ouvert();
    PERFORM public.completer_tirage_en_attente();
    RETURN NULL;
END;
$function$;
