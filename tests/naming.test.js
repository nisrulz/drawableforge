import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeResourceName,
  fileExtension,
  fileStem,
  SUPPORTED_EXTENSIONS,
} from "../js/naming.js";

test("sanitizeResourceName lowercases and keeps [a-z0-9_]", () => {
  assert.equal(sanitizeResourceName("My_Cool-Image"), "my_cool_image");
});

test("sanitizeResourceName collapses and trims underscores", () => {
  assert.equal(sanitizeResourceName("__a___b___"), "a_b");
  assert.equal(sanitizeResourceName("  leading-trailing  "), "leading_trailing");
});

test("sanitizeResourceName prepends img_ when leading-digit", () => {
  assert.equal(sanitizeResourceName("123icon"), "img_123icon");
  assert.equal(sanitizeResourceName("9-ball"), "img_9_ball");
});

test("sanitizeResourceName rejects empty results", () => {
  assert.throws(
    () => sanitizeResourceName("!!!"),
    /valid Android resource name/
  );
  assert.throws(() => sanitizeResourceName(""), /valid Android resource name/);
});

test("fileExtension returns the lowercase extension with dot", () => {
  assert.equal(fileExtension("Photo.PNG"), ".png");
  assert.equal(fileExtension("a.b.webp"), ".webp");
});

test("fileStem strips the last extension", () => {
  assert.equal(fileStem("my.image.png"), "my.image");
  assert.equal(fileStem("icon"), "icon");
});

test("SUPPORTED_EXTENSIONS lists the browser-decodable formats", () => {
  assert.deepEqual(SUPPORTED_EXTENSIONS, [".png", ".jpg", ".jpeg", ".webp", ".gif"]);
});
