import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("home switches to the requested A’kaffit Facebook Page Plugin", () => {
  const app = source("public/app.js");
  const css = source("public/akaffit.css");
  assert.match(app, /data-content-view="facebook">Facebook/);
  assert.match(app, /data-content-panel="facebook"/);
  assert.match(app, /facebook\.com\/plugins\/page\.php\?href=/);
  assert.match(app, /61565353201161/);
  assert.match(app, /https:\/\/facebook\.com\/QR\?id=61565353201161/);
  assert.match(css, /\.ak-facebook-frame\{[^}]*max-width:500px/);
});
