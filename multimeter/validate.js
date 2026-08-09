/* validate.js – Abnahmevalidierung der KFZ-Multimeter-PWA (v8.4)
   Aufruf: npm ci && npm test
   Prüft Daten, Renderlogik, Fachregeln, Fokus, Theme- und PWA-Regressionen. */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const HTML = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const SW = fs.readFileSync(path.join(__dirname, "sw.js"), "utf8");
const SOURCES = fs.readFileSync(path.join(__dirname, "SOURCES.md"), "utf8");

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
  // Deckt auf, wenn ein DEEP-Feld nur in der Basis-openDetail gerendert wird,
  // die v6-Überschreibung es aber nicht kennt (stiller Inhaltsverlust).
  const rt2Missing = Object.keys(DEEP).filter(k => DEEP[k].rt2).filter(k => {
    w.openDetail(k);
    return !d.getElementById("ovbody").innerHTML.includes(DEEP[k].rt2.head[0]);
  });
  const rt2Count = Object.keys(DEEP).filter(k => DEEP[k].rt2).length;
  ok("alle " + rt2Count + " Zweittabellen (rt2) werden tatsächlich gerendert", rt2Missing.length === 0, rt2Missing.join(","));

  // Einklapp-Mechanik der Anleitung: im Profi-Modus zu, im Einsteiger-Modus offen,
  // Inhalt in beiden Fällen im DOM (sonst wäre er für die Suche/Screenreader weg).
  const anlIds = Object.keys(DEEP).filter(k => DEEP[k].anl);
  const anlMissing = anlIds.filter(k => { w.openDetail(k); return !d.querySelector("#ovbody details.anlbox"); });
  ok("alle " + anlIds.length + " Anleitungen als einklappbarer Block gerendert", anlMissing.length === 0, anlMissing.join(","));
  const guideBad = TESTS.filter(t => !DEEP[t.id] || !Array.isArray(DEEP[t.id].anl) || DEEP[t.id].anl.length < 4)
                        .map(t => t.id);
  ok("alle " + TESTS.length + " Karten besitzen eine konkrete Anleitung mit mindestens 4 Schritten",
     guideBad.length === 0, guideBad.join(", "));
  w.applyBeginner(false); w.openDetail("leitung");
  const proClosed = !d.querySelector("#ovbody details.anlbox").open;
  const contentPresent = d.getElementById("ovbody").innerHTML.includes("Nullabgleich");
  w.applyBeginner(true); w.openDetail("leitung");
  const begOpen = d.querySelector("#ovbody details.anlbox").open;
  w.applyBeginner(false);
  ok("Profi-Modus: Anleitung zugeklappt, Inhalt trotzdem im DOM", proClosed && contentPresent,
     JSON.stringify({ proClosed, contentPresent }));
  ok("Einsteiger-Modus: Anleitung automatisch offen", begOpen);
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
  const tEl = d.getElementById("cType");
  const pickType = k => { tEl.value = k; w.onFuseTypeChange(); };
  const pick = label => { fEl.selectedIndex = [...fEl.options].findIndex(o => o.text.startsWith(label)); };
  const run = v => { mEl.value = v; w.calcMvDrop(); return out.textContent; };
  pickType("atof"); pick("10 A");
  const r10 = parseFloat(fEl.value);
  // Fester Sollwert laut Abnahmebedingung: 0,77 mV an 10 A = 100 mA.
  // Deckt sich mit dem Littelfuse-Datenblatt (ATOF 287: 10 A = 7,70 mΩ).
  ok("0,77 mV an 10 A ergibt ≈ 100 mA", run("0,77").includes("100 mA"), out.textContent);
  ok("ATOF 10 A entspricht dem Datenblatt (7,70 mΩ)", Math.abs(r10 - 7.70) < 0.01, "ist: " + r10);
  ok("Komma und Punkt liefern dasselbe Ergebnis", run("2,4") === run("2.4"));
  ok("unplausibler Wert über Nennstrom wird abgefangen", run("200").includes("unplausibel"), out.textContent);
  ok("leere/ungültige Eingabe sauber behandelt", run("").includes("Wert in mV eingeben"));
  // Regression v8.4: ungültiger Widerstandswert darf nie als "NaN" durchschlagen.
  // Reproduziert den Zustand nach einem fehlgeschlagenen onFuseTypeChange() (leere Optionsliste).
  const optsBackup = fEl.innerHTML;
  fEl.innerHTML = '<option value="">–</option>';
  const nanOut = run("2,4");
  ok("ungültiger Widerstandswert ergibt kein NaN", !/NaN/.test(nanOut), nanOut);
  ok("stattdessen erscheint ein verständlicher Hinweis",
     /Sicherungsbauform und Nennwert auswählen/.test(nanOut), nanOut);
  fEl.innerHTML = optsBackup; pickType("atof"); pick("10 A");
  ok("Rechner arbeitet nach dem Fehlerfall wieder normal", run("0,77").includes("100 mA"), out.textContent);
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
     appV.replace("-Profi","").split(".").join("-") === cacheV);
  const missingPrecache = [...HTML.matchAll(/href="(splash-[^"]+)"/g)].map(m => m[1]).filter(f => !SW.includes(f));
  ok("alle Splash-Bilder im SW-Precache", missingPrecache.length === 0, missingPrecache.join(","));

  section("11 · Fokus-Trap");
  const detailOpener = d.querySelector('[data-card-id="masse"]');
  detailOpener.focus();
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
  ok("Fokus kehrt nach Neurendern zur auslösenden Karte zurück",
     d.activeElement && d.activeElement.dataset.cardId === "masse",
     d.activeElement && (d.activeElement.id || d.activeElement.outerHTML.slice(0,80)));


  section("12 · Semantik: keine universellen Festgrenzen");
  const src = HTML;
  // Aktive Diagnosepfade = alles ausserhalb von /* ... */-Kommentaren
  const active = src.replace(/\/\*[\s\S]*?\*\//g, "");
  const forbid = [
    [/unter\s*4,9\s*V/i, "unter 4,9 V"],
    [/über\s*5,1\s*V/i, "über 5,1 V"],
    [/>\s*5,2\s*V/i, "> 5,2 V"],
    [/4,9–5,1\s*V/i, "4,9–5,1 V"]
  ];
  const hits = forbid.filter(([re]) => re.test(active)).map(([, n]) => n);
  ok("keine festen 5-V-Grenzen in aktiven Diagnosepfaden", hits.length === 0, hits.join(", "));

  // 4,75–5,25 V darf nur als gekennzeichnetes Beispiel auftreten, nie als Entscheidungsgrenze
  const beispielKontext = /(Beispiel|beispielhaft|nicht allgemeingültig|OEM)/;
  const rangeLines = active.split("\n").filter(l => /4,75–5,25|4,7–5,3/.test(l));
  const badRange = rangeLines.filter(l => !beispielKontext.test(l));
  ok("4,75–5,25 V nur als gekennzeichnetes Beispiel, nicht als Entscheidungsgrenze",
     badRange.length === 0, badRange.map(l => l.trim().slice(0, 60)).join(" | "));

  // Generatorbaum startet mit der Systemart
  const genStart = TREES["generator-laedt-nicht"].nodes[TREES["generator-laedt-nicht"].start];
  ok("Generatorbaum beginnt mit der Ladesystemart, nicht mit einer Spannung",
     /Ladesystemart/i.test(genStart.q || "") && !/\d+,\d+\s*V/.test(genStart.q || ""), genStart.q);

  // 5-V-Baum beginnt mit der OEM-Sollwertfrage
  const refStart = TREES["5v-kurzschluss"].nodes[TREES["5v-kurzschluss"].start];
  ok("5-V-Baum beginnt mit der Frage nach dem OEM-Sollbereich",
     /OEM-Sollbereich/i.test(refStart.q || ""), refStart.q);

  // Gefahrkarten korrekt klassifiziert
  ["batterie", "raildruck"].forEach(id => {
    const t = TESTS.find(x => x.id === id);
    const hasDanger = (t.warn || []).some(x => x[0] === "danger");
    ok(id + ": sichtbarer Gefahrblock, tag=gef, Risiko hoch",
       hasDanger && t.tag === "gef" && t.risk === "hoch",
       JSON.stringify({ danger: hasDanger, tag: t.tag, risk: t.risk }));
  });

  // MAP ohne universellen KOEO-Spannungswert
  const mapAll = JSON.stringify(TESTS.find(x => x.id === "map")) + JSON.stringify(DEEP["map"]);
  ok("MAP enthält keinen universellen KOEO-Spannungswert",
     !/3,5–4,5\s*V/.test(mapAll), "3,5–4,5 V gefunden");

  // Kein Teiletausch ohne vorgelagerten Bestätigungsschritt
  const swapBad = [];
  Object.entries(DEEP).forEach(([k, dd]) => (dd.fs || []).forEach((f, i) => {
    const txt = (f.ok || "") + " " + (f.ng || "");
    if (/\btauschen\b/.test(txt) && !/(Gegenprobe|ausschließen|bestätigt|belegt|plausibilisieren|erst)/i.test(txt))
      swapBad.push(k + " fs#" + (i + 1));
  }));
  ok("kein Teiletausch ohne vorherigen Bestätigungsschritt", swapBad.length === 0, swapBad.join(", "));
  ok("Ruhestrom-Diagnose verwendet keine feste >80-mA-Entscheidungsgrenze",
     !/>\s*80\s*mA/.test(active), ">80 mA gefunden");
  ok("Sensor-Masseversatz verwendet keine feste <50-mV-Freigabegrenze",
     !/<\s*50\s*mV/.test(JSON.stringify(TESTS.find(x=>x.id==="sensor-masseversatz"))+JSON.stringify(DEEP["sensor-masseversatz"])));
  ok("Sicherungs-mV-Rechner klassifiziert Strom nicht mit festen 5/50/200-mA-Schwellen",
     !/ma\s*<\s*(5|50|200)/.test(active));

  // Gefahrenmatrix: danger-Warnungen erscheinen vor der Arbeitsanweisung
  w.applyBeginner(true);
  const orderBad = TESTS.filter(t => (t.warn || []).some(x => x[0] === "danger")).filter(t => {
    w.openDetail(t.id);
    const html = d.getElementById("ovbody").innerHTML;
    const iDanger = html.indexOf("warn danger");
    const iSteps = html.indexOf("Messspitzen anhalten");
    return iDanger === -1 || (iSteps !== -1 && iDanger > iSteps);
  }).map(t => t.id);
  w.applyBeginner(false);
  ok("alle danger-Warnungen stehen vor der Arbeitsanweisung (auch im Einsteiger-Modus)",
     orderBad.length === 0, orderBad.join(", "));

  section("13 · Service Worker & Cache-Isolation");
  const sw = SW;
  ok("SW löscht nur Caches mit eigenem Präfix", /CACHE_PREFIX/.test(sw) && /startsWith\(CACHE_PREFIX\)/.test(sw));
  const rootSw = fs.existsSync(path.join(__dirname, "..", "sw.js"))
    ? fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8") : "";
  ok("Nachbar-App auf demselben Origin löscht ebenfalls präfix-gefiltert",
     !rootSw || /CACHE_PREFIX/.test(rootSw));
  const splashInSw = [...HTML.matchAll(/href="(splash-[^"]+)"/g)].map(m => m[1]);
  ok("alle " + splashInSw.length + " Splash-Assets (Hoch- und Querformat) im Precache",
     splashInSw.every(f => sw.includes(f)));
  const appCache = (HTML.match(/APP_CACHE_NAME\s*=\s*'([^']+)'/)||[])[1]||"";
  const swCache = (SW.match(/CACHE_NAME\s*=\s*'([^']+)'/)||[])[1]||"";
  ok("Seite und Service Worker verwenden denselben expliziten Cache-Namen",
     appCache === swCache, JSON.stringify({appCache,swCache}));
  ok("SW liefert seine Version über MessageChannel",
     /GET_VERSION/.test(sw) && /cacheName:\s*CACHE_NAME/.test(sw));
  ok("Registrierung umgeht veralteten HTTP-Cache für sw.js",
     /register\('sw\.js',\{updateViaCache:'none'\}\)/.test(HTML));
  ok("Updatebanner wird vor controllerchange-Reload zurückgesetzt",
     /controllerchange[\s\S]*?hideUpdate\(\)[\s\S]*?location\.reload/.test(HTML));

  section("14 · Accessibility-Semantik");
  w.openDetail("masse");
  const bgInert = ["header", "main", ".botnav"].every(sel => {
    const el = d.querySelector(sel); return el && el.hasAttribute("inert");
  });
  ok("Dialoghintergrund wird inert geschaltet", bgInert);
  w.doCloseOverlays();
  const bgLive = ["header", "main", ".botnav"].every(sel => {
    const el = d.querySelector(sel); return el && !el.hasAttribute("inert");
  });
  ok("Hintergrund nach Dialogschluss wieder bedienbar", bgLive);
  ok("aktive Navigation trägt aria-current", !!d.querySelector(".botnav button[aria-current='page']"));
  ok("Kategorie-Chips tragen aria-pressed", !!d.querySelector(".chip[aria-pressed]"));
  const emojiBad = [...d.querySelectorAll(".botnav .bi, .logo")].filter(e => !e.hasAttribute("aria-hidden"));
  ok("dekorative Emoji sind aria-hidden", emojiBad.length === 0);
  // Touchziele: Mindestmasse aus dem Stylesheet (jsdom rendert keine Layoutmasse)
  const cssMin = /\.favbtn\{[^}]*min-width:44px/.test(HTML) && /\.favbtn\{[^}]*min-height:44px/.test(HTML);
  const backMin = /\.back\{[\s\S]*?width:44px;height:44px/.test(HTML);
  const navMin = /\.botnav button\{[\s\S]*?min-height:44px/.test(HTML);
  ok("wesentliche Touchziele mindestens 44x44 CSS-Pixel (WCAG 2.2 SC 2.5.5 Enhanced; über SC 2.5.8)",
     cssMin && backMin && navMin, JSON.stringify({ fav: cssMin, back: backMin, nav: navMin }));

  section("15 · Licht-/Dunkelschema");
  ok("systemabhängiges helles Farbschema vorhanden",
     /@media \(prefers-color-scheme: light\)/.test(HTML));
  const cssEnd = HTML.indexOf("</style>");
  const lightLast = HTML.lastIndexOf("@media (prefers-color-scheme: light)", cssEnd);
  const lastBaseRule = Math.max(HTML.lastIndexOf(".checkitem.warn", cssEnd), HTML.lastIndexOf(".meta-card.warn", cssEnd));
  ok("abschließender Hellmodus-Block steht nach allen Basisregeln",
     lightLast > lastBaseRule && lightLast < cssEnd, JSON.stringify({lightLast,lastBaseRule,cssEnd}));
  function lum(hex){
    const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
      .map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));
    return .2126*c[0]+.7152*c[1]+.0722*c[2];
  }
  function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  ok("weiße Schrift auf Light-Accent und Light-Blue erreicht mindestens 4,5:1",
     contrast("#754800","#ffffff") >= 4.5 && contrast("#075a9f","#ffffff") >= 4.5,
     JSON.stringify({accent:contrast("#754800","#ffffff"),blue:contrast("#075a9f","#ffffff")}));

  section("16 · Quellen- und Grenzwerttransparenz");
  ok("SOURCES.md ist auf die aktuelle Version datiert und enthält direkte URLs",
     new RegExp("v"+(HTML.match(/APP_VERSION\s*=\s*'([^']+)'/)||[])[1].replace(/\./g,"\\.")).test(SOURCES) && (SOURCES.match(/https:\/\//g)||[]).length >= 12);
  ok("WCAG-Zuordnung ist korrekt: 24 px SC 2.5.8, 44 px SC 2.5.5",
     /24 × 24[\s\S]*SC 2\.5\.8/.test(SOURCES) && /44 × 44[\s\S]*SC 2\.5\.5/.test(SOURCES));
  const missingSourceLabel = TESTS.filter(t=>{w.openDetail(t.id);return !/Sollwertquelle:/.test(d.getElementById("ovbody").textContent);}).map(t=>t.id);
  ok("jede Detailansicht zeigt eine Sollwertquelle oder OEM-Pflicht",
     missingSourceLabel.length === 0, missingSourceLabel.join(", "));

  section("17 · Nachbesserungen v8.2.1");
  ok("nur ein Hellmodus-Block (keine konkurrierende Definition)",
     (HTML.match(/@media \(prefers-color-scheme: light\)/g) || []).length === 1,
     "gefunden: " + (HTML.match(/@media \(prefers-color-scheme: light\)/g) || []).length);
  ok("ISO 8820-3 nicht als veröffentlichte 2026-Norm zitiert",
     !/ISO 8820-3:2026/.test(SOURCES) && /ISO\/FDIS 8820-3/.test(SOURCES) && /ISO 8820-3:2015/.test(SOURCES));
  ok("Rechner bietet Einordnung über den gemessenen Gesamt-Ruhestrom",
     /id="cTotal"/.test(HTML) && /Gesamt-Ruhestroms/.test(HTML));

  section("18 · Relais-Kartensatz (v8.3)");
  const relayIds = ["relais", "relais-typen", "relais-leistung", "relais-elektronisch"];
  const relayMissing = relayIds.filter(id => !TESTS.some(t => t.id === id));
  ok("alle 4 Relaiskarten vorhanden", relayMissing.length === 0, relayMissing.join(", "));
  const relayThin = relayIds.filter(id => !DEEP[id] || !Array.isArray(DEEP[id].anl) || DEEP[id].anl.length < 4);
  ok("jede Relaiskarte hat eine Anleitung mit mindestens 4 Schritten", relayThin.length === 0, relayThin.join(", "));

  // Entflechtung: die Sicherungskarte darf keine Relais-Prüfschritte mehr enthalten
  const fuseCard = TESTS.find(t => t.id === "sicherung");
  const fuseDeep = DEEP["sicherung"] || {};
  const fuseSteps = JSON.stringify(fuseDeep.anl || []) + JSON.stringify(fuseDeep.fs || []) +
                    JSON.stringify(fuseDeep.rt || {}) + JSON.stringify(fuseDeep.urs || []);
  ok("Sicherungskarte heißt nicht mehr 'Sicherung / Relais'", !/Relais/.test(fuseCard.nm), fuseCard.nm);
  ok("Sicherungskarte enthält keine Relais-Prüfschritte mehr",
     !/(Klick|Kl\.87|30→87|Spulen?widerstand|85\/86)/.test(fuseSteps));

  // Relaisbaum startet mit der Bauart, nicht mit einem Messwert
  const relTree = TREES["relais-schaltet-nicht"];
  ok("Diagnosebaum 'relais-schaltet-nicht' vorhanden", !!relTree);
  if (relTree) {
    const q = relTree.nodes[relTree.start].q || "";
    ok("Relaisbaum beginnt mit der Bauart, nicht mit einem Messwert",
       /Bauart/i.test(q) && !/\d+,\d+\s*V/.test(q), q);
  }

  // Leistungsrelais ist als Gefahrprüfung klassifiziert
  const power = TESTS.find(t => t.id === "relais-leistung");
  ok("relais-leistung: tag=gef, Risiko hoch, sichtbarer Gefahrblock",
     power.tag === "gef" && power.risk === "hoch" && (power.warn || []).some(x => x[0] === "danger"),
     JSON.stringify({ tag: power.tag, risk: power.risk }));

  // Keine toten Verweise auf den alten Kartennamen
  const allText = JSON.stringify(TESTS) + JSON.stringify(DEEP) + JSON.stringify(TREES);
  ok("keine Verweise mehr auf die alte Karte 'Sicherung/Relais'",
     !/Prüfung:\s*Sicherung\/Relais/.test(allText));

  // Bauartunterscheidungen, die das Messverfahren ändern, sind abgedeckt
  ["87a", "Doppelschließer", "Freilaufdiode", "Parallelwiderstand", "Halbleiter"].forEach(k => {
    ok("Bauartmerkmal abgedeckt: " + k, allText.includes(k));
  });

  section("19 · Release Candidate v8.4");

  // --- Aufgabe 1: die drei wiederhergestellten Bauteilprüfungen ---
  const newIds = ["ibs", "agr-pos", "lenkwinkel"];
  newIds.forEach(id => {
    const t = TESTS.find(x => x.id === id), dd = DEEP[id];
    const metaComplete = !!t && !!t.quality && !!t.risk &&
      Array.isArray(t.requires) && t.requires.length > 0 &&
      Array.isArray(t.limits) && t.limits.length > 0 &&
      Array.isArray(t.dont) && t.dont.length > 0 && !!t.syn && !!t.beg;
    ok(id + ": Karte vorhanden, Meta vollständig, Anleitung ≥ 4 Schritte",
       metaComplete && !!dd && Array.isArray(dd.anl) && dd.anl.length >= 4 &&
       Array.isArray(dd.urs) && Array.isArray(dd.fs) && !!dd.rt,
       JSON.stringify({ card: !!t, meta: metaComplete, anl: dd && dd.anl ? dd.anl.length : 0 }));
    // sourceRef wird zentral zugewiesen; hier zählt, was der Renderer tatsächlich zeigt.
    w.openDetail(id);
    const body = d.getElementById("ovbody").textContent;
    ok(id + ": Detailansicht nennt eine konkrete Sollwertquelle",
       /Sollwertquelle:/.test(body) && !/Zahlen in dieser Karte sind ohne konkrete Kennlinie/.test(body));
    w.doCloseOverlays();
  });

  // Auffindbarkeit über Werkstattsprache UND Fehlercode
  const findable = [
    ["ibs", "batteriesensor"], ["ibs", "polklemme"], ["ibs", "start-stopp"],
    ["agr-pos", "abgasrückführung"], ["agr-pos", "p0405"], ["agr-pos", "verkokung"],
    ["lenkwinkel", "wickelfeder"], ["lenkwinkel", "u0126"], ["lenkwinkel", "grundeinstellung"]
  ];
  const notFound = findable.filter(([id, q]) => {
    w.eval("query=" + JSON.stringify(q) + ";activeCat='alle';");
    return !w.filterTests().some(t => t.id === id);
  }).map(([id, q]) => id + "/" + q);
  w.eval("query='';activeCat='alle';");
  ok("neue Karten über Synonyme und Fehlercodes auffindbar (" + findable.length + " Begriffe)",
     notFound.length === 0, notFound.join(", "));

  // Gefahrwarnung der Lenkwinkelkarte steht VOR der ersten Arbeitsanweisung
  w.openDetail("lenkwinkel");
  const lwHtml = d.getElementById("ovbody").innerHTML;
  const posDanger = lwHtml.indexOf('class="warn danger"');
  const posWork = lwHtml.indexOf("Messspitzen anhalten");
  const posAnl = lwHtml.indexOf("Anleitung");
  ok("lenkwinkel: danger-Block steht vor der ersten Arbeitsanweisung",
     posDanger > -1 && posWork > posDanger && (posAnl === -1 || posAnl > posDanger),
     JSON.stringify({ posDanger, posWork, posAnl }));
  ok("lenkwinkel: Airbagwarnung nennt Deaktivierung und Wartezeit",
     /Wartezeit/.test(lwHtml) && /Deaktivierung/.test(lwHtml));
  w.doCloseOverlays();

  // IBS <-> Ruhestrom: beidseitig verlinkt und als Chip aufgelöst
  const chipTargets = id => {
    w.openDetail(id);
    const html = d.getElementById("ovbody").innerHTML;
    w.doCloseOverlays();
    return html;
  };
  const ibsHtml = chipTargets("ibs");
  ok("ibs verweist auf Ruhestrom messen und Ruhestrom über Sicherung",
     /xref/.test(ibsHtml) && /Ruhestrom messen/.test(ibsHtml) && /mV-Drop/.test(ibsHtml));
  ["ruhestrom", "ruhestrom-fuse"].forEach(id => {
    const html = chipTargets(id);
    ok(id + " verweist zurück auf den Batteriesensor",
       /Batteriesensor \(IBS\)/.test(html) && /xref/.test(html));
  });
  ["can", "srs-airbag"].forEach(id => {
    const html = chipTargets(id);
    ok(id + " verweist auf den Lenkwinkelsensor", /Lenkwinkelsensor/.test(html) && /xref/.test(html));
  });

  // --- Aufgabe 3: Auslieferungsdateien ---
  const offPath = path.join(__dirname, "offline.html");
  const headPath = path.join(__dirname, "_headers");
  const hasOffline = fs.existsSync(offPath);
  ok("offline.html vorhanden", hasOffline);
  const OFFLINE = hasOffline ? fs.readFileSync(offPath, "utf8") : "";
  ok("offline.html im Precache (Kernumfang, nicht optional)",
     /'\.\/offline\.html'/.test(SW) && !/offline\.html[\s\S]{0,80}splash/.test(SW));
  ok("offline.html ist zweiter Navigations-Fallback hinter index.html",
     /caches\.match\('\.\/index\.html'\)[\s\S]{0,200}caches\.match\('\.\/offline\.html'\)/.test(SW));
  ok("offline.html lädt keine fremden Ressourcen",
     !/https?:\/\//.test(OFFLINE) && !/<script/i.test(OFFLINE));
  ok("offline.html bietet einen Wiederholen-Weg mit 44-px-Ziel",
     /Erneut versuchen/.test(OFFLINE) && /min-height:44px/.test(OFFLINE));
  const hasHeaders = fs.existsSync(headPath);
  ok("_headers vorhanden", hasHeaders);
  const HEADERS = hasHeaders ? fs.readFileSync(headPath, "utf8") : "";
  ["sw.js", "manifest.webmanifest", "index.html", "offline.html"].forEach(f => {
    const block = (HEADERS.split("\n/").find(b => b.startsWith(f)) || "");
    ok("_headers: no-cache für " + f, /no-cache/.test(block), block.trim());
  });
  ok("_headers: unveränderliche Cachezeit für Bilder",
     /\*\.png[\s\S]{0,120}immutable/.test(HEADERS) && /\*\.svg[\s\S]{0,120}immutable/.test(HEADERS));
  ["X-Content-Type-Options: nosniff", "Referrer-Policy: no-referrer", "X-Frame-Options: DENY"]
    .forEach(h => ok("_headers: " + h, HEADERS.includes(h)));

  // --- Aufgabe 4: Nutzungshinweis, Wertestand, keine externen Anfragen ---
  ok("Nutzungshinweis über die Navigation erreichbar",
     !!d.getElementById("navHinweis") && !!d.getElementById("hinweisOverlay"));
  ok("Nutzungshinweis nennt Herstellervorrang und Qualifikationspflicht",
     /Vorrang/.test(HTML) && /Hochvolt-, Airbag- und Bremssystemen/.test(HTML));
  // Erststart: eigene Instanz ohne gesetztes Flag
  const fresh = new JSDOM(HTML, { runScripts: "dangerously", url: "https://example.test/multimeter/index.html", virtualConsole: vc, pretendToBeVisual: true });
  ok("Nutzungshinweis erscheint beim Erststart",
     fresh.window.document.getElementById("hinweisOverlay").classList.contains("open"));
  ok("Erststart zeigt einen Bestätigungsknopf", !!fresh.window.document.getElementById("hinweisOk"));
  fresh.window.acceptHinweis();
  await new Promise(r => setTimeout(r, 50));
  ok("nach Bestätigung geschlossen und Hintergrund wieder bedienbar",
     !fresh.window.document.getElementById("hinweisOverlay").classList.contains("open") &&
     !fresh.window.document.querySelector("main").hasAttribute("inert"));
  ok("Bestätigung wird lokal gespeichert", fresh.window.localStorage.getItem("mm_hinweis_ok") === "1");
  const back = new JSDOM(HTML, {
    runScripts: "dangerously", url: "https://example.test/multimeter/index.html",
    virtualConsole: vc, pretendToBeVisual: true,
    beforeParse(win) { try { win.localStorage.setItem("mm_hinweis_ok", "1"); } catch (e) {} }
  });
  ok("nach erneutem Laden kehrt der Hinweis nicht von selbst zurück",
     !back.window.document.getElementById("hinweisOverlay").classList.contains("open"));
  back.window.openHinweis();
  ok("Hinweis bleibt über die Navigation aufrufbar",
     back.window.document.getElementById("hinweisOverlay").classList.contains("open"));

  // Wertestand sichtbar und deckungsgleich mit SOURCES.md
  const stand = (HTML.match(/DATA_STAND\s*=\s*'([^']+)'/) || [])[1] || "";
  ok("Inhaltsstand als eigene Konstante gepflegt", /^\d{2}\.\d{2}\.\d{4}$/.test(stand), stand);
  ok("Inhaltsstand steht auch in SOURCES.md", SOURCES.includes(stand), stand);
  ok("Inhaltsstand in der Fußzeile sichtbar", /Inhaltsstand \$\{DATA_STAND\}/.test(HTML));
  w.renderHome();
  ok("Fußzeile führt zum Nutzungshinweis",
     /openHinweis\(\)/.test(d.getElementById("main").innerHTML));

  // Datenschutzaussage im Code belegt (deckt LEGAL/DATENSCHUTZ-ENTWURF.md)
  const prodFiles = ["index.html", "sw.js", "offline.html", "manifest.webmanifest"]
    .filter(f => fs.existsSync(path.join(__dirname, f)))
    .map(f => [f, fs.readFileSync(path.join(__dirname, f), "utf8")]);
  const foreignUrls = [];
  prodFiles.forEach(([f, src]) => (src.match(/https?:\/\/[^"'\s)]+/g) || [])
    .filter(u => !/^http:\/\/www\.w3\.org\//.test(u))   // XML-Namensraum, kein Netzaufruf
    .forEach(u => foreignUrls.push(f + ": " + u)));
  ok("keine externen URLs im Produktionscode (nur SVG-Namensraum)",
     foreignUrls.length === 0, foreignUrls.join(", "));
  const beacons = [];
  prodFiles.forEach(([f, src]) => {
    if (/sendBeacon|XMLHttpRequest|new WebSocket|new EventSource|importScripts/.test(src)) beacons.push(f);
    if (f !== "sw.js" && /\bfetch\s*\(/.test(src)) beacons.push(f + " (fetch)");
  });
  ok("keine Übertragungs-APIs außerhalb des Service Workers", beacons.length === 0, beacons.join(", "));
  ok("Service-Worker-fetch bleibt auf die eigene Herkunft beschränkt",
     /url\.origin !== self\.location\.origin/.test(SW));
  // Schlüssel werden teils als Literal, teils über eine Konstante gesetzt
  // (z.B. HINWEIS_KEY) – beide Schreibweisen erfassen, sonst entsteht eine Lücke.
  const lsKeys = [...new Set([
    ...(HTML.match(/localStorage\.[gs]etItem\(['"]([a-z_]+)['"]/g) || [])
      .map(m => m.replace(/.*['"]([a-z_]+)['"]/, "$1")),
    ...(HTML.match(/const\s+\w*KEY\s*=\s*'([a-z_]+)'/g) || [])
      .map(m => m.replace(/.*'([a-z_]+)'/, "$1"))
  ])].sort();
  const legalPath = path.join(__dirname, "LEGAL", "DATENSCHUTZ-ENTWURF.md");
  const LEGAL_DS = fs.existsSync(legalPath) ? fs.readFileSync(legalPath, "utf8") : "";
  const undocumented = lsKeys.filter(k => !LEGAL_DS.includes(k));
  ok("jeder localStorage-Schlüssel ist im Datenschutzentwurf aufgeführt (" + lsKeys.length + ": " + lsKeys.join(", ") + ")",
     LEGAL_DS !== "" && lsKeys.length >= 4 && undocumented.length === 0, undocumented.join(", "));
  // Gegenrichtung: der Entwurf darf keine Schlüssel nennen, die es nicht mehr gibt.
  // Nur die Speichertabelle auswerten – die Codebeleg-Tabelle darüber nennt
  // ebenfalls Bezeichner in Backticks (fetch, XMLHttpRequest …).
  const storageSection = LEGAL_DS.split("## Was lokal gespeichert wird")[1] || "";
  const documented = [...(storageSection.match(/^\| `([a-z_]+)`/gm) || [])].map(m => m.replace(/.*`([a-z_]+)`/, "$1"));
  const stale = documented.filter(k => !lsKeys.includes(k));
  ok("der Datenschutzentwurf nennt keine Schlüssel, die der Code nicht mehr setzt",
     stale.length === 0, stale.join(", "));

  // Rechtsdokumente liegen als gekennzeichnete Entwürfe vor
  [["LICENSE", /ENTWURF/], ["LEGAL/00-UEBERSICHT.md", /Entwurf/],
   ["LEGAL/IMPRESSUM-ENTWURF.md", /§ 5 ECG/], ["LEGAL/LIZENZ-ENTSCHEIDUNG.md", /bewusst nicht getroffen/],
   ["LEGAL/RUECKMELDEWEG.md", /bewusst nicht getroffen/], ["README.md", /npm run validate/]
  ].forEach(([f, re]) => {
    const p = path.join(__dirname, f);
    ok("vorhanden und inhaltlich passend: " + f,
       fs.existsSync(p) && re.test(fs.readFileSync(p, "utf8")));
  });

  // Versionsgleichstand über alle vier Stellen
  const appVer = (HTML.match(/APP_VERSION\s*=\s*'([^']+)'/) || [])[1] || "";
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
  const appCacheN = (HTML.match(/APP_CACHE_NAME\s*=\s*'([^']+)'/) || [])[1] || "";
  const numeric = appVer.replace(/-.*$/, "");
  ok("APP_VERSION, CACHE_NAME und package.json sind deckungsgleich",
     appCacheN === "kfz-multimeter-profi-v" + numeric.split(".").join("-") &&
     pkg.version.startsWith(numeric + "."),
     JSON.stringify({ appVer, appCacheN, pkg: pkg.version }));

  section("20 · Vollzähligkeit gegen den Vorzustand");
  // Grund für diesen Abschnitt: Beim Zusammenführen sind schon einmal drei Karten
  // ersatzlos entfallen, während alle Tests grün blieben. Eine Prüfsuite, die einen
  // solchen Verlust nicht bemerkt, prüft die falsche Sache.
  const basePath = path.join(__dirname, "baseline.json");
  if (!fs.existsSync(basePath)) {
    ok("baseline.json vorhanden", false, "fehlt – Vollzähligkeit ungeprüft");
  } else {
    const BASE = JSON.parse(fs.readFileSync(basePath, "utf8"));
    let warnCount = 0; TESTS.forEach(t => warnCount += (t.warn || []).length);
    let rowCount = 0, fsCount = 0, anlCount = 0, ursCount = 0;
    Object.values(DEEP).forEach(dd => {
      if (dd.rt && dd.rt.rows) rowCount += dd.rt.rows.length;
      if (dd.rt2 && dd.rt2.rows) rowCount += dd.rt2.rows.length;
      fsCount += (dd.fs || []).length;
      anlCount += (dd.anl || []).length;
      ursCount += (dd.urs || []).length;
    });
    TESTS.forEach(t => { if (t.table && t.table.rows) rowCount += t.table.rows.length; });
    const actual = {
      cards: TESTS.length, deep: Object.keys(DEEP).length, trees: Object.keys(TREES).length,
      warnings: warnCount, tableRows: rowCount, fsSteps: fsCount, anlSteps: anlCount, ursRows: ursCount
    };
    Object.entries(BASE.minima).forEach(([k, min]) => {
      ok("kein Verlust bei " + k + " (Basis " + min + ", jetzt " + actual[k] + ")", actual[k] >= min);
    });
    // Reine Zählprüfung würde "eine Karte weg, eine neu" nicht bemerken.
    const lost = BASE.cardIds.filter(id => !TESTS.some(t => t.id === id));
    ok("jede Karte der Basis existiert noch (" + BASE.cardIds.length + " IDs namentlich geprüft)",
       lost.length === 0, "verloren: " + lost.join(", "));
    const added = TESTS.map(t => t.id).filter(id => !BASE.cardIds.includes(id));
    if (added.length) console.log("  ℹ neu gegenüber der Basis: " + added.join(", "));
  }

  if (notes.length) {
    section("Hinweise (kein Fehler)");
    console.log("  ℹ " + notes.length + "× TESTS.table liegt unter einem DEEP.rt und wird nicht gerendert");
    console.log("    betroffen: " + notes.map(n => n.split(":")[0].replace("DEEP ", "")).join(", "));
  }

  console.log("\n================================");
  console.log(failed === 0 ? "ALLE PRÜFUNGEN BESTANDEN (" + passed + ")" : "FEHLGESCHLAGEN: " + failed + " von " + (passed + failed));
  process.exit(failed === 0 ? 0 : 1);
})().catch(e => { console.error("Validator-Absturz:", e); process.exit(2); });
