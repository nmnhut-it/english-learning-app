/**
 * Phaser Game Configuration
 */

import Phaser from 'phaser';

// Game dimensions
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

// Colors (matching the design system)
export const COLORS = {
  // Primary
  PRIMARY: 0x6366f1,
  SECONDARY: 0x8b5cf6,

  // Feedback
  CORRECT: 0x10b981,
  INCORRECT: 0xef4444,
  WARNING: 0xf59e0b,

  // Background
  BG_DARK: 0x1a1a2e,
  BG_CARD: 0x16213e,
  BG_LIGHT: 0x0f3460,

  // Text
  TEXT: 0xe2e8f0,
  TEXT_MUTED: 0x94a3b8,

  // Accents
  GOLD: 0xfbbf24,
  STREAK: 0xf97316,
} as const;

// Hex string versions for CSS/Phaser text
export const COLOR_STRINGS = {
  PRIMARY: '#6366f1',
  SECONDARY: '#8b5cf6',
  CORRECT: '#10b981',
  INCORRECT: '#ef4444',
  WARNING: '#f59e0b',
  BG_DARK: '#1a1a2e',
  BG_CARD: '#16213e',
  TEXT: '#e2e8f0',
  TEXT_MUTED: '#94a3b8',
  GOLD: '#fbbf24',
  STREAK: '#f97316',
} as const;

// Typography
export const FONTS = {
  PRIMARY: 'Inter, system-ui, sans-serif',
  DISPLAY: 'Inter, system-ui, sans-serif',
} as const;

export const FONT_SIZES = {
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 20,
  XL: 24,
  XXL: 32,
  DISPLAY: 48,
} as const;

// Game timing
export const TIMING = {
  FAST_ANSWER_THRESHOLD: 3000, // 3 seconds for fast answer bonus
  DEFAULT_TIME_LIMIT: 60000, // 60 seconds for timed games
  ANSWER_FEEDBACK_DURATION: 1000, // 1 second to show correct/incorrect
  TRANSITION_DURATION: 300, // Animation transitions
} as const;

// Points system
export const POINTS = {
  CORRECT_ANSWER: 10,
  CORRECT_FIRST_TRY: 15,
  FAST_ANSWER_BONUS: 5,
  STREAK_MULTIPLIER: 1.5,
  COMPLETE_LESSON: 50,
  PERFECT_LESSON: 100,
} as const;

// Streak thresholds
export const STREAK_THRESHOLDS = {
  SMALL: 3,
  MEDIUM: 5,
  LARGE: 10,
} as const;

// Spaced repetition intervals (in days)
export const REVIEW_INTERVALS = [0, 1, 1, 2, 3, 5, 8] as const;

// Scene keys
export const SCENES = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  LEARN: 'LearnScene',
  MEANING_MATCH: 'MeaningMatchScene',
  PRONUNCIATION: 'PronunciationScene',
  SPELL: 'SpellScene',
  CONTEXT_FILL: 'ContextFillScene',
  BLITZ: 'BlitzScene',
  BOSS: 'BossScene',
  RESULTS: 'ResultsScene',
} as const;

// Asset keys
export const ASSETS = {
  // UI
  BUTTON: 'button',
  BUTTON_HOVER: 'button-hover',
  CARD: 'card',
  STAR: 'star',
  STAR_EMPTY: 'star-empty',

  // Icons
  SOUND_ON: 'sound-on',
  SOUND_OFF: 'sound-off',
  SETTINGS: 'settings',
  BACK: 'back',
  STREAK: 'streak',

  // Effects
  CORRECT_PARTICLE: 'correct-particle',
  INCORRECT_PARTICLE: 'incorrect-particle',
} as const;

/**
 * Create Phaser game configuration
 */
export function createGameConfig(
  scenes: Phaser.Types.Scenes.SceneType[],
  parent: string = 'game-container'
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: COLORS.BG_DARK,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: scenes,
    dom: {
      createContainer: true, // Allow DOM elements in Phaser
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: true,
    },
    audio: {
      disableWebAudio: false,
    },
  };
}

/**
 * Common text style configurations
 */
export const TEXT_STYLES = {
  title: {
    fontFamily: FONTS.DISPLAY,
    fontSize: `${FONT_SIZES.XXL}px`,
    color: COLOR_STRINGS.TEXT,
    fontStyle: 'bold',
  },
  subtitle: {
    fontFamily: FONTS.PRIMARY,
    fontSize: `${FONT_SIZES.LG}px`,
    color: COLOR_STRINGS.TEXT_MUTED,
  },
  body: {
    fontFamily: FONTS.PRIMARY,
    fontSize: `${FONT_SIZES.MD}px`,
    color: COLOR_STRINGS.TEXT,
  },
  word: {
    fontFamily: FONTS.DISPLAY,
    fontSize: `${FONT_SIZES.XL}px`,
    color: COLOR_STRINGS.TEXT,
    fontStyle: 'bold',
  },
  pronunciation: {
    fontFamily: FONTS.PRIMARY,
    fontSize: `${FONT_SIZES.LG}px`,
    color: COLOR_STRINGS.TEXT_MUTED,
  },
  meaning: {
    fontFamily: FONTS.PRIMARY,
    fontSize: `${FONT_SIZES.MD}px`,
    color: COLOR_STRINGS.SECONDARY,
  },
  score: {
    fontFamily: FONTS.DISPLAY,
    fontSize: `${FONT_SIZES.LG}px`,
    color: COLOR_STRINGS.GOLD,
    fontStyle: 'bold',
  },
  streak: {
    fontFamily: FONTS.DISPLAY,
    fontSize: `${FONT_SIZES.MD}px`,
    color: COLOR_STRINGS.STREAK,
    fontStyle: 'bold',
  },
  button: {
    fontFamily: FONTS.PRIMARY,
    fontSize: `${FONT_SIZES.MD}px`,
    color: COLOR_STRINGS.TEXT,
    fontStyle: 'bold',
  },
  timer: {
    fontFamily: FONTS.DISPLAY,
    fontSize: `${FONT_SIZES.XL}px`,
    color: COLOR_STRINGS.TEXT,
    fontStyle: 'bold',
  },
} as const;

/**
 * Difficulty settings
 */
export const DIFFICULTY_SETTINGS = {
  easy: {
    optionCount: 3,
    timeLimit: 90000,
    hintEnabled: true,
    streakMultiplier: 1.0,
  },
  medium: {
    optionCount: 4,
    timeLimit: 60000,
    hintEnabled: false,
    streakMultiplier: 1.5,
  },
  hard: {
    optionCount: 5,
    timeLimit: 45000,
    hintEnabled: false,
    streakMultiplier: 2.0,
  },
} as const;
