// Main app — router and initialization
const App = {
  currentView: null,

  init() {
    this.bindNavigation();
    this.route();
    window.addEventListener('hashchange', () => this.route());
  },

  bindNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });
  },

  route() {
    const hash = window.location.hash || '#/';
    const main = document.getElementById('app-main');

    // Update active nav
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === hash || (hash.startsWith('#/review') && l.dataset.view === 'review'));
    });

    if (hash.startsWith('#/review')) {
      this.currentView = 'review';
      ReviewView.init(main);

      // Parse grade/unit/section from hash if present
      const parts = hash.replace('#/review/', '').split('/');
      if (parts.length === 3) {
        setTimeout(() => ReviewView.navigateTo(parts[0], parts[1], parts[2]), 300);
      }
    } else {
      this.currentView = 'dashboard';
      DashboardView.init(main);
    }
  },

  navigateToReview(grade, unit, section) {
    window.location.hash = `#/review/${grade}/${unit}/${section}`;
  },
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
