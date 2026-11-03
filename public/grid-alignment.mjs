// Fine registration uses the repeated printed rims, independently of answer ink.
// Each block has its own translation/scale correction after the four-corner warp.
export function alignBubbleGrid(data,blank,w,h,template){
 const gray=new Float32Array(w*h),reference=new Float32Array(w*h);for(let i=0;i<gray.length;i++){let p=i*4;gray[i]=(data[p]+data[p+1]+data[p+2])/3;reference[i]=(blank[p]+blank[p+1]+blank[p+2])/3;}
 const sample=(source,x,y)=>{x=Math.round(x);y=Math.round(y);return x<0||y<0||x>=w||y>=h?255:source[y*w+x];};
 const offsets=[];for(let r of [2,4,6,8,10])for(let i=0;i<12;i++){let a=i*Math.PI/6;offsets.push([Math.cos(a)*r,Math.sin(a)*r]);}
 const features=new Map();
 function feature(p){let key=p.x+','+p.y;if(features.has(key))return features.get(key);let vals=offsets.map(([x,y])=>sample(reference,p.x+x,p.y+y)),mean=vals.reduce((a,b)=>a+b,0)/vals.length,centered=vals.map(v=>v-mean),norm=Math.sqrt(centered.reduce((a,b)=>a+b*b,0));let f={centered,norm};features.set(key,f);return f;}
 function correlation(p,dx,dy){let f=feature(p),vals=offsets.map(([x,y])=>sample(gray,p.x+x+dx,p.y+y+dy)),mean=vals.reduce((a,b)=>a+b,0)/vals.length,dot=0,norm=0;for(let i=0;i<vals.length;i++){let v=vals[i]-mean;dot+=v*f.centered[i];norm+=v*v;}return norm>10&&f.norm>3?dot/Math.sqrt(norm)/f.norm:0;}
 function score(points,dx,dy){let values=points.map(p=>correlation(p,dx,dy)).sort((a,b)=>b-a);let n=Math.max(3,Math.ceil(values.length*.55));return values.slice(0,n).reduce((a,b)=>a+b,0)/n;}
 function search(points,cx=0,cy=0,range=9){let sparse=points.filter((_,i)=>i%Math.max(1,Math.floor(points.length/24))===0),candidates=[];for(let dy=cy-range;dy<=cy+range;dy+=1)for(let dx=cx-range;dx<=cx+range;dx+=1)candidates.push({dx,dy,score:score(sparse,dx,dy)});candidates.sort((a,b)=>b.score-a.score);let seeds=[];for(let c of candidates)if(seeds.length<1&&!seeds.some(p=>Math.hypot(p.dx-c.dx,p.dy-c.dy)<3))seeds.push(c);let best=candidates[0];for(let seed of seeds)for(let dy=seed.dy-1;dy<=seed.dy+1;dy+=.5)for(let dx=seed.dx-1;dx<=seed.dx+1;dx+=.5){let s=score(points,dx,dy);if(s>best.score)best={dx,dy,score:s};}return{...best,baseline:score(points,0,0)};}

 const key=g=>g.part==='sbd'||g.part==='code'?g.part:g.part==='mc'?'mc'+Math.floor(g.q/10):g.part==='tf'?'tf'+Math.floor(g.q/2):'sa'+g.q,blocks=new Map();for(let g of template.groups){let k=key(g);if(!blocks.has(k))blocks.set(k,[]);blocks.get(k).push(...g.choices);}
 let corrections=new Map(),reports=[];
 for(let[k,points]of blocks){let base=search(points),mx=points.reduce((s,p)=>s+p.x,0)/points.length,my=points.reduce((s,p)=>s+p.y,0)/points.length,accepted=base.score>.35&&base.score>base.baseline+.035;
  // Keep the calibrated map when there is no measured improvement.
  let nodes=[];if(accepted){for(let sx of[-1,1])for(let sy of[-1,1]){let ps=points.filter(p=>(p.x-mx)*sx>=0&&(p.y-my)*sy>=0);if(ps.length<6)continue;let q=search(ps,base.dx,base.dy,3);if(q.score>.35&&Math.abs(q.dx)<=11&&Math.abs(q.dy)<=11)nodes.push({...q,x:ps.reduce((s,p)=>s+p.x,0)/ps.length,y:ps.reduce((s,p)=>s+p.y,0)/ps.length});}}
  corrections.set(k,{base:accepted?base:{dx:0,dy:0},nodes});reports.push({block:k,...base,applied:accepted});
 }
 let groups=template.groups.map(g=>{let correction=corrections.get(key(g));return{...g,choices:g.choices.map(p=>{let dx=correction.base.dx,dy=correction.base.dy;if(correction.nodes.length===4){let ns=correction.nodes,x0=Math.min(...ns.map(n=>n.x)),x1=Math.max(...ns.map(n=>n.x)),y0=Math.min(...ns.map(n=>n.y)),y1=Math.max(...ns.map(n=>n.y)),u=Math.max(-.5,Math.min(1.5,(p.x-x0)/(x1-x0||1))),v=Math.max(-.5,Math.min(1.5,(p.y-y0)/(y1-y0||1)));dx=0;dy=0;for(let n of ns){let weight=(n.x<(x0+x1)/2?1-u:u)*(n.y<(y0+y1)/2?1-v:v);dx+=n.dx*weight;dy+=n.dy*weight;}}return{...p,x:p.x+Math.max(-11,Math.min(11,dx)),y:p.y+Math.max(-11,Math.min(11,dy)),templateX:p.x,templateY:p.y};})};});
 return{groups,reports,good:reports.every(r=>r.score>.35),maxShift:Math.max(...groups.flatMap(g=>g.choices.map(p=>Math.hypot(p.x-p.templateX,p.y-p.templateY))))};
}
