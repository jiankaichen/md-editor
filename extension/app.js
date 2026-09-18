initViewerCore();

const fileInput   = document.getElementById('file-input');
const openBtn     = document.getElementById('open-btn');
const editBtn     = document.getElementById('edit-btn');
const saveBtn       = document.getElementById('save-btn');
const autosaveBtn   = document.getElementById('autosave-btn');
const autosaveStatus = document.getElementById('autosave-status');
const tocBtn        = document.getElementById('toc-btn');
const themeBtn    = document.getElementById('theme-btn');
const dropZone    = document.getElementById('drop-zone');
const fileLabel   = document.getElementById('file-name');
const tocPanel    = document.getElementById('toc-panel');
const hljsTheme   = document.getElementById('hljs-theme');
const editorPane  = document.getElementById('editor-pane');
const previewPane = document.getElementById('preview-pane');
const editor      = document.getElementById('editor');

let currentFileName = '';
let editMode = false;

// ── Theme ─────────────────────────────────────────────────────────────────
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
let darkMode = prefersDark.matches;

function applyTheme() {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  hljsTheme.href = darkMode ? 'vendor/github-dark.min.css' : 'vendor/github.min.css';
  setMermaidTheme(darkMode);
}

applyTheme();
prefersDark.addEventListener('change', e => { darkMode = e.matches; applyTheme(); });
themeBtn.addEventListener('click', () => { darkMode = !darkMode; applyTheme(); });

// ── Marked setup ──────────────────────────────────────────────────────────
marked.use({ gfm: true });

// ── File open ─────────────────────────────────────────────────────────────
openBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => { if (e.target.files[0]) loadFile(e.target.files[0]); });

// ── Drag & drop ───────────────────────────────────────────────────────────
let dragDepth = 0;

document.addEventListener('dragenter', e => {
  e.preventDefault();
  dragDepth++;
  dropZone.classList.add('drag-over');
});
document.addEventListener('dragleave', () => {
  dragDepth--;
  if (dragDepth === 0) dropZone.classList.remove('drag-over');
});
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
  e.preventDefault();
  dragDepth = 0;
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});

// ── Edit mode toggle ──────────────────────────────────────────────────────
editBtn.addEventListener('click', () => {
  editMode = !editMode;
  editBtn.textContent = editMode ? 'Read' : 'Edit';
  editBtn.classList.toggle('active', editMode);
  editorPane.classList.toggle('visible', editMode);
  previewPane.classList.toggle('split', editMode);
  tocPanel.classList.add('hidden');
  if (editMode) {
    editor.value = editor.dataset.source || '';
    editor.focus();
  }
});

// Live preview while editing
let renderTimer = null;
editor.addEventListener('input', () => {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => renderPreview(editor.value), 150);
});

async function renderPreview(text) {
  try {
    const html = marked.parse(text);
    await applyOutput(html);
    editor.dataset.source = text;
  } catch (err) {
    dbg('ERROR: ' + err.message);
  }
}

// ── Save ──────────────────────────────────────────────────────────────────
saveBtn.addEventListener('click', () => {
  const text = editMode ? editor.value : editor.dataset.source;
  const blob = new Blob([text], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = currentFileName || 'document.md';
  a.click();
  URL.revokeObjectURL(a.href);
});

// ── Auto-save ─────────────────────────────────────────────────────────────
let autoSaveEnabled = false;
let autoSaveTimer   = null;
let statusClearTimer = null;

function doAutoSave() {
  if (!currentFileName) return;
  const text = editor.value;
  try {
    localStorage.setItem('autosave:' + currentFileName, text);
    autosaveStatus.textContent = 'Saved ' + new Date().toLocaleTimeString();
    clearTimeout(statusClearTimer);
    statusClearTimer = setTimeout(() => { autosaveStatus.textContent = ''; }, 3000);
  } catch (e) {
    autosaveStatus.textContent = 'Save failed';
  }
}

function setAutoSave(enabled) {
  autoSaveEnabled = enabled;
  autosaveBtn.textContent = 'Auto-save: ' + (enabled ? 'On' : 'Off');
  autosaveBtn.classList.toggle('active', enabled);
  clearInterval(autoSaveTimer);
  if (enabled) {
    autoSaveTimer = setInterval(doAutoSave, 10000);
    doAutoSave();
  } else {
    autosaveStatus.textContent = '';
  }
}

autosaveBtn.addEventListener('click', () => setAutoSave(!autoSaveEnabled));

// ── TOC toggle ────────────────────────────────────────────────────────────
tocBtn.addEventListener('click', () => tocPanel.classList.toggle('hidden'));

// ── Load file ─────────────────────────────────────────────────────────────
function loadFile(file) {
  const reader = new FileReader();
  reader.onerror = () => dbg('ERROR: FileReader failed');
  reader.onload = e => {
    const text = e.target.result;
    currentFileName = file.name;
    const draft = localStorage.getItem('autosave:' + file.name);
    const content = draft || text;
    editor.dataset.source = content;
    editor.value = content;
    fileLabel.textContent = file.name + (draft ? ' (draft restored)' : '');
    editBtn.disabled = false;
    saveBtn.disabled = false;
    autosaveBtn.disabled = false;
    render(content);
  };
  reader.readAsText(file);
}

// ── Divider drag-to-resize ────────────────────────────────────────────────
const divider  = document.getElementById('divider');
const splitEl  = document.getElementById('split');

divider.addEventListener('mousedown', e => {
  e.preventDefault();
  divider.classList.add('dragging');
  const startX     = e.clientX;
  const startWidth = editorPane.getBoundingClientRect().width;

  function onMove(e) {
    const delta    = e.clientX - startX;
    const total    = splitEl.getBoundingClientRect().width;
    const newWidth = Math.min(Math.max(startWidth + delta, 120), total - 120);
    editorPane.style.width = newWidth + 'px';
  }

  function onUp() {
    divider.classList.remove('dragging');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
});
