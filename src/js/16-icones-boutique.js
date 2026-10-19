// ============================================================
// --- Icônes de la Boutique : dessins 24 x 24, plus fins que les icônes 12 x 12 du reste du jeu ---
// ============================================================
// Chaque icône est une liste de formes posées sur une grille 24 x 24 (disque, ellipse, rect, poly, trait,
// anneau, pixels). Le reflet en haut, l'ombre en bas et le contour sombre sont ajoutés tout seuls ;
// « plat » coupe le reflet et l'ombre d'une forme, « sc » (sans contour) l'empêche d'être détourée.
// Les thèmes sont de petits tableaux (cadre + décor), les skins sont dessinés par le jeu lui-même puis pixellisés.
const TAILLE_IB = 24;
const CONTOUR_IB = '#15151f';

const ibD = (x, y, r, c, o) => ({d: 'disque', x, y, r, c, ...o});
const ibE = (x, y, rx, ry, c, o) => ({d: 'ellipse', x, y, rx, ry, c, ...o});
const ibR = (x, y, l, h, c, o) => ({d: 'rect', x, y, l, h, c, ...o});
const ibP = (p, c, o) => ({d: 'poly', p, c, ...o});
const ibT = (x1, y1, x2, y2, e, c, o) => ({d: 'trait', x1, y1, x2, y2, e, c, ...o});
const ibA = (x, y, r, e, c, o) => ({d: 'anneau', x, y, r, e, c, ...o});
const ibX = (x, y, l, c, o) => ({d: 'pixels', x, y, l, c, ...o});
// points d'une étoile à n branches (rayons r1 et r2), pour ibP()
function etoileIB(cx, cy, r1, r2, n, rot) {
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (rot || -90) * Math.PI / 180 + i * Math.PI / n;
    const r = i % 2 ? r2 : r1;
    p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  return p;
}
const ECLAT = (x, y) => ibX(x, y, ['w.', '.w'], '#ffffff', {plat: 1});

const DESSINS_BOUTIQUE = {
  // --- améliorations ---
  'amelioration:coeur': [
    ibD(8.2, 9, 4.6, '#e53935'), ibD(15.8, 9, 4.6, '#e53935'), ibP([3.8, 10.5, 20.2, 10.5, 12, 19.6], '#e53935'),
    ibX(6, 7, ['ww', 'w.'], '#ffffff', {plat: 1}),
    ibD(18, 18, 4.4, CONTOUR_IB, {plat: 1}), ibD(18, 18, 3.5, '#4caf50'),
    ibX(16, 16, ['.#.', '###', '.#.'], '#ffffff', {plat: 1})
  ],
  'amelioration:dureeBuffs': [
    ibR(4, 2, 16, 3, '#a0693a'), ibR(4, 19, 16, 3, '#a0693a'),
    ibR(5, 5, 1, 14, '#5d3a1a', {plat: 1}), ibR(18, 5, 1, 14, '#5d3a1a', {plat: 1}),
    ibP([7, 5, 17, 5, 13, 12, 17, 19, 7, 19, 11, 12], '#b3e5fc', {plat: 1}),
    ibP([8.5, 6, 15.5, 6, 12, 10.5], '#ffd740'), ibP([8, 19, 16, 19, 12, 14.5], '#ffd740'),
    ibR(11.5, 10, 1, 7, '#ffd740', {plat: 1}), ibX(8, 7, ['w', 'w'], '#ffffff', {plat: 1})
  ],
  'amelioration:bouclier': [
    ibP([3, 2.5, 21, 2.5, 21, 11, 12, 21.5, 3, 11], '#c9cfdb'),
    ibP([5, 4.5, 19, 4.5, 19, 11, 12, 19, 5, 11], '#2f7bff'),
    ibP([13.5, 5, 8.5, 12.5, 11.8, 12.5, 10.3, 18, 15.8, 10.3, 12.6, 10.3, 14.6, 5], '#ffd740'),
    ibX(6, 6, ['w', 'w'], '#ffffff', {plat: 1})
  ],
  'amelioration:pommeBleue': [
    ibD(9.3, 14, 6.4, '#2f7bff'), ibD(14.7, 14, 6.4, '#2f7bff'), ibD(12, 8.4, 1.6, '#2f7bff', {trou: 1}),
    ibT(12, 9, 13.2, 3.5, 1.7, '#5d3a1a'), ibP([13.5, 6, 17.5, 3, 20, 4.2, 16, 7.4], '#4caf50'),
    ibX(6, 11, ['ww', 'w.'], '#ffffff', {plat: 1})
  ],
  'amelioration:aimant': [
    ibA(12, 11.5, 8, 4.4, '#e53935', {a1: 0, a2: 180}), ibR(4, 5, 4.4, 6.5, '#e53935'), ibR(15.6, 5, 4.4, 6.5, '#e53935'),
    ibR(4, 2, 4.4, 3, '#c9cfdb'), ibR(15.6, 2, 4.4, 3, '#c9cfdb'),
    ibX(9, 2, ['.#', '#.'], '#40c4ff', {plat: 1, sc: 1}), ibX(13, 2, ['#.', '.#'], '#40c4ff', {plat: 1, sc: 1})
  ],
  'amelioration:balles': [
    ibT(1.5, 8.5, 5.5, 8.5, 1, '#ffffff', {plat: 1, sc: 1}), ibT(0.5, 12, 6, 12, 1, '#ffffff', {plat: 1, sc: 1}),
    ibT(1.5, 15.5, 5.5, 15.5, 1, '#ffffff', {plat: 1, sc: 1}),
    ibR(8, 8.5, 2, 7, '#c79100'), ibR(10, 9, 7, 6, '#ffb300'), ibE(17, 12, 4.6, 3, '#c9cfdb'),
    ibR(10, 10, 6, 1, '#ffe082', {plat: 1})
  ],
  'amelioration:avarice': [
    ibE(9, 19, 6.5, 2.6, '#ffb300'), ibE(9, 16.5, 6.5, 2.6, '#ffd740'), ibE(9, 14, 6.5, 2.6, '#ffb300'),
    ibD(15.5, 9.5, 6.3, '#ffd740'), ibA(15.5, 9.5, 4.2, 1, '#c79100', {plat: 1}),
    ibX(14, 7, ['.##', '#..', '.#.', '..#', '##.'], '#c79100', {plat: 1}), ECLAT(11, 5)
  ],

  // --- buffs de la pomme bleue ---
  'buff:freeze': [
    ibT(12, 2, 12, 22, 2.2, '#80d8ff'), ibT(3.3, 7, 20.7, 17, 2.2, '#80d8ff'), ibT(3.3, 17, 20.7, 7, 2.2, '#80d8ff'),
    ibT(12, 6, 9.5, 3.5, 1.5, '#80d8ff'), ibT(12, 6, 14.5, 3.5, 1.5, '#80d8ff'),
    ibT(12, 18, 9.5, 20.5, 1.5, '#80d8ff'), ibT(12, 18, 14.5, 20.5, 1.5, '#80d8ff'),
    ibD(12, 12, 2.6, '#ffffff', {plat: 1})
  ],
  'buff:laser': [
    ibT(13, 14.5, 23, 14.5, 4, '#ff5252', {plat: 1}), ibT(13, 14.5, 23, 14.5, 1.2, '#ffffff', {plat: 1, sc: 1}),
    ibR(7, 12.5, 7, 4, '#4b5263'), ibD(7, 15, 5, '#8b93a5'), ibD(7, 15, 2, '#ff5252', {plat: 1}),
    ibX(15, 6, ['..#', '.#.', '###', '.#.', '#..'], '#ffd740', {plat: 1}), ECLAT(4, 11)
  ],
  'buff:autoaim': [
    ibD(12, 12, 9.5, '#e53935'), ibD(12, 12, 7.3, '#ffffff', {plat: 1}), ibD(12, 12, 5.2, '#e53935', {plat: 1}),
    ibD(12, 12, 3, '#ffffff', {plat: 1}), ibD(12, 12, 1.3, '#e53935', {plat: 1}),
    ibT(12, 0.5, 12, 5.5, 1.4, '#15151f', {plat: 1}), ibT(12, 18.5, 12, 23.5, 1.4, '#15151f', {plat: 1}),
    ibT(0.5, 12, 5.5, 12, 1.4, '#15151f', {plat: 1}), ibT(18.5, 12, 23.5, 12, 1.4, '#15151f', {plat: 1})
  ],
  'buff:explode': [
    ibP(etoileIB(12, 12, 11, 5.5, 10, -90), '#ff6d00'), ibP(etoileIB(12, 12, 7.5, 3.8, 10, -72), '#ffd740'),
    ibD(12, 12, 2.4, '#ffffff', {plat: 1})
  ],
  'buff:invincible': [
    ibP(etoileIB(12, 13, 10, 4.2, 5, -90), '#ffd740'), ibX(9, 9, ['w', 'w'], '#ffffff', {plat: 1}),
    ibX(1, 2, ['.#.', '###', '.#.'], '#ffffff', {plat: 1, sc: 1}), ibX(19, 1, ['.#.', '###', '.#.'], '#fff59d', {plat: 1, sc: 1}),
    ibX(20, 18, ['#'], '#ffffff', {plat: 1, sc: 1})
  ],
  'buff:doublepoints': [
    ibD(12, 12, 10, '#ffd740'), ibA(12, 12, 8, 1, '#c79100', {plat: 1}),
    ibX(6, 9, ['#...#.###.', '.#.#.....#', '..#....##.', '.#.#..#...', '#...#.####'], '#7a4a00', {plat: 1}),
    ECLAT(6, 5)
  ],

  // --- capacités ---
  'capacite:bouclier': [
    ibA(12, 12, 10.5, 2, '#40c4ff', {plat: 1}), ibA(12, 12, 10.5, 0.8, '#b3e5fc', {plat: 1, sc: 1, a1: 200, a2: 260}),
    ibE(12, 13, 5.5, 5, '#4caf50'), ibX(9, 11, ['w..w'], '#ffffff', {plat: 1}), ibX(9, 12, ['k..k'], '', {plat: 1}),
    ibT(12, 17.5, 12, 19.5, 1, '#e53935', {plat: 1})
  ],
  'capacite:sprint': [
    ibT(1, 9, 6, 9, 1, '#ffffff', {plat: 1, sc: 1}), ibT(0, 12, 5, 12, 1, '#ffffff', {plat: 1, sc: 1}),
    ibT(1, 15, 6, 15, 1, '#ffffff', {plat: 1, sc: 1}),
    ibE(10, 12, 4, 3, '#4caf50'), ibE(16, 12, 5.5, 4.6, '#4caf50'), ibX(17, 9, ['w', 'k'], '', {plat: 1}),
    ibT(21, 13, 23, 13, 1, '#e53935', {plat: 1, sc: 1}),
    ibP([6, 9.5, 2.5, 12, 6, 14.5], '#ff9800')
  ]
};

// --- Thèmes : un petit tableau (cadre aux couleurs du thème, décor à l'intérieur) ---
const CADRE_IB = {x: 1, y: 2, l: 22, h: 20};
const TABLEAUX_THEMES = {
  neon: {fond: '#05070f', bord: '#39ff14', formes: [
    ibT(2, 18, 22, 18, 1, '#0f3d12'), ibT(2, 14, 22, 14, 1, '#0f3d12'), ibT(7, 3, 7, 21, 1, '#0f3d12'), ibT(16, 3, 16, 21, 1, '#0f3d12'),
    ibT(4, 16, 10, 16, 2, '#39ff14'), ibT(10, 16, 10, 9, 2, '#39ff14'), ibT(10, 9, 16, 9, 2, '#39ff14'), ibD(17, 9, 1.8, '#7dffb0'),
    ibD(17, 16, 1.6, '#ff2079')]},
  espace: {fond: '#04061a', bord: '#7c4dff', formes: [
    ibX(3, 4, ['#.......#.........', '.............#....', '....#.............', '..................',
      '................#.', '..#...............', '..................', '.........#........', '#.................',
      '...............#..', '....#.............', '...........#......', '..................', '..#...........#...'], '#ffffff'),
    ibD(12, 12, 4.6, '#7c4dff'), ibD(10.8, 10.6, 1.6, '#b39dff'), ibT(4, 15.5, 20, 8.5, 1, '#ffd740'), ibD(19, 18, 1.4, '#b3e5fc')]},
  lave: {fond: '#2a0a05', bord: '#ff6d00', formes: [
    ibP([1, 22, 9, 10, 15, 10, 23, 22], '#4b2a20'), ibP([9, 10, 15, 10, 13.5, 12, 10.5, 12], '#ff6d00'),
    ibT(11, 12, 8, 21, 1.5, '#ff6d00'), ibT(13.5, 12, 16, 21, 1.5, '#ff9800'),
    ibX(9, 4, ['..#..#', '#.....', '...#..', '.#...#'], '#ffd740'), ibR(1, 20, 22, 2, '#ff3d00')]},
  ocean: {fond: '#03344f', bord: '#00e5ff', formes: [
    ibR(1, 2, 22, 5, '#0a5a80'), ibT(2, 7, 6, 6, 1.2, '#00e5ff'), ibT(6, 6, 10, 7, 1.2, '#00e5ff'), ibT(10, 7, 14, 6, 1.2, '#00e5ff'),
    ibT(14, 6, 18, 7, 1.2, '#00e5ff'), ibT(18, 7, 22, 6, 1.2, '#00e5ff'),
    ibE(12, 13, 4, 2.4, '#ff9800'), ibP([7.5, 13, 5, 10.5, 5, 15.5], '#ff9800'), ibX(14, 12, ['k'], ''),
    ibT(4, 21, 3, 16, 1.4, '#2e7d32'), ibT(20, 21, 21, 15, 1.4, '#43a047'), ibX(17, 9, ['#.', '..', '.#'], '#b3e5fc')]},
  aurore: {fond: '#06142e', bord: '#80d8ff', formes: [
    ibT(2, 7, 7, 5, 2, '#69f0ae'), ibT(7, 5, 12, 7, 2, '#69f0ae'), ibT(12, 7, 17, 4, 2, '#69f0ae'), ibT(17, 4, 22, 6, 2, '#69f0ae'),
    ibT(2, 10, 8, 8, 1.2, '#b388ff'), ibT(8, 8, 15, 10, 1.2, '#b388ff'), ibT(15, 10, 22, 8, 1.2, '#b388ff'),
    ibE(12, 22, 14, 4.5, '#e1f5fe'), ibP([16, 18, 18.5, 12, 21, 18], '#1b5e20'), ibR(18, 18, 1, 2, '#5d3a1a'),
    ibX(4, 13, ['#.....#', '...#...'], '#ffffff')]},
  foret: {fond: '#0b1a10', bord: '#9ccc65', formes: [
    ibP([2, 16, 6, 6, 10, 16], '#2e7d32'), ibR(5.5, 16, 1, 4, '#5d3a1a'),
    ibP([9, 18, 14, 4, 19, 18], '#43a047'), ibR(13.5, 18, 1, 3, '#5d3a1a'),
    ibP([17, 17, 20.5, 9, 24, 17], '#2e7d32'), ibR(1, 20, 22, 2, '#33691e'), ibD(8.5, 19.5, 1.2, '#ff5252'), ibD(11, 20, 1, '#ff5252')]},
  desert: {fond: '#ffb74d', bord: '#ffb74d', formes: [
    ibR(1, 2, 22, 5, '#ff9e40'), ibD(16, 8, 3.2, '#fff176'), ibE(6, 22, 10, 6, '#e0a050'), ibE(19, 23, 9, 6, '#c27c3a'),
    ibR(7, 9, 2, 9, '#43a047'), ibR(4, 12, 2, 3, '#43a047'), ibR(4, 14, 4, 1.5, '#43a047'), ibR(10, 11, 2, 3, '#43a047'),
    ibR(8, 12, 4, 1.5, '#43a047')]},
  synthwave: {fond: '#1a0033', bord: '#ff2bd6', formes: [
    ibD(12, 11, 6, '#ff9e40'), ibD(12, 11, 6, '#ff2bd6', {clipY: 11}), ibR(5, 12, 14, 1, '#1a0033'), ibR(5, 14.5, 14, 1, '#1a0033'),
    ibR(1, 16, 22, 6, '#2a0050'), ibT(1, 16, 23, 16, 1, '#ff2bd6'), ibT(1, 19, 23, 19, 1, '#ff2bd6'),
    ibT(12, 16, 12, 22, 1, '#ff2bd6'), ibT(9, 16, 4, 22, 1, '#ff2bd6'), ibT(15, 16, 20, 22, 1, '#ff2bd6'),
    ibX(3, 4, ['#.........', '.......#..'], '#ffffff')]},
  halloween: {fond: '#2a1238', bord: '#ff7518', formes: [
    ibD(17, 7, 3.4, '#fff3c4'), ibD(18.5, 6, 2.6, '#2a1238'), ibX(4, 5, ['#.#.#', '.###.', '..#..'], '#15151f'),
    ibE(12, 17, 6.5, 4.6, '#ff7518'), ibT(12, 12.5, 12.8, 10.5, 1.4, '#43a047'),
    ibX(9, 15, ['#...#', '.....', '.###.'], '#2a1238'), ibX(8, 4, ['#...........'], '#ffffff'), ibR(1, 20.5, 22, 1.5, '#15151f')]}
};

function melangerIB(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = s => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}

function dansFormeIB(f, x, y) {
  if (f.clipY !== undefined && y < f.clipY) return false;
  switch (f.d) {
    case 'disque': return (x - f.x) ** 2 + (y - f.y) ** 2 <= f.r * f.r;
    case 'ellipse': return ((x - f.x) / f.rx) ** 2 + ((y - f.y) / f.ry) ** 2 <= 1;
    case 'rect': return x >= f.x && x < f.x + f.l && y >= f.y && y < f.y + f.h;
    case 'poly': {
      let dedans = false;
      for (let i = 0, j = f.p.length - 2; i < f.p.length; j = i, i += 2) {
        const xi = f.p[i], yi = f.p[i + 1], xj = f.p[j], yj = f.p[j + 1];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) dedans = !dedans;
      }
      return dedans;
    }
    case 'trait': {
      const dx = f.x2 - f.x1, dy = f.y2 - f.y1;
      const t = Math.max(0, Math.min(1, ((x - f.x1) * dx + (y - f.y1) * dy) / (dx * dx + dy * dy || 1)));
      return Math.hypot(x - f.x1 - t * dx, y - f.y1 - t * dy) <= (f.e || 1.5) / 2;
    }
    case 'anneau': {
      const d = Math.hypot(x - f.x, y - f.y);
      if (d > f.r || d < f.r - f.e) return false;
      if (f.a1 === undefined) return true;
      const a = (Math.atan2(y - f.y, x - f.x) * 180 / Math.PI + 360) % 360;
      return f.a1 <= f.a2 ? a >= f.a1 && a <= f.a2 : a >= f.a1 || a <= f.a2;
    }
  }
  return false;
}

// formes -> 24 x 24 couleurs (null = transparent), avec reflet, ombre et contour
function rasteriserIB(formes, cadre) {
  const N = TAILLE_IB;
  const g = new Array(N * N).fill(null);
  const poser = (f, x, y, c) => {
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    if (cadre && f.dansCadre && (x < cadre.x + 1 || y < cadre.y + 1 || x >= cadre.x + cadre.l - 1 || y >= cadre.y + cadre.h - 1)) return;
    g[y * N + x] = f.trou ? null : {c, m: f.m || c, plat: !!f.plat, sc: !!f.sc};
  };
  formes.forEach(f => {
    if (f.d === 'pixels') {
      f.l.forEach((ligne, dy) => ligne.split('').forEach((ch, dx) => {
        if (ch !== '.') poser(f, f.x + dx, f.y + dy, ch === '#' ? f.c : PALETTE_ICONES[ch]);
      }));
      return;
    }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (dansFormeIB(f, x + 0.5, y + 0.5)) poser(f, x, y, f.c);
  });
  if (cadre) {
    // coins arrondis du tableau
    [[cadre.x, cadre.y], [cadre.x + cadre.l - 1, cadre.y], [cadre.x, cadre.y + cadre.h - 1],
      [cadre.x + cadre.l - 1, cadre.y + cadre.h - 1]].forEach(([x, y]) => { g[y * N + x] = null; });
  }
  const a = (x, y) => (x < 0 || y < 0 || x >= N || y >= N) ? null : g[y * N + x];
  const sortie = g.map((p, i) => {
    if (!p) return null;
    if (p.plat) return p.c;
    const x = i % N, y = (i - x) / N;
    const meme = q => q && q.m === p.m;
    if (!meme(a(x, y - 1))) return melangerIB(p.c, '#ffffff', 0.35);
    if (!meme(a(x, y + 1))) return melangerIB(p.c, '#000000', 0.32);
    if (!meme(a(x + 1, y))) return melangerIB(p.c, '#000000', 0.16);
    return p.c;
  });
  g.forEach((p, i) => {
    if (p) return;
    const x = i % N, y = (i - x) / N;
    if ([a(x - 1, y), a(x + 1, y), a(x, y - 1), a(x, y + 1)].some(q => q && !q.sc)) sortie[i] = CONTOUR_IB;
  });
  return sortie;
}

function canvasDepuisIB(pixels) {
  const c = document.createElement('canvas');
  c.width = c.height = TAILLE_IB;
  const g = c.getContext('2d');
  pixels.forEach((coul, i) => {
    if (!coul) return;
    g.fillStyle = coul;
    g.fillRect(i % TAILLE_IB, Math.floor(i / TAILLE_IB), 1, 1);
  });
  return c;
}

// couleur de chaque skin sur son étagère (en jeu, les ennemis prennent la couleur du thème)
const COULEURS_SKINS_IB = {urchin: '#ff4f7a', ghost: '#d7dcff', pixel: '#4caf50', slime: '#66bb6a', bat: '#9c4dcc',
  jelly: '#ce93d8', eye: '#ffffff', drone: '#90a4ae', spider: '#7e57c2', crab: '#ff5722', pumpkin: '#ff7518', mushroom: '#e53935'};

// --- Skins : le jeu dessine un ennemi en grand, on le réduit à 24 x 24 et on le détoure comme les autres ---
function pixelsSkinIB(skin) {
  const grand = document.createElement('canvas');
  grand.width = grand.height = 96;
  const ennemi = {x: 48, y: 50, vx: 0, vy: 0, radius: 30, color: COULEURS_SKINS_IB[skin] || '#ff4f7a', hp: 1, maxHp: 1, isBoss: false,
    hitFlashUntil: 0, frozenUntil: 0, neA: -1e9, phase: 0.6};
  const ctxJeu = ctx, ennemisJeu = enemies, skinJeu = enemySkin, pauseJeu = isPaused, themeJeu = currentTheme;
  ctx = grand.getContext('2d');
  enemies = [ennemi];
  enemySkin = skin;
  isPaused = true; // pose figée
  currentTheme = Object.assign({}, currentTheme, {glow: false, enemyStroke: '#ffffff'});
  try {
    drawEnemies();
  } catch (err) {
    return null;
  } finally {
    ctx = ctxJeu;
    enemies = ennemisJeu;
    enemySkin = skinJeu;
    isPaused = pauseJeu;
    currentTheme = themeJeu;
  }
  return reduireIB(grand);
}

// réduction d'un dessin 96 x 96 : chaque case de 4 x 4 prend la couleur moyenne de ses pixels opaques
// (s'il y en a au moins 4), puis détourage comme les autres icônes
function reduireIB(grand) {
  const N = TAILLE_IB;
  const d = grand.getContext('2d').getImageData(0, 0, 96, 96).data;
  const formes = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let r = 0, v = 0, b = 0, n = 0;
    for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) {
      const i = ((y * 4 + dy) * 96 + x * 4 + dx) * 4;
      if (d[i + 3] > 100) { r += d[i]; v += d[i + 1]; b += d[i + 2]; n++; }
    }
    if (n < 4) continue; // case trop peu couverte (bord, ombre au sol)
    const hex = '#' + ((1 << 24) | (Math.round(r / n) << 16) | (Math.round(v / n) << 8) | Math.round(b / n)).toString(16).slice(1);
    formes.push(ibX(x, y, ['#'], hex, {plat: 1}));
  }
  return rasteriserIB(formes);
}

// --- Skins du serpent : un petit serpent en U dessiné par le jeu (tête en haut à droite), réduit en 24 x 24 ---
function pixelsSerpentIB(cle) {
  const grand = document.createElement('canvas');
  grand.width = grand.height = 96;
  const cases = [{x: 2, y: 1}, {x: 2, y: 2}, {x: 1, y: 2}, {x: 0, y: 2}, {x: 0, y: 1}, {x: 0, y: 0}];
  const ctxJeu = ctx;
  ctx = grand.getContext('2d');
  try {
    ctx.translate(5, 5);
    ctx.scale(1.45, 1.45); // 3 cases de côté sur 96 pixels
    dessinerSerpentModele(joueurModele(cases, {x: 0, y: -1}), 1, cle, {glow: false});
  } catch (err) {
    return null;
  } finally {
    ctx = ctxJeu;
  }
  return reduireIB(grand);
}

// --- Tourelles : la tourelle dessinée par le jeu en grand, canon vers le haut à droite, réduite en 24 x 24 ---
function pixelsTourelleIB(cle) {
  const grand = document.createElement('canvas');
  grand.width = grand.height = 96;
  const ctxJeu = ctx;
  ctx = grand.getContext('2d');
  try {
    ctx.translate(34, 62);
    ctx.scale(2.6, 2.6);
    dessinerTourelleModele(0, 0, -Math.PI / 4, cle, {glow: false});
  } catch (err) {
    return null;
  } finally {
    ctx = ctxJeu;
  }
  return reduireIB(grand);
}

const cacheIconesBoutique = {};
// url (data:) de l'icône d'un objet de la Boutique, ou null s'il n'a pas de dessin à lui
function urlIconeBoutique(cle) {
  if (cle in cacheIconesBoutique) return cacheIconesBoutique[cle];
  let pixels = null;
  const [categorie, nom] = cle.split(':');
  if (DESSINS_BOUTIQUE[cle]) {
    pixels = rasteriserIB(DESSINS_BOUTIQUE[cle]);
  } else if (categorie === 'theme' && TABLEAUX_THEMES[nom]) {
    const t = TABLEAUX_THEMES[nom];
    const k = CADRE_IB;
    pixels = rasteriserIB([ibR(k.x, k.y, k.l, k.h, t.bord, {plat: 1}), ibR(k.x + 1, k.y + 1, k.l - 2, k.h - 2, t.fond, {plat: 1})]
      .concat(t.formes.map(f => Object.assign({plat: 1, sc: 1}, f, {dansCadre: true}))), k);
  } else if (categorie === 'skin') {
    pixels = pixelsSkinIB(nom);
  } else if (categorie === 'serpent') {
    pixels = pixelsSerpentIB(nom);
  } else if (categorie === 'tourelle') {
    pixels = pixelsTourelleIB(nom);
  }
  cacheIconesBoutique[cle] = pixels ? canvasDepuisIB(pixels).toDataURL() : null;
  return cacheIconesBoutique[cle];
}

// HTML de l'icône d'un objet ; sans dessin à lui, l'icône 12 x 12 de son emoji
function htmlIconeBoutique(cle, emoji) {
  const url = urlIconeBoutique(cle);
  return url ? '<i class="ib" style="background-image:url(' + url + ')"></i>' : htmlIcone(emoji);
}
