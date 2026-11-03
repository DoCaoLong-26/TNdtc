import{polygonArea}from'./anchors.mjs?v=local-grid-20261103';
export const A4_RATIO=210/297;
export function coverCrop(sourceWidth,sourceHeight,ratio=A4_RATIO){
 if(!(sourceWidth>0&&sourceHeight>0&&ratio>0))throw Error('Kích thước camera chưa sẵn sàng.');
 let width=sourceWidth,height=sourceHeight;if(width/height>ratio)width=height*ratio;else height=width/ratio;
 return{x:(sourceWidth-width)/2,y:(sourceHeight-height)/2,width,height};
}
export function sourcePointToPreview(point,crop,viewWidth,viewHeight){return[(point[0]-crop.x)/crop.width*viewWidth,(point[1]-crop.y)/crop.height*viewHeight];}
export function cropPointToSource(point,crop,cropWidth,cropHeight){return[crop.x+point[0]/cropWidth*crop.width,crop.y+point[1]/cropHeight*crop.height];}
export function guidePoints(width,height,template){return template.anchors.map(([x,y])=>[(.06+.88*x/template.width)*width,(.06+.88*y/template.height)*height]);}
export function captureReadiness(current,previous,width,height,elapsed=0){
 if(!current?.anchors)return{ready:false,stable:false,coverage:0,reason:'corners'};
 let coverage=polygonArea(current.anchors)/(width*height),smallestWidth=Math.min(Math.hypot(...current.anchors[0].map((v,i)=>v-current.anchors[1][i])),Math.hypot(...current.anchors[3].map((v,i)=>v-current.anchors[2][i])));
 if(coverage<.42||smallestWidth<width*.58)return{ready:false,stable:false,coverage,reason:'small'};
 let edge=Math.min(...current.anchors.flatMap(([x,y])=>[x/width,y/height,(width-x)/width,(height-y)/height]));if(edge<.004||current.clipped||current.boxes?.some(([x,y,bw,bh])=>x<1||y<1||x+bw>=width-1||y+bh>=height-1))return{ready:false,stable:false,coverage,reason:'edge'};
 let motions=previous?.anchors?current.anchors.map((p,i)=>Math.hypot((p[0]-previous.anchors[i][0])/width,(p[1]-previous.anchors[i][1])/height)).sort((a,b)=>a-b):[Infinity,Infinity,Infinity,Infinity],motion=motions[3],median=(motions[1]+motions[2])/2,stable=median<.012&&motion<.025;
 return{ready:stable&&elapsed>=400,stable,coverage,motion,reason:stable?'stable':'moving'};
}
