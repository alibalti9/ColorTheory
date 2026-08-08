/**
 * kelyqo – Custom Color Picker
 * Replaces <input type="color"> with a high-performance, fully-accessible panel.
 *
 * Public API (attached to window.ChromaPicker):
 *   ChromaPicker.open(triggerEl, currentHex, onChangeFn, onCommitFn?)
 *   ChromaPicker.close()
 *   ChromaPicker.isOpen()
 *
 * Each <button class="ctx-cpick"> or any element with [data-picker] is a trigger.
 * The picker renders into a portal div appended to <body> so overflow:hidden never clips it.
 */

(function (global) {
  'use strict';

  // ─────────────────────────────────────────────
  // CONSTANTS
  // ─────────────────────────────────────────────
  const SV_SIZE   = 200;   // px – square SV canvas
  const HUE_H     = 14;    // px – hue slider track height
  const PRESETS = [
    '#FF6B6B','#FF8E53','#FFC107','#A8E063','#56CCF2',
    '#7C6AFF','#C084FC','#F472B6','#34D399','#38BDF8',
    '#1E293B','#475569','#94A3B8','#F1F5F9','#FFFFFF',
  ];

  // ─────────────────────────────────────────────
  // COLOUR MATH (self-contained, no external deps)
  // ─────────────────────────────────────────────
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  function rgbToHex(r, g, b) {
    const ch = v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
    return '#' + ch(r) + ch(g) + ch(b);
  }

  /** @returns [h°, s%, l%] */
  function hexToHsl(hex) {
    let [r, g, b] = hexToRgb(hex);
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return [h * 360, s * 100, l * 100];
  }

  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const ch = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toH = v => Math.round(v * 255).toString(16).padStart(2, '0');
    return '#' + toH(ch(0)) + toH(ch(8)) + toH(ch(4));
  }

  /**
   * HSV → HSL conversion (HSV is what the SV canvas works in)
   * @param {number} h   0-360
   * @param {number} s   0-1
   * @param {number} v   0-1
   * @returns [h°, s%, l%]
   */
  function hsvToHsl(h, s, v) {
    const l = v * (1 - s / 2);
    const sl = (l === 0 || l === 1) ? 0 : (v - l) / Math.min(l, 1 - l);
    return [h, sl * 100, l * 100];
  }

  /**
   * HSL → HSV
   * @returns [h, s(0-1), v(0-1)]
   */
  function hslToHsv(h, s, l) {
    s /= 100; l /= 100;
    const v = l + s * Math.min(l, 1 - l);
    const sv = v === 0 ? 0 : 2 * (1 - l / v);
    return [h, sv, v];
  }

  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────
  let _panel      = null;   // portal DOM node
  let _trigger    = null;   // the button that opened the picker
  let _onChange   = null;   // called live while dragging
  let _onCommit   = null;   // called on Apply / close-confirm

  // Internal working color in HSV
  let _hue  = 0;   // 0-360
  let _sat  = 1;   // 0-1  (saturation in HSV)
  let _val  = 1;   // 0-1  (value / brightness in HSV)

  // Currently committed hex (what gets emitted)
  let _hex  = '#FF0000';

  // Drag state
  let _draggingSV  = false;
  let _draggingHue = false;

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  function currentHex() {
    const [h, s, l] = hsvToHsl(_hue, _sat, _val);
    return hslToHex(h, s, l);
  }

  function setFromHex(hex) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
    _hex = hex;
    const [h, s, l] = hexToHsl(hex);
    [_hue, _sat, _val] = hslToHsv(h, s, l);
  }

  // ─────────────────────────────────────────────
  // CANVAS DRAWING
  // ─────────────────────────────────────────────
  function drawSV(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // White → Hue gradient (left-right saturation)
    const satGrad = ctx.createLinearGradient(0, 0, W, 0);
    satGrad.addColorStop(0, '#ffffff');
    satGrad.addColorStop(1, `hsl(${_hue}, 100%, 50%)`);
    ctx.fillStyle = satGrad;
    ctx.fillRect(0, 0, W, H);

    // Transparent → Black gradient (top-bottom value)
    const valGrad = ctx.createLinearGradient(0, 0, 0, H);
    valGrad.addColorStop(0, 'rgba(0,0,0,0)');
    valGrad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = valGrad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawHueRail(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    const stops = [0, 60, 120, 180, 240, 300, 360];
    stops.forEach(s => grad.addColorStop(s / 360, `hsl(${s},100%,50%)`));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // ─────────────────────────────────────────────
  // THUMB POSITIONING
  // ─────────────────────────────────────────────
  function updateSVThumb() {
    const thumb = _panel.querySelector('.cp-sv-thumb');
    if (!thumb) return;
    const canvas = _panel.querySelector('.cp-sv-canvas');
    const W = canvas.clientWidth, H = canvas.clientHeight;
    thumb.style.left = (_sat * W - 7) + 'px';
    thumb.style.top  = ((1 - _val) * H - 7) + 'px';
  }

  function updateHueThumb() {
    const thumb = _panel.querySelector('.cp-hue-thumb');
    if (!thumb) return;
    const rail = _panel.querySelector('.cp-hue-rail');
    const W = rail.clientWidth;
    thumb.style.left = (_hue / 360 * W - 7) + 'px';
  }

  // ─────────────────────────────────────────────
  // UI SYNC — called whenever color changes
  // ─────────────────────────────────────────────
  function syncUI(redrawSV) {
    if (!_panel) return;
    _hex = currentHex();

    // Swatch
    const swatch = _panel.querySelector('.cp-preview-swatch');
    if (swatch) swatch.style.background = _hex;

    // Redraw SV canvas when hue changes
    if (redrawSV) {
      const svCanvas = _panel.querySelector('.cp-sv-canvas');
      if (svCanvas) drawSV(svCanvas);
    }

    // Thumb positions
    updateSVThumb();
    updateHueThumb();

    // Hex input (only update if not currently focused to avoid caret jumps)
    const hexInput = _panel.querySelector('.cp-hex-input');
    if (hexInput && document.activeElement !== hexInput) {
      hexInput.value = _hex.slice(1).toUpperCase();
    }

    // HSL readout
    const [h, s, l] = hexToHsl(_hex);
    const hslEl = _panel.querySelector('.cp-hsl-readout');
    if (hslEl) {
      hslEl.textContent =
        `${Math.round(h)}° ${Math.round(s)}% ${Math.round(l)}%`;
    }

    // Fire live callback
    if (_onChange) _onChange(_hex);
  }

  // ─────────────────────────────────────────────
  // POINTER EVENT HELPERS
  // ─────────────────────────────────────────────
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function svPointerToHSV(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    const y = clamp(e.clientY - rect.top,  0, rect.height);
    _sat = x / rect.width;
    _val = 1 - y / rect.height;
  }

  function huePointerToHue(e, rail) {
    const rect = rail.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    _hue = x / rect.width * 360;
  }

  // ─────────────────────────────────────────────
  // BUILD PANEL DOM
  // ─────────────────────────────────────────────
  function buildPanel() {
    const el = document.createElement('div');
    el.id   = 'cp-portal';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Color Picker');

    el.innerHTML = `
      <div class="cp-panel" id="cp-panel-inner">

        <!-- ── SV CANVAS ── -->
        <div class="cp-sv-wrap" style="position:relative;touch-action:none;">
          <canvas class="cp-sv-canvas" width="${SV_SIZE}" height="${SV_SIZE}"></canvas>
          <div class="cp-sv-thumb" aria-hidden="true"></div>
        </div>

        <!-- ── HUE RAIL ── -->
        <div class="cp-hue-wrap" style="position:relative;touch-action:none;">
          <canvas class="cp-hue-rail" width="${SV_SIZE}" height="${HUE_H}"></canvas>
          <div class="cp-hue-thumb" aria-hidden="true"></div>
        </div>

        <!-- ── PREVIEW + HEX ── -->
        <div class="cp-row cp-row--preview">
          <div class="cp-preview-swatch" aria-hidden="true"></div>
          <div class="cp-hex-wrap">
            <span class="cp-hex-hash">#</span>
            <input
              class="cp-hex-input"
              type="text"
              maxlength="6"
              spellcheck="false"
              autocomplete="off"
              aria-label="Hex color value"
              placeholder="RRGGBB"
            >
            <button class="cp-copy-btn" aria-label="Copy hex value" title="Copy hex">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- ── HSL READOUT ── -->
        <div class="cp-row cp-row--hsl">
          <span class="cp-hsl-label">HSL</span>
          <span class="cp-hsl-readout">0° 0% 50%</span>
        </div>

        <!-- ── PRESETS ── -->
        <div class="cp-presets" role="group" aria-label="Color presets">
          ${PRESETS.map(c => `
            <button
              class="cp-preset"
              style="background:${c}"
              data-color="${c}"
              aria-label="Preset ${c}"
              title="${c}"
            ></button>
          `).join('')}
        </div>

        <!-- ── ACTIONS ── -->
        <div class="cp-row cp-row--actions">
          <button class="cp-btn cp-btn--cancel">Cancel</button>
          <button class="cp-btn cp-btn--apply">Apply</button>
        </div>

      </div>
    `;

    return el;
  }

  // ─────────────────────────────────────────────
  // FOCUS TRAP
  // ─────────────────────────────────────────────
  const FOCUSABLE = 'button, input, [tabindex]:not([tabindex="-1"])';

  function trapFocus(e) {
    if (!_panel) return;
    const focusable = Array.from(_panel.querySelectorAll(FOCUSABLE))
      .filter(el => !el.disabled);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  // ─────────────────────────────────────────────
  // OPEN / CLOSE
  // ─────────────────────────────────────────────
  function open(triggerEl, initialHex, onChangeFn, onCommitFn) {
    if (_panel) close(false); // close any existing without firing commit

    _trigger  = triggerEl;
    _onChange  = onChangeFn  || null;
    _onCommit  = onCommitFn  || onChangeFn || null;

    setFromHex(initialHex || '#FF0000');

    _panel = buildPanel();
    document.body.appendChild(_panel);

    // Initial draw
    const svCanvas = _panel.querySelector('.cp-sv-canvas');
    const hueRail  = _panel.querySelector('.cp-hue-rail');
    drawSV(svCanvas);
    drawHueRail(hueRail);
    syncUI(false);

    // Position
    positionPanel();

    // Wire events
    wireEvents();

    // Focus the hex input
    requestAnimationFrame(() => {
      const hexInput = _panel.querySelector('.cp-hex-input');
      if (hexInput) hexInput.focus();
    });

    // Outside click
    setTimeout(() => {
      document.addEventListener('pointerdown', outsideClick, true);
    }, 0);

    // Keyboard
    document.addEventListener('keydown', onKeydown, true);
  }

  function close(commit) {
    if (!_panel) return;
    if (commit && _onCommit) _onCommit(_hex);

    document.removeEventListener('pointerdown', outsideClick, true);
    document.removeEventListener('keydown', onKeydown, true);
    document.removeEventListener('pointermove', onSVMove);
    document.removeEventListener('pointerup',   onSVUp);
    document.removeEventListener('pointermove', onHueMove);
    document.removeEventListener('pointerup',   onHueUp);

    _panel.remove();
    _panel = null;

    // Return focus to trigger
    if (_trigger && typeof _trigger.focus === 'function') {
      _trigger.focus();
    }
  }

  // ─────────────────────────────────────────────
  // VIEWPORT-AWARE POSITIONING
  // ─────────────────────────────────────────────
  function positionPanel() {
    if (!_panel || !_trigger) return;
    const MARGIN   = 10;
    const inner    = _panel.querySelector('#cp-panel-inner');
    const tRect    = _trigger.getBoundingClientRect();
    const pW       = inner.offsetWidth  || 240;
    const pH       = inner.offsetHeight || 370;
    const vW       = window.innerWidth;
    const vH       = window.innerHeight;

    // Prefer opening below-right; flip if near edges
    let top  = tRect.bottom + MARGIN;
    let left = tRect.left;

    if (left + pW + MARGIN > vW)  left  = tRect.right - pW;
    if (left < MARGIN)             left  = MARGIN;
    if (top  + pH + MARGIN > vH)  top   = tRect.top - pH - MARGIN;
    if (top  < MARGIN)             top   = MARGIN;

    _panel.style.top  = top  + 'px';
    _panel.style.left = left + 'px';
  }

  // ─────────────────────────────────────────────
  // EVENT WIRING
  // ─────────────────────────────────────────────
  function wireEvents() {
    // ── SV canvas ──
    const svCanvas = _panel.querySelector('.cp-sv-canvas');
    const svWrap   = _panel.querySelector('.cp-sv-wrap');

    svWrap.addEventListener('pointerdown', e => {
      e.preventDefault();
      svWrap.setPointerCapture(e.pointerId);
      _draggingSV = true;
      svPointerToHSV(e, svCanvas);
      syncUI(false);
    });
    svWrap.addEventListener('pointermove', e => {
      if (!_draggingSV) return;
      e.preventDefault();
      svPointerToHSV(e, svCanvas);
      syncUI(false);
    });
    svWrap.addEventListener('pointerup', e => {
      if (!_draggingSV) return;
      _draggingSV = false;
      svPointerToHSV(e, svCanvas);
      syncUI(false);
    });
    svWrap.addEventListener('pointercancel', () => { _draggingSV = false; });

    // ── Hue rail ──
    const hueRail = _panel.querySelector('.cp-hue-rail');
    const hueWrap = _panel.querySelector('.cp-hue-wrap');

    hueWrap.addEventListener('pointerdown', e => {
      e.preventDefault();
      hueWrap.setPointerCapture(e.pointerId);
      _draggingHue = true;
      huePointerToHue(e, hueRail);
      syncUI(true);  // redraw SV gradient on hue change
    });
    hueWrap.addEventListener('pointermove', e => {
      if (!_draggingHue) return;
      e.preventDefault();
      huePointerToHue(e, hueRail);
      syncUI(true);
    });
    hueWrap.addEventListener('pointerup', e => {
      if (!_draggingHue) return;
      _draggingHue = false;
      huePointerToHue(e, hueRail);
      syncUI(true);
    });
    hueWrap.addEventListener('pointercancel', () => { _draggingHue = false; });

    // ── Hex input ──
    const hexInput = _panel.querySelector('.cp-hex-input');
    hexInput.addEventListener('input', () => {
      const raw = hexInput.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
      hexInput.value = raw.toUpperCase();
      if (raw.length === 6) {
        setFromHex('#' + raw);
        syncUI(true);
      }
    });
    hexInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const raw = hexInput.value.replace(/[^0-9A-Fa-f]/g, '');
        if (raw.length === 6) {
          setFromHex('#' + raw);
          syncUI(true);
        }
        close(true);
      }
    });
    hexInput.addEventListener('blur', () => {
      // Revert display to current valid hex if incomplete
      const raw = hexInput.value.replace(/[^0-9A-Fa-f]/g, '');
      if (raw.length !== 6) {
        hexInput.value = _hex.slice(1).toUpperCase();
      }
    });

    // ── Copy button ──
    const copyBtn = _panel.querySelector('.cp-copy-btn');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(_hex).then(() => {
        copyBtn.classList.add('cp-copy-btn--success');
        copyBtn.setAttribute('aria-label', 'Copied!');
        setTimeout(() => {
          copyBtn.classList.remove('cp-copy-btn--success');
          copyBtn.setAttribute('aria-label', 'Copy hex value');
        }, 1600);
      }).catch(() => {
        // Fallback for non-secure contexts
        const ta = document.createElement('textarea');
        ta.value = _hex;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        copyBtn.classList.add('cp-copy-btn--success');
        setTimeout(() => copyBtn.classList.remove('cp-copy-btn--success'), 1600);
      });
    });

    // ── Presets ──
    _panel.querySelectorAll('.cp-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        setFromHex(btn.dataset.color);
        syncUI(true);
      });
    });

    // ── Cancel / Apply ──
    _panel.querySelector('.cp-btn--cancel').addEventListener('click', () => {
      // Revert to the original hex that was passed in on open
      if (_onChange) _onChange(_hex);  // already synced, no revert needed — caller manages revert
      close(false);
    });
    _panel.querySelector('.cp-btn--apply').addEventListener('click', () => {
      close(true);
    });

    // ── Focus trap ──
    _panel.addEventListener('keydown', trapFocus);
  }

  // ─────────────────────────────────────────────
  // GLOBAL EVENT HANDLERS
  // ─────────────────────────────────────────────
  function outsideClick(e) {
    if (!_panel) return;
    // Allow clicks inside the panel and on the trigger
    if (_panel.contains(e.target)) return;
    if (_trigger && _trigger.contains(e.target)) return;
    close(true);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close(false);
    }
  }

  // Stubs for document-level drag (kept for safety, not used with setPointerCapture)
  function onSVMove()  {}
  function onSVUp()    {}
  function onHueMove() {}
  function onHueUp()   {}

  // ─────────────────────────────────────────────
  // TRIGGER INITIALISATION
  // ─────────────────────────────────────────────

  /**
   * Wire a swatch button as a picker trigger.
   * @param {HTMLElement} el  – The .ctx-cpick button
   * @param {function}    getHex  – () => currentHex
   * @param {function}    setHex  – (hex) => void  (live + commit)
   */
  function initTrigger(el, getHex, setHex) {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (_panel && _trigger === el) {
        close(true);
        return;
      }
      open(el, getHex(), setHex, setHex);
    });
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────
  global.ChromaPicker = {
    open,
    /** close(commit=true) — pass false to discard */
    close(commit) { close(commit !== false); },
    isOpen: () => !!_panel,
    /** Expose current trigger element for open-guard checks */
    get _trigger() { return _trigger; },
    initTrigger,
    setFromHex,
    /** Convenience: open from a data-picker attribute element */
    bindAll() {
      document.querySelectorAll('[data-picker]').forEach(el => {
        const target = el.dataset.pickerTarget;
        const cb     = el.dataset.pickerCallback;
        if (target && global[cb]) {
          initTrigger(el, () => el.dataset.pickerValue || '#FF0000', global[cb]);
        }
      });
    },
  };

})(window);
