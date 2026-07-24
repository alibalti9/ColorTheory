// ══ COLOR MATH & CONVERSION ══
// De-obfuscated, readable color manipulation functions

import { findClosestColorName } from './color-name-database.js';

export function hexToRgb(hexColor) {
  return [
    parseInt(hexColor.slice(1, 3), 16),
    parseInt(hexColor.slice(3, 5), 16),
    parseInt(hexColor.slice(5, 7), 16)
  ];
}

export function rgbToHex(red, green, blue) {
  const toHex = (value) => Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, '0');
  return '#' + toHex(red) + toHex(green) + toHex(blue);
}

export function hexToHsl(hexColor) {
  let red = parseInt(hexColor.slice(1, 3), 16) / 255;
  let green = parseInt(hexColor.slice(3, 5), 16) / 255;
  let blue = parseInt(hexColor.slice(5, 7), 16) / 255;

  const maxChannel = Math.max(red, green, blue);
  const minChannel = Math.min(red, green, blue);
  let hue, saturation;
  const lightness = (maxChannel + minChannel) / 2;

  if (maxChannel === minChannel) {
    hue = saturation = 0;
  } else {
    const delta = maxChannel - minChannel;
    saturation = lightness > 0.5 ? delta / (2 - maxChannel - minChannel) : delta / (maxChannel + minChannel);
    
    switch (maxChannel) {
      case red:
        hue = (green - blue) / delta + (green < blue ? 6 : 0);
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
    }
    hue /= 6;
  }

  return [hue * 360, saturation * 100, lightness * 100];
}

export function hslToHex(hue, saturation, lightness) {
  hue = ((hue % 360) + 360) % 360;
  saturation = Math.max(0, Math.min(100, saturation));
  lightness = Math.max(0, Math.min(100, lightness));

  saturation /= 100;
  lightness /= 100;

  const hueOffset = (offset) => (offset + hue / 30) % 12;
  const chroma = saturation * Math.min(lightness, 1 - lightness);
  const channel = (offset) =>
    lightness -
    chroma *
      Math.max(
        -1,
        Math.min(hueOffset(offset) - 3, Math.min(9 - hueOffset(offset), 1))
      );

  const toHex = (value) =>
    Math.round(value * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(channel(0))}${toHex(channel(8))}${toHex(channel(4))}`;
}

export function getLuminance(hexColor) {
  const channels = hexToRgb(hexColor).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function hexToOklch(hexColor) {
  const [red, green, blue] = hexToRgb(hexColor);
  
  const srgbToLinear = (channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  const linearRed = srgbToLinear(red);
  const linearGreen = srgbToLinear(green);
  const linearBlue = srgbToLinear(blue);

  const longAxis = 0.4122214708 * linearRed + 0.5363325363 * linearGreen + 0.0514459929 * linearBlue;
  const mediumAxis = 0.2119034982 * linearRed + 0.6806995451 * linearGreen + 0.1073969566 * linearBlue;
  const shortAxis = 0.0883024619 * linearRed + 0.2817188376 * linearGreen + 0.6299787005 * linearBlue;

  const longRoot = Math.cbrt(longAxis);
  const mediumRoot = Math.cbrt(mediumAxis);
  const shortRoot = Math.cbrt(shortAxis);

  const oklabLightness = 0.2104542553 * longRoot + 0.793617785 * mediumRoot - 0.0040720468 * shortRoot;
  const oklabA = 1.9779984951 * longRoot - 2.428592205 * mediumRoot + 0.4505937099 * shortRoot;
  const oklabB = 0.0259040371 * longRoot + 0.7827717662 * mediumRoot - 0.808675766 * shortRoot;

  const chroma = Math.sqrt(oklabA * oklabA + oklabB * oklabB);
  let hue = (Math.atan2(oklabB, oklabA) * 180) / Math.PI;
  if (hue < 0) hue += 360;

  return [oklabLightness, chroma, hue];
}

export function formatOklch(hexColor) {
  const [lightness, chroma, hue] = hexToOklch(hexColor);
  return `oklch(${(lightness * 100).toFixed(1)}% ${chroma.toFixed(3)} ${hue.toFixed(1)})`;
}

export function getTextColorForBackground(backgroundHex) {
  return getLuminance(backgroundHex) > 0.28 ? '#111111' : '#eeeeee';
}

export function nameColor(hexColor) {
  return findClosestColorName(hexColor).name;
}
