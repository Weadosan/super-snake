#!/usr/bin/env python3
"""Coop avec une manette simulée : la manette doit piloter J2 et le clavier J1. Usage : test_manettes.py snake.html"""
import sys, os
from playwright.sync_api import sync_playwright
CHROME = os.environ.get('CHROME_PATH') or next((c for c in ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'] if os.path.exists(c)), None)  # sinon : Chromium installé par Playwright
INIT = """
window.__pads = [0].map(i => ({index: i, connected: true, mapping: 'standard',
  buttons: Array.from({length: 17}, () => ({pressed: false, value: 0})), axes: [0, 0, 0, 0]}));
navigator.getGamepads = () => window.__pads;
window.__appui = (pad, bouton, etat) => { window.__pads[pad].buttons[bouton] = {pressed: etat, value: etat ? 1 : 0}; };
"""
erreurs, echecs = [], []
def verifie(nom, ok):
    print(('OK   ' if ok else 'ÉCHEC ') + nom)
    if not ok: echecs.append(nom)
with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=CHROME)
    page = nav.new_page()
    page.on('pageerror', lambda e: erreurs.append(str(e)))
    page.add_init_script(INIT)
    page.goto('file://' + os.path.abspath(sys.argv[1]))
    page.evaluate("changerModeJeu('coop')")
    page.wait_for_timeout(200)
    verifie('clavier non partagé avec une manette', page.evaluate('!clavierPartage()'))
    page.evaluate("__appui(0, 0, true)"); page.wait_for_timeout(100); page.evaluate("__appui(0, 0, false)")
    page.wait_for_timeout(3000)
    verifie('partie lancée par la manette', page.evaluate('!waitingToStart'))
    page.evaluate("__appui(0, 12, true)"); page.wait_for_timeout(200); page.evaluate("__appui(0, 12, false)")
    page.wait_for_timeout(300)
    d = page.evaluate('joueurs.map(j => j.direction)')
    verifie('croix de la manette -> J2 monte : %s' % d, d[1] == {'x': 0, 'y': -1})
    page.keyboard.press('ArrowDown'); page.wait_for_timeout(300)
    d = page.evaluate('joueurs.map(j => j.direction)')
    verifie('flèche bas -> J1 descend, J2 inchangé : %s' % d, d[0] == {'x': 0, 'y': 1} and d[1] == {'x': 0, 'y': -1})
    page.evaluate("__pads[0].axes = [0, 0, 1, 0]"); page.wait_for_timeout(100)
    verifie('J2 vise au stick droit', page.evaluate('!joueurs[1].viseeAuto'))
    page.evaluate("__appui(0, 1, true)"); page.wait_for_timeout(100); page.evaluate("__appui(0, 1, false)")
    b = page.evaluate('joueurs.map(j => performance.now() < j.shieldActiveUntil)')
    verifie('bouclier manette -> J2 seul : %s' % b, b == [False, True])
    page.keyboard.press('Shift'); page.wait_for_timeout(100)
    b = page.evaluate('joueurs.map(j => performance.now() < j.shieldActiveUntil)')
    verifie('Shift -> bouclier J1 : %s' % b, b[0])
    nav.close()
print('\n'.join(erreurs) if erreurs else 'aucune erreur console')
sys.exit(1 if erreurs or echecs else 0)
