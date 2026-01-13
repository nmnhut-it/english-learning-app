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
        // Fallback: scan for individual book.json files
        return this.scanForBooks();
      }
      return response.json();
    } catch (err) {
      console.warn('No index.json found, scanning for books...');
      return this.scanForBooks();
    }
  },

  /**
   * Fallback: detect books by known structure
   */
  async scanForBooks() {
    // In production, this would be generated at build time
    // For now, try loading sample-book
    try {
      const sampleBook = await this.loadBook('sample-book');
      return [sampleBook];
    } catch {
      return [];
    }
  },

  /**
   * Load book metadata
   */
  async loadBook(bookId) {
    const response = await fetch(`${BASE_URL}/content/books/${bookId}/book.json`);
    if (!response.ok) {
      throw new Error(`Book not found: ${bookId}`);
    }
    const book = await response.json();
    book.id = bookId;

    // Resolve cover image path
    if (book.coverImage && !book.coverImage.startsWith('http')) {
      book.coverImage = `${BASE_URL}/content/media/${bookId}/images/${book.coverImage}`;
    }

    return book;
  },

  /**
   * Load chapter content
   */
  async loadChapter(bookId, chapterId) {
    const response = await fetch(`${BASE_URL}/content/books/${bookId}/chapters/${chapterId}.json`);
    if (!response.ok) {
      throw new Error(`Chapter not found: ${bookId}/${chapterId}`);
    }
    return response.json();
  },

  /**
   * Get media URL (audio/image/video)
   */
  getMediaUrl(bookId, filename) {
    if (filename.startsWith('http')) {
      return filename;
    }
    return `${BASE_URL}/content/media/${bookId}/audio/${filename}`;
  },

  /**
   * Preload media files for offline use
   */
  async preloadChapter(bookId, chapter) {
    const mediaFiles = [];

    chapter.sections.forEach(section => {
      if (section.type === 'audio' && section.src) {
        mediaFiles.push(this.getMediaUrl(bookId, section.src));
      }
      if (section.type === 'image' && section.src && !section.src.startsWith('http')) {
        mediaFiles.push(`${BASE_URL}/content/media/${bookId}/images/${section.src}`);
      }
    });

    // Preload using link hints
    mediaFiles.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }
};
