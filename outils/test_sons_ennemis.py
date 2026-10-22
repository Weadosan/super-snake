#!/usr/bin/env python3
"""Sons des ennemis : chaque skin d'ennemi a son propre bruit de mort, et le boss touché a un son propre à son skin
qui monte quand il enrage. On espionne l'API audio (oscillateurs, bruits, filtres) pour comparer les sons entre eux,
on vérifie que le son coupé ne crée rien, qu'une explosion de 20 ennemis ne lance que quelques sons (vieux PC),
puis on joue de vrais tirs sur des ennemis et un boss en partie. 0 erreur console attendue.
Usage : python3 test_sons_ennemis.py chemin/vers/snake.html"""
import sys, os, json
from playwright.sync_api import sync_playwright

CHROME = os.environ.get('CHROME_PATH') or next((c for c in ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium'] if os.path.exists(c)), None)
fichier = os.path.abspath(sys.argv[1])
erreurs = []
skins = ['urchin', 'ghost', 'pixel', 'slime', 'bat', 'jelly', 'eye', 'drone', 'spider', 'crab', 'pumpkin', 'mushroom', 'circle']

# journal de tout ce que le jeu demande à l'API audio
ESPION = """
window.journalAudio = [];
const noter = x => window.journalAudio.push(x);
const startOsc = OscillatorNode.prototype.start;
OscillatorNode.prototype.start = function (...a) { noter('osc:' + this.type); return startOsc.apply(this, a); };
const startSrc = AudioBufferSourceNode.prototype.start;
AudioBufferSourceNode.prototype.start = function (...a) { noter('bruit'); return startSrc.apply(this, a); };
const valeur = AudioParam.prototype.setValueAtTime;
AudioParam.prototype.setValueAtTime = function (v, t) { noter('v:' + Math.round(v)); return valeur.call(this, v, t); };
const rampe = AudioParam.prototype.exponentialRampToValueAtTime;
AudioParam.prototype.exponentialRampToValueAtTime = function (v, t) { noter('r:' + Math.round(v)); return rampe.call(this, v, t); };
"""

def son(page, appel):
    """journal audio d'un appel, avec un hasard fixe pour comparer les sons d'un skin à l'autre"""
    return page.evaluate("""appel => {
        journalAudio.length = 0; dernierSonMort = 0; debutFenetreMorts = 0; dernierSonBoss = 0;
        const hasard = Math.random; Math.random = () => 0.5;
        try { eval(appel); } finally { Math.random = hasard; }
        return journalAudio.slice();
    }""", appel)

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=CHROME, args=['--autoplay-policy=no-user-gesture-required'])
    page = nav.new_page(viewport={'width': 900, 'height': 700})
    page.add_init_script(ESPION)
    page.on('pageerror', lambda e: erreurs.append('pageerror: ' + str(e)))
    page.on('console', lambda m: erreurs.append('console: ' + m.text) if m.type == 'error' else None)
    page.goto('file://' + fichier)
    page.wait_for_timeout(500)
    page.keyboard.press('Space')
    page.wait_for_timeout(3200)
    page.evaluate('isMuted = false')

    # 1) un bruit de mort différent par skin, et un son de boss touché différent par skin
    morts, boss = {}, {}
    for s in skins:
        page.evaluate(f"enemySkin = '{s}'")
        morts[s] = son(page, "playEnemyDeathSound({hp: 0, maxHp: 1})")
        boss[s] = son(page, "playBossHitSound({hp: 50, maxHp: 100})")
        nb = lambda j: sum(1 for x in j if x.startswith('osc') or x == 'bruit')
        print(f'{s:9s} mort : {nb(morts[s])} sources   boss touché : {nb(boss[s])} sources')
        assert 1 <= nb(morts[s]) <= 6, s + ' : son de mort vide ou trop lourd'
        assert 1 <= nb(boss[s]) <= 4, s + ' : son de boss vide ou trop lourd'
    assert len({json.dumps(v) for v in morts.values()}) == len(skins), 'deux skins ont le même son de mort'
    assert len({json.dumps(v) for v in boss.values()}) == len(skins), 'deux boss ont le même son quand on les touche'

    # 2) le boss enragé sonne plus aigu
    page.evaluate("enemySkin = 'ghost'")
    calme = son(page, "playBossHitSound({hp: 100, maxHp: 100})")
    enrage = son(page, "playBossHitSound({hp: 1, maxHp: 100})")
    assert calme != enrage, 'le son du boss ne change pas quand il enrage'

    # 3) son coupé : rien n'est créé
    page.evaluate('isMuted = true')
    assert son(page, "playEnemyDeathSound({maxHp: 1}); playBossHitSound({hp: 1, maxHp: 2}); playBossDeathSound()") == []
    page.evaluate('isMuted = false')

    # 4) 20 morts à la file (bouclier, laser) : quelques sons seulement, encore moins en mode Performances
    nb_sons = {}
    for perf in (0, 2):
        page.evaluate(f"niveauPerf = {perf}; enemySkin = 'slime'")
        nb_sons[perf] = page.evaluate("""() => {
            journalAudio.length = 0; dernierSonMort = 0; debutFenetreMorts = 0;
            // morts espacées de 45 ms sur 0,9 s : seul le plafond par quart de seconde limite
            const vraiNow = performance.now.bind(performance), depart = vraiNow() + 1000;
            for (let i = 0; i < 20; i++) { performance.now = () => depart + i * 45; playEnemyDeathSound({maxHp: 1}); }
            performance.now = vraiNow;
            dernierSonMort = 0; debutFenetreMorts = 0;
            return journalAudio.filter(x => x.startsWith('osc') || x === 'bruit').length / 2;
        }""")
        print(f'mode Performances {perf} : {nb_sons[perf]:.0f} sons pour 20 morts à la file')
    assert 0 < nb_sons[2] < nb_sons[0] <= 16
    # 20 morts dans la même image (buff explosion) : un seul son, l'explosion du buff fait le reste
    n = page.evaluate("""() => {
        journalAudio.length = 0; dernierSonMort = 0; debutFenetreMorts = 0;
        for (let i = 0; i < 20; i++) playEnemyDeathSound({maxHp: 1});
        return journalAudio.filter(x => x.startsWith('osc') || x === 'bruit').length / 2;
    }""")
    assert n == 1, n
    page.evaluate('niveauPerf = 0')

    # 5) en vraie partie : tirs sur des ennemis normaux et sur un boss, pour chaque skin
    for s in skins:
        n = page.evaluate(f"""() => {{
            enemySkin = '{s}'; enemies = []; spawnEnemy(); spawnBoss();
            journalAudio.length = 0; dernierSonMort = 0; debutFenetreMorts = 0; dernierSonBoss = 0;
            const normal = enemies.findIndex(e => !e.isBoss);
            enemies[normal].hp = 1; enemies[normal].frozenUntil = 0;
            damageEnemyByIndex(normal);
            const tue = journalAudio.length;
            const b = enemies.findIndex(e => e.isBoss);
            enemies[b].frozenUntil = 0;
            damageEnemyByIndex(b);
            const touche = journalAudio.length - tue;
            dernierSonBoss = 0;
            enemies[b].hp = 1; damageEnemyByIndex(enemies.findIndex(e => e.isBoss));
            return [tue, touche, enemies.some(e => e.isBoss)];
        }}""")
        assert n[0] > 0 and n[1] > 0 and not n[2], s + ' : ' + str(n)
    print('vraie partie : mort, boss touché et boss vaincu sonnent pour les', len(skins), 'skins')
    page.wait_for_timeout(600)
    nav.close()

if erreurs:
    print('\n'.join(erreurs))
    sys.exit(1)
print('OK, 0 erreur console')
