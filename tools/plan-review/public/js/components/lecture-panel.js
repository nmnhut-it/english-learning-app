// Right panel: voice lecture content
const LecturePanel = {
  container: null,
  content: '',
  chunks: [],
  editing: false,
  coverageData: null,

  init(container) {
    this.container = container;
  },

  setContent(content, chunks) {
    this.content = content;
    this.chunks = chunks || [];
    this.editing = false;
    this.coverageData = null;
    this.render();
  },

  setCoverageData(data) {
    this.coverageData = data;
    this.render();
  },

  render() {
    if (!this.content) {
      this.container.innerHTML = `
        <div class="panel-header">
          <span>Lecture (voice-lecture)</span>
        </div>
        <div class="panel-body">
          <div class="empty-state">
            <div class="empty-text">No lecture file</div>
          </div>
        </div>`;
      return;
    }

    const editBtn = this.editing
      ? '<button class="tool-btn active lecture-edit-toggle">Editing</button><button class="tool-btn primary lecture-save-btn">Save</button>'
      : '<button class="tool-btn lecture-edit-toggle">Edit</button>';

    this.container.innerHTML = `
      <div class="panel-header">
        <span>Lecture (voice-lecture)</span>
        <div class="panel-actions">${editBtn}</div>
      </div>
      <div class="panel-body ${this.editing ? 'editing' : ''}">
        ${this.editing
          ? `<textarea class="lecture-textarea">${this.escapeHtml(this.content)}</textarea>`
          : this.renderContent()
        }
      </div>`;

    this.bindEvents();
  },

  renderContent() {
    if (this.coverageData) {
      return this.renderCoverageView();
    }
    return MarkdownUtil.render(this.content);
  },

  renderCoverageView() {
    // Render lecture paragraphs, highlight those matched by source
    const paragraphs = this.content.split(/\n\s*\n/).filter(p => p.trim().length > 10);
    const matchedIndices = new Set();

    if (this.coverageData && this.coverageData.matches) {
      this.coverageData.matches.forEach(m => {
        if (m.bestMatchIndex >= 0 && m.status !== 'missing') {
          matchedIndices.add(m.bestMatchIndex);
        }
      });
    }

    return paragraphs.map((p, i) => {
      const isMatched = matchedIndices.has(i);
      const escaped = this.escapeHtml(p);
      return `
        <div class="para-block ${isMatched ? 'found' : ''}" data-lecture-index="${i}">
          <div class="para-text">${escaped}</div>
          ${isMatched ? '<div class="para-sim">matched by source</div>' : ''}
        </div>`;
    }).join('');
  },

  scrollToMatch(index) {
    const block = this.container.querySelector(`[data-lecture-index="${index}"]`);
    if (block) {
      block.scrollIntoView({ behavior: 'smooth', block: 'center' });
      block.style.outline = '2px solid var(--accent)';
      setTimeout(() => { block.style.outline = ''; }, 2000);
    }
  },

  bindEvents() {
    const editToggle = this.container.querySelector('.lecture-edit-toggle');
    if (editToggle) {
      editToggle.addEventListener('click', () => {
        this.editing = !this.editing;
        this.render();
      });
    }

    const saveBtn = this.container.querySelector('.lecture-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const textarea = this.container.querySelector('.lecture-textarea');
        if (textarea) {
          this.content = textarea.value;
          this.editing = false;
          if (this.onSave) this.onSave(this.content);
          this.render();
        }
      });
    }
  },

  onSave: null,

  escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },
};
