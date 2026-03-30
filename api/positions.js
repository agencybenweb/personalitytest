/**
 * ============================================================
 *  VERCEL SERVERLESS — GET + DELETE /api/positions
 *  Lit et efface les positions depuis /tmp/
 * ============================================================
 */

const fs = require("fs");

const DATA_FILE = "/tmp/geo_positions.json";

/** Lire les positions depuis le fichier temporaire */
function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

module.exports = (req, res) => {
  // ── Headers CORS ──
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // GET → retourner toutes les positions
  if (req.method === "GET") {
    const positions = readData();
    return res.status(200).json({
      success: true,
      count: positions.length,
      positions,
    });
  }

  // DELETE → effacer toutes les positions
  if (req.method === "DELETE") {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify([]));
      return res.status(200).json({
        success: true,
        message: "Toutes les positions ont été supprimées.",
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Méthode non autorisée." });
};
