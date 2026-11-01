/* ============================================ */
/* 082 : les comptes bloqués à part             */
/* ============================================ */
/* Demande de Ror (01/11/2026) : dans l'onglet  */
/* Validation, les comptes bloqués se mêlaient  */
/* aux nouvelles inscriptions (les deux ont     */
/* is_validated = false), on ne savait plus qui */
/* valider. bloque_le dit qu'un compte a été    */
/* bloqué par un admin, et quand :              */
/*  - NULL et non validé = inscription à        */
/*    valider ;                                 */
/*  - renseigné = compte bloqué (parti de       */
/*    l'alliance, allié...), à part.            */
/* Valider ou débloquer remet bloque_le à NULL. */
/* Seul un admin peut le changer                */
/* (protect_admin_fields).                      */

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bloque_le TIMESTAMPTZ;

/* Avant d'etendre la protection : apres, une mise a jour hors session admin serait annulee.
   Au 01/11/2026, les 11 comptes non valides sont tous des comptes bloques (verifie un par un avec le recensement) :
   Happy, Naapaar, BySock, Menels, Mc-criminel, Pytable, Ansz, user_14b830cd (Ezenhaw), Maelya, Miisery, Cyrektara. */
UPDATE public.profiles SET bloque_le = now()
 WHERE NOT is_validated AND bloque_le IS NULL AND created_at < '2026-11-01';

CREATE OR REPLACE FUNCTION public.protect_admin_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
        NEW.is_admin := OLD.is_admin;
        NEW.is_validated := OLD.is_validated;
        NEW.organisateur_event := OLD.organisateur_event;
        NEW.bloque_le := OLD.bloque_le;
    END IF;
    RETURN NEW;
END;
$function$;
