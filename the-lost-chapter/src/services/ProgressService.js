/**
 * ProgressService - Track reading progress in localStorage
 */

const STORAGE_KEY = 'tlc_progress';

export const ProgressService = {
  /**
   * Get all progress data
   */
  getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  /**
   * Get progress for a specific book
   */
  getProgress(bookId) {
    const all = this.getAll();
    return all[bookId] || null;
  },

  /**
   * Save progress for a book
   */
  saveProgress(bookId, chapterId, sectionIndex = 0) {
    const all = this.getAll();
    all[bookId] = {
      chapterId,
      sectionIndex,
      lastRead: Date.now()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('Failed to save progress:', e);
    }
  },

  /**
   * Clear progress for a book
   */
  clearProgress(bookId) {
    const all = this.getAll();
    delete all[bookId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  /**
   * Get recently read books (sorted by lastRead)
   */
  getRecentBooks(limit = 5) {
    const all = this.getAll();
    return Object.entries(all)
      .map(([bookId, progress]) => ({ bookId, ...progress }))
      .sort((a, b) => b.lastRead - a.lastRead)
      .slice(0, limit);
  }
};
