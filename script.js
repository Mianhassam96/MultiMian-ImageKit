// ── Dark Mode ─────────────────────────────────────────────────
const darkToggle = document.getElementById('darkToggle');
const toggleIcon = document.getElementById('toggleIcon');
const html = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);
toggleIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
darkToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    toggleIcon.textContent = next === 'dark' ? '☀️' : '🌙';
});

// ── Hamburger / Mobile Drawer ──────────────────────────────────
const hamburger    = document.getElementById('hamburger');
const mobileDrawer = document.getElementById('mobileDrawer');
hamburger.addEventListener('click', () => {
    const open = mobileDrawer.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
});

// ── Tab switching (syncs both desktop tabs-nav + mobile drawer) ─
function activateTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tabId);
    });

    if (tabId === 'home') {
        // Show home section, hide all tool sections
        document.getElementById('tab-home').style.display = 'block';
        document.querySelectorAll('.tab-section:not(#tab-home)').forEach(s => {
            s.classList.remove('active');
        });
    } else {
        // Hide home section, show the target tool section
        document.getElementById('tab-home').style.display = 'none';
        document.querySelectorAll('.tab-section:not(#tab-home)').forEach(s => {
            s.classList.toggle('active', s.id === 'tab-' + tabId);
        });
    }

    // close drawer on mobile
    mobileDrawer.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});

// ── Hero CTA buttons & Home cards ─────────────────────────────
document.querySelectorAll('.hero-cta[data-tab], .home-card[data-tab]').forEach(el => {
    el.addEventListener('click', () => activateTab(el.dataset.tab));
});

// ── Initial state: show Home tab on load ──────────────────────
activateTab('home');

// ── Animated canvas background ────────────────────────────────
(function initCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    function resize() {
        const section = document.getElementById('tab-home');
        W = canvas.width  = section.offsetWidth;
        H = canvas.height = section.offsetHeight || 800;
    }

    function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

    function makeParticle() {
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 2.5 + 0.5,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            alpha: Math.random() * 0.5 + 0.1,
            color: ['#6ee7b7','#60a5fa','#a78bfa','#34d399','#818cf8'][Math.floor(Math.random()*5)]
        };
    }

    function init() {
        resize();
        particles = Array.from({ length: 80 }, makeParticle);
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        // gradient mesh
        const dark = isDark();
        const grd = ctx.createRadialGradient(W*0.3, H*0.2, 0, W*0.3, H*0.2, W*0.6);
        grd.addColorStop(0, dark ? 'rgba(22,163,74,0.08)' : 'rgba(22,163,74,0.05)');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);

        const grd2 = ctx.createRadialGradient(W*0.75, H*0.6, 0, W*0.75, H*0.6, W*0.5);
        grd2.addColorStop(0, dark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)');
        grd2.addColorStop(1, 'transparent');
        ctx.fillStyle = grd2;
        ctx.fillRect(0, 0, W, H);

        // particles + connections
        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > W) p.vx *= -1;
            if (p.y < 0 || p.y > H) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j];
                const dx = p.x - q.x, dy = p.y - q.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.strokeStyle = p.color;
                    ctx.globalAlpha = (1 - dist/100) * 0.12;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        });
        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener('resize', init);
    // re-init when theme changes
    document.getElementById('darkToggle').addEventListener('click', () => setTimeout(init, 50));
})();

// ── Counter animation for stats ───────────────────────────────
function animateCounters() {
    document.querySelectorAll('.stat-val[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count);
        let current = 0;
        const step = Math.ceil(target / 30);
        const timer = setInterval(() => {
            current = Math.min(current + step, target);
            el.textContent = current;
            if (current >= target) clearInterval(timer);
        }, 40);
    });
}
// Run counters when home is shown
const _origActivate = activateTab;
// patch already defined — just call animateCounters on home
document.querySelectorAll('.tab-btn[data-tab="home"]').forEach(b => {
    b.addEventListener('click', () => setTimeout(animateCounters, 100));
});
// run on initial load
setTimeout(animateCounters, 400);

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
    document.getElementById('ocrClearRow').style.display = 'flex';
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
            },
            tessedit_pageseg_mode: '1',
            preserve_interword_spaces: '1',
        });
        ocrText.value = result.data.text;
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

document.getElementById('ocrClear').addEventListener('click', () => {
    ocrFile = null;
    ocrImg.src = '';
    ocrPreview.style.display = 'none';
    document.getElementById('ocrClearRow').style.display = 'none';
    ocrBtn.disabled = true;
    ocrResult.style.display = 'none';
    ocrSuccess.style.display = 'none';
    ocrProgress.style.display = 'none';
    ocrText.value = '';
    ocrUpload.value = '';
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
    if (pdfFiles.length > 0) document.getElementById('pdfClearRow').style.display = 'flex';
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

document.getElementById('pdfClear').addEventListener('click', () => {
    pdfFiles = [];
    renderPdfThumbs();
    updatePdfPreview();
    pdfBtn.disabled = true;
    document.getElementById('pdfClearRow').style.display = 'none';
    pdfSuccess.style.display = 'none';
    pdfUpload.value = '';
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
    document.getElementById('compressClearRow').style.display = 'flex';
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

document.getElementById('compressClear').addEventListener('click', () => {
    compressFile = null;
    compressImg.src = '';
    compressPreview.style.display = 'none';
    compressOptions.style.display = 'none';
    document.getElementById('compressClearRow').style.display = 'none';
    compressBtn.disabled = true;
    compressSuccess.style.display = 'none';
    compressUpload.value = '';
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
    document.getElementById('resizeClearRow').style.display = 'flex';
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

document.getElementById('resizeClear').addEventListener('click', () => {
    resizeFile = null;
    resizeImg.src = '';
    resizePreview.style.display = 'none';
    resizeOptions.style.display = 'none';
    document.getElementById('resizeClearRow').style.display = 'none';
    resizeBtn.disabled = true;
    resizeSuccess.style.display = 'none';
    resizeUpload.value = '';
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
    document.getElementById('convertClearRow').style.display = 'flex';
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

document.getElementById('convertClear').addEventListener('click', () => {
    convertFile = null;
    convertImg.src = '';
    convertPreview.style.display = 'none';
    convertOptions.style.display = 'none';
    document.getElementById('convertClearRow').style.display = 'none';
    convertBtn.disabled = true;
    convertSuccess.style.display = 'none';
    convertUpload.value = '';
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
    document.getElementById('wmClearRow').style.display = 'flex';
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

document.getElementById('wmClear').addEventListener('click', () => {
    wmFile = null;
    wmImg.src = '';
    wmPreview.style.display = 'none';
    wmOptions.style.display = 'none';
    document.getElementById('wmClearRow').style.display = 'none';
    wmBtn.disabled = true;
    wmSuccess.style.display = 'none';
    wmLivePreview.style.display = 'none';
    wmUpload.value = '';
});

// ══════════════════════════════════════════════════════════════
// 7. Merge – 2 Images → JPG / PNG / PDF
// ══════════════════════════════════════════════════════════════
const mergeDrop1   = document.getElementById('mergeDrop1');
const mergeUpload1 = document.getElementById('mergeUpload1');
const mergeDrop2   = document.getElementById('mergeDrop2');
const mergeUpload2 = document.getElementById('mergeUpload2');
const mergeBtn     = document.getElementById('mergeBtn');
const mergeSuccess = document.getElementById('mergeSuccess');
let mergeFile1 = null, mergeFile2 = null;

function checkMergeReady() {
    mergeBtn.disabled = !(mergeFile1 && mergeFile2);
}

// Show/hide PDF-only options based on selected output format
document.getElementById('mergeOutputFormat').addEventListener('change', function () {
    const isPdf = this.value === 'pdf';
    document.getElementById('mergePdfOpts').style.display      = isPdf ? '' : 'none';
    document.getElementById('mergePdfOrientOpt').style.display = isPdf ? '' : 'none';
});
// Init: hide PDF options (default is JPG)
document.getElementById('mergePdfOpts').style.display      = 'none';
document.getElementById('mergePdfOrientOpt').style.display = 'none';

setupDrop(mergeDrop1, mergeUpload1, files => {
    if (!files[0]) return;
    mergeFile1 = files[0];
    document.getElementById('mergeImg1').src = URL.createObjectURL(mergeFile1);
    document.getElementById('mergePreview1').style.display = 'block';
    document.getElementById('merge1ClearRow').style.display = 'flex';
    checkMergeReady();
});

setupDrop(mergeDrop2, mergeUpload2, files => {
    if (!files[0]) return;
    mergeFile2 = files[0];
    document.getElementById('mergeImg2').src = URL.createObjectURL(mergeFile2);
    document.getElementById('mergePreview2').style.display = 'block';
    document.getElementById('merge2ClearRow').style.display = 'flex';
    checkMergeReady();
});

document.getElementById('merge1Clear').addEventListener('click', () => {
    mergeFile1 = null;
    document.getElementById('mergeImg1').src = '';
    document.getElementById('mergePreview1').style.display = 'none';
    document.getElementById('merge1ClearRow').style.display = 'none';
    mergeUpload1.value = '';
    checkMergeReady();
});

document.getElementById('merge2Clear').addEventListener('click', () => {
    mergeFile2 = null;
    document.getElementById('mergeImg2').src = '';
    document.getElementById('mergePreview2').style.display = 'none';
    document.getElementById('merge2ClearRow').style.display = 'none';
    mergeUpload2.value = '';
    checkMergeReady();
});

// Helper: load a File into an Image element
function fileToImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

mergeBtn.addEventListener('click', async () => {
    if (!mergeFile1 || !mergeFile2) return;
    mergeBtn.disabled = true;
    mergeSuccess.style.display = 'none';

    const layout = document.getElementById('mergeLayout').value;
    const format = document.getElementById('mergeOutputFormat').value; // 'jpg' | 'png' | 'pdf'

    try {
        const [img1, img2] = await Promise.all([fileToImage(mergeFile1), fileToImage(mergeFile2)]);

        if (format === 'pdf') {
            // ── PDF output ──────────────────────────────────────────
            const pageSize    = document.getElementById('mergePageSize').value;
            const orientation = document.getElementById('mergeOrientation').value;
            const { jsPDF }   = window.jspdf;
            const pdf         = new jsPDF({ orientation, unit: 'pt', format: pageSize });
            const pw = pdf.internal.pageSize.getWidth();
            const ph = pdf.internal.pageSize.getHeight();
            const pad = 10;

            function imgToJpeg(img) {
                const c = document.createElement('canvas');
                c.width = img.naturalWidth; c.height = img.naturalHeight;
                c.getContext('2d').drawImage(img, 0, 0);
                return c.toDataURL('image/jpeg', 0.92);
            }

            const d1 = imgToJpeg(img1), d2 = imgToJpeg(img2);

            if (layout === 'side') {
                const slotW = (pw - pad * 3) / 2, slotH = ph - pad * 2;
                const r1 = Math.min(slotW / img1.naturalWidth, slotH / img1.naturalHeight);
                const r2 = Math.min(slotW / img2.naturalWidth, slotH / img2.naturalHeight);
                pdf.addImage(d1, 'JPEG', pad,              pad + (slotH - img1.naturalHeight * r1) / 2, img1.naturalWidth * r1, img1.naturalHeight * r1);
                pdf.addImage(d2, 'JPEG', pad * 2 + slotW,  pad + (slotH - img2.naturalHeight * r2) / 2, img2.naturalWidth * r2, img2.naturalHeight * r2);
            } else {
                const slotW = pw - pad * 2, slotH = (ph - pad * 3) / 2;
                const r1 = Math.min(slotW / img1.naturalWidth, slotH / img1.naturalHeight);
                const r2 = Math.min(slotW / img2.naturalWidth, slotH / img2.naturalHeight);
                pdf.addImage(d1, 'JPEG', pad + (slotW - img1.naturalWidth * r1) / 2, pad,              img1.naturalWidth * r1, img1.naturalHeight * r1);
                pdf.addImage(d2, 'JPEG', pad + (slotW - img2.naturalWidth * r2) / 2, pad * 2 + slotH, img2.naturalWidth * r2, img2.naturalHeight * r2);
            }
            pdf.save('merged.pdf');

        } else {
            // ── JPG / PNG output ────────────────────────────────────
            const canvas = document.createElement('canvas');
            const ctx    = canvas.getContext('2d');
            const gap    = 10;

            if (layout === 'side') {
                // Normalize heights to the taller image
                const h = Math.max(img1.naturalHeight, img2.naturalHeight);
                const w1 = Math.round(img1.naturalWidth  * (h / img1.naturalHeight));
                const w2 = Math.round(img2.naturalWidth  * (h / img2.naturalHeight));
                canvas.width  = w1 + gap + w2;
                canvas.height = h;
                ctx.drawImage(img1, 0, 0, w1, h);
                ctx.drawImage(img2, w1 + gap, 0, w2, h);
            } else {
                // Normalize widths to the wider image
                const w = Math.max(img1.naturalWidth, img2.naturalWidth);
                const h1 = Math.round(img1.naturalHeight * (w / img1.naturalWidth));
                const h2 = Math.round(img2.naturalHeight * (w / img2.naturalWidth));
                canvas.width  = w;
                canvas.height = h1 + gap + h2;
                ctx.drawImage(img1, 0, 0, w, h1);
                ctx.drawImage(img2, 0, h1 + gap, w, h2);
            }

            const mime = format === 'png' ? 'image/png' : 'image/jpeg';
            const quality = format === 'png' ? 1 : 0.92;
            canvas.toBlob(blob => {
                triggerDownload(URL.createObjectURL(blob), `merged.${format}`);
                mergeSuccess.style.display = 'block';
                mergeBtn.disabled = false;
            }, mime, quality);
            return; // early return — blob callback handles re-enable
        }

        mergeSuccess.style.display = 'block';
    } catch (err) {
        alert('Merge failed: ' + err.message);
    }
    mergeBtn.disabled = false;
});

// ══════════════════════════════════════════════════════════════
// 8. Share Image — Get Public Link (ImgBB API)
// ══════════════════════════════════════════════════════════════
const shareDrop     = document.getElementById('shareDrop');
const shareUpload   = document.getElementById('shareUpload');
const shareBtn      = document.getElementById('shareBtn');
const shareImg      = document.getElementById('shareImg');
const sharePreview  = document.getElementById('sharePreview');
const shareFileInfo = document.getElementById('shareFileInfo');
const shareProgress = document.getElementById('shareProgress');
const shareFill     = document.getElementById('shareProgressFill');
const shareProgLabel= document.getElementById('shareProgressLabel');
const shareResult   = document.getElementById('shareResult');
const shareApiKey   = document.getElementById('shareApiKey');
let shareFile = null;

// Default API key — user can override with their own
const IMGBB_DEFAULT_KEY = '363b8401f6cbb242ae50857f270ec6f7';
shareApiKey.value = localStorage.getItem('imgbb_api_key') || IMGBB_DEFAULT_KEY;
shareApiKey.addEventListener('input', () => {
    localStorage.setItem('imgbb_api_key', shareApiKey.value.trim());
    updateShareBtn();
});

function updateShareBtn() {
    shareBtn.disabled = !shareFile;
}

setupDrop(shareDrop, shareUpload, files => {
    if (!files[0]) return;
    shareFile = files[0];
    shareImg.src = URL.createObjectURL(shareFile);
    sharePreview.style.display = 'block';
    buildFileInfo(shareFileInfo, shareFile);
    shareResult.style.display = 'none';
    document.getElementById('shareClearRow').style.display = 'flex';
    updateShareBtn();
});

document.getElementById('shareClear').addEventListener('click', () => {
    shareFile = null;
    shareImg.src = '';
    sharePreview.style.display = 'none';
    document.getElementById('shareClearRow').style.display = 'none';
    shareResult.style.display = 'none';
    shareProgress.style.display = 'none';
    shareUpload.value = '';
    updateShareBtn();
});

shareBtn.addEventListener('click', async () => {
    const key = shareApiKey.value.trim();
    if (!key) return alert('Please enter your ImgBB API key.');
    if (!shareFile) return;

    shareBtn.disabled = true;
    shareResult.style.display = 'none';
    shareProgress.style.display = 'block';
    shareFill.style.width = '0%';
    shareProgLabel.textContent = 'Uploading…';

    // Animate progress bar (XHR doesn't give upload progress for small files, so fake it)
    let fakePct = 0;
    const fakeTimer = setInterval(() => {
        fakePct = Math.min(fakePct + Math.random() * 18, 88);
        shareFill.style.width = fakePct + '%';
    }, 200);

    try {
        const expiry = document.getElementById('shareExpiry').value;
        const formData = new FormData();
        formData.append('image', shareFile);
        if (expiry) formData.append('expiration', expiry);

        const res = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(key)}`, {
            method: 'POST',
            body: formData,
        });
        const json = await res.json();

        clearInterval(fakeTimer);

        if (!json.success) {
            throw new Error(json.error?.message || 'Upload failed. Check your API key.');
        }

        shareFill.style.width = '100%';
        shareProgLabel.textContent = 'Done!';
        setTimeout(() => { shareProgress.style.display = 'none'; }, 600);

        const data = json.data;
        const viewerUrl = data.url_viewer || data.url;
        const directUrl = data.url;
        const thumbUrl  = data.thumb?.url || data.medium?.url || data.url;
        const deleteUrl = data.delete_url || '';

        document.getElementById('shareLinkInput').value  = viewerUrl;
        document.getElementById('shareDirectUrl').value  = directUrl;
        document.getElementById('shareThumbUrl').value   = thumbUrl;
        document.getElementById('shareDeleteUrl').value  = deleteUrl;

        document.getElementById('shareOpenBtn').href = viewerUrl;

        // Social share buttons
        const encoded = encodeURIComponent(viewerUrl);
        const msg = encodeURIComponent('Check out this image: ' + viewerUrl);
        document.getElementById('shareWhatsapp').onclick  = () => window.open('https://wa.me/?text=' + msg, '_blank');
        document.getElementById('shareTelegram').onclick  = () => window.open('https://t.me/share/url?url=' + encoded + '&text=' + encodeURIComponent('Check out this image!'), '_blank');
        document.getElementById('shareTwitter').onclick   = () => window.open('https://twitter.com/intent/tweet?text=' + msg, '_blank');

        shareResult.style.display = 'block';
        shareResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
        clearInterval(fakeTimer);
        shareProgress.style.display = 'none';
        alert('Upload failed: ' + err.message);
    }

    shareBtn.disabled = false;
    updateShareBtn();
});

// Copy button — main link
document.getElementById('shareCopyBtn').addEventListener('click', () => {
    const val = document.getElementById('shareLinkInput').value;
    if (!val) return;
    navigator.clipboard.writeText(val).then(() => {
        const btn = document.getElementById('shareCopyBtn');
        btn.textContent = '✅ Copied!';
        setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
    });
});

// Copy buttons — extra links (direct, thumb, delete)
document.querySelectorAll('.share-copy-btn[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
        const val = document.getElementById(btn.dataset.copy).value;
        if (!val) return;
        navigator.clipboard.writeText(val).then(() => {
            const orig = btn.textContent;
            btn.textContent = '✅';
            setTimeout(() => { btn.textContent = orig; }, 2000);
        });
    });
});
