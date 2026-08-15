import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const notify = readFileSync(new URL('../public/app-notify.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

test('notification layer loads before the main app bundle', () => {
  const notifyIndex = index.indexOf('/app-notify.js');
  const appIndex = index.indexOf('/app-20260815-132.js');
  assert.ok(notifyIndex >= 0);
  assert.ok(appIndex > notifyIndex);
});

test('legacy alert calls are globally routed to in-app notice UI', () => {
  assert.match(notify, /window\.appNotice/);
  assert.match(notify, /window\.alert\s*=\s*\(message\)/);
  assert.match(notify, /ak-notify-card/);
  assert.match(notify, /ak-notify-success/);
  assert.match(notify, /操作完成/);
});

test('notification UI provides a reusable async confirm dialog without browser chrome', () => {
  assert.match(notify, /window\.appConfirm/);
  assert.match(notify, /kind:'confirm'/);
  assert.doesNotMatch(notify, /location\.hostname|document\.domain/);
});
