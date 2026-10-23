/* ============================================ */
/* 075 : le Tempo, 3e resultat d'un combat      */
/* ============================================ */
/* Demande de Ror (23/10/2026) : un tempo, c'est */
/* aller en combat en infériorité (seul, a 2 ou  */
/* 3...) uniquement pour faire perdre du temps   */
/* a l'ennemi, pas pour gagner. C'est donc un    */
/* resultat a part, avec son propre bareme, et   */
/* il ne se cumule pas avec une victoire ou une  */
/* defaite.                                      */
/*  - resultat 'tempo' + tempo_minutes (debut de */
/*    la tranche de 5 min : 5, 10, 15 ou 20)     */
/*  - seulement en inferiorite numerique         */
/*  - points fixes par tranche (table            */
/*    bareme_tempo, reglable dans l'admin), sans */
/*    multiplicateur d'alliance                  */
/*  - pas compte comme une defaite dans les      */
/*    ratios de victoires                        */

-- 1) Le bareme a part
CREATE TABLE IF NOT EXISTS public.bareme_tempo (
    minutes INTEGER PRIMARY KEY CHECK (minutes > 0 AND minutes % 5 = 0),
    points NUMERIC NOT NULL DEFAULT 0 CHECK (points >= 0)
);

INSERT INTO public.bareme_tempo (minutes, points) VALUES
    (5, 0.5), (10, 1), (15, 1.5), (20, 2)
ON CONFLICT (minutes) DO NOTHING;

ALTER TABLE public.bareme_tempo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bareme_tempo_select ON public.bareme_tempo;
CREATE POLICY bareme_tempo_select ON public.bareme_tempo
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS bareme_tempo_admin_update ON public.bareme_tempo;
CREATE POLICY bareme_tempo_admin_update ON public.bareme_tempo
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- 2) Le combat : nouveau resultat et sa duree
ALTER TABLE public.combats ADD COLUMN IF NOT EXISTS tempo_minutes INTEGER;

ALTER TABLE public.combats DROP CONSTRAINT IF EXISTS combats_resultat_check;
ALTER TABLE public.combats ADD CONSTRAINT combats_resultat_check
    CHECK (resultat = ANY (ARRAY['victoire'::text, 'defaite'::text, 'tempo'::text]));

-- Un tempo a une duree et se joue en inferiorite ; les autres resultats n'ont pas de duree
ALTER TABLE public.combats DROP CONSTRAINT IF EXISTS combats_tempo_check;
ALTER TABLE public.combats ADD CONSTRAINT combats_tempo_check
    CHECK (
        (resultat = 'tempo' AND tempo_minutes IS NOT NULL AND nb_allies < nb_ennemis)
        OR (resultat <> 'tempo' AND tempo_minutes IS NULL)
    );

-- 3) Les points d'un tempo : la tranche declaree, rien d'autre
CREATE OR REPLACE FUNCTION public.points_tempo(p_minutes INTEGER)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT COALESCE((SELECT trim_scale(b.points) FROM public.bareme_tempo b WHERE b.minutes = p_minutes), 0);
$function$;

-- 4) Edition par l'auteur : les points d'un tempo viennent du bareme tempo
CREATE OR REPLACE FUNCTION public.combat_update_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    is_adm BOOLEAN;
BEGIN
    SELECT is_admin INTO is_adm FROM public.profiles WHERE id = auth.uid();
    IF COALESCE(is_adm, false) THEN
        RETURN NEW;
    END IF;
    /* Non-admin (auteur dans sa fenetre de 3h, ou cle service) :
       identite et horodatage verrouilles, points imposes par le bareme */
    NEW.auteur_id := OLD.auteur_id;
    NEW.created_at := OLD.created_at;
    IF NEW.resultat = 'tempo' THEN
        NEW.points_gagnes := public.points_tempo(NEW.tempo_minutes);
    ELSE
        NEW.points_gagnes := public.calculer_points(
            p_nb_allies => NEW.nb_allies,
            p_nb_ennemis => NEW.nb_ennemis,
            p_resultat => NEW.resultat,
            p_alliance_id => NEW.alliance_ennemie_id,
            p_type => NEW.type
        );
    END IF;
    RETURN NEW;
END;
$function$;

-- 5) Ratios de victoires : un tempo n'est ni une victoire ni une defaite
CREATE OR REPLACE FUNCTION public.get_member_stats()
 RETURNS TABLE(user_id uuid, username text, classe text, element text, jetons integer, percepteurs integer, referent_pvp text, disponibilite_pvp text, avatar_url text, dofusbook_url text, mules text[], total_attaques bigint, victoires_attaque bigint, total_defenses bigint, victoires_defense bigint, eq_attaques bigint, eq_victoires_attaque bigint, eq_defenses bigint, eq_victoires_defense bigint, total_kamas numeric, total_points numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS user_id,
        p.username,
        p.classe,
        p.element,
        p.jetons,
        p.percepteurs,
        p.referent_pvp,
        p.disponibilite_pvp,
        p.avatar_url,
        p.dofusbook_url,
        p.mules,
        COALESCE(stats.total_atk, 0)::BIGINT AS total_attaques,
        COALESCE(stats.win_atk, 0)::BIGINT AS victoires_attaque,
        COALESCE(stats.total_def, 0)::BIGINT AS total_defenses,
        COALESCE(stats.win_def, 0)::BIGINT AS victoires_defense,
        COALESCE(stats.eq_atk, 0)::BIGINT AS eq_attaques,
        COALESCE(stats.eq_win_atk, 0)::BIGINT AS eq_victoires_attaque,
        COALESCE(stats.eq_def, 0)::BIGINT AS eq_defenses,
        COALESCE(stats.eq_win_def, 0)::BIGINT AS eq_victoires_defense,
        COALESCE(stats.kamas, 0)::NUMERIC AS total_kamas,
        COALESCE(stats.points, 0)::NUMERIC AS total_points
    FROM public.profiles p
    LEFT JOIN LATERAL (
        SELECT
            COUNT(*) FILTER (WHERE c.type = 'attaque' AND c.resultat <> 'tempo') AS total_atk,
            COUNT(*) FILTER (WHERE c.type = 'attaque' AND c.resultat = 'victoire') AS win_atk,
            COUNT(*) FILTER (WHERE c.type = 'defense' AND c.resultat <> 'tempo') AS total_def,
            COUNT(*) FILTER (WHERE c.type = 'defense' AND c.resultat = 'victoire') AS win_def,
            COUNT(*) FILTER (WHERE c.type = 'attaque' AND c.nb_allies = c.nb_ennemis) AS eq_atk,
            COUNT(*) FILTER (WHERE c.type = 'attaque' AND c.resultat = 'victoire' AND c.nb_allies = c.nb_ennemis) AS eq_win_atk,
            COUNT(*) FILTER (WHERE c.type = 'defense' AND c.nb_allies = c.nb_ennemis) AS eq_def,
            COUNT(*) FILTER (WHERE c.type = 'defense' AND c.resultat = 'victoire' AND c.nb_allies = c.nb_ennemis) AS eq_win_def,
            SUM(CASE WHEN c.type = 'attaque' AND c.resultat = 'victoire' THEN c.butin_kamas / GREATEST(c.nb_allies, 1) ELSE 0 END) AS kamas,
            SUM(c.points_gagnes) AS points
        FROM public.combat_participants cp
        JOIN public.combats c ON c.id = cp.combat_id
        WHERE cp.user_id = p.id
    ) stats ON TRUE
    WHERE p.is_validated = TRUE
    ORDER BY p.username;
END;
$function$;
