// ══ STATE MANAGEMENT ══
// Manages application state, history, localStorage, and URL sync

export const HARMONY_MODES = [
  'Monochromatic', 'Complementary', 'Analogous', 'Triadic',
  'Split-Comp', 'Tetradic', 'Square', 'Custom'
];

export const initialState = {
  base: '#AA3939',
  count: 5,
  harmony: 'Complementary',
  palette: [],
  contrastMode: 'wcag',
  colorBlindMode: 'none',
  lockedSlots: [],
  lockedColors: [],
  interpolationStart: '#FF6B6B',
  interpolationEnd: '#4ECDC4',
  interpolationSteps: 5,
  paletteHistory: []
};

let currentState = { ...initialState };
let stateHistory = [];
let historyIndex = -1;

export function getState() {
  return currentState;
}

export function updateState(updates) {
  currentState = { ...currentState, ...updates };
}

export function getPaletteHistory() {
  return currentState.paletteHistory || [];
}

export function recordPaletteVersion(label = 'Generated palette') {
  if (!currentState.palette?.length) return;
  const version = {
    label,
    palette: [...currentState.palette],
    base: currentState.base,
    count: currentState.count,
    harmony: currentState.harmony,
    lockedSlots: [...currentState.lockedSlots],
    lockedColors: [...currentState.lockedColors],
    createdAt: Date.now()
  };
  const existing = getPaletteHistory();
  if (existing[0] && existing[0].palette.join(',') === version.palette.join(',')) return;
  updateState({ paletteHistory: [version, ...existing].slice(0, 20) });
}

export function restorePaletteVersion(historyIndex) {
  const version = getPaletteHistory()[historyIndex];
  if (!version) return false;
  updateState({
    base: version.base,
    count: version.count,
    harmony: version.harmony,
    palette: [...version.palette],
    lockedSlots: [...version.lockedSlots],
    lockedColors: [...version.lockedColors]
  });
  return true;
}

export function saveStateToHistory() {
  const snapshot = {
    base: currentState.base,
    count: currentState.count,
    harmony: currentState.harmony,
    lockedSlots: [...currentState.lockedSlots],
    lockedColors: [...currentState.lockedColors],
    interpolationStart: currentState.interpolationStart,
    interpolationEnd: currentState.interpolationEnd,
    interpolationSteps: currentState.interpolationSteps,
    paletteHistory: currentState.paletteHistory
  };
  stateHistory = stateHistory.slice(0, historyIndex + 1);
  stateHistory.push(snapshot);
  historyIndex = stateHistory.length - 1;
}

export function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    const snapshot = stateHistory[historyIndex];
    updateState(snapshot);
    return true;
  }
  return false;
}

export function redo() {
  if (historyIndex < stateHistory.length - 1) {
    historyIndex++;
    const snapshot = stateHistory[historyIndex];
    updateState(snapshot);
    return true;
  }
  return false;
}

// ══ STORAGE ══

export function persistStateToLocalStorage() {
  const cacheData = {
    base: currentState.base,
    count: currentState.count,
    harmony: currentState.harmony,
    contrastMode: currentState.contrastMode,
    colorBlindMode: currentState.colorBlindMode,
    lockedSlots: currentState.lockedSlots,
    lockedColors: currentState.lockedColors,
    interpolationStart: currentState.interpolationStart,
    interpolationEnd: currentState.interpolationEnd,
    interpolationSteps: currentState.interpolationSteps
  };
  localStorage.setItem('kelyqo_state', JSON.stringify(cacheData));
}

export function loadStateFromLocalStorage() {
  try {
    const cached = localStorage.getItem('kelyqo_state');
    if (cached) {
      const cachedState = JSON.parse(cached);
      currentState.base = cachedState.base || currentState.base;
      currentState.count = cachedState.count || currentState.count;
      currentState.harmony = cachedState.harmony || currentState.harmony;
      currentState.contrastMode = cachedState.contrastMode || currentState.contrastMode;
      currentState.colorBlindMode = cachedState.colorBlindMode || currentState.colorBlindMode;
      currentState.lockedSlots = cachedState.lockedSlots || currentState.lockedSlots;
      currentState.lockedColors = cachedState.lockedColors || currentState.lockedColors;
      currentState.interpolationStart = cachedState.interpolationStart || currentState.interpolationStart;
      currentState.interpolationEnd = cachedState.interpolationEnd || currentState.interpolationEnd;
      currentState.interpolationSteps = cachedState.interpolationSteps || currentState.interpolationSteps;
      currentState.paletteHistory = Array.isArray(cachedState.paletteHistory)
        ? cachedState.paletteHistory.slice(0, 20)
        : currentState.paletteHistory;
    }
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
  }
}

// ══ URL SYNC ══

export function syncStateToURL() {
  const params = new URLSearchParams();
  params.set('base', currentState.base.substring(1));
  params.set('harmony', currentState.harmony);
  params.set('count', currentState.count);

  if (currentState.contrastMode !== 'wcag') {
    params.set('contrast', currentState.contrastMode);
  }
  if (currentState.colorBlindMode !== 'none') {
    params.set('vision', currentState.colorBlindMode);
  }

  window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
}

export function loadStateFromURL() {
  const params = new URLSearchParams(window.location.search);

  const baseParam = params.get('base');
  if (baseParam && /^[0-9A-Fa-f]{6}$/.test(baseParam)) {
    currentState.base = '#' + baseParam.toUpperCase();
  }

  const harmonyParam = params.get('harmony');
  if (harmonyParam && HARMONY_MODES.includes(harmonyParam)) {
    currentState.harmony = harmonyParam;
  }

  const countParam = params.get('count');
  if (countParam) {
    const parsedCount = parseInt(countParam);
    if (parsedCount >= 2 && parsedCount <= 12) {
      currentState.count = parsedCount;
    }
  }

  const contrastParam = params.get('contrast');
  if (contrastParam && ['wcag', 'apca'].includes(contrastParam)) {
    currentState.contrastMode = contrastParam;
  }

  const visionParam = params.get('vision');
  if (visionParam && ['none', 'protanopia', 'deuteranopia', 'tritanopia'].includes(visionParam)) {
    currentState.colorBlindMode = visionParam;
  }
}

// ══ INITIALIZATION ══

export function initializeState() {
  // Try URL first (takes priority)
  if (window.location.search) {
    loadStateFromURL();
  } else {
    // Fall back to localStorage if no URL params
    loadStateFromLocalStorage();
  }
}
