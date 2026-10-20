// ============================================================
// --- Progression entre les parties : les Écailles 🪙 ---
// ============================================================
// Chaque partie rapporte des Écailles (même perdue), et chaque succès en rapporte à son premier déblocage.
// Tout l'équilibrage est dans reglagesProgression : changer un gain ou un prix, c'est changer un nombre ici.
// Le jeu ne lit ces valeurs que par gainPartie(), bonusProgression(cle) et contenuDebloque(type, cle).
// Les Écailles se dépensent dans la Boutique (js/16-menu-buffs.js), entre deux parties : améliorations,
// buffs de la pomme bleue, thèmes, skins du serpent et de la tourelle. Les skins d'ennemis se gagnent par les succès (skinsParSucces).
// Sauvegarde dans snakeProgression, avec une copie de la version précédente (snakeProgression_prec)
// reprise si la principale est illisible. Plan complet : plans/progression_permanente.md du dossier du projet.
// Mode Malédiction : des malus choisis avant la partie (reglagesProgression.maledictions, écran js/18-malediction.js),
// chacun ajoute un bonus en % aux Écailles de la partie. Le jeu ne les lit que par maledictionActive(cle).
// Adresse du jeu avec ?dev : progression à part (snakeProgression_dev), Boutique ouverte en pleine partie,
// boutons pour se donner des Écailles ou tout débloquer, pas de succès.

const reglagesProgression = {
  gains: {
    parSegments: 5, // 1 Écaille pour 5 de longueur atteinte
    parEnnemis: 5, // 1 Écaille pour 5 ennemis tués
    boss: 20, // par boss vaincu
    pommeOr: 3, // par pomme en or mangée
    victoire: 50, // longueur 400 atteinte
    dureeMinSecondes: 10, // une partie plus courte ne rapporte rien (pas de gain en relançant en boucle)
    // succès, une seule fois chacun : valeur par catégorie, sinon parDefaut ; parSucces passe avant tout
    succes: {
      parDefaut: 25,
      parCategorie: {debut: 10, difficulte: 50},
      parSucces: {bon_eleve: 50, platine: 100, kamikaze: 10}
    }
  },
  // mesuré par parties automatiques (outils/parties_auto.py) : une partie en Difficile dure 3 fois moins qu'en Facile,
  // donc ce bonus doit être fort pour que Difficile rapporte plus par minute de jeu
  multiplicateurDifficulte: {facile: 1, normal: 1.75, difficile: 2.25},
  // ce qu'un nouveau joueur a dès le début
  depart: {
    themes: ['neon', 'espace', 'ocean'],
    skins: ['urchin', 'ghost', 'pixel'],
    serpents: ['classique'],
    tourelles: ['classique'],
    buffs: ['doublepoints']
  },
  // ce que gardent les joueurs qui avaient une sauvegarde avant la Boutique (tout ce qui existait alors)
  ancienJoueur: {
    themes: ['lave'],
    skins: ['slime', 'bat'],
    serpents: [],
    tourelles: [],
    buffs: ['freeze', 'invincible', 'laser', 'autoaim', 'explode']
  },
  // prix en Écailles
  buffs: {freeze: 100, invincible: 150, laser: 150, autoaim: 150, explode: 250},
  themes: {lave: 300, aurore: 300, foret: 300, desert: 300, synthwave: 300, halloween: 300},
  // skins du serpent du joueur (js/08-skins-serpent.js)
  serpents: {corail: 200, tigre: 250, robot: 300, dragon: 400, galaxie: 400, arcenciel: 500, roi: 800},
  // skins de la tourelle du joueur (js/13-skins-tourelle.js)
  tourelles: {canon: 150, arbalete: 150, fleur: 200, gatling: 250, blaster: 300, dragon: 400},
  // skin d'ennemi -> succès qui le débloque ; jamais « Bestiaire » ni « Boss de chaque espèce »,
  // qui demandent d'avoir affronté tous les skins
  skinsParSucces: {
    slime: 'ca_pousse', bat: 'tueur_geant', jelly: 'boa', crab: 'chasseur', pumpkin: 'increvable',
    mushroom: 'gourmand', eye: 'trophees', drone: 'gros_bras', spider: 'hardcore'
  },
  // améliorations permanentes : effet par niveau, et un prix par niveau (ajouter un prix = ajouter un niveau)
  ameliorations: {
    coeur: {effet: 1, prix: [400]}, // cœurs en plus au départ
    dureeBuffs: {effet: 0.10, prix: [100, 200, 300]}, // durée des buffs (+10 %)
    bouclier: {effet: 0.10, prix: [80, 160, 240]}, // recharge du bouclier (-10 %)
    pommeBleue: {effet: 0.01, prix: [150, 300]}, // chance de pomme bleue (+1 point de %)
    aimant: {effet: 30, prix: [120, 240]}, // rayon (px) où les pommes en or et bleues glissent vers la tête
    balles: {effet: 0.15, prix: [150, 300]}, // vitesse des tirs (+15 %)
    avarice: {effet: 0.10, prix: [100, 200, 300]} // Écailles gagnées (+10 %)
  },
  vitesseAimant: 0.12, // px par ms : vitesse à laquelle l'aimant attire une pomme
  // Mode Malédiction : malus cumulables choisis avant la partie ; bonus = % d'Écailles en plus sur le gain de la partie
  // (les bonus s'additionnent : trois malus à +20 % donnent ×1,6, en plus du bonus de difficulté)
  maledictions: {
    rapides: {bonus: 0.25, vitesse: 1.35}, // ennemis et boss 35 % plus rapides
    horde: {bonus: 0.25, intervalle: 0.6}, // un ennemi toutes les 2,2 s x 0,6
    coriaces: {bonus: 0.20, pvBoss: 1.5}, // tous les ennemis à 2 coups, boss avec 50 % de PV en plus
    serpentRapide: {bonus: 0.20, vitesse: 1.2}, // le serpent avance 20 % plus vite
    sansBouclier: {bonus: 0.15},
    sansSprint: {bonus: 0.10},
    sansBuffs: {bonus: 0.15}, // plus aucune pomme bleue
    unCoeur: {bonus: 0.40} // un seul cœur au départ (Cœur de réserve compris), et plus de cœur bonus
  }
};

// textes de la Boutique ; {n} = l'effet total au niveau affiché
const textesAmeliorations = {
  coeur: {icone: '❤️', nom: 'Cœur de réserve', detail: n => '+' + n + ' cœur au départ'},
  dureeBuffs: {icone: '⏳', nom: 'Buffs prolongés', detail: n => '+' + Math.round(n * 100) + ' % de durée des buffs'},
  bouclier: {icone: '🛡️', nom: 'Bouclier rapide', detail: n => '-' + Math.round(n * 100) + ' % de recharge du bouclier'},
  pommeBleue: {icone: '🔵', nom: 'Pomme bleue', detail: n => '+' + Math.round(n * 100) + ' % de chance qu\'un ennemi en laisse une'},
  aimant: {icone: '🧲', nom: 'Aimant', detail: n => 'Pommes en or et bleues attirées à ' + n + ' px de la tête'},
  balles: {icone: '🔫', nom: 'Balles rapides', detail: n => '+' + Math.round(n * 100) + ' % de vitesse des tirs'},
  avarice: {icone: '🪙', nom: 'Avarice', detail: n => '+' + Math.round(n * 100) + ' % d\'Écailles gagnées'}
};

// textes du mode Malédiction, dans l'ordre de l'écran de choix
const textesMaledictions = {
  rapides: {icone: '⚡', nom: 'Ennemis rapides', detail: m => 'Ennemis et boss ' + Math.round((m.vitesse - 1) * 100) + ' % plus rapides'},
  horde: {icone: '👾', nom: 'Horde', detail: m => 'Les ennemis apparaissent ' + Math.round((1 / m.intervalle - 1) * 100) + ' % plus souvent'},
  coriaces: {icone: '🧱', nom: 'Ennemis coriaces', detail: m => 'Tous les ennemis à 2 coups, boss ' + Math.round((m.pvBoss - 1) * 100) + ' % plus solides'},
  serpentRapide: {icone: '🏃', nom: 'Serpent pressé', detail: m => 'Ton serpent avance ' + Math.round((m.vitesse - 1) * 100) + ' % plus vite'},
  sansBouclier: {icone: '🛡️', nom: 'Sans bouclier', detail: () => 'Le bouclier ne marche pas'},
  sansSprint: {icone: '🐢', nom: 'Sans sprint', detail: () => 'Pas d\'accélération'},
  sansBuffs: {icone: '🔵', nom: 'Sans buffs', detail: () => 'Plus aucune pomme bleue'},
  unCoeur: {icone: '🖤', nom: 'Un seul cœur', detail: () => '1 cœur au départ, plus de cœur bonus, donc pas de rollback'}
};

const modeDev = /[?&]dev(=|&|$)/.test(location.search);

// --- Sauvegarde ---
const cleStockageProgression = modeDev ? 'snakeProgression_dev' : 'snakeProgression';
const cleStockageProgressionPrec = cleStockageProgression + '_prec';
const versionProgression = 1;

function progressionVide() {
  return {
    version: versionProgression,
    ecailles: 0, // à dépenser
    total: 0, // gagnées depuis le début
    parties: 0, // parties qui ont rapporté
    achats: {}, // amélioration ou contenu -> niveau acheté
    inactifs: [], // améliorations coupées dans la Boutique
    succesPayes: [], // succès dont les Écailles ont déjà été données
    maledictions: [], // malus choisis pour les prochaines parties (mode Malédiction)
    migre: false, // anciens joueurs déjà traités (ancienJoueur)
    boutiqueVue: false // la Boutique a déjà été ouverte (sinon on la signale)
  };
}

// lit une sauvegarde ; renvoie null si elle est absente ou illisible
function lireProgression(cle) {
  try {
    const lu = JSON.parse(localStorage.getItem(cle));
    if (!lu || typeof lu !== 'object' || typeof lu.ecailles !== 'number' || !isFinite(lu.ecailles)) return null;
    const p = progressionVide();
    ['ecailles', 'total', 'parties'].forEach(c => {
      if (typeof lu[c] === 'number' && isFinite(lu[c])) p[c] = Math.max(0, Math.floor(lu[c]));
    });
    if (lu.achats && typeof lu.achats === 'object') {
      Object.keys(lu.achats).forEach(c => {
        if (typeof lu.achats[c] === 'number') p.achats[c] = lu.achats[c];
      });
    }
    ['inactifs', 'succesPayes'].forEach(c => {
      if (Array.isArray(lu[c])) p[c] = lu[c].filter(x => typeof x === 'string');
    });
    if (Array.isArray(lu.maledictions)) p.maledictions = lu.maledictions.filter(c => reglagesProgression.maledictions[c]);
    ['migre', 'boutiqueVue'].forEach(c => { p[c] = lu[c] === true; });
    return p;
  } catch (e) {
    return null;
  }
}

let progression = lireProgression(cleStockageProgression) || lireProgression(cleStockageProgressionPrec) || progressionVide();

function sauverProgression() {
  try {
    // la version précédente, si elle est saine, devient la copie de secours
    if (lireProgression(cleStockageProgression)) {
      localStorage.setItem(cleStockageProgressionPrec, localStorage.getItem(cleStockageProgression));
    }
    localStorage.setItem(cleStockageProgression, JSON.stringify(progression));
  } catch (e) {
    // stockage indisponible : la progression vaut pour cette session seulement
  }
  if (typeof rafraichirMenuBuffs === 'function') rafraichirMenuBuffs(); // solde du bouton 🛒 Boutique
}

// demande au navigateur de ne pas effacer les données du jeu quand il manque de place
function demanderStockagePersistant() {
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  } catch (e) {
    // pas grave : le navigateur décide seul
  }
}

// --- Améliorations ---
function niveauAchete(cle) {
  return progression.achats[cle] || 0;
}

function niveauAmelioration(cle) {
  if (progression.inactifs.includes(cle)) return 0;
  return niveauAchete(cle);
}

// bonus total d'une amélioration : effet par niveau x niveau acheté et activé
// (0 pendant le tutoriel, pour que tout le monde l'ait dans les mêmes conditions)
function bonusProgression(cle) {
  const a = reglagesProgression.ameliorations[cle];
  if (!a || enTuto()) return 0;
  return a.effet * niveauAmelioration(cle);
}

// tutoActif() sans erreur pendant le chargement de la page (le tutoriel est défini plus loin, js/18-tuto.js)
function enTuto() {
  try {
    return tutoActif();
  } catch (e) {
    return false;
  }
}

// prix du prochain niveau, ou null au niveau maximum
function prixProchainNiveau(cle) {
  const prix = reglagesProgression.ameliorations[cle].prix;
  const n = niveauAchete(cle);
  return n < prix.length ? prix[n] : null;
}

function depenser(prix) {
  if (prix === null || prix === undefined || progression.ecailles < prix) return false;
  progression.ecailles -= prix;
  return true;
}

function acheterAmelioration(cle) {
  if (!depenser(prixProchainNiveau(cle))) return false;
  progression.achats[cle] = niveauAchete(cle) + 1;
  progression.inactifs = progression.inactifs.filter(c => c !== cle);
  sauverProgression();
  return true;
}

function basculerAmelioration(cle) {
  if (!niveauAchete(cle)) return;
  if (progression.inactifs.includes(cle)) progression.inactifs = progression.inactifs.filter(c => c !== cle);
  else progression.inactifs.push(cle);
  sauverProgression();
}

// rend toutes les Écailles dépensées en améliorations (les buffs et thèmes achetés restent)
function rembourserAmeliorations() {
  let rendu = 0;
  Object.keys(reglagesProgression.ameliorations).forEach(cle => {
    const prix = reglagesProgression.ameliorations[cle].prix;
    for (let i = 0; i < Math.min(niveauAchete(cle), prix.length); i++) rendu += prix[i];
    delete progression.achats[cle];
  });
  progression.ecailles += rendu;
  progression.inactifs = progression.inactifs.filter(c => !reglagesProgression.ameliorations[c]);
  sauverProgression();
  return rendu;
}

// --- Contenu : buffs, thèmes, skins d'ennemis, skins du serpent et de la tourelle ---
// type : 'buff', 'theme', 'skin' (ennemis), 'serpent' ou 'tourelle'
const listesDepart = {buff: 'buffs', theme: 'themes', skin: 'skins', serpent: 'serpents', tourelle: 'tourelles'};

function contenuDebloque(type, cle) {
  if (modeDev) return true;
  if (reglagesProgression.depart[listesDepart[type]].includes(cle)) return true;
  if (progression.achats[type + ':' + cle]) return true;
  if (type === 'skin') {
    const succes = reglagesProgression.skinsParSucces[cle];
    return !succes || !!succesSauves.obtenus[succes];
  }
  if (type === 'buff') return reglagesProgression.buffs[cle] === undefined;
  if (type === 'theme') return reglagesProgression.themes[cle] === undefined;
  if (type === 'serpent') return reglagesProgression.serpents[cle] === undefined;
  if (type === 'tourelle') return reglagesProgression.tourelles[cle] === undefined;
  return true;
}

// prix d'un buff, d'un thème, d'un skin du serpent ou de la tourelle (les skins d'ennemis ne s'achètent pas)
function prixContenu(type, cle) {
  const table = type === 'buff' ? reglagesProgression.buffs : type === 'theme' ? reglagesProgression.themes
    : type === 'serpent' ? reglagesProgression.serpents : type === 'tourelle' ? reglagesProgression.tourelles : {};
  return table[cle] !== undefined ? table[cle] : null;
}

function acheterContenu(type, cle) {
  if (contenuDebloque(type, cle) || !depenser(prixContenu(type, cle))) return false;
  progression.achats[type + ':' + cle] = 1;
  sauverProgression();
  return true;
}

// buffs que la pomme bleue peut donner : activés dans la Boutique et débloqués
function buffsDisponibles() {
  return buffsActifs.filter(t => contenuDebloque('buff', t));
}

// buffs que la pomme bleue peut donner dans cette partie (aucun sous la malédiction « Sans buffs »)
function buffsEnJeu() {
  return maledictionActive('sansBuffs') ? [] : buffsDisponibles();
}

// --- Mode Malédiction ---
// malus de la partie en cours : copiés au lancement (init), pour qu'un changement n'agisse qu'à la partie suivante
let maledictionsPartie = [];

function maledictionActive(cle) {
  return !enTuto() && maledictionsPartie.includes(cle);
}

function basculerMalediction(cle) {
  if (!reglagesProgression.maledictions[cle]) return;
  const liste = progression.maledictions;
  progression.maledictions = liste.includes(cle) ? liste.filter(c => c !== cle) : liste.concat(cle);
  sauverProgression();
}

// bonus d'Écailles d'une liste de malus (0,75 = +75 %)
function bonusMaledictions(liste) {
  const m = reglagesProgression.maledictions;
  return Math.round(liste.reduce((s, c) => s + (m[c] ? m[c].bonus : 0), 0) * 100) / 100;
}

// réglage d'un malus actif (ex. reglageMalediction('rapides', 'vitesse', 1) : 1,35 sous la malédiction, sinon 1)
function reglageMalediction(cle, champ, sinon) {
  return maledictionActive(cle) ? reglagesProgression.maledictions[cle][champ] : sinon;
}

// points de vie d'un boss (+50 % sous la malédiction « Ennemis coriaces »)
function pvBossPartie() {
  return Math.round(reglagesDifficulte().pvBoss * reglageMalediction('coriaces', 'pvBoss', 1));
}

// bouclier et sprint : coupés dans la Boutique ou par une malédiction
function bouclierDisponible() {
  return capacitesActives.bouclier && !maledictionActive('sansBouclier');
}

function sprintDisponible() {
  return capacitesActives.sprint && !maledictionActive('sansSprint');
}

// « +75 % » ; vide sans malus
function texteBonusMaledictions(liste) {
  const b = bonusMaledictions(liste);
  return b > 0 ? '+' + Math.round(b * 100) + ' %' : '';
}

// --- Effets des améliorations dans la partie ---
function dureeRechargeBouclier() {
  return shieldCooldownDuration * (1 - bonusProgression('bouclier'));
}

// Aimant : une pomme en or ou bleue proche d'une tête glisse vers elle
function attirerPomme(pomme, deltaMs) {
  const rayon = bonusProgression('aimant');
  if (!rayon) return;
  let cible = null, meilleure = Infinity;
  joueursEnJeu().forEach(j => {
    const t = j.snake[0];
    const d = Math.hypot(t.x * gridSize + gridSize / 2 - pomme.x, t.y * gridSize + gridSize / 2 - pomme.y);
    if (d < rayon + pomme.radius && d < meilleure) { meilleure = d; cible = t; }
  });
  if (!cible || meilleure < 1) return;
  const pas = Math.min(meilleure, reglagesProgression.vitesseAimant * deltaMs);
  pomme.x += (cible.x * gridSize + gridSize / 2 - pomme.x) / meilleure * pas;
  pomme.y += (cible.y * gridSize + gridSize / 2 - pomme.y) / meilleure * pas;
}

// --- Gains ---
function ajouterEcailles(n) {
  if (!(n > 0)) return;
  progression.ecailles += n;
  progression.total += n;
}

// Écailles d'un succès (une seule fois par succès)
function ecaillesSucces(id) {
  const g = reglagesProgression.gains.succes;
  if (g.parSucces[id] !== undefined) return g.parSucces[id];
  const s = succesParId[id];
  if (s && g.parCategorie[s.cat] !== undefined) return g.parCategorie[s.cat];
  return g.parDefaut;
}

// appelé au déblocage d'un succès ; renvoie les Écailles données
function payerSucces(id) {
  if (progression.succesPayes.includes(id)) return 0;
  const n = ecaillesSucces(id);
  progression.succesPayes.push(id);
  ajouterEcailles(n);
  sauverProgression();
  partieProgression.succes += n;
  if (dernierGainPartie) majRecapEcailles(); // succès gagné après la fin (podium...)
  // un succès peut débloquer un skin d'ennemi
  Object.keys(reglagesProgression.skinsParSucces).forEach(skin => {
    if (reglagesProgression.skinsParSucces[skin] !== id || progression.achats['skin:' + skin]) return;
    const btn = document.querySelector('.skin-btn[data-skin="' + skin + '"]');
    afficherBanniereSucces({titre: '🔓 Nouveau skin d\'ennemi', icone: '👾', nom: btn ? btn.dataset.nom || btn.textContent : skin});
    majVerrous();
  });
  return n;
}

// au lancement : les joueurs qui avaient déjà une sauvegarde gardent tout ce qui existait avant la Boutique
function migrerAncienJoueur() {
  if (progression.migre) return;
  progression.migre = true;
  let ancien = false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const cle = localStorage.key(i);
      if (cle === 'snakeTutoFait' || cle.startsWith('snakeHighscores')) ancien = true;
    }
  } catch (e) {
    // stockage indisponible : nouveau joueur
  }
  if (Object.keys(succesSauves.obtenus).length) ancien = true;
  if (ancien && !modeDev) {
    const a = reglagesProgression.ancienJoueur;
    a.themes.forEach(c => { progression.achats['theme:' + c] = 1; });
    a.skins.forEach(c => { progression.achats['skin:' + c] = 1; });
    a.buffs.forEach(c => { progression.achats['buff:' + c] = 1; });
    a.serpents.forEach(c => { progression.achats['serpent:' + c] = 1; });
    a.tourelles.forEach(c => { progression.achats['tourelle:' + c] = 1; });
  }
  sauverProgression();
}

// au lancement : paie les succès obtenus avant l'arrivée des Écailles (ou dont le paiement a été perdu)
function rattraperSuccesProgression() {
  migrerAncienJoueur();
  let n = 0;
  Object.keys(succesSauves.obtenus).forEach(id => {
    if (progression.succesPayes.includes(id)) return;
    progression.succesPayes.push(id);
    n += ecaillesSucces(id);
  });
  if (n > 0) {
    ajouterEcailles(n);
    sauverProgression();
  }
  return n;
}

// Écailles gagnées par les succès pendant la partie en cours (remis à zéro par init)
let partieProgression = {succes: 0};
let dernierGainPartie = null; // détail du gain de la dernière partie terminée (écran de fin)

function progressionNouvellePartie() {
  partieProgression = {succes: 0};
  dernierGainPartie = null;
  maledictionsPartie = enEcranInvite() ? [] : progression.maledictions.slice();
}

// calcul pur : ce que rapporte une partie, ligne par ligne
// partie : {longueur, ennemis, boss, pommesOr, victoire, dureeSecondes, difficulte, maledictions (liste, facultative)}
function gainPartie(partie) {
  const g = reglagesProgression.gains;
  const lignes = [];
  if (partie.dureeSecondes < g.dureeMinSecondes) return {lignes, base: 0, multiplicateur: 1, total: 0};
  const ajouter = (libelle, n) => { if (n > 0) lignes.push([libelle, n]); };
  ajouter('📏 Longueur ' + partie.longueur, Math.floor(partie.longueur / g.parSegments));
  const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');
  ajouter('👾 ' + pluriel(partie.ennemis, 'ennemi'), Math.floor(partie.ennemis / g.parEnnemis));
  ajouter('👑 ' + partie.boss + ' boss', partie.boss * g.boss);
  ajouter('🟡 ' + nomPomme('or') + ' × ' + partie.pommesOr, partie.pommesOr * g.pommeOr);
  if (partie.victoire) ajouter('🎉 Victoire', g.victoire);
  const base = lignes.reduce((s, l) => s + l[1], 0);
  const bonusMalus = bonusMaledictions(partie.maledictions || []);
  const multiplicateur = (reglagesProgression.multiplicateurDifficulte[partie.difficulte] || 1) *
    (1 + bonusProgression('avarice')) * (1 + bonusMalus);
  return {lignes, base, multiplicateur, bonusMaledictions: bonusMalus, total: Math.round(base * multiplicateur)};
}

// fin de partie (perdue ou gagnée) : calcule le gain, l'ajoute et le garde pour l'écran de fin
function progressionFinPartie(victoire) {
  if (tutoActif() || enEcranInvite() || !partieSucces.commencee) return;
  const gain = gainPartie({
    longueur: stats.maxSnakeLength,
    ennemis: stats.enemiesKilled,
    boss: partieSucces.boss,
    pommesOr: stats.goldenApplesEaten,
    victoire,
    dureeSecondes: (performance.now() - stats.startTime) / 1000,
    difficulte,
    maledictions: maledictionsPartie
  });
  ajouterEcailles(gain.total);
  if (gain.total > 0) progression.parties++;
  sauverProgression();
  dernierGainPartie = gain;
  // jeu en ligne : l'ami gagne les mêmes Écailles que l'hôte pour cette partie
  if (enLigne && enLigne.role === 'hote' && enLigne.invite && gain.total > 0) {
    enLigne.envoyer({t: 'ecailles', n: gain.total}, enLigne.invite);
  }
}

// écran de l'invité : Écailles de la partie jouée chez l'hôte
function recevoirEcaillesHote(n) {
  n = Math.floor(n);
  if (!(n > 0) || n > 5000) return;
  ajouterEcailles(n);
  sauverProgression();
  afficherBanniereSucces({icone: '🪙', nom: '+' + n + ' Écailles', detail: 'Gagnées avec ton ami (total : ' + progression.ecailles + ')'});
}

// texte court pour l'écran de fin : « 🪙 +42 Écailles (total 310) »
function texteGainPartie() {
  if (!dernierGainPartie) return '';
  const n = dernierGainPartie.total + partieProgression.succes;
  const malus = dernierGainPartie.bonusMaledictions > 0 ? '  💀 ' + texteBonusMaledictions(maledictionsPartie) : '';
  return '🪙 +' + n + ' Écaille' + (n > 1 ? 's' : '') + malus + '  (total ' + progression.ecailles + ')';
}

// détail du gain sous le jeu, dans les stats de fin de partie
function majRecapEcailles() {
  const zone = document.getElementById('statsEcailles');
  if (!zone) return;
  zone.textContent = '';
  const g = dernierGainPartie;
  if (!g) return;
  const lignes = g.lignes.slice();
  const nombre = x => '×' + String(Math.round(x * 100) / 100).replace('.', ',');
  const multiplicateurSansMalus = g.multiplicateur / (1 + (g.bonusMaledictions || 0));
  if (g.base > 0 && Math.abs(multiplicateurSansMalus - 1) > 0.001) {
    lignes.push(['⭐ Bonus ' + reglagesDifficulte().nom, nombre(multiplicateurSansMalus)]);
  }
  if (g.base > 0 && g.bonusMaledictions > 0) {
    const icones = maledictionsPartie.map(c => textesMaledictions[c].icone).join('');
    lignes.push(['💀 Malédiction ' + icones, nombre(1 + g.bonusMaledictions)]);
  }
  if (partieProgression.succes > 0) lignes.push(['🏆 Succès', partieProgression.succes]);
  const h = document.createElement('h3');
  const n = g.total + partieProgression.succes;
  h.textContent = '🪙 ' + n + ' Écaille' + (n > 1 ? 's' : '') + ' gagnée' + (n > 1 ? 's' : '') +
    ' (total : ' + progression.ecailles + ')';
  zone.appendChild(h);
  if (!lignes.length) {
    const p = document.createElement('p');
    p.className = 'stats-ecailles-vide';
    p.textContent = 'Partie trop courte : elle doit durer au moins ' + reglagesProgression.gains.dureeMinSecondes + ' secondes.';
    zone.appendChild(p);
    return;
  }
  const ul = document.createElement('ul');
  lignes.forEach(([libelle, valeur]) => {
    const li = document.createElement('li');
    const a = document.createElement('span');
    a.textContent = libelle;
    const b = document.createElement('span');
    b.className = 'stat-value';
    b.textContent = typeof valeur === 'number' ? '+' + valeur : valeur;
    li.append(a, b);
    ul.appendChild(li);
  });
  zone.appendChild(ul);
}
