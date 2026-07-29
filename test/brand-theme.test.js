import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("public site uses the coffee-inspired A-kaffit rust theme", () => {
  const css = source("public/akaffit.css");
  const html = source("public/index.html");

  assert.match(css, /--ak-primary:#b95121/);
  assert.match(css, /--ak-deep:#713015/);
  assert.match(css, /--ak-accent:#d78358/);
  assert.match(css, /--ak-cream:#fff8f3/);
  assert.match(css, /--ak-soft:#f9e9df/);
  assert.match(css, /--ak-ink:#3d2920/);
  assert.match(css, /main#app:has\(\.ak-dashboard\)\{height:100svh;min-height:100svh;max-height:100svh;overflow:hidden/);
  assert.match(css, /\.ak-dashboard\{[^}]*grid-template-rows:auto auto minmax\(0,1fr\);[^}]*height:100svh;[^}]*overflow:hidden/);
  assert.match(css, /\.ak-home-content\{[^}]*display:flex;flex-direction:column;[^}]*min-height:0;[^}]*overflow:hidden/);
  assert.match(css, /\.ak-content-panel\{[^}]*flex:1 1 auto;[^}]*min-height:0/);
  assert.match(css, /\.ak-home-content>\.ak-content-tabs\{[^}]*safe-area-inset-bottom/);
  assert.match(css, /\.ak-home-content>\.ak-content-tabs\{[^}]*grid-template-columns:repeat\(5/);
  assert.doesNotMatch(css, /#003f2d|#002d21|#24e56f|#004932|#003b2c/);
  assert.match(html, /\/akaffit-20260729-26\.css/);
  assert.match(html, /\/app-20260729-94\.js/);
});
