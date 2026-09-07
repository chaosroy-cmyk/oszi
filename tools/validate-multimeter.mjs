#!/usr/bin/env node
/* Datenvalidierung der Multimeter-PWA (multimeter/) – ohne Abhängigkeiten.
 *
 *   node tools/validate-multimeter.mjs
 *
 * Der Skriptblock aus multimeter/index.html wird in einer VM mit minimalem
 * DOM-Ersatz ausgeführt (fängt damit auch Syntax- und Ladefehler ab) und
 * anschließend inhaltlich geprüft:
 *
 *   - Prüfkarten (TESTS): eindeutige IDs, Pflichtfelder, gültige Kategorie/Tag,
 *     Tabellenform, Warnstufen
 *   - Detailblöcke (DEEP): 1:1-Abdeckung, Tabellenspalten, Ursachen, Fehlersuche
 *   - Diagnosebäume (TREES): gültige Sprungziele, keine unerreichbaren Knoten
 *   - Glossar (GLOSS): Form, keine Dubletten
 *   - mV-Drop-Rechner: Rechenweg gegen Referenzwerte
 *   - Release-Hygiene: APP_VERSION ↔ sw.js CACHE_NAME, Manifest, gecachte Dateien
 *
 * Exit-Code 1 bei Fehlern, 0 wenn nur Hinweise oder alles sauber ist.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.join(ROOT, "multimeter");

const errors = [];
const warnings = [];
const err = m => errors.push(m);
const warn = m => warnings.push(m);

/* ---------- Skriptblock aus der Einzeldatei holen ---------- */
const html = fs.readFileSync(path.join(APP, "index.html"), "utf8");
const block = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
  .map(m => m[1])
  .find(code => /const\s+TESTS\s*=/.test(code));
if (!block) {
  console.error("✗ Kein <script>-Block mit const TESTS gefunden – Aufbau der index.html geändert?");
  process.exit(2);
}

/* ---------- Minimaler DOM-Ersatz ---------- */
/* Unbekannte Zugriffe liefern einen aufrufbaren Stub, damit der App-Code beim
   Laden (Event-Listener, Rendering) nicht abbricht. Für den Rechner werden
   echte Elemente registriert, damit sein Ergebnis prüfbar ist. */
const stub = () => new Proxy(function () {}, {
  get: (t, p) => (p === "then" ? undefined : stub()),
  set: () => true,
  apply: () => stub(),
  construct: () => stub()
});

const calcEls = {
  cFuse: { value: "11" },
  cMv: { value: "" },
  cOut: { className: "", innerHTML: "" }
};

const ctx = {
  console,
  setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: () => 0,
  location: { href: "", hash: "", search: "", reload() {} },
  history: { pushState() {}, back() {}, replaceState() {} },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  navigator: { userAgent: "node", platform: "node", maxTouchPoints: 0, standalone: false, serviceWorker: stub() },
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  addEventListener: () => {}, removeEventListener: () => {},
  fetch: () => Promise.resolve(stub()),
  document: new Proxy({}, {
    get: (t, p) => {
      if (p === "getElementById") return id => calcEls[id] || stub();
      return stub();
    }
  })
};
ctx.window = ctx;
ctx.self = ctx;
ctx.globalThis = ctx;

/* const/let bleiben lexikalisch – die Daten werden am Ende per var exportiert. */
const EXPORT = ";var __EXPORT = {TESTS, DEEP, TREES, GLOSS, CATS, FUSE_R," +
  "R_COLD_FACTOR: (typeof R_COLD_FACTOR === 'undefined' ? null : R_COLD_FACTOR)," +
  "APP_VERSION: (typeof APP_VERSION === 'undefined' ? null : APP_VERSION)," +
  "calcMvDrop: (typeof calcMvDrop === 'undefined' ? null : calcMvDrop)};";
try {
  vm.runInNewContext(block + EXPORT, vm.createContext(ctx), { filename: "multimeter/index.html", timeout: 15000 });
} catch (e) {
  console.error("✗ Skript aus multimeter/index.html nicht ausführbar: " + e.message);
  process.exit(1);
}

const { TESTS, DEEP, TREES, GLOSS, CATS, FUSE_R, R_COLD_FACTOR, APP_VERSION, calcMvDrop } = ctx.__EXPORT || {};
for (const [name, val] of Object.entries({ TESTS, DEEP, TREES, GLOSS, CATS, FUSE_R })) {
  if (!val) { console.error(`✗ ${name} nach dem Laden nicht definiert.`); process.exit(1); }
}

/* ---------- Prüfkarten ---------- */
const RATING = new Set(["g", "w", "b"]);
const WARNLEVEL = new Set(["danger", "caution", "info"]);
const TAGS = new Set(["mm", "osz", "gef"]);
const catIds = new Set(CATS.map(c => c.id));
const ids = TESTS.map(t => t.id);
const REQUIRED = ["id", "cat", "ic", "nm", "tag", "was", "set", "mess", "good", "bad", "next", "beg"];

ids.filter((v, i) => ids.indexOf(v) !== i).forEach(d => err(`Doppelte Prüfkarten-ID: ${d}`));

for (const t of TESTS) {
  const miss = REQUIRED.filter(f => !t[f]);
  if (miss.length) err(`Karte "${t.id}": Pflichtfeld fehlt (${miss.join(", ")})`);
  if (!catIds.has(t.cat)) err(`Karte "${t.id}": Kategorie "${t.cat}" hat keinen Filter-Chip in CATS`);
  if (!TAGS.has(t.tag)) err(`Karte "${t.id}": unbekannter Tag "${t.tag}"`);
  if (t.set && !t.set.mode) err(`Karte "${t.id}": set.mode fehlt`);
  if (t.probes && t.probes.some(p => !Array.isArray(p) || p.length !== 2))
    err(`Karte "${t.id}": probes müssen [farbe, text] sein`);
  (t.warn || []).forEach(w => {
    if (!Array.isArray(w) || w.length !== 2) err(`Karte "${t.id}": warn-Eintrag muss [stufe, text] sein`);
    else if (!WARNLEVEL.has(w[0])) err(`Karte "${t.id}": unbekannte Warnstufe "${w[0]}"`);
  });
  if (t.table) {
    // tableHTML() rendert fix drei Spalten und erwartet in r[2] die Bewertung
    if (t.table.head.length !== 3) err(`Karte "${t.id}": table braucht genau 3 Spalten (hat ${t.table.head.length})`);
    t.table.rows.forEach(r => {
      if (r.length !== 3) err(`Karte "${t.id}": Tabellenzeile mit ${r.length} statt 3 Zellen: ${JSON.stringify(r)}`);
      else if (!RATING.has(r[2])) err(`Karte "${t.id}": dritte Spalte muss g/w/b sein, ist "${r[2]}" – sonst bleibt die Zelle leer`);
    });
  }
  if (t.calc && t.calc !== "mvdrop") err(`Karte "${t.id}": unbekannter Rechner "${t.calc}"`);
}

/* ---------- Detailblöcke ---------- */
Object.keys(DEEP).filter(k => !ids.includes(k)).forEach(k => err(`Detailblock "${k}" hat keine Prüfkarte`));
ids.filter(k => !DEEP[k]).forEach(k => err(`Prüfkarte "${k}" hat keinen Detailblock`));

for (const [k, d] of Object.entries(DEEP)) {
  if (d.rt) {
    const H = d.rt.head.length;
    d.rt.rows.forEach(r => {
      if (r.length !== H) err(`Detail "${k}": Richtwert-Zeile mit ${r.length} Zellen bei ${H} Spalten: ${JSON.stringify(r)}`);
    });
    if (!d.rt.note) warn(`Detail "${k}": Richtwerttabelle ohne Note (Einordnung/Marken-Hinweis fehlt)`);
  }
  (d.urs || []).forEach(u => {
    if (!Array.isArray(u) || u.length !== 3) err(`Detail "${k}": Ursache muss [ursache, detail, häufigkeit] sein`);
    else if (!["h", "m", "s"].includes(u[2])) err(`Detail "${k}": Häufigkeit muss h/m/s sein, ist "${u[2]}"`);
  });
  (d.fs || []).forEach((s, i) => {
    if (!s.s || !s.do) err(`Detail "${k}": Fehlersuche-Schritt ${i + 1} braucht s und do`);
  });
  if (!d.rt && !d.urs && !d.fs && !d.anl) warn(`Detail "${k}": leer – kein anl/rt/urs/fs`);
}

/* ---------- Diagnosebäume ---------- */
for (const [k, tr] of Object.entries(TREES)) {
  if (!tr.title) err(`Baum "${k}": title fehlt`);
  const n = (tr.nodes || []).length;
  if (!n) { err(`Baum "${k}": keine Knoten`); continue; }
  if (typeof tr.start !== "number" || tr.start < 0 || tr.start >= n) err(`Baum "${k}": start "${tr.start}" ungültig`);
  tr.nodes.forEach((nd, i) => {
    if (!nd.q && !nd.r) err(`Baum "${k}" Knoten ${i}: weder Frage (q) noch Ergebnis (r)`);
    if (nd.q && !(nd.opts || []).length) err(`Baum "${k}" Knoten ${i}: Frage ohne Antwortoptionen`);
    (nd.opts || []).forEach(o => {
      if (!o.t) err(`Baum "${k}" Knoten ${i}: Option ohne Text`);
      if (typeof o.go !== "number" || o.go < 0 || o.go >= n) err(`Baum "${k}" Knoten ${i}: Sprungziel "${o.go}" existiert nicht`);
      else if (o.go === i) err(`Baum "${k}" Knoten ${i}: Option springt auf sich selbst`);
    });
  });
  const seen = new Set([tr.start]);
  const stack = [tr.start];
  while (stack.length) {
    const c = stack.pop();
    (tr.nodes[c]?.opts || []).forEach(o => { if (!seen.has(o.go)) { seen.add(o.go); stack.push(o.go); } });
  }
  const orphan = tr.nodes.map((_, i) => i).filter(i => !seen.has(i));
  if (orphan.length) err(`Baum "${k}": unerreichbare Knoten ${orphan.join(", ")}`);
}

/* ---------- Glossar ---------- */
const terms = GLOSS.map(g => g[0]);
terms.filter((v, i) => terms.indexOf(v) !== i).forEach(d => err(`Glossar-Dublette: ${d}`));
GLOSS.forEach(g => {
  if (!Array.isArray(g) || g.length !== 2 || !g[0] || !g[1]) err(`Glossar-Eintrag fehlerhaft: ${JSON.stringify(g)}`);
});

/* ---------- mV-Drop-Rechner ---------- */
if (typeof calcMvDrop === "function") {
  const factor = typeof R_COLD_FACTOR === "number" ? R_COLD_FACTOR : 1;
  if (factor <= 0 || factor > 1) err(`R_COLD_FACTOR muss zwischen 0 und 1 liegen (ist ${factor})`);
  FUSE_R.forEach(f => {
    if (!(f.r > 0)) err(`FUSE_R "${f.v}": Innenwiderstand muss > 0 sein`);
    const nenn = parseFloat(String(f.v).replace(",", "."));
    // Abfall bei Nennstrom = R * I; Flachsicherungen liegen laut Datenblatt bei ~0,1 V
    const dropAtRated = (f.r / 1000) * nenn;
    if (dropAtRated < 0.04 || dropAtRated > 0.3)
      err(`FUSE_R "${f.v}": rechnerischer Abfall bei Nennstrom ${dropAtRated.toFixed(3)} V ist unplausibel (Flachsicherungen liegen bei ~0,1 V) – Innenwiderstand prüfen`);
    else if (dropAtRated < 0.06 || dropAtRated > 0.2)
      warn(`FUSE_R "${f.v}": rechnerischer Abfall bei Nennstrom ${dropAtRated.toFixed(3)} V liegt außerhalb des üblichen Bereichs 0,06–0,2 V`);
  });
  // Referenzfälle: I = U/R, mV/mΩ kürzt sich zu A
  [
    { r: "11", mv: "1,1", lo: 100, hi: 100 / factor },
    { r: "5.8", mv: "0,58", lo: 100, hi: 100 / factor },
    { r: "45", mv: "0,45", lo: 10, hi: 10 / factor }
  ].forEach(c => {
    calcEls.cFuse.value = c.r;
    calcEls.cMv.value = c.mv;
    calcEls.cOut.innerHTML = "";
    calcMvDrop();
    const txt = String(calcEls.cOut.innerHTML).replace(/<[^>]*>/g, " ");
    const nums = (txt.match(/[\d.,]+/g) || []).map(s => parseFloat(s.replace(",", ".")));
    const okLo = nums.some(v => Math.abs(v - c.lo) / c.lo < 0.05);
    const okHi = nums.some(v => Math.abs(v - c.hi) / c.hi < 0.05);
    if (!okLo || !okHi) err(`mV-Drop-Rechner: ${c.mv} mV an ${c.r} mΩ ergibt nicht ${c.lo.toFixed(0)}–${c.hi.toFixed(0)} mA (Ausgabe: "${txt.trim()}")`);
    if (/\d\.\d/.test(txt)) warn(`mV-Drop-Rechner: Ausgabe enthält einen Dezimalpunkt statt Komma ("${txt.trim()}")`);
  });
  const withCalc = TESTS.filter(t => t.calc === "mvdrop").length;
  if (!withCalc) err("Keine Prüfkarte verweist auf den mV-Drop-Rechner (calc:\"mvdrop\")");
} else {
  err("calcMvDrop() nicht gefunden");
}

/* ---------- Release-Hygiene ---------- */
const sw = fs.readFileSync(path.join(APP, "sw.js"), "utf8");
const cacheName = (sw.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/) || [])[1];
if (!APP_VERSION) err("APP_VERSION nicht gefunden");
if (!cacheName) err("CACHE_NAME in sw.js nicht gefunden");
if (APP_VERSION && cacheName) {
  // "7.4-Profi" muss zu "...-v7-4" passen
  const v = String(APP_VERSION).split("-")[0].replace(/\./g, "-");
  if (!cacheName.endsWith("v" + v))
    err(`APP_VERSION "${APP_VERSION}" und CACHE_NAME "${cacheName}" passen nicht zusammen (erwartet Endung "v${v}")`);
}

let manifest = null;
try {
  manifest = JSON.parse(fs.readFileSync(path.join(APP, "manifest.webmanifest"), "utf8"));
} catch (e) {
  err("manifest.webmanifest ist kein gültiges JSON: " + e.message);
}
if (manifest) {
  ["id", "name", "short_name", "start_url", "scope", "display", "icons"].forEach(f => {
    if (!manifest[f]) err(`Manifest: Feld "${f}" fehlt`);
  });
  (manifest.icons || []).forEach(i => {
    if (!fs.existsSync(path.join(APP, i.src))) err(`Manifest: Icon "${i.src}" existiert nicht`);
  });
  if (!(manifest.icons || []).some(i => (i.purpose || "").split(/\s+/).includes("maskable")))
    warn("Manifest: kein maskable-Icon – Android-Startsymbol wird beschnitten");
}

const assets = (sw.match(/const\s+ASSETS\s*=\s*\[([\s\S]*?)\]/) || [])[1] || "";
[...assets.matchAll(/['"]\.\/([^'"]+)['"]/g)].forEach(m => {
  if (!fs.existsSync(path.join(APP, m[1]))) err(`sw.js cacht "./${m[1]}" – Datei existiert nicht`);
});

/* ---------- Ausgabe ---------- */
console.log(
  `Prüfkarten: ${TESTS.length} · Detailblöcke: ${Object.keys(DEEP).length} · ` +
  `Bäume: ${Object.keys(TREES).length} (${Object.values(TREES).reduce((a, t) => a + (t.nodes || []).length, 0)} Knoten) · ` +
  `Glossar: ${GLOSS.length} · Version: ${APP_VERSION}`
);
warnings.forEach(w => console.warn("  ! " + w));
errors.forEach(e => console.error("  ✗ " + e));
console.log(errors.length ? `FEHLGESCHLAGEN – ${errors.length} Fehler` : `OK – keine Fehler${warnings.length ? `, ${warnings.length} Hinweis(e)` : ""}`);
process.exit(errors.length ? 1 : 0);
