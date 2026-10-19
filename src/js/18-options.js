// ============================================================
// --- Options : volume, plein écran, taille du plateau, touches ---
// ============================================================
// Ouvert par « ⚙️ Options » du menu ☰, le bouton ⚙️ à côté du plateau ou la touche O (modifiable).
// Il met la partie en pause comme l'aide. Les réglages sont gardés dans le navigateur (snakeOptions, js/01-base.js).
//
// Plateau sur grand écran : le jeu calcule toujours sur 400 x 400 (largeurPlateau), mais sur ordinateur le
// canvas prend toute la hauteur de l'écran (HUD à gauche) et son image a autant de pixels que l'écran en
// affiche (devicePixelRatio compris) : echelleRendu fois 400, appliqué par ctx.setTransform au début de chaque image.

let optionTaillePlateau = lireOption('taillePlateau', 'ecran'); // 'ecran' | 'classique'
let optionQualite = lireOption('qualite', 'haute'); // 'haute' | 'moyenne' | 'basse'
const echelleMaxQualite = {haute: 6, moyenne: 3, basse: 1};
const echelleMaxEnLigne = 2; // l'hôte envoie au plus 800 x 800 à son ami

// --- Taille du plateau ---
function enPleinEcran() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

// nombre de pixels réels du canvas, d'après sa taille à l'écran
function majResolutionPlateau() {
  const cote = canvas.clientWidth;
  if (!cote) return; // plateau caché (menu ☰ ouvert) : on garde la résolution actuelle
  let max = echelleMaxQualite[optionQualite] || echelleMaxQualite.haute;
  if (enLigne && enLigne.role === 'hote') max = Math.min(max, echelleMaxEnLigne);
  const echelle = Math.min(max, Math.max(1, cote * (window.devicePixelRatio || 1) / largeurPlateau));
  const largeur = Math.round(largeurPlateau * echelle);
  if (canvas.width !== largeur) {
    canvas.width = largeur; // vide aussi le canvas : la prochaine image redessine tout
    canvas.height = Math.round(hauteurPlateau * echelle);
  }
  echelleRendu = canvas.width / largeurPlateau;
  ctx.setTransform(echelleRendu, 0, 0, echelleRendu, 0, 0);
  majInfoAffichage();
}

// taille du plateau à l'écran (ordinateur) ; sur écran tactile, c'est la disposition qui la donne (js/18-disposition.js)
function ajusterTaillePlateau() {
  const corps = document.body;
  const adapte = optionTaillePlateau === 'ecran' && !corps.classList.contains('mode-tactile') && !enEcranInvite();
  corps.classList.toggle('plateau-adapte', adapte);
  // textes et boutons agrandis avec l'écran : 1,2 en 1080p, 1,6 en 1440p, 2,4 en 4K
  const zoom = adapte ? Math.max(1, Math.min(2.4, Math.min(innerHeight / 900, innerWidth / 1600))) : 1;
  corps.style.setProperty('--zoom-interface', zoom);
  if (!adapte) {
    corps.classList.remove('plateau-large');
    corps.style.removeProperty('--cote-plateau');
    majResolutionPlateau();
    return;
  }
  const marge = 16; // padding du body
  const bordure = 8; // bordure du canvas, des deux côtés
  const largeurDispo = innerWidth - marge * 2, hauteurDispo = innerHeight - marge * 2;
  const boutons = 56 * zoom; // ☰ ❓ ⚙️ à droite du plateau
  const colonneInfos = 250 * zoom, ecart = 24;
  // HUD à gauche, plateau sur toute la hauteur : dès que la fenêtre est assez large
  const coteLarge = Math.floor(Math.min(hauteurDispo, largeurDispo - colonneInfos - ecart - boutons));
  if (coteLarge >= 440) {
    corps.classList.add('plateau-large');
    corps.style.setProperty('--colonne-infos', colonneInfos + 'px');
    corps.style.setProperty('--cote-plateau', (coteLarge - bordure) + 'px');
  } else {
    // fenêtre étroite : HUD au-dessus, comme avant, mais le plateau prend la place qui reste
    corps.classList.remove('plateau-large');
    const conteneur = document.getElementById('plateauConteneur');
    const haut = conteneur.getBoundingClientRect().top - document.getElementById('gameColumn').getBoundingClientRect().top;
    const reserveBas = 70; // message et bouton Rejouer sous le plateau
    const cote = Math.floor(Math.max(Math.min(400, innerWidth - 48),
      Math.min(largeurDispo - (innerWidth > 600 ? boutons * 2 : 0), hauteurDispo - haut - reserveBas)));
    corps.style.setProperty('--cote-plateau', (cote - bordure) + 'px');
  }
  majResolutionPlateau();
}

let ajustementPrevu = false;
function prevoirAjustementPlateau() {
  if (ajustementPrevu) return;
  ajustementPrevu = true;
  requestAnimationFrame(() => {
    ajustementPrevu = false;
    ajusterTaillePlateau();
  });
}
window.addEventListener('resize', prevoirAjustementPlateau);
// passage en écran tactile, menu ☰ ouvert ou fermé, écran de l'invité en ligne...
new MutationObserver(prevoirAjustementPlateau).observe(document.body, {attributes: true, attributeFilter: ['class']});
// le canvas change de taille (disposition tactile, plein écran) : on refait sa résolution
if (window.ResizeObserver) new ResizeObserver(() => majResolutionPlateau()).observe(canvas);
// zoom du navigateur ou écran changé (devicePixelRatio) sans redimensionner la fenêtre
(function surveillerDensite() {
  const requete = matchMedia('(resolution: ' + (window.devicePixelRatio || 1) + 'dppx)');
  const changement = () => {
    requete.removeEventListener('change', changement);
    prevoirAjustementPlateau();
    surveillerDensite();
  };
  requete.addEventListener('change', changement);
})();

// --- Plein écran ---
function basculerPleinEcran() {
  const page = document.documentElement;
  try {
    if (enPleinEcran()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else if (page.requestFullscreen) {
      page.requestFullscreen({navigationUI: 'hide'}).catch(() => {});
    } else if (page.webkitRequestFullscreen) {
      page.webkitRequestFullscreen();
    }
  } catch (e) {
    // plein écran refusé (iPhone, cadre) : rien à faire
  }
}
document.addEventListener('fullscreenchange', () => majMenuOptions());
document.addEventListener('webkitfullscreenchange', () => majMenuOptions());

// --- Panneau ---
const actionsTouches = [
  {groupe: '🐍 Joueur 1 (et solo)'},
  {action: 'haut', nom: 'Haut'},
  {action: 'bas', nom: 'Bas'},
  {action: 'gauche', nom: 'Gauche'},
  {action: 'droite', nom: 'Droite'},
  {action: 'boost', nom: 'Démarrer, boost'},
  {action: 'bouclier', nom: 'Bouclier'},
  {groupe: '🐍 Joueur 2 (coop au clavier, marche aussi en solo)'},
  {action: 'hautJ2', nom: 'Haut'},
  {action: 'basJ2', nom: 'Bas'},
  {action: 'gaucheJ2', nom: 'Gauche'},
  {action: 'droiteJ2', nom: 'Droite'},
  {action: 'boostJ2', nom: 'Démarrer, boost'},
  {action: 'bouclierJ2', nom: 'Bouclier'},
  {action: 'tirJ2', nom: 'Tir (visée auto)'},
  {action: 'rollbackJ2', nom: 'Rollback'},
  {groupe: '📋 Menus'},
  {action: 'pause', nom: 'Pause'},
  {action: 'buffs', nom: 'Boutique'},
  {action: 'aide', nom: 'Aide'},
  {action: 'succes', nom: 'Succès'},
  {action: 'tuto', nom: 'Tutoriel'},
  {action: 'options', nom: 'Options'},
  {action: 'pleinEcran', nom: 'Plein écran'}
];
const nomsActions = {};
actionsTouches.forEach(a => { if (a.action) nomsActions[a.action] = a.nom + (a.action.endsWith('J2') ? ' (J2)' : ''); });
// touches gardées par le navigateur ou par le jeu
const touchesReservees = ['Escape', 'Tab', 'F5', 'F11', 'F12', 'MetaLeft', 'MetaRight', 'ContextMenu'];

const optionsMenuEl = document.createElement('div');
optionsMenuEl.id = 'optionsMenu';
optionsMenuEl.setAttribute('role', 'dialog');
optionsMenuEl.setAttribute('aria-modal', 'true');
optionsMenuEl.setAttribute('aria-labelledby', 'optionsTitre');
optionsMenuEl.innerHTML = `
  <div id="optionsPanel">
    <h2 id="optionsTitre">⚙️ Options</h2>
    <div id="optionsContenu">
      <h3>🔊 Son</h3>
      <div class="options-ligne">
        <label for="optionsVolume">Effets sonores</label>
        <input type="range" id="optionsVolume" min="0" max="100" step="5">
        <span id="optionsVolumeValeur" class="options-valeur"></span>
      </div>
      <div class="options-ligne">
        <span>Son</span>
        <button id="optionsMuet" class="options-bascule"></button>
      </div>
      <p class="options-note">Le jeu n'a pas de musique : ce volume règle tous les bruitages.</p>

      <h3>🖥️ Affichage</h3>
      <div class="options-ligne">
        <span>Plein écran</span>
        <button id="optionsPleinEcran" class="options-bascule"></button>
      </div>
      <div class="options-ligne">
        <span>Taille du plateau</span>
        <div class="options-choix" id="optionsTaille">
          <button data-valeur="ecran">Tout l'écran</button>
          <button data-valeur="classique">Classique</button>
        </div>
      </div>
      <div class="options-ligne">
        <span>Qualité d'image</span>
        <div class="options-choix" id="optionsQualite">
          <button data-valeur="haute">Haute</button>
          <button data-valeur="moyenne">Moyenne</button>
          <button data-valeur="basse">Basse</button>
        </div>
      </div>
      <p class="options-note" id="optionsInfoAffichage"></p>

      <h3>👥 Coop</h3>
      <div class="options-ligne">
        <span>Collision entre joueurs</span>
        <button id="optionsCollision" class="options-bascule"></button>
      </div>
      <p class="options-note">Activée, toucher le serpent de l'autre coûte un cœur.</p>

      <h3>⌨️ Touches</h3>
      <p class="options-note">Clique sur une touche puis appuie sur la nouvelle. Une touche déjà prise est échangée.
        Fixes : Échap (pause, fermer), clic gauche (tir), clic droit (rollback).</p>
      <div id="optionsTouches"></div>
      <div id="optionsTouchesMessage" class="options-note"></div>
    </div>
    <div id="optionsActions">
      <button id="optionsTouchesDefaut">↺ Touches par défaut</button>
      <button id="optionsFermer">Fermer</button>
    </div>
  </div>`;
document.body.appendChild(optionsMenuEl);

const optionsTouchesEl = document.getElementById('optionsTouches');
const optionsVolumeEl = document.getElementById('optionsVolume');
let optionsOuvertes = false;
let optionsOntMisEnPause = false;
let actionEnAttente = null; // touche en cours de changement

actionsTouches.forEach(a => {
  if (a.groupe) {
    const titre = document.createElement('h4');
    titre.textContent = a.groupe;
    optionsTouchesEl.appendChild(titre);
    return;
  }
  const ligne = document.createElement('div');
  ligne.className = 'options-ligne options-touche';
  const libelle = document.createElement('span');
  libelle.textContent = a.nom;
  const bouton = document.createElement('button');
  bouton.dataset.action = a.action;
  bouton.addEventListener('click', () => attendreTouche(a.action));
  ligne.append(libelle, bouton);
  optionsTouchesEl.appendChild(ligne);
});

function majInfoAffichage() {
  const info = document.getElementById('optionsInfoAffichage');
  if (!info) return;
  const cote = canvas.clientWidth;
  info.textContent = cote
    ? 'Plateau : ' + cote + ' px à l\'écran, image de ' + canvas.width + ' px.' +
      (optionQualite !== 'haute' ? ' Choisis Haute pour une image plus nette.' : ' Baisse la qualité si le jeu saccade.')
    : '';
}

function majMenuOptions() {
  if (!optionsMenuEl) return;
  optionsVolumeEl.value = volumeEffets;
  document.getElementById('optionsVolumeValeur').textContent = volumeEffets + ' %';
  const muet = document.getElementById('optionsMuet');
  muet.textContent = isMuted ? '🔇 Coupé' : '🔊 Activé';
  muet.classList.toggle('actif', !isMuted);
  const plein = document.getElementById('optionsPleinEcran');
  plein.textContent = (enPleinEcran() ? '✔ Oui' : 'Non') + '  (' + nomTouche(touches.pleinEcran) + ')';
  plein.classList.toggle('actif', enPleinEcran());
  const collision = document.getElementById('optionsCollision');
  collision.textContent = capacitesActives.collisionJoueurs ? '💥 Activée' : '👻 Non';
  collision.classList.toggle('actif', capacitesActives.collisionJoueurs);
  document.querySelectorAll('#optionsTaille button').forEach(b => b.classList.toggle('actif', b.dataset.valeur === optionTaillePlateau));
  document.querySelectorAll('#optionsQualite button').forEach(b => b.classList.toggle('actif', b.dataset.valeur === optionQualite));
  optionsTouchesEl.querySelectorAll('button').forEach(b => {
    const action = b.dataset.action;
    b.textContent = action === actionEnAttente ? 'Appuie sur une touche…' : nomTouche(touches[action]);
    b.classList.toggle('en-attente', action === actionEnAttente);
    b.classList.toggle('modifiee', touches[action] !== touchesParDefaut[action]);
  });
  majInfoAffichage();
}

function sauverTouches() {
  const differentes = {};
  for (const action in touches) {
    if (touches[action] !== touchesParDefaut[action]) differentes[action] = touches[action];
  }
  ecrireOption('touches', differentes);
}

function attendreTouche(action) {
  actionEnAttente = actionEnAttente === action ? null : action;
  document.getElementById('optionsTouchesMessage').textContent = actionEnAttente ? 'Échap : annuler.' : '';
  majMenuOptions();
}

function choisirTouche(code) {
  const action = actionEnAttente;
  actionEnAttente = null;
  const message = document.getElementById('optionsTouchesMessage');
  if (touchesReservees.includes(code)) {
    message.textContent = nomTouche(code) + ' est réservée, choisis-en une autre.';
    actionEnAttente = action;
    majMenuOptions();
    return;
  }
  const ancienne = touches[action];
  const autre = Object.keys(touches).find(a => a !== action && touches[a] === code);
  touches[action] = code;
  if (autre) {
    touches[autre] = ancienne;
    message.textContent = nomTouche(code) + ' servait à « ' + nomsActions[autre] + ' », qui prend ' + nomTouche(ancienne) + '.';
  } else {
    message.textContent = '';
  }
  sauverTouches();
  majMenuOptions();
}

function ouvrirOptions() {
  if (menuBuffsOuvert) fermerMenuBuffs();
  if (aideOuverte) fermerAide();
  if (succesOuvert) fermerSucces();
  fermerMenuTactile();
  if (!optionsOuvertes) {
    optionsOuvertes = true;
    optionsOntMisEnPause = false;
    if (!enEcranInvite()) {
      // pendant le compte à rebours, la pause n'existe pas encore : on revient à l'écran de départ
      if (countdownActive) {
        countdownActive = false;
        waitingToStart = true;
      }
      if (!isPaused && !waitingToStart && !gameOver) {
        togglePause();
        optionsOntMisEnPause = true;
      }
      joueurs.forEach(j => arreterBoost(j));
    }
  }
  actionEnAttente = null;
  document.getElementById('optionsTouchesMessage').textContent = '';
  optionsMenuEl.classList.add('ouvert');
  majMenuOptions();
}

function fermerOptions() {
  if (!optionsOuvertes) return;
  optionsOuvertes = false;
  actionEnAttente = null;
  optionsMenuEl.classList.remove('ouvert');
  if (document.activeElement) document.activeElement.blur(); // évite qu'Espace ne réappuie sur un bouton
  if (optionsOntMisEnPause && isPaused) togglePause();
  optionsOntMisEnPause = false;
}

optionsVolumeEl.addEventListener('input', () => {
  volumeEffets = Number(optionsVolumeEl.value);
  ecrireOption('volumeEffets', volumeEffets);
  majVolumeAudio();
  if (isMuted && volumeEffets > 0) toggleMute(); // monter le volume rallume le son
  else majMenuOptions();
});
// petit son à la fin du réglage, pour entendre le nouveau volume
optionsVolumeEl.addEventListener('change', () => playApplePickupSound());
document.getElementById('optionsMuet').addEventListener('click', toggleMute);
document.getElementById('optionsPleinEcran').addEventListener('click', basculerPleinEcran);
document.getElementById('optionsCollision').addEventListener('click', () => {
  capacitesActives.collisionJoueurs = !capacitesActives.collisionJoueurs;
  sauverCapacites();
  majMenuOptions();
});
document.querySelectorAll('#optionsTaille button').forEach(b => b.addEventListener('click', () => {
  optionTaillePlateau = b.dataset.valeur;
  ecrireOption('taillePlateau', optionTaillePlateau);
  ajusterTaillePlateau();
  majMenuOptions();
}));
document.querySelectorAll('#optionsQualite button').forEach(b => b.addEventListener('click', () => {
  optionQualite = b.dataset.valeur;
  ecrireOption('qualite', optionQualite);
  majResolutionPlateau();
  majMenuOptions();
}));
document.getElementById('optionsTouchesDefaut').addEventListener('click', () => {
  touches = {...touchesParDefaut};
  actionEnAttente = null;
  sauverTouches();
  document.getElementById('optionsTouchesMessage').textContent = 'Touches d\'origine remises.';
  majMenuOptions();
});
document.getElementById('optionsFermer').addEventListener('click', fermerOptions);
optionsMenuEl.addEventListener('click', (e) => {
  if (e.target === optionsMenuEl) fermerOptions(); // clic sur le fond sombre
});
document.getElementById('optionsMenuBtn').addEventListener('click', () => ouvrirOptions());
document.getElementById('optionsJeuBtn').addEventListener('click', (e) => {
  e.currentTarget.blur();
  ouvrirOptions();
});

// tant que le panneau est ouvert, il garde le clavier : Échap ou O le ferme, ou la touche attendue est choisie
window.addEventListener('keydown', (e) => {
  if (!optionsOuvertes) return;
  e.stopImmediatePropagation();
  // code de sauvegarde en cours de saisie (js/18-sauvegarde.js) : seule Échap ferme
  if (e.target instanceof HTMLTextAreaElement && e.key !== 'Escape') return;
  if (actionEnAttente) {
    e.preventDefault();
    if (e.code === 'Escape') {
      actionEnAttente = null;
      document.getElementById('optionsTouchesMessage').textContent = '';
      majMenuOptions();
    } else if (e.code) {
      choisirTouche(e.code);
    }
    return;
  }
  if (e.key === 'Escape' || e.code === touches.options) {
    e.preventDefault();
    fermerOptions();
  } else if (e.code === touches.pleinEcran && !(e.target instanceof HTMLInputElement)) {
    basculerPleinEcran();
  }
}, true);
// le relâchement d'une touche choisie ne doit pas arriver au jeu (boost relâché, etc.)
window.addEventListener('keyup', (e) => {
  if (optionsOuvertes) e.stopImmediatePropagation();
}, true);

// manette : B ou Start ferme le panneau
function manetteDansOptions(vientDAppuyer) {
  if (vientDAppuyer(MANETTE.B) || vientDAppuyer(MANETTE.START)) fermerOptions();
}

majBoutonMuet();
// premier réglage du plateau : à la fin du script (js/20-en-ligne.js), quand tout est chargé
