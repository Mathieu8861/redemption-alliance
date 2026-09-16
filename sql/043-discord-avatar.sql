-- 043 - Avatar Discord par defaut
-- A la connexion via Discord, on reprend automatiquement la photo de profil Discord
-- (raw_user_meta_data->>'avatar_url', sinon 'picture'). Le membre peut toujours en
-- changer depuis sa page Profil (cadre avatar cliquable, upload vers le bucket avatars).

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

    INSERT INTO public.profiles (id, username, classe, element, dofusbook_url, avatar_url)
    VALUES (
        NEW.id,
        v_username,
        NEW.raw_user_meta_data->>'classe',
        NEW.raw_user_meta_data->>'element',
        NEW.raw_user_meta_data->>'dofusbook_url',
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
    );
    RETURN NEW;
END;
$function$;

-- Backfill : les comptes deja crees via Discord et sans avatar reprennent leur photo Discord.
UPDATE public.profiles p
   SET avatar_url = COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
  FROM auth.users u
 WHERE u.id = p.id
   AND (p.avatar_url IS NULL OR p.avatar_url = '')
   AND COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture') IS NOT NULL;
