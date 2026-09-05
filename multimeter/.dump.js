const fs=require("fs"),{JSDOM,VirtualConsole}=require("jsdom");
const vc=new VirtualConsole(); vc.on("jsdomError",()=>{}); vc.on("error",()=>{});
const w=new JSDOM(fs.readFileSync("index.html","utf8"),
  {runScripts:"dangerously",url:"https://e.test/multimeter/index.html",virtualConsole:vc,pretendToBeVisual:true}).window;
global.W=w;
const TESTS=w.eval("TESTS"),DEEP=w.eval("DEEP");
for(const id of process.argv.slice(2)){
  const t=TESTS.find(x=>x.id===id);
  if(!t){console.log("?? "+id);continue;}
  console.log("\n████ "+id+" ████");
  console.log(JSON.stringify(t));
  console.log("-- DEEP --");
  console.log(JSON.stringify(DEEP[id]));
}
