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

// launchFireworks, updateFireworks et drawFireworks : js/14-feux-artifice.js

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

