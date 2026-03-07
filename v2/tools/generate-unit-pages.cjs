/**
 * Generate per-unit HTML index pages for grades 6–9.
 * Output: v2/units/g{grade}-u{unit}.html
 * Run: node v2/tools/generate-unit-pages.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'units');
const LECTURES_DIR = path.join(ROOT, 'data', 'voice-lectures');

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/nmnhut-it/english-learning-app/main/v2/data/voice-lectures';
const GITHUB_PAGES_VIEWER = 'https://nmnhut-it.github.io/english-learning-app/v2/voice-lecture-viewer-v2.html';

// Standard sections for grades 6-9
const STANDARD_SECTIONS = [
  { key: 'getting-started', label: 'GS', name: 'Getting Started' },
  { key: 'a-closer-look-1', label: 'AC1', name: 'A Closer Look 1' },
  { key: 'a-closer-look-2', label: 'AC2', name: 'A Closer Look 2' },
  { key: 'communication', label: 'CM', name: 'Communication' },
  { key: 'skills-1', label: 'S1', name: 'Skills 1' },
  { key: 'skills-2', label: 'S2', name: 'Skills 2' },
  { key: 'looking-back', label: 'LB', name: 'Looking Back' },
];

const REVIEW_SECTIONS = [
  { key: 'language', label: 'Language', name: 'Language' },
  { key: 'skills', label: 'Skills', name: 'Skills' },
];

// All units for grades 6-9
const GRADE_DATA = {
  6: {
    name: 'Lớp 6',
    units: [
      { num: 1,  title: 'My New School' },
      { num: 2,  title: 'My House' },
      { num: 3,  title: 'My Friends' },
      { num: 4,  title: 'My Neighbourhood' },
      { num: 5,  title: 'Natural Wonders of the World' },
      { num: 6,  title: 'Our Tet Holiday' },
      { num: 7,  title: 'Television' },
      { num: 8,  title: 'Sports and Games' },
      { num: 9,  title: 'Cities of the World' },
      { num: 10, title: 'Our Houses in the Future' },
      { num: 11, title: 'Our Greener World' },
      { num: 12, title: 'Robots' },
    ],
    reviews: [
      { num: 1, title: 'Review 1 (Units 1–3)', units: '1-3' },
      { num: 2, title: 'Review 2 (Units 4–6)', units: '4-6' },
      { num: 3, title: 'Review 3 (Units 7–9)', units: '7-9' },
      { num: 4, title: 'Review 4 (Units 10–12)', units: '10-12' },
    ],
  },
  7: {
    name: 'Lớp 7',
    units: [
      { num: 1,  title: 'Hobbies' },
      { num: 2,  title: 'Health' },
      { num: 3,  title: 'Community Service' },
      { num: 4,  title: 'Music and Arts' },
      { num: 5,  title: 'Food and Drink' },
      { num: 6,  title: 'A Visit to a School' },
      { num: 7,  title: 'Traffic' },
      { num: 8,  title: 'Films' },
      { num: 9,  title: 'Festivals Around the World' },
      { num: 10, title: 'Energy Sources' },
      { num: 11, title: 'Travelling in the Future' },
      { num: 12, title: 'English-speaking Countries' },
    ],
    reviews: [
      { num: 1, title: 'Review 1 (Units 1–3)', units: '1-3' },
      { num: 2, title: 'Review 2 (Units 4–6)', units: '4-6' },
      { num: 3, title: 'Review 3 (Units 7–9)', units: '7-9' },
      { num: 4, title: 'Review 4 (Units 10–12)', units: '10-12' },
    ],
  },
  8: {
    name: 'Lớp 8',
    units: [
      { num: 1,  title: 'Leisure Activities' },
      { num: 2,  title: 'Life in the Countryside' },
      { num: 3,  title: 'Peoples of Viet Nam' },
      { num: 4,  title: 'Our Customs and Traditions' },
      { num: 5,  title: 'Festivals in Viet Nam' },
      { num: 6,  title: 'Folk Tales' },
      { num: 7,  title: 'Pollution' },
      { num: 8,  title: 'English Speaking Countries' },
      { num: 9,  title: 'Natural Disasters' },
      { num: 10, title: 'Communication' },
      { num: 11, title: 'Science and Technology' },
      { num: 12, title: 'Life on Other Planets' },
    ],
    reviews: [
      { num: 1, title: 'Review 1 (Units 1–3)', units: '1-3' },
      { num: 2, title: 'Review 2 (Units 4–6)', units: '4-6' },
      { num: 3, title: 'Review 3 (Units 7–9)', units: '7-9' },
      { num: 4, title: 'Review 4 (Units 10–12)', units: '10-12' },
    ],
  },
  9: {
    name: 'Lớp 9',
    units: [
      { num: 1,  title: 'Local Community' },
      { num: 2,  title: 'City Life' },
      { num: 3,  title: 'Teen Stress and Pressure' },
      { num: 4,  title: 'Life in the Past' },
      { num: 5,  title: 'Wonders of Viet Nam' },
      { num: 6,  title: 'Viet Nam: Then and Now' },
      { num: 7,  title: 'Recipes and Eating Habits' },
      { num: 8,  title: 'Tourism' },
      { num: 9,  title: 'English in the World' },
      { num: 10, title: 'Space Travel' },
      { num: 11, title: 'Changing Roles in Society' },
      { num: 12, title: 'My Future Career' },
    ],
    reviews: [
      { num: 1, title: 'Review 1 (Units 1–3)', units: '1-3' },
      { num: 2, title: 'Review 2 (Units 4–6)', units: '4-6' },
      { num: 3, title: 'Review 3 (Units 7–9)', units: '7-9' },
      { num: 4, title: 'Review 4 (Units 10–12)', units: '10-12' },
    ],
  },
};

function sectionExists(grade, unitPad, section) {
  const p = path.join(LECTURES_DIR, `g${grade}`, `unit-${unitPad}`, `${section}.md`);
  return fs.existsSync(p);
}

function reviewSectionExists(grade, reviewNum, section) {
  const p = path.join(LECTURES_DIR, `g${grade}`, `review-${reviewNum}`, `${section}.md`);
  return fs.existsSync(p);
}

const COPY_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;

function buildSectionButtons(sections) {
  return sections.map(s => {
    const disabled = s.disabled ? ' disabled' : '';
    const dataAttrs = Object.entries(s.data)
      .map(([k, v]) => `data-${k}="${v}"`)
      .join(' ');
    return `          <button class="section-btn${disabled}" ${dataAttrs}>${s.label}</button>`;
  }).join('\n');
}

function buildUnitHtml(grade, unit, gradeData) {
  const unitPad = String(unit.num).padStart(2, '0');
  const sections = STANDARD_SECTIONS.map(s => ({
    label: s.label,
    disabled: !sectionExists(grade, unitPad, s.key),
    data: { section: s.key, grade: String(grade), unit: String(unit.num) },
  }));

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${gradeData.name} - Unit ${unit.num}: ${unit.title}</title>
  ${commonStyle()}
</head>
<body>
  <header>
    <div class="grade-badge">${gradeData.name}</div>
    <h1>Unit ${unit.num}</h1>
    <p>${unit.title}</p>
  </header>

  <div class="container">
    ${settingsPanel()}
    ${warningBanner()}

    <div class="unit-card">
      <div class="unit-header">
        <span>Chọn bài học</span>
        <button class="copy-all-btn" onclick="copyAllLinks()">${COPY_ICON} Copy All</button>
      </div>
      <div class="sections" id="sections">
${buildSectionButtons(sections)}
      </div>
    </div>
  </div>

  <footer>Click = Mở bài | Giữ lâu = Copy link</footer>
  <div class="toast" id="toast"></div>

  <script>
    const GRADE = ${grade};
    const UNIT = ${unit.num};
    const GITHUB_RAW_BASE = '${GITHUB_RAW_BASE}';
    const GITHUB_PAGES_VIEWER = '${GITHUB_PAGES_VIEWER}';
    ${commonScript()}
  </script>
</body>
</html>`;
}

function buildReviewHtml(grade, review, gradeData) {
  const sections = REVIEW_SECTIONS.map(s => ({
    label: s.label,
    disabled: !reviewSectionExists(grade, review.num, s.key),
    data: { section: s.key, grade: String(grade), review: String(review.num) },
  }));

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${gradeData.name} - ${review.title}</title>
  ${commonStyle()}
</head>
<body>
  <header>
    <div class="grade-badge">${gradeData.name}</div>
    <h1>${review.title}</h1>
    <p>Ôn tập Units ${review.units}</p>
  </header>

  <div class="container">
    ${settingsPanel()}
    ${warningBanner()}

    <div class="unit-card">
      <div class="unit-header">
        <span>Chọn bài học</span>
        <button class="copy-all-btn" onclick="copyAllLinks()">${COPY_ICON} Copy All</button>
      </div>
      <div class="sections" id="sections">
${buildSectionButtons(sections)}
      </div>
    </div>
  </div>

  <footer>Click = Mở bài | Giữ lâu = Copy link</footer>
  <div class="toast" id="toast"></div>

  <script>
    const GRADE = ${grade};
    const GITHUB_RAW_BASE = '${GITHUB_RAW_BASE}';
    const GITHUB_PAGES_VIEWER = '${GITHUB_PAGES_VIEWER}';
    ${commonScript()}
  </script>
</body>
</html>`;
}

function commonStyle() {
  return `<style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{--primary:#0ea5e9;--primary-dark:#0284c7;--accent:#06b6d4;--bg:#f0f9ff;--card:#fff;--text:#0f172a;--muted:#64748b;--border:#e0f2fe;--radius:12px}
    body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:linear-gradient(180deg,#f0f9ff 0%,#e0f2fe 100%);color:var(--text);line-height:1.6;min-height:100vh;padding-bottom:env(safe-area-inset-bottom,20px)}
    header{background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#fff;padding:16px;padding-top:calc(16px + env(safe-area-inset-top,0));text-align:center;box-shadow:0 2px 12px rgba(14,165,233,.3)}
    .grade-badge{display:inline-block;background:rgba(255,255,255,.2);border-radius:20px;padding:2px 12px;font-size:.8rem;font-weight:600;margin-bottom:6px}
    header h1{font-size:1.4rem;font-weight:700;margin-bottom:2px}
    header p{font-size:.9rem;opacity:.9}
    .container{max-width:480px;margin:0 auto;padding:16px}
    .settings{background:var(--card);border-radius:var(--radius);margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid var(--border);overflow:hidden}
    .settings-header{display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;background:linear-gradient(135deg,#f0f9ff,#e0f2fe)}
    .settings-header svg{width:20px;height:20px;color:var(--primary)}
    .settings-header span{flex:1;font-weight:600;color:var(--primary-dark);font-size:.9rem}
    .settings-toggle{width:24px;height:24px;transition:transform .3s}
    .settings.open .settings-toggle{transform:rotate(180deg)}
    .settings-content{display:none;padding:16px;border-top:1px solid var(--border)}
    .settings.open .settings-content{display:block}
    .settings-row{margin-bottom:12px}
    .settings-row label{display:block;font-size:.85rem;color:var(--muted);margin-bottom:4px}
    .settings-row input{width:100%;padding:10px 12px;border:2px solid var(--border);border-radius:8px;font-size:.95rem}
    .settings-row input:focus{outline:none;border-color:var(--primary)}
    .settings-actions{display:flex;gap:10px;margin-top:16px}
    .btn{padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;transition:all .2s;border:none}
    .btn-primary{background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff}
    .btn-secondary{background:var(--bg);color:var(--primary-dark);border:2px solid var(--border)}
    .warning{background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fbbf24;border-radius:var(--radius);padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;font-size:.9rem;color:#92400e}
    .warning.hidden{display:none}
    .warning svg{width:20px;height:20px;flex-shrink:0;color:#f59e0b}
    .unit-card{background:var(--card);border-radius:var(--radius);padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid var(--border)}
    .unit-header{display:flex;align-items:center;font-weight:700;color:var(--primary-dark);margin-bottom:14px;font-size:.95rem}
    .copy-all-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:#fff;border:2px solid #10b981;border-radius:8px;font-size:.75rem;font-weight:600;color:#059669;cursor:pointer;margin-left:auto}
    .copy-all-btn svg{width:14px;height:14px}
    .sections{display:flex;flex-wrap:wrap;gap:10px}
    .section-btn{padding:12px 18px;background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:2px solid #bae6fd;border-radius:10px;font-weight:600;font-size:.9rem;color:#0369a1;cursor:pointer;transition:all .2s;user-select:none;-webkit-user-select:none;touch-action:manipulation;flex:1;min-width:80px;text-align:center}
    .section-btn:hover{border-color:#0ea5e9;background:linear-gradient(135deg,#e0f2fe,#bae6fd)}
    .section-btn:active{transform:scale(.97)}
    .section-btn.disabled{opacity:.35;cursor:not-allowed;pointer-events:none}
    .section-btn.pressing{animation:pressing .6s ease}
    @keyframes pressing{0%{box-shadow:0 0 0 0 rgba(14,165,233,.4)}100%{box-shadow:0 0 0 20px rgba(14,165,233,0)}}
    .toast{position:fixed;bottom:60px;left:50%;transform:translateX(-50%) translateY(100px);background:linear-gradient(135deg,#0c4a6e,#075985);color:#fff;padding:12px 24px;border-radius:50px;font-weight:500;z-index:1000;opacity:0;transition:all .3s}
    .toast.show{transform:translateX(-50%) translateY(0);opacity:1}
    footer{text-align:center;padding:20px 16px;color:var(--muted);font-size:.8rem}
  </style>`;
}

function settingsPanel() {
  return `<div class="settings" id="settings">
      <div class="settings-header" onclick="toggleSettings()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
        <span>Cài đặt Telegram</span>
        <svg class="settings-toggle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="settings-content">
        <div class="settings-row">
          <label>Bot Token</label>
          <input type="text" id="token" placeholder="123456:ABC-DEF..." autocomplete="off">
        </div>
        <div class="settings-row">
          <label>Chat ID</label>
          <input type="text" id="chat" placeholder="987654321" autocomplete="off">
        </div>
        <div class="settings-actions">
          <button class="btn btn-primary" onclick="saveSettings()">Lưu</button>
          <button class="btn btn-secondary" onclick="clearSettings()">Xóa</button>
        </div>
      </div>
    </div>`;
}

function warningBanner() {
  return `<div class="warning" id="warning">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>Chưa cài đặt Telegram - học sinh không gửi bài được</span>
    </div>`;
}

function commonScript() {
  return `
    const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname)
                 || location.hostname.startsWith('192.168')
                 || location.protocol === 'file:';

    let tgConfig = {
      token: localStorage.getItem('tg_token') || '',
      chat: localStorage.getItem('tg_chat') || ''
    };
    let pressTimer = null;
    let isLongPress = false;

    const SECTION_NAMES = {
      'getting-started': 'Getting Started',
      'a-closer-look-1': 'A Closer Look 1',
      'a-closer-look-2': 'A Closer Look 2',
      'communication': 'Communication',
      'skills-1': 'Skills 1',
      'skills-2': 'Skills 2',
      'looking-back': 'Looking Back',
      'language': 'Language',
      'skills': 'Skills',
    };

    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('token').value = tgConfig.token;
      document.getElementById('chat').value = tgConfig.chat;
      updateWarning();

      document.querySelectorAll('.section-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
          if (isLongPress) { isLongPress = false; return; }
          openViewer(btn.dataset);
        });

        btn.addEventListener('touchstart', () => {
          isLongPress = false;
          btn.classList.add('pressing');
          pressTimer = setTimeout(() => {
            isLongPress = true;
            btn.classList.remove('pressing');
            copyLink(btn.dataset);
          }, 600);
        });

        btn.addEventListener('touchend', () => { clearTimeout(pressTimer); btn.classList.remove('pressing'); });
        btn.addEventListener('touchmove', () => { clearTimeout(pressTimer); btn.classList.remove('pressing'); });

        btn.addEventListener('contextmenu', (e) => { e.preventDefault(); copyLink(btn.dataset); });
      });
    });

    function getContentUrl(data, forShare) {
      let path;
      if (data.review) {
        path = \`g\${data.grade}/review-\${data.review}/\${data.section}.md\`;
      } else {
        const unitPad = String(data.unit).padStart(2, '0');
        path = \`g\${data.grade}/unit-\${unitPad}/\${data.section}.md\`;
      }
      if (forShare || !isLocal) return \`\${GITHUB_RAW_BASE}/\${path}\`;
      return \`../data/voice-lectures/\${path}\`;
    }

    function buildViewerUrl(data, forShare) {
      const contentUrl = getContentUrl(data, forShare);
      const params = new URLSearchParams();
      params.set('c', btoa(contentUrl));
      if (tgConfig.token) params.set('token', tgConfig.token);
      if (tgConfig.chat) params.set('chat', tgConfig.chat);
      if (forShare) return \`\${GITHUB_PAGES_VIEWER}?\${params}\`;
      return \`../voice-lecture-viewer-v2?\${params}\`;
    }

    function openViewer(data) { window.location.href = buildViewerUrl(data, false); }

    async function copyLink(data) {
      const url = buildViewerUrl(data, true);
      try {
        await navigator.clipboard.writeText(url);
        showToast('Đã copy link');
      } catch {
        const ta = document.createElement('textarea');
        ta.value = url; ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        showToast('Đã copy link');
      }
    }

    async function copyAllLinks() {
      const buttons = document.querySelectorAll('#sections .section-btn:not(.disabled)');
      const lines = [];
      buttons.forEach(b => {
        const { grade, section } = b.dataset;
        const url = buildViewerUrl(b.dataset, true);
        lines.push(\`- Lop \${grade} - \${SECTION_NAMES[section] || section} : \${url}\`);
      });
      const text = lines.join('\\n');
      try {
        await navigator.clipboard.writeText(text);
        showToast(\`Đã copy \${lines.length} links\`);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        showToast(\`Đã copy \${lines.length} links\`);
      }
    }

    function toggleSettings() { document.getElementById('settings').classList.toggle('open'); }

    function saveSettings() {
      tgConfig.token = document.getElementById('token').value.trim();
      tgConfig.chat = document.getElementById('chat').value.trim();
      localStorage.setItem('tg_token', tgConfig.token);
      localStorage.setItem('tg_chat', tgConfig.chat);
      updateWarning();
      showToast('Đã lưu cài đặt');
      document.getElementById('settings').classList.remove('open');
    }

    function clearSettings() {
      document.getElementById('token').value = '';
      document.getElementById('chat').value = '';
      tgConfig = { token: '', chat: '' };
      localStorage.removeItem('tg_token');
      localStorage.removeItem('tg_chat');
      updateWarning();
      showToast('Đã xóa cài đặt');
    }

    function updateWarning() {
      document.getElementById('warning').classList.toggle('hidden', !!(tgConfig.token && tgConfig.chat));
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg; t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2000);
    }
  `;
}

// --- Generate ---
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

let count = 0;
for (const [gradeStr, gradeData] of Object.entries(GRADE_DATA)) {
  const grade = Number(gradeStr);

  // Per-unit pages
  for (const unit of gradeData.units) {
    const unitPad = String(unit.num).padStart(2, '0');
    const filename = `g${grade}-u${unitPad}.html`;
    const outPath = path.join(OUT_DIR, filename);
    fs.writeFileSync(outPath, buildUnitHtml(grade, unit, gradeData), 'utf8');
    console.log(`  ${filename}`);
    count++;
  }

  // Per-review pages
  for (const review of gradeData.reviews) {
    const filename = `g${grade}-review${review.num}.html`;
    const outPath = path.join(OUT_DIR, filename);
    fs.writeFileSync(outPath, buildReviewHtml(grade, review, gradeData), 'utf8');
    console.log(`  ${filename}`);
    count++;
  }
}

console.log(`\nDone: ${count} files in v2/units/`);
