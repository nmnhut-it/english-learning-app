/**
 * BookReader Component - Main reading interface
 */

import { ContentService } from '../services/ContentService.js';
import { createAudioPlayer } from './AudioPlayer.js';
import { createContentBlock } from './ContentBlock.js';

export function createBookReader(container, { book, startChapter, onProgress }) {
  // Add reader CSS if not loaded
  if (!document.getElementById('reader-styles')) {
    const link = document.createElement('link');
    link.id = 'reader-styles';
    link.rel = 'stylesheet';
    link.href = './styles/reader.css';
    document.head.appendChild(link);
  }

  let currentChapterId = startChapter;
  let currentChapter = null;
  let sectionCleanups = [];

  const element = document.createElement('div');
  element.className = 'reader';

  async function loadChapter(chapterId) {
    // Cleanup previous sections
    sectionCleanups.forEach(fn => fn?.());
    sectionCleanups = [];

    currentChapterId = chapterId;
    currentChapter = await ContentService.loadChapter(book.id, chapterId);

    render();

    if (onProgress) {
      onProgress(chapterId, 0);
    }
  }

  function render() {
    element.innerHTML = `
      <div class="reader-header">
        <a href="#/" class="reader-back">&larr; Library</a>
        <h1 class="reader-title">${book.title}</h1>
        <div class="chapter-nav">
          <select class="chapter-select">
            ${book.chapters.map(chId =>
              `<option value="${chId}" ${chId === currentChapterId ? 'selected' : ''}>
                ${chId}
              </option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div class="reader-content"></div>
      <div class="reader-footer">
        <button class="btn btn-nav prev-chapter" ${getPrevChapter() ? '' : 'disabled'}>
          &larr; Previous
        </button>
        <button class="btn btn-nav next-chapter" ${getNextChapter() ? '' : 'disabled'}>
          Next &rarr;
        </button>
      </div>
    `;

    // Chapter selector
    const select = element.querySelector('.chapter-select');
    select.addEventListener('change', (e) => loadChapter(e.target.value));

    // Navigation buttons
    element.querySelector('.prev-chapter').addEventListener('click', () => {
      const prev = getPrevChapter();
      if (prev) loadChapter(prev);
    });

    element.querySelector('.next-chapter').addEventListener('click', () => {
      const next = getNextChapter();
      if (next) loadChapter(next);
    });

    // Render content sections
    const contentContainer = element.querySelector('.reader-content');
    renderSections(contentContainer);
  }

  function renderSections(contentContainer) {
    if (!currentChapter?.sections) return;

    currentChapter.sections.forEach((section, index) => {
      const result = createContentBlock(section, {
        bookId: book.id,
        onAudioPlay: (audio) => {
          // Pause other audio players
        },
        onComplete: () => {
          if (onProgress) {
            onProgress(currentChapterId, index + 1);
          }
        }
      });

      contentContainer.appendChild(result.element);

      if (result.cleanup) {
        sectionCleanups.push(result.cleanup);
      }
    });
  }

  function getPrevChapter() {
    const idx = book.chapters.indexOf(currentChapterId);
    return idx > 0 ? book.chapters[idx - 1] : null;
  }

  function getNextChapter() {
    const idx = book.chapters.indexOf(currentChapterId);
    return idx < book.chapters.length - 1 ? book.chapters[idx + 1] : null;
  }

  container.appendChild(element);
  loadChapter(currentChapterId);

  return {
    element,
    loadChapter,
    destroy: () => {
      sectionCleanups.forEach(fn => fn?.());
      element.remove();
    }
  };
}
