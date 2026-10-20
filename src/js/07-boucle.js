function tick() {
  if (gameOver) return;

  // sauvegarde des positions actuelles pour interpoler le rendu ensuite
  prevSnake = snake.map(s => ({...s}));

  // mémorise un instantané du serpent pour un éventuel rollback, et purge les plus anciens
  snakeHistory.push({
    time: performance.now(),
    snake: snake.map(s => ({...s})),
    direction: {...direction},
    nextDirection: {...nextDirection}
  });
  const cutoffTime = performance.now() - rollbackHistoryDuration;
  snakeHistory = snakeHistory.filter(h => h.time >= cutoffTime);

  direction = nextDirection;
  directionLockedThisTick = false; // un seul virage sera accepté avant le prochain déplacement
  if (direction.x === 0 && direction.y === 0) {
    return; // le serpent n'a pas encore bougé
  }

  const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};

  // collision avec les murs
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    if (tryRollback()) {
      return; // rollback effectué : la partie continue au lieu du game over
    }
    eliminerJoueur(); // solo : game over ; coop : ce serpent sort de la partie
    return;
  }

  // collision avec soi-même : détruit la partie touchée au lieu de tuer directement,
  // sauf si le joueur est invulnérable (bouclier ou fenêtre post-dégâts), auquel cas on ignore
  const selfHitIndex = snake.findIndex(segment => segment.x === head.x && segment.y === head.y);
  const isCurrentlyInvulnerable = performance.now() < invulnerableUntil || performance.now() < shieldActiveUntil || performance.now() < buffInvincibleUntil;

  if (selfHitIndex > 0 && !isCurrentlyInvulnerable) {
    const segmentsLost = snake.length - selfHitIndex;
    snake = snake.slice(0, selfHitIndex);
    retirerBlessuresQueue(segmentsLost); // les cicatrices de la partie perdue partent avec elle

    const penalty = 10 * segmentsLost;
    addScore(-penalty);

    const px = head.x * gridSize + gridSize / 2;
    const py = head.y * gridSize + gridSize / 2;
    spawnPopup(px, py, '-' + penalty, '#ff5252');
    spawnParticles(px, py, currentTheme.snakeBody, 14);
    triggerShake(6);

    lives -= 1;
    succesCoeurPerdu();
    declencherFlash('#ff1744');
    updateHeartsDisplay();
    playLoseHeartSound();
    invulnerableUntil = performance.now() + invulnerabilityDuration;

    if (lives <= 0) {
      eliminerJoueur();
      return;
    }
  } else if (selfHitIndex > 0 && isCurrentlyInvulnerable) {
    // invulnérable : on traverse son propre corps sans dommage
  } else if (enCoop() && capacitesActives.collisionJoueurs && !isCurrentlyInvulnerable) {
    // collision entre joueurs (option) : celui qui fonce dans l'autre serpent perd un cœur
    // et le traverse pendant son invulnérabilité ; le serpent percuté n'est pas touché
    const percute = joueurs.find(j => j !== joueurActif && !j.elimine &&
      j.snake.some(s => s.x === head.x && s.y === head.y));
    if (percute) {
      const penalty = 10;
      addScore(-penalty);
      const px = head.x * gridSize + gridSize / 2;
      const py = head.y * gridSize + gridSize / 2;
      spawnPopup(px, py, '-' + penalty, '#ff5252');
      spawnParticles(px, py, couleurJoueur(percute), 14);
      triggerShake(6);

      lives -= 1;
      succesCoeurPerdu();
      succesCollisionJoueurs();
      declencherFlash('#ff1744');
      updateHeartsDisplay();
      playLoseHeartSound();
      invulnerableUntil = performance.now() + invulnerabilityDuration;

      if (lives <= 0) {
        eliminerJoueur();
        return;
      }
    }
  }

  snake.unshift(head);
  stats.maxSnakeLength = Math.max(stats.maxSnakeLength, snake.length);
  majCompteurSegments();
  succesLongueur(snake.length);
  checkEndgameTransition();

  if (!hasWon && snake.length >= winSnakeLength) {
    triggerWin();
    return;
  }

  const lootIndex = lootApples.findIndex(a => a.x === head.x && a.y === head.y);

  if (head.x === food.x && head.y === food.y) {
    stats.applesEaten++;
    joueurActif.pommes++;
    const gained0 = addScore(10);
    const px0 = head.x * gridSize + gridSize / 2;
    const py0 = head.y * gridSize + gridSize / 2;
    spawnPopup(px0, py0, '+' + gained0, '#4caf50');
    placeFood();
    playApplePickupSound();
    succesPomme('normale');
    tongueUntil = performance.now() + tongueDuration;
  } else if (lootIndex !== -1) {
    stats.applesEaten++;
    joueurActif.pommes++;
    const gained1 = addScore(10);
    const px = head.x * gridSize + gridSize / 2;
    const py = head.y * gridSize + gridSize / 2;
    spawnPopup(px, py, '+' + gained1, '#4caf50');
    playApplePickupSound();
    lootApples.splice(lootIndex, 1);
    succesPomme('butin');
    tongueUntil = performance.now() + tongueDuration;
  } else if (pendingGrowth > 0) {
    pendingGrowth--; // croissance différée (pomme en or) : la queue n'est pas retirée ce tick
  } else {
    snake.pop();
  }
}

function togglePause() {
  if (waitingToStart || countdownActive || gameOver) return;

  if (!isPaused) {
    isPaused = true;
    pauseStartTime = performance.now();
    pauseBtn.textContent = '▶️ Reprendre';
    pauseBtn.classList.add('active');
  } else {
    const pausedDuration = performance.now() - pauseStartTime;
    isPaused = false;
    pauseBtn.textContent = '⏸️ Pause';
    pauseBtn.classList.remove('active');

    // décale toutes les échéances temporelles pour que la pause ne fasse pas avancer
    // les buffs, cooldowns et autres minuteurs basés sur performance.now()
    joueurs.forEach(j => {
      j.lastTickTime += pausedDuration;
      j.invulnerableUntil += pausedDuration;
      j.shieldActiveUntil += pausedDuration;
      j.shieldReadyAt += pausedDuration;
      j.buffInvincibleUntil += pausedDuration;
      j.doublePointsUntil += pausedDuration;
      j.laserBuffUntil += pausedDuration;
      j.autoAimBuffUntil += pausedDuration;
      j.blessures.forEach(b => b.debut += pausedDuration);
    });
    marquesImpact.forEach(m => m.debut += pausedDuration);
    previousFrameTime += pausedDuration;
    lastEnemySpawn += pausedDuration;
    freezeIndicatorUntil += pausedDuration;
    explosionActiveUntil += pausedDuration;
    slowMotionUntil += pausedDuration;
    debutRalenti += pausedDuration;
    if (rollbackPlayback) rollbackPlayback.lastStepTime += pausedDuration;
    stats.startTime += pausedDuration;
    decalerTuto(pausedDuration);
    if (astuceEnCours) astuceEnCours.debut += pausedDuration;
    enemies.forEach(e => {
      if (e.frozenUntil) e.frozenUntil += pausedDuration;
      if (e.hitFlashUntil) e.hitFlashUntil += pausedDuration;
    });
  }
}

function toggleMute() {
  isMuted = !isMuted;
  ecrireOption('muet', isMuted);
  majBoutonMuet();
}

function majBoutonMuet() {
  muteBtn.textContent = isMuted ? '🔇 Muet' : '🔊 Son';
  muteBtn.classList.toggle('active', isMuted);
  if (typeof majMenuOptions === 'function') majMenuOptions();
}

pauseBtn.addEventListener('click', togglePause);

document.querySelectorAll('.skin-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!contenuDebloque('skin', btn.dataset.skin)) return ouvrirMenuBuffs('skin:' + btn.dataset.skin); // skin gagné par un succès
    enemySkin = btn.dataset.skin;
    document.querySelectorAll('.skin-btn').forEach(b => b.classList.toggle('active', b === btn));
  });
});
muteBtn.addEventListener('click', toggleMute);

function renderLoop(now) {
  lireManette(now);
  ctx.setTransform(echelleRendu, 0, 0, echelleRendu, 0, 0); // coordonnées 400 x 400, image à la taille de l'écran

  if (isPaused) {
    draw(1);
    dessinerTuto();
    drawPauseOverlay();
    animationFrameId = requestAnimationFrame(renderLoop);
    return;
  }

  if (rollbackPlayback) {
    const rp = rollbackPlayback;
    const elapsedSinceStep = now - rp.lastStepTime;

    if (elapsedSinceStep >= rp.frameDuration) avecJoueur(rp.joueur, () => {
      prevSnake = snake.map(s => ({...s}));
      snake = rp.frames[rp.index].snake.map(s => ({...s}));
      rp.index++;
      rp.lastStepTime = now;

      if (rp.index >= rp.frames.length) {
        // fin de l'animation : on restaure la direction de l'instant ciblé et on reprend le jeu normal
        const finalFrame = rp.frames[rp.frames.length - 1];
        direction = {...finalFrame.direction};
        nextDirection = {...finalFrame.nextDirection};
        rollbackPlayback = null;
        joueurs.forEach(j => j.lastTickTime = now); // les autres serpents attendaient aussi
        previousFrameTime = now;
      }
    });

    // seul le serpent qui recule est animé, les autres restent figés
    const tRecul = rollbackPlayback ? Math.min(1, (now - rp.lastStepTime) / rp.frameDuration) : 1;
    draw(j => j === rp.joueur ? tRecul : 1);
    drawSlowMotionOverlay();
    drawEndgameTransitionMessage();
    dessinerTuto();
    animationFrameId = requestAnimationFrame(renderLoop);
    return;
  }

  const frameDelta = previousFrameTime ? now - previousFrameTime : 16;
  previousFrameTime = now;

  updateFireworks(frameDelta); // continue à s'animer même pendant l'écran de victoire (gameOver)

  if (waitingToStart) {
    // rien ne bouge tant que le joueur n'a pas appuyé sur espace
  } else if (countdownActive) {
    if (now - countdownStartTime >= countdownTotalDuration) {
      countdownActive = false;
      // si un joueur n'a rien pressé pendant le compte à rebours, il part dans sa direction par défaut
      // (vers la droite en solo)
      joueurs.forEach(j => {
        if (j.nextDirection.x === 0 && j.nextDirection.y === 0) {
          j.nextDirection = {...j.directionDepart};
        }
        j.lastTickTime = now;
      });
      stats.startTime = now;
      succesDebutPartie();
    }
  } else {
    const timeScale = now < slowMotionUntil ? slowMotionFactor : 1;

    if (!gameOver) {
      updateCombat(frameDelta * timeScale);
      surveillerPerformances(now, frameDelta);
    }
    majTuto(now, frameDelta);
    majAstuces(now);
    majSucces(now, frameDelta);

    // chaque serpent avance à son propre rythme (le boost de l'un ne presse pas l'autre)
    joueurs.forEach(j => {
      if (j.elimine) return;
      avecJoueur(j, () => {
        let elapsed = now - lastTickTime;
        const effectiveTickInterval = tickInterval * facteurEnglue(j) / timeScale; // toile de l'Araignée : plus lent

        // on rattrape autant de ticks logiques que nécessaire, puis on recalcule
        // l'écart restant à chaque fois pour que l'interpolation reparte bien de 0
        while (elapsed >= effectiveTickInterval && !j.elimine) {
          tick();
          lastTickTime += effectiveTickInterval;
          elapsed = now - lastTickTime;
        }
      });
    });
  }

  // t va de 0 à 1 entre deux ticks logiques, pour interpoler le dessin (propre à chaque serpent)
  const currentTimeScale = now < slowMotionUntil ? slowMotionFactor : 1;
  const fige = gameOver || countdownActive || waitingToStart;
  draw(j => fige ? 1 : (now - j.lastTickTime) / (j.tickInterval * facteurEnglue(j) / currentTimeScale));

  drawSlowMotionOverlay();
  drawEndgameTransitionMessage();
  dessinerEcranGameOver();
  dessinerTuto();
  dessinerAstuce();

  updateShieldDisplay();
  updateBuffStatusDisplay();

  animationFrameId = requestAnimationFrame(renderLoop);
}

