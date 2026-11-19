/**
 * reportGenerator.js
 * Vismrit Data Exposure Report Engine
 * 
 * Takes your API response JSON directly and calculates privacy exposure metrics,
 * rendering a pixel-perfect dark-themed cybersecurity audit dashboard.
 */

// Source palette with fallback for any number of dynamic sources
// Source palette with fallback for any number of dynamic sources
const SOURCE_PALETTE = {
  truecaller: { name: "Truecaller", color: "#2dd4bf" },
  justdial: { name: "Justdial", color: "#818cf8" },
  getcontact: { name: "GetContact", color: "#38bdf8" },
  whatsapp: { name: "WhatsApp", color: "#22c55e" },
  telegram: { name: "Telegram", color: "#a855f7" },
};

const DYNAMIC_COLORS = [
  "#2dd4bf", // Teal
  "#38bdf8", // Sky Blue
  "#818cf8", // Indigo
  "#f43f5e", // Rose
  "#fb923c", // Orange
  "#a855f7", // Purple
  "#eab308", // Yellow
  "#10b981", // Emerald
];

/**
 * Format source name cleanly
 */
export function formatSourceName(sourceStr) {
  if (!sourceStr) return "Unknown";
  const key = sourceStr.toLowerCase().trim();
  if (key === "custom" || key === "getcontact") return "GetContact";
  if (SOURCE_PALETTE[key]) return SOURCE_PALETTE[key].name;
  return sourceStr.charAt(0).toUpperCase() + sourceStr.slice(1);
}

/**
 * Get color for source
 */
export function getSourceColor(sourceStr, index = 0) {
  const key = (sourceStr || "").toLowerCase().trim();
  if (key === "custom" || key === "getcontact") return SOURCE_PALETTE.getcontact.color;
  if (SOURCE_PALETTE[key]) return SOURCE_PALETTE[key].color;
  return DYNAMIC_COLORS[index % DYNAMIC_COLORS.length];
}

/**
 * Mask sensitive values (e.g., "Amit Kumar" -> "A*** K***")
 */
export function maskValue(val, type = "text") {
  if (!val || typeof val !== "string") return "—";
  const trimmed = val.trim();
  if (!trimmed) return "—";

  // Already masked or redacted detection
  if (trimmed.includes("***") || trimmed.includes("******") || /^[\.\/\*\s_-]+$/.test(trimmed)) {
    return trimmed;
  }

  if (type === "email") {
    if (trimmed.includes("@")) {
      const parts = trimmed.split("@");
      if (parts.length === 2) {
        const user = parts[0];
        const domain = parts[1];
        const maskedUser = user.length > 2 
          ? `${user[0]}***${user.slice(-1)}` 
          : `${user[0]}***`;
        return `${maskedUser}@${domain}`;
      }
    }
    return trimmed;
  }

  if (type === "phone") {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length >= 10) {
      const last10 = digits.slice(-10);
      return `+91 ${last10.slice(0, 2)}******${last10.slice(-2)}`;
    }
    return trimmed;
  }

  if (type === "sim") {
    // e.g. "Jio - 8765432132" or "Airtel 5G" or "sim_name"
    const dashParts = trimmed.split(" - ");
    if (dashParts.length === 2) {
      const carrier = dashParts[0];
      const num = dashParts[1].replace(/\D/g, "");
      if (num.length >= 10) {
        return `${carrier} - ${num.slice(0, 2)}******${num.slice(-2)}`;
      }
      return `${carrier} - 87******32`;
    }
    return trimmed
      .split(/[\s_]+/)
      .map((w) => (w.length <= 2 ? `${w[0]}*` : `${w[0]}${"*".repeat(Math.min(3, w.length - 1))}`))
      .join(" ");
  }

  // Address masking: "B-402 Shanti Park, Delhi" -> "B**** S***, D******"
  if (type === "address") {
    const commaParts = trimmed.split(",");
    return commaParts
      .map((part) => {
        const words = part.trim().split(/\s+/);
        return words
          .map((w) => {
            if (w.length <= 1) return w;
            return `${w[0]}${"*".repeat(Math.min(4, Math.max(3, w.length - 1)))}`;
          })
          .join(" ");
      })
      .join(", ");
  }

  // General text or Name: "Amit Kumar" -> "A*** K***"
  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 2) return `${word[0]}*`;
      return `${word[0]}${"*".repeat(3)}`;
    })
    .join(" ");
}

/**
 * Format ISO date string into "24 Dec 2024" format
 */
export function formatReportDate(isoString) {
  if (!isoString) return "Scanned Recently";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Scanned Recently";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `Scanned ${day} ${month} ${year}`;
  } catch {
    return "Scanned Recently";
  }
}

/**
 * Get SVG icon by detail key
 */
export function getDetailIcon(iconKey) {
  switch (iconKey) {
    case "name":
      return `
        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>`;
    case "phone":
      return `
        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>`;
    case "email":
      return `
        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
        </svg>`;
    case "sim":
      return `
        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path>
          <path d="M14 2v6h6"></path>
          <path d="M9 13v4"></path>
          <path d="M12 11v6"></path>
          <path d="M15 13v4"></path>
        </svg>`;
    case "address":
      return `
        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>`;
    default:
      return `
        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>`;
  }
}

/**
 * Generate SVG Donut Chart with proportional arcs and center text
 */
export function generateDonutChartSvg(sourceStats, totalFindings) {
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let currentOffset = 0;
  const gap = sourceStats.length > 1 ? 3 : 0;

  const paths = sourceStats
    .filter((s) => s.count > 0)
    .map((s) => {
      const segmentLength = (s.sharePercent / 100) * circumference;
      const strokeDasharray = `${Math.max(0, segmentLength - gap)} ${circumference}`;
      const strokeDashoffset = -currentOffset;
      currentOffset += segmentLength;

      return `
        <circle
          cx="${center}"
          cy="${center}"
          r="${radius}"
          fill="transparent"
          stroke="${s.color}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${strokeDasharray}"
          stroke-dashoffset="${strokeDashoffset}"
          stroke-linecap="round"
          class="donut-segment"
        >
          <title>${s.name}: ${s.count} (${s.sharePercent}%)</title>
        </circle>
      `;
    })
    .join("");

  return `
    <div class="donut-container">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="donut-svg">
        <!-- Background Track -->
        <circle
          cx="${center}"
          cy="${center}"
          r="${radius}"
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.05)"
          stroke-width="${strokeWidth}"
        />
        <!-- Colored Segments -->
        <g transform="rotate(-90 ${center} ${center})">
          ${paths}
        </g>
      </svg>
      <!-- Center Text -->
      <div class="donut-center-text">
        <div class="donut-center-number">${totalFindings}</div>
        <div class="donut-center-label">findings</div>
      </div>
    </div>
  `;
}

/**
 * Core engine: parses API response directly and computes all analytics
 */
export function parseAndCalculateMetrics(apiResponse, options = {}) {
  const rawResults = apiResponse.results || [];
  const totalSources = rawResults.length;

  // Normalized sources list
  const sources = rawResults.map((r, idx) => ({
    id: (r.source || `source-${idx}`).toLowerCase().replace(/\s+/g, "-"),
    rawSource: r.source || `Source ${idx + 1}`,
    name: formatSourceName(r.source),
    color: getSourceColor(r.source, idx),
    status: (r.status || "").toUpperCase(),
    evidence: r.evidence,
    data: r.data || {},
    message: r.message,
  }));

  // Helper to test if a string is a useless placeholder or redaction
  const isDummy = (val) => {
    if (!val || typeof val !== "string") return true;
    const t = val.trim();
    return (
      t === "" ||
      t === "//......." ||
      t === ".........." ||
      t === "user_name" ||
      t === "sim_name" ||
      /^[\.\/\s_-]+$/.test(t)
    );
  };

  // Find best unmasked and real values across sources
  let rawName = null;
  let rawPhone = options.searchedPhone || apiResponse.phone || null;
  let rawEmail = null;
  let rawSim = null;
  let rawAddress = null;

  sources.forEach((s) => {
    const d = s.data || {};
    if (d.name && !isDummy(d.name) && !rawName) rawName = d.name;
    if (d.phone && (!rawPhone || rawPhone.includes("*")) && !isDummy(d.phone)) rawPhone = d.phone;
    if (d.email && !isDummy(d.email) && !rawEmail) rawEmail = d.email;
    const simVal = d.sim || d.carrier;
    if (simVal && !isDummy(simVal) && !rawSim) rawSim = simVal;
    if (d.address && !isDummy(d.address) && !rawAddress) rawAddress = d.address;
  });

  // Clean unmasked phone for display if user searched a 10 digit number
  let displayUnmaskedPhone = rawPhone || "+91 98765 41641";
  if (options.searchedPhone) {
    const digitsOnly = options.searchedPhone.replace(/\D/g, "");
    if (digitsOnly.length >= 10) {
      const last10 = digitsOnly.slice(-10);
      displayUnmaskedPhone = `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
    }
  } else if (displayUnmaskedPhone && displayUnmaskedPhone.includes("*")) {
    displayUnmaskedPhone = "+91 98765 41641";
  }

  const topMaskedPhone = displayUnmaskedPhone;

  // Detail definition items matching the API response shape
  const DETAIL_DEFS = [
    {
      id: "name",
      label: "Name",
      unmasked: rawName || "",
      masked: rawName || "",
      check: (s) => s.status === "FOUND" && Boolean(s.data && s.data.name && !isDummy(s.data.name)),
    },
    {
      id: "phone",
      label: "Phone",
      unmasked: displayUnmaskedPhone || "",
      masked: displayUnmaskedPhone || "",
      // Rule: Phone counts as found whenever status is FOUND, since lookup was verified on this number
      check: (s) => s.status === "FOUND",
    },
    {
      id: "email",
      label: "Email",
      unmasked: rawEmail || "",
      masked: rawEmail || "",
      check: (s) => s.status === "FOUND" && Boolean(s.data && s.data.email && !isDummy(s.data.email)),
    },
    {
      id: "sim",
      label: "SIM",
      unmasked: rawSim || "",
      masked: rawSim || "",
      // Rule: SIM is taken from sim or from carrier
      check: (s) => s.status === "FOUND" && Boolean(s.data && (s.data.sim || s.data.carrier) && !isDummy(s.data.sim || s.data.carrier)),
    },
    {
      id: "address",
      label: "Address",
      unmasked: rawAddress || "",
      masked: rawAddress || "",
      check: (s) => s.status === "FOUND" && Boolean(s.data && s.data.address && !isDummy(s.data.address)),
    },
  ];

  const totalDetails = DETAIL_DEFS.length; // 5
  const totalPossible = totalSources * totalDetails; // e.g. 15

  // Calculate per-source and per-detail findings
  const findingsBySource = {};
  sources.forEach((s) => {
    findingsBySource[s.id] = 0;
  });

  const findingsByDetail = {};
  let detailsFoundCount = 0;

  const computedDetails = DETAIL_DEFS.map((def) => {
    let count = 0;
    const sourceStatusMap = {};

    sources.forEach((s) => {
      if (s.status === "FOUND") {
        const isFound = def.check(s);
        sourceStatusMap[s.id] = isFound ? "FOUND" : "NOT_FOUND";
        if (isFound) {
          count++;
          findingsBySource[s.id] = (findingsBySource[s.id] || 0) + 1;
        }
      } else if (s.status === "NOT_FOUND") {
        sourceStatusMap[s.id] = "NOT_FOUND";
      } else {
        // Any other status: "Couldn't check"
        sourceStatusMap[s.id] = "COULD_NOT_CHECK";
      }
    });

    if (count > 0) {
      detailsFoundCount++;
    }

    const percent = totalSources > 0 ? (count / totalSources) * 100 : 0;
    let severity = "low";
    if (percent >= 70) severity = "high";
    else if (percent >= 40) severity = "medium";

    findingsByDetail[def.id] = {
      label: def.label,
      count,
      totalSources,
      ratioStr: `${count}/${totalSources}`,
      percent,
      severity,
    };

    return {
      ...def,
      count,
      ratioStr: `${count}/${totalSources}`,
      percent,
      severity,
      sourceStatusMap,
    };
  });

  // Total findings across all sources
  const totalFindings = Object.values(findingsBySource).reduce((a, b) => a + b, 0);

  // Exposure score (0 - 100%)
  const exposureScore = totalPossible > 0 ? Math.round((totalFindings / totalPossible) * 100) : 0;

  // Exposure level
  let exposureLevel = "Low exposure";
  let exposureLevelKey = "low";
  if (totalFindings === 0 || detailsFoundCount === 0) {
    exposureLevel = "No exposure detected";
    exposureLevelKey = "clean";
  } else if (exposureScore >= 65 || detailsFoundCount >= 4) {
    exposureLevel = "High exposure";
    exposureLevelKey = "high";
  } else if (exposureScore >= 35 || detailsFoundCount >= 2) {
    exposureLevel = "Moderate exposure";
    exposureLevelKey = "medium";
  }

  // Most exposing source
  let mostExposingSource = { name: "None", count: 0, total: totalDetails };
  if (totalFindings > 0) {
    sources.forEach((s) => {
      const cnt = findingsBySource[s.id] || 0;
      if (cnt > mostExposingSource.count) {
        mostExposingSource = { name: s.name, count: cnt, total: totalDetails };
      }
    });
  }

  // Least exposed detail
  let leastExposedDetail = totalFindings === 0
    ? { label: "All details safe", count: 0, total: totalSources }
    : { label: computedDetails[0]?.label || "None", count: totalSources, total: totalSources };
  if (totalFindings > 0) {
    computedDetails.forEach((d) => {
      if (d.count <= leastExposedDetail.count) {
        leastExposedDetail = { label: d.label, count: d.count, total: totalSources };
      }
    });
  }

  // Source stats for Donut chart
  const sourceStats = sources.map((s) => {
    const count = findingsBySource[s.id] || 0;
    const sharePercent = totalFindings > 0 ? Math.round((count / totalFindings) * 100) : 0;
    return {
      ...s,
      count,
      sharePercent,
    };
  });

  return {
    sources,
    computedDetails,
    totalSources,
    totalDetails,
    totalPossible,
    totalFindings,
    detailsFoundCount,
    exposureScore,
    exposureLevel,
    exposureLevelKey,
    mostExposingSource,
    leastExposedDetail,
    findingsBySource,
    findingsByDetail,
    sourceStats,
    topMaskedPhone,
  };
}

/**
 * Main export: renderDataExposureReport
 * Directly takes apiResponse JSON and returns HTML string.
 */
export function renderDataExposureReport(apiResponse, options = { unmask: true }) {
  if (!apiResponse || !Array.isArray(apiResponse.results) || apiResponse.results.length === 0) {
    return `
      <div class="vismrit-report-wrapper" id="vismrit-report-wrapper">
        <header class="report-header">
          <div class="brand-left">
            <div class="brand-logo">
              <svg class="brand-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#6366f1"></path>
                <polyline points="9 12 11 14 15 10" stroke="#ffffff" stroke-width="2.5"></polyline>
              </svg>
            </div>
            <h1 class="brand-title">Vismrit</h1>
          </div>
        </header>

        <section class="vismrit-empty-card">
          <div class="empty-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 class="empty-title">No Search Results Found</h2>
          <p class="empty-desc">We could not find any active data records for this query. The scanned scrapers returned no matching records.</p>
        </section>

        <footer class="report-bottom-nav">
          <button type="button" class="btn-back-bottom" id="btn-back-home" title="Back" aria-label="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back</span>
          </button>
        </footer>
      </div>
    `;
  }

  const metrics = parseAndCalculateMetrics(apiResponse, options);
  const { sources, computedDetails } = metrics;
  const isUnmasked = options.unmask !== false;

  const scannedDate = formatReportDate(apiResponse.searchedAt);
  const headline = `${metrics.detailsFoundCount} of ${metrics.totalDetails} details found`;
  const exposedSourcesCount = sources.filter((s) => (metrics.findingsBySource[s.id] || 0) > 0).length;
  const subtitle = exposedSourcesCount === metrics.totalSources
    ? `Your information appears in all ${metrics.totalSources} sources we checked.`
    : exposedSourcesCount > 0
      ? `Your information appears in ${exposedSourcesCount} of ${metrics.totalSources} sources we checked.`
      : `No personal data was found across the ${metrics.totalSources} sources we checked.`;

  // 1. Donut Legend HTML
  const donutLegendHtml = metrics.sourceStats
    .map(
      (s) => `
      <div class="legend-row">
        <div class="legend-info">
          <span class="legend-dot" style="background-color: ${s.color};"></span>
          <span class="legend-name">${s.name}</span>
        </div>
        <div class="legend-stats">
          <span class="legend-count">${s.count}</span>
          <span class="legend-bullet">•</span>
          <span class="legend-percent">${s.sharePercent}%</span>
        </div>
      </div>
    `
    )
    .join("");

  // 2. Exposure by detail bars HTML
  const exposureBarsHtml = computedDetails
    .map((d) => {
      const severityClass = `bar-${d.severity}`;
      return `
        <div class="exposure-detail-row">
          <div class="exposure-detail-name">${d.label}</div>
          <div class="exposure-progress-track">
            <div class="exposure-progress-fill ${severityClass}" style="width: ${d.percent}%"></div>
          </div>
          <div class="exposure-detail-ratio">${d.ratioStr}</div>
        </div>
      `;
    })
    .join("");

  // 3. Table Header Source Columns
  const tableHeadersHtml = sources
    .map(
      (s) => `
        <th class="col-center">
          <div class="source-header-cell">
            <span class="source-name-text">${s.name.toUpperCase()}</span>
          </div>
        </th>
      `
    )
    .join("");

  // 4. Table Body Rows
  const tableRowsHtml = computedDetails
    .map((d) => {
      const iconSvg = getDetailIcon(d.id);
      const displayValue = d.count > 0 && d.unmasked ? d.unmasked : "—";

      const sourceColsHtml = sources
        .map((s) => {
          const status = d.sourceStatusMap[s.id];

          if (status === "FOUND") {
            return `
              <td class="col-center">
                <span class="check-badge" title="Found in ${s.name}">
                  <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
              </td>
            `;
          } else if (status === "NOT_FOUND") {
            return `
              <td class="col-center">
                <span class="dash-indicator" title="Not found in ${s.name}">—</span>
              </td>
            `;
          } else {
            // Status was not FOUND or NOT_FOUND (e.g. error, blocked, session expired)
            return `
              <td class="col-center">
                <span class="couldnt-check-badge" title="Could not check ${s.name}: Scraper error or session expired">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="warning-mini-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  Couldn’t check
                </span>
              </td>
            `;
          }
        })
        .join("");

      return `
        <tr class="report-table-row">
          <td class="col-detail">
            <div class="detail-name-wrap">
              ${iconSvg}
              <span>${d.label}</span>
            </div>
          </td>
          <td class="col-value">
            <span class="found-value ${isUnmasked ? "unmasked" : "masked"}">${displayValue}</span>
          </td>
          ${sourceColsHtml}
        </tr>
      `;
    })
    .join("");

  // 5. Table Footer Total Row
  const tableFootersHtml = sources
    .map((s) => {
      const count = metrics.findingsBySource[s.id] || 0;
      return `<td class="col-center col-total-count">${count} of ${metrics.totalDetails}</td>`;
    })
    .join("");

  return `
    <div class="vismrit-report-wrapper" id="vismrit-report-wrapper">
      <!-- Top Brand Header -->
      <header class="report-header">
        <div class="brand-left">
          <div class="brand-logo">
            <svg class="brand-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#6366f1"></path>
              <polyline points="9 12 11 14 15 10" stroke="#ffffff" stroke-width="2.5"></polyline>
            </svg>
          </div>
          <h1 class="brand-title">Vismrit</h1>
        </div>

        <div class="header-actions-right">
          ${
            metrics.totalFindings > 0
              ? `<button type="button" class="btn-start-removal" id="btn-start-removal" title="Start digital footprint removal workflow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  Start removal
                </button>`
              : `<div class="status-clean-badge" title="No exposure detected across scanned sources">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <polyline points="9 12 11 14 15 10"></polyline>
                  </svg>
                  <span>All Clean</span>
                </div>`
          }
        </div>
      </header>

      <!-- Main Headline Banner -->
      <section class="headline-banner">
        <div class="headline-tag">YOUR DATA EXPOSURE REPORT</div>
        <div class="headline-title-row">
          <h2 class="headline-title">${headline}</h2>
          <span class="exposure-badge badge-${metrics.exposureLevelKey}">
            <span class="badge-dot"></span>
            ${metrics.exposureLevel}
          </span>
        </div>
      </section>

      <!-- 4 Top KPI Metric Cards -->
      <section class="kpi-grid">
        <!-- KPI 1: Exposure score -->
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Exposure score</span>
            <div class="kpi-icon-wrap icon-score">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-value">${metrics.exposureScore}%</div>
          <div class="kpi-bar-track">
            <div class="kpi-bar-fill bar-score" style="width: ${metrics.exposureScore}%"></div>
          </div>
          <div class="kpi-subtext">${metrics.totalFindings} of ${metrics.totalPossible} possible</div>
        </div>

        <!-- KPI 2: Total findings -->
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Total findings</span>
            <div class="kpi-icon-wrap icon-layers">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </div>
          </div>
          <div class="kpi-value">${metrics.totalFindings}</div>
          <div class="kpi-subtext">across ${metrics.totalSources} sources</div>
        </div>

        <!-- KPI 3: Most exposing source -->
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Most exposing source</span>
            <div class="kpi-icon-wrap icon-globe">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-value kpi-highlight-name">${metrics.mostExposingSource.name}</div>
          <div class="kpi-subtext">${metrics.mostExposingSource.count} of ${metrics.mostExposingSource.total} details</div>
        </div>

        <!-- KPI 4: Least exposed detail -->
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Least exposed detail</span>
            <div class="kpi-icon-wrap icon-lock">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-value kpi-highlight-name">${metrics.leastExposedDetail.label}</div>
          <div class="kpi-subtext">${metrics.leastExposedDetail.count} of ${metrics.leastExposedDetail.total} sources</div>
        </div>
      </section>

      <!-- Middle 2 Analytics Cards -->
      <section class="analytics-grid">
        <!-- Findings by source (Donut) -->
        <div class="analytics-card">
          <h3 class="card-title">Findings by source</h3>
          <div class="donut-section-body">
            ${generateDonutChartSvg(metrics.sourceStats, metrics.totalFindings)}
            <div class="donut-legend-wrap">
              ${donutLegendHtml}
            </div>
          </div>
        </div>

        <!-- Exposure by detail (Progress Bars) -->
        <div class="analytics-card">
          <h3 class="card-title">Exposure by detail</h3>
          <div class="exposure-bars-body">
            ${exposureBarsHtml}
          </div>
          <div class="exposure-bars-caption">Number of sources where each detail appears.</div>
        </div>
      </section>

      <!-- Bottom Findings Table -->
      <section class="table-card">
        <div class="table-scroll-container">
          <table class="report-table">
            <thead>
              <tr>
                <th class="col-detail">DETAIL</th>
                <th class="col-value">WHAT WE FOUND</th>
                ${tableHeadersHtml}
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
            <tfoot>
              <tr class="table-footer-row">
                <td class="col-detail">Total found</td>
                <td class="col-value"></td>
                ${tableFootersHtml}
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <!-- Bottom Navigation (Back) -->
      <footer class="report-bottom-nav">
        <button type="button" class="btn-back-bottom" id="btn-back-home" title="Back" aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back</span>
        </button>
      </footer>
    </div>
  `;
}
