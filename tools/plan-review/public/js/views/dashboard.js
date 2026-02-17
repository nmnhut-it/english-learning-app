// Dashboard view — grid overview of all grades/units/sections
const DashboardView = {
  container: null,
  tree: null,
  filter: 'all',

  async init(container) {
    this.container = container;
    this.tree = await API.getTree();
    this.render();
  },

  render() {
    if (!this.tree) {
      this.container.innerHTML = '<div class="empty-state"><div class="empty-text">Loading...</div></div>';
      return;
    }

    const stats = this.computeStats();

    this.container.innerHTML = `
      <div class="dashboard">
        <div class="dashboard-header">
          <div class="dashboard-stats">
            <div class="stat-card">
              <div class="stat-value" style="color: var(--text)">${stats.total}</div>
              <div class="stat-label">Total Files</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: var(--green)">${stats.reviewed}</div>
              <div class="stat-label">Reviewed</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: var(--yellow)">${stats.needsReview}</div>
              <div class="stat-label">Needs Review</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: var(--red)">${stats.hasIssues}</div>
              <div class="stat-label">Has Issues</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: var(--text-dim)">${stats.missingLecture}</div>
              <div class="stat-label">Missing Lecture</div>
            </div>
          </div>
        </div>

        <div class="dashboard-legend">
          <div class="legend-item"><span class="legend-dot" style="background: var(--green)"></span> Reviewed</div>
          <div class="legend-item"><span class="legend-dot" style="background: var(--yellow)"></span> Needs Review</div>
          <div class="legend-item"><span class="legend-dot" style="background: var(--red)"></span> Has Issues</div>
          <div class="legend-item"><span class="legend-dot" style="background: var(--bg-panel)"></span> Unreviewed</div>
          <div class="legend-item"><span class="legend-dot" style="background: transparent; border: 1px dashed var(--red)"></span> Missing Lecture</div>
          <div class="legend-item"><span class="legend-dot" style="background: transparent; border: 1px dashed var(--orange)"></span> Missing Source</div>
        </div>

        <div class="dashboard-filters">
          ${['all', 'unreviewed', 'needs-review', 'has-issues', 'reviewed', 'missing-lecture'].map(f =>
            `<button class="filter-btn ${this.filter === f ? 'active' : ''}" data-filter="${f}">${f.replace('-', ' ')}</button>`
          ).join('')}
        </div>

        ${this.tree.grades.map(g => this.renderGradeGrid(g)).join('')}
      </div>`;

    this.bindEvents();
  },

  renderGradeGrid(grade) {
    const sections = grade.units[0]?.sections.map(s => s.name) || [];

    const headerCells = sections.map(s => {
      const label = s.replace('communication-and-culture-clil', 'comm-culture')
                     .replace('getting-started', 'get-start')
                     .replace('a-closer-look-', 'acl-')
                     .replace('communication', 'comm')
                     .replace('looking-back', 'look-back');
      return `<th title="${s}">${label}</th>`;
    }).join('');

    const rows = grade.units.map(unit => {
      const cells = unit.sections.map(s => {
        let cls = s.status || 'unreviewed';
        if (!s.hasLecture && !s.hasSource) cls = 'missing-both';
        else if (!s.hasLecture) cls = 'missing-lecture';
        else if (!s.hasSource) cls = 'missing-source';

        // Apply filter
        if (this.filter !== 'all') {
          const matchesFilter = cls === this.filter ||
            (this.filter === 'missing-lecture' && (cls === 'missing-lecture' || cls === 'missing-both'));
          if (!matchesFilter) {
            return `<td><div class="grid-cell" style="opacity: 0.1" data-grade="${grade.grade}" data-unit="${unit.name}" data-section="${s.name}"></div></td>`;
          }
        }

        return `<td><div class="grid-cell ${cls}" title="${unit.name}/${s.name}: ${cls}" data-grade="${grade.grade}" data-unit="${unit.name}" data-section="${s.name}"></div></td>`;
      }).join('');

      return `<tr><td>${unit.name.replace('unit-', 'U')}</td>${cells}</tr>`;
    }).join('');

    return `
      <div class="grade-section">
        <div class="grade-title">Grade ${grade.grade}</div>
        <table class="grid-table">
          <thead><tr><th>Unit</th>${headerCells}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  },

  computeStats() {
    let total = 0, reviewed = 0, needsReview = 0, hasIssues = 0, missingLecture = 0;
    for (const g of this.tree.grades) {
      for (const u of g.units) {
        for (const s of u.sections) {
          total++;
          if (!s.hasLecture) missingLecture++;
          if (s.status === 'reviewed') reviewed++;
          else if (s.status === 'needs-review') needsReview++;
          else if (s.status === 'has-issues') hasIssues++;
        }
      }
    }
    return { total, reviewed, needsReview, hasIssues, missingLecture };
  },

  bindEvents() {
    // Filter buttons
    this.container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filter = btn.dataset.filter;
        this.render();
      });
    });

    // Grid cell click → navigate to review
    this.container.querySelectorAll('.grid-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const { grade, unit, section } = cell.dataset;
        if (grade && unit && section) {
          App.navigateToReview(grade, unit, section);
        }
      });
    });
  },
};
