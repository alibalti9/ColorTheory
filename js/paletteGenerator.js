// ══ PALETTE GENERATION ══
// Harmony-based palette generation algorithms

import { hslToHex, hexToHsl } from './colorMath.js';

function buildLockedColorMap(lockedSlots = [], lockedColors = []) {
  return lockedSlots.reduce((accumulator, slot, index) => {
    if (typeof lockedColors[index] === 'string') {
      accumulator[Number(slot)] = lockedColors[index];
    }
    return accumulator;
  }, {});
}

export function generatePalette(baseHex, colorCount, harmonyMode, options = {}) {
  const { lockedSlots = [], lockedColors = [] } = options;
  const lockedColorMap = buildLockedColorMap(lockedSlots, lockedColors);
  const [baseHue, baseSaturation, baseLightness] = hexToHsl(baseHex);
  let paletteColors = [];

  const interpolateLightness = (index, total, minLight, maxLight) =>
    Math.max(minLight, Math.min(maxLight, minLight + (maxLight - minLight) * (index / (total - 1 || 1))));

  switch (harmonyMode) {
    case 'Monochromatic':
      for (let i = 0; i < colorCount; i++) {
        const saturation = Math.max(6, baseSaturation - i * 4);
        const lightness = interpolateLightness(i, colorCount, 8, 90);
        paletteColors.push(hslToHex(baseHue, saturation, lightness));
      }
      break;

    case 'Complementary': {
      const hues = [baseHue, baseHue + 180];
      for (let i = 0; i < colorCount; i++) {
        const hue = hues[i % 2];
        const saturation = Math.max(18, baseSaturation - i * 5);
        const lightness = interpolateLightness(i, colorCount, 18, 82);
        paletteColors.push(hslToHex(hue, saturation, lightness));
      }
      break;
    }

    case 'Analogous':
      for (let i = 0; i < colorCount; i++) {
        const hue = baseHue - 40 + (80 / (colorCount - 1 || 1)) * i;
        const saturation = baseSaturation * 0.92;
        const lightness = interpolateLightness(i, colorCount, 22, 80);
        paletteColors.push(hslToHex(hue, saturation, lightness));
      }
      break;

    case 'Triadic': {
      const hues = [baseHue, baseHue + 120, baseHue + 240];
      for (let i = 0; i < colorCount; i++) {
        const hue = hues[i % 3];
        const saturation = baseSaturation * 0.92;
        const lightness = interpolateLightness(i, colorCount, 24, 80);
        paletteColors.push(hslToHex(hue, saturation, lightness));
      }
      break;
    }

    case 'Split-Comp': {
      const hues = [baseHue, baseHue + 150, baseHue + 210];
      for (let i = 0; i < colorCount; i++) {
        const hue = hues[i % 3];
        const saturation = baseSaturation * 0.9;
        const lightness = interpolateLightness(i, colorCount, 24, 80);
        paletteColors.push(hslToHex(hue, saturation, lightness));
      }
      break;
    }

    case 'Tetradic': {
      const hues = [baseHue, baseHue + 90, baseHue + 180, baseHue + 270];
      for (let i = 0; i < colorCount; i++) {
        const hue = hues[i % 4];
        const saturation = baseSaturation * 0.9;
        const lightness = interpolateLightness(i, colorCount, 24, 80);
        paletteColors.push(hslToHex(hue, saturation, lightness));
      }
      break;
    }

    default: // Custom / Random
      paletteColors = [baseHex];
      for (let i = 1; i < colorCount; i++) {
        const randomHue = Math.random() * 360;
        const randomSaturation = 42 + Math.random() * 44;
        const randomLightness = 28 + Math.random() * 48;
        paletteColors.push(hslToHex(randomHue, randomSaturation, randomLightness));
      }
      break;
  }

  const resolvedPalette = paletteColors.slice(0, colorCount);
  Object.entries(lockedColorMap).forEach(([slot, color]) => {
    const slotIndex = Number(slot);
    if (slotIndex >= 0 && slotIndex < colorCount) {
      resolvedPalette[slotIndex] = color;
    }
  });

  return resolvedPalette.slice(0, colorCount);
}

export function getRandomPalette() {
  const modes = [
    'Monochromatic', 'Complementary', 'Analogous', 'Triadic',
    'Split-Comp', 'Tetradic'
  ];

  const randomHue = Math.random() * 360;
  const randomSaturation = 45 + Math.random() * 45;
  const randomLightness = 30 + Math.random() * 35;
  const baseColor = hslToHex(randomHue, randomSaturation, randomLightness);

  const randomMode = modes[Math.floor(Math.random() * modes.length)];
  const randomCount = [3, 4, 5, 6][Math.floor(Math.random() * 4)];

  return {
    base: baseColor,
    harmony: randomMode,
    count: randomCount
  };
}
