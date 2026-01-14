/**
 * BookDetail component - shows book info and chapter list
 */

import { getBook, getCoverUrl } from '../services/ContentService.js';
import { getBookProgress, isChapterCompleted } from '../services/ProgressService.js';
import { t } from '../services/I18nService.js';
import { navigate } from '../utils/router.js';

export function BookDetail(props) {
  const { bookId } = props;
  const el = document.createElement('div');
  el.className = 'book-detail';

  let book = null;

  async function render() {
    el.innerHTML = `
      <div class="loading">
        <div class="loading__spinner"></div>
      </div>
    `;

    try {
      book = await getBook(bookId);
      if (book) {
        renderBook();
      } else {
        renderError();
      }
    } catch (error) {
      renderError();
    }
  }

  function renderBook() {
    const progress = getBookProgress(bookId);
    const continueChapter = progress.lastChapter || book.chapters?.[0];

    el.innerHTML = `
      <div class="book-detail__header">
        ${book.coverImage
          ? `<img class="book-detail__cover" src="${getCoverUrl(bookId, book.coverImage)}" alt="${book.title}">`
          : `<div class="book-detail__cover book-detail__cover--placeholder">${book.title.charAt(0)}</div>`
        }
        <div class="book-detail__info">
          <h2 class="book-detail__title">${book.title}</h2>
          <p class="book-detail__author">${book.author ? `${t('by')} ${book.author}` : ''}</p>
          <p class="book-detail__meta">${book.chapters?.length || 0} ${t('chapters')}</p>
        </div>
      </div>

      ${book.description ? `
        <p class="book-detail__description">${book.description}</p>
      ` : ''}

      ${continueChapter ? `
        <button class="btn btn--primary btn--large book-detail__continue" data-chapter="${continueChapter}">
          ${progress.lastChapter ? t('continue') : t('startReading')}
        </button>
      ` : ''}

      <section class="chapter-list">
        <h3 class="chapter-list__title">${t('chapters')}</h3>
        <ul class="chapter-list__items">
          ${(book.chapters || []).map((chapterId, index) => {
            const completed = isChapterCompleted(bookId, chapterId);
            const isCurrent = chapterId === progress.lastChapter;

            return `
              <li class="chapter-list__item ${isCurrent ? 'chapter-list__item--current' : ''}" data-chapter="${chapterId}">
                <span class="chapter-list__status">
                  ${completed ? '✓' : isCurrent ? '●' : '○'}
                </span>
                <span class="chapter-list__number">${t('chapter')} ${index + 1}</span>
                <span class="chapter-list__arrow">→</span>
              </li>
            `;
          }).join('')}
        </ul>
      </section>

      <button class="btn btn--secondary book-detail__download" id="download-btn">
        📥 ${t('downloadForOffline')}
      </button>
    `;

    bindEvents();
  }

  function renderError() {
    el.innerHTML = `
      <div class="book-detail__error">
        <p>${t('error')}</p>
        <button class="btn btn--secondary" id="back-btn">${t('backToLibrary')}</button>
      </div>
    `;

    el.querySelector('#back-btn')?.addEventListener('click', () => navigate('/'));
  }

  function bindEvents() {
    // Continue button
    el.querySelector('.book-detail__continue')?.addEventListener('click', (e) => {
      const chapterId = e.currentTarget.dataset.chapter;
      navigate(`/book/${bookId}/${chapterId}`);
    });

    // Chapter list items
    el.querySelectorAll('.chapter-list__item').forEach(item => {
      item.addEventListener('click', () => {
        const chapterId = item.dataset.chapter;
        navigate(`/book/${bookId}/${chapterId}`);
      });
    });

    // Download button (TODO: implement offline service)
    el.querySelector('#download-btn')?.addEventListener('click', () => {
      console.log('Download for offline - to be implemented');
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
