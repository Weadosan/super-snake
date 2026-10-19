// --- Styles alternatifs d'ennemis (oursin, fantôme, pixel) ---

// --- Boss : grande forme menaçante, distincte des ennemis normaux quel que soit le skin choisi ---
function drawBossEnemy(cx, cy, radius, color, etat) {
  const spikeCount = 12;
  const tipR = radius * 1.35;
  const baseR = radius * 0.95;
  // plus le boss perd de vie, plus il pulse vite et fort
  const rage = etat ? etat.rage : 0;
  const pulse = 1 + Math.sin(performance.now() / (200 - rage * 120)) * (0.04 + rage * 0.05);

  ctx.save();
  ctx.shadowColor = '#ff1744';
  ctx.shadowBlur = 14;

  ctx.fillStyle = color;
  ctx.strokeStyle = '#ff1744';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < spikeCount; i++) {
    const angle = (i / spikeCount) * Math.PI * 2 + performance.now() / 4000;
    const a1 = angle - 0.14;
    const a2 = angle + 0.14;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * tipR * pulse, cy + Math.sin(angle) * tipR * pulse);
    ctx.lineTo(cx + Math.cos(a1) * baseR, cy + Math.sin(a1) * baseR);
    ctx.lineTo(cx + Math.cos(a2) * baseR, cy + Math.sin(a2) * baseR);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  dessinerVisageBoss(cx, cy, radius, etat);
  ctx.restore();
}

// yeux luisants qui suivent le serpent + bouche qui claque, de plus en plus vite avec la rage
function dessinerVisageBoss(cx, cy, radius, etat) {
  const rage = etat ? etat.rage : 0;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = rage > 0.5 ? '#ff6d00' : '#ffee58';
  ctx.beginPath();
  ctx.arc(cx - radius * 0.28, cy - radius * 0.1, radius * 0.14, 0, Math.PI * 2);
  ctx.arc(cx + radius * 0.28, cy - radius * 0.1, radius * 0.14, 0, Math.PI * 2);
  ctx.fill();
  const rx = etat ? etat.regardX * radius * 0.06 : 0;
  const ry = etat ? etat.regardY * radius * 0.06 : 0;
  ctx.fillStyle = '#1a0000';
  ctx.beginPath();
  ctx.arc(cx - radius * 0.28 + rx, cy - radius * 0.1 + ry, radius * 0.06, 0, Math.PI * 2);
  ctx.arc(cx + radius * 0.28 + rx, cy - radius * 0.1 + ry, radius * 0.06, 0, Math.PI * 2);
  ctx.fill();

  // bouche qui s'ouvre et se ferme, de plus en plus vite avec la rage
  const ouverture = (0.5 + Math.sin(performance.now() / (260 - rage * 160)) * 0.5) * (0.3 + rage * 0.7);
  ctx.fillStyle = '#1a0000';
  ctx.beginPath();
  ctx.ellipse(cx, cy + radius * 0.35, radius * 0.3, radius * (0.04 + ouverture * 0.16), 0, 0, Math.PI * 2);
  ctx.fill();
  if (ouverture > 0.3) {
    // petites dents
    ctx.fillStyle = '#ffffff';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * radius * 0.14 - radius * 0.05, cy + radius * 0.35 - radius * (0.04 + ouverture * 0.16));
      ctx.lineTo(cx + i * radius * 0.14 + radius * 0.05, cy + radius * 0.35 - radius * (0.04 + ouverture * 0.16));
      ctx.lineTo(cx + i * radius * 0.14, cy + radius * 0.35 - radius * 0.02);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

// un boss différent selon le skin d'ennemis choisi
function dessinerBoss(cx, cy, radius, color, etat) {
  if (enemySkin === 'ghost') dessinerBossFantome(cx, cy, radius, color, etat);
  else if (enemySkin === 'pixel') dessinerBossPixel(cx, cy, radius, color, etat);
  else if (enemySkin === 'slime') dessinerBossSlime(cx, cy, radius, color, etat);
  else if (enemySkin === 'bat') dessinerBossVampire(cx, cy, radius, color, etat);
  else if (enemySkin === 'jelly') dessinerBossMeduse(cx, cy, radius, color, etat);
  else if (enemySkin === 'eye') dessinerBossOeil(cx, cy, radius, color, etat);
  else if (enemySkin === 'drone') dessinerBossDrone(cx, cy, radius, color, etat);
  else if (enemySkin === 'spider') dessinerBossAraignee(cx, cy, radius, color, etat);
  else if (enemySkin === 'crab') dessinerBossCrabe(cx, cy, radius, color, etat);
  else if (enemySkin === 'pumpkin') dessinerBossCitrouille(cx, cy, radius, color, etat);
  else if (enemySkin === 'mushroom') dessinerBossChampignon(cx, cy, radius, color, etat);
  else drawBossEnemy(cx, cy, radius, color, etat); // oursin géant (et skin rond)
}

// petite couronne dorée posée sur les boss ; le joyau rougit avec la rage
function dessinerCouronneBoss(cx, base, largeur, rage) {
  const h = largeur * 0.8;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffd54f';
  ctx.strokeStyle = '#ff8f00';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - largeur, base);
  ctx.lineTo(cx - largeur, base - h * 0.65);
  ctx.lineTo(cx - largeur * 0.5, base - h * 0.3);
  ctx.lineTo(cx, base - h);
  ctx.lineTo(cx + largeur * 0.5, base - h * 0.3);
  ctx.lineTo(cx + largeur, base - h * 0.65);
  ctx.lineTo(cx + largeur, base);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = rage > 0.5 ? '#ff1744' : '#e040fb';
  ctx.beginPath();
  ctx.arc(cx, base - h * 0.32, largeur * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// roi fantôme : grand drap ondulant, petits bras, couronne
function dessinerBossFantome(cx, cy, radius, color, etat) {
  const r = radius;
  const rage = etat.rage;
  const t = etat.temps / (170 - rage * 80) + etat.phase;
  const v = i => Math.sin(t + i * 1.3) * r * 0.12;
  ctx.save();
  ctx.shadowColor = '#ff1744';
  ctx.shadowBlur = 14;
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ff1744';
  ctx.lineWidth = 1.5;
  // bras qui s'agitent de chaque côté
  [-1, 1].forEach(cote => {
    ctx.beginPath();
    ctx.ellipse(cx + cote * r * 1.02, cy + r * 0.15 + Math.sin(t * 1.4 + cote) * r * 0.12, r * 0.28, r * 0.15, cote * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.globalAlpha = 0.93;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy + r * 0.8 + v(0));
  ctx.lineTo(cx - r, cy - r * 0.1);
  ctx.arc(cx, cy - r * 0.1, r, Math.PI, 0);
  ctx.lineTo(cx + r, cy + r * 0.8 + v(6));
  for (let k = 1; k < 6; k++) {
    const x = cx + r - k * (r * 2 / 6);
    const y = cy + (k % 2 ? r * 0.5 : r * 0.8) + v(6 - k);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.stroke();
  dessinerCouronneBoss(cx, cy - r * 1.02, r * 0.45, rage);
  dessinerVisageBoss(cx, cy - r * 0.05, r, etat);
  ctx.restore();
}

// envahisseur géant en pixels : 2 images, il agite les bras plus vite avec la rage
const bossPixelMotif1 = [
  [0, 0, 1, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 1, 0, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 2, 1, 2, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 1, 3, 3, 3, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 0, 1],
  [0, 0, 0, 1, 0, 1, 0, 0, 0]
];
const bossPixelMotif2 = [
  [0, 0, 1, 0, 0, 0, 1, 0, 0],
  [1, 0, 0, 1, 0, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 1, 1, 2, 1, 2, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 3, 1, 3, 1, 1, 0],
  [0, 0, 1, 0, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 1, 0]
];
function dessinerBossPixel(cx, cy, radius, color, etat) {
  const rage = etat.rage;
  const motif = Math.floor(etat.temps / (320 - rage * 200) + etat.phase) % 2 ? bossPixelMotif2 : bossPixelMotif1;
  const cellule = (radius * 2.7) / 9;
  const x0 = cx - cellule * 4.5, y0 = cy - cellule * 4;
  ctx.save();
  ctx.shadowColor = '#ff1744';
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  ctx.beginPath();
  motif.forEach((ligne, j) => ligne.forEach((v, i) => {
    if (v === 1) ctx.rect(x0 + i * cellule, y0 + j * cellule, cellule + 0.5, cellule + 0.5);
  }));
  ctx.fill();
  // yeux qui clignotent en rage, bouche sombre
  ctx.shadowBlur = 0;
  const yeuxAllumes = rage < 0.5 || Math.floor(etat.temps / 120) % 2 === 0;
  motif.forEach((ligne, j) => ligne.forEach((v, i) => {
    if (v === 2) {
      ctx.fillStyle = yeuxAllumes ? (rage > 0.5 ? '#ff6d00' : '#ffee58') : '#1a0000';
      ctx.fillRect(x0 + i * cellule, y0 + j * cellule, cellule + 0.5, cellule + 0.5);
      ctx.fillStyle = '#1a0000';
      const dx = Math.round(etat.regardX) * cellule * 0.25, dy = Math.round(etat.regardY) * cellule * 0.25;
      ctx.fillRect(x0 + i * cellule + cellule * 0.3 + dx, y0 + j * cellule + cellule * 0.3 + dy, cellule * 0.4, cellule * 0.4);
    } else if (v === 3) {
      ctx.fillStyle = '#1a0000';
      ctx.fillRect(x0 + i * cellule, y0 + j * cellule, cellule + 0.5, cellule + 0.5);
    }
  }));
  ctx.restore();
}

// roi slime : grosse goutte avec des bulles à l'intérieur et une couronne qui rebondit
function dessinerBossSlime(cx, cy, radius, color, etat) {
  const r = radius;
  const rage = etat.rage;
  const saut = Math.abs(Math.sin(etat.temps / (420 - rage * 200) + etat.phase));
  const ecrase = Math.max(0, 1 - saut * 3);
  const large = r * (1.15 + ecrase * 0.2 - saut * 0.08);
  const haut = r * (0.95 - ecrase * 0.18 + saut * 0.1);
  const bas = cy + r * 0.65 - saut * r * 0.15;
  ctx.save();
  ctx.shadowColor = '#ff1744';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(cx - large, bas);
  ctx.bezierCurveTo(cx - large * 1.15, bas - haut * 0.55, cx - large * 0.75, bas - haut * 1.45, cx, bas - haut * 1.45);
  ctx.bezierCurveTo(cx + large * 0.75, bas - haut * 1.45, cx + large * 1.15, bas - haut * 0.55, cx + large, bas);
  ctx.quadraticCurveTo(cx + large * 0.7, bas + r * 0.14, cx + large * 0.45, bas);
  ctx.quadraticCurveTo(cx + large * 0.3, bas + r * 0.3 * (1 - ecrase), cx + large * 0.12, bas);
  ctx.lineTo(cx - large * 0.3, bas);
  ctx.quadraticCurveTo(cx - large * 0.5, bas + r * 0.24 * (1 - ecrase), cx - large * 0.7, bas);
  ctx.closePath();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#ff1744';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // bulles qui remontent dans la gelée
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  for (let i = 0; i < 4; i++) {
    const p = ((etat.temps / 1400 + i * 0.27 + etat.phase) % 1);
    const bx = cx + Math.sin(i * 2.3) * large * 0.55;
    const by = bas - r * 0.1 - p * haut * 1.1;
    ctx.beginPath();
    ctx.arc(bx, by, r * (0.05 + (i % 2) * 0.04) * (1 - p * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.ellipse(cx - large * 0.42, bas - haut * 1.05, r * 0.2, r * 0.1, -0.6, 0, Math.PI * 2);
  ctx.fill();
  dessinerCouronneBoss(cx, bas - haut * 1.4, r * 0.42, rage);
  dessinerVisageBoss(cx, bas - haut * 0.75, r, etat);
  ctx.restore();
}

// vampire : grandes ailes qui battent, yeux rouges, crocs, bouche qui s'ouvre avec la rage
function dessinerBossVampire(cx, cy, radius, color, etat) {
  const r = radius;
  const rage = etat.rage;
  const battement = Math.sin(etat.temps / (120 - rage * 50) + etat.phase);
  ctx.save();
  ctx.shadowColor = '#ff1744';
  ctx.shadowBlur = 14;
  ctx.fillStyle = assombrirHex(typeof color === 'string' && color.startsWith('#') ? color : '#4a148c', 0.4);
  ctx.strokeStyle = '#ff1744';
  ctx.lineWidth = 1.3;
  [-1, 1].forEach(cote => {
    const bout = cy - r * 0.45 - battement * r * 0.65;
    ctx.beginPath();
    ctx.moveTo(cx + cote * r * 0.5, cy - r * 0.35);
    ctx.lineTo(cx + cote * r * 1.25, bout - r * 0.15);
    ctx.lineTo(cx + cote * r * 1.75, bout + r * 0.1);
    // trois festons sous l'aile
    ctx.quadraticCurveTo(cx + cote * r * 1.6, bout + r * 0.6, cx + cote * r * 1.4, bout + r * 0.65);
    ctx.quadraticCurveTo(cx + cote * r * 1.25, bout + r * 0.95, cx + cote * r * 1.0, cy + r * 0.3);
    ctx.quadraticCurveTo(cx + cote * r * 0.8, cy + r * 0.6, cx + cote * r * 0.5, cy + r * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
  ctx.fillStyle = color;
  // oreilles pointues
  ctx.beginPath();
  [-1, 1].forEach(cote => {
    ctx.moveTo(cx + cote * r * 0.6, cy - r * 0.4);
    ctx.lineTo(cx + cote * r * 0.5, cy - r * 1.15);
    ctx.lineTo(cx + cote * r * 0.15, cy - r * 0.7);
  });
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.72, r * 0.68, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // pointe de cheveux sur le front
  ctx.shadowBlur = 0;
  ctx.fillStyle = assombrirHex(typeof color === 'string' && color.startsWith('#') ? color : '#4a148c', 0.55);
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.5, cy - r * 0.45);
  ctx.quadraticCurveTo(cx, cy - r * 0.8, cx + r * 0.5, cy - r * 0.45);
  ctx.lineTo(cx, cy - r * 0.2);
  ctx.closePath();
  ctx.fill();
  // yeux rouges luisants qui suivent le serpent
  ctx.shadowColor = '#ff1744';
  ctx.shadowBlur = 8;
  ctx.fillStyle = rage > 0.5 ? '#ff1744' : '#ff5252';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.26, cy - r * 0.08, r * 0.15, r * 0.1, 0.3, 0, Math.PI * 2);
  ctx.ellipse(cx + r * 0.26, cy - r * 0.08, r * 0.15, r * 0.1, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#1a0000';
  const rx = etat.regardX * r * 0.05, ry = etat.regardY * r * 0.04;
  ctx.beginPath();
  ctx.arc(cx - r * 0.26 + rx, cy - r * 0.08 + ry, r * 0.05, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.26 + rx, cy - r * 0.08 + ry, r * 0.05, 0, Math.PI * 2);
  ctx.fill();
  // bouche et grands crocs
  const ouverture = (0.5 + Math.sin(etat.temps / (300 - rage * 180)) * 0.5) * (0.25 + rage * 0.75);
  const yBouche = cy + r * 0.3;
  ctx.fillStyle = '#1a0000';
  ctx.beginPath();
  ctx.ellipse(cx, yBouche, r * 0.3, r * (0.04 + ouverture * 0.14), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  [-1, 1].forEach(cote => {
    const x = cx + cote * r * 0.17;
    ctx.moveTo(x - r * 0.07, yBouche - r * 0.04);
    ctx.lineTo(x + r * 0.07, yBouche - r * 0.04);
    ctx.lineTo(x, yBouche + r * (0.2 + rage * 0.1));
  });
  ctx.fill();
  ctx.restore();
}

// yeux blancs ou rouges (en colère) dont les pupilles regardent la tête du serpent
function dessinerYeuxEnnemi(cx, cy, ecart, rayonOeil, etat) {
  const px = etat.regardX * rayonOeil * 0.45;
  const py = etat.regardY * rayonOeil * 0.45;
  ctx.save();
  ctx.shadowBlur = 0;
  [-1, 1].forEach(cote => {
    const ox = cx + cote * ecart;
    ctx.fillStyle = etat.colere ? '#ff5252' : '#ffffff';
    ctx.beginPath();
    ctx.arc(ox, cy, rayonOeil, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(ox + px, cy + py, rayonOeil * 0.5, 0, Math.PI * 2);
    ctx.fill();
  });
  // sourcils froncés en colère
  if (etat.colere) {
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - ecart - rayonOeil, cy - rayonOeil * 1.6);
    ctx.lineTo(cx - ecart + rayonOeil, cy - rayonOeil * 0.9);
    ctx.moveTo(cx + ecart + rayonOeil, cy - rayonOeil * 1.6);
    ctx.lineTo(cx + ecart - rayonOeil, cy - rayonOeil * 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

// fissures sombres sur un ennemi résistant déjà touché
function dessinerFissures(r) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, -r * 0.5);
  ctx.lineTo(-r * 0.2, -r * 0.1);
  ctx.lineTo(-r * 0.45, r * 0.25);
  ctx.lineTo(0, r * 0.65);
  ctx.moveTo(r * 0.6, -r * 0.55);
  ctx.lineTo(r * 0.3, -r * 0.2);
  ctx.lineTo(r * 0.55, r * 0.15);
  ctx.stroke();
  ctx.restore();
}

function drawUrchinEnemy(cx, cy, radius, color, strokeColor, etat) {
  const spikeCount = 8;
  const tipR = radius * 1.7;
  const baseR = radius * 0.9;
  // les piquants tournent lentement (sens selon l'ennemi)
  const rotation = etat ? (etat.temps / 1500) * (etat.phase > Math.PI ? 1 : -1) : 0;

  ctx.fillStyle = color;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  for (let i = 0; i < spikeCount; i++) {
    const angle = (i / spikeCount) * Math.PI * 2 + rotation;
    const a1 = angle - 0.18;
    const a2 = angle + 0.18;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * tipR, cy + Math.sin(angle) * tipR);
    ctx.lineTo(cx + Math.cos(a1) * baseR, cy + Math.sin(a1) * baseR);
    ctx.lineTo(cx + Math.cos(a2) * baseR, cy + Math.sin(a2) * baseR);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (etat) dessinerYeuxEnnemi(cx, cy - radius * 0.05, radius * 0.3, radius * 0.24, etat);
}

function drawGhostEnemy(cx, cy, radius, color, strokeColor, etat) {
  const r = radius;
  // le bas du drap ondule
  const t = (etat ? etat.temps : performance.now()) / 180 + (etat ? etat.phase : 0);
  const v = i => Math.sin(t + i * 1.7) * r * 0.12;

  ctx.beginPath();
  ctx.moveTo(cx - r, cy + r * 0.7 + v(0));
  ctx.lineTo(cx - r, cy - r * 0.15);
  ctx.arc(cx, cy - r * 0.15, r, Math.PI, 0);
  ctx.lineTo(cx + r, cy + r * 0.7 + v(4));
  ctx.lineTo(cx + r * 0.5, cy + r * 0.4 + v(3));
  ctx.lineTo(cx, cy + r * 0.7 + v(2));
  ctx.lineTo(cx - r * 0.5, cy + r * 0.4 + v(1));
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  if (etat) {
    dessinerYeuxEnnemi(cx, cy - r * 0.15, r * 0.32, r * 0.22, etat);
  } else {
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx - r * 0.32, cy - r * 0.15, r * 0.16, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.32, cy - r * 0.15, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
}

// slime : goutte gélatineuse qui s'écrase en touchant le sol et s'étire en l'air
function dessinerEnnemiSlime(cx, cy, radius, color, strokeColor, etat) {
  const r = radius;
  const saut = Math.abs(Math.sin(etat.temps / 220 + etat.phase)); // 0 = au sol, 1 = en l'air
  const ecrase = Math.max(0, 1 - saut * 3); // écrasement bref au contact du sol
  const large = r * (1.2 + ecrase * 0.3 - saut * 0.12);
  const haut = r * (0.95 - ecrase * 0.25 + saut * 0.15);
  const bas = cy + r * 0.6;

  ctx.beginPath();
  ctx.moveTo(cx - large, bas);
  // base large et molle, sommet arrondi et bas : une vraie goutte de gelée
  ctx.bezierCurveTo(cx - large * 1.15, bas - haut * 0.55, cx - large * 0.75, bas - haut * 1.45, cx, bas - haut * 1.45);
  ctx.bezierCurveTo(cx + large * 0.75, bas - haut * 1.45, cx + large * 1.15, bas - haut * 0.55, cx + large, bas);
  // petites gouttes qui pendent sous le slime
  ctx.quadraticCurveTo(cx + large * 0.6, bas + r * 0.12, cx + large * 0.35, bas);
  ctx.quadraticCurveTo(cx + large * 0.2, bas + r * 0.28 * (1 - ecrase), cx + large * 0.05, bas);
  ctx.lineTo(cx - large * 0.4, bas);
  ctx.quadraticCurveTo(cx - large * 0.55, bas + r * 0.2 * (1 - ecrase), cx - large * 0.7, bas);
  ctx.closePath();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // reflet brillant
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx - large * 0.4, bas - haut * 1.05, r * 0.18, r * 0.1, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - large * 0.12, bas - haut * 1.25, r * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  dessinerYeuxEnnemi(cx, bas - haut * 0.6, r * 0.32, r * 0.2, etat);
}

// chauve-souris : corps rond, oreilles pointues, ailes qui battent, crocs en colère
function dessinerEnnemiChauveSouris(cx, cy, radius, color, strokeColor, etat) {
  const r = radius;
  const battement = Math.sin(etat.temps / 90 + etat.phase); // -1 ailes basses, 1 ailes hautes
  const couleurAile = assombrirHex(color, 0.3);

  ctx.fillStyle = couleurAile;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  [-1, 1].forEach(cote => {
    const bout = cy - r * 0.3 - battement * r * 0.7;
    const xEpaule = cx + cote * r * 0.55;
    const xBout = cx + cote * r * 1.9;
    ctx.beginPath();
    ctx.moveTo(xEpaule, cy - r * 0.25);
    ctx.lineTo(xBout, bout);
    // bord festonné de l'aile
    ctx.quadraticCurveTo(cx + cote * r * 1.6, bout + r * 0.55, cx + cote * r * 1.3, bout + r * 0.5 + battement * r * 0.15);
    ctx.quadraticCurveTo(cx + cote * r * 1.05, bout + r * 0.75, cx + cote * r * 0.85, cy + r * 0.25);
    ctx.quadraticCurveTo(cx + cote * r * 0.7, cy + r * 0.45, xEpaule, cy + r * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // oreilles
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.55, cy - r * 0.35);
  ctx.lineTo(cx - r * 0.45, cy - r * 1.05);
  ctx.lineTo(cx - r * 0.12, cy - r * 0.6);
  ctx.moveTo(cx + r * 0.55, cy - r * 0.35);
  ctx.lineTo(cx + r * 0.45, cy - r * 1.05);
  ctx.lineTo(cx + r * 0.12, cy - r * 0.6);
  ctx.fill();
  ctx.stroke();

  // corps
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.68, r * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  dessinerYeuxEnnemi(cx, cy - r * 0.1, r * 0.26, r * 0.19, etat);

  // crocs : petits au repos, plus longs en colère
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  const croc = etat.colere ? r * 0.28 : r * 0.14;
  ctx.beginPath();
  [-1, 1].forEach(cote => {
    const x = cx + cote * r * 0.16;
    ctx.moveTo(x - r * 0.08, cy + r * 0.24);
    ctx.lineTo(x + r * 0.08, cy + r * 0.24);
    ctx.lineTo(x, cy + r * 0.24 + croc);
  });
  ctx.fill();
  ctx.restore();
}

const pixelEnemyPattern = [
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [1, 0, 1, 0, 1],
  [1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1]
];
// 2e image de l'animation (pattes rentrées), façon Space Invaders
const pixelEnemyPattern2 = [
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [1, 0, 1, 0, 1],
  [1, 1, 1, 1, 1],
  [0, 1, 0, 1, 0]
];

function drawPixelEnemy(cx, cy, radius, color, etat) {
  const size = radius * 2.4;
  const cell = size / 5;
  const startX = cx - size / 2;
  const startY = cy - size / 2;
  const image2 = etat && Math.floor(etat.temps / 350 + etat.phase) % 2 === 1;
  const motif = image2 ? pixelEnemyPattern2 : pixelEnemyPattern;

  ctx.fillStyle = color;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (motif[row][col]) {
        ctx.fillRect(startX + col * cell, startY + row * cell, cell + 0.5, cell + 0.5);
      }
    }
  }
  // yeux pixel : blancs (rouges en colère) avec une pupille d'un pixel tournée vers le serpent
  if (etat) {
    const p = cell / 2;
    const dx = Math.round(etat.regardX) * p / 2;
    const dy = Math.round(etat.regardY) * p / 2;
    [1, 3].forEach(col => {
      const x = startX + col * cell, y = startY + 2 * cell;
      ctx.fillStyle = etat.colere ? '#ff5252' : '#ffffff';
      ctx.fillRect(x, y, cell, cell);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x + cell / 4 + dx, y + cell / 4 + dy, p, p);
    });
  }
}

function drawHeartPickup() {
  if (!heartPickup) return;

  // léger effet de pulsation pour le rendre visible
  const pulse = 1 + Math.sin(performance.now() / 200) * 0.1;
  dessinerOmbreSol(heartPickup.x, heartPickup.y, heartPickup.radius);
  ctx.save();
  ctx.translate(heartPickup.x, heartPickup.y);
  ctx.scale(pulse, pulse);
  ctx.font = (heartPickup.radius * 2) + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('❤️', 0, 0);
  ctx.restore();
}

// contexte de dessin des pommes : celui du jeu, ou un petit canvas pour les icônes de la légende
