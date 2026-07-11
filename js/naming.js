// The web UI only accepts formats the browser can decode natively.
export const SUPPORTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

export function fileExtension(name) {
  return "." + name.split(".").pop().toLowerCase();
}

export function fileStem(name) {
  return name.replace(/\.[^.]+$/, "");
}

// Produce a valid Android drawable resource name: lowercase, restricted to
// [a-z0-9_], collapsed and trimmed underscores, with an "img_" prefix when the
// result would otherwise start with a digit.
export function sanitizeResourceName(name) {
  let sanitized = name.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  sanitized = sanitized.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  if (!sanitized) {
    throw new Error("Unable to derive a valid Android resource name from the input.");
  }
  if (/^[0-9]/.test(sanitized)) {
    sanitized = "img_" + sanitized;
  }
  return sanitized;
}
