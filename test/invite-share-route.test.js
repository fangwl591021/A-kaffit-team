import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker from "../src/index.js";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

test("exclusive share URL stays on A-kaffit and does not use the shared aiweb LIFF", () => {
  const start = source.indexOf('url.pathname === "/v1/invite-links"');
  const end = source.indexOf('url.pathname.startsWith("/i/")', start);
  const inviteRoute = source.slice(start, end);

  assert.match(inviteRoute, /const shareUrl/);
  assert.match(inviteRoute, /url\.origin/);
  assert.match(inviteRoute, /encodeURIComponent\(invite\.token\)/);
  assert.doesNotMatch(inviteRoute, /liff\.line\.me|env\.LIFF_ID/);
});

test("permanent invite entry redirects to the A-kaffit homepage with the referral token", async () => {
  const response = await worker.fetch(
    new Request("https://akaffit.example/i/permanent-token-123"),
    {},
    {},
  );

  assert.equal(response.status, 302);
  assert.equal(
    response.headers.get("location"),
    "https://akaffit.example/?invite=permanent-token-123",
  );
  assert.doesNotMatch(response.headers.get("location"), /liff\.line\.me/);
});