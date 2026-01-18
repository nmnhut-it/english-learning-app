/**
 * UI module for K9 - Rendering and DOM manipulation functions
 */

import { QUESTION_TYPES, UI_TEXT, CSS_CLASSES } from './data-k9.js';
import {
  playCorrectSound,
  playWrongSound,
  playClickSound,
  playStreakSound,
  playGameStartSound,
  playGameOverSound,
  playTickSound,
  toggleMute,
  isSoundMuted
} from './sound-manager.js';

/**
 * Renders the quiz interface
 * @param {QuizState} state - Quiz state object
 * @param {HTMLElement} container - Container element
 * @param {Function} onBackToMenu - Callback to return to menu
 */
export function renderQuiz(state, container, onBackToMenu) {
  if (state.isSubmitted) {
    renderResults(state, container, onBackToMenu);
    return;
  }

  const question = state.getCurrentQuestion();
  const questionNumber = state.currentIndex + 1;
  const total = state.getTotalQuestions();

  container.innerHTML = `
    <div class="quiz-header">
      <div class="header-top">
        <h2>${UI_TEXT.APP_TITLE}</h2>
        <div class="header-controls">
          ${renderStreakIndicator(state)}
          ${renderScoreDisplay(state)}
          ${renderMuteButton()}
        </div>
      </div>
      <div class="progress">${UI_TEXT.QUESTION_LABEL} ${questionNumber} / ${total}</div>
      ${renderQuestionNavigator(state)}
    </div>
    <div class="${CSS_CLASSES.QUESTION_CONTAINER}" id="question-container">
      ${renderQuestion(question, state)}
      ${renderAnswerFeedback(state)}
      ${renderExplanationSection(question, state)}
    </div>
    <div class="quiz-nav">
      ${renderNavigationButtons(state)}
    </div>
    ${renderGroupMilestoneModal(state)}
  `;

  attachEventListeners(state, container);
}

/**
 * Renders score display
 * @param {QuizState} state - Quiz state
 * @returns {string} HTML string
 */
function renderScoreDisplay(state) {
  const score = state.getTotalScore();
  return `
    <div class="score-widget">
      <span class="score-label">${UI_TEXT.SCORE_LABEL}</span>
      <span class="score-value" id="score-value">${score}</span>
    </div>
  `;
}

/**
 * Renders streak indicator
 * @param {QuizState} state - Quiz state
 * @returns {string} HTML string
 */
function renderStreakIndicator(state) {
  const streak = state.getCurrentStreak();
  if (streak === 0) return '';

  return `
    <div class="streak-indicator ${streak >= 5 ? 'streak-glow' : ''}">
      <span class="streak-fire">🔥</span>
      <span class="streak-count">${streak}</span>
    </div>
  `;
}

/**
 * Renders mute button
 * @returns {string} HTML string
 */
function renderMuteButton() {
  const isMuted = isSoundMuted();
  const icon = isMuted ? UI_TEXT.SOUND_OFF : UI_TEXT.SOUND_ON;
  return `
    <button class="mute-button" id="mute-button" title="${isMuted ? 'Unmute' : 'Mute'} sounds">
      ${icon}
    </button>
  `;
}

/**
 * Renders group milestone celebration modal
 * @param {QuizState} state - Quiz state
 * @returns {string} HTML string
 */
function renderGroupMilestoneModal(state) {
  // Modal will be shown dynamically when milestone is reached
  return '<div class="milestone-modal-overlay" id="milestone-modal" style="display: none;"></div>';
}

/**
 * Shows group milestone celebration
 * @param {Object} groupScore - Group score data
 * @param {HTMLElement} container - Container element
 */
function showGroupMilestone(groupScore, container) {
  const modalOverlay = container.querySelector('#milestone-modal');
  if (!modalOverlay) return;

  const title = groupScore.isPerfect ? UI_TEXT.GROUP_MILESTONE_PERFECT : UI_TEXT.GROUP_MILESTONE_TITLE;
  const emoji = groupScore.isPerfect ? '🎉⭐🎉' : '🎉';

  modalOverlay.innerHTML = `
    <div class="milestone-card">
      <div class="milestone-header">${emoji}</div>
      <h3>${title}</h3>
      <div class="milestone-subtitle">Questions ${groupScore.startQuestion}-${groupScore.endQuestion} Complete!</div>
      <div class="milestone-stats">
        <div class="milestone-stat">
          <div class="stat-label">Correct</div>
          <div class="stat-value">${groupScore.correct}/${groupScore.total}</div>
        </div>
        <div class="milestone-stat">
          <div class="stat-label">Points</div>
          <div class="stat-value">${groupScore.points}</div>
        </div>
        ${groupScore.bonus > 0 ? `
          <div class="milestone-stat bonus">
            <div class="stat-label">Bonus</div>
            <div class="stat-value">+${groupScore.bonus}</div>
          </div>
        ` : ''}
      </div>
      <button class="continue-milestone-btn" id="continue-milestone">${UI_TEXT.CONTINUE_BUTTON} →</button>
    </div>
  `;

  modalOverlay.style.display = 'flex';

  // Add confetti effect for perfect score
  if (groupScore.isPerfect) {
    createConfetti(modalOverlay);
  }

  // Close button
  const continueBtn = modalOverlay.querySelector('#continue-milestone');
  continueBtn.addEventListener('click', () => {
    playClickSound();
    modalOverlay.style.display = 'none';
  });
}

/**
 * Creates simple confetti effect
 * @param {HTMLElement} container - Container element
 */
function createConfetti(container) {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
  const confettiCount = 30;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    container.appendChild(confetti);

    setTimeout(() => confetti.remove(), 3000);
  }
}

/**
 * Animates score change
 * @param {number} points - Points earned
 * @param {HTMLElement} container - Container element
 */
function animateScoreChange(points, container) {
  if (points === 0) return;

  const questionContainer = container.querySelector('#question-container');
  if (!questionContainer) return;

  const scoreAnimation = document.createElement('div');
  scoreAnimation.className = 'score-animation';
  scoreAnimation.textContent = `+${points}`;
  questionContainer.appendChild(scoreAnimation);

  setTimeout(() => scoreAnimation.remove(), 1000);

  // Update score number with animation
  const scoreValue = container.querySelector('#score-value');
  if (scoreValue) {
    scoreValue.classList.add('score-bump');
    setTimeout(() => scoreValue.classList.remove('score-bump'), 300);
  }
}

/**
 * Renders a single question based on type
 * @param {Object} question - Question object
 * @param {QuizState} state - Quiz state
 * @returns {string} HTML string
 */
function renderQuestion(question, state) {
  let html = `<p class="question-text"><strong>${question.question}</strong></p>`;

  if (question.mediaUrl) {
    if (question.mediaUrl.includes('.mp3')) {
      html += `<audio controls src="${question.mediaUrl}"></audio>`;
    } else if (question.mediaUrl.includes('.jpg') || question.mediaUrl.includes('.png')) {
      html += `<img src="${question.mediaUrl}" alt="Question image" class="question-image">`;
    }
  }

  const userAnswer = state.getAnswer() || '';

  switch (question.type) {
    case QUESTION_TYPES.MULTIPLE_CHOICE:
    case QUESTION_TYPES.PRONUNCIATION:
    case QUESTION_TYPES.ODD_ONE_OUT:
      html += renderMultipleChoice(question, userAnswer);
      break;

    case QUESTION_TYPES.FILL_BLANK:
      html += renderTextInput(userAnswer, question);
      break;

    case QUESTION_TYPES.WORD_ARRANGEMENT:
      html += renderWordArrangement(question, state);
      break;
  }

  return html;
}

/**
 * Formats underlined word from **text** notation to <u>text</u> HTML
 * @param {string} text - Text with **markers**
 * @returns {string} HTML with <u> tags
 */
function formatUnderlinedText(text) {
  if (!text) return text;
  return text.replace(/\*\*([^*]+)\*\*/g, '<u>$1</u>');
}

/**
 * Gets display text for an option, using underlinedWord if available
 * @param {Object} question - Question object
 * @param {string} option - Option text
 * @param {number} index - Option index
 * @returns {string} Display text (may contain HTML)
 */
function getOptionDisplayText(question, option, index) {
  // Check if this is a pronunciation question with wordDetails
  if (question.wordDetails && Array.isArray(question.wordDetails)) {
    // Find matching word detail by index or by word match
    const detail = question.wordDetails[index] ||
      question.wordDetails.find(d => d.word && d.word.toLowerCase() === option.toLowerCase());

    if (detail && detail.underlinedWord) {
      return formatUnderlinedText(detail.underlinedWord);
    }
  }
  return option;
}

/**
 * Renders multiple choice options
 * @param {Object} question - Question object containing options and optionally wordDetails
 * @param {string} selectedAnswer - Currently selected answer
 * @returns {string} HTML string
 */
function renderMultipleChoice(question, selectedAnswer) {
  const options = question.options;
  const optionsHtml = options.map((option, index) => {
    const letter = String.fromCharCode(65 + index);
    const isSelected = selectedAnswer === option;
    const selectedClass = isSelected ? CSS_CLASSES.OPTION_SELECTED : '';
    const displayText = getOptionDisplayText(question, option, index);

    return `
      <button
        class="${CSS_CLASSES.OPTION_BUTTON} ${selectedClass}"
        data-answer="${option}">
        ${letter}. ${displayText}
      </button>
    `;
  }).join('');

  return `<div class="options-container">${optionsHtml}</div>`;
}

/**
 * Renders text input field
 * @param {string} value - Current input value
 * @param {Object} question - Question object (optional, for fill-blank)
 * @returns {string} HTML string
 */
function renderTextInput(value, question = null) {
  if (question && question.type === QUESTION_TYPES.FILL_BLANK) {
    return renderFillBlankWithBoxes(question, value);
  }

  return `
    <div class="input-container">
      <input
        type="text"
        class="${CSS_CLASSES.INPUT_FIELD}"
        value="${value}"
        placeholder="${UI_TEXT.YOUR_ANSWER_LABEL}"
        autocomplete="off">
    </div>
  `;
}

/**
 * Renders fill-in-blank with letter boxes
 * @param {Object} question - Question object
 * @param {string} userAnswer - Current user answer
 * @returns {string} HTML string
 */
function renderFillBlankWithBoxes(question, userAnswer) {
  const expectedLength = question.correctAnswer.length;
  const userLetters = (userAnswer || '').split('');

  const underscorePattern = /_+/g;
  const parts = question.question.split(underscorePattern);

  const boxesHtml = Array.from({ length: expectedLength }).map((_, idx) => {
    const letter = userLetters[idx] || '';
    return `<span class="letter-box ${letter ? 'filled' : ''}">${letter}</span>`;
  }).join('');

  return `
    <div class="fill-blank-container">
      <div class="question-with-blanks">
        ${parts[0] || ''}
        <span class="letter-boxes-inline">${boxesHtml}</span>
        ${parts[1] || ''}
      </div>
      <input
        type="text"
        class="${CSS_CLASSES.INPUT_FIELD} hidden-input"
        value="${userAnswer}"
        placeholder="${UI_TEXT.YOUR_ANSWER_LABEL}"
        autocomplete="off"
        maxlength="${expectedLength}">
    </div>
  `;
}

/**
 * Renders word arrangement interface with drag and click support
 * @param {Object} question - Question object
 * @param {QuizState} state - Quiz state
 * @returns {string} HTML string
 */
function renderWordArrangement(question, state) {
  const words = question.question.split('/').map(w => w.trim()).filter(w => w);
  const selectedWords = state.getWordArrangementAnswer() || [];

  const availableWords = words.filter(w => !selectedWords.includes(w));

  const wordsHtml = availableWords.map((word, idx) => `
    <button class="word-chip" data-word="${word}" data-index="${idx}" draggable="true">
      ${word}
    </button>
  `).join('');

  const selectedHtml = selectedWords.map((word, idx) => `
    <span class="selected-word" data-word="${word}" data-position="${idx}">
      ${word}
      <button class="remove-word" data-word="${word}">&times;</button>
    </span>
  `).join('');

  return `
    <div class="word-arrangement-container">
      <div class="answer-area" data-empty="${selectedWords.length === 0}">
        ${selectedWords.length === 0 ? '<span class="placeholder">Click words to build your answer</span>' : selectedHtml}
      </div>
      <div class="word-bank">
        ${wordsHtml}
      </div>
    </div>
  `;
}

/**
 * Renders answer feedback section
 * @param {QuizState} state - Quiz state
 * @returns {string} HTML string
 */
function renderAnswerFeedback(state) {
  const question = state.getCurrentQuestion();

  if (!state.isCurrentAnswerChecked()) {
    return '';
  }

  const isCorrect = state.isCurrentAnswerCorrect();
  const feedbackClass = isCorrect ? 'correct-feedback' : 'wrong-feedback';
  const feedbackText = isCorrect ? UI_TEXT.CORRECT_FEEDBACK : UI_TEXT.WRONG_FEEDBACK;

  let html = `<div class="answer-feedback ${feedbackClass}">${feedbackText}</div>`;

  if (!isCorrect) {
    html += `
      <div class="correct-answer-display">
        <strong>${UI_TEXT.CORRECT_ANSWER_LABEL}</strong> ${question.correctAnswer}
      </div>
    `;
  }

  return html;
}

/**
 * Renders question navigator with jump input
 * @param {QuizState} state - Quiz state
 * @returns {string} HTML string
 */
function renderQuestionNavigator(state) {
  const total = state.getTotalQuestions();
  const currentIndex = state.currentIndex;
  const currentQuestion = currentIndex + 1;
  const answeredCount = state.getAnsweredQuestions().size;

  return `
    <div class="question-navigator">
      <div class="progress-summary">
        <span class="answered-count">${answeredCount} answered</span>
      </div>
      <div class="jump-to-question">
        <label for="jump-input">Jump to:</label>
        <input
          type="number"
          id="jump-input"
          min="1"
          max="${total}"
          placeholder="${currentQuestion}"
          class="jump-input"
        />
        <button class="jump-btn" id="jump-btn">Go</button>
      </div>
    </div>
  `;
}

/**
 * Renders explanation section with toggle button
 * @param {Object} question - Question object
 * @param {QuizState} state - Quiz state
 * @returns {string} HTML string
 */
function renderExplanationSection(question, state) {
  // Check if there's any explanation content (either explanation or wordDetails)
  const hasExplanation = question.explanation ||
    (question.wordDetails && Array.isArray(question.wordDetails) && question.wordDetails.length > 0);

  if (!hasExplanation) {
    return '';
  }

  const isVisible = state.isExplanationVisible();
  const isChecked = state.isCurrentAnswerChecked();

  if (!isChecked && !state.isSubmitted) {
    return '';
  }

  // Use the new getExplanationContent helper for both regular and pronunciation questions
  const renderedExplanation = isVisible ? getExplanationContent(question) : '';

  return `
    <div class="explanation-section">
      <button class="explanation-toggle" id="explanation-toggle">
        ${isVisible ? '📖 Hide Explanation' : '💡 Show Explanation'}
      </button>
      ${isVisible ? `
        <div class="explanation-content">
          <div class="explanation-text">${renderedExplanation}</div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Sanitizes HTML to prevent over-escaping
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeHtml(text) {
  if (!text) return '';

  // Fix over-escaped characters
  return text
    .replace(/\\-/g, '-')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

/**
 * Builds rich explanation HTML for pronunciation questions with wordDetails
 * @param {Object} question - Question object with wordDetails
 * @returns {string} HTML string for pronunciation explanation
 */
function buildPronunciationExplanation(question) {
  if (!question.wordDetails || !Array.isArray(question.wordDetails)) {
    return '';
  }

  const isStressQuestion = question.stressType === 'word stress';
  const correctIndex = question.correctIndex;

  // Helper to convert **text** to <u>text</u>
  function formatUnderlinedWord(detail) {
    if (detail.underlinedWord) {
      // Convert **text** to <u>text</u>
      return detail.underlinedWord.replace(/\*\*([^*]+)\*\*/g, '<u>$1</u>');
    }
    return detail.word;
  }

  let html = '<div class="pronunciation-details">';

  // Add underlined part or stress type info
  if (question.underlinedPart) {
    html += `<div class="pronunciation-header"><strong>Phần gạch chân:</strong> "${question.underlinedPart}"</div>`;
  } else if (isStressQuestion) {
    html += `<div class="pronunciation-header"><strong>Dạng câu hỏi:</strong> Trọng âm từ</div>`;
  }

  html += '<table class="word-details-table">';
  html += '<thead><tr>';
  html += '<th>Từ</th>';
  html += '<th>Phiên âm (IPA)</th>';
  html += isStressQuestion ? '<th>Trọng âm</th>' : '<th>Âm gạch chân</th>';
  html += '<th>Nghĩa</th>';
  html += '</tr></thead>';
  html += '<tbody>';

  question.wordDetails.forEach((detail, index) => {
    const isCorrect = index === correctIndex;
    const rowClass = isCorrect ? 'correct-word-row' : '';
    const wordDisplay = formatUnderlinedWord(detail);

    html += `<tr class="${rowClass}">`;
    html += `<td><strong>${wordDisplay}</strong>${isCorrect ? ' ✓' : ''}</td>`;
    html += `<td class="ipa-cell">${detail.ipa || '-'}</td>`;

    if (isStressQuestion) {
      html += `<td>${detail.stressPattern || '-'} (âm tiết ${detail.stressedSyllable || '-'})</td>`;
    } else {
      html += `<td class="underlined-sound">${detail.underlinedSound || '-'}</td>`;
    }

    html += `<td>${detail.meaning || '-'}</td>`;
    html += '</tr>';

    // Add example row
    if (detail.example) {
      html += `<tr class="example-row ${rowClass}">`;
      html += '<td colspan="4" class="example-cell">';
      html += `<em>VD: ${detail.example}</em>`;
      if (detail.exampleTranslation) {
        html += `<br><span class="translation">(${detail.exampleTranslation})</span>`;
      }
      html += '</td></tr>';
    }
  });

  html += '</tbody></table>';

  // Add the original explanation if present
  if (question.explanation) {
    html += `<div class="pronunciation-summary"><strong>Giải thích:</strong> ${sanitizeHtml(question.explanation)}</div>`;
  }

  html += '</div>';

  return html;
}

/**
 * Gets the full explanation content for a question
 * Handles both regular questions and pronunciation questions with wordDetails
 * @param {Object} question - Question object
 * @returns {string} HTML string for explanation
 */
function getExplanationContent(question) {
  // Check if this is a pronunciation question with wordDetails
  if (question.wordDetails && Array.isArray(question.wordDetails) && question.wordDetails.length > 0) {
    return buildPronunciationExplanation(question);
  }

  // Fall back to regular explanation
  if (question.explanation) {
    if (typeof marked !== 'undefined') {
      return marked.parse(question.explanation);
    }
    return sanitizeHtml(question.explanation);
  }

  return '';
}

/**
 * Renders navigation buttons
 * @param {QuizState} state - Quiz state
 * @returns {string} HTML string
 */
function renderNavigationButtons(state) {
  const prevDisabled = !state.hasPrevious() ? CSS_CLASSES.NAV_DISABLED : '';
  const hasAnswer = state.getAnswer() !== undefined && state.getAnswer() !== '';
  const isChecked = state.isCurrentAnswerChecked();
  const isCorrect = state.isCurrentAnswerCorrect();
  const isWrongConfirmed = state.isWrongAnswerConfirmed();

  let html = `
    <button class="${CSS_CLASSES.NAV_BUTTON} ${prevDisabled}" id="prev-btn">
      ${UI_TEXT.PREVIOUS_BUTTON}
    </button>
  `;

  if (state.hasNext()) {
    if (!hasAnswer || !isChecked) {
      const checkDisabled = !hasAnswer ? CSS_CLASSES.NAV_DISABLED : '';
      html += `
        <button class="check-answer-btn ${checkDisabled}" id="check-btn">
          ${UI_TEXT.CHECK_ANSWER_BUTTON}
        </button>
      `;
    } else if (isChecked && !isCorrect && !isWrongConfirmed) {
      html += `
        <button class="confirm-btn" id="confirm-btn">
          ${UI_TEXT.CONFIRM_CONTINUE_BUTTON}
        </button>
      `;
    } else if (state.canProceedToNext()) {
      html += `
        <button class="${CSS_CLASSES.NAV_BUTTON}" id="next-btn">
          ${UI_TEXT.NEXT_BUTTON}
        </button>
      `;
    }
  } else {
    if (!hasAnswer || !isChecked) {
      const checkDisabled = !hasAnswer ? CSS_CLASSES.NAV_DISABLED : '';
      html += `
        <button class="check-answer-btn ${checkDisabled}" id="check-btn">
          ${UI_TEXT.CHECK_ANSWER_BUTTON}
        </button>
      `;
    } else {
      html += `
        <button class="${CSS_CLASSES.SUBMIT_BUTTON}" id="submit-btn">
          ${UI_TEXT.SUBMIT_BUTTON}
        </button>
      `;
    }
  }

  return html;
}

/**
 * Renders results screen
 * @param {QuizState} state - Quiz state
 * @param {HTMLElement} container - Container element
 * @param {Function} onBackToMenu - Callback to return to menu
 */
function renderResults(state, container, onBackToMenu) {
  playGameOverSound();

  const score = state.calculateScore();
  const totalScore = state.getTotalScore();
  const maxStreak = state.getMaxStreak();
  const groupScores = state.getAllGroupScores();

  container.innerHTML = `
    <div class="${CSS_CLASSES.RESULTS_CONTAINER}">
      <h2>🎉 Quiz Complete!</h2>
      <div class="${CSS_CLASSES.SCORE_DISPLAY}">
        <div class="results-main-score">
          <div class="score-item">
            <div class="score-label">Accuracy</div>
            <div class="score-big">${score.correct} / ${score.total}</div>
            <div class="score-percentage">${score.percentage}%</div>
          </div>
          <div class="score-item">
            <div class="score-label">Total Score</div>
            <div class="score-big">${totalScore}</div>
            <div class="score-sublabel">points</div>
          </div>
          ${maxStreak > 0 ? `
            <div class="score-item">
              <div class="score-label">Max Streak</div>
              <div class="score-big">🔥 ${maxStreak}</div>
            </div>
          ` : ''}
        </div>
      </div>
      ${groupScores.length > 0 ? renderGroupScoreBreakdown(groupScores) : ''}
      <div class="results-buttons">
        <button class="${CSS_CLASSES.SUBMIT_BUTTON}" id="retry-btn">
          ${UI_TEXT.RETRY_BUTTON}
        </button>
        <button class="${CSS_CLASSES.NAV_BUTTON}" id="menu-btn">
          ${UI_TEXT.BACK_TO_MENU}
        </button>
      </div>
    </div>
  `;

  container.querySelector('#retry-btn').addEventListener('click', () => {
    playClickSound();
    state.reset();
    playGameStartSound();
    renderQuiz(state, container, onBackToMenu);
  });

  container.querySelector('#menu-btn').addEventListener('click', () => {
    playClickSound();
    onBackToMenu();
  });
}

/**
 * Renders group score breakdown table
 * @param {Array<Object>} groupScores - Array of group score objects
 * @returns {string} HTML string
 */
function renderGroupScoreBreakdown(groupScores) {
  const rows = groupScores.map(group => `
    <tr class="${group.isPerfect ? 'perfect-group' : ''}">
      <td>${group.startQuestion}-${group.endQuestion}</td>
      <td>${group.correct}/${group.total}</td>
      <td>${group.points}${group.bonus > 0 ? ` <span class="bonus-points">+${group.bonus}</span>` : ''}</td>
      <td>${group.isPerfect ? '⭐' : ''}</td>
    </tr>
  `).join('');

  return `
    <div class="group-score-breakdown">
      <h3>Group Performance</h3>
      <table class="score-table">
        <thead>
          <tr>
            <th>Questions</th>
            <th>Correct</th>
            <th>Points</th>
            <th>Perfect</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Handles check answer logic with sound and scoring
 * @param {QuizState} state - Quiz state
 * @param {HTMLElement} container - Container element
 */
function handleCheckAnswer(state, container) {
  playClickSound();

  const isCorrect = state.isCurrentAnswerCorrect();
  const scoreInfo = state.updateScore(isCorrect);

  state.checkCurrentAnswer();

  // Play appropriate sound
  if (isCorrect) {
    playCorrectSound();

    // Play streak sound on milestones
    if (scoreInfo.currentStreak === 5 || scoreInfo.currentStreak === 10) {
      setTimeout(() => playStreakSound(), 300);
    }
  } else {
    playWrongSound();
  }

  // Animate score change
  if (scoreInfo.pointsEarned > 0) {
    setTimeout(() => {
      animateScoreChange(scoreInfo.pointsEarned, container);
    }, 100);
  }

  renderQuiz(state, container, state.onBackToMenu);

  // Check for group milestone
  setTimeout(() => {
    const groupMilestone = state.checkGroupMilestone();
    if (groupMilestone) {
      showGroupMilestone(groupMilestone, container);
      if (groupMilestone.isPerfect) {
        playStreakSound();
      }
    }
  }, 500);
}

/**
 * Updates only navigation buttons without full re-render
 * @param {QuizState} state - Quiz state
 * @param {HTMLElement} container - Container element
 */
function updateNavigationButtons(state, container) {
  const navContainer = container.querySelector('.quiz-nav');
  if (!navContainer) return;

  navContainer.innerHTML = renderNavigationButtons(state);

  const checkBtn = container.querySelector('#check-btn');
  if (checkBtn && !checkBtn.classList.contains(CSS_CLASSES.NAV_DISABLED)) {
    checkBtn.addEventListener('click', () => {
      handleCheckAnswer(state, container);
    });
  }

  const confirmBtn = container.querySelector('#confirm-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      playClickSound();
      state.confirmWrongAnswer();
      renderQuiz(state, container, state.onBackToMenu);
    });
  }

  const nextBtn = container.querySelector('#next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
      playTickSound();
      await state.goToNext();
      renderQuiz(state, container, state.onBackToMenu);
    });
  }

  const submitBtn = container.querySelector('#submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      playClickSound();
      state.submit();
      renderQuiz(state, container, state.onBackToMenu);
    });
  }

  const prevBtn = container.querySelector('#prev-btn');
  if (prevBtn && !prevBtn.classList.contains(CSS_CLASSES.NAV_DISABLED)) {
    prevBtn.addEventListener('click', () => {
      playTickSound();
      state.goToPrevious();
      renderQuiz(state, container, state.onBackToMenu);
    });
  }
}

/**
 * Attaches event listeners to interactive elements
 * @param {QuizState} state - Quiz state
 * @param {HTMLElement} container - Container element
 */
function attachEventListeners(state, container) {
  const question = state.getCurrentQuestion();

  // Mute button
  const muteButton = container.querySelector('#mute-button');
  if (muteButton) {
    muteButton.addEventListener('click', () => {
      toggleMute();
      renderQuiz(state, container, state.onBackToMenu);
    });
  }

  // Option buttons (multiple choice)
  const optionButtons = container.querySelectorAll(`.${CSS_CLASSES.OPTION_BUTTON}`);
  optionButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      playClickSound();
      const answer = e.target.dataset.answer;
      state.setAnswer(answer);

      // Update UI to show selection
      optionButtons.forEach(b => b.classList.remove(CSS_CLASSES.OPTION_SELECTED));
      e.target.classList.add(CSS_CLASSES.OPTION_SELECTED);

      // Re-render to enable Check button
      renderQuiz(state, container, state.onBackToMenu);
    });
  });

  // Text input
  const inputField = container.querySelector(`.${CSS_CLASSES.INPUT_FIELD}`);
  if (inputField) {
    inputField.addEventListener('input', (e) => {
      state.setAnswer(e.target.value);

      if (question.type === QUESTION_TYPES.FILL_BLANK) {
        const userLetters = e.target.value.split('');
        const letterBoxes = container.querySelectorAll('.letter-box');
        letterBoxes.forEach((box, idx) => {
          const letter = userLetters[idx] || '';
          box.textContent = letter;
          box.classList.toggle('filled', letter !== '');
        });
      }

      // Update navigation buttons to enable/disable Check button
      updateNavigationButtons(state, container);
    });
  }

  // Word arrangement
  if (question.type === QUESTION_TYPES.WORD_ARRANGEMENT) {
    attachWordArrangementListeners(state, container);
  }

  // Explanation toggle
  const explanationToggle = container.querySelector('#explanation-toggle');
  if (explanationToggle) {
    explanationToggle.addEventListener('click', () => {
      state.toggleExplanation();
      renderQuiz(state, container, state.onBackToMenu);
    });
  }

  // Check Answer button
  const checkBtn = container.querySelector('#check-btn');
  if (checkBtn && !checkBtn.classList.contains(CSS_CLASSES.NAV_DISABLED)) {
    checkBtn.addEventListener('click', () => {
      handleCheckAnswer(state, container);
    });
  }

  // Confirm button (for wrong answers)
  const confirmBtn = container.querySelector('#confirm-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      playClickSound();
      state.confirmWrongAnswer();
      renderQuiz(state, container, state.onBackToMenu);
    });
  }

  // Jump to question functionality
  const jumpInput = container.querySelector('#jump-input');
  const jumpBtn = container.querySelector('#jump-btn');

  if (jumpInput && jumpBtn) {
    const handleJump = () => {
      const targetQuestion = parseInt(jumpInput.value);
      const total = state.getTotalQuestions();

      if (targetQuestion >= 1 && targetQuestion <= total) {
        playTickSound();
        state.goToQuestion(targetQuestion - 1); // Convert to 0-based index
        renderQuiz(state, container, state.onBackToMenu);
      } else {
        jumpInput.value = '';
        jumpInput.placeholder = 'Invalid';
        setTimeout(() => {
          jumpInput.placeholder = state.currentIndex + 1;
        }, 1000);
      }
    };

    jumpBtn.addEventListener('click', handleJump);

    jumpInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleJump();
      }
    });
  }

  // Navigation buttons
  const prevBtn = container.querySelector('#prev-btn');
  const nextBtn = container.querySelector('#next-btn');
  const submitBtn = container.querySelector('#submit-btn');

  if (prevBtn && !prevBtn.classList.contains(CSS_CLASSES.NAV_DISABLED)) {
    prevBtn.addEventListener('click', () => {
      playTickSound();
      state.goToPrevious();
      renderQuiz(state, container, state.onBackToMenu);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
      playTickSound();
      await state.goToNext();
      renderQuiz(state, container, state.onBackToMenu);
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      playClickSound();
      state.submit();
      renderQuiz(state, container, state.onBackToMenu);
    });
  }
}

/**
 * Attaches event listeners for word arrangement interactions
 * @param {QuizState} state - Quiz state
 * @param {HTMLElement} container - Container element
 */
function attachWordArrangementListeners(state, container) {
  const wordChips = container.querySelectorAll('.word-chip');
  const answerArea = container.querySelector('.answer-area');

  // Click to add word
  wordChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      const word = e.currentTarget.dataset.word;
      state.addWordToArrangement(word);
      renderQuiz(state, container, state.onBackToMenu);
    });

    // Drag start
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', e.currentTarget.dataset.word);
      e.currentTarget.classList.add('dragging');
    });

    chip.addEventListener('dragend', (e) => {
      e.currentTarget.classList.remove('dragging');
    });
  });

  // Remove word listeners
  const removeButtons = container.querySelectorAll('.remove-word');
  removeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const word = e.currentTarget.dataset.word;
      state.removeWordFromArrangement(word);
      renderQuiz(state, container, state.onBackToMenu);
    });
  });

  // Drop zone for answer area
  if (answerArea) {
    answerArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      answerArea.classList.add('drag-over');
    });

    answerArea.addEventListener('dragleave', () => {
      answerArea.classList.remove('drag-over');
    });

    answerArea.addEventListener('drop', (e) => {
      e.preventDefault();
      answerArea.classList.remove('drag-over');
      const word = e.dataTransfer.getData('text/plain');
      if (word) {
        state.addWordToArrangement(word);
        renderQuiz(state, container, state.onBackToMenu);
      }
    });
  }
}

/**
 * Renders test set selection menu
 * @param {Array} testSets - Array of test set objects
 * @param {HTMLElement} container - Container element
 * @param {Function} onSelect - Callback when test set is selected
 */
export function renderTestSetMenu(testSets, container, onSelect) {
  const setsHtml = testSets.map(set => `
    <button class="test-set-btn" data-set-number="${set.setNumber}">
      Set ${set.setNumber}
      <span class="question-count">${set.questionCount || set.questions?.length || 0} questions</span>
    </button>
  `).join('');

  container.innerHTML = `
    <div class="test-set-menu">
      <h2>${UI_TEXT.SELECT_TEST_TITLE}</h2>
      <div class="test-sets-grid">
        ${setsHtml}
      </div>
    </div>
  `;

  container.querySelectorAll('.test-set-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const setNumber = parseInt(e.currentTarget.dataset.setNumber);
      const testSet = testSets.find(s => s.setNumber === setNumber);
      if (testSet) {
        onSelect(testSet);
      }
    });
  });
}

/**
 * Shows loading message
 * @param {HTMLElement} container - Container element
 */
export function showLoading(container) {
  container.innerHTML = `<div class="loading">${UI_TEXT.LOADING}</div>`;
}

/**
 * Shows error message
 * @param {HTMLElement} container - Container element
 * @param {Error} error - Error object
 */
export function showError(container, error) {
  container.innerHTML = `
    <div class="error">
      <p>${UI_TEXT.ERROR_LOADING}</p>
      <p class="error-details">${error.message}</p>
    </div>
  `;
}
