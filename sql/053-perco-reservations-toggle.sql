/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* 053 : les reservations de zones deviennent optionnelles dans le
   modele « classement » (demande Mathieu 26/09/2026 : « un petit ladder
   simple, sans les reservations », avec une case cote admin pour les
   remettre plus tard).

   - site_config.perco_reservations : 'true' | 'false'. Cle absente =
     'true' (comportement d'avant). Posee a 'false' ici, c'est le souhait
     du jour : le ladder seul decide du nombre de percos.
   - attribuer_percos_periode() : ne calcule rien tant que la cle vaut
     'false' (cron du lundi, secours du board, recalcul admin).
   - Cote site : l'onglet « Mes preferences », la colonne « Zone reservee »
     et l'export image s'adaptent tout seuls (board.js, profil.js, admin.js).
   - La periode du ladder n'a pas de reglage propre : il suit la periode du
     classement PvP (onglet Periode classement, sql/050). Sans remise a
     zero, la periode precedente est vide et les droits suivent le
     classement en direct (repli deja prevu dans la fonction). */

INSERT INTO public.site_config (cle, valeur)
VALUES ('perco_reservations', 'false')
ON CONFLICT (cle) DO NOTHING;

CREATE OR REPLACE FUNCTION public.attribuer_percos_periode(p_force boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_periode  TIMESTAMPTZ;
    v_tours    INTEGER;
    v_is_admin BOOLEAN;
    v_joueur   RECORD;
    v_zone     INTEGER;
    v_tour     INTEGER;
    v_count    INTEGER := 0;
    v_source   TEXT := 'passee';
BEGIN
    /* Mode simple (paliers de points) actif : pas d'attribution de zones */
    IF COALESCE((SELECT valeur FROM public.site_config WHERE cle = 'perco_mode'), 'points') <> 'rang' THEN
        RETURN jsonb_build_object('ok', true, 'message', 'Mode paliers de points actif : attribution désactivée',
            'nouvelles', 0, 'source', 'aucune');
    END IF;

    /* Reservations de zones desactivees (Admin > Bareme Perco) : le ladder
       seul donne les droits, aucune zone n'est attribuee */
    IF COALESCE((SELECT valeur FROM public.site_config WHERE cle = 'perco_reservations'), 'true') <> 'true' THEN
        RETURN jsonb_build_object('ok', true, 'message', 'Réservations de zones désactivées : attribution non calculée',
            'nouvelles', 0, 'source', 'aucune');
    END IF;

    v_periode := public.debut_periode_pvp();

    IF p_force THEN
        SELECT COALESCE(is_admin, false) INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
        IF NOT COALESCE(v_is_admin, false) THEN
            RETURN jsonb_build_object('ok', false, 'message', 'Recalcul réservé aux admins');
        END IF;
        DELETE FROM public.perco_reservations WHERE periode_debut = v_periode;
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('attribuer_percos_periode'));

    IF EXISTS (SELECT 1 FROM public.perco_reservations WHERE periode_debut = v_periode) THEN
        RETURN jsonb_build_object('ok', true, 'message', 'Attribution déjà calculée', 'nouvelles', 0);
    END IF;

    v_tours := COALESCE((SELECT valeur::INTEGER FROM public.site_config WHERE cle = 'perco_resa_tours'), 1);

    DROP TABLE IF EXISTS tmp_ladder;
    CREATE TEMP TABLE tmp_ladder ON COMMIT DROP AS
        SELECT id AS user_id, points,
               ROW_NUMBER() OVER (ORDER BY points DESC, username ASC) AS rang
        FROM public.classement_pvp_semaine_passee;

    IF NOT EXISTS (SELECT 1 FROM tmp_ladder) THEN
        v_source := 'courante';
        INSERT INTO tmp_ladder
            SELECT id, points,
                   ROW_NUMBER() OVER (ORDER BY points DESC, username ASC)
            FROM public.classement_pvp_semaine;
    END IF;

    FOR v_tour IN 1..v_tours LOOP
        /* Seuls les joueurs dont le palier donne des droits percos participent au draft */
        FOR v_joueur IN
            SELECT l.* FROM tmp_ladder l
            WHERE EXISTS (
                SELECT 1 FROM public.paliers_percos pal
                WHERE l.rang BETWEEN pal.rang_min AND pal.rang_max
                  AND (pal.percos > 0 OR pal.percos_150 > 0))
            ORDER BY l.rang
        LOOP
            /* 1. Sa préférence la mieux placée encore libre (zones BDA exclues) */
            SELECT pp.zone_id INTO v_zone
            FROM public.perco_preferences pp
            JOIN public.zones_reservation z ON z.id = pp.zone_id AND z.actif = TRUE
            WHERE pp.user_id = v_joueur.user_id
              AND NOT EXISTS (
                  SELECT 1 FROM public.perco_reservations r
                  WHERE r.periode_debut = v_periode AND r.zone_id = pp.zone_id)
              AND NOT EXISTS (
                  SELECT 1 FROM public.zones_bda b
                  WHERE lower(trim(b.nom_zone)) = lower(trim(z.nom)))
            ORDER BY pp.ordre ASC
            LIMIT 1;

            /* 2. Fallback : première zone libre du catalogue (principales puis secondaires,
               dans l'ordre admin). Personne n'a besoin de classer tout le catalogue. */
            IF v_zone IS NULL THEN
                SELECT z.id INTO v_zone
                FROM public.zones_reservation z
                WHERE z.actif = TRUE
                  AND NOT EXISTS (
                      SELECT 1 FROM public.perco_reservations r
                      WHERE r.periode_debut = v_periode AND r.zone_id = z.id)
                  AND NOT EXISTS (
                      SELECT 1 FROM public.zones_bda b
                      WHERE lower(trim(b.nom_zone)) = lower(trim(z.nom)))
                ORDER BY CASE z.categorie WHEN 'principale' THEN 0 ELSE 1 END, z.ordre ASC
                LIMIT 1;
            END IF;

            IF v_zone IS NOT NULL THEN
                INSERT INTO public.perco_reservations (periode_debut, tour, rang, user_id, zone_id)
                VALUES (v_periode, v_tour, v_joueur.rang, v_joueur.user_id, v_zone);
                v_count := v_count + 1;
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object('ok', true, 'message', 'Attribution calculée',
        'nouvelles', v_count, 'source', v_source, 'tours', v_tours);
END;
$function$;

NOTIFY pgrst, 'reload schema';
