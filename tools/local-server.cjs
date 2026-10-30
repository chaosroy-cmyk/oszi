// Local-only test server; avoids browser file:// policy restrictions.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
exports.start=async function(root){
 root=fs.realpathSync(root);
 const server=http.createServer((req,res)=>{
  try{
   let rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(rel.endsWith('/'))rel+='index.html';
   const file=fs.realpathSync(path.resolve(root,'.'+rel));
   if(!file.startsWith(root+path.sep)||!fs.statSync(file).isFile()){res.writeHead(403).end();return;}
   const type={'.html':'text/html;charset=utf-8','.js':'application/javascript','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';
   res.setHeader('Content-Type',type);res.setHeader('Cache-Control','no-store');fs.createReadStream(file).pipe(res);
  }catch(e){res.writeHead(404).end('Not found');}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 return {url:'http://127.0.0.1:'+server.address().port,close:()=>new Promise(resolve=>server.close(resolve))};
};
