import { test } from "node:test";
import assert from "node:assert/strict";
import { buildZipArchive, zipFileName } from "../js/zip.js";

function fakeZip() {
  const zip = {
    entries: [],
    generateOptions: null,
  };
  zip.file = (path, bytes) => {
    zip.entries.push({ path, bytes });
  };
  zip.generateAsync = (options) => {
    zip.generateOptions = options;
    return Promise.resolve("blob");
  };
  return zip;
}

test("zipFileName marks night archives", () => {
  assert.equal(zipFileName("icon", false), "icon_drawables.zip");
  assert.equal(zipFileName("icon", true), "icon_night_drawables.zip");
});

test("buildZipArchive writes entries in order and requests STORE compression", async () => {
  const zip = fakeZip();
  const entries = [
    { path: "drawable-mdpi/icon.webp", bytes: new Uint8Array([1]) },
    { path: "drawable-xxxhdpi/icon.webp", bytes: new Uint8Array([2]) },
  ];

  const blob = await buildZipArchive(() => zip, entries);

  assert.equal(blob, "blob");
  assert.deepEqual(zip.entries, entries);
  assert.equal(zip.generateOptions.type, "blob");
  assert.equal(zip.generateOptions.compression, "STORE");
});
