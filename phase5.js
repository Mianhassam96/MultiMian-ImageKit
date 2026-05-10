// ══════════════════════════════════════════════════════════════
// MultiMian ImageKit — Phase 5
// Centralized State · Accessibility · SS Editable Layers
// Shareable URLs · Mobile UX · Creator Prep · Coherence
// ══════════════════════════════════════════════════════════════

// ── 1. CENTRALIZED APP STATE ──────────────────────────────────
const AppState = (() => {
  const _state = {
    currentAsset:     null,   // { file, blob, name, size, type, w, h }
    workflowHistory:  [],     // [{ tab, ts }]
    exports:          0,
    queue:            [],
    achievements:     {},
    suggestions:      [],
    preferences:      { theme: 'light', lastTab: 'home' },
    ssLayers:         [],     // editable annotation layers
    activeTab:        'home',
  };

  const _listeners = {};

  function get(key) { return key ? _state[key] : { ..._state }; }

  function set(key, value) {
    _state[key] = value;
    (_listeners[key] || []).forEach(fn => fn(value));
    (_listeners['*'] || []).forEach(fn => fn(key, value));
  }

  function on(key, fn) {
    if (!_listeners[key]) _listeners[key] = [];
    _listeners[key].push(fn);
  }

  function setAsset(file, blob) {
    const url = blob ? URL.createObjectURL(blob) : URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      set('currentAsset', {
        file, blob: blob || file,
        name: file.name, size: file.size, type: file.type,
        w: img.naturalWidth, h: img.naturalHeight,
        previewUrl: url
      });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      set('currentAsset', { file, blob: blob || file, name: file.name, size: file.size, type: file.type });
    };
    img.src = url;
  }

  function pushHistory(tab) {
    const h = _state.workflowHistory;
    h.unshift({ tab, ts: Date.now() });
    if (h.length > 30) h.length = 30;
  }

  function incrementExports() {
    set('exports', _state.exports + 1);
  }

  // Sync with existing AssetPipeline if present
  function syncWithPipeline() {
    if (typeof AssetPipeline === 'undefined') return;
    const orig = AssetPipeline.set;
    AssetPipeline.set = function(file, blob, toolName) {
      orig(file, blob, toolName);
      setAsset(file, blob);
      pushHistory(toolName);
    };
  }

  return { get, set, on, setAsset, pushHistory, incrementExports, syncWithPipeline };
})();

// ── 2. ACCESSIBILITY SYSTEM ───────────────────────────────────
const A11y = (() => {
  // Focus trap for modals
  function trapFocus(el) {
    const focusable = el.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    function handler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    el.addEventListener('keydown', handler);
    first.focus();
    return () => el.removeEventListener('keydown', handler);
  }

  // Announce to screen readers
  function announce(msg, priority = 'polite') {
    let live = document.getElementById('a11y-live');
    if (!live) {
      live = document.createElement('div');
      live.id = 'a11y-live';
      live.setAttribute('aria-live', priority);
      live.setAttribute('aria-atomic', 'true');
      live.className = 'sr-only';
      document.body.appendChild(live);
    }
    live.textContent = '';
    requestAnimationFrame(() => { live.textContent = msg; });
  }

  // Add missing ARIA to all tool sections
  function enrichARIA() {
    // Tool sections — role=region with label
    document.querySelectorAll('.tab-section:not(.home-section)').forEach(section => {
      if (!section.getAttribute('role')) section.setAttribute('role', 'region');
      const h2 = section.querySelector('h2');
      if (h2 && !section.getAttribute('aria-labelledby')) {
        if (!h2.id) h2.id = 'heading-' + section.id;
        section.setAttribute('aria-labelledby', h2.id);
      }
    });

    // Drop zones
    document.querySelectorAll('.drop-zone').forEach(zone => {
      if (!zone.getAttribute('role')) {
        zone.setAttribute('role', 'button');
        zone.setAttribute('tabindex', '0');
        if (!zone.getAttribute('aria-label')) zone.setAttribute('aria-label', 'Upload file — click or drag and drop');
      }
      // Enter/Space to trigger file input
      zone.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const input = zone.querySelector('input[type="file"]');
          if (input) input.click();
        }
      });
    });

    // Primary buttons — ensure descriptive labels
    document.querySelectorAll('.primary-btn').forEach(btn => {
      if (!btn.getAttribute('aria-label') && btn.textContent.trim()) {
        btn.setAttribute('aria-label', btn.textContent.trim());
      }
    });

    // Progress bars
    document.querySelectorAll('.progress-bar').forEach(bar => {
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      bar.setAttribute('aria-valuenow', '0');
    });

    // Nav dropdowns
    document.querySelectorAll('.nav-menu-btn').forEach(btn => {
      btn.setAttribute('aria-haspopup', 'true');
      btn.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
      const btn = dropdown.querySelector('.nav-menu-btn');
      const panel = dropdown.querySelector('.nav-dropdown-panel');
      if (btn && panel) {
        const observer = new MutationObserver(() => {
          btn.setAttribute('aria-expanded', dropdown.classList.contains('open') ? 'true' : 'false');
        });
        observer.observe(dropdown, { attributes: true, attributeFilter: ['class'] });
      }
    });

    // Home cards — make keyboard navigable
    document.querySelectorAll('.home-card[data-tab], .workflow-card[data-tab]').forEach(card => {
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (typeof activateTab === 'function') activateTab(card.dataset.tab);
        }
      });
    });
  }

  // Reduced motion
  function respectReducedMotion() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Skip-to-content link
  function addSkipLink() {
    if (document.getElementById('skip-link')) return;
    const link = document.createElement('a');
    link.id = 'skip-link';
    link.href = '#main-content';
    link.className = 'skip-link';
    link.textContent = 'Skip to main content';
    document.body.insertBefore(link, document.body.firstChild);
    const main = document.querySelector('main');
    if (main && !main.id) main.id = 'main-content';
    if (main) main.setAttribute('tabindex', '-1');
  }

  function init() {
    addSkipLink();
    enrichARIA();
    respectReducedMotion();

    // Trap focus in modals when opened
    const modals = ['cmdPalette', 'soModal'];
    modals.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      let release = null;
      const observer = new MutationObserver(() => {
        const visible = el.style.display !== 'none';
        if (visible && !release) release = trapFocus(el);
        if (!visible && release) { release(); release = null; }
      });
      observer.observe(el, { attributes: true, attributeFilter: ['style'] });
    });
  }

  return { init, announce, trapFocus, enrichARIA };
})();

// ── 3. SCREENSHOT STUDIO — EDITABLE LAYERS ───────────────────
const SSLayers = (() => {
  let layers = [];   // [{ id, type, x, y, w, h, text, color, fontSize, emoji, angle }]
  let selected = null;
  let dragging = false;
  let dragOffset = { x: 0, y: 0 };
  let overlayCanvas = null;
  let overlayCtx = null;

  const LAYER_TYPES = ['text', 'arrow', 'highlight', 'blur', 'emoji'];

  function init() {
    const wrap = document.querySelector('.ss-preview-wrap');
    if (!wrap) return;

    // Create overlay canvas on top of ssCanvas
    overlayCanvas = document.createElement('canvas');
    overlayCanvas.id = 'ssOverlay';
    overlayCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;cursor:crosshair;border-radius:8px;';
    overlayCanvas.setAttribute('aria-label', 'Annotation layer — click to add, drag to move');

    const ssCanvas = document.getElementById('ssCanvas');
    if (!ssCanvas) return;
    wrap.style.position = 'relative';
    wrap.appendChild(overlayCanvas);
    overlayCtx = overlayCanvas.getContext('2d');

    // Sync overlay size with ssCanvas
    const syncSize = () => {
      overlayCanvas.width  = ssCanvas.width;
      overlayCanvas.height = ssCanvas.height;
      renderLayers();
    };
    new ResizeObserver(syncSize).observe(ssCanvas);
    syncSize();

    // Pointer events
    overlayCanvas.addEventListener('pointerdown', onPointerDown);
    overlayCanvas.addEventListener('pointermove', onPointerMove);
    overlayCanvas.addEventListener('pointerup',   onPointerUp);
    overlayCanvas.addEventListener('dblclick',    onDblClick);

    // Toolbar
    renderToolbar();
  }

  function renderToolbar() {
    const existing = document.getElementById('ssLayerToolbar');
    if (existing) return;
    const toolbar = document.createElement('div');
    toolbar.id = 'ssLayerToolbar';
    toolbar.className = 'ss-layer-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Annotation tools');
    toolbar.innerHTML = `
      <span class="ss-lt-label">Add Layer</span>
      <button class="ss-lt-btn" data-type="text"      title="Add text">T Text</button>
      <button class="ss-lt-btn" data-type="arrow"     title="Add arrow">→ Arrow</button>
      <button class="ss-lt-btn" data-type="highlight" title="Highlight area">▭ Highlight</button>
      <button class="ss-lt-btn" data-type="blur"      title="Blur region">⬜ Blur</button>
      <button class="ss-lt-btn" data-type="emoji"     title="Add emoji">😀 Emoji</button>
      <div class="ss-lt-sep"></div>
      <input type="color" id="ssLayerColor" value="#ffffff" title="Layer color" class="ss-lt-color">
      <input type="number" id="ssLayerSize" value="24" min="10" max="120" title="Font size" class="ss-lt-size">
      <div class="ss-lt-sep"></div>
      <button class="ss-lt-btn ss-lt-danger" id="ssLayerDelete" title="Delete selected">✕ Delete</button>
      <button class="ss-lt-btn" id="ssLayerClear" title="Clear all layers">🗑 Clear All</button>
    `;
    const wrap = document.querySelector('.ss-preview-wrap');
    if (wrap) wrap.parentNode.insertBefore(toolbar, wrap);

    toolbar.querySelectorAll('.ss-lt-btn[data-type]').forEach(btn => {
      btn.addEventListener('click', () => addLayer(btn.dataset.type));
    });
    document.getElementById('ssLayerDelete')?.addEventListener('click', deleteSelected);
    document.getElementById('ssLayerClear')?.addEventListener('click', clearAll);
    document.getElementById('ssLayerColor')?.addEventListener('input', updateSelectedColor);
    document.getElementById('ssLayerSize')?.addEventListener('input', updateSelectedSize);
  }

  function addLayer(type) {
    const canvas = document.getElementById('ssCanvas');
    if (!canvas) return;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const color = document.getElementById('ssLayerColor')?.value || '#ffffff';
    const fontSize = parseInt(document.getElementById('ssLayerSize')?.value || '24');

    const layer = {
      id: Date.now(),
      type,
      x: cx - 60 + Math.random() * 40,
      y: cy - 20 + Math.random() * 40,
      w: type === 'highlight' || type === 'blur' ? 160 : 120,
      h: type === 'highlight' || type === 'blur' ? 60  : 40,
      text:     type === 'text'  ? 'Double-click to edit' : '',
      emoji:    type === 'emoji' ? '⭐' : '',
      color,
      fontSize,
      angle: 0,
    };
    layers.push(layer);
    selected = layer.id;
    renderLayers();
    A11y.announce(`${type} layer added`);
  }

  function renderLayers() {
    if (!overlayCtx || !overlayCanvas) return;
    const c = overlayCtx;
    c.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    layers.forEach(layer => {
      c.save();
      c.translate(layer.x + layer.w / 2, layer.y + layer.h / 2);
      c.rotate((layer.angle || 0) * Math.PI / 180);
      c.translate(-(layer.w / 2), -(layer.h / 2));

      if (layer.type === 'text') {
        c.font = `bold ${layer.fontSize}px Plus Jakarta Sans, system-ui`;
        c.fillStyle = layer.color;
        c.textBaseline = 'middle';
        c.shadowColor = 'rgba(0,0,0,0.5)';
        c.shadowBlur = 4;
        c.fillText(layer.text, 0, layer.h / 2);
        c.shadowBlur = 0;
      } else if (layer.type === 'arrow') {
        c.strokeStyle = layer.color;
        c.lineWidth = Math.max(2, layer.fontSize / 12);
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(0, layer.h / 2);
        c.lineTo(layer.w - 16, layer.h / 2);
        c.stroke();
        // Arrowhead
        c.fillStyle = layer.color;
        c.beginPath();
        c.moveTo(layer.w, layer.h / 2);
        c.lineTo(layer.w - 16, layer.h / 2 - 8);
        c.lineTo(layer.w - 16, layer.h / 2 + 8);
        c.closePath();
        c.fill();
      } else if (layer.type === 'highlight') {
        c.fillStyle = layer.color.replace('#', '') === 'ffffff'
          ? 'rgba(255,235,59,0.45)'
          : layer.color + '70';
        c.fillRect(0, 0, layer.w, layer.h);
        c.strokeStyle = layer.color;
        c.lineWidth = 1.5;
        c.strokeRect(0, 0, layer.w, layer.h);
      } else if (layer.type === 'blur') {
        c.filter = 'blur(8px)';
        c.fillStyle = 'rgba(0,0,0,0.3)';
        c.fillRect(0, 0, layer.w, layer.h);
        c.filter = 'none';
        c.strokeStyle = 'rgba(255,255,255,0.4)';
        c.lineWidth = 1.5;
        c.setLineDash([4, 4]);
        c.strokeRect(0, 0, layer.w, layer.h);
        c.setLineDash([]);
      } else if (layer.type === 'emoji') {
        c.font = `${layer.fontSize * 1.5}px serif`;
        c.textBaseline = 'middle';
        c.fillText(layer.emoji, 0, layer.h / 2);
      }

      // Selection ring
      if (layer.id === selected) {
        c.strokeStyle = '#0ea5e9';
        c.lineWidth = 2;
        c.setLineDash([5, 3]);
        c.strokeRect(-4, -4, layer.w + 8, layer.h + 8);
        c.setLineDash([]);
        // Resize handle
        c.fillStyle = '#0ea5e9';
        c.fillRect(layer.w + 2, layer.h + 2, 10, 10);
      }

      c.restore();
    });
  }

  function hitTest(x, y) {
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      if (x >= l.x - 4 && x <= l.x + l.w + 4 && y >= l.y - 4 && y <= l.y + l.h + 4) {
        return l;
      }
    }
    return null;
  }

  function getCanvasPos(e) {
    const rect = overlayCanvas.getBoundingClientRect();
    const scaleX = overlayCanvas.width  / rect.width;
    const scaleY = overlayCanvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  }

  function onPointerDown(e) {
    const pos = getCanvasPos(e);
    const hit = hitTest(pos.x, pos.y);
    if (hit) {
      selected = hit.id;
      dragging = true;
      dragOffset = { x: pos.x - hit.x, y: pos.y - hit.y };
      overlayCanvas.setPointerCapture(e.pointerId);
    } else {
      selected = null;
    }
    renderLayers();
  }

  function onPointerMove(e) {
    if (!dragging || !selected) return;
    const pos = getCanvasPos(e);
    const layer = layers.find(l => l.id === selected);
    if (layer) {
      layer.x = pos.x - dragOffset.x;
      layer.y = pos.y - dragOffset.y;
      renderLayers();
    }
  }

  function onPointerUp() { dragging = false; }

  function onDblClick(e) {
    const pos = getCanvasPos(e);
    const hit = hitTest(pos.x, pos.y);
    if (!hit) return;
    if (hit.type === 'text') {
      const text = prompt('Edit text:', hit.text);
      if (text !== null) { hit.text = text; renderLayers(); }
    } else if (hit.type === 'emoji') {
      const emoji = prompt('Enter emoji:', hit.emoji);
      if (emoji !== null) { hit.emoji = emoji; renderLayers(); }
    }
  }

  function deleteSelected() {
    layers = layers.filter(l => l.id !== selected);
    selected = null;
    renderLayers();
  }

  function clearAll() {
    layers = [];
    selected = null;
    renderLayers();
  }

  function updateSelectedColor() {
    const color = document.getElementById('ssLayerColor')?.value;
    const layer = layers.find(l => l.id === selected);
    if (layer && color) { layer.color = color; renderLayers(); }
  }

  function updateSelectedSize() {
    const size = parseInt(document.getElementById('ssLayerSize')?.value || '24');
    const layer = layers.find(l => l.id === selected);
    if (layer) { layer.fontSize = size; renderLayers(); }
  }

  // Composite layers onto export canvas
  function compositeOnto(exportCanvas) {
    if (!layers.length || !overlayCanvas) return;
    const ctx = exportCanvas.getContext('2d');
    const scaleX = exportCanvas.width  / overlayCanvas.width;
    const scaleY = exportCanvas.height / overlayCanvas.height;
    ctx.save();
    ctx.scale(scaleX, scaleY);
    ctx.drawImage(overlayCanvas, 0, 0);
    ctx.restore();
  }

  return { init, compositeOnto, getLayers: () => layers };
})();
