// Coverage analysis bar component
const CoverageBadge = {
  container: null,
  data: null,

  init(container) {
    this.container = container;
  },

  setData(data) {
    this.data = data;
    this.render();
  },

  clear() {
    this.data = null;
    if (this.container) this.container.innerHTML = '';
  },

  render() {
    if (!this.data || !this.container) {
      if (this.container) this.container.innerHTML = '';
      return;
    }

    const { coverage, found, partial, missing, total } = this.data;

    let fillColor = 'var(--green)';
    if (coverage < 50) fillColor = 'var(--red)';
    else if (coverage < 80) fillColor = 'var(--yellow)';

    this.container.innerHTML = `
      <div class="coverage-bar">
        <span class="coverage-pct" style="color: ${fillColor}">${coverage}%</span>
        <div class="coverage-meter">
          <div class="coverage-fill" style="width: ${coverage}%; background: ${fillColor}"></div>
        </div>
        <div class="coverage-stats">
          <span class="found">${found} found</span>
          <span class="partial">${partial} partial</span>
          <span class="missing">${missing} missing</span>
          <span style="color: var(--text-dim)">${total} total</span>
        </div>
      </div>`;
  },
};
