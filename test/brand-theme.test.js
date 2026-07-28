import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("public site uses the logo-derived A-kaffit rust theme", () => {
  const css = source("public/akaffit.css");
  const html = source("public/index.html");

  assert.match(css, /--ak-primary:#b95121/);
  assert.match(css, /\.ak-home-banner\{[^}]*var\(--ak-primary\)[^}]*var\(--ak-deep\)/);
  assert.match(css, /body:has\(\.ak-dashboard\)\{[^}]*overflow:hidden/);
  assert.match(css, /\.ak-dashboard\{[^}]*height:calc\(100svh - 112px\)[^}]*overflow:hidden/);
  assert.match(css, /\.ak-home-content\{[^}]*display:flex;flex-direction:column;[^}]*overflow:hidden;overscroll-behavior:contain/);
  assert.match(css, /\.ak-bottom-nav\{[^}]*var\(--ak-primary\)[^}]*var\(--ak-deep\)/);
  assert.match(css, /\.ak-feature-grid\{[^}]*position:relative;flex:0 0 auto;z-index:18/);
  assert.match(css, /\.ak-feature-grid button\{[^}]*color:var\(--ak-primary\)/);
  assert.match(css, /\.ak-official-import\{[^}]*flex:1;[^}]*border-top:6px solid var\(--ak-soft\)/);
  assert.match(css, /\.ak-content-tabs\{[^}]*grid-template-columns:repeat\(2/);
  assert.doesNotMatch(css, /#003f2d|#002d21|#24e56f|#004932|#003b2c/);
  assert.match(html, /\/akaffit-20260729-13\.css/);
});
