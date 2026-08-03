import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("transient home API failures preserve the member session", () => {
  assert.match(app, /class ApiError extends Error/);
  assert.match(app, /if \(error\?\.status === 401\)/);
  assert.match(app, /return renderSessionRecovery\(error\)/);
  assert.match(app, /登入資料仍為你保留/);

  const recovery = app.slice(
    app.indexOf("function renderSessionRecovery"),
    app.indexOf("async function renderAuthenticatedMember"),
  );
  assert.doesNotMatch(recovery, /removeItem\("klinkweb_session"\).*重新載入首頁/s);
});

test("successful phone authentication renders without a redundant me request", () => {
  const submit = app.slice(
    app.indexOf("async function submitPhoneBirthdayAuth"),
    app.indexOf("async function renderLogin"),
  );
  assert.match(submit, /await renderAuthenticatedMember\(\)/);
  assert.doesNotMatch(submit, /await render\(\)/);
});
