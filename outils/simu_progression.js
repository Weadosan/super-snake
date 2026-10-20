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

// parties typiques : moyennes de 14 parties automatiques par difficulté (bots moyen et fort,
// outils/parties_auto.py, 19 octobre 2026) ; minutes = durée moyenne d'une partie
const profils = {
  facile: {longueur: 136, ennemis: 163, boss: 3.1, pommesOr: 12, victoire: 0, minutes: 6},
  normal: {longueur: 76, ennemis: 74, boss: 0.8, pommesOr: 4.4, victoire: 0, minutes: 2.7},
  difficile: {longueur: 79, ennemis: 51, boss: 0.4, pommesOr: 3.2, victoire: 0, minutes: 1.85}
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
const coutSkins = somme(Object.values(reglages.serpents)) + somme(Object.values(reglages.tourelles));
const coutTotal = coutAmeliorations + coutBuffs + coutThemes + coutSkins;

console.log('Coûts : améliorations ' + coutAmeliorations + ', buffs ' + coutBuffs + ', thèmes ' + coutThemes +
  ', skins du serpent et de la tourelle ' + coutSkins + ' = ' + coutTotal + ' Écailles');
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
  const p = profils[difficulte];
  const gain = gainMoyen(p, difficulte, 0);
  console.log(difficulte.padEnd(10) + ' : ~' + Math.round(gain) + ' Écailles par partie (' + Math.round(gain / p.minutes) + ' par minute), ' +
    'améliorations en ' + partiesAmeliorations + ' parties, tout en ' + parties + ' parties (' +
    Math.round(parties * p.minutes / 60) + ' h de jeu)');
});
