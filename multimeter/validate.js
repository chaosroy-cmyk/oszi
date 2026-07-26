/* validate.js – Abnahmevalidierung der KFZ-Multimeter-PWA (v7.4)
   Aufruf:  cd multimeter && npm i --no-save jsdom && node validate.js
   Prüft die 11 Abnahmepunkte des v7.4-Auftrags gegen die echte Render-Logik. */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const HTML = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const SW = fs.readFileSync(path.join(__dirname, "sw.js"), "utf8");

let failed = 0, passed = 0;
function ok(name, cond, detail) {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ " + name + (detail ? "  → " + detail : "")); }
}
function section(t) { console.log("\n== " + t + " =="); }
const notes = [];
function note(msg) { notes.push(msg); }

const jsdomErrors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", e => {
  if (!/Not implemented/.test(String(e.message || e))) jsdomErrors.push(String(e.message || e));
});
vc.on("error", () => {});

const dom = new JSDOM(HTML, {
  runScripts: "dangerously",
  url: "https://example.test/multimeter/index.html",
  virtualConsole: vc,
  pretendToBeVisual: true
});
const w = dom.window, d = w.document;

(async () => {
  section("1 · Laden ohne Laufzeitfehler");
  ok("keine JS-Fehler beim Laden", jsdomErrors.length === 0, jsdomErrors.join(" | "));

  const TESTS = w.eval("TESTS"), DEEP = w.eval("DEEP"), TREES = w.eval("TREES"),
        CATS = w.eval("CATS"), GLOSS = w.eval("GLOSS"), FUSE_R = w.eval("FUSE_R");

  section("2 · Datenintegrität");
  const ids = new Set(); let dup = [];
  TESTS.forEach(t => { if (ids.has(t.id)) dup.push(t.id); ids.add(t.id); });
  ok("keine doppelten IDs (" + TESTS.length + " Prüfungen)", dup.length === 0, dup.join(","));
  const badCat = TESTS.filter(t => !CATS.some(c => c.id === t.cat)).map(t => t.id);
  ok("jede cat existiert in CATS", badCat.length === 0, badCat.join(","));
  const orphanDeep = Object.keys(DEEP).filter(k => !ids.has(k));
  ok("jeder DEEP-Key hat eine Prüfung (" + Object.keys(DEEP).length + " Keys)", orphanDeep.length === 0, orphanDeep.join(","));

  section("3 · Jede Detailansicht rendert sauber");
  let renderBad = [];
  TESTS.forEach(t => {
    try {
      w.openDetail(t.id);
      const html = d.getElementById("ovbody").innerHTML;
      if (html.includes("undefined") || html.includes("[object")) renderBad.push(t.id + ":Platzhalter");
    } catch (e) { renderBad.push(t.id + ":" + e.message); }
  });
  ok("alle " + TESTS.length + " Detailansichten fehlerfrei, ohne undefined/[object", renderBad.length === 0, renderBad.join(","));
  w.doCloseOverlays();

  section("4 · Konventionen (gegen Renderer geprüft)");
  let e4 = [];
  TESTS.forEach(t => {
    (t.warn || []).forEach(x => { if (!["danger","caution","info"].includes(x[0])) e4.push(t.id + " warn:" + x[0]); });
    if (t.table) t.table.rows.forEach((r,i) => { if (r.length !== t.table.head.length) e4.push(t.id + " table Zeile " + i); });
  });
  Object.entries(DEEP).forEach(([k,dd]) => {
    (dd.urs || []).forEach((u,i) => { if (!["h","m","s"].includes(u[2])) e4.push("DEEP " + k + " urs " + i + ":" + u[2]); });
    if (dd.rt) dd.rt.rows.forEach((r,i) => { if (r.length !== dd.rt.head.length) e4.push("DEEP " + k + " rt Zeile " + i); });
    if (dd.rt2) dd.rt2.rows.forEach((r,i) => { if (r.length !== dd.rt2.head.length) e4.push("DEEP " + k + " rt2 Zeile " + i); });
    // Konvention 6: DEEP.rt verdrängt TESTS.table. Beides gleichzeitig ist die
    // etablierte Fallback-Schreibweise des Tools – kein Fehler, aber tote Daten.
    { const t = TESTS.find(x => x.id === k); if (t && t.table && dd.rt) note("DEEP " + k + ": TESTS.table wird von rt verdeckt"); }
    (dd.fs || []).forEach((f,i) => { if (!f.s || !f.do) e4.push("DEEP " + k + " fs " + i + " ohne s/do"); });
  });
  ok("Warn-Typen, urs-Gewichte, Tabellen-Spalten, fs-Pflichtfelder", e4.length === 0, e4.slice(0,5).join(" ; "));

  section("5 · Diagnosebäume");
  let e5 = [];
  Object.entries(TREES).forEach(([k,tr]) => {
    const reach = new Set([tr.start]); const stack = [tr.start];
    while (stack.length) {
      const n = tr.nodes[stack.pop()];
      (n.opts || []).forEach(o => {
        if (o.go === undefined || o.go < 0 || o.go >= tr.nodes.length) e5.push(k + ": ungültiges Ziel " + o.go);
        else if (!reach.has(o.go)) { reach.add(o.go); stack.push(o.go); }
      });
    }
    tr.nodes.forEach((n,i) => { if (!reach.has(i)) e5.push(k + ": Knoten " + i + " unerreichbar"); });
  });
  ok("alle " + Object.keys(TREES).length + " Bäume: Ziele gültig, alle Knoten erreichbar", e5.length === 0, e5.slice(0,5).join(" ; "));
  // Schritt-zurück über 3 Ebenen (sensor-unplausibel: 0→2→4→Ergebnis)
  w.openTreeMenu(); w.startTree("sensor-unplausibel");
  const q0 = d.getElementById("treeBody").innerHTML;
  w.renderNode(2); const q1 = d.getElementById("treeBody").innerHTML;
  w.renderNode(4); w.renderNode(5);
  const clickBack = () => { const b = [...d.querySelectorAll("#treeBody .tree-opt")].find(x => x.textContent.includes("Ein Schritt zurück")); if (b) b.click(); return !!b; };
  const b1 = clickBack(), b2 = clickBack();
  const afterB2 = d.getElementById("treeBody").innerHTML;
  const b3 = clickBack();
  const afterB3 = d.getElementById("treeBody").innerHTML;
  ok("Schritt-zurück über 3 Ebenen (Buttons vorhanden, Zustände stimmen)",
     b1 && b2 && b3 && afterB2 === q1 && afterB3 === q0,
     JSON.stringify({b1,b2,b3,eq2:afterB2===q1,eq3:afterB3===q0}));
  w.doCloseOverlays();

  section("6 · Querverweis-Chips");
  let refTexts = 0, chipCount = 0, badTargets = [];
  const countRefs = s => (String(s).match(/→\s*(Entscheidungsbaum\s*\/\s*Prüfung|Entscheidungsbaum|Prüfung)\s*:/g) || []).length;
  const checkChips = html => {
    const div = d.createElement("div"); div.innerHTML = html;
    div.querySelectorAll("button.xref").forEach(b => {
      chipCount++;
      const m = (b.getAttribute("onclick") || "").match(/openDetail\('([^']+)'\)|xrefOpenTree\('([^']+)'\)/);
      if (!m) badTargets.push("kein Handler");
      else if (m[1] && !ids.has(m[1])) badTargets.push("Test fehlt: " + m[1]);
      else if (m[2] && !TREES[m[2]]) badTargets.push("Baum fehlt: " + m[2]);
    });
  };
  TESTS.forEach(t => { refTexts += countRefs(t.next); checkChips(w.linkifyRefs(String(t.next))); });
  Object.values(TREES).forEach(tr => tr.nodes.forEach(n => { if (n.r) { refTexts += countRefs(n.r); checkChips(w.linkifyRefs(n.r)); } }));
  ok("Chips erzeugt (" + chipCount + " Chips aus " + refTexts + " Textverweisen), alle Ziele existieren",
     chipCount > 0 && badTargets.length === 0, badTargets.join(","));
  ok("unauflösbare Verweise bleiben Text ('jeweiliger Sensor' ergibt keinen Chip)",
     !w.linkifyRefs("→ Prüfung: jeweiliger Sensor.").includes("xref"));

  section("7 · Rechner-Regression");
  w.openDetail("ruhestrom-fuse");
  const fEl = d.getElementById("cFuse"), mEl = d.getElementById("cMv"), out = d.getElementById("cOut");
  const pick = label => { fEl.selectedIndex = [...fEl.options].findIndex(o => o.text.startsWith(label)); };
  const run = v => { mEl.value = v; w.calcMvDrop(); return out.textContent; };
  pick("10 A");
  const r10 = parseFloat(fEl.value);
  // Fester Sollwert laut Abnahmebedingung: 0,77 mV an 10 A = 100 mA.
  // Deckt sich mit dem Littelfuse-Datenblatt (ATOF 287: 10 A = 7,70 mΩ).
  ok("0,77 mV an 10 A ergibt ≈ 100 mA", run("0,77").includes("100 mA"), out.textContent);
  ok("FUSE_R 10 A entspricht dem Datenblatt (7,70 mΩ)", Math.abs(r10 - 7.70) < 0.01, "ist: " + r10);
  ok("Komma und Punkt liefern dasselbe Ergebnis", run("2,4") === run("2.4"));
  ok("unplausibler Wert über Nennstrom wird abgefangen", run("200").includes("unplausibel"), out.textContent);
  ok("leere/ungültige Eingabe sauber behandelt", run("").includes("Wert in mV eingeben"));
  w.doCloseOverlays();

  section("8 · Zustands-Regression");
  const histBefore = w.history.length;
  w.openDetail("masse"); w.openDetail("batterie"); w.openDetail("spannung");
  ok("drei openDetail nacheinander = genau EIN History-Eintrag", w.history.length === histBefore + 1,
     histBefore + " → " + w.history.length);
  // Merkliste: hinzufügen, entfernen, Ansicht muss aktualisieren
  w.openDetail("masse"); w.toggleFavCurrent();
  w.doCloseOverlays(); w.showFavs();
  const favHas = d.getElementById("main").innerHTML.includes("Masse prüfen");
  w.openDetail("masse"); w.toggleFavCurrent(); w.doCloseOverlays(); w.showFavs();
  const favGone = !d.getElementById("main").innerHTML.includes("Masse prüfen");
  ok("Merkliste aktualisiert sich nach Hinzufügen und Entfernen", favHas && favGone, JSON.stringify({favHas,favGone}));
  w.showHome();

  section("9 · Suche");
  const searchEl = d.getElementById("search");
  const doSearch = async q => {
    searchEl.value = q;
    searchEl.dispatchEvent(new w.Event("input", { bubbles: true }));
    await new Promise(r => setTimeout(r, 220)); // Debounce 130 ms abwarten
    return d.getElementById("main").querySelectorAll(".tile").length;
  };
  for (const term of ["sauerstoffsensor", "p0340", "öldruck", "kty81", "starter masse"]) {
    ok('Suche "' + term + '" liefert Treffer', (await doSearch(term)) > 0);
  }
  await doSearch("");

  section("10 · Versionierung");
  const appV = (HTML.match(/APP_VERSION\s*=\s*'([^']+)'/) || [])[1] || "";
  const cacheV = (SW.match(/CACHE_NAME\s*=\s*'kfz-multimeter-profi-v([^']+)'/) || [])[1] || "";
  ok("APP_VERSION (" + appV + ") ↔ CACHE_NAME (v" + cacheV + ") synchron",
     appV.replace("-Profi","").replace(".","-") === cacheV);
  const missingPrecache = [...HTML.matchAll(/href="(splash-[^"]+)"/g)].map(m => m[1]).filter(f => !SW.includes(f));
  ok("alle Splash-Bilder im SW-Precache", missingPrecache.length === 0, missingPrecache.join(","));

  section("11 · Fokus-Trap");
  w.openDetail("masse");
  const overlay = d.getElementById("overlay");
  const foci = [...overlay.querySelectorAll("button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex='-1'])")];
  foci[foci.length - 1].focus();
  d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
  const wrapped = d.activeElement === foci[0];
  foci[0].focus();
  d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }));
  const wrappedBack = d.activeElement === foci[foci.length - 1];
  ok("Tab am Ende springt zum Anfang, Shift+Tab am Anfang zum Ende", wrapped && wrappedBack,
     JSON.stringify({wrapped, wrappedBack}));
  w.doCloseOverlays();

  if (notes.length) {
    section("Hinweise (kein Fehler)");
    console.log("  ℹ " + notes.length + "× TESTS.table liegt unter einem DEEP.rt und wird nicht gerendert");
    console.log("    betroffen: " + notes.map(n => n.split(":")[0].replace("DEEP ", "")).join(", "));
  }

  console.log("\n================================");
  console.log(failed === 0 ? "ALLE PRÜFUNGEN BESTANDEN (" + passed + ")" : "FEHLGESCHLAGEN: " + failed + " von " + (passed + failed));
  process.exit(failed === 0 ? 0 : 1);
})().catch(e => { console.error("Validator-Absturz:", e); process.exit(2); });
