#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
bridge.py - OWON VDS1022(I) <-> WebSocket-Bridge fuer das KFZ-Oszi-Kompendium
==============================================================================
Server:  ws://localhost:8765

Frames an Clients
  JSON:   {"cmd":"frame","t":..,"dt":..,"range":[v1,v2],"probe":[p1,p2],
           "n1":..,"n2":..,"ch1":[Volt..],"ch2":[..]}
  Binaer: [b'OSZ1'][uint32 LE header_len][header-JSON, mit Spaces auf
          4-Byte-Grenze gepolstert][ch1 float32 LE * n1][ch2 float32 LE * n2]
          -> aktiv bei gemessener RTT > 100 ms oder --binary on
Status:  {"cmd":"status","device":"verbunden|kein Geraet|lib fehlt|getrennt"}
Ping:    Server sendet {"cmd":"ping","t":..}; Client antwortet {"cmd":"pong","t":..}

Kommandos vom Client (JSON):
  {"cmd":"channel","ch":1,"on":true,"vdiv":2.0,"coupling":"DC","probe":10}
  {"cmd":"timebase","secdiv":0.001}
  {"cmd":"trigger","ch":1,"edge":"rise","level":1.4}
  {"cmd":"run"} / {"cmd":"stop"} / {"cmd":"single"}

Voraussetzungen:
  pip install websockets numpy
  pip install <repo-checkout>/api/python   # Modul 'vds1022'
  (github.com/florentbr/OWON-VDS1022 -> API: VDS1022, set_channel,
   set_sampling, set_trigger, fetch/fetch_iter, frames.ch1/ch2)

Start:  python bridge.py [--port 8765] [--binary auto|on|off] [--fps 10]

Verhalten: reconnect-sicher (Geraet ab-/anstecken), Fehler ins Log,
kein Absturz. Die Bridge fuehrt Buch ueber die selbst gesetzten Einstellungen
(SET) und nutzt sie als Quelle der Wahrheit fuer range/probe/dt im Header.
"""
import argparse
import asyncio
import json
import logging
import queue
import sys
import threading
import time

log = logging.getLogger("bridge")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

try:
    import numpy as np
except ImportError:
    log.error("numpy fehlt: pip install numpy")
    sys.exit(1)
try:
    import websockets
except ImportError:
    log.error("websockets fehlt: pip install websockets")
    sys.exit(1)

VDS = None
NS = {}
try:
    import vds1022 as _v
    VDS = _v.VDS1022
    for k in ("CH1", "CH2", "EDGE", "RISE", "FALL", "DC", "AC"):
        if hasattr(_v, k):
            NS[k] = getattr(_v, k)
except Exception as e:  # Modul fehlt oder USB-Backend defekt
    log.warning("vds1022-Modul nicht ladbar (%s) - Server laeuft, Status 'lib fehlt'", e)

# --- Windows-Workaround -----------------------------------------------------
# Die vds1022-Lib arbeitet DIREKT auf dem pyusb-Backend (usb.is_kernel_driver_
# active(handle, intf), vds1022.py Z.1526) - kernel_driver ist ein Linux-
# Konzept, unter Windows wirft das Backend NotImplementedError. Wir
# neutralisieren die drei kernel_driver-Methoden auf Backend-Ebene.
if sys.platform.startswith("win"):
    try:
        import usb.backend as _ub
        _ub.IBackend.is_kernel_driver_active = lambda self, *a, **k: False
        _ub.IBackend.detach_kernel_driver = lambda self, *a, **k: None
        _ub.IBackend.attach_kernel_driver = lambda self, *a, **k: None
        for _name in ("libusb1", "libusb0"):
            try:
                _m = __import__("usb.backend." + _name, fromlist=["_LibUSB"])
                if hasattr(_m, "_LibUSB"):
                    _m._LibUSB.is_kernel_driver_active = lambda self, *a, **k: False
                    _m._LibUSB.detach_kernel_driver = lambda self, *a, **k: None
                    _m._LibUSB.attach_kernel_driver = lambda self, *a, **k: None
            except Exception:
                pass
        log.info("Windows-USB-Workaround aktiv (Backend-Ebene, kernel_driver neutralisiert)")
    except Exception as _e:
        log.warning("USB-Workaround nicht anwendbar: %s", _e)
# ----------------------------------------------------------------------------

MAGIC = b"OSZ1"
STOP = threading.Event()
RUNNING = threading.Event()
RUNNING.set()
SINGLE = threading.Event()
CMD_Q = queue.Queue()

SET = {
    "ch": [
        {"on": True, "vdiv": 2.0, "coupling": "DC", "probe": 10},
        {"on": False, "vdiv": 2.0, "coupling": "DC", "probe": 10},
    ],
    "secdiv": 1e-3,
    "rate": 100_000,
    "trigger": {"ch": 1, "edge": "rise", "level": 1.0},
}
STATUS = {"device": "getrennt"}

RATE_LADDER = [1_000, 10_000, 100_000, 1_000_000, 10_000_000, 100_000_000]


def pick_rate(secdiv):
    """Samplerate so waehlen, dass 10 Divisionen >= 2000 Punkte ergeben."""
    window = secdiv * 10
    for r in RATE_LADDER:
        if r * window >= 2000:
            return r
    return RATE_LADDER[-1]


def rate_str(r):
    if r >= 1_000_000:
        return "%dM" % (r // 1_000_000)
    if r >= 1_000:
        return "%dk" % (r // 1_000)
    return str(r)


def vdiv_str(v):
    return ("%gv" % v) if v >= 1 else ("%dmv" % round(v * 1000))


def _volts(ch):
    """Kanalobjekt -> float32-Volt-Array; tolerant gegen y()/y/Array-Varianten."""
    if ch is None:
        return None
    y = getattr(ch, "y", None)
    try:
        arr = y() if callable(y) else (y if y is not None else ch)
    except Exception:
        arr = ch
    try:
        return np.asarray(arr, dtype=np.float32)
    except Exception:
        return None


_dt_warned = False


def _dt(frames):
    """Sampleintervall: aus Frames (sx/hx/dt), sonst 1/gesetzte Rate."""
    global _dt_warned
    for name in ("sx", "hx", "dt"):
        v = getattr(frames, name, None)
        if isinstance(v, (int, float)) and v > 0:
            return float(v)
        ch = getattr(frames, "ch1", None)
        v = getattr(ch, name, None) if ch is not None else None
        if isinstance(v, (int, float)) and v > 0:
            return float(v)
    if not _dt_warned:
        log.info("dt nicht aus Frames lesbar - nutze 1/Samplerate (%s S/s)", SET["rate"])
        _dt_warned = True
    return 1.0 / SET["rate"]


def apply_settings(dev):
    """SET aufs Geraet schreiben (best effort, Fehler geloggt, kein Abbruch)."""
    for i, chk in enumerate(("CH1", "CH2")):
        c = SET["ch"][i]
        try:
            kw = {"range": vdiv_str(c["vdiv"]), "probe": "x%d" % int(c["probe"]), "offset": 1 / 2}
            cp = str(c.get("coupling", "DC")).upper()
            if cp in NS:
                kw["coupling"] = NS[cp]
            dev.set_channel(NS.get(chk, i + 1), **kw)
        except Exception as e:
            log.warning("set_channel %s: %s", chk, e)
    try:
        fn = getattr(dev, "set_sampling", None) or getattr(dev, "set_timerange", None)
        if fn:
            fn(rate_str(SET["rate"]))
    except Exception as e:
        log.warning("set_sampling: %s", e)
    t = SET["trigger"]
    try:
        edge = NS.get("RISE" if t["edge"] == "rise" else "FALL")
        dev.set_trigger(
            NS.get("CH%d" % int(t["ch"]), int(t["ch"])),
            NS.get("EDGE", "edge"),
            edge,
            position=1 / 2,
            level="%gv" % float(t["level"]),
        )
    except Exception as e:
        log.warning("set_trigger: %s", e)


def drain_cmds(dev):
    changed = False
    while True:
        try:
            c = CMD_Q.get_nowait()
        except queue.Empty:
            break
        k = c.get("cmd")
        if k == "channel":
            i = 0 if int(c.get("ch", 1)) == 1 else 1
            for f in ("on", "vdiv", "coupling", "probe"):
                if f in c:
                    SET["ch"][i][f] = c[f]
            changed = True
        elif k == "timebase":
            SET["secdiv"] = float(c.get("secdiv", SET["secdiv"]))
            SET["rate"] = pick_rate(SET["secdiv"])
            changed = True
        elif k == "trigger":
            for f in ("ch", "edge", "level"):
                if f in c:
                    SET["trigger"][f] = c[f]
            changed = True
        elif k == "run":
            RUNNING.set()
        elif k == "stop":
            RUNNING.clear()
        elif k == "single":
            SINGLE.set()
            RUNNING.clear()
    if changed and dev is not None:
        apply_settings(dev)


# ---------------- asyncio-Seite ----------------
CLIENTS = {}
FRAME_Q = None
LOOP = None
FORCE_BINARY = "auto"


def offer(header, ch1, ch2):
    """Vom Geraetethread: Frame threadsicher einreihen; bei Stau verwerfen."""
    def _put():
        try:
            FRAME_Q.put_nowait((header, ch1, ch2))
        except asyncio.QueueFull:
            pass
    LOOP.call_soon_threadsafe(_put)


def set_status(s):
    if STATUS["device"] == s:
        return
    STATUS["device"] = s
    log.info("Status: %s", s)
    if LOOP is None:
        return

    def _b():
        asyncio.ensure_future(broadcast_json({"cmd": "status", "device": s}))
    LOOP.call_soon_threadsafe(_b)


async def broadcast_json(obj):
    msg = json.dumps(obj)
    for ws in list(CLIENTS):
        try:
            await ws.send(msg)
        except Exception:
            CLIENTS.pop(ws, None)


def pack_binary(header, ch1, ch2):
    hb = json.dumps(header, separators=(",", ":")).encode()
    pad = (-(8 + len(hb))) % 4
    hb += b" " * pad
    parts = [MAGIC, len(hb).to_bytes(4, "little"), hb]
    if ch1 is not None:
        parts.append(np.ascontiguousarray(ch1, dtype="<f4").tobytes())
    if ch2 is not None:
        parts.append(np.ascontiguousarray(ch2, dtype="<f4").tobytes())
    return b"".join(parts)


async def sender():
    while True:
        header, ch1, ch2 = await FRAME_Q.get()
        jmsg = None
        bmsg = None
        for ws, meta in list(CLIENTS.items()):
            use_bin = FORCE_BINARY == "on" or (FORCE_BINARY == "auto" and meta.get("binary"))
            try:
                if use_bin:
                    if bmsg is None:
                        bmsg = pack_binary(header, ch1, ch2)
                    await ws.send(bmsg)
                else:
                    if jmsg is None:
                        j = dict(header)
                        j["cmd"] = "frame"
                        j["ch1"] = ch1.tolist() if ch1 is not None else []
                        j["ch2"] = ch2.tolist() if ch2 is not None else []
                        jmsg = json.dumps(j)
                    await ws.send(jmsg)
            except Exception:
                CLIENTS.pop(ws, None)


async def pinger():
    while True:
        await asyncio.sleep(2)
        now = time.time()
        for ws in list(CLIENTS):
            try:
                await ws.send(json.dumps({"cmd": "ping", "t": now}))
            except Exception:
                CLIENTS.pop(ws, None)


async def handler(ws, path=None):  # path=None: kompatibel mit websockets alt+neu
    CLIENTS[ws] = {"binary": FORCE_BINARY == "on", "rtt": None}
    log.info("Client verbunden (%d aktiv)", len(CLIENTS))
    try:
        await ws.send(json.dumps({"cmd": "status", "device": STATUS["device"]}))
        await ws.send(json.dumps({"cmd": "settings", "set": SET}))
        async for raw in ws:
            if isinstance(raw, (bytes, bytearray)):
                continue
            try:
                c = json.loads(raw)
            except Exception:
                continue
            if c.get("cmd") == "pong":
                meta = CLIENTS.get(ws)
                if meta is not None:
                    rtt = time.time() - float(c.get("t", 0))
                    meta["rtt"] = rtt
                    if FORCE_BINARY == "auto":
                        if rtt > 0.1 and not meta["binary"]:
                            meta["binary"] = True
                            log.info("RTT %.0f ms -> Binaerframes", rtt * 1000)
                        elif rtt < 0.05 and meta["binary"]:
                            meta["binary"] = False
                continue
            CMD_Q.put(c)
    finally:
        CLIENTS.pop(ws, None)
        log.info("Client getrennt (%d aktiv)", len(CLIENTS))


# ---------------- Geraetethread ----------------
def frames_source(dev, fps):
    it = getattr(dev, "fetch_iter", None)
    if it is not None:
        try:
            for fr in it(freq=fps):
                yield fr
            return
        except TypeError:
            for fr in it():
                yield fr
            return
    while True:
        yield dev.fetch()
        time.sleep(1.0 / max(fps, 1))


def device_worker(fps):
    while not STOP.is_set():
        if VDS is None:
            set_status("lib fehlt")
            drain_cmds(None)
            time.sleep(3)
            continue
        dev = None
        try:
            dev = VDS(debug=0)
            apply_settings(dev)
            set_status("verbunden")
            for frames in frames_source(dev, fps):
                if STOP.is_set():
                    break
                drain_cmds(dev)
                if not RUNNING.is_set() and not SINGLE.is_set():
                    continue
                ch1 = _volts(getattr(frames, "ch1", None)) if SET["ch"][0]["on"] else None
                ch2 = _volts(getattr(frames, "ch2", None)) if SET["ch"][1]["on"] else None
                if ch1 is None and ch2 is None:
                    continue
                header = {
                    "t": time.time(),
                    "dt": _dt(frames),
                    "range": [SET["ch"][0]["vdiv"], SET["ch"][1]["vdiv"]],
                    "probe": [SET["ch"][0]["probe"], SET["ch"][1]["probe"]],
                    "n1": int(len(ch1)) if ch1 is not None else 0,
                    "n2": int(len(ch2)) if ch2 is not None else 0,
                }
                offer(header, ch1, ch2)
                if SINGLE.is_set():
                    SINGLE.clear()
        except Exception as e:
            log.warning("Geraetefehler: %s", e)
        finally:
            try:
                if dev is not None and hasattr(dev, "stop"):
                    dev.stop()
            except Exception:
                pass
        set_status("kein Geraet")
        time.sleep(2)


async def main(port, fps):
    global FRAME_Q, LOOP
    LOOP = asyncio.get_running_loop()
    FRAME_Q = asyncio.Queue(maxsize=4)
    threading.Thread(target=device_worker, args=(fps,), daemon=True).start()
    async with websockets.serve(handler, "localhost", port, max_size=None):
        log.info("Bridge laeuft: ws://localhost:%d (binary=%s)", port, FORCE_BINARY)
        await asyncio.gather(sender(), pinger())


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="OWON VDS1022 WebSocket-Bridge")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--binary", choices=("auto", "on", "off"), default="auto")
    ap.add_argument("--fps", type=int, default=10, help="Frames/s vom Geraet")
    a = ap.parse_args()
    FORCE_BINARY = a.binary
    try:
        asyncio.run(main(a.port, a.fps))
    except KeyboardInterrupt:
        STOP.set()
        log.info("Beendet.")
