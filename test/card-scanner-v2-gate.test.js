import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('scanner gate never calls AI or network services',()=>{
  const gate=source('public/card-scanner-v2-gate.js');
  assert.doesNotMatch(gate,/fetch\s*\(/);
  assert.doesNotMatch(gate,/openai|gemini|responses|apiKey/i);
  assert.match(gate,/window\.Cropper/);
});

test('incomplete photos are stopped before OCR instead of falling back to the original image',()=>{
  const gate=source('public/card-scanner-v2-gate.js');
  assert.match(gate,/CARD_RETAKE_REQUIRED/);
  assert.match(gate,/系統不會把這張圖送給 AI OCR/);
  assert.match(gate,/未完整入鏡\|貼近照片邊界/);
  assert.doesNotMatch(gate,/return \{file,metadata/);
});

test('uncertain but complete photos use manual crop as the final authority',()=>{
  const gate=source('public/card-scanner-v2-gate.js');
  assert.match(gate,/const cropped=await manualCrop\(file,reason\)/);
  assert.match(gate,/manualCorrection:true/);
  assert.match(gate,/confidence:1/);
  assert.match(gate,/沒有使用 AI 裁切/);
});

test('legacy import surface now delegates processing through the trusted-crop gate',()=>{
  const facade=source('public/card-image-smart-20260815-5.js');
  assert.match(facade,/processBusinessCardImage \} from '\.\/card-scanner-v2-gate\.js'/);
  assert.match(facade,/detectCardQuad/);
});
