/**
 * app.js
 * Vismrit Dashboard Application Logic
 * 
 * Handles live lookups via /api/lookup proxy, API configuration settings,
 * custom JSON testing, masking toggles, print triggers, evidence lightbox modal,
 * and the 'vismrit:start-removal' event.
 */

import { SAMPLE_API_RESPONSE, SAMPLE_NOT_FOUND_RESPONSE } from "./sampleResponse.js";
import { renderDataExposureReport, formatSourceName } from "./reportGenerator.js";

// Application State
let currentApiResponse = SAMPLE_API_RESPONSE;
let isUnmasked = true;

// DOM Elements: Main Toolbar
const reportRoot = document.getElementById("report-root");
const lookupForm = document.getElementById("lookup-form");
const inputPhone = document.getElementById("input-phone");
const btnLookup = document.getElementById("btn-lookup");
const btnReveal = document.getElementById("btn-reveal");
const labelReveal = document.getElementById("label-reveal");
const btnPrint = document.getElementById("btn-print");
const toastArea = document.getElementById("toast-area");

// DOM Elements: Evidence Modal
const evidenceModal = document.getElementById("evidence-modal");
const modalEvidenceTitle = document.getElementById("modal-evidence-title");
const evidenceImg = document.getElementById("evidence-img");
const btnCloseModal = document.getElementById("btn-close-modal");
const btnModalDismiss = document.getElementById("btn-modal-dismiss");

// DOM Elements: API Settings Modal
const settingsModal = document.getElementById("settings-modal");
const btnOpenSettings = document.getElementById("btn-open-settings");
const btnCloseSettings = document.getElementById("btn-close-settings");
const btnSaveSettings = document.getElementById("btn-save-settings");
const btnResetSettings = document.getElementById("btn-reset-settings");
const settingApiUrl = document.getElementById("setting-api-url");
const settingApiKey = document.getElementById("setting-api-key");

// DOM Elements: Test JSON Modal
const jsonModal = document.getElementById("json-modal");
const btnOpenJsonModal = document.getElementById("btn-open-json-modal");
const btnCloseJsonModal = document.getElementById("btn-close-json-modal");
const textareaCustomJson = document.getElementById("textarea-custom-json");
const btnLoadFriendSample = document.getElementById("btn-load-friend-sample");
const btnApplyJson = document.getElementById("btn-apply-json");

/**
 * Show a banner toast notification
 */
function showToast(message, type = "info") {
  if (!toastArea) return;
  toastArea.innerHTML = `
    <div class="toast-msg toast-${type}">
      <span>${message}</span>
      <button type="button" style="background:none;border:none;color:inherit;cursor:pointer;font-size:1.1rem;line-height:1;" onclick="this.parentElement.remove();">&times;</button>
    </div>
  `;
}

/**
 * Clear toast notification
 */
function clearToast() {
  if (toastArea) toastArea.innerHTML = "";
}

/**
 * Render the current API response into the report container
 */
function renderCurrentReport() {
  if (!reportRoot) return;
  reportRoot.innerHTML = renderDataExposureReport(currentApiResponse, {
    unmask: isUnmasked,
    searchedPhone: inputPhone?.value?.trim() || "",
  });
}

/**
 * Perform lookup against the proxy server /api/lookup
 */
async function performLookup(targetPhone) {
  const rawPhone = (typeof targetPhone === "string" ? targetPhone : (inputPhone?.value || "")).trim();
  if (!rawPhone) {
    showToast("Please provide a valid 10-digit mobile number.", "error");
    return;
  }

  // Load user-configured scraper endpoint and key if present
  const configuredUrl = localStorage.getItem("vismrit_scraper_url") || "";
  const configuredKey = localStorage.getItem("vismrit_scraper_key") || "";

  // Visual loading state
  if (btnLookup) {
    btnLookup.disabled = true;
    btnLookup.innerHTML = `
      <div class="spinner"></div>
      <span>Looking up...</span>
    `;
  }
  if (inputPhone) inputPhone.disabled = true;
  clearToast();

  try {
    const res = await fetch("/api/lookup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: rawPhone,
        apiUrl: configuredUrl || undefined,
        apiKey: configuredKey || undefined,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || `Server responded with status HTTP ${res.status}`;
      throw new Error(errorMsg);
    }

    if (!data || !Array.isArray(data.results)) {
      throw new Error("Invalid response received from scraper service. Expected JSON with 'results' array.");
    }

    // Pass the raw API response straight into the renderer
    currentApiResponse = data;
    renderCurrentReport();

    const maskedPhone = data.phone || `+91 ******${rawPhone.slice(-2)}`;
    showToast(`✓ Scraper API lookup completed successfully for ${maskedPhone}`, "success");
  } catch (err) {
    console.error("Lookup error:", err);
    let userMsg = err.message || "Failed to query lookup API.";
    if (userMsg.includes("Failed to fetch") || userMsg.includes("NetworkError")) {
      userMsg = "Could not reach the Vismrit proxy server. Ensure proxy is running on port 3001 (`npm run proxy`).";
    }
    showToast(userMsg, "error");
  } finally {
    if (btnLookup) {
      btnLookup.disabled = false;
      btnLookup.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span class="btn-text">Look up</span>
      `;
    }
    if (inputPhone) inputPhone.disabled = false;
  }
}

/**
 * Toggle Mask / Reveal Sensitive Data
 */
function toggleMask() {
  isUnmasked = !isUnmasked;

  if (labelReveal) {
    labelReveal.textContent = isUnmasked ? "Hide data" : "Reveal data";
  }

  const iconWrap = btnReveal?.querySelector(".icon-reveal");
  if (iconWrap) {
    iconWrap.innerHTML = isUnmasked
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
  }

  renderCurrentReport();
}

/**
 * Open Evidence Lightbox
 */
function openEvidenceModal(sourceId) {
  const results = currentApiResponse.results || [];
  const item = results.find(
    (r) => (r.source || "").toLowerCase().replace(/\s+/g, "-") === sourceId
  );

  if (!item || !item.evidence) {
    showToast(`No screenshot evidence captured for ${sourceId}.`, "info");
    return;
  }

  const evidence = item.evidence;
  let imageSrc = evidence.dataUrl || evidence.url;
  if (!imageSrc && evidence.base64) {
    const mime = evidence.mimeType || "image/png";
    imageSrc = evidence.base64.startsWith("data:")
      ? evidence.base64
      : `data:${mime};base64,${evidence.base64}`;
  }

  if (!imageSrc) {
    showToast(`Screenshot evidence data unavailable for ${sourceId}.`, "info");
    return;
  }

  if (modalEvidenceTitle) {
    const formatted = formatSourceName(item.source);
    modalEvidenceTitle.textContent = `${formatted} Captured Evidence`;
  }
  if (evidenceImg) {
    evidenceImg.src = imageSrc;
  }
  if (evidenceModal) {
    evidenceModal.style.display = "flex";
  }
}

/**
 * Close Evidence Modal
 */
function closeEvidenceModal() {
  if (evidenceModal) {
    evidenceModal.style.display = "none";
  }
  if (evidenceImg) {
    evidenceImg.src = "";
  }
}

// ============================================================================
// API Settings Modal Handlers
// ============================================================================
function openSettingsModal() {
  if (settingApiUrl) {
    settingApiUrl.value = localStorage.getItem("vismrit_scraper_url") || "http://127.0.0.1:3000/lookup/all";
  }
  if (settingApiKey) {
    settingApiKey.value = localStorage.getItem("vismrit_scraper_key") || "";
  }
  if (settingsModal) {
    settingsModal.style.display = "flex";
  }
}

function closeSettingsModal() {
  if (settingsModal) {
    settingsModal.style.display = "none";
  }
}

function saveSettings() {
  const urlVal = settingApiUrl?.value?.trim() || "";
  const keyVal = settingApiKey?.value?.trim() || "";

  if (urlVal) {
    localStorage.setItem("vismrit_scraper_url", urlVal);
  } else {
    localStorage.removeItem("vismrit_scraper_url");
  }

  if (keyVal) {
    localStorage.setItem("vismrit_scraper_key", keyVal);
  } else {
    localStorage.removeItem("vismrit_scraper_key");
  }

  showToast("✓ Scraper API settings saved successfully.", "success");
  closeSettingsModal();
}

function resetSettings() {
  localStorage.removeItem("vismrit_scraper_url");
  localStorage.removeItem("vismrit_scraper_key");
  if (settingApiUrl) settingApiUrl.value = "http://127.0.0.1:3000/lookup/all";
  if (settingApiKey) settingApiKey.value = "";
  showToast("API settings reset to default (http://127.0.0.1:3000/lookup/all).", "info");
}

// ============================================================================
// Test JSON Modal Handlers
// ============================================================================
function openJsonModal() {
  if (textareaCustomJson) {
    textareaCustomJson.value = JSON.stringify(currentApiResponse, null, 2);
  }
  if (jsonModal) {
    jsonModal.style.display = "flex";
  }
}

function closeJsonModal() {
  if (jsonModal) {
    jsonModal.style.display = "none";
  }
}

function loadFriendSampleJson() {
  if (textareaCustomJson) {
    textareaCustomJson.value = JSON.stringify(SAMPLE_API_RESPONSE, null, 2);
  }
  showToast("Loaded friend's sample JSON payload (Truecaller, GetContact, Justdial).", "info");
}

function applyCustomJson() {
  const text = textareaCustomJson?.value?.trim();
  if (!text) {
    showToast("Please paste a JSON object first.", "error");
    return;
  }

  try {
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.results)) {
      throw new Error("Invalid structure: JSON must contain a 'results' array.");
    }

    currentApiResponse = parsed;
    renderCurrentReport();
    closeJsonModal();
    showToast("✓ Report updated successfully from JSON payload.", "success");
  } catch (err) {
    showToast(`Invalid JSON: ${err.message}`, "error");
  }
}

// ============================================================================
// Event Listeners
// ============================================================================
lookupForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  performLookup();
});

btnReveal?.addEventListener("click", toggleMask);

btnPrint?.addEventListener("click", () => {
  window.print();
});

// Evidence Modal
btnCloseModal?.addEventListener("click", closeEvidenceModal);
btnModalDismiss?.addEventListener("click", closeEvidenceModal);
evidenceModal?.addEventListener("click", (e) => {
  if (e.target === evidenceModal) closeEvidenceModal();
});

// Settings Modal
btnOpenSettings?.addEventListener("click", openSettingsModal);
btnCloseSettings?.addEventListener("click", closeSettingsModal);
btnSaveSettings?.addEventListener("click", saveSettings);
btnResetSettings?.addEventListener("click", resetSettings);
settingsModal?.addEventListener("click", (e) => {
  if (e.target === settingsModal) closeSettingsModal();
});

// Test JSON Modal
btnOpenJsonModal?.addEventListener("click", openJsonModal);
btnCloseJsonModal?.addEventListener("click", closeJsonModal);
btnLoadFriendSample?.addEventListener("click", loadFriendSampleJson);
btnApplyJson?.addEventListener("click", applyCustomJson);
jsonModal?.addEventListener("click", (e) => {
  if (e.target === jsonModal) closeJsonModal();
});

// Event Delegation for dynamically rendered buttons inside #report-root
reportRoot?.addEventListener("click", (e) => {
  // 0. Back to Home Button Click
  const backBtn = e.target.closest("#btn-back-home");
  if (backBtn) {
    const urlParams = new URLSearchParams(window.location.search);
    const homeUrl = urlParams.get("home");
    if (homeUrl) {
      window.location.href = homeUrl;
    } else if (window.history.length > 1 && document.referrer) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
    return;
  }

  // 1. Evidence Button Click
  const evidenceBtn = e.target.closest(".btn-evidence-badge");
  if (evidenceBtn) {
    const sourceId = evidenceBtn.dataset.sourceId;
    if (sourceId) {
      openEvidenceModal(sourceId);
    }
    return;
  }

  // 2. Start Removal Button Click
  const removalBtn = e.target.closest("#btn-start-removal");
  if (removalBtn) {
    const exposedSources = (currentApiResponse.results || [])
      .filter((r) => r.status === "FOUND")
      .map((r) => r.source);

    // Dispatch the custom event vismrit:start-removal
    const eventDetail = {
      phone: currentApiResponse.phone || inputPhone?.value || "",
      searchedAt: currentApiResponse.searchedAt,
      exposedSources,
      apiResponse: currentApiResponse,
    };

    window.dispatchEvent(
      new CustomEvent("vismrit:start-removal", {
        bubbles: true,
        detail: eventDetail,
      })
    );
  }
});

// Handler for the vismrit:start-removal event
window.addEventListener("vismrit:start-removal", (event) => {
  const detail = event.detail || {};
  console.log("[Vismrit Event] 'vismrit:start-removal' triggered with payload:", detail);

  showToast(
    `🚀 Start removal dispatched for ${detail.phone} across ${detail.exposedSources?.length || 0} exposed sources.`,
    "info"
  );
});

// URL parameter controls:
// - Default (no params) -> "No Search / Not Found" state (0% exposure, All Clean)
// - ?view=found          -> Sample with findings (Amit Kumar, Truecaller, GetContact)
// - ?view=empty          -> Minimal "No Search Results Found" card
// - ?phone=9876541641    -> Live API lookup
const urlParams = new URLSearchParams(window.location.search);
const queryPhone = urlParams.get("phone");
const viewMode = urlParams.get("view");

if (viewMode === "found") {
  currentApiResponse = SAMPLE_API_RESPONSE;
} else if (viewMode === "empty") {
  currentApiResponse = null;
} else {
  currentApiResponse = SAMPLE_NOT_FOUND_RESPONSE;
}

if (urlParams.get("unmask") === "true") {
  isUnmasked = true;
}

if (queryPhone) {
  performLookup(queryPhone);
} else {
  renderCurrentReport();
}
