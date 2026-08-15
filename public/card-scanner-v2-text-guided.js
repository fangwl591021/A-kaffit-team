const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

function gray(imageData){
  const out=new Uint8Array(imageData.width*imageData.height),d=imageData.data;
  for(let i=0,p=0;i<d.length;i+=4,p++)out[p]=Math.round(d[i]*.299+d[i+1]*.587+d[i+2]*.114);
  return out;
}
function percentile(values,r){
  if(!values.length)return 0;const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*r))];
}
function localContrast(gray,width,height){
  const score=new Uint8Array(gray.length),samples=[];
  for(let y=2;y<height-2;y++)for(let x=2;x<width-2;x++){
    const i=y*width+x,c=gray[i];
    const v=Math.max(Math.abs(c-gray[i-1]),Math.abs(c-gray[i+1]),Math.abs(c-gray[i-width]),Math.abs(c-gray[i+width]),Math.abs(c-gray[i-width-1]),Math.abs(c-gray[i+width+1]));
    if((x+y)%7===0)samples.push(v);
  }
  const threshold=clamp(percentile(samples,.78),20,62);
  for(let y=2;y<height-2;y++)for(let x=2;x<width-2;x++){
    const i=y*width+x,c=gray[i];
    const v=Math.max(Math.abs(c-gray[i-1]),Math.abs(c-gray[i+1]),Math.abs(c-gray[i-width]),Math.abs(c-gray[i+width]),Math.abs(c-gray[i-width-1]),Math.abs(c-gray[i+width+1]));
    if(v>=threshold)score[i]=1;
  }
  return score;
}
function components(mask,width,height){
  const visited=new Uint8Array(mask.length),queue=new Int32Array(mask.length),result=[];
  for(let start=0;start<mask.length;start++){
    if(!mask[start]||visited[start])continue;
    let head=0,tail=0;queue[tail++]=start;visited[start]=1;let minX=width,minY=height,maxX=0,maxY=0,count=0;
    while(head<tail){
      const i=queue[head++],x=i%width,y=Math.floor(i/width);count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx<0||xx>=width||yy<0||yy>=height)continue;const ni=yy*width+xx;if(mask[ni]&&!visited[ni]){visited[ni]=1;queue[tail++]=ni;}
      }
    }
    const w=maxX-minX+1,h=maxY-minY+1,area=w*h;
    if(count<3||area<=0)continue;
    result.push({minX,minY,maxX,maxY,width:w,height:h,count,fill:count/area});
  }
  return result;
}
function likelyContentBlocks(imageData){
  const {width,height}=imageData,g=gray(imageData),mask=localContrast(g,width,height);
  const minDim=Math.min(width,height);
  return components(mask,width,height).filter((c)=>{
    const wr=c.width/width,hr=c.height/height;
    const smallGlyph=wr>=.002&&wr<=.18&&hr>=.002&&hr<=.12;
    const qrLike=wr>=.025&&wr<=.22&&hr>=.025&&hr<=.22&&c.fill>=.12;
    return (smallGlyph||qrLike)&&c.width>=2&&c.height>=2&&c.width<minDim*.28&&c.height<minDim*.28;
  });
}
function mergeNearbyBlocks(blocks,width,height){
  if(!blocks.length)return [];
  const used=new Uint8Array(blocks.length),groups=[];
  for(let i=0;i<blocks.length;i++){
    if(used[i])continue;used[i]=1;const group=[blocks[i]];let changed=true;
    while(changed){changed=false;
      const box={minX:Math.min(...group.map(b=>b.minX)),minY:Math.min(...group.map(b=>b.minY)),maxX:Math.max(...group.map(b=>b.maxX)),maxY:Math.max(...group.map(b=>b.maxY))};
      for(let j=0;j<blocks.length;j++){
        if(used[j])continue;const b=blocks[j];
        const gapX=Math.max(0,Math.max(box.minX-b.maxX,b.minX-box.maxX));
        const gapY=Math.max(0,Math.max(box.minY-b.maxY,b.minY-box.maxY));
        if(gapX<=width*.035&&gapY<=height*.03){used[j]=1;group.push(b);changed=true;}
      }
    }
    const minX=Math.min(...group.map(b=>b.minX)),minY=Math.min(...group.map(b=>b.minY)),maxX=Math.max(...group.map(b=>b.maxX)),maxY=Math.max(...group.map(b=>b.maxY));
    groups.push({minX,minY,maxX,maxY,width:maxX-minX+1,height:maxY-minY+1,count:group.length});
  }
  return groups;
}
function groupCluster(groups,width,height){
  const useful=groups.filter(g=>g.count>=2||g.width>=width*.035||g.height>=height*.035);
  if(!useful.length)return null;
  useful.sort((a,b)=>b.count-a.count||b.width*b.height-a.width*a.height);
  const seed=useful[0],picked=[seed];
  for(const g of useful.slice(1)){
    const minX=Math.min(...picked.map(x=>x.minX)),minY=Math.min(...picked.map(x=>x.minY)),maxX=Math.max(...picked.map(x=>x.maxX)),maxY=Math.max(...picked.map(x=>x.maxY));
    const gapX=Math.max(0,Math.max(minX-g.maxX,g.minX-maxX)),gapY=Math.max(0,Math.max(minY-g.maxY,g.minY-maxY));
    if(gapX<=width*.18&&gapY<=height*.15)picked.push(g);
  }
  const minX=Math.min(...picked.map(g=>g.minX)),minY=Math.min(...picked.map(g=>g.minY)),maxX=Math.max(...picked.map(g=>g.maxX)),maxY=Math.max(...picked.map(g=>g.maxY));
  const boxW=maxX-minX+1,boxH=maxY-minY+1;
  if(boxW<width*.14||boxH<height*.07)return null;
  return {minX,minY,maxX,maxY,width:boxW,height:boxH,groups:picked.length,blocks:picked.reduce((s,g)=>s+g.count,0)};
}
function expandContentBox(box,width,height){
  const candidates=[];
  const orientations=['landscape','portrait'];
  for(const orientation of orientations){
    const targetAspect=1.667;
    const contentW=box.width,contentH=box.height;
    const margins=[.06,.09,.12,.16,.20,.25];
    for(const mx of margins)for(const my of margins){
      let w=contentW/(1-2*mx),h=contentH/(1-2*my);
      if(orientation==='landscape'){
        const desired=Math.max(w,h*targetAspect);w=desired;h=desired/targetAspect;
      }else{
        const desired=Math.max(h,w*targetAspect);h=desired;w=desired/targetAspect;
      }
      const cx=(box.minX+box.maxX)/2,cy=(box.minY+box.maxY)/2;
      const left=cx-w/2,right=cx+w/2,top=cy-h/2,bottom=cy+h/2;
      if(left<0||top<0||right>=width||bottom>=height)continue;
      const contentArea=box.width*box.height,cardArea=w*h;
      const contentOccupancy=contentArea/Math.max(1,cardArea);
      if(contentOccupancy<.12||contentOccupancy>.78)continue;
      candidates.push({points:[{x:left,y:top},{x:right,y:top},{x:right,y:bottom},{x:left,y:bottom}],contentOccupancy,orientation});
    }
  }
  return candidates;
}
function edgeEvidence(imageData,points){
  const {width,height}=imageData,g=gray(imageData);let total=0,hits=0;
  for(let e=0;e<4;e++){
    const a=points[e],b=points[(e+1)%4],steps=Math.max(30,Math.min(180,Math.round(distance(a,b)/3)));
    for(let s=0;s<=steps;s++){
      const t=s/steps,x=Math.round(a.x+(b.x-a.x)*t),y=Math.round(a.y+(b.y-a.y)*t);let best=0;
      for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
        const xx=x+dx,yy=y+dy;if(xx<=0||yy<=0||xx>=width-1||yy>=height-1)continue;const i=yy*width+xx;
        best=Math.max(best,Math.abs(g[i-1]-g[i+1]),Math.abs(g[i-width]-g[i+width]));
      }
      total++;if(best>=24)hits++;
    }
  }
  return hits/Math.max(1,total);
}
function surfaceScore(imageData,points){
  const {width,height,data}=imageData;const xs=points.map(p=>p.x),ys=points.map(p=>p.y),minX=Math.max(0,Math.floor(Math.min(...xs))),maxX=Math.min(width-1,Math.ceil(Math.max(...xs))),minY=Math.max(0,Math.floor(Math.min(...ys))),maxY=Math.min(height-1,Math.ceil(Math.max(...ys)));
  const cells=[];for(let gy=0;gy<4;gy++)for(let gx=0;gx<6;gx++){
    let sum=0,count=0;const x0=Math.floor(minX+(maxX-minX)*gx/6),x1=Math.floor(minX+(maxX-minX)*(gx+1)/6),y0=Math.floor(minY+(maxY-minY)*gy/4),y1=Math.floor(minY+(maxY-minY)*(gy+1)/4);
    for(let y=y0;y<y1;y+=3)for(let x=x0;x<x1;x+=3){const i=(y*width+x)*4;sum+=data[i]*.299+data[i+1]*.587+data[i+2]*.114;count++;}
    cells.push(sum/Math.max(1,count));
  }
  const mean=cells.reduce((a,b)=>a+b,0)/cells.length,variance=cells.reduce((s,v)=>s+(v-mean)**2,0)/cells.length;
  return clamp(1-Math.sqrt(variance)/95,0,1);
}

export function detectTextGuidedCard(imageData){
  const {width,height}=imageData;if(width<180||height<180)return null;
  const blocks=likelyContentBlocks(imageData),groups=mergeNearbyBlocks(blocks,width,height),cluster=groupCluster(groups,width,height);
  if(!cluster)return null;
  const candidates=expandContentBox(cluster,width,height).map(c=>{
    const edge=edgeEvidence(imageData,c.points),surface=surfaceScore(imageData,c.points);
    const occupancyScore=clamp(1-Math.abs(c.contentOccupancy-.38)/.32,0,1);
    const confidence=clamp(.42*occupancyScore+.34*edge+.24*surface,0,1);
    return {...c,edgeSupport:Number(edge.toFixed(3)),surfaceConsistency:Number(surface.toFixed(3)),contentDensity:Number(c.contentOccupancy.toFixed(3)),contentFit:Number(occupancyScore.toFixed(3)),confidence:Number(confidence.toFixed(3)),coverage:(c.points[1].x-c.points[0].x)*(c.points[3].y-c.points[0].y)/(width*height),strategy:'text-guided-v2.4',contentBox:cluster};
  });
  candidates.sort((a,b)=>b.confidence-a.confidence||b.edgeSupport-a.edgeSupport);
  const best=candidates[0];
  return best&&best.confidence>=.64?best:null;
}
