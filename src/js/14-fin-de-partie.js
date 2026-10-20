function triggerWin() {
  hasWon = true;
  gameOver = true;
  joueurs.forEach(j => j.prevSnake = j.snake.map(s => ({...s})));

  messageEl.innerHTML =
    '<span style="color:#ffd700; font-size:22px; font-weight:bold; text-shadow:0 0 8px rgba(255,215,0,0.7);">' +
    '🎉 FÉLICITATIONS, VOUS AVEZ GAGNÉ ! 🎉</span>';

  restartBtn.style.display = 'inline-block';
  playVictorySound();
  succesFinPartie(true);
  progressionFinPartie(true);
  saveHighscore(score);
  showEndGameStats();
  launchFireworks();
}

// --- Feux d'artifice de victoire : un style par thème ---
// Pensés pour un vieux PC : 6 fusées par salve, 20 à 32 particules par gerbe, aucun flou
// (shadowBlur) ni dégradé, et les objets sont recyclés au lieu d'être recréés à chaque gerbe.
// fireworks contient fusées et particules ; une fusée a vie < 0 tant qu'elle attend son tour.
const reserveArtifice = [];

function elementArtifice(style, forme, x, y, vx, vy, vieMax, couleur, taille) {
  const e = reserveArtifice.pop() || {};
  e.style = style; e.forme = forme;
  e.x = x; e.y = y; e.vx = vx; e.vy = vy;
  e.vie = 0; e.vieMax = vieMax;
  e.couleur = couleur; e.taille = taille;
  e.graine = Math.random() * 6.28; // décale clignotements et balancements d'une particule à l'autre
  fireworks.push(e);
  return e;
}

// gerbe en cercle : n particules réparties autour de (x, y), vitesse entre vMin et vMax
function gerbeArtifice(style, forme, x, y, n, vMin, vMax, vieMin, vieMax, couleurs, tMin, tMax) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.2;
    const v = vMin + Math.random() * (vMax - vMin);
    elementArtifice(style, forme, x, y, Math.cos(a) * v, Math.sin(a) * v,
      vieMin + Math.random() * (vieMax - vieMin), couleurs[i % couleurs.length], tMin + Math.random() * (tMax - tMin));
  }
}

// gravite et air (freinage) en px/ms ; fusee : couleur, durée de montée et longueur de traînée (ms de vol)
const stylesArtifice = {
  // néon : traits lumineux nets, en anneau
  neon: {
    gravite: 0.00010, air: 0.0012, fusee: {trainee: 45},
    eclater(f) {
      const c = f.couleur === '#00f0ff' ? ['#39ff14', '#00f0ff'] : [f.couleur, '#00f0ff'];
      gerbeArtifice(this, 'trait', f.x, f.y, 26, 0.17, 0.2, 900, 1100, c, 2, 2);
    },
    couleurs: ['#39ff14', '#ff2079', '#b026ff', '#00f0ff']
  },
  // espace : étoiles filantes en diagonale qui éclatent en scintillements et une onde
  espace: {
    gravite: 0.00002, air: 0.0016, fusee: {trainee: 110, filante: true},
    eclater(f) {
      gerbeArtifice(this, 'etoile', f.x, f.y, 20, 0.03, 0.14, 1200, 1800, ['#40c4ff', '#ea80fc', '#ffff8d', '#ffffff'], 2, 4);
      elementArtifice(this, 'onde', f.x, f.y, 0, 0, 700, '#b3e5fc', 0.09);
    },
    couleurs: ['#ffffff']
  },
  // lave : jet de braises vers le haut qui retombent en refroidissant
  lave: {
    gravite: 0.00050, air: 0.0010, fusee: {trainee: 60},
    eclater(f) {
      for (let i = 0; i < 26; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6; // surtout vers le haut, comme un volcan
        const v = 0.08 + Math.random() * 0.17;
        elementArtifice(this, 'braise', f.x, f.y, Math.cos(a) * v, Math.sin(a) * v,
          1000 + Math.random() * 600, '', 2 + Math.random() * 2);
      }
    },
    couleurs: ['#ff9100']
  },
  // océan : une grosse bulle monte lentement et éclate en petites bulles qui remontent en ondulant
  ocean: {
    gravite: -0.00014, air: 0.0025, fusee: {bulle: true, montee: 1700},
    eclater(f) {
      gerbeArtifice(this, 'bulle', f.x, f.y, 16, 0.04, 0.12, 1300, 1900, ['#80deea', '#b2ebf2', '#1de9b6', '#ffffff'], 2, 5);
      elementArtifice(this, 'onde', f.x, f.y, 0, 0, 350, '#e0f7fa', 0.06);
    },
    couleurs: ['#b2ebf2']
  },
  // aurore : flocons aux couleurs de l'aurore qui tournent et descendent doucement
  aurore: {
    gravite: 0.00004, air: 0.0022, fusee: {trainee: 40},
    eclater(f) {
      gerbeArtifice(this, 'flocon', f.x, f.y, 18, 0.06, 0.13, 1800, 2400, ['#80d8ff', '#69f0ae', '#b388ff', '#e1f5fe'], 3, 4.5);
    },
    couleurs: ['#e1f5fe']
  },
  // forêt : nuée de lucioles qui clignotent et quelques feuilles qui tombent en se balançant
  foret: {
    gravite: 0, air: 0.0022, fusee: {trainee: 40},
    eclater(f) {
      gerbeArtifice(this, 'luciole', f.x, f.y, 18, 0.03, 0.11, 1800, 2600, ['#eeff41', '#c6ff00', '#ffee58'], 2, 2);
      for (let i = 0; i < 5; i++) {
        elementArtifice(this, 'feuille', f.x + (Math.random() - 0.5) * 30, f.y, (Math.random() - 0.5) * 0.06, 0.02 + Math.random() * 0.03,
          2000 + Math.random() * 600, i % 2 ? '#9ccc65' : '#ff8f00', 4);
      }
    },
    couleurs: ['#c5e1a5']
  },
  // désert : « palmier » doré, des branches de sable qui retombent lourdement
  desert: {
    gravite: 0.00030, air: 0.0012, fusee: {trainee: 60},
    eclater(f) {
      const base = Math.random();
      for (let b = 0; b < 8; b++) {
        const a = base + b * Math.PI / 4;
        for (let k = 0; k < 4; k++) {
          const v = 0.07 + k * 0.035;
          elementArtifice(this, 'grain', f.x, f.y, Math.cos(a) * v, Math.sin(a) * v - 0.03,
            1200 + k * 100, k === 3 ? '#e0f7fa' : (k % 2 ? '#ffb74d' : '#ffd54f'), k === 3 ? 3 : 2.5);
        }
      }
    },
    couleurs: ['#ffd54f']
  },
  // synthwave : deux anneaux de pixels parfaits (rose et cyan) et un trait de balayage horizontal
  synthwave: {
    gravite: 0.00006, air: 0.0012, fusee: {trainee: 50},
    eclater(f) {
      gerbeArtifice(this, 'pixel', f.x, f.y, 20, 0.17, 0.17, 1100, 1100, ['#ff2bd6'], 3, 3);
      gerbeArtifice(this, 'pixel', f.x, f.y, 12, 0.09, 0.09, 1100, 1100, ['#00f0ff'], 3, 3);
      elementArtifice(this, 'balayage', f.x, f.y, 0, 0, 450, '#ffe600', 0.35);
    },
    couleurs: ['#ff2bd6']
  },
  // halloween : étincelles orange et vertes, et trois chauves-souris qui s'envolent
  halloween: {
    gravite: 0.00012, air: 0.0014, fusee: {trainee: 50},
    eclater(f) {
      gerbeArtifice(this, 'etincelle', f.x, f.y, 18, 0.08, 0.17, 900, 1200, ['#ff7518', '#76ff03', '#ffab40'], 2, 3);
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i - 1) * 0.9 + (Math.random() - 0.5) * 0.4;
        elementArtifice(this, 'chauve', f.x, f.y, Math.cos(a) * 0.08, Math.sin(a) * 0.08, 1800, '#b388ff', 7);
      }
    },
    couleurs: ['#ff7518']
  }
};

// lance une salve de fusées décalées dans le temps, dans le style du thème courant
function launchFireworks() {
  const style = stylesArtifice[currentThemeName] || stylesArtifice.neon;
  const fusee = style.fusee;
  for (let i = 0; i < 6; i++) {
    let x, y, vx, vy, duree;
    if (fusee.filante) {
      // étoile filante : part d'en haut, file en diagonale vers le bas
      const versDroite = Math.random() < 0.5;
      duree = 700 + Math.random() * 300;
      vx = (versDroite ? 1 : -1) * (0.28 + Math.random() * 0.1);
      vy = 0.08 + Math.random() * 0.06;
      x = versDroite ? 20 + Math.random() * largeurPlateau * 0.3 : largeurPlateau * 0.7 + Math.random() * (largeurPlateau * 0.3 - 20);
      y = 15 + Math.random() * 70;
    } else {
      duree = (fusee.montee || 1000) + Math.random() * 300;
      x = 40 + Math.random() * (largeurPlateau - 80);
      y = hauteurPlateau;
      vx = (Math.random() - 0.5) * 0.03;
      vy = (50 + Math.random() * 140 - y) / duree;
    }
    const f = elementArtifice(style, fusee.bulle ? 'fuseeBulle' : 'fusee', x, y, vx, vy, duree,
      style.couleurs[i % style.couleurs.length], fusee.trainee || 0);
    f.vie = -(i * 330 + Math.random() * 250); // attend son tour
  }
}

// met à jour fusées + particules, entièrement indépendant de gameOver/updateCombat
// (pour continuer à s'animer pendant l'écran de victoire)
function updateFireworks(deltaMs) {
  if (fireworks.length === 0) return;
  const dt = Math.min(deltaMs, 50); // après une saccade, pas de bond géant
  let n = 0;
  // les éléments ajoutés pendant la boucle (gerbes) sont traités dans la même boucle ; le tableau
  // est compacté sur place (n ≤ i), sans créer de nouveau tableau
  for (let i = 0; i < fireworks.length; i++) {
    const e = fireworks[i];
    const enAttente = e.vie < 0;
    e.vie += dt;
    if (enAttente) { fireworks[n++] = e; continue; }
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    if (e.forme === 'fusee' || e.forme === 'fuseeBulle') {
      if (e.vie >= e.vieMax) {
        e.style.eclater(e);
        playFireworkPopSound();
        reserveArtifice.push(e);
        continue;
      }
    } else {
      if (e.vie >= e.vieMax) { reserveArtifice.push(e); continue; }
      const freinage = 1 - e.style.air * dt;
      e.vx *= freinage;
      e.vy = e.vy * freinage + e.style.gravite * dt;
    }
    fireworks[n++] = e;
  }
  fireworks.length = n;

  // relance une nouvelle salve tant que l'écran de victoire est affiché
  if (fireworks.length === 0 && hasWon) {
    launchFireworks();
  }
}

const couleursBraise = ['#fff59d', '#ffab00', '#ff3d00', '#8d1c00'];

function drawFireworks() {
  if (fireworks.length === 0) return;
  ctx.save();
  for (let i = 0; i < fireworks.length; i++) {
    const e = fireworks[i];
    if (e.vie < 0) continue;
    const t = e.vie / e.vieMax;
    const x = e.x, y = e.y, s = e.taille;
    let alpha = 1 - t;
    switch (e.forme) {
      case 'fusee':
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = e.couleur;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - e.vx * s, y - e.vy * s);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = e.couleur;
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
        break;
      case 'fuseeBulle':
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = e.couleur;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + Math.sin(e.vie * 0.006 + e.graine) * 4, y, 6, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'trait': // néon : un trait dans le sens du mouvement (un seul tracé, sans halo : le flou coûte cher)
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = e.couleur;
        ctx.lineWidth = s;
        ctx.beginPath();
        ctx.moveTo(x - e.vx * 55, y - e.vy * 55);
        ctx.lineTo(x, y);
        ctx.stroke();
        break;
      case 'etoile': { // espace : petite croix qui scintille
        ctx.globalAlpha = alpha * (0.55 + 0.45 * Math.sin(e.vie * 0.02 + e.graine));
        ctx.fillStyle = e.couleur;
        const d = s * (1 - t * 0.5);
        ctx.fillRect(x - d, y - 0.6, d * 2, 1.2);
        ctx.fillRect(x - 0.6, y - d, 1.2, d * 2);
        break;
      }
      case 'onde': // anneau qui s'élargit (espace, éclatement de bulle)
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = e.couleur;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 4 + e.vie * s, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'braise': { // lave : carré qui refroidit, du jaune au rouge sombre
        ctx.globalAlpha = t < 0.75 ? 1 : (1 - t) * 4;
        ctx.fillStyle = couleursBraise[Math.min(3, Math.floor(t * 4))];
        const d = s * (1 - t * 0.5);
        ctx.fillRect(x - d / 2, y - d / 2, d, d);
        break;
      }
      case 'bulle': // océan : cercle creux avec un reflet, qui ondule en montant
        ctx.globalAlpha = t < 0.7 ? 0.85 : (1 - t) * 2.8;
        ctx.strokeStyle = e.couleur;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + Math.sin(e.vie * 0.005 + e.graine) * 3, y, s, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + Math.sin(e.vie * 0.005 + e.graine) * 3 - s * 0.45, y - s * 0.55, 1.5, 1.5);
        break;
      case 'flocon': { // aurore : trois branches qui tournent lentement
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = e.couleur;
        ctx.lineWidth = 1.2;
        const r = e.vie * 0.0015 + e.graine;
        ctx.beginPath();
        for (let k = 0; k < 3; k++) {
          const dx = Math.cos(r + k * 1.047) * s, dy = Math.sin(r + k * 1.047) * s;
          ctx.moveTo(x - dx, y - dy);
          ctx.lineTo(x + dx, y + dy);
        }
        ctx.stroke();
        break;
      }
      case 'luciole': { // forêt : point qui clignote et se promène, avec un halo carré pâle
        const lx = x + Math.sin(e.vie * 0.003 + e.graine) * 6;
        const ly = y + Math.cos(e.vie * 0.0023 + e.graine) * 4;
        const lueur = alpha * (0.5 + 0.5 * Math.sin(e.vie * 0.012 + e.graine));
        ctx.fillStyle = e.couleur;
        ctx.globalAlpha = lueur * 0.25;
        ctx.fillRect(lx - 3, ly - 3, 6, 6);
        ctx.globalAlpha = lueur;
        ctx.fillRect(lx - 1, ly - 1, 2, 2);
        break;
      }
      case 'feuille': { // forêt : losange qui se balance en tombant
        ctx.globalAlpha = alpha;
        ctx.fillStyle = e.couleur;
        const fx = x + Math.sin(e.vie * 0.004 + e.graine) * 10;
        const r = Math.sin(e.vie * 0.004 + e.graine) * 0.8;
        const ax = Math.cos(r) * s, ay = Math.sin(r) * s;
        ctx.beginPath();
        ctx.moveTo(fx - ax, y - ay);
        ctx.lineTo(fx - ay * 0.4, y + ax * 0.4);
        ctx.lineTo(fx + ax, y + ay);
        ctx.lineTo(fx + ay * 0.4, y - ax * 0.4);
        ctx.fill();
        break;
      }
      case 'grain': // désert : grain de sable doré
        ctx.globalAlpha = alpha;
        ctx.fillStyle = e.couleur;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
        break;
      case 'pixel': // synthwave : gros pixel aligné sur la grille
        ctx.globalAlpha = t < 0.6 ? 1 : (1 - t) * 2.5;
        ctx.fillStyle = e.couleur;
        ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
        break;
      case 'balayage': { // synthwave : trait horizontal qui s'étire puis s'efface
        const l = e.vie * s;
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = e.couleur;
        ctx.fillRect(x - l, y - 1, l * 2, 2);
        break;
      }
      case 'etincelle':
        ctx.globalAlpha = alpha;
        ctx.fillStyle = e.couleur;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
        break;
      case 'chauve': { // halloween : silhouette de chauve-souris qui bat des ailes
        ctx.globalAlpha = t < 0.7 ? 1 : (1 - t) * 3.3;
        ctx.fillStyle = e.couleur;
        const battement = Math.sin(e.vie * 0.025 + e.graine);
        ctx.beginPath();
        ctx.moveTo(x, y - s * 0.3);
        ctx.lineTo(x + s, y - s * 0.6 * battement);
        ctx.lineTo(x + s * 0.55, y + s * 0.15);
        ctx.lineTo(x + s * 0.3, y);
        ctx.lineTo(x, y + s * 0.4);
        ctx.lineTo(x - s * 0.3, y);
        ctx.lineTo(x - s * 0.55, y + s * 0.15);
        ctx.lineTo(x - s, y - s * 0.6 * battement);
        ctx.fill();
        break;
      }
    }
  }
  ctx.restore();
}

// infos affichées sur l'écran de game over (null pendant la partie)
let ecranGameOver = null;

function endGame() {
  gameOver = true;
  joueurs.forEach(j => j.prevSnake = j.snake.map(s => ({...s}))); // fige le rendu sur la position finale
  messageEl.textContent = 'Perdu ! Score final : ' + score;
  restartBtn.style.display = 'inline-block';
  playGameOverSound();
  triggerShake(8);
  declencherFlash('#ff1744');

  const survie = Math.max(0, (performance.now() - stats.startTime) / 1000);
  const minutes = Math.floor(survie / 60);
  const secondes = Math.floor(survie % 60);
  ecranGameOver = {
    debut: performance.now(),
    score,
    meilleur: null,
    nouveauRecord: false,
    temps: minutes > 0 ? minutes + 'm ' + secondes + 's' : secondes + 's',
    ennemis: stats.enemiesKilled,
    longueur: stats.maxSnakeLength,
    joueurs: enCoop() ? joueurs.map(j => ({nom: j.nom, couleur: couleurJoueur(j), ennemis: j.ennemis, pommes: j.pommes})) : null
  };
  // meilleur score précédent, lu avant d'enregistrer celui-ci
  const infos = ecranGameOver;
  loadHighscores().then(liste => {
    const meilleur = liste.reduce((m, h) => Math.max(m, h.score), -Infinity);
    infos.meilleur = isFinite(meilleur) ? meilleur : null;
    infos.nouveauRecord = infos.score > 0 && (infos.meilleur === null || infos.score > infos.meilleur);
  }).catch(() => {}).finally(() => saveHighscore(infos.score));
  succesFinPartie(false);
  progressionFinPartie(false);
  showEndGameStats();
}

// écran de game over dessiné sur le jeu : voile sombre, titre, score, résumé et invite à rejouer
function dessinerEcranGameOver() {
  const go = ecranGameOver;
  if (!go || !gameOver || hasWon) return;
  const now = performance.now();
  const age = now - go.debut;
  const apparition = Math.min(1, age / 500);
  const w = largeurPlateau, h = hauteurPlateau;

  ctx.save();
  // voile sombre teinté de rouge
  ctx.globalAlpha = apparition;
  ctx.fillStyle = 'rgba(10, 0, 4, 0.72)';
  ctx.fillRect(0, 0, w, h);
  if (!vignetteGameOverCache) {
    vignetteGameOverCache = creerVignette('rgba(255, 23, 68, 0)', 'rgba(255, 23, 68, 0.35)');
  }
  ctx.drawImage(vignetteGameOverCache, 0, 0);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // titre qui tombe et rebondit légèrement
  const chute = Math.min(1, age / 450);
  const rebond = 1 - Math.pow(1 - chute, 3);
  const yTitre = 92 - (1 - rebond) * 60;
  ctx.save();
  ctx.translate(w / 2, yTitre);
  const pulse = 1 + Math.sin(now / 350) * 0.03;
  ctx.scale(pulse, pulse);
  ctx.font = 'bold 46px ' + policeTitre();
  ctx.shadowColor = '#ff1744';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#ff1744';
  ctx.fillText('GAME OVER', 0, 0);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.85 * apparition;
  ctx.fillText('GAME OVER', 0, -2);
  ctx.restore();

  // le reste apparaît juste après le titre
  const contenu = Math.max(0, Math.min(1, (age - 300) / 400));
  ctx.globalAlpha = contenu;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 6;

  ctx.fillStyle = currentTheme.textMuted;
  ctx.font = '14px ' + currentTheme.fontFamily;
  ctx.fillText('SCORE', w / 2, 150);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px ' + policeTitre();
  ctx.fillText(String(go.score), w / 2, 182);

  ctx.font = 'bold 14px ' + currentTheme.fontFamily;
  if (go.nouveauRecord) {
    const clignote = Math.floor(now / 300) % 2 === 0;
    ctx.fillStyle = clignote ? '#ffd700' : '#fff3a0';
    ctx.fillText('🏆 NOUVEAU RECORD !', w / 2, 214);
  } else if (go.meilleur !== null) {
    ctx.fillStyle = currentTheme.textMuted;
    ctx.fillText('Meilleur score : ' + go.meilleur, w / 2, 214);
  }

  // résumé en trois cases
  const cases = [
    ['⏱️', go.temps, 'survie'],
    ['👾', String(go.ennemis), 'ennemis'],
    ['📏', String(go.longueur), 'longueur max']
  ];
  const largeurCase = 104, hauteurCase = 62, ecart = 10;
  const xDebut = (w - (largeurCase * 3 + ecart * 2)) / 2;
  cases.forEach(([icone, valeur, libelle], i) => {
    const x = xDebut + i * (largeurCase + ecart);
    const y = 238;
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.fillRect(x, y, largeurCase, hauteurCase);
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, largeurCase - 1, hauteurCase - 1);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(icone, x + largeurCase / 2, y + 15);
    ctx.font = 'bold 17px ' + currentTheme.fontFamily;
    ctx.fillText(valeur, x + largeurCase / 2, y + 35);
    ctx.font = '11px ' + currentTheme.fontFamily;
    ctx.fillStyle = currentTheme.textMuted;
    ctx.fillText(libelle, x + largeurCase / 2, y + 52);
  });

  // coop : ce que chaque joueur a fait
  if (go.joueurs) {
    ctx.shadowBlur = 4;
    ctx.font = 'bold 13px ' + currentTheme.fontFamily;
    go.joueurs.forEach((jo, i) => {
      ctx.fillStyle = jo.couleur;
      ctx.fillText(jo.nom + ' : ' + jo.ennemis + ' 👾  ' + jo.pommes + ' 🍎', w / 2 + (i === 0 ? -86 : 86), 318);
    });
  }

  // succès gagnés pendant la partie (la liste est sous le jeu)
  if (!go.joueurs && partieSucces.debloques.length) {
    const n = partieSucces.debloques.length;
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px ' + currentTheme.fontFamily;
    ctx.fillText('🏆 ' + n + (n > 1 ? ' succès débloqués' : ' succès débloqué'), w / 2, 318);
  }

  // invite à rejouer, selon la commande utilisée
  if (age > 700 && Math.floor(now / 500) % 2 === 0) {
    const invite = modeEntree === 'manette' ? 'Appuie sur A pour rejouer'
      : modeEntree === 'tactile' ? 'Touche l\'écran pour rejouer'
      : 'Appuie sur ESPACE pour rejouer';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px ' + currentTheme.fontFamily;
    ctx.fillText(invite, w / 2, 340);
  }
  // Écailles gagnées (js/03-progression.js)
  const gainEcailles = texteGainPartie();
  if (gainEcailles) {
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px ' + currentTheme.fontFamily;
    ctx.fillText(gainEcailles, w / 2, 364);
  }
  ctx.globalAlpha = contenu * 0.7;
  ctx.shadowBlur = 0;
  ctx.fillStyle = currentTheme.textMuted;
  ctx.font = '12px ' + currentTheme.fontFamily;
  // tant que la Boutique n'a jamais été ouverte, on la signale à la place
  const signalerBoutique = gainEcailles && !progression.boutiqueVue;
  if (signalerBoutique) {
    ctx.globalAlpha = contenu;
    ctx.fillStyle = '#ffd700';
  }
  ctx.fillText(signalerBoutique
    ? '🛒 Dépense-les dans la Boutique (' + texteCommande('touche ' + nomTouche(touches.buffs), 'Y', 'menu ☰') + ')'
    : 'Détails de la partie sous le jeu', w / 2, gainEcailles ? 384 : 368);
  ctx.restore();
}

function showEndGameStats() {
  const survivalSeconds = Math.max(0, (performance.now() - stats.startTime) / 1000);
  const minutes = Math.floor(survivalSeconds / 60);
  const seconds = Math.floor(survivalSeconds % 60);
  const timeStr = minutes > 0 ? minutes + 'm ' + seconds + 's' : seconds + 's';

  const accuracy = stats.shotsFired > 0
    ? ((stats.shotsHit / stats.shotsFired) * 100).toFixed(1)
    : '0.0';

  const rows = [
    ['⏱️ Temps de survie', timeStr],
    ['👾 Ennemis tués', stats.enemiesKilled],
    ['<span class="legend-swatch" style="background:#4caf50"></span> ' + nomPomme('normale') + ' (ramassées)', stats.applesEaten],
    ['🟡 ' + nomPomme('or'), stats.goldenApplesEaten],
    ['🔵 ' + nomPomme('bleue'), stats.blueApplesEaten],
    ['❤️ Cœurs bonus', stats.heartsCollected],
    ['🔫 Précision de tir', accuracy + '% (' + stats.shotsHit + '/' + stats.shotsFired + ')'],
    ['📏 Longueur max', stats.maxSnakeLength]
  ];
  if (enCoop()) {
    joueurs.forEach(j => {
      rows.push([etiquetteJoueur(j) + ' ennemis tués / pommes', j.ennemis + ' / ' + j.pommes]);
    });
  }

  statsPanelEl.innerHTML =
    '<h3>📊 Stats de la partie</h3><ul>' +
    rows.map(([label, value]) =>
      '<li><span>' + label + '</span><span class="stat-value">' + value + '</span></li>'
    ).join('') +
    '</ul><div id="statsEcailles"></div><div id="statsSucces"></div>';
  statsPanelEl.style.display = 'block';
  majRecapEcailles();
  majRecapSucces();
}

// --- Tableau des meilleurs scores (gardé dans le localStorage du navigateur) ---
const maxHighscores = 5;

// meilleurs scores séparés par difficulté ; Difficile garde les clés d'origine (anciens scores)
function cleHighscores(base) {
  return difficulte === 'difficile' ? base : base + reglagesDifficulte().nom;
}

async function loadHighscores() {
  try {
    const raw = localStorage.getItem(cleHighscores(enCoop() ? 'snakeHighscoresCoop' : 'snakeHighscores'));
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return []; // stockage totalement indisponible : pas de persistance possible
  }
}

async function saveHighscoresList(list) {
  try {
    localStorage.setItem(cleHighscores(enCoop() ? 'snakeHighscoresCoop' : 'snakeHighscores'), JSON.stringify(list));
  } catch (err) {
    // stockage indisponible : le tableau reste seulement en mémoire pour cette session
  }
}

function renderHighscores(list, highlightScore) {
  highscoreListEl.innerHTML = '';

  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'highscore-empty';
    li.textContent = 'Aucun score enregistré';
    highscoreListEl.appendChild(li);
    return;
  }

  list.forEach((entry, i) => {
    const li = document.createElement('li');
    if (highlightScore !== undefined && entry.score === highlightScore && !entry._used) {
      li.classList.add('current-score');
      entry._used = true; // évite de surligner deux entrées identiques
    }
    const rank = document.createElement('span');
    rank.textContent = (i + 1) + '.';
    const val = document.createElement('span');
    val.textContent = entry.score;
    li.appendChild(rank);
    li.appendChild(val);
    highscoreListEl.appendChild(li);
  });
}

async function saveHighscore(finalScore) {
  const list = await loadHighscores();
  const entree = {score: finalScore, date: Date.now()};
  list.push(entree);
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, maxHighscores);
  if (finalScore > 0 && trimmed.includes(entree)) succesPodium();
  await saveHighscoresList(trimmed);
  renderHighscores(trimmed, finalScore);
}

async function initHighscores() {
  const list = await loadHighscores();
  renderHighscores(list);
}

