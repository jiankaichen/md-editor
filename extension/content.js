(function () {
  const ct = document.contentType;
  if (ct !== 'text/plain' && ct !== 'text/markdown') return;

  const raw = document.querySelector('pre')?.textContent ?? document.body.textContent ?? '';
  if (!raw.trim()) return;

  const fileName = decodeURIComponent(location.pathname.split('/').pop() || 'document.md');
  document.title = fileName;

  document.head.querySelectorAll('link[rel="stylesheet"], style').forEach(el => el.remove());

  const viewerCss = document.createElement('link');
  viewerCss.rel = 'stylesheet';
  viewerCss.href = chrome.runtime.getURL('viewer.css');
  document.head.appendChild(viewerCss);

  const hljsTheme = document.createElement('link');
  hljsTheme.rel = 'stylesheet';
  hljsTheme.id = 'hljs-theme';
  document.head.appendChild(hljsTheme);

  document.body.innerHTML = `
    <div id="app">
      <div id="toolbar">
        <h1>MD Editor</h1>
        <span id="file-name"></span>
        <button class="btn" id="toc-btn">TOC</button>
        <button class="btn" id="theme-btn" title="Toggle dark mode">&#9680;</button>
        <span id="debug-status" style="font-size:12px;color:#f85149;margin-left:4px;"></span>
      </div>
      <div id="main">
        <nav id="toc-panel" class="hidden">
          <h2>Contents</h2>
          <ul id="toc-list"></ul>
        </nav>
        <div id="split">
          <div id="preview-pane">
            <div id="content-wrap">
              <div id="content">
                <div id="markdown-output"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById('file-name').textContent = fileName;

  initViewerCore();
  marked.use({ gfm: true });

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  let darkMode = prefersDark.matches;

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    hljsTheme.href = chrome.runtime.getURL(darkMode ? 'vendor/github-dark.min.css' : 'vendor/github.min.css');
    setMermaidTheme(darkMode);
  }

  applyTheme();
  prefersDark.addEventListener('change', e => { darkMode = e.matches; applyTheme(); });
  document.getElementById('theme-btn').addEventListener('click', () => { darkMode = !darkMode; applyTheme(); });

  const tocPanel = document.getElementById('toc-panel');
  document.getElementById('toc-btn').addEventListener('click', () => tocPanel.classList.toggle('hidden'));

  render(raw);
})();
