import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("home embeds the official A’kaffit Instagram profile", () => {
  const app = source("public/app.js");
  assert.match(app, /data-content-view="instagram">Instagram/);
  assert.match(app, /data-content-panel="instagram"/);
  assert.match(app, /https:\/\/www\.instagram\.com\/akaffit\/embed\//);
  assert.match(app, /class="ak-instagram-frame"/);
  assert.doesNotMatch(app, /src="https:\/\/www\.instagram\.com\/akaffit\/" loading=/);
});
