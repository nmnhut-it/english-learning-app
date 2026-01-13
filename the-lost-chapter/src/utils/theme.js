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

  // Toggle button
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
}

export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  localStorage.setItem(STORAGE_KEY, next);
}
