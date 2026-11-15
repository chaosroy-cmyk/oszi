"""Bridge gegen den ECHTEN Treiber (florentbr/OWON-VDS1022, Modul vds1022) mit simuliertem USB-Geraet.

Der Treiber ist nicht Teil dieses Repos. Ist er nicht installiert, werden die Tests uebersprungen:
    pip install pyusb <checkout>/api/python      oder      PYTHONPATH=<checkout>/api/python
Simuliert wird nur die USB-Ebene (Befehle rein, Antworten/Datenrahmen raus), so wie der Treiber
sie in seinem Quelltext dokumentiert. Das ist KEIN Hardwaretest: Ob das echte Geraet genauso
antwortet, zeigt erst die Messung am VDS1022I.
"""
import collections
import copy
import math
import pathlib
import struct
import sys
import threading
import time
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import numpy as np

try:
    import vds1022
    from vds1022 import vds1022 as drv
except Exception:                                   # Treiber fehlt -> alles ueberspringen
    vds1022 = drv = None

import bridge as b

INITIAL = copy.deepcopy(b.SET)
A = {'READ_FLASH': 0x01b0, 'QUERY_FPGA': 0x0223, 'GET_MACHINE': 0x4001, 'GET_DATA': 0x1000,
     'TRIGGERED': 0x01, 'MULTI': 0x06, 'PEAK': 0x09, 'ROLL': 0x0a, 'TRIGGER': 0x24, 'TIMEBASE': 0x52,
     'FINISHED': 0x7a, 'ZERO_CH1': 0x010a, 'CDT_GL_CH1': 0x42, 'CDT_HL_CH1': 0x44, 'WRITE_FLASH': 0x01a0,
     'EDGE_CH1': 0x2e, 'SLOPE_CH1': 0x10}
FRAME, ADC, RING = 5211, 5100, 5120


def flash_image():
    buf = bytearray(2002)
    struct.pack_into('<HI', buf, 0, 0x55AA, 2)
    pos = 6
    for value in (1000, 1000, 1000, 1000, 2048, 2048):      # GAIN, AMPL, COMP je CH1/CH2
        struct.pack_into('<10H', buf, pos, *([value] * 10))
        pos += 20
    text = b'\x00' + b'V2.7.0\x00' + b'VDS1022ISIMULATOR\x00'
    buf[206:206 + len(text)] = text
    return bytes(buf)


class SimUsb:
    """USB-Backend-Ersatz: versteht die Befehle so, wie vds1022.py sie beschreibt."""

    def __init__(self):
        self.log = []                 # (Adresse, Wert) aller Befehle
        self.out = collections.deque()
        self.prescaler = 1
        self.roll = 0
        self.triggered = 1
        self.amplitude = 80           # ADC-Zaehler
        self.t_roll = time.perf_counter()
        self.last = [0, 0]
        self.lock = threading.Lock()

    # --- Geraeteerkennung
    def enumerate_devices(self):
        return [object()]

    def get_device_descriptor(self, dev):
        return type('D', (), {'idVendor': 0x5345, 'idProduct': 0x1234})

    def get_interface_descriptor(self, dev, intf, alt, cfg):
        ep = [type('E', (), {'bEndpointAddress': a}) for a in (0x03, 0x81)]
        return type('I', (), {'bNumEndpoints': 2, 'endpoint': ep})

    def open_device(self, dev):
        return object()

    def is_kernel_driver_active(self, *a):
        return False

    def claim_interface(self, *a):
        pass

    def release_interface(self, *a):
        pass

    def close_device(self, *a):
        pass

    # --- Datenverkehr
    def bulk_write(self, handle, ep, intf, buffer, timeout):
        data = bytes(bytearray(buffer))
        address, size = struct.unpack_from('<IB', data)
        value = int.from_bytes(data[5:5 + size], 'little')
        with self.lock:
            self.log.append((address, value))
            if address == A['READ_FLASH']:
                self.out.append(flash_image())
            elif address == A['GET_DATA']:
                for chl in range(2):
                    if (value >> (8 * chl)) & 0xff == 5:
                        self.out.append(self.data_frame(chl))
            else:
                if address == A['TIMEBASE']:
                    self.prescaler = value
                elif address == A['ROLL']:
                    self.roll = value
                    self.t_roll = time.perf_counter()
                    self.last = [0, 0]
                reply = {A['GET_MACHINE']: 1, A['QUERY_FPGA']: 1, A['FINISHED']: 1,
                         A['TRIGGERED']: self.triggered}.get(address, 0)
                self.out.append(struct.pack('<BI', 83, reply))
        return len(data)

    def bulk_read(self, handle, ep, intf, buffer, timeout):
        with self.lock:
            data = self.out.popleft()
        if len(data) == FRAME:
            time.sleep(.004)          # USB Full Speed: ein Datenrahmen (5211 Byte) braucht gut 4 ms
        memoryview(buffer).cast('B')[:len(data)] = data
        return len(data)

    def data_frame(self, chl):
        rate = 100e6 / self.prescaler
        frame = bytearray(FRAME)
        if self.roll:
            # lueckenloser Zaehler: Sample k hat den Wert (k % 200) - 100 -> Luecken waeren sichtbar
            total = int((time.perf_counter() - self.t_roll) * rate)
            new = min(ADC, total - self.last[chl])
            ks = np.arange(total - new, total)
            frame[FRAME - new:] = ((ks % 200) - 100).astype(np.int8).tobytes()
            self.last[chl] = total
            cursor = (20 + total) % RING
        else:
            i = np.arange(ADC)
            wave = np.round(self.amplitude * np.sin(2 * math.pi * 1000 * i / rate) * (1 if chl == 0 else .5))
            frame[FRAME - ADC:] = wave.astype(np.int8).tobytes()
            cursor = 5000
        struct.pack_into('<BIIH', frame, 0, chl, 100000, 1, cursor)     # Zaehler: 1 Periode in 1 ms -> 1 kHz
        return bytes(frame)

    def values(self, name):
        return [v for a, v in self.log if a == A[name]]


@unittest.skipIf(drv is None, 'vds1022-Treiber nicht installiert')
class RealDriverTests(unittest.TestCase):
    def setUp(self):
        self.sim = SimUsb()
        self.old = (drv.libusb1.get_backend, drv.libusb0.get_backend, b.offer, b.notify, b.NS)
        drv.libusb1.get_backend = lambda: self.sim
        drv.libusb0.get_backend = lambda: self.sim
        b.NS = {k: getattr(vds1022, k) for k in (
            'CH1', 'CH2', 'EXT', 'EDGE', 'PULSE', 'SLOPE', 'RISE', 'FALL', 'RISE_SUP', 'RISE_EQU', 'RISE_INF',
            'FALL_SUP', 'FALL_EQU', 'FALL_INF', 'DC', 'AC', 'AUTO', 'NORMAL', 'ONCE')}
        self.frames, self.notes = [], []
        b.offer = lambda h, c1, c2: self.frames.append((h, c1, c2))
        b.notify = self.notes.append
        b.SET = copy.deepcopy(INITIAL)
        b.CONTROL_ID = object()
        b.STOP.clear(); b.RUNNING.set(); b.SINGLE.clear()
        b.WAKE.clear(); b.WAITING.clear(); b.INTERRUPTED.clear()
        b.PENDING.update(record=None, autoset=False)
        while not b.CMD_Q.empty():
            b.CMD_Q.get_nowait()
        self.dev = vds1022.VDS1022(debug=False)
        b.DEV['dev'] = self.dev

    def tearDown(self):
        b.STOP.set()
        b.DEV['dev'] = None
        self.dev.dispose()
        drv.libusb1.get_backend, drv.libusb0.get_backend, b.offer, b.notify, b.NS = self.old
        b.STOP.clear()

    def submit(self):
        """Wartende Befehle der Lib ans (simulierte) Geraet schicken."""
        self.dev.fetch()

    def test_never_writes_flash(self):
        b.apply_settings(self.dev); self.submit()
        self.assertEqual(self.sim.values('WRITE_FLASH'), [])

    def test_edge_trigger_default_is_not_alternate(self):
        b.apply_settings(self.dev); b.apply_settings(self.dev); self.submit()
        self.assertEqual(self.sim.values('TRIGGER')[-1], 0)          # CH1, Flanke steigend, AUTO

    def test_pulse_trigger_lin_break(self):
        t = b.SET['trigger']
        t.update(mode='pulse', edge='fall', cond='gt', width=550e-6, sweep='normal', level=6.0)
        b.SET['ch'][0].update(vdiv=5.0, probe=10)                    # Fenster 50 V
        b.validate_settings(); b.apply_settings(self.dev)
        self.sim.triggered = 1; self.submit()
        # Bit 14 + 8 = Pulsbreite, Bits 5..7 = 3 (fallend, breiter als), Bits 10..11 = 1 (NORMAL)
        self.assertEqual(self.sim.values('TRIGGER')[-1], (1 << 14) | (1 << 8) | (3 << 5) | (1 << 10))
        width = self.sim.values('CDT_GL_CH1')[-1] + 65536 * self.sim.values('CDT_HL_CH1')[-1]
        self.assertEqual(width, 55000)                               # 550 µs in 10-ns-Schritten

    def test_slope_trigger_uses_two_levels(self):
        b.SET['trigger'].update(mode='slope', edge='rise', cond='lt', width=1e-3, level=4.0, level2=1.0)
        b.validate_settings(); b.apply_settings(self.dev); self.submit()
        hi, lo = self.sim.values('SLOPE_CH1')[-1] & 0xff, self.sim.values('SLOPE_CH1')[-1] >> 8
        self.assertNotEqual(hi, lo)
        self.assertEqual(self.sim.values('TRIGGER')[-1] & ((1 << 14) | (1 << 8)), 1 << 14)   # Modus 2 = Steilheit
        b.SET['trigger']['level2'] = 4.0
        with self.assertRaises(ValueError): b.validate_settings()

    def test_external_trigger_switches_multi_port_to_input(self):
        b.SET['trigger'].update(ext=True, mode='edge', edge='fall')
        b.validate_settings(); b.apply_settings(self.dev); self.submit()
        self.assertEqual(self.sim.values('MULTI')[-1], 2)            # Trigger-Eingang
        self.assertEqual(self.sim.values('TRIGGER')[-1] & 1, 1)
        b.SET['trigger']['mode'] = 'pulse'
        with self.assertRaises(ValueError): b.validate_settings()

    def test_peak_mode_and_offset_reach_the_device(self):
        b.apply_settings(self.dev); self.submit()
        zero = self.sim.values('ZERO_CH1')[-1]
        b.SET['peak'] = True; b.SET['ch'][0]['offset'] = -.3
        b.apply_settings(self.dev); self.submit()
        self.assertEqual(self.sim.values('PEAK')[-1], 1)
        self.assertNotEqual(self.sim.values('ZERO_CH1')[-1], zero)
        self.assertAlmostEqual(self.dev.voltoffset[0], -.3)
        b.SET['peak'] = False
        b.apply_settings(self.dev); self.submit()
        self.assertEqual(self.sim.values('PEAK')[-1], 0)

    def test_trigger_level_must_lie_in_shifted_window(self):
        b.SET['ch'][0].update(vdiv=2.0, probe=10, offset=-.3)        # Fenster 20 V: -4 .. +16 V
        b.SET['trigger']['level'] = 12.0
        b.validate_settings()                                        # mittig waere 12 V ausserhalb (+-10 V)
        b.SET['trigger']['level'] = -6.0
        with self.assertRaises(ValueError): b.validate_settings()

    def test_frame_header_carries_counter_frequency(self):
        b.apply_settings(self.dev)
        frames = self.dev.fetch()
        h = b.frame_header(self.dev, frames, 1, 5000, 5000, b._dt(frames))
        self.assertAlmostEqual(h['freqHz'][0], 1000.0, places=3)
        self.assertEqual((h['roll'], h['peak'], h['sweep']), (False, False, 'auto'))

    def record(self, **req):
        req = {'cmd': 'record', **req}
        return b.do_record(self.dev, req, 7)

    def assert_gapless(self, values, step):
        d = np.diff(values) / step
        ok = np.isclose(d, 1, atol=.01) | np.isclose(d, -199, atol=.01)
        self.assertTrue(ok.all(), 'Luecke in der Aufnahme: %s' % d[~ok][:5])

    def test_record_is_gapless_and_settings_are_restored(self):
        self.sim.triggered = 0
        b.SET['ch'][1]['on'] = True
        before = self.sim.prescaler
        b.apply_settings(self.dev); self.submit()
        seq = self.record(duration=.3, rate=20000)
        self.assertEqual(seq, 8)
        h, c1, c2 = self.frames[-1]
        self.assertTrue(h['long']); self.assertFalse(h['quality']['discontinuous'])
        self.assertAlmostEqual(h['dt'], 1 / 20000)
        self.assertEqual(h['n1'], h['n2']); self.assertEqual(len(c1), len(c2))
        self.assertGreaterEqual(h['n1'], .3 * 20000); self.assertLess(h['n1'], .3 * 20000 + 2 * 5100)
        self.assert_gapless(c1, self.dev.voltrange[0] * self.dev.probe[0] / 250)
        self.assertEqual([n['state'] for n in self.notes if n.get('cmd') == 'record'], ['running', 'done'])
        self.assertFalse(b.RUNNING.is_set())
        self.submit()                                                # normale Einstellungen wieder am Geraet
        self.assertEqual(self.sim.values('TIMEBASE')[-1], 100e6 / b.pick_rate(b.SET['secdiv']))
        self.assertEqual(self.sim.roll, 0)
        self.assertEqual(self.sim.values('TRIGGER')[-1], 0)

    def test_record_one_channel_only(self):
        self.sim.triggered = 0
        self.record(duration=.1, rate=20000)
        h, c1, c2 = self.frames[-1]
        self.assertIsNone(c2); self.assertEqual(h['n2'], 0); self.assertGreater(h['n1'], 1900)

    def test_triggered_record_waits_and_keeps_pretrigger(self):
        self.sim.triggered = 0
        threading.Timer(.35, lambda: setattr(self.sim, 'triggered', 1)).start()
        t0 = time.perf_counter()
        self.record(duration=.2, rate=20000, trigger=True, pre=.1)
        self.assertGreater(time.perf_counter() - t0, .5)
        h, c1, _ = self.frames[-1]
        self.assertTrue(h['recordTriggered'])
        self.assertGreater(h['n1'] * h['dt'], .25)
        self.assertGreater(h['trig'], .15); self.assertLess(h['trig'], .6)
        self.assertEqual(self.notes[0]['state'], 'waiting')
        self.assertEqual(self.sim.values('TRIGGER')[-1] >> 10 & 3, 2)   # waehrend der Aufnahme: ONCE
        self.submit()
        self.assertEqual(self.sim.values('TRIGGER')[-1], 0)             # danach wieder wie eingestellt

    def test_record_can_be_aborted_while_waiting(self):
        self.sim.triggered = 0
        threading.Timer(.3, b.interrupt_device).start()
        t0 = time.perf_counter()
        self.record(duration=5, rate=20000, trigger=True)
        self.assertLess(time.perf_counter() - t0, 2)
        self.assertEqual(self.frames, [])
        self.assertEqual(self.notes[-1]['state'], 'aborted')
        self.assertFalse(b.INTERRUPTED.is_set())
        self.assertEqual(len(self.dev.fetch().ch1.y()), 5000)        # Geraet danach weiter benutzbar

    def test_autoset_updates_settings_and_trigger_level(self):
        self.sim.amplitude = 100
        b.do_autoset(self.dev)
        note = self.notes[-1]
        self.assertEqual((note['cmd'], note.get('applied')), ('settings', True))
        t = note['set']['trigger']
        self.assertEqual((t['mode'], t['sweep'], t['ext']), ('edge', 'auto', False))
        self.assertTrue(note['set']['ch'][0]['on'])
        self.assertGreaterEqual(note['set']['ch'][0]['vdiv'], .01)
        self.assertTrue(1e-6 <= note['set']['secdiv'] <= 200)
        b.validate_settings()

    def test_normal_sweep_blocks_until_trigger_and_commands_still_work(self):
        old = b.VDS
        b.VDS = lambda **kw: self.dev                                # Worker nutzt dieses Geraet
        self.dev.dispose = lambda: None
        self.sim.triggered = 0
        b.SET['trigger']['sweep'] = 'normal'
        worker = threading.Thread(target=b.device_worker, args=(20,), daemon=True)
        worker.start()
        try:
            time.sleep(.5)
            self.assertEqual(self.frames, [])                        # kein Trigger -> kein Bild
            self.assertTrue(b.WAITING.is_set())
            b.CMD_Q.put((b.CONTROL_ID, {'cmd': 'timebase', 'secdiv': .002}))   # Befehl waehrend des Wartens
            b.interrupt_device()
            deadline = time.time() + 2
            while b.SET['secdiv'] != .002 and time.time() < deadline:
                time.sleep(.02)
            self.assertEqual(b.SET['secdiv'], .002)
            self.sim.triggered = 1                                   # Ereignis tritt ein
            deadline = time.time() + 3
            while not self.frames and time.time() < deadline:
                time.sleep(.02)
            self.assertTrue(self.frames)
            self.assertEqual(self.frames[-1][0]['sweep'], 'normal')
        finally:
            b.STOP.set(); b.interrupt_device(); worker.join(3); b.VDS = old
            del self.dev.dispose                                     # echtes dispose fuer tearDown
        self.assertFalse(worker.is_alive())


if __name__ == '__main__':
    unittest.main()
