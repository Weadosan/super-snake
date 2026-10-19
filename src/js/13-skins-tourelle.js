// ============================================================
// --- Skins de la tourelle du joueur (J1) ---
// ============================================================
// « Classique » garde la tourelle du thème (dessinerTourelleTheme, js/13-dessin-combat.js). Les autres ont leur
// propre canon et leur propre base. Ils s'achètent à l'échoppe de Sifflet (prix dans reglagesProgression.tourelles)
// et se choisissent dans le menu ☰ ou à la Boutique. Le choix est gardé dans snakeSkinTourelle. En coop, le J2
// garde la tourelle du thème. Chaque dessin reçoit le contexte déjà placé sur la tourelle, non tourné :
//   dessin(c, angle, L, R, now) avec L la longueur du canon et R le rayon de la base.
const skinsTourelle = {
  classique: {nom: 'Classique', icone: '🎯', detail: 'La tourelle du thème, assortie au décor'},
  canon: {nom: 'Canon de pirate', icone: '💣', lueur: '#ffb74d',
    detail: 'Un gros canon de bronze cerclé, sur sa roue en bois'},
  arbalete: {nom: 'Arbalète', icone: '🏹', lueur: '#bcaaa4', detail: 'Un arc de bois tendu, carreau prêt à partir'},
  fleur: {nom: 'Tournesol', icone: '🌱', lueur: '#ffeb3b', detail: 'Une fleur qui tourne la tête vers les ennemis'},
  gatling: {nom: 'Gatling', icone: '⚙️', lueur: '#90a4ae', detail: 'Trois canons qui tournent sans arrêt'},
  blaster: {nom: 'Blaster', icone: '⚡', lueur: '#00e5ff', detail: 'Canon à énergie, ses anneaux se chargent l\'un après l\'autre'},
  dragon: {nom: 'Tête de dragon', icone: '🔥', lueur: '#ff9100', detail: 'Une tête de dragon qui crache des flammes. La plus chère'}
};

const cleStockageSkinTourelle = 'snakeSkinTourelle';
let skinTourelle = (() => {
  try {
    const lu = localStorage.getItem(cleStockageSkinTourelle);
    return skinsTourelle[lu] ? lu : 'classique';
  } catch (e) {
    return 'classique';
  }
})();
let tourelleModele = null; // tourelle imposée pour une icône ou un aperçu, même pas encore achetée

// tourelle d'un joueur : J1 seulement, et seulement si elle est débloquée
function cleTourelleJoueur(j) {
  if (!j || j.numero !== 0) return 'classique';
  if (tourelleModele) return tourelleModele;
  return contenuDebloque('tourelle', skinTourelle) ? skinTourelle : 'classique';
}

// tourelle du joueur actif centrée en (x, y), canon tourné de angle
function dessinerTourelle(x, y, angle, L, laser, now) {
  const cle = cleTourelleJoueur(joueurActif);
  const dessin = DESSINS_TOURELLES[cle];
  if (!dessin) return dessinerTourelleTheme(x, y, angle, L, laser, now);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowColor = laser ? '#ff6d00' : skinsTourelle[cle].lueur;
  ctx.shadowBlur = laser ? 14 : (currentTheme.glow ? 8 : 0);
  dessin(ctx, angle, L, gridSize / 3, now);
  if (laser) {
    // buff laser : cœur lumineux orange et blanc dans l'axe du canon, comme la tourelle du thème
    ctx.rotate(angle);
    ctx.shadowColor = '#ff6d00';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(255, 109, 0, 0.85)';
    ctx.fillRect(0, -1.6, L, 3.2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(0, -0.7, L, 1.4);
  }
  ctx.restore();
}

// petit cercle plein
function rondTourelle(c, x, y, r, couleur) {
  c.fillStyle = couleur;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

const DESSINS_TOURELLES = {
  canon(c, angle, L, R, now) {
    // roue en bois à rayons, sous le canon
    c.fillStyle = '#6d4c41';
    c.strokeStyle = '#3e2723';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, 0, R * 1.1, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.shadowBlur = 0;
    c.lineWidth = 1.2;
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 4;
      c.beginPath();
      c.moveTo(Math.cos(a) * R, Math.sin(a) * R);
      c.lineTo(-Math.cos(a) * R, -Math.sin(a) * R);
      c.stroke();
    }
    // fût de bronze qui s'affine, cerclé, avec son bouton à l'arrière
    c.rotate(angle);
    rondTourelle(c, -3.5, 0, 2.6, '#8d6e00');
    const grad = c.createLinearGradient(0, -5, 0, 5);
    grad.addColorStop(0, '#ffe082');
    grad.addColorStop(0.45, '#c79100');
    grad.addColorStop(1, '#6d4c00');
    c.fillStyle = grad;
    c.beginPath();
    c.moveTo(-3, -5);
    c.lineTo(L, -3.6);
    c.lineTo(L, 3.6);
    c.lineTo(-3, 5);
    c.closePath();
    c.fill();
    c.fillStyle = '#5d4000';
    [L * 0.3, L - 2.5].forEach(x => c.fillRect(x, -4.8, 2, 9.6));
    rondTourelle(c, L, 0, 2.2, '#1a1a1a');
  },

  arbalete(c, angle, L, R, now) {
    // base de fer ronde
    c.fillStyle = '#455a64';
    c.strokeStyle = '#b0bec5';
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(0, 0, R, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.shadowBlur = 0;
    c.rotate(angle);
    // fût en bois
    c.fillStyle = '#8d6e63';
    c.strokeStyle = '#4e342e';
    c.lineWidth = 1;
    c.fillRect(-3, -2, L * 0.85 + 3, 4);
    c.strokeRect(-3, -2, L * 0.85 + 3, 4);
    // arc courbé et sa corde tendue vers l'arrière
    const xa = L * 0.62;
    c.strokeStyle = '#5d4037';
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(xa - 2, -10);
    c.quadraticCurveTo(xa + 6, 0, xa - 2, 10);
    c.stroke();
    c.strokeStyle = '#eceff1';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(xa - 2, -10);
    c.lineTo(L * 0.3, 0);
    c.lineTo(xa - 2, 10);
    c.stroke();
    // carreau
    c.strokeStyle = '#cfd8dc';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(L * 0.3, 0);
    c.lineTo(L + 1, 0);
    c.stroke();
    c.fillStyle = '#eceff1';
    c.beginPath();
    c.moveTo(L + 4, 0);
    c.lineTo(L, -2.2);
    c.lineTo(L, 2.2);
    c.closePath();
    c.fill();
  },

  fleur(c, angle, L, R, now) {
    // tige verte et sa feuille, puis la fleur par-dessus (elle tourne doucement)
    c.save();
    c.rotate(angle);
    c.fillStyle = '#43a047';
    c.strokeStyle = '#1b5e20';
    c.lineWidth = 1;
    c.fillRect(0, -2, L, 4);
    c.strokeRect(0, -2, L, 4);
    c.beginPath();
    c.ellipse(L * 0.55, -4, 4, 2, -0.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    rondTourelle(c, L, 0, 2.6, '#6d4c41');
    c.restore();
    const tour = now / 2500;
    for (let k = 0; k < 10; k++) {
      const a = tour + k * Math.PI / 5;
      c.save();
      c.rotate(a);
      c.beginPath();
      c.ellipse(R * 0.95, 0, R * 0.6, R * 0.32, 0, 0, Math.PI * 2);
      c.fillStyle = k % 2 ? '#ffd600' : '#ffea00';
      c.fill();
      c.strokeStyle = '#f57f17';
      c.lineWidth = 0.6;
      c.stroke();
      c.restore();
    }
    c.shadowBlur = 0;
    rondTourelle(c, 0, 0, R * 0.62, '#5d4037');
    c.fillStyle = '#3e2723';
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3;
      rondTourelle(c, Math.cos(a) * R * 0.32, Math.sin(a) * R * 0.32, 0.7, '#a1887f');
    }
  },

  gatling(c, angle, L, R, now) {
    c.rotate(angle);
    // base blindée carrée, tournée avec le canon, et ses rivets
    c.fillStyle = '#37474f';
    c.strokeStyle = '#90a4ae';
    c.lineWidth = 1.6;
    c.fillRect(-R, -R, R * 2, R * 2);
    c.strokeRect(-R, -R, R * 2, R * 2);
    c.shadowBlur = 0;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => rondTourelle(c, a * R * 0.6, b * R * 0.6, 0.9, '#cfd8dc'));
    // trois canons qui tournent : on dessine d'abord ceux de derrière
    const phase = now / 70;
    [0, 1, 2].map(k => phase + k * Math.PI * 2 / 3)
      .sort((a, b) => Math.cos(a) - Math.cos(b))
      .forEach(a => {
        const y = Math.sin(a) * 3;
        const clair = 0.5 + Math.cos(a) * 0.5;
        c.fillStyle = 'rgb(' + Math.round(70 + clair * 120) + ', ' + Math.round(80 + clair * 120) + ', ' + Math.round(90 + clair * 120) + ')';
        c.fillRect(1, y - 1.3, L, 2.6);
      });
    // colliers qui tiennent les canons
    c.fillStyle = '#263238';
    c.fillRect(L * 0.35, -5, 2, 10);
    c.fillRect(L - 2, -5, 2, 10);
  },

  blaster(c, angle, L, R, now) {
    // base blanche avec un anneau d'énergie qui tourne
    c.fillStyle = '#eceff1';
    c.strokeStyle = '#90a4ae';
    c.lineWidth = 1.4;
    c.beginPath();
    c.arc(0, 0, R, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.strokeStyle = '#00e5ff';
    c.lineWidth = 1.8;
    c.beginPath();
    c.arc(0, 0, R * 0.6, now / 300, now / 300 + Math.PI * 1.3);
    c.stroke();
    c.shadowBlur = 0;
    c.rotate(angle);
    // corps effilé
    c.fillStyle = '#f5f5f5';
    c.strokeStyle = '#78909c';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, -4.2);
    c.lineTo(L * 0.85, -2.8);
    c.lineTo(L * 0.85, 2.8);
    c.lineTo(0, 4.2);
    c.closePath();
    c.fill();
    c.stroke();
    // anneaux qui s'allument l'un après l'autre, puis la pointe qui pulse
    const allume = Math.floor(now / 140) % 4;
    [0.25, 0.45, 0.65].forEach((k, i) => {
      c.fillStyle = i < allume ? '#00e5ff' : '#4dd0e1';
      c.globalAlpha = i < allume ? 1 : 0.35;
      c.fillRect(L * k, -3.6, 1.8, 7.2);
    });
    c.globalAlpha = 1;
    c.shadowColor = '#00e5ff';
    c.shadowBlur = 8;
    rondTourelle(c, L * 0.9, 0, 2.3 + Math.sin(now / 110) * 0.6, '#84ffff');
  },

  dragon(c, angle, L, R, now) {
    // cou couvert d'écailles
    c.fillStyle = '#2e7d32';
    c.strokeStyle = '#1b5e20';
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(0, 0, R * 1.05, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.shadowBlur = 0;
    c.rotate(angle);
    // flammes qui lèchent la gueule
    const f = Math.sin(now / 60) * 1.5;
    [['#ff5722', 7 + f, 3.2], ['#ffc107', 4.5 + f * 0.6, 1.9]].forEach(([coul, long, larg]) => {
      c.fillStyle = coul;
      c.beginPath();
      c.moveTo(L - 1, -larg);
      c.quadraticCurveTo(L + long * 0.6, -larg * 0.6, L + long, 0);
      c.quadraticCurveTo(L + long * 0.6, larg * 0.6, L - 1, larg);
      c.closePath();
      c.fill();
    });
    // cornes vers l'arrière
    c.strokeStyle = '#f5e6c8';
    c.lineWidth = 1.8;
    [1, -1].forEach(s => {
      c.beginPath();
      c.moveTo(1, s * 4);
      c.quadraticCurveTo(-3, s * 5, -6, s * 8.5);
      c.stroke();
    });
    // tête allongée
    c.fillStyle = '#43a047';
    c.strokeStyle = '#1b5e20';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-2, -5);
    c.quadraticCurveTo(L * 0.6, -7, L, -2.6);
    c.lineTo(L, 2.6);
    c.quadraticCurveTo(L * 0.6, 7, -2, 5);
    c.closePath();
    c.fill();
    c.stroke();
    // gueule, narines et yeux jaunes à pupille fendue
    c.strokeStyle = '#1b5e20';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(L * 0.55, 0);
    c.lineTo(L, 0);
    c.stroke();
    rondTourelle(c, L - 2.5, -1.6, 0.6, '#1b5e20');
    rondTourelle(c, L - 2.5, 1.6, 0.6, '#1b5e20');
    [1, -1].forEach(s => {
      rondTourelle(c, L * 0.35, s * 3.3, 1.7, '#ffeb3b');
      c.fillStyle = '#1a1a1a';
      c.fillRect(L * 0.35 - 0.35, s * 3.3 - 1.4, 0.7, 2.8);
    });
  }
};

// --- Choix ---
function choisirSkinTourelle(cle) {
  if (!skinsTourelle[cle] || !contenuDebloque('tourelle', cle)) return false;
  skinTourelle = cle;
  try {
    localStorage.setItem(cleStockageSkinTourelle, cle);
  } catch (e) {
    // stockage indisponible : le choix vaut pour cette session
  }
  majBoutonsSkinTourelle();
  if (typeof majLegendeApercu === 'function') majLegendeApercu();
  return true;
}

// boutons du menu ☰ (créés ici à partir de skinsTourelle)
const selecteurSkinTourelle = document.getElementById('turretSkinSelector');
Object.keys(skinsTourelle).forEach(cle => {
  const s = skinsTourelle[cle];
  const b = document.createElement('button');
  b.className = 'tourelle-btn';
  b.dataset.tourelle = cle;
  b.dataset.nom = s.nom;
  b.textContent = s.icone + ' ' + s.nom;
  b.addEventListener('click', () => {
    // pas encore achetée : la Boutique s'ouvre pour la montrer (js/16-menu-buffs.js)
    if (!contenuDebloque('tourelle', cle)) return ouvrirMenuBuffs('tourelle:' + cle);
    choisirSkinTourelle(cle);
  });
  selecteurSkinTourelle.appendChild(b);
});

function majBoutonsSkinTourelle() {
  const actuel = cleTourelleJoueur({numero: 0});
  document.querySelectorAll('.tourelle-btn').forEach(b => {
    const cle = b.dataset.tourelle;
    const ok = contenuDebloque('tourelle', cle);
    b.classList.toggle('active', cle === actuel);
    b.classList.toggle('verrouille', !ok);
    b.title = ok ? '' : 'À acheter dans la Boutique (' + prixContenu('tourelle', cle) + ' Écailles)';
  });
}

// tourelle de démonstration (aperçu du menu ☰, icônes de la Boutique) : la tourelle cle en (x, y)
function dessinerTourelleModele(x, y, angle, cle, themeEnPlus) {
  const avantJoueur = joueurActif, avantTheme = currentTheme;
  joueurActif = joueurs[0];
  tourelleModele = cle;
  currentTheme = Object.assign({}, paletteJoueur(joueurs[0]), themeEnPlus || {});
  try {
    dessinerTourelle(x, y, angle, gridSize * 0.9, false, performance.now());
  } finally {
    joueurActif = avantJoueur;
    currentTheme = avantTheme;
    tourelleModele = null;
  }
}
