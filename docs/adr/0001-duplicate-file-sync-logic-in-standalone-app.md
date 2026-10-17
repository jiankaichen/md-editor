# Duplicate file-sync logic in the Standalone app

The Standalone app must stay a single `index.html` that can be copied anywhere and opened with no build step, as a fallback for machines where the extension can't be installed. So the Save / Auto-save / Conflict logic lives in `extension/file-sync.js` (the tested copy) and is pasted verbatim into `index.html`, rather than shared via a script include or a build step that inlines it. Any change to one copy must be made to the other.

## Considered Options

- **Build script that inlines the shared file into `index.html`**: rejected, breaks "no build step".
- **Standalone app loads `extension/*.js`**: rejected, it would no longer be a single portable file.
