-- =====================================================================
-- 091 : la Ferme d'Incarnam, la tenue des amis et du groupe (28/11/2026)
-- ---------------------------------------------------------------------
-- Demande de Mathieu : « au lieu des coiffes de base qu'on voit dans le groupe, il faudrait l'image
-- qu'on a quand on se connecte et qu'on choisit un personnage, même principe ».
-- Cette image n'est pas envoyée : le jeu la dessine à partir de la classe, de la version (masculine ou
-- féminine), de l'apparence et des coiffe, cape et arme portées. Il suffit donc de lire ces six valeurs
-- dans la sauvegarde (ferme_joueurs.etat, partie en cours), et seulement pour ses amis et les membres
-- de son groupe. Rien d'autre n'est lisible, rien n'est modifié.
--
-- ferme_tenues(p_jeton, p_ids) : 30 joueurs au plus par appel.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.ferme_tenues(p_jeton TEXT DEFAULT NULL, p_ids UUID[] DEFAULT '{}')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v UUID;
BEGIN
    v := ferme_qui(p_jeton);
    IF v IS NULL THEN RETURN json_build_object('ok', false, 'erreur', 'deconnecte'); END IF;
    RETURN json_build_object('ok', true, 'tenues', COALESCE((SELECT json_agg(json_build_object('id', j.id,
            'classe', COALESCE(j.etat -> 'perso' ->> 'classe', j.classe), 'sexe', j.etat -> 'perso' ->> 'sexe', 'look', j.etat -> 'perso' ->> 'look',
            'coiffe', j.etat -> 'equip' ->> 'coiffe', 'cape', j.etat -> 'equip' ->> 'cape', 'arme', j.etat -> 'equip' ->> 'arme'))
        FROM ferme_joueurs j
        WHERE j.id = ANY ((COALESCE(p_ids, '{}'::uuid[]))[1:30]) AND j.id <> v
          AND (EXISTS (SELECT 1 FROM ferme_amis a WHERE a.etat = 'amis' AND ((a.demandeur = v AND a.cible = j.id) OR (a.demandeur = j.id AND a.cible = v)))
            OR EXISTS (SELECT 1 FROM ferme_groupe_membres m1 JOIN ferme_groupe_membres m2 ON m2.groupe = m1.groupe WHERE m1.joueur = v AND m2.joueur = j.id))), '[]'::json));
END $$;

REVOKE ALL ON FUNCTION public.ferme_tenues(TEXT, UUID[]) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.ferme_tenues(TEXT, UUID[]) TO anon, authenticated;
