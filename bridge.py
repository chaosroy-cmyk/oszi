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
  Sweep AUTO (Standard): frei bzw. getriggert; run/stop/single entscheidet die Bridge,
  welche Frames weitergehen. single = naechstes vollstaendiges Bild.
  Sweep NORMAL: das Geraet liefert nur getriggerte Bilder; single wartet auf das Ereignis.

Erweiterungen V13.7 (nur was die vds1022-Lib dokumentiert; "features" in "authenticated"):
  {"cmd":"channel",...,"offset":-0.3}          Nulllage des Eingangsfensters (Anteil der 10 Div.)
  {"cmd":"timebase","secdiv":..,"peak":true}   Spitzenwert-Erfassung
  {"cmd":"trigger",...,"mode":"edge|pulse|slope","cond":"gt|eq|lt","width":s,"level2":V,
   "holdoff":s,"sweep":"auto|normal","ext":true}
  {"cmd":"record","duration":s,"rate":S/s,"trigger":true,"pre":s}   lueckenlose Aufnahme (Roll-
   Modus der Lib, bis ca. 100 kS/s); Ergebnis ist EIN Frame mit "long":true, immer binaer.
  {"cmd":"autoset"}                             Bereich/Zeitbasis automatisch, Triggerpegel Signalmitte
  Frame-Header zusaetzlich: "freqHz":[f1,f2] (Frequenzzaehler des Geraets), "roll", "peak", "sweep".
  NICHT angeboten: Kalibrieren/Flash schreiben (wuerde Werksdaten im Geraet aendern).

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
from bridge_protocol import (validate_command, DEFAULT_ORIGINS, MAX_MESSAGE, MAX_SAMPLES, MAX_COMMANDS, FEATURES)

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
    for k in ("CH1", "CH2", "EXT", "EDGE", "PULSE", "SLOPE", "RISE", "FALL",
              "RISE_SUP", "RISE_EQU", "RISE_INF", "FALL_SUP", "FALL_EQU", "FALL_INF",
              "DC", "AC", "AUTO", "NORMAL", "ONCE"):
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
# Der Geraetethread kann im Treiber blockieren (Sweep NORMAL wartet auf den Trigger, lange
# Aufnahme). Andere Threads beenden das ueber dev.stop() - den dokumentierten Abbruch der Lib.
WAKE = threading.Event()         # Befehl eingetroffen / Zustand geaendert
WAITING = threading.Event()      # Geraetethread steckt in einem blockierenden Treiberaufruf
INTERRUPTED = threading.Event()  # dieser Aufruf wurde von uns abgebrochen (kein Geraetefehler)
DEV_LOCK = threading.Lock()      # serialisiert dev.stop() gegen den Geraetethread
DEV = {"dev": None}
PENDING = {"record": None, "autoset": False}
CONTROL_ID = None
AUTH_TOKEN = None
PENDING_CLIENTS = 0
DROPPED = 0

SET = {
    "ch": [
        {"on": True, "vdiv": 2.0, "coupling": "DC", "probe": 10, "offset": 0.0},
        {"on": False, "vdiv": 2.0, "coupling": "DC", "probe": 10, "offset": 0.0},
    ],
    "secdiv": 1e-3,
    "rate": 500_000,
    "peak": False,
    "trigger": {"ch": 1, "edge": "rise", "level": 1.0, "position": 0.2,
                "mode": "edge", "cond": "gt", "width": 1e-3, "level2": 0.0,
                "holdoff": 100e-9, "sweep": "auto", "ext": False},
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


def _chan(frames, i):
    """Kanal i aus dem Frames-Objekt der Lib; ausgeschaltete Kanaele liefern None (die
    Attribute ch1/ch2 der Lib werfen dann AssertionError)."""
    try:
        if isinstance(frames, tuple):
            return tuple.__getitem__(frames, i)
        return getattr(frames, "ch%d" % (i + 1), None)
    except Exception:
        return None


def apply_trigger(dev, sweep=None):
    """Trigger laut SET an die Lib geben. sweep ueberschreibt SET (ONCE fuer getriggerte Aufnahme)."""
    t = SET["trigger"]
    mode = t.get("mode", "edge")
    rise = t["edge"] == "rise"
    source = NS.get("EXT", "EXT") if t.get("ext") else NS.get("CH%d" % t["ch"], t["ch"] - 1)
    if mode == "edge":
        cond = NS.get("RISE" if rise else "FALL", t["edge"])
        level = "%gv" % t["level"]
    else:
        name = ("RISE_" if rise else "FALL_") + {"gt": "SUP", "eq": "EQU", "lt": "INF"}[t.get("cond", "gt")]
        cond = NS.get(name, name)
        level = (float(t["level"]), float(t["level2"])) if mode == "slope" else "%gv" % t["level"]
    sweep_name = (sweep or t.get("sweep", "auto")).upper()
    kw = {"sweep": NS.get(sweep_name, {"AUTO": 0, "NORMAL": 1, "ONCE": 2}[sweep_name]),
          "position": t["position"], "level": level}
    if mode != "edge":
        kw["width"] = float(t["width"])
    if abs(float(t.get("holdoff", 100e-9)) - 100e-9) > 1e-12:
        kw["holdoff"] = float(t["holdoff"])
    dev.set_trigger(source, NS.get(mode.upper(), mode), cond, **kw)


def apply_settings(dev, rate=None, sweep=None):
    """Use the documented OWON API; failures force a clean reconnect, never a false ready status.

    VDS channels are acquired by the driver; channel on/off selects transmitted data.
    Both hardware channels retain their range/probe settings for fast switching.

    rate/sweep ueberschreiben SET fuer die lange Aufnahme. Die Reihenfolge Kanaele -> Abtastung ->
    Trigger bleibt immer gleich: Die Lib schaltet in den Alternate-Trigger, wenn set_trigger zweimal
    direkt hintereinander ohne anderen Befehl dazwischen aufgerufen wird (vds1022.py, set_trigger).
    """
    with SET_LOCK:
        for i, chk in enumerate(("CH1", "CH2")):
            c = SET["ch"][i]
            pr = c["probe"]
            rng = min(50.0 * pr, max(0.05 * pr, c["vdiv"] * 10.0))
            # offset: Nulllage im Eingangsfenster (0.5 = Mitte). Mit verschobener Nulllage nutzt ein
            # einseitiges Signal (z. B. 0..14 V) den 8-Bit-Wandler besser aus.
            dev.set_channel(NS.get(chk, i), range=vdiv_str(rng), probe="x%d" % pr,
                            offset=.5 + float(c.get("offset", 0.0)), coupling=NS.get(c["coupling"], c["coupling"]))
        wanted = rate if rate is not None else pick_rate(SET["secdiv"])
        if callable(getattr(dev, "set_sampling", None)):
            if SET.get("peak"):
                dev.set_sampling(wanted, peak=True)
            else:
                dev.set_sampling(wanted)      # Standard der Lib: peak=False
        else:
            # set_timerange expects seconds, NOT samples per second.
            dev.set_timerange(SET["secdiv"] * 10)
        actual = getattr(dev, "sampling_rate", wanted)
        if rate is None:
            SET["rate"] = float(actual) if isinstance(actual, (int, float)) and math.isfinite(actual) and actual > 0 else wanted
        apply_trigger(dev, sweep)


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
    mode = t.get("mode", "edge")
    if t.get("ext"):
        if mode != "edge":
            raise ValueError("external trigger supports edge mode only")
        return
    c = SET["ch"][t["ch"] - 1]
    rng = min(50 * c["probe"], max(.05 * c["probe"], c["vdiv"] * 10))
    off = float(c.get("offset", 0.0))
    levels = [t["level"]] + ([t["level2"]] if mode == "slope" else [])
    for level in levels:
        # der Pegel muss im Eingangsfenster liegen (Fenster = rng, Nulllage um off verschoben)
        if abs(level / rng + off) > .46:
            raise ValueError("trigger outside selected input range")
    if mode == "slope" and t["level"] == t["level2"]:
        raise ValueError("slope trigger needs two different levels")


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
            for f in ("on", "vdiv", "coupling", "probe", "offset"):
                if f in c:
                    SET["ch"][i][f] = c[f]
            changed = True
        elif k == "timebase":
            SET["secdiv"] = float(c.get("secdiv", SET["secdiv"]))
            SET["rate"] = pick_rate(SET["secdiv"])
            if "peak" in c:
                SET["peak"] = c["peak"]
            changed = True
        elif k == "trigger":
            for f in ("ch", "edge", "level", "position", "mode", "cond", "width", "level2", "holdoff", "sweep", "ext"):
                if f in c:
                    SET["trigger"][f] = c[f]
            SET["trigger"]["position"] = min(0.9, max(0.05, float(SET["trigger"].get("position", 0.2))))
            changed = True
        elif k == "run":
            SINGLE.clear()
            RUNNING.set()
            PENDING["record"] = None
        elif k == "stop":
            SINGLE.clear()
            RUNNING.clear()
            PENDING["record"] = None
        elif k == "record":
            PENDING["record"] = c
        elif k == "autoset":
            PENDING["autoset"] = True
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
            # Lange Aufnahmen waeren als JSON mehrere MB gross -> immer binaer.
            use_bin = FORCE_BINARY == "on" or (FORCE_BINARY == "auto" and meta.get("binary")) or bool(header.get("long"))
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
        await ws.send(json.dumps({"cmd": "authenticated", "protocol": 2, "features": list(FEATURES)}))
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
                interrupt_device()
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
            PENDING["record"] = None
            PENDING["autoset"] = False
            interrupt_device()
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


def notify(obj):
    """Vom Geraetethread: Statusmeldung threadsicher an die App."""
    if LOOP is not None and not LOOP.is_closed():
        LOOP.call_soon_threadsafe(lambda: asyncio.ensure_future(broadcast_json(obj)))


def interrupt_device():
    """Von anderen Threads: Geraetethread wecken und einen blockierenden Treiberaufruf beenden.

    dev.stop() ist der dokumentierte Abbruch der Lib (setzt ihr Stop-Signal, der laufende
    Generator bzw. read() kehrt zurueck, das Geraet bleibt verbunden)."""
    WAKE.set()
    if not WAITING.is_set():
        return

    def run():
        with DEV_LOCK:
            dev = DEV["dev"]
            stop = getattr(dev, "stop", None)
            if dev is None or not WAITING.is_set() or not callable(stop):
                return
            INTERRUPTED.set()
            try:
                stop()
            except Exception as e:
                log.warning("Abbruch fehlgeschlagen: %s", e)
    threading.Thread(target=run, daemon=True).start()


def _blocking(call):
    """Treiberaufruf, der lange dauern darf; True, wenn er von interrupt_device beendet wurde."""
    WAITING.set()
    try:
        return call()
    finally:
        WAITING.clear()
        with DEV_LOCK:      # ein gerade laufendes dev.stop() abwarten, bevor der Treiber wieder benutzt wird
            pass


def frame_header(dev, frames, sequence, n1, n2, dt):
    freq = []
    for i in range(2):
        f = getattr(_chan(frames, i), "frequency", None)
        freq.append(float(f) if isinstance(f, (int, float)) and math.isfinite(f) and f > 0 else None)
    return {
        "sequence": sequence, "source": "owon-vds1022",
        "quality": {"discontinuous": True, "calibrationVerified": False},
        "sampleRateHz": 1 / dt,
        "measurementRangeVolts": [float(dev.voltrange[i] * dev.probe[i])
            if hasattr(dev, "voltrange") and hasattr(dev, "probe") else None for i in range(2)],
        "droppedOutbound": DROPPED,
        "t": time.time(),
        "dt": dt,
        "range": [SET["ch"][0]["vdiv"], SET["ch"][1]["vdiv"]],
        # y() der Lib liefert bereits Volt am Tastkopf (Tastkopffaktor eingerechnet):
        # die App darf NICHT noch einmal mit dem Faktor multiplizieren -> probe [1, 1].
        "probe": [1, 1],
        "probeUi": [SET["ch"][0]["probe"], SET["ch"][1]["probe"]],
        "trig": float(SET["trigger"].get("position", 0.2)),   # Lage des Geraete-Triggers im Frame (0..1)
        "n1": n1, "n2": n2,
        "freqHz": freq,                                         # Frequenzzaehler des Geraets (None = kein Wert)
        "roll": bool(getattr(dev, "rollmode", False)),
        "peak": bool(SET.get("peak")),
        "sweep": SET["trigger"].get("sweep", "auto"),
    }


def do_record(dev, req, sequence):
    """Lueckenlose Aufnahme ueber read() der Lib (Roll-Modus). Liefert EINEN langen Frame.

    Danach werden die normalen Einstellungen wieder angewendet; die Bridge bleibt gestoppt.
    AssertionError der Lib (z. B. "Missed some samples") gilt als gescheiterte Aufnahme,
    nicht als Geraeteausfall."""
    read = getattr(dev, "read", None)
    if not callable(read):
        notify({"cmd": "record", "state": "failed", "code": "unsupported"})
        return sequence
    duration, rate = float(req["duration"]), float(req["rate"])
    trig = bool(req.get("trigger"))
    pre = float(req.get("pre", 0.0)) if trig else 0.0
    notify({"cmd": "record", "state": "waiting" if trig else "running", "duration": duration, "rate": rate})
    frames, actual, failed = None, rate, None
    try:
        with SET_LOCK:
            on = [bool(c["on"]) for c in SET["ch"]]
            apply_settings(dev, rate=rate, sweep="once" if trig else "auto")
            if isinstance(getattr(dev, "on", None), list) and any(on):
                dev.on[0], dev.on[1] = on        # nur die gewuenschten Kanaele: mehr Durchsatz
        try:
            frames = _blocking(lambda: read(duration, pre) if trig else read(duration))
            actual = float(getattr(dev, "sampling_rate", rate) or rate)
        except AssertionError as e:
            failed = "missed" if "issed" in str(e) else "driver"
            log.warning("Aufnahme abgebrochen: %s", e)
    finally:
        INTERRUPTED.clear()
        with SET_LOCK:
            apply_settings(dev)                  # Zeitbasis, Kanaele und Trigger wie vorher
    RUNNING.clear()
    SINGLE.clear()
    if failed:
        notify({"cmd": "record", "state": "failed", "code": failed})
        return sequence
    if frames is None:
        notify({"cmd": "record", "state": "aborted"})
        return sequence
    arrays = []
    for i in range(2):
        ch = _chan(frames, i) if on[i] else None
        y = getattr(ch, "y", None)
        try:
            arr = np.asarray(y() if callable(y) else ch, dtype=np.float32) if ch is not None else None
            if arr is not None and (arr.ndim != 1 or arr.size == 0 or not np.isfinite(arr).all()):
                arr = None
        except Exception:
            arr = None
        arrays.append(arr)
    sizes = [a.size for a in arrays if a is not None]
    if not sizes:
        notify({"cmd": "record", "state": "failed", "code": "empty"})
        return sequence
    n = min(min(sizes), MAX_SAMPLES)             # Kanaele gleich lang, Protokollgrenze einhalten
    ch1, ch2 = [a[:n].copy() if a is not None else None for a in arrays]
    dt = 1.0 / actual
    sequence += 1
    header = frame_header(dev, frames, sequence, n if ch1 is not None else 0, n if ch2 is not None else 0, dt)
    header.update({
        "long": True, "roll": True,
        "quality": {"discontinuous": False, "calibrationVerified": False},
        "trig": min(1.0, max(0.0, pre / (n * dt))) if trig else 0.0,
        "recordTriggered": trig,
    })
    offer(header, ch1, ch2)
    notify({"cmd": "record", "state": "done", "samples": n, "rate": actual})
    return sequence


def do_autoset(dev):
    """autoset() der Lib waehlt Messbereich und Zeitbasis; den Triggerpegel legen wir danach
    auf die Signalmitte einer frischen Aufnahme (die Lib merkt sich ihren Pegel nicht in Volt)."""
    fn = getattr(dev, "autoset", None)
    if not callable(fn):
        notify({"cmd": "error", "code": "autoset_failed"})
        return
    previous = copy.deepcopy(SET)
    try:
        _blocking(fn)
        INTERRUPTED.clear()
        with SET_LOCK:
            for i in range(2):
                c = SET["ch"][i]
                c["vdiv"] = max(.01, float(dev.voltrange[i]) * c["probe"] / 10)
                c["offset"] = 0.0
                c["on"] = bool(dev.on[i])
            if not any(c["on"] for c in SET["ch"]):
                SET["ch"][0]["on"] = True
            rate = float(dev.sampling_rate)
            SET["secdiv"] = min(200.0, max(1e-6, SAMPLES / rate / 10))
            SET["peak"] = False
            t = SET["trigger"]
            t.update({"mode": "edge", "ext": False, "sweep": "auto", "edge": "rise", "level": 0.0,
                      "ch": 1 if SET["ch"][0]["on"] else 2})
            apply_settings(dev)
            fetch = getattr(dev, "fetch", None)
            arr = _volts(_chan(fetch(), t["ch"] - 1)) if callable(fetch) else None
            if arr is not None and arr.size:
                t["level"] = float("%.3g" % ((float(arr.min()) + float(arr.max())) / 2))
                validate_settings()
                apply_settings(dev)
            state = copy.deepcopy(SET)
        notify({"cmd": "settings", "applied": True, "set": state})
    except (AssertionError, ValueError, AttributeError, TypeError, IndexError) as e:
        log.warning("Autoset fehlgeschlagen: %s", e)
        with SET_LOCK:
            SET.clear()
            SET.update(previous)
            apply_settings(dev)
        notify({"cmd": "error", "code": "autoset_failed"})


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
            DEV["dev"] = dev
            drain_cmds(None)
            apply_settings(dev)
            set_status("verbunden")
            source = None
            while not STOP.is_set():
                if drain_cmds(dev):
                    source = None            # neue Einstellungen: Aufnahmeschleife der Lib neu beginnen
                if PENDING["autoset"]:
                    PENDING["autoset"] = False
                    do_autoset(dev)
                    source = None
                    continue
                req = PENDING["record"]
                if req is not None:
                    PENDING["record"] = None
                    sequence = do_record(dev, req, sequence)
                    source = None
                    continue
                if not RUNNING.is_set() and not SINGLE.is_set():
                    # Gestoppt: nichts abholen (im Sweep NORMAL wuerde der Abruf auf den Trigger warten).
                    source = None
                    WAKE.wait(.05)
                    WAKE.clear()
                    continue
                if source is None:
                    source = frames_source(dev, fps)
                try:
                    if SET["trigger"].get("sweep", "auto") != "auto":
                        frames = _blocking(lambda: next(source))
                    else:
                        frames = next(source)
                except StopIteration:
                    source = None
                    if INTERRUPTED.is_set():     # von uns beendet (Befehl waehrend des Wartens)
                        INTERRUPTED.clear()
                        continue
                    raise RuntimeError("Datenstrom des Treibers beendet")
                INTERRUPTED.clear()
                if STOP.is_set():
                    break
                if drain_cmds(dev):
                    # The frame was acquired BEFORE the new settings. Discard it.
                    source = None
                    continue
                if not RUNNING.is_set() and not SINGLE.is_set():
                    continue
                ch1 = _volts(_chan(frames, 0)) if SET["ch"][0]["on"] else None
                ch2 = _volts(_chan(frames, 1)) if SET["ch"][1]["on"] else None
                if ch1 is None and ch2 is None:
                    continue
                sequence += 1
                header = frame_header(dev, frames, sequence, int(len(ch1)) if ch1 is not None else 0,
                                      int(len(ch2)) if ch2 is not None else 0, _dt(frames))
                offer(header, ch1, ch2)
                if SINGLE.is_set():
                    SINGLE.clear()
        except Exception as e:
            log.warning("Geraetefehler: %s", e)
        finally:
            DEV["dev"] = None
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
        interrupt_device()
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
