import { calculateTargetSize } from "./density.js";
import { encode } from "../vendor/webp-encode.js";

export function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export function canvasToWebpBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality / 100);
  });
}

// Render the source image at a single target density and return the encoded
// WebP bytes (Uint8Array) for either the lossless WASM or native lossy path.
export async function renderDensity(img, scale, { lossless, quality, sourceDensity }) {
  const [targetWidth, targetHeight] = calculateTargetSize(
    img.naturalWidth,
    img.naturalHeight,
    scale,
    sourceDensity
  );

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  if (lossless) {
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    return encode(
      new Uint8Array(imageData.data),
      targetWidth,
      targetHeight,
      true,
      { lossless: 1 }
    );
  }

  const blob = await canvasToWebpBlob(canvas, quality);
  return new Uint8Array(await blob.arrayBuffer());
}
