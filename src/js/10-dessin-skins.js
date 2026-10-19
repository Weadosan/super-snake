// --- Skins d'ennemis ajoutés : méduse, œil volant, drone, araignée, crabe, citrouille, champignon ---
// Zone de contact lisible : le corps plein de chaque ennemi remplit son cercle de collision (e.radius) ;
// ce qui dépasse (tentacules, pattes, pinces, hélice) est fin et translucide, donc ne se confond pas avec
// le corps. Les boss gardent en plus un cercle de contact au sol (dessinerZoneContactBoss).

// voile sombre (ou clair si alpha < 0) sur le dernier tracé : ombre une couleur quelle qu'elle soit
function voilerTrace(alpha) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = alpha > 0 ? `rgba(0, 0, 0, ${alpha})` : `rgba(255, 255, 255, ${-alpha})`;
  ctx.fill();
  ctx.restore();
}

// cercle de contact du boss posé au sol : disque rouge très léger et pointillés qui tournent
function dessinerZoneContactBoss(e) {
  const now = performance.now();
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = 'rgba(255, 23, 68, 0.1)';
  ctx.beginPath();
  ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 82, 82, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.lineDashOffset = -now / 40;
  ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------
// Méduse : cloche translucide qui se contracte, tentacules qui ondulent
// ------------------------------------------------------------
function tracerClocheMeduse(cx, cy, r, large, lobes) {
  const bas = cy + r * 0.38;
  ctx.beginPath();
  ctx.moveTo(cx - large, bas);
  ctx.bezierCurveTo(cx - large, cy - r * 1.25, cx + large, cy - r * 1.25, cx + large, bas);
  // bord festonné
  for (let k = 1; k <= lobes; k++) {
    const x = cx + large - k * (large * 2 / lobes);
    ctx.quadraticCurveTo(x + large / lobes, bas + r * 0.2, x, bas);
  }
  ctx.closePath();
  return bas;
}

function dessinerTentacules(cx, bas, r, large, n, t, couleur, epaisseur, longueur) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = couleur;
  ctx.lineWidth = epaisseur;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x0 = cx - large * 0.7 + i * (large * 1.4 / (n - 1));
    ctx.moveTo(x0, bas);
    ctx.quadraticCurveTo(x0 + Math.sin(t + i * 1.7) * r * 0.25, bas + longueur * 0.5,
      x0 + Math.sin(t + i * 1.7 + 1) * r * 0.15, bas + longueur);
  }
  ctx.stroke();
  ctx.restore();
}

function dessinerEnnemiMeduse(cx, cy, r, color, strokeColor, etat) {
  const t = etat.temps / 200 + etat.phase;
  const large = r * (0.97 + Math.sin(etat.temps / 260 + etat.phase) * 0.05);
  dessinerTentacules(cx, cy + r * 0.38, r, large, 4, t, color, 1.3, r * 0.72);
  tracerClocheMeduse(cx, cy, r, large, 4);
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // dôme intérieur plus clair et reflet
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.32, large * 0.55, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx - large * 0.45, cy - r * 0.5, r * 0.16, r * 0.08, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  dessinerYeuxEnnemi(cx, cy - r * 0.08, r * 0.3, r * 0.2, etat);
}

// reine méduse : 7 tentacules qui fouettent de plus en plus vite, couronne
function dessinerBossMeduse(cx, cy, radius, color, etat) {
  const r = radius;
  const rage = etat.rage;
  const t = etat.temps / (220 - rage * 120) + etat.phase;
  const large = r * (0.98 + Math.sin(etat.temps / (300 - rage * 150) + etat.phase) * 0.05);
  ctx.save();
  ctx.shadowColor = '#ff1744';
  ctx.shadowBlur = 14;
  dessinerTentacules(cx, cy + r * 0.38, r, large, 7, t, color, 2.6, r * 0.8);
  tracerClocheMeduse(cx, cy, r, large, 6);
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#ff1744';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.35, large * 0.6, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  dessinerCouronneBoss(cx, cy - r * 0.82, r * 0.42, rage);
  dessinerVisageBoss(cx, cy - r * 0.05, r * 0.85, etat);
  ctx.restore();
}

// ------------------------------------------------------------
// Œil volant : globe veiné, l'iris suit le serpent, la paupière cligne
// ------------------------------------------------------------
function dessinerGlobeOeil(cx, cy, r, color, etat, couleurIris, colere) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fbf6ee';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
  ctx.fill();
  // veines, plus rouges en colère
  ctx.strokeStyle = colere ? 'rgba(229, 57, 53, 0.85)' : 'rgba(229, 57, 53, 0.4)';
  ctx.lineWidth = Math.max(0.6, r * 0.05);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3 + 0.4;
    ctx.moveTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8);
    ctx.lineTo(cx + Math.cos(a + 0.25) * r * 0.5, cy + Math.sin(a + 0.25) * r * 0.5);
  }
  ctx.stroke();
  const ix = cx + etat.regardX * r * 0.32, iy = cy + etat.regardY * r * 0.32;
  ctx.fillStyle = couleurIris;
  ctx.beginPath();
  ctx.arc(ix, iy, r * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = Math.max(0.6, r * 0.06);
  ctx.stroke();
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(ix, iy, r * (colere ? 0.11 : 0.19), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(ix - r * 0.12, iy - r * 0.12, r * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// paupière (de la couleur du corps) qui descend : fermeture de 0 (ouvert) à 1 (fermé)
function dessinerPaupiere(cx, cy, r, color, fermeture, froncee) {
  if (fermeture <= 0 && !froncee) return;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.beginPath();
  if (froncee) {
    // paupière en biais : regard méchant
    ctx.moveTo(cx - r, cy - r);
    ctx.lineTo(cx + r, cy - r);
    ctx.lineTo(cx + r, cy - r * 0.45);
    ctx.lineTo(cx - r, cy - r * 0.15);
  } else {
    ctx.rect(cx - r, cy - r, r * 2, r * 1.64 * fermeture);
  }
  ctx.fill();
  ctx.restore();
}

function dessinerEnnemiOeil(cx, cy, r, color, strokeColor, etat) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  dessinerGlobeOeil(cx, cy, r, color, etat, color, etat.colere);
  // clignement bref de temps en temps
  const cycle = (etat.temps / 2600 + etat.phase) % 1;
  const fermeture = cycle < 0.06 ? Math.sin((cycle / 0.06) * Math.PI) : 0;
  dessinerPaupiere(cx, cy, r, color, fermeture, etat.colere && fermeture === 0);
}

// œil géant entouré de petits yeux sur des tiges qui se tortillent
function dessinerBossOeil(cx, cy, radius, color, etat) {
  const r = radius;
  const rage = etat.rage;
  const t = etat.temps / (500 - rage * 300) + etat.phase;
  ctx.save();
  ctx.shadowColor = '#ff1744';
  ctx.shadowBlur = 14;
  // tiges translucides : hors de la zone de contact
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * 0.92 + i * (Math.PI * 0.84 / 5) + Math.sin(t * 2 + i) * 0.12;
    const ex = cx + Math.cos(a) * r * 1.45, ey = cy + Math.sin(a) * r * 1.45;
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85);
    ctx.quadraticCurveTo(cx + Math.cos(a + 0.3) * r * 1.2, cy + Math.sin(a + 0.3) * r * 1.2, ex, ey);
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#fbf6ee';
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d50000';
    ctx.beginPath();
    ctx.arc(ex + etat.regardX * r * 0.05, ey + etat.regardY * r * 0.05, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ff1744';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  dessinerGlobeOeil(cx, cy, r, color, etat, rage > 0.5 ? '#ff6d00' : '#ffd600', rage > 0.5);
  const cycle = (etat.temps / 3200 + etat.phase) % 1;
  dessinerPaupiere(cx, cy, r, color, cycle < 0.05 ? Math.sin((cycle / 0.05) * Math.PI) : 0, false);
  dessinerCouronneBoss(cx, cy - r * 0.98, r * 0.38, rage);
  ctx.restore();
}

// ------------------------------------------------------------
// Drone : boîtier arrondi, hélice qui tourne, écran avec des yeux pixel, voyant qui clignote
// ------------------------------------------------------------
function dessinerHelice(cx, haut, r, t) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(207, 216, 220, 0.75)';
  ctx.fillRect(cx - 1, haut - r * 0.2, 2, r * 0.22);
  const pale = r * 0.85 * Math.abs(Math.cos(t));
  ctx.fillRect(cx - pale, haut - r * 0.28, pale * 2, Math.max(1.2, r * 0.1));
  ctx.restore();
}

function dessinerEnnemiDrone(cx, cy, r, color, strokeColor, etat) {
  const s = r * 0.84;
  dessinerHelice(cx, cy - s, r, etat.temps / 35 + etat.phase);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(cx - s, cy - s, s * 2, s * 2, r * 0.35);
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.save();
  ctx.shadowBlur = 0;
  // reflet métallique en haut
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(cx - s * 0.7, cy - s * 0.85, s * 1.4, s * 0.2);
  // écran
  ctx.fillStyle = '#102027';
  ctx.beginPath();
  ctx.roundRect(cx - s * 0.72, cy - s * 0.5, s * 1.44, s * 0.8, r * 0.15);
  ctx.fill();
  const dx = Math.round(etat.regardX * 2) * s * 0.07, dy = Math.round(etat.regardY * 2) * s * 0.05;
  const oeil = s * 0.28;
  ctx.fillStyle = etat.colere ? '#ff1744' : '#00e5ff';
  [-1, 1].forEach(cote => {
    const x = cx + cote * s * 0.33 - oeil / 2 + dx, y = cy - s * 0.25 + dy;
    if (etat.colere) {
      // yeux en biais : sourcils froncés d'écran
      ctx.beginPath();
      ctx.moveTo(x, y + (cote < 0 ? 0 : oeil * 0.45));
      ctx.lineTo(x + oeil, y + (cote < 0 ? oeil * 0.45 : 0));
      ctx.lineTo(x + oeil, y + oeil);
      ctx.lineTo(x, y + oeil);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(x, y, oeil, oeil);
    }
  });
  // voyant qui clignote
  ctx.fillStyle = Math.sin(etat.temps / 160 + etat.phase) > 0 ? '#76ff03' : '#1b5e20';
  ctx.beginPath();
  ctx.arc(cx, cy + s * 0.62, Math.max(1.2, r * 0.12), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// mécha : bras canons sur les côtés, antenne, écran-visage qui s'énerve
function dessinerBossDrone(cx, cy, radius, color, etat) {
  const r = radius;
  const rage = etat.rage;
  const s = r * 0.88;
  ctx.save();
  ctx.shadowColor = '#ff1744';
  ctx.shadowBlur = 14;
  // bras et canons, translucides (hors zone de contact)
  ctx.globalAlpha = 0.8;
  const recul = Math.max(0, Math.sin(etat.temps / (260 - rage * 150) + etat.phase)) * r * 0.06;
  [-1, 1].forEach(cote => {
    ctx.fillStyle = '#78909c';
    ctx.fillRect(cote < 0 ? cx - s - r * 0.35 : cx + s, cy - r * 0.15, r * 0.35, r * 0.3);
    ctx.fillStyle = '#546e7a';
    ctx.beginPath();
    ctx.arc(cx + cote * (s + r * 0.42 - recul), cy, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rage > 0.5 ? '#ff6d00' : '#263238';
    ctx.beginPath();
    ctx.arc(cx + cote * (s + r * 0.5 - recul), cy, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  // antenne et sa lumière
  ctx.strokeStyle = '#b0bec5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.5, cy - s);
  ctx.lineTo(cx + s * 0.62, cy - s - r * 0.3);
  ctx.stroke();
  ctx.fillStyle = Math.sin(etat.temps / (200 - rage * 120)) > 0 ? '#ff1744' : '#4a0000';
  ctx.beginPath();
  ctx.arc(cx + s * 0.62, cy - s - r * 0.32, r * 0.07, 0, Math.PI * 2);
  ctx.fill();
  // corps
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ff1744';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - s, cy - s, s * 2, s * 2, r * 0.3);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.fillRect(cx - s * 0.75, cy - s * 0.88, s * 1.5, s * 0.16);
  // écran-visage
  ctx.fillStyle = '#1a0000';
  ctx.beginPath();
  ctx.roundRect(cx - s * 0.72, cy - s * 0.52, s * 1.44, s * 0.95, r * 0.12);
  ctx.fill();
  const couleurYeux = rage > 0.5 ? '#ff6d00' : '#ffee58';
  const dx = etat.regardX * s * 0.06, dy = etat.regardY * s * 0.05;
  ctx.fillStyle = couleurYeux;
  [-1, 1].forEach(cote => {
    ctx.beginPath();
    ctx.moveTo(cx + cote * s * 0.55 + dx, cy - s * 0.32 + dy);
    ctx.lineTo(cx + cote * s * 0.12 + dx, cy - s * (0.32 - rage * 0.12) + dy);
    ctx.lineTo(cx + cote * s * 0.12 + dx, cy - s * 0.12 + dy);
    ctx.lineTo(cx + cote * s * 0.55 + dx, cy - s * 0.12 + dy);
    ctx.closePath();
    ctx.fill();
  });
  const ouverture = (0.5 + Math.sin(etat.temps / (260 - rage * 160)) * 0.5) * (0.3 + rage * 0.7);
  ctx.fillRect(cx - s * 0.4, cy + s * 0.1, s * 0.8, s * (0.06 + ouverture * 0.18));
  // voyants de rage qui s'allument un à un
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = rage > i / 4 ? '#ff1744' : '#37474f';
    ctx.fillRect(cx - s * 0.55 + i * s * 0.32, cy + s * 0.62, s * 0.2, s * 0.14);
  }
  dessinerCouronneBoss(cx - s * 0.15, cy - s, r * 0.36, rage);
  ctx.restore();
}

// ------------------------------------------------------------
// Araignée : abdomen + tête, huit pattes fines qui marchent quand elle avance
// ------------------------------------------------------------
function dessinerPattesAraignee(cx, cy, r, couleur, epaisseur, pas, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = couleur;
  ctx.lineWidth = epaisseur;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  [-1, 1].forEach(cote => {
    for (let i = 0; i < 4; i++) {
      const bouge = (i % 2 ? 1 : -1) * cote * pas * r * 0.15;
      const ligne = i - 1.5;
      ctx.moveTo(cx + cote * r * 0.3, cy + ligne * r * 0.18);
      ctx.lineTo(cx + cote * r * 0.85, cy + ligne * r * 0.38 - r * 0.32 + bouge);
      ctx.lineTo(cx + cote * r * 1.12, cy + ligne * r * 0.45 + r * 0.12 + bouge);
    }
  });
  ctx.stroke();
  ctx.restore();
}

function dessinerEnnemiAraignee(cx, cy, r, color, strokeColor, etat) {
  const pas = etat.enMouvement ? Math.sin(etat.temps / 70 + etat.phase) : 0;
  dessinerPattesAraignee(cx, cy, r, color, 1.3, pas, 0.6);
  ctx.fillStyle = color;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.2, r * 0.74, r * 0.76, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.5, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.22, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  // crochets, plus longs en colère
  ctx.fillStyle = '#1a1a1a';
  const croc = etat.colere ? r * 0.22 : r * 0.12;
  ctx.beginPath();
  [-1, 1].forEach(cote => {
    ctx.moveTo(cx + cote * r * 0.16, cy - r * 0.2);
    ctx.lineTo(cx + cote * r * 0.04, cy - r * 0.2);
    ctx.lineTo(cx + cote * r * 0.08, cy - r * 0.2 + croc);
  });
  ctx.fill();
  // petits yeux en plus des deux grands
  ctx.fillStyle = etat.colere ? '#ff5252' : '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, cy - r * 0.72, r * 0.07, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.3, cy - r * 0.72, r * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  dessinerYeuxEnnemi(cx, cy - r * 0.52, r * 0.15, r * 0.13, etat);
}

// veuve noire : grosses pattes, sablier sur le dos, six yeux qui brûlent avec la rage
function dessinerBossAraignee(cx, cy, radius, color, etat) {
  const r = radius;
  const rage = etat.rage;
  const pas = Math.sin(etat.temps / (110 - rage * 60) + etat.phase);
  ctx.save();
  ctx.shadowColor = '#ff1744';
  ctx.shadowBlur = 14;
  dessinerPattesAraignee(cx, cy, r, color, 3, pas, 0.65);
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ff1744';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.2, r * 0.78, r * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.52, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  // sablier
  ctx.fillStyle = '#1a0000';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.22, cy - r * 0.05);
  ctx.lineTo(cx + r * 0.22, cy - r * 0.05);
  ctx.lineTo(cx, cy + r * 0.22);
  ctx.lineTo(cx + r * 0.22, cy + r * 0.5);
  ctx.lineTo(cx - r * 0.22, cy + r * 0.5);
  ctx.lineTo(cx, cy + r * 0.22);
  ctx.closePath();
  ctx.fill();
  // six yeux qui suivent le serpent
  const couleurYeux = rage > 0.5 ? '#ff6d00' : '#ffee58';
  [[-0.17, -0.6, 0.1], [0.17, -0.6, 0.1], [-0.3, -0.72, 0.06], [0.3, -0.72, 0.06], [-0.08, -0.78, 0.05], [0.08, -0.78, 0.05]]
    .forEach(([dx, dy, rr]) => {
      ctx.fillStyle = couleurYeux;
      ctx.beginPath();
      ctx.arc(cx + dx * r, cy + dy * r, rr * r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a0000';
      ctx.beginPath();
      ctx.arc(cx + dx * r + etat.regardX * rr * r * 0.4, cy + dy * r + etat.regardY * rr * r * 0.4, rr * r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });
  // chélicères qui claquent
  const ouverture = (0.5 + Math.sin(etat.temps / (240 - rage * 150)) * 0.5) * (0.3 + rage * 0.7);
  ctx.fillStyle = '#1a0000';
  [-1, 1].forEach(cote => {
    ctx.beginPath();
    ctx.moveTo(cx + cote * r * 0.2, cy - r * 0.25);
    ctx.lineTo(cx + cote * r * 0.06, cy - r * 0.25);
    ctx.lineTo(cx + cote * r * (0.06 + ouverture * 0.1), cy - r * 0.02);
    ctx.closePath();
    ctx.fill();
  });
  dessinerCouronneBoss(cx, cy - r * 0.9, r * 0.32, rage);
  ctx.restore();
}

// ------------------------------------------------------------
// Crabe : carapace large, yeux sur pédoncules, pinces qui claquent, pattes qui trottinent
// ------------------------------------------------------------
function dessinerPince(x, y, rp, angle, ouverture, couleur) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, rp, angle + ouverture, angle + Math.PI * 2 - ouverture);
  ctx.closePath();
  ctx.fillStyle = couleur;
  ctx.fill();
}

function dessinerPattesCrabe(cx, cy, r, couleur, epaisseur, pas, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = couleur;
  ctx.lineWidth = epaisseur;
  ctx.lineCap = 'round';
  ctx.beginPath();
  [-1, 1].forEach(cote => {
    for (let i = 0; i < 3; i++) {
      const bouge = (i % 2 ? 1 : -1) * pas * r * 0.1;
      ctx.moveTo(cx + cote * r * 0.6, cy + r * (0.15 + i * 0.2));
      ctx.lineTo(cx + cote * r * 0.98, cy + r * (0.05 + i * 0.22) + bouge);
      ctx.lineTo(cx + cote * r * 1.12, cy + r * (0.35 + i * 0.22) + bouge);
    }
  });
  ctx.stroke();
  ctx.restore();
}

function dessinerEnnemiCrabe(cx, cy, r, color, strokeColor, etat) {
  const pas = etat.enMouvement ? Math.sin(etat.temps / 60 + etat.phase) : 0;
  const ouverture = 0.15 + 0.45 * (0.5 + 0.5 * Math.sin(etat.temps / (etat.colere ? 80 : 260) + etat.phase));
  dessinerPattesCrabe(cx, cy, r, color, 1.3, pas, 0.55);
  // bras et pinces : un peu translucides, ils dépassent légèrement de la zone de contact
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, r * 0.16);
  ctx.beginPath();
  [-1, 1].forEach(cote => {
    ctx.moveTo(cx + cote * r * 0.55, cy - r * 0.15);
    ctx.lineTo(cx + cote * r * 0.7, cy - r * 0.6);
  });
  ctx.stroke();
  [-1, 1].forEach(cote => dessinerPince(cx + cote * r * 0.72, cy - r * 0.72, r * 0.25, -Math.PI / 2 + cote * 0.5, ouverture, color));
  ctx.restore();
  // pédoncules des yeux
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, r * 0.1);
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.22, cy - r * 0.35);
  ctx.lineTo(cx - r * 0.26, cy - r * 0.68);
  ctx.moveTo(cx + r * 0.22, cy - r * 0.35);
  ctx.lineTo(cx + r * 0.26, cy - r * 0.68);
  ctx.stroke();
  ctx.restore();
  // carapace
  ctx.fillStyle = color;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.15, r * 0.95, r * 0.66, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  [[-0.4, 0, 0.12], [0.35, -0.05, 0.1], [0, 0.35, 0.09]].forEach(([dx, dy, rr]) => {
    ctx.beginPath();
    ctx.arc(cx + dx * r, cy + dy * r, rr * r, 0, Math.PI * 2);
    ctx.fill();
  });
  // bouche
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.2, r * 0.18, 0.2, Math.PI - 0.2, etat.colere);
  ctx.stroke();
  ctx.restore();
  dessinerYeuxEnnemi(cx, cy - r * 0.74, r * 0.26, r * 0.16, etat);
}

// crabe géant : énormes pinces qui claquent de plus en plus vite, bulles de colère
function dessinerBossCrabe(cx, cy, radius, color, etat) {
  const r = radius;
  const rage = etat.rage;
  const pas = Math.sin(etat.temps / (120 - rage * 60) + etat.phase);
  const ouverture = 0.1 + 0.55 * (0.5 + 0.5 * Math.sin(etat.temps / (220 - rage * 140) + etat.phase));
  ctx.save();
  ctx.shadowColor = '#ff1744';
  ctx.shadowBlur = 14;
  dessinerPattesCrabe(cx, cy, r, color, 3, pas, 0.6);
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.16;
  ctx.beginPath();
  [-1, 1].forEach(cote => {
    ctx.moveTo(cx + cote * r * 0.6, cy - r * 0.1);
    ctx.lineTo(cx + cote * r * 0.85, cy - r * 0.6);
  });
  ctx.stroke();
  [-1, 1].forEach(cote => dessinerPince(cx + cote * r * 0.95, cy - r * 0.78, r * 0.36, -Math.PI / 2 + cote * 0.6, ouverture, color));
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.09;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.25, cy - r * 0.3);
  ctx.lineTo(cx - r * 0.3, cy - r * 0.62);
  ctx.moveTo(cx + r * 0.25, cy - r * 0.3);
  ctx.lineTo(cx + r * 0.3, cy - r * 0.62);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ff1744';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.15, r * 0.97, r * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  // yeux au bout des pédoncules
  const couleurYeux = rage > 0.5 ? '#ff6d00' : '#ffee58';
  [-1, 1].forEach(cote => {
    const ex = cx + cote * r * 0.3, ey = cy - r * 0.7;
    ctx.fillStyle = couleurYeux;
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a0000';
    ctx.beginPath();
    ctx.arc(ex + etat.regardX * r * 0.05, ey + etat.regardY * r * 0.05, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
  });
  // bouche qui bave des bulles quand il enrage
  const bouche = (0.5 + Math.sin(etat.temps / (260 - rage * 160)) * 0.5) * (0.3 + rage * 0.7);
  ctx.fillStyle = '#1a0000';
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.25, r * 0.28, r * (0.04 + bouche * 0.12), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const q = (etat.temps / (1000 - rage * 500) + i / 3) % 1;
    ctx.globalAlpha = (1 - q) * rage;
    ctx.beginPath();
    ctx.arc(cx + (i - 1) * r * 0.2 + Math.sin(q * 6 + i) * r * 0.05, cy + r * 0.2 - q * r * 0.5, r * 0.06, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  dessinerCouronneBoss(cx, cy - r * 0.48, r * 0.3, rage);
  ctx.restore();
}

// ------------------------------------------------------------
// Citrouille : côtes, tige, visage sculpté éclairé de l'intérieur, se dandine
// ------------------------------------------------------------
function tracerCotesCitrouille(cx, cy, r, cotes) {
  // côtes extérieures d'abord (assombries), côte centrale par-dessus
  const largeurs = cotes === 5 ? [[-0.6, 0.45], [0.6, 0.45], [-0.32, 0.5], [0.32, 0.5], [0, 0.52]] : [[-0.42, 0.55], [0.42, 0.55], [0, 0.56]];
  return largeurs.map(([dx, rx]) => ({x: cx + dx * r, rx: rx * r, centrale: dx === 0}));
}

function dessinerCorpsCitrouille(cx, cy, r, color, strokeColor, cotes) {
  tracerCotesCitrouille(cx, cy, r, cotes).forEach(c => {
    ctx.beginPath();
    ctx.ellipse(c.x, cy + r * 0.05, c.rx, r * (c.centrale ? 0.9 : 0.84), 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (!c.centrale) voilerTrace(0.18);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

function dessinerVisageCitrouille(cx, cy, r, etat, couleur, rage) {
  const dx = etat.regardX * r * 0.07, dy = etat.regardY * r * 0.05;
  ctx.save();
  ctx.beginPath();
  [-1, 1].forEach(cote => {
    ctx.moveTo(cx + cote * r * 0.6 + dx, cy + r * 0.02 + dy);
    ctx.lineTo(cx + cote * r * 0.1 + dx, cy + r * 0.02 + dy);
    ctx.lineTo(cx + cote * r * 0.35 + dx, cy - r * (0.45 + rage * 0.1) + dy);
    ctx.closePath();
  });
  // bouche en dents de scie
  const ouverture = r * (0.16 + rage * 0.12);
  ctx.moveTo(cx - r * 0.55, cy + r * 0.25);
  for (let i = 1; i <= 6; i++) ctx.lineTo(cx - r * 0.55 + i * r * 0.183, cy + r * 0.25 + (i % 2 ? r * 0.1 : 0));
  ctx.lineTo(cx + r * 0.42, cy + r * 0.25 + ouverture);
  for (let i = 5; i >= 1; i--) ctx.lineTo(cx - r * 0.55 + i * r * 0.183, cy + r * 0.25 + ouverture + (i % 2 ? -r * 0.08 : 0));
  ctx.lineTo(cx - r * 0.42, cy + r * 0.25 + ouverture);
  ctx.closePath();
  // creux sculpté sombre, puis la lueur de la bougie par-dessus
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#1a0a12';
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = '#1a0a12';
  ctx.fill();
  ctx.shadowColor = couleur;
  ctx.shadowBlur = 8;
  ctx.fillStyle = couleur;
  ctx.fill();
  ctx.restore();
}

function dessinerEnnemiCitrouille(cx, cy, r, color, strokeColor, etat) {
  const balance = Math.sin(etat.temps / 300 + etat.phase) * (etat.enMouvement ? 0.1 : 0.04);
  ctx.save();
  ctx.translate(cx, cy + r * 0.9);
  ctx.rotate(balance);
  ctx.translate(-cx, -(cy + r * 0.9));
  // tige
  ctx.fillStyle = '#558b2f';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.1, cy - r * 0.7);
  ctx.quadraticCurveTo(cx - r * 0.05, cy - r * 1.0, cx + r * 0.15, cy - r * 1.05);
  ctx.lineTo(cx + r * 0.12, cy - r * 0.7);
  ctx.closePath();
  ctx.fill();
  dessinerCorpsCitrouille(cx, cy, r, color, strokeColor, 3);
  // la bougie vacille ; en colère, le visage s'embrase
  const vacille = 0.75 + Math.sin(etat.temps / 70 + etat.phase * 5) * 0.12 + Math.sin(etat.temps / 23) * 0.08;
  const lueur = etat.colere ? `rgba(255, 61, 0, ${vacille})` : `rgba(255, 213, 79, ${vacille})`;
  dessinerVisageCitrouille(cx, cy, r, etat, lueur, etat.colere ? 0.6 : 0);
  ctx.restore();
}

// roi citrouille : cinq côtes, lianes qui s'enroulent, visage de plus en plus embrasé, couronne
function dessinerBossCitrouille(cx, cy, radius, color, etat) {
  const r = radius;
  const rage = etat.rage;
  ctx.save();
  ctx.shadowColor = '#ff1744';
  ctx.shadowBlur = 14;
  // lianes translucides (hors zone de contact)
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = '#7cb342';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  [-1, 1].forEach(cote => {
    const t = etat.temps / (600 - rage * 300) + etat.phase + cote;
    ctx.beginPath();
    ctx.moveTo(cx + cote * r * 0.15, cy - r * 0.85);
    ctx.bezierCurveTo(cx + cote * r * 0.8, cy - r * 1.35, cx + cote * r * 1.3, cy - r * 0.6 + Math.sin(t) * r * 0.2,
      cx + cote * r * 1.15, cy - r * 0.1 + Math.sin(t) * r * 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + cote * r * 1.15, cy - r * 0.1 + Math.sin(t) * r * 0.15 + r * 0.1, r * 0.1, -Math.PI / 2, Math.PI);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#558b2f';
  ctx.fillRect(cx - r * 0.1, cy - r * 1.02, r * 0.2, r * 0.3);
  dessinerCorpsCitrouille(cx, cy, r, color, '#ff1744', 5);
  ctx.shadowBlur = 0;
  const vacille = 0.8 + Math.sin(etat.temps / (70 - rage * 35)) * 0.15;
  dessinerVisageCitrouille(cx, cy, r, etat, rage > 0.5 ? `rgba(255, 109, 0, ${vacille})` : `rgba(255, 238, 88, ${vacille})`, rage);
  dessinerCouronneBoss(cx, cy - r * 0.95, r * 0.4, rage);
  ctx.restore();
}

// ------------------------------------------------------------
// Champignon : chapeau à pois, pied avec deux yeux, se dandine et lâche des spores
// ------------------------------------------------------------
function couleurPiedChampignon(color) {
  // pied crème, sauf pendant un flash blanc ou le gel (même teinte que le chapeau)
  return color === '#ffffff' || color === '#80d8ff' ? color : '#efe3c6';
}

function tracerChapeau(cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx - r, cy + r * 0.05);
  ctx.bezierCurveTo(cx - r * 1.05, cy - r * 1.18, cx + r * 1.05, cy - r * 1.18, cx + r, cy + r * 0.05);
  ctx.quadraticCurveTo(cx, cy - r * 0.18, cx - r, cy + r * 0.05);
  ctx.closePath();
}

function dessinerSpores(cx, cy, r, n, temps, phase, vitesse, alpha) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#f0f4c3';
  for (let i = 0; i < n; i++) {
    const q = (temps / vitesse + i / n + phase) % 1;
    ctx.globalAlpha = (1 - q) * alpha;
    ctx.beginPath();
    ctx.arc(cx + Math.sin(i * 2.4 + phase) * r * 0.65 + Math.sin(q * 5 + i) * r * 0.1, cy - r * 0.75 - q * r * 0.55,
      Math.max(0.8, r * 0.06), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function dessinerPoisChampignon(cx, cy, r) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  [[-0.45, -0.45, 0.17], [0.2, -0.62, 0.14], [0.55, -0.25, 0.12], [-0.1, -0.25, 0.1], [-0.72, -0.12, 0.08]].forEach(([dx, dy, rr]) => {
    ctx.beginPath();
    ctx.arc(cx + dx * r, cy + dy * r, rr * r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function dessinerEnnemiChampignon(cx, cy, r, color, strokeColor, etat) {
  const dandine = etat.enMouvement ? Math.sin(etat.temps / 120 + etat.phase) * 0.14 : Math.sin(etat.temps / 600 + etat.phase) * 0.04;
  dessinerSpores(cx, cy, r, 3, etat.temps, etat.phase, 1600, 0.55);
  ctx.save();
  ctx.translate(cx, cy + r * 0.9);
  ctx.rotate(dandine);
  ctx.translate(-cx, -(cy + r * 0.9));
  ctx.fillStyle = couleurPiedChampignon(color);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(cx - r * 0.42, cy - r * 0.15, r * 0.84, r * 1.05, r * 0.3);
  ctx.fill();
  ctx.stroke();
  tracerChapeau(cx, cy, r);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  dessinerPoisChampignon(cx, cy, r);
  dessinerYeuxEnnemi(cx, cy + r * 0.3, r * 0.17, r * 0.13, etat);
  ctx.restore();
}

// champignon géant : nuage de spores qui grossit avec la rage, visage sur le pied, couronne
function dessinerBossChampignon(cx, cy, radius, color, etat) {
  const r = radius;
  const rage = etat.rage;
  const dandine = Math.sin(etat.temps / (500 - rage * 300) + etat.phase) * (0.04 + rage * 0.06);
  ctx.save();
  dessinerSpores(cx, cy, r, 6 + Math.round(rage * 8), etat.temps, etat.phase, 1800 - rage * 900, 0.5 + rage * 0.3);
  ctx.translate(cx, cy + r * 0.9);
  ctx.rotate(dandine);
  ctx.translate(-cx, -(cy + r * 0.9));
  ctx.shadowColor = '#ff1744';
  ctx.shadowBlur = 14;
  ctx.fillStyle = couleurPiedChampignon(color);
  ctx.strokeStyle = '#ff1744';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - r * 0.48, cy - r * 0.15, r * 0.96, r * 1.05, r * 0.3);
  ctx.fill();
  ctx.stroke();
  tracerChapeau(cx, cy, r);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  dessinerPoisChampignon(cx, cy, r);
  dessinerVisageBoss(cx, cy + r * 0.38, r * 0.7, etat);
  dessinerCouronneBoss(cx, cy - r * 0.84, r * 0.38, rage);
  ctx.restore();
}

// skin -> dessin d'un ennemi normal (les skins d'origine sont appelés directement dans drawEnemies)
const dessinsSkins = {
  jelly: dessinerEnnemiMeduse,
  eye: dessinerEnnemiOeil,
  drone: dessinerEnnemiDrone,
  spider: dessinerEnnemiAraignee,
  crab: dessinerEnnemiCrabe,
  pumpkin: dessinerEnnemiCitrouille,
  mushroom: dessinerEnnemiChampignon
};
