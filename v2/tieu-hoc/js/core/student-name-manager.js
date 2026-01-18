/**
 * Student Name Manager for English Grammar Games
 * Manages student name input, storage, and display in page header
 */

const StudentNameManager = {
  STORAGE_KEY: 'grammar_student_name',

  /**
   * Initialize student name management
   * Prompts for name if not set, displays in header
   * Supports test mode via URL parameter: ?test=true
   */
  init() {
    // Check if in test mode (e.g., ?test=true or ?autotest=1)
    const urlParams = new URLSearchParams(window.location.search);
    const isTestMode = urlParams.has('test') || urlParams.has('autotest');

    let studentName = this.getStudentName();

    if (!studentName) {
      if (isTestMode) {
        // Use default test name in test mode
        studentName = 'Test Student';
        this.saveStudentName(studentName);
      } else {
        studentName = this.promptForName();
        if (studentName) {
          this.saveStudentName(studentName);
        }
      }
    }

    this.displayStudentName(studentName);
    return studentName;
  },

  /**
   * Get stored student name
   * @returns {string|null} - Student name or null
   */
  getStudentName() {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to get student name from localStorage:', error);
      return null;
    }
  },

  /**
   * Save student name to localStorage
   * @param {string} name - Student name
   */
  saveStudentName(name) {
    try {
      localStorage.setItem(this.STORAGE_KEY, name);
    } catch (error) {
      console.error('Failed to save student name:', error);
    }
  },

  /**
   * Prompt user for their name
   * @returns {string|null} - Student name or null
   */
  promptForName() {
    const name = prompt(
      '👋 Xin chào! Vui lòng nhập tên của bạn:\n(Tên này sẽ được lưu và gửi kèm kết quả bài tập)',
      ''
    );

    if (name && name.trim()) {
      return name.trim();
    }

    // If user cancels or enters empty name, use default
    return 'Học sinh';
  },

  /**
   * Display student name in page header
   * @param {string} name - Student name
   */
  displayStudentName(name) {
    const studentValueElements = document.querySelectorAll('.game-info__value');

    // The second .game-info__value is for student name
    if (studentValueElements.length >= 2) {
      studentValueElements[1].textContent = name || 'Học sinh';
    }
  },

  /**
   * Clear stored student name (for testing or reset)
   */
  clearStudentName() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear student name:', error);
    }
  },

  /**
   * Change student name
   * @returns {string} - New student name
   */
  changeStudentName() {
    const currentName = this.getStudentName();
    const newName = prompt(
      '📝 Nhập tên mới:\n(Để trống nếu muốn giữ tên hiện tại)',
      currentName || ''
    );

    if (newName && newName.trim()) {
      const trimmedName = newName.trim();
      this.saveStudentName(trimmedName);
      this.displayStudentName(trimmedName);
      return trimmedName;
    }

    return currentName;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StudentNameManager;
}
