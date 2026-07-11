export const SOURCE_DENSITY = "xxxhdpi";

export const DENSITY_FACTORS = {
  ldpi: 0.75,
  mdpi: 1.0,
  hdpi: 1.5,
  xhdpi: 2.0,
  xxhdpi: 3.0,
  xxxhdpi: 4.0,
};

const DENSITY_NAMES = Object.keys(DENSITY_FACTORS);

export function isDensityName(name) {
  return DENSITY_NAMES.includes(name);
}

// The source image is treated as the given source-density bucket (default
// SOURCE_DENSITY) and normalized to a 1x baseline, then scaled to each target.
export function calculateTargetSize(originalWidth, originalHeight, targetScale, sourceDensity = SOURCE_DENSITY) {
  const sourceScale = DENSITY_FACTORS[sourceDensity];
  const baselineWidth = originalWidth / sourceScale;
  const baselineHeight = originalHeight / sourceScale;
  return [
    Math.max(1, Math.round(baselineWidth * targetScale)),
    Math.max(1, Math.round(baselineHeight * targetScale)),
  ];
}

export function drawableDirectoryName(density, night) {
  const prefix = night ? "drawable-night" : "drawable";
  return `${prefix}-${density}`;
}
