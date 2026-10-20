#!/usr/bin/env python3
"""Compare l'image du jeu entre deux versions, sur la même scène (hasard et horloge fixés) :
long serpent, boss, ennemis, particules, pour chaque thème et skin d'ennemi demandés.
Écrit avant / après / différence (amplifiée) dans un dossier et donne l'écart moyen et la part de pixels changés.
Usage : python3 compare_rendu.py avant.html apres.html dossier [--themes neon,lave] [--skins urchin,bat] [--serpents roi]"""
import sys, os, re, argparse, base64, io
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

ici = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(ici, 'mesure_fps.py'), encoding='utf8').read()
INIT, PREPARER, SCENE = (re.search(nom + r' = """(.*?)"""', src, re.S).group(1) for nom in ('INIT', 'PREPARER', 'SCENE'))
CHROME = os.environ.get('CHROME_PATH') or next((c for c in ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium'] if os.path.exists(c)), None)

ap = argparse.ArgumentParser()
ap.add_argument('avant'); ap.add_argument('apres'); ap.add_argument('dossier')
ap.add_argument('--themes', default=''); ap.add_argument('--skins', default='urchin'); ap.add_argument('--serpents', default='classique')
ap.add_argument('--images', type=int, default=30, help='images dessinées avant la capture (animations)')
args = ap.parse_args()
os.makedirs(args.dossier, exist_ok=True)

IMAGE = """
(n) => {
  const vrai = performance.now.bind(performance);
  let horloge = 100000; performance.now = () => horloge;
  for (let i = 0; i < n; i++) { horloge += 1000 / 60; ctx.setTransform(echelleRendu, 0, 0, echelleRendu, 0, 0); draw(0.5); }
  performance.now = vrai;
  return canvas.toDataURL('image/png');
}
"""

def capturer(nav, fichier, theme, skin, serpent):
    page = nav.new_page(viewport={'width': 1920, 'height': 1080})
    page.add_init_script(INIT)
    page.goto('file://' + os.path.abspath(fichier) + '?dev')
    page.evaluate("localStorage.setItem('snakeTutoFait', 'oui'); localStorage.setItem('snakeAstuces', 'non')")
    page.reload(); page.wait_for_timeout(500)
    page.evaluate(f"applyTheme('{theme}'); enemySkin = '{skin}'; skinSerpent = '{serpent}'")
    page.evaluate(PREPARER); page.evaluate(SCENE)
    url = page.evaluate(IMAGE, args.images)
    page.close()
    return Image.open(io.BytesIO(base64.b64decode(url.split(',')[1]))).convert('RGB')

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=CHROME)
    page = nav.new_page(); page.goto('file://' + os.path.abspath(args.avant) + '?dev')
    themes = args.themes.split(',') if args.themes else page.evaluate('Object.keys(themes)')
    page.close()
    for theme in themes:
        for skin in args.skins.split(','):
            for serpent in args.serpents.split(','):
                a = capturer(nav, args.avant, theme, skin, serpent)
                b = capturer(nav, args.apres, theme, skin, serpent)
                da, db = np.asarray(a, dtype=np.int16), np.asarray(b, dtype=np.int16)
                d = np.abs(da - db).max(axis=2)
                nom = f'{theme}_{skin}_{serpent}'
                a.save(os.path.join(args.dossier, nom + '_avant.png'))
                b.save(os.path.join(args.dossier, nom + '_apres.png'))
                Image.fromarray(np.clip(d * 8, 0, 255).astype(np.uint8)).save(os.path.join(args.dossier, nom + '_diff.png'))
                print(f'{nom:32} écart moyen {d.mean():5.2f}  pixels > 8 : {(d > 8).mean() * 100:5.2f} %  > 32 : {(d > 32).mean() * 100:5.2f} %  max {d.max()}')
    nav.close()
