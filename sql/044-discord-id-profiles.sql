-- 044 - discord_id sur profiles (pour que le bot Discord retrouve le joueur via l'API REST)
-- Le bot (fonction Vercel Edge) lit la base par PostgREST, qui n'expose que le schema public :
-- il ne peut pas interroger auth.identities. On copie donc l'ID Discord sur profiles.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS discord_id text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_discord_id_key ON public.profiles (discord_id) WHERE discord_id IS NOT NULL;

-- handle_new_user : capture l'ID Discord a l'inscription OAuth (+ avatar deja gere en 043)
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

    INSERT INTO public.profiles (id, username, classe, element, dofusbook_url, avatar_url, discord_id)
    VALUES (
        NEW.id,
        v_username,
        NEW.raw_user_meta_data->>'classe',
        NEW.raw_user_meta_data->>'element',
        NEW.raw_user_meta_data->>'dofusbook_url',
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
        COALESCE(NEW.raw_user_meta_data->>'provider_id', NEW.raw_user_meta_data->>'sub')
    );
    RETURN NEW;
END;
$function$;

-- Backfill des comptes deja crees via Discord
UPDATE public.profiles p
   SET discord_id = i.pid
  FROM (SELECT user_id, identity_data->>'provider_id' AS pid FROM auth.identities WHERE provider = 'discord') i
 WHERE i.user_id = p.id AND p.discord_id IS NULL AND i.pid IS NOT NULL;

-- Protection : un membre ne peut pas modifier son discord_id depuis le client (anti-usurpation
-- d'attribution). Seul handle_new_user (a l'inscription) et un admin peuvent l'ecrire.
CREATE OR REPLACE FUNCTION public.protect_discord_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
        IF NEW.discord_id IS DISTINCT FROM OLD.discord_id
           AND current_setting('request.jwt.claim.role', true) = 'authenticated' THEN
            NEW.discord_id := OLD.discord_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_protect_discord_id ON public.profiles;
CREATE TRIGGER trigger_protect_discord_id BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_discord_id();
