import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const worker = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

test("members can create their electronic card from the existing photo OCR flow", () => {
  const emptyStart = app.indexOf('if (!myCard)');
  const emptyEnd = app.indexOf('const view = state.cardView', emptyStart);
  const emptyCard = app.slice(emptyStart, emptyEnd);
  assert.match(emptyCard, /personalCardCamera[\s\S]*personalCardGallery[\s\S]*startPersonalCardOcr/);
  assert.match(emptyCard, /使用 LINE 資料建立名片/);
  assert.match(emptyCard, /不會加入名片收藏，也不會產生收藏贈點/);

  const scanStart = app.indexOf("function bindPersonalCardScanInputs");
  const scanEnd = app.indexOf("let collectionCards", scanStart);
  const scan = app.slice(scanStart, scanEnd);
  assert.match(scan, /cropCollectionScanImage/);
  assert.match(scan, /compressCardImage/);
  assert.match(scan, /\/v1\/cards\/me\/imports[\s\S]*\/recognize/);
  assert.match(scan, /\/v1\/cards\/me\/imports\/\$\{encodeURIComponent\(eventId\)\}\/confirm/);
  assert.doesNotMatch(scan, /\/submit|queueAndFulfillCardCollectionReward/);
});

test("personal card import stores the scan as a cover without awarding collection points", () => {
  const start = worker.indexOf("const confirmPersonalCardImport");
  const end = worker.indexOf('if (url.pathname === "/v1/tasks"', start);
  const route = worker.slice(start, end);
  assert.match(route, /review_ready/);
  assert.match(route, /INSERT INTO personal_card_media/);
  assert.match(route, /versions\.standard/);
  assert.match(route, /saveMyCard/);
  assert.match(route, /personal_created/);
  assert.doesNotMatch(route, /queueAndFulfillCardCollectionReward|awardPoints|adjustPoints/);
});
test("personal uploads use a separate fingerprint namespace from collection rewards", () => {
  const collection = readFileSync(new URL("../src/card-collection.js", import.meta.url), "utf8");
  assert.match(worker, /createImport[\s\S]{0,240}\{ purpose:"personal" \}/);
  assert.match(collection, /purpose === 'personal'[\s\S]*'personal-card'/);
  assert.match(collection, /personal-card-imports/);
});