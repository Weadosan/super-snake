// ============================================================
// --- Succès : 58 défis débloqués en jouant, gardés sur l'appareil ---
// ============================================================
// La liste est dans listeSucces. Le jeu signale ce qui se passe (succesKill, succesPomme,
// succesLongueur, succesFinPartie...) et majSucces vérifie à chaque image ce qui dépend du temps
// ou du score. Une bannière annonce chaque déblocage, l'écran 🏆 (bouton « 🏆 Succès » du menu ☰,
// touche U) les montre tous, et la fin de partie rappelle ceux gagnés pendant la partie.
// Rien ne se débloque pendant le tutoriel, sauf « Bon élève » et « Curieux ».
// En ligne, l'hôte fait tourner la partie et envoie chaque déblocage à son ami, qui le garde aussi.

const cleStockageSucces = 'snakeSucces';
const skinsSucces = ['urchin', 'ghost', 'pixel', 'slime', 'bat', 'jelly', 'eye', 'drone', 'spider', 'crab', 'pumpkin', 'mushroom'];
const themesSucces = ['neon', 'espace', 'lave', 'ocean', 'aurore', 'foret', 'desert', 'synthwave', 'halloween'];

const categoriesSucces = [
  {cle: 'debut', nom: '🐣 Premiers pas'},
  {cle: 'survie', nom: '📏 Longueur et survie'},
  {cle: 'combat', nom: '🔫 Combat'},
  {cle: 'boss', nom: '👑 Boss'},
  {cle: 'pommes', nom: '🍎 Pommes et bonus'},
  {cle: 'capacites', nom: '⏪ Capacités'},
  {cle: 'difficulte', nom: '🔥 Difficulté'},
  {cle: 'themes', nom: '🎨 Thèmes et skins'},
  {cle: 'coop', nom: '👥 Coop et en ligne'},
  {cle: 'score', nom: '⭐ Score et secrets'}
];

// progres : [valeur actuelle, objectif] pour les succès à compteur (barre de progression)
const cumulSucces = () => succesSauves.cumul;
const listeSucces = [
  {id: 'premier_repas', cat: 'debut', icone: '🍏', nom: 'Premier repas', detail: 'Manger sa première pomme.'},
  {id: 'bon_eleve', cat: 'debut', icone: '🎓', nom: 'Bon élève', detail: 'Terminer le tutoriel.'},
  {id: 'curieux', cat: 'debut', icone: '❓', nom: 'Curieux', detail: 'Ouvrir les 6 pages de l\'aide.',
    progres: () => [cumulSucces().pagesAide.length, 6]},
  {id: 'premier_sang', cat: 'debut', icone: '🎯', nom: 'Premier sang', detail: 'Tuer son premier ennemi.'},
  {id: 'premiere_chute', cat: 'debut', icone: '🩹', nom: 'Première chute', detail: 'Perdre sa première partie.'},

  {id: 'ca_pousse', cat: 'survie', icone: '🌱', nom: 'Ça pousse', detail: 'Atteindre une longueur de 50.'},
  {id: 'boa', cat: 'survie', icone: '🐍', nom: 'Boa', detail: 'Atteindre une longueur de 100.'},
  {id: 'anaconda', cat: 'survie', icone: '🐉', nom: 'Anaconda', detail: 'Atteindre une longueur de 200 (les ennemis disparaissent).'},
  {id: 'super_snake', cat: 'survie', icone: '🎆', nom: 'Super Snake', detail: 'Gagner une partie (longueur 400).'},
  {id: 'increvable', cat: 'survie', icone: '⏱️', nom: 'Increvable', detail: 'Survivre 5 minutes dans une partie.'},
  {id: 'marathon', cat: 'survie', icone: '🏃', nom: 'Marathon', detail: 'Survivre 15 minutes dans une partie.'},
  {id: 'sans_egratignure', cat: 'survie', icone: '💎', nom: 'Sans une égratignure', detail: 'Atteindre 100 de long sans perdre un seul cœur.'},
  {id: 'sur_le_fil', cat: 'survie', icone: '🧵', nom: 'Sur le fil', detail: 'Gagner une partie avec 1 seul cœur.'},

  {id: 'chasseur', cat: 'combat', icone: '🏹', nom: 'Chasseur', detail: 'Tuer 50 ennemis dans une partie.'},
  {id: 'exterminateur', cat: 'combat', icone: '💀', nom: 'Exterminateur', detail: 'Tuer 150 ennemis dans une partie.'},
  {id: 'massacre', cat: 'combat', icone: '☠️', nom: 'Massacre', detail: 'Tuer 1 000 ennemis au total.',
    progres: () => [cumulSucces().ennemis, 1000]},
  {id: 'tireur_elite', cat: 'combat', icone: '🔭', nom: 'Tireur d\'élite', detail: 'Finir une partie avec 80 % de précision (au moins 50 tirs).'},
  {id: 'gros_bras', cat: 'combat', icone: '💪', nom: 'Gros bras', detail: 'Tuer 25 ennemis résistants au total (Normal ou Difficile).',
    progres: () => [cumulSucces().resistants, 25]},
  {id: 'combo', cat: 'combat', icone: '⚡', nom: 'Combo', detail: 'Tuer 5 ennemis en moins de 3 secondes.'},
  {id: 'pacifiste', cat: 'combat', icone: '🕊️', nom: 'Pacifiste', detail: 'Atteindre 50 de long sans tirer un seul coup.'},

  {id: 'tueur_geant', cat: 'boss', icone: '👑', nom: 'Tueur de géant', detail: 'Vaincre un boss.'},
  {id: 'trophees', cat: 'boss', icone: '🏅', nom: 'Collectionneur de trophées', detail: 'Vaincre 3 boss dans la même partie.'},
  {id: 'boss_especes', cat: 'boss', icone: '🦔', nom: 'Boss de chaque espèce', detail: 'Vaincre le boss de chaque skin d\'ennemi (' + skinsSucces.length + ' skins).',
    progres: () => [cumulSucces().bossSkins.length, skinsSucces.length]},
  {id: 'sans_trembler', cat: 'boss', icone: '🗿', nom: 'Sans trembler', detail: 'Vaincre un boss sans perdre de cœur pendant le combat.'},

  {id: 'gourmand', cat: 'pommes', icone: '😋', nom: 'Gourmand', detail: 'Manger 500 pommes au total.',
    progres: () => [cumulSucces().pommes, 500]},
  {id: 'ruee_or', cat: 'pommes', icone: '🪙', nom: 'Ruée vers l\'or', detail: 'Manger 5 pommes en or dans une partie.'},
  {id: 'rattrape', cat: 'pommes', icone: '🤾', nom: 'Rattrapé !', detail: 'Manger une pomme en or moins de 2 secondes après son apparition.'},
  {id: 'butin', cat: 'pommes', icone: '🎁', nom: 'Butin', detail: 'Ramasser 20 pommes laissées par des ennemis.',
    progres: () => [cumulSucces().butin, 20]},
  {id: 'coeur_sur_la_main', cat: 'pommes', icone: '❤️', nom: 'Cœur sur la main', detail: 'Ramasser 10 cœurs bonus au total.',
    progres: () => [cumulSucces().coeurs, 10]},
  {id: 'panoplie', cat: 'pommes', icone: '🧪', nom: 'Panoplie complète', detail: 'Obtenir chacun des 6 buffs de la pomme bleue.',
    progres: () => [cumulSucces().buffs.length, buffTypes.length]},
  {id: 'grand_menage', cat: 'pommes', icone: '💥', nom: 'Grand ménage', detail: 'Tuer 10 ennemis d\'un coup avec l\'explosion générale.'},
  {id: 'jackpot', cat: 'pommes', icone: '💰', nom: 'Jackpot', detail: 'Marquer 500 points pendant un seul Points x2.'},

  {id: 'retour_futur', cat: 'capacites', icone: '⏪', nom: 'Retour vers le futur', detail: 'Faire un premier rollback.'},
  {id: 'boucle_temporelle', cat: 'capacites', icone: '🌀', nom: 'Boucle temporelle', detail: 'Enchaîner 3 rollbacks (recul de 3 secondes ou plus).'},
  {id: 'parade', cat: 'capacites', icone: '🛡️', nom: 'Parade parfaite', detail: 'Détruire un ennemi qui fonce sur ton bouclier.'},
  {id: 'fou_volant', cat: 'capacites', icone: '🚀', nom: 'Fou du volant', detail: 'Sprinter 60 secondes au total dans une partie.'},
  {id: 'ancienne', cat: 'capacites', icone: '📼', nom: 'À l\'ancienne', detail: 'Atteindre 100 de long avec bouclier et sprint désactivés toute la partie.'},

  {id: 'echauffement', cat: 'difficulte', icone: '🟢', nom: 'Échauffement', detail: 'Atteindre 100 de long en Facile.'},
  {id: 'serieux', cat: 'difficulte', icone: '🟡', nom: 'Sérieux', detail: 'Vaincre un boss en Normal.'},
  {id: 'hardcore', cat: 'difficulte', icone: '🔴', nom: 'Hardcore', detail: 'Vaincre un boss en Difficile.'},
  {id: 'legende', cat: 'difficulte', icone: '🏆', nom: 'Légende', detail: 'Gagner une partie en Difficile.'},
  {id: 'tout_terrain', cat: 'difficulte', icone: '🧗', nom: 'Tout-terrain', detail: 'Gagner une partie dans chaque difficulté.',
    progres: () => [cumulSucces().victoiresDiff.length, ordreDifficultes.length]},

  {id: 'touriste', cat: 'themes', icone: '🧳', nom: 'Touriste', detail: 'Jouer une partie dans chacun des ' + themesSucces.length + ' thèmes.',
    progres: () => [cumulSucces().themesJoues.length, themesSucces.length]},
  {id: 'explorateur', cat: 'themes', icone: '🧭', nom: 'Explorateur', detail: 'Atteindre 100 de long dans chaque thème.',
    progres: () => [cumulSucces().themes100.length, themesSucces.length]},
  {id: 'bestiaire', cat: 'themes', icone: '📖', nom: 'Bestiaire', detail: 'Affronter chacun des ' + skinsSucces.length + ' skins d\'ennemis.',
    progres: () => [cumulSucces().skinsVus.length, skinsSucces.length]},
  {id: 'maitre_elements', cat: 'themes', icone: '🌋', nom: 'Maître des éléments', detail: 'Gagner une partie dans chaque thème.',
    progres: () => [cumulSucces().victoiresTheme.length, themesSucces.length]},

  {id: 'duo', cat: 'coop', icone: '👥', nom: 'Duo', detail: 'Jouer une partie en coop.'},
  {id: 'main_dans_main', cat: 'coop', icone: '🤝', nom: 'Main dans la main', detail: 'Vaincre un boss en coop.'},
  {id: 'esprit_equipe', cat: 'coop', icone: '🎉', nom: 'Esprit d\'équipe', detail: 'Gagner une partie en coop.'},
  {id: 'pas_tir_ami', cat: 'coop', icone: '🚧', nom: 'Pas de tir ami', detail: 'En coop avec la collision entre joueurs, atteindre 100 de long sans se rentrer dedans.'},
  {id: 'connecte', cat: 'coop', icone: '🌐', nom: 'Connecté', detail: 'Jouer en ligne (créer ou rejoindre une partie).'},
  {id: 'a_distance', cat: 'coop', icone: '📡', nom: 'À distance', detail: 'Vaincre un boss en ligne.'},

  {id: 'score_1000', cat: 'score', icone: '4️⃣', nom: 'Score à 4 chiffres', detail: 'Marquer 1 000 points dans une partie.'},
  {id: 'score_10000', cat: 'score', icone: '5️⃣', nom: 'Score à 5 chiffres', detail: 'Marquer 10 000 points dans une partie.'},
  {id: 'podium', cat: 'score', icone: '🥇', nom: 'Podium', detail: 'Entrer dans le tableau des meilleurs scores.'},
  {id: 'accro', cat: 'score', icone: '🎮', nom: 'Accro', detail: 'Jouer 50 parties.',
    progres: () => [cumulSucces().parties, 50]},
  {id: 'platine', cat: 'score', icone: '💠', nom: 'Platine', detail: 'Débloquer tous les autres succès.',
    progres: () => [listeSucces.filter(s => s.id !== 'platine' && succesSauves.obtenus[s.id]).length, listeSucces.length - 1]},
  {id: 'kamikaze', cat: 'score', icone: '💣', nom: 'Kamikaze', detail: 'Perdre dans les 5 premières secondes.', secret: true}
];
const succesParId = Object.create(null);
listeSucces.forEach(s => succesParId[s.id] = s);

// --- Sauvegarde : succès obtenus (avec leur date) et compteurs cumulés ---
function succesVides() {
  return {
    obtenus: {}, // id -> date du déblocage (ms)
    cumul: {
      ennemis: 0, pommes: 0, butin: 0, coeurs: 0, resistants: 0, parties: 0,
      pagesAide: [], buffs: [], bossSkins: [], themesJoues: [], themes100: [],
      skinsVus: [], victoiresTheme: [], victoiresDiff: []
    }
  };
}

function chargerSucces() {
  const donnees = succesVides();
  try {
    const lu = JSON.parse(localStorage.getItem(cleStockageSucces));
    if (lu && typeof lu === 'object') {
      if (lu.obtenus && typeof lu.obtenus === 'object') {
        Object.keys(lu.obtenus).forEach(id => {
          if (succesParId[id] && typeof lu.obtenus[id] === 'number') donnees.obtenus[id] = lu.obtenus[id];
        });
      }
      const c = lu.cumul || {};
      Object.keys(donnees.cumul).forEach(cle => {
        const attendu = donnees.cumul[cle];
        if (Array.isArray(attendu) ? Array.isArray(c[cle]) : typeof c[cle] === 'number') donnees.cumul[cle] = c[cle];
      });
    }
  } catch (e) {
    // stockage indisponible ou corrompu : on repart de zéro
  }
  return donnees;
}

let succesSauves = chargerSucces();
let succesASauver = false; // compteurs modifiés depuis la dernière sauvegarde
let derniereSauvegardeSucces = 0;

function sauverSucces() {
  succesASauver = false;
  derniereSauvegardeSucces = performance.now();
  try {
    localStorage.setItem(cleStockageSucces, JSON.stringify(succesSauves));
  } catch (e) {
    // stockage indisponible : les succès valent pour cette session seulement
  }
}
window.addEventListener('pagehide', () => {
  if (succesASauver) sauverSucces();
});

function compterSucces(cle, n = 1) {
  succesSauves.cumul[cle] += n;
  succesASauver = true;
  return succesSauves.cumul[cle];
}

// ajoute une valeur à une liste cumulée ; renvoie la taille de la liste
function ajouterSucces(cle, valeur) {
  const liste = succesSauves.cumul[cle];
  if (!liste.includes(valeur)) {
    liste.push(valeur);
    succesASauver = true;
  }
  return liste.length;
}

// --- État propre à la partie en cours (remis à zéro par init) ---
function nouvellePartieSucces() {
  return {
    commencee: false, // compte à rebours terminé
    debloques: [], // ids gagnés pendant cette partie (rappel en fin de partie)
    coeursPerdus: 0,
    coeursPerdusAuBoss: null, // coeursPerdus au moment où le boss actuel est apparu
    boss: 0,
    kills: [], // instants des derniers kills (combo)
    sprintMs: 0,
    sansCapacites: true, // bouclier et sprint désactivés depuis le début
    collisionOk: true, // collision entre joueurs activée depuis le début
    toucheJoueur: false // un serpent est rentré dans l'autre
  };
}
let partieSucces = nouvellePartieSucces();

function succesNouvellePartie() {
  if (succesASauver) sauverSucces();
  partieSucces = nouvellePartieSucces();
}

// pas de succès pendant le tutoriel, ni sur l'écran de l'invité (c'est l'hôte qui fait tourner la partie)
function succesActifs() {
  return !tutoActif() && !enEcranInvite() && !modeDev;
}

function debloquerSucces(id, depuisHote) {
  const s = succesParId[id];
  if (!s || succesSauves.obtenus[id]) return;
  if (!depuisHote && tutoActif() && id !== 'bon_eleve' && id !== 'curieux') return;
  succesSauves.obtenus[id] = Date.now();
  sauverSucces();
  payerSucces(id); // Écailles du succès (js/03-progression.js)
  partieSucces.debloques.push(id);
  afficherBanniereSucces(s);
  playSuccesSound();
  // jeu en ligne : l'ami gagne le succès avec l'hôte
  if (enLigne && enLigne.role === 'hote' && enLigne.invite) enLigne.envoyer({t: 'succes', id}, enLigne.invite);
  if (gameOver) majRecapSucces();
  if (succesOuvert) remplirEcranSucces();
  if (id !== 'platine' && listeSucces.every(x => x.id === 'platine' || succesSauves.obtenus[x.id])) {
    debloquerSucces('platine', depuisHote);
  }
}

// --- Ce que le jeu signale ---
function succesDebutPartie() {
  if (!tutoActif() && !enEcranInvite()) partieSucces.commencee = true; // compte aussi pour les Écailles (même en ?dev)
  if (!succesActifs()) return;
  if (compterSucces('parties') >= 50) debloquerSucces('accro');
  if (ajouterSucces('themesJoues', currentThemeName) >= themesSucces.length) debloquerSucces('touriste');
  if (enCoop()) debloquerSucces('duo');
}

function succesKill(e) {
  if (!succesActifs()) return;
  const now = performance.now();
  debloquerSucces('premier_sang');
  if (stats.enemiesKilled >= 50) debloquerSucces('chasseur');
  if (stats.enemiesKilled >= 150) debloquerSucces('exterminateur');
  if (compterSucces('ennemis') >= 1000) debloquerSucces('massacre');
  if (!e.isBoss && e.maxHp >= 2 && compterSucces('resistants') >= 25) debloquerSucces('gros_bras');
  partieSucces.kills = partieSucces.kills.filter(t => now - t < 3000);
  partieSucces.kills.push(now);
  if (partieSucces.kills.length >= 5) debloquerSucces('combo');

  if (!e.isBoss) return;
  partieSucces.boss++;
  debloquerSucces('tueur_geant');
  if (partieSucces.boss >= 3) debloquerSucces('trophees');
  if (skinsSucces.includes(enemySkin) && ajouterSucces('bossSkins', enemySkin) >= skinsSucces.length) {
    debloquerSucces('boss_especes');
  }
  if (partieSucces.coeursPerdusAuBoss !== null && partieSucces.coeursPerdus === partieSucces.coeursPerdusAuBoss) {
    debloquerSucces('sans_trembler');
  }
  partieSucces.coeursPerdusAuBoss = null;
  if (difficulte === 'normal') debloquerSucces('serieux');
  if (difficulte === 'difficile') debloquerSucces('hardcore');
  if (enCoop()) debloquerSucces('main_dans_main');
  if (enLigne && enLigne.role === 'hote' && enLigne.invite) debloquerSucces('a_distance');
}

function succesBossApparu() {
  partieSucces.coeursPerdusAuBoss = partieSucces.coeursPerdus;
}

// type : 'normale', 'butin', 'or' ou 'bleue' ; pomme : l'objet ramassé (pommes mobiles)
function succesPomme(type, pomme) {
  if (!succesActifs()) return;
  debloquerSucces('premier_repas');
  if (compterSucces('pommes') >= 500) debloquerSucces('gourmand');
  if (type === 'butin' && compterSucces('butin') >= 20) debloquerSucces('butin');
  if (type === 'or') {
    if (stats.goldenApplesEaten >= 5) debloquerSucces('ruee_or');
    if (pomme && pomme.ne && performance.now() - pomme.ne <= 2000) debloquerSucces('rattrape');
  }
}

function succesPageAide(n) {
  if (ajouterSucces('pagesAide', n) >= pagesAide.length) debloquerSucces('curieux');
}

function succesCoeur() {
  if (succesActifs() && compterSucces('coeurs') >= 10) debloquerSucces('coeur_sur_la_main');
}

function succesCoeurPerdu() {
  partieSucces.coeursPerdus++;
}

function succesBuff(type) {
  if (succesActifs() && ajouterSucces('buffs', type) >= buffTypes.length) debloquerSucces('panoplie');
}

function succesExplosion(nombre) {
  if (succesActifs() && nombre >= 10) debloquerSucces('grand_menage');
}

// points gagnés pendant le Points x2 du joueur actif (remis à zéro quand le buff démarre)
function succesPointsX2(points) {
  if (!succesActifs()) return;
  joueurActif.pointsX2 = (joueurActif.pointsX2 || 0) + points;
  if (joueurActif.pointsX2 >= 500) debloquerSucces('jackpot');
}

function succesRollback(recul) {
  if (!succesActifs()) return;
  debloquerSucces('retour_futur');
  if (recul >= 3000) debloquerSucces('boucle_temporelle');
}

function succesParade() {
  if (succesActifs()) debloquerSucces('parade');
}

function succesCollisionJoueurs() {
  partieSucces.toucheJoueur = true;
}

// longueur du serpent du joueur actif après un déplacement
function succesLongueur(longueur) {
  if (!succesActifs()) return;
  if (longueur >= 50) {
    debloquerSucces('ca_pousse');
    if (stats.shotsFired === 0) debloquerSucces('pacifiste');
  }
  if (longueur >= 200) debloquerSucces('anaconda');
  if (longueur < 100) return;
  debloquerSucces('boa');
  if (partieSucces.coeursPerdus === 0) debloquerSucces('sans_egratignure');
  if (difficulte === 'facile') debloquerSucces('echauffement');
  if (partieSucces.sansCapacites) debloquerSucces('ancienne');
  if (enCoop() && partieSucces.collisionOk && !partieSucces.toucheJoueur) debloquerSucces('pas_tir_ami');
  if (ajouterSucces('themes100', currentThemeName) >= themesSucces.length) debloquerSucces('explorateur');
}

function succesFinPartie(victoire) {
  if (!succesActifs()) return;
  if (!victoire) {
    debloquerSucces('premiere_chute');
    if (partieSucces.commencee && performance.now() - stats.startTime < 5000) debloquerSucces('kamikaze');
  }
  if (stats.shotsFired >= 50 && stats.shotsHit / stats.shotsFired >= 0.8) debloquerSucces('tireur_elite');
  if (victoire) {
    debloquerSucces('super_snake');
    if (joueursEnJeu().reduce((n, j) => n + j.lives, 0) === 1) debloquerSucces('sur_le_fil');
    if (difficulte === 'difficile') debloquerSucces('legende');
    if (enCoop()) debloquerSucces('esprit_equipe');
    if (ajouterSucces('victoiresDiff', difficulte) >= ordreDifficultes.length) debloquerSucces('tout_terrain');
    if (ajouterSucces('victoiresTheme', currentThemeName) >= themesSucces.length) debloquerSucces('maitre_elements');
  }
  sauverSucces();
}

// le score final vient d'entrer dans le tableau des meilleurs scores
function succesPodium() {
  if (succesActifs()) debloquerSucces('podium');
}

// à chaque image de jeu : temps de survie, score, sprint, options gardées depuis le début, skins affrontés
function majSucces(now, delta) {
  if (!partieSucces.commencee || gameOver || !succesActifs()) return;
  const duree = now - stats.startTime;
  if (duree >= 5 * 60000) debloquerSucces('increvable');
  if (duree >= 15 * 60000) debloquerSucces('marathon');
  if (score >= 1000) debloquerSucces('score_1000');
  if (score >= 10000) debloquerSucces('score_10000');
  if (bouclierDisponible() || sprintDisponible()) partieSucces.sansCapacites = false;
  if (!capacitesActives.collisionJoueurs) partieSucces.collisionOk = false;
  if (joueursEnJeu().some(j => j.boosting)) {
    partieSucces.sprintMs += delta;
    if (partieSucces.sprintMs >= 60000) debloquerSucces('fou_volant');
  }
  if (skinsSucces.includes(enemySkin) && enemies.some(e => !e.isBoss) &&
      ajouterSucces('skinsVus', enemySkin) >= skinsSucces.length) {
    debloquerSucces('bestiaire');
  }
  if (succesASauver && now - derniereSauvegardeSucces > 3000) sauverSucces();
}

// --- Son du déblocage : petit arpège montant ---
function playSuccesSound() {
  if (isMuted) return;
  const ctx = getAudioCtx();
  [783.99, 1046.5, 1318.51, 1567.98].forEach((freq, i) => { // Sol - Do - Mi - Sol
    const debut = ctx.currentTime + i * 0.07;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, debut);
    gain.gain.setValueAtTime(0.001, debut);
    gain.gain.linearRampToValueAtTime(0.14, debut + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, debut + (i === 3 ? 0.6 : 0.25));
    osc.connect(gain);
    gain.connect(sortieAudio);
    osc.start(debut);
    osc.stop(debut + 0.6);
  });
}

// --- Bannière de déblocage (en haut de l'écran, sans mettre le jeu en pause) ---
const bannieresSuccesEl = document.createElement('div');
bannieresSuccesEl.id = 'succesBannieres';
bannieresSuccesEl.setAttribute('aria-live', 'polite');
document.body.appendChild(bannieresSuccesEl);
const dureeBanniereSucces = 3200;
const maxBannieresSucces = 3; // au-delà, les suivantes attendent leur tour
let fileBannieresSucces = [];

function afficherBanniereSucces(s) {
  if (bannieresSuccesEl.children.length >= maxBannieresSucces) {
    fileBannieresSucces.push(s);
    return;
  }
  const el = document.createElement('div');
  el.className = 'succes-banniere';
  const icone = document.createElement('span');
  icone.className = 'succes-banniere-icone';
  icone.textContent = s.icone;
  const texte = document.createElement('span');
  texte.className = 'succes-banniere-texte';
  const titre = document.createElement('small');
  titre.textContent = s.titre || '🏆 Succès débloqué !';
  const nom = document.createElement('b');
  nom.textContent = s.nom;
  texte.appendChild(titre);
  texte.appendChild(nom);
  el.appendChild(icone);
  el.appendChild(texte);
  bannieresSuccesEl.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));
  setTimeout(() => {
    el.classList.remove('visible');
    setTimeout(() => {
      el.remove();
      if (fileBannieresSucces.length) afficherBanniereSucces(fileBannieresSucces.shift());
    }, 350);
  }, dureeBanniereSucces);
}

// --- Rappel en fin de partie (sous les stats) ---
function majRecapSucces() {
  const zone = document.getElementById('statsSucces');
  if (!zone) return;
  zone.textContent = '';
  if (!partieSucces.debloques.length) return;
  const h = document.createElement('h3');
  h.textContent = '🏆 Succès débloqués pendant la partie';
  zone.appendChild(h);
  const liste = document.createElement('div');
  liste.className = 'stats-succes-liste';
  partieSucces.debloques.forEach(id => {
    const s = succesParId[id];
    const puce = document.createElement('span');
    puce.className = 'stats-succes-puce';
    puce.textContent = s.icone + ' ' + s.nom;
    puce.title = s.detail;
    liste.appendChild(puce);
  });
  zone.appendChild(liste);
}

// --- Écran des succès ---
const succesMenuEl = document.createElement('div');
succesMenuEl.id = 'succesMenu';
succesMenuEl.setAttribute('role', 'dialog');
succesMenuEl.setAttribute('aria-modal', 'true');
succesMenuEl.innerHTML = `
  <div id="succesPanel">
    <h2>🏆 Succès</h2>
    <div id="succesResume">
      <span id="succesCompte"></span>
      <div class="succes-barre"><div id="succesBarreTotale"></div></div>
    </div>
    <div id="succesContenu"></div>
    <div id="succesActions">
      <button id="succesReinitialiser">↺ Réinitialiser</button>
      <button id="succesFermer">Fermer</button>
    </div>
  </div>`;
document.body.appendChild(succesMenuEl);
const succesContenuEl = document.getElementById('succesContenu');

let succesOuvert = false;
let succesAMisEnPause = false; // l'écran a mis la partie en pause : il la relance en se fermant

function dateSucces(ms) {
  const d = new Date(ms);
  return d.toLocaleDateString('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'});
}

function carteSucces(s) {
  const obtenu = succesSauves.obtenus[s.id];
  const cache = s.secret && !obtenu;
  const carte = document.createElement('div');
  carte.className = 'succes-carte' + (obtenu ? ' obtenu' : '');
  const icone = document.createElement('span');
  icone.className = 'succes-carte-icone';
  icone.textContent = obtenu ? s.icone : cache ? '❔' : '🔒';
  const texte = document.createElement('span');
  texte.className = 'succes-carte-texte';
  const nom = document.createElement('b');
  nom.textContent = cache ? '???' : s.nom;
  const detail = document.createElement('small');
  detail.textContent = cache ? 'Succès secret : continue de jouer pour le découvrir.' : s.detail;
  texte.appendChild(nom);
  texte.appendChild(detail);
  if (obtenu) {
    const date = document.createElement('small');
    date.className = 'succes-carte-date';
    date.textContent = '✔ ' + dateSucces(obtenu);
    texte.appendChild(date);
  } else if (s.progres) {
    const [valeur, objectif] = s.progres();
    const barre = document.createElement('div');
    barre.className = 'succes-barre petite';
    const rempli = document.createElement('div');
    rempli.style.width = Math.min(100, valeur / objectif * 100) + '%';
    barre.appendChild(rempli);
    const nombre = document.createElement('small');
    nombre.className = 'succes-carte-progres';
    nombre.textContent = Math.min(valeur, objectif).toLocaleString('fr-FR') + ' / ' + objectif.toLocaleString('fr-FR');
    texte.appendChild(barre);
    texte.appendChild(nombre);
  }
  carte.appendChild(icone);
  carte.appendChild(texte);
  return carte;
}

function remplirEcranSucces() {
  const total = listeSucces.length;
  const obtenus = listeSucces.filter(s => succesSauves.obtenus[s.id]).length;
  document.getElementById('succesCompte').textContent = obtenus + ' / ' + total + ' débloqués';
  document.getElementById('succesBarreTotale').style.width = (obtenus / total * 100) + '%';
  const defilement = succesContenuEl.scrollTop;
  succesContenuEl.textContent = '';
  categoriesSucces.forEach(c => {
    const deLaCategorie = listeSucces.filter(s => s.cat === c.cle);
    const h = document.createElement('h3');
    h.textContent = c.nom + ' (' + deLaCategorie.filter(s => succesSauves.obtenus[s.id]).length + ' / ' + deLaCategorie.length + ')';
    succesContenuEl.appendChild(h);
    const grille = document.createElement('div');
    grille.className = 'succes-grille';
    deLaCategorie.forEach(s => grille.appendChild(carteSucces(s)));
    succesContenuEl.appendChild(grille);
  });
  succesContenuEl.scrollTop = defilement;
}

function ouvrirSucces() {
  if (enEcranInvite()) return;
  if (aideOuverte) fermerAide();
  if (menuBuffsOuvert) fermerMenuBuffs();
  if (typeof fermerMenuTactile === 'function') fermerMenuTactile();
  if (!succesOuvert) {
    succesOuvert = true;
    succesAMisEnPause = false;
    if (countdownActive) {
      countdownActive = false;
      waitingToStart = true;
    }
    if (!isPaused && !waitingToStart && !gameOver) {
      togglePause();
      succesAMisEnPause = true;
    }
    joueurs.forEach(j => arreterBoost(j));
    succesContenuEl.scrollTop = 0;
  }
  if (succesASauver) sauverSucces();
  remplirEcranSucces();
  succesMenuEl.classList.add('ouvert');
}

function fermerSucces() {
  if (!succesOuvert) return;
  succesOuvert = false;
  succesMenuEl.classList.remove('ouvert');
  if (document.activeElement) document.activeElement.blur(); // évite qu'Espace ne réappuie sur un bouton
  if (succesAMisEnPause && isPaused) togglePause();
  succesAMisEnPause = false;
}

document.getElementById('succesFermer').addEventListener('click', fermerSucces);
document.getElementById('succesReinitialiser').addEventListener('click', () => {
  if (!window.confirm('Effacer tous les succès et leurs compteurs ?')) return;
  succesSauves = succesVides();
  partieSucces.debloques = [];
  sauverSucces();
  remplirEcranSucces();
});
succesMenuEl.addEventListener('click', (e) => {
  if (e.target === succesMenuEl) fermerSucces();
});
document.getElementById('succesBtn').addEventListener('click', (e) => {
  e.currentTarget.blur();
  ouvrirSucces();
});

// tant que l'écran est ouvert, le clavier le pilote : flèches pour défiler, Échap ou U pour fermer
window.addEventListener('keydown', (e) => {
  if (!succesOuvert) return;
  e.stopImmediatePropagation();
  if (e.key === 'Escape' || e.code === touches.succes) {
    e.preventDefault();
    fermerSucces();
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyS') {
    e.preventDefault();
    succesContenuEl.scrollTop += (e.key === 'ArrowDown' || e.code === 'KeyS') ? 60 : -60;
  }
}, true);

// manette sur l'écran des succès : haut/bas = défiler, B / A / Start = fermer
function manetteDansSucces(dy, vientDAppuyer) {
  if (dy !== 0) succesContenuEl.scrollTop += dy * 10;
  if (vientDAppuyer(MANETTE.B) || vientDAppuyer(MANETTE.A) || vientDAppuyer(MANETTE.START)) fermerSucces();
}
