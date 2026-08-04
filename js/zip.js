// ZIP assembly and download helpers. WebP bytes are already compressed, so the
// archive uses STORE mode: faster to build and no CPU spent on re-compression.
export function zipFileName(resourceName, night) {
  return `${resourceName}_${night ? "night_drawables" : "drawables"}.zip`;
}

// buildZipArchive(zipFactory, entries) -> Promise<Blob>
// zipFactory() must return an object with `file(path, bytes)` and
// `generateAsync(options)`, matching the JSZip API (injected for testability).
export async function buildZipArchive(zipFactory, entries) {
  const zip = zipFactory();
  for (const { path, bytes } of entries) {
    zip.file(path, bytes);
  }
  return zip.generateAsync({ type: "blob", compression: "STORE" });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
