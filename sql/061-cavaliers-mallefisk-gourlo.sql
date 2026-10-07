/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* 061 : « Quatre cavalier » scinde en quatre, Mallefisk et Gourlo ajoutes
   (07/10/2026, reponses de Mathieu apres la verification du catalogue).

   - « Quatre cavalier • Eliocalypse » (principale, ordre 23) regroupait
     quatre donjons distincts, chacun dans sa dimension. L'entree est
     desactivee (personne ne l'avait choisie, aucune reservation ne la
     porte) et remplacee par une entree par cavalier, placees « vers le
     milieu haut » de la liste, juste apres Horologium XLII :
       CAVALIER CORRUPTION  Royaume Corrompu     (Arbre de Mort)
       CAVALIER SERVITUDE   Galere de Servitude  (Fers de la Tyrannie)
       CAVALIER MISERE      Desert de Misere     (Sentence de la Balance)
       CAVALIER GUERRE      Blessures de Guerre  (Trone de Sang)
     Les principales actives sont renumerotees de 1 a 106 sans trou :
     l'ordre relatif des autres zones ne change pas.

   - Deux donjons de plus bas niveau ajoutes en secondaires, tout en bas :
       MALLEFISK  Fabrique de Mallefisk (Enutrosor), niveau 100
       GOURLO     Cale de l'Arche d'Otomai, Gourlo le Terrible, niveau 70
     Le Temple maudit d'Araknas n'est pas ajoute (pas retenu).

   A usage unique : si les cavaliers existent deja, elle ne fait rien. */

DO $mig$
DECLARE
    v_ancre INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM public.zones_reservation WHERE nom = 'CAVALIER GUERRE') THEN
        RAISE NOTICE '061 deja appliquee, rien a faire';
        RETURN;
    END IF;

    SELECT ordre INTO v_ancre
      FROM public.zones_reservation
     WHERE nom = 'Horologium XLII' AND sous_titre = 'Xelorium' AND categorie = 'principale' AND actif;
    IF v_ancre IS NULL THEN
        RAISE EXCEPTION '061 : zone repere Horologium XLII introuvable';
    END IF;

    UPDATE public.zones_reservation SET actif = FALSE
     WHERE nom = 'Quatre cavalier' AND sous_titre = 'Eliocalypse';

    /* Place pour les quatre cavaliers juste apres le repere */
    UPDATE public.zones_reservation SET ordre = ordre + 4
     WHERE categorie = 'principale' AND actif AND ordre > v_ancre;

    INSERT INTO public.zones_reservation (nom, sous_titre, categorie, ordre) VALUES
        ('CAVALIER CORRUPTION', 'Royaume Corrompu (Eliocalypse)', 'principale', v_ancre + 1),
        ('CAVALIER SERVITUDE', 'Galère de Servitude (Eliocalypse)', 'principale', v_ancre + 2),
        ('CAVALIER MISÈRE', 'Désert de Misère (Eliocalypse)', 'principale', v_ancre + 3),
        ('CAVALIER GUERRE', 'Blessures de Guerre (Eliocalypse)', 'principale', v_ancre + 4);

    /* Principales actives renumerotees 1..N, sans trou */
    UPDATE public.zones_reservation z
       SET ordre = r.n
      FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY ordre, id)::INTEGER AS n
              FROM public.zones_reservation
             WHERE categorie = 'principale' AND actif) r
     WHERE z.id = r.id AND z.ordre <> r.n;

    /* Secondaires : a la suite des existantes, tout en bas de la liste */
    INSERT INTO public.zones_reservation (nom, sous_titre, categorie, ordre)
    SELECT v.nom, v.sous_titre, 'secondaire', m.max_ordre + v.rang
      FROM (VALUES
               ('MALLÉFISK', 'Fabrique de Malléfisk (Enutrosor)', 1),
               ('GOURLO', 'Arche d''Otomaï', 2)
           ) AS v(nom, sous_titre, rang)
     CROSS JOIN (SELECT COALESCE(MAX(ordre), 0) AS max_ordre
                   FROM public.zones_reservation
                  WHERE categorie = 'secondaire' AND actif) m
    ON CONFLICT (nom, sous_titre) DO NOTHING;
END
$mig$;
