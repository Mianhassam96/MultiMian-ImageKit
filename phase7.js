// ══════════════════════════════════════════════════════════════
// MultiMian ImageKit — Phase 7
// Toast Notifications · Skeleton Loaders · Interactive Playground
// ══════════════════════════════════════════════════════════════

// ── TOAST SYSTEM ─────────────────────────────────────────────
const Toast = (() => {
  let container = null;

  function getContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  function show(msg, type = 'info', duration = 3500) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <span class="toast-msg">${msg}</span>
      <button class="toast-close" aria-label="Dismiss">✕</button>
    `;
    const c = getContainer();
    c.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => dismiss(toast));
    if (duration > 0) setTimeout(() => dismiss(toast), duration);
    return toast;
  }

  function dismiss(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }

  function success(msg, dur) { return show(msg, 'success', dur); }
  function error(msg, dur)   { return show(msg, 'error',   dur || 5000); }
  function info(msg, dur)    { return show(msg, 'info',    dur); }
  function warn(msg, dur)    { return show(msg, 'warn',    dur); }

  return { show, success, error, info, warn };
})();

// Expose globally — replace alert() usage
window.Toast = Toast;

// Patch window.alert to use toast for non-critical messages
const _nativeAlert = window.alert;
window.alert = function(msg) {
  // Use toast for short messages, native alert for confirm-style messages
  if (typeof msg === 'string' && msg.length < 200) {
    Toast.warn(msg, 5000);
  } else {
    _nativeAlert(msg);
  }
};


// ── INTERACTIVE PLAYGROUND ────────────────────────────────────
const InteractivePlayground = (() => {
  const SAMPLE_COLORS = [
    ['#16a34a','#0ea5e9'],
    ['#6366f1','#a855f7'],
    ['#f59e0b','#ef4444'],
    ['#0ea5e9','#6ee7b7'],
  ];
  const SAMPLE_LABELS = ['🏔 Nature','🎨 Abstract','📸 Photo','🌅 Sunset'];

  function generateSampleCanvas(idx) {
    const c = document.createElement('canvas');
    c.width = 160; c.height = 120;
    const ctx = c.getContext('2d');
    const [c1, c2] = SAMPLE_COLORS[idx % SAMPLE_COLORS.length];
    const grd = ctx.createLinearGradient(0, 0, 160, 120);
    grd.addColorStop(0, c1); grd.addColorStop(1, c2);
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 160, 120);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 28px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(SAMPLE_LABELS[idx % SAMPLE_LABELS.length], 80, 60);
    return c;
  }

  function sampleCanvasToFile(canvas, name) {
    return new Promise(res => canvas.toBlob(blob => {
      res(new File([blob], name + '.png', { type: 'image/png' }));
    }, 'image/png'));
  }

  function init() {
    const section = document.getElementById('playgroundSection');
    const dropZone = document.getElementById('playgroundDrop');
    const upload   = document.getElementById('playgroundUpload');
    const samples  = document.getElementById('playgroundSamples');
    if (!section || !dropZone) return;

    // Generate sample images
    for (let i = 0; i < 4; i++) {
      const wrap = document.createElement('div');
      wrap.className = 'playground-sample';
      wrap.title = SAMPLE_LABELS[i] + ' — click to try';
      wrap.setAttribute('role', 'button');
      wrap.setAttribute('tabindex', '0');
      const canvas = generateSampleCanvas(i);
      wrap.appendChild(canvas);
      wrap.addEventListener('click', async () => {
        const file = await sampleCanvasToFile(canvas, 'sample-' + i);
        routeToCompress(file);
      });
      wrap.addEventListener('keydown', async e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const file = await sampleCanvasToFile(canvas, 'sample-' + i);
          routeToCompress(file);
        }
      });
      if (samples) samples.appendChild(wrap);
    }

    // Drop + upload
    if (typeof setupDrop === 'function') {
      setupDrop(dropZone, upload, files => {
        if (files[0]) routeToCompress(files[0]);
      });
    }
  }

  function routeToCompress(file) {
    // Pre-load file into compress tool then navigate
    if (typeof compressDrop !== 'undefined' && typeof setupDrop === 'function') {
      // Trigger the compress drop with this file
      const event = new CustomEvent('playgroundFile', { detail: { file } });
      document.dispatchEvent(event);
    }
    if (typeof activateTab === 'function') activateTab('compress');
    Toast.success('Sample loaded in Compress tool — adjust quality and download!', 4000);
  }

  return { init };
})();

// ── BUTTON LOADING STATE HELPERS ──────────────────────────────
function setButtonLoading(btn, loading) {
  if (!btn) return;
  if (loading) { btn.classList.add('btn-loading'); btn.disabled = true; }
  else         { btn.classList.remove('btn-loading'); btn.disabled = false; }
}

// ── INIT PHASE 7 ──────────────────────────────────────────────
function initPhase7() {
  InteractivePlayground.init();
  // Listen for playground file events
  document.addEventListener('playgroundFile', e => {
    const { file } = e.detail;
    // Pre-fill compress tool
    const compressUploadEl = document.getElementById('compressUpload');
    if (compressUploadEl && typeof setupDrop !== 'undefined') {
      // Simulate file selection by dispatching to the setupDrop handler
      const dt = new DataTransfer();
      dt.items.add(file);
      compressUploadEl.files = dt.files;
      compressUploadEl.dispatchEvent(new Event('change'));
    }
  });

  // Success toast on any download
  const origTrigger = window.triggerDownload;
  if (origTrigger && !origTrigger._toastPatched) {
    window.triggerDownload = function(url, filename) {
      origTrigger(url, filename);
      const ext = filename.split('.').pop().toUpperCase();
      Toast.success(`${ext} file downloaded — ${filename.length > 30 ? filename.slice(0,30)+'…' : filename}`);
    };
    window.triggerDownload._toastPatched = true;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhase7);
} else { initPhase7(); }
