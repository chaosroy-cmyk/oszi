#!/usr/bin/env node
/* Prüfung des Planetengetriebe-Lernmodells (headless).
 *
 *   npm i -D playwright                  # einmalig
 *   node tools/validate-planeten.js      # prüft ../planetengetriebe/index.html
 *
 * Rechnet alle Übersetzungen gegen die Formeln nach (Willis-Gleichung, Simpson-Satz),
 * prüft Montagebedingungen der Zähnezahlen, klickt alle Schaltzustände durch und
 * meldet Laufzeitfehler. Exit-Code 1 bei Fehlern. CHROME_PATH überschreibt den Browser.
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

  await page.goto("file://" + path.resolve(__dirname, "..", "planetengetriebe", "index.html"));
  const r = await page.evaluate(() => (typeof window.validatePlanetengetriebe === "function" ? window.validatePlanetengetriebe() : null));
  if (!r) { console.error("validatePlanetengetriebe() nicht verfügbar."); await browser.close(); process.exit(2); }

  // Alle Bedienzustände einmal durchschalten
  for (const z of ["18", "24", "30", "36"]) await page.click(`#sel-z button[data-v="${z}"]`);
  for (const f of ["S", "T", "H", "block", "none"]) {
    await page.click(`#sel-fix button[data-v="${f}"]`);
    for (const a of ["S", "T", "H"]) {
      const b = page.locator(`#sel-in button[data-v="${a}"]`);
      if (await b.isEnabled()) await b.click();
    }
  }
  await page.click("#tab-auto");
  for (const g of ["P", "R", "N", "D1", "D2", "D3", "L"]) await page.click(`#matrix tr[data-g="${g}"]`);
  await page.check("#auto");
  await page.waitForTimeout(500);
  await page.click("#tab-wissen");
  await page.click('#quiz button[data-q="0"][data-o="0"]');
  await browser.close();

  const errors = r.errors.concat(runtime);
  if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
  console.log("Planetengetriebe: alle Prüfungen bestanden.");
})();
