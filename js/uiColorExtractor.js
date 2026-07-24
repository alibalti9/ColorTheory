// ══ UI COLOR EXTRACTOR ══
// Dynamically selects the best colors from the palette for UI elements
// Ensures high contrast and visual balance across all themes

import * as ColorMath from './colorMath.js';
import * as ContrastEngine from './contrastEngine.js';

/**
 * Analyzes the palette and extracts optimal colors for UI elements
 * Returns CSS variables that update dynamically based on generated palette
 * 
 * @param {string[]} palette - Array of hex colors from state.palette
 * @returns {Object} Color selections {accent, accentLight, accentDark, buttonBg, cardBg, cardBorder}
 */
export function extractUIColorsFromPalette(palette) {
  if (!palette || palette.length === 0) {
    // Fallback to default theme if palette is empty
    return getDefaultUIColors();
  }

  const colorAnalysis = palette.map((hex, index) => {
    const [hue, saturation, lightness] = ColorMath.hexToHsl(hex);
    const luminance = ColorMath.getLuminance(hex);
    
    return {
      hex,
      index,
      hue,
      saturation,
      lightness,
      luminance,
      // Score for different uses (0-100)
      accentScore: calculateAccentScore(saturation, lightness),
      buttonScore: calculateButtonScore(saturation, lightness),
      backgroundScore: calculateBackgroundScore(saturation, lightness),
      borderScore: calculateBorderScore(saturation, lightness)
    };
  });

  // Select best colors for each UI purpose
  const accentColor = selectColorByScore(colorAnalysis, 'accentScore');
  const buttonColor = selectColorByScore(colorAnalysis, 'buttonScore', accentColor.hex);
  const backgroundCard = selectColorByScore(colorAnalysis, 'backgroundScore');
  const borderColor = selectColorByScore(colorAnalysis, 'borderScore');

  // Generate light/dark variants for depth
  const accentLight = deriveVariant(accentColor.hex, 'light');
  const accentDark = deriveVariant(accentColor.hex, 'dark');
  const buttonHover = deriveVariant(buttonColor.hex, 'dark');

  return {
    // Main accent for highlights, active states
    accent: accentColor.hex,
    accentLight,
    accentDark,
    
    // Button styling
    buttonBg: buttonColor.hex,
    buttonHover,
    
    // Card/surface styling
    cardBg: backgroundCard.hex,
    cardBorder: borderColor.hex,
    
    // Metadata for debugging
    _analysis: {
      accentSaturation: accentColor.saturation.toFixed(1),
      accentLightness: accentColor.lightness.toFixed(1),
      buttonLightness: buttonColor.lightness.toFixed(1),
      cardLightness: backgroundCard.lightness.toFixed(1)
    }
  };
}

/**
 * Score for accent colors: vibrant, saturated, mid-light
 * Best: high saturation + medium lightness (35-70%)
 */
function calculateAccentScore(saturation, lightness) {
  // Prefer high saturation
  const saturationScore = saturation * 0.5; // 0-50
  
  // Prefer medium lightness (40-65 is ideal)
  const lightnessScore = lightness > 30 && lightness < 75
    ? 50 - Math.abs(lightness - 52.5) * 0.4
    : Math.max(0, 50 - Math.abs(lightness - 52.5));
  
  return saturationScore + lightnessScore;
}

/**
 * Score for button colors: visible, interactive, good contrast
 * Best: medium-to-high saturation, slightly darker (30-60% lightness)
 */
function calculateButtonScore(saturation, lightness) {
  // Slight preference for saturation but not extreme
  const saturationScore = Math.min(saturation * 0.4, 40); // 0-40
  
  // Prefer button range (30-60% lightness for good contrast on light/dark)
  const lightnessScore = lightness > 25 && lightness < 65
    ? 60 - Math.abs(lightness - 45) * 0.3
    : Math.max(0, 60 - Math.abs(lightness - 45) * 0.5);
  
  return saturationScore + lightnessScore;
}

/**
 * Score for card backgrounds: readable, subtle, good for content
 * Best: low-to-medium saturation, mid-range lightness (45-70%)
 */
function calculateBackgroundScore(saturation, lightness) {
  // Prefer subtle colors (lower saturation)
  const saturationScore = Math.max(0, 50 - saturation * 0.3); // Lower sat = higher score
  
  // Prefer mid-range lightness for good readability
  const lightnessScore = lightness > 35 && lightness < 75
    ? 50 - Math.abs(lightness - 55) * 0.2
    : Math.max(0, 50 - Math.abs(lightness - 55) * 0.4);
  
  return saturationScore + lightnessScore;
}

/**
 * Score for borders: define edges, subtle contrast
 * Best: medium saturation, slightly darker than backgrounds
 */
function calculateBorderScore(saturation, lightness) {
  // Moderate saturation preference
  const saturationScore = saturation * 0.25; // 0-25
  
  // Prefer slightly darker than cards (35-60%)
  const lightnessScore = lightness > 25 && lightness < 65
    ? 50 - Math.abs(lightness - 45) * 0.2
    : Math.max(0, 50 - Math.abs(lightness - 45) * 0.3);
  
  return saturationScore + lightnessScore;
}

/**
 * Selects the color with highest score, optionally excluding a specific color
 */
function selectColorByScore(colorAnalysis, scoreKey, excludeHex = null) {
  return colorAnalysis
    .filter(c => excludeHex ? c.hex !== excludeHex : true)
    .reduce((best, current) => 
      current[scoreKey] > best[scoreKey] ? current : best
    );
}

/**
 * Creates light or dark variant of a color by adjusting lightness
 */
function deriveVariant(hexColor, variant) {
  const [hue, saturation, lightness] = ColorMath.hexToHsl(hexColor);
  
  let newLightness = lightness;
  if (variant === 'light') {
    newLightness = Math.min(lightness + 15, 90); // Brighten
  } else if (variant === 'dark') {
    newLightness = Math.max(lightness - 15, 20); // Darken
  }
  
  return ColorMath.hslToHex(hue, saturation, newLightness);
}

/**
 * Default theme colors (used as fallback)
 */
function getDefaultUIColors() {
  return {
    accent: '#7c6aff',
    accentLight: '#a89dff',
    accentDark: '#5a4acc',
    buttonBg: '#6b5cf0',
    buttonHover: '#5a4cc5',
    cardBg: '#2a2a2a',
    cardBorder: '#444444',
    _analysis: {
      accentSaturation: '100',
      accentLightness: '60',
      buttonLightness: '50',
      cardLightness: '16'
    }
  };
}

/**
 * Applies extracted colors to CSS variables in the document
 * Call this after palette generation to update the theme
 */
export function applyUIColorsToDOM(uiColors) {
  const root = document.documentElement;
  const style = root.style;
  
  // Update CSS variables
  style.setProperty('--accent', uiColors.accent);
  style.setProperty('--accent-light', uiColors.accentLight);
  style.setProperty('--accent-dark', uiColors.accentDark);
  style.setProperty('--button-bg', uiColors.buttonBg);
  style.setProperty('--button-hover', uiColors.buttonHover);
  style.setProperty('--card-bg', uiColors.cardBg);
  style.setProperty('--card-border', uiColors.cardBorder);
}

/**
 * Get contrast information about extracted colors
 * Useful for debugging and ensuring accessibility
 */
export function getUIColorContrasts(uiColors) {
  const darkBg = '#1a1a1a'; // Dark mode background
  const lightText = '#e8e8e8';
  
  return {
    accentOnDark: ContrastEngine.wcagContrastRatio(uiColors.accent, darkBg),
    buttonOnDark: ContrastEngine.wcagContrastRatio(uiColors.buttonBg, darkBg),
    cardBgOnDark: ContrastEngine.wcagContrastRatio(uiColors.cardBg, darkBg),
    textOnCard: ContrastEngine.wcagContrastRatio(lightText, uiColors.cardBg),
    textOnButton: ContrastEngine.wcagContrastRatio(lightText, uiColors.buttonBg)
  };
}

/**
 * Format UI colors as CSS variable declarations (for export/debugging)
 */
export function formatUIColorsAsCSS(uiColors) {
  return `
:root {
  --accent: ${uiColors.accent};
  --accent-light: ${uiColors.accentLight};
  --accent-dark: ${uiColors.accentDark};
  --button-bg: ${uiColors.buttonBg};
  --button-hover: ${uiColors.buttonHover};
  --card-bg: ${uiColors.cardBg};
  --card-border: ${uiColors.cardBorder};
}`.trim();
}
