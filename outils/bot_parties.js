// Bot des parties automatiques (outils/parties_auto.py) : à chaque tick, il choisit sa direction (plus court chemin vers une pomme
// en évitant son corps et les ennemis), tire sur l'ennemi le plus proche et utilise le bouclier, selon son niveau.
window.lancerBot = function (niveau) {
  const P = {
    faible: {erreur: 0.04, marge: 0, anticipation: 0, tirTous: 6, bruit: 0.45, bouclier: false, prudence: 0.3},
    moyen: {erreur: 0.012, marge: 6, anticipation: 2, tirTous: 3, bruit: 0.18, bouclier: true, prudence: 0.6},
    fort: {erreur: 0.003, marge: 12, anticipation: 4, tirTous: 2, bruit: 0.05, bouclier: true, prudence: 1}
  }[niveau];
  const N = tileCount;
  const dirs = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
  let compteur = 0;
  const tickOriginal = window.tick;

  function cle(x, y) { return y * N + x; }
  function dans(x, y) { return x >= 0 && y >= 0 && x < N && y < N; }

  function casesDanger() {
    const d = new Set();
    const pas = tickInterval;
    enemies.forEach(e => {
      if (performance.now() < (e.frozenUntil || 0) && !e.isBoss) return;
      for (let k = 0; k <= P.anticipation; k++) {
        const ex = e.x + (e.vx || 0) * pas * k, ey = e.y + (e.vy || 0) * pas * k;
        const r = e.radius + gridSize / 2 + P.marge;
        for (let gx = Math.max(0, Math.floor((ex - r) / gridSize)); gx <= Math.min(N - 1, Math.floor((ex + r) / gridSize)); gx++) {
          for (let gy = Math.max(0, Math.floor((ey - r) / gridSize)); gy <= Math.min(N - 1, Math.floor((ey + r) / gridSize)); gy++) {
            if (Math.hypot(gx * gridSize + 10 - ex, gy * gridSize + 10 - ey) < r) d.add(cle(gx, gy));
          }
        }
      }
    });
    return d;
  }

  function corps() {
    const c = new Set();
    for (let i = 0; i < snake.length - 1; i++) c.add(cle(snake[i].x, snake[i].y));
    return c;
  }

  function aire(depart, bloque) {
    const vu = new Set([cle(depart.x, depart.y)]);
    const file = [depart];
    while (file.length && vu.size < 400) {
      const c = file.shift();
      dirs.forEach(d => {
        const x = c.x + d.x, y = c.y + d.y, k = cle(x, y);
        if (dans(x, y) && !bloque.has(k) && !vu.has(k)) { vu.add(k); file.push({x, y}); }
      });
    }
    return vu.size;
  }

  function cibles() {
    const l = [{x: food.x, y: food.y}];
    lootApples.forEach(a => l.push({x: a.x, y: a.y}));
    goldenApples.concat(blueApples).forEach(a => l.push({x: Math.floor(a.x / gridSize), y: Math.floor(a.y / gridSize)}));
    if (heartPickup) l.push({x: Math.floor(heartPickup.x / gridSize), y: Math.floor(heartPickup.y / gridSize)});
    return l;
  }

  function chemin(tete, bloque) {
    const buts = new Set(cibles().map(c => cle(c.x, c.y)));
    const prem = new Map();
    const file = [];
    const vu = new Set([cle(tete.x, tete.y)]);
    dirs.forEach(d => {
      const x = tete.x + d.x, y = tete.y + d.y, k = cle(x, y);
      if (dans(x, y) && !bloque.has(k) && !vu.has(k)) { vu.add(k); prem.set(k, d); file.push({x, y, d}); }
    });
    while (file.length) {
      const c = file.shift();
      if (buts.has(cle(c.x, c.y))) return c.d;
      dirs.forEach(d => {
        const x = c.x + d.x, y = c.y + d.y, k = cle(x, y);
        if (dans(x, y) && !bloque.has(k) && !vu.has(k)) { vu.add(k); file.push({x, y, d: c.d}); }
      });
    }
    return null;
  }

  function decider() {
    if (gameOver || waitingToStart || countdownActive || rollbackPlayback) return;
    const tete = snake[0];
    const sens = (direction.x || direction.y) ? direction : {x: 1, y: 0};
    const possibles = dirs.filter(d => !(d.x === -sens.x && d.y === -sens.y));
    if (Math.random() < P.erreur) {
      // mauvais choix (mais pas droit dans le mur)
      const ok = possibles.filter(p => dans(tete.x + p.x, tete.y + p.y));
      const d = ok[Math.floor(Math.random() * ok.length)];
      if (d) changerDirection(d.x, d.y);
      return;
    }
    const c = corps();
    const danger = casesDanger();
    const bloque = new Set([...c, ...danger]);
    let d = chemin(tete, bloque);
    // vérifie qu'on ne s'enferme pas (selon la prudence du joueur)
    if (d) {
      const nx = tete.x + d.x, ny = tete.y + d.y;
      if (aire({x: nx, y: ny}, c) < Math.min(snake.length * P.prudence, 120)) d = null;
    }
    if (!d) {
      let meilleur = -1;
      possibles.forEach(p => {
        const x = tete.x + p.x, y = tete.y + p.y, k = cle(x, y);
        if (!dans(x, y) || c.has(k)) return;
        const s = aire({x, y}, c) - (danger.has(k) ? 1000 : 0);
        if (s > meilleur) { meilleur = s; d = p; }
      });
    }
    if (d) changerDirection(d.x, d.y);
  }

  function combat() {
    if (gameOver || waitingToStart || countdownActive || !turretPixelPos || !enemies.length) return;
    compteur++;
    if (P.bouclier && performance.now() >= shieldReadyAt) {
      const hx = snake[0].x * gridSize + 10, hy = snake[0].y * gridSize + 10;
      if (enemies.some(e => Math.hypot(e.x - hx, e.y - hy) < e.radius + 30)) activerBouclier();
    }
    if (compteur % P.tirTous || score <= 0) return;
    const cible = ennemiLePlusProche(turretPixelPos.x, turretPixelPos.y);
    const a = angleVersEnnemi(cible) + (Math.random() * 2 - 1) * P.bruit;
    mouseX = turretPixelPos.x + Math.cos(a) * 100;
    mouseY = turretPixelPos.y + Math.sin(a) * 100;
    tenterTir();
  }

  const eliminerOriginal = window.eliminerJoueur;
  window.eliminerJoueur = function () {
    const h = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};
    window.causeFin = dans(h.x, h.y) ? 'coeurs' : 'mur';
    window.dureeFin = Math.round((performance.now() - stats.startTime) / 1000);
    return eliminerOriginal();
  };
  window.tick = function () {
    try { decider(); combat(); } catch (e) { window.erreurBot = String(e); }
    return tickOriginal();
  };
};
