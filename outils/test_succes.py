#!/usr/bin/env python3
"""Succès : déblocages en jouant, bannière, écran 🏆, rappel de fin de partie, sauvegarde,
rien pendant le tutoriel, réinitialisation. Échoue s'il y a une erreur JavaScript dans la console.
Usage : python3 test_succes.py chemin/vers/snake.html [dossier_captures]"""
import sys, os
from playwright.sync_api import sync_playwright

CHROME = os.environ.get('CHROME_PATH') or next((c for c in ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'] if os.path.exists(c)), None)  # sinon : Chromium installé par Playwright
fichier = os.path.abspath(sys.argv[1])
captures = sys.argv[2] if len(sys.argv) > 2 else None
erreurs = []
echecs = []

def verifier(cond, texte, detail=''):
    print(('OK   ' if cond else 'ÉCHEC ') + texte + (' ' + str(detail) if detail != '' else ''))
    if not cond:
        echecs.append(texte)

def capture(page, nom, plateau=False):
    if captures:
        os.makedirs(captures, exist_ok=True)
        cible = page.locator('#game') if plateau else page
        cible.screenshot(path=os.path.join(captures, nom + '.png'))

def obtenus(page):
    return page.evaluate('Object.keys(succesSauves.obtenus)')

def recentrer(page):
    # serpent replacé au centre, vers la droite, sans ennemi autour : il ne touche ni mur ni ennemi pendant la vérification
    page.evaluate("snake = [{x: 6, y: 10}, {x: 5, y: 10}, {x: 4, y: 10}]; direction = {x: 1, y: 0}; nextDirection = {x: 1, y: 0}; enemies = []")

def demarrer(page):
    page.keyboard.press('Space')
    page.wait_for_timeout(3000)  # compte à rebours

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=CHROME)
    page = nav.new_page(viewport={'width': 1100, 'height': 900})
    page.on('pageerror', lambda e: erreurs.append('pageerror: ' + str(e)))
    page.on('console', lambda m: erreurs.append('console: ' + m.text) if m.type == 'error' else None)
    page.on('dialog', lambda d: d.accept())
    page.goto('file://' + fichier)
    page.evaluate("localStorage.clear(); localStorage.setItem('snakeTutoFait', 'oui'); localStorage.setItem('snakeAstuces', 'non')")
    page.reload()
    page.wait_for_timeout(400)

    # --- début de partie : compteur de parties, thème joué ---
    demarrer(page)
    c = page.evaluate('succesSauves.cumul')
    verifier(c['parties'] == 1 and c['themesJoues'] == ['neon'], 'début de partie compté', (c['parties'], c['themesJoues']))

    # --- pomme placée devant la tête ---
    recentrer(page)
    page.evaluate("food = {x: snake[0].x + 1, y: snake[0].y}; direction = {x: 1, y: 0}; nextDirection = {x: 1, y: 0}")
    page.wait_for_timeout(500)
    verifier('premier_repas' in obtenus(page), 'Premier repas en mangeant une pomme')
    page.wait_for_timeout(150)
    verifier(page.locator('.succes-banniere.visible').count() >= 1, 'bannière affichée')
    capture(page, 'succes_banniere')

    # --- ennemi tué par un tir réel ---
    recentrer(page)
    page.evaluate("""() => {
      score = 100;
      const t = turretPixelPos;
      enemies = [{x: t.x + 60, y: t.y, vx: 0, vy: 0, speedFactor: 0, radius: enemyRadius, changeDirTimer: 99999,
                  hp: 1, maxHp: 1, color: '#f00', hitFlashUntil: 0, neA: 0, phase: 0, frozenUntil: performance.now() + 5000}];
      fireProjectile(0);
    }""")
    page.wait_for_timeout(500)
    verifier('premier_sang' in obtenus(page), 'Premier sang au tir')

    # --- boss vaincu sans perdre de cœur (Normal) ---
    recentrer(page)
    page.evaluate("""() => {
      spawnBoss({x: 60, y: 60});
      const b = enemies.find(e => e.isBoss);
      enemies = enemies.filter(e => e !== b);
      awardEnemyKill(b);
    }""")
    o = obtenus(page)
    verifier(all(i in o for i in ['tueur_geant', 'sans_trembler', 'serieux']), 'boss : Tueur de géant, Sans trembler, Sérieux', o)
    verifier(page.evaluate('succesSauves.cumul.bossSkins') == ['urchin'], 'boss compté pour le skin oursin')

    # --- boss vaincu après un coup reçu : pas de « Sans trembler » cette fois (on remet à zéro pour vérifier) ---
    page.evaluate("""() => {
      delete succesSauves.obtenus.sans_trembler;
      spawnBoss({x: 60, y: 60});
      succesCoeurPerdu();
      const b = enemies.find(e => e.isBoss);
      enemies = enemies.filter(e => e !== b);
      awardEnemyKill(b);
    }""")
    verifier('sans_trembler' not in obtenus(page), 'Sans trembler refusé après un cœur perdu')

    # --- longueur 100 : nouvelle partie, serpent en zigzag au bas du plateau, puis un déplacement réel ---
    page.evaluate('init()')
    demarrer(page)
    page.evaluate("""() => {
      const cases = [];
      for (let r = 0; r < 5; r++) {
        const y = 19 - r;
        for (let i = 0; i < 20; i++) cases.push({x: r % 2 === 0 ? i : 19 - i, y});
      }
      snake = cases.reverse(); // tête en (19, 15)
      enemies = [];
      direction = {x: 0, y: -1}; nextDirection = {x: 0, y: -1};
    }""")
    page.wait_for_timeout(400)
    o = obtenus(page)
    verifier(all(i in o for i in ['ca_pousse', 'boa', 'sans_egratignure']), 'Ça pousse, Boa et Sans une égratignure à 100 de long', o)
    verifier(page.evaluate('succesSauves.cumul.themes100') == ['neon'], 'thème néon compté pour Explorateur')

    # --- rollbacks enchaînés (le serpent est replacé au centre pour ne pas toucher un mur) ---
    page.evaluate('init()')
    demarrer(page)
    page.evaluate("lives = 12")
    for _ in range(3):
        page.evaluate("snake = [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}]; direction = {x: 1, y: 0}; nextDirection = {x: 1, y: 0}")
        page.wait_for_timeout(500)
        page.evaluate('rollbackManuel()')
        page.wait_for_timeout(1200)
    o = obtenus(page)
    verifier('retour_futur' in o and 'boucle_temporelle' in o, 'Retour vers le futur et Boucle temporelle', o)

    # --- écran des succès (touche U), qui met en pause ---
    page.keyboard.press('KeyU')
    page.wait_for_timeout(300)
    verifier(page.locator('#succesMenu.ouvert').count() == 1 and page.evaluate('isPaused'), 'écran 🏆 ouvert, partie en pause')
    compte = page.locator('#succesCompte').inner_text()
    verifier(compte.endswith('/ 58 débloqués'), 'compteur de l\'écran', compte)
    verifier(page.locator('.succes-carte').count() == 58, '58 cartes', page.locator('.succes-carte').count())
    verifier('???' in page.locator('#succesContenu').inner_text(), 'succès secret caché')
    capture(page, 'succes_ecran')
    page.keyboard.press('Escape')
    page.wait_for_timeout(200)
    verifier(page.locator('#succesMenu.ouvert').count() == 0 and not page.evaluate('isPaused'), 'écran fermé, partie relancée')

    # --- mort rapide : Première chute, Kamikaze et rappel sous les stats ---
    page.evaluate('init()')
    demarrer(page)
    page.evaluate('score = 50; stats.startTime = performance.now() - 2000; endGame()')
    page.wait_for_timeout(900)
    o = obtenus(page)
    verifier('premiere_chute' in o and 'kamikaze' in o, 'Première chute et Kamikaze', o)
    recap = page.locator('#statsSucces').inner_text()
    verifier('Kamikaze' in recap and 'Première chute' in recap, 'rappel des succès sous les stats', recap.replace('\n', ' | ')[:120])
    capture(page, 'succes_game_over', plateau=True)
    page.wait_for_timeout(500)
    verifier('podium' in obtenus(page), 'Podium (premier score enregistré)')

    # --- sauvegarde après rechargement ---
    avant = sorted(obtenus(page))
    page.reload()
    page.wait_for_timeout(400)
    verifier(sorted(obtenus(page)) == avant, 'succès gardés après rechargement', len(avant))

    # --- rien pendant le tutoriel ---
    page.evaluate("delete succesSauves.obtenus.premier_repas; sauverSucces()")
    pommes = page.evaluate('succesSauves.cumul.pommes')
    page.keyboard.press('KeyT')
    page.wait_for_timeout(3500)
    page.evaluate("food = {x: snake[0].x + 1, y: snake[0].y}")
    page.wait_for_timeout(900)
    verifier(page.evaluate('tutoActif()') and page.evaluate('stats.applesEaten') >= 1, 'pomme mangée pendant le tutoriel')
    verifier('premier_repas' not in obtenus(page) and page.evaluate('succesSauves.cumul.pommes') == pommes,
             'aucun succès ni compteur pendant le tutoriel')
    page.keyboard.press('KeyT')
    page.wait_for_timeout(300)

    # --- message en ligne invalide ignoré ---
    page.evaluate("debloquerSucces('constructor', true); debloquerSucces('__proto__', true)")
    verifier(len(obtenus(page)) == len(avant) - 1, 'identifiants inconnus ignorés')

    # --- coop : Duo au départ ---
    page.evaluate("changerModeJeu('coop')")
    page.wait_for_timeout(200)
    demarrer(page)
    verifier('duo' in obtenus(page), 'Duo en coop')

    # --- réinitialisation ---
    page.keyboard.press('KeyU')
    page.wait_for_timeout(200)
    page.click('#succesReinitialiser')
    page.wait_for_timeout(200)
    verifier(obtenus(page) == [] and page.locator('#succesCompte').inner_text().startswith('0 / 58'), 'réinitialisation')
    page.click('#succesFermer')

    # --- téléphone : écran lisible sans défilement horizontal ---
    tel = nav.new_page(viewport={'width': 390, 'height': 800}, has_touch=True, is_mobile=True)
    tel.on('pageerror', lambda e: erreurs.append('pageerror (tél): ' + str(e)))
    tel.goto('file://' + fichier)
    tel.wait_for_timeout(400)
    tel.evaluate("succesSauves.obtenus.boa = Date.now(); succesSauves.cumul.ennemis = 340; ouvrirSucces()")
    tel.wait_for_timeout(300)
    largeur = tel.evaluate("document.getElementById('succesPanel').getBoundingClientRect().width")
    verifier(largeur <= 390, 'panneau tenant dans un téléphone', round(largeur))
    if captures:
        tel.screenshot(path=os.path.join(captures, 'succes_telephone.png'))

    nav.close()

for e in erreurs:
    print(e)
if erreurs or echecs:
    print('ÉCHEC :', len(echecs), 'vérification(s),', len(erreurs), 'erreur(s) console')
    sys.exit(1)
print('OK : succès sans erreur console')
