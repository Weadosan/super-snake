// ============================================================
// --- Jeu à deux en ligne (code de salle) ---
// ============================================================
// L'hôte fait tourner la partie en coop sur son appareil et envoie en direct l'image du plateau
// à son ami (WebRTC, via la bibliothèque Trystero chargée seulement quand on s'en sert).
// L'invité ne fait tourner aucune partie : il regarde la vidéo et envoie ses commandes,
// que l'hôte applique au joueur 2. Les deux écrans ne peuvent donc jamais être décalés.

const sourceTrysteroCDN = 'https://cdn.jsdelivr.net/npm/trystero@0.25.4/+esm';
const idApplicationEnLigne = 'super-snake-weadosan-v1'; // les joueurs d'un même code se retrouvent dans ce jeu seulement
const lettresCode = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sans I ni O, qu'on confond avec 1 et 0
const imagesParSecondeEnLigne = 24;
// relais TURN (metered.ca) : fait passer la connexion quand les deux appareils ne peuvent pas se relier directement
// (réseaux différents, 4G). Vide = pas de relais, connexion directe seulement.
const relaisTurn = {app: '', cle: ''};

let enLigne = null; // null, ou {role: 'hote' | 'invite', salon, envoyer, code, ...}

const enLigneBtn = document.getElementById('enLigneBtn');
const enLignePanneau = document.createElement('div');
enLignePanneau.id = 'enLigneMenu';
enLignePanneau.setAttribute('role', 'dialog');
enLignePanneau.innerHTML = `
  <div id="enLignePanel">
    <h2>🌐 Jouer à deux en ligne</h2>
    <div id="enLigneAccueil">
      <p class="en-ligne-aide">Crée une partie et donne le code à ton ami, ou tape le code qu'il t'a donné.</p>
      <button id="enLigneCreer" class="en-ligne-principal">🎮 Créer une partie</button>
      <div class="en-ligne-rejoindre">
        <input id="enLigneCodeSaisi" maxlength="4" placeholder="CODE" autocomplete="off" autocapitalize="characters" spellcheck="false">
        <button id="enLigneRejoindre">Rejoindre</button>
      </div>
    </div>
    <div id="enLigneEtat"></div>
    <div id="enLigneActions">
      <button id="enLigneQuitter">Arrêter</button>
      <button id="enLigneFermer" class="en-ligne-principal">Fermer</button>
    </div>
  </div>`;
document.body.appendChild(enLignePanneau);

// écran de l'invité : la vidéo du plateau, les infos de la partie et les boutons
const ecranInvite = document.createElement('div');
ecranInvite.id = 'ecranInvite';
ecranInvite.innerHTML = `
  <div id="inviteHud"></div>
  <div id="inviteVideoCadre">
    <video id="inviteVideo" autoplay playsinline muted></video>
    <div id="inviteMessage">Connexion…</div>
  </div>
  <div id="inviteBoutons">
    <button id="inviteBoost">🚀 Boost / Jouer</button>
    <button id="inviteBouclier">🛡️ Bouclier</button>
    <button id="inviteTir">🎯 Tir</button>
    <button id="invitePause">⏸️</button>
    <button id="inviteQuitter">✖</button>
  </div>
  <div id="inviteAide">Glisse sur le plateau pour tourner, touche-le pour tirer à cet endroit.
    Clavier : flèches ou ZQSD, Espace, Maj, Entrée. La manette marche aussi.</div>`;
document.body.appendChild(ecranInvite);
const inviteVideo = document.getElementById('inviteVideo');
const inviteMessage = document.getElementById('inviteMessage');

function etatEnLigne(texte, code) {
  const zone = document.getElementById('enLigneEtat');
  zone.textContent = '';
  if (code) {
    const grand = document.createElement('div');
    grand.className = 'en-ligne-code';
    grand.textContent = code;
    zone.appendChild(grand);
  }
  const p = document.createElement('p');
  p.textContent = texte;
  zone.appendChild(p);
}

function majPanneauEnLigne() {
  document.getElementById('enLigneAccueil').style.display = enLigne ? 'none' : '';
  document.getElementById('enLigneQuitter').style.display = enLigne ? '' : 'none';
  if (!enLigne) etatEnLigne('');
  enLigneBtn.classList.toggle('active', !!(enLigne && enLigne.role === 'hote'));
  enLigneBtn.textContent = enLigne && enLigne.role === 'hote' ? '🌐 En ligne : ' + enLigne.code : '🌐 En ligne';
}

function ouvrirMenuEnLigne() {
  if (typeof fermerMenuTactile === 'function') fermerMenuTactile();
  majPanneauEnLigne();
  enLignePanneau.classList.add('ouvert');
}

function fermerMenuEnLigne() {
  enLignePanneau.classList.remove('ouvert');
  if (document.activeElement) document.activeElement.blur(); // évite qu'Espace ne réappuie sur un bouton
}

enLigneBtn.addEventListener('click', ouvrirMenuEnLigne);
document.getElementById('enLigneFermer').addEventListener('click', fermerMenuEnLigne);
document.getElementById('enLigneQuitter').addEventListener('click', () => quitterEnLigne());
document.getElementById('enLigneCreer').addEventListener('click', creerPartieEnLigne);
document.getElementById('enLigneRejoindre').addEventListener('click', () => {
  rejoindrePartieEnLigne(document.getElementById('enLigneCodeSaisi').value);
});
document.getElementById('enLigneCodeSaisi').addEventListener('input', (e) => {
  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
});

// tant que le panneau est ouvert, le clavier sert à taper le code, pas à jouer
window.addEventListener('keydown', (e) => {
  if (!enLignePanneau.classList.contains('ouvert')) return;
  e.stopImmediatePropagation();
  if (e.key === 'Escape') fermerMenuEnLigne();
  else if (e.key === 'Enter' && document.activeElement && document.activeElement.id === 'enLigneCodeSaisi') {
    rejoindrePartieEnLigne(document.activeElement.value);
  }
}, true);

// --- Connexion ---
// Mise en relation par Trystero : les deux appareils se retrouvent dans un « salon » nommé par le code,
// en passant par plusieurs relais publics gratuits (Nostr) à la fois. Si l'un est en panne, les autres suffisent.

let chargementTrystero = null;
function chargerTrystero() {
  if (window.Trystero) return Promise.resolve();
  if (!chargementTrystero) {
    chargementTrystero = new Promise((ok, echec) => {
      const s = document.createElement('script');
      s.src = 'trystero.min.js'; // posé à côté du jeu en ligne (outils/publier.js)
      s.onload = () => window.Trystero ? ok() : echec(new Error('Trystero absent'));
      s.onerror = () => {
        s.remove();
        // fichier ouvert directement : on le prend sur un CDN
        import(sourceTrysteroCDN).then(m => { window.Trystero = m; ok(); }, echec);
      };
      document.head.appendChild(s);
    }).catch((e) => { chargementTrystero = null; throw e; });
  }
  return chargementTrystero;
}

let serveursIceRelais = null;
async function chargerRelais() {
  if (serveursIceRelais || !relaisTurn.app || !relaisTurn.cle) return;
  try {
    const rep = await fetch('https://' + relaisTurn.app + '.metered.live/api/v1/turn/credentials?apiKey=' + encodeURIComponent(relaisTurn.cle));
    const liste = await rep.json();
    if (Array.isArray(liste) && liste.length) serveursIceRelais = liste.filter(s => String(s.urls).includes('turn'));
  } catch (e) {
    // relais injoignable : on tente quand même sans
  }
}

// réglages de Trystero (les tests mettent un relais local dans window.optionsTrysteroEnLigne)
function configTrystero() {
  const config = {appId: idApplicationEnLigne};
  if (serveursIceRelais && serveursIceRelais.length) config.turnConfig = serveursIceRelais;
  return Object.assign(config, window.optionsTrysteroEnLigne || {});
}

function nouveauCode() {
  let code = '';
  for (let i = 0; i < 4; i++) code += lettresCode[Math.floor(Math.random() * lettresCode.length)];
  return code;
}

// canal des messages du jeu (commandes, infos) entre les deux appareils
function canalJeu(salon) {
  const action = salon.makeAction('jeu');
  return {
    envoyer: (message, id) => { action.send(message, {target: id}).catch(() => {}); },
    recevoir: (fn) => { action.onMessage = (message, infos) => fn(message, infos && infos.peerId); }
  };
}

async function preparerConnexion() {
  try {
    await Promise.all([chargerTrystero(), chargerRelais()]);
    return true;
  } catch (e) {
    etatEnLigne('Impossible de charger le jeu en ligne. Vérifie ta connexion internet.');
    document.getElementById('enLigneAccueil').style.display = '';
    return false;
  }
}

async function creerPartieEnLigne() {
  if (enLigne) return;
  etatEnLigne('Préparation…');
  document.getElementById('enLigneAccueil').style.display = 'none';
  if (!await preparerConnexion() || enLigne) return;
  const code = nouveauCode();
  const salon = window.Trystero.joinRoom(configTrystero(), code);
  const {envoyer, recevoir} = canalJeu(salon);
  enLigne = {role: 'hote', salon, envoyer, code, invite: null, flux: null, dernierHud: ''};
  if (!enCoop()) changerModeJeu('coop'); // l'ami joue le serpent J2
  majPanneauEnLigne();
  etatEnLigne('Donne ce code à ton ami. Il ouvre le jeu, clique sur « 🌐 En ligne » puis « Rejoindre ». Garde le jeu ouvert pendant qu\'il se connecte.', code);
  gamepadStatusEl.textContent = '🌐 En attente de ton ami (code ' + code + ')';

  salon.onPeerJoin = (id) => {
    if (!enLigne || enLigne.salon !== salon) return;
    if (enLigne.invite && enLigne.invite !== id) { // une seule place : J2
      envoyer({t: 'plein'}, id);
      return;
    }
    enLigne.invite = id;
    if (!enCoop()) changerModeJeu('coop');
    if (!enLigne.flux) {
      majResolutionPlateau(); // image envoyée limitée en taille (js/18-options.js), fixée avant la capture
      enLigne.flux = canvas.captureStream(imagesParSecondeEnLigne);
    }
    envoyer({t: 'hote'}, id);
    salon.addStream(enLigne.flux, {target: id});
    enLigne.dernierHud = '';
    etatEnLigne('✅ Ton ami est connecté : il joue le serpent J2. Lance la partie !', code);
    debloquerSucces('connecte');
    gamepadStatusEl.textContent = '🌐 Ami connecté (J2)';
  };
  salon.onPeerLeave = (id) => {
    if (!enLigne || enLigne.salon !== salon || enLigne.invite !== id) return;
    enLigne.invite = null;
    if (joueurs[1]) arreterBoost(joueurs[1]);
    etatEnLigne('Ton ami s\'est déconnecté. Il peut revenir avec le même code.', code);
    gamepadStatusEl.textContent = '🌐 En attente de ton ami (code ' + code + ')';
  };
  recevoir((m, id) => {
    if (enLigne && enLigne.salon === salon && id === enLigne.invite) appliquerCommandeInvite(m);
  });
}

// commandes reçues de l'invité, appliquées au joueur 2
function appliquerCommandeInvite(m) {
  const j = joueurs[1];
  if (!m || typeof m !== 'object' || !j || !enCoop()) return;
  switch (m.t) {
    case 'dir': {
      const dx = Math.sign(+m.dx || 0), dy = Math.sign(+m.dy || 0);
      if (Math.abs(dx) + Math.abs(dy) === 1) changerDirection(dx, dy, j);
      break;
    }
    case 'action': actionPrincipale(j); break;
    case 'relache': arreterBoost(j); break;
    case 'bouclier': activerBouclier(j); break;
    case 'tir': j.viseeAuto = true; tenterTir(j); break;
    case 'vise': {
      const x = +m.x, y = +m.y;
      if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) break;
      j.viseeAuto = false;
      j.viseeManuelleJusqua = performance.now() + dureeViseeManuelle;
      j.mouseX = x * largeurPlateau;
      j.mouseY = y * hauteurPlateau;
      tenterTir(j);
      break;
    }
    case 'pause': if (!gameOver && !waitingToStart) togglePause(); break;
  }
}

// l'hôte envoie à l'invité le texte des infos (score, cœurs...) quand il change
function envoyerHudEnLigne() {
  if (!enLigne || enLigne.role !== 'hote' || !enLigne.invite) return;
  const textes = Array.from(document.querySelectorAll('#hud > div'))
    .filter(el => el.textContent.trim() && getComputedStyle(el).display !== 'none')
    .map(el => el.textContent.trim());
  const cle = textes.join('\n');
  if (cle === enLigne.dernierHud) return;
  enLigne.dernierHud = cle;
  enLigne.envoyer({t: 'hud', textes}, enLigne.invite);
}
setInterval(envoyerHudEnLigne, 300);

async function rejoindrePartieEnLigne(saisie) {
  const code = String(saisie || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (code.length !== 4) {
    etatEnLigne('Le code fait 4 lettres.');
    return;
  }
  if (enLigne) return;
  etatEnLigne('Connexion…');
  if (!await preparerConnexion() || enLigne) return;
  const salon = window.Trystero.joinRoom(configTrystero(), code, {
    onJoinError: () => {
      if (!enLigne || enLigne.salon !== salon || enLigne.hote) return;
      enLigne.erreurLiaison = true;
    }
  });
  const {envoyer, recevoir} = canalJeu(salon);
  enLigne = {role: 'invite', salon, envoyer, code, hote: null, connecte: false, erreurLiaison: false};
  majPanneauEnLigne();
  etatEnLigne('Recherche de la partie ' + code + '…');

  recevoir((m, id) => {
    if (!enLigne || enLigne.salon !== salon || !m || typeof m !== 'object') return;
    if (m.t === 'hote' && !enLigne.hote) {
      enLigne.hote = id;
      enLigne.connecte = true;
      entrerEcranInvite();
      debloquerSucces('connecte');
    } else if (m.t === 'plein' && !enLigne.hote) {
      quitterEnLigne(true);
      etatEnLigne('Cette partie a déjà deux joueurs.');
    } else if (m.t === 'hud' && id === enLigne.hote && Array.isArray(m.textes)) {
      afficherHudInvite(m.textes);
    } else if (m.t === 'ecailles' && id === enLigne.hote && typeof m.n === 'number') {
      recevoirEcaillesHote(m.n); // Écailles de la partie jouée chez l'hôte (js/03-progression.js)
    } else if (m.t === 'succes' && id === enLigne.hote && typeof m.id === 'string') {
      debloquerSucces(m.id, true); // succès gagné ensemble dans la partie de l'hôte
    }
  });
  salon.onPeerStream = (flux, id) => {
    if (!enLigne || enLigne.salon !== salon || (enLigne.hote && id !== enLigne.hote)) return;
    inviteVideo.srcObject = flux;
    const lecture = inviteVideo.play();
    if (lecture && lecture.catch) lecture.catch(() => {});
    inviteMessage.style.display = 'none';
  };
  salon.onPeerLeave = (id) => {
    if (!enLigne || enLigne.salon !== salon || id !== enLigne.hote) return;
    inviteMessage.textContent = 'La partie est terminée ou la connexion est perdue.';
    inviteMessage.style.display = '';
  };
  // personne ne répond : mauvais code, jeu de l'hôte fermé, ou réseaux qui n'arrivent pas à se relier
  setTimeout(() => {
    if (!enLigne || enLigne.salon !== salon || enLigne.hote) return;
    const liaison = enLigne.erreurLiaison;
    quitterEnLigne(true);
    etatEnLigne(liaison
      ? 'La partie a été trouvée mais vos deux réseaux n\'arrivent pas à se relier. Réessaie, ou essaie avec un autre réseau (partage de connexion du téléphone par exemple).'
      : 'Aucune partie trouvée avec ce code. Vérifie les lettres, et que le jeu de l\'hôte est ouvert avec le code affiché.');
  }, 30000);
}

function quitterEnLigne(garderPanneau) {
  if (!enLigne) return;
  const etait = enLigne;
  enLigne = null;
  if (etait.role === 'hote') majResolutionPlateau(); // l'image n'est plus envoyée : pleine résolution
  try { etait.salon.leave(); } catch (e) {}
  if (etait.flux) etait.flux.getTracks().forEach(t => t.stop());
  if (etait.role === 'hote') gamepadStatusEl.textContent = '';
  if (etait.role === 'invite' && etait.connecte) {
    location.reload(); // l'invité retrouve son jeu normal, proprement
    return;
  }
  majPanneauEnLigne();
  if (!garderPanneau) fermerMenuEnLigne();
}

window.addEventListener('beforeunload', () => {
  if (enLigne) try { enLigne.salon.leave(); } catch (e) {}
});

// --- Écran de l'invité ---

function entrerEcranInvite() {
  fermerMenuEnLigne();
  // la partie locale s'arrête : l'invité ne fait que regarder et commander
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  if (!isPaused && !waitingToStart && !gameOver) isPaused = true;
  document.body.classList.add('invite-en-ligne');
  inviteMessage.textContent = 'Connecté ! L\'image de la partie arrive…';
  inviteMessage.style.display = '';
  ajusterVideoInvite();
  requestAnimationFrame(lireManetteInvite);
}

// la vidéo prend le plus grand carré possible dans son cadre
function ajusterVideoInvite() {
  if (!enEcranInvite()) return;
  const r = cadreVideo.getBoundingClientRect();
  const cote = Math.floor(Math.max(0, Math.min(r.width, r.height)));
  inviteVideo.style.width = inviteVideo.style.height = cote + 'px';
}
window.addEventListener('resize', ajusterVideoInvite);

function afficherHudInvite(textes) {
  const zone = document.getElementById('inviteHud');
  zone.textContent = '';
  textes.slice(0, 10).forEach(t => {
    const div = document.createElement('div');
    div.textContent = String(t).slice(0, 120);
    zone.appendChild(div);
  });
}

function envoyerAHote(message) {
  if (enLigne && enLigne.role === 'invite' && enLigne.hote) enLigne.envoyer(message, enLigne.hote);
}

function enEcranInvite() {
  return document.body.classList.contains('invite-en-ligne');
}

// clavier de l'invité : on capte les touches avant le jeu local (qui est arrêté) ;
// mêmes touches qu'en solo (⚙️ Options), plus Entrée ou Ctrl pour tirer
window.addEventListener('keydown', (e) => {
  if (!enEcranInvite() || optionsOuvertes) return;
  e.stopImmediatePropagation();
  const dir = directionDeTouche(e.code, false) || directionDeTouche(e.code, true);
  if (dir) { e.preventDefault(); envoyerAHote({t: 'dir', dx: dir[0], dy: dir[1]}); return; }
  if (e.repeat) return;
  if (e.code === touches.boost) { e.preventDefault(); envoyerAHote({t: 'action'}); }
  else if (e.code === touches.bouclier || e.code === touches.bouclierJ2) envoyerAHote({t: 'bouclier'});
  else if (e.code === touches.tirJ2 || e.key === 'Enter' || e.key === 'Control') { e.preventDefault(); envoyerAHote({t: 'tir'}); }
  else if (e.code === touches.pause || e.key === 'Escape') envoyerAHote({t: 'pause'});
  else if (e.code === touches.pleinEcran) basculerPleinEcran();
}, true);
window.addEventListener('keyup', (e) => {
  if (!enEcranInvite() || optionsOuvertes) return;
  e.stopImmediatePropagation();
  if (e.code === touches.boost) envoyerAHote({t: 'relache'});
}, true);

// boutons de l'invité
function boutonInvite(id, appui, relache) {
  const b = document.getElementById(id);
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); appui(); });
  if (relache) {
    b.addEventListener('pointerup', relache);
    b.addEventListener('pointercancel', relache);
    b.addEventListener('pointerleave', relache);
  }
}
boutonInvite('inviteBoost', () => envoyerAHote({t: 'action'}), () => envoyerAHote({t: 'relache'}));
boutonInvite('inviteBouclier', () => envoyerAHote({t: 'bouclier'}));
boutonInvite('inviteTir', () => envoyerAHote({t: 'tir'}));
boutonInvite('invitePause', () => envoyerAHote({t: 'pause'}));
boutonInvite('inviteQuitter', () => quitterEnLigne());

// doigt ou souris sur la vidéo : glisser = tourner (enchaînable), toucher = tirer à cet endroit
let gesteInvite = null;
const cadreVideo = document.getElementById('inviteVideoCadre');
['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(type => {
  ecranInvite.addEventListener(type, (e) => e.stopPropagation(), {passive: true}); // le tactile du jeu local ne voit rien
});
cadreVideo.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  gesteInvite = {id: e.pointerId, x: e.clientX, y: e.clientY, debut: performance.now(), aTourne: false};
  try { cadreVideo.setPointerCapture(e.pointerId); } catch (err) {}
});
cadreVideo.addEventListener('pointermove', (e) => {
  if (!gesteInvite || gesteInvite.id !== e.pointerId) return;
  const dx = e.clientX - gesteInvite.x, dy = e.clientY - gesteInvite.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) envoyerAHote({t: 'dir', dx: Math.sign(dx), dy: 0});
  else envoyerAHote({t: 'dir', dx: 0, dy: Math.sign(dy)});
  gesteInvite.x = e.clientX;
  gesteInvite.y = e.clientY;
  gesteInvite.aTourne = true;
});
function finGesteInvite(e) {
  if (!gesteInvite || gesteInvite.id !== e.pointerId) return;
  const g = gesteInvite;
  gesteInvite = null;
  if (g.aTourne || e.type === 'pointercancel' || performance.now() - g.debut > 400) return;
  // position touchée dans l'image (la vidéo garde ses proportions, centrée dans son cadre)
  const r = inviteVideo.getBoundingClientRect();
  const vw = inviteVideo.videoWidth || 1, vh = inviteVideo.videoHeight || 1;
  const echelle = Math.min(r.width / vw, r.height / vh);
  const largeur = vw * echelle, hauteur = vh * echelle;
  const x = (e.clientX - (r.left + (r.width - largeur) / 2)) / largeur;
  const y = (e.clientY - (r.top + (r.height - hauteur) / 2)) / hauteur;
  if (x >= 0 && x <= 1 && y >= 0 && y <= 1) envoyerAHote({t: 'vise', x, y});
}
cadreVideo.addEventListener('pointerup', finGesteInvite);
cadreVideo.addEventListener('pointercancel', finGesteInvite);
cadreVideo.addEventListener('contextmenu', (e) => e.preventDefault());

// manette de l'invité (la partie locale étant arrêtée, on la lit ici)
let boutonsManetteInvite = [];
let directionManetteInvite = '';
function lireManetteInvite() {
  if (!enEcranInvite()) return;
  const pad = listerManettes()[0];
  if (pad) {
    const etat = pad.buttons.map(b => !!(b && (b.pressed || b.value > 0.5)));
    const appui = i => etat[i] && !boutonsManetteInvite[i];
    const relache = i => !etat[i] && boutonsManetteInvite[i];
    let dx = 0, dy = 0;
    if (etat[MANETTE.HAUT]) dy = -1;
    else if (etat[MANETTE.BAS]) dy = 1;
    else if (etat[MANETTE.GAUCHE]) dx = -1;
    else if (etat[MANETTE.DROITE]) dx = 1;
    else {
      const sx = pad.axes[0] || 0, sy = pad.axes[1] || 0;
      if (Math.max(Math.abs(sx), Math.abs(sy)) > zoneMorteStick) {
        if (Math.abs(sx) > Math.abs(sy)) dx = Math.sign(sx);
        else dy = Math.sign(sy);
      }
    }
    const dir = dx + ',' + dy;
    if (dir !== directionManetteInvite && (dx || dy)) envoyerAHote({t: 'dir', dx, dy});
    directionManetteInvite = dir;
    if (appui(MANETTE.A)) envoyerAHote({t: 'action'});
    if (relache(MANETTE.A)) envoyerAHote({t: 'relache'});
    if (appui(MANETTE.B) || appui(MANETTE.LB)) envoyerAHote({t: 'bouclier'});
    if (appui(MANETTE.RT) || appui(MANETTE.RB) || appui(MANETTE.X)) envoyerAHote({t: 'tir'});
    if (appui(MANETTE.START)) envoyerAHote({t: 'pause'});
    boutonsManetteInvite = etat;
  }
  requestAnimationFrame(lireManetteInvite);
}

// premier réglage du plateau à la taille de l'écran (js/18-options.js), une fois tout le script chargé
ajusterTaillePlateau();
