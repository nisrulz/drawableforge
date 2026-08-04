import { drawableDirectoryName } from "./js/density.js";
import { SUPPORTED_EXTENSIONS, fileExtension, fileStem } from "./js/naming.js";
import { parseOptions } from "./js/options.js";
import { encodeAllDensities, loadImageElement } from "./js/encoding.js";
import { buildZipArchive, downloadBlob, zipFileName } from "./js/zip.js";
import { applyTheme, currentTheme, nextTheme, resolveTheme, THEME_KEY } from "./js/theme.js";

// --- DOM refs ---
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const filePill = document.getElementById("filePill");
const dropzoneCard = document.getElementById("dropzoneCard");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("previewImg");
const previewHint = document.getElementById("dropzoneHint");
const form = document.getElementById("convertForm");
const convertButton = document.getElementById("convertButton");
const losslessSwitch = document.getElementById("losslessSwitch");
const nightSwitch = document.getElementById("nightSwitch");
const darkModeBtn = document.getElementById("darkModeBtn");
const themeIcon = document.getElementById("themeIcon");
const qualityInput = document.getElementById("quality");
const outputName = document.getElementById("outputName");
const sourceDensitySelect = document.getElementById("sourceDensity");
const statusMessage = document.getElementById("statusMessage");

let previewUrl = null;

// --- theme ---
(function initTheme() {
  applyTheme(resolveTheme(localStorage.getItem(THEME_KEY)), document.documentElement, themeIcon);
})();

darkModeBtn.addEventListener("click", () => {
  const theme = nextTheme(currentTheme(document.documentElement));
  applyTheme(theme, document.documentElement, themeIcon);
  localStorage.setItem(THEME_KEY, theme);
});

// --- toggle switches ---
function setupToggle(button, onChange) {
  button.addEventListener("click", () => {
    const next = button.dataset.enabled !== "true";
    button.dataset.enabled = next ? "true" : "false";
    button.setAttribute("aria-checked", next ? "true" : "false");
    if (onChange) onChange(next);
  });
}

function updateQualityState() {
  const lossless = losslessSwitch.dataset.enabled === "true";
  qualityInput.disabled = lossless;
  qualityInput.style.opacity = lossless ? "0.5" : "1";
}

setupToggle(losslessSwitch, updateQualityState);
setupToggle(nightSwitch);
updateQualityState();

// --- status messages ---
function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
  statusMessage.hidden = !message;
}

// --- file selection ---
function selectedFile() {
  return fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
}

function refreshSelection() {
  const file = selectedFile();
  if (!file) {
    filePill.classList.remove("visible");
    filePill.textContent = "";
    preview.classList.remove("visible");
    previewHint.classList.remove("visible");
    dropzoneCard.classList.remove("hidden");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
    return;
  }
  filePill.textContent = file.name + " · " + Math.max(1, Math.round(file.size / 1024)) + " KB";
  filePill.classList.add("visible");
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  previewImg.src = previewUrl;
  preview.classList.add("visible");
  previewHint.classList.add("visible");
  dropzoneCard.classList.add("hidden");
  setStatus("");
}

// --- drag & drop ---
["dragenter", "dragover"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragover");
  });
});

dropzone.addEventListener("drop", (event) => {
  const files = event.dataTransfer.files;
  if (!files.length) return;
  fileInput.files = files;
  refreshSelection();
});

fileInput.addEventListener("change", refreshSelection);

// --- conversion ---
function readOptions(file) {
  return parseOptions({
    lossless: losslessSwitch.dataset.enabled === "true",
    night: nightSwitch.dataset.enabled === "true",
    sourceDensity: sourceDensitySelect.value,
    quality: qualityInput.value,
    resourceName: outputName.value.trim() || fileStem(file.name),
  });
}

async function runConversion(file) {
  let options;
  try {
    options = readOptions(file);
  } catch (error) {
    setStatus(error.message, true);
    return;
  }

  convertButton.disabled = true;
  setStatus("Converting…");

  try {
    if (typeof JSZip === "undefined") {
      throw new Error("JSZip failed to load.");
    }
    const img = await loadImageElement(file);
    const rendered = await encodeAllDensities(img, options);
    const entries = rendered.map(({ density, bytes }) => ({
      path: `${drawableDirectoryName(density, options.night)}/${options.resourceName}.webp`,
      bytes,
    }));
    const blob = await buildZipArchive(() => new JSZip(), entries);
    downloadBlob(blob, zipFileName(options.resourceName, options.night));
    setStatus("Done — check your downloads.");
  } catch (error) {
    console.error(error);
    setStatus(`Conversion failed: ${error.message}`, true);
  } finally {
    convertButton.disabled = false;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = selectedFile();
  if (!file) return;

  if (!SUPPORTED_EXTENSIONS.includes(fileExtension(file.name))) {
    setStatus(`Unsupported file type. Use: ${SUPPORTED_EXTENSIONS.join(", ")}`, true);
    return;
  }

  await runConversion(file);
});
