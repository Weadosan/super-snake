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
    texte: () => 'Un boss ! Il te poursuit sans relâche : il faut ' + reglagesDifficulte().pvBoss + ' tirs pour le battre.'
  },
  {
    cle: 'blessure',
    cible: () => joueursEnJeu().some(j => j.lives < maxLives) ? centreCase(joueurActif.snake[0]) : null,
    texte: () => 'Aïe ! Un coup coûte 1 ❤️ et 1 segment.' +
      (capacitesActives.bouclier ? ' Le bouclier (' + texteCommande(nomToucheBouclierSolo(), 'B', 'bouton 🛡️') + ') protège 2 secondes.' : '')
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

// bulle arrondie avec une pointe vers (cibleX, cibleY) ; options : titre, couleur, largeur, apparition (0 à 1)
function dessinerBulle(texte, cibleX, cibleY, options = {}) {
  const largeur = options.largeur || 230;
  const couleur = options.couleur || '#ffd54f';
  const marge = 10;
  ctx.save();
  ctx.font = '13px ' + currentTheme.fontFamily;
  const lignes = couperTexte(texte, largeur - 2 * marge);
  const hauteurLigne = 17;
  const hauteurTitre = options.titre ? 20 : 0;
  const h = lignes.length * hauteurLigne + hauteurTitre + 2 * marge - 2;
  const w = largeur;

  // au-dessus de la cible s'il y a la place, sinon en dessous ; toujours dans le plateau
  const distance = 26;
  let enHaut = cibleY - distance - h > 4;
  if (options.position === 'bas') enHaut = false;
  let x = Math.max(4, Math.min(largeurPlateau - w - 4, cibleX - w / 2));
  let y = enHaut ? cibleY - distance - h : cibleY + distance;
  y = Math.max(4, Math.min(hauteurPlateau - h - 4, y));

  const apparition = options.apparition === undefined ? 1 : options.apparition;
  ctx.globalAlpha = apparition;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = 'rgba(12, 14, 26, 0.92)';
  ctx.strokeStyle = couleur;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 8);
  else ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();

  // pointe vers la cible (si la cible n'est pas sous la bulle)
  if (options.pointe !== false && (cibleY < y - 4 || cibleY > y + h + 4)) {
    const px = Math.max(x + 14, Math.min(x + w - 14, cibleX));
    const bord = cibleY < y ? y : y + h;
    const sens = cibleY < y ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(px - 7, bord);
    ctx.lineTo(px + 7, bord);
    ctx.lineTo(px + (cibleX - px) * 0.3, bord + sens * 11);
    ctx.closePath();
    ctx.fillStyle = 'rgba(12, 14, 26, 0.92)';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px - 7, bord + sens);
    ctx.lineTo(px + (cibleX - px) * 0.3, bord + sens * 11);
    ctx.lineTo(px + 7, bord + sens);
    ctx.stroke();
    // petit cercle qui pulse autour de la cible
    ctx.globalAlpha = apparition * (0.5 + Math.sin(performance.now() / 150) * 0.3);
    ctx.beginPath();
    ctx.arc(cibleX, cibleY, 16 + Math.sin(performance.now() / 150) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = apparition;
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  let ty = y + marge;
  if (options.titre) {
    ctx.fillStyle = couleur;
    ctx.font = 'bold 14px ' + currentTheme.fontFamily;
    ctx.fillText(options.titre, x + marge, ty);
    ty += hauteurTitre;
    ctx.font = '13px ' + currentTheme.fontFamily;
  }
  ctx.fillStyle = '#ffffff';
  lignes.forEach(l => {
    ctx.fillText(l, x + marge, ty);
    ty += hauteurLigne;
  });
  ctx.restore();
  return {x, y, w, h};
}

function dessinerAstuce() {
  const a = astuceEnCours;
  if (!a || gameOver) return;
  const age = performance.now() - a.debut;
  const apparition = Math.min(1, age / 250, (dureeAstuce - age) / 400);
  if (apparition <= 0) return;
  dessinerBulle(a.texte, a.x, a.y, {titre: '💡 Astuce', apparition});
}
