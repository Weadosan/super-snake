const tileCount = largeurPlateau / gridSize;

// --- Difficulté (Facile / Normal / Difficile), mémorisée ; Difficile = le jeu d'origine ---
// vitesse : du serpent et des ennemis ; chanceResistant : ennemis à 2 coups ;
// killsCoeur : kills [min, max] avant un cœur bonus ; rayonCoeur : taille du cœur à attraper ;
// pvBoss : coups pour tuer le boss ; dureeBuffs : multiplicateur de durée des buffs ;
// chancePommeBleue : chance qu'un ennemi tué laisse une pomme bleue ; coutRollback : cœurs perdus par rollback
const niveauxDifficulte = {
  facile: {nom: 'Facile', icone: '🟢', vitesse: 0.8, chanceResistant: 0, killsCoeur: [10, 15], rayonCoeur: 16,
    pvBoss: 6, dureeBuffs: 1.5, chancePommeBleue: 0.1, coutRollback: 2},
  normal: {nom: 'Normal', icone: '🟡', vitesse: 0.9, chanceResistant: 0.15, killsCoeur: [15, 25], rayonCoeur: 12,
    pvBoss: 10, dureeBuffs: 1, chancePommeBleue: 0.05, coutRollback: 3},
  difficile: {nom: 'Difficile', icone: '🔴', vitesse: 1, chanceResistant: 0.3, killsCoeur: [20, 30], rayonCoeur: 12,
    pvBoss: 10, dureeBuffs: 1, chancePommeBleue: 0.05, coutRollback: 3}
};
const ordreDifficultes = ['facile', 'normal', 'difficile'];
const cleStockageDifficulte = 'snakeDifficulte';
let difficulte = chargerDifficulte();

function chargerDifficulte() {
  try {
    const d = localStorage.getItem(cleStockageDifficulte);
    if (niveauxDifficulte[d]) return d;
  } catch (e) {
    // stockage indisponible : difficulté par défaut
  }
  return 'normal';
}

function reglagesDifficulte() {
  return niveauxDifficulte[difficulte];
}

// option du mode Facile : la tourelle vise seule l'ennemi le plus proche, le joueur tire lui-même (mémorisée)
const cleStockageViseeAuto = 'snakeViseeAuto';
let optionViseeAuto = chargerViseeAuto();

function chargerViseeAuto() {
  try {
    return localStorage.getItem(cleStockageViseeAuto) === 'oui';
  } catch (e) {
    return false;
  }
}

function optionViseeAutoActive() {
  return optionViseeAuto && difficulte === 'facile';
}

// vrai si ce joueur a une visée automatique : J2 au clavier, ou l'option du mode Facile
function viseeAutoActive(j) {
  return j.viseeAuto || optionViseeAutoActive();
}

// option Visée auto : le viseur s'accroche à l'ennemi proche du curseur (ou du stick) ;
// sans ennemi près du curseur on tire là où on vise, et si on ne vise plus depuis 1,5s
// la tourelle reprend l'ennemi le plus proche d'elle
const dureeViseeManuelle = 1500;
const rayonAimantVisee = 90; // px autour du curseur

// état propre à chaque serpent (snake, direction, vies, buffs, bouclier...) : voir 04-joueurs.js
let food, score, gameOver;
const maxLives = 3;
let killCount = 0;
let enemySkin = 'urchin'; // 'urchin', 'ghost', 'pixel', 'slime', 'bat', 'jelly', 'eye', 'drone', 'spider', 'crab',
                          // 'pumpkin', 'mushroom', ou 'circle' (défaut d'origine)

// --- Langue qui sort brièvement quand le serpent mange une pomme ---
const tongueDuration = 450;

// --- Rollback (filet de sécurité si on a plus de 3 cœurs) ---
const rollbackHistoryDuration = 6000; // assez d'historique pour des rollbacks enchaînés
const rollbackRewindMs = 1000; // recul du premier rollback, et durée de l'animation de marche arrière
const rollbackReculMax = 5000; // rollbacks enchaînés : chacun remonte 1s de plus, jusqu'à 5s
const rollbackFenetreEnchainement = 4000; // un rollback moins de 4s après la fin du précédent est « enchaîné »
// coût du rollback en cœurs : reglagesDifficulte().coutRollback (3, ou 2 en Facile)
let slowMotionUntil = 0;
let rollbackPlayback = null; // {frames, index, frameDuration, lastStepTime} pendant l'animation de marche arrière
const slowMotionDuration = 1200;
const slowMotionFactor = 0.3; // 30% de la vitesse normale pendant le ralenti

// --- Statistiques de la partie (affichées au game over) ---
let stats = {
  enemiesKilled: 0,
  applesEaten: 0,
  goldenApplesEaten: 0,
  blueApplesEaten: 0,
  heartsCollected: 0,
  shotsFired: 0,
  shotsHit: 0,
  maxSnakeLength: 1,
  startTime: 0
};
let killThreshold = randomKillThreshold();
let heartPickup = null; // {x, y, radius} ou null si aucun cœur bonus actif
const heartPickupRadius = 12;

// --- Pommes bonus (loot d'ennemi) ---
let lootApples = []; // liste de {x, y} en coordonnées de grille
const lootDropChance = 0.15; // 15% de chance qu'un ennemi tué laisse une pomme (entre 10 et 20%)

// --- Pomme en or (mobile, rare, grosse récompense) ---
let goldenApples = []; // liste de {x, y, vx, vy, radius, changeDirTimer} en coordonnées pixel (le boss peut en ajouter une à celle déjà présente)
const goldenAppleChance = 0.07; // 7% de chance qu'un ennemi tué en laisse une (entre 5 et 10%)
const goldenAppleSpeed = 0.045; // pixels par ms
const goldenAppleRadius = 9;

// --- Pomme bleue (mobile, rare, donne un buff aléatoire) ---
let blueApples = []; // liste de {x, y, vx, vy, radius, changeDirTimer, buffType} en coordonnées pixel
// chance d'apparition : reglagesDifficulte().chancePommeBleue (5%, ou 10% en Facile)
const blueAppleSpeed = 0.045;
const blueAppleRadius = 9;

// --- Buffs (déclenchés par la pomme bleue) ---
const buffTypes = ['freeze', 'laser', 'autoaim', 'explode', 'invincible', 'doublepoints'];

// --- Boutique : le joueur choisit quels buffs débloqués la pomme bleue peut donner (sauvegardé) ---
const buffDescriptions = {
  freeze: {icon: '❄️', nom: 'Gel des ennemis', detail: 'Fige tous les ennemis pendant 10s'},
  laser: {icon: '⚡', nom: 'Tourelle laser', detail: 'Les tirs deviennent un laser perçant pendant 30s'},
  autoaim: {icon: '🎯', nom: 'Auto-visée', detail: 'La tourelle vise et tire seule pendant 30s'},
  explode: {icon: '💥', nom: 'Explosion générale', detail: 'Détruit tous les ennemis, et ceux qui apparaissent pendant 5s'},
  invincible: {icon: '✨', nom: 'Invincibilité', detail: 'Aucun dégât pendant 10s'},
  doublepoints: {icon: '💰', nom: 'Points x2', detail: 'Points et croissance doublés pendant 30s'}
};
const cleStockageBuffs = 'snakeBuffsActifs';
let buffsActifs = chargerBuffsActifs();

function chargerBuffsActifs() {
  try {
    const raw = localStorage.getItem(cleStockageBuffs);
    if (raw) {
      const liste = JSON.parse(raw);
      if (Array.isArray(liste)) return buffTypes.filter(t => liste.includes(t));
    }
  } catch (e) {
    // stockage indisponible ou corrompu : tous les buffs restent actifs
  }
  return buffTypes.slice();
}

function sauverBuffsActifs() {
  try {
    localStorage.setItem(cleStockageBuffs, JSON.stringify(buffsActifs));
  } catch (e) {
    // ignore : le choix restera valable pour cette session seulement
  }
}

// capacités du serpent activables/désactivables dans le menu (bouclier et sprint)
const capaciteDescriptions = {
  bouclier: {icon: '🛡️', nom: 'Bouclier', detail: 'Maj ou bouton dédié : 2s sans dégât (recharge 15s)'},
  sprint: {icon: '🚀', nom: 'Sprint', detail: 'Espace ou Boost maintenu : le serpent accélère'},
  collisionJoueurs: {icon: '💥', nom: 'Collision entre joueurs (coop)', detail: "Toucher le serpent de l'autre coûte un cœur"}
};
const cleStockageCapacites = 'snakeCapacites';
let capacitesActives = chargerCapacites();

function chargerCapacites() {
  const parDefaut = {bouclier: true, sprint: true, collisionJoueurs: false};
  try {
    const raw = localStorage.getItem(cleStockageCapacites);
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') {
        return {bouclier: obj.bouclier !== false, sprint: obj.sprint !== false, collisionJoueurs: obj.collisionJoueurs === true};
      }
    }
  } catch (e) {
    // stockage indisponible ou corrompu : tout reste activé
  }
  return parDefaut;
}

function sauverCapacites() {
  try {
    localStorage.setItem(cleStockageCapacites, JSON.stringify(capacitesActives));
  } catch (e) {
    // ignore : le choix restera valable pour cette session seulement
  }
}

// tire un buff au hasard parmi ceux activés et débloqués dans la Boutique (null si aucun)
function tirerBuffAleatoire() {
  const dispo = buffsEnJeu();
  if (!dispo.length) return null;
  return dispo[Math.floor(Math.random() * dispo.length)];
}
// durées de base des buffs (ms), multipliées par reglagesDifficulte().dureeBuffs (x1,5 en Facile)
const dureesBuffs = {freeze: 10000, laser: 30000, autoaim: 30000, explode: 5000, invincible: 10000, doublepoints: 30000};
function dureeBuff(type) {
  return dureesBuffs[type] * reglagesDifficulte().dureeBuffs * (1 + bonusProgression('dureeBuffs'));
}
// remplace la durée écrite dans un texte (« 10s ») par la durée réelle du buff, ex. « 15s » en Facile
function texteAvecDureeBuff(texte, type) {
  return texte.replace(/\d+(,\d+)?s/, (dureeBuff(type) / 1000).toLocaleString('fr-FR') + 's');
}

let freezeIndicatorUntil = 0; // fenêtre active du gel : gèle aussi les ennemis qui apparaissent pendant ce délai
// durée pendant laquelle la zone reste "explosive" : dureeBuff('explode')
let explosionActiveUntil = 0; // fenêtre active de l'explosion : détruit aussi les ennemis qui apparaissent pendant ce délai

const autoFireInterval = 350; // ms entre deux tirs automatiques

// --- Ondes de choc visuelles (freeze, explosion) ---
let shockwaves = []; // {x, y, radius, maxRadius, color, life, maxLife}
let laserBeams = []; // {x1, y1, x2, y2, life, maxLife}

function randomKillThreshold() {
  const [min, max] = reglagesDifficulte().killsCoeur; // Difficile : entre 20 et 30 inclus
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Bouclier temporaire (touche Shift) ---
const shieldDuration = 2000; // ms d'invulnérabilité
const shieldCooldownDuration = 15000; // ms de recharge entre deux utilisations
const invulnerabilityDuration = 1000; // ms de répit après un coup reçu
const tickIntervalDifficile = 144; // ms entre chaque déplacement logique en Difficile
let baseTickInterval = tickIntervalDifficile / reglagesDifficulte().vitesse; // recalculé dans init()
const boostFactor = 0.75; // espace maintenu = 25% plus rapide
let animationFrameId = null;
let previousFrameTime = 0;

// --- Pause ---
let isPaused = false;
let pauseStartTime = 0;

// --- Compte à rebours de démarrage ---
let waitingToStart = true; // en attente que le joueur appuie sur espace
let countdownActive = false;
let countdownStartTime = 0;
const countdownPhaseDuration = 800; // ms par chiffre (3, 2, 1)
const countdownGoDuration = 500; // ms d'affichage de "GO !"
const countdownTotalDuration = countdownPhaseDuration * 3 + countdownGoDuration;

// --- Tourelle / combat ---
const projectileRadius = 4;
const projectileSpeed = 0.35; // pixels par ms
let projectiles = [];

const enemyRadius = 9;
const enemySpeed = 0.05; // pixels par ms
const enemySpawnInterval = 2200; // ms
let enemies = [];
let lastEnemySpawn = 0;

// --- Mode "endgame" : à 200 segments, plus d'ennemis, toujours 5 pommes sur la carte ---
const endgameSnakeLength = 200;

// --- Boss périodique ---
const bossKillThreshold = 40; // nombre de kills entre deux boss
let bossProgress = 0;
const bossWarningDuration = 1800; // ms d'annonce avant l'apparition
let bossWarningUntil = 0;
let bossSpawnPending = false;
let bossSpawnPosition = null; // {x, y} : point d'apparition du boss, signalé pendant l'annonce
// points de vie du boss : reglagesDifficulte().pvBoss (10, ou 6 en Facile)
const bossRadius = 26;
const bossSpeed = 0.045; // légèrement plus lent qu'un ennemi normal, mais poursuit sans relâche
const bossColor = '#7a0000';
const bossRewardScore = 150;

// --- Victoire à 400 segments ---
const winSnakeLength = 400;
let hasWon = false;
let fireworks = []; // fusées de victoire {x, y, vx, vy, style, exploded, ...} ; leurs éclats : js/14-feux-artifice.js
const endgameAppleCount = 5; // total de pommes visées (pomme principale + pommes bonus)
let endgameNoEnemies = false;
let endgameTransitionMessageUntil = 0;
let endgameTransitionMessageText = '';
const endgameTransitionMessageDuration = 1800;
let turretOpacity = 1;
let turretOpacityTarget = 1;
let turretOpacityFrom = 1;
let turretFadeStart = 0;
const turretFadeDuration = 600; // petit fondu d'apparition/disparition de la tourelle
let pendingSpawnWarning = null; // {x, y} : position annoncée 1s avant l'apparition d'un ennemi
const spawnWarningDuration = 1000;

// --- Coups reçus : blessure sur le serpent, marque là où l'ennemi est mort ---
const maxBlessures = 40; // cicatrices gardées au maximum sur un serpent
// retire n segments du bout de la queue : les cicatrices portées par ces segments disparaissent avec eux
function retirerBlessuresQueue(n) {
  if (n <= 0 || !blessures.length) return;
  blessures = blessures.map(b => ({...b, k: b.k - n})).filter(b => b.k >= 0);
}
let marquesImpact = []; // {x, y, couleur, debut}
const dureeMarqueImpact = 1500;

// --- Popups de score flottants ---
let popups = [];

// --- Particules d'explosion ---
let particles = [];

function spawnParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.06 + Math.random() * 0.12; // pixels par ms
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 350 + Math.random() * 250,
      radius: 1.5 + Math.random() * 2,
      color
    });
  }
}

// --- Effets visuels légers (flash, ambiance, fond en cache, ralenti) ---
let flashEcran = null; // {couleur, debut} : bref voile coloré sur tout l'écran
const flashDuree = 130;
function declencherFlash(couleur) {
  flashEcran = {couleur, debut: performance.now()};
}

// particules d'ambiance du fond, propres à chaque thème (aucune en minimaliste)
let particulesAmbiance = [];
let particulesAmbianceTheme = '';
let derniereMajAmbiance = 0;
const nbParticulesAmbiance = 16;

// fond (grille de points) et vignette dessinés une seule fois dans des canvas en mémoire
let fondCache = null;
let fondCacheTheme = '';
let vignetteCache = null;
let vignetteRalentiCache = null;
let vignetteGameOverCache = null;
let lueurLaveCache = null;

// décor animé du fond : quelques éléments par thème, dessinés à partir de sprites en cache
let decorAnime = {theme: '', temps: 0, derniereMaj: 0, dt: 0, elements: [], prochain: 0, prochain2: 0, algues: []};
let spritesDecor = {};
let pointsFissuresLave = []; // points des fissures du fond de lave (pour les bulles)

// cause et durée du ralenti en cours, pour adapter son affichage
let causeRalenti = 'rollback'; // 'rollback' ou 'ennemis'
let debutRalenti = 0;
let dureeRalenti = 1200;

// clignement des yeux

// --- Traînée du serpent ---
const trailMaxPoints = 14;
const trailFadeRate = 0.07; // perte d'opacité par frame

// --- Screen shake ---
let shakeUntil = 0;
let shakeMagnitude = 0;
const shakeDuration = 300; // ms

function triggerShake(magnitude) {
  shakeUntil = performance.now() + shakeDuration;
  shakeMagnitude = magnitude;
}

// tente un rollback de 2s (annule la position/direction du serpent) au lieu d'une mort/dégât normal,
// disponible uniquement si on a plus de 3 cœurs ; coûte 3 cœurs et déclenche un ralenti
function tryRollback() {
  const coutRollback = reglagesDifficulte().coutRollback;
  if (lives <= coutRollback) return false;

  const now = performance.now();
  // rollbacks enchaînés : chacun remonte plus loin que le précédent (1s, 2s, 3s... jusqu'à 5s)
  const j = joueurActif;
  const recul = now - j.rollbackFin < rollbackFenetreEnchainement
    ? Math.min(j.rollbackRecul + rollbackRewindMs, rollbackReculMax)
    : rollbackRewindMs;
  const targetTime = now - recul;

  // récupère tous les instantanés de la fenêtre de rembobinage (du plus ancien au plus récent)
  const framesInRange = snakeHistory.filter(h => h.time >= targetTime);
  if (framesInRange.length === 0) return false; // pas d'historique : rollback impossible

  // on les rejoue en sens inverse (du plus récent au plus ancien) pour voir le serpent reculer
  const playbackFrames = framesInRange.slice().reverse();
  const instantRestaure = framesInRange[0].time;

  // l'historique oublie le passage annulé, et le reste est recollé au moment de la reprise :
  // un rollback suivant remonte donc avant ce point au lieu d'y revenir
  const decalage = now + rollbackRewindMs - instantRestaure;
  snakeHistory = snakeHistory.filter(h => h.time < instantRestaure).map(h => ({...h, time: h.time + decalage}));
  j.rollbackRecul = recul;
  j.rollbackFin = now + rollbackRewindMs;

  lives -= coutRollback;
  updateHeartsDisplay();
  succesCoeurPerdu();
  succesRollback(recul);

  invulnerableUntil = now + invulnerabilityDuration + rollbackRewindMs;
  slowMotionUntil = now + slowMotionDuration;
  causeRalenti = 'rollback';
  debutRalenti = now;
  dureeRalenti = slowMotionDuration;
  declencherFlash('#ff1744');

  rollbackPlayback = {
    joueur: joueurActif, // seul ce serpent recule, le reste du jeu attend
    frames: playbackFrames,
    index: 0,
    frameDuration: rollbackRewindMs / playbackFrames.length,
    lastStepTime: now
  };

  const headCx = snake[0].x * gridSize + gridSize / 2;
  const headCy = snake[0].y * gridSize + gridSize / 2;
  spawnPopup(headCx, headCy, 'ROLLBACK ' + (recul / 1000) + 's -' + coutRollback + '❤️', '#40c4ff');
  spawnParticles(headCx, headCy, '#40c4ff', 20);
  triggerShake(5);
  playRollbackSound();

  return true;
}

const popupLifetime = 800; // ms

