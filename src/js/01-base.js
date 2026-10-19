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

