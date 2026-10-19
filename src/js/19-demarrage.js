// ============================================================
// --- Démarrage ---
// ============================================================
restartBtn.addEventListener('click', init);

// bouton Solo / Coop : change de mode et relance une partie
document.getElementById('modeBtn').addEventListener('click', () => {
  changerModeJeu(enCoop() ? 'solo' : 'coop');
});

// bouton de difficulté : Facile -> Normal -> Difficile, relance une partie
document.getElementById('difficulteBtn').addEventListener('click', () => changerDifficulte());

// option du mode Facile : visée automatique (sans relancer la partie)
document.getElementById('viseeAutoBtn').addEventListener('click', () => {
  optionViseeAuto = !optionViseeAuto;
  try {
    localStorage.setItem(cleStockageViseeAuto, optionViseeAuto ? 'oui' : 'non');
  } catch (e) {
    // stockage indisponible : l'option vaut pour cette session seulement
  }
  majBoutonMode();
});

construireMenuBuffs();
applyTheme('neon');
majBoutonMode();
init();
initHighscores();
rattraperSuccesProgression();
demanderStockagePersistant();
