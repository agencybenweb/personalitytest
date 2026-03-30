/**
 * ============================================================
 *  GEO-DEMO — Serveur Express (Local) connecté à Firebase
 * ============================================================
 */

const express = require("express");
const cors    = require("cors");
const path    = require("path");

// ── Importer notre configuration Firebase ──
const { db, collection, addDoc, getDocs, deleteDoc, query, orderBy } = require("../lib/firebase");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

/**
 * POST /save
 * Enregistre une nouvelle position dans Firestore.
 */
app.post("/save", async (req, res) => {
  if (!db) return res.status(500).json({ success: false, message: "Firebase n'est pas configuré." });

  const { latitude, longitude, accuracy, timestamp } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, message: "latitude et longitude sont requis." });
  }

  const entry = {
    latitude:     parseFloat(latitude),
    longitude:    parseFloat(longitude),
    accuracy:     accuracy ? parseFloat(accuracy) : null,
    timestamp:    timestamp || Date.now(),
    dateReceived: new Date().toISOString(),
    userAgent:    req.headers["user-agent"] || "Inconnu",
  };

  try {
    // Ajouter à la collection "positions" dans Firestore
    const docRef = await addDoc(collection(db, "positions"), entry);
    entry.id = docRef.id;

    console.log(`[${new Date().toLocaleString("fr-FR")}] 📍 Nouvelle position sur Firebase :`, docRef.id);
    return res.json({ success: true, message: "Position enregistrée sur Firebase.", entry });
  } catch (err) {
    console.error("Erreur Firebase :", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/positions
 * Récupère toutes les positions depuis Firestore (triées par date décroissante).
 */
app.get("/api/positions", async (req, res) => {
  if (!db) return res.json({ success: true, count: 0, positions: [] });

  try {
    const q = query(collection(db, "positions"), orderBy("dateReceived", "desc"));
    const snapshot = await getDocs(q);
    
    const positions = [];
    snapshot.forEach((doc) => {
      positions.push({ id: doc.id, ...doc.data() });
    });

    res.json({ success: true, count: positions.length, positions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/positions
 * Efface tous les documents de la collection "positions".
 */
app.delete("/api/positions", async (req, res) => {
  if (!db) return res.status(500).json({ success: false, message: "Firebase n'est pas configuré." });

  try {
    const snapshot = await getDocs(collection(db, "positions"));
    const deletePromises = [];
    
    // Supprimer chaque document un par un
    snapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });

    await Promise.all(deletePromises);
    res.json({ success: true, message: `${snapshot.size} position(s) supprimée(s) de Firebase.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /admin
 */
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});

app.listen(PORT, () => {
  console.log("════════════════════════════════════════════");
  console.log(`  GEO-DEMO — Serveur démarré`);
  console.log(`  Page publique : http://localhost:${PORT}`);
  console.log(`  Panel admin   : http://localhost:${PORT}/admin`);
  if (!db) {
    console.log(`  ⚠️  ATTENTION : Fichier .env manquant ou invalide !`);
    console.log(`      Firebase ne fonctionnera pas sans vos identifiants.`);
  } else {
    console.log(`  🔥 Connecté à Firebase Firestore`);
  }
  console.log("════════════════════════════════════════════");
});
