/**
 * ============================================================
 *  VERCEL SERVERLESS — POST /api/save
 *  Enregistre une position géographique dans /tmp/
 * ============================================================
 *  Note : /tmp/ est propre à chaque instance serverless.
 *  Les données persistent pendant la durée de vie de l'instance
 *  (suffisant pour une démo). Pour la production, utiliser une DB.
 * ============================================================
 */

const fs = require("fs");

// Chemin du fichier de stockage dans le répertoire temporaire de Vercel
const DATA_FILE = "/tmp/geo_positions.json";

/** Lire les positions depuis le fichier temporaire */
function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return []; // Fichier inexistant ou vide → tableau vide
  }
}

/** Écrire les positions dans le fichier temporaire */
function writeData(positions) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(positions, null, 2));
}

module.exports = (req, res) => {
  // ── Headers CORS ──
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Répondre au preflight OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Autoriser uniquement POST
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Méthode non autorisée." });
  }

  const { latitude, longitude, accuracy, timestamp } = req.body || {};

  // Validation des données
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      message: "latitude et longitude sont requis.",
    });
  }

  // Construire l'entrée
  const entry = {
    id: Date.now(),
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    accuracy: accuracy !== undefined ? parseFloat(accuracy) : null,
    timestamp: timestamp || Date.now(),
    dateReceived: new Date().toISOString(),
    userAgent: req.headers["user-agent"] || "Inconnu",
  };

  // Lire, ajouter en tête (récent d'abord), écrire
  const positions = readData();
  positions.unshift(entry);
  writeData(positions);

  console.log(`[GéoDémo] Nouvelle position : lat=${entry.latitude}, lng=${entry.longitude}`);

  return res.status(200).json({
    success: true,
    message: "Position enregistrée avec succès.",
    entry,
  });
};
