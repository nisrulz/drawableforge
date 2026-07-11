# Vendored Dependencies

Third-party assets in `/vendor/`. These run in the page's context. Pin to a known-good version and re-verify on update.

| File | Source | Notes |
|------|--------|-------|
| `jszip.min.js` | [JSZip](https://stuk.github.io/jszip/) | Zip writer, global `JSZip`. |
| `webp-wasm.js` / `webp-wasm.wasm` | [wasm-webp](https://github.com/nieyuyao/webp-wasm) | libwebp compiled to WASM. |
| `webp-encode.js` | Local ESM wrapper | Exposes `encode(data, w, h, hasAlpha, config)`. Caches the WASM module. |

## Rules

- Pin each library to an explicit upstream release or commit.
- Prefer Subresource Integrity if served from a CDN instead of locally.
- Do not edit by hand. Replace the whole file on upgrade.
