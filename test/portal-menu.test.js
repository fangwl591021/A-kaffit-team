import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("內頁功能列在個人行程後提供返回首頁", () => {
  const start = app.indexOf("const portalMenu");
  const end = app.indexOf("function openAiWear", start);
  const menu = app.slice(start, end);
  const actions = [...menu.matchAll(/data-home-action="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(actions, [
    "cardCollection",
    "daily",
    "smartMatch",
    "zodiac",
    "calendar",
    "tasks",
    "home",
  ]);
  assert.ok(menu.includes('data-home-action="calendar"><span>個人行程</span></button><button data-home-action="tasks"><span>AI 任務</span></button><button data-home-action="home"><span>返回首頁</span>'));
});
