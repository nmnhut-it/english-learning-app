/**
 * ChapterReader component - renders chapter content with audio sync
 */

import { getBook, getChapter, getAudioUrl } from '../services/ContentService.js';
import { setLastChapter, markChapterCompleted, getSetting } from '../services/ProgressService.js';
import { t, getLanguage, setLanguage, onLanguageChange } from '../services/I18nService.js';
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
  let audioPlayers = []; // Support multiple audio sections
  let unsubscribeLang = null;

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
    const currentLang = getLanguage();
    const isBilingual = book.language === 'vi-en';

    el.innerHTML = `
      <header class="reader__header">
        <button class="btn btn--icon reader__back-btn" id="back-btn">←</button>
        <h2 class="reader__title">${chapter.title || `${t('chapter')} ${getChapterIndex() + 1}`}</h2>
        ${isBilingual ? `
          <div class="reader__lang-toggle">
            <button class="btn btn--small ${currentLang === 'vi' ? 'btn--primary' : 'btn--secondary'}" data-lang="vi">VI</button>
            <button class="btn btn--small ${currentLang === 'en' ? 'btn--primary' : 'btn--secondary'}" data-lang="en">EN</button>
          </div>
        ` : ''}
      </header>

      <article class="reader__content">
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

    renderSections(currentLang);
    bindEvents();
  }

  function renderSections(lang) {
    const sectionsContainer = el.querySelector('#sections-container');
    sectionsContainer.innerHTML = '';

    // Clear previous audio players
    audioPlayers.forEach(player => player.destroy());
    audioPlayers = [];

    // Filter sections by language
    const sections = (chapter.sections || []).filter(section => {
      // Exercises don't have lang field - always show
      if (section.type === 'exercise') return true;
      // Audio sections - always show (we'll pick the right file)
      if (section.type === 'audio') return true;
      // Image sections - always show
      if (section.type === 'image') return true;
      // Markdown with lang field - filter by current language
      if (section.lang) return section.lang === lang;
      // Markdown without lang field (legacy) - always show
      return true;
    });

    // Render each section
    sections.forEach((section, index) => {
      const sectionEl = renderSection(section, index, lang);
      sectionsContainer.appendChild(sectionEl);
    });

    // Auto-add audio player for chapter if book has audio
    addChapterAudioPlayer(lang);
  }

  function addChapterAudioPlayer(lang) {
    // Check if there's an audio file for this chapter
    const audioFile = `${chapterId}-${lang}.wav`;
    const audioUrl = getAudioUrl(bookId, audioFile);

    // Create audio section at the top
    const audioSection = document.createElement('div');
    audioSection.className = 'reader__section reader__section--audio reader__chapter-audio';

    const playerContainer = document.createElement('div');
    playerContainer.className = 'reader__audio-section';
    playerContainer.dataset.audioIndex = audioPlayers.length;

    const player = AudioPlayer({
      bookId,
      audioFile: audioFile,
      timestamps: [],
      onSentenceChange: () => {}
    });

    audioPlayers.push(player);
    playerContainer.appendChild(player.el);
    audioSection.appendChild(playerContainer);

    // Insert at the beginning of sections
    const sectionsContainer = el.querySelector('#sections-container');
    sectionsContainer.insertBefore(audioSection, sectionsContainer.firstChild);
  }

  function renderSection(section, index, lang) {
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
        // Use language-specific audio file
        const audioFile = section.src || `${chapterId}-${lang}.wav`;

        // Create audio player with transcript
        const playerContainer = document.createElement('div');
        playerContainer.className = 'reader__audio-section';
        playerContainer.dataset.audioIndex = audioPlayers.length;

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

        // Audio player - store in array
        const player = AudioPlayer({
          bookId,
          audioFile: audioFile,
          timestamps: section.timestamps || [],
          onSentenceChange: (idx, timestamp) => {
            highlightSentence(playerContainer, idx);
          }
        });

        audioPlayers.push(player);
        playerContainer.appendChild(player.el);
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
    // Back button
    el.querySelector('#back-btn')?.addEventListener('click', () => {
      navigate(`/book/${bookId}`);
    });

    // Language toggle
    el.querySelectorAll('.reader__lang-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        setLanguage(lang);
      });
    });

    // Listen for language changes
    unsubscribeLang = onLanguageChange((newLang) => {
      // Update toggle buttons
      el.querySelectorAll('.reader__lang-toggle button').forEach(btn => {
        btn.classList.toggle('btn--primary', btn.dataset.lang === newLang);
        btn.classList.toggle('btn--secondary', btn.dataset.lang !== newLang);
      });
      // Re-render sections with new language
      renderSections(newLang);
    });

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

    // Click on sentence to seek - find correct audio player
    el.querySelectorAll('.reader__audio-section').forEach(section => {
      const audioIndex = parseInt(section.dataset.audioIndex, 10);
      const player = audioPlayers[audioIndex];

      section.querySelectorAll('.sentence').forEach(sentence => {
        sentence.addEventListener('click', () => {
          const start = parseFloat(sentence.dataset.start);
          if (player && !isNaN(start)) {
            player.seekTo(start);
            player.play();
          }
        });
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
      // Unsubscribe from language changes
      if (unsubscribeLang) unsubscribeLang();
      // Clean up all audio players
      audioPlayers.forEach(player => player.destroy());
      audioPlayers = [];
      el.remove();
    }
  };
}
