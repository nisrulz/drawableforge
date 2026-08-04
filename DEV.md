# Development

DrawableForge is a static, client-side web app. The Go server (`main.go`) is for local preview only. No conversion happens server-side. WASM requires `http://`, so serve the site instead of opening `index.html` directly.

## Local preview

```bash
make serve                         # go run . (default http://127.0.0.1:8000)
make serve PORT=8080               # custom port (falls back to a free port if busy)
make serve PORT=8080 HOST=0.0.0.0  # listen on all interfaces
# or directly:
./scripts/dev.sh                   # go run . (default http://127.0.0.1:8000)
./scripts/dev.sh --port 8080       # custom port
go run . --host 0.0.0.0 --port 8080
```

`make` or `make help` lists all targets. `make build` compiles the dev server to `bin/drawableforge`. `make clean` removes it.

## Tests

Pure logic in `js/density.js`, `js/naming.js`, `js/options.js`, `js/theme.js`, and `js/zip.js` is covered by `node --test`. No browser or WASM required.

```bash
npm test          # node --test over tests/*.test.js
npm run lint      # ESLint 10 (flat config)
```

## Project structure

| Path | Purpose |
|------|---------|
| `index.html` | App markup (served at `/`) |
| `style.css` | Theme and layout |
| `app.js` | Client-side orchestrator: DOM, events, conversion flow |
| `js/density.js` | Density factors, sizing math, drawable dir naming |
| `js/naming.js` | Resource-name sanitization and extension helpers |
| `js/options.js` | `parseOptions`: validate/normalize raw form input |
| `js/theme.js` | Theme state, attribute/icon application |
| `js/encoding.js` | Image load, canvas resize, lossless/lossy WebP encode |
| `js/zip.js` | Zip assembly (STORE), blob download, zip file name |
| `tests/*.test.js` | `node --test` for density, naming, options, theme, zip |
| `.github/workflows/ci.yml` | Lint + `npm test` + `go vet`/`go build` |
| `eslint.config.js` | ESLint 10 flat config |
| `vendor/` | Vendored third-party assets (see `vendor/README.md`) |
| `main.go` | Static dev server with security headers |
| `Makefile` | `serve`, `build`, `clean` targets |
| `scripts/dev.sh` | `go run .` wrapper |
| `package.json` | `type: module` + `npm test` + `npm run lint` |

## Conversion pipeline

1. Validate file extension against `SUPPORTED_EXTENSIONS`.
2. `parseOptions` validates/normalizes form input (source density, quality, resource name).
3. Read source image dimensions.
4. For each density: `target = max(1, round(W / sourceScale * targetScale))`, where `sourceScale` comes from the selected source density (default `xxxhdpi` = 4.0). Draws to an offscreen canvas with high-quality smoothing. All six densities are encoded in parallel (`encodeAllDensities`).
5. Encode: lossy via `canvas.toBlob("image/webp", quality/100)`, lossless via WASM libwebp (passing the `ImageData` buffer directly, no copy).
6. Add `<name>.webp` to a JSZip archive under `drawable[-night]-{density}/` using **STORE** compression (WebP is already compressed).
7. Trigger zip download.

## Conventions

- ES modules under `js/` hold pure, testable logic (no DOM or WASM deps). `app.js` owns the DOM and composes them.
- `calculateTargetSize` (in `js/density.js`) takes an explicit `sourceDensity` parameter.
- `parseOptions` (in `js/options.js`) validates/normalizes form input; `app.js` only reads DOM values.
- `sanitizeResourceName` (in `js/naming.js`) restricts names to `[a-z0-9_]`. Archive and download paths can never contain `/` or `..`.
- Theme and zip helpers accept injected DOM/zip factories so they are testable in Node.
- Vendored libraries are copied into `vendor/` and served locally. See `vendor/README.md` for pinning info.

## Security

- Headers: the dev server sends `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`. Directory listing is disabled. The server also sets `ReadHeaderTimeout`/`IdleTimeout` and shuts down gracefully on Ctrl-C.
- File-type validation is extension-only (see `SUPPORTED_EXTENSIONS` in `js/naming.js`). A non-image renamed to a supported extension passes the gate, but the browser fails to decode it and the conversion fails. No untrusted code ever runs.
- No HTML injection or Zip Slip: dynamic text uses `textContent`. Resource names are restricted to `[a-z0-9_]`.

## GitHub Pages

Enable Pages with source = root of the default branch. `.nojekyll` keeps Jekyll from touching `/vendor`. No build step required.

## Building the binary

```bash
make build        # -> bin/drawableforge
./bin/drawableforge --port 8080
```
