-- =====================================================================
-- 065 : la Ferme d'Amakna, comptes et sauvegarde en ligne (11/10/2026)
-- ---------------------------------------------------------------------
-- Décisions de Mathieu (11/10/2026) :
--   - « surtout faut que ça sauvegarde leur progression » ;
--   - bêta fermée à 4 ou 5 testeurs (« ma copine, ou des membres de
--     l'alliance »), « pour toute l'alli j'ouvrirai quand on aura passé les
--     phases de bêta test avec les 5 joueurs » ;
--   - les membres se connectent avec leur compte du site (Discord, comme
--     Steam : pas de mot de passe) ; ceux qui n'ont pas Discord ont un compte
--     propre au jeu, pseudo + mot de passe, créé à la main ;
--   - rien n'est affiché sur le site pour l'instant, mais la progression est
--     enregistrée en clair (niveau, vague...) pour plus tard.
--
-- Une ligne de ferme_joueurs = un joueur autorisé et sa ferme :
--   - membre : user_id = son compte du site (auth.users / profiles) ;
--   - invité : invite = true, pseudo + mot de passe (mdp_hash). Tant que
--     mdp_hash est vide, la PREMIÈRE connexion choisit le mot de passe :
--     aucun mot de passe ne passe par un tiers.
-- Accès (ferme_config 'acces') : 'testeurs' = seules les lignes créées à la
-- main ; 'membres' = tout profil validé du site (sa ligne se crée seule).
--
-- Sécurité : RLS activée et AUCUNE policy sur les trois tables, donc rien
-- n'est lisible ni modifiable directement avec la clé publique. Tout passe
-- par les fonctions ci-dessous (SECURITY DEFINER). Un invité est reconnu par
-- un jeton de session aléatoire (seule son empreinte SHA-256 est gardée).
-- Deux appareils en même temps : chaque sauvegarde porte une version ; une
-- écriture faite depuis une version dépassée est refusée (« conflit »).
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.ferme_joueurs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    invite           BOOLEAN NOT NULL DEFAULT false,
    pseudo           TEXT NOT NULL,
    mdp_hash         TEXT,
    etat             JSONB,
    version          INTEGER NOT NULL DEFAULT 0,
    -- la progression, en clair (rien ne l'affiche encore)
    niveau           INTEGER,
    vague            INTEGER,
    kamas            BIGINT,
    classe           TEXT,
    nom_fermier      TEXT,
    cree_le          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    derniere_partie  TIMESTAMPTZ,
    CONSTRAINT ferme_joueurs_qui CHECK ((user_id IS NOT NULL AND NOT invite) OR (user_id IS NULL AND invite))
);
CREATE UNIQUE INDEX IF NOT EXISTS ferme_joueurs_pseudo_invite ON public.ferme_joueurs (lower(pseudo)) WHERE invite;
ALTER TABLE public.ferme_joueurs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ferme_jetons (
    jeton_hash  TEXT PRIMARY KEY,
    joueur_id   UUID NOT NULL REFERENCES public.ferme_joueurs(id) ON DELETE CASCADE,
    cree_le     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    vu_le       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.ferme_jetons ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ferme_config (
    cle     TEXT PRIMARY KEY,
    valeur  TEXT NOT NULL
);
ALTER TABLE public.ferme_config ENABLE ROW LEVEL SECURITY;
INSERT INTO public.ferme_config (cle, valeur) VALUES ('acces', 'testeurs') ON CONFLICT (cle) DO NOTHING;

-- qui joue ? un jeton d'invité, sinon le compte du site connecté (NULL : personne d'autorisé)
CREATE OR REPLACE FUNCTION public.ferme_qui(p_jeton TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v UUID; u UUID := auth.uid();
BEGIN
    IF p_jeton IS NOT NULL AND p_jeton <> '' THEN
        UPDATE ferme_jetons SET vu_le = NOW() WHERE jeton_hash = encode(digest(p_jeton, 'sha256'), 'hex') RETURNING joueur_id INTO v;
        RETURN v;
    END IF;
    IF u IS NULL THEN RETURN NULL; END IF;
    SELECT id INTO v FROM ferme_joueurs WHERE user_id = u;
    IF v IS NOT NULL THEN RETURN v; END IF;
    -- l'alliance ouverte : tout profil validé a sa ferme
    IF (SELECT valeur FROM ferme_config WHERE cle = 'acces') = 'membres'
       AND EXISTS (SELECT 1 FROM profiles WHERE id = u AND is_validated) THEN
        INSERT INTO ferme_joueurs (user_id, pseudo) SELECT u, username FROM profiles WHERE id = u RETURNING id INTO v;
    END IF;
    RETURN v;
END $$;

-- au chargement du jeu : le joueur et sa ferme
CREATE OR REPLACE FUNCTION public.ferme_moi(p_jeton TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v UUID; r RECORD;
BEGIN
    v := ferme_qui(p_jeton);
    IF v IS NULL THEN
        IF p_jeton IS NOT NULL AND p_jeton <> '' THEN RETURN json_build_object('ok', false, 'erreur', 'jeton'); END IF;
        IF auth.uid() IS NULL THEN RETURN json_build_object('ok', false, 'erreur', 'deconnecte'); END IF;
        RETURN json_build_object('ok', false, 'erreur', 'pas_testeur', 'pseudo', (SELECT username FROM profiles WHERE id = auth.uid()));
    END IF;
    SELECT j.id, j.invite, j.etat, j.version, COALESCE(p.username, j.pseudo) AS pseudo INTO r
      FROM ferme_joueurs j LEFT JOIN profiles p ON p.id = j.user_id WHERE j.id = v;
    RETURN json_build_object('ok', true, 'id', r.id, 'invite', r.invite, 'pseudo', r.pseudo, 'etat', r.etat, 'version', r.version);
END $$;

-- connexion d'un invité (pas de Discord) : la première fois, le mot de passe donné devient le sien
CREATE OR REPLACE FUNCTION public.ferme_connexion(p_pseudo TEXT, p_mdp TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE r RECORD; j TEXT; premiere BOOLEAN := false;
BEGIN
    SELECT id, mdp_hash, pseudo INTO r FROM ferme_joueurs WHERE invite AND lower(pseudo) = lower(trim(p_pseudo));
    IF NOT FOUND THEN PERFORM pg_sleep(1); RETURN json_build_object('ok', false, 'erreur', 'identifiants'); END IF;
    IF r.mdp_hash IS NULL THEN
        IF p_mdp IS NULL OR length(p_mdp) < 6 THEN RETURN json_build_object('ok', false, 'erreur', 'mdp_court'); END IF;
        UPDATE ferme_joueurs SET mdp_hash = crypt(p_mdp, gen_salt('bf')) WHERE id = r.id; premiere := true;
    ELSIF crypt(p_mdp, r.mdp_hash) <> r.mdp_hash THEN
        PERFORM pg_sleep(1); RETURN json_build_object('ok', false, 'erreur', 'identifiants');
    END IF;
    j := encode(gen_random_bytes(24), 'hex');
    INSERT INTO ferme_jetons (jeton_hash, joueur_id) VALUES (encode(digest(j, 'sha256'), 'hex'), r.id);
    RETURN json_build_object('ok', true, 'jeton', j, 'pseudo', r.pseudo, 'premiere', premiere);
END $$;

CREATE OR REPLACE FUNCTION public.ferme_deconnexion(p_jeton TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
    DELETE FROM ferme_jetons WHERE jeton_hash = encode(digest(p_jeton, 'sha256'), 'hex');
    RETURN json_build_object('ok', true);
END $$;

-- sauver : p_version = la version sur laquelle le jeu a travaillé (NULL : écraser, après un choix du joueur) ;
-- p_resume = la progression en clair { niveau, vague, kamas, classe, nom }
CREATE OR REPLACE FUNCTION public.ferme_sauver(p_jeton TEXT, p_etat JSONB, p_version INTEGER, p_resume JSONB DEFAULT '{}'::JSONB)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v UUID; n INTEGER;
BEGIN
    IF p_etat IS NULL OR jsonb_typeof(p_etat) <> 'object' OR pg_column_size(p_etat) > 1000000 THEN
        RETURN json_build_object('ok', false, 'erreur', 'etat');
    END IF;
    v := ferme_qui(p_jeton);
    IF v IS NULL THEN RETURN json_build_object('ok', false, 'erreur', 'deconnecte'); END IF;
    UPDATE ferme_joueurs SET
        etat = p_etat, version = version + 1, derniere_partie = NOW(),
        niveau = CASE WHEN p_resume->>'niveau' ~ '^\d{1,6}$' THEN (p_resume->>'niveau')::INTEGER END,
        vague  = CASE WHEN p_resume->>'vague'  ~ '^\d{1,6}$' THEN (p_resume->>'vague')::INTEGER END,
        kamas  = CASE WHEN p_resume->>'kamas'  ~ '^-?\d{1,15}$' THEN (p_resume->>'kamas')::BIGINT END,
        classe = left(p_resume->>'classe', 20), nom_fermier = left(p_resume->>'nom', 40)
     WHERE id = v AND (p_version IS NULL OR version = p_version)
    RETURNING version INTO n;
    IF FOUND THEN RETURN json_build_object('ok', true, 'version', n); END IF;
    RETURN json_build_object('ok', false, 'erreur', 'conflit', 'version', (SELECT version FROM ferme_joueurs WHERE id = v));
END $$;

REVOKE ALL ON FUNCTION public.ferme_qui(TEXT) FROM PUBLIC, anon, authenticated; -- outil interne des fonctions ci-dessous
REVOKE ALL ON FUNCTION public.ferme_moi(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ferme_connexion(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ferme_deconnexion(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ferme_sauver(TEXT, JSONB, INTEGER, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ferme_moi(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ferme_connexion(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ferme_deconnexion(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ferme_sauver(TEXT, JSONB, INTEGER, JSONB) TO anon, authenticated;

-- Ajouter des testeurs (à la main, à la demande de Mathieu) :
--   membre du site :  INSERT INTO ferme_joueurs (user_id, pseudo) SELECT id, username FROM profiles WHERE username = 'Pseudo';
--   sans Discord :    INSERT INTO ferme_joueurs (invite, pseudo) VALUES (true, 'Pseudo');   -- il choisit son mot de passe à la 1re connexion
--   mot de passe oublié : UPDATE ferme_joueurs SET mdp_hash = NULL WHERE invite AND lower(pseudo) = lower('Pseudo');
-- Ouvrir à toute l'alliance : UPDATE ferme_config SET valeur = 'membres' WHERE cle = 'acces';
