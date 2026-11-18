-- ============================================================================
-- 087 : la Ferme d'Incarnam, le tableau des vagues de l'admin (18/11/2026)
-- ============================================================================
-- « faire un board côté admin avec toutes les vagues, avec le % de win rate, le nombre de try, le nombre de fois gagné / perdu, un truc
-- qui me permettra de savoir quelles ont été les vagues les plus simples et les plus dures, et en fonction des classes » (Mathieu)
--
-- ferme_admin_vagues() : pour chaque joueur, et pour chacune de ses autres parties (les persos rangés), la classe, la vague où il en est,
-- ses défaites par vague (etat.defaitesVague, depuis le début) et son journal des 50 dernières vagues (etat.journalVagues, depuis le
-- 17/11/2026). Le site fait les comptes (site/js/admin-ferme.js, vue « Vagues »). Réservée aux admins, en lecture seule.
-- À coller dans l'éditeur SQL de Supabase (projet de l'alliance), une seule fois.

CREATE OR REPLACE FUNCTION public.ferme_admin_vagues()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE r JSON;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin) THEN RETURN json_build_object('ok', false, 'erreur', 'admin'); END IF;
    SELECT COALESCE(json_agg(x), '[]'::JSON) INTO r FROM (
        SELECT COALESCE(p.username, j.pseudo) AS nom,
               COALESCE(j.etat -> 'perso' ->> 'classe', j.classe) AS classe,
               j.etat -> 'vague' -> 'num' AS vague,
               CASE WHEN jsonb_typeof(j.etat -> 'defaitesVague') = 'object' THEN j.etat -> 'defaitesVague' ELSE '{}'::JSONB END AS defaites,
               CASE WHEN jsonb_typeof(j.etat -> 'journalVagues') = 'array' THEN j.etat -> 'journalVagues' ELSE '[]'::JSONB END AS journal,
               (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'classe', v -> 'perso' ->> 'classe',
                        'vague', v -> 'vague' -> 'num',
                        'defaites', CASE WHEN jsonb_typeof(v -> 'defaitesVague') = 'object' THEN v -> 'defaitesVague' ELSE '{}'::JSONB END,
                        'journal', CASE WHEN jsonb_typeof(v -> 'journalVagues') = 'array' THEN v -> 'journalVagues' ELSE '[]'::JSONB END)), '[]'::JSONB)
                  FROM jsonb_each(CASE WHEN jsonb_typeof(j.etat -> 'parties') = 'object' THEN j.etat -> 'parties' ELSE '{}'::JSONB END) AS e(k, v)
                 WHERE jsonb_typeof(v) = 'object' AND jsonb_typeof(v -> 'perso') = 'object') AS parties
          FROM ferme_joueurs j LEFT JOIN profiles p ON p.id = j.user_id
         WHERE j.etat IS NOT NULL
    ) x;
    RETURN json_build_object('ok', true, 'joueurs', r);
END $$;

REVOKE ALL ON FUNCTION public.ferme_admin_vagues() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ferme_admin_vagues() TO authenticated;
