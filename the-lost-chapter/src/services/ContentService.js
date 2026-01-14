/**
 * ContentService - Loads book content from local files or GitHub
 */

const BASE_URL = import.meta.env?.DEV ? '' : (import.meta.env?.VITE_CONTENT_URL || '');

export const ContentService = {
  /**
   * Load all books in library
   */
  async loadLibrary() {
    try {
      const response = await fetch(`${BASE_URL}/content/books/index.json`);
      if (!response.ok) {
        return this.scanForBooks();
      }
      const data = await response.json();
      return data.books || [];
    } catch (err) {
      console.warn('No index.json found, scanning for books...');
      return [];
    }
  },

  /**
   * Load a specific book's metadata
   */
  async loadBook(bookId) {
    const response = await fetch(`${BASE_URL}/content/books/${bookId}/book.json`);
    if (!response.ok) {
      throw new Error(`Book not found: ${bookId}`);
    }
    return response.json();
  },

  /**
   * Load a chapter's content
   */
  async loadChapter(bookId, chapterId) {
    const response = await fetch(`${BASE_URL}/content/books/${bookId}/chapters/${chapterId}.json`);
    if (!response.ok) {
      throw new Error(`Chapter not found: ${chapterId}`);
    }
    return response.json();
  },

  /**
   * Get media URL for a book asset
   */
  getMediaUrl(bookId, type, filename) {
    return `${BASE_URL}/content/media/${bookId}/${type}/${filename}`;
  },

  /**
   * Preload audio files for a chapter
   */
  async preloadChapterAudio(bookId, chapter) {
    const audioSections = chapter.sections?.filter(s => s.type === 'audio') || [];

    const preloads = audioSections.map(section => {
      const src = section.src.startsWith('http')
        ? section.src
        : this.getMediaUrl(bookId, 'audio', section.src);

      return new Promise((resolve) => {
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.src = src;
        audio.onloadedmetadata = () => resolve({ src, duration: audio.duration });
        audio.onerror = () => resolve({ src, error: true });
      });
    });

    return Promise.all(preloads);
  }
};
