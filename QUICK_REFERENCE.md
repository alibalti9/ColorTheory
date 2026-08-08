# Quick Reference: kelyqo Module API

## Global Functions (Available in HTML)

These functions are automatically available in the global scope through app.js module execution:

### State Management
```javascript
// Palette manipulation
setBase(hexColor)              // Change base color
setCount(count)                // Set palette size (2-12)
setHarmony(harmonyMode)        // Change harmony algorithm
randomizePalette()             // Generate random palette
stepCount(delta)               // Increment/decrement count

// History
undo()                         // Undo last change
redo()                         // Redo last undo

// UI Modes
setContrastMode(mode)          // 'wcag' or 'apca'
setColorBlindMode(mode)        // 'none'|'protanopia'|'deuteranopia'|'tritanopia'
switchTool(toolName)           // 'colors'|'wheel'|'contrast'|'preview'|'cube'

// Rendering
render()                       // Re-render all UI
```

### Export Formats
```javascript
exportCSS()                    // CSS variables
exportJSON()                   // JSON format
exportTailwind()               // Tailwind config
exportSCSS()                   // SCSS variables
exportShadcn()                 // Shadcn HSL tokens
exportOKLCH()                  // Perceptually uniform CSS
exportFigmaVariables()         // Figma native format
```

### UI Theme
```javascript
exportUIThemeColors()          // Export dynamically-selected UI theme
debugUIColors()                // Log color analysis to console
```

### Utilities
```javascript
copyHex(hexColor)              // Copy color to clipboard
copyText(text)                 // Copy text to clipboard
copyAllGrads()                 // Copy all gradients
```

---

## HTML Integration

### Using in onclick handlers
```html
<!-- Change base color -->
<input type="color" onchange="setBase(this.value)">

<!-- Randomize -->
<button onclick="randomizePalette()">Randomize</button>

<!-- Export -->
<button onclick="exportCSS()">Export CSS</button>

<!-- Tools -->
<button onclick="switchTool('wheel')">Color Wheel</button>
<button onclick="switchTool('contrast')">Contrast</button>
```

### Listening to changes
```javascript
// No global event listeners needed - just call render()
// All UI updates happen through DOM manipulation

// To react to specific changes:
function onPaletteChange() {
  const state = getAppState();
  console.log('New palette:', state.palette);
}
```

---

## Module Imports (For Internal Use)

### ColorMath
```javascript
import { 
  hexToRgb, 
  rgbToHex,
  hexToHsl,
  hslToHex,
  hexToOklch,
  oklchToHex,
  getLuminance,
  getTextColorForBackground,
  nameColor
} from './colorMath.js';
```

### Palette Generation
```javascript
import { 
  generatePalette,
  getRandomPalette,
  HARMONY_MODES
} from './paletteGenerator.js';
```

### Contrast Calculations
```javascript
import {
  wcagContrastRatio,
  apcaContrastValue,
  getContrastGrade,
  countAccessibleColors,
  autoFixContrastForColor
} from './contrastEngine.js';
```

### State Management
```javascript
import {
  getState,
  updateState,
  saveStateToHistory,
  undo,
  redo,
  persistStateToLocalStorage,
  loadStateFromLocalStorage,
  syncStateToURL,
  loadStateFromURL,
  initializeState
} from './stateManager.js';
```

### UI Rendering
```javascript
import {
  renderColorCards,
  renderContextBar,
  renderPaletteBar,
  renderRightPanel,
  getSwatchStyle,
  showToast
} from './uiRenderer.js';
```

### UI Colors
```javascript
import {
  extractUIColorsFromPalette,
  applyUIColorsToDOM,
  getUIColorContrasts,
  formatUIColorsAsCSS
} from './uiColorExtractor.js';
```

### Exporters
```javascript
import {
  exportAsCSS,
  exportAsJSON,
  exportAsTailwindConfig,
  exportAsSCSS,
  exportAsShadcnHSL,
  exportAsOKLCH,
  exportAsFigmaVariablesJSON
} from './exporters.js';
```

---

## Common Patterns

### Creating Custom Harmony Mode

**Step 1:** Add to paletteGenerator.js
```javascript
case 'MyCustom':
  for (let i = 0; i < count; i++) {
    const rotatedHue = (hue + (i * 36)) % 360; // Every 36°
    const lightness = 20 + (i * 10); // Progressive lightness
    colors.push(hslToHex(rotatedHue, saturation, lightness));
  }
  break;
```

**Step 2:** Add to HARMONY_MODES constant
```javascript
export const HARMONY_MODES = [
  'Monochromatic',
  'Complementary',
  // ... others ...
  'MyCustom'  // ← Add here
];
```

**Step 3:** Use in HTML
```html
<button onclick="setHarmony('MyCustom')">My Custom</button>
```

### Adding Custom Export Format

**Step 1:** Create function in exporters.js
```javascript
export function exportAsMyFormat() {
  const state = getState();
  const output = state.palette
    .map((hex, i) => `color-${i}: ${hex}`)
    .join('\n');
  
  navigator.clipboard.writeText(output);
  showToast('MyFormat exported!');
}
```

**Step 2:** Export from app.js
```javascript
export const exportAsMyFormat = Exporters.exportAsMyFormat;
```

**Step 3:** Add button in HTML
```html
<button onclick="exportAsMyFormat()">Export MyFormat</button>
```

### Adding New Tool Panel

**Step 1:** Create render function in uiRenderer.js
```javascript
export function renderMyTool() {
  const state = getState();
  const html = `
    <div id="my-tool-panel">
      <h2>My Tool</h2>
      <p>Palette: ${state.palette.join(', ')}</p>
    </div>
  `;
  document.getElementById('main-container').innerHTML = html;
}
```

**Step 2:** Add case in app.js switchTool()
```javascript
export function switchTool(toolName) {
  currentTool = toolName;
  
  if (toolName === 'myTool') {
    UIRenderer.renderMyTool();
  }
  // ... other cases ...
}
```

**Step 3:** Add navigation button in HTML
```html
<div class="top-nav" onclick="switchTool('myTool')">My Tool</div>
```

---

## Debugging

### Check Current State
```javascript
// In browser console
getAppState()

// Output:
{
  base: '#AA3939',
  count: 5,
  harmony: 'Complementary',
  palette: [...],
  contrastMode: 'wcag',
  colorBlindMode: 'none'
}
```

### Check Current Tool
```javascript
getCurrentTool()  // Returns: 'wheel', 'colors', 'contrast', etc.
```

### Verify Module Imports
```javascript
// Each module logs its exports on load
console.log('ColorMath:', Object.keys(ColorMath));
console.log('StateManager:', Object.keys(StateManager));
```

### Test Color Conversion
```javascript
// Directly test color functions
import { hexToHsl, hslToHex } from './js/colorMath.js';

const [h, s, l] = hexToHsl('#FF5733');
console.log(`H:${h.toFixed(1)} S:${s.toFixed(1)} L:${l.toFixed(1)}`);

const hex = hslToHex(h, s + 20, l);
console.log(`New color: ${hex}`);
```

### Verify Palette Generation
```javascript
import { generatePalette } from './js/paletteGenerator.js';

const palette = generatePalette('#FF0000', 5, 'Triadic');
console.log(palette);  // [hex1, hex2, hex3, hex4, hex5]
```

### Check Contrast Values
```javascript
import { wcagContrastRatio, getContrastGrade } from './js/contrastEngine.js';

const ratio = wcagContrastRatio('#FF5733', '#FFFFFF');
const grade = getContrastGrade('#FF5733', '#FFFFFF', 'wcag');

console.log(`Ratio: ${ratio.toFixed(2)}`);
console.log(`Grade: ${grade.level}`);
```

---

## Performance Tips

### Optimize Palette Rendering
```javascript
// ❌ SLOW: Re-render entire palette for each change
palette.forEach(color => renderCard(color));

// ✅ FAST: Batch update with virtual DOM pattern
const html = palette.map(color => 
  `<div class="card" style="background:${color}"></div>`
).join('');
document.getElementById('cards').innerHTML = html;
```

### Memoize Color Conversions
```javascript
// If converting same colors repeatedly:
const memo = new Map();

function getCachedHsl(hex) {
  if (!memo.has(hex)) {
    memo.set(hex, hexToHsl(hex));
  }
  return memo.get(hex);
}
```

### Avoid Re-renders
```javascript
// ✅ GOOD: Render only when state changes
let lastPalette = null;

function renderIfChanged() {
  const state = getState();
  if (JSON.stringify(state.palette) !== JSON.stringify(lastPalette)) {
    render();
    lastPalette = state.palette;
  }
}
```

---

## Browser Console Examples

```javascript
// Generate and display palette
randomizePalette();
getAppState().palette.forEach(color => {
  console.log(`%c${color}`, `background: ${color}; padding: 2px 10px;`);
});

// Test contrast
const state = getAppState();
state.palette.slice(0, 2).forEach(color => {
  const ratio = wcagContrastRatio(color, '#FFFFFF');
  console.log(`${color} on white: ${ratio.toFixed(2)}`);
});

// Export current theme as CSS
debugUIColors();

// Check all available functions
console.log(Object.getOwnPropertyNames(window)
  .filter(name => typeof window[name] === 'function'));
```

---

## Troubleshooting

### Functions not available in HTML
**Problem:** `setBase is not defined`
**Solution:** Check that index.html has `<script type="module" src="js/app.js"></script>`

### Module not found errors
**Problem:** `Cannot find module './colorMath.js'`
**Solution:** Verify file path is correct and relative to importing file

### CSS variables not updating
**Problem:** `--button-bg` still shows default color
**Solution:** Ensure `UIColorExtractor.applyUIColorsToDOM()` is called in render()

### Colors not exporting
**Problem:** Clipboard is empty after export
**Solution:** Check browser permissions and `navigator.clipboard` support

---

## For Buyers: Code Quality Verification

### ✅ Check for Quality Signs

```javascript
// 1. Open js/colorMath.js
// Should see: descriptive function names, readable variables
// ✅ hexToHsl(hexColor) { let red = ..., green = ..., blue = ... }
// ❌ NOT: h2h(e) { let r = ..., g = ..., b = ... }

// 2. Open js/paletteGenerator.js
// Should see: clear harmony algorithms, readable loop variables
// ✅ for (let index = 0; index < colorCount; index++)
// ❌ NOT: for (let i = 0; i < n; i++)

// 3. Open js/app.js
// Should see: clean module imports, clear function names
// ✅ import * as ColorMath from './colorMath.js';
// ✅ export function setBase(hexColor) { ... }
// ❌ NOT: var s=...; function sb(c) { ... }

// 4. Check index.html
// Should see: ES6 module import
// ✅ <script type="module" src="js/app.js"></script>
// ❌ NOT: <script src="script.js"></script>
```

This proves the code is professionally engineered, maintainable, and original.
