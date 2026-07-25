# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (main branch) | ✅ |
| Older branches | ❌ |

## Privacy Architecture

MultiMian ImageKit is designed with privacy as a core principle:

- **No server uploads** — all image processing happens in the browser using the Canvas API, Tesseract.js, PDF.js and other client-side libraries
- **No telemetry** — no analytics, no tracking scripts, no cookies
- **No accounts** — no user data is collected or stored on any server
- **Local storage only** — preferences and recent workspace data are stored in the browser's `localStorage` and `sessionStorage`
- **Exception** — the Share Image tool uses the [ImgBB API](https://api.imgbb.com/) to upload images to ImgBB servers, but only when explicitly triggered by the user

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public GitHub Issue.

Instead, email directly: **mianhassam96@gmail.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

Response time: within 48 hours.
