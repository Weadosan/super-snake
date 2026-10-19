#!/usr/bin/env python3
"""Skins du serpent et de la tourelle : verrouillés au départ, achat chez Sifflet, choix gardé, J2 aux couleurs du thème,
dessin de chaque skin en partie sans erreur. Échoue s'il y a une erreur JavaScript.
Usage : python3 test_skins_serpent.py chemin/vers/snake.html [dossier_captures]"""
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

    skins = page.evaluate('Object.keys(skinsSerpent)')
    verifier(len(skins) >= 7, 'au moins 6 nouveaux skins', skins)
    ouverts = page.evaluate("Object.keys(skinsSerpent).filter(c => contenuDebloque('serpent', c))")
    verifier(ouverts == ['classique'], 'seul Classique au départ', ouverts)
    verifier(page.evaluate("Object.keys(skinsSerpent).every(c => c === 'classique' || prixContenu('serpent', c) > 0)"),
             'chaque nouveau skin a un prix')
    verifier(page.evaluate("document.querySelectorAll('.serpent-btn.verrouille').length") == len(skins) - 1,
             'boutons verrouillés dans le menu ☰')

    # bouton verrouillé : la Boutique s'ouvre sur ce skin
    page.evaluate("ouvrirMenuTactile()")
    page.click(".serpent-btn[data-serpent='dragon']")
    page.wait_for_timeout(300)
    verifier(page.evaluate('menuBuffsOuvert && objetChoisi') == 'serpent:dragon', 'skin verrouillé : Boutique ouverte dessus')
    verifier(page.evaluate("skinSerpent") == 'classique', 'pas de skin non acheté sur le serpent')

    # achat : trop cher, puis assez d'Écailles
    page.click('#ficheAcheter')
    verifier(page.evaluate("contenuDebloque('serpent', 'dragon')") is False, 'trop cher : rien acheté')
    prix = page.evaluate("prixContenu('serpent', 'dragon')")
    page.evaluate(f"progression.ecailles = {prix + 7}; sauverProgression(); rafraichirMenuBuffs()")
    page.click('#ficheAcheter')
    page.wait_for_timeout(200)
    verifier(page.evaluate('progression.ecailles') == 7, 'achat : prix retiré', page.evaluate('progression.ecailles'))
    verifier(page.evaluate("skinSerpent") == 'dragon', 'skin acheté porté tout de suite')
    if captures:
        os.makedirs(captures, exist_ok=True)
        page.locator('#buffMenu').screenshot(path=os.path.join(captures, 'skins_boutique.png'))
    page.keyboard.press('Escape')

    # choix gardé au rechargement ; un skin non débloqué en sauvegarde retombe sur Classique
    page.reload()
    page.wait_for_timeout(400)
    verifier(page.evaluate("skinSerpent + '|' + cleSkinJoueur(joueurs[0])") == 'dragon|dragon', 'choix gardé au rechargement')
    page.evaluate("localStorage.setItem('snakeSkinSerpent', 'roi')")
    page.reload()
    page.wait_for_timeout(400)
    verifier(page.evaluate("cleSkinJoueur(joueurs[0])") == 'classique', 'skin pas acheté en sauvegarde : Classique')
    verifier(page.evaluate("choisirSkinSerpent('roi')") is False, 'choisirSkinSerpent refuse un skin pas acheté')

    # coop : J2 garde les couleurs du thème
    page.evaluate("choisirSkinSerpent('dragon'); changerModeJeu('coop')")
    page.wait_for_timeout(200)
    c = page.evaluate("[couleurJoueur(joueurs[0]), couleurJoueur(joueurs[1]), themes[currentThemeName].snakeBody2]")
    verifier(c[0] == '#2e7d32' and c[1] == c[2], 'coop : J1 en Dragon, J2 aux couleurs du thème', c)
    page.evaluate("changerModeJeu('solo')")

    # tourelles : verrouillées au départ, achat, choix gardé, J2 en Classique
    t = page.evaluate("Object.keys(skinsTourelle).filter(c => contenuDebloque('tourelle', c))")
    verifier(t == ['classique'], 'seule la tourelle Classique au départ', t)
    prix = page.evaluate("prixContenu('tourelle', 'gatling')")
    page.evaluate(f"progression.ecailles = {prix}; sauverProgression(); ouvrirMenuBuffs('tourelle:gatling')")
    page.wait_for_timeout(300)
    page.click('#ficheAcheter')
    page.wait_for_timeout(200)
    verifier(page.evaluate("progression.ecailles + '|' + skinTourelle") == '0|gatling', 'tourelle achetée et portée tout de suite')
    page.keyboard.press('Escape')
    page.reload()
    page.wait_for_timeout(400)
    verifier(page.evaluate("cleTourelleJoueur(joueurs[0]) + '|' + cleTourelleJoueur({numero: 1})") == 'gatling|classique',
             'tourelle gardée au rechargement, J2 en Classique')

    # chaque skin dessiné en partie (mode dev : tout débloqué), sans erreur
    page.goto('file://' + fichier + '?dev')
    page.wait_for_timeout(400)
    for cle in skins:
        page.evaluate(f"choisirSkinSerpent('{cle}'); init()")
        page.keyboard.press('Space')
        page.wait_for_timeout(3300)
        page.evaluate("pendingGrowth = 6; tongueUntil = performance.now() + 400")
        page.keyboard.press('ArrowDown')
        page.wait_for_timeout(500)
        if captures:
            page.locator('#game').screenshot(path=os.path.join(captures, 'skin_' + cle + '.png'))
        page.evaluate('gameOver = true')
    verifier(True, 'dessin des ' + str(len(skins)) + ' skins en partie')
    tourelles = page.evaluate('Object.keys(skinsTourelle)')
    for cle in tourelles:
        page.evaluate(f"choisirSkinTourelle('{cle}'); init()")
        page.keyboard.press('Space')
        page.wait_for_timeout(3300)
        page.evaluate("laserBuffUntil = performance.now() + 300")  # avec et sans le buff laser
        page.keyboard.press('ArrowDown')
        page.wait_for_timeout(500)
        if captures:
            page.locator('#game').screenshot(path=os.path.join(captures, 'tourelle_' + cle + '.png'))
        page.evaluate('gameOver = true')
    verifier(True, 'dessin des ' + str(len(tourelles)) + ' tourelles en partie')

    verifier(not erreurs, 'aucune erreur console', erreurs)
    nav.close()

sys.exit(1 if echecs else 0)
