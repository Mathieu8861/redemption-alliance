/* ============================================ */
/* 078 : reclamations sur les combats           */
/* ============================================ */
/* Demande de Ror (25/10/2026) : dans l'onglet  */
/* Corrections de l'Historique, un joueur peut  */
/* faire une « reclamation » pour qu'un admin   */
/* verifie un combat, avec un espace pour son   */
/* message. Le joueur voit ses reclamations et  */
/* la reponse ; les admins voient tout et       */
/* traitent (traitee / refusee + reponse).      */

CREATE TABLE IF NOT EXISTS public.reclamations_combats (
    id SERIAL PRIMARY KEY,
    auteur_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
    combat_id INTEGER,
    message TEXT NOT NULL CHECK (char_length(btrim(message)) BETWEEN 5 AND 1000),
    statut TEXT NOT NULL DEFAULT 'ouverte' CHECK (statut IN ('ouverte', 'traitee', 'refusee')),
    reponse TEXT CHECK (reponse IS NULL OR char_length(reponse) <= 1000),
    cree_le TIMESTAMPTZ NOT NULL DEFAULT now(),
    traite_le TIMESTAMPTZ,
    traite_par UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS reclamations_combats_statut_idx ON public.reclamations_combats (statut, cree_le DESC);

ALTER TABLE public.reclamations_combats ENABLE ROW LEVEL SECURITY;

-- Lecture : ses propres reclamations, ou toutes pour un admin
DROP POLICY IF EXISTS reclamations_select ON public.reclamations_combats;
CREATE POLICY reclamations_select ON public.reclamations_combats
    FOR SELECT TO authenticated
    USING (auteur_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Creation : un membre valide, en son nom, une reclamation ouverte et sans reponse
DROP POLICY IF EXISTS reclamations_insert ON public.reclamations_combats;
CREATE POLICY reclamations_insert ON public.reclamations_combats
    FOR INSERT TO authenticated
    WITH CHECK (auteur_id = auth.uid()
        AND statut = 'ouverte' AND reponse IS NULL AND traite_le IS NULL AND traite_par IS NULL
        AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_validated = true));

-- Traitement et suppression : admins seulement
DROP POLICY IF EXISTS reclamations_admin_update ON public.reclamations_combats;
CREATE POLICY reclamations_admin_update ON public.reclamations_combats
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS reclamations_admin_delete ON public.reclamations_combats;
CREATE POLICY reclamations_admin_delete ON public.reclamations_combats
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Garde-fou contre le spam : 5 reclamations ouvertes au plus par joueur
CREATE OR REPLACE FUNCTION public.reclamations_limite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF (SELECT count(*) FROM public.reclamations_combats WHERE auteur_id = NEW.auteur_id AND statut = 'ouverte') >= 5 THEN
        RAISE EXCEPTION 'Tu as déjà 5 réclamations en attente : attends qu''un admin les traite.';
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS reclamations_limite ON public.reclamations_combats;
CREATE TRIGGER reclamations_limite BEFORE INSERT ON public.reclamations_combats
    FOR EACH ROW EXECUTE FUNCTION public.reclamations_limite();
