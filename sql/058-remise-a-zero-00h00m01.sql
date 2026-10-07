/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* 058 : la remise a zero du classement PvP tombe a 00:00:01 (heure de Paris)
   le jour de depart de chaque periode, et non plus a 00:00:00 (demande
   Mathieu 07/10/2026 : « minuit et 1 seconde jeudi 08, pour eviter la
   confusion entre mercredi 23h59 et vendredi »).

   - Les bornes de periode (debut, fin, debut de la precedente) sont la date
     de Paris a 00:00:01. Le jour courant se calcule sur NOW() - 1 seconde :
     entre 00:00:00 et 00:00:01, on est encore dans l'ancienne periode.
   - Le depart programme suit la meme regle : rien ne repart a zero avant la
     date de depart a 00:00:01.
   - Sans remise a zero, la sentinelle 2000-01-01 00:00:00 ne change pas
     (pvp_periode_en_direct() la compare telle quelle).
   - Le reste de 057 est inchange (hebdo cale sur le jour de la date de
     depart, dates de Paris pour le changement d'heure). */

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
        WHEN j.jour < r.ancre THEN TIMESTAMPTZ '2000-01-01 00:00:00+00'
        WHEN r.mode = 'hebdo'
            THEN ((r.ancre + 7 * FLOOR((j.jour - r.ancre) / 7.0)::int)::timestamp AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
        WHEN r.mode = 'mensuel'
            THEN (GREATEST(date_trunc('month', j.jour::timestamp), r.ancre::timestamp) AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
        WHEN r.mode = 'quinzaine'
            THEN ((r.ancre + 14 * FLOOR((j.jour - r.ancre) / 14.0)::int)::timestamp AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
        ELSE ((r.ancre + r.jours * FLOOR((j.jour - r.ancre) / r.jours::numeric)::int)::timestamp AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
    END
    FROM public.pvp_periode_reglages() r,
         (SELECT ((NOW() - INTERVAL '1 second') AT TIME ZONE 'Europe/Paris')::date AS jour) j;
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
        WHEN j.jour < r.ancre THEN (r.ancre::timestamp AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
        WHEN r.mode = 'hebdo'     THEN ((d.jour + 7)::timestamp AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
        WHEN r.mode = 'quinzaine' THEN ((d.jour + 14)::timestamp AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
        WHEN r.mode = 'mensuel'   THEN ((date_trunc('month', d.jour::timestamp) + INTERVAL '1 month') AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
        ELSE ((d.jour + r.jours)::timestamp AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
    END
    FROM public.pvp_periode_reglages() r,
         (SELECT ((NOW() - INTERVAL '1 second') AT TIME ZONE 'Europe/Paris')::date AS jour) j,
         (SELECT (public.debut_periode_pvp() AT TIME ZONE 'Europe/Paris')::date AS jour) d;
$$;

/* === DEBUT DE LA PERIODE PRECEDENTE === */
CREATE OR REPLACE FUNCTION public.debut_periode_pvp_precedente()
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    SELECT CASE
        WHEN public.debut_periode_pvp() = TIMESTAMPTZ '2000-01-01 00:00:00+00' THEN public.debut_periode_pvp()
        WHEN r.mode = 'hebdo'     THEN ((d.jour - 7)::timestamp AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
        WHEN r.mode = 'quinzaine' THEN ((d.jour - 14)::timestamp AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
        WHEN r.mode = 'mensuel'   THEN ((date_trunc('month', d.jour::timestamp) - INTERVAL '1 month') AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
        ELSE ((d.jour - r.jours)::timestamp AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
    END
    FROM public.pvp_periode_reglages() r,
         (SELECT (public.debut_periode_pvp() AT TIME ZONE 'Europe/Paris')::date AS jour) d;
$$;

/* === INFOS POUR L'AFFICHAGE : « programme » sur la meme regle === */
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
        'programme', (r.mode <> 'illimite' AND ((NOW() - INTERVAL '1 second') AT TIME ZONE 'Europe/Paris')::date < r.ancre),
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

NOTIFY pgrst, 'reload schema';
