// ══ PALETTE INTERPOLATION UTILITIES ══
// Generate stepped ramps with evenly spaced sRGB channel values. This produces
// deterministic UI tokens and avoids HSL hue wrapping through an unrelated hue.

import { hexToRgb, rgbToHex } from './colorMath.js';

export function generateInterpolationRamp(startHex, endHex, stepCount) {
  const safeStepCount = Math.max(2, Math.min(24, Number(stepCount) || 2));
  const [startRed, startGreen, startBlue] = hexToRgb(startHex);
  const [endRed, endGreen, endBlue] = hexToRgb(endHex);

  const rampColors = [];

  for (let index = 0; index < safeStepCount; index++) {
    const ratio = safeStepCount <= 1 ? 0 : index / (safeStepCount - 1);
    rampColors.push(rgbToHex(
      startRed + (endRed - startRed) * ratio,
      startGreen + (endGreen - startGreen) * ratio,
      startBlue + (endBlue - startBlue) * ratio
    ));
  }

  return rampColors;
}

export function formatRampAsCss(rampColors, propertyName = '--color') {
  return rampColors
    .map((color, index) => `  ${propertyName}-${index + 1}: ${color};`)
    .join('\n');
}
