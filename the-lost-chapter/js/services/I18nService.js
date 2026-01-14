/**
 * Internationalization service for VI/EN
 */

const translations = {
  vi: {
    library: 'Thư viện',
    continue: 'Tiếp tục',
    chapter: 'Chương',
    chapters: 'Chương',
    download: 'Tải xuống',
    downloadForOffline: 'Tải xuống để đọc offline',
    downloading: 'Đang tải...',
    availableOffline: 'Có sẵn offline',
    offline: 'Đang offline',
    correct: 'Đúng rồi!',
    incorrect: 'Chưa đúng',
    tryAgain: 'Thử lại',
    next: 'Tiếp theo',
    previous: 'Quay lại',
    settings: 'Cài đặt',
    darkMode: 'Chế độ tối',
    language: 'Ngôn ngữ',
    speed: 'Tốc độ',
    by: 'bởi',
    noBooks: 'Chưa có sách nào',
    loading: 'Đang tải...',
    error: 'Có lỗi xảy ra',
    retry: 'Thử lại',
    startReading: 'Bắt đầu đọc',
    completed: 'Hoàn thành',
    inProgress: 'Đang đọc',
    notStarted: 'Chưa bắt đầu',
    submit: 'Gửi',
    check: 'Kiểm tra',
    showAnswer: 'Xem đáp án',
    listening: 'Đang nghe',
    autoPlay: 'Tự động phát',
    selectAnswer: 'Chọn câu trả lời',
    exercise: 'Bài tập',
    backToLibrary: 'Về thư viện'
  },
  en: {
    library: 'Library',
    continue: 'Continue',
    chapter: 'Chapter',
    chapters: 'Chapters',
    download: 'Download',
    downloadForOffline: 'Download for offline',
    downloading: 'Downloading...',
    availableOffline: 'Available offline',
    offline: "You're offline",
    correct: 'Correct!',
    incorrect: 'Not quite',
    tryAgain: 'Try again',
    next: 'Next',
    previous: 'Previous',
    settings: 'Settings',
    darkMode: 'Dark mode',
    language: 'Language',
    speed: 'Speed',
    by: 'by',
    noBooks: 'No books yet',
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    startReading: 'Start reading',
    completed: 'Completed',
    inProgress: 'In progress',
    notStarted: 'Not started',
    submit: 'Submit',
    check: 'Check',
    showAnswer: 'Show answer',
    listening: 'Listening',
    autoPlay: 'Auto-play',
    selectAnswer: 'Select an answer',
    exercise: 'Exercise',
    backToLibrary: 'Back to library'
  }
};

let currentLang = 'vi';
const listeners = new Set();

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('tlc_lang', lang);
    updateUI();
    notifyListeners();
  }
}

export function getLanguage() {
  return currentLang;
}

export function t(key) {
  return translations[currentLang][key] || translations.vi[key] || key;
}

export function onLanguageChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners() {
  listeners.forEach(cb => cb(currentLang));
}

function updateUI() {
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Update lang attribute on html
  document.documentElement.lang = currentLang;

  // Update language button text
  const langBtn = document.getElementById('btn-lang');
  if (langBtn) {
    langBtn.textContent = currentLang.toUpperCase();
  }
}

export function initI18n() {
  // Load saved preference
  const saved = localStorage.getItem('tlc_lang');
  if (saved && translations[saved]) {
    currentLang = saved;
  }

  // Initial UI update
  updateUI();
}
