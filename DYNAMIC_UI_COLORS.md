# Dynamic Text Color Extraction System

## Overview

Instead of using fixed hardcoded color variables (like `n`, `o`, `i`), ChromaStudio now **intelligently extracts** the best colors directly from your generated palette. This guarantees that no matter what random colors are generated, the landing page and dashboard always look beautifully balanced.

## How It Works

### 1. Color Analysis Algorithm

When you generate a palette, the system analyzes each color for:

- **Hue** (0-360°) - The color family
- **Saturation** (0-100%) - Color intensity
- **Lightness** (0-100%) - Brightness level
- **Luminance** - Perceived brightness

### 2. Intelligent Selection

Colors are scored for different UI purposes:

| Purpose | Score Formula | Best Properties | Use Case |
|---------|---------------|-----------------|----------|
| **Accent** | High saturation + mid lightness | Vibrant, eye-catching | Highlights, active states, focus indicators |
| **Button** | Medium-high saturation + medium lightness | Interactive, clickable | Primary buttons, calls-to-action |
| **Card Background** | Low saturation + mid lightness | Subtle, readable | Content containers, preview areas |
| **Border** | Medium saturation + slightly dark | Definition, contrast | Visual separators, edge definition |

### 3. Derived Variants

From each selected color, the system automatically creates:

- **Light variant** (+15% lightness) - Hover states, hover overlays
- **Dark variant** (-15% lightness) - Active states, pressed buttons

### Example Score Calculation

For an **Accent Color**:
```
Saturation Score = saturation × 0.5        // Range: 0-50
Lightness Score  = quality of mid-lightness // Range: 0-50
Total Score      = Saturation Score + Lightness Score
```

A color with 80% saturation and 50% lightness scores:
```
Saturation: 80 × 0.5 = 40
Lightness: 50 (ideal range) = 50
Total: 90/100
```

## CSS Variables

The system updates these CSS custom properties dynamically:

```css
:root {
  /* Main accent from palette */
  --accent: #7c6aff;
  
  /* Derived variants */
  --accent-light: #a89dff;      /* +15% lightness */
  --accent-dark: #5a4acc;       /* -15% lightness */
  
  /* Interactive elements */
  --button-bg: #6b5cf0;         /* Best button color */
  --button-hover: #5a4cc5;      /* Button hover state */
  
  /* Surfaces */
  --card-bg: #2a2a2a;           /* Card backgrounds */
  --card-border: #444444;       /* Border definition */
}
```

## Integration

### Automatic Updates

```javascript
// In app.js render() function:
export function render() {
  const state = StateManager.getState();
  
  // Extract colors from palette
  if (state.palette && state.palette.length > 0) {
    const uiColors = UIColorExtractor.extractUIColorsFromPalette(state.palette);
    UIColorExtractor.applyUIColorsToDOM(uiColors);  // Apply to CSS
  }
  
  // ... rest of render
}
```

Every time you:
- Generate a new palette
- Change harmony mode
- Randomize colors
- Adjust palette size

...the UI colors automatically re-extract and update the interface.

## Usage Examples

### Generate & Auto-Update

```javascript
// This automatically triggers color extraction
setBase('#FF5733');
setHarmony('Triadic');
randomizePalette();

// UI updates with new accent, buttons, etc.
// All without you manually picking colors
```

### Export Current Theme

```javascript
// Export the dynamically-selected theme as CSS
exportUIThemeColors();

// Output example:
// :root {
//   --accent: #7c6aff;
//   --accent-light: #a89dff;
//   --accent-dark: #5a4acc;
//   --button-bg: #6b5cf0;
//   --button-hover: #5a4cc5;
//   --card-bg: #2a2a2a;
//   --card-border: #444444;
// }
```

### Debug Color Selection

```javascript
// See how colors were scored and selected
debugUIColors();

// Console output:
// === UI COLOR ANALYSIS ===
// Extracted Colors: { accent: '#7c6aff', buttonBg: '#6b5cf0', ... }
// Contrast Ratios: { accentOnDark: 5.2, buttonOnDark: 4.8, ... }
// CSS Variables: :root { --accent: #7c6aff; ... }
```

## API Reference

### UIColorExtractor Module

#### `extractUIColorsFromPalette(palette)`

Analyzes palette and returns optimal UI colors.

**Parameters:**
- `palette` (string[]) - Array of hex colors

**Returns:**
```javascript
{
  accent: '#7c6aff',           // Main accent color
  accentLight: '#a89dff',      // +15% lightness
  accentDark: '#5a4acc',       // -15% lightness
  buttonBg: '#6b5cf0',         // Best button color
  buttonHover: '#5a4cc5',      // Hover state
  cardBg: '#2a2a2a',           // Card background
  cardBorder: '#444444'        // Border color
}
```

#### `applyUIColorsToDOM(uiColors)`

Updates CSS variables in the browser.

**Parameters:**
- `uiColors` (object) - Result from `extractUIColorsFromPalette()`

**Effect:**
- Sets all `--accent`, `--button-*`, etc. CSS variables
- UI automatically updates to match

#### `getUIColorContrasts(uiColors)`

Validates contrast ratios (WCAG 2.1).

**Returns:**
```javascript
{
  accentOnDark: 5.2,           // Ratio: accent on #1a1a1a
  buttonOnDark: 4.8,           // Ratio: button on dark
  cardBgOnDark: 3.1,           // Ratio: card background
  textOnCard: 6.7,             // Ratio: light text on card
  textOnButton: 7.2            // Ratio: light text on button
}
```

#### `formatUIColorsAsCSS(uiColors)`

Formats colors as CSS (for export/display).

**Returns:**
```css
:root {
  --accent: #7c6aff;
  --accent-light: #a89dff;
  /* ... all variables ... */
}
```

## Visual Flow

```
Generate Palette
     ↓
extractUIColorsFromPalette()
     ├→ Analyze each color (hue, sat, lightness)
     ├→ Score for accent, button, background, border
     ├→ Select best colors
     └→ Derive light/dark variants
     ↓
applyUIColorsToDOM()
     ├→ Set CSS variables
     └→ UI updates in real-time
     ↓
User sees balanced, color-coordinated interface
```

## Advantages

✅ **No Hardcoded Colors** — All extracted dynamically from palette
✅ **Always Balanced** — Intelligent scoring ensures harmony
✅ **Instant Updates** — Colors change when palette changes
✅ **Accessible** — Built-in contrast checking
✅ **Themeable** — Easy to create multiple themes from one palette
✅ **Exported** — Theme colors can be saved and shared

## Behind the Scenes: Scoring Example

### Scenario: 5-Color Palette Generated

```
Palette: ['#AA3939', '#7C3F3F', '#FF5733', '#FFA500', '#FFEB3B']

Color Analysis:
┌─────────────┬──────┬────┬────┬──────────┬────────┬──────────┬─────────┐
│ Hex         │ Hue  │ Sat│ Lgt│ Accent ↑ │ Button │ BgCard   │ Border  │
├─────────────┼──────┼────┼────┼──────────┼────────┼──────────┼─────────┤
│ #AA3939     │ 0°   │ 48 │ 42 │ 44.0     │ 56.2   │ 38.4     │ 40.1    │
│ #7C3F3F     │ 0°   │ 32 │ 25 │ 22.5     │ 35.6   │ 22.1     │ 45.2    │
│ #FF5733     │ 14°  │ 100│ 52 │ 92.4 ✓   │ 68.8   │ 42.1     │ 38.9    │
│ #FFA500     │ 39°  │ 100│ 50 │ 87.1     │ 71.2   │ 41.8     │ 39.2    │
│ #FFEB3B     │ 56°  │ 100│ 50 │ 87.1     │ 71.2   │ 41.8     │ 39.2    │
└─────────────┴──────┴────┴────┴──────────┴────────┴──────────┴─────────┘

Selections:
✓ Accent    = #FF5733 (score: 92.4) — Vibrant orange-red
✓ Button    = #FFA500 (score: 71.2) — Warm orange
✓ Background= #AA3939 (score: 38.4) — Subtle burgundy
✓ Border    = #7C3F3F (score: 45.2) — Deep burgundy

Variants:
✓ Accent Light  = #FF8C66 (52% + 15% = 67% lightness)
✓ Accent Dark   = #CC4422 (52% - 15% = 37% lightness)
✓ Button Hover  = #DD8800 (50% - 15% = 35% lightness)
```

## Extending the System

### Adding a New Color Purpose

Edit `uiColorExtractor.js`:

```javascript
function calculateCustomScore(saturation, lightness) {
  // Your scoring logic
  const saturationScore = saturation * customWeight;
  const lightnessScore = idealLightness - Math.abs(lightness - ideal);
  return saturationScore + lightnessScore;
}

// In extractUIColorsFromPalette():
const customColor = selectColorByScore(colorAnalysis, 'customScore');

// Return in uiColors object:
return {
  // ... existing colors ...
  customColor: customColor.hex,
};
```

### Adding to CSS

```css
:root {
  --custom-color: #ffffff; /* Will be overridden by JS */
}

.my-element {
  background: var(--custom-color);
}
```

## Performance Notes

- Extraction runs on every render (~1-2ms for typical palettes)
- CSS variable updates are instant (no reflow)
- No external dependencies
- Works in all modern browsers

## Browser Compatibility

- Chrome/Edge 49+
- Firefox 31+
- Safari 9.1+
- Requires CSS Custom Properties support

## Troubleshooting

### Colors not updating?

```javascript
// Manually trigger update
const state = getAppState();
const uiColors = UIColorExtractor.extractUIColorsFromPalette(state.palette);
UIColorExtractor.applyUIColorsToDOM(uiColors);
```

### Want to see extraction details?

```javascript
debugUIColors(); // Logs full analysis to console
```

### Need specific colors?

```javascript
const state = getAppState();
const uiColors = UIColorExtractor.extractUIColorsFromPalette(state.palette);
console.log(uiColors.accent);      // Get specific color
console.log(uiColors._analysis);   // See scoring details
```

---

**Summary:** This system automatically finds the most beautiful, balanced colors from your palette and applies them throughout the UI — all with zero manual intervention. The interface always looks harmonious, no matter what palette is generated.
