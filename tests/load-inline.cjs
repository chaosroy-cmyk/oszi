const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
module.exports=function(id){
 const filename=path.join(__dirname,'../index.html');
 const match=fs.readFileSync(filename,'utf8').match(new RegExp('<script id="'+id+'">([\\s\\S]*?)<\\/script>'));
 if(!match)throw new Error('Missing inline module '+id);
 const m=new Module(filename+'.'+id+'.cjs',module);m.filename=filename;m.paths=module.paths;m._compile(match[1],filename);return m.exports;
};
