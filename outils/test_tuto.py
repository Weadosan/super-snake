#!/usr/bin/env python3
"""Test du tutoriel guidé, de l'écran d'aide et des astuces dans Chromium headless.
Le tutoriel est joué de bout en bout : chaque étape est réussie en simulant le joueur
(touches, clics, objets amenés sur la tête du serpent). Échoue s'il y a une erreur console
ou si une étape ne passe pas.
Usage : python3 test_tuto.py chemin/vers/snake.html [dossier_captures]"""
import sys, os
from playwright.sync_api import sync_playwright

CHROME = os.environ.get('CHROME_PATH') or next((c for c in ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'] if os.path.exists(c)), None)  # sinon : Chromium installé par Playwright
fichier = os.path.abspath(sys.argv[1])
captures = sys.argv[2] if len(sys.argv) > 2 else None
erreurs = []

def capture(page, nom, plein=False):
    if captures:
        os.makedirs(captures, exist_ok=True)
        chemin = os.path.join(captures, nom + '.png')
        if plein:
            page.screenshot(path=chemin)
        else:
            page.locator('#game').screenshot(path=chemin)

# amène un objet (pomme, cœur, ennemi) sur la tête du serpent
SUR_TETE = "o => { const t = snake[0]; o.x = t.x * gridSize + gridSize / 2; o.y = t.y * gridSize + gridSize / 2; }"

def etape(page):
    return page.evaluate("tuto && tuto.etape ? tuto.etape.cle : null")

def attendre_etape_suivante(page, cle, action, essais=40):
    for _ in range(essais):
        if etape(page) != cle:
            return
        action()
        page.wait_for_timeout(250)
    raise AssertionError("l'étape « %s » ne passe pas : %s" % (cle, page.evaluate(
        "({cle: tuto && tuto.etape.cle, progres: tuto && tuto.etape.progres(tuto), reussi: tuto && tuto.reussiA})")))

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=CHROME)
    page = nav.new_page(viewport={'width': 1100, 'height': 820})
    page.on('pageerror', lambda e: erreurs.append('pageerror: ' + str(e)))
    page.on('console', lambda m: erreurs.append('console: ' + m.text) if m.type == 'error' else None)
    page.goto('file://' + fichier)
    page.wait_for_timeout(500)
    capture(page, 'depart_invitation_tuto')

    # --- écran d'aide : chaque page, ouvert avec H, fermé avec Échap ---
    page.keyboard.press('KeyH')
    page.wait_for_timeout(200)
    assert page.evaluate('aideOuverte'), "H n'ouvre pas l'aide"
    for i in range(6):
        page.wait_for_timeout(150)
        capture(page, 'aide_page_%d' % (i + 1), plein=True)
        page.keyboard.press('ArrowRight')
    assert page.evaluate('pageAide') == 0, 'les flèches ne font pas le tour des pages'
    page.keyboard.press('Space')  # ne doit pas lancer la partie derrière l'aide
    assert page.evaluate('waitingToStart'), "Espace a lancé la partie derrière l'aide"
    page.keyboard.press('Escape')
    assert not page.evaluate('aideOuverte'), "Échap ne ferme pas l'aide"
    # bouton ❓ du plateau
    page.click('#aideBtn')
    assert page.evaluate('aideOuverte'), "le bouton ❓ n'ouvre pas l'aide"
    page.click('#aideFermer')

    # --- l'aide met en pause une partie en cours et la relance en se fermant ---
    page.keyboard.press('Space')
    page.wait_for_timeout(3000)
    page.keyboard.press('KeyH')
    assert page.evaluate('isPaused'), "l'aide ne met pas la partie en pause"
    page.keyboard.press('KeyH')
    assert not page.evaluate('isPaused'), "la partie ne reprend pas à la fermeture de l'aide"

    # --- astuces : la première bulle (tir) apparaît en partie, une seule fois ---
    page.wait_for_timeout(300)
    print('astuce :', page.evaluate('astuceEnCours && astuceEnCours.cle'))
    capture(page, 'astuce_tir')
    # les autres astuces (ennemi résistant tiré au hasard...) sont marquées vues pour tester celle-ci
    page.evaluate("astucesVues = astuces.map(a => a.cle).filter(c => c !== 'pommeOr'); goldenApples.push({x: 300, y: 100, vx: 0.02, vy: 0.01, radius: goldenAppleRadius, changeDirTimer: 9999}); astuceEnCours = null; finDerniereAstuce = 0")
    page.wait_for_timeout(400)
    print('astuce :', page.evaluate('astuceEnCours && astuceEnCours.cle'))
    capture(page, 'astuce_pomme_or')
    vues = page.evaluate('astucesVues.slice()')
    assert 'tir' in vues and 'pommeOr' in vues, 'astuces non mémorisées : %s' % vues
    page.evaluate('lives = 1; endGame()')
    page.wait_for_timeout(900)

    # --- tutoriel, lancé avec T depuis l'écran de fin, en coop pour vérifier le retour au mode choisi ---
    page.evaluate("changerModeJeu('coop')")
    page.keyboard.press('KeyT')
    page.wait_for_timeout(200)
    assert page.evaluate('tutoActif() && !enCoop()'), 'le tutoriel ne démarre pas en solo'
    capture(page, 'tuto_compte_a_rebours')
    page.wait_for_timeout(3000)
    print('étapes :', page.evaluate('tuto.etapes.map(e => e.cle).join(" > ")'))

    def virages():
        for t in ['ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowRight']:
            page.keyboard.press(t)
            page.wait_for_timeout(260)
    capture(page, 'tuto_1_bouger')
    attendre_etape_suivante(page, 'bouger', virages)

    page.wait_for_timeout(1500)
    capture(page, 'tuto_2_manger')
    attendre_etape_suivante(page, 'manger', lambda: page.evaluate(
        "food = caseLibreProche(Math.max(0, Math.min(tileCount - 1, snake[0].x + direction.x)), Math.max(0, Math.min(tileCount - 1, snake[0].y + direction.y)))"))

    page.wait_for_timeout(1500)
    capture(page, 'tuto_3_tirer')
    attendre_etape_suivante(page, 'tirer', lambda: page.evaluate(
        "if (enemies[0]) { mouseX = enemies[0].x; mouseY = enemies[0].y; tenterTir(); }"))

    page.wait_for_timeout(1500)
    capture(page, 'tuto_4_bouclier')
    page.keyboard.press('Shift')
    page.wait_for_timeout(100)
    attendre_etape_suivante(page, 'bouclier', lambda: (
        page.evaluate("if (performance.now() >= shieldActiveUntil) activerBouclier()"),
        page.evaluate("if (enemies[0]) (" + SUR_TETE + ")(enemies[0])")))

    page.wait_for_timeout(1500)
    capture(page, 'tuto_5_boost')
    def boost():
        page.keyboard.down('Space'); page.wait_for_timeout(700); page.keyboard.up('Space')
    attendre_etape_suivante(page, 'boost', boost)

    page.wait_for_timeout(1500)
    capture(page, 'tuto_6_pomme_bleue')
    attendre_etape_suivante(page, 'pommeBleue', lambda: page.evaluate("if (blueApples[0]) (" + SUR_TETE + ")(blueApples[0])"))

    page.wait_for_timeout(1500)
    capture(page, 'tuto_7_briser')
    attendre_etape_suivante(page, 'briser', lambda: page.evaluate("if (enemies[0]) (" + SUR_TETE + ")(enemies[0])"))
    assert page.evaluate('freezeIndicatorUntil') == 0, 'le gel du tutoriel ne s\'arrête pas'

    page.wait_for_timeout(1500)
    capture(page, 'tuto_8_pomme_or')
    attendre_etape_suivante(page, 'pommeOr', lambda: page.evaluate("if (goldenApples[0]) (" + SUR_TETE + ")(goldenApples[0])"))

    page.wait_for_timeout(1500)
    capture(page, 'tuto_9_coeur')
    attendre_etape_suivante(page, 'coeur', lambda: page.evaluate("if (heartPickup) (" + SUR_TETE + ")(heartPickup)"))

    page.wait_for_timeout(1500)
    capture(page, 'tuto_10_rollback')
    attendre_etape_suivante(page, 'rollback', lambda: page.locator('#game').click(button='right', position={'x': 200, 'y': 200}))

    page.wait_for_timeout(1500)
    page.wait_for_timeout(2000)  # annonce du boss
    capture(page, 'tuto_11_boss')
    attendre_etape_suivante(page, 'boss', lambda: page.evaluate(
        "{ const b = enemies.find(e => e.isBoss); if (b) { lives = 3; invulnerableUntil = performance.now() + 2000; mouseX = b.x; mouseY = b.y; tenterTir(); } }"))
    print('boss battu, score', page.evaluate('score'))

    page.wait_for_timeout(1500)
    capture(page, 'tuto_12_fin')
    assert etape(page) == 'fin', 'pas d\'étape finale'
    page.wait_for_timeout(6500)
    etat = page.evaluate("({tuto: tutoActif(), depart: waitingToStart, coop: enCoop(), fait: localStorage.getItem('snakeTutoFait')})")
    print('après le tutoriel :', etat)
    assert etat == {'tuto': False, 'depart': True, 'coop': True, 'fait': 'oui'}, 'mauvais retour après le tutoriel'
    capture(page, 'depart_apres_tuto')

    # --- on ne perd pas pendant le tutoriel ; T le quitte ---
    page.evaluate("changerModeJeu('solo')")
    page.keyboard.press('KeyT')
    page.wait_for_timeout(3200)
    page.evaluate("lives = 1; eliminerJoueur()")
    page.wait_for_timeout(200)
    assert page.evaluate('!gameOver && lives === 3 && tutoActif()'), 'le tutoriel a été perdu'
    page.evaluate("snake[0].x = tileCount - 1; nextDirection = {x: 1, y: 0}; direction = {x: 1, y: 0}")
    page.wait_for_timeout(600)
    assert page.evaluate('!gameOver && tutoActif()'), 'un mur a fini le tutoriel'
    page.keyboard.press('KeyT')
    assert page.evaluate('!tutoActif() && waitingToStart'), 'T ne quitte pas le tutoriel'
    # le bouton du menu ☰
    page.click('#optionsBtn')
    page.click('#tutoBtn')
    assert page.evaluate('tutoActif()'), 'le bouton Tutoriel du menu ne lance rien'
    page.evaluate('changerDifficulte()')  # relancer une partie arrête le tutoriel
    assert page.evaluate('!tutoActif()'), 'changer de difficulté n\'arrête pas le tutoriel'
    page.evaluate("changerDifficulte('normal')")

    # --- tactile et manette : textes adaptés ---
    page.evaluate("definirModeEntree('manette'); lancerTuto()")
    page.wait_for_timeout(3100)
    capture(page, 'tuto_manette')
    page.evaluate("quitterTuto(false); modeEntree = 'tactile'; ouvrirAide(0)")
    page.wait_for_timeout(200)
    capture(page, 'aide_tactile', plein=True)
    page.evaluate('fermerAide()')
    nav.close()

if erreurs:
    print('\n'.join(erreurs))
    sys.exit(1)
print('OK : tutoriel complet, aide et astuces sans erreur console')
