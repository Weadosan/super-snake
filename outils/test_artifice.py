#!/usr/bin/env python3
"""Feu d'artifice de victoire, un par thème : chaque thème gagne une partie, on vérifie que les fusées
partent et explosent en éclats propres au thème, qu'il n'y a jamais trop d'éclats à la fois (vieux PC),
que les salves se relancent et que la réserve d'objets resservis ne grossit pas. 0 erreur console attendue.
Usage : python3 test_artifice.py chemin/vers/snake.html [dossier_captures]"""
import sys, os
from playwright.sync_api import sync_playwright

CHROME = os.environ.get('CHROME_PATH') or next((c for c in ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium'] if os.path.exists(c)), None)
fichier = os.path.abspath(sys.argv[1])
captures = sys.argv[2] if len(sys.argv) > 2 else None
erreurs = []
themes = ['neon', 'espace', 'lave', 'ocean', 'aurore', 'foret', 'desert', 'synthwave', 'halloween']
# forme d'éclat attendue dans chaque thème
formes = {'neon': 'neon', 'espace': 'etoile', 'lave': 'braise', 'ocean': 'bulle', 'aurore': 'flocon',
          'foret': 'feuille', 'desert': 'saule', 'synthwave': 'onde', 'halloween': 'chauve_souris'}

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=CHROME)
    page = nav.new_page(viewport={'width': 900, 'height': 700})
    page.on('pageerror', lambda e: erreurs.append('pageerror: ' + str(e)))
    page.on('console', lambda m: erreurs.append('console: ' + m.text) if m.type == 'error' else None)
    page.goto('file://' + fichier)
    page.wait_for_timeout(500)
    page.keyboard.press('Space')
    page.wait_for_timeout(3200)
    for t in themes:
        page.evaluate(f"applyTheme('{t}'); fireworks.length = 0; enemies = []; triggerWin();")
        maxi, formes_vues = 0, set()
        for _ in range(16):
            page.wait_for_timeout(150)
            n, vues = page.evaluate("[fireworks.filter(p => !p.fusee).length, [...new Set(fireworks.filter(p => !p.fusee).map(p => p.forme))]]")
            if n > maxi and captures:  # capture au moment le plus fourni
                os.makedirs(captures, exist_ok=True)
                page.locator('#game').screenshot(path=os.path.join(captures, 'artifice_' + t + '.png'))
            maxi = max(maxi, n)
            formes_vues.update(vues)
        print(f'{t:10s} éclats au plus : {maxi:3d}  formes : {sorted(formes_vues)}')
        assert maxi > 0, t + ' : aucune explosion'
        assert maxi <= 160, t + ' : trop d\'éclats à la fois (' + str(maxi) + ')'
        assert formes[t] in formes_vues, t + ' : la forme ' + formes[t] + ' manque'
    # les salves se relancent tant que l'écran de victoire reste affiché, et la réserve reste bornée
    page.wait_for_timeout(6000)
    assert page.evaluate('fireworks.length') > 0, 'plus de feu d\'artifice après plusieurs secondes'
    reserve = page.evaluate('reserveArtifice.length')
    print('réserve d\'objets resservis :', reserve)
    assert reserve < 400, 'la réserve grossit sans fin'
    # qualité basse : moitié moins d'éclats
    page.evaluate("optionQualite = 'basse'; applyTheme('neon'); fireworks.length = 0; launchFireworks();")
    maxi = 0
    for _ in range(16):
        page.wait_for_timeout(150)
        maxi = max(maxi, page.evaluate('fireworks.filter(p => !p.fusee).length'))
    print('qualité basse, éclats au plus :', maxi)
    assert 0 < maxi <= 80
    # une nouvelle partie efface tout
    page.evaluate('init()')
    page.wait_for_timeout(100)
    assert page.evaluate('fireworks.length') == 0
    nav.close()

if erreurs:
    print('\n'.join(erreurs))
    sys.exit(1)
print('OK')
