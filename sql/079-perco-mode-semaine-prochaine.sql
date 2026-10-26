/* ============================================ */
/* 079 : systeme de droits de la semaine        */
/*       prochaine                              */
/* ============================================ */
/* Demande de Ror (26/10/2026) : passer au      */
/* ladder par paliers de points pour la semaine */
/* prochaine sans toucher aux droits en cours,  */
/* calcules par rang et deja annonces.          */
/*  - site_config.perco_mode : systeme des      */
/*    droits en cours (inchange)                */
/*  - perco_mode_suivant + perco_mode_suivant_des*/
/*    : systeme programme et l'heure de bascule */
/*    (la remise a zero suivante)               */
/*  - la bascule se fait toute seule au premier */
/*    passage du cron horaire apres la remise a */
/*    zero, juste avant le tirage des zones     */

-- 1) Programmer le systeme de la semaine prochaine (admins)
CREATE OR REPLACE FUNCTION public.programmer_perco_mode(p_mode TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_courant TEXT;
    v_fin TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
        RAISE EXCEPTION 'Réservé aux admins';
    END IF;
    IF p_mode NOT IN ('rang', 'points') THEN
        RAISE EXCEPTION 'Système inconnu : %', p_mode;
    END IF;

    v_courant := COALESCE((SELECT valeur FROM public.site_config WHERE cle = 'perco_mode'), 'points');

    -- Meme systeme que la semaine en cours : rien a programmer
    IF p_mode = v_courant THEN
        DELETE FROM public.site_config WHERE cle IN ('perco_mode_suivant', 'perco_mode_suivant_des');
        RETURN jsonb_build_object('ok', true, 'programme', false, 'mode', p_mode);
    END IF;

    v_fin := public.periode_pvp_infos() ->> 'fin';
    IF v_fin IS NULL THEN
        RAISE EXCEPTION 'Pas de remise à zéro programmée : change le système de la semaine en cours directement';
    END IF;

    INSERT INTO public.site_config (cle, valeur) VALUES ('perco_mode_suivant', p_mode)
        ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur;
    INSERT INTO public.site_config (cle, valeur) VALUES ('perco_mode_suivant_des', v_fin)
        ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur;
    RETURN jsonb_build_object('ok', true, 'programme', true, 'mode', p_mode, 'des', v_fin);
END;
$function$;

-- 2) Appliquer la bascule quand l'heure est passee
CREATE OR REPLACE FUNCTION public.appliquer_perco_mode_suivant()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_mode TEXT;
    v_des TIMESTAMPTZ;
BEGIN
    SELECT valeur INTO v_mode FROM public.site_config WHERE cle = 'perco_mode_suivant';
    SELECT NULLIF(valeur, '')::timestamptz INTO v_des FROM public.site_config WHERE cle = 'perco_mode_suivant_des';
    IF v_mode IS NULL OR v_des IS NULL OR now() < v_des THEN
        RETURN NULL;
    END IF;
    INSERT INTO public.site_config (cle, valeur) VALUES ('perco_mode', v_mode)
        ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur;
    DELETE FROM public.site_config WHERE cle IN ('perco_mode_suivant', 'perco_mode_suivant_des');
    RETURN v_mode;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.programmer_perco_mode(TEXT) TO authenticated;

-- 3) Le cron horaire applique la bascule avant de calculer le tirage
CREATE OR REPLACE FUNCTION public.attribuer_percos_periode(p_force boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_periode  TIMESTAMPTZ;
    v_is_admin BOOLEAN;
    v_count    INTEGER := 0;
    v_source   TEXT := 'passee';
BEGIN
    /* Systeme programme pour la nouvelle periode (sql/079) */
    PERFORM public.appliquer_perco_mode_suivant();

    IF COALESCE((SELECT valeur FROM public.site_config WHERE cle = 'perco_mode'), 'points') <> 'rang' THEN
        RETURN jsonb_build_object('ok', true, 'message', 'Mode paliers de points actif : attribution désactivée',
            'nouvelles', 0, 'source', 'aucune');
    END IF;

    IF COALESCE((SELECT valeur FROM public.site_config WHERE cle = 'perco_reservations'), 'true') <> 'true' THEN
        RETURN jsonb_build_object('ok', true, 'message', 'Réservations de zones désactivées : attribution non calculée',
            'nouvelles', 0, 'source', 'aucune');
    END IF;

    /* Sans remise a zero : calcul en direct a l'affichage, rien a figer */
    IF public.pvp_periode_en_direct() THEN
        RETURN jsonb_build_object('ok', true, 'message', 'Classement sans remise à zéro : attribution calculée en direct',
            'nouvelles', 0, 'source', 'direct');
    END IF;

    v_periode := public.debut_periode_pvp();

    IF p_force THEN
        SELECT COALESCE(is_admin, false) INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
        IF NOT COALESCE(v_is_admin, false) THEN
            RETURN jsonb_build_object('ok', false, 'message', 'Recalcul réservé aux admins');
        END IF;
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('attribuer_percos_periode'));

    IF p_force THEN
        DELETE FROM public.perco_reservations WHERE periode_debut = v_periode;
    ELSIF EXISTS (SELECT 1 FROM public.perco_reservations WHERE periode_debut = v_periode) THEN
        RETURN jsonb_build_object('ok', true, 'message', 'Attribution déjà calculée', 'nouvelles', 0);
    END IF;

    /* Classement de reference : la periode ecoulee ; au lancement (vide), la courante */
    IF NOT EXISTS (SELECT 1 FROM public.classement_pvp_semaine_passee) THEN
        v_source := 'courante';
    END IF;

    INSERT INTO public.perco_reservations (periode_debut, tour, rang, user_id, zone_id, choix)
    SELECT v_periode, d.tour, d.rang, d.user_id, d.zone_id, d.choix
    FROM public.calculer_draft_percos(v_source) d;
    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN jsonb_build_object('ok', true, 'message', 'Attribution calculée',
        'nouvelles', v_count, 'source', v_source);
END;
$function$;
