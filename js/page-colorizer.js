/**
 * kelyqo – Page Colorizer Engine
 * Multi-color live-edit system with contextual click-to-recolor toolbar.
 *
 * Public API (window.PageColorizer):
 *   PageColorizer.init(containerEl)        – activate on a container
 *   PageColorizer.syncPalette(hexArray)    – push new palette from kelyqo
 *   PageColorizer.destroy()               – remove all listeners and UI
 *   PageColorizer.undo() / .redo()        – local history
 *   PageColorizer.isActive()
 */
(function (global) {
  'use strict';

  // ─────────────────────────────────────────────
  // PALETTE SLOTS  (name → current hex)
  // ─────────────────────────────────────────────
  const SLOT_NAMES = ['Primary', 'Secondary', 'Accent', 'Background', 'Text'];
  const SLOT_DEFAULTS = ['#7C6AFF', '#56CCF2', '#FF6B6B', '#1A1A2E', '#E8E8E8'];

  let _slots = SLOT_DEFAULTS.slice(); // indexed 0-4, mirrors palette where available

  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────
  let _container  = null;   // the #edit-canvas root element
  let _selected   = null;   // currently selected element
  let _toolbar    = null;   // portal toolbar DOM node
  let _activeTarget = 'bg'; // 'bg' | 'text' | 'border'
  let _active     = false;

  // Per-element override map: el → { bg, text, border, slotBg, slotText, slotBorder }
  // slotX: null = local override, 0-4 = linked to slot index
  const _registry = new WeakMap();

  // Local undo/redo stack: array of { el, prop, prev, next } batches
  let _undoStack = [], _redoStack = [];

  // ─────────────────────────────────────────────
  // COLOR MATH  (self-contained)
  // ─────────────────────────────────────────────
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }

  function getLum(hex) {
    return hexToRgb(hex).reduce((acc, c, i) => {
      const v = c / 255;
      const lin = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      return acc + lin * [0.2126, 0.7152, 0.0722][i];
    }, 0);
  }
