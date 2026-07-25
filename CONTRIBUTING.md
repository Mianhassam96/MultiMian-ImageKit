# Contributing to MultiMian ImageKit

Thank you for your interest in contributing! This guide will help you get started.

## Ways to Contribute

- 🐛 **Report bugs** — open an [Issue](https://github.com/Mianhassam96/MultiMian-ImageKit/issues)
- 💡 **Request features** — open an Issue with the `enhancement` label
- 🔧 **Submit a Pull Request** — fix a bug or add a feature
- 📖 **Improve documentation** — fix typos, clarify steps, add examples
- 🌐 **Translate** — help add OCR language support or UI translations

## Development Setup

No build tools needed. Just:

```bash
git clone https://github.com/Mianhassam96/MultiMian-ImageKit.git
cd MultiMian-ImageKit
# Open index.html in any modern browser
```

For PWA/SW testing use a local server:
```bash
npx serve .
# or
python -m http.server 8080
```

## Project Structure

- `index.html` — the entire SPA
- `script.js` — core tool implementations
- `phase2–6.js` — platform features (palette, PWA, dashboard, etc.)
- `crop.js` / `tools-sprint4.js` — newer tools
- `styles*.css` — all styles (no preprocessor)
- `tools/` — SEO landing pages

## Code Style

- Vanilla JS only — no frameworks, no build tools
- ES6+ (arrow functions, const/let, template literals, async/await)
- Follow existing naming conventions (`camelCase` for variables, `kebab-case` for CSS)
- Add comments for complex logic
- Keep tool implementations self-contained in their section of `script.js`

## Adding a New Tool

1. Add the tool section HTML to `index.html` (after the last `<section>` before About)
2. Add the tool logic to `script.js` or a new `tools-*.js` file
3. Add nav entries in the mega dropdown and mobile drawer
4. Add a home card to the tool categories grid
5. Update the tool count stat (`data-count="X"`)
6. Add to the Command Palette `COMMANDS` array in `phase2.js`
7. Add workflow suggestions in `phase2.js` `WorkflowEngine.SUGGESTIONS`
8. Add a landing page in `tools/your-tool.html`
9. Update `sitemap.xml`
10. Update `sw.js` cache version and file list if adding new files

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a clear description of what changed and why
- Test in Chrome, Firefox and mobile Safari if possible
- Do not commit `node_modules`, `.DS_Store`, or build artifacts

## Commit Message Format

```
type: short description

Types: feat | fix | docs | style | refactor | perf | test | chore
Examples:
  feat: add image blur tool
  fix: compress button respects WebP format selection
  docs: update contributing guide
```

## Questions?

Open an Issue or reach out at [mianhassam96@gmail.com](mailto:mianhassam96@gmail.com)
