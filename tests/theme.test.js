import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DARK_THEME,
  LIGHT_THEME,
  THEME_KEY,
  applyTheme,
  currentTheme,
  iconForTheme,
  nextTheme,
  resolveTheme,
} from "../js/theme.js";

function fakeRoot(attrs = {}) {
  return {
    attrs: { ...attrs },
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
    removeAttribute(name) {
      delete this.attrs[name];
    },
    getAttribute(name) {
      return this.attrs[name] ?? null;
    },
  };
}

test("resolveTheme maps anything but dark to light", () => {
  assert.equal(resolveTheme("dark"), DARK_THEME);
  assert.equal(resolveTheme("light"), LIGHT_THEME);
  assert.equal(resolveTheme(null), LIGHT_THEME);
  assert.equal(resolveTheme(""), LIGHT_THEME);
  assert.equal(resolveTheme("high-contrast"), LIGHT_THEME);
});

test("nextTheme flips light and dark", () => {
  assert.equal(nextTheme(LIGHT_THEME), DARK_THEME);
  assert.equal(nextTheme(DARK_THEME), LIGHT_THEME);
});

test("iconForTheme picks the matching asset", () => {
  assert.equal(iconForTheme(DARK_THEME), "img/moon.svg");
  assert.equal(iconForTheme(LIGHT_THEME), "img/sun.svg");
});

test("applyTheme toggles the data-theme attribute and icon", () => {
  const root = fakeRoot();
  const icon = { src: "" };

  applyTheme(DARK_THEME, root, icon);
  assert.equal(root.attrs["data-theme"], DARK_THEME);
  assert.equal(icon.src, "img/moon.svg");

  applyTheme(LIGHT_THEME, root, icon);
  assert.equal(root.attrs["data-theme"], undefined);
  assert.equal(icon.src, "img/sun.svg");
});

test("applyTheme tolerates a missing icon", () => {
  const root = fakeRoot();
  applyTheme(DARK_THEME, root, null);
  assert.equal(root.attrs["data-theme"], DARK_THEME);
});

test("currentTheme reflects the root attribute", () => {
  assert.equal(currentTheme(fakeRoot({ "data-theme": "dark" })), DARK_THEME);
  assert.equal(currentTheme(fakeRoot()), LIGHT_THEME);
});

test("THEME_KEY is a stable storage key", () => {
  assert.equal(THEME_KEY, "theme");
});
