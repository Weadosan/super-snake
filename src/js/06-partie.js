function spawnPopup(x, y, text, color) {
  popups.push({x, y, text, color, life: 0});
}

function init() {
  finirTutoSiActif(); // une partie relancée arrête le tutoriel (js/18-tuto.js)
  astuceEnCours = null;
  // un serpent par joueur, avec ses vies, buffs, bouclier et commandes (voir 04-joueurs.js)
  progressionNouvellePartie(); // fixe aussi les malédictions de la partie, avant creerJoueurs
  baseTickInterval = tickIntervalDifficile / reglagesDifficulte().vitesse / reglageMalediction('serpentRapide', 'vitesse', 1);
  creerJoueurs();
  score = 0;
  gameOver = false;
  killCount = 0;
  slowMotionUntil = 0;
  rollbackPlayback = null;
  stats = {
    enemiesKilled: 0,
    applesEaten: 0,
    goldenApplesEaten: 0,
    blueApplesEaten: 0,
    heartsCollected: 0,
    shotsFired: 0,
    shotsHit: 0,
    maxSnakeLength: 1,
    startTime: performance.now()
  };
  statsPanelEl.style.display = 'none';
  succesNouvellePartie();
  majHudMalediction();
  killThreshold = randomKillThreshold();
  heartPickup = null;
  lootApples = [];
  goldenApples = [];
  blueApples = [];
  freezeIndicatorUntil = 0;
  explosionActiveUntil = 0;
  shockwaves = [];
  laserBeams = [];
  projectiles = [];
  enemies = [];
  popups = [];
  particles = [];
  marquesImpact = [];
  shakeUntil = 0;
  flashEcran = null;
  ecranGameOver = null;
  causeRalenti = 'rollback';
  debutRalenti = 0;
  lastEnemySpawn = performance.now();
  pendingSpawnWarning = null;
  endgameNoEnemies = false;
  endgameTransitionMessageUntil = 0;
  turretOpacity = 1;
  turretOpacityTarget = 1;
  turretOpacityFrom = 1;
  turretFadeStart = 0;
  bossProgress = 0;
  bossWarningUntil = 0;
  bossSpawnPending = false;
  bossSpawnPosition = null;
  reinitialiserAttaquesBoss(); // js/13-attaques-boss.js
  hasWon = false;
  fireworks = [];
  previousFrameTime = 0;
  isPaused = false;
  pauseBtn.textContent = '⏸️ Pause';
  pauseBtn.classList.remove('active');
  waitingToStart = true;
  countdownActive = false;
  spawnEnemy();
  spawnEnemy();
  scoreEl.textContent = 'Score : 0';
  majCompteurSegments();
  updateHeartsDisplay();
  killProgressEl.textContent = 'Ennemis tués : 0 / ' + killThreshold + ' (❤️ bonus)';
  messageEl.textContent = '';
  restartBtn.style.display = 'none';
  placeFood();

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  joueurs.forEach(j => j.lastTickTime = performance.now());
  animationFrameId = requestAnimationFrame(renderLoop);
}

// centralise toute variation de score, pour appliquer le doublement des points (gains uniquement)
function addScore(amount) {
  const isDoubled = amount > 0 && performance.now() < doublePointsUntil;
  const finalAmount = isDoubled ? amount * 2 : amount;
  score = Math.max(0, score + finalAmount);
  if (isDoubled) succesPointsX2(finalAmount);
  scoreEl.textContent = 'Score : ' + score;
  return finalAmount;
}

// applique le même doublement que addScore, mais pour la croissance en segments (pomme en or)
function addGrowth(amount) {
  const isDoubled = amount > 0 && performance.now() < doublePointsUntil;
  const finalAmount = isDoubled ? amount * 2 : amount;
  pendingGrowth += finalAmount;
  return finalAmount;
}

function texteCoeurs(vies) {
  if (vies <= maxLives) {
    return '❤️'.repeat(vies) + '🖤'.repeat(maxLives - vies);
  } else if (vies <= 7) {
    return '❤️'.repeat(vies);
  }
  // au-delà de 7, répéter l'emoji devient illisible : on affiche directement le nombre
  return '❤️ x' + vies;
}

// petite étiquette « J1 » / « J2 » de la couleur du serpent, pour le HUD en coop
function etiquetteJoueur(j) {
  return '<span class="etiquette-joueur" style="color:' + couleurJoueur(j) + '">' + j.nom + '</span>';
}

function updateHeartsDisplay() {
  if (!enCoop()) {
    heartsEl.textContent = texteCoeurs(joueurs[0].lives);
    return;
  }
  heartsEl.innerHTML = joueurs.map(j =>
    etiquetteJoueur(j) + ' ' + (j.elimine ? '💀 KO' : texteCoeurs(j.lives))
  ).join('<span class="separateur-joueurs">·</span>');
}

function majCompteurSegments() {
  if (!enCoop()) {
    segmentCounterEl.textContent = 'Segments : ' + joueurs[0].snake.length;
    return;
  }
  segmentCounterEl.innerHTML = 'Segments : ' + joueurs.map(j =>
    etiquetteJoueur(j) + ' ' + (j.elimine ? '-' : j.snake.length)
  ).join('<span class="separateur-joueurs">·</span>');
}

// appelé à chaque image : le HUD n'est réécrit que si son texte change (sinon la page est recalculée à chaque image)
function ecrireTexte(el, texte) {
  if (el.textContent !== texte) el.textContent = texte;
}

function updateShieldDisplay() {
  const affichage = bouclierDisponible() ? '' : 'none';
  if (shieldStatusEl.style.display !== affichage) shieldStatusEl.style.display = affichage;
  if (!bouclierDisponible()) return;
  const now = performance.now();
  if (enCoop()) {
    // une seule ligne pour les deux joueurs
    const texte = j => {
      if (j.elimine) return '-';
      if (now < j.shieldActiveUntil) return 'ACTIF ' + ((j.shieldActiveUntil - now) / 1000).toFixed(1) + 's';
      if (now < j.shieldReadyAt) return Math.ceil((j.shieldReadyAt - now) / 1000) + 's';
      return 'Prêt';
    };
    const html = '🛡️ ' + joueurs.map(j => etiquetteJoueur(j) + ' ' + texte(j)).join('<span class="separateur-joueurs">·</span>');
    if (shieldStatusEl.innerHTML !== html) shieldStatusEl.innerHTML = html;
    return;
  }
  if (now < shieldActiveUntil) {
    const remaining = ((shieldActiveUntil - now) / 1000).toFixed(1);
    ecrireTexte(shieldStatusEl, '🛡️ Bouclier ACTIF : ' + remaining + 's');
  } else if (now < shieldReadyAt) {
    const remaining = Math.ceil((shieldReadyAt - now) / 1000);
    ecrireTexte(shieldStatusEl, 'Bouclier (' + nomToucheBouclierSolo() + ') : recharge ' + remaining + 's');
  } else {
    ecrireTexte(shieldStatusEl, 'Bouclier (' + nomToucheBouclierSolo() + ') : Prêt');
  }
}

// renvoie true si au moins un buff actif expire dans 3s ou moins (utilisé pour le HUD et le flash sur la tête)
function isAnyBuffExpiringSoon() {
  const now = performance.now();
  const untils = [
    freezeIndicatorUntil,
    explosionActiveUntil,
    laserBuffUntil,
    autoAimBuffUntil,
    buffInvincibleUntil,
    doublePointsUntil
  ];
  return untils.some(until => now < until && (until - now) <= 3000);
}

function updateBuffStatusDisplay() {
  const now = performance.now();
  // gel et explosion touchent toute la carte ; les autres buffs sont propres à chaque joueur
  const activeBuffs = [
    {until: freezeIndicatorUntil, icon: '❄️', color: '#40c4ff'},
    {until: explosionActiveUntil, icon: '💥', color: '#ff6d00'}
  ];
  joueurs.forEach(j => {
    const prefixe = enCoop() ? j.nom + ' ' : '';
    activeBuffs.push(
      {until: j.laserBuffUntil, icon: prefixe + '⚡', color: '#ff1744'},
      {until: j.autoAimBuffUntil, icon: prefixe + '🎯', color: '#ff9100'},
      {until: j.buffInvincibleUntil, icon: prefixe + '✨', color: '#ffd700'},
      {until: j.doublePointsUntil, icon: prefixe + '💰x2', color: '#69f0ae'}
    );
  });

  // les pastilles ne sont refaites que si leur texte change (une fois par seconde au plus)
  const actifs = activeBuffs.filter(b => now < b.until);
  const cle = actifs.map(b => b.icon + ' ' + Math.ceil((b.until - now) / 1000)).join('|');
  if (cle === buffStatusEl.dataset.cle) return;
  buffStatusEl.dataset.cle = cle;
  buffStatusEl.innerHTML = '';
  actifs.forEach(b => {
    const el = document.createElement('span');
    const remaining = Math.ceil((b.until - now) / 1000);
    el.className = 'buff-icon' + (remaining <= 3 ? ' buff-expiring' : '');
    el.style.color = b.color;
    el.textContent = b.icon + ' ' + remaining + 's';
    buffStatusEl.appendChild(el);
  });
}

// --- Placement des pommes vertes sur des cases libres (jamais sur le serpent) ---
function caseOccupee(x, y) {
  return tousLesSegments().some(s => s.x === x && s.y === y) ||
    (food && food.x === x && food.y === y) ||
    lootApples.some(a => a.x === x && a.y === y);
}

// tire une case libre au hasard parmi toutes les cases libres du plateau (null si le plateau est plein)
function caseLibreAleatoire() {
  const libres = [];
  for (let x = 0; x < tileCount; x++) {
    for (let y = 0; y < tileCount; y++) {
      if (!caseOccupee(x, y)) libres.push({x, y});
    }
  }
  return libres.length ? libres[Math.floor(Math.random() * libres.length)] : null;
}

// renvoie la case demandée si elle est libre, sinon une case libre la plus proche possible (null si aucune)
function caseLibreProche(gx, gy) {
  if (!caseOccupee(gx, gy)) return {x: gx, y: gy};
  for (let rayon = 1; rayon < tileCount; rayon++) {
    const candidates = [];
    for (let x = gx - rayon; x <= gx + rayon; x++) {
      for (let y = gy - rayon; y <= gy + rayon; y++) {
        // uniquement le contour de l'anneau courant
        if (Math.max(Math.abs(x - gx), Math.abs(y - gy)) !== rayon) continue;
        if (x < 0 || y < 0 || x >= tileCount || y >= tileCount) continue;
        if (!caseOccupee(x, y)) candidates.push({x, y});
      }
    }
    if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];
  }
  return null;
}

function placeFood() {
  food = null; // l'ancienne pomme ne bloque pas sa propre case
  food = caseLibreAleatoire() || {
    // plateau entièrement plein (cas extrême) : on garde l'ancien comportement
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
  };
}

// butin garanti du boss : une pomme bleue contenant le buff x2, une pomme en or, et 5 pommes bonus
function dropBossLoot(x, y) {
  const clampX = v => Math.max(12, Math.min(largeurPlateau - 12, v));
  const clampY = v => Math.max(12, Math.min(hauteurPlateau - 12, v));

  // place un point à bonne distance à la fois du point de mort ET du serpent actuel,
  // pour éviter qu'il soit ramassé instantanément si le boss meurt au contact
  function pickSafeDropPosition(angle) {
    let dist = 70; // nettement plus que le rayon de ramassage (~20px)
    let px, py;
    for (let tries = 0; tries < 10; tries++) {
      px = clampX(x + Math.cos(angle) * dist);
      py = clampY(y + Math.sin(angle) * dist);
      const tooClose = tousLesSegments().some(s => {
        const scx = s.x * gridSize + gridSize / 2;
        const scy = s.y * gridSize + gridSize / 2;
        return Math.hypot(px - scx, py - scy) < 45;
      });
      if (!tooClose) return {x: px, y: py};
      dist += 20;
    }
    return {x: px, y: py}; // au pire, la position la plus éloignée testée
  }

  // pomme bleue avec le buff x2 (s'ajoute à une éventuelle pomme bleue déjà présente)
  // si x2 est désactivé dans le menu, on prend un autre buff actif ; aucun buff actif = pas de pomme bleue
  const bossBuff = buffsEnJeu().includes('doublepoints') ? 'doublepoints' : tirerBuffAleatoire();
  if (bossBuff) {
    const blueSpot = pickSafeDropPosition(Math.PI * 0.25);
    const angleBlue = Math.random() * Math.PI * 2;
    blueApples.push({
      x: blueSpot.x, y: blueSpot.y,
      vx: Math.cos(angleBlue) * blueAppleSpeed,
      vy: Math.sin(angleBlue) * blueAppleSpeed,
      radius: blueAppleRadius,
      changeDirTimer: 800 + Math.random() * 1000,
      buffType: bossBuff
    });
  }

  // pomme en or (s'ajoute à une éventuelle pomme en or déjà présente)
  const goldSpot = pickSafeDropPosition(Math.PI * 1.25);
  const angleGold = Math.random() * Math.PI * 2;
  goldenApples.push({
    x: goldSpot.x, y: goldSpot.y,
    vx: Math.cos(angleGold) * goldenAppleSpeed,
    vy: Math.sin(angleGold) * goldenAppleSpeed,
    radius: goldenAppleRadius,
    changeDirTimer: 800 + Math.random() * 1000,
    ne: performance.now()
  });

  // 5 pommes classiques éparpillées autour du point de mort, sur des cases libres
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 35 + Math.random() * 25;
    const gx = Math.min(tileCount - 1, Math.max(0, Math.round((x + Math.cos(angle) * dist - gridSize / 2) / gridSize)));
    const gy = Math.min(tileCount - 1, Math.max(0, Math.round((y + Math.sin(angle) * dist - gridSize / 2) / gridSize)));

    // case libre la plus proche du point visé (jamais sur le serpent)
    const pos = caseLibreProche(gx, gy);
    if (pos) lootApples.push(pos);
  }
}

// récompense la destruction d'un ennemi (points, popup, particules, son, chance de loot)
// utilisé à la fois pour les kills au tir et pour les kills par collision pendant l'invulnérabilité
// facon : 'tir' (défaut), 'glace' (gelé détruit au tir) ou 'tete' (gelé écrasé par la tête)
function awardEnemyKill(e, facon) {
  stats.enemiesKilled++;
  joueurActif.ennemis++;
  succesKill(e);
  if (!facon && estGele(e)) facon = 'glace';

  if (e.isBoss) {
    const bossGained = addScore(bossRewardScore);
    spawnPopup(e.x, e.y, '+' + bossGained + ' BOSS !', '#ff1744');
    spawnParticles(e.x, e.y, '#ff1744', 40);
    spawnParticles(e.x, e.y, '#ffd700', 25);
    spawnShockwave(e.x, e.y, '#ff1744', 220);
    triggerShake(10);
    playExplosionBuffSound();
    // butin garanti à 100 % : pomme bleue (buff x2), pomme en or et 5 pommes ; le cœur bonus reste aussi
    dropBossLoot(e.x, e.y);
    if (!heartPickup) spawnHeartPickup();
    return;
  }

  const gained = addScore(15);
  spawnPopup(e.x, e.y, '+' + gained, '#4caf50');
  if (facon === 'glace' || facon === 'tete') {
    // éclats de glace
    spawnParticles(e.x, e.y, '#e1f5fe', 10);
    spawnParticles(e.x, e.y, '#80d8ff', 10);
    if (facon === 'tete') {
      playIceCrunchSound();
      triggerShake(3);
    } else {
      playIceShatterSound();
    }
  } else {
    spawnParticles(e.x, e.y, e.color, 12);
    playExplosionSound();
  }

  // pendant le tutoriel, chaque étape place elle-même ses pommes : pas de butin au hasard
  if (tutoActif()) return;

  // chance qu'il laisse une pomme en or mobile (rare, grosse récompense)
  if (!goldenApples.length && Math.random() < goldenAppleChance) {
    const angle = Math.random() * Math.PI * 2;
    goldenApples.push({
      x: e.x, y: e.y,
      vx: Math.cos(angle) * goldenAppleSpeed,
      vy: Math.sin(angle) * goldenAppleSpeed,
      radius: goldenAppleRadius,
      changeDirTimer: 800 + Math.random() * 1000,
      ne: performance.now() // pour le succès « Rattrapé ! »
    });
  } else if (!blueApples.length && buffsEnJeu().length &&
      Math.random() < reglagesDifficulte().chancePommeBleue + bonusProgression('pommeBleue')) {
    // sinon, chance qu'il laisse une pomme bleue mobile (buff aléatoire, déterminé dès l'apparition)
    const angle = Math.random() * Math.PI * 2;
    blueApples.push({
      x: e.x, y: e.y,
      vx: Math.cos(angle) * blueAppleSpeed,
      vy: Math.sin(angle) * blueAppleSpeed,
      radius: blueAppleRadius,
      changeDirTimer: 800 + Math.random() * 1000,
      buffType: tirerBuffAleatoire()
    });
  } else if (Math.random() < lootDropChance) {
    // sinon, chance qu'il laisse une pomme bonus classique derrière lui
    const gridX = Math.min(tileCount - 1, Math.max(0, Math.round((e.x - gridSize / 2) / gridSize)));
    const gridY = Math.min(tileCount - 1, Math.max(0, Math.round((e.y - gridSize / 2) / gridSize)));
    // si l'ennemi meurt sur le serpent (bélier, tir à bout portant), la pomme va sur la case libre la plus proche
    const pos = caseLibreProche(gridX, gridY);
    if (pos) lootApples.push(pos);
  }
}

// met à jour le compteur de kills vers le prochain cœur bonus
function spawnShockwave(x, y, color, maxRadius) {
  shockwaves.push({x, y, radius: 4, maxRadius, color, life: 0, maxLife: 600});
}

const buffLabels = {
  freeze: {text: '❄️ GEL', color: '#40c4ff'},
  laser: {text: '⚡ LASER', color: '#ff1744'},
  autoaim: {text: '🎯 AUTO-VISÉE', color: '#ff9100'},
  explode: {text: '💥 EXPLOSION', color: '#ff6d00'},
  invincible: {text: '✨ INVINCIBLE', color: '#ffd700'},
  doublepoints: {text: '💰 x2 POINTS', color: '#69f0ae'}
};

function applyRandomBuff(x, y, forcedType) {
  const type = forcedType || tirerBuffAleatoire();
  if (!type) return;
  const now = performance.now();
  const label = buffLabels[type];
  succesBuff(type);

  spawnPopup(x, y, label.text, label.color);
  spawnParticles(x, y, label.color, 16);
  declencherFlash('#ffffff');

  switch (type) {
    case 'freeze': {
      freezeIndicatorUntil = Math.max(now, freezeIndicatorUntil) + dureeBuff('freeze');
      enemies.forEach(e => {
        e.frozenUntil = freezeIndicatorUntil;
      });
      spawnShockwave(x, y, '#40c4ff', 260);
      playFreezeSound();
      break;
    }
    case 'laser': {
      laserBuffUntil = Math.max(now, laserBuffUntil) + dureeBuff('laser');
      playBuffActivateSound();
      break;
    }
    case 'autoaim': {
      autoAimBuffUntil = Math.max(now, autoAimBuffUntil) + dureeBuff('autoaim');
      autoFireCooldown = 0;
      playBuffActivateSound();
      break;
    }
    case 'explode': {
      explosionActiveUntil = Math.max(now, explosionActiveUntil) + dureeBuff('explode');
      const toKill = enemies.slice();
      enemies = [];
      toKill.forEach(e => awardEnemyKill(e));
      if (toKill.length) registerKills(toKill.length);
      succesExplosion(toKill.length);
      spawnShockwave(x, y, '#ff6d00', 400);
      triggerShake(10);
      playExplosionBuffSound();
      break;
    }
    case 'invincible': {
      buffInvincibleUntil = Math.max(now, buffInvincibleUntil) + dureeBuff('invincible');
      playBuffActivateSound();
      break;
    }
    case 'doublepoints': {
      if (now >= doublePointsUntil) joueurActif.pointsX2 = 0; // nouveau Points x2 : succès « Jackpot »
      doublePointsUntil = Math.max(now, doublePointsUntil) + dureeBuff('doublepoints');
      playBuffActivateSound();
      break;
    }
  }
}

function registerKills(count) {
  if (tutoActif()) return; // ni cœur bonus ni boss au compteur pendant le tutoriel
  killCount += count;
  if (killCount >= killThreshold) {
    killCount -= killThreshold;
    killThreshold = randomKillThreshold();
    if (!heartPickup) {
      spawnHeartPickup();
    }
  }
  killProgressEl.textContent = 'Ennemis tués : ' + killCount + ' / ' + killThreshold + ' (❤️ bonus)';

  // progression vers le prochain boss (un seul actif à la fois)
  const hasBossActive = enemies.some(e => e.isBoss) || bossSpawnPending;
  if (!hasBossActive) {
    bossProgress += count;
    if (bossProgress >= bossKillThreshold) {
      bossProgress -= bossKillThreshold;
      announceBoss();
    }
  }
}

function announceBoss() {
  bossSpawnPending = true;
  bossWarningUntil = performance.now() + bossWarningDuration;
  // le point d'apparition est choisi dès l'annonce pour être signalé, comme pour les ennemis
  bossSpawnPosition = pickEnemySpawnPosition();
  playBossWarningSound();
  triggerShake(4);
}

function spawnHeartPickup() {
  if (maledictionActive('unCoeur')) return; // malédiction : plus aucun cœur bonus
  let x, y;
  const safeDistance = 130;
  const heartPickupRadius = reglagesDifficulte().rayonCoeur; // plus gros en Facile
  let tries = 0;
  let tooClose = true;

  do {
    x = Math.random() * (largeurPlateau - 2 * heartPickupRadius) + heartPickupRadius;
    y = Math.random() * (hauteurPlateau - 2 * heartPickupRadius) + heartPickupRadius;
    tries++;

    tooClose = tousLesSegments().some(segment => {
      const segCx = segment.x * gridSize + gridSize / 2;
      const segCy = segment.y * gridSize + gridSize / 2;
      return Math.hypot(x - segCx, y - segCy) < safeDistance;
    });
  } while (tries < 30 && tooClose);

  heartPickup = {x, y, radius: heartPickupRadius};
}

// plus le serpent est long, plus les ennemis sont ralentis, selon des paliers précis
// (interpolation linéaire entre chaque point ; plateau avant/après les bornes)
const enemySlowdownBreakpoints = [
  {length: 3, multiplier: 1.0},   // longueur de départ : vitesse normale
  {length: 20, multiplier: 0.90}, // 90% de vitesse
  {length: 40, multiplier: 0.80}, // 80%
  {length: 60, multiplier: 0.70}, // 70%
  {length: 80, multiplier: 0.60}, // 60%
  {length: 100, multiplier: 0.50} // 50%
];

function getEnemySpeedMultiplier() {
  const len = longueurMax(); // en coop : le serpent le plus long
  const points = enemySlowdownBreakpoints;

  if (len <= points[0].length) return points[0].multiplier;
  if (len >= points[points.length - 1].length) return points[points.length - 1].multiplier;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (len >= a.length && len <= b.length) {
      const t = (len - a.length) / (b.length - a.length);
      return a.multiplier + t * (b.multiplier - a.multiplier);
    }
  }
  return 1.0;
}

// choisit une position de spawn valide (loin du serpent), réutilisée par l'avertissement et le spawn réel
// distance minimale absolue en dessous de laquelle une position est jugée trop proche du serpent
const minEnemySpawnDistance = 210; // couvre la distance max parcourue par le serpent en boost pendant 1s + marge

function isPositionSafeFromSnake(x, y) {
  return !tousLesSegments().some(segment => {
    const segCx = segment.x * gridSize + gridSize / 2;
    const segCy = segment.y * gridSize + gridSize / 2;
    return Math.hypot(x - segCx, y - segCy) < minEnemySpawnDistance;
  });
}

// choisit une case libre (pas sur le serpent, la pomme principale ou une autre pomme bonus)
function pickSafeLootPosition() {
  return caseLibreAleatoire();
}

// en mode endgame (200+ segments), maintient toujours 5 pommes au total sur la carte
function ensureEndgameApples() {
  const targetLootCount = endgameAppleCount - 1; // -1 car la pomme principale compte pour une
  while (lootApples.length < targetLootCount) {
    const pos = pickSafeLootPosition();
    if (!pos) break; // plus aucune case libre
    lootApples.push(pos);
  }
}

// à 200 segments, les ennemis disparaissent définitivement et ne réapparaissent plus
function checkEndgameTransition() {
  if (!endgameNoEnemies && longueurMax() >= endgameSnakeLength) {
    endgameNoEnemies = true;
    enemies = [];
    pendingSpawnWarning = null;
    ensureEndgameApples();
    triggerEndgameTransitionEffect(false);
  } else if (endgameNoEnemies && longueurMax() < endgameSnakeLength) {
    // repassé sous le seuil : les ennemis peuvent réapparaître normalement
    endgameNoEnemies = false;
    lastEnemySpawn = performance.now();
    triggerEndgameTransitionEffect(true);
  }
}

function triggerEndgameTransitionEffect(enemiesPresent) {
  const now = performance.now();
  endgameTransitionMessageText = enemiesPresent
    ? '⚠️ ENNEMIS DE RETOUR ⚠️'
    : '⚠️ ENNEMIS ABSENTS ⚠️';
  endgameTransitionMessageUntil = now + endgameTransitionMessageDuration;
  slowMotionUntil = now + endgameTransitionMessageDuration;
  causeRalenti = 'ennemis';
  debutRalenti = now;
  dureeRalenti = endgameTransitionMessageDuration;
  turretOpacityFrom = turretOpacity;
  turretOpacityTarget = enemiesPresent ? 1 : 0;
  turretFadeStart = now;
  triggerShake(5);
  playEndgameTransitionSound(enemiesPresent);
}

// anime le petit fondu d'apparition/disparition de la tourelle vers sa cible actuelle
function updateTurretOpacity() {
  const now = performance.now();
  if (turretOpacity === turretOpacityTarget) return;
  const progress = Math.min(1, (now - turretFadeStart) / turretFadeDuration);
  turretOpacity = turretOpacityFrom + (turretOpacityTarget - turretOpacityFrom) * progress;
}

function spawnBoss(forcedPos) {
  const pos = forcedPos || pickEnemySpawnPosition();
  enemies.push({
    x: pos.x, y: pos.y,
    vx: 0, vy: 0,
    speedFactor: 1,
    radius: bossRadius,
    changeDirTimer: 0,
    hp: pvBossPartie(),
    maxHp: pvBossPartie(),
    color: bossColor,
    hitFlashUntil: 0,
    isBoss: true,
    neA: performance.now(),
    phase: 0
  });
  spawnShockwave(pos.x, pos.y, '#7a0000', 200);
  succesBossApparu();
  triggerShake(8);
}

function pickEnemySpawnPosition() {
  let bestPos = null;
  let bestDist = -Infinity;
  const segments = tousLesSegments();

  for (let tries = 0; tries < 80; tries++) {
    const x = Math.random() * (largeurPlateau - 2 * enemyRadius) + enemyRadius;
    const y = Math.random() * (hauteurPlateau - 2 * enemyRadius) + enemyRadius;

    const minDistToSnake = Math.min(...segments.map(segment => {
      const segCx = segment.x * gridSize + gridSize / 2;
      const segCy = segment.y * gridSize + gridSize / 2;
      return Math.hypot(x - segCx, y - segCy);
    }));

    // position pleinement sûre trouvée : on s'arrête immédiatement
    if (minDistToSnake >= minEnemySpawnDistance) {
      return {x, y};
    }

    // sinon on mémorise la meilleure (la plus éloignée) au cas où aucune ne soit idéale
    if (minDistToSnake > bestDist) {
      bestDist = minDistToSnake;
      bestPos = {x, y};
    }
  }

  // aucune position idéale trouvée (plateau très encombré) : on prend la plus éloignée possible,
  // jamais un point choisi au hasard sans vérification
  return bestPos;
}

function spawnEnemy(preAssignedPos) {
  // en dessous de cette distance, l'ennemi apparaît ralenti plutôt que d'être bloqué
  const slowZoneRadius = 170;
  const minSpeedFactor = 0.35;

  const pos = preAssignedPos || pickEnemySpawnPosition();
  const x = pos.x;
  const y = pos.y;

  // distance au segment de serpent le plus proche, pour moduler la vitesse de départ
  const nearestDistance = Math.min(...tousLesSegments().map(segment => {
    const segCx = segment.x * gridSize + gridSize / 2;
    const segCy = segment.y * gridSize + gridSize / 2;
    return Math.hypot(x - segCx, y - segCy);
  }));
  const speedFactor = nearestDistance >= slowZoneRadius
    ? 1
    : Math.max(minSpeedFactor, nearestDistance / slowZoneRadius);

  const angle = Math.random() * Math.PI * 2;
  // chance d'obtenir un ennemi résistant (2 coups) selon la difficulté (Difficile 30%, Facile aucun)
  // (tous sous la malédiction « Ennemis coriaces »)
  const isTough = maledictionActive('coriaces') || Math.random() < reglagesDifficulte().chanceResistant;
  const newEnemy = {
    x, y,
    vx: Math.cos(angle) * enemySpeed * speedFactor,
    vy: Math.sin(angle) * enemySpeed * speedFactor,
    speedFactor,
    radius: isTough ? enemyRadius + 2 : enemyRadius,
    changeDirTimer: 1000 + Math.random() * 1500,
    hp: isTough ? 2 : 1,
    maxHp: isTough ? 2 : 1,
    color: isTough ? currentTheme.enemyTough : currentTheme.enemyNormal,
    hitFlashUntil: 0,
    neA: performance.now(),
    phase: Math.random() * Math.PI * 2
  };
  spawnParticles(x, y, newEnemy.color, 8);
  playEnemySpawnSound();

  const now = performance.now();

  // zone explosive encore active : l'ennemi est détruit dès son apparition
  if (now < explosionActiveUntil) {
    awardEnemyKill(newEnemy);
    registerKills(1);
    spawnShockwave(newEnemy.x, newEnemy.y, '#ff6d00', 80);
    return;
  }

  // zone gelée encore active : l'ennemi apparaît déjà figé
  if (now < freezeIndicatorUntil) {
    newEnemy.frozenUntil = freezeIndicatorUntil;
  }

  enemies.push(newEnemy);
}

// applique 1 point de dégât à un ennemi via son index dans le tableau enemies (utilisé par le laser)
function damageEnemyByIndex(index) {
  const e = enemies[index];
  if (!e) return;
  e.hp -= 1;
  stats.shotsHit++;
  if (e.hp <= 0) {
    awardEnemyKill(e);
    enemies.splice(index, 1);
    registerKills(1);
  } else {
    e.hitFlashUntil = performance.now() + 100;
    spawnPopup(e.x, e.y, 'touché !', '#ffd54f');
    if (estGele(e)) playIceHitSound(); else playHitSound();
  }
}

// tir laser instantané (hitscan) : pas de temps de trajet, touche immédiatement le premier ennemi sur la trajectoire
function fireLaser(angle) {
  const maxRange = Math.hypot(largeurPlateau, hauteurPlateau);
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);

  let closestT = maxRange;
  let hitIndex = -1;
  let hitType = null; // 'enemy' ou 'heart'

  enemies.forEach((e, i) => {
    const toEnemyX = e.x - turretPixelPos.x;
    const toEnemyY = e.y - turretPixelPos.y;
    const t = toEnemyX * dirX + toEnemyY * dirY;
    if (t < 0 || t > maxRange) return;
    const closestX = turretPixelPos.x + dirX * t;
    const closestY = turretPixelPos.y + dirY * t;
    const dist = Math.hypot(e.x - closestX, e.y - closestY);
    if (dist < e.radius && t < closestT) {
      closestT = t;
      hitIndex = i;
      hitType = 'enemy';
    }
  });

  // le cœur bonus est aussi une cible valide pour le laser
  if (heartPickup) {
    const toHeartX = heartPickup.x - turretPixelPos.x;
    const toHeartY = heartPickup.y - turretPixelPos.y;
    const t = toHeartX * dirX + toHeartY * dirY;
    if (t >= 0 && t <= maxRange) {
      const closestX = turretPixelPos.x + dirX * t;
      const closestY = turretPixelPos.y + dirY * t;
      const dist = Math.hypot(heartPickup.x - closestX, heartPickup.y - closestY);
      if (dist < heartPickup.radius && t < closestT) {
        closestT = t;
        hitType = 'heart';
      }
    }
  }

  const endX = turretPixelPos.x + dirX * closestT;
  const endY = turretPixelPos.y + dirY * closestT;
  laserBeams.push({x1: turretPixelPos.x, y1: turretPixelPos.y, x2: endX, y2: endY, life: 0, maxLife: 120});

  if (hitType === 'enemy') {
    damageEnemyByIndex(hitIndex);
  } else if (hitType === 'heart') {
    ramasserCoeur(heartPickup.x, heartPickup.y);
  }
}

function fireProjectile(angleOverride) {
  const angle = angleOverride !== undefined
    ? angleOverride
    : Math.atan2(mouseY - turretPixelPos.y, mouseX - turretPixelPos.x);

  stats.shotsFired++;
  addScore(-2);
  spawnPopup(turretPixelPos.x, turretPixelPos.y, '-2', '#ff5252');

  if (performance.now() < laserBuffUntil) {
    fireLaser(angle);
    playLaserSound();
  } else {
    projectiles.push({
      x: turretPixelPos.x,
      y: turretPixelPos.y,
      vx: Math.cos(angle) * projectileSpeed * (1 + bonusProgression('balles')),
      vy: Math.sin(angle) * projectileSpeed * (1 + bonusProgression('balles')),
      joueur: joueurActif // pour attribuer les kills et les buffs au bon joueur
    });
    playShootSound();
  }
}

function updateCombat(deltaMs) {
  // mise à jour et nettoyage des popups de score flottants
  popups.forEach(p => p.life += deltaMs);
  popups = popups.filter(p => p.life < popupLifetime);

  // mise à jour et nettoyage des particules d'explosion
  particles.forEach(p => {
    p.x += p.vx * deltaMs;
    p.y += p.vy * deltaMs;
    p.life += deltaMs;
  });
  particles = particles.filter(p => p.life < p.maxLife);

  // mise à jour et nettoyage des ondes de choc
  shockwaves.forEach(s => s.life += deltaMs);
  shockwaves = shockwaves.filter(s => s.life < s.maxLife);

  // mise à jour et nettoyage des faisceaux laser (très courts, juste un flash)
  laserBeams.forEach(l => l.life += deltaMs);
  laserBeams = laserBeams.filter(l => l.life < l.maxLife);

  // apparition effective du boss une fois l'annonce terminée
  if (bossSpawnPending && performance.now() >= bossWarningUntil) {
    bossSpawnPending = false;
    spawnBoss(bossSpawnPosition);
    bossSpawnPosition = null;
  }

  // spawn périodique d'ennemis, avec avertissement 1s avant à la position exacte
  // (désactivé une fois le mode endgame atteint : plus aucun ennemi ne réapparaît,
  // et pendant le tutoriel, où chaque étape place ses ennemis)
  if (tutoActif()) {
    // rien : voir js/18-tuto.js
  } else if (!endgameNoEnemies) {
    const timeUntilNextSpawn = enemySpawnInterval * reglageMalediction('horde', 'intervalle', 1) - (performance.now() - lastEnemySpawn);

    if (!pendingSpawnWarning && timeUntilNextSpawn <= spawnWarningDuration) {
      pendingSpawnWarning = pickEnemySpawnPosition();
    }

    if (timeUntilNextSpawn <= 0) {
      lastEnemySpawn = performance.now();
      spawnEnemy(pendingSpawnWarning);
      pendingSpawnWarning = null;
    }
  } else {
    ensureEndgameApples();
  }

  // déplacement des projectiles
  projectiles.forEach(p => {
    p.x += p.vx * deltaMs;
    p.y += p.vy * deltaMs;
  });
  projectiles = projectiles.filter(p =>
    p.x > -20 && p.x < largeurPlateau + 20 &&
    p.y > -20 && p.y < hauteurPlateau + 20
  );

  // déplacement aléatoire des ennemis (rebond sur les murs + changements de direction)
  // le boss, lui, poursuit directement la tête du serpent le plus proche sans relâche
  const lengthSpeedMultiplier = getEnemySpeedMultiplier() * reglagesDifficulte().vitesse *
    reglageMalediction('rapides', 'vitesse', 1);

  enemies.forEach(e => {
    if (performance.now() < (e.frozenUntil || 0)) return; // gelé : ne bouge pas

    // pendant une charge (chauve-souris, crabe), le boss fonce tout droit au lieu de poursuivre
    if (e.isBoss && !bossEnCharge(e)) {
      const cible = teteLaPlusProche(e.x, e.y);
      if (cible) {
        const toHeadX = cible.x - e.x;
        const toHeadY = cible.y - e.y;
        const dist = Math.hypot(toHeadX, toHeadY) || 1;
        e.vx = (toHeadX / dist) * bossSpeed;
        e.vy = (toHeadY / dist) * bossSpeed;
      }
    }

    e.x += e.vx * deltaMs * lengthSpeedMultiplier;
    e.y += e.vy * deltaMs * lengthSpeedMultiplier;

    if (!e.isBoss) {
      if (e.x < e.radius || e.x > largeurPlateau - e.radius) e.vx *= -1;
      if (e.y < e.radius || e.y > hauteurPlateau - e.radius) e.vy *= -1;
    }
    e.x = Math.max(e.radius, Math.min(largeurPlateau - e.radius, e.x));
    e.y = Math.max(e.radius, Math.min(hauteurPlateau - e.radius, e.y));

    if (!e.isBoss) {
      e.changeDirTimer -= deltaMs;
      if (e.changeDirTimer <= 0) {
        const angle = Math.random() * Math.PI * 2;
        e.vx = Math.cos(angle) * enemySpeed * e.speedFactor;
        e.vy = Math.sin(angle) * enemySpeed * e.speedFactor;
        e.changeDirTimer = 1000 + Math.random() * 1500;
      }
    }
  });

  // attaque propre au skin du boss, et ce qu'il a déjà lancé (js/13-attaques-boss.js)
  majAttaquesBoss(deltaMs);

  // déplacement des pommes en or et bleues (rebond sur les murs + changements de direction)
  const deplacerPommeMobile = (pomme, vitesse) => {
    pomme.x += pomme.vx * deltaMs;
    pomme.y += pomme.vy * deltaMs;

    if (pomme.x < pomme.radius || pomme.x > largeurPlateau - pomme.radius) pomme.vx *= -1;
    if (pomme.y < pomme.radius || pomme.y > hauteurPlateau - pomme.radius) pomme.vy *= -1;
    pomme.x = Math.max(pomme.radius, Math.min(largeurPlateau - pomme.radius, pomme.x));
    pomme.y = Math.max(pomme.radius, Math.min(hauteurPlateau - pomme.radius, pomme.y));

    pomme.changeDirTimer -= deltaMs;
    if (pomme.changeDirTimer <= 0) {
      const angle = Math.random() * Math.PI * 2;
      pomme.vx = Math.cos(angle) * vitesse;
      pomme.vy = Math.sin(angle) * vitesse;
      pomme.changeDirTimer = 800 + Math.random() * 1000;
    }
  };
  goldenApples.forEach(p => deplacerPommeMobile(p, goldenAppleSpeed));
  blueApples.forEach(p => deplacerPommeMobile(p, blueAppleSpeed));
  goldenApples.forEach(p => attirerPomme(p, deltaMs)); // amélioration Aimant
  blueApples.forEach(p => attirerPomme(p, deltaMs));

  // ramassage des pommes mobiles, auto-visée : pour chaque serpent en jeu
  joueursEnJeu().forEach(j => avecJoueur(j, () => {
    const headCx = snake[0].x * gridSize + gridSize / 2;
    const headCy = snake[0].y * gridSize + gridSize / 2;

    // pommes en or (parcours à rebours pour pouvoir retirer en route)
    for (let i = goldenApples.length - 1; i >= 0; i--) {
      const goldenApple = goldenApples[i];
      if (Math.hypot(headCx - goldenApple.x, headCy - goldenApple.y) < gridSize / 2 + goldenApple.radius) {
        stats.goldenApplesEaten++;
        j.pommes++;
        const gained = addScore(100);
        addGrowth(10);
        spawnPopup(goldenApple.x, goldenApple.y, '+' + gained, '#ffd700');
        spawnParticles(goldenApple.x, goldenApple.y, '#ffd700', 18);
        declencherFlash('#ffffff');
        playGoldenApplePickupSound();
        tongueUntil = performance.now() + tongueDuration;
        succesPomme('or', goldenApple);
        goldenApples.splice(i, 1);
      }
    }

    // pommes bleues (buff aléatoire)
    for (let i = blueApples.length - 1; i >= 0; i--) {
      const blueApple = blueApples[i];
      if (Math.hypot(headCx - blueApple.x, headCy - blueApple.y) < gridSize / 2 + blueApple.radius) {
        stats.blueApplesEaten++;
        j.pommes++;
        applyRandomBuff(blueApple.x, blueApple.y, blueApple.buffType);
        tongueUntil = performance.now() + tongueDuration;
        succesPomme('bleue');
        blueApples.splice(i, 1);
      }
    }

    // auto-visée + tir automatique (buff autoaim)
    const isAutoAimActive = performance.now() < autoAimBuffUntil;
    if (isAutoAimActive && turretPixelPos) {
      const nearest = ennemiLePlusProche(turretPixelPos.x, turretPixelPos.y);
      if (nearest) {
        autoAimAngle = angleVersEnnemi(nearest);
        autoFireCooldown -= deltaMs;
        if (autoFireCooldown <= 0 && score > 0) {
          fireProjectile(autoAimAngle);
          autoFireCooldown = autoFireInterval;
        }
      } else {
        autoAimAngle = null;
      }
    } else {
      autoAimAngle = null;
    }

    // option Visée auto (Facile) : ennemi sur lequel le viseur est accroché
    cibleAuto = optionViseeAutoActive() && !j.viseeAuto && turretPixelPos ? ennemiAimante() : null;

    // visée automatique du joueur 2 au clavier : le point visé suit l'ennemi le plus proche,
    // ou regarde devant le serpent s'il n'y a aucun ennemi
    if (j.viseeAuto && turretPixelPos) {
      const cible = ennemiLePlusProche(turretPixelPos.x, turretPixelPos.y);
      if (cible) {
        mouseX = cible.x;
        mouseY = cible.y;
      } else {
        const dx = direction.x || j.directionDepart.x;
        const dy = direction.y;
        mouseX = turretPixelPos.x + dx * distanceViseeManette;
        mouseY = turretPixelPos.y + dy * distanceViseeManette;
      }
    }
  }));

  // collisions projectile <-> ennemi (les points et stats vont au joueur qui a tiré)
  const deadEnemies = new Set();
  const deadProjectiles = new Set();
  projectiles.forEach((p, pi) => avecJoueur(p.joueur || joueurs[0], () => {
    enemies.forEach((e, ei) => {
      if (deadEnemies.has(ei) || deadProjectiles.has(pi)) return;
      if (Math.hypot(p.x - e.x, p.y - e.y) < projectileRadius + e.radius) {
        deadProjectiles.add(pi);
        e.hp -= 1;
        stats.shotsHit++;

        if (e.hp <= 0) {
          deadEnemies.add(ei);
          awardEnemyKill(e);
        } else {
          // touché mais pas encore détruit : petit flash blanc + son + popup
          e.hitFlashUntil = performance.now() + 100;
          spawnPopup(e.x, e.y, 'touché !', '#ffd54f');
          if (estGele(e)) playIceHitSound(); else playHitSound();
        }
      }
    });
  }));
  if (deadEnemies.size) enemies = enemies.filter((_, i) => !deadEnemies.has(i));
  if (deadProjectiles.size) projectiles = projectiles.filter((_, i) => !deadProjectiles.has(i));

  // collision projectile <-> cœur bonus
  if (heartPickup) {
    const hitIndex = projectiles.findIndex(p =>
      Math.hypot(p.x - heartPickup.x, p.y - heartPickup.y) < projectileRadius + heartPickup.radius
    );
    if (hitIndex !== -1) {
      const tireur = projectiles[hitIndex].joueur || joueurs[0];
      projectiles.splice(hitIndex, 1);
      avecJoueur(tireur.elimine ? joueursEnJeu()[0] || tireur : tireur,
        () => ramasserCoeur(heartPickup.x, heartPickup.y));
    }
  }

  // collision tête du serpent <-> cœur bonus (ramassage direct en marchant dessus)
  joueursEnJeu().forEach(j => avecJoueur(j, () => {
    if (!heartPickup) return;
    const headCx = snake[0].x * gridSize + gridSize / 2;
    const headCy = snake[0].y * gridSize + gridSize / 2;
    if (Math.hypot(headCx - heartPickup.x, headCy - heartPickup.y) < gridSize / 2 + heartPickup.radius) {
      ramasserCoeur(heartPickup.x, heartPickup.y);
    }
  }));

  if (deadEnemies.size) registerKills(deadEnemies.size);

  // chaque serpent en jeu : ennemis gelés brisés par la tête, puis contacts avec les ennemis
  joueursEnJeu().forEach(j => {
    if (!gameOver) avecJoueur(j, collisionsEnnemisSerpent);
  });
}

// renvoie l'ennemi le plus proche d'un point (null s'il n'y en a aucun)
// option Visée auto : ennemi près du curseur du joueur actif, sinon (s'il ne vise plus) le plus proche de la tourelle
function ennemiAimante() {
  const pres = ennemiLePlusProche(mouseX, mouseY);
  if (pres && Math.hypot(pres.x - mouseX, pres.y - mouseY) <= rayonAimantVisee + pres.radius) return pres;
  if (performance.now() < viseeManuelleJusqua) return null; // il vise un endroit précis : on le laisse faire
  return ennemiLePlusProche(turretPixelPos.x, turretPixelPos.y);
}

function ennemiLePlusProche(x, y) {
  let nearest = null;
  let nearestDist = Infinity;
  enemies.forEach(e => {
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = e;
    }
  });
  return nearest;
}

// angle de tir de la tourelle du joueur actif vers un ennemi, en anticipant son mouvement
// (sauf laser instantané ou cible gelée : on vise directement)
function angleVersEnnemi(cible) {
  const useHitscan = performance.now() < laserBuffUntil;
  const isTargetFrozen = performance.now() < (cible.frozenUntil || 0);
  return (useHitscan || isTargetFrozen)
    ? Math.atan2(cible.y - turretPixelPos.y, cible.x - turretPixelPos.x)
    : computeInterceptAngle(turretPixelPos.x, turretPixelPos.y, cible, projectileSpeed);
}

// collisions entre les ennemis et le serpent du joueur actif
function collisionsEnnemisSerpent() {
  // la tête du serpent brise les ennemis gelés (sauf le boss) ; un ennemi gelé ne blesse pas
  {
    const teteX = snake[0].x * gridSize + gridSize / 2;
    const teteY = snake[0].y * gridSize + gridSize / 2;
    const brises = [];
    enemies.forEach((e, ei) => {
      if (e.isBoss || !estGele(e)) return;
      if (Math.hypot(e.x - teteX, e.y - teteY) < e.radius + gridSize / 2) brises.push(ei);
    });
    if (brises.length) {
      brises.forEach(ei => {
        awardEnemyKill(enemies[ei], 'tete');
        spawnPopup(enemies[ei].x, enemies[ei].y - 12, 'CRAC !', '#80d8ff');
      });
      enemies = enemies.filter((_, i) => !brises.includes(i));
      registerKills(brises.length);
    }
  }

  // collisions ennemi <-> serpent
  const now = performance.now();
  const isShielded = now < shieldActiveUntil;
  const isBuffInvincible = now < buffInvincibleUntil;
  const isInvulnerable = now < invulnerableUntil || isShielded || isBuffInvincible;

  if (!isInvulnerable) {
    const hitEnemies = new Map(); // indice de l'ennemi -> indice du segment touché
    enemies.forEach((e, ei) => {
      if (!e.isBoss && estGele(e)) return; // gelé : inoffensif pour le corps
      for (let si = 0; si < snake.length; si++) {
        const segCx = snake[si].x * gridSize + gridSize / 2;
        const segCy = snake[si].y * gridSize + gridSize / 2;
        if (Math.hypot(e.x - segCx, e.y - segCy) < e.radius + gridSize / 2) {
          hitEnemies.set(ei, si);
          break;
        }
      }
    });

    if (hitEnemies.size) {
      addScore(-5);
      hitEnemies.forEach((si, ei) => {
        const e = enemies[ei];
        const segCx = snake[si].x * gridSize + gridSize / 2;
        const segCy = snake[si].y * gridSize + gridSize / 2;
        // blessure sur le segment touché (elle suit le corps), éclaboussure rouge à cet endroit
        // cicatrice définitive sur ce morceau du corps : repérée depuis la queue, elle avance avec le serpent
        const cote = Math.sign((e.x - segCx) * (snake[0].y - segCy) - (e.y - segCy) * (snake[0].x - segCx)) || 1;
        blessures.push({k: snake.length - 1 - si, debut: now, cote});
        if (blessures.length > maxBlessures) blessures.shift();
        spawnPopup(segCx, segCy, '-5', '#ff5252');
        spawnParticles(segCx, segCy, '#ff5252', 14);
        // l'ennemi meurt en touchant : on le signale là où il était
        marquesImpact.push({x: e.x, y: e.y, couleur: e.color, debut: now});
        spawnParticles(e.x, e.y, e.color, 10);
      });
      triggerShake(6);
      if (snake.length > 1) {
        snake.pop();
        retirerBlessuresQueue(1);
      }
      enemies = enemies.filter((_, i) => !hitEnemies.has(i));

      lives -= 1;
      succesCoeurPerdu();
      declencherFlash('#ff1744');
      updateHeartsDisplay();
      playLoseHeartSound();
      invulnerableUntil = performance.now() + invulnerabilityDuration;

      if (lives <= 0) {
        eliminerJoueur();
      }
    }
  } else {
    // le joueur est invulnérable (bouclier ou fenêtre post-dégâts) :
    // les ennemis qui touchent le serpent sont détruits au lieu d'infliger des dégâts
    const destroyedEnemies = new Set();
    enemies.forEach((e, ei) => {
      for (const segment of snake) {
        const segCx = segment.x * gridSize + gridSize / 2;
        const segCy = segment.y * gridSize + gridSize / 2;
        if (Math.hypot(e.x - segCx, e.y - segCy) < e.radius + gridSize / 2) {
          destroyedEnemies.add(ei);
          break;
        }
      }
    });

    if (destroyedEnemies.size) {
      if (isShielded) succesParade();
      destroyedEnemies.forEach(ei => awardEnemyKill(enemies[ei]));
      enemies = enemies.filter((_, i) => !destroyedEnemies.has(i));
      registerKills(destroyedEnemies.size);
    }
  }
}

// calcule l'angle de tir anticipé pour intercepter une cible mobile,
// en tenant compte de sa vitesse et du temps de trajet du projectile
function computeInterceptAngle(shooterX, shooterY, target, projSpeed) {
  const dx = target.x - shooterX;
  const dy = target.y - shooterY;
  const tvx = target.vx || 0;
  const tvy = target.vy || 0;

  const a = tvx * tvx + tvy * tvy - projSpeed * projSpeed;
  const b = 2 * (dx * tvx + dy * tvy);
  const c = dx * dx + dy * dy;

  let t = null;
  if (Math.abs(a) < 1e-6) {
    // vitesses quasi égales : résoudre l'équation linéaire restante
    if (Math.abs(b) > 1e-6) t = -c / b;
  } else {
    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0) {
      const sqrtDisc = Math.sqrt(discriminant);
      const t1 = (-b + sqrtDisc) / (2 * a);
      const t2 = (-b - sqrtDisc) / (2 * a);
      const candidates = [t1, t2].filter(v => v > 0);
      if (candidates.length) t = Math.min(...candidates);
    }
  }

  // si aucune interception valide trouvée, on vise simplement la position actuelle
  if (t === null || !isFinite(t)) {
    return Math.atan2(dy, dx);
  }

  const targetX = target.x + tvx * t;
  const targetY = target.y + tvy * t;
  return Math.atan2(targetY - shooterY, targetX - shooterX);
}
