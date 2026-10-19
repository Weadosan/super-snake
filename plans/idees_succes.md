# Idées de succès pour Super Snake

Chaque succès a un numéro pour pouvoir le choisir facilement. Les conditions s'appuient sur ce qui existe déjà dans le code (stats de partie, boss tous les 40 kills, fin de partie à 200 de long, victoire à 400, buffs de la pomme bleue, rollback, bouclier, sprint, coop, en ligne, thèmes, skins d'ennemis, difficultés).

## 1. Premiers pas
1. **Premier repas** : manger sa première pomme.
2. **Bon élève** : terminer le tutoriel.
3. **Curieux** : ouvrir les 6 pages de l'aide.
4. **Premier sang** : tuer son premier ennemi.
5. **Première chute** : perdre sa première partie (succès « consolation »).

## 2. Longueur et survie
6. **Ça pousse** : atteindre une longueur de 50.
7. **Boa** : atteindre 100.
8. **Anaconda** : atteindre 200 (entrer en fin de partie, plus d'ennemis).
9. **Super Snake** : gagner une partie (longueur 400, feu d'artifice).
10. **Increvable** : survivre 5 minutes dans une partie.
11. **Marathon** : survivre 15 minutes.
12. **Sans une égratignure** : atteindre 100 de long sans perdre un seul cœur.
13. **Sur le fil** : gagner une partie en finissant avec 1 seul cœur.

## 3. Combat
14. **Chasseur** : 50 ennemis tués en une partie.
15. **Exterminateur** : 150 ennemis tués en une partie.
16. **Massacre cumulé** : 1 000 ennemis tués au total (toutes parties).
17. **Tireur d'élite** : finir une partie avec au moins 80 % de précision (au moins 50 tirs).
18. **Gros bras** : tuer 25 ennemis coriaces (les violets/résistants).
19. **Combo** : tuer 5 ennemis en moins de 3 secondes.
20. **Pacifiste** : atteindre 50 de long sans tirer un seul coup.

## 4. Boss
21. **Tueur de géant** : vaincre un boss.
22. **Collectionneur de trophées** : vaincre 3 boss dans la même partie.
23. **Boss de chaque espèce** : vaincre le boss de chaque skin d'ennemi (oursin, fantôme, pixel, slime, chauve-souris).
24. **Sans trembler** : vaincre un boss sans perdre de cœur pendant le combat.

## 5. Pommes et bonus
25. **Gourmand** : 500 pommes mangées au total.
26. **Ruée vers l'or** : manger 5 pommes en or dans une partie.
27. **Rattrapé !** : manger une pomme en or dans les 2 secondes après son apparition.
28. **Butin** : ramasser 20 pommes laissées par des ennemis.
29. **Cœur sur la main** : ramasser 10 cœurs bonus au total.
30. **Panoplie complète** : obtenir chacun des 6 buffs de la pomme bleue au moins une fois (gel, laser, auto-visée, explosion, invincibilité, points x2).
31. **Grand ménage** : tuer 10 ennemis d'un coup avec l'explosion générale.
32. **Jackpot** : marquer 500 points pendant un seul Points x2.

## 6. Capacités
33. **Retour vers le futur** : utiliser le rollback pour la première fois.
34. **Boucle temporelle** : enchaîner 3 rollbacks (jusqu'au recul de 3 s ou plus).
35. **Parade parfaite** : bloquer un coup avec le bouclier.
36. **Fou du volant** : sprinter pendant 60 secondes cumulées dans une partie.
37. **À l'ancienne** : atteindre 100 de long avec bouclier et sprint désactivés.

## 7. Difficulté
38. **Échauffement** : atteindre 100 de long en Facile.
39. **Sérieux** : vaincre un boss en Normal.
40. **Hardcore** : vaincre un boss en Difficile.
41. **Légende** : gagner une partie en Difficile.
42. **Tout-terrain** : gagner une partie dans chaque difficulté.

## 8. Thèmes et skins
43. **Touriste** : jouer une partie dans chacun des 4 thèmes (néon, espace, lave, océan).
44. **Explorateur** : atteindre 100 de long dans chaque thème.
45. **Bestiaire** : affronter chacun des 5 skins d'ennemis.
46. **Maître des éléments** : gagner une partie dans chaque thème.

## 9. Coop et en ligne
47. **Duo** : jouer une partie en coop.
48. **Main dans la main** : vaincre un boss en coop.
49. **Esprit d'équipe** : gagner une partie en coop.
50. **Pas de tir ami** : atteindre 100 de long en coop avec la collision entre joueurs activée, sans se toucher.
51. **Connecté** : jouer une partie en ligne (héberger ou rejoindre une salle).
52. **À distance** : vaincre un boss en ligne.

## 10. Score et secrets
53. **Score à 4 chiffres** : 1 000 points en une partie.
54. **Score à 5 chiffres** : 10 000 points en une partie.
55. **Podium** : entrer dans le tableau des meilleurs scores.
56. **Accro** : jouer 50 parties.
57. **Platine** : débloquer tous les autres succès.
58. **Secret : Kamikaze** : perdre dans les 5 premières secondes (affiché « ??? » tant qu'il n'est pas débloqué).

## Affichage proposé

- **Notification au déblocage** : une petite bannière en haut du plateau (icône + nom du succès) qui glisse puis disparaît après ~3 s, avec un son court. Elle ne met pas le jeu en pause. On peut réutiliser le style des bulles d'astuces.
- **Écran des succès** : une entrée « 🏆 Succès » dans le menu ☰ (et touche dédiée, par exemple S). Grille de cartes par catégorie : succès débloqués en couleur avec leur date, verrouillés en gris avec la condition, secrets en « ??? ». Compteur global en haut (ex. 12 / 58) et barre de progression pour les succès cumulés (ex. 340 / 1 000 ennemis).
- **Écran de game over** : une ligne « Succès débloqués pendant cette partie » sous les statistiques.
- **Sauvegarde locale** : une clé `snakeSucces` dans le localStorage (comme les autres réglages), avec la liste des succès obtenus et leur date, plus les compteurs cumulés (ennemis, pommes, parties, boss par skin, thèmes joués...). Un bouton « Réinitialiser les succès » dans l'écran.
- **Tutoriel et en ligne** : pas de succès pendant le tutoriel (sauf « Bon élève »). En ligne, chaque joueur garde ses succès sur son propre appareil.
