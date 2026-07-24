// ══ CONTRAST & ACCESSIBILITY ENGINE ══
// WCAG, APCA contrast calculations and accessibility utilities

import { getLuminance, hexToHsl, hslToHex } from './colorMath.js';

export function wcagContrastRatio(foreground, background) {
  const lumForeground = getLuminance(foreground);
  const lumBackground = getLuminance(background);
  const lighter = Math.max(lumForeground, lumBackground);
  const darker = Math.min(lumForeground, lumBackground);
  return (lighter + 0.05) / (darker + 0.05);
}

export function apcaContrastValue(textHex, backgroundHex) {
  const textLuminance = getLuminance(textHex);
  const backgroundLuminance = getLuminance(backgroundHex);

  const blackThreshold = 0.022;
  const whiteOnBlackScale = 1.14;
  const blackOnWhiteScale = 1.14;
  const lowClipThreshold = 0.1;
  const minDeltaLuminance = 0.0005;

  if (Math.abs(backgroundLuminance - textLuminance) < minDeltaLuminance) {
    return 0;
  }

  if (backgroundLuminance >= textLuminance) {
    const adjustedTextLuminance = Math.max(textLuminance, blackThreshold);
    const adjustedBackgroundLuminance = Math.max(backgroundLuminance, lowClipThreshold);
    return Math.round(
      ((Math.pow(adjustedBackgroundLuminance, 0.56) - Math.pow(adjustedTextLuminance, 0.57)) * whiteOnBlackScale * 100) * 10
    ) / 10;
  }

  const adjustedTextLuminance = Math.max(textLuminance, lowClipThreshold);
  const adjustedBackgroundLuminance = Math.max(backgroundLuminance, blackThreshold);
  return Math.round(
    ((Math.pow(adjustedBackgroundLuminance, 0.65) - Math.pow(adjustedTextLuminance, 0.62)) * blackOnWhiteScale * 100) * 10
  ) / 10;
}

export function getContrastValue(foreground, background, mode = 'wcag') {
  return mode === 'apca' ? apcaContrastValue(foreground, background) : wcagContrastRatio(foreground, background);
}

export function getContrastGrade(foreground, background, mode = 'wcag') {
  const contrastValue = getContrastValue(foreground, background, mode);

  if (mode === 'apca') {
    const absoluteValue = Math.abs(contrastValue);
    if (absoluteValue >= 75) return { level: 'AAA', className: 'g-aaa', value: contrastValue };
    if (absoluteValue >= 60) return { level: 'AA', className: 'g-aa', value: contrastValue };
    if (absoluteValue >= 45) return { level: 'AA Lg', className: 'g-aal', value: contrastValue };
    return { level: 'Fail', className: 'g-fail', value: contrastValue };
  }

  if (contrastValue >= 7) return { level: 'AAA', className: 'g-aaa', value: contrastValue };
  if (contrastValue >= 4.5) return { level: 'AA', className: 'g-aa', value: contrastValue };
  if (contrastValue >= 3) return { level: 'AA Lg', className: 'g-aal', value: contrastValue };
  return { level: 'Fail', className: 'g-fail', value: contrastValue };
}

export function countAccessibleColors(palette, mode = 'wcag') {
  const threshold = mode === 'apca' ? 60 : 4.5;

  return palette.filter((color) => {
    if (mode === 'apca') {
      const whiteContrast = Math.abs(apcaContrastValue(color, '#ffffff'));
      const blackContrast = Math.abs(apcaContrastValue(color, '#000000'));
      return whiteContrast >= threshold || blackContrast >= threshold;
    }

    const whiteRatio = wcagContrastRatio(color, '#ffffff');
    const blackRatio = wcagContrastRatio(color, '#000000');
    return whiteRatio >= threshold || blackRatio >= threshold;
  }).length;
}

export function autoFixContrastForColor(color, backgroundHex, targetRatio = 4.51, mode = 'wcag') {
  const [hue, saturation, lightness] = hexToHsl(color);
  const targetThreshold = mode === 'apca' ? 60 : targetRatio;
  const isBackgroundLight = getLuminance(backgroundHex) > 0.5;

  let currentColor = color;
  let currentLightness = lightness;

  for (let attempt = 0; attempt < 100; attempt++) {
    const currentContrast = mode === 'apca'
      ? Math.abs(apcaContrastValue(currentColor, backgroundHex))
      : wcagContrastRatio(currentColor, backgroundHex);

    if (currentContrast >= targetThreshold) {
      return currentColor;
    }

    currentLightness = isBackgroundLight
      ? Math.max(0, currentLightness - 1)
      : Math.min(100, currentLightness + 1);

    currentColor = hslToHex(hue, saturation, currentLightness);
  }

  return currentColor;
}

/**
 * Finds the nearest WCAG AA-safe text token for a specific surface. The coarse
 * 1% lightness loop keeps the correction predictable, then a small refinement
 * finds the least-altered representable hex value at or above 4.51:1.
 */
export function autoFixWcagTextColor(textHex, backgroundHex, targetRatio = 4.51) {
  const [hue, saturation, initialLightness] = hexToHsl(textHex);
  const makeColor = (lightness) => hslToHex(hue, saturation, lightness);
  const moveDarker = getLuminance(backgroundHex) >= getLuminance(textHex);
  let safeLightness = initialLightness;

  for (let step = 0; step <= 100; step++) {
    const candidateLightness = moveDarker
      ? Math.max(0, initialLightness - step)
      : Math.min(100, initialLightness + step);
    const candidate = makeColor(candidateLightness);
    if (wcagContrastRatio(candidate, backgroundHex) >= targetRatio) {
      safeLightness = candidateLightness;
      break;
    }
  }

  // Refine within the final 1% interval to keep the smallest visual change.
  let nearest = makeColor(safeLightness);
  for (let increment = 0; increment <= 100; increment++) {
    const lightness = moveDarker
      ? safeLightness + increment / 100
      : safeLightness - increment / 100;
    if (lightness < 0 || lightness > 100) continue;
    const candidate = makeColor(lightness);
    if (wcagContrastRatio(candidate, backgroundHex) >= targetRatio) {
      nearest = candidate;
    } else {
      break;
    }
  }

  return nearest;
}
