#!/usr/bin/env node
/* Datenvalidierung des Kompendiums (headless).
 *
 *   npm i -D playwright            # einmalig
 *   node tools/validate.js         # prüft ../index.html
 *
 * Lädt index.html im Browser. Existiert window.validateKompendium(), wird dessen
 * strukturierter Report genutzt; sonst greift ein Smoke-Test über die globalen
 * Arrays KARTEN/FEHLERDB/GLOSSAR (Top-Level-var ⇒ window.*) plus die Prüfung auf
 * Laufzeit-/Console-Fehler. Exit-Code 1 bei strukturellen oder Laufzeitfehlern,
 * 2 wenn Playwright fehlt. CHROME_PATH kann einen Chromium-Pfad überschreiben.
 */
"use strict";
const path = require("path");
let chromium;
try { ({ chromium } = require("playwright")); }
catch (e) { console.error("Playwright fehlt – bitte 'npm i -D playwright' ausführen."); process.exit(2); }

(async () => {
  const exe = process.env.CHROME_PATH || process.env.PLAYWRIGHT_CHROMIUM_PATH;
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage();
  const runtime = [];
  page.on("pageerror", e => runtime.push("Laufzeitfehler: " + e.message));
  page.on("console", m => { if (m.type() === "error") runtime.push("Console: " + m.text()); });

  const file = "file://" + path.resolve(__dirname, "..", "index.html") + "?validate";
  await page.goto(file, { waitUntil: "networkidle" });

  const r = await page.evaluate(() => {
    if (typeof window.validateKompendium === "function") return window.validateKompendium();
    // Fallback-Smoke-Test (v9 hat kein validateKompendium()):
    const errors = [], warnings = [];
    const K = window.KARTEN, F = window.FEHLERDB, G = window.GLOSSAR;
    if (!Array.isArray(K) || !K.length) errors.push("KARTEN fehlt oder leer");
    if (!Array.isArray(F)) warnings.push("FEHLERDB fehlt");
    if (!Array.isArray(G)) warnings.push("GLOSSAR fehlt");
    if (Array.isArray(K)) {
      const ids = new Set();
      K.forEach((c, i) => {
        if (!c || !c.id) errors.push("Karte #" + i + " ohne id");
        else { if (ids.has(c.id)) errors.push("doppelte id: " + c.id); ids.add(c.id); }
        if (c && c.id && !(Array.isArray(c.gut) && c.gut.length)) warnings.push("Karte " + c.id + " ohne gut[]");
      });
    }
    return {
      cards: Array.isArray(K) ? K.length : 0,
      fdb: Array.isArray(F) ? F.length : 0,
      gloss: Array.isArray(G) ? G.length : 0,
      warnings, errors, mode: "smoke"
    };
  });
  await browser.close();

  if (!r) { console.error("Weder validateKompendium() noch KARTEN verfügbar."); process.exit(2); }
  console.log(`Karten: ${r.cards} · Fehlerbilder: ${r.fdb} · Glossar: ${r.gloss}` + (r.mode === "smoke" ? " (Smoke-Test)" : ""));
  (r.warnings || []).forEach(w => console.warn("  ! " + w));
  (r.errors || []).forEach(e => console.error("  ✗ " + e));
  runtime.forEach(e => console.error("  ✗ " + e));
  const fail = (r.errors ? r.errors.length : 0) + runtime.length;
  console.log(fail ? `FEHLGESCHLAGEN – ${fail} Fehler` : "OK – keine Fehler");
  process.exit(fail ? 1 : 0);
})();
