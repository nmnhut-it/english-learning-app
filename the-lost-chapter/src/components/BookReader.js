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
  let audioPlayer = null;
  let contentBlocks = [];

  const elements = {
    container: null,
    header: null,
    content: null,
    playerContainer: null
  };

  async function init() {
    render();
    await loadChapter(currentChapterId);
  }

  function render() {
    container.innerHTML = '';
    container.className = 'reader';

    elements.header = document.createElement('div');
    elements.header.className = 'reader-header';

    elements.content = document.createElement('div');
    elements.content.className = 'reader-content';

    elements.playerContainer = document.createElement('div');
    elements.playerContainer.className = 'audio-player';

    container.append(elements.header, elements.content, elements.playerContainer);
  }

  async function loadChapter(chapterId) {
    elements.content.innerHTML = '<div class="loading">Loading chapter...</div>';

    try {
      currentChapter = await ContentService.loadChapter(book.id, chapterId);
      currentChapterId = chapterId;
      renderHeader();
      renderContent();
      setupAudioPlayer();
      onProgress?.(chapterId, 0);
    } catch (err) {
      console.error('Failed to load chapter', err);
      elements.content.innerHTML = `
        <div class="error-view">
          <p>Failed to load chapter</p>
          <button class="btn" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  function renderHeader() {
    const chapterIndex = book.chapters.indexOf(currentChapterId);
    elements.header.innerHTML = `
      <a href="#/" class="reader-back">&larr; Library</a>
      <span class="reader-title">${book.title}</span>
      <span class="chapter-title">Chapter ${chapterIndex + 1}: ${currentChapter.title}</span>
    `;
  }

  function renderContent() {
    elements.content.innerHTML = '';
    contentBlocks = [];

    currentChapter.sections.forEach((section, index) => {
      const block = createContentBlock(section, {
        bookId: book.id,
        onAudioPlay: (src) => audioPlayer?.loadAndPlay(src),
        onComplete: () => onProgress?.(currentChapterId, index + 1)
      });
      contentBlocks.push(block);
      elements.content.appendChild(block.element);
    });

    // Add chapter navigation
    renderChapterNav();
  }

  function renderChapterNav() {
    const nav = document.createElement('nav');
    nav.className = 'chapter-nav';

    const chapterIndex = book.chapters.indexOf(currentChapterId);
    const prevChapter = chapterIndex > 0 ? book.chapters[chapterIndex - 1] : null;
    const nextChapter = chapterIndex < book.chapters.length - 1 ? book.chapters[chapterIndex + 1] : null;

    if (prevChapter) {
      nav.innerHTML += `
        <a href="#/book/${book.id}/${prevChapter}" class="chapter-nav-link prev">
          <span class="chapter-nav-label">&larr; Previous</span>
          <span class="chapter-nav-title">Chapter ${chapterIndex}</span>
        </a>
      `;
    }

    if (nextChapter) {
      nav.innerHTML += `
        <a href="#/book/${book.id}/${nextChapter}" class="chapter-nav-link next">
          <span class="chapter-nav-label">Next &rarr;</span>
          <span class="chapter-nav-title">Chapter ${chapterIndex + 2}</span>
        </a>
      `;
    }

    elements.content.appendChild(nav);
  }

  function setupAudioPlayer() {
    // Find first audio section
    const audioSection = currentChapter.sections.find(s => s.type === 'audio');
    if (audioSection) {
      audioPlayer = createAudioPlayer(elements.playerContainer, {
        src: ContentService.getMediaUrl(book.id, audioSection.src),
        timestamps: audioSection.timestamps,
        onTimeUpdate: highlightText
      });
    } else {
      elements.playerContainer.style.display = 'none';
    }
  }

  function highlightText(time) {
    // Sync audio with transcript highlighting
    contentBlocks.forEach(block => {
      if (block.highlightAtTime) {
        block.highlightAtTime(time);
      }
    });
  }

  function destroy() {
    audioPlayer?.destroy();
    contentBlocks.forEach(b => b.destroy?.());
    container.innerHTML = '';
  }

  init();

  return {
    loadChapter,
    destroy
  };
}
