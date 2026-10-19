// ============================================================
// --- Attaques des boss : une attaque propre à chaque skin ---
// ============================================================
// Chaque boss poursuit le serpent comme avant, et lance de temps en temps l'attaque de son skin.
// Une attaque se déroule toujours en trois temps : attente, préparation (signal visible au sol et
// nom de l'attaque au-dessus du boss), puis action. Tous les minuteurs avancent avec le temps de jeu
// (deltaMs de updateCombat) : la pause, le ralenti et le gel les arrêtent sans rien décaler à la main.
// Rien ne se passe pendant le tutoriel. En ligne, l'hôte fait tourner la partie et envoie l'image :
// les deux joueurs voient forcément la même attaque.

// tous les réglages au même endroit : dégâts, rythme, et paramètres de chaque attaque
// (vitesses en pixels par ms, durées en ms, rayons en pixels sur le plateau de 400 x 400)
const reglagesAttaquesBoss = {
  actif: true,
  degats: 1, // cœurs perdus par coup reçu
  penaliteScore: 5, // comme le contact d'un ennemi
  premiereAttaque: 2500, // délai après l'apparition du boss
  intervalle: [3500, 5500], // entre la fin d'une attaque et la préparation de la suivante
  // par difficulté : attaques plus espacées et signal plus long en Facile
  difficulte: {
    facile: {intervalle: 1.4, preparation: 1.3},
    normal: {intervalle: 1.15, preparation: 1.1},
    difficile: {intervalle: 1, preparation: 1}
  },
  attaques: {
    urchin: {nom: 'PIQUANTS', couleur: '#ffca28', preparation: 750, nombre: 8, vitesse: 0.12, rayon: 5},
    ghost: {nom: 'DISPARITION', couleur: '#b388ff', preparation: 1000, distance: 120},
    pixel: {nom: 'TIR EN CROIX', couleur: '#76ff03', preparation: 650, vitesse: 0.14, rayon: 6},
    slime: {nom: 'DIVISION', couleur: '#64dd17', preparation: 900, petits: 2},
    bat: {nom: 'PIQUÉ', couleur: '#ff5252', preparation: 750, vitesse: 0.3, duree: 650},
    jelly: {nom: 'DÉCHARGE', couleur: '#40c4ff', preparation: 1000, rayon: 72, duree: 280},
    eye: {nom: 'RAYON', couleur: '#ff1744', preparation: 1000, largeur: 12, duree: 380},
    drone: {nom: 'RAFALE', couleur: '#ff9100', preparation: 800, tirs: 3, ecart: 160, vitesse: 0.2, rayon: 4},
    spider: {nom: 'TOILE', couleur: '#eeeeee', preparation: 850, vol: 350, rayon: 38, duree: 5000, ralenti: 1.7},
    crab: {nom: 'CHARGE', couleur: '#ff7043', preparation: 800, vitesse: 0.26, duree: 1500},
    pumpkin: {nom: 'GRAINES', couleur: '#ff9800', preparation: 1000, nombre: 3, ecart: 46, rayon: 30},
    mushroom: {nom: 'SPORES', couleur: '#ce93d8', preparation: 750, nombre: 6, vitesse: 0.035, rayon: 9, duree: 4200}
  }
};

let dangersBoss = []; // projectiles, explosions, rayons et toiles lancés par le boss
let attaqueBossCompteur = 0; // nombre d'attaques lancées dans la partie (tests, statistiques)

function reinitialiserAttaquesBoss() {
  dangersBoss = [];
  attaqueBossCompteur = 0;
}

function reglagesAttaqueSkin(skin) {
  return reglagesAttaquesBoss.attaques[skin] || reglagesAttaquesBoss.attaques.urchin;
}

function multiplicateursAttaquesBoss() {
  return reglagesAttaquesBoss.difficulte[difficulte] || reglagesAttaquesBoss.difficulte.difficile;
}

function delaiProchaineAttaque() {
  const [min, max] = reglagesAttaquesBoss.intervalle;
  return (min + Math.random() * (max - min)) * multiplicateursAttaquesBoss().intervalle;
}

function attaquesBossPossibles() {
  return reglagesAttaquesBoss.actif && !tutoActif() && !endgameNoEnemies;
}

// --- coups reçus ---

const centreSegment = s => ({x: s.x * gridSize + gridSize / 2, y: s.y * gridSize + gridSize / 2});

// premier segment du joueur actif pour lequel touche(cx, cy) est vrai, ou -1
function segmentTouche(touche) {
  for (let si = 0; si < snake.length; si++) {
    const c = centreSegment(snake[si]);
    if (touche(c.x, c.y)) return si;
  }
  return -1;
}

function joueurProtege() {
  const now = performance.now();
  return now < invulnerableUntil || now < shieldActiveUntil || now < buffInvincibleUntil;
}

// le joueur actif est touché par une attaque au segment si ; renvoie vrai si le coup a porté
function blesserParAttaqueBoss(si, couleur) {
  const c = centreSegment(snake[si]);
  if (joueurProtege()) {
    spawnParticles(c.x, c.y, couleur, 6); // paré par le bouclier ou l'invincibilité
    return false;
  }
  const now = performance.now();
  addScore(-reglagesAttaquesBoss.penaliteScore);
  blessures.push({k: snake.length - 1 - si, debut: now, cote: si % 2 ? 1 : -1});
  if (blessures.length > maxBlessures) blessures.shift();
  spawnPopup(c.x, c.y, '-' + reglagesAttaquesBoss.penaliteScore, '#ff5252');
  spawnParticles(c.x, c.y, couleur, 14);
  triggerShake(6);
  if (snake.length > 1) {
    snake.pop();
    retirerBlessuresQueue(1);
  }
  lives -= reglagesAttaquesBoss.degats;
  succesCoeurPerdu();
  declencherFlash('#ff1744');
  updateHeartsDisplay();
  playLoseHeartSound();
  invulnerableUntil = now + invulnerabilityDuration;
  if (lives <= 0) eliminerJoueur();
  return true;
}

// applique touche à chaque serpent en jeu ; un serpent ne peut être touché qu'une fois par appel
function toucherSerpents(touche, couleur, surCoup) {
  joueursEnJeu().forEach(j => avecJoueur(j, () => {
    if (gameOver || j.elimine) return;
    const si = segmentTouche(touche);
    if (si < 0) return;
    blesserParAttaqueBoss(si, couleur);
    if (surCoup) surCoup(j);
  }));
}

// --- déroulement ---

function majAttaquesBoss(deltaMs) {
  const boss = enemies.find(e => e.isBoss);
  if (!boss || !attaquesBossPossibles()) {
    // boss vaincu (ou parti) : ce qu'il a lancé se dissipe
    if (dangersBoss.length) {
      dangersBoss.forEach(d => { if (d.x !== undefined) spawnParticles(d.x, d.y, d.couleur, 3); });
      dangersBoss = [];
    }
    return;
  }

  if (!boss.attaque) boss.attaque = {etat: 'attente', reste: reglagesAttaquesBoss.premiereAttaque};
  const a = boss.attaque;
  const gele = estGele(boss) && a.etat !== 'action'; // gelé : le boss ne prépare rien (une attaque lancée finit)
  if (!gele) a.reste -= deltaMs;

  if (gele) {
    // rien
  } else if (a.etat === 'attente' && a.reste <= 0) preparerAttaqueBoss(boss);
  else if (a.etat === 'prepa') {
    suivrePreparation(boss, a);
    if (a.reste <= 0) lancerAttaqueBoss(boss);
  } else if (a.etat === 'action') {
    actionEnCours(boss, a, deltaMs);
    if (a.reste <= 0) finirAttaqueBoss(boss);
  }

  majDangersBoss(deltaMs);
}

function preparerAttaqueBoss(boss) {
  const skin = enemySkin;
  const r = reglagesAttaqueSkin(skin);
  const cible = teteLaPlusProche(boss.x, boss.y) || {x: largeurPlateau / 2, y: hauteurPlateau / 2};
  const a = boss.attaque = {
    etat: 'prepa', skin, reste: r.preparation * multiplicateursAttaquesBoss().preparation,
    cible: {x: cible.x, y: cible.y}
  };
  a.duree = a.reste;
  if (skin === 'ghost') a.destination = destinationFantome(boss, cible, r.distance);
  if (skin === 'bat' || skin === 'eye') a.angle = Math.atan2(cible.y - boss.y, cible.x - boss.x);
  if (skin === 'crab') {
    // le crabe charge de côté : à l'horizontale, sauf si la tête est surtout au-dessus ou au-dessous
    const dx = cible.x - boss.x, dy = cible.y - boss.y;
    a.angle = Math.abs(dx) >= Math.abs(dy) * 0.6 ? (dx >= 0 ? 0 : Math.PI) : (dy >= 0 ? Math.PI / 2 : -Math.PI / 2);
  }
  if (skin === 'pixel') a.diagonale = attaqueBossCompteur % 2 === 1; // une croix sur deux en X
  if (skin === 'mushroom') a.decalage = attaqueBossCompteur * 0.5; // les spores ne partent pas toujours au même endroit
  if (skin === 'pumpkin') {
    // trois graines : sur la tête, et de part et d'autre dans le sens où elle avance
    const avance = Math.atan2(cible.y - boss.y, cible.x - boss.x);
    a.points = [];
    for (let i = 0; i < r.nombre; i++) {
      const k = i - (r.nombre - 1) / 2;
      a.points.push({
        x: Math.max(r.rayon, Math.min(largeurPlateau - r.rayon, cible.x + Math.cos(avance + Math.PI / 2) * k * r.ecart)),
        y: Math.max(r.rayon, Math.min(hauteurPlateau - r.rayon, cible.y + Math.sin(avance + Math.PI / 2) * k * r.ecart))
      });
    }
  }
  sonAttaqueBoss('prepa');
}

// pendant la préparation : la mire du drone et la cible de la toile suivent encore la tête
function suivrePreparation(boss, a) {
  if (a.skin !== 'drone' && a.skin !== 'spider') return;
  const cible = teteLaPlusProche(boss.x, boss.y);
  // la cible se fige pendant le dernier tiers : c'est le moment d'esquiver
  if (cible && a.reste > a.duree / 3) a.cible = {x: cible.x, y: cible.y};
}

function lancerAttaqueBoss(boss) {
  const a = boss.attaque;
  const r = reglagesAttaqueSkin(a.skin);
  a.etat = 'action';
  a.reste = 0;
  attaqueBossCompteur++;
  sonAttaqueBoss(a.skin);

  switch (a.skin) {
    case 'urchin':
      for (let i = 0; i < r.nombre; i++) {
        const ang = (i / r.nombre) * Math.PI * 2 + Math.PI / r.nombre;
        ajouterProjectileBoss(boss, ang, r.vitesse, r.rayon, r.couleur, 'piquant');
      }
      break;
    case 'pixel':
      for (let i = 0; i < 4; i++) {
        ajouterProjectileBoss(boss, i * Math.PI / 2 + (a.diagonale ? Math.PI / 4 : 0), r.vitesse, r.rayon, r.couleur, 'pixel');
      }
      break;
    case 'ghost':
      spawnParticles(boss.x, boss.y, r.couleur, 14);
      boss.x = a.destination.x;
      boss.y = a.destination.y;
      boss.neA = performance.now(); // il « réapparaît » avec le petit rebond d'apparition
      spawnShockwave(boss.x, boss.y, r.couleur, 60);
      break;
    case 'slime':
      for (let i = 0; i < r.petits; i++) {
        const ang = a.cible ? Math.atan2(a.cible.y - boss.y, a.cible.x - boss.x) + (i ? 1 : -1) * Math.PI / 2 : i * Math.PI;
        spawnEnemy({
          x: Math.max(enemyRadius, Math.min(largeurPlateau - enemyRadius, boss.x + Math.cos(ang) * (boss.radius + 10))),
          y: Math.max(enemyRadius, Math.min(hauteurPlateau - enemyRadius, boss.y + Math.sin(ang) * (boss.radius + 10)))
        });
      }
      spawnParticles(boss.x, boss.y, r.couleur, 16);
      break;
    case 'bat':
    case 'crab':
      a.reste = r.duree;
      a.vx = Math.cos(a.angle) * r.vitesse;
      a.vy = Math.sin(a.angle) * r.vitesse;
      break;
    case 'jelly':
      dangersBoss.push({type: 'decharge', x: boss.x, y: boss.y, rayon: r.rayon, vie: 0, duree: r.duree, couleur: r.couleur, boss});
      break;
    case 'eye':
      dangersBoss.push({type: 'rayon', boss, angle: a.angle, largeur: r.largeur, vie: 0, duree: r.duree, couleur: r.couleur});
      break;
    case 'drone':
      a.reste = (r.tirs - 1) * r.ecart + 1;
      a.tirsRestants = r.tirs;
      a.prochainTir = 0;
      break;
    case 'spider':
      dangersBoss.push({type: 'fil', x: boss.x, y: boss.y, dx: boss.x, dy: boss.y, cx: a.cible.x, cy: a.cible.y,
        vie: 0, duree: r.vol, couleur: r.couleur});
      break;
    case 'pumpkin':
      a.points.forEach((p, i) => dangersBoss.push({type: 'graine', x: boss.x, y: boss.y, dx: boss.x, dy: boss.y,
        cx: p.x, cy: p.y, rayon: r.rayon, vie: -i * 90, duree: 420, couleur: r.couleur}));
      break;
    case 'mushroom':
      for (let i = 0; i < r.nombre; i++) {
        const ang = (i / r.nombre) * Math.PI * 2 + a.decalage;
        ajouterProjectileBoss(boss, ang, r.vitesse, r.rayon, r.couleur, 'spore', r.duree);
      }
      break;
  }
}

// ce que fait le boss pendant son action (charges, rafale)
function actionEnCours(boss, a, deltaMs) {
  const r = reglagesAttaqueSkin(a.skin);
  if (a.skin === 'drone') {
    a.prochainTir -= deltaMs;
    while (a.tirsRestants > 0 && a.prochainTir <= 0) {
      ajouterProjectileBoss(boss, Math.atan2(a.cible.y - boss.y, a.cible.x - boss.x), r.vitesse, r.rayon, r.couleur, 'balle');
      a.tirsRestants--;
      a.prochainTir += r.ecart;
      sonAttaqueBoss('drone');
    }
  }
  if ((a.skin === 'bat' || a.skin === 'crab') && Math.random() < deltaMs / 40) {
    spawnParticles(boss.x, boss.y, r.couleur, 1); // traînée de la charge
  }
}

// la charge (chauve-souris, crabe) remplace la poursuite tant qu'elle dure ; s'arrête au mur
function bossEnCharge(boss) {
  const a = boss.attaque;
  if (!a || a.etat !== 'action' || (a.skin !== 'bat' && a.skin !== 'crab')) return false;
  const auMur = (a.vx < 0 && boss.x <= boss.radius + 0.5) || (a.vx > 0 && boss.x >= largeurPlateau - boss.radius - 0.5) ||
    (a.vy < 0 && boss.y <= boss.radius + 0.5) || (a.vy > 0 && boss.y >= hauteurPlateau - boss.radius - 0.5);
  if (auMur) {
    a.reste = 0;
    spawnShockwave(boss.x, boss.y, reglagesAttaqueSkin(a.skin).couleur, 40);
    triggerShake(3);
    return false;
  }
  boss.vx = a.vx;
  boss.vy = a.vy;
  return true;
}

function finirAttaqueBoss(boss) {
  boss.attaque = {etat: 'attente', reste: delaiProchaineAttaque()};
}

function ajouterProjectileBoss(boss, angle, vitesse, rayon, couleur, forme, duree) {
  dangersBoss.push({
    type: 'projectile', forme, couleur, rayon,
    x: boss.x + Math.cos(angle) * boss.radius * 0.8,
    y: boss.y + Math.sin(angle) * boss.radius * 0.8,
    vx: Math.cos(angle) * vitesse, vy: Math.sin(angle) * vitesse, angle,
    vie: 0, duree: duree || Infinity
  });
}

// point où le fantôme réapparaît : à bonne distance de la tête visée, et loin de tous les corps
function destinationFantome(boss, cible, distance) {
  const segments = tousLesSegments().map(centreSegment);
  const marge = bossRadius;
  let meilleur = null, meilleurScore = -Infinity;
  const depart = Math.random() * Math.PI * 2;
  for (let i = 0; i < 12; i++) {
    const ang = depart + (i / 12) * Math.PI * 2;
    const x = Math.max(marge, Math.min(largeurPlateau - marge, cible.x + Math.cos(ang) * distance));
    const y = Math.max(marge, Math.min(hauteurPlateau - marge, cible.y + Math.sin(ang) * distance));
    const libre = Math.min(...segments.map(s => Math.hypot(s.x - x, s.y - y)));
    if (libre > meilleurScore) {
      meilleurScore = libre;
      meilleur = {x, y};
    }
    if (libre >= bossRadius + gridSize * 2) return {x, y};
  }
  return meilleur;
}

// --- dangers lancés : déplacement, coups, fin ---

function majDangersBoss(deltaMs) {
  const rayonSegment = gridSize * 0.4; // un peu moins que la case : on ne se fait pas toucher « de justesse »
  dangersBoss.forEach(d => {
    d.vie += deltaMs;
    if (d.type === 'projectile') {
      d.x += d.vx * deltaMs;
      d.y += d.vy * deltaMs;
      if (d.x < -20 || d.x > largeurPlateau + 20 || d.y < -20 || d.y > hauteurPlateau + 20 || d.vie >= d.duree) d.fini = true;
      if (!d.fini) toucherSerpents((cx, cy) => Math.hypot(cx - d.x, cy - d.y) < d.rayon + rayonSegment, d.couleur, () => {
        d.fini = true;
      });
    } else if (d.type === 'decharge') {
      // la décharge part du boss même s'il bouge ; chaque serpent n'est touché qu'une fois
      d.x = d.boss.x;
      d.y = d.boss.y;
      d.touches = d.touches || [];
      joueursEnJeu().forEach(j => {
        if (d.touches.includes(j)) return;
        avecJoueur(j, () => {
          const si = segmentTouche((cx, cy) => Math.hypot(cx - d.x, cy - d.y) < d.rayon + rayonSegment);
          if (si >= 0) {
            d.touches.push(j);
            blesserParAttaqueBoss(si, d.couleur);
          }
        });
      });
      if (d.vie >= d.duree) d.fini = true;
    } else if (d.type === 'rayon') {
      d.touches = d.touches || [];
      const ox = d.boss.x, oy = d.boss.y, dx = Math.cos(d.angle), dy = Math.sin(d.angle);
      joueursEnJeu().forEach(j => {
        if (d.touches.includes(j)) return;
        avecJoueur(j, () => {
          const si = segmentTouche((cx, cy) => {
            const t = (cx - ox) * dx + (cy - oy) * dy;
            return t > 0 && Math.abs((cx - ox) * dy - (cy - oy) * dx) < d.largeur / 2 + rayonSegment;
          });
          if (si >= 0) {
            d.touches.push(j);
            blesserParAttaqueBoss(si, d.couleur);
          }
        });
      });
      if (d.vie >= d.duree) d.fini = true;
    } else if (d.type === 'fil' || d.type === 'graine') {
      // objet lancé en cloche vers sa cible
      const p = Math.max(0, Math.min(1, d.vie / d.duree));
      d.x = d.dx + (d.cx - d.dx) * p;
      d.y = d.dy + (d.cy - d.dy) * p;
      if (p >= 1) {
        d.fini = true;
        if (d.type === 'fil') {
          const r = reglagesAttaquesBoss.attaques.spider;
          dangersBoss.push({type: 'toile', x: d.cx, y: d.cy, rayon: r.rayon, vie: 0, duree: r.duree, couleur: r.couleur});
          spawnParticles(d.cx, d.cy, r.couleur, 8);
        } else {
          spawnShockwave(d.cx, d.cy, d.couleur, d.rayon * 1.3);
          spawnParticles(d.cx, d.cy, d.couleur, 12);
          sonAttaqueBoss('boum');
          toucherSerpents((cx, cy) => Math.hypot(cx - d.cx, cy - d.cy) < d.rayon + rayonSegment, d.couleur);
        }
      }
    } else if (d.type === 'toile') {
      // une tête dans la toile est engluée : le serpent avance plus lentement un court instant
      joueursEnJeu().forEach(j => {
        const t = centreSegment(j.snake[0]);
        if (Math.hypot(t.x - d.x, t.y - d.y) < d.rayon) {
          if (!(j.englueRestant > 0)) spawnPopup(t.x, t.y - 10, 'ENGLUÉ !', '#eeeeee');
          j.englueRestant = 400;
        }
      });
      if (d.vie >= d.duree) d.fini = true;
    }
  });
  dangersBoss = dangersBoss.filter(d => !d.fini);
  joueurs.forEach(j => {
    if (j.englueRestant > 0) j.englueRestant -= deltaMs;
  });
}

// facteur appliqué à l'intervalle entre deux pas du serpent (1 = vitesse normale)
function facteurEnglue(j) {
  return j.englueRestant > 0 ? reglagesAttaquesBoss.attaques.spider.ralenti : 1;
}

// --- sons ---

function sonAttaqueBoss(type) {
  if (isMuted) return;
  const ac = getAudioCtx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  // préparation : petit appel montant ; action : son propre à l'attaque
  const sons = {
    prepa: ['triangle', 300, 600, 0.18, 0.08],
    jelly: ['sawtooth', 900, 120, 0.25, 0.08],
    eye: ['sawtooth', 220, 1400, 0.35, 0.06],
    drone: ['square', 1200, 500, 0.06, 0.05],
    boum: ['square', 160, 40, 0.25, 0.12]
  };
  const [forme, f1, f2, duree, volume] = sons[type] || ['square', 500, 150, 0.15, 0.08];
  osc.type = forme;
  osc.frequency.setValueAtTime(f1, t);
  osc.frequency.exponentialRampToValueAtTime(f2, t + duree);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duree);
  osc.connect(gain);
  gain.connect(sortieAudio);
  osc.start(t);
  osc.stop(t + duree);
}

// --- dessin ---

// sous les ennemis : signaux de préparation au sol, toiles, explosions
function dessinerSolAttaquesBoss() {
  const now = performance.now();
  dangersBoss.forEach(d => {
    if (d.type === 'toile') dessinerToile(d);
  });

  const boss = enemies.find(e => e.isBoss);
  const a = boss && boss.attaque;
  if (a && a.etat === 'prepa') {
    const r = reglagesAttaqueSkin(a.skin);
    const p = 1 - Math.max(0, a.reste) / a.duree; // avancement de la préparation, 0 à 1
    const clignote = Math.floor(now / (p > 0.66 ? 70 : 140)) % 2 === 0;
    ctx.save();
    ctx.strokeStyle = r.couleur;
    ctx.fillStyle = r.couleur;
    ctx.lineWidth = 2;
    // anneau qui se resserre autour du boss
    ctx.globalAlpha = 0.85;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.radius + 4 + 14 * (1 - p), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = clignote ? 0.55 : 0.3;
    dessinerSignalAttaque(boss, a, r, p);
    ctx.restore();
  }
}

function dessinerSignalAttaque(boss, a, r, p) {
  switch (a.skin) {
    case 'urchin':
    case 'pixel':
    case 'mushroom': {
      // les directions de tir, en traits courts
      const n = a.skin === 'urchin' ? r.nombre : a.skin === 'pixel' ? 4 : r.nombre;
      for (let i = 0; i < n; i++) {
        const ang = a.skin === 'urchin' ? (i / n) * Math.PI * 2 + Math.PI / n
          : a.skin === 'pixel' ? i * Math.PI / 2 + (a.diagonale ? Math.PI / 4 : 0)
            : (i / n) * Math.PI * 2 + a.decalage;
        const l1 = boss.radius + 6, l2 = boss.radius + 18 + 50 * p;
        ctx.beginPath();
        ctx.moveTo(boss.x + Math.cos(ang) * l1, boss.y + Math.sin(ang) * l1);
        ctx.lineTo(boss.x + Math.cos(ang) * l2, boss.y + Math.sin(ang) * l2);
        ctx.lineWidth = a.skin === 'pixel' ? 4 : 2;
        ctx.stroke();
      }
      break;
    }
    case 'ghost': {
      // silhouette pâle à l'endroit où il va réapparaître
      const {x, y} = a.destination;
      ctx.beginPath();
      ctx.arc(x, y, bossRadius * (0.6 + 0.4 * p), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(x, y, bossRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }
    case 'slime':
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, boss.radius * (1 + 0.25 * p), 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'bat':
    case 'crab': {
      // couloir de la charge
      const longueur = a.skin === 'crab' ? Math.hypot(largeurPlateau, hauteurPlateau) : r.vitesse * r.duree;
      ctx.save();
      ctx.translate(boss.x, boss.y);
      ctx.rotate(a.angle);
      ctx.fillRect(0, -boss.radius, longueur, boss.radius * 2);
      ctx.globalAlpha = 0.9;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(0, -boss.radius, longueur, boss.radius * 2);
      ctx.setLineDash([]);
      // flèches
      for (let k = 1; k <= 3; k++) {
        const fx = boss.radius + k * 28 + (p * 28) % 28;
        ctx.beginPath();
        ctx.moveTo(fx - 8, -8);
        ctx.lineTo(fx, 0);
        ctx.lineTo(fx - 8, 8);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'jelly':
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, r.rayon, 0, Math.PI * 2);
      ctx.globalAlpha *= 0.5;
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, r.rayon, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      dessinerEclairs(boss.x, boss.y, r.rayon * p, 4);
      break;
    case 'eye': {
      // fine visée rouge, qui s'épaissit
      const loin = Math.hypot(largeurPlateau, hauteurPlateau);
      ctx.globalAlpha = 0.5 + 0.4 * p;
      ctx.lineWidth = 1 + 2 * p;
      ctx.beginPath();
      ctx.moveTo(boss.x, boss.y);
      ctx.lineTo(boss.x + Math.cos(a.angle) * loin, boss.y + Math.sin(a.angle) * loin);
      ctx.stroke();
      break;
    }
    case 'drone':
    case 'spider': {
      // mire sur la cible
      const {x, y} = a.cible;
      const rr = a.skin === 'spider' ? r.rayon : 14;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - rr - 5, y); ctx.lineTo(x - rr + 6, y);
      ctx.moveTo(x + rr + 5, y); ctx.lineTo(x + rr - 6, y);
      ctx.moveTo(x, y - rr - 5); ctx.lineTo(x, y - rr + 6);
      ctx.moveTo(x, y + rr + 5); ctx.lineTo(x, y + rr - 6);
      ctx.stroke();
      if (a.skin === 'spider') {
        ctx.globalAlpha = 0.25;
        ctx.fill();
      }
      break;
    }
    case 'pumpkin':
      a.points.forEach(pt => {
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r.rayon, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r.rayon, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pt.x - 6, pt.y - 6); ctx.lineTo(pt.x + 6, pt.y + 6);
        ctx.moveTo(pt.x + 6, pt.y - 6); ctx.lineTo(pt.x - 6, pt.y + 6);
        ctx.stroke();
      });
      break;
  }
}

// au-dessus de tout : projectiles, rayon, décharge, objets lancés, nom de l'attaque
function dessinerAttaquesBoss() {
  const now = performance.now();
  dangersBoss.forEach(d => {
    ctx.save();
    ctx.fillStyle = d.couleur;
    ctx.strokeStyle = d.couleur;
    if (currentTheme.glow) {
      ctx.shadowColor = d.couleur;
      ctx.shadowBlur = 8;
    }
    if (d.type === 'projectile') {
      if (d.forme === 'pixel') {
        ctx.fillRect(d.x - d.rayon, d.y - d.rayon, d.rayon * 2, d.rayon * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(d.x - d.rayon + 1.5, d.y - d.rayon + 1.5, d.rayon * 2 - 3, d.rayon * 2 - 3);
      } else if (d.forme === 'piquant') {
        ctx.translate(d.x, d.y);
        ctx.rotate(d.angle);
        ctx.beginPath();
        ctx.moveTo(d.rayon * 2, 0);
        ctx.lineTo(-d.rayon, -d.rayon * 0.8);
        ctx.lineTo(-d.rayon, d.rayon * 0.8);
        ctx.closePath();
        ctx.fill();
      } else if (d.forme === 'spore') {
        const fondu = Math.min(1, (d.duree - d.vie) / 600);
        ctx.globalAlpha = 0.75 * fondu;
        const b = 1 + Math.sin(now / 200 + d.angle * 3) * 0.12;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.rayon * b, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.9 * fondu;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(d.x - d.rayon * 0.3, d.y - d.rayon * 0.3, d.rayon * 0.25, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.rayon, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.rayon * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (d.type === 'decharge') {
      const p = d.vie / d.duree;
      ctx.globalAlpha = 0.35 * (1 - p);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.rayon, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1 - p * 0.6;
      ctx.lineWidth = 2;
      dessinerEclairs(d.x, d.y, d.rayon, 9);
    } else if (d.type === 'rayon') {
      const p = d.vie / d.duree;
      const loin = Math.hypot(largeurPlateau, hauteurPlateau);
      ctx.globalAlpha = 1 - p * 0.5;
      ctx.lineCap = 'round';
      ctx.lineWidth = d.largeur * (1 - p * 0.4);
      ctx.beginPath();
      ctx.moveTo(d.boss.x, d.boss.y);
      ctx.lineTo(d.boss.x + Math.cos(d.angle) * loin, d.boss.y + Math.sin(d.angle) * loin);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = d.largeur * 0.35;
      ctx.stroke();
    } else if (d.type === 'fil' || d.type === 'graine') {
      const p = Math.max(0, Math.min(1, d.vie / d.duree));
      const haut = Math.sin(Math.PI * p) * 30; // en cloche
      if (d.type === 'fil') {
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(d.dx, d.dy);
        ctx.lineTo(d.x, d.y - haut);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(d.x, d.y - haut, d.type === 'fil' ? 6 : 5, 0, Math.PI * 2);
      ctx.fill();
      if (d.type === 'graine') {
        // la zone visée reste marquée jusqu'à l'impact
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(d.cx, d.cy, d.rayon, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  });

  // nom de l'attaque au-dessus de la barre de vie du boss, pendant la préparation
  const boss = enemies.find(e => e.isBoss);
  const a = boss && boss.attaque;
  if (a && a.etat === 'prepa') {
    const r = reglagesAttaqueSkin(a.skin);
    ctx.save();
    ctx.font = 'bold 11px ' + currentTheme.fontFamily;
    ctx.textAlign = 'center';
    ctx.fillStyle = r.couleur;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.lineWidth = 3;
    const y = Math.max(12, boss.y - boss.radius - 32);
    ctx.strokeText(r.nom + ' !', boss.x, y);
    ctx.fillText(r.nom + ' !', boss.x, y);
    ctx.restore();
  }
}

function dessinerToile(d) {
  const fondu = Math.min(1, (d.duree - d.vie) / 500, d.vie / 150);
  ctx.save();
  ctx.globalAlpha = 0.75 * fondu;
  ctx.strokeStyle = d.couleur;
  ctx.lineWidth = 1.2;
  const rayons = 8;
  for (let i = 0; i < rayons; i++) {
    const ang = (i / rayons) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + Math.cos(ang) * d.rayon, d.y + Math.sin(ang) * d.rayon);
    ctx.stroke();
  }
  for (let k = 1; k <= 3; k++) {
    ctx.beginPath();
    for (let i = 0; i <= rayons; i++) {
      const ang = (i / rayons) * Math.PI * 2;
      const rr = d.rayon * k / 3;
      if (i === 0) ctx.moveTo(d.x + Math.cos(ang) * rr, d.y + Math.sin(ang) * rr);
      else ctx.lineTo(d.x + Math.cos(ang) * rr, d.y + Math.sin(ang) * rr);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 0.12 * fondu;
  ctx.fillStyle = d.couleur;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.rayon, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// petits éclairs en zigzag partant du centre
function dessinerEclairs(x, y, rayon, nombre) {
  const now = performance.now();
  const graine = Math.floor(now / 60);
  for (let i = 0; i < nombre; i++) {
    let ang = (i / nombre) * Math.PI * 2 + graine * 0.7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const pas = 4;
    for (let k = 1; k <= pas; k++) {
      ang += Math.sin(graine * 13.1 + i * 7.3 + k * 3.7) * 0.4;
      ctx.lineTo(x + Math.cos(ang) * rayon * k / pas, y + Math.sin(ang) * rayon * k / pas);
    }
    ctx.stroke();
  }
}
