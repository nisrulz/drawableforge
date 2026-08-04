import { test } from "node:test";
import assert from "node:assert/strict";
import { parseOptions } from "../js/options.js";

test("parseOptions returns a validated options object", () => {
  assert.deepEqual(
    parseOptions({
      lossless: true,
      night: true,
      sourceDensity: "xxhdpi",
      quality: 85,
      resourceName: "  My Icon ",
    }),
    {
      lossless: true,
      night: true,
      sourceDensity: "xxhdpi",
      quality: 85,
      resourceName: "my_icon",
    }
  );
});

test("parseOptions defaults lossless and night to false", () => {
  const result = parseOptions({ sourceDensity: "mdpi", quality: 90, resourceName: "icon" });
  assert.equal(result.lossless, false);
  assert.equal(result.night, false);
});

test("parseOptions rejects unknown source densities", () => {
  assert.throws(
    () => parseOptions({ sourceDensity: "xxxxdpi", quality: 90, resourceName: "icon" }),
    /valid source density/
  );
});

test("parseOptions rejects out-of-range or non-integer quality", () => {
  assert.throws(
    () => parseOptions({ sourceDensity: "mdpi", quality: -1, resourceName: "icon" }),
    /Quality/
  );
  assert.throws(
    () => parseOptions({ sourceDensity: "mdpi", quality: 101, resourceName: "icon" }),
    /Quality/
  );
  assert.throws(
    () => parseOptions({ sourceDensity: "mdpi", quality: 90.5, resourceName: "icon" }),
    /Quality/
  );
  assert.throws(
    () => parseOptions({ sourceDensity: "mdpi", quality: "abc", resourceName: "icon" }),
    /Quality/
  );
});

test("parseOptions accepts numeric strings for quality", () => {
  const result = parseOptions({ sourceDensity: "mdpi", quality: "90", resourceName: "icon" });
  assert.equal(result.quality, 90);
});

test("parseOptions sanitizes the resource name", () => {
  const result = parseOptions({ sourceDensity: "mdpi", quality: 90, resourceName: "My Cool-Image!" });
  assert.equal(result.resourceName, "my_cool_image");
});

test("parseOptions rejects an unusable resource name", () => {
  assert.throws(
    () => parseOptions({ sourceDensity: "mdpi", quality: 90, resourceName: "!!!" }),
    /resource name/
  );
});
