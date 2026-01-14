/**
 * TheLostChapter - Main App Entry Point
 */

import { addRoute, initRouter, navigate } from './utils/router.js';
import { initI18n, setLanguage, getLanguage, t } from './services/I18nService.js';
import { initProgress, getSetting, setSetting } from './services/ProgressService.js';
import { Library } from './components/Library.js';
import { BookDetail } from './components/BookDetail.js';
import { ChapterReader } from './components/ChapterReader.js';

// Current component reference
let currentComponent = null;

// DOM Elements
const mainEl = document.getElementById('main');
const headerTitle = document.getElementById('header-title');
const backBtn = document.getElementById('btn-back');
const themeBtn = document.getElementById('btn-theme');
const langBtn = document.getElementById('btn-lang');
const loadingEl = document.getElementById('loading');
const offlineBanner = document.getElementById('offline-banner');

// ====== Route Handlers ======

function showLibrary() {
  setHeaderState({ title: t('library'), showBack: false });
  mountComponent(Library());
}

function showBookDetail(params) {
  setHeaderState({ title: '...', showBack: true });
  mountComponent(BookDetail({ bookId: params.id }));
}

function showChapterReader(params) {
  setHeaderState({ title: '...', showBack: true });
  mountComponent(ChapterReader({ bookId: params.id, chapterId: params.chapter }));
}

// ====== Helpers ======

function mountComponent(component) {
  // Cleanup previous component
  if (currentComponent?.destroy) {
    currentComponent.destroy();
  }

  // Clear main and hide loading
  mainEl.innerHTML = '';
  loadingEl.hidden = true;

  // Mount new component
  currentComponent = component;
  mainEl.appendChild(component.el);
}

function setHeaderState({ title, showBack }) {
  headerTitle.textContent = title;
  backBtn.hidden = !showBack;
}

// ====== Event Handlers ======

function handleBack() {
  // Simple back navigation based on current route
  const hash = window.location.hash;

  if (hash.match(/^#\/book\/[^\/]+\/[^\/]+$/)) {
    // In chapter -> go to book detail
    const bookId = hash.split('/')[2];
    navigate(`/book/${bookId}`);
  } else if (hash.match(/^#\/book\/[^\/]+$/)) {
    // In book detail -> go to library
    navigate('/');
  } else {
    navigate('/');
  }
}

function handleThemeToggle() {
  const current = getSetting('theme');
  const next = current === 'dark' ? 'light' : 'dark';
  setSetting('theme', next);
}

function handleLanguageToggle() {
  const current = getLanguage();
  const next = current === 'vi' ? 'en' : 'vi';
  setLanguage(next);
}

function handleOnlineStatus() {
  offlineBanner.hidden = navigator.onLine;
}

// ====== Service Worker ======

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('SW registered:', registration.scope);
    } catch (error) {
      console.error('SW registration failed:', error);
    }
  }
}

// ====== Initialization ======

function init() {
  // Initialize services
  initProgress();
  initI18n();

  // Setup routes
  addRoute('/', showLibrary);
  addRoute('/book/:id', showBookDetail);
  addRoute('/book/:id/:chapter', showChapterReader);

  // Bind header events
  backBtn.addEventListener('click', handleBack);
  themeBtn.addEventListener('click', handleThemeToggle);
  langBtn.addEventListener('click', handleLanguageToggle);

  // Online/offline status
  window.addEventListener('online', handleOnlineStatus);
  window.addEventListener('offline', handleOnlineStatus);
  handleOnlineStatus();

  // Register service worker
  registerServiceWorker();

  // Start router
  initRouter();

  console.log('TheLostChapter initialized');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
