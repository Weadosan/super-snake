// --- Feux d'artifice de victoire : un style par thème ---
// Pensé pour les vieux PC : peu de particules, toutes dans un tableau réutilisé d'une salve à l'autre
// (aucune création d'objet pendant l'animation), pas de shadowBlur, pas de save/restore par particule,
// et seulement des formes simples (carrés, traits, petits cercles).

// motif = forme de la gerbe à l'explosion ; forme = dessin de chaque éclat ; fusee = dessin de la montée
// vitesses en px/ms, gravite en px/ms², frein = vitesse gardée toutes les 16 ms
const stylesFeuxArtifice = {
  // néon : traits lumineux qui filent en étoile, couleurs fluo
  neon: {
    couleurs: ['#39ff14', '#ff2079', '#00f0ff', '#ffe600'], fusees: 8, eclats: 28,
    motif: 'sphere', forme: 'trait', fusee: 'trait', vitesse: [0.12, 0.24], gravite: 0.00012, frein: 0.978,
    vie: [750, 1050], taille: [2, 2.5]
  },
  // espace : étoiles filantes en diagonale, gerbes en étoile à 5 branches qui scintillent, sans gravité
  espace: {
    couleurs: ['#ffffff', '#b388ff', '#82b1ff', '#ffe57f'], fusees: 7, eclats: 30,
    motif: 'etoile', forme: 'etoile', fusee: 'filante', vitesse: [0.14, 0.22], gravite: 0, frein: 0.972,
    vie: [900, 1300], taille: [2, 3]
  },
  // lave : jets de braises vers le haut qui retombent lourdement en passant du jaune au rouge
  lave: {
    couleurs: ['#fff176', '#ffab00', '#ff6d00', '#d50000'], fusees: 8, eclats: 26,
    motif: 'fontaine', forme: 'braise', fusee: 'braise', vitesse: [0.12, 0.26], gravite: 0.0006, frein: 0.99,
    vie: [900, 1300], taille: [3, 4.5]
  },
  // océan : bulles qui montent en ondulant et éclatent en petites bulles qui remontent
  ocean: {
    couleurs: ['#80deea', '#e0f7fa', '#4dd0e1', '#c6ff00'], fusees: 7, eclats: 18,
    motif: 'sphere', forme: 'bulle', fusee: 'bulle', vitesse: [0.03, 0.09], gravite: -0.00008, frein: 0.97,
    vie: [1100, 1600], taille: [2, 4.5], ondule: 0.04
  },
  // aurore : rideaux verticaux qui s'étalent à l'horizontale et descendent doucement en se balançant
  aurore: {
    couleurs: ['#69f0ae', '#b2ff59', '#ea80fc', '#40c4ff'], fusees: 7, eclats: 26,
    motif: 'rideau', forme: 'ruban', fusee: 'trait', vitesse: [0.06, 0.18], gravite: 0.00003, frein: 0.97,
    vie: [1200, 1700], taille: [1.5, 2.5], ondule: 0.03
  },
  // forêt : lucioles qui se dispersent lentement et clignotent
  foret: {
    couleurs: ['#eeff41', '#c6ff00', '#ffee58', '#76ff03'], fusees: 7, eclats: 22,
    motif: 'sphere', forme: 'luciole', fusee: 'trait', vitesse: [0.06, 0.14], gravite: 0, frein: 0.978,
    vie: [1500, 2100], taille: [3, 4], ondule: 0.03
  },
  // désert : anneau de soleil doré dont les grains de sable sont emportés par le vent
  desert: {
    couleurs: ['#ffd54f', '#ffb300', '#ffe0b2', '#ff7043'], fusees: 8, eclats: 30,
    motif: 'anneau', forme: 'grain', fusee: 'trait', vitesse: [0.15, 0.17], gravite: 0.00015, frein: 0.98,
    vie: [1000, 1400], taille: [2.5, 3.5], vent: 0.00012
  },
  // synthwave : double anneau rose et cyan en gros pixels rétro
  synthwave: {
    couleurs: ['#ff2fd6', '#00e5ff', '#ffe600'], fusees: 8, eclats: 32,
    motif: 'double_anneau', forme: 'pixel', fusee: 'trait', vitesse: [0.15, 0.16], gravite: 0.00008, frein: 0.97,
    vie: [800, 1100], taille: [3, 3]
  },
  // halloween : tourbillons orange, violet et vert qui crépitent en s'éteignant
  halloween: {
    couleurs: ['#ff7518', '#b026ff', '#76ff03', '#ffab40'], fusees: 8, eclats: 26,
    motif: 'spirale', forme: 'crepite', fusee: 'trait', vitesse: [0.13, 0.19], gravite: 0.00006, frein: 0.98,
    vie: [1000, 1400], taille: [2.5, 3.5], rotation: 0.0025
  }
};

const FEU_MAX_PARTICULES = 300;
const feuParticules = []; // objets réutilisés ; seuls les feuNb premiers sont vivants
let feuNb = 0;
let feuTemps = 0; // horloge interne (ms) pour les clignotements

function styleFeuxActuel() {
  return stylesFeuxArtifice[currentThemeName] || stylesFeuxArtifice.neon;
}

function aleaEntre(intervalle) {
  return intervalle[0] + Math.random() * (intervalle[1] - intervalle[0]);
}

function viderFeuxArtifice() {
  fireworks = [];
  feuNb = 0;
}

// lance une salve de fusées à des instants décalés, dans le style du thème en cours
function launchFireworks() {
  const style = styleFeuxActuel();
  const now = performance.now();

  for (let i = 0; i < style.fusees; i++) {
    const x = 40 + Math.random() * (largeurPlateau - 80);
    fireworks.push({
      x, y: hauteurPlateau, departX: x,
      targetY: hauteurPlateau * (0.1 + Math.random() * 0.3),
      vy: -0.28 - Math.random() * 0.08,
      // étoile filante : part en biais vers le centre
      vx: style.fusee === 'filante' ? (x < largeurPlateau / 2 ? 1 : -1) * (0.08 + Math.random() * 0.06) : 0,
      color: style.couleurs[i % style.couleurs.length],
      style,
      exploded: false,
      explodedAt: 0,
      spawnTime: now,
      launchDelay: i * 320 + Math.random() * 300
    });
  }
}

function feuNouvelleParticule() {
  if (feuNb >= FEU_MAX_PARTICULES) return null;
  let p = feuParticules[feuNb];
  if (!p) {
    p = { x: 0, y: 0, vx: 0, vy: 0, vie: 0, vieMax: 1, couleur: '', taille: 1, phase: 0, style: null };
    feuParticules[feuNb] = p;
  }
  feuNb++;
  return p;
}

// fait éclater une fusée selon le motif de son thème
function eclaterFusee(fw) {
  const s = fw.style;
  const n = s.eclats;
  const decalage = Math.random() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const p = feuNouvelleParticule();
    if (!p) break;
    let angle = decalage + (i / n) * Math.PI * 2;
    let vitesse = aleaEntre(s.vitesse);
    let couleur = Math.random() < 0.7 ? fw.color : s.couleurs[(Math.random() * s.couleurs.length) | 0];
    switch (s.motif) {
      case 'sphere':
        angle = Math.random() * Math.PI * 2;
        break;
      case 'etoile': // vitesse plus forte dans 5 directions : dessine une étoile
        vitesse *= 0.45 + 0.55 * Math.abs(Math.cos(2.5 * (angle - decalage)));
        break;
      case 'fontaine': // gerbe tournée vers le haut, qui retombera
        angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
        couleur = s.couleurs[(Math.random() * 2) | 0]; // part jaune, rougit en vieillissant
        break;
      case 'rideau': // surtout à l'horizontale
        angle = Math.random() < 0.5 ? Math.PI + (Math.random() - 0.5) * 0.5 : (Math.random() - 0.5) * 0.5;
        break;
      case 'double_anneau': // un anneau sur deux, plus petit et de l'autre couleur
        if (i % 2) {
          vitesse *= 0.55;
          couleur = s.couleurs[(s.couleurs.indexOf(fw.color) + 1) % s.couleurs.length];
        } else {
          couleur = fw.color;
        }
        break;
      // 'anneau' et 'spirale' : angles réguliers, rien à changer
    }
    p.x = fw.x;
    p.y = fw.y;
    p.vx = Math.cos(angle) * vitesse;
    p.vy = Math.sin(angle) * vitesse;
    p.vie = 0;
    p.vieMax = aleaEntre(s.vie);
    p.couleur = couleur;
    p.taille = aleaEntre(s.taille);
    p.phase = Math.random() * Math.PI * 2;
    p.style = s;
  }
}

// met à jour fusées + éclats, entièrement indépendant de gameOver/updateCombat
// (pour continuer à s'animer pendant l'écran de victoire)
function updateFireworks(deltaMs) {
  if (fireworks.length === 0 && feuNb === 0) return;
  const dt = Math.min(deltaMs, 50); // pas de saut géant après un changement d'onglet
  const now = performance.now();
  feuTemps += dt;

  for (const fw of fireworks) {
    if (fw.exploded || now - fw.spawnTime < fw.launchDelay) continue; // pas encore lancée
    fw.y += fw.vy * dt;
    fw.x += fw.vx * dt;
    if (fw.style.fusee === 'bulle') fw.x = fw.departX + Math.sin(fw.y * 0.05) * 6; // la bulle ondule
    if (fw.y <= fw.targetY) {
      fw.exploded = true;
      fw.explodedAt = now;
      eclaterFusee(fw);
      playFireworkPopSound();
    }
  }
  // une fusée éclatée ne reste que le temps de son flash
  for (let i = fireworks.length - 1; i >= 0; i--) {
    if (fireworks[i].exploded && now - fireworks[i].explodedAt > 160) fireworks.splice(i, 1);
  }

  const pas = dt / 16;
  for (let i = 0; i < feuNb; ) {
    const p = feuParticules[i];
    const s = p.style;
    p.vie += dt;
    if (p.vie >= p.vieMax) {
      // échange avec le dernier éclat vivant : pas de trou, pas d'allocation
      feuParticules[i] = feuParticules[feuNb - 1];
      feuParticules[feuNb - 1] = p;
      feuNb--;
      continue;
    }
    const frein = 1 - (1 - s.frein) * pas; // approximation de frein^pas, sans Math.pow
    p.vx *= frein;
    p.vy *= frein;
    p.vy += s.gravite * dt;
    if (s.vent) p.vx += s.vent * dt;
    if (s.rotation) { // spirale : la vitesse tourne petit à petit
      const a = s.rotation * dt, c = Math.cos(a), si = Math.sin(a);
      const vx = p.vx;
      p.vx = vx * c - p.vy * si;
      p.vy = vx * si + p.vy * c;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (s.ondule) p.x += Math.sin(feuTemps * 0.004 + p.phase) * s.ondule * pas;
    i++;
  }

  // relance une nouvelle salve tant que l'écran de victoire est affiché
  if (fireworks.length === 0 && feuNb === 0 && hasWon) {
    launchFireworks();
  }
}

function dessinerFusee(fw, now) {
  const s = fw.style;
  if (fw.exploded) { // bref flash au point d'explosion
    const t = (now - fw.explodedAt) / 160;
    ctx.globalAlpha = 0.25 * (1 - t);
    ctx.fillStyle = fw.color;
    ctx.beginPath();
    ctx.arc(fw.x, fw.y, 10 + 22 * t, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.globalAlpha = 1;
  if (s.fusee === 'bulle') {
    ctx.strokeStyle = fw.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(fw.x, fw.y, 4, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }
  // traînée : un trait derrière la tête de la fusée (plus longue pour l'étoile filante)
  const trainee = s.fusee === 'filante' ? 110 : 45;
  ctx.strokeStyle = fw.color;
  ctx.lineWidth = s.fusee === 'braise' ? 3 : 2;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(fw.x, fw.y);
  ctx.lineTo(fw.x - fw.vx * trainee, fw.y - fw.vy * trainee);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = s.fusee === 'braise' ? '#fff176' : '#ffffff';
  ctx.fillRect(fw.x - 1.5, fw.y - 1.5, 3, 3);
}

function dessinerEclat(p) {
  const s = p.style;
  const progres = p.vie / p.vieMax;
  let alpha = 1 - progres;
  const t = p.taille, d = t / 2;
  switch (s.forme) {
    case 'trait': { // trait orienté selon la vitesse
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = p.couleur;
      ctx.lineWidth = t;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 60, p.y - p.vy * 60);
      ctx.stroke();
      return;
    }
    case 'ruban': // trait vertical qui pend, comme un rideau d'aurore
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = p.couleur;
      ctx.fillRect(p.x - d, p.y - t * 5, t, t * 6);
      return;
    case 'bulle':
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = p.couleur;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, t, 0, Math.PI * 2);
      ctx.stroke();
      return;
    case 'etoile': { // petite croix qui scintille
      ctx.globalAlpha = alpha * (0.6 + 0.4 * Math.sin(feuTemps * 0.02 + p.phase));
      ctx.fillStyle = p.couleur;
      const l = t * 2;
      ctx.fillRect(p.x - l, p.y - 0.5, l * 2, 1);
      ctx.fillRect(p.x - 0.5, p.y - l, 1, l * 2);
      ctx.fillRect(p.x - d, p.y - d, t, t);
      return;
    }
    case 'braise': { // passe du jaune au rouge sombre et vacille
      const c = s.couleurs;
      ctx.fillStyle = c[Math.min(c.length - 1, (progres * c.length) | 0)];
      ctx.globalAlpha = alpha * (0.7 + 0.3 * Math.sin(feuTemps * 0.03 + p.phase));
      const r = t * (1 - progres * 0.5);
      ctx.fillRect(p.x - r / 2, p.y - r / 2, r, r);
      return;
    }
    case 'luciole': // clignote doucement, avec un léger halo (un carré pâle, pas de shadowBlur)
      alpha *= 0.5 + 0.5 * Math.sin(feuTemps * 0.008 + p.phase);
      ctx.globalAlpha = alpha * 0.25;
      ctx.fillStyle = p.couleur;
      ctx.fillRect(p.x - t * 1.5, p.y - t * 1.5, t * 3, t * 3);
      break;
    case 'crepite': // crépite (s'allume et s'éteint) en fin de vie
      if (progres > 0.55 && Math.sin(feuTemps * 0.05 + p.phase * 7) < 0) return;
      break;
    // 'grain' et 'pixel' : simple carré
  }
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p.couleur;
  ctx.fillRect(p.x - d, p.y - d, t, t);
}

function drawFireworks() {
  if (fireworks.length === 0 && feuNb === 0) return;
  const now = performance.now();
  const alphaAvant = ctx.globalAlpha;
  for (const fw of fireworks) {
    if (fw.exploded || now - fw.spawnTime >= fw.launchDelay) dessinerFusee(fw, now);
  }
  for (let i = 0; i < feuNb; i++) dessinerEclat(feuParticules[i]);
  ctx.globalAlpha = alphaAvant;
}
