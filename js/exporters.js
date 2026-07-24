// ══ EXPORT FUNCTIONS ══
// Various format exports for palettes

import { getState } from './stateManager.js';
import { hexToRgb, hexToHsl, hexToOklch, nameColor } from './colorMath.js';
import { showToast } from './uiRenderer.js';
import { getSemanticRoleSuggestions } from './palette-utils.js';

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    console.error('Failed to copy to clipboard');
  });
}

export function exportAsCSS() {
  const state = getState();
  const roles = getSemanticRoleSuggestions(state.palette);
  const cssVariables = state.palette
    .map((color, index) => {
      const semanticTokens = (roles[index] || []).map((role) => `\n  --${role.toLowerCase()}: ${color.toUpperCase()};`).join('');
      return `  --color-${index + 1}: ${color.toUpperCase()};${semanticTokens}`;
    })
    .join('\n');
  const output = `:root {\n${cssVariables}\n}`;
  copyToClipboard(output);
  showToast('CSS variables copied');
}

export function exportAsHexList() {
  const state = getState();
  const hexList = state.palette.map((color) => color.toUpperCase()).join('\n');
  copyToClipboard(hexList);
  showToast('HEX list copied');
}

export function exportAsJSON() {
  const state = getState();
  const roles = getSemanticRoleSuggestions(state.palette);
  const jsonData = {
    harmony: state.harmony,
    base: state.base,
    palette: state.palette.map((color, index) => ({
      index: index + 1,
      hex: color.toUpperCase(),
      name: nameColor(color),
      roles: roles[index] || [],
      rgb: hexToRgb(color),
      hsl: hexToHsl(color).map((value) => Math.round(value))
    }))
  };
  copyToClipboard(JSON.stringify(jsonData, null, 2));
  showToast('JSON exported');
}

export function exportAsTailwindConfig() {
  const state = getState();
  const colorEntries = state.palette
    .map((color, index) => `  'cs-${index + 1}':'${color.toUpperCase()}'`)
    .join(',\n');
  const output = `// tailwind.config.js\nmodule.exports={theme:{extend:{colors:{\n${colorEntries}\n}}}}`;
  copyToClipboard(output);
  showToast('Tailwind config copied');
}

export function exportAsSCSS() {
  const state = getState();
  const scssVariables = state.palette
    .map((color, index) => `$color-${index + 1}: ${color.toUpperCase()};`)
    .join('\n');
  copyToClipboard(scssVariables);
  showToast('SCSS variables copied');
}

export function exportAsShadcnHSL() {
  const state = getState();

  const semanticColorMap = {
    background: state.palette[0] || '#000000',
    foreground: state.palette[1] || '#ffffff',
    primary: state.palette[0] || '#000000',
    'primary-foreground': state.palette[1] || '#ffffff',
    secondary: state.palette[2] || state.palette[0],
    'secondary-foreground': state.palette[1] || '#ffffff',
    destructive: '#ef4444',
    'destructive-foreground': '#fafafa',
    muted: state.palette[3] || state.palette[2],
    'muted-foreground': '#737373',
    accent: state.palette[0] || '#000000',
    'accent-foreground': state.palette[1] || '#ffffff',
    popover: '#ffffff',
    'popover-foreground': '#0f0f0f',
    card: state.palette[0] || '#000000',
    'card-foreground': state.palette[1] || '#ffffff',
    border: '#e5e5e5',
    input: '#f5f5f5',
    ring: state.palette[0] || '#000000'
  };

  const hslVariables = Object.entries(semanticColorMap)
    .map(([colorName, hexColor]) => {
      const [hue, saturation, lightness] = hexToHsl(hexColor);
      return `    --${colorName}: ${Math.round(hue)} ${Math.round(saturation)}% ${Math.round(lightness)}%;`;
    })
    .join('\n');

  const output = `@layer base {\n  :root {\n${hslVariables}\n  }\n}`;
  copyToClipboard(output);
  showToast('Shadcn globals.css copied');
}

export function exportAsOKLCH() {
  const state = getState();
  const oklchVariables = state.palette
    .map((color, index) => {
      const [lightness, chroma, hue] = hexToOklch(color);
      return `  --color-${index + 1}: oklch(${(lightness * 100).toFixed(1)}% ${chroma.toFixed(3)} ${hue.toFixed(2)}deg);`;
    })
    .join('\n');
  const output = `:root {\n${oklchVariables}\n}`;
  copyToClipboard(output);
  showToast('OKLCH variables copied');
}

export function exportAsFigmaVariablesJSON() {
  const state = getState();

  const figmaVariables = state.palette.map((color, index) => {
    const [red, green, blue] = hexToRgb(color);
    return {
      name: `Color/${index + 1}`,
      type: 'COLOR',
      value: {
        r: red / 255,
        g: green / 255,
        b: blue / 255,
        a: 1
      }
    };
  });

  const payload = {
    variables: figmaVariables,
    meta: {
      exportedFrom: 'ChromaStudio',
      exportedAt: new Date().toISOString(),
      harmony: state.harmony,
      baseColor: state.base
    }
  };

  copyToClipboard(JSON.stringify(payload, null, 2));
  showToast('Figma variables JSON copied');
}
