#!/usr/bin/env python3
"""Progression (Écailles) : calcul du gain, gain en fin de partie, Écailles des succès (une seule fois),
rattrapage des anciens succès, copie de secours, export / import. Échoue s'il y a une erreur JavaScript.
Usage : python3 test_progression.py chemin/vers/snake.html [dossier_captures]"""
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

def acheter(page, cle):
    # pose l'objet sur le comptoir, puis Acheter
    page.click(".objet[data-cle='" + cle + "']")
    page.click('#ficheAcheter')

def basculer(page, cle):
    page.click(".objet[data-cle='" + cle + "']")
    page.click('#ficheBasculer')

def ecailles(page):
    return page.evaluate('progression.ecailles')

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=CHROME)
    page = nav.new_page(viewport={'width': 1100, 'height': 900})
    page.on('pageerror', lambda e: erreurs.append('pageerror: ' + str(e)))
    page.on('console', lambda m: erreurs.append('console: ' + m.text) if m.type == 'error' else None)
    page.on('dialog', lambda d: d.accept())
    page.goto('file://' + fichier)

    # --- joueur qui avait déjà des succès avant les Écailles : rattrapage au lancement, une seule fois ---
    page.evaluate("""localStorage.clear(); localStorage.setItem('snakeTutoFait', 'oui'); localStorage.setItem('snakeAstuces', 'non');
      localStorage.setItem('snakeSucces', JSON.stringify({obtenus: {premier_repas: 1, tueur_geant: 2, legende: 3}, cumul: {}}))""")
    page.reload()
    page.wait_for_timeout(400)
    verifier(ecailles(page) == 10 + 25 + 50, 'rattrapage des succès déjà obtenus', ecailles(page))
    page.reload()
    page.wait_for_timeout(400)
    verifier(ecailles(page) == 85, 'pas de double paiement au rechargement', ecailles(page))

    # --- calcul pur du gain ---
    g = page.evaluate("gainPartie({longueur: 100, ennemis: 50, boss: 1, pommesOr: 2, victoire: false, dureeSecondes: 60, difficulte: 'normal'})")
    verifier(g['base'] == 20 + 10 + 20 + 6 and g['total'] == 70, 'gain Normal (base 56 x 1,25)', (g['base'], g['total']))
    g = page.evaluate("gainPartie({longueur: 400, ennemis: 150, boss: 3, pommesOr: 5, victoire: true, dureeSecondes: 900, difficulte: 'difficile'})")
    verifier(g['total'] == 353, 'gain victoire Difficile (235 x 1,5, arrondi au-dessus)', g['total'])
    g = page.evaluate("gainPartie({longueur: 30, ennemis: 4, boss: 0, pommesOr: 0, victoire: false, dureeSecondes: 8, difficulte: 'facile'})")
    verifier(g['total'] == 0, 'partie de moins de 10 s : rien', g['total'])
    verifier(page.evaluate('bonusProgression("avarice")') == 0, 'aucune amélioration achetée')

    # --- vraie partie terminée : gain ajouté et affiché ---
    page.keyboard.press('Space')
    page.wait_for_timeout(3000)
    avant = ecailles(page)
    page.evaluate("""stats.startTime = performance.now() - 120000; stats.maxSnakeLength = 60; stats.enemiesKilled = 25;
      stats.goldenApplesEaten = 1; partieSucces.boss = 0; endGame()""")
    page.wait_for_timeout(1500)
    gain = page.evaluate('dernierGainPartie')
    attendu = round((12 + 5 + 3) * 1.25)
    verifier(gain and gain['total'] == attendu, 'gain de la partie', gain and gain['total'])
    apres = ecailles(page)
    verifier(apres - avant >= attendu, 'Écailles ajoutées au portefeuille', (avant, apres))
    verifier(page.evaluate("JSON.parse(localStorage.getItem('snakeProgression')).ecailles") == apres, 'sauvegardées')
    texte = page.locator('#statsEcailles').inner_text()
    verifier('Écailles gagnées' in texte and 'Bonus Normal' in texte, 'détail sous le jeu', texte.replace('\n', ' | '))
    verifier('🪙 +' in page.evaluate('texteGainPartie()'), 'ligne de l\'écran de game over', page.evaluate('texteGainPartie()'))
    capture(page, 'ecailles_game_over', '#game')
    capture(page, 'ecailles_stats', '#statsPanel')

    # --- un succès gagné pendant la partie rapporte une fois ---
    page.evaluate('init()')
    page.wait_for_timeout(200)
    avant = ecailles(page)
    page.evaluate("debloquerSucces('combo'); debloquerSucces('combo')")
    verifier(ecailles(page) - avant == 25, 'succès payé une seule fois', ecailles(page) - avant)
    verifier(page.evaluate('partieProgression.succes') == 25, 'compté dans la partie en cours')

    # --- tutoriel : aucun gain de partie ---
    verifier(page.evaluate("(() => { const t = tutoActif; tutoActif = () => true; dernierGainPartie = null; progressionFinPartie(false); tutoActif = t; return dernierGainPartie; })()") is None,
             'rien pendant le tutoriel')

    # --- copie de secours : sauvegarde principale abîmée ---
    page.evaluate("progression.ecailles += 1; sauverProgression(); progression.ecailles += 1; sauverProgression()")
    valeur = ecailles(page)
    page.evaluate("localStorage.setItem('snakeProgression', '{abîmé')")
    page.reload()
    page.wait_for_timeout(400)
    verifier(ecailles(page) == valeur - 1, 'reprise depuis la copie de secours', (ecailles(page), valeur - 1))

    # --- export / import ---
    page.evaluate("ouvrirOptions()")
    page.wait_for_timeout(200)
    page.click('#sauvegardeExporter')
    page.wait_for_timeout(200)
    code = page.input_value('#sauvegardeCode')
    verifier(code.startswith('SNAKE1:'), 'code exporté', code[:20])
    capture(page, 'sauvegarde_options', '#optionsPanel')
    page.focus('#sauvegardeCode')
    page.keyboard.type('o')
    verifier(page.evaluate('optionsOuvertes'), 'taper dans le code ne ferme pas les options')
    page.fill('#sauvegardeCode', 'n importe quoi')
    page.click('#sauvegardeImporter')
    verifier('⚠' in page.inner_text('#sauvegardeMessage') or page.locator('#sauvegardeMessage .px').count() > 0,
             'code invalide refusé', page.inner_text('#sauvegardeMessage'))
    sauve = ecailles(page)
    page.evaluate("localStorage.clear(); progression = progressionVide(); sauverProgression()")
    page.fill('#sauvegardeCode', code)
    with page.expect_navigation():
        page.click('#sauvegardeImporter')
    page.wait_for_timeout(500)
    verifier(ecailles(page) == sauve, 'import : Écailles retrouvées', (ecailles(page), sauve))
    verifier(page.evaluate("localStorage.getItem('snakeAvantImport')") is not None, 'état d\'avant l\'import gardé')

    # --- nouveau joueur : contenu de départ ---
    page.evaluate("localStorage.clear(); localStorage.setItem('snakeAstuces', 'non')")
    page.reload()
    page.wait_for_timeout(400)
    depart = page.evaluate("""[buffsDisponibles(), ['neon', 'espace', 'ocean', 'lave', 'aurore'].map(t => contenuDebloque('theme', t)),
      ['urchin', 'ghost', 'pixel', 'slime', 'spider'].map(t => contenuDebloque('skin', t)), joueurs[0].lives]""")
    verifier(depart[0] == ['doublepoints'], 'seul Points x2 au départ', depart[0])
    verifier(depart[1] == [True, True, True, False, False], '3 thèmes au départ', depart[1])
    verifier(depart[2] == [True, True, True, False, False], '3 skins au départ', depart[2])
    verifier(depart[3] == 3, '3 cœurs sans amélioration', depart[3])

    # thème verrouillé dans le menu : la Boutique s'ouvre, le thème ne change pas
    page.evaluate("document.querySelector('.theme-btn[data-theme=\"lave\"]').click()")
    verifier(page.evaluate('menuBuffsOuvert && currentThemeName === "neon" && objetChoisi === "theme:lave"'), 'thème verrouillé : Boutique ouverte sur ce thème, thème inchangé')
    verifier('Lave' in page.inner_text('#ficheNom') and '300' in page.inner_text('#ficheAcheter'), 'fiche du thème sur le comptoir', page.inner_text('#ficheAcheter'))
    # flèches : on passe d'un objet à l'autre, la fiche suit
    page.click(".objet[data-cle='theme:lave']")
    page.keyboard.press('ArrowRight')
    verifier(page.evaluate('objetChoisi') == 'theme:ocean', 'flèche droite : objet suivant sur l\'étagère', page.evaluate('objetChoisi'))
    page.keyboard.press('ArrowUp')
    verifier(page.evaluate("objetChoisi.startsWith('capacite:')"), 'flèche haut : étagère du dessus', page.evaluate('objetChoisi'))
    # niveau des améliorations affiché sur l'étagère et sur la fiche
    page.click(".objet[data-cle='amelioration:dureeBuffs']")
    niv = page.evaluate("[document.querySelector(\".objet[data-cle='amelioration:dureeBuffs'] .objet-niveau\").textContent, document.querySelectorAll(\".objet[data-cle='amelioration:dureeBuffs'] .objet-pips i\").length, ficheNiveau.textContent]")
    verifier(niv == ['Niv. 0', 3, 'Niveau 0 / 3'], 'niveau affiché (étagère et fiche)', niv)

    # achats : trop cher, puis achat réussi
    acheter(page, 'buff:freeze')
    verifier(page.evaluate("humeurSifflet") == 'decu', 'achat refusé sans assez d\'Écailles (Sifflet déçu)', page.inner_text('#boutiqueMessage'))
    page.evaluate('progression.ecailles = 1000; sauverProgression()')
    acheter(page, 'buff:freeze')
    acheter(page, 'amelioration:coeur')
    acheter(page, 'amelioration:dureeBuffs')
    acheter(page, 'amelioration:bouclier')
    verifier(ecailles(page) == 1000 - 100 - 400 - 100 - 80, 'Écailles dépensées', ecailles(page))
    verifier(page.evaluate("buffsDisponibles()") == ['freeze', 'doublepoints'], 'Gel acheté', page.evaluate("buffsDisponibles()"))
    niv = page.evaluate("document.querySelector(\".objet[data-cle='amelioration:coeur'] .objet-niveau\").textContent")
    verifier(niv == 'MAX', 'niveau max affiché après achat', niv)
    page.click(".objet[data-cle='amelioration:dureeBuffs']")
    verifier(page.inner_text('#ficheNiveau').startswith('Niveau 1 / 3'), 'fiche : niveau 1 / 3 après achat', page.inner_text('#ficheNiveau'))
    capture(page, 'boutique', '#buffMenuPanel')
    page.evaluate('fermerMenuBuffs()')
    page.wait_for_timeout(200)
    effets = page.evaluate("[joueurs[0].lives, dureeBuff('freeze'), dureeRechargeBouclier()]")
    verifier(effets == [4, 11000, 13500], 'améliorations appliquées (cœur, durée, bouclier)', effets)

    # interrupteur : amélioration coupée, puis remboursement
    page.evaluate('ouvrirMenuBuffs()')
    basculer(page, 'amelioration:coeur')
    page.evaluate('fermerMenuBuffs()')
    page.wait_for_timeout(200)
    verifier(page.evaluate('joueurs[0].lives') == 3, 'amélioration coupée', page.evaluate('joueurs[0].lives'))
    page.evaluate('ouvrirMenuBuffs()')
    page.click('#boutiqueRembourser')
    verifier(ecailles(page) == 1000 - 100, 'remboursement des améliorations (pas des buffs)', ecailles(page))
    page.evaluate('fermerMenuBuffs()')

    # pendant une partie : lecture seule
    page.keyboard.press('Space')
    page.wait_for_timeout(3000)
    page.evaluate('ouvrirMenuBuffs()')
    avant = ecailles(page)
    acheter(page, 'amelioration:avarice')
    verifier(ecailles(page) == avant and page.evaluate("buffMenuEl.classList.contains('lecture-seule')"), 'pas d\'achat en pleine partie')
    page.evaluate('fermerMenuBuffs()')

    # tutoriel : aucune amélioration
    page.evaluate("progression.achats.coeur = 1; progression.inactifs = []")
    verifier(page.evaluate("(() => { const t = tutoActif; tutoActif = () => true; const b = bonusProgression('coeur'); tutoActif = t; return b; })()") == 0,
             'aucune amélioration pendant le tutoriel')

    # aimant : une pomme en or proche glisse vers la tête
    page.evaluate("progression.achats.aimant = 2")
    d = page.evaluate("""(() => {
      const t = joueurs[0].snake[0];
      const p = {x: t.x * gridSize + 10 + 40, y: t.y * gridSize + 10, radius: 9};
      attirerPomme(p, 100);
      return Math.round(p.x - (t.x * gridSize + 10));
    })()""")
    verifier(d == 28, 'aimant : la pomme se rapproche', d)

    # un succès débloque un skin
    page.evaluate("debloquerSucces('ca_pousse')")
    verifier(page.evaluate("contenuDebloque('skin', 'slime')"), 'succès « Ça pousse » : skin Slime débloqué')

    # jeu en ligne : l'invité reçoit les Écailles de l'hôte
    avant = ecailles(page)
    page.evaluate('recevoirEcaillesHote(42); recevoirEcaillesHote(-5); recevoirEcaillesHote(1e9)')
    verifier(ecailles(page) - avant == 42, 'invité : Écailles reçues (valeurs absurdes ignorées)', ecailles(page) - avant)

    # ancien joueur (sauvegarde d'avant la Boutique) : garde tout ce qui existait
    page.evaluate("""localStorage.clear(); localStorage.setItem('snakeAstuces', 'non'); localStorage.setItem('snakeTutoFait', 'oui');
      localStorage.setItem('snakeHighscores', '[]')""")
    page.reload()
    page.wait_for_timeout(400)
    anc = page.evaluate("""[buffsDisponibles().length, contenuDebloque('theme', 'lave'), contenuDebloque('skin', 'bat'),
      contenuDebloque('theme', 'aurore'), contenuDebloque('skin', 'spider')]""")
    verifier(anc == [6, True, True, False, False], 'ancien joueur : 6 buffs, Lave, 5 skins ; nouveautés à débloquer', anc)

    # ?dev : progression à part, tout débloqué, Boutique ouverte en partie
    page.goto('file://' + fichier + '?dev')
    page.wait_for_timeout(400)
    dev = page.evaluate("[modeDev, cleStockageProgression, contenuDebloque('theme', 'halloween'), succesActifs()]")
    verifier(dev == [True, 'snakeProgression_dev', True, False], 'mode dev', dev)
    page.evaluate('ouvrirMenuBuffs()')
    page.click('#devEcailles')
    verifier(page.evaluate("progression.ecailles") == 1000 and page.evaluate("JSON.parse(localStorage.getItem('snakeProgression')).ecailles") == 0,
             'dev : Écailles à part de la vraie sauvegarde')

    nav.close()

verifier(not erreurs, 'aucune erreur console', erreurs)
sys.exit(1 if echecs else 0)
