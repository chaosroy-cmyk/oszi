#!/usr/bin/env node
/* Tests fuer die Signalbild-Engine W2 und ALLE Kartenmodelle (SIG.M).
   Extrahiert die Bereiche "SIGNALBILD-ENGINE W2" und "SIGNALMODELLE (Karten)" sowie den
   Script-Block oszi-live-logic aus ../index.html und prueft sie DOM-frei unter Node. */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const cand = [path.join(__dirname, '..', 'index.html'), path.join(__dirname, 'index.html'), 'index.html'];
const htmlPath = cand.find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });
assert(htmlPath, 'index.html nicht gefunden');
const html = fs.readFileSync(htmlPath, 'utf8');

function region(startMark, endMark) {
  const a = html.indexOf(startMark), b = html.indexOf(endMark);
  assert(a >= 0 && b > a, 'Bereich nicht gefunden: ' + startMark);
  return html.slice(a, b + endMark.length);
}
const engineSrc = region('/* ===== SIGNALBILD-ENGINE W2 (V11) — START', '/* ===== SIGNALBILD-ENGINE W2 — ENDE ===== */');
const modelsSrc = region('/* ===== SIGNALMODELLE (Karten) — START', '/* ===== SIGNALMODELLE (Karten) — ENDE ===== */');
const logicSrc = (html.match(/<script id="oszi-live-logic">([\s\S]*?)<\/script>/) || [])[1];
assert(logicSrc, 'oszi-live-logic nicht gefunden');

const ctx = { Math, String, Float64Array, Float32Array, Int32Array, isFinite, Error, Array, Object, JSON, console };
vm.createContext(ctx);
vm.runInContext(logicSrc.replace(/if \(typeof module[\s\S]*$/, ''), ctx);
vm.runInContext(engineSrc + '\n' + modelsSrc + '\nthis.SIG=SIG; this.W2=W2; this.QUELLEN=QUELLEN; this.OL=OsziLogic;', ctx);
const SIG = ctx.SIG, W2 = ctx.W2, OL = ctx.OL;

let n = 0;
function t(name, fn) { fn(); n++; console.log('✓ ' + name); }

/* ---- Formatierung ---- */
t('fmtV/fmtT/fmtF mit Dezimalkomma', () => {
  assert.strictEqual(SIG.fmt.fmtV(1.25), '1,25 V');
  assert.strictEqual(SIG.fmt.fmtV(0.2), '200 mV');
  assert.strictEqual(SIG.fmt.fmtV(-3, 'A'), '-3 A');
  assert.strictEqual(SIG.fmt.fmtT(0.00125), '1,25 ms');
  assert.strictEqual(SIG.fmt.fmtT(0.2), '200 ms');
  assert.strictEqual(SIG.fmt.fmtF(800), '800 Hz');
  assert.strictEqual(SIG.fmt.fmtF(2900), '2,9 kHz');
});

/* ---- Bausteine ---- */
t('vnoise ist rein (gleiche Zeit -> gleicher Wert) und begrenzt', () => {
  const f = SIG.lib.vnoise(7, 0.05, 1e-4);
  for (let i = 0; i < 500; i++) { const tt = i * 3.7e-5; assert.strictEqual(f(tt), f(tt)); assert(Math.abs(f(tt)) <= 0.05 + 1e-12); }
});
t('lagSeries erreicht Sprungziel (Verzögerung 1. Ordnung)', () => {
  const f = SIG.lib.lagSeries([[0, 1], [0.1, 4, 0.02]], 0.5);
  assert(Math.abs(f(0.05) - 1) < 1e-9, 'vor Sprung');
  assert(Math.abs(f(0.12) - (4 - 3 * Math.exp(-1))) < 0.05, 'nach 1 tau ~63 %: ' + f(0.12));
  assert(Math.abs(f(0.45) - 4) < 0.01, 'eingeschwungen');
  assert.strictEqual(f.event, true);
});
t('sqw Tastgrad und Flanken', () => {
  let hi = 0; const N = 10000; for (let i = 0; i < N; i++) if (SIG.lib.sqw(i / N * 0.01, 100, 0.3, 5, 0) > 2.5) hi++;
  assert(Math.abs(hi / N - 0.3) < 0.01, 'duty=' + hi / N);
});

/* ---- W2: lazy, cache, .spec ---- */
SIG.M.__test_sine = function (p) { const f = p.f || 50, a = p.a || 1; return function (tt) { return a * Math.sin(2 * Math.PI * f * tt); }; };
t('W2 ist lazy: .spec sofort, Rendern erst bei join/+ und nur einmal', () => {
  let calls = 0; const orig = SIG.M.__test_sine;
  SIG.M.__test_sine = function (p) { calls++; return orig(p); };
  const w = W2({ badge: 'GUT', title: 'T', caption: 'c', vdiv: 0.5, tdiv: 0.005, ch: [{ m: '__test_sine', p: {} }] });
  assert.strictEqual(calls, 0, 'vor dem Rendern kein Modellaufruf');
  assert.strictEqual(w.spec.vdiv, 0.5);
  const h1 = ['A', w, 'B'].join(''), h2 = '' + w;
  assert(h1.indexOf('<figure class="sig g">') > 0 && h1.endsWith('B'));
  assert.strictEqual(h2, h1.slice(1, -1));
  assert.strictEqual(calls, 1, 'genau ein Rendervorgang (Cache)');
  SIG.M.__test_sine = orig;
});
t('Achsenwerte entsprechen V/div und Offset (Beschriftung = Zeichnung)', () => {
  const h = '' + W2({ title: 'T', vdiv: 2, off: -2, tdiv: 0.01, ch: [{ m: '__test_sine', p: {} }] });
  /* off=-2: Mitte = +4 V; oben (4-(-2))*2 = 12 V, unten (-4+2)*2 = -4 V */
  assert(h.indexOf('>12 V<') > 0, 'oberer Wert 12 V');
  assert(h.indexOf('>-4 V<') > 0, 'unterer Wert -4 V');
  assert(h.indexOf('>100 ms<') > 0, 'Zeitachse endet bei 10 x 10 ms');
});

t('CH2-Skala rechts passt vollständig ins Bild (Einheit nicht abgeschnitten)', () => {
  const h = '' + W2({ title: 'T', vdiv: 2, tdiv: 0.01, ch: [{ m: '__test_sine', p: {} }, { m: '__test_sine', p: {}, vdiv: 0.2, off: 1.5 }] });
  const w = +h.match(/viewBox="0 0 (\d+)/)[1];
  const right = [...h.matchAll(/<text x="([\d.]+)" y="[\d.]+" fill="#4fd2ff"[^>]*>([^<]+)</g)];
  assert.strictEqual(right.length, 9, 'neun CH2-Skalenwerte');
  right.forEach(m => assert(+m[1] + m[2].length * 6.8 <= w, 'abgeschnitten: ' + m[2]));
  assert(right.some(m => m[2] === '-500 mV'), 'Wert mit Einheit vorhanden');
});

/* ---- Pruefung ---- */
t('check: Abschneiden wird als Fehler erkannt', () => {
  const r = SIG.check({ title: 'T', caption: 'c', vdiv: 0.1, tdiv: 0.01, ch: [{ m: '__test_sine', p: { a: 1 } }] }, OL);
  assert(r.err.some(e => /ausserhalb/.test(e)), JSON.stringify(r));
});
t('check: expect misst nach (richtig -> ok, falsch -> Fehler)', () => {
  const base = { title: 'T', caption: 'c', vdiv: 0.5, tdiv: 0.01, ch: [{ m: '__test_sine', p: { f: 200 } }] };
  assert.strictEqual(SIG.check(Object.assign({ expect: [{ what: 'freq', v: 200, tolRel: 0.02 }] }, base), OL).err.length, 0);
  assert(SIG.check(Object.assign({ expect: [{ what: 'freq', v: 300, tolRel: 0.02 }] }, base), OL).err.length === 1);
});
t('check: Fehlerbild ohne Sollbild -> Warnung', () => {
  const r = SIG.check({ badge: 'FEHLER', title: 'T', caption: 'c', vdiv: 0.5, tdiv: 0.01, ch: [{ m: '__test_sine', p: {} }] }, OL);
  assert(r.warn.some(w => /Sollbild/.test(w)));
});
delete SIG.M.__test_sine;

/* ---- ALLE Kartenmodelle: Standardparameter, endliche Werte, rein (deterministisch) ---- */
const names = Object.keys(SIG.M);
t('alle ' + names.length + ' Kartenmodelle: mit Standardparametern endlich und deterministisch', () => {
  names.forEach(nm => {
    const f1 = SIG.model(nm, {}), f2 = SIG.model(nm, {});
    for (let i = 0; i < 400; i++) {
      const tt = i * 0.00517;
      const a = f1(tt), b = f2(tt);
      assert(isFinite(a), nm + ': nicht endlich bei t=' + tt + ' -> ' + a);
      assert(Math.abs(a - b) < 1e-9, nm + ': nicht deterministisch bei t=' + tt);
    }
  });
});

console.log('\nAlle ' + n + ' Engine-Tests bestanden (' + names.length + ' Kartenmodelle geprüft).');
