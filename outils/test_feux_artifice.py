#!/usr/bin/env python3
"""Feux d'artifice de victoire : un style par thème, nombre d'éclats borné, salves relancées tant que
l'écran de victoire reste affiché, tout vidé au redémarrage. Capture un aperçu par thème si un dossier est donné.
Échoue s'il y a une erreur JavaScript.
Usage : python3 test_feux_artifice.py chemin/vers/snake.html [dossier_captures]"""
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

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=CHROME)
    page = nav.new_page(viewport={'width': 1100, 'height': 900})
    page.on('pageerror', lambda e: erreurs.append('pageerror: ' + str(e)))
    page.on('console', lambda m: erreurs.append('console: ' + m.text) if m.type == 'error' else None)
    page.goto('file://' + fichier)
    page.evaluate("localStorage.clear(); localStorage.setItem('snakeTutoFait', 'oui'); localStorage.setItem('snakeAstuces', 'non')")
    page.reload()
    page.wait_for_timeout(400)

    themes = page.evaluate('Object.keys(themes)')
    sans_style = page.evaluate('Object.keys(themes).filter(t => !stylesFeuxArtifice[t])')
    verifier(not sans_style, 'chaque thème a son feu d\'artifice', sans_style)
    verifier(page.evaluate('new Set(Object.values(stylesFeuxArtifice).map(s => s.motif + s.forme)).size') == len(themes),
             'un motif ou une forme propre à chaque thème')

    page.evaluate('isMuted = true')
    for theme in themes:
        page.evaluate(f"applyTheme('{theme}'); init(); waitingToStart = false; triggerWin()")
        verifier(page.evaluate('fireworks.length > 0 && fireworks.every(f => f.style === stylesFeuxArtifice[currentThemeName])'),
                 theme + ' : salve dans le style du thème')
        maxi = 0
        for _ in range(12):
            page.wait_for_timeout(150)
            maxi = max(maxi, page.evaluate('feuNb'))
        verifier(0 < maxi <= page.evaluate('FEU_MAX_PARTICULES'), theme + ' : éclats visibles et bornés', maxi)
        if captures:
            os.makedirs(captures, exist_ok=True)
            page.locator('#game').screenshot(path=os.path.join(captures, 'feu_' + theme + '.png'))

    # la victoire relance des salves en continu, sans accumuler d'objets
    page.wait_for_timeout(5000)
    verifier(page.evaluate('fireworks.length + feuNb > 0'), 'les salves continuent sur l\'écran de victoire')
    verifier(page.evaluate('feuParticules.length <= FEU_MAX_PARTICULES'), 'éclats réutilisés, pas de nouveaux objets',
             page.evaluate('feuParticules.length'))
    page.evaluate('init()')
    page.wait_for_timeout(200)
    verifier(page.evaluate('fireworks.length === 0 && feuNb === 0'), 'tout est vidé au redémarrage')

    # coût du dessin : 200 images avec des éclats au maximum
    cout = page.evaluate('''() => {
        applyTheme('neon'); hasWon = true; launchFireworks();
        for (let i = 0; i < 40; i++) updateFireworks(100);
        while (feuNb < FEU_MAX_PARTICULES) { const f = fireworks[0] || {x: 300, y: 200, color: '#fff', style: stylesFeuxArtifice.neon}; eclaterFusee(f); }
        const t0 = performance.now();
        for (let i = 0; i < 200; i++) drawFireworks();
        return (performance.now() - t0) / 200;
    }''')
    verifier(cout < 4, 'dessin léger même au maximum d\'éclats', f'{cout:.2f} ms/image')
    nav.close()

for e in erreurs:
    print(e)
if erreurs or echecs:
    sys.exit(1)
print('tout est bon')
