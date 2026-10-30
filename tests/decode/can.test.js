/* Tests für den CAN-Decoder: node --test can.test.js */
'use strict';
var test = require('node:test');
var assert = require('node:assert');
var H = require('./common.js');
var C = require('./can.js');
var decodeCAN = C.decodeCAN, synthCAN = C.synthCAN;

function run(o, opt){
  var s = synthCAN(o);
  return decodeCAN(s.values, s.dt, opt || {}, H);
}
function checkOf(list, name){
  for(var i = 0; i < list.length; i++) if(list[i].name === name) return list[i];
  return null;
}
function labels(f){ return f.fields.map(function(x){ return x.label; }); }
function hexs(a){ return a.map(function(v){ return H.hex(v, 2); }); }

/* ---------- CRC-15 ---------- */
/* Unabhängige Referenz: Polynomdivision über Bit-Arrays mit ausgeschriebenen Exponenten
   g(x) = x^15 + x^14 + x^10 + x^8 + x^7 + x^4 + x^3 + 1 (CAN-Polynom nach ISO 11898-1 / Bosch CAN 2.0). */
function refCrc15(bits){
  var exps = [15, 14, 10, 8, 7, 4, 3, 0], reg = bits.concat([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
  for(var i = 0; i < bits.length; i++){
    if(reg[i] === 1) exps.forEach(function(e){ reg[i + 15 - e] ^= 1; });
  }
  var r = 0;
  for(var k = bits.length; k < reg.length; k++) r = r * 2 + reg[k];
  return r;
}
function bitsOfBytes(str){
  var out = [];
  for(var i = 0; i < str.length; i++) for(var k = 7; k >= 0; k--) out.push((str.charCodeAt(i) >> k) & 1);
  return out;
}

test('CRC-15/CAN: Prüfwert 0x059E für "123456789" (CRC RevEng Catalogue, Greg Cook: CRC-15/CAN, poly=0x4599 init=0 refin=false refout=false xorout=0 check=0x059e)', function(){
  assert.strictEqual(decodeCAN.crc15(bitsOfBytes('123456789')), 0x059E);
  assert.strictEqual(refCrc15(bitsOfBytes('123456789')), 0x059E);
});
test('CRC-15: Restwert 0 beim Anhängen der CRC (Eigenschaft des Codes) und Übereinstimmung mit unabhängiger Polynomdivision', function(){
  var seed = 7;
  function rnd(){ seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed; }
  for(var n = 1; n < 60; n++){
    var bits = [];
    for(var i = 0; i < n * 3; i++) bits.push((rnd() >> 8) & 1);
    var c = decodeCAN.crc15(bits);
    assert.strictEqual(c, refCrc15(bits));
    var full = bits.slice();
    for(var k = 14; k >= 0; k--) full.push((c >> k) & 1);
    assert.strictEqual(decodeCAN.crc15(full), 0);
  }
});
test('CRC im dekodierten Frame stimmt mit unabhängig berechnetem Wert überein (Frame von Hand aufgebaut)', function(){
  /* SOF, ID 0x123, RTR 0, IDE 0, r0 0, DLC 2, Daten 0xA5 0x5A */
  var b = [0];
  [0,0,1,0,0,1,0,0,0,1,1].forEach(function(x){ b.push(x); });
  b.push(0, 0, 0, 0, 0, 1, 0);
  b = b.concat(bitsOfBytes(String.fromCharCode(0xA5, 0x5A)));
  var crc = refCrc15(b);
  var r = run({id:0x123, data:[0xA5, 0x5A]});
  assert.strictEqual(r.frames.length, 1);
  assert.ok(labels(r.frames[0]).indexOf('CRC ' + H.hex(crc, 4)) >= 0, 'erwartet CRC ' + H.hex(crc, 4) + ' in ' + labels(r.frames[0]).join('|'));
  assert.strictEqual(checkOf(r.frames[0].checks, 'CRC-15').st, 'ok');
});

/* ---------- Gutfälle ---------- */
['diff', 'canh', 'canl'].forEach(function(sig){
  [125000, 500000].forEach(function(baud){
    test('Standard-ID, 8 Byte, ' + sig + ', ' + baud + ' Bit/s', function(){
      var data = [0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88];
      var r = run({id:0x123, data:data, baud:baud, signal:sig}, {signal:sig});
      assert.strictEqual(r.ok, true); assert.strictEqual(r.error, null);
      assert.strictEqual(r.info.bitrate, baud);
      assert.strictEqual(r.frames.length, 1);
      var f = r.frames[0];
      assert.strictEqual(f.title, 'ID 0x123'); assert.strictEqual(f.id, 0x123); assert.strictEqual(f.ext, false);
      assert.deepStrictEqual(f.data, data);
      assert.strictEqual(f.status, 'ok');
      assert.strictEqual(f.text, '8 Byte: ' + hexs(data).join(' '));
      var l = labels(f);
      ['SOF', 'ID 0x123', 'RTR', 'DLC 8', 'D0 0x11', 'D7 0x88', 'ACK', 'EOF'].forEach(function(x){ assert.ok(l.indexOf(x) >= 0, x + ' fehlt: ' + l.join('|')); });
      assert.ok(l.some(function(x){ return /^CRC 0x[0-9A-F]{4}$/.test(x); }));
      assert.strictEqual(H.worst(f.checks), 'ok');
      ['CRC-15', 'Bit-Stuffing', 'ACK', 'Format', 'Bitrate'].forEach(function(n){ assert.ok(checkOf(f.checks, n), n + ' fehlt'); });
      assert.strictEqual(checkOf(r.checks, 'Abtastung').st, 'ok');
      assert.strictEqual(checkOf(r.checks, 'Pegel dominant').st, 'ok');
      assert.strictEqual(checkOf(r.checks, 'Pegel rezessiv').st, 'ok');
      f.fields.forEach(function(x){ assert.ok(x.t1 > x.t0 && x.label.length <= 12 && !x.bad, x.label); });
      assert.ok(f.t0 > 0 && f.t1 > f.t0);
    });
  });
});

test('Extended-ID (29 Bit), 8 Byte, mit Feldern ID-A/ID-B', function(){
  var r = run({id:0x18FEF100, ext:true, data:[1, 2, 3, 4, 5, 6, 7, 8], baud:250000});
  assert.strictEqual(r.frames.length, 1);
  var f = r.frames[0];
  assert.strictEqual(f.ext, true); assert.strictEqual(f.id, 0x18FEF100); assert.strictEqual(f.title, 'ID 0x18FEF100');
  assert.deepStrictEqual(f.data, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.strictEqual(f.status, 'ok');
  var l = labels(f);
  assert.ok(l.indexOf('ID-A 0x63F') >= 0 && l.indexOf('ID-B 0x2F100') >= 0 && l.indexOf('SRR/IDE') >= 0, l.join('|'));
  f.fields.forEach(function(x){ assert.ok(x.label.length <= 12, x.label); });
});

test('Datenlängen 0…8 Byte (Standard und Extended)', function(){
  for(var n = 0; n <= 8; n++){
    var data = [];
    for(var i = 0; i < n; i++) data.push((0x40 + i * 17) & 255);
    [false, true].forEach(function(ext){
      var r = run({id:ext ? 0x1ABCDE : 0x2A5, ext:ext, data:data});
      assert.strictEqual(r.frames.length, 1, 'n=' + n);
      assert.deepStrictEqual(r.frames[0].data, data);
      assert.strictEqual(r.frames[0].dlc, n);
      assert.strictEqual(r.frames[0].status, 'ok');
    });
  }
});

test('Remote-Frame (RTR): kein Datenfeld, DLC bleibt sichtbar', function(){
  var r = run({id:0x321, rtr:true, dlc:4, data:[]});
  assert.strictEqual(r.frames.length, 1);
  var f = r.frames[0];
  assert.strictEqual(f.rtr, true); assert.deepStrictEqual(f.data, []); assert.strictEqual(f.title, 'ID 0x321 RTR');
  assert.ok(labels(f).indexOf('DLC 4') >= 0);
  assert.ok(!labels(f).some(function(x){ return /^D\d/.test(x); }));
  assert.strictEqual(f.status, 'ok');
});

test('DLC > 8 bei klassischem CAN = 8 Byte (Info-Check, kein Fehler)', function(){
  var r = run({id:0x100, dlc:12, data:[1, 2, 3, 4, 5, 6, 7, 8]});
  var f = r.frames[0];
  assert.strictEqual(f.data.length, 8); assert.strictEqual(f.dlc, 12);
  assert.strictEqual(f.status, 'ok');
  assert.strictEqual(checkOf(f.checks, 'DLC').st, 'info');
});

test('mehrere Frames hintereinander (Standard-Pause 3 Bit und knappe Pause 2 Bit)', function(){
  [3, 2].forEach(function(gap){
    var s = synthCAN({frames:[{id:0x100, data:[1]}, {id:0x7FF, data:[0xFF, 0xFF]}, {id:0x000, data:[0, 0, 0]}, {id:0x1ABCDEF, ext:true, data:[9, 8, 7]}], gap:gap});
    var r = decodeCAN(s.values, s.dt, {}, H);
    assert.strictEqual(r.frames.length, 4, 'gap=' + gap);
    assert.deepStrictEqual(r.frames.map(function(f){ return f.id; }), [0x100, 0x7FF, 0x000, 0x1ABCDEF]);
    r.frames.forEach(function(f, i){
      assert.strictEqual(f.status, 'ok', 'Frame ' + i);
      assert.ok(Math.abs(f.t0 - s.meta.frames[i].t0) < 0.5 * s.meta.bitTime, 'Zeitstempel Frame ' + i);
      if(i) assert.ok(f.t0 >= r.frames[i - 1].t1);
    });
  });
});

/* ---------- Fehlerfälle ---------- */
test('CRC-Fehler wird erkannt, Daten werden trotzdem angezeigt, Folgeframe bleibt lesbar', function(){
  var r = run({frames:[{id:0x123, data:[1, 2, 3, 4], corruptCrc:true}, {id:0x124, data:[5]}]});
  assert.strictEqual(r.frames.length, 2);
  var f = r.frames[0], c = checkOf(f.checks, 'CRC-15');
  assert.strictEqual(c.st, 'bad'); assert.strictEqual(f.status, 'bad');
  assert.ok(/empfangen 0x[0-9A-F]{4}, berechnet 0x[0-9A-F]{4}/.test(c.val));
  assert.ok(c.hint.length > 20);
  assert.ok(f.fields.some(function(x){ return x.kind === 'crc' && x.bad; }));
  assert.deepStrictEqual(f.data, [1, 2, 3, 4]);
  assert.strictEqual(r.frames[1].status, 'ok');
  assert.strictEqual(checkOf(r.checks, 'Frames').st, 'bad');
});

test('ACK fehlt: Check bad mit Werkstatt-Hinweis', function(){
  var r = run({id:0x555, data:[1, 2], ack:false});
  var f = r.frames[0], c = checkOf(f.checks, 'ACK');
  assert.strictEqual(c.st, 'bad'); assert.strictEqual(f.status, 'bad');
  assert.ok(/bestätigt/.test(c.hint) && /Teilnehmer/.test(c.hint) && /Leitung/.test(c.hint));
  assert.ok(f.fields.some(function(x){ return x.kind === 'ack' && x.bad; }));
  assert.strictEqual(checkOf(f.checks, 'CRC-15').st, 'ok');
  assert.deepStrictEqual(f.data, [1, 2]);
});

test('Stuff-Fehler (6 gleiche rezessive Bits): Frame kind err, Folgeframe wird wieder gefunden', function(){
  var r = run({frames:[{id:0x7FF, data:[1, 2], stuffViolation:true}, {id:0x321, data:[7]}]});
  assert.strictEqual(r.frames.length, 2);
  var f = r.frames[0];
  assert.strictEqual(f.kind, 'err'); assert.strictEqual(f.status, 'bad'); assert.strictEqual(f.title, 'Stuff-Fehler');
  assert.ok(f.fields.some(function(x){ return x.kind === 'err' && x.bad; }));
  assert.strictEqual(checkOf(f.checks, 'Bit-Stuffing').st, 'bad');
  assert.strictEqual(r.frames[1].id, 0x321); assert.strictEqual(r.frames[1].status, 'ok');
});

test('Stuff-Verletzung mit 6 dominanten Bits = Error-Frame (kind err)', function(){
  var r = run({frames:[{id:0x000, data:[1], stuffViolation:true}, {id:0x222, data:[3]}]});
  assert.strictEqual(r.frames.length, 2);
  assert.strictEqual(r.frames[0].kind, 'err'); assert.strictEqual(r.frames[0].title, 'Error-Frame');
  assert.strictEqual(r.frames[1].id, 0x222);
});

test('echter Error-Frame mitten im Frame (Abbruch + 6 dominante Bits + Delimiter)', function(){
  var r = run({frames:[{id:0x123, data:[1, 2, 3, 4, 5, 6, 7, 8], errorAt:45}, {id:0x456, data:[9, 9]}]});
  assert.strictEqual(r.frames.length, 2);
  var f = r.frames[0];
  assert.strictEqual(f.kind, 'err'); assert.strictEqual(f.status, 'bad');
  assert.strictEqual(f.title, 'Error-Frame');
  assert.ok(/dominante Bits/.test(f.text));
  assert.ok(f.fields.some(function(x){ return x.kind === 'err'; }));
  assert.strictEqual(r.frames[1].id, 0x456); assert.strictEqual(r.frames[1].status, 'ok');
});

test('CAN FD (FDF rezessiv): erkannt, Warnung, nicht falsch dekodiert; Folgeframe klassisch lesbar', function(){
  var r = run({frames:[{id:0x321, fd:true, data:[1, 2, 3, 4]}, {id:0x100, data:[0xAA]}]}, {baud:500000});
  assert.strictEqual(r.frames.length, 2);
  var f = r.frames[0];
  assert.strictEqual(f.kind, 'fd'); assert.strictEqual(f.status, 'warn');
  assert.deepStrictEqual(f.data, []);
  var c = checkOf(f.checks, 'CAN FD');
  assert.strictEqual(c.val, 'CAN FD – Datenphase wird nicht dekodiert');
  assert.strictEqual(f.id, 0x321);
  assert.ok(!checkOf(f.checks, 'CRC-15'));
  assert.strictEqual(r.frames[1].id, 0x100); assert.strictEqual(r.frames[1].status, 'ok');
  assert.ok(f.t1 <= r.frames[1].t0);
});

/* ---------- Aufnahmegrenzen ---------- */
test('Aufnahme beginnt mitten im Frame: Anfang bis zum ersten Idle wird übersprungen, nichts geraten', function(){
  var s = synthCAN({frames:[{id:0x111, data:[1, 2, 3, 4]}, {id:0x222, data:[5, 6]}], idleBefore:14, trimStart:30});
  var r = decodeCAN(s.values, s.dt, {}, H);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.frames.length, 1);
  assert.strictEqual(r.frames[0].id, 0x222); assert.strictEqual(r.frames[0].status, 'ok');
  var c = checkOf(r.checks, 'Aufnahmestart');
  assert.ok(c && c.st === 'info' && /mitten im Frame/.test(c.val));
});
test('Start mitten im Frame bei jedem Bit-Offset: nie falsche Frames mit gutem Status', function(){
  var frames = [{id:0x1F0, data:[0x55, 0xAA, 0x0F]}, {id:0x2A0, data:[1]}];
  for(var cut = 1; cut < 90; cut += 3){
    var s = synthCAN({frames:frames, idleBefore:1, trimStart:cut, noise:0.03});
    var r = decodeCAN(s.values, s.dt, {baud:500000}, H);
    r.frames.forEach(function(f){
      if(f.status === 'ok') assert.ok(f.id === 0x1F0 || f.id === 0x2A0, 'cut ' + cut + ' falscher ID ' + f.id);
    });
    /* Frame 1 hat 73 Bit ab Bit 1, SOF von Frame 2 liegt bei Bit 77. Ab Schnitt 67 sind weniger als 7 rezessive Bits
       vor dem zweiten SOF sichtbar – dann darf (und soll) nichts geraten werden. Davor muss Frame 2 gefunden werden. */
    if(cut <= 66) assert.ok(r.frames.some(function(f){ return f.id === 0x2A0 && f.status === 'ok'; }), 'cut ' + cut + ': zweiter Frame fehlt');
  }
});
test('Aufnahme endet mitten im Frame: letzter Frame wird nicht ausgewertet, Hinweis', function(){
  var r = run({frames:[{id:0x100, data:[1]}, {id:0x200, data:[2, 3, 4, 5]}], trimEnd:60});
  assert.strictEqual(r.frames.length, 1); assert.strictEqual(r.frames[0].id, 0x100);
  var c = checkOf(r.checks, 'Aufnahmeende');
  assert.ok(c && c.st === 'info');
});
test('Aufnahme endet im EOF: Frame bleibt erhalten (CRC/ACK sind geprüft), Info-Hinweis', function(){
  var s = synthCAN({id:0x100, data:[1], idleAfter:0, trimEnd:4});
  var r = decodeCAN(s.values, s.dt, {baud:500000}, H);
  assert.strictEqual(r.frames.length, 1);
  assert.ok(checkOf(r.frames[0].checks, 'Format').val.indexOf('abgeschnitten') >= 0);
  assert.strictEqual(r.frames[0].status, 'ok');
});

/* ---------- Bitrate ---------- */
test('Auto-Bitrate rastet auf Normraten ein (33,3 k … 1 M) mit Unsicherheit', function(){
  [33333.3333, 50000, 83333.3333, 100000, 125000, 250000, 500000, 1000000].forEach(function(b){
    var r = run({id:0x321, data:[1, 2, 3, 4, 5, 6, 7, 8], baud:b, spb:12});
    assert.strictEqual(r.ok, true, 'baud ' + b);
    assert.ok(Math.abs(r.info.bitrate - b) < 1, 'baud ' + b + ' erkannt ' + r.info.bitrate);
    assert.strictEqual(r.frames.length, 1);
    var c = checkOf(r.checks, 'Bitrate');
    assert.strictEqual(c.st, 'ok');
    assert.ok(/±/.test(c.val) && /automatisch/.test(c.val), c.val);
  });
});
test('Auto-Bitrate: Taktabweichung des Senders (+1 %) wird gemeldet und trotzdem dekodiert', function(){
  var r = run({id:0x321, data:[1, 2, 3, 4, 5, 6, 7, 8], baud:500000, clockErr:0.01, spb:20});
  assert.strictEqual(r.info.bitrate, 500000);
  assert.strictEqual(r.frames.length, 1);
  /* längere Bitzeit des Senders = niedrigere Rate: −1 % gegenüber Nennwert, noch innerhalb der ISO-Toleranz (1,58 %) */
  assert.ok(/Abweichung −(0,9|1,0|1,1) %/.test(checkOf(r.checks, 'Bitrate').val), checkOf(r.checks, 'Bitrate').val);
  assert.strictEqual(checkOf(r.checks, 'Bitrate').st, 'ok');
});
test('ungewöhnliche Bitrate (400 kBit/s): gemessene Rate, Warnung', function(){
  var r = run({id:0x321, data:[1, 2, 3, 4], baud:400000, spb:15});
  assert.ok(Math.abs(r.info.bitrate / 400000 - 1) < 0.02, '' + r.info.bitrate);
  assert.strictEqual(checkOf(r.checks, 'Bitrate').st, 'warn');
});
test('feste Bitrate falsch eingestellt: Warnung, kein Schein-Ergebnis mit gutem Status', function(){
  var r = run({id:0x321, data:[1, 2, 3, 4], baud:500000, spb:10}, {baud:250000});
  assert.strictEqual(checkOf(r.checks, 'Bitrate').st, 'warn');
  r.frames.forEach(function(f){ assert.notStrictEqual(f.status, 'ok'); });
});
test('Resync: Sender-Takt +1,2 % und −1,2 % über langen Frame (Extended, 8 Byte, feste Rate)', function(){
  [0.012, -0.012].forEach(function(ce){
    var r = run({id:0x1FFFFFFF - 0x0F0F0F, ext:true, data:[0, 255, 0, 255, 0x0F, 0xF0, 0x55, 0xAA], baud:500000, clockErr:ce, spb:16}, {baud:500000});
    assert.strictEqual(r.frames.length, 1, 'clockErr ' + ce);
    assert.strictEqual(r.frames[0].status, 'ok', 'clockErr ' + ce + ' ' + JSON.stringify(r.frames[0].checks.filter(function(c){ return c.st !== 'ok'; })));
    assert.strictEqual(checkOf(r.frames[0].checks, 'Bitrate').st, 'ok');
  });
});
test('Frame-Check Bitrate: Sender +3 % → Warnung (außerhalb ISO-Toleranz)', function(){
  var r = run({id:0x321, data:[1, 2, 3, 4, 5, 6, 7, 8], baud:500000, clockErr:0.03, spb:20}, {baud:500000});
  assert.strictEqual(r.frames.length, 1);
  assert.notStrictEqual(checkOf(r.frames[0].checks, 'Bitrate').st, 'ok');
});

test('zu wenig Punkte pro Bit: klarer Fehlertext mit empfohlener Zeitbasis', function(){
  [2, 3, 1.5].forEach(function(spb){
    var r = run({id:0x123, data:[1, 2], spb:spb});
    assert.strictEqual(r.ok, false, 'spb ' + spb);
    assert.ok(/Zu wenig Punkte pro Bit/.test(r.error), r.error);
    assert.ok(/Zeitbasis höchstens .*µs\/div/.test(r.error), r.error);
    assert.deepStrictEqual(r.frames, []);
  });
  var r2 = run({id:0x123, data:[1, 2], spb:3, baud:500000}, {baud:500000});
  assert.strictEqual(r2.ok, false);
  assert.ok(/125 µs\/div/.test(r2.error), r2.error);
  assert.strictEqual(checkOf(r2.checks, 'Abtastung').st, 'bad');
});
test('wenige Punkte pro Bit (6): dekodiert, Abtastung als Warnung', function(){
  var r = run({id:0x123, data:[1, 2, 3], spb:6, noise:0.02});
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.frames.length, 1);
  assert.strictEqual(r.frames[0].status, 'ok');
  assert.strictEqual(checkOf(r.checks, 'Abtastung').st, 'warn');
});

/* ---------- Pegel ---------- */
test('Pegelprüfung differenziell nach ISO 11898-2', function(){
  assert.strictEqual(checkOf(run({vdom:1.2, id:1}).checks, 'Pegel dominant').st, 'warn');
  assert.strictEqual(checkOf(run({vdom:0.7, id:1}).checks, 'Pegel dominant').st, 'bad');
  assert.strictEqual(checkOf(run({vdom:3.4, id:1}).checks, 'Pegel dominant').st, 'warn');
  assert.strictEqual(checkOf(run({vrec:0.2, id:1}).checks, 'Pegel rezessiv').st, 'warn');
  assert.strictEqual(checkOf(run({vrec:0.8, id:1}).checks, 'Pegel rezessiv').st, 'bad');
  assert.strictEqual(checkOf(run({vrec:-0.3, id:1}).checks, 'Pegel rezessiv').st, 'ok');
});
test('Pegel Einzelleitung: nur Richtwert (höchstens warn), mit Hinweis "keine Normgrenze"', function(){
  var ok = run({id:1, signal:'canh'}, {signal:'canh'});
  assert.strictEqual(checkOf(ok.checks, 'Pegel dominant').st, 'ok');
  var off = run({id:1, signal:'canh', vdom:5.2, vrec:1.0}, {signal:'canh'});
  ['Pegel dominant', 'Pegel rezessiv'].forEach(function(n){
    var c = checkOf(off.checks, n);
    assert.strictEqual(c.st, 'warn');
    assert.ok(/keine Normgrenze/.test(c.hint) || /typisch/.test(c.hint));
  });
  var l = run({id:1, signal:'canl'}, {signal:'canl'});
  assert.strictEqual(checkOf(l.checks, 'Pegel dominant').st, 'ok');
  assert.strictEqual(checkOf(l.checks, 'Pegel rezessiv').st, 'ok');
});
test('falsche Signalart (canh-Signal als diff gelesen) liefert keine guten Frames', function(){
  var s = synthCAN({id:0x123, data:[1], signal:'canh'});
  var r = decodeCAN(s.values, s.dt, {signal:'diff'}, H);
  assert.strictEqual(checkOf(r.checks, 'Pegel rezessiv').st !== 'ok' || checkOf(r.checks, 'Pegel dominant').st !== 'ok', true);
});

/* ---------- Statische Leitung ---------- */
test('statische Leitung: dauerhaft dominant (Kurzschluss/Teilnehmer hängt)', function(){
  [['diff', 2.0], ['canh', 3.5], ['canl', 1.5]].forEach(function(p){
    var v = new Float32Array(5000); for(var i = 0; i < v.length; i++) v[i] = p[1] + 0.002 * Math.sin(i);
    var r = decodeCAN(v, 2e-7, {signal:p[0]}, H);
    assert.strictEqual(r.ok, true); assert.strictEqual(r.error, null); assert.deepStrictEqual(r.frames, []);
    var c = checkOf(r.checks, 'Busstatus');
    assert.strictEqual(c.st, 'bad'); assert.ok(/dominant/.test(c.val) && /Kurzschluss/.test(c.hint), c.val);
  });
});
test('statische Leitung: dauerhaft rezessiv (kein Verkehr / Bus schläft)', function(){
  [['diff', 0.0], ['canh', 2.5], ['canl', 2.5]].forEach(function(p){
    var v = new Float32Array(5000); for(var i = 0; i < v.length; i++) v[i] = p[1] + 0.003 * Math.cos(i);
    var r = decodeCAN(v, 2e-7, {signal:p[0]}, H);
    assert.strictEqual(r.ok, true); assert.deepStrictEqual(r.frames, []);
    var c = checkOf(r.checks, 'Busstatus');
    assert.strictEqual(c.st, 'warn'); assert.ok(/rezessiv/.test(c.val) && /schläft/.test(c.hint), c.val);
  });
});
test('statische Leitung nur mit Rauschen: keine Schein-Frames', function(){
  var s = synthCAN({id:1}); var v = new Float32Array(5000), seed = 3;
  for(var i = 0; i < v.length; i++){ seed = (seed * 16807) % 2147483647; v[i] = ((seed / 2147483647) - 0.5) * 0.5; }
  var r = decodeCAN(v, s.dt, {}, H);
  assert.strictEqual(r.ok, true); assert.deepStrictEqual(r.frames, []);
  assert.ok(checkOf(r.checks, 'Busstatus'));
});
test('Pegel passt zu keinem CAN-Zustand: Warnung statt Behauptung', function(){
  var v = new Float32Array(2000); for(var i = 0; i < v.length; i++) v[i] = 0.7;
  var c = checkOf(decodeCAN(v, 1e-6, {signal:'diff'}, H).checks, 'Busstatus');
  assert.strictEqual(c.st, 'warn'); assert.ok(/passt nicht/.test(c.val));
  var v2 = new Float32Array(2000);
  var c2 = checkOf(decodeCAN(v2, 1e-6, {signal:'canh'}, H).checks, 'Busstatus');
  assert.strictEqual(c2.st, 'warn');
});

/* ---------- Robustheit ---------- */
test('Rauschen (150 mV effektiv bei 2 V Hub): Frames bleiben korrekt', function(){
  for(var sd = 1; sd <= 5; sd++){
    var r = run({frames:[{id:0x123, data:[1, 2, 3, 4, 5, 6, 7, 8]}, {id:0x1ABCDEF, ext:true, data:[0xDE, 0xAD]}], noise:0.15, seed:sd, spb:12});
    assert.strictEqual(r.frames.length, 2, 'seed ' + sd);
    r.frames.forEach(function(f){ assert.strictEqual(f.status, 'ok', 'seed ' + sd + ' ' + f.title); });
  }
});
test('Einzelleitung mit Rauschen (canl, 100 mV)', function(){
  var r = run({id:0x3C0, data:[1, 2, 3], signal:'canl', noise:0.1, baud:125000}, {signal:'canl'});
  assert.strictEqual(r.frames.length, 1); assert.strictEqual(r.frames[0].status, 'ok');
});
test('Samples als normales Array und Float32Array liefern gleiches Ergebnis', function(){
  var s = synthCAN({id:0x123, data:[1, 2, 3]});
  var a = decodeCAN(Array.prototype.slice.call(s.values), s.dt, {}, H), b = decodeCAN(s.values, s.dt, {}, H);
  assert.deepStrictEqual(a.frames.map(function(f){ return f.id; }), b.frames.map(function(f){ return f.id; }));
  assert.strictEqual(a.frames.length, 1);
});
test('Eingabe unbrauchbar: leer, NaN, dt ≤ 0 → ok:false mit Text, kein Absturz', function(){
  var bad = [decodeCAN([], 1e-6, {}, H), decodeCAN(null, 1e-6, {}, H), decodeCAN([0, NaN, 1], 1e-6, {}, H), decodeCAN([0, 1, 0, 1], 0, {}, H)];
  bad.forEach(function(r){ assert.strictEqual(r.ok, false); assert.ok(typeof r.error === 'string' && r.error.length > 5); assert.deepStrictEqual(r.frames, []); });
});
test('zu wenige Flanken für Auto-Bitrate: Fehlertext, mit fester Bitrate trotzdem sauberes Ergebnis', function(){
  var v = new Float32Array(130);
  for(var i = 100; i < 110; i++) v[i] = 2;
  var r = decodeCAN(v, 2e-7, {}, H);
  assert.strictEqual(r.ok, false); assert.ok(/Bitrate/.test(r.error)); assert.deepStrictEqual(r.frames, []);
  var r2 = decodeCAN(v, 2e-7, {baud:500000}, H);
  assert.strictEqual(r2.ok, true); assert.deepStrictEqual(r2.frames, []);
  assert.strictEqual(r2.info.bitrate, 500000);
});
test('kein Verkehr-Frame, aber Flanken (kein Idle): Warnung "keine vollständigen Frames"', function(){
  var v = new Float32Array(1000); for(var i = 0; i < v.length; i++) v[i] = ((i / 10) | 0) % 2 ? 2 : 0;
  var r = decodeCAN(v, 2e-7, {baud:500000}, H);
  assert.strictEqual(r.ok, true); assert.deepStrictEqual(r.frames, []);
  assert.strictEqual(checkOf(r.checks, 'Frames').st, 'warn');
});
test('Ergebnisformat: Pflichtfelder, status = worst(checks), Zeiten monoton', function(){
  var r = run({frames:[{id:0x10, data:[1]}, {id:0x11, data:[2], ack:false}, {id:0x12, data:[3], corruptCrc:true}]});
  assert.strictEqual(r.bus, 'can');
  assert.ok(r.info && 'bitrate' in r.info && 'bitTime' in r.info && 'samplesPerBit' in r.info);
  r.frames.forEach(function(f){
    assert.strictEqual(f.status, H.worst(f.checks));
    assert.ok(f.t1 > f.t0); assert.ok(typeof f.title === 'string' && typeof f.text === 'string' && Array.isArray(f.data));
    for(var i = 0; i < f.fields.length; i++){
      var x = f.fields[i];
      assert.ok(['start', 'sync', 'id', 'ctrl', 'data', 'crc', 'ack', 'end', 'err'].indexOf(x.kind) >= 0);
      assert.ok(x.t1 >= x.t0 && x.t0 >= f.t0 - 1e-12 && x.t1 <= f.t1 + 1e-12);
      assert.strictEqual(typeof x.bad, 'boolean');
      if(i) assert.ok(x.t0 >= f.fields[i - 1].t0);
    }
  });
});
test('unbekannte Bitrate bleibt null und ist nie 0 (statische/zu kurze Aufnahme)', function(){
  var r = decodeCAN([0, 2, 0, 2, 0], 1e-6, {}, H);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.info.bitrate, null); assert.strictEqual(r.info.bitTime, null); assert.strictEqual(r.info.samplesPerBit, null);
  assert.ok(r.checks.length > 0);
});

/* ---------- Performance ---------- */
test('Performance: 5000 Samples < 20 ms, 262144 Samples < 500 ms', function(){
  var s = synthCAN({frames:[{id:0x123, data:[1, 2, 3, 4, 5, 6, 7, 8]}, {id:0x7E8, data:[3, 2, 1]}, {id:0x1ABCDEF, ext:true, data:[1, 2, 3, 4]}], baud:500000, samples:5000, spb:5, idleAfter:20});
  var r = decodeCAN(s.values, s.dt, {}, H), t0 = process.hrtime.bigint(), reps = 20;
  for(var i = 0; i < reps; i++) r = decodeCAN(s.values, s.dt, {}, H);
  var ms = Number(process.hrtime.bigint() - t0) / 1e6 / reps;
  assert.ok(r.frames.length >= 2, 'Frames: ' + r.frames.length);
  assert.ok(ms < 20, '5000 Samples: ' + ms.toFixed(2) + ' ms');
  var list = []; for(i = 0; i < 220; i++) list.push({id:(0x100 + i) & 0x7FF, data:[i & 255, (i * 7) & 255, 0x55, 0xAA, 1, 2, 3, 4]});
  var big = synthCAN({frames:list, samples:262144, spb:10, noise:0.05});
  t0 = process.hrtime.bigint();
  var rb = decodeCAN(big.values, big.dt, {}, H);
  ms = Number(process.hrtime.bigint() - t0) / 1e6;
  assert.ok(rb.frames.length > 150, 'große Aufnahme: ' + rb.frames.length + ' Frames');
  assert.ok(ms < 500, '262144 Samples: ' + ms.toFixed(1) + ' ms');
});

/* ---------- Synthese ---------- */
test('synthCAN: deterministisch, endliche Flanken, Idle davor/danach', function(){
  var a = synthCAN({id:0x123, data:[1, 2]}), b = synthCAN({id:0x123, data:[1, 2]});
  assert.deepStrictEqual(Array.prototype.slice.call(a.values), Array.prototype.slice.call(b.values));
  assert.ok(a.values instanceof Float32Array && a.dt > 0);
  var min = Infinity, max = -Infinity, mid = 0;
  for(var i = 0; i < a.values.length; i++){ min = Math.min(min, a.values[i]); max = Math.max(max, a.values[i]); if(Math.abs(a.values[i] - 1) < 0.4) mid++; }
  assert.ok(max > 1.9 && min < 0.1 && mid > 0, 'Flanken sind nicht sprunghaft');
  for(i = 0; i < 100; i++) assert.ok(Math.abs(a.values[i]) < 0.2, 'Idle davor');
  for(i = a.values.length - 100; i < a.values.length; i++) assert.ok(Math.abs(a.values[i]) < 0.2, 'Idle danach');
});

/* ---------- weitere Formfehler, Rauschen, Robustheit ---------- */
test('Formfehler: CRC-Trennzeichen dominant → Format bad, Frame kind err, Folgeframe lesbar', function(){
  var r = run({frames:[{id:0x123, data:[1, 2], formError:'crcDel'}, {id:0x124, data:[3]}]});
  assert.strictEqual(r.frames.length, 2);
  var f = r.frames[0];
  assert.strictEqual(f.kind, 'err'); assert.strictEqual(f.status, 'bad');
  var c = checkOf(f.checks, 'Format');
  assert.strictEqual(c.st, 'bad'); assert.ok(/CRC-Trennzeichen/.test(c.val) && /Formfehler/.test(c.hint));
  assert.ok(f.fields.some(function(x){ return x.kind === 'err' && x.label === 'CRC-Del'; }));
  assert.deepStrictEqual(f.data, [1, 2]);
  assert.strictEqual(r.frames[1].id, 0x124); assert.strictEqual(r.frames[1].status, 'ok');
});
test('Formfehler: ACK-Trennzeichen dominant und EOF-Bit 3 dominant', function(){
  var r = run({frames:[{id:0x123, data:[1], formError:'ackDel'}, {id:0x124, data:[3], formError:'eof3'}, {id:0x125, data:[4]}], gap:12});   /* gap 12: nach dem Fehler folgt realistisch ein Error-Frame samt Delimiter, hier nur Ruhe */
  assert.strictEqual(r.frames.length, 3);
  assert.ok(/ACK-Trennzeichen/.test(checkOf(r.frames[0].checks, 'Format').val));
  assert.strictEqual(r.frames[0].status, 'bad');
  assert.ok(/EOF: Bit 3 von 7/.test(checkOf(r.frames[1].checks, 'Format').val));
  assert.strictEqual(r.frames[1].status, 'bad');
  assert.strictEqual(r.frames[2].id, 0x125); assert.strictEqual(r.frames[2].status, 'ok');
});
test('letztes EOF-Bit dominant = Overload-Hinweis (warn), kein Fehler', function(){
  var r = run({frames:[{id:0x123, data:[1], formError:'eof7'}, {id:0x124, data:[3]}], gap:14});
  assert.strictEqual(r.frames.length, 2);
  assert.strictEqual(checkOf(r.frames[0].checks, 'Format').st, 'warn');
  assert.strictEqual(r.frames[0].status, 'warn');
});
test('statische Leitung mit Gauß-Rauschen (σ 0,15 V und 0,3 V): keine Schein-Frames', function(){
  [0.15, 0.3].forEach(function(sd){
    var seed = 11, v = new Float32Array(5000);
    function u(){ seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for(var i = 0; i < v.length; i++) v[i] = sd * Math.sqrt(-2 * Math.log(u() || 1e-9)) * Math.cos(2 * Math.PI * u());
    var r = decodeCAN(v, 2e-7, {}, H);
    assert.strictEqual(r.ok, true); assert.deepStrictEqual(r.frames, []);
    assert.strictEqual(checkOf(r.checks, 'Busstatus').st, 'warn');
  });
});
test('Zufallssignale: kein Absturz, endet zügig, Frames haben nie Status ok ohne gültige CRC', function(){
  var seed = 5;
  function u(){ seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  for(var t = 0; t < 60; t++){
    var n = 200 + Math.floor(u() * 4800), v = new Float32Array(n), run = 1 + Math.floor(u() * 30), lvl = 0, c = 0;
    for(var i = 0; i < n; i++){
      if(--c <= 0){ lvl = u() < 0.5 ? 0 : 2; c = 1 + Math.floor(u() * run); }
      v[i] = lvl + (u() - 0.5) * 0.2;
    }
    var r = decodeCAN(v, 2e-7, {baud:t % 2 ? 500000 : 0, signal:['diff', 'canh', 'canl'][t % 3]}, H);
    assert.ok(typeof r.ok === 'boolean' && Array.isArray(r.frames));
    r.frames.forEach(function(f){
      assert.strictEqual(f.status, H.worst(f.checks));
      if(f.status === 'ok') assert.strictEqual(checkOf(f.checks, 'CRC-15').st, 'ok');
    });
  }
});
test('Zufalls-Sweep: 150 zufällige Frames/Signalarten/Bitraten/Takttoleranzen werden fehlerfrei gelesen', function(){
  var seed = 99;
  function rnd(){ seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  var rates = [33333.3333, 50000, 83333.3333, 100000, 125000, 250000, 500000, 1000000], sigs = ['diff', 'canh', 'canl'];
  for(var i = 0; i < 150; i++){
    var ext = rnd() < 0.4, len = Math.floor(rnd() * 9), data = [], k;
    for(k = 0; k < len; k++) data.push(Math.floor(rnd() * 256));
    var id = ext ? Math.floor(rnd() * 0x20000000) : Math.floor(rnd() * 0x800);
    var o = {id:id, ext:ext, data:data, baud:rates[Math.floor(rnd() * 8)], signal:sigs[Math.floor(rnd() * 3)], spb:8 + rnd() * 12,
             noise:rnd() * 0.12, phase:rnd(), clockErr:(rnd() - 0.5) * 0.02, seed:i + 1};
    var s = synthCAN(o), auto = rnd() < 0.5;
    var r = decodeCAN(s.values, s.dt, {signal:o.signal, baud:auto ? 0 : o.baud}, H);
    var info = JSON.stringify({i:i, id:id, ext:ext, baud:o.baud, sig:o.signal, spb:o.spb, noise:o.noise, ce:o.clockErr, auto:auto});
    assert.strictEqual(r.ok, true, info); assert.strictEqual(r.frames.length, 1, info);
    assert.strictEqual(r.frames[0].id, id, info); assert.strictEqual(r.frames[0].status, 'ok', info);
    assert.deepStrictEqual(r.frames[0].data, data, info);
  }
});
test('ES5-Stil: keine Pfeilfunktionen, let/const, Template-Strings oder class im Modul', function(){
  var src = require('./source.js').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/=>/.test(src), 'Pfeilfunktion'); assert.ok(!/\b(let|const|class)\s/.test(src), 'let/const/class');
  assert.ok(!/`/.test(src), 'Template-String'); assert.ok(!/\brequire\s*\(/.test(src), 'require');
});
