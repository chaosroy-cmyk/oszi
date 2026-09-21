#!/usr/bin/env node
/* Tests fuer OsziLogic (Rein-Logik des Live-Modus).
   Extrahiert den Script-Block id="oszi-live-logic" direkt aus ../index.html
   (bzw. ./index.html) und testet ihn DOM-frei unter Node. Kein Build-Step. */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const os = require('os');

const cand = [path.join(__dirname,'..','index.html'), path.join(__dirname,'index.html'), 'index.html'];
const htmlPath = cand.find(p => { try { return fs.existsSync(p); } catch(e){ return false; } });
assert(htmlPath, 'index.html nicht gefunden');
const html = fs.readFileSync(htmlPath,'utf8');
const m = html.match(/<script id="oszi-live-logic">([\s\S]*?)<\/script>/);
assert(m, 'Script-Block oszi-live-logic nicht gefunden');
const tmp = path.join(os.tmpdir(),'oszi-logic-under-test.js');
fs.writeFileSync(tmp, m[1]);
const L = require(tmp);

let n = 0;
function t(name, fn){ fn(); n++; console.log('✓ '+name); }

/* ---- parseTdiv / parseVdiv ---- */
t('parseTdiv "2 ms/div" -> 2e-3', () => assert(Math.abs(L.parseTdiv('2 ms/div')-2e-3)<1e-12));
t('parseTdiv "10–20 µs (Bits)" -> 10e-6', () => assert(Math.abs(L.parseTdiv('10–20 µs (Bits)')-1e-5)<1e-12));
t('parseTdiv "0,5 ms/div" -> 5e-4', () => assert(Math.abs(L.parseTdiv('0,5 ms/div')-5e-4)<1e-12));
t('parseTdiv "1 s/div Roll" -> 1', () => assert(Math.abs(L.parseTdiv('1 s/div Roll')-1)<1e-12));
t('parseTdiv Unsinn -> null', () => assert.strictEqual(L.parseTdiv('Roll'), null));
t('parseVdiv "0,2 V/div" -> 0.2', () => assert(Math.abs(L.parseVdiv('0,2 V/div')-0.2)<1e-12));
t('parseVdiv "100 mV" -> 0.1', () => assert(Math.abs(L.parseVdiv('100 mV')-0.1)<1e-12));
t('parseVdiv "50 V/div" -> 50', () => assert(Math.abs(L.parseVdiv('50 V/div')-50)<1e-12));

/* ---- minMaxDecimate ---- */
t('minMaxDecimate 8->4 Spalten', () => {
  const d = L.minMaxDecimate(new Float32Array([0,1,2,3,4,5,6,7]),0,8,4);
  assert.deepStrictEqual(Array.from(d),[0,1,2,3,4,5,6,7]);
});
t('minMaxDecimate leer -> NaN', () => {
  const d = L.minMaxDecimate(new Float32Array(0),0,0,3);
  assert(Number.isNaN(d[0]));
});

/* ---- normXCorr: bekannte Verschiebung finden ---- */
t('normXCorr findet Lag ±1 bei -10 Samples Shift', () => {
  const N=256, SH=10, a=new Float32Array(N), b=new Float32Array(N);
  for(let i=0;i<N;i++){ b[i]=Math.sin(i*2*Math.PI/32); a[i]=Math.sin((i-SH)*2*Math.PI/32); }
  const r=L.normXCorr(a,b,64);
  assert(Math.abs(r.lag+SH)<=1, 'lag='+r.lag);
  assert(r.score>0.95, 'score='+r.score);
});

/* ---- measureFreq ---- */
t('measureFreq 50 Hz Sinus ±2 %', () => {
  const dt=1e-4, N=2000, a=new Float32Array(N);
  for(let i=0;i<N;i++) a[i]=Math.sin(2*Math.PI*50*i*dt);
  const f=L.measureFreq(a,dt);
  assert(Math.abs(f-50)/50<0.02, 'f='+f);
});

/* ---- measureDuty ---- */
t('measureDuty 30 %-Rechteck ±2 %-Punkte', () => {
  const N=1000, a=new Float32Array(N);
  for(let i=0;i<N;i++) a[i]=((i%100)<30)?5:0;
  const d=L.measureDuty(a);
  assert(Math.abs(d-0.30)<0.02, 'duty='+d);
});

/* ---- measureRise ---- */
t('measureRise Rampe: 10–90 % = 80 Samples', () => {
  const dt=1e-6, a=new Float32Array(300);
  for(let i=0;i<300;i++) a[i]= i<50?0 : (i<150 ? (i-50)/100 : 1);
  const r=L.measureRise(a,dt);
  assert(Math.abs(r-80e-6)<=2e-6, 'rise='+r);
});

/* ---- within ---- */
t('within Grenzen', () => {
  assert.strictEqual(L.within(105,100,10), true);
  assert.strictEqual(L.within(120,100,10), false);
  assert.strictEqual(L.within(null,100,10), null);
  assert.strictEqual(L.within(5,0,10), null);
});

/* ---- W-Patch-Grundlage: String-Objekt verhaelt sich in join/concat wie String ---- */
t('String-Objekt: join/concat unveraendert (W-Patch-sicher)', () => {
  const s=new String('<figure>x</figure>'); s.spec={a:1};
  assert.strictEqual(['A',s,'B'].join(''),'A<figure>x</figure>B');
  assert.strictEqual(''+s,'<figure>x</figure>');
  assert.strictEqual(s.spec.a,1);
});


/* ---- parseSetup: Karten-Setup -> Geraeteeinstellungen ---- */
t('parseSetup Hall-Karte (Bereich, 2 Kanaele, Trigger)', () => {
  const p=L.parseSetup({kanal:'1–2',kopp:'DC',tk:'1:1/10:1',vdiv:'1–2 V/div',
                        tdiv:'10–20 ms',trig:'Flanke \u2191, 2,5 V'});
  assert.strictEqual(p.coupling,'DC');
  assert.strictEqual(p.probe,1);
  assert(Math.abs(p.vdiv-2)<1e-12,'vdiv oberes Ende');
  assert(Math.abs(p.secdiv-1e-2)<1e-12,'tdiv erste Angabe');
  assert.strictEqual(p.trigEdge,'r');
  assert(Math.abs(p.trigLevel-2.5)<1e-12);
  assert.strictEqual(p.ch2,true);
  assert.strictEqual(p.strom,false);
});
t('parseSetup Stromzange -> strom, kein Probe/Vdiv-Zwang', () => {
  const p=L.parseSetup({kanal:'1',tk:'Stromzange 20 A',vdiv:'2–5 A',tdiv:'0,5–2 ms',trig:'Flanke \u2191 Strom'});
  assert.strictEqual(p.strom,true);
  assert.strictEqual(p.probe,null);
  assert.strictEqual(p.ch2,false);
  assert.strictEqual(p.trigEdge,'r');
});
t('parseSetup mA/V-Mischangabe nimmt V-Wert', () => {
  const p=L.parseSetup({vdiv:'5–10 mA bzw. 0,5 V'});
  assert(Math.abs(p.vdiv-0.5)<1e-12,'vdiv='+p.vdiv);
});
t('parseSetup Auto/Single/fallende Flanke', () => {
  assert.strictEqual(L.parseSetup({trig:'Auto'}).trigMode,'auto');
  const s=L.parseSetup({trig:'Single (Start)'});
  assert.strictEqual(s.trigMode,'single');
  assert.strictEqual(L.parseSetup({trig:'Flanke \u2193, 6 V'}).trigEdge,'f');
});
t('parseSetup 10:1 (\u2265400 V) und mV-Level', () => {
  const p=L.parseSetup({tk:'10:1 (\u2265400 V)',trig:'Flanke \u2191, 500 mV'});
  assert.strictEqual(p.probe,10);
  assert(Math.abs(p.trigLevel-0.5)<1e-12);
});
t('parseSetup leer -> Nullwerte', () => {
  const p=L.parseSetup({});
  assert.strictEqual(p.coupling,null);
  assert.strictEqual(p.secdiv,null);
  assert.strictEqual(p.ch2,false);
});


t('rms Sinus ~ A/sqrt(2)', () => {
  const N=1000, a=new Float32Array(N);
  for(let i=0;i<N;i++) a[i]=2*Math.sin(i*2*Math.PI/50);
  const r=L.rms(a);
  assert(Math.abs(r-2/Math.SQRT2)/(2/Math.SQRT2)<0.01,'rms='+r);
});

/* ===== v10: erweiterte Messungen, FFT, Mathe ===== */

t('measurePeriod 50 Hz -> 20 ms', () => {
  const dt=1e-4, N=2000, a=new Float32Array(N);
  for(let i=0;i<N;i++) a[i]=Math.sin(2*Math.PI*50*i*dt);
  const p=L.measurePeriod(a,dt);
  assert(Math.abs(p-0.02)/0.02<0.02, 'period='+p);
});

t('levels Rechteck 0/5 -> base~0, top~5, amp~5', () => {
  const N=1000, a=new Float32Array(N);
  for(let i=0;i<N;i++) a[i]=((i%100)<50)?5:0;
  const lv=L.levels(a);
  assert(lv.base<0.2, 'base='+lv.base);
  assert(Math.abs(lv.top-5)<0.2, 'top='+lv.top);
  assert(Math.abs(L.amplitude(a)-5)<0.3, 'amp='+L.amplitude(a));
});

t('overshoot: Spitze ueber Top wird erkannt', () => {
  const N=1000, a=new Float32Array(N);
  for(let i=0;i<N;i++) a[i]=((i%100)<50)?5:0;
  a[25]=6; /* Ueberschwinger */
  const o=L.overshoot(a);
  assert(o>0.1 && o<0.4, 'overshoot='+o);
});

t('measureFall Rampe 90–10 % = 80 Samples', () => {
  const dt=1e-6, a=new Float32Array(300);
  for(let i=0;i<300;i++) a[i]= i<50?1 : (i<150 ? 1-(i-50)/100 : 0);
  const f=L.measureFall(a,dt);
  assert(Math.abs(f-80e-6)<=3e-6, 'fall='+f);
});

t('pulseWidths 30 %-Rechteck -> dutyPos~0.3, dutyNeg~0.7', () => {
  const dt=1e-4, N=1000, a=new Float32Array(N);
  for(let i=0;i<N;i++) a[i]=((i%100)<30)?5:0;
  const pw=L.pulseWidths(a,dt);
  assert(Math.abs(pw.dutyPos-0.30)<0.03, 'dutyPos='+pw.dutyPos);
  assert(Math.abs(pw.dutyNeg-0.70)<0.03, 'dutyNeg='+pw.dutyNeg);
  assert(Math.abs(pw.wPos-3e-3)<3e-4, 'wPos='+pw.wPos);
});

t('phase: 90°-verschobene Sinus -> ~90°', () => {
  const dt=1e-5, f=100, N=2000, a=new Float32Array(N), b=new Float32Array(N);
  for(let i=0;i<N;i++){ const tt=i*dt; a[i]=Math.sin(2*Math.PI*f*tt); b[i]=Math.sin(2*Math.PI*f*tt - Math.PI/2); }
  const ph=L.phase(a,b,dt);
  assert(Math.abs(ph.deg-90)<10, 'deg='+ph.deg);
});

t('spectrum: Ton bei exaktem Bin -> Peak-Frequenz & Vrms', () => {
  const n=1024, dt=1/1024, A=2, f=64, a=new Float32Array(n);
  for(let i=0;i<n;i++) a[i]=A*Math.sin(2*Math.PI*f*i*dt);
  const sp=L.spectrum(a,dt,{window:'rect'});
  assert(Math.abs(sp.peak.freq-64)<1.5, 'peakFreq='+sp.peak.freq);
  assert(Math.abs(sp.peak.mag-A/Math.SQRT2)/(A/Math.SQRT2)<0.03, 'vrms='+sp.peak.mag);
});

t('spectrum dB-Modus liefert dBVrms', () => {
  const n=1024, dt=1/1024, A=2, f=64, a=new Float32Array(n);
  for(let i=0;i<n;i++) a[i]=A*Math.sin(2*Math.PI*f*i*dt);
  const sp=L.spectrum(a,dt,{window:'rect',db:true});
  const expect=20*Math.log10(A/Math.SQRT2);
  assert(Math.abs(sp.peak.mag-expect)<0.5, 'dB='+sp.peak.mag+' exp='+expect);
});

t('combine CH1-CH2 (sub) elementweise', () => {
  const a=new Float32Array([3,3,4]), b=new Float32Array([1,2,4]);
  const o=L.combine(a,b,'sub');
  assert.deepStrictEqual(Array.from(o),[2,1,0]);
  const s=L.combine(a,b,'add');
  assert.deepStrictEqual(Array.from(s),[4,5,8]);
});

t('windowFn Hann: Enden 0, Mitte ~1', () => {
  const w=L.windowFn('hann',101);
  assert(Math.abs(w[0])<1e-9 && Math.abs(w[100])<1e-9, 'Enden');
  assert(Math.abs(w[50]-1)<1e-6, 'Mitte='+w[50]);
});

console.log('\nAlle '+n+' Tests bestanden.');
