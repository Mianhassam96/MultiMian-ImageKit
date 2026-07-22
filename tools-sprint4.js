// ══════════════════════════════════════════════════════════════
// MultiMian ImageKit — Sprint 4 Tools
// Favicon Generator · Passport Photo Maker
// ══════════════════════════════════════════════════════════════

// ── 1. FAVICON GENERATOR ─────────────────────────────────────
(function initFaviconTool() {
  const SIZES = [
    { size: 16,  name: 'favicon-16x16.png',   label: '16×16' },
    { size: 32,  name: 'favicon-32x32.png',   label: '32×32' },
    { size: 48,  name: 'favicon-48x48.png',   label: '48×48' },
    { size: 64,  name: 'favicon.png',          label: '64×64' },
    { size: 96,  name: 'favicon-96x96.png',   label: '96×96' },
    { size: 180, name: 'apple-touch-icon.png', label: '180×180 (Apple Touch)' },
    { size: 192, name: 'icon-192.png',         label: '192×192 (Android)' },
    { size: 512, name: 'icon-512.png',         label: '512×512 (PWA)' },
  ];

  let faviconFile = null;

  const drop      = document.getElementById('faviconDrop');
  const upload    = document.getElementById('faviconUpload');
  const preview   = document.getElementById('faviconPreview');
  const img       = document.getElementById('faviconImg');
  const fileInfo  = document.getElementById('faviconFileInfo');
  const clearRow  = document.getElementById('faviconClearRow');
  const sizesCard = document.getElementById('faviconSizesCard');
  const sizesGrid = document.getElementById('faviconSizesGrid');
  const btn       = document.getElementById('faviconBtn');
  const svgBtn    = document.getElementById('faviconDownloadSvg');
  const progress  = document.getElementById('faviconProgress');
  const fill      = document.getElementById('faviconProgressFill');
  const label     = document.getElementById('faviconProgressLabel');
  const success   = document.getElementById('faviconSuccess');

  if (!drop) return;

  if (typeof setupDrop === 'function') {
    setupDrop(drop, upload, files => { if (files[0]) loadFile(files[0]); });
  }

  function loadFile(file) {
    faviconFile = file;
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      preview.style.display = 'block';
      clearRow.style.display = 'flex';
      btn.disabled = false;
      svgBtn.disabled = false;
      buildPreviews();
      sizesCard.style.display = 'block';
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
    if (typeof buildFileInfo === 'function') buildFileInfo(fileInfo, file);
  }

  function renderSize(src, size) {
    return new Promise(res => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(src, 0, 0, size, size);
      canvas.toBlob(blob => res({ blob, canvas }), 'image/png');
    });
  }

  function buildPreviews() {
    sizesGrid.innerHTML = '';
    const src = img;
    SIZES.forEach(({ size, name, label: lbl }) => {
      const wrap = document.createElement('div');
      wrap.className = 'favicon-size-item';
      const c = document.createElement('canvas');
      const displaySize = Math.min(size, 64);
      c.width = c.height = displaySize;
      c.className = 'favicon-preview-canvas';
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(src, 0, 0, displaySize, displaySize);
      const nameLbl = document.createElement('span');
      nameLbl.className = 'favicon-size-label';
      nameLbl.textContent = lbl;
      wrap.appendChild(c);
      wrap.appendChild(nameLbl);
      sizesGrid.appendChild(wrap);
    });
  }

  btn.addEventListener('click', async () => {
    if (!faviconFile || !img.naturalWidth) return;
    btn.disabled = true;
    progress.style.display = 'block';
    success.style.display = 'none';

    try {
      const zip = new JSZip();
      for (let i = 0; i < SIZES.length; i++) {
        const { size, name } = SIZES[i];
        fill.style.width = Math.round(((i + 1) / SIZES.length) * 90) + '%';
        label.textContent = `Generating ${size}×${size}…`;
        const { blob } = await renderSize(img, size);
        zip.file(name, blob);
        await new Promise(r => setTimeout(r, 8));
      }
      // Add manifest snippet
      const manifest = JSON.stringify({
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }, null, 2);
      zip.file('manifest-icons-snippet.json', manifest);
      // Add HTML snippet
      const html = [
        '<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">',
        '<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">',
        '<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">',
        '<link rel="manifest" href="manifest.json">',
      ].join('\n');
      zip.file('html-snippet.txt', html);

      fill.style.width = '100%';
      label.textContent = 'Creating ZIP…';
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const baseName = faviconFile.name.replace(/\.[^.]+$/, '');
      if (typeof triggerDownload === 'function') {
        const url = URL.createObjectURL(zipBlob);
        triggerDownload(url, baseName + '-favicons.zip');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }

      progress.style.display = 'none';
      success.style.display = 'block';
      if (typeof SessionTracker !== 'undefined') SessionTracker.increment('Favicons generated!');
    } catch (err) {
      progress.style.display = 'none';
      alert('Failed to generate favicons: ' + err.message);
    }
    btn.disabled = false;
  });

  // SVG download — wrap original as SVG with embedded image
  svgBtn.addEventListener('click', () => {
    if (!faviconFile || !img.naturalWidth) return;
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    c.getContext('2d').drawImage(img, 0, 0, 512, 512);
    c.toBlob(blob => {
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target.result;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><image href="${dataUrl}" width="512" height="512"/></svg>`;
        const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        if (typeof triggerDownload === 'function') triggerDownload(url, 'favicon.svg');
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      };
      reader.readAsDataURL(blob);
    }, 'image/png');
  });

  document.getElementById('faviconClear')?.addEventListener('click', () => {
    faviconFile = null;
    img.src = '';
    preview.style.display = 'none';
    clearRow.style.display = 'none';
    sizesCard.style.display = 'none';
    sizesGrid.innerHTML = '';
    btn.disabled = true;
    svgBtn.disabled = true;
    success.style.display = 'none';
    progress.style.display = 'none';
    upload.value = '';
  });
})();


// ── 2. PASSPORT PHOTO MAKER ──────────────────────────────────
(function initPassportTool() {
  // Standard definitions: [widthMM, heightMM]
  const STANDARDS = {
    '35x45':    [35, 45],
    '51x51':    [51, 51],
    '35x35':    [35, 35],
    '40x60':    [40, 60],
    '35x45_pk': [35, 45],
    'custom':   [35, 45],
  };
  const BG_COLORS = {
    white:    '#ffffff',
    offwhite: '#f5f5f0',
    lightblue:'#cce5ff',
    gray:     '#e8e8e8',
    custom:   '#ffffff',
  };

  let passportFile = null;
  let passportImg  = null;

  const drop        = document.getElementById('passportDrop');
  const upload      = document.getElementById('passportUpload');
  const preview     = document.getElementById('passportPreview');
  const imgEl       = document.getElementById('passportImg');
  const fileInfo    = document.getElementById('passportFileInfo');
  const clearRow    = document.getElementById('passportClearRow');
  const options     = document.getElementById('passportOptions');
  const canvas      = document.getElementById('passportCanvas');
  const ctx         = canvas?.getContext('2d');
  const btn         = document.getElementById('passportBtn');
  const pdfBtn      = document.getElementById('passportPdfBtn');
  const success     = document.getElementById('passportSuccess');
  const stdSel      = document.getElementById('passportStandard');
  const bgSel       = document.getElementById('passportBg');
  const layoutSel   = document.getElementById('passportLayout');
  const dpiSel      = document.getElementById('passportDpi');

  if (!drop || !canvas) return;

  if (typeof setupDrop === 'function') {
    setupDrop(drop, upload, files => { if (files[0]) loadFile(files[0]); });
  }

  function loadFile(file) {
    passportFile = file;
    const url = URL.createObjectURL(file);
    passportImg = new Image();
    passportImg.onload = () => {
      URL.revokeObjectURL(url);
      imgEl.src = URL.createObjectURL(file);
      preview.style.display = 'block';
      clearRow.style.display = 'flex';
      options.style.display = 'block';
      btn.disabled = false;
      pdfBtn.disabled = false;
      renderPassport();
    };
    passportImg.onerror = () => URL.revokeObjectURL(url);
    passportImg.src = url;
    if (typeof buildFileInfo === 'function') buildFileInfo(fileInfo, file);
  }

  // Show/hide custom size inputs
  stdSel?.addEventListener('change', () => {
    const isCustom = stdSel.value === 'custom';
    document.getElementById('passportCustomW').style.display = isCustom ? '' : 'none';
    document.getElementById('passportCustomH').style.display = isCustom ? '' : 'none';
    if (passportImg) renderPassport();
  });

  bgSel?.addEventListener('change', () => {
    const isCustom = bgSel.value === 'custom';
    document.getElementById('passportCustomBgGroup').style.display = isCustom ? '' : 'none';
    if (passportImg) renderPassport();
  });

  [layoutSel, dpiSel, document.getElementById('passportCustomBg'),
   document.getElementById('passportW'), document.getElementById('passportH')
  ].forEach(el => el?.addEventListener('change', () => { if (passportImg) renderPassport(); }));

  function getDimensions() {
    const std = stdSel?.value || '35x45';
    if (std === 'custom') {
      return [
        parseInt(document.getElementById('passportW')?.value || 35),
        parseInt(document.getElementById('passportH')?.value || 45)
      ];
    }
    return STANDARDS[std] || [35, 45];
  }

  function getBgColor() {
    const v = bgSel?.value || 'white';
    if (v === 'custom') return document.getElementById('passportCustomBg')?.value || '#ffffff';
    return BG_COLORS[v] || '#ffffff';
  }

  function mmToPx(mm, dpi) { return Math.round(mm * dpi / 25.4); }

  function renderPassport() {
    if (!passportImg) return;

    const dpi    = parseInt(dpiSel?.value || 300);
    const layout = layoutSel?.value || 'single';
    const [wMM, hMM] = getDimensions();
    const bgColor = getBgColor();

    const photoW = mmToPx(wMM, dpi);
    const photoH = mmToPx(hMM, dpi);

    // Layout configurations
    const layouts = {
      single: { cols: 1, rows: 1, gapMM: 0,  padMM: 4 },
      '2x2':  { cols: 2, rows: 2, gapMM: 3,  padMM: 6 },
      '3x4':  { cols: 3, rows: 4, gapMM: 2,  padMM: 4 },
      '4x6':  { cols: 4, rows: 6, gapMM: 1.5, padMM: 3 },
    };
    const lCfg = layouts[layout] || layouts.single;
    const gap  = mmToPx(lCfg.gapMM, dpi);
    const pad  = mmToPx(lCfg.padMM, dpi);

    const totalW = pad * 2 + lCfg.cols * photoW + (lCfg.cols - 1) * gap;
    const totalH = pad * 2 + lCfg.rows * photoH + (lCfg.rows - 1) * gap;

    // Scale down for display
    const maxDisplay = 500;
    const dispScale  = Math.min(1, maxDisplay / Math.max(totalW, totalH));

    canvas.width  = Math.round(totalW * dispScale);
    canvas.height = Math.round(totalH * dispScale);

    ctx.fillStyle = '#e0e0e0'; // sheet background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw each photo cell
    const src    = passportImg;
    // Fit image into photo box with center crop
    const imgAR  = src.naturalWidth / src.naturalHeight;
    const boxAR  = photoW / photoH;

    let sx, sy, sw, sh;
    if (imgAR > boxAR) { sh = src.naturalHeight; sw = sh * boxAR; sx = (src.naturalWidth - sw) / 2; sy = 0; }
    else               { sw = src.naturalWidth; sh = sw / boxAR; sx = 0; sy = (src.naturalHeight - sh) / 2; }

    for (let r = 0; r < lCfg.rows; r++) {
      for (let c = 0; c < lCfg.cols; c++) {
        const dx = Math.round((pad + c * (photoW + gap)) * dispScale);
        const dy = Math.round((pad + r * (photoH + gap)) * dispScale);
        const dw = Math.round(photoW * dispScale);
        const dh = Math.round(photoH * dispScale);

        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(dx, dy, dw, dh);

        // Photo
        ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);

        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(dx + 0.5, dy + 0.5, dw - 1, dh - 1);
      }
    }

    // Store full-res render params for download
    canvas._renderParams = { photoW, photoH, lCfg, pad, gap, totalW, totalH, bgColor, sx, sy, sw, sh };
  }

  function renderFullRes() {
    if (!canvas._renderParams || !passportImg) return null;
    const { photoW, photoH, lCfg, pad, gap, totalW, totalH, bgColor, sx, sy, sw, sh } = canvas._renderParams;
    const out = document.createElement('canvas');
    out.width  = totalW;
    out.height = totalH;
    const c = out.getContext('2d');

    c.fillStyle = '#e0e0e0';
    c.fillRect(0, 0, totalW, totalH);

    for (let r = 0; r < lCfg.rows; r++) {
      for (let col = 0; col < lCfg.cols; col++) {
        const dx = pad + col * (photoW + gap);
        const dy = pad + r   * (photoH + gap);
        c.fillStyle = bgColor;
        c.fillRect(dx, dy, photoW, photoH);
        c.drawImage(passportImg, sx, sy, sw, sh, dx, dy, photoW, photoH);
        c.strokeStyle = 'rgba(0,0,0,0.15)';
        c.lineWidth = 2;
        c.strokeRect(dx + 1, dy + 1, photoW - 2, photoH - 2);
      }
    }
    return out;
  }

  btn.addEventListener('click', () => {
    const out = renderFullRes();
    if (!out) return;
    out.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const name = (passportFile?.name || 'photo').replace(/\.[^.]+$/, '') + '-passport.png';
      if (typeof triggerDownload === 'function') triggerDownload(url, name);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      success.style.display = 'block';
      if (typeof SessionTracker !== 'undefined') SessionTracker.increment('Passport photo ready!');
    }, 'image/png');
  });

  pdfBtn.addEventListener('click', () => {
    const out = renderFullRes();
    if (!out) return;
    out.toBlob(blob => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const { jsPDF } = window.jspdf;
          const params = canvas._renderParams;
          const wIn = params.totalW / parseInt(dpiSel?.value || 300);
          const hIn = params.totalH / parseInt(dpiSel?.value || 300);
          const pdf = new jsPDF({ unit: 'in', format: [wIn, hIn], orientation: wIn > hIn ? 'landscape' : 'portrait' });
          pdf.addImage(e.target.result, 'PNG', 0, 0, wIn, hIn);
          pdf.save((passportFile?.name || 'photo').replace(/\.[^.]+$/, '') + '-passport.pdf');
          success.style.display = 'block';
        } catch (err) {
          alert('PDF export failed: ' + err.message);
        }
      };
      reader.readAsDataURL(blob);
    }, 'image/png');
  });

  document.getElementById('passportClear')?.addEventListener('click', () => {
    passportFile = null; passportImg = null;
    imgEl.src = '';
    preview.style.display = 'none';
    clearRow.style.display = 'none';
    options.style.display = 'none';
    btn.disabled = true;
    pdfBtn.disabled = true;
    success.style.display = 'none';
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    upload.value = '';
  });
})();
