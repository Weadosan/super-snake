#!/usr/bin/env python3
"""Parties automatiques pour l'équilibrage : un bot (outils/bot_parties.js, niveau faible / moyen / fort) joue
N parties par difficulté, avec une horloge accélérée, en nouveau joueur. Affiche une ligne par partie
(longueur, ennemis, boss, pommes en or, durée, Écailles gagnées) et le résumé par difficulté et niveau.
Usage : python3 outils/parties_auto.py snake.html [parties] [niveaux] [difficultes] [sortie.json]
  ex. : python3 outils/parties_auto.py snake.html 3 moyen,fort facile,difficile"""
import sys, os, json, time
from playwright.sync_api import sync_playwright

CHROME = os.environ.get('CHROME_PATH') or next((c for c in ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'] if os.path.exists(c)), None)  # sinon : Chromium installé par Playwright
jeu = os.path.abspath(sys.argv[1])
bot = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bot_parties.js')).read()
nb = int(sys.argv[2]) if len(sys.argv) > 2 else 2
niveaux = (sys.argv[3] if len(sys.argv) > 3 else 'faible,moyen,fort').split(',')
difficultes = (sys.argv[4] if len(sys.argv) > 4 else 'facile,normal,difficile').split(',')
sortie = sys.argv[5] if len(sys.argv) > 5 else None
DUREE_MAX = 25 * 60 * 1000  # une partie s'arrête au plus après 25 min de jeu

resultats = []
with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=CHROME)
    for diff in difficultes:
        for niv in niveaux:
            page = nav.new_page(viewport={'width': 900, 'height': 900})
            erreurs = []
            page.on('pageerror', lambda e: erreurs.append(str(e)))
            page.clock.install()
            page.goto('file://' + jeu)
            page.evaluate(f"""localStorage.clear(); localStorage.setItem('snakeTutoFait', 'oui');
              localStorage.setItem('snakeAstuces', 'non'); localStorage.setItem('snakeDifficulte', '{diff}');""")
            page.reload()
            page.clock.run_for(1000)
            page.add_script_tag(content=bot)
            page.evaluate(f"window.draw = () => {{}}; lancerBot('{niv}')")
            for n in range(nb):
                t0 = time.time()
                page.evaluate("if (gameOver) init(); actionPrincipale();")
                page.clock.run_for(4000)
                ecoule = 0
                while ecoule < DUREE_MAX and not page.evaluate('gameOver'):
                    page.clock.run_for(5000)
                    ecoule += 5000
                r = page.evaluate("""({fin: gameOver, gain: dernierGainPartie, longueur: stats.maxSnakeLength,
                  ennemis: stats.enemiesKilled, boss: partieSucces.boss, or: stats.goldenApplesEaten,
                  victoire: hasWon, duree: window.dureeFin, cause: window.causeFin,
                  ecailles: progression.ecailles, total: progression.total, erreurBot: window.erreurBot || null})""")
                if not r['fin']:
                    page.evaluate('endGame()')
                    page.clock.run_for(1500)
                    r['gain'] = page.evaluate('dernierGainPartie')
                    r['coupee'] = True
                r.update(difficulte=diff, niveau=niv, partie=n + 1, secondesReelles=round(time.time() - t0, 1))
                r['gainPartie'] = r['gain']['total'] if r['gain'] else 0
                del r['gain']
                resultats.append(r)
                print(json.dumps(r, ensure_ascii=False), flush=True)
                page.clock.run_for(1000)
            if erreurs:
                print('ERREURS JS', diff, niv, erreurs[:3], flush=True)
            page.close()
    nav.close()

print()
for diff in difficultes:
    for niv in niveaux:
        l = [r for r in resultats if r['difficulte'] == diff and r['niveau'] == niv]
        gain = sum(r['gainPartie'] for r in l)
        duree = sum(r['duree'] or 0 for r in l) or 1
        print(f"{diff:10} {niv:7} : {gain / len(l):.0f} Écailles par partie, {gain / duree * 60:.1f} par minute, "
              f"partie moyenne {duree / len(l):.0f} s")
if sortie:
    json.dump(resultats, open(sortie, 'w'), ensure_ascii=False, indent=1)
