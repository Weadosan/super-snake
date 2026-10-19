// ============================================================
// --- Mode Malédiction : malus choisis avant la partie, contre plus d'Écailles ---
// ============================================================
// Ouvert par « 💀 Malédiction » du menu ☰, le bouton 💀 à côté du plateau, la touche M (modifiable)
// ou X à la manette, seulement entre deux parties. Les malus et leurs bonus sont dans
// reglagesProgression.maledictions (js/03-progression.js) ; le choix est gardé dans la progression
// et copié au lancement de chaque partie (maledictionsPartie). Le tutoriel n'en a jamais.

let maledictionOuverte = false;
let maledictionAChange = false;
let focusMalediction = 0; // ligne choisie à la manette

const maledictionMenuEl = document.createElement('div');
maledictionMenuEl.id = 'maledictionMenu';
maledictionMenuEl.setAttribute('role', 'dialog');
maledictionMenuEl.setAttribute('aria-modal', 'true');
maledictionMenuEl.setAttribute('aria-labelledby', 'maledictionTitre');
maledictionMenuEl.innerHTML = `
  <div id="maledictionPanel">
    <h2 id="maledictionTitre">💀 Malédiction</h2>
    <p class="malediction-intro">Choisis des malus pour tes prochaines parties : chacun ajoute un bonus aux Écailles gagnées.
      Ils se cumulent, avec la difficulté et en coop. Pas de malédiction dans le tutoriel.</p>
    <div id="maledictionListe"></div>
    <p id="maledictionTotal"></p>
    <div id="maledictionActions">
      <button id="maledictionLever">✖ Tout lever</button>
      <button id="maledictionFermer">Fermer</button>
    </div>
  </div>`;
document.body.appendChild(maledictionMenuEl);

const maledictionListeEl = document.getElementById('maledictionListe');
Object.keys(textesMaledictions).forEach(cle => {
  const t = textesMaledictions[cle];
  const ligne = document.createElement('button');
  ligne.className = 'malediction-ligne';
  ligne.dataset.cle = cle;
  ligne.innerHTML = '<span class="malediction-icone"></span><span class="malediction-texte"><b></b><small></small></span>' +
    '<span class="malediction-bonus"></span>';
  ligne.querySelector('.malediction-icone').textContent = t.icone;
  ligne.querySelector('b').textContent = t.nom;
  ligne.querySelector('small').textContent = t.detail(reglagesProgression.maledictions[cle]);
  ligne.querySelector('.malediction-bonus').textContent = '+' + Math.round(reglagesProgression.maledictions[cle].bonus * 100) + ' %';
  ligne.addEventListener('click', () => {
    ligne.blur();
    basculerMalediction(cle);
    maledictionAChange = true;
    majMenuMalediction();
  });
  maledictionListeEl.appendChild(ligne);
});

// malédiction modifiable : entre deux parties, hors tutoriel et hors écran de l'invité en ligne
function maledictionModifiable() {
  return (waitingToStart || gameOver) && !countdownActive && !tutoActif() && !enEcranInvite();
}

// « ⚡👾🖤 » : icônes d'une liste de malus
function iconesMaledictions(liste) {
  return liste.map(c => textesMaledictions[c].icone).join('');
}

function majMenuMalediction() {
  const choisies = progression.maledictions;
  maledictionListeEl.querySelectorAll('.malediction-ligne').forEach((b, i) => {
    b.classList.toggle('actif', choisies.includes(b.dataset.cle));
    b.classList.toggle('focus-manette', modeEntree === 'manette' && i === focusMalediction);
    b.setAttribute('aria-pressed', choisies.includes(b.dataset.cle) ? 'true' : 'false');
  });
  const b = bonusMaledictions(choisies);
  document.getElementById('maledictionTotal').textContent = choisies.length
    ? '💀 ' + choisies.length + ' malus : +' + Math.round(b * 100) + ' % d\'Écailles (×' +
      String(Math.round((1 + b) * 100) / 100).replace('.', ',') + ')'
    : 'Aucun malus : partie normale.';
  majHudMalediction();
}

// rappel dans les infos de la partie (et sur l'écran de l'invité en ligne, qui reçoit le HUD)
function majHudMalediction() {
  const hud = document.getElementById('maledictionHud');
  if (!hud) return;
  const liste = enTuto() ? [] : maledictionsPartie; // malus de la partie (copiés à son lancement)
  hud.textContent = liste.length ? '💀 ' + iconesMaledictions(liste) + ' +' + Math.round(bonusMaledictions(liste) * 100) + ' % 🪙' : '';
  hud.title = liste.map(c => textesMaledictions[c].nom).join(', ');
  hud.style.display = liste.length ? '' : 'none';
  const bouton = document.getElementById('maledictionJeuBtn');
  if (bouton) bouton.classList.toggle('actif', progression.maledictions.length > 0);
  if (typeof rafraichirMenuBuffs === 'function') rafraichirMenuBuffs(); // boutons tactiles bouclier et boost
}

function ouvrirMalediction() {
  if (maledictionOuverte) return;
  if (!maledictionModifiable()) {
    if (!enEcranInvite()) {
      spawnPopup(largeurPlateau / 2, hauteurPlateau / 2, '💀 Malédiction : entre deux parties', '#ff8a80');
    }
    return;
  }
  if (menuBuffsOuvert) fermerMenuBuffs();
  if (aideOuverte) fermerAide();
  if (succesOuvert) fermerSucces();
  if (optionsOuvertes) fermerOptions();
  fermerMenuTactile();
  maledictionOuverte = true;
  maledictionAChange = false;
  focusMalediction = 0;
  maledictionMenuEl.classList.add('ouvert');
  majMenuMalediction();
}

function fermerMalediction() {
  if (!maledictionOuverte) return;
  maledictionOuverte = false;
  maledictionMenuEl.classList.remove('ouvert');
  if (document.activeElement) document.activeElement.blur(); // évite qu'Espace ne réappuie sur un bouton
  // partie pas encore lancée : on la prépare à nouveau avec les malus (cœurs, vitesse...)
  if (maledictionAChange && waitingToStart && !countdownActive && !tutoActif()) init();
  maledictionAChange = false;
  majHudMalediction();
}

document.getElementById('maledictionLever').addEventListener('click', () => {
  if (progression.maledictions.length) maledictionAChange = true;
  progression.maledictions = [];
  sauverProgression();
  majMenuMalediction();
});
document.getElementById('maledictionFermer').addEventListener('click', fermerMalediction);
maledictionMenuEl.addEventListener('click', (e) => {
  if (e.target === maledictionMenuEl) fermerMalediction(); // clic sur le fond sombre
});
['maledictionBtn', 'maledictionJeuBtn'].forEach(id => document.getElementById(id).addEventListener('click', (e) => {
  e.currentTarget.blur();
  ouvrirMalediction();
}));

// tant que le panneau est ouvert, il garde le clavier : Échap ou M le ferme, flèches et Entrée / Espace choisissent
window.addEventListener('keydown', (e) => {
  if (!maledictionOuverte) return;
  e.stopImmediatePropagation();
  const lignes = maledictionListeEl.querySelectorAll('.malediction-ligne');
  if (e.key === 'Escape' || e.code === touches.malediction) {
    e.preventDefault();
    fermerMalediction();
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const i = Array.prototype.indexOf.call(lignes, document.activeElement);
    const suivant = i < 0 ? 0 : (i + (e.key === 'ArrowDown' ? 1 : -1) + lignes.length) % lignes.length;
    lignes[suivant].focus();
  }
}, true);
window.addEventListener('keyup', (e) => {
  if (maledictionOuverte) e.stopImmediatePropagation();
}, true);

// manette : haut / bas pour choisir, A pour basculer, B, X ou Start pour fermer
function manetteDansMalediction(dy, vientDAppuyer) {
  const lignes = maledictionListeEl.querySelectorAll('.malediction-ligne');
  const now = performance.now();
  if (dy !== 0) {
    if (dy !== directionMenuManettePrecedente || now >= repetitionMenuManette) {
      focusMalediction = (focusMalediction + dy + lignes.length) % lignes.length;
      repetitionMenuManette = now + (dy !== directionMenuManettePrecedente ? 400 : 150);
      majMenuMalediction();
    }
  }
  directionMenuManettePrecedente = dy;
  if (vientDAppuyer(MANETTE.A)) lignes[focusMalediction].click();
  if (vientDAppuyer(MANETTE.B) || vientDAppuyer(MANETTE.X) || vientDAppuyer(MANETTE.START)) fermerMalediction();
}

// écran de départ : bandeau sous le titre (y = son haut), malus choisis ou invitation à en choisir ;
// renvoie la hauteur occupée (le tutoriel se dessine dessous)
function dessinerBandeauMalediction(haut) {
  if (tutoActif() || enEcranInvite()) return 0;
  const liste = progression.maledictions;
  const commande = texteCommande(nomTouche(touches.malediction), 'X', 'bouton 💀');
  const texte = liste.length
    ? '💀 ' + iconesMaledictions(liste) + '  +' + Math.round(bonusMaledictions(liste) * 100) + ' % d\'Écailles  (' + commande + ')'
    : '💀 Malédiction (' + commande + ') : plus dur, plus d\'Écailles';
  const y = haut + 13;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = (liste.length ? 'bold 12px ' : '11px ') + currentTheme.fontFamily;
  const largeur = Math.min(largeurPlateau - 16, ctx.measureText(texte).width + 20);
  if (liste.length) {
    ctx.fillStyle = 'rgba(120, 0, 0, 0.75)';
    ctx.strokeStyle = '#ff5252';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(largeurPlateau / 2 - largeur / 2, y - 11, largeur, 22, 8);
    else ctx.rect(largeurPlateau / 2 - largeur / 2, y - 11, largeur, 22);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffd7d7';
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;
  }
  ctx.fillText(texte, largeurPlateau / 2, y + 1);
  ctx.restore();
  return 26;
}
