# kelyqo: Clean ES6 Module Architecture

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                   index.html (Entry Point)                   │
│                                                               │
│  <script type="module" src="js/app.js"></script>             │
│  <script src="js/color-picker.js"></script>  (IIFE, global)  │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │      app.js (Orchestrator)         │
        │                                   │
        │  - setBase()      - render()      │
        │  - setHarmony()   - undo()/redo() │
        │  - randomize()    - switchTool()  │
        │  - All public API                 │
        └───────┬───────────────────────────┘
                │
    ┌───────────┼───────────┬──────────────┬──────────────┐
    │           │           │              │              │
    ▼           ▼           ▼              ▼              ▼
┌─────────┐ ┌──────────┐ ┌────────────┐ ┌─────────────┐ ┌──────────┐
│ State   │ │ Palette  │ │ Color      │ │ Contrast    │ │ UI       │
│ Manager │ │Generator │ │ Math       │ │ Engine      │ │ Renderer │
│         │ │          │ │            │ │             │ │          │
│ - get() │ │ - gener- │ │ - hexTo    │ │ - wcag()    │ │ - render │
│ - set() │ │   ate()  │ │   Rgb()    │ │ - apca()    │ │   Cards()│
│ - save()│ │ - random │ │ - hexTo    │ │ - getGrade()│ │ - render │
│ - sync()│ │   ize()  │ │   Hsl()    │ │ - autoFix() │ │   Bar()  │
│ - undo()│ │          │ │ - nameColor│ │             │ │ - toast()│
└─────────┘ └──────────┘ └────────────┘ └─────────────┘ └──────────┘
    │           │           │              │              │
    │           │           └──────────────┼──────────────┘
    │           │                          │
    │           └──────────────────────────┼────────────────┐
    │                                      │                │
    ▼                                      ▼                ▼
┌──────────────────┐                 ┌──────────────────┐  ┌──────────────┐
│ UI Color         │                 │ Canvas           │  │ Exporters    │
│ Extractor        │                 │ Visualizations   │  │              │
│                  │                 │                  │  │ - exportCSS()│
│ - extract()      │                 │ - canvas-wheel   │  │ - exportHex()│
│ - apply()        │                 │ - canvas-cube    │  │ - exportJSON │
│ - getContrasts() │                 │                  │  │ - exportShadcn│
└──────────────────┘                 └──────────────────┘  └──────────────┘

  ┌─────────────────────┐   ┌──────────────────────┐
  │ ChromaPicker        │   │ Palette Interpolation│
  │ (color-picker.js)   │   │ (paletteInterpolation│
  │                     │   │  .js)                │
  │ - open()            │   │                      │
  │ - close()           │   │ - generateInterp-    │
  │ - initTrigger()     │   │   olationRamp()      │
  │ - bindAll()         │   │                      │
  │ window.ChromaPicker │   └──────────────────────┘
  └─────────────────────┘
```

## Module Dependency Graph

```
index.html
   │
   ├─> color-picker.js (IIFE — loaded as classic script, no imports)
   │    └─ exposes: window.ChromaPicker
   │
   └─> app.js (Main Entry, ES6 module)
        │
        ├─ imports: StateManager       (stateManager.js)
        │            ├─ (no dependencies)
        │
        ├─ imports: PaletteGenerator   (paletteGenerator.js)
        │            └─ imports: colorMath.js
        │
        ├─ imports: ColorMath          (colorMath.js)
        │            └─ (no dependencies — pure functions)
        │
        ├─ imports: ContrastEngine     (contrastEngine.js)
        │            └─ imports: colorMath.js
        │
        ├─ imports: UIRenderer         (uiRenderer.js)
        │            ├─ imports: stateManager, colorMath
        │            └─ imports: contrastEngine
        │
        ├─ imports: UIColorExtractor   (uiColorExtractor.js)
        │            └─ imports: colorMath, contrastEngine
        │
        ├─ imports: Exporters          (exporters.js)
        │            ├─ imports: stateManager, colorMath
        │            └─ imports: contrastEngine
        │
        ├─ imports: generateInterpolationRamp  (paletteInterpolation.js)
        │            └─ imports: colorMath.js
        │
        ├─ imports: canvas-cube.js
        │            └─ (standalone WebGL/canvas — no app dependencies)
        │
        └─ imports: preview-templates.js
                     └─ (HTML template strings — no app dependencies)
```

## Module Responsibilities

### 🔄 **stateManager.js**
**Single Responsibility:** Manage application state, history, persistence

- Store current app state (palette, settings, preferences)
- Undo/redo history management
- localStorage persistence
- URL parameter synchronization

**Pure Data Layer:**
```javascript
{
  base: '#AA3939',              // Base color
  count: 5,                     // Palette size
  harmony: 'Complementary',     // Algorithm
  palette: [],                  // Generated colors
  contrastMode: 'wcag',         // 'wcag' | 'apca'
  colorBlindMode: 'none',       // Simulation mode
  lockedSlots: [],              // Indices of locked palette slots
  lockedColors: [],             // Hex values for locked slots
  interpolationStart: '#000000',// Gradient ramp start
  interpolationEnd: '#FFFFFF',  // Gradient ramp end
  interpolationSteps: 5         // Number of ramp steps
}
```

---

### 🎨 **colorMath.js**
**Single Responsibility:** Color space conversions and analysis

**Available Functions:**
- `hexToRgb()` / `rgbToHex()` — RGB conversions
- `hexToHsl()` / `hslToHex()` — HSL conversions
- `hexToOklch()` / `oklchToHex()` — OKLCH (perceptually uniform)
- `getLuminance()` — WCAG luminance calculation
- `getTextColorForBackground()` — Auto contrast selection
- `nameColor()` — Generate color names

**Design:**
- ✅ Pure functions (no side effects)
- ✅ Fully de-obfuscated variable names
- ✅ No dependencies on other modules
- ✅ Can be used standalone

---

### 🌈 **paletteGenerator.js**
**Single Responsibility:** Generate color harmonies using color theory

**Supported Modes:**
- Monochromatic
- Complementary
- Analogous
- Triadic
- Split-Complementary
- Tetradic
- Custom

**Algorithm Pattern:**
```javascript
export function generatePalette(baseHex, colorCount, harmonyMode) {
  // 1. Extract base hue, saturation, lightness
  // 2. For each color in palette:
  //    - Calculate rotated hue based on harmony
  //    - Interpolate lightness for visual progression
  //    - Convert back to hex
  // 3. Return array of hex colors
}
```

---

### ✅ **contrastEngine.js**
**Single Responsibility:** Calculate accessibility metrics

**Algorithms:**
- WCAG 2.1 (contrast ratio: 1-21)
- WCAG 3.0 APCA (perceptual contrast: -100 to +100)

**Functions:**
- `wcagContrastRatio()` — Standard WCAG formula
- `apcaContrastValue()` — Modern perceptual formula
- `getContrastGrade()` — Returns pass/fail and level
- `autoFixContrastForColor()` — Adjust lightness for threshold

---

### 🖼️ **uiRenderer.js**
**Single Responsibility:** DOM rendering and UI updates

**Functions:**
- `renderColorCards()` — Main color grid
- `renderContextBar()` — Top toolbar with controls
- `renderPaletteBar()` — Bottom color strip
- `renderRightPanel()` — Sidebar info
- `showToast()` — Toast notifications

**Design Pattern:**
```javascript
export function renderColorCards() {
  // Get current state
  const state = getState();
  
  // Transform state to HTML
  const html = state.palette.map((color, index) => {
    return `<div class="color-card">${color}</div>`;
  }).join('');
  
  // Update DOM
  document.getElementById('container').innerHTML = html;
}
```

---

### 🎯 **uiColorExtractor.js**
**Single Responsibility:** Intelligently extract UI colors from palette

**Features:**
- Analyzes palette colors
- Scores colors for accent, button, background, border
- Selects best options
- Creates light/dark variants
- Updates CSS variables

**Output:**
```javascript
{
  accent: '#7c6aff',        // Main accent
  accentLight: '#a89dff',   // +15% lightness
  accentDark: '#5a4acc',    // -15% lightness
  buttonBg: '#6b5cf0',      // Best button color
  buttonHover: '#5a4cc5',   // Hover state
  cardBg: '#2a2a2a',        // Card background
  cardBorder: '#444444'     // Border color
}
```

---

### 📤 **exporters.js**
**Single Responsibility:** Format palette for different platforms

**Export Formats:**
- CSS Variables (`:root { --color-1: ... }`)
- Hex List (plain `#RRGGBB` lines)
- JSON (Metadata + color data)
- Tailwind Config (JavaScript module)
- SCSS Variables
- Shadcn/UI HSL Tokens
- OKLCH CSS
- Figma Variables API

**Pattern:**
```javascript
export function exportAsCSS() {
  // 1. Get palette from state
  // 2. Format as CSS variables
  // 3. Copy to clipboard
  // 4. Show confirmation
}
```

---

### ⚙️ **app.js**
**Single Responsibility:** Orchestrate all modules and provide public API

**Pattern:**
```javascript
// 1. Import all modules
import * as StateManager from './stateManager.js';
import * as PaletteGenerator from './paletteGenerator.js';
// ... etc

// 2. Define public API
export function setBase(hexColor) { /* ... */ }
export function setHarmony(mode) { /* ... */ }
export function render() { /* ... */ }

// 3. Compose sub-functions from modules
export function render() {
  const uiColors = UIColorExtractor.extractUIColorsFromPalette(state.palette);
  UIRenderer.renderColorCards();
  StateManager.syncStateToURL();
}

// 4. Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
```

---

### 🎨 **color-picker.js** — Custom Color Picker (ChromaPicker)
**Single Responsibility:** Replace `<input type="color">` with a fully-accessible, high-performance color picker panel

This module is an **IIFE** (Immediately Invoked Function Expression) loaded as a classic `<script>` tag — not an ES6 module. It attaches itself to `window.ChromaPicker` and has no external dependencies.

**Public API (`window.ChromaPicker`):**
- `open(triggerEl, initialHex, onChangeFn, onCommitFn?)` — Open the picker anchored to a trigger element
- `close(commit?)` — Close; pass `false` to discard the current selection
- `isOpen()` — Returns `true` if the picker panel is currently visible
- `initTrigger(el, getHex, setHex)` — Wire any button as a picker trigger
- `setFromHex(hex)` — Force the picker state to a given hex without reopening
- `bindAll()` — Auto-wire every `[data-picker]` element in the document

**UI Components:**
- SV (Saturation/Value) canvas — drag to pick color within a hue
- Hue rail — horizontal gradient slider for hue selection
- Hex input — live typed entry with validation
- HSL readout — real-time display of current H°, S%, L%
- Preset swatches — 15 curated quick-pick colors
- Cancel / Apply action buttons

**Design:**
- ✅ Self-contained color math (no dependency on colorMath.js)
- ✅ Pointer events with `setPointerCapture` for smooth cross-device drag
- ✅ Viewport-aware positioning (flips near screen edges)
- ✅ Focus trap and keyboard navigation (Tab, Shift+Tab, Escape, Enter)
- ✅ Returns focus to trigger element on close

**Integration Example:**
```javascript
// Wire a swatch button after rendering it to the DOM
const btn = document.querySelector('.ctx-cpick');
ChromaPicker.initTrigger(
  btn,
  () => StateManager.getState().base,   // getter
  (hex) => setBase(hex)                 // setter (live + commit)
);
```

---

### 〰️ **paletteInterpolation.js** — Stepped Gradient Ramp
**Single Responsibility:** Generate a perceptually smooth color ramp between two hex endpoints

**Exported Functions:**
- `generateInterpolationRamp(startHex, endHex, steps)` — Returns an array of `steps` hex colors interpolated between start and end

Used by the Gradients tool panel via `app.js`.

---

### 🖥️ **preview-templates.js** — Live UI Preview Templates
**Single Responsibility:** Define and render live UI preview cards using the active palette

**Exports:**
- `PREVIEW_CARDS` — Array of preview type descriptors (`{ type, emoji, title, desc }`)
- `openPreview(type, palette)` — Open a full-screen preview overlay for a given type

Used by `renderPreviewPanel()` and `openPalettePreview()` in `app.js`.

---



### ✅ Variable Naming Rules

**All variables MUST be descriptive:**

| Context | ✅ Good | ❌ Bad |
|---------|--------|--------|
| Color spaces | `hexColor`, `red`, `hue` | `e`, `r`, `h` |
| Loops | `index`, `colorIndex` | `i`, `j` |
| Flags | `isComplement`, `hasError` | `i`, `t` |
| Arrays | `paletteColors`, `channels` | `a`, `c` |
| Objects | `contrastValue`, `uiColors` | `r`, `o` |
| Math | `maxChannel`, `delta`, `luminance` | `mx`, `d`, `l` |

### ✅ Function Naming Rules

**Functions MUST start with action verbs:**

| Pattern | ✅ Good | ❌ Bad |
|---------|--------|--------|
| Getters | `getState()`, `getLuminance()` | `state()`, `lum()` |
| Setters | `setState()`, `updateState()` | `set()`, `u()` |
| Generators | `generatePalette()` | `gen()` |
| Renderers | `renderColorCards()` | `render()` |
| Calculators | `calculateAccentScore()` | `score()` |

### ✅ Comment Standards

Every module should have:
1. **Module comment** at top (purpose and contents)
2. **Function JSDoc** (parameters, returns, example)
3. **Algorithm comments** (explain complex logic)

```javascript
/**
 * Extract optimal UI colors from generated palette
 * Uses intelligent scoring to find best colors for UI elements
 * 
 * @param {string[]} palette - Array of hex colors
 * @returns {Object} Selected colors with variants
 * @example
 * const uiColors = extractUIColorsFromPalette(['#FF5733', '#00FF00']);
 * console.log(uiColors.accent); // Best accent color
 */
export function extractUIColorsFromPalette(palette) {
  // Implementation
}
```

---

## How to Extend

### 1. Add a New Harmony Mode

**File:** `paletteGenerator.js`

```javascript
case 'MyMode':
  for (let index = 0; index < colorCount; index++) {
    // Your algorithm here
    const rotatedHue = (baseHue + (index * 45)) % 360;
    paletteColors.push(hslToHex(rotatedHue, saturation, lightness));
  }
  break;
```

### 2. Add a New Export Format

**File:** `exporters.js`

```javascript
export function exportAsMyFormat() {
  const state = StateManager.getState();
  const formatted = /* transform palette */;
  navigator.clipboard.writeText(formatted);
  UIRenderer.showToast('Exported!');
}
```

**File:** `index.html`

```html
<button onclick="exportAsMyFormat()">Export MyFormat</button>
```

### 3. Add a New Tool/Panel

**File:** `uiRenderer.js`

```javascript
export function renderMyTool() {
  const state = StateManager.getState();
  document.getElementById('panel').innerHTML = /* your HTML */;
}
```

**File:** `app.js`

```javascript
export function switchTool(toolName) {
  if (toolName === 'myTool') UIRenderer.renderMyTool();
}
```

---

## Testing

Each module can be tested independently:

```javascript
// colorMath.js - Pure functions, easy to test
const result = hexToHsl('#FF5733');
assert.deepEqual(result, [14, 100, 52]);

// stateManager.js - Encapsulated state
updateState({ base: '#FFFFFF' });
assert.equal(getState().base, '#FFFFFF');

// paletteGenerator.js - Deterministic output
const palette = generatePalette('#FF0000', 5, 'Complementary');
assert.equal(palette.length, 5);
```

---

## Summary: Why This Architecture Wins

✅ **Professional Quality** — Clean, readable code signals original engineering  
✅ **Maintainable** — Each module has one clear responsibility  
✅ **Extensible** — Easy to add new features without breaking existing code  
✅ **Testable** — Pure functions and encapsulated state enable testing  
✅ **Scalable** — Can grow to support more tools, formats, algorithms  
✅ **Modern** — Uses ES6 standards, no legacy cruft  

---

**For buyers:** This is production-grade software, engineered with professional standards.

**For developers:** This is a pleasure to work with and extend.
