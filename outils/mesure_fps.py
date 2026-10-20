#!/usr/bin/env python3
"""Mesure le coût du rendu (draw) dans Chromium, par thème et skin, sur une scène chargée :
long serpent, boss, ennemis, projectiles, particules. Le hasard est fixé pour comparer deux versions.
Chaque image est forcée jusqu'aux pixels (getImageData), donc le temps compte aussi le tracé réel.
Usage : python3 mesure_fps.py chemin/vers/snake.html [--cpu 4] [--images 120] [--detail] [--json sortie.json]
  --cpu N    : processeur bridé N fois (CDP), pour imiter un vieux PC
  --detail   : temps par fonction de dessin (les plus coûteuses)
  --gpu      : canvas « accéléré » par une carte graphique émulée (SwiftShader) : la structure du coût
               (nombre de passes, de flous) ressemble à celle d'un PC avec carte graphique, pas sa vitesse"""
import sys, os, json, argparse
from playwright.sync_api import sync_playwright

CHROME = os.environ.get('CHROME_PATH') or next((c for c in ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium'] if os.path.exists(c)), None)
ap = argparse.ArgumentParser()
ap.add_argument('fichier')
ap.add_argument('--cpu', type=float, default=1)
ap.add_argument('--images', type=int, default=120)
ap.add_argument('--detail', action='store_true')
ap.add_argument('--gpu', action='store_true', help='canvas accéléré (carte graphique émulée par SwiftShader)')
ap.add_argument('--json')
ap.add_argument('--sans', default='', help='fonctions de dessin remplacées par rien (pour voir ce qu\'elles coûtent)')
ap.add_argument('--themes', default='')
ap.add_argument('--skins', default='')
ap.add_argument('--serpents', default='')
args = ap.parse_args()
fichier = os.path.abspath(args.fichier)
erreurs = []

# hasard fixé et horloge régulière (16,7 ms par image) : même scène d'une version à l'autre
INIT = """
(() => {
  let s = 12345;
  Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  window.reglerHasard = g => { s = g; };
})();
"""

PREPARER = """
(() => {
  cancelAnimationFrame(animationFrameId);
  reglerHasard(12345);
  decorAnime.theme = ''; particulesAmbianceTheme = ''; // le décor animé repart de zéro
  waitingToStart = false; countdownActive = false; gameOver = false; isPaused = false;
  lives = 9;
  // serpent de 70 segments en zigzag, avec des virages
  const corps = [];
  let x = 18, y = 2, dx = -1;
  while (corps.length < 70) {
    corps.push({x, y});
    if ((dx < 0 && x <= 1) || (dx > 0 && x >= 18)) { y++; corps.push({x, y}); y++; dx = -dx; }
    else x += dx;
  }
  snake = corps.slice(0, 70);
  prevSnake = snake.map(p => ({...p}));
  joueurActif.snake = snake; joueurActif.prevSnake = prevSnake;
  direction = {x: 1, y: 0}; nextDirection = {x: 1, y: 0};
})()
"""

SCENE = """
(() => {
  enemies.length = 0; projectiles.length = 0; particles.length = 0;
  spawnBoss();
  for (let i = 0; i < 8; i++) spawnEnemy();
  for (let i = 0; i < 6; i++) spawnParticles(100 + i * 30, 200, currentTheme.snakeBody, 12);
  for (let i = 0; i < 4; i++) spawnPopup(80 + i * 60, 120, '+10', '#4caf50');
})()
"""

# boucle de rendu seule (pas de logique de jeu), une image = ce que renderLoop dessine
MESURER = """
(([n, detail, lot]) => {
  const noms = ['drawBackgroundPattern', 'dessinerDecorAnime', 'dessinerParticulesAmbiance', 'dessinerPommeVivante',
    'dessinerSerpent', 'drawEnemies', 'drawLootApples', 'drawGoldenApple', 'drawBlueApple', 'drawProjectiles',
    'dessinerAttaquesBoss', 'dessinerSolAttaquesBoss', 'drawTurret', 'drawParticles', 'drawPopups', 'drawFireworks',
    'dessinerMarquesImpact', 'drawLaserBeams', 'drawShockwaves', 'drawHeartPickup', 'dessinerFlashEcran'];
  const temps = {};
  const originaux = {};
  const vrai = performance.now.bind(performance);
  if (detail) noms.forEach(nom => {
    if (typeof window[nom] !== 'function') return;
    const f = window[nom]; originaux[nom] = f; temps[nom] = 0;
    window[nom] = function () {
      const t0 = vrai();
      const r = f.apply(this, arguments);
      ctx.getImageData(0, 0, 1, 1);
      temps[nom] += vrai() - t0;
      return r;
    };
  });
  let horloge = vrai();
  performance.now = () => horloge;
  const durees = [];
  ctx.getImageData(0, 0, 1, 1);
  // lot : images dessinées entre deux lectures des pixels (une lecture par image ferait repasser
  // un canvas accéléré en mode logiciel) ; le temps du lot est réparti sur ses images
  for (let i = 0; i < n + 10; i += lot) {
    const t0 = vrai();
    for (let k = 0; k < lot; k++) {
      horloge += 1000 / 60;
      ctx.setTransform(echelleRendu, 0, 0, echelleRendu, 0, 0);
      draw(0.5);
      drawSlowMotionOverlay(); drawEndgameTransitionMessage();
    }
    ctx.getImageData(0, 0, 1, 1);
    if (i >= 10) for (let k = 0; k < lot; k++) durees.push((vrai() - t0) / lot); // les 10 premières remplissent les caches
  }
  performance.now = vrai;
  Object.assign(window, originaux);
  durees.sort((a, b) => a - b);
  const moy = durees.reduce((a, b) => a + b, 0) / durees.length;
  Object.keys(temps).forEach(k => temps[k] /= (n + 10));
  return {moy, med: durees[durees.length >> 1], p95: durees[Math.floor(durees.length * 0.95)], max: durees[durees.length - 1], temps,
    taille: canvas.width + 'x' + canvas.height};
})
"""

with sync_playwright() as p:
    opts = ['--enable-gpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] if args.gpu else []
    nav = p.chromium.launch(executable_path=CHROME, args=opts)
    page = nav.new_page(viewport={'width': 1920, 'height': 1080})
    page.on('pageerror', lambda e: erreurs.append('pageerror: ' + str(e)))
    page.add_init_script(INIT)
    page.goto('file://' + fichier + '?dev')
    page.evaluate("localStorage.setItem('snakeTutoFait', 'oui'); localStorage.setItem('snakeAstuces', 'non')")
    page.reload()
    page.wait_for_timeout(600)
    if args.cpu > 1:
        cdp = page.context.new_cdp_session(page)
        cdp.send('Emulation.setCPUThrottlingRate', {'rate': args.cpu})

    themes = args.themes.split(',') if args.themes else page.evaluate('Object.keys(themes)')
    skins = args.skins.split(',') if args.skins else ['urchin']
    serpents = args.serpents.split(',') if args.serpents else ['classique']
    resultats = []
    for theme in themes:
        for skin in skins:
            for serpent in serpents:
                page.evaluate(f"applyTheme('{theme}'); enemySkin = '{skin}'; skinSerpent = '{serpent}'")
                page.evaluate(PREPARER)
                for f in filter(None, args.sans.split(',')):
                    page.evaluate(f"window['{f}'] = function () {{}}")
                page.evaluate(SCENE)
                r = page.evaluate(MESURER, [args.images, args.detail, 10 if args.gpu else 1])
                r.update(theme=theme, skin=skin, serpent=serpent)
                resultats.append(r)
                ligne = f"{theme:10} {skin:9} {serpent:10} moy {r['moy']:6.2f} ms  méd {r['med']:6.2f}  p95 {r['p95']:6.2f}  max {r['max']:6.2f}"
                if args.detail:
                    top = sorted(r['temps'].items(), key=lambda kv: -kv[1])[:5]
                    ligne += '   | ' + ', '.join(f'{k} {v:.2f}' for k, v in top)
                print(ligne, flush=True)
    print('canvas', resultats[0]['taille'], '· cpu x', args.cpu, '· gpu émulé' if args.gpu else '· canvas logiciel')
    tot = sum(r['moy'] for r in resultats) / len(resultats)
    print(f'MOYENNE GÉNÉRALE {tot:.2f} ms par image')
    if args.json:
        json.dump(resultats, open(args.json, 'w'), indent=1)
    nav.close()

if erreurs:
    print('\n'.join(erreurs))
    sys.exit(1)
