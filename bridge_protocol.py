"""Hardware-independent command boundary (V13.5, extended in V13.7). No USB or network side effects."""
import math

MAX_MESSAGE = 4096
MAX_SAMPLES = 262144
MAX_COMMANDS = 128
# Capabilities announced to the app after authentication. The app only sends the extended
# fields/commands when the bridge lists the matching feature (older bridges reject unknown fields).
FEATURES = ('trigger2', 'sweep', 'ext', 'offset', 'peak', 'record', 'autoset', 'freq', 'slow')
RECORD_MAX_RATE = 100_000      # driver documents ~100 kS/s as the limit for gap-free reading
RECORD_MAX_SECONDS = 600
DEFAULT_ORIGINS = (
    'http://localhost:8080', 'http://127.0.0.1:8080',
    'http://localhost:8000', 'http://127.0.0.1:8000',
)


def number(value, low, high):
    if type(value) not in (int, float) or not math.isfinite(value) or not low <= value <= high:
        raise ValueError('numeric value out of range')
    return value


def validate_command(c):
    """Return a new, strictly typed command, or reject before entering the USB queue.

    These are software limits, NOT a declaration of safe probe/input voltages.
    Driver range selection and all physical safety limits remain independent.
    """
    if type(c) is not dict or type(c.get('cmd')) is not str:
        raise ValueError('command object required')
    kind = c['cmd']
    fields = {
        'channel': {'cmd', 'ch', 'on', 'vdiv', 'coupling', 'probe', 'offset'},
        'timebase': {'cmd', 'secdiv', 'peak'},
        'trigger': {'cmd', 'ch', 'edge', 'level', 'position',
                    'mode', 'cond', 'width', 'level2', 'holdoff', 'sweep', 'ext'},
        'run': {'cmd'}, 'stop': {'cmd'}, 'single': {'cmd'},
        'record': {'cmd', 'duration', 'rate', 'trigger', 'pre'},
        'autoset': {'cmd'},
        'pong': {'cmd', 't'},
    }
    if kind not in fields or set(c) - fields[kind]:
        raise ValueError('unknown command or fields')
    if kind in ('channel', 'trigger'):
        if type(c.get('ch')) is not int or c['ch'] not in (1, 2):
            raise ValueError('channel must be 1 or 2')
    if kind == 'channel':
        if len(c) < 3:
            raise ValueError('channel setting required')
        if 'on' in c and type(c['on']) is not bool:
            raise ValueError('on must be boolean')
        if 'vdiv' in c:
            number(c['vdiv'], .005, 500)
        if 'coupling' in c and c['coupling'] not in ('AC', 'DC'):
            raise ValueError('invalid coupling')
        if 'probe' in c and (type(c['probe']) is not int or c['probe'] not in (1, 10, 100)):
            raise ValueError('invalid probe')
        if 'offset' in c:
            # zero position of the input window as a fraction of the 10 divisions (0 = centre)
            number(c['offset'], -.4, .4)
    elif kind == 'timebase':
        number(c.get('secdiv'), 1e-6, 200)
        if 'peak' in c and type(c['peak']) is not bool:
            raise ValueError('peak must be boolean')
    elif kind == 'trigger':
        if len(c) < 3:
            raise ValueError('trigger setting required')
        if 'edge' in c and c['edge'] not in ('rise', 'fall'):
            raise ValueError('invalid edge')
        if 'level' in c:
            number(c['level'], -5000, 5000)
        if 'position' in c:
            number(c['position'], .05, .9)
        if 'mode' in c and c['mode'] not in ('edge', 'pulse', 'slope'):
            raise ValueError('invalid trigger mode')
        if 'cond' in c and c['cond'] not in ('gt', 'eq', 'lt'):
            raise ValueError('invalid trigger condition')
        if 'width' in c:
            number(c['width'], 30e-9, 10)
        if 'level2' in c:
            number(c['level2'], -5000, 5000)
        if 'holdoff' in c:
            number(c['holdoff'], 100e-9, 10)
        if 'sweep' in c and c['sweep'] not in ('auto', 'normal'):
            raise ValueError('invalid sweep')
        if 'ext' in c and type(c['ext']) is not bool:
            raise ValueError('ext must be boolean')
    elif kind == 'record':
        duration = number(c.get('duration'), .01, RECORD_MAX_SECONDS)
        rate = number(c.get('rate'), 100, RECORD_MAX_RATE)
        if not 50 <= duration * rate <= MAX_SAMPLES:
            raise ValueError('record length out of range')
        if 'trigger' in c and type(c['trigger']) is not bool:
            raise ValueError('trigger must be boolean')
        if 'pre' in c:
            if not c.get('trigger'):
                raise ValueError('pre-trigger time needs a trigger')
            number(c['pre'], 0, duration)
            if (duration + c['pre']) * rate > MAX_SAMPLES:
                raise ValueError('record length out of range')
    elif kind == 'pong':
        number(c.get('t'), 0, 1e12)
    return dict(c)
