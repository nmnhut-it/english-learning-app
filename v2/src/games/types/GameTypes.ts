/**
 * Core types for the Vocabulary Gamification System
 */

export type PartOfSpeech =
  | 'n'
  | 'v'
  | 'adj'
  | 'adv'
  | 'prep'
  | 'phr'
  | 'n.phr'
  | 'v.phr'
  | 'adj.phr'
  | 'prep.phr'
  | 'phr.v'
  | 'modal verb'
  | 'interj'
  | 'conj'
  | 'art'
  | 'pron';

export interface VocabularyItem {
  id: string;
  word: string;
  partOfSpeech: PartOfSpeech;
  pronunciation: {
    ipa: string;
    audioUrl?: string;
  };
  meaning: string;
  examples?: {
    english: string;
    vietnamese?: string;
  }[];
  synonyms?: string[];
  difficulty: 1 | 2 | 3;
  grade: number;
  unit: number;
  lesson: string;
}

export interface VocabularySet {
  id: string;
  grade: number;
  unit: number;
  lesson: string;
  title: string;
  items: VocabularyItem[];
}

export interface WordProgress {
  wordId: string;
  correctCount: number;
  incorrectCount: number;
  lastReviewed: Date;
  nextReview: Date;
  masteryLevel: 0 | 1 | 2 | 3 | 4 | 5;
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string;
  weeklyActivity: boolean[];
}

export interface UserStats {
  totalWordsLearned: number;
  totalPoints: number;
  achievements: string[];
  streak: UserStreak;
  progressByGrade: Record<number, GradeProgress>;
}

export interface GradeProgress {
  grade: number;
  unitsCompleted: number;
  totalUnits: number;
  wordsLearned: number;
  totalWords: number;
  averageMastery: number;
}

export type GameMode = 'learn' | 'practice' | 'review' | 'compete';

export type GameType =
  | 'flashcard'
  | 'meaning-match'
  | 'pronunciation-pop'
  | 'spell-speak'
  | 'context-fill'
  | 'word-blitz'
  | 'boss-battle';

export interface GameConfig {
  mode: GameMode;
  gameType: GameType;
  vocabularySet: VocabularySet;
  timeLimit?: number;
  wordLimit?: number;
  difficulty?: 1 | 2 | 3;
}

export interface GameResult {
  gameType: GameType;
  vocabularySetId: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  timeSpent: number;
  wordResults: WordResult[];
  achievements: string[];
  streakBonus: number;
}

export interface WordResult {
  wordId: string;
  correct: boolean;
  timeSpent: number;
  attempts: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: UserStats) => boolean;
  unlocked: boolean;
  unlockedAt?: Date;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🌱',
    condition: (stats) => stats.totalWordsLearned >= 1,
    unlocked: false,
  },
  {
    id: 'word-warrior',
    name: 'Word Warrior',
    description: 'Learn 100 words',
    icon: '⚔️',
    condition: (stats) => stats.totalWordsLearned >= 100,
    unlocked: false,
  },
  {
    id: 'pronunciation-pro',
    name: 'Pronunciation Pro',
    description: '50 correct pronunciation matches',
    icon: '🎤',
    condition: () => false, // Tracked separately
    unlocked: false,
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete word blitz in under 30 seconds',
    icon: '⚡',
    condition: () => false, // Tracked separately
    unlocked: false,
  },
  {
    id: 'perfect-week',
    name: 'Perfect Week',
    description: '7-day learning streak',
    icon: '🔥',
    condition: (stats) => stats.streak.currentStreak >= 7,
    unlocked: false,
  },
  {
    id: 'unit-master',
    name: 'Unit Master',
    description: 'Master all words in a unit',
    icon: '👑',
    condition: () => false, // Tracked separately
    unlocked: false,
  },
  {
    id: 'grade-champion',
    name: 'Grade Champion',
    description: 'Complete all units in a grade',
    icon: '🏆',
    condition: () => false, // Tracked separately
    unlocked: false,
  },
];

export const POINTS = {
  CORRECT_ANSWER: 10,
  CORRECT_FIRST_TRY: 15,
  FAST_ANSWER_BONUS: 5,
  STREAK_MULTIPLIER: 1.5,
  COMPLETE_LESSON: 50,
  PERFECT_LESSON: 100,
} as const;
