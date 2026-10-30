/* Tests SENT-Decoder: node --test sent.test.js
   CRC-Bekanntvektoren: Die Zahlentabelle B.1-2 der SAE J2716 ist kostenpflichtig und war nicht einsehbar. Stattdessen werden zwei
   voneinander unabhängige VERÖFFENTLICHTE Algorithmen als Referenz nachgebaut und der Decoder dagegen geprüft:
   (a) TI SPRAB22 (Juli 2010, Abschn. 2.7.1) bitserielle Routine CrcMthd2: Polynom 0xD (x^4+x^3+x^2+1 ohne x^4), Startwert 5, Daten-Bits
       nacheinander eingeschoben, KEIN Null-Nibble  ->  Variante 2007/2008 ("legacy").
   (b) Microchip dsPIC33 SENT-Modul, Abschn. "CRC Calculation": Tabelle {0,13,7,10,14,3,9,4,1,12,6,11,15,2,8,5}, Startwert 5,
       crc = Nibble ^ Tabelle[crc], danach ein zusätzlicher Schritt mit Null-Nibble  ->  Variante 2010 ("recommended").
   Handrechnung zur Probe (Polynomdivision, Startwert 0101, Nibble 0): 0101 -> 1010 -> (10100^11101)=1001 -> (10010^11101)=1111 ->
   (11110^11101)=0011 = 3, also CRC(legacy, [0]) = 3 = Tabelle[5]. */
'use strict';
var test = require('node:test');
var assert = require('node:assert');
var H = require('./common.js');
var S = require('./sent.js');

function tiBitSerial(nibs){            /* Port von TI SPRAB22 CrcMthd2 */
  var crc = 5, poly = 0xD, tmp = 0, i, mask;
  for(i = 0; i < nibs.length; i++) tmp = (tmp * 16) + nibs[i];
  for(mask = nibs.length * 4 - 1; mask >= 0; mask--){
    crc = crc << 1;
    if(Math.floor(tmp / Math.pow(2, mask)) & 1) crc = crc | 1;
    if(crc & 0x10) crc = crc ^ poly;
    crc = crc & 0xF;
  }
  return crc;
}
var MCH = [0, 13, 7, 10, 14, 3, 9, 4, 1, 12, 6, 11, 15, 2, 8, 5];
function microchipRecommended(nibs){   /* Microchip-Beispiel: Schleife + zusätzliches Null-Nibble */
  var c = 5;
  for(var i = 0; i < nibs.length; i++) c = nibs[i] ^ MCH[c];
  return 0 ^ MCH[c];
}

function run(o, opt){
  var s = S.synthSENT(o);
  return {s:s, r:S.decodeSENT(s.values, s.dt, opt || {}, H)};
}
function chk(list, name){
  for(var i = 0; i < list.length; i++) if(list[i].name === name) return list[i];
  return null;
}

test('CRC: Handrechnung und beide veröffentlichten Referenzen stimmen überein', function(){
  assert.strictEqual(tiBitSerial([0]), 3);
  assert.strictEqual(MCH[5], 3);
  /* Zusammenhang: empfohlene Variante = ältere Variante + ein Tabellenschritt (Null-Nibble) */
  var seed = 12345, i, n;
  function r(){ seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed >> 8; }
  for(n = 0; n < 200; n++){
    var d = [];
    for(i = 0; i < 6; i++) d.push(r() & 15);
    assert.strictEqual(MCH[tiBitSerial(d)], microchipRecommended(d));
  }
});

test('CRC: Decoder akzeptiert Botschaften mit TI-Referenz (2007/08) und Microchip-Referenz (2010) als CRC-Nibble', function(){
  var vecs = [[1,2,3,4,5,6],[0,0,0,0,0,0],[15,15,15,15,15,15],[10,0,8,15,15,4],[1,0,0,0],[7,7,7]];
  var fl = [], fr = [];
  vecs.forEach(function(d){
    fl.push({data:d, crcNibble:tiBitSerial(d)});
    fr.push({data:d, crcNibble:microchipRecommended(d)});
  });
  /* feste Variante prüft streng; je Aufnahme gleiche Nibble-Anzahl, daher je Vektorlänge eine Aufnahme */
  [6, 4, 3].forEach(function(nn){
    var set = vecs.filter(function(d){ return d.length === nn; });
    var a = run({nibbles:nn, n:20000, frames:set.map(function(d){ return {data:d, crcNibble:tiBitSerial(d)}; })}, {crc:'legacy'});
    assert.strictEqual(a.r.ok, true, a.r.error);
    assert.strictEqual(a.r.frames.length, set.length);
    a.r.frames.forEach(function(f){ assert.strictEqual(f.status === 'bad', false, f.text); });
    var b = run({nibbles:nn, n:20000, frames:set.map(function(d){ return {data:d, crcNibble:microchipRecommended(d)}; })}, {crc:'recommended'});
    assert.strictEqual(b.r.frames.length, set.length);
    b.r.frames.forEach(function(f){ assert.strictEqual(f.status === 'bad', false, f.text); });
  });
  assert.ok(fl.length === fr.length);
});

test('CRC: jeder Einzel-Nibble-Fehler wird in beiden Varianten erkannt (NXP AN4432: alle Einzelbit-/Burst≤4-Fehler)', function(){
  var d = [3, 9, 12, 0, 7, 15];
  for(var i = 0; i < d.length; i++){
    for(var v = 0; v < 16; v++){
      if(v === d[i]) continue;
      var e = d.slice(); e[i] = v;
      assert.notStrictEqual(tiBitSerial(e), tiBitSerial(d));
      assert.notStrictEqual(microchipRecommended(e), microchipRecommended(d));
    }
  }
});

test('Gutfall: 6 Datennibble, Tick automatisch, Daten und Felder stimmen', function(){
  var x = run({});
  var r = x.r;
  assert.strictEqual(r.bus, 'sent');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.error, null);
  assert.ok(Math.abs(r.info.bitTime - 3e-6) < 3e-8, 'Tick ' + r.info.bitTime);
  assert.ok(Math.abs(r.info.samplesPerBit - 8) < 0.1);
  assert.ok(r.frames.length >= 3);
  r.frames.forEach(function(f, i){
    assert.deepStrictEqual(f.data, x.s.truth.frames[i].data);
    assert.strictEqual(f.status, 'ok', f.text);
    assert.strictEqual(f.fields[0].label, 'SYNC');
    assert.strictEqual(f.fields[0].kind, 'sync');
    assert.strictEqual(f.fields[1].label, 'ST 0x0');
    assert.strictEqual(f.fields[2].label, 'D0 0x' + x.s.truth.frames[i].data[0].toString(16).toUpperCase());
    assert.strictEqual(f.fields[f.fields.length - 1].kind, 'crc');
    assert.ok(/^CRC 0x[0-9A-F]$/.test(f.fields[f.fields.length - 1].label));
    assert.ok(f.t1 > f.t0);
    f.fields.forEach(function(fd){ assert.ok(fd.t1 > fd.t0 && fd.t0 >= f.t0 - 1e-12 && fd.t1 <= f.t1 + 1e-12); assert.ok(fd.label.length <= 12); });
  });
  /* Zeiten stimmen mit Quelle überein (±1 Abtastwert) */
  assert.ok(Math.abs(r.frames[0].t0 - x.s.truth.frames[0].t0) < 2e-6);   /* Mittenschwelle der Flanke liegt bis zu 1,5 µs nach dem Sollzeitpunkt */
  assert.strictEqual(chk(r.checks, 'CRC-Variante').val.indexOf('2010') >= 0, true);
  assert.strictEqual(chk(r.checks, 'Abtastung').st, 'ok');
  assert.strictEqual(chk(r.checks, 'Low-Pegel').st, 'ok');
  assert.strictEqual(chk(r.checks, 'High-Pegel').st, 'ok');
});

test('Status-Nibble und Anzahl der Datennibble (1, 3, 4, 6, 8) werden übernommen', function(){
  [1, 3, 4, 8].forEach(function(nn){
    var x = run({nibbles:nn, n:12000, frames:[{status:5}, {status:5}, {status:5}, {status:5}]});
    assert.strictEqual(x.r.ok, true);
    assert.ok(x.r.frames.length >= 3, 'N=' + nn);
    x.r.frames.forEach(function(f, i){
      assert.strictEqual(f.data.length, nn);
      assert.deepStrictEqual(f.data, x.s.truth.frames[i].data);
      assert.strictEqual(f.fields[1].label, 'ST 0x5');
      assert.strictEqual(f.status, 'ok', f.text);
    });
  });
});

test('Tick-Vorgabe opt.tick und andere Tick-Zeiten (5 µs, 12 µs, 90 µs) automatisch', function(){
  var a = run({}, {tick:3e-6});
  assert.strictEqual(a.r.frames.length >= 3, true);
  assert.strictEqual(chk(a.r.checks, 'Tick-Zeit').st, 'ok');
  [5e-6, 12e-6, 90e-6].forEach(function(tk){
    var x = run({tick:tk});
    assert.ok(x.r.frames.length >= 3, 'tick ' + tk);
    assert.ok(Math.abs(x.r.info.bitTime / tk - 1) < 0.01);
    assert.strictEqual(chk(x.r.checks, 'Tick-Zeit').st, 'info');
    x.r.frames.forEach(function(f, i){ assert.deepStrictEqual(f.data, x.s.truth.frames[i].data); });
  });
});

test('Tick-Abweichung vom Sollwert: +16 % noch Norm (ok), 4 µs statt 3 µs deutlich zu weit (bad)', function(){
  var ok = run({tick:3.5e-6}, {tick:3e-6});
  assert.ok(ok.r.frames.length >= 3);
  assert.strictEqual(chk(ok.r.checks, 'Tick-Zeit').st, 'ok');
  var bad = run({tick:4e-6}, {tick:3e-6});
  assert.ok(bad.r.frames.length >= 3, 'wird über automatische Tick-Suche trotzdem dekodiert');
  var c = chk(bad.r.checks, 'Tick-Zeit');
  assert.strictEqual(c.st, 'bad');
  assert.ok(/\+33/.test(c.val), c.val);
  bad.r.frames.forEach(function(f){ assert.strictEqual(f.status, 'bad'); });
});

test('CRC-Variante: 2010, 2007/08, beide, gemischt und Erzwingen', function(){
  var rec = run({crc:'recommended', n:12000});
  assert.ok(/2010/.test(chk(rec.r.checks, 'CRC-Variante').val));
  var leg = run({crc:'legacy', n:12000});
  assert.ok(/2007/.test(chk(leg.r.checks, 'CRC-Variante').val));
  /* Daten mit CRC, für die beide Varianten dasselbe liefern (Fixpunkte 0 und 11 der Tabelle) */
  var both = null, i, d;
  for(i = 0; i < 4000 && !both; i++){
    d = [i & 15, (i >> 4) & 15, (i >> 8) & 15];
    if(tiBitSerial(d) === microchipRecommended(d)) both = d;
  }
  var x = run({nibbles:3, frames:[{data:both}, {data:both}, {data:both}]});
  assert.ok(/beide/.test(chk(x.r.checks, 'CRC-Variante').val), chk(x.r.checks, 'CRC-Variante').val);
  assert.strictEqual(x.r.frames[0].status, 'ok');
  /* gemischt */
  var d1 = [1, 2, 3, 4, 5, 6], d2 = [6, 5, 4, 3, 2, 1];
  assert.notStrictEqual(tiBitSerial(d1), microchipRecommended(d1));
  var mix = run({n:12000, frames:[{data:d1, crc:'legacy'}, {data:d2, crc:'recommended'}, {data:d1, crc:'legacy'}, {data:d2, crc:'recommended'}]});
  assert.strictEqual(chk(mix.r.checks, 'CRC-Variante').st, 'warn');
  /* erzwungen: falsche Variante = bad mit Hinweis auf die andere */
  var f = run({n:12000, frames:[{data:d1, crc:'legacy'}, {data:d1, crc:'legacy'}, {data:d1, crc:'legacy'}]}, {crc:'recommended'});
  f.r.frames.forEach(function(fr){
    var c = chk(fr.checks, 'CRC');
    assert.strictEqual(c.st, 'bad');
    assert.ok(/anderen Variante/.test(c.val));
  });
});

test('CRC-Fehler: falsches CRC-Nibble -> Botschaft bad, Nachbarn bleiben ok', function(){
  var x = run({n:12000, frames:[{}, {badCrc:true}, {}, {}]});
  assert.strictEqual(x.r.frames[0].status, 'ok');
  assert.strictEqual(x.r.frames[1].status, 'bad');
  var c = chk(x.r.frames[1].checks, 'CRC');
  assert.strictEqual(c.st, 'bad');
  assert.ok(/erwartet/.test(c.val));
  assert.strictEqual(x.r.frames[1].fields[x.r.frames[1].fields.length - 1].bad, true);
  assert.strictEqual(x.r.frames[2].status, 'ok');
  assert.ok(/FEHLER/.test(x.r.frames[1].text));
});

test('CRC nur mit Status-Nibble berechnet (Herstellervariante) -> Warnung statt Fehler', function(){
  var d = [4, 8, 15, 3, 9, 1], st = 2, crc, tries = 0;   /* st=6 würde den CRC-Zustand auf den Startwert zurückführen -> unbrauchbar */
  /* CRC nach TI-Referenz über [Status + Daten]; Daten so wählen, dass es nicht zufällig auch ohne Status passt */
  crc = tiBitSerial([st].concat(d));
  while((crc === tiBitSerial(d) || crc === microchipRecommended(d)) && tries++ < 16){ d[0] = (d[0] + 1) & 15; crc = tiBitSerial([st].concat(d)); }
  assert.notStrictEqual(crc, tiBitSerial(d));
  assert.notStrictEqual(crc, microchipRecommended(d));
  var x = run({n:12000, frames:[{status:st, data:d, crcNibble:crc}, {status:st, data:d, crcNibble:crc}, {status:st, data:d, crcNibble:crc}]});
  var c = chk(x.r.frames[0].checks, 'CRC');
  assert.strictEqual(c.st, 'warn');
  assert.ok(/Status/.test(c.val));
  assert.strictEqual(x.r.frames[0].status, 'warn');
});

test('Sync-Schwankung: 0,5 % je Botschaft ok, 3 % Tick-Drift -> bad (Norm 1/64 = 1,56 %)', function(){
  var ok = run({n:15000, drift:0.005});
  assert.ok(ok.r.frames.length >= 3);
  ok.r.frames.slice(1).forEach(function(f){ assert.strictEqual(chk(f.checks, 'Sync-Schwankung').st, 'ok'); });
  var warn = run({n:15000, drift:0.02});
  assert.strictEqual(chk(warn.r.frames[1].checks, 'Sync-Schwankung').st, 'warn');
  var bad = run({n:15000, drift:0.04});
  var c = chk(bad.r.frames[1].checks, 'Sync-Schwankung');
  assert.strictEqual(c.st, 'bad');
  assert.ok(/1,56/.test(c.val));
  assert.strictEqual(bad.r.frames[1].status, 'bad');
  /* Daten werden trotz Drift korrekt gelesen (Tick je Botschaft aus eigenem Sync) */
  bad.r.frames.forEach(function(f, i){ assert.deepStrictEqual(f.data, bad.s.truth.frames[i].data); });
});

test('Nibble außerhalb 12..27 Ticks: Wert null (nicht 0), Check bad', function(){
  var x = run({n:12000, frames:[{}, {override:{3:31}}, {override:{2:9}}, {}]});
  var f1 = x.r.frames[1], f2 = x.r.frames[2];
  assert.strictEqual(f1.status, 'bad');
  var c = chk(f1.checks, 'Nibble-Bereich');
  assert.strictEqual(c.st, 'bad');
  assert.ok(/D2/.test(c.val) && /31/.test(c.val), c.val);
  assert.strictEqual(f1.data[2], null);
  assert.ok(f1.fields[4].bad);
  assert.strictEqual(chk(f1.checks, 'CRC').st, 'warn');
  assert.strictEqual(f2.data[1], null);
  assert.strictEqual(f2.status, 'bad');
});

test('Fehlender Impuls (Nibble verloren): Nibble-Anzahl bad', function(){
  var x = run({n:15000, frames:[{}, {}, {dropPeriod:3}, {}, {}]});
  assert.ok(x.r.frames.length >= 4);
  var bad = x.r.frames.filter(function(f){ return f.status === 'bad'; });
  assert.strictEqual(bad.length >= 1, true);
  assert.ok(chk(bad[0].checks, 'Nibble-Anzahl'));
  assert.strictEqual(chk(bad[0].checks, 'Nibble-Anzahl').st, 'bad');
  assert.strictEqual(x.r.frames[0].status, 'ok');
});

test('Pausenpuls: lang (>27 Ticks), kurz (12–27, per CRC erkannt), konstante Rahmenlänge, zu lang', function(){
  var a = run({pause:40, n:12000});
  assert.ok(a.r.frames.length >= 3);
  a.r.frames.forEach(function(f, i){
    assert.strictEqual(f.status, 'ok');
    assert.strictEqual(f.fields[f.fields.length - 1].label, 'PAUSE');
    assert.strictEqual(f.fields[f.fields.length - 1].kind, 'end');
    assert.ok(/40 Ticks/.test(chk(f.checks, 'Pausenpuls').val));
    assert.deepStrictEqual(f.data, a.s.truth.frames[i].data);
  });
  assert.ok(/mit Pausenpuls/.test(chk(a.r.checks, 'Aufbau').val));
  var b = run({pause:18, n:12000});
  assert.ok(b.r.frames.length >= 3);
  b.r.frames.forEach(function(f, i){
    assert.strictEqual(f.data.length, 6);
    assert.deepStrictEqual(f.data, b.s.truth.frames[i].data);
    assert.strictEqual(f.status, 'ok');
  });
  assert.ok(/mit Pausenpuls/.test(chk(b.r.checks, 'Aufbau').val));
  var c = run({frameTicks:300, n:20000});
  assert.ok(c.r.frames.length >= 4);
  c.r.frames.forEach(function(f){ assert.strictEqual(f.status, 'ok'); });
  var d = run({pause:800, n:40000, nibbles:3}, {nibbles:3});
  var w = chk(d.r.frames[0].checks, 'Pausenpuls');
  assert.strictEqual(w.st, 'warn');
  assert.ok(/768/.test(w.hint));
});

test('Ohne Pausenpuls und opt.nibbles: Anzahl vorgegeben, falsche Vorgabe wird als Fehler gemeldet', function(){
  var ok = run({n:12000}, {nibbles:6});
  assert.ok(ok.r.frames.length >= 3);
  ok.r.frames.forEach(function(f){ assert.strictEqual(f.status, 'ok'); });
  var wrong = run({n:12000}, {nibbles:4});
  assert.ok(wrong.r.frames.length >= 2);
  wrong.r.frames.forEach(function(f){
    assert.strictEqual(f.status, 'bad');
    assert.strictEqual(chk(f.checks, 'Nibble-Anzahl').st, 'bad');
  });
});

test('Aufnahme beginnt mitten in einer Botschaft: Reste verworfen, danach korrekt', function(){
  var x = run({n:8000, t0:-250e-6});
  assert.strictEqual(x.r.ok, true, x.r.error);
  assert.ok(x.r.frames.length >= 2);
  assert.ok(chk(x.r.checks, 'Aufnahmebeginn'));
  x.r.frames.forEach(function(f){ assert.strictEqual(f.status, 'ok'); });
  /* gleiche Daten wie die Quelle ab der zweiten Botschaft */
  var tf = x.s.truth.frames, off = tf.findIndex(function(f){ return f.t0 >= 0; });
  assert.deepStrictEqual(x.r.frames[0].data, tf[off].data);
});

test('Aufnahme enthält nur eine Botschaft: Nibble-Anzahl wird geschätzt (Hinweis), mit opt.nibbles sicher', function(){
  var x = run({n:2200, frames:[{}]});
  assert.strictEqual(x.r.ok, true, x.r.error);
  assert.strictEqual(x.r.frames.length, 1);
  assert.deepStrictEqual(x.r.frames[0].data, x.s.truth.frames[0].data);
  assert.ok(/geschätzt/.test(chk(x.r.checks, 'Botschaften').hint));
  var y = run({n:2200, frames:[{}]}, {nibbles:6});
  assert.strictEqual(y.r.frames.length, 1);
  assert.strictEqual(chk(y.r.checks, 'Botschaften').hint, '');
});

test('Letzte Botschaft ist abgeschnitten: wird nicht ausgewertet', function(){
  var x = run({n:5000});
  var full = x.r.frames.length;
  var cut = S.decodeSENT(x.s.values.subarray(0, 4000), x.s.dt, {}, H);
  assert.strictEqual(cut.ok, true);
  assert.ok(cut.frames.length <= full && cut.frames.length >= 1);
  cut.frames.forEach(function(f){ assert.strictEqual(f.status, 'ok'); });
});

test('Zu wenig Punkte pro Tick: Fehlertext mit Zeitbasis-Empfehlung', function(){
  var x = run({dt:1.5e-6, n:5000}, {tick:3e-6});
  assert.strictEqual(x.r.ok, false);
  assert.ok(/Zeitbasis/.test(x.r.error), x.r.error);
  assert.ok(/µs\/div/.test(x.r.error), x.r.error);
  assert.ok(/18[78] µs\/div/.test(x.r.error), 'Empfehlung 187,5 µs/div (3 µs / 8 * 500): ' + x.r.error);
  var y = run({dt:1.0e-6, n:5000}, {tick:3e-6});          /* 3 Punkte pro Tick: gerade noch dekodierbar, aber rote Abtast-Prüfung */
  assert.strictEqual(y.r.ok, true, y.r.error);
  assert.ok(y.r.frames.length >= 1);
  assert.strictEqual(chk(y.r.checks, 'Abtastung').st, 'bad');
  y.r.frames.forEach(function(f, i){ assert.deepStrictEqual(f.data, y.s.truth.frames[i].data); });
  var z = run({dt:0.6e-6, n:5000});                       /* 5 Punkte pro Tick, automatisch */
  assert.strictEqual(z.r.ok, true);
  assert.strictEqual(chk(z.r.checks, 'Abtastung').st, 'warn');
  z.r.frames.forEach(function(f, i){ assert.deepStrictEqual(f.data, z.s.truth.frames[i].data); });
  var w = run({dt:3e-6, n:5000});                         /* Abtastrate = Tick: auch automatisch nicht auswertbar */
  assert.strictEqual(w.r.ok, false);
  assert.ok(/Zeitbasis|Punkte/.test(w.r.error), w.r.error);
});

test('Statische Leitung: High, Low, Zwischenpegel, mit Rauschen', function(){
  function flat(v, noise){
    var a = new Float32Array(5000), s = 1;
    for(var i = 0; i < a.length; i++){ s = (s * 1664525 + 1013904223) >>> 0; a[i] = v + noise * ((s / 4294967296) - 0.5); }
    return a;
  }
  var hi = S.decodeSENT(flat(5, 0.05), 1e-6, {}, H);
  assert.strictEqual(hi.ok, false);
  assert.ok(/ruht auf High/.test(hi.error) && /Sensor sendet nichts/.test(hi.error), hi.error);
  assert.deepStrictEqual(hi.frames, []);
  assert.strictEqual(hi.checks[0].st, 'warn');
  var lo = S.decodeSENT(flat(0.1, 0.05), 1e-6, {}, H);
  assert.strictEqual(lo.ok, false);
  assert.ok(/dauerhaft auf Low/.test(lo.error));
  assert.strictEqual(lo.checks[0].st, 'bad');
  var mid = S.decodeSENT(flat(2.4, 0.05), 1e-6, {}, H);
  assert.ok(/Zwischenpegel/.test(mid.error));
});

test('Rauschen: 0,25 V Rauschen (ca. 5 % des Hubs) ändert nichts an den Daten', function(){
  var x = run({noise:0.25, n:12000, seed:7});
  assert.ok(x.r.frames.length >= 3);
  x.r.frames.forEach(function(f, i){ assert.deepStrictEqual(f.data, x.s.truth.frames[i].data); assert.strictEqual(f.status, 'ok'); });
});

test('Reines Rauschen / kein SENT: Fehlertext, kein Absturz', function(){
  var a = new Float32Array(5000), s = 99;
  for(var i = 0; i < a.length; i++){ s = (s * 1664525 + 1013904223) >>> 0; a[i] = (s >>> 20) & 1 ? 4.9 : 0.2; }
  var r = S.decodeSENT(a, 0.4e-6, {}, H);
  assert.ok(r.frames.length === 0 || r.ok === true);
  /* regelmäßiger Rechteck ohne Sync */
  var sq = new Float32Array(5000);
  for(i = 0; i < sq.length; i++) sq[i] = (Math.floor(i / 20) % 2) ? 5 : 0;
  var q = S.decodeSENT(sq, 0.4e-6, {}, H);
  assert.strictEqual(q.ok, false);
  assert.ok(/Kein SENT-Signal/.test(q.error), q.error);
});

test('Pegelbewertung: High 3,0 V bad, Low 1,2 V bad, Richtwerte als typisch beschrieben', function(){
  var x = run({vhigh:3.0, vlow:0.3, n:8000});
  var h = chk(x.r.checks, 'High-Pegel');
  assert.strictEqual(h.st, 'bad');
  assert.ok(/typisch|Richtwert/i.test(h.hint));
  var y = run({vlow:1.2, n:8000});
  assert.strictEqual(chk(y.r.checks, 'Low-Pegel').st, 'bad');
  var z = run({vlow:0.8, n:8000});
  assert.strictEqual(chk(z.r.checks, 'Low-Pegel').st, 'warn');
});

test('Slow Channel: wechselnde Status-Bits 2/3 werden im Info erwähnt, nicht dekodiert', function(){
  var x = run({n:15000, frames:[{status:8}, {status:0}, {status:4}, {status:0}, {status:0}]});
  var c = chk(x.r.checks, 'Slow Channel');
  assert.ok(c);
  assert.ok(/nicht dekodiert/.test(c.hint));
  var y = run({n:12000, frames:[{status:1}, {status:1}, {status:1}]});
  assert.strictEqual(chk(y.r.checks, 'Slow Channel'), null);
});

test('Ungültige Eingaben: leer, NaN, falsches dt', function(){
  assert.strictEqual(S.decodeSENT(new Float32Array(0), 1e-6, {}, H).ok, false);
  var a = new Float32Array(100); a[10] = NaN;
  var r = S.decodeSENT(a, 1e-6, {}, H);
  assert.strictEqual(r.ok, false); assert.ok(r.error);
  assert.strictEqual(S.decodeSENT(new Float32Array(100), 0, {}, H).ok, false);
  assert.strictEqual(S.decodeSENT(new Float32Array(100), 1e-6, null, H).ok, false);
});

test('synthSENT ist deterministisch und seed-abhängig', function(){
  var a = S.synthSENT({seed:3}), b = S.synthSENT({seed:3}), c = S.synthSENT({seed:4});
  assert.deepStrictEqual(Array.prototype.slice.call(a.values), Array.prototype.slice.call(b.values));
  assert.notDeepStrictEqual(Array.prototype.slice.call(a.values, 0, 500), Array.prototype.slice.call(c.values, 0, 500));
  assert.strictEqual(a.values.length, 5000);
});

test('Performance: 5000 Samples < 20 ms, 262144 Samples < 500 ms', function(){
  var s = S.synthSENT({n:5000});
  S.decodeSENT(s.values, s.dt, {}, H);       /* Warmlauf */
  var t = Date.now(), i;
  for(i = 0; i < 10; i++) S.decodeSENT(s.values, s.dt, {}, H);
  assert.ok((Date.now() - t) / 10 < 20, 'je Aufruf ' + (Date.now() - t) / 10 + ' ms');
  var big = S.synthSENT({n:262144, tick:3e-6});
  t = Date.now();
  var r = S.decodeSENT(big.values, big.dt, {}, H);
  var ms = Date.now() - t;
  assert.ok(r.ok && r.frames.length > 50);
  assert.ok(ms < 500, ms + ' ms');
});
