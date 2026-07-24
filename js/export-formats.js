import {
  hexToRgb,
  hexToHsl,
  hexToOklch,
  formatOklch,
} from './color-converter.js';
import { nameColor } from './palette-utils.js';

export function exportCssVariables(palette) {
  return `:root {\n${palette.map((color, index) => `  --color-${index + 1}: ${color.toUpperCase()};`).join('\n')}\n}`;
}

export function exportOklchCss(palette) {
  return `:root {\n${palette.map((color, index) => `  --color-${index + 1}: ${formatOklch(color)};`).join('\n')}\n}`;
}

export function exportHexList(palette) {
  return palette.map((color) => color.toUpperCase()).join('\n');
}

export function exportScss(palette) {
  return palette.map((color, index) => `$color-${index + 1}: ${color.toUpperCase()};`).join('\n');
}

export function exportTailwind(palette) {
  return `// tailwind.config.js\nmodule.exports={theme:{extend:{colors:{\n${palette.map((color, index) => `  'cs-${index + 1}':'${color.toUpperCase()}'`).join(',\n')}\n}}}}`;
}

export function exportJson(state) {
  return JSON.stringify(
    {
      harmony: state.harmony,
      base: state.base,
      colorSpace: state.colorSpace || 'hsl',
      palette: state.palette.map((color, index) => ({
        index: index + 1,
        hex: color.toUpperCase(),
        name: nameColor(color),
        rgb: hexToRgb(color),
        hsl: hexToHsl(color).map((value) => Math.round(value)),
        oklch: hexToOklch(color).map((value, channelIndex) =>
          channelIndex === 0 ? Math.round(value * 1000) / 1000 : Math.round(value * 100) / 100
        ),
      })),
    },
    null,
    2
  );
}

/** shadcn/ui globals.css HSL token format */
export function exportShadcn(state) {
  const palette = state.palette;
  const primary = palette[0];
  const secondary = palette[1] || palette[0];
  const accent = palette[2] || palette[1] || palette[0];
  const muted = palette[Math.min(3, palette.length - 1)];

  const toHslToken = (hex) => {
    const [hue, saturation, lightness] = hexToHsl(hex);
    return `${Math.round(hue)} ${Math.round(saturation)}% ${Math.round(lightness)}%`;
  };

  const [bgHue, bgSat, bgLight] = hexToHsl(primary);
  const backgroundLightness = bgLight > 50 ? 98 : 4;
  const foregroundLightness = bgLight > 50 ? 9 : 98;

  return `@layer base {
  :root {
    --background: ${backgroundLightness} 0% ${backgroundLightness}%;
    --foreground: ${foregroundLightness} 0% ${foregroundLightness}%;

    --card: ${backgroundLightness} 0% ${Math.min(100, backgroundLightness + 2)}%;
    --card-foreground: ${foregroundLightness} 0% ${foregroundLightness}%;

    --popover: ${backgroundLightness} 0% ${backgroundLightness}%;
    --popover-foreground: ${foregroundLightness} 0% ${foregroundLightness}%;

    --primary: ${toHslToken(primary)};
    --primary-foreground: ${toHslToken(palette.find((c) => hexToHsl(c)[2] < 50) || '#ffffff')};

    --secondary: ${toHslToken(secondary)};
    --secondary-foreground: ${toHslToken(secondary)};

    --muted: ${toHslToken(muted)};
    --muted-foreground: ${Math.round(bgHue)} ${Math.round(bgSat * 0.3)}% ${Math.round(bgLight * 0.6)}%;

    --accent: ${toHslToken(accent)};
    --accent-foreground: ${toHslToken(accent)};

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;

    --border: ${Math.round(bgHue)} ${Math.round(bgSat * 0.2)}% ${Math.round(bgLight * 0.85)}%;
    --input: ${Math.round(bgHue)} ${Math.round(bgSat * 0.2)}% ${Math.round(bgLight * 0.85)}%;
    --ring: ${toHslToken(primary)};

    --radius: 0.5rem;
  }
}`;
}

/** Figma Variables JSON import schema (simplified) */
export function exportFigmaVariables(state) {
  const collections = [
    {
      name: 'ChromaStudio',
      modes: [{ name: 'Default', variables: [] }],
    },
  ];

  state.palette.forEach((color, index) => {
    const [red, green, blue] = hexToRgb(color);
    collections[0].modes[0].variables.push({
      name: `color/${index + 1}`,
      type: 'COLOR',
      valuesByMode: {
        Default: {
          r: red / 255,
          g: green / 255,
          b: blue / 255,
          a: 1,
        },
      },
    });
  });

  collections[0].modes[0].variables.push({
    name: 'meta/base',
    type: 'STRING',
    valuesByMode: { Default: state.base.toUpperCase() },
  });

  collections[0].modes[0].variables.push({
    name: 'meta/harmony',
    type: 'STRING',
    valuesByMode: { Default: state.harmony },
  });

  return JSON.stringify({ version: '1.0', collections }, null, 2);
}
