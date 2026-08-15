const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export const CARD_IMAGE_THRESHOLDS=Object.freeze({confidence:0.72,recommendedConfidence:0.86,quality:65});

function canvasBlob(canvas,quality=0.9){return new Promise((resolve)=>canvas.toBlob(resolve,"image/webp",quality));}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function polygonArea(points){return Math.abs(points.reduce((sum,p,index)=>sum+p.x*points[(index+1)%points.length].y-p.y*points[(index+1)%points.length].x,0))/2;}
function dotAngle(a,b,c){const ux=a.x-b.x,uy=a.y-b.y,vx=c.x-b.x,vy=c.y-b.y;return Math.abs((ux*vx+uy*vy)/Math.max(1,Math.hypot(ux,uy)*Math.hypot(vx,vy)));}

export function evaluateCardQuad(points,width,height){
  if(!Array.isArray(points)||points.length!==4||!width||!height)return {confidence:0,coverage:0,aspect:0,plausible:false};
  const [tl,tr,br,bl]=points,coverage=polygonArea(points)/(width*height);
  const cardWidth=(distance(tl,tr)+distance(bl,br))/2,cardHeight=(distance(tl,bl)+distance(tr,br))/2;
  const aspect=Math.max(cardWidth,cardHeight)/Math.max(1,Math.min(cardWidth,cardHeight));
  const margin=Math.max(2,Math.min(width,height)*0.015);
  const edgeSides=[Math.min(tl.x,bl.x)<=margin,Math.min(tl.y,tr.y)<=margin,Math.max(tr.x,br.x)>=width-margin,Math.max(bl.y,br.y)>=height-margin].filter(Boolean).length;
  const maxAngleCos=Math.max(dotAngle(bl,tl,tr),dotAngle(tl,tr,br),dotAngle(tr,br,bl),dotAngle(br,bl,tl));
  const convex=points.every((point,index)=>{const a=points[(index+3)%4],b=point,c=points[(index+1)%4];return ((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x))>=0;})||points.every((point,index)=>{const a=points[(index+3)%4],b=point,c=points[(index+1)%4];return ((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x))<=0;});
  const plausible=convex&&aspect>=1.45&&aspect<=1.90&&coverage>=0.10&&coverage<=0.82&&edgeSides<=2&&maxAngleCos<=0.42;
  const aspectScore=clamp(1-Math.abs(aspect-1.667)/0.30,0,1),coverageScore=clamp((coverage-0.10)/0.52,0,1),angleScore=clamp(1-maxAngleCos/0.42,0,1);
  const confidence=plausible?Number((aspectScore*0.48+coverageScore*0.24+angleScore*0.28).toFixed(3)):0;
  return {confidence,coverage,aspect,horizontal:cardWidth,vertical:cardHeight,plausible,edgeSides,maxAngleCos};
}

export function expandCardQuad(points,width,height,padding=0.025){
  if(!Array.isArray(points)||points.length!==4||!width||!height)return points;
  const center=points.reduce((sum,p)=>({x:sum.x+p.x/4,y:sum.y+p.y/4}),{x:0,y:0});
  return points.map((point)=>({x:clamp(center.x+(point.x-center.x)*(1+padding*2),0,width),y:clamp(center.y+(point.y-center.y)*(1+padding*2),0,height)}));
}

function srgbToLinear(value){value/=255;return value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4;}
function rgbToLab(r,g,b){
  r=srgbToLinear(r);g=srgbToLinear(g);b=srgbToLinear(b);
  const x=(r*0.4124564+g*0.3575761+b*0.1804375)/0.95047,y=(r*0.2126729+g*0.7151522+b*0.072175),z=(r*0.0193339+g*0.119192+b*0.9503041)/1.08883;
  const f=(value)=>value>0.008856?Math.cbrt(value):7.787*value+16/116,fx=f(x),fy=f(y),fz=f(z);
  return [116*fy-16,500*(fx-fy),200*(fy-fz)];
}
function labDistance(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
function percentile(values,ratio){if(!values.length)return 0;const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*ratio))];}

function backgroundModel(imageData){
  const {width,height,data}=imageData,patch=Math.max(8,Math.round(Math.min(width,height)*0.09)),means=[],samples=[];
  const corners=[[0,0],[width-patch,0],[0,height-patch],[width-patch,height-patch]];
  for(const [x0,y0] of corners){const labs=[];for(let y=y0;y<y0+patch;y+=2)for(let x=x0;x<x0+patch;x+=2){const offset=(y*width+x)*4;labs.push(rgbToLab(data[offset],data[offset+1],data[offset+2]));}const mean=[0,1,2].map((channel)=>labs.reduce((sum,lab)=>sum+lab[channel],0)/Math.max(1,labs.length));means.push(mean);samples.push(...labs);}
  let medoid=means[0],best=Infinity;for(const candidate of means){const score=means.reduce((sum,mean)=>sum+labDistance(candidate,mean),0);if(score<best){best=score;medoid=candidate;}}
  const prototypes=means.filter((mean)=>labDistance(mean,medoid)<=18);if(!prototypes.length)prototypes.push(medoid);
  const deviations=samples.map((lab)=>Math.min(...prototypes.map((prototype)=>labDistance(lab,prototype))));
  return {prototypes,threshold:clamp(percentile(deviations,0.90)+7,12,28)};
}

function colorDistanceMap(imageData,model){const {width,height,data}=imageData,result=new Float32Array(width*height);for(let i=0;i<result.length;i++){const offset=i*4,lab=rgbToLab(data[offset],data[offset+1],data[offset+2]);result[i]=Math.min(...model.prototypes.map((prototype)=>labDistance(lab,prototype)));}return result;}
function morph(mask,width,height,radius,dilate){const output=new Uint8Array(mask.length);for(let y=0;y<height;y++)for(let x=0;x<width;x++){let hit=dilate?0:1;for(let dy=-radius;dy<=radius;dy++){const yy=y+dy;if(yy<0||yy>=height){if(!dilate)hit=0;continue;}for(let dx=-radius;dx<=radius;dx++){const xx=x+dx;if(xx<0||xx>=width){if(!dilate)hit=0;continue;}if(dilate&&mask[yy*width+xx]){hit=1;dy=radius+1;break;}if(!dilate&&!mask[yy*width+xx]){hit=0;dy=radius+1;break;}}}output[y*width+x]=hit;}return output;}
function cleanedForeground(distanceMap,width,height,threshold){const mask=Uint8Array.from(distanceMap,(value)=>value>=threshold?1:0);return morph(morph(mask,width,height,2,true),width,height,2,false);}

function components(mask,width,height){
  const visited=new Uint8Array(mask.length),queue=new Int32Array(mask.length),found=[];
  for(let start=0;start<mask.length;start++){if(!mask[start]||visited[start])continue;let head=0,tail=0;queue[tail++]=start;visited[start]=1;const indexes=[];let minX=width,maxX=0,minY=height,maxY=0;
    while(head<tail){const index=queue[head++],x=index%width,y=Math.floor(index/width);indexes.push(index);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx<0||xx>=width||yy<0||yy>=height)continue;const next=yy*width+xx;if(mask[next]&&!visited[next]){visited[next]=1;queue[tail++]=next;}}}
    if(indexes.length>=width*height*0.02)found.push({indexes,minX,maxX,minY,maxY});
  }
  return found.sort((a,b)=>b.indexes.length-a.indexes.length).slice(0,8);
}

function robustLine(points,tolerance){
  if(points.length<12)return null;const sampled=points.filter((_,index)=>index%Math.max(1,Math.floor(points.length/90))===0);let best=null;
  for(let i=0;i<sampled.length;i++)for(let j=i+1;j<sampled.length;j++){const a=sampled[i],b=sampled[j],span=Math.abs(b.t-a.t);if(span<0.35*Math.max(1,points.at(-1).t-points[0].t))continue;const slope=(b.v-a.v)/(b.t-a.t),intercept=a.v-slope*a.t;const residuals=points.map((point)=>Math.abs(point.v-(slope*point.t+intercept))),inliers=residuals.filter((value)=>value<=tolerance).length,median=percentile(residuals,0.5);if(!best||inliers>best.inliers||(inliers===best.inliers&&median<best.median))best={slope,intercept,inliers,median};}
  if(!best)return null;const inlierPoints=points.filter((point)=>Math.abs(point.v-(best.slope*point.t+best.intercept))<=tolerance);if(inlierPoints.length<points.length*0.48)return null;
  const mt=inlierPoints.reduce((sum,p)=>sum+p.t,0)/inlierPoints.length,mv=inlierPoints.reduce((sum,p)=>sum+p.v,0)/inlierPoints.length,den=inlierPoints.reduce((sum,p)=>sum+(p.t-mt)**2,0);const slope=den?inlierPoints.reduce((sum,p)=>sum+(p.t-mt)*(p.v-mv),0)/den:0;
  return {slope,intercept:mv-slope*mt,inlierRatio:inlierPoints.length/points.length};
}
function intersection(horizontal,vertical){const divisor=1-horizontal.slope*vertical.slope;if(Math.abs(divisor)<1e-5)return null;const y=(horizontal.slope*vertical.intercept+horizontal.intercept)/divisor;return {x:vertical.slope*y+vertical.intercept,y};}
function pointInQuad(x,y,points){let sign=0;for(let i=0;i<4;i++){const a=points[i],b=points[(i+1)%4],cross=(b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x);if(Math.abs(cross)<1e-5)continue;const current=Math.sign(cross);if(sign&&current!==sign)return false;sign=current;}return true;}

function componentQuad(component,width,height,distanceMap){
  const componentMask=new Uint8Array(width*height);for(const index of component.indexes)componentMask[index]=1;
  const top=[],bottom=[];for(let x=component.minX;x<=component.maxX;x++){let first=-1,last=-1;for(let y=component.minY;y<=component.maxY;y++)if(componentMask[y*width+x]){if(first<0)first=y;last=y;}if(first>=0){top.push({t:x,v:first});bottom.push({t:x,v:last});}}
  const left=[],right=[];for(let y=component.minY;y<=component.maxY;y++){let first=-1,last=-1;for(let x=component.minX;x<=component.maxX;x++)if(componentMask[y*width+x]){if(first<0)first=x;last=x;}if(first>=0){left.push({t:y,v:first});right.push({t:y,v:last});}}
  const tolerance=Math.max(3,Math.min(width,height)*0.018),lines={top:robustLine(top,tolerance),bottom:robustLine(bottom,tolerance),left:robustLine(left,tolerance),right:robustLine(right,tolerance)};if(Object.values(lines).some((line)=>!line))return null;
  const points=[intersection(lines.top,lines.left),intersection(lines.top,lines.right),intersection(lines.bottom,lines.right),intersection(lines.bottom,lines.left)];if(points.some((point)=>!point||point.x<-width*0.03||point.x>width*1.03||point.y<-height*0.03||point.y>height*1.03))return null;
  const metrics=evaluateCardQuad(points,width,height);if(!metrics.plausible)return null;
  let inside=0,supported=0,separation=0,total=0;const step=Math.max(2,Math.round(Math.min(width,height)/120));for(let y=Math.max(0,Math.floor(component.minY));y<=Math.min(height-1,Math.ceil(component.maxY));y+=step)for(let x=Math.max(0,Math.floor(component.minX));x<=Math.min(width-1,Math.ceil(component.maxX));x+=step)if(pointInQuad(x,y,points)){inside++;if(componentMask[y*width+x])supported++;separation+=distanceMap[y*width+x];total++;}
  const supportRatio=supported/Math.max(1,inside),lineRatio=Object.values(lines).reduce((sum,line)=>sum+line.inlierRatio,0)/4,colorScore=clamp((separation/Math.max(1,total)-10)/35,0,1),aspectScore=clamp(1-Math.abs(metrics.aspect-1.667)/0.30,0,1);
  const confidence=Number(clamp(aspectScore*0.28+lineRatio*0.34+supportRatio*0.24+colorScore*0.14,0,1).toFixed(3));
  return supportRatio>=0.58&&lineRatio>=0.52?{...metrics,points,confidence,boundaryScore:Number(lineRatio.toFixed(3)),supportRatio:Number(supportRatio.toFixed(3)),colorSeparation:Number(colorScore.toFixed(3))}:null;
}

export function detectCardQuad(imageData){
  const {width,height}=imageData;if(width<80||height<80)return null;const model=backgroundModel(imageData),distanceMap=colorDistanceMap(imageData,model),mask=cleanedForeground(distanceMap,width,height,model.threshold),candidates=[];
  for(const component of components(mask,width,height)){const quad=componentQuad(component,width,height,distanceMap);if(quad)candidates.push(quad);}
  candidates.sort((a,b)=>b.confidence-a.confidence||b.coverage-a.coverage);const best=candidates[0];return best&&best.confidence>=0.58?best:null;
}

function solveLinear(matrix,vector){const size=vector.length,a=matrix.map((row,index)=>[...row,vector[index]]);for(let col=0;col<size;col++){let pivot=col;for(let row=col+1;row<size;row++)if(Math.abs(a[row][col])>Math.abs(a[pivot][col]))pivot=row;if(Math.abs(a[pivot][col])<1e-9)return null;[a[col],a[pivot]]=[a[pivot],a[col]];const divisor=a[col][col];for(let j=col;j<=size;j++)a[col][j]/=divisor;for(let row=0;row<size;row++){if(row===col)continue;const factor=a[row][col];for(let j=col;j<=size;j++)a[row][j]-=factor*a[col][j];}}return a.map((row)=>row[size]);}
export function perspectiveCoefficients(points){const matrix=[],vector=[],target=[[0,0],[1,0],[1,1],[0,1]];for(let index=0;index<4;index++){const [u,v]=target[index],{x,y}=points[index];matrix.push([u,v,1,0,0,0,-x*u,-x*v]);vector.push(x);matrix.push([0,0,0,u,v,1,-y*u,-y*v]);vector.push(y);}return solveLinear(matrix,vector);}
export function warpPerspective(source,points,targetWidth,targetHeight){const coefficients=perspectiveCoefficients(points);if(!coefficients)return null;const output=document.createElement("canvas");output.width=targetWidth;output.height=targetHeight;const input=source.getContext("2d").getImageData(0,0,source.width,source.height),context=output.getContext("2d"),result=context.createImageData(targetWidth,targetHeight);for(let y=0;y<targetHeight;y++)for(let x=0;x<targetWidth;x++){const u=x/Math.max(1,targetWidth-1),v=y/Math.max(1,targetHeight-1),divisor=coefficients[6]*u+coefficients[7]*v+1,sx=clamp(Math.round((coefficients[0]*u+coefficients[1]*v+coefficients[2])/divisor),0,source.width-1),sy=clamp(Math.round((coefficients[3]*u+coefficients[4]*v+coefficients[5])/divisor),0,source.height-1),from=(sy*source.width+sx)*4,to=(y*targetWidth+x)*4;result.data[to]=input.data[from];result.data[to+1]=input.data[from+1];result.data[to+2]=input.data[from+2];result.data[to+3]=255;}context.putImageData(result,0,0);return output;}

function qualityScores(imageData,coverage){const {data}=imageData;let brightness=0,glare=0,edges=0,samples=0,previous=0;for(let index=0;index<data.length;index+=16){const value=data[index]*0.299+data[index+1]*0.587+data[index+2]*0.114;brightness+=value;if(value>246)glare++;if(samples)edges+=Math.abs(value-previous);previous=value;samples++;}const average=brightness/Math.max(1,samples),edgeAverage=edges/Math.max(1,samples-1),glareRatio=glare/Math.max(1,samples),brightnessScore=clamp(100-Math.abs(average-145)*0.75,0,100),blurScore=clamp(edgeAverage*5.5,0,100),glareScore=clamp(100-glareRatio*500,0,100),coverageScore=clamp(coverage*145,0,100);return {overall:Math.round(blurScore*0.35+brightnessScore*0.25+glareScore*0.2+coverageScore*0.2),blur:Math.round(blurScore),brightness:Math.round(brightnessScore),glare:Math.round(glareScore),coverage:Math.round(coverageScore)};}

export async function processBusinessCardImage(file){
  if(!file?.type?.startsWith("image/"))throw new Error("請選擇圖片檔案");const bitmap=await createImageBitmap(file);
  try{const detection=document.createElement("canvas"),scale=Math.min(1,900/Math.max(bitmap.width,bitmap.height));detection.width=Math.max(1,Math.round(bitmap.width*scale));detection.height=Math.max(1,Math.round(bitmap.height*scale));const detectionContext=detection.getContext("2d",{willReadFrequently:true});detectionContext.drawImage(bitmap,0,0,detection.width,detection.height);const imageData=detectionContext.getImageData(0,0,detection.width,detection.height),found=detectCardQuad(imageData);
    if(!found)return {file:null,metadata:{processingVersion:"card-image-v4",detection:{detected:false,confidence:0},quality:qualityScores(imageData,0),processing:{perspectiveCorrected:false,cropped:false,rotated:false,lightingEnhanced:false,manualCorrection:false},corners:[],warning:"無法可靠辨識完整名片四角，請手動確認裁切範圍"}};
    const quality=qualityScores(imageData,found.coverage),expandedPoints=expandCardQuad(found.points,detection.width,detection.height),normalized=expandedPoints.map((point)=>({x:point.x/detection.width,y:point.y/detection.height})),orientation=found.horizontal>=found.vertical?"landscape":"portrait";
    const metadata={processingVersion:"card-image-v4",original:{width:bitmap.width,height:bitmap.height},detection:{detected:true,confidence:found.confidence,boundaryScore:found.boundaryScore,supportRatio:found.supportRatio,colorSeparation:found.colorSeparation},card:{orientation,rotation:0},quality,processing:{perspectiveCorrected:true,cropped:true,rotated:false,lightingEnhanced:false,manualCorrection:false},corners:normalized,warning:found.confidence<CARD_IMAGE_THRESHOLDS.recommendedConfidence?"已辨識名片範圍；建議確認四邊與文字是否完整":""};
    if(found.confidence<CARD_IMAGE_THRESHOLDS.confidence||quality.overall<CARD_IMAGE_THRESHOLDS.quality)return {file:null,metadata};
    const source=document.createElement("canvas"),sourceScale=Math.min(1,2200/Math.max(bitmap.width,bitmap.height));source.width=Math.round(bitmap.width*sourceScale);source.height=Math.round(bitmap.height*sourceScale);source.getContext("2d").drawImage(bitmap,0,0,source.width,source.height);const sourcePoints=normalized.map((point)=>({x:point.x*source.width,y:point.y*source.height})),horizontal=(distance(sourcePoints[0],sourcePoints[1])+distance(sourcePoints[3],sourcePoints[2]))/2,vertical=(distance(sourcePoints[0],sourcePoints[3])+distance(sourcePoints[1],sourcePoints[2]))/2,longSide=Math.min(1600,Math.max(1000,Math.round(Math.max(horizontal,vertical)))),shortSide=Math.round(longSide/1.667),width=horizontal>=vertical?longSide:shortSide,height=horizontal>=vertical?shortSide:longSide,corrected=warpPerspective(source,sourcePoints,width,height);if(!corrected)return {file:null,metadata};const blob=await canvasBlob(corrected,0.9);if(!blob)throw new Error("無法輸出名片裁切圖片");return {file:new File([blob],"business-card-smart.webp",{type:"image/webp"}),metadata};
  }finally{bitmap.close?.();}
}
