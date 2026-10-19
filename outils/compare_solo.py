#!/usr/bin/env python3
"""Rejoue la même partie solo (hasard et horloge figés, mêmes touches) sur deux fichiers
et compare l'état du jeu image par image. Usage : compare_solo.py ancien.html nouveau.html"""
import sys, os, json
from playwright.sync_api import sync_playwright

CHROME = os.environ.get('CHROME_PATH') or next((c for c in ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'] if os.path.exists(c)), None)  # sinon : Chromium installé par Playwright
INIT = """
(() => {
  let graine = 12345;
  Math.random = () => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine / 2147483648; };
  let horloge = 1000;
  performance.now = () => horloge;
  const rappels = [];
  window.requestAnimationFrame = f => { rappels.push(f); return rappels.length; };
  window.cancelAnimationFrame = () => { rappels.length = 0; };
  window.__image = () => { horloge += 16.67; const r = rappels.splice(0); r.forEach(f => f(horloge)); };
})();
"""
ETAT = """JSON.stringify({s: snake, d: direction, l: lives, sc: score, go: gameOver,
  e: enemies.map(e => [Math.round(e.x*100), Math.round(e.y*100), e.hp]), f: food,
  la: lootApples, ga: goldenApples.length, ba: blueApples.length, p: projectiles.length, k: killCount})"""
SCRIPT = {30: 'Space', 260: 'ArrowDown', 300: 'ArrowLeft', 380: 'ArrowUp', 420: 'KeyD', 500: 'ArrowDown',
          560: 'KeyA', 640: 'KeyW', 700: 'ArrowRight', 760: 'ArrowDown', 820: 'ArrowLeft', 900: 'ArrowUp'}

def jouer(fichier, images=1200):
    etats = []
    with sync_playwright() as p:
        nav = p.chromium.launch(executable_path=CHROME)
        page = nav.new_page()
        page.add_init_script(INIT)
        page.goto('file://' + os.path.abspath(fichier))
        page.evaluate('lives = 9; score = 200')
        for i in range(images):
            if i in SCRIPT:
                page.keyboard.press(SCRIPT[i])
            if i % 40 == 20 and i > 250:
                page.mouse.move(50 + (i * 37) % 300, 50 + (i * 53) % 300)
                page.mouse.down(); page.mouse.up()
            page.evaluate('__image()')
            etats.append(page.evaluate(ETAT))
        nav.close()
    return etats

a = jouer(sys.argv[1]); b = jouer(sys.argv[2])
for i, (x, y) in enumerate(zip(a, b)):
    if x != y:
        print("DIFFÉRENCE à l'image", i); print(x[:400]); print(y[:400]); sys.exit(1)
fin = json.loads(a[-1])
print('IDENTIQUE sur', len(a), 'images ; fin : score', fin['sc'], 'longueur', len(fin['s']), 'vies', fin['l'], 'ennemis', len(fin['e']), 'game over', fin['go'])
