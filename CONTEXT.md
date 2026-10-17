# MD Editor

A Markdown reader and editor for Chrome, shipped as an extension and as a standalone web page. It opens local `.md` files, renders them with a TOC and diagrams, and lets the user edit and write changes back to the original file.

## Language

### Surfaces

**Editor tab**:
The extension page, opened from the toolbar icon, where a file can be opened, edited, and saved.
_Avoid_: app, popup, editor page

**In-place viewer**:
The extension rendering a `.md` URL directly in the tab the user navigated to; read-only.
_Avoid_: content script view, reader

**Standalone app**:
The single-file web page (`index.html` at the repo root), kept as the fallback for machines where the extension can't be installed.
_Avoid_: web version, MD Editor (unqualified)

### Saving

**Save**:
Writing the current editor content back to the original file on disk, replacing its contents.
_Avoid_: download, export

**Save as**:
Save to a new file the user picks, which then becomes the open file.
_Avoid_: export, download

**Auto-save**:
Save performed automatically while editing, without the user pressing Save.
_Avoid_: draft save, backup

**Unsaved changes**:
Edits in the editor that differ from what the last Save (or opening the file) put on disk.
_Avoid_: dirty, pending edits, draft

**External change**:
A change to the file on disk made by something other than MD Editor since it was opened or last saved.
_Avoid_: conflict (that's only when there are also unsaved changes), outside edit

**Conflict**:
An external change that happens while there are unsaved changes, so one side would be lost.
_Avoid_: collision, merge
