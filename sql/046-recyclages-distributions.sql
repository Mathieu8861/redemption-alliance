/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/*                                              */
/* DEJA APPLIQUE LE 16/09/2026. Ce fichier est  */
/* la trace de la migration, pas une action a   */
/* refaire. Il reste rejouable : tout est en    */
/* IF NOT EXISTS / OR REPLACE.                  */
/* ============================================ */

/* ============================================ */
/* Recyclages : distribution des pepites        */
/* ============================================ */

/* La periode n'est plus la semaine ISO mais l'intervalle depuis la
   derniere distribution. Quand les admins ont redistribue les pepites
   d'alliance, ils cliquent sur "Distribuer" : les recyclages concernes
   sont estampilles, les compteurs repartent de zero, et la periode
   suivante commence.

   Choix important : on n'EFFACE PAS les lignes. Chaque recyclage garde
   sa trace et pointe vers la distribution qui l'a solde. On peut donc
   toujours savoir qui avait genere quoi, et sur quelle periode. */

/* === TABLE : DISTRIBUTIONS === */
CREATE TABLE IF NOT EXISTS public.recyclages_distributions (
    id                SERIAL PRIMARY KEY,
    distribue_le      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    distribue_par     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    debut_periode     TIMESTAMPTZ,
    nb_recyclages     INTEGER NOT NULL DEFAULT 0,
    nb_recycleurs     INTEGER NOT NULL DEFAULT 0,
    total_alliance    BIGINT  NOT NULL DEFAULT 0,
    total_perso       BIGINT  NOT NULL DEFAULT 0,
    total_plus_value  BIGINT  NOT NULL DEFAULT 0,
    note              TEXT
);

CREATE INDEX IF NOT EXISTS idx_distributions_date
    ON public.recyclages_distributions(distribue_le DESC);

/* === RATTACHEMENT DES RECYCLAGES === */
/* NULL = pas encore distribue = periode en cours */
ALTER TABLE public.recyclages
    ADD COLUMN IF NOT EXISTS distribution_id INTEGER
    REFERENCES public.recyclages_distributions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recyclages_distribution
    ON public.recyclages(distribution_id);

/* Index partiel : la periode en cours est la requete la plus frequente */
CREATE INDEX IF NOT EXISTS idx_recyclages_en_cours
    ON public.recyclages(created_at DESC) WHERE distribution_id IS NULL;

/* === VUES : PERIODE EN COURS === */
/* Remplacent v_recyclages_semaine_* (fenetre lundi -> dimanche).
   Les noms de colonnes changent, donc DROP puis CREATE. */
DROP VIEW IF EXISTS public.v_recyclages_semaine_par_user;
DROP VIEW IF EXISTS public.v_recyclages_semaine_global;

CREATE OR REPLACE VIEW public.v_recyclages_periode_par_user AS
SELECT
    r.user_id,
    p.username,
    p.avatar_url,
    COUNT(r.id)                          AS nb_recyclages,
    COALESCE(SUM(r.pepites_alliance), 0) AS total_alliance,
    COALESCE(SUM(r.pepites_perso), 0)    AS total_perso,
    COALESCE(SUM(r.plus_value), 0)       AS total_plus_value,
    COUNT(r.preuve_url)                  AS nb_avec_preuve,
    MAX(r.created_at)                    AS dernier_recyclage
FROM public.recyclages r
JOIN public.profiles p ON p.id = r.user_id
WHERE r.distribution_id IS NULL
GROUP BY r.user_id, p.username, p.avatar_url;

/* Agregat sans GROUP BY : renvoie toujours exactement une ligne,
   meme quand la periode est vide (compteurs a 0, dates a NULL). */
CREATE OR REPLACE VIEW public.v_recyclages_periode_global AS
SELECT
    COUNT(r.id)                          AS nb_recyclages,
    COUNT(DISTINCT r.user_id)            AS nb_recycleurs,
    COALESCE(SUM(r.pepites_alliance), 0) AS total_alliance,
    COALESCE(SUM(r.pepites_perso), 0)    AS total_perso,
    COALESCE(SUM(r.plus_value), 0)       AS total_plus_value,
    COUNT(r.preuve_url)                  AS nb_avec_preuve,
    MIN(r.created_at)                    AS debut_periode,
    (SELECT MAX(d.distribue_le) FROM public.recyclages_distributions d)
                                         AS derniere_distribution
FROM public.recyclages r
WHERE r.distribution_id IS NULL;

/* === RPC : DISTRIBUER === */
/* Clot la periode en cours. Reserve aux admins.
   Le stampage et le calcul des totaux se font dans la MEME instruction
   (UPDATE ... RETURNING agrege) : impossible qu'un recyclage insere
   pendant l'operation soit solde sans etre compte, ou l'inverse. */
CREATE OR REPLACE FUNCTION public.distribuer_recyclages(p_note TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id        INTEGER;
    v_nb        INTEGER := 0;
    v_recyc     INTEGER := 0;
    v_alliance  BIGINT  := 0;
    v_perso     BIGINT  := 0;
    v_pv        BIGINT  := 0;
    v_debut     TIMESTAMPTZ;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND is_admin = true) THEN
        RETURN json_build_object('ok', false, 'erreur', 'not_admin');
    END IF;

    /* Ligne de distribution creee vide, remplie juste apres */
    INSERT INTO public.recyclages_distributions (distribue_par, note)
    VALUES (auth.uid(), NULLIF(TRIM(COALESCE(p_note, '')), ''))
    RETURNING id INTO v_id;

    WITH soldes AS (
        UPDATE public.recyclages
           SET distribution_id = v_id
         WHERE distribution_id IS NULL
        RETURNING user_id, pepites_alliance, pepites_perso, plus_value, created_at
    )
    SELECT COUNT(*), COUNT(DISTINCT user_id),
           COALESCE(SUM(pepites_alliance), 0), COALESCE(SUM(pepites_perso), 0),
           COALESCE(SUM(plus_value), 0), MIN(created_at)
      INTO v_nb, v_recyc, v_alliance, v_perso, v_pv, v_debut
      FROM soldes;

    /* Rien a distribuer : on annule la ligne creee plus haut */
    IF v_nb = 0 THEN
        DELETE FROM public.recyclages_distributions WHERE id = v_id;
        RETURN json_build_object('ok', false, 'erreur', 'rien_a_distribuer');
    END IF;

    UPDATE public.recyclages_distributions
       SET debut_periode    = v_debut,
           nb_recyclages    = v_nb,
           nb_recycleurs    = v_recyc,
           total_alliance   = v_alliance,
           total_perso      = v_perso,
           total_plus_value = v_pv
     WHERE id = v_id;

    RETURN json_build_object(
        'ok', true, 'id', v_id,
        'nb_recyclages', v_nb, 'nb_recycleurs', v_recyc,
        'total_alliance', v_alliance
    );
END;
$$;

/* === GARDE-FOU : lignes deja distribuees === */
/* La policy recyclages_update_self_or_admin autorise un membre a modifier
   SES propres recyclages. Sans ce trigger il pourrait remettre son
   distribution_id a NULL et se faire payer une seconde fois les memes
   pepites. Une ligne soldee devient donc intouchable pour lui, et il ne
   peut jamais ecrire distribution_id de lui-meme. Les admins et les
   appels par cle service ne sont pas concernes. */
CREATE OR REPLACE FUNCTION public.protect_recyclage_distribue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'authenticated' THEN
        RETURN NEW;
    END IF;
    IF EXISTS (SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND is_admin = true) THEN
        RETURN NEW;
    END IF;
    IF OLD.distribution_id IS NOT NULL THEN
        RETURN OLD;
    END IF;
    NEW.distribution_id := OLD.distribution_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_protect_recyclage_distribue ON public.recyclages;
CREATE TRIGGER trigger_protect_recyclage_distribue
    BEFORE UPDATE ON public.recyclages
    FOR EACH ROW EXECUTE FUNCTION public.protect_recyclage_distribue();

/* === RLS : table des distributions === */
ALTER TABLE public.recyclages_distributions ENABLE ROW LEVEL SECURITY;

/* Lecture pour tout membre valide (l'historique n'a rien de secret) */
DROP POLICY IF EXISTS "distributions_select_validated" ON public.recyclages_distributions;
CREATE POLICY "distributions_select_validated" ON public.recyclages_distributions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_validated = true)
    );

/* Aucune policy d'ecriture : seule distribuer_recyclages() (SECURITY
   DEFINER) peut inserer, et un admin peut corriger la note. */
DROP POLICY IF EXISTS "distributions_update_admin" ON public.recyclages_distributions;
CREATE POLICY "distributions_update_admin" ON public.recyclages_distributions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

/* Recharge le cache PostgREST pour que l'API voie les vues et la fonction */
NOTIFY pgrst, 'reload schema';

/* ============================================ */
/* NETTOYAGE FACULTATIF                         */
/* ============================================ */
/* Les vues v_recyclages_semaine_* (fenetre lundi -> dimanche) ont ete
   supprimees par le bloc ci-dessus, puis recreees temporairement le
   16/09/2026 parce que l'admin les interrogeait encore. Depuis que
   tabRecyclagesHebdo lit les vues _periode_, plus rien ne s'en sert.
   A passer quand tu veux, ce n'est pas urgent :

   DROP VIEW IF EXISTS public.v_recyclages_semaine_par_user;
   DROP VIEW IF EXISTS public.v_recyclages_semaine_global;
   NOTIFY pgrst, 'reload schema';
*/
