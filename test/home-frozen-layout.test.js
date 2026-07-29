import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("home compacts its banner and freezes feature plus social navigation", () => {
  const app = source("public/app.js");
  const css = source("public/akaffit.css");
  const start = app.indexOf("async function home()");
  const end = app.indexOf("async function legacyHome()", start);
  const home = app.slice(start, end);

  assert.match(home, /class="ak-home-avatar"[\s\S]*data-home-action="wallet"[\s\S]*data-home-action="zodiacPopup"[\s\S]*data-home-action="share"/);
  assert.match(home, /ak-zodiac-icon[\s\S]*<svg/);
  assert.match(home, /ak-share-qr-icon[\s\S]*<svg/);
  assert.doesNotMatch(home, /dateText|greeting/);
  assert.match(home, /class="ak-frozen-nav"[\s\S]*class="ak-feature-grid"[\s\S]*class="ak-content-tabs"/);
  assert.match(css, /\.ak-dashboard\{height:calc\(100svh - 75px\)\}/);
  assert.match(css, /\.ak-home-banner \.portal-primary\{min-height:75px/);
  assert.match(css, /\.ak-frozen-nav\{[^}]*flex:0 0 auto/);
  assert.match(css, /\.ak-home-banner\{grid-template-columns:\.72fr repeat\(3,1fr\)\}/);
  assert.match(home, /\$\{avatar\(\)\}<span class="ak-home-label">會員專區<\/span>/);
  assert.match(css, /\.ak-home-avatar \.avatar\{width:38px;height:38px/);
  assert.match(css, /\.ak-zodiac-entry\{display:flex;flex-direction:column;gap:3px/);
  assert.match(css, /\.ak-share-entry\{display:flex;flex-direction:column;gap:3px/);
  assert.match(css, /\.ak-frozen-nav \.ak-feature-grid button\{min-height:40px/);
  assert.match(css, /\.ak-frozen-nav \.ak-content-tabs button\{min-height:36px/);
});

test("exclusive share opens as a closable QR dialog", () => {
  const app = source("public/app.js");

  assert.match(app, /id="sharePanel" class="ak-share-dialog hidden" role="dialog" aria-modal="true"/);
  assert.match(app, /class="ak-share-close" data-close-share aria-label="關閉專屬分享">×/);
  assert.match(app, /function closeShareQr\(\)[\s\S]*classList\.add\("hidden"\)/);
  assert.match(app, /data-close-share/);
  assert.doesNotMatch(app.slice(app.indexOf("async function showShareQr()"), app.indexOf("async function copyInvite()")), /scrollIntoView|site-home-frame/);
});


test("home zodiac opens a closable fortune dialog without changing tabs", () => {
  const app = source("public/app.js");
  const css = source("public/akaffit.css");
  const homeStart = app.indexOf("async function home()");
  const homeEnd = app.indexOf("async function legacyHome()", homeStart);
  const home = app.slice(homeStart, homeEnd);

  assert.match(home, /data-home-action="zodiacPopup"/);
  assert.match(app, /if\(action==="zodiacPopup"\)return showZodiacDialog\(\)/);
  assert.match(app, /function showZodiacDialog\(\)[\s\S]*dialog\.className = "ak-zodiac-dialog"/);
  assert.match(app, /class="ak-zodiac-close" data-close-zodiac aria-label="關閉星座運勢">×/);
  assert.match(app, /function zodiacFortuneMarkup\(fortune\)/);
  assert.match(css, /\.ak-zodiac-dialog\{position:fixed/);
  assert.match(css, /\.ak-zodiac-card\{[^}]*max-height:90svh;overflow:auto/);
});
