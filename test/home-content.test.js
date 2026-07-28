import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("home exposes daily check-in and the directly imported official site", () => {
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const start = app.indexOf("async function home()");
  const end = app.indexOf("async function legacyHome()", start);
  const home = app.slice(start, end);
  assert.match(home, /data-home-action="daily"/);
  assert.match(home, /class="ak-official-import ak-content-panel"/);
  assert.match(home, /class="ak-official-import-frame"/);
  assert.match(home, /src="\/akaffit-official"/);
  assert.match(home, /data-content-view="youtube">YouTube/);
  assert.match(home, /data-content-view="facebook">Facebook/);
  assert.match(home, /data-content-view="instagram">Instagram/);
  assert.match(home, /data-content-view="official">官方網站/);
  assert.match(home, /data-content-panel="facebook"/);
  assert.match(home, /data-content-panel="instagram"/);
  assert.match(home, /data-content-panel="youtube"/);
  assert.match(home, /loadAkaffitYoutube\(\)/);
  assert.doesNotMatch(home, /\/v1\/blog\/posts\?limit=6|A-KAFFIT JOURNAL|ak-brand-story|ak-craft-section/);
  assert.doesNotMatch(home, /聯絡我們|電話|信箱|地址|service@|mailto:|tel:/);
  assert.doesNotMatch(home, />更多功能</);
  assert.doesNotMatch(home, /class="ak-stats"/);
  const features = home.slice(home.indexOf('<div class="ak-feature-grid">'), home.indexOf('</div>', home.indexOf('<div class="ak-feature-grid">')));
  assert.equal((features.match(/<button data-home-action=/g) || []).length, 8);
  assert.doesNotMatch(features, /<i>/);
  assert.doesNotMatch(home, /ak-moment-banner/);
});

test("admin exposes check-in templates and blog management", () => {
  const html = readFileSync(new URL("../public/admin.html", import.meta.url), "utf8");
  assert.match(html, /data-page="carousel"(?! hidden)/);
  assert.match(html, /簽到贈點活動目錄/);
  assert.match(html, /data-page="blog"/);
  assert.match(html, /data-content="blog"/);
});
