#!/usr/bin/env python3
"""Plateau à la taille de l'écran (1080p, 1440p, 4K, écran Retina) et menu ⚙️ Options : volume, taille,
qualité, touches modifiées et sauvegardées. Échoue s'il y a une erreur JavaScript dans la console.
Usage : python3 test_options.py chemin/vers/snake.html [dossier_captures]"""
import sys, os
from playwright.sync_api import sync_playwright

CHROME = os.environ.get('CHROME_PATH') or next((c for c in ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'] if os.path.exists(c)), None)  # sinon : Chromium installé par Playwright
fichier = os.path.abspath(sys.argv[1])
captures = sys.argv[2] if len(sys.argv) > 2 else None
erreurs = []

def ouvrir(nav, largeur, hauteur, densite=1):
    page = nav.new_page(viewport={'width': largeur, 'height': hauteur}, device_scale_factor=densite)
    page.on('pageerror', lambda e: erreurs.append('pageerror: ' + str(e)))
    page.on('console', lambda m: erreurs.append('console: ' + m.text) if m.type == 'error' else None)
    page.goto('file://' + fichier)
    page.wait_for_timeout(400)
    return page

def capture(page, nom):
    if captures:
        os.makedirs(captures, exist_ok=True)
        page.screenshot(path=os.path.join(captures, nom + '.png'))

def mesure(page):
    return page.evaluate('''({css: canvas.clientWidth, image: canvas.width, echelle: echelleRendu,
      defile: document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1})''')

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=CHROME)

    # --- taille et netteté du plateau ---
    for l, h, d in [(1920, 1080, 1), (2560, 1440, 1), (3840, 2160, 1), (1920, 1080, 2), (1280, 720, 1)]:
        page = ouvrir(nav, l, h, d)
        m = mesure(page)
        print(f'{l}x{h} @{d} :', m)
        assert m['css'] >= h * 0.9, 'plateau trop petit pour l\'écran'
        assert not m['defile'], 'la page défile'
        assert abs(m['image'] - min(m['css'] * d, 2400)) <= 2, 'image du canvas pas à la résolution de l\'écran'
        # la souris au centre du plateau vise le centre (400 x 400)
        r = page.evaluate('(() => { const r = canvas.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()')
        pos = page.evaluate(f'positionDansCanvas({r[0]}, {r[1]})')
        assert abs(pos['x'] - 200) < 1 and abs(pos['y'] - 200) < 1, pos
        page.keyboard.press('Space'); page.wait_for_timeout(3300)
        capture(page, f'plateau_{l}x{h}_x{d}')
        page.close()

    page = ouvrir(nav, 1920, 1080)
    # --- ouverture : touche O, la partie se met en pause ---
    page.keyboard.press('Space'); page.wait_for_timeout(3300)
    page.keyboard.press('KeyO'); page.wait_for_timeout(200)
    assert page.evaluate('optionsOuvertes && isPaused'), 'O n\'ouvre pas les options en pause'
    capture(page, 'options_ouvert')
    page.keyboard.press('Space')  # ne doit rien faire derrière le panneau
    page.keyboard.press('Escape'); page.wait_for_timeout(200)
    assert page.evaluate('!optionsOuvertes && !isPaused'), 'Échap ne ferme pas les options / ne relance pas'

    # depuis le menu ☰
    page.click('#optionsBtn'); page.wait_for_timeout(200)
    page.click('#optionsMenuBtn'); page.wait_for_timeout(200)
    assert page.evaluate("optionsOuvertes && !document.body.classList.contains('menu-tactile-ouvert')")

    # --- volume ---
    page.fill('#optionsVolume', '40')
    page.dispatch_event('#optionsVolume', 'input')
    assert page.evaluate('volumeEffets') == 40
    page.click('#optionsMuet')
    assert page.evaluate('isMuted')
    page.click('#optionsMuet')

    # --- qualité et taille ---
    page.click('#optionsQualite button[data-valeur="basse"]'); page.wait_for_timeout(100)
    assert page.evaluate('canvas.width') == 400
    page.click('#optionsQualite button[data-valeur="haute"]')
    page.click('#optionsTaille button[data-valeur="classique"]'); page.wait_for_timeout(200)
    assert page.evaluate('canvas.clientWidth') == 400, page.evaluate('canvas.clientWidth')
    page.click('#optionsTaille button[data-valeur="ecran"]'); page.wait_for_timeout(200)
    assert page.evaluate('canvas.clientWidth') > 900

    # --- touches : Haut sur I ; Bas sur P (pris par Pause) : échange ---
    page.click('#optionsTouches button[data-action="haut"]')
    page.keyboard.press('KeyI')
    assert page.evaluate('touches.haut') == 'KeyI'
    page.click('#optionsTouches button[data-action="bas"]')
    page.keyboard.press('KeyP')
    assert page.evaluate('[touches.bas, touches.pause]') == ['KeyP', 'KeyS'], page.evaluate('[touches.bas, touches.pause]')
    page.click('#optionsTouches button[data-action="gauche"]')
    page.keyboard.press('Escape')  # annule
    assert page.evaluate('touches.gauche') == 'KeyA'
    capture(page, 'options_touches')
    page.keyboard.press('Escape')
    assert not page.evaluate('optionsOuvertes')

    # sauvegarde : les touches et le volume restent après rechargement
    page.reload(); page.wait_for_timeout(400)
    assert page.evaluate('[touches.haut, touches.bas, touches.pause, volumeEffets]') == ['KeyI', 'KeyP', 'KeyS', 40]
    page.keyboard.press('Space'); page.wait_for_timeout(3300)
    page.evaluate('nextDirection = {x: 1, y: 0}; direction = {x: 1, y: 0}; directionLockedThisTick = false')
    page.keyboard.press('KeyI'); page.wait_for_timeout(50)
    assert page.evaluate('nextDirection.y') == -1, 'la touche I ne fait pas monter'
    page.keyboard.press('KeyS'); page.wait_for_timeout(100)  # S = pause maintenant
    assert page.evaluate('isPaused'), 'S ne met pas en pause'
    page.keyboard.press('KeyS')

    # retour aux touches d'origine
    page.keyboard.press('KeyO'); page.wait_for_timeout(100)
    page.click('#optionsTouchesDefaut')
    assert page.evaluate('touches.haut') == 'KeyW'
    page.click('#optionsFermer')

    # --- coop au clavier : touches de J2 modifiées ---
    page.evaluate("changerModeJeu('coop')"); page.wait_for_timeout(200)
    page.evaluate("touches.hautJ2 = 'KeyK'")
    page.keyboard.press('Space'); page.wait_for_timeout(3300)
    page.evaluate('avecJoueur(joueurs[1], () => { nextDirection = {x: 1, y: 0}; direction = {x: 1, y: 0}; directionLockedThisTick = false; })')
    page.keyboard.press('KeyK'); page.wait_for_timeout(50)
    assert page.evaluate('joueurs[1].nextDirection.y') == -1, 'J2 ne monte pas avec sa touche'
    capture(page, 'coop_plein_ecran')
    page.close()

    # --- écran tactile : la disposition garde la main sur la taille, l'image reste nette ---
    ctx = nav.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, has_touch=True, is_mobile=True)
    page = ctx.new_page()
    page.on('pageerror', lambda e: erreurs.append('pageerror: ' + str(e)))
    page.goto('file://' + fichier); page.wait_for_timeout(400)
    page.evaluate("definirModeEntree('tactile')"); page.wait_for_timeout(300)
    m = mesure(page)
    print('tactile 390x844 @3 :', m)
    assert not page.evaluate("document.body.classList.contains('plateau-adapte')")
    assert abs(m['image'] - min(m['css'] * 3, 2400)) <= 2
    capture(page, 'tactile')
    nav.close()

if erreurs:
    print('ERREURS :', *erreurs, sep='\n  ')
    sys.exit(1)
print('OK : plateau adapté et options sans erreur')
