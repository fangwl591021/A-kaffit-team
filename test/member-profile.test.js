import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeBirthday } from "../src/member-repository.js";

test("birthday verification accepts eight Gregorian digits and keeps legacy canonical dates", () => {
  assert.equal(normalizeBirthday("17901021"), "1790-10-21");
  assert.equal(normalizeBirthday("1990-10-21"), "1990-10-21");
  assert.throws(() => normalizeBirthday("901021"), /8 位西元數字/);
  assert.throws(() => normalizeBirthday("20260230"), /日期無效/);
});

test("member registration UI includes logo, name, numeric birthday, and repeatable social links", () => {
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /id="memberLogoFile"/);
  assert.match(app, /id="displayName"/);
  assert.match(app, /id="fullName"/);
  assert.match(app, /id="birthday" type="text" inputmode="numeric"/);
  assert.match(app, /id="addSocialLink"/);
  assert.match(app, /socialLinks/);
  assert.doesNotMatch(app, /class="ak-brandmark"/);
});

test("five-tag UI supports explicit retry and automatic refresh", () => {
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /recalculate-insights/);
  assert.match(app, /data-retry-insights/);
  assert.match(app, /Five-tag refresh unavailable/);
});
