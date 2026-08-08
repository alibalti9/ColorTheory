// ══ UI RENDERING ══
// All DOM rendering and UI update functions

import { getState } from './stateManager.js';
import { hexToHsl, nameColor, getTextColorForBackground } from './colorMath.js';
import { getContrastValue, getContrastGrade, countAccessibleColors } from './contrastEngine.js';
import { formatRampAsCss, generateInterpolationRamp } from './paletteInterpolation.js';
import { getColorTemperature, getSemanticRoleSuggestions } from './palette-utils.js';

export function getSwatchStyle(hexColor) {
  return `background:${hexColor};`;
}

export function renderPaletteBar() {
  const state = getState();
  const palbarElement = document.getElementById('palbar');
  if (!palbarElement) return;

  palbarElement.innerHTML = state.palette
    .map((color) => `
      <div class="pb-sw" style="${getSwatchStyle(color)}" onclick="copyHex('${color}')">
        <span class="pb-sw-hex">${color.toUpperCase()}</span>
      </div>
    `)
    .join('');
}

export function renderRightPanel() {
  const state = getState();
  const dotsElement = document.getElementById('rp-dots');
  if (!dotsElement) return;

  dotsElement.innerHTML = state.palette
    .map((color) => `
      <div class="rp-dot" style="${getSwatchStyle(color)}" onclick="copyHex('${color}')" title="${color.toUpperCase()}"></div>
    `)
    .join('');

  const harmonyElement = document.getElementById('rp-harmony');
  if (harmonyElement) harmonyElement.textContent = state.harmony;

  const countElement = document.getElementById('rp-count');
  if (countElement) countElement.textContent = state.count;

  const baseElement = document.getElementById('rp-base');
  if (baseElement) baseElement.textContent = state.base.toUpperCase();
}

export function renderContextBar(harmonyModes, currentTool) {
  const state = getState();
  const contextBar = document.getElementById('ctxbar');
  if (!contextBar) return;

  let html = `<span class="ctx-lbl">${currentTool.toUpperCase()}</span>`;
  html += `<input type="color" class="ctx-cpick" value="${state.base}" oninput="setBase(this.value)">`;
  html += `<input type="text" class="ctx-hex" value="${state.base.toUpperCase()}" oninput="onHexInput(this.value)" maxlength="7" placeholder="#RRGGBB">`;
  html += `<div class="ctx-sep"></div>`;
  html += `<span class="ctx-lsm">Colors:</span>`;
  html += `<div class="ctx-stepper"><button onclick="stepCount(-1)">−</button><span>${state.count}</span><button onclick="stepCount(1)">+</button></div>`;
  if (currentTool === 'gradients') {
    html += `<div class="ctx-sep"></div>`;
    html += `<span class="ctx-lsm">Color A</span>`;
    html += `<input type="color" class="ctx-cpick" value="${state.interpolationStart}" onchange="setInterpolationStart(this.value)">`;
    html += `<span class="ctx-lsm">Color B</span>`;
    html += `<input type="color" class="ctx-cpick" value="${state.interpolationEnd}" onchange="setInterpolationEnd(this.value)">`;
    html += `<span class="ctx-lsm">Steps</span>`;
    html += `<div class="ctx-stepper"><button onclick="stepInterpolationSteps(-1)">−</button><span>${state.interpolationSteps}</span><button onclick="stepInterpolationSteps(1)">+</button></div>`;
    html += `<button class="ctx-btn" onclick="copyInterpolationCSS()">Copy tokens</button>`;
    html += `<button class="ctx-btn active" onclick="applyInterpolationPalette()">Use ramp</button>`;
  }
  harmonyModes.forEach((mode) => {
    const isActive = state.harmony === mode ? ' active' : '';
    html += `<button class="ctx-btn${isActive}" onclick="setHarmony('${mode}')">${mode}</button>`;
  });

  if (currentTool === 'gradients') {
    html += `<button class="ctx-btn" onclick="copyAllGrads()">Copy All CSS</button>`;
  }

  if (currentTool === 'contrast') {
    const passingCount = countAccessibleColors(state.palette, state.contrastMode);
    const passColor = passingCount > 0 ? '#9a8dff' : '#ff6060';
    html += `<div class="ctx-sep"></div>`;
    html += `<span class="ctx-lsm">AA Pass: <b style="color:${passColor}">${passingCount}/${state.palette.length}</b></span>`;
    html += `<button class="ctx-btn" onclick="autoFixPaletteContrast()">Auto-Fix</button>`;
    html += `<button class="ctx-btn${state.contrastMode === 'wcag' ? ' active' : ''}" onclick="setContrastMode('wcag')">WCAG</button>`;
    html += `<button class="ctx-btn${state.contrastMode === 'apca' ? ' active' : ''}" onclick="setContrastMode('apca')">APCA</button>`;
  }

  contextBar.innerHTML = html;
}

export function renderPaletteHistory() {
  const historyElement = document.getElementById('palette-history-list');
  if (!historyElement) return;
  const history = getState().paletteHistory || [];
  historyElement.innerHTML = history.length ? history.map((version, index) => `
    <button class="palette-history-item" onclick="restorePaletteVersion(${index})" title="Restore ${version.label}">
      <span class="palette-history-item__swatches">${version.palette.map((color) => `<i style="background:${color}"></i>`).join('')}</span>
      <span class="palette-history-item__meta"><b>${version.label}</b><small>${version.harmony} · ${version.palette.length} colors</small></span>
    </button>`).join('') : '<p class="palette-history-empty">Generated palettes appear here.</p>';
}

export function getInterpolationCSS(rampColors) {
  return `:root {\n${formatRampAsCss(rampColors, '--ramp')}\n}`;
}

export function renderInterpolationRamp() {
  const state = getState();
  const rampGrid = document.getElementById('grad-grid');
  if (!rampGrid) return;

  const rampColors = generateInterpolationRamp(
    state.interpolationStart,
    state.interpolationEnd,
    state.interpolationSteps
  );
  const stops = rampColors.map((color, index) => `${color} ${(index / (rampColors.length - 1)) * 100}%`).join(', ');

  rampGrid.innerHTML = `
    <section class="ramp-tool" aria-label="Stepped gradient">
      <div class="ramp-tool__heading">
        <div><span class="ramp-tool__eyebrow">Stepped gradient</span><h2>${rampColors.length} production-ready tokens</h2></div>
        <button class="ctx-btn" onclick="copyInterpolationCSS()">Copy CSS tokens</button>
      </div>
      <div class="ramp-preview" style="background:linear-gradient(90deg, ${stops})"></div>
      <div class="ramp-stops">
        ${rampColors.map((color, index) => `
          <button class="ramp-stop" onclick="copyHex('${color}')" title="Copy ${color.toUpperCase()}">
            <span class="ramp-stop__swatch" style="background:${color}"></span>
            <span class="ramp-stop__name">--ramp-${index + 1}</span>
            <span class="ramp-stop__hex">${color.toUpperCase()}</span>
          </button>`).join('')}
      </div>
      <p class="ramp-tool__hint">The end colors are included; each interior token is mathematically evenly spaced between Color A and Color B.</p>
    </section>`;
}

export function renderColorCards() {
  const state = getState();
  const cardsGrid = document.getElementById('cards-grid');
  if (!cardsGrid) return;

  cardsGrid.innerHTML = state.palette.map(() => `<div class="shimmer-card" style="height:160px"></div>`).join('');
  const roleSuggestions = getSemanticRoleSuggestions(state.palette);

  setTimeout(() => {
    cardsGrid.innerHTML = state.palette
      .map((color, index) => {
        const isLocked = state.lockedSlots.includes(index);
        const [red, green, blue] = Array.from(color.slice(1, 7)).reduce((acc, pair, i) => {
          acc[i] = parseInt(color.slice(1 + i * 2, 3 + i * 2), 16);
          return acc;
        }, []);
        const textColor = getTextColorForBackground(color);
        const colorName = nameColor(color);
        const roles = roleSuggestions[index] || [];
        const temperature = getColorTemperature(color);
        const [hue, saturation, lightness] = hexToHsl(color).map((value) => Math.round(value));

        return `
          <div class="color-card" data-palette-index="${index}" onclick="copyHex('${color}')">
            <button class="cc-lock${isLocked ? ' active' : ''}" onclick="togglePaletteLock(${index}, '${color}'); event.stopPropagation();" aria-label="Toggle lock for ${color}">${isLocked ? '🔒' : '🔓'}</button>
            <div class="cc-sw" style="${getSwatchStyle(color)}">
              <div class="cc-badge" style="color:${textColor}">${index === 0 ? 'BASE' : '#' + (index + 1)}</div>
            </div>
            <div class="cc-body">
              <div class="cc-hex">${color.toUpperCase()}</div>
              <div class="cc-sub">rgb(${red},${green},${blue})</div>
              <div class="cc-tags">
                <span class="cc-tag">${colorName}</span>
                <span class="cc-temperature cc-temperature--${temperature.key}" title="${temperature.label} color"><i></i>${temperature.label}</span>
                ${roles.map((role) => `<span class="cc-tag cc-tag--role">${role}</span>`).join('')}
              </div>
              <div class="cc-tune" onclick="event.stopPropagation()" aria-label="Fine tune ${color}">
                <div class="cc-tune__heading"><span>Fine tune</span><span>HSL</span></div>
                ${[
                  ['h', 'Hue', hue, 0, 360],
                  ['s', 'Saturation', saturation, 0, 100],
                  ['l', 'Lightness', lightness, 0, 100]
                ].map(([channel, label, value, min, max]) => `<label class="cc-slider"><span>${label}</span><input data-channel="${channel}" type="range" min="${min}" max="${max}" value="${value}" onfocus="beginFineTune(${index})" onpointerdown="beginFineTune(${index})" oninput="previewFineTune(${index}, this.closest('.cc-tune').querySelector('[data-channel=h]').value, this.closest('.cc-tune').querySelector('[data-channel=s]').value, this.closest('.cc-tune').querySelector('[data-channel=l]').value); scheduleFineTuneCommit(${index})"><output data-tune-value="${channel}">${value}</output></label>`).join('')}
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }, 140);
}

export function renderContrastGrid() {
  const state = getState();
  const contrastGrid = document.getElementById('contrast-grid');
  if (!contrastGrid) return;

  const backgrounds = ['#fff', '#000', '#111', '#f5f5f5', '#1a1a2e'];
  const pairs = [];

  state.palette.forEach((color, foregroundIndex) => {
    backgrounds.forEach((bg) => {
      pairs.push([color, bg, foregroundIndex]);
    });
  });

  for (let i = 0; i < state.palette.length; i++) {
    for (let j = i + 1; j < state.palette.length; j++) {
      pairs.push([state.palette[i], state.palette[j], i]);
    }
  }

  contrastGrid.innerHTML = pairs
    .slice(0, 32)
    .map(([foreground, background, foregroundIndex]) => {
      const contrastVal = getContrastValue(foreground, background, state.contrastMode);
      const gradeInfo = getContrastGrade(foreground, background, state.contrastMode);
      const valueLabel = state.contrastMode === 'apca' ? `${contrastVal.toFixed(1)} Lc` : `${contrastVal.toFixed(2)}:1`;
      const canFix = state.contrastMode === 'wcag' && contrastVal < 4.5;

      return `
        <div class="cont-card">
          <div class="cont-component-preview" style="background:${background};color:${foreground};">
            <button class="cont-preview-button" type="button">Save changes</button>
            <div class="cont-preview-input"><span>✦</span><span>Search projects</span></div>
            <span class="cont-preview-badge">Active</span>
          </div>
          <div class="cont-card__meta"><div><div class="cont-ratio">${valueLabel}</div><span class="cont-grade ${gradeInfo.className}">${gradeInfo.level}</span></div>
          ${canFix ? `<button class="cont-fix" onclick="autoFixContrastPair(${foregroundIndex}, '${foreground}', '${background}')">Fix to 4.51</button>` : ''}</div>
        </div>
      `;
    })
    .join('');
}

export function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toast._timeoutId);
  toast._timeoutId = setTimeout(() => {
    toast.classList.remove('show');
  }, 1800);
}
