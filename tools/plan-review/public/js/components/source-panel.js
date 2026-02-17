// Left panel: loigiaihay.com source content
const SourcePanel = {
  container: null,
  content: '',
  editing: false,
  coverageData: null,

  init(container) {
    this.container = container;
  },

  setContent(content) {
    this.content = content;
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
          <span>Source (loigiaihay.com)</span>
        </div>
        <div class="panel-body">
          <div class="empty-state">
            <div class="empty-text">No source file</div>
          </div>
        </div>`;
      return;
    }

    const editBtn = this.editing
      ? '<button class="tool-btn active source-edit-toggle">Editing</button><button class="tool-btn primary source-save-btn">Save</button>'
      : '<button class="tool-btn source-edit-toggle">Edit</button>';

    this.container.innerHTML = `
      <div class="panel-header">
        <span>Source (loigiaihay.com)</span>
        <div class="panel-actions">${editBtn}</div>
      </div>
      <div class="panel-body ${this.editing ? 'editing' : ''}">
        ${this.editing
          ? `<textarea class="source-textarea">${this.escapeHtml(this.content)}</textarea>`
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
    const paragraphs = this.content.split(/\n\s*\n/).filter(p => p.trim().length > 10);
    const matchMap = {};
    if (this.coverageData && this.coverageData.matches) {
      this.coverageData.matches.forEach(m => {
        matchMap[m.sourceIndex] = m;
      });
    }

    let matchIdx = 0;
    return paragraphs.map((p, i) => {
      const match = matchMap[matchIdx];
      let status = 'found';
      let sim = 1;
      let preview = '';

      if (match && match.sourceIndex === matchIdx) {
        status = match.status;
        sim = match.similarity;
        preview = match.bestMatchParagraph;
        matchIdx++;
      }

      const escaped = this.escapeHtml(p);
      return `
        <div class="para-block ${status}" data-index="${i}" data-match-index="${match ? match.bestMatchIndex : -1}">
          <div class="para-text">${escaped}</div>
          <div class="para-sim">${status}: ${Math.round(sim * 100)}% match</div>
          ${preview ? `<div class="para-match-preview">${this.escapeHtml(preview.substring(0, 150))}...</div>` : ''}
        </div>`;
    }).join('');
  },

  bindEvents() {
    const editToggle = this.container.querySelector('.source-edit-toggle');
    if (editToggle) {
      editToggle.addEventListener('click', () => {
        this.editing = !this.editing;
        this.render();
      });
    }

    const saveBtn = this.container.querySelector('.source-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const textarea = this.container.querySelector('.source-textarea');
        if (textarea) {
          this.content = textarea.value;
          this.editing = false;
          if (this.onSave) this.onSave(this.content);
          this.render();
        }
      });
    }

    // Click para to scroll to match in lecture panel
    this.container.querySelectorAll('.para-block').forEach(block => {
      block.addEventListener('click', () => {
        const matchIndex = block.dataset.matchIndex;
        if (matchIndex >= 0) {
          LecturePanel.scrollToMatch(matchIndex);
        }
      });
    });
  },

  onSave: null,

  escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },
};
