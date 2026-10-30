'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('./load-inline.cjs')('oszi-data');
function record(){const a=new Float32Array([1,2,3]);return {id:'old-134',name:'Messung',dt:.001,len1:3,len2:0,ch1:Buffer.from(a.buffer).toString('base64'),created:1,meta:{fahrzeug:'Auto'}};}
function binary(h,a,b){let header=Buffer.from(JSON.stringify(h));header=Buffer.concat([header,Buffer.alloc((-(8+header.length))&3,32)]);const out=Buffer.alloc(8+header.length+4*(a.length+b.length));out.write('OSZ1');out.writeUInt32LE(header.length,4);header.copy(out,8);[...a,...b].forEach((v,i)=>out.writeFloatLE(v,8+header.length+i*4));return out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength);}
test('legacy V13.4 recordings remain readable without second probe multiplication',()=>{
 const j=record();j.probe=[10,10];const r=D.normalizeRecording(j);assert.deepEqual(Array.from(new Float32Array(r.ch1)),[1,2,3]);assert.equal(r.meta.fahrzeug,'Auto');
});
test('recording validation rejects IDs, lengths, types, NaN and corrupt base64',()=>{
 for(const change of [{id:'__proto__'},{id:'constructor'},{id:'"><img src=x onerror=alert(1)>'},{dt:0},{len1:4},{ch1:'bad$'},{meta:[]},{len1:1.1},{ch1:Buffer.from(new Float32Array([NaN,2,3]).buffer).toString('base64')}])assert.throws(()=>D.normalizeRecording({...record(),...change}));
});
test('frame validation rejects nonfinite data, excess length and unsynchronized channels',()=>{
 for(const [h,a,b] of [[{dt:0},[1],[]],[{dt:.01},[NaN],[]],[{dt:.01},[1],[2,3]],[{dt:.01,probe:[0,1]},[1],[]]])assert.throws(()=>D.frame(h,a,b));
 assert.throws(()=>D.frame({dt:.01},new Float32Array(D.MAX_SAMPLES+1),[]));
 const a=new Float32Array([1,2]);const f=D.frame({dt:.01,probe:[10,1]},a,[]);assert.equal(f.ch1[1],20);assert.equal(a[1],2);assert.equal(f.header.probe[0],1);
});
test('OSZ1 binary decoding is strict and voltage-accurate',()=>{
 const h={dt:.001,n1:3,n2:3,probe:[1,1],trig:.2};const buf=binary(h,[1,-2,3],[4,5,6]);const r=D.binaryFrame(buf);assert.deepEqual(Array.from(r.ch1),[1,-2,3]);
 for(const b of [buf.slice(0,-1),binary({...h,n1:99},[1,-2,3],[4,5,6]),binary(h,[NaN,2,3],[4,5,6]),new ArrayBuffer(8)])assert.throws(()=>D.binaryFrame(b));
 const magic=buf.slice(0);new Uint8Array(magic)[3]=50;assert.throws(()=>D.binaryFrame(magic));
});
test('CSV round trip preserves ALL 262144 samples including a narrow spike',()=>{
 const a=new Float32Array(262144);a[131071]=42;const text=D.toCSV([{number:1,unit:'V',values:a},{number:2,unit:'V',values:[]}],1e-5);const csv=D.parseCSV(text);assert.equal(csv.channels[0].values.length,a.length);assert.equal(csv.channels[0].values[131071],42);assert(Math.abs(csv.dt-1e-5)<1e-12);
});
test('CSV supports decimal comma, tab, BOM, scientific notation and channel two alone',()=>{
 for(const text of ['\uFEFFt_s;ch2_V\r\n0;1,5\r\n0,001;2,5','time\tvoltage\n0\t1.5\n1e-3\t2.5','time,voltage\n0,1.5\n1e-3,2.5']){const r=D.parseCSV(text);assert.equal(r.dt,.001);assert.equal(r.channels[0].values[1],2.5);}
});
test('CSV rejects duplicate/reversed/irregular times, holes, unknown units and huge input',()=>{
 for(const text of ['t_s;ch1_V\n0;1\n0;2','t_s;ch1_V\n0;1\n.1;2\n.3;3','t_s;ch1_V\n0;1\n-.1;2','t_s;ch1_V\n0;1\n.1;NaN','t_s;ch1_V\n0;1\n.1;','t_s;ch1_kV\n0;1\n.1;2','t_s;ch1_V;ch1_V\n0;1;1\n.1;2;2'])assert.throws(()=>D.parseCSV(text));
 assert.throws(()=>D.parseCSV('x'.repeat(D.MAX_TEXT+1)));
});
test('universal format supports four channels, current accessory, calibration and trigger',()=>{
 const r=D.measurement({dt:.001,id:'fixture',channels:Array.from({length:4},(_,i)=>({number:i+1,label:'Kanal '+(i+1),values:[1,2],unit:i===3?'A':'V',accessory:{kind:'current-clamp',factor:100,applied:true},calibration:{verified:false,reference:'unverified'}})),trigger:{channel:3,level:1,edge:'rise',position:.2},quality:{flags:['synthetic'],discontinuous:true},vehicle:{fahrzeug:'Test'}});
 assert.equal(r.schemaVersion,1);assert.equal(r.channels.length,4);assert.equal(r.channels[3].unit,'A');assert.equal(r.channels[3].sampleRateHz,1000);assert.equal(r.trigger.confirmed,false);assert.equal(r.quality.calibrationVerified,false);
 assert.equal(r.vehicle.vehicle,'Test');assert.doesNotThrow(()=>JSON.stringify(r));
});
test('universal format rejects invalid channels, units, timestamps and missing trigger channel',()=>{
 const base={dt:.001,channels:[{number:1,unit:'V',values:[1,2]}]};
 for(const change of [{dt:0},{channels:[]},{channels:[...base.channels,...base.channels]},{channels:[{number:1,unit:'kV',values:[1]}]},{channels:[{number:1,unit:'V',values:[1,2],timestamps:[1,0]}]},{trigger:{channel:4}}])assert.throws(()=>D.measurement({...base,...change}));
});
test('local analysis is asynchronous, isolated and propagates failures without API calls',async()=>{
 const c=D.measurement({dt:.01,channels:[{number:1,unit:'V',values:[1,2]}]});
 const result=await D.analyze(c,m=>{m.channels[0].values[0]=99;return {label:'test-only'};});assert.equal(result.label,'test-only');assert.equal(c.channels[0].values[0],1);
 await assert.rejects(D.analyze(c,()=>{throw new Error('bad analyzer');}),/bad analyzer/);
});
