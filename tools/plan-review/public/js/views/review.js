// Review view — side-by-side panels with all features
const ReviewView = {
  container: null,
  current: null, // { grade, unit, section }
  mode: 'view', // 'view' | 'coverage' | 'audio' | 'chunks'
  content: null,

  async init(container) {
    this.container = container;
    this.renderShell();
  },

  renderShell() {
    this.container.innerHTML = `
      <div class="review-layout">
        <div class="review-sidebar" id="review-nav"></div>
        <div class="review-panels">
          <div class="review-toolbar">
            <div class="toolbar-group">
              <button class="tool-btn active" data-mode="view">View</button>
              <button class="tool-btn" data-mode="coverage">Analyze Coverage</button>
              <button class="tool-btn" data-mode="chunks">Chunks</button>
              <button class="tool-btn" data-mode="audio">Audio Audit</button>
              <button class="tool-btn" data-mode="dialogue">Dialogue Check</button>
            </div>
            <div class="toolbar-group">
              <button class="tool-btn" id="lecture-only-btn" title="Toggle lecture-only full-width view">Lecture Only</button>
              <span style="border-left: 1px solid var(--border); height: 18px;"></span>
              <select class="status-select" id="review-status-select">
                <option value="unreviewed">Unreviewed</option>
                <option value="reviewed">Reviewed</option>
                <option value="needs-review">Needs Review</option>
                <option value="has-issues">Has Issues</option>
              </select>
              <button class="tool-btn" id="prev-section-btn" title="Previous section">Prev</button>
              <button class="tool-btn" id="next-section-btn" title="Next section">Next</button>
            </div>
          </div>
          <div id="coverage-badge-container"></div>
          <div class="panels-container">
            <div class="panel" id="source-panel"></div>
            <div class="panel" id="lecture-panel"></div>
          </div>
          <div id="extra-panel" style="display: none;"></div>
        </div>
      </div>`;

    // Init sidebar
    NavSidebar.init(
      document.getElementById('review-nav'),
      (sel) => this.loadContent(sel.grade, sel.unit, sel.section)
    );

    // Init panels
    SourcePanel.init(document.getElementById('source-panel'));
    LecturePanel.init(document.getElementById('lecture-panel'));
    CoverageBadge.init(document.getElementById('coverage-badge-container'));

    // Save callbacks
    SourcePanel.onSave = (content) => this.saveSource(content);
    LecturePanel.onSave = (content) => this.saveLecture(content);

    // Mode buttons
    this.container.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setMode(btn.dataset.mode);
      });
    });

    // Status select
    document.getElementById('review-status-select').addEventListener('change', (e) => {
      if (this.current) {
        API.setReviewStatus(this.current.grade, this.current.unit, this.current.section, e.target.value);
        NavSidebar.updateStatus(this.current.grade, this.current.unit, this.current.section, e.target.value);
      }
    });

    // Lecture-only toggle
    document.getElementById('lecture-only-btn').addEventListener('click', () => {
      const btn = document.getElementById('lecture-only-btn');
      const panels = this.container.querySelector('.panels-container');
      panels.classList.toggle('lecture-only');
      btn.classList.toggle('active');
    });

    // Prev/Next buttons
    document.getElementById('prev-section-btn').addEventListener('click', () => this.navigateSection(-1));
    document.getElementById('next-section-btn').addEventListener('click', () => this.navigateSection(1));

    // Show empty state initially
    SourcePanel.setContent('');
    LecturePanel.setContent('', []);
  },

  async loadContent(grade, unit, section) {
    this.current = { grade, unit, section };
    document.getElementById('current-file').textContent = `g${grade}/${unit}/${section}`;

    try {
      this.content = await API.getContent(grade, unit, section);

      SourcePanel.setContent(this.content.source);
      LecturePanel.setContent(this.content.lecture, this.content.lectureChunks);

      // Load review status
      const statusData = await API.getReviewStatus();
      const key = `${grade}/${unit}/${section}`;
      document.getElementById('review-status-select').value = statusData[key] || 'unreviewed';

      // If in coverage mode, auto-analyze
      if (this.mode === 'coverage') {
        this.runCoverage();
      } else if (this.mode === 'audio') {
        this.showAudioAudit();
      } else if (this.mode === 'chunks') {
        this.showChunks();
      } else if (this.mode === 'dialogue') {
        this.showDialogueCheck();
      } else {
        CoverageBadge.clear();
      }
    } catch (e) {
      console.error('Error loading content:', e);
    }
  },

  setMode(mode) {
    this.mode = mode;
    const extraPanel = document.getElementById('extra-panel');

    if (mode === 'view') {
      extraPanel.style.display = 'none';
      CoverageBadge.clear();
      if (this.content) {
        SourcePanel.coverageData = null;
        SourcePanel.render();
        LecturePanel.coverageData = null;
        LecturePanel.render();
      }
    } else if (mode === 'coverage') {
      extraPanel.style.display = 'none';
      this.runCoverage();
    } else if (mode === 'audio') {
      this.showAudioAudit();
    } else if (mode === 'chunks') {
      this.showChunks();
    } else if (mode === 'dialogue') {
      extraPanel.style.display = 'none';
      CoverageBadge.clear();
      this.showDialogueCheck();
    }
  },

  async runCoverage() {
    if (!this.current) return;
    try {
      const data = await API.analyze(this.current.grade, this.current.unit, this.current.section);
      CoverageBadge.setData(data);
      SourcePanel.setCoverageData(data);
      LecturePanel.setCoverageData(data);
    } catch (e) {
      console.error('Coverage analysis error:', e);
    }
  },

  showAudioAudit() {
    if (!this.current) return;
    const extraPanel = document.getElementById('extra-panel');
    extraPanel.style.display = 'block';
    extraPanel.innerHTML = '<div id="audio-audit-container"></div>';
    AudioAudit.init(document.getElementById('audio-audit-container'));
    AudioAudit.load(this.current.grade, this.current.unit, this.current.section);
  },

  showChunks() {
    if (!this.current || !this.content) return;
    const extraPanel = document.getElementById('extra-panel');
    extraPanel.style.display = 'block';
    extraPanel.innerHTML = '<div id="chunk-map-container"></div>';
    ChunkMap.init(document.getElementById('chunk-map-container'), (chunk) => {
      // Scroll lecture panel to chunk
      const body = document.querySelector('#lecture-panel .panel-body');
      if (body) {
        const marker = body.querySelector(`[data-chunk="${chunk.name}"]`);
        if (marker) {
          marker.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
    ChunkMap.setChunks(this.content.lectureChunks);
  },

  async showDialogueCheck() {
    if (!this.current) return;
    try {
      const data = await API.dialogueCheck(this.current.grade, this.current.unit, this.current.section);
      const extraPanel = document.getElementById('extra-panel');
      extraPanel.style.display = 'block';

      if (!data.hasDialogue) {
        extraPanel.innerHTML = `<div class="dialogue-check-panel" style="padding: 12px;">
          <div style="color: var(--text-dim); font-size: 12px;">No &lt;dialogue&gt; tags found in this lecture.</div>
        </div>`;
        return;
      }

      let html = '<div class="dialogue-check-panel" style="padding: 12px;">';
      html += `<div style="margin-bottom: 12px; font-size: 12px; color: var(--text-dim);">
        Found ${data.validations.length} dialogue(s) — ${data.errors} error(s), ${data.warnings} warning(s)
      </div>`;

      for (const v of data.validations) {
        html += `<div style="margin-bottom: 12px;">`;
        html += `<div style="font-size: 12px; font-weight: 600; color: var(--accent); margin-bottom: 4px;">
          Dialogue #${v.dialogueIndex + 1} (line ${v.startLine}) — ${v.rowCount} rows, speakers: ${v.speakers.join(', ') || 'none'}
        </div>`;

        if (v.issues.length === 0) {
          html += `<div class="dialogue-ok">All checks passed</div>`;
        } else {
          html += `<div class="dialogue-issues">
            <div class="issue-header">${v.issues.length} issue(s)</div>`;
          for (const issue of v.issues) {
            html += `<div class="issue-item ${issue.type}">Line ${issue.line}: ${issue.message}</div>`;
          }
          html += `</div>`;
        }
        html += `</div>`;
      }
      html += '</div>';
      extraPanel.innerHTML = html;
    } catch (e) {
      console.error('Dialogue check error:', e);
    }
  },

  async saveLecture(content) {
    if (!this.current) return;
    try {
      await API.saveLecture(this.current.grade, this.current.unit, this.current.section, content);
      this.content.lecture = content;
    } catch (e) {
      console.error('Save lecture error:', e);
      alert('Failed to save lecture: ' + e.message);
    }
  },

  async saveSource(content) {
    if (!this.current) return;
    try {
      await API.saveSource(this.current.grade, this.current.unit, this.current.section, content);
      this.content.source = content;
    } catch (e) {
      console.error('Save source error:', e);
      alert('Failed to save source: ' + e.message);
    }
  },

  // Navigate to previous/next section
  navigateSection(direction) {
    if (!this.current || !NavSidebar.tree) return;
    const { grade, unit, section } = this.current;

    const gradeData = NavSidebar.tree.grades.find(g => g.grade === parseInt(grade));
    if (!gradeData) return;

    const unitData = gradeData.units.find(u => u.name === unit);
    if (!unitData) return;

    const sectionIdx = unitData.sections.findIndex(s => s.name === section);
    const newIdx = sectionIdx + direction;

    if (newIdx >= 0 && newIdx < unitData.sections.length) {
      // Same unit, different section
      NavSidebar.select(grade, unit, unitData.sections[newIdx].name);
    } else if (direction > 0) {
      // Next unit
      const unitIdx = gradeData.units.findIndex(u => u.name === unit);
      if (unitIdx + 1 < gradeData.units.length) {
        const nextUnit = gradeData.units[unitIdx + 1];
        NavSidebar.select(grade, nextUnit.name, nextUnit.sections[0].name);
      }
    } else {
      // Previous unit
      const unitIdx = gradeData.units.findIndex(u => u.name === unit);
      if (unitIdx - 1 >= 0) {
        const prevUnit = gradeData.units[unitIdx - 1];
        NavSidebar.select(grade, prevUnit.name, prevUnit.sections[prevUnit.sections.length - 1].name);
      }
    }
  },

  // Navigate to specific file (called from dashboard)
  navigateTo(grade, unit, section) {
    NavSidebar.select(grade, unit, section);
  },
};
