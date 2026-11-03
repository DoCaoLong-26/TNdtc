import{templateMarkerFit}from'./registration.mjs?v=local-grid-20261103';
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function polygonArea(points){return Math.abs(points.reduce((s,p,i)=>{let q=points[(i+1)%points.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;}

function components(gray,w,h,threshold,{maxSideRatio=.075,minDensity=.65}={}){
 let seen=new Uint8Array(w*h),queue=new Int32Array(w*h),out=[],short=Math.min(w,h),minimum=Math.max(w,h)>700?8:4;
 for(let p=0;p<w*h;p++){
  if(seen[p]||gray[p]>=threshold)continue;
  let head=0,tail=1,n=0,x0=p%w,x1=x0,y0=Math.floor(p/w),y1=y0,sum=0,sx=0,sy=0,coreN=0,coreX=0,coreY=0;queue[0]=p;seen[p]=1;
  while(head<tail){let i=queue[head++],x=i%w,y=Math.floor(i/w);n++;sum+=gray[i];sx+=x;sy+=y;if(gray[i]<100){coreN++;coreX+=x;coreY+=y;}x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(let j of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(j>=0&&!seen[j]&&gray[j]<threshold){seen[j]=1;queue[tail++]=j;}
  }
  let bw=x1-x0+1,bh=y1-y0+1,density=n/(bw*bh);
  if(n<minimum||bw<2||bh<2||bw>short*maxSideRatio||bh>short*maxSideRatio||bw/bh<.55||bw/bh>1.8||density<minDensity)continue;
  let outside=0,samples=0,margin=Math.max(2,Math.round(Math.max(bw,bh)*.3));
  for(let y=Math.max(0,y0-margin);y<=Math.min(h-1,y1+margin);y++)for(let x=Math.max(0,x0-margin);x<=Math.min(w-1,x1+margin);x++)if(x<x0||x>x1||y<y0||y>y1){outside+=gray[y*w+x];samples++;}
  let contrast=(samples?outside/samples:255)-sum/n;if(contrast<22)continue;
  let point=coreN>=Math.max(4,n*.2)?[coreX/coreN,coreY/coreN]:[sx/n,sy/n];out.push({point,size:Math.sqrt(coreN>=Math.max(4,n*.2)?coreN:n),density,contrast,box:[x0,y0,bw,bh]});
 }
 return out;
}

function quadScore(c,w,h){
 let p=c.map(a=>a.point),[a,b,d,e]=p,top=distance(a,b),bottom=distance(e,d),left=distance(a,e),right=distance(b,d),area=polygonArea(p)/(w*h),ratio=(top+bottom)/(left+right);
 if(area<.12||ratio<.43||ratio>1.13||Math.min(top,bottom)/Math.max(top,bottom)<.48||Math.min(left,right)/Math.max(left,right)<.48)return null;
 if(a[0]>=b[0]||e[0]>=d[0]||a[1]>=e[1]||b[1]>=d[1]||Math.abs(a[1]-b[1])>h*.26||Math.abs(e[1]-d[1])>h*.26)return null;
 let crosses=p.map((v,i)=>{let q=p[(i+1)%4],r=p[(i+2)%4];return(q[0]-v[0])*(r[1]-q[1])-(q[1]-v[1])*(r[0]-q[0]);});if(crosses.some(x=>x<=0))return null;
 let sizes=c.map(v=>v.size),sizeFit=Math.min(...sizes)/Math.max(...sizes);if(sizeFit<.5)return null;
 let center=[p.reduce((s,x)=>s+x[0],0)/4,p.reduce((s,x)=>s+x[1],0)/4],centerError=Math.hypot(center[0]/w-.5,center[1]/h-.5),aspectFit=Math.exp(-Math.abs(Math.log(ratio/.7))*3);
 return{score:area*.65+aspectFit*.2+sizeFit*.15-centerError*.18,coverage:area,aspect:ratio,sizeFit};
}

export function findAnchorsDetailed(data,w,h,options={}){
 let gray=new Uint8Array(w*h),hist=new Uint32Array(256);for(let i=0;i<gray.length;i++){let p=i*4,g=Math.floor((data[p]+data[p+1]+data[p+2])/3);gray[i]=g;hist[g]++;}
 let acc=0,white=255;for(let i=0;i<256;i++){acc+=hist[i];if(acc>=gray.length*.9){white=i;break;}}
 let base=Math.max(110,Math.min(170,Math.round(white*.62))),best=null,partial=[],all=[],pool=[[],[],[],[]],proposals=[],fitCache=new Map();
 const fitProposal=proposal=>{let key=proposal.anchors.map(p=>p.map(v=>Math.round(v/2)).join(",")).join(";");if(!fitCache.has(key))fitCache.set(key,templateMarkerFit(gray,w,h,options.template,proposal.anchors,{ignoreRegions:options.ignoreRegions||[]}));return fitCache.get(key);};
 if(options.template&&options.previous?.anchors){let tracked=refineTrackedCorners(data,w,h,options.previous.anchors,options.template);if(tracked){let quality=quadScore(tracked.anchors.map((point,i)=>({point,size:tracked.sizes[i]})),w,h),fit=templateMarkerFit(gray,w,h,options.template,tracked.anchors,{ignoreRegions:options.ignoreRegions||[]});if(quality&&fit.good&&fit.ratio>=.8&&!tracked.clipped)return{...quality,...tracked,templateFit:fit,partial:tracked.anchors,tracked:true,candidateCount:4};}}
 for(let threshold of [base,Math.max(75,base-35),Math.min(200,base+30)]){
  let candidates=components(gray,w,h,threshold),groups=[[],[],[],[]],targets=[[.08,.07],[.92,.07],[.92,.93],[.08,.93]];
  for(let c of candidates){let[x,y]=c.point,index=-1;if(x<w*.38&&y<h*.32)index=0;else if(x>w*.62&&y<h*.32)index=1;else if(x>w*.62&&y>h*.68)index=2;else if(x<w*.38&&y>h*.68)index=3;if(index>=0)groups[index].push(c);}
  groups=groups.map((a,i)=>{for(let c of a)if(!pool[i].some(p=>distance(p.point,c.point)<2&&Math.abs(p.size-c.size)<2))pool[i].push(c);return pool[i].slice().sort((u,v)=>Math.hypot(u.point[0]/w-targets[i][0],u.point[1]/h-targets[i][1])-Math.hypot(v.point[0]/w-targets[i][0],v.point[1]/h-targets[i][1])).slice(0,10);});
  for(let i=0;i<4;i++)if(groups[i][0]&&!partial[i])partial[i]=groups[i][0].point;
  all.push(...candidates);
  if(groups.every(a=>a.length))for(let a of groups[0])for(let b of groups[1])for(let c of groups[2])for(let d of groups[3]){let q=[a,b,c,d],quality=quadScore(q,w,h);if(quality){let proposal={anchors:q.map(v=>v.point),...quality,threshold,boxes:q.map(v=>v.box)};if(!best||quality.score>best.score)best=proposal;proposals.push(proposal);if(proposals.length>80){proposals.sort((a,b)=>b.score-a.score);proposals.length=40;}}}
  // Validate likely outer quads immediately; other thresholds are fallbacks,
  // not compulsory passes on every camera frame.
  if(options.template){let ordered=[...proposals].sort((a,b)=>b.score-a.score);for(let proposal of ordered.slice(0,12)){let fit=fitProposal(proposal);if(fit.good&&fit.strongPattern)return{...proposal,templateFit:fit,partial:proposal.anchors,candidateCount:all.length};}}
  if(!options.template&&best?.coverage>.78&&best.sizeFit>.65)break;
 }
 if(options.template){
  let prior=options.previous?.anchors;if(prior){let tracked=refineTrackedCorners(data,w,h,prior,options.template);if(tracked){let sizes=tracked.sizes,q=tracked.anchors.map((point,i)=>({point,size:sizes[i]})),quality=quadScore(q,w,h);if(quality)proposals.push({...quality,...tracked,tracked:true});}}
  proposals.sort((a,b)=>b.score-a.score);let validated=[];for(let proposal of proposals.slice(0,40)){let fit=fitProposal(proposal);if(!fit.good)continue;let motion=prior?Math.max(...proposal.anchors.map((p,i)=>Math.hypot((p[0]-prior[i][0])/w,(p[1]-prior[i][1])/h))):1;validated.push({...proposal,templateFit:fit,selectionScore:fit.score*.65+proposal.score*.3+Math.max(0,.02-motion)*2.5});}
  validated.sort((a,b)=>b.selectionScore-a.selectionScore);best=validated[0]||null;
 }
 return best?{...best,partial:best.anchors,candidateCount:all.length}:{anchors:null,partial:Array.from({length:4},(_,i)=>partial[i]||null),coverage:0,candidateCount:all.length};
}
export function findAnchors(data,w,h){return findAnchorsDetailed(data,w,h).anchors;}

export function refineTrackedCorners(data,w,h,anchors,template){
 let rgba=data.length===w*h*4,points=[],boxes=[],sizes=[],expected=Math.max(3,Math.hypot(anchors[1][0]-anchors[0][0],anchors[1][1]-anchors[0][1])/(template?.width||981)*(template?.name?.startsWith('QM')?22:18));
 for(let point of anchors){let radius=Math.ceil(Math.max(12,expected*2.2)),x0=Math.max(0,Math.floor(point[0]-radius)),y0=Math.max(0,Math.floor(point[1]-radius)),pw=Math.min(w-x0,2*radius+1),ph=Math.min(h-y0,2*radius+1),patch=new Uint8Array(pw*ph),hist=new Uint32Array(256);for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){let p=(y+y0)*w+x+x0,g=rgba?Math.floor((data[p*4]+data[p*4+1]+data[p*4+2])/3):data[p];patch[y*pw+x]=g;hist[g]++;}let acc=0,white=255;for(let i=0;i<256;i++){acc+=hist[i];if(acc>patch.length*.8){white=i;break;}}let base=Math.max(90,Math.min(180,white*.65)),candidates=[];
  for(let threshold of [base,100,Math.min(205,base+25)])for(let c of components(patch,pw,ph,threshold,{maxSideRatio:.65,minDensity:.35})){let[x,y,bw,bh]=c.box,global=[c.point[0]+x0,c.point[1]+y0],d=Math.hypot(global[0]-point[0],global[1]-point[1]);if(c.size<expected*.35||c.size>expected*2.1||d>radius*.8||x===0||y===0||x+bw>=pw-1||y+bh>=ph-1)continue;candidates.push({...c,point:global,box:[x+x0,y+y0,bw,bh],rank:d/expected+Math.abs(Math.log(c.size/expected))*.2});}
  candidates.sort((a,b)=>a.rank-b.rank);let selected=candidates[0];if(!selected)return null;points.push(selected.point);boxes.push(selected.box);sizes.push(selected.size);
 }
 return{anchors:points,boxes,sizes,clipped:boxes.some(([x,y,bw,bh])=>x<1||y<1||x+bw>=w-1||y+bh>=h-1)};
}
