// ============================================================
// --- Commandes tactiles (smartphone / tablette) ---
// ============================================================
// Zone de déplacement : glisser pour tourner (on peut enchaîner les virages sans lever le doigt).
// Zone de visée : stick virtuel qui oriente la tourelle ; poussé à fond, il tire en continu.
// Les zones, le stick et les boutons se placent avec l'éditeur de disposition (js/18-disposition.js).
// Un simple toucher n'importe où démarre, reprend ou rejoue ; dans la zone de visée pendant la partie, il tire une fois.
// Le tactile pilote toujours le joueur 1 (comme la souris).
const seuilGlissement = 24; // px écran au-delà desquels un toucher devient un glissement
const zoneMorteStickTactile = 10; // px : en dessous, le stick ne change pas la visée
const seuilTirStick = 0.65; // stick poussé à plus de 65 % de sa course = tir continu
const cadenceTirStick = 300; // ms entre deux tirs au stick
const distanceViseeTactile = 110; // px entre la tourelle et le point visé au stick

const touchersDeplacement = new Map(); // identifiant du doigt -> {x, y, aTourne, debutX, debutY, tourne}
let toucherStick = null; // {id, baseX, baseY, debutX, debutY, x, y, aBouge, fixe} : le doigt qui tient le stick
let prochainTirStick = 0;
let boucleStickActive = false;

const stickBaseEl = document.getElementById('stickBase');
const stickBoutonEl = document.getElementById('stickBouton');

if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
  definirModeEntree('tactile');
}

// partie en cours : les touchers de l'écran pilotent le jeu (et la page ne défile plus)
function partieTactileEnCours() {
  return !waitingToStart && !gameOver && !isPaused && !menuBuffsOuvert;
}

// boutons, menus et liens gardent leur comportement normal
function cibleInteractive(el) {
  return !!(el && el.closest && el.closest('button, a, input, select, label, #buffMenu, #aideMenu, #succesMenu, #highscoreSidebar'));
}

// un simple toucher hors partie : démarrer, reprendre, rejouer
function toucherSimpleHorsPartie() {
  if (menuBuffsOuvert || aideOuverte || succesOuvert || optionsOuvertes) return;
  if (isPaused) togglePause();
  else if (waitingToStart || gameOver) actionPrincipale();
}

// menu ☰ ou éditeur ouverts : la page se comporte normalement
function ecranDeJeuMasque() {
  return editionDisposition || document.body.classList.contains('menu-tactile-ouvert');
}

document.addEventListener('touchstart', (e) => {
  if (ecranDeJeuMasque() || cibleInteractive(e.target)) return;
  // avant le premier passage en mode tactile, seul le canvas réagit
  if (!document.body.classList.contains('mode-tactile') && e.target !== canvas) return;
  e.preventDefault(); // pas de défilement, de zoom ni de clic souris simulé
  definirModeEntree('tactile');

  const enPartie = partieTactileEnCours();
  for (const t of e.changedTouches) {
    if (enPartie && !doigtPad && pointSurPad(t.clientX, t.clientY)) {
      doigtPad = {id: t.identifier, dir: null};
      appuyerPad(directionPadSousPoint(t.clientX, t.clientY));
      continue;
    }
    const zone = enPartie ? zoneSousPoint(t.clientX, t.clientY) : null;
    if (zone === 'visee' && !toucherStick) {
      // stick fixe : il reste à sa place et mesure depuis son centre ; sinon il naît sous le doigt
      const fixe = disposition.options.stickFixe;
      const base = fixe ? centreStickRepos() : {x: t.clientX, y: t.clientY};
      toucherStick = {id: t.identifier, baseX: base.x, baseY: base.y, debutX: t.clientX, debutY: t.clientY,
        x: t.clientX, y: t.clientY, aBouge: false, fixe};
      appliquerStick(performance.now());
      majStickAffichage();
      if (!boucleStickActive) {
        boucleStickActive = true;
        requestAnimationFrame(boucleStick);
      }
    } else {
      // hors zone pendant la partie : le doigt ne tourne pas, mais un simple toucher reste possible
      touchersDeplacement.set(t.identifier, {x: t.clientX, y: t.clientY, aTourne: false,
        debutX: t.clientX, debutY: t.clientY, tourne: !enPartie || zone === 'deplacement'});
    }
  }
}, {passive: false});

document.addEventListener('touchmove', (e) => {
  let gere = false;
  for (const t of e.changedTouches) {
    if (doigtPad && t.identifier === doigtPad.id) {
      gere = true;
      appuyerPad(directionPadSousPoint(t.clientX, t.clientY));
      continue;
    }
    if (toucherStick && t.identifier === toucherStick.id) {
      gere = true;
      toucherStick.x = t.clientX;
      toucherStick.y = t.clientY;
      if (Math.hypot(t.clientX - toucherStick.debutX, t.clientY - toucherStick.debutY) > zoneMorteStickTactile) {
        toucherStick.aBouge = true;
      }
      appliquerStick(performance.now());
      majStickAffichage();
      continue;
    }
    const d = touchersDeplacement.get(t.identifier);
    if (!d) continue;
    gere = true;
    const dx = t.clientX - d.x;
    const dy = t.clientY - d.y;
    if (d.tourne && Math.hypot(dx, dy) >= seuilGlissement) {
      // on tourne dès que le glissement est assez long, puis on repart de ce point
      // pour pouvoir enchaîner plusieurs virages sans lever le doigt
      if (Math.abs(dx) > Math.abs(dy)) changerDirection(Math.sign(dx), 0);
      else changerDirection(0, Math.sign(dy));
      d.x = t.clientX;
      d.y = t.clientY;
      d.aTourne = true;
    }
  }
  if (gere) e.preventDefault();
}, {passive: false});

function finToucher(e) {
  let gere = false;
  for (const t of e.changedTouches) {
    if (doigtPad && t.identifier === doigtPad.id) {
      gere = true;
      lacherPad();
      continue;
    }
    if (toucherStick && t.identifier === toucherStick.id) {
      gere = true;
      // (en stick fixe, un toucher loin du centre a déjà tiré : pas de second tir)
      const simpleToucher = !toucherStick.aBouge && !toucherStick.aTire && e.type !== 'touchcancel';
      toucherStick = null;
      majStickAffichage();
      if (simpleToucher) {
        if (partieTactileEnCours()) tenterTir(); // tir unique dans la direction visée
        else toucherSimpleHorsPartie();
      }
      continue;
    }
    const d = touchersDeplacement.get(t.identifier);
    if (!d) continue;
    gere = true;
    touchersDeplacement.delete(t.identifier);
    if (d.aTourne || e.type === 'touchcancel') continue;
    if (Math.hypot(t.clientX - d.debutX, t.clientY - d.debutY) >= seuilGlissement) continue;
    toucherSimpleHorsPartie();
  }
  if (gere) e.preventDefault();
}
document.addEventListener('touchend', finToucher, {passive: false});
document.addEventListener('touchcancel', finToucher, {passive: false});

// oriente la tourelle du joueur 1 selon le stick, et tire en continu s'il est poussé à fond
function appliquerStick(now) {
  if (!toucherStick || (!toucherStick.aBouge && !toucherStick.fixe)) return;
  const dx = toucherStick.x - toucherStick.baseX;
  const dy = toucherStick.y - toucherStick.baseY;
  const distance = Math.hypot(dx, dy);
  if (distance <= zoneMorteStickTactile) return;
  const angle = Math.atan2(dy, dx);
  const j1 = joueurs[0];
  avecJoueur(j1, () => {
    if (!turretPixelPos) return;
    mouseX = Math.max(0, Math.min(largeurPlateau, turretPixelPos.x + Math.cos(angle) * distanceViseeTactile));
    mouseY = Math.max(0, Math.min(hauteurPlateau, turretPixelPos.y + Math.sin(angle) * distanceViseeTactile));
    viseeManuelleJusqua = performance.now() + dureeViseeManuelle;
  });
  if (distance / rayonStick >= seuilTirStick && partieTactileEnCours() && now >= prochainTirStick) {
    prochainTirStick = now + cadenceTirStick;
    toucherStick.aTire = true;
    tenterTir(j1);
  }
}

// tant que le doigt tient le stick, la visée suit la tourelle et le tir continue même sans bouger le doigt
function boucleStick(now) {
  if (!toucherStick) {
    boucleStickActive = false;
    return;
  }
  appliquerStick(now);
  requestAnimationFrame(boucleStick);
}

// le stick est dessiné sous le doigt quand on le tient, sinon il attend à sa place (semi-transparent)
function majStickAffichage() {
  if (!stickBaseEl) return;
  const tactile = document.body.classList.contains('mode-tactile');
  const repos = tactile ? rectDisposition('stick') : null;
  if (toucherStick) {
    let dx = toucherStick.x - toucherStick.baseX;
    let dy = toucherStick.y - toucherStick.baseY;
    const d = Math.hypot(dx, dy);
    if (d > rayonStick) {
      dx = dx / d * rayonStick;
      dy = dy / d * rayonStick;
    }
    stickBaseEl.classList.add('tenu');
    stickBaseEl.classList.toggle('tir', d / rayonStick >= seuilTirStick);
    const taille = rayonStick * 2;
    stickBaseEl.style.width = stickBaseEl.style.height = taille + 'px';
    stickBaseEl.style.left = (toucherStick.baseX - rayonStick) + 'px';
    stickBaseEl.style.top = (toucherStick.baseY - rayonStick) + 'px';
    stickBoutonEl.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
  } else {
    stickBaseEl.classList.remove('tenu', 'tir');
    stickBaseEl.style.left = repos ? repos.x + 'px' : '';
    stickBaseEl.style.top = repos ? repos.y + 'px' : '';
    stickBaseEl.style.width = repos ? repos.w + 'px' : '';
    stickBaseEl.style.height = repos ? repos.h + 'px' : '';
    stickBoutonEl.style.transform = '';
  }
}

// stick au repos et aide de la zone gauche : visibles seulement pendant une partie
setInterval(() => {
  document.body.classList.toggle('en-partie', modeEntree === 'tactile' && partieTactileEnCours());
}, 250);

// --- Pad 4 directions : la flèche sous le doigt donne la direction ; on peut glisser d'une flèche à l'autre ---
const padEl = document.getElementById('padDirections');
const flechesPad = {
  haut: {dx: 0, dy: -1}, bas: {dx: 0, dy: 1}, gauche: {dx: -1, dy: 0}, droite: {dx: 1, dy: 0}
};
let doigtPad = null; // {id, dir} : le doigt posé sur le pad (géré par les touchers du document, par position)

function pointSurPad(x, y) {
  if (!disposition.options.padVisible) return false;
  const r = padEl.getBoundingClientRect();
  return r.width > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

function lacherPad() {
  doigtPad = null;
  padEl.querySelectorAll('.pad-fleche').forEach(f => f.classList.remove('appuye'));
}

// direction du pad sous un point : axe dominant par rapport au centre, rien au milieu
function directionPadSousPoint(x, y) {
  const r = padEl.getBoundingClientRect();
  const dx = x - (r.left + r.width / 2);
  const dy = y - (r.top + r.height / 2);
  if (Math.hypot(dx, dy) < r.width * 0.12) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'droite' : 'gauche';
  return dy > 0 ? 'bas' : 'haut';
}

function appuyerPad(dir) {
  if (!doigtPad || dir === doigtPad.dir) return;
  doigtPad.dir = dir;
  padEl.querySelectorAll('.pad-fleche').forEach(f => f.classList.toggle('appuye', f.dataset.dir === dir));
  if (dir && partieTactileEnCours()) changerDirection(flechesPad[dir].dx, flechesPad[dir].dy);
}

padEl.addEventListener('contextmenu', e => e.preventDefault());

const touchBoostBtn = document.getElementById('touchBoost');
touchBoostBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  definirModeEntree('tactile');
  touchBoostBtn.classList.add('appuye');
  actionPrincipale();
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
  touchBoostBtn.addEventListener(ev, () => {
    touchBoostBtn.classList.remove('appuye');
    arreterBoost();
  }));

const touchBouclierBtn = document.getElementById('touchBouclier');
touchBouclierBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  definirModeEntree('tactile');
  touchBouclierBtn.classList.add('appuye');
  activerBouclier();
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
  touchBouclierBtn.addEventListener(ev, () => touchBouclierBtn.classList.remove('appuye')));

// le menu contextuel (appui long) gênerait le jeu sur mobile
document.getElementById('touchControls').addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('contextmenu', e => e.preventDefault());
