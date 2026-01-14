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
   * Get last read chapter for a book
   */
  getLastChapter(bookId) {
    const progress = this.getProgress(bookId);
    return progress?.lastChapter || null;
  },

  /**
   * Save reading progress
   */
  saveProgress(bookId, chapterId, sectionIndex = 0) {
    const all = this.getAll();
    const existing = all[bookId] || { chapters: {} };

    existing.lastChapter = chapterId;
    existing.lastUpdated = Date.now();
    existing.chapters[chapterId] = {
      sectionIndex,
      timestamp: Date.now()
    };

    all[bookId] = existing;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('Failed to save progress:', e);
    }
  },

  /**
   * Calculate overall book progress percentage
   */
  calculatePercent(bookId, totalChapters) {
    const progress = this.getProgress(bookId);
    if (!progress?.chapters) return 0;

    const completed = Object.keys(progress.chapters).length;
    return Math.round((completed / totalChapters) * 100);
  },

  /**
   * Clear progress for a book
   */
  clearProgress(bookId) {
    const all = this.getAll();
    delete all[bookId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
};
