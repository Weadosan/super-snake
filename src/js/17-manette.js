// ============================================================
// --- Manette (Gamepad API, disposition standard Xbox / PlayStation) ---
// ============================================================
// A/Croix : démarrer, rejouer, boost (maintenu) — B/Rond ou LB : bouclier
// RT/R2, RB ou X/Carré : tirer — stick droit : viser — stick gauche ou croix : se déplacer
// Start : pause — Select/Back ou Y/Triangle : Boutique — LT/L2 : aide (et tutoriel)
const MANETTE = {A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, SELECT: 8, START: 9, HAUT: 12, BAS: 13, GAUCHE: 14, DROITE: 15};
const zoneMorteStick = 0.5; // seuil pour qu'un stick compte comme une direction
const zoneMorteVisee = 0.3;
const distanceViseeManette = 110; // px entre la tourelle et le point visé au stick droit
const gamepadStatusEl = document.getElementById('gamepadStatus');
let boutonsManettePrecedents = []; // par manette : état des boutons à la frame précédente, pour détecter les appuis
let directionMenuManettePrecedente = 0;
let repetitionMenuManette = 0;

// certaines pages (aperçu intégré, iframe) interdisent l'accès à la manette :
// on désactive alors la manette au lieu de faire planter le jeu
let manetteDisponible = !!navigator.getGamepads;

function listerManettes() {
  if (!manetteDisponible) return [];
  try {
    return Array.from(navigator.getGamepads() || []).filter(Boolean);
  } catch (e) {
    manetteDisponible = false;
    return [];
  }
}

window.addEventListener('gamepadconnected', (e) => {
  gamepadStatusEl.textContent = '🎮 Manette connectée';
  definirModeEntree('manette');
});
window.addEventListener('gamepaddisconnected', () => {
  const restantes = listerManettes();
  if (!restantes.length) {
    gamepadStatusEl.textContent = '';
    boutonsManettePrecedents = [];
    if (modeEntree === 'manette') modeEntree = 'clavier';
  }
});

// solo : la 1re manette joue ; coop : J1 joue au clavier, la 1re manette joue J2
// (une 2e manette éventuelle joue J1)
function joueurDeLaManette(indexManette) {
  if (!enCoop()) return indexManette === 0 ? 0 : -1;
  if (indexManette === 0) return 1;
  if (indexManette === 1) return 0;
  return -1;
}

// coop sans manette : J2 se rabat sur les flèches du clavier partagé
function clavierPartage() {
  return enCoop() && listerManettes().length === 0;
}

function lireManette(now) {
  const pads = listerManettes();
  pads.forEach((pad, i) => {
    const numero = joueurDeLaManette(i);
    if (numero >= 0 && joueurs[numero]) lireUneManette(pad, numero, now);
  });
}

function lireUneManette(pad, numero, now) {
  const joueur = joueurs[numero];
  const precedents = boutonsManettePrecedents[numero] || [];
  const appuye = i => !!(pad.buttons[i] && (pad.buttons[i].pressed || pad.buttons[i].value > 0.5));
  const etat = pad.buttons.map((b, i) => appuye(i));
  const vientDAppuyer = i => etat[i] && !precedents[i];
  const vientDeRelacher = i => !etat[i] && precedents[i];
  const axe = i => pad.axes[i] || 0;

  const activite = etat.some(Boolean) || pad.axes.some(a => Math.abs(a) > zoneMorteStick);
  if (activite && modeEntree !== 'manette') {
    definirModeEntree('manette');
    if (menuBuffsOuvert) majFocusManette();
  }

  // direction demandée : croix en priorité, sinon axe dominant du stick gauche
  let dx = 0, dy = 0;
  if (etat[MANETTE.HAUT]) dy = -1;
  else if (etat[MANETTE.BAS]) dy = 1;
  else if (etat[MANETTE.GAUCHE]) dx = -1;
  else if (etat[MANETTE.DROITE]) dx = 1;
  else {
    const sx = axe(0), sy = axe(1);
    if (Math.max(Math.abs(sx), Math.abs(sy)) > zoneMorteStick) {
      if (Math.abs(sx) > Math.abs(sy)) dx = Math.sign(sx);
      else dy = Math.sign(sy);
    }
  }

  if (aideOuverte) {
    manetteDansAide(dx, dy, vientDAppuyer);
    boutonsManettePrecedents[numero] = etat;
    return;
  }

  if (optionsOuvertes) {
    manetteDansOptions(vientDAppuyer);
    boutonsManettePrecedents[numero] = etat;
    return;
  }

  if (succesOuvert) {
    manetteDansSucces(dy, vientDAppuyer);
    boutonsManettePrecedents[numero] = etat;
    return;
  }

  if (menuBuffsOuvert) {
    // navigation dans la boutique : croix ou stick (répétition si maintenu), A pour choisir / appuyer, B/Y/Select pour fermer
    const direction = dx * 10 + dy;
    if (direction !== 0) {
      if (direction !== directionMenuManettePrecedente || now >= repetitionMenuManette) {
        naviguerBoutique(dx, dy);
        repetitionMenuManette = now + (direction !== directionMenuManettePrecedente ? 400 : 150);
      }
    }
    directionMenuManettePrecedente = direction;
    if (vientDAppuyer(MANETTE.A)) validerBoutonBoutique();
    if (vientDAppuyer(MANETTE.B) || vientDAppuyer(MANETTE.Y) || vientDAppuyer(MANETTE.SELECT) || vientDAppuyer(MANETTE.START)) {
      fermerMenuBuffs();
    }
    boutonsManettePrecedents[numero] = etat;
    return;
  }
  directionMenuManettePrecedente = 0;

  if (vientDAppuyer(MANETTE.LT)) {
    ouvrirAide();
    boutonsManettePrecedents[numero] = etat;
    return;
  }
  if (vientDAppuyer(MANETTE.SELECT) || vientDAppuyer(MANETTE.Y)) {
    ouvrirMenuBuffs();
    boutonsManettePrecedents[numero] = etat;
    return;
  }
  if (vientDAppuyer(MANETTE.START)) togglePause();

  if (!isPaused) {
    if (dx !== 0 || dy !== 0) changerDirection(dx, dy, joueur);

    // visée au stick droit : on place le point visé autour de la tourelle
    const rx = axe(2), ry = axe(3);
    const tourelle = joueur.turretPixelPos;
    if (tourelle && Math.hypot(rx, ry) > zoneMorteVisee) {
      const angle = Math.atan2(ry, rx);
      joueur.viseeAuto = false; // le joueur vise lui-même
      joueur.viseeManuelleJusqua = performance.now() + dureeViseeManuelle;
      joueur.mouseX = Math.max(0, Math.min(largeurPlateau, tourelle.x + Math.cos(angle) * distanceViseeManette));
      joueur.mouseY = Math.max(0, Math.min(hauteurPlateau, tourelle.y + Math.sin(angle) * distanceViseeManette));
    }

    if (vientDAppuyer(MANETTE.A)) actionPrincipale(joueur);
    if (vientDAppuyer(MANETTE.B) || vientDAppuyer(MANETTE.LB)) activerBouclier(joueur);
    if (vientDAppuyer(MANETTE.RT) || vientDAppuyer(MANETTE.RB) || vientDAppuyer(MANETTE.X)) tenterTir(joueur);
  }
  if (vientDeRelacher(MANETTE.A)) arreterBoost(joueur);

  boutonsManettePrecedents[numero] = etat;
}

