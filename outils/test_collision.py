#!/usr/bin/env python3
"""Option « collision entre joueurs » en coop : coupée = on traverse, activée = un cœur perdu. Usage : test_collision.py snake.html"""
import sys, os
from playwright.sync_api import sync_playwright
CHROME = os.environ.get('CHROME_PATH') or next((c for c in ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'] if os.path.exists(c)), None)  # sinon : Chromium installé par Playwright
SCENE = """(actif) => {
  capacitesActives.collisionJoueurs = actif;
  const [j1, j2] = joueurs;
  // J1 va vers la droite, juste à gauche du corps vertical de J2
  j1.snake = [{x: 9, y: 10}, {x: 8, y: 10}, {x: 7, y: 10}];
  j1.direction = j1.nextDirection = {x: 1, y: 0};
  j2.snake = [{x: 10, y: 12}, {x: 10, y: 11}, {x: 10, y: 10}, {x: 10, y: 9}];
  j2.direction = j2.nextDirection = {x: 0, y: 0};
  j1.invulnerableUntil = j1.shieldActiveUntil = j1.buffInvincibleUntil = 0;
  const avant = [j1.lives, j2.lives];
  avecJoueur(j1, () => tick());
  return {avant, apres: [j1.lives, j2.lives], tete: j1.snake[0]};
}"""
erreurs, echecs = [], []
def verifie(nom, ok):
    print(('OK   ' if ok else 'ÉCHEC ') + nom)
    if not ok: echecs.append(nom)
with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=CHROME)
    page = nav.new_page()
    page.on('pageerror', lambda e: erreurs.append(str(e)))
    page.goto('file://' + os.path.abspath(sys.argv[1]))
    page.evaluate("changerModeJeu('coop')")
    page.keyboard.press('Space'); page.wait_for_timeout(3500)
    page.evaluate("isPaused = true")
    r = page.evaluate(SCENE, False)
    verifie('option coupée : J1 traverse sans perte %s' % r, r['avant'] == r['apres'] and r['tete'] == {'x': 10, 'y': 10})
    r = page.evaluate(SCENE, True)
    verifie('option activée : J1 perd un cœur, J2 intact %s' % r, r['apres'][0] == r['avant'][0] - 1 and r['apres'][1] == r['avant'][1])
    nav.close()
print('\n'.join(erreurs) if erreurs else 'aucune erreur console')
sys.exit(1 if erreurs or echecs else 0)
