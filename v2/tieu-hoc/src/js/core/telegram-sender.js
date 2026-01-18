/**
 * Telegram Sender for English Grammar Games
 * Automatically sends student results to Telegram when exercises are completed
 */

const TelegramSender = {
  // Telegram Bot Configuration
  BOT_TOKEN: '8251605593:AAGnzDoQlWQaejkPN9Oq0wTnt8yQUn2khFg',
  CHAT_ID: '-4901265629',
  API_BASE_URL: 'https://api.telegram.org/bot',

  /**
   * Send student results to Telegram
   * @param {Object} resultData - Complete result data
   * @returns {Promise<boolean>} - True if sent successfully
   */
  async sendResults(resultData) {
    try {
      const message = this.formatResultMessage(resultData);
      const url = `${this.API_BASE_URL}${this.BOT_TOKEN}/sendMessage`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: this.CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Telegram API error:', response.status, response.statusText);
        console.error('Error details:', errorData);
        console.error('Message length:', message.length, 'characters');
        return false;
      }

      const data = await response.json();
      console.log('Results sent to Telegram successfully:', data);
      return true;

    } catch (error) {
      console.error('Failed to send results to Telegram:', error);
      return false;
    }
  },

  /**
   * Format result data into readable message
   * @param {Object} resultData - Result data object
   * @returns {string} - Formatted message
   */
  formatResultMessage(resultData) {
    const {
      studentName,
      teacherName,
      unitTitle,
      grammarTopics,
      score,
      correctAnswers,
      totalQuestions,
      percentage,
      stars,
      timeSpent,
      hintsUsed,
      timeBonusEarned,
      comboBonusEarned,
      answerHistory,
      completedAt
    } = resultData;

    const MAX_MESSAGE_LENGTH = 4000; // Telegram limit is 4096, leave buffer
    const MAX_QUESTIONS_TO_SHOW = 10; // Limit detailed questions

    // Header section
    let message = `<b>📊 BÁO CÁO KẾT QUẢ HỌC TẬP</b>\n\n`;
    message += `<b>👨‍🎓 Học sinh:</b> ${this.escapeHtml(studentName)}\n`;
    message += `<b>👩‍🏫 Giáo viên:</b> ${this.escapeHtml(teacherName)}\n`;
    message += `<b>📚 Bài học:</b> ${this.escapeHtml(unitTitle)}\n`;

    if (grammarTopics && grammarTopics.length > 0) {
      message += `<b>📖 Chủ đề:</b> ${this.escapeHtml(grammarTopics.join(', '))}\n`;
    }

    message += `<b>🕐 Thời gian:</b> ${completedAt}\n`;
    message += `\n`;

    // Score summary section
    message += `<b>━━━━━━━━━━━━━━━━━━</b>\n`;
    message += `<b>⭐ BẢNG ĐIỂM TỔNG KẾT</b>\n`;
    message += `<b>━━━━━━━━━━━━━━━━━━</b>\n\n`;
    message += `<b>🎯 Tổng điểm:</b> ${score} điểm\n`;
    message += `<b>✅ Số câu đúng:</b> ${correctAnswers}/${totalQuestions} (${percentage}%)\n`;
    message += `<b>⏱️ Thời gian:</b> ${this.formatTime(timeSpent)}\n`;
    message += `<b>💡 Gợi ý:</b> ${hintsUsed} lần (-${hintsUsed * 2} điểm)\n`;
    message += `<b>🔥 Combo:</b> +${comboBonusEarned} điểm\n`;
    message += `<b>⚡ Time bonus:</b> +${timeBonusEarned} điểm\n`;
    message += `<b>⭐ Xếp hạng:</b> ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} (${stars}/3)\n`;
    message += `\n`;

    // Detailed answer history - limit to avoid message too long
    const wrongAnswers = answerHistory.filter(r => !r.isCorrect);
    const questionsToShow = wrongAnswers.length > 0 ? wrongAnswers.slice(0, MAX_QUESTIONS_TO_SHOW) : answerHistory.slice(0, MAX_QUESTIONS_TO_SHOW);

    if (wrongAnswers.length > 0) {
      message += `<b>━━━━━━━━━━━━━━━━━━</b>\n`;
      message += `<b>❌ CÂU TRẢ LỜI SAI (${wrongAnswers.length})</b>\n`;
      message += `<b>━━━━━━━━━━━━━━━━━━</b>\n\n`;
    } else {
      message += `<b>━━━━━━━━━━━━━━━━━━</b>\n`;
      message += `<b>✅ TẤT CẢ ĐỀU ĐÚNG!</b>\n`;
      message += `<b>━━━━━━━━━━━━━━━━━━</b>\n\n`;
    }

    questionsToShow.forEach((record, index) => {
      const questionNum = answerHistory.indexOf(record) + 1;
      const statusIcon = record.isCorrect ? '✅' : '❌';
      const statusText = record.isCorrect ? 'ĐÚNG' : 'SAI';

      // Truncate long questions
      const questionText = this.truncateText(record.questionText, 100);

      message += `<b>Câu ${questionNum}:</b> ${this.escapeHtml(questionText)}\n`;
      message += `${statusIcon} <b>${statusText}</b> (+${record.points} điểm)\n`;
      message += `📤 Trả lời: <code>${this.escapeHtml(this.formatAnswer(record.userAnswer))}</code>\n`;

      if (!record.isCorrect) {
        message += `✓ Đúng: <code>${this.escapeHtml(this.formatAnswer(record.correctAnswer))}</code>\n`;
      }

      message += `\n`;

      // Check if message is getting too long
      if (message.length > MAX_MESSAGE_LENGTH - 500) {
        const remaining = wrongAnswers.length > 0 ? wrongAnswers.length - index - 1 : 0;
        if (remaining > 0) {
          message += `... và ${remaining} câu sai khác\n\n`;
        }
        return; // Stop adding more questions
      }
    });

    if (wrongAnswers.length > MAX_QUESTIONS_TO_SHOW) {
      message += `... và ${wrongAnswers.length - MAX_QUESTIONS_TO_SHOW} câu sai khác\n\n`;
    }

    // Footer
    message += `<b>━━━━━━━━━━━━━━━━━━</b>\n`;
    message += `<i>🤖 English Grammar Games</i>`;

    return message;
  },

  /**
   * Format answer for display
   * @param {any} answer - Answer to format
   * @returns {string} - Formatted answer string
   */
  formatAnswer(answer) {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    if (typeof answer === 'object' && answer !== null) {
      return JSON.stringify(answer);
    }
    return String(answer || '(không trả lời)');
  },

  /**
   * Format time in seconds to readable format
   * @param {number} seconds - Time in seconds
   * @returns {string} - Formatted time string
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes} phút ${remainingSeconds} giây`;
    }
    return `${seconds} giây`;
  },

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, char => map[char]);
  },

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} - Truncated text
   */
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  },

  /**
   * Extract student name from StudentNameManager or page header
   * @returns {string} - Student name or default
   */
  getStudentName() {
    // Try to get from StudentNameManager first
    if (typeof StudentNameManager !== 'undefined') {
      const name = StudentNameManager.getStudentName();
      if (name) return name;
    }

    // Fallback: extract from DOM
    const studentValueElements = document.querySelectorAll('.game-info__value');
    if (studentValueElements.length >= 2) {
      const name = studentValueElements[1].textContent.trim();
      if (name) return name;
    }

    return 'Học sinh';
  },

  /**
   * Extract teacher name from page header
   * @returns {string} - Teacher name or default
   */
  getTeacherName() {
    const teacherElement = document.querySelector('.game-info__value');
    if (teacherElement) {
      return teacherElement.textContent.trim();
    }
    return 'Unknown Teacher';
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TelegramSender;
}
