// ══════════════════════════════════════════════════════════════
// GIFMaker — gif.js wrapper (promise-based, blob worker URL)
// ══════════════════════════════════════════════════════════════
const GIFMaker = (() => {
    // Fetch the worker script once and cache as blob URL to avoid CORS issues
    let workerBlobUrl = null;
    async function getWorkerUrl() {
        if (workerBlobUrl) return workerBlobUrl;
        const resp = await fetch('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js');
        const text = await resp.text();
        const blob = new Blob([text], { type: 'application/javascript' });
        workerBlobUrl = URL.createObjectURL(blob);
        return workerBlobUrl;
    }

    async function encode(frames, { loop = 0, quality = 10 } = {}) {
        const workerScript = await getWorkerUrl();
        return new Promise((resolve, reject) => {
            const gif = new GIF({
                workers: 2,
                quality: quality,
                workerScript: workerScript,
                repeat: loop < 0 ? -1 : loop
            });
            for (const f of frames) {
                gif.addFrame(f.canvas, { delay: f.delay || 300, copy: true });
            }
            gif.on('finished', blob => resolve(blob));
            gif.on('error',    err  => reject(new Error(err)));
            gif.render();
        });
    }

    return { encode };
})();

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

    // Highlight the parent dropdown menu button if one of its children is active
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
        const hasActive = !!dropdown.querySelector(`.ndp-item[data-tab="${tabId}"]`);
        dropdown.querySelector('.nav-menu-btn').classList.toggle('active', hasActive);
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

// ── Dropdown nav ──────────────────────────────────────────────
(function initDropdowns() {
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
        const btn   = dropdown.querySelector('.nav-menu-btn');
        const panel = dropdown.querySelector('.nav-dropdown-panel');

        // Toggle open on button click
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('open');
            // Close every other open dropdown first
            document.querySelectorAll('.nav-dropdown.open').forEach(d => {
                if (d !== dropdown) d.classList.remove('open');
            });
            dropdown.classList.toggle('open', !isOpen);
        });

        // Keep open while hovering the panel
        panel.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // Navigate when an item is clicked
        panel.querySelectorAll('.ndp-item[data-tab]').forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                activateTab(item.dataset.tab);
                dropdown.classList.remove('open');
            });
        });
    });

    // Close all dropdowns when clicking anywhere outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-dropdown')) {
            document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
        }
    });
})();

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
        const psm  = parseInt(document.getElementById('ocrPsm').value) || 3;

        // Pre-process image on canvas for better OCR accuracy
        const bitmap = await createImageBitmap(ocrFile);
        const canvas = document.createElement('canvas');
        // Scale up small images for better recognition
        const scale = Math.max(1, Math.min(3, 1800 / Math.max(bitmap.width, bitmap.height)));
        canvas.width  = bitmap.width  * scale;
        canvas.height = bitmap.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        // Convert to blob for Tesseract
        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));

        // Use worker API so we can set PSM properly
        const worker = await Tesseract.createWorker(lang, 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    setProgress(ocrFill, ocrLabel, Math.round(m.progress * 100));
                } else if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract') {
                    setProgress(ocrFill, ocrLabel, 5);
                } else if (m.status === 'loading language traineddata') {
                    setProgress(ocrFill, ocrLabel, 15);
                }
            }
        });

        await worker.setParameters({
            tessedit_pageseg_mode: psm,
            preserve_interword_spaces: '1',
        });

        const result = await worker.recognize(blob);
        await worker.terminate();

        // Clean up the extracted text
        const text = result.data.text
            .replace(/\f/g, '\n--- Page Break ---\n')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        ocrText.value = text || '(No text detected — try a clearer image or different language)';

        // Show stats
        const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
        const chars = text ? text.length : 0;
        const lines = text ? text.split('\n').filter(l => l.trim()).length : 0;
        document.getElementById('ocrStats').innerHTML =
            `<span><strong>${words}</strong> words</span><span><strong>${chars}</strong> chars</span><span><strong>${lines}</strong> lines</span>`;

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
    if (!ocrText.value) return;
    navigator.clipboard.writeText(ocrText.value).then(() => {
        const btn = document.getElementById('ocrCopy');
        btn.textContent = '✅ Copied!';
        setTimeout(() => { btn.textContent = '📋 Copy Text'; }, 2000);
    });
});

document.getElementById('ocrDownloadTxt').addEventListener('click', () => {
    if (!ocrText.value) return;
    const blob = new Blob([ocrText.value], { type: 'text/plain' });
    triggerDownload(URL.createObjectURL(blob), 'extracted-text.txt');
});

document.getElementById('ocrToPdf').addEventListener('click', () => {
    if (!ocrText.value) return;
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
// 2. Text Studio — Write / Text→PDF / PDF→Text
// ══════════════════════════════════════════════════════════════

// ── Mode switching ─────────────────────────────────────────
document.querySelectorAll('.ts-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.ts-mode-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.ts-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('ts-' + btn.dataset.mode).classList.add('active');
    });
});

// ── Write Mode ─────────────────────────────────────────────
const tsEditor   = document.getElementById('tsEditor');
const tsWordCount= document.getElementById('tsWordCount');
const tsCharCount= document.getElementById('tsCharCount');

function updateTsStats() {
    const text = tsEditor.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    tsWordCount.textContent = words + ' word' + (words !== 1 ? 's' : '');
    tsCharCount.textContent = text.length + ' char' + (text.length !== 1 ? 's' : '');
}
tsEditor.addEventListener('input', updateTsStats);

// Toolbar commands
document.querySelectorAll('.ts-tb-btn[data-cmd]').forEach(btn => {
    btn.addEventListener('mousedown', e => {
        e.preventDefault();
        document.execCommand(btn.dataset.cmd, false, null);
        tsEditor.focus();
    });
});

// Font family
document.getElementById('tsFontFamily').addEventListener('change', function () {
    document.execCommand('fontName', false, this.value);
    tsEditor.focus();
});

// Font size (execCommand fontSize uses 1-7, so we use a workaround)
document.getElementById('tsFontSize').addEventListener('change', function () {
    document.execCommand('fontSize', false, '7');
    tsEditor.querySelectorAll('font[size="7"]').forEach(el => {
        el.removeAttribute('size');
        el.style.fontSize = this.value + 'px';
    });
    tsEditor.focus();
});

// Font color
document.getElementById('tsFontColor').addEventListener('input', function () {
    document.execCommand('foreColor', false, this.value);
    tsEditor.focus();
});

// Clear editor
document.getElementById('tsClearEditor').addEventListener('click', () => {
    if (tsEditor.innerText.trim() && !confirm('Clear all content?')) return;
    tsEditor.innerHTML = '';
    updateTsStats();
});

// ── Export helpers ─────────────────────────────────────────
function getTsPlainText() {
    return tsEditor.innerText || '';
}
function getTsHtml() {
    return tsEditor.innerHTML || '';
}

// Export TXT
document.getElementById('tsExportTxt').addEventListener('click', () => {
    const text = getTsPlainText();
    if (!text.trim()) return alert('Nothing to export.');
    const blob = new Blob([text], { type: 'text/plain' });
    triggerDownload(URL.createObjectURL(blob), 'document.txt');
    document.getElementById('tsWriteSuccess').style.display = 'block';
});

// Export RTF
document.getElementById('tsExportRtf').addEventListener('click', () => {
    const text = getTsPlainText();
    if (!text.trim()) return alert('Nothing to export.');
    const rtf = '{\\rtf1\\ansi\\deff0\n' +
        '{\\fonttbl{\\f0 Plus Jakarta Sans;}}\n' +
        '\\f0\\fs24 ' +
        text.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}')
            .split('\n').join('\\par\n') +
        '\n}';
    const blob = new Blob([rtf], { type: 'application/rtf' });
    triggerDownload(URL.createObjectURL(blob), 'document.rtf');
    document.getElementById('tsWriteSuccess').style.display = 'block';
});

// Export DOCX (minimal — uses HTML blob with .docx mime, opens in Word)
document.getElementById('tsExportDocx').addEventListener('click', () => {
    const html = getTsHtml();
    if (!tsEditor.innerText.trim()) return alert('Nothing to export.');
    const docx = `<html xmlns:o='urn:schemas-microsoft-com:office:office'
        xmlns:w='urn:schemas-microsoft-com:office:word'
        xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Document</title></head>
        <body style="font-family:Calibri,sans-serif;font-size:12pt;">${html}</body></html>`;
    const blob = new Blob(['\ufeff', docx], { type: 'application/msword' });
    triggerDownload(URL.createObjectURL(blob), 'document.doc');
    document.getElementById('tsWriteSuccess').style.display = 'block';
});

// Export PDF
document.getElementById('tsExportPdf').addEventListener('click', () => {
    const text = getTsPlainText();
    if (!text.trim()) return alert('Nothing to export.');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    pdf.setFont('helvetica');
    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(text, 180);
    let y = 15;
    lines.forEach(line => {
        if (y > 280) { pdf.addPage(); y = 15; }
        pdf.text(line, 15, y);
        y += 7;
    });
    pdf.save('document.pdf');
    document.getElementById('tsWriteSuccess').style.display = 'block';
});

// ── Text → PDF Mode ────────────────────────────────────────
const t2pText = document.getElementById('t2pText');

setupDrop(document.getElementById('txtDrop'), document.getElementById('txtUpload'), files => {
    const file = files[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    const fileInfo = document.getElementById('t2pFileInfo');
    fileInfo.innerHTML = `<span>📄 <strong>${file.name}</strong></span><span>📦 <strong>${formatBytes(file.size)}</strong></span>`;
    fileInfo.style.display = 'flex';
    document.getElementById('t2pClearRow').style.display = 'flex';

    if (name.endsWith('.docx')) {
        // Extract text from DOCX (it's a ZIP with XML inside)
        const reader = new FileReader();
        reader.onload = async e => {
            try {
                const zip = await JSZip.loadAsync(e.target.result);
                const xmlFile = zip.file('word/document.xml');
                if (!xmlFile) throw new Error('Invalid DOCX file');
                const xml = await xmlFile.async('string');
                // Strip XML tags, preserve paragraph breaks
                const text = xml
                    .replace(/<w:p[ >]/g, '\n<w:p ')
                    .replace(/<[^>]+>/g, '')
                    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
                    .replace(/&quot;/g,'"').replace(/&#39;/g,"'")
                    .replace(/\n{3,}/g, '\n\n').trim();
                t2pText.value = text;
            } catch {
                alert('Could not read DOCX. Try saving as .txt first.');
            }
        };
        reader.readAsArrayBuffer(file);
    } else if (name.endsWith('.rtf')) {
        // Strip RTF control words, keep plain text
        const reader = new FileReader();
        reader.onload = e => {
            let rtf = e.target.result;
            // Remove RTF header/groups, extract readable text
            let text = rtf
                .replace(/\{\\[^{}]+\}/g, '')       // remove groups
                .replace(/\\[a-z]+\-?\d*\s?/g, ' ') // remove control words
                .replace(/[{}\\]/g, '')               // remove braces/backslashes
                .replace(/\r\n|\r/g, '\n')
                .replace(/\n{3,}/g, '\n\n').trim();
            t2pText.value = text;
        };
        reader.readAsText(file, 'utf-8');
    } else {
        // Plain .txt
        const reader = new FileReader();
        reader.onload = e => { t2pText.value = e.target.result; };
        reader.readAsText(file);
    }
});

t2pText.addEventListener('input', () => {
    document.getElementById('t2pClearRow').style.display = t2pText.value.trim() ? 'flex' : 'none';
});

document.getElementById('t2pClear').addEventListener('click', () => {
    t2pText.value = '';
    document.getElementById('t2pClearRow').style.display = 'none';
    document.getElementById('t2pSuccess').style.display = 'none';
    document.getElementById('t2pFileInfo').style.display = 'none';
    document.getElementById('txtUpload').value = '';
});

document.getElementById('t2pBtn').addEventListener('click', () => {
    const text = t2pText.value.trim();
    if (!text) return alert('Please enter or upload some text first.');
    const { jsPDF } = window.jspdf;
    const pageSize = document.getElementById('t2pPageSize').value;
    const fontSize = parseInt(document.getElementById('t2pFontSize').value);
    const margin   = parseInt(document.getElementById('t2pMargin').value) || 15;
    const pdf = new jsPDF({ unit: 'mm', format: pageSize });
    pdf.setFont('helvetica');
    pdf.setFontSize(fontSize);
    const pageW = pdf.internal.pageSize.getWidth();
    const usableW = pageW - margin * 2;
    const lineH = fontSize * 0.45;
    const lines = pdf.splitTextToSize(text, usableW);
    let y = margin;
    lines.forEach(line => {
        if (y + lineH > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            y = margin;
        }
        pdf.text(line, margin, y);
        y += lineH;
    });
    pdf.save('text-document.pdf');
    document.getElementById('t2pSuccess').style.display = 'block';
});

// ── PDF → Text Mode ────────────────────────────────────────
const p2tDrop     = document.getElementById('p2tDrop');
const p2tUpload   = document.getElementById('p2tUpload');
const p2tProgress = document.getElementById('p2tProgress');
const p2tFill     = document.getElementById('p2tProgressFill');
const p2tLabel    = document.getElementById('p2tProgressLabel');
const p2tResult   = document.getElementById('p2tResult');
const p2tTextEl   = document.getElementById('p2tText');
let p2tFile = null;

setupDrop(p2tDrop, p2tUpload, files => {
    const file = files.find(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!file) return alert('Please upload a PDF file.');
    p2tFile = file;
    const info = document.getElementById('p2tFileInfo');
    info.innerHTML = `<span>📄 <strong>${file.name}</strong></span><span>📦 <strong>${formatBytes(file.size)}</strong></span>`;
    document.getElementById('p2tClearRow').style.display = 'flex';
    p2tResult.style.display = 'none';
    extractPdfText(file);
});

async function extractPdfText(file) {
    p2tProgress.style.display = 'block';
    p2tFill.style.width = '0%';
    p2tLabel.textContent = 'Loading PDF…';
    // Clear previous thumbnails
    const thumbsWrap = document.getElementById('p2tThumbsWrap');
    const thumbsGrid = document.getElementById('p2tThumbs');
    thumbsWrap.style.display = 'none';
    thumbsGrid.innerHTML = '';
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const total = pdf.numPages;
        let fullText = '';
        let scannedPages = 0;

        for (let i = 1; i <= total; i++) {
            const page = await pdf.getPage(i);

            // ── Extract text with proper line reconstruction ──
            const content = await page.getTextContent({ includeMarkedContent: false });
            const items = content.items;

            let pageText = '';
            if (items.length > 0) {
                // Group items into lines by their Y position (transform[5])
                // Items with close Y values are on the same line
                const lines = [];
                let currentLine = [];
                let lastY = null;
                const Y_THRESHOLD = 3; // px tolerance for same line

                // Sort by Y descending (PDF coords: bottom=0), then X ascending
                const sorted = [...items].sort((a, b) => {
                    const dy = b.transform[5] - a.transform[5];
                    if (Math.abs(dy) > Y_THRESHOLD) return dy;
                    return a.transform[4] - b.transform[4];
                });

                for (const item of sorted) {
                    if (!item.str) continue;
                    const y = item.transform[5];
                    if (lastY === null || Math.abs(y - lastY) > Y_THRESHOLD) {
                        if (currentLine.length) lines.push(currentLine);
                        currentLine = [item];
                        lastY = y;
                    } else {
                        currentLine.push(item);
                    }
                }
                if (currentLine.length) lines.push(currentLine);

                // Join each line's words, detect paragraph breaks
                let prevLineY = null;
                for (const line of lines) {
                    const lineY = line[0].transform[5];
                    const lineText = line.map(it => it.str).join('').trim();
                    if (!lineText) continue;

                    // Large gap between lines = paragraph break
                    if (prevLineY !== null && Math.abs(prevLineY - lineY) > 20) {
                        pageText += '\n';
                    }
                    pageText += lineText + '\n';
                    prevLineY = lineY;
                }
            }

            // ── Detect scanned page (no text layer) ──
            if (pageText.trim().length < 20) {
                scannedPages++;
                // Render page to canvas and OCR it
                const viewport = page.getViewport({ scale: 2.0 }); // high res for OCR
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

                p2tLabel.textContent = `Page ${i} of ${total} — OCR scanning…`;
                const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
                const ocrWorker = await Tesseract.createWorker('eng');
                await ocrWorker.setParameters({ tessedit_pageseg_mode: 3, preserve_interword_spaces: '1' });
                const ocrResult = await ocrWorker.recognize(blob);
                await ocrWorker.terminate();
                pageText = ocrResult.data.text;
            }

            // Clean up page text
            const cleanedPage = pageText
                .replace(/[ \t]+\n/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

            fullText += `--- Page ${i} ---\n${cleanedPage}\n\n`;

            // Render thumbnail (max 8 pages)
            if (i <= 8) {
                const viewport = page.getViewport({ scale: 0.3 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                const wrap = document.createElement('div');
                wrap.className = 'p2t-thumb';
                const lbl = document.createElement('span');
                lbl.textContent = `Page ${i}`;
                wrap.appendChild(canvas);
                wrap.appendChild(lbl);
                thumbsGrid.appendChild(wrap);
            }

            const pct = Math.round((i / total) * 100);
            p2tFill.style.width = pct + '%';
            p2tLabel.textContent = `Page ${i} of ${total}`;
        }

        p2tProgress.style.display = 'none';
        p2tTextEl.value = fullText.trim();

        // Show stats
        const words = fullText.trim().split(/\s+/).filter(Boolean).length;
        const chars = fullText.trim().length;
        document.getElementById('p2tStats').innerHTML =
            `<span><strong>${total}</strong> page${total !== 1 ? 's' : ''}</span><span><strong>${words}</strong> words</span><span><strong>${chars}</strong> chars</span>`;

        if (thumbsGrid.children.length) thumbsWrap.style.display = 'block';
        p2tResult.style.display = 'block';
        document.getElementById('p2tSuccess').style.display = 'block';

        if (scannedPages > 0) {
            p2tTextEl.value += `\n\n[Note: ${scannedPages} page(s) were image-based and processed via OCR]`;
        }
    } catch (err) {
        p2tProgress.style.display = 'none';
        alert('Failed to read PDF: ' + err.message);
    }
}

document.getElementById('p2tClear').addEventListener('click', () => {
    p2tFile = null;
    document.getElementById('p2tFileInfo').innerHTML = '';
    document.getElementById('p2tClearRow').style.display = 'none';
    document.getElementById('p2tThumbsWrap').style.display = 'none';
    document.getElementById('p2tThumbs').innerHTML = '';
    document.getElementById('p2tStats').innerHTML = '';
    p2tResult.style.display = 'none';
    p2tProgress.style.display = 'none';
    p2tTextEl.value = '';
    p2tUpload.value = '';
});

document.getElementById('p2tCopy').addEventListener('click', () => {
    if (!p2tTextEl.value) return;
    navigator.clipboard.writeText(p2tTextEl.value).then(() => {
        const btn = document.getElementById('p2tCopy');
        btn.textContent = '✅ Copied!';
        setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
    });
});

document.getElementById('p2tDownloadTxt').addEventListener('click', () => {
    if (!p2tTextEl.value) return;
    const blob = new Blob([p2tTextEl.value], { type: 'text/plain' });
    triggerDownload(URL.createObjectURL(blob), 'extracted-text.txt');
});

document.getElementById('p2tDownloadRtf').addEventListener('click', () => {
    if (!p2tTextEl.value) return;
    const rtf = '{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 Arial;}}\n\\f0\\fs24 ' +
        p2tTextEl.value.replace(/\\/g,'\\\\').replace(/\{/g,'\\{').replace(/\}/g,'\\}')
            .split('\n').join('\\par\n') + '\n}';
    const blob = new Blob([rtf], { type: 'application/rtf' });
    triggerDownload(URL.createObjectURL(blob), 'extracted-text.rtf');
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

        // Generate QR code
        generateShareQR(viewerUrl);

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

// ══════════════════════════════════════════════════════════════
// 9. PDF → Image
// ══════════════════════════════════════════════════════════════
const pdf2imgDrop   = document.getElementById('pdf2imgDrop');
const pdf2imgUpload = document.getElementById('pdf2imgUpload');
let pdf2imgFile = null;
let pdf2imgBlobs = [];

setupDrop(pdf2imgDrop, pdf2imgUpload, files => {
    const file = files.find(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!file) return alert('Please upload a PDF file.');
    pdf2imgFile = file;
    const info = document.getElementById('pdf2imgFileInfo');
    info.innerHTML = `<span>📄 <strong>${file.name}</strong></span><span>📦 <strong>${formatBytes(file.size)}</strong></span>`;
    document.getElementById('pdf2imgClearRow').style.display = 'flex';
    document.getElementById('pdf2imgOptions').style.display = 'block';
    document.getElementById('pdf2imgResult').style.display = 'none';
    convertPdfToImages(file);
});

document.getElementById('pdf2imgClear').addEventListener('click', () => {
    pdf2imgFile = null;
    pdf2imgBlobs = [];
    document.getElementById('pdf2imgFileInfo').innerHTML = '';
    document.getElementById('pdf2imgClearRow').style.display = 'none';
    document.getElementById('pdf2imgOptions').style.display = 'none';
    document.getElementById('pdf2imgResult').style.display = 'none';
    document.getElementById('pdf2imgProgress').style.display = 'none';
    document.getElementById('pdf2imgPages').innerHTML = '';
    pdf2imgUpload.value = '';
});

async function convertPdfToImages(file) {
    const progress = document.getElementById('pdf2imgProgress');
    const fill = document.getElementById('pdf2imgProgressFill');
    const label = document.getElementById('pdf2imgProgressLabel');
    progress.style.display = 'block';
    fill.style.width = '0%';
    label.textContent = 'Loading PDF…';
    pdf2imgBlobs = [];

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const total = pdf.numPages;
        const pagesEl = document.getElementById('pdf2imgPages');
        pagesEl.innerHTML = '';
        const format = document.getElementById('pdf2imgFormat').value;
        const scale = parseFloat(document.getElementById('pdf2imgScale').value);
        const ext = format === 'image/jpeg' ? 'jpg' : 'png';

        for (let i = 1; i <= total; i++) {
            label.textContent = `Page ${i} of ${total}`;
            fill.style.width = Math.round((i / total) * 100) + '%';

            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

            const blob = await new Promise(res => canvas.toBlob(res, format, 0.92));
            pdf2imgBlobs.push({ blob, name: `page-${i}.${ext}` });

            // Thumbnail
            const thumb = document.createElement('div');
            thumb.className = 'pdf2img-page-item';
            const img = document.createElement('img');
            img.src = URL.createObjectURL(blob);
            const lbl = document.createElement('p');
            lbl.textContent = `Page ${i}`;
            const dlBtn = document.createElement('button');
            dlBtn.className = 'secondary-btn';
            dlBtn.style.cssText = 'font-size:0.72em; padding:4px 10px; margin-top:6px;';
            dlBtn.textContent = '⬇ Download';
            dlBtn.addEventListener('click', () => triggerDownload(URL.createObjectURL(blob), `page-${i}.${ext}`));
            thumb.appendChild(img);
            thumb.appendChild(lbl);
            thumb.appendChild(dlBtn);
            pagesEl.appendChild(thumb);
        }

        progress.style.display = 'none';
        document.getElementById('pdf2imgResult').style.display = 'block';
        document.getElementById('pdf2imgSuccess').style.display = 'block';
    } catch (err) {
        progress.style.display = 'none';
        alert('Failed to convert PDF: ' + err.message);
    }
}

document.getElementById('pdf2imgDownloadAll').addEventListener('click', async () => {
    if (!pdf2imgBlobs.length) return;
    const btn = document.getElementById('pdf2imgDownloadAll');
    btn.disabled = true;
    btn.textContent = '⏳ Zipping…';
    try {
        const zip = new JSZip();
        pdf2imgBlobs.forEach(({ blob, name }) => zip.file(name, blob));
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(URL.createObjectURL(zipBlob), 'pdf-pages.zip');
    } catch (err) {
        alert('ZIP failed: ' + err.message);
    }
    btn.disabled = false;
    btn.textContent = '⬇ Download All as ZIP';
});

// ══════════════════════════════════════════════════════════════
// 10. Image → GIF  (enhanced)
// ══════════════════════════════════════════════════════════════

const gifDrop   = document.getElementById('gifDrop');
const gifUpload = document.getElementById('gifUpload');
const gifBtn    = document.getElementById('gifBtn');
let gifFrames  = []; // { file, dataUrl, delay }
let gifBlobUrl = null;

// drag-reorder state
let gifDragSrc = null;

setupDrop(gifDrop, gifUpload, files => {
    const imgs = files.filter(f => f.type.startsWith('image/'));
    if (!imgs.length) return alert('Please upload image files.');
    let loaded = 0;
    imgs.forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
            gifFrames.push({ file, dataUrl: e.target.result, delay: null }); // null = use global
            loaded++;
            if (loaded === imgs.length) renderGifFrameList();
        };
        reader.readAsDataURL(file);
    });
});

function renderGifFrameList() {
    const list = document.getElementById('gifFrameList');
    list.innerHTML = '';

    gifFrames.forEach((frame, i) => {
        const thumb = document.createElement('div');
        thumb.className = 'gif-thumb';
        thumb.draggable = true;
        thumb.dataset.index = i;

        // drag events
        thumb.addEventListener('dragstart', e => {
            gifDragSrc = i;
            thumb.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        thumb.addEventListener('dragend', () => thumb.classList.remove('dragging'));
        thumb.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; thumb.classList.add('drag-over'); });
        thumb.addEventListener('dragleave', () => thumb.classList.remove('drag-over'));
        thumb.addEventListener('drop', e => {
            e.preventDefault();
            thumb.classList.remove('drag-over');
            if (gifDragSrc === null || gifDragSrc === i) return;
            const moved = gifFrames.splice(gifDragSrc, 1)[0];
            gifFrames.splice(i, 0, moved);
            renderGifFrameList();
        });

        const img = document.createElement('img');
        img.src = frame.dataUrl;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'gif-thumb-remove';
        removeBtn.textContent = '×';
        removeBtn.title = 'Remove frame';
        removeBtn.addEventListener('click', () => { gifFrames.splice(i, 1); renderGifFrameList(); });

        const lbl = document.createElement('p');
        lbl.textContent = `#${i + 1}`;

        // per-frame delay input
        const delayWrap = document.createElement('div');
        delayWrap.className = 'gif-thumb-delay';
        const delayInput = document.createElement('input');
        delayInput.type = 'number';
        delayInput.min = 20;
        delayInput.max = 9999;
        delayInput.step = 10;
        delayInput.placeholder = 'ms';
        delayInput.title = 'Per-frame delay (ms) — leave blank to use global';
        if (frame.delay !== null) delayInput.value = frame.delay;
        delayInput.addEventListener('change', () => {
            gifFrames[i].delay = delayInput.value ? parseInt(delayInput.value) : null;
        });
        delayWrap.appendChild(delayInput);

        thumb.appendChild(img);
        thumb.appendChild(removeBtn);
        thumb.appendChild(lbl);
        thumb.appendChild(delayWrap);
        list.appendChild(thumb);
    });

    const hasFrames = gifFrames.length > 0;
    document.getElementById('gifOptions').style.display  = hasFrames ? 'block' : 'none';
    document.getElementById('gifClearRow').style.display = hasFrames ? 'flex'  : 'none';
    gifBtn.disabled = gifFrames.length < 2;

    const stats = document.getElementById('gifFrameStats');
    if (hasFrames) {
        stats.style.display = 'flex';
        stats.innerHTML = `<span>🖼 <strong>${gifFrames.length}</strong> frame${gifFrames.length !== 1 ? 's' : ''}</span><span class="gif-drag-hint">↔ Drag to reorder</span>`;
    } else {
        stats.style.display = 'none';
    }
}

document.getElementById('gifClear').addEventListener('click', () => {
    gifFrames = [];
    renderGifFrameList();
    document.getElementById('gifResult').style.display = 'none';
    gifUpload.value = '';
});

gifBtn.addEventListener('click', async () => {
    if (gifFrames.length < 2) return alert('Add at least 2 frames.');
    gifBtn.disabled = true;

    const progress = document.getElementById('gifProgress');
    const fill     = document.getElementById('gifProgressFill');
    const label    = document.getElementById('gifProgressLabel');
    progress.style.display = 'block';
    fill.style.width = '10%';
    label.textContent = 'Loading frames…';

    const globalDelay = parseInt(document.getElementById('gifDelay').value) || 300;
    const targetW     = parseInt(document.getElementById('gifWidth').value) || 480;
    const repeat      = parseInt(document.getElementById('gifRepeat').value);
    const colors      = parseInt(document.getElementById('gifQuality').value) || 128;
    const reverseMode = parseInt(document.getElementById('gifReverse').value);

    try {
        let frames = [...gifFrames];
        if (reverseMode === 1) frames = frames.reverse();
        if (reverseMode === 2) frames = [...frames, ...[...frames].reverse()];

        const images = await Promise.all(frames.map(f => loadImage(f.dataUrl)));
        const h = Math.round(images[0].naturalHeight * (targetW / images[0].naturalWidth));

        fill.style.width = '30%';
        label.textContent = 'Drawing frames…';

        // Build one canvas per frame for gif.js
        const gifFrameList = images.map((img, i) => {
            const frameDelay = (frames[i].delay !== null ? frames[i].delay : globalDelay);
            const c = document.createElement('canvas');
            c.width = targetW; c.height = h;
            c.getContext('2d').drawImage(img, 0, 0, targetW, h);
            return { canvas: c, delay: frameDelay };
        });

        fill.style.width = '60%';
        label.textContent = 'Encoding GIF…';

        const blob = await GIFMaker.encode(gifFrameList, {
            loop: repeat,
            quality: Math.round(20 - (colors / 256) * 18) // map 256→2, 64→16
        });

        fill.style.width = '100%';
        label.textContent = 'Done!';
        setTimeout(() => { progress.style.display = 'none'; }, 600);

        gifBlobUrl = URL.createObjectURL(blob);
        document.getElementById('gifPreviewImg').src = gifBlobUrl;
        document.getElementById('gifResultStats').innerHTML =
            `<span>🖼 ${images.length} frames</span><span>📦 ${formatBytes(blob.size)}</span><span>📐 ${targetW}×${h}px</span>`;
        document.getElementById('gifResult').style.display  = 'block';
        document.getElementById('gifSuccess').style.display = 'block';
        gifBtn.disabled = false;
    } catch (err) {
        progress.style.display = 'none';
        alert('GIF creation failed: ' + err.message);
        gifBtn.disabled = false;
    }
});

document.getElementById('gifDownload').addEventListener('click', () => {
    if (gifBlobUrl) triggerDownload(gifBlobUrl, 'animated.gif');
});

document.getElementById('gifCopyClipboard').addEventListener('click', async () => {
    if (!gifBlobUrl) return;
    const btn = document.getElementById('gifCopyClipboard');
    btn.textContent = '⏳ Copying…';
    try {
        // Browsers don't support image/gif in clipboard — copy first frame as PNG
        const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = gifBlobUrl; });
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        const pngBlob = await new Promise(res => c.toBlob(res, 'image/png'));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
        btn.textContent = '✅ Copied as PNG!';
    } catch {
        // Clipboard API not available — just download instead
        triggerDownload(gifBlobUrl, 'animated.gif');
        btn.textContent = '⬇ Downloaded!';
    }
    setTimeout(() => { btn.textContent = '📋 Copy to Clipboard'; }, 2500);
});

// ══════════════════════════════════════════════════════════════
// 11. Video → GIF  (enhanced)
// ══════════════════════════════════════════════════════════════
const videogifDrop   = document.getElementById('videogifDrop');
const videogifUpload = document.getElementById('videogifUpload');
const videogifBtn    = document.getElementById('videogifBtn');
const videogifVideo  = document.getElementById('videogifVideo');
let videogifFile    = null;
let videogifBlobUrl = null;
let videogifDuration = 0;

// ── helpers ──────────────────────────────────────────────────
function vgUpdateTrimInfo() {
    const s = parseFloat(document.getElementById('videogifStart').value) || 0;
    const e = parseFloat(document.getElementById('videogifEnd').value)   || 0;
    const dur = Math.max(0, e - s);
    const fps = parseInt(document.getElementById('videogifFps').value) || 10;
    const frames = Math.round(dur * fps);
    document.getElementById('videogifTrimInfo').textContent =
        `${dur.toFixed(1)}s · ~${frames} frames`;
    document.getElementById('videogifDurBadge').textContent =
        `${dur.toFixed(1)}s selected`;
    // warn if too many frames
    const est = document.getElementById('videogifEstimate');
    if (frames > 300) {
        est.textContent = `⚠️ ${frames} frames is a lot — reduce duration or fps for a smaller GIF.`;
        est.className = 'vg-estimate vg-estimate-warn';
    } else if (frames > 0) {
        est.textContent = `✔ ~${frames} frames will be captured.`;
        est.className = 'vg-estimate vg-estimate-ok';
    } else {
        est.textContent = '';
    }
}

function vgSyncRangeFromInputs() {
    if (!videogifDuration) return;
    const s = parseFloat(document.getElementById('videogifStart').value) || 0;
    const e = parseFloat(document.getElementById('videogifEnd').value)   || videogifDuration;
    document.getElementById('videogifStartRange').value = (s / videogifDuration * 100).toFixed(1);
    document.getElementById('videogifEndRange').value   = (e / videogifDuration * 100).toFixed(1);
    vgUpdateTrimInfo();
}

function vgSyncInputsFromRange() {
    if (!videogifDuration) return;
    const sR = parseFloat(document.getElementById('videogifStartRange').value);
    const eR = parseFloat(document.getElementById('videogifEndRange').value);
    let s = parseFloat((sR / 100 * videogifDuration).toFixed(2));
    let e = parseFloat((eR / 100 * videogifDuration).toFixed(2));
    if (e <= s) e = Math.min(videogifDuration, s + 0.1);
    document.getElementById('videogifStart').value = s;
    document.getElementById('videogifEnd').value   = e;
    vgUpdateTrimInfo();
}

// range sliders
document.getElementById('videogifStartRange').addEventListener('input', () => {
    const sR = parseFloat(document.getElementById('videogifStartRange').value);
    const eR = parseFloat(document.getElementById('videogifEndRange').value);
    if (sR >= eR) document.getElementById('videogifStartRange').value = eR - 0.1;
    vgSyncInputsFromRange();
});
document.getElementById('videogifEndRange').addEventListener('input', () => {
    const sR = parseFloat(document.getElementById('videogifStartRange').value);
    const eR = parseFloat(document.getElementById('videogifEndRange').value);
    if (eR <= sR) document.getElementById('videogifEndRange').value = sR + 0.1;
    vgSyncInputsFromRange();
});

// number inputs → sync range
['videogifStart', 'videogifEnd'].forEach(id => {
    document.getElementById(id).addEventListener('input', vgSyncRangeFromInputs);
});

// fps change → update estimate
document.getElementById('videogifFps').addEventListener('change', vgUpdateTrimInfo);

// ── upload ────────────────────────────────────────────────────
setupDrop(videogifDrop, videogifUpload, files => {
    const file = files.find(f => f.type.startsWith('video/'));
    if (!file) return alert('Please upload a video file (MP4, WebM, MOV, AVI).');
    videogifFile = file;
    videogifVideo.src = URL.createObjectURL(file);
    document.getElementById('videogifPreview').style.display = 'block';
    document.getElementById('videogifFileInfo').innerHTML =
        `<span>📄 <strong>${file.name}</strong></span><span>📦 <strong>${formatBytes(file.size)}</strong></span>`;
    document.getElementById('videogifClearRow').style.display = 'flex';

    videogifVideo.addEventListener('loadedmetadata', () => {
        videogifDuration = videogifVideo.duration;
        const defaultEnd = Math.min(5, videogifDuration);
        document.getElementById('videogifStart').value = 0;
        document.getElementById('videogifEnd').value   = defaultEnd.toFixed(1);
        document.getElementById('videogifStartRange').max = 100;
        document.getElementById('videogifEndRange').max   = 100;
        document.getElementById('videogifStartRange').value = 0;
        document.getElementById('videogifEndRange').value   = (defaultEnd / videogifDuration * 100).toFixed(1);
        document.getElementById('videogifTimeline').style.display = 'block';
        document.getElementById('videogifOptions').style.display  = 'block';
        videogifBtn.disabled = false;
        vgUpdateTrimInfo();
        // render strip thumbnails
        vgRenderStrip();
    }, { once: true });
});

async function vgRenderStrip() {
    const strip = document.getElementById('videogifStrip');
    strip.innerHTML = '';
    const thumbCount = 8;
    const v = document.createElement('video');
    v.src = URL.createObjectURL(videogifFile);
    v.muted = true;
    await new Promise(res => { v.onloadedmetadata = res; v.load(); });
    const c = document.createElement('canvas');
    c.width = 80; c.height = 45;
    const ctx = c.getContext('2d');
    for (let i = 0; i < thumbCount; i++) {
        const t = (i / (thumbCount - 1)) * videogifDuration;
        await new Promise(res => { v.currentTime = t; v.onseeked = res; });
        ctx.drawImage(v, 0, 0, 80, 45);
        const img = document.createElement('img');
        img.src = c.toDataURL('image/jpeg', 0.5);
        strip.appendChild(img);
    }
}

document.getElementById('videogifClear').addEventListener('click', () => {
    videogifFile = null;
    videogifDuration = 0;
    videogifVideo.src = '';
    document.getElementById('videogifPreview').style.display  = 'none';
    document.getElementById('videogifClearRow').style.display = 'none';
    document.getElementById('videogifTimeline').style.display = 'none';
    document.getElementById('videogifOptions').style.display  = 'none';
    document.getElementById('videogifResult').style.display   = 'none';
    document.getElementById('videogifStrip').innerHTML = '';
    videogifBtn.disabled = true;
    videogifUpload.value = '';
});

// ── convert ───────────────────────────────────────────────────
videogifBtn.addEventListener('click', async () => {
    if (!videogifFile) return;
    const startTime  = parseFloat(document.getElementById('videogifStart').value) || 0;
    const endTime    = parseFloat(document.getElementById('videogifEnd').value)   || 5;
    const fps        = parseInt(document.getElementById('videogifFps').value)     || 10;
    const targetW    = parseInt(document.getElementById('videogifWidth').value)   || 480;
    const colors     = parseInt(document.getElementById('videogifQuality').value) || 128;
    const loopVal    = parseInt(document.getElementById('videogifLoop').value);
    const reverseMode= parseInt(document.getElementById('videogifReverse').value);

    if (endTime <= startTime) return alert('End time must be greater than start time.');
    const duration    = endTime - startTime;
    const totalFrames = Math.round(duration * fps);
    if (totalFrames > 400) return alert(`Too many frames (${totalFrames}). Reduce duration or fps.`);
    if (totalFrames < 1)   return alert('Selection too short. Increase duration or fps.');

    videogifBtn.disabled = true;
    const progress = document.getElementById('videogifProgress');
    const fill     = document.getElementById('videogifProgressFill');
    const label    = document.getElementById('videogifProgressLabel');
    progress.style.display = 'block';
    fill.style.width = '3%';
    label.textContent = 'Loading video…';

    try {
        const video = document.createElement('video');
        video.src   = URL.createObjectURL(videogifFile);
        video.muted = true;
        video.preload = 'auto';
        await new Promise(res => { video.onloadedmetadata = res; video.load(); });

        const aspectH = Math.round(video.videoHeight * (targetW / video.videoWidth));
        const canvas  = document.createElement('canvas');
        canvas.width  = targetW;
        canvas.height = aspectH;
        const ctx = canvas.getContext('2d');

        // capture frames as individual canvases for gif.js
        const capturedFrames = [];
        for (let i = 0; i < totalFrames; i++) {
            const t = startTime + (i / fps);
            await new Promise(res => { video.currentTime = t; video.onseeked = res; });
            const fc = document.createElement('canvas');
            fc.width = targetW; fc.height = aspectH;
            fc.getContext('2d').drawImage(video, 0, 0, targetW, aspectH);
            capturedFrames.push(fc);
            fill.style.width = Math.round(((i + 1) / totalFrames) * 65) + '%';
            label.textContent = `Capturing frame ${i + 1} / ${totalFrames}`;
        }

        // apply reverse / ping-pong
        let orderedFrames = [...capturedFrames];
        if (reverseMode === 1) orderedFrames = orderedFrames.reverse();
        if (reverseMode === 2) orderedFrames = [...orderedFrames, ...[...orderedFrames].reverse()];

        fill.style.width = '70%';
        label.textContent = 'Encoding GIF…';

        const frameDelay = Math.round(1000 / fps);
        const blob = await GIFMaker.encode(
            orderedFrames.map(c => ({ canvas: c, delay: frameDelay })),
            { loop: loopVal, quality: Math.round(20 - (colors / 256) * 18) }
        );

        fill.style.width = '100%';
        label.textContent = 'Done!';
        setTimeout(() => { progress.style.display = 'none'; }, 600);

        videogifBlobUrl = URL.createObjectURL(blob);
        document.getElementById('videogifPreviewImg').src = videogifBlobUrl;
        document.getElementById('videogifResultStats').innerHTML =
            `<span>🎞 ${orderedFrames.length} frames</span><span>📦 ${formatBytes(blob.size)}</span><span>📐 ${targetW}×${aspectH}px</span><span>⏱ ${fps}fps</span>`;
        document.getElementById('videogifResult').style.display  = 'block';
        document.getElementById('videogifSuccess').style.display = 'block';
        videogifBtn.disabled = false;
    } catch (err) {
        progress.style.display = 'none';
        alert('Conversion failed: ' + err.message);
        videogifBtn.disabled = false;
    }
});

document.getElementById('videogifDownload').addEventListener('click', () => {
    if (videogifBlobUrl) triggerDownload(videogifBlobUrl, 'video-to-gif.gif');
});

document.getElementById('videogifCopyClipboard').addEventListener('click', async () => {
    if (!videogifBlobUrl) return;
    const btn = document.getElementById('videogifCopyClipboard');
    btn.textContent = '⏳ Copying…';
    try {
        const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = videogifBlobUrl; });
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        const pngBlob = await new Promise(res => c.toBlob(res, 'image/png'));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
        btn.textContent = '✅ Copied as PNG!';
    } catch {
        triggerDownload(videogifBlobUrl, 'video-to-gif.gif');
        btn.textContent = '⬇ Downloaded!';
    }
    setTimeout(() => { btn.textContent = '📋 Copy to Clipboard'; }, 2500);
});

// ══════════════════════════════════════════════════════════════
// 12. Image → Sticker
// ══════════════════════════════════════════════════════════════
const stickerDrop   = document.getElementById('stickerDrop');
const stickerUpload = document.getElementById('stickerUpload');
const stickerBtn    = document.getElementById('stickerBtn');
const stickerCanvas = document.getElementById('stickerCanvas');
const stickerResult = document.getElementById('stickerResult');
let stickerFile = null;

setupDrop(stickerDrop, stickerUpload, files => {
    if (!files[0]) return;
    stickerFile = files[0];
    document.getElementById('stickerImg').src = URL.createObjectURL(stickerFile);
    document.getElementById('stickerPreview').style.display = 'block';
    buildFileInfo(document.getElementById('stickerFileInfo'), stickerFile);
    document.getElementById('stickerOptions').style.display = 'block';
    document.getElementById('stickerClearRow').style.display = 'flex';
    stickerBtn.disabled = false;
    renderSticker();
});

['stickerFormat', 'stickerSize', 'stickerBg'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => { if (stickerFile) renderSticker(); });
});

function renderSticker() {
    const size = parseInt(document.getElementById('stickerSize').value) || 512;
    const bg   = document.getElementById('stickerBg').value;
    const img  = new Image();
    img.onload = () => {
        stickerCanvas.width  = size;
        stickerCanvas.height = size;
        const ctx = stickerCanvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        if (bg === 'white') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size); }
        else if (bg === 'black') { ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, size, size); }
        // Fit image inside square maintaining aspect ratio
        const ratio = Math.min(size / img.naturalWidth, size / img.naturalHeight);
        const dw = img.naturalWidth * ratio;
        const dh = img.naturalHeight * ratio;
        const dx = (size - dw) / 2;
        const dy = (size - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
        stickerResult.src = stickerCanvas.toDataURL('image/png');
    };
    img.src = URL.createObjectURL(stickerFile);
}

stickerBtn.addEventListener('click', () => {
    if (!stickerFile) return;
    renderSticker();
    setTimeout(() => {
        const format = document.getElementById('stickerFormat').value;
        const ext = format === 'image/webp' ? 'webp' : 'png';
        const size = parseInt(document.getElementById('stickerSize').value) || 512;
        stickerCanvas.toBlob(blob => {
            triggerDownload(URL.createObjectURL(blob), `sticker-${size}x${size}.${ext}`);
            document.getElementById('stickerSuccess').style.display = 'block';
        }, format, 0.95);
    }, 120);
});

document.getElementById('stickerClear').addEventListener('click', () => {
    stickerFile = null;
    document.getElementById('stickerImg').src = '';
    document.getElementById('stickerPreview').style.display = 'none';
    document.getElementById('stickerOptions').style.display = 'none';
    document.getElementById('stickerClearRow').style.display = 'none';
    stickerBtn.disabled = true;
    document.getElementById('stickerSuccess').style.display = 'none';
    stickerResult.src = '';
    stickerUpload.value = '';
});

// ══════════════════════════════════════════════════════════════
// QR Code for Share Tool
// ══════════════════════════════════════════════════════════════
function generateShareQR(url) {
    const container = document.getElementById('shareQrCode');
    container.innerHTML = '';
    try {
        new QRCode(container, {
            text: url,
            width: 128,
            height: 128,
            colorDark: '#0f1117',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
    } catch (e) {
        container.innerHTML = '<p style="font-size:0.75em;color:var(--text3);">QR unavailable</p>';
    }
}

// ── Contact Form ───────────────────────────────────────────────
(function initContact() {
    const form     = document.getElementById('contactForm');
    if (!form) return;
    const cfName   = document.getElementById('cfName');
    const cfEmail  = document.getElementById('cfEmail');
    const cfMsg    = document.getElementById('cfMessage');
    const cfSuccess= document.getElementById('cfSuccess');

    function showErr(id, msg) { document.getElementById(id).textContent = msg; }
    function clearErr(id)     { document.getElementById(id).textContent = ''; }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        let valid = true;

        clearErr('cfNameErr'); clearErr('cfEmailErr'); clearErr('cfMessageErr');

        if (!cfName.value.trim()) { showErr('cfNameErr', 'Name is required.'); valid = false; }
        if (!cfEmail.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfEmail.value)) {
            showErr('cfEmailErr', 'Enter a valid email address.'); valid = false;
        }
        if (!cfMsg.value.trim() || cfMsg.value.trim().length < 10) {
            showErr('cfMessageErr', 'Message must be at least 10 characters.'); valid = false;
        }
        if (!valid) return;

        const btn = form.querySelector('.cf-submit');
        btn.disabled = true;
        btn.textContent = '⏳ Sending…';

        try {
            // Uses Formspree — replace YOUR_FORM_ID with actual ID from formspree.io
            const res = await fetch('https://formspree.io/f/xpwzgkqv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    name:    cfName.value.trim(),
                    email:   cfEmail.value.trim(),
                    subject: document.getElementById('cfSubject').value,
                    message: cfMsg.value.trim()
                })
            });
            if (res.ok) {
                form.reset();
                cfSuccess.style.display = 'block';
                setTimeout(() => { cfSuccess.style.display = 'none'; }, 6000);
            } else {
                alert('Failed to send. Please try emailing directly at mianhassam96@gmail.com');
            }
        } catch {
            alert('Network error. Please email directly at mianhassam96@gmail.com');
        }

        btn.disabled = false;
        btn.textContent = '✉️ Send Message';
    });

    // FAQ accordion
    document.querySelectorAll('.faq-q').forEach(btn => {
        btn.addEventListener('click', function() {
            const item    = this.closest('.faq-item');
            const answer  = item.querySelector('.faq-a');
            const isOpen  = item.classList.contains('open');
            // close all
            document.querySelectorAll('.faq-item.open').forEach(i => {
                i.classList.remove('open');
                i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
            });
            if (!isOpen) {
                item.classList.add('open');
                this.setAttribute('aria-expanded', 'true');
            }
        });
    });
})();


// ══════════════════════════════════════════════════════════════
// SESSION PRODUCTIVITY TRACKER
// ══════════════════════════════════════════════════════════════
const SessionTracker = (() => {
    let count = parseInt(sessionStorage.getItem('ik_session_count') || '0');

    function increment(label) {
        count++;
        sessionStorage.setItem('ik_session_count', count);
        const bar = document.getElementById('sessionBar');
        const countEl = document.getElementById('sessionCount');
        if (bar && countEl) {
            countEl.textContent = count;
            bar.style.display = 'flex';
        }
        // Show celebration on milestones
        if (count === 1 || count === 5 || count === 10 || count === 25) {
            showCelebration(label || 'Done!');
        }
    }

    return { increment };
})();

// ── Celebration overlay ────────────────────────────────────────
function showCelebration(msg) {
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    overlay.innerHTML = `<div class="celebration-badge">✅ ${msg}</div>`;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 1800);
    spawnConfetti();
}

function spawnConfetti() {
    const colors = ['#16a34a','#0ea5e9','#6366f1','#f59e0b','#ec4899','#10b981'];
    for (let i = 0; i < 28; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-particle';
        p.style.cssText = `
            left: ${Math.random() * 100}vw;
            top: ${Math.random() * 30}vh;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            animation-duration: ${0.8 + Math.random() * 1.2}s;
            animation-delay: ${Math.random() * 0.4}s;
            width: ${6 + Math.random() * 8}px;
            height: ${6 + Math.random() * 8}px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        `;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 2200);
    }
}

// ── Patch existing tool success handlers to track session ──────
(function patchSessionTracking() {
    // Patch compress
    const origCompressBtn = document.getElementById('compressBtn');
    if (origCompressBtn) {
        origCompressBtn.addEventListener('click', () => {
            // tracked after blob download in compress handler below
        });
    }
})();

// ══════════════════════════════════════════════════════════════
// SMART FILE ANALYSIS
// ══════════════════════════════════════════════════════════════
function analyzeImage(file, imgEl, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const insights = [];
    const sizeMB = file.size / 1048576;
    const sizeKB = file.size / 1024;
    const ext = (file.type || '').split('/')[1] || file.name.split('.').pop().toLowerCase();

    // Size analysis
    if (sizeMB > 5) {
        insights.push({ type: 'warn', icon: '⚠️', text: `<strong>Large file (${sizeMB.toFixed(1)} MB)</strong> — Compressing could reduce this by 70–90% with minimal quality loss.` });
    } else if (sizeMB > 1) {
        insights.push({ type: 'info', icon: '💡', text: `<strong>${sizeMB.toFixed(1)} MB</strong> — Good candidate for compression. WebP conversion could save ~40%.` });
    } else {
        insights.push({ type: 'good', icon: '✅', text: `<strong>File size looks good</strong> (${sizeKB.toFixed(0)} KB) — Already well-optimized.` });
    }

    // Format analysis
    if (ext === 'png' && sizeMB > 0.5) {
        insights.push({ type: 'tip', icon: '🔄', text: `<strong>PNG detected</strong> — Converting to WebP could reduce size by 25–35% with no visible quality loss.` });
    }
    if (ext === 'bmp') {
        insights.push({ type: 'warn', icon: '⚠️', text: `<strong>BMP format</strong> — This is uncompressed. Convert to JPG or WebP for 90%+ size reduction.` });
    }
    if (ext === 'gif') {
        insights.push({ type: 'info', icon: '💡', text: `<strong>GIF detected</strong> — If this is animated, use the Video→GIF tool for better quality.` });
    }

    // Resolution analysis (needs image to load)
    if (imgEl && imgEl.naturalWidth) {
        const w = imgEl.naturalWidth;
        const h = imgEl.naturalHeight;
        if (w > 4000 || h > 4000) {
            insights.push({ type: 'warn', icon: '📐', text: `<strong>Very high resolution (${w}×${h}px)</strong> — Most screens only need 1920×1080. Resizing could save significant space.` });
        } else if (w < 400 || h < 400) {
            insights.push({ type: 'warn', icon: '🔍', text: `<strong>Low resolution (${w}×${h}px)</strong> — This image may appear blurry on larger screens or social media.` });
        } else if (w === h) {
            insights.push({ type: 'tip', icon: '📱', text: `<strong>Square image (${w}×${h}px)</strong> — Perfect for Instagram posts! Use the Sticker tool for WhatsApp.` });
        }
        // Social media hints
        if (w === 1920 && h === 1080) {
            insights.push({ type: 'good', icon: '✅', text: `<strong>1920×1080 — YouTube/HD ready</strong> — Perfect dimensions for YouTube thumbnails and HD displays.` });
        }
        if (w === 1080 && h === 1080) {
            insights.push({ type: 'good', icon: '✅', text: `<strong>1080×1080 — Instagram ready</strong> — Perfect square format for Instagram posts.` });
        }
    }

    // Transparency hint
    if (ext === 'png') {
        insights.push({ type: 'info', icon: '🔲', text: `<strong>PNG may have transparency</strong> — If you need a solid background, use the Sticker tool to set a background color.` });
    }

    // Render insights
    const insightsEl = container.querySelector('.sa-insights');
    if (!insightsEl) return;
    insightsEl.innerHTML = insights.map(i =>
        `<div class="sa-insight sa-${i.type}">
            <span class="sa-insight-icon">${i.icon}</span>
            <span class="sa-insight-text">${i.text}</span>
        </div>`
    ).join('');
    container.style.display = 'block';
}

// ══════════════════════════════════════════════════════════════
// BEFORE / AFTER SLIDER (Compress tool)
// ══════════════════════════════════════════════════════════════
(function initBeforeAfter() {
    const container = document.getElementById('baContainer');
    if (!container) return;
    const afterWrap = document.getElementById('baAfterWrap');
    const divider   = document.getElementById('baDivider');
    let dragging = false;

    function setPosition(x) {
        const rect = container.getBoundingClientRect();
        let pct = Math.max(5, Math.min(95, ((x - rect.left) / rect.width) * 100));
        afterWrap.style.width = pct + '%';
        divider.style.left    = pct + '%';
        // sync after image width so it shows correctly
        const afterImg = document.getElementById('baAfter');
        if (afterImg) afterImg.style.width = (100 / (pct / 100)) + '%';
    }

    container.addEventListener('mousedown', e => { dragging = true; setPosition(e.clientX); });
    container.addEventListener('touchstart', e => { dragging = true; setPosition(e.touches[0].clientX); }, { passive: true });
    document.addEventListener('mousemove', e => { if (dragging) setPosition(e.clientX); });
    document.addEventListener('touchmove', e => { if (dragging) setPosition(e.touches[0].clientX); }, { passive: true });
    document.addEventListener('mouseup',  () => { dragging = false; });
    document.addEventListener('touchend', () => { dragging = false; });
})();

// Patch compress tool to add smart analysis + before/after + savings animation
(function patchCompressTool() {
    const origSetupDrop = setupDrop;
    // Hook into compress file load
    const compressDrop2   = document.getElementById('compressDrop');
    const compressUpload2 = document.getElementById('compressUpload');
    if (!compressDrop2) return;

    // After file loads, run analysis
    const origCompressFiles = compressDrop2._onFiles;
    compressUpload2.addEventListener('change', () => {
        setTimeout(() => {
            if (compressFile) {
                const img = document.getElementById('compressImg');
                img.onload = () => analyzeImage(compressFile, img, 'compressAnalysis');
            }
        }, 200);
    });

    // Patch compress button to show savings animation + before/after
    const compressBtn2 = document.getElementById('compressBtn');
    if (!compressBtn2) return;

    compressBtn2.addEventListener('click', function handler() {
        // After compression, show before/after and savings animation
        setTimeout(() => {
            const origSrc = document.getElementById('compressImg').src;
            const quality = parseInt(document.getElementById('qualitySlider').value) / 100;
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                canvas.getContext('2d').drawImage(img, 0, 0);
                canvas.toBlob(blob => {
                    if (!blob || !compressFile) return;

                    // Before/After
                    const baWrap = document.getElementById('beforeAfterWrap');
                    const baBefore = document.getElementById('baBefore');
                    const baAfter  = document.getElementById('baAfter');
                    if (baWrap && baBefore && baAfter) {
                        baBefore.src = origSrc;
                        baAfter.src  = URL.createObjectURL(blob);
                        baWrap.style.display = 'block';
                        // Reset divider to 50%
                        const afterWrap = document.getElementById('baAfterWrap');
                        const divider   = document.getElementById('baDivider');
                        if (afterWrap) afterWrap.style.width = '50%';
                        if (divider)   divider.style.left    = '50%';
                    }

                    // Savings animation
                    const origBytes = compressFile.size;
                    const newBytes  = blob.size;
                    const saved     = Math.max(0, ((origBytes - newBytes) / origBytes * 100)).toFixed(1);
                    const animEl    = document.getElementById('compressSavingsAnim');
                    if (animEl) {
                        document.getElementById('savingsFrom').textContent = formatBytes(origBytes);
                        document.getElementById('savingsTo').textContent   = formatBytes(newBytes);
                        document.getElementById('savingsPct').textContent  = `Saved ${saved}%`;
                        animEl.style.display = 'block';
                    }

                    // Savings bar
                    const savingsDisplay = document.getElementById('savingsDisplay');
                    const savingsBarFill = document.getElementById('savingsBarFill');
                    const savingsLabel   = document.getElementById('savingsLabel');
                    if (savingsDisplay && savingsBarFill && savingsLabel) {
                        savingsDisplay.style.display = 'block';
                        setTimeout(() => { savingsBarFill.style.width = saved + '%'; }, 50);
                        savingsLabel.textContent = `Reduced by ${saved}% — from ${formatBytes(origBytes)} to ${formatBytes(newBytes)}`;
                    }

                    // Session tracking
                    SessionTracker.increment(`Saved ${saved}%!`);
                }, 'image/jpeg', quality);
            };
            img.src = origSrc;
        }, 300);
    });
})();

// Patch other tools to track session
['ocrBtn','resizeBtn','convertBtn','wmBtn','mergeBtn','shareBtn','gifBtn','videogifBtn','stickerBtn','t2pBtn','ssBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', () => {
        setTimeout(() => {
            const successEl = document.querySelector(`#${id.replace('Btn','Success')}, #${id.replace('Btn','').toLowerCase()}Success`);
            if (successEl && successEl.style.display !== 'none') {
                SessionTracker.increment('Done!');
            }
        }, 1500);
    });
});

// ══════════════════════════════════════════════════════════════
// 13. SCREENSHOT STUDIO
// ══════════════════════════════════════════════════════════════
const ssDrop   = document.getElementById('ssDrop');
const ssUpload = document.getElementById('ssUpload');
const ssBtn    = document.getElementById('ssBtn');
const ssCopyBtn= document.getElementById('ssCopyBtn');
const ssCanvas = document.getElementById('ssCanvas');
let ssFile = null;
let ssCurrentStyle = 'macOS';

if (ssDrop && ssUpload) {
    setupDrop(ssDrop, ssUpload, files => {
        if (!files[0]) return;
        ssFile = files[0];
        const img = document.getElementById('ssImg');
        img.src = URL.createObjectURL(ssFile);
        document.getElementById('ssPreview').style.display = 'block';
        buildFileInfo(document.getElementById('ssFileInfo'), ssFile);
        document.getElementById('ssClearRow').style.display = 'flex';
        ssBtn.disabled = false;
        ssCopyBtn.disabled = false;
        img.onload = () => {
            analyzeImage(ssFile, img, 'ssAnalysis');
            renderScreenshotStudio();
        };
        document.getElementById('ssOptions').style.display = 'block';
    });
}

// Style tab switching
document.querySelectorAll('.ss-style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.ss-style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ssCurrentStyle = btn.dataset.style;
        if (ssFile) renderScreenshotStudio();
    });
});

// Options change → re-render
['ssBgType','ssPadding','ssRadius','ssShadow'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => { if (ssFile) renderScreenshotStudio(); });
});

function renderScreenshotStudio() {
    if (!ssFile || !ssCanvas) return;
    const img = document.getElementById('ssImg');
    if (!img.naturalWidth) return;

    const bgType  = document.getElementById('ssBgType')?.value  || 'gradient-purple';
    const padding = parseInt(document.getElementById('ssPadding')?.value || '80');
    const radius  = parseInt(document.getElementById('ssRadius')?.value  || '16');
    const shadow  = document.getElementById('ssShadow')?.value  || 'medium';
    const style   = ssCurrentStyle;

    const iW = img.naturalWidth;
    const iH = img.naturalHeight;

    // Scale for preview (max 800px wide)
    const scale = Math.min(1, 800 / (iW + padding * 2));
    const cW = Math.round((iW + padding * 2) * scale);
    const cH = Math.round((iH + padding * 2 + (style === 'macOS' || style === 'browser' ? 36 : 0)) * scale);

    ssCanvas.width  = cW;
    ssCanvas.height = cH;
    const ctx = ssCanvas.getContext('2d');

    // Background
    drawBackground(ctx, cW, cH, bgType);

    // Shadow
    const sx = padding * scale;
    const sy = (padding + (style === 'macOS' || style === 'browser' ? 36 : 0)) * scale;
    const sw = iW * scale;
    const sh = iH * scale;

    if (shadow !== 'none') {
        const shadows = {
            soft:   { blur: 20, spread: 0, alpha: 0.15 },
            medium: { blur: 40, spread: 0, alpha: 0.25 },
            hard:   { blur: 8,  spread: 0, alpha: 0.5  },
            glow:   { blur: 60, spread: 0, alpha: 0.35, color: '#6366f1' }
        };
        const s = shadows[shadow] || shadows.medium;
        ctx.shadowColor   = s.color || `rgba(0,0,0,${s.alpha})`;
        ctx.shadowBlur    = s.blur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = shadow === 'hard' ? 4 : 8;
    }

    // Draw frame
    ctx.save();
    if (style === 'macOS' || style === 'browser') {
        // Draw title bar
        const barH = 36 * scale;
        const barY = padding * scale;
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = style === 'macOS' ? '#2d2d2d' : '#f1f3f4';
        roundRect(ctx, sx, barY, sw, barH + sh, radius * scale);
        ctx.fill();

        // Reset shadow for content
        ctx.shadowColor = 'transparent';

        if (style === 'macOS') {
            // Traffic lights
            const dotY = barY + barH / 2;
            const dots = ['#ff5f57','#febc2e','#28c840'];
            dots.forEach((c, i) => {
                ctx.beginPath();
                ctx.arc(sx + (14 + i * 20) * scale, dotY, 6 * scale, 0, Math.PI * 2);
                ctx.fillStyle = c;
                ctx.fill();
            });
        } else {
            // Browser address bar
            ctx.fillStyle = '#fff';
            const urlBarW = sw * 0.5;
            const urlBarH = 20 * scale;
            const urlBarX = sx + (sw - urlBarW) / 2;
            const urlBarY = barY + (barH - urlBarH) / 2;
            roundRect(ctx, urlBarX, urlBarY, urlBarW, urlBarH, 10 * scale);
            ctx.fill();
            ctx.fillStyle = '#999';
            ctx.font = `${10 * scale}px system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('multimian.com', urlBarX + urlBarW / 2, urlBarY + urlBarH / 2);
        }

        // Draw screenshot inside frame
        ctx.save();
        roundRect(ctx, sx, sy, sw, sh, 0);
        ctx.clip();
        ctx.drawImage(img, sx, sy, sw, sh);
        ctx.restore();

        // Outer border
        ctx.strokeStyle = style === 'macOS' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        roundRect(ctx, sx, barY, sw, barH + sh, radius * scale);
        ctx.stroke();

    } else {
        // Simple rounded screenshot
        ctx.save();
        roundRect(ctx, sx, sy, sw, sh, radius * scale);
        ctx.clip();
        ctx.shadowColor = 'transparent';
        ctx.drawImage(img, sx, sy, sw, sh);
        ctx.restore();

        // Border
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        roundRect(ctx, sx, sy, sw, sh, radius * scale);
        ctx.stroke();
    }

    ctx.restore();
    ctx.shadowColor = 'transparent';
}

function drawBackground(ctx, w, h, type) {
    const gradients = {
        'gradient-purple': ['#667eea','#764ba2'],
        'gradient-blue':   ['#0ea5e9','#6366f1'],
        'gradient-green':  ['#16a34a','#0ea5e9'],
        'gradient-sunset': ['#f59e0b','#ef4444','#8b5cf6'],
        'gradient-dark':   ['#0f172a','#1e293b'],
        'solid-white':     ['#ffffff','#ffffff'],
        'solid-black':     ['#000000','#000000'],
        'transparent':     null
    };
    const stops = gradients[type];
    if (!stops) {
        ctx.clearRect(0, 0, w, h);
        return;
    }
    if (stops[0] === stops[1]) {
        ctx.fillStyle = stops[0];
        ctx.fillRect(0, 0, w, h);
        return;
    }
    const grd = ctx.createLinearGradient(0, 0, w, h);
    stops.forEach((c, i) => grd.addColorStop(i / (stops.length - 1), c));
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function getFullResSSCanvas() {
    if (!ssFile) return null;
    const img = document.getElementById('ssImg');
    if (!img.naturalWidth) return null;

    const bgType  = document.getElementById('ssBgType')?.value  || 'gradient-purple';
    const padding = parseInt(document.getElementById('ssPadding')?.value || '80');
    const radius  = parseInt(document.getElementById('ssRadius')?.value  || '16');
    const shadow  = document.getElementById('ssShadow')?.value  || 'medium';
    const style   = ssCurrentStyle;

    const iW = img.naturalWidth;
    const iH = img.naturalHeight;
    const cW = iW + padding * 2;
    const cH = iH + padding * 2 + (style === 'macOS' || style === 'browser' ? 36 : 0);

    const c = document.createElement('canvas');
    c.width = cW; c.height = cH;
    const ctx = c.getContext('2d');

    drawBackground(ctx, cW, cH, bgType);

    const sx = padding;
    const sy = padding + (style === 'macOS' || style === 'browser' ? 36 : 0);

    if (shadow !== 'none') {
        const shadows = { soft:{blur:30,alpha:0.15}, medium:{blur:60,alpha:0.25}, hard:{blur:12,alpha:0.5}, glow:{blur:80,alpha:0.35,color:'#6366f1'} };
        const s = shadows[shadow] || shadows.medium;
        ctx.shadowColor = s.color || `rgba(0,0,0,${s.alpha})`;
        ctx.shadowBlur  = s.blur;
        ctx.shadowOffsetY = shadow === 'hard' ? 6 : 12;
    }

    if (style === 'macOS' || style === 'browser') {
        const barH = 36;
        const barY = padding;
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = style === 'macOS' ? '#2d2d2d' : '#f1f3f4';
        roundRect(ctx, sx, barY, iW, barH + iH, radius);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        if (style === 'macOS') {
            const dotY = barY + barH / 2;
            ['#ff5f57','#febc2e','#28c840'].forEach((c2, i) => {
                ctx.beginPath(); ctx.arc(sx + 14 + i * 20, dotY, 6, 0, Math.PI * 2);
                ctx.fillStyle = c2; ctx.fill();
            });
        } else {
            ctx.fillStyle = '#fff';
            const urlBarW = iW * 0.5, urlBarH = 20;
            const urlBarX = sx + (iW - urlBarW) / 2, urlBarY = barY + (barH - urlBarH) / 2;
            roundRect(ctx, urlBarX, urlBarY, urlBarW, urlBarH, 10); ctx.fill();
        }
        ctx.save();
        roundRect(ctx, sx, sy, iW, iH, 0); ctx.clip();
        ctx.drawImage(img, sx, sy, iW, iH);
        ctx.restore();
    } else {
        ctx.save();
        roundRect(ctx, sx, sy, iW, iH, radius); ctx.clip();
        ctx.shadowColor = 'transparent';
        ctx.drawImage(img, sx, sy, iW, iH);
        ctx.restore();
    }
    ctx.shadowColor = 'transparent';
    return c;
}

if (ssBtn) {
    ssBtn.addEventListener('click', () => {
        const c = getFullResSSCanvas();
        if (!c) return;
        c.toBlob(blob => {
            const name = (ssFile?.name || 'screenshot').replace(/\.[^.]+$/, '') + '-studio.png';
            triggerDownload(URL.createObjectURL(blob), name);
            document.getElementById('ssSuccess').style.display = 'block';
            SessionTracker.increment('Screenshot exported!');
        }, 'image/png');
    });
}

if (ssCopyBtn) {
    ssCopyBtn.addEventListener('click', async () => {
        const c = getFullResSSCanvas();
        if (!c) return;
        ssCopyBtn.textContent = '⏳ Copying…';
        try {
            const blob = await new Promise(res => c.toBlob(res, 'image/png'));
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            ssCopyBtn.textContent = '✅ Copied!';
        } catch {
            ssCopyBtn.textContent = '❌ Failed';
        }
        setTimeout(() => { ssCopyBtn.textContent = '📋 Copy to Clipboard'; }, 2500);
    });
}

const ssClearBtn = document.getElementById('ssClear');
if (ssClearBtn) {
    ssClearBtn.addEventListener('click', () => {
        ssFile = null;
        document.getElementById('ssImg').src = '';
        document.getElementById('ssPreview').style.display = 'none';
        document.getElementById('ssClearRow').style.display = 'none';
        document.getElementById('ssOptions').style.display = 'none';
        document.getElementById('ssAnalysis').style.display = 'none';
        document.getElementById('ssSuccess').style.display = 'none';
        ssBtn.disabled = true;
        ssCopyBtn.disabled = true;
        ssUpload.value = '';
        if (ssCanvas) { ssCanvas.width = 0; ssCanvas.height = 0; }
    });
}

// ── Patch compress drop to trigger analysis ────────────────────
(function patchCompressAnalysis() {
    const compressUploadEl = document.getElementById('compressUpload');
    const compressDrop3    = document.getElementById('compressDrop');
    if (!compressDrop3) return;

    // Watch for compressFile changes via MutationObserver on preview
    const observer = new MutationObserver(() => {
        if (compressFile) {
            const img = document.getElementById('compressImg');
            if (img.src && img.naturalWidth) {
                analyzeImage(compressFile, img, 'compressAnalysis');
            } else {
                img.onload = () => analyzeImage(compressFile, img, 'compressAnalysis');
            }
        }
    });
    const preview = document.getElementById('compressPreview');
    if (preview) observer.observe(preview, { attributes: true, attributeFilter: ['style'] });
})();

// ── Workflow card navigation ───────────────────────────────────
document.querySelectorAll('.workflow-card[data-tab]').forEach(card => {
    card.addEventListener('click', () => activateTab(card.dataset.tab));
});

// ── Add screenshot to nav dropdown items ──────────────────────
// (already done in HTML, just ensure activateTab handles it)

// ── Session bar on home load ───────────────────────────────────
document.querySelectorAll('.tab-btn[data-tab="home"]').forEach(b => {
    b.addEventListener('click', () => {
        const count = parseInt(sessionStorage.getItem('ik_session_count') || '0');
        if (count > 0) {
            const bar = document.getElementById('sessionBar');
            const countEl = document.getElementById('sessionCount');
            if (bar && countEl) {
                countEl.textContent = count;
                bar.style.display = 'flex';
            }
        }
    });
});
