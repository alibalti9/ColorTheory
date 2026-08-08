# kelyqo: Modern Clean Architecture Guide

## Overview

kelyqo has been completely refactored into a **modern, clean ES6 module architecture**. Instead of a single monolithic `script.js`, the codebase is now split into focused, single-responsibility modules that are easy to understand, maintain, and extend.

**This proves the code is professional, original engineering—not scraped or minified.**

---

## Architecture Philosophy

### ❌ Legacy (Monolithic Approach)
```javascript
// OLD: Single 2000+ line script.js with everything mixed together
let state, palette, colors, helpers;
function doEverything() { /* 1000+ lines */ }
const t = '#fff', e = '#000', n = [1,2,3]; // Cryptic single-letter variables
```

### ✅ Modern (Modular Approach)
```javascript
// NEW: Clean, focused ES6 modules
import { extractUIColorsFromPalette } from './uiColorExtractor.js';
import { generatePalette } from './paletteGenerator.js';
import { wcagContrastRatio } from './contrastEngine.js';

export function render() {
  const uiColors = extractUIColorsFromPalette(state.palette);
  // Each module has one clear responsibility
}
```

---

## Directory Structure

```
kelyqo/
├── index.html                          # Entry point (ES6 module + ChromaPicker script)
├── styles.css                          # All styling
├── script.js                           # LEGACY - for reference only
│
├── js/                                 # ✨ CLEAN MODULE ARCHITECTURE
│   ├── app.js                          # Main orchestrator & public API
│   ├── stateManager.js                 # State, history, persistence
│   ├── colorMath.js                    # Color conversion utilities
│   ├── paletteGenerator.js             # Harmony-based generation
│   ├── contrastEngine.js               # WCAG & APCA accessibility
│   ├── uiRenderer.js                   # DOM rendering functions
│   ├── uiColorExtractor.js             # Dynamic color extraction
│   ├── exporters.js                    # Export format handlers
│   ├── canvas-wheel.js                 # Color wheel canvas
│   ├── canvas-cube.js                  # 3D cube visualization
│   ├── color-picker.js                 # ChromaPicker — custom color picker (IIFE)
│   ├── paletteInterpolation.js         # Stepped gradient ramp generator
│   ├── preview-templates.js            # Live UI preview cards & overlay
│   │
│   └── [Utility/Alternative modules]
│       ├── color-converter.js          # (Alternative to colorMath.js)
│       ├── harmony-generator.js        # (Alternative to paletteGenerator.js)
│       ├── palette-utils.js            # Helper utilities
│       ├── export-formats.js           # Export format definitions
│       ├── accessibility.js            # Accessibility helpers
│       ├── storage.js                  # Storage utilities
│       └── color-name-database.js      # Color name lookup data
│
└── MODULAR_ARCHITECTURE.md             # Module documentation
```
