'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function worker(file,scope='http://localhost:8080/',oldKeys=[]){
 const handlers={},deleted=[],storage=new Map(),puts=[];let fetcher=async()=>new Response('network',{headers:{'Content-Type':'text/html'}});
 const cache={addAll:async()=>{},match:async key=>{const r=storage.get(String(key));return r&&r.clone();},put:async(key,r)=>{puts.push(String(key));storage.set(String(key),r);}};
 const caches={open:async()=>cache,keys:async()=>oldKeys,delete:async k=>{deleted.push(k);return true;}};
 const self={registration:{scope},location:{origin:new URL(scope).origin},clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(k,v)=>handlers[k]=v};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{self,caches,URL,Response,fetch:(...args)=>fetcher(...args)});
 return {handlers,deleted,storage,puts,fetch:f=>fetcher=f,async fire(kind,data={}){const tasks=[];let response;handlers[kind]({...data,waitUntil:p=>tasks.push(p),respondWith:p=>response=p});await Promise.all(tasks);return response?await response:undefined;}};
}
test('root and multimeter activate delete only their own cache families',async()=>{
 const keys=['kfz-oszi-pwa-signed-803792f7bb4a6c59-v13.4','kfz-multimeter-profi-v7-3','other'];
 const root=worker('service-worker.js',undefined,keys);await root.fire('activate');assert.deepEqual(root.deleted,[keys[0]]);
 const mm=worker('multimeter/sw.js','http://localhost:8080/multimeter/',keys);await mm.fire('activate');assert.deepEqual(mm.deleted,[keys[1]]);
});
test('root does not intercept sibling PWA, POST, external requests or backend',async()=>{
 const w=worker('service-worker.js');for(const [url,method,mode]of [['/multimeter/','GET','navigate'],['/','POST','navigate'],['http://other.test/','GET','navigate'],['/bridge.py','GET','same-origin']])assert.equal(await w.fire('fetch',{request:{url:new URL(url,'http://localhost:8080').href,method,mode}}),undefined);
});
test('failed network responses cannot poison offline root navigation',async()=>{
 const w=worker('service-worker.js');const key='http://localhost:8080/index.html';w.storage.set(key,new Response('known good'));w.fetch(async()=>new Response('bad',{status:500}));const req={url:'http://localhost:8080/?validate',method:'GET',mode:'navigate'};
 assert.equal(await(await w.fire('fetch',{request:req})).text(),'known good');assert.equal(w.puts.length,0);
 w.fetch(async()=>{throw new Error('offline');});assert.equal(await(await w.fire('fetch',{request:req})).text(),'known good');
});
test('latest successful navigation becomes the offline fallback, not stale ./',async()=>{
 const w=worker('service-worker.js');w.storage.set('http://localhost:8080/',new Response('old root'));const req={url:'http://localhost:8080/',method:'GET',mode:'navigate'};
 await w.fire('fetch',{request:req});w.fetch(async()=>{throw new Error('offline');});assert.equal(await(await w.fire('fetch',{request:req})).text(),'network');
});
test('subdirectory deployment uses a separate cache prefix and correct canonical URL',async()=>{
 const w=worker('service-worker.js','http://localhost:8080/sub/',['kfz-oszi-pwa-signed-803792f7bb4a6c59-%2F-v13.5']);await w.fire('activate');assert.deepEqual(w.deleted,[]);
 await w.fire('fetch',{request:{url:'http://localhost:8080/sub/',method:'GET',mode:'navigate'}});assert.equal(w.puts[0],'http://localhost:8080/sub/index.html');
});
