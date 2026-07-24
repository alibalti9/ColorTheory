import { hexToHsl, contrastRatio, getLuminance } from './color-converter.js';
import { findClosestColorName } from './color-name-database.js';

export function nameColor(hex) {
  return findClosestColorName(hex).name;
}

/** Classify the visual temperature of a color from its HSL hue and saturation. */
export function getColorTemperature(hex) {
  const [hue, saturation] = hexToHsl(hex);
  if (saturation < 14) return { label: 'Neutral', key: 'neutral' };
  if (hue < 70 || hue >= 300) return { label: 'Warm', key: 'warm' };
  if (hue >= 100 && hue < 280) return { label: 'Cool', key: 'cool' };
  return { label: 'Neutral', key: 'neutral' };
}

export function textOn(backgroundHex) {
  return getLuminance(backgroundHex) > 0.28 ? '#111111' : '#eeeeee';
}

/**
 * Suggest semantic roles from the palette itself. Roles may intentionally share
 * a color in compact palettes (for example, a primary can also be the accent).
 */
export function getSemanticRoleSuggestions(palette) {
  if (!palette.length) return [];
  const colors = palette.map((hex, index) => {
    const [hue, saturation, lightness] = hexToHsl(hex);
    return { index, hex, hue, saturation, lightness };
  });
  const roles = palette.map(() => []);
  const addRole = (index, role) => roles[index].push(role);
  const best = (items, score) => items.reduce((winner, item) =>
    score(item) > score(winner) ? item : winner
  );

  const background = best(colors, (color) => -color.lightness - color.saturation * 0.08);
  addRole(background.index, 'Background');
  const textCandidates = colors.filter((color) => color.index !== background.index);
  const text = best(textCandidates.length ? textCandidates : colors,
    (color) => contrastRatio(color.hex, background.hex));
  addRole(text.index, 'Text');

  const remaining = colors.filter((color) => color.index !== background.index && color.index !== text.index);
  if (remaining.length) {
    const surface = best(remaining, (color) => -Math.abs(color.lightness - background.lightness) - color.saturation * 0.12);
    addRole(surface.index, 'Surface');
    const interactive = remaining.filter((color) => color.index !== surface.index);
    const primaryPool = interactive.length ? interactive : remaining;
    const primary = best(primaryPool, (color) => color.saturation + (50 - Math.abs(50 - color.lightness)) * 0.35);
    addRole(primary.index, 'Primary');

    const secondaryPool = colors.filter((color) => color.index !== primary.index && color.index !== background.index && color.index !== text.index);
    if (secondaryPool.length) {
      const secondary = best(secondaryPool, (color) => {
        const hueGap = Math.abs(((color.hue - primary.hue + 540) % 360) - 180);
        return color.saturation + hueGap * 0.2;
      });
      addRole(secondary.index, 'Secondary');
    }
    const accent = best(colors, (color) => color.saturation + (50 - Math.abs(50 - color.lightness)) * 0.2);
    addRole(accent.index, 'Accent');
  } else {
    addRole(background.index, 'Primary');
  }

  return roles;
}

/** Pick highest-contrast text from palette + neutrals */
export function bestTextOn(backgroundHex, palette) {
  const candidates = ['#ffffff', '#111111', ...palette];
  let best = '#111111';
  let bestRatio = 0;
  for (const candidate of candidates) {
    const ratio = contrastRatio(candidate, backgroundHex);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = candidate;
    }
  }
  return best;
}

/** Dynamically assign semantic roles from generated palette */
export function extractSemanticColors(palette) {
  if (!palette.length) {
    return {
      background: '#1a1a1a',
      foreground: '#eeeeee',
      primary: '#7c6aff',
      secondary: '#00c8f0',
      accent: '#7c6aff',
      muted: '#333333',
      card: '#222222',
      destructive: '#ff6060',
    };
  }

  const sortedByLightness = [...palette].sort(
    (colorA, colorB) => hexToHsl(colorA)[2] - hexToHsl(colorB)[2]
  );

  const background = sortedByLightness[Math.floor(sortedByLightness.length / 2)] || palette[0];
  const primary = palette[0];
  const secondary = palette[1] || palette[0];
  const accent = palette[2] || palette[1] || palette[0];
  const muted = sortedByLightness[0];
  const card = sortedByLightness[Math.min(1, sortedByLightness.length - 1)];

  return {
    background,
    foreground: bestTextOn(background, palette),
    primary,
    primaryText: bestTextOn(primary, palette),
    secondary,
    secondaryText: bestTextOn(secondary, palette),
    accent,
    accentText: bestTextOn(accent, palette),
    muted,
    mutedText: bestTextOn(muted, palette),
    card,
    cardText: bestTextOn(card, palette),
    destructive: '#ff6060',
  };
}
