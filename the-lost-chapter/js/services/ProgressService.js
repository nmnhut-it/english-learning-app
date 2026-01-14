/**
 * Progress tracking service using localStorage
 */

const PROGRESS_KEY = 'tlc_progress';
const SETTINGS_KEY = 'tlc_settings';

let progress = {};
let settings = {
  theme: 'light',
  lang: 'vi',
  audioSpeed: 1.0,
  autoPlay: true
};

// ====== Progress ======

export function getBookProgress(bookId) {
  return progress[bookId] || {
    lastChapter: null,
    audioProgress: {},
    completedChapters: [],
    exercises: {}
  };
}

export function setLastChapter(bookId, chapterId) {
  if (!progress[bookId]) {
    progress[bookId] = { lastChapter: null, audioProgress: {}, completedChapters: [], exercises: {} };
  }
  progress[bookId].lastChapter = chapterId;
  saveProgress();
}

export function setAudioProgress(bookId, audioFile, time) {
  if (!progress[bookId]) {
    progress[bookId] = { lastChapter: null, audioProgress: {}, completedChapters: [], exercises: {} };
  }
  progress[bookId].audioProgress[audioFile] = time;
  saveProgress();
}

export function getAudioProgress(bookId, audioFile) {
  return progress[bookId]?.audioProgress?.[audioFile] || 0;
}

export function markChapterCompleted(bookId, chapterId) {
  if (!progress[bookId]) {
    progress[bookId] = { lastChapter: null, audioProgress: {}, completedChapters: [], exercises: {} };
  }
  if (!progress[bookId].completedChapters.includes(chapterId)) {
    progress[bookId].completedChapters.push(chapterId);
    saveProgress();
  }
}

export function isChapterCompleted(bookId, chapterId) {
  return progress[bookId]?.completedChapters?.includes(chapterId) || false;
}

export function setExerciseCompleted(bookId, exerciseId, correct) {
  if (!progress[bookId]) {
    progress[bookId] = { lastChapter: null, audioProgress: {}, completedChapters: [], exercises: {} };
  }
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
    const savedProgress = localStorage.getItem(PROGRESS_KEY);
    if (savedProgress) {
      progress = JSON.parse(savedProgress);
    }

    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      settings = { ...settings, ...JSON.parse(savedSettings) };
    }

    // Apply saved theme
    document.documentElement.setAttribute('data-theme', settings.theme);

  } catch (e) {
    console.error('Failed to load saved data:', e);
  }
}
