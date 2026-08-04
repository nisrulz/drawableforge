# DrawableForge: Agent Guide

## Overview

Takes a source image and outputs zipped Android WebP drawables for ldpi to xxxhdpi. Everything runs client-side: there's no backend and nothing happens server-side. Hostable on GitHub Pages (repo root is the site).

**Stack:** HTML/CSS/JS, Canvas 2D, WASM libwebp (`wasm-webp`), JSZip. A tiny optional Go static server (`main.go`) is used only for local preview.

---

## Entry Points

| Entry | File | Purpose |
|-------|------|---------|
| Site | `index.html` | Static app, served at `/` |
| Orchestrator | `app.js` | DOM wiring, events, conversion flow (ES module) |
| Density | `js/density.js` | `DENSITY_FACTORS`, `SOURCE_DENSITY`, sizing and dir naming |
| Naming | `js/naming.js` | `sanitizeResourceName`, supported extensions, file stem/ext |
| Encoding | `js/encoding.js` | Image load, canvas resize, lossless/lossy WebP encode, parallel density encode |
| Options | `js/options.js` | `parseOptions`: validate/normalize raw form input |
| Theme | `js/theme.js` | `applyTheme`, `resolveTheme`, `nextTheme`, icon mapping |
| ZIP | `js/zip.js` | `buildZipArchive`, `downloadBlob`, `zipFileName` (STORE compression) |
| Tests | `tests/*.test.js` | `node --test` for density, naming, options, theme, zip |
| Lint | `eslint.config.js` | ESLint 10 flat config (`npm run lint`) |
| CI | `.github/workflows/ci.yml` | lint + `npm test` + `go vet`/`go build` on push/PR |
| Local preview | `main.go` | `go run .` static file server (no conversion) |

**Shell scripts:**
- `scripts/dev.sh` -> `go run .` (local static preview)

---

## Density Scaling

Each density has a target factor (xxxhdpi=4.0, mdpi=1.0). The source image is treated as the **source density** selected in the UI (default `xxxhdpi`, factor 4.0). It gets normalized to a baseline, then scaled to each target:

`target = max(1, round(original / source_scale * target_scale))`

`DENSITY_FACTORS` lives in `js/density.js` (ldpi=0.75 to xxxhdpi=4.0). `SOURCE_DENSITY` is the default source. `calculateTargetSize` accepts an explicit `sourceDensity` so the user can declare a lower-resolution source.

---

## Key Features

### Source Density
- Selectable in the UI (`#sourceDensity`), default `xxxhdpi`. Declares the density bucket the input image already represents. Everything else is derived from it.

### Night Drawables
- Generated when the **Night drawables** toggle is on: `drawable-night-{density}` directories instead of `drawable-{density}`.
- Zip suffix: `_night_drawables.zip` vs `_drawables.zip`.

### Lossless / Lossy WebP
- **Lossless** (default): WASM libwebp encoder (`encode(..., {lossless:1})`).
- **Lossy** (opt-in): native `canvas.toBlob("image/webp", quality/100)`, quality 0 to 100 (default 90).

### Resize
- Canvas 2D `drawImage` with `imageSmoothingEnabled=true`, `imageSmoothingQuality="high"` (high-quality bilinear smoothing).

### ZIP
- JSZip in the browser. WebP is already compressed, so the archive is built with **STORE** compression (`buildZipArchive` in `js/zip.js`): faster to build, no wasted CPU. No temp files.

---

## Tests

Pure logic in `js/density.js`, `js/naming.js`, `js/options.js`, `js/theme.js`, and `js/zip.js` is covered by `node --test`:

```bash
npm test          # runs node --test over tests/*.test.js
npm run lint      # ESLint 10 (flat config, eslint.config.js)
```

No browser required. The modules have no DOM or WASM dependencies. Theme and zip helpers accept injected DOM/zip factories so they are testable in Node.

---

## Web UI

- `GET /` -> `index.html`.
- All processing is client-side (see `app.js`). There is **no `/convert` endpoint**.
- Controls: resource name, source density, Lossless WebP switch, Night drawables switch, lossy quality.
- Formats accepted in-browser: PNG, JPEG, WebP, GIF (natively decodable). BMP and TIFF are not supported in the browser.

---

## Security

Fully client-side and static. No backend, no auth, no database. Here's how each exposure is handled:

- **File-type validation is extension-only** (see `SUPPORTED_EXTENSIONS` in `js/naming.js`). This is an accepted limitation: a non-image renamed to a supported extension passes the gate, but the browser then fails to decode it and the conversion errors out. No untrusted code ever runs.
- **No HTML injection / Zip Slip**: all dynamic text uses `textContent`. The resource name is restricted to `[a-z0-9_]` by `sanitizeResourceName` (`js/naming.js`), so download and archive paths can never contain `/` or `..`.
- **Vendored assets** (`vendor/`): see `vendor/README.md` for pinning and provenance.
- The dev server (`main.go`) sends `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, disables directory listing, and sets request timeouts (`ReadHeaderTimeout`, `IdleTimeout`). Node dependencies are dev-only and `npm audit` is clean.

---

## Naming Rules (`sanitizeResourceName` in `js/naming.js`)

`name -> str`: lowercase, `[^a-z0-9_]` to `_`, collapse `_`, strip leading/trailing `_`. If empty, error. If digit-prefixed, prepend `img_`.

---

## Vendored Assets (`vendor/`)

- `jszip.min.js`: JSZip (zip writer), global `JSZip`.
- `webp-wasm.js` / `webp-wasm.wasm`: libwebp compiled to WASM (`wasm-webp` npm).
- `webp-encode.js`: ESM wrapper exposing `encode(data, w, h, hasAlpha, config)`. Caches the WASM module. The original package's `index.js` used an extensionless import that native ESM can't resolve, so this wrapper imports `./webp-wasm.js` explicitly.

---

## Local Dev

```bash
make serve                      # http://127.0.0.1:8000 (PORT/HOST overridable)
make serve PORT=8080 HOST=0.0.0.0
# or:
./scripts/dev.sh                 # http://127.0.0.1:8000
go run . --port 8080 --host 0.0.0.0
```

Make targets: `make`/`make help` lists all. `make serve`, `make build` (writes `bin/drawableforge`), `make clean`.

`.wasm` is served as `application/wasm` (set in `main.go`). Opening via `file://` will fail (WASM needs http).

---

## GitHub Pages

Enable Pages with **source = root** of the default branch. `.nojekyll` keeps Jekyll from touching `/vendor`. No build step.

---

## File Layout

```
.
├── index.html              # app markup
├── style.css               # theme (formerly modern/style.css)
├── app.js                  # client-side pipeline (ES module)
├── eslint.config.js        # ESLint 10 flat config
├── js/
│   ├── density.js          # density factors, sizing math, dir naming
│   ├── naming.js           # resource-name sanitization and extension helpers
│   ├── options.js          # parseOptions: validate/normalize form input
│   ├── theme.js            # theme state, attribute/icon application
│   ├── encoding.js         # image load, canvas resize, WebP encode
│   └── zip.js              # buildZipArchive (STORE), downloadBlob, zipFileName
├── tests/
│   ├── density.test.js     # density math and dir naming
│   ├── naming.test.js      # resource-name sanitization and extension helpers
│   ├── options.test.js     # parseOptions validation
│   ├── theme.test.js       # theme transitions and attribute application
│   └── zip.test.js         # archive assembly + STORE compression
├── .github/
│   └── workflows/ci.yml    # lint + test + go vet/build
├── vendor/
│   ├── jszip.min.js
│   ├── webp-wasm.js
│   ├── webp-wasm.wasm
│   └── webp-encode.js
├── main.go                 # tiny Go static dev-server
├── Makefile                # make dev/serve, build, clean targets
├── go.mod
├── package.json            # type:module + `npm test` (node --test) + `npm run lint`
├── .nojekyll
├── README.md
├── DEV.md
└── scripts/dev.sh
```

---

## Good Next Prompts

- "Add BMP/TIFF support via WASM decoders"
- "Show a preview of each generated density before download"
- "Add a progress indicator during conversion"
