import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const server=http.createServer(async(req,res)=>{try{const name=path.basename(decodeURIComponent(new URL(req.url,'http://localhost').pathname))||'index.html';if(!['index.html','app.css','app.js','재무리포트.html'].includes(name)){res.writeHead(404);res.end();return;}const data=await readFile(path.join(root,name));res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8');res.end(data);}catch{res.writeHead(404);res.end();}});
server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
