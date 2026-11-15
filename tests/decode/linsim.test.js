'use strict';
/* Bauteil-Simulator (LIN) und Bit-Monitor – gegen den ausgelieferten Block oszi-decode */
const test = require('node:test');
const assert = require('node:assert');
const D = require('../load-inline.cjs')('oszi-decode');
const S = D.linsim;

function decodeSim(profile, vals, fault){
  const s = D.synth('lin', {sim:{profile, vals, fault}});
  return D.decode('lin', s.values, s.dt, {vbat:12.6, expect:S.expect(S.profile(profile))});
}
function has(r, name, st){ return r.checks.concat(...r.frames.map(f => f.checks)).some(c => c.name === name && c.st === st); }

test('jedes Profil: Frames dekodieren fehlerfrei und tragen die Bedienelemente', () => {
  S.profiles.forEach(p => {
    const vals = S.defaults(p), r = decodeSim(p.id, vals, '');
    assert.strictEqual(r.ok, true, p.id);
    assert.strictEqual(r.frames.length, p.frames.length * 2, p.id);
    r.frames.forEach(f => assert.strictEqual(f.status, 'ok', p.id + ' ' + f.title));
    const expectFirst = S.frames(p, vals, 1).map(f => f.data.join());
    assert.deepStrictEqual(r.frames.slice(0, p.frames.length).map(f => f.data.join()), expectFirst);
  });
});

test('Fehler des Simulators werden vom Decoder erkannt', () => {
  const v = S.defaults(S.profile('klima'));
  assert.ok(has(decodeSim('klima', v, 'noresp'), 'Antwort', 'bad'));
  assert.ok(has(decodeSim('klima', v, 'cs'), 'Checksumme', 'bad'));
  assert.ok(has(decodeSim('klima', v, 'drift'), 'Takt der Antwort', 'bad'));
  assert.ok(has(decodeSim('klima', v, 'masse'), 'Pegelvergleich', 'warn'));
  assert.ok(has(decodeSim('klima', v, 'pullup'), 'Ruhepegel (rezessiv)', 'bad'));
  assert.ok(has(decodeSim('klima', v, 'kurzmasse'), 'Leitung dauerhaft dominant', 'bad'));
  assert.ok(has(decodeSim('klima', v, 'still'), 'Keine Kommunikation', 'bad'));
});

test('Labels: Tasten als Bits, Regler als Bytes, Master-LEDs', () => {
  const p = S.profile('klima');
  const l21 = S.labels(p, 0x21), l20 = S.labels(p, 0x20);
  assert.strictEqual(l21[0].bits[0], 'AUTO');
  assert.strictEqual(l21[1].name, 'TEMP');
  assert.match(l21[3].name, /Alive/);
  assert.strictEqual(l20[0].bits[0], 'AUTO-LED');
});

test('Bit-Monitor: Tastendruck kippt genau das Tastenbit, Alive-Zähler gilt als laufend', () => {
  const p = S.profile('klima'), vals = S.defaults(p), st = {};
  let r = decodeSim('klima', vals, '');
  D.bitMonitor(st, 'lin', r.frames);
  D.bitReference(st);
  vals.alive = 2; vals.auto = 1;
  r = decodeSim('klima', vals, '');
  const rows = D.bitMonitor(st, 'lin', r.frames);
  const row = rows.find(x => x.id === 0x21);
  assert.strictEqual(row.basis, 'ref');
  assert.strictEqual(row.bytes[0].changed & ~row.bytes[0].busy, 0x01);   /* nur AUTO */
  assert.strictEqual(row.bytes[3].busy & 0x0f, 0x0f, 'Alive-Zähler (Halbbyte) gilt als laufend');
  assert.strictEqual(row.bytes[3].changed & ~row.bytes[3].busy, 0);
  assert.strictEqual(row.bytes[1].changed, 0);                             /* Temperatur unverändert */
  const led = rows.find(x => x.id === 0x20);
  assert.strictEqual(led.bytes[0].changed, 0x01);                          /* Master übernimmt LED */
});

test('Bit-Monitor: ohne Referenz Vergleich mit voriger Aufnahme, fehlerhafte Frames werden ignoriert', () => {
  const p = S.profile('gen'), vals = S.defaults(p), st = {};
  D.bitMonitor(st, 'lin', decodeSim('gen', vals, '').frames);
  vals.mech = 1;
  let rows = D.bitMonitor(st, 'lin', decodeSim('gen', vals, '').frames);
  const row = rows.find(x => x.id === 0x2A);
  assert.strictEqual(row.basis, 'prev');
  assert.strictEqual(row.bytes[1].changed, 0x02);
  rows = D.bitMonitor(st, 'lin', decodeSim('gen', vals, 'cs').frames);
  assert.ok(!rows.some(x => x.id === 0x2A), 'Frame mit falscher Checksumme wird nicht verglichen');
});

test('Bit-Monitor: Bits, die vor der Referenz oft wechseln, gelten als laufend', () => {
  const st = {}, mk = v => [{title:'ID 0x10', id:0x10, status:'ok', data:[v, 0]}];
  for(let i = 0; i < 6; i++) D.bitMonitor(st, 'can', mk(i & 1 ? 0x80 : 0x00));
  D.bitReference(st);                                   /* beim Merken der Referenz gelernt */
  const rows = D.bitMonitor(st, 'can', mk(0x80));
  assert.ok(rows[0].bytes[0].busy & 0x80);
  assert.strictEqual(rows[0].bytes[1].busy, 0);
});

test('Bit-Monitor: Zähler im unteren Halbbyte, Signal im oberen bleibt sichtbar', () => {
  const st = {}, mk = (a, b) => [{title:'ID 0x10', id:0x10, status:'ok', data:[a]}, {title:'ID 0x10', id:0x10, status:'ok', data:[b]}];
  D.bitMonitor(st, 'can', mk(0x03, 0x04));
  D.bitReference(st);
  const rows = D.bitMonitor(st, 'can', mk(0x85, 0x86));
  const b0 = rows[0].bytes[0];
  assert.strictEqual(b0.busy & 0x0f, 0x0f);
  assert.strictEqual(b0.changed & ~b0.busy, 0x80);                         /* das Signalbit 7 */
});

test('Bit-Monitor: Taste mehrfach drücken und loslassen bleibt jedes Mal sichtbar', () => {
  const p = S.profile('klima'), vals = S.defaults(p), st = {};
  const cap = () => { const r = decodeSim('klima', vals, ''); vals.alive = (vals.alive + 2) & 15; return D.bitMonitor(st, 'lin', r.frames).find(x => x.id === 0x21).bytes; };
  cap(); cap(); D.bitReference(st);
  for(let i = 1; i <= 8; i++){
    vals.auto ^= 1;
    const b = cap();
    assert.strictEqual(b[0].changed & ~b[0].busy, vals.auto ? 0x01 : 0x00, 'Druck ' + i);
    assert.strictEqual(b[3].changed & ~b[3].busy, 0, 'Alive-Zähler bleibt ausgeblendet');
  }
});

test('Bit-Monitor: Wechsel innerhalb nur einer Aufnahme gilt noch nicht als laufend', () => {
  const st = {}, f = v => ({title:'ID 0x10', id:0x10, status:'ok', data:[v]});
  D.bitMonitor(st, 'can', [f(0x00)]); D.bitReference(st);
  let rows = D.bitMonitor(st, 'can', [f(0x00), f(0x40)]);          /* Taste genau während der Aufnahme gedrückt */
  assert.strictEqual(rows[0].bytes[0].busy, 0);
  assert.strictEqual(rows[0].bytes[0].changed, 0x40);
  rows = D.bitMonitor(st, 'can', [f(0x40), f(0x00)]);              /* passiert es wieder, ist es kein Zufall */
  assert.strictEqual(rows[0].bytes[0].busy, 0x40);
});

test('Bit-Monitor: SENT bildet eine Zeile, unbekannte Nibbles werden nicht verglichen', () => {
  const s = D.synth('sent'), r = D.decode('sent', s.values, s.dt, {});
  const rows = D.bitMonitor({}, 'sent', r.frames);
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].title, 'SENT-Botschaft');
  assert.strictEqual(D.bitMonitor({}, 'sent', [{title:'x', status:'ok', data:[1, null, 3]}]).length, 0);
});

test('CAN: Leitung wird bei „automatisch“ erkannt (CAN-H und CAN-L)', () => {
  const C = D.modules.can;
  for(const line of ['canh', 'canl']){
    const c = C.synthCAN({baud:500000, signal:line, spb:12, frames:[{id:0x316, data:[1, 2, 3]}, {id:0x123, data:[0xFF, 0x00]}]});
    const r = D.decode('can', c.values, c.dt, {signal:'auto'});
    assert.deepStrictEqual(r.frames.map(f => f.title + ':' + f.status), ['ID 0x316:ok', 'ID 0x123:ok'], line);
    assert.ok(r.checks.some(x => x.name === 'Leitung' && x.val === (line === 'canh' ? 'CAN-H erkannt' : 'CAN-L erkannt')));
  }
  const flat = D.decode('can', new Float32Array(2000).fill(2.5), 1e-6, {signal:'auto'});
  assert.strictEqual(flat.frames.length, 0);                        /* statische Leitung: keine erfundene Erkennung */
  assert.ok(!flat.checks.some(x => x.name === 'Leitung'));
});

