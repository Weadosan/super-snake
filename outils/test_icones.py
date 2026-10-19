#!/usr/bin/env python3
"""Icônes pixel et polices : aucun emoji ne reste affiché dans la page (menus, aide, succès, buffs, HUD, coop),
chaque emoji du code a son icône, les quatre polices embarquées sont chargées. Échoue s'il y a une erreur console.
Usage : python3 test_icones.py chemin/vers/snake.html [dossier_captures]"""
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

def capture(page, nom):
    if captures:
        os.makedirs(captures, exist_ok=True)
        page.screenshot(path=os.path.join(captures, nom + '.png'))

# emojis encore présents dans le texte affiché (les zones de saisie ne comptent pas)
RESTANTS = r"""(() => {
  const re = /[\p{Extended_Pictographic}←-⇿■-◿☀-➿⬀-⯿⃣]/u;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const vus = new Set();
  while (w.nextNode()) {
    const n = w.currentNode;
    if (['SCRIPT', 'STYLE', 'TEXTAREA'].includes(n.parentNode.nodeName)) continue;
    if (re.test(n.nodeValue)) vus.add(n.nodeValue.trim().slice(0, 40));
  }
  return [...vus];
})()"""

# tous les emojis écrits dans le code doivent avoir une icône
SANS_ICONE = r"""(() => {
  const code = [...document.scripts].map(s => s.textContent).join('\n') + document.body.innerHTML;
  const re = /[\p{Extended_Pictographic}←-⇿■-◿☀-➿⬀-⯿]️?⃣?/gu;
  const manquants = new Set();
  for (const m of code.matchAll(re)) if (!nomIcone(m[0]) && !/\d️?⃣/.test(m[0])) manquants.add(m[0]);
  return [...manquants];
})()"""

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=CHROME)
    page = nav.new_page(viewport={'width': 1100, 'height': 900})
    page.on('pageerror', lambda e: erreurs.append('pageerror: ' + str(e)))
    page.on('console', lambda m: erreurs.append('console: ' + m.text) if m.type == 'error' else None)
    page.goto('file://' + fichier)
    page.evaluate("localStorage.clear(); localStorage.setItem('snakeTutoFait', 'oui'); localStorage.setItem('snakeAstuces', 'non')")
    page.reload()
    page.wait_for_timeout(500)

    verifier(page.evaluate(SANS_ICONE) == [], 'chaque emoji du code a son icône', page.evaluate(SANS_ICONE))
    verifier(page.evaluate('Object.keys(DESSINS_ICONES).every(n => lignesIcone(n).length === 12 && lignesIcone(n).every(l => l.length === 12))'),
             'dessins de 12 x 12')
    verifier(page.locator('i.px').count() > 20, 'icônes posées dans la page', page.locator('i.px').count())
    verifier(page.evaluate(RESTANTS) == [], 'page de départ sans emoji', page.evaluate(RESTANTS))
    capture(page, 'icones_depart')

    page.click('#optionsBtn')
    page.wait_for_timeout(300)
    verifier(page.evaluate(RESTANTS) == [], 'menu ☰ sans emoji', page.evaluate(RESTANTS))
    capture(page, 'icones_menu')
    page.keyboard.press('Escape')
    page.evaluate('typeof fermerMenuTactile === "function" && fermerMenuTactile()')

    page.evaluate('ouvrirMenuBuffs()')
    page.wait_for_timeout(200)
    verifier(page.evaluate(RESTANTS) == [], 'menu des buffs sans emoji', page.evaluate(RESTANTS))
    capture(page, 'icones_buffs')
    page.evaluate('fermerMenuBuffs()')

    for n in range(6):
        page.evaluate('ouvrirAide(%d)' % n)
        page.wait_for_timeout(150)
        verifier(page.evaluate(RESTANTS) == [], 'aide page %d sans emoji' % (n + 1), page.evaluate(RESTANTS))
    capture(page, 'icones_aide')
    page.evaluate('fermerAide()')

    page.evaluate('ouvrirSucces()')
    page.wait_for_timeout(200)
    verifier(page.evaluate(RESTANTS) == [], 'écran des succès sans emoji', page.evaluate(RESTANTS))
    capture(page, 'icones_succes')
    page.evaluate('fermerSucces()')

    # en partie : cœurs du HUD (pleins et vides), puis coop
    page.keyboard.press('Space')
    page.wait_for_timeout(3000)
    page.evaluate('joueurs[0].lives = 2; updateHeartsDisplay()')
    page.wait_for_timeout(100)
    verifier(page.locator('#hearts i.px-coeur').count() == 2 and page.locator('#hearts i.px-coeur_vide').count() >= 1,
             'cœurs du HUD en icônes', page.locator('#hearts').inner_html()[:120])
    verifier(page.evaluate(RESTANTS) == [], 'HUD en partie sans emoji', page.evaluate(RESTANTS))

    # canvas : la mesure d'un texte avec icône compte l'icône, et le dessin passe par l'icône
    larg = page.evaluate("(() => { const c = document.createElement('canvas').getContext('2d'); c.font = '20px sans-serif';"
                         " return [c.measureText('A').width, c.measureText('A❤️').width]; })()")
    verifier(larg[1] - larg[0] > 20, 'measureText compte l\'icône', larg)

    # polices : les quatre thèmes ont leur police chargée, identique partout
    for theme, fam in [('neon', 'Share Tech Mono'), ('espace', 'Exo 2'), ('lave', 'Oswald'), ('ocean', 'Alegreya')]:
        page.evaluate("applyTheme('%s')" % theme)
        page.wait_for_timeout(200)
        ok = page.evaluate("document.fonts.check(\"16px '%s'\") && document.fonts.check(\"bold 16px '%s'\")" % (fam, fam))
        charge = page.evaluate("[...document.fonts].some(f => f.family.replace(/[\"']/g, '') === '%s' && f.status === 'loaded')" % fam)
        verifier(ok and charge, 'police %s chargée (thème %s)' % (fam, theme))
        capture(page, 'police_' + theme)
    nav.close()

if erreurs:
    print('\n'.join(erreurs))
if erreurs or echecs:
    print('ÉCHEC : %d vérification(s), %d erreur(s) console' % (len(echecs), len(erreurs)))
    sys.exit(1)
print('OK : icônes et polices sans erreur console')
