'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const ctx = {module:{exports:{}},console};
vm.runInNewContext(html.match(/<script id="oszi-live-logic">([\s\S]*?)<\/script>/)[1],ctx);
const L = ctx.module.exports;
test('invalid measurements never produce fictitious zero or infinite values',()=>{
  for(const a of [[],[NaN],[1,Infinity],[1,NaN,2]]) {
    assert.equal(L.mean(a),null); assert.equal(L.rms(a),null);
    assert.equal(L.peakToPeak(a).pp,null); assert.equal(L.amplitude(a),null);
    assert.equal(L.measureFreq(a,1e-3),null);
  }
});
test('invalid sample interval rejected by time measurements',()=>{
  const a=Array.from({length:100},(_,i)=>i%10<5?0:5);
  for(const dt of [0,-1,NaN,Infinity]) {
    assert.equal(L.measureFreq(a,dt),null); assert.equal(L.measureRise(a,dt),null);
    assert.equal(L.pulseWidths(a,dt).wPos,null); assert.equal(L.spectrum(a,dt).peak,null);
  }
});
test('flat DC has zero amplitude and no frequency',()=>{
  assert.equal(L.amplitude([3,3,3]),0); assert.equal(L.measureFreq([3,3,3],.01),null);
});
test('histogram plateaus are not shifted half a bin above true maximum',()=>{
  const l=L.levels([0,0,0,5,5,5]); assert.equal(l.base,0);assert.equal(l.top,5);
});
test('display decimation retains a one-sample spike in a large capture',()=>{
  const a=new Float32Array(262144);a[131071]=42;
  const d=L.minMaxDecimate(a,0,a.length,500);
  assert.equal(Math.max(...d),42);
});
test('trigger uses hysteresis, complete window and interpolated crossing',()=>{
  const a=[0,0,0,.98,1.01,.99,1.02,2,2,2,2];
  const t=L.findTrigger(a,{level:1,edge:'r',hysteresis:.1,pre:2,post:3});
  assert(t>2&&t<4); assert.equal(L.findTrigger([2,2,2],{level:1,edge:'r',pre:0,post:1}),null);
});
test('hardware short frame never joins unrelated acquisitions',()=>{
  const w=L.captureWindow(new Float32Array([1,2,3]),null,10,.2,.5,.01);
  assert.equal(w.t1.length,3);assert.equal(w.T,.03);assert.equal(w.short,true);
});
test('math division by zero is marked missing, never reported as zero',()=>{
  assert(Number.isNaN(L.combine([1],[0],'div')[0]));
});
test('invalid tolerance input has no pass/fail claim',()=>{
  for(const x of [NaN,Infinity,'1'])assert.equal(L.within(x,1,10),null);
  assert.equal(L.within(1,1,-1),null);
});
test('invalid FFT sizes fail immediately instead of hanging',()=>{
  assert.throws(()=>L.fftRadix2(new Float64Array(3),new Float64Array(3)));
});
test('sparse arrays and numeric strings are rejected as missing samples',()=>{
 for(const a of [Array(4),['1',2],[1,undefined]])assert.equal(L.mean(a),null);
});
test('large finite RMS and mean remain finite without squaring overflow',()=>{
 const x=1e300;assert(Math.abs(L.rms([x,x])/x-1)<1e-12);assert.equal(L.mean([x,x]),x);
});
test('frequency and amplitude are reproducible across offset, scale and sample rates',()=>{
 for(const hz of [5,50,800,20000]){const dt=1/(hz*100),a=Array.from({length:2000},(_,i)=>3+2*Math.sin(2*Math.PI*hz*i*dt));assert(Math.abs(L.measureFreq(a,dt)/hz-1)<.001);assert(Math.abs(L.peakToPeak(a).pp-4)<1e-8);assert(Math.abs(L.rms(a)-Math.sqrt(11))<1e-10);}
});
test('falling trigger and boundary rejection use full pre/post capture',()=>{
 const a=new Float32Array([5,5,5,4,2,0,0,0,0]);const x=L.findTrigger(a,{level:3,edge:'f',pre:2,post:3});assert.equal(x,3.5);assert.equal(L.findTrigger(a,{level:3,edge:'f',pre:5,post:3}),null);
});
test('phase correlation on a full 262144-sample capture has bounded working data',()=>{
 const n=262144,a=new Float32Array(n),b=new Float32Array(n);for(let i=0;i<n;i++){a[i]=Math.sin(i*2*Math.PI/4096);b[i]=Math.sin(i*2*Math.PI/4096-Math.PI/2);}const p=L.phase(a,b,1e-6);assert(Math.abs(p.deg-90)<10);
});
test('frozen zoom keeps dt, synchronizes channels and restores original samples on zoom out',()=>{
 const a=Float32Array.from({length:5000},(_,i)=>i),b=Float32Array.from(a,v=>-v),dt=2e-6;
 const view=L.captureWindow(a,b,500,.2,.2,dt);
 assert.equal(view.start,900);assert.equal(view.T,.001);assert.equal(view.t1[0],900);assert.equal(view.t2[0],-900);
 const full=L.captureWindow(a,b,10000,.2,.2,dt);assert.equal(full.short,true);assert.equal(full.T,.01);assert.deepEqual(Array.from(full.t1),Array.from(a));
 assert.equal(a.length,5000);assert.equal(a[900],900);
});
test('frozen time pan remains within available capture and retains single-sample peaks',()=>{
 const a=new Float32Array(5000);a[4999]=12;
 const end=L.captureWindow(a,null,500,1,.2,2e-6);assert.equal(end.start,4500);assert.equal(end.t1.length,500);assert.equal(end.t1[499],12);
 const front=L.captureWindow(a,null,500,0,.2,2e-6);assert.equal(front.start,0);
});
