const STORAGE_KEY = 'chromastudio-state';

export function saveState(state) {
  try {
    const payload = {
      base: state.base,
      count: state.count,
      harmony: state.harmony,
      colorSpace: state.colorSpace,
      contrastMode: state.contrastMode,
      lockedSlots: state.lockedSlots,
      lockedColors: state.lockedColors,
      currentTool: state.currentTool,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    syncUrl(state);
  } catch {
    /* private browsing / quota */
  }
}

export function loadState(defaults) {
  let merged = { ...defaults };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      merged = { ...merged, ...JSON.parse(stored) };
    }
  } catch {
    /* ignore */
  }
  return { ...merged, ...parseUrl() };
}

export function syncUrl(state) {
  const params = new URLSearchParams();
  params.set('base', state.base.replace('#', ''));
  params.set('harmony', state.harmony);
  params.set('count', String(state.count));
  if (state.colorSpace && state.colorSpace !== 'hsl') {
    params.set('space', state.colorSpace);
  }
  if (state.contrastMode === 'apca') params.set('contrast', 'apca');
  const hash = params.toString();
  const next = `${window.location.pathname}${hash ? `?${hash}` : ''}`;
  if (window.location.href.split('?')[0] + (window.location.search || '') !== next) {
    history.replaceState(null, '', next);
  }
}

export function parseUrl() {
  const params = new URLSearchParams(window.location.search);
  const parsed = {};
  const base = params.get('base');
  if (base && /^[0-9A-Fa-f]{6}$/.test(base)) parsed.base = `#${base}`;
  if (params.get('harmony')) parsed.harmony = params.get('harmony');
  const count = parseInt(params.get('count'), 10);
  if (count >= 2 && count <= 12) parsed.count = count;
  if (params.get('space') === 'oklch') parsed.colorSpace = 'oklch';
  if (params.get('contrast') === 'apca') parsed.contrastMode = 'apca';
  return parsed;
}

export function getShareUrl(state) {
  syncUrl(state);
  return window.location.href;
}
