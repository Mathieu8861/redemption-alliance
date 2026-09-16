-- 042 - Connexion via Discord (OAuth) + onboarding pseudo IG
-- Contexte : on ajoute "Se connecter avec Discord" a cote du login pseudo/mot de passe.
-- Le lien Discord <-> compte est gere nativement par Supabase (table auth.identities),
-- donc pas de colonne custom : le bot resoudra l'ID Discord via auth.identities.
-- Ici on gere juste : (1) forcer un pseudo placeholder quand le compte arrive via un
-- provider OAuth (pour que l'onboarding demande toujours le pseudo Dofus), et
-- (2) une fonction pour que le membre reserve son pseudo IG une fois connecte.

-- 1. handle_new_user : si le compte vient d'un provider OAuth (provider_id/iss presents),
--    on force le pseudo placeholder, meme si le provider fournit un nom, pour que
--    l'onboarding s'affiche. Les inscriptions par mot de passe (avec 'username') sont inchangees.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_is_oauth boolean := (NEW.raw_user_meta_data ? 'provider_id') OR (NEW.raw_user_meta_data ? 'iss');
    v_username text;
BEGIN
    IF v_is_oauth THEN
        v_username := 'user_' || LEFT(NEW.id::text, 8);
    ELSE
        v_username := COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8));
    END IF;

    INSERT INTO public.profiles (id, username, classe, element, dofusbook_url)
    VALUES (
        NEW.id,
        v_username,
        NEW.raw_user_meta_data->>'classe',
        NEW.raw_user_meta_data->>'element',
        NEW.raw_user_meta_data->>'dofusbook_url'
    );
    RETURN NEW;
END;
$function$;

-- 2. claim_pseudo : le membre fraichement arrive (pseudo encore = placeholder) fixe son
--    pseudo IG et, en option, classe / element / dofusbook. Reservable une seule fois.
--    is_validated reste false (validation admin), protege par le trigger existant.
CREATE OR REPLACE FUNCTION public.claim_pseudo(
    p_username text,
    p_classe text DEFAULT NULL,
    p_element text DEFAULT NULL,
    p_dofusbook text DEFAULT NULL
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_uid uuid := auth.uid();
    v_current text;
    v_placeholder text;
    v_clean text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN json_build_object('ok', false, 'error', 'not_authenticated');
    END IF;

    SELECT username INTO v_current FROM public.profiles WHERE id = v_uid;
    IF v_current IS NULL THEN
        RETURN json_build_object('ok', false, 'error', 'no_profile');
    END IF;

    v_placeholder := 'user_' || LEFT(v_uid::text, 8);
    IF v_current <> v_placeholder THEN
        -- pseudo deja fixe : on ne laisse pas renommer via cette fonction
        RETURN json_build_object('ok', false, 'error', 'already_claimed', 'username', v_current);
    END IF;

    v_clean := btrim(COALESCE(p_username, ''));
    IF length(v_clean) < 2 OR length(v_clean) > 30 THEN
        RETURN json_build_object('ok', false, 'error', 'bad_length');
    END IF;
    IF v_clean ~ '[<>"''&;(){}]' THEN
        RETURN json_build_object('ok', false, 'error', 'bad_chars');
    END IF;

    BEGIN
        UPDATE public.profiles
           SET username = v_clean,
               classe = COALESCE(p_classe, classe),
               element = COALESCE(p_element, element),
               dofusbook_url = COALESCE(p_dofusbook, dofusbook_url)
         WHERE id = v_uid;
    EXCEPTION WHEN unique_violation THEN
        RETURN json_build_object('ok', false, 'error', 'taken');
    END;

    RETURN json_build_object('ok', true, 'username', v_clean);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.claim_pseudo(text, text, text, text) TO authenticated;
