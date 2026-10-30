"""Synthetic OWON API fixture for browser tests. Never used by start-live.cmd."""
import asyncio
import pathlib
import sys
import time
from types import SimpleNamespace
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
import bridge
import numpy as np

class FakeVDS:
    sampling_rate=500000
    def __init__(self,**kw):pass
    def set_channel(self,*a,**kw):pass
    def set_sampling(self,rate):self.sampling_rate=rate
    def set_trigger(self,*a,**kw):pass
    def fetch_iter(self,**kw):
        while not bridge.STOP.is_set():
            dt=1/self.sampling_rate
            a=(2*np.sin(np.arange(5000)*dt*2*np.pi*1000)).astype(np.float32)
            yield SimpleNamespace(ch1=SimpleNamespace(y=lambda:a,sx=dt),ch2=SimpleNamespace(y=lambda:a*.5,sx=dt))
            time.sleep(.05)
    def dispose(self):pass

bridge.VDS=FakeVDS
bridge.FORCE_BINARY='on'
asyncio.run(bridge.main(int(sys.argv[1]),20,(*bridge.DEFAULT_ORIGINS,sys.argv[2])))
