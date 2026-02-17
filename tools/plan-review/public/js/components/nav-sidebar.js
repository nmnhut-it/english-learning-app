// Navigation sidebar component
const NavSidebar = {
  tree: null,
  container: null,
  onSelect: null,

  async init(container, onSelect) {
    this.container = container;
    this.onSelect = onSelect;
    this.tree = await API.getTree();
    this.render();
  },

  render() {
    if (!this.tree) return;
    const html = this.tree.grades.map(g => this.renderGrade(g)).join('');
    this.container.innerHTML = html;
    this.bindEvents();
  },

  renderGrade(grade) {
    const units = grade.units.map(u => this.renderUnit(grade.grade, u)).join('');
    return `
      <div class="sidebar-grade" data-grade="${grade.grade}">
        <button class="sidebar-grade-btn">
          <span>Grade ${grade.grade}</span>
          <span class="arrow">+</span>
        </button>
        <div class="sidebar-units">${units}</div>
      </div>`;
  },

  renderUnit(grade, unit) {
    const sections = unit.sections.map(s => this.renderSection(grade, unit.name, s)).join('');
    return `
      <div class="sidebar-unit" data-unit="${unit.name}">
        <button class="sidebar-unit-btn">
          <span>${unit.name}</span>
          <span class="arrow">+</span>
        </button>
        <div class="sidebar-sections">${sections}</div>
      </div>`;
  },

  renderSection(grade, unit, section) {
    let statusClass = section.status || 'unreviewed';
    if (!section.hasLecture && !section.hasSource) statusClass = 'missing';
    else if (!section.hasLecture) statusClass = 'missing';

    return `
      <button class="sidebar-section-btn" data-grade="${grade}" data-unit="${unit}" data-section="${section.name}">
        <span class="status-dot ${statusClass}"></span>
        ${section.name}
      </button>`;
  },

  bindEvents() {
    // Grade toggle
    this.container.querySelectorAll('.sidebar-grade-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.sidebar-grade').classList.toggle('open');
        const arrow = btn.querySelector('.arrow');
        arrow.textContent = btn.closest('.sidebar-grade').classList.contains('open') ? '-' : '+';
      });
    });

    // Unit toggle
    this.container.querySelectorAll('.sidebar-unit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.sidebar-unit').classList.toggle('open');
        const arrow = btn.querySelector('.arrow');
        arrow.textContent = btn.closest('.sidebar-unit').classList.contains('open') ? '-' : '+';
      });
    });

    // Section select
    this.container.querySelectorAll('.sidebar-section-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.sidebar-section-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Auto-open parent grade and unit
        btn.closest('.sidebar-grade').classList.add('open');
        btn.closest('.sidebar-unit').classList.add('open');

        if (this.onSelect) {
          this.onSelect({
            grade: btn.dataset.grade,
            unit: btn.dataset.unit,
            section: btn.dataset.section,
          });
        }
      });
    });
  },

  // Select programmatically
  select(grade, unit, section) {
    const btn = this.container.querySelector(
      `.sidebar-section-btn[data-grade="${grade}"][data-unit="${unit}"][data-section="${section}"]`
    );
    if (btn) btn.click();
  },

  // Update a section's status dot
  updateStatus(grade, unit, section, status) {
    const btn = this.container.querySelector(
      `.sidebar-section-btn[data-grade="${grade}"][data-unit="${unit}"][data-section="${section}"]`
    );
    if (btn) {
      const dot = btn.querySelector('.status-dot');
      dot.className = `status-dot ${status}`;
    }
  },
};
