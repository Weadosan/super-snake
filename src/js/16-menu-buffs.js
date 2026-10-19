// ============================================================
// --- Boutique : l'échoppe de Sifflet (ancien menu des buffs) ---
// ============================================================
// Bouton 🛒 (à côté du plateau et dans le menu), touche B, Y / Select à la manette. Entre deux parties, on y
// dépense ses Écailles (prix dans reglagesProgression, js/03-progression.js) et on choisit ce qu'on emporte.
// Une étagère par catégorie ; toucher un objet le pose sur le comptoir (sa fiche : niveau, effet, Acheter,
// Activer / Couper). Sifflet, le marchand, commente (répliques dans REPLIQUES_SIFFLET, faciles à changer).
// Pendant une partie, la boutique s'ouvre en lecture seule (sauf en ?dev).
const buffMenuEl = document.getElementById('buffMenu');
const buffMenuAvertissementEl = document.getElementById('buffMenuAvertissement');
const buffMenuBtn = document.getElementById('buffMenuBtn');
const boutiqueMessageEl = document.getElementById('boutiqueMessage'); // la bulle de Sifflet
const boutiqueJeuBtn = document.getElementById('boutiqueJeuBtn'); // 🛒 à côté du plateau
const etageresEl = document.getElementById('boutiqueEtageres');
const ficheAcheterEl = document.getElementById('ficheAcheter');
const ficheBasculerEl = document.getElementById('ficheBasculer');
let menuBuffsOuvert = false;
let menuAMisEnPause = false; // le menu a mis la partie en pause : il la relance en se fermant
let focusMenuManette = 0; // index du bouton sélectionné à la manette
let boutiqueAChange = false; // un achat ou un réglage à appliquer à la partie qui attend de démarrer
let boutiqueConstruite = false;
let objetChoisi = 'amelioration:coeur'; // clé de l'objet posé sur le comptoir
const objetsBoutique = {}; // clé -> {categorie, icone, nom, etat()}

// --- Répliques de Sifflet : {nom}, {prix}, {manque}, {niveau}, {succes}, {gain}, {solde} sont remplacés ---
const REPLIQUES_SIFFLET = {
  accueil: ['Sss… bienvenue chez Sifflet !', 'Des Écailles fraîches ? J\'ai ce qu\'il te faut.',
    'Entre, entre. Tout est fait main… enfin, fait queue.', 'Ah, mon client préféré !',
    'Essuie tes écailles avant d\'entrer, sss.', 'Regarde, touche, achète. Surtout achète.',
    'La meilleure échoppe du plateau. La seule, aussi.', 'Tiens, un serpent qui a de l\'ambition !',
    'Prends ton temps. Moi, j\'ai tout mon temps… et toutes tes Écailles bientôt.'],
  accueilPauvre: ['Les poches vides ? Une partie et reviens me voir.', 'Pas une Écaille ? On peut quand même regarder.',
    'Ici on paie en Écailles. Va en gagner quelques-unes, sss.'],
  accueilRiche: ['{solde} Écailles ! Tu as cassé ta tirelire ?', 'Oh, un client fortuné. Installe-toi, je t\'en prie.',
    'Avec tout ça, tu pourrais m\'acheter la boutique. Ne fais pas ça.'],
  apresPartie: ['+{gain} Écailles ! Belle partie, l\'ami.', 'Tu reviens avec {gain} Écailles. On fête ça ?',
    '{gain} Écailles gagnées. Tu sens la sueur… et la victoire.', 'Encore tout chaud de la partie ? Assieds-toi.'],
  apresPartieVide: ['Partie trop courte pour gagner quelque chose. Ça arrive aux meilleurs.',
    'Rien gagné cette fois ? La prochaine sera la bonne.'],
  amelioration: ['« {nom} » niveau {niveau} ? Excellent choix.', '{nom}, niveau {niveau}. Ça va te changer la vie.',
    'Niveau {niveau} de « {nom} ». Garanti sans retour… sauf avec Rembourser.', 'Ah, « {nom} ». Un classique.',
    '« {nom} » ! Mes clients en redemandent.'],
  ameliorationMax: ['Tu as le niveau maximum. Je n\'ai rien de plus fort.', 'Au maximum ! Même moi, je n\'ai pas mieux en réserve.',
    'Celui-là, tu l\'as poussé à fond. Respect, sss.'],
  contenu: ['« {nom} », pour {prix} Écailles. Une affaire !', '« {nom} » ? Il t\'attend depuis longtemps.',
    '« {nom} »… Je te le laisse à {prix}. Ne le dis à personne.', 'Tout neuf, jamais servi : « {nom} ».'],
  possede: ['« {nom} » est à toi. Touche le bouton pour l\'emporter ou le laisser.', 'Déjà payé. Tu choisis s\'il part avec toi.',
    '« {nom} » t\'appartient. Je te l\'emballe ?'],
  theme: ['Un nouveau décor, ça change tout.', 'Le thème « {nom} » te va très bien.', '« {nom} » ? On s\'y croirait.',
    'Change de décor, ça repose les yeux.'],
  skinVerrouille: ['Celui-là ne se vend pas. Réussis « {succes} » et il est à toi.',
    'Pas à vendre ! Il faut le mériter : « {succes} ».', 'Même pour mille Écailles, non. Seul « {succes} » le débloque.'],
  serpent: ['« {nom} » ? Il te va comme une seconde peau. Sss.', 'Très chic. Je portais le même dans ma jeunesse.',
    'Avec « {nom} », tous les serpents vont te regarder.', 'Une mue de luxe, garantie sans démangeaisons.',
    'Ah, « {nom} » ! Tu as l\'œil, l\'ami.'],
  tourelle: ['« {nom} » sur ton dos ? Les ennemis vont trembler.', 'Une tourelle neuve, ça se respecte. Sss.',
    'Avec « {nom} », tu tires avec style.', 'Elle tire aussi bien que l\'ancienne. Mais avec plus de classe.'],
  skin: ['Ces ennemis-là ? Ils sont tout à fait effrayants.', 'Bon choix d\'ennemis, sss.',
    'Ceux-là piquent un peu. Enfin, beaucoup.', 'Des ennemis bien élevés. Ils mordent quand même.'],
  capacite: ['Coupe-la si tu veux corser la partie. Moi je dis ça…', 'C\'est gratuit, mais tu peux la laisser au vestiaire.',
    'Les vrais durs jouent sans. Les malins jouent avec.'],
  achat: ['Merci ! Bonne partie, l\'ami.', 'Kaching ! Ça fait plaisir.', 'Vendu ! Reviens vite.',
    'Affaire conclue, sss !', 'Excellent achat. Je dis ça à tout le monde, mais là c\'est vrai.',
    'Tu ne le regretteras pas. Enfin, pas tout de suite.', 'Encore un client satisfait !', 'Avec ça, tu vas tout dévorer.'],
  tropCher: ['Reviens avec {manque} Écailles de plus, l\'ami.', 'Il te manque {manque} Écailles. Une partie ou deux ?',
    'Ah… {manque} Écailles de trop peu. Je ne fais pas crédit.', 'Joli rêve. Il manque {manque} Écailles.',
    'Sss… pas assez. Encore {manque} Écailles et c\'est à toi.'],
  rembourse: ['Je te rends {prix} Écailles. Choisis mieux cette fois, sss.', 'Tout est rendu : {prix} Écailles. On recommence ?',
    '{prix} Écailles qui reviennent. Mon cœur saigne un peu.'],
  rienARembourser: ['Rien à te rendre : tu n\'as encore rien acheté.', 'Rembourser quoi ? Tu n\'as rien pris, sss.'],
  lectureSeule: ['Chut, une partie est en cours. On fait les comptes après.', 'Finis ta partie d\'abord. Je ne bouge pas.',
    'On regarde, mais on n\'achète pas pendant la partie.'],
  emporter: ['« {nom} » part avec toi.', 'Bien. « {nom} » est dans tes bagages.', '« {nom} » est prêt pour la prochaine partie.'],
  laisser: ['« {nom} » reste à la maison. Je le garde au chaud.', 'D\'accord, sans « {nom} ». Courageux.',
    '« {nom} » attendra ici. Il ne bougera pas.'],
  toutActiver: ['Tout ce que tu as part avec toi. Sortie en grande pompe !', 'Tout activé ! Les ennemis n\'ont qu\'à bien se tenir.'],
  chatouille: ['Hé ! Ça chatouille !', 'Les écailles, on ne touche qu\'avec les yeux.', 'Sss ! Je suis le vendeur, pas la marchandise.',
    'Tu veux mon chapeau ? Il n\'est pas à vendre.', 'Encore une fois et je double les prix.', 'Hihi… arrête…'],
  bavardage: ['Tu savais que les pommes en or rapportent plus d\'Écailles ?', 'Un boss vaincu, c\'est une belle poignée d\'Écailles.',
    'Avarice te fait gagner plus à chaque partie. Je dis ça…', 'Ce chapeau ? Un cadeau d\'un ancien client. Il est parti en Difficile.',
    'Plus ton serpent est long, plus tu gagnes. Logique, non ?', 'J\'ai connu un serpent qui n\'achetait rien. Il a perdu.',
    'Psst… les succès débloquent des skins que je ne vends pas.', 'Il fait bon dans ma boutique, hein ?',
    'Un serpent bien habillé mord deux fois mieux. Regarde mes skins.',
    'Prends ton temps. Je compte mes Écailles en attendant.', 'Le Cœur de réserve, c\'est la sécurité. Ma mère en avait trois.',
    'Sss… sss… pardon, c\'est mon accent.', 'Tu hésites ? Moi aussi, j\'hésite toujours entre tout et tout.']
};

// répliques propres à un objet : Sifflet en dit une sur deux quand on le choisit
const REPLIQUES_OBJETS = {
  'amelioration:coeur': ['Un cœur de plus au départ. Toujours utile quand ça tourne mal.'],
  'amelioration:dureeBuffs': ['Tes buffs dureront plus longtemps. Le temps, c\'est de l\'Écaille.'],
  'amelioration:bouclier': ['Un bouclier qui se recharge plus vite. Les ennemis vont pleurer.'],
  'amelioration:pommeBleue': ['Plus de pommes bleues, donc plus de buffs. Un cercle vertueux, sss.'],
  'amelioration:aimant': ['Les pommes viennent toutes seules. Paresseux, mais efficace.'],
  'amelioration:balles': ['Des balles plus rapides. Pan, pan, sss.'],
  'amelioration:avarice': ['Avarice… mon objet préféré. Plus d\'Écailles pour toi, donc pour moi.'],
  'buff:freeze': ['Le Gel fige tout. Même mes prix, presque.'],
  'buff:laser': ['Un laser qui transperce tout. Ne le pointe pas vers moi.'],
  'buff:autoaim': ['La tourelle vise toute seule. Toi, tu n\'as qu\'à te faufiler.'],
  'buff:explode': ['Boum ! Plus d\'ennemis. Range-le loin de ma boutique.'],
  'buff:invincible': ['Dix secondes où rien ne peut t\'arriver. Profites-en bien.'],
  'buff:doublepoints': ['Points doublés : le buff des gourmands.'],
  'capacite:sprint': ['Le sprint ! Pour fuir… ou pour foncer.'],
  'capacite:bouclier': ['Le bouclier, ton meilleur ami. Après moi.'],
  'serpent:corail': ['Le corail : rouge, jaune, noir. Les ennemis savent ce que ça veut dire.'],
  'serpent:tigre': ['Un serpent tigre. Grrr… enfin, sss.'],
  'serpent:robot': ['Bip bip. Celui-là ne mue jamais, il change ses boulons.'],
  'serpent:dragon': ['Un vrai dragon ! Ne crache pas tes flammes dans ma boutique.'],
  'serpent:galaxie': ['Il a avalé le ciel de nuit. Les étoiles, c\'est cadeau.'],
  'serpent:arcenciel': ['Toutes les couleurs à la fois. Tu ne passeras pas inaperçu.'],
  'serpent:roi': ['L\'or le plus fin du plateau. Même ma couronne est jalouse.'],
  'tourelle:canon': ['Un canon de pirate. Boum, et l\'ennemi part par le fond.'],
  'tourelle:arbalete': ['Une arbalète ! Silencieuse, élégante, mortelle.'],
  'tourelle:fleur': ['Un tournesol qui tire. Ne me demande pas comment.'],
  'tourelle:gatling': ['Trois canons qui tournent. Ça fait un bruit… délicieux.'],
  'tourelle:blaster': ['Un blaster du futur. Je l\'ai trouvé dans une étoile filante.'],
  'tourelle:dragon': ['Une tête de dragon qui crache du feu. Pas dans ma boutique, merci.'],
  'serpent:classique': ['Le look de toujours. Les classiques ne se démodent pas.'],
  'theme:lave': ['La Lave… il fait chaud là-bas. Prends de l\'eau.'],
  'theme:ocean': ['L\'Océan. Je n\'y vais jamais, je nage mal.'],
  'theme:espace': ['L\'Espace ! Là-haut, personne ne t\'entend siffler.'],
  'theme:halloween': ['Halloween… même moi, j\'ai un peu peur.'],
  'theme:synthwave': ['Synthwave. Très rétro, très rose. J\'adore.'],
  'skin:ghost': ['Des fantômes ? Brrr. Je préfère ne pas regarder.'],
  'skin:mushroom': ['Ne mange pas ceux-là, ils ne sont pas comestibles.'],
  'skin:spider': ['Des araignées… J\'ai horreur des pattes. Je n\'en ai pas, moi.']
};

let derniereReplique = '';
function repliqueSifflet(type, valeurs) {
  const liste = REPLIQUES_SIFFLET[type];
  // jamais deux fois la même phrase d'affilée
  const choix = liste.length > 1 ? liste.filter(t => t !== derniereReplique) : liste;
  let texte = choix[Math.floor(Math.random() * choix.length)];
  derniereReplique = texte;
  Object.keys(valeurs || {}).forEach(k => { texte = texte.split('{' + k + '}').join(valeurs[k]); });
  return texte;
}

// ce que dit Sifflet d'un objet : une fois sur deux, sa réplique à lui s'il en a une
function repliqueObjet(cle) {
  const propres = REPLIQUES_OBJETS[cle];
  if (propres && Math.random() < 0.5) return propres[Math.floor(Math.random() * propres.length)];
  return objetsBoutique[cle].etat().replique;
}

// accueil selon ce qui vient de se passer : partie terminée, poches vides ou pleines
function repliqueAccueil() {
  if (gameOver && dernierGainPartie) {
    return dernierGainPartie.total > 0 ? repliqueSifflet('apresPartie', {gain: dernierGainPartie.total.toLocaleString('fr-FR')})
      : repliqueSifflet('apresPartieVide');
  }
  if (progression.ecailles === 0) return repliqueSifflet('accueilPauvre');
  if (progression.ecailles >= 1000 && Math.random() < 0.6) {
    return repliqueSifflet('accueilRiche', {solde: progression.ecailles.toLocaleString('fr-FR')});
  }
  return repliqueSifflet('accueil');
}

// --- Sifflet : petit dessin 20 x 20 (couleurs de PALETTE_ICONES, js/00-icones.js) ---
const SIFFLET_HAUT = [
  '......kkkkkkk.......', '......kvvvvvk.......', '......kvvvvvk.......', '......kvvvvvk.......',
  '......kyyyyyk.......', '....kkkkkkkkkkk.....', '.....kGGGGGGGk......', '....kGGGGGGGGGk.....'];
const SIFFLET_BAS = [
  '......kGGGGGk.......', '.....kGGLLLGGk......', '....kGGLLLLLGGk.....', '...kGGGGGGGGGGGk....', '..kGGGGGGGGGGGGGk...'];
const SIFFLET_VISAGES = {
  repos: ['....kGwkGGGwkGk.....', '....kGwwGGGwwGk.....', '....kGGGGGGGGGk.....', '....kLGGGGGGGLk.....',
    '.....kGGkkkGGk......', '......kGGrGGk.......', '.......kGrGk........'],
  langue: ['....kGwkGGGwkGk.....', '....kGwwGGGwwGk.....', '....kGGGGGGGGGk.....', '....kLGGGGGGGLk.....',
    '.....kGGkrkGGk......', '......kGGrGGk.......', '......krGGGrk.......'],
  cligne: ['....kGGGGGGGGGk.....', '....kGkkGGGkkGk.....', '....kGGGGGGGGGk.....', '....kLGGGGGGGLk.....',
    '.....kGGkkkGGk......', '......kGGGGGk.......', '.......kGGGk........'],
  content: ['....kGGkGGGkGGk.....', '....kGkGkGkGkGk.....', '....kGGGGGGGGGk.....', '....kLpGGGGGpLk.....',
    '.....kGkGGGkGk......', '......kGkkkGk.......', '.......kGrGk........'],
  decu: ['....kGkkGGGkkGk.....', '....kGwkGGGwkGk.....', '....kGGGGGGGGGk.....', '....kLGGGGGGGLk.....',
    '.....kGGGGGGGk......', '......kGkkkGk.......', '.......kGGGk........']
};
const siffletCtx = document.getElementById('sifflet').getContext('2d');
let humeurSifflet = 'repos', finHumeurSifflet = 0, finClignement = 0;

function dessinerSifflet(visage) {
  siffletCtx.clearRect(0, 0, 20, 20);
  SIFFLET_HAUT.concat(SIFFLET_VISAGES[visage], SIFFLET_BAS).forEach((ligne, y) => {
    for (let x = 0; x < ligne.length; x++) {
      if (ligne[x] === '.') continue;
      siffletCtx.fillStyle = PALETTE_ICONES[ligne[x]];
      siffletCtx.fillRect(x, y, 1, 1);
    }
  });
}

// humeur passagère (content après un achat, déçu quand c'est trop cher), clignements et langue au repos
function humeur(visage, duree) {
  humeurSifflet = visage;
  finHumeurSifflet = performance.now() + (duree || 1800);
  dessinerSifflet(visage);
  const sifflet = document.getElementById('siffletZone');
  sifflet.classList.remove('saute', 'secoue');
  void sifflet.offsetWidth; // relance l'animation
  if (visage === 'content') sifflet.classList.add('saute');
  if (visage === 'decu') sifflet.classList.add('secoue');
}

setInterval(() => {
  if (!menuBuffsOuvert) return;
  const now = performance.now();
  if (humeurSifflet !== 'repos' && now < finHumeurSifflet) return;
  humeurSifflet = 'repos';
  if (now > finClignement && Math.random() < 0.08) {
    finClignement = now + 160;
    dessinerSifflet(Math.random() < 0.4 ? 'langue' : 'cligne');
  } else if (now > finClignement) {
    dessinerSifflet('repos');
  }
}, 120);

// toucher Sifflet le fait réagir ; sans rien faire un moment, il fait la conversation
let dernierBavardage = 0;
document.getElementById('sifflet').addEventListener('click', () => {
  messageBoutique(repliqueSifflet('chatouille'));
  humeur(Math.random() < 0.5 ? 'content' : 'langue', 1200);
  dernierBavardage = performance.now();
});

setInterval(() => {
  if (!menuBuffsOuvert || !boutiqueModifiable()) return;
  const now = performance.now();
  if (now - dernierBavardage < 14000) return;
  dernierBavardage = now;
  messageBoutique(repliqueSifflet('bavardage'));
  humeur('langue', 900);
}, 1000);

// --- Sons de caisse ---
function sonBoutique(notes, type) {
  if (isMuted) return;
  const ctx = getAudioCtx();
  notes.forEach(([freq, decalage, duree]) => {
    const debut = ctx.currentTime + decalage;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, debut);
    gain.gain.setValueAtTime(0.001, debut);
    gain.gain.linearRampToValueAtTime(0.1, debut + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, debut + duree);
    osc.connect(gain);
    gain.connect(sortieAudio);
    osc.start(debut);
    osc.stop(debut + duree);
  });
}
const sonCaisse = () => sonBoutique([[1975.5, 0, 0.08], [2637, 0.07, 0.35]], 'square');
const sonRefus = () => sonBoutique([[220, 0, 0.12], [174.6, 0.1, 0.22]], 'sawtooth');

// --- Contenu des étagères ---
const CATEGORIES_BOUTIQUE = [
  {cle: 'ameliorations', nom: 'Améliorations'},
  {cle: 'buffs', nom: 'Buffs de la pomme bleue'},
  {cle: 'capacites', nom: 'Capacités'},
  {cle: 'themes', nom: 'Thèmes'},
  {cle: 'serpents', nom: 'Skins du serpent'},
  {cle: 'tourelles', nom: 'Tourelles'},
  {cle: 'skins', nom: 'Skins d\'ennemis'}
];
const ICONES_THEMES = {neon: '💡', espace: '🔭', lave: '🌋', ocean: '🐢', aurore: '❄️', foret: '🌱', desert: '🧭', synthwave: '📼', halloween: '🎃'};
const ICONES_SKINS = {urchin: '🦔', ghost: '👻', pixel: '🕹️', slime: '🟢', bat: '🦇', jelly: '🪼', eye: '👁️', drone: '🤖',
  spider: '🕷️', crab: '🦀', pumpkin: '🎃', mushroom: '🍄'};

// nom affiché des thèmes et skins : texte de leur bouton dans le menu ☰, sans l'emoji
document.querySelectorAll('.skin-btn, .theme-btn').forEach(b => {
  b.dataset.nom = b.textContent.replace(/^[^\p{L}]+/u, '').trim();
});

// achats et réglages seulement entre deux parties (avant le départ ou après la fin)
function boutiqueModifiable() {
  return modeDev || ((waitingToStart || gameOver) && !tutoActif() && !enEcranInvite());
}

function texteEcailles(n) {
  return '🪙 ' + n.toLocaleString('fr-FR');
}

function messageBoutique(texte) {
  boutiqueMessageEl.textContent = texte;
  if (typeof remplacerEmojis === 'function') remplacerEmojis(boutiqueMessageEl);
}

// valeur de l'effet d'une amélioration au niveau n (arrondie pour l'affichage)
function effetAmelioration(cle, n) {
  return Math.round(reglagesProgression.ameliorations[cle].effet * n * 100) / 100;
}

// L'état d'un objet, recalculé à chaque affichage :
// niveau / max (améliorations), verrouille, actif, prix (null si rien à acheter), detail (lignes de la fiche),
// basculer (fonction ou null), texteBasculer, replique (ce que dit Sifflet quand on le choisit)
function definirObjets() {
  Object.keys(reglagesProgression.ameliorations).forEach(cle => {
    const t = textesAmeliorations[cle];
    objetsBoutique['amelioration:' + cle] = {categorie: 'ameliorations', icone: t.icone, nom: t.nom, etat: () => {
      const max = reglagesProgression.ameliorations[cle].prix.length;
      const n = niveauAchete(cle);
      const prix = prixProchainNiveau(cle);
      const actif = n > 0 && !progression.inactifs.includes(cle);
      const detail = [n > 0 ? 'Actuel : ' + t.detail(effetAmelioration(cle, n)) : 'Pas encore acheté'];
      if (prix !== null) detail.push('Niveau ' + (n + 1) + ' : ' + t.detail(effetAmelioration(cle, n + 1)));
      return {niveau: n, max, verrouille: n === 0, actif, prix, detail,
        acheter: () => acheterAmelioration(cle), quoi: t.nom + ' niveau ' + (n + 1),
        basculer: n > 0 ? () => { basculerAmelioration(cle); boutiqueAChange = true; } : null,
        texteBasculer: actif ? 'Couper' : 'Activer',
        replique: prix === null ? repliqueSifflet('ameliorationMax') : repliqueSifflet('amelioration', {nom: t.nom, niveau: n + 1})};
    }};
  });

  buffTypes.forEach(type => {
    const d = buffDescriptions[type];
    objetsBoutique['buff:' + type] = {categorie: 'buffs', icone: d.icon, nom: d.nom, etat: () => {
      const debloque = contenuDebloque('buff', type);
      const prix = debloque ? null : prixContenu('buff', type);
      const actif = debloque && buffsActifs.includes(type);
      return {verrouille: !debloque, actif, prix, detail: [texteAvecDureeBuff(d.detail, type)],
        acheter: () => acheterContenu('buff', type), quoi: d.nom,
        basculer: debloque ? () => basculerBuff(type) : null,
        texteBasculer: actif ? 'Laisser à la maison' : 'Emporter',
        replique: debloque ? repliqueSifflet('possede', {nom: d.nom}) : repliqueSifflet('contenu', {nom: d.nom, prix})};
    }};
  });

  ['bouclier', 'sprint'].forEach(cle => {
    const d = capaciteDescriptions[cle];
    objetsBoutique['capacite:' + cle] = {categorie: 'capacites', icone: d.icon, nom: d.nom, etat: () => ({
      actif: !!capacitesActives[cle], prix: null, detail: [d.detail],
      basculer: () => basculerCapacite(cle), texteBasculer: capacitesActives[cle] ? 'Couper' : 'Activer',
      replique: repliqueSifflet('capacite')
    })};
  });

  document.querySelectorAll('.theme-btn').forEach(tb => {
    const theme = tb.dataset.theme;
    const nom = tb.dataset.nom;
    objetsBoutique['theme:' + theme] = {categorie: 'themes', icone: ICONES_THEMES[theme] || '🎨', nom, etat: () => {
      const debloque = contenuDebloque('theme', theme);
      const prix = debloque ? null : prixContenu('theme', theme);
      const actuel = theme === currentThemeName;
      return {verrouille: !debloque, actif: actuel, prix,
        detail: [!debloque ? 'Un décor de jeu à acheter' : actuel ? 'C\'est le thème de ta partie' : 'Un décor de jeu à toi'],
        acheter: () => acheterContenu('theme', theme), quoi: 'thème ' + nom,
        basculer: debloque && !actuel ? () => applyTheme(theme) : null, texteBasculer: 'Jouer avec',
        replique: debloque ? repliqueSifflet('theme', {nom}) : repliqueSifflet('contenu', {nom, prix})};
    }};
  });

  Object.keys(skinsSerpent).forEach(cle => {
    const s = skinsSerpent[cle];
    objetsBoutique['serpent:' + cle] = {categorie: 'serpents', icone: s.icone, nom: s.nom, etat: () => {
      const debloque = contenuDebloque('serpent', cle);
      const prix = debloque ? null : prixContenu('serpent', cle);
      const actuel = cle === cleSkinJoueur({numero: 0});
      return {verrouille: !debloque, actif: actuel, prix,
        detail: [s.detail, !debloque ? 'Un look pour ton serpent, à acheter' : actuel ? 'C\'est le look de ton serpent'
          : 'Un look à toi'],
        // acheté : le serpent le porte tout de suite
        acheter: () => acheterContenu('serpent', cle) && (choisirSkinSerpent(cle) || true), quoi: 'skin ' + s.nom,
        basculer: debloque && !actuel ? () => choisirSkinSerpent(cle) : null, texteBasculer: 'Jouer avec',
        replique: debloque ? repliqueSifflet('serpent', {nom: s.nom}) : repliqueSifflet('contenu', {nom: s.nom, prix})};
    }};
  });

  Object.keys(skinsTourelle).forEach(cle => {
    const t = skinsTourelle[cle];
    objetsBoutique['tourelle:' + cle] = {categorie: 'tourelles', icone: t.icone, nom: t.nom, etat: () => {
      const debloque = contenuDebloque('tourelle', cle);
      const prix = debloque ? null : prixContenu('tourelle', cle);
      const actuel = cle === cleTourelleJoueur({numero: 0});
      return {verrouille: !debloque, actif: actuel, prix,
        detail: [t.detail, !debloque ? 'Une tourelle pour ton serpent, à acheter' : actuel ? 'C\'est la tourelle de ton serpent'
          : 'Une tourelle à toi'],
        // achetée : le serpent la porte tout de suite
        acheter: () => acheterContenu('tourelle', cle) && (choisirSkinTourelle(cle) || true), quoi: 'tourelle ' + t.nom,
        basculer: debloque && !actuel ? () => choisirSkinTourelle(cle) : null, texteBasculer: 'Jouer avec',
        replique: debloque ? repliqueSifflet('tourelle', {nom: t.nom}) : repliqueSifflet('contenu', {nom: t.nom, prix})};
    }};
  });

  document.querySelectorAll('.skin-btn').forEach(sb => {
    const skin = sb.dataset.skin;
    const nom = sb.dataset.nom;
    objetsBoutique['skin:' + skin] = {categorie: 'skins', icone: ICONES_SKINS[skin] || '👾', nom, etat: () => {
      const debloque = contenuDebloque('skin', skin);
      const succes = succesParId[reglagesProgression.skinsParSucces[skin]];
      const actuel = skin === enemySkin;
      return {verrouille: !debloque, actif: actuel, prix: null,
        detail: [!debloque && succes ? '🔒 Succès « ' + succes.nom + ' » : ' + succes.detail
          : actuel ? 'Ce sont les ennemis de ta partie' : 'Des ennemis à ce look'],
        basculer: debloque && !actuel ? () => sb.click() : null, texteBasculer: 'Jouer contre',
        replique: !debloque && succes ? repliqueSifflet('skinVerrouille', {succes: succes.nom}) : repliqueSifflet('skin')};
    }};
  });
}

function construireMenuBuffs() {
  definirObjets();
  etageresEl.innerHTML = '';
  CATEGORIES_BOUTIQUE.forEach(cat => {
    const etagere = document.createElement('section');
    etagere.className = 'etagere';
    etagere.dataset.categorie = cat.cle;
    etagere.innerHTML = '<h3 class="etiquette"></h3><div class="etagere-objets"></div>';
    etagere.querySelector('.etiquette').textContent = cat.nom;
    const rangee = etagere.querySelector('.etagere-objets');
    Object.keys(objetsBoutique).filter(cle => objetsBoutique[cle].categorie === cat.cle).forEach(cle => {
      const o = objetsBoutique[cle];
      const btn = document.createElement('button');
      btn.className = 'objet';
      btn.dataset.cle = cle;
      btn.title = o.nom;
      btn.innerHTML = '<span class="objet-niveau"></span><span class="objet-icone"></span><span class="objet-pips"></span>' +
        '<span class="objet-prix"></span><span class="objet-cadenas">🔒</span>';
      btn.querySelector('.objet-icone').innerHTML = htmlIconeBoutique(cle, o.icone);
      btn.addEventListener('click', () => choisirObjet(cle, true));
      rangee.appendChild(btn);
    });
    etageresEl.appendChild(etagere);
  });
  if (typeof remplacerEmojis === 'function') remplacerEmojis(etageresEl);

  // ?dev : de quoi tester un réglage en quelques secondes
  const devEl = document.getElementById('boutiqueDev');
  devEl.innerHTML = '';
  if (modeDev) {
    devEl.innerHTML = '<p>🧪 Mode dev : progression à part, tout est débloqué, pas de succès.</p>' +
      '<button id="devEcailles">+1 000 🪙</button><button id="devZero">Remise à zéro</button>';
    document.getElementById('devEcailles').addEventListener('click', () => {
      ajouterEcailles(1000);
      sauverProgression();
      rafraichirMenuBuffs();
    });
    document.getElementById('devZero').addEventListener('click', () => {
      progression = progressionVide();
      progression.migre = true;
      sauverProgression();
      boutiqueAChange = true;
      rafraichirMenuBuffs();
    });
  }
  boutiqueConstruite = true;
  dessinerSifflet('repos');
  rafraichirMenuBuffs();
}

// pose un objet sur le comptoir ; parler = Sifflet le commente
function choisirObjet(cle, parler) {
  if (!objetsBoutique[cle]) return;
  objetChoisi = cle;
  rafraichirMenuBuffs();
  if (parler) {
    messageBoutique(boutiqueModifiable() ? repliqueObjet(cle) : repliqueSifflet('lectureSeule'));
    humeur('repos');
  }
}

// pièces qui volent du solde vers le comptoir
function piecesQuiVolent() {
  const depart = document.getElementById('boutiqueSolde').getBoundingClientRect();
  const arrivee = document.getElementById('boutiqueFiche').getBoundingClientRect();
  for (let i = 0; i < 6; i++) {
    const piece = document.createElement('span');
    piece.className = 'piece-vol';
    piece.innerHTML = htmlIcone('🪙');
    piece.style.left = (depart.left + depart.width / 2) + 'px';
    piece.style.top = (depart.top + depart.height / 2) + 'px';
    piece.style.setProperty('--dx', (arrivee.left + arrivee.width / 2 - depart.left - depart.width / 2 + (Math.random() - 0.5) * 80) + 'px');
    piece.style.setProperty('--dy', (arrivee.top + 20 - depart.top - depart.height / 2) + 'px');
    piece.style.animationDelay = (i * 50) + 'ms';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 900 + i * 50);
  }
}

// achat commun : vérifie le solde, Sifflet réagit
function payer(prix, faire, quoi) {
  if (prix === null) return;
  if (progression.ecailles < prix) {
    messageBoutique(repliqueSifflet('tropCher', {manque: (prix - progression.ecailles).toLocaleString('fr-FR')}) +
      ' (' + quoi + ')');
    humeur('decu');
    sonRefus();
    return;
  }
  if (faire()) {
    boutiqueAChange = true;
    sonCaisse();
    piecesQuiVolent();
    humeur('content', 2200);
    messageBoutique('✅ ' + quoi + ' ! ' + repliqueSifflet('achat'));
    const objet = etageresEl.querySelector('.objet[data-cle="' + objetChoisi + '"]');
    if (objet) {
      objet.classList.remove('achete');
      void objet.offsetWidth;
      objet.classList.add('achete');
    }
  }
}

ficheAcheterEl.addEventListener('click', () => {
  if (!boutiqueModifiable()) return messageBoutique(repliqueSifflet('lectureSeule'));
  const e = objetsBoutique[objetChoisi].etat();
  if (typeof e.prix === 'number') payer(e.prix, e.acheter, e.quoi);
  rafraichirMenuBuffs();
});
ficheBasculerEl.addEventListener('click', () => {
  if (!boutiqueModifiable()) return messageBoutique(repliqueSifflet('lectureSeule'));
  const o = objetsBoutique[objetChoisi];
  const e = o.etat();
  if (e.basculer) e.basculer();
  rafraichirMenuBuffs();
  // buffs, améliorations, capacités : Sifflet commente ce qui part ou reste
  if (e.basculer && !['themes', 'serpents', 'tourelles', 'skins'].includes(o.categorie)) {
    messageBoutique(repliqueSifflet(o.etat().actif ? 'emporter' : 'laisser', {nom: o.nom}));
  }
});

function basculerCapacite(cle) {
  capacitesActives[cle] = !capacitesActives[cle];
  sauverCapacites();
  if (cle === 'sprint' && !capacitesActives.sprint) joueurs.forEach(j => arreterBoost(j));
  if (cle === 'bouclier' && !capacitesActives.bouclier) joueurs.forEach(j => j.shieldActiveUntil = 0);
}

function basculerBuff(type) {
  if (buffsActifs.includes(type)) {
    buffsActifs = buffsActifs.filter(t => t !== type);
  } else {
    buffsActifs = buffTypes.filter(t => t === type || buffsActifs.includes(t));
  }
  sauverBuffsActifs();
  // une pomme bleue déjà sur le terrain avec un buff désactivé change de buff (ou disparaît s'il n'en reste aucun)
  blueApples = blueApples.filter(pomme => {
    if (buffsDisponibles().includes(pomme.buffType)) return true;
    const remplacant = tirerBuffAleatoire();
    if (remplacant) pomme.buffType = remplacant;
    return !!remplacant;
  });
}

// pastilles de niveau (pleines jusqu'au niveau acheté)
function pipsNiveau(el, n, max) {
  el.innerHTML = '';
  for (let i = 0; i < max; i++) {
    const p = document.createElement('i');
    if (i < n) p.className = 'plein';
    el.appendChild(p);
  }
}

function rafraichirMenuBuffs() {
  if (!boutiqueConstruite) return;
  const modifiable = boutiqueModifiable();
  document.getElementById('boutiqueSolde').innerHTML = htmlIcone('🪙') + ' ' + progression.ecailles.toLocaleString('fr-FR');
  buffMenuEl.classList.toggle('lecture-seule', !modifiable);

  // étagères
  etageresEl.querySelectorAll('.objet').forEach(btn => {
    const o = objetsBoutique[btn.dataset.cle];
    const e = o.etat();
    const aChoisir = ['themes', 'serpents', 'tourelles', 'skins'].includes(o.categorie);
    btn.classList.toggle('verrouille', !!e.verrouille);
    btn.classList.toggle('cadenas', !!e.verrouille && !e.max); // pas encore à toi (une amélioration au niveau 0 n'a pas de cadenas)
    btn.classList.toggle('actif', !e.verrouille && !!e.actif);
    btn.classList.toggle('coupe', !e.verrouille && !e.actif && !aChoisir);
    btn.classList.toggle('choisi', btn.dataset.cle === objetChoisi);
    btn.classList.toggle('trop-cher', typeof e.prix === 'number' && progression.ecailles < e.prix);
    const niveau = btn.querySelector('.objet-niveau');
    const pips = btn.querySelector('.objet-pips');
    const prix = btn.querySelector('.objet-prix');
    if (e.max) {
      niveau.textContent = e.niveau >= e.max ? 'MAX' : 'Niv. ' + e.niveau;
      niveau.classList.toggle('max', e.niveau >= e.max);
      pipsNiveau(pips, e.niveau, e.max);
    } else {
      niveau.textContent = '';
      pips.innerHTML = '';
    }
    prix.classList.toggle('visible', typeof e.prix === 'number');
    if (typeof e.prix === 'number') prix.textContent = e.prix.toLocaleString('fr-FR');
    btn.setAttribute('aria-pressed', e.actif ? 'true' : 'false');
    btn.setAttribute('aria-label', o.nom + (e.max ? ', niveau ' + e.niveau + ' sur ' + e.max : '') +
      (typeof e.prix === 'number' ? ', ' + e.prix + ' Écailles' : ''));
  });

  // comptoir : la fiche de l'objet choisi
  const o = objetsBoutique[objetChoisi];
  const e = o.etat();
  const aChoisir = ['themes', 'serpents', 'tourelles', 'skins'].includes(o.categorie);
  document.getElementById('ficheIcone').innerHTML = htmlIconeBoutique(objetChoisi, o.icone);
  document.getElementById('ficheNom').textContent = o.nom;
  const niveauEl = document.getElementById('ficheNiveau');
  niveauEl.classList.toggle('niveaux', !!e.max);
  if (e.max) {
    niveauEl.innerHTML = '<span class="fiche-niv"></span><span class="objet-pips"></span>';
    niveauEl.querySelector('.fiche-niv').textContent = e.niveau >= e.max ? 'Niveau ' + e.niveau + ' / ' + e.max + ' · MAX'
      : 'Niveau ' + e.niveau + ' / ' + e.max;
    pipsNiveau(niveauEl.querySelector('.objet-pips'), e.niveau, e.max);
  } else {
    niveauEl.textContent = e.verrouille ? '🔒 Pas encore à toi' : aChoisir ? (e.actif ? '✔️ Dans ta partie' : 'À toi')
      : e.actif ? '✔️ Emporté dans tes parties' : 'Laissé à la maison';
  }
  const detailEl = document.getElementById('ficheDetail');
  detailEl.innerHTML = '';
  e.detail.forEach(l => { const d = document.createElement('span'); d.textContent = l; detailEl.appendChild(d); });
  const peutAcheter = typeof e.prix === 'number';
  const auMax = !!e.max && e.niveau >= e.max;
  ficheAcheterEl.style.display = peutAcheter || auMax ? '' : 'none';
  ficheAcheterEl.textContent = peutAcheter ? 'Acheter ' + texteEcailles(e.prix) : 'Niveau max';
  ficheAcheterEl.classList.toggle('max', !peutAcheter);
  ficheAcheterEl.classList.toggle('trop-cher', peutAcheter && progression.ecailles < e.prix);
  ficheBasculerEl.style.display = e.basculer ? '' : 'none';
  ficheBasculerEl.textContent = e.texteBasculer || '';
  ficheBasculerEl.classList.toggle('couper', !!e.actif && !aChoisir);
  if (typeof remplacerEmojis === 'function') remplacerEmojis(document.getElementById('boutiqueFiche'));

  // boutons tactiles : bouclier masqué, Boost ne sert plus qu'à démarrer
  document.getElementById('touchBouclier').classList.toggle('capacite-off', !capacitesActives.bouclier);
  document.getElementById('touchBoost').textContent = capacitesActives.sprint ? '🚀 Boost' : '▶️ Démarrer';
  const dispo = buffsDisponibles();
  document.querySelectorAll('.legend-buffs li[data-buff]').forEach(li => {
    li.classList.toggle('buff-desactive', !dispo.includes(li.dataset.buff));
  });
  buffMenuAvertissementEl.textContent = dispo.length ? '' : '⚠️ Aucun buff emporté : la pomme bleue n\'apparaîtra plus';
  buffMenuBtn.textContent = '🛒 Boutique ' + texteEcailles(progression.ecailles);
  buffMenuBtn.classList.toggle('nouveau', !progression.boutiqueVue && progression.ecailles > 0);
  document.getElementById('boutiqueJeuSolde').textContent = progression.ecailles.toLocaleString('fr-FR');
  boutiqueJeuBtn.classList.toggle('nouveau', !progression.boutiqueVue && progression.ecailles > 0);
  majVerrous();
}

// menu ☰ : thèmes et skins verrouillés grisés, avec ce qu'il faut faire en bulle d'aide
function majVerrous() {
  majBoutonsSkinSerpent();
  majBoutonsSkinTourelle();
  document.querySelectorAll('.theme-btn').forEach(b => {
    const ok = contenuDebloque('theme', b.dataset.theme);
    b.classList.toggle('verrouille', !ok);
    b.title = ok ? '' : 'À acheter dans la Boutique (' + prixContenu('theme', b.dataset.theme) + ' Écailles)';
  });
  document.querySelectorAll('.skin-btn').forEach(b => {
    const ok = contenuDebloque('skin', b.dataset.skin);
    const succes = succesParId[reglagesProgression.skinsParSucces[b.dataset.skin]];
    b.classList.toggle('verrouille', !ok);
    b.title = ok || !succes ? '' : 'Se débloque avec le succès « ' + succes.nom + ' »';
  });
}

// --- Navigation au clavier et à la manette : vers le bouton le plus proche dans la direction ---
function boutonsMenuBuffs() {
  return Array.from(buffMenuEl.querySelectorAll('#buffMenuFermer, #boutiqueDev button, .objet, #boutiqueFiche button, #buffMenuActions button'))
    .filter(b => b.style.display !== 'none' && b.offsetParent !== null);
}

function majFocusManette() {
  const boutons = boutonsMenuBuffs();
  if (!boutons.length) return;
  focusMenuManette = (focusMenuManette + boutons.length) % boutons.length;
  boutons.forEach((b, i) => b.classList.toggle('focus-manette', modeEntree === 'manette' && i === focusMenuManette));
  const b = boutons[focusMenuManette];
  if (b && b.scrollIntoView) b.scrollIntoView({block: 'nearest'});
  // passer sur un objet le pose sur le comptoir
  if (b && b.classList.contains('objet') && b.dataset.cle !== objetChoisi) choisirObjet(b.dataset.cle, true);
}

function naviguerBoutique(dx, dy) {
  const boutons = boutonsMenuBuffs();
  const courant = document.activeElement && boutons.includes(document.activeElement) && modeEntree !== 'manette'
    ? boutons.indexOf(document.activeElement) : focusMenuManette;
  const actuel = boutons[courant] || boutons[0];
  if (!actuel) return;
  const a = actuel.getBoundingClientRect();
  const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
  let meilleur = boutons.indexOf(actuel), score = Infinity;
  // d'un objet des étagères, on reste sur les étagères tant qu'il y en a un dans cette direction
  const versObjets = actuel.classList.contains('objet');
  const chercher = seulementObjets => boutons.forEach((b, i) => {
    if (b === actuel || (seulementObjets && !b.classList.contains('objet'))) return;
    const r = b.getBoundingClientRect();
    const bx = r.left + r.width / 2, by = r.top + r.height / 2;
    const avance = dx ? (bx - ax) * dx : (by - ay) * dy;
    const ecart = dx ? Math.abs(by - ay) : Math.abs(bx - ax);
    if (avance <= 4) return;
    const s = dy ? avance * 3 + ecart : avance + ecart * 3; // en vertical : la rangée la plus proche d'abord
    if (s < score) { score = s; meilleur = i; }
  });
  chercher(versObjets);
  if (versObjets && score === Infinity) chercher(false);
  focusMenuManette = meilleur;
  majFocusManette();
  const b = boutonsMenuBuffs()[focusMenuManette];
  if (b && modeEntree !== 'manette') b.focus();
}

// A à la manette : sur un objet, va sur le premier bouton utile de la fiche ; ailleurs, appuie sur le bouton
function validerBoutonBoutique() {
  const b = boutonsMenuBuffs()[focusMenuManette];
  if (!b) return;
  if (b.classList.contains('objet')) {
    choisirObjet(b.dataset.cle, true);
    const cible = [ficheAcheterEl, ficheBasculerEl].find(x => x.style.display !== 'none' && !x.classList.contains('max'));
    if (cible) focusMenuManette = boutonsMenuBuffs().indexOf(cible);
    majFocusManette();
    return;
  }
  b.click();
  majFocusManette();
}

// cle : objet à montrer en ouvrant (ex. 'theme:lave'), sinon le dernier choisi
function ouvrirMenuBuffs(cle) {
  if (menuBuffsOuvert) return;
  menuBuffsOuvert = true;
  menuAMisEnPause = false;
  dernierBavardage = performance.now();
  boutiqueAChange = false;
  if (!isPaused && !waitingToStart && !countdownActive && !gameOver) {
    togglePause();
    menuAMisEnPause = true;
  }
  joueurs.forEach(j => arreterBoost(j));
  if (!progression.boutiqueVue && boutiqueModifiable()) {
    progression.boutiqueVue = true;
    sauverProgression();
  }
  const montre = typeof cle === 'string' && objetsBoutique[cle];
  if (montre) objetChoisi = cle;
  buffMenuEl.classList.add('ouvert');
  rafraichirMenuBuffs();
  messageBoutique(!boutiqueModifiable() ? repliqueSifflet('lectureSeule')
    : montre ? repliqueObjet(cle) : repliqueAccueil());
  humeur('repos');
  const objet = etageresEl.querySelector('.objet[data-cle="' + objetChoisi + '"]');
  focusMenuManette = Math.max(0, boutonsMenuBuffs().indexOf(objet));
  majFocusManette();
}

function fermerMenuBuffs() {
  if (!menuBuffsOuvert) return;
  menuBuffsOuvert = false;
  buffMenuEl.classList.remove('ouvert');
  if (document.activeElement) document.activeElement.blur(); // évite qu'Espace ne réactive un bouton du menu
  if (menuAMisEnPause && isPaused) togglePause();
  menuAMisEnPause = false;
  // partie pas encore lancée : on la prépare à nouveau pour appliquer les achats (cœurs de départ...)
  if (boutiqueAChange && waitingToStart && !countdownActive && !tutoActif()) init();
  boutiqueAChange = false;
}

[buffMenuBtn, boutiqueJeuBtn].forEach(b => b.addEventListener('click', () => {
  b.blur();
  ouvrirMenuBuffs();
}));
// le 🛒 du plateau se montre aussi sur mobile, mais seulement entre deux parties
setInterval(() => {
  document.body.classList.toggle('entre-parties', !!((waitingToStart || gameOver) && !countdownActive));
}, 250);
document.getElementById('buffMenuFermer').addEventListener('click', fermerMenuBuffs);
document.getElementById('buffMenuTout').addEventListener('click', () => {
  if (!boutiqueModifiable()) return messageBoutique(repliqueSifflet('lectureSeule'));
  buffsActifs = buffTypes.slice();
  sauverBuffsActifs();
  progression.inactifs = [];
  sauverProgression();
  capacitesActives = {bouclier: true, sprint: true, collisionJoueurs: capacitesActives.collisionJoueurs};
  sauverCapacites();
  boutiqueAChange = true;
  rafraichirMenuBuffs();
  messageBoutique(repliqueSifflet('toutActiver'));
  humeur('content');
});
document.getElementById('boutiqueRembourser').addEventListener('click', () => {
  if (!boutiqueModifiable()) return messageBoutique(repliqueSifflet('lectureSeule'));
  const rendu = rembourserAmeliorations();
  boutiqueAChange = true;
  messageBoutique(rendu ? '↺ ' + repliqueSifflet('rembourse', {prix: rendu.toLocaleString('fr-FR')})
    : repliqueSifflet('rienARembourser'));
  rafraichirMenuBuffs();
});
// clic sur le fond sombre = fermer
buffMenuEl.addEventListener('click', (e) => {
  dernierBavardage = performance.now();
  if (e.target === buffMenuEl) fermerMenuBuffs();
});
// construite au démarrage (js/19-demarrage.js), une fois les succès chargés
