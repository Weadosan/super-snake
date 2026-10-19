// ============================================================
// --- Sauvegarde : exporter / importer toute la progression ---
// ============================================================
// Section « 💾 Sauvegarde » du menu ⚙️ Options. Exporter donne un code texte qui contient tout ce que le jeu
// garde dans le navigateur (Écailles, succès, scores, réglages : les clés « snake... »). Importer remplace tout
// par le contenu d'un code, après confirmation, et garde l'état d'avant dans snakeAvantImport.

const prefixeCodeSauvegarde = 'SNAKE1:';
const cleStockageAvantImport = 'snakeAvantImport';

function donneesSauvegarde() {
  const d = {};
  for (let i = 0; i < localStorage.length; i++) {
    const cle = localStorage.key(i);
    if (cle && cle.startsWith('snake') && cle !== cleStockageAvantImport) d[cle] = localStorage.getItem(cle);
  }
  return d;
}

function exporterSauvegarde() {
  const json = JSON.stringify({v: 1, date: Date.now(), d: donneesSauvegarde()});
  return prefixeCodeSauvegarde + btoa(unescape(encodeURIComponent(json)));
}

// renvoie les clés à écrire, ou lève une erreur avec un message lisible
function lireCodeSauvegarde(code) {
  code = String(code || '').replace(/\s+/g, '');
  if (!code.startsWith(prefixeCodeSauvegarde)) throw new Error('Ce n\'est pas un code de sauvegarde Super Snake.');
  let donnees;
  try {
    donnees = JSON.parse(decodeURIComponent(escape(atob(code.slice(prefixeCodeSauvegarde.length)))));
  } catch (e) {
    throw new Error('Code incomplet ou abîmé : recopie-le en entier.');
  }
  if (!donnees || typeof donnees.d !== 'object' || !donnees.d) throw new Error('Code illisible.');
  const cles = Object.keys(donnees.d);
  if (!cles.length || cles.some(c => !c.startsWith('snake') || typeof donnees.d[c] !== 'string')) {
    throw new Error('Code illisible.');
  }
  return donnees.d;
}

function importerSauvegarde(code) {
  const d = lireCodeSauvegarde(code);
  localStorage.setItem(cleStockageAvantImport, exporterSauvegarde());
  Object.keys(donneesSauvegarde()).forEach(c => localStorage.removeItem(c));
  Object.keys(d).forEach(c => localStorage.setItem(c, d[c]));
}

(function () {
  const contenu = document.getElementById('optionsContenu');
  const section = document.createElement('div');
  section.id = 'optionsSauvegarde';
  section.innerHTML = `
    <h3>💾 Sauvegarde</h3>
    <p class="options-note">Tes Écailles, succès, scores et réglages sont gardés dans ce navigateur.
      Exporte-les pour les mettre à l'abri ou les reprendre sur un autre appareil.</p>
    <div class="options-ligne">
      <button id="sauvegardeExporter">📤 Exporter</button>
      <button id="sauvegardeImporter">📥 Importer</button>
    </div>
    <textarea id="sauvegardeCode" rows="3" spellcheck="false" autocomplete="off"
      placeholder="Le code apparaît ici. Pour importer, colle un code puis appuie sur Importer."></textarea>
    <div id="sauvegardeMessage" class="options-note"></div>`;
  contenu.appendChild(section);
  const zone = document.getElementById('sauvegardeCode');
  const message = document.getElementById('sauvegardeMessage');

  document.getElementById('sauvegardeExporter').addEventListener('click', () => {
    try {
      zone.value = exporterSauvegarde();
    } catch (e) {
      message.textContent = '⚠️ Stockage du navigateur indisponible : rien à exporter.';
      return;
    }
    zone.select();
    const ok = () => { message.textContent = '✅ Code copié. Garde-le dans une note ou un message.'; };
    const manuel = () => { message.textContent = 'Copie le code ci-dessus et garde-le dans une note ou un message.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(zone.value).then(ok, manuel);
    else manuel();
  });

  document.getElementById('sauvegardeImporter').addEventListener('click', () => {
    let d;
    try {
      d = lireCodeSauvegarde(zone.value);
    } catch (e) {
      message.textContent = '⚠️ ' + e.message;
      return;
    }
    if (!confirm('Remplacer toute ta progression sur cet appareil par celle de ce code ?')) return;
    try {
      importerSauvegarde(zone.value);
    } catch (e) {
      message.textContent = '⚠️ Impossible d\'écrire la sauvegarde dans ce navigateur.';
      return;
    }
    location.reload();
  });
})();
