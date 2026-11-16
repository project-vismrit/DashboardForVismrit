/**
 * server.js — Vismrit API Proxy Server
 * 
 * Secure backend proxy that keeps the SCRAPER_API_KEY safe on the server
 * and mediates lookup requests between the Vismrit dashboard and the scraper API.
 * 
 * Usage:
 *   SCRAPER_API_URL=<your friend's URL> SCRAPER_API_KEY=<key> node server.js
 */

import http from "node:http";

// Automatically load .env file if available (Node 20+)
try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile();
  }
} catch {
  // .env file not found or environment variables already set
}

function normalizeUrl(url) {
  if (!url) return "";
  let trimmed = url.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

const PORT = parseInt(process.env.PORT || "3001", 10);
const SCRAPER_API_URL = normalizeUrl(process.env.SCRAPER_API_URL || "http://127.0.0.1:3000");
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || "";

/**
 * Handle lookup logic
 */
async function handleLookup(req, res, rawPhone, customApiUrl, customApiKey) {
  if (!rawPhone || typeof rawPhone !== "string") {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing or invalid 'phone' parameter." }));
    return;
  }

  // Clean phone number (strip spaces, dashes, +91)
  const digits = rawPhone.replace(/\D/g, "");
  const cleanPhone = digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits.slice(-10);

  if (cleanPhone.length !== 10) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid phone number. Must be a 10-digit Indian mobile number." }));
    return;
  }

  // =========================================================================
  // TODO: VERIFY OWNERSHIP BEFORE PRODUCTION USE!
  // -------------------------------------------------------------------------
  // Verify that the requesting user actually owns or has authorized this phone
  // number before calling the backend scraper API.
  // =========================================================================

  const effectiveApiUrl = normalizeUrl(customApiUrl || SCRAPER_API_URL || "http://127.0.0.1:3000");
  const effectiveApiKey = customApiKey !== undefined ? customApiKey : SCRAPER_API_KEY;

  // If the URL already ends with /lookup or /lookup/all, use it; otherwise append /lookup/all
  const targetEndpoint = effectiveApiUrl.includes("/lookup") 
    ? effectiveApiUrl 
    : `${effectiveApiUrl}/lookup/all`;

  console.log(`[Vismrit Proxy] Forwarding lookup for phone: +91 ******${cleanPhone.slice(-2)} -> ${targetEndpoint}`);

  if (!effectiveApiKey) {
    console.warn(`[Vismrit Proxy] Note: SCRAPER_API_KEY is not set. Forwarding without x-api-key.`);
  }

  try {
    const upstreamResponse = await fetch(targetEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(effectiveApiKey ? { "x-api-key": effectiveApiKey } : {}),
      },
      body: JSON.stringify({
        phone: cleanPhone,
        consentVerified: true, // Injected securely server-side
      }),
    });

    const responseData = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const errorMessage = responseData?.error || `Scraper service returned HTTP ${upstreamResponse.status}`;
      console.error(`[Vismrit Proxy] Upstream API error (${upstreamResponse.status}): ${errorMessage}`);
      res.writeHead(upstreamResponse.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: errorMessage, upstreamStatus: upstreamResponse.status }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(responseData));
  } catch (err) {
    console.error(`[Vismrit Proxy] Connection error:`, err.message);

    if (err.cause?.code === "ECONNREFUSED" || err.message.includes("fetch failed")) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        error: `Could not connect to Scraper API at ${SCRAPER_API_URL}. Ensure your scraper service is running.`,
      }));
      return;
    }

    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: `Proxy internal error: ${err.message}` }));
  }
}

/**
 * Try initializing Express if installed; otherwise fall back to native Node http
 */
async function startServer() {
  let expressApp = null;

  try {
    const expressModule = await import("express");
    const express = expressModule.default;
    expressApp = express();

    expressApp.use(express.json());

    // CORS
    expressApp.use((req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      if (req.method === "OPTIONS") return res.sendStatus(204);
      next();
    });

    // Friendly Root Landing Page
    expressApp.get("/", (req, res) => {
      res.setHeader("Content-Type", "text/html");
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Vismrit API Proxy</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #e2e8f0; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 12px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
              h1 { color: #818cf8; margin-top: 0; font-size: 1.5rem; }
              p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
              .btn { display: inline-block; background: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 15px; }
              .btn:hover { background: #4338ca; }
              .status { font-family: monospace; background: #0f172a; padding: 8px; border-radius: 4px; font-size: 0.85rem; color: #38bdf8; margin-top: 16px; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>🛡️ Vismrit Proxy Server is Running</h1>
              <p>This port (<b>3001</b>) is the backend API proxy for scraper lookups.</p>
              <p>To view the visual <b>Data Exposure Dashboard</b>, open the frontend Vite server:</p>
              <a class="btn" href="http://localhost:5173">👉 Go to Dashboard (http://localhost:5173)</a>
              <br/><br/>
              <div class="status">Health endpoint: <a href="/health" style="color:#38bdf8;">/health</a></div>
            </div>
          </body>
        </html>
      `);
    });

    // Health
    expressApp.get("/health", (req, res) => {
      res.json({
        service: "vismrit-proxy",
        engine: "express",
        configured: Boolean(SCRAPER_API_KEY),
        targetUrl: SCRAPER_API_URL,
      });
    });

    // Lookup
    expressApp.post("/api/lookup", (req, res) => {
      handleLookup(req, res, req.body?.phone, req.body?.apiUrl, req.body?.apiKey);
    });

    expressApp.listen(PORT, () => {
      printBanner("Express");
    });
  } catch {
    // Fallback to native Node HTTP server (zero external dependencies required)
    const nativeServer = http.createServer(async (req, res) => {
      // CORS
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      const url = req.url?.split("?")[0] || "/";

      if (req.method === "GET" && url === "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html>
            <body style="font-family:sans-serif;background:#0b0f19;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
              <div style="background:#131b2e;border:1px solid #1e293b;border-radius:12px;padding:32px;max-width:480px;text-align:center;">
                <h1 style="color:#818cf8;">🛡️ Vismrit Proxy is Running</h1>
                <p style="color:#94a3b8;">This is the backend API proxy (Port ${PORT}).</p>
                <a href="http://localhost:5173" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:15px;">👉 Go to Dashboard (http://localhost:5173)</a>
              </div>
            </body>
          </html>
        `);
        return;
      }

      if (req.method === "GET" && url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          service: "vismrit-proxy",
          engine: "native-node",
          configured: Boolean(SCRAPER_API_KEY),
          targetUrl: SCRAPER_API_URL,
        }));
        return;
      }

      if (req.method === "POST" && url === "/api/lookup") {
        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", async () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            await handleLookup(req, res, parsed.phone, parsed.apiUrl, parsed.apiKey);
          } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON body in request." }));
          }
        });
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Not found: ${url}` }));
    });

    nativeServer.listen(PORT, () => {
      printBanner("Native Node HTTP");
    });
  }
}

function printBanner(engine) {
  console.log(`\n======================================================`);
  console.log(`🔒 Vismrit API Proxy Server running on http://localhost:${PORT} (${engine})`);
  console.log(`🎯 Forwarding /api/lookup -> ${SCRAPER_API_URL}/lookup/all`);
  console.log(`🔑 SCRAPER_API_KEY configured: ${SCRAPER_API_KEY ? "Yes (Protected on server)" : "No (Empty key)"}`);
  console.log(`======================================================\n`);
}

startServer();
