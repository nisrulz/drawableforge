import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DENSITY_FACTORS,
  SOURCE_DENSITY,
  calculateTargetSize,
  drawableDirectoryName,
  isDensityName,
} from "../js/density.js";

test("DENSITY_FACTORS covers all six buckets", () => {
  assert.deepEqual(Object.keys(DENSITY_FACTORS), [
    "ldpi",
    "mdpi",
    "hdpi",
    "xhdpi",
    "xxhdpi",
    "xxxhdpi",
  ]);
  assert.equal(DENSITY_FACTORS.xxxhdpi, 4.0);
  assert.equal(DENSITY_FACTORS.mdpi, 1.0);
});

test("SOURCE_DENSITY is xxxhdpi by default", () => {
  assert.equal(SOURCE_DENSITY, "xxxhdpi");
});

test("calculateTargetSize normalizes source to baseline then scales", () => {
  // 400x400 at xxxhdpi (4.0) -> baseline 100x100, mdpi (1.0) -> 100x100
  assert.deepEqual(calculateTargetSize(400, 400, DENSITY_FACTORS.mdpi), [100, 100]);
  // xxxhdpi target (4.0) keeps the original size
  assert.deepEqual(calculateTargetSize(400, 400, DENSITY_FACTORS.xxxhdpi), [400, 400]);
  // xxhdpi (3.0) -> 300x300
  assert.deepEqual(calculateTargetSize(400, 400, DENSITY_FACTORS.xxhdpi), [300, 300]);
});

test("calculateTargetSize honors an explicit source density", () => {
  // Treat the 400x400 source as mdpi (1.0): baseline is already 400, xxxhdpi -> 1600
  assert.deepEqual(
    calculateTargetSize(400, 400, DENSITY_FACTORS.xxxhdpi, "mdpi"),
    [1600, 1600]
  );
});

test("calculateTargetSize never drops below 1px", () => {
  assert.deepEqual(calculateTargetSize(1, 1, DENSITY_FACTORS.ldpi), [1, 1]);
});

test("calculateTargetSize rounds to the nearest pixel", () => {
  assert.deepEqual(calculateTargetSize(101, 101, DENSITY_FACTORS.mdpi), [25, 25]);
});

test("isDensityName validates known buckets only", () => {
  assert.ok(isDensityName("ldpi"));
  assert.ok(isDensityName("xxxhdpi"));
  assert.ok(!isDensityName("xxxxdpi"));
  assert.ok(!isDensityName(""));
});

test("drawableDirectoryName builds day and night paths", () => {
  assert.equal(drawableDirectoryName("xxhdpi", false), "drawable-xxhdpi");
  assert.equal(drawableDirectoryName("xxhdpi", true), "drawable-night-xxhdpi");
});
