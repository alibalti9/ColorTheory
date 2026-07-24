/** Color conversion utilities — Hex, RGB, HSL, OKLCH, luminance */

export function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function rgbToHex(red, green, blue) {
  const channel = (value) =>
    Math.round(Math.max(0, Math.min(255, value)))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

export function hexToHsl(hex) {
  let red = parseInt(hex.slice(1, 3), 16) / 255;
  let green = parseInt(hex.slice(3, 5), 16) / 255;
  let blue = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let hue;
  let saturation;
  const lightness = (max + min) / 2;

  if (max === min) {
    hue = saturation = 0;
  } else {
    const delta = max - min;
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
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

function srgbChannelToLinear(channel) {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function linearToSrgbChannel(channel) {
  const value =
    channel <= 0.0031308
      ? 12.92 * channel
      : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, value)) * 255);
}

function rgbToOklab(red, green, blue) {
  const linearRed = srgbChannelToLinear(red);
  const linearGreen = srgbChannelToLinear(green);
  const linearBlue = srgbChannelToLinear(blue);
  const longAxis =
    0.4122214708 * linearRed +
    0.5363325363 * linearGreen +
    0.0514459929 * linearBlue;
  const mediumAxis =
    0.2119034982 * linearRed +
    0.6806995451 * linearGreen +
    0.1073969566 * linearBlue;
  const shortAxis =
    0.0883024619 * linearRed +
    0.2817188376 * linearGreen +
    0.6299787005 * linearBlue;
  const longRoot = Math.cbrt(longAxis);
  const mediumRoot = Math.cbrt(mediumAxis);
  const shortRoot = Math.cbrt(shortAxis);
  return {
    L: 0.2104542553 * longRoot + 0.793617785 * mediumRoot - 0.0040720468 * shortRoot,
    a: 1.9779984951 * longRoot - 2.428592205 * mediumRoot + 0.4505937099 * shortRoot,
    b: 0.0259040371 * longRoot + 0.7827717662 * mediumRoot - 0.808675766 * shortRoot,
  };
}

function oklabToRgb(lightness, axisA, axisB) {
  const longRoot = lightness + 0.3963377774 * axisA + 0.2158037573 * axisB;
  const mediumRoot = lightness - 0.1055613458 * axisA - 0.0638541728 * axisB;
  const shortRoot = lightness - 0.0894841775 * axisA - 1.291485548 * axisB;
  const longAxis = longRoot ** 3;
  const mediumAxis = mediumRoot ** 3;
  const shortAxis = shortRoot ** 3;
  const linearRed =
    4.0767416621 * longAxis - 3.3077115913 * mediumAxis + 0.2309699292 * shortAxis;
  const linearGreen =
    -1.2684380046 * longAxis + 2.6097574011 * mediumAxis - 0.3413193965 * shortAxis;
  const linearBlue =
    -0.0041960863 * longAxis - 0.7034186147 * mediumAxis + 1.707614701 * shortAxis;
  return [
    linearToSrgbChannel(linearRed),
    linearToSrgbChannel(linearGreen),
    linearToSrgbChannel(linearBlue),
  ];
}

export function hexToOklch(hex) {
  const [red, green, blue] = hexToRgb(hex);
  const { L, a, b } = rgbToOklab(red, green, blue);
  const chroma = Math.sqrt(a * a + b * b);
  let hue = (Math.atan2(b, a) * 180) / Math.PI;
  if (hue < 0) hue += 360;
  return [L, chroma, hue];
}

export function oklchToHex(lightness, chroma, hue) {
  const hueRad = (hue * Math.PI) / 180;
  const axisA = chroma * Math.cos(hueRad);
  const axisB = chroma * Math.sin(hueRad);
  const [red, green, blue] = oklabToRgb(lightness, axisA, axisB);
  return rgbToHex(red, green, blue);
}

export function formatOklch(hex) {
  const [lightness, chroma, hue] = hexToOklch(hex);
  return `oklch(${(lightness * 100).toFixed(1)}% ${chroma.toFixed(3)} ${hue.toFixed(1)})`;
}

export function getLuminance(hex) {
  const channels = hexToRgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(foreground, background) {
  const lumForeground = getLuminance(foreground);
  const lumBackground = getLuminance(background);
  const lighter = Math.max(lumForeground, lumBackground);
  const darker = Math.min(lumForeground, lumBackground);
  return (lighter + 0.05) / (darker + 0.05);
}

/** APCA Lc (simplified perceptual contrast — WCAG 3 direction) */
export function apcaContrast(textHex, backgroundHex) {
  const textY = getLuminance(textHex);
  const bgY = getLuminance(backgroundHex);
  const blackThreshold = 0.022;
  const scaleBoW = 1.14;
  const scaleWoB = 1.14;
  const loClip = 0.1;
  const deltaYmin = 0.0005;

  let sapc;
  if (Math.abs(bgY - textY) < deltaYmin) return 0;

  if (bgY >= textY) {
    const yText = Math.max(textY, blackThreshold);
    const yBg = Math.max(bgY, loClip);
    sapc = (Math.pow(yBg, 0.56) - Math.pow(yText, 0.57)) * scaleBoW * 100;
  } else {
    const yText = Math.max(textY, loClip);
    const yBg = Math.max(bgY, blackThreshold);
    sapc = (Math.pow(yBg, 0.65) - Math.pow(yText, 0.62)) * scaleWoB * 100;
  }
  return Math.round(sapc * 10) / 10;
}

export function apcaGrade(luminanceContrast) {
  const abs = Math.abs(luminanceContrast);
  if (abs >= 75) return ['AAA', 'g-aaa'];
  if (abs >= 60) return ['AA', 'g-aa'];
  if (abs >= 45) return ['AA Lg', 'g-aal'];
  return ['Fail', 'g-fail'];
}

export function wcagGrade(ratio) {
  if (ratio >= 7) return ['AAA', 'g-aaa'];
  if (ratio >= 4.5) return ['AA', 'g-aa'];
  if (ratio >= 3) return ['AA Lg', 'g-aal'];
  return ['Fail', 'g-fail'];
}
