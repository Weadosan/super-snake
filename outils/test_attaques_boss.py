#!/usr/bin/env python3
"""Attaques des boss : chaque skin a la sienne, annoncée par un signal avant de frapper, qui fait mal là où elle
est montrée, que le bouclier pare, qui touche aussi J2 en coop, et qui ne se lance ni en tutoriel ni en pause.
La boucle du jeu est arrêtée et le temps avancé à la main : le test ne dépend pas de la vitesse de la machine.
Échoue s'il y a une erreur JavaScript. Usage : python3 test_attaques_boss.py chemin/vers/snake.html [dossier_captures]"""
import sys, os
from playwright.sync_api import sync_playwright

CHROME = os.environ.get('CHROME_PATH') or next((c for c in ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'] if os.path.exists(c)), None)  # sinon : Chromium installé par Playwright
fichier = os.path.abspath(sys.argv[1])
captures = sys.argv[2] if len(sys.argv) > 2 else None
erreurs = []
echecs = []

def verifier(cond, msg, detail=''):
    print(('OK   ' if cond else 'ÉCHEC ') + msg, detail)
    if not cond:
        echecs.append(msg)

# place un boss du skin voulu et un serpent immobile (cases), puis lance l'attaque tout de suite
OUTILS = """
window.scene = (skin, boss, cases, cases2) => {
  cancelAnimationFrame(animationFrameId);
  enemySkin = skin;
  enemies = []; projectiles = []; particles = []; popups = []; shockwaves = [];
  reinitialiserAttaquesBoss();
  lastEnemySpawn = performance.now() + 1e9; pendingSpawnWarning = null;
  const poser = (j, c) => {
    j.snake = c.map(([x, y]) => ({x, y})); j.prevSnake = j.snake.map(s => ({...s}));
    j.lives = 99; j.invulnerableUntil = 0; j.shieldActiveUntil = 0; j.buffInvincibleUntil = 0; j.englueRestant = 0;
    j.elimine = false; j.blessures = [];
  };
  poser(joueurs[0], cases);
  if (cases2 && joueurs[1]) poser(joueurs[1], cases2);
  spawnBoss({x: boss[0], y: boss[1]});
  const b = enemies.find(e => e.isBoss);
  b.neA = -1e9;
  b.attaque = {etat: 'attente', reste: 0};
  return true;
};
// avance le jeu de ms millisecondes par pas de 16 ms ; complet : tout le combat (le boss bouge), sinon les attaques seules
window.avancer = (ms, complet) => {
  for (let t = 0; t < ms; t += 16) {
    if (complet) updateCombat(16); else majAttaquesBoss(16);
  }
  const b = enemies.find(e => e.isBoss);
  return {etat: b && b.attaque ? b.attaque.etat : null, vies: joueurs.map(j => j.lives), boss: b ? [b.x, b.y] : null,
          dangers: dangersBoss.length, ennemis: enemies.length, attaques: attaqueBossCompteur};
};
window.dureePrepa = skin => reglagesAttaqueSkin(skin).preparation * multiplicateursAttaquesBoss().preparation;
window.dessinerImage = () => { draw(1); };
"""

# boss à gauche, serpent sur la ligne 10 tourné vers lui (tête en 14,10)
LIGNE = [[14, 10], [15, 10], [16, 10]]
SCENES = {
    # skin : (position du boss, cases du serpent, combat complet, doit blesser)
    'urchin': ([110, 210], [[10, 12], [11, 12], [12, 12]], False, True),  # sur l'un des 8 piquants (22,5°)
    'ghost': ([110, 210], LIGNE, False, False),
    'pixel': ([110, 210], LIGNE, False, True),
    'slime': ([110, 210], LIGNE, False, False),
    'bat': ([110, 210], LIGNE, True, True),
    'jelly': ([240, 210], LIGNE, False, True),
    'eye': ([110, 210], LIGNE, False, True),
    'drone': ([110, 210], LIGNE, False, True),
    'spider': ([110, 210], LIGNE, False, False),
    'crab': ([110, 210], LIGNE, True, True),
    'pumpkin': ([110, 210], LIGNE, False, True),
    'mushroom': ([170, 210], LIGNE, False, True),
}

def capture_canvas(page, nom):
    if not captures:
        return None
    os.makedirs(captures, exist_ok=True)
    page.evaluate('dessinerImage()')
    chemin = os.path.join(captures, nom + '.png')
    page.locator('#game').screenshot(path=chemin)
    return chemin

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=CHROME)
    page = nav.new_page(viewport={'width': 900, 'height': 900})
    page.on('pageerror', lambda e: erreurs.append('pageerror: ' + str(e)))
    page.on('console', lambda m: erreurs.append('console: ' + m.text) if m.type == 'error' else None)
    page.goto('file://' + fichier + '?dev')
    page.wait_for_timeout(500)
    page.evaluate("localStorage.setItem('snakeTutoFait', 'oui'); changerModeJeu('solo')")
    page.keyboard.press('Space')
    page.wait_for_timeout(3200)
    page.evaluate(OUTILS)

    verifier(page.evaluate('Object.keys(reglagesAttaquesBoss.attaques).length') == 12, '12 attaques réglées')
    paires = []
    for skin, (boss, cases, complet, blesse) in SCENES.items():
        page.evaluate('([s, b, c]) => scene(s, b, c)', [skin, boss, cases])
        prepa = page.evaluate('dureePrepa(%r)' % skin)
        avant = page.evaluate('avancer(32, %s)' % ('true' if complet else 'false'))
        verifier(avant['etat'] == 'prepa', skin + ' : préparation visible avant l\'attaque', avant)
        page.evaluate('avancer(%d, %s)' % (prepa * 0.6, 'true' if complet else 'false'))
        img1 = capture_canvas(page, skin + '_signal')
        presque = page.evaluate('avancer(%d, %s)' % (prepa * 0.4 - 80, 'true' if complet else 'false'))
        verifier(presque['etat'] == 'prepa' and presque['vies'][0] == 99 and presque['attaques'] == 0,
                 skin + ' : rien ne frappe pendant le signal', presque)
        # juste après le lancement, pour la capture de l'action
        page.evaluate('avancer(%d, %s)' % (64 + (200 if skin in ('pumpkin', 'spider', 'jelly', 'eye', 'urchin', 'pixel', 'drone') else 0) + (300 if skin == 'pumpkin' else 0) + (1100 if skin == 'mushroom' else 0) + (50 if skin in ('bat', 'crab') else 0), 'true' if complet else 'false'))
        img2 = capture_canvas(page, skin + '_attaque')
        paires.append((skin, img1, img2))
        apres = page.evaluate('avancer(4000, %s)' % ('true' if complet else 'false'))
        verifier(apres['attaques'] >= 1, skin + ' : l\'attaque est lancée', apres)
        if blesse:
            verifier(apres['vies'][0] < 99, skin + ' : l\'attaque blesse le serpent qui reste dans le signal', apres)
        if skin == 'ghost':
            verifier(apres['boss'] != boss, 'ghost : le boss réapparaît ailleurs', apres)
            tete = page.evaluate('[snake[0].x * gridSize + 10, snake[0].y * gridSize + 10]')
            d = ((apres['boss'][0] - tete[0]) ** 2 + (apres['boss'][1] - tete[1]) ** 2) ** 0.5
            verifier(d > 60, 'ghost : pas sur la tête du serpent', round(d))
        if skin == 'slime':
            verifier(apres['ennemis'] >= 3, 'slime : deux petits slimes apparaissent', apres)
        if skin == 'spider':
            page.evaluate("scene('spider', [110, 210], %s)" % LIGNE)
            page.evaluate('avancer(dureePrepa("spider") + 500, false)')
            englue = page.evaluate('[joueurs[0].englueRestant > 0, facteurEnglue(joueurs[0])]')
            verifier(englue[0] and englue[1] > 1, 'spider : la toile ralentit le serpent', englue)
            page.evaluate('enemies = enemies.filter(e => !e.isBoss); avancer(16, false)')
            verifier(page.evaluate('dangersBoss.length') == 0, 'spider : la toile disparaît avec le boss')

    # le bouclier pare l'attaque
    page.evaluate("scene('eye', [110, 210], %s); joueurs[0].shieldActiveUntil = performance.now() + 1e6" % LIGNE)
    r = page.evaluate('avancer(dureePrepa("eye") + 600, false)')
    verifier(r['vies'][0] == 99 and r['attaques'] == 1, 'bouclier : le rayon ne coûte aucun cœur', r)

    # boss gelé : il ne prépare rien
    page.evaluate("scene('drone', [110, 210], %s); enemies.find(e => e.isBoss).frozenUntil = performance.now() + 1e6" % LIGNE)
    r = page.evaluate('avancer(3000, false)')
    verifier(r['etat'] == 'attente' and r['attaques'] == 0, 'boss gelé : aucune attaque', r)

    # coop : J2 sur la ligne du rayon est touché, J1 à l'écart ne l'est pas
    page.evaluate("changerModeJeu('coop'); init()")
    page.keyboard.press('Space')
    page.wait_for_timeout(3200)
    page.evaluate(OUTILS)
    page.evaluate("scene('eye', [110, 50], [[2, 18], [3, 18], [4, 18]], [[14, 2], [15, 2], [16, 2]])")
    r = page.evaluate('avancer(dureePrepa("eye") + 600, false)')
    verifier(r['vies'] == [99, 98], 'coop : le rayon vise J2, le plus proche, et ne touche que lui', r)
    capture_canvas(page, 'coop_rayon')

    # pause : l'attaque en préparation n'avance pas
    page.evaluate("scene('pumpkin', [110, 210], [[14, 10], [15, 10], [16, 10]]); avancer(100, false)")
    page.evaluate('animationFrameId = requestAnimationFrame(renderLoop)')
    page.keyboard.press('KeyP')
    page.wait_for_timeout(100)
    avant = page.evaluate('enemies.find(e => e.isBoss).attaque.reste')
    page.wait_for_timeout(1500)
    apres = page.evaluate('enemies.find(e => e.isBoss).attaque.reste')
    verifier(page.evaluate('isPaused') and avant == apres, 'pause : le signal est figé', [avant, apres])
    page.keyboard.press('KeyP')

    # tutoriel : jamais d'attaque
    page.evaluate("changerModeJeu('solo'); lancerTuto()")
    page.wait_for_timeout(3200)
    page.evaluate(OUTILS)
    page.evaluate("scene('eye', [110, 210], %s)" % LIGNE)
    r = page.evaluate('avancer(5000, false)')
    verifier(r['attaques'] == 0 and r['etat'] == 'attente', 'tutoriel : le boss n\'attaque pas', r)

    nav.close()

    # planche des 12 boss : signal à gauche, attaque à droite
    if captures and all(a and b for _, a, b in paires):
        from PIL import Image, ImageDraw
        imgs = [(s, Image.open(a), Image.open(b)) for s, a, b in paires]
        w, h = imgs[0][1].size
        cote = 2
        planche = Image.new('RGB', (cote * 2 * w + (cote - 1) * 16, (len(imgs) + cote - 1) // cote * (h + 22)), '#111')
        dessin = ImageDraw.Draw(planche)
        for i, (s, a, b) in enumerate(imgs):
            x = (i % cote) * (2 * w + 16)
            y = (i // cote) * (h + 22)
            dessin.text((x + 4, y + 4), s + ' : signal / attaque', fill='#fff')
            planche.paste(a.resize((w, h)), (x, y + 22))
            planche.paste(b.resize((w, h)), (x + w, y + 22))
        planche.save(os.path.join(captures, 'planche_attaques_boss.png'))

verifier(not erreurs, 'aucune erreur console', erreurs)
if echecs:
    print('ÉCHECS :', echecs)
    sys.exit(1)
print('OK : attaques des boss')
