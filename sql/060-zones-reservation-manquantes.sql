/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* 060 : zones de reservation manquantes (07/10/2026).

   Un membre a signale que la zone de Missiz Frizz (Bastion des froides
   legions) manquait dans « Mes preferences ». Le catalogue entier a ete
   compare a la liste des donjons du jeu (DofusDB, recoupee avec les fiches
   de JeuxOnLine) : trois donjons de niveau 200 n'avaient aucune entree.

   - MISSIZ        Forgefroide de Missiz Frizz, entree dans le Bastion des
                   froides legions (Ile de Frigost)
   - VORTEX        Oeil de Vortex, entree dans les Lendemains incertains
                   (Xelorium)
   - PROTOZORREUR  Ventre de la Baleine, entree au Roc des Salbatroces
                   (Ile de Frigost)

   Ajoutees en principales a la suite des 100 existantes (ordre 101 a 103) :
   l'ordre alliance des zones deja classees ne bouge pas, ni la zone donnee
   par defaut a ceux qui n'ont rien choisi.

   Volontairement absentes : le Comte Harebourg (non reservable, annonce de
   MAsdov du 07/10), les donjons d'evenement (Nowel, Halouine, ile de Pwak),
   Incarnam et Astrub. */

INSERT INTO public.zones_reservation (nom, sous_titre, categorie, ordre)
SELECT v.nom, v.sous_titre, 'principale', v.ordre
FROM (VALUES
    ('MISSIZ', 'Bastion des froides légions', 101),
    ('VORTEX', 'Lendemains incertains (Xélorium)', 102),
    ('PROTOZORREUR', 'Roc des Salbatroces', 103)
) AS v(nom, sous_titre, ordre)
ON CONFLICT (nom, sous_titre) DO NOTHING;
