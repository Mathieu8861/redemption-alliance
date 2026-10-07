/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* 056 : reservations de zones reglees palier par palier, top de
   preferences, attribution en direct sans remise a zero
   (demande Mathieu 07/10/2026).

   - paliers_percos.resa : nombre de percos du palier poses dans une zone
     reservee, EN PLUS des percos classiques (meme logique que la colonne
     resa du bareme par points, sql/041). Total d'un palier = percos +
     percos_150 + resa, affiche « 4 percos dont 1 en zone reservee ».
     0 = pas de reservation : les rangs de ce palier n'ont pas de zone.
     L'etendue des reservations (rangs 1 a 10, 1 a 15, 1 a 30...) est
     donc portee par les paliers ; l'admin a un raccourci « jusqu'au rang
     N » qui coupe un palier au besoin.
   - site_config.perco_pref_max : taille du top de preferences des membres
     (5 par defaut). Seuls ces choix comptent au tirage.
   - site_config.perco_resa_tours : supprimee, le nombre de tours vient
     maintenant des paliers (un palier a 2 = deux zones par joueur).
   - perco_reservations.choix : rang du choix obtenu dans le top du joueur
     (1 = son premier choix), 0 = zone par defaut.
   - calculer_draft_percos(source) : le tirage, sans ecriture. Pour chaque
     tour, deux passes dans l'ordre du classement :
       1. chaque joueur qui a droit a une zone recoit son choix le mieux
          place encore libre (le 3e prend KORRI, le 5e qui avait aussi
          KORRI en n°1 recoit son n°2, ou son n°3 si le n°2 est pris) ;
       2. ceux qui n'ont rien choisi, ou dont tous les choix sont pris,
          recoivent ensuite la premiere zone libre de l'ordre de
          l'alliance. Sans cette deuxieme passe a part, un joueur mieux
          classe sans preferences prenait d'office KORRI (premiere zone du
          catalogue) a celui qui l'avait choisie.
   - attribuer_percos_periode() : fige le tirage au debut de chaque
     periode (cron du lundi). Sans remise a zero, il n'y a pas de periode
     a figer : rien n'est stocke.
   - pvp_periode_en_direct() : vrai quand le classement tourne sans remise
     a zero (illimite, ou depart programme pas encore atteint, sql/057).
   - attribution_percos_courante() : ce que lit le board. Sans remise a
     zero, le tirage est calcule en direct sur le classement actuel et les
     preferences actuelles, comme l'annonce la page (« droits et zones
     mis a jour en direct ») ; avant, il etait fige au dernier recalcul et
     ne suivait plus le classement. Avec une periode, l'attribution figee
     de la periode (calculee si elle manque).
   - Reglage du jour : reservations pour le top 10 seulement, total
     inchange (4 percos dont 1 en zone reservee) ; les rangs 11 a 49
     perdent leur zone, a la demande de Mathieu. Les 49 zones figees
     calculees le 07/10 (periode « sans remise a zero ») sont supprimees :
     le board ne les lit plus. */

-- A. Reservations par palier
ALTER TABLE public.paliers_percos
    ADD COLUMN IF NOT EXISTS resa INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.paliers_percos DROP CONSTRAINT IF EXISTS paliers_percos_resa_check;
ALTER TABLE public.paliers_percos
    ADD CONSTRAINT paliers_percos_resa_check CHECK (resa BETWEEN 0 AND 5);

-- B. Rang du choix obtenu (1 = premier choix, 0 = zone par defaut)
ALTER TABLE public.perco_reservations
    ADD COLUMN IF NOT EXISTS choix INTEGER;

-- C. Taille du top de preferences
INSERT INTO public.site_config (cle, valeur)
VALUES ('perco_pref_max', '5')
ON CONFLICT (cle) DO NOTHING;

-- D. Nombre de tours : vient des paliers maintenant
DELETE FROM public.site_config WHERE cle = 'perco_resa_tours';

-- E0. Classement sans remise a zero en ce moment (illimite, ou depart
--     programme pas encore atteint, sql/057) : debut = sentinelle 2000-01-01
CREATE OR REPLACE FUNCTION public.pvp_periode_en_direct()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    SELECT public.debut_periode_pvp() = TIMESTAMPTZ '2000-01-01 00:00:00+00';
$$;

-- E. Le tirage (lecture seule)
CREATE OR REPLACE FUNCTION public.calculer_draft_percos(p_source TEXT DEFAULT 'courante')
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
           de l'ordre de l'alliance (principales puis secondaires) */
        IF array_length(v_reste_u, 1) IS NOT NULL THEN
            FOR v_i IN 1..array_length(v_reste_u, 1) LOOP
                v_zone := NULL;
                SELECT z.id INTO v_zone
                FROM public.zones_reservation z
                WHERE z.actif = TRUE
                  AND NOT (z.id = ANY (v_pris))
                  AND NOT EXISTS (
                      SELECT 1 FROM public.zones_bda b
                      WHERE lower(trim(b.nom_zone)) = lower(trim(z.nom)))
                ORDER BY CASE z.categorie WHEN 'principale' THEN 0 ELSE 1 END, z.ordre ASC
                LIMIT 1;

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

-- F. Attribution figee par periode (cron du lundi, recalcul admin)
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

-- G. Ce que lit le board
CREATE OR REPLACE FUNCTION public.attribution_percos_courante()
RETURNS TABLE (tour INTEGER, rang INTEGER, user_id UUID, zone_id INTEGER, choix INTEGER, nom TEXT, sous_titre TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF COALESCE((SELECT sc.valeur FROM public.site_config sc WHERE sc.cle = 'perco_mode'), 'points') <> 'rang'
       OR COALESCE((SELECT sc.valeur FROM public.site_config sc WHERE sc.cle = 'perco_reservations'), 'true') <> 'true' THEN
        RETURN;
    END IF;

    /* Sans remise a zero : le tirage sur le classement et les preferences actuels */
    IF public.pvp_periode_en_direct() THEN
        RETURN QUERY
            SELECT d.tour, d.rang, d.user_id, d.zone_id, d.choix, z.nom::TEXT, z.sous_titre::TEXT
            FROM public.calculer_draft_percos('courante') d
            JOIN public.zones_reservation z ON z.id = d.zone_id
            ORDER BY d.tour, d.rang;
        RETURN;
    END IF;

    /* Avec une periode : l'attribution figee (calculee si elle manque encore) */
    PERFORM public.attribuer_percos_periode();
    RETURN QUERY
        SELECT r.tour, r.rang, r.user_id, r.zone_id, r.choix, z.nom::TEXT, z.sous_titre::TEXT
        FROM public.perco_reservations r
        JOIN public.zones_reservation z ON z.id = r.zone_id
        WHERE r.periode_debut = public.debut_periode_pvp()
        ORDER BY r.tour, r.rang;
END;
$function$;

-- H. Droits : le tirage est interne, le board passe par attribution_percos_courante()
REVOKE ALL ON FUNCTION public.calculer_draft_percos(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculer_draft_percos(TEXT) TO service_role;
REVOKE ALL ON FUNCTION public.attribution_percos_courante() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.attribution_percos_courante() TO authenticated, service_role;

-- I. Reglage du jour (07/10/2026) : reservations pour le top 10 seulement,
--    total inchange pour eux (4 percos dont 1 en zone reservee). Ne
--    s'applique que si le palier est encore tel qu'il etait ce jour-la.
UPDATE public.paliers_percos
   SET percos = percos - 1, resa = 1
 WHERE rang_min = 1 AND rang_max = 10 AND percos = 4 AND percos_150 = 0 AND resa = 0;

-- J. Les zones figees de la periode « sans remise a zero » ne servent plus
DELETE FROM public.perco_reservations
 WHERE periode_debut = TIMESTAMPTZ '2000-01-01 00:00:00+00';

NOTIFY pgrst, 'reload schema';
