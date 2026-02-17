// Audio audit component
const AudioAudit = {
  container: null,
  data: null,

  init(container) {
    this.container = container;
  },

  async load(grade, unit, section) {
    try {
      this.data = await API.audioAudit(grade, unit, section);
      this.render();
    } catch (e) {
      this.container.innerHTML = `<div class="empty-state"><div class="empty-text">Error loading audio audit</div></div>`;
    }
  },

  clear() {
    this.data = null;
    if (this.container) this.container.innerHTML = '';
  },

  render() {
    if (!this.data || !this.container) return;

    const { sourceAudio, lectureAudio } = this.data;

    this.container.innerHTML = `
      <div class="audio-audit-panel">
        <h3 style="color: var(--accent); margin-bottom: 8px; font-size: 12px;">Source Audio (${sourceAudio.length})</h3>
        ${sourceAudio.length ? sourceAudio.map(a => this.renderRef(a)).join('') : '<div style="color: var(--text-dim); font-size: 11px; margin-bottom: 12px;">None</div>'}

        <h3 style="color: var(--accent); margin-bottom: 8px; margin-top: 12px; font-size: 12px;">Lecture Audio (${lectureAudio.length})</h3>
        ${lectureAudio.length ? lectureAudio.map(a => this.renderRef(a)).join('') : '<div style="color: var(--text-dim); font-size: 11px;">None</div>'}
      </div>`;
  },

  renderRef(ref) {
    return `
      <div class="audio-ref">
        <span class="audio-type">${ref.type}</span>
        <span class="audio-value">${ref.value}</span>
        <span class="audio-line">L${ref.line}</span>
      </div>`;
  },
};
