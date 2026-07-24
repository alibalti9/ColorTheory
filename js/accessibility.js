import {
  contrastRatio,
  apcaContrast,
  hexToHsl,
  hslToHex,
  apcaGrade,
  wcagGrade,
} from './color-converter.js';

/** Adjust foreground lightness until WCAG AA (4.5:1) passes against background */
export function autoFixContrast(foregroundHex, backgroundHex, targetRatio = 4.51) {
  let [hue, saturation, lightness] = hexToHsl(foregroundHex);
  const bgLum = getRelativeOrder(backgroundHex, foregroundHex);

  for (let attempt = 0; attempt < 100; attempt++) {
    const ratio = contrastRatio(foregroundHex, backgroundHex);
    if (ratio >= targetRatio) return foregroundHex;

    if (bgLum === 'light') {
      lightness = Math.max(0, lightness - 1);
    } else {
      lightness = Math.min(100, lightness + 1);
    }
    foregroundHex = hslToHex(hue, saturation, lightness);
  }
  return foregroundHex;
}

function getRelativeOrder(backgroundHex, foregroundHex) {
  const bgLum =
    parseInt(backgroundHex.slice(1, 3), 16) * 0.299 +
    parseInt(backgroundHex.slice(3, 5), 16) * 0.587 +
    parseInt(backgroundHex.slice(5, 7), 16) * 0.114;
  return bgLum > 128 ? 'light' : 'dark';
}

/** Auto-fix all failing palette colors against white and black */
export function autoFixPalette(palette) {
  const fixed = [...palette];
  const backgrounds = ['#ffffff', '#000000'];

  palette.forEach((color, index) => {
    for (const background of backgrounds) {
      if (contrastRatio(color, background) < 4.5) {
        fixed[index] = autoFixContrast(color, background);
        break;
      }
    }
  });
  return fixed;
}

export function countPassingColors(palette, mode = 'wcag') {
  return palette.filter(
    (color) =>
      contrastRatio(color, '#ffffff') >= 4.5 ||
      contrastRatio(color, '#000000') >= 4.5 ||
      (mode === 'apca' &&
        (Math.abs(apcaContrast(color, '#ffffff')) >= 60 ||
          Math.abs(apcaContrast(color, '#000000')) >= 60))
  ).length;
}

export function gradeContrast(foreground, background, mode = 'wcag') {
  if (mode === 'apca') {
    const lc = apcaContrast(foreground, background);
    return { value: lc, grade: apcaGrade(lc), unit: 'Lc' };
  }
  const ratio = contrastRatio(foreground, background);
  return { value: ratio, grade: wcagGrade(ratio), unit: ':1' };
}

/** SVG filter IDs for color vision deficiency simulation */
export const COLORBLIND_FILTERS = {
  none: '',
  protanopia: 'url(#filter-protanopia)',
  deuteranopia: 'url(#filter-deuteranopia)',
  tritanopia: 'url(#filter-tritanopia)',
};

export const COLORBLIND_MODES = ['none', 'protanopia', 'deuteranopia', 'tritanopia'];
