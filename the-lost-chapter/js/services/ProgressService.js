/**
 * Progress tracking service using localStorage
 */

const PROGRESS_KEY = 'tlc_progress';
const SETTINGS_KEY = 'tlc_settings';

const DEFAULT_SETTINGS = {
  theme: 'light',
  lang: 'vi',
  audioSpeed: 1.0,
  autoPlay: true
};

let progress = {};
let settings = { ...DEFAULT_SETTINGS };

// ====== Pure Functions (testable) ======

export function createEmptyBookProgress() {
  return {
    lastChapter: null,
    audioProgress: {},
    completedChapters: [],
    exercises: {}
  };
}

export function validateBookProgress(data) {
  if (!data || typeof data !== 'object') return false;
  if (data.completedChapters && !Array.isArray(data.completedChapters)) return false;
  if (data.audioProgress && typeof data.audioProgress !== 'object') return false;
  if (data.exercises && typeof data.exercises !== 'object') return false;
  return true;
}

export function validateSettings(data) {
  if (!data || typeof data !== 'object') return false;
  if (data.theme && !['light', 'dark'].includes(data.theme)) return false;
  if (data.lang && !['vi', 'en'].includes(data.lang)) return false;
  if (data.audioSpeed && (typeof data.audioSpeed !== 'number' || data.audioSpeed < 0.5 || data.audioSpeed > 2)) return false;
  return true;
}

function ensureBookProgress(bookId) {
  if (!progress[bookId] || !validateBookProgress(progress[bookId])) {
    progress[bookId] = createEmptyBookProgress();
  }
  return progress[bookId];
}

// ====== Progress ======

export function getBookProgress(bookId) {
  const bp = progress[bookId];
  if (!bp || !validateBookProgress(bp)) {
    return createEmptyBookProgress();
  }
  return bp;
}

export function setLastChapter(bookId, chapterId) {
  ensureBookProgress(bookId);
  progress[bookId].lastChapter = chapterId;
  saveProgress();
}

export function setAudioProgress(bookId, audioFile, time) {
  ensureBookProgress(bookId);
  progress[bookId].audioProgress[audioFile] = time;
  saveProgress();
}

export function getAudioProgress(bookId, audioFile) {
  return progress[bookId]?.audioProgress?.[audioFile] || 0;
}

export function markChapterCompleted(bookId, chapterId) {
  ensureBookProgress(bookId);
  if (!progress[bookId].completedChapters.includes(chapterId)) {
    progress[bookId].completedChapters.push(chapterId);
    saveProgress();
  }
}

export function isChapterCompleted(bookId, chapterId) {
  return progress[bookId]?.completedChapters?.includes(chapterId) || false;
}

export function setExerciseCompleted(bookId, exerciseId, correct) {
  ensureBookProgress(bookId);
  progress[bookId].exercises[exerciseId] = correct;
  saveProgress();
}

export function getExerciseStatus(bookId, exerciseId) {
  return progress[bookId]?.exercises?.[exerciseId];
}

export function getBookCompletionPercent(bookId, totalChapters) {
  const completed = progress[bookId]?.completedChapters?.length || 0;
  if (!totalChapters) return 0;
  return Math.round((completed / totalChapters) * 100);
}

// ====== Settings ======

export function getSetting(key) {
  return settings[key];
}

export function setSetting(key, value) {
  settings[key] = value;
  saveSettings();

  // Apply theme immediately
  if (key === 'theme') {
    document.documentElement.setAttribute('data-theme', value);
  }
}

export function getSettings() {
  return { ...settings };
}

// ====== Persistence ======

function saveProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function initProgress() {
  try {
    // Load and validate progress
    const savedProgress = localStorage.getItem(PROGRESS_KEY);
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      if (parsed && typeof parsed === 'object') {
        // Validate each book's progress
        progress = {};
        for (const [bookId, bookData] of Object.entries(parsed)) {
          if (validateBookProgress(bookData)) {
            progress[bookId] = bookData;
          }
        }
      }
    }

    // Load and validate settings
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (validateSettings(parsed)) {
        settings = { ...DEFAULT_SETTINGS, ...parsed };
      }
    }

    // Apply saved theme
    document.documentElement.setAttribute('data-theme', settings.theme);

  } catch (e) {
    console.error('Failed to load saved data:', e);
    // Reset to defaults on error
    progress = {};
    settings = { ...DEFAULT_SETTINGS };
  }
}
