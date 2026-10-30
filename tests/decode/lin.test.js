'use strict';
const test = require('node:test');
const assert = require('node:assert');
const H = require('./common.js');
const L = require('./lin.js');

const FR = [
  {id:0x20, data:[0x01, 0x03], slave:false},
  {id:0x21, data:[0x3F, 0x2C, 0x03, 0x00], slave:true}
];
function run(o, dopt){ const s = L.synthLIN(FR, o || {}); return L.decodeLIN(s.values, s.dt, Object.assign({vbat:12.6}, dopt || {}), H); }
function has(list, name, st){ return list.some(c => c.name === name && c.st === st); }
function allChecks(r){ return r.checks.concat(...r.frames.map(f => f.checks)); }

test('PID-Parität und klassische Checksumme (Normbeispiel LIN-Spezifikation: 0x4A 0x55 0x93 0xE5 → 0xE6)', () => {
  assert.strictEqual(L.linPid(0x00), 0x80);
  assert.strictEqual(L.linPid(0x01), 0xC1);
  assert.strictEqual(L.linPid(0x3C), 0x3C);
  assert.strictEqual(L.linPid(0x3D), 0x7D);
  assert.strictEqual(L.linChecksum([0x4A, 0x55, 0x93, 0xE5], null), 0xE6);
});

for(const baud of [19200, 10417, 9600]){
  for(const nom of [0, baud]){
    test(`Gutbild ${baud} bit/s, Vorgabe ${nom || 'auto'}`, () => {
      const r = run({baud}, {baud:nom});
      assert.ok(r.ok);
      assert.strictEqual(r.frames.length, 2);
      r.frames.forEach((f, i) => {
        assert.strictEqual(f.id, FR[i].id);
        assert.deepStrictEqual(f.data, FR[i].data);
        assert.strictEqual(f.status, 'ok', JSON.stringify(f.checks.filter(c => c.st !== 'ok' && c.st !== 'info')));
        assert.ok(f.fields.some(x => x.label === 'SYNC') && f.fields.some(x => x.kind === 'crc'));
      });
      assert.ok(Math.abs(r.info.bitrate / baud - 1) < 0.01);
    });
  }
}

test('Fehlerbilder werden erkannt', () => {
  const exp = {expect:[0x20, 0x21]};
  assert.ok(has(allChecks(run({fault:'noresp'}, exp)), 'Antwort', 'bad'));
  assert.ok(has(allChecks(run({fault:'cs'})), 'Checksumme', 'bad'));
  assert.ok(has(allChecks(run({fault:'drift'})), 'Takt der Antwort', 'bad'));
  const m = allChecks(run({fault:'masse'}));
  assert.ok(has(m, 'Low-Pegel Antwort', 'warn') && has(m, 'Pegelvergleich', 'warn'));
  assert.ok(has(allChecks(run({fault:'pullup'})), 'Ruhepegel (rezessiv)', 'bad'));
  assert.ok(has(run({fault:'kurzmasse'}).checks, 'Leitung dauerhaft dominant', 'bad'));
  assert.ok(has(run({fault:'still'}).checks, 'Keine Kommunikation', 'bad'));
});

test('fehlende Antwort ohne Erwartung nur Hinweis', () => {
  assert.ok(has(allChecks(run({fault:'noresp'})), 'Antwort', 'warn'));
});

test('zu wenig Punkte pro Bit → klarer Fehler mit Zeitbasis', () => {
  const s = L.synthLIN(FR, {spb:12});
  const step = 6, v = s.values.filter((_, i) => i % step === 0);   /* 2 Punkte pro Bit */
  const r = L.decodeLIN(v, s.dt * step, {}, H);
  assert.strictEqual(r.ok, false);
  assert.match(r.error, /ms\/div|µs\/div/);
});

test('Aufnahme beginnt mitten im Frame', () => {
  const s = L.synthLIN(FR, {});
  const cut = Math.round(s.values.length * 0.2);
  const r = L.decodeLIN(s.values.subarray(cut), s.dt, {}, H);
  assert.ok(r.frames.length >= 1);
  assert.strictEqual(r.frames[r.frames.length - 1].id, 0x21);
});

test('ungültige Daten', () => {
  assert.strictEqual(L.decodeLIN([1, NaN, 2], 1e-5, {}, H).ok, false);
  assert.strictEqual(L.decodeLIN([], 1e-5, {}, H).ok, false);
});

test('Performance: 262144 Samples < 500 ms', () => {
  const frames = []; for(let i = 0; i < 60; i++) frames.push({id:i % 60, data:[i, 1, 2, 3], slave:true});
  const s = L.synthLIN(frames, {});
  const v = s.values.subarray(0, Math.min(262144, s.values.length));
  const t = Date.now(); const r = L.decodeLIN(v, s.dt, {}, H);
  assert.ok(Date.now() - t < 500); assert.ok(r.frames.length > 20);
});
