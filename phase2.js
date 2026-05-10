// ══════════════════════════════════════════════════════════════
// MultiMian ImageKit — Phase 2 Engine
// Workflow Platform: Command Palette, Shared Pipeline,
// Universal Export Pack, Image Health Score, Recent Workspace,
// PWA, Progressive Disclosure, SS Presets
// ══════════════════════════════════════════════════════════════

// ── Shared Asset Pipeline ─────────────────────────────────────
const AssetPipeline = (() => {
  let _current = null;

  function set(file, blob, toolName) {
    _current = {
      id: Date.now(),
      originalFile: file,
      currentBlob: blob || file,
      history: [],
      metadata: { name: file.name, size: file.size, type: file.type },
      workflowState: { lastTool: toolName, timestamp: Date.now() }
    };
    RecentWorkspace.save(_current);
    WorkflowEngine.suggest(toolName);
  }

  function get() { return _current; }
  function getCurrent() { return _current ? (_current.currentBlob || _current.originalFile) : null; }

  function update(blob, toolName) {
    if (!_current) return;
    _current.history.push({ blob: _current.currentBlob, tool: _current.workflowState.lastTool });
    _current.currentBlob = blob;
    _current.workflowState = { lastTool: toolName, timestamp: Date.now() };
    WorkflowEngine.suggest(toolName);
  }

  return { set, get, getCurrent, update };
})();

// ── Workflow Engine ───────────────────────────────────────────
const WorkflowEngine = (() => {
  const SUGGESTIONS = {
    compress:    [{ tab:'convert', icon:'🔄', name:'Convert to WebP', desc:'Save another 25% with WebP format' }, { tab:'resize', icon:'✂️', name:'Resize for Social', desc:'Fit Instagram, Twitter, LinkedIn' }, { tab:'share', icon:'🌐', name:'Share Public Link', desc:'Get a shareable URL + QR code' }],
    resize:      [{ tab:'compress', icon:'🗜', name:'Compress It', desc:'Reduce file size after resizing' }, { tab:'watermark', icon:'💧', name:'Add Watermark', desc:'Protect before sharing' }, { tab:'share', icon:'🌐', name:'Share Public Link', desc:'Get a shareable URL + QR code' }],
    convert:     [{ tab:'compress', icon:'🗜', name:'Compress Further', desc:'Squeeze more size out' }, { tab:'share', icon:'🌐', name:'Share Public Link', desc:'Get a shareable URL + QR code' }],
    watermark:   [{ tab:'compress', icon:'🗜', name:'Compress It', desc:'Reduce size before sharing' }, { tab:'share', icon:'🌐', name:'Share Public Link', desc:'Get a shareable URL + QR code' }],
    screenshot:  [{ tab:'compress', icon:'🗜', name:'Compress for Web', desc:'Reduce size for faster loading' }, { tab:'share', icon:'🌐', name:'Share Public Link', desc:'Get a shareable URL + QR code' }, { tab:'resize', icon:'✂️', name:'Resize for Social', desc:'Fit any platform size' }],
    ocr:         [{ tab:'compress', icon:'🗜', name:'Compress Original', desc:'Reduce the source image size' }, { tab:'screenshot', icon:'✨', name:'Beautify Screenshot', desc:'Add frame and background' }],
    merge:       [{ tab:'compress', icon:'🗜', name:'Compress Result', desc:'Reduce merged image size' }, { tab:'share', icon:'🌐', name:'Share Public Link', desc:'Get a shareable URL + QR code' }],
    sticker:     [{ tab:'share', icon:'🌐', name:'Share Public Link', desc:'Get a shareable URL + QR code' }, { tab:'compress', icon:'🗜', name:'Compress It', desc:'Reduce sticker file size' }],
    gif:         [{ tab:'share', icon:'🌐', name:'Share Public Link', desc:'Get a shareable URL + QR code' }],
    videogif:    [{ tab:'share', icon:'🌐', name:'Share Public Link', desc:'Get a shareable URL + QR code' }],
  };

  function suggest(toolName) {
    const panel = document.getElementById('workflowPanel');
    const actionsEl = document.getElementById('wfpActions');
    if (!panel || !actionsEl) return;
    const suggestions = SUGGESTIONS[toolName];
    if (!suggestions || !suggestions.length) return;

    actionsEl.innerHTML = suggestions.map(s =>
      `<button class="wfp-action-btn" data-tab="${s.tab}">
        <span class="wfp-action-icon">${s.icon}</span>
        <span class="wfp-action-text">
          <span class="wfp-action-name">${s.name}</span>
          <span class="wfp-action-desc">${s.desc}</span>
        </span>
      </button>`
    ).join('');

    actionsEl.querySelectorAll('.wfp-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activateTab(btn.dataset.tab);
        panel.style.display = 'none';
      });
    });

    panel.style.display = 'block';
    setTimeout(() => { panel.style.display = 'none'; }, 12000);
  }

  return { suggest };
})();

// ── Recent Workspace ──────────────────────────────────────────
const RecentWorkspace = (() => {
  const KEY = 'ik_recent_v2';
  const MAX = 6;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  }

  function save(asset) {
    const items = load().filter(i => i.name !== asset.metadata.name);
    items.unshift({
      name: asset.metadata.name,
      size: asset.metadata.size,
      tool: asset.workflowState.lastTool,
      ts: Date.now(),
      thumb: null // populated async
    });
    if (items.length > MAX) items.length = MAX;
    // Generate thumbnail
    if (asset.originalFile && asset.originalFile.type && asset.originalFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          const s = Math.min(1, 160 / Math.max(img.naturalWidth, img.naturalHeight));
          c.width = img.naturalWidth * s; c.height = img.naturalHeight * s;
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          items[0].thumb = c.toDataURL('image/jpeg', 0.7);
          try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
          render();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(asset.originalFile);
    }
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
    render();
  }

  function render() {
    const grid = document.getElementById('rwGrid');
    const section = document.getElementById('recentWorkspace');
    if (!grid || !section) return;
    const items = load();
    if (!items.length) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    grid.innerHTML = items.map(item => `
      <div class="rw-item" data-tab="${item.tool || 'home'}">
        ${item.thumb ? `<img class="rw-thumb" src="${item.thumb}" alt="${item.name}">` : `<div class="rw-thumb" style="display:flex;align-items:center;justify-content:center;font-size:2em;">🖼</div>`}
        <div class="rw-info">
          <div class="rw-name">${item.name}</div>
          <div class="rw-meta">${formatBytes(item.size)} · ${timeAgo(item.ts)}</div>
        </div>
        <span class="rw-tool-badge">${item.tool || 'tool'}</span>
      </div>
    `).join('');
    grid.querySelectorAll('.rw-item').forEach(el => {
      el.addEventListener('click', () => activateTab(el.dataset.tab));
    });
  }

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s/60) + 'm ago';
    if (s < 86400) return Math.floor(s/3600) + 'h ago';
    return Math.floor(s/86400) + 'd ago';
  }

  return { save, render };
})();

// ── Command Palette ───────────────────────────────────────────
(function initCommandPalette() {
  const COMMANDS = [
    { name: 'Screenshot Studio', desc: 'Frames, shadows & gradients', icon: '✨', tab: 'screenshot', tags: ['screenshot','frame','beautify','macOS','browser'] },
    { name: 'Image → Text (OCR)', desc: 'Extract text from any image', icon: '🔤', tab: 'ocr', tags: ['ocr','text','extract','scan'] },
    { name: 'Compress Image', desc: 'Reduce file size', icon: '🗜', tab: 'compress', tags: ['compress','reduce','optimize','size'] },
    { name: 'Resize Image', desc: 'Custom dimensions & social presets', icon: '✂️', tab: 'resize', tags: ['resize','dimensions','social','instagram','youtube'] },
    { name: 'Format Convert', desc: 'JPG ↔ PNG ↔ WebP', icon: '🔄', tab: 'convert', tags: ['convert','format','webp','jpg','png'] },
    { name: 'Watermark', desc: 'Text overlay & tile', icon: '💧', tab: 'watermark', tags: ['watermark','protect','copyright'] },
    { name: 'Merge Images', desc: 'Side-by-side or stacked', icon: '🔗', tab: 'merge', tags: ['merge','combine','collage'] },
    { name: 'Share Image', desc: 'Get public link + QR', icon: '🌐', tab: 'share', tags: ['share','link','qr','upload'] },
    { name: 'Text Studio', desc: 'Write, format & export', icon: '📝', tab: 'pdf', tags: ['text','pdf','write','export','docx'] },
    { name: 'PDF → Image', desc: 'Pages to PNG / JPG + ZIP', icon: '🖼', tab: 'pdf2img', tags: ['pdf','image','convert','pages'] },
    { name: 'Image → GIF', desc: 'Multi-frame animated GIF', icon: '🎞', tab: 'gif', tags: ['gif','animate','frames'] },
    { name: 'Video → GIF', desc: 'Clip to GIF converter', icon: '🎬', tab: 'videogif', tags: ['video','gif','clip','convert'] },
    { name: 'Image → Sticker', desc: '512×512 PNG / WebP', icon: '🎨', tab: 'sticker', tags: ['sticker','whatsapp','telegram','512'] },
    { name: 'Toggle Dark Mode', desc: 'Switch light/dark theme', icon: '🌙', action: () => document.getElementById('darkToggle').click(), tags: ['dark','light','theme'] },
    { name: 'Go Home', desc: 'Back to home page', icon: '🏠', tab: 'home', tags: ['home','start'] },
    { name: 'About', desc: 'About MultiMian ImageKit', icon: 'ℹ️', tab: 'about', tags: ['about','info'] },
    { name: 'Contact', desc: 'Get in touch', icon: '✉️', tab: 'contact', tags: ['contact','email'] },
  ];

  const palette = document.getElementById('cmdPalette');
  const backdrop = document.getElementById('cmdBackdrop');
  const input = document.getElementById('cmdInput');
  const results = document.getElementById('cmdResults');
  const openBtn = document.getElementById('cmdPaletteBtn');
  if (!palette) return;

  let selectedIdx = 0;
  let filtered = [];

  function open() {
    palette.style.display = 'flex';
    input.value = '';
    renderResults('');
    setTimeout(() => input.focus(), 50);
  }

  function close() {
    palette.style.display = 'none';
  }

  function renderResults(query) {
    const q = query.toLowerCase().trim();
    filtered = q
      ? COMMANDS.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.desc.toLowerCase().includes(q) ||
          c.tags.some(t => t.includes(q))
        )
      : COMMANDS;

    selectedIdx = 0;
    if (!filtered.length) {
      results.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3);font-size:0.84em;">No results found</div>';
      return;
    }

    const tools = filtered.filter(c => c.tab && c.tab !== 'home' && c.tab !== 'about' && c.tab !== 'contact');
    const actions = filtered.filter(c => c.action || c.tab === 'home' || c.tab === 'about' || c.tab === 'contact');

    let html = '';
    if (tools.length) {
      html += '<div class="cmd-group-label">Tools</div>';
      html += tools.map((c, i) => renderItem(c, i)).join('');
    }
    if (actions.length) {
      html += '<div class="cmd-group-label">Actions</div>';
      html += actions.map((c, i) => renderItem(c, tools.length + i)).join('');
    }
    results.innerHTML = html;
    results.querySelectorAll('.cmd-result-item').forEach((el, i) => {
      el.addEventListener('click', () => execute(filtered[i]));
      el.addEventListener('mouseenter', () => { selectedIdx = i; highlight(); });
    });
    highlight();
  }

  function renderItem(c, i) {
    return `<div class="cmd-result-item" data-idx="${i}">
      <div class="cmd-result-icon">${c.icon}</div>
      <div class="cmd-result-text">
        <div class="cmd-result-name">${c.name}</div>
        <div class="cmd-result-desc">${c.desc}</div>
      </div>
      ${c.tab ? `<span class="cmd-result-tag">${c.tab}</span>` : ''}
    </div>`;
  }

  function highlight() {
    results.querySelectorAll('.cmd-result-item').forEach((el, i) => {
      el.classList.toggle('selected', i === selectedIdx);
    });
    const sel = results.querySelector('.selected');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  function execute(cmd) {
    close();
    if (cmd.action) { cmd.action(); return; }
    if (cmd.tab) activateTab(cmd.tab);
  }

  input.addEventListener('input', () => renderResults(input.value));

  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = Math.min(selectedIdx + 1, filtered.length - 1); highlight(); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); selectedIdx = Math.max(selectedIdx - 1, 0); highlight(); }
    if (e.key === 'Enter')     { e.preventDefault(); if (filtered[selectedIdx]) execute(filtered[selectedIdx]); }
    if (e.key === 'Escape')    close();
  });

  backdrop.addEventListener('click', close);
  if (openBtn) openBtn.addEventListener('click', open);

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); open(); }
  });

  document.getElementById('wfpClose')?.addEventListener('click', () => {
    document.getElementById('workflowPanel').style.display = 'none';
  });
})();

// ── Universal Export Pack ─────────────────────────────────────
(function initUEP() {
  const drop = document.getElementById('uepDrop');
  const upload = document.getElementById('uepUpload');
  if (!drop || !upload) return;

  const SIZES = [
    { name: 'instagram-post',    w: 1080, h: 1080, label: 'Instagram Post' },
    { name: 'instagram-story',   w: 1080, h: 1920, label: 'Instagram Story' },
    { name: 'twitter-post',      w: 1200, h: 675,  label: 'Twitter/X Post' },
    { name: 'linkedin-post',     w: 1200, h: 627,  label: 'LinkedIn Post' },
    { name: 'youtube-thumbnail', w: 1280, h: 720,  label: 'YouTube Thumbnail' },
    { name: 'blog-hero',         w: 1600, h: 900,  label: 'Blog Hero' },
    { name: 'open-graph',        w: 1200, h: 630,  label: 'Open Graph' },
    { name: 'favicon',           w: 32,   h: 32,   label: 'Favicon' },
    { name: 'webp-optimized',    w: null, h: null,  label: 'WebP Optimized', webp: true },
  ];

  function resizeToCanvas(img, w, h) {
    const c = document.createElement('canvas');
    if (!w) { c.width = img.naturalWidth; c.height = img.naturalHeight; }
    else {
      c.width = w; c.height = h;
      const r = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * r, dh = img.naturalHeight * r;
      const dx = (w - dw) / 2, dy = (h - dh) / 2;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, dx, dy, dw, dh);
    }
    return c;
  }

  async function processFile(file) {
    const fill = document.getElementById('uepFill');
    const label = document.getElementById('uepLabel');
    const progress = document.getElementById('uepProgress');
    const success = document.getElementById('uepSuccess');
    progress.style.display = 'block';
    success.style.display = 'none';

    const url = URL.createObjectURL(file);
    const img = await new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
    });

    const zip = new JSZip();
    for (let i = 0; i < SIZES.length; i++) {
      const s = SIZES[i];
      label.textContent = `Generating ${s.label}…`;
      fill.style.width = Math.round(((i + 1) / SIZES.length) * 100) + '%';
      const c = resizeToCanvas(img, s.w, s.h);
      const mime = s.webp ? 'image/webp' : 'image/jpeg';
      const ext  = s.webp ? 'webp' : (s.name === 'favicon' ? 'png' : 'jpg');
      const quality = s.webp ? 0.85 : (s.name === 'favicon' ? 1 : 0.9);
      const blob = await new Promise(res => c.toBlob(res, s.name === 'favicon' ? 'image/png' : mime, quality));
      zip.file(`${s.name}.${ext}`, blob);
      await new Promise(r => setTimeout(r, 10)); // yield to UI
    }

    label.textContent = 'Creating ZIP…';
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    triggerDownload(URL.createObjectURL(zipBlob), `${baseName}-export-pack.zip`);
    URL.revokeObjectURL(url);
    progress.style.display = 'none';
    success.style.display = 'block';
    AssetPipeline.set(file, null, 'compress');
  }

  setupDrop(drop, upload, files => {
    if (!files[0]) return;
    processFile(files[0]).catch(err => {
      document.getElementById('uepProgress').style.display = 'none';
      alert('Export pack failed: ' + err.message);
    });
  });
})();

// ── Image Health Score ────────────────────────────────────────
(function initHealthScore() {
  const drop = document.getElementById('ihsDrop');
  const upload = document.getElementById('ihsUpload');
  const result = document.getElementById('ihsResult');
  if (!drop || !upload) return;

  function score(file, img) {
    let points = 100;
    const issues = [];
    const sizeMB = file.size / 1048576;
    const sizeKB = file.size / 1024;
    const ext = (file.type || '').split('/')[1] || file.name.split('.').pop().toLowerCase();
    const w = img.naturalWidth, h = img.naturalHeight;

    // Size scoring
    if (sizeMB > 5)      { points -= 25; issues.push({ type:'warn', icon:'⚠️', text:`File is ${sizeMB.toFixed(1)} MB — very large. Compress to reduce by 70–90%.`, fix:'compress' }); }
    else if (sizeMB > 2) { points -= 15; issues.push({ type:'warn', icon:'⚠️', text:`File is ${sizeMB.toFixed(1)} MB — above recommended. Compress for web.`, fix:'compress' }); }
    else if (sizeMB > 0.5){ points -= 5; issues.push({ type:'info', icon:'💡', text:`File is ${sizeMB.toFixed(1)} MB — acceptable but could be smaller.`, fix:'compress' }); }
    else                  { issues.push({ type:'good', icon:'✅', text:`File size is great (${sizeKB.toFixed(0)} KB) — well optimized.` }); }

    // Format scoring
    if (ext === 'bmp')  { points -= 20; issues.push({ type:'warn', icon:'⚠️', text:'BMP is uncompressed. Convert to WebP or JPG for 90%+ savings.', fix:'convert' }); }
    if (ext === 'tiff') { points -= 10; issues.push({ type:'warn', icon:'⚠️', text:'TIFF is large. Convert to WebP or PNG for web use.', fix:'convert' }); }
    if (ext === 'png' && sizeMB > 1) { points -= 8; issues.push({ type:'info', icon:'💡', text:'Large PNG — converting to WebP could save 25–35%.', fix:'convert' }); }
    if (ext === 'webp') { issues.push({ type:'good', icon:'✅', text:'WebP format — excellent choice for web performance.' }); }

    // Resolution scoring
    if (w > 4000 || h > 4000) { points -= 15; issues.push({ type:'warn', icon:'📐', text:`Very high resolution (${w}×${h}px). Most screens need max 1920×1080.`, fix:'resize' }); }
    else if (w < 400 || h < 400) { points -= 10; issues.push({ type:'warn', icon:'🔍', text:`Low resolution (${w}×${h}px). May appear blurry on larger screens.` }); }
    else { issues.push({ type:'good', icon:'✅', text:`Resolution (${w}×${h}px) is good for most use cases.` }); }

    // Aspect ratio hints
    if (w === h) issues.push({ type:'info', icon:'📱', text:'Square image — perfect for Instagram posts and stickers.' });
    if (w / h > 2.5) issues.push({ type:'info', icon:'🖥', text:'Very wide image — great for banners but may crop on social media.' });

    points = Math.max(0, Math.min(100, points));
    return { points, issues };
  }

  function render(file, img) {
    const { points, issues } = score(file, img);
    const cls = points >= 80 ? 'ihs-score-good' : points >= 50 ? 'ihs-score-ok' : 'ihs-score-poor';
    const label = points >= 80 ? 'Healthy' : points >= 50 ? 'Needs Work' : 'Poor';
    const primaryFix = issues.find(i => i.fix);

    result.innerHTML = `
      <div class="ihs-score-row">
        <div class="ihs-score-circle ${cls}">
          <span class="ihs-score-num">${points}</span>
          <span class="ihs-score-max">/100</span>
        </div>
        <div>
          <div class="ihs-score-label">${label}</div>
          <div class="ihs-score-sub">${issues.length} insight${issues.length !== 1 ? 's' : ''} found</div>
        </div>
      </div>
      <div class="ihs-issues">
        ${issues.map(i => `
          <div class="ihs-issue ihs-issue-${i.type}">
            <span class="ihs-issue-icon">${i.icon}</span>
            <span class="ihs-issue-text">${i.text}</span>
          </div>
        `).join('')}
      </div>
      ${primaryFix ? `<button class="ihs-fix-btn" data-tab="${primaryFix.fix}">🔧 Fix with ${primaryFix.fix.charAt(0).toUpperCase() + primaryFix.fix.slice(1)} Tool →</button>` : ''}
    `;
    result.style.display = 'block';
    result.querySelector('.ihs-fix-btn')?.addEventListener('click', e => {
      activateTab(e.currentTarget.dataset.tab);
    });
  }

  setupDrop(drop, upload, files => {
    if (!files[0]) return;
    const file = files[0];
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { render(file, img); URL.revokeObjectURL(url); };
    img.onerror = () => { result.innerHTML = '<div style="padding:12px;color:var(--text3);font-size:0.84em;">Could not analyze this file.</div>'; result.style.display = 'block'; };
    img.src = url;
  });
})();

// ── Progressive Disclosure (Compress) ────────────────────────
(function initProgressiveDisclosure() {
  // Quick mode buttons
  document.querySelectorAll('.qm-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.qm-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const q = parseInt(btn.dataset.quality);
      const slider = document.getElementById('qualitySlider');
      const val = document.getElementById('qualityValue');
      if (slider) { slider.value = q; if (val) val.textContent = q; }
      // Trigger preview update
      if (typeof updateCompressPreview === 'function') updateCompressPreview();
    });
  });

  // Advanced toggle
  const toggle = document.getElementById('compressAdvancedToggle');
  const panel = document.getElementById('compressAdvanced');
  if (toggle && panel) {
    toggle.addEventListener('click', () => {
      const open = panel.style.display !== 'none';
      panel.style.display = open ? 'none' : 'block';
      toggle.classList.toggle('open', !open);
    });
  }
})();

// ── Screenshot Studio — New Presets ──────────────────────────
// Extends the existing renderScreenshotStudio with new styles
// Patch drawBackground to support new types
(function patchSSPresets() {
  const origDraw = window.drawBackground;
  if (!origDraw) return;

  window.drawBackground = function(ctx, w, h, type) {
    const extra = {
      'gradient-pink':   ['#f472b6','#a855f7'],
      'gradient-orange': ['#f97316','#eab308'],
      'gradient-teal':   ['#14b8a6','#06b6d4'],
      'mesh-1': null, // handled below
    };
    if (type in extra) {
      const stops = extra[type];
      if (!stops) {
        // mesh gradient
        const g1 = ctx.createRadialGradient(w*0.2, h*0.3, 0, w*0.2, h*0.3, w*0.6);
        g1.addColorStop(0, '#6366f1'); g1.addColorStop(1, 'transparent');
        ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = g1; ctx.fillRect(0, 0, w, h);
        const g2 = ctx.createRadialGradient(w*0.8, h*0.7, 0, w*0.8, h*0.7, w*0.5);
        g2.addColorStop(0, '#16a34a'); g2.addColorStop(1, 'transparent');
        ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);
        return;
      }
      const grd = ctx.createLinearGradient(0, 0, w, h);
      stops.forEach((c, i) => grd.addColorStop(i / (stops.length - 1), c));
      ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      return;
    }
    origDraw(ctx, w, h, type);
  };

  // Patch renderScreenshotStudio to handle new style types
  const origRender = window.renderScreenshotStudio;
  if (!origRender) return;

  window.renderScreenshotStudio = function() {
    const style = window.ssCurrentStyle;
    // New styles that use the simple rounded path
    const simpleStyles = ['tweet', 'producthunt', 'code', 'glass'];
    if (simpleStyles.includes(style)) {
      // Temporarily set to 'none' so base function draws simple rounded
      window.ssCurrentStyle = 'none';
      origRender();
      window.ssCurrentStyle = style;
      // Now overlay the style-specific decoration
      const canvas = document.getElementById('ssCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      if (style === 'tweet') {
        // Twitter card overlay
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, h - 48, w, 48);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.round(w * 0.022)}px system-ui`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText('🐦 Share on X / Twitter', 16, h - 24);
      } else if (style === 'producthunt') {
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        const bh = 44, bw = Math.min(200, w * 0.4);
        const bx = w - bw - 16, by = h - bh - 16;
        roundRect(ctx, bx, by, bw, bh, 10); ctx.fill();
        ctx.fillStyle = '#da552f';
        ctx.font = `bold ${Math.round(w * 0.022)}px system-ui`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('▲ Product Hunt', bx + bw / 2, by + bh / 2);
      } else if (style === 'code') {
        // Code editor top bar
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, w, 36);
        ['#ff5f57','#febc2e','#28c840'].forEach((c, i) => {
          ctx.beginPath(); ctx.arc(14 + i * 20, 18, 6, 0, Math.PI * 2);
          ctx.fillStyle = c; ctx.fill();
        });
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = `${Math.round(w * 0.018)}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('code.js', w / 2, 18);
      } else if (style === 'glass') {
        // Glassmorphism border
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        const pad = 20;
        roundRect(ctx, pad, pad, w - pad*2, h - pad*2, 20);
        ctx.stroke();
        // Spotlight glow
        const grd = ctx.createRadialGradient(w*0.5, 0, 0, w*0.5, 0, h*0.6);
        grd.addColorStop(0, 'rgba(255,255,255,0.12)');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      }
      return;
    }
    origRender();
  };
})();

// ── PWA Install Prompt ────────────────────────────────────────
(function initPWA() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  let deferredPrompt = null;
  const banner = document.getElementById('pwaBanner');
  const installBtn = document.getElementById('pwaInstallBtn');
  const dismissBtn = document.getElementById('pwaDismiss');

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    if (banner && !localStorage.getItem('pwa_dismissed')) {
      setTimeout(() => { banner.style.display = 'flex'; }, 3000);
    }
  });

  installBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (banner) banner.style.display = 'none';
  });

  dismissBtn?.addEventListener('click', () => {
    if (banner) banner.style.display = 'none';
    localStorage.setItem('pwa_dismissed', '1');
  });
})();

// ── Patch tool downloads to feed AssetPipeline ───────────────
(function patchPipeline() {
  // Patch compress
  const compressBtn = document.getElementById('compressBtn');
  if (compressBtn) {
    compressBtn.addEventListener('click', () => {
      setTimeout(() => {
        if (typeof compressFile !== 'undefined' && compressFile) {
          AssetPipeline.set(compressFile, null, 'compress');
        }
      }, 500);
    });
  }
  // Patch resize
  const resizeBtn = document.getElementById('resizeBtn');
  if (resizeBtn) {
    resizeBtn.addEventListener('click', () => {
      setTimeout(() => {
        if (typeof resizeFile !== 'undefined' && resizeFile) {
          AssetPipeline.set(resizeFile, null, 'resize');
        }
      }, 500);
    });
  }
  // Patch screenshot
  const ssBtn = document.getElementById('ssBtn');
  if (ssBtn) {
    ssBtn.addEventListener('click', () => {
      setTimeout(() => {
        if (typeof ssFile !== 'undefined' && ssFile) {
          AssetPipeline.set(ssFile, null, 'screenshot');
        }
      }, 500);
    });
  }
  // Patch watermark
  const wmBtn = document.getElementById('wmBtn');
  if (wmBtn) {
    wmBtn.addEventListener('click', () => {
      setTimeout(() => {
        if (typeof wmFile !== 'undefined' && wmFile) {
          AssetPipeline.set(wmFile, null, 'watermark');
        }
      }, 500);
    });
  }
})();

// ── Init Recent Workspace on load ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  RecentWorkspace.render();
});
// Also render immediately if DOM already loaded
if (document.readyState !== 'loading') RecentWorkspace.render();
