/**
 * ============================================================
 *  VERCEL SERVERLESS — POST /api/save
 *  Enregistre une position dans Firebase Firestore
 * ============================================================
 */

const { db, collection, addDoc } = require("../lib/firebase");

module.exports = async (req, res) => {
  // ── Headers CORS ──
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { return res.status(204).end(); }
  if (req.method !== "POST") { return res.status(405).json({ success: false, message: "Méthode non autorisée." }); }

  try {
    if (!db) { throw new Error("Firebase non configuré dans les variables d'environnement."); }

    const { latitude, longitude, accuracy, timestamp } = req.body || {};
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: "latitude et longitude sont requis." });
    }

    const entry = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy !== undefined ? parseFloat(accuracy) : null,
      timestamp: timestamp || Date.now(),
      dateReceived: new Date().toISOString(),
      userAgent: req.headers["user-agent"] || "Inconnu",
    };

    // Firebase envoie vers le Cloud
    const docRef = await addDoc(collection(db, "positions"), entry);
    entry.id = docRef.id;

    console.log(`[Vercel Firestore] Position sauvegardée, id=${docRef.id}`);
    
    return res.status(200).json({
      success: true,
      message: "Position enregistrée dans la base en ligne.",
      entry,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
