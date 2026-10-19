#!/usr/bin/env node
// Assemble src/ en un seul fichier snake.html autonome (aucune dépendance, polices comprises).
// Usage : node build.js [sortie]   (par défaut : snake.html à côté de ce script)
'use strict';
const fs = require('fs');
const path = require('path');

const racine = __dirname;
const src = path.join(racine, 'src');
const sortie = path.resolve(process.argv[2] || path.join(racine, 'snake.html'));

const lire = f => fs.readFileSync(f, 'utf8').replace(/\n$/, '');
const modele = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
// polices : chaque url(polices/x.woff2) devient une donnée base64, et leur licence est recopiée dans le fichier
const licences = lire(path.join(src, 'polices', 'LICENCES.txt'));
const style = '/*\n' + licences + '\n*/\n' + lire(path.join(src, 'style.css'))
  .replace(/url\(polices\/([\w.-]+\.woff2)\)/g, (_, f) =>
    'url(data:font/woff2;base64,' + fs.readFileSync(path.join(src, 'polices', f)).toString('base64') + ')');
const modules = fs.readdirSync(path.join(src, 'js')).filter(f => f.endsWith('.js')).sort();
const script = modules.map(f => lire(path.join(src, 'js', f))).join('\n');

// fonction de remplacement : évite que les « $ » du code soient interprétés
const html = modele
  .replace('/*@@STYLE@@*/', () => style)
  .replace('/*@@SCRIPT@@*/', () => script);

fs.writeFileSync(sortie, html);
console.log(`${path.relative(process.cwd(), sortie) || sortie} : ${modules.length} modules, ${html.split('\n').length} lignes, ${Buffer.byteLength(html)} octets`);
