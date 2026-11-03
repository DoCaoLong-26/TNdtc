import{canvas}from'./omr.mjs?v=local-grid-20261103';
import{findAnchorsDetailed}from'./anchors.mjs?v=local-grid-20261103';
import{coverCrop,guidePoints,captureReadiness}from'./scan-geometry.mjs?v=local-grid-20261103';

export function sourceSize(source){return{width:source.videoWidth||source.naturalWidth||source.width,height:source.videoHeight||source.naturalHeight||source.height};}
// Match object-fit:cover exactly. This is a crop, never a stretch or a rotation.
export function cameraFrame(source,maxEdge=1280){let size=sourceSize(source),crop=coverCrop(size.width,size.height),scale=Math.min(1,maxEdge/Math.max(crop.width,crop.height)),out=canvas(Math.round(crop.width*scale),Math.round(crop.height*scale));out.getContext('2d',{willReadFrequently:true}).drawImage(source,crop.x,crop.y,crop.width,crop.height,0,0,out.width,out.height);return out;}

export function paintCameraOverlay(overlay,frame,detection,template,readiness){
 if(overlay.width!==frame.width||overlay.height!==frame.height){overlay.width=frame.width;overlay.height=frame.height;}
 let ctx=overlay.getContext('2d'),w=overlay.width,h=overlay.height,guide=guidePoints(w,h,template),color=detection.anchors&&!detection.stale&&readiness?.reason!=='small'&&readiness?.reason!=='edge'&&readiness?.reason!=='moving'?'#7cf3a2':'#ffc96b',line=Math.max(2,w*.004);
 ctx.clearRect(0,0,w,h);ctx.lineWidth=line;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#d2ece8a0';ctx.setLineDash([w*.018,w*.012]);ctx.beginPath();guide.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.stroke();ctx.setLineDash([]);
 for(let i=0;i<4;i++){let[x,y]=guide[i],sx=i===0||i===3?1:-1,sy=i<2?1:-1,len=w*.055;ctx.strokeStyle='#e1f5ed';ctx.beginPath();ctx.moveTo(x+sx*len,y);ctx.lineTo(x,y);ctx.lineTo(x,y+sy*len);ctx.stroke();}
 if(detection.anchors){if(detection.stale)ctx.setLineDash([w*.012,w*.01]);ctx.strokeStyle=color;ctx.lineWidth=line;ctx.beginPath();detection.anchors.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.stroke();ctx.setLineDash([]);}
 for(let[i,p]of detection.partial.entries())if(p){ctx.strokeStyle=detection.anchors&&!detection.stale?color:'#ffc96b';ctx.lineWidth=line;ctx.beginPath();ctx.arc(p[0],p[1],w*.017,0,Math.PI*2);ctx.stroke();}
}

export function createCameraScanner({source,overlay,template,label,onStatus,onCapture,isAutoEnabled=()=>true,isBusy=()=>false,interval=140,getCaptureDelay=()=>400,isContinuous=()=>false}){
 let stopped=false,timer=null,previous=null,lastValid=null,lastValidAt=0,display=null,stableSince=null,consecutive=0,failedPose=null,latest=null,waitingNext=false,absentSince=null,lastStatus=null;
 const say=text=>{if(label.textContent!==text)label.textContent=text;};
 const status=text=>{if(lastStatus!==text){lastStatus=text;onStatus?.(text);}};
 const poseMotion=(a,b,w,h)=>Math.max(...a.map((p,i)=>Math.hypot((p[0]-b[i][0])/w,(p[1]-b[i][1])/h)));
 async function tick(){
  if(stopped)return;
  let tickStarted=performance.now();
  try{
   if(document.hidden||isBusy()){previous=null;stableSince=null;consecutive=0;return;}
   let frame=cameraFrame(source,840),ctx=frame.getContext('2d',{willReadFrequently:true}),time=performance.now(),detection=findAnchorsDetailed(ctx.getImageData(0,0,frame.width,frame.height).data,frame.width,frame.height,{template,previous:time-lastValidAt<1500?lastValid:null}),readiness=captureReadiness(detection,previous,frame.width,frame.height,stableSince===null?0:time-stableSince);
   if(waitingNext&&!isContinuous()){waitingNext=false;absentSince=null;}
   if(waitingNext){
    if(!detection.anchors){absentSince??=time;if(time-absentSince>=600){waitingNext=false;absentSince=null;previous=null;stableSince=null;consecutive=0;}}else absentSince=null;
    paintCameraOverlay(overlay,frame,detection,template,{reason:"moving"});say("Đã lưu · Lấy phiếu cũ ra khỏi khung rồi đặt phiếu tiếp");latest=null;return;
   }
   if(detection.anchors){
    consecutive++;lastValid=detection;lastValidAt=performance.now();if(readiness.stable)stableSince??=time;else stableSince=null;
    display=display?.length===4?detection.anchors.map((p,i)=>p.map((v,j)=>v*.7+display[i][j]*.3)):detection.anchors;
    paintCameraOverlay(overlay,frame,{...detection,anchors:display,partial:display},template,readiness);
   }else{
    consecutive=0;stableSince=null;
    if(lastValid&&time-lastValidAt<450)paintCameraOverlay(overlay,frame,{...lastValid,anchors:display||lastValid.anchors,partial:display||lastValid.anchors,stale:true},template,readiness);
    else{display=null;paintCameraOverlay(overlay,frame,detection,template,readiness);}
   }
   previous=detection;latest={anchors:detection.anchors,width:frame.width,height:frame.height,readiness,at:time};if(label.dataset)label.dataset.state=!detection.anchors?'searching':failedPose?'held':readiness.stable?'ready':'measuring';if(detection.anchors&&!failedPose&&readiness.stable)status('Mẫu '+template.name+' · '+(isAutoEnabled()?'Đã khớp bố cục, giữ yên để tự chụp.':'Đã khớp bố cục, bấm Chụp ngay để kiểm tra.'));
   if(failedPose&&detection.anchors&&poseMotion(detection.anchors,failedPose,frame.width,frame.height)>.025)failedPose=null;
   if(!detection.anchors)say(lastValid&&time-lastValidAt<450?'Đang bám lại góc · Chưa chụp':detection.partial.every(Boolean)?'Đang kiểm tra vị trí bốn ô góc…':'Đưa đủ bốn ô góc ngoài cùng vào hình');
   else if(readiness.reason==='small')say('Đã khớp mẫu · Đưa máy gần hơn một chút');
   else if(readiness.reason==='edge')say('Ô neo đang bị cắt mép · Đưa máy xa hơn một chút');
   else if(failedPose)say('Cần chỉnh lại góc chụp · Hoặc bấm Chụp ngay để kiểm tra');
   else if(!isAutoEnabled())say('Đã khớp 4 góc · Bấm Chụp để nhận dạng');
   else say(readiness.stable?'Giữ yên · Chụp sau '+Math.max(1,Math.ceil((getCaptureDelay()-(time-(stableSince??time)))/1000))+' giây':'Đã khớp mẫu · Đang ổn định bốn góc');
   if(readiness.ready&&stableSince!==null&&time-stableSince>=getCaptureDelay()&&consecutive>=3&&isAutoEnabled()&&!failedPose){
    say('Đang chụp và kiểm tra ảnh…');stableSince=null;previous=null;consecutive=0;
    let accepted=await onCapture({liveAnchors:detection.anchors,liveWidth:frame.width,liveHeight:frame.height});
    if(accepted===true&&isContinuous()&&!stopped){waitingNext=true;absentSince=null;}
    if(accepted===false&&!stopped){failedPose=detection.anchors;say('Ảnh chưa đạt · Chỉnh lại tư thế hoặc bấm Chụp ngay');}
   }
  }catch(e){previous=null;stableSince=null;consecutive=0;say('Đang lấy hình camera…');status(e.message);}
  finally{if(!stopped)timer=setTimeout(tick,Math.max(20,interval-(performance.now()-tickStarted)));}
 }
 timer=setTimeout(tick,0);
 return{stop(){stopped=true;clearTimeout(timer);},getLatest(){return latest;},reset(){failedPose=null;stableSince=null;consecutive=0;previous=null;}};
}
