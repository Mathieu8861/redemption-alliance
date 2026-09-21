/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* Matchmaking T5, etape 2 : la file « je suis dispo ».

   Une ligne par joueur present dans la file, avec les classes qu'il
   propose de jouer maintenant (parmi sa classe principale et ses mules),
   une note et une heure d'expiration. La page « Trouver une T5 » et le
   bandeau global lisent la vue v_mm_queue et s'abonnent en temps reel
   aux changements de mm_queue. Les regles de composition sont dans
   site_config, modifiables depuis l'admin. */

CREATE TABLE IF NOT EXISTS public.mm_queue (
    user_id     UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    classes     TEXT[] NOT NULL,
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expire_at   TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mm_queue_expire ON public.mm_queue(expire_at);

/* Le temps reel a besoin de la ligne complete sur les suppressions */
ALTER TABLE public.mm_queue REPLICA IDENTITY FULL;

/* === RLS === */
ALTER TABLE public.mm_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mm_queue_select" ON public.mm_queue;
CREATE POLICY "mm_queue_select" ON public.mm_queue
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_validated = true)
    );
/* L'ecriture passe par les fonctions ci-dessous (qui verifient les classes),
   mais on laisse chacun supprimer sa propre ligne et les admins nettoyer. */
DROP POLICY IF EXISTS "mm_queue_delete_self_or_admin" ON public.mm_queue;
CREATE POLICY "mm_queue_delete_self_or_admin" ON public.mm_queue
    FOR DELETE USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

/* === VUE : la file en cours, avec le profil === */
CREATE OR REPLACE VIEW public.v_mm_queue AS
SELECT q.user_id,
       p.username,
       p.avatar_url,
       q.classes,
       q.note,
       q.created_at,
       q.expire_at
  FROM public.mm_queue q
  JOIN public.profiles p ON p.id = q.user_id
 WHERE q.expire_at > NOW()
 ORDER BY q.created_at;

/* === Classes qu'un joueur peut jouer : principale + mules === */
CREATE OR REPLACE FUNCTION public.mm_classes_du_joueur(p_user UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    SELECT ARRAY(
        SELECT DISTINCT c FROM (
            SELECT p.classe AS c FROM public.profiles p WHERE p.id = p_user
            UNION ALL
            SELECT v->>'classe' FROM public.profiles p, jsonb_each(p.mules_infos) AS e(k, v)
             WHERE p.id = p_user AND jsonb_typeof(p.mules_infos) = 'object'
        ) x
        WHERE c IS NOT NULL AND c <> ''
    );
$$;

/* === RPC : rejoindre (ou mettre a jour) la file === */
CREATE OR REPLACE FUNCTION public.mm_rejoindre(
    p_classes TEXT[],
    p_minutes INTEGER DEFAULT 60,
    p_note    TEXT    DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_uid     UUID := auth.uid();
    v_ok      TEXT[];
    v_classes TEXT[];
    v_minutes INTEGER := LEAST(360, GREATEST(15, COALESCE(p_minutes, 60)));
BEGIN
    IF v_uid IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid AND is_validated = true) THEN
        RETURN json_build_object('ok', false, 'erreur', 'not_validated');
    END IF;

    /* On ne garde que les classes que le joueur possede vraiment */
    v_ok := public.mm_classes_du_joueur(v_uid);
    SELECT ARRAY(SELECT DISTINCT c FROM unnest(COALESCE(p_classes, '{}')) AS c WHERE c = ANY (v_ok)) INTO v_classes;
    IF v_classes IS NULL OR cardinality(v_classes) = 0 THEN
        RETURN json_build_object('ok', false, 'erreur', 'aucune_classe', 'classes_possibles', to_json(v_ok));
    END IF;

    /* Menage des inscriptions expirees, au passage */
    DELETE FROM public.mm_queue WHERE expire_at <= NOW();

    INSERT INTO public.mm_queue (user_id, classes, note, expire_at)
    VALUES (v_uid, v_classes, NULLIF(TRIM(COALESCE(p_note, '')), ''), NOW() + make_interval(mins => v_minutes))
    ON CONFLICT (user_id) DO UPDATE
        SET classes   = EXCLUDED.classes,
            note      = EXCLUDED.note,
            expire_at = EXCLUDED.expire_at;

    RETURN json_build_object('ok', true, 'classes', to_json(v_classes),
                             'expire_at', NOW() + make_interval(mins => v_minutes),
                             'en_file', (SELECT COUNT(*) FROM public.mm_queue WHERE expire_at > NOW()));
END;
$$;

/* === RPC : prolonger === */
CREATE OR REPLACE FUNCTION public.mm_prolonger(p_minutes INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_new TIMESTAMPTZ;
BEGIN
    UPDATE public.mm_queue
       SET expire_at = GREATEST(expire_at, NOW()) + make_interval(mins => LEAST(180, GREATEST(5, COALESCE(p_minutes, 30))))
     WHERE user_id = auth.uid()
    RETURNING expire_at INTO v_new;
    IF v_new IS NULL THEN
        RETURN json_build_object('ok', false, 'erreur', 'pas_en_file');
    END IF;
    RETURN json_build_object('ok', true, 'expire_at', v_new);
END;
$$;

/* === RPC : quitter === */
CREATE OR REPLACE FUNCTION public.mm_quitter()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_n INTEGER;
BEGIN
    DELETE FROM public.mm_queue WHERE user_id = auth.uid();
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN json_build_object('ok', true, 'retire', v_n > 0);
END;
$$;

/* === TEMPS REEL === */
/* Aucune table n'etait publiee jusqu'ici : on ajoute seulement celle-ci. */
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'mm_queue') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.mm_queue;
    END IF;
END $$;

/* === MODULE ACTIVABLE + REGLES PAR DEFAUT === */
INSERT INTO public.modules_config (module, actif) VALUES ('matchmaking', true)
ON CONFLICT (module) DO NOTHING;

INSERT INTO public.site_config (cle, valeur) VALUES
    ('mm_doublons',      'false'),   -- une meme classe deux fois dans l'equipe ?
    ('mm_quota_tank',    '1'),       -- minimum par role
    ('mm_quota_support', '1'),
    ('mm_quota_dps',     '2'),
    ('mm_duree_defaut',  '60')       -- minutes de disponibilite par defaut
ON CONFLICT (cle) DO NOTHING;

NOTIFY pgrst, 'reload schema';
