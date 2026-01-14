/**
 * Library component - displays book grid
 */

import { getBooks, getCoverUrl } from '../services/ContentService.js';
import { getBookProgress, getBookCompletionPercent } from '../services/ProgressService.js';
import { t } from '../services/I18nService.js';
import { navigate } from '../utils/router.js';

export function Library() {
  const el = document.createElement('div');
  el.className = 'library';

  let books = [];

  async function render() {
    el.innerHTML = `
      <div class="library__grid" id="book-grid">
        <div class="loading">
          <div class="loading__spinner"></div>
        </div>
      </div>
    `;

    try {
      books = await getBooks();
      renderBooks();
    } catch (error) {
      renderError();
    }
  }

  function renderBooks() {
    const grid = el.querySelector('#book-grid');

    if (!books || books.length === 0) {
      grid.innerHTML = `
        <div class="library__empty">
          <p>${t('noBooks')}</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = books.map(book => {
      const progress = getBookProgress(book.id);
      const percent = getBookCompletionPercent(book.id, book.chapters?.length || 0);
      const hasProgress = progress.lastChapter !== null;

      return `
        <article class="book-card" data-book-id="${book.id}">
          <div class="book-card__cover">
            ${book.coverImage
              ? `<img src="${getCoverUrl(book.id, book.coverImage)}" alt="${book.title}" loading="lazy">`
              : `<div class="book-card__cover-placeholder">${book.title.charAt(0)}</div>`
            }
          </div>
          <div class="book-card__info">
            <h3 class="book-card__title">${book.title}</h3>
            <p class="book-card__author">${book.author || ''}</p>
            ${percent > 0 ? `
              <div class="book-card__progress">
                <div class="progress-bar">
                  <div class="progress-bar__fill" style="width: ${percent}%"></div>
                </div>
                <span class="progress-bar__text">${percent}%</span>
              </div>
            ` : ''}
          </div>
          <button class="btn btn--primary book-card__btn">
            ${hasProgress ? t('continue') : t('startReading')}
          </button>
        </article>
      `;
    }).join('');

    bindEvents();
  }

  function renderError() {
    const grid = el.querySelector('#book-grid');
    grid.innerHTML = `
      <div class="library__error">
        <p>${t('error')}</p>
        <button class="btn btn--secondary" id="retry-btn">${t('retry')}</button>
      </div>
    `;

    el.querySelector('#retry-btn')?.addEventListener('click', render);
  }

  function bindEvents() {
    el.querySelectorAll('.book-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const bookId = card.dataset.bookId;
        navigate(`/book/${bookId}`);
      });
    });
  }

  // Initialize
  render();

  return {
    el,
    update: render,
    destroy: () => el.remove()
  };
}
