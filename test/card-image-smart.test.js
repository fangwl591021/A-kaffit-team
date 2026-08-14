import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CARD_IMAGE_THRESHOLDS, evaluateCardQuad, perspectiveCoefficients, warpPerspective } from "../public/card-image-smart-20260815-2.js";
import { normalizeCardImageMetadata } from "../src/card-image-processing.js";

const source = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("high-confidence business-card geometry passes automatic processing thresholds", () => {
  const metrics=evaluateCardQuad([{x:80,y:80},{x:920,y:95},{x:900,y:610},{x:95,y:600}],1000,700);
  assert.ok(metrics.confidence >= CARD_IMAGE_THRESHOLDS.confidence);
  assert.ok(metrics.coverage > 0.5);
  assert.equal(perspectiveCoefficients([{x:0,y:0},{x:100,y:0},{x:100,y:60},{x:0,y:60}]).length,8);
});

test("low-coverage geometry falls back to manual review", () => {
  const metrics=evaluateCardQuad([{x:440,y:300},{x:560,y:300},{x:560,y:370},{x:440,y:370}],1000,700);
  assert.ok(metrics.confidence < CARD_IMAGE_THRESHOLDS.confidence);
});

test("perspective warp calculates both source coordinates without a runtime reference error", () => {
  const previousDocument=globalThis.document;
  const pixels=new Uint8ClampedArray([
    10,20,30,255, 40,50,60,255,
    70,80,90,255, 100,110,120,255,
  ]);
  const outputContext={
    output:null,
    createImageData:(width,height)=>({data:new Uint8ClampedArray(width*height*4)}),
    putImageData(imageData){this.output=imageData;},
  };
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>outputContext})};
  const source={width:2,height:2,getContext:()=>({getImageData:()=>({data:pixels})})};
  try{
    warpPerspective(source,[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}],2,2);
    assert.deepEqual([...outputContext.output.data], [...pixels]);
  } finally {
    if(previousDocument===undefined)delete globalThis.document;
    else globalThis.document=previousDocument;
  }
});
test("server normalizes untrusted processing metadata", () => {
  const metadata=normalizeCardImageMetadata({
    detection:{detected:true,confidence:5},quality:{overall:999,blur:-2},
    corners:[{x:-1,y:2},{x:0.2,y:0.3},{x:0.8,y:0.4},{x:1.5,y:-3}],
    processing:{perspectiveCorrected:true,manualCorrection:true},
  });
  assert.equal(metadata.detection.confidence,1);
  assert.equal(metadata.quality.overall,100);
  assert.equal(metadata.quality.blur,0);
  assert.deepEqual(metadata.corners[0],{x:0,y:1});
});

test("original and processed images have separate authenticated storage contracts", () => {
  const worker=source("src/index.js");
  const processing=source("src/card-image-processing.js");
  const collection=source("src/card-collection.js");
  const migration=source("migrations/0046_card_image_processing.sql");
  assert.match(worker, /POST[\s\S]*\/v1\/card-images/);
  assert.match(worker, /currentMember\(request, env\)/);
  assert.match(processing, /bucket\.put\(originalKey, request\.body/);
  assert.match(processing, /processed-r2-key|processed_r2_key/);
  assert.match(collection, /frontJobId|key \+ 'JobId'/);
  assert.match(migration, /original_r2_key TEXT NOT NULL/);
  assert.match(migration, /processed_r2_key TEXT NOT NULL DEFAULT ''/);
});

test("production browser flow preserves originals and only sends processed job ids into OCR", () => {
  const app=source("public/app.js");
  const production=source("public/app-20260815-127.js");
  for(const text of [app,production]){
    assert.match(text,/uploadCardImageOriginal\(file, sideLabel, purpose\)/);
    assert.match(text,/processBusinessCardImage\(file\)/);
    assert.match(text,/confidence<CARD_IMAGE_THRESHOLDS\.confidence/);
    assert.match(text,/cropCollectionScanImage\(file,sideLabel\)/);
    assert.match(text,/form\.append\("frontJobId",collectionScanJobs\[0\]\)/);
  }
});
