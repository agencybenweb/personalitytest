/**
 * ============================================================
 *  VERCEL SERVERLESS — GET + DELETE /api/positions
 *  Récupère ou supprime depuis Firebase Firestore
 * ============================================================
 */

const { db, collection, getDocs, deleteDoc, query, orderBy } = require("../lib/firebase");

module.exports = async (req, res) => {
  // ── Headers CORS ──
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { return res.status(204).end(); }
  if (!db) { return res.status(500).json({ success: false, message: "Firebase non configuré." }); }

  try {
    // ── GET: Liste de toutes les positions ──
    if (req.method === "GET") {
      const q = query(collection(db, "positions"), orderBy("dateReceived", "desc"));
      const snapshot = await getDocs(q);

      const positions = [];
      snapshot.forEach((doc) => {
        positions.push({ id: doc.id, ...doc.data() });
      });

      return res.status(200).json({
        success: true,
        count: positions.length,
        positions,
      });
    }

    // ── DELETE: Effacement total ──
    if (req.method === "DELETE") {
      const snapshot = await getDocs(collection(db, "positions"));
      const deletePromises = [];

      snapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });

      await Promise.all(deletePromises);
      return res.status(200).json({
        success: true,
        message: `${snapshot.size} position(s) supprimée(s) définitivement de la base de données.`,
      });
    }

    // Toute autre méthode
    return res.status(405).json({ success: false, message: "Méthode non autorisée." });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
