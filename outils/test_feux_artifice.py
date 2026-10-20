#!/usr/bin/env python3
"""Feux d'artifice de victoire : un style par thème, nombre de particules limité, objets recyclés,
nouvelle salve tant que l'écran de victoire reste affiché. Échoue s'il y a une erreur JavaScript.
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

# boucle de jeu arrêtée : on fait avancer le feu d'artifice image par image (16 ms) et on dessine
SIMULER = """
(ms => {
  let max = 0;
  const objets = new Set();
  for (let t = 0; t < ms; t += 16) {
    updateFireworks(16);
    max = Math.max(max, fireworks.length);
    fireworks.forEach(e => objets.add(e));
  }
  draw(1);
  return {max, objets: objets.size, restants: fireworks.length,
    formes: [...new Set(fireworks.map(e => e.forme))].sort()};
})
"""

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=CHROME)
    page = nav.new_page()
    page.on('pageerror', lambda e: erreurs.append('pageerror: ' + str(e)))
    page.on('console', lambda m: erreurs.append('console: ' + m.text) if m.type == 'error' else None)
    page.goto('file://' + fichier)
    page.evaluate("localStorage.setItem('snakeTutoFait', 'oui'); localStorage.setItem('snakeAstuces', 'non')")
    page.reload()
    page.wait_for_timeout(500)
    page.keyboard.press('Space')
    page.wait_for_timeout(3200)  # compte à rebours

    themes = page.evaluate('Object.keys(themes)')
    verifier(page.evaluate('Object.keys(themes).every(t => stylesArtifice[t])'), 'chaque thème a son feu d\'artifice', themes)
    formesVues = {}
    for theme in themes:
        page.evaluate(f"applyTheme('{theme}'); fireworks = []; hasWon = false; triggerWin(); cancelAnimationFrame(animationFrameId)")
        # capture quand les premières gerbes sont bien ouvertes (les bulles de l'océan montent plus lentement)
        r = page.evaluate(SIMULER, 2300 if theme == 'ocean' else 1500)
        formesVues[theme] = tuple(r['formes'])
        if captures:
            os.makedirs(captures, exist_ok=True)
            page.locator('#game').screenshot(path=os.path.join(captures, 'feu_artifice_' + theme + '.png'))
        verifier(r['max'] <= 130, f'{theme} : peu de particules à la fois', r['max'])
        # sur 12 s (plusieurs salves), les objets recyclés évitent d'en créer sans cesse
        r2 = page.evaluate(SIMULER, 12000)
        verifier(r2['restants'] > 0, f'{theme} : nouvelles salves tant que l\'écran de victoire reste affiché')
        verifier(r2['objets'] <= 200, f'{theme} : objets recyclés d\'une salve à l\'autre', r2['objets'])
        page.evaluate('requestAnimationFrame(renderLoop)')
    verifier(len(set(formesVues.values())) == len(themes), 'un style différent par thème', formesVues)

    # une saccade (image très longue) ne fait pas exploser les particules hors de l'écran
    page.evaluate("updateFireworks(2000)")
    hors = page.evaluate("fireworks.filter(e => e.vie >= 0 && (e.x < -200 || e.x > largeurPlateau + 200 || e.y < -200 || e.y > hauteurPlateau + 200)).length")
    verifier(hors == 0, 'pas de bond après une saccade', hors)

    # nouvelle partie : plus de feu d'artifice
    page.evaluate("hasWon = false")
    page.click('#restart')
    page.wait_for_timeout(300)
    page.evaluate("updateFireworks(16)")
    verifier(page.evaluate('fireworks.length') == 0, 'plus de feu d\'artifice après « Rejouer »')
    nav.close()

if erreurs:
    print('\n'.join(erreurs))
if erreurs or echecs:
    sys.exit(1)
print('tout est bon')
