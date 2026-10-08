/* 064 : mise en ligne de la page Simu (simu.html)
   Projet Supabase : yebfbdgxikbnqdkbycam (Redemption).

   - Lecture des simu pour tous les membres valides : la vue joueur montre la
     prochaine simu, la place du joueur et les equipes, sans rien pouvoir
     modifier. L'ecriture reste reservee aux admins et aux organisateurs
     (policy simu_events_organisateurs, migration 063).
   - Lecture automatique des ✅ a l'heure reglee, meme sans page ouverte :
     chaque minute, si une simu a passe son heure de lecture sans liste
     figee, pg_cron appelle la route Vercel api/simu (action auto) avec le
     secret partage. Le secret est dans le coffre (vault, nom
     simu_cron_secret) et dans la variable Vercel SIMU_CRON_SECRET, jamais
     dans ce fichier. */

-- A. Lecture pour les membres valides
DROP POLICY IF EXISTS "simu_events_lecture_membres" ON public.simu_events;
CREATE POLICY "simu_events_lecture_membres" ON public.simu_events
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_validated));

-- B. Appel planifie de la route api/simu
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.simu_lecture_auto()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_secret TEXT;
BEGIN
    /* Aucune simu a figer : pas d'appel */
    IF NOT EXISTS (
        SELECT 1 FROM public.simu_events
        WHERE inscrits_a_l_heure IS NULL
          AND lancement IS NOT NULL
          AND lancement >= now() - interval '6 hours'
          AND lancement - make_interval(mins => lecture_avant_min) <= now()
    ) THEN
        RETURN;
    END IF;
    SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'simu_cron_secret' LIMIT 1;
    IF v_secret IS NULL THEN
        RAISE WARNING 'simu_lecture_auto : secret simu_cron_secret absent du coffre';
        RETURN;
    END IF;
    PERFORM net.http_post(
        url := 'https://redemption-alliance.vercel.app/api/simu',
        body := '{}'::jsonb,
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-simu-secret', v_secret),
        timeout_milliseconds := 20000
    );
END;
$function$;

/* Fonction du schema public : sans ce REVOKE, un membre pourrait la lancer
   en RPC */
REVOKE ALL ON FUNCTION public.simu_lecture_auto() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.simu_lecture_auto() FROM anon, authenticated;

SELECT cron.schedule('simu-lecture-auto', '* * * * *', $$SELECT public.simu_lecture_auto()$$);
