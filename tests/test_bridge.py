"""Protocol and loopback integration tests. Fake USB is explicit; no hardware claims."""
import asyncio
import copy
import importlib.util
import json
import pathlib
import queue
import sys
import threading
import unittest
from types import SimpleNamespace

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import numpy as np
import websockets
import bridge as b
from bridge_protocol import validate_command, MAX_MESSAGE, DEFAULT_ORIGINS

INITIAL = copy.deepcopy(b.SET)


class ProtocolTests(unittest.TestCase):
    def setUp(self):
        b.SET = copy.deepcopy(INITIAL)
        b.CONTROL_ID = object()
        b.SINGLE.clear()
        b.RUNNING.set()
        b.STOP.clear()
        while not b.CMD_Q.empty():
            b.CMD_Q.get_nowait()
        # Diese Tests pruefen die Bridge ohne Treiber: Konstanten der Lib ausblenden,
        # auch wenn das Modul vds1022 auf diesem Rechner installiert ist.
        self._ns = b.NS
        b.NS = {}

    def tearDown(self):
        b.NS = self._ns

    def test_strict_commands(self):
        bad = [None, [], 'run', {'cmd': 'exec'}, {'cmd': 'run', 'extra': 1},
               {'cmd': 'channel', 'ch': True, 'on': True},
               {'cmd': 'channel', 'ch': 3, 'on': True},
               {'cmd': 'channel', 'ch': 1, 'on': 'false'},
               {'cmd': 'channel', 'ch': 1, 'vdiv': float('nan')},
               {'cmd': 'channel', 'ch': 1, 'probe': 1000},
               {'cmd': 'channel', 'ch': 1, 'coupling': 'GND'},
               {'cmd': 'timebase', 'secdiv': 0}, {'cmd': 'timebase', 'secdiv': float('inf')},
               {'cmd': 'trigger', 'ch': 1, 'position': 2},
               {'cmd': 'trigger', 'ch': 1, 'edge': 'both'},
               {'cmd': 'trigger', 'ch': 1, 'level': '1'}, {'cmd': 'pong', 't': []}]
        for value in bad:
            with self.subTest(value=value), self.assertRaises(ValueError):
                validate_command(value)
        for value in [{'cmd': 'run'}, {'cmd': 'stop'}, {'cmd': 'single'},
                      {'cmd': 'channel', 'ch': 2, 'on': False, 'probe': 100, 'vdiv': .01},
                      {'cmd': 'timebase', 'secdiv': .001},
                      {'cmd': 'trigger', 'ch': 1, 'edge': 'fall', 'position': .2, 'level': -2}]:
            self.assertEqual(validate_command(value), value)

    def test_extended_commands_are_strict(self):
        good = [{'cmd': 'channel', 'ch': 1, 'offset': -.4},
                {'cmd': 'timebase', 'secdiv': .001, 'peak': True},
                {'cmd': 'trigger', 'ch': 2, 'mode': 'pulse', 'cond': 'gt', 'width': 5.7e-4, 'edge': 'fall',
                 'sweep': 'normal', 'holdoff': .001, 'ext': False},
                {'cmd': 'trigger', 'ch': 1, 'mode': 'slope', 'level': 4, 'level2': 1, 'width': .01, 'cond': 'lt'},
                {'cmd': 'record', 'duration': 2.6, 'rate': 100000},
                {'cmd': 'record', 'duration': 1, 'rate': 50000, 'trigger': True, 'pre': .5},
                {'cmd': 'autoset'}]
        for value in good:
            self.assertEqual(validate_command(value), value)
        bad = [{'cmd': 'channel', 'ch': 1, 'offset': .41}, {'cmd': 'channel', 'ch': 1, 'offset': '0'},
               {'cmd': 'timebase', 'secdiv': .001, 'peak': 1}, {'cmd': 'timebase', 'peak': True},
               {'cmd': 'trigger', 'ch': 1, 'mode': 'video'}, {'cmd': 'trigger', 'ch': 1, 'cond': 'ge'},
               {'cmd': 'trigger', 'ch': 1, 'width': 0}, {'cmd': 'trigger', 'ch': 1, 'width': 11},
               {'cmd': 'trigger', 'ch': 1, 'holdoff': 1e-9}, {'cmd': 'trigger', 'ch': 1, 'sweep': 'once'},
               {'cmd': 'trigger', 'ch': 1, 'ext': 'yes'}, {'cmd': 'trigger', 'ch': 1, 'level2': float('nan')},
               {'cmd': 'record', 'duration': 3, 'rate': 100000},          # > 262144 Punkte
               {'cmd': 'record', 'duration': 1, 'rate': 200000},          # ueber der Grenze der Lib
               {'cmd': 'record', 'duration': .01, 'rate': 100},           # < 50 Punkte
               {'cmd': 'record', 'duration': 1, 'rate': 1000, 'pre': .2}, # Vorlauf ohne Trigger
               {'cmd': 'record', 'duration': 1, 'rate': 1000, 'trigger': True, 'pre': 2},
               {'cmd': 'record', 'duration': 2, 'rate': 100000, 'trigger': True, 'pre': 1},
               {'cmd': 'record', 'rate': 1000}, {'cmd': 'autoset', 'ch': 1},
               {'cmd': 'calibrate'}, {'cmd': 'write_flash'}, {'cmd': 'flash'}]
        for value in bad:
            with self.subTest(value=value), self.assertRaises(ValueError):
                validate_command(value)

    def test_extended_settings_reach_the_driver_calls(self):
        calls = {}
        class Dev:
            sampling_rate = 500000
            def set_channel(self, *a, **kw): calls.setdefault('ch', []).append(kw)
            def set_sampling(self, *a, **kw): calls['sampling'] = (a, kw)
            def set_trigger(self, *a, **kw): calls['trigger'] = (a, kw)
        for c in ({'cmd': 'channel', 'ch': 1, 'offset': -.3, 'vdiv': 2.0},
                  {'cmd': 'timebase', 'secdiv': .001, 'peak': True},
                  {'cmd': 'trigger', 'ch': 1, 'mode': 'pulse', 'cond': 'gt', 'width': 5.7e-4, 'edge': 'fall',
                   'level': 6.0, 'sweep': 'normal', 'holdoff': .002}):
            b.CMD_Q.put((b.CONTROL_ID, c))
        self.assertTrue(b.drain_cmds(Dev()))
        self.assertAlmostEqual(calls['ch'][0]['offset'], .2)
        self.assertEqual(calls['sampling'][1], {'peak': True})
        args, kw = calls['trigger']
        self.assertEqual(args[1:], ('pulse', 'FALL_SUP'))
        self.assertEqual((kw['sweep'], kw['width'], kw['holdoff']), (1, 5.7e-4, .002))
        b.CMD_Q.put((b.CONTROL_ID, {'cmd': 'timebase', 'secdiv': .001, 'peak': False}))
        b.CMD_Q.put((b.CONTROL_ID, {'cmd': 'trigger', 'ch': 1, 'mode': 'slope', 'level': 4.0, 'level2': 1.0, 'cond': 'lt'}))
        b.drain_cmds(Dev())
        self.assertEqual(calls['sampling'][1], {})                       # Standard der Lib: Peak aus
        self.assertEqual(calls['trigger'][1]['level'], (4.0, 1.0))

    def test_external_trigger_only_with_edge_and_rollback(self):
        b.CMD_Q.put((b.CONTROL_ID, {'cmd': 'trigger', 'ch': 1, 'mode': 'pulse', 'ext': True}))
        b.drain_cmds(None)
        self.assertEqual(b.SET, INITIAL)                                 # verworfen, alter Stand
        b.CMD_Q.put((b.CONTROL_ID, {'cmd': 'trigger', 'ch': 1, 'ext': True, 'level': 9999 % 5000}))
        b.drain_cmds(None)
        self.assertTrue(b.SET['trigger']['ext'])                         # extern: Pegel spielt keine Rolle

    def test_record_and_autoset_are_queued_and_cancelled_by_stop(self):
        b.PENDING.update(record=None, autoset=False)
        b.CMD_Q.put((b.CONTROL_ID, {'cmd': 'record', 'duration': 1, 'rate': 1000}))
        b.CMD_Q.put((b.CONTROL_ID, {'cmd': 'autoset'}))
        self.assertFalse(b.drain_cmds(None))                             # keine Einstellungsaenderung
        self.assertEqual(b.PENDING['record']['rate'], 1000)
        self.assertTrue(b.PENDING['autoset'])
        b.CMD_Q.put((b.CONTROL_ID, {'cmd': 'stop'}))
        b.drain_cmds(None)
        self.assertIsNone(b.PENDING['record'])
        b.PENDING['autoset'] = False

    def test_record_without_driver_support_and_with_missed_samples(self):
        notes = []; frames = []
        old = (b.notify, b.offer); b.notify = notes.append; b.offer = lambda *a: frames.append(a)
        class Base:
            sampling_rate = 1000
            def set_channel(self, *a, **kw): pass
            def set_sampling(self, *a, **kw): pass
            def set_trigger(self, *a, **kw): pass
        class Missed(Base):
            def read(self, duration, pre=None): raise AssertionError('Missed some samples! Reduce the sampling rate')
        class Good(Base):
            def read(self, duration, pre=None):
                y = np.arange(1200, dtype=np.float32)
                return SimpleNamespace(ch1=SimpleNamespace(y=lambda: y), ch2=None)
        try:
            req = {'cmd': 'record', 'duration': 1, 'rate': 1000}
            self.assertEqual(b.do_record(Base(), req, 3), 3)
            self.assertEqual(notes[-1], {'cmd': 'record', 'state': 'failed', 'code': 'unsupported'})
            self.assertEqual(b.do_record(Missed(), req, 3), 3)
            self.assertEqual(notes[-1], {'cmd': 'record', 'state': 'failed', 'code': 'missed'})
            self.assertEqual(frames, [])
            self.assertEqual(b.do_record(Good(), req, 3), 4)
            h, c1, c2 = frames[-1]
            self.assertTrue(h['long']); self.assertEqual((h['n1'], h['n2'], h['dt']), (1200, 0, .001))
            self.assertIsNone(c2); self.assertFalse(b.RUNNING.is_set())
        finally:
            b.notify, b.offer = old

    def test_long_frames_are_always_sent_binary(self):
        self.assertIn('header.get("long")', pathlib.Path(b.__file__).read_text(encoding='utf-8'))

    def test_run_and_stop_cancel_pending_single(self):
        for cmd in ('run', 'stop'):
            b.SINGLE.set()
            b.CMD_Q.put((b.CONTROL_ID, {'cmd': cmd}))
            b.drain_cmds(None)
            self.assertFalse(b.SINGLE.is_set())
            self.assertEqual(b.RUNNING.is_set(), cmd == 'run')

    def test_disconnected_owner_commands_are_not_executed(self):
        b.CMD_Q.put((object(), {'cmd': 'stop'}))
        b.drain_cmds(None)
        self.assertTrue(b.RUNNING.is_set())

    def test_sampling_range_probe_and_timerange_units(self):
        class Dev:
            sampling_rate = 499999
            def __init__(self): self.channels=[]
            def set_channel(self,*args,**kw): self.channels.append((args,kw))
            def set_timerange(self,value): self.timerange=value
            def set_trigger(self,*args,**kw): self.trigger=kw
        dev=Dev()
        b.apply_settings(dev)
        self.assertAlmostEqual(dev.timerange,.01)
        self.assertEqual(dev.channels[0][1]['range'],'20v')
        self.assertEqual(dev.channels[0][1]['probe'],'x10')
        self.assertEqual(b.SET['rate'],499999)
        self.assertEqual(dev.trigger['position'],.2)
        self.assertIn('sweep',dev.trigger)

    def test_driver_failure_is_not_reported_success(self):
        class Dev:
            def set_channel(self,*a,**k): raise OSError('USB removed')
        with self.assertRaises(OSError): b.apply_settings(Dev())

    def test_channel_two_dt_and_snapshot_copy(self):
        a=np.array([1,2,3],dtype=np.float32)
        arr=b._volts(SimpleNamespace(y=lambda:a))
        a[0]=99
        self.assertEqual(arr[0],1)
        self.assertEqual(b._dt(SimpleNamespace(ch1=None,ch2=SimpleNamespace(sx=.00001))),.00001)
        self.assertIsNone(b._volts([1,float('nan')]))
        self.assertIsNone(b._volts(np.zeros((2,2))))

    def test_incompatible_trigger_range_is_rolled_back_without_reconnect(self):
        previous=copy.deepcopy(b.SET)
        b.CMD_Q.put((b.CONTROL_ID,{'cmd':'channel','ch':1,'probe':1,'vdiv':.01}))
        self.assertTrue(b.drain_cmds(None))
        self.assertEqual(b.SET,previous)
        b.CMD_Q.put((b.CONTROL_ID,{'cmd':'trigger','ch':1,'level':0}))
        b.CMD_Q.put((b.CONTROL_ID,{'cmd':'channel','ch':1,'probe':1,'vdiv':.01}))
        b.drain_cmds(None)
        self.assertEqual(b.SET['ch'][0]['vdiv'],.01)

    def test_iterator_runtime_type_error_is_not_mistaken_for_an_old_api(self):
        class Dev:
            def fetch_iter(self,freq=20):
                yield 1
                raise TypeError('internal driver defect')
        source=b.frames_source(Dev(),20)
        self.assertEqual(next(source),1)
        with self.assertRaises(TypeError):next(source)

    def test_binary_exact_layout(self):
        h={'dt':.01,'n1':2,'n2':1,'probe':[1,1]}
        packed=b.pack_binary(h,np.array([1,2]),np.array([3]))
        size=int.from_bytes(packed[4:8],'little')
        self.assertEqual(packed[:4],b'OSZ1')
        self.assertEqual((8+size)%4,0)
        self.assertEqual(json.loads(packed[8:8+size]),h)
        np.testing.assert_equal(np.frombuffer(packed[8+size:],dtype='<f4'),[1,2,3])

    def test_reconnect_disposes_failed_device_and_reapplies_settings(self):
        old=(b.VDS,b.offer,b.set_status)
        made=[]; frames=[];statuses=[]
        class Dev:
            sampling_rate=500000
            def __init__(self,**kw):self.index=len(made);self.disposed=False;made.append(self)
            def set_channel(self,*a,**kw):pass
            def set_sampling(self,*a):pass
            def set_trigger(self,*a,**kw):pass
            def fetch_iter(self,**kw):
                if self.index==0:raise OSError('simulated USB unplug')
                yield SimpleNamespace(ch1=SimpleNamespace(y=lambda:np.arange(8),sx=.000002),ch2=None)
            def dispose(self):self.disposed=True
        def offer(h,a,c):frames.append((h,a,c));b.STOP.set()
        b.VDS=Dev;b.offer=offer;b.set_status=statuses.append
        try:
            worker=threading.Thread(target=b.device_worker,args=(20,));worker.start();worker.join(4)
            self.assertFalse(worker.is_alive());self.assertGreaterEqual(len(made),2)
            self.assertTrue(all(d.disposed for d in made));self.assertEqual(len(frames),1)
            self.assertEqual(frames[0][0]['dt'],.000002);self.assertIn('kein Geraet',statuses)
        finally:
            b.STOP.set();b.VDS,b.offer,b.set_status=old


class SocketTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        b.AUTH_TOKEN='test-only-local-pairing-token'
        b.CONTROL_ID=None;b.CLIENTS.clear();b.PENDING_CLIENTS=0
        while not b.CMD_Q.empty():b.CMD_Q.get_nowait()
        self.server=await websockets.serve(b.handler,'127.0.0.1',0,origins=list(DEFAULT_ORIGINS),
                                           max_size=MAX_MESSAGE,max_queue=8,compression=None)
        self.url='ws://127.0.0.1:'+str(self.server.sockets[0].getsockname()[1])

    async def asyncTearDown(self):
        self.server.close();await self.server.wait_closed()

    async def connect(self,origin='http://localhost:8080',token=None):
        ws=await websockets.connect(self.url,origin=origin)
        self.assertEqual(json.loads(await ws.recv())['cmd'],'auth_required')
        if token is not None:await ws.send(json.dumps({'cmd':'auth','token':token}))
        return ws

    async def authed(self):
        ws=await self.connect(token=b.AUTH_TOKEN)
        hello=json.loads(await ws.recv())
        self.assertEqual(hello['cmd'],'authenticated')
        self.assertIn('record',hello['features']);self.assertEqual(hello['protocol'],2)
        await ws.recv();await ws.recv()
        return ws

    async def test_foreign_null_and_missing_origin_rejected(self):
        for origin in ['https://attacker.invalid','null',None,'http://localhost:8080.evil.invalid']:
            with self.subTest(origin=origin),self.assertRaises(websockets.exceptions.InvalidStatus):
                await websockets.connect(self.url,origin=origin)

    async def test_authentication_before_commands(self):
        ws=await self.connect()
        await ws.send(json.dumps({'cmd':'run'}))
        with self.assertRaises(websockets.exceptions.ConnectionClosed):await ws.recv()
        self.assertEqual(ws.close_code,1008);self.assertTrue(b.CMD_Q.empty())

    async def test_wrong_token_rejected(self):
        ws=await self.connect(token='wrong')
        with self.assertRaises(websockets.exceptions.ConnectionClosed):await ws.recv()
        self.assertEqual(ws.close_code,1008)

    async def test_invalid_input_does_not_crash_or_enter_device_queue(self):
        async with await self.authed() as ws:
            for raw in ['[]','null','{bad','{"cmd":"timebase","secdiv":NaN}',b'bad']:
                await ws.send(raw)
                self.assertEqual(json.loads(await ws.recv())['cmd'],'error')
            self.assertTrue(b.CMD_Q.empty())
            await ws.send('{"cmd":"stop"}')
            await asyncio.sleep(.02)
            self.assertEqual(b.CMD_Q.get_nowait()[1],{'cmd':'stop'})

    async def test_single_controller_and_reconnection(self):
        one=await self.authed();two=await self.connect(token=b.AUTH_TOKEN)
        with self.assertRaises(websockets.exceptions.ConnectionClosed):await two.recv()
        self.assertEqual(two.close_code,1013)
        await one.close();await asyncio.sleep(.02)
        three=await self.authed();await three.close()

    async def test_message_size_limit(self):
        ws=await self.authed();await ws.send('x'*(MAX_MESSAGE+1))
        with self.assertRaises(websockets.exceptions.ConnectionClosed):await ws.recv()
        self.assertEqual(ws.close_code,1009)

    async def test_rate_limit(self):
        ws=await self.authed()
        try:
            for _ in range(101):await ws.send('{"cmd":"run"}')
            with self.assertRaises(websockets.exceptions.ConnectionClosed):await ws.recv()
            self.assertEqual(ws.close_code,1008)
        finally:await ws.close()

    async def test_latest_frame_queue_discards_oldest(self):
        b.LOOP=asyncio.get_running_loop();b.FRAME_Q=asyncio.Queue(maxsize=2)
        for n in range(3):b.offer({'sequence':n},None,None)
        await asyncio.sleep(.01)
        self.assertEqual(b.FRAME_Q.get_nowait()[0]['sequence'],1)
        self.assertEqual(b.FRAME_Q.get_nowait()[0]['sequence'],2)
        b.LOOP=None


if __name__=='__main__':unittest.main()
