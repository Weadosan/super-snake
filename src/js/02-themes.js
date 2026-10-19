// --- Thèmes graphiques ---
const themes = {
  neon: {
    pageBg: '#0a0e1a',
    canvasBg: '#05070f',
    canvasBorder: '#39ff14',
    textColor: '#e0fff0',
    textMuted: '#66d9c4',
    accent: '#39ff14',
    accentHover: '#2fd60f',
    fontFamily: "'Share Tech Mono', Consolas, monospace", // néon : police d'écran rétro
    snakeBody: '#39ff14',
    snakeHead: '#7dffb0',
    snakeBody2: '#ffe600', // serpent du joueur 2 (mode coop)
    snakeHead2: '#fff59d',
    food: '#00ff9d',
    enemyNormal: '#ff2079',
    enemyTough: '#b026ff',
    enemyStroke: '#ffffff',
    projectile: '#00f0ff',
    turretBody: '#ff1744',
    turretBase: '#4a0e18',
    turretBaseStroke: '#ff5c7a',
    laserColor: 'rgba(0, 240, 255, 0.6)',
    glow: true
  },
  espace: {
    pageBg: '#070a1c',
    canvasBg: '#04061a',
    canvasBorder: '#7c4dff',
    textColor: '#e8eaff',
    textMuted: '#9fa8da',
    accent: '#7c4dff',
    accentHover: '#651fff',
    fontFamily: "'Exo 2', 'Trebuchet MS', sans-serif", // espace : police ronde et futuriste
    snakeBody: '#40c4ff',
    snakeHead: '#b3e5fc',
    snakeBody2: '#ffab40', // serpent du joueur 2 (mode coop)
    snakeHead2: '#ffe0b2',
    food: '#69f0ae',
    enemyNormal: '#ff4081',
    enemyTough: '#ea80fc',
    enemyStroke: '#ffffff',
    projectile: '#ffff8d',
    turretBody: '#40c4ff',
    turretBase: '#1a237e',
    turretBaseStroke: '#82b1ff',
    laserColor: 'rgba(255, 255, 141, 0.6)',
    glow: true
  },
  lave: {
    pageBg: '#1a0705',
    canvasBg: '#120403',
    canvasBorder: '#ff6d00',
    textColor: '#ffe0b2',
    textMuted: '#ffab91',
    accent: '#ff6d00',
    accentHover: '#e65100',
    fontFamily: "Oswald, 'Arial Narrow', sans-serif", // lave : police industrielle, solide mais lisible
    snakeBody: '#ffb300',
    snakeHead: '#ffe082',
    snakeBody2: '#18ffff', // serpent du joueur 2 (mode coop)
    snakeHead2: '#b2ffff',
    food: '#76ff03',
    enemyNormal: '#ff1744',
    enemyTough: '#d500f9',
    enemyStroke: '#ffd180',
    projectile: '#ffea00',
    turretBody: '#ff3d00',
    turretBase: '#3e0d00',
    turretBaseStroke: '#ff9e80',
    laserColor: 'rgba(255, 234, 0, 0.6)',
    glow: true
  },
  ocean: {
    pageBg: '#03121d',
    canvasBg: '#021826',
    canvasBorder: '#00e5ff',
    textColor: '#e0f7fa',
    textMuted: '#80deea',
    accent: '#00e5ff',
    accentHover: '#00b8d4',
    fontFamily: "Alegreya, Georgia, serif", // océan : police de carte au trésor
    snakeBody: '#1de9b6',
    snakeHead: '#a7ffeb',
    snakeBody2: '#ffd740', // serpent du joueur 2 (mode coop)
    snakeHead2: '#ffecb3',
    food: '#c6ff00',
    enemyNormal: '#ff6e40',
    enemyTough: '#e040fb',
    enemyStroke: '#ffffff',
    projectile: '#ffffff',
    turretBody: '#00bfa5',
    turretBase: '#004d40',
    turretBaseStroke: '#64ffda',
    laserColor: 'rgba(0, 229, 255, 0.6)',
    glow: true
  },
  aurore: {
    pageBg: '#040b1a',
    canvasBg: '#06142e',
    canvasBorder: '#80d8ff',
    textColor: '#e1f5fe',
    textMuted: '#90caf9',
    accent: '#80d8ff',
    accentHover: '#4fc3f7',
    fontFamily: "Comfortaa, 'Trebuchet MS', sans-serif", // aurore : police ronde et douce, comme la neige
    snakeBody: '#80d8ff',
    snakeHead: '#e1f5fe',
    snakeBody2: '#ffd54f', // serpent du joueur 2 (mode coop)
    snakeHead2: '#fff8e1',
    food: '#ff4f8b',
    enemyNormal: '#ff9e40',
    enemyTough: '#b388ff',
    enemyStroke: '#ffffff',
    projectile: '#e1f5fe',
    turretBody: '#4fc3f7',
    turretBase: '#0d2b4f',
    turretBaseStroke: '#b3e5fc',
    laserColor: 'rgba(225, 245, 254, 0.6)',
    glow: true
  },
  foret: {
    pageBg: '#07110a',
    canvasBg: '#0b1a10',
    canvasBorder: '#9ccc65',
    textColor: '#f1f8e9',
    textMuted: '#aed581',
    accent: '#9ccc65',
    accentHover: '#7cb342',
    fontFamily: "MedievalSharp, Georgia, serif", // forêt : police de conte médiéval
    snakeBody: '#9ccc65',
    snakeHead: '#dcedc8',
    snakeBody2: '#ffb74d', // serpent du joueur 2 (mode coop)
    snakeHead2: '#ffe0b2',
    food: '#ff5252',
    enemyNormal: '#ce5ce0',
    enemyTough: '#ff7043',
    enemyStroke: '#f1f8e9',
    projectile: '#c5e1a5',
    turretBody: '#a1887f',
    turretBase: '#3e2723',
    turretBaseStroke: '#c5e1a5',
    laserColor: 'rgba(197, 225, 165, 0.6)',
    glow: true
  },
  desert: {
    pageBg: '#1c0e06',
    canvasBg: '#3b1f0e',
    canvasBorder: '#ffb74d',
    textColor: '#fff3e0',
    textMuted: '#ffcc80',
    accent: '#ffb74d',
    accentHover: '#ffa726',
    fontFamily: "Cinzel, Georgia, serif", // désert : capitales gravées, façon temple antique
    snakeBody: '#ffd54f',
    snakeHead: '#fff8e1',
    snakeBody2: '#4dd0e1', // serpent du joueur 2 (mode coop)
    snakeHead2: '#e0f7fa',
    food: '#d05ce3',
    enemyNormal: '#26c6da',
    enemyTough: '#ef5350',
    enemyStroke: '#fff3e0',
    projectile: '#ffd54f',
    turretBody: '#ffb74d',
    turretBase: '#4e2a10',
    turretBaseStroke: '#ffcc80',
    laserColor: 'rgba(255, 213, 79, 0.6)',
    glow: true
  },
  synthwave: {
    pageBg: '#0f0019',
    canvasBg: '#1a0033',
    canvasBorder: '#ff2bd6',
    textColor: '#ffe6ff',
    textMuted: '#d39be8',
    accent: '#ff2bd6',
    accentHover: '#d61fb3',
    fontFamily: "Audiowide, 'Trebuchet MS', sans-serif", // synthwave : police chromée des années 80
    snakeBody: '#00f0ff',
    snakeHead: '#b2fcff',
    snakeBody2: '#ffe14d', // serpent du joueur 2 (mode coop)
    snakeHead2: '#fff6b3',
    food: '#3dff9a',
    enemyNormal: '#ff7a3d',
    enemyTough: '#b026ff',
    enemyStroke: '#ffffff',
    projectile: '#ff2bd6',
    turretBody: '#00f0ff',
    turretBase: '#2a0845',
    turretBaseStroke: '#ff2bd6',
    laserColor: 'rgba(255, 43, 214, 0.6)',
    glow: true
  },
  halloween: {
    pageBg: '#0b0510',
    canvasBg: '#140a1c',
    canvasBorder: '#ff7518',
    textColor: '#ffe8d6',
    textMuted: '#c9a0dc',
    accent: '#ff7518',
    accentHover: '#e65c00',
    fontFamily: "Oswald, 'Arial Narrow', sans-serif", // halloween : texte lisible...
    fontTitre: "Creepster, Oswald, sans-serif", // ...et lettres qui dégoulinent pour les titres
    snakeBody: '#76ff03',
    snakeHead: '#ccff90',
    snakeBody2: '#ea80fc', // serpent du joueur 2 (mode coop)
    snakeHead2: '#f3e5f5',
    food: '#ff7518',
    enemyNormal: '#b388ff',
    enemyTough: '#ff4081',
    enemyStroke: '#ffe8d6',
    projectile: '#76ff03',
    turretBody: '#ff7518',
    turretBase: '#2b1033',
    turretBaseStroke: '#b388ff',
    laserColor: 'rgba(118, 255, 3, 0.55)',
    glow: true
  }
};

// police des grands titres (titre du jeu, compte à rebours, game over) : celle du thème sauf mention contraire
function policeTitre() {
  return currentTheme.fontTitre || currentTheme.fontFamily;
}

let currentThemeName = 'neon';
let currentTheme = themes[currentThemeName];

function applyTheme(name) {
  if (!themes[name]) return;
  currentThemeName = name;
  currentTheme = themes[name];
  const t = currentTheme;

  const root = document.documentElement.style;
  root.setProperty('--bg-page', t.pageBg);
  root.setProperty('--bg-canvas', t.canvasBg);
  root.setProperty('--border-canvas', t.canvasBorder);
  root.setProperty('--text-color', t.textColor);
  root.setProperty('--text-muted', t.textMuted);
  root.setProperty('--accent', t.accent);
  root.setProperty('--accent-hover', t.accentHover);
  root.setProperty('--font-family', t.fontFamily);
  root.setProperty('--font-titre', t.fontTitre || t.fontFamily);

  canvas.style.imageRendering = t.pixelated ? 'pixelated' : 'auto';

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === name);
  });

  if (typeof majLegendePommes === 'function') majLegendePommes();

  // met à jour la couleur des ennemis déjà présents sur la map
  enemies.forEach(e => {
    e.color = e.maxHp > 1 ? t.enemyTough : t.enemyNormal;
  });
}

document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // thème pas encore acheté : la Boutique s'ouvre pour le montrer (js/16-menu-buffs.js)
    if (!contenuDebloque('theme', btn.dataset.theme)) return ouvrirMenuBuffs('theme:' + btn.dataset.theme);
    applyTheme(btn.dataset.theme);
  });
});

// le canvas n'attend pas les polices : on les charge toutes dès le départ (elles sont dans le fichier)
if (document.fonts) {
  Object.values(themes).forEach(t => [t.fontFamily, t.fontTitre].filter(Boolean)
    .forEach(f => ['', 'bold '].forEach(g => document.fonts.load(g + '16px ' + f).catch(() => {}))));
}

// noms des pommes selon le monde (légende et stats de fin de partie)
const nomsPommes = {
  neon: {normale: 'Pomme néon', or: 'Diamant néon', bleue: 'Anneau bleu'},
  espace: {normale: 'Planète verte', or: 'Étoile d\'or', bleue: 'Planète bleue'},
  lave: {normale: 'Émeraude', or: 'Goutte d\'or', bleue: 'Cristal de glace'},
  ocean: {normale: 'Perle verte', or: 'Pièce d\'or', bleue: 'Perle bleue'},
  aurore: {normale: 'Baie givrée', or: 'Flocon d\'or', bleue: 'Glaçon bleu'},
  foret: {normale: 'Baies des bois', or: 'Gland d\'or', bleue: 'Fleur bleue'},
  desert: {normale: 'Figue', or: 'Scarabée d\'or', bleue: 'Amulette turquoise'},
  synthwave: {normale: 'Pomme rétro', or: 'Disque d\'or', bleue: 'Cassette bleue'},
  halloween: {normale: 'Citrouille', or: 'Bonbon d\'or', bleue: 'Potion bleue'}
};
function nomPomme(type) {
  return (nomsPommes[currentThemeName] || nomsPommes.neon)[type];
}

// petite image de la pomme du thème actuel, dessinée avec le même code que dans le jeu
function iconePomme(type) {
  const taille = 22, echelle = 2;
  const c = document.createElement('canvas');
  c.width = taille * echelle;
  c.height = taille * echelle;
  c.className = 'legende-icone';
  const ic = c.getContext('2d');
  ic.scale(echelle, echelle);
  ctxPomme = ic;
  try {
    const dessine = dessinerPommeTheme(type, taille / 2, taille / 2 + 1, 6.5);
    if (!dessine) {
      ic.fillStyle = type === 'or' ? '#ffd700' : type === 'bleue' ? '#2979ff' : currentTheme.food;
      ic.beginPath();
      ic.arc(taille / 2, taille / 2, 6.5, 0, Math.PI * 2);
      ic.fill();
    }
  } finally {
    ctxPomme = null;
  }
  return c;
}

function majLegendePommes() {
  [['legendePomme', 'normale', ' : +10 points'],
   ['legendePommeOr', 'or', ' : +100 points, +10 segments'],
   ['legendePommeBleue', 'bleue', ' : buff aléatoire']].forEach(([id, type, texte]) => {
    const li = document.getElementById(id);
    if (!li) return;
    li.textContent = '';
    li.appendChild(iconePomme(type));
    li.appendChild(document.createTextNode(' ' + nomPomme(type) + texte));
  });
}
