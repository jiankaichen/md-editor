# MD Editor — Requirements

## Overview
A lightweight, browser-based Markdown reader that lets users open and read `.md` files with a clean, readable interface.

## Functional Requirements

### File Handling
- [ ] Open `.md` / `.markdown` / `.txt` files via file picker button
- [ ] Drag-and-drop file onto the app to open
- [ ] Display the current file name in the toolbar

### Rendering
- [ ] Render Markdown to HTML (headings, lists, blockquotes, links, images, tables, task lists, horizontal rules)
- [ ] GitHub Flavored Markdown (GFM) support
- [ ] Syntax highlighting for fenced code blocks (JS, TS, Python, Bash, JSON, CSS, HTML, SQL at minimum)

### Navigation
- [ ] Table of Contents (TOC) sidebar auto-generated from headings
- [ ] TOC toggle button to show/hide the sidebar
- [ ] Clicking a TOC entry scrolls smoothly to the heading
- [ ] Active heading highlighted in TOC as user scrolls

### Appearance
- [ ] Light and dark mode (follows OS preference via `prefers-color-scheme`)
- [ ] Readable typography with comfortable line height and max content width
- [ ] Responsive layout that works at various window sizes

## Non-Functional Requirements
- No build step — single `index.html` file, runs by opening in any modern browser
- No backend or server required
- CDN-hosted dependencies only (marked.js, highlight.js)

## Out of Scope
- Editing / saving files
- Multiple tabs or file history
- Exporting to PDF or other formats
- Plugin system
