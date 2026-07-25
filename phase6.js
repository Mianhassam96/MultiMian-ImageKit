// ══════════════════════════════════════════════════════════════
// MultiMian ImageKit — Phase 6
// P3: Home Dashboard · P4: Super Search · P5: Analytics
// ══════════════════════════════════════════════════════════════

// ── P3: WORKSPACE DASHBOARD ──────────────────────────────────
const WorkspaceDashboard = (() => {

  const TIPS = [
    'Press <kbd>Ctrl+K</kbd> to instantly search any tool by name, keyword or description.',
    'Use <kbd>1–9</kbd> number keys to jump straight to any tool without touching the mouse.',
    'After compressing, click <strong>🌐 Share</strong> to get a permanent public link instantly.',
    'The <strong>Universal Export Pack</strong> gives you 9 social sizes + WebP + favicon in one click.',
    'Enable <strong>PWA Install</strong> to use all 16 tools offline — no internet needed.',
    'The <strong>Smart Optimize</strong> button analyzes, compresses, and converts any image automatically.',
    'In <strong>Screenshot Studio</strong>, pick a Preset Scene to get professional results in one click.',
    'The <strong>Batch Queue</strong> on the home page lets you compress or convert multiple images at once.',
    'Try <strong>Image → GIF</strong> to turn a sequence of screenshots into an animated walkthrough.',
    'Use <strong>Crop Image</strong> with ratio 4:5 for the ideal Instagram portrait size.',
    '<strong>PDF → Image</strong> supports up to 3× scale for high-resolution page exports.',
    'The <strong>Favicon Generator</strong> includes an HTML snippet — paste it straight into your &lt;head&gt;.',
  ];

  let tipIdx = 0;

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return '👋 Good morning';
    if (h < 17) return '👋 Good afternoon';
    return '👋 Good evening';
  }

  function renderGreeting() {
    const el = document.getElementById('wdGreeting');
    if (el) el.textContent = getGreeting();
  }

  function renderTip(idx) {
    const el = document.getElementById('wdTipText');
    if (el) el.innerHTML = TIPS[idx % TIPS.length];
  }

  function initTips() {
    tipIdx = Math.floor(Math.random() * TIPS.length);
    renderTip(tipIdx);
    document.getElementById('wdTipNext')?.addEventListener('click', () => {
      tipIdx = (tipIdx + 1) % TIPS.length;
      renderTip(tipIdx);
    });
  }

  function renderContinueEditing() {
    const list = document.getElementById('wdContinueList');
    if (!list) return;
    try {
      const recent = JSON.parse(localStorage.getItem('ik_recent_v2') || '[]');
      if (!recent.length) return;
      list.innerHTML = recent.slice(0, 4).map(item => `
        <button class="wd-continue-item" data-tab="${item.tool || 'compress'}">
          ${item.thumb ? `<img src="${item.thumb}" alt="${item.name}" class="wdc-thumb">` : '<span class="wdc-thumb-placeholder">🖼</span>'}
          <div class="wdc-info">
            <span class="wdc-name">${item.name.length > 22 ? item.name.slice(0, 22) + '…' : item.name}</span>
            <span class="wdc-meta">${item.tool || 'compress'} · ${timeAgo(item.ts)}</span>
          </div>
          <span class="wdc-arrow">→</span>
        </button>
      `).join('');
      list.querySelectorAll('.wd-continue-item').forEach(btn => {
        btn.addEventListener('click', () => {
          if (typeof activateTab === 'function') activateTab(btn.dataset.tab);
        });
      });
    } catch {}
  }

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }

  function renderStats() {
    try {
      const d = JSON.parse(localStorage.getItem('ik_achievements_v1') || '{}');
      const todayKey = new Date().toDateString();
      const todayStats = JSON.parse(sessionStorage.getItem('ik_today_stats') || '{}');

      const filesEl   = document.getElementById('wdStatFiles');
      const mbEl      = document.getElementById('wdStatMb');
      const exportsEl = document.getElementById('wdStatExports');
      const streakEl  = document.getElementById('wdStatStreak');

      if (filesEl)   filesEl.textContent   = todayStats.files   || sessionStorage.getItem('ik_session_count') || 0;
      if (mbEl)      mbEl.textContent      = parseFloat(d.mbSaved || 0).toFixed(1);
      if (exportsEl) exportsEl.textContent = d.exports || 0;
      if (streakEl)  streakEl.textContent  = d.streak  || 0;

      // Favorite tool from tab visit history
      const visits = d.tabVisits || {};
      const fav = Object.entries(visits).sort((a, b) => b[1] - a[1])[0];
      if (fav && fav[1] > 0) {
        const favEl = document.getElementById('wdFavTool');
        const favVal = document.getElementById('wdFavToolVal');
        if (favEl && favVal) { favEl.style.display = 'flex'; favVal.textContent = fav[0]; }
      }
    } catch {}
  }

  function initQuickActions() {
    document.getElementById('wdQaSmartOpt')?.addEventListener('click', () => {
      const modal = document.getElementById('soModal');
      if (modal) modal.style.display = 'flex';
    });
    document.getElementById('wdQaOpenRecent')?.addEventListener('click', () => {
      const section = document.getElementById('recentWorkspace');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('wdQaUniversalExport')?.addEventListener('click', () => {
      const uepDrop = document.getElementById('uepDrop');
      if (uepDrop) uepDrop.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.getElementById('wdQaCmdPalette')?.addEventListener('click', () => {
      document.getElementById('cmdPaletteBtn')?.click();
    });

    // Popular tool buttons
    document.querySelectorAll('.wd-popular-item[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof activateTab === 'function') activateTab(btn.dataset.tab);
      });
    });
  }

  function init() {
    renderGreeting();
    renderContinueEditing();
    renderStats();
    initTips();
    initQuickActions();
  }

  // Re-render continue editing when home is shown
  function refresh() {
    renderContinueEditing();
    renderStats();
  }

  return { init, refresh };
})();


// ── P4: SUPER SEARCH ─────────────────────────────────────────
// Upgrades the existing Command Palette with richer search data
const SuperSearch = (() => {

  // Extended command data with aliases, categories, keywords
  const EXTENDED = {
    'compress': {
      aliases: ['shrink','reduce','optimize','smaller','jpg','png','webp','file size'],
      category: 'Image Tools', shortcut: '3'
    },
    'resize': {
      aliases: ['scale','dimensions','width','height','instagram','youtube','twitter','social'],
      category: 'Image Tools', shortcut: '4'
    },
    'crop': {
      aliases: ['trim','cut','square','ratio','portrait','landscape','1:1','16:9'],
      category: 'Image Tools', shortcut: '9'
    },
    'convert': {
      aliases: ['format','jpg to png','png to jpg','webp','change format','export'],
      category: 'Image Tools', shortcut: '5'
    },
    'watermark': {
      aliases: ['protect','copyright','brand','text overlay','stamp'],
      category: 'Image Tools', shortcut: '6'
    },
    'screenshot': {
      aliases: ['beautify','frame','macos','browser','shadow','gradient','studio'],
      category: 'Image Tools', shortcut: '1'
    },
    'merge': {
      aliases: ['combine','collage','side by side','stacked','join'],
      category: 'Image Tools', shortcut: '7'
    },
    'ocr': {
      aliases: ['text','extract','scan','read','document','arabic','urdu','hindi','language'],
      category: 'Extract & Convert', shortcut: '2'
    },
    'share': {
      aliases: ['link','url','qr','imgbb','whatsapp','telegram','twitter'],
      category: 'Image Tools', shortcut: '8'
    },
    'pdf': {
      aliases: ['write','document','editor','txt','rtf','docx','word'],
      category: 'PDF Tools', shortcut: ''
    },
    'pdf2img': {
      aliases: ['pdf','pages','render','page image','screenshot pdf'],
      category: 'PDF Tools', shortcut: ''
    },
    'gif': {
      aliases: ['animate','frames','animation','loop'],
      category: 'Media Tools', shortcut: ''
    },
    'videogif': {
      aliases: ['video','mp4','webm','clip','trim','pingpong'],
      category: 'Media Tools', shortcut: ''
    },
    'sticker': {
      aliases: ['512','whatsapp','telegram','discord','emoji'],
      category: 'Media Tools', shortcut: ''
    },
    'favicon': {
      aliases: ['icon','ico','pwa','manifest','website icon','32x32','192x192'],
      category: 'Utilities', shortcut: ''
    },
    'passport': {
      aliases: ['id photo','visa','uk','us','india','pakistan','35x45','print'],
      category: 'Utilities', shortcut: ''
    },
  };

  // Patch the command palette's renderResults to use extended data
  function enhanceResults() {
    const input = document.getElementById('cmdInput');
    if (!input) return;

    // Intercept input events by wrapping the existing listener
    const origInput = input.oninput;
    input.addEventListener('input', function() {
      // Let original palette handle first, then decorate with categories
      setTimeout(() => {
        const q = input.value.toLowerCase().trim();
        if (!q) return;

        // Annotate results with categories
        document.querySelectorAll('.cmd-result-item').forEach(item => {
          const tag = item.querySelector('.cmd-result-tag');
          if (!tag) return;
          const tabId = tag.textContent.trim();
          const ext = EXTENDED[tabId];
          if (ext && ext.category) {
            let catEl = item.querySelector('.cmd-result-category');
            if (!catEl) {
              catEl = document.createElement('span');
              catEl.className = 'cmd-result-category';
              item.insertBefore(catEl, tag);
            }
            catEl.textContent = ext.category;
          }
          if (ext && ext.shortcut) {
            let kbdEl = item.querySelector('.cmd-result-kbd');
            if (!kbdEl) {
              kbdEl = document.createElement('kbd');
              kbdEl.className = 'cmd-result-kbd';
              kbdEl.textContent = ext.shortcut;
              item.appendChild(kbdEl);
            }
          }
        });
      }, 10);
    });
  }

  // Direct tab activation for unambiguous searches
  function setupDirectOpen() {
    const input = document.getElementById('cmdInput');
    if (!input) return;
    input.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const q = input.value.toLowerCase().trim();
      // Check direct match
      for (const [tabId, data] of Object.entries(EXTENDED)) {
        if (data.aliases.includes(q)) {
          document.getElementById('cmdPalette').style.display = 'none';
          if (typeof activateTab === 'function') activateTab(tabId);
          return;
        }
      }
    });
  }

  function init() {
    setTimeout(() => {
      enhanceResults();
      setupDirectOpen();
    }, 1000);
  }

  return { init };
})();


// ── P5: ANALYTICS DASHBOARD ───────────────────────────────────
const AnalyticsDashboard = (() => {

  const KEY_ACH  = 'ik_achievements_v1';
  const KEY_SESS = 'ik_session_start';
  const KEY_FMT  = 'ik_export_formats';

  function getSessionTime() {
    const start = parseInt(sessionStorage.getItem(KEY_SESS) || Date.now());
    const mins = Math.round((Date.now() - start) / 60000);
    if (mins < 1)   return '< 1 min';
    if (mins < 60)  return mins + ' min';
    return Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm';
  }

  function recordExportFormat(mime) {
    try {
      const d = JSON.parse(localStorage.getItem(KEY_FMT) || '{}');
      const ext = mime.split('/')[1] || mime;
      d[ext] = (d[ext] || 0) + 1;
      localStorage.setItem(KEY_FMT, JSON.stringify(d));
    } catch {}
  }

  function getTopFormat() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY_FMT) || '{}');
      const entries = Object.entries(d).sort((a, b) => b[1] - a[1]);
      return entries[0] ? entries[0][0].toUpperCase() : null;
    } catch { return null; }
  }

  function getStats() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY_ACH) || '{}');
      return {
        exports:  parseInt(d.exports   || 0),
        mbSaved:  parseFloat(d.mbSaved || 0),
        streak:   parseInt(d.streak    || 0),
        visits:   d.tabVisits          || {},
      };
    } catch { return { exports: 0, mbSaved: 0, streak: 0, visits: {} }; }
  }

  function getFavoriteTool(visits) {
    const entries = Object.entries(visits).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return null;
    const ICONS = {
      compress:'🗜', resize:'✂️', crop:'✂️', convert:'🔄',
      watermark:'💧', screenshot:'✨', ocr:'🔤', share:'🌐',
      merge:'🔗', pdf:'📝', pdf2img:'🖼', gif:'🎞',
      videogif:'🎬', sticker:'🎨', favicon:'🌐', passport:'🪪'
    };
    const tab = entries[0][0];
    return (ICONS[tab] || '🛠') + ' ' + tab;
  }

  function getAvgCompression() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY_ACH) || '{}');
      const mb = parseFloat(d.mbSaved || 0);
      const ex = parseInt(d.exports   || 0);
      if (!ex || !mb) return null;
      return (mb / ex * 1024).toFixed(0) + ' KB avg';
    } catch { return null; }
  }

  function getMilestone(stats) {
    if (stats.mbSaved >= 1024) return { icon: '🏆', text: 'Saved over 1 GB total!' };
    if (stats.mbSaved >= 100)  return { icon: '🎖', text: 'Saved over 100 MB!' };
    if (stats.exports >= 100)  return { icon: '⭐', text: '100+ files processed!' };
    if (stats.streak >= 7)     return { icon: '🔥', text: stats.streak + '-day streak!' };
    if (stats.exports >= 10)   return { icon: '🎉', text: 'First 10 exports done!' };
    return null;
  }

  function renderAnalyticsPanel() {
    const panel = document.getElementById('analyticsPanel');
    if (!panel) return;

    const stats = getStats();
    const fav   = getFavoriteTool(stats.visits);
    const fmt   = getTopFormat();
    const avg   = getAvgCompression();
    const milestone = getMilestone(stats);
    const session   = sessionStorage.getItem('ik_session_count') || 0;

    panel.innerHTML = `
      <div class="ap-header">
        <span class="ap-icon">📊</span>
        <span class="ap-title">Your Analytics</span>
        ${milestone ? `<span class="ap-milestone">${milestone.icon} ${milestone.text}</span>` : ''}
      </div>
      <div class="ap-grid">
        <div class="ap-stat">
          <div class="ap-stat-val">${stats.exports}</div>
          <div class="ap-stat-lbl">Total Exports</div>
        </div>
        <div class="ap-stat">
          <div class="ap-stat-val">${stats.mbSaved > 0 ? stats.mbSaved.toFixed(1) : '0'}</div>
          <div class="ap-stat-lbl">MB Saved</div>
        </div>
        <div class="ap-stat">
          <div class="ap-stat-val">${stats.streak}</div>
          <div class="ap-stat-lbl">Day Streak 🔥</div>
        </div>
        <div class="ap-stat">
          <div class="ap-stat-val">${session}</div>
          <div class="ap-stat-lbl">This Session</div>
        </div>
      </div>
      <div class="ap-details">
        ${fav ? `<div class="ap-detail"><span class="ap-detail-lbl">Favorite Tool</span><span class="ap-detail-val">${fav}</span></div>` : ''}
        ${fmt ? `<div class="ap-detail"><span class="ap-detail-lbl">Top Format</span><span class="ap-detail-val">${fmt}</span></div>` : ''}
        ${avg ? `<div class="ap-detail"><span class="ap-detail-lbl">Avg per Export</span><span class="ap-detail-val">${avg}</span></div>` : ''}
        <div class="ap-detail"><span class="ap-detail-lbl">Session Time</span><span class="ap-detail-val">${getSessionTime()}</span></div>
      </div>
      <div class="ap-mb-bar-wrap">
        <div class="ap-mb-bar-label">
          <span>Storage Saved</span>
          <strong>${stats.mbSaved.toFixed(1)} MB of 1 GB milestone</strong>
        </div>
        <div class="ap-mb-bar">
          <div class="ap-mb-fill" style="width:${Math.min(100, (stats.mbSaved / 1024) * 100).toFixed(1)}%"></div>
        </div>
      </div>
    `;

    // Re-render every 30 seconds while panel is visible
    setTimeout(() => { if (panel.closest('#tab-home')) renderAnalyticsPanel(); }, 30000);
  }

  function init() {
    // Record session start
    if (!sessionStorage.getItem(KEY_SESS)) {
      sessionStorage.setItem(KEY_SESS, Date.now().toString());
    }

    // Patch triggerDownload to record format
    const origTrigger = window.triggerDownload;
    if (origTrigger) {
      window.triggerDownload = function(url, filename) {
        origTrigger(url, filename);
        const ext = filename.split('.').pop() || 'jpg';
        recordExportFormat(ext);
        // Refresh today stats in dashboard
        setTimeout(() => WorkspaceDashboard.refresh(), 300);
      };
    }

    // Render analytics panel on home visit
    renderAnalyticsPanel();
  }

  return { init, renderAnalyticsPanel, recordExportFormat };
})();


// ── INIT ALL PHASE 6 SYSTEMS ──────────────────────────────────
function initPhase6() {
  WorkspaceDashboard.init();
  SuperSearch.init();
  AnalyticsDashboard.init();

  // Refresh dashboard when home tab is activated
  const origActivate = window.activateTab;
  if (origActivate) {
    window.activateTab = function(tabId) {
      origActivate(tabId);
      if (tabId === 'home') {
        WorkspaceDashboard.refresh();
        AnalyticsDashboard.renderAnalyticsPanel();
      }
    };
  }

  // Update session count from sessionStorage into dashboard stat
  setInterval(() => {
    const count = sessionStorage.getItem('ik_session_count') || '0';
    const el = document.getElementById('wdStatFiles');
    if (el) el.textContent = count;
  }, 5000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhase6);
} else {
  initPhase6();
}
