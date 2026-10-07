/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* 059 : la premiere periode apres le passage a un rythme avec remise a zero
   prend ses droits sur tout l'historique d'avant (demande Mathieu 07/10/2026 :
   « c'est ce tableau qui compte, celui qui compte pour les droits percos de
   la semaine pro, c'est juste qu'on n'etait pas en hebdo pour le moment ;
   a partir de jeudi ca reset et on repart en mode normal »).

   - debut_periode_pvp_precedente() : pour la premiere periode apres la date
     de depart, renvoie la sentinelle 2000-01-01, donc la « periode
     precedente » couvre tout ce qui s'est passe avant le depart. Le ladder
     des droits (classement_pvp_semaine_passee) et le tirage des zones de la
     semaine du 8 au 14 octobre se font donc sur le classement cumule au
     08/10 00:00:01. Les periodes suivantes reprennent la regle normale (la
     semaine precedente).
   - periode_pvp_infos() : + precedente_cumulee (vrai pendant cette premiere
     periode) pour que le site l'ecrive. */

CREATE OR REPLACE FUNCTION public.debut_periode_pvp_precedente()
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    SELECT CASE
        WHEN public.debut_periode_pvp() = TIMESTAMPTZ '2000-01-01 00:00:00+00' THEN public.debut_periode_pvp()
        /* Premiere periode apres le depart : tout l'historique d'avant */
        WHEN d.jour <= r.ancre THEN TIMESTAMPTZ '2000-01-01 00:00:00+00'
        WHEN r.mode = 'hebdo'     THEN ((d.jour - 7)::timestamp AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
        WHEN r.mode = 'quinzaine' THEN ((d.jour - 14)::timestamp AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
        WHEN r.mode = 'mensuel'   THEN ((date_trunc('month', d.jour::timestamp) - INTERVAL '1 month') AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
        ELSE ((d.jour - r.jours)::timestamp AT TIME ZONE 'Europe/Paris') + INTERVAL '1 second'
    END
    FROM public.pvp_periode_reglages() r,
         (SELECT (public.debut_periode_pvp() AT TIME ZONE 'Europe/Paris')::date AS jour) d;
$$;

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
        'precedente_cumulee', (NOT public.pvp_periode_en_direct()
                               AND public.debut_periode_pvp_precedente() = TIMESTAMPTZ '2000-01-01 00:00:00+00'),
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
