import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const worker = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const wrangler = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");

test("personal cards use the dedicated LIFF share app without replacing member login", () => {
  assert.match(wrangler, /"LIFF_ID": "2007221311-QPueR5eF"/);
  assert.match(wrangler, /"CARD_SHARE_LIFF_ID": "2010925044-hPtKkoKO"/);
  assert.match(worker, /cardShareLiffId: env\.CARD_SHARE_LIFF_ID \|\| env\.LIFF_ID \|\| ""/);
  assert.match(app, /state\.cardShareMode[\s\S]*state\.config\?\.cardShareLiffId \|\| state\.config\?\.liffId/);
  assert.match(app, /function cardSharePickerUrl\(cardId\)[\s\S]*state\.config\?\.cardShareLiffId \|\| state\.config\?\.liffId/);
  assert.match(app, /url\.searchParams\.set\("shareCardId", cardId\)[\s\S]*url\.searchParams\.set\("share", "1"\)/);
  assert.match(app, /async function sharePersonalCard\(card\)[\s\S]*location\.assign\(cardSharePickerUrl\(card\.id\)\)/);
  assert.match(app, /function cardLineShareUrl\(cardId, card = null\)[\s\S]*https:\/\/line\.me\/R\/share\?text=/);
  assert.match(app, /!liff\.isApiAvailable\?\.\("shareTargetPicker"\)[\s\S]*lineShareFallbackUrl = cardLineShareUrl\(cardId, publicCardResult\.card\)/);
  assert.match(app, /not allowed\|not available\|shareTargetPicker[\s\S]*lineShareFallbackUrl = cardLineShareUrl\(cardId, publicCardResult\?\.card\)/);
  assert.match(app, /if \(lineShareFallbackUrl\)[\s\S]*location\.replace\(lineShareFallbackUrl\)[\s\S]*else if \(pickerFinished\)/);
});
