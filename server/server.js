/**
 * ============================================================
 *  GEO-DEMO — Serveur Express
 *  Démonstration éducative de géolocalisation web
 * ============================================================
 */

const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");

const app  = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
//  Chemin du fichier de stockage persistant
//  Les données survivent aux redémarrages !
// ─────────────────────────────────────────────
const DATA_DIR  = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "positions.json");

// Créer le dossier /data s'il n'existe pas
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/** Lire les positions depuis le fichier JSON */
function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return []; // Fichier absent ou vide → tableau vide
  }
}

/** Écrire les positions dans le fichier JSON */
function writeData(positions) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(positions, null, 2));
}

// ─────────────────────────────────────────────
//  Middleware
// ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// ─────────────────────────────────────────────
//  Routes
// ─────────────────────────────────────────────

/**
 * POST /save
 * Enregistre une nouvelle position géographique.
 */
app.post("/save", (req, res) => {
  const { latitude, longitude, accuracy, timestamp } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      message: "latitude et longitude sont requis.",
    });
  }

  const entry = {
    id:           Date.now(),
    latitude:     parseFloat(latitude),
    longitude:    parseFloat(longitude),
    accuracy:     accuracy ? parseFloat(accuracy) : null,
    timestamp:    timestamp || Date.now(),
    dateReceived: new Date().toISOString(),
    userAgent:    req.headers["user-agent"] || "Inconnu",
  };

  // Lire → ajouter en tête → écrire (persistant)
  const positions = readData();
  positions.unshift(entry);
  writeData(positions);

  console.log(`[${new Date().toLocaleString("fr-FR")}] 📍 Nouvelle position :`, {
    lat: entry.latitude,
    lng: entry.longitude,
    accuracy: entry.accuracy,
  });

  return res.json({ success: true, message: "Position enregistrée avec succès.", entry });
});

/**
 * GET /api/positions
 * Retourne toutes les positions (JSON).
 */
app.get("/api/positions", (req, res) => {
  const positions = readData();
  res.json({ success: true, count: positions.length, positions });
});

/**
 * DELETE /api/positions
 * Efface toutes les positions.
 */
app.delete("/api/positions", (req, res) => {
  const positions = readData();
  const count = positions.length;
  writeData([]);
  res.json({ success: true, message: `${count} position(s) supprimée(s).` });
});

/**
 * GET /admin
 * Sert la page admin.
 */
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});

// ─────────────────────────────────────────────
//  Démarrage du serveur
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  const saved = readData().length;
  console.log("════════════════════════════════════════════");
  console.log(`  GEO-DEMO — Serveur démarré`);
  console.log(`  Page publique : http://localhost:${PORT}`);
  console.log(`  Panel admin   : http://localhost:${PORT}/admin`);
  console.log(`  Positions en base : ${saved}`);
  console.log("════════════════════════════════════════════");
});
