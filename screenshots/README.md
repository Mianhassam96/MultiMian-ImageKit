# Screenshots

This directory contains screenshots for the README and documentation.

## Required Screenshots

Take these screenshots in Chrome at 1280×800 resolution (or use browser DevTools device emulation):

| Filename | What to capture |
|----------|----------------|
| `home.png` | Homepage — hero, stats, tool categories visible |
| `dashboard.png` | Homepage — workspace dashboard (after processing a file) |
| `compress.png` | Compress tool — with an image loaded and before/after slider visible |
| `ocr.png` | OCR tool — with text extracted and stats shown |
| `screenshot-studio.png` | Screenshot Studio — with macOS preset applied |
| `mobile.png` | Mobile view at 390px width — home or compress tool |
| `dark-mode.png` | Any tool in dark mode |

## How to Take Screenshots

1. Open `https://mianhassam96.github.io/MultiMian-ImageKit/`
2. Load a test image into the tool
3. Use browser DevTools → Device Toolbar for mobile screenshots
4. Use a screenshot tool or `Ctrl+Shift+P` → "Capture screenshot" in Chrome DevTools

## After Taking Screenshots

Add them to the README:

```markdown
## 📸 Screenshots

<div align="center">
<img src="screenshots/home.png" width="48%" alt="Home"> 
<img src="screenshots/compress.png" width="48%" alt="Compress">
<img src="screenshots/ocr.png" width="48%" alt="OCR">
<img src="screenshots/mobile.png" width="24%" alt="Mobile">
</div>
```

## Demo GIF

Use [LICEcap](https://www.cockos.com/licecap/), [Kap](https://getkap.co/) (macOS), or [ShareX](https://getsharex.com/) to record:

1. Drop an image onto the playground
2. Watch Smart Optimize run
3. Navigate to OCR and extract text
4. Show the download

Export at 800×500px, 15fps, under 5MB. Save as `demo.gif`.
