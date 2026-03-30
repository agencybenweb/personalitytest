/**
 * ============================================================
 *  GEO-DEMO — Frontend JavaScript
 *  Gestion de la géolocalisation et envoi au serveur
 * ============================================================
 */

// ─────────────────────────────────────────────
//  Références DOM
// ─────────────────────────────────────────────
const statusArea = document.getElementById("status-area");
const btnContinue = document.getElementById("btn-continue");
const btnText = document.getElementById("btn-text");
const btnIcon = document.getElementById("btn-icon");

// ─────────────────────────────────────────────
//  Vérification de la disponibilité de l'API
// ─────────────────────────────────────────────
if (!navigator.geolocation) {
  // Le navigateur ne supporte pas la géolocalisation
  showStatus("error", "❌", "Votre navigateur ne supporte pas la géolocalisation.");
  btnContinue.disabled = true;
}

// ─────────────────────────────────────────────
//  Gestionnaire principal
// ─────────────────────────────────────────────
function handleContinue() {
  // Désactiver le bouton pour éviter les doubles clics
  btnContinue.disabled = true;

  // Afficher le loader pendant la demande de géolocalisation
  showLoader("Demande de localisation en cours...");

  // Options pour l'API de géolocalisation
  const geoOptions = {
    enableHighAccuracy: true,   // Privilégier la précision (GPS si disponible)
    timeout: 15000,             // Délai max de 15 secondes
    maximumAge: 0,              // Ne pas utiliser de position depuis le cache
  };

  // Déclencher la demande — le navigateur affichera sa propre popup de consentement
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

  // Afficher un loader pendant l'envoi au serveur
  showLoader("Envoi des données au serveur...");

  try {
    // Envoyer les données au backend via POST
    const response = await fetch("/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude, accuracy, timestamp }),
    });

    const data = await response.json();

    if (data.success) {
      // Succès : afficher les coordonnées et un message de confirmation
      showSuccess(latitude, longitude, accuracy);
    } else {
      throw new Error(data.message || "Erreur inconnue du serveur.");
    }
  } catch (err) {
    // Erreur réseau ou côté serveur
    showStatus("error", "🔌", `Erreur lors de l'envoi : ${err.message}`);
    enableRetry();
  }
}

// ─────────────────────────────────────────────
//  Callback : Géolocalisation refusée ou erreur
// ─────────────────────────────────────────────
function onGeolocationError(error) {
  let message = "";

  // Codes d'erreur standardisés par l'API W3C
  switch (error.code) {
    case error.PERMISSION_DENIED:
      message = "Vous avez refusé l'accès à votre position. Vous pouvez modifier ce choix dans les paramètres de votre navigateur.";
      break;
    case error.POSITION_UNAVAILABLE:
      message = "Votre position est actuellement indisponible. Vérifiez les paramètres de localisation de votre appareil.";
      break;
    case error.TIMEOUT:
      message = "La demande de localisation a expiré. Veuillez réessayer.";
      break;
    default:
      message = `Erreur inattendue : ${error.message}`;
  }

  showStatus("error", "❌", message);
  enableRetry();
}

// ─────────────────────────────────────────────
//  Fonctions d'affichage
// ─────────────────────────────────────────────

/** Affiche un loader animé */
function showLoader(text) {
  statusArea.innerHTML = `
    <div class="spinner"></div>
    <p style="color: var(--clr-text-muted); font-size: 0.9rem;">${text}</p>
  `;
}

/** Affiche un message coloré (success / error / info) */
function showStatus(type, icon, message) {
  statusArea.innerHTML = `
    <div class="status-message ${type}">
      <span class="status-icon">${icon}</span>
      <span>${message}</span>
    </div>
  `;
}

/** Affiche le succès avec les coordonnées + bouton admin */
function showSuccess(lat, lng, accuracy) {
  const formattedDate = new Date().toLocaleString("fr-FR");
  const accuracyText = accuracy ? `${Math.round(accuracy)} m` : "N/A";

  statusArea.innerHTML = `
    <div class="status-message success">
      <span class="status-icon">✅</span>
      <div style="flex:1">
        <strong>Position enregistrée !</strong>
        <div class="coords-grid">
          <div class="coord-item">
            <div class="coord-label">Latitude</div>
            <div class="coord-value">${lat.toFixed(6)}°</div>
          </div>
          <div class="coord-item">
            <div class="coord-label">Longitude</div>
            <div class="coord-value">${lng.toFixed(6)}°</div>
          </div>
          <div class="coord-item">
            <div class="coord-label">Précision</div>
            <div class="coord-value">${accuracyText}</div>
          </div>
          <div class="coord-item">
            <div class="coord-label">Heure</div>
            <div class="coord-value" style="font-size:0.78rem">${formattedDate}</div>
          </div>
        </div>
      </div>
    </div>
    <a href="/admin" class="btn-primary" style="text-decoration:none; font-size:0.9rem; padding:12px 28px; margin-top:4px;">
      🗺️ Voir dans le panel admin
    </a>
  `;
}

/** Réactive le bouton pour permettre un nouvel essai */
function enableRetry() {
  const retryBtn = document.createElement("button");
  retryBtn.className = "btn-primary";
  retryBtn.style.cssText = "font-size:0.9rem; padding:12px 28px; margin-top:8px;";
  retryBtn.innerHTML = "🔄 Réessayer";
  retryBtn.onclick = () => {
    // Réinitialiser l'état
    statusArea.innerHTML = "";
    statusArea.appendChild(btnContinue);
    btnContinue.disabled = false;
    handleContinue();
  };
  statusArea.appendChild(retryBtn);
}
