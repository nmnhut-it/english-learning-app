/**
 * Game Configuration
 */

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

/**
 * Cheerful color palette for classroom use.
 * Light, friendly colors suitable for students and teachers.
 */
const COLORS = {
  // Backgrounds - soft, inviting colors
  BACKGROUND: 0xf0f9ff,    // Light sky blue
  BG_DARK: 0xe0f2fe,       // Slightly darker sky blue
  BG_CARD: 0xffffff,       // White cards
  BG_LIGHT: 0xfef3c7,      // Warm cream for highlights

  // Primary actions - friendly blue/purple
  PRIMARY: 0x3b82f6,       // Bright blue
  SECONDARY: 0x8b5cf6,     // Purple

  // Feedback colors - clear but not harsh
  CORRECT: 0x22c55e,       // Green (success)
  INCORRECT: 0xf87171,     // Soft red (not scary)
  WARNING: 0xfbbf24,       // Warm yellow

  // Text - readable on light backgrounds
  TEXT: 0x1e293b,          // Dark slate
  TEXT_MUTED: 0x64748b,    // Medium gray

  // Fun accent colors
  GOLD: 0xfbbf24,          // Achievement gold
  STREAK: 0xf97316,        // Orange for streaks
  ACCENT_PINK: 0xec4899,   // Fun pink
  ACCENT_CYAN: 0x06b6d4,   // Cyan
  ACCENT_LIME: 0x84cc16,   // Lime green
};

const COLOR_STRINGS = {
  BACKGROUND: '#f0f9ff',
  BG_DARK: '#e0f2fe',
  BG_CARD: '#ffffff',
  BG_LIGHT: '#fef3c7',
  PRIMARY: '#3b82f6',
  SECONDARY: '#8b5cf6',
  CORRECT: '#22c55e',
  INCORRECT: '#f87171',
  WARNING: '#fbbf24',
  TEXT: '#1e293b',
  TEXT_MUTED: '#64748b',
  GOLD: '#fbbf24',
  STREAK: '#f97316',
  ACCENT_PINK: '#ec4899',
  ACCENT_CYAN: '#06b6d4',
  ACCENT_LIME: '#84cc16',
};

const POINTS = {
  CORRECT_ANSWER: 10,
  CORRECT_FIRST_TRY: 15,
  FAST_ANSWER_BONUS: 5,
  STREAK_MULTIPLIER: 1.5,
  COMPLETE_LESSON: 50,
  PERFECT_LESSON: 100,
};

const TIMING = {
  FAST_ANSWER_THRESHOLD: 3000,
  ANSWER_FEEDBACK_DURATION: 1000,
};
