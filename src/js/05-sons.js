// --- Sons (Web Audio API, pas de fichiers externes) ---
let audioCtx = null;
let isMuted = lireOption('muet', false);
let volumeEffets = lireOption('volumeEffets', 100); // 0 à 100, menu ⚙️ Options (js/18-options.js)
let sortieAudio = null; // tous les sons passent par ce gain, réglé par volumeEffets
const boostAudioB64 = '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VVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQZO6A8t01yGMMMzIAAA0gAAABCJSvFUYYTcAAADSAAAAEVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EGTgj/AsAEQoAAAIAAANIAAAAQAAAf4AAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZN2P8AAAf4AAAAgAAA0gAAABAAAB/gAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xBk3Y/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EGTdj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZN2P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xBk3Y/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EGTdj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
let boostAudioBuffer = null;

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function loadBoostSound() {
  const ctx = getAudioCtx();
  ctx.decodeAudioData(base64ToArrayBuffer(boostAudioB64), (buffer) => {
    boostAudioBuffer = buffer;
  }, (err) => {
    console.error('Impossible de décoder le son de boost :', err);
  });
}
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sortieAudio = audioCtx.createGain();
    sortieAudio.connect(audioCtx.destination);
    majVolumeAudio();
    loadBoostSound();
  }
  return audioCtx;
}

// volume perçu à peu près linéaire : le gain suit le carré du curseur (100 = volume d'origine)
function majVolumeAudio() {
  if (sortieAudio) sortieAudio.gain.value = Math.pow(volumeEffets / 100, 2);
}

function playShootSound() {
  if (isMuted) return;
  if (currentThemeName === 'espace') return playTirEspace();
  if (currentThemeName === 'lave') return playTirLave();
  if (currentThemeName === 'ocean') return playTirOcean();
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(sortieAudio);
  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

// espace : « piou » de blaster qui descend, avec un léger vibrato
function playTirEspace() {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1700, t);
  osc.frequency.exponentialRampToValueAtTime(350, t + 0.16);
  lfo.frequency.value = 45;
  lfoGain.gain.value = 60;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
  osc.connect(gain);
  gain.connect(sortieAudio);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + 0.18);
  lfo.stop(t + 0.18);
}

// lave : souffle de boule de feu (bruit filtré qui s'ouvre) + petit coup sourd
function playTirLave() {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;
  const taille = Math.floor(ctx.sampleRate * 0.22);
  const buffer = ctx.createBuffer(1, taille, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < taille; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / taille);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filtre = ctx.createBiquadFilter();
  filtre.type = 'lowpass';
  filtre.frequency.setValueAtTime(400, t);
  filtre.frequency.exponentialRampToValueAtTime(2500, t + 0.08);
  filtre.frequency.exponentialRampToValueAtTime(300, t + 0.22);
  const gain = ctx.createGain();
  gain.gain.value = 0.35;
  source.connect(filtre);
  filtre.connect(gain);
  gain.connect(sortieAudio);
  source.start(t);
  const osc = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(140, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
  g2.gain.setValueAtTime(0.18, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
  osc.connect(g2);
  g2.connect(sortieAudio);
  osc.start(t);
  osc.stop(t + 0.14);
}

// océan : « bloup » de bulle, deux petites bulles qui montent
function playTirOcean() {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;
  [[0, 280, 900, 0.14], [0.05, 420, 1300, 0.08]].forEach(([decalage, debut, fin, volume]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(debut, t + decalage);
    osc.frequency.exponentialRampToValueAtTime(fin, t + decalage + 0.07);
    gain.gain.setValueAtTime(0.0001, t + decalage);
    gain.gain.exponentialRampToValueAtTime(volume, t + decalage + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + decalage + 0.09);
    osc.connect(gain);
    gain.connect(sortieAudio);
    osc.start(t + decalage);
    osc.stop(t + decalage + 0.1);
  });
}

function playLaserSound() {
  if (isMuted) return;
  // zap sci-fi aigu et court, distinct du tir classique ; timbre et hauteur selon le monde
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const reglages = {
    neon: ['sawtooth', 1400, 2600],
    espace: ['square', 2200, 900],
    lave: ['sawtooth', 600, 1500],
    ocean: ['triangle', 1000, 2400],
    aurore: ['triangle', 1800, 3200],
    foret: ['sine', 900, 1800],
    desert: ['sawtooth', 700, 1300],
    synthwave: ['square', 1600, 2800],
    halloween: ['sawtooth', 500, 1100]
  }[currentThemeName] || ['sawtooth', 1400, 2600];
  osc.type = reglages[0];
  osc.frequency.setValueAtTime(reglages[1], ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(reglages[2], ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  osc.connect(gain);
  gain.connect(sortieAudio);
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

function playExplosionSound() {
  if (isMuted) return;
  const ctx = getAudioCtx();
  const bufferSize = ctx.sampleRate * 0.2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  noise.connect(gain);
  gain.connect(sortieAudio);
  noise.start();
}

function playHitSound() {
  if (isMuted) return;
  // son court et métallique pour un coup qui blesse sans tuer (ennemi résistant)
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(500, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
  osc.connect(gain);
  gain.connect(sortieAudio);
  osc.start();
  osc.stop(ctx.currentTime + 0.09);
}

// bruit blanc filtré, utilisé par les sons de glace
function jouerBruitFiltre(duree, typeFiltre, frequence, volume) {
  const ctx = getAudioCtx();
  const taille = Math.floor(ctx.sampleRate * duree);
  const buffer = ctx.createBuffer(1, taille, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < taille; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / taille, 2);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filtre = ctx.createBiquadFilter();
  filtre.type = typeFiltre;
  filtre.frequency.value = frequence;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(filtre);
  filtre.connect(gain);
  gain.connect(sortieAudio);
  source.start();
}

// petite note cristalline (deux sinus aigus qui s'éteignent vite)
function jouerTintement(frequence, debut, volume) {
  const ctx = getAudioCtx();
  const t = ctx.currentTime + debut;
  [1, 1.5].forEach((mult, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequence * mult, t);
    gain.gain.setValueAtTime(volume / (i + 1), t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    osc.connect(gain);
    gain.connect(sortieAudio);
    osc.start(t);
    osc.stop(t + 0.16);
  });
}

// tir sur un ennemi gelé qui ne casse pas encore : « tink » de glace
function playIceHitSound() {
  if (isMuted) return;
  jouerTintement(2300 + Math.random() * 300, 0, 0.09);
}

// ennemi gelé détruit par un tir : la glace vole en éclats
function playIceShatterSound() {
  if (isMuted) return;
  jouerBruitFiltre(0.3, 'highpass', 3500, 0.35);
  jouerTintement(2800, 0, 0.06);
  jouerTintement(3400, 0.05, 0.05);
  jouerTintement(2500, 0.1, 0.04);
}

// ennemi gelé écrasé par la tête du serpent : craquement sourd et grave
function playIceCrunchSound() {
  if (isMuted) return;
  const ctx = getAudioCtx();
  const t = ctx.currentTime;
  jouerBruitFiltre(0.22, 'bandpass', 900, 0.6);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.18);
  gain.gain.setValueAtTime(0.35, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  osc.connect(gain);
  gain.connect(sortieAudio);
  osc.start(t);
  osc.stop(t + 0.21);
  jouerTintement(1800, 0.04, 0.04);
}

function estGele(e) {
  return performance.now() < (e.frozenUntil || 0);
}

function playHeartPickupSound() {
  if (isMuted) return;
  // petit carillon chaleureux et ascendant pour la récupération d'un cœur
  const ctx = getAudioCtx();
  const notes = [523.25, 659.25, 783.99]; // Do - Mi - Sol
  notes.forEach((freq, i) => {
    const startTime = ctx.currentTime + i * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
    osc.connect(gain);
    gain.connect(sortieAudio);
    osc.start(startTime);
    osc.stop(startTime + 0.35);
  });
}

function playLoseHeartSound() {
  if (isMuted) return;
  // petite alarme descendante et un peu dure, pour bien marquer la perte d'un cœur
  const ctx = getAudioCtx();
  const notes = [392, 311.13]; // Sol - Mib, chute dissonante
  notes.forEach((freq, i) => {
    const startTime = ctx.currentTime + i * 0.1;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);
    osc.connect(gain);
    gain.connect(sortieAudio);
    osc.start(startTime);
    osc.stop(startTime + 0.18);
  });
}

function playRollbackSound() {
  if (isMuted) return;
  // effet de "rembobinage" : glissando descendant puis remontée rapide
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(700, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.3);
  osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
  osc.connect(gain);
  gain.connect(sortieAudio);
  osc.start();
  osc.stop(ctx.currentTime + 0.55);
}

function playShieldSound() {
  if (isMuted) return;
  // son cristallin et protecteur pour l'activation du bouclier
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(sortieAudio);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}

function playApplePickupSound() {
  if (isMuted) return;
  // petit "pop" satisfaisant et croquant pour la récupération d'une pomme
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(700, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.07);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(sortieAudio);
  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

function playGoldenApplePickupSound() {
  if (isMuted) return;
  // petite fanfare montante pour marquer la grosse récompense de la pomme en or
  const ctx = getAudioCtx();
  const notes = [523.25, 659.25, 783.99, 1046.5]; // Do - Mi - Sol - Do (octave)
  notes.forEach((freq, i) => {
    const startTime = ctx.currentTime + i * 0.07;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
    osc.connect(gain);
    gain.connect(sortieAudio);
    osc.start(startTime);
    osc.stop(startTime + 0.3);
  });
}

function playFreezeSound() {
  if (isMuted) return;
  // son cristallin et froid pour le gel des ennemis
  const ctx = getAudioCtx();
  const notes = [1200, 900, 700];
  notes.forEach((freq, i) => {
    const startTime = ctx.currentTime + i * 0.06;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
    osc.connect(gain);
    gain.connect(sortieAudio);
    osc.start(startTime);
    osc.stop(startTime + 0.4);
  });
}

function playBossWarningSound() {
  if (isMuted) return;
  // alarme grave et répétée, façon sirène d'alerte
  const ctx = getAudioCtx();
  for (let i = 0; i < 3; i++) {
    const startTime = ctx.currentTime + i * 0.35;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, startTime);
    osc.frequency.linearRampToValueAtTime(90, startTime + 0.25);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.22, startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
    osc.connect(gain);
    gain.connect(sortieAudio);
    osc.start(startTime);
    osc.stop(startTime + 0.3);
  }
}

function playEndgameTransitionSound(enemiesPresent) {
  if (isMuted) return;
  // deux notes : montantes si les ennemis reviennent, descendantes s'ils disparaissent
  const ctx = getAudioCtx();
  const notes = enemiesPresent ? [440, 660] : [660, 440];
  notes.forEach((freq, i) => {
    const startTime = ctx.currentTime + i * 0.15;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
    osc.connect(gain);
    gain.connect(sortieAudio);
    osc.start(startTime);
    osc.stop(startTime + 0.35);
  });
}

function playBuffActivateSound() {
  if (isMuted) return;
  // son d'activation générique, énergique, pour les buffs de tourelle / invincibilité / points
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.25);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  osc.connect(gain);
  gain.connect(sortieAudio);
  osc.start();
  osc.stop(ctx.currentTime + 0.35);
}

function playExplosionBuffSound() {
  if (isMuted) return;
  // grosse explosion grave pour le buff qui détruit tous les ennemis
  const ctx = getAudioCtx();
  const bufferSize = ctx.sampleRate * 0.4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1200, ctx.currentTime);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(sortieAudio);
  noise.start();

  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
  oscGain.gain.setValueAtTime(0.3, ctx.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.connect(oscGain);
  oscGain.connect(sortieAudio);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}

// petit « pop » discret quand un ennemi apparaît (limité si plusieurs apparaissent d'un coup)
let dernierSonPop = 0;
function playEnemySpawnSound() {
  if (isMuted || waitingToStart) return;
  const maintenant = performance.now();
  if (maintenant - dernierSonPop < 90) return;
  dernierSonPop = maintenant;
  const ctx = getAudioCtx();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  const base = 420 + Math.random() * 80; // légère variation pour ne pas lasser
  osc.frequency.setValueAtTime(base, t);
  osc.frequency.exponentialRampToValueAtTime(base * 2.3, t + 0.05);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.07, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  osc.connect(gain);
  gain.connect(sortieAudio);
  osc.start(t);
  osc.stop(t + 0.1);
}

function playGameOverSound() {
  if (isMuted) return;
  const ctx = getAudioCtx();
  // petite série de notes descendantes, façon jingle d'arcade classique
  const notes = [392, 349, 330, 262];
  notes.forEach((freq, i) => {
    const startTime = ctx.currentTime + i * 0.16;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
    osc.connect(gain);
    gain.connect(sortieAudio);
    osc.start(startTime);
    osc.stop(startTime + 0.3);
  });
}

function playVictorySound() {
  if (isMuted) return;
  const ctx = getAudioCtx();
  // fanfare montante et triomphante
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((freq, i) => {
    const startTime = ctx.currentTime + i * 0.13;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.22, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
    osc.connect(gain);
    gain.connect(sortieAudio);
    osc.start(startTime);
    osc.stop(startTime + 0.5);
  });
}

function playFireworkPopSound() {
  if (isMuted) return;
  const ctx = getAudioCtx();
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(1500, ctx.currentTime);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(sortieAudio);
  noise.start();
}

function playBoostSound() {
  if (isMuted) return;
  if (!boostAudioBuffer) return; // pas encore décodé, on ignore silencieusement
  const ctx = getAudioCtx();
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = boostAudioBuffer;
  gain.gain.value = 0.6;
  source.connect(gain);
  gain.connect(sortieAudio);
  source.start();
}

