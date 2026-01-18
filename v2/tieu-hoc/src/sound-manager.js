/**
 * Sound manager module - Handles all audio playback
 */

const SOUND_BASE_PATH = './sound/';

const SOUND_FILES = {
  CORRECT: 'correct.mp3',
  WRONG: 'wrong.mp3',
  CLICK: 'click.mp3',
  STREAK: 'tink.mp3',
  GAME_START: 'game-start.mp3',
  GAME_OVER: 'game-over.mp3',
  TICK: 'tick.mp3',
  TIME_WARNING: 'time-warning.mp3'
};

const DEFAULT_VOLUME = 0.5;
const STREAK_VOLUME = 0.6;
const FEEDBACK_VOLUME = 0.7;

let soundCache = new Map();
let isMuted = false;

/**
 * Preloads all sound files into cache
 * @returns {Promise<void>}
 */
export async function preloadSounds() {
  const loadPromises = Object.values(SOUND_FILES).map(filename => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(`${SOUND_BASE_PATH}${filename}`);
      audio.preload = 'auto';

      audio.addEventListener('canplaythrough', () => {
        soundCache.set(filename, audio);
        resolve();
      }, { once: true });

      audio.addEventListener('error', (error) => {
        console.warn(`Failed to load sound: ${filename}`, error);
        resolve(); // Don't reject, just skip this sound
      });

      audio.load();
    });
  });

  try {
    await Promise.all(loadPromises);
    console.log(`Loaded ${soundCache.size} sound files`);
  } catch (error) {
    console.error('Error preloading sounds:', error);
  }
}

/**
 * Plays a sound by filename
 * @param {string} soundKey - Key from SOUND_FILES
 * @param {number} volume - Volume level (0-1)
 */
function playSound(soundKey, volume = DEFAULT_VOLUME) {
  if (isMuted) return;

  const filename = SOUND_FILES[soundKey];
  if (!filename) {
    console.warn(`Sound key not found: ${soundKey}`);
    return;
  }

  let audio = soundCache.get(filename);

  if (!audio) {
    // Fallback: create and play immediately
    audio = new Audio(`${SOUND_BASE_PATH}${filename}`);
  } else {
    // Clone to allow multiple simultaneous plays
    audio = audio.cloneNode();
  }

  audio.volume = Math.min(1, Math.max(0, volume));
  audio.play().catch(error => {
    console.warn(`Failed to play sound ${filename}:`, error);
  });
}

/**
 * Plays correct answer sound
 */
export function playCorrectSound() {
  playSound('CORRECT', FEEDBACK_VOLUME);
}

/**
 * Plays wrong answer sound
 */
export function playWrongSound() {
  playSound('WRONG', FEEDBACK_VOLUME);
}

/**
 * Plays click sound
 */
export function playClickSound() {
  playSound('CLICK', 0.3);
}

/**
 * Plays streak achievement sound
 */
export function playStreakSound() {
  playSound('STREAK', STREAK_VOLUME);
}

/**
 * Plays game start sound
 */
export function playGameStartSound() {
  playSound('GAME_START', DEFAULT_VOLUME);
}

/**
 * Plays game over sound
 */
export function playGameOverSound() {
  playSound('GAME_OVER', DEFAULT_VOLUME);
}

/**
 * Plays navigation tick sound
 */
export function playTickSound() {
  playSound('TICK', 0.2);
}

/**
 * Plays time warning sound
 */
export function playTimeWarningSound() {
  playSound('TIME_WARNING', DEFAULT_VOLUME);
}

/**
 * Toggles mute state
 * @returns {boolean} New mute state
 */
export function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem('ioe-quiz-muted', isMuted.toString());
  return isMuted;
}

/**
 * Gets current mute state
 * @returns {boolean} True if muted
 */
export function isSoundMuted() {
  return isMuted;
}

/**
 * Initializes sound system and loads mute preference
 */
export function initSoundSystem() {
  const savedMuteState = localStorage.getItem('ioe-quiz-muted');
  isMuted = savedMuteState === 'true';

  preloadSounds();
}
