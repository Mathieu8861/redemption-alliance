/* ============================================ */
/* 077 : journal des corrections de combats     */
/* ============================================ */
/* Demande de Ror (25/10/2026), apres le        */
/* controle des screens des combats 851 a 1143 :*/
/* « faut aussi afficher quelque part les       */
/* correctifs ». Chaque correction faite par un */
/* admin (doublon supprime, format, type,       */
/* joueurs) laisse une ligne lisible par tous   */
/* les membres, affichee dans l'Historique.     */
/* combat_id sans cle etrangere : un doublon    */
/* supprime garde sa ligne de journal.          */

CREATE TABLE IF NOT EXISTS public.corrections_combats (
    id SERIAL PRIMARY KEY,
    combat_id INTEGER NOT NULL,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT now(),
    type TEXT NOT NULL CHECK (type IN ('doublon', 'format', 'type', 'participants')),
    resume TEXT NOT NULL,
    details JSONB
);

CREATE INDEX IF NOT EXISTS corrections_combats_combat_idx ON public.corrections_combats (combat_id);

ALTER TABLE public.corrections_combats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS corrections_combats_select ON public.corrections_combats;
CREATE POLICY corrections_combats_select ON public.corrections_combats
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS corrections_combats_admin ON public.corrections_combats;
CREATE POLICY corrections_combats_admin ON public.corrections_combats
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
