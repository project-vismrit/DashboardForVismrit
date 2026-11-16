/**
 * sampleResponse.js
 * Default sample payload matching the exact JSON shape from your scraper API.
 * Features Truecaller, GetContact, and Justdial.
 */

// Sample mock SVG evidence card for Truecaller
const SAMPLE_EVIDENCE_TRUECALLER = 
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
      <rect width="600" height="380" rx="16" fill="#0f172a"/>
      <rect x="20" y="20" width="560" height="340" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <circle cx="80" cy="80" r="32" fill="#0284c7"/>
      <text x="80" y="88" font-family="-apple-system, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">TC</text>
      <text x="130" y="75" font-family="-apple-system, sans-serif" font-size="20" font-weight="bold" fill="#f8fafc">user_name</text>
      <text x="130" y="98" font-family="-apple-system, sans-serif" font-size="14" fill="#38bdf8">Truecaller Verified Profile</text>
      <line x1="40" y1="135" x2="560" y2="135" stroke="#334155" stroke-width="1"/>
      <text x="50" y="175" font-family="-apple-system, sans-serif" font-size="12" fill="#94a3b8">PHONE / CALLER ID</text>
      <text x="50" y="200" font-family="-apple-system, sans-serif" font-size="16" font-weight="600" fill="#f1f5f9">+91 98765 41641</text>
      <text x="50" y="245" font-family="-apple-system, sans-serif" font-size="12" fill="#94a3b8">ADDRESS</text>
      <text x="50" y="270" font-family="-apple-system, sans-serif" font-size="16" font-weight="600" fill="#f1f5f9">..........</text>
      <text x="320" y="175" font-family="-apple-system, sans-serif" font-size="12" fill="#94a3b8">CARRIER / SIM</text>
      <text x="320" y="200" font-family="-apple-system, sans-serif" font-size="16" font-weight="600" fill="#f1f5f9">sim_name</text>
      <text x="320" y="245" font-family="-apple-system, sans-serif" font-size="12" fill="#94a3b8">EMAIL</text>
      <text x="320" y="270" font-family="-apple-system, sans-serif" font-size="16" font-weight="600" fill="#f1f5f9">//.......</text>
      <rect x="40" y="305" width="520" height="36" rx="8" fill="#0369a1" fill-opacity="0.2" stroke="#0284c7" stroke-width="1"/>
      <text x="55" y="328" font-family="-apple-system, sans-serif" font-size="13" fill="#38bdf8">🛡️ Evidence captured automatically by VisMrit scraper session</text>
    </svg>
  `);

// Sample mock SVG evidence card for GetContact
const SAMPLE_EVIDENCE_GETCONTACT = 
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
      <rect width="600" height="380" rx="16" fill="#0b1329"/>
      <rect x="20" y="20" width="560" height="340" rx="12" fill="#111c38" stroke="#1d2d54" stroke-width="1.5"/>
      <rect x="50" y="45" width="125" height="28" rx="14" fill="#38bdf8" fill-opacity="0.15" stroke="#38bdf8" stroke-width="1"/>
      <text x="112" y="64" font-family="-apple-system, sans-serif" font-size="12" font-weight="bold" fill="#38bdf8" text-anchor="middle">GETCONTACT</text>
      <text x="50" y="110" font-family="-apple-system, sans-serif" font-size="22" font-weight="bold" fill="#ffffff">Identity & Community Tags</text>
      <line x1="50" y1="130" x2="550" y2="130" stroke="#1d2d54" stroke-width="1"/>
      
      <text x="50" y="165" font-family="-apple-system, sans-serif" font-size="12" fill="#94a3b8">NAME</text>
      <text x="50" y="190" font-family="-apple-system, sans-serif" font-size="16" font-weight="600" fill="#f1f5f9">user_name</text>
      
      <text x="300" y="165" font-family="-apple-system, sans-serif" font-size="12" fill="#94a3b8">SIM / NETWORK</text>
      <text x="300" y="190" font-family="-apple-system, sans-serif" font-size="16" font-weight="600" fill="#f1f5f9">sim_name</text>
      
      <text x="50" y="235" font-family="-apple-system, sans-serif" font-size="12" fill="#94a3b8">POPULAR TAGS</text>
      <rect x="50" y="250" width="110" height="28" rx="6" fill="#1e293b"/>
      <text x="105" y="269" font-family="-apple-system, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle"># user_name</text>
      
      <rect x="170" y="250" width="90" height="28" rx="6" fill="#1e293b"/>
      <text x="215" y="269" font-family="-apple-system, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle"># sim_name</text>
      
      <rect x="40" y="305" width="520" height="36" rx="8" fill="#0284c7" fill-opacity="0.15" stroke="#38bdf8" stroke-width="1"/>
      <text x="55" y="328" font-family="-apple-system, sans-serif" font-size="13" fill="#38bdf8">🛡️ Evidence captured automatically by VisMrit scraper session</text>
    </svg>
  `);

export const SAMPLE_API_RESPONSE = {
  phone: "+91 ****1641",
  searchedAt: "2026-10-26T06:12:37.014Z",
  results: [
    {
      source: "truecaller",
      status: "FOUND",
      data: {
        name: "user_name",
        carrier: "sim_name",
        address: "..........",
        email: "//.......",
      },
      evidence: {
        mimeType: "image/svg+xml",
        dataUrl: SAMPLE_EVIDENCE_TRUECALLER,
      },
      searchedAt: "2026-10-26T06:12:03.833Z",
      message: null,
    },
    {
      source: "getcontact",
      status: "FOUND",
      data: {
        name: "user_name",
        sim: "sim_name",
      },
      evidence: {
        mimeType: "image/svg+xml",
        dataUrl: SAMPLE_EVIDENCE_GETCONTACT,
      },
      searchedAt: "2026-10-26T06:12:18.757Z",
      message: null,
    },
    {
      source: "justdial",
      status: "NOT_FOUND",
      data: {
        name: null,
        phone: null,
        address: null,
      },
      evidence: null,
      searchedAt: "2026-10-26T06:12:37.014Z",
      message: "No results found for this number on JustDial.",
    },
  ],
};
