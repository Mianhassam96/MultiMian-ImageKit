# MultiMian ImageKit

<div align="center">

**The privacy-first, browser-based creative toolkit for images, PDFs, and media.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-mianhassam96.github.io-16a34a?style=for-the-badge&logo=github)](https://mianhassam96.github.io/MultiMian-ImageKit/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Tools](https://img.shields.io/badge/Tools-16-6366f1?style=for-the-badge)]()
[![No Uploads](https://img.shields.io/badge/Uploads-Zero-ec4899?style=for-the-badge)]()
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-0ea5e9?style=for-the-badge)]()

🌐 **[mianhassam96.github.io/MultiMian-ImageKit](https://mianhassam96.github.io/MultiMian-ImageKit/)**

</div>

---

## Why MultiMian ImageKit?

| | MultiMian ImageKit | Typical Online Tool |
|---|---|---|
| Files uploaded to server | ✅ Never | ❌ Usually yes |
| Registration required | ✅ None | ❌ Often required |
| Watermark on output | ✅ Never | ❌ Sometimes |
| Works offline | ✅ PWA support | ❌ No |
| File size limit | ✅ None | ❌ Usually 5–20 MB |
| Open source | ✅ MIT License | Varies |
| Cost | ✅ Free forever | Free with limits |

---

## 🛠 All 16 Tools

### 🖼 Image Tools

| Tool | Description | Tech |
|------|-------------|------|
| ✨ **Screenshot Studio** | Frames, shadows & gradients. macOS, Browser, Tweet, Glass, Code presets | Canvas API |
| 🗜 **Compress Image** | Reduce size up to 90%. WebP/JPG/PNG output. Live before/after slider | Canvas API |
| ✂️ **Resize Image** | Custom dimensions + social presets (Instagram, YouTube, Twitter, Facebook) | Canvas API |
| ✂️ **Crop Image** | Free crop, ratio lock (1:1, 16:9, 4:3), rule-of-thirds grid, social presets | Canvas API |
| 🔄 **Convert Format** | JPG ↔ PNG ↔ WebP with quality slider | Canvas API |
| 💧 **Watermark** | Text overlay, 6 positions + tile, custom font/color/opacity | Canvas API |
| 🔗 **Merge Images** | Side-by-side or stacked. Export JPG, PNG or PDF | Canvas + jsPDF |
| 🔗 **Share Anywhere** | ImgBB upload → permanent link + QR code + social share | ImgBB API |
| 🔤 **Extract Text (OCR)** | 10+ languages. Copy, TXT or PDF export | Tesseract.js |

### 📄 PDF & Document Tools

| Tool | Description | Tech |
|------|-------------|------|
| 📝 **Text Studio** | Write, format & export as TXT, RTF, DOCX, PDF. Read .txt/.rtf/.docx | jsPDF + PDF.js |
| 🖼 **PDF to Image** | Convert pages to PNG/JPG. Individual or ZIP download. Up to 3x scale | PDF.js + JSZip |

### 🎬 Media Tools

| Tool | Description | Tech |
|------|-------------|------|
| 🎞 **Image to GIF** | Multi-frame animated GIF, drag-reorder, per-frame delay | gif.js |
| 🎬 **Video to GIF** | Clip trimmer, frame rate control, ping-pong mode | Canvas + gif.js |
| 🎨 **Image to Sticker** | 512×512 PNG/WebP for WhatsApp, Telegram & Discord | Canvas API |

### 🛠 Utilities

| Tool | Description | Tech |
|------|-------------|------|
| 🌐 **Favicon Generator** | 8 sizes (16–512px) + SVG + HTML snippet + manifest.json as ZIP | Canvas + JSZip |
| 🪪 **Passport Photo Maker** | UK/EU, US, India, Pakistan standards. Print layouts at 300 DPI | Canvas API |

---

## ⚡ Platform Features

| Feature | Description |
|---------|-------------|
| ⌘K **Command Palette** | Search all tools and actions instantly |
| 📦 **Universal Export Pack** | 1 image → 9 social sizes + WebP + favicon as ZIP |
| 🏥 **Image Health Score** | Score out of 100 with one-click fixes |
| 🔗 **Shared Asset Pipeline** | Upload once, continue through multiple tools |
| ⚡ **Workflow Engine** | Smart "continue with this file" suggestions after each action |
| 🕐 **Recent Workspace** | Last 6 exports with thumbnails |
| 📱 **PWA Install** | Install as desktop/mobile app, works offline |
| 🚀 **Smart Optimize** | One-click analyze + compress + convert automatically |
| 🎨 **Screenshot Annotations** | Add text, arrows, highlights, blur and emoji layers |
| 🗂 **Batch Processing** | Process multiple images with one operation |

---

## 💻 Tech Stack

- **HTML5, CSS3, Vanilla JS** (ES6+, no frameworks)
- [Tesseract.js](https://github.com/naptha/tesseract.js) — OCR
- [jsPDF](https://github.com/parallax/jsPDF) — PDF generation
- [PDF.js](https://mozilla.github.io/pdf.js/) — PDF parsing
- [gif.js](https://github.com/jnordberg/gif.js) — GIF encoding
- [JSZip](https://stuk.github.io/jszip/) — ZIP generation
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) — QR codes
- **Canvas API** — all image manipulation
- **Service Worker** — PWA + offline (v4)
- **Web Workers** — background processing

---

## 🚀 Getting Started

No installation needed. Just open the link:

**[https://mianhassam96.github.io/MultiMian-ImageKit/](https://mianhassam96.github.io/MultiMian-ImageKit/)**

Or clone and run locally:

```bash
git clone https://github.com/Mianhassam96/MultiMian-ImageKit.git
cd MultiMian-ImageKit
# Open index.html in any modern browser
```

---

## 🌐 Browser Support

| Browser | Support |
|---------|---------|
| Chrome 90+ | ✅ Full support |
| Edge 90+ | ✅ Full support |
| Firefox 88+ | ✅ Full support |
| Safari 14+ | ✅ Full support |
| Mobile Chrome | ✅ Full support |
| Mobile Safari | ✅ Full support |

---

## 🗺 Roadmap

- [x] Sprint 1 — Premium homepage, mega nav, trust section, FAQ, footer
- [x] Sprint 2 — Bug fixes, responsive polish, SEO structured data, launch buttons
- [x] Sprint 3 — Crop tool, mobile bottom nav, OCR, GIF maker, PDF tools
- [x] Sprint 4 — Favicon generator, passport photo maker, video to GIF, sticker tool
- [ ] **Sprint 5 (in progress)** — 9 SEO tool landing pages, tools hub index, sitemap update, README overhaul
- [ ] Sprint 6 — AI-assisted Smart Optimize, background remover
- [ ] Sprint 7 — Browser extension
- [ ] Sprint 8 — Batch queue UI, collaborative share links

### Sprint 5 Progress

- [x] `tools/compress-image.html` — landing page
- [x] `tools/resize-image.html` — landing page
- [x] `tools/crop-image.html` — landing page
- [x] `tools/convert-image.html` — landing page
- [x] `tools/watermark.html` — landing page
- [x] `tools/ocr.html` — landing page
- [x] `tools/pdf-to-image.html` — landing page
- [x] `tools/passport-photo.html` — landing page
- [x] `tools/favicon-generator.html` — landing page
- [x] `tools/index.html` — tools hub page
- [x] `sitemap.xml` — updated with all 10 landing page URLs
- [x] Shared `assets/css/landing.css` + `assets/js/landing.js`
- [x] README overhaul (tools count fixed to 16)

---

## 🤝 Contributing

Issues, feature requests and PRs are welcome.  
→ [Open an Issue](https://github.com/Mianhassam96/MultiMian-ImageKit/issues)

---

## 📄 License

MIT License — Free for personal and commercial use.

---

<div align="center">
Built with ♥ by <a href="https://multimian.com">Mian Hassam</a>
</div>
