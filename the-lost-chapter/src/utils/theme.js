/**
 * Theme Management - Light/Dark mode
 */

const STORAGE_KEY = 'tlc_theme';

export function initTheme() {
  // Check saved preference
  const saved = localStorage.getItem(STORAGE_KEY);

  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const theme = saved || (prefersDark ? 'dark' : 'light');
  setTheme(theme);

  // Listen for system changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });

  // Setup toggle button
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme;
      const next = current === 'dark' ? 'light' : 'dark';
      setTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
    });
  }
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

export function getTheme() {
  return document.documentElement.dataset.theme || 'light';
}
