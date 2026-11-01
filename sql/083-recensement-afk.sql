/* ============================================ */
/* 083 : statut « AFK 30 jours + »              */
/* ============================================ */
/* Demande de Ror (01/11/2026) : un membre      */
/* encore dans l'alliance mais plus connecté    */
/* depuis un mois (Trylence, 29 jours) n'est    */
/* pas « parti » : nouveau statut « afk » du    */
/* recensement (js/recensement-moteur.js).      */

ALTER TABLE public.recensement_notes DROP CONSTRAINT IF EXISTS recensement_notes_statut_check;
ALTER TABLE public.recensement_notes ADD CONSTRAINT recensement_notes_statut_check
    CHECK (statut IN ('ok', 'a_verifier', 'suspect', 'allie', 'mule', 'afk', 'parti', 'inconnu'));
