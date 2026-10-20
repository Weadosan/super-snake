# Super Snake : organisation du code

Le jeu se modifie dans `src/`, puis on régénère le fichier unique `snake.html` :

    node build.js                                   # écrit snake.html (autonome, aucune dépendance)
    python3 outils/test_jeu.py snake.html [captures] # solo + coop dans Chromium, 0 erreur console attendue
    python3 outils/test_manettes.py snake.html       # coop : une manette simulée pilote J2, le clavier J1
    python3 outils/test_collision.py snake.html      # option collision entre joueurs (coupée / activée)
    python3 outils/compare_solo.py ancien.html snake.html  # même partie solo rejouée sur les deux fichiers
    python3 outils/test_tuto.py snake.html [captures]  # tutoriel joué en entier, écran d'aide, astuces
    python3 outils/test_succes.py snake.html [captures] # succès : déblocages, bannière, écran 🏆, sauvegarde
    python3 outils/test_icones.py snake.html [captures] # aucun emoji affiché, icônes pixel partout, polices chargées
    python3 outils/test_options.py snake.html [captures] # plateau 1080p/1440p/4K net, menu ⚙️ Options, touches
    python3 outils/test_skins_serpent.py snake.html [captures] # skins du serpent et de la tourelle : achat, choix gardé
    python3 outils/test_artifice.py snake.html [captures] # feu d'artifice de victoire : un style par thème, nombre d'éclats borné
    python3 outils/mesure_fps.py snake.html [--cpu 4] [--gpu] [--detail]  # temps de dessin d'une image, par thème et skin
    python3 outils/compare_rendu.py ancien.html snake.html dossier       # même image dessinée par les deux versions, et l'écart

Rendu rapide sur un vieux PC : les grandes images en mémoire (fond, vignette, décors) ont la finesse exacte de l'écran
et sont posées calées sur ses pixels (`creerCalque` / `poserCalque`, js/01-base.js) ; éviter `shadowBlur` sur un long
trait ou une grande forme (le flou couvre tout son rectangle englobant) : `lueurTrait` (js/08-dessin-serpent.js) imite
la lueur avec trois traits transparents ; et regrouper les petits morceaux d'un même flou en un seul tracé.

Dans le dépôt GitHub, le jeu publié est `index.html` à la racine : voir « Version en ligne » plus bas.

## src/
- `index.html` : la page (HUD, boutons, menus) avec deux marqueurs remplacés par le build.
- `style.css` : tout le CSS.
- `js/` : le script, découpé en modules concaténés dans l'ordre des numéros
  (même portée globale qu'avant, donc l'ordre compte) :
  00 icônes pixel (remplacent les emojis) · 01 base (canvas, éléments du HUD) · 02 thèmes (dont couleurs du J2) · 03 état de la partie et constantes ·
  04 joueurs (solo / coop) · 05 sons · 06 partie (init, HUD, pommes, ennemis, combat) ·
  07 boucle (tick, pause, renderLoop) · 08 dessin du serpent · 09 dessin de la scène, overlays, tutoriels ·
  10 dessin des ennemis et boss · 11 dessin des pommes · 12 décor animé ·
  13 dessin du combat (tourelle, yeux, langue) · 14 fin de partie et meilleurs scores · 15 commandes (clavier, souris) ·
  16 icônes 24 x 24 de la Boutique, Boutique (ancien menu des buffs) · 17 manettes · 18 aide, aperçu, astuces, disposition, options, succès, tactile, tutoriel · 19 démarrage ·
  20 jeu à deux en ligne (code de salle, Trystero).

## Joueurs (04-joueurs.js)
Tout ce qui appartient à un serpent (snake, direction, vies, bouclier, boost, buffs perso, tourelle, visée)
est rangé dans un objet de `joueurs[]`. Les anciens noms (`snake`, `lives`...) restent utilisables : ils
désignent le joueur actif. `avecJoueur(j, fn)` rend `j` actif (avec ses couleurs) le temps de `fn`.
Hors de ces appels, le joueur actif est J1. Le gel et l'explosion restent communs à toute la carte ;
score, pommes, ennemis et cœurs sont partagés.

## Version en ligne
- Jeu : https://weadosan.github.io/super-snake/ (dépôt GitHub Weadosan/super-snake, branche main).
- `node outils/publier.js snake.html .` (depuis la racine du dépôt) écrit le jeu publié à la racine : `index.html` (+ appli téléphone), `sw.js`, `manifest.webmanifest` et `trystero.min.js` (copié de `outils/`). Puis PR vers `main` ; GitHub Pages sert la racine de `main`.
- Jeu à deux en ligne (js/20-en-ligne.js) : l'hôte fait tourner la partie en coop et envoie la vidéo du plateau ; l'invité envoie ses commandes (J2). Mise en relation par Trystero (plusieurs relais Nostr publics à la fois, sans compte) ; relais TURN optionnel via `relaisTurn` (metered.ca).

## Aide et tutoriel (js/18-aide.js, 18-astuces.js, 18-tuto.js)
- Écran d'aide : bouton ❓ à côté de ☰, touche H, LT / L2 à la manette, ou « ❓ Aide » du menu ☰. Six pages
  (commandes selon l'appareil, pommes du thème, ennemis du skin, buffs, survie, modes) ; il met la partie en pause.
- Astuces : une bulle la première fois qu'une chose apparaît (pomme en or, boss, ennemi gelé...), mémorisée dans
  `snakeAstucesVues`. « 💡 Astuces » dans l'aide les coupe, et les rallumer les fait toutes revoir.
- Tutoriel : T sur l'écran de départ, « 🎓 Tutoriel » du menu ☰ ou le bouton de l'aide. Partie solo en 12 étapes
  (`etapesTuto`) qui avancent dès que la consigne est réussie ; pas d'ennemi ni de butin au hasard, et on ne perd
  pas (`tutoSauverJoueur`). `init()` l'arrête et remet le mode Solo / Coop du joueur.

## Succès (js/18-succes.js)
- 58 succès en 10 catégories (`listeSucces`), sauvegardés dans `snakeSucces` : date de chaque succès obtenu et
  compteurs cumulés (ennemis, pommes, thèmes joués, boss par skin...).
- Le jeu les signale par de petits appels (`succesKill`, `succesPomme`, `succesLongueur`, `succesFinPartie`...) ;
  `majSucces` vérifie à chaque image le temps de survie, le score et le sprint.
- Bannière en haut de l'écran au déblocage (avec un son), écran « 🏆 Succès » (menu ☰ ou touche U), rappel sous les
  stats et sur l'écran de game over. Rien pendant le tutoriel, sauf « Bon élève » et « Curieux ».
- En ligne, l'hôte envoie chaque succès gagné à son ami, qui le garde aussi sur son appareil.

## Grand écran et options (js/18-options.js)
- Le jeu calcule toujours sur un plateau de 400 x 400 (`largeurPlateau`, `hauteurPlateau` : ne plus utiliser
  `canvas.width` dans le jeu). Sur ordinateur, le plateau prend toute la hauteur de l'écran (HUD à gauche,
  `body.plateau-large`), et le canvas a autant de pixels que l'écran en affiche (devicePixelRatio compris) :
  `echelleRendu` fois 400, appliqué par `ctx.setTransform` au début de chaque image. Les sprites en mémoire (corps
  du serpent, fond, décor) sont dessinés à `echelleCaches()` pour rester nets. Sur écran tactile, la disposition
  donne la taille, seule la résolution suit. L'hôte en ligne envoie au plus 800 x 800.
- Menu ⚙️ Options : bouton ⚙️ à côté du plateau, « ⚙️ Options » du menu ☰ ou touche O. Volume des effets (il n'y a
  pas de musique), son coupé, plein écran (touche F), taille du plateau (tout l'écran / classique 400 px), qualité
  d'image (haute / moyenne / basse) et toutes les touches du clavier (J1, J2 en coop, menus). Une touche déjà prise
  est échangée. Le tout est gardé dans `snakeOptions`.
- Touches : objet `touches` (e.code) dans js/15-commandes.js, `nomTouche()` et `nomTouchesDirection()` pour les textes.


## Icônes pixel et polices (js/00-icones.js, polices/)
- Les emojis restent dans le code (textes, listes de succès...), mais ne s'affichent plus : chaque emoji connu de
  `EMOJI_ICONE` est remplacé par un dessin 12 x 12 de `DESSINS_ICONES` (une lettre = une couleur de `PALETTE_ICONES`,
  « x » = couleur du texte). Dans la page, un observateur pose des `<i class="px px-nom">` à la place ; sur le canvas,
  `fillText` et `measureText` dessinent et mesurent l'icône. Nouvel emoji dans le code : lui ajouter un dessin (ou une
  variante de couleur / rotation dans `VARIANTES_ICONES`), `test_icones.py` signale ceux qui en manquent.
- Polices libres (SIL OFL 1.1, usage commercial autorisé) : Share Tech Mono (Néon), Exo 2 (Espace), Oswald (Lave et
  Halloween), Alegreya (Océan), Comfortaa (Aurore glacée), MedievalSharp (Forêt enchantée), Cinzel (Désert), Audiowide
  (Synthwave) et Creepster (grands titres d'Halloween, via `fontTitre` / `policeTitre()`). Fichiers woff2 « latin » non modifiés dans `src/polices/`, intégrés en base64 par `build.js` avec
  leur licence (`polices/LICENCES.txt`, recopiée en commentaire dans le HTML). Environ +165 Ko.

## Mondes et skins ajoutés (js/12-mondes.js, js/10-dessin-skins.js)
- Thèmes Aurore glacée, Forêt enchantée, Désert, Synthwave et Halloween : couleurs dans `themes` (02), et tout le reste
  (fond, décor animé, particules, 3 pommes, tirs, couleur du laser) dans un objet par monde de `mondesSupp`. Les
  fonctions de dessin d'origine passent par lui quand le thème y figure.
- Skins Méduse, Œil volant, Drone, Araignée, Crabe, Citrouille, Champignon (`dessinsSkins`, boss dans `dessinerBoss`).
  Le corps plein remplit le cercle de collision ; pattes, tentacules et pinces sont fins et translucides. Sous chaque boss
  (tous skins), `dessinerZoneContactBoss` marque sa zone de contact en pointillés rouges.
- Aperçus (dossier du projet, pas dans le dépôt) : `apercus/nouveaux_themes.png`, `apercus/nouveaux_skins.png`.

## Progression : Écailles et Boutique (js/03-progression.js, js/16-menu-buffs.js, js/18-sauvegarde.js)
- Chaque partie (au moins 10 s, hors tutoriel et écran de l'invité) rapporte des Écailles 🪙 : longueur, ennemis,
  boss, pommes en or, victoire, multipliés selon la difficulté. Chaque succès en rapporte une fois, à son déblocage ;
  les succès obtenus avant les Écailles sont payés au lancement. En ligne, l'hôte envoie le gain à l'invité
  (`{t: 'ecailles'}`).
- Tout l'équilibrage est dans `reglagesProgression` (gains, contenu de départ, prix, améliorations, skins par
  succès). Le jeu le lit par `gainPartie()`, `bonusProgression(cle)` et `contenuDebloque(type, cle)`.
  `node outils/simu_progression.js` dit combien de parties il faut pour tout débloquer.
- Boutique (ancien menu des buffs : « Chez Sifflet » : bouton 🛒 à côté du plateau et dans le menu, touche B, Y / Select ; une étagère par catégorie, l'objet choisi passe sur le comptoir ; flèches ou croix pour se déplacer ; répliques du marchand dans REPLIQUES_SIFFLET et, par objet, REPLIQUES_OBJETS ; il bavarde quand on ne fait rien et réagit quand on le touche ; icônes des étagères dans js/16-icones-boutique.js : formes sur une grille 24 x 24, contour et reflets ajoutés tout seuls, skins dessinés par le jeu puis pixellisés) : 7 améliorations à niveaux, 5 buffs et
  6 thèmes à acheter, skins d'ennemis gagnés par les succès, un interrupteur par amélioration et par buff,
  remboursement des améliorations. Achats seulement entre deux parties (lecture seule en partie). Départ :
  Néon, Espace, Océan ; Oursin, Fantôme, Pixel ; Points x2. Les joueurs qui avaient déjà une sauvegarde gardent
  ce qui existait avant (`ancienJoueur`). Aucune amélioration pendant le tutoriel.
- La collision entre joueurs (règle de la coop) est dans ⚙️ Options.
- `?dev` dans l'adresse : progression à part (`snakeProgression_dev`), tout débloqué, Boutique ouverte en partie,
  boutons +1 000 Écailles et remise à zéro, pas de succès.
- Sauvegarde `snakeProgression` + copie de la version précédente `snakeProgression_prec`, reprise si la principale est
  illisible. Options > 💾 Sauvegarde : exporter / importer un code `SNAKE1:...` qui contient toutes les clés `snake...`
  (l'état d'avant un import reste dans `snakeAvantImport`).
- Test : `outils/test_progression.py`.

## Skins du serpent (js/08-skins-serpent.js)
- `skinsSerpent` : Classique (couleurs du thème) et 7 skins à acheter chez Sifflet, étagère « Skins du serpent » :
  Corail, Tigre, Robot, Dragon, Galaxie, Arc-en-ciel, Roi d'or. Prix dans `reglagesProgression.serpents`
  (achats `serpent:cle` dans la progression). Un skin acheté est porté tout de suite.
- Chaque skin peut changer : la couleur du corps (une couleur ou une suite d'anneaux), la tête, la lueur, le motif
  des segments (`MOTIFS_SERPENT`, dans le sprite de `getBodySprite`), un décor sur la tête (cornes, oreilles,
  antenne, couronne), les yeux (visière du robot) et la traînée (flammes, étoiles, arc-en-ciel, paillettes).
- Choix dans le menu ☰ (« 🐍 Skin du serpent », avec le serpent dans l'aperçu) ou à la Boutique, gardé dans
  `snakeSkinSerpent`. Seul J1 le porte : en coop, J2 garde les couleurs du thème.

## Skins de la tourelle (js/13-skins-tourelle.js)
- `skinsTourelle` : Classique (tourelle du thème, `dessinerTourelleTheme`) et 6 tourelles à acheter chez Sifflet,
  étagère « Tourelles » : Canon de pirate, Arbalète, Tournesol, Gatling, Blaster, Tête de dragon. Prix dans
  `reglagesProgression.tourelles` (achats `tourelle:cle`). Chaque dessin est une fonction de `DESSINS_TOURELLES`.
- `drawTurret` garde la visée et le buff laser, puis appelle `dessinerTourelle`. Choix dans le menu ☰ (« 🔫 Tourelle »,
  visible dans l'aperçu) ou à la Boutique, gardé dans `snakeSkinTourelle`. Seul J1 la porte.
