/**
 * Exercise component - handles different exercise types
 */

import { setExerciseCompleted, getExerciseStatus } from '../services/ProgressService.js';
import { t } from '../services/I18nService.js';

export function Exercise(props) {
  const { bookId, exercise, onComplete } = props;

  const el = document.createElement('div');
  el.className = 'exercise';

  let answered = false;
  let selectedOption = null;

  function render() {
    const previousStatus = getExerciseStatus(bookId, exercise.id);
    if (previousStatus !== undefined) {
      answered = true;
    }

    el.innerHTML = `
      <div class="exercise__header">
        <span class="exercise__icon">❓</span>
        <span class="exercise__label">${t('exercise')}</span>
      </div>

      <div class="exercise__question">
        ${exercise.question}
      </div>

      <div class="exercise__options" id="options-container">
        ${renderOptions()}
      </div>

      <div class="exercise__actions">
        <button class="btn btn--primary exercise__check" id="check-btn" disabled>
          ${t('check')}
        </button>
      </div>

      <div class="exercise__feedback" id="feedback" hidden></div>
    `;

    bindEvents();
  }

  function renderOptions() {
    switch (exercise.exerciseType) {
      case 'multiple_choice':
        return renderMultipleChoice();
      case 'true_false':
        return renderTrueFalse();
      case 'fill_in_blanks':
        return renderFillInBlanks();
      default:
        return renderMultipleChoice();
    }
  }

  function renderMultipleChoice() {
    return (exercise.options || []).map((option, index) => `
      <label class="exercise__option" data-index="${index}">
        <input type="radio" name="exercise-${exercise.id}" value="${index}">
        <span class="exercise__option-text">${option.text}</span>
        <span class="exercise__option-indicator"></span>
      </label>
    `).join('');
  }

  function renderTrueFalse() {
    return `
      <label class="exercise__option" data-index="0">
        <input type="radio" name="exercise-${exercise.id}" value="true">
        <span class="exercise__option-text">True</span>
        <span class="exercise__option-indicator"></span>
      </label>
      <label class="exercise__option" data-index="1">
        <input type="radio" name="exercise-${exercise.id}" value="false">
        <span class="exercise__option-text">False</span>
        <span class="exercise__option-indicator"></span>
      </label>
    `;
  }

  function renderFillInBlanks() {
    return `
      <input type="text" class="exercise__input" id="fill-input" placeholder="${t('selectAnswer')}">
    `;
  }

  function bindEvents() {
    const checkBtn = el.querySelector('#check-btn');

    // Option selection
    el.querySelectorAll('.exercise__option').forEach(option => {
      option.addEventListener('click', () => {
        if (answered) return;

        // Remove previous selection
        el.querySelectorAll('.exercise__option').forEach(o => {
          o.classList.remove('exercise__option--selected');
        });

        // Add selection
        option.classList.add('exercise__option--selected');
        selectedOption = option.dataset.index;

        // Enable check button
        checkBtn.disabled = false;
      });
    });

    // Fill in blanks input
    const fillInput = el.querySelector('#fill-input');
    if (fillInput) {
      fillInput.addEventListener('input', () => {
        checkBtn.disabled = !fillInput.value.trim();
      });
    }

    // Check answer
    checkBtn.addEventListener('click', checkAnswer);
  }

  function checkAnswer() {
    if (answered) return;
    answered = true;

    let isCorrect = false;

    switch (exercise.exerciseType) {
      case 'multiple_choice':
        isCorrect = checkMultipleChoice();
        break;
      case 'true_false':
        isCorrect = checkTrueFalse();
        break;
      case 'fill_in_blanks':
        isCorrect = checkFillInBlanks();
        break;
      default:
        isCorrect = checkMultipleChoice();
    }

    // Save result
    setExerciseCompleted(bookId, exercise.id, isCorrect);

    // Show feedback
    showFeedback(isCorrect);

    // Callback
    if (onComplete) onComplete(isCorrect);
  }

  function checkMultipleChoice() {
    const options = exercise.options || [];
    const correctIndex = options.findIndex(o => o.correct);

    // Mark correct/incorrect options
    el.querySelectorAll('.exercise__option').forEach((option, index) => {
      if (index === correctIndex) {
        option.classList.add('exercise__option--correct');
      } else if (parseInt(selectedOption) === index) {
        option.classList.add('exercise__option--incorrect');
      }
    });

    return parseInt(selectedOption) === correctIndex;
  }

  function checkTrueFalse() {
    const correctAnswer = exercise.correctAnswer ? 'true' : 'false';
    const selected = el.querySelector('input[name="exercise-' + exercise.id + '"]:checked')?.value;

    el.querySelectorAll('.exercise__option').forEach(option => {
      const value = option.querySelector('input').value;
      if (value === correctAnswer) {
        option.classList.add('exercise__option--correct');
      } else if (value === selected) {
        option.classList.add('exercise__option--incorrect');
      }
    });

    return selected === correctAnswer;
  }

  function checkFillInBlanks() {
    const input = el.querySelector('#fill-input');
    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = (exercise.correctAnswer || '').toLowerCase();

    const isCorrect = userAnswer === correctAnswer;

    input.classList.add(isCorrect ? 'exercise__input--correct' : 'exercise__input--incorrect');

    if (!isCorrect) {
      // Show correct answer
      const hint = document.createElement('div');
      hint.className = 'exercise__hint';
      hint.textContent = `${t('correct')}: ${exercise.correctAnswer}`;
      input.parentNode.appendChild(hint);
    }

    return isCorrect;
  }

  function showFeedback(isCorrect) {
    const feedback = el.querySelector('#feedback');
    feedback.hidden = false;
    feedback.className = `exercise__feedback exercise__feedback--${isCorrect ? 'correct' : 'incorrect'}`;
    feedback.innerHTML = `
      <span class="exercise__feedback-icon">${isCorrect ? '✓' : '✗'}</span>
      <span class="exercise__feedback-text">
        ${isCorrect
          ? (exercise.correctFeedback || t('correct'))
          : (exercise.incorrectFeedback || t('incorrect'))
        }
      </span>
    `;

    // Disable check button
    const checkBtn = el.querySelector('#check-btn');
    checkBtn.disabled = true;
    checkBtn.textContent = isCorrect ? '✓ ' + t('correct') : t('tryAgain');
  }

  // Initialize
  render();

  return {
    el,
    destroy: () => el.remove()
  };
}
