/* Tests K-Leitungs-Decoder: node --test kline.test.js
   Bekannt-Vektoren (Prüfsumme = Summe aller Bytes mod 256, ISO 9141-2 Abschn. 11.2 / ISO 14230-2) – die Prüfsummen unten sind
   als feste Zahlen eingetragen und NICHT vom Synthesizer berechnet:
   - 68 6A F1 01 00 C4        OBD-II-Anfrage Modus 01 PID 00 (ISO 9141-2 Tab. 1: Kopf 68 6A F1; SAE J1979)
   - 81 10 F1 81 03           StartCommunication-Anfrage (physisch, ISO 14230-2; Beispiel aus der J2534-Dokumentation)
   - C1 33 F1 81 66           StartCommunication-Anfrage funktional (ISO 14230-4)
   - 83 F1 11 C1 EF 8F C4     positive Antwort mit Schlüsselbytes EF 8F (ISO 14230-2) */
'use strict';
var test = require('node:test');
var assert = require('node:assert');
var H = require('./common.js');
var K = require('./kline.js');

function run(o, opt){
  var s = K.synthKLine(o);
  return {s:s, r:K.decodeKLine(s.values, s.dt, opt || {}, H)};
}
function chk(list, name){
  for(var i = 0; i < list.length; i++) if(list[i].name === name) return list[i];
  return null;
}
function labels(f){ return f.fields.map(function(x){ return x.label; }); }
function raw(bytes, extra){
  var m = {bytes:bytes};
  if(extra) for(var k in extra) if(Object.prototype.hasOwnProperty.call(extra, k)) m[k] = extra[k];
  return m;
}
function sum(b){ var s = 0; for(var i = 0; i < b.length - 1; i++) s = (s + b[i]) & 255; return s; }

test('Bekannt-Vektoren: Prüfsumme stimmt mit Summe-mod-256 überein (Gegenprobe im Test)', function(){
  [[0x68,0x6A,0xF1,0x01,0x00,0xC4], [0x81,0x10,0xF1,0x81,0x03], [0xC1,0x33,0xF1,0x81,0x66], [0x83,0xF1,0x11,0xC1,0xEF,0x8F,0xC4]].forEach(function(v){
    assert.strictEqual(sum(v), v[v.length - 1]);
  });
});

test('Gutfall: Vektor als Rohbytes wird mit Kopf, Daten und Prüfsumme erkannt; Prüfsumme der zweiten bewusst falsch', function(){
  var x = run({n:16000, messages:[
    raw([0x81,0x10,0xF1,0x81,0x03], {ibGap:5.5e-3}),
    raw([0x83,0xF1,0x10,0xC1,0xEF,0x8F,0xC4], {gap:30e-3})
  ]});
  /* zweite Botschaft hier mit Quelle 0x10 statt 0x11: Summe 0x83+F1+10+C1+EF+8F = 0x3C3 -> C3, gesendet ist C4 -> bad */
  assert.strictEqual(x.r.frames.length, 2);
  assert.strictEqual(x.r.frames[0].status, 'ok');
  assert.deepStrictEqual(x.r.frames[0].data, [0x81]);
  assert.deepStrictEqual(labels(x.r.frames[0]), ['Fmt 0x81', 'Ziel 0x10', 'Quelle 0xF1', 'D0 0x81', 'CS 0x03']);
  assert.strictEqual(x.r.frames[1].status, 'bad');
  var c = chk(x.r.frames[1].checks, 'Prüfsumme');
  assert.strictEqual(c.st, 'bad');
  assert.ok(/0xC4 gelesen, 0xC3 berechnet/.test(c.val), c.val);
});

test('Gutfall KWP: Fast-Init + StartCommunication-Anfrage und -Antwort, Felder und Titel', function(){
  var x = run({n:16000, fastInit:true, messages:[
    raw([0xC1,0x33,0xF1,0x81,0x66], {ibGap:5.5e-3}),
    raw([0x83,0xF1,0x11,0xC1,0xEF,0x8F,0xC4], {gap:30e-3})
  ]});
  var r = x.r;
  assert.strictEqual(r.bus, 'kline');
  assert.strictEqual(r.ok, true, r.error);
  assert.strictEqual(r.error, null);
  assert.strictEqual(r.info.bitrate, 10400);
  assert.ok(Math.abs(r.info.samplesPerBit - 8) < 0.1);
  assert.strictEqual(r.frames.length, 2);
  var a = r.frames[0], b = r.frames[1];
  assert.deepStrictEqual(labels(a), ['Init', 'Fmt 0xC1', 'Ziel 0x33', 'Quelle 0xF1', 'D0 0x81', 'CS 0x66']);
  assert.strictEqual(a.fields[0].kind, 'start');
  assert.strictEqual(a.fields[1].kind, 'ctrl');
  assert.strictEqual(a.fields[2].kind, 'id');
  assert.strictEqual(a.fields[4].kind, 'data');
  assert.strictEqual(a.fields[5].kind, 'crc');
  assert.strictEqual(a.status, 'ok', JSON.stringify(a.checks));
  assert.deepStrictEqual(a.data, [0x81]);
  assert.ok(/StartCommunication/.test(a.title));
  assert.deepStrictEqual(labels(b), ['Fmt 0x83', 'Ziel 0xF1', 'Quelle 0x11', 'D0 0xC1', 'D1 0xEF', 'D2 0x8F', 'CS 0xC4']);
  assert.deepStrictEqual(b.data, [0xC1, 0xEF, 0x8F]);
  assert.strictEqual(b.status, 'ok');
  assert.strictEqual(chk(b.checks, 'Antwortzeit (P2)').st, 'ok');
  assert.ok(a.t0 < a.fields[1].t0 && a.fields[0].t1 <= a.fields[1].t0 + 1e-9);
  assert.ok(Math.abs(a.fields[0].t0 - x.s.truth.initT0) < 1e-4);
  [a, b].forEach(function(f){
    f.fields.forEach(function(fd){ assert.ok(fd.t1 > fd.t0); assert.ok(fd.label.length <= 12); assert.strictEqual(fd.bad, false); });
  });
  assert.strictEqual(chk(a.checks, 'Fast-Init Low (TiniL)').st, 'ok');
  assert.strictEqual(chk(a.checks, 'Fast-Init gesamt (Twup)').st, 'ok');
  assert.strictEqual(chk(r.checks, 'Low-Pegel').st, 'ok');
  assert.strictEqual(chk(r.checks, 'High-Pegel').st, 'ok');
});

test('KWP-Kopfvarianten: Längenbyte (Fmt 0x80), ohne Adressen (Fmt 0x02), lange Daten > 63 Byte', function(){
  var long = []; for(var i = 0; i < 70; i++) long.push(i);
  var x = run({n:60000, messages:[
    {kwp:{mode:2, tgt:0x11, src:0xF1, data:[0x21, 0x01], lenByte:true}, ibGap:2e-3},
    {kwp:{mode:0, data:[0x3E, 0x01]}, gap:60e-3, ibGap:1e-3},
    {kwp:{mode:3, tgt:0x10, src:0xF1, data:long}, gap:60e-3, ibGap:0.3e-3}
  ]});
  assert.strictEqual(x.r.frames.length, 3);
  assert.deepStrictEqual(labels(x.r.frames[0]), ['Fmt 0x80', 'Ziel 0x11', 'Quelle 0xF1', 'Len 2', 'D0 0x21', 'D1 0x01', 'CS 0x' + ('0' + ((0x80+0x11+0xF1+2+0x21+1)&255).toString(16).toUpperCase()).slice(-2)]);
  assert.strictEqual(x.r.frames[0].status, 'ok');
  assert.deepStrictEqual(labels(x.r.frames[1]).slice(0, 2), ['Fmt 0x02', 'D0 0x3E']);
  assert.strictEqual(x.r.frames[1].status, 'ok');
  assert.ok(/ohne Adressen/.test(chk(x.r.frames[1].checks, 'Format').val));
  assert.strictEqual(x.r.frames[2].data.length, 70);
  assert.strictEqual(x.r.frames[2].status, 'ok');
  assert.strictEqual(x.r.frames[2].fields[3].label, 'Len 70');
  assert.ok(/funktional/.test(chk(x.r.frames[2].checks, 'Format').val));
});

test('ISO-9141-2 / OBD-II: Anfrage 68 6A F1 01 00 C4 und Antwort 48 6B 11 41 00 ..., Länge aus Pause', function(){
  var resp = [0x48, 0x6B, 0x11, 0x41, 0x00, 0xBE, 0x3F, 0xA8, 0x13];
  var cs = 0; resp.forEach(function(b){ cs = (cs + b) & 255; });
  resp.push(cs);
  var x = run({n:12000, messages:[raw([0x68,0x6A,0xF1,0x01,0x00,0xC4], {ibGap:5.5e-3}), raw(resp, {gap:30e-3, ibGap:1e-3})]});
  assert.strictEqual(x.r.frames.length, 2);
  var q = x.r.frames[0], a = x.r.frames[1];
  assert.deepStrictEqual(labels(q), ['Kopf 0x68', 'Kopf 0x6A', 'Quelle 0xF1', 'D0 0x01', 'D1 0x00', 'CS 0xC4']);
  assert.strictEqual(q.status, 'ok');
  assert.ok(/ISO 9141-2/.test(chk(q.checks, 'Format').val) && /Anfrage/.test(chk(q.checks, 'Format').val));
  assert.ok(/Modus 0x01/.test(q.title));
  assert.strictEqual(a.status, 'ok');
  assert.ok(/Antwort/.test(chk(a.checks, 'Format').val));
  assert.deepStrictEqual(a.data, [0x41, 0x00, 0xBE, 0x3F, 0xA8, 0x13]);
  assert.strictEqual(chk(a.checks, 'Länge').st, 'ok');
  assert.strictEqual(chk(a.checks, 'Antwortzeit (P2)').st, 'ok');
  /* zu lange OBD-Botschaft: > 11 Byte */
  var longm = [0x48, 0x6B, 0x11]; for(var i = 0; i < 10; i++) longm.push(i);
  longm.push(0);
  var cs2 = 0; longm.slice(0, -1).forEach(function(b){ cs2 = (cs2 + b) & 255; }); longm[longm.length - 1] = cs2;
  var y = run({n:12000, messages:[raw(longm, {ibGap:1e-3})]});
  assert.strictEqual(chk(y.r.frames[0].checks, 'Länge').st, 'warn');
});

test('Fehler: falsche Prüfsumme (KWP und OBD) -> bad mit gelesen/berechnet', function(){
  var x = run({n:14000, messages:[
    {kwp:{tgt:0x33, src:0xF1, data:[0x81]}, badCs:true},
    {j1979:{req:true, data:[0x01, 0x0C]}, badCs:0x10, gap:70e-3}
  ]});
  assert.strictEqual(x.r.frames.length, 2);
  x.r.frames.forEach(function(f){
    assert.strictEqual(f.status, 'bad');
    var c = chk(f.checks, 'Prüfsumme');
    assert.strictEqual(c.st, 'bad');
    assert.ok(/gelesen/.test(c.val) && /berechnet/.test(c.val));
    assert.strictEqual(f.fields[f.fields.length - 1].bad, true);
    assert.strictEqual(f.fields[f.fields.length - 1].kind, 'crc');
  });
});

test('Fehler: fehlendes Byte (Länge laut Kopf größer als empfangen)', function(){
  var x = run({n:16000, messages:[
    {kwp:{tgt:0x11, src:0xF1, data:[0x21, 0x01, 0x02, 0x03]}, dropIndex:5}
  ]});
  var f = x.r.frames[0];
  assert.strictEqual(f.status, 'bad');
  var c = chk(f.checks, 'Länge');
  assert.strictEqual(c.st, 'bad');
  assert.ok(/nennt 8 Byte, empfangen 7/.test(c.val), c.val);
  assert.ok(/fehlen 1 Byte/.test(c.hint));
});

test('Fehler: Längenangabe im Kopf falsch (Prüfsumme der Gesamtbotschaft stimmt)', function(){
  var x = run({n:16000, messages:[{kwp:{tgt:0x11, src:0xF1, data:[0x21, 0x01, 0x02]}, lenDelta:-1}]});
  var f = x.r.frames[0];
  var c = chk(f.checks, 'Länge');
  assert.strictEqual(c.st, 'bad');
  assert.ok(/Längenangabe im Kopf ist vermutlich falsch/.test(c.hint), c.hint);
  assert.strictEqual(f.status, 'bad');
  var y = run({n:16000, messages:[{kwp:{tgt:0x11, src:0xF1, data:[0x21, 0x01, 0x02]}, lenDelta:+2}]});
  assert.strictEqual(chk(y.r.frames[0].checks, 'Länge').st, 'bad');
});

test('Fehler: Stoppbit fehlt (Zeichenrahmen)', function(){
  var x = run({n:14000, messages:[{kwp:{tgt:0x11, src:0xF1, data:[0x21, 0x01]}, badStop:4}]});
  var f = x.r.frames[0];
  var c = chk(f.checks, 'Zeichenrahmen');
  assert.strictEqual(c.st, 'bad');
  assert.ok(/1 von 6/.test(c.val), c.val);
  assert.strictEqual(f.status, 'bad');
  assert.strictEqual(f.fields[4].kind, 'err');
  assert.strictEqual(f.fields[4].bad, true);
});

test('Zwei Botschaften getrennt durch Pause; kurze Abstände werden über Länge+Prüfsumme getrennt', function(){
  var x = run({n:20000, messages:[
    {kwp:{tgt:0x11, src:0xF1, data:[0x3E, 0x01]}},
    {kwp:{tgt:0xF1, src:0x11, data:[0x7E, 0x01]}, gap:30e-3}
  ]});
  assert.strictEqual(x.r.frames.length, 2);
  /* P2 = 0 (z. B. Schlüsselwort 94H): Antwort folgt nach nur 3 ms, keine msgGap-Pause */
  var y = run({n:20000, messages:[
    {kwp:{tgt:0x11, src:0xF1, data:[0x3E, 0x01]}, ibGap:1e-3},
    {kwp:{tgt:0xF1, src:0x11, data:[0x7E, 0x01]}, gap:3e-3, ibGap:1e-3}
  ]});
  assert.strictEqual(y.r.frames.length, 2, 'über Kopf-Länge getrennt');
  y.r.frames.forEach(function(f){ assert.strictEqual(f.status, 'ok'); });
  assert.deepStrictEqual(y.r.frames[1].data, [0x7E, 0x01]);
  /* msgGap als Option: 60 ms Pause bei msgGap 100 ms ergibt eine Gruppe, die per Länge geteilt wird; Bytes bleiben richtig */
  var z = run({n:25000, messages:[
    {kwp:{tgt:0x11, src:0xF1, data:[0x3E, 0x01]}},
    {kwp:{tgt:0xF1, src:0x11, data:[0x7E, 0x01]}, gap:60e-3}
  ]}, {msgGap:0.1});
  assert.strictEqual(z.r.frames.length, 2);
});

test('Antwort- und Wartezeit: P2 25–50 ms ok, sonst info; P3 ab 55 ms ok', function(){
  var x = run({n:30000, messages:[
    {kwp:{tgt:0x11, src:0xF1, data:[0x3E, 0x01]}},
    {kwp:{tgt:0xF1, src:0x11, data:[0x7E, 0x01]}, gap:10e-3},
    {kwp:{tgt:0x11, src:0xF1, data:[0x3E, 0x01]}, gap:40e-3},
    {kwp:{tgt:0xF1, src:0x11, data:[0x7E, 0x01]}, gap:30e-3}
  ]});
  assert.strictEqual(x.r.frames.length, 4);
  assert.strictEqual(chk(x.r.frames[1].checks, 'Antwortzeit (P2)').st, 'info');
  assert.ok(/ms/.test(chk(x.r.frames[1].checks, 'Antwortzeit (P2)').val));
  assert.strictEqual(chk(x.r.frames[2].checks, 'Wartezeit (P3)').st, 'info');
  assert.strictEqual(chk(x.r.frames[3].checks, 'Antwortzeit (P2)').st, 'ok');
  x.r.frames.forEach(function(f){ assert.strictEqual(f.status, 'ok'); });
});

test('Byte-Abstand über 20 ms (P1/P4) wird gewarnt, wenn msgGap größer eingestellt ist', function(){
  var x = run({n:30000, messages:[{kwp:{tgt:0x11, src:0xF1, data:[0x3E, 0x01]}, ibGap:21e-3}]}, {msgGap:0.04});
  assert.strictEqual(x.r.frames.length, 1);
  assert.strictEqual(chk(x.r.frames[0].checks, 'Byte-Abstand').st, 'warn');
  assert.strictEqual(x.r.frames[0].status, 'warn');
});

test('Fast-Init: Zeiten außerhalb 25 ±1 / 50 ±1 ms -> warn; nur Wake-up ohne Botschaft; Start vor der Aufnahme', function(){
  var x = run({n:16000, fastInit:{low:0.020, high:0.030}, messages:[{kwp:{tgt:0x33, src:0xF1, data:[0x81]}}]});
  var f = x.r.frames[0];
  assert.strictEqual(chk(f.checks, 'Fast-Init Low (TiniL)').st, 'warn');
  assert.strictEqual(chk(f.checks, 'Fast-Init gesamt (Twup)').st, 'ok');
  assert.strictEqual(f.fields[0].bad, true);
  var y = run({n:9000, fastInit:true, t0:5e-3});
  assert.strictEqual(y.r.ok, true, y.r.error);
  assert.strictEqual(y.r.frames.length, 1);
  assert.strictEqual(y.r.frames[0].fields.length, 1);
  assert.strictEqual(y.r.frames[0].fields[0].label, 'Init');
  assert.ok(/Fast-Init/.test(y.r.frames[0].title));
  var z = run({n:9000, fastInit:true, t0:-10e-3});       /* Aufnahme beginnt nach dem Flankenanfang */
  assert.strictEqual(z.r.frames.length, 1);
  assert.ok(chk(z.r.frames[0].checks, 'Fast-Init'));
  assert.strictEqual(chk(z.r.frames[0].checks, 'Fast-Init').st, 'info');
});

test('5-Baud-Init: nur Hinweis mit Empfehlung für die Daten-Aufnahme', function(){
  var x = run({dt:500e-6, n:5000, fiveBaud:{addr:0x33}, t0:0.05});
  assert.strictEqual(x.r.ok, false);
  assert.ok(/5-Baud/.test(x.r.error), x.r.error);
  assert.ok(/Zeitbasis höchstens 6,0 ms\/div/.test(x.r.error), x.r.error);
  assert.ok(chk(x.r.checks, '5-Baud-Init'));
  assert.deepStrictEqual(x.r.frames, []);
});

test('Auto-Baud: 10400, 9600 und 4800 werden eingerastet, Bytes stimmen', function(){
  [[10400, 12e-6], [9600, 12e-6], [4800, 12e-6]].forEach(function(p){
    var x = run({baud:p[0], dt:p[1], n:p[0] === 4800 ? 12000 : 8000, messages:[{kwp:{tgt:0x11, src:0xF1, data:[0x21, 0x01, 0xFF, 0x00]}, ibGap:1e-3}]});
    assert.strictEqual(x.r.ok, true, 'baud ' + p[0] + ': ' + x.r.error);
    assert.strictEqual(x.r.info.bitrate, p[0], 'baud ' + p[0]);
    assert.strictEqual(x.r.frames.length, 1);
    assert.strictEqual(x.r.frames[0].status, 'ok', JSON.stringify(x.r.frames[0].checks));
    assert.deepStrictEqual(x.r.frames[0].data, [0x21, 0x01, 0xFF, 0x00]);
    assert.ok(/automatisch/.test(chk(x.r.checks, 'Baudrate').val));
  });
});

test('Baudrate vorgegeben (opt.baud); falsche Vorgabe zeigt Abweichung bad und Zeichenrahmen-Fehler', function(){
  var ok = run({n:8000, messages:[{kwp:{tgt:0x11, src:0xF1, data:[0x3E, 0x01]}}]}, {baud:10400});
  assert.strictEqual(ok.r.frames[0].status, 'ok');
  assert.ok(/vorgegeben/.test(chk(ok.r.checks, 'Baudrate').val));
  var bad = run({n:8000, messages:[{kwp:{tgt:0x11, src:0xF1, data:[0x3E, 0x01]}}]}, {baud:9600});
  var d = chk(bad.r.checks, 'Baudraten-Abweichung');
  assert.ok(d && (d.st === 'warn' || d.st === 'bad'), JSON.stringify(d));
  /* 7800 Bd: keine Standardrate */
  var ns = run({baud:7800, n:9000, messages:[{kwp:{tgt:0x11, src:0xF1, data:[0x3E, 0x01]}}]});
  assert.strictEqual(ns.r.ok, true, ns.r.error);
  assert.strictEqual(chk(ns.r.checks, 'Baudrate').st, 'warn');
  assert.ok(/Standardrate/.test(chk(ns.r.checks, 'Baudrate').hint));
  assert.deepStrictEqual(ns.r.frames[0].data, [0x3E, 0x01]);
});

test('Baudraten-Toleranz: +1 % ok, +3 % warn (ISO 9141-2 ±2 %), +7 % bad', function(){
  var m = [{kwp:{tgt:0x11, src:0xF1, data:[0x21, 0x01, 0x55, 0xAA]}, ibGap:1e-3}];
  var a = run({n:8000, baudErr:0.01, messages:m}), b = run({n:8000, baudErr:0.03, messages:m}), c = run({n:8000, baud:9600, baudErr:0.07, messages:m});   /* 9600 Bd −7 %: näher an 10400 wäre mehrdeutig, daher 9600 als Basis */
  assert.strictEqual(chk(a.r.checks, 'Baudraten-Abweichung').st, 'ok');
  assert.strictEqual(chk(b.r.checks, 'Baudraten-Abweichung').st, 'warn');
  assert.strictEqual(chk(c.r.checks, 'Baudraten-Abweichung').st, 'bad');
  assert.strictEqual(c.r.info.bitrate, 9600);
  assert.deepStrictEqual(a.r.frames[0].data, [0x21, 0x01, 0x55, 0xAA]);
  assert.deepStrictEqual(b.r.frames[0].data, [0x21, 0x01, 0x55, 0xAA]);
});

test('Zu wenig Punkte pro Bit: Fehlertext mit Zeitbasis-Empfehlung', function(){
  var x = run({dt:60e-6, n:5000, messages:[{kwp:{tgt:0x11, src:0xF1, data:[0x3E, 0x01]}}]});
  assert.strictEqual(x.r.ok, false);
  assert.ok(/Zeitbasis/.test(x.r.error), x.r.error);
  assert.ok(/ms\/div/.test(x.r.error), x.r.error);
  var y = run({dt:40e-6, n:5000, messages:[{kwp:{tgt:0x11, src:0xF1, data:[0x3E, 0x01]}}]}, {baud:10400});   /* 2,4 Punkte pro Bit */
  assert.strictEqual(y.r.ok, false);
  assert.ok(/Zeitbasis höchstens 6,0 ms\/div/.test(y.r.error), y.r.error);
  assert.ok(/2,4/.test(y.r.error));
  var z = run({dt:24e-6, n:8000, messages:[{kwp:{tgt:0x11, src:0xF1, data:[0x3E, 0x01]}}]});             /* 4 Punkte pro Bit: dekodierbar, aber Warnung */
  assert.strictEqual(z.r.ok, true, z.r.error);
  assert.strictEqual(chk(z.r.checks, 'Abtastung').st, 'warn');
  assert.strictEqual(chk(z.r.checks, 'Baudraten-Abweichung').st === 'bad', false);   /* ±2-%-Normprüfung erst ab 8 Punkten pro Bit */
  assert.deepStrictEqual(z.r.frames[0].data, [0x3E, 0x01]);
  assert.strictEqual(z.r.frames[0].status, 'ok');
});

test('Statische Leitung: High (Ruhe), Low, Zwischenpegel, andere U_Bat', function(){
  function flat(v, noise){
    var a = new Float32Array(5000), s = 5;
    for(var i = 0; i < a.length; i++){ s = (s * 1664525 + 1013904223) >>> 0; a[i] = v + noise * ((s / 4294967296) - 0.5); }
    return a;
  }
  var hi = K.decodeKLine(flat(12.5, 0.1), 12e-6, {}, H);
  assert.strictEqual(hi.ok, false);
  assert.ok(/ruht auf High/.test(hi.error) && /keine Kommunikation/.test(hi.error), hi.error);
  assert.deepStrictEqual(hi.frames, []);
  assert.strictEqual(hi.checks[0].st, 'warn');
  var lo = K.decodeKLine(flat(0.2, 0.1), 12e-6, {}, H);
  assert.ok(/dauerhaft auf Low/.test(lo.error));
  assert.strictEqual(lo.checks[0].st, 'bad');
  var mid = K.decodeKLine(flat(6.5, 0.1), 12e-6, {}, H);
  assert.ok(/Zwischenpegel/.test(mid.error));
  var v24 = K.decodeKLine(flat(12.5, 0.1), 12e-6, {vbat:24}, H);          /* bei 24 V wäre 12,5 V Zwischenpegel */
  assert.ok(/Zwischenpegel/.test(v24.error));
});

test('Rauschen: 0,6 V Rauschen bei 12 V ändert nichts an den Bytes', function(){
  var x = run({n:8000, noise:0.6, seed:11, messages:[{kwp:{tgt:0x11, src:0xF1, data:[0x21, 0x01, 0xAA, 0x55]}}]});
  assert.strictEqual(x.r.frames.length, 1);
  assert.deepStrictEqual(x.r.frames[0].data, [0x21, 0x01, 0xAA, 0x55]);
  assert.strictEqual(x.r.frames[0].status, 'ok');
});

test('Pegelbewertung nach ISO 9141-2 (Sender 20 %/80 %, Empfänger 30 %/70 % von U_Bat)', function(){
  var m = [{kwp:{tgt:0x11, src:0xF1, data:[0x3E, 0x01]}}];
  var ok = run({n:6000, messages:m});
  assert.strictEqual(chk(ok.r.checks, 'Low-Pegel').st, 'ok');
  var w = run({n:6000, vlow:2.8, messages:m});            /* 22 % */
  assert.strictEqual(chk(w.r.checks, 'Low-Pegel').st, 'warn');
  assert.ok(/20 %/.test(chk(w.r.checks, 'Low-Pegel').hint));
  var b = run({n:6000, vlow:4.5, messages:m});            /* 36 % */
  assert.strictEqual(chk(b.r.checks, 'Low-Pegel').st, 'bad');
  var hw = run({n:6000, vhigh:9.5, messages:m});          /* 75 % */
  assert.strictEqual(chk(hw.r.checks, 'High-Pegel').st, 'warn');
  var hb = run({n:6000, vhigh:7.5, messages:m});          /* 60 % */
  assert.strictEqual(chk(hb.r.checks, 'High-Pegel').st, 'bad');
  /* andere U_Bat: 14,0 V Bordnetz bei laufendem Motor */
  var eng = run({n:6000, vbat:14, messages:m}, {vbat:14});
  assert.strictEqual(chk(eng.r.checks, 'High-Pegel').st, 'ok');
  var wrong = run({n:6000, vbat:18, messages:m});               /* 18 V gemessen, aber 12,6 V eingestellt */
  assert.ok(chk(wrong.r.checks, 'U_Bat-Einstellung'));
});

test('Aufnahme beginnt mitten im Byte/in der Botschaft: Teilbotschaft als Warnung, folgende Botschaft korrekt', function(){
  var d = [0x21, 0x01, 0xA5, 0x3C];
  var base = run({n:9000, t0:-3.9e-3, messages:[
    {kwp:{tgt:0x11, src:0xF1, data:d}, ibGap:1e-3},
    {kwp:{tgt:0xF1, src:0x11, data:[0x61, 0x01, 0x12]}, gap:30e-3}
  ]});
  var r = base.r;
  assert.strictEqual(r.ok, true, r.error);
  assert.strictEqual(r.frames.length, 2);
  var p = r.frames[0];
  assert.ok(/Teilbotschaft/.test(p.title), p.title);
  assert.strictEqual(p.status, 'warn');
  assert.strictEqual(chk(p.checks, 'Aufnahmebeginn').st, 'warn');
  assert.ok(p.data.length >= 2 && p.data.length < 8);
  assert.strictEqual(r.frames[1].status, 'ok');
  assert.deepStrictEqual(r.frames[1].data, [0x61, 0x01, 0x12]);
  /* Aufnahme beginnt in einer Byte-Lücke (Pause 5,5 ms zwischen Bytes sieht wie Ruhe aus): Kopf passt nicht -> Teilbotschaft, keine Fehlinterpretation */
  var g = run({n:6000, t0:-1.2e-3, messages:[{kwp:{tgt:0x11, src:0xF1, data:[0x21, 0x01, 0x02]}}]});
  assert.ok(/Teilbotschaft/.test(g.r.frames[0].title), g.r.frames[0].title);
  assert.strictEqual(g.r.frames[0].status, 'warn');
  /* Aufnahme beginnt direkt an der Startflanke (Trigger links): Botschaft ist vollständig und wird normal ausgewertet */
  var t = run({n:9000, t0:30e-6, messages:[{kwp:{tgt:0x11, src:0xF1, data:[0x3E, 0x01]}, ibGap:1e-3}]});
  assert.strictEqual(t.r.frames.length, 1);
  assert.strictEqual(t.r.frames[0].status, 'ok', JSON.stringify(t.r.frames[0].checks));
  assert.ok(/Fmt/.test(t.r.frames[0].fields[0].label));
});

test('Aufnahme endet vor dem Botschaftsende: abgeschnitten = warn statt bad', function(){
  var x = run({n:2000, messages:[{kwp:{tgt:0x11, src:0xF1, data:[0x21, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]}, ibGap:1e-3}]});
  var f = x.r.frames[0];
  assert.strictEqual(x.r.ok, true);
  var c = chk(f.checks, 'Länge');
  assert.strictEqual(c.st, 'warn', JSON.stringify(f.checks));
  assert.ok(/abgeschnitten/.test(c.hint));
  assert.strictEqual(f.status, 'warn');
});

test('Keine Botschaft in bewegtem Signal (nur Störimpulse): ok=false mit Erklärung, kein Absturz', function(){
  var a = new Float32Array(5000);
  for(var i = 0; i < a.length; i++) a[i] = (i === 1000 || i === 3000) ? 0.2 : 12.4;       /* 1-Sample-Störungen */
  var r = K.decodeKLine(a, 12e-6, {}, H);
  assert.strictEqual(r.frames.length, 0);
  assert.ok(r.ok === false ? /Keine auswertbare|Zu wenige|ruht/.test(r.error) : true);
});

test('Ungültige Eingaben: leer, NaN, dt <= 0', function(){
  assert.strictEqual(K.decodeKLine(new Float32Array(0), 1e-5, {}, H).ok, false);
  var a = new Float32Array(100); a[3] = NaN;
  var r = K.decodeKLine(a, 1e-5, {}, H);
  assert.strictEqual(r.ok, false); assert.ok(r.error);
  assert.strictEqual(K.decodeKLine(new Float32Array(100), -1, {}, H).ok, false);
});

test('synthKLine ist deterministisch, seed-abhängig und liefert die Wahrheit mit', function(){
  var o = {n:6000, seed:5, messages:[{kwp:{tgt:0x11, src:0xF1, data:[0x3E, 0x01]}}]};
  var a = K.synthKLine(o), b = K.synthKLine(o), c = K.synthKLine({n:6000, seed:6, messages:o.messages});
  assert.deepStrictEqual(Array.prototype.slice.call(a.values), Array.prototype.slice.call(b.values));
  assert.notDeepStrictEqual(Array.prototype.slice.call(a.values, 0, 300), Array.prototype.slice.call(c.values, 0, 300));
  assert.strictEqual(a.values.length, 6000);
  assert.deepStrictEqual(a.truth.messages[0].bytes, [0x82, 0x11, 0xF1, 0x3E, 0x01, (0x82 + 0x11 + 0xF1 + 0x3E + 0x01) & 255]);
});

test('Performance: 5000 Samples < 20 ms, 262144 Samples < 500 ms', function(){
  var m = [];
  for(var i = 0; i < 60; i++) m.push({kwp:{tgt:0x11, src:0xF1, data:[0x21, i & 255, 0x55, 0xAA, 0x01]}, gap:40e-3, ibGap:1e-3});
  var s = K.synthKLine({n:5000, messages:m.slice(0, 2)});
  K.decodeKLine(s.values, s.dt, {}, H);
  var t = Date.now(), k;
  for(k = 0; k < 10; k++) K.decodeKLine(s.values, s.dt, {}, H);
  assert.ok((Date.now() - t) / 10 < 20, 'je Aufruf ' + (Date.now() - t) / 10 + ' ms');
  var big = K.synthKLine({n:262144, messages:m});
  t = Date.now();
  var r = K.decodeKLine(big.values, big.dt, {}, H);
  var ms = Date.now() - t;
  assert.ok(r.ok && r.frames.length >= 40, 'Botschaften: ' + r.frames.length + ' ' + r.error);
  assert.ok(ms < 500, ms + ' ms');
});
