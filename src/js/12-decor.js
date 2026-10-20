function drawBackgroundPattern() {
  // grille de points subtile, légèrement animée pour donner de la profondeur au fond ;
  // dessinée une seule fois par thème dans un canvas en mémoire puis simplement décalée
  const spacing = gridSize;
  const drift = (performance.now() / 3000) % spacing;
  const largeurFond = largeurPlateau + spacing * 2, hauteurFond = hauteurPlateau + spacing * 2;
  if (!fondCache || fondCacheTheme !== currentThemeName || fondCache.echelle !== echelleRendu) {
    fondCache = creerCalque(largeurFond, hauteurFond);
    dessinerFondTheme(fondCache.getContext('2d'), largeurFond, hauteurFond, spacing);
    fondCacheTheme = currentThemeName;
  }
  poserCalque(fondCache, -spacing + drift, -spacing + drift);

  // lave : la lumière des fissures pulse doucement
  if (currentThemeName === 'lave') {
    if (!lueurLaveCache || lueurLaveCache.echelle !== echelleRendu) lueurLaveCache = creerVignette('rgba(255, 61, 0, 0.18)', 'rgba(255, 61, 0, 0)');
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 900) * 0.5;
    poserCalque(lueurLaveCache, 0, 0);
    ctx.restore();
  }

  // vignette : bords légèrement assombris pour donner de la profondeur
  if (!vignetteCache || vignetteCache.echelle !== echelleRendu) {
    vignetteCache = creerVignette('rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.45)');
  }
  poserCalque(vignetteCache, 0, 0);
}

// dessine le décor fixe du thème (appelé une seule fois par thème, dans le canvas en mémoire)
function dessinerFondTheme(fctx, w, h, spacing) {
  const theme = currentThemeName;
  const hasard = (() => { let g = 12345; return () => (g = (g * 16807) % 2147483647) / 2147483647; })();
  if (mondesSupp[theme]) {
    mondesSupp[theme].fond(fctx, w, h, hasard);
    return;
  }

  if (theme === 'espace') {
    // nébuleuses colorées + champ d'étoiles fixes
    [['rgba(124, 77, 255, 0.22)', 0.25, 0.3, 0.45], ['rgba(64, 196, 255, 0.16)', 0.75, 0.65, 0.4], ['rgba(255, 64, 129, 0.10)', 0.6, 0.15, 0.3]]
      .forEach(([couleur, cx, cy, r]) => {
        const g = fctx.createRadialGradient(w * cx, h * cy, 0, w * cx, h * cy, w * r);
        g.addColorStop(0, couleur);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        fctx.fillStyle = g;
        fctx.fillRect(0, 0, w, h);
      });
    fctx.fillStyle = '#ffffff';
    for (let i = 0; i < 140; i++) {
      fctx.globalAlpha = 0.15 + hasard() * 0.6;
      const r = hasard() < 0.9 ? 0.6 : 1.3;
      fctx.beginPath();
      fctx.arc(hasard() * w, hasard() * h, r, 0, Math.PI * 2);
      fctx.fill();
    }
    fctx.globalAlpha = 1;
  } else if (theme === 'lave') {
    // roche sombre avec des fissures de lave incandescentes
    const g = fctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#120403');
    g.addColorStop(1, '#2a0904');
    fctx.fillStyle = g;
    fctx.fillRect(0, 0, w, h);
    fctx.lineCap = 'round';
    fctx.lineJoin = 'round';
    pointsFissuresLave = [];
    for (let i = 0; i < 9; i++) {
      let x = hasard() * w, y = hasard() * h;
      const pts = [[x, y]];
      let angle = hasard() * Math.PI * 2;
      for (let k = 0; k < 6; k++) {
        angle += (hasard() - 0.5) * 1.4;
        x += Math.cos(angle) * (18 + hasard() * 22);
        y += Math.sin(angle) * (18 + hasard() * 22);
        pts.push([x, y]);
      }
      pts.forEach(pt => pointsFissuresLave.push(pt));
      [[6, 'rgba(255, 61, 0, 0.18)'], [3, 'rgba(255, 109, 0, 0.45)'], [1.2, 'rgba(255, 213, 79, 0.8)']].forEach(([largeur, couleur]) => {
        fctx.strokeStyle = couleur;
        fctx.lineWidth = largeur;
        fctx.beginPath();
        pts.forEach(([px, py], j) => (j ? fctx.lineTo(px, py) : fctx.moveTo(px, py)));
        fctx.stroke();
      });
    }
  } else if (theme === 'ocean') {
    // dégradé des profondeurs + rayons de lumière venant de la surface
    const g = fctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#05415e');
    g.addColorStop(1, '#010d17');
    fctx.fillStyle = g;
    fctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      const x = hasard() * w;
      const largeur = 20 + hasard() * 40;
      const rayon = fctx.createLinearGradient(0, 0, 0, h);
      rayon.addColorStop(0, 'rgba(178, 235, 242, 0.12)');
      rayon.addColorStop(1, 'rgba(178, 235, 242, 0)');
      fctx.fillStyle = rayon;
      fctx.beginPath();
      fctx.moveTo(x, 0);
      fctx.lineTo(x + largeur, 0);
      fctx.lineTo(x + largeur - 60, h);
      fctx.lineTo(x - 90, h);
      fctx.closePath();
      fctx.fill();
    }
    // sable et algues au fond
    fctx.fillStyle = 'rgba(255, 224, 178, 0.08)';
    fctx.fillRect(0, h - 26, w, 26);
  } else {
    // néon : grille de points subtile
    fctx.globalAlpha = 0.12;
    fctx.fillStyle = currentTheme.accent;
    fctx.beginPath();
    for (let x = 0; x < w; x += spacing) {
      for (let y = 0; y < h; y += spacing) {
        fctx.moveTo(x + 1.5, y);
        fctx.arc(x, y, 1.5, 0, Math.PI * 2);
      }
    }
    fctx.fill();
    fctx.globalAlpha = 1;
  }
}

// --- Décor animé du fond ---
// sprite dessiné une seule fois puis réutilisé (nom unique par thème)
// (plus fin sur grand écran : c.lw / c.lh gardent sa taille dans les coordonnées du plateau)
function spriteDecor(nom, largeur, hauteur, dessiner) {
  if (!spritesDecor[nom] || spritesDecor[nom].echelle !== echelleRendu) {
    const c = creerCalque(largeur, hauteur);
    dessiner(c.getContext('2d'), largeur, hauteur);
    spritesDecor[nom] = c;
  }
  return spritesDecor[nom];
}

// anime le fond selon le thème ; figé en pause, ralenti pendant le ralenti
function dessinerDecorAnime() {
  const now = performance.now();
  const d = decorAnime;
  const w = largeurPlateau, h = hauteurPlateau;
  if (d.theme !== currentThemeName) {
    d.theme = currentThemeName;
    d.elements = [];
    d.temps = 0;
    d.prochain = 0;
    d.prochain2 = 0;
    d.derniereMaj = now;
    d.algues = [];
    if (currentThemeName === 'ocean') {
      for (let i = 0; i < 11; i++) {
        d.algues.push({x: (i + 0.5) / 11 * w + (Math.random() - 0.5) * 25, haut: 25 + Math.random() * 50, phase: Math.random() * Math.PI * 2});
      }
    }
  }
  let dt = Math.min(50, now - d.derniereMaj);
  d.derniereMaj = now;
  if (isPaused) dt = 0;
  if (enRalenti()) dt *= slowMotionFactor;
  d.temps += dt;
  d.dt = dt;

  ctx.save();
  if (mondesSupp[currentThemeName]) mondesSupp[currentThemeName].decor(d, w, h);
  else if (currentThemeName === 'espace') decorEspace(d, w, h);
  else if (currentThemeName === 'lave') decorLave(d, w, h);
  else if (currentThemeName === 'ocean') decorOcean(d, w, h);
  else decorNeon(d, w, h);
  ctx.restore();
  d.elements = d.elements.filter(e => !e.fini);
}

// néon : bande de balayage, ondes qui partent de la grille, traits lumineux sur les lignes
function decorNeon(d, w, h) {
  const accent = currentTheme.accent;
  const bande = spriteDecor('neon-bande', w, 80, (c, bw, bh) => {
    const g = c.createLinearGradient(0, 0, 0, bh);
    g.addColorStop(0, 'rgba(0, 0, 0, 0)');
    g.addColorStop(0.5, accent);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    c.fillStyle = g;
    c.fillRect(0, 0, bw, bh);
  });
  ctx.globalAlpha = 0.09;
  poserCalque(bande, 0, (d.temps / 14) % (h + 160) - 80);

  const drift = (performance.now() / 3000) % gridSize;
  if (d.temps >= d.prochain) {
    d.prochain = d.temps + 900 + Math.random() * 700;
    d.elements.push({type: 'onde', debut: d.temps, duree: 1600,
      x: Math.floor(Math.random() * tileCount) * gridSize, y: Math.floor(Math.random() * tileCount) * gridSize});
  }
  if (d.temps >= d.prochain2) {
    d.prochain2 = d.temps + 1200 + Math.random() * 1200;
    d.elements.push({type: 'trait', debut: d.temps, duree: 1400, horizontal: Math.random() < 0.5,
      pos: Math.floor(Math.random() * tileCount) * gridSize, sens: Math.random() < 0.5 ? 1 : -1});
  }
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  ctx.lineCap = 'round';
  d.elements.forEach(e => {
    const p = (d.temps - e.debut) / e.duree;
    if (p >= 1) { e.fini = true; return; }
    if (e.type === 'onde') {
      ctx.globalAlpha = 0.45 * (1 - p);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x + drift, e.y + drift, 4 + p * 55, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const longueur = e.horizontal ? w : h;
      let c = -60 + p * (longueur + 120);
      if (e.sens < 0) c = longueur - c;
      const fin = c - 50 * e.sens;
      const fixe = e.pos + drift;
      ctx.globalAlpha = 0.5 * Math.sin(p * Math.PI);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (e.horizontal) { ctx.moveTo(fin, fixe); ctx.lineTo(c, fixe); }
      else { ctx.moveTo(fixe, fin); ctx.lineTo(fixe, c); }
      ctx.stroke();
      ctx.globalAlpha *= 1.6;
      ctx.beginPath();
      if (e.horizontal) ctx.arc(c, fixe, 2.2, 0, Math.PI * 2);
      else ctx.arc(fixe, c, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// espace : planète à anneau avec sa lune, galaxie qui tourne, étoiles filantes
function decorEspace(d, w, h) {
  const t = d.temps;
  const galaxie = spriteDecor('espace-galaxie', 90, 90, (c) => {
    const g = c.createRadialGradient(45, 45, 0, 45, 45, 14);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    g.addColorStop(1, 'rgba(179, 157, 219, 0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 90, 90);
    for (let bras = 0; bras < 2; bras++) {
      for (let i = 0; i < 70; i++) {
        const r = 4 + i * 0.58;
        const a = i * 0.16 + bras * Math.PI;
        c.globalAlpha = 0.8 * (1 - i / 70);
        c.fillStyle = i % 3 ? '#b39ddb' : '#80d8ff';
        c.beginPath();
        c.arc(45 + Math.cos(a) * r, 45 + Math.sin(a) * r, 1.4 - i / 100, 0, Math.PI * 2);
        c.fill();
      }
    }
  });
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.translate(w * 0.2, h * 0.78);
  ctx.scale(1, 0.55);
  ctx.rotate(t / 20000);
  poserCalque(galaxie, -45, -45);
  ctx.restore();

  const planete = spriteDecor('espace-planete', 100, 100, (c) => {
    const g = c.createRadialGradient(42, 42, 3, 50, 50, 26);
    g.addColorStop(0, '#d1c4e9');
    g.addColorStop(0.6, '#5e35b1');
    g.addColorStop(1, '#1a0f3d');
    c.fillStyle = g;
    c.beginPath();
    c.arc(50, 50, 24, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(206, 147, 216, 0.75)';
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(50, 50, 44, 9, -0.35, 0, Math.PI * 2);
    c.stroke();
  });
  const px = w * 0.8, py = h * 0.2 + Math.sin(t / 3000) * 3;
  const angleLune = t / 5000;
  const lx = px + Math.cos(angleLune) * 58, ly = py + Math.sin(angleLune) * 18;
  const dessinerLune = () => {
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fill();
  };
  if (Math.sin(angleLune) < 0) dessinerLune(); // la lune passe derrière la planète
  ctx.globalAlpha = 0.55;
  poserCalque(planete, px - 50, py - 50);
  if (Math.sin(angleLune) >= 0) dessinerLune();

  if (t >= d.prochain) {
    d.prochain = t + 2500 + Math.random() * 2500;
    const sens = Math.random() < 0.5 ? 1 : -1;
    const angle = 0.45 + Math.random() * 0.35;
    d.elements.push({debut: t, duree: 750, x: w * (sens > 0 ? 0.05 + Math.random() * 0.5 : 0.45 + Math.random() * 0.5),
      y: Math.random() * h * 0.35, dx: Math.cos(angle) * sens, dy: Math.sin(angle)});
  }
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.6;
  d.elements.forEach(e => {
    const p = (t - e.debut) / e.duree;
    if (p >= 1) { e.fini = true; return; }
    const parcouru = p * 260;
    const tx = e.x + e.dx * parcouru, ty = e.y + e.dy * parcouru;
    const queue = 55;
    const g = ctx.createLinearGradient(tx - e.dx * queue, ty - e.dy * queue, tx, ty);
    g.addColorStop(0, 'rgba(255, 255, 255, 0)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0.9)');
    ctx.globalAlpha = Math.sin(p * Math.PI);
    ctx.strokeStyle = g;
    ctx.beginPath();
    ctx.moveTo(tx - e.dx * queue, ty - e.dy * queue);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  });
}

// lave : bulles qui gonflent et éclatent sur les fissures, chaleur qui monte du bas
function decorLave(d, w, h) {
  const t = d.temps;
  const chaleur = spriteDecor('lave-chaleur', w, 90, (c, cw, ch) => {
    const g = c.createLinearGradient(0, ch, 0, 0);
    g.addColorStop(0, 'rgba(255, 87, 34, 0.35)');
    g.addColorStop(1, 'rgba(255, 87, 34, 0)');
    c.fillStyle = g;
    c.fillRect(0, 0, cw, ch);
  });
  ctx.globalAlpha = 0.55 + Math.sin(t / 1300) * 0.45;
  poserCalque(chaleur, 0, h - 90);

  const decalage = -gridSize + (performance.now() / 3000) % gridSize; // suit le léger glissement du fond
  if (t >= d.prochain && pointsFissuresLave.length && d.elements.length < 7) {
    d.prochain = t + 220 + Math.random() * 300;
    for (let essai = 0; essai < 4; essai++) {
      const pt = pointsFissuresLave[Math.floor(Math.random() * pointsFissuresLave.length)];
      const x = pt[0] + decalage, y = pt[1] + decalage;
      if (x > 6 && x < w - 6 && y > 6 && y < h - 6) {
        d.elements.push({debut: t, duree: 1100, x: pt[0], y: pt[1], taille: 3.5 + Math.random() * 3.5});
        break;
      }
    }
  }
  d.elements.forEach(e => {
    const p = (t - e.debut) / e.duree;
    if (p >= 1) { e.fini = true; return; }
    const x = e.x + decalage, y = e.y + decalage;
    if (p < 0.75) {
      const r = e.taille * (p / 0.75);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#ff9100';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // éclatement : anneau + petites gouttes projetées
      const q = (p - 0.75) / 0.25;
      ctx.globalAlpha = (1 - q) * 0.7;
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, e.taille * (1 + q * 1.8), 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ff6d00';
      for (let k = 0; k < 4; k++) {
        const a = -Math.PI / 2 + (k - 1.5) * 0.7;
        const dist = q * e.taille * 3;
        ctx.fillRect(x + Math.cos(a) * dist - 0.75, y + Math.sin(a) * dist + q * q * 4 - 0.75, 1.5, 1.5);
      }
    }
  });
}

// océan : rayons de lumière qui ondulent, algues qui se balancent, bancs de poissons, méduse
function decorOcean(d, w, h) {
  const t = d.temps;
  const rayon = spriteDecor('ocean-rayon', 160, h, (c, rw, rh) => {
    const g = c.createLinearGradient(0, 0, 0, rh);
    g.addColorStop(0, 'rgba(178, 235, 242, 0.14)');
    g.addColorStop(1, 'rgba(178, 235, 242, 0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(90, 0);
    c.lineTo(125, 0);
    c.lineTo(160, rh);
    c.lineTo(40, rh);
    c.closePath();
    c.fill();
  });
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t / 1700 + i * 2.1);
    poserCalque(rayon, w * (0.05 + i * 0.32) - 80 + Math.sin(t / 4000 + i) * 18, 0);
  }

  // algues : une seule trace pour toutes, l'ondulation grandit vers le haut
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(29, 233, 182, 0.24)';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  d.algues.forEach(a => {
    const balance = Math.sin(t / 1100 + a.phase) * a.haut * 0.2;
    ctx.moveTo(a.x, h);
    ctx.quadraticCurveTo(a.x + 8 + balance * 0.4, h - a.haut / 2, a.x - 3 + balance, h - a.haut);
  });
  ctx.stroke();

  const poisson = spriteDecor('ocean-poisson', 16, 10, (c) => {
    c.fillStyle = '#80deea';
    c.beginPath();
    c.ellipse(9, 5, 6, 3, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(4, 5);
    c.lineTo(0, 1);
    c.lineTo(0, 9);
    c.closePath();
    c.fill();
  });
  if (t >= d.prochain) {
    d.prochain = t + 7000 + Math.random() * 5000;
    const membres = [];
    for (let i = 0; i < 5; i++) membres.push({dx: -i * 14 - Math.random() * 6, dy: (Math.random() - 0.5) * 26, phase: Math.random() * 6});
    d.elements.push({type: 'banc', debut: t, y: h * 0.15 + Math.random() * h * 0.5, sens: Math.random() < 0.5 ? 1 : -1, membres});
  }
  if (!d.elements.some(e => e.type === 'meduse') && t >= d.prochain2) {
    d.elements.push({type: 'meduse', x: w * (0.15 + Math.random() * 0.7), y: h + 30, phase: Math.random() * 6});
  }
  d.elements.forEach(e => {
    if (e.type === 'banc') {
      const avance = (t - e.debut) * 0.06;
      const xTete = e.sens > 0 ? -20 + avance : w + 20 - avance;
      if (avance > w + 140) { e.fini = true; return; }
      ctx.globalAlpha = 0.3;
      e.membres.forEach(m => {
        ctx.save();
        ctx.translate(xTete + m.dx * e.sens, e.y + m.dy + Math.sin(t / 300 + m.phase) * 1.5);
        ctx.scale(e.sens, 1);
        poserCalque(poisson, -8, -5);
        ctx.restore();
      });
    } else {
      // méduse : remonte par à-coups à chaque contraction
      const contraction = Math.max(0, Math.sin(t / 450 + e.phase));
      e.y -= (0.004 + contraction * 0.02) * d.dt;
      e.x += Math.sin(t / 2500 + e.phase) * 0.004 * d.dt;
      if (e.y < -40) { e.fini = true; d.prochain2 = t + 3000 + Math.random() * 4000; return; }
      const largeur = 9 * (1 - contraction * 0.18);
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#f48fb1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        const bx = e.x - largeur * 0.6 + k * largeur * 0.4;
        ctx.moveTo(bx, e.y);
        ctx.quadraticCurveTo(bx + Math.sin(t / 260 + k) * 3, e.y + 8, bx + Math.sin(t / 260 + k + 1) * 2, e.y + 16 + contraction * 3);
      }
      ctx.stroke();
      ctx.fillStyle = '#ea80fc';
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, largeur, 7, 0, Math.PI, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }
  });
}

// canvas en mémoire avec un dégradé radial du centre (couleurCentre) vers les bords (couleurBord)
function creerVignette(couleurCentre, couleurBord) {
  const c = creerCalque(largeurPlateau, hauteurPlateau);
  const vctx = c.getContext('2d');
  const w = largeurPlateau, h = hauteurPlateau;
  const grad = vctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) / 2);
  grad.addColorStop(0, couleurCentre);
  grad.addColorStop(1, couleurBord);
  vctx.fillStyle = grad;
  vctx.fillRect(0, 0, w, h);
  return c;
}

