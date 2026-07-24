// ══ STATE ══
    const HARMONIES = ['Monochromatic', 'Complementary', 'Analogous', 'Triadic', 'Split-Comp', 'Tetradic', 'Square', 'Custom'];
    let state = { base: '#AA3939', count: 5, harmony: 'Complementary', palette: [], contrastMode: 'wcag', colorBlindMode: 'none' };
    let hist = [], histIdx = -1, currentTool = 'colors';

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

    // ══ PREVIEW — opens full websites ══
    function buildSite(type, p) {
      const c1 = p[0], c2 = p[1] || p[0], c3 = p[2] || p[0], c4 = p[3] || p[0];
      const t1 = textOn(c1), t2 = textOn(c2), t3 = textOn(c3);

      if (type === 'landing') return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Landing — ChromaStudio Preview</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:${c1};color:${t1};}
nav{display:flex;align-items:center;justify-content:space-between;padding:18px 48px;background:rgba(0,0,0,.12);backdrop-filter:blur(14px);position:sticky;top:0;z-index:100;border-bottom:1px solid rgba(255,255,255,.07);}
.logo{font-weight:800;font-size:18px;letter-spacing:-.5px;}
.links{display:flex;gap:28px;}.links a{text-decoration:none;color:${t1};opacity:.65;font-size:14px;font-weight:500;transition:opacity .2s;}.links a:hover{opacity:1;}
.cta{padding:9px 22px;background:${c2};color:${t2};border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;font-family:'Inter',sans-serif;}
.hero{padding:130px 48px 90px;text-align:center;max-width:820px;margin:0 auto;}
.badge{display:inline-block;padding:6px 16px;background:${c2}22;border:1px solid ${c2}44;border-radius:100px;font-size:12px;font-weight:600;color:${c2};margin-bottom:26px;letter-spacing:.5px;text-transform:uppercase;}
h1{font-size:clamp(38px,6vw,70px);font-weight:800;line-height:1.07;letter-spacing:-2.5px;margin-bottom:22px;}
h1 span{color:${c2};}
.sub{font-size:18px;opacity:.6;line-height:1.7;margin-bottom:40px;max-width:520px;margin-left:auto;margin-right:auto;}
.btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}
.btn-p{padding:14px 36px;background:${c2};color:${t2};border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:15px;font-family:'Inter',sans-serif;transition:transform .15s,box-shadow .15s;}
.btn-p:hover{transform:translateY(-2px);box-shadow:0 8px 30px ${c2}55;}
.btn-g{padding:14px 36px;background:transparent;color:${t1};border:1.5px solid rgba(255,255,255,.22);border-radius:10px;font-weight:600;cursor:pointer;font-size:15px;font-family:'Inter',sans-serif;}
.feats{padding:80px 48px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;max-width:1100px;margin:0 auto;}
.feat{padding:28px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);}
.feat-ico{width:46px;height:46px;border-radius:10px;background:${c2};display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:16px;}
.feat h3{font-size:17px;font-weight:700;margin-bottom:8px;}
.feat p{font-size:13.5px;opacity:.58;line-height:1.65;}
.stats{padding:60px 48px;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;max-width:900px;margin:0 auto;text-align:center;}
.stat h2{font-size:44px;font-weight:800;color:${c2};letter-spacing:-1.5px;}
.stat p{font-size:13px;opacity:.5;margin-top:5px;font-weight:500;}
.cta-sec{padding:80px 48px;text-align:center;background:linear-gradient(135deg,${c2}22,${c3}18);}
.cta-sec h2{font-size:38px;font-weight:800;margin-bottom:14px;letter-spacing:-1px;}
.cta-sec p{opacity:.58;margin-bottom:30px;font-size:16px;}
footer{padding:30px 48px;border-top:1px solid rgba(255,255,255,.07);text-align:center;opacity:.35;font-size:12px;}
@media(max-width:600px){nav{padding:14px 20px;}.links{display:none;}.hero{padding:70px 20px 50px;}.feats,.stats,.cta-sec{padding:50px 20px;}}
</style></head><body>
<nav><div class="logo">★ Brand</div><div class="links"><a href="#">Product</a><a href="#">Pricing</a><a href="#">Docs</a><a href="#">Blog</a></div><button class="cta">Get Started</button></nav>
<section class="hero">
  <div class="badge">✦ Now in Beta</div>
  <h1>Design with <span>Color</span><br>Build with Confidence</h1>
  <p class="sub">The professional color studio that turns your palette into a complete design system. Export to CSS, Tailwind, and more.</p>
  <div class="btns"><button class="btn-p">Start Free →</button><button class="btn-g">Watch Demo</button></div>
</section>
<div class="feats">
  <div class="feat"><div class="feat-ico">🎨</div><h3>Smart Palettes</h3><p>Generate harmonious color palettes from any base color using proven color theory algorithms.</p></div>
  <div class="feat"><div class="feat-ico">⚡</div><h3>Instant Export</h3><p>One click to export your colors as CSS variables, Tailwind config, SCSS, or JSON format.</p></div>
  <div class="feat"><div class="feat-ico">♿</div><h3>Accessible by Default</h3><p>Built-in WCAG contrast checking ensures your palette meets all accessibility standards.</p></div>
</div>
<div class="stats">
  <div class="stat"><h2>10K+</h2><p>Designers using ChromaStudio</p></div>
  <div class="stat"><h2>50+</h2><p>Harmony modes available</p></div>
  <div class="stat"><h2>99%</h2><p>Customer satisfaction rate</p></div>
</div>
<div class="cta-sec"><h2>Ready to build beautiful UIs?</h2><p>Join thousands of designers who trust ChromaStudio daily.</p><button class="btn-p">Start for Free →</button></div>
<footer>© 2025 ChromaStudio · Built with your palette</footer>
</body></html>`;

      if (type === 'dashboard') return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dashboard — ChromaStudio Preview</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:${c1};color:${t1};min-height:100vh;display:flex;}
aside{width:220px;background:rgba(0,0,0,.22);border-right:1px solid rgba(255,255,255,.07);padding:20px 14px;display:flex;flex-direction:column;gap:3px;flex-shrink:0;}
.sb-logo{font-size:16px;font-weight:800;padding:8px 10px 20px;letter-spacing:-.5px;}
.sb-sec{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;opacity:.32;padding:14px 10px 6px;}
.sb-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;opacity:.58;transition:all .15s;}
.sb-item:hover{background:rgba(255,255,255,.07);opacity:.85;}
.sb-item.active{background:${c2};color:${t2};opacity:1;}
.sb-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
main{flex:1;padding:28px;overflow-y:auto;min-width:0;}
.pg-title{font-size:22px;font-weight:800;margin-bottom:5px;letter-spacing:-.5px;}
.pg-sub{font-size:13px;opacity:.4;margin-bottom:24px;}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:22px;}
.kpi{padding:20px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);}
.kpi-lbl{font-size:11px;opacity:.48;font-weight:600;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;}
.kpi-val{font-size:30px;font-weight:800;letter-spacing:-1px;margin-bottom:4px;}
.kpi-ch{font-size:11.5px;font-weight:600;}.kpi-ch.up{color:${c2};}.kpi-ch.dn{color:#ff6060;}
.ch-row{display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:22px;}
.ch-card{padding:20px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);}
.ch-title{font-size:13px;font-weight:700;margin-bottom:16px;}
.bar-chart{display:flex;align-items:flex-end;gap:6px;height:120px;}
.bar{flex:1;border-radius:4px 4px 0 0;cursor:pointer;}.bar:hover{opacity:.8;}
.pie-list{display:flex;flex-direction:column;gap:9px;padding-top:4px;}
.pie-item{display:flex;align-items:center;gap:10px;font-size:12px;}
.pie-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0;}
.pie-lbl{flex:1;opacity:.68;}
.pie-pct{font-weight:700;font-size:11px;font-family:monospace;}
.tbl-card{padding:20px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);}
.tbl-title{font-size:13px;font-weight:700;margin-bottom:14px;}
table{width:100%;border-collapse:collapse;}
th{text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;opacity:.38;padding:0 10px 10px 0;}
td{padding:10px 10px 10px 0;font-size:12.5px;border-top:1px solid rgba(255,255,255,.05);}
.badge{padding:2px 8px;border-radius:100px;font-size:10px;font-weight:600;display:inline-block;}
.b-g{background:rgba(0,210,120,.15);color:#00d278;}.b-y{background:rgba(255,200,0,.12);color:#ffc800;}.b-r{background:rgba(255,80,80,.12);color:#ff6060;}
@media(max-width:700px){aside{display:none;}main{padding:16px;}}
</style></head><body>
<aside>
  <div class="sb-logo">◈ Dashboard</div>
  <div class="sb-sec">Main</div>
  <div class="sb-item active"><div class="sb-dot" style="background:${c2}"></div>Overview</div>
  <div class="sb-item"><div class="sb-dot" style="background:${c3}"></div>Analytics</div>
  <div class="sb-item"><div class="sb-dot" style="background:${c4}"></div>Projects</div>
  <div class="sb-item"><div class="sb-dot"></div>Team</div>
  <div class="sb-sec">System</div>
  <div class="sb-item"><div class="sb-dot"></div>Settings</div>
  <div class="sb-item"><div class="sb-dot"></div>Help</div>
</aside>
<main>
  <div class="pg-title">Overview</div>
  <div class="pg-sub">Your palette in action — built with ChromaStudio</div>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-lbl">Revenue</div><div class="kpi-val" style="color:${c2}">$48.2K</div><div class="kpi-ch up">↑ 12.4% this month</div></div>
    <div class="kpi"><div class="kpi-lbl">Users</div><div class="kpi-val">3,842</div><div class="kpi-ch up">↑ 8.1% this week</div></div>
    <div class="kpi"><div class="kpi-lbl">Churn</div><div class="kpi-val">2.3%</div><div class="kpi-ch dn">↑ 0.4% vs last month</div></div>
    <div class="kpi"><div class="kpi-lbl">NPS</div><div class="kpi-val">74</div><div class="kpi-ch up">↑ 3 pts</div></div>
  </div>
  <div class="ch-row">
    <div class="ch-card">
      <div class="ch-title">Monthly Revenue</div>
      <div class="bar-chart">${[42, 58, 35, 74, 61, 88, 52, 79, 65, 91, 47, 84].map((v, i) => `<div class="bar" style="height:${v}%;background:${p[i % p.length]};opacity:${i === 11 ? 1 : .65}"></div>`).join('')}</div>
    </div>
    <div class="ch-card">
      <div class="ch-title">Traffic Sources</div>
      <div class="pie-list">${p.slice(0, 5).map((c, i) => { const lb = ['Organic', 'Direct', 'Referral', 'Social', 'Email']; const pc = [38, 25, 18, 12, 7]; return `<div class="pie-item"><div class="pie-dot" style="background:${c}"></div><span class="pie-lbl">${lb[i] || 'Other'}</span><span class="pie-pct">${pc[i] || 3}%</span></div>`; }).join('')}</div>
    </div>
  </div>
  <div class="tbl-card">
    <div class="tbl-title">Recent Transactions</div>
    <table><thead><tr><th>Name</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead><tbody>
    <tr><td>Acme Corp</td><td style="font-family:monospace">$4,200</td><td>Today</td><td><span class="badge b-g">Paid</span></td></tr>
    <tr><td>Stark Industries</td><td style="font-family:monospace">$12,500</td><td>Yesterday</td><td><span class="badge b-y">Pending</span></td></tr>
    <tr><td>Wayne Enterprises</td><td style="font-family:monospace">$8,750</td><td>Dec 18</td><td><span class="badge b-g">Paid</span></td></tr>
    <tr><td>Umbrella Co.</td><td style="font-family:monospace">$2,100</td><td>Dec 17</td><td><span class="badge b-r">Failed</span></td></tr>
    </tbody></table>
  </div>
</main></body></html>`;

      if (type === 'portfolio') return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portfolio — ChromaStudio Preview</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:${c1};color:${t1};}
nav{display:flex;align-items:center;justify-content:space-between;padding:20px 48px;position:sticky;top:0;z-index:10;backdrop-filter:blur(16px);background:${c1}cc;}
.logo{font-weight:800;font-size:17px;letter-spacing:-.5px;}
.links{display:flex;gap:24px;}.links a{text-decoration:none;color:${t1};opacity:.5;font-size:14px;font-weight:500;}.links a:hover{opacity:1;}
.hero{padding:100px 48px 70px;max-width:920px;}
.hero-tag{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${c2};margin-bottom:18px;}
h1{font-size:clamp(40px,6vw,72px);font-weight:800;line-height:1.06;letter-spacing:-2.5px;margin-bottom:22px;}
h1 em{font-style:normal;background:linear-gradient(135deg,${c2},${c3});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.sub{font-size:17px;opacity:.52;line-height:1.72;max-width:480px;margin-bottom:36px;}
.acts{display:flex;gap:14px;flex-wrap:wrap;}
.btn-m{padding:13px 30px;background:${c2};color:${t2};border:none;border-radius:9px;font-weight:700;cursor:pointer;font-size:14px;font-family:'Inter',sans-serif;}
.btn-o{padding:13px 30px;background:transparent;color:${t1};border:1.5px solid rgba(255,255,255,.2);border-radius:9px;font-weight:600;cursor:pointer;font-size:14px;font-family:'Inter',sans-serif;}
.work{padding:60px 48px;max-width:1100px;margin:0 auto;}
.w-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;opacity:.32;margin-bottom:22px;}
.w-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;}
.w-card{border-radius:14px;overflow:hidden;cursor:pointer;transition:transform .22s;}.w-card:hover{transform:translateY(-5px);}
.w-img{height:200px;display:flex;align-items:center;justify-content:center;font-size:38px;}
.w-meta{padding:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);border-top:none;}
.w-meta h3{font-size:15px;font-weight:700;margin-bottom:4px;}.w-meta p{font-size:12px;opacity:.48;}
.skills{padding:60px 48px;background:rgba(255,255,255,.03);}
.s-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;opacity:.32;margin-bottom:18px;max-width:1000px;margin-left:auto;margin-right:auto;}
.s-grid{display:flex;gap:10px;flex-wrap:wrap;max-width:1000px;margin:0 auto;}
.chip{padding:8px 16px;border-radius:100px;font-size:12.5px;font-weight:600;border:1.5px solid;}
footer{padding:40px 48px;border-top:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;opacity:.3;font-size:12px;flex-wrap:wrap;gap:10px;}
@media(max-width:600px){nav{padding:16px 20px;}.links{display:none;}.hero{padding:70px 20px 50px;}.work,.skills{padding:40px 20px;}footer{padding:24px 20px;}}
</style></head><body>
<nav><div class="logo">Alex Design</div><div class="links"><a href="#">Work</a><a href="#">About</a><a href="#">Skills</a><a href="#">Contact</a></div></nav>
<div class="hero">
  <div class="hero-tag">✦ Creative Developer</div>
  <h1>I craft <em>beautiful</em><br>digital experiences</h1>
  <p class="sub">Full-stack designer & developer crafting interfaces that make people feel something. Currently open to freelance.</p>
  <div class="acts"><button class="btn-m">View My Work →</button><button class="btn-o">Get in Touch</button></div>
</div>
<div class="work">
  <div class="w-title">Selected Work</div>
  <div class="w-grid">${p.slice(0, 4).map((c, i) => { const pr = [['Brand Identity', 'Visual Design'], ['Mobile App', 'UI/UX Design'], ['Web Platform', 'Full-stack Dev'], ['3D Motion', 'Creative Dev']]; const em = ['🎨', '📱', '🌐', '🎬']; return `<div class="w-card"><div class="w-img" style="background:linear-gradient(135deg,${c},${p[(i + 1) % p.length]})">${em[i]}</div><div class="w-meta"><h3>${pr[i][0]}</h3><p>${pr[i][1]}</p></div></div>`; }).join('')}</div>
</div>
<div class="skills">
  <div class="s-title">Skills &amp; Tools</div>
  <div class="s-grid">${['Figma', 'React', 'TypeScript', 'Tailwind CSS', 'Motion Design', 'Three.js', 'Node.js', 'Framer'].map((s, i) => `<div class="chip" style="color:${p[i % p.length]};border-color:${p[i % p.length]}44;background:${p[i % p.length]}11">${s}</div>`).join('')}</div>
</div>
<footer><span>© 2025 Alex Design</span><span>Made with ♥ &amp; ChromaStudio</span></footer>
</body></html>`;

      if (type === 'ecommerce') return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Store — ChromaStudio Preview</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:#f8f8f6;color:#111;}
nav{display:flex;align-items:center;justify-content:space-between;padding:0 48px;height:64px;background:#fff;border-bottom:1px solid #eee;position:sticky;top:0;z-index:100;}
.logo{font-weight:800;font-size:18px;letter-spacing:-.5px;color:${c1};}
.links{display:flex;gap:24px;}.links a{text-decoration:none;color:#333;font-size:14px;font-weight:500;}.links a:hover{color:${c2};}
.cart{padding:9px 20px;background:${c1};color:${t1};border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;font-family:'Inter',sans-serif;}
.hero{background:${c1};color:${t1};padding:70px 48px;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;}
.hero h1{font-size:clamp(32px,4vw,54px);font-weight:800;line-height:1.1;letter-spacing:-1.5px;margin-bottom:14px;}
.hero p{opacity:.62;font-size:15px;line-height:1.65;margin-bottom:28px;}
.shop-btn{padding:13px 30px;background:${c2};color:${t2};border:none;border-radius:9px;font-weight:700;cursor:pointer;font-size:14px;font-family:'Inter',sans-serif;}
.hero-vis{background:rgba(255,255,255,.1);border-radius:16px;height:260px;display:flex;align-items:center;justify-content:center;font-size:72px;}
.prods{padding:60px 48px;max-width:1200px;margin:0 auto;}
.p-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#aaa;margin-bottom:20px;}
.p-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px;}
.p-card{background:#fff;border-radius:14px;overflow:hidden;cursor:pointer;transition:box-shadow .2s;}.p-card:hover{box-shadow:0 12px 40px rgba(0,0,0,.12);}
.p-img{height:190px;display:flex;align-items:center;justify-content:center;font-size:48px;}
.p-body{padding:14px;}
.p-name{font-weight:700;font-size:14px;margin-bottom:4px;}
.p-cat{font-size:11px;color:#aaa;margin-bottom:10px;font-weight:500;}
.p-foot{display:flex;align-items:center;justify-content:space-between;}
.p-price{font-size:18px;font-weight:800;color:${c1};}
.add-btn{padding:7px 14px;background:${c2};color:${t2};border:none;border-radius:7px;font-weight:700;cursor:pointer;font-size:12px;font-family:'Inter',sans-serif;}
.banner{background:${c2};color:${t2};padding:44px;text-align:center;max-width:1100px;margin:0 48px 60px;border-radius:16px;}
.banner h2{font-size:28px;font-weight:800;margin-bottom:8px;letter-spacing:-.5px;}
.banner p{opacity:.75;font-size:14px;margin-bottom:20px;}
footer{background:#111;color:#888;padding:32px 48px;display:flex;justify-content:space-between;font-size:12px;flex-wrap:wrap;gap:10px;}
@media(max-width:700px){.hero{grid-template-columns:1fr;padding:44px 20px;}.hero-vis{display:none;}.prods{padding:40px 20px;}.banner{margin:0 20px 40px;padding:30px 20px;}nav{padding:0 20px;}.links{display:none;}footer{padding:24px 20px;}}
</style></head><body>
<nav><div class="logo">✦ Shop</div><div class="links"><a href="#">Men</a><a href="#">Women</a><a href="#">Sale</a><a href="#">New In</a></div><button class="cart">🛒 Cart (0)</button></nav>
<div class="hero">
  <div><h1>New Season,<br>New Colors</h1><p>Discover our latest collection, inspired by ChromaStudio palettes and crafted for modern living.</p><button class="shop-btn">Shop Now →</button></div>
  <div class="hero-vis">🎁</div>
</div>
<div class="prods">
  <div class="p-title">Featured Products</div>
  <div class="p-grid">${p.slice(0, 6).map((c, i) => { const it = [['Palette Tee', 'Apparel', '$42'], ['Studio Mug', 'Home', '$28'], ['Color Book', 'Design', '$59'], ['Gradient Hat', 'Apparel', '$36'], ['Swatch Bag', 'Accessories', '$74'], ['Hue Hoodie', 'Apparel', '$89']]; const em = ['👕', '☕', '📚', '🧢', '👜', '🧥']; return `<div class="p-card"><div class="p-img" style="background:${c}22">${em[i]}</div><div class="p-body"><div class="p-name">${it[i][0]}</div><div class="p-cat">${it[i][1]}</div><div class="p-foot"><div class="p-price">${it[i][2]}</div><button class="add-btn">Add +</button></div></div></div>`; }).join('')}</div>
</div>
<div class="banner"><h2>Summer Sale — Up to 40% Off</h2><p>Limited time offer on all palette-inspired products.</p><button class="shop-btn" style="background:${t2 === '#fff' ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.12)'};color:${t2}">Shop the Sale</button></div>
<footer><span>© 2025 Shop · ChromaStudio Demo</span><span>Returns · Privacy · Terms</span></footer>
</body></html>`;

      return '';
    }

    function openPreview(type) {
      const html = buildSite(type, state.palette);
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); }
      else showToast('Allow pop-ups to open preview');
    }

    function renderPreview() {
      const p = state.palette;
      const cards = [
        { type: 'landing', emoji: '🚀', title: 'Landing Page', desc: 'Hero, features, stats & CTA — full marketing site' },
        { type: 'dashboard', emoji: '📊', title: 'Admin Dashboard', desc: 'KPIs, bar chart, pie chart & data table' },
        { type: 'portfolio', emoji: '🎨', title: 'Portfolio Site', desc: 'Creative portfolio with work grid & skill chips' },
        { type: 'ecommerce', emoji: '🛍️', title: 'E-Commerce Store', desc: 'Product grid, hero banner & checkout UI' }
      ];
      document.getElementById('prev-grid').innerHTML = cards.map(card => `
    <div class="prev-card" onclick="openPreview('${card.type}')">
      <div class="prev-overlay">
        <div class="prev-open-btn">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Open Full Site
        </div>
      </div>
      <div class="prev-inner" style="background:${p[0]};color:${textOn(p[0])}">
        <div style="font-size:32px;margin-bottom:12px">${card.emoji}</div>
        <h4>${card.title}</h4>
        <p>${card.desc}</p>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:10px">
          ${p.map(c => `<div style="width:18px;height:18px;border-radius:4px;background:${c};border:1.5px solid rgba(255,255,255,.18)"></div>`).join('')}
        </div>
        <button class="prev-btn" style="margin-top:14px;background:${p[1] || p[0]};color:${textOn(p[1] || p[0])}">Click to Open →</button>
      </div>
    </div>`).join('');
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
