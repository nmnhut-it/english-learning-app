/**
 * ChapterReader component - renders chapter content with audio sync
 */

import { getBook, getChapter } from '../services/ContentService.js';
import { setLastChapter, markChapterCompleted } from '../services/ProgressService.js';
import { t } from '../services/I18nService.js';
import { navigate } from '../utils/router.js';
import { AudioPlayer } from './AudioPlayer.js';
import { Exercise } from './Exercise.js';
import { parseMarkdown } from '../utils/markdown.js';

export function ChapterReader(props) {
  const { bookId, chapterId } = props;

  const el = document.createElement('div');
  el.className = 'reader';

  let book = null;
  let chapter = null;
  let audioPlayer = null;

  async function render() {
    el.innerHTML = `
      <div class="loading">
        <div class="loading__spinner"></div>
      </div>
    `;

    try {
      [book, chapter] = await Promise.all([
        getBook(bookId),
        getChapter(bookId, chapterId)
      ]);

      if (book && chapter) {
        setLastChapter(bookId, chapterId);
        renderChapter();
      } else {
        renderError();
      }
    } catch (error) {
      console.error('Error loading chapter:', error);
      renderError();
    }
  }

  function renderChapter() {
    el.innerHTML = `
      <article class="reader__content">
        <h2 class="reader__title">${chapter.title || `${t('chapter')} ${getChapterIndex() + 1}`}</h2>
        <div class="reader__sections" id="sections-container"></div>
      </article>

      <nav class="reader__nav">
        <button class="btn btn--secondary reader__nav-btn" id="prev-btn" ${!getPrevChapter() ? 'disabled' : ''}>
          ← ${t('previous')}
        </button>
        <button class="btn btn--primary reader__nav-btn" id="next-btn" ${!getNextChapter() ? 'disabled' : ''}>
          ${t('next')} →
        </button>
      </nav>
    `;

    const sectionsContainer = el.querySelector('#sections-container');

    // Render each section
    (chapter.sections || []).forEach((section, index) => {
      const sectionEl = renderSection(section, index);
      sectionsContainer.appendChild(sectionEl);
    });

    bindEvents();
  }

  function renderSection(section, index) {
    const wrapper = document.createElement('div');
    wrapper.className = `reader__section reader__section--${section.type}`;
    wrapper.dataset.sectionIndex = index;

    switch (section.type) {
      case 'markdown':
        wrapper.innerHTML = `
          <div class="reader__markdown">
            ${parseMarkdown(section.content || '')}
          </div>
        `;
        break;

      case 'audio':
        // Create audio player with transcript
        const playerContainer = document.createElement('div');
        playerContainer.className = 'reader__audio-section';

        // Transcript with sentence highlighting
        if (section.transcript || section.timestamps?.length) {
          const transcriptEl = document.createElement('div');
          transcriptEl.className = 'reader__transcript';

          if (section.timestamps?.length) {
            transcriptEl.innerHTML = section.timestamps.map((ts, i) => `
              <span class="sentence" data-index="${i}" data-start="${ts.start}" data-end="${ts.end}">
                ${ts.text}
              </span>
            `).join(' ');
          } else if (section.transcript) {
            transcriptEl.innerHTML = `<p>${section.transcript}</p>`;
          }

          playerContainer.appendChild(transcriptEl);
        }

        // Audio player
        audioPlayer = AudioPlayer({
          bookId,
          audioFile: section.src,
          timestamps: section.timestamps || [],
          onSentenceChange: (index, timestamp) => {
            highlightSentence(playerContainer, index);
          }
        });

        playerContainer.appendChild(audioPlayer.el);
        wrapper.appendChild(playerContainer);
        break;

      case 'image':
        wrapper.innerHTML = `
          <figure class="reader__image">
            <img src="./content/books/${bookId}/${section.src}" alt="${section.alt || ''}" loading="lazy">
            ${section.caption ? `<figcaption>${section.caption}</figcaption>` : ''}
          </figure>
        `;
        break;

      case 'exercise':
        const exercise = Exercise({
          bookId,
          exercise: section,
          onComplete: (correct) => {
            console.log('Exercise completed:', correct);
          }
        });
        wrapper.appendChild(exercise.el);
        break;

      default:
        wrapper.innerHTML = `<p>${section.content || ''}</p>`;
    }

    return wrapper;
  }

  function highlightSentence(container, index) {
    // Remove previous highlight
    container.querySelectorAll('.sentence--active').forEach(s => {
      s.classList.remove('sentence--active');
    });

    // Add new highlight
    if (index >= 0) {
      const sentence = container.querySelector(`.sentence[data-index="${index}"]`);
      if (sentence) {
        sentence.classList.add('sentence--active');
        sentence.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  function getChapterIndex() {
    return book?.chapters?.indexOf(chapterId) ?? -1;
  }

  function getPrevChapter() {
    const index = getChapterIndex();
    return index > 0 ? book.chapters[index - 1] : null;
  }

  function getNextChapter() {
    const index = getChapterIndex();
    return index >= 0 && index < (book.chapters?.length || 0) - 1
      ? book.chapters[index + 1]
      : null;
  }

  function bindEvents() {
    // Navigation
    el.querySelector('#prev-btn')?.addEventListener('click', () => {
      const prev = getPrevChapter();
      if (prev) navigate(`/book/${bookId}/${prev}`);
    });

    el.querySelector('#next-btn')?.addEventListener('click', () => {
      markChapterCompleted(bookId, chapterId);
      const next = getNextChapter();
      if (next) {
        navigate(`/book/${bookId}/${next}`);
      } else {
        navigate(`/book/${bookId}`);
      }
    });

    // Click on sentence to seek
    el.querySelectorAll('.sentence').forEach(sentence => {
      sentence.addEventListener('click', () => {
        const start = parseFloat(sentence.dataset.start);
        if (audioPlayer && !isNaN(start)) {
          audioPlayer.seekTo(start);
          audioPlayer.play();
        }
      });
    });
  }

  function renderError() {
    el.innerHTML = `
      <div class="reader__error">
        <p>${t('error')}</p>
        <button class="btn btn--secondary" id="back-btn">${t('backToLibrary')}</button>
      </div>
    `;

    el.querySelector('#back-btn')?.addEventListener('click', () => navigate('/'));
  }

  // Initialize
  render();

  return {
    el,
    update: render,
    destroy: () => {
      if (audioPlayer) audioPlayer.destroy();
      el.remove();
    }
  };
}
