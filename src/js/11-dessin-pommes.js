let ctxPomme = null;

// trace une étoile (branches pointues, rInt = creux entre les branches)
function tracerEtoile(cx, cy, branches, rExt, rInt, rotation) {
  const c = ctxPomme || ctx;
  c.beginPath();
  for (let i = 0; i < branches * 2; i++) {
    const a = rotation + (i * Math.PI) / branches - Math.PI / 2;
    const r = i % 2 ? rInt : rExt;
    if (i) c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    else c.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  c.closePath();
}

// remplissage en dégradé radial (reflet en haut à gauche) pour les skins de pommes
function degradePomme(cx, cy, r, clair, fonce) {
  const c = ctxPomme || ctx;
  const g = c.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r * 1.1);
  g.addColorStop(0, clair);
  g.addColorStop(1, fonce);
  return g;
}

// skin des pommes selon le monde ; type : 'normale' (verte et butin), 'or' ou 'bleue'.
// Renvoie false pour un thème inconnu (dessin rond d'origine). La taille de collision ne change pas.
function dessinerPommeTheme(type, cx, cy, r) {
  const c = ctxPomme || ctx;
  const theme = currentThemeName;
  const now = performance.now();
  if (mondesSupp[theme]) {
    c.save();
    mondesSupp[theme].pomme(c, type, cx, cy, r, now);
    c.restore();
    return true;
  }
  if (!['neon', 'espace', 'lave', 'ocean'].includes(theme)) return false;
  c.save();

  if (theme === 'neon') {
    // tubes de néon : contours lumineux, intérieur presque vide
    c.lineJoin = 'round';
    c.lineCap = 'round';
    const couleur = type === 'or' ? '#ffd740' : type === 'bleue' ? '#40c4ff' : currentTheme.food;
    c.shadowColor = couleur;
    c.shadowBlur = 10;
    c.strokeStyle = couleur;
    c.lineWidth = 2;
    c.fillStyle = couleur;
    if (type === 'normale') {
      // pomme en tube néon : deux lobes, queue et feuille
      c.beginPath();
      c.moveTo(cx, cy - r * 0.55);
      c.bezierCurveTo(cx + r * 0.6, cy - r * 1.05, cx + r * 1.15, cy - r * 0.35, cx + r * 0.9, cy + r * 0.35);
      c.bezierCurveTo(cx + r * 0.7, cy + r * 0.95, cx + r * 0.25, cy + r * 1.05, cx, cy + r * 0.8);
      c.bezierCurveTo(cx - r * 0.25, cy + r * 1.05, cx - r * 0.7, cy + r * 0.95, cx - r * 0.9, cy + r * 0.35);
      c.bezierCurveTo(cx - r * 1.15, cy - r * 0.35, cx - r * 0.6, cy - r * 1.05, cx, cy - r * 0.55);
      c.closePath();
      c.globalAlpha = 0.18;
      c.fill();
      c.globalAlpha = 1;
      c.stroke();
      c.beginPath();
      c.moveTo(cx, cy - r * 0.55);
      c.lineTo(cx + r * 0.1, cy - r * 1.05);
      c.moveTo(cx + r * 0.1, cy - r * 0.9);
      c.quadraticCurveTo(cx + r * 0.7, cy - r * 1.35, cx + r * 0.75, cy - r * 0.85);
      c.stroke();
    } else if (type === 'or') {
      // diamant doré en néon, avec ses facettes
      const h = r * 1.15, l = r * 1.05;
      c.beginPath();
      c.moveTo(cx - l, cy - h * 0.3);
      c.lineTo(cx - l * 0.55, cy - h * 0.8);
      c.lineTo(cx + l * 0.55, cy - h * 0.8);
      c.lineTo(cx + l, cy - h * 0.3);
      c.lineTo(cx, cy + h);
      c.closePath();
      c.globalAlpha = 0.2;
      c.fill();
      c.globalAlpha = 1;
      c.stroke();
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(cx - l, cy - h * 0.3);
      c.lineTo(cx + l, cy - h * 0.3);
      c.moveTo(cx - l * 0.3, cy - h * 0.3);
      c.lineTo(cx, cy + h);
      c.lineTo(cx + l * 0.3, cy - h * 0.3);
      c.stroke();
    } else {
      // double anneau néon bleu qui pulse
      const pulse = 1 + Math.sin(now / 200) * 0.08;
      c.globalAlpha = 0.18;
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.stroke();
      c.lineWidth = 1;
      c.beginPath();
      c.arc(cx, cy, r * 0.7 * pulse, 0, Math.PI * 2);
      c.stroke();
    }
  } else if (theme === 'espace') {
    if (type === 'normale') {
      // planète verte avec un anneau
      const inclinaison = -0.35;
      c.strokeStyle = 'rgba(224, 255, 240, 0.75)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(cx, cy, r * 1.65, r * 0.45, inclinaison, Math.PI, Math.PI * 2);
      c.stroke();
      c.fillStyle = degradePomme(cx, cy, r, lightenColor(currentTheme.food, 0.5), darkenColor(currentTheme.food, 0.35));
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      c.strokeStyle = 'rgba(0, 60, 30, 0.35)';
      c.lineWidth = 1;
      c.beginPath();
      c.arc(cx, cy, r * 0.65, Math.PI * 0.9, Math.PI * 1.6);
      c.stroke();
      c.strokeStyle = 'rgba(224, 255, 240, 0.85)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(cx, cy, r * 1.65, r * 0.45, inclinaison, 0, Math.PI);
      c.stroke();
    } else if (type === 'or') {
      // étoile dorée qui tourne et scintille
      c.fillStyle = degradePomme(cx, cy, r, '#fffde7', '#ffb300');
      tracerEtoile(cx, cy, 5, r * 1.25, r * 0.55, now / 900);
      c.fill();
      c.shadowBlur = 0;
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
      c.fill();
    } else {
      // planète bleue avec une petite lune en orbite
      c.fillStyle = degradePomme(cx, cy, r, '#82b1ff', '#1a237e');
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      const a = now / 500;
      c.fillStyle = '#cfd8dc';
      c.beginPath();
      c.arc(cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r * 0.6, r * 0.22, 0, Math.PI * 2);
      c.fill();
    }
  } else if (theme === 'lave') {
    if (type === 'normale') {
      // émeraude taillée qui brille sur la roche
      const h = r * 1.15, l = r * 0.85;
      c.fillStyle = degradePomme(cx, cy, r, lightenColor(currentTheme.food, 0.55), darkenColor(currentTheme.food, 0.4));
      c.beginPath();
      c.moveTo(cx, cy - h);
      c.lineTo(cx + l, cy - h * 0.35);
      c.lineTo(cx + l * 0.7, cy + h * 0.7);
      c.lineTo(cx, cy + h);
      c.lineTo(cx - l * 0.7, cy + h * 0.7);
      c.lineTo(cx - l, cy - h * 0.35);
      c.closePath();
      c.fill();
      c.shadowBlur = 0;
      c.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(cx - l, cy - h * 0.35);
      c.lineTo(cx, cy - h * 0.1);
      c.lineTo(cx + l, cy - h * 0.35);
      c.moveTo(cx, cy - h * 0.1);
      c.lineTo(cx, cy + h);
      c.stroke();
    } else if (type === 'or') {
      // goutte d'or en fusion, pointe vers le haut
      c.fillStyle = degradePomme(cx, cy + r * 0.2, r, '#fff8e1', '#ff8f00');
      c.beginPath();
      c.moveTo(cx, cy - r * 1.35);
      c.bezierCurveTo(cx + r * 0.4, cy - r * 0.7, cx + r, cy - r * 0.1, cx + r, cy + r * 0.35);
      c.arc(cx, cy + r * 0.35, r, 0, Math.PI);
      c.bezierCurveTo(cx - r, cy - r * 0.1, cx - r * 0.4, cy - r * 0.7, cx, cy - r * 1.35);
      c.closePath();
      c.fill();
      c.shadowBlur = 0;
      c.fillStyle = 'rgba(255, 255, 255, 0.8)';
      c.beginPath();
      c.ellipse(cx - r * 0.35, cy + r * 0.1, r * 0.15, r * 0.3, 0.3, 0, Math.PI * 2);
      c.fill();
    } else {
      // cristal de glace, bien visible au milieu de la lave
      c.fillStyle = degradePomme(cx, cy, r, '#e1f5fe', '#0288d1');
      tracerEtoile(cx, cy, 6, r * 1.2, r * 0.75, 0);
      c.fill();
      c.shadowBlur = 0;
      c.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      c.lineWidth = 0.8;
      c.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 2;
        c.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        c.lineTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r);
      }
      c.stroke();
    }
  } else {
    if (type === 'normale') {
      // perle verte avec une petite feuille d'algue
      c.fillStyle = degradePomme(cx, cy, r, lightenColor(currentTheme.food, 0.6), darkenColor(currentTheme.food, 0.3));
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      const ondule = Math.sin(now / 300) * r * 0.25;
      c.fillStyle = '#1de9b6';
      c.beginPath();
      c.moveTo(cx, cy - r * 0.8);
      c.quadraticCurveTo(cx + r * 0.9 + ondule, cy - r * 1.5, cx + r * 0.2 + ondule, cy - r * 1.6);
      c.quadraticCurveTo(cx + r * 0.1, cy - r * 1.2, cx, cy - r * 0.8);
      c.fill();
      c.fillStyle = 'rgba(255, 255, 255, 0.85)';
      c.beginPath();
      c.arc(cx - r * 0.35, cy - r * 0.35, r * 0.2, 0, Math.PI * 2);
      c.fill();
    } else if (type === 'or') {
      // pièce d'or de trésor de pirate, qui tourne sur elle-même (vue de profil par moments)
      const tourne = Math.abs(Math.cos(now / 500));
      const largeur = r * (0.25 + tourne * 0.75);
      c.fillStyle = '#b8860b';
      c.beginPath();
      c.ellipse(cx + (1 - tourne) * 1.5, cy, largeur, r, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = degradePomme(cx, cy, r, '#fff59d', '#ffa000');
      c.beginPath();
      c.ellipse(cx, cy, largeur, r, 0, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      if (tourne > 0.4) {
        // bord gravé et tête de mort stylisée au centre
        c.strokeStyle = 'rgba(130, 80, 0, 0.7)';
        c.lineWidth = 1;
        c.beginPath();
        c.ellipse(cx, cy, largeur * 0.75, r * 0.75, 0, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = 'rgba(130, 80, 0, 0.8)';
        c.beginPath();
        c.ellipse(cx, cy - r * 0.08, largeur * 0.32, r * 0.3, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#fff59d';
        c.beginPath();
        c.arc(cx - largeur * 0.13, cy - r * 0.1, r * 0.08, 0, Math.PI * 2);
        c.arc(cx + largeur * 0.13, cy - r * 0.1, r * 0.08, 0, Math.PI * 2);
        c.fill();
      }
    } else {
      // perle bleue posée dans un coquillage ouvert
      c.fillStyle = '#ffccbc';
      c.beginPath();
      c.moveTo(cx - r * 1.3, cy + r * 0.2);
      for (let i = 0; i <= 6; i++) {
        const a = Math.PI - (i * Math.PI) / 6;
        const rr = r * (i % 2 ? 1.2 : 1.35);
        c.lineTo(cx + Math.cos(a) * rr, cy + r * 0.2 + Math.sin(a) * rr * 0.75);
      }
      c.closePath();
      c.fill();
      c.fillStyle = degradePomme(cx, cy - r * 0.1, r * 0.9, '#bbdefb', '#1565c0');
      c.beginPath();
      c.arc(cx, cy - r * 0.1, r * 0.9, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
  return true;
}

function drawLootApples() {
  lootApples.forEach(a => {
    const cx = a.x * gridSize + gridSize / 2;
    const cy = a.y * gridSize + gridSize / 2;
    const pulse = 1 + Math.sin(performance.now() / 150) * 0.15;

    ctx.save();
    if (currentTheme.glow) {
      ctx.shadowColor = currentTheme.food;
      ctx.shadowBlur = 10;
    }
    if (!dessinerPommeTheme('normale', cx, cy, (gridSize / 2 - 2) * pulse)) fillRadialCircle(cx, cy, (gridSize / 2 - 2) * pulse, currentTheme.food);
    ctx.restore();
  });
}

function drawGoldenApple() {
  goldenApples.forEach(dessinerPommeOr);
}

function dessinerPommeOr(goldenApple) {
  const pulse = 1 + Math.sin(performance.now() / 120) * 0.18;
  const sparkleAngle = performance.now() / 300;

  dessinerOmbreSol(goldenApple.x, goldenApple.y, goldenApple.radius);
  ctx.save();
  // halo doré toujours visible, quel que soit le thème, pour bien la distinguer
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 16;
  if (!dessinerPommeTheme('or', goldenApple.x, goldenApple.y, goldenApple.radius * pulse)) {
    fillRadialCircle(goldenApple.x, goldenApple.y, goldenApple.radius * pulse, '#ffd700', false);
  }

  // petites étincelles tournantes autour de la pomme
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff8dc';
  for (let i = 0; i < 3; i++) {
    const angle = sparkleAngle + (i * Math.PI * 2) / 3;
    const sx = goldenApple.x + Math.cos(angle) * (goldenApple.radius + 6);
    const sy = goldenApple.y + Math.sin(angle) * (goldenApple.radius + 6);
    ctx.beginPath();
    ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBlueApple() {
  blueApples.forEach(dessinerPommeBleue);
}

function dessinerPommeBleue(blueApple) {
  const pulse = 1 + Math.sin(performance.now() / 120) * 0.18;
  const ringAngle = performance.now() / 250;

  dessinerOmbreSol(blueApple.x, blueApple.y, blueApple.radius);
  ctx.save();
  // halo bleu électrique toujours visible, pour bien la distinguer
  ctx.shadowColor = '#40c4ff';
  ctx.shadowBlur = 16;
  if (!dessinerPommeTheme('bleue', blueApple.x, blueApple.y, blueApple.radius * pulse)) {
    fillRadialCircle(blueApple.x, blueApple.y, blueApple.radius * pulse, '#2979ff', false);
  }

  // petit anneau tournant façon "buff mystère"
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(224, 247, 255, 0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(blueApple.x, blueApple.y, blueApple.radius + 5, ringAngle, ringAngle + Math.PI * 1.2);
  ctx.stroke();

  // icône du buff qu'elle contient, affichée au centre
  const icon = (buffLabels[blueApple.buffType] || {}).text.split(' ')[0];
  if (icon) {
    ctx.font = (blueApple.radius * 1.4) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, blueApple.x, blueApple.y);
  }

  ctx.restore();
}

function drawShockwaves() {
  shockwaves.forEach(s => {
    const progress = s.life / s.maxLife;
    const radius = s.maxRadius * progress;
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 4 * (1 - progress) + 1;
    ctx.beginPath();
    ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
}

function drawLaserBeams() {
  laserBeams.forEach(l => {
    const progress = l.life / l.maxLife;
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    const couleurLaser = {espace: '#b388ff', lave: '#ffab00', ocean: '#18ffff'}[currentThemeName] ||
      (mondesSupp[currentThemeName] && mondesSupp[currentThemeName].couleurLaser) || '#ff1744';
    ctx.strokeStyle = couleurLaser;
    ctx.shadowColor = couleurLaser;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
    ctx.restore();
  });
}

function drawTrail() {
  const ralenti = enRalenti();
  trailPoints.forEach((p, i) => {
    const size = (gridSize - 4) * (i / trailPoints.length) * 0.8;
    ctx.globalAlpha = p.alpha * 0.5;
    if (dessinerPointTrainee(p, i, size)) return; // traînée propre au skin (js/08-skins-serpent.js)
    ctx.fillStyle = currentTheme.snakeBody;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  });
  // ralenti : copies transparentes de la tête laissées derrière elle (une sur quatre)
  if (ralenti) {
    ctx.strokeStyle = currentTheme.snakeHead;
    ctx.lineWidth = 2;
    for (let i = trailPoints.length - 4; i >= 0; i -= 4) {
      const p = trailPoints[i];
      ctx.globalAlpha = Math.max(0, p.alpha) * 0.9;
      ctx.beginPath();
      ctx.arc(p.x, p.y, gridSize / 2 - 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function drawParticles() {
  particles.forEach(p => {
    const progress = p.life / p.maxLife;
    ctx.globalAlpha = 1 - progress;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * (1 - progress * 0.5), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

