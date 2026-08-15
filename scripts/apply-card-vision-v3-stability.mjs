import { readFileSync, writeFileSync } from 'node:fs';

const paths=['public/app-20260815-132.js'];

for(const path of paths){
  let source=readFileSync(path,'utf8');

  source=source.replace(
    "if(!file||!localization.detected||localization.incomplete||localization.cropConfidence<0.55)return null;",
    "if(!file||!localization.detected||localization.incomplete||localization.cropConfidence<0.72)return null;",
  );

  source=source.replace(
    "const points=orderQuad(localization.corners.map(p=>({x:p.x*source.width,y:p.y*source.height})));",
    `const rawPoints=orderQuad(localization.corners.map(p=>({x:p.x*source.width,y:p.y*source.height})));
      const center=rawPoints.reduce((acc,p)=>({x:acc.x+p.x/4,y:acc.y+p.y/4}),{x:0,y:0});
      const padFactor=1.025;
      const points=rawPoints.map(p=>({
        x:Math.max(0,Math.min(source.width-1,center.x+(p.x-center.x)*padFactor)),
        y:Math.max(0,Math.min(source.height-1,center.y+(p.y-center.y)*padFactor)),
      }));`,
  );

  source=source.replace(
    "const ratio=Math.max(.45,Math.min(2.2,widthEstimate/Math.max(1,heightEstimate)));\n      const long=Math.min(1600,Math.max(900,Math.round(Math.max(widthEstimate,heightEstimate))));",
    `const rawRatio=widthEstimate/Math.max(1,heightEstimate);
      if(rawRatio<.42||rawRatio>2.4||Math.min(widthEstimate,heightEstimate)<80)return null;
      const ratio=Math.max(.45,Math.min(2.2,rawRatio));
      const long=Math.min(1600,Math.max(1,Math.round(Math.max(widthEstimate,heightEstimate))));`,
  );

  source=source.replace(
    "const b=localization.boundingBox,x=Math.round(b.x*source.width),y=Math.round(b.y*source.height),w=Math.round(b.width*source.width),h=Math.round(b.height*source.height);\n      if(w<50||h<30)return null;",
    `const b=localization.boundingBox;
      const padX=b.width*.015,padY=b.height*.015;
      const left=Math.max(0,b.x-padX),top=Math.max(0,b.y-padY),right=Math.min(1,b.x+b.width+padX),bottom=Math.min(1,b.y+b.height+padY);
      const x=Math.round(left*source.width),y=Math.round(top*source.height),w=Math.round((right-left)*source.width),h=Math.round((bottom-top)*source.height);
      if(w<80||h<50)return null;`,
  );

  writeFileSync(path,source);
}
