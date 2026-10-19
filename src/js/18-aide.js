// ============================================================
// --- Écran d'aide : pages illustrées (commandes, pommes, ennemis, buffs, survie, modes) ---
// ============================================================
// Ouvert par le bouton ❓ (à côté de ☰), la touche H, LT / L2 à la manette, ou « ❓ Aide » du menu ☰.
// Il met la partie en pause comme le menu des buffs, et propose de lancer le tutoriel (js/18-tuto.js).
const aideMenuEl = document.createElement('div');
aideMenuEl.id = 'aideMenu';
aideMenuEl.setAttribute('role', 'dialog');
aideMenuEl.setAttribute('aria-modal', 'true');
aideMenuEl.innerHTML = `
  <div id="aidePanel">
    <h2>❓ Aide</h2>
    <div id="aideOnglets"></div>
    <div id="aideContenu"></div>
    <div id="aideNavigation">
      <button id="aidePrecedent" aria-label="Page précédente">◀</button>
      <span id="aidePageNumero"></span>
      <button id="aideSuivant" aria-label="Page suivante">▶</button>
    </div>
    <div id="aideActions">
      <button id="aideTuto">🎓 Lancer le tutoriel</button>
      <button id="aideAstuces">💡 Astuces : oui</button>
      <button id="aideFermer">Fermer</button>
    </div>
  </div>`;
document.body.appendChild(aideMenuEl);
const aideContenuEl = document.getElementById('aideContenu');
const aideOngletsEl = document.getElementById('aideOnglets');

let aideOuverte = false;
let aideAMisEnPause = false; // l'aide a mis la partie en pause : elle la relance en se fermant
let pageAide = 0;
let boucleAideActive = false;

// texte d'une commande selon l'appareil utilisé (clavier, manette ou tactile)
function texteCommande(clavier, manette, tactile) {
  return modeEntree === 'manette' ? manette : modeEntree === 'tactile' ? tactile : clavier;
}

// une ligne « icône + titre + explication »
function ligneAide(icone, titre, detail) {
  const li = document.createElement('div');
  li.className = 'aide-ligne';
  const ic = document.createElement('span');
  ic.className = 'aide-icone';
  if (typeof icone === 'string') ic.textContent = icone;
  else ic.appendChild(icone);
  const texte = document.createElement('span');
  texte.className = 'aide-texte';
  const b = document.createElement('b');
  b.textContent = titre;
  texte.appendChild(b);
  if (detail) {
    const small = document.createElement('small');
    small.textContent = detail;
    texte.appendChild(small);
  }
  li.appendChild(ic);
  li.appendChild(texte);
  return li;
}

function paragrapheAide(texte) {
  const p = document.createElement('p');
  p.className = 'aide-note';
  p.textContent = texte;
  return p;
}

const pagesAide = [
  {
    onglet: '🎮', titre: 'Commandes',
    remplir(zone) {
      const d = reglagesDifficulte();
      const lignes = modeEntree === 'manette'
        ? [
            ['🕹️', 'Stick gauche ou croix', 'se déplacer'],
            ['🎯', 'Stick droit', 'viser'],
            ['🔫', 'RT / R2, RB ou X', 'tirer'],
            ['🚀', 'A / Croix', capacitesActives.sprint ? 'démarrer, puis accélère (maintenir)' : 'démarrer'],
            capacitesActives.bouclier ? ['🛡️', 'B / Rond ou LB', 'bouclier 2s (recharge 15s)'] : null,
            ['🛒', 'Y / Triangle ou Select', 'boutique'],
            ['❓', 'LT / L2', 'cette aide'],
            ['⏸️', 'Start', 'pause']
          ]
        : modeEntree === 'tactile'
          ? [
              ['👆', 'Pad ou zone 👆', 'tourner (flèche ou glissé)'],
              ['🕹️', 'Zone 🎯 : stick', 'orienter la tourelle'],
              ['🔫', 'Stick à fond (ou toucher la zone)', 'tirer'],
              ['🚀', 'Bouton Boost', capacitesActives.sprint ? 'démarrer, puis accélère (maintenir)' : 'démarrer'],
              capacitesActives.bouclier ? ['🛡️', 'Bouton Bouclier', 'bouclier 2s (recharge 15s)'] : null,
              ['☰', 'Bouton Menu', 'buffs, options, aide, tutoriel']
            ]
          : [
              ['⬆️', nomTouchesDirection(true) + ' ou ' + nomTouchesDirection(false), 'se déplacer'],
              ['🚀', nomTouche(touches.boost), capacitesActives.sprint ? 'démarrer, puis accélère (maintenir)' : 'démarrer'],
              capacitesActives.bouclier ? ['🛡️', nomToucheBouclierSolo() === 'Maj' ? 'Maj (Shift)' : nomToucheBouclierSolo(), 'bouclier 2s (recharge 15s)'] : null,
              ['🖱️', 'Clic gauche', viseeAutoActive(joueurs[0]) ? 'tirer (visée auto)' : 'viser avec la souris et tirer'],
              ['⏪', 'Clic droit', 'rollback : le serpent recule (-' + d.coutRollback + ' ❤️)'],
              ['🛒', nomTouche(touches.buffs), 'boutique'],
              ['❓', nomTouche(touches.aide), 'cette aide  •  ' + nomTouche(touches.tuto) + ' sur l\'écran de départ : tutoriel'],
              ['🏆', nomTouche(touches.succes), 'tes succès'],
              ['⚙️', nomTouche(touches.options), 'options : volume, plein écran (' + nomTouche(touches.pleinEcran) + '), touches'],
              ['⏸️', nomTouche(touches.pause) + ' ou Échap', 'pause']
            ];
      lignes.filter(Boolean).forEach(([i, t, x]) => zone.appendChild(ligneAide(i, t, x)));
      if (enCoop()) {
        zone.appendChild(paragrapheAide(clavierPartage()
          ? 'Coop sans manette : J1 joue avec ' + nomTouchesDirection(false) + ', ' + nomTouche(touches.boost) + ', ' + nomTouche(touches.bouclier) +
            ' et la souris ; J2 avec ' + nomTouchesDirection(true) + ', ' + nomTouche(touches.boostJ2) + ', ' + nomTouche(touches.bouclierJ2) +
            ', ' + nomTouche(touches.tirJ2) + ' pour tirer, ' + nomTouche(touches.rollbackJ2) + ' pour le rollback. Tout se change dans ⚙️ Options.'
          : 'Coop : J1 joue au clavier et à la souris, la manette joue J2.'));
      }
    }
  },
  {
    onglet: '🍎', titre: 'Pommes et cœurs',
    remplir(zone) {
      const d = reglagesDifficulte();
      zone.appendChild(ligneAide(iconePomme('normale'), nomPomme('normale') + ' : +10 points, +1 segment',
        'Une est toujours sur la carte. Les ennemis tués en laissent parfois une en plus.'));
      zone.appendChild(ligneAide(iconePomme('or'), nomPomme('or') + ' : +100 points, +10 segments',
        'Rare, laissée par un ennemi tué. Elle bouge : il faut la rattraper.'));
      zone.appendChild(ligneAide(iconePomme('bleue'), nomPomme('bleue') + ' : un buff au hasard',
        'Rare, laissée par un ennemi tué (' + Math.round(d.chancePommeBleue * 100) + ' %). Elle bouge aussi. Voir la page des buffs.'));
      zone.appendChild(ligneAide('❤️', 'Cœur : +1 vie',
        'Apparaît tous les ' + d.killsCoeur[0] + ' à ' + d.killsCoeur[1] + ' ennemis tués (compteur en haut). Marche dessus ou tire dessus.' +
        (enCoop() ? ' En coop, il réanime d\'abord ton coéquipier KO.' : '')));
      zone.appendChild(paragrapheAide('Plus le serpent est long, plus les ennemis ralentissent. À ' + endgameSnakeLength +
        ' segments ils disparaissent et 5 pommes restent sur la carte ; à ' + winSnakeLength + ' segments, c\'est gagné !'));
    }
  },
  {
    onglet: '👾', titre: 'Ennemis et boss',
    remplir(zone) {
      const d = reglagesDifficulte();
      const c = document.createElement('canvas');
      c.id = 'aideCanvasEnnemis';
      c.width = 400;
      c.height = 110;
      zone.appendChild(c);
      zone.appendChild(ligneAide('🎯', 'Tire dessus : +15 points', 'Chaque tir coûte 2 points, et on ne peut pas tirer à 0 point.'));
      zone.appendChild(ligneAide('💢', 'S\'il te touche : -1 ❤️, -5 points, -1 segment',
        'Il meurt en te touchant. Tu as ensuite 1 seconde de répit.'));
      zone.appendChild(ligneAide('🔴', 'Point rouge clignotant', 'Un ennemi va apparaître à cet endroit dans 1 seconde.'));
      if (d.chanceResistant > 0) {
        zone.appendChild(ligneAide('💪', 'Ennemi résistant (couleur différente)',
          'Il faut le toucher 2 fois. ' + Math.round(d.chanceResistant * 100) + ' % des ennemis en ' + d.nom + '.'));
      }
      zone.appendChild(ligneAide('🧊', 'Ennemi gelé', 'Inoffensif : fonce dedans avec la tête pour le briser.'));
      zone.appendChild(ligneAide('👑', 'Boss : tous les ' + bossKillThreshold + ' ennemis tués',
        'Annoncé avant d\'arriver, il te poursuit sans relâche. Il faut ' + d.pvBoss + ' tirs. Butin : ' +
        nomPomme('or') + ', ' + nomPomme('bleue') + ' (points x2), 5 pommes et un cœur.'));
      zone.appendChild(ligneAide('🔴', 'Zone de contact', 'Seul le corps plein d\'un ennemi fait mal : pattes, tentacules ' +
        'et pinces translucides ne comptent pas. Sous le boss, le cercle rouge en pointillés montre exactement où il te touche.'));
    },
    anime: true
  },
  {
    onglet: '🧪', titre: 'Buffs',
    remplir(zone) {
      zone.appendChild(paragrapheAide('Chaque ' + nomPomme('bleue') + ' donne un de ces buffs. Au début, seul Points x2 est débloqué : ' +
        'les autres s\'achètent avec des Écailles dans la Boutique (' + texteCommande('touche ' + nomTouche(touches.buffs), 'Y / Triangle', 'menu ☰') +
        '), qui permet aussi de choisir ceux qui peuvent sortir.'));
      buffTypes.forEach(type => {
        const b = buffDescriptions[type];
        const etat = !contenuDebloque('buff', type) ? ' (à débloquer)' : !buffsActifs.includes(type) ? ' (désactivé)' : '';
        zone.appendChild(ligneAide(b.icon, b.nom + etat, texteAvecDureeBuff(b.detail, type)));
      });
      zone.appendChild(paragrapheAide('Les buffs en cours et leur temps restant s\'affichent en haut ; ils clignotent 3 secondes avant de finir.'));
    }
  },
  {
    onglet: '🛡️', titre: 'Survivre',
    remplir(zone) {
      const d = reglagesDifficulte();
      zone.appendChild(ligneAide('🧱', 'Les murs', 'Toucher un mur fait perdre la partie… sauf si un rollback te sauve.'));
      zone.appendChild(ligneAide('⏪', 'Rollback (-' + d.coutRollback + ' ❤️)',
        'Avec plus de ' + d.coutRollback + ' cœurs, le serpent recule dans le temps au lieu de mourir contre un mur. ' +
        (modeEntree === 'clavier' ? 'Clic droit pour le faire toi-même. ' : '') +
        'Plusieurs rollbacks de suite remontent de plus en plus loin.'));
      zone.appendChild(ligneAide('🐍', 'Se mordre la queue',
        'Le bout coupé est perdu (-10 points par segment) et tu perds 1 ❤️, mais la partie continue.'));
      if (capacitesActives.bouclier) {
        zone.appendChild(ligneAide('🛡️', 'Bouclier : 2 secondes sans dégât',
          'Les ennemis qui te touchent sont détruits. Il se recharge en 15 secondes (anneau autour de la tête).'));
      }
      if (capacitesActives.sprint) {
        zone.appendChild(ligneAide('🚀', 'Sprint', 'Le serpent va 25 % plus vite tant que tu maintiens le boost.'));
      }
      zone.appendChild(ligneAide('🔫', 'La tourelle', 'Elle est portée par le 2e segment et vise ' +
        texteCommande('la souris', 'le stick droit', 'le stick de la zone 🎯') + '.'));
    }
  },
  {
    onglet: '⚙️', titre: 'Modes de jeu',
    remplir(zone) {
      ordreDifficultes.forEach(cle => {
        const n = niveauxDifficulte[cle];
        const details = cle === 'facile'
          ? 'Plus lent, aucun ennemi résistant, boss à 6 PV, buffs 50 % plus longs, ' + nomPomme('bleue') +
            ' 2x plus fréquente, rollback à 2 cœurs, option Visée auto.'
          : cle === 'normal'
            ? 'Un peu plus lent que Difficile, 15 % d\'ennemis résistants.'
            : 'Le jeu d\'origine : plus rapide, 30 % d\'ennemis résistants.';
        zone.appendChild(ligneAide(n.icone, n.nom + (cle === difficulte ? ' (actuel)' : ''), details));
      });
      zone.appendChild(ligneAide('👥', 'Coop à 2', 'Score commun. Un joueur KO revient quand l\'autre ramasse un cœur. ' +
        'Option « Collision entre joueurs » dans les options.'));
      zone.appendChild(ligneAide('🌐', 'En ligne', 'Crée une partie et donne le code à ton ami : il joue le serpent J2 depuis son appareil.'));
      zone.appendChild(paragrapheAide('Difficulté, Solo / Coop, thèmes et skins se changent dans le menu ☰. Les meilleurs scores sont gardés par difficulté.'));
    }
  }
];

// petites scènes de démonstration de la page des ennemis : normal, résistant, gelé, boss
const ennemisAide = [
  {x: 50, y: 52, dur: false, gele: false, label: 'Normal'},
  {x: 150, y: 52, dur: true, gele: false, label: 'Résistant'},
  {x: 250, y: 52, dur: false, gele: true, label: 'Gelé'},
  {x: 345, y: 50, boss: true, label: 'Boss'}
].map((d, i) => ({
  ...d,
  cx: d.x, cy: d.y, vx: 0, vy: 0,
  radius: d.boss ? bossRadius : d.dur ? enemyRadius + 2 : enemyRadius,
  hp: d.dur ? 2 : 1, maxHp: d.dur ? 2 : 1,
  isBoss: !!d.boss,
  hitFlashUntil: 0,
  frozenUntil: 0,
  neA: 0,
  phase: i * 1.3
}));

function dessinerEnnemisAide() {
  const c = document.getElementById('aideCanvasEnnemis');
  if (!c) return;
  const now = performance.now();
  ennemisAide.forEach(e => {
    e.color = e.isBoss ? bossColor : e.dur ? currentTheme.enemyTough : currentTheme.enemyNormal;
    e.frozenUntil = e.gele ? now + 1000 : 0;
    if (!e.isBoss) e.hp = e.dur ? 2 : 1;
    if (!e.gele) {
      const x = e.cx + Math.cos(now / 700 + e.phase) * 5;
      const y = e.cy + Math.sin(now / 500 + e.phase) * 3;
      e.vx = x - e.x;
      e.vy = y - e.y;
      e.x = x;
      e.y = y;
    }
  });
  // même principe que l'aperçu du menu ☰ : on prête au jeu ce canvas et ces ennemis le temps d'une image
  const ctxJeu = ctx, ennemisJeu = enemies, pauseJeu = isPaused;
  ctx = c.getContext('2d');
  enemies = ennemisAide;
  isPaused = false;
  try {
    ctx.save();
    ctx.fillStyle = currentTheme.canvasBg;
    ctx.fillRect(0, 0, c.width, c.height);
    drawEnemies();
    ctx.fillStyle = currentTheme.textColor;
    ctx.font = '13px ' + currentTheme.fontFamily;
    ctx.textAlign = 'center';
    ennemisAide.forEach(e => ctx.fillText(e.label, e.cx, c.height - 8));
    ctx.restore();
  } finally {
    ctx = ctxJeu;
    enemies = ennemisJeu;
    isPaused = pauseJeu;
  }
}

function boucleAide() {
  if (!aideOuverte || !pagesAide[pageAide].anime) {
    boucleAideActive = false;
    return;
  }
  dessinerEnnemisAide();
  requestAnimationFrame(boucleAide);
}

function afficherPageAide(n) {
  pageAide = (n + pagesAide.length) % pagesAide.length;
  const page = pagesAide[pageAide];
  aideContenuEl.textContent = '';
  const h = document.createElement('h3');
  h.textContent = page.onglet + ' ' + page.titre;
  aideContenuEl.appendChild(h);
  page.remplir(aideContenuEl);
  succesPageAide(pageAide);
  aideContenuEl.scrollTop = 0;
  aideOngletsEl.querySelectorAll('button').forEach((b, i) => {
    b.classList.toggle('actif', i === pageAide);
    b.setAttribute('aria-selected', i === pageAide ? 'true' : 'false');
  });
  document.getElementById('aidePageNumero').textContent = (pageAide + 1) + ' / ' + pagesAide.length;
  if (page.anime && !boucleAideActive) {
    boucleAideActive = true;
    requestAnimationFrame(boucleAide);
  }
}

pagesAide.forEach((page, i) => {
  const b = document.createElement('button');
  b.textContent = page.onglet;
  b.title = page.titre;
  b.setAttribute('aria-label', page.titre);
  b.addEventListener('click', () => afficherPageAide(i));
  aideOngletsEl.appendChild(b);
});

function majBoutonsAide() {
  const enTuto = tutoActif();
  document.getElementById('aideTuto').textContent = enTuto ? '✖ Quitter le tutoriel' : '🎓 Lancer le tutoriel';
  document.getElementById('aideAstuces').textContent = '💡 Astuces : ' + (astucesActives ? 'oui' : 'non');
  document.getElementById('aideAstuces').classList.toggle('actif', astucesActives);
  const boutonTuto = document.getElementById('tutoBtn');
  if (boutonTuto) boutonTuto.textContent = enTuto ? '✖ Quitter le tuto' : '🎓 Tutoriel';
}

function ouvrirAide(page) {
  if (enEcranInvite()) return;
  if (menuBuffsOuvert) fermerMenuBuffs();
  if (typeof fermerMenuTactile === 'function') fermerMenuTactile();
  if (!aideOuverte) {
    aideOuverte = true;
    aideAMisEnPause = false;
    // pendant le compte à rebours, la pause n'existe pas encore : on revient à l'écran de départ
    if (countdownActive) {
      countdownActive = false;
      waitingToStart = true;
    }
    if (!isPaused && !waitingToStart && !gameOver) {
      togglePause();
      aideAMisEnPause = true;
    }
    joueurs.forEach(j => arreterBoost(j));
  }
  aideMenuEl.classList.add('ouvert');
  majBoutonsAide();
  afficherPageAide(page === undefined ? pageAide : page);
}

function fermerAide() {
  if (!aideOuverte) return;
  aideOuverte = false;
  aideMenuEl.classList.remove('ouvert');
  if (document.activeElement) document.activeElement.blur(); // évite qu'Espace ne réappuie sur un bouton
  if (aideAMisEnPause && isPaused) togglePause();
  aideAMisEnPause = false;
}

document.getElementById('aideFermer').addEventListener('click', fermerAide);
document.getElementById('aidePrecedent').addEventListener('click', () => afficherPageAide(pageAide - 1));
document.getElementById('aideSuivant').addEventListener('click', () => afficherPageAide(pageAide + 1));
document.getElementById('aideTuto').addEventListener('click', () => {
  if (tutoActif()) {
    fermerAide();
    quitterTuto(false);
  } else {
    fermerAide();
    lancerTuto();
  }
});
document.getElementById('aideAstuces').addEventListener('click', () => {
  basculerAstuces();
  majBoutonsAide();
});
// clic sur le fond sombre = fermer
aideMenuEl.addEventListener('click', (e) => {
  if (e.target === aideMenuEl) fermerAide();
});
document.getElementById('aideBtn').addEventListener('click', (e) => {
  e.currentTarget.blur();
  ouvrirAide();
});
document.getElementById('aideMenuBtn').addEventListener('click', () => ouvrirAide());
document.getElementById('tutoBtn').addEventListener('click', () => {
  if (typeof fermerMenuTactile === 'function') fermerMenuTactile();
  if (tutoActif()) quitterTuto(false);
  else lancerTuto();
});

// tant que l'aide est ouverte, le clavier la pilote : flèches pour changer de page, Échap ou H pour fermer
window.addEventListener('keydown', (e) => {
  if (!aideOuverte) return;
  e.stopImmediatePropagation();
  if (e.key === 'Escape' || e.code === touches.aide) {
    e.preventDefault();
    fermerAide();
  } else if (e.key === 'ArrowLeft' || e.code === 'KeyA') {
    e.preventDefault();
    afficherPageAide(pageAide - 1);
  } else if (e.key === 'ArrowRight' || e.code === 'KeyD') {
    e.preventDefault();
    afficherPageAide(pageAide + 1);
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    aideContenuEl.scrollTop += e.key === 'ArrowDown' ? 40 : -40;
  }
}, true);

// manette dans l'aide : gauche/droite = page, haut/bas = défiler, A = tutoriel, B / LT / Start = fermer
let directionAideManettePrecedente = 0;
function manetteDansAide(dx, dy, vientDAppuyer) {
  if (dx !== 0 && dx !== directionAideManettePrecedente) afficherPageAide(pageAide + dx);
  directionAideManettePrecedente = dx;
  if (dy !== 0) aideContenuEl.scrollTop += dy * 8;
  if (vientDAppuyer(MANETTE.A)) document.getElementById('aideTuto').click();
  else if (vientDAppuyer(MANETTE.B) || vientDAppuyer(MANETTE.LT) || vientDAppuyer(MANETTE.START)) fermerAide();
}
