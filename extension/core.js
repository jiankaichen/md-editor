// Shared rendering core. Call initViewerCore() once the viewer DOM
// (#markdown-output, #toc-panel, #toc-list, #content-wrap) exists.
const __els = {};

function initViewerCore() {
  __els.output      = document.getElementById('markdown-output');
  __els.tocPanel    = document.getElementById('toc-panel');
  __els.tocList     = document.getElementById('toc-list');
  __els.contentWrap = document.getElementById('content-wrap');
  __els.dropZone    = document.getElementById('drop-zone');
  __els.debug       = document.getElementById('debug-status');
  initTocResize();
}

// ── TOC drag-to-resize ────────────────────────────────────────────────────
const TOC_WIDTH_KEY = 'tocWidth';
const TOC_MIN_WIDTH = 0;

// localStorage can throw on some origins (file://, sandboxed pages); fail quietly.
function storageGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function storageSet(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} }

function initTocResize() {
  const { tocPanel } = __els;
  if (!tocPanel || document.getElementById('toc-divider')) return;

  const saved = parseInt(storageGet(TOC_WIDTH_KEY), 10);
  if (saved) tocPanel.style.setProperty('--toc-width', saved + 'px');

  const divider = document.createElement('div');
  divider.id = 'toc-divider';
  divider.title = 'Drag to resize';
  tocPanel.insertAdjacentElement('afterend', divider);

  divider.addEventListener('mousedown', e => {
    e.preventDefault();
    divider.classList.add('dragging');
    tocPanel.classList.add('resizing');
    const startX     = e.clientX;
    const startWidth = tocPanel.getBoundingClientRect().width;
    const maxWidth   = Math.max(TOC_MIN_WIDTH, window.innerWidth - 300);

    function onMove(e) {
      const w = Math.min(Math.max(startWidth + e.clientX - startX, TOC_MIN_WIDTH), maxWidth);
      tocPanel.style.setProperty('--toc-width', w + 'px');
    }
    function onUp() {
      divider.classList.remove('dragging');
      tocPanel.classList.remove('resizing');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      storageSet(TOC_WIDTH_KEY, Math.round(tocPanel.getBoundingClientRect().width));
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  divider.addEventListener('dblclick', () => {
    tocPanel.style.removeProperty('--toc-width');
    storageSet(TOC_WIDTH_KEY, null);
  });
}

function dbg(msg) { if (__els.debug) __els.debug.textContent = msg; }

function setMermaidTheme(dark) {
  mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default' });
  rerenderMermaid();
}

async function rerenderMermaid() {
  let idx = 0;
  for (const div of __els.output.querySelectorAll('.mermaid-diagram')) {
    const source = div.dataset.mermaidSource;
    if (!source) continue;
    const id = 'mermaid-rerender-' + (++idx) + '-' + Date.now();
    try {
      const { svg } = await mermaid.render(id, source);
      const inner = div.querySelector('.mermaid-inner');
      inner.innerHTML = svg;
      const svgEl = inner.querySelector('svg');
      if (svgEl) {
        const vb = svgEl.viewBox?.baseVal;
        const svgW = parseFloat(svgEl.style.maxWidth) || vb?.width || parseFloat(svgEl.getAttribute('width')) || 400;
        const svgH = vb?.height || parseFloat(svgEl.getAttribute('height')) || 300;
        svgEl.setAttribute('width', svgW);
        svgEl.setAttribute('height', svgH);
        svgEl.style.maxWidth = 'none';
      }
    } catch (err) {
      console.error('mermaid rerender error', err);
    }
  }
}

function makeListsToggleable() {
  __els.output.querySelectorAll('li').forEach(li => {
    if (!li.querySelector(':scope > ul, :scope > ol')) return;
    li.classList.add('has-children');
    const toggle = document.createElement('span');
    toggle.className = 'li-toggle';
    toggle.textContent = '▼';
    toggle.addEventListener('click', e => {
      e.stopPropagation();
      const collapsed = li.classList.toggle('collapsed');
      toggle.textContent = collapsed ? '▶' : '▼';
    });
    li.prepend(toggle);
  });
}

async function applyOutput(html) {
  const output = __els.output;
  const contentWrap = __els.contentWrap;
  output.innerHTML = html;
  output.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
    h.id = h.textContent.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  });
  makeListsToggleable();
  output.querySelectorAll('pre code:not(.language-mermaid)').forEach(block => hljs.highlightElement(block));
  let mermaidIdx = 0;
  for (const block of output.querySelectorAll('code.language-mermaid')) {
    const pre = block.parentElement;
    const source = block.textContent;
    const id = 'mermaid-' + (++mermaidIdx) + '-' + Date.now();
    try {
      const { svg } = await mermaid.render(id, source);
      const div = document.createElement('div');
      div.className = 'mermaid-diagram';
      div.dataset.mermaidSource = source;
      const inner = document.createElement('div');
      inner.className = 'mermaid-inner';
      inner.innerHTML = svg;
      div.appendChild(inner);

      // Extract natural SVG dimensions — read BEFORE overriding anything
      const svgEl = inner.querySelector('svg');
      let svgW = 400, svgH = 300;
      if (svgEl) {
        const vb = svgEl.viewBox?.baseVal;
        svgW = parseFloat(svgEl.style.maxWidth) || (vb?.width) || parseFloat(svgEl.getAttribute('width')) || 400;
        svgH = (vb?.height) || parseFloat(svgEl.getAttribute('height')) || 300;
        svgEl.setAttribute('width', svgW);
        svgEl.setAttribute('height', svgH);
        svgEl.style.maxWidth = 'none';
      }

      pre.replaceWith(div);

      // Height: fill remaining visible area of preview panel
      const wrapRect = contentWrap.getBoundingClientRect();
      const divRect  = div.getBoundingClientRect();
      div.style.height = Math.max(200, wrapRect.bottom - divRect.top - 32) + 'px';

      makePannable(div, inner, svgW, svgH);
    } catch (err) {
      block.textContent = 'Mermaid error: ' + err.message;
    }
  }
}

async function render(text) {
  try {
    const html = marked.parse(text);
    await applyOutput(html);
    if (__els.dropZone) __els.dropZone.style.display = 'none';
    __els.output.style.display = 'block';
    dbg('');
    buildTOC();
    __els.contentWrap.scrollTop = 0;
  } catch (err) {
    dbg('ERROR: ' + err.message);
    console.error(err);
  }
}

// ── TOC ───────────────────────────────────────────────────────────────────
let scrollObserver = null;

function buildTOC() {
  const { output, tocPanel, tocList, contentWrap } = __els;
  const headings = [...output.querySelectorAll('h1, h2, h3, h4')];
  tocList.innerHTML = '';

  if (headings.length === 0) { tocPanel.classList.add('hidden'); return; }

  headings.forEach(h => {
    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    a.className = 'toc-' + h.tagName.toLowerCase();
    a.addEventListener('click', e => {
      e.preventDefault();
      h.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    li.appendChild(a);
    tocList.appendChild(li);
  });

  tocPanel.classList.remove('hidden');

  if (scrollObserver) scrollObserver.disconnect();
  scrollObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting);
    if (!visible.length) return;
    const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    tocList.querySelectorAll('a').forEach(a => a.classList.remove('active'));
    const link = tocList.querySelector(`a[href="#${top.target.id}"]`);
    if (link) link.classList.add('active');
  }, { root: contentWrap, rootMargin: '-10% 0px -80% 0px' });

  headings.forEach(h => scrollObserver.observe(h));
}

// ── Mermaid diagram pan + zoom ────────────────────────────────────────────
function makePannable(container, inner, svgW, svgH) {
  let scale = 1, tx = 0, ty = 0;
  let isPanning = false, startX, startY, startTx, startTy;

  function applyTransform() {
    inner.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
  }

  function autoFit() {
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    scale = Math.min(cw / svgW, ch / svgH);
    tx = (cw - svgW * scale) / 2;
    ty = (ch - svgH * scale) / 2;
    applyTransform();
  }

  function zoomBy(delta) {
    const cx = container.clientWidth / 2;
    const cy = container.clientHeight / 2;
    const newScale = Math.max(0.05, Math.min(20, scale * delta));
    tx = cx - (cx - tx) * (newScale / scale);
    ty = cy - (cy - ty) * (newScale / scale);
    scale = newScale;
    applyTransform();
  }

  const controls = document.createElement('div');
  controls.className = 'mermaid-controls';
  controls.innerHTML = `
    <button title="Auto-fit" data-action="fit">&#x2922;</button>
    <button title="Enlarge"  data-action="in">+</button>
    <button title="Shrink"   data-action="out">−</button>
  `;
  controls.addEventListener('mousedown', e => e.stopPropagation());
  controls.addEventListener('click', e => {
    const action = e.target.closest('button')?.dataset.action;
    if (action === 'fit') autoFit();
    if (action === 'in')  zoomBy(1.25);
    if (action === 'out') zoomBy(0.8);
  });
  container.appendChild(controls);

  requestAnimationFrame(autoFit);

  container.addEventListener('wheel', e => {
    e.preventDefault();
    const rect  = container.getBoundingClientRect();
    const mx    = e.clientX - rect.left;
    const my    = e.clientY - rect.top;
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.05, Math.min(20, scale * delta));
    tx = mx - (mx - tx) * (newScale / scale);
    ty = my - (my - ty) * (newScale / scale);
    scale = newScale;
    applyTransform();
  }, { passive: false });

  container.addEventListener('mousedown', e => {
    isPanning = true;
    container.classList.add('panning');
    startX = e.clientX; startY = e.clientY;
    startTx = tx;       startTy = ty;
  });

  window.addEventListener('mousemove', e => {
    if (!isPanning) return;
    tx = startTx + (e.clientX - startX);
    ty = startTy + (e.clientY - startY);
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    isPanning = false;
    container.classList.remove('panning');
  });
}
