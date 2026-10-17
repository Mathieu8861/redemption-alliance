/* ============================================ */
/* 070 : attaque d'un percepteur seul           */
/* ============================================ */
/* Quand personne ne vient defendre, le combat  */
/* se joue contre le percepteur seul : l'attaque */
/* se declare avec 0 ennemi et rapporte un      */
/* demi-point (demande de Ror, 17/10/2026).     */
/* Les points passent donc d'entiers a decimaux */
/* partout : bareme, combats, calcul, classements.*/
/* La defense ne peut pas avoir 0 ennemi.       */

/* --- Les vues de classement figent le type de points_gagnes : on les recree apres --- */
DROP VIEW public.classement_pvp_semaine;
DROP VIEW public.classement_pvp_semaine_passee;
DROP VIEW public.classement_pvp_definitif;

ALTER TABLE public.combats ALTER COLUMN points_gagnes TYPE NUMERIC USING points_gagnes::NUMERIC;
ALTER TABLE public.bareme_points
    ALTER COLUMN points_victoire TYPE NUMERIC USING points_victoire::NUMERIC,
    ALTER COLUMN points_defaite TYPE NUMERIC USING points_defaite::NUMERIC;
ALTER TABLE public.semaine_snapshots ALTER COLUMN points TYPE NUMERIC USING points::NUMERIC;

/* --- 0 ennemi : attaque seulement --- */
ALTER TABLE public.combats DROP CONSTRAINT combats_nb_ennemis_check;
ALTER TABLE public.combats ADD CONSTRAINT combats_nb_ennemis_check
    CHECK (nb_ennemis BETWEEN 0 AND 5 AND (nb_ennemis >= 1 OR type = 'attaque'));
ALTER TABLE public.bareme_points DROP CONSTRAINT bareme_points_nb_ennemis_check;
ALTER TABLE public.bareme_points ADD CONSTRAINT bareme_points_nb_ennemis_check
    CHECK (nb_ennemis BETWEEN 0 AND 5 AND (nb_ennemis >= 1 OR type = 'attaque'));

INSERT INTO public.bareme_points (type, nb_allies, nb_ennemis, points_victoire, points_defaite)
SELECT 'attaque', a, 0, 0.5, 0 FROM generate_series(1, 5) AS a
ON CONFLICT (type, nb_allies, nb_ennemis) DO NOTHING;

/* --- Calcul : le type de retour change, il faut supprimer puis recreer --- */
DROP FUNCTION public.calculer_points(INTEGER, INTEGER, TEXT, INTEGER, TEXT);
CREATE FUNCTION public.calculer_points(
    p_nb_allies INTEGER,
    p_nb_ennemis INTEGER,
    p_resultat TEXT,
    p_alliance_id INTEGER DEFAULT NULL,
    p_type TEXT DEFAULT 'attaque'
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    base_points NUMERIC;
    mult NUMERIC(3,1) := 1;
BEGIN
    -- Recuperer les points du bareme selon le type (attaque ou defense)
    SELECT
        CASE
            WHEN p_resultat = 'victoire' THEN b.points_victoire
            ELSE b.points_defaite
        END
    INTO base_points
    FROM public.bareme_points b
    WHERE b.nb_allies = p_nb_allies
      AND b.nb_ennemis = p_nb_ennemis
      AND b.type = p_type;

    IF base_points IS NULL THEN
        base_points := 0;
    END IF;

    -- Appliquer le multiplicateur de l'alliance (seulement en victoire)
    IF p_alliance_id IS NOT NULL AND p_resultat = 'victoire' THEN
        SELECT a.multiplicateur INTO mult
        FROM public.alliances a
        WHERE a.id = p_alliance_id;

        IF mult IS NULL THEN
            mult := 1;
        END IF;
    END IF;

    -- Arrondi au demi-point (et plus d'entier force : 0,5 doit rester 0,5)
    RETURN trim_scale(ROUND(base_points * mult * 2) / 2);
END;
$function$;
GRANT EXECUTE ON FUNCTION public.calculer_points(INTEGER, INTEGER, TEXT, INTEGER, TEXT) TO anon, authenticated, service_role;

/* --- Classements : memes vues, points decimaux (trim_scale : 109 et non 109.0) --- */
CREATE VIEW public.classement_pvp_semaine WITH (security_invoker = true) AS
 SELECT p.id,
    p.username,
    trim_scale(COALESCE(sum(c.points_gagnes), 0)) AS points
   FROM profiles p
     LEFT JOIN combat_participants cp ON cp.user_id = p.id
     LEFT JOIN combats c ON c.id = cp.combat_id AND c.created_at >= debut_periode_pvp()
  WHERE p.is_validated = true
  GROUP BY p.id, p.username
 HAVING COALESCE(sum(c.points_gagnes), 0) > 0
  ORDER BY (COALESCE(sum(c.points_gagnes), 0)) DESC;

CREATE VIEW public.classement_pvp_semaine_passee AS
 SELECT p.id,
    p.username,
    trim_scale(COALESCE(sum(c.points_gagnes), 0)) AS points
   FROM profiles p
     LEFT JOIN combat_participants cp ON cp.user_id = p.id
     LEFT JOIN combats c ON c.id = cp.combat_id AND c.created_at >= debut_periode_pvp_precedente() AND c.created_at < debut_periode_pvp()
  WHERE p.is_validated = true
  GROUP BY p.id, p.username
 HAVING COALESCE(sum(c.points_gagnes), 0) > 0
  ORDER BY (COALESCE(sum(c.points_gagnes), 0)) DESC;

CREATE VIEW public.classement_pvp_definitif WITH (security_invoker = true) AS
 SELECT p.id,
    p.username,
    trim_scale(COALESCE(sum(c.points_gagnes), 0)) AS points
   FROM profiles p
     LEFT JOIN combat_participants cp ON cp.user_id = p.id
     LEFT JOIN combats c ON c.id = cp.combat_id
  WHERE p.is_validated = true
  GROUP BY p.id, p.username
 HAVING COALESCE(sum(c.points_gagnes), 0) > 0
  ORDER BY (COALESCE(sum(c.points_gagnes), 0)) DESC;

GRANT ALL ON public.classement_pvp_semaine, public.classement_pvp_semaine_passee, public.classement_pvp_definitif
    TO anon, authenticated, service_role;
