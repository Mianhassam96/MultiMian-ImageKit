// ══════════════════════════════════════════════════════════════
// MultiMian ImageKit — Crop Tool
// Canvas-based interactive crop with handles, ratio lock, presets
// ══════════════════════════════════════════════════════════════

(function initCropTool() {

  // ── State ────────────────────────────────────────────────────
  let cropFile  = null;
  let imgNative = null;   // full-res Image
  let scale     = 1;      // native → display
  let displayW  = 0, displayH = 0;

  // Crop rect in DISPLAY coords
  let crop = { x: 0, y: 0, w: 0, h: 0 };

  // Drag state
  let drag = null; // null | { type: 'move'|'nw'|'ne'|'sw'|'se'|'n'|'s'|'e'|'w', sx, sy, cx, cy, cw, ch }

  const HANDLE = 10; // half-size of corner/edge handle hit area

  // ── DOM refs ─────────────────────────────────────────────────
  const dropZone     = document.getElementById('cropDrop');
  const fileInput    = document.getElementById('cropUpload');
  const clearBtn     = document.getElementById('cropClear');
  const clearRow     = document.getElementById('cropClearRow');
  const ratioCard    = document.getElementById('cropRatioCard');
  const canvasWrap   = document.getElementById('cropCanvasWrap');
  const stage        = document.getElementById('cropStage');
  const canvas       = document.getElementById('cropCanvas');
  const ctx          = canvas.getContext('2d');
  const previewWrap  = document.getElementById('cropPreviewWrap');
  const previewCanvas= document.getElementById('cropPreviewCanvas');
  const pCtx         = previewCanvas.getContext('2d');
  const ratioSel     = document.getElementById('cropRatio');
  const formatSel    = document.getElementById('cropFormat');
  const sizeLabel    = document.getElementById('cropSizeLabel');
  const ratioLabel   = document.getElementById('cropRatioLabel');
  const cropBtn      = document.getElementById('cropBtn');
  const resetBtn     = document.getElementById('cropResetBtn');
  const successMsg   = document.getElementById('cropSuccess');

  if (!dropZone || !canvas) return; // guard if elements missing

  // ── File load ────────────────────────────────────────────────
  if (typeof setupDrop === 'function') {
    setupDrop(dropZone, fileInput, files => {
      if (files[0]) loadFile(files[0]);
    });
  }

  function loadFile(file) {
    cropFile = file;
    window._cropFile = file; // expose for Share Anywhere
    clearRow.style.display = 'flex';
    ratioCard.style.display = 'block';

    const url = URL.createObjectURL(file);
    imgNative = new Image();
    imgNative.onload = () => {
      URL.revokeObjectURL(url);
      initCanvas();
    };
    imgNative.onerror = () => URL.revokeObjectURL(url);
    imgNative.src = url;
  }

  // ── Canvas setup ─────────────────────────────────────────────
  function initCanvas() {
    const maxW = Math.min(stage.parentElement.clientWidth - 32, 800);
    scale   = Math.min(1, maxW / imgNative.naturalWidth);
    displayW = Math.round(imgNative.naturalWidth  * scale);
    displayH = Math.round(imgNative.naturalHeight * scale);

    canvas.width  = displayW;
    canvas.height = displayH;
    canvas.style.width  = displayW + 'px';
    canvas.style.height = displayH + 'px';

    resetCrop();
    canvasWrap.style.display = 'block';
    cropBtn.disabled  = false;
    resetBtn.disabled = false;
    draw();
    updatePreview();
    successMsg.style.display = 'none';
  }

  // ── Ratio helpers ─────────────────────────────────────────────
  function getAspect() {
    const v = ratioSel.value;
    if (v === 'free') return null;
    const [a, b] = v.split(':').map(Number);
    return a / b;
  }

  function resetCrop() {
    const aspect = getAspect();
    if (aspect) {
      const dAspect = displayW / displayH;
      if (aspect > dAspect) {
        crop.w = displayW;
        crop.h = Math.round(displayW / aspect);
      } else {
        crop.h = displayH;
        crop.w = Math.round(displayH * aspect);
      }
      crop.x = Math.round((displayW - crop.w) / 2);
      crop.y = Math.round((displayH - crop.h) / 2);
    } else {
      crop = { x: 0, y: 0, w: displayW, h: displayH };
    }
  }

  // ── Draw ─────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, displayW, displayH);
    ctx.drawImage(imgNative, 0, 0, displayW, displayH);

    // dim outside crop
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, displayW, displayH);

    // clear inside crop (show image)
    ctx.clearRect(crop.x, crop.y, crop.w, crop.h);
    ctx.drawImage(imgNative, 0, 0, displayW, displayH);
    // re-draw the clear region from image
    ctx.save();
    ctx.beginPath();
    ctx.rect(crop.x, crop.y, crop.w, crop.h);
    ctx.clip();
    ctx.drawImage(imgNative, 0, 0, displayW, displayH);
    ctx.restore();

    // Crop border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);

    // Rule-of-thirds grid
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 0.8;
    for (let i = 1; i < 3; i++) {
      const x = crop.x + crop.w * i / 3;
      const y = crop.y + crop.h * i / 3;
      ctx.beginPath(); ctx.moveTo(x, crop.y); ctx.lineTo(x, crop.y + crop.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(crop.x, y); ctx.lineTo(crop.x + crop.w, y); ctx.stroke();
    }

    // Corner handles
    const hs = 8;
    ctx.fillStyle = '#fff';
    const handles = getHandlePositions();
    handles.forEach(h => {
      if (h.corner) {
        ctx.fillRect(h.x - hs/2, h.y - hs/2, hs, hs);
      } else {
        // edge handle — smaller pill
        if (h.edge === 'n' || h.edge === 's') {
          ctx.fillRect(h.x - 12, h.y - 3, 24, 6);
        } else {
          ctx.fillRect(h.x - 3, h.y - 12, 6, 24);
        }
      }
    });

    // Update info
    const nW = Math.round(crop.w / scale);
    const nH = Math.round(crop.h / scale);
    sizeLabel.textContent = `${nW} × ${nH} px`;
    const g = gcd(nW, nH);
    ratioLabel.textContent = g > 0 ? `${nW/g}:${nH/g}` : '–';
  }

  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

  // ── Handle positions ─────────────────────────────────────────
  function getHandlePositions() {
    const { x, y, w, h } = crop;
    return [
      { edge: 'nw', corner: true,  x: x,       y: y       },
      { edge: 'ne', corner: true,  x: x + w,   y: y       },
      { edge: 'sw', corner: true,  x: x,       y: y + h   },
      { edge: 'se', corner: true,  x: x + w,   y: y + h   },
      { edge: 'n',  corner: false, x: x + w/2, y: y       },
      { edge: 's',  corner: false, x: x + w/2, y: y + h   },
      { edge: 'w',  corner: false, x: x,       y: y + h/2 },
      { edge: 'e',  corner: false, x: x + w,   y: y + h/2 },
    ];
  }

  function hitHandle(px, py) {
    for (const h of getHandlePositions()) {
      if (Math.abs(px - h.x) <= HANDLE && Math.abs(py - h.y) <= HANDLE) return h.edge;
    }
    return null;
  }

  function hitInside(px, py) {
    return px > crop.x + HANDLE && px < crop.x + crop.w - HANDLE &&
           py > crop.y + HANDLE && py < crop.y + crop.h - HANDLE;
  }

  // ── Pointer events ───────────────────────────────────────────
  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.round((clientX - r.left) * (displayW / r.width)),
      y: Math.round((clientY - r.top)  * (displayH / r.height)),
    };
  }

  function onDown(e) {
    e.preventDefault();
    const { x, y } = getPos(e);
    const handle = hitHandle(x, y);
    if (handle) {
      drag = { type: handle, sx: x, sy: y, ...crop };
    } else if (hitInside(x, y)) {
      drag = { type: 'move', sx: x, sy: y, ...crop };
    } else {
      // Start a new crop from scratch
      drag = { type: 'new', sx: x, sy: y, ...crop };
      crop = { x, y, w: 0, h: 0 };
    }
  }

  function onMove(e) {
    if (!drag) {
      // Update cursor
      const { x, y } = getPos(e);
      const handle = hitHandle(x, y);
      if (handle) {
        canvas.style.cursor = getCursor(handle);
      } else if (hitInside(x, y)) {
        canvas.style.cursor = 'move';
      } else {
        canvas.style.cursor = 'crosshair';
      }
      return;
    }
    e.preventDefault();
    const { x, y } = getPos(e);
    const dx = x - drag.sx, dy = y - drag.sy;
    const aspect = getAspect();

    if (drag.type === 'move') {
      crop.x = clamp(drag.x + dx, 0, displayW - crop.w);
      crop.y = clamp(drag.y + dy, 0, displayH - crop.h);
    } else if (drag.type === 'new') {
      const x1 = Math.min(drag.sx, x), y1 = Math.min(drag.sy, y);
      const x2 = Math.max(drag.sx, x), y2 = Math.max(drag.sy, y);
      crop.x = x1; crop.y = y1;
      crop.w = Math.max(10, x2 - x1);
      crop.h = Math.max(10, y2 - y1);
      if (aspect) {
        crop.h = Math.round(crop.w / aspect);
        if (crop.y + crop.h > displayH) { crop.h = displayH - crop.y; crop.w = Math.round(crop.h * aspect); }
      }
    } else {
      resizeBy(drag.type, dx, dy, aspect);
    }

    draw();
    updatePreview();
  }

  function onUp() { drag = null; updatePreview(); }

  function resizeBy(edge, dx, dy, aspect) {
    let { x, y, w, h } = drag;

    if (edge.includes('e')) w = Math.max(20, w + dx);
    if (edge.includes('s')) h = Math.max(20, h + dy);
    if (edge.includes('w')) { x = clamp(x + dx, 0, drag.x + drag.w - 20); w = drag.x + drag.w - x; }
    if (edge.includes('n')) { y = clamp(y + dy, 0, drag.y + drag.h - 20); h = drag.y + drag.h - y; }

    if (aspect) {
      if (edge === 'n' || edge === 's') { w = Math.round(h * aspect); }
      else { h = Math.round(w / aspect); }
    }

    // Clamp to image bounds
    w = Math.min(w, displayW - x);
    h = Math.min(h, displayH - y);
    x = Math.max(0, x); y = Math.max(0, y);
    w = Math.max(20, w); h = Math.max(20, h);

    crop = { x, y, w, h };
  }

  function getCursor(edge) {
    const map = { nw:'nw-resize', ne:'ne-resize', sw:'sw-resize', se:'se-resize', n:'n-resize', s:'s-resize', e:'e-resize', w:'w-resize' };
    return map[edge] || 'default';
  }

  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

  canvas.addEventListener('mousedown',  onDown, { passive: false });
  canvas.addEventListener('mousemove',  onMove);
  canvas.addEventListener('mouseup',    onUp);
  canvas.addEventListener('mouseleave', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: false });
  canvas.addEventListener('touchmove',  onMove, { passive: false });
  canvas.addEventListener('touchend',   onUp);

  // ── Preview ───────────────────────────────────────────────────
  function updatePreview() {
    const nX = Math.round(crop.x / scale);
    const nY = Math.round(crop.y / scale);
    const nW = Math.round(crop.w / scale);
    const nH = Math.round(crop.h / scale);
    if (!nW || !nH) return;

    const maxPrev = 300;
    const ps = Math.min(1, maxPrev / Math.max(nW, nH));
    previewCanvas.width  = Math.round(nW * ps);
    previewCanvas.height = Math.round(nH * ps);
    pCtx.drawImage(imgNative, nX, nY, nW, nH, 0, 0, previewCanvas.width, previewCanvas.height);
    previewWrap.style.display = 'block';
  }

  // ── Ratio change ─────────────────────────────────────────────
  ratioSel.addEventListener('change', () => {
    if (!imgNative) return;
    resetCrop(); draw(); updatePreview();
  });

  // Social preset buttons
  document.querySelectorAll('[data-crop-ratio]').forEach(btn => {
    btn.addEventListener('click', () => {
      ratioSel.value = btn.dataset.cropRatio;
      if (!imgNative) return;
      resetCrop(); draw(); updatePreview();
    });
  });

  // ── Reset ────────────────────────────────────────────────────
  resetBtn.addEventListener('click', () => {
    if (!imgNative) return;
    resetCrop(); draw(); updatePreview();
  });

  // ── Download ─────────────────────────────────────────────────
  cropBtn.addEventListener('click', () => {
    if (!imgNative || !cropFile) return;

    const nX = Math.round(crop.x / scale);
    const nY = Math.round(crop.y / scale);
    const nW = Math.round(crop.w / scale);
    const nH = Math.round(crop.h / scale);
    if (!nW || !nH) return;

    const out = document.createElement('canvas');
    out.width  = nW;
    out.height = nH;
    out.getContext('2d').drawImage(imgNative, nX, nY, nW, nH, 0, 0, nW, nH);

    const mime = formatSel.value;
    const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const ext = extMap[mime] || 'png';
    const quality = mime === 'image/jpeg' ? 0.92 : mime === 'image/webp' ? 0.9 : 1;

    out.toBlob(blob => {
      if (!blob) return;
      const blobUrl = URL.createObjectURL(blob);
      const name = cropFile.name.replace(/\.[^.]+$/, '') + `-cropped-${nW}x${nH}.${ext}`;
      if (typeof triggerDownload === 'function') triggerDownload(blobUrl, name);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      successMsg.style.display = 'block';
      if (typeof SessionTracker !== 'undefined') SessionTracker.increment('Cropped!');
      if (typeof AssetPipeline !== 'undefined') {
        const file = new File([blob], name, { type: mime });
        AssetPipeline.set(file, blob, 'crop');
      }
      // enable share btn
      const shareBtn = document.getElementById('cropShareBtn');
      if (shareBtn) shareBtn.disabled = false;
    }, mime, quality);
  });

  // ── Clear ────────────────────────────────────────────────────
  clearBtn.addEventListener('click', () => {
    cropFile = null; imgNative = null;
    clearRow.style.display  = 'none';
    ratioCard.style.display = 'none';
    canvasWrap.style.display = 'none';
    previewWrap.style.display = 'none';
    cropBtn.disabled = true;
    resetBtn.disabled = true;
    successMsg.style.display = 'none';
    fileInput.value = '';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // ── Share Anywhere support ────────────────────────────────────
  // cropFile is captured by closure — ShareAnywhere reads it via toolFileGetters

})();
