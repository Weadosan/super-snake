// ============================================================
// --- Joueurs : un ou deux serpents (mode solo ou coop) ---
// ============================================================
// Tout l'état propre à un serpent vit dans un objet joueur. Les anciens noms globaux
// (snake, direction, lives, shieldActiveUntil...) restent utilisables partout : ce sont
// des raccourcis vers le "joueur actif". Pour agir sur un joueur précis, on passe par
// avecJoueur(j, () => ...), qui en fait le joueur actif le temps de l'appel.
// Hors de ces appels, le joueur actif est toujours le joueur 1.

const champsJoueur = [
  'snake', 'prevSnake', 'direction', 'nextDirection', 'directionLockedThisTick',
  'lives', 'pendingGrowth', 'tongueUntil', 'snakeHistory',
  'invulnerableUntil', 'shieldActiveUntil', 'shieldReadyAt',
  'boosting', 'tickInterval', 'lastTickTime',
  'turretPixelPos', 'mouseX', 'mouseY', 'autoAimAngle', 'autoFireCooldown',
  'laserBuffUntil', 'autoAimBuffUntil', 'buffInvincibleUntil', 'doublePointsUntil',
  'trailPoints', 'interpolatedPositionsCache', 'clignementJusqua', 'prochainClignement',
  'viseeManuelleJusqua', 'cibleAuto', 'rollbackRecul', 'rollbackFin', 'blessures'
];

// --- Mode de jeu (sauvegardé) ---
const cleStockageModeJeu = 'snakeModeJeu';
let modeJeu = chargerModeJeu(); // 'solo' | 'coop'

function chargerModeJeu() {
  try {
    return localStorage.getItem(cleStockageModeJeu) === 'coop' ? 'coop' : 'solo';
  } catch (e) {
    return 'solo';
  }
}

function enCoop() {
  return modeJeu === 'coop';
}

// position de départ et direction par défaut (si personne n'appuie pendant le compte à rebours)
function departJoueur(numero) {
  if (!enCoop()) {
    return {cases: [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}], direction: {x: 1, y: 0}};
  }
  return numero === 0
    ? {cases: [{x: 6, y: 6}, {x: 5, y: 6}, {x: 4, y: 6}], direction: {x: 1, y: 0}}
    : {cases: [{x: 13, y: 13}, {x: 14, y: 13}, {x: 15, y: 13}], direction: {x: -1, y: 0}};
}

function nouveauJoueur(numero) {
  const depart = departJoueur(numero);
  return {
    numero, // 0 = joueur 1, 1 = joueur 2
    nom: 'J' + (numero + 1),
    elimine: false, // coop : plus de vies, en attente d'un cœur ramassé par le coéquipier
    reanimeA: 0,
    directionDepart: depart.direction,
    // visée automatique sur l'ennemi le plus proche (joueur 2 au clavier, sans souris)
    viseeAuto: numero === 1,
    ennemis: 0, // stats individuelles (affichées en coop)
    pommes: 0,

    // le serpent démarre avec 3 segments côte à côte pour être vu en entier dès le départ
    snake: depart.cases.map(c => ({...c})),
    prevSnake: depart.cases.map(c => ({...c})),
    direction: {x: 0, y: 0},
    nextDirection: {x: 0, y: 0},
    directionLockedThisTick: false, // un seul virage entre deux déplacements (évite le demi-tour en 2 appuis rapides)
    lives: maxLives + bonusProgression('coeur'), // + Cœur de réserve (js/03-progression.js)
    pendingGrowth: 0, // nombre de prochains ticks où la queue ne doit pas être retirée (croissance différée)
    tongueUntil: 0,
    snakeHistory: [], // {time, snake, direction, nextDirection} sur les ~6 dernières secondes
    invulnerableUntil: 0, // timestamp jusqu'à laquelle les touches ennemies sont ignorées
    shieldActiveUntil: 0,
    shieldReadyAt: 0,
    boosting: false,
    tickInterval: baseTickInterval,
    lastTickTime: performance.now(),
    turretPixelPos: {x: 0, y: 0},
    mouseX: largeurPlateau / 2,
    mouseY: 0,
    autoAimAngle: null,
    autoFireCooldown: 0,
    laserBuffUntil: 0,
    autoAimBuffUntil: 0,
    buffInvincibleUntil: 0,
    doublePointsUntil: 0,
    trailPoints: [],
    interpolatedPositionsCache: [],
    clignementJusqua: 0,
    prochainClignement: 0,
    viseeManuelleJusqua: 0, // option Visée auto : le joueur a visé lui-même jusqu'à cet instant
    cibleAuto: null, // option Visée auto : ennemi accroché par le viseur
    rollbackRecul: 0, // recul (ms) du dernier rollback, pour enchaîner plus loin
    rollbackFin: -Infinity, // fin de l'animation du dernier rollback
    blessures: [] // {k, debut, cote} : cicatrices définitives, k = rang du segment compté depuis le bout de la queue
  };
}

let joueurs = [nouveauJoueur(0)];
let joueurActif = joueurs[0];

champsJoueur.forEach(nom => {
  Object.defineProperty(globalThis, nom, {
    get() { return joueurActif[nom]; },
    set(valeur) { joueurActif[nom] = valeur; },
    configurable: true
  });
});

function creerJoueurs() {
  joueurs = enCoop() ? [nouveauJoueur(0), nouveauJoueur(1)] : [nouveauJoueur(0)];
  joueurActif = joueurs[0];
}

// couleurs du thème pour ce joueur (le joueur 2 a son propre serpent et sa propre tourelle)
const palettesJ2 = {};
function paletteJoueur(j) {
  const theme = themes[currentThemeName];
  if (j.numero === 0) return paletteSkin(theme, currentThemeName, cleSkinJoueur(j)); // skin du serpent (js/08-skins-serpent.js)
  if (!palettesJ2[currentThemeName]) {
    palettesJ2[currentThemeName] = Object.assign({}, theme, {
      snakeBody: theme.snakeBody2,
      snakeHead: theme.snakeHead2,
      turretBody: theme.snakeBody2
    });
  }
  return palettesJ2[currentThemeName];
}

function couleurJoueur(j) {
  const skin = skinsSerpent[cleSkinJoueur(j)];
  return skin.corps ? couleurPrincipaleSkin(skin) : paletteJoueur(j).snakeBody;
}

// exécute fn avec j comme joueur actif (et ses couleurs), puis revient au joueur précédent
function avecJoueur(j, fn) {
  const avant = joueurActif;
  const themeAvant = currentTheme;
  joueurActif = j;
  currentTheme = paletteJoueur(j);
  try {
    return fn();
  } finally {
    // (si fn a relancé une partie, l'ancien joueur n'existe plus : on revient au joueur 1)
    joueurActif = joueurs.includes(avant) ? avant : joueurs[0];
    currentTheme = themeAvant;
  }
}

function joueursEnJeu() {
  return joueurs.filter(j => !j.elimine);
}

// segments de tous les serpents encore en jeu (pour placer pommes, ennemis, cœurs loin d'eux)
function tousLesSegments() {
  if (joueurs.length === 1) return joueurs[0].snake;
  return joueursEnJeu().reduce((tous, j) => tous.concat(j.snake), []);
}

function longueurMax() {
  return joueursEnJeu().reduce((m, j) => Math.max(m, j.snake.length), 0);
}

// tête (en pixels) du serpent en jeu le plus proche d'un point
function teteLaPlusProche(x, y) {
  let meilleure = null;
  let meilleureDist = Infinity;
  joueursEnJeu().forEach(j => {
    const cx = j.snake[0].x * gridSize + gridSize / 2;
    const cy = j.snake[0].y * gridSize + gridSize / 2;
    const d = Math.hypot(cx - x, cy - y);
    if (d < meilleureDist) {
      meilleureDist = d;
      meilleure = {x: cx, y: cy};
    }
  });
  return meilleure;
}

// le joueur actif n'a plus de vie (ou a percuté un mur sans rollback possible) :
// fin de partie en solo ; en coop il sort, jusqu'à ce que son coéquipier ramasse un cœur
function eliminerJoueur() {
  if (tutoActif()) {
    tutoSauverJoueur(); // on ne perd pas pendant le tutoriel
    return;
  }
  if (!enCoop()) {
    endGame();
    return;
  }
  const j = joueurActif;
  if (j.elimine) return;
  j.elimine = true;
  j.lives = 0;
  j.boosting = false;
  j.tickInterval = baseTickInterval;
  if (rollbackPlayback && rollbackPlayback.joueur === j) rollbackPlayback = null;

  // le serpent éclate en particules de sa couleur
  const couleur = couleurJoueur(j);
  j.snake.forEach((s, i) => {
    if (i % 2 === 0) spawnParticles(s.x * gridSize + gridSize / 2, s.y * gridSize + gridSize / 2, couleur, 4);
  });
  const tete = j.snake[0];
  spawnPopup(tete.x * gridSize + gridSize / 2, tete.y * gridSize + gridSize / 2, j.nom + ' KO 💀', '#ff5252');
  triggerShake(8);
  declencherFlash('#ff1744');
  playLoseHeartSound();
  updateHeartsDisplay();
  majCompteurSegments();

  if (!joueursEnJeu().length) {
    endGame();
  } else {
    spawnPopup(largeurPlateau / 2, hauteurPlateau / 2, 'Un ❤️ réanime ' + j.nom + ' !', '#ff6b6b');
  }
}

// cherche 3 cases libres alignées, loin des ennemis et des murs, pour faire revenir un serpent
function placeReanimation() {
  let meilleure = null;
  let meilleureDist = -Infinity;
  for (let essai = 0; essai < 80; essai++) {
    const x = 4 + Math.floor(Math.random() * (tileCount - 8));
    const y = 3 + Math.floor(Math.random() * (tileCount - 6));
    const sens = x < tileCount / 2 ? 1 : -1; // repart vers le centre
    const cases = [0, 1, 2].map(k => ({x: x - k * sens, y}));
    if (cases.some(c => caseOccupee(c.x, c.y))) continue;
    const cx = x * gridSize + gridSize / 2;
    const cy = y * gridSize + gridSize / 2;
    const distEnnemi = enemies.reduce((m, e) => Math.min(m, Math.hypot(e.x - cx, e.y - cy)), Infinity);
    if (distEnnemi > meilleureDist) {
      meilleureDist = distEnnemi;
      meilleure = {cases, direction: {x: sens, y: 0}};
    }
    if (distEnnemi > 140) break;
  }
  return meilleure;
}

function reanimerJoueur(j) {
  const place = placeReanimation();
  if (!place) return false;
  const now = performance.now();
  j.elimine = false;
  j.lives = 1;
  j.snake = place.cases;
  j.prevSnake = place.cases.map(c => ({...c}));
  j.direction = {...place.direction};
  j.nextDirection = {...place.direction};
  j.directionLockedThisTick = false;
  j.pendingGrowth = 0;
  j.snakeHistory = [];
  j.blessures = []; // nouveau serpent : pas de cicatrice
  j.trailPoints = [];
  j.interpolatedPositionsCache = [];
  j.invulnerableUntil = now + 2000; // petit répit pour reprendre ses repères
  j.lastTickTime = now;
  j.reanimeA = now;

  const tete = j.snake[0];
  const cx = tete.x * gridSize + gridSize / 2;
  const cy = tete.y * gridSize + gridSize / 2;
  spawnParticles(cx, cy, couleurJoueur(j), 24);
  spawnShockwave(cx, cy, couleurJoueur(j), 90);
  spawnPopup(cx, cy - 14, j.nom + ' est de retour !', couleurJoueur(j));
  majCompteurSegments();
  return true;
}

// le joueur actif ramasse le cœur bonus (en marchant dessus ou en tirant dessus) :
// +1 vie, ou en coop réanimation du coéquipier éliminé
function ramasserCoeur(x, y) {
  stats.heartsCollected++;
  succesCoeur();
  const aReanimer = joueurs.find(j => j.elimine);
  if (aReanimer && !gameOver && reanimerJoueur(aReanimer)) {
    spawnPopup(x, y, '❤️ ' + aReanimer.nom + ' réanimé !', '#ff6b6b');
  } else {
    lives += 1;
    spawnPopup(x, y, '+1 ❤️', '#ff6b6b');
  }
  updateHeartsDisplay();
  spawnParticles(x, y, '#ff6b6b', 12);
  playHeartPickupSound();
  heartPickup = null;
}

// change de mode (solo / coop), le mémorise et relance une partie
function changerModeJeu(mode) {
  modeJeu = mode === 'coop' ? 'coop' : 'solo';
  try {
    localStorage.setItem(cleStockageModeJeu, modeJeu);
  } catch (e) {
    // stockage indisponible : le mode n'est simplement pas mémorisé
  }
  majBoutonMode();
  initHighscores();
  init();
}

// passe à la difficulté suivante (Facile, Normal, Difficile), la mémorise et relance une partie
function changerDifficulte(niveau) {
  if (!niveauxDifficulte[niveau]) {
    niveau = ordreDifficultes[(ordreDifficultes.indexOf(difficulte) + 1) % ordreDifficultes.length];
  }
  difficulte = niveau;
  try {
    localStorage.setItem(cleStockageDifficulte, difficulte);
  } catch (e) {
    // stockage indisponible : la difficulté n'est simplement pas mémorisée
  }
  majBoutonMode();
  initHighscores();
  init();
}

function majBoutonMode() {
  const bouton = document.getElementById('modeBtn');
  bouton.textContent = enCoop() ? '👥 Coop (2 joueurs)' : '👤 Solo';
  bouton.classList.toggle('active', enCoop());
  bouton.title = enCoop() ? 'Repasser en solo' : 'Jouer à 2 en coopération';
  document.body.classList.toggle('mode-coop', enCoop());
  const d = reglagesDifficulte();
  document.getElementById('highscoreTitre').textContent = (enCoop() ? '🏆 Meilleurs scores coop' : '🏆 Meilleurs scores') + ' (' + d.nom + ')';
  const boutonDiff = document.getElementById('difficulteBtn');
  boutonDiff.textContent = d.icone + ' ' + d.nom;
  boutonDiff.title = 'Difficulté : ' + d.nom + ' (cliquer pour changer, relance la partie)';
  document.getElementById('difficulteHud').textContent = 'Difficulté : ' + d.nom;
  // option visée auto : proposée seulement en Facile
  const boutonVisee = document.getElementById('viseeAutoBtn');
  boutonVisee.style.display = difficulte === 'facile' ? '' : 'none';
  boutonVisee.textContent = '🎯 Visée auto : ' + (optionViseeAuto ? 'oui' : 'non');
  boutonVisee.classList.toggle('active', optionViseeAuto);
  boutonVisee.title = 'La tourelle vise seule l\'ennemi le plus proche, tu tires toi-même';
  // durées des buffs (plus longues en Facile) dans la légende (la Boutique les recalcule à l'affichage)
  document.querySelectorAll('#legendList li[data-buff]').forEach(li => {
    li.textContent = texteAvecDureeBuff(li.textContent, li.dataset.buff);
  });
}
