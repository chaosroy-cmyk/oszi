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

console.log('\nAlle '+n+' Tests bestanden.');
