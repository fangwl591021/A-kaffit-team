import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('compatibility layer installs upload normalization and routes OCR through gate',()=>{
  const compat=source('public/card-image-smart-20260815-5.js');
  assert.match(compat,/import '\.\/card-scanner-v2-upload\.js'/);
  assert.match(compat,/processBusinessCardImage.*card-scanner-v2-gate\.js/);
});

test('existing app keeps the stable scan UI while V2 controls processing underneath',()=>{
  const app=source('public/app.js');
  assert.match(app,/from "\/card-image-smart-20260815-5\.js"/);
  assert.match(app,/prepareBusinessCardImage/);
  assert.match(app,/processBusinessCardImage\(file\)/);
  assert.match(app,/uploadCardImageOriginal\(file,sideLabel,purpose\)/);
});

test('runtime uses working and analysis resolution plans before perspective correction',()=>{
  const runtime=source('public/card-scanner-v2-runtime.js');
  assert.match(runtime,/normalizeCardSource/);
  assert.match(runtime,/workingLongEdge:CARD_SCANNER_RESOLUTION\.workingLongEdge/);
  assert.match(runtime,/analysisLongEdge:CARD_SCANNER_RESOLUTION\.analysisLongEdge/);
  assert.match(runtime,/analysisPointsToWorking/);
  assert.match(runtime,/finalOutputSize/);
  assert.match(runtime,/warpPerspective\(workingCanvas/);
  assert.match(runtime,/releaseCanvas\(analysisCanvas\)/);
  assert.match(runtime,/releaseCanvas\(workingCanvas\)/);
});

test('high-resolution original upload is reduced before R2 while small images are preserved',()=>{
  const upload=source('public/card-scanner-v2-upload.js');
  assert.ok(upload.includes('/v1/card-images'));
  assert.match(upload,/normalizeWorkingSource/);
  assert.match(upload,/workingLongEdge:CARD_SCANNER_RESOLUTION\.workingLongEdge/);
  assert.match(upload,/normalized\.working\.width===normalized\.input\.width/);
  assert.match(upload,/business-card-working\.webp/);
  assert.match(upload,/x-card-resolution-normalized/);
});

test('manual crop is final authority, uses working resolution and incomplete photos never reach OCR',()=>{
  const gate=source('public/card-scanner-v2-gate.js');
  assert.match(gate,/CARD_RETAKE_REQUIRED/);
  assert.match(gate,/未完整入鏡|貼近照片邊界/);
  assert.match(gate,/manualWorkingFile/);
  assert.match(gate,/normalizeWorkingSource/);
  assert.match(gate,/workingLongEdge:CARD_SCANNER_RESOLUTION\.workingLongEdge/);
  assert.match(gate,/manualCorrection:true/);
  assert.match(gate,/不會把這張圖送給 AI OCR/);
  assert.doesNotMatch(gate,/fetch\(/);
});

test('v2.3 fallback ranks candidates using content and surface evidence, not long lines alone',()=>{
  const fallback=source('public/card-scanner-v2-border-fallback.js');
  assert.match(fallback,/candidateContentEvidence/);
  assert.match(fallback,/contentDensity/);
  assert.match(fallback,/contentFit/);
  assert.match(fallback,/surfaceConsistency/);
  assert.match(fallback,/strategy:'long-border-fallback-v2\.3'/);
});

test('v2.4 adds a local text-guided candidate without OCR or network calls',()=>{
  const guided=source('public/card-scanner-v2-text-guided.js');
  assert.match(guided,/detectTextGuidedCard/);
  assert.match(guided,/likelyContentBlocks/);
  assert.match(guided,/expandContentBox/);
  assert.match(guided,/strategy:'text-guided-v2\.4'/);
  assert.doesNotMatch(guided,/fetch\s*\(/);
  assert.doesNotMatch(guided,/openai|gemini|recognize|ocr/i);
});

test('v2.4 runtime compares geometry long-border and text-guided candidates together',()=>{
  const runtime=source('public/card-scanner-v2-runtime.js');
  assert.match(runtime,/detectCardQuad\(imageData\)/);
  assert.match(runtime,/detectLongBorderQuad\(imageData\)/);
  assert.match(runtime,/detectTextGuidedCard\(imageData\)/);
  assert.match(runtime,/chooseCandidate/);
  assert.match(runtime,/candidateScore/);
  assert.match(runtime,/candidateCount/);
  assert.match(runtime,/candidates:/);
});

test('scanner lab exposes v2.4 candidate comparison while remaining zero-token',()=>{
  const lab=source('public/card-scanner-v2-lab.html');
  assert.match(lab,/Card Scanner V2\.4 Lab/);
  assert.match(lab,/候選比較/);
  assert.match(lab,/文字引導/);
  assert.match(lab,/內容密度/);
  assert.match(lab,/內容貼合/);
  assert.match(lab,/表面一致性/);
  assert.doesNotMatch(lab,/fetch\(/);
  assert.doesNotMatch(lab,/\/recognize/);
});
