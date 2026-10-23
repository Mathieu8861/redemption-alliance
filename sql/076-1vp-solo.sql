/* ============================================ */
/* 076 : le 0,5 sans multiplicateur, en solo    */
/* ============================================ */
/* Precision de Ror (23/10/2026) : « 1vp = 1    */
/* personne seule (chez nous) qui attaque le    */
/* percepteur ». La 074 retirait le x2 de VSA   */
/* sur tout percepteur seul, quel que soit le   */
/* nombre d'allies : c'etait trop large. Seul   */
/* le 1 contre percepteur (1v0) vaut 0,5 fixe ; */
/* en groupe (2v0 a 5v0), le bareme reprend le  */
/* multiplicateur d'alliance (1 point contre    */
/* VSA, comme avant la 074).                    */

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
    -- sauf en 1 VP (seul contre un percepteur sans defense) : le bareme, sans plus
    IF p_alliance_id IS NOT NULL AND NOT (p_nb_allies = 1 AND p_nb_ennemis = 0) THEN
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
