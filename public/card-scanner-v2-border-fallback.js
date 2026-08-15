const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

function grayscale(imageData){
  const {data,width,height}=imageData,result=new Uint8Array(width*height);
  for(let offset=0,pixel=0;offset<data.length;offset+=4,pixel++)result[pixel]=Math.round(data[offset]*.299+data[offset+1]*.587+data[offset+2]*.114);
  return result;
}

function orientedEdges(gray,width,height){
  const horizontal=[],vertical=[],magnitude=new Float32Array(gray.length),samples=[];
  for(let y=2;y<height-2;y++)for(let x=2;x<width-2;x++){
    const i=y*width+x;
    const gx=-gray[i-width-1]-2*gray[i-1]-gray[i+width-1]+gray[i-width+1]+2*gray[i+1]+gray[i+width+1];
    const gy=-gray[i-width-1]-2*gray[i-width]-gray[i-width+1]+gray[i+width-1]+2*gray[i+width]+gray[i+width+1];
    const mag=Math.hypot(gx,gy);magnitude[i]=mag;
    if((x+y)%5===0)samples.push(mag);
  }
  samples.sort((a,b)=>a-b);
  const threshold=clamp(samples[Math.floor(samples.length*.82)]||42,42,145);
  const stride=Math.max(1,Math.round(Math.sqrt(width*height/280000)));
  for(let y=3;y<height-3;y+=stride)for(let x=3;x<width-3;x+=stride){
    const i=y*width+x,mag=magnitude[i];if(mag<threshold)continue;
    const gx=Math.abs(-gray[i-width-1]-2*gray[i-1]-gray[i+width-1]+gray[i-width+1]+2*gray[i+1]+gray[i+width+1]);
    const gy=Math.abs(-gray[i-width-1]-2*gray[i-width]-gray[i-width+1]+gray[i+width-1]+2*gray[i+width]+gray[i+width+1]);
    // Horizontal border => mostly vertical gradient; vertical border => mostly horizontal gradient.
    if(gy>=gx*1.15)horizontal.push({x,y,mag});
    if(gx>=gy*1.15)vertical.push({x,y,mag});
  }
  return {horizontal,vertical,magnitude,threshold};
}

function linePeaks(points,axisLength,otherLength,mode){
  const slopes=[];for(let m=-.24;m<=.2401;m+=.02)slopes.push(Number(m.toFixed(2)));
  const bin=4,all=[];
  for(const m of slopes){
    const bins=new Map();
    for(const point of points){
      const intercept=mode==='h'?point.y-m*point.x:point.x-m*point.y;
      const key=Math.round(intercept/bin),entry=bins.get(key)||{weight:0,min:Infinity,max:-Infinity,count:0};
      const along=mode==='h'?point.x:point.y;
      entry.weight+=Math.min(180,point.mag);entry.count++;entry.min=Math.min(entry.min,along);entry.max=Math.max(entry.max,along);bins.set(key,entry);
    }
    for(const [key,entry] of bins){
      const span=(entry.max-entry.min)/Math.max(1,axisLength);
      if(entry.count<12||span<.38)continue;
      all.push({m,b:key*bin,score:entry.weight*(.45+.55*span),span,count:entry.count});
    }
  }
  all.sort((a,b)=>b.score-a.score);
  const selected=[];
  for(const line of all){
    const center=mode==='h'?line.m*(axisLength/2)+line.b:line.m*(axisLength/2)+line.b;
    if(center<-otherLength*.05||center>otherLength*1.05)continue;
    if(selected.some((existing)=>Math.abs(existing.m-line.m)<.035&&Math.abs(existing.b-line.b)<14))continue;
    selected.push(line);if(selected.length>=14)break;
  }
  return selected;
}

function intersect(horizontal,vertical){
  // y = mh*x + bh ; x = mv*y + bv
  const den=1-horizontal.m*vertical.m;if(Math.abs(den)<1e-5)return null;
  const x=(vertical.m*horizontal.b+vertical.b)/den;
  return {x,y:horizontal.m*x+horizontal.b};
}

function sampleSupport(magnitude,width,height,a,b){
  const steps=Math.max(30,Math.min(180,Math.round(distance(a,b)/4)));let hits=0;
  for(let step=0;step<=steps;step++){
    const t=step/steps,x=Math.round(a.x+(b.x-a.x)*t),y=Math.round(a.y+(b.y-a.y)*t);let best=0;
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
      const xx=x+dx,yy=y+dy;if(xx<0||xx>=width||yy<0||yy>=height)continue;
      best=Math.max(best,magnitude[yy*width+xx]);
    }
    if(best>=42)hits++;
  }
  return hits/(steps+1);
}

function geometry(points,width,height){
  const [tl,tr,br,bl]=points;
  if(points.some((p)=>!p||p.x<0||p.x>width||p.y<0||p.y>height))return null;
  const top=distance(tl,tr),bottom=distance(bl,br),left=distance(tl,bl),right=distance(tr,br);
  const w=(top+bottom)/2,h=(left+right)/2,aspect=Math.max(w,h)/Math.max(1,Math.min(w,h));
  const area=Math.abs(points.reduce((sum,p,index)=>{const q=points[(index+1)%4];return sum+p.x*q.y-p.y*q.x;},0))/2;
  const coverage=area/(width*height);
  const minMargin=Math.min(...points.flatMap((p)=>[p.x,p.y,width-p.x,height-p.y]))/Math.max(1,Math.min(width,height));
  if(aspect<1.38||aspect>2.02||coverage<.08||coverage>.88)return null;
  return {aspect,coverage,boundaryTouch:minMargin<.010,minMargin};
}

export function detectLongBorderQuad(imageData){
  const {width,height}=imageData;if(width<160||height<160)return null;
  const gray=grayscale(imageData),edges=orientedEdges(gray,width,height);
  if(edges.horizontal.length<30||edges.vertical.length<30)return null;
  const horizontal=linePeaks(edges.horizontal,width,height,'h');
  const vertical=linePeaks(edges.vertical,height,width,'v');
  const candidates=[];
  for(let hi=0;hi<horizontal.length;hi++)for(let hj=hi+1;hj<horizontal.length;hj++){
    const h1=horizontal[hi],h2=horizontal[hj];
    const y1=h1.m*(width/2)+h1.b,y2=h2.m*(width/2)+h2.b;
    if(Math.abs(y2-y1)<height*.16)continue;
    const top=y1<y2?h1:h2,bottom=y1<y2?h2:h1;
    for(let vi=0;vi<vertical.length;vi++)for(let vj=vi+1;vj<vertical.length;vj++){
      const v1=vertical[vi],v2=vertical[vj],x1=v1.m*(height/2)+v1.b,x2=v2.m*(height/2)+v2.b;
      if(Math.abs(x2-x1)<width*.18)continue;
      const left=x1<x2?v1:v2,right=x1<x2?v2:v1;
      const points=[intersect(top,left),intersect(top,right),intersect(bottom,right),intersect(bottom,left)];
      const g=geometry(points,width,height);if(!g)continue;
      const supports=points.map((point,index)=>sampleSupport(edges.magnitude,width,height,point,points[(index+1)%4]));
      const edgeSupport=supports.reduce((a,b)=>a+b,0)/4;
      if(edgeSupport<.28)continue;
      const aspectScore=clamp(1-Math.abs(g.aspect-1.667)/.34,0,1);
      const spanScore=(Math.min(top.span,bottom.span)+Math.min(left.span,right.span))/2;
      const confidence=clamp(aspectScore*.36+edgeSupport*.38+spanScore*.18+(g.boundaryTouch?0:.08),0,1);
      candidates.push({...g,points,edgeSupport:Number(edgeSupport.toFixed(3)),confidence:Number(confidence.toFixed(3)),strategy:'long-border-fallback-v1'});
    }
  }
  candidates.sort((a,b)=>b.confidence-a.confidence||b.coverage-a.coverage);
  const best=candidates[0];
  return best&&best.confidence>=.62?best:null;
}
