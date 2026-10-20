function lerp(a, b, t) {
  return a + (b - a) * t;
}

// calcule les positions interpolées du serpent en réutilisant les mêmes objets d'une frame à l'autre
// (évite de recréer 100+ objets à 60fps, source de saccades par pression sur le ramasse-miettes)
// (cache propre à chaque joueur : interpolatedPositionsCache, voir 04-joueurs.js)

function computeInterpolatedPositions(t) {
  const len = snake.length;
  if (interpolatedPositionsCache.length !== len) {
    interpolatedPositionsCache = new Array(len);
    for (let i = 0; i < len; i++) {
      interpolatedPositionsCache[i] = {x: 0, y: 0};
    }
  }

  for (let i = 0; i < len; i++) {
    const segment = snake[i];
    const prev = prevSnake[i] || segment; // sécurité si le serpent vient de grandir
    const p = interpolatedPositionsCache[i];
    p.x = lerp(prev.x, segment.x, t);
    p.y = lerp(prev.y, segment.y, t);
  }

  return interpolatedPositionsCache;
}

function lightenColor(hex, percent) {
  if (typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) return hex;
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
  r = Math.min(255, Math.round(r + (255 - r) * percent));
  g = Math.min(255, Math.round(g + (255 - g) * percent));
  b = Math.min(255, Math.round(b + (255 - b) * percent));
  return `rgb(${r}, ${g}, ${b})`;
}

function darkenColor(hex, percent) {
  if (typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) return hex;
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
  r = Math.max(0, Math.round(r * (1 - percent)));
  g = Math.max(0, Math.round(g * (1 - percent)));
  b = Math.max(0, Math.round(b * (1 - percent)));
  return `rgb(${r}, ${g}, ${b})`;
}

// assombrit une couleur #rrggbb et renvoie aussi du #rrggbb (utilisable par lightenColor ensuite)
function assombrirHex(hex, percent) {
  if (typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) return hex;
  const num = parseInt(hex.slice(1), 16);
  const canal = v => Math.max(0, Math.round(v * (1 - percent))).toString(16).padStart(2, '0');
  return '#' + canal((num >> 16) & 0xff) + canal((num >> 8) & 0xff) + canal(num & 0xff);
}

// petite ombre ovale au sol sous un objet (inutile en néon : fond noir et objets lumineux)
function dessinerOmbreSol(cx, cy, radius) {
  if (currentTheme.glow) return;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.ellipse(cx, cy + radius * 0.6, radius * 0.85, radius * 0.32, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fill();
  ctx.restore();
}

// dessine une forme ronde (pomme, ennemi...) avec un dégradé radial + une ombre portée
function fillRadialCircle(cx, cy, radius, baseColor, withShadow = true) {
  if (withShadow && !currentTheme.glow) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy + radius * 0.55, radius * 0.85, radius * 0.32, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fill();
    ctx.restore();
  }

  const grad = ctx.createRadialGradient(
    cx - radius * 0.35, cy - radius * 0.35, radius * 0.1,
    cx, cy, radius
  );
  grad.addColorStop(0, lightenColor(baseColor, 0.55));
  grad.addColorStop(1, baseColor);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

// dessine la tête du serpent sous forme arrondie (cercle) pour être bien reconnaissable
function drawSnakeHead(pos, size, baseColor) {
  const cx = pos.x * size + size / 2;
  const cy = pos.y * size + size / 2;
  const radius = size / 2 - 1;
  fillRadialCircle(cx, cy, radius, baseColor);
}

// dessine la queue du serpent sous forme de triangle pointu, orienté selon le déplacement
function drawSnakeTail(tailPos, prevPos, size, baseColor) {
  const tailCx = tailPos.x * size + size / 2;
  const tailCy = tailPos.y * size + size / 2;

  // direction du corps vers la queue (pour orienter la pointe vers l'extérieur)
  let dx = tailPos.x - prevPos.x;
  let dy = tailPos.y - prevPos.y;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;

  const perpX = -dy;
  const perpY = dx;

  const tipX = tailCx + dx * size * 0.55;
  const tipY = tailCy + dy * size * 0.55;
  const baseCx = tailCx - dx * size * 0.4;
  const baseCy = tailCy - dy * size * 0.4;
  const baseHalfWidth = size * 0.42;

  if (!currentTheme.glow) {
    ctx.save();
    ctx.translate(2, 3);
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(baseCx + perpX * baseHalfWidth, baseCy + perpY * baseHalfWidth);
    ctx.lineTo(baseCx - perpX * baseHalfWidth, baseCy - perpY * baseHalfWidth);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fill();
    ctx.restore();
  }

  const grad = ctx.createLinearGradient(baseCx, baseCy, tipX, tipY);
  grad.addColorStop(0, baseColor);
  grad.addColorStop(1, darkenColor(baseColor, 0.25));

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(baseCx + perpX * baseHalfWidth, baseCy + perpY * baseHalfWidth);
  ctx.lineTo(baseCx - perpX * baseHalfWidth, baseCy - perpY * baseHalfWidth);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
}

// relie les centres des segments consécutifs par un trait épais arrondi,
// pour que le corps du serpent paraisse continu (comble les espaces, notamment dans les virages)
function drawSnakeConnections(positions) {
  if (positions.length < 2) return;

  const isInvulnerable = performance.now() < invulnerableUntil;
  const flashVisible = !isInvulnerable || Math.floor(performance.now() / 100) % 2 === 0;

  ctx.save();
  ctx.globalAlpha = flashVisible ? 1 : 0.3;
  ctx.strokeStyle = currentTheme.snakeBody;
  ctx.lineWidth = gridSize - 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // aux virages, arcTo arrondit le coude (rayon d'une demi-case) pour suivre l'arrondi des segments
  const rayonCoude = gridSize / 2;
  ctx.beginPath();
  positions.forEach((pos, i) => {
    const cx = pos.x * gridSize + gridSize / 2;
    const cy = pos.y * gridSize + gridSize / 2;
    if (i === 0) {
      ctx.moveTo(cx, cy);
    } else if (i < positions.length - 1 && coinVirage(positions[i - 1], pos, positions[i + 1])) {
      const next = positions[i + 1];
      ctx.arcTo(cx, cy, next.x * gridSize + gridSize / 2, next.y * gridSize + gridSize / 2, rayonCoude);
    } else {
      ctx.lineTo(cx, cy);
    }
  });
  if (currentTheme.glow) lueurTrait(currentTheme.snakeBody, 8);
  ctx.stroke();
  ctx.restore();
}

// lueur autour du trait en cours (comme shadowBlur = flou, couleur opaque), sans aucun flou : trois traits
// plus larges et transparents reproduisent le dégradé de l'ombre floue. Un vrai flou sur un long trait
// floute tout son rectangle englobant (le plateau entier pour un long serpent) : c'était le plus gros coût
// d'une image, surtout avec une carte graphique ancienne. Le trait lui-même est dessiné ensuite par l'appelant.
const bandesLueur = [[2.2, 0.045], [1.2, 0.16], [0.5, 0.254]]; // [demi-largeur en plus, en sigma ; opacité]
function lueurTrait(couleur, flou) {
  const m = ctx.getTransform();
  const sigma = flou / 2 / (Math.hypot(m.a, m.b) || 1); // l'ombre floue se mesure en pixels de l'écran
  const largeur = ctx.lineWidth, alpha = ctx.globalAlpha, style = ctx.strokeStyle;
  ctx.strokeStyle = couleur;
  bandesLueur.forEach(([ecart, opacite]) => {
    ctx.lineWidth = largeur + ecart * sigma * 2;
    ctx.globalAlpha = alpha * opacite;
    ctx.stroke();
  });
  ctx.lineWidth = largeur;
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = style;
}

// dessine un segment carré du serpent avec dégradé + ombre + un léger motif d'écailles
// cache des sprites de segment déjà générés (dégradé + écailles), par couleur + thème
let bodySpriteCache = {};

// motif : 'ecailles' (true pour l'ancien appel), ou un motif de skin (MOTIFS_SERPENT, js/08-skins-serpent.js)
function getBodySprite(baseColor, motif) {
  if (motif === true) motif = 'ecailles';
  const size = gridSize - 2;
  const echelle = echelleCaches();
  const cacheKey = currentThemeName + '|' + baseColor + '|' + motif + '|' + echelle;
  if (bodySpriteCache[cacheKey]) return bodySpriteCache[cacheKey];

  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = size * echelle; // plus de pixels sur grand écran, dessiné ensuite à la taille du segment
  spriteCanvas.height = size * echelle;
  const sctx = spriteCanvas.getContext('2d');
  sctx.scale(echelle, echelle);

  if (!currentTheme.glow) {
    sctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    sctx.fillRect(2, 3, size, size);
  }

  const grad = sctx.createRadialGradient(
    size * 0.3, size * 0.3, size * 0.1,
    size / 2, size / 2, size * 0.9
  );
  // reflet moins fort pour les motifs des skins, qui gardent ainsi des couleurs franches
  grad.addColorStop(0, lightenColor(baseColor, motif === 'ecailles' ? 0.45 : 0.25));
  grad.addColorStop(1, baseColor);
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, size, size);

  if (motif && motif !== 'ecailles' && MOTIFS_SERPENT[motif]) {
    MOTIFS_SERPENT[motif](sctx, size, baseColor);
  } else if (motif) {
    const scaleColor = darkenColor(baseColor, 0.4);
    const highlightColor = lightenColor(baseColor, 0.3);
    const cols = 3;
    const rows = 2;
    const scaleW = size / cols;
    const scaleH = size / rows;

    for (let row = 0; row < rows; row++) {
      const offsetX = row % 2 === 0 ? 0 : scaleW / 2;
      const isInverted = row % 2 === 1;
      for (let col = -1; col < cols; col++) {
        const cx = col * scaleW + scaleW / 2 + offsetX;
        const cy = row * scaleH + scaleH * 0.55;
        const radius = scaleW * 0.52;

        sctx.beginPath();
        if (isInverted) {
          sctx.arc(cx, cy, radius, Math.PI, Math.PI * 2);
        } else {
          sctx.arc(cx, cy, radius, 0, Math.PI);
        }
        sctx.strokeStyle = scaleColor;
        sctx.globalAlpha = 0.85;
        sctx.lineWidth = 1.4;
        sctx.stroke();

        sctx.beginPath();
        sctx.arc(cx, cy + (isInverted ? radius * 0.3 : -radius * 0.3), radius * 0.25, 0, Math.PI * 2);
        sctx.fillStyle = highlightColor;
        sctx.globalAlpha = 0.35;
        sctx.fill();
      }
    }
  }

  bodySpriteCache[cacheKey] = spriteCanvas;
  return spriteCanvas;
}

// dessine un segment en réutilisant le sprite pré-calculé (translate + rotate + drawImage,
// bien moins coûteux que recréer dégradé/écailles à chaque frame pour chaque segment)
// coin : {x, y} (-1 ou 1) = coin extérieur du virage à arrondir, ou null pour un segment droit
function drawSnakeSegment(x, y, size, baseColor, motif, angle, coin) {
  const sprite = getBodySprite(baseColor, motif);
  const cx = x + size / 2;
  const cy = y + size / 2;

  ctx.save();
  ctx.translate(cx, cy);
  if (coin === 'rond') {
    // segment en plein milieu d'un virage pendant l'animation : disque, pour éviter les pointes
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.clip();
  } else if (coin) {
    // virage : on découpe le segment avec son coin extérieur en quart de cercle
    tracerSegmentVirage(size, coin);
    ctx.clip();
  }
  ctx.rotate(angle || 0);
  // pas de shadowBlur ici : en néon, la lueur vient du trait de liaison dessiné dessous
  // (un seul flou par image au lieu d'un par segment, qui ralentissait avec un long serpent)
  ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
  ctx.restore();
}

// trace (centré sur l'origine) un carré dont le coin extérieur du virage est remplacé par un quart de cercle
// de rayon "size" centré sur le coin intérieur : le corps forme un vrai coude arrondi, comme un tuyau
function tracerSegmentVirage(size, coin) {
  const h = size / 2;
  const ix = -coin.x * h, iy = -coin.y * h; // coin intérieur (côté des deux voisins)
  const ax = coin.x * h, ay = -coin.y * h; // les deux autres coins, de part et d'autre du coin extérieur
  const bx = -coin.x * h, by = coin.y * h;
  const startAngle = Math.atan2(ay - iy, ax - ix);
  const endAngle = Math.atan2(by - iy, bx - ix);
  // sens de parcours : le plus court arc (90°) entre les deux coins
  let delta = endAngle - startAngle;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  ctx.beginPath();
  ctx.moveTo(ix, iy);
  ctx.lineTo(ax, ay);
  ctx.arc(ix, iy, size, startAngle, startAngle + delta, delta < 0);
  ctx.closePath();
}

// renvoie le coin extérieur du virage si le segment est dans un coude (voisins sur deux axes différents), sinon null
function coinVirage(prevPos, pos, nextPos) {
  if (!nextPos || nextPos === pos) return null;
  const ax = prevPos.x - pos.x, ay = prevPos.y - pos.y;
  const bx = nextPos.x - pos.x, by = nextPos.y - pos.y;
  // l'un des voisins doit être horizontal et l'autre vertical (positions sur la grille, à l'interpolation près)
  const seuil = 0.5;
  const aHoriz = Math.abs(ax) >= seuil && Math.abs(ay) < 0.05;
  const aVert = Math.abs(ay) >= seuil && Math.abs(ax) < 0.05;
  const bHoriz = Math.abs(bx) >= seuil && Math.abs(by) < 0.05;
  const bVert = Math.abs(by) >= seuil && Math.abs(bx) < 0.05;
  if (aHoriz && bVert) return {x: -Math.sign(ax), y: -Math.sign(by)};
  if (aVert && bHoriz) return {x: -Math.sign(bx), y: -Math.sign(ay)};
  return null;
}

