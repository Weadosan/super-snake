// ============================================================
// --- Commandes : actions communes (clavier, souris, manette, tactile) ---
// ============================================================

// dernier type de commande utilisé, pour adapter les textes à l'écran
// (préférence d'affichage, pas un état de partie : volontairement non remis à zéro dans init())
let modeEntree = 'clavier'; // 'clavier' | 'manette' | 'tactile'

function definirModeEntree(mode) {
  modeEntree = mode;
  if (mode === 'tactile' && !document.body.classList.contains('mode-tactile')) {
    document.body.classList.add('mode-tactile');
    appliquerDisposition(); // écran de jeu tactile : chaque élément à sa place (js/18-disposition.js)
  }
}

// --- Touches du clavier, modifiables dans ⚙️ Options (js/18-options.js) ---
// e.code = position physique de la touche : KeyW/KeyA/KeyS/KeyD correspondent
// à ZQSD sur un clavier AZERTY et à WASD sur un clavier QWERTY.
// En solo, les touches de J1 et celles de J2 (flèches, Maj droite) font bouger le même serpent.
const touchesParDefaut = {
  haut: 'KeyW', bas: 'KeyS', gauche: 'KeyA', droite: 'KeyD', boost: 'Space', bouclier: 'ShiftLeft',
  hautJ2: 'ArrowUp', basJ2: 'ArrowDown', gaucheJ2: 'ArrowLeft', droiteJ2: 'ArrowRight',
  boostJ2: 'ControlRight', bouclierJ2: 'ShiftRight', tirJ2: 'Enter', rollbackJ2: 'Backspace',
  pause: 'KeyP', buffs: 'KeyB', aide: 'KeyH', succes: 'KeyU', tuto: 'KeyT', options: 'KeyO', pleinEcran: 'KeyF',
  malediction: 'KeyM'
};
let touches = {...touchesParDefaut};
(function chargerTouches() {
  const sauvees = lireOption('touches', {});
  for (const action in sauvees) {
    if (action in touchesParDefaut && typeof sauvees[action] === 'string') touches[action] = sauvees[action];
  }
})();

// carte du clavier réel (Chrome, Edge) : « Z » au lieu de « W » sur un clavier AZERTY
let carteClavier = null;
if (navigator.keyboard && navigator.keyboard.getLayoutMap) {
  navigator.keyboard.getLayoutMap().then(carte => { carteClavier = carte; }).catch(() => {});
}

const nomsTouchesSpeciales = {
  Space: 'Espace', ShiftLeft: 'Maj gauche', ShiftRight: 'Maj droite', ControlLeft: 'Ctrl gauche',
  ControlRight: 'Ctrl droit', AltLeft: 'Alt', AltRight: 'Alt Gr', Enter: 'Entrée', NumpadEnter: 'Entrée (pavé)',
  Backspace: 'Retour arr.', Tab: 'Tab', CapsLock: 'Verr. maj', Escape: 'Échap', Delete: 'Suppr', Insert: 'Inser',
  Home: 'Début', End: 'Fin', PageUp: 'Page ↑', PageDown: 'Page ↓',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→'
};

// nom lisible d'une touche (e.code)
function nomTouche(code) {
  if (!code) return '—';
  if (nomsTouchesSpeciales[code]) return nomsTouchesSpeciales[code];
  if (carteClavier && carteClavier.get(code)) return carteClavier.get(code).toUpperCase();
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit\d$/.test(code)) return code.slice(5);
  if (/^Numpad/.test(code)) return 'Pavé ' + code.slice(6);
  return code;
}

// « ZQSD / WASD » tant que les touches de déplacement sont celles d'origine et le clavier inconnu
function nomTouchesDirection(j2) {
  const s = j2 ? 'J2' : '';
  const codes = [touches['haut' + s], touches['gauche' + s], touches['bas' + s], touches['droite' + s]];
  if (j2 && codes.join() === 'ArrowUp,ArrowLeft,ArrowDown,ArrowRight') return 'Flèches';
  if (!j2 && codes.join() === 'KeyW,KeyA,KeyS,KeyD' && !carteClavier) return 'ZQSD / WASD';
  return codes.map(nomTouche).join(' ');
}

// bouclier en solo : les deux touches marchent, « Maj » si ce sont encore les deux Maj
function nomToucheBouclierSolo() {
  if (touches.bouclier === 'ShiftLeft' && touches.bouclierJ2 === 'ShiftRight') return 'Maj';
  return nomTouche(touches.bouclier);
}

function directionDeTouche(code, j2) {
  const s = j2 ? 'J2' : '';
  if (code === touches['haut' + s]) return [0, -1];
  if (code === touches['bas' + s]) return [0, 1];
  if (code === touches['gauche' + s]) return [-1, 0];
  if (code === touches['droite' + s]) return [1, 0];
  return null;
}

// Chaque action vise un joueur (joueur 1 par défaut : souris, tactile, solo).
// Si ce n'est pas le joueur actif, l'action se rappelle elle-même avec ce joueur comme joueur actif.

// Espace / bouton A / bouton Boost : démarrer, rejouer, ou accélérer (maintenu)
function actionPrincipale(j = joueurs[0]) {
  if (isPaused || menuBuffsOuvert || aideOuverte || succesOuvert || optionsOuvertes) return;
  if (gameOver) {
    if (ecranGameOver && performance.now() - ecranGameOver.debut < 700) return;
    init();
    return;
  }
  if (waitingToStart) {
    waitingToStart = false;
    countdownActive = true;
    countdownStartTime = performance.now();
    return;
  }
  if (countdownActive || j.elimine) return;
  if (j !== joueurActif) return avecJoueur(j, () => actionPrincipale(j));
  if (!sprintDisponible()) return; // sprint désactivé dans la Boutique ou par une malédiction
  if (!boosting) {
    boosting = true;
    tickInterval = baseTickInterval * boostFactor;
    playBoostSound();
  }
}

function arreterBoost(j = joueurs[0]) {
  if (j !== joueurActif) return avecJoueur(j, () => arreterBoost(j));
  if (!boosting) return;
  boosting = false;
  tickInterval = baseTickInterval;
}

function activerBouclier(j = joueurs[0]) {
  if (j !== joueurActif) return avecJoueur(j, () => activerBouclier(j));
  if (isPaused || menuBuffsOuvert || waitingToStart || countdownActive || gameOver || j.elimine) return;
  if (!bouclierDisponible()) return; // bouclier désactivé dans la Boutique ou par une malédiction
  const now = performance.now();
  if (now >= shieldReadyAt) {
    shieldActiveUntil = now + shieldDuration;
    shieldReadyAt = now + dureeRechargeBouclier();
    playShieldSound();
  }
}

// dx/dy : -1, 0 ou 1 ; mêmes règles que le clavier (pas de demi-tour, un seul virage par tick)
function changerDirection(dx, dy, j = joueurs[0]) {
  if (j !== joueurActif) return avecJoueur(j, () => changerDirection(dx, dy, j));
  if (isPaused || menuBuffsOuvert || j.elimine) return;
  if (waitingToStart || countdownActive) return; // pas de changement de direction avant le début de la partie
  if (directionLockedThisTick) return; // un seul virage accepté entre deux déplacements
  // sens de référence : le déplacement en cours, sinon (juste après le départ, avant le 1er pas)
  // le sens déjà choisi ou l'orientation du corps ; on ne peut jamais repartir vers sa propre queue
  let sens = direction;
  if (sens.x === 0 && sens.y === 0) sens = nextDirection;
  if (sens.x === 0 && sens.y === 0 && snake.length > 1) {
    sens = {x: Math.sign(snake[0].x - snake[1].x), y: Math.sign(snake[0].y - snake[1].y)};
  }
  if (dy !== 0 && sens.y === 0) {
    nextDirection = {x: 0, y: dy};
    directionLockedThisTick = true;
  } else if (dx !== 0 && sens.x === 0) {
    nextDirection = {x: dx, y: 0};
    directionLockedThisTick = true;
  }
}

// clic droit : rembobine le serpent d'une seconde (mêmes règles que le rollback automatique : coûte reglagesDifficulte().coutRollback cœurs, il doit en rester au moins 1)
function rollbackManuel(j = joueurs[0]) {
  if (j !== joueurActif) return avecJoueur(j, () => rollbackManuel(j));
  if (gameOver || countdownActive || waitingToStart || isPaused || menuBuffsOuvert || j.elimine) return;
  if (rollbackPlayback) return; // un rollback est déjà en cours
  if (direction.x === 0 && direction.y === 0) return; // le serpent n'a pas encore bougé
  if (!tryRollback()) {
    const tete = snake[0];
    spawnPopup(tete.x * gridSize + gridSize / 2, tete.y * gridSize + gridSize / 2,
      lives <= reglagesDifficulte().coutRollback ? 'Rollback : il faut ' + (reglagesDifficulte().coutRollback + 1) + ' ❤️' : 'Rollback impossible', '#b0bec5');
  }
}

function tenterTir(j = joueurs[0]) {
  if (j !== joueurActif) return avecJoueur(j, () => tenterTir(j));
  if (gameOver || countdownActive || waitingToStart || isPaused || menuBuffsOuvert || j.elimine) return;
  if (!turretPixelPos) return; // pas de tourelle : serpent trop court
  if (direction.x === 0 && direction.y === 0) return; // pas de tir tant que le serpent n'a pas bougé
  if (score <= 0) return; // pas assez de points pour tirer
  // visée automatique (joueur 2 au clavier) : on anticipe le mouvement de l'ennemi visé
  // option Visée auto (Facile) : le viseur accroche l'ennemi proche du curseur
  const cible = j.viseeAuto ? ennemiLePlusProche(turretPixelPos.x, turretPixelPos.y)
    : optionViseeAutoActive() ? ennemiAimante() : null;
  fireProjectile(cible ? angleVersEnnemi(cible) : undefined);
}

// convertit une position écran (souris ou doigt) en coordonnées du canvas
function positionDansCanvas(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  // sans la bordure : clientLeft / clientWidth ne comptent que l'intérieur du plateau
  return {
    x: (clientX - rect.left - canvas.clientLeft) * (largeurPlateau / (canvas.clientWidth || rect.width)),
    y: (clientY - rect.top - canvas.clientTop) * (hauteurPlateau / (canvas.clientHeight || rect.height))
  };
}

// --- Souris ---
canvas.addEventListener('mousemove', (e) => {
  const pos = positionDansCanvas(e.clientX, e.clientY);
  mouseX = pos.x;
  mouseY = pos.y;
  viseeManuelleJusqua = performance.now() + dureeViseeManuelle; // on vise soi-même : la visée auto attend
  if (modeEntree === 'manette') modeEntree = 'clavier';
});

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 2) {
    rollbackManuel(); // clic droit : rollback volontaire
    return;
  }
  if (e.button !== 0) return;
  tenterTir();
});

// --- Clavier ---
document.addEventListener('keydown', (e) => {
  const key = e.key;
  if (modeEntree !== 'clavier') modeEntree = 'clavier';

  if (menuBuffsOuvert) {
    // le menu garde la main : Échap ou B le ferme, flèches / Tab / Entrée / Espace naviguent dans ses boutons
    if (key === 'Escape' || e.code === touches.buffs) {
      e.preventDefault();
      fermerMenuBuffs();
    } else if (key.startsWith('Arrow')) {
      e.preventDefault();
      naviguerBoutique(key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : 0, key === 'ArrowUp' ? -1 : key === 'ArrowDown' ? 1 : 0);
    }
    return;
  }

  if (e.code === touches.buffs) {
    ouvrirMenuBuffs();
    return;
  }

  if (e.code === touches.aide) {
    ouvrirAide();
    return;
  }

  if (e.code === touches.malediction) {
    ouvrirMalediction();
    return;
  }

  if (e.code === touches.succes) {
    ouvrirSucces();
    return;
  }

  if (e.code === touches.options) {
    ouvrirOptions();
    return;
  }

  if (e.code === touches.pleinEcran) {
    if (!e.repeat) basculerPleinEcran();
    return;
  }

  // T : lance le tutoriel depuis l'écran de départ ou de fin, ou le quitte
  if (e.code === touches.tuto) {
    if (tutoActif()) quitterTuto(false);
    else if (waitingToStart || gameOver) lancerTuto();
    return;
  }

  if (e.code === touches.pause || key === 'Escape') {
    togglePause();
    return;
  }

  if (isPaused) return; // aucune autre touche n'agit pendant la pause

  // coop : avec une manette, J2 la prend et J1 garde tout le clavier comme en solo
  if (clavierPartage()) {
    toucheCoop(e);
    return;
  }

  const code = e.code;
  if (code === touches.bouclier || code === touches.bouclierJ2) {
    if (e.repeat) return;
    activerBouclier();
    return;
  }

  if (code === touches.boost) {
    e.preventDefault(); // évite que la page défile
    actionPrincipale();
    return;
  }

  const dir = directionDeTouche(code, false) || directionDeTouche(code, true);
  if (dir) {
    e.preventDefault(); // les flèches ne font pas défiler la page
    changerDirection(...dir);
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === touches.boost) {
    arreterBoost();
  }
  if (clavierPartage() && (e.code === touches.boostJ2 || e.code === 'Numpad0')) {
    arreterBoost(joueurs[1]);
  }
});

// touches du mode coop sans manette : J1 à gauche du clavier (ZQSD / WASD, Espace, Maj gauche) + souris,
// J2 autour des flèches (Ctrl droit ou 0 du pavé : boost, Maj droite : bouclier, Entrée : tir) ; modifiables dans ⚙️ Options
function toucheCoop(e) {
  const code = e.code;
  const [j1, j2] = joueurs;
  const dirJ1 = directionDeTouche(code, false), dirJ2 = directionDeTouche(code, true);

  if (dirJ1) {
    e.preventDefault();
    changerDirection(...dirJ1, j1);
  } else if (dirJ2) {
    e.preventDefault(); // les flèches ne font pas défiler la page
    changerDirection(...dirJ2, j2);
  } else if (code === touches.boost) {
    e.preventDefault();
    if (!e.repeat) actionPrincipale(j1);
  } else if (code === touches.boostJ2 || code === 'Numpad0') {
    e.preventDefault();
    if (!e.repeat) actionPrincipale(j2);
  } else if (code === touches.bouclier) {
    if (!e.repeat) activerBouclier(j1);
  } else if (code === touches.bouclierJ2) {
    if (!e.repeat) activerBouclier(j2);
  } else if (code === touches.tirJ2 || code === 'NumpadEnter') {
    e.preventDefault();
    if (waitingToStart || gameOver) actionPrincipale(j2);
    else tenterTir(j2);
  } else if (code === touches.rollbackJ2) {
    e.preventDefault();
    rollbackManuel(j2);
  }
}

