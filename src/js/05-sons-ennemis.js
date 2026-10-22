// --- Sons des ennemis : un bruit de mort par skin d'ennemi, et un son quand on touche le boss ---
// Sons légers : deux ou trois oscillateurs au plus, et un seul bruit blanc gardé en mémoire (rien n'est recalculé).
// Quand beaucoup d'ennemis meurent d'un coup (buff explosion, bouclier), les sons sont espacés pour ne pas saturer.

let bruitBlancCache = null;
let dernierSonMort = 0;
let debutFenetreMorts = 0;
let sonsMortFenetre = 0;
let dernierSonBoss = 0;

// une seconde de bruit blanc, créée une seule fois
function bruitBlanc(ctx) {
  if (!bruitBlancCache || bruitBlancCache.sampleRate !== ctx.sampleRate) {
    const taille = ctx.sampleRate;
    bruitBlancCache = ctx.createBuffer(1, taille, ctx.sampleRate);
    const data = bruitBlancCache.getChannelData(0);
    for (let i = 0; i < taille; i++) data[i] = Math.random() * 2 - 1;
  }
  return bruitBlancCache;
}

// note qui glisse de f0 à f1, avec une attaque courte puis un fondu
function noteGlissee(type, f0, f1, debut, duree, volume) {
  const ctx = getAudioCtx();
  const t = ctx.currentTime + debut;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + duree);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  osc.connect(gain);
  gain.connect(sortieAudio);
  osc.start(t);
  osc.stop(t + duree + 0.02);
}

// bref souffle de bruit filtré (le filtre peut glisser de f0 à f1)
function souffle(typeFiltre, f0, f1, debut, duree, volume) {
  const ctx = getAudioCtx();
  const t = ctx.currentTime + debut;
  const source = ctx.createBufferSource();
  source.buffer = bruitBlanc(ctx);
  const filtre = ctx.createBiquadFilter();
  filtre.type = typeFiltre;
  filtre.frequency.setValueAtTime(f0, t);
  filtre.frequency.exponentialRampToValueAtTime(f1, t + duree);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  source.connect(filtre);
  filtre.connect(gain);
  gain.connect(sortieAudio);
  source.start(t, Math.random() * 0.5, duree + 0.02);
}

// mort d'un ennemi normal : chaque skin a son bruit (h = hauteur, pour varier un peu à chaque fois)
const sonsMortEnnemi = {
  // oursin : les piquants éclatent (craquement sec et aigu)
  urchin(h) {
    souffle('highpass', 3000, 6000, 0, 0.09, 0.3);
    noteGlissee('square', 900 * h, 180 * h, 0, 0.1, 0.07);
  },
  // fantôme : long « ouuuh » qui s'éteint en descendant
  ghost(h) {
    noteGlissee('sine', 720 * h, 220 * h, 0, 0.38, 0.12);
    noteGlissee('sine', 745 * h, 230 * h, 0.02, 0.36, 0.06);
  },
  // envahisseur pixel : petit arpège 8 bits qui descend
  pixel(h) {
    [988, 740, 494, 247].forEach((f, i) => noteGlissee('square', f * h, f * h, i * 0.045, 0.05, 0.06));
  },
  // slime : « splotch » mouillé
  slime(h) {
    noteGlissee('sine', 340 * h, 70 * h, 0, 0.16, 0.25);
    souffle('bandpass', 900, 300, 0, 0.12, 0.35);
  },
  // chauve-souris : deux couinements très aigus
  bat(h) {
    noteGlissee('triangle', 2600 * h, 1700 * h, 0, 0.06, 0.08);
    noteGlissee('triangle', 3000 * h, 1900 * h, 0.07, 0.07, 0.07);
  },
  // méduse : trois bulles qui montent
  jelly(h) {
    [420, 620, 900].forEach((f, i) => noteGlissee('sine', f * h, f * 1.6 * h, i * 0.06, 0.07, 0.12));
  },
  // œil : « squish » puis petit ping de verre
  eye(h) {
    souffle('bandpass', 1800, 700, 0, 0.1, 0.4);
    noteGlissee('sine', 1500 * h, 1300 * h, 0.05, 0.15, 0.06);
  },
  // drone : court-circuit électrique qui grésille et s'effondre
  drone(h) {
    noteGlissee('sawtooth', 1400 * h, 90 * h, 0, 0.2, 0.06);
    souffle('highpass', 5000, 2500, 0, 0.14, 0.18);
  },
  // araignée : petites pattes qui cliquettent puis une chute
  spider(h) {
    for (let i = 0; i < 4; i++) souffle('highpass', 4000, 4000, i * 0.028, 0.02, 0.3);
    noteGlissee('triangle', 400 * h, 120 * h, 0.1, 0.1, 0.1);
  },
  // crabe : carapace qui craque (deux clacs) et un coup sourd
  crab(h) {
    souffle('bandpass', 2400, 2000, 0, 0.04, 0.6);
    souffle('bandpass', 2000, 1600, 0.05, 0.04, 0.5);
    noteGlissee('sine', 160 * h, 60 * h, 0, 0.15, 0.25);
  },
  // citrouille : « bonk » creux, comme une calebasse qu'on cogne
  pumpkin(h) {
    noteGlissee('triangle', 240 * h, 120 * h, 0, 0.22, 0.25);
    noteGlissee('sine', 480 * h, 240 * h, 0, 0.12, 0.08);
    souffle('lowpass', 800, 200, 0, 0.12, 0.25);
  },
  // champignon : nuage de spores qui s'échappe (pouf) et petit pop
  mushroom(h) {
    souffle('lowpass', 2500, 400, 0, 0.3, 0.3);
    noteGlissee('sine', 500 * h, 950 * h, 0, 0.08, 0.1);
  }
};

function playEnemyDeathSound(e) {
  if (isMuted) return;
  // beaucoup de morts d'un coup : 40 ms au moins entre deux sons, et 4 sons au plus par quart de seconde
  // (2 en mode Performances)
  const maintenant = performance.now();
  if (maintenant - dernierSonMort < 40) return;
  if (maintenant - debutFenetreMorts > 250) { debutFenetreMorts = maintenant; sonsMortFenetre = 0; }
  if (sonsMortFenetre >= (niveauPerf ? 2 : 4)) return;
  sonsMortFenetre++;
  dernierSonMort = maintenant;
  const recette = sonsMortEnnemi[enemySkin];
  if (!recette) return playExplosionSound(); // skin rond d'origine : on garde l'explosion d'avant
  getAudioCtx();
  // ennemi résistant : un peu plus grave ; et une légère variation pour ne pas lasser
  const h = (e && e.maxHp > 1 ? 0.85 : 1) * (0.94 + Math.random() * 0.12);
  recette(h);
}

// boss touché : un coup sourd commun et la « voix » du boss de ce skin, qui monte quand il enrage
const sonsBossTouche = {
  urchin(h) { noteGlissee('square', 320 * h, 200 * h, 0, 0.1, 0.06); souffle('highpass', 3500, 3500, 0, 0.05, 0.15); },
  ghost(h) { noteGlissee('sine', 420 * h, 300 * h, 0, 0.2, 0.12); noteGlissee('sine', 436 * h, 310 * h, 0, 0.2, 0.06); },
  pixel(h) { noteGlissee('square', 330 * h, 330 * h, 0, 0.04, 0.06); noteGlissee('square', 220 * h, 220 * h, 0.045, 0.05, 0.06); },
  slime(h) { noteGlissee('sine', 220 * h, 110 * h, 0, 0.12, 0.2); souffle('bandpass', 700, 300, 0, 0.08, 0.25); },
  bat(h) { noteGlissee('triangle', 1700 * h, 1100 * h, 0, 0.07, 0.08); },
  jelly(h) { noteGlissee('sine', 520 * h, 780 * h, 0, 0.08, 0.12); },
  eye(h) { souffle('bandpass', 1300, 600, 0, 0.08, 0.35); noteGlissee('sine', 600 * h, 480 * h, 0, 0.1, 0.06); },
  drone(h) { noteGlissee('sawtooth', 700 * h, 350 * h, 0, 0.08, 0.05); souffle('bandpass', 4200, 3800, 0, 0.1, 0.3); },
  spider(h) { noteGlissee('triangle', 260 * h, 180 * h, 0, 0.1, 0.12); souffle('highpass', 4000, 4000, 0.03, 0.02, 0.25); },
  crab(h) { souffle('bandpass', 2600, 2200, 0, 0.05, 0.55); noteGlissee('square', 240 * h, 180 * h, 0, 0.07, 0.05); },
  pumpkin(h) { noteGlissee('triangle', 190 * h, 130 * h, 0, 0.15, 0.22); },
  mushroom(h) { souffle('lowpass', 1800, 400, 0, 0.15, 0.25); noteGlissee('sine', 360 * h, 280 * h, 0, 0.1, 0.08); },
  circle(h) { noteGlissee('triangle', 380 * h, 240 * h, 0, 0.1, 0.14); }
};

function playBossHitSound(e) {
  if (isMuted) return;
  const maintenant = performance.now();
  if (maintenant - dernierSonBoss < (niveauPerf ? 110 : 60)) return; // laser et tir auto : pas un son par image
  dernierSonBoss = maintenant;
  getAudioCtx();
  const rage = e && e.maxHp ? 1 - Math.max(0, e.hp / e.maxHp) : 0;
  const h = 1 + rage * 0.35;
  noteGlissee('sine', 130, 60, 0, 0.12, 0.28); // le coup qui porte
  (sonsBossTouche[enemySkin] || sonsBossTouche.circle)(h);
}

// boss vaincu : sa voix, grave et lente, en plus de la grosse explosion
function playBossDeathSound() {
  if (isMuted) return;
  getAudioCtx();
  const recette = sonsMortEnnemi[enemySkin];
  if (!recette) return;
  dernierSonMort = performance.now();
  recette(0.5);
}
