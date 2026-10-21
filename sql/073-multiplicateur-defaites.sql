/* ============================================ */
/* 073 : multiplicateur d'alliance en defaite   */
/* ============================================ */
/* Demande de Ror (21/10/2026) : « victoire ou  */
/* defaite c'est pareil, ca doit suivre la meme */
/* logique ». Le multiplicateur de l'alliance   */
/* ennemie (VSA x2) s'appliquait seulement aux  */
/* points de victoire ; il s'applique aussi aux */
/* points obtenus malgre la defaite.            */
/* Les defaites de la semaine en cours sont     */
/* recalculees (script apply-073.js) ; les      */
/* semaines passees, deja tirees, ne bougent pas.*/

CREATE OR REPLACE FUNCTION public.calculer_points(
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

    -- Appliquer le multiplicateur de l'alliance, en victoire comme en defaite
    IF p_alliance_id IS NOT NULL THEN
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
