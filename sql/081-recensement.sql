/* ============================================ */
/* 081 : le recensement des membres             */
/* ============================================ */
/* Demande de Ror (30/10/2026) : lister tout le */
/* monde dans l'admin, en croisant l'alliance   */
/* en jeu, le Discord et le site, pour voir qui */
/* n'est que d'un côté (« 1/3, c'est suspect »).*/
/* Le croisement se fait dans la page           */
/* (js/recensement-moteur.js) ; la base garde : */
/*  - la liste des persos de l'alliance en jeu, */
/*    relevée sur les captures de Ror ;         */
/*  - les rattachements faits à la main (ou     */
/*    déduits, à confirmer), et les liens       */
/*    automatiques refusés ;                    */
/*  - le statut et la note de chaque personne.  */
/* Clés : « jeu:<nom normalisé> »,              */
/* « discord:<id> », « site:<uuid du profil> ». */
/* Tout est réservé aux admins.                 */

CREATE TABLE IF NOT EXISTS public.recensement_jeu (
    nom TEXT PRIMARY KEY,
    rang TEXT,
    niveau INTEGER,
    en_ligne BOOLEAN NOT NULL DEFAULT false,
    releve_le DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public.recensement_liens (
    id SERIAL PRIMARY KEY,
    a TEXT NOT NULL,
    b TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('lien', 'probable', 'separe')),
    note TEXT,
    cree_par UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (a, b)
);

CREATE TABLE IF NOT EXISTS public.recensement_notes (
    cle TEXT PRIMARY KEY,
    statut TEXT CHECK (statut IN ('ok', 'a_verifier', 'suspect', 'allie', 'mule', 'parti', 'inconnu')),
    note TEXT,
    maj_par UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    maj_le TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recensement_jeu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recensement_liens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recensement_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recensement_jeu_admin ON public.recensement_jeu;
CREATE POLICY recensement_jeu_admin ON public.recensement_jeu
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS recensement_liens_admin ON public.recensement_liens;
CREATE POLICY recensement_liens_admin ON public.recensement_liens
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS recensement_notes_admin ON public.recensement_notes;
CREATE POLICY recensement_notes_admin ON public.recensement_notes
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
