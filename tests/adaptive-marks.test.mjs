import assert from 'node:assert/strict';
import{createRequire}from'node:module';import fs from'node:fs';
import{readMarks}from'../public/core.mjs';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require('@napi-rs/canvas');
for(const name of ['bo','qm']){
 const t=JSON.parse(fs.readFileSync(new URL('../public/templates.json',import.meta.url)))[name],im=await loadImage(new URL('../public/mau-'+name+'.png',import.meta.url).pathname),c=createCanvas(t.width,t.height),x=c.getContext('2d');x.drawImage(im,0,0);let blank=x.getImageData(0,0,c.width,c.height).data;
 let chosen=['sbd','code','mc','tf','sa'].map(part=>t.groups.find(g=>g.part===part));
 // Incomplete dark strokes, faint pencil and uneven illumination across the page.
 for(let[i,g]of chosen.entries()){let p=g.choices[2]||g.choices[0];x.fillStyle=i%2?'#b6b6b6':'#555';x.beginPath();x.ellipse(p.x-1.7,p.y,2.4,4.8,0,0,Math.PI*2);x.fill();}
 let d=x.getImageData(0,0,c.width,c.height);for(let y=0;y<c.height;y++)for(let xx=0;xx<c.width;xx++){let light=.82-.36*y/c.height;for(let k=0;k<3;k++)d.data[(y*c.width+xx)*4+k]*=light;}let r=readMarks(d.data,blank,c.width,t.groups);for(let g of chosen){let got=r.find(a=>a.id===g.id);assert.equal(got.value,(g.choices[2]||g.choices[0]).v,name+' '+g.part);if(['code','tf'].includes(g.part))assert(got.uncertain,'faint marks require review');}
 let untouched=r.filter(g=>!chosen.some(a=>a.id===g.id));assert(untouched.every(g=>!g.value&&!g.faint.length),'shaded empty bubbles remain empty '+name);
}
console.log('Faint / incomplete marks across all five fields and shadowed empty bubbles passed for both templates.');
