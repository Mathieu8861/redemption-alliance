/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* 1) Periode du classement PvP reglable depuis l'admin.

   Jusqu'ici debut_periode_pvp() etait code en dur : blocs de 14 jours
   ancres au lundi 27/07/2026. Mathieu veut decider lui-meme (hebdo,
   quinzaine, mois, sans remise a zero, ou N jours) et, pour l'instant,
   laisser tourner sans remise a zero tant que la regle n'est pas fixee.

   Reglages dans site_config (lecture publique, ecriture admin) :
     pvp_periode_mode  : illimite | hebdo | quinzaine | mensuel | personnalise
     pvp_periode_jours : entier, utilise par « personnalise »
     pvp_periode_ancre : date AAAA-MM-JJ, point de depart des blocs
                         (quinzaine et personnalise)

   Le cron du lundi (attribuer_percos_periode) lit la meme fonction, mais
   il ne fait rien tant que perco_mode = 'points' (cas actuel).

   2) Vue v_recyclages_derniere_distribution_par_user : pour la page
   membre, la date de la derniere distribution de chacun et ce qu'il a
   recu. Le « depuis la derniere distribution » vient deja de
   v_recyclages_periode_par_user (distribution_id IS NULL). */

/* === REGLAGES PAR DEFAUT (sans ecraser l'existant) === */
INSERT INTO public.site_config (cle, valeur)
VALUES ('pvp_periode_mode', 'illimite'),
       ('pvp_periode_jours', '14'),
       ('pvp_periode_ancre', '2026-07-27')
ON CONFLICT (cle) DO NOTHING;

/* === LECTURE DES REGLAGES, TOLERANTE AUX VALEURS MAL SAISIES === */
CREATE OR REPLACE FUNCTION public.pvp_periode_reglages()
RETURNS TABLE (mode TEXT, jours INTEGER, ancre DATE)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    SELECT
        CASE WHEN (SELECT valeur FROM public.site_config WHERE cle = 'pvp_periode_mode')
                  IN ('illimite', 'hebdo', 'quinzaine', 'mensuel', 'personnalise')
             THEN (SELECT valeur FROM public.site_config WHERE cle = 'pvp_periode_mode')
             ELSE 'illimite' END,
        GREATEST(1, COALESCE(
            NULLIF(regexp_replace(COALESCE((SELECT valeur FROM public.site_config WHERE cle = 'pvp_periode_jours'), ''), '[^0-9]', '', 'g'), '')::INTEGER,
            14)),
        CASE WHEN COALESCE((SELECT valeur FROM public.site_config WHERE cle = 'pvp_periode_ancre'), '') ~ '^\d{4}-\d{2}-\d{2}$'
             THEN (SELECT valeur FROM public.site_config WHERE cle = 'pvp_periode_ancre')::DATE
             ELSE DATE '2026-07-27' END;
$$;

/* === DEBUT DE LA PERIODE EN COURS === */
/* Meme signature qu'avant : les vues classement_pvp_semaine et
   classement_pvp_semaine_passee et la fonction attribuer_percos_periode
   continuent de l'appeler telle quelle. */
CREATE OR REPLACE FUNCTION public.debut_periode_pvp()
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    SELECT CASE r.mode
        WHEN 'illimite'  THEN TIMESTAMPTZ '2000-01-01 00:00:00+00'
        WHEN 'hebdo'     THEN date_trunc('week',  NOW() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris'
        WHEN 'mensuel'   THEN date_trunc('month', NOW() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris'
        WHEN 'quinzaine' THEN ((r.ancre + 14 * FLOOR(((NOW() AT TIME ZONE 'Europe/Paris')::date - r.ancre) / 14.0)::int)::timestamp) AT TIME ZONE 'Europe/Paris'
        ELSE                  ((r.ancre + r.jours * FLOOR(((NOW() AT TIME ZONE 'Europe/Paris')::date - r.ancre) / r.jours::numeric)::int)::timestamp) AT TIME ZONE 'Europe/Paris'
    END
    FROM public.pvp_periode_reglages() r;
$$;

/* === FIN DE LA PERIODE EN COURS (NULL si illimite) === */
CREATE OR REPLACE FUNCTION public.fin_periode_pvp()
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    SELECT CASE r.mode
        WHEN 'illimite'  THEN NULL::timestamptz
        WHEN 'hebdo'     THEN public.debut_periode_pvp() + INTERVAL '7 days'
        WHEN 'mensuel'   THEN public.debut_periode_pvp() + INTERVAL '1 month'
        WHEN 'quinzaine' THEN public.debut_periode_pvp() + INTERVAL '14 days'
        ELSE                  public.debut_periode_pvp() + make_interval(days => r.jours)
    END
    FROM public.pvp_periode_reglages() r;
$$;

/* === DEBUT DE LA PERIODE PRECEDENTE === */
/* En illimite, la periode precedente est vide : on renvoie le debut de
   la periode en cours, ce qui donne un intervalle [debut, debut) sans
   aucun combat. */
CREATE OR REPLACE FUNCTION public.debut_periode_pvp_precedente()
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    SELECT CASE r.mode
        WHEN 'illimite'  THEN public.debut_periode_pvp()
        WHEN 'hebdo'     THEN public.debut_periode_pvp() - INTERVAL '7 days'
        WHEN 'mensuel'   THEN public.debut_periode_pvp() - INTERVAL '1 month'
        WHEN 'quinzaine' THEN public.debut_periode_pvp() - INTERVAL '14 days'
        ELSE                  public.debut_periode_pvp() - make_interval(days => r.jours)
    END
    FROM public.pvp_periode_reglages() r;
$$;

/* La vue de la periode precedente codait « 14 jours » en dur */
CREATE OR REPLACE VIEW public.classement_pvp_semaine_passee AS
SELECT p.id,
       p.username,
       COALESCE(SUM(c.points_gagnes), 0)::integer AS points
  FROM public.profiles p
  LEFT JOIN public.combat_participants cp ON cp.user_id = p.id
  LEFT JOIN public.combats c ON c.id = cp.combat_id
                             AND c.created_at >= public.debut_periode_pvp_precedente()
                             AND c.created_at <  public.debut_periode_pvp()
 WHERE p.is_validated = true
 GROUP BY p.id, p.username
HAVING COALESCE(SUM(c.points_gagnes), 0) > 0
 ORDER BY COALESCE(SUM(c.points_gagnes), 0)::integer DESC;

/* === INFOS POUR L'AFFICHAGE (page classement + admin) === */
CREATE OR REPLACE FUNCTION public.periode_pvp_infos()
RETURNS JSON
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    SELECT json_build_object(
        'mode',    r.mode,
        'jours',   r.jours,
        'ancre',   r.ancre,
        'debut',   public.debut_periode_pvp(),
        'fin',     public.fin_periode_pvp(),
        'libelle', CASE r.mode
                       WHEN 'illimite'  THEN 'Depuis le début'
                       WHEN 'hebdo'     THEN 'Semaine'
                       WHEN 'quinzaine' THEN 'Quinzaine'
                       WHEN 'mensuel'   THEN 'Mois'
                       ELSE 'Période de ' || r.jours || ' jours'
                   END
    )
    FROM public.pvp_periode_reglages() r;
$$;

/* === PAGE MEMBRE : DERNIERE DISTRIBUTION DE CHACUN === */
/* Une ligne par membre ayant deja ete distribue : la date de sa derniere
   distribution et le total de pepites alliance qu'elle lui a solde. */
CREATE OR REPLACE VIEW public.v_recyclages_derniere_distribution_par_user AS
SELECT DISTINCT ON (r.user_id)
       r.user_id,
       d.id            AS distribution_id,
       d.distribue_le,
       SUM(r.pepites_alliance) OVER (PARTITION BY r.user_id, d.id) AS total_alliance_distribue,
       COUNT(r.id)             OVER (PARTITION BY r.user_id, d.id) AS nb_recyclages_distribues
  FROM public.recyclages r
  JOIN public.recyclages_distributions d ON d.id = r.distribution_id
 ORDER BY r.user_id, d.distribue_le DESC;

NOTIFY pgrst, 'reload schema';
