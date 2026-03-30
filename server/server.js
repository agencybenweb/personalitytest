/**
 * ============================================================
 *  GEO-DEMO — Serveur Express
 *  Démonstration éducative de géolocalisation web
 * ============================================================
 */

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
//  Middleware
// ─────────────────────────────────────────────

// Activer CORS pour les requêtes cross-origin
app.use(cors());

// Parser le JSON dans les corps de requêtes
app.use(express.json());

// Servir les fichiers statiques depuis /public
app.use(express.static(path.join(__dirname, "../public")));

// ─────────────────────────────────────────────
//  Stockage en mémoire (tableau simple)
//  Pour une app de production, utiliser une DB
// ─────────────────────────────────────────────
let positions = [];

// ─────────────────────────────────────────────
//  Routes
// ─────────────────────────────────────────────

/**
 * POST /save
 * Enregistre une nouvelle position géographique.
 * Corps attendu : { latitude, longitude, accuracy, timestamp }
 */
app.post("/save", (req, res) => {
  const { latitude, longitude, accuracy, timestamp } = req.body;

  // Validation basique des données reçues
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      message: "latitude et longitude sont requis.",
    });
  }

  // Construction de l'entrée
  const entry = {
    id: Date.now(),                       // Identifiant unique basé sur le timestamp
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    accuracy: accuracy ? parseFloat(accuracy) : null,
    timestamp: timestamp || Date.now(),   // Timestamp de la géolocalisation
    dateReceived: new Date().toISOString(), // Moment où le serveur a reçu les données
    userAgent: req.headers["user-agent"] || "Inconnu",
  };

  // Stocker la position en tête de tableau (plus récent en premier)
  positions.unshift(entry);

  console.log(`[${new Date().toLocaleString("fr-FR")}] Nouvelle position reçue :`, {
    lat: entry.latitude,
    lng: entry.longitude,
    accuracy: entry.accuracy,
  });

  return res.json({
    success: true,
    message: "Position enregistrée avec succès.",
    entry,
  });
});

/**
 * GET /api/positions
 * Retourne la liste de toutes les positions (JSON).
 * Utilisé par le panel admin côté client.
 */
app.get("/api/positions", (req, res) => {
  res.json({
    success: true,
    count: positions.length,
    positions,
  });
});

/**
 * DELETE /api/positions
 * Efface toutes les positions (utile pour les tests).
 */
app.delete("/api/positions", (req, res) => {
  const count = positions.length;
  positions = [];
  res.json({ success: true, message: `${count} position(s) supprimée(s).` });
});

/**
 * GET /admin
 * Sert la page admin (admin.html dans /public).
 */
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});

// ─────────────────────────────────────────────
//  Démarrage du serveur
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("════════════════════════════════════════════");
  console.log(`  GEO-DEMO — Serveur démarré`);
  console.log(`  Page publique : http://localhost:${PORT}`);
  console.log(`  Panel admin   : http://localhost:${PORT}/admin`);
  console.log("════════════════════════════════════════════");
});
