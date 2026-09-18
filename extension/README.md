# MD Editor — Chrome Extension

Chrome extension version of the single-file MD Editor. Two ways to use it:

1. **Toolbar icon** — click the extension icon to open the full editor in a new tab (open/drag-drop files, split-pane editing, save, auto-save, TOC, dark mode, mermaid diagrams).
2. **Auto-render `.md` files** — navigate Chrome to any `.md`/`.markdown` file (local `file://` or a web URL served as plain text) and it renders in place with TOC and theme toggle.

## Install (unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select this `extension/` folder

### Enable local file rendering

To auto-render local `.md` files (`file://` URLs):

1. On `chrome://extensions`, click **Details** on MD Editor
2. Enable **Allow access to file URLs**

## Files

| File | Purpose |
|---|---|
| `manifest.json` | MV3 manifest |
| `background.js` | Opens the editor tab when the toolbar icon is clicked |
| `index.html` + `app.js` | Full editor (same features as the original single-file app) |
| `content.js` | In-place read-only viewer for `.md` pages |
| `core.js` | Shared rendering: markdown → HTML, TOC, syntax highlighting, mermaid pan/zoom |
| `viewer.css` | Shared styles (light/dark via `data-theme`) |
| `vendor/` | Locally bundled marked, highlight.js, mermaid, hljs themes (MV3 CSP blocks CDN scripts) |

## Notes

- Vendor libraries are bundled locally because Manifest V3's content security policy forbids loading remote scripts.
- Auto-save drafts go to the extension page's `localStorage` (`autosave:<filename>`), separate from the original app's storage.
- The in-place viewer only activates on pages served as `text/plain` or `text/markdown` whose URL ends in `.md`/`.markdown`/`.mdown`.
