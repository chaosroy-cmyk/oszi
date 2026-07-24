#!/usr/bin/env node
/* Datenvalidierung des Kompendiums (headless).
 *
 *   npm i -D playwright            # einmalig
 *   node tools/validate.js         # prüft ../index.html
 *
 * Lädt index.html?validate im Browser, ruft window.validateKompendium() auf
 * und beendet mit Exit-Code 1, wenn strukturelle Fehler oder Laufzeitfehler
 * gefunden werden. CHROME_PATH kann einen Chromium-Pfad überschreiben.
 */
"use strict";
const path = require("path");
let chromium;
try { ({ chromium } = require("playwright")); }
catch (e) { console.error("Playwright fehlt – bitte 'npm i -D playwright' ausführen."); process.exit(2); }

(async () => {
  const exe = process.env.CHROME_PATH;
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage();
  const runtime = [];
  page.on("pageerror", e => runtime.push("Laufzeitfehler: " + e.message));
  page.on("console", m => { if (m.type() === "error") runtime.push("Console: " + m.text()); });

  const file = "file://" + path.resolve(__dirname, "..", "index.html") + "?validate";
  await page.goto(file, { waitUntil: "networkidle" });
  const r = await page.evaluate(() => (typeof window.validateKompendium === "function" ? window.validateKompendium() : null));
  await browser.close();

  if (!r) { console.error("validateKompendium() nicht verfügbar."); process.exit(2); }
  console.log(`Karten: ${r.cards} · Fehlerbilder: ${r.fdb} · Glossar: ${r.gloss}`);
  r.warnings.forEach(w => console.warn("  ! " + w));
  r.errors.forEach(e => console.error("  ✗ " + e));
  runtime.forEach(e => console.error("  ✗ " + e));
  const fail = r.errors.length + runtime.length;
  console.log(fail ? `FEHLGESCHLAGEN – ${fail} Fehler` : "OK – keine Fehler");
  process.exit(fail ? 1 : 0);
})();
