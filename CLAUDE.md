# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

No build step. Open `index.html` directly in a browser:
- Double-click `index.html`, or
- Serve locally: `npx serve .` or `python -m http.server`

There are no tests, no package manager, and no dependencies to install.

## Architecture

The entire application is a single file: `index.html`. It contains inline CSS and JavaScript with no module system.

**CDN dependencies** (loaded at runtime, no local copies):
- `marked@9` — Markdown → HTML parsing (GFM mode)
- `highlight.js 11.9.0` — syntax highlighting for fenced code blocks
- `mermaid@11` — diagram rendering for ` ```mermaid ` blocks

**Key state variables** (all global in the script):
- `currentFileName` — name of the open file
- `editMode` — whether the split editor pane is visible
- `autoSaveEnabled` / `autoSaveTimer` — auto-save state (saves to `localStorage` keyed by filename)
- `scrollObserver` — IntersectionObserver instance for TOC active-heading tracking

**Rendering pipeline:**
1. `loadFile(file)` — reads via FileReader, checks localStorage for a draft, calls `render(text)`
2. `render(text)` → `marked.parse()` → `applyOutput(html)` → builds TOC, scrolls to top
3. `renderPreview(text)` — same as render but used during live editing (150 ms debounce)
4. `applyOutput(html)` — sets innerHTML, assigns heading IDs, adds list-toggle chevrons, runs hljs, renders mermaid blocks

**Mermaid diagrams** replace `<pre><code class="language-mermaid">` elements with a `.mermaid-diagram` div that supports pan (drag) and zoom (scroll wheel or buttons). The source is stored in `div.dataset.mermaidSource` so diagrams can be re-rendered on theme switch.

**Layout modes:**
- Read-only (default): only `#preview-pane` visible
- Edit mode: `#editor-pane` slides in on the left, `#preview-pane` gets class `split`, a draggable `#divider` appears for resizing

**Theme:** toggled by `data-theme` attribute on `<html>`. Follows OS `prefers-color-scheme` on load; manual toggle available. Theme switch also re-initializes mermaid and re-renders all diagrams.

**Auto-save:** saves editor content to `localStorage['autosave:<filename>']` every 10 seconds when enabled. Draft is restored automatically on next file open.
