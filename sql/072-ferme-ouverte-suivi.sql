-- =====================================================================
-- 072 : la Ferme d'Incarnam ouverte à tous ceux qui ont le lien, et le suivi des joueurs dans l'admin (19/10/2026)
-- ---------------------------------------------------------------------
-- Demande de Mathieu : « tu peux open à tout le monde qui a le lien, en soi on s'en fiche ; par contre faudrait me
-- construire un endroit où je peux voir qui a accès, la progression et le temps de jeu de chacun ».
--
-- 1. Un mode d'accès 'tous' (ferme_config 'acces', en plus de 'testeurs' et 'membres') : tout compte connecté au site
--    avec Discord a sa ferme (validé ou non), et un joueur sans Discord crée son compte de jeu à sa première connexion
--    (un pseudo libre, qui n'est pas celui d'un membre du site, et un mot de passe de 6 caractères au moins ; au plus
--    30 nouveaux comptes de jeu par heure, contre les abus). Le mode passe à 'tous' à la fin de ce script.
-- 2. Le temps de jeu (ferme_joueurs.temps_jeu, en secondes) et le nombre de sessions, comptés par le serveur à chaque
--    sauvegarde : le jeu sauve toutes les 15 s quand on joue ; l'écart avec la sauvegarde précédente s'ajoute s'il fait
--    moins de 3 minutes, sinon c'est une nouvelle session. Comptés à partir du passage de ce script (rien avant).
-- 3. L'admin du site : ferme_admin_joueurs() (la liste, la progression, le temps de jeu) et ferme_admin_acces(mode),
--    réservées aux admins (profiles.is_admin). Lecture des fermes : rien d'autre que ces deux fonctions.
-- =====================================================================

ALTER TABLE public.ferme_joueurs ADD COLUMN IF NOT EXISTS temps_jeu INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.ferme_joueurs ADD COLUMN IF NOT EXISTS sessions INTEGER NOT NULL DEFAULT 0;

-- qui joue ? un jeton d'invité, sinon le compte du site connecté (NULL : personne d'autorisé)
CREATE OR REPLACE FUNCTION public.ferme_qui(p_jeton TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v UUID; u UUID := auth.uid(); m TEXT;
BEGIN
    IF p_jeton IS NOT NULL AND p_jeton <> '' THEN
        UPDATE ferme_jetons SET vu_le = NOW() WHERE jeton_hash = encode(digest(p_jeton, 'sha256'), 'hex') RETURNING joueur_id INTO v;
        RETURN v;
    END IF;
    IF u IS NULL THEN RETURN NULL; END IF;
    SELECT id INTO v FROM ferme_joueurs WHERE user_id = u;
    IF v IS NOT NULL THEN RETURN v; END IF;
    -- l'alliance ouverte : tout profil validé a sa ferme ; ouverte à tous : tout compte connecté
    m := (SELECT valeur FROM ferme_config WHERE cle = 'acces');
    IF (m = 'membres' AND EXISTS (SELECT 1 FROM profiles WHERE id = u AND is_validated))
       OR (m = 'tous' AND EXISTS (SELECT 1 FROM profiles WHERE id = u)) THEN
        INSERT INTO ferme_joueurs (user_id, pseudo) SELECT u, COALESCE(NULLIF(username, ''), 'Fermier') FROM profiles WHERE id = u RETURNING id INTO v;
    END IF;
    RETURN v;
END $$;

-- connexion d'un joueur sans Discord : la première fois, le mot de passe donné devient le sien ;
-- ouverte à tous : un pseudo inconnu crée le compte de jeu
CREATE OR REPLACE FUNCTION public.ferme_connexion(p_pseudo TEXT, p_mdp TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE r RECORD; j TEXT; premiere BOOLEAN := false; nouveau BOOLEAN := false; ps TEXT := trim(COALESCE(p_pseudo, ''));
BEGIN
    SELECT id, mdp_hash, pseudo INTO r FROM ferme_joueurs WHERE invite AND lower(pseudo) = lower(ps);
    IF NOT FOUND THEN
        IF (SELECT valeur FROM ferme_config WHERE cle = 'acces') IS DISTINCT FROM 'tous' THEN
            PERFORM pg_sleep(1); RETURN json_build_object('ok', false, 'erreur', 'identifiants');
        END IF;
        IF ps !~ '^[[:alnum:] _-]{3,20}$' THEN RETURN json_build_object('ok', false, 'erreur', 'pseudo'); END IF;
        IF EXISTS (SELECT 1 FROM profiles WHERE lower(username) = lower(ps)) THEN RETURN json_build_object('ok', false, 'erreur', 'pseudo_membre'); END IF;
        IF p_mdp IS NULL OR length(p_mdp) < 6 THEN RETURN json_build_object('ok', false, 'erreur', 'mdp_court'); END IF;
        IF (SELECT count(*) FROM ferme_joueurs WHERE invite AND cree_le > NOW() - INTERVAL '1 hour') >= 30 THEN
            RETURN json_build_object('ok', false, 'erreur', 'trop');
        END IF;
        INSERT INTO ferme_joueurs (invite, pseudo, mdp_hash) VALUES (true, ps, crypt(p_mdp, gen_salt('bf'))) RETURNING id, mdp_hash, pseudo INTO r;
        premiere := true; nouveau := true;
    ELSIF r.mdp_hash IS NULL THEN
        IF p_mdp IS NULL OR length(p_mdp) < 6 THEN RETURN json_build_object('ok', false, 'erreur', 'mdp_court'); END IF;
        UPDATE ferme_joueurs SET mdp_hash = crypt(p_mdp, gen_salt('bf')) WHERE id = r.id; premiere := true;
    ELSIF crypt(p_mdp, r.mdp_hash) <> r.mdp_hash THEN
        PERFORM pg_sleep(1); RETURN json_build_object('ok', false, 'erreur', 'identifiants');
    END IF;
    j := encode(gen_random_bytes(24), 'hex');
    INSERT INTO ferme_jetons (jeton_hash, joueur_id) VALUES (encode(digest(j, 'sha256'), 'hex'), r.id);
    RETURN json_build_object('ok', true, 'jeton', j, 'pseudo', r.pseudo, 'premiere', premiere, 'nouveau', nouveau);
END $$;

-- sauver : comme avant, plus le temps de jeu et les sessions (calculés ici, pas par le jeu)
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
        etat = p_etat, version = version + 1,
        temps_jeu = temps_jeu + CASE WHEN derniere_partie > NOW() - INTERVAL '3 minutes' THEN GREATEST(0, EXTRACT(EPOCH FROM NOW() - derniere_partie))::INTEGER ELSE 0 END,
        sessions = sessions + CASE WHEN derniere_partie IS NULL OR derniere_partie <= NOW() - INTERVAL '3 minutes' THEN 1 ELSE 0 END,
        derniere_partie = NOW(),
        niveau = CASE WHEN p_resume->>'niveau' ~ '^\d{1,6}$' THEN (p_resume->>'niveau')::INTEGER END,
        vague  = CASE WHEN p_resume->>'vague'  ~ '^\d{1,6}$' THEN (p_resume->>'vague')::INTEGER END,
        kamas  = CASE WHEN p_resume->>'kamas'  ~ '^-?\d{1,15}$' THEN (p_resume->>'kamas')::BIGINT END,
        classe = left(p_resume->>'classe', 20), nom_fermier = left(p_resume->>'nom', 40)
     WHERE id = v AND (p_version IS NULL OR version = p_version)
    RETURNING version INTO n;
    IF FOUND THEN RETURN json_build_object('ok', true, 'version', n); END IF;
    RETURN json_build_object('ok', false, 'erreur', 'conflit', 'version', (SELECT version FROM ferme_joueurs WHERE id = v));
END $$;

-- l'admin : tous les joueurs, leur progression et leur temps de jeu
CREATE OR REPLACE FUNCTION public.ferme_admin_joueurs()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE r JSON;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin) THEN RETURN json_build_object('ok', false, 'erreur', 'admin'); END IF;
    SELECT COALESCE(json_agg(x ORDER BY x.derniere_partie DESC NULLS LAST, x.nom), '[]'::JSON) INTO r FROM (
        SELECT COALESCE(p.username, j.pseudo) AS nom, j.invite, j.nom_fermier, j.classe, j.niveau, j.vague, j.kamas,
               j.temps_jeu, j.sessions, j.cree_le, j.derniere_partie,
               (SELECT count(*) FROM jsonb_object_keys(CASE WHEN jsonb_typeof(j.etat -> 'bossFois') = 'object' THEN j.etat -> 'bossFois' ELSE '{}'::JSONB END)) AS boss,
               (CASE WHEN jsonb_typeof(j.etat -> 'parties') = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(j.etat -> 'parties')) ELSE 0 END) + (CASE WHEN j.etat IS NULL THEN 0 ELSE 1 END) AS parties
          FROM ferme_joueurs j LEFT JOIN profiles p ON p.id = j.user_id
    ) x;
    RETURN json_build_object('ok', true, 'acces', (SELECT valeur FROM ferme_config WHERE cle = 'acces'), 'joueurs', r);
END $$;

-- l'admin : changer qui peut jouer
CREATE OR REPLACE FUNCTION public.ferme_admin_acces(p_mode TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin) THEN RETURN json_build_object('ok', false, 'erreur', 'admin'); END IF;
    IF p_mode IS NULL OR p_mode NOT IN ('testeurs', 'membres', 'tous') THEN RETURN json_build_object('ok', false, 'erreur', 'mode'); END IF;
    UPDATE ferme_config SET valeur = p_mode WHERE cle = 'acces';
    RETURN json_build_object('ok', true, 'acces', p_mode);
END $$;

REVOKE ALL ON FUNCTION public.ferme_admin_joueurs() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ferme_admin_acces(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ferme_admin_joueurs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ferme_admin_acces(TEXT) TO authenticated;

-- la ferme ouverte à tous ceux qui ont le lien
UPDATE public.ferme_config SET valeur = 'tous' WHERE cle = 'acces';
