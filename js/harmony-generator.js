import { hexToHsl, hslToHex, hexToOklch, oklchToHex } from './color-converter.js';

export const HARMONIES = [
  'Monochromatic',
  'Complementary',
  'Analogous',
  'Triadic',
  'Split-Comp',
  'Tetradic',
  'Custom',
];

function lightnessRamp(index, count, minLightness, maxLightness) {
  return Math.max(
    minLightness,
    Math.min(maxLightness, minLightness + (maxLightness - minLightness) * (index / (count - 1 || 1)))
  );
}

/** Generate palette in HSL color space */
export function generateHsl(baseHex, count, mode) {
  const [hue, saturation, lightness] = hexToHsl(baseHex);
  const colors = [];

  switch (mode) {
    case 'Monochromatic':
      for (let index = 0; index < count; index++) {
        colors.push(
          hslToHex(hue, Math.max(6, saturation - index * 4), lightnessRamp(index, count, 8, 90))
        );
      }
      break;
    case 'Complementary': {
      const hues = [hue, hue + 180];
      for (let index = 0; index < count; index++) {
        colors.push(
          hslToHex(
            hues[index % 2],
            Math.max(18, saturation - index * 5),
            lightnessRamp(index, count, 18, 82)
          )
        );
      }
      break;
    }
    case 'Analogous':
      for (let index = 0; index < count; index++) {
        colors.push(
          hslToHex(
            hue - 40 + (80 / (count - 1 || 1)) * index,
            saturation * 0.92,
            lightnessRamp(index, count, 22, 80)
          )
        );
      }
      break;
    case 'Triadic': {
      const hues = [hue, hue + 120, hue + 240];
      for (let index = 0; index < count; index++) {
        colors.push(
          hslToHex(
            hues[index % 3],
            saturation * 0.92,
            lightnessRamp(index, count, 24, 80)
          )
        );
      }
      break;
    }
    case 'Split-Comp': {
      const hues = [hue, hue + 150, hue + 210];
      for (let index = 0; index < count; index++) {
        colors.push(
          hslToHex(
            hues[index % 3],
            saturation * 0.9,
            lightnessRamp(index, count, 24, 80)
          )
        );
      }
      break;
    }
    case 'Tetradic': {
      const hues = [hue, hue + 90, hue + 180, hue + 270];
      for (let index = 0; index < count; index++) {
        colors.push(
          hslToHex(
            hues[index % 4],
            saturation * 0.9,
            lightnessRamp(index, count, 24, 80)
          )
        );
      }
      break;
    }
    default:
      colors.push(baseHex);
      for (let index = 1; index < count; index++) {
        colors.push(
          hslToHex(
            Math.random() * 360,
            42 + Math.random() * 44,
            28 + Math.random() * 48
          )
        );
      }
  }
  return colors.slice(0, count);
}

/** Generate palette in OKLCH — perceptually uniform lightness */
export function generateOklch(baseHex, count, mode) {
  const [baseLightness, baseChroma, baseHue] = hexToOklch(baseHex);
  const colors = [];

  switch (mode) {
    case 'Monochromatic':
      for (let index = 0; index < count; index++) {
        const lightness = 0.15 + (0.75 * index) / (count - 1 || 1);
        colors.push(
          oklchToHex(lightness, Math.max(0.02, baseChroma * (1 - index * 0.08)), baseHue)
        );
      }
      break;
    case 'Complementary': {
      const hues = [baseHue, (baseHue + 180) % 360];
      for (let index = 0; index < count; index++) {
        colors.push(
          oklchToHex(
            0.25 + (0.45 * index) / (count - 1 || 1),
            baseChroma * 0.95,
            hues[index % 2]
          )
        );
      }
      break;
    }
    case 'Analogous':
      for (let index = 0; index < count; index++) {
        colors.push(
          oklchToHex(
            0.28 + (0.4 * index) / (count - 1 || 1),
            baseChroma * 0.92,
            baseHue - 40 + (80 / (count - 1 || 1)) * index
          )
        );
      }
      break;
    case 'Triadic': {
      const hues = [baseHue, baseHue + 120, baseHue + 240];
      for (let index = 0; index < count; index++) {
        colors.push(
          oklchToHex(
            0.3 + (0.38 * index) / (count - 1 || 1),
            baseChroma * 0.92,
            hues[index % 3]
          )
        );
      }
      break;
    }
    case 'Split-Comp': {
      const hues = [baseHue, baseHue + 150, baseHue + 210];
      for (let index = 0; index < count; index++) {
        colors.push(
          oklchToHex(
            0.3 + (0.38 * index) / (count - 1 || 1),
            baseChroma * 0.9,
            hues[index % 3]
          )
        );
      }
      break;
    }
    case 'Tetradic': {
      const hues = [baseHue, baseHue + 90, baseHue + 180, baseHue + 270];
      for (let index = 0; index < count; index++) {
        colors.push(
          oklchToHex(
            0.28 + (0.4 * index) / (count - 1 || 1),
            baseChroma * 0.88,
            hues[index % 4]
          )
        );
      }
      break;
    }
    default:
      return generateHsl(baseHex, count, mode);
  }
  return colors.slice(0, count);
}

export function generate(baseHex, count, mode, colorSpace = 'hsl') {
  return colorSpace === 'oklch'
    ? generateOklch(baseHex, count, mode)
    : generateHsl(baseHex, count, mode);
}

/** Merge generated colors with locked slot overrides */
export function generateWithLocks(baseHex, count, mode, lockedSlots, lockedColors, colorSpace) {
  const generated = generate(baseHex, count, mode, colorSpace);
  return generated.map((color, index) =>
    lockedSlots[index] && lockedColors[index] ? lockedColors[index] : color
  );
}

/** Interpolate N steps between two colors in OKLCH space */
export function interpolateColors(colorA, colorB, steps) {
  const [lightnessA, chromaA, hueA] = hexToOklch(colorA);
  const [lightnessB, chromaB, hueB] = hexToOklch(colorB);
  let hueDelta = hueB - hueA;
  if (hueDelta > 180) hueDelta -= 360;
  if (hueDelta < -180) hueDelta += 360;

  const result = [];
  for (let step = 0; step < steps; step++) {
    const progress = step / (steps - 1 || 1);
    result.push(
      oklchToHex(
        lightnessA + (lightnessB - lightnessA) * progress,
        chromaA + (chromaB - chromaA) * progress,
        hueA + hueDelta * progress
      )
    );
  }
  return result;
}
