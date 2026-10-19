#!/usr/bin/env node
// Rythme de la progression : combien de parties pour tout débloquer, selon la difficulté.
// Lit reglagesProgression directement dans src/js/03-progression.js : changer un réglage là-bas, puis relancer.
// Usage : node outils/simu_progression.js
'use strict';
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', '03-progression.js'), 'utf8');
const debut = source.indexOf('const reglagesProgression = ');
const fin = source.indexOf('\n};', debut);
const reglages = new Function(source.slice(debut, fin + 3) + '\nreturn reglagesProgression;')();
const g = reglages.gains;

// parties typiques (moyennes estimées) ; à corriger avec de vraies parties si besoin
const profils = {
  facile: {longueur: 90, ennemis: 45, boss: 0.6, pommesOr: 2, victoire: 0.05},
  normal: {longueur: 70, ennemis: 35, boss: 0.4, pommesOr: 1.5, victoire: 0.02},
  difficile: {longueur: 55, ennemis: 30, boss: 0.25, pommesOr: 1, victoire: 0.01}
};
// Écailles des succès réparties sur les 60 premières parties environ
const totalSucces = 58 * g.succes.parDefaut;
const partiesSucces = 60;

function gainMoyen(p, difficulte, avarice) {
  const base = Math.floor(p.longueur / g.parSegments) + Math.floor(p.ennemis / g.parEnnemis) +
    p.boss * g.boss + p.pommesOr * g.pommeOr + p.victoire * g.victoire;
  return base * reglages.multiplicateurDifficulte[difficulte] * (1 + avarice);
}

const somme = l => l.reduce((a, b) => a + b, 0);
const coutAmeliorations = somme(Object.values(reglages.ameliorations).map(a => somme(a.prix)));
const coutBuffs = somme(Object.values(reglages.buffs));
const coutThemes = somme(Object.values(reglages.themes));
const coutTotal = coutAmeliorations + coutBuffs + coutThemes;

console.log('Coûts : améliorations ' + coutAmeliorations + ', buffs ' + coutBuffs + ', thèmes ' + coutThemes + ' = ' + coutTotal + ' Écailles');
console.log('Succès : environ ' + totalSucces + ' Écailles au total\n');

// Avarice achetée en premier (c'est le plus rentable), puis le reste
const avarice = reglages.ameliorations.avarice;
Object.keys(profils).forEach(difficulte => {
  let ecailles = 0, depense = 0, niveauAvarice = 0, parties = 0, partiesAmeliorations = null;
  while (depense < coutTotal && parties < 2000) {
    parties++;
    ecailles += gainMoyen(profils[difficulte], difficulte, niveauAvarice * avarice.effet);
    if (parties <= partiesSucces) ecailles += totalSucces / partiesSucces;
    while (niveauAvarice < avarice.prix.length && ecailles >= avarice.prix[niveauAvarice]) {
      ecailles -= avarice.prix[niveauAvarice];
      depense += avarice.prix[niveauAvarice];
      niveauAvarice++;
    }
    if (niveauAvarice === avarice.prix.length) {
      const reste = coutTotal - depense;
      const achat = Math.min(reste, ecailles);
      ecailles -= achat;
      depense += achat;
    }
    if (partiesAmeliorations === null && depense >= coutAmeliorations) partiesAmeliorations = parties;
  }
  console.log(difficulte.padEnd(10) + ' : ~' + Math.round(gainMoyen(profils[difficulte], difficulte, 0)) + ' Écailles par partie, ' +
    'améliorations en ' + partiesAmeliorations + ' parties, tout en ' + parties + ' parties');
});
