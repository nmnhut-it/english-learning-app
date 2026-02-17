// Chunk map component — shows lecture chunks for navigation
const ChunkMap = {
  container: null,
  chunks: [],
  onChunkClick: null,

  init(container, onChunkClick) {
    this.container = container;
    this.onChunkClick = onChunkClick;
  },

  setChunks(chunks) {
    this.chunks = chunks || [];
    this.render();
  },

  clear() {
    this.chunks = [];
    if (this.container) this.container.innerHTML = '';
  },

  render() {
    if (!this.container) return;
    if (!this.chunks.length) {
      this.container.innerHTML = '';
      return;
    }

    this.container.innerHTML = `
      <div class="chunk-list">
        ${this.chunks.map((c, i) => `
          <div class="chunk-item" data-index="${i}" data-name="${c.name}">
            <div class="chunk-name">${c.name}</div>
            <div class="chunk-preview">${this.preview(c.content)}</div>
          </div>
        `).join('')}
      </div>`;

    this.container.querySelectorAll('.chunk-item').forEach(item => {
      item.addEventListener('click', () => {
        this.container.querySelectorAll('.chunk-item').forEach(c => c.classList.remove('active'));
        item.classList.add('active');
        if (this.onChunkClick) {
          this.onChunkClick(this.chunks[parseInt(item.dataset.index)]);
        }
      });
    });
  },

  preview(content) {
    const first = content.split('\n').find(l => l.trim().length > 0) || '';
    const text = first.replace(/<[^>]+>/g, '').replace(/[#*_]/g, '').trim();
    return text.substring(0, 80);
  },
};
