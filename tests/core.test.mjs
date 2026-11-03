import assert from 'node:assert/strict';
import{createRequire}from'node:module';
import fs from'node:fs';
import{defaults,grade,equal,completeKey,homography,project,findAnchors,readMarks,assemble}from'../public/core.mjs';
const req=createRequire(import.meta.url);
const{createCanvas,loadImage}=req('@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
const{warp,alignmentQuality}=await import('../public/omr.mjs');
const maps=JSON.parse(fs.readFileSync(new URL('../public/templates.json',import.meta.url)));
let cfg={...defaults},key={mc:Array.from({length:12},(_,q)=>'ABCD'[q%4]),tf:Array.from({length:4},()=>['Đ','S','Đ','S']),sa:['-1,5','2','0,25','12','3,5','-2']};
assert(completeKey(key,cfg));assert(!completeKey({...key,mc:[]},cfg));assert.equal(grade(key,key,cfg).total,10);assert(equal('1,50','1.5',cfg));assert(!equal('','0',cfg));assert(!equal('1?','1',cfg));assert(!equal('1|2','1',cfg));assert(!equal('1,50','1.5',{...cfg,numeric:false}));
for(let correct=0;correct<=4;correct++){let c={...cfg,mc:0,tf:1,sa:0},ans={mc:[],tf:[Array.from({length:4},(_,i)=>i<correct?'Đ':'S')],sa:[]},k={mc:[],tf:[['Đ','Đ','Đ','Đ']],sa:[]};assert.equal(grade(ans,k,c).total,[0,.1,.25,.5,1][correct]);}
let h=homography([[0,0],[100,0],[100,100],[0,100]],[[20,40],[150,25],[145,175],[10,160]]);for(let [i,p]of[[0,0],[100,0],[100,100],[0,100]].entries()){let a=project(h,...p),b=[[20,40],[150,25],[145,175],[10,160]][i];assert(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-8);}
for(let [name,t]of Object.entries(maps)){
 let im=await loadImage(new URL('../public/mau-'+name+'.png',import.meta.url).pathname),c=createCanvas(t.width,t.height),x=c.getContext('2d');x.drawImage(im,0,0);let blank=x.getImageData(0,0,t.width,t.height).data;
 let raw=readMarks(blank,blank,t.width,t.groups,cfg.threshold),assembled=assemble(raw,cfg);assert(raw.every(g=>g.value===''),'Blank has no filled circles '+name);
 for(let g of t.groups){let v=g.part==='sbd'?'00123456'[g.q]:g.part==='code'?'1201'[g.q]:g.part==='mc'?key.mc[g.q]:g.part==='tf'?key.tf[g.q]?.[g.sub]:key.sa[g.q]?.[g.sub];for(let p of g.choices)if(p.v===v){x.fillStyle='#111';x.beginPath();x.arc(p.x,p.y,5.5,0,Math.PI*2);x.fill();}}
 let data=x.getImageData(0,0,t.width,t.height).data,read=readMarks(data,blank,t.width,t.groups,cfg.threshold),a=assemble(read,cfg);assert.equal(a.sbd,'00123456',name+' SBD');assert.equal(a.code,'1201',name+' code');assert.deepEqual(a.answers,key,name+' answers');assert.equal(a.warnings.length,0);assert.equal(grade(a.answers,key,cfg).total,10);
 let small=createCanvas(Math.round(t.width*.6),840),sx=small.getContext('2d');sx.drawImage(c,0,0,small.width,small.height);let anchors=findAnchors(sx.getImageData(0,0,small.width,small.height).data,small.width,small.height)?.map(p=>p.map(v=>v/.6));assert(anchors,name+' anchors');let rect=warp(c,t,anchors),q=alignmentQuality(rect,t),ar=assemble(readMarks(rect.getContext('2d').getImageData(0,0,t.width,t.height).data,blank,t.width,t.groups,cfg.threshold),cfg);console.log(name,'alignment',q);assert(q.good,name+' alignment');assert.equal(ar.sbd,'00123456');assert.equal(ar.code,'1201');assert.deepEqual(ar.answers,key,name+' after auto rectification');
 // Double fill and faint mark must enter review.
 let mc=t.groups.find(g=>g.id==='mc0');x.fillStyle='#111';x.beginPath();x.arc(mc.choices[1].x,mc.choices[1].y,5.5,0,Math.PI*2);x.fill();let g=readMarks(x.getImageData(0,0,t.width,t.height).data,blank,t.width,[mc],cfg.threshold)[0];assert(g.uncertain);assert.equal(g.marked.length,2);
 // Projective skew, retaining all corners. Invert coordinates to resample.
 let skew=createCanvas(t.width+120,t.height+100),ss=skew.getContext('2d'),out=ss.createImageData(skew.width,skew.height),H=homography([[45,55],[t.width+65,20],[t.width+100,t.height+60],[20,t.height+40]],[[0,0],[t.width,0],[t.width,t.height],[0,t.height]]),src=c.getContext('2d').getImageData(0,0,t.width,t.height).data;
 for(let y=0;y<skew.height;y++)for(let xx=0;xx<skew.width;xx++){let[u,v]=project(H,xx,y),p=(y*skew.width+xx)*4,k=(Math.round(v)*t.width+Math.round(u))*4;out.data[p+3]=255;for(let j=0;j<3;j++)out.data[p+j]=u>=0&&u<t.width&&v>=0&&v<t.height?src[k+j]:90;}
 ss.putImageData(out,0,0);let anchors2=findAnchors(out.data,skew.width,skew.height);assert(anchors2,'skew anchors '+name);let result=warp(skew,t,anchors2),a2=assemble(readMarks(result.getContext('2d').getImageData(0,0,t.width,t.height).data,blank,t.width,t.groups,cfg.threshold),cfg);assert.equal(a2.sbd,'00123456');assert.equal(a2.code,'1201');assert.equal(a2.answers.mc[0],'A|B');
 fs.writeFileSync(new URL('./fixture-'+name+'.jpg',import.meta.url),c.toBuffer('image/jpeg'));console.log(name,'blank / filled / auto alignment / skew / double-fill passed');
}
console.log('All scoring and synthetic OMR checks passed. Real smartphone photos remain unverified.');
