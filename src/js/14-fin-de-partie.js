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

// --- Feu d'artifice de victoire : un style par thème ---
// Tout vit dans `fireworks` : les fusées (fusee: true) puis leurs éclats. Un objet éteint retourne dans
// `reserveArtifice` et ressert à la salve suivante. Pas de shadowBlur ni de dégradé : chaque éclat est un
// petit rectangle ou un trait, et il n'y en a qu'une centaine à l'écran à la fois (moitié moins en qualité basse).
const reserveArtifice = [];

// couleurs et dessin de la fusée qui monte, puis la gerbe propre au thème
const stylesArtifice = {
  neon: {couleurs: ['#39ff14', '#ff2079', '#00f0ff', '#b026ff', '#ffe600'], fusee: 'trait',
    // lignes lumineuses en étoile, au cœur blanc
    eclater(f, q) {
      const n = Math.round(28 * q);
      for (let i = 0; i < n; i++) eclatArtifice(f.x, f.y, i / n * Math.PI * 2, 0.15, f.couleur, 'neon', 1000, 1, 0.0001, 0.0025);
      for (let i = 0; i < 6 * q; i++) eclatArtifice(f.x, f.y, Math.random() * 6.28, 0.04 + Math.random() * 0.03, '#ffffff', 'point', 600, 2, 0.0001, 0.003);
    }},
  espace: {couleurs: ['#ffffff', '#b3e5fc', '#ffff8d', '#b388ff'], fusee: 'filante',
    // une étoile filante traverse le ciel et se brise en étoiles scintillantes
    eclater(f, q) {
      for (let i = 0; i < 22 * q; i++) eclatArtifice(f.x, f.y, Math.random() * 6.28, 0.03 + Math.random() * 0.09, f.couleur, 'etoile', 1300 + Math.random() * 700, 2 + Math.random() * 2, 0, 0.002);
      for (let i = 0; i < 3; i++) eclatArtifice(f.x, f.y, Math.random() * 6.28, 0.22, '#ffffff', 'trait', 500, 1, 0, 0.001);
    }},
  lave: {couleurs: ['#ffb300', '#ff6d00', '#ff3d00'], fusee: 'braise',
    // braises lourdes qui retombent en refroidissant (jaune, orange, rouge, puis cendre), quelques-unes s'envolent
    eclater(f, q) {
      for (let i = 0; i < 30 * q; i++) eclatArtifice(f.x, f.y, Math.random() * 6.28, 0.05 + Math.random() * 0.13, f.couleur, 'braise', 900 + Math.random() * 600, 2 + Math.random() * 1.5, 0.0005, 0.0015);
      for (let i = 0; i < 6 * q; i++) eclatArtifice(f.x, f.y, -Math.PI / 2 + (Math.random() - 0.5) * 1.6, 0.03 + Math.random() * 0.03, '#ffea00', 'braise', 1600, 1.5, -0.00003, 0.001);
    }},
  ocean: {couleurs: ['#b2ebf2', '#00e5ff', '#1de9b6'], fusee: 'bulle',
    // une grosse bulle monte en ondulant et éclate en petites bulles qui remontent, plus des gouttes
    eclater(f, q) {
      for (let i = 0; i < 16 * q; i++) eclatArtifice(f.x, f.y, Math.random() * 6.28, 0.03 + Math.random() * 0.07, f.couleur, 'bulle', 1400 + Math.random() * 600, 1.5 + Math.random() * 2.5, -0.00012, 0.003);
      for (let i = 0; i < 12 * q; i++) eclatArtifice(f.x, f.y, Math.random() * 6.28, 0.06 + Math.random() * 0.08, '#e0f7fa', 'point', 700, 1.5, 0.0004, 0.002);
    }},
  aurore: {couleurs: ['#69f0ae', '#80d8ff', '#b388ff', '#e1f5fe'], fusee: 'trait',
    // anneau d'étincelles aux couleurs de l'aurore et flocons qui tournent en descendant doucement
    eclater(f, q) {
      const n = Math.round(20 * q);
      for (let i = 0; i < n; i++) eclatArtifice(f.x, f.y, i / n * Math.PI * 2, 0.12, stylesArtifice.aurore.couleurs[i % 3], 'point', 900, 2, 0.0002, 0.002);
      for (let i = 0; i < 12 * q; i++) eclatArtifice(f.x, f.y, Math.random() * 6.28, 0.02 + Math.random() * 0.06, '#e1f5fe', 'flocon', 1800 + Math.random() * 600, 3 + Math.random() * 2, 0.00004, 0.003).vrot = (Math.random() - 0.5) * 0.006;
    }},
  foret: {couleurs: ['#c6ff00', '#eeff41', '#b2ff59'], fusee: 'luciole',
    // une luciole monte en zigzag puis lâche des feuilles qui tombent en se balançant, et d'autres lucioles
    eclater(f, q) {
      const feuilles = ['#9ccc65', '#689f38', '#ffb300', '#e65100'];
      for (let i = 0; i < 14 * q; i++) eclatArtifice(f.x, f.y, Math.random() * 6.28, 0.04 + Math.random() * 0.07, feuilles[i % 4], 'feuille', 1800 + Math.random() * 600, 3 + Math.random() * 1.5, 0.00008, 0.004).vrot = (Math.random() - 0.5) * 0.008;
      for (let i = 0; i < 10 * q; i++) eclatArtifice(f.x, f.y, Math.random() * 6.28, 0.02 + Math.random() * 0.05, f.couleur, 'luciole', 2000 + Math.random() * 800, 2, -0.00001, 0.002);
    }},
  desert: {couleurs: ['#ffd54f', '#ffb74d', '#fff8e1'], fusee: 'trait',
    // saule d'or : de longues traînées qui retombent comme des palmes, et un nuage de sable
    eclater(f, q) {
      const n = Math.round(26 * q);
      for (let i = 0; i < n; i++) eclatArtifice(f.x, f.y, i / n * Math.PI * 2 + Math.random() * 0.2, 0.1 + Math.random() * 0.03, i < n * 0.7 ? '#ffd54f' : '#fff8e1', 'saule', 1800, 1, 0.00035, 0.0025);
      for (let i = 0; i < 10 * q; i++) eclatArtifice(f.x, f.y, Math.random() * 6.28, 0.02 + Math.random() * 0.04, '#d7a86e', 'point', 1200, 1.5, 0.0001, 0.002);
    }},
  synthwave: {couleurs: ['#ff2bd6', '#00f0ff', '#ff7a3d'], fusee: 'trait',
    // deux anneaux parfaits de pixels (rose et cyan) et une onde qui s'élargit, façon années 80
    eclater(f, q) {
      const a = Math.round(24 * q), b = Math.round(14 * q);
      for (let i = 0; i < a; i++) eclatArtifice(f.x, f.y, i / a * Math.PI * 2, 0.13, '#ff2bd6', 'pixel', 1100, 3, 0.00006, 0.0015);
      for (let i = 0; i < b; i++) eclatArtifice(f.x, f.y, (i + 0.5) / b * Math.PI * 2, 0.07, '#00f0ff', 'pixel', 1100, 3, 0.00006, 0.0015);
      eclatArtifice(f.x, f.y, 0, 0, '#ff2bd6', 'onde', 700, 1, 0, 0);
    }},
  halloween: {couleurs: ['#ff7518', '#76ff03', '#b388ff'], fusee: 'braise',
    // étincelles orange, vertes et violettes, et des chauves-souris qui s'envolent en battant des ailes
    eclater(f, q) {
      const couleurs = stylesArtifice.halloween.couleurs;
      for (let i = 0; i < 24 * q; i++) eclatArtifice(f.x, f.y, Math.random() * 6.28, 0.05 + Math.random() * 0.1, couleurs[i % 3], 'point', 1000 + Math.random() * 400, 2.5, 0.0003, 0.002);
      for (let i = 0; i < 3; i++) eclatArtifice(f.x, f.y, -Math.PI / 2 + (i - 1) * 0.9 + (Math.random() - 0.5) * 0.4, 0.06 + Math.random() * 0.02, '#ffab40', 'chauve_souris', 1800, 8, -0.00002, 0.0008);
    }}
};

function styleArtifice() {
  return stylesArtifice[currentThemeName] || stylesArtifice.neon;
}

function qualiteArtifice() {
  return optionQualite === 'basse' ? 0.5 : optionQualite === 'moyenne' ? 0.75 : 1;
}

function eclatArtifice(x, y, angle, vitesse, couleur, forme, vieMax, taille, gravite, frein) {
  const p = reserveArtifice.pop() || {};
  p.fusee = false; p.x = x; p.y = y;
  p.vx = Math.cos(angle) * vitesse; p.vy = Math.sin(angle) * vitesse;
  p.couleur = couleur; p.forme = forme; p.vie = 0; p.vieMax = vieMax; p.taille = taille;
  p.gravite = gravite; p.frein = frein;
  p.rot = Math.random() * Math.PI * 2; p.vrot = 0; p.phase = Math.random() * Math.PI * 2;
  fireworks.push(p);
  return p;
}

// lance une salve de fusées à des instants décalés, chacune explose en gerbe du thème en cours
function launchFireworks() {
  const style = styleArtifice();
  const nombre = optionQualite === 'basse' ? 5 : 7;
  for (let i = 0; i < nombre; i++) {
    const f = reserveArtifice.pop() || {};
    f.fusee = true; f.style = style;
    f.couleur = style.couleurs[Math.floor(Math.random() * style.couleurs.length)];
    f.forme = style.fusee;
    f.vie = -(i * 330 + Math.random() * 250); // négatif : pas encore lancée
    f.phase = Math.random() * Math.PI * 2;
    if (style.fusee === 'filante') {
      // l'étoile filante entre par le haut et file en diagonale
      const versDroite = Math.random() < 0.5;
      f.x = versDroite ? 20 + Math.random() * 160 : largeurPlateau - 20 - Math.random() * 160;
      f.y = -5;
      f.vx = versDroite ? 0.15 : -0.15; f.vy = 0.09;
      f.duree = 900 + Math.random() * 600;
    } else {
      const lente = style.fusee === 'bulle' || style.fusee === 'luciole';
      f.x = 50 + Math.random() * (largeurPlateau - 100);
      f.y = hauteurPlateau + 5;
      f.vx = 0; f.vy = lente ? -0.16 - Math.random() * 0.04 : -0.27 - Math.random() * 0.06;
      f.duree = (hauteurPlateau - 60 - Math.random() * 150) / -f.vy;
    }
    fireworks.push(f);
  }
}

// met à jour fusées + éclats, entièrement indépendant de gameOver/updateCombat
// (pour continuer à s'animer pendant l'écran de victoire)
function updateFireworks(deltaMs) {
  if (fireworks.length === 0) return;
  const dt = Math.min(deltaMs, 50); // un gros à-coup ne téléporte pas tout
  const q = qualiteArtifice();
  // une fusée attend son tour tant que l'écran a déjà assez d'éclats (en comptant ceux des fusées en vol) :
  // les salves qui se chevauchent ne font jamais plus de 150 éclats environ, et chaque gerbe reste entière
  let charge = 0;
  for (let i = 0; i < fireworks.length; i++) charge += fireworks[i].fusee ? (fireworks[i].vie >= 0 ? 40 : 0) : 1;
  const nombre = fireworks.length; // les éclats ajoutés pendant la boucle attendent l'image suivante
  for (let i = 0; i < nombre; i++) {
    const p = fireworks[i];
    if (p.fusee) {
      if (p.vie < 0) {
        if (p.vie + dt >= 0 && charge > 115 * q) continue; // reportée
        p.vie += dt;
        if (p.vie >= 0) charge += 40;
        continue;
      }
      p.vie += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.forme === 'bulle' || p.forme === 'luciole' || p.forme === 'braise') p.x += Math.sin(p.vie * 0.008 + p.phase) * 0.04 * dt;
      if (p.vie >= p.duree) {
        p.style.eclater(p, q);
        p.vieMax = 0; // la fusée s'efface
        playFireworkPopSound();
      }
    } else {
      const frein = Math.max(0, 1 - p.frein * dt);
      p.vx *= frein;
      p.vy = p.vy * frein + p.gravite * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.forme === 'feuille' || p.forme === 'bulle') p.x += Math.sin(p.vie * 0.004 + p.phase) * 0.025 * dt;
      p.rot += p.vrot * dt;
      p.vie += dt;
    }
  }

  // retire ce qui est éteint sans créer de nouveau tableau, et le range dans la réserve
  let garde = 0;
  for (let i = 0; i < fireworks.length; i++) {
    const p = fireworks[i];
    if (p.fusee ? p.vieMax === 0 : p.vie >= p.vieMax) { reserveArtifice.push(p); p.vieMax = 1; }
    else fireworks[garde++] = p;
  }
  fireworks.length = garde;

  // relance une nouvelle salve tant que l'écran de victoire est affiché
  if (fireworks.length === 0 && hasWon) launchFireworks();
}

function dessinerFuseeArtifice(f) {
  ctx.fillStyle = f.couleur;
  ctx.strokeStyle = f.couleur;
  switch (f.forme) {
    case 'bulle':
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 4.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(f.x - 2.5, f.y - 2.5, 1.5, 1.5);
      break;
    case 'braise':
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(f.vie * 0.05);
      ctx.fillRect(f.x - 1.5, f.y - 1.5, 3, 3);
      ctx.globalAlpha = 0.35;
      ctx.fillRect(f.x - 1, f.y + 3, 2, 4); // petite traînée de fumée chaude
      break;
    case 'luciole':
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(f.vie * 0.03);
      ctx.fillRect(f.x - 1.5, f.y - 1.5, 3, 3);
      break;
    default: { // 'trait' et 'filante' : une ligne qui laisse une traînée
      const l = f.forme === 'filante' ? 160 : 45;
      ctx.lineWidth = f.forme === 'filante' ? 1.5 : 1.2;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x - f.vx * l, f.y - f.vy * l);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(f.x - 1, f.y - 1, 2, 2);
    }
  }
}

function dessinerEclatArtifice(p) {
  const progres = p.vie / p.vieMax;
  const fondu = 1 - progres * progres; // reste vif puis s'éteint vite à la fin
  const s = p.taille;
  ctx.globalAlpha = fondu;
  ctx.fillStyle = p.couleur;
  ctx.strokeStyle = p.couleur;
  switch (p.forme) {
    case 'etoile': // étoile à quatre branches qui scintille
      ctx.globalAlpha = fondu * (0.55 + 0.45 * Math.sin(p.vie * 0.02 + p.phase));
      ctx.fillRect(p.x - s, p.y - 0.5, s * 2, 1);
      ctx.fillRect(p.x - 0.5, p.y - s, 1, s * 2);
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      break;
    case 'braise': { // refroidit : jaune, orange, rouge puis cendre
      ctx.fillStyle = progres < 0.25 ? '#fff59d' : progres < 0.55 ? p.couleur : progres < 0.85 ? '#d50000' : '#4e342e';
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      break;
    }
    case 'bulle':
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, Math.PI * 2); ctx.stroke();
      if (s > 2.5) { ctx.fillStyle = '#ffffff'; ctx.fillRect(p.x - s * 0.5, p.y - s * 0.5, 1, 1); }
      break;
    case 'flocon': { // trois traits croisés à 60°
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const a = p.rot + k * Math.PI / 3, cx = Math.cos(a) * s, cy = Math.sin(a) * s;
        ctx.moveTo(p.x - cx, p.y - cy); ctx.lineTo(p.x + cx, p.y + cy);
      }
      ctx.stroke();
      break;
    }
    case 'feuille':
      ctx.beginPath(); ctx.ellipse(p.x, p.y, s, s * 0.45, p.rot, 0, Math.PI * 2); ctx.fill();
      break;
    case 'luciole':
      ctx.globalAlpha = fondu * (0.5 + 0.5 * Math.sin(p.vie * 0.012 + p.phase));
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      break;
    case 'onde': // cercle qui s'élargit
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = fondu * 0.6;
      ctx.beginPath(); ctx.arc(p.x, p.y, 6 + p.vie * 0.11, 0, Math.PI * 2); ctx.stroke();
      break;
    case 'chauve_souris': { // deux ailes qui battent et un petit corps
      const battement = Math.sin(p.vie * 0.03 + p.phase) * s * 0.7;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x - s, p.y - battement);
      ctx.lineTo(p.x - s * 0.4, p.y - battement * 0.2 + 1);
      ctx.lineTo(p.x, p.y);
      ctx.lineTo(p.x + s * 0.4, p.y - battement * 0.2 + 1);
      ctx.lineTo(p.x + s, p.y - battement);
      ctx.stroke();
      ctx.fillRect(p.x - 1.5, p.y - 2, 3, 4);
      break;
    }
    default: // 'point' et 'pixel'
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }
}

// traits d'une même gerbe (même forme, même couleur, même âge) : un seul tracé pour tous ; le néon le repasse
// deux fois (large et transparent dessous, fin dessus) pour imiter la lueur. Renvoie l'indice qui suit la gerbe
function dessinerGerbeTraits(debut) {
  const p0 = fireworks[debut];
  const fondu = 1 - (p0.vie / p0.vieMax) ** 2;
  const l = p0.forme === 'neon' ? 70 : p0.forme === 'saule' ? 120 : 60;
  let fin = debut;
  ctx.beginPath();
  while (fin < fireworks.length) {
    const p = fireworks[fin];
    if (p.fusee || p.forme !== p0.forme || p.couleur !== p0.couleur || p.vie !== p0.vie) break;
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * l, p.y - p.vy * l);
    fin++;
  }
  ctx.strokeStyle = p0.couleur;
  if (p0.forme === 'neon') {
    ctx.lineWidth = 3.5;
    ctx.globalAlpha = fondu * 0.3;
    ctx.stroke();
  }
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = fondu;
  ctx.stroke();
  return fin;
}

function drawFireworks() {
  if (fireworks.length === 0) return;
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < fireworks.length; i++) {
    const p = fireworks[i];
    if (p.fusee) {
      if (p.vie >= 0) { ctx.globalAlpha = 1; dessinerFuseeArtifice(p); }
    } else if (p.forme === 'neon' || p.forme === 'trait' || p.forme === 'saule') i = dessinerGerbeTraits(i) - 1;
    else dessinerEclatArtifice(p);
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

