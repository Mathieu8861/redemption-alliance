/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* 063 : outil de compo des simu pour les organisateurs (demande Mathieu
   08/10/2026). Les organisateurs annoncent la simu dans #event, les membres
   cochent ✅ ; le site lit les inscriptions a une heure reglable (30 min
   avant le lancement par defaut), propose les equipes (Feca / Eni / Iop /
   Panda / Autre), MAsdov ou Seraphin les ajustent en glissant les joueurs,
   puis un bouton publie les equipes dans #event en taguant les joueurs.

   - profiles.organisateur_event : acces a l'outil (en plus des admins).
     MAsdov et Seraphin au depart. Protege comme is_admin : un membre ne
     peut pas se le donner (protect_admin_fields).
   - simu_events : une ligne par annonce #event (identifiant du message
     Discord), avec l'heure de lancement, le delai de lecture, la derniere
     lecture des ✅ (inscrits), la liste figee a l'heure de lecture
     (inscrits_a_l_heure : ceux qui cochent apres sont des retardataires),
     la compo en cours (jsonb) et le message publie. Lecture et ecriture
     reservees aux organisateurs et aux admins.
   - site_config : simu_lecture_avant_min (30) et simu_modeles (les deux
     formules vues dans #event : Feca / Eni / Iop / Panda / Autre, et sans
     Feca : Eni / Iop / Panda / Sacri / Sadi). */

-- A. Droit d'organiser les simu
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organisateur_event BOOLEAN NOT NULL DEFAULT FALSE;

/* Avant d'etendre la protection : apres, une mise a jour hors session admin serait annulee */
UPDATE public.profiles SET organisateur_event = TRUE
 WHERE username IN ('MAsdov', 'Seraphin') AND NOT organisateur_event;

CREATE OR REPLACE FUNCTION public.protect_admin_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
        NEW.is_admin := OLD.is_admin;
        NEW.is_validated := OLD.is_validated;
        NEW.organisateur_event := OLD.organisateur_event;
    END IF;
    RETURN NEW;
END;
$function$;

-- B. Les simu
CREATE TABLE IF NOT EXISTS public.simu_events (
    id                  BIGSERIAL PRIMARY KEY,
    discord_message_id  TEXT NOT NULL UNIQUE,
    discord_channel_id  TEXT NOT NULL,
    auteur_discord_id   TEXT,
    auteur_nom          TEXT,
    texte               TEXT,
    annonce_le          TIMESTAMPTZ,
    lancement           TIMESTAMPTZ,
    lecture_avant_min   INTEGER NOT NULL DEFAULT 30 CHECK (lecture_avant_min BETWEEN 0 AND 720),
    inscrits            JSONB NOT NULL DEFAULT '[]'::jsonb,
    lu_le               TIMESTAMPTZ,
    inscrits_a_l_heure  JSONB,
    cloture_le          TIMESTAMPTZ,
    compo               JSONB,
    message_fin         TEXT,
    publie_message_id   TEXT,
    publie_le           TIMESTAMPTZ,
    maj_par             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    maj_le              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_simu_events_lancement ON public.simu_events (lancement DESC);

ALTER TABLE public.simu_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "simu_events_organisateurs" ON public.simu_events;
CREATE POLICY "simu_events_organisateurs" ON public.simu_events
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin OR p.organisateur_event)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin OR p.organisateur_event)));

/* Deux organisateurs sur la meme compo : chacun voit les changements de l'autre */
DO $pub$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'simu_events') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.simu_events;
    END IF;
END
$pub$;

-- C. Reglages
INSERT INTO public.site_config (cle, valeur) VALUES
    ('simu_lecture_avant_min', '30'),
    ('simu_modeles', '[["Feca","Eniripsa","Iop","Pandawa","*"],["Eniripsa","Iop","Pandawa","Sacrieur","Sadida"]]')
ON CONFLICT (cle) DO NOTHING;

NOTIFY pgrst, 'reload schema';
