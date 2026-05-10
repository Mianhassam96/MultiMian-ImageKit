// ══════════════════════════════════════════════════════════════
// MultiMian ImageKit — Phase 4
// Lazy Loading · Achievement System · SS Scenes · Web Worker
// Compress · Workflow-Aware Suggestions · Mobile UX · Design System
// ══════════════════════════════════════════════════════════════

// ── 1. LAZY LIBRARY LOADER ────────────────────────────────────
const LazyLoader = (() => {
  const loaded = new Set();

  const LIBS = {
    tesseract: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
    pdfjs:     'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    gifjs:     'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js',
  };

  function load(key) {
    if (loaded.has(key)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = LIBS[key];
      s.onload = () => {
        loaded.add(key);
        // Post-load setup
        if (key === 'pdfjs' && window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        resolve();
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Map tab → required libs
  const TAB_LIBS = {
    ocr:      ['tesseract'],
    pdf:      ['pdfjs'],
    pdf2img:  ['pdfjs'],
    gif:      ['gifjs'],
    videogif: ['gifjs'],
  };

  function preloadForTab(tabId) {
    const libs = TAB_LIBS[tabId];
    if (!libs) return;
    libs.forEach(lib => load(lib).catch(() => {}));
  }

  return { load, preloadForTab };
})();

// Patch activateTab to lazy-load libs
(function patchActivateTab() {
  const orig = window.activateTab;
  if (!orig) {
    // Wait for it to be defined
    let attempts = 0;
    const interval = setInterval(() => {
      if (window.activateTab && window.activateTab !== patchedActivateTab) {
        clearInterval(interval);
        applyPatch();
      }
      if (++attempts > 50) clearInterval(interval);
    }, 100);
  } else {
    applyPatch();
  }

  function patchedActivateTab() {} // placeholder for reference check

  function applyPatch() {
    const orig = window.activateTab;
    window.activateTab = function(tabId) {
      LazyLoader.preloadForTab(tabId);
      orig(tabId);
      AchievementSystem.trackTabVisit(tabId);
      WorkflowMemory.recordVisit(tabId);
    };
  }
})();

// ── 2. ACHIEVEMENT SYSTEM ─────────────────────────────────────
const AchievementSystem = (() => {
  const KEY = 'ik_achievements_v1';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
  }

  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  }

  function get() {
    const d = load();
    return {
      mbSaved:    parseFloat(d.mbSaved    || 0),
      exports:    parseInt(d.exports      || 0),
      workflows:  parseInt(d.workflows    || 0),
      streak:     parseInt(d.streak       || 0),
      lastDay:    d.lastDay               || null,
      tabVisits:  d.tabVisits             || {},
    };
  }

  function addMbSaved(mb) {
    const d = load();
    d.mbSaved = (parseFloat(d.mbSaved || 0) + mb).toFixed(2);
    save(d); render();
  }

  function addExport() {
    const d = load();
    d.exports = (parseInt(d.exports || 0) + 1);
    d.workflows = (parseInt(d.workflows || 0) + 1);
    updateStreak(d);
    save(d); render();
  }

  function updateStreak(d) {
    const today = new Date().toDateString();
    if (d.lastDay === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    d.streak = d.lastDay === yesterday ? (parseInt(d.streak || 0) + 1) : 1;
    d.lastDay = today;
  }

  function trackTabVisit(tabId) {
    const d = load();
    if (!d.tabVisits) d.tabVisits = {};
    d.tabVisits[tabId] = (d.tabVisits[tabId] || 0) + 1;
    save(d);
  }

  function render() {
    const stats = get();
    const dash = document.getElementById('achievementDash');
    if (!dash) return;

    const hasActivity = stats.exports > 0 || stats.mbSaved > 0;
    dash.style.display = hasActivity ? 'flex' : 'none';

    const mbEl = document.getElementById('achMbVal');
    const expEl = document.getElementById('achExportsVal');
    const wfEl  = document.getElementById('achWorkflowsVal');
    const strEl = document.getElementById('achStreakVal');

    if (mbEl)  mbEl.textContent  = stats.mbSaved > 0 ? parseFloat(stats.mbSaved).toFixed(1) : '0';
    if (expEl) expEl.textContent = stats.exports;
    if (wfEl)  wfEl.textContent  = stats.workflows;
    if (strEl) strEl.textContent = stats.streak;
  }

  // Expose for other modules
  window._achAddExport = addExport;
  window._achAddMb = addMbSaved;

  return { get, addMbSaved, addExport, trackTabVisit, render };
})();

// ── 3. WORKFLOW MEMORY (history-aware suggestions) ────────────
const WorkflowMemory = (() => {
  const KEY = 'ik_wf_memory_v1';
  const MAX_HISTORY = 20;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  }

  function recordVisit(tabId) {
    if (tabId === 'home') return;
    const history = load();
    history.unshift({ tab: tabId, ts: Date.now() });
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    try { localStorage.setItem(KEY, JSON.stringify(history)); } catch {}
  }

  function getSmartSuggestions(currentTab, file) {
    const history = load();
    const recent = history.slice(0, 5).map(h => h.tab);

    // Workflow-aware: what did user do before?
    const WORKFLOW_CHAINS = {
      compress:   { after: ['convert', 'share', 'resize'],   before: ['screenshot', 'resize'] },
      resize:     { after: ['compress', 'watermark', 'share'], before: ['screenshot'] },
      screenshot: { after: ['compress', 'share', 'resize'],   before: [] },
      convert:    { after: ['compress', 'share'],              before: ['compress'] },
      watermark:  { after: ['compress', 'share'],              before: ['resize'] },
      ocr:        { after: ['pdf', 'compress'],                before: [] },
      merge:      { after: ['compress', 'share'],              before: [] },
      share:      { after: [],                                 before: ['compress', 'watermark'] },
    };

    const chain = WORKFLOW_CHAINS[currentTab] || { after: [], before: [] };
    const suggestions = [];

    // Prioritize tools user hasn't used yet in this chain
    chain.after.forEach(tab => {
      if (!recent.includes(tab)) {
        suggestions.push({ tab, priority: 10 });
      } else {
        suggestions.push({ tab, priority: 5 });
      }
    });

    // Add file-based suggestions
    if (file) {
      const sizeMB = file.size / 1048576;
      const ext = (file.type || '').split('/')[1] || '';
      if (sizeMB > 1 && !suggestions.find(s => s.tab === 'compress')) {
        suggestions.push({ tab: 'compress', priority: 8 });
      }
      if (ext !== 'webp' && !suggestions.find(s => s.tab === 'convert')) {
        suggestions.push({ tab: 'convert', priority: 6 });
      }
    }

    return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 3);
  }

  return { recordVisit, getSmartSuggestions };
})();

// ── 4. WEB WORKER COMPRESSION ─────────────────────────────────
const WorkerCompress = (() => {
  // Inline worker source — avoids CORS issues
  const WORKER_SRC = `
    self.onmessage = async function(e) {
      const { imageData, width, height, quality, mime } = e.data;
      try {
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.putImageData(new ImageData(new Uint8ClampedArray(imageData), width, height), 0, 0);
        const blob = await canvas.convertToBlob({ type: mime, quality });
        const buf = await blob.arrayBuffer();
        self.postMessage({ success: true, buffer: buf, mime }, [buf]);
      } catch(err) {
        self.postMessage({ success: false, error: err.message });
      }
    };
  `;

  let worker = null;

  function getWorker() {
    if (worker) return worker;
    try {
      const blob = new Blob([WORKER_SRC], { type: 'application/javascript' });
      worker = new Worker(URL.createObjectURL(blob));
    } catch {
      worker = null;
    }
    return worker;
  }

  async function compress(imageData, width, height, quality, mime) {
    const w = getWorker();
    if (!w) return null; // fallback to main thread

    return new Promise((resolve, reject) => {
      const handler = (e) => {
        w.removeEventListener('message', handler);
        if (e.data.success) {
          resolve(new Blob([e.data.buffer], { type: e.data.mime }));
        } else {
          reject(new Error(e.data.error));
        }
      };
      w.addEventListener('message', handler);
      w.postMessage({ imageData: imageData.data.buffer, width, height, quality, mime }, [imageData.data.buffer]);
    });
  }

  return { compress };
})();

// Patch compress button to use web worker when available
(function patchCompressWithWorker() {
  function tryPatch() {
    const btn = document.getElementById('compressBtn');
    if (!btn) return;

    btn.addEventListener('click', async function workerHandler() {
      // Only intercept if OffscreenCanvas is supported
      if (!window.OffscreenCanvas) return;

      const file = window.compressFile;
      if (!file) return;

      const qualityEl = document.getElementById('qualitySlider');
      const formatEl  = document.getElementById('compressFormat');
      const maxWEl    = document.getElementById('compressMaxW');
      const quality   = qualityEl ? parseInt(qualityEl.value) / 100 : 0.8;
      const mime      = formatEl?.value || 'image/jpeg';
      const maxW      = maxWEl?.value ? parseInt(maxWEl.value) : null;
      const extMap    = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' };
      const ext       = extMap[mime] || 'jpg';

      // Load image
      const url = URL.createObjectURL(file);
      const img = await new Promise((res, rej) => {
        const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
      });
      URL.revokeObjectURL(url);

      let w = img.naturalWidth, h = img.naturalHeight;
      if (maxW && w > maxW) { h = Math.round(h * maxW / w); w = maxW; }

      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);

      try {
        const blob = await WorkerCompress.compress(imageData, w, h, quality, mime);
        if (!blob) return; // fallback to original handler

        const name = file.name.replace(/\.[^.]+$/, '') + '-compressed.' + ext;
        triggerDownload(URL.createObjectURL(blob), name);

        // Update UI
        const savedPct = ((file.size - blob.size) / file.size * 100).toFixed(1);
        const compSizeEl = document.getElementById('compSize');
        const savedPctEl = document.getElementById('savedPct');
        if (compSizeEl) compSizeEl.textContent = formatBytes(blob.size);
        if (savedPctEl) savedPctEl.textContent = savedPct + '%';

        document.getElementById('compressSuccess').style.display = 'block';

        // Achievements
        const savedMb = (file.size - blob.size) / 1048576;
        AchievementSystem.addMbSaved(Math.max(0, savedMb));
        AchievementSystem.addExport();

        // Savings anim
        const animEl = document.getElementById('compressSavingsAnim');
        if (animEl) {
          document.getElementById('savingsFrom').textContent = formatBytes(file.size);
          document.getElementById('savingsTo').textContent   = formatBytes(blob.size);
          document.getElementById('savingsPct').textContent  = `Saved ${savedPct}%`;
          animEl.style.display = 'block';
        }

        // Before/after
        const baWrap = document.getElementById('beforeAfterWrap');
        if (baWrap) {
          document.getElementById('baBefore').src = document.getElementById('compressImg').src;
          document.getElementById('baAfter').src  = URL.createObjectURL(blob);
          baWrap.style.display = 'block';
          const afterWrap = document.getElementById('baAfterWrap');
          const divider   = document.getElementById('baDivider');
          if (afterWrap) afterWrap.style.width = '50%';
          if (divider)   divider.style.left    = '50%';
        }

        if (typeof SessionTracker !== 'undefined') SessionTracker.increment(`Saved ${savedPct}%!`);
        if (typeof AssetPipeline !== 'undefined') AssetPipeline.set(file, blob, 'compress');

        // Stop original handler from also firing
        workerHandler._workerHandled = true;
      } catch {
        // Worker failed — let original handler run
      }
    }, true); // capture phase — runs before original
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryPatch);
  } else {
    setTimeout(tryPatch, 500);
  }
})();

// ── 5. SCREENSHOT STUDIO PRESET SCENES ───────────────────────
const SSScenes = (() => {
  const SCENES = {
    'macos-desk': {
      style: 'macOS', bg: 'gradient-dark', padding: '80', radius: '16', shadow: 'medium',
      label: '🖥 macOS Desk', desc: 'Dark desktop with traffic lights'
    },
    'neon-studio': {
      style: 'glass', bg: 'gradient-purple', padding: '100', radius: '24', shadow: 'glow',
      label: '🌆 Neon Studio', desc: 'Purple glow with glass depth'
    },
    'indie-tweet': {
      style: 'tweet', bg: 'solid-white', padding: '60', radius: '12', shadow: 'soft',
      label: '🐦 Indie Tweet', desc: 'Clean white Twitter card'
    },
    'ph-launch': {
      style: 'producthunt', bg: 'gradient-sunset', padding: '80', radius: '16', shadow: 'medium',
      label: '🚀 PH Launch', desc: 'Product Hunt launch card'
    },
    'glass-desk': {
      style: 'glass', bg: 'gradient-blue', padding: '100', radius: '20', shadow: 'glow',
      label: '🔮 Glass Desk', desc: 'Blue glassmorphism'
    },
    'code-dark': {
      style: 'code', bg: 'gradient-dark', padding: '80', radius: '12', shadow: 'hard',
      label: '💻 Code Dark', desc: 'Dark code editor frame'
    },
    'minimal-white': {
      style: 'none', bg: 'solid-white', padding: '60', radius: '8', shadow: 'soft',
      label: '⬜ Minimal', desc: 'Clean white background'
    },
    'gradient-pop': {
      style: 'none', bg: 'gradient-sunset', padding: '80', radius: '20', shadow: 'medium',
      label: '🌈 Gradient Pop', desc: 'Vibrant sunset gradient'
    },
  };

  function applyScene(sceneKey) {
    const scene = SCENES[sceneKey];
    if (!scene) return;

    // Set style tab
    window.ssCurrentStyle = scene.style;
    document.querySelectorAll('.ss-style-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.style === scene.style);
    });

    // Set options
    const bgEl      = document.getElementById('ssBgType');
    const padEl     = document.getElementById('ssPadding');
    const radEl     = document.getElementById('ssRadius');
    const shadowEl  = document.getElementById('ssShadow');
    if (bgEl)     bgEl.value     = scene.bg;
    if (padEl)    padEl.value    = scene.padding;
    if (radEl)    radEl.value    = scene.radius;
    if (shadowEl) shadowEl.value = scene.shadow;

    // Re-render
    if (typeof renderScreenshotStudio === 'function') renderScreenshotStudio();

    // Visual feedback on button
    document.querySelectorAll('.ss-scene-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.scene === sceneKey);
    });
  }

  function init() {
    document.querySelectorAll('.ss-scene-btn').forEach(btn => {
      btn.addEventListener('click', () => applyScene(btn.dataset.scene));
    });
  }

  return { init, applyScene, SCENES };
})();

// ── 6. MOBILE UX — Bottom sheet + sticky CTA ─────────────────
const MobileUX = (() => {
  function init() {
    if (window.innerWidth > 768) return;

    // Sticky download CTA on tool sections
    const toolSections = document.querySelectorAll('.tab-section:not(.home-section)');
    toolSections.forEach(section => {
      const primaryBtn = section.querySelector('.primary-btn');
      if (!primaryBtn) return;

      const sticky = document.createElement('div');
      sticky.className = 'mobile-sticky-cta';
      sticky.innerHTML = `<button class="mobile-sticky-btn">${primaryBtn.textContent}</button>`;
      sticky.querySelector('button').addEventListener('click', () => primaryBtn.click());
      section.appendChild(sticky);

      // Show sticky when primary btn scrolls out of view
      const observer = new IntersectionObserver(entries => {
        sticky.classList.toggle('visible', !entries[0].isIntersecting);
      }, { threshold: 0 });
      observer.observe(primaryBtn);
    });

    // Swipe to close workflow panel
    const panel = document.getElementById('workflowPanel');
    if (panel) {
      let startY = 0;
      panel.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
      panel.addEventListener('touchend', e => {
        if (e.changedTouches[0].clientY - startY > 60) panel.style.display = 'none';
      }, { passive: true });
    }
  }

  return { init };
})();

// ── 7. DESIGN SYSTEM TOKENS — CSS custom property enforcement ─
(function enforceDesignSystem() {
  // Inject consistent timing tokens
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --ease-out: cubic-bezier(.22,1,.36,1);
      --ease-in-out: cubic-bezier(.4,0,.2,1);
      --dur-fast: 150ms;
      --dur-base: 250ms;
      --dur-slow: 400ms;
      --space-1: 4px;
      --space-2: 8px;
      --space-3: 12px;
      --space-4: 16px;
      --space-5: 24px;
      --space-6: 32px;
      --space-7: 48px;
      --space-8: 64px;
    }
    /* Apply consistent transitions using tokens */
    .home-card, .workflow-card, .primary-btn, .secondary-btn,
    .tab-btn, .preset-btn, .ss-style-btn, .qm-btn {
      transition-duration: var(--dur-base);
      transition-timing-function: var(--ease-out);
    }
    .primary-btn:hover:not(:disabled) {
      transform: translateY(-2px);
    }
    /* Reduce visual noise — remove redundant borders on hover */
    .card:hover { box-shadow: var(--shadow-md); }
    /* Tighter tool section max-width for focus */
    .tab-section:not(.home-section) {
      max-width: 680px;
    }
  `;
  document.head.appendChild(style);
})();

// ── 8. FOCUS MODE — Quick/Advanced for all tools ─────────────
(function initFocusMode() {
  // Generic advanced toggle for any tool that has data-advanced attr
  document.querySelectorAll('[data-advanced-target]').forEach(toggle => {
    const targetId = toggle.dataset.advancedTarget;
    const target = document.getElementById(targetId);
    if (!target) return;
    toggle.addEventListener('click', () => {
      const open = target.style.display !== 'none';
      target.style.display = open ? 'none' : 'block';
      toggle.classList.toggle('open', !open);
      const chevron = toggle.querySelector('.adv-chevron');
      if (chevron) chevron.style.transform = open ? '' : 'rotate(180deg)';
    });
  });
})();

// ── INIT ──────────────────────────────────────────────────────
function initPhase4() {
  SSScenes.init();
  MobileUX.init();
  AchievementSystem.render();

  // Preload libs for visible/likely tabs
  LazyLoader.preloadForTab('ocr');

  // Patch achievement tracking into download triggers
  const origTrigger = window.triggerDownload;
  if (origTrigger) {
    window.triggerDownload = function(url, filename) {
      origTrigger(url, filename);
      AchievementSystem.addExport();
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhase4);
} else {
  initPhase4();
}
