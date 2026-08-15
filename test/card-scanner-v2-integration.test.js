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
  assert.match(upload,/normalizeCardSource/);
  assert.match(upload,/workingLongEdge:CARD_SCANNER_RESOLUTION\.workingLongEdge/);
  assert.match(upload,/plan\.working\.width===plan\.input\.width/);
  assert.match(upload,/x-card-resolution-normalized/);
});

test('manual crop is final authority, uses working resolution and incomplete photos never reach OCR',()=>{
  const gate=source('public/card-scanner-v2-gate.js');
  assert.match(gate,/CARD_RETAKE_REQUIRED/);
  assert.match(gate,/未完整入鏡|貼近照片邊界/);
  assert.match(gate,/manualWorkingFile/);
  assert.match(gate,/workingLongEdge:CARD_SCANNER_RESOLUTION\.workingLongEdge/);
  assert.match(gate,/manualCorrection:true/);
  assert.match(gate,/不會把這張圖送給 AI OCR/);
  assert.doesNotMatch(gate,/fetch\(/);
});
