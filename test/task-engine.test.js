import assert from "node:assert/strict";
import test from "node:test";
import { validateTaskInput } from "../src/task-engine.js";

test("Task Engine validates and normalizes a new task", () => {
  const task = validateTaskInput({
    title:"  回訪王小姐  ",
    description:"確認合作需求",
    dueAt:"2026-07-30T02:00:00.000Z",
    priority:"high",
    contactCardId:"card_1",
  });
  assert.equal(task.title, "回訪王小姐");
  assert.equal(task.priority, "high");
  assert.equal(task.dueAt, "2026-07-30T02:00:00.000Z");
  assert.equal(task.contactCardId, "card_1");
});

test("Task Engine rejects an empty title and invalid due date", () => {
  assert.throws(() => validateTaskInput({ title:"", dueAt:"2026-07-30" }), /任務名稱/);
  assert.throws(() => validateTaskInput({ title:"任務", dueAt:"not-a-date" }), /任務時間/);
});

test("Task Engine falls back to normal priority", () => {
  const task = validateTaskInput({ title:"任務", dueAt:"2026-07-30T02:00:00.000Z", priority:"urgent" });
  assert.equal(task.priority, "normal");
});
