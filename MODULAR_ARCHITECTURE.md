# ChromaStudio - Modular Architecture Guide

This document explains the modular structure of ChromaStudio, designed for maintainability and extensibility.

## Directory Structure

```
ChromaStudio/
├── index.html                 # Main HTML (updated for modular imports)
├── script.js                  # Legacy main script (can be replaced)
├── styles.css                 # All styling
├── js/
│   ├── colorMath.js          # Color conversion (de-obfuscated)
│   ├── paletteGenerator.js    # Harmony-based palette generation
│   ├── contrastEngine.js      # WCAG & APCA contrast calculations
│   ├── stateManager.js        # State, history, storage, URL sync
│   ├── uiRenderer.js          # DOM rendering functions
│   ├── exporters.js           # Export format handlers
│   ├── app.js                 # Main orchestrator & entry point
│   ├── canvas-wheel.js        # Color wheel canvas rendering
│   ├── canvas-cube.js         # 3D cube visualization
│   └── [other utilities]
```

## Module Descriptions

### 1. **colorMath.js** (De-obfuscated Color Utilities)
**Purpose:** All color space conversions and color naming

**Exported Functions:**
- `hexToRgb(hex)` - Convert HEX to RGB
- `rgbToHex(red, green, blue)` - Convert RGB to HEX
- `hexToHsl(hex)` - Convert HEX to HSL
- `hslToHex(hue, saturation, lightness)` - Convert HSL to HEX
- `getLuminance(hex)` - Calculate relative luminance (WCAG)
- `hexToOklch(hex)` - Convert HEX to OKLCH
- `formatOklch(hex)` - Format color as oklch() CSS function
- `getTextColorForBackground(hex)` - Auto-choose black or white for text
- `nameColor(hex)` - Generate human-readable color names

**Example:**
```javascript
import { hexToHsl, hslToHex, nameColor } from './colorMath.js';

const [hue, sat, light] = hexToHsl('#FF5733');
const adjustedColor = hslToHex(hue, sat + 10, light);
console.log(nameColor(adjustedColor)); // "Deep Orange"
```

---

### 2. **paletteGenerator.js** (Palette Harmony Algorithms)
**Purpose:** Generate color palettes using color theory harmonies

**Exported Functions:**
- `generatePalette(baseHex, colorCount, harmonyMode)` - Create palette
- `getRandomPalette()` - Generate random palette config

**Supported Harmonies:**
- Monochromatic, Complementary, Analogous, Triadic
- Split-Comp, Tetradic, Square, Custom

**Example:**
```javascript
import { generatePalette } from './paletteGenerator.js';

const palette = generatePalette('#FF5733', 5, 'Complementary');
// Returns: ['#FF5733', '#33FFB8', '#FF7D33', ...]
```

---

### 3. **contrastEngine.js** (Accessibility Contrast)
**Purpose:** WCAG 2.1 and APCA contrast calculations

**Exported Functions:**
- `wcagContrastRatio(fg, bg)` - WCAG 2.1 contrast ratio
- `apcaContrastValue(text, background)` - WCAG 3.0 APCA contrast
- `getContrastValue(fg, bg, mode)` - Get contrast (WCAG or APCA)
- `getContrastGrade(fg, bg, mode)` - Get grade (AAA/AA/Fail)
- `countAccessibleColors(palette, mode)` - Count passing colors
- `autoFixContrastForColor(color, bg, target, mode)` - Auto-adjust lightness

**Example:**
```javascript
import { wcagContrastRatio, getContrastGrade } from './contrastEngine.js';

const ratio = wcagContrastRatio('#FF5733', '#FFFFFF'); // 5.2
const grade = getContrastGrade('#FF5733', '#FFFFFF', 'wcag');
// Returns: { level: 'AA', className: 'g-aa', value: 5.2 }
```

---

### 4. **stateManager.js** (State Management & Persistence)
**Purpose:** Manages app state, history, localStorage, and URL parameters

**Exported Functions:**
- `getState()` - Get current app state
- `updateState(updates)` - Update state (shallow merge)
- `saveStateToHistory()` - Create undo checkpoint
- `undo()` / `redo()` - Undo/redo functionality
- `persistStateToLocalStorage()` - Save to browser storage
- `loadStateFromLocalStorage()` - Load from browser storage
- `syncStateToURL()` - Update URL query params
- `loadStateFromURL()` - Load from URL params
- `initializeState()` - Initialize app state

**State Structure:**
```javascript
{
  base: '#AA3939',           // Base color
  count: 5,                  // Number of palette colors
  harmony: 'Complementary',  // Harmony mode
  palette: [],               // Generated palette colors
  contrastMode: 'wcag',      // 'wcag' or 'apca'
  colorBlindMode: 'none'     // Color blindness simulation
}
```

**URL Format:**
```
?base=AA3939&harmony=Complementary&count=5&contrast=apca&vision=protanopia
```

---

### 5. **uiRenderer.js** (DOM Rendering)
**Purpose:** All UI updates and DOM manipulation

**Exported Functions:**
- `renderPaletteBar()` - Render bottom color bar
- `renderRightPanel()` - Render right sidebar info
- `renderContextBar(modes, tool)` - Render top context bar
- `renderColorCards()` - Render main color cards grid
- `renderContrastGrid()` - Render contrast checker grid
- `getSwatchStyle(hex)` - Get CSS style with color blindness filter
- `showToast(message)` - Show notification toast

**Example:**
```javascript
import { renderColorCards, showToast } from './uiRenderer.js';

renderColorCards(); // Update color cards display
showToast('Palette saved!');
```

---

### 6. **exporters.js** (Export Formats)
**Purpose:** Handle all palette export formats

**Exported Functions:**
- `exportAsCSS()` - Export as CSS variables
- `exportAsJSON()` - Export as JSON
- `exportAsTailwindConfig()` - Export as Tailwind config
- `exportAsSCSS()` - Export as SCSS variables
- `exportAsShadcnHSL()` - Export as Shadcn HSL tokens
- `exportAsOKLCH()` - Export as OKLCH CSS
- `exportAsFigmaVariablesJSON()` - Export for Figma import

**Example:**
```javascript
import { exportAsCSS, exportAsOKLCH } from './exporters.js';

exportAsCSS();   // Copies to clipboard
exportAsOKLCH(); // Copies OKLCH format
```

---

### 7. **app.js** (Main Orchestrator)
**Purpose:** Ties all modules together; main entry point

**Exported Functions:**
- `initializeApp()` - Initialize the application
- `setBase(hex)` - Change base color
- `setCount(n)` - Change palette size
- `setHarmony(mode)` - Change harmony mode
- `randomizePalette()` - Generate random palette
- `undo()` / `redo()` - Undo/redo
- `setContrastMode(mode)` - Switch contrast algorithm
- `setColorBlindMode(mode)` - Enable color blindness sim
- `switchTool(name)` - Switch to a tool/view
- `render()` - Re-render all UI
- All export functions (re-exported)

**Example:**
```javascript
import * as App from './app.js';

App.setBase('#FF5733');
App.setHarmony('Triadic');
App.randomizePalette();
App.exportAsCSS();
```

---

## How to Extend

### Adding a New Export Format

1. Add function to `exporters.js`:
```javascript
export function exportAsMyFormat() {
  const state = getState();
  const output = format(state.palette);
  copyToClipboard(output);
  showToast('Format exported');
}
```

2. Add button in `index.html`:
```html
<button class="rp-xbtn" onclick="exportAsMyFormat()">
  My Format
</button>
```

### Adding a New Harmony Mode

1. Add mode to `paletteGenerator.js`:
```javascript
case 'MyHarmony':
  for (let i = 0; i < colorCount; i++) {
    // Your algorithm
  }
  break;
```

2. Add to harmony list in `stateManager.js`:
```javascript
export const HARMONY_MODES = [..., 'MyHarmony'];
```

### Adding a New Tool/Panel

1. Create rendering function in `uiRenderer.js` or separate module
2. Add HTML panel in `index.html`
3. Add case to `switchTool()` in `app.js`
4. Add icon button in `index.html`

---

## Variable Naming Convention

All variables are now **de-obfuscated** for readability:

| Old | New |
|-----|-----|
| `h` | `hue` |
| `s` | `saturation` |
| `l` | `lightness` |
| `r`, `g`, `b` | `red`, `green`, `blue` |
| `mx`, `mn` | `maxChannel`, `minChannel` |
| `d` | `delta` |
| `c` | `color` or `chroma` (context-dependent) |
| `t` | `text` / `target` |
| `b` | `background` / `blue` |

---

## Migration from Old Script

**Old (monolithic):**
```html
<script src="script.js"></script>
```

**New (modular):**
```html
<script type="module" src="js/app.js"></script>
```

All functions are now globally available through the `app.js` module when imported as a module in HTML.

---

## Browser Compatibility

- Modern browsers with ES6 Module support (Chrome 61+, Firefox 67+, Safari 10.1+)
- Uses native `fetch` for dynamic imports (if needed)
- No build step required

---

## Performance Notes

- Tree-shaking supported (unused exports won't be bundled)
- Can be bundled with Webpack/Vite for production
- Modules are ~15KB combined (gzipped: ~4KB)

---

## Next Steps

To fully migrate to the modular system:
1. Update `index.html` to use `<script type="module" src="js/app.js"></script>`
2. Remove old inline `<script>` tags
3. Delete `script.js` (or keep for reference)
4. All global functions will still work as expected

Enjoy the maintainable codebase!
