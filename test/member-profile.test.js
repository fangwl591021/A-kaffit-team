import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeBirthday } from "../src/member-repository.js";

test("birthday verification accepts ROC birthday passwords and keeps Gregorian compatibility", () => {
  assert.equal(normalizeBirthday("591021"), "1970-10-21");
  assert.equal(normalizeBirthday("390305"), "1950-03-05");
  assert.equal(normalizeBirthday("1120102"), "2023-01-02");
  assert.equal(normalizeBirthday("19901021"), "1990-10-21");
  assert.equal(normalizeBirthday("1990-10-21"), "1990-10-21");
  assert.throws(() => normalizeBirthday("000101"), /民國年月日/);
  assert.throws(() => normalizeBirthday("20260230"), /日期無效/);
});

test("member registration UI includes logo, name, numeric birthday, and repeatable social links", () => {
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /id="memberLogoFile"/);
  assert.match(app, /id="displayName"/);
  assert.match(app, /id="fullName"/);
  assert.match(app, /id="birthday" type="text" inputmode="numeric"/);
  assert.match(app, /生日密碼（民國年月日）/);
  assert.match(app, /591021、390305/);
  assert.match(app, /id="addSocialLink"/);
  assert.match(app, /socialLinks/);
  assert.doesNotMatch(app, /class="ak-brandmark"/);
  const css = fs.readFileSync(new URL("../public/akaffit.css", import.meta.url), "utf8");
  assert.match(css, /\.member-logo-preview\{[^}]*border-radius:50%[^}]*background:var\(--ak-soft\)[^}]*color:var\(--ak-primary\)/);
  assert.doesNotMatch(css, /\.member-logo-preview\{[^}]*border-radius:24px/);
});

test("five-tag UI supports explicit retry and automatic refresh", () => {
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /recalculate-insights/);
  assert.match(app, /data-retry-insights/);
  assert.match(app, /Five-tag refresh unavailable/);
});
