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

  async handleRoute() {
    const hash = window.location.hash || '#/';
    const [, path, ...params] = hash.split('/');

    // Clean up previous view
    if (this.currentView?.destroy) {
      this.currentView.destroy();
    }
    this.container.innerHTML = '';

    try {
      switch (path) {
        case 'book':
          await this.showBook(params[0], params[1]);
          break;
        case '':
        default:
          await this.showLibrary();
      }
    } catch (err) {
      this.showError(err.message);
    }
  }

  async showLibrary() {
    const books = await ContentService.loadLibrary();
    this.currentView = createLibrary(this.container, books);
  }

  async showBook(bookId, chapterId) {
    if (!bookId) {
      window.location.hash = '#/';
      return;
    }

    const book = await ContentService.loadBook(bookId);
    const startChapter = chapterId || ProgressService.getLastChapter(bookId) || book.chapters[0];

    this.currentView = createBookReader(this.container, {
      book,
      startChapter,
      onProgress: (chapterId, sectionIndex) => {
        ProgressService.saveProgress(bookId, chapterId, sectionIndex);
      }
    });
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="error-state">
        <h2>Something went wrong</h2>
        <p>${message}</p>
        <a href="#/" class="btn">Back to Library</a>
      </div>
    `;
  }
}

// Start app
new App();
