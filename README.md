# 🛡️ Vismrit — Data Exposure Report Dashboard

A dark cybersecurity privacy auditing dashboard built directly for **Vismrit** and backend scraper APIs (Truecaller, Justdial, GetContact, etc.).

---

## 📁 File Structure

```
Analysis_report/
├── index.html              # Main HTML entry with Phone box, Look up, Reveal data, and Print buttons
├── server.js               # Proxy server holding the API key securely on the server
├── vite.config.js          # Vite configuration with /api proxy to http://localhost:3001
├── package.json            # Scripts & dependencies
├── .env.example            # Environment variables template
└── src/
    ├── app.js              # Application logic, lookup caller, masking toggle, and event listeners
    ├── reportGenerator.js  # Core engine parsing API response JSON directly and generating metrics & UI
    ├── report.css          # Dark cybersecurity theme matching the dashboard reference
    └── sampleResponse.js   # Default sample response matching your friend's API JSON shape
```

---

## 🚀 How to Run

### 1. Start the Proxy Server

The proxy keeps your `SCRAPER_API_KEY` secure on the server and forwards lookups to your scraper API:

```bash
# Optional: install express (runs with built-in Node HTTP if omitted)
npm install express

# Start with environment variables:
# On Linux / macOS / Git Bash:
SCRAPER_API_URL=http://127.0.0.1:3000 SCRAPER_API_KEY=your_key node server.js

# On Windows PowerShell:
$env:SCRAPER_API_URL="http://127.0.0.1:3000"; $env:SCRAPER_API_KEY="your_key"; node server.js
```

The proxy starts on port **`3001`** by default.

### 2. Start the Frontend Dashboard (Vite)

In a separate terminal:

```bash
npm run dev
# or: npx vite
```

Open your browser at **`http://localhost:5173`**.

---

## ⚡ How It Works

1. **Default State**:
   - Until the first lookup, the dashboard renders the default sample response from `src/sampleResponse.js` matching the exact 80% exposure layout.
2. **User Lookup**:
   - The user enters an Indian phone number and clicks **Look up**.
   - The browser calls `/api/lookup` (proxied to `http://localhost:3001`).
   - `server.js` adds `x-api-key: SCRAPER_API_KEY`, verifies format, sets `consentVerified: true`, and forwards the request to `${SCRAPER_API_URL}/lookup/all`.
   - The returned JSON response is passed straight into `renderDataExposureReport()`.
3. **Data Masking**:
   - Personal names, emails, addresses, and SIM details are masked by default (`A*** K***`, `a***@gmail.com`, etc.).
   - Clicking **Reveal data** toggles the display between masked and unmasked details.
4. **Status Reliability**:
   - `FOUND` displays a red confirmation checkmark badge.
   - `NOT_FOUND` displays a dash `—`.
   - Any other status (`ERROR`, `SESSION_EXPIRED`, `BLOCKED`, `TIMEOUT`) displays **"Couldn’t check"**, ensuring failed scrapers are never misread as clean.
5. **Dynamic Sources**:
   - Sources are derived dynamically from `results`. Adding a 4th or 5th source in the backend requires no frontend code changes.
6. **Screenshot Evidence**:
   - Sources containing screenshot evidence display an **Evidence** button that opens a lightbox image modal.
7. **Removal Workflow**:
   - Clicking **Start removal** dispatches the custom browser event `vismrit:start-removal` containing the phone number and exposed sources.

---

## 🔒 Security Checklist Before Production

1. **Keep the API key on the server**:
   - The API key is stored exclusively in `server.js` (via `process.env.SCRAPER_API_KEY`). The browser client never touches or requests the secret key.
2. **Verify User Ownership (`server.js`)**:
   - In `server.js`, locate the `TODO: VERIFY OWNERSHIP BEFORE PRODUCTION USE!` comment.
   - Implement an ownership check (e.g., SMS OTP verification, Twilio/Firebase Auth, or authenticated session check) before calling the backend scraper API.
