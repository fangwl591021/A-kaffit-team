import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("內頁功能列開放電子名片共七個功能，返回首頁統一放在 Banner 右側", () => {
  const start = app.indexOf("const portalMenu");
  const end = app.indexOf("function openAiWear", start);
  const menu = app.slice(start, end);
  const actions = [...menu.matchAll(/data-home-action="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(actions, [
    "cardCollection",
    "card",
    "daily",
    "smartMatch",
    "zodiac",
    "calendar",
    "tasks",
  ]);
  assert.ok(menu.includes('data-home-action="cardCollection"><span>名片收藏</span></button><button data-home-action="card"><span>電子名片</span>'));
  assert.ok(menu.includes('data-home-action="calendar"><span>個人行程</span></button><button data-home-action="tasks"><span>AI 任務</span>'));
  assert.ok(!menu.includes('data-home-action="home"'));

  const layoutStart = app.indexOf("function layout");
  const layoutEnd = app.indexOf("async function login", layoutStart);
  const layout = app.slice(layoutStart, layoutEnd);
  assert.ok(layout.includes('class="feature-header-actions"'));
  assert.ok(layout.includes('data-home-action="home" aria-label="返回首頁"'));
  assert.equal((app.match(/data-home-action="home"/g) || []).length, 1);
  assert.ok(!app.includes('class="back-card" data-home-action="home"'));
});
