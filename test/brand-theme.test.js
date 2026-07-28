import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("public site uses the logo-derived A-kaffit rust theme", () => {
  const css = source("public/akaffit.css");
  const html = source("public/index.html");

  assert.match(css, /--ak-primary:#b95121/);
  assert.match(css, /\.ak-home-banner\{[^}]*var\(--ak-primary\)[^}]*var\(--ak-deep\)/);
  assert.match(css, /\.ak-bottom-nav\{[^}]*var\(--ak-primary\)[^}]*var\(--ak-deep\)/);
  assert.match(css, /\.ak-feature-grid button\{[^}]*color:var\(--ak-primary\)/);
  assert.doesNotMatch(css, /#003f2d|#002d21|#24e56f|#004932|#003b2c/);
  assert.match(html, /\/akaffit-20260729-9\.css/);
});
