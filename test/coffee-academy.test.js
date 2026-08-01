import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const source = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("coffee academy presents the complete Golden Journey slide deck", () => {
  const app = source("public/app.js");
  assert.match(app, /data-academy-course="golden-journey">醇金之旅/);
  assert.match(app, /\{ length:43 \}/);
  assert.match(app, /slide-\$\{String\(index\)\.padStart\(2, "0"\)\}\.jpg/);
  for (let index = 0; index < 43; index += 1) {
    const file = `../public/assets/academy/golden-journey/slide-${String(index).padStart(2, "0")}.jpg`;
    assert.equal(existsSync(new URL(file, import.meta.url)), true, `${file} should exist`);
  }
});

test("Golden Journey supports swipe, controls, and ten-second autoplay", () => {
  const app = source("public/app.js");
  const css = source("public/akaffit.css");
  const start = app.indexOf("function initGoldenJourney()");
  const end = app.indexOf("function homeTaskSummary", start);
  const slideshow = app.slice(start, end);
  assert.match(slideshow, /setInterval\([\s\S]*?, 10000\)/);
  assert.match(slideshow, /data-golden-prev/);
  assert.match(slideshow, /data-golden-next/);
  assert.match(slideshow, /track\.scrollTo/);
  assert.match(slideshow, /ArrowLeft/);
  assert.match(slideshow, /ArrowRight/);
  assert.match(css, /\.ak-golden-track\{[^}]*overflow-x:auto[^}]*scroll-snap-type:x mandatory[^}]*touch-action:pan-x pan-y/);
  assert.match(css, /\.ak-golden-slide\{[^}]*min-width:100%[^}]*scroll-snap-align:start/);
  assert.match(css, /\.ak-golden-slide img\{[^}]*object-fit:contain/);
});
