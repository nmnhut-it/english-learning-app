/**
 * TheLostChapter - Main Application
 * Minimal audiobook reader with interactive exercises
 */

import { ContentService } from './services/ContentService.js';
import { ProgressService } from './services/ProgressService.js';
import { createBookReader } from './components/BookReader.js';
import { createLibrary } from './components/Library.js';
import { initTheme } from './utils/theme.js';

class App {
  constructor() {
    this.container = document.getElementById('main-content');
    this.currentView = null;
    this.init();
  }

  async init() {
    initTheme();
    this.setupRouting();
    this.handleRoute();
  }

  setupRouting() {
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  handleRoute() {
    const hash = window.location.hash || '#/';
    const [, path, ...params] = hash.split('/');

    // Cleanup previous view
    if (this.currentView?.destroy) {
      this.currentView.destroy();
    }

    switch (path) {
      case 'book':
        this.showBook(params[0], params[1]);
        break;
      case '':
      default:
        this.showLibrary();
    }
  }

  async showLibrary() {
    this.container.innerHTML = '<div class="loading">Loading library...</div>';
    try {
      const books = await ContentService.loadLibrary();
      this.currentView = createLibrary(this.container, books);
    } catch (err) {
      this.showError('Failed to load library', err);
    }
  }

  async showBook(bookId, chapterId) {
    if (!bookId) {
      window.location.hash = '#/';
      return;
    }

    this.container.innerHTML = '<div class="loading">Loading book...</div>';
    try {
      const book = await ContentService.loadBook(bookId);
      const progress = ProgressService.getProgress(bookId);
      const startChapter = chapterId || progress?.chapterId || book.chapters[0];

      this.currentView = createBookReader(this.container, {
        book,
        startChapter,
        onProgress: (chId, secIdx) => ProgressService.saveProgress(bookId, chId, secIdx)
      });
    } catch (err) {
      this.showError('Failed to load book', err);
    }
  }

  showError(message, error) {
    console.error(message, error);
    this.container.innerHTML = `
      <div class="error-view">
        <h2>Oops!</h2>
        <p>${message}</p>
        <a href="#/" class="btn">Back to Library</a>
      </div>
    `;
  }
}

// Start app
new App();
