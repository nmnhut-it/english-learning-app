/**
 * Spaced Repetition Progress Tracker
 * Tracks word mastery and calculates optimal review intervals
 */

import type {
  WordProgress,
  VocabularyItem,
  VocabularySet,
  UserStats,
  UserStreak,
  GradeProgress,
} from '../types/GameTypes';

const STORAGE_KEYS = {
  WORD_PROGRESS: 'vocab_word_progress',
  USER_STATS: 'vocab_user_stats',
  USER_STREAK: 'vocab_user_streak',
} as const;

export class ProgressTracker {
  private storage: Storage;

  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }

  // ==================== Word Progress ====================

  getWordProgress(wordId: string): WordProgress {
    const all = this.getAllWordProgress();
    return all[wordId] || this.createNewWordProgress(wordId);
  }

  recordAnswer(wordId: string, correct: boolean, timeSpent: number): void {
    const progress = this.getWordProgress(wordId);

    if (correct) {
      progress.correctCount++;
      progress.masteryLevel = Math.min(5, progress.masteryLevel + 1) as 0 | 1 | 2 | 3 | 4 | 5;
      progress.nextReview = this.calculateNextReview(progress.masteryLevel);
    } else {
      progress.incorrectCount++;
      progress.masteryLevel = Math.max(0, progress.masteryLevel - 1) as 0 | 1 | 2 | 3 | 4 | 5;
      progress.nextReview = new Date(); // Review immediately
    }

    progress.lastReviewed = new Date();
    this.saveWordProgress(wordId, progress);

    // Update user stats
    if (correct && progress.correctCount === 1) {
      this.incrementWordsLearned();
    }
  }

  /**
   * Get words that are due for review based on spaced repetition
   */
  getWordsForReview(
    vocabularySet: VocabularySet,
    maxWords: number = 20
  ): VocabularyItem[] {
    const now = new Date();
    const dueWords: VocabularyItem[] = [];
    const newWords: VocabularyItem[] = [];

    for (const item of vocabularySet.items) {
      const progress = this.getWordProgress(item.id);

      if (progress.masteryLevel === 0 && progress.correctCount === 0) {
        // Never seen before
        newWords.push(item);
      } else if (new Date(progress.nextReview) <= now) {
        // Due for review
        dueWords.push(item);
      }
    }

    // Sort due words by how overdue they are
    dueWords.sort((a, b) => {
      const progressA = this.getWordProgress(a.id);
      const progressB = this.getWordProgress(b.id);
      return (
        new Date(progressA.nextReview).getTime() -
        new Date(progressB.nextReview).getTime()
      );
    });

    // Mix: 70% due words, 30% new words
    const reviewCount = Math.min(maxWords, dueWords.length + newWords.length);
    const dueCount = Math.min(dueWords.length, Math.ceil(reviewCount * 0.7));
    const newCount = Math.min(newWords.length, reviewCount - dueCount);

    return [
      ...dueWords.slice(0, dueCount),
      ...this.shuffle(newWords).slice(0, newCount),
    ];
  }

  /**
   * Get mastery statistics for a vocabulary set
   */
  getSetMasteryStats(vocabularySet: VocabularySet): {
    mastered: number;
    learning: number;
    new: number;
    averageMastery: number;
  } {
    let mastered = 0;
    let learning = 0;
    let newCount = 0;
    let totalMastery = 0;

    for (const item of vocabularySet.items) {
      const progress = this.getWordProgress(item.id);
      totalMastery += progress.masteryLevel;

      if (progress.masteryLevel >= 4) {
        mastered++;
      } else if (progress.correctCount > 0) {
        learning++;
      } else {
        newCount++;
      }
    }

    return {
      mastered,
      learning,
      new: newCount,
      averageMastery: vocabularySet.items.length > 0
        ? totalMastery / vocabularySet.items.length
        : 0,
    };
  }

  // ==================== Streak Management ====================

  getStreak(): UserStreak {
    const data = this.storage.getItem(STORAGE_KEYS.USER_STREAK);
    if (!data) {
      return this.createNewStreak();
    }
    return JSON.parse(data);
  }

  updateStreak(): UserStreak {
    const streak = this.getStreak();
    const today = new Date().toISOString().split('T')[0];

    if (streak.lastPlayedDate === today) {
      // Already played today
      return streak;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (streak.lastPlayedDate === yesterdayStr) {
      // Consecutive day
      streak.currentStreak++;
      streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    } else if (streak.lastPlayedDate !== today) {
      // Streak broken
      streak.currentStreak = 1;
    }

    streak.lastPlayedDate = today;

    // Update weekly activity
    const dayOfWeek = new Date().getDay();
    streak.weeklyActivity[dayOfWeek === 0 ? 6 : dayOfWeek - 1] = true;

    this.storage.setItem(STORAGE_KEYS.USER_STREAK, JSON.stringify(streak));
    return streak;
  }

  // ==================== User Stats ====================

  getUserStats(): UserStats {
    const data = this.storage.getItem(STORAGE_KEYS.USER_STATS);
    if (!data) {
      return this.createNewUserStats();
    }
    return JSON.parse(data);
  }

  addPoints(points: number): void {
    const stats = this.getUserStats();
    stats.totalPoints += points;
    this.storage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
  }

  unlockAchievement(achievementId: string): boolean {
    const stats = this.getUserStats();
    if (stats.achievements.includes(achievementId)) {
      return false; // Already unlocked
    }
    stats.achievements.push(achievementId);
    this.storage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
    return true;
  }

  updateGradeProgress(grade: number, progress: Partial<GradeProgress>): void {
    const stats = this.getUserStats();
    if (!stats.progressByGrade[grade]) {
      stats.progressByGrade[grade] = {
        grade,
        unitsCompleted: 0,
        totalUnits: 12,
        wordsLearned: 0,
        totalWords: 0,
        averageMastery: 0,
      };
    }
    stats.progressByGrade[grade] = {
      ...stats.progressByGrade[grade],
      ...progress,
    };
    this.storage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
  }

  // ==================== Private Helpers ====================

  private getAllWordProgress(): Record<string, WordProgress> {
    const data = this.storage.getItem(STORAGE_KEYS.WORD_PROGRESS);
    return data ? JSON.parse(data) : {};
  }

  private saveWordProgress(wordId: string, progress: WordProgress): void {
    const all = this.getAllWordProgress();
    all[wordId] = progress;
    this.storage.setItem(STORAGE_KEYS.WORD_PROGRESS, JSON.stringify(all));
  }

  private createNewWordProgress(wordId: string): WordProgress {
    return {
      wordId,
      correctCount: 0,
      incorrectCount: 0,
      lastReviewed: new Date(0),
      nextReview: new Date(),
      masteryLevel: 0,
    };
  }

  private createNewStreak(): UserStreak {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: '',
      weeklyActivity: [false, false, false, false, false, false, false],
    };
  }

  private createNewUserStats(): UserStats {
    return {
      totalWordsLearned: 0,
      totalPoints: 0,
      achievements: [],
      streak: this.createNewStreak(),
      progressByGrade: {},
    };
  }

  private incrementWordsLearned(): void {
    const stats = this.getUserStats();
    stats.totalWordsLearned++;
    this.storage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
  }

  /**
   * Calculate next review date based on mastery level
   * Uses Fibonacci-like intervals: 0, 1, 1, 2, 3, 5, 8 days
   */
  private calculateNextReview(masteryLevel: number): Date {
    const intervals = [0, 1, 1, 2, 3, 5, 8];
    const days = intervals[masteryLevel] ?? 8;
    const next = new Date();
    next.setDate(next.getDate() + days);
    return next;
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // ==================== Data Export/Import ====================

  exportData(): string {
    return JSON.stringify({
      wordProgress: this.getAllWordProgress(),
      userStats: this.getUserStats(),
      userStreak: this.getStreak(),
    });
  }

  importData(data: string): void {
    try {
      const parsed = JSON.parse(data);
      if (parsed.wordProgress) {
        this.storage.setItem(
          STORAGE_KEYS.WORD_PROGRESS,
          JSON.stringify(parsed.wordProgress)
        );
      }
      if (parsed.userStats) {
        this.storage.setItem(
          STORAGE_KEYS.USER_STATS,
          JSON.stringify(parsed.userStats)
        );
      }
      if (parsed.userStreak) {
        this.storage.setItem(
          STORAGE_KEYS.USER_STREAK,
          JSON.stringify(parsed.userStreak)
        );
      }
    } catch (e) {
      console.error('Failed to import progress data:', e);
    }
  }

  clearAllData(): void {
    this.storage.removeItem(STORAGE_KEYS.WORD_PROGRESS);
    this.storage.removeItem(STORAGE_KEYS.USER_STATS);
    this.storage.removeItem(STORAGE_KEYS.USER_STREAK);
  }
}
