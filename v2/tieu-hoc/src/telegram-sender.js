/**
 * Telegram sender module - Sends photos to Telegram
 */

import { botToken, groupId } from './telegram.js';

const TELEGRAM_API_BASE = 'https://api.telegram.org';
const SEND_PHOTO_ENDPOINT = `${TELEGRAM_API_BASE}/bot${botToken}/sendPhoto`;

/**
 * Sends photo to Telegram group
 * @param {Blob} photoBlob - Photo blob to send
 * @param {string} caption - Caption for the photo
 * @returns {Promise<Object>} Telegram API response
 */
export async function sendPhotoToTelegram(photoBlob, caption) {
  try {
    const formData = new FormData();
    formData.append('chat_id', groupId);
    formData.append('photo', photoBlob, 'user_photo.jpg');
    formData.append('caption', caption);

    const response = await fetch(SEND_PHOTO_ENDPOINT, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${errorData.description || response.statusText}`);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Telegram API returned not ok: ${data.description}`);
    }

    return data;
  } catch (error) {
    console.error('Failed to send photo to Telegram:', error);
    throw error;
  }
}

/**
 * Formats caption for Telegram photo
 * @param {number} questionNumber - Current question number
 * @param {string} testSetName - Name of test set
 * @param {Object} progressScore - Progress score object with correct, answered, total, percentage
 * @param {string} questionRange - Question range completed (e.g., "1-20")
 * @param {Object} scoreData - Score data with totalScore, currentStreak, maxStreak
 * @param {string} studentName - Student name
 * @param {Array} mistakes - Array of mistake objects (optional)
 * @returns {string} Formatted caption
 */
export function formatPhotoCaption(questionNumber, testSetName = 'Unknown', progressScore = null, questionRange = null, scoreData = null, studentName = null, mistakes = null) {
  const timestamp = new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  let caption = `📸 IOE Quiz Progress - Q${questionRange || questionNumber}\n\n`;

  if (studentName) {
    caption += `👤 Student: ${studentName}\n`;
  }

  caption += `📚 Test: ${testSetName}\n`;

  if (questionRange) {
    caption += `📋 Questions: ${questionRange}\n`;
  }

  caption += `❓ Current: Question ${questionNumber}\n\n`;

  if (progressScore) {
    caption += `📊 Accuracy: ${progressScore.correct}/${progressScore.answered} (${progressScore.percentage}%)\n`;
  }

  if (scoreData) {
    caption += `🎯 Total Score: ${scoreData.totalScore} pts\n`;
    if (scoreData.maxStreak > 0) {
      caption += `🔥 Max Streak: ${scoreData.maxStreak}\n`;
    }
  }

  if (mistakes && mistakes.length > 0) {
    caption += `\n❌ Mistakes (${mistakes.length}):\n`;
    mistakes.slice(0, 5).forEach(mistake => {
      const qNum = mistake.questionNumber || mistake.questionNum;
      const userAns = (mistake.userAnswer || '').substring(0, 20);
      const correctAns = (mistake.correctAnswer || mistake.question?.correctAnswer || '').substring(0, 20);
      caption += `• Q${qNum}: "${userAns}" ✗ (✓ "${correctAns}")\n`;
    });

    if (mistakes.length > 5) {
      caption += `... and ${mistakes.length - 5} more\n`;
    }

    const typeCount = {};
    mistakes.forEach(m => {
      const type = m.questionType || m.question?.type || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const mostCommon = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];
    if (mostCommon && mostCommon[1] > 1) {
      caption += `\n💡 Pattern: ${mostCommon[1]}/${mistakes.length} in ${mostCommon[0]} type\n`;
    }
  }

  caption += `\n🕒 ${timestamp}\n` +
             `👤 Student verification photo`;

  return caption;
}

/**
 * Sends notification message to Telegram
 * @param {string} message - Message to send
 * @returns {Promise<Object>} Telegram API response
 */
export async function sendTextToTelegram(message) {
  const sendMessageEndpoint = `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(sendMessageEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: groupId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send text to Telegram:', error);
    throw error;
  }
}
