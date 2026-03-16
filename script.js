// ── Dark Mode ─────────────────────────────────────────────────
const darkToggle = document.getElementById('darkToggle');
const html = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);
darkToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
darkToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    darkToggle.textContent = next === 'dark' ? '☀️' : '🌙';
});

// ── Tab switching ──────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

// ── Shared Helpers ─────────────────────────────────────────────
function setupDrop(zone, input, onFiles) {
    // Clicking the label already opens the dialog — only trigger manually for other clicks
    zone.addEventListener('click', e => {
        if (e.target.closest('label') || e.target.tagName === 'INPUT') return;
        input.click();
    });
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', e => {
        if (!zone.contains(e.relatedTarget)) zone.classList.remove('dragover');
    });
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('dragover');
        onFiles(Array.from(e.dataTransfer.files));
    });
    input.addEventListener('change', () => {
        if (input.files.length) onFiles(Array.from(input.files));
        input.value = ''; // allow re-selecting same file
    });
}

function formatBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
}

function fileToDataUrl(file) {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = e => res(e.target.result);
        r.onerror = rej;
        r.readAsDataURL(file);
    });
}

function loadImage(src) {
    return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
    });
}

function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function buildFileInfo(panel, file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
        const ext = (file.type || '').split('/')[1] || file.name.split('.').pop();
        panel.innerHTML = [
            `<span>📄 <strong>${file.name}</strong></span>`,
            `<span>📦 <strong>${formatBytes(file.size)}</strong></span>`,
            `<span>🖼 <strong>${img.naturalWidth}×${img.naturalHeight}px</strong></span>`,
            `<span>🏷 <strong>${ext.toUpperCase()}</strong></span>`,
        ].join('');
        URL.revokeObjectURL(url);
    };
    img.onerror = () => {
        panel.innerHTML = `<span>📄 <strong>${file.name}</strong></span><span>📦 <strong>${formatBytes(file.size)}</strong></span>`;
        URL.revokeObjectURL(url);
    };
    img.src = url;
}

function setProgress(fillEl, labelEl, pct) {
    fillEl.style.width = pct + '%';
    labelEl.textContent = pct + '%';
}

// ══════════════════════════════════════════════════════════════
// 1. OCR – Image → Text
// ══════════════════════════════════════════════════════════════
const ocrDrop     = document.getElementById('ocrDrop');
const ocrUpload   = document.getElementById('ocrUpload');
const ocrBtn      = document.getElementById('ocrBtn');
const ocrImg      = document.getElementById('ocrImg');
const ocrPreview  = document.getElementById('ocrPreview');
const ocrFileInfo = document.getElementById('ocrFileInfo');
const ocrProgress = document.getElementById('ocrProgress');
const ocrFill     = document.getElementById('ocrProgressFill');
const ocrLabel    = document.getElementById('ocrProgressLabel');
const ocrResult   = document.getElementById('ocrResult');
const ocrText     = document.getElementById('ocrText');
const ocrSuccess  = document.getElementById('ocrSuccess');
let ocrFile = null;

setupDrop(ocrDrop, ocrUpload, files => {
    if (!files[0]) return;
    ocrFile = files[0];
    ocrImg.src = URL.createObjectURL(ocrFile);
    ocrPreview.style.display = 'block';
    buildFileInfo(ocrFileInfo, ocrFile);
    ocrBtn.disabled = false;
    ocrResult.style.display = 'none';
    ocrSuccess.style.display = 'none';
    ocrProgress.style.display = 'none';
});

ocrBtn.addEventListener('click', async () => {
    if (!ocrFile) return;
    ocrBtn.disabled = true;
    ocrProgress.style.display = 'block';
    setProgress(ocrFill, ocrLabel, 0);
    ocrResult.style.display = 'none';
    ocrSuccess.style.display = 'none';
    try {
        const lang = document.getElementById('ocrLang').value;
        const result = await Tesseract.recognize(ocrFile, lang, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    setProgress(ocrFill, ocrLabel, Math.round(m.progress * 100));
                }
            }
        });
        ocrText.value = result.data.text.trim();
        ocrProgress.style.display = 'none';
        ocrResult.style.display = 'block';
        ocrSuccess.style.display = 'block';
    } catch (err) {
        alert('OCR failed: ' + err.message);
        ocrProgress.style.display = 'none';
    }
    ocrBtn.disabled = false;
});

document.getElementById('ocrCopy').addEventListener('click', () => {
    if (!ocrText.value) return alert('No text to copy.');
    navigator.clipboard.writeText(ocrText.value).then(() => alert('Copied to clipboard!'));
});

document.getElementById('ocrDownloadTxt').addEventListener('click', () => {
    if (!ocrText.value) return alert('No text to download.');
    const blob = new Blob([ocrText.value], { type: 'text/plain' });
    triggerDownload(URL.createObjectURL(blob), 'extracted-text.txt');
});

document.getElementById('ocrToPdf').addEventListener('click', () => {
    if (!ocrText.value) return alert('No text to convert.');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const lines = pdf.splitTextToSize(ocrText.value, 180);
    pdf.text(lines, 15, 15);
    pdf.save('extracted-text.pdf');
});

// ══════════════════════════════════════════════════════════════
// 2. PDF – Images → PDF (multi-image, drag to reorder)
// ══════════════════════════════════════════════════════════════
const pdfDrop      = document.getElementById('pdfDrop');
const pdfUpload    = document.getElementById('pdfUpload');
const pdfBtn       = document.getElementById('pdfBtn');
const pdfList      = document.getElementById('pdfImageList');
const pdfProgress  = document.getElementById('pdfProgress');
const pdfFill      = document.getElementById('pdfProgressFill');
const pdfProgLabel = document.getElementById('pdfProgressLabel');
const pdfSuccess   = document.getElementById('pdfSuccess');
let pdfFiles = [];

setupDrop(pdfDrop, pdfUpload, files => {
    pdfFiles = pdfFiles.concat(files.filter(f => f.type.startsWith('image/')));
    renderPdfThumbs();
    pdfBtn.disabled = pdfFiles.length === 0;
    updatePdfPreview();
});

function renderPdfThumbs() {
    pdfList.innerHTML = '';
    pdfFiles.forEach((file, i) => {
        const div = document.createElement('div');
        div.className = 'thumb';
        div.draggable = true;

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;

        const name = document.createElement('p');
        name.textContent = file.name;

        const rm = document.createElement('button');
        rm.className = 'remove-btn';
        rm.textContent = '×';
        rm.addEventListener('click', e => {
            e.stopPropagation();
            pdfFiles.splice(i, 1);
            renderPdfThumbs();
            pdfBtn.disabled = pdfFiles.length === 0;
        });

        div.appendChild(rm);
        div.appendChild(img);
        div.appendChild(name);
        pdfList.appendChild(div);

        div.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', String(i)));
        div.addEventListener('dragover', e => e.preventDefault());
        div.addEventListener('drop', e => {
            e.preventDefault();
            const from = parseInt(e.dataTransfer.getData('text/plain'));
            if (from === i) return;
            const moved = pdfFiles.splice(from, 1)[0];
            pdfFiles.splice(i, 0, moved);
            renderPdfThumbs();
            updatePdfPreview();
        });
    });
}

function updatePdfPreview() {
    const box = document.getElementById('pdfPreviewBox');
    const list = document.getElementById('pdfPreviewList');
    if (!pdfFiles.length) { box.style.display = 'none'; return; }
    box.style.display = 'block';
    list.innerHTML = '';
    pdfFiles.forEach((file, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'pdf-preview-item';
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = 'Page ' + (i + 1);
        const lbl = document.createElement('span');
        lbl.textContent = 'Page ' + (i + 1);
        wrap.appendChild(img);
        wrap.appendChild(lbl);
        list.appendChild(wrap);
    });
}

pdfBtn.addEventListener('click', async () => {
    if (!pdfFiles.length) return;
    pdfBtn.disabled = true;
    pdfProgress.style.display = 'block';
    pdfSuccess.style.display = 'none';
    setProgress(pdfFill, pdfProgLabel, 0);

    const pageSize    = document.getElementById('pdfPageSize').value;
    const orientation = document.getElementById('pdfOrientation').value;
    const margin      = parseInt(document.getElementById('pdfMargin').value) || 0;
    const { jsPDF }   = window.jspdf;
    const pdf         = new jsPDF({ orientation, unit: 'pt', format: pageSize });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pdfFiles.length; i++) {
        const dataUrl = await fileToDataUrl(pdfFiles[i]);
        const imgEl   = await loadImage(dataUrl);
        const iw = imgEl.naturalWidth;
        const ih = imgEl.naturalHeight;
        const ratio = Math.min((pw - margin * 2) / iw, (ph - margin * 2) / ih);
        if (i > 0) pdf.addPage();
        const fmt = pdfFiles[i].type === 'image/png' ? 'PNG' : 'JPEG';
        pdf.addImage(dataUrl, fmt, margin, margin, iw * ratio, ih * ratio);
        setProgress(pdfFill, pdfProgLabel, Math.round(((i + 1) / pdfFiles.length) * 100));
    }

    pdf.save('images.pdf');
    pdfProgress.style.display = 'none';
    pdfSuccess.style.display = 'block';
    pdfBtn.disabled = false;
});

// ══════════════════════════════════════════════════════════════
// 3. Compress
// ══════════════════════════════════════════════════════════════
const compressDrop     = document.getElementById('compressDrop');
const compressUpload   = document.getElementById('compressUpload');
const compressBtn      = document.getElementById('compressBtn');
const compressPreview  = document.getElementById('compressPreview');
const compressImg      = document.getElementById('compressImg');
const compressFileInfo = document.getElementById('compressFileInfo');
const compressOptions  = document.getElementById('compressOptions');
const qualitySlider    = document.getElementById('qualitySlider');
const qualityValue     = document.getElementById('qualityValue');
const origSize         = document.getElementById('origSize');
const compSize         = document.getElementById('compSize');
const savedPct         = document.getElementById('savedPct');
const compressSuccess  = document.getElementById('compressSuccess');
let compressFile = null;

setupDrop(compressDrop, compressUpload, files => {
    if (!files[0]) return;
    compressFile = files[0];
    compressImg.src = URL.createObjectURL(compressFile);
    compressPreview.style.display = 'block';
    buildFileInfo(compressFileInfo, compressFile);
    compressOptions.style.display = 'block';
    compressBtn.disabled = false;
    compressSuccess.style.display = 'none';
    origSize.textContent = formatBytes(compressFile.size);
    compSize.textContent = '-';
    savedPct.textContent = '-';
    updateCompressPreview();
});

qualitySlider.addEventListener('input', () => {
    qualityValue.textContent = qualitySlider.value;
    if (compressFile) updateCompressPreview();
});

function updateCompressPreview() {
    const quality = parseInt(qualitySlider.value) / 100;
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        canvas.toBlob(blob => {
            if (!blob) return;
            const pct = ((compressFile.size - blob.size) / compressFile.size * 100).toFixed(1);
            compSize.textContent = formatBytes(blob.size);
            savedPct.textContent = pct > 0 ? pct + '%' : '0%';
        }, 'image/jpeg', quality);
    };
    img.src = URL.createObjectURL(compressFile);
}

compressBtn.addEventListener('click', () => {
    if (!compressFile) return;
    const quality = parseInt(qualitySlider.value) / 100;
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        canvas.toBlob(blob => {
            const name = compressFile.name.replace(/\.[^.]+$/, '') + '-compressed.jpg';
            triggerDownload(URL.createObjectURL(blob), name);
            compressSuccess.style.display = 'block';
        }, 'image/jpeg', quality);
    };
    img.src = URL.createObjectURL(compressFile);
});

// ══════════════════════════════════════════════════════════════
// 4. Resize
// ══════════════════════════════════════════════════════════════
const resizeDrop     = document.getElementById('resizeDrop');
const resizeUpload   = document.getElementById('resizeUpload');
const resizeBtn      = document.getElementById('resizeBtn');
const resizePreview  = document.getElementById('resizePreview');
const resizeImg      = document.getElementById('resizeImg');
const resizeFileInfo = document.getElementById('resizeFileInfo');
const resizeOptions  = document.getElementById('resizeOptions');
const resizeWidthEl  = document.getElementById('resizeWidth');
const resizeHeightEl = document.getElementById('resizeHeight');
const resizeLock     = document.getElementById('resizeLock');
const resizeSuccess  = document.getElementById('resizeSuccess');
let resizeFile = null;
let origW = 0, origH = 0;
let updatingRatio = false; // prevent infinite loop between width/height listeners

setupDrop(resizeDrop, resizeUpload, files => {
    if (!files[0]) return;
    resizeFile = files[0];
    const url = URL.createObjectURL(resizeFile);
    resizeImg.src = url;
    resizePreview.style.display = 'block';
    buildFileInfo(resizeFileInfo, resizeFile);
    resizeOptions.style.display = 'block';
    resizeBtn.disabled = false;
    resizeSuccess.style.display = 'none';
    const tmp = new Image();
    tmp.onload = () => {
        origW = tmp.naturalWidth;
        origH = tmp.naturalHeight;
        resizeWidthEl.value = origW;
        resizeHeightEl.value = origH;
    };
    tmp.src = url;
});

resizeWidthEl.addEventListener('input', () => {
    if (updatingRatio) return;
    if (resizeLock.checked && origW && origH) {
        updatingRatio = true;
        resizeHeightEl.value = Math.round(parseInt(resizeWidthEl.value || 0) * origH / origW) || '';
        updatingRatio = false;
    }
});

resizeHeightEl.addEventListener('input', () => {
    if (updatingRatio) return;
    if (resizeLock.checked && origW && origH) {
        updatingRatio = true;
        resizeWidthEl.value = Math.round(parseInt(resizeHeightEl.value || 0) * origW / origH) || '';
        updatingRatio = false;
    }
});

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        resizeWidthEl.value = btn.dataset.w;
        resizeHeightEl.value = btn.dataset.h;
    });
});

resizeBtn.addEventListener('click', () => {
    if (!resizeFile) return;
    const w = parseInt(resizeWidthEl.value);
    const h = parseInt(resizeHeightEl.value);
    if (!w || !h || w < 1 || h < 1) return alert('Please enter valid dimensions.');
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
            const name = resizeFile.name.replace(/\.[^.]+$/, '') + `-${w}x${h}.png`;
            triggerDownload(URL.createObjectURL(blob), name);
            resizeSuccess.style.display = 'block';
        }, 'image/png');
    };
    img.src = URL.createObjectURL(resizeFile);
});

// ══════════════════════════════════════════════════════════════
// 5. Format Converter
// ══════════════════════════════════════════════════════════════
const convertDrop       = document.getElementById('convertDrop');
const convertUpload     = document.getElementById('convertUpload');
const convertBtn        = document.getElementById('convertBtn');
const convertPreview    = document.getElementById('convertPreview');
const convertImg        = document.getElementById('convertImg');
const convertFileInfo   = document.getElementById('convertFileInfo');
const convertOptions    = document.getElementById('convertOptions');
const convertFormat     = document.getElementById('convertFormat');
const convertQuality    = document.getElementById('convertQuality');
const convertQualityVal = document.getElementById('convertQualityVal');
const convertSuccess    = document.getElementById('convertSuccess');
let convertFile = null;

setupDrop(convertDrop, convertUpload, files => {
    if (!files[0]) return;
    convertFile = files[0];
    convertImg.src = URL.createObjectURL(convertFile);
    convertPreview.style.display = 'block';
    buildFileInfo(convertFileInfo, convertFile);
    convertOptions.style.display = 'block';
    convertBtn.disabled = false;
    convertSuccess.style.display = 'none';
});

convertQuality.addEventListener('input', () => {
    convertQualityVal.textContent = convertQuality.value;
});

convertBtn.addEventListener('click', () => {
    if (!convertFile) return;
    const mime = convertFormat.value;
    const quality = parseInt(convertQuality.value) / 100;
    // Fix: jpeg mime gives 'jpeg' extension — normalise to jpg
    const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const ext = extMap[mime] || mime.split('/')[1];
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        canvas.toBlob(blob => {
            if (!blob) return alert('Conversion failed. Try a different format.');
            const name = convertFile.name.replace(/\.[^.]+$/, '') + '.' + ext;
            triggerDownload(URL.createObjectURL(blob), name);
            convertSuccess.style.display = 'block';
        }, mime, quality);
    };
    img.src = URL.createObjectURL(convertFile);
});

// ══════════════════════════════════════════════════════════════
// 6. Watermark
// ══════════════════════════════════════════════════════════════
const wmDrop       = document.getElementById('wmDrop');
const wmUpload     = document.getElementById('wmUpload');
const wmBtn        = document.getElementById('wmBtn');
const wmPreview    = document.getElementById('wmPreview');
const wmImg        = document.getElementById('wmImg');
const wmFileInfo   = document.getElementById('wmFileInfo');
const wmOptions    = document.getElementById('wmOptions');
const wmCanvas     = document.getElementById('wmCanvas');
const wmResult     = document.getElementById('wmResult');
const wmLivePreview= document.getElementById('wmLivePreview');
const wmSuccess    = document.getElementById('wmSuccess');
const wmOpacity    = document.getElementById('wmOpacity');
const wmOpacityVal = document.getElementById('wmOpacityVal');
let wmFile = null;

setupDrop(wmDrop, wmUpload, files => {
    if (!files[0]) return;
    wmFile = files[0];
    wmImg.src = URL.createObjectURL(wmFile);
    wmPreview.style.display = 'block';
    buildFileInfo(wmFileInfo, wmFile);
    wmOptions.style.display = 'block';
    wmBtn.disabled = false;
    wmSuccess.style.display = 'none';
    renderWatermark();
});

wmOpacity.addEventListener('input', () => {
    wmOpacityVal.textContent = wmOpacity.value;
    if (wmFile) renderWatermark();
});

['wmText','wmSize','wmColor','wmPosition'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => { if (wmFile) renderWatermark(); });
});

function renderWatermark() {
    const text     = document.getElementById('wmText').value || '© MultiMian';
    const size     = parseInt(document.getElementById('wmSize').value) || 36;
    const opacity  = parseInt(wmOpacity.value) / 100;
    const color    = document.getElementById('wmColor').value;
    const position = document.getElementById('wmPosition').value;

    const img = new Image();
    img.onload = () => {
        wmCanvas.width  = img.naturalWidth;
        wmCanvas.height = img.naturalHeight;
        const ctx = wmCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        ctx.globalAlpha = opacity;
        ctx.fillStyle   = color;
        ctx.font        = `bold ${size}px Segoe UI, Arial, sans-serif`;
        ctx.textBaseline = 'middle';

        const pad = size;
        const tw  = ctx.measureText(text).width;
        const W   = wmCanvas.width;
        const H   = wmCanvas.height;

        if (position === 'tile') {
            const stepX = tw + size * 3;
            const stepY = size * 3;
            for (let y = stepY / 2; y < H; y += stepY) {
                for (let x = pad; x < W; x += stepX) {
                    ctx.fillText(text, x, y);
                }
            }
        } else {
            let x, y;
            if (position === 'bottom-right') { x = W - tw - pad; y = H - pad; }
            else if (position === 'bottom-left') { x = pad; y = H - pad; }
            else if (position === 'top-right') { x = W - tw - pad; y = pad; }
            else if (position === 'top-left') { x = pad; y = pad; }
            else { x = (W - tw) / 2; y = H / 2; } // center
            ctx.fillText(text, x, y);
        }

        ctx.globalAlpha = 1;
        const dataUrl = wmCanvas.toDataURL('image/png');
        wmResult.src = dataUrl;
        wmLivePreview.style.display = 'block';
    };
    img.src = URL.createObjectURL(wmFile);
}

wmBtn.addEventListener('click', () => {
    if (!wmFile) return;
    renderWatermark();
    // slight delay to let canvas render
    setTimeout(() => {
        const dataUrl = wmCanvas.toDataURL('image/png');
        const name = wmFile.name.replace(/\.[^.]+$/, '') + '-watermarked.png';
        triggerDownload(dataUrl, name);
        wmSuccess.style.display = 'block';
    }, 100);
});
