'use strict';
/* Tests Zyklus-Messung (DeepMeasure). Lauf: node --test cycles.test.js
   Verfahren der Ausreißer-Erkennung: modifizierter Z-Wert nach Iglewicz & Hoaglin (1993),
   "How to Detect and Handle Outliers", ASQC Quality Press: M = 0,6745·(x − Median)/MAD, Grenze 3,5
   (äquivalent |x − Median| / (1,4826·MAD) > 3,5). */
var test = require('node:test');
var assert = require('node:assert');
var fs = require('node:fs');
var H = require('./common.js');
var C = require('./cycles.js');

function measure(s, opt){ return C.measureCycles(s.values, s.dt, opt || {}, H); }
function flagged(r, key){
  var out = [];
  r.cycles.forEach(function(c){ if(c.outliers.indexOf(key) >= 0) out.push(c); });
  return out;
}
function anyFlagged(r){ return r.cycles.filter(function(c){ return c.outliers.length > 0; }); }
function near(a, b, tol, msg){ assert.ok(Math.abs(a - b) <= tol, (msg || '') + ' erwartet ' + b + ' ± ' + tol + ', ist ' + a); }
function hasCheck(r, name, text){
  return r.checks.some(function(c){ return c.name === name && (text ? (c.val + ' ' + c.hint).indexOf(text) >= 0 : true); });
}

/* ---------- Hallgeber 60-2 */
test('hall60-2: Zahnlücke ist der einzige Ausreißer, normale Zähne nicht', function(){
  var s = C.synthCycles({kind:'hall60-2', n:2800});
  var r = measure(s);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(s.truth.odd.length, 1);
  var odd = s.truth.odd[0];
  var p = flagged(r, 'period');
  assert.strictEqual(p.length, 1, 'genau eine Lücken-Periode');
  near(p[0].t0, odd.t0, s.dt, 'Beginn Lücken-Zyklus');
  near(p[0].period, 3 * s.truth.period, 0.02 * s.truth.period, 'Lückenperiode = 3 Zahnperioden');
  assert.strictEqual(anyFlagged(r).length, 1, 'kein normaler Zahn markiert');
  assert.ok(p[0].outliers.indexOf('wNeg') >= 0 && p[0].outliers.indexOf('duty') >= 0);
  assert.strictEqual(flagged(r, 'wPos').length, 0, 'High-Breite der Lücke ist normal');
  near(r.stats.period.median, s.truth.period, 0.01 * s.truth.period);
  assert.ok(hasCheck(r, 'Ausreißer', '1 von'));
});

test('hall60-2: robust über viele Rausch-Seeds (keine falschen Treffer)', function(){
  for(var seed = 1; seed <= 12; seed++){
    var s = C.synthCycles({kind:'hall60-2', n:2800, seed:seed, noise:0.05});
    var r = measure(s);
    assert.strictEqual(anyFlagged(r).length, 1, 'Seed ' + seed);
    near(anyFlagged(r)[0].t0, s.truth.odd[0].t0, s.dt, 'Seed ' + seed);
  }
});

test('hall60-2: Standardaufnahme (5000 Punkte) zeigt beide Lücken', function(){
  var s = C.synthCycles({kind:'hall60-2'});
  var r = measure(s);
  assert.strictEqual(s.truth.odd.length, 2);
  var p = flagged(r, 'period');
  assert.strictEqual(p.length, 2);
  for(var i = 0; i < 2; i++) near(p[i].t0, s.truth.odd[i].t0, s.dt);
  assert.strictEqual(anyFlagged(r).length, 2);
});

test('hall60-2: einzelner schlechter Zahn (kurzer Puls) wird über Breite/Tastgrad gefunden, Periode bleibt unauffällig', function(){
  var s = C.synthCycles({kind:'hall60-2', n:1500, badTooth:20, badScale:0.5});   /* keine Lücke im Ausschnitt */
  var r = measure(s);
  var w = flagged(r, 'wPos');
  assert.strictEqual(w.length, 1);
  near(w[0].t0, s.truth.odd[0].t0, s.dt);
  assert.strictEqual(flagged(r, 'period').length, 0);
  assert.ok(flagged(r, 'duty').length === 1 && flagged(r, 'wNeg').length === 1);
  assert.strictEqual(anyFlagged(r).length, 1);
});

/* ---------- PWM */
test('pwm: ein abweichender Tastgrad wird gefunden, Periode nicht', function(){
  var s = C.synthCycles({kind:'pwm', duty:0.3, oddIndex:7, oddDuty:0.6});
  var r = measure(s);
  assert.strictEqual(r.ok, true);
  var d = flagged(r, 'duty');
  assert.strictEqual(d.length, 1);
  near(d[0].t0, s.truth.odd[0].t0, s.dt);
  near(d[0].duty, 0.6, 0.01);
  assert.strictEqual(flagged(r, 'period').length, 0);
  assert.strictEqual(anyFlagged(r).length, 1);
  near(r.stats.duty.median, 0.3, 0.005);
  near(r.stats.freq.median, 1000, 5);
});

test('pwm ohne Rauschen (MAD = 0): Ersatzregel findet den Ausreißer, Abweichung unter ± dt nicht', function(){
  var s = C.synthCycles({kind:'pwm', duty:0.3, oddIndex:5, oddDuty:0.6, noise:0});
  var r = measure(s);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(flagged(r, 'duty').length, 1);
  assert.strictEqual(anyFlagged(r).length, 1);
  /* Pulsbreite nur 0,3 Abtastintervalle abweichend: unterhalb der Messunsicherheit, kein Ausreißer */
  var dt = 0.001 / 250;
  var s2 = C.synthCycles({kind:'pwm', duty:0.3, oddIndex:5, oddDuty:0.3 + 0.3 * dt / 0.001, noise:0});
  var r2 = measure(s2);
  assert.strictEqual(anyFlagged(r2).length, 0);
});

test('square: gleichmäßiges Signal hat keine Ausreißer; Periode/Frequenz/Tastgrad stimmen', function(){
  var s = C.synthCycles({kind:'square', freq:2000, duty:0.25});
  var r = measure(s);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(anyFlagged(r).length, 0);
  near(r.stats.period.mean, 0.0005, 2e-6);
  near(r.stats.freq.mean, 2000, 10);
  near(r.stats.duty.mean, 0.25, 0.005);
  assert.ok(hasCheck(r, 'Ausreißer', 'keine'));
  r.cycles.forEach(function(c){
    assert.ok(Math.abs(c.wPos + c.wNeg - c.period) < 1e-12);
    assert.ok(c.vmax > 4.9 && c.vmin < 0.1);
  });
});

/* ---------- induktiver Geber */
test('inductive: Sinus mit wachsender Amplitude – alle Zyklen, keine Zeit-Ausreißer, Rise/Fall null statt 0', function(){
  var s = C.synthCycles({kind:'inductive'});
  var r = measure(s);
  assert.strictEqual(r.ok, true);
  var expected = Math.floor((s.values.length - 1) * s.dt * s.truth.freq) - 1;
  assert.ok(r.cycles.length >= expected - 2 && r.cycles.length <= expected + 2, 'Zyklen ' + r.cycles.length + ' ≈ ' + expected);
  ['period', 'freq', 'wPos', 'wNeg', 'duty', 'vmax', 'vmin'].forEach(function(k){
    assert.strictEqual(flagged(r, k).length, 0, k);
  });
  var first = r.cycles[0], last = r.cycles[r.cycles.length - 1];
  assert.ok(last.vmax > 3 * first.vmax, 'Amplitude wächst');
  assert.ok(last.vmin < 3 * first.vmin);
  var nulls = 0;
  r.cycles.forEach(function(c){
    assert.ok(c.rise === null || c.rise > 0);
    assert.ok(c.fall === null || c.fall > 0);
    if(c.rise === null) nulls++;
  });
  assert.ok(nulls > 0, 'kleine Anfangszyklen erreichen die Bezugspegel nicht → null');
  near(r.stats.period.median, s.truth.period, 0.01 * s.truth.period);
});

/* ---------- Rauschen / Hysterese */
test('Hysterese verhindert Doppelzählung bei Rauschen auf langsamer Flanke', function(){
  var base = C.synthCycles({kind:'square', noise:0, rise:40 * 0.001 / 250, fall:40 * 0.001 / 250});
  var noisy = C.synthCycles({kind:'square', noise:0.15, seed:3, rise:40 * 0.001 / 250, fall:40 * 0.001 / 250});
  var rb = measure(base), rn = measure(noisy);
  assert.strictEqual(rb.ok, true);
  assert.strictEqual(rn.cycles.length, rb.cycles.length, 'Standard-Hysterese: gleiche Zyklenzahl wie ohne Rauschen');
  var rz = measure(noisy, {hyst:0});
  assert.ok(rz.cycles.length > rb.cycles.length + 3, 'ohne Hysterese viele Mehrfachflanken: ' + rz.cycles.length);
  assert.ok(hasCheck(rz, 'Kurze Phasen'), 'Hinweis auf Mehrfachflanken/kurze Phasen');
  assert.strictEqual(measure(noisy, {hyst:1.5}).cycles.length, rb.cycles.length);
});

test('eigene Hysterese (V) wird in info übernommen; Hysterese ≥ Hub gibt klare Meldung', function(){
  var s = C.synthCycles({kind:'square'});
  var r = measure(s, {hyst:0.8});
  assert.strictEqual(r.ok, true);
  near(r.info.hyst, 0.8, 1e-9);
  near(r.info.threshold, 2.5, 0.05);
  assert.strictEqual(r.cycles.length, measure(s).cycles.length);
  var bad = measure(s, {hyst:9});
  assert.strictEqual(bad.ok, false);
  assert.ok(/Hysterese/.test(bad.error));
});

test('feste Schwelle: gleiche Zyklen; Schwelle außerhalb des Signals → statisch', function(){
  var s = C.synthCycles({kind:'square'});
  var r = measure(s, {threshold:2.5});
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.cycles.length, measure(s).cycles.length);
  near(r.info.threshold, 2.5, 1e-12);
  var out = measure(s, {threshold:20});
  assert.strictEqual(out.ok, false);
  assert.ok(/statisch/i.test(out.error));
});

/* ---------- Flankenzeiten */
function rampWave(periods){
  var arr = [];
  for(var i = 0; i < 60 * periods; i++){
    var p = i % 60, v;
    if(p < 20) v = 0;
    else if(p < 30) v = 5 * (p - 20) / 10;
    else if(p < 50) v = 5;
    else v = 5 * (60 - p) / 10;
    arr.push(v);
  }
  return arr;
}
test('10/90 vs 20/80 an bekannter linearer Flanke: exakt 0,8 bzw. 0,6 der Rampenzeit', function(){
  var dt = 1e-6, v = rampWave(5);
  var r1 = C.measureCycles(v, dt, {ref:'10/90'}, H);
  var r2 = C.measureCycles(v, dt, {ref:'20/80'}, H);
  assert.strictEqual(r1.ok, true);
  assert.strictEqual(r1.info.ref, '10/90');
  assert.strictEqual(r2.info.ref, '20/80');
  assert.ok(r1.cycles.length >= 3);
  r1.cycles.forEach(function(c){
    near(c.rise, 8 * dt, 1e-12, 'rise 10/90'); near(c.fall, 8 * dt, 1e-12, 'fall 10/90');
    near(c.period, 60 * dt, 1e-12); near(c.wPos, 30 * dt, 1e-12);
    near(c.duty, 0.5, 1e-9);
  });
  r2.cycles.forEach(function(c){ near(c.rise, 6 * dt, 1e-12, 'rise 20/80'); near(c.fall, 6 * dt, 1e-12, 'fall 20/80'); });
  assert.strictEqual(anyFlagged(r1).length, 0);
  assert.ok(hasCheck(r1, 'Anstiegszeit', 'allen'));
});

test('Flanke mit < 3 Samples zwischen den Bezugspegeln → null und Hinweis „nicht aussagekräftig“', function(){
  var dt = 0.001 / 250;
  var s = C.synthCycles({kind:'square', noise:0, rise:1.5 * dt, fall:1.5 * dt});
  var r = measure(s);
  assert.strictEqual(r.ok, true);
  r.cycles.forEach(function(c){ assert.strictEqual(c.rise, null); assert.strictEqual(c.fall, null); });
  assert.strictEqual(r.stats.rise.n, 0);
  assert.strictEqual(r.stats.rise.mean, null);
  assert.strictEqual(r.stats.rise.median, null);
  assert.ok(r.cycles.length > 5 && anyFlagged(r).length === 0);
  assert.ok(hasCheck(r, 'Anstiegszeit', 'nicht aussagekräftig'));
  assert.ok(hasCheck(r, 'Anstiegszeit', 'Zeitbasis kleiner'));
  assert.ok(r.checks.some(function(c){ return c.name === 'Anstiegszeit' && c.st === 'warn'; }));
});

test('Flanke erreicht Bezugspegel nicht (Puls nur 3,2 V hoch) → null, die anderen Zyklen messen', function(){
  var s = C.synthCycles({kind:'square', noise:0});
  var T = 0.001, dt = s.dt, tS = 0.37 * T;
  /* Puls Nr. 4 (Mitte steigende Flanke tS+4T bis tS+4,5T) auf 3,2 V kappen */
  var i0 = Math.round((tS + 4 * T - 3 * dt) / dt), i1 = Math.round((tS + 4.5 * T + 3 * dt) / dt);
  for(var i = i0; i <= i1; i++) if(s.values[i] > 3.2) s.values[i] = 3.2;
  var r = measure(s);
  assert.strictEqual(r.ok, true);
  var c4 = r.cycles.filter(function(c){ return Math.abs(c.t0 - (tS + 4 * T)) < 2 * dt; })[0];
  assert.ok(c4, 'Zyklus gefunden');
  assert.strictEqual(c4.rise, null);
  assert.strictEqual(c4.fall, null);
  near(c4.vmax, 3.2, 0.2);
  var good = r.cycles.filter(function(c){ return c !== c4; });
  good.forEach(function(c){ assert.ok(c.rise > 0 && c.fall > 0); });
  assert.strictEqual(r.stats.rise.n, r.cycles.length - 1);
  assert.ok(hasCheck(r, 'Anstiegszeit', 'kein Wert'));
  assert.ok(flagged(r, 'vmax').length === 1, 'der gekappte Puls fällt über vmax auf');
});

/* ---------- Flankenrichtung, Limits */
test('edge "fall": Zyklus beginnt mit fallender Flanke, Breiten bleiben High/Low', function(){
  var s = C.synthCycles({kind:'pwm', duty:0.3, noise:0});
  var rr = measure(s, {edge:'rise'}), rf = measure(s, {edge:'fall'});
  assert.strictEqual(rf.ok, true);
  assert.strictEqual(rf.info.edge, 'fall');
  near(rf.stats.duty.mean, 0.3, 0.002); near(rf.stats.wPos.mean, 0.0003, 1e-6); near(rf.stats.period.mean, rr.stats.period.mean, 1e-7);
  /* fallende Flanke von High-Puls (0,3 T nach steigender) liegt vor der nächsten steigenden */
  assert.ok(Math.abs(rf.cycles[0].t0 - (rr.cycles[0].t0 + 0.0003)) < 2 * s.dt);
});

test('maxCycles begrenzt die Zahl der Zyklen und warnt', function(){
  var s = C.synthCycles({kind:'square'});
  var r = measure(s, {maxCycles:5});
  assert.strictEqual(r.cycles.length, 5);
  assert.ok(hasCheck(r, 'Zyklenlimit'));
  assert.ok(!hasCheck(measure(s), 'Zyklenlimit'));
});

/* ---------- Zyklenzahl */
test('weniger als 3 Zyklen → Warnung „Zeitbasis größer stellen“, aber ok', function(){
  var s = C.synthCycles({kind:'square', n:700});
  var r = measure(s);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.cycles.length, 2);
  assert.ok(r.checks.some(function(c){ return c.name === 'Zyklen' && c.st === 'warn' && c.hint.indexOf('Zeitbasis größer') >= 0; }));
  assert.strictEqual(anyFlagged(r).length, 0, 'unter 5 Zyklen keine Ausreißer-Suche');
  assert.ok(r.stats.period.sd !== undefined);
});

test('kein vollständiger Zyklus (nur eine Flanke) → ok:false mit Hinweis', function(){
  var v = [];
  for(var i = 0; i < 400; i++) v.push(i < 200 ? 0 : 5);
  var r = C.measureCycles(v, 1e-5, {}, H);
  assert.strictEqual(r.ok, false);
  assert.ok(/Zyklus/.test(r.error));
  assert.deepStrictEqual(r.cycles, []);
  assert.ok(r.checks.some(function(c){ return c.st === 'bad' && c.hint.indexOf('Zeitbasis größer') >= 0; }));
});

/* ---------- Grenzfälle */
test('statisches Signal → ok:false mit klarer Meldung', function(){
  var v = new Float32Array(5000);
  for(var i = 0; i < v.length; i++) v[i] = 12.6 + 0.01 * Math.sin(i);
  var r = C.measureCycles(v, 1e-5, {}, H);
  assert.strictEqual(r.ok, false);
  assert.ok(/Statisches Signal/.test(r.error));
  assert.deepStrictEqual(r.cycles, []);
  assert.ok(r.checks.some(function(c){ return c.st === 'bad'; }));
  assert.ok(r.columns.length === 9, 'Spalten bleiben für die Oberfläche erhalten');
});

test('Grenzfälle: 2 Samples, leer, NaN/Infinity, ungültiges dt', function(){
  var r2 = C.measureCycles([0, 5], 1e-5, {}, H);
  assert.strictEqual(r2.ok, false);
  assert.deepStrictEqual(r2.cycles, []);
  assert.strictEqual(C.measureCycles([1, 1], 1e-5, {}, H).ok, false);
  assert.strictEqual(C.measureCycles([], 1e-5, {}, H).ok, false);
  var v = rampWave(5); v[100] = NaN;
  var rn = C.measureCycles(v, 1e-6, {}, H);
  assert.strictEqual(rn.ok, false);
  assert.ok(/gültig|fehlend/i.test(rn.error));
  v[100] = Infinity;
  assert.strictEqual(C.measureCycles(v, 1e-6, {}, H).ok, false);
  assert.strictEqual(C.measureCycles(rampWave(5), 0, {}, H).ok, false);
  assert.strictEqual(C.measureCycles(rampWave(5), NaN, {}, H).ok, false);
  assert.strictEqual(C.measureCycles(null, 1e-6, {}, H).ok, false);
  assert.strictEqual(C.measureCycles(rampWave(5), 1e-6, undefined, H).ok, true, 'opt darf fehlen');
});

/* ---------- Ergebnisformat */
test('Ergebnisformat: Spalten deutsch mit Einheit, Statistik je Spalte, Messunsicherheit in info', function(){
  var s = C.synthCycles({kind:'pwm', duty:0.3});
  var r = measure(s);
  var keys = r.columns.map(function(c){ return c.key; });
  assert.deepStrictEqual(keys, ['period', 'freq', 'wPos', 'wNeg', 'duty', 'rise', 'fall', 'vmax', 'vmin']);
  r.columns.forEach(function(c){ assert.ok(c.label && typeof c.unit === 'string' && c.factor > 0); });
  assert.strictEqual(r.columns[0].label, 'Periode');
  assert.strictEqual(r.columns[4].unit, '%');
  keys.forEach(function(k){
    var st = r.stats[k];
    assert.deepStrictEqual(Object.keys(st).sort(), ['max', 'mean', 'median', 'min', 'n', 'sd']);
    assert.strictEqual(st.n, r.cycles.length);
    assert.ok(st.min <= st.median && st.median <= st.max && st.min <= st.mean && st.mean <= st.max);
    assert.ok(st.sd >= 0);
  });
  assert.strictEqual(r.info.timeUncertainty, s.dt);
  assert.ok(/±/.test(r.info.uncertaintyText));
  assert.ok(hasCheck(r, 'Messunsicherheit', '±'));
  ['threshold', 'hyst', 'lo', 'hi', 'ref'].forEach(function(k){ assert.ok(k in r.info); });
  r.cycles.forEach(function(c, i){
    assert.strictEqual(c.n, i + 1);
    assert.ok(c.t1 > c.t0 && c.period > 0 && c.freq > 0 && c.duty > 0 && c.duty < 1);
    if(i) assert.ok(Math.abs(c.t0 - r.cycles[i - 1].t1) < 1e-15, 'Zyklen schließen lückenlos aneinander');
  });
  r.checks.forEach(function(c){ assert.ok(['ok', 'warn', 'bad', 'info'].indexOf(c.st) >= 0 && c.name && typeof c.val === 'string'); });
});

test('Eingabe (Float32Array oder Array) wird nicht verändert', function(){
  var s = C.synthCycles({kind:'pwm'});
  var copy = new Float32Array(s.values);
  measure(s);
  assert.deepStrictEqual(s.values, copy);
});

/* ---------- synthCycles */
test('synthCycles ist deterministisch (Seed), Rauschen und Länge stimmen', function(){
  ['square', 'pwm', 'hall60-2', 'inductive'].forEach(function(k){
    var a = C.synthCycles({kind:k, seed:7}), b = C.synthCycles({kind:k, seed:7}), c = C.synthCycles({kind:k, seed:8});
    assert.ok(a.values instanceof Float32Array);
    assert.strictEqual(a.values.length, 5000);
    assert.ok(a.dt > 0);
    assert.deepStrictEqual(a.values, b.values);
    assert.notDeepStrictEqual(a.values, c.values);
    for(var i = 0; i < a.values.length; i++) assert.ok(Number.isFinite(a.values[i]));
  });
  assert.throws(function(){ C.synthCycles({kind:'unbekannt'}); });
  assert.strictEqual(C.synthCycles({kind:'square', n:300}).values.length, 300);
});

/* ---------- Performance */
test('Performance: 5000 Samples < 20 ms, 262144 Samples < 500 ms', function(){
  var s = C.synthCycles({kind:'hall60-2'});
  measure(s);                                    /* Aufwärmen */
  var best = Infinity;
  for(var k = 0; k < 5; k++){ var t = process.hrtime.bigint(); measure(s); best = Math.min(best, Number(process.hrtime.bigint() - t) / 1e6); }
  assert.ok(best < 20, '5000 Samples: ' + best.toFixed(1) + ' ms');
  var big = C.synthCycles({kind:'square', n:262144, dt:1e-6, freq:5000});
  var t0 = process.hrtime.bigint();
  var r = measure(big);
  var ms = Number(process.hrtime.bigint() - t0) / 1e6;
  assert.strictEqual(r.ok, true);
  assert.ok(r.cycles.length > 1000);
  assert.ok(ms < 500, '262144 Samples: ' + ms.toFixed(0) + ' ms');
  t0 = process.hrtime.bigint();
  measure(big, {hyst:1, ref:'20/80'});
  ms = Number(process.hrtime.bigint() - t0) / 1e6;
  assert.ok(ms < 500, '262144 Samples mit eigener Hysterese: ' + ms.toFixed(0) + ' ms');
});

/* ---------- Stil */
test('ES5-Stil: keine Pfeilfunktionen, let/const/class, Template-Strings, require', function(){
  var src = require('./source.js').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/=>/.test(src), 'Pfeilfunktion');
  assert.ok(!/\b(let|const|class)\s+[A-Za-z_$]/.test(src), 'let/const/class');
  assert.ok(!/`/.test(src), 'Template-String');
  assert.ok(!/\brequire\s*\(/.test(src), 'require');
  assert.ok(!/\bdocument\b|\bwindow\b/.test(src), 'DOM');
  assert.ok(/return \{measureCycles:measureCycles, synthCycles:synthCycles\}/.test(src));
});
