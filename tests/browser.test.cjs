'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{spawn}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const releaseVersion=require('../package.json').version.replace(/\.0$/,'');
let version='13.5';
const server=http.createServer((req,res)=>{
 let rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'');if(!rel||rel.endsWith('/'))rel+='index.html';
 if(rel.includes('..')){res.writeHead(403).end();return;}
 let file=path.join(root,rel);
 if(version==='13.4'&&(rel==='index.html'||rel==='service-worker.js'))file=path.join(__dirname,'fixtures/v13.4',rel);
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end('missing');return;}
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',rel.endsWith('.html')?'text/html; charset=utf-8':rel.endsWith('.js')?'application/javascript':rel.endsWith('.webmanifest')?'application/manifest+json':rel.endsWith('.svg')?'image/svg+xml':'image/png');res.end(fs.readFileSync(file));
});
async function until(fn,ms=15000){const end=Date.now()+ms;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,50));}throw new Error('condition timeout');}
let browser,base,bridge,token,bridgePort;
test.before(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 // Reserve an ephemeral bridge port independently of the web port.
 const reserve=http.createServer();await new Promise(r=>reserve.listen(0,'127.0.0.1',r));bridgePort=reserve.address().port;await new Promise(r=>reserve.close(r));
 bridge=spawn(process.env.PYTHON||'python3',['-u',path.join(__dirname,'mock_bridge.py'),String(bridgePort),base],{stdio:['ignore','pipe','pipe']});
 bridge.stdout.on('data',data=>{const m=String(data).match(/Kopplungscode .*?: (\S+)/);if(m)token=m[1];});
 bridge.stderr.on('data',()=>{});await until(()=>token);
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined});
});
test.after(async()=>{if(browser)await browser.close();if(bridge){bridge.kill('SIGTERM');await new Promise(r=>bridge.once('exit',r));}await new Promise(r=>server.close(r));});
async function live(page){await page.goto(base+'/#pg-live',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.OsziLive);}

test('all V13.4 cards, W2 assertions, search and desktop layout remain intact',async()=>{
 const context=await browser.newContext({viewport:{width:1366,height:768}});const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/?validate',{waitUntil:'networkidle'});
 const report=await p.evaluate(()=>validateKompendium());assert.equal(report.cards,82);assert.equal(report.images,1087);assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);
 await p.locator('#btnSuche').click();await p.locator('#sfeld').fill('P0335');assert((await p.locator('#sres').innerText()).length>10);
 await p.evaluate(()=>closeSearch());await p.evaluate(()=>go('pg-live',{}));
 assert(await p.locator('#lv-canvas').isVisible());
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.screenshot({path:process.env.OSZI_SCREENSHOT||'/tmp/oszi-v135-desktop.png',fullPage:false});
 assert.deepEqual(errors,[]);await context.close();
});

test('mock, controls, CSV, recording roundtrip, hostile metadata and channel switching',async()=>{
 const context=await browser.newContext();const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await live(p);
 await p.locator('#lv-karte').selectOption({index:1});await p.locator('#lv-mock').click();await p.waitForFunction(()=>OsziLive.state.frame1&&OsziLive.state.frame1.length>0);
 await p.locator('#lv-single').click();await p.locator('#lv-stop').click();assert.equal(await p.evaluate(()=>OsziLive.state.singleArm),false);
 await p.locator('#lv-run').click();await p.locator('#lv-ch2on').check();await p.waitForFunction(()=>OsziLive.state.frame2&&OsziLive.state.frame2.length>0);
 await p.locator('#lv-ch1on').uncheck();await p.waitForFunction(()=>!OsziLive.state.frame1&&OsziLive.state.frame2);
 await p.locator('#lv-stop').click();const capture=await p.evaluate(()=>OsziLive.exportMeasurement());assert.equal(capture.channels.length,1);assert.equal(capture.channels[0].number,2);
 const d=p.waitForEvent('download');await p.locator('#lv-csv').click();const download=await d;const csv=fs.readFileSync(await download.path(),'utf8');assert(csv.startsWith('t_s;ch1_V;ch2_V'));assert(csv.split('\n').length>32);
 await p.locator('#lv-import').setInputFiles({name:'roundtrip.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});await p.waitForFunction(()=>document.querySelector('#lv-liblist [data-lib="load"]'));
 await p.locator('#lv-liblist [data-lib="load"]').first().click();assert(await p.evaluate(()=>!!OsziLive.state.playback));
 const values=Buffer.from(new Float32Array([1,2,3,4]).buffer).toString('base64');
 const hostile={id:'xss-test',name:'<img src=x onerror="window.__xss=1">',dt:.001,len1:4,len2:0,ch1:values,meta:{notiz:'<svg onload="window.__xss=2">'},created:0};
 await p.locator('#lv-import').setInputFiles({name:'old-134.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(hostile))});await p.waitForFunction(()=>document.querySelector('#lv-liblist').textContent.includes('onerror'));
 assert.equal(await p.evaluate(()=>window.__xss),undefined);assert.equal(await p.locator('#lv-liblist img,#lv-liblist svg').count(),0);
 assert.deepEqual(errors,[]);await context.close();
});

test('authenticated real WebSocket transport with synthetic driver, binary frames and reconnect',async()=>{
 const context=await browser.newContext();const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await live(p);
 await p.locator('#lv-url').fill('ws://127.0.0.1:'+bridgePort);await p.locator('#lv-token').fill(token);await p.locator('#lv-connect').click();
 await p.waitForFunction(()=>OsziLive.state.authenticated&&OsziLive.state.frame1&&OsziLive.state.lastHeader.source==='owon-vds1022');
 const f=await p.evaluate(()=>({n:OsziLive.state.frame1.length,dt:OsziLive.state.dt,rate:OsziLive.state.lastHeader.sampleRateHz}));assert.equal(f.n,5000);assert(Math.abs(f.dt*f.rate-1)<1e-9);
 await p.locator('#lv-ch2on').check();await p.waitForFunction(()=>OsziLive.state.frame2&&OsziLive.state.frame2.length===5000);
 await p.locator('#lv-top-tdiv').selectOption('0.0001');await p.waitForFunction(()=>OsziLive.state.dt===.0000002);
 await p.locator('#lv-disconnect').click();await p.waitForFunction(()=>!OsziLive.state.authenticated);await new Promise(r=>setTimeout(r,100));await p.locator('#lv-connect').click();await p.waitForFunction(()=>OsziLive.state.authenticated&&OsziLive.state.frame1);
 const exported=await p.evaluate(()=>OsziLive.exportMeasurement());assert.equal(exported.channels.length,2);assert.equal(exported.quality.calibrationVerified,false);
 assert.deepEqual(errors,[]);await context.close();
});

test('stopped capture time zoom preserves both channels and dt without device commands',async()=>{
 const context=await browser.newContext();const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await live(p);
 await p.locator('#lv-url').fill('ws://127.0.0.1:'+bridgePort);await p.locator('#lv-token').fill(token);await p.locator('#lv-connect').click();
 await p.waitForFunction(()=>OsziLive.state.authenticated&&OsziLive.state.frame1&&OsziLive.state.frame1.length===5000);
 await p.locator('#lv-ch2on').check();await p.waitForFunction(()=>OsziLive.state.frame2&&OsziLive.state.frame2.length===5000);
 await p.locator('#lv-stop').click();
 const original=await p.evaluate(()=>{window.__zoomCommands=[];const ws=OsziLive.state.ws,send=ws.send.bind(ws);ws.send=function(data){const c=JSON.parse(data);if(c.cmd!=='pong')__zoomCommands.push(c);return send(data);};return OsziLive.exportMeasurement();});
 await p.locator('#lv-top-tdiv').selectOption('0.0001');
 const zoom=await p.evaluate(()=>OsziLive.exportMeasurement());
 assert.equal(zoom.channels.length,2);assert.equal(zoom.sampleIntervalSeconds,original.sampleIntervalSeconds);
 assert.equal(zoom.channels[0].values.length,500);assert.equal(zoom.channels[1].values.length,500);
 assert.equal(await p.locator('#lv-tdiv').inputValue(),'0.0001');
 assert.deepEqual(await p.evaluate(()=>__zoomCommands),[]);
 assert.equal(await p.evaluate(()=>OsziLive.state.frozen.ch1.length),5000);
 await p.locator('#lv-timepan').fill('1000');await p.locator('#lv-timepan').dispatchEvent('input');
 const panned=await p.evaluate(()=>OsziLive.exportMeasurement());assert.deepEqual(panned.channels[0].values,original.channels[0].values.slice(1000,1500));
 await p.locator('#lv-tdiv').selectOption('0.002');
 const full=await p.evaluate(()=>OsziLive.exportMeasurement());assert.deepEqual(full.channels[0].values,original.channels[0].values);assert.deepEqual(full.channels[1].values,original.channels[1].values);
 assert.equal(await p.locator('#lv-top-tdiv').inputValue(),'0.001');assert.deepEqual(await p.evaluate(()=>__zoomCommands),[]);
 await p.locator('#lv-tdiv').selectOption('0.0001');await p.locator('#lv-run').click();
 await p.waitForFunction(()=>OsziLive.state.running&&OsziLive.state.dt===.0000002&&OsziLive.state.frame1);
 const commands=await p.evaluate(()=>__zoomCommands);assert.equal(commands.filter(c=>c.cmd==='timebase').length,1);assert.equal(commands.find(c=>c.cmd==='timebase').secdiv,.0001);
 assert.equal(await p.evaluate(()=>OsziLive.state.frozen),null);assert.deepEqual(errors,[]);await context.close();
});

test('single and mock recordings support stopped zoom and playback returns to live settings',async()=>{
 const c=await browser.newContext(),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await live(p);
 await p.locator('#lv-karte').selectOption({index:1});await p.locator('#lv-mock').click();await p.waitForFunction(()=>OsziLive.state.frame1);
 await p.locator('#lv-single').click();await p.waitForFunction(()=>!OsziLive.state.running&&OsziLive.state.frozen);
 const capture=await p.evaluate(()=>({dt:OsziLive.state.dt,length:OsziLive.state.frozen.ch1.length}));
 await p.locator('#lv-tdiv').selectOption('0.0001');assert.equal(await p.evaluate(()=>OsziLive.state.dt),capture.dt);assert.equal(await p.evaluate(()=>OsziLive.state.frozen.ch1.length),capture.length);
 const array=new Float32Array(5000);for(let i=0;i<5000;i++)array[i]=Math.sin(i/20);
 const rec={id:'zoom-playback',name:'Zoom playback',dt:2e-6,len1:5000,len2:0,ch1:Buffer.from(array.buffer).toString('base64'),created:1,meta:{}};
 await p.locator('#lv-import').setInputFiles({name:'zoom.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(rec))});await p.locator('[data-lib="load"][data-id="zoom-playback"]').waitFor();await p.locator('[data-lib="load"][data-id="zoom-playback"]').click();
 await p.locator('#lv-tdiv').selectOption('0.0001');const view=await p.evaluate(()=>OsziLive.exportMeasurement());assert.equal(view.channels[0].values.length,500);assert.equal(view.sampleIntervalSeconds,2e-6);
 await p.locator('#lv-playback-exit').click();assert.equal(await p.evaluate(()=>OsziLive.state.playback),null);assert.equal(await p.evaluate(()=>OsziLive.state.frozen),null);
 assert.deepEqual(errors,[]);await c.close();
});

test('timebase changed before any samples arrives is applied only when Run resumes',async()=>{
 const c=await browser.newContext(),p=await c.newPage();await live(p);await p.locator('#lv-stop').click();
 await p.evaluate(()=>{window.__emptyCommands=[];OsziLive.state.authenticated=true;OsziLive.state.ws={readyState:1,send:data=>__emptyCommands.push(JSON.parse(data)),close:()=>{}};});
 await p.locator('#lv-tdiv').selectOption('0.0001');assert.deepEqual(await p.evaluate(()=>__emptyCommands),[]);
 await p.locator('#lv-run').click();assert.deepEqual(await p.evaluate(()=>__emptyCommands),[{cmd:'timebase',secdiv:.0001},{cmd:'run'}]);await c.close();
});

test('V13.4 to V13.5 user-confirmed offline update preserves stored recordings and sibling caches',async()=>{
 version='13.4';const context=await browser.newContext(),p=await context.newPage();await p.goto(base+'/',{waitUntil:'networkidle'});await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload({waitUntil:'networkidle'});
 await p.evaluate(async()=>{localStorage.setItem('v135-retained','yes');const c=await caches.open('kfz-multimeter-profi-v7-3');await c.put('/sibling-test',new Response('retained'));await caches.open('unrelated-cache');const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('oszi-live',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise((resolve,reject)=>{const tx=db.transaction('aufnahmen','readwrite');tx.objectStore('aufnahmen').put({id:'retained',name:'V13.4',dt:.001,len1:3,len2:0,ch1:new Float32Array([1,2,3]).buffer,meta:{},created:1});tx.oncomplete=resolve;tx.onerror=reject;});db.close();});
 version='13.5';await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});await p.locator('#updBanner button').waitFor();
 assert(await p.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting));
 await p.locator('#updBanner button').click();await p.waitForFunction(version=>document.body.textContent.includes('Stand v'+version)&&typeof window.go==='function'&&window.OsziLive,releaseVersion);await p.waitForLoadState('networkidle');
 assert.equal(await p.evaluate(()=>localStorage.getItem('v135-retained')),'yes');
 assert(await p.evaluate(async()=>!!(await caches.open('kfz-multimeter-profi-v7-3')).match('/sibling-test')));
 assert((await p.evaluate(()=>caches.keys())).includes('unrelated-cache'));
 await p.evaluate(()=>go('pg-live',{}));await p.waitForFunction(()=>document.querySelector('#lv-liblist').textContent.includes('V13.4'));
 await context.setOffline(true);await p.reload({waitUntil:'networkidle'});assert(await p.evaluate(version=>document.body.textContent.includes('Stand v'+version),releaseVersion));
 await context.setOffline(false);const m=await context.newPage();await m.goto(base+'/multimeter/',{waitUntil:'networkidle'});await m.evaluate(()=>navigator.serviceWorker.ready);await m.reload({waitUntil:'networkidle'});
 const keys=await p.evaluate(()=>caches.keys());assert(keys.some(k=>k.endsWith('v'+releaseVersion)));assert(keys.some(k=>k.endsWith('v7-3-1')));
 await context.setOffline(true);await p.reload({waitUntil:'networkidle'});await m.reload({waitUntil:'networkidle'});assert((await m.locator('#main').innerText()).length>100);assert(await p.evaluate(version=>document.body.textContent.includes('Stand v'+version),releaseVersion));await context.close();
});

test('small screens and laptop scaling have no page overflow',async()=>{
 for(const viewport of [{width:360,height:800},{width:1280,height:720},{width:1920,height:1080}]){
  const c=await browser.newContext({viewport,deviceScaleFactor:1.25});const p=await c.newPage();await live(p);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),JSON.stringify(viewport));await c.close();
 }
});
