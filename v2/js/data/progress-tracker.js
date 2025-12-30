/**
 * Progress Tracker
 * Handles spaced repetition and user progress
 */

const ProgressTracker = {
  STORAGE_KEY: 'vocab_progress',
  STATS_KEY: 'vocab_stats',

  // Get progress for a word
  getWordProgress(wordId) {
    const all = this.getAllProgress();
    return all[wordId] || {
      wordId,
      correctCount: 0,
      incorrectCount: 0,
      lastReviewed: null,
      nextReview: new Date().toISOString(),
      masteryLevel: 0,
    };
  },

  // Record an answer
  recordAnswer(wordId, correct) {
    const progress = this.getWordProgress(wordId);

    if (correct) {
      progress.correctCount++;
      progress.masteryLevel = Math.min(5, progress.masteryLevel + 1);
      progress.nextReview = this.calculateNextReview(progress.masteryLevel);
    } else {
      progress.incorrectCount++;
      progress.masteryLevel = Math.max(0, progress.masteryLevel - 1);
      progress.nextReview = new Date().toISOString();
    }

    progress.lastReviewed = new Date().toISOString();
    this.saveWordProgress(wordId, progress);

    // Update stats
    if (correct && progress.correctCount === 1) {
      this.incrementWordsLearned();
    }
  },

  // Get words for review
  getWordsForReview(vocabSet, maxWords = 20) {
    const now = new Date();
    const dueWords = [];
    const newWords = [];

    for (const item of vocabSet.items) {
      const progress = this.getWordProgress(item.id);

      if (progress.masteryLevel === 0 && progress.correctCount === 0) {
        newWords.push(item);
      } else if (new Date(progress.nextReview) <= now) {
        dueWords.push(item);
      }
    }

    // Mix: 70% due, 30% new
    const reviewCount = Math.min(maxWords, dueWords.length + newWords.length);
    const dueCount = Math.min(dueWords.length, Math.ceil(reviewCount * 0.7));
    const newCount = Math.min(newWords.length, reviewCount - dueCount);

    return [
      ...this.shuffle(dueWords).slice(0, dueCount),
      ...this.shuffle(newWords).slice(0, newCount),
    ];
  },

  // Calculate next review date
  calculateNextReview(masteryLevel) {
    const intervals = [0, 1, 1, 2, 3, 5, 8];
    const days = intervals[masteryLevel] || 8;
    const next = new Date();
    next.setDate(next.getDate() + days);
    return next.toISOString();
  },

  // Get user stats
  getStats() {
    const data = localStorage.getItem(this.STATS_KEY);
    return data ? JSON.parse(data) : {
      totalWordsLearned: 0,
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: null,
    };
  },

  // Add points
  addPoints(points) {
    const stats = this.getStats();
    stats.totalPoints += points;
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
  },

  // Update streak
  updateStreak() {
    const stats = this.getStats();
    const today = new Date().toISOString().split('T')[0];

    if (stats.lastPlayedDate === today) {
      return stats.currentStreak;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (stats.lastPlayedDate === yesterdayStr) {
      stats.currentStreak++;
    } else {
      stats.currentStreak = 1;
    }

    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    stats.lastPlayedDate = today;

    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    return stats.currentStreak;
  },

  // Helpers
  getAllProgress() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  },

  saveWordProgress(wordId, progress) {
    const all = this.getAllProgress();
    all[wordId] = progress;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
  },

  incrementWordsLearned() {
    const stats = this.getStats();
    stats.totalWordsLearned++;
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
  },

  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },
};
