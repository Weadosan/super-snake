const canvas = document.getElementById('game');
let ctx = canvas.getContext('2d'); // let : l'aperçu du menu dessine un instant sur son propre canvas (js/18-apercu.js)
const scoreEl = document.getElementById('score');
const heartsEl = document.getElementById('hearts');
const segmentCounterEl = document.getElementById('segmentCounter');
const killProgressEl = document.getElementById('killProgress');
const shieldStatusEl = document.getElementById('shieldStatus');
const buffStatusEl = document.getElementById('buffStatus');
const messageEl = document.getElementById('message');
const restartBtn = document.getElementById('restart');
const pauseBtn = document.getElementById('pauseBtn');
const muteBtn = document.getElementById('muteBtn');
const statsPanelEl = document.getElementById('statsPanel');
const highscoreListEl = document.getElementById('highscoreList');

const gridSize = 20;

// réglages du menu ⚙️ Options (js/18-options.js), gardés ensemble dans le navigateur
const cleStockageOptions = 'snakeOptions';
let optionsSauvees = {};
try {
  optionsSauvees = JSON.parse(localStorage.getItem(cleStockageOptions)) || {};
} catch (e) {
  // stockage indisponible : réglages par défaut
}
function lireOption(nom, defaut) {
  return optionsSauvees[nom] !== undefined ? optionsSauvees[nom] : defaut;
}
function ecrireOption(nom, valeur) {
  optionsSauvees[nom] = valeur;
  try {
    localStorage.setItem(cleStockageOptions, JSON.stringify(optionsSauvees));
  } catch (e) {
    // stockage indisponible : le réglage vaut pour cette session seulement
  }
}

// taille logique du plateau (coordonnées du jeu), toujours 400 x 400 ; l'image réelle du canvas est
// echelleRendu fois plus grande pour rester nette sur grand écran (js/18-options.js)
const largeurPlateau = canvas.width, hauteurPlateau = canvas.height;
let echelleRendu = 1;
// finesse des images gardées en mémoire (sprites, fond) : l'échelle du rendu arrondie au demi supérieur
function echelleCaches() {
  return Math.max(1, Math.ceil(echelleRendu * 2) / 2);
}

// image en mémoire (lw x lh dans les coordonnées du plateau) aussi fine que l'écran : sans rotation ni
// zoom, elle est recopiée pixel pour pixel, calée sur les pixels réels, au lieu d'être ré-échantillonnée
// (un fond plein écran étiré coûtait plusieurs millisecondes par image sur un PC sans carte graphique)
function creerCalque(lw, lh) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(lw * echelleRendu));
  c.height = Math.max(1, Math.round(lh * echelleRendu));
  c.lw = lw;
  c.lh = lh;
  c.echelle = echelleRendu;
  const cctx = c.getContext('2d');
  cctx.scale(c.width / lw, c.height / lh);
  return c;
}

function poserCalque(img, x, y) {
  const lw = img.lw || img.width, lh = img.lh || img.height;
  const m = ctx.getTransform();
  if (m.b === 0 && m.c === 0 && Math.abs(m.a * lw - img.width) < 1 && Math.abs(m.d * lh - img.height) < 1) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(img, Math.round(m.e + x * m.a), Math.round(m.f + y * m.d));
    ctx.setTransform(m);
  } else {
    ctx.drawImage(img, x, y, lw, lh);
  }
}

