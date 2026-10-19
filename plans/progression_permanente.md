# Super Snake : plan de progression permanente

19 octobre 2026

## En bref

Chaque partie rapporte des **Écailles** 🪙, même perdue. On les dépense dans une **Boutique** entre les parties pour acheter des améliorations permanentes, débloquer des buffs et les nouveaux thèmes. Les nouveaux skins d'ennemis se gagnent avec les succès. Un nouveau joueur commence avec 3 thèmes, 3 skins et le seul buff Points ×2. Le menu actuel des buffs devient l'**Arsenal** : on y choisit ce qu'on emporte, seulement parmi ce qu'on a débloqué, et seulement entre deux parties. Le tout se livre en 5 étapes, la première sans rien changer au gameplay.

## Décisions prises (19 octobre)

| Question | Réponse |
| --- | --- |
| 1. Nom de la monnaie | Écailles |
| 2. Contenu de départ | 3 thèmes et 3 skins d'ennemis ; le reste se débloque |
| 3. Buffs de départ | Points ×2 seulement ; les 5 autres se débloquent |
| 4. Menu des buffs | Arsenal hors partie |
| 5. Améliorations désactivables, remboursement gratuit | Oui |
| 6. En ligne | Améliorations de l'hôte pour les deux serpents, l'invité gagne ses Écailles |
| 7. Rythme | Environ 50 parties pour les améliorations, à ajuster |
| Demande en plus | Tout l'équilibrage rogue-lite réglable facilement (voir « Réglages ») |

Choix par défaut que j'ai pris, à corriger si besoin :
- Thèmes de départ : Néon, Espace, Océan. Skins de départ : Oursin, Fantôme, Pixel.
- Les joueurs qui ont déjà une sauvegarde gardent tout ce qui existe aujourd'hui (4 thèmes, 5 skins, 6 buffs), pour ne rien leur retirer. Les nouveaux contenus restent à débloquer pour eux aussi.

## Ce qui existe déjà

- **Buffs** : 6 buffs de la pomme bleue (`buffTypes`, js/03-etat.js), tous disponibles dès le début.
- **Menu des buffs** (js/16-menu-buffs.js) : ouvrable en pleine partie, il permet de couper chaque buff, le bouclier, le sprint et la collision entre joueurs, sans contrepartie.
- **Succès** (js/18-succes.js) : 58 succès et des compteurs cumulés. Aucun ne débloque quoi que ce soit.
- **Thèmes et skins** : 4 thèmes et 5 skins d'ennemis, tous libres. L'autre fil propose 4 thèmes (Rétro 8-bit, Aurore glacée, Forêt enchantée, Désert) et 4 skins (Méduse, Œil volant, Drone, Araignée).
- **Sauvegarde** : tout est dans le `localStorage` du navigateur, sans copie de secours ni export.
- **En ligne** : l'hôte fait tourner la partie ; l'invité reçoit une vidéo et ses succès par message.
- **Tutoriel** : aucun succès ne s'y débloque, sauf « Bon élève » et « Curieux ».

## Les Écailles : ce qu'une partie rapporte

Une partie moyenne rapporte 40 à 80 Écailles, une victoire en Difficile environ 300. Le détail s'affiche sur l'écran de fin de partie.

| Source | Gain |
| --- | --- |
| Longueur atteinte | 1 par 5 segments |
| Ennemis tués | 1 par 5 ennemis |
| Boss vaincu | 20 chacun |
| Pomme en or mangée | 3 chacune |
| Victoire (longueur 400) | 50 |
| Succès débloqué (une seule fois) | 10, 25 ou 50 selon sa difficulté |
| Multiplicateur de difficulté | Facile ×1, Normal ×1,25, Difficile ×1,5 |

- Une partie perdue rapporte quand même : c'est ce qui donne envie de relancer.
- Une partie de moins de 10 secondes ne rapporte rien (pas de « farm » en relançant).
- Les chiffres sont un point de départ, vérifiés par simulation à l'étape 2.

## La Boutique : ce qui se débloque

Une liste par onglets plutôt qu'un arbre : plus simple, et lisible à la manette et au doigt. Elle s'ouvre depuis le menu ☰ et l'écran de fin, jamais en pleine partie.

### Améliorations permanentes

| Amélioration | Effet par niveau | Niveaux | Prix |
| --- | --- | --- | --- |
| ❤️ Cœur de réserve | +1 cœur au départ | 1 | 400 |
| ⏳ Buffs prolongés | +10 % de durée des buffs | 3 | 100 / 200 / 300 |
| 🛡️ Bouclier rapide | −10 % de recharge du bouclier | 3 | 80 / 160 / 240 |
| 🔵 Pomme bleue | +1 point de % de chance | 2 | 150 / 300 |
| 🧲 Aimant | les pommes proches glissent vers la tête | 2 | 120 / 240 |
| 🔫 Balles rapides | +15 % de vitesse des tirs | 2 | 150 / 300 |
| 🪙 Avarice | +10 % d'Écailles gagnées | 3 | 100 / 200 / 300 |

Total : 3 340 Écailles, environ 50 parties.

### Buffs à débloquer

Un nouveau joueur n'a que Points ×2 : la pomme bleue donne donc toujours ce buff au début. Les 5 autres s'achètent : Gel (100), Invincibilité (150), Tourelle laser (150), Auto-visée (150), Explosion générale (250), soit 800 Écailles.

### Thèmes et skins d'ennemis

- **Thèmes de départ** : Néon, Espace, Océan.
- **Thèmes achetés en Écailles**, 300 chacun : Lave, Aurore glacée, Forêt enchantée, Désert, Synthwave, Halloween (6 thèmes, 1 800 Écailles).
- **Skins de départ** : Oursin, Fantôme, Pixel.
- **Skins gagnés par les succès** (jamais par « Bestiaire » ni « Boss de chaque espèce », qui demandent d'avoir affronté tous les skins) :
  - 🟢 Slime : « Ça pousse » · 🦇 Chauve-souris : « Tueur de géant » · 🪼 Méduse : « Boa »
  - 🦀 Crabe : « Chasseur » · 🎃 Citrouille : « Increvable » · 🍄 Champignon : « Gourmand »
  - 👁️ Œil volant : « Collectionneur de trophées » · 🤖 Drone : « Gros bras » · 🕷️ Araignée : « Hardcore »
- Ce qui est verrouillé reste visible, grisé avec un cadenas et ce qu'il faut faire.

Tout compris (améliorations, buffs, thèmes), environ 5 940 Écailles, soit 80 parties.

## Le menu des buffs devient l'Arsenal

- **Quand** : entre deux parties seulement, plus pendant la pause. Le bouton « 🧪 Buffs » devient « 🛒 Boutique ».
- **Quoi** : buffs et améliorations débloqués, chacun avec son interrupteur (couper un buff fait tomber plus souvent les autres).
- **Bouclier et sprint** restent coupables : le succès « À l'ancienne » en dépend.
- **Collision entre joueurs** part dans ⚙️ Options : c'est une règle de la coop, pas un bonus.
- **Rembourser** : rend toutes les Écailles des améliorations pour les répartir autrement.
- **Outil de dev** : l'adresse `?dev` débloque tout, sans gagner d'Écailles ni de succès, pour tester.

Succès : ils rapportent des Écailles au premier déblocage et donnent les nouveaux skins. Les succès « Touriste », « Bestiaire », etc. passeront à 8 thèmes et 9 skins, avec rattrapage pour ceux qui les ont déjà. Quelques nouveaux succès : « Premier achat », « Amélioration au maximum », « 1 000 Écailles gagnées », « Boutique vidée ».

## Coop, en ligne, tutoriel, équilibrage, sauvegarde

- **Coop locale** : un seul portefeuille ; les améliorations valent pour les deux serpents.
- **En ligne** : les améliorations de l'hôte s'appliquent ; à la fin, l'hôte envoie le gain à l'invité, comme pour les succès.
- **Tutoriel** : aucune amélioration ni Écaille, sauf 50 à la fin. La Boutique est présentée après la première vraie partie.
- **Équilibrage** : améliorations plafonnées pour que Difficile reste difficile ; une petite icône dans les meilleurs scores quand des améliorations étaient actives.
- **Sauvegarde** : nouvelle clé `snakeProgression`, écrite à chaque fin de partie et chaque achat.
- **Protection contre la perte** : copie de la sauvegarde précédente ; Exporter / Importer dans ⚙️ Options ; demande de stockage persistant au navigateur ; sur iPhone, une astuce invite à installer le jeu sur l'écran d'accueil (Safari efface sinon après 7 jours sans visite).
- **Joueurs actuels** : ils reçoivent les Écailles de leurs succès déjà obtenus et gardent les 4 thèmes, 5 skins et 6 buffs d'aujourd'hui.

## Réglages : tout l'équilibrage au même endroit

Tous les chiffres de la partie rogue-lite vivent dans un seul objet `reglagesProgression`, en haut de js/03-progression.js. Changer un prix ou un gain, c'est changer un nombre à cet endroit, sans toucher au reste du code.

```js
const reglagesProgression = {
  gains: {parSegments: 5, parEnnemis: 5, boss: 20, pommeOr: 3, victoire: 50,
          dureeMinSecondes: 10, succes: {facile: 10, moyen: 25, dur: 50}},
  multiplicateurDifficulte: {facile: 1, normal: 1.25, difficile: 1.5},
  depart: {themes: ['neon', 'espace', 'ocean'], skins: ['urchin', 'ghost', 'pixel'], buffs: ['doublepoints']},
  buffs: {freeze: 100, invincible: 150, laser: 150, autoaim: 150, explode: 250},
  themes: {lave: 300, aurore: 300, foret: 300, desert: 300, synthwave: 300, halloween: 300},
  skinsParSucces: {slime: 'ca_pousse', bat: 'tueur_geant', jelly: 'boa', crab: 'chasseur', pumpkin: 'increvable',
                   mushroom: 'gourmand', eye: 'trophees', drone: 'gros_bras', spider: 'hardcore'},
  ameliorations: {
    coeur:      {effet: 1,    prix: [400]},
    dureeBuffs: {effet: 0.10, prix: [100, 200, 300]},
    bouclier:   {effet: 0.10, prix: [80, 160, 240]},
    pommeBleue: {effet: 0.01, prix: [150, 300]},
    aimant:     {effet: 30,   prix: [120, 240]},
    cadence:    {effet: 0.10, prix: [150, 300]},
    avarice:    {effet: 0.10, prix: [100, 200, 300]}
  }
};
```

- Ajouter un niveau à une amélioration = ajouter un prix à sa liste. Rendre un contenu gratuit = le mettre dans `depart`.
- Le jeu ne lit ces valeurs que par deux fonctions (`gainPartie()` et `bonusProgression(cle)`), donc un réglage ne peut pas être oublié à un endroit.
- En mode `?dev`, un petit panneau permet de se donner des Écailles, de tout débloquer ou de repartir de zéro, pour tester un réglage en quelques secondes.
- Un script `outils/simu_progression.py` lit le même objet et affiche combien de parties il faut pour tout débloquer selon la difficulté, pour vérifier un changement avant de le livrer.

## Étapes livrables, dans l'ordre

1. ✅ **Fondations** : l'objet `reglagesProgression`, sauvegarde, copie de secours, migration, export/import, calcul et affichage des Écailles. Rien ne s'achète encore. Risque faible.
2. ✅ **Boutique et améliorations** : l'écran, les 7 améliorations, le remboursement, le panneau `?dev` et le script de simulation. Risque : l'équilibrage.
3. ✅ **Arsenal** : menu des buffs hors partie, 5 buffs à débloquer (seul Points ×2 au départ), collision vers Options, mode `?dev`. Risque : tests existants à adapter.
4. ✅ **Thèmes et skins verrouillés** : 3 thèmes et 3 skins au départ, branché sur le travail de l'autre fil, cadenas, skins par succès. Risque : dépend de l'autre fil.
5. ✅ **En ligne et tutoriel** : gain de l'invité, tutoriel neutre, astuce de présentation. Risque : test à deux appareils.

Plus tard : un mode « Malédiction » (plus dur, plus d'Écailles) et de nouveaux buffs.


## État (19 octobre)

Les 5 étapes sont codées (PR #11). « Cadence » est devenue « Balles rapides » : le tir manuel n'a pas de cadence limitée, seule la vitesse des balles compte. Simulation actuelle (`node outils/simu_progression.js`) : améliorations en 40 à 47 parties, tout en 74 (Facile) à 92 parties (Difficile).
