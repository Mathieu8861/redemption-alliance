/* ============================================ */
/* 074 : percepteur seul, sans multiplicateur   */
/* ============================================ */
/* Demande de Ror (23/10/2026), apres l'annonce */
/* de fin de la regle « pas d'attaque a 1, 2 ou */
/* 3 » : un percepteur abattu sans personne en  */
/* defense (0 ennemi) rapporte 0,5 point, VSA   */
/* comprise, sans le x2 de l'alliance.          */
/* Le multiplicateur reste applique a tous les  */
/* autres combats, en victoire comme en defaite.*/
/* Les percepteurs seuls de la semaine en cours */
/* sont recalcules (script apply-074.js) ; les  */
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

    -- Appliquer le multiplicateur de l'alliance, en victoire comme en defaite,
    -- sauf sur un percepteur seul (0 ennemi) : il vaut le bareme, toutes alliances confondues
    IF p_alliance_id IS NOT NULL AND p_nb_ennemis > 0 THEN
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
