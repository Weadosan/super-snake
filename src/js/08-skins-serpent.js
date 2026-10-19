// ============================================================
// --- Skins du serpent du joueur (J1) ---
// ============================================================
// « Classique » garde les couleurs du thème. Les autres changent les couleurs du corps et de la tête, le motif
// des segments (getBodySprite, js/08-dessin-serpent.js), un éventuel décor sur la tête et la traînée.
// Ils s'achètent à l'échoppe de Sifflet (prix dans reglagesProgression.serpents) et se choisissent dans le
// menu ☰ ou à la Boutique. Le choix est gardé dans snakeSkinSerpent. En coop, le J2 garde les couleurs du thème.
//   corps : une couleur, ou une liste répétée segment après segment (defile : ms par décalage, liste qui coule)
//   tete, lueur : couleur de la tête et du halo · motif : 'ecailles', 'lisse', 'rayures', 'etoiles',
//   'plaques', 'dragon' (grandes écailles en pointe et crête), 'or' (plaques d'or en losange)
//   decor : 'cornes', 'oreilles', 'antenne', 'couronne' · yeux : 'visiere' · trainee : 'flammes', 'etoiles',
//   'arcenciel', 'paillettes'
const skinsSerpent = {
  classique: {nom: 'Classique', icone: '🐍', detail: 'Les couleurs du thème, toujours assorties au décor'},
  corail: {nom: 'Corail', icone: '🪸', detail: 'Anneaux rouges, jaunes et noirs, comme le vrai serpent corail',
    corps: ['#e53935', '#fdd835', '#212121', '#fdd835'], tete: '#ef5350', lueur: '#ff5252', motif: 'lisse'},
  tigre: {nom: 'Tigre', icone: '🐯', detail: 'Pelage orange rayé de noir, avec ses petites oreilles',
    corps: '#ff9800', tete: '#ffb74d', motif: 'rayures', decor: 'oreilles'},
  robot: {nom: 'Robot', icone: '🤖', detail: 'Plaques de métal rivetées, visière rouge et antenne qui clignote',
    corps: '#78909c', tete: '#b0bec5', lueur: '#ff1744', motif: 'plaques', decor: 'antenne', yeux: 'visiere'},
  dragon: {nom: 'Dragon', icone: '🐉', detail: 'Écailles vertes, deux cornes et une traînée de flammes',
    corps: '#2e7d32', tete: '#4caf50', lueur: '#ff9800', motif: 'dragon', decor: 'cornes', trainee: 'flammes'},
  galaxie: {nom: 'Galaxie', icone: '🌌', detail: 'Un ciel de nuit plein d\'étoiles, qui en sème derrière lui',
    corps: '#311b92', tete: '#5e35b1', lueur: '#b388ff', motif: 'etoiles', trainee: 'etoiles'},
  arcenciel: {nom: 'Arc-en-ciel', icone: '🌈', detail: 'Toutes les couleurs, qui coulent de la tête à la queue',
    corps: ['#ff1744', '#ff9100', '#ffea00', '#00e676', '#00b0ff', '#651fff', '#d500f9'], defile: 140,
    tete: '#ffffff', lueur: '#ffffff', motif: 'lisse', trainee: 'arcenciel'},
  roi: {nom: 'Roi d\'or', icone: '👑', detail: 'Écailles d\'or massif, couronne et paillettes. Le plus cher',
    corps: '#ffb300', tete: '#ffe082', lueur: '#ffd740', motif: 'or', decor: 'couronne', trainee: 'paillettes'}
};

const cleStockageSkinSerpent = 'snakeSkinSerpent';
let skinSerpent = (() => {
  try {
    const lu = localStorage.getItem(cleStockageSkinSerpent);
    return skinsSerpent[lu] ? lu : 'classique';
  } catch (e) {
    return 'classique';
  }
})();

let skinModele = null; // skin imposé au serpent de démonstration, même pas encore acheté (dessinerSerpentModele)

// skin porté par un joueur : J1 seulement, et seulement s'il est débloqué (sauvegarde importée, ?dev...)
function cleSkinJoueur(j) {
  if (!j || j.numero !== 0) return 'classique';
  if (skinModele) return skinModele;
  return contenuDebloque('serpent', skinSerpent) ? skinSerpent : 'classique';
}

function skinActif() {
  return skinsSerpent[cleSkinJoueur(joueurActif)];
}

function couleurPrincipaleSkin(s) {
  return Array.isArray(s.corps) ? s.corps[0] : s.corps;
}

// couleurs du thème pour J1, avec celles de son skin (cache par thème et skin)
const palettesSkins = {};
function paletteSkin(theme, nomTheme, cle) {
  const s = skinsSerpent[cle];
  if (!s || !s.corps) return theme;
  const k = nomTheme + '|' + cle;
  if (!palettesSkins[k]) {
    palettesSkins[k] = Object.assign({}, theme, {
      snakeBody: s.lueur || couleurPrincipaleSkin(s),
      snakeHead: s.tete
    });
  }
  return palettesSkins[k];
}

// couleur du segment i (sur n) : se fonce par paliers vers la queue (5 au maximum, pour le cache des sprites)
function couleurSegmentSerpent(i, n) {
  const palier = Math.min(4, Math.floor((i / Math.max(1, n - 1)) * 5));
  const s = skinActif();
  if (!s.corps) return assombrirHex(currentTheme.snakeBody, 0.1 * palier);
  if (!Array.isArray(s.corps)) return assombrirHex(s.corps, 0.08 * palier);
  const decalage = s.defile ? Math.floor(performance.now() / s.defile) : 0;
  const L = s.corps.length;
  return assombrirHex(s.corps[(((i - decalage) % L) + L) % L], 0.05 * palier);
}

function motifSerpent() {
  return skinActif().motif || 'ecailles';
}

// --- Motifs des segments (dessinés une fois par couleur dans le sprite du segment) ---
// le sprite est tourné dans le sens du corps : x le long du serpent, y en travers
// petit générateur pseudo-aléatoire, pour que le même sprite ait toujours les mêmes étoiles
function aleaGraine(graine) {
  let s = graine;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

const MOTIFS_SERPENT = {
  // reflet le long du dos, et ombre sur les flancs (effet de tube)
  lisse(sctx, size, base) {
    const grad = sctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.18)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.22)');
    grad.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, size, size);
  },
  // deux rayures en pointe, l'une qui descend du dos, l'autre qui monte du ventre
  rayures(sctx, size, base) {
    sctx.fillStyle = darkenColor(base, 0.82);
    sctx.beginPath();
    sctx.moveTo(size * 0.12, 0);
    sctx.quadraticCurveTo(size * 0.3, size * 0.35, size * 0.22, size * 0.72);
    sctx.quadraticCurveTo(size * 0.4, size * 0.35, size * 0.42, 0);
    sctx.closePath();
    sctx.fill();
    sctx.beginPath();
    sctx.moveTo(size * 0.58, size);
    sctx.quadraticCurveTo(size * 0.72, size * 0.62, size * 0.68, size * 0.28);
    sctx.quadraticCurveTo(size * 0.86, size * 0.62, size * 0.9, size);
    sctx.closePath();
    sctx.fill();
    MOTIFS_SERPENT.lisse(sctx, size, base);
  },
  // nébuleuse rose et petites étoiles blanches
  etoiles(sctx, size, base) {
    const alea = aleaGraine(parseInt(String(base).replace(/\D/g, '').slice(0, 6) || '7', 10) + 11);
    const neb = sctx.createRadialGradient(size * 0.65, size * 0.4, 0, size * 0.65, size * 0.4, size * 0.6);
    neb.addColorStop(0, 'rgba(236, 64, 122, 0.45)');
    neb.addColorStop(1, 'rgba(236, 64, 122, 0)');
    sctx.fillStyle = neb;
    sctx.fillRect(0, 0, size, size);
    for (let k = 0; k < 5; k++) {
      const x = 2 + alea() * (size - 4), y = 2 + alea() * (size - 4);
      sctx.globalAlpha = 0.6 + alea() * 0.4;
      sctx.fillStyle = k % 2 ? '#ffffff' : '#b3e5fc';
      sctx.beginPath();
      sctx.arc(x, y, 0.5 + alea() * 0.8, 0, Math.PI * 2);
      sctx.fill();
    }
    // une étoile à quatre branches
    sctx.globalAlpha = 0.95;
    etoileBranches(sctx, size * 0.3, size * 0.62, size * 0.2, '#ffffff');
    sctx.globalAlpha = 1;
  },
  // dragon : deux rangées de grandes écailles en pointe vers la queue, crête orange le long du dos
  dragon(sctx, size, base) {
    const fonce = darkenColor(base, 0.3), bord = darkenColor(base, 0.65), reflet = lightenColor(base, 0.45);
    [[size * 0.25, -size * 0.12], [size * 0.75, size * 0.2]].forEach(([y, decale]) => {
      for (let k = -1; k < 2; k++) {
        const x0 = k * size * 0.5 + decale, w = size * 0.6, h = size * 0.26;
        sctx.beginPath();
        sctx.moveTo(x0, y - h);
        sctx.quadraticCurveTo(x0 + w * 0.75, y - h, x0 + w, y);
        sctx.quadraticCurveTo(x0 + w * 0.75, y + h, x0, y + h);
        sctx.quadraticCurveTo(x0 + w * 0.2, y, x0, y - h);
        sctx.fillStyle = fonce;
        sctx.fill();
        sctx.strokeStyle = bord;
        sctx.lineWidth = 1.1;
        sctx.stroke();
        // reflet sur le haut de chaque écaille
        sctx.beginPath();
        sctx.moveTo(x0 + w * 0.2, y - h * 0.55);
        sctx.quadraticCurveTo(x0 + w * 0.6, y - h * 0.6, x0 + w * 0.8, y - h * 0.15);
        sctx.strokeStyle = reflet;
        sctx.globalAlpha = 0.6;
        sctx.lineWidth = 0.9;
        sctx.stroke();
        sctx.globalAlpha = 1;
      }
    });
    // crête : deux piquants par segment, pointés vers la queue
    [0.08, 0.55].forEach(k => {
      const x0 = size * k, y = size / 2;
      sctx.beginPath();
      sctx.moveTo(x0, y - size * 0.11);
      sctx.lineTo(x0 + size * 0.38, y);
      sctx.lineTo(x0, y + size * 0.11);
      sctx.closePath();
      sctx.fillStyle = '#ff8f00';
      sctx.fill();
      sctx.strokeStyle = '#7a2e00';
      sctx.lineWidth = 0.9;
      sctx.stroke();
    });
  },
  // or : plaques en losange, chacune polie (clair en haut, sombre en bas) avec un éclat blanc
  or(sctx, size, base) {
    const d = size * 0.25;
    const centres = [[0, 0.5], [0.5, 0.5], [1, 0.5], [0.25, 0], [0.75, 0], [0.25, 1], [0.75, 1]];
    centres.forEach(([cx, cy], n) => {
      const x = cx * size, y = cy * size;
      const grad = sctx.createLinearGradient(x, y - d, x, y + d);
      grad.addColorStop(0, lightenColor(base, 0.6));
      grad.addColorStop(0.5, base);
      grad.addColorStop(1, darkenColor(base, 0.35));
      sctx.beginPath();
      sctx.moveTo(x, y - d);
      sctx.lineTo(x + d, y);
      sctx.lineTo(x, y + d);
      sctx.lineTo(x - d, y);
      sctx.closePath();
      sctx.fillStyle = grad;
      sctx.fill();
      sctx.strokeStyle = darkenColor(base, 0.55);
      sctx.lineWidth = 0.9;
      sctx.stroke();
      if (n === 1 || n === 3) {
        sctx.fillStyle = '#ffffff';
        sctx.globalAlpha = 0.85;
        sctx.beginPath();
        sctx.arc(x - d * 0.3, y - d * 0.35, 0.9, 0, Math.PI * 2);
        sctx.fill();
        sctx.globalAlpha = 1;
      }
    });
  },
  // plaques de métal : bord en creux, joint au milieu et rivets
  plaques(sctx, size, base) {
    MOTIFS_SERPENT.lisse(sctx, size, base);
    sctx.strokeStyle = darkenColor(base, 0.45);
    sctx.lineWidth = 1.2;
    sctx.strokeRect(1.5, 1.5, size - 3, size - 3);
    sctx.beginPath();
    sctx.moveTo(size / 2, 2);
    sctx.lineTo(size / 2, size - 2);
    sctx.stroke();
    sctx.fillStyle = lightenColor(base, 0.6);
    [[4, 4], [size - 4, 4], [4, size - 4], [size - 4, size - 4]].forEach(([x, y]) => {
      sctx.beginPath();
      sctx.arc(x, y, 1.2, 0, Math.PI * 2);
      sctx.fill();
    });
  }
};

// étoile à quatre branches fines (motif Galaxie, traînées)
function etoileBranches(c, x, y, r, couleur) {
  c.fillStyle = couleur;
  c.beginPath();
  c.moveTo(x, y - r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.quadraticCurveTo(x, y, x, y + r);
  c.quadraticCurveTo(x, y, x - r, y);
  c.quadraticCurveTo(x, y, x, y - r);
  c.fill();
}

// --- Tête : décor et visière ---
// sens du regard (vers le haut avant le départ) et sa perpendiculaire
function sensTete() {
  let dx = direction.x, dy = direction.y;
  if (dx === 0 && dy === 0) { dx = 0; dy = -1; }
  return {dx, dy, px: -dy, py: dx};
}

function dessinerDecorTete(headPos) {
  const s = skinActif();
  if (!s.decor) return;
  const cx = headPos.x * gridSize + gridSize / 2;
  const cy = headPos.y * gridSize + gridSize / 2;
  const {dx, dy, px, py} = sensTete();
  const r = gridSize / 2;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (s.decor === 'cornes') {
    // deux cornes courbes à l'arrière de la tête, pointées vers l'arrière et l'extérieur
    [1, -1].forEach(c => {
      const bx = cx - dx * r * 0.35 + px * c * r * 0.6, by = cy - dy * r * 0.35 + py * c * r * 0.6;
      const tx = cx - dx * r * 1.25 + px * c * r * 1.15, ty = cy - dy * r * 1.25 + py * c * r * 1.15;
      ctx.beginPath();
      ctx.moveTo(bx + dx * 2.2, by + dy * 2.2);
      ctx.quadraticCurveTo(bx + px * c * 4 - dx, by + py * c * 4 - dy, tx, ty);
      ctx.quadraticCurveTo(bx - dx * 2, by - dy * 2, bx - px * c * 1.5 - dx * 1.5, by - py * c * 1.5 - dy * 1.5);
      ctx.closePath();
      ctx.fillStyle = '#f5e6c8';
      ctx.fill();
      ctx.strokeStyle = '#6d4c41';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  } else if (s.decor === 'oreilles') {
    // petites oreilles rondes de tigre, sur les côtés à l'arrière
    [1, -1].forEach(c => {
      const ox = cx - dx * r * 0.3 + px * c * r * 0.85, oy = cy - dy * r * 0.3 + py * c * r * 0.85;
      ctx.beginPath();
      ctx.arc(ox, oy, 3.6, 0, Math.PI * 2);
      ctx.fillStyle = '#ff9800';
      ctx.fill();
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ox, oy, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffe0b2';
      ctx.fill();
    });
    // rayures sur le front
    ctx.strokeStyle = 'rgba(26, 26, 26, 0.85)';
    ctx.lineWidth = 1.4;
    [-0.35, 0, 0.35].forEach(k => {
      const fx = cx - dx * r * 0.55 + px * k * r, fy = cy - dy * r * 0.55 + py * k * r;
      ctx.beginPath();
      ctx.moveTo(fx - dx * 2.5, fy - dy * 2.5);
      ctx.lineTo(fx + dx * 1.5, fy + dy * 1.5);
      ctx.stroke();
    });
  } else if (s.decor === 'antenne') {
    // antenne droite sur l'arrière de la tête, ampoule qui clignote
    const bx = cx - dx * r * 0.5, by = cy - dy * r * 0.5;
    const tx = bx - dx * 7 + px * 3, ty = by - dy * 7 + py * 3;
    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    const allume = Math.floor(performance.now() / 400) % 2 === 0;
    ctx.beginPath();
    ctx.arc(tx, ty, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = allume ? '#ff1744' : '#7f0000';
    if (allume) {
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 8;
    }
    ctx.fill();
  } else if (s.decor === 'couronne') {
    // couronne toujours droite (vue de face), posée sur la tête
    const l = r * 1.5, h = r * 0.9;
    const x0 = cx - l / 2, y0 = cy - r * 0.45;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y0 - h * 0.55);
    ctx.lineTo(x0 + l * 0.25, y0 - h * 0.25);
    ctx.lineTo(x0 + l * 0.5, y0 - h);
    ctx.lineTo(x0 + l * 0.75, y0 - h * 0.25);
    ctx.lineTo(x0 + l, y0 - h * 0.55);
    ctx.lineTo(x0 + l, y0);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, y0 - h, 0, y0);
    grad.addColorStop(0, '#fff59d');
    grad.addColorStop(1, '#ffa000');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#8d5a00';
    ctx.lineWidth = 1;
    ctx.stroke();
    // trois pierres
    [[0.5, '#e53935'], [0.2, '#2979ff'], [0.8, '#2979ff']].forEach(([k, coul]) => {
      ctx.beginPath();
      ctx.arc(x0 + l * k, y0 - h * 0.2, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = coul;
      ctx.fill();
    });
  }
  ctx.restore();
}

// visière rouge du robot (à la place des yeux) ; un point lumineux la balaie
function dessinerVisiere(headPos) {
  const cx = headPos.x * gridSize + gridSize / 2;
  const cy = headPos.y * gridSize + gridSize / 2;
  const {dx, dy, px, py} = sensTete();
  const now = performance.now();
  const blesse = now < invulnerableUntil;
  const avant = gridSize / 4;
  const demi = gridSize * 0.36;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1c2429';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx + dx * avant + px * demi, cy + dy * avant + py * demi);
  ctx.lineTo(cx + dx * avant - px * demi, cy + dy * avant - py * demi);
  ctx.stroke();
  if (!blesse || Math.floor(now / 80) % 2 === 0) {
    ctx.strokeStyle = '#ff1744';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2;
    ctx.stroke();
    const k = Math.sin(now / 260) * demi * 0.8;
    ctx.beginPath();
    ctx.arc(cx + dx * avant + px * k, cy + dy * avant + py * k, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();
}

// --- Traînée : renvoie vrai si le skin dessine lui-même ce point (sinon, rond de la couleur du serpent) ---
function dessinerPointTrainee(p, i, size) {
  const s = skinActif();
  if (!s.trainee || size <= 0.5) return false;
  const now = performance.now();
  if (s.trainee === 'flammes') {
    const flamme = ['#ffeb3b', '#ff9800', '#ff5722'][(i + Math.floor(now / 90)) % 3];
    const monte = (1 - p.alpha * 2) * 6; // la flamme s'élève en s'éteignant
    ctx.globalAlpha = Math.max(0, p.alpha) * 1.2;
    ctx.fillStyle = flamme;
    ctx.beginPath();
    ctx.arc(p.x + Math.sin(now / 70 + i) * 1.5, p.y - monte, size / 2 * (0.8 + 0.3 * Math.sin(now / 50 + i * 2)), 0, Math.PI * 2);
    ctx.fill();
  } else if (s.trainee === 'etoiles') {
    if (i % 2) return true;
    ctx.globalAlpha = Math.max(0, p.alpha) * 1.6;
    etoileBranches(ctx, p.x, p.y, 2 + size * 0.35 * (0.7 + 0.3 * Math.sin(now / 120 + i)), i % 4 ? '#ffffff' : '#b388ff');
  } else if (s.trainee === 'arcenciel') {
    ctx.globalAlpha = Math.max(0, p.alpha) * 1.1;
    ctx.fillStyle = 'hsl(' + Math.round((i * 28 + now / 8) % 360) + ', 100%, 60%)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (s.trainee === 'paillettes') {
    ctx.globalAlpha = Math.max(0, p.alpha) * 0.9;
    ctx.fillStyle = '#ffd740';
    ctx.beginPath();
    ctx.arc(p.x, p.y, size / 3, 0, Math.PI * 2);
    ctx.fill();
    if (i % 3 === 0) {
      ctx.globalAlpha = Math.max(0, p.alpha) * 1.8;
      etoileBranches(ctx, p.x + Math.sin(i) * 4, p.y + Math.cos(i) * 4, 3.5, '#fffde7');
    }
  } else {
    return false;
  }
  return true;
}

// --- Choix du skin ---
function choisirSkinSerpent(cle) {
  if (!skinsSerpent[cle] || !contenuDebloque('serpent', cle)) return false;
  skinSerpent = cle;
  try {
    localStorage.setItem(cleStockageSkinSerpent, cle);
  } catch (e) {
    // stockage indisponible : le choix vaut pour cette session
  }
  majBoutonsSkinSerpent();
  if (typeof majLegendeApercu === 'function') majLegendeApercu();
  return true;
}

// boutons du menu ☰ (créés ici à partir de skinsSerpent)
const selecteurSkinSerpent = document.getElementById('snakeSkinSelector');
Object.keys(skinsSerpent).forEach(cle => {
  const s = skinsSerpent[cle];
  const b = document.createElement('button');
  b.className = 'serpent-btn';
  b.dataset.serpent = cle;
  b.dataset.nom = s.nom;
  b.textContent = s.icone + ' ' + s.nom;
  b.addEventListener('click', () => {
    // skin pas encore acheté : la Boutique s'ouvre pour le montrer (js/16-menu-buffs.js)
    if (!contenuDebloque('serpent', cle)) return ouvrirMenuBuffs('serpent:' + cle);
    choisirSkinSerpent(cle);
  });
  selecteurSkinSerpent.appendChild(b);
});

function majBoutonsSkinSerpent() {
  const actuel = cleSkinJoueur(joueurs[0] || {numero: 0});
  document.querySelectorAll('.serpent-btn').forEach(b => {
    const cle = b.dataset.serpent;
    const ok = contenuDebloque('serpent', cle);
    b.classList.toggle('active', cle === actuel);
    b.classList.toggle('verrouille', !ok);
    b.title = ok ? '' : 'À acheter dans la Boutique (' + prixContenu('serpent', cle) + ' Écailles)';
  });
}

// --- Serpent de démonstration (aperçu du menu ☰, icônes de la Boutique, captures) ---
// un faux joueur J1 aux cases données, dessiné par le vrai code du jeu avec le skin cle
function joueurModele(cases, dir) {
  const j = nouveauJoueur(0);
  j.snake = cases.map(c => ({...c}));
  j.prevSnake = cases.map(c => ({...c}));
  j.direction = {...dir};
  j.nextDirection = {...dir};
  j.prochainClignement = Infinity; // pas de clignement
  return j;
}

function dessinerSerpentModele(j, t, cle, themeEnPlus) {
  const avantJoueur = joueurActif, avantTheme = currentTheme, avantPomme = food;
  joueurActif = j;
  skinModele = cle;
  // le serpent regarde devant lui (et la pomme n'existe pas encore au chargement de la page)
  food = {x: j.snake[0].x + j.direction.x * 4, y: j.snake[0].y + j.direction.y * 4};
  currentTheme = Object.assign({}, paletteJoueur(j), themeEnPlus || {});
  try {
    dessinerSerpent(t);
  } finally {
    joueurActif = avantJoueur;
    currentTheme = avantTheme;
    food = avantPomme;
    skinModele = null;
  }
}
