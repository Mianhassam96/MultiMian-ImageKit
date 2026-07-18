// ══════════════════════════════════════════════════════════════
// MultiMian ImageKit — Phase 5
// Accessibility · SS Editable Layers · Shareable URLs
// Centralized State · Coherence Pass
// ══════════════════════════════════════════════════════════════

// ── 1. CENTRALIZED APP STATE ──────────────────────────────────
const AppState = (() => {
  const _state = {
    currentAsset:    null,
    workflowHistory: [],
    exports:         0,
    activeTab:       'home',
  };
  const _listeners = {};

  function get(key) { return key ? _state[key] : { ..._state }; }

  function set(key, value) {
    _state[key] = value;
    (_listeners[key] || []).forEach(fn => fn(value));
  }

  function on(key, fn) {
    if (!_listeners[key]) _listeners[key] = [];
    _listeners[key].push(fn);
  }

  function setAsset(file, blob) {
    const src = URL.createObjectURL(blob || file);
    const img = new Image();
    img.onload = () => {
      set('currentAsset', {
        file, blob: blob || file,
        name: file.name, size: file.size, type: file.type,
        w: img.naturalWidth, h: img.naturalHeight,
      });
      URL.revokeObjectURL(src);
    };
    img.onerror = () => {
      set('currentAsset', { file, blob: blob || file, name: file.name, size: file.size, type: file.type });
      URL.revokeObjectURL(src);
    };
    img.src = src;
  }

  function pushHistory(tab) {
    const h = _state.workflowHistory;
    h.unshift({ tab, ts: Date.now() });
    if (h.length > 30) h.length = 30;
  }

  // Sync with existing AssetPipeline
  function syncWithPipeline() {
    if (typeof AssetPipeline === 'undefined') return;
    const orig = AssetPipeline.set.bind(AssetPipeline);
    AssetPipeline.set = function(file, blob, toolName) {
      orig(file, blob, toolName);
      setAsset(file, blob);
      pushHistory(toolName);
    };
  }

  return { get, set, on, setAsset, pushHistory, syncWithPipeline };
})();

// ── 2. ACCESSIBILITY ──────────────────────────────────────────
const A11y = (() => {
  function trapFocus(el) {
    const sel = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const nodes = [...el.querySelectorAll(sel)];
    if (!nodes.length) return () => {};
    const first = nodes[0], last = nodes[nodes.length - 1];
    function handler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
    }
    el.addEventListener('keydown', handler);
    setTimeout(() => first.focus(), 50);
    return () => el.removeEventListener('keydown', handler);
  }

  function announce(msg) {
    let live = document.getElementById('a11y-live');
    if (!live) {
      live = document.createElement('div');
      live.id = 'a11y-live';
      live.setAttribute('aria-live', 'polite');
      live.setAttribute('aria-atomic', 'true');
      live.className = 'sr-only';
      document.body.appendChild(live);
    }
    live.textContent = '';
    requestAnimationFrame(() => { live.textContent = msg; });
  }

  function enrichARIA() {
    // Tool sections
    document.querySelectorAll('.tab-section:not(.home-section)').forEach(section => {
      if (!section.getAttribute('role')) section.setAttribute('role', 'region');
      const h2 = section.querySelector('h2');
      if (h2) {
        if (!h2.id) h2.id = 'heading-' + section.id;
        section.setAttribute('aria-labelledby', h2.id);
      }
    });

    // Drop zones — keyboard accessible
    document.querySelectorAll('.drop-zone').forEach(zone => {
      if (!zone.getAttribute('role')) {
        zone.setAttribute('role', 'button');
        zone.setAttribute('tabindex', '0');
        zone.setAttribute('aria-label', 'Upload file — click or drag and drop');
      }
      zone.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          zone.querySelector('input[type="file"]')?.click();
        }
      });
    });

    // Home/workflow cards
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

    // Nav dropdown ARIA
    document.querySelectorAll('.nav-menu-btn').forEach(btn => {
      btn.setAttribute('aria-haspopup', 'true');
      btn.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.nav-dropdown').forEach(dd => {
      const btn = dd.querySelector('.nav-menu-btn');
      if (!btn) return;
      new MutationObserver(() => {
        btn.setAttribute('aria-expanded', dd.classList.contains('open') ? 'true' : 'false');
      }).observe(dd, { attributes: true, attributeFilter: ['class'] });
    });

    // Progress bars
    document.querySelectorAll('.progress-bar').forEach(bar => {
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      bar.setAttribute('aria-valuenow', '0');
    });
  }

  function addSkipLink() {
    if (document.getElementById('skip-link')) return;
    const a = document.createElement('a');
    a.id = 'skip-link'; a.href = '#main-content';
    a.className = 'skip-link'; a.textContent = 'Skip to main content';
    document.body.insertBefore(a, document.body.firstChild);
    const main = document.querySelector('main');
    if (main) { main.id = 'main-content'; main.setAttribute('tabindex', '-1'); }
  }

  function respectReducedMotion() {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const s = document.createElement('style');
    s.textContent = `*, *::before, *::after { animation-duration:0.01ms!important; transition-duration:0.01ms!important; }`;
    document.head.appendChild(s);
  }

  function init() {
    addSkipLink();
    enrichARIA();
    respectReducedMotion();

    // Focus trap for modals
    ['cmdPalette', 'soModal'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      let release = null;
      new MutationObserver(() => {
        const visible = el.style.display !== 'none';
        if (visible && !release) release = trapFocus(el);
        if (!visible && release) { release(); release = null; }
      }).observe(el, { attributes: true, attributeFilter: ['style'] });
    });
  }

  return { init, announce, trapFocus };
})();

// ── 3. SCREENSHOT STUDIO — EDITABLE ANNOTATION LAYERS ────────
const SSLayers = (() => {
  let layers = [];
  let selected = null;
  let dragging = false;
  let dragOffset = { x: 0, y: 0 };
  let overlayCanvas = null;
  let overlayCtx = null;

  function init() {
    const ssCanvas = document.getElementById('ssCanvas');
    const wrap = document.querySelector('.ss-preview-wrap');
    if (!ssCanvas || !wrap) return;

    overlayCanvas = document.createElement('canvas');
    overlayCanvas.id = 'ssOverlay';
    overlayCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;cursor:crosshair;border-radius:8px;pointer-events:auto;';
    overlayCanvas.setAttribute('aria-label', 'Annotation layer');
    wrap.style.position = 'relative';
    wrap.appendChild(overlayCanvas);
    overlayCtx = overlayCanvas.getContext('2d');

    const syncSize = () => {
      overlayCanvas.width  = ssCanvas.width  || 800;
      overlayCanvas.height = ssCanvas.height || 600;
      renderLayers();
    };
    new ResizeObserver(syncSize).observe(ssCanvas);
    syncSize();

    overlayCanvas.addEventListener('pointerdown', onDown);
    overlayCanvas.addEventListener('pointermove', onMove);
    overlayCanvas.addEventListener('pointerup',   onUp);
    overlayCanvas.addEventListener('dblclick',    onDbl);

    injectToolbar();
  }

  function injectToolbar() {
    if (document.getElementById('ssLayerToolbar')) return;
    const tb = document.createElement('div');
    tb.id = 'ssLayerToolbar';
    tb.className = 'ss-layer-toolbar';
    tb.innerHTML = `
      <span class="ss-lt-label">Annotate</span>
      <button class="ss-lt-btn" data-type="text"      title="Text">T</button>
      <button class="ss-lt-btn" data-type="arrow"     title="Arrow">→</button>
      <button class="ss-lt-btn" data-type="highlight" title="Highlight">▭</button>
      <button class="ss-lt-btn" data-type="blur"      title="Blur">⬜</button>
      <button class="ss-lt-btn" data-type="emoji"     title="Emoji">⭐</button>
      <div class="ss-lt-sep"></div>
      <input type="color" id="ssLayerColor" value="#ffffff" title="Color" class="ss-lt-color">
      <input type="number" id="ssLayerSize" value="24" min="10" max="120" title="Size" class="ss-lt-size" style="width:52px;">
      <div class="ss-lt-sep"></div>
      <button class="ss-lt-btn ss-lt-danger" id="ssLayerDelete" title="Delete selected">✕</button>
      <button class="ss-lt-btn" id="ssLayerClear" title="Clear all">🗑</button>
    `;
    const wrap = document.querySelector('.ss-preview-wrap');
    if (wrap) wrap.parentNode.insertBefore(tb, wrap);

    tb.querySelectorAll('.ss-lt-btn[data-type]').forEach(b => b.addEventListener('click', () => addLayer(b.dataset.type)));
    document.getElementById('ssLayerDelete')?.addEventListener('click', deleteSelected);
    document.getElementById('ssLayerClear')?.addEventListener('click', clearAll);
    document.getElementById('ssLayerColor')?.addEventListener('input', updateColor);
    document.getElementById('ssLayerSize')?.addEventListener('input', updateSize);
  }

  function addLayer(type) {
    const c = document.getElementById('ssCanvas');
    if (!c) return;
    const color = document.getElementById('ssLayerColor')?.value || '#ffffff';
    const fontSize = parseInt(document.getElementById('ssLayerSize')?.value || '24');
    layers.push({
      id: Date.now(), type,
      x: c.width / 2 - 60 + Math.random() * 30,
      y: c.height / 2 - 20 + Math.random() * 30,
      w: (type === 'highlight' || type === 'blur') ? 160 : 120,
      h: (type === 'highlight' || type === 'blur') ? 60  : 40,
      text: type === 'text'  ? 'Double-click to edit' : '',
      emoji: type === 'emoji' ? '⭐' : '',
      color, fontSize,
    });
    selected = layers[layers.length - 1].id;
    renderLayers();
    A11y.announce(type + ' layer added');
  }

  function renderLayers() {
    if (!overlayCtx || !overlayCanvas) return;
    const ctx = overlayCtx;
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    layers.forEach(l => {
      ctx.save();
      ctx.translate(l.x + l.w / 2, l.y + l.h / 2);
      ctx.translate(-l.w / 2, -l.h / 2);

      if (l.type === 'text') {
        ctx.font = `bold ${l.fontSize}px Plus Jakarta Sans,system-ui`;
        ctx.fillStyle = l.color;
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 4;
        ctx.fillText(l.text, 0, l.h / 2);
        ctx.shadowBlur = 0;
      } else if (l.type === 'arrow') {
        ctx.strokeStyle = l.color; ctx.lineWidth = Math.max(2, l.fontSize / 12);
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, l.h / 2); ctx.lineTo(l.w - 16, l.h / 2); ctx.stroke();
        ctx.fillStyle = l.color;
        ctx.beginPath(); ctx.moveTo(l.w, l.h / 2); ctx.lineTo(l.w - 16, l.h / 2 - 8); ctx.lineTo(l.w - 16, l.h / 2 + 8); ctx.closePath(); ctx.fill();
      } else if (l.type === 'highlight') {
        ctx.fillStyle = 'rgba(255,235,59,0.45)'; ctx.fillRect(0, 0, l.w, l.h);
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5; ctx.strokeRect(0, 0, l.w, l.h);
      } else if (l.type === 'blur') {
        ctx.filter = 'blur(8px)'; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, l.w, l.h);
        ctx.filter = 'none'; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]); ctx.strokeRect(0, 0, l.w, l.h); ctx.setLineDash([]);
      } else if (l.type === 'emoji') {
        ctx.font = `${l.fontSize * 1.5}px serif`; ctx.textBaseline = 'middle';
        ctx.fillText(l.emoji, 0, l.h / 2);
      }

      if (l.id === selected) {
        ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]); ctx.strokeRect(-4, -4, l.w + 8, l.h + 8); ctx.setLineDash([]);
        ctx.fillStyle = '#0ea5e9'; ctx.fillRect(l.w + 2, l.h + 2, 10, 10);
      }
      ctx.restore();
    });
  }

  function hitTest(x, y) {
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      if (x >= l.x - 4 && x <= l.x + l.w + 4 && y >= l.y - 4 && y <= l.y + l.h + 4) return l;
    }
    return null;
  }

  function pos(e) {
    const r = overlayCanvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (overlayCanvas.width  / r.width),
      y: (e.clientY - r.top)  * (overlayCanvas.height / r.height),
    };
  }

  function onDown(e) {
    const p = pos(e); const hit = hitTest(p.x, p.y);
    if (hit) { selected = hit.id; dragging = true; dragOffset = { x: p.x - hit.x, y: p.y - hit.y }; overlayCanvas.setPointerCapture(e.pointerId); }
    else selected = null;
    renderLayers();
  }
  function onMove(e) {
    if (!dragging || !selected) return;
    const p = pos(e); const l = layers.find(l => l.id === selected);
    if (l) { l.x = p.x - dragOffset.x; l.y = p.y - dragOffset.y; renderLayers(); }
  }
  function onUp() { dragging = false; }
  function onDbl(e) {
    const p = pos(e); const hit = hitTest(p.x, p.y);
    if (!hit) return;
    if (hit.type === 'text') { const t = prompt('Edit text:', hit.text); if (t !== null) { hit.text = t; renderLayers(); } }
    if (hit.type === 'emoji') { const em = prompt('Enter emoji:', hit.emoji); if (em !== null) { hit.emoji = em; renderLayers(); } }
  }

  function deleteSelected() { layers = layers.filter(l => l.id !== selected); selected = null; renderLayers(); }
  function clearAll() { layers = []; selected = null; renderLayers(); }
  function updateColor() { const l = layers.find(l => l.id === selected); if (l) { l.color = document.getElementById('ssLayerColor').value; renderLayers(); } }
  function updateSize()  { const l = layers.find(l => l.id === selected); if (l) { l.fontSize = parseInt(document.getElementById('ssLayerSize').value); renderLayers(); } }

  // Composite annotation layers onto export canvas
  function compositeOnto(exportCanvas) {
    if (!layers.length || !overlayCanvas) return;
    const ctx = exportCanvas.getContext('2d');
    const sx = exportCanvas.width  / overlayCanvas.width;
    const sy = exportCanvas.height / overlayCanvas.height;
    ctx.save(); ctx.scale(sx, sy); ctx.drawImage(overlayCanvas, 0, 0); ctx.restore();
  }

  return { init, compositeOnto };
})();

// ── 4. SHAREABLE SCENE URLs ───────────────────────────────────
(function initShareableURL() {
  // Read params on load and apply SS settings
  function applyFromURL() {
    const p = new URLSearchParams(window.location.search);
    if (!p.has('tab')) return;
    const tab = p.get('tab');
    if (typeof activateTab === 'function') activateTab(tab);

    if (tab === 'screenshot') {
      const scene = p.get('scene');
      if (scene && typeof SSScenes !== 'undefined') {
        setTimeout(() => SSScenes.applyScene(scene), 300);
      } else {
        const bg = p.get('bg'); const pad = p.get('pad');
        const rad = p.get('rad'); const shadow = p.get('shadow');
        const style = p.get('style');
        if (bg)     { const el = document.getElementById('ssBgType');  if (el) el.value = bg; }
        if (pad)    { const el = document.getElementById('ssPadding'); if (el) el.value = pad; }
        if (rad)    { const el = document.getElementById('ssRadius');  if (el) el.value = rad; }
        if (shadow) { const el = document.getElementById('ssShadow');  if (el) el.value = shadow; }
        if (style)  window.ssCurrentStyle = style;
      }
    }
  }

  // Add "Copy Scene URL" button to SS options
  function addCopyURLBtn() {
    const btnRow = document.querySelector('#tab-screenshot .btn-row');
    if (!btnRow || document.getElementById('ssCopyURLBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'ssCopyURLBtn';
    btn.className = 'secondary-btn';
    btn.textContent = '🔗 Copy Scene URL';
    btn.addEventListener('click', () => {
      const p = new URLSearchParams();
      p.set('tab', 'screenshot');
      const scene = document.querySelector('.ss-scene-btn.active')?.dataset.scene;
      if (scene) p.set('scene', scene);
      else {
        p.set('style',  window.ssCurrentStyle || 'macOS');
        p.set('bg',     document.getElementById('ssBgType')?.value  || 'gradient-purple');
        p.set('pad',    document.getElementById('ssPadding')?.value || '80');
        p.set('rad',    document.getElementById('ssRadius')?.value  || '16');
        p.set('shadow', document.getElementById('ssShadow')?.value  || 'medium');
      }
      const url = window.location.href.split('?')[0] + '?' + p.toString();
      navigator.clipboard.writeText(url).then(() => {
        btn.textContent = '✅ Copied!';
        setTimeout(() => { btn.textContent = '🔗 Copy Scene URL'; }, 2000);
      });
    });
    btnRow.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { applyFromURL(); setTimeout(addCopyURLBtn, 600); });
  } else {
    applyFromURL();
    setTimeout(addCopyURLBtn, 600);
  }
})();

// ── 5. PATCH SS EXPORT TO INCLUDE LAYERS ─────────────────────
(function patchSSExport() {
  function tryPatch() {
    const ssBtn = document.getElementById('ssBtn');
    if (!ssBtn) return;
    ssBtn.addEventListener('click', () => {
      // After the original handler fires, composite layers
      setTimeout(() => {
        if (typeof SSLayers !== 'undefined' && typeof getFullResSSCanvas === 'function') {
          const c = getFullResSSCanvas();
          if (c) SSLayers.compositeOnto(c);
        }
      }, 50);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryPatch);
  else setTimeout(tryPatch, 800);
})();

// ── 6. COHERENCE PASS — fix competing UI elements ────────────
(function coherencePass() {
  // Deduplicate any double-rendered session bars
  function dedup(selector) {
    const els = document.querySelectorAll(selector);
    if (els.length > 1) els.forEach((el, i) => { if (i > 0) el.remove(); });
  }

  // Ensure workflow panel doesn't stack with PWA banner
  const wfPanel = document.getElementById('workflowPanel');
  const pwaBanner = document.getElementById('pwaBanner');
  if (wfPanel && pwaBanner) {
    new MutationObserver(() => {
      if (pwaBanner.style.display !== 'none' && wfPanel.style.display !== 'none') {
        wfPanel.style.bottom = '100px';
      } else {
        wfPanel.style.bottom = '24px';
      }
    }).observe(pwaBanner, { attributes: true, attributeFilter: ['style'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => dedup('.session-bar'));
  } else {
    dedup('.session-bar');
  }
})();

// ── INIT ──────────────────────────────────────────────────────
function initPhase5() {
  AppState.syncWithPipeline();
  A11y.init();

  // Init SS layers after SS tab is first opened
  const origActivate = window.activateTab;
  let ssLayersInited = false;
  if (origActivate) {
    window.activateTab = function(tabId) {
      origActivate(tabId);
      if (tabId === 'screenshot' && !ssLayersInited) {
        ssLayersInited = true;
        setTimeout(() => SSLayers.init(), 200);
      }
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhase5);
} else {
  initPhase5();
}
