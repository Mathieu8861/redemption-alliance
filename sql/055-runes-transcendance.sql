/* ============================================ */
/* PROJET SUPABASE CIBLE : Redemption           */
/*   ref  yebfbdgxikbnqdkbycam                  */
/* ============================================ */

/* 055 : runes de transcendance au catalogue (demande Mathieu 27/09/2026).

   Les 81 runes de transcendance de Dofus (source DofusDB, type 211), en
   trois paliers comme les runes classiques : Ta (basique), Pata (Pa) et
   Rata (Ra). Exo garanti (100 % de reussite) mais l'item devient
   definitivement inforgeable. Elles ne s'affichent jamais comme cellule
   du Costumager : la ligne d'exo qu'elles creent propose les runes
   basiques de la famille. Elles apparaissent dans l'inventaire et a l'HDV
   (categorie « Rune de transcendance »).

   - tier : trois valeurs de plus dans la contrainte
   - bonus : valeur de l'effet (DofusDB), poids : ratio pui/point de la
     rune basique de la famille x bonus (informatif, pas de concassage)
   - ordre : apres toutes les runes classiques, groupees par famille
   - prix_kamas : 0, a renseigner par l'admin (import HDV ou saisie)
   - icones : site/assets/images/runes/<iconId>.png (telechargees de DofusDB)
   Genere par scratchpad/runes-ta/gen-055.js. */

ALTER TABLE public.runes DROP CONSTRAINT IF EXISTS runes_tier_check;
ALTER TABLE public.runes
    ADD CONSTRAINT runes_tier_check CHECK (tier IN ('basique', 'pa', 'ra', 'ta', 'pata', 'rata'));

INSERT INTO public.runes (nom, categorie, tier, bonus, poids, prix_kamas, ordre, actif, img_url)
VALUES
    ('Rune Ta Fo', 'Force', 'ta', 10, 10, 0, 1030, TRUE, 'assets/images/runes/78182.png'),
    ('Rune Pata Fo', 'Force', 'pata', 15, 15, 0, 1031, TRUE, 'assets/images/runes/78183.png'),
    ('Rune Rata Fo', 'Force', 'rata', 20, 20, 0, 1032, TRUE, 'assets/images/runes/78184.png'),
    ('Rune Ta Ine', 'Intelligence', 'ta', 10, 10, 0, 1060, TRUE, 'assets/images/runes/78179.png'),
    ('Rune Pata Ine', 'Intelligence', 'pata', 15, 15, 0, 1061, TRUE, 'assets/images/runes/78180.png'),
    ('Rune Rata Ine', 'Intelligence', 'rata', 20, 20, 0, 1062, TRUE, 'assets/images/runes/78181.png'),
    ('Rune Ta Cha', 'Chance', 'ta', 10, 10, 0, 1090, TRUE, 'assets/images/runes/78188.png'),
    ('Rune Pata Cha', 'Chance', 'pata', 15, 15, 0, 1091, TRUE, 'assets/images/runes/78189.png'),
    ('Rune Rata Cha', 'Chance', 'rata', 20, 20, 0, 1092, TRUE, 'assets/images/runes/78190.png'),
    ('Rune Ta Age', 'Agilite', 'ta', 10, 10, 0, 1120, TRUE, 'assets/images/runes/78185.png'),
    ('Rune Pata Age', 'Agilite', 'pata', 15, 15, 0, 1121, TRUE, 'assets/images/runes/78186.png'),
    ('Rune Rata Age', 'Agilite', 'rata', 20, 20, 0, 1122, TRUE, 'assets/images/runes/78187.png'),
    ('Rune Ta Vi', 'Vitalite', 'ta', 50, 10, 0, 1150, TRUE, 'assets/images/runes/78251.png'),
    ('Rune Pata Vi', 'Vitalite', 'pata', 75, 15, 0, 1151, TRUE, 'assets/images/runes/78252.png'),
    ('Rune Rata Vi', 'Vitalite', 'rata', 100, 20, 0, 1152, TRUE, 'assets/images/runes/78253.png'),
    ('Rune Ta Pui', 'Puissance', 'ta', 6, 12, 0, 1210, TRUE, 'assets/images/runes/78191.png'),
    ('Rune Pata Pui', 'Puissance', 'pata', 9, 18, 0, 1211, TRUE, 'assets/images/runes/78192.png'),
    ('Rune Rata Pui', 'Puissance', 'rata', 12, 24, 0, 1212, TRUE, 'assets/images/runes/78193.png'),
    ('Rune Ta Ini', 'Initiative', 'ta', 100, 10, 0, 1240, TRUE, 'assets/images/runes/78254.png'),
    ('Rune Pata Ini', 'Initiative', 'pata', 150, 15, 0, 1241, TRUE, 'assets/images/runes/78255.png'),
    ('Rune Rata Ini', 'Initiative', 'rata', 200, 20, 0, 1242, TRUE, 'assets/images/runes/78256.png'),
    ('Rune Ta Pod', 'Pods', 'ta', 100, 25, 0, 1270, TRUE, 'assets/images/runes/78257.png'),
    ('Rune Pata Pod', 'Pods', 'pata', 200, 50, 0, 1271, TRUE, 'assets/images/runes/78258.png'),
    ('Rune Rata Pod', 'Pods', 'rata', 400, 100, 0, 1272, TRUE, 'assets/images/runes/78259.png'),
    ('Rune Ta Do Feu', 'Dommages Feu', 'ta', 2, 10, 0, 1345, TRUE, 'assets/images/runes/78205.png'),
    ('Rune Pata Do Feu', 'Dommages Feu', 'pata', 4, 20, 0, 1346, TRUE, 'assets/images/runes/78206.png'),
    ('Rune Rata Do Feu', 'Dommages Feu', 'rata', 6, 30, 0, 1347, TRUE, 'assets/images/runes/78207.png'),
    ('Rune Ta Do Eau', 'Dommages Eau', 'ta', 2, 10, 0, 1351, TRUE, 'assets/images/runes/78208.png'),
    ('Rune Pata Do Eau', 'Dommages Eau', 'pata', 4, 20, 0, 1352, TRUE, 'assets/images/runes/78209.png'),
    ('Rune Rata Do Eau', 'Dommages Eau', 'rata', 6, 30, 0, 1353, TRUE, 'assets/images/runes/78210.png'),
    ('Rune Ta Do Air', 'Dommages Air', 'ta', 2, 10, 0, 1357, TRUE, 'assets/images/runes/78211.png'),
    ('Rune Pata Do Air', 'Dommages Air', 'pata', 4, 20, 0, 1358, TRUE, 'assets/images/runes/78212.png'),
    ('Rune Rata Do Air', 'Dommages Air', 'rata', 6, 30, 0, 1359, TRUE, 'assets/images/runes/78213.png'),
    ('Rune Ta Do Terre', 'Dommages Terre', 'ta', 2, 10, 0, 1363, TRUE, 'assets/images/runes/78202.png'),
    ('Rune Pata Do Terre', 'Dommages Terre', 'pata', 4, 20, 0, 1364, TRUE, 'assets/images/runes/78203.png'),
    ('Rune Rata Do Terre', 'Dommages Terre', 'rata', 6, 30, 0, 1365, TRUE, 'assets/images/runes/78204.png'),
    ('Rune Ta Do Neutre', 'Dommages Neutre', 'ta', 2, 10, 0, 1369, TRUE, 'assets/images/runes/78214.png'),
    ('Rune Pata Do Neutre', 'Dommages Neutre', 'pata', 4, 20, 0, 1370, TRUE, 'assets/images/runes/78215.png'),
    ('Rune Rata Do Neutre', 'Dommages Neutre', 'rata', 6, 30, 0, 1371, TRUE, 'assets/images/runes/78216.png'),
    ('Rune Ta Do Pou', 'Dommages Poussee', 'ta', 6, 30, 0, 1390, TRUE, 'assets/images/runes/78198.png'),
    ('Rune Pata Do Pou', 'Dommages Poussee', 'pata', 8, 40, 0, 1391, TRUE, 'assets/images/runes/78199.png'),
    ('Rune Ta Do Cri', 'Dommages Critiques', 'ta', 6, 30, 0, 1399, TRUE, 'assets/images/runes/78200.png'),
    ('Rune Pata Do Cri', 'Dommages Critiques', 'pata', 8, 40, 0, 1400, TRUE, 'assets/images/runes/78201.png'),
    ('Rune Ta Do Per Ar', '% Dommages d''armes', 'ta', 1, 15, 0, 1450, TRUE, 'assets/images/runes/78220.png'),
    ('Rune Ta Do Per Di', '% Dommages distance', 'ta', 1, 15, 0, 1453, TRUE, 'assets/images/runes/78221.png'),
    ('Rune Ta Do Per Mé', '% Dommages melee', 'ta', 1, 15, 0, 1456, TRUE, 'assets/images/runes/78222.png'),
    ('Rune Ta Do Per So', '% Dommages aux sorts', 'ta', 1, 15, 0, 1459, TRUE, 'assets/images/runes/78219.png'),
    ('Rune Ta So', 'Soins', 'ta', 4, 40, 0, 1480, TRUE, 'assets/images/runes/78248.png'),
    ('Rune Pata So', 'Soins', 'pata', 7, 70, 0, 1481, TRUE, 'assets/images/runes/78249.png'),
    ('Rune Rata So', 'Soins', 'rata', 10, 100, 0, 1482, TRUE, 'assets/images/runes/78250.png'),
    ('Rune Ta Cri', 'Critique', 'ta', 1, 10, 0, 1486, TRUE, 'assets/images/runes/78246.png'),
    ('Rune Pata Cri', 'Critique', 'pata', 2, 20, 0, 1487, TRUE, 'assets/images/runes/78247.png'),
    ('Rune Ta Ret Pa', 'Retrait PA', 'ta', 2, 14, 0, 1510, TRUE, 'assets/images/runes/78235.png'),
    ('Rune Pata Ret Pa', 'Retrait PA', 'pata', 3, 21, 0, 1511, TRUE, 'assets/images/runes/78236.png'),
    ('Rune Rata Ret Pa', 'Retrait PA', 'rata', 4, 28, 0, 1512, TRUE, 'assets/images/runes/78237.png'),
    ('Rune Ta Ret Pme', 'Retrait PM', 'ta', 2, 14, 0, 1516, TRUE, 'assets/images/runes/78238.png'),
    ('Rune Pata Ret Pme', 'Retrait PM', 'pata', 3, 21, 0, 1517, TRUE, 'assets/images/runes/78239.png'),
    ('Rune Rata Ret Pme', 'Retrait PM', 'rata', 4, 28, 0, 1518, TRUE, 'assets/images/runes/78240.png'),
    ('Rune Ta Ré Pa', 'Esquive PA', 'ta', 2, 14, 0, 1540, TRUE, 'assets/images/runes/78229.png'),
    ('Rune Pata Ré Pa', 'Esquive PA', 'pata', 4, 28, 0, 1541, TRUE, 'assets/images/runes/78230.png'),
    ('Rune Rata Ré Pa', 'Esquive PA', 'rata', 6, 42, 0, 1542, TRUE, 'assets/images/runes/78231.png'),
    ('Rune Ta Ré Pme', 'Esquive PM', 'ta', 2, 14, 0, 1546, TRUE, 'assets/images/runes/78232.png'),
    ('Rune Pata Ré Pme', 'Esquive PM', 'pata', 4, 28, 0, 1547, TRUE, 'assets/images/runes/78233.png'),
    ('Rune Rata Ré Pme', 'Esquive PM', 'rata', 6, 42, 0, 1548, TRUE, 'assets/images/runes/78234.png'),
    ('Rune Ta Tac', 'Tacle', 'ta', 4, 16, 0, 1570, TRUE, 'assets/images/runes/78226.png'),
    ('Rune Pata Tac', 'Tacle', 'pata', 6, 24, 0, 1571, TRUE, 'assets/images/runes/78227.png'),
    ('Rune Rata Tac', 'Tacle', 'rata', 8, 32, 0, 1572, TRUE, 'assets/images/runes/78228.png'),
    ('Rune Ta Fui', 'Fuite', 'ta', 4, 16, 0, 1576, TRUE, 'assets/images/runes/78223.png'),
    ('Rune Pata Fui', 'Fuite', 'pata', 6, 24, 0, 1577, TRUE, 'assets/images/runes/78224.png'),
    ('Rune Rata Fui', 'Fuite', 'rata', 8, 32, 0, 1578, TRUE, 'assets/images/runes/78225.png'),
    ('Rune Ta Ré Pou', 'Res. Poussee', 'ta', 9, 18, 0, 1645, TRUE, 'assets/images/runes/78194.png'),
    ('Rune Pata Ré Pou', 'Res. Poussee', 'pata', 12, 24, 0, 1646, TRUE, 'assets/images/runes/78195.png'),
    ('Rune Ta Ré Cri', 'Res. Critiques', 'ta', 9, 18, 0, 1654, TRUE, 'assets/images/runes/78196.png'),
    ('Rune Pata Ré Cri', 'Res. Critiques', 'pata', 12, 24, 0, 1655, TRUE, 'assets/images/runes/78197.png'),
    ('Rune Ta Ré Per Feu', '% Res. Feu', 'ta', 2, 12, 0, 1690, TRUE, 'assets/images/runes/78242.png'),
    ('Rune Ta Ré Per Eau', '% Res. Eau', 'ta', 2, 12, 0, 1693, TRUE, 'assets/images/runes/78243.png'),
    ('Rune Ta Ré Per Air', '% Res. Air', 'ta', 2, 12, 0, 1696, TRUE, 'assets/images/runes/78244.png'),
    ('Rune Ta Ré Per Terre', '% Res. Terre', 'ta', 2, 12, 0, 1699, TRUE, 'assets/images/runes/78241.png'),
    ('Rune Ta Ré Per Neutre', '% Res. Neutre', 'ta', 2, 12, 0, 1702, TRUE, 'assets/images/runes/78245.png'),
    ('Rune Ta Ré Per Mé', '% Res. melee', 'ta', 1, 15, 0, 1720, TRUE, 'assets/images/runes/78218.png'),
    ('Rune Ta Ré Per Di', '% Res. distance', 'ta', 1, 15, 0, 1723, TRUE, 'assets/images/runes/78217.png')
ON CONFLICT (nom) DO NOTHING;

NOTIFY pgrst, 'reload schema';
