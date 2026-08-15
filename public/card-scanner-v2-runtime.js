import {
  CARD_IMAGE_THRESHOLDS,
  assessCardCompleteness,
  detectCardQuad,
  expandCardQuad,
  orderQuad,
  warpPerspective,
} from './card-scanner-v2.js';
import {
  CARD_SCANNER_RESOLUTION,
  analysisPointsToWorking,
  canvasToCardFile,
  finalOutputSize,
  normalizeCardSource,
} from './card-scanner-v2-resolution.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const percentile=(values,ratio)=>{
  if(!values.length)return 0;
  const sorted=[...values].sort((a,b)=>a-b);
  return sorted[Math.min(sorted.length-1,Math.max(0,Math.floor((sorted.length-1)*ratio)))];
};

function grayscale(imageData){
  const {data,width,height}=imageData,result=new Uint8Array(width*height);
  for(let offset=0,pixel=0;offset<data.length;offset+=4,pixel++)result[pixel]=Math.round(data[offset]*.299+data[offset+1]*.587+data[offset+2]*.114);
  return result;
}

function assessQuality(imageData){
  const gray=grayscale(imageData),highlights=[];
  let sum=0,sumSq=0,lapSum=0,lapSq=0,count=0;
  const step=Math.max(1,Math.round(Math.sqrt(gray.length/120000)));
  for(let y=1;y<imageData.height-1;y+=step)for(let x=1;x<imageData.width-1;x+=step){
    const index=y*imageData.width+x,value=gray[index];
    sum+=value;sumSq+=value*value;highlights.push(value>=248?1:0);
    const lap=4*value-gray[index-1]-gray[index+1]-gray[index-imageData.width]-gray[index+imageData.width];
    lapSum+=lap;lapSq+=lap*lap;count++;
  }
  count=Math.max(1,count);
  const mean=sum/count,variance=Math.max(0,sumSq/count-mean*mean),contrast=Math.sqrt(variance);
  const lapMean=lapSum/count,lapVariance=Math.max(0,lapSq/count-lapMean*lapMean);
  const glare=highlights.reduce((total,value)=>total+value,0)/count;
  const brightnessScore=clamp(100-Math.abs(mean-160)*.7,0,100);
  const contrastScore=clamp(contrast*2.2,0,100);
  const blurScore=clamp(Math.sqrt(lapVariance)*3.2,0,100);
  const glareScore=clamp(100-glare*500,0,100);
  return {
    overall:Math.round(brightnessScore*.28+contrastScore*.2+blurScore*.34+glareScore*.18),
    blur:Math.round(blurScore),brightness:Math.round(brightnessScore),glare:Math.round(glareScore),coverage:100,
  };
}

function gentleEnhance(canvas){
  const context=canvas.getContext('2d',{willReadFrequently:true});
  const image=context.getImageData(0,0,canvas.width,canvas.height),data=image.data,luminance=[];
  const stride=Math.max(4,Math.floor(data.length/4/50000));
  for(let pixel=0;pixel<data.length/4;pixel+=stride){
    const offset=pixel*4;
    luminance.push(data[offset]*.299+data[offset+1]*.587+data[offset+2]*.114);
  }
  const low=percentile(luminance,.03),high=percentile(luminance,.97),range=Math.max(40,high-low);
  const gain=clamp(205/range,.92,1.10),mid=(low+high)/2,offset=clamp(150-mid*gain,-10,10);
  if(Math.abs(gain-1)<.015&&Math.abs(offset)<2)return canvas;
  for(let index=0;index<data.length;index+=4)for(let channel=0;channel<3;channel++)data[index+channel]=clamp(Math.round(data[index+channel]*gain+offset),0,255);
  context.putImageData(image,0,0);
  return canvas;
}

function normalizedCorners(points,width,height){
  return points.map((point)=>({x:clamp(point.x/width,0,1),y:clamp(point.y/height,0,1)}));
}
function releaseCanvas(canvas){if(canvas){canvas.width=1;canvas.height=1;}}

export async function processBusinessCardImage(file){
  if(!(file instanceof Blob)||!file.size)throw new Error('找不到名片圖片');
  const {plan,workingCanvas,analysisCanvas}=await normalizeCardSource(file,{
    workingLongEdge:CARD_SCANNER_RESOLUTION.workingLongEdge,
    analysisLongEdge:CARD_SCANNER_RESOLUTION.analysisLongEdge,
  });
  let warped=null;
  try{
    const analysisContext=analysisCanvas.getContext('2d',{willReadFrequently:true});
    const analysisImage=analysisContext.getImageData(0,0,analysisCanvas.width,analysisCanvas.height);
    const quality=assessQuality(analysisImage),found=detectCardQuad(analysisImage);
    const baseMetadata={
      original:{width:plan.input.width,height:plan.input.height},
      working:{width:plan.working.width,height:plan.working.height},
      analysis:{width:plan.analysis.width,height:plan.analysis.height},
      detection:{detected:Boolean(found),confidence:Number(found?.confidence||0)},
      card:{orientation:'',rotation:0},quality,
      processing:{perspectiveCorrected:false,cropped:false,rotated:false,lightingEnhanced:false,manualCorrection:false,resolutionNormalized:true},
      corners:found?normalizedCorners(found.points,analysisCanvas.width,analysisCanvas.height):[],warning:'',
    };
    if(!found)return {file:null,metadata:{...baseMetadata,warning:'未能可靠找到名片四邊，請手動裁切；不會呼叫 AI 進行裁切。'}};

    const completeness=assessCardCompleteness(found.points,analysisCanvas.width,analysisCanvas.height);
    if(completeness.boundaryTouch||completeness.score<CARD_IMAGE_THRESHOLDS.completeness){
      return {file:null,metadata:{...baseMetadata,detection:{detected:true,confidence:Math.min(found.confidence,.69)},warning:'名片可能未完整入鏡或貼近照片邊界，請稍微拉遠後重新拍攝。'}};
    }
    if(found.confidence<CARD_IMAGE_THRESHOLDS.confidence){
      return {file:null,metadata:{...baseMetadata,warning:'已找到可能的名片邊界，但信心不足；請確認或手動裁切。'}};
    }

    const analysisExpanded=expandCardQuad(found.points,analysisCanvas.width,analysisCanvas.height);
    const workingPoints=orderQuad(analysisPointsToWorking(analysisExpanded,plan));
    const widthEstimate=(distance(workingPoints[0],workingPoints[1])+distance(workingPoints[3],workingPoints[2]))/2;
    const heightEstimate=(distance(workingPoints[0],workingPoints[3])+distance(workingPoints[1],workingPoints[2]))/2;
    const outputSize=finalOutputSize(widthEstimate,heightEstimate);
    warped=warpPerspective(workingCanvas,workingPoints,outputSize.width,outputSize.height);
    if(!warped)return {file:null,metadata:{...baseMetadata,warning:'透視補正失敗，請改用手動裁切。'}};

    gentleEnhance(warped);
    const output=await canvasToCardFile(warped,'business-card-auto.webp',CARD_SCANNER_RESOLUTION.outputQuality);
    const landscape=outputSize.width>=outputSize.height;
    return {file:output,metadata:{
      ...baseMetadata,
      detection:{detected:true,confidence:found.confidence},
      card:{orientation:landscape?'landscape':'portrait',rotation:0},
      quality:{...quality,coverage:Math.round(found.coverage*100)},
      processing:{perspectiveCorrected:true,cropped:true,rotated:false,lightingEnhanced:true,manualCorrection:false,resolutionNormalized:true},
      corners:normalizedCorners(found.points,analysisCanvas.width,analysisCanvas.height),warning:'',
    }};
  }finally{
    releaseCanvas(warped);
    releaseCanvas(analysisCanvas);
    releaseCanvas(workingCanvas);
  }
}
