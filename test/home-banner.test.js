import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("home reuses the compact aiweb member banner", () => {
  const app = source("public/app.js");
  const css = source("public/akaffit.css");
  const start = app.indexOf("async function home()");
  const end = app.indexOf("async function legacyHome()", start);
  const home = app.slice(start, end);

  assert.match(home, /member-portal ak-home-banner/);
  assert.match(home, /portal-profile/);
  assert.match(home, /商脈點數/);
  assert.match(home, /專屬分享/);
  assert.match(home, /data-home-action="wallet"/);
  assert.match(home, /data-home-action="share"/);
  assert.match(home, /id="sharePanel"/);
  assert.match(home, /id="shareQr"/);
  assert.match(home, /id="shareInviteUrl"/);
  assert.match(home, /id="copyInvite"/);
  assert.doesNotMatch(home, /商脈指數/);
  assert.doesNotMatch(home, /ak-hero|ak-index-card|ak-meter/);
  assert.match(css, /\.ak-home-content\{[^}]*display:flex;flex-direction:column;[^}]*overflow:hidden/);
  assert.doesNotMatch(css, /\.ak-hero|\.ak-index-card|\.ak-meter/);
});
