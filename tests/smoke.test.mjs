import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../src/index.js";

test("health endpoint identifies the service", async () => {
  const response = await worker.fetch(
    new Request("https://example.test/api/health"),
    { ASSETS: { fetch: () => new Response("asset") } },
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "akaffit-team",
    version: "0.1.0",
  });
});

test("unknown API routes return JSON 404", async () => {
  const response = await worker.fetch(
    new Request("https://example.test/api/missing"),
    { ASSETS: { fetch: () => new Response("asset") } },
  );
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, "not_found");
});

test("frontend includes onboarding and omits generation features", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(html, /行動電話/);
  assert.match(html, /生日/);
  assert.match(html, /人脈推薦/);
  assert.doesNotMatch(html, /AI\s*生成|AI\s*穿戴/iu);
});
