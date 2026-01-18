/**
 * Notification Batcher - Batches question results and sends Telegram notifications
 */

import { TRACKING_CONSTANTS } from './data.js';
import { sendTextToTelegram } from './telegram-sender.js';
import { getBatchMistakes, getPatternAnalysis } from './mistake-tracker.js';

let currentBatch = [];
let studentName = 'Unknown Student';

/**
 * Sets the student name for notifications
 * @param {string} name - Student name
 */
export function setStudentName(name) {
  studentName = name || 'Unknown Student';
}

/**
 * Gets the current student name
 * @returns {string} Student name
 */
export function getStudentName() {
  return studentName;
}

/**
 * Adds a question result to the current batch
 * @param {number} questionNum - Question number (1-based)
 * @param {Object} question - Question object
 * @param {boolean} isCorrect - Whether answer was correct
 * @param {string} userAnswer - Student's answer
 * @param {Object} scoreInfo - Score information
 */
export function addQuestionResult(questionNum, question, isCorrect, userAnswer, scoreInfo) {
  currentBatch.push({
    questionNum,
    question,
    isCorrect,
    userAnswer,
    scoreInfo,
    timestamp: new Date().toISOString()
  });
}

/**
 * Checks if a notification should be sent
 * @param {number} questionNum - Current question number
 * @returns {boolean} True if should send
 */
export function shouldSendNotification(questionNum) {
  return questionNum > 0 && questionNum % TRACKING_CONSTANTS.NOTIFICATION_BATCH_SIZE === 0;
}

/**
 * Sends batched notification to Telegram
 * @param {Object} quizState - Quiz state object
 * @param {string} testSetName - Test set name
 */
export async function sendBatchNotification(quizState, testSetName) {
  if (currentBatch.length === 0) {
    console.warn('No results in batch to send');
    return;
  }

  // Calculate actual question range from batch data
  const questionNumbers = currentBatch.map(r => r.questionNum);
  const startQ = Math.min(...questionNumbers);
  const endQ = Math.max(...questionNumbers);

  const correctCount = currentBatch.filter(r => r.isCorrect).length;
  const totalQuestions = currentBatch.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  const mistakes = currentBatch.filter(r => !r.isCorrect);

  let maxStreak = 0;
  let currentStreakCount = 0;

  currentBatch.forEach(result => {
    if (result.isCorrect) {
      currentStreakCount++;
      maxStreak = Math.max(maxStreak, currentStreakCount);
    } else {
      currentStreakCount = 0;
    }
  });

  const totalScore = quizState.getTotalScore();
  const overallCorrect = quizState.scoreHistory.filter(h => h.isCorrect).length;
  const overallTotal = quizState.scoreHistory.length;
  const overallPercentage = overallTotal > 0 ? Math.round((overallCorrect / overallTotal) * 100) : 0;

  const batchPointsEarned = currentBatch.reduce((sum, r) => sum + (r.scoreInfo.pointsEarned || 0), 0);

  let message = `📊 PROGRESS UPDATE (Questions ${startQ}-${endQ})\n\n`;
  message += `👤 Student: ${studentName}\n`;
  message += `📚 Test: ${testSetName}\n\n`;

  message += `✅ Score: ${correctCount}/${totalQuestions} correct (${percentage}%)\n`;
  message += `🎯 Points earned: ${batchPointsEarned} pts (Total: ${totalScore} pts)\n`;

  if (maxStreak > 0) {
    message += `🔥 Max streak in batch: ${maxStreak}\n`;
  }

  message += `📈 Overall accuracy: ${overallCorrect}/${overallTotal} (${overallPercentage}%)\n`;

  if (mistakes.length > 0) {
    message += `\n❌ Wrong Answers (${mistakes.length}):\n\n`;

    const mistakesToShow = mistakes.slice(0, TRACKING_CONSTANTS.MAX_MISTAKES_TO_SHOW);

    mistakesToShow.forEach((mistake, index) => {
      message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `Q${mistake.questionNum} (${formatQuestionType(mistake.question.type)}):\n`;
      message += `📖 ${formatQuestionText(mistake.question)}\n`;

      if (mistake.question.options && mistake.question.options.length > 0) {
        message += `Options:\n`;
        mistake.question.options.forEach((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const marker = opt === mistake.question.correctAnswer ? ' ✓' : '';
          message += `  ${letter}. ${opt}${marker}\n`;
        });
      }

      message += `❌ Student: "${mistake.userAnswer}"\n`;
      message += `✅ Correct: "${mistake.question.correctAnswer}"\n`;

      if (TRACKING_CONSTANTS.INCLUDE_EXPLANATIONS && mistake.question.explanation) {
        const shortExplanation = truncateExplanation(mistake.question.explanation);
        message += `💡 ${shortExplanation}\n`;
      }

      message += `\n`;
    });

    if (mistakes.length > TRACKING_CONSTANTS.MAX_MISTAKES_TO_SHOW) {
      const remaining = mistakes.length - TRACKING_CONSTANTS.MAX_MISTAKES_TO_SHOW;
      message += `... and ${remaining} more mistake(s)\n\n`;
    }

    const patternAnalysis = getPatternAnalysis(mistakes.map(m => ({
      questionType: m.question.type,
      questionNumber: m.questionNum
    })));

    if (patternAnalysis && patternAnalysis.mostCommonType) {
      const typeLabel = formatQuestionType(patternAnalysis.mostCommonType);
      message += `💡 Pattern: ${patternAnalysis.mostCommonCount}/${mistakes.length} mistakes in ${typeLabel} questions\n`;
    }
  }

  message += `\n⏰ ${new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })}`;

  try {
    await sendTextToTelegram(message);
    console.log(`Batch notification sent for questions ${startQ}-${endQ}`);
  } catch (error) {
    console.error('Failed to send batch notification:', error);
  }

  clearBatch();
}

/**
 * Formats question type for display
 * @param {string} type - Question type
 * @returns {string} Formatted type
 */
function formatQuestionType(type) {
  const typeMap = {
    'multiple-choice': 'Multiple Choice',
    'fill-blank': 'Fill-blank',
    'word-arrangement': 'Word Arrangement',
    'pronunciation': 'Pronunciation',
    'odd-one-out': 'Odd One Out'
  };
  return typeMap[type] || type;
}

/**
 * Formats question text for display
 * @param {Object} question - Question object
 * @returns {string} Formatted question text
 */
function formatQuestionText(question) {
  let text = question.question;

  if (text.length > 150) {
    text = text.substring(0, 147) + '...';
  }

  return text.replace(/\n/g, ' ');
}

/**
 * Truncates explanation to reasonable length
 * @param {string} explanation - Full explanation
 * @returns {string} Truncated explanation
 */
function truncateExplanation(explanation) {
  const plainText = explanation
    .replace(/\*\*/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  if (plainText.length <= 200) {
    return plainText;
  }

  return plainText.substring(0, 197) + '...';
}

/**
 * Clears the current batch
 */
export function clearBatch() {
  currentBatch = [];
}

/**
 * Gets the current batch
 * @returns {Array} Current batch
 */
export function getCurrentBatch() {
  return [...currentBatch];
}
