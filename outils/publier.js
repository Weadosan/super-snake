// Prépare le jeu à mettre en ligne (GitHub Pages) à partir du fichier construit par build.js.
// Ajoute ce qu'il faut pour installer le jeu comme une appli sur téléphone (manifeste + service worker hors ligne).
// Usage : node outils/publier.js [source.html] [dossier]   (par défaut : snake_stable.html et site/)
// Dans le dépôt : node outils/publier.js snake.html .   (le site est servi depuis la racine du dépôt)
const fs = require('fs');
const path = require('path');

const racine = path.join(__dirname, '..');
const source = path.resolve(process.argv[2] || path.join(racine, 'snake_stable.html'));
const site = path.resolve(process.argv[3] || path.join(racine, 'site'));
fs.mkdirSync(site, { recursive: true });

let html = fs.readFileSync(source, 'utf8');
const version = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);

const tete = `<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icone.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icone-180.png">
<meta name="theme-color" content="#1e1e2e">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Super Snake">
</head>`;
const pied = `<script>
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
</script>
</body>`;
if (!html.includes('</head>') || !html.includes('</body>')) throw new Error(source + ' inattendu');
html = html.replace('</head>', tete).replace(/<\/body>(?![\s\S]*<\/body>)/, pied);
fs.writeFileSync(path.join(site, 'index.html'), html);
// bibliothèque du jeu à deux en ligne, servie avec le jeu (pas besoin du CDN)
fs.copyFileSync(path.join(__dirname, 'trystero.min.js'), path.join(site, 'trystero.min.js'));

fs.writeFileSync(path.join(site, 'manifest.webmanifest'), JSON.stringify({
  name: 'Super Snake',
  short_name: 'Super Snake',
  start_url: './',
  scope: './',
  display: 'fullscreen',
  orientation: 'any',
  background_color: '#1e1e2e',
  theme_color: '#1e1e2e',
  icons: [
    { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    { src: 'icone.svg', sizes: 'any', type: 'image/svg+xml' }
  ]
}, null, 2));

// Service worker : sert la dernière version en ligne, et la copie gardée quand il n'y a pas de réseau.
fs.writeFileSync(path.join(site, 'sw.js'), `const CACHE = 'super-snake-${version}';
const FICHIERS = ['./', 'index.html', 'manifest.webmanifest', 'icone.svg', 'icone-192.png', 'icone-512.png', 'icone-180.png', 'trystero.min.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(cles => Promise.all(cles.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(rep => {
    const copie = rep.clone();
    caches.open(CACHE).then(c => c.put(e.request, copie));
    return rep;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
`);

// icône : seulement si le dossier n'en a pas déjà une
if (!fs.existsSync(path.join(site, 'icone.svg'))) fs.writeFileSync(path.join(site, 'icone.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="96" fill="#1e1e2e"/>
<g fill="#4caf50">
<rect x="96" y="320" width="80" height="80" rx="16"/><rect x="176" y="320" width="80" height="80" rx="16"/>
<rect x="256" y="320" width="80" height="80" rx="16"/><rect x="256" y="240" width="80" height="80" rx="16"/>
<rect x="256" y="160" width="80" height="80" rx="16"/><rect x="336" y="160" width="80" height="80" rx="16"/>
</g>
<circle cx="390" cy="185" r="10" fill="#14141f"/>
<circle cx="150" cy="170" r="44" fill="#e53935"/><rect x="146" y="112" width="10" height="26" rx="4" fill="#6d4c41"/>
</svg>
`);
console.log((path.relative(process.cwd(), site) || '.') + '/ prêt (version ' + version + ')');
