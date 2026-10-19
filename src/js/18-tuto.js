// ============================================================
// --- Tutoriel guidé : une partie en solo découpée en étapes ---
// ============================================================
// Chaque étape donne une consigne (adaptée au clavier, à la manette ou au tactile) et passe à la suivante
// dès qu'elle est réussie. Pendant le tutoriel, le jeu ne fait apparaître ni ennemis ni butin au hasard :
// chaque étape place ce dont elle a besoin. On ne peut pas perdre : le serpent repart ailleurs.
// Lancé par T sur l'écran de départ, le bouton 🎓 du menu ☰ ou « Lancer le tutoriel » de l'aide.
const cleStockageTutoFait = 'snakeTutoFait';
const vitesseTuto = 0.75; // serpent un peu plus lent qu'en Facile
const pvBossTuto = 4;
const delaiEtapeReussie = 1400; // ms entre « Bravo » et l'étape suivante
const dureeFinTuto = 6000;
let tuto = null; // null, ou l'état du tutoriel en cours (voir lancerTuto)

function tutoActif() {
  return !!tuto;
}

function tutoDejaFait() {
  try {
    return localStorage.getItem(cleStockageTutoFait) === 'oui';
  } catch (e) {
    return false;
  }
}

// ennemi du tutoriel : plus lent que d'habitude, gelé si demandé
function ennemiTuto(gele) {
  const avant = enemies.length;
  spawnEnemy();
  const e = enemies[avant];
  if (!e) return;
  e.speedFactor = 0.5;
  e.vx *= 0.5;
  e.vy *= 0.5;
  if (gele) e.frozenUntil = freezeIndicatorUntil;
}

// garde assez de points pour tirer
function pointsPourTirer(minimum) {
  if (score >= minimum) return;
  score = minimum;
  scoreEl.textContent = 'Score : ' + score;
}

function positionLoinDuSerpent() {
  return pickEnemySpawnPosition();
}

function pommeMobileTuto(liste, vitesse, rayon, buffType) {
  const pos = positionLoinDuSerpent();
  const angle = Math.random() * Math.PI * 2;
  const pomme = {
    x: pos.x, y: pos.y,
    vx: Math.cos(angle) * vitesse,
    vy: Math.sin(angle) * vitesse,
    radius: rayon,
    changeDirTimer: 800 + Math.random() * 1000
  };
  if (buffType) pomme.buffType = buffType;
  liste.push(pomme);
}

const etapesTuto = [
  {
    cle: 'bouger', titre: 'Se déplacer', total: 4,
    texte: () => texteCommande('Tourne avec ' + nomTouchesDirection(true).replace('Flèches', 'les flèches') + ' ou ' + nomTouchesDirection(false) + '.', 'Tourne avec le stick gauche ou la croix.',
      'Glisse le doigt dans la zone 👆 (ou appuie sur le pad) pour tourner.') + ' Fais 4 virages sans toucher les murs.',
    progres: t => t.virages
  },
  {
    cle: 'manger', titre: 'Manger', total: 3,
    texte: () => 'Mange 3 pommes (' + nomPomme('normale') + ') : chacune donne 10 points et un segment de plus.',
    progres: t => stats.applesEaten - t.base.pommes,
    cible: () => food && centreCase(food)
  },
  {
    cle: 'tirer', titre: 'Tirer', total: 2,
    preparer: () => pointsPourTirer(30),
    texte: () => texteCommande('Vise l\'ennemi avec la souris et clique pour tirer.',
      'Vise l\'ennemi au stick droit et tire avec RT (ou X).',
      'Tiens le stick de la zone 🎯 vers l\'ennemi, pousse-le à fond pour tirer.') +
      ' La tourelle est sur ton dos. Chaque tir coûte 2 points.',
    progres: t => stats.enemiesKilled - t.base.ennemis,
    entretien: t => {
      pointsPourTirer(6);
      if (!enemies.length) ennemiTuto(false);
    },
    cible: () => enemies[0]
  },
  {
    cle: 'bouclier', titre: 'Bouclier', total: 2,
    condition: () => capacitesActives.bouclier,
    preparer: t => {
      shieldReadyAt = 0;
      t.bouclierVu = false;
      t.tueBouclier = false;
    },
    texte: t => (t.bouclierVu ? 'Bouclier actif : fonce dans l\'ennemi, il est détruit sans te blesser !'
      : 'Active le bouclier (' + texteCommande(nomToucheBouclierSolo(), 'B ou LB', 'bouton 🛡️') + ') puis fonce dans l\'ennemi.') +
      ' Hors tutoriel, il se recharge en 15 secondes.',
    progres: t => (t.bouclierVu ? 1 : 0) + (t.tueBouclier ? 1 : 0),
    entretien: (t, now) => {
      if (now < shieldActiveUntil) t.bouclierVu = true;
      else if (!t.tueBouclier) shieldReadyAt = 0; // raté : on peut réessayer tout de suite
      if (stats.enemiesKilled > t.killsVus) {
        if (now < shieldActiveUntil + 150) t.tueBouclier = true;
        t.killsVus = stats.enemiesKilled;
      }
      if (!enemies.length) ennemiTuto(false);
    },
    cible: () => enemies[0]
  },
  {
    cle: 'boost', titre: 'Accélérer', total: 2,
    condition: () => capacitesActives.sprint,
    preparer: t => t.boostCumul = 0,
    texte: () => 'Maintiens ' + texteCommande(nomTouche(touches.boost), 'A / Croix', 'le bouton Boost') +
      ' pour aller plus vite. Garde-le 2 secondes.',
    progres: t => Math.floor(t.boostCumul / 1000),
    entretien: (t, now, dt) => {
      if (boosting) t.boostCumul += dt;
    }
  },
  {
    cle: 'pommeBleue', titre: 'Pomme bleue', total: 1,
    preparer: () => pommeMobileTuto(blueApples, blueAppleSpeed, blueAppleRadius, 'freeze'),
    texte: () => nomPomme('bleue') + ' bouge : attrape-la ! Elle donne un buff au hasard. Ici, ce sera le gel.',
    progres: t => stats.blueApplesEaten - t.base.pommesBleues,
    entretien: t => {
      if (!blueApples.length && stats.blueApplesEaten === t.base.pommesBleues) {
        pommeMobileTuto(blueApples, blueAppleSpeed, blueAppleRadius, 'freeze');
      }
    },
    cible: () => blueApples[0]
  },
  {
    cle: 'briser', titre: 'Ennemis gelés', total: 3,
    preparer: () => {
      freezeIndicatorUntil = Math.max(freezeIndicatorUntil, performance.now() + 3000);
      for (let i = 0; i < 3; i++) ennemiTuto(true);
    },
    texte: () => 'Le gel fige les ennemis : ils ne te font plus rien. Fonce dedans avec la tête pour les briser !',
    progres: t => stats.enemiesKilled - t.base.ennemis,
    entretien: (t, now) => {
      // le gel dure tant que l'étape n'est pas finie
      freezeIndicatorUntil = now + 3000;
      enemies.forEach(e => e.frozenUntil = freezeIndicatorUntil);
      const reste = 3 - (stats.enemiesKilled - t.base.ennemis);
      if (enemies.length < reste) ennemiTuto(true);
    },
    terminer: () => {
      freezeIndicatorUntil = 0;
      enemies.forEach(e => e.frozenUntil = 0);
    },
    cible: () => ennemiLePlusProche(snake[0].x * gridSize + gridSize / 2, snake[0].y * gridSize + gridSize / 2)
  },
  {
    cle: 'pommeOr', titre: 'Pomme en or', total: 1,
    preparer: () => pommeMobileTuto(goldenApples, goldenAppleSpeed, goldenAppleRadius),
    texte: () => nomPomme('or') + ' : rattrape-la ! +100 points et +10 segments d\'un coup. ' +
      'Dans une vraie partie, c\'est un ennemi tué qui la laisse, rarement.',
    progres: t => stats.goldenApplesEaten - t.base.pommesOr,
    entretien: t => {
      if (!goldenApples.length && stats.goldenApplesEaten === t.base.pommesOr) {
        pommeMobileTuto(goldenApples, goldenAppleSpeed, goldenAppleRadius);
      }
    },
    cible: () => goldenApples[0]
  },
  {
    cle: 'coeur', titre: 'Cœur', total: 1,
    preparer: () => {
      if (!heartPickup) spawnHeartPickup();
    },
    texte: () => 'Ramasse le cœur : +1 vie. Tu peux aussi tirer dessus. Il apparaît après un certain nombre d\'ennemis tués.',
    progres: t => stats.heartsCollected - t.base.coeurs,
    entretien: t => {
      if (!heartPickup && stats.heartsCollected === t.base.coeurs) spawnHeartPickup();
    },
    cible: () => heartPickup
  },
  {
    cle: 'rollback', titre: 'Rollback', total: 1,
    preparer: () => {
      const cout = reglagesDifficulte().coutRollback;
      if (lives <= cout) {
        lives = cout + 1;
        updateHeartsDisplay();
        spawnPopup(snake[0].x * gridSize + gridSize / 2, snake[0].y * gridSize, 'Cœurs offerts ❤️', '#ff6b6b');
      }
    },
    texte: () => {
      const cout = reglagesDifficulte().coutRollback;
      return modeEntree === 'clavier'
        ? 'Clic droit : rollback ! Le serpent recule dans le temps (-' + cout + ' ❤️). Il se fait aussi tout seul si tu touches un mur. Essaie !'
        : 'Fonce dans un mur : avec plus de ' + cout + ' cœurs, le rollback te sauve en reculant dans le temps (-' + cout + ' ❤️).';
    },
    progres: t => joueurs[0].rollbackFin > t.debutEtape ? 1 : 0,
    entretien: () => {
      const cout = reglagesDifficulte().coutRollback;
      if (lives <= cout && !rollbackPlayback) {
        lives = cout + 1;
        updateHeartsDisplay();
      }
    }
  },
  {
    cle: 'boss', titre: 'Boss', total: pvBossTuto,
    preparer: t => {
      if (lives < maxLives) {
        lives = maxLives;
        updateHeartsDisplay();
      }
      pointsPourTirer(60);
      t.bossVu = false;
      announceBoss();
    },
    texte: () => 'Un boss arrive ! Il te poursuit sans relâche : tire-lui dessus ' + pvBossTuto +
      ' fois. Le bouclier et le sprint aident à l\'esquiver.',
    progres: t => {
      const boss = enemies.find(e => e.isBoss);
      if (boss) return boss.maxHp - boss.hp;
      return t.bossVu ? pvBossTuto : 0;
    },
    entretien: t => {
      pointsPourTirer(6);
      const boss = enemies.find(e => e.isBoss);
      if (boss && !t.bossVu) {
        t.bossVu = true;
        boss.hp = boss.maxHp = pvBossTuto;
      }
      if (!boss && !t.bossVu && !bossSpawnPending) announceBoss();
    },
    cible: () => enemies.find(e => e.isBoss) || bossSpawnPosition
  },
  {
    cle: 'fin', titre: 'Bravo !', total: 0,
    preparer: () => {
      enemies = [];
      pendingSpawnWarning = null;
      playVictorySound();
      launchFireworks();
    },
    texte: () => 'Tu connais l\'essentiel ! Tout est rappelé dans l\'aide (' +
      texteCommande('touche H', 'LT / L2', 'menu ☰, bouton Aide') + '). Une vraie partie va commencer…'
  }
];

function etapesTutoActives() {
  return etapesTuto.filter(e => !e.condition || e.condition());
}

function lancerTuto() {
  if (enLigne || enEcranInvite()) {
    spawnPopup(largeurPlateau / 2, hauteurPlateau / 2, 'Tutoriel : quitte d\'abord le jeu en ligne', '#ffd54f');
    return;
  }
  if (aideOuverte) fermerAide();
  if (menuBuffsOuvert) fermerMenuBuffs();
  const modeAvant = modeJeu;
  modeJeu = 'solo'; // le tutoriel se joue seul ; le mode choisi revient à la fin (voir finirTutoSiActif)
  majBoutonMode();
  init();
  const now = performance.now();
  tuto = {
    modeAvant,
    etapes: etapesTutoActives(),
    index: -1,
    etape: null,
    debutEtape: now,
    reussiA: 0,
    virages: 0,
    derniereDirection: {x: 1, y: 0},
    killsVus: 0,
    base: {}
  };
  // partie lente, sans ennemis au départ ; un petit compte à rebours avant de partir
  enemies = [];
  pendingSpawnWarning = null;
  baseTickInterval = tickIntervalDifficile / vitesseTuto;
  joueurs[0].tickInterval = baseTickInterval;
  waitingToStart = false;
  countdownActive = true;
  countdownStartTime = now;
  messageEl.textContent = '🎓 Tutoriel';
  demarrerEtapeTuto(0);
  majBoutonsAide();
}

function demarrerEtapeTuto(index) {
  const t = tuto;
  if (t.etape && t.etape.terminer) t.etape.terminer(t);
  t.index = index;
  t.etape = t.etapes[index];
  t.debutEtape = performance.now();
  t.reussiA = 0;
  t.killsVus = stats.enemiesKilled;
  t.base = {
    pommes: stats.applesEaten,
    ennemis: stats.enemiesKilled,
    pommesBleues: stats.blueApplesEaten,
    pommesOr: stats.goldenApplesEaten,
    coeurs: stats.heartsCollected
  };
  if (t.etape.preparer) t.etape.preparer(t);
}

// appelé par init() : une partie relancée (bouton Rejouer, difficulté...) arrête le tutoriel
// et remet le mode Solo / Coop choisi par le joueur
function finirTutoSiActif() {
  if (!tuto) return;
  const modeAvant = tuto.modeAvant;
  tuto = null;
  if (modeAvant !== modeJeu) {
    modeJeu = chargerModeJeu(); // le choix mémorisé (ou celui que le joueur vient de faire)
    majBoutonMode();
    initHighscores();
  }
  majBoutonsAide();
}

function quitterTuto(termine) {
  if (!tuto) return;
  if (termine) {
    try {
      localStorage.setItem(cleStockageTutoFait, 'oui');
    } catch (e) {
      // stockage indisponible : on reproposera simplement le tutoriel
    }
    debloquerSucces('bon_eleve');
  }
  init(); // retour à l'écran de départ, dans le mode du joueur
}

// le tutoriel ne se perd pas : sans vie ou contre un mur, le serpent repart d'un endroit sûr
function tutoSauverJoueur() {
  const j = joueurActif;
  const place = placeReanimation() || {cases: departJoueur(0).cases, direction: {x: 1, y: 0}};
  const now = performance.now();
  j.snake = place.cases.map(c => ({...c}));
  j.prevSnake = place.cases.map(c => ({...c}));
  j.direction = {...place.direction};
  j.nextDirection = {...place.direction};
  j.directionLockedThisTick = false;
  j.pendingGrowth = 0;
  j.snakeHistory = [];
  j.blessures = [];
  j.trailPoints = [];
  j.interpolatedPositionsCache = [];
  j.lives = Math.max(j.lives, maxLives);
  j.invulnerableUntil = now + 2000;
  j.lastTickTime = now;
  if (rollbackPlayback && rollbackPlayback.joueur === j) rollbackPlayback = null;
  tuto.derniereDirection = {...place.direction};
  const tete = centreCase(j.snake[0]);
  spawnPopup(tete.x, tete.y - 14, 'Oups ! On repart d\'ici', '#ffd54f');
  spawnParticles(tete.x, tete.y, couleurJoueur(j), 18);
  updateHeartsDisplay();
  majCompteurSegments();
}

// la pause décale aussi les minuteurs du tutoriel
function decalerTuto(duree) {
  if (!tuto) return;
  tuto.debutEtape += duree;
  if (tuto.reussiA) tuto.reussiA += duree;
}

// appelé à chaque image de partie (hors pause, compte à rebours et rollback)
function majTuto(now, dt) {
  const t = tuto;
  if (!t || gameOver) return;
  const etape = t.etape;

  // virages : chaque changement de direction réel du serpent
  if ((direction.x || direction.y) && (direction.x !== t.derniereDirection.x || direction.y !== t.derniereDirection.y)) {
    t.virages++;
    t.derniereDirection = {...direction};
  }

  if (etape.cle === 'fin') {
    if (now - t.debutEtape > dureeFinTuto) quitterTuto(true);
    return;
  }

  if (t.reussiA) {
    if (now - t.reussiA >= delaiEtapeReussie) demarrerEtapeTuto(t.index + 1);
    return;
  }
  if (etape.entretien) etape.entretien(t, now, dt);
  if (etape.progres(t) >= etape.total) {
    t.reussiA = now;
    const tete = centreCase(snake[0]);
    spawnPopup(tete.x, tete.y - 16, '✔ Bravo !', '#69f0ae');
    spawnParticles(tete.x, tete.y, '#69f0ae', 16);
    playHeartPickupSound();
  }
}

// panneau de consigne (en bas, ou en haut si le serpent est en bas) et repère sur la cible
function dessinerTuto() {
  const t = tuto;
  if (!t || gameOver) return;
  const etape = t.etape;
  const now = performance.now();
  const w = largeurPlateau;

  // repère sur la cible : anneau qui pulse et flèche qui rebondit au-dessus
  const cible = !t.reussiA && etape.cible ? etape.cible() : null;
  if (cible && !countdownActive) {
    const pulse = Math.sin(now / 160);
    ctx.save();
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.55 + pulse * 0.25;
    ctx.beginPath();
    ctx.arc(cible.x, cible.y, (cible.radius || 10) + 9 + pulse * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 16px ' + currentTheme.fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const haut = cible.y - (cible.radius || 10) - 12 - Math.abs(pulse) * 5;
    ctx.fillText('▼', cible.x, haut > 16 ? haut : cible.y + (cible.radius || 10) + 30);
    ctx.restore();
  }

  const numero = t.index + 1;
  const totalEtapes = t.etapes.length;
  const fait = Math.min(etape.total, etape.progres ? etape.progres(t) : 0);
  const titre = etape.cle === 'fin'
    ? '🎓 ' + etape.titre
    : '🎓 Étape ' + numero + ' / ' + totalEtapes + ' · ' + etape.titre + (etape.total > 1 ? '  (' + fait + ' / ' + etape.total + ')' : '');
  const texte = t.reussiA ? '✔ Réussi ! Étape suivante…' : etape.texte(t);
  const aide = modeEntree === 'clavier' ? 'Échap : pause  •  ' + nomTouche(touches.tuto) + ' : quitter le tutoriel'
    : modeEntree === 'manette' ? 'Start : pause  •  LT : aide et quitter' : 'Menu ☰ : quitter le tutoriel';

  ctx.save();
  ctx.font = '13px ' + currentTheme.fontFamily;
  const marge = 10;
  const lignes = couperTexte(texte, w - 16 - 2 * marge);
  const h = 22 + lignes.length * 17 + 18 + 2 * marge - 4;
  // en bas, sauf si le panneau y cache davantage : la tête du serpent compte plus que la cible de l'étape
  const tete = snake[0] && centreCase(snake[0]);
  const sous = (p, yPanneau) => p && p.y > yPanneau - 24 && p.y < yPanneau + h + 24 ? 1 : 0;
  const gene = yPanneau => 2 * sous(tete, yPanneau) + sous(cible, yPanneau);
  const y = gene(6) < gene(hauteurPlateau - h - 6) ? 6 : hauteurPlateau - h - 6;
  const couleur = t.reussiA || etape.cle === 'fin' ? '#69f0ae' : '#ffd54f';

  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = 'rgba(12, 14, 26, 0.9)';
  ctx.strokeStyle = couleur;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(8, y, w - 16, h, 8);
  else ctx.rect(8, y, w - 16, h);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();

  // barre de progression des étapes, en haut du panneau
  const avance = (t.index + (t.reussiA ? 1 : 0)) / totalEtapes;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(18, y + 4, w - 36, 3);
  ctx.fillStyle = couleur;
  ctx.fillRect(18, y + 4, (w - 36) * avance, 3);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = couleur;
  ctx.font = 'bold 14px ' + currentTheme.fontFamily;
  ctx.fillText(titre, 8 + marge, y + marge + 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = '13px ' + currentTheme.fontFamily;
  lignes.forEach((l, i) => ctx.fillText(l, 8 + marge, y + marge + 24 + i * 17));
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = '11px ' + currentTheme.fontFamily;
  ctx.fillText(aide, 8 + marge, y + h - marge - 10);
  ctx.restore();
}
