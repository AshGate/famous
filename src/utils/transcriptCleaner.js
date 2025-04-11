import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TRANSCRIPTS_DIR = path.join(__dirname, '../../transcripts');
const MAX_AGE_DAYS = 30;

function cleanupTranscripts() {
  // Crée le dossier s'il n'existe pas
  if (!fs.existsSync(TRANSCRIPTS_DIR)) {
    fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
    console.log('Dossier transcripts créé');
    return;
  }

  const now = new Date();
  const files = fs.readdirSync(TRANSCRIPTS_DIR);
  let deletedCount = 0;

  files.forEach(file => {
    const filePath = path.join(TRANSCRIPTS_DIR, file);
    const stats = fs.statSync(filePath);
    const fileAge = (now - stats.mtime) / (1000 * 60 * 60 * 24); // Age en jours

    if (fileAge > MAX_AGE_DAYS) {
      try {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`Fichier supprimé: ${file}`);
      } catch (error) {
        console.error(`Erreur lors de la suppression de ${file}:`, error);
      }
    }
  });

  console.log(`Nettoyage des transcripts terminé: ${deletedCount} fichiers supprimés`);
}

// Nettoie immédiatement au démarrage
cleanupTranscripts();

// Programme le nettoyage automatique tous les jours à minuit
const ONE_DAY = 24 * 60 * 60 * 1000;
setInterval(() => {
  try {
    cleanupTranscripts();
  } catch (error) {
    console.error('Erreur lors du nettoyage automatique:', error);
  }
}, ONE_DAY);

export { cleanupTranscripts };