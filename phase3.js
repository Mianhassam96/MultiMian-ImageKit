// ══════════════════════════════════════════════════════════════
// MultiMian ImageKit — Phase 3 Engine
// Speed · Polish · Workflow Automation · SS Upgrades · Batch
// ══════════════════════════════════════════════════════════════

// ── 1. SMART ONE-CLICK WORKFLOW AUTOMATION ────────────────────
const SmartOptimize = (() => {
  async function run(file) {
    const modal = document.getElementById('soModal');
    const log   = document.getElementById('soLog');
    const bar   = document.getElementById('soBar');
    const pct   = document.getElementById('soPct');
    if (!modal) return;

    modal.style.display = 'flex';
    log.innerHTML = '';

    function step(icon, text, progress) {
      const el = document.createElement('div');
      el.className = 'so-step';
      el.innerHTML = `<span class="so-step-icon">${icon}</span><span>${text}</span>`;
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
      bar.style.width = progress + '%';
      pct.textContent = progress + '%';
    }

    try {
      step('🔍', 'Analyzing image…', 10);
      await tick();

      const sizeMB = file.size / 1048576;
      const ext = (file.type || '').split('/')[1] || file.name.split('.').pop().toLowerCase();
      const img = await loadImageFromFile(file);
      const w = img.naturalWidth, h = img.naturalHeight;

      step('📊', `Found: ${w}×${h}px · ${(sizeMB).toFixed(2)} MB · ${ext.toUpperCase()}`, 25);
      await tick();

      // Decide best output format
      const useWebP = ext !== 'webp' && sizeMB > 0.1;
      const quality = sizeMB > 2 ? 0.75 : sizeMB > 0.5 ? 0.82 : 0.88;
      const mime = useWebP ? 'image/webp' : 'image/jpeg';
      const outExt = useWebP ? 'webp' : 'jpg';

      step('⚙️', `Compressing to ${useWebP ? 'WebP' : 'JPEG'} at ${Math.round(quality * 100)}% quality…`, 45);
      await tick();

      // Compress
      const canvas = document.createElement('canvas');
      // Optionally downscale if very large
      const maxDim = 2400;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      canvas.width  = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise(res => canvas.toBlob(res, mime, quality));
      const saved = ((file.size - blob.size) / file.size * 100).toFixed(1);

      step('✅', `Compressed: ${formatBytes(blob.size)} (saved ${saved}%)`, 70);
      await tick();

      // Generate social pack hint
      step('📦', 'Generating export pack…', 85);
      await tick();

      // Download optimized
      const name = file.name.replace(/\.[^.]+$/, '') + '-optimized.' + outExt;
      triggerDownload(URL.createObjectURL(blob), name);

      step('🎉', `Done! Downloaded as ${name}`, 100);
      await tick(400);

      // Show next steps
      document.getElementById('soNextSteps').style.display = 'block';
      document.getElementById('soNextFile').textContent = file.name;

      // Feed pipeline
      if (typeof AssetPipeline !== 'undefined') AssetPipeline.set(file, blob, 'compress');
      if (typeof SessionTracker !== 'undefined') SessionTracker.increment(`Saved ${saved}%!`);

    } catch (err) {
      step('❌', 'Error: ' + err.message, 0);
    }
  }

  function tick(ms = 80) { return new Promise(r => setTimeout(r, ms)); }

  async function loadImageFromFile(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = rej;
      img.src = url;
    });
  }

  function init() {
    const btn = document.getElementById('smartOptimizeBtn');
    const drop = document.getElementById('soDrop');
    const upload = document.getElementById('soUpload');
    const closeBtn = document.getElementById('soClose');
    const modal = document.getElementById('soModal');

    if (!btn || !drop) return;

    btn.addEventListener('click', () => {
      document.getElementById('soLauncher').style.display = 'flex';
    });

    if (typeof setupDrop === 'function') {
      setupDrop(drop, upload, files => {
        if (files[0]) run(files[0]);
      });
    }

    closeBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
      document.getElementById('soNextSteps').style.display = 'none';
      document.getElementById('soLog').innerHTML = '';
      document.getElementById('soBar').style.width = '0%';
    });

    // Next step buttons inside modal
    document.querySelectorAll('.so-next-btn').forEach(b => {
      b.addEventListener('click', () => {
        modal.style.display = 'none';
        if (typeof activateTab === 'function') activateTab(b.dataset.tab);
      });
    });
  }

  return { init, run };
})();

// ── 2. SCREENSHOT STUDIO — PHASE 3 UPGRADES ──────────────────
const SSPhase3 = (() => {

  // Dynamic background from image dominant colors
  function extractDominantColors(img) {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, 32, 32);
    const data = ctx.getImageData(0, 0, 32, 32).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 16) {
      r += data[i]; g += data[i+1]; b += data[i+2]; count++;
    }
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    // Darken for background
    const dark = `rgb(${Math.round(r*0.3)},${Math.round(g*0.3)},${Math.round(b*0.3)})`;
    const mid  = `rgb(${Math.round(r*0.6)},${Math.round(g*0.6)},${Math.round(b*0.6)})`;
    return { primary: `rgb(${r},${g},${b})`, dark, mid };
  }

  // Draw dynamic background using image colors
  function drawDynamicBg(ctx, w, h, img) {
    const colors = extractDominantColors(img);
    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, colors.dark);
    grd.addColorStop(0.5, colors.mid);
    grd.addColorStop(1, colors.dark);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
    // Radial glow from dominant color
    const glow = ctx.createRadialGradient(w*0.5, h*0.3, 0, w*0.5, h*0.3, w*0.6);
    glow.addColorStop(0, colors.primary.replace('rgb', 'rgba').replace(')', ',0.35)'));
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  // Share-ready ratio presets
  const RATIOS = {
    'twitter':      { w: 1200, h: 675,  label: 'Twitter/X' },
    'linkedin':     { w: 1200, h: 627,  label: 'LinkedIn' },
    'producthunt':  { w: 1270, h: 760,  label: 'Product Hunt' },
    'dribbble':     { w: 800,  h: 600,  label: 'Dribbble' },
    'instagram':    { w: 1080, h: 1080, label: 'Instagram' },
    'og':           { w: 1200, h: 630,  label: 'Open Graph' },
    'free':         { w: null, h: null,  label: 'Free' },
  };

  function initRatioSelector() {
    const container = document.getElementById('ssRatioRow');
    if (!container) return;
    container.innerHTML = Object.entries(RATIOS).map(([key, val]) =>
      `<button class="ss-ratio-btn ${key === 'free' ? 'active' : ''}" data-ratio="${key}">${val.label}</button>`
    ).join('');
    container.querySelectorAll('.ss-ratio-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.ss-ratio-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        window._ssRatio = RATIOS[btn.dataset.ratio];
        if (typeof renderScreenshotStudio === 'function') renderScreenshotStudio();
      });
    });
    window._ssRatio = RATIOS['free'];
  }

  // Spotlight glow effect
  function drawSpotlight(ctx, w, h, x, y, radius, color) {
    const grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grd.addColorStop(0, color.replace(')', ',0.45)').replace('rgb', 'rgba'));
    grd.addColorStop(0.5, color.replace(')', ',0.15)').replace('rgb', 'rgba'));
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
  }

  // Layered depth: glass + blur simulation
  function drawGlassDepth(ctx, x, y, w, h, r) {
    // Outer glow
    ctx.shadowColor = 'rgba(99,102,241,0.4)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;
    // Glass fill
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    if (typeof roundRect === 'function') roundRect(ctx, x-8, y-8, w+16, h+16, r+4);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    // Glass border
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    if (typeof roundRect === 'function') roundRect(ctx, x-8, y-8, w+16, h+16, r+4);
    ctx.stroke();
    // Inner highlight
    const shine = ctx.createLinearGradient(x, y-8, x, y+30);
    shine.addColorStop(0, 'rgba(255,255,255,0.18)');
    shine.addColorStop(1, 'transparent');
    ctx.fillStyle = shine;
    if (typeof roundRect === 'function') roundRect(ctx, x-8, y-8, w+16, 30, r+4);
    ctx.fill();
  }

  function init() {
    initRatioSelector();

    // Dynamic bg button
    const dynBtn = document.getElementById('ssDynBgBtn');
    if (dynBtn) {
      dynBtn.addEventListener('click', () => {
        const bgSel = document.getElementById('ssBgType');
        if (bgSel) {
          bgSel.value = 'dynamic';
          if (typeof renderScreenshotStudio === 'function') renderScreenshotStudio();
        }
      });
    }

    // Patch drawBackground to support 'dynamic'
    const origDraw = window.drawBackground;
    if (origDraw) {
      window.drawBackground = function(ctx, w, h, type) {
        if (type === 'dynamic') {
          const img = document.getElementById('ssImg');
          if (img && img.naturalWidth) {
            drawDynamicBg(ctx, w, h, img);
            return;
          }
        }
        origDraw(ctx, w, h, type);
      };
    }

    // Patch renderScreenshotStudio to apply ratio + depth effects
    const origRender = window.renderScreenshotStudio;
    if (origRender) {
      window.renderScreenshotStudio = function() {
        origRender();
        // Apply spotlight if glow shadow selected
        const shadow = document.getElementById('ssShadow')?.value;
        const canvas = document.getElementById('ssCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (shadow === 'glow') {
          drawSpotlight(ctx, canvas.width, canvas.height, canvas.width*0.5, canvas.height*0.2, canvas.width*0.5, 'rgb(99,102,241)');
        }
        // Apply glass depth if glass style
        if (window.ssCurrentStyle === 'glass') {
          const img = document.getElementById('ssImg');
          if (img && img.naturalWidth) {
            const padding = parseInt(document.getElementById('ssPadding')?.value || '80');
            const scale = Math.min(1, 800 / (img.naturalWidth + padding * 2));
            const sx = padding * scale;
            const sy = padding * scale;
            const sw = img.naturalWidth * scale;
            const sh = img.naturalHeight * scale;
            const radius = parseInt(document.getElementById('ssRadius')?.value || '16') * scale;
            drawGlassDepth(ctx, sx, sy, sw, sh, radius);
          }
        }
      };
    }
  }

  return { init, extractDominantColors, drawDynamicBg, RATIOS };
})();

// ── 3. BATCH PROCESSING QUEUE ─────────────────────────────────
const BatchQueue = (() => {
  let queue = [];
  let processing = false;

  function addFiles(files, operation) {
    files.forEach(f => {
      queue.push({ file: f, operation, status: 'pending', id: Date.now() + Math.random() });
    });
    renderQueue();
  }

  function renderQueue() {
    const container = document.getElementById('batchQueueList');
    const section = document.getElementById('batchSection');
    if (!container || !section) return;
    if (!queue.length) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    container.innerHTML = queue.map((item, i) => `
      <div class="bq-item bq-${item.status}" data-id="${item.id}">
        <span class="bq-icon">${statusIcon(item.status)}</span>
        <span class="bq-name">${item.file.name}</span>
        <span class="bq-size">${formatBytes(item.file.size)}</span>
        <span class="bq-op">${item.operation}</span>
        <span class="bq-status">${item.status}</span>
        ${item.status === 'pending' ? `<button class="bq-remove" data-idx="${i}">✕</button>` : ''}
      </div>
    `).join('');
    container.querySelectorAll('.bq-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        queue.splice(parseInt(btn.dataset.idx), 1);
        renderQueue();
      });
    });
    document.getElementById('batchCount').textContent = queue.length;
    document.getElementById('batchRunBtn').disabled = processing || !queue.some(i => i.status === 'pending');
  }

  function statusIcon(s) {
    return { pending:'⏳', processing:'⚙️', done:'✅', error:'❌' }[s] || '⏳';
  }

  async function runAll() {
    if (processing) return;
    processing = true;
    document.getElementById('batchRunBtn').disabled = true;
    const pending = queue.filter(i => i.status === 'pending');
    for (const item of pending) {
      item.status = 'processing';
      renderQueue();
      try {
        await processItem(item);
        item.status = 'done';
      } catch (e) {
        item.status = 'error';
        item.error = e.message;
      }
      renderQueue();
      await new Promise(r => setTimeout(r, 50));
    }
    processing = false;
    renderQueue();
    if (typeof SessionTracker !== 'undefined') SessionTracker.increment(`Batch: ${pending.length} files!`);
  }

  async function processItem(item) {
    const url = URL.createObjectURL(item.file);
    const img = await new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
    });
    URL.revokeObjectURL(url);

    const op = item.operation;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);

    let mime = 'image/jpeg', quality = 0.82, ext = 'jpg';
    if (op === 'compress-webp') { mime = 'image/webp'; quality = 0.82; ext = 'webp'; }
    else if (op === 'compress-jpg') { mime = 'image/jpeg'; quality = 0.75; ext = 'jpg'; }
    else if (op === 'convert-png') { mime = 'image/png'; quality = 1; ext = 'png'; }
    else if (op === 'convert-webp') { mime = 'image/webp'; quality = 0.9; ext = 'webp'; }

    const blob = await new Promise(res => canvas.toBlob(res, mime, quality));
    const name = item.file.name.replace(/\.[^.]+$/, '') + '-batch.' + ext;
    triggerDownload(URL.createObjectURL(blob), name);
  }

  function clear() {
    queue = queue.filter(i => i.status !== 'done');
    renderQueue();
  }

  function init() {
    const drop = document.getElementById('batchDrop');
    const upload = document.getElementById('batchUpload');
    const runBtn = document.getElementById('batchRunBtn');
    const clearBtn = document.getElementById('batchClearBtn');
    const opSel = document.getElementById('batchOperation');
    if (!drop) return;

    if (typeof setupDrop === 'function') {
      setupDrop(drop, upload, files => {
        const op = opSel?.value || 'compress-webp';
        addFiles(files.filter(f => f.type.startsWith('image/')), op);
      });
    }
    runBtn?.addEventListener('click', runAll);
    clearBtn?.addEventListener('click', clear);
  }

  return { init, addFiles, runAll };
})();

// ── 4. SMART SUGGESTIONS ENGINE ──────────────────────────────
const SmartSuggestions = (() => {
  function analyze(file, img) {
    const sizeMB = file.size / 1048576;
    const ext = (file.type || '').split('/')[1] || file.name.split('.').pop().toLowerCase();
    const w = img ? img.naturalWidth : 0;
    const h = img ? img.naturalHeight : 0;
    const suggestions = [];

    // Size-based
    if (sizeMB > 1) suggestions.push({ priority: 10, tab: 'compress', icon: '🗜', label: 'Compress', reason: `${sizeMB.toFixed(1)} MB is large` });
    if (ext !== 'webp' && sizeMB > 0.3) suggestions.push({ priority: 8, tab: 'convert', icon: '🔄', label: 'Convert to WebP', reason: 'Save 25–35% more' });

    // Dimension-based
    if (w > 0 && h > 0) {
      if (w === h) suggestions.push({ priority: 7, tab: 'sticker', icon: '🎨', label: 'Make Sticker', reason: 'Square — perfect for stickers' });
      if (w >= 1000 && h >= 600) suggestions.push({ priority: 6, tab: 'screenshot', icon: '✨', label: 'Beautify', reason: 'Great size for Screenshot Studio' });
      if (w > 2000 || h > 2000) suggestions.push({ priority: 9, tab: 'resize', icon: '✂️', label: 'Resize', reason: `${w}×${h}px is very large` });
    }

    // Format-based
    if (ext === 'png') suggestions.push({ priority: 5, tab: 'convert', icon: '🔄', label: 'Convert PNG→WebP', reason: 'PNG → WebP saves ~30%' });
    if (ext === 'bmp' || ext === 'tiff') suggestions.push({ priority: 10, tab: 'convert', icon: '🔄', label: 'Convert Format', reason: `${ext.toUpperCase()} is uncompressed` });

    // Always offer share
    suggestions.push({ priority: 3, tab: 'share', icon: '🌐', label: 'Share Link', reason: 'Get a public URL + QR' });

    return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 4);
  }

  function showBanner(file, img, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const suggestions = analyze(file, img);
    if (!suggestions.length) return;

    container.innerHTML = `
      <div class="ss-engine-header">
        <span class="ss-engine-icon">⚡</span>
        <span class="ss-engine-title">Smart Suggestions</span>
        <span class="ss-engine-sub">Based on your file</span>
      </div>
      <div class="ss-engine-chips">
        ${suggestions.map(s => `
          <button class="ss-engine-chip" data-tab="${s.tab}" title="${s.reason}">
            ${s.icon} ${s.label}
            <span class="ss-chip-reason">${s.reason}</span>
          </button>
        `).join('')}
      </div>
    `;
    container.style.display = 'block';
    container.querySelectorAll('.ss-engine-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof activateTab === 'function') activateTab(btn.dataset.tab);
      });
    });
  }

  return { analyze, showBanner };
})();

// ── 5. MOTION HIERARCHY — Reduced, intentional animations ────
const MotionSystem = (() => {
  function init() {
    // Respect prefers-reduced-motion
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      document.documentElement.style.setProperty('--transition-speed', '0ms');
      return;
    }
    // Stagger home cards on first load
    const cards = document.querySelectorAll('.home-card');
    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(16px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(.22,1,.36,1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 80 + i * 40);
    });
    // Stagger workflow cards
    const wfCards = document.querySelectorAll('.workflow-card');
    wfCards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(12px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.35s ease, transform 0.35s cubic-bezier(.22,1,.36,1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 120 + i * 50);
    });
  }
  return { init };
})();

// ── 6. PRODUCT IDENTITY — Positioning tagline rotator ────────
const IdentitySystem = (() => {
  const TAGLINES = [
    'Fast image workflows for creators.',
    'Prepare any image for anywhere.',
    'Browser-native image productivity.',
    'The fastest way to optimize and share visuals.',
  ];
  let idx = 0;

  function init() {
    const el = document.getElementById('heroTaglineRotator');
    if (!el) return;
    el.textContent = TAGLINES[0];
    setInterval(() => {
      idx = (idx + 1) % TAGLINES.length;
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      setTimeout(() => {
        el.textContent = TAGLINES[idx];
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 300);
    }, 4000);
  }
  return { init };
})();

// ── 7. KEYBOARD SHORTCUTS SYSTEM ─────────────────────────────
(function initKeyboardShortcuts() {
  const SHORTCUTS = {
    '1': 'screenshot', '2': 'ocr', '3': 'compress',
    '4': 'resize', '5': 'convert', '6': 'watermark',
    '7': 'merge', '8': 'share', '0': 'home',
  };
  document.addEventListener('keydown', e => {
    // Skip if typing in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (SHORTCUTS[e.key] && typeof activateTab === 'function') {
      activateTab(SHORTCUTS[e.key]);
    }
  });
})();

// ── 8. PERFORMANCE — Lazy section observer ───────────────────
(function initLazyObserver() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.workflow-card, .home-card, .how-step, .about-card').forEach(el => {
    observer.observe(el);
  });
})();

// ── INIT ALL PHASE 3 SYSTEMS ──────────────────────────────────
function initPhase3() {
  SmartOptimize.init();
  SSPhase3.init();
  BatchQueue.init();
  MotionSystem.init();
  IdentitySystem.init();

  // Wire smart suggestions to compress + screenshot upload
  const compressUpload = document.getElementById('compressUpload');
  if (compressUpload) {
    compressUpload.addEventListener('change', () => {
      setTimeout(() => {
        if (typeof compressFile !== 'undefined' && compressFile) {
          const img = document.getElementById('compressImg');
          SmartSuggestions.showBanner(compressFile, img, 'compressSuggestions');
        }
      }, 300);
    });
  }
  const ssUpload = document.getElementById('ssUpload');
  if (ssUpload) {
    ssUpload.addEventListener('change', () => {
      setTimeout(() => {
        if (typeof ssFile !== 'undefined' && ssFile) {
          const img = document.getElementById('ssImg');
          SmartSuggestions.showBanner(ssFile, img, 'ssSuggestions');
        }
      }, 300);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhase3);
} else {
  initPhase3();
}
