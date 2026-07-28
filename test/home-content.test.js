import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("home exposes daily check-in and journal posts", () => {
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const start = app.indexOf("async function home()");
  const end = app.indexOf("async function legacyHome()", start);
  const home = app.slice(start, end);
  assert.match(home, /data-home-action="daily"/);
  assert.match(home, /\/v1\/blog\/posts\?limit=6/);
  assert.match(home, /A-KAFFIT JOURNAL/);
  assert.match(home, /\/akaffit-logo\.png/);
  assert.match(home, /品牌故事/);
  assert.match(home, /咖啡工藝/);
  assert.match(home, /獨創酒釀發酵技術/);
  assert.match(home, /咖啡百科/);
  assert.doesNotMatch(home, /聯絡我們|電話|信箱|地址|service@|mailto:|tel:/);
  assert.doesNotMatch(home, />更多功能</);
  assert.doesNotMatch(home, /class="ak-stats"/);
  const features = home.slice(home.indexOf('<div class="ak-feature-grid">'), home.indexOf('</div>', home.indexOf('<div class="ak-feature-grid">')));
  assert.equal((features.match(/<button data-home-action=/g) || []).length, 8);
  assert.doesNotMatch(features, /<i>/);
  assert.match(home, /class="ak-moment-banner"/);
  assert.match(home, /src="\/akaffit-moment-banner\.png"/);
  assert.ok(home.indexOf('class="ak-moment-banner"') > home.indexOf('class="ak-feature-grid"'));
  assert.ok(home.indexOf('class="ak-moment-banner"') < home.indexOf('class="ak-official-site"'));
});

test("admin exposes check-in templates and blog management", () => {
  const html = readFileSync(new URL("../public/admin.html", import.meta.url), "utf8");
  assert.match(html, /data-page="carousel"(?! hidden)/);
  assert.match(html, /簽到贈點活動目錄/);
  assert.match(html, /data-page="blog"/);
  assert.match(html, /data-content="blog"/);
});
