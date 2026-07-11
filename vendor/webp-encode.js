import Module from './webp-wasm.js';

const defaultWebpConfig = { lossless: 0, quality: 100 };

let modulePromise = null;
function getModule() {
  if (!modulePromise) {
    modulePromise = Module();
  }
  return modulePromise;
}

// encode(RGBA, width, height, hasAlpha, config) -> Promise<Uint8Array>
export async function encode(data, width, height, hasAlpha, config) {
  const module = await getModule();
  const webpConfig = Object.assign({}, defaultWebpConfig, config);
  webpConfig.lossless = Math.min(1, Math.max(0, webpConfig.lossless));
  webpConfig.quality = Math.min(100, Math.max(0, webpConfig.quality));
  return module.encode(data, width, height, hasAlpha, webpConfig);
}
