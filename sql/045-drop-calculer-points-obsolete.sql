-- 045 - Supprime la surcharge obsolete de calculer_points
--
-- Contexte : le script 005 a ajoute le parametre p_type (bareme attaque distinct du
-- bareme defense), mais le script 008 a ensuite recree la version a 4 parametres.
-- Comme les signatures different, PostgreSQL a garde les DEUX fonctions :
--   calculer_points(int, int, text, int)                 <- obsolete
--   calculer_points(int, int, text, int, text)           <- celle du site
--
-- Deux consequences :
--   1. Un appel REST a 4 parametres devient ambigu -> erreur PGRST203
--      « Could not choose the best candidate function ».
--   2. La version obsolete lit bareme_points SANS filtrer sur le type. Depuis que
--      la table contient les deux baremes (25 lignes attaque + 25 defense), elle
--      renvoyait une ligne au hasard. Exemple constate en 5v5 victoire :
--      3 points en attaque contre 4 en defense.
--
-- Tous les appelants passent deja p_type (attaque.js, defense.js, historique.js
-- et le trigger combat_update_guard), la fonction supprimee n'est plus utilisee.

DROP FUNCTION IF EXISTS public.calculer_points(integer, integer, text, integer);

-- Verification : doit renvoyer exactement une ligne, celle avec p_type
SELECT pg_get_function_arguments(p.oid) AS signature_restante
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'calculer_points';

-- Recharge le cache de PostgREST pour que l'API voie le changement tout de suite
NOTIFY pgrst, 'reload schema';
