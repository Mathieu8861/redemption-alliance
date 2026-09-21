/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* Referentiel des classes pour le matchmaking T5 (etape 1).

   Une ligne par classe : son role (tank, dps, support), son rang dans la
   meta (obligatoire > S > A > B > C) et sa position dans la liste, qui sert
   a departager deux classes de meme rang. Tout est modifiable depuis
   l'admin, onglet « Classes T5 ». Le matchmaking (etapes suivantes) lira
   cette table, rien n'est code en dur.

   Les valeurs de « classe » sont celles du site (profiles.classe et
   mules_infos) : « Forge » designe le Forgelance. */

CREATE TABLE IF NOT EXISTS public.classes_ref (
    classe      TEXT PRIMARY KEY,
    role        TEXT NOT NULL DEFAULT 'dps' CHECK (role IN ('tank', 'dps', 'support')),
    rang        TEXT NOT NULL DEFAULT 'B'   CHECK (rang IN ('obligatoire', 'S', 'A', 'B', 'C')),
    ordre       INTEGER NOT NULL DEFAULT 0,
    notes       TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* Seed : le tableau valide par Mathieu le 21/09/2026, dans cet ordre */
INSERT INTO public.classes_ref (classe, role, rang, ordre) VALUES
    ('Iop',        'dps',     'obligatoire', 1),
    ('Eniripsa',   'support', 'obligatoire', 2),
    ('Pandawa',    'support', 'S',           3),
    ('Feca',       'tank',    'S',           4),
    ('Xelor',      'support', 'A',           5),
    ('Enutrof',    'support', 'A',           6),
    ('Sacrieur',   'tank',    'A',           7),
    ('Cra',        'dps',     'A',           8),
    ('Sram',       'dps',     'A',           9),
    ('Eliotrope',  'support', 'A',           10),
    ('Osamodas',   'support', 'B',           11),
    ('Huppermage', 'dps',     'B',           12),
    ('Ouginak',    'dps',     'B',           13),
    ('Roublard',   'dps',     'B',           14),
    ('Sadida',     'support', 'B',           15),
    ('Steamer',    'dps',     'B',           16),
    ('Zobal',      'tank',    'B',           17),
    ('Ecaflip',    'dps',     'B',           18),
    ('Forge',      'dps',     'B',           19)
ON CONFLICT (classe) DO NOTHING;

/* === RLS === */
ALTER TABLE public.classes_ref ENABLE ROW LEVEL SECURITY;

/* Lecture : tout membre valide (la page matchmaking en aura besoin) */
DROP POLICY IF EXISTS "classes_ref_select" ON public.classes_ref;
CREATE POLICY "classes_ref_select" ON public.classes_ref
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_validated = true)
    );

/* Ecriture : admins seulement */
DROP POLICY IF EXISTS "classes_ref_admin_insert" ON public.classes_ref;
CREATE POLICY "classes_ref_admin_insert" ON public.classes_ref
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
DROP POLICY IF EXISTS "classes_ref_admin_update" ON public.classes_ref;
CREATE POLICY "classes_ref_admin_update" ON public.classes_ref
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
DROP POLICY IF EXISTS "classes_ref_admin_delete" ON public.classes_ref;
CREATE POLICY "classes_ref_admin_delete" ON public.classes_ref
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

/* updated_at automatique */
CREATE OR REPLACE FUNCTION public.classes_ref_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_classes_ref_touch ON public.classes_ref;
CREATE TRIGGER trigger_classes_ref_touch BEFORE UPDATE ON public.classes_ref
    FOR EACH ROW EXECUTE FUNCTION public.classes_ref_touch();

/* === RPC : enregistrer le nouvel ordre en une fois === */
/* p_classes = la liste complete des classes dans l'ordre voulu (glisser-
   deposer dans l'admin). Atomique : soit tout l'ordre est pris, soit rien. */
CREATE OR REPLACE FUNCTION public.classes_ref_reordonner(p_classes TEXT[])
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_n INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
        RETURN json_build_object('ok', false, 'erreur', 'not_admin');
    END IF;
    IF p_classes IS NULL OR cardinality(p_classes) = 0 THEN
        RETURN json_build_object('ok', false, 'erreur', 'liste_vide');
    END IF;

    UPDATE public.classes_ref c
       SET ordre = o.pos
      FROM unnest(p_classes) WITH ORDINALITY AS o(classe, pos)
     WHERE c.classe = o.classe;
    GET DIAGNOSTICS v_n = ROW_COUNT;

    RETURN json_build_object('ok', true, 'nb', v_n);
END;
$$;

NOTIFY pgrst, 'reload schema';
