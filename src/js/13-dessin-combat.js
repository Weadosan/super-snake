function drawPopups() {
  ctx.save();
  ctx.font = 'bold 16px ' + currentTheme.fontFamily;
  ctx.textAlign = 'center';
  popups.forEach(p => {
    const progress = p.life / popupLifetime;
    const yOffset = progress * 25; // monte progressivement
    ctx.globalAlpha = 1 - progress;
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y - yOffset);
  });
  ctx.restore();
}

// petit point rouge clignotant annonçant l'apparition imminente d'un ennemi
function drawSpawnWarning() {
  if (!pendingSpawnWarning) return;

  const blinkVisible = Math.floor(performance.now() / 150) % 2 === 0;
  if (!blinkVisible) return;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 23, 68, 0.85)';
  ctx.beginPath();
  ctx.arc(pendingSpawnWarning.x, pendingSpawnWarning.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 23, 68, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pendingSpawnWarning.x, pendingSpawnWarning.y, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// même signal que pour un ennemi, en plus grand et plus sombre, au point d'apparition du boss
function drawBossSpawnWarning() {
  if (!bossSpawnPending || !bossSpawnPosition) return;

  const now = performance.now();
  const blinkVisible = Math.floor(now / 150) % 2 === 0;
  // anneau qui se resserre vers la taille du boss à mesure que l'apparition approche
  const progress = Math.max(0, Math.min(1, 1 - (bossWarningUntil - now) / bossWarningDuration));
  const ringRadius = bossRadius * (2.2 - 1.2 * progress);
  const {x, y} = bossSpawnPosition;

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 23, 68, 0.55)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  if (blinkVisible) {
    ctx.fillStyle = 'rgba(122, 0, 0, 0.9)';
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.45)';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBossWarning() {
  if (!bossSpawnPending) return;

  const now = performance.now();
  const remaining = bossWarningUntil - now;
  if (remaining <= 0) return;

  const blinkVisible = Math.floor(now / 200) % 2 === 0;

  ctx.save();
  ctx.fillStyle = 'rgba(122, 0, 0, 0.22)';
  ctx.fillRect(0, 0, largeurPlateau, hauteurPlateau);

  if (blinkVisible) {
    ctx.fillStyle = '#ff1744';
    ctx.font = 'bold 26px ' + policeTitre();
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.fillText('⚠️ BOSS ⚠️', largeurPlateau / 2, hauteurPlateau / 2);
  }
  ctx.restore();
}

function drawEndgameTransitionMessage() {
  const now = performance.now();
  if (now >= endgameTransitionMessageUntil) return;

  const blinkVisible = Math.floor(now / 200) % 2 === 0;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 109, 0, 0.18)';
  ctx.fillRect(0, 0, largeurPlateau, hauteurPlateau);

  if (blinkVisible) {
    ctx.fillStyle = '#ff9100';
    ctx.font = 'bold 22px ' + currentTheme.fontFamily;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.fillText(endgameTransitionMessageText, largeurPlateau / 2, hauteurPlateau / 2);
  }
  ctx.restore();
}

// état d'animation d'un ennemi pour cette image : regard, colère, rage du boss, déformations
function etatAnimationEnnemi(e, gele) {
  const now = performance.now();
  // pendant le gel, l'horloge d'animation de l'ennemi s'arrête là où elle en était
  if (gele) {
    if (e.tempsGel === undefined) e.tempsGel = now;
  } else {
    e.tempsGel = undefined;
  }
  const temps = gele ? e.tempsGel : now;
  if (e.phase === undefined) e.phase = Math.random() * Math.PI * 2;
  if (e.neA === undefined) e.neA = now - 1000;

  // regard vers la tête du serpent (en coop : le plus proche)
  let rx = 0, ry = 0, distTete = Infinity;
  const tete = enCoop() ? teteLaPlusProche(e.x, e.y) : (snake && snake.length ? {
    x: snake[0].x * gridSize + gridSize / 2,
    y: snake[0].y * gridSize + gridSize / 2
  } : null);
  if (tete) {
    const hx = tete.x - e.x;
    const hy = tete.y - e.y;
    distTete = Math.hypot(hx, hy) || 1;
    rx = hx / distTete;
    ry = hy / distTete;
  }

  // changement de direction détecté -> petit écrasement
  const angleMvt = Math.atan2(e.vy, e.vx);
  if (e.angleMvtPrec !== undefined) {
    let d = Math.abs(angleMvt - e.angleMvtPrec);
    if (d > Math.PI) d = Math.PI * 2 - d;
    if (d > 0.6) e.ecraseDepuis = now;
  }
  e.angleMvtPrec = angleMvt;

  return {
    temps,
    phase: e.phase,
    regardX: rx,
    regardY: ry,
    colere: !e.isBoss && distTete < gridSize * 3 && !gameOver,
    rage: e.isBoss ? 1 - Math.max(0, e.hp / e.maxHp) : 0,
    angleMvt,
    enMouvement: Math.abs(e.vx) + Math.abs(e.vy) > 0.0001
  };
}

// place le repère sur l'ennemi : respiration, étirement dans le sens de la marche,
// écrasement au changement de direction, pop d'apparition, flottement du fantôme, tremblement de colère
function appliquerTransformationEnnemi(e, etat) {
  const now = performance.now();
  let x = e.x, y = e.y;
  if (enemySkin === 'ghost') y += Math.sin(now / 400 + e.phase) * (e.isBoss ? 3 : 2);
  // le slime avance en sautillant, la chauve-souris monte et descend à chaque battement
  if (!e.isBoss && enemySkin === 'slime') y -= Math.abs(Math.sin(now / 220 + e.phase)) * e.radius * 0.35;
  if (enemySkin === 'bat') y += Math.sin(now / (e.isBoss ? 120 : 90) + e.phase) * (e.isBoss ? 2.5 : 1.5);
  if (etat.colere) {
    x += (Math.random() - 0.5) * 1.6;
    y += (Math.random() - 0.5) * 1.6;
  }
  ctx.translate(x, y);

  // pop d'apparition (léger dépassement puis retour à la taille normale)
  const age = (now - e.neA) / 350;
  let echelle = 1;
  if (age < 1) {
    const a = Math.max(0, age);
    const c1 = 1.70158, c3 = c1 + 1;
    echelle = 1 + c3 * Math.pow(a - 1, 3) + c1 * Math.pow(a - 1, 2);
  }

  const respiration = 1 + Math.sin(now / 300 + e.phase) * 0.05;
  let long = respiration * (etat.enMouvement && !e.isBoss ? 1.07 : 1);
  let large = respiration * (etat.enMouvement && !e.isBoss ? 0.96 : 1);
  if (e.ecraseDepuis) {
    const q = (now - e.ecraseDepuis) / 180;
    if (q < 1) {
      const k = Math.sin(Math.PI * q);
      long *= 1 - 0.22 * k;
      large *= 1 + 0.18 * k;
    }
  }
  ctx.rotate(etat.angleMvt);
  ctx.scale(long * echelle, large * echelle);
  ctx.rotate(-etat.angleMvt);
}

// le boss rougit à mesure qu'il perd de la vie
function couleurBossEnrage(couleur, rage) {
  if (typeof couleur !== 'string' || couleur.length !== 7 || rage <= 0) return couleur;
  const num = parseInt(couleur.slice(1), 16);
  const r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
  const m = (a, c) => Math.round(a + (c - a) * rage * 0.8);
  return `rgb(${m(r, 230)}, ${m(g, 20)}, ${m(b, 40)})`;
}

function drawEnemies() {
  enemies.forEach(e => {
    const isFlashing = performance.now() < e.hitFlashUntil;
    const isFrozen = performance.now() < (e.frozenUntil || 0);
    // ombre au sol (le skin rond est dessiné sans la sienne pour ne pas la doubler)
    dessinerOmbreSol(e.x, e.y, e.radius);
    // boss : sa zone de contact est marquée au sol, quel que soit le skin
    if (e.isBoss) dessinerZoneContactBoss(e);
    ctx.save();
    if (currentTheme.glow && !isFlashing && !isFrozen) {
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 10;
    }
    {
      const etat = etatAnimationEnnemi(e, isFrozen);
      if (isFrozen) {
        // gelé : même skin, figé dans la glace (aucune animation, pas de colère)
        etat.colere = false;
        ctx.translate(e.x, e.y);
      } else {
        appliquerTransformationEnnemi(e, etat);
      }
      // un ennemi résistant déjà touché pâlit et se fissure
      const abime = !e.isBoss && e.maxHp > 1 && e.hp < e.maxHp;
      let couleur = abime ? lightenColor(e.color, 0.35) : e.color;
      let contour = currentTheme.enemyStroke;
      if (isFlashing) {
        // touché : flash blanc, en gardant la forme du skin
        couleur = '#ffffff';
        contour = '#cccccc';
      } else if (isFrozen) {
        couleur = '#80d8ff';
        contour = '#e1f5fe';
        ctx.shadowColor = '#80d8ff';
        ctx.shadowBlur = 12;
      }
      if (e.isBoss) {
        dessinerBoss(0, 0, e.radius, isFlashing || isFrozen ? couleur : couleurBossEnrage(e.color, etat.rage), etat);
      } else if (enemySkin === 'urchin') {
        drawUrchinEnemy(0, 0, e.radius, couleur, contour, etat);
      } else if (enemySkin === 'ghost') {
        drawGhostEnemy(0, 0, e.radius, couleur, contour, etat);
      } else if (enemySkin === 'pixel') {
        drawPixelEnemy(0, 0, e.radius, couleur, etat);
      } else if (enemySkin === 'slime') {
        dessinerEnnemiSlime(0, 0, e.radius, couleur, contour, etat);
      } else if (enemySkin === 'bat') {
        dessinerEnnemiChauveSouris(0, 0, e.radius, couleur, contour, etat);
      } else if (dessinsSkins[enemySkin]) {
        dessinsSkins[enemySkin](0, 0, e.radius, couleur, contour, etat);
      } else {
        fillRadialCircle(0, 0, e.radius, couleur, false);
        ctx.strokeStyle = contour;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.stroke();
        dessinerYeuxEnnemi(0, -e.radius * 0.1, e.radius * 0.35, e.radius * 0.26, etat);
      }
      if (abime) dessinerFissures(e.radius * 0.8);
    }
    ctx.restore();

    // petits cristaux de glace autour de l'ennemi gelé
    if (isFrozen) {
      ctx.save();
      ctx.strokeStyle = 'rgba(224, 247, 255, 0.8)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + performance.now() / 2000;
        const sx = e.x + Math.cos(angle) * (e.radius + 3);
        const sy = e.y + Math.sin(angle) * (e.radius + 3);
        ctx.beginPath();
        ctx.moveTo(sx - 2, sy);
        ctx.lineTo(sx + 2, sy);
        ctx.moveTo(sx, sy - 2);
        ctx.lineTo(sx, sy + 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // petit indicateur de vie restante pour les ennemis résistants (plusieurs coups requis)
    if (e.isBoss) {
      const barWidth = e.radius * 2.2;
      const barHeight = 5;
      const barX = e.x - barWidth / 2;
      const barY = e.y - e.radius - 14;
      const ratio = Math.max(0, e.hp / e.maxHp);

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = '#ff1744';
      ctx.fillRect(barX, barY, barWidth * ratio, barHeight);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
      ctx.font = 'bold 10px ' + currentTheme.fontFamily;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS', e.x, barY - 4);
      ctx.restore();
    } else if (e.maxHp > 1) {
      // vie restante affichée sous l'ennemi pour ne pas cacher ses yeux
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px ' + currentTheme.fontFamily;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 3;
      ctx.fillText(e.hp, e.x, e.y + e.radius + 7);
      ctx.restore();
    }
  });
}

function drawProjectiles() {
  const theme = currentThemeName;
  const now = performance.now();
  ctx.save();
  if (mondesSupp[theme]) {
    projectiles.forEach(p => mondesSupp[theme].tir(p, now));
  } else if (theme === 'espace') {
    // traits de plasma allongés dans le sens du tir, cœur blanc
    projectiles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.shadowColor = '#b388ff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#b388ff';
      ctx.beginPath();
      ctx.ellipse(-3, 0, 9, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-2, 0, 6, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  } else if (theme === 'lave') {
    // boules de feu avec une petite traînée de flammes
    projectiles.forEach(p => {
      const v = Math.hypot(p.vx, p.vy) || 1;
      const dx = p.vx / v, dy = p.vy / v;
      for (let k = 3; k >= 1; k--) {
        ctx.globalAlpha = 0.5 - k * 0.12;
        ctx.fillStyle = k > 1 ? '#d84315' : '#ff6d00';
        ctx.beginPath();
        ctx.arc(p.x - dx * k * 5, p.y - dy * k * 5, projectileRadius * (1 - k * 0.18), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      const flamme = 1 + Math.sin(now / 40 + p.x) * 0.15;
      ctx.shadowColor = '#ff6d00';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ff9100';
      ctx.beginPath();
      ctx.arc(p.x, p.y, projectileRadius * 1.2 * flamme, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.arc(p.x, p.y, projectileRadius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (theme === 'ocean') {
    // bulles qui ondulent légèrement, avec un reflet
    projectiles.forEach(p => {
      const r = projectileRadius * 1.3 * (1 + Math.sin(now / 60 + p.y) * 0.1);
      // plus vives que les bulles du décor pour bien les distinguer
      ctx.fillStyle = 'rgba(29, 233, 182, 0.4)';
      ctx.strokeStyle = '#a7ffeb';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#1de9b6';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x - r * 0.35, p.y - r * 0.35, r * 0.25, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    if (currentTheme.glow) {
      ctx.shadowColor = currentTheme.projectile;
      ctx.shadowBlur = 8;
    }
    ctx.fillStyle = currentTheme.projectile;
    projectiles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, projectileRadius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();
}

// tourelle « Classique » : canon et base selon le monde, centrés en (x, y)
function dessinerTourelleTheme(x, y, angle, barrelLength, hasLaserSkin, now) {
  // canon : skin rouge intense pendant le buff laser, couleur normale sinon ; forme selon le monde
  const barrelColor = hasLaserSkin ? '#ff6d00' : currentTheme.turretBody;
  const theme = currentThemeName;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.shadowColor = barrelColor;
  ctx.shadowBlur = hasLaserSkin ? 14 : (currentTheme.glow ? 12 : 0);
  ctx.fillStyle = barrelColor;
  if (theme === 'espace') {
    // double rail de blaster avec une pointe lumineuse
    ctx.fillRect(0, -4, barrelLength, 2.5);
    ctx.fillRect(0, 1.5, barrelLength, 2.5);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e1f5fe';
    ctx.beginPath();
    ctx.arc(barrelLength, 0, 2.2 + Math.sin(now / 120) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (theme === 'lave') {
    // bouche de volcan : canon épais qui s'évase, embouchure rougeoyante
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(barrelLength, -5.5);
    ctx.lineTo(barrelLength, 5.5);
    ctx.lineTo(0, 4);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffd54f';
    ctx.globalAlpha = 0.7 + Math.sin(now / 150) * 0.3;
    ctx.fillRect(barrelLength - 3, -4, 3, 8);
  } else if (theme === 'ocean') {
    // conque en spirale, plus large au bout
    ctx.beginPath();
    ctx.moveTo(0, -2.5);
    ctx.quadraticCurveTo(barrelLength * 0.6, -3, barrelLength, -5);
    ctx.lineTo(barrelLength, 5);
    ctx.quadraticCurveTo(barrelLength * 0.6, 3, 0, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(barrelLength * i / 4, -2.5 - i * 0.6);
      ctx.lineTo(barrelLength * i / 4, 2.5 + i * 0.6);
      ctx.stroke();
    }
  } else {
    ctx.fillRect(0, -3, barrelLength, 6);
  }
  if (hasLaserSkin) {
    // fin cœur lumineux au centre du canon, façon arme énergétique
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(0, -1, barrelLength, 2);
  }
  ctx.restore();

  // base de la tourelle
  const rayonBase = gridSize / 3;
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = barrelColor;
  ctx.shadowBlur = hasLaserSkin ? 14 : (currentTheme.glow ? 12 : 0);
  ctx.fillStyle = currentTheme.turretBase;
  ctx.strokeStyle = hasLaserSkin ? '#ff6d00' : currentTheme.turretBaseStroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (theme === 'espace') {
    // hexagone façon cockpit
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + Math.PI / 6;
      const px = Math.cos(a) * rayonBase * 1.15, py = Math.sin(a) * rayonBase * 1.15;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  } else if (theme === 'lave') {
    // roche irrégulière
    const bosses = [1, 0.85, 1.1, 0.9, 1.05, 0.8, 1, 0.9];
    bosses.forEach((b, i) => {
      const a = (i / bosses.length) * Math.PI * 2;
      const px = Math.cos(a) * rayonBase * 1.15 * b, py = Math.sin(a) * rayonBase * 1.15 * b;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    });
    ctx.closePath();
  } else if (theme === 'ocean') {
    // coquillage festonné
    const lobes = 7;
    for (let i = 0; i <= lobes * 2; i++) {
      const a = (i / (lobes * 2)) * Math.PI * 2;
      const r = rayonBase * (i % 2 ? 0.95 : 1.2);
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  } else {
    ctx.arc(0, 0, rayonBase, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();
  // détail central
  ctx.shadowBlur = 0;
  if (theme === 'espace') {
    ctx.fillStyle = '#80d8ff';
    ctx.beginPath();
    ctx.arc(0, 0, rayonBase * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (theme === 'lave') {
    ctx.strokeStyle = '#ff9100';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-rayonBase * 0.6, -rayonBase * 0.2);
    ctx.lineTo(0, rayonBase * 0.1);
    ctx.lineTo(rayonBase * 0.5, -rayonBase * 0.4);
    ctx.stroke();
  } else if (theme === 'ocean') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, rayonBase * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTurret() {
  const now = performance.now();
  const hasLaserSkin = now < laserBuffUntil;
  const hasAutoAimSkin = now < autoAimBuffUntil;
  const isAutoAiming = hasAutoAimSkin && autoAimAngle !== null;

  // option Visée auto : le viseur se place sur l'ennemi accroché
  const accroche = cibleAuto && enemies.includes(cibleAuto) ? cibleAuto : null;
  const viseX = accroche ? accroche.x : mouseX;
  const viseY = accroche ? accroche.y : mouseY;
  const angle = isAutoAiming
    ? autoAimAngle
    : Math.atan2(viseY - turretPixelPos.y, viseX - turretPixelPos.x);
  const barrelLength = gridSize * 0.9;

  // laser de visée manuel : uniquement affiché quand le joueur vise lui-même (pas en auto-visée)
  if (!isAutoAiming) {
    const tipX = turretPixelPos.x + Math.cos(angle) * barrelLength;
    const tipY = turretPixelPos.y + Math.sin(angle) * barrelLength;

    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = hasLaserSkin ? 'rgba(255, 109, 0, 0.7)' : currentTheme.laserColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(viseX, viseY);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = hasLaserSkin ? 'rgba(255, 109, 0, 0.9)' : currentTheme.laserColor;
    ctx.beginPath();
    ctx.arc(viseX, viseY, accroche ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // canon et base : skin de tourelle acheté (js/13-skins-tourelle.js), sinon forme selon le monde
  dessinerTourelle(turretPixelPos.x, turretPixelPos.y, angle, barrelLength, hasLaserSkin, now);

  // anneau de scan tournant pendant le buff auto-visée
  if (hasAutoAimSkin) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 145, 0, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 5]);
    ctx.lineDashOffset = -now / 30;
    ctx.beginPath();
    ctx.arc(turretPixelPos.x, turretPixelPos.y, gridSize / 3 + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// petit anneau de progression autour de la tête, façon minuteur, représentant la recharge du bouclier
function drawShieldCooldownRing(headPos) {
  const now = performance.now();
  const remaining = shieldReadyAt - now;

  // masquée dès que le bouclier est prêt (ou pendant qu'il est actif, déjà géré à l'appel)
  if (remaining <= 0) return;

  const progress = 1 - Math.min(1, remaining / dureeRechargeBouclier());

  const cx = headPos.x * gridSize + gridSize / 2;
  const cy = headPos.y * gridSize + gridSize / 2;
  const barWidth = gridSize + 4;
  const barHeight = 4;
  const barX = cx - barWidth / 2;
  const barY = cy - gridSize / 2 - 10;

  ctx.save();

  // piste de fond
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // remplissage de la recharge
  ctx.fillStyle = 'rgba(80, 180, 255, 0.9)';
  ctx.fillRect(barX, barY, barWidth * progress, barHeight);

  // léger contour pour la lisibilité
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  ctx.restore();
}

function drawEyes(headPos) {
  const cx = headPos.x * gridSize + gridSize / 2;
  const cy = headPos.y * gridSize + gridSize / 2;
  const offset = gridSize / 4 - 0.5;
  const eyeRadius = 2;

  // décalage des yeux selon la direction actuelle (par défaut : vers le haut)
  let dx = direction.x, dy = direction.y;
  if (dx === 0 && dy === 0) { dx = 0; dy = -1; }

  // perpendiculaire à la direction, pour écarter les deux yeux
  const perpX = -dy;
  const perpY = dx;

  const eye1 = {
    x: cx + dx * offset + perpX * offset,
    y: cy + dy * offset + perpY * offset
  };
  const eye2 = {
    x: cx + dx * offset - perpX * offset,
    y: cy + dy * offset - perpY * offset
  };

  const now = performance.now();
  // clignement de temps en temps
  if (now >= prochainClignement) {
    if (prochainClignement) clignementJusqua = now + 120;
    prochainClignement = now + 2500 + Math.random() * 3000;
  }
  const blesse = now < invulnerableUntil;
  const cligne = now < clignementJusqua;

  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  if (blesse || cligne) {
    // yeux fermés (clignement) ou plissés en chevron (coup reçu)
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    [eye1, eye2].forEach((eye, i) => {
      const sens = i === 0 ? 1 : -1;
      ctx.beginPath();
      if (blesse) {
        ctx.moveTo(eye.x - dx * 2.5 + perpX * sens * 2, eye.y - dy * 2.5 + perpY * sens * 2);
        ctx.lineTo(eye.x, eye.y);
        ctx.lineTo(eye.x + dx * 2.5 + perpX * sens * 2, eye.y + dy * 2.5 + perpY * sens * 2);
      } else {
        ctx.moveTo(eye.x - dx * 2.5, eye.y - dy * 2.5);
        ctx.lineTo(eye.x + dx * 2.5, eye.y + dy * 2.5);
      }
      ctx.stroke();
    });
  } else {
    // pupilles tournées vers la pomme
    let fx = food.x * gridSize + gridSize / 2 - cx;
    let fy = food.y * gridSize + gridSize / 2 - cy;
    const fl = Math.hypot(fx, fy) || 1;
    fx = (fx / fl) * 1.1;
    fy = (fy / fl) * 1.1;
    [eye1, eye2].forEach(eye => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eye.x, eye.y, eyeRadius + 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(eye.x + fx, eye.y + fy, eyeRadius * 0.75, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();
}

// langue fourchue qui sort brièvement (avec un petit mouvement de va-et-vient) après avoir mangé une pomme
function drawTongue(headPos) {
  const now = performance.now();
  if (now >= tongueUntil) return;

  const progress = 1 - (tongueUntil - now) / tongueDuration;
  // va-et-vient : sort rapidement, reste un instant, puis rentre
  const extend = progress < 0.25
    ? progress / 0.25
    : progress > 0.75
      ? 1 - (progress - 0.75) / 0.25
      : 1;

  const cx = headPos.x * gridSize + gridSize / 2;
  const cy = headPos.y * gridSize + gridSize / 2;

  let dx = direction.x, dy = direction.y;
  if (dx === 0 && dy === 0) { dx = 0; dy = -1; }

  const perpX = -dy;
  const perpY = dx;

  const tongueLength = (gridSize / 2 + 6) * extend;
  const forkLength = 3;
  const baseX = cx + dx * (gridSize / 2);
  const baseY = cy + dy * (gridSize / 2);
  const tipX = cx + dx * (gridSize / 2 + tongueLength);
  const tipY = cy + dy * (gridSize / 2 + tongueLength);

  ctx.save();
  ctx.strokeStyle = '#ff5c7a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(tipX, tipY);
  // petite fourche au bout
  ctx.lineTo(tipX + dx * forkLength + perpX * forkLength, tipY + dy * forkLength + perpY * forkLength);
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX + dx * forkLength - perpX * forkLength, tipY + dy * forkLength - perpY * forkLength);
  ctx.stroke();
  ctx.restore();
}

