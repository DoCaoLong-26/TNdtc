import{homography,project}from'./projective.mjs?v=local-grid-20261103';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const percentile=(a,p)=>{a.sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor(a.length*p))]??255;};

// Compare local ink with local paper, so exposure and blue/gray shadows do not
// turn a correct sheet into a failure. Searches stay within a few template pixels.
export function templateMarkerFit(data,w,h,template,anchors,{ignoreRegions=[]}={}){
 const rgba=data.length===w*h*4,gray=(x,y)=>{x=clamp(Math.round(x),0,w-1);y=clamp(Math.round(y),0,h-1);let i=y*w+x;return rgba?(data[i*4]+data[i*4+1]+data[i*4+2])/3:data[i];};
 let H;try{H=homography(template.anchors,anchors);}catch{return{good:false,ratio:0,score:0,matches:[],visible:0};}
 let checks=[...new Map((template.markers||[]).filter(([x,y])=>!template.anchors.some(([a,b])=>Math.hypot(a-x,b-y)<25)).map(p=>[p.join(','),p])).values()],matches=[],totals={left:0,right:0,middle:0},hits={left:0,right:0,middle:0};
 for(let target of checks){let[x,y]=project(H,...target);if(x<1||x>=w-1||y<1||y>=h-1||ignoreRegions.some(([a,b,c,d])=>x>=a&&x<=a+c&&y>=b&&y<=b+d))continue;
  let px=project(H,target[0]+8,target[1]),py=project(H,target[0],target[1]+8),scale=(Math.hypot(px[0]-x,px[1]-y)+Math.hypot(py[0]-x,py[1]-y))/16,radius=clamp(Math.ceil(scale*7),2,10),outer=Math.max(radius+3,Math.ceil(scale*15)),background=percentile([gray(x-outer,y),gray(x+outer,y),gray(x,y-outer),gray(x,y+outer),gray(x-outer,y-outer),gray(x+outer,y-outer),gray(x-outer,y+outer),gray(x+outer,y+outer)],.7),best=Infinity,bestPoint=[x,y],core=scale>.8?1:0;
  for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){let val=0,n=0;for(let cy=-core;cy<=core;cy++)for(let cx=-core;cx<=core;cx++){val+=gray(x+dx+cx,y+dy+cy);n++;}val=val/n+Math.hypot(dx,dy)*.7;if(val<best){best=val;bestPoint=[x+dx,y+dy];}}
  let contrast=background-best,above=percentile([-2,0,2].map(dx=>gray(bestPoint[0]+dx*scale,bestPoint[1]-outer)),.5),below=percentile([-2,0,2].map(dx=>gray(bestPoint[0]+dx*scale,bestPoint[1]+outer)),.5),isolated=Math.min(above,below)>best+Math.max(15,contrast*.25),hit=background>70&&contrast>Math.max(22,background*.17)&&best<background*.8&&isolated,group=target[0]<template.width*.18?'left':target[0]>template.width*.82?'right':'middle';totals[group]++;if(hit)hits[group]++;
  matches.push({target,expected:[x,y],observed:bestPoint,hit,contrast,group});
 }
 let visible=matches.length,count=matches.filter(m=>m.hit).length,ratio=visible?count/visible:0,sideGood=Object.keys(totals).every(k=>!totals[k]||hits[k]>=(k==='middle'?Math.ceil(totals[k]*.5):Math.max(1,Math.floor(totals[k]*.4)))),ys=matches.filter(m=>m.hit).map(m=>m.target[1]),span=ys.length?(Math.max(...ys)-Math.min(...ys))/template.height:0;
 let markerGood=visible>=5&&ratio>=.64&&sideGood&&span>.35,rims=markerGood?rimEvidence(gray,H,template):0;
 let strongPattern=markerGood&&ratio>=.9&&Object.keys(totals).every(k=>!totals[k]||hits[k]>=Math.ceil(totals[k]*.75));
 return{good:markerGood&&(rims>.45||strongPattern),strongPattern,ratio,rims,score:ratio*.6+Math.min(1,span)*.1+rims*.3,matches,visible,hits,totals,span};
}

function rimEvidence(gray,H,template){
 let hits=0,total=0;
 for(let g of template.groups.filter(g=>g.part==='mc'&&[1,4,7].includes(g.q%10)))for(let b of g.choices){
  let center=project(H,b.x,b.y),px=project(H,b.x+12,b.y),py=project(H,b.x,b.y+12),scale=(Math.hypot(px[0]-center[0],px[1]-center[1])+Math.hypot(py[0]-center[0],py[1]-center[1]))/24,background=percentile([gray(...px),gray(...py),gray(...project(H,b.x-12,b.y)),gray(...project(H,b.x,b.y-12)),gray(...project(H,b.x+10,b.y+10)),gray(...project(H,b.x-10,b.y-10))],.8),r=template.name.startsWith('QM')?7.7:6.8,search=clamp(Math.round(scale*1.7),1,2);
  for(let i=0;i<8;i++){let p=project(H,b.x+Math.cos(i*Math.PI/4)*r,b.y+Math.sin(i*Math.PI/4)*r),dark=255;for(let dy=-search;dy<=search;dy++)for(let dx=-search;dx<=search;dx++)dark=Math.min(dark,gray(p[0]+dx,p[1]+dy));if(background-dark>Math.max(10,background*.055))hits++;total++;}
 }
 return total?hits/total:0;
}
