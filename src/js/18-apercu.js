// ============================================================
// --- Aperçu du thème (map) et des ennemis dans le menu ☰ ---
// ============================================================
// Petit canvas animé : le décor du thème choisi, ses pommes, le serpent avec son skin et quelques ennemis
// du skin choisi (dont un boss). Il réutilise les fonctions de dessin du jeu en leur prêtant un instant son contexte.
const apercuCanvas = document.getElementById('apercuCarte');
const apercuCtx = apercuCanvas.getContext('2d');
const zoomApercu = 1.5; // on regarde le centre de la carte, un peu grossi
let apercuActif = false;

// ennemis de démonstration : chacun tourne sur une petite orbite autour de son point
const ennemisApercu = [
  {cx: 140, cy: 150, rx: 26, ry: 14, vitesse: 1.1, dur: false},
  {cx: 265, cy: 140, rx: 18, ry: 22, vitesse: -0.9, dur: true},
  {cx: 140, cy: 262, rx: 22, ry: 14, vitesse: 0.8, dur: false},
  {cx: 262, cy: 272, rx: 8, ry: 6, vitesse: 0.5, boss: true}
].map((d, i) => ({
  ...d,
  x: d.cx, y: d.cy, vx: 0, vy: 0,
  radius: d.boss ? bossRadius : d.dur ? enemyRadius + 2 : enemyRadius,
  hp: d.boss ? reglagesDifficulte().pvBoss : d.dur ? 2 : 1,
  maxHp: d.boss ? reglagesDifficulte().pvBoss : d.dur ? 2 : 1,
  isBoss: !!d.boss,
  hitFlashUntil: 0,
  frozenUntil: 0,
  neA: 0,
  phase: i * 1.7
}));

// serpent de démonstration : il fait le tour des pommes, une case toutes les pasSerpentApercu ms
const boucleSerpentApercu = [];
for (let x = 7; x <= 12; x++) boucleSerpentApercu.push({x, y: 8});
for (let y = 9; y <= 12; y++) boucleSerpentApercu.push({x: 12, y});
for (let x = 11; x >= 7; x--) boucleSerpentApercu.push({x, y: 12});
for (let y = 11; y >= 9; y--) boucleSerpentApercu.push({x: 7, y});
const longueurSerpentApercu = 7;
const pasSerpentApercu = 170;
let serpentApercu = null;

function dessinerSerpentApercu(now) {
  const n = boucleSerpentApercu.length;
  const pas = Math.floor(now / pasSerpentApercu);
  const casesAuPas = k => Array.from({length: longueurSerpentApercu}, (_, i) => boucleSerpentApercu[(((k - i) % n) + n) % n]);
  const cases = casesAuPas(pas);
  const dir = {x: cases[0].x - cases[1].x, y: cases[0].y - cases[1].y};
  if (!serpentApercu) serpentApercu = joueurModele(cases, dir);
  serpentApercu.snake = cases;
  serpentApercu.prevSnake = casesAuPas(pas - 1);
  serpentApercu.direction = dir;
  // la traînée ne se dessine que pendant une partie : on fait comme si
  const attente = waitingToStart, decompte = countdownActive, fini = gameOver;
  waitingToStart = countdownActive = gameOver = false;
  try {
    dessinerSerpentModele(serpentApercu, (now % pasSerpentApercu) / pasSerpentApercu, cleSkinJoueur({numero: 0}));
    // sa tourelle, qui vise le boss
    const pos = serpentApercu.turretPixelPos;
    const boss = ennemisApercu[ennemisApercu.length - 1];
    if (pos) dessinerTourelleModele(pos.x, pos.y, Math.atan2(boss.y - pos.y, boss.x - pos.x), cleTourelleJoueur({numero: 0}));
  } finally {
    waitingToStart = attente;
    countdownActive = decompte;
    gameOver = fini;
  }
}

function majLegendeApercu() {
  const theme = document.querySelector('.theme-btn.active');
  const skin = document.querySelector('.skin-btn.active');
  const serpent = skinsSerpent[cleSkinJoueur({numero: 0})];
  document.getElementById('apercuLegende').textContent =
    'Aperçu : ' + (theme ? theme.textContent.trim() : '') + ' · ' + (skin ? skin.textContent.trim() : '') +
    ' · ' + serpent.icone + ' ' + serpent.nom + ' · ' + skinsTourelle[cleTourelleJoueur({numero: 0})].icone + ' ' +
    skinsTourelle[cleTourelleJoueur({numero: 0})].nom;
}

function dessinerApercu() {
  const now = performance.now();
  const t = now / 1000;
  ennemisApercu.forEach(e => {
    const a = t * e.vitesse + e.phase;
    const x = e.cx + Math.cos(a) * e.rx;
    const y = e.cy + Math.sin(a) * e.ry;
    e.vx = x - e.x;
    e.vy = y - e.y;
    e.x = x;
    e.y = y;
    if (!e.isBoss) e.color = e.dur ? currentTheme.enemyTough : currentTheme.enemyNormal;
    else e.color = bossColor;
  });

  // le jeu dessine dans « ctx » et lit « enemies » : on les prête à l'aperçu le temps d'une image
  const ctxJeu = ctx, ennemisJeu = enemies, pauseJeu = isPaused;
  ctx = apercuCtx;
  enemies = ennemisApercu;
  isPaused = false; // le décor reste animé même si la partie est en pause derrière le menu
  try {
    ctx.save();
    ctx.fillStyle = currentTheme.canvasBg;
    ctx.fillRect(0, 0, apercuCanvas.width, apercuCanvas.height);
    ctx.translate(apercuCanvas.width / 2, apercuCanvas.height / 2);
    ctx.scale(zoomApercu, zoomApercu);
    ctx.translate(-apercuCanvas.width / 2, -apercuCanvas.height / 2);
    drawBackgroundPattern();
    dessinerDecorAnime();
    dessinerParticulesAmbiance();
    // les trois pommes du thème
    [['normale', 165], ['or', 200], ['bleue', 235]].forEach(([type, x]) => {
      if (!dessinerPommeTheme(type, x, 200, 9)) {
        fillRadialCircle(x, 200, 8, type === 'or' ? '#ffd700' : type === 'bleue' ? '#2979ff' : currentTheme.food, false);
      }
    });
    dessinerSerpentApercu(now);
    drawEnemies();
    ctx.restore();
  } finally {
    ctx = ctxJeu;
    enemies = ennemisJeu;
    isPaused = pauseJeu;
  }
}

function boucleApercu() {
  if (!document.body.classList.contains('menu-tactile-ouvert')) {
    apercuActif = false;
    return;
  }
  dessinerApercu();
  requestAnimationFrame(boucleApercu);
}

// appelé à l'ouverture du menu ☰
function demarrerApercu() {
  majLegendeApercu();
  if (apercuActif) return;
  apercuActif = true;
  requestAnimationFrame(boucleApercu);
}

document.querySelectorAll('.theme-btn, .skin-btn').forEach(b => b.addEventListener('click', majLegendeApercu));
