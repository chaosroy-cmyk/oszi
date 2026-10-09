"use strict";
/* Autoren-Kit: lädt die echte App (../../index.html bzw. $OSZI_HTML), spielt eine Kartendatei ein
   (CARDPATCH/SIG.M/QUELLEN), ersetzt gut/schlecht der Karte, prüft jedes Bild mit SIG.check
   (inkl. Nachmessen der expect-Werte) und rendert Kontaktbogen + Einzelbilder als PNG.
   Aufruf:
     node tools/w2/render-card.js <kartendatei.js> <ausgabeordner>
     (Playwright nötig: npm i -D playwright; eigenes Chromium per CHROME_PATH)
   Exit 0 = keine Fehler, 1 = Fehler (Details in <ausgabeordner>/report.json und auf stdout). */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const [, , cardFile, outDir] = process.argv;
if (!cardFile || !outDir) { console.error('Aufruf: render-card.js <kartendatei.js> <ausgabeordner>'); process.exit(2); }
(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const p = await b.newPage({ viewport: { width: 1880, height: 1000 } });
  const errs = [];
  p.on('pageerror', e => errs.push('Laufzeitfehler: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('Console: ' + m.text()); });
  await p.goto('file://' + (process.env.OSZI_HTML || path.resolve(__dirname, '..', '..', 'index.html')), { waitUntil: 'networkidle' });
  await p.evaluate(() => { window.CARDPATCH = {}; });
  try { await p.addScriptTag({ path: path.resolve(cardFile) }); } catch (e) { errs.push('Kartendatei nicht ladbar: ' + e.message); }
  const rep = await p.evaluate(() => {
    const out = { cards: [], errors: [] };
    Object.keys(window.CARDPATCH || {}).forEach(id => {
      const c = KARTEN.find(k => k.id === id);
      if (!c) { out.errors.push('Karte nicht gefunden: ' + id); return; }
      const P = CARDPATCH[id]; c.gut = P.gut || []; c.schlecht = P.schlecht || [];
      const card = { id, name: c.name, setup: c.setup, quellen: (window.QUELLEN && QUELLEN[id]) || [], images: [] };
      if (!card.quellen.length) out.errors.push(id + ': QUELLEN["' + id + '"] fehlt oder leer');
      [['G', c.gut], ['F', c.schlecht]].forEach(([k, arr]) => arr.forEach((img, i) => {
        let r;
        if (!img || !img.w2) r = { err: ['kein W2-Bild'], warn: [] };
        else { try { r = SIG.check(img.spec, OsziLogic); } catch (e) { r = { err: ['check: ' + e.message], warn: [] }; } }
        const sp = (img && img.spec) || {};
        card.images.push({ tag: k + i, badge: sp.badge, title: sp.title, cond: sp.cond, err: r.err, warn: r.warn });
      }));
      out.cards.push(card);
    });
    const v = validateKompendium();
    out.setupWarnings = v.warnings.filter(w => Object.keys(window.CARDPATCH).some(id => w.indexOf(id + ' ') === 0 && /Live-Referenz/.test(w)));
    const css = `body{margin:0;background:#05080b;color:#cfe;font:13px system-ui,sans-serif} .c{padding:10px 14px;border-top:2px solid #234}
      .h{color:#ffd24a;font:700 16px system-ui;margin:4px 0 8px} .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      figure{margin:0;background:#0b0f14;border-radius:10px;padding:4px} figure.g{outline:2px solid #2e6b4f} figure.b{outline:2px solid #6b2e35}
      svg{width:100%;height:auto;display:block} figcaption{padding:6px 8px;color:#cfe3f2;font-size:13px;line-height:1.4} .why{color:#9fb3c8}
      .tag{color:#8fb;font:600 12px ui-monospace,monospace;margin:2px 4px}`;
    document.body.innerHTML = '<style>' + css + '</style>' + Object.keys(CARDPATCH).map(id => {
      const c = KARTEN.find(k => k.id === id); if (!c) return '';
      const items = [...c.gut.map((x, i) => ['G' + i, x]), ...c.schlecht.map((x, i) => ['F' + i, x])];
      return '<div class="c" id="card-' + id + '"><div class="h">' + id + ' — ' + c.name + '</div><div class="grid">' +
        items.map(([tag, x]) => '<div class="it" id="img-' + id + '-' + tag + '"><div class="tag">' + tag + '</div>' + x + '</div>').join('') + '</div></div>';
    }).join('');
    return out;
  });
  await p.waitForTimeout(150);
  for (const c of rep.cards) {
    const el = await p.$('#card-' + c.id); if (el) await el.screenshot({ path: path.join(outDir, c.id + '.png') });
    for (const im of c.images) { const e2 = await p.$('#img-' + c.id + '-' + im.tag); if (e2) await e2.screenshot({ path: path.join(outDir, c.id + '-' + im.tag + '.png') }); }
  }
  await b.close();
  rep.runtime = errs;
  const nErr = rep.errors.length + errs.length + rep.cards.reduce((s, c) => s + c.images.reduce((t, i) => t + i.err.length, 0), 0);
  rep.summary = { cards: rep.cards.length, images: rep.cards.reduce((s, c) => s + c.images.length, 0), errors: nErr,
    gut: rep.cards.reduce((s, c) => s + c.images.filter(i => i.tag[0] === 'G').length, 0), fehler: rep.cards.reduce((s, c) => s + c.images.filter(i => i.tag[0] === 'F').length, 0) };
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(rep, null, 2));
  console.log(JSON.stringify(rep.summary) + '  -> ' + outDir);
  rep.cards.forEach(c => c.images.forEach(i => { i.err.forEach(e => console.log('  ✗ ' + c.id + ' ' + i.tag + ': ' + e)); i.warn.forEach(w => console.log('  ! ' + c.id + ' ' + i.tag + ': ' + w)); }));
  (rep.setupWarnings || []).forEach(w => console.log('  ! ' + w));
  errs.forEach(e => console.log('  ✗ ' + e)); rep.errors.forEach(e => console.log('  ✗ ' + e));
  process.exit(nErr ? 1 : 0);
})().catch(e => { console.error('render-card Fehler:', e.message); process.exit(2); });
