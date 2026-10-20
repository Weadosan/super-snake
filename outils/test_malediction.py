#!/usr/bin/env python3
"""Mode Malédiction : choix des malus entre deux parties, effets en jeu, bonus d'Écailles, rappel dans le HUD
et sur l'écran de fin, rien pendant le tutoriel ni en pleine partie. Échoue s'il y a une erreur JavaScript.
Usage : python3 test_malediction.py chemin/vers/snake.html [dossier_captures]"""
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

def capture(page, nom, cible='body'):
    if captures:
        os.makedirs(captures, exist_ok=True)
        page.locator(cible).screenshot(path=os.path.join(captures, nom + '.png'))

def basculer(page, cle):
    page.click(".malediction-ligne[data-cle='" + cle + "']")

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=CHROME)
    page = nav.new_page(viewport={'width': 1100, 'height': 900})
    page.on('pageerror', lambda e: erreurs.append('pageerror: ' + str(e)))
    page.on('console', lambda m: erreurs.append('console: ' + m.text) if m.type == 'error' else None)
    page.goto('file://' + fichier)
    page.evaluate("localStorage.clear(); localStorage.setItem('snakeTutoFait', 'oui'); localStorage.setItem('snakeAstuces', 'non')")
    page.reload()
    page.wait_for_timeout(400)

    # --- sans malédiction : partie normale ---
    verifier(page.evaluate('progression.maledictions') == [], 'aucune malédiction au départ')
    verifier(page.evaluate("getComputedStyle(document.getElementById('maledictionHud')).display") == 'none', 'pas de rappel dans le HUD')
    base = page.evaluate("[joueurs[0].lives, baseTickInterval, bouclierDisponible(), sprintDisponible(), pvBossPartie()]")
    verifier(base[0] == 3 and base[2] and base[3] and base[4] == 10, 'jeu normal sans malus', base)

    # --- calcul pur : le bonus s'ajoute à la difficulté ---
    partie = "{longueur: 100, ennemis: 50, boss: 1, pommesOr: 2, victoire: false, dureeSecondes: 60, difficulte: 'normal'"
    g = page.evaluate('gainPartie(' + partie + ', maledictions: ["rapides", "unCoeur"]})')
    verifier(g['base'] == 56 and g['bonusMaledictions'] == 0.65 and g['total'] == round(56 * 1.75 * 1.65),
             'gain : base 56 x 1,75 (Normal) x 1,65 (malus)', (g['base'], g['bonusMaledictions'], g['total']))
    g = page.evaluate('gainPartie(' + partie + '})')
    verifier(g['total'] == 98 and g['bonusMaledictions'] == 0, 'gain inchangé sans malus', g['total'])
    tout = page.evaluate('bonusMaledictions(Object.keys(reglagesProgression.maledictions))')
    verifier(tout == 1.7, 'tous les malus : +170 %', tout)
    verifier(page.evaluate('Object.keys(textesMaledictions).length') == 8 and
             page.evaluate('Object.keys(textesMaledictions).every(c => reglagesProgression.maledictions[c])'),
             '8 malus, chacun réglé dans reglagesProgression')

    # --- écran de choix : touche M sur l'écran de départ ---
    capture(page, 'depart_sans_malediction', '#game')
    page.keyboard.press('KeyM')
    page.wait_for_timeout(200)
    verifier(page.evaluate('maledictionOuverte'), 'M ouvre la malédiction')
    verifier(page.locator('.malediction-ligne').count() == 8, '8 lignes', page.locator('.malediction-ligne').count())
    for cle in ['rapides', 'horde', 'coriaces', 'serpentRapide', 'sansBouclier', 'sansSprint', 'sansBuffs', 'unCoeur']:
        basculer(page, cle)
    basculer(page, 'horde')  # recliquer enlève le malus
    choisies = page.evaluate('progression.maledictions')
    verifier(len(choisies) == 7 and 'horde' not in choisies, 'malus choisis, un retiré', choisies)
    total = page.inner_text('#maledictionTotal')
    verifier('145 %' in total and '2,45' in total, 'total affiché', total)
    verifier(page.locator('.malediction-ligne.actif').count() == 7, 'lignes actives marquées')
    capture(page, 'malediction_choix', '#maledictionPanel')
    page.keyboard.press('Space')  # Espace ne lance pas la partie tant que le panneau est ouvert
    verifier(page.evaluate('waitingToStart && !countdownActive'), 'Espace ne lance pas la partie sous le panneau')
    page.keyboard.press('Escape')
    page.wait_for_timeout(200)
    verifier(not page.evaluate('maledictionOuverte'), 'Échap ferme')

    # --- partie relancée avec les malus ---
    eff = page.evaluate("""[joueurs[0].lives, bouclierDisponible(), sprintDisponible(), buffsEnJeu(), pvBossPartie(),
      Math.round(baseTickInterval * 100) / 100, maledictionActive('horde')]""")
    verifier(eff[0] == 1, 'un seul cœur', eff[0])
    verifier(not eff[1] and not eff[2], 'ni bouclier ni sprint', eff[1:3])
    verifier(eff[3] == [], 'aucun buff possible', eff[3])
    verifier(eff[4] == 15, 'boss à 15 PV en Normal', eff[4])
    verifier(eff[5] == round(144 / 0.9 / 1.2, 2), 'serpent 20 % plus rapide', eff[5])
    verifier(not eff[6], 'Horde retirée : pas active')
    hud = page.evaluate("[getComputedStyle(maledictionHud).display, maledictionHud.title]")
    verifier(hud[0] != 'none' and 'Un seul cœur' in hud[1], 'rappel dans le HUD', hud)
    verifier(page.evaluate("document.getElementById('maledictionJeuBtn').classList.contains('actif')"), 'bouton 💀 allumé')
    capture(page, 'depart_avec_malediction', '#game')
    capture(page, 'hud_malediction', '#hud')

    # garder le choix d'une session à l'autre
    page.reload()
    page.wait_for_timeout(400)
    verifier(len(page.evaluate('progression.maledictions')) == 7, 'choix sauvegardé')
    verifier(page.evaluate('joueurs[0].lives') == 1, 'malus appliqués dès l\'ouverture du jeu')

    # --- en pleine partie : effets, et pas de changement possible ---
    page.keyboard.press('Space')
    page.wait_for_timeout(3000)
    page.keyboard.press('KeyM')
    page.wait_for_timeout(100)
    verifier(not page.evaluate('maledictionOuverte'), 'pas de malédiction en pleine partie')
    page.evaluate('popups = []')  # message « entre deux parties » : pas dans les captures suivantes
    page.keyboard.press('ShiftLeft')
    verifier(page.evaluate('joueurs[0].shieldActiveUntil') == 0, 'Maj : pas de bouclier')
    r = page.evaluate("""(() => { enemies = []; for (let i = 0; i < 6; i++) spawnEnemy(); const hp = enemies.map(e => e.maxHp);
      heartPickup = null; spawnHeartPickup(); return [hp, heartPickup]; })()""")
    verifier(all(h == 2 for h in r[0]), 'ennemis coriaces : tous à 2 coups', r[0])
    verifier(r[1] is None, 'pas de cœur bonus', r[1])
    # ennemis rapides : un ennemi parcourt 35 % de distance en plus
    d = page.evaluate("""(() => {
      const mesure = () => { enemies = [{x: 200, y: 200, vx: 0.05, vy: 0, speedFactor: 1, radius: 9, changeDirTimer: 99999, hp: 1, maxHp: 1}];
        const m = getEnemySpeedMultiplier() * reglagesDifficulte().vitesse * reglageMalediction('rapides', 'vitesse', 1);
        return 0.05 * 100 * m; };
      const avec = mesure(); const garde = maledictionsPartie; maledictionsPartie = []; const sans = mesure(); maledictionsPartie = garde;
      return Math.round(avec / sans * 100) / 100; })()""")
    verifier(d == 1.35, 'réglage de vitesse des ennemis : x1,35', d)

    # --- fin de partie : bonus dans le gain et rappel à l'écran ---
    page.evaluate("""stats.startTime = performance.now() - 120000; stats.maxSnakeLength = 60; stats.enemiesKilled = 25;
      stats.goldenApplesEaten = 1; partieSucces.boss = 0; endGame()""")
    page.wait_for_timeout(1500)
    gain = page.evaluate('dernierGainPartie')
    attendu = round((12 + 5 + 3) * 1.75 * 2.45)
    verifier(gain and gain['total'] == attendu, 'gain avec malus (20 x 1,75 x 2,45)', gain and gain['total'])
    texte = page.locator('#statsEcailles').inner_text()
    verifier('Malédiction' in texte and '×2,45' in texte and 'Bonus Normal' in texte, 'détail du bonus sous le jeu', texte.replace('\n', ' | '))
    verifier('+145 %' in page.evaluate('texteGainPartie()'), 'bonus sur l\'écran de game over', page.evaluate('texteGainPartie()'))
    capture(page, 'game_over_malediction', '#game')
    capture(page, 'stats_malediction', '#statsPanel')

    # entre deux parties : on peut changer, la partie terminée garde ses malus
    page.wait_for_timeout(800)
    page.evaluate('ouvrirMalediction()')
    verifier(page.evaluate('maledictionOuverte'), 'malédiction modifiable après le game over')
    page.click('#maledictionLever')
    page.click('#maledictionFermer')
    verifier(page.evaluate('progression.maledictions') == [] and len(page.evaluate('maledictionsPartie')) == 7,
             'Tout lever : vaut pour la partie suivante seulement')
    page.keyboard.press('Space')
    page.wait_for_timeout(300)
    verifier(page.evaluate('joueurs[0].lives') == 3 and page.evaluate('bouclierDisponible()'), 'partie suivante normale')

    # --- tutoriel : jamais de malédiction ---
    page.evaluate("progression.maledictions = ['unCoeur', 'sansBouclier']; sauverProgression(); init(); lancerTuto()")
    page.wait_for_timeout(300)
    t = page.evaluate("[maledictionActive('unCoeur'), bouclierDisponible(), getComputedStyle(maledictionHud).display]")
    verifier(t == [False, True, 'none'], 'rien pendant le tutoriel', t)
    page.evaluate("quitterTuto(false)")

    # --- coop : les malus valent pour les deux serpents ---
    page.evaluate("changerModeJeu('coop')")
    page.wait_for_timeout(300)
    vies = page.evaluate('joueurs.map(j => j.lives)')
    verifier(vies == [1, 1], 'coop : un cœur chacun', vies)
    page.evaluate("changerModeJeu('solo')")

    # --- menu ☰ et bouton du plateau ---
    page.evaluate("progression.maledictions = []; sauverProgression(); init()")
    page.click('#maledictionJeuBtn')
    verifier(page.evaluate('maledictionOuverte'), 'le bouton 💀 du plateau ouvre la malédiction')
    page.click('#maledictionFermer')

    verifier(not erreurs, 'aucune erreur console', erreurs)
    nav.close()

if echecs:
    print('\n' + str(len(echecs)) + ' échec(s)')
    sys.exit(1)
print('\nOK : mode Malédiction sans erreur')
