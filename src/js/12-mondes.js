// ============================================================
// --- Mondes ajoutés : Aurore glacée, Forêt enchantée, Désert, Synthwave, Halloween ---
// ============================================================
// Chaque monde fournit son fond fixe (dessiné une fois), son décor animé, ses particules d'ambiance,
// ses trois pommes (même taille de collision qu'ailleurs) et ses tirs. Les fonctions de dessin du jeu
// (fichiers 09, 11, 12 et 13) passent par ici quand le thème actuel est dans mondesSupp ;
// les quatre mondes d'origine gardent leur propre code.

// dégradé vertical sur toute la hauteur
function degradeVertical(c, h, couleurs) {
  const g = c.createLinearGradient(0, 0, 0, h);
  couleurs.forEach((couleur, i) => g.addColorStop(i / (couleurs.length - 1), couleur));
  return g;
}

// halo rond qui s'efface vers l'extérieur (lueurs, brume, soleil)
function halo(c, x, y, r, couleur, alpha) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, couleur);
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
}

// tourne le repère dans le sens du tir (les tirs allongés pointent vers l'avant)
function orienterTir(p) {
  ctx.translate(p.x, p.y);
  ctx.rotate(Math.atan2(p.vy, p.vx));
}

// trace un losange allongé (éclat, graine) centré sur l'origine
function tracerLosange(c, longueur, largeur) {
  c.beginPath();
  c.moveTo(longueur * 0.6, 0);
  c.lineTo(0, -largeur);
  c.lineTo(-longueur * 0.4, 0);
  c.lineTo(0, largeur);
  c.closePath();
}

// ------------------------------------------------------------
// Aurore glacée : nuit polaire, aurore boréale qui ondule, neige, banquise
// ------------------------------------------------------------
const mondeAurore = {
  couleurLaser: '#e1f5fe',
  fond(c, w, h, hasard) {
    c.fillStyle = degradeVertical(c, h, ['#06142e', '#0a2342', '#0d2f52']);
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#e3f2fd';
    for (let i = 0; i < 90; i++) {
      c.globalAlpha = 0.1 + hasard() * 0.45;
      c.beginPath();
      c.arc(hasard() * w, hasard() * h * 0.7, hasard() < 0.9 ? 0.6 : 1.2, 0, Math.PI * 2);
      c.fill();
    }
    // givre : grille de petits points
    c.globalAlpha = 0.09;
    c.fillStyle = '#b3e5fc';
    c.beginPath();
    for (let x = 0; x < w; x += gridSize) {
      for (let y = 0; y < h; y += gridSize) {
        c.moveTo(x + 1.2, y);
        c.arc(x, y, 1.2, 0, Math.PI * 2);
      }
    }
    c.fill();
    c.globalAlpha = 1;
  },
  decor(d, w, h) {
    const t = d.temps;
    // trois rubans d'aurore qui ondulent lentement
    [['rgba(0, 255, 170, 0.32)', 0.1, 0], ['rgba(124, 77, 255, 0.26)', 0.2, 2.1], ['rgba(0, 200, 255, 0.24)', 0.3, 4.2]]
      .forEach(([couleur, y, ph], k) => {
        const y0 = h * y;
        const haut = x => y0 + Math.sin(x / 70 + t / (2300 + k * 500) + ph) * 16 + Math.sin(x / 23 + t / 900 + ph) * 3;
        const g = ctx.createLinearGradient(0, y0 - 20, 0, y0 + 60);
        g.addColorStop(0, couleur);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalAlpha = 0.6 + Math.sin(t / 3100 + ph) * 0.3;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, haut(0));
        for (let x = 10; x <= w; x += 10) ctx.lineTo(x, haut(x));
        for (let x = w; x >= 0; x -= 20) ctx.lineTo(x, haut(x) + 45 + Math.sin(x / 50 + t / 1500 + ph) * 12);
        ctx.closePath();
        ctx.fill();
      });
    // banquise au bas de la carte
    const banquise = spriteDecor('aurore-banquise', w, 34, (c, bw, bh) => {
      c.fillStyle = 'rgba(207, 239, 255, 0.16)';
      c.strokeStyle = 'rgba(225, 245, 254, 0.35)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, bh);
      let y = 14;
      c.lineTo(0, y);
      for (let x = 0; x <= bw; x += 26) {
        y = 8 + ((x * 7) % 13);
        c.lineTo(x, y);
      }
      c.lineTo(bw, bh);
      c.closePath();
      c.fill();
      c.stroke();
    });
    ctx.globalAlpha = 1;
    poserCalque(banquise, 0, h - banquise.lh);
  },
  creerParticule(p, depuisBord) {
    // flocons qui tombent en se balançant
    p.vx = 0;
    p.vy = 0.008 + Math.random() * 0.016;
    p.taille = 0.7 + Math.random() * 1.5;
    if (depuisBord) p.y = -4;
  },
  bougerParticule(p, now, dt) {
    p.x += Math.sin(now / 900 + p.phase) * 0.01 * dt;
  },
  dessinerParticule(p, now, scintille) {
    ctx.globalAlpha = 0.35 + scintille * 0.4;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.taille, 0, Math.PI * 2);
    ctx.fill();
    if (p.taille > 1.7) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(p.x - 3, p.y);
      ctx.lineTo(p.x + 3, p.y);
      ctx.moveTo(p.x, p.y - 3);
      ctx.lineTo(p.x, p.y + 3);
      ctx.stroke();
    }
  },
  pomme(c, type, cx, cy, r, now) {
    if (type === 'normale') {
      // baie givrée avec sa petite feuille et des cristaux de givre
      c.fillStyle = degradePomme(cx, cy, r, lightenColor(currentTheme.food, 0.5), darkenColor(currentTheme.food, 0.35));
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      c.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      c.lineWidth = 1;
      c.beginPath();
      c.arc(cx, cy, r * 0.8, Math.PI * 1.1, Math.PI * 1.6);
      c.stroke();
      c.fillStyle = '#ffffff';
      [[-0.3, -0.4], [0.35, 0.2], [-0.1, 0.45]].forEach(([dx, dy]) => c.fillRect(cx + dx * r - 0.6, cy + dy * r - 0.6, 1.2, 1.2));
      c.fillStyle = '#2e7d32';
      c.beginPath();
      c.ellipse(cx + r * 0.3, cy - r * 1.0, r * 0.45, r * 0.2, -0.5, 0, Math.PI * 2);
      c.fill();
    } else if (type === 'or') {
      // flocon doré qui tourne
      c.strokeStyle = '#ffd54f';
      c.lineCap = 'round';
      c.lineWidth = Math.max(1.4, r * 0.28);
      const rot = now / 1400;
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = rot + (i * Math.PI) / 3;
        const ca = Math.cos(a), sa = Math.sin(a);
        c.moveTo(cx, cy);
        c.lineTo(cx + ca * r * 1.25, cy + sa * r * 1.25);
        const bx = cx + ca * r * 0.7, by = cy + sa * r * 0.7;
        [0.6, -0.6].forEach(dv => {
          c.moveTo(bx, by);
          c.lineTo(bx + Math.cos(a + dv) * r * 0.4, by + Math.sin(a + dv) * r * 0.4);
        });
      }
      c.stroke();
      c.shadowBlur = 0;
      c.fillStyle = '#fff8e1';
      c.beginPath();
      c.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
      c.fill();
    } else {
      // glaçon hexagonal avec ses facettes
      c.fillStyle = degradePomme(cx, cy, r, '#e1f5fe', '#0277bd');
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 2;
        const x = cx + Math.cos(a) * r * 1.15, y = cy + Math.sin(a) * r * 1.15;
        if (i) c.lineTo(x, y); else c.moveTo(x, y);
      }
      c.closePath();
      c.fill();
      c.shadowBlur = 0;
      c.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      c.lineWidth = 0.8;
      c.stroke();
      c.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 2;
        c.moveTo(cx + Math.cos(a) * r * 1.15, cy + Math.sin(a) * r * 1.15);
        c.lineTo(cx - Math.cos(a) * r * 1.15, cy - Math.sin(a) * r * 1.15);
      }
      c.stroke();
    }
  },
  tir(p) {
    // éclat de glace pointu, suivi de deux petits éclats qui s'effacent
    ctx.save();
    orienterTir(p);
    ctx.shadowColor = '#80d8ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#e1f5fe';
    tracerLosange(ctx, 13, 3.6);
    ctx.fill();
    ctx.shadowBlur = 0;
    [[-9, 0.5], [-15, 0.25]].forEach(([dx, alpha]) => {
      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.translate(dx, 0);
      tracerLosange(ctx, 6, 1.8);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }
};

// ------------------------------------------------------------
// Forêt enchantée : sapins sur les bords, rayon de lune, champignons lumineux, lucioles, feuilles
// ------------------------------------------------------------
const mondeForet = {
  couleurLaser: '#c5e1a5',
  fond(c, w, h, hasard) {
    c.fillStyle = degradeVertical(c, h, ['#0b1a10', '#0e2215', '#112818']);
    c.fillRect(0, 0, w, h);
    // mousse : petites taches vertes
    c.fillStyle = '#8bc34a';
    for (let i = 0; i < 160; i++) {
      c.globalAlpha = 0.03 + hasard() * 0.05;
      c.beginPath();
      c.arc(hasard() * w, hasard() * h, 2 + hasard() * 6, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  },
  decor(d, w, h) {
    const t = d.temps;
    const arbres = spriteDecor('foret-arbres', w, h, (c, aw, ah) => {
      // sapins sombres sur les côtés et en bas : le centre de la carte reste dégagé
      const sapin = (x, base, haut, larg, couleur) => {
        c.fillStyle = couleur;
        for (let k = 0; k < 3; k++) {
          const y = base - haut * (k * 0.28);
          c.beginPath();
          c.moveTo(x - larg * (1 - k * 0.22), y);
          c.lineTo(x, y - haut * 0.5);
          c.lineTo(x + larg * (1 - k * 0.22), y);
          c.closePath();
          c.fill();
        }
      };
      [[8, 0.42, 120], [30, 0.7, 150], [-6, 0.95, 130], [aw - 10, 0.5, 130], [aw - 28, 0.8, 160], [aw + 4, 1.0, 120]]
        .forEach(([x, b, haut]) => sapin(x, ah * b, haut, haut * 0.32, '#0f2b19'));
      for (let x = 50; x < aw - 40; x += 45) sapin(x, ah + 8, 50 + (x % 30), 22, '#0d2416');
    });
    ctx.globalAlpha = 0.85;
    poserCalque(arbres, 0, 0);

    // rayon de lune qui respire
    const rayon = spriteDecor('foret-rayon', 200, h, (c, rw, rh) => {
      const g = c.createLinearGradient(0, 0, 0, rh);
      g.addColorStop(0, 'rgba(220, 255, 210, 0.16)');
      g.addColorStop(1, 'rgba(220, 255, 210, 0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(20, 0);
      c.lineTo(80, 0);
      c.lineTo(200, rh);
      c.lineTo(100, rh);
      c.closePath();
      c.fill();
    });
    ctx.globalAlpha = 0.6 + Math.sin(t / 2600) * 0.3;
    poserCalque(rayon, w * 0.18, 0);

    // champignons lumineux au pied des arbres, qui pulsent chacun à leur rythme
    [[22, h - 14, 0], [w - 30, h - 20, 2], [w * 0.5, h - 8, 4]].forEach(([x, y, ph]) => {
      const lueur = 0.5 + Math.sin(t / 900 + ph) * 0.5;
      halo(ctx, x, y - 3, 20, 'rgba(77, 208, 225, 0.5)', 0.4 + lueur * 0.4);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#e8e0c8';
      ctx.fillRect(x - 1.5, y - 2, 3, 8);
      ctx.fillStyle = lueur > 0.5 ? '#80deea' : '#4dd0e1';
      ctx.beginPath();
      ctx.arc(x, y - 2, 6, Math.PI, 0);
      ctx.fill();
    });

    // feuilles qui tombent en virevoltant
    if (t >= d.prochain) {
      d.prochain = t + 1400 + Math.random() * 2000;
      d.elements.push({x: Math.random() * w, y: -8, phase: Math.random() * 6, couleur: Math.random() < 0.5 ? '#c0ca33' : '#a1887f'});
    }
    d.elements.forEach(e => {
      e.y += 0.022 * d.dt;
      e.x += Math.sin(t / 700 + e.phase) * 0.02 * d.dt;
      if (e.y > h + 10) { e.fini = true; return; }
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.translate(e.x, e.y);
      ctx.rotate(Math.sin(t / 500 + e.phase) * 1.2);
      ctx.fillStyle = e.couleur;
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  },
  creerParticule(p, depuisBord) {
    // lucioles qui flottent et s'allument tour à tour
    p.vx = (Math.random() - 0.5) * 0.006;
    p.vy = -(0.003 + Math.random() * 0.006);
    p.taille = 1.2 + Math.random() * 0.8;
    if (depuisBord) p.y = hauteurPlateau + 4;
  },
  bougerParticule(p, now, dt) {
    p.x += Math.sin(now / 1300 + p.phase) * 0.012 * dt;
    p.y += Math.cos(now / 1700 + p.phase * 1.3) * 0.008 * dt;
  },
  dessinerParticule(p, now) {
    const allumee = Math.max(0, Math.sin(now / 600 + p.phase * 3));
    if (allumee < 0.05) return;
    ctx.globalAlpha = allumee * 0.25;
    ctx.fillStyle = '#e6ff6b';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.taille * 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = allumee * 0.9;
    ctx.fillStyle = '#f4ff9e';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.taille, 0, Math.PI * 2);
    ctx.fill();
  },
  pomme(c, type, cx, cy, r, now) {
    if (type === 'normale') {
      // grappe de trois baies rouges et une feuille
      [[-0.4, 0.2], [0.4, 0.2], [0, -0.3]].forEach(([dx, dy]) => {
        const x = cx + dx * r, y = cy + dy * r, rb = r * 0.6;
        c.fillStyle = degradePomme(x, y, rb, lightenColor(currentTheme.food, 0.45), darkenColor(currentTheme.food, 0.4));
        c.beginPath();
        c.arc(x, y, rb, 0, Math.PI * 2);
        c.fill();
      });
      c.shadowBlur = 0;
      c.fillStyle = 'rgba(255, 255, 255, 0.75)';
      [[-0.55, 0.05], [0.25, 0.05], [-0.15, -0.45]].forEach(([dx, dy]) => {
        c.beginPath();
        c.arc(cx + dx * r, cy + dy * r, r * 0.12, 0, Math.PI * 2);
        c.fill();
      });
      c.fillStyle = '#43a047';
      c.beginPath();
      c.ellipse(cx + r * 0.45, cy - r * 0.95, r * 0.5, r * 0.22, -0.6, 0, Math.PI * 2);
      c.fill();
    } else if (type === 'or') {
      // gland doré sous son chapeau
      c.fillStyle = degradePomme(cx, cy + r * 0.2, r, '#fff8e1', '#ffa000');
      c.beginPath();
      c.ellipse(cx, cy + r * 0.25, r * 0.75, r * 0.95, 0, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      c.fillStyle = '#795548';
      c.beginPath();
      c.ellipse(cx, cy - r * 0.35, r * 0.95, r * 0.55, 0, Math.PI, Math.PI * 2);
      c.lineTo(cx + r * 0.95, cy - r * 0.25);
      c.lineTo(cx - r * 0.95, cy - r * 0.25);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(255, 224, 178, 0.45)';
      c.lineWidth = 0.7;
      c.beginPath();
      for (let i = -2; i <= 2; i++) {
        c.moveTo(cx + i * r * 0.3 - r * 0.15, cy - r * 0.75);
        c.lineTo(cx + i * r * 0.3 + r * 0.15, cy - r * 0.3);
      }
      c.stroke();
      c.fillStyle = '#5d4037';
      c.fillRect(cx - r * 0.08, cy - r * 1.15, r * 0.16, r * 0.3);
    } else {
      // fleur bleue à cinq pétales qui tourne doucement
      const rot = now / 2500;
      c.fillStyle = degradePomme(cx, cy, r, '#90caf9', '#1565c0');
      for (let i = 0; i < 5; i++) {
        const a = rot + (i * Math.PI * 2) / 5;
        c.beginPath();
        c.ellipse(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, r * 0.55, r * 0.36, a, 0, Math.PI * 2);
        c.fill();
      }
      c.shadowBlur = 0;
      c.fillStyle = '#ffeb3b';
      c.beginPath();
      c.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
      c.fill();
    }
  },
  tir(p, now) {
    // graine qui tourne sur elle-même, avec une traînée de pollen
    ctx.save();
    const v = Math.hypot(p.vx, p.vy) || 1;
    ctx.fillStyle = '#dce775';
    for (let k = 1; k <= 3; k++) {
      ctx.globalAlpha = 0.45 - k * 0.12;
      ctx.beginPath();
      ctx.arc(p.x - (p.vx / v) * k * 5, p.y - (p.vy / v) * k * 5, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.translate(p.x, p.y);
    ctx.rotate(now / 80);
    ctx.shadowColor = '#c5e1a5';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#c5e1a5';
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-4.5, 0);
    ctx.lineTo(4.5, 0);
    ctx.stroke();
    ctx.restore();
  }
};

// ------------------------------------------------------------
// Désert des pharaons : soleil couchant, pyramides, dunes, rafales de sable
// ------------------------------------------------------------
const mondeDesert = {
  couleurLaser: '#ffd54f',
  fond(c, w, h, hasard) {
    c.fillStyle = degradeVertical(c, h, ['#3b1f0e', '#53290f', '#6b3a14']);
    c.fillRect(0, 0, w, h);
    // grains de sable
    c.fillStyle = '#ffe0b2';
    for (let i = 0; i < 400; i++) {
      c.globalAlpha = 0.04 + hasard() * 0.08;
      c.fillRect(hasard() * w, hasard() * h, 1, 1);
    }
    // signes gravés très discrets (œil, ankh, ondes du Nil) répartis sur la carte
    c.globalAlpha = 0.06;
    c.strokeStyle = '#ffe0b2';
    c.lineWidth = 1.2;
    let n = 0;
    for (let y = 30; y < h; y += 70) {
      for (let x = 30 + (y % 140 ? 35 : 0); x < w; x += 70) {
        c.beginPath();
        if (n % 3 === 0) {
          c.ellipse(x, y, 7, 3.5, 0, 0, Math.PI * 2);
          c.moveTo(x + 1.5, y);
          c.arc(x, y, 1.5, 0, Math.PI * 2);
        } else if (n % 3 === 1) {
          c.ellipse(x, y - 5, 3, 4, 0, 0, Math.PI * 2);
          c.moveTo(x, y - 1);
          c.lineTo(x, y + 9);
          c.moveTo(x - 5, y + 2);
          c.lineTo(x + 5, y + 2);
        } else {
          for (let k = 0; k < 3; k++) {
            c.moveTo(x - 7, y + k * 3);
            for (let j = 0; j <= 4; j++) c.lineTo(x - 7 + j * 3.5, y + k * 3 + (j % 2 ? -1.5 : 0));
          }
        }
        c.stroke();
        n++;
      }
    }
    c.globalAlpha = 1;
  },
  decor(d, w, h) {
    const t = d.temps;
    // soleil couchant qui rayonne doucement
    halo(ctx, w * 0.82, h * 0.16, 70, 'rgba(255, 183, 77, 0.55)', 0.6 + Math.sin(t / 2000) * 0.15);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(w * 0.82, h * 0.16, 24, 0, Math.PI * 2);
    ctx.fill();

    const paysage = spriteDecor('desert-paysage', w, 110, (c, pw, ph) => {
      // pyramides à l'horizon
      [[60, 50, 46], [128, 64, 30], [pw - 90, 58, 36]].forEach(([x, y, s]) => {
        c.fillStyle = '#4e2a10';
        c.beginPath();
        c.moveTo(x - s, ph - 30);
        c.lineTo(x, y);
        c.lineTo(x + s, ph - 30);
        c.closePath();
        c.fill();
        // face éclairée par le soleil
        c.fillStyle = '#6d3c17';
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + s, ph - 30);
        c.lineTo(x + s * 0.2, ph - 30);
        c.closePath();
        c.fill();
      });
      // deux rangées de dunes
      [['#8d5524', ph - 40, 0], ['#a86a32', ph - 18, 2]].forEach(([couleur, y, ph2]) => {
        c.fillStyle = couleur;
        c.beginPath();
        c.moveTo(0, ph);
        for (let x = 0; x <= pw; x += 8) c.lineTo(x, y + Math.sin(x / 60 + ph2) * 9);
        c.lineTo(pw, ph);
        c.closePath();
        c.fill();
      });
    });
    ctx.globalAlpha = 0.6;
    poserCalque(paysage, 0, h - paysage.lh);

    // rafales de sable qui traversent la carte
    if (t >= d.prochain) {
      d.prochain = t + 900 + Math.random() * 1500;
      d.elements.push({debut: t, y: Math.random() * h, longueur: 40 + Math.random() * 60, vitesse: 0.18 + Math.random() * 0.12});
    }
    ctx.strokeStyle = '#ffe0b2';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.2;
    d.elements.forEach(e => {
      const x = (t - e.debut) * e.vitesse - e.longueur;
      if (x > w + 10) { e.fini = true; return; }
      const y = e.y + Math.sin((t - e.debut) / 250) * 4;
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + e.longueur * 0.5, y - 5, x + e.longueur, y);
      ctx.stroke();
    });
  },
  creerParticule(p, depuisBord) {
    // grains de sable poussés par le vent
    p.vx = 0.02 + Math.random() * 0.04;
    p.vy = (Math.random() - 0.5) * 0.006;
    p.taille = 0.8 + Math.random() * 1;
    if (depuisBord) p.x = -4;
  },
  bougerParticule(p, now, dt) {
    p.y += Math.sin(now / 400 + p.phase) * 0.006 * dt;
  },
  dessinerParticule(p, now, scintille) {
    ctx.globalAlpha = 0.25 + scintille * 0.3;
    ctx.fillStyle = '#ffe0b2';
    ctx.fillRect(p.x, p.y, p.taille * 1.6, p.taille * 0.8);
  },
  pomme(c, type, cx, cy, r, now) {
    if (type === 'normale') {
      // figue violette, pointe vers le haut
      c.fillStyle = degradePomme(cx, cy + r * 0.2, r, lightenColor(currentTheme.food, 0.45), darkenColor(currentTheme.food, 0.4));
      c.beginPath();
      c.moveTo(cx, cy - r * 1.2);
      c.bezierCurveTo(cx + r * 0.35, cy - r * 0.8, cx + r * 1.05, cy - r * 0.2, cx + r, cy + r * 0.3);
      c.arc(cx, cy + r * 0.3, r, 0, Math.PI);
      c.bezierCurveTo(cx - r * 1.05, cy - r * 0.2, cx - r * 0.35, cy - r * 0.8, cx, cy - r * 1.2);
      c.closePath();
      c.fill();
      c.shadowBlur = 0;
      c.fillStyle = '#6d4c41';
      c.fillRect(cx - r * 0.08, cy - r * 1.45, r * 0.16, r * 0.32);
      c.fillStyle = 'rgba(255, 255, 255, 0.5)';
      c.beginPath();
      c.ellipse(cx - r * 0.4, cy + r * 0.05, r * 0.14, r * 0.3, 0.3, 0, Math.PI * 2);
      c.fill();
    } else if (type === 'or') {
      // scarabée d'or dont les pattes gigotent
      const patte = Math.sin(now / 120) * r * 0.12;
      c.strokeStyle = '#c79100';
      c.lineWidth = Math.max(1, r * 0.12);
      c.beginPath();
      [-0.3, 0.2, 0.65].forEach((dy, i) => {
        const bouge = i % 2 ? patte : -patte;
        c.moveTo(cx - r * 0.5, cy + dy * r);
        c.lineTo(cx - r * 1.05, cy + dy * r + bouge);
        c.moveTo(cx + r * 0.5, cy + dy * r);
        c.lineTo(cx + r * 1.05, cy + dy * r - bouge);
      });
      c.stroke();
      c.fillStyle = degradePomme(cx, cy + r * 0.15, r, '#fff8e1', '#ffa000');
      c.beginPath();
      c.ellipse(cx, cy + r * 0.2, r * 0.7, r * 0.9, 0, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      c.fillStyle = '#ff8f00';
      c.beginPath();
      c.arc(cx, cy - r * 0.8, r * 0.35, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(110, 60, 0, 0.6)';
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(cx, cy - r * 0.55);
      c.lineTo(cx, cy + r * 1.05);
      c.stroke();
    } else {
      // amulette turquoise cerclée d'or, avec l'œil d'Horus
      c.fillStyle = degradePomme(cx, cy, r, '#a7ffeb', '#00838f');
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      c.strokeStyle = '#ffd54f';
      c.lineWidth = Math.max(1.2, r * 0.18);
      c.stroke();
      c.strokeStyle = '#102027';
      c.fillStyle = '#102027';
      c.lineWidth = Math.max(0.8, r * 0.1);
      c.beginPath();
      c.moveTo(cx - r * 0.6, cy - r * 0.05);
      c.quadraticCurveTo(cx, cy - r * 0.55, cx + r * 0.6, cy - r * 0.05);
      c.quadraticCurveTo(cx, cy + r * 0.35, cx - r * 0.6, cy - r * 0.05);
      c.moveTo(cx - r * 0.1, cy + r * 0.2);
      c.lineTo(cx - r * 0.25, cy + r * 0.6);
      c.stroke();
      c.beginPath();
      c.arc(cx, cy - r * 0.08, r * 0.18, 0, Math.PI * 2);
      c.fill();
    }
  },
  tir(p) {
    // jet de sable doré : un grain et sa traînée de poussière
    ctx.save();
    const v = Math.hypot(p.vx, p.vy) || 1;
    for (let k = 5; k >= 1; k--) {
      ctx.globalAlpha = 0.6 - k * 0.1;
      ctx.fillStyle = '#ffcc80';
      ctx.beginPath();
      ctx.arc(p.x - (p.vx / v) * k * 3.5 + Math.sin(k * 2.1) * 1.2, p.y - (p.vy / v) * k * 3.5 + Math.cos(k * 1.7) * 1.2,
        projectileRadius * (1 - k * 0.13), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowColor = '#ffb300';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(p.x, p.y, projectileRadius * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff8e1';
    ctx.beginPath();
    ctx.arc(p.x - 0.8, p.y - 0.8, projectileRadius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};

// ------------------------------------------------------------
// Synthwave : soleil rayé, montagnes, grille en perspective qui défile vers le joueur
// ------------------------------------------------------------
const mondeSynthwave = {
  couleurLaser: '#ff2bd6',
  fond(c, w, h, hasard) {
    c.fillStyle = degradeVertical(c, h, ['#140028', '#2a0650', '#4a0a5e', '#1a0033', '#12001f']);
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 70; i++) {
      c.globalAlpha = 0.15 + hasard() * 0.5;
      c.beginPath();
      c.arc(hasard() * w, hasard() * h * 0.42, hasard() < 0.85 ? 0.6 : 1.2, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  },
  decor(d, w, h) {
    const t = d.temps;
    const horizon = h * 0.5;
    // soleil rayé (les bandes vides grandissent vers le bas)
    const soleil = spriteDecor('synth-soleil', 150, 150, (c) => {
      const g = c.createLinearGradient(0, 0, 0, 150);
      g.addColorStop(0, '#ffe14d');
      g.addColorStop(0.55, '#ff7a3d');
      g.addColorStop(1, '#ff2bd6');
      c.fillStyle = g;
      c.beginPath();
      c.arc(75, 75, 72, 0, Math.PI * 2);
      c.fill();
      c.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 6; i++) c.fillRect(0, 82 + i * 11, 150, 2 + i * 1.2);
    });
    halo(ctx, w / 2, horizon - 30, 120, 'rgba(255, 43, 214, 0.45)', 0.5 + Math.sin(t / 1800) * 0.15);
    ctx.globalAlpha = 0.6;
    poserCalque(soleil, w / 2 - 75, horizon - 115);

    const montagnes = spriteDecor('synth-montagnes', w, 60, (c, mw, mh) => {
      c.fillStyle = '#1a0033';
      c.strokeStyle = '#ff2bd6';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(0, mh);
      [[0, 30], [40, 12], [80, 34], [120, 18], [150, 40], [mw - 150, 40], [mw - 110, 16], [mw - 70, 32], [mw - 35, 10], [mw, 28]]
        .forEach(([x, y]) => c.lineTo(x, y));
      c.lineTo(mw, mh);
      c.closePath();
      c.fill();
      c.stroke();
    });
    ctx.globalAlpha = 0.8;
    poserCalque(montagnes, 0, horizon - montagnes.lh);

    // sol sombre puis grille en perspective : les lignes horizontales arrivent vers le bas
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#12001f';
    ctx.fillRect(0, horizon, w, h - horizon);
    ctx.strokeStyle = '#ff2bd6';
    ctx.lineWidth = 1;
    const n = 9;
    const avance = (t / 1400) % 1;
    for (let i = 0; i < n; i++) {
      const p = (i + avance) / n;
      const y = horizon + (h - horizon) * p * p;
      ctx.globalAlpha = 0.12 + p * 0.4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    for (let k = -10; k <= 10; k++) {
      ctx.moveTo(w / 2 + k * 14, horizon);
      ctx.lineTo(w / 2 + k * 70, h);
    }
    ctx.stroke();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(w, horizon);
    ctx.stroke();
  },
  creerParticule(p, depuisBord) {
    // étoiles du ciel qui scintillent en glissant lentement
    p.vx = 0.003 + Math.random() * 0.004;
    p.vy = 0;
    p.y = Math.random() * hauteurPlateau * 0.45;
    p.taille = 0.6 + Math.random() * 1.1;
    if (depuisBord) p.x = -4;
  },
  dessinerParticule(p, now, scintille) {
    ctx.globalAlpha = 0.2 + scintille * 0.7;
    ctx.fillStyle = scintille > 0.8 ? '#00f0ff' : '#ffe6ff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.taille, 0, Math.PI * 2);
    ctx.fill();
  },
  pomme(c, type, cx, cy, r, now) {
    if (type === 'normale') {
      // pomme chromée à rayures, façon logo des années 80
      const g = c.createLinearGradient(0, cy - r, 0, cy + r);
      g.addColorStop(0, lightenColor(currentTheme.food, 0.6));
      g.addColorStop(0.5, currentTheme.food);
      g.addColorStop(1, darkenColor(currentTheme.food, 0.45));
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(cx, cy - r * 0.55);
      c.bezierCurveTo(cx + r * 0.6, cy - r * 1.05, cx + r * 1.15, cy - r * 0.35, cx + r * 0.9, cy + r * 0.35);
      c.bezierCurveTo(cx + r * 0.7, cy + r * 0.95, cx + r * 0.25, cy + r * 1.05, cx, cy + r * 0.8);
      c.bezierCurveTo(cx - r * 0.25, cy + r * 1.05, cx - r * 0.7, cy + r * 0.95, cx - r * 0.9, cy + r * 0.35);
      c.bezierCurveTo(cx - r * 1.15, cy - r * 0.35, cx - r * 0.6, cy - r * 1.05, cx, cy - r * 0.55);
      c.closePath();
      c.fill();
      c.shadowBlur = 0;
      c.fillStyle = 'rgba(26, 0, 51, 0.55)';
      c.fillRect(cx - r, cy + r * 0.25, r * 2, r * 0.12);
      c.fillRect(cx - r, cy + r * 0.5, r * 2, r * 0.15);
      c.fillStyle = '#ff2bd6';
      c.beginPath();
      c.ellipse(cx + r * 0.35, cy - r * 0.95, r * 0.4, r * 0.17, -0.6, 0, Math.PI * 2);
      c.fill();
    } else if (type === 'or') {
      // disque d'or : sillons, étiquette rose et reflet qui tourne
      c.fillStyle = degradePomme(cx, cy, r, '#fff59d', '#c79100');
      c.beginPath();
      c.arc(cx, cy, r * 1.1, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      c.strokeStyle = 'rgba(110, 70, 0, 0.45)';
      c.lineWidth = 0.6;
      [0.95, 0.8, 0.65].forEach(k => {
        c.beginPath();
        c.arc(cx, cy, r * k, 0, Math.PI * 2);
        c.stroke();
      });
      const a = now / 400;
      c.fillStyle = 'rgba(255, 255, 255, 0.4)';
      c.beginPath();
      c.moveTo(cx, cy);
      c.arc(cx, cy, r * 1.1, a, a + 0.5);
      c.closePath();
      c.fill();
      c.fillStyle = '#ff2bd6';
      c.beginPath();
      c.arc(cx, cy, r * 0.38, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#1a0033';
      c.beginPath();
      c.arc(cx, cy, r * 0.1, 0, Math.PI * 2);
      c.fill();
    } else {
      // cassette bleue dont les bobines tournent
      const l = r * 1.2, hh = r * 0.8;
      c.fillStyle = degradePomme(cx, cy, r, '#82b1ff', '#1a237e');
      c.beginPath();
      c.roundRect(cx - l, cy - hh, l * 2, hh * 2, r * 0.2);
      c.fill();
      c.shadowBlur = 0;
      c.fillStyle = '#e3f2fd';
      c.fillRect(cx - l * 0.8, cy - hh * 0.75, l * 1.6, hh * 0.45);
      c.fillStyle = '#0d1440';
      c.beginPath();
      c.roundRect(cx - l * 0.6, cy - hh * 0.1, l * 1.2, hh * 0.7, r * 0.15);
      c.fill();
      c.strokeStyle = '#ffffff';
      c.lineWidth = 0.8;
      [-1, 1].forEach(cote => {
        const bx = cx + cote * l * 0.35, by = cy + hh * 0.25;
        c.beginPath();
        c.arc(bx, by, r * 0.22, 0, Math.PI * 2);
        for (let k = 0; k < 3; k++) {
          const a = now / 200 + (k * Math.PI * 2) / 3;
          c.moveTo(bx, by);
          c.lineTo(bx + Math.cos(a) * r * 0.22, by + Math.sin(a) * r * 0.22);
        }
        c.stroke();
      });
    }
  },
  tir(p) {
    // trait laser rose au cœur blanc-cyan
    ctx.save();
    orienterTir(p);
    ctx.shadowColor = '#ff2bd6';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff2bd6';
    ctx.beginPath();
    ctx.roundRect(-10, -2.6, 14, 5.2, 2.6);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#b2fcff';
    ctx.beginPath();
    ctx.roundRect(-8, -1, 11, 2, 1);
    ctx.fill();
    ctx.restore();
  }
};

// ------------------------------------------------------------
// Halloween : pleine lune, tombes et arbre mort, brume qui dérive, chauves-souris, feux follets
// ------------------------------------------------------------
const mondeHalloween = {
  couleurLaser: '#76ff03',
  fond(c, w, h, hasard) {
    c.fillStyle = degradeVertical(c, h, ['#140a1c', '#1c0d27', '#22102e']);
    c.fillRect(0, 0, w, h);
    // toiles d'araignée dans les coins
    c.strokeStyle = '#d1c4e9';
    c.lineWidth = 0.7;
    c.globalAlpha = 0.12;
    [[0, 0, 0], [w, 0, Math.PI / 2]].forEach(([x, y, rot]) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.beginPath();
      for (let k = 0; k <= 5; k++) {
        const a = (k / 5) * Math.PI / 2;
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a) * 70, Math.sin(a) * 70);
      }
      for (let anneau = 1; anneau <= 4; anneau++) {
        const rr = anneau * 16;
        c.moveTo(rr, 0);
        for (let k = 1; k <= 5; k++) {
          const a0 = ((k - 1) / 5) * Math.PI / 2, a1 = (k / 5) * Math.PI / 2;
          const am = (a0 + a1) / 2;
          c.quadraticCurveTo(Math.cos(am) * rr * 0.8, Math.sin(am) * rr * 0.8, Math.cos(a1) * rr, Math.sin(a1) * rr);
        }
      }
      c.stroke();
      c.restore();
    });
    c.globalAlpha = 1;
  },
  decor(d, w, h) {
    const t = d.temps;
    // pleine lune et son halo qui respire
    const lune = spriteDecor('halloween-lune', 60, 60, (c) => {
      c.fillStyle = '#fff8dc';
      c.beginPath();
      c.arc(30, 30, 26, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(200, 180, 140, 0.45)';
      [[22, 22, 5], [38, 34, 7], [26, 40, 3.5], [40, 20, 3]].forEach(([x, y, r]) => {
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
      });
    });
    halo(ctx, w * 0.2, h * 0.17, 80, 'rgba(255, 245, 200, 0.35)', 0.6 + Math.sin(t / 2200) * 0.2);
    ctx.globalAlpha = 0.75;
    poserCalque(lune, w * 0.2 - 30, h * 0.17 - 30);

    const sol = spriteDecor('halloween-sol', w, 120, (c, sw, sh) => {
      c.fillStyle = '#0b0510';
      // arbre mort à droite
      c.strokeStyle = '#0b0510';
      c.lineCap = 'round';
      const branche = (x, y, a, l, ep) => {
        if (ep < 0.8) return;
        const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l;
        c.lineWidth = ep;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x2, y2);
        c.stroke();
        branche(x2, y2, a - 0.45, l * 0.7, ep * 0.6);
        branche(x2, y2, a + 0.35, l * 0.65, ep * 0.6);
      };
      branche(sw - 40, sh, -Math.PI / 2, 45, 7);
      // tombes
      [[50, 20, 26], [100, 16, 20], [sw * 0.45, 18, 24], [sw - 110, 14, 18]].forEach(([x, larg, haut]) => {
        c.beginPath();
        c.moveTo(x - larg / 2, sh);
        c.lineTo(x - larg / 2, sh - haut);
        c.arc(x, sh - haut, larg / 2, Math.PI, 0);
        c.lineTo(x + larg / 2, sh);
        c.closePath();
        c.fill();
      });
      c.fillRect(0, sh - 6, sw, 6);
    });
    ctx.globalAlpha = 0.9;
    poserCalque(sol, 0, h - sol.lh);

    // brume qui dérive en deux nappes
    const brume = spriteDecor('halloween-brume', 300, 50, (c, bw, bh) => {
      for (let i = 0; i < 6; i++) {
        const g = c.createRadialGradient(25 + i * 50, 25, 0, 25 + i * 50, 25, 40);
        g.addColorStop(0, 'rgba(209, 196, 233, 0.16)');
        g.addColorStop(1, 'rgba(209, 196, 233, 0)');
        c.fillStyle = g;
        c.fillRect(0, 0, bw, bh);
      }
    });
    [[h * 0.62, 0.012, 0.7], [h * 0.85, -0.018, 1]].forEach(([y, v, alpha]) => {
      const x = ((t * v) % 300 + 300) % 300;
      ctx.globalAlpha = alpha;
      for (let k = -1; k <= Math.ceil(w / 300); k++) poserCalque(brume, x + k * 300 - 300, y - 25);
    });

    // chauves-souris qui traversent le ciel de temps en temps
    if (t >= d.prochain) {
      d.prochain = t + 4000 + Math.random() * 5000;
      const sens = Math.random() < 0.5 ? 1 : -1;
      for (let i = 0; i < 1 + Math.floor(Math.random() * 3); i++) {
        d.elements.push({debut: t + i * 250, sens, y: h * (0.08 + Math.random() * 0.3), phase: Math.random() * 6});
      }
    }
    ctx.fillStyle = '#000000';
    d.elements.forEach(e => {
      if (t < e.debut) return;
      const avance = (t - e.debut) * 0.09;
      if (avance > w + 40) { e.fini = true; return; }
      const x = e.sens > 0 ? -20 + avance : w + 20 - avance;
      const y = e.y + Math.sin(avance / 25 + e.phase) * 8;
      const aile = Math.sin(t / 70 + e.phase) * 4;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x - 4, y - 3 - aile, x - 9, y - aile);
      ctx.quadraticCurveTo(x - 5, y, x, y + 2);
      ctx.quadraticCurveTo(x + 5, y, x + 9, y - aile);
      ctx.quadraticCurveTo(x + 4, y - 3 - aile, x, y);
      ctx.fill();
    });
  },
  creerParticule(p, depuisBord) {
    // feux follets verts qui montent en ondulant
    p.vx = 0;
    p.vy = -(0.006 + Math.random() * 0.01);
    p.taille = 1.2 + Math.random() * 1.2;
    if (depuisBord) p.y = hauteurPlateau + 4;
  },
  bougerParticule(p, now, dt) {
    p.x += Math.sin(now / 800 + p.phase) * 0.014 * dt;
  },
  dessinerParticule(p, now, scintille) {
    ctx.globalAlpha = 0.06 + scintille * 0.12;
    ctx.fillStyle = '#b2ff59';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.taille * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.25 + scintille * 0.5;
    ctx.fillStyle = '#ccff90';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.taille, 0, Math.PI * 2);
    ctx.fill();
  },
  pomme(c, type, cx, cy, r, now) {
    if (type === 'normale') {
      // petite citrouille côtelée avec un visage sculpté
      const fonce = darkenColor(currentTheme.food, 0.35);
      [[-0.45, 0.6], [0.45, 0.6], [0, 0.62]].forEach(([dx, rx]) => {
        c.fillStyle = degradePomme(cx + dx * r, cy, r, lightenColor(currentTheme.food, 0.35), fonce);
        c.beginPath();
        c.ellipse(cx + dx * r, cy + r * 0.05, rx * r, r * 0.88, 0, 0, Math.PI * 2);
        c.fill();
      });
      c.shadowBlur = 0;
      c.fillStyle = '#558b2f';
      c.fillRect(cx - r * 0.1, cy - r * 1.15, r * 0.22, r * 0.38);
      c.fillStyle = '#2b1033';
      c.beginPath();
      [-1, 1].forEach(cote => {
        c.moveTo(cx + cote * r * 0.5, cy - r * 0.05);
        c.lineTo(cx + cote * r * 0.15, cy - r * 0.05);
        c.lineTo(cx + cote * r * 0.33, cy - r * 0.38);
      });
      c.moveTo(cx - r * 0.5, cy + r * 0.3);
      c.lineTo(cx + r * 0.5, cy + r * 0.3);
      c.lineTo(cx + r * 0.25, cy + r * 0.55);
      c.lineTo(cx, cy + r * 0.4);
      c.lineTo(cx - r * 0.25, cy + r * 0.55);
      c.closePath();
      c.fill();
    } else if (type === 'or') {
      // bonbon doré dans son papier torsadé
      c.fillStyle = '#ffca28';
      [-1, 1].forEach(cote => {
        c.beginPath();
        c.moveTo(cx + cote * r * 0.7, cy);
        c.lineTo(cx + cote * r * 1.45, cy - r * 0.55);
        c.lineTo(cx + cote * r * 1.3, cy);
        c.lineTo(cx + cote * r * 1.45, cy + r * 0.55);
        c.closePath();
        c.fill();
      });
      c.fillStyle = degradePomme(cx, cy, r * 0.85, '#fff8e1', '#ff8f00');
      c.beginPath();
      c.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      c.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      c.lineWidth = Math.max(1, r * 0.14);
      c.beginPath();
      c.arc(cx, cy, r * 0.45, now / 400, now / 400 + Math.PI * 1.2);
      c.stroke();
    } else {
      // fiole de potion bleue qui bouillonne
      c.fillStyle = 'rgba(225, 245, 254, 0.35)';
      c.fillRect(cx - r * 0.25, cy - r * 1.2, r * 0.5, r * 0.6);
      c.fillStyle = '#8d6e63';
      c.fillRect(cx - r * 0.3, cy - r * 1.4, r * 0.6, r * 0.28);
      c.fillStyle = degradePomme(cx, cy + r * 0.2, r * 0.85, '#82b1ff', '#1a237e');
      c.beginPath();
      c.arc(cx, cy + r * 0.2, r * 0.85, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      c.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (let i = 0; i < 3; i++) {
        const q = (now / 900 + i / 3) % 1;
        c.beginPath();
        c.arc(cx + (i - 1) * r * 0.3, cy + r * 0.7 - q * r * 1.1, r * 0.1 * (1 - q * 0.5), 0, Math.PI * 2);
        c.fill();
      }
    }
  },
  tir(p, now) {
    // feu follet vert avec sa queue de flamme qui vacille
    ctx.save();
    const v = Math.hypot(p.vx, p.vy) || 1;
    for (let k = 3; k >= 1; k--) {
      ctx.globalAlpha = 0.5 - k * 0.12;
      ctx.fillStyle = '#64dd17';
      ctx.beginPath();
      ctx.arc(p.x - (p.vx / v) * k * 4.5 + Math.sin(now / 50 + k) * 0.9, p.y - (p.vy / v) * k * 4.5,
        projectileRadius * (1.1 - k * 0.2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowColor = '#76ff03';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#76ff03';
    ctx.beginPath();
    ctx.arc(p.x, p.y, projectileRadius * 1.2 * (1 + Math.sin(now / 45 + p.x) * 0.12), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f1ffe0';
    ctx.beginPath();
    ctx.arc(p.x, p.y, projectileRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};

const mondesSupp = {
  aurore: mondeAurore,
  foret: mondeForet,
  desert: mondeDesert,
  synthwave: mondeSynthwave,
  halloween: mondeHalloween
};
