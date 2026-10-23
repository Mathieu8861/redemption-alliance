'use strict';
/* ===================== LES LECONS DE PEPITO (12/10/2026) =====================
   « le tuto il est pas un peu leger ? faudrait expliquer plus de trucs, y'a beaucoup de choses a savoir, la on donne juste les bases » (Mathieu).
   Apres le tuto du debut, Pepito explique chaque systeme au moment ou il devient utile : 2 a 4 cartes, le jeu en pause pendant la lecture,
   une seule fois. Certaines s'ouvrent par-dessus une fenetre (fenetre : 'vagues'). Le Carnet de Pepito (Options) les garde a relire.
   Une ferme deja avancee a l'arrivee des lecons ne recoit pas celles dont le moment est deja passe : elles sont rangees dans le carnet. */
const toucherQ = (quoi) => (tutoDoigt() ? 'touche ' : 'clic droit sur ') + quoi;
const cliquerQ = (quoi) => (tutoDoigt() ? 'touche ' : 'clic gauche sur ') + quoi;
const SORT_LECON = {
  iop: () => `le <em>Bond du Iop</em> : tu vises où il saute, il frappe trois fois plus fort en retombant et se soigne un peu à chaque monstre touché.`,
  cra: () => `la <em>Flèche perçante</em> : elle traverse toute une ligne de monstres. Elle se recharge en 20 s.`,
  osa: () => `l'<em>Invocation</em> : tu vises où poser un Bouftou, qui retombe sur les monstres puis se bat pour toi.`
};
const premiereRare = () => [...Object.keys(S_.sac || {}), ...Object.values(S_.equip || {})].find((k) => { const o = k && obj(k); return !!(o && o.rare); }); /* (la premiere piece rare du sac ou portee : la lecon « Une piece rare ») */
const LECONS = [ /* (les dernieres, « premiere fois », 22/10/2026 : en bas de la liste) */
  { id: 'eau', titre: 'L\'eau', ico: 'arrosoir', resume: 'Le puits, l\'arrosoir, la citerne.', quand: () => S_.eau <= 0,
    pages: [() => `Ton <em>arrosoir</em> est vide (la goutte bleue, en bas à droite). Pour le remplir, ${toucherQ('le <em>puits</em>')} : ton perso y va et fait le plein.`,
      () => `Arroser n'est pas obligatoire, mais un semis arrosé pousse <em>deux fois et demie plus vite</em>. Améliore <em>le puits</em> (bouton Améliorer) : la poulie remplit l'arrosoir dès que tu passes à côté, puis une citerne arrose seule tes nouveaux semis.`] },
  { id: 'tofus', titre: 'Les Tofus', ico: 'tofu', resume: 'Les chasser, l\'épouvantail, les filets et la volière.', quand: () => S_.cases.some((c) => c.type === 'champ' && c.tofu),
    pages: [() => `Un <em>Tofu</em> picore ton champ ! Tant qu'il reste, il te vole des récoltes. ${toucherQ('lui').replace(/^./, (x) => x.toUpperCase())} pour le chasser.`,
      () => `L'<em>épouvantail</em> les éloigne : deux fois moins de Tofus au niveau 1, trois fois moins au niveau 2, et au niveau 3 il leur tire dessus tout seul avec tes flèches (bouton Améliorer).`,
      () => `Avec un <em>filet</em> (${PRIX_FILET} kamas à l'HDV), tu peux les capturer au lieu de les chasser : ils vont dans ta <em>volière</em> et donnent des plumes à vendre. Un Tofu sauvage posé dans l'herbe se capture plus facilement qu'un Tofu sur un champ.`] },
  { id: 'cultures', titre: 'Quoi planter ?', ico: 'orge', resume: 'Les cultures, leur temps de pousse, leur prix.', quand: () => niveau(S_.xp) >= 5,
    pages: [() => `Tu débloques de nouvelles cultures en montant de niveau : l'<em>Orge</em> au niveau 5, puis la Cawotte, l'Avoine, la Fraise, le Houblon... Leurs graines s'achètent à l'<em>HDV</em>, onglet Acheter.`,
      () => `Chaque culture a son <em>temps de pousse</em>, son prix et son XP : le Blé pousse en ${dureeLisible(PAR_ID.ble.temps * MIN)}, l'Orge en ${dureeLisible(PAR_ID.orge.temps * MIN)}, l'Avoine en ${dureeLisible(PAR_ID.avoine.temps * MIN)}. Les longues rapportent plus par récolte, les courtes s'enchaînent.`,
      () => `Quand tu fermes le jeu ou que tu le mets <em>en pause</em>, ta ferme continue sans toi, à son rythme de vraie ferme : vingt fois plus lentement que quand tu joues, 10 h au plus. Les cultures poussent, les Bouftous font leur laine, la vague se prépare. Les monstres, les voleurs et les simus VSA, eux, attendent ton retour. Une Fraise plantée le soir est mûre au réveil.`] },
  { id: 'agrandir', titre: 'Agrandir la ferme', ico: 'pelle', resume: 'Labourer, acheter des terrains, Aménager.', quand: () => niveau(S_.xp) >= 3,
    pages: [() => `Pour planter plus, ${toucherQ('une case d\'herbe libre')} et <em>laboure</em> une parcelle. Tu as un quota de parcelles : il grandit avec les terrains.`,
      () => `Les <em>pancartes</em> au bord de l'île montrent les terrains à vendre : chacun ajoute des cases et des parcelles à labourer.`,
      () => `Le bouton <em>Aménager</em> déplace tes parcelles et tes bâtiments : organise la ferme comme tu veux.`] },
  /* les boutons du bas (« amenager, ameliorer etc aussi stp », Mathieu, 12/10/2026) : une lecon la premiere fois qu'on ouvre chacun */
  { id: 'graines', titre: 'Les graines', ico: 'ble', resume: 'Choisir ce que ton perso plante.', fenetre: 'graines', quand: () => true,
    pages: [() => `Ici, tu choisis la <em>graine</em> que ton perso plante quand tu ${toucherQ('une parcelle vide')}. Le chiffre sur chaque graine : combien il t'en reste en grange.`,
      () => `Une graine grisée n'est pas encore débloquée : elle arrive avec ton niveau de Paysan. Les graines s'achètent à l'<em>HDV</em>, onglet Acheter.`] },
  { id: 'hdv', titre: 'L\'Hôtel de vente', ico: 'etal', resume: 'Acheter, vendre, les prix qui bougent, les crises.', fenetre: 'hdv', quand: () => ouvrirHdv.dernier !== 'ameliorer',
    pages: [() => `L'<em>Hôtel de vente</em> a quatre onglets : <em>Acheter</em> (graines, animaux, matériel comme les filets et les flèches, outils, pots de gelée, décorations), <em>Vendre</em> (tes récoltes, la laine, les plumes, le butin des monstres), <em>Construire</em> (les bâtiments que tu n'as pas encore) et <em>Améliorer</em> (monter de niveau ceux que tu as).`,
      () => `Les prix bougent : toutes les ${dureeLisible(CADENCE_COURS)}, chaque produit monte ou descend un peu, jusqu'à 20 % au-dessus ou en dessous de son prix normal. L'onglet Vendre te dit s'il est <em>en hausse</em> ou <em>en baisse</em> : vends plutôt quand c'est haut.`,
      () => `De temps en temps, une <em>crise</em> fait chuter un produit de 40 % pendant une minute : attends qu'elle passe pour le vendre. Améliorer l'étal fait vendre plus cher et acheter les graines moins cher.`] },
  { id: 'amelio2', titre: 'Améliorer', ico: 'marteau', resume: 'Ferme, Animaux, Défense, lire une carte, par où commencer.', fenetre: 'hdv', quand: () => ouvrirHdv.dernier === 'ameliorer',
    pages: [() => `<em>Améliorer</em>, c'est monter de niveau ce que tu as déjà, en trois catégories : <em>Ferme</em> (le puits, l'étal, l'atelier de forgemagie), <em>Animaux</em> (l'enclos, la volière, la Gelière) et <em>Défense</em> (la grange et son arbalète, l'épouvantail, le leurre, ton gardien). Le chiffre orange, c'est ce que tu peux acheter tout de suite. Les outils (engrais, faux, bottes...) sont dans Acheter.`,
      () => `Chaque carte montre son <em>niveau</em> en crans, ce que fait le bâtiment, puis ce que change le prochain achat : la valeur d'avant, une flèche, celle d'après. S'il te manque des kamas, elle te dit combien.`,
      () => `Par où commencer ? Par ce qui te gêne : le puits si tu cours chercher de l'eau, l'enclos pour plus de Bouftous, l'épouvantail contre les Tofus, et avant les vagues l'arbalète et les tours (onglet Construire).`] },
  { id: 'construire', titre: 'Construire', ico: 'tour', resume: 'Les bâtiments à poser, leur niveau, leur place.', fenetre: 'hdv', quand: () => ouvrirHdv.dernier === 'construire', /* (22/10/2026) */
    pages: [() => `<em>Construire</em>, ce sont les bâtiments que tu n'as pas encore : l'<em>arbalète</em> sur le toit de la grange, les <em>tours de défense</em>, la <em>Gelière</em>, l'<em>atelier de forgemagie</em>, le <em>leurre à Wabbits</em>, et au niveau ${NIV_GARDIEN} ton <em>gardien</em>. Un cadenas : il se débloque plus tard, avec ton niveau ou ta vague.`,
      () => `Un bâtiment construit se pose tout seul sur une case libre de ta ferme ; tu le déplaces ensuite avec <em>Aménager</em>. Il quitte alors cet onglet et passe dans <em>Améliorer</em>, où il monte de niveau. Les tours, elles, se placent où tu veux et se montent une par une.`] },
  { id: 'grange', titre: 'La grange', ico: 'grange', resume: 'Ton stock, le butin, l\'arbalète du toit.', fenetre: 'grange', quand: () => true,
    pages: [() => `Ta <em>grange</em> garde tout : tes récoltes, tes graines, tes filets, et le <em>butin des vagues</em>. D'ici, tu peux équiper une pièce ou la revendre.`,
      () => `Sur son toit, l'<em>arbalète</em> (à construire : HDV, onglet Construire) tire seule sur les voleurs et les monstres. La grange montre ses carreaux chargés et tes flèches en réserve. Dès son niveau 3, elle se recharge toute seule.`,
      () => `Les voleurs de VSA se renforcent à chaque vague gagnée : la grange te dit combien de PV ils ont. Si elle tombe en ruine, l'arbalète ne tire plus et ils emportent deux fois plus.`] },
  { id: 'perso', titre: 'Ta fiche', ico: () => icoClasse(), resume: 'Équipement, sorts, bestiaire, caractéristiques.', fenetre: 'perso', quand: () => true,
    pages: [() => `Ta <em>fiche</em> a trois onglets : <em>Équipement</em> (tes 6 emplacements, ton arme et ton sac), <em>Sorts</em> (ton attaque, ton sort et ton ulti) et <em>Bestiaire</em> (les monstres de chaque palier et ce qu'ils lâchent).`,
      () => `En bas, tes <em>caractéristiques</em> : la Vitalité donne des PV, la Puissance des dégâts, l'Agilité de la vitesse d'attaque, la Sagesse de l'XP, la Prospection du butin. Touche-en une pour le détail.`,
      () => `Pour t'équiper : touche un emplacement, puis une pièce du sac. Une flèche verte, c'est mieux que ce que tu portes. Ton niveau de Paysan est aussi ton niveau de combat.`] },
  { id: 'amenager', titre: 'Aménager', ico: 'pelle', resume: 'Déplacer, tourner, agrandir l\'enclos.', urgent: true, quand: () => mode === 'choisir',
    pages: [() => `Mode <em>Aménager</em> : touche une parcelle, un bâtiment, une tour, un arbre ou l'enclos pour le choisir, puis une case d'herbe libre pour l'y poser. Autant de fois que tu veux, puis <em>Terminer</em>.`,
      () => `Un bâtiment ou un arbre se pivote avec <em>Tourner</em>. Pour l'<em>enclos</em> : touche une case collée pour l'agrandir, une case de l'enclos pour la rendre, ou une case plus loin pour le déplacer en entier.`,
      () => `Déplacer ne coûte rien : essaie ! Par exemple la grange près des champs, et les tours là où les monstres arrivent.`] },
  { id: 'combat', titre: 'Ta première vague', ico: 'bouftou', resume: 'Cibler, se déplacer, ton sort, perdre ou fuir.', fenetre: 'vagues', quand: () => S_.vague.num === 1,
    pages: [() => `Une <em>vague</em>, ce sont des monstres qui grimpent par les bords de l'île. Ils s'en prennent à toi, et certains à tes bâtiments. Gagne-la pour des kamas, de l'XP et parfois de l'équipement. Elle n'arrive que quand tu la lances.`,
      () => `Les monstres apparaissent <em>au hasard</em> : chacun sort d'un endroit du bord tiré au sort, différent à chaque vague. Tu ne sais jamais d'où ils viendront, alors garde un œil sur tout le tour de ta ferme, et place tes tours pour couvrir plusieurs côtés.`,
      () => `Pendant la vague, ${cliquerQ('un monstre')} pour le <em>cibler</em> : ton perso y va et frappe tout seul. ${cliquerQ('une case').replace(/^./, (x) => x.toUpperCase())} pour te déplacer.`,
      () => `En bas à droite, ton <em>sort</em> : ${(SORT_LECON[classeDe()] || SORT_LECON.iop)()}`,
      () => `Si tes PV tombent à zéro, ton perso tombe : pendant 12 s, les monstres saccagent tes bâtiments (tes tours et ton arbalète tirent toujours), puis ils repartent avec ton plus beau champ, et ton perso se repose ${dureeLisible(REPOS_VAGUE)} et revient à ${Math.round(VIE_APRES_DEFAITE * 100)} % de vie. Le bouton <em>Fuir</em> arrête la vague sans repos, mais ils saccagent quand même un champ.`] },
  { id: 'victoire', titre: 'Après la victoire', ico: 'kama', resume: 'La préparation, le niveau requis, les réparations.', quand: () => S_.vague.num >= 2,
    pages: [() => `Bravo ! La vague suivante <em>se prépare</em> pendant 1 minute. Il faut aussi le <em>niveau</em> qu'elle demande : le numéro de la vague moins 2.`,
      () => `Les bâtiments frappés gardent leurs dégâts : ${toucherQ('un bâtiment abîmé')} pour le réparer, ou le bouton <em>Tout réparer</em> en fin de vague. Un bâtiment en ruine ne sert plus à rien tant que tu ne l'as pas reconstruit.`,
      () => `Toutes les 10 vagues, un <em>boss</em> t'attend. Je t'expliquerai le moment venu.`] },
  { id: 'ulti', titre: 'Ton ulti', ico: 'ulti-zone', resume: 'Gel, Zone ou Coup fatal, pour de bon.', quand: () => niveau(S_.xp) >= NIV_ULTI && !S_.ulti,
    pages: [() => `Niveau ${NIV_ULTI} : tu peux choisir ton <em>ulti</em>, un coup spécial en plus de ton attaque et de ton sort. Le choix est <em>définitif</em> : on le fait dans la fenêtre Vagues, ou au bouton Ulti pendant un combat.`,
      () => `<em>Gel</em> : petits dégâts autour de la cible, et les monstres touchés sont ralentis 5 s. <em>Zone</em> : 3 fois tes dégâts à tous les monstres autour. <em>Coup fatal</em> : 5 fois tes dégâts sur un seul, parfait contre les boss. Il se recharge en ${RECHARGE_ULTI} s.`] },
  { id: 'equipement', titre: 'L\'équipement', ico: 'sac', resume: 'La fiche Perso, comparer, les panoplies.', quand: () => Object.keys(S_.sac || {}).length > 0,
    pages: [() => `Un monstre t'a laissé une <em>pièce d'équipement</em> ! Ouvre <em>Perso</em> (en bas) : touche une case, puis une pièce du sac pour la comparer. Une flèche verte, c'est mieux que ce que tu portes.`,
      () => `Chaque pièce donne des <em>caractéristiques</em> : Vitalité, Puissance, Agilité... Touche-en une dans la fiche pour savoir à quoi elle sert. Les pièces d'une même <em>panoplie</em> donnent un bonus à 2, 4 et 6 pièces portées.`,
      () => `Deux pièces du même nom n'ont pas les mêmes chiffres : chacune a son <em>jet</em>, tiré entre 75 % et 125 % des valeurs de base. Garde les meilleures ! L'<em>atelier de forgemagie</em> les améliore ensuite avec des runes.`,
      /* (23/10/2026, « on explique tout ca, les stuffs, la rarete, comment on recupere, dans le tuto ? », Mathieu : d'ou viennent les pieces, et les rares) */
      () => `D'où viennent les pièces ? Pendant les vagues, chaque monstre a <em>7 % de chances</em> d'en lâcher une de la panoplie de son palier (un Tofu, 2 %), en priorité une que tu n'as pas encore. Le <em>boss</em> en lâche une à coup sûr la première fois, puis 4 fois sur 10 quand tu le rejoues, et parfois son arme. Ta <em>Prospection</em> augmente les chances des monstres.`,
      () => `Une pièce sur 100 tombe <em>rare</em> : une étoile ★ devant son nom, un liseré doré, et <em>50 % de caractéristiques en plus</em>. Une rare d'un palier bat souvent une pièce normale du palier suivant ! Elle compte dans sa panoplie et se revend 3 fois plus cher.`,
      () => `Les pièces en trop se revendent à l'HDV (onglet Vendre) ou depuis la grange. Les panoplies sont toutes dans le <em>Bestiaire</em>, onglet Panoplies.`] },
  { id: 'repas', titre: 'Les repas', ico: 'cawotte', resume: 'Manger avant une vague.', quand: () => CULTURES.some((c) => c.mange && (niveau(S_.xp) >= c.niv || (S_.grange[c.id] || 0) > 0)),
    pages: [() => `Avant une vague, ton perso peut <em>manger</em> une récolte de ta grange : la <em>Cawotte</em> donne +20 % de dégâts, la <em>Fraise</em> +30 % de prospection (plus de butin), pendant la vague suivante.`,
      () => `Ça se passe dans la fenêtre <em>Vagues</em>, partie « Avant la bataille : manger ». Pense-y avant un boss !`] },
  { id: 'geliere', titre: 'La Gelière', ico: 'geliere', resume: 'Tes Gelées font tes pots de gelée avec tes fruits.', quand: () => niveau(S_.xp) >= NIV_GELIERE && !niv('geliere'),
    pages: [() => `Niveau ${NIV_GELIERE} : tu peux construire la <em>Gelière</em> (HDV, onglet Construire). Elle prend 6 cases d'herbe libres d'un seul tenant (3 sur 2) : fais-lui de la place avec Aménager si besoin.`,
      () => `Achète des <em>Gelées</em> à l'HDV (catégorie Gelées) et nourris-les de tes fruits : chacune te fait un pot de sa couleur en ${dureeLisible(PROD_GELEE)}. Bleue : 4 Cawottes. Fraise : 4 Fraises (+40 % de vie). Citron : 3 Fraises et 3 Cawottes (tu cours plus vite).`,
      () => `Croise deux Gelées de couleurs différentes : parfois naît une <em>Gelée Royale</em>, dont le pot rend toute ta vie et donne +20 Agilité pour la vague. Les Gelées aiment l'eau : elles sautillent au bord des mares.`] },
  { id: 'vie', titre: 'Ta vie et les pots', ico: 'pot-petit', resume: 'La vie remonte doucement : les pots de gelée vont plus vite.', fenetre: 'vagues', quand: () => S_.pv != null && S_.pv < statsPerso().pvMax,
    pages: [() => `Ta <em>vie</em> ne remonte plus d'un coup entre les vagues : tu repars avec ce qui te reste de la précédente. Elle remonte doucement toute seule (${REGEN_PV} PV toutes les ${dureeLisible(REGEN_PAS)}), ou d'un coup avec un <em>pot de gelée</em>.`,
      () => `Les pots s'achètent à l'HDV (catégorie <em>Gelées</em>). Tu les bois avec le <em>bouton potion</em>, juste à côté de ta vie (ou en touchant ta vie), ou depuis la fenêtre des vagues. Le pot de <em>Menthe</em> continue de te soigner pendant la vague.`,
      () => `Après une défaite, ton perso se repose et revient à ${Math.round(VIE_APRES_DEFAITE * 100)} % de vie au moins. Pépito t'a laissé ${POTS_DEPART} petits pots pour commencer.`] },
  { id: 'arene', titre: 'L\'Arène', ico: 'kama', resume: 'Les vagues sans fin, le ticket, le classement.', quand: () => lieu === 'arene',
    pages: [() => `Bienvenue dans l'<em>Arène</em> ! Des vagues sans fin, de plus en plus dures, avec les monstres de tes paliers déjà battus. Ils sortent des trois herses et foncent tous sur toi : ici, ni culture ni bâtiment à défendre.`,
      () => `Un <em>boss</em> toutes les 5 vagues, avec son <em>coffre</em> (des kamas, parfois une pièce de ta panoplie avec un bon jet, avec beaucoup de chance des runes), puis un souffle pour boire tes pots et manger. Chaque vague tenue rapporte de l'expérience et un peu de kamas. Les runes se méritent : plus tu vas loin, plus les monstres en lâchent.`,
      () => `Les <em>runes de forgemagie</em> améliorent tes pièces : +20 % de jet sur la caractéristique de ton choix, jusqu'au maximum. La <em>rune parfaite</em> met une pièce au jet maximum. Elles s'utilisent à ton <em>atelier de forgemagie</em> (HDV, onglet Construire, ${fmt(100000)} kamas).`,
      () => `Ton <em>record de la semaine</em> compte au classement de l'alliance, pour l'honneur. ${ENTREES_ARENE} entrées par jour, un ticket de ${fmt(TICKET_ARENE)} kamas chacune.`] },
  { id: 'raids', titre: 'Les voleurs de VSA', ico: 'voleur', urgent: true, resume: 'Les simus VSA sur la grange, l\'arbalète, les tours.', quand: () => !!raidAnnonce,
    pages: [() => `Une <em>simu VSA</em> : des <em>voleurs de VSA</em> attaquent à plusieurs ! Ils grimpent sur l'île et filent vers ta <em>grange</em> pour voler tes récoltes, puis repartent par la case violette, où Omeho, leur chef, les attend sur sa calèche.`,
      () => `Abats-les avant qu'ils quittent la ferme : ce qu'ils portent revient à ta grange, et ils ont quelques kamas sur eux. L'<em>arbalète</em> de la grange et tes <em>tours</em> tirent seules, avec les flèches de ta réserve (HDV).`,
      () => `À partir du niveau ${NIV_SIMU}, une simu VSA arrive toutes les ${dureeLisible(CADENCE_RAID)} quand tu joues, annoncée 30 s avant. Ils arrivent de tout autour de ta ferme, l'un après l'autre, chacun par une case marquée en rouge, et repartent tous par la même sortie, la case de bord la plus loin de ta grange, marquée en violet : Omeho, leur chef, les y attend en tremblant. Une grange en ruine les laisse emporter deux fois plus. Dès la vague 30, un <em>Déménageur</em> les accompagne (deux dès la vague 50) : lent mais très coriace, il emporte quatre fois plus s'il atteint ta grange.`] },
  { id: 'tours', titre: 'Les tours de défense', ico: 'tour', resume: 'Les construire, les placer, les monter.', quand: () => niveau(S_.xp) >= NIV_TOUR && !nbTours(),
    pages: [() => `Niveau ${NIV_TOUR} : tu peux construire des <em>tours de défense</em>. ${toucherQ('une case d\'herbe libre').replace(/^./, (x) => x.toUpperCase())}, puis Tour de défense. Jusqu'à ${TOURS_MAX} tours.`,
      () => `Elles tirent seules sur les monstres et les voleurs, avec les <em>flèches</em> de ta réserve. Place-les près de la grange et des champs, là où passent les monstres. Chaque tour se monte de niveau à part (bouton Améliorer).`] },
  { id: 'boss', titre: 'Les boss', ico: () => PALIERS[palierDe(vagueCourante())].icone, resume: 'Les zones rouges, sa troupe, la rage.', fenetre: 'vagues', quand: () => vagueBoss(vagueCourante()),
    pages: [() => `La prochaine vague est celle d'un <em>boss</em> : beaucoup de PV, et un <em>sort spécial</em> annoncé par une zone rouge au sol. Quand elle apparaît, sors-en vite !`,
      () => `Sa <em>troupe le protège</em> : chaque monstre près de lui retire 12 % de tes dégâts, jusqu'à 60 %. Et il en rappelle deux toutes les ${RAPPEL_TROUPE} s. Dégage la troupe, puis frappe le boss avant qu'elle revienne.`,
      () => `Sous 30 % de vie, il entre en <em>rage</em> : il frappe et lance son sort plus souvent. Garde ton ulti pour la fin. Bien préparé, ça passe : tours, arbalète, équipement, un bon repas.`] },
  { id: 'elevage', titre: 'L\'élevage', ico: 'bouftou', resume: 'Faire un petit, le Bouftou noir.', quand: () => S_.bouftous.filter(adulte).length >= 2,
    pages: [() => `Tu as deux Bouftous adultes : ils peuvent faire un <em>petit</em> ! Ouvre l'<em>enclos</em> : il faut ${COUT_REPRO} Houblon (une culture du niveau 15) et deux adultes reposés.`,
      () => `Le bébé grandit en ${dureeLisible(DUREE_CROISSANCE)} s'il est bien nourri (${dureeLisible(DUREE_CROISSANCE_NOIR)} pour un noir), et les parents se reposent ${dureeLisible(REPOS_REPRO)} avant le suivant. Un Bouftou nourri fait de la <em>laine</em>, qui se vend ${LAINE.prix} kamas pièce.`,
      () => `Parfois naît un <em>Bouftou noir</em> : sa laine se vend environ ${fmt(Math.round(prix(LAINE_NOIRE.id)))} kamas. Le premier naît 1 fois sur 20 ; dès que tu en as un, le suivant 1 fois sur 40 ; mais deux parents noirs ensemble font un petit noir 1 fois sur 2.`] },
  { id: 'defis', titre: 'Défis du jour', ico: 'coffre', resume: 'Trois défis par jour, le cadeau de connexion.', quand: () => niveau(S_.xp) >= 2,
    pages: [() => `Chaque jour, <em>3 défis</em> t'attendent (en haut à gauche, bouton Voir) : récolter, vendre, arroser... Chacun rapporte des kamas et de l'XP.`,
      () => `Et chaque jour où tu reviens, un <em>cadeau</em>, un peu plus gros si tu viens tous les jours d'affilée.`] },
  { id: 'revanche', titre: 'La revanche', ico: 'bouftou-royal', resume: 'Rejouer un boss, sa coiffe légendaire.', quand: () => S_.vague.num > VAGUES_PALIER,
    pages: [() => `Un boss battu se <em>rejoue une fois par jour</em>, remis à ton niveau : en bas de la fenêtre Vagues. Ses kamas et son XP baissent à chaque victoire, mais son butin reste le même.`,
      () => `Chaque boss a 2 % de chance de lâcher sa <em>coiffe légendaire</em>, avec un pouvoir unique. La Prospection augmente tes chances.`] },
  /* LES PREMIERES FOIS (22/10/2026, « qu'on explique le jeu au fur et a mesure, quand on achete ou gagne notre premier truc ») */
  { id: 'bestiaire', titre: 'Le Bestiaire', ico: 'chafer', resume: 'Les monstres croisés, ce qu\'ils lâchent, les panoplies.', quand: () => lieu === 'ferme' && valeurCompteur('monstres') > 0,
    pages: [() => `Ton premier monstre est tombé ! Le bouton <em>Bestiaire</em>, en bas, garde chaque monstre que tu croises, palier par palier : touche-en un pour sa fiche (sa vie, ses coups, ce qu'il fait à tes bâtiments, ce qu'il lâche).`,
      () => `L'onglet <em>Panoplies</em> du Bestiaire montre toutes les pièces d'équipement de chaque palier, et le bonus d'une panoplie quand tu en portes plusieurs pièces. Pratique pour savoir quel boss rejouer.`] },
  { id: 'montgolfiere', titre: 'La montgolfière', ico: 'ile-casino', resume: 'La réparer, les îles autour de la ferme.', quand: () => lieu === 'ferme' && niveau(S_.xp) >= NIV_MONTGOLFIERE && !S_.montgolfiere,
    pages: [() => `Niveau ${NIV_MONTGOLFIERE} : la vieille <em>montgolfière</em> rouge et blanche, sur ta ferme, peut être réparée (${fmt(PRIX_MONTGOLFIERE)} kamas). ${toucherQ('elle').replace(/^./, (x) => x.toUpperCase())} pour ça.`,
      () => `Réparée, elle t'emmène sur les <em>îles</em> autour de la ferme : le <em>Casino</em> tout de suite, l'<em>Arène</em> au niveau ${NIV_ARENE}, puis l'<em>Île des boss</em>. Pendant ton voyage, ta ferme ne subit ni vague ni simu VSA.`] },
  { id: 'voyages', titre: 'La carte des vents', ico: 'ile-arene', resume: 'Partir sur une île, rentrer à la ferme.', fenetre: 'montgolfiere', quand: () => !!S_.montgolfiere,
    pages: [() => `La <em>carte des vents</em> : choisis ton île. Le <em>Casino</em> pour jouer tes kamas, l'<em>Arène</em> pour des vagues sans fin et des runes, l'<em>Île des boss</em> pour un boss colossal à battre avec toute l'alliance. Une île grisée attend ton niveau.`,
      () => `Sur une île, le bouton <em>Rentrer à la ferme</em> te ramène. Pendant que tu voyages, ta ferme t'attend : pas de vague ni de simu VSA, mais tes cultures et tes Bouftous continuent leur vie.`] },
  { id: 'casino', titre: 'Le Casino', ico: 'ile-casino', resume: 'Les jeux, la mise maximale, les pertes du jour.', quand: () => lieu === 'casino',
    pages: [() => `Bienvenue au <em>Casino</em> ! ${toucherQ('un jeu').replace(/^./, (x) => x.toUpperCase())} pour jouer : la <em>machine à sous</em>, la <em>roulette</em> et la <em>course de Dragodindes</em>.`,
      () => `Une <em>mise maximale</em> et un plafond de <em>pertes par jour</em> te protègent : le Casino doit rester un jeu. Le bilan de tes parties est dans sa fenêtre.`] },
  { id: 'ileboss', titre: 'L\'Île des boss', ico: 'ile-boss', resume: 'Un boss pour toute l\'alliance, 3 essais par semaine.', quand: () => lieu === 'ile',
    pages: [() => `L'<em>Île des boss</em> : un boss colossal, le même pour toute l'alliance, avec <em>une vie commune</em>. Chacun lui retire ce qu'il peut : tes dégâts s'ajoutent à ceux des autres.`,
      () => `Tu as <em>3 essais par semaine</em>, du vendredi au jeudi ; ton meilleur essai compte. Le vendredi suivant, un <em>coffre</em> t'attend selon tes dégâts et ton rang, plus gros si le boss est tombé. Puis un nouveau boss arrive.`] },
  { id: 'runes', titre: 'Les runes de forgemagie', ico: 'rune-forge', resume: 'Améliorer le jet de tes pièces à l\'atelier.', quand: () => lieu === 'ferme' && (runes().forge || 0) + (runes().parfaite || 0) > 0,
    pages: [() => `Tu as gagné une <em>rune</em> ! Une <em>rune de forgemagie</em> ajoute 20 % de jet à la caractéristique de ton choix sur une pièce, jusqu'au maximum. Une <em>rune parfaite</em> met toute la pièce au jet maximum.`,
      () => `Elles s'utilisent à l'<em>atelier de forgemagie</em> : HDV, onglet Construire (niveau ${NIV_ARENE}, ${fmt(100000)} kamas). ${niv('forge') ? 'Tu l\'as déjà : touche-le sur ta ferme.' : 'Garde tes runes en attendant, elles ne se perdent pas.'}`] },
  { id: 'rare', titre: 'Une pièce rare', ico: () => iconeObjet(premiereRare()), resume: 'L\'étoile, le liseré doré, 50 % de plus.', quand: () => !!premiereRare(),
    pages: [() => `Une pièce <em>rare</em> ! Tu la reconnais à l'étoile ★ devant son nom et à son liseré doré. Elle a <em>50 % de caractéristiques en plus</em> que la même pièce normale : une rare d'un palier bat souvent une pièce normale du palier suivant.`,
      () => `Il en tombe une sur 100, un peu plus avec ta <em>Prospection</em>. Elle compte dans sa panoplie comme les autres, se forgemage pareil, et se revend 3 fois plus cher. Garde-la !`] },
  { id: 'legendaire', titre: 'Une pièce légendaire', ico: 'obj-leg-royal', resume: 'Son pouvoir, un sort de plus en combat.', quand: () => valeurCompteur('legendaires') > 0,
    pages: [() => `Une pièce <em>légendaire</em> ! En plus de ses caractéristiques, elle a un <em>pouvoir</em> : portée, elle t'ajoute un sort pendant les combats, sur un bouton à côté des tiens.`,
      () => `Les légendaires viennent des <em>boss rejoués</em> (la revanche, en bas de la fenêtre Vagues). Une coiffe et une arme légendaires portées ensemble : deux sorts de plus.`] },
  { id: 'gardien', titre: 'Ton gardien', ico: () => (gardienDe() || {}).ico || 'gardiens', resume: 'Le nourrir, la faim, sa transformation en VSA.', quand: () => lieu === 'ferme' && !!S_.gardien,
    pages: [() => `${gardienDe().nom} garde ta ferme ! Il se promène autour de ${gardienDe().nomMaison} : ${toucherQ('lui')} pour le caresser, ${toucherQ('sa maison')} pour sa fenêtre.`,
      () => `Il mange 1 <em>${gardienDe().proie}</em> toutes les ${gardienDe().heures} h, ${RESERVE_GARDIEN} repas d'avance au plus. <em>Affamé</em>, il reste dans sa maison et ne défend plus rien : pense à le nourrir.`,
      () => `Quand un voleur de VSA ou une <em>simu VSA</em> débarque, il se transforme ${gardienDe().forme} et mord les voleurs. Son pouvoir, ${gardienDe().pouvoirNom} : ${gardienDe().pouvoirTxt}.`] },
  { id: 'wabbits', titre: 'Les Wabbits', ico: 'wabbit', resume: 'Ils mangent tes Cawottes, le leurre à Wabbits.', quand: () => S_.cases.some((c) => c.type === 'champ' && c.tofu && c.nuisible === 'wabbit'),
    pages: [() => `Un <em>Wabbit</em> grignote ton champ ! Eux préfèrent les <em>Cawottes</em> et les <em>Fraises</em>. L'épouvantail ne leur fait pas peur : ${toucherQ('lui')} pour le chasser, il laisse parfois un Poil de Wabbit.`,
      () => `Le <em>leurre à Wabbits</em> (HDV, onglet Construire) est une fausse Cawotte qui les attire loin de tes vrais champs. Il ne les chasse pas : c'est à toi de venir, mais tes récoltes sont tranquilles.`] },
];
const lecon = { ouverte: null, page: 0, el: null, derniere: 0, relire: false };
const icoLecon = (L) => (typeof L.ico === 'function' ? L.ico() : L.ico);
function leconsVues() { /* une ferme deja avancee a l'arrivee des lecons : celles dont le moment est passe vont directement au carnet */
  if (!S_.lecons) { S_.lecons = {}; if (niveau(S_.xp) >= 3) LECONS.forEach((L) => { try { if (!L.fenetre && L.quand()) S_.lecons[L.id] = true; } catch (e) { /* rien */ } }); }
  return S_.lecons;
}
function surveillerLecons() { /* dans tick (toutes les 500 ms) : la premiere lecon dont le moment est venu */
  if (!S_ || !S_.perso || S_.leconsOff || lecon.ouverte || tuto.actif || enPause || enAccueil) return;
  const vues = leconsVues();
  for (const L of LECONS.filter((x) => x.urgent).concat(LECONS.filter((x) => !x.urgent))) { /* (le raid d'abord : il n'attend que 30 s) */
    if (vues[L.id]) continue; let ok = false; try { ok = L.quand(); } catch (e) { ok = false; } if (!ok) continue;
    if (L.fenetre ? modaleOuverte !== L.fenetre : !!modaleOuverte) continue;
    if (combat) continue;
    if (!L.fenetre && !L.urgent && tempsReel() - lecon.derniere < 40000) return; /* (pas deux lecons a la suite : 40 vraies secondes entre deux) */
    ouvrirLecon(L.id); return;
  }
}
function ouvrirLecon(id, relire) {
  const L = LECONS.find((x) => x.id === id); if (!L) return;
  if (!lecon.el) {
    lecon.el = document.createElement('div'); lecon.el.id = 'lecon'; lecon.el.hidden = true; document.body.appendChild(lecon.el);
    lecon.el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; e.stopPropagation();
      if (b.hasAttribute('data-lecon-passer')) fermerLecon();
      else if (b.hasAttribute('data-lecon-retour')) { lecon.page = Math.max(0, lecon.page - 1); dessinerLecon(); }
      else if (b.hasAttribute('data-lecon-suivant')) { if (lecon.page + 1 >= lecon.ouverte.pages.length) fermerLecon(); else { lecon.page++; dessinerLecon(); } } });
  }
  lecon.ouverte = L; lecon.page = 0; lecon.relire = !!relire;
  if (!relire) { leconsVues()[id] = true; sauver(); }
  mettrePause(true, true); son('quete'); dessinerLecon();
}
function dessinerLecon() {
  const L = lecon.ouverte; if (!L || !lecon.el) return; const n = lecon.page, N = L.pages.length, der = n + 1 >= N;
  lecon.el.innerHTML = '<div class="carte-lecon" role="dialog" aria-label="Leçon de Pépito : ' + L.titre + '"><div class="tete"><b>Pépito</b> Leçon' + (N > 1 ? ' ' + (n + 1) + ' sur ' + N : '') + '<span class="points">' + L.pages.map((_, k) => '<i class="' + (k < n ? 'ok' : k === n ? 'ici' : '') + '"></i>').join('') + '</span></div>' +
    '<h2>' + L.titre + '</h2><div class="corps"><img src="assets/icones/' + icoLecon(L) + '.png?v=' + VERSION_MODELES + '" alt=""><p>' + L.pages[n]() + '</p></div>' +
    '<div class="boutons">' + (der ? '' : '<button class="passer" data-lecon-passer>' + (lecon.relire ? 'Fermer' : 'Passer') + '</button>') + (n > 0 ? '<button class="btn discret" data-lecon-retour>Retour</button>' : '') + '<button class="btn kamas" data-lecon-suivant>' + (der ? 'Compris !' : 'Suivant') + '</button></div></div>';
  lecon.el.hidden = false;
}
function fermerLecon() {
  lecon.ouverte = null; lecon.derniere = tempsReel(); if (lecon.el) { lecon.el.innerHTML = ''; lecon.el.hidden = true; } mettrePause(false);
}
function ouvrirCarnet() {
  const vues = leconsVues(), nb = LECONS.filter((L) => vues[L.id]).length;
  ouvrirModale('carnet', entete('Le carnet de Pépito') + '<p style="font-size:.82rem;font-weight:600;margin:0 0 8px">Les leçons de Pépito arrivent au moment où tu en as besoin. Celles que tu as déjà vues se relisent ici : ' + nb + ' sur ' + LECONS.length + '.</p>' +
    LECONS.map((L) => { const vue = !!vues[L.id]; let ic = 'cadenas'; try { ic = icoLecon(L); } catch (e) { /* rien */ }
      return '<div class="art' + (vue ? '' : ' grise') + '">' + ico(vue ? ic : 'cadenas') + '<div><b>' + L.titre + '</b><div class="desc">' + L.resume + '</div></div><div class="act">' + (vue ? '<button class="btn discret" data-relire="' + L.id + '">Relire</button>' : '<span class="cadenas">Plus tard</span>') + '</div></div>'; }).join('') +
    '<div class="art">' + ico('cloche') + '<div><b>Les leçons</b><div class="desc">' + (S_.leconsOff ? 'Coupées : Pépito ne t\'en propose plus de nouvelles.' : 'Pépito t\'en propose une quand un nouveau sujet arrive.') + '</div></div><div class="act"><button class="btn discret" data-lecons-bascule>' + (S_.leconsOff ? 'Les remettre' : 'Les couper') + '</button></div></div>');
}
