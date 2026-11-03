import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import {spawnSync} from 'node:child_process';
assert.equal(spawnSync(process.execPath,['scripts/build-pages.mjs'],{stdio:'inherit'}).status,0);
const root=path.resolve('.'), html=await fs.readFile('index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
for(const base of ['https://teacher.github.io/exam/','https://teacher.github.io/group/cham-thi-smart-github/']) {
 let target;
 vm.runInNewContext(script,{URL,location:{protocol:'https:',href:base+'?x=1#scan',search:'?x=1',hash:'#scan',replace:url=>target=url}});
 assert.equal(target,base+'pages/index.html?x=1#scan');
}
let redirected=false;
vm.runInNewContext(script,{location:{protocol:'file:',replace:()=>redirected=true}});
assert.equal(redirected,false);
const prefix='/nested/exam/';
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');
  if(!url.pathname.startsWith(prefix))throw Error('Outside repository prefix');
  const file=path.resolve(root,url.pathname.slice(prefix.length));
  if(!file.startsWith(root+path.sep))throw Error('Traversal');
  res.end(await fs.readFile(file));
 }catch {res.statusCode=404;res.end('not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try {
 const origin='http://127.0.0.1:'+server.address().port;
 const start=new URL(prefix+'pages/index.html',origin), seen=new Set();
 async function visit(url) {
  if(seen.has(url.href))return;seen.add(url.href);
  assert.ok(url.pathname.startsWith(prefix),'Asset escaped repository: '+url.href);
  const response=await fetch(url);assert.equal(response.status,200,url.href);
  if(!/\.(html|mjs)$/.test(url.pathname))return;
  const content=await response.text();
  const links=url.pathname.endsWith('.html')?[...content.matchAll(/(?:src|href)="([^"#]+)"/g)].map(x=>x[1]):[...content.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)].map(x=>x[1]);
  for(const ref of links)if(!ref.startsWith('https:'))await visit(new URL(ref,url));
 }
 await visit(start);
 for(const asset of ['templates.json','mau-bo.png','mau-qm.png','manifest.webmanifest','icon.svg'])await visit(new URL(asset,start));
 assert.ok(seen.size>15);
 const app=await fs.readFile('pages/app.mjs','utf8'),omr=await fs.readFile('pages/omr.mjs','utf8');
 assert.ok(app.includes("fetch('./templates.json"));assert.ok(omr.includes("loadImage('./mau-'"));
 assert.ok(app.includes('chamthi-pages:'));assert.ok(!app.includes('if(cloudId)await loadCloud'));
 const manifest=JSON.parse(await fs.readFile('pages/manifest.webmanifest','utf8'));
 assert.equal(manifest.start_url,'./index.html');assert.equal(manifest.icons[0].src,'./icon.svg');
 const {api}=await import('../pages/cloud.mjs');
 const realFetch=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('Unexpected API request');};
 try {await assert.rejects(api('me'),/cần backend/);assert.equal(calls,0);}finally{globalThis.fetch=realFetch;}
 console.log('GitHub Pages: nested asset URLs, root redirect, manifest and backend guard passed.');
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
