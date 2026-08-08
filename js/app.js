// ══ KELYQO - MAIN APPLICATION ══
// Entry point that orchestrates all modules

import * as StateManager from './js/stateManager.js';
import * as PaletteGenerator from './js/paletteGenerator.js';
import * as ColorMath from './js/colorMath.js';
import * as ContrastEngine from './js/contrastEngine.js';
import * as UIRenderer from './js/uiRenderer.js';
import * as Exporters from './js/exporters.js';
import * as UIColorExtractor from './js/uiColorExtractor.js';
import { generateInterpolationRamp } from './js/paletteInterpolation.js';
import { initCubeEvents, renderCubeView } from './js/canvas-cube.js';
import { openPreview, PREVIEW_CARDS } from './js/preview-templates.js';

// ══ STATE & APP ══

let currentTool = 'colors';
const activeFineTunes = new Set();
const fineTuneTimers = new Map();

const HARMONY_MODES = StateManager.HARMONY_MODES;

function syncLockedSlotsForCount(nextCount) {
  const state = StateManager.getState();
  const nextLockedSlots = [];
  const nextLockedColors = [];

  state.lockedSlots.forEach((slot, index) => {
    if (slot >= 0 && slot < nextCount) {
      nextLockedSlots.push(slot);
      nextLockedColors.push(state.lockedColors[index] || state.palette?.[slot] || state.base);
    }
  });

  StateManager.updateState({ lockedSlots: nextLockedSlots, lockedColors: nextLockedColors });
}

function regeneratePaletteFromState(historyLabel = 'Generated palette') {
  const state = StateManager.getState();
  const palette = PaletteGenerator.generatePalette(state.base, state.count, state.harmony, {
    lockedSlots: state.lockedSlots,
    lockedColors: state.lockedColors
  });
  StateManager.updateState({ palette });
  StateManager.recordPaletteVersion(historyLabel);
}

export function getAppState() {
  return StateManager.getState();
}

export function getCurrentTool() {
  return currentTool;
}

// ══ STATE MUTATIONS ══

export function setBase(hexColor) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) return;

  StateManager.saveStateToHistory();
  const state = StateManager.getState();
  StateManager.updateState({ base: hexColor });

  const nextState = StateManager.getState();
  syncLockedSlotsForCount(nextState.count);
  regeneratePaletteFromState();

  render();
}

export function setCount(count) {
  StateManager.saveStateToHistory();
  const state = StateManager.getState();
  StateManager.updateState({ count });

  syncLockedSlotsForCount(count);
  regeneratePaletteFromState();

  render();
}

export function setHarmony(harmonyMode) {
  StateManager.saveStateToHistory();
  const state = StateManager.getState();
  StateManager.updateState({ harmony: harmonyMode });

  regeneratePaletteFromState();

  render();
}

export function stepCount(delta) {
  const state = StateManager.getState();
  const newCount = Math.max(2, Math.min(12, state.count + delta));
  setCount(newCount);
}

export function randomizePalette() {
  StateManager.saveStateToHistory();
  const state = StateManager.getState();
  const randomConfig = PaletteGenerator.getRandomPalette();

  StateManager.updateState({
    base: randomConfig.base,
    harmony: randomConfig.harmony,
    // Preserve the designer's palette structure so every locked slot remains valid.
    count: state.count
  });

  syncLockedSlotsForCount(state.count);
  regeneratePaletteFromState();

  render();
}

export function undo() {
  if (StateManager.undo()) {
    const state = StateManager.getState();
    syncLockedSlotsForCount(state.count);
    regeneratePaletteFromState();
    render();
  }
}

export function redo() {
  if (StateManager.redo()) {
    const state = StateManager.getState();
    syncLockedSlotsForCount(state.count);
    regeneratePaletteFromState();
    render();
  }
}

export function onHexInput(hexValue) {
  if (/^#[0-9A-Fa-f]{6}$/.test(hexValue)) {
    setBase(hexValue);
  }
}

export function setContrastMode(mode) {
  StateManager.updateState({ contrastMode: mode });
  render();
}

export function togglePaletteLock(slotIndex, colorValue) {
  StateManager.saveStateToHistory();
  const state = StateManager.getState();
  const nextLockedSlots = [...state.lockedSlots];
  const nextLockedColors = [...state.lockedColors];
  const existingIndex = nextLockedSlots.indexOf(slotIndex);

  if (existingIndex >= 0) {
    nextLockedSlots.splice(existingIndex, 1);
    nextLockedColors.splice(existingIndex, 1);
  } else {
    nextLockedSlots.push(slotIndex);
    nextLockedColors.push(colorValue || state.palette[slotIndex] || state.base);
  }

  StateManager.updateState({ lockedSlots: nextLockedSlots, lockedColors: nextLockedColors });
  render();
}

export function setInterpolationStart(hexColor) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) return;
  StateManager.updateState({ interpolationStart: hexColor.toUpperCase() });
  render();
}

export function setInterpolationEnd(hexColor) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) return;
  StateManager.updateState({ interpolationEnd: hexColor.toUpperCase() });
  render();
}

export function stepInterpolationSteps(delta) {
  const state = StateManager.getState();
  const nextSteps = Math.max(2, Math.min(12, state.interpolationSteps + delta));
  StateManager.updateState({ interpolationSteps: nextSteps });
  render();
}

export function applyInterpolationPalette() {
  StateManager.saveStateToHistory();
  const state = StateManager.getState();
  const ramp = generateInterpolationRamp(state.interpolationStart, state.interpolationEnd, state.interpolationSteps);
  StateManager.updateState({
    base: state.interpolationStart,
    count: ramp.length,
    harmony: 'Custom',
    palette: ramp,
    lockedSlots: [],
    lockedColors: []
  });
  StateManager.recordPaletteVersion('Stepped gradient');
  render();
}

export function beginFineTune(slotIndex) {
  if (activeFineTunes.has(slotIndex)) return;
  StateManager.saveStateToHistory();
  activeFineTunes.add(slotIndex);
}

export function previewFineTune(slotIndex, hue, saturation, lightness) {
  beginFineTune(slotIndex);
  const nextColor = ColorMath.hslToHex(Number(hue), Number(saturation), Number(lightness));
  const state = StateManager.getState();
  const palette = [...state.palette];
  palette[slotIndex] = nextColor;
  const lockedColors = [...state.lockedColors];
  const lockedIndex = state.lockedSlots.indexOf(slotIndex);
  if (lockedIndex >= 0) lockedColors[lockedIndex] = nextColor;
  StateManager.updateState({ palette, lockedColors });

  const card = document.querySelector(`[data-palette-index="${slotIndex}"]`);
  if (card) {
    const [red, green, blue] = ColorMath.hexToRgb(nextColor);
    const swatch = card.querySelector('.cc-sw');
    if (swatch) swatch.style.cssText = UIRenderer.getSwatchStyle(nextColor);
    const hex = card.querySelector('.cc-hex');
    const rgb = card.querySelector('.cc-sub');
    if (hex) hex.textContent = nextColor.toUpperCase();
    if (rgb) rgb.textContent = `rgb(${red},${green},${blue})`;
    card.querySelectorAll('[data-tune-value]').forEach((output) => {
      const input = card.querySelector(`[data-channel="${output.dataset.tuneValue}"]`);
      if (input) output.textContent = input.value;
    });
  }
  const uiColors = UIColorExtractor.extractUIColorsFromPalette(palette);
  UIColorExtractor.applyUIColorsToDOM(uiColors);
  UIRenderer.renderPaletteBar();
  UIRenderer.renderRightPanel();
}

export function scheduleFineTuneCommit(slotIndex) {
  clearTimeout(fineTuneTimers.get(slotIndex));
  fineTuneTimers.set(slotIndex, setTimeout(() => commitFineTune(slotIndex), 450));
}

export function commitFineTune(slotIndex) {
  clearTimeout(fineTuneTimers.get(slotIndex));
  fineTuneTimers.delete(slotIndex);
  if (!activeFineTunes.delete(slotIndex)) return;
  StateManager.recordPaletteVersion(`Fine-tuned color ${slotIndex + 1}`);
  render();
}

export function copyInterpolationCSS() {
  const state = StateManager.getState();
  const css = UIRenderer.getInterpolationCSS(
    generateInterpolationRamp(state.interpolationStart, state.interpolationEnd, state.interpolationSteps)
  );
  copyText(css);
  UIRenderer.showToast('Ramp tokens copied');
}

export function setColorBlindMode(mode) {
  StateManager.updateState({ colorBlindMode: mode });
  render();
}

export function switchTool(toolName) {
  currentTool = toolName;
  document.querySelectorAll('.top-nav').forEach((el) => {
    el.classList.toggle('active', el.id === 'mi-' + toolName);
  });
  document.querySelectorAll('.ic-btn[data-tool]').forEach((el) => {
    el.classList.toggle('active', el.dataset.tool === toolName);
  });
  document.querySelectorAll('.view-panel').forEach((el) => {
    el.classList.remove('active');
  });

  const panel = document.getElementById('panel-' + toolName);
  if (panel) panel.classList.add('active');

  UIRenderer.renderContextBar(HARMONY_MODES, currentTool);
  if (toolName === 'wheel') renderWheel();
  if (toolName === 'cube') renderCubePanel();
}

// ══ RENDER ══

export function render() {
  // Extract and apply dynamic UI colors from palette
  const state = StateManager.getState();
  if (state.palette && state.palette.length > 0) {
    const uiColors = UIColorExtractor.extractUIColorsFromPalette(state.palette);
    UIColorExtractor.applyUIColorsToDOM(uiColors);
  }

  UIRenderer.renderPaletteBar();
  UIRenderer.renderRightPanel();
  UIRenderer.renderContextBar(HARMONY_MODES, currentTool);
  renderColorCards();
  renderWheelPanel();
  renderContrastPanel();
  UIRenderer.renderInterpolationRamp();
  renderCubePanel();
  renderPreviewPanel();
  UIRenderer.renderPaletteHistory();

  StateManager.persistStateToLocalStorage();
  StateManager.syncStateToURL();
}

export function renderColorCards() {
  UIRenderer.renderColorCards();
}

export function renderWheelPanel() {
  const state = StateManager.getState();
  document.getElementById('wheel-color-list').innerHTML = state.palette
    .map((color, index) => `
      <div class="wci" onclick="copyHex('${color}')">
        <div class="wci-sw" style="${UIRenderer.getSwatchStyle(color)}"></div>
        <div>
          <div class="wci-hex">${color.toUpperCase()}</div>
          <div class="wci-name">${ColorMath.nameColor(color)}</div>
        </div>
      </div>
    `)
    .join('');
}

export function renderWheel() {
  // Placeholder - would import from canvas-wheel.js
  console.log('Rendering wheel...');
}

export function renderContrastPanel() {
  UIRenderer.renderContrastGrid();
}

export function renderCubePanel() {
  const scene = document.getElementById('scene3d');
  const sphere = document.getElementById('cube3d');
  if (!scene || !sphere) return;
  renderCubeView(sphere, document.getElementById('cube-legend'), StateManager.getState().palette);
  initCubeEvents(scene);
}

export function renderPreviewPanel() {
  const grid = document.getElementById('prev-grid');
  if (!grid) return;
  grid.innerHTML = PREVIEW_CARDS.map((preview) => `
    <button class="preview-launch-card" onclick="openPalettePreview('${preview.type}')">
      <span class="preview-launch-card__emoji">${preview.emoji}</span>
      <span class="preview-launch-card__title">${preview.title}</span>
      <span class="preview-launch-card__desc">${preview.desc}</span>
      <span class="preview-launch-card__action">Open live preview →</span>
    </button>`).join('');
}

export function openPalettePreview(type) {
  openPreview(type, StateManager.getState().palette);
}

// ══ COPY / EXPORT ══

export function copyHex(hexColor) {
  navigator.clipboard.writeText(hexColor.toUpperCase());
  UIRenderer.showToast('Copied ' + hexColor.toUpperCase());
}

export function copyText(text) {
  navigator.clipboard.writeText(text);
}

export function copyAllGrads() {
  copyInterpolationCSS();
}

export function autoFixPaletteContrast() {
  const state = StateManager.getState();
  const contrastMode = state.contrastMode;
  const targetThreshold = contrastMode === 'apca' ? 60 : 4.5;

  const fixedPalette = state.palette.map((color) =>
    ContrastEngine.autoFixContrastForColor(color, '#ffffff', targetThreshold, contrastMode)
  );

  StateManager.updateState({ palette: fixedPalette });
  StateManager.recordPaletteVersion('WCAG auto-fixed');
  render();
  UIRenderer.showToast('Palette contrast auto-fixed');
}

export function autoFixContrastPair(foregroundIndex, foreground, background) {
  const state = StateManager.getState();
  if (state.contrastMode !== 'wcag') {
    UIRenderer.showToast('Switch to WCAG to apply AA fixes');
    return;
  }

  const fixedColor = ContrastEngine.autoFixWcagTextColor(foreground, background, 4.51);
  if (fixedColor.toLowerCase() === foreground.toLowerCase()) return;

  StateManager.saveStateToHistory();
  const palette = [...state.palette];
  palette[foregroundIndex] = fixedColor;
  const lockedColorIndex = state.lockedSlots.indexOf(foregroundIndex);
  const lockedColors = [...state.lockedColors];
  if (lockedColorIndex >= 0) lockedColors[lockedColorIndex] = fixedColor;

  StateManager.updateState({ palette, lockedColors });
  StateManager.recordPaletteVersion('WCAG pair fixed');
  render();
  UIRenderer.showToast(`Text fixed to ${ContrastEngine.wcagContrastRatio(fixedColor, background).toFixed(2)}:1`);
}

export function restorePaletteVersion(historyIndex) {
  StateManager.saveStateToHistory();
  if (!StateManager.restorePaletteVersion(historyIndex)) return;
  render();
  UIRenderer.showToast('Palette version restored');
}

// ══ INIT ══

export function initializeApp() {
  StateManager.initializeState();

  StateManager.saveStateToHistory();

  const state = StateManager.getState();
  syncLockedSlotsForCount(state.count);
  regeneratePaletteFromState();

  render();
  switchTool('colors');

  // Setup keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    if (event.target.tagName === 'INPUT') return;
    if (event.key === 'r' || event.key === 'R') randomizePalette();
    if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
      event.preventDefault();
      undo();
    }
    if ((event.metaKey || event.ctrlKey) && (event.key === 'y' || (event.shiftKey && event.key === 'Z'))) {
      event.preventDefault();
      redo();
    }
  });
}

// ══ EXPORT FUNCTIONS ══

export const exportCSS = Exporters.exportAsCSS;
export const exportHex = Exporters.exportAsHexList;
export const exportJSON = Exporters.exportAsJSON;
export const exportTailwind = Exporters.exportAsTailwindConfig;
export const exportSCSS = Exporters.exportAsSCSS;
export const exportShadcn = Exporters.exportAsShadcnHSL;
export const exportOKLCH = Exporters.exportAsOKLCH;
export const exportFigmaVariables = Exporters.exportAsFigmaVariablesJSON;

// ══ UI THEME EXPORT ══

/**
 * Exports the dynamically-selected UI theme colors as CSS
 * Shows what the system extracted from the generated palette
 */
export function exportUIThemeColors() {
  const state = StateManager.getState();
  if (!state.palette || state.palette.length === 0) {
    UIRenderer.showToast('Generate a palette first');
    return;
  }

  const uiColors = UIColorExtractor.extractUIColorsFromPalette(state.palette);
  const css = UIColorExtractor.formatUIColorsAsCSS(uiColors);
  
  // Copy to clipboard
  navigator.clipboard.writeText(css).then(() => {
    UIRenderer.showToast('UI theme colors exported');
  }).catch(() => {
    console.log('UI Theme Colors:\n' + css);
    UIRenderer.showToast('Check console for UI theme colors');
  });
}

/**
 * Logs UI color analysis for debugging
 * Shows saturation, lightness, and contrast values
 */
export function debugUIColors() {
  const state = StateManager.getState();
  if (!state.palette || state.palette.length === 0) {
    console.log('Generate a palette first');
    return;
  }

  const uiColors = UIColorExtractor.extractUIColorsFromPalette(state.palette);
  const contrasts = UIColorExtractor.getUIColorContrasts(uiColors);
  
  console.log('=== UI COLOR ANALYSIS ===');
  console.log('Extracted Colors:', uiColors);
  console.log('Contrast Ratios:', contrasts);
  console.log('CSS Variables:');
  console.log(UIColorExtractor.formatUIColorsAsCSS(uiColors));
}

function exposeGlobalFunctions() {
  const globalScope = typeof window !== 'undefined' ? window : globalThis;

  globalScope.undo = undo;
  globalScope.redo = redo;
  globalScope.randomize = randomizePalette;
  globalScope.randomizePalette = randomizePalette;
  globalScope.setBase = setBase;
  globalScope.setCount = setCount;
  globalScope.setHarmony = setHarmony;
  globalScope.stepCount = stepCount;
  globalScope.onHexInput = onHexInput;
  globalScope.setContrastMode = setContrastMode;
  globalScope.setColorBlindMode = setColorBlindMode;
  globalScope.togglePaletteLock = togglePaletteLock;
  globalScope.beginFineTune = beginFineTune;
  globalScope.previewFineTune = previewFineTune;
  globalScope.scheduleFineTuneCommit = scheduleFineTuneCommit;
  globalScope.setInterpolationStart = setInterpolationStart;
  globalScope.setInterpolationEnd = setInterpolationEnd;
  globalScope.stepInterpolationSteps = stepInterpolationSteps;
  globalScope.applyInterpolationPalette = applyInterpolationPalette;
  globalScope.copyInterpolationCSS = copyInterpolationCSS;
  globalScope.switchTool = switchTool;
  globalScope.render = render;
  globalScope.copyHex = copyHex;
  globalScope.copyText = copyText;
  globalScope.copyAllGrads = copyAllGrads;
  globalScope.autoFixPaletteContrast = autoFixPaletteContrast;
  globalScope.autoFixContrastPair = autoFixContrastPair;
  globalScope.restorePaletteVersion = restorePaletteVersion;
  globalScope.exportCSS = exportCSS;
  globalScope.exportHex = exportHex;
  globalScope.exportJSON = exportJSON;
  globalScope.exportTailwind = exportTailwind;
  globalScope.exportSCSS = exportSCSS;
  globalScope.exportShadcn = exportShadcn;
  globalScope.exportOKLCH = exportOKLCH;
  globalScope.exportFigmaVariables = exportFigmaVariables;
  globalScope.exportUIThemeColors = exportUIThemeColors;
  globalScope.debugUIColors = debugUIColors;
  globalScope.openPalettePreview = openPalettePreview;
  globalScope.openMob = function () {};
  globalScope.closeMob = function () {};
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    exposeGlobalFunctions();
    initializeApp();
  });
} else {
  exposeGlobalFunctions();
  initializeApp();
}
