// ══ STATE ══
    const HARMONIES = ['Monochromatic', 'Complementary', 'Analogous', 'Triadic', 'Split-Comp', 'Tetradic', 'Square', 'Custom'];
    let state = { base: '#AA3939', count: 5, harmony: 'Complementary', palette: [], contrastMode: 'wcag', colorBlindMode: 'none' };
    let hist = [], histIdx = -1, currentTool = 'colors';
    const ONBOARDING_STORAGE_KEY = 'chromaStudio_onboarded_v1';
    const ONBOARDING_TOTAL_STEPS = 5;
    let onboardingStep = 1;

    // ══ COLOR MATH ══
    function hexToHsl(hex) {
      let r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h, s, l = (mx + mn) / 2;
      if (mx === mn) { h = s = 0; } else { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); switch (mx) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; }h /= 6; }
      return [h * 360, s * 100, l * 100];
    }
    function hslToHex(h, s, l) {
      h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)); l = Math.max(0, Math.min(100, l));
      s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
      const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      const toH = x => Math.round(x * 255).toString(16).padStart(2, '0');
      return '#' + toH(f(0)) + toH(f(8)) + toH(f(4));
    }
    function hexToRgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }
    function getLum(hex) { const r = hexToRgb(hex).map(c => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4) }); return .2126 * r[0] + .7152 * r[1] + .0722 * r[2]; }
    function cRatio(a, b) { const l1 = getLum(a), l2 = getLum(b); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); }
    function textOn(hex) { return getLum(hex) > .28 ? '#111' : '#eee'; }
    function nameColor(hex) {
      const [h, s, l] = hexToHsl(hex);
      if (s < 6) return l < 20 ? 'Obsidian' : l < 40 ? 'Charcoal' : l < 60 ? 'Slate' : l < 80 ? 'Silver' : 'White';
      const n = ['Red', 'Orange', 'Amber', 'Gold', 'Lime', 'Green', 'Teal', 'Cyan', 'Sky', 'Blue', 'Indigo', 'Violet', 'Magenta'];
      return (l < 30 ? 'Deep ' : l < 45 ? 'Dark ' : l < 65 ? '' : l < 80 ? 'Light ' : 'Pale ') + (s < 25 ? 'Muted ' : '') + n[Math.round(h / 30) % 12];
    }

    function apcaContrast(textHex, backgroundHex) {
      const textY = getLum(textHex);
      const bgY = getLum(backgroundHex);
      const blackThreshold = 0.022;
      const scaleBoW = 1.14;
      const scaleWoB = 1.14;
      const loClip = 0.1;
      const deltaYmin = 0.0005;

      if (Math.abs(bgY - textY) < deltaYmin) return 0;
      if (bgY >= textY) {
        const yText = Math.max(textY, blackThreshold);
        const yBg = Math.max(bgY, loClip);
        return Math.round(((Math.pow(yBg, 0.56) - Math.pow(yText, 0.57)) * scaleBoW * 100) * 10) / 10;
      }
      const yText = Math.max(textY, loClip);
      const yBg = Math.max(bgY, blackThreshold);
      return Math.round(((Math.pow(yBg, 0.65) - Math.pow(yText, 0.62)) * scaleWoB * 100) * 10) / 10;
    }

    function contrastValue(a, b, mode = state.contrastMode) {
      return mode === 'apca' ? apcaContrast(a, b) : cRatio(a, b);
    }

    function contrastGrade(a, b, mode = state.contrastMode) {
      const value = contrastValue(a, b, mode);
      return mode === 'apca'
        ? (Math.abs(value) >= 75 ? ['AAA', 'g-aaa'] : Math.abs(value) >= 60 ? ['AA', 'g-aa'] : Math.abs(value) >= 45 ? ['AA Lg', 'g-aal'] : ['Fail', 'g-fail'])
        : (value >= 7 ? ['AAA', 'g-aaa'] : value >= 4.5 ? ['AA', 'g-aa'] : value >= 3 ? ['AA Lg', 'g-aal'] : ['Fail', 'g-fail']);
    }

    function countPassingColors(palette, mode = state.contrastMode) {
      return palette.filter(c => {
        const whitePass = mode === 'apca' ? Math.abs(apcaContrast(c, '#fff')) >= 60 : cRatio(c, '#fff') >= 4.5;
        const blackPass = mode === 'apca' ? Math.abs(apcaContrast(c, '#000')) >= 60 : cRatio(c, '#000') >= 4.5;
        return whitePass || blackPass;
      }).length;
    }

    function setContrastMode(mode) {
      state.contrastMode = mode;
      renderCtxBar();
      renderContrast();
    }

    function setColorBlindMode(mode) {
      state.colorBlindMode = mode;
      render();
    }

    function getColorBlindFilter() {
      if (!state.colorBlindMode || state.colorBlindMode === 'none') return '';
      return `url(#filter-${state.colorBlindMode})`;
    }

    function swatchStyle(hex) {
      const filter = getColorBlindFilter();
      return `${filter ? `filter:${filter};-webkit-filter:${filter};` : ''}background:${hex};`;
    }

    function hexToOklch(hex) {
      const [r, g, b] = hexToRgb(hex);
      const srgbToLinear = (c) => { c = c / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
      const l = 0.2104542553 * lr + 0.793617785 * lg - 0.0040720468 * lb;
      const a = 1.9779984951 * lr - 2.428592205 * lg + 0.4505937099 * lb;
      const b_val = 0.0259040371 * lr + 0.7827717662 * lg - 0.808675766 * lb;
      const l_root = Math.cbrt(l), a_root = Math.cbrt(a), b_root = Math.cbrt(b_val);
      const L = 0.2104542553 * l_root + 0.793617785 * a_root - 0.0040720468 * b_root;
      const chroma = Math.sqrt(a * a + b_val * b_val);
      let hue = Math.atan2(b_val, a) * 180 / Math.PI;
      if (hue < 0) hue += 360;
      return [L, chroma, hue];
    }

    function autoFixContrastColor(color, mode = state.contrastMode) {
      const [h, s, l] = hexToHsl(color);
      const backgrounds = ['#ffffff', '#000000'];
      const target = mode === 'apca' ? 60 : 4.5;
      let bestColor = color;

      backgrounds.forEach(background => {
        let currentColor = color;
        let currentLightness = l;
        for (let attempt = 0; attempt < 100; attempt++) {
          const value = mode === 'apca' ? Math.abs(apcaContrast(currentColor, background)) : cRatio(currentColor, background);
          if (value >= target) {
            currentColor = currentColor;
            bestColor = currentColor;
            return;
          }
          currentLightness = background === '#ffffff' ? Math.max(0, currentLightness - 1) : Math.min(100, currentLightness + 1);
          currentColor = hslToHex(h, s, currentLightness);
        }
      });

      return bestColor;
    }

    function autoFixPaletteContrast() {
      state.palette = state.palette.map(color => autoFixContrastColor(color, state.contrastMode));
      render();
      showToast('Palette contrast auto-fixed');
    }

    // ══ GENERATE PALETTE ══
    function generate(base, count, mode) {
      const [h, s, l] = hexToHsl(base); let c = [];
      const lr = (i, n, mn, mx) => Math.max(mn, Math.min(mx, mn + (mx - mn) * (i / (n - 1 || 1))));
      switch (mode) {
        case 'Monochromatic': for (let i = 0; i < count; i++)c.push(hslToHex(h, Math.max(6, s - i * 4), lr(i, count, 8, 90))); break;
        case 'Complementary': { const h2 = [h, h + 180]; for (let i = 0; i < count; i++)c.push(hslToHex(h2[i % 2], Math.max(18, s - i * 5), lr(i, count, 18, 82))); break; }
        case 'Analogous': for (let i = 0; i < count; i++)c.push(hslToHex(h - 40 + (80 / (count - 1 || 1)) * i, s * .92, lr(i, count, 22, 80))); break;
        case 'Triadic': { const b = [h, h + 120, h + 240]; for (let i = 0; i < count; i++)c.push(hslToHex(b[i % 3], s * .92, lr(i, count, 24, 80))); break; }
        case 'Split-Comp': { const b = [h, h + 150, h + 210]; for (let i = 0; i < count; i++)c.push(hslToHex(b[i % 3], s * .9, lr(i, count, 24, 80))); break; }
        case 'Tetradic': { const b = [h, h + 90, h + 180, h + 270]; for (let i = 0; i < count; i++)c.push(hslToHex(b[i % 4], s * .9, lr(i, count, 24, 80))); break; }
        case 'Square': { const b = [h, h + 90, h + 180, h + 270]; for (let i = 0; i < count; i++)c.push(hslToHex(b[i % 4], s * .88, lr(i, count, 22, 82))); break; }
        default: c = [base]; for (let i = 1; i < count; i++)c.push(hslToHex(Math.random() * 360, 42 + Math.random() * 44, 28 + Math.random() * 48));
      }
      return c.slice(0, count);
    }

    function applyState(s) { state = { ...s }; state.palette = generate(s.base, s.count, s.harmony); render(); }
    function pushHist() { const snap = { base: state.base, count: state.count, harmony: state.harmony }; hist = hist.slice(0, histIdx + 1); hist.push(snap); histIdx = hist.length - 1; }
    function undo() { if (histIdx > 0) { histIdx--; applyState(hist[histIdx]); } }
    function redo() { if (histIdx < hist.length - 1) { histIdx++; applyState(hist[histIdx]); } }
    function setBase(hex) { if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return; pushHist(); state.base = hex; state.palette = generate(state.base, state.count, state.harmony); render(); }
    function setCount(n) { pushHist(); state.count = n; state.palette = generate(state.base, state.count, state.harmony); render(); }
    function setHarmony(h) { pushHist(); state.harmony = h; state.palette = generate(state.base, state.count, state.harmony); render(); }
    function stepCount(d) { setCount(Math.max(2, Math.min(12, state.count + d))); }
    function randomize() {
      pushHist();
      const h = Math.random() * 360, s = 45 + Math.random() * 45, l = 30 + Math.random() * 35;
      state.base = hslToHex(h, s, l);
      state.harmony = HARMONIES[Math.floor(Math.random() * 7)];
      state.count = [3, 4, 5, 6][Math.floor(Math.random() * 4)];
      state.palette = generate(state.base, state.count, state.harmony); render();
    }
    function onHexInput(v) { if (/^#[0-9A-Fa-f]{6}$/.test(v)) setBase(v); }

    // ══ ONBOARDING ══
    function isOnboardingOpen() {
      return document.getElementById('onboarding-overlay')?.classList.contains('show');
    }

    function hasCompletedOnboarding() {
      return localStorage.getItem(ONBOARDING_STORAGE_KEY) === '1';
    }

    function getOnboardingStepMarkup(step) {
      if (step === 1) {
        return `
          <div class="ob-step-icon">🎨</div>
          <div class="ob-kicker">Step 1 of ${ONBOARDING_TOTAL_STEPS}</div>
          <h2 class="ob-title" id="ob-title">Build a palette in a few clicks</h2>
          <p class="ob-copy">ChromaStudio starts from one base color, generates a matching palette, and lets you preview or export the result without leaving the page.</p>
          <div class="ob-card-list">
            <div class="ob-card-item"><i>🖍️</i><div><strong>Pick a starting color</strong><span>Use the base swatch or type a hex code to define the palette direction.</span></div></div>
            <div class="ob-card-item"><i>🔮</i><div><strong>Choose a harmony</strong><span>Switch between calm, bold, or playful color relationships from the context bar.</span></div></div>
            <div class="ob-card-item"><i>🧪</i><div><strong>Check before shipping</strong><span>Preview the palette on sample UIs and verify readability in the contrast view.</span></div></div>
          </div>
          <div class="ob-note"><strong>Tip:</strong> You can reopen this guide anytime from the <strong>Guide</strong> button in the top bar.</div>
        `;
      }

      if (step === 2) {
        return `
          <div class="ob-step-icon">🖍️</div>
          <div class="ob-kicker">Step 2 of ${ONBOARDING_TOTAL_STEPS}</div>
          <h2 class="ob-title" id="ob-title">Start with one color</h2>
          <p class="ob-copy">Your base color drives the whole palette. Change it from the context bar, paste a hex code, or randomize until you find a direction you like.</p>
          <div class="ob-inline-actions">
            <button class="ob-chip" onclick="onboardingAction('focus-colors')">Open color tools</button>
            <button class="ob-chip" onclick="onboardingAction('randomize')">Randomize palette</button>
          </div>
          <div class="ob-card-list">
            <div class="ob-card-item"><i>🎯</i><div><strong>Base color</strong><span>Currently set to <strong>${state.base.toUpperCase()}</strong>. This is the anchor for every generated color.</span></div></div>
            <div class="ob-card-item"><i>➕</i><div><strong>Palette size</strong><span>You currently have <strong>${state.count}</strong> colors. Use the stepper to keep the set compact or expand it.</span></div></div>
            <div class="ob-card-item"><i>⚡</i><div><strong>Fast exploration</strong><span>The <strong>Randomize</strong> button is useful when you want inspiration instead of a precise starting point.</span></div></div>
          </div>
          <div class="ob-note"><strong>Good first move:</strong> pick a brand or product color you already trust, then adjust from there instead of starting from scratch.</div>
        `;
      }

      if (step === 3) {
        const featuredModes = ['Complementary', 'Analogous', 'Triadic', 'Monochromatic', 'Split-Comp'];
        const modeCopy = {
          'Complementary': 'High contrast. Great when you want a clear accent color.',
          'Analogous': 'Softer and more unified. Good for calm, polished interfaces.',
          'Triadic': 'More energetic and varied. Useful for colorful brands and highlights.',
          'Monochromatic': 'Safest option for clean systems and minimal UI work.',
          'Split-Comp': 'Balanced between bold and flexible, with a little more range.'
        };
        return `
          <div class="ob-step-icon">🔮</div>
          <div class="ob-kicker">Step 3 of ${ONBOARDING_TOTAL_STEPS}</div>
          <h2 class="ob-title" id="ob-title">Choose the palette mood</h2>
          <p class="ob-copy">Harmony controls how the rest of the colors relate to your base. Try a few options and keep the one that matches the tone of your project.</p>
          <div class="ob-chip-row">
            ${featuredModes.map(mode => `<button class="ob-chip${state.harmony === mode ? ' active' : ''}" onclick="setHarmony('${mode}');renderOnboarding();">${mode}</button>`).join('')}
          </div>
          <div class="ob-card-list">
            <div class="ob-card-item"><i>✨</i><div><strong>Current harmony</strong><span><strong>${state.harmony}</strong> is active right now, so the live palette behind this guide already reflects it.</span></div></div>
            <div class="ob-card-item"><i>🧠</i><div><strong>What to look for</strong><span>${modeCopy[state.harmony] || 'Experiment with a few modes and compare how balanced the palette feels.'}</span></div></div>
          </div>
          <div class="ob-note"><strong>Shortcut:</strong> if you want fewer decisions, start with <strong>Monochromatic</strong> or <strong>Analogous</strong> and branch out only if the UI needs more contrast.</div>
        `;
      }

      if (step === 4) {
        const tools = [
          ['wheel', '⭕', 'Wheel', 'See how your colors sit around the spectrum.'],
          ['shades', '🌗', 'Shades', 'Generate lighter and darker steps for each color.'],
          ['preview', '🖥️', 'Preview', 'View your palette on full sample websites.'],
          ['contrast', '♿', 'Contrast', 'Check whether text remains readable.']
        ];
        return `
          <div class="ob-step-icon">🗂️</div>
          <div class="ob-kicker">Step 4 of ${ONBOARDING_TOTAL_STEPS}</div>
          <h2 class="ob-title" id="ob-title">Use the views that answer real questions</h2>
          <p class="ob-copy">The top navigation is not just decoration. Each view helps you validate the palette from a different angle before you export it.</p>
          <div class="ob-card-list">
            ${tools.map(([tool, icon, title, desc]) => `<button class="ob-card-item" style="text-align:left;font-family:inherit;cursor:pointer;" onclick="switchTool('${tool}');renderOnboarding();"><i>${icon}</i><div><strong>${title}${currentTool === tool ? ' · open now' : ''}</strong><span>${desc}</span></div></button>`).join('')}
          </div>
          <div class="ob-note"><strong>Recommended flow:</strong> pick colors in <strong>Colors</strong>, inspect relationships in <strong>Wheel</strong>, test usability in <strong>Preview</strong>, then confirm readability in <strong>Contrast</strong>.</div>
        `;
      }

      return `
        <div class="ob-step-icon">🚀</div>
        <div class="ob-kicker">Step 5 of ${ONBOARDING_TOTAL_STEPS}</div>
        <h2 class="ob-title" id="ob-title">Preview, then export</h2>
        <p class="ob-copy">Once the palette feels right, open a live preview or copy the formats you need from the right panel. The app also remembers your latest setup automatically.</p>
        <div class="ob-inline-actions">
          <button class="ob-chip" onclick="switchTool('preview');renderOnboarding();">Open preview cards</button>
          <button class="ob-chip" onclick="switchTool('contrast');renderOnboarding();">Open contrast check</button>
        </div>
        <div class="ob-card-list">
          <div class="ob-card-item"><i>📋</i><div><strong>Quick exports</strong><span>Copy CSS variables, HEX, JSON, Tailwind, SCSS, OKLCH, Shadcn tokens, or Figma variables from the right panel.</span></div></div>
          <div class="ob-card-item"><i>💾</i><div><strong>Automatic memory</strong><span>Your base color, harmony, count, and accessibility settings are saved locally so you can return where you left off.</span></div></div>
          <div class="ob-card-item"><i>✅</i><div><strong>Best finish</strong><span>Try at least one preview and one contrast pass before you copy code into a real project.</span></div></div>
        </div>
        <div class="ob-note"><strong>You’re ready.</strong> Use <strong>Next</strong> to close this guide and continue exploring the live app.</div>
      `;
    }

    function renderOnboarding() {
      const overlay = document.getElementById('onboarding-overlay');
      if (!overlay) return;

      const body = document.getElementById('ob-body');
      const dots = document.getElementById('ob-dots');
      const progressFill = document.getElementById('ob-progress-fill');
      const progressLabel = document.getElementById('ob-progress-label');
      const backBtn = document.getElementById('ob-back-btn');
      const nextBtn = document.getElementById('ob-next-btn');

      body.innerHTML = getOnboardingStepMarkup(onboardingStep);
      dots.innerHTML = Array.from({ length: ONBOARDING_TOTAL_STEPS }, (_, index) => {
        const step = index + 1;
        const cls = step === onboardingStep ? 'ob-dot active' : step < onboardingStep ? 'ob-dot done' : 'ob-dot';
        return `<button class="${cls}" onclick="jumpOnboardingStep(${step})" aria-label="Go to step ${step}"></button>`;
      }).join('');

      progressFill.style.width = `${(onboardingStep / ONBOARDING_TOTAL_STEPS) * 100}%`;
      progressLabel.textContent = `${onboardingStep} / ${ONBOARDING_TOTAL_STEPS}`;
      backBtn.style.display = onboardingStep === 1 ? 'none' : 'inline-flex';
      nextBtn.textContent = onboardingStep === ONBOARDING_TOTAL_STEPS ? 'Start exploring' : 'Next';
      overlay.setAttribute('aria-hidden', 'false');
    }

    function openOnboarding(resetToStart = false) {
      const overlay = document.getElementById('onboarding-overlay');
      if (!overlay) return;
      if (resetToStart) onboardingStep = 1;
      overlay.classList.add('show');
      document.body.classList.add('onboarding-open');
      renderOnboarding();
    }

    function finishOnboarding(remember = true) {
      const overlay = document.getElementById('onboarding-overlay');
      if (!overlay) return;
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('onboarding-open');
      if (remember) localStorage.setItem(ONBOARDING_STORAGE_KEY, '1');
    }

    function changeOnboardingStep(delta) {
      if (onboardingStep === ONBOARDING_TOTAL_STEPS && delta > 0) {
        finishOnboarding(true);
        return;
      }
      onboardingStep = Math.max(1, Math.min(ONBOARDING_TOTAL_STEPS, onboardingStep + delta));
      renderOnboarding();
    }

    function jumpOnboardingStep(step) {
      onboardingStep = Math.max(1, Math.min(ONBOARDING_TOTAL_STEPS, step));
      renderOnboarding();
    }

    function onboardingAction(action) {
      if (action === 'focus-colors') {
        switchTool('colors');
        renderOnboarding();
        return;
      }
      if (action === 'randomize') {
        randomize();
        renderOnboarding();
      }
    }

    // ══ STORAGE & URL SYNC ══
    function persistState() {
      const cacheState = { base: state.base, count: state.count, harmony: state.harmony, contrastMode: state.contrastMode, colorBlindMode: state.colorBlindMode };
      localStorage.setItem('chromaStudio_state', JSON.stringify(cacheState));
    }

    function loadFromStorage() {
      try {
        const cached = localStorage.getItem('chromaStudio_state');
        if (cached) {
          const cached_state = JSON.parse(cached);
          state.base = cached_state.base || state.base;
          state.count = cached_state.count || state.count;
          state.harmony = cached_state.harmony || state.harmony;
          state.contrastMode = cached_state.contrastMode || state.contrastMode;
          state.colorBlindMode = cached_state.colorBlindMode || state.colorBlindMode;
        }
      } catch (e) { }
    }

    function updateURL() {
      const params = new URLSearchParams();
      params.set('base', state.base.substring(1));
      params.set('harmony', state.harmony);
      params.set('count', state.count);
      if (state.contrastMode !== 'wcag') params.set('contrast', state.contrastMode);
      if (state.colorBlindMode !== 'none') params.set('vision', state.colorBlindMode);
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }

    function loadFromURL() {
      const params = new URLSearchParams(window.location.search);
      const base = params.get('base');
      const harmony = params.get('harmony');
      const count = params.get('count');
      const contrast = params.get('contrast');
      const vision = params.get('vision');

      if (base && /^[0-9A-Fa-f]{6}$/.test(base)) state.base = '#' + base.toUpperCase();
      if (harmony && HARMONIES.includes(harmony)) state.harmony = harmony;
      if (count) {
        const c = parseInt(count);
        if (c >= 2 && c <= 12) state.count = c;
      }
      if (contrast && ['wcag', 'apca'].includes(contrast)) state.contrastMode = contrast;
      if (vision && ['none', 'protanopia', 'deuteranopia', 'tritanopia'].includes(vision)) state.colorBlindMode = vision;
    }

    // ══ RENDER ══
    function render() {
      renderPalBar(); renderRight(); renderCtxBar();
      renderWheel(); renderCards(); renderShades(); renderGradients();
      renderPreview(); renderContrast();
      syncMob();
      persistState();
      updateURL();
    }

    function renderPalBar() {
      document.getElementById('palbar').innerHTML = state.palette.map(c => `
    <div class="pb-sw" style="${swatchStyle(c)}" onclick="copyHex('${c}')"><span class="pb-sw-hex">${c.toUpperCase()}</span></div>`).join('');
    }
    function renderRight() {
      document.getElementById('rp-dots').innerHTML = state.palette.map(c => `<div class="rp-dot" style="${swatchStyle(c)}" onclick="copyHex('${c}')" title="${c.toUpperCase()}"></div>`).join('');
      document.getElementById('rp-harmony').textContent = state.harmony;
      document.getElementById('rp-count').textContent = state.count;
      document.getElementById('rp-base').textContent = state.base.toUpperCase();
    }

    // ══ CONTEXT BAR ══
    function renderCtxBar() {
      const cb = document.getElementById('ctxbar');
      // Custom picker triggers: <button class="ctx-cpick"> with data-picker-id to re-bind after innerHTML swap
      let h = `<span class="ctx-lbl">${currentTool.toUpperCase()}</span>`;
      h += `<button class="ctx-cpick" id="cpick-base" data-picker-id="base"
              style="background:${state.base}"
              aria-label="Pick base color (${state.base})"
              title="Base color ${state.base.toUpperCase()}"></button>`;
      h += `<input type="text" class="ctx-hex" value="${state.base.toUpperCase()}" oninput="onHexInput(this.value)" maxlength="7" placeholder="#RRGGBB">`;
      h += `<div class="ctx-sep"></div>`;
      h += `<span class="ctx-lsm">Colors:</span>`;
      h += `<div class="ctx-stepper"><button onclick="stepCount(-1)">−</button><span>${state.count}</span><button onclick="stepCount(1)">+</button></div>`;
      h += `<div class="ctx-sep"></div>`;
      h += `<span class="ctx-lsm">Vision</span><select class="ctx-select" onchange="setColorBlindMode(this.value)"><option value="none" ${state.colorBlindMode === 'none' ? 'selected' : ''}>Standard</option><option value="protanopia" ${state.colorBlindMode === 'protanopia' ? 'selected' : ''}>Protanopia</option><option value="deuteranopia" ${state.colorBlindMode === 'deuteranopia' ? 'selected' : ''}>Deuteranopia</option><option value="tritanopia" ${state.colorBlindMode === 'tritanopia' ? 'selected' : ''}>Tritanopia</option></select>`;
      HARMONIES.forEach(m => { h += `<button class="ctx-btn${state.harmony === m ? ' active' : ''}" onclick="setHarmony('${m}')">${m}</button>`; });
      if (currentTool === 'gradients') h += `<div class="ctx-sep"></div><button class="ctx-btn" onclick="copyAllGrads()">Copy All CSS</button>`;
      if (currentTool === 'contrast') {
        const pass = countPassingColors(state.palette, state.contrastMode);
        h += `<div class="ctx-sep"></div><span class="ctx-lsm">AA Pass: <b style="color:${pass > 0 ? '#9a8dff' : '#ff6060'}">${pass}/${state.palette.length}</b></span>`;
        h += `<button class="ctx-btn" onclick="autoFixPaletteContrast()">Auto-Fix</button>`;
        h += `<button class="ctx-btn${state.contrastMode === 'wcag' ? ' active' : ''}" onclick="setContrastMode('wcag')">WCAG</button>`;
        h += `<button class="ctx-btn${state.contrastMode === 'apca' ? ' active' : ''}" onclick="setContrastMode('apca')">APCA</button>`;
      }
      cb.innerHTML = h;
      // Re-bind custom picker after every innerHTML replacement
      _bindCtxPickers();
    }

    /**
     * Wire all .ctx-cpick buttons in the context bar to ChromaPicker.
     * Safe to call after every renderCtxBar() since pickers are portal-based.
     */
    function _bindCtxPickers() {
      if (typeof ChromaPicker === 'undefined') return;

      const baseBtn = document.getElementById('cpick-base');
      if (baseBtn && !baseBtn._cpBound) {
        baseBtn._cpBound = true;
        baseBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          // Toggle: close if already open for this trigger
          if (ChromaPicker.isOpen() && ChromaPicker._trigger === baseBtn) {
            ChromaPicker.close();
            return;
          }
          // Mark open state visually
          baseBtn.classList.add('cp-trigger--open');
          ChromaPicker.open(
            baseBtn,
            state.base,
            // live onChange — updates palette in real time while dragging
            function (hex) {
              baseBtn.style.background = hex;
              baseBtn.setAttribute('aria-label', 'Pick base color (' + hex + ')');
              setBase(hex);
            },
            // onCommit — same as onChange here (setBase already pushes history)
            function (hex) {
              baseBtn.style.background = hex;
              baseBtn.classList.remove('cp-trigger--open');
              setBase(hex);
            }
          );
          // Remove open-state class when panel closes externally (Escape / outside)
          const _origClose = ChromaPicker.close.bind(ChromaPicker);
          // Cleanup on any close path via a one-shot MutationObserver on the portal
          const observer = new MutationObserver(() => {
            if (!document.getElementById('cp-portal')) {
              baseBtn.classList.remove('cp-trigger--open');
              observer.disconnect();
            }
          });
          observer.observe(document.body, { childList: true });
        });
      }
    }

    // ══ TOOL SWITCHER ══
    function switchTool(tool) {
      currentTool = tool;
      document.querySelectorAll('.top-nav').forEach(m => m.classList.toggle('active', m.id === 'mi-' + tool));
      document.querySelectorAll('.ic-btn[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
      document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById('panel-' + tool); if (panel) panel.classList.add('active');
      renderCtxBar();
      if (tool === 'wheel') renderWheel();
    }

    // ══ COLOR WHEEL (Paletton-style) ══
    function renderWheel() {
      const canvas = document.getElementById('wheel-canvas'); if (!canvas) return;
      const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2;
      const oR = W / 2 - 2, iR = oR * .36;
      ctx.clearRect(0, 0, W, H);
      const SEG = 72;
      for (let i = 0; i < SEG; i++) {
        const a0 = (i / SEG) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / SEG) * Math.PI * 2 - Math.PI / 2, hue = (i / SEG) * 360;
        const g = ctx.createRadialGradient(cx, cy, iR, cx, cy, oR);
        g.addColorStop(0, hslToHex(hue, 100, 62)); g.addColorStop(.5, hslToHex(hue, 100, 44)); g.addColorStop(1, hslToHex(hue, 90, 18));
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, oR, a0, a1); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      }
      for (let i = 0; i < SEG; i++) {
        const a = (i / SEG) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath(); ctx.moveTo(cx + iR * Math.cos(a), cy + iR * Math.sin(a)); ctx.lineTo(cx + oR * Math.cos(a), cy + oR * Math.sin(a));
        ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = .6; ctx.stroke();
      }
      const ig = ctx.createRadialGradient(cx - iR * .25, cy - iR * .3, 0, cx, cy, iR);
      ig.addColorStop(0, 'rgba(255,255,255,.96)'); ig.addColorStop(.4, 'rgba(210,90,70,.72)'); ig.addColorStop(.72, 'rgba(110,15,15,.88)'); ig.addColorStop(1, 'rgba(20,2,2,.97)');
      ctx.beginPath(); ctx.arc(cx, cy, iR, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill();
      state.palette.forEach((c, idx) => {
        const [h, s] = hexToHsl(c), rad = iR + (oR - iR) * (.25 + s / 220), angle = (h / 360) * Math.PI * 2 - Math.PI / 2;
        const x = cx + rad * Math.cos(angle), y = cy + rad * Math.sin(angle);
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = textOn(c); ctx.font = 'bold 8.5px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(idx + 1, x, y);
      });
      document.getElementById('wheel-color-list').innerHTML = state.palette.map((c, i) => `
    <div class="wci" onclick="copyHex('${c}')">
      <div class="wci-sw" style="${swatchStyle(c)}"></div>
      <div><div class="wci-hex">${c.toUpperCase()}</div><div class="wci-name">${nameColor(c)}</div></div>
    </div>`).join('');
      document.getElementById('wheel-strip').innerHTML = state.palette.map(c => `
    <div class="ws-sw" style="${swatchStyle(c)}" onclick="copyHex('${c}')"><span>${c.toUpperCase()}</span></div>`).join('');
    }

    // ══ COLOR CARDS ══
    function renderCards() {
      const el = document.getElementById('cards-grid'), p = state.palette;
      el.innerHTML = p.map(() => `<div class="shimmer-card" style="height:160px"></div>`).join('');
      setTimeout(() => {
        el.innerHTML = p.map((c, i) => {
          const [r, g, b] = hexToRgb(c), [hh, ss, ll] = hexToHsl(c), tc = textOn(c);
          return `<div class="color-card" onclick="copyHex('${c}')">
        <div class="cc-sw" style="${swatchStyle(c)}"><div class="cc-badge" style="color:${tc}">${i === 0 ? 'BASE' : '#' + (i + 1)}</div></div>
        <div class="cc-body">
          <div class="cc-hex">${c.toUpperCase()}</div>
          <div class="cc-sub">rgb(${r},${g},${b})</div>
          <div class="cc-sub">hsl(${Math.round(hh)}°,${Math.round(ss)}%,${Math.round(ll)}%)</div>
          <div class="cc-tags">
            <span class="cc-tag">${nameColor(c)}</span>
            <span class="cc-tag">${ll < 30 ? 'Dark' : ll < 65 ? 'Mid' : 'Light'}</span>
            <span class="cc-tag">${ss < 20 ? 'Muted' : ss < 55 ? 'Soft' : 'Vivid'}</span>
          </div>
        </div>
      </div>`;
        }).join('');
      }, 140);
    }

    // ══ SHADES ══
    function renderShades() {
      const L = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      document.getElementById('shades-content').innerHTML = state.palette.map(c => {
        const [h, s] = hexToHsl(c);
        const sh = L.map((_, i) => hslToHex(h, Math.max(5, s * .9), Math.max(4, Math.min(96, 5 + 90 * (i / (L.length - 1))))));
        return `<div class="shade-wrap">
      <div class="shade-lbl">${nameColor(c)}<span>${c.toUpperCase()}</span></div>
      <div class="shade-strip">${sh.map((s, i) => `<div class="shade-cell" style="${swatchStyle(s)}" onclick="copyHex('${s}')" title="${s}"><span>${L[i]}</span></div>`).join('')}</div>
    </div>`;
      }).join('');
    }

    // ══ GRADIENTS ══
    let allGradCSS = [];
    function renderGradients() {
      const p = state.palette, grads = [];
      for (let i = 0; i < p.length; i++)for (let j = i + 1; j < p.length; j++) {
        grads.push({ a: p[i], b: p[j], dir: '135deg' });
        if (grads.length <= 6) grads.push({ a: p[i], b: p[j], dir: 'to bottom' });
      }
      if (p.length >= 3) grads.push({ multi: p, dir: '135deg' });
      if (p.length >= 4) grads.push({ multi: [...p].reverse(), dir: 'to right' });
      if (p.length >= 3) grads.push({ multi: p.slice(0, 3), dir: 'to bottom right' });
      allGradCSS = grads.map(g => g.multi ? `linear-gradient(${g.dir},${g.multi.join(',')})` : `linear-gradient(${g.dir},${g.a},${g.b})`);
      document.getElementById('grad-grid').innerHTML = grads.slice(0, 20).map((g, i) => {
        const lbl = g.multi ? `${g.multi.length}-stop` : g.dir === '135deg' ? '↗ Diagonal' : '↓ Vertical';
        return `<div class="grad-card" style="background:${allGradCSS[i]}" onclick="copyText('background: ${allGradCSS[i]};')"><div class="grad-lbl">${lbl}</div></div>`;
      }).join('');
    }
    function copyAllGrads() { copyText(allGradCSS.map(g => `background: ${g};`).join('\n')); }

    // ══ PREVIEW — opens full interactive websites ══
    function buildSite(type, p) {
      if (type === 'landing')    return window.buildLanding(p);
      if (type === 'dashboard')  return window.buildDashboard(p);
      if (type === 'portfolio')  return window.buildPortfolio(p);
      if (type === 'ecommerce')  return window.buildEcommerce(p);
      if (type === 'components') return window.buildComponents(p);
      return '';
    }

    window.buildLanding = function(p) {
      const c1=p[0],c2=p[1]||p[0],c3=p[2]||p[0],t1=textOn(c1),t2=textOn(c2);
      return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Landing</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:${c1};color:${t1}}
.nav{display:flex;align-items:center;justify-content:space-between;padding:0 48px;height:64px;background:${c1}e0;backdrop-filter:blur(12px);position:sticky;top:0;z-index:100;border-bottom:1px solid rgba(255,255,255,.07)}
.logo{font-weight:800;font-size:17px}.links{display:flex;gap:24px}.links a{text-decoration:none;color:${t1};opacity:.6;font-size:13px;font-weight:500;transition:opacity .15s}.links a:hover{opacity:1}
.nav-cta{padding:8px 18px;background:${c2};color:${t2};border:none;border-radius:7px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;transition:opacity .15s}.nav-cta:hover{opacity:.85}
.hero{padding:110px 48px 80px;text-align:center;max-width:800px;margin:0 auto}
.badge{display:inline-block;padding:5px 14px;background:${c2}25;border:1px solid ${c2}50;border-radius:100px;font-size:11px;font-weight:700;color:${c2};margin-bottom:24px;letter-spacing:.6px;text-transform:uppercase}
h1{font-size:clamp(36px,6vw,66px);font-weight:800;line-height:1.07;letter-spacing:-2px;margin-bottom:20px}h1 span{color:${c2}}
.sub{font-size:17px;opacity:.58;line-height:1.72;margin-bottom:36px;max-width:500px;margin-left:auto;margin-right:auto}
.btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.btn-p{padding:13px 32px;background:${c2};color:${t2};border:none;border-radius:9px;font-weight:700;font-size:14px;font-family:inherit;cursor:pointer;transition:transform .15s,box-shadow .15s}.btn-p:hover{transform:translateY(-2px);box-shadow:0 8px 28px ${c2}55}
.btn-g{padding:13px 32px;background:transparent;color:${t1};border:1.5px solid rgba(255,255,255,.2);border-radius:9px;font-weight:600;font-size:14px;font-family:inherit;cursor:pointer;transition:background .15s}.btn-g:hover{background:rgba(255,255,255,.07)}
.feats{padding:70px 48px;display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;max-width:1100px;margin:0 auto}
.feat{padding:26px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);transition:transform .2s,box-shadow .2s;cursor:default}.feat:hover{transform:translateY(-4px);box-shadow:0 12px 30px rgba(0,0,0,.25)}
.feat-ico{width:44px;height:44px;border-radius:10px;background:${c2};display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:14px}
.feat h3{font-size:16px;font-weight:700;margin-bottom:7px}.feat p{font-size:13px;opacity:.55;line-height:1.6}
.stats{padding:50px 48px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;max-width:860px;margin:0 auto;text-align:center}
.stat h2{font-size:42px;font-weight:800;color:${c2};letter-spacing:-1.5px}.stat p{font-size:12px;opacity:.45;margin-top:4px}
.cta-sec{padding:70px 48px;text-align:center;background:linear-gradient(135deg,${c2}20,${c3}15);border-top:1px solid rgba(255,255,255,.06)}
.cta-sec h2{font-size:34px;font-weight:800;margin-bottom:12px;letter-spacing:-.8px}.cta-sec p{opacity:.55;margin-bottom:26px;font-size:15px}
.email-row{display:flex;gap:8px;justify-content:center;max-width:400px;margin:0 auto;flex-wrap:wrap}
.email-in{flex:1;min-width:180px;padding:11px 14px;border-radius:8px;border:1.5px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:${t1};font-size:13px;font-family:inherit;outline:none;transition:border-color .15s}.email-in:focus{border-color:${c2}}.email-in::placeholder{opacity:.4}
.email-btn{padding:11px 22px;background:${c2};color:${t2};border:none;border-radius:8px;font-weight:700;font-size:13px;font-family:inherit;cursor:pointer;white-space:nowrap;transition:opacity .15s}.email-btn:hover{opacity:.85}
footer{padding:26px 48px;border-top:1px solid rgba(255,255,255,.06);text-align:center;opacity:.3;font-size:11px}
#toast-msg{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#111;color:#eee;padding:8px 18px;border-radius:8px;font-size:12px;font-weight:600;border:1px solid rgba(255,255,255,.12);opacity:0;transition:opacity .25s;pointer-events:none;z-index:9999}
#toast-msg.show{opacity:1}
@media(max-width:600px){.nav{padding:0 16px}.links{display:none}.hero{padding:60px 20px 50px}.feats,.stats,.cta-sec{padding:40px 20px}footer{padding:20px}}
</style></head><body>
<nav class="nav"><div class="logo">★ Brand</div><div class="links"><a href="#feats">Features</a><a href="#stats">Stats</a><a href="#cta">Pricing</a></div><button class="nav-cta" onclick="showT('✓ Welcome aboard!')">Get Started</button></nav>
<section class="hero">
  <div class="badge">✦ Now in public beta</div>
  <h1>Design with <span>Color</span><br>Build with Confidence</h1>
  <p class="sub">The professional color studio that turns your palette into a complete design system — export to CSS, Tailwind, Figma and more.</p>
  <div class="btns">
    <button class="btn-p" onclick="showT('🚀 Starting your trial...')">Start Free →</button>
    <button class="btn-g" onclick="showT('▶ Opening demo...')">Watch Demo</button>
  </div>
</section>
<div id="feats" class="feats">
  <div class="feat"><div class="feat-ico">🎨</div><h3>Smart Palettes</h3><p>Generate harmonious color palettes from any base color using proven color theory algorithms.</p></div>
  <div class="feat"><div class="feat-ico">⚡</div><h3>Instant Export</h3><p>One click to export your colors as CSS variables, Tailwind config, SCSS, shadcn or Figma JSON.</p></div>
  <div class="feat"><div class="feat-ico">♿</div><h3>Accessible by Default</h3><p>WCAG 2.1 and APCA contrast checking built in so every palette ships accessibility-ready.</p></div>
</div>
<div id="stats" class="stats">
  <div class="stat"><h2>10K+</h2><p>Designers using ChromaStudio</p></div>
  <div class="stat"><h2>50+</h2><p>Color harmony modes</p></div>
  <div class="stat"><h2>99%</h2><p>Customer satisfaction</p></div>
</div>
<div id="cta" class="cta-sec">
  <h2>Ready to ship beautiful UIs?</h2>
  <p>Enter your email and get started in 30 seconds — no credit card needed.</p>
  <div class="email-row">
    <input class="email-in" id="email-in" type="email" placeholder="you@company.com">
    <button class="email-btn" onclick="subEmail()">Get Early Access</button>
  </div>
</div>
<footer>© 2025 ChromaStudio · Built with your palette</footer>
<div id="toast-msg"></div>
<script>
function showT(msg){const t=document.getElementById('toast-msg');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200)}
function subEmail(){const v=document.getElementById('email-in').value;if(!v||!v.includes('@')){showT('⚠ Please enter a valid email');return}showT('✓ '+v+' added to the list!')}
document.querySelectorAll('.links a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const id=a.getAttribute('href').slice(1);document.getElementById(id)?.scrollIntoView({behavior:'smooth'})}))
</script></body></html>`;
    }

    function renderPreview() {
      const p = state.palette;
      const c1 = p[0], c2 = p[1] || p[0];
      const cards = [
        { type: 'landing',    label: 'Marketing', title: 'Landing Page',      icon: '🚀', desc: 'Hero, features, stats, CTA and signup flow.', highlights: ['Hero CTA', 'Feature blocks'], bg: `linear-gradient(135deg,${c1},${c2})` },
        { type: 'dashboard',  label: 'App',       title: 'Admin Dashboard',   icon: '📊', desc: 'Sidebar, analytics cards, chart and data table.', highlights: ['Live KPIs', 'Team views'], bg: `linear-gradient(135deg,${c2},${p[2]||c2})` },
        { type: 'portfolio',  label: 'Portfolio', title: 'Portfolio Site',    icon: '🎨', desc: 'Creative case studies, skills and contact funnel.', highlights: ['Work gallery', 'Contact form'], bg: `linear-gradient(135deg,${p[2]||c1},${c1})` },
        { type: 'ecommerce',  label: 'Commerce',  title: 'E-Commerce Store',  icon: '🛍️', desc: 'Product discovery, filters, cart drawer and checkout.', highlights: ['Cart drawer', 'Category filters'], bg: `linear-gradient(135deg,${p[3]||c2},${c2})` },
        { type: 'components', label: 'UI Kit',    title: 'Component Library', icon: '🧩', desc: 'Interactive buttons, forms, alerts, tabs and modals.', highlights: ['Design system', 'Interactive states'], bg: `linear-gradient(135deg,${p[4]||c1},${c2})` }
      ];
      document.getElementById('prev-grid').innerHTML = cards.map(card => `
    <button class="preview-launch-card" onclick="openPreview('${card.type}')" style="background:${card.bg};--card-accent:${c2}">
      <span class="preview-launch-card__top">
        <span class="preview-launch-card__badge">${card.label}</span>
        <span class="preview-launch-card__icon" aria-hidden="true">${card.icon}</span>
      </span>
      <span class="preview-launch-card__title">${card.title}</span>
      <span class="preview-launch-card__desc">${card.desc}</span>
      <span class="preview-launch-card__meta">${card.highlights.map(item=>`<i>${item}</i>`).join('')}</span>
      <span class="preview-launch-card__swatches">${p.slice(0,6).map(c=>`<i style="background:${c}"></i>`).join('')}</span>
      <span class="preview-launch-card__action">Open live preview →</span>
    </button>`).join('');
    }

    function openPreview(type) {
      const html = buildSite(type, state.palette);
      if (!html) return;
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); }
      else showToast('Allow pop-ups to open preview');
    }

    // ══ CONTRAST ══
    function renderContrast() {
      const p        = state.palette;
      const fixedBgs = ['#FFFFFF', '#000000', '#111111', '#F5F5F5', '#1A1A2E'];
      const bgLabels = { '#FFFFFF': 'White', '#000000': 'Black', '#111111': 'Near Black', '#F5F5F5': 'Off White', '#1A1A2E': 'Dark Navy' };
      const mode     = state.contrastMode;

      // For each palette color find ALL candidate backgrounds and rank them
      const cards = p.map(color => {
        const candidates = [
          ...fixedBgs.map(bg => ({ bg, label: bgLabels[bg] || bg })),
          ...p.filter(c => c !== color).map(bg => ({ bg, label: bg.toUpperCase() + ' (palette)' }))
        ];

        const ranked = candidates.map(({ bg, label }) => {
          const ratio = contrastValue(color, bg, mode);
          const grade = contrastGrade(color, bg, mode);
          return { bg, label, ratio, grade };
        }).sort((a, b) => {
          // Sort by absolute ratio descending (APCA uses signed values)
          const aScore = mode === 'apca' ? Math.abs(a.ratio) : a.ratio;
          const bScore = mode === 'apca' ? Math.abs(b.ratio) : b.ratio;
          return bScore - aScore;
        });

        const best = ranked[0];
        return { color, ranked, best };
      });

      document.getElementById('contrast-grid').innerHTML = cards.map(({ color, ranked, best }) => {
        const bestRatioLabel = mode === 'apca'
          ? `${Math.abs(best.ratio).toFixed(1)} Lc`
          : `${best.ratio.toFixed(2)}:1`;

        const otherRows = ranked.slice(1).map(({ bg, label, ratio, grade }) => {
          const ratioLabel = mode === 'apca'
            ? `${Math.abs(ratio).toFixed(1)} Lc`
            : `${ratio.toFixed(2)}:1`;
          return `
            <div class="cont-row">
              <div class="cont-row-swatch" style="background:${bg};border:1px solid rgba(255,255,255,.1)"></div>
              <span class="cont-row-label">${label}</span>
              <span class="cont-row-ratio">${ratioLabel}</span>
              <span class="cont-grade ${grade[1]}">${grade[0]}</span>
            </div>`;
        }).join('');

        return `
          <div class="cont-card">
            <!-- Color identity -->
            <div class="cont-color-header">
              <div class="cont-color-dot" style="background:${color}"></div>
              <span class="cont-color-hex">${color.toUpperCase()}</span>
              <span class="cont-color-name">${nameColor(color)}</span>
            </div>

            <!-- Best match hero -->
            <div class="cont-best" style="background:${best.bg};color:${color}">
              <div class="cont-best-label">Best match</div>
              <div class="cont-best-preview">Aa Bb 123</div>
              <div class="cont-best-meta">
                <span class="cont-best-bg-name">${best.label}</span>
                <span class="cont-grade ${best.grade[1]}">${best.grade[0]}</span>
                <span class="cont-best-ratio">${bestRatioLabel}</span>
              </div>
            </div>

            <!-- All other pairings ranked -->
            <div class="cont-rows">
              ${otherRows}
            </div>
          </div>`;
      }).join('');
    }

    // ══ MOBILE ══
    function syncMob() {
      // Custom picker trigger: update background swatch color
      const mc = document.getElementById('mob-cpick');
      if (mc) {
        mc.style.background = state.base;
        mc.setAttribute('aria-label', 'Pick base color (' + state.base + ')');
        mc.setAttribute('title', 'Base color ' + state.base.toUpperCase());
      }
      const mh = document.getElementById('mob-hex'); if (mh) mh.value = state.base.toUpperCase();
      const mn = document.getElementById('mob-count'); if (mn) mn.textContent = state.count;
      renderMobHarmony();
    }

    /** Bind the mobile drawer picker button — called once after DOM is ready. */
    function _initMobPicker() {
      if (typeof ChromaPicker === 'undefined') return;
      const btn = document.getElementById('mob-cpick');
      if (!btn || btn._cpBound) return;
      btn._cpBound = true;
      btn.style.background = state.base;

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (ChromaPicker.isOpen() && ChromaPicker._trigger === btn) {
          ChromaPicker.close();
          return;
        }
        btn.classList.add('cp-trigger--open');
        ChromaPicker.open(
          btn,
          state.base,
          function (hex) {
            btn.style.background = hex;
            setBase(hex);
          },
          function (hex) {
            btn.style.background = hex;
            btn.classList.remove('cp-trigger--open');
            setBase(hex);
          }
        );
        const observer = new MutationObserver(() => {
          if (!document.getElementById('cp-portal')) {
            btn.classList.remove('cp-trigger--open');
            observer.disconnect();
          }
        });
        observer.observe(document.body, { childList: true });
      });
    }
    function renderMobHarmony() {
      const el = document.getElementById('mob-harmony'); if (!el) return;
      el.innerHTML = HARMONIES.map(h => `<button class="ctx-btn${state.harmony === h ? ' active' : ''}" onclick="setHarmony('${h}');renderMobHarmony()">${h}</button>`).join('');
    }
    function renderMobNav() {
      const tools = [['wheel', 'Color Wheel'], ['colors', 'Colors'], ['shades', 'Shades'], ['gradients', 'Gradients'], ['preview', 'Preview'], ['contrast', 'Contrast']];
      document.getElementById('mob-nav').innerHTML = tools.map(([t, l]) => `
    <button class="rp-xbtn" style="${currentTool === t ? 'background:rgba(124,106,255,.15);border-color:var(--accent);color:#fff' : ''}" onclick="switchTool('${t}');closeMob()">${l}</button>`).join('');
    }
    function openMob() { document.getElementById('mob-drawer').classList.add('open'); document.getElementById('mob-overlay').classList.add('show'); renderMobNav(); renderMobHarmony(); }
    function closeMob() { document.getElementById('mob-drawer').classList.remove('open'); document.getElementById('mob-overlay').classList.remove('show'); }

    // ══ COPY / EXPORT ══
    function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 1800); }
    function copyText(txt) { navigator.clipboard.writeText(txt).catch(() => { }); }
    function copyHex(hex) { copyText(hex.toUpperCase()); showToast('Copied ' + hex.toUpperCase()); }
    function exportCSS() { copyText(`:root {\n${state.palette.map((c, i) => `  --color-${i + 1}: ${c.toUpperCase()};`).join('\n')}\n}`); showToast('CSS variables copied'); }
    function exportHex() { copyText(state.palette.map(c => c.toUpperCase()).join('\n')); showToast('HEX list copied'); }
    function exportJSON() { copyText(JSON.stringify({ harmony: state.harmony, base: state.base, palette: state.palette.map((c, i) => ({ index: i + 1, hex: c.toUpperCase(), name: nameColor(c), rgb: hexToRgb(c), hsl: hexToHsl(c).map(v => Math.round(v)) })) }, null, 2)); showToast('JSON exported'); }
    function exportTailwind() { copyText(`// tailwind.config.js\nmodule.exports={theme:{extend:{colors:{\n${state.palette.map((c, i) => `  'cs-${i + 1}':'${c.toUpperCase()}'`).join(',\n')}\n}}}}`); showToast('Tailwind config copied'); }
    function exportSCSS() { copyText(state.palette.map((c, i) => `$color-${i + 1}: ${c.toUpperCase()};`).join('\n')); showToast('SCSS variables copied'); }

    function exportShadcn() {
      const p = state.palette;
      const semanticMap = { background: p[0] || '#000000', foreground: p[1] || '#ffffff', primary: p[0] || '#000000', 'primary-foreground': p[1] || '#ffffff', secondary: p[2] || p[0], 'secondary-foreground': p[1] || '#ffffff', destructive: '#ef4444', 'destructive-foreground': '#fafafa', muted: p[3] || p[2], 'muted-foreground': '#737373', accent: p[0] || '#000000', 'accent-foreground': p[1] || '#ffffff', popover: '#ffffff', 'popover-foreground': '#0f0f0f', card: p[0] || '#000000', 'card-foreground': p[1] || '#ffffff', border: '#e5e5e5', input: '#f5f5f5', ring: p[0] || '#000000' };
      const vars = Object.entries(semanticMap).map(([name, hex]) => { const [h, s, l] = hexToHsl(hex); return `    --${name}: ${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%;`; }).join('\n');
      const output = `@layer base {\n  :root {\n${vars}\n  }\n}`;
      copyText(output);
      showToast('Shadcn globals.css copied');
    }

    function exportOKLCH() {
      const oklchVars = state.palette.map((c, i) => { const [l, ch, h] = hexToOklch(c); const lPercent = (l * 100).toFixed(1); const chVal = ch.toFixed(3); const hVal = h.toFixed(2); return `  --color-${i + 1}: oklch(${lPercent}% ${chVal} ${hVal}deg);`; }).join('\n');
      const output = `:root {\n${oklchVars}\n}`;
      copyText(output);
      showToast('OKLCH variables copied');
    }

    function hexToRgbNormalized(hex) { const [r, g, b] = hexToRgb(hex); return { r: r / 255, g: g / 255, b: b / 255, a: 1 }; }

    function exportFigmaVariables() {
      const figmaVars = state.palette.map((c, i) => { const rgb = hexToRgbNormalized(c); return { name: `Color/${i + 1}`, type: 'COLOR', value: rgb }; });
      const payload = { variables: figmaVars, meta: { exportedFrom: 'ChromaStudio', exportedAt: new Date().toISOString(), harmony: state.harmony, baseColor: state.base } };
      copyText(JSON.stringify(payload, null, 2));
      showToast('Figma variables JSON copied');
    }

    // ══ KEYBOARD ══
    document.addEventListener('keydown', e => {
      if (isOnboardingOpen()) {
        if (e.key === 'Escape') finishOnboarding(true);
        if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); changeOnboardingStep(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); changeOnboardingStep(-1); }
        return;
      }
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'r' || e.key === 'R') randomize();
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); }
    });

    // ══ INIT ══
    loadFromURL();
    if (!window.location.search) loadFromStorage();
    pushHist();
    state.palette = generate(state.base, state.count, state.harmony);
    render();
    switchTool('colors');
    // Bind mobile drawer picker (runs after DOM is painted)
    _initMobPicker();
    const onboardingOverlay = document.getElementById('onboarding-overlay');
    if (onboardingOverlay) {
      onboardingOverlay.addEventListener('click', (event) => {
        if (event.target === onboardingOverlay) finishOnboarding(true);
      });
    }
    if (!hasCompletedOnboarding()) openOnboarding(true);
