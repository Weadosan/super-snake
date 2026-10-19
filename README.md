# Super Snake

Jeu de snake arcade, à jouer ici : https://weadosan.github.io/super-snake/

Sur téléphone : ouvrir le lien, puis « Ajouter à l'écran d'accueil » pour l'avoir comme une appli (marche aussi hors connexion).

## Organisation du dépôt

- `index.html`, `sw.js`, `manifest.webmanifest`, icônes, `trystero.min.js` : le jeu publié (GitHub Pages sert la racine de `main`). Ne pas les modifier à la main.
- `src/` : le code du jeu (page, CSS, modules JavaScript numérotés, polices).
- `build.js` : assemble `src/` en un seul fichier `snake.html`.
- `outils/` : tests automatiques, simulation de la progression, script de publication.
- `plans/` : plans et idées. `LISEZMOI.md` : le détail du code, module par module.

## Construire le jeu

Il faut Node.js (aucune dépendance à installer).

    node build.js                           # écrit snake.html, à ouvrir dans un navigateur

## Lancer les tests

Il faut Python 3 et Playwright (`pip install playwright`, puis `python -m playwright install chromium`).
Chaque test prend le fichier construit et échoue s'il voit une erreur JavaScript.

    python3 outils/test_jeu.py snake.html
    python3 outils/test_manettes.py snake.html
    python3 outils/test_collision.py snake.html
    python3 outils/test_tuto.py snake.html
    python3 outils/test_succes.py snake.html
    python3 outils/test_icones.py snake.html
    python3 outils/test_options.py snake.html
    python3 outils/test_progression.py snake.html
    python3 outils/test_skins_serpent.py snake.html
    node outils/simu_progression.js         # rythme de la progression (Écailles) selon la difficulté

Ajouter un dossier en second argument d'un test (`… snake.html captures`) y enregistre des captures d'écran.
Pour utiliser un autre Chrome / Chromium : variable `CHROME_PATH`.

## Publier une nouvelle version

    node build.js
    node outils/publier.js snake.html .     # met à jour index.html et sw.js à la racine

Puis commit et PR vers `main` : le site se met à jour à la fusion.
