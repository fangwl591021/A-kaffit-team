import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app=readFileSync(new URL('../public/app-20260815-132.js',import.meta.url),'utf8');

test('Vision V3 requires conservative crop confidence',()=>{
  assert.match(app,/cropConfidence<0\.72/);
});

test('Vision V3 adds bounded safe padding around AI corners',()=>{
  assert.match(app,/padFactor=1\.025/);
  assert.match(app,/Math\.max\(0,Math\.min\(source\.width-1/);
});

test('Vision V3 bounding-box fallback keeps small safety margin',()=>{
  assert.match(app,/padX=b\.width\*\.015/);
  assert.match(app,/padY=b\.height\*\.015/);
});

test('Vision V3 rejects implausible aspect ratios and tiny crops',()=>{
  assert.match(app,/rawRatio<\.42\|\|rawRatio>2\.4/);
  assert.match(app,/Math\.min\(widthEstimate,heightEstimate\)<80/);
});

test('Vision V3 never upscales a low-resolution crop to an artificial minimum',()=>{
  assert.doesNotMatch(app,/Math\.max\(900/);
  assert.match(app,/Math\.min\(1600,Math\.max\(1,Math\.round\(Math\.max\(widthEstimate,heightEstimate\)\)\)\)/);
});
