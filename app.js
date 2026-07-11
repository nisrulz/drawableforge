import { DENSITY_FACTORS, drawableDirectoryName, isDensityName } from "./js/density.js";
import { SUPPORTED_EXTENSIONS, fileExtension, fileStem, sanitizeResourceName } from "./js/naming.js";
import { loadImageElement, renderDensity } from "./js/encoding.js";

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

let previewUrl = null;

// --- theme ---
function applyTheme(theme) {
  const isDark = theme === "dark";
  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  if (themeIcon) themeIcon.textContent = isDark ? "🌙" : "☀️";
}

(function initTheme() {
  applyTheme(localStorage.getItem("theme") || "light");
})();

if (darkModeBtn) {
  darkModeBtn.addEventListener("click", function () {
    const isDark = document.documentElement.getAttribute("data-theme") !== "dark";
    const theme = isDark ? "dark" : "light";
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  });
}

// --- toggle switches (composition over repetition) ---
function setupToggle(button, onChange) {
  button.addEventListener("click", function () {
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
}

// --- drag & drop ---
["dragenter", "dragover"].forEach(function (eventName) {
  dropzone.addEventListener(eventName, function (event) {
    event.preventDefault();
    dropzone.classList.add("is-dragover");
  });
});

["dragleave", "drop"].forEach(function (eventName) {
  dropzone.addEventListener(eventName, function (event) {
    event.preventDefault();
    dropzone.classList.remove("is-dragover");
  });
});

dropzone.addEventListener("drop", function (event) {
  const files = event.dataTransfer.files;
  if (!files.length) return;
  fileInput.files = files;
  refreshSelection();
});

fileInput.addEventListener("change", refreshSelection);

// --- conversion ---
function readOptions(file) {
  const lossless = losslessSwitch.dataset.enabled === "true";
  const night = nightSwitch.dataset.enabled === "true";

  const sourceDensity = sourceDensitySelect.value;
  if (!isDensityName(sourceDensity)) {
    throw new Error("Select a valid source density.");
  }

  let quality = parseInt(qualityInput.value, 10);
  if (!Number.isInteger(quality) || quality < 0 || quality > 100) {
    throw new Error("Quality must be a number between 0 and 100.");
  }

  const rawName = outputName.value.trim() || fileStem(file.name);
  const resourceName = sanitizeResourceName(rawName);

  return { lossless, night, sourceDensity, quality, resourceName };
}

function triggerDownload(blob, downloadName) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

async function runConversion(file) {
  let options;
  try {
    options = readOptions(file);
  } catch (e) {
    return;
  }

  convertButton.disabled = true;

  try {
    if (typeof JSZip === "undefined") {
      throw new Error("JSZip failed to load.");
    }
    const img = await loadImageElement(file);
    const zip = new JSZip();

    for (const [density, scale] of Object.entries(DENSITY_FACTORS)) {
      const bytes = await renderDensity(img, scale, options);
      zip.file(`${drawableDirectoryName(density, options.night)}/${options.resourceName}.webp`, bytes);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const downloadName = `${options.resourceName}_${options.night ? "night_drawables" : "drawables"}.zip`;
    triggerDownload(blob, downloadName);
  } catch (error) {
    console.error(error);
  } finally {
    convertButton.disabled = false;
  }
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const file = selectedFile();
  if (!file) {
    return;
  }
  if (!SUPPORTED_EXTENSIONS.includes(fileExtension(file.name))) {
    return;
  }

  await runConversion(file);
});
