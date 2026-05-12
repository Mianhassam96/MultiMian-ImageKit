# MultiMian ImageKit

**Fast image workflows for creators — Compress, Convert, Beautify, Optimize, all in-browser.**

A browser-native creator productivity platform. No installation, no backend upload — everything runs locally in your browser.

🌐 **Live Demo:** https://mianhassam96.github.io/MultiMian-ImageKit/

---

## ✨ Phase 2 — Workflow Platform

### ⚡ New Platform Features
| Feature | Description |
|---------|-------------|
| 🔗 Shared Asset Pipeline | Upload once, continue through multiple tools without re-uploading |
| ⚡ Workflow Engine | After each action, get smart "continue with this file" suggestions |
| ⌘K Command Palette | Search all tools, workflows and actions instantly |
| 📦 Universal Export Pack | 1 image → all social sizes + WebP + favicon as ZIP |
| 🏥 Image Health Score | Score out of 100 with specific issues and one-click fixes |
| 🕐 Recent Workspace | Last 6 exports with thumbnails — continue where you left off |
| 📱 PWA Install | Install as desktop/mobile app, works offline |
| 🎛 Progressive Disclosure | Quick mode + Advanced accordion on Compress tool |

### 🖼 Screenshot Studio — New Presets
- 🐦 Tweet mode — Twitter card overlay
- 🚀 Product Hunt style — PH badge overlay
- 💻 Code theme — code editor frame
- 🔮 Glass — glassmorphism border + spotlight glow
- (+ existing: macOS, Browser, Shadow, Gradient, Clean)

---

## 🛠 All Tools (13)

### 🖼 Image Tools
| Tool | Description |
|------|-------------|
| ✨ Screenshot Studio | Frames, shadows & gradients. macOS, Browser, Tweet, PH, Code, Glass presets |
| 🔤 Image → Text (OCR) | Extract text in 10+ languages. Copy, TXT or PDF export |
| 🗜 Compress | Quick mode + Advanced. Live before/after slider. Savings animation |
| ✂️ Resize | Exact dimensions + social presets (Instagram, YouTube, Twitter, Facebook) |
| 🔄 Format Convert | JPG ↔ PNG ↔ WebP with quality control |
| 💧 Watermark | Text overlay, 6 positions + tile, custom font/color/opacity |
| 🔗 Merge Images | Side-by-side or stacked. Export JPG, PNG or PDF |
| 🌐 Share Image | ImgBB upload → public link + QR code |

### 📄 PDF Tools
| Tool | Description |
|------|-------------|
| 📝 Text Studio | Rich text editor. Export TXT, RTF, DOCX, PDF. Read .txt/.rtf/.docx |
| 🖼 PDF → Image | Pages to PNG/JPG. Individual or ZIP download |

### 🎬 Media Tools
| Tool | Description |
|------|-------------|
| 🎞 Image → GIF | Multi-frame animated GIF, drag-reorder, per-frame delay |
| 🎬 Video → GIF | Clip trimmer, frame rate control, ping-pong mode |
| 🎨 Image → Sticker | 512×512 PNG/WebP for WhatsApp, Telegram & Discord |

---

## 🎨 UI / UX
- Dark/light mode (localStorage)
- Drag & drop on all tools
- Animated hero canvas (particle mesh)
- Dropdown nav grouped by category
- Mobile hamburger drawer
- Confetti celebrations on milestones
- Session productivity tracker
- Smart file analysis on upload
 
## 💻 Technologies
- HTML5, CSS3, Vanilla JS (ES6+)
- [Tesseract.js](https://github.com/naptha/tesseract.js) — OCR
- [jsPDF](https://github.com/parallax/jsPDF) — PDF generation
- [PDF.js](https://mozilla.github.io/pdf.js/) — PDF parsing
- [gif.js](https://github.com/jnordberg/gif.js) — GIF encoding
- [JSZip](https://stuk.github.io/jszip/) — ZIP generation
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) — QR codes
- Canvas API — all image manipulation
- Service Worker — PWA + offline support

## 📄 License
MIT License — Free for personal and commercial use.
