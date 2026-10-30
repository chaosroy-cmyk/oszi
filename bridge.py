#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
bridge.py - OWON VDS1022(I) <-> WebSocket-Bridge fuer das KFZ-Oszi-Kompendium
==============================================================================
Server:  ws://localhost:8765

Frames an Clients
  JSON:   {"cmd":"frame","t":..,"dt":..,"range":[v1,v2],"probe":[1,1],"probeUi":[p1,p2],"trig":0.2,
          (Werte in Volt am Tastkopf; "probe" ist deshalb [1,1], "probeUi" nur zur Info)
           "n1":..,"n2":..,"ch1":[Volt..],"ch2":[..]}
          Jeder Frame ist EINE Aufnahme des Geraets (5000 Punkte = 10 Divisionen der
          Anzeige, Samplerate = 5000 / (10 * secdiv)); "trig" = Lage des Geraete-Triggers.
  Binaer: [b'OSZ1'][uint32 LE header_len][header-JSON, mit Spaces auf
          4-Byte-Grenze gepolstert][ch1 float32 LE * n1][ch2 float32 LE * n2]
          -> aktiv bei gemessener RTT > 100 ms oder --binary on
Status:  {"cmd":"status","device":"verbunden|kein Geraet|lib fehlt|getrennt"}
Ping:    Server sendet {"cmd":"ping","t":..}; Client antwortet {"cmd":"pong","t":..}

Kommandos vom Client (JSON):
  {"cmd":"channel","ch":1,"on":true,"vdiv":2.0,"coupling":"DC","probe":10}
  {"cmd":"timebase","secdiv":0.001}
  {"cmd":"trigger","ch":1,"edge":"rise","level":1.4,"position":0.2}
  {"cmd":"run"} / {"cmd":"stop"} / {"cmd":"single"}
  Das Geraet laeuft immer im Sweep AUTO (frei bzw. getriggert); run/stop/single
  entscheidet nur die Bridge, welche Frames weitergehen. single = naechstes
  vollstaendiges Bild. Die Anzeige triggert in der App per Software.

Voraussetzungen:
  pip install websockets numpy
  pip install <repo-checkout>/api/python   # Modul 'vds1022'
  (github.com/florentbr/OWON-VDS1022 -> API: VDS1022, set_channel,
   set_sampling, set_trigger, fetch/fetch_iter, frames.ch1/ch2)

Start:  python bridge.py [--port 8765] [--binary auto|on|off] [--fps 20]

Verhalten: reconnect-sicher (Geraet ab-/anstecken), Fehler ins Log,
kein Absturz. Die Bridge fuehrt Buch ueber die selbst gesetzten Einstellungen
(SET) und nutzt sie als Quelle der Wahrheit fuer range/probe/dt im Header.
"""
import copy
import inspect
import math
import secrets
from urllib.parse import urlsplit
from bridge_protocol import (validate_command, DEFAULT_ORIGINS, MAX_MESSAGE, MAX_SAMPLES, MAX_COMMANDS)

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
    for k in ("CH1", "CH2", "EDGE", "RISE", "FALL", "DC", "AC", "AUTO", "NORMAL", "ONCE"):
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
CMD_Q = queue.Queue(maxsize=MAX_COMMANDS)
SET_LOCK = threading.RLock()
CONTROL_ID = None
AUTH_TOKEN = None
PENDING_CLIENTS = 0
DROPPED = 0

SET = {
    "ch": [
        {"on": True, "vdiv": 2.0, "coupling": "DC", "probe": 10},
        {"on": False, "vdiv": 2.0, "coupling": "DC", "probe": 10},
    ],
    "secdiv": 1e-3,
    "rate": 500_000,
    "trigger": {"ch": 1, "edge": "rise", "level": 1.0, "position": 0.2},
}
STATUS = {"device": "getrennt"}

SAMPLES = 5000            # Punkte je Aufnahme (Frame) des VDS1022
RATE_MIN, RATE_MAX = 2.5, 100_000_000   # Grenzen der vds1022-Lib (100 MS/s / Prescaler)


def pick_rate(secdiv):
    """Samplerate so waehlen, dass EINE Aufnahme (5000 Punkte) genau die 10 Divisionen
    der Anzeige fuellt. Dann ist jedes Bild der App eine einzelne, vom Geraet getriggerte
    Aufnahme - ohne Nahtstelle zwischen zwei Aufnahmen (Pulsbreiten springen sonst)."""
    window = secdiv * 10
    return max(RATE_MIN, min(RATE_MAX, SAMPLES / window))


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
        out = np.asarray(arr, dtype=np.float32)
        if out.ndim != 1 or not 0 < out.size <= MAX_SAMPLES or not np.isfinite(out).all():
            raise ValueError("invalid device samples")
        return out.copy()
    except Exception:
        return None


_dt_warned = False


def _dt(frames):
    """Sampleintervall: aus Frames (sx/hx/dt), sonst 1/gesetzte Rate."""
    global _dt_warned
    for name in ("sx", "hx", "dt"):
        v = getattr(frames, name, None)
        if isinstance(v, (int, float)) and math.isfinite(v) and v > 0:
            return float(v)
        ch = getattr(frames, "ch1", None)
        if ch is None:
            ch = getattr(frames, "ch2", None)
        v = getattr(ch, name, None) if ch is not None else None
        if isinstance(v, (int, float)) and math.isfinite(v) and v > 0:
            return float(v)
    if not _dt_warned:
        log.info("dt nicht aus Frames lesbar - nutze 1/Samplerate (%s S/s)", SET["rate"])
        _dt_warned = True
    return 1.0 / SET["rate"]


def apply_settings(dev):
    """Use the documented OWON API; failures force a clean reconnect, never a false ready status.

    VDS channels are acquired by the driver; channel on/off selects transmitted data.
    Both hardware channels retain their range/probe settings for fast switching.
    """
    with SET_LOCK:
        for i, chk in enumerate(("CH1", "CH2")):
            c = SET["ch"][i]
            pr = c["probe"]
            rng = min(50.0 * pr, max(0.05 * pr, c["vdiv"] * 10.0))
            dev.set_channel(NS.get(chk, i), range=vdiv_str(rng), probe="x%d" % pr,
                            offset=.5, coupling=NS.get(c["coupling"], c["coupling"]))
        wanted = pick_rate(SET["secdiv"])
        if callable(getattr(dev, "set_sampling", None)):
            dev.set_sampling(wanted)
        else:
            # set_timerange expects seconds, NOT samples per second.
            dev.set_timerange(SET["secdiv"] * 10)
        actual = getattr(dev, "sampling_rate", wanted)
        SET["rate"] = float(actual) if isinstance(actual, (int, float)) and math.isfinite(actual) and actual > 0 else wanted
        t = SET["trigger"]
        args = (NS.get("CH%d" % t["ch"], t["ch"] - 1), NS.get("EDGE", "edge"),
                NS.get("RISE" if t["edge"] == "rise" else "FALL", t["edge"]))
        dev.set_trigger(*args, sweep=NS.get("AUTO", 0), position=t["position"], level="%gv" % t["level"])


def drain_cmds(dev):
    with SET_LOCK:
        return _drain_cmds(dev)


def reject_settings():
    if LOOP is not None and not LOOP.is_closed():
        state = copy.deepcopy(SET)
        def notify():
            asyncio.create_task(broadcast_json({"cmd": "error", "code": "settings_rejected"}))
            asyncio.create_task(broadcast_json({"cmd": "settings", "rejected": True, "set": state}))
        LOOP.call_soon_threadsafe(notify)


def validate_settings():
    # Conservative supported trigger interval (driver ADC thresholds have a 10-count
    # hysteresis margin). These are protocol limits, never probe safety ratings.
    t = SET["trigger"]
    c = SET["ch"][t["ch"] - 1]
    rng = min(50 * c["probe"], max(.05 * c["probe"], c["vdiv"] * 10))
    if abs(t["level"]) > .46 * rng:
        raise ValueError("trigger outside selected input range")


def _drain_cmds(dev):
    previous = copy.deepcopy(SET)
    changed = False
    while True:
        try:
            owner, c = CMD_Q.get_nowait()
            if owner is not CONTROL_ID or owner is None:
                continue
            c = validate_command(c)
        except queue.Empty:
            break
        except (TypeError, ValueError):
            log.warning("Rejected invalid queued command")
            continue
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
            for f in ("ch", "edge", "level", "position"):
                if f in c:
                    SET["trigger"][f] = c[f]
            SET["trigger"]["position"] = min(0.9, max(0.05, float(SET["trigger"].get("position", 0.2))))
            changed = True
        elif k == "run":
            SINGLE.clear()
            RUNNING.set()
        elif k == "stop":
            SINGLE.clear()
            RUNNING.clear()
        elif k == "single":
            SINGLE.set()
            RUNNING.clear()
    if changed:
        try:
            validate_settings()
            if dev is not None:
                apply_settings(dev)
        except (ValueError, AssertionError):
            SET.clear()
            SET.update(previous)
            if dev is not None:
                apply_settings(dev)
            log.warning("Incompatible settings rejected; previous settings restored")
            reject_settings()
    return changed


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
            global DROPPED
            FRAME_Q.get_nowait()
            DROPPED += 1
            header["droppedOutbound"] = DROPPED
            FRAME_Q.put_nowait((header, ch1, ch2))
    if LOOP is not None and not LOOP.is_closed():
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
            await asyncio.wait_for(ws.send(msg), timeout=1)
        except Exception:
            await ws.close(code=1013, reason="Client cannot keep up")


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
                    await asyncio.wait_for(ws.send(bmsg), timeout=1)
                else:
                    if jmsg is None:
                        j = dict(header)
                        j["cmd"] = "frame"
                        j["ch1"] = ch1.tolist() if ch1 is not None else []
                        j["ch2"] = ch2.tolist() if ch2 is not None else []
                        jmsg = json.dumps(j, allow_nan=False)
                    await asyncio.wait_for(ws.send(jmsg), timeout=1)
            except Exception:
                await ws.close(code=1013, reason="Client cannot keep up")


async def pinger():
    while True:
        await asyncio.sleep(2)
        now = time.time()
        for ws in list(CLIENTS):
            try:
                CLIENTS[ws]["ping"] = now
                await asyncio.wait_for(ws.send(json.dumps({"cmd": "ping", "t": now})), timeout=1)
            except Exception:
                await ws.close(code=1013, reason="Client cannot keep up")


async def handler(ws, path=None):
    """Origin is checked at upgrade; auth is the first bounded message (never URL/query).

    One controller per bridge prevents conflicting device commands. Pairing lasts for
    this bridge process; the random token is entered from its local console each session.
    """
    global CONTROL_ID, PENDING_CLIENTS
    if PENDING_CLIENTS >= 4:
        await ws.close(code=1013, reason="Too many connections")
        return
    PENDING_CLIENTS += 1
    owner = object()
    try:
        await ws.send(json.dumps({"cmd": "auth_required", "protocol": 2}))
        try:
            raw = await asyncio.wait_for(ws.recv(), timeout=5)
            auth = json.loads(raw) if isinstance(raw, str) else None
            if (not isinstance(auth, dict) or set(auth) != {"cmd", "token"} or auth["cmd"] != "auth"
                or not isinstance(auth["token"], str) or len(auth["token"]) > 128
                or not AUTH_TOKEN or not secrets.compare_digest(auth["token"], AUTH_TOKEN)):
                raise ValueError("authentication failed")
        except (ValueError, TypeError, asyncio.TimeoutError):
            await ws.close(code=1008, reason="Authentication required")
            return
        if CONTROL_ID is not None:
            await ws.close(code=1013, reason="Another controller is connected")
            return
        CONTROL_ID = owner
        CLIENTS[ws] = {"binary": FORCE_BINARY == "on", "rtt": None}
        await ws.send(json.dumps({"cmd": "authenticated", "protocol": 2}))
        await ws.send(json.dumps({"cmd": "status", "device": STATUS["device"]}))
        with SET_LOCK:
            settings = copy.deepcopy(SET)
        await ws.send(json.dumps({"cmd": "settings", "set": settings}))
        count, start = 0, time.monotonic()
        async for raw in ws:
            now = time.monotonic()
            if now - start >= 1:
                count, start = 0, now
            count += 1
            if count > 100:
                await ws.close(code=1008, reason="Command rate limit")
                break
            try:
                if not isinstance(raw, str):
                    raise ValueError("JSON text required")
                c = validate_command(json.loads(raw))
                if c["cmd"] == "pong":
                    meta = CLIENTS[ws]
                    if c["t"] != meta.get("ping"):
                        raise ValueError("unsolicited pong")
                    rtt = max(0, time.time() - c["t"])
                    meta["rtt"] = rtt
                    if FORCE_BINARY == "auto":
                        if rtt > .1:
                            meta["binary"] = True
                        elif rtt < .05:
                            meta["binary"] = False
                    continue
                CMD_Q.put_nowait((owner, c))
            except (ValueError, TypeError, queue.Full):
                # Never echo raw input, tokens, driver exceptions or device identifiers.
                await ws.send(json.dumps({"cmd": "error", "code": "invalid_or_busy"}))
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        PENDING_CLIENTS -= 1
        CLIENTS.pop(ws, None)
        if CONTROL_ID is owner:
            CONTROL_ID = None
            RUNNING.clear()
            SINGLE.clear()
        log.info("Client disconnected (%d authenticated)", len(CLIENTS))


# ---------------- Geraetethread ----------------
def frames_source(dev, fps):
    it = getattr(dev, "fetch_iter", None)
    if it is not None:
        try:
            inspect.signature(it).bind(freq=fps)
        except TypeError:
            source = it()
        else:
            source = it(freq=fps)
        yield from source
        return
    while True:
        yield dev.fetch()
        time.sleep(1.0 / max(fps, 1))


def device_worker(fps):
    sequence = 0
    while not STOP.is_set():
        if VDS is None:
            set_status("lib fehlt")
            drain_cmds(None)
            STOP.wait(1)
            continue
        dev = None
        try:
            dev = VDS(debug=0)
            drain_cmds(None)
            apply_settings(dev)
            set_status("verbunden")
            for frames in frames_source(dev, fps):
                if STOP.is_set():
                    break
                if drain_cmds(dev):
                    # The frame was acquired BEFORE the new settings. Discard it.
                    continue
                if not RUNNING.is_set() and not SINGLE.is_set():
                    continue
                ch1 = _volts(getattr(frames, "ch1", None)) if SET["ch"][0]["on"] else None
                ch2 = _volts(getattr(frames, "ch2", None)) if SET["ch"][1]["on"] else None
                if ch1 is None and ch2 is None:
                    continue
                sequence += 1
                header = {
                    "sequence": sequence, "source": "owon-vds1022",
                    "quality": {"discontinuous": True, "calibrationVerified": False},
                    "sampleRateHz": 1 / _dt(frames),
                    "measurementRangeVolts": [float(dev.voltrange[i] * dev.probe[i])
                        if hasattr(dev, "voltrange") and hasattr(dev, "probe") else None for i in range(2)],
                    "droppedOutbound": DROPPED,
                    "t": time.time(),
                    "dt": _dt(frames),
                    "range": [SET["ch"][0]["vdiv"], SET["ch"][1]["vdiv"]],
                    # y() der Lib liefert bereits Volt am Tastkopf (Tastkopffaktor eingerechnet):
                    # die App darf NICHT noch einmal mit dem Faktor multiplizieren -> probe [1, 1].
                    "probe": [1, 1],
                    "probeUi": [SET["ch"][0]["probe"], SET["ch"][1]["probe"]],
                    "trig": float(SET["trigger"].get("position", 0.2)),   # Lage des Geraete-Triggers im Frame (0..1)
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
                if dev is not None:
                    if hasattr(dev, "dispose"):
                        dev.dispose()
                    elif hasattr(dev, "stop"):
                        dev.stop()
            except Exception:
                pass
        set_status("kein Geraet")
        STOP.wait(1)


async def main(port, fps, origins=DEFAULT_ORIGINS):
    global FRAME_Q, LOOP, AUTH_TOKEN
    LOOP = asyncio.get_running_loop()
    FRAME_Q = asyncio.Queue(maxsize=2)
    AUTH_TOKEN = secrets.token_urlsafe(32)
    print("Lokaler Kopplungscode (nur in der App eingeben): " + AUTH_TOKEN, flush=True)
    worker = threading.Thread(target=device_worker, args=(fps,), daemon=True)
    worker.start()
    try:
        async with websockets.serve(handler, "127.0.0.1", port, origins=list(origins),
                                    max_size=MAX_MESSAGE, max_queue=8,
                                    ping_interval=20, ping_timeout=10, close_timeout=2,
                                    compression=None):
            log.info("Bridge: ws://127.0.0.1:%d, explicit origins: %s", port, origins)
            await asyncio.gather(sender(), pinger())
    finally:
        STOP.set()
        await asyncio.to_thread(worker.join, 3)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="OWON VDS1022 authenticated local WebSocket bridge")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--binary", choices=("auto", "on", "off"), default="auto")
    ap.add_argument("--fps", type=int, default=20)
    ap.add_argument("--allow-origin", action="append", default=[],
                    help="Additional exact local HTTP(S) origin (repeatable; no wildcards)")
    a = ap.parse_args()
    if not 1 <= a.port <= 65535 or not 1 <= a.fps <= 100:
        ap.error("port 1..65535, fps 1..100 required")
    for origin in a.allow_origin:
        u = urlsplit(origin)
        if (u.scheme not in ("http", "https") or u.hostname not in ("localhost", "127.0.0.1", "::1")
            or u.username or u.password or u.path or u.query or u.fragment):
            ap.error("only exact loopback HTTP(S) origins allowed")
    FORCE_BINARY = a.binary
    try:
        asyncio.run(main(a.port, a.fps, (*DEFAULT_ORIGINS, *a.allow_origin)))
    except KeyboardInterrupt:
        STOP.set()
        log.info("Beendet.")
