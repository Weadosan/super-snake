// ============================================================
// --- Disposition de l'écran tactile (réglable par le joueur) ---
// ============================================================
// Sur écran tactile, chaque élément (plateau, infos, zones, stick, boutons) est placé selon une
// disposition, une pour le portrait et une pour le paysage, sauvegardée dans localStorage.
// Positions en fractions de l'écran [x, y, largeur, hauteur] ; pour les éléments carrés
// (plateau, stick), [x, y, taille] avec la taille en fraction du plus petit côté de l'écran.
// Le bouton ☰ ouvre le menu (reste de la page) et « Placer les commandes » ouvre l'éditeur.
const cleDisposition = 'snakeDispositionTactile';

const elementsDisposition = {
  zoneDeplacement: {nom: '👆 Zone déplacement', id: 'zoneDeplacement', zone: true},
  zoneVisee: {nom: '🎯 Zone visée', id: 'zoneVisee', zone: true},
  pad: {nom: '✛ Pad', id: 'padDirections', carre: true},
  plateau: {nom: '🐍 Plateau', id: 'game', carre: true},
  hud: {nom: '📊 Infos', id: 'hud'},
  stick: {nom: '🕹️ Stick', id: 'stickBase', carre: true},
  boost: {nom: '🚀 Boost', id: 'touchBoost'},
  bouclier: {nom: '🛡️ Bouclier', id: 'touchBouclier'},
  menu: {nom: '☰ Menu', id: 'touchMenu'}
};

const dispositionParDefaut = {
  portrait: {
    hud: [0.02, 0.005, 0.8, 0.09],
    menu: [0.84, 0.01, 0.14, 0.06],
    plateau: [0.03, 0.1, 0.94],
    zoneDeplacement: [0, 0.56, 0.5, 0.44],
    zoneVisee: [0.5, 0.56, 0.5, 0.44],
    stick: [0.6, 0.66, 0.3],
    pad: [0.07, 0.63, 0.36],
    boost: [0.04, 0.9, 0.3, 0.07],
    bouclier: [0.66, 0.9, 0.3, 0.07]
  },
  paysage: {
    hud: [0.01, 0.02, 0.26, 0.3],
    menu: [0.88, 0.03, 0.1, 0.13],
    plateau: [0.28, 0.02, 0.95],
    zoneDeplacement: [0, 0.34, 0.27, 0.66],
    zoneVisee: [0.73, 0.2, 0.27, 0.8],
    stick: [0.79, 0.45, 0.3],
    pad: [0.03, 0.4, 0.33],
    boost: [0.015, 0.84, 0.12, 0.13],
    bouclier: [0.74, 0.03, 0.12, 0.13]
  },
  options: {zonesVisibles: true, stickFixe: false, padVisible: true},
  // éléments verrouillés dans l'éditeur (cadenas de chaque cadre), séparément en portrait et en paysage
  verrous: {portrait: {}, paysage: {}}
};

let rayonStick = 55; // px : course maximale du stick virtuel (moitié de sa taille à l'écran)
let editionDisposition = false;
let disposition = chargerDisposition();

function copieProfonde(o) {
  return JSON.parse(JSON.stringify(o));
}

// complète une disposition (sauvegardée ou collée) avec les valeurs par défaut, en ignorant ce qui est invalide
function completerDisposition(d) {
  const res = copieProfonde(dispositionParDefaut);
  if (!d || typeof d !== 'object') return res;
  for (const orient of ['portrait', 'paysage']) {
    if (!d[orient] || typeof d[orient] !== 'object') continue;
    for (const cle in elementsDisposition) {
      const v = d[orient][cle];
      const longueur = elementsDisposition[cle].carre ? 3 : 4;
      if (Array.isArray(v) && v.length >= longueur && v.slice(0, longueur).every(n => typeof n === 'number' && isFinite(n))) {
        res[orient][cle] = v.slice(0, longueur);
      }
    }
  }
  if (d.verrous && typeof d.verrous === 'object') {
    for (const orient of ['portrait', 'paysage']) {
      const v = d.verrous[orient];
      if (!v || typeof v !== 'object') continue;
      for (const cle in elementsDisposition) {
        if (v[cle] === true) res.verrous[orient][cle] = true;
      }
    }
  }
  if (d.options && typeof d.options === 'object') {
    for (const opt in res.options) {
      if (typeof d.options[opt] === 'boolean') res.options[opt] = d.options[opt];
    }
  }
  return res;
}

function chargerDisposition() {
  try {
    return completerDisposition(JSON.parse(localStorage.getItem(cleDisposition)));
  } catch (e) {
    return copieProfonde(dispositionParDefaut);
  }
}

function sauvegarderDisposition() {
  try {
    localStorage.setItem(cleDisposition, JSON.stringify(disposition));
  } catch (e) { /* stockage indisponible : la disposition dure le temps de la page */ }
}

function orientationEcran() {
  return window.innerWidth > window.innerHeight ? 'paysage' : 'portrait';
}

function arrondi(n) {
  return Math.round(n * 1000) / 1000;
}

// rectangle en pixels d'un élément, gardé entièrement à l'écran
function rectDisposition(cle) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const v = disposition[orientationEcran()][cle];
  let w, h;
  if (elementsDisposition[cle].carre) {
    w = h = Math.min(v[2] * Math.min(vw, vh), vw, vh);
  } else {
    w = Math.min(v[2] * vw, vw);
    h = Math.min(v[3] * vh, vh);
  }
  const x = Math.max(0, Math.min(vw - w, v[0] * vw));
  const y = Math.max(0, Math.min(vh - h, v[1] * vh));
  return {x, y, w, h};
}

// enregistre un rectangle en pixels pour l'orientation actuelle
function definirRectDisposition(cle, r) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  disposition[orientationEcran()][cle] = elementsDisposition[cle].carre
    ? [arrondi(r.x / vw), arrondi(r.y / vh), arrondi(r.w / Math.min(vw, vh))]
    : [arrondi(r.x / vw), arrondi(r.y / vh), arrondi(r.w / vw), arrondi(r.h / vh)];
}

function pointDansRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// zone tactile sous un point de l'écran : 'visee', 'deplacement' ou null
function zoneSousPoint(x, y) {
  if (pointDansRect(x, y, rectDisposition('zoneVisee'))) return 'visee';
  if (pointDansRect(x, y, rectDisposition('zoneDeplacement'))) return 'deplacement';
  return null;
}

function centreStickRepos() {
  const r = rectDisposition('stick');
  return {x: r.x + r.w / 2, y: r.y + r.h / 2};
}

// place tous les éléments ; hors mode tactile, la page reprend sa mise en page normale
function appliquerDisposition() {
  const tactile = document.body.classList.contains('mode-tactile');
  document.body.classList.toggle('zones-visibles', disposition.options.zonesVisibles);
  document.body.classList.toggle('pad-visible', disposition.options.padVisible);
  for (const cle in elementsDisposition) {
    const el = document.getElementById(elementsDisposition[cle].id);
    if (!el) continue;
    if (!tactile) {
      el.style.left = el.style.top = el.style.width = el.style.height = el.style.fontSize = '';
      continue;
    }
    const r = rectDisposition(cle);
    el.style.left = r.x + 'px';
    el.style.top = r.y + 'px';
    el.style.width = r.w + 'px';
    el.style.height = r.h + 'px';
    if (cle === 'hud') {
      el.style.fontSize = Math.max(8, Math.min(20, r.h / 5, r.w / 22)) + 'px';
    } else if (cle === 'pad') {
      el.style.fontSize = Math.max(10, r.w / 6) + 'px';
    } else if (cle === 'boost' || cle === 'bouclier' || cle === 'menu') {
      el.style.fontSize = Math.max(10, Math.min(cle === 'menu' ? 28 : 22, r.h * 0.42, r.w / (cle === 'menu' ? 1.8 : 6))) + 'px';
    }
  }
  if (tactile) rayonStick = Math.max(20, rectDisposition('stick').w / 2);
  if (typeof majStickAffichage === 'function') majStickAffichage();
  if (editionDisposition) majCadres();
}

window.addEventListener('resize', appliquerDisposition);

// --- Menu ☰ ---
function ouvrirMenuTactile() {
  if (!waitingToStart && !gameOver && !isPaused && !countdownActive) togglePause();
  // pendant le compte à rebours, la pause n'existe pas encore : on revient à l'écran de départ
  // (le serpent n'a pas bougé), sinon la partie démarrerait derrière le menu
  if (countdownActive) {
    countdownActive = false;
    waitingToStart = true;
  }
  document.body.classList.add('menu-tactile-ouvert');
  demarrerApercu();
  document.getElementById('layout').scrollTop = 0;
}

function fermerMenuTactile() {
  document.body.classList.remove('menu-tactile-ouvert');
}

document.getElementById('touchMenu').addEventListener('click', (e) => {
  e.preventDefault();
  ouvrirMenuTactile();
});
document.getElementById('menuTactileFermer').addEventListener('click', fermerMenuTactile);
// sur ordinateur : bouton ☰ du plateau, même menu ; Échap le referme, et le jeu ne reçoit pas les touches tant qu'il est ouvert
document.getElementById('optionsBtn').addEventListener('click', ouvrirMenuTactile);
window.addEventListener('keydown', (e) => {
  if (!document.body.classList.contains('menu-tactile-ouvert') || menuBuffsOuvert) return;
  e.stopImmediatePropagation();
  if (e.key === 'Escape') {
    e.preventDefault();
    fermerMenuTactile();
  }
}, true);
// page épurée sur ordinateur, comme sur téléphone : thèmes, skins, buffs, Solo/Coop et scores sont dans le menu ☰
document.body.classList.add('ecran-epure');
document.getElementById('menuTactileDisposition').addEventListener('click', ouvrirEditeurDisposition);

// --- Éditeur : on fait glisser chaque cadre, la poignée ⤡ change la taille ---
const editeurEl = document.getElementById('editeurDisposition');
const editeurBarreEl = document.getElementById('editeurBarre');
const editeurTexteEl = document.getElementById('editeurTexte');
const editeurTexteZoneEl = document.getElementById('editeurTexteZone');
const editeurTexteErreurEl = document.getElementById('editeurTexteErreur');
const cadresDisposition = {}; // cle -> div du cadre
let niveauCadre = 10; // z-index du dernier cadre touché (il passe devant les autres)

function ouvrirEditeurDisposition() {
  fermerMenuTactile();
  if (!waitingToStart && !gameOver && !isPaused && !countdownActive) togglePause();
  definirModeEntree('tactile');
  editionDisposition = true;
  document.body.classList.add('edition-disposition');
  construireCadres();
  appliquerDisposition();
}

function fermerEditeurDisposition() {
  editionDisposition = false;
  document.body.classList.remove('edition-disposition');
  editeurTexteEl.classList.remove('ouvert');
  for (const cle in cadresDisposition) {
    cadresDisposition[cle].remove();
    delete cadresDisposition[cle];
  }
  sauvegarderDisposition();
  appliquerDisposition();
}

function construireCadres() {
  niveauCadre = 10;
  for (const cle in elementsDisposition) {
    if (cadresDisposition[cle]) continue;
    const info = elementsDisposition[cle];
    const cadre = document.createElement('div');
    cadre.className = 'cadre-disposition' + (info.zone ? ' zone' : '');
    cadre.style.zIndex = info.zone ? 1 : 5; // les zones, souvent grandes, restent derrière
    cadre.innerHTML = '<span class="cadre-etiquette"></span><div class="cadre-verrou"></div><div class="cadre-poignee"></div>';
    cadre.querySelector('.cadre-etiquette').textContent = info.nom;
    brancherCadre(cadre, cle);
    editeurEl.insertBefore(cadre, editeurBarreEl);
    cadresDisposition[cle] = cadre;
  }
  majCadres();
}

function majCadres() {
  document.getElementById('editeurTitre').textContent =
    orientationEcran() === 'paysage' ? '📐 Paysage' : '📐 Portrait';
  document.getElementById('editeurZonesVisibles').checked = disposition.options.zonesVisibles;
  document.getElementById('editeurStickFixe').checked = disposition.options.stickFixe;
  document.getElementById('editeurPadVisible').checked = disposition.options.padVisible;
  for (const cle in cadresDisposition) {
    const r = rectDisposition(cle);
    const c = cadresDisposition[cle];
    const verrouille = elementVerrouille(cle);
    c.classList.toggle('verrouille', verrouille);
    c.querySelector('.cadre-verrou').textContent = verrouille ? '🔒' : '🔓';
    c.style.left = r.x + 'px';
    c.style.top = r.y + 'px';
    c.style.width = r.w + 'px';
    c.style.height = r.h + 'px';
  }
}

function elementVerrouille(cle) {
  return !!disposition.verrous[orientationEcran()][cle];
}

function brancherCadre(cadre, cle) {
  let prise = null; // {id, mode, x, y, rect, aBouge}
  const tailleMin = elementsDisposition[cle].zone ? 60 : 28;

  cadre.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (prise) return;
    if (e.target.classList.contains('cadre-verrou')) {
      // cadenas : verrouille ou libère cet élément (pour l'orientation affichée)
      const verrous = disposition.verrous[orientationEcran()];
      if (verrous[cle]) delete verrous[cle];
      else verrous[cle] = true;
      sauvegarderDisposition();
      majCadres();
      return;
    }
    // élément verrouillé : on ne peut ni le déplacer ni le redimensionner (un toucher le passe quand même derrière)
    const mode = elementVerrouille(cle) ? 'aucun'
      : e.target.classList.contains('cadre-poignee') ? 'taille' : 'deplacer';
    prise = {id: e.pointerId, mode, x: e.clientX, y: e.clientY, rect: rectDisposition(cle), aBouge: false};
    try { cadre.setPointerCapture(e.pointerId); } catch (err) { /* capture indisponible */ }
    for (const k in cadresDisposition) cadresDisposition[k].classList.toggle('selectionne', k === cle);
  });

  cadre.addEventListener('pointermove', (e) => {
    if (!prise || e.pointerId !== prise.id) return;
    e.preventDefault();
    const dx = e.clientX - prise.x;
    const dy = e.clientY - prise.y;
    if (!prise.aBouge && Math.hypot(dx, dy) < 6) return;
    if (!prise.aBouge) {
      prise.aBouge = true;
      cadre.style.zIndex = ++niveauCadre;
    }
    if (prise.mode === 'aucun') return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r0 = prise.rect;
    let r;
    if (prise.mode === 'deplacer') {
      r = {x: r0.x + dx, y: r0.y + dy, w: r0.w, h: r0.h};
    } else if (elementsDisposition[cle].carre) {
      const t = Math.max(tailleMin, Math.min(r0.w + (dx + dy) / 2, vw - r0.x, vh - r0.y, Math.min(vw, vh)));
      r = {x: r0.x, y: r0.y, w: t, h: t};
    } else {
      r = {x: r0.x, y: r0.y,
        w: Math.max(tailleMin, Math.min(r0.w + dx, vw - r0.x)),
        h: Math.max(tailleMin * 0.6, Math.min(r0.h + dy, vh - r0.y))};
    }
    r.x = Math.max(0, Math.min(vw - r.w, r.x));
    r.y = Math.max(0, Math.min(vh - r.h, r.y));
    definirRectDisposition(cle, r);
    appliquerDisposition();
  });

  const lacher = (e) => {
    if (!prise || e.pointerId !== prise.id) return;
    // un toucher sans glisser fait passer le cadre derrière les autres (pour atteindre celui du dessous)
    if (!prise.aBouge && e.type === 'pointerup') cadre.style.zIndex = elementsDisposition[cle].zone ? 0 : 2;
    prise = null;
    sauvegarderDisposition();
  };
  cadre.addEventListener('pointerup', lacher);
  cadre.addEventListener('pointercancel', lacher);
}

document.getElementById('editeurTermine').addEventListener('click', fermerEditeurDisposition);
document.getElementById('editeurReinitialiser').addEventListener('click', () => {
  // remet seulement l'orientation affichée (l'autre garde ses réglages), sans toucher aux éléments verrouillés
  const orient = orientationEcran();
  for (const cle in elementsDisposition) {
    if (!elementVerrouille(cle)) disposition[orient][cle] = dispositionParDefaut[orient][cle].slice();
  }
  sauvegarderDisposition();
  appliquerDisposition();
});
document.getElementById('editeurZonesVisibles').addEventListener('change', (e) => {
  disposition.options.zonesVisibles = e.target.checked;
  sauvegarderDisposition();
  appliquerDisposition();
});
document.getElementById('editeurStickFixe').addEventListener('change', (e) => {
  disposition.options.stickFixe = e.target.checked;
  sauvegarderDisposition();
});
document.getElementById('editeurPadVisible').addEventListener('change', (e) => {
  disposition.options.padVisible = e.target.checked;
  sauvegarderDisposition();
  appliquerDisposition();
});
document.getElementById('editeurDeplacerBarre').addEventListener('click', () => {
  editeurBarreEl.classList.toggle('en-bas');
});
document.getElementById('editeurReplier').addEventListener('click', (e) => {
  const repliee = editeurBarreEl.classList.toggle('repliee');
  e.target.textContent = repliee ? '+' : '–';
});

// texte de la disposition : pour la garder, la partager, ou la faire mettre par défaut dans le jeu
document.getElementById('editeurTexteBtn').addEventListener('click', () => {
  editeurTexteZoneEl.value = JSON.stringify(disposition);
  editeurTexteErreurEl.textContent = '';
  editeurTexteEl.classList.add('ouvert');
});
document.getElementById('editeurTexteCopier').addEventListener('click', () => {
  editeurTexteZoneEl.focus();
  editeurTexteZoneEl.select();
  const confirmer = () => { editeurTexteErreurEl.textContent = '✔ Copié'; };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(editeurTexteZoneEl.value).then(confirmer, () => {
        if (document.execCommand('copy')) confirmer();
      });
    } else if (document.execCommand('copy')) {
      confirmer();
    }
  } catch (err) {
    editeurTexteErreurEl.textContent = 'Copie impossible : sélectionne le texte à la main.';
  }
});
document.getElementById('editeurTexteAppliquer').addEventListener('click', () => {
  let d;
  try {
    d = JSON.parse(editeurTexteZoneEl.value);
  } catch (err) {
    editeurTexteErreurEl.textContent = 'Ce texte n\'est pas une disposition valide.';
    return;
  }
  if (!d || typeof d !== 'object' || (!d.portrait && !d.paysage)) {
    editeurTexteErreurEl.textContent = 'Ce texte n\'est pas une disposition valide.';
    return;
  }
  disposition = completerDisposition(d);
  sauvegarderDisposition();
  appliquerDisposition();
  editeurTexteEl.classList.remove('ouvert');
});
document.getElementById('editeurTexteFermer').addEventListener('click', () => {
  editeurTexteEl.classList.remove('ouvert');
});
