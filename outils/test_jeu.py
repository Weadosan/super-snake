#!/usr/bin/env python3
"""Test rapide du jeu dans Chromium headless : démarrage, déplacements, tir, pause,
mode 2 joueurs s'il existe. Échoue s'il y a une erreur JavaScript dans la console.
Usage : python3 test_jeu.py chemin/vers/snake.html [dossier_captures]"""
import sys, os
from playwright.sync_api import sync_playwright

CHROME = os.environ.get('CHROME_PATH') or next((c for c in ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'] if os.path.exists(c)), None)  # sinon : Chromium installé par Playwright
fichier = os.path.abspath(sys.argv[1])
captures = sys.argv[2] if len(sys.argv) > 2 else None
erreurs = []

def capture(page, nom):
    if captures:
        os.makedirs(captures, exist_ok=True)
        page.locator('#game').screenshot(path=os.path.join(captures, nom + '.png'))

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=CHROME)
    page = nav.new_page()
    page.on('pageerror', lambda e: erreurs.append('pageerror: ' + str(e)))
    page.on('console', lambda m: erreurs.append('console: ' + m.text) if m.type == 'error' else None)
    page.goto('file://' + fichier)
    page.wait_for_timeout(500)
    capture(page, 'solo_tuto')

    # --- solo ---
    page.keyboard.press('Space')
    page.wait_for_timeout(3000)  # compte à rebours
    page.mouse.move(300, 300)
    for touche in ['ArrowDown', 'ArrowLeft', 'ArrowUp', 'KeyD', 'KeyS']:
        page.keyboard.press(touche)
        page.wait_for_timeout(350)
    page.evaluate('score = 50')
    page.locator('#game').click(position={'x': 50, 'y': 50})
    page.keyboard.down('Space'); page.wait_for_timeout(300); page.keyboard.up('Space')
    page.keyboard.press('Shift')
    page.wait_for_timeout(300)
    capture(page, 'solo_jeu')
    page.keyboard.press('KeyP'); page.wait_for_timeout(200); page.keyboard.press('KeyP')
    etat = page.evaluate('({long: snake.length, vies: lives, fini: gameOver, score})')
    print('solo :', etat)
    page.evaluate('lives = 1; endGame()')
    page.wait_for_timeout(900)
    capture(page, 'solo_gameover')

    # --- coop, si le mode existe ---
    if page.evaluate("typeof changerModeJeu === 'function'"):
        page.evaluate("changerModeJeu('coop')")
        page.wait_for_timeout(300)
        capture(page, 'coop_tuto')
        page.keyboard.press('Space')
        page.wait_for_timeout(3000)
        for t1, t2 in [('KeyS', 'ArrowUp'), ('KeyA', 'ArrowRight'), ('KeyW', 'ArrowDown')]:
            page.keyboard.press(t1); page.keyboard.press(t2)
            page.wait_for_timeout(350)
        page.evaluate('score = 50')
        page.keyboard.press('Enter')          # tir J2 (visée auto)
        page.keyboard.press('ShiftRight')     # bouclier J2
        page.keyboard.down('ControlRight'); page.wait_for_timeout(300); page.keyboard.up('ControlRight')
        page.wait_for_timeout(500)
        capture(page, 'coop_jeu')
        etat = page.evaluate('joueurs.map(j => ({long: j.snake.length, vies: j.lives, elimine: j.elimine}))')
        print('coop :', etat, 'score', page.evaluate('score'))
        # endurance : buffs pour chacun, boss, pommes mobiles, rollback, touches au hasard
        page.evaluate("""(() => {
          joueurs.forEach(j => { j.lives = 9; });
          score = 500;
          ['laser', 'autoaim', 'invincible', 'doublepoints'].forEach(b => avecJoueur(joueurs[1], () => applyRandomBuff(100, 100, b)));
          avecJoueur(joueurs[0], () => applyRandomBuff(200, 200, 'freeze'));
          spawnBoss();
          dropBossLoot(200, 200);
          spawnHeartPickup();
          for (let i = 0; i < 6; i++) spawnEnemy();
        })()""")
        import random
        random.seed(1)
        touches = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'ShiftLeft', 'ShiftRight']
        for i in range(60):
            page.keyboard.press(random.choice(touches))
            if i % 10 == 0:
                page.locator('#game').click(position={'x': random.randint(10, 390), 'y': random.randint(10, 390)})
            if i == 30:
                page.evaluate("avecJoueur(joueurs[1], () => tryRollback())")
            page.wait_for_timeout(120)
        capture(page, 'coop_endurance')
        print('endurance :', page.evaluate('({joueurs: joueurs.map(j => [j.snake.length, j.lives, j.elimine, j.ennemis, j.pommes]), score, gameOver, tirs: stats.shotsFired})'))
        page.evaluate("init()")
        page.keyboard.press('Space'); page.wait_for_timeout(3000)
        # J2 éliminé, puis réanimé par un cœur ramassé par J1
        page.evaluate("joueurs[1].lives = 1; avecJoueur(joueurs[1], () => eliminerJoueur())")
        page.wait_for_timeout(200)
        capture(page, 'coop_j2_elimine')
        print('après élimination J2 :', page.evaluate('[joueurs[1].elimine, gameOver]'))
        page.evaluate("avecJoueur(joueurs[0], () => ramasserCoeur(100, 100))")
        page.wait_for_timeout(300)
        print('après cœur :', page.evaluate('[joueurs[1].elimine, joueurs[1].lives, joueurs[1].snake.length]'))
        page.evaluate("joueurs.forEach(j => avecJoueur(j, () => eliminerJoueur()))")
        page.wait_for_timeout(900)
        print('fin coop :', page.evaluate('gameOver'))
        capture(page, 'coop_gameover')
        page.evaluate("changerModeJeu('solo')")

    nav.close()

if erreurs:
    print('\n'.join(erreurs))
    sys.exit(1)
print('OK : aucune erreur console')
