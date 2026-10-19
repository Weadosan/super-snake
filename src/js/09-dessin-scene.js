// t : avancement entre deux déplacements (0 à 1), un nombre commun à tous les serpents
// ou une fonction (joueur) => nombre, chaque serpent ayant son propre rythme
function draw(t) {
  // screen shake : décalage aléatoire décroissant après un coup reçu
  ctx.save();
  const shakeRemaining = shakeUntil - performance.now();
  if (shakeRemaining > 0) {
    const intensity = shakeMagnitude * (shakeRemaining / shakeDuration);
    const offsetX = (Math.random() - 0.5) * 2 * intensity;
    const offsetY = (Math.random() - 0.5) * 2 * intensity;
    ctx.translate(offsetX, offsetY);
  }

  ctx.fillStyle = currentTheme.canvasBg;
  ctx.fillRect(0, 0, largeurPlateau, hauteurPlateau);

  drawBackgroundPattern();
  dessinerDecorAnime();
  dessinerParticulesAmbiance();

  dessinerPommeVivante();

  // les serpents (un par joueur encore en jeu), chacun avec ses couleurs
  joueurs.forEach(j => {
    if (j.elimine) {
      j.turretPixelPos = null;
      return;
    }
    avecJoueur(j, () => dessinerSerpent(typeof t === 'function' ? t(j) : t));
  });

  updateTurretOpacity();
  drawSpawnWarning();
  drawBossSpawnWarning();
  drawBossWarning();
  dessinerSolAttaquesBoss();
  drawEnemies();
  dessinerMarquesImpact();
  drawHeartPickup();
  drawLootApples();
  drawGoldenApple();
  drawBlueApple();
  drawShockwaves();
  drawLaserBeams();
  drawProjectiles();
  dessinerAttaquesBoss();
  // la tourelle n'existe que s'il reste un 2e segment pour la porter
  joueursEnJeu().forEach(j => {
    if (!j.turretPixelPos || turretOpacity <= 0.01) return;
    avecJoueur(j, () => {
      ctx.save();
      ctx.globalAlpha *= turretOpacity;
      drawTurret();
      ctx.restore();
    });
  });
  if (enCoop()) dessinerEtiquettesJoueurs();
  drawParticles();
  drawPopups();
  drawFireworks();

  ctx.restore(); // fin du décalage de screen shake, l'overlay ci-dessous reste fixe

  dessinerFlashEcran();
  drawCountdown();
}

// cicatrices définitives sur les segments touchés par un ennemi : chacune reste sur son morceau
// de corps (même rang depuis la queue) et avance donc avec le serpent ; la plaie saigne au début
function dessinerBlessures(positions) {
  const now = performance.now();
  const n = positions.length;
  blessures.forEach(b => {
    const i = n - 1 - b.k;
    if (i < 0 || i >= n) return;
    const pos = positions[i];
    const prev = positions[Math.max(0, i - 1)];
    const next = positions[Math.min(n - 1, i + 1)];
    const angleCorps = Math.atan2(next.y - prev.y, next.x - prev.x) || 0;
    const age = now - b.debut;
    const fraiche = Math.max(0, 1 - age / 2500); // 1 juste après le coup, 0 quand c'est cicatrisé
    const cx = pos.x * gridSize + gridSize / 2;
    const cy = pos.y * gridSize + gridSize / 2;
    const s = gridSize / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleCorps);
    // trois griffures en travers du corps, du côté où l'ennemi a frappé
    ctx.lineCap = 'round';
    for (let passe = 0; passe < 2; passe++) {
      ctx.strokeStyle = passe === 0 ? 'rgba(60, 0, 8, 0.7)' : (fraiche > 0 ? '#ff1744' : '#b71c1c');
      ctx.lineWidth = passe === 0 ? 3.2 : 1.7;
      for (let m = -1; m <= 1; m++) {
        ctx.beginPath();
        ctx.moveTo(m * s * 0.38 - s * 0.18, -s * 0.62 * b.cote);
        ctx.lineTo(m * s * 0.38 + s * 0.18, s * 0.35 * b.cote);
        ctx.stroke();
      }
    }
    // plaie fraîche : halo rouge et goutte qui perle, puis il ne reste que la cicatrice
    if (fraiche > 0) {
      ctx.fillStyle = 'rgba(213, 0, 0, ' + (0.35 * fraiche) + ')';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(213, 0, 0, ' + fraiche + ')';
      ctx.beginPath();
      ctx.arc(s * 0.2, (s * 0.4 + (1 - fraiche) * s * 0.4) * b.cote, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

// marque là où un ennemi est mort en touchant le serpent : onde rouge et croix qui s'effacent
function dessinerMarquesImpact() {
  const now = performance.now();
  marquesImpact = marquesImpact.filter(m => now - m.debut < dureeMarqueImpact);
  marquesImpact.forEach(m => {
    const p = (now - m.debut) / dureeMarqueImpact;
    const alpha = 1 - p;
    ctx.save();
    ctx.translate(m.x, m.y);
    // deux ondes qui s'élargissent
    ctx.lineWidth = 2;
    for (let k = 0; k < 2; k++) {
      const pk = Math.min(1, p * 1.6 - k * 0.3);
      if (pk <= 0) continue;
      ctx.strokeStyle = 'rgba(255, 23, 68, ' + (alpha * (1 - pk * 0.5)) + ')';
      ctx.beginPath();
      ctx.arc(0, 0, 8 + pk * 26, 0, Math.PI * 2);
      ctx.stroke();
    }
    // croix à l'endroit exact, couleur de l'ennemi cerclée de rouge
    const t = 7 * (1 - p * 0.3);
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0, 0, 0, ' + (alpha * 0.6) + ')';
    ctx.beginPath();
    ctx.moveTo(-t, -t); ctx.lineTo(t, t); ctx.moveTo(t, -t); ctx.lineTo(-t, t);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = m.couleur || '#ff1744';
    ctx.stroke();
    ctx.restore();
  });
}

// dessine le serpent du joueur actif (corps, tête, yeux, halos) et place sa tourelle
function dessinerSerpent(t) {
  // position interpolée de chaque segment entre le tick précédent et l'actuel
  const positions = computeInterpolatedPositions(t);

  drawSnakeConnections(positions);

  // traînée : on mémorise la position de la tête à chaque frame de jeu active
  if (!waitingToStart && !countdownActive && !gameOver) {
    const headPixel = {
      x: positions[0].x * gridSize + gridSize / 2,
      y: positions[0].y * gridSize + gridSize / 2
    };
    const last = trailPoints[trailPoints.length - 1];
    if (!last || Math.hypot(headPixel.x - last.x, headPixel.y - last.y) > 2) {
      trailPoints.push({x: headPixel.x, y: headPixel.y, alpha: 0.5});
      // pendant le ralenti, la traînée dure plus longtemps (images fantômes)
      const maxPoints = enRalenti() ? trailMaxPoints * 3 : trailMaxPoints;
      while (trailPoints.length > maxPoints) trailPoints.shift();
    }
  }
  const fade = enRalenti() ? trailFadeRate * 0.3 : trailFadeRate;
  trailPoints.forEach(p => p.alpha -= fade);
  trailPoints = trailPoints.filter(p => p.alpha > 0);
  drawTrail();

  // corps (dessiné en dernier pour que la tête soit toujours par-dessus)
  const isInvulnerable = performance.now() < invulnerableUntil;
  const flashVisible = !isInvulnerable || Math.floor(performance.now() / 100) % 2 === 0;
  ctx.globalAlpha = flashVisible ? 1 : 0.3;

  // corps en dégradé : la couleur fonce par paliers vers la queue, ou suit le skin (js/08-skins-serpent.js)
  const couleurPalier = i => couleurSegmentSerpent(i, positions.length);
  const motif = motifSerpent();

  positions.forEach((pos, i) => {
    if (i === 0) return;
    const isTail = i === positions.length - 1;

    if (isTail) {
      drawSnakeTail(pos, positions[i - 1], gridSize, couleurPalier(i));
    } else {
      // direction locale du corps à travers ce segment (entre le précédent et le suivant)
      const prevPos = positions[i - 1];
      const nextPos = positions[i + 1] || pos;
      const localAngle = Math.atan2(nextPos.y - prevPos.y, nextPos.x - prevPos.x);

      // coude net -> coin arrondi ; voisins non alignés (virage en cours d'animation) -> disque
      let coin = coinVirage(prevPos, pos, positions[i + 1]);
      if (!coin) {
        const ax = pos.x - prevPos.x, ay = pos.y - prevPos.y;
        const bx = nextPos.x - pos.x, by = nextPos.y - pos.y;
        const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
        if (la > 0.01 && lb > 0.01 && Math.abs(ax * by - ay * bx) / (la * lb) > 0.2) coin = 'rond';
      }
      drawSnakeSegment(
        pos.x * gridSize + 1,
        pos.y * gridSize + 1,
        gridSize - 2,
        couleurPalier(i),
        motif,
        coin && coin !== 'rond' ? 0 : localAngle,
        coin
      );
    }
  });

  // tête (forme arrondie pour être bien reconnaissable)
  const headPos = positions[0];
  if (currentTheme.glow) {
    ctx.shadowColor = currentTheme.snakeBody;
    ctx.shadowBlur = 8;
  }
  drawSnakeHead(headPos, gridSize, currentTheme.snakeHead);
  ctx.shadowBlur = 0;

  if (skinActif().yeux === 'visiere') dessinerVisiere(headPos);
  else drawEyes(headPos);
  dessinerDecorTete(headPos); // cornes, oreilles, antenne ou couronne du skin (js/08-skins-serpent.js)
  drawTongue(headPos);
  ctx.globalAlpha = 1;
  dessinerBlessures(positions); // bien visibles même quand le serpent clignote

  // halo du bouclier temporaire (Shift), pulsant, autour de toute la tête
  if (performance.now() < shieldActiveUntil) {
    const cx = headPos.x * gridSize + gridSize / 2;
    const cy = headPos.y * gridSize + gridSize / 2;
    const pulse = 1 + Math.sin(performance.now() / 80) * 0.15;
    ctx.save();
    ctx.strokeStyle = 'rgba(80, 180, 255, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, (gridSize / 2 + 4) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(80, 180, 255, 0.3)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, (gridSize / 2 + 4) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // halo doré du buff d'invincibilité (pomme bleue), distinct du bouclier bleu
  if (performance.now() < buffInvincibleUntil) {
    const cx = headPos.x * gridSize + gridSize / 2;
    const cy = headPos.y * gridSize + gridSize / 2;
    const pulse = 1 + Math.sin(performance.now() / 100) * 0.2;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, (gridSize / 2 + 8) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(cx, cy, (gridSize / 2 + 8) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // flash discret sur la tête quand un buff (n'importe lequel) est sur le point d'expirer,
  // pour prévenir sans devoir regarder le HUD
  if (isAnyBuffExpiringSoon()) {
    const cx = headPos.x * gridSize + gridSize / 2;
    const cy = headPos.y * gridSize + gridSize / 2;
    const blinkVisible = Math.floor(performance.now() / 300) % 2 === 0;
    if (blinkVisible) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, gridSize / 2 + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // petit anneau de recharge du bouclier autour de la tête (masqué pendant le bouclier actif,
  // déjà signalé par son propre halo bleu pulsant)
  if (performance.now() >= shieldActiveUntil && capacitesActives.bouclier) {
    drawShieldCooldownRing(headPos);
  }

  // la tourelle n'existe que s'il reste un 2e segment pour la porter
  const hasTurret = positions.length >= 2;
  if (hasTurret) {
    const turretSegment = positions[1];
    turretPixelPos = {
      x: turretSegment.x * gridSize + gridSize / 2,
      y: turretSegment.y * gridSize + gridSize / 2
    };
  } else {
    turretPixelPos = null;
  }
}

// coop : « J1 » / « J2 » au-dessus de chaque tête avant le départ, au début de la partie
// et juste après une réanimation, pour que chacun repère son serpent
function dessinerEtiquettesJoueurs() {
  const now = performance.now();
  joueursEnJeu().forEach(j => {
    const debutPartie = waitingToStart || countdownActive || now - stats.startTime < 3000;
    const reanime = now - j.reanimeA < 2500;
    if (!debutPartie && !reanime) return;
    const pos = j.interpolatedPositionsCache[0] || j.snake[0];
    const cx = pos.x * gridSize + gridSize / 2;
    const cy = pos.y * gridSize - 12;
    ctx.save();
    ctx.font = 'bold 13px ' + currentTheme.fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.strokeText(j.nom, cx, cy);
    ctx.fillStyle = couleurJoueur(j);
    ctx.fillText(j.nom, cx, cy);
    ctx.restore();
  });
}

// vrai pendant le ralenti (rollback ou disparition/retour des ennemis)
function enRalenti() {
  return performance.now() < slowMotionUntil;
}

// halo flou de la couleur de la pomme, dessiné une fois par thème
let auraPommeCache = null;
let auraPommeTheme = '';
function getAuraPomme() {
  if (auraPommeCache && auraPommeTheme === currentThemeName) return auraPommeCache;
  const taille = 64;
  const c = document.createElement('canvas');
  c.width = taille;
  c.height = taille;
  const actx = c.getContext('2d');
  const num = parseInt(currentTheme.food.slice(1), 16);
  const rgb = ((num >> 16) & 0xff) + ', ' + ((num >> 8) & 0xff) + ', ' + (num & 0xff);
  const grad = actx.createRadialGradient(taille / 2, taille / 2, 0, taille / 2, taille / 2, taille / 2);
  grad.addColorStop(0, 'rgba(' + rgb + ', 0.75)');
  grad.addColorStop(0.45, 'rgba(' + rgb + ', 0.35)');
  grad.addColorStop(1, 'rgba(' + rgb + ', 0)');
  actx.fillStyle = grad;
  actx.fillRect(0, 0, taille, taille);
  auraPommeCache = c;
  auraPommeTheme = currentThemeName;
  return c;
}

// pomme qui « respire » doucement, avec un petit reflet brillant qui tourne autour
function dessinerPommeVivante() {
  const now = performance.now();
  const cx = food.x * gridSize + gridSize / 2;
  const cy = food.y * gridSize + gridSize / 2;
  const rayon = (gridSize / 2 - 2) * (1 + Math.sin(now / 260) * 0.08);

  // aura pulsante autour de la pomme (sprite en cache, simplement agrandi/réduit)
  const aura = getAuraPomme();
  const tailleAura = gridSize * 3 * (1 + Math.sin(now / 400) * 0.12);
  ctx.save();
  ctx.globalAlpha = 0.75 + Math.sin(now / 400) * 0.2;
  ctx.drawImage(aura, cx - tailleAura / 2, cy - tailleAura / 2, tailleAura, tailleAura);
  ctx.restore();

  ctx.save();
  if (currentTheme.glow) {
    ctx.shadowColor = currentTheme.food;
    ctx.shadowBlur = 12;
  }
  if (!dessinerPommeTheme('normale', cx, cy, rayon)) fillRadialCircle(cx, cy, rayon, currentTheme.food);
  ctx.shadowBlur = 0;

  const angle = now / 450;
  ctx.globalAlpha = 0.6 + Math.sin(now / 150) * 0.3;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx + Math.cos(angle) * (rayon + 3), cy + Math.sin(angle) * (rayon + 3), 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// crée une particule d'ambiance selon le thème ; depuisBord : apparaît hors écran (bas ou haut)
function creerParticuleAmbiance(depuisBord) {
  const w = largeurPlateau, h = hauteurPlateau;
  const p = {x: Math.random() * w, y: Math.random() * h, phase: Math.random() * Math.PI * 2};
  if (mondesSupp[currentThemeName]) {
    mondesSupp[currentThemeName].creerParticule(p, depuisBord);
  } else if (currentThemeName === 'espace') {
    // étoiles qui défilent vers le bas (les plus grosses vont plus vite : effet de profondeur)
    const profondeur = Math.random();
    p.vx = 0;
    p.vy = 0.01 + profondeur * 0.05;
    p.taille = 0.6 + profondeur * 1.4;
    if (depuisBord) p.y = -4;
  } else if (currentThemeName === 'lave') {
    // braises qui montent en vacillant
    p.vx = (Math.random() - 0.5) * 0.01;
    p.vy = -(0.015 + Math.random() * 0.025);
    p.taille = 1 + Math.random() * 1.6;
    if (depuisBord) p.y = h + 4;
  } else if (currentThemeName === 'ocean') {
    // bulles qui remontent en ondulant
    p.vx = 0;
    p.vy = -(0.012 + Math.random() * 0.02);
    p.taille = 1.5 + Math.random() * 3;
    if (depuisBord) p.y = h + 6;
  } else {
    // néon : étincelles qui montent lentement
    p.vx = (Math.random() - 0.5) * 0.008;
    p.vy = -(0.01 + Math.random() * 0.015);
    p.taille = 1 + Math.random() * 1.2;
    if (depuisBord) p.y = h + 4;
  }
  return p;
}

function dessinerParticulesAmbiance() {
  const now = performance.now();
  if (particulesAmbianceTheme !== currentThemeName) {
    particulesAmbiance = [];
    for (let i = 0; i < nbParticulesAmbiance; i++) particulesAmbiance.push(creerParticuleAmbiance(false));
    particulesAmbianceTheme = currentThemeName;
    derniereMajAmbiance = now;
  }
  // figées en pause, ralenties pendant le ralenti
  let dt = Math.min(50, now - derniereMajAmbiance);
  derniereMajAmbiance = now;
  if (isPaused) dt = 0;
  if (enRalenti()) dt *= slowMotionFactor;

  const w = largeurPlateau, h = hauteurPlateau;
  const theme = currentThemeName;
  const monde = mondesSupp[theme];
  ctx.save();
  for (let i = 0; i < particulesAmbiance.length; i++) {
    const p = particulesAmbiance[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (monde && monde.bougerParticule) monde.bougerParticule(p, now, dt);
    if (theme === 'lave') p.x += Math.sin(now / 300 + p.phase) * 0.012 * dt;
    if (theme === 'ocean') p.x += Math.sin(now / 700 + p.phase) * 0.015 * dt;
    if (p.y < -8 || p.y > h + 8 || p.x < -8 || p.x > w + 8) {
      particulesAmbiance[i] = creerParticuleAmbiance(true);
      continue;
    }
    const scintille = 0.5 + Math.sin(now / 400 + p.phase) * 0.5;
    if (monde) {
      monde.dessinerParticule(p, now, scintille);
    } else if (theme === 'espace') {
      ctx.globalAlpha = 0.35 + scintille * 0.5;
      ctx.fillStyle = '#ffffff';
      if (p.taille > 1.6) {
        // étoile rapide : petite traînée verticale
        ctx.fillRect(p.x - 0.5, p.y - p.taille * 4, 1, p.taille * 4);
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.taille, 0, Math.PI * 2);
      ctx.fill();
    } else if (theme === 'lave') {
      // la braise refroidit en montant : jaune en bas, rouge sombre en haut
      const chaleur = p.y / h;
      ctx.globalAlpha = 0.25 + chaleur * 0.6 * (0.6 + scintille * 0.4);
      ctx.fillStyle = chaleur > 0.6 ? '#ffd54f' : chaleur > 0.3 ? '#ff9100' : '#d84315';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.taille, 0, Math.PI * 2);
      ctx.fill();
    } else if (theme === 'ocean') {
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = '#b2ebf2';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.taille, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x - p.taille * 0.4, p.y - p.taille * 0.5, 1, 1);
    } else {
      ctx.globalAlpha = 0.2 + scintille * 0.4;
      ctx.fillStyle = currentTheme.projectile;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.taille, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// bref voile blanc (bonus) ou rouge (coup reçu) sur tout l'écran
function dessinerFlashEcran() {
  if (!flashEcran) return;
  const progress = (performance.now() - flashEcran.debut) / flashDuree;
  if (progress >= 1 || progress < 0) {
    flashEcran = null;
    return;
  }
  ctx.save();
  ctx.globalAlpha = 0.28 * (1 - progress);
  ctx.fillStyle = flashEcran.couleur;
  ctx.fillRect(0, 0, largeurPlateau, hauteurPlateau);
  ctx.restore();
}

function drawSlowMotionOverlay() {
  const now = performance.now();
  if (now >= slowMotionUntil) return;

  const duree = Math.max(1, dureeRalenti);
  const progress = Math.min(1, Math.max(0, (now - debutRalenti) / duree));
  // entrée rapide (15 %), sortie douce (25 %)
  const entree = Math.min(1, progress / 0.15);
  const sortie = progress > 0.75 ? 1 - (progress - 0.75) / 0.25 : 1;
  const force = Math.min(entree, sortie);
  const w = largeurPlateau, h = hauteurPlateau;

  // vignette bleue sur les bords (le centre reste net)
  if (!vignetteRalentiCache) {
    vignetteRalentiCache = creerVignette('rgba(33, 150, 243, 0)', 'rgba(33, 150, 243, 0.55)');
  }
  ctx.save();
  ctx.globalAlpha = force;
  ctx.drawImage(vignetteRalentiCache, 0, 0);
  ctx.restore();

  // liseré bleu fin sur les bords (ne cache pas le terrain), qui pulse légèrement
  ctx.save();
  ctx.globalAlpha = force * (0.75 + Math.sin(now / 120) * 0.25);
  ctx.strokeStyle = '#40c4ff';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, w - 4, h - 4);

  // barre fine du temps restant, en bas
  const largeurMax = w * 0.5;
  const yBarre = h - 12;
  ctx.globalAlpha = force * 0.9;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect((w - largeurMax) / 2, yBarre, largeurMax, 3);
  ctx.fillStyle = '#40c4ff';
  ctx.fillRect((w - largeurMax) / 2, yBarre, largeurMax * (1 - progress), 3);

  // libellé en haut, avec une ombre pour rester lisible sans fond
  ctx.globalAlpha = force;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px ' + currentTheme.fontFamily;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4;
  ctx.fillText('🐢 RALENTI', w / 2, 16);
  ctx.shadowBlur = 0;

  // gros texte central pour le rollback (la disparition des ennemis a déjà son propre message au centre)
  if (causeRalenti === 'rollback') {
    const echelle = 1 + (1 - entree) * 0.4;
    ctx.translate(w / 2, h * 0.28);
    ctx.scale(echelle, echelle);
    ctx.font = 'bold 34px ' + policeTitre();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#40c4ff';
    ctx.fillText('⏪ ROLLBACK', 0, 0);
  }
  ctx.restore();
}

function drawPauseOverlay() {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, largeurPlateau, hauteurPlateau);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px ' + policeTitre();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 8;
  ctx.fillText('⏸️ PAUSE', largeurPlateau / 2, hauteurPlateau / 2 - 14);

  ctx.font = '14px ' + currentTheme.fontFamily;
  const texteReprise = modeEntree === 'manette' ? 'Appuie sur START pour reprendre'
    : modeEntree === 'tactile' ? 'Touche le jeu pour reprendre'
    : 'Appuie sur Échap ou ' + nomTouche(touches.pause) + ' pour reprendre';
  ctx.fillText(menuBuffsOuvert ? 'Boutique ouverte' : texteReprise, largeurPlateau / 2, hauteurPlateau / 2 + 20);
  ctx.restore();
}

function drawCountdown() {
  if (!waitingToStart && !countdownActive) return;

  // voile sombre pour faire ressortir le texte
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, 0, largeurPlateau, hauteurPlateau);

  if (waitingToStart) {
    // titre en haut, puis le tutoriel un peu réduit dessous
    const hauteurTitre = drawTitreJeu();
    const echelle = (hauteurPlateau - hauteurTitre) / hauteurPlateau;
    ctx.save();
    ctx.translate(largeurPlateau * (1 - echelle) / 2, hauteurTitre);
    ctx.scale(echelle, echelle);
    drawControlsTutorial();
    ctx.restore();
    return;
  }

  const elapsed = performance.now() - countdownStartTime;

  let label;
  if (elapsed < countdownPhaseDuration) {
    label = '3';
  } else if (elapsed < countdownPhaseDuration * 2) {
    label = '2';
  } else if (elapsed < countdownPhaseDuration * 3) {
    label = '1';
  } else {
    label = 'GO !';
  }

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px ' + policeTitre();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 12;
  ctx.fillText(label, largeurPlateau / 2, hauteurPlateau / 2);
  ctx.restore();
}

// --- Titre « SURVIE ET GRANDIS » : police pixel dessinée à la main (5 x 7), rien à télécharger ---
const policePixel = {
  S: [' ####', '#    ', '#    ', ' ### ', '    #', '    #', '#### '],
  U: ['#   #', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  R: ['#### ', '#   #', '#   #', '#### ', '# #  ', '#  # ', '#   #'],
  V: ['#   #', '#   #', '#   #', '#   #', '#   #', ' # # ', '  #  '],
  I: ['###', ' # ', ' # ', ' # ', ' # ', ' # ', '###'],
  E: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#####'],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  '],
  G: [' ####', '#    ', '#    ', '#  ##', '#   #', '#   #', ' ### '],
  A: [' ### ', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #', '#   #', '#   #'],
  D: ['#### ', '#   #', '#   #', '#   #', '#   #', '#   #', '#### '],
  ' ': ['  ', '  ', '  ', '  ', '  ', '  ', '  ']
};
const texteTitreJeu = 'SURVIE ET GRANDIS';

// dessine le titre en haut du canvas (lettres qui ondulent) ; renvoie la hauteur occupée
function drawTitreJeu() {
  const lettres = texteTitreJeu.split('').map(c => policePixel[c] || policePixel[' ']);
  const colonnes = lettres.reduce((n, g) => n + g[0].length + 1, -1);
  const px = Math.min(5, (largeurPlateau - 24) / colonnes); // taille d'un « pixel » de la police
  const hauteur = 7 * px;
  const haut = 12;
  const temps = performance.now() / 260;
  let x = (largeurPlateau - colonnes * px) / 2;

  ctx.save();
  const degrade = ctx.createLinearGradient(0, haut, 0, haut + hauteur);
  degrade.addColorStop(0, '#fff59d');
  degrade.addColorStop(0.5, '#ffd54f');
  degrade.addColorStop(1, currentTheme.snakeHead || '#4caf50');
  lettres.forEach((glyphe, i) => {
    const dy = Math.sin(temps + i * 0.55) * px * 0.6;
    for (let passe = 0; passe < 2; passe++) {
      // passe 0 : ombre portée sombre ; passe 1 : lettre en dégradé avec un léger halo
      ctx.fillStyle = passe === 0 ? 'rgba(0, 0, 0, 0.75)' : degrade;
      ctx.shadowColor = passe === 0 ? 'transparent' : 'rgba(255, 213, 79, 0.6)';
      ctx.shadowBlur = passe === 0 ? 0 : 8;
      const decalage = passe === 0 ? px * 0.6 : 0;
      glyphe.forEach((ligne, r) => {
        for (let c = 0; c < ligne.length; c++) {
          if (ligne[c] !== '#') continue;
          ctx.fillRect(x + c * px + decalage, haut + r * px + dy + decalage, px - 0.6, px - 0.6);
        }
      });
    }
    x += (glyphe[0].length + 1) * px;
  });
  ctx.restore();
  return haut + hauteur + 8;
}

function drawControlsTutorial() {
  if (enCoop()) {
    drawTutorielCoop();
    return;
  }
  if (modeEntree !== 'clavier') {
    drawControlsTutorialListe(modeEntree);
    return;
  }
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 6;

  // titre
  ctx.font = 'bold 20px ' + currentTheme.fontFamily;
  ctx.fillText('Comment jouer', largeurPlateau / 2, 26);

  const iconX = 55; // centre horizontal des icônes
  const labelX = 130; // départ fixe du texte, bien séparé des icônes
  const keySize = 24;

  // --- Déplacement : mini pavé directionnel ---
  const padY = 52;
  drawKeyIcon(iconX, padY, keySize, keySize, '↑');
  drawKeyIcon(iconX - keySize - 4, padY + keySize + 4, keySize, keySize, '←');
  drawKeyIcon(iconX, padY + keySize + 4, keySize, keySize, '↓');
  drawKeyIcon(iconX + keySize + 4, padY + keySize + 4, keySize, keySize, '→');

  ctx.font = '14px ' + currentTheme.fontFamily;
  ctx.textAlign = 'left';
  if (nomTouchesDirection(false) === 'ZQSD / WASD' && nomTouchesDirection(true) === 'Flèches') {
    ctx.fillText('Flèches, ZQSD (AZERTY)', labelX, padY + 30);
    ctx.fillText('ou WASD (QWERTY)', labelX, padY + 50);
  } else {
    ctx.fillText(nomTouchesDirection(true), labelX, padY + 30);
    ctx.fillText('ou ' + nomTouchesDirection(false), labelX, padY + 50);
  }

  // --- Espace : démarrer / accélérer ---
  const spaceY = padY + keySize * 2 + 4 + 30;
  drawKeyIcon(iconX - keySize - 4, spaceY, keySize * 3 + 8, 26, nomTouche(touches.boost).toUpperCase());
  if (capacitesActives.sprint) {
    ctx.fillText('Démarrer, puis', labelX, spaceY + 12);
    ctx.fillText('accélère (maintenir)', labelX, spaceY + 32);
  } else {
    ctx.fillText('Démarrer', labelX, spaceY + 12);
    ctx.fillText('(sprint désactivé)', labelX, spaceY + 32);
  }

  // --- Shift : bouclier ---
  const shiftY = spaceY + 26 + 26;
  drawKeyIcon(iconX - keySize - 4, shiftY, keySize * 3 + 8, 26, touches.bouclier === 'ShiftLeft' ? 'SHIFT' : nomTouche(touches.bouclier).toUpperCase());
  if (capacitesActives.bouclier) {
    ctx.fillText('Bouclier 2s', labelX, shiftY + 12);
    ctx.fillText('(recharge 15s)', labelX, shiftY + 32);
  } else {
    ctx.fillText('Bouclier', labelX, shiftY + 12);
    ctx.fillText('(désactivé)', labelX, shiftY + 32);
  }

  // --- Souris : viser / tirer / rollback ---
  const mouseY = shiftY + 26 + 28;
  drawMouseIcon(iconX, mouseY + 22, 30);
  ctx.fillText(viseeAutoActive(joueurs[0]) ? 'Clic gauche : tirer (visée auto)' : 'Clic gauche : viser et tirer', labelX, mouseY + 18);
  ctx.fillText('Clic droit : rollback (-' + reglagesDifficulte().coutRollback + ' ❤️)', labelX, mouseY + 38);

  // --- menu des buffs ---
  ctx.textAlign = 'center';
  ctx.font = '13px ' + currentTheme.fontFamily;
  ctx.fillText(nomTouche(touches.buffs) + ' : boutique  •  ' + nomTouche(touches.pause) + ' : pause  •  ' +
    nomTouche(touches.aide) + ' : aide  •  ' + nomTouche(touches.options) + ' : options', largeurPlateau / 2, mouseY + 78);
  dessinerInvitationTuto(nomTouche(touches.tuto) + ' : tutoriel');

  // --- message final ---
  ctx.font = 'bold 16px ' + currentTheme.fontFamily;
  ctx.fillText('Appuie sur ' + nomTouche(touches.boost).toUpperCase() + ' pour commencer', largeurPlateau / 2, hauteurPlateau - 20);

  ctx.restore();
}

// tutoriel du mode coop : un tableau des commandes, une colonne par joueur
function drawTutorielCoop() {
  const j1 = joueurs[0], j2 = joueurs[1];
  const partage = clavierPartage();
  const lignes = partage
    ? [
        ['🕹️ Bouger', nomTouchesDirection(false), nomTouchesDirection(true)],
        [capacitesActives.sprint ? '🚀 Démarrer, boost' : '🚀 Démarrer', nomTouche(touches.boost), nomTouche(touches.boostJ2)],
        capacitesActives.bouclier ? ['🛡️ Bouclier', nomTouche(touches.bouclier), nomTouche(touches.bouclierJ2)] : null,
        ['🔫 Tirer', 'Clic gauche', nomTouche(touches.tirJ2) + ' (auto)'],
        ['⏪ Rollback', 'Clic droit', nomTouche(touches.rollbackJ2)]
      ]
    : [
        ['🕹️ Bouger', nomTouchesDirection(true), 'Stick g.'],
        [capacitesActives.sprint ? '🚀 Démarrer, boost' : '🚀 Démarrer', nomTouche(touches.boost), 'A / Croix'],
        capacitesActives.bouclier ? ['🛡️ Bouclier', nomToucheBouclierSolo(), 'B / LB'] : null,
        ['🎯 Viser', 'Souris', 'Stick droit'],
        ['🔫 Tirer', 'Clic gauche', 'RT / RB / X']
      ];
  const xLibelle = 18, xJ1 = 212, xJ2 = 324;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 6;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'bold 20px ' + currentTheme.fontFamily;
  ctx.fillText('👥 Coop à 2 joueurs', largeurPlateau / 2, 30);

  // en-têtes de colonnes, de la couleur de chaque serpent
  ctx.font = 'bold 16px ' + currentTheme.fontFamily;
  ctx.fillStyle = couleurJoueur(j1);
  ctx.fillText('J1', xJ1, 64);
  ctx.fillStyle = couleurJoueur(j2);
  ctx.fillText('J2', xJ2, 64);

  let y = 94;
  lignes.filter(Boolean).forEach(([libelle, c1, c2]) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '13px ' + currentTheme.fontFamily;
    ctx.textAlign = 'left';
    ctx.fillText(libelle, xLibelle, y);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px ' + currentTheme.fontFamily;
    ctx.textAlign = 'center';
    ctx.fillText(c1, xJ1, y);
    ctx.fillText(c2, xJ2, y);
    y += 30;
  });

  ctx.textAlign = 'center';
  ctx.font = '13px ' + currentTheme.fontFamily;
  ctx.fillStyle = '#ffffff';
  y += 8;
  ctx.fillText(partage ? '🎮 Branche une manette pour J2' : '⌨️ Clavier + souris = J1  •  🎮 Manette = J2', largeurPlateau / 2, y);
  ctx.fillText('Score commun • un ❤️ réanime ton coéquipier', largeurPlateau / 2, y + 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillText(nomTouche(touches.buffs) + ' : boutique  •  ' + nomTouche(touches.pause) + ' : pause  •  ' + nomTouche(touches.aide) +
    ' : aide  •  ' + nomTouche(touches.options) + ' : options', largeurPlateau / 2, y + 44);
  ctx.fillText(capacitesActives.collisionJoueurs ? '💥 Collision entre joueurs activée (options)' : '👻 Les serpents se traversent (options)',
    largeurPlateau / 2, y + 66);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px ' + currentTheme.fontFamily;
  ctx.fillText(partage ? nomTouche(touches.boost).toUpperCase() + ' ou ' + nomTouche(touches.boostJ2).toUpperCase() + ' pour commencer'
    : nomTouche(touches.boost).toUpperCase() + ' ou A pour commencer',
    largeurPlateau / 2, hauteurPlateau - 20);
  ctx.restore();
}

// variante texte du tutoriel pour la manette et l'écran tactile
function drawControlsTutorialListe(mode) {
  const lignes = mode === 'manette'
    ? [
        ['🕹️', 'Stick gauche ou croix', 'se déplacer'],
        ['🎯', 'Stick droit', 'viser'],
        ['🔫', 'RT / R2, RB ou X', 'tirer'],
        ['🚀', 'A / Croix', 'démarrer, puis accélère (maintenir)'],
        ['🛡️', 'B / Rond ou LB', 'bouclier 2s (recharge 15s)'],
        ['🛒', 'Y / Triangle ou Select', 'boutique'],
        ['⏸️', 'Start', 'pause']
      ]
    : [
        ['👆', 'Pad ou zone 👆', 'tourner (flèche ou glissé)'],
        ['🕹️', 'Zone 🎯 : stick', 'orienter la tourelle'],
        ['🔫', 'Stick à fond (ou toucher la zone)', 'tirer'],
        ['🚀', 'Bouton Boost', 'démarrer, puis accélère (maintenir)'],
        ['🛡️', 'Bouton Bouclier', 'bouclier 2s (recharge 15s)'],
        ['☰', 'Bouton Menu', 'buffs, options, aide, tutoriel']
      ];
  // capacités désactivées dans le menu : on adapte les lignes
  lignes.forEach(l => {
    if (l[0] === '🚀' && !capacitesActives.sprint) l[2] = 'démarrer (sprint désactivé)';
  });
  for (let i = lignes.length - 1; i >= 0; i--) {
    if (lignes[i][0] === '🛡️' && !capacitesActives.bouclier) lignes.splice(i, 1);
  }

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 6;
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px ' + currentTheme.fontFamily;
  ctx.fillText(mode === 'manette' ? '🎮 Comment jouer' : '📱 Comment jouer', largeurPlateau / 2, 30);

  const pas = 40;
  let y = 72;
  lignes.forEach(([icone, commande, effet]) => {
    ctx.textAlign = 'center';
    ctx.font = '18px ' + currentTheme.fontFamily;
    ctx.fillText(icone, 36, y + 6);
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px ' + currentTheme.fontFamily;
    ctx.fillText(commande, 62, y);
    ctx.font = '13px ' + currentTheme.fontFamily;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText(effet, 62, y + 17);
    ctx.fillStyle = '#ffffff';
    y += pas;
  });

  dessinerInvitationTuto(mode === 'manette' ? 'LT : aide et tutoriel' : 'Menu ☰ : aide et tutoriel');
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px ' + currentTheme.fontFamily;
  ctx.fillText(mode === 'manette' ? 'Appuie sur A pour commencer' : 'Touche le jeu pour commencer',
    largeurPlateau / 2, hauteurPlateau - 20);
  ctx.restore();
}

// ligne « tutoriel » de l'écran de départ : mise en avant (dorée, qui pulse) tant qu'il n'a jamais été fini
function dessinerInvitationTuto(commande) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (tutoDejaFait()) {
    ctx.font = '13px ' + currentTheme.fontFamily;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText('🎓 ' + commande, largeurPlateau / 2, hauteurPlateau - 48);
  } else {
    ctx.font = 'bold 14px ' + currentTheme.fontFamily;
    ctx.fillStyle = '#ffd54f';
    ctx.globalAlpha = 0.75 + Math.sin(performance.now() / 250) * 0.25;
    ctx.fillText('🎓 Nouveau ? ' + commande, largeurPlateau / 2, hauteurPlateau - 48);
  }
  ctx.restore();
}

// dessine une touche de clavier stylisée avec un label centré
function drawKeyIcon(x, y, w, h, label) {
  ctx.save();
  ctx.shadowBlur = 0;
  const r = 5;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = (w > 40 ? 'bold 11px' : 'bold 13px') + ' ' + currentTheme.fontFamily;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

// dessine une petite souris : bouton gauche (tir) en jaune, bouton droit (rollback) en bleu
function drawMouseIcon(cx, cy, size) {
  ctx.save();
  ctx.shadowBlur = 0;
  const w = size * 0.7;
  const h = size;

  // corps de la souris
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(cx - w / 2, cy - h / 2, w, h, w / 2);
  } else {
    ctx.rect(cx - w / 2, cy - h / 2, w, h);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // séparation des boutons
  ctx.beginPath();
  ctx.moveTo(cx, cy - h / 2 + 3);
  ctx.lineTo(cx, cy - h * 0.05);
  ctx.stroke();

  // bouton gauche mis en surbrillance (celui qui tire)
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 + 2, cy - h / 2 + w / 2);
  ctx.arc(cx - w / 2 + 2 + (w / 2 - 2), cy - h / 2 + (w / 2), w / 2 - 2, Math.PI, Math.PI * 1.5);
  ctx.lineTo(cx, cy - h * 0.05);
  ctx.lineTo(cx - w / 2 + 2, cy - h * 0.05);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 213, 79, 0.9)';
  ctx.fill();

  // bouton droit (rollback), symétrique du gauche
  ctx.beginPath();
  ctx.moveTo(cx + w / 2 - 2, cy - h / 2 + w / 2);
  ctx.arc(cx, cy - h / 2 + (w / 2), w / 2 - 2, 0, -Math.PI / 2, true);
  ctx.lineTo(cx, cy - h * 0.05);
  ctx.lineTo(cx + w / 2 - 2, cy - h * 0.05);
  ctx.closePath();
  ctx.fillStyle = 'rgba(64, 196, 255, 0.85)';
  ctx.fill();

  ctx.restore();
}

