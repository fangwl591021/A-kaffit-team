import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const app = source("public/app.js");
const css = source("public/akaffit.css");
const start = app.indexOf("async function home()");
const end = app.indexOf("async function legacyHome()", start);
const home = app.slice(start, end);

test("home member summary preserves profile, wallet, and exclusive sharing actions", () => {
  assert.match(home, /class="ak-member-summary"/);
  assert.match(home, /data-home-action="profile"/);
  assert.match(home, /data-home-action="wallet"/);
  assert.match(home, /data-home-action="share"/);
  assert.match(home, /\$\{format\(wallet\.balance\)\}/);
  assert.match(home, /專屬分享/);
  assert.match(home, /id="shareQr"/);
  assert.match(home, /id="shareInviteUrl"/);
  assert.match(home, /id="copyInvite"/);
  assert.doesNotMatch(home, /商脈指數|商脈點數|ak-hero|ak-index-card|ak-meter/);
  assert.match(css, /\.ak-member-summary\{[^}]*background:var\(--ak-cream\)/);
  assert.match(css, /\.ak-member-actions\{display:grid;grid-template-columns:1fr 1fr/);
});

test("greeting follows morning, afternoon, and evening periods", () => {
  const helperStart = app.indexOf("function homeGreeting");
  const helperEnd = app.indexOf("function homeTaskSummary", helperStart);
  const helperSource = app.slice(helperStart, helperEnd);
  const { homeGreeting } = Function(`${helperSource}; return { homeGreeting };`)();
  assert.equal(homeGreeting(new Date(2026, 6, 29, 5, 0)), "早安");
  assert.equal(homeGreeting(new Date(2026, 6, 29, 11, 59)), "早安");
  assert.equal(homeGreeting(new Date(2026, 6, 29, 12, 0)), "午安");
  assert.equal(homeGreeting(new Date(2026, 6, 29, 17, 59)), "午安");
  assert.equal(homeGreeting(new Date(2026, 6, 29, 18, 0)), "晚上好");
  assert.equal(homeGreeting(new Date(2026, 6, 29, 4, 59)), "晚上好");
});
