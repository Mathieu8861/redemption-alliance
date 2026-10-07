/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* 057 : periode du classement PvP, semaine calee sur le jour choisi et
   demarrage programme (demande Mathieu 07/10/2026 : « a partir de jeudi
   minuit, le classement PvP repart a zero chaque semaine, du jeudi au
   jeudi ; le PvP definitif, les kamas voles, etc. ne bougent pas ; les
   droits percos suivent »).

   - Hebdomadaire : blocs de 7 jours a partir de la date de depart, dont
     le jour fixe celui de la remise a zero (jeudi ici), au lieu du lundi
     impose. Avec l'ancienne date par defaut (lundi 27/07/2026), rien ne
     change.
   - Depart programme : pour tous les rythmes avec remise a zero, tant que
     la date de depart n'est pas atteinte, le classement reste sans remise
     a zero ; la premiere remise a zero tombe ce jour-la a minuit (Paris).
     On peut donc regler aujourd'hui un changement qui part demain.
     Mensuel : mois civils, le premier commence a la date de depart.
   - fin_periode_pvp() : date de la prochaine remise a zero (la premiere
     si elle est programmee), calculee en dates de Paris pour ne pas
     glisser d'une heure au changement d'heure.
   - periode_pvp_infos() : + en_direct (pas de remise a zero en ce moment),
     + programme (premiere remise a zero a venir).
   - Seules les vues classement_pvp_semaine et classement_pvp_semaine_passee
     et le ladder des percos lisent ces fonctions : PvP definitif, kamas
     voles, pepites et recyclages ne sont pas concernes.
   - Cron des zones : toutes les heures au lieu du lundi, pour que le tirage
     d'une nouvelle periode soit fige des son debut quel que soit le jour
     (la fonction est idempotente).
   - Reglage du jour : hebdomadaire, depart le jeudi 08/10/2026. */

/* === DEBUT DE LA PERIODE EN COURS === */
CREATE OR REPLACE FUNCTION public.debut_periode_pvp()
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    SELECT CASE
        WHEN r.mode = 'illimite' THEN TIMESTAMPTZ '2000-01-01 00:00:00+00'
        /* Depart programme pas encore atteint : pas de remise a zero */
        WHEN (NOW() AT TIME ZONE 'Europe/Paris')::date < r.ancre THEN TIMESTAMPTZ '2000-01-01 00:00:00+00'
        WHEN r.mode = 'hebdo'
            THEN ((r.ancre + 7 * FLOOR(((NOW() AT TIME ZONE 'Europe/Paris')::date - r.ancre) / 7.0)::int)::timestamp) AT TIME ZONE 'Europe/Paris'
        WHEN r.mode = 'mensuel'
            THEN GREATEST(date_trunc('month', NOW() AT TIME ZONE 'Europe/Paris'), r.ancre::timestamp) AT TIME ZONE 'Europe/Paris'
        WHEN r.mode = 'quinzaine'
            THEN ((r.ancre + 14 * FLOOR(((NOW() AT TIME ZONE 'Europe/Paris')::date - r.ancre) / 14.0)::int)::timestamp) AT TIME ZONE 'Europe/Paris'
        ELSE ((r.ancre + r.jours * FLOOR(((NOW() AT TIME ZONE 'Europe/Paris')::date - r.ancre) / r.jours::numeric)::int)::timestamp) AT TIME ZONE 'Europe/Paris'
    END
    FROM public.pvp_periode_reglages() r;
$$;

/* === PROCHAINE REMISE A ZERO (NULL si illimite) === */
CREATE OR REPLACE FUNCTION public.fin_periode_pvp()
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    SELECT CASE
        WHEN r.mode = 'illimite' THEN NULL::timestamptz
        /* Depart programme : la premiere remise a zero */
        WHEN (NOW() AT TIME ZONE 'Europe/Paris')::date < r.ancre THEN (r.ancre::timestamp) AT TIME ZONE 'Europe/Paris'
        WHEN r.mode = 'hebdo'     THEN ((d.jour + 7)::timestamp) AT TIME ZONE 'Europe/Paris'
        WHEN r.mode = 'quinzaine' THEN ((d.jour + 14)::timestamp) AT TIME ZONE 'Europe/Paris'
        WHEN r.mode = 'mensuel'   THEN (date_trunc('month', d.jour::timestamp) + INTERVAL '1 month') AT TIME ZONE 'Europe/Paris'
        ELSE ((d.jour + r.jours)::timestamp) AT TIME ZONE 'Europe/Paris'
    END
    FROM public.pvp_periode_reglages() r,
         (SELECT (public.debut_periode_pvp() AT TIME ZONE 'Europe/Paris')::date AS jour) d;
$$;

/* === DEBUT DE LA PERIODE PRECEDENTE === */
/* Sans remise a zero : periode precedente vide (meme debut que la courante).
   Premiere periode apres le depart : les jours juste avant (ex : les 7
   derniers jours avant le premier jeudi), dont le classement donne les
   droits percos de cette premiere periode. */
CREATE OR REPLACE FUNCTION public.debut_periode_pvp_precedente()
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    SELECT CASE
        WHEN public.debut_periode_pvp() = TIMESTAMPTZ '2000-01-01 00:00:00+00' THEN public.debut_periode_pvp()
        WHEN r.mode = 'hebdo'     THEN ((d.jour - 7)::timestamp) AT TIME ZONE 'Europe/Paris'
        WHEN r.mode = 'quinzaine' THEN ((d.jour - 14)::timestamp) AT TIME ZONE 'Europe/Paris'
        WHEN r.mode = 'mensuel'   THEN (date_trunc('month', d.jour::timestamp) - INTERVAL '1 month') AT TIME ZONE 'Europe/Paris'
        ELSE ((d.jour - r.jours)::timestamp) AT TIME ZONE 'Europe/Paris'
    END
    FROM public.pvp_periode_reglages() r,
         (SELECT (public.debut_periode_pvp() AT TIME ZONE 'Europe/Paris')::date AS jour) d;
$$;

/* === INFOS POUR L'AFFICHAGE (classement, board, admin) === */
CREATE OR REPLACE FUNCTION public.periode_pvp_infos()
RETURNS JSON
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    SELECT json_build_object(
        'mode',      r.mode,
        'jours',     r.jours,
        'ancre',     r.ancre,
        'debut',     public.debut_periode_pvp(),
        'fin',       public.fin_periode_pvp(),
        'en_direct', public.pvp_periode_en_direct(),
        'programme', (r.mode <> 'illimite' AND (NOW() AT TIME ZONE 'Europe/Paris')::date < r.ancre),
        'libelle',   CASE r.mode
                         WHEN 'illimite'  THEN 'Depuis le début'
                         WHEN 'hebdo'     THEN 'Semaine'
                         WHEN 'quinzaine' THEN 'Quinzaine'
                         WHEN 'mensuel'   THEN 'Mois'
                         ELSE 'Période de ' || r.jours || ' jours'
                     END
    )
    FROM public.pvp_periode_reglages() r;
$$;

/* === CRON DES ZONES : toutes les heures === */
SELECT cron.alter_job(j.jobid, schedule := '5 * * * *')
FROM cron.job j
WHERE j.jobname = 'attribuer-percos';

/* === REGLAGE DU JOUR : chaque semaine du jeudi au jeudi, a partir du 08/10/2026 === */
INSERT INTO public.site_config (cle, valeur) VALUES
    ('pvp_periode_mode', 'hebdo'),
    ('pvp_periode_ancre', '2026-10-08')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur;

NOTIFY pgrst, 'reload schema';
