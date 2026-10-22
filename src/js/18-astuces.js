// ============================================================
// --- Astuces : bulles d'aide la première fois qu'une chose apparaît en partie ---
// ============================================================
// Chaque astuce ne s'affiche qu'une fois (mémorisé), sans mettre la partie en pause.
// Elles se coupent dans l'aide (💡 Astuces : non), et « Lancer le tutoriel » ne les montre pas.
const cleStockageAstucesVues = 'snakeAstucesVues';
const cleStockageAstuces = 'snakeAstuces';
const dureeAstuce = 5000; // ms d'affichage d'une bulle
const delaiEntreAstuces = 1500; // ms de calme entre deux bulles
let astucesVues = chargerAstucesVues();
let astucesActives = chargerAstucesActives();
let astuceEnCours = null; // {cle, texte, cible, debut, x, y}
let finDerniereAstuce = 0;

function chargerAstucesVues() {
  try {
    const liste = JSON.parse(localStorage.getItem(cleStockageAstucesVues) || '[]');
    if (Array.isArray(liste)) return liste;
  } catch (e) {
    // stockage indisponible ou corrompu : aucune astuce vue
  }
  return [];
}

function chargerAstucesActives() {
  try {
    return localStorage.getItem(cleStockageAstuces) !== 'non';
  } catch (e) {
    return true;
  }
}

function sauverAstuces() {
  try {
    localStorage.setItem(cleStockageAstucesVues, JSON.stringify(astucesVues));
    localStorage.setItem(cleStockageAstuces, astucesActives ? 'oui' : 'non');
  } catch (e) {
    // ignore : le choix vaut pour cette session seulement
  }
}

// rallumer les astuces les fait toutes revoir depuis le début
function basculerAstuces() {
  astucesActives = !astucesActives;
  if (astucesActives) astucesVues = [];
  astuceEnCours = null;
  sauverAstuces();
}

function centreCase(c) {
  return {x: c.x * gridSize + gridSize / 2, y: c.y * gridSize + gridSize / 2};
}

// liste des astuces : quand elles se déclenchent (renvoie la cible à montrer, ou null) et leur texte
const astuces = [
  {
    cle: 'tir',
    cible: () => enemies.find(e => !e.isBoss),
    texte: () => texteCommande('Vise avec la souris et clique pour tirer sur les ennemis.',
      'Vise au stick droit et tire avec RT.', 'Tiens le stick de la zone 🎯 pour viser, pousse-le à fond pour tirer.') +
      ' Un tir coûte 2 points.'
  },
  {
    cle: 'apparition',
    cible: () => pendingSpawnWarning,
    texte: () => 'Ce point clignotant : un ennemi va apparaître ici dans 1 seconde.'
  },
  {
    cle: 'resistant',
    cible: () => enemies.find(e => !e.isBoss && e.maxHp > 1),
    texte: () => 'Cet ennemi est résistant : il faut le toucher 2 fois.'
  },
  {
    cle: 'pommeOr',
    cible: () => goldenApples[0],
    texte: () => nomPomme('or') + ' ! Rattrape-la : +100 points et +10 segments.'
  },
  {
    cle: 'pommeBleue',
    cible: () => blueApples[0],
    texte: () => nomPomme('bleue') + ' : attrape-la pour un buff au hasard (gel, laser, invincibilité…).'
  },
  {
    cle: 'coeur',
    cible: () => heartPickup,
    texte: () => 'Un cœur : +1 vie' + (joueurs.some(j => j.elimine) ? ' (ou réanime ton coéquipier)' : '') +
      '. Marche dessus ou tire dessus.'
  },
  {
    cle: 'gel',
    cible: () => enemies.find(e => !e.isBoss && estGele(e)),
    texte: () => 'Ennemis gelés : ils sont inoffensifs. Fonce dedans avec la tête pour les briser !'
  },
  {
    cle: 'boss',
    cible: () => bossSpawnPending ? bossSpawnPosition : enemies.find(e => e.isBoss),
    texte: () => 'Un boss ! Il te poursuit sans relâche : il faut ' + pvBossPartie() + ' tirs pour le battre.'
  },
  {
    cle: 'blessure',
    cible: () => joueursEnJeu().some(j => j.lives < maxLives) ? centreCase(joueurActif.snake[0]) : null,
    texte: () => 'Aïe ! Un coup coûte 1 ❤️ et 1 segment.' +
      (bouclierDisponible() ? ' Le bouclier (' + texteCommande(nomToucheBouclierSolo(), 'B', 'bouton 🛡️') + ') protège 2 secondes.' : '')
  },
  {
    cle: 'rollback',
    cible: () => !enCoop() && lives > reglagesDifficulte().coutRollback ? centreCase(snake[0]) : null,
    texte: () => 'Tu as plus de ' + reglagesDifficulte().coutRollback + ' cœurs : un rollback te sauvera si tu touches un mur' +
      (modeEntree === 'clavier' ? ', ou clic droit pour reculer quand tu veux' : '') + ' (-' + reglagesDifficulte().coutRollback + ' ❤️).'
  },
  {
    cle: 'buffMenu',
    cible: () => joueurs.some(j => performance.now() < j.laserBuffUntil || performance.now() < j.autoAimBuffUntil ||
      performance.now() < j.buffInvincibleUntil || performance.now() < j.doublePointsUntil) ||
      performance.now() < freezeIndicatorUntil ? {x: largeurPlateau / 2, y: 8} : null,
    texte: () => 'Buff actif ! Son temps restant est affiché en haut. ' +
      texteCommande('Touche B', 'Y / Triangle', 'Menu ☰') + ' : choisir les buffs possibles.'
  }
];

// appelé à chaque image de partie : déclenche une astuce si besoin et suit sa cible
function majAstuces(now) {
  if (!astucesActives || tutoActif() || gameOver || waitingToStart || countdownActive || isPaused || hasWon) return;
  if (astuceEnCours) {
    if (now - astuceEnCours.debut > dureeAstuce) {
      astuceEnCours = null;
      finDerniereAstuce = now;
    } else {
      // la bulle suit sa cible tant qu'elle existe (pomme qui bouge, ennemi...)
      const c = astuceEnCours.cible();
      if (c) {
        astuceEnCours.x = c.x;
        astuceEnCours.y = c.y;
      }
    }
    return;
  }
  if (now - finDerniereAstuce < delaiEntreAstuces) return;
  for (const a of astuces) {
    if (astucesVues.includes(a.cle)) continue;
    const c = a.cible();
    if (!c) continue;
    astuceEnCours = {cle: a.cle, texte: a.texte(), cible: a.cible, debut: now, x: c.x, y: c.y};
    astucesVues.push(a.cle);
    sauverAstuces();
    return;
  }
}

// coupe un texte en lignes qui tiennent dans la largeur donnée
function couperTexte(texte, largeurMax) {
  const mots = texte.split(' ');
  const lignes = [];
  let ligne = '';
  mots.forEach(mot => {
    const essai = ligne ? ligne + ' ' + mot : mot;
    if (ctx.measureText(essai).width > largeurMax && ligne) {
      lignes.push(ligne);
      ligne = mot;
    } else {
      ligne = essai;
    }
  });
  if (ligne) lignes.push(ligne);
  return lignes;
}

// --- Bulle sur le côté de l'écran ---
// L'astuce n'est plus dessinée sur le plateau : elle glisse depuis le bord de l'écran, dans la place libre à côté
// du plateau (à droite sur ordinateur, sinon à gauche sous les infos ; en haut à gauche sur téléphone, par-dessus
// le score, loin du pad et du stick). Sur le plateau, seul un cercle qui pulse montre la chose dont elle parle.
const astuceCoteEl = document.getElementById('astuceCote');
const astuceTexteEl = document.getElementById('astuceTexte');
let astuceAffichee = null; // astuce montrée dans la bulle (null : bulle cachée)

function placerAstuceCote() {
  const el = astuceCoteEl;
  const plateau = canvas.getBoundingClientRect();
  const marge = 12;
  let gauche = false;
  let largeur;
  let haut;
  if (document.body.classList.contains('mode-tactile')) {
    gauche = true;
    largeur = innerHeight >= innerWidth ? Math.min(innerWidth - 70, 340) : Math.max(160, plateau.left - 8);
    haut = 4;
  } else {
    // place libre à droite : après le plateau et ses boutons (☰, ❓, ⚙️...)
    let bordDroit = plateau.right;
    document.querySelectorAll('#plateauConteneur > button').forEach(b => {
      if (b.offsetParent) bordDroit = Math.max(bordDroit, b.getBoundingClientRect().right);
    });
    const libreDroite = innerWidth - bordDroit - marge;
    const libreGauche = plateau.left - marge;
    if (libreDroite >= 170 || libreDroite >= libreGauche) {
      largeur = Math.min(280, Math.max(170, libreDroite));
      haut = plateau.top + plateau.height * 0.25;
    } else {
      // à gauche, sous les infos (score, cœurs...)
      gauche = true;
      largeur = Math.min(280, libreGauche);
      const hud = document.getElementById('hud').getBoundingClientRect();
      haut = Math.max(hud.bottom + 16, plateau.top + plateau.height * 0.25);
    }
  }
  el.classList.toggle('gauche', gauche);
  el.style.width = Math.round(largeur) + 'px';
  el.style.top = '0px';
  haut = Math.max(4, Math.min(innerHeight - el.offsetHeight - 4, haut));
  el.style.top = Math.round(haut) + 'px';
}

function afficherAstuceCote(a) {
  if (a === astuceAffichee) return;
  astuceAffichee = a;
  if (!a) {
    astuceCoteEl.classList.remove('visible');
    return;
  }
  astuceTexteEl.textContent = a.texte;
  // mode Performances (js/18-options.js) ou qualité basse : pas de glissement ni d'ombre
  astuceCoteEl.classList.toggle('sobre', niveauPerf >= 1 || optionQualite === 'basse');
  placerAstuceCote();
  astuceCoteEl.classList.add('visible');
}

window.addEventListener('resize', () => {
  if (astuceAffichee) placerAstuceCote();
});

// appelé à chaque image (même en pause) : montre ou cache la bulle, et dessine le repère sur le plateau
function dessinerAstuce() {
  const a = astuceEnCours;
  const visible = a && astucesActives && !gameOver && !hasWon && !isPaused && !waitingToStart && !tutoActif();
  afficherAstuceCote(visible ? a : null);
  if (!visible) return;
  const age = performance.now() - a.debut;
  const apparition = Math.min(1, age / 250, (dureeAstuce - age) / 400);
  if (apparition <= 0) return;
  // cercle qui pulse autour de la chose dont parle l'astuce
  const pulsation = Math.sin(performance.now() / 150);
  ctx.save();
  ctx.strokeStyle = '#ffd54f';
  ctx.lineWidth = 2;
  ctx.globalAlpha = apparition * (0.5 + pulsation * 0.3);
  ctx.beginPath();
  ctx.arc(a.x, a.y, 16 + pulsation * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
