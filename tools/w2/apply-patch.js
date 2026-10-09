"use strict";
/* Textkorrekturen in Kartentexten (index.html) prüfen bzw. anwenden.
   node apply-patch.js <patch.json> [--check] [--html <index.html>]
   patch.json: [{karte, feld, alt, neu, befund, quelle}, ...]
   Regeln je Eintrag:
   - alt kommt im Kartenbereich (id:"karte" bis zur nächsten Karte) genau EINMAL vor,
     und zwar AUSSERHALB von gut:[…] und schlecht:[…] (die Bilder werden hier nicht angefasst)
   - alt liegt im angegebenen Feld (letzter Feldschlüssel vor der Fundstelle, z. B. "tipps" oder "setup.tdiv" -> "tdiv")
   - neu enthält kein ", keinen Zeilenumbruch, keinen Backslash
   - geschützte Regressionstexte bleiben erhalten
   --check: nur prüfen (Exit 1 bei Fehlern), sonst anwenden und index.html schreiben. */
const fs = require('fs');
const args = process.argv.slice(2);
const check = args.includes('--check');
const hi = args.indexOf('--html');
const htmlPath = hi >= 0 ? args[hi + 1] : require('path').resolve(__dirname, '..', '..', 'index.html');
const patchPath = args.find((a, i) => !a.startsWith('--') && (hi < 0 || i !== hi + 1));
if (!patchPath) { console.error('Aufruf: apply-patch.js <patch.json> [--check]'); process.exit(2); }
const PROTECT = ['Lücke: 2 Zähne fehlen', '0,2–1 Ω je nach Hersteller', 'nominal ±~2 V', 'KFZ-OSZI-RS-803792F7BB4A6C59'];

function matchBracket(src, openIdx) {
  const close = { '[': ']', '{': '}', '(': ')' }[src[openIdx]];
  let depth = 0, inStr = null, esc = false;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i], nx = src[i + 1];
    if (inStr) { if (esc) { esc = false; continue; } if (ch === '\\') { esc = true; continue; } if (ch === inStr) inStr = null; continue; }
    if (ch === '/' && nx === '/') { const j = src.indexOf('\n', i); if (j < 0) return -1; i = j; continue; }
    if (ch === '/' && nx === '*') { const j = src.indexOf('*/', i + 2); if (j < 0) return -1; i = j + 1; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '[' || ch === '{' || ch === '(') depth++;
    else if (ch === ']' || ch === '}' || ch === ')') { depth--; if (depth === 0) return i; }
  }
  return -1;
}
function cardRegion(html, id) {
  const mark = 'id:"' + id + '"', a = html.indexOf(mark);
  if (a < 0 || html.indexOf(mark, a + 1) >= 0) return null;
  let b = html.indexOf('\nid:"', a + mark.length); if (b < 0) b = html.length;
  const skip = [];
  for (const key of ['gut', 'schlecht']) {
    const re = new RegExp('\\n[ \\t]*' + key + '\\s*:\\s*\\[', 'g'); re.lastIndex = a; const m = re.exec(html);
    if (m && m.index < b) { const o = m.index + m[0].length - 1, c = matchBracket(html, o); if (c > 0) skip.push([o, c]); }
  }
  return { a, b, skip };
}
function fieldAt(html, a, pos) {
  const seg = html.slice(a, pos);
  /* letzter Feldschlüssel ausserhalb von Strings: einfache Näherung über  key:"  bzw.  key:[  bzw. key:{ */
  const re = /(?:^|[\s,{])([A-Za-z0-9_]+)\s*:\s*["\[{]/g; let m, last = null;
  while ((m = re.exec(seg))) last = m[1];
  return last;
}

let html = fs.readFileSync(htmlPath, 'utf8');
const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));
const list = Array.isArray(patch) ? patch : (patch.aenderungen || []);
let errors = 0, applied = 0, already = 0;
list.forEach((p, k) => {
  const tag = '#' + k + ' ' + p.karte + '/' + p.feld;
  const fail = (msg) => { errors++; console.log('✗ ' + tag + ': ' + msg); };
  if (!p.karte || !p.feld || typeof p.alt !== 'string' || typeof p.neu !== 'string') return fail('karte/feld/alt/neu fehlt');
  if (!p.alt.length) return fail('alt leer');
  if (/["\n\r\\]/.test(p.neu)) return fail('neu enthält " oder Zeilenumbruch oder Backslash');
  const r = cardRegion(html, p.karte); if (!r) return fail('Karte nicht (eindeutig) gefunden');
  const inSkip = (i) => r.skip.some(([o, c]) => i >= o && i <= c);
  const hits = []; let i = html.indexOf(p.alt, r.a);
  while (i >= 0 && i < r.b) { if (!inSkip(i)) hits.push(i); i = html.indexOf(p.alt, i + 1); }
  if (hits.length === 0) {
    if (html.slice(r.a, r.b).indexOf(p.neu) >= 0) { already++; console.log('= ' + tag + ': bereits angewandt'); return; }
    return fail('alt nicht gefunden (ausserhalb gut/schlecht)');
  }
  if (hits.length > 1) return fail('alt ' + hits.length + '× gefunden – länger fassen');
  const f = fieldAt(html, r.a, hits[0]), want = p.feld.split('.').pop().replace(/\[\d+\]$/, '');
  if (f !== want) return fail('liegt im Feld "' + f + '", nicht "' + want + '"');
  const next = html.slice(0, hits[0]) + p.neu + html.slice(hits[0] + p.alt.length);
  const lost = PROTECT.filter(s => html.split(s).length !== next.split(s).length);
  if (lost.length) return fail('würde geschützten Text ändern: ' + lost.join(', '));
  if (!check) html = next;
  applied++;
  console.log((check ? '✓ ' : '→ ') + tag);
});
if (!check && !errors) fs.writeFileSync(htmlPath, html);
console.log((check ? '[CHECK] ' : '') + 'ok: ' + applied + ', bereits: ' + already + ', Fehler: ' + errors + (errors && !check ? ' – NICHTS geschrieben' : ''));
process.exit(errors ? 1 : 0);
