import { isDensityName } from "./density.js";
import { sanitizeResourceName } from "./naming.js";

// Validate and normalize the raw form input into a conversion options object.
// Pure logic (no DOM): the caller collects DOM values and passes them in.
export function parseOptions(input) {
  const { sourceDensity, quality } = input;
  const lossless = Boolean(input.lossless);
  const night = Boolean(input.night);

  if (!isDensityName(sourceDensity)) {
    throw new Error("Select a valid source density.");
  }

  const parsedQuality = Number(quality);
  if (!Number.isInteger(parsedQuality) || parsedQuality < 0 || parsedQuality > 100) {
    throw new Error("Quality must be a number between 0 and 100.");
  }

  return {
    lossless,
    night,
    sourceDensity,
    quality: parsedQuality,
    resourceName: sanitizeResourceName(String(input.resourceName ?? "")),
  };
}
