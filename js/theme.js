export const THEME_KEY = "theme";
export const LIGHT_THEME = "light";
export const DARK_THEME = "dark";

// Theme helpers operate on a generic "root" (an element with
// setAttribute/removeAttribute/getAttribute) so they are testable without a DOM.

export function resolveTheme(stored) {
  return stored === DARK_THEME ? DARK_THEME : LIGHT_THEME;
}

export function nextTheme(current) {
  return current === DARK_THEME ? LIGHT_THEME : DARK_THEME;
}

export function currentTheme(root) {
  return root.getAttribute("data-theme") === DARK_THEME ? DARK_THEME : LIGHT_THEME;
}

export function iconForTheme(theme) {
  return theme === DARK_THEME ? "img/moon.svg" : "img/sun.svg";
}

export function applyTheme(theme, root, icon) {
  if (theme === DARK_THEME) {
    root.setAttribute("data-theme", DARK_THEME);
  } else {
    root.removeAttribute("data-theme");
  }
  if (icon) {
    icon.src = iconForTheme(theme);
  }
  return theme;
}
