"""Synthetic OWON API fixture for browser tests. Never used by start-live.cmd.

Bildet nur nach, was die Bridge von der vds1022-Lib benutzt (inkl. stop(), Sweep NORMAL,
read(), autoset()). Kein Ersatz fuer den Hardwaretest."""
import asyncio
import pathlib
import sys
import threading
import time
from types import SimpleNamespace
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
import bridge
import numpy as np

AMPLITUDE=2.0   # Volt, 1-kHz-Sinus auf CH1 (CH2 halb so gross)

class FakeVDS:
    def __init__(self,**kw):
        self.sampling_rate=500000;self.voltrange=[2.0,2.0];self.probe=[1,1];self.on=[True,True]
        self.rollmode=False;self.peak=False;self.sweep=0;self.level=0.0;self.source=0;self.calls=[]
        self._stop=threading.Event()
    def set_channel(self,ch,range=None,probe=None,offset=.5,coupling=None):
        self.on[ch if isinstance(ch,int) else 0]=True
    def set_sampling(self,rate,roll=None,peak=False):
        self.sampling_rate=rate;self.peak=peak;self.rollmode=rate<2500
    def set_trigger(self,source,mode,cond,sweep=0,position=.5,level=0,width=None,holdoff=None):
        lv=level[0] if isinstance(level,tuple) else float(str(level).rstrip('v'))
        self.sweep=sweep;self.level=lv;self.source=source
        self.calls.append((source,mode,cond,sweep,width))
    def _frame(self,n,start=0):
        dt=1/self.sampling_rate
        a=(AMPLITUDE*np.sin((start+np.arange(n))*dt*2*np.pi*1000)).astype(np.float32)
        mk=lambda y:SimpleNamespace(y=lambda:y,sx=dt,frequency=1000.0)
        return SimpleNamespace(ch1=mk(a),ch2=mk(a*.5))
    def _triggers(self):
        # ein Sinus von +-2 V loest nur aus, wenn der Pegel im Signal liegt (EXT: nie)
        return self.source in (0,1) and abs(self.level)<AMPLITUDE
    def fetch_iter(self,**kw):
        while not bridge.STOP.is_set():
            if self.sweep and not self._triggers():      # NORMAL/ONCE ohne Ereignis: blockiert wie die Lib
                if self._stop.wait(.02):return
                continue
            yield self._frame(5000)
            if self._stop.wait(.05):return
    def fetch(self):return self._frame(5000)
    def read(self,duration,pre=None):
        if self.sweep==2:                                # ONCE: auf den Trigger warten
            while not self._triggers():
                if self._stop.wait(.02):return None
        total=(duration+(pre or 0))
        if self._stop.wait(min(total,.4)):return None   # Test wartet nicht die volle Dauer
        return self._frame(int(round(total*self.sampling_rate)))
    def autoset(self):
        self.voltrange=[.5,.5];self.on=[True,False];self.sampling_rate=250000
    def stop(self):
        self._stop.set();time.sleep(.1);self._stop.clear();return True
    def dispose(self):self._stop.set()

bridge.VDS=FakeVDS
bridge.FORCE_BINARY='on'
asyncio.run(bridge.main(int(sys.argv[1]),20,(*bridge.DEFAULT_ORIGINS,sys.argv[2])))
