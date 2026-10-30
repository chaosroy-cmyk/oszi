"""Hardware-independent V13.5 command boundary. No USB or network side effects."""
import math

MAX_MESSAGE = 4096
MAX_SAMPLES = 262144
MAX_COMMANDS = 128
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
        'channel': {'cmd', 'ch', 'on', 'vdiv', 'coupling', 'probe'},
        'timebase': {'cmd', 'secdiv'},
        'trigger': {'cmd', 'ch', 'edge', 'level', 'position'},
        'run': {'cmd'}, 'stop': {'cmd'}, 'single': {'cmd'},
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
    elif kind == 'timebase':
        number(c.get('secdiv'), 1e-6, 200)
    elif kind == 'trigger':
        if len(c) < 3:
            raise ValueError('trigger setting required')
        if 'edge' in c and c['edge'] not in ('rise', 'fall'):
            raise ValueError('invalid edge')
        if 'level' in c:
            number(c['level'], -5000, 5000)
        if 'position' in c:
            number(c['position'], .05, .9)
    elif kind == 'pong':
        number(c.get('t'), 0, 1e12)
    return dict(c)
