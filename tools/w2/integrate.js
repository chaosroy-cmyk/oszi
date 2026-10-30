"use strict";
/* Integration der Kartendateien in index.html (idempotent).
   node integrate.js <index.html> <karte1.js> [karte2.js ...] [--dry]
   - Modelle (/* @models *\/…) und Quellen (/* @quellen *\/…) je Datei als markierter Block vor
     "SIGNALMODELLE (Karten) — ENDE" (erneuter Lauf ersetzt den Block derselben Datei)
   - gut:[…] und schlecht:[…] jeder Karte durch den Inhalt aus CARDPATCH["id"] ersetzen
   - NEUKARTE["id"] = {⏎id:"id", kat:"…", …} = komplette neue Karte: wird hinter der letzten Karte
     derselben kat in KARTEN eingefügt; existiert die id schon (erneuter Lauf), wird das Objekt ersetzt
   - prüft: Karte existiert, Klammern passen, keine doppelten Modellnamen */
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), dry = args.includes('--dry');
const files = args.filter(a => a !== '--dry'); const htmlPath = files.shift();
if (!htmlPath || !files.length) { console.error('Aufruf: integrate.js <index.html> <karte.js>... [--dry]'); process.exit(2); }
let html = fs.readFileSync(htmlPath, 'utf8');
const END = '/* ===== SIGNALMODELLE (Karten) — ENDE ===== */';
if (html.split(END).length !== 2) throw new Error('Ende-Marker der Kartenmodelle nicht eindeutig');

function matchBracket(src, openIdx) {
  const open = src[openIdx], close = { '[': ']', '{': '}', '(': ')' }[open];
  if (!close) throw new Error('kein öffnendes Klammerzeichen bei ' + openIdx);
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
function between(src, a, b, label) {
  const i = src.indexOf(a), j = src.indexOf(b);
  if (i < 0 || j < 0 || j < i) throw new Error(label + ': Marker fehlen (' + a + ' … ' + b + ')');
  if (src.indexOf(a, i + 1) >= 0) throw new Error(label + ': Marker ' + a + ' mehrfach');
  return src.slice(i + a.length, j).trim();
}
function arrayInner(src, fromIdx, key, label) {
  const lineStart = key[0] === '\n', name = lineStart ? key.slice(1) : key;
  const re = new RegExp((lineStart ? '\\n[ \\t]*' : '\\b') + name + '\\s*:\\s*\\[', 'g');
  re.lastIndex = fromIdx; const mm = re.exec(src);
  if (!mm) throw new Error(label + ': ' + name + ':[ nicht gefunden');
  const o = mm.index + mm[0].length - 1, c = matchBracket(src, o);
  if (c < 0) throw new Error(label + ': Klammer von ' + key + ' nicht geschlossen');
  return { start: o + 1, end: c, inner: src.slice(o + 1, c) };
}
const modelNames = {};
(html.match(/SIG\.M\.([A-Za-z0-9_]+)\s*=/g) || []).forEach(m => { const n = m.match(/SIG\.M\.([A-Za-z0-9_]+)/)[1]; modelNames[n] = 'index.html'; });

const report = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8'), base = path.basename(f);
  const models = between(src, '/* @models */', '/* @end-models */', base);
  const quellen = between(src, '/* @quellen */', '/* @end-quellen */', base);
  /* alten Block dieser Datei entfernen (idempotent) */
  const gs = '/* --- @gruppe:' + base + ' START --- */', ge = '/* --- @gruppe:' + base + ' ENDE --- */';
  const oi = html.indexOf(gs);
  if (oi >= 0) {
    const oe = html.indexOf(ge, oi); if (oe < 0) throw new Error(base + ': alter Block ohne Ende');
    const oldBlock = html.slice(oi, oe + ge.length);
    (oldBlock.match(/SIG\.M\.([A-Za-z0-9_]+)\s*=/g) || []).forEach(m => { delete modelNames[m.match(/SIG\.M\.([A-Za-z0-9_]+)/)[1]]; });
    html = html.slice(0, oi) + html.slice(oe + ge.length).replace(/^\n/, '');
  }
  (models.match(/SIG\.M\.([A-Za-z0-9_]+)\s*=/g) || []).forEach(m => {
    const n = m.match(/SIG\.M\.([A-Za-z0-9_]+)/)[1];
    if (modelNames[n]) throw new Error('Modellname doppelt: ' + n + ' (' + base + ' und ' + modelNames[n] + ')');
    modelNames[n] = base;
  });
  const block = gs + '\n' + models + '\n' + quellen + '\n' + ge + '\n';
  html = html.replace(END, block + END);
  /* Karten-Arrays ersetzen */
  const ids = [...src.matchAll(/CARDPATCH\["([a-z0-9-]+)"\]\s*=/g)].map(m => m[1]);
  const neu = [...src.matchAll(/NEUKARTE\["([a-z0-9-]+)"\]\s*=/g)].map(m => m[1]);
  const figIds = [...src.matchAll(/FIGPATCH\["([a-z0-9-]+)"\]\s*=/g)].map(m => m[1]);
  const fdbIds = [...src.matchAll(/FDBPATCH\["([a-z0-9-]+)"\]\s*=/g)].map(m => m[1]);
  if (!ids.length && !neu.length && !figIds.length && !fdbIds.length) throw new Error(base + ': weder CARDPATCH, NEUKARTE, FIGPATCH noch FDBPATCH gefunden');
  /* W2(...)-Literal hinter PATCH["id"] = */
  function w2Literal(key, id) {
    const pi = src.indexOf(key + '["' + id + '"]'), w = src.indexOf('W2(', pi);
    if (pi < 0 || w < 0) throw new Error(base + '/' + id + ': W2( nicht gefunden');
    const c = matchBracket(src, w + 2); if (c < 0) throw new Error(base + '/' + id + ': W2( nicht geschlossen');
    return src.slice(w, c + 1);
  }
  /* an Position p (nach Leerraum) steht W2(…), W(…) oder {…}: Ende liefern */
  function imgSpan(h, p) {
    while (/\s/.test(h[p])) p++;
    if (h.startsWith('W2(', p)) return [p, matchBracket(h, p + 2)];
    if (h.startsWith('W(', p)) return [p, matchBracket(h, p + 1)];
    if (h[p] === '{') return [p, matchBracket(h, p)];
    return [p, -1];
  }
  for (const id of figIds) {
    const lit = w2Literal('FIGPATCH', id);
    const fi = html.indexOf('fig("' + id + '",');
    if (fi < 0 || html.indexOf('fig("' + id + '",', fi + 1) >= 0) throw new Error(id + ': fig("' + id + '",…) nicht eindeutig in index.html');
    const [a, e] = imgSpan(html, fi + ('fig("' + id + '",').length);
    if (e < 0) throw new Error(id + ': Bild-Spec in fig() nicht erkannt');
    html = html.slice(0, a) + lit + html.slice(e + 1);
    report.push({ datei: base, bild: id, ersetzt: 'fig' });
  }
  for (const id of fdbIds) {
    const lit = w2Literal('FDBPATCH', id);
    const fa = html.indexOf('var FEHLERDB=['), fb = matchBracket(html, fa + 'var FEHLERDB='.length);
    if (fa < 0 || fb < 0) throw new Error('FEHLERDB-Array nicht gefunden');
    const ii = html.indexOf('id:"' + id + '",', fa);
    if (ii < 0 || ii > fb) throw new Error(id + ': FEHLERDB-Eintrag nicht gefunden');
    const bi = html.indexOf('bild:', ii); if (bi < 0 || bi > fb) throw new Error(id + ': bild: nicht gefunden');
    const [a, e] = imgSpan(html, bi + 5);
    if (e < 0) throw new Error(id + ': Bild hinter bild: nicht erkannt');
    html = html.slice(0, a) + lit + html.slice(e + 1);
    report.push({ datei: base, fehlermuster: id, ersetzt: 'bild' });
  }
  for (const id of neu) {
    const pi = src.indexOf('NEUKARTE["' + id + '"]'), o = src.indexOf('{', pi), c = matchBracket(src, o);
    if (o < 0 || c < 0) throw new Error(base + '/' + id + ': Objekt nicht geschlossen');
    let body = src.slice(o + 1, c).replace(/^\s+/, '');
    if (body.indexOf('id:"' + id + '"') !== 0) throw new Error(base + '/' + id + ': Objekt muss mit id:"' + id + '" beginnen');
    const lit = '{\n' + body.replace(/\s+$/, '') + '\n}';
    const kat = (body.match(/\bkat:"([a-z]+)"/) || [])[1];
    if (!kat) throw new Error(base + '/' + id + ': kat fehlt');
    const ka = html.indexOf('var KARTEN=['), kb = matchBracket(html, ka + 'var KARTEN='.length);
    if (ka < 0 || kb < 0) throw new Error('KARTEN-Array nicht gefunden');
    const idMark = '\nid:"' + id + '"', ci = html.indexOf(idMark, ka);
    if (ci >= 0 && ci < kb) {
      const st = html.lastIndexOf('{', ci); if (html.slice(st + 1, ci).trim() !== '') throw new Error(id + ': Kartenanfang unklar');
      const en = matchBracket(html, st); html = html.slice(0, st) + lit + html.slice(en + 1);
      report.push({ datei: base, karte: id, neu: 'ersetzt' });
    } else {
      /* erste Karte einer neuen kat: hinter die letzte Karte der verwandten kat (Ersatzkette) */
      const KETTE = { einspr: ['einspr', 'aktor'], elektrik: ['elektrik', 'einspr', 'aktor'] };
      let last = -1;
      for (const k of (KETTE[kat] || [kat])) {
        const re = new RegExp('\\nid:"[a-z0-9-]+", kat:"' + k + '"', 'g'); re.lastIndex = ka; let m;
        while ((m = re.exec(html)) && m.index < kb) last = m.index;
        if (last >= 0) break;
      }
      if (last < 0) throw new Error(id + ': keine Karte mit kat ' + kat + ' als Einfügeort');
      const st = html.lastIndexOf('{', last), en = matchBracket(html, st);
      html = html.slice(0, en + 1) + ',\n\n' + lit + html.slice(en + 1);
      report.push({ datei: base, karte: id, neu: 'eingefügt nach kat ' + kat, gut: (lit.match(/\bW2\(/g) || []).length });
    }
  }
  for (const id of ids) {
    const pi = src.indexOf('CARDPATCH["' + id + '"]');
    const pg = arrayInner(src, pi, 'gut', base + '/' + id), ps = arrayInner(src, pg.end, 'schlecht', base + '/' + id);
    const idMark = 'id:"' + id + '"', ci = html.indexOf(idMark);
    if (ci < 0 || html.indexOf(idMark, ci + 1) >= 0) throw new Error('Karte ' + id + ' nicht eindeutig in index.html');
    const nextCard = html.indexOf('\nid:"', ci + idMark.length);
    const hg = arrayInner(html, ci, '\ngut', 'index/' + id);
    if (nextCard >= 0 && hg.start > nextCard) throw new Error(id + ': gut:[ liegt nicht in der Karte');
    const before = html.slice(0, hg.start), after = html.slice(hg.end);
    html = before + '\n' + pg.inner.trim() + '\n' + after;
    const hs = arrayInner(html, ci, '\nschlecht', 'index/' + id);
    if (nextCard >= 0 && hs.start > html.indexOf('\nid:"', ci + idMark.length)) throw new Error(id + ': schlecht:[ liegt nicht in der Karte');
    html = html.slice(0, hs.start) + '\n' + ps.inner.trim() + '\n' + html.slice(hs.end);
    report.push({ datei: base, karte: id, gut: (pg.inner.match(/\bW2\(/g) || []).length, schlecht: (ps.inner.match(/\bW2\(/g) || []).length });
  }
}
if (!dry) fs.writeFileSync(htmlPath, html);
console.log((dry ? '[DRY] ' : '') + JSON.stringify(report));
console.log('Modelle gesamt: ' + Object.keys(modelNames).length);
