/**
 * Word Rearrange Exercise Type
 * Tap words in correct order to build sentences
 * Mobile-friendly: no typing required
 */

const WordRearrangeExercise = {
  /**
   * Render the UI for word rearrange exercise
   * @param {Object} question - Question data from JSON
   * @param {HTMLElement} container - DOM element to render into
   * @param {Object} callbacks - { onAnswer, onHint }
   */
  render(question, container, callbacks) {
    container.innerHTML = '';

    const exerciseCard = Utils.createElement('div', { class: 'card exercise' });

    const exerciseNum = Utils.createElement('span', {
      class: 'exercise__number'
    }, `Câu ${question.id}`);

    // Instruction
    const defaultInstruction = question.distractors && question.distractors.length > 0
      ? 'Sắp xếp các từ thành câu đúng (có từ thừa không cần dùng)'
      : 'Sắp xếp các từ thành câu đúng';

    const instruction = Utils.createElement('div', {
      class: 'exercise__instructions'
    }, question.instruction || defaultInstruction);

    // Answer area (where arranged words appear)
    const answerArea = Utils.createElement('div', {
      class: 'word-arrange__answer-area',
      id: `answer-area-${question.id}`
    });

    // Word bank (tiles to tap)
    const wordBank = Utils.createElement('div', {
      class: 'word-arrange__bank',
      id: `word-bank-${question.id}`
    });

    // Get words array (data is standardized by unify-exercise-data.js script)
    const sourceWords = question.words || [];
    const allWords = [...sourceWords];
    if (question.distractors && question.distractors.length > 0) {
      allWords.push(...question.distractors);
    }
    const shuffled = Utils.shuffleArray(allWords);

    // Create word tiles
    shuffled.forEach((word, index) => {
      const tile = Utils.createElement('button', {
        class: 'word-tile',
        type: 'button'
      }, word);

      tile.dataset.word = word;
      tile.dataset.index = index;

      tile.onclick = () => this.handleWordTap(tile, answerArea, wordBank);
      wordBank.appendChild(tile);
    });

    // Actions
    const actions = Utils.createElement('div', { class: 'exercise__actions' });

    const submitBtn = Utils.createElement('button', {
      class: 'btn btn--primary',
      type: 'button'
    }, 'Nộp bài');

    submitBtn.onclick = () => {
      const userSentence = this.getUserAnswer(answerArea);
      if (!userSentence) {
        Utils.showToast('Vui lòng sắp xếp các từ', 'error');
        return;
      }
      callbacks.onAnswer(userSentence);
    };

    const clearBtn = Utils.createElement('button', {
      class: 'btn btn--secondary btn--small',
      type: 'button'
    }, '🔄 Xóa');

    clearBtn.onclick = () => this.clearAnswer(answerArea, wordBank);

    const hintBtn = Utils.createElement('button', {
      class: 'btn btn--secondary btn--small',
      type: 'button'
    }, '💡 Gợi ý');

    hintBtn.onclick = () => callbacks.onHint();

    actions.appendChild(submitBtn);
    actions.appendChild(clearBtn);
    if (question.hints && question.hints.length > 0) {
      actions.appendChild(hintBtn);
    }

    exerciseCard.appendChild(exerciseNum);
    exerciseCard.appendChild(instruction);
    exerciseCard.appendChild(answerArea);
    exerciseCard.appendChild(wordBank);
    exerciseCard.appendChild(actions);

    container.appendChild(exerciseCard);
  },

  /**
   * Handle word tile tap
   * @param {HTMLElement} tile - Clicked tile
   * @param {HTMLElement} answerArea - Answer area container
   * @param {HTMLElement} wordBank - Word bank container
   */
  handleWordTap(tile, answerArea, wordBank) {
    if (tile.classList.contains('word-tile--used')) {
      return;
    }

    if (!tile.classList.contains('word-tile--selected')) {
      // Add to answer area (don't remove from word bank, just mark as used)
      tile.classList.add('word-tile--used');

      // Create a clone for the answer area
      const clone = tile.cloneNode(true);
      clone.classList.remove('word-tile--used');
      clone.classList.add('word-tile--selected');
      clone.dataset.originalTile = tile.dataset.index;

      clone.onclick = () => this.removeFromAnswer(clone, answerArea, wordBank);
      answerArea.appendChild(clone);
    }
  },

  /**
   * Remove word from answer area
   * @param {HTMLElement} clone - Cloned tile in answer area
   * @param {HTMLElement} answerArea - Answer area container
   * @param {HTMLElement} wordBank - Word bank container
   */
  removeFromAnswer(clone, answerArea, wordBank) {
    const originalIndex = clone.dataset.originalTile;
    const originalTile = wordBank.querySelector(`[data-index="${originalIndex}"]`);

    if (originalTile) {
      originalTile.classList.remove('word-tile--used');
    }

    clone.remove();
  },

  /**
   * Clear all words from answer area
   * @param {HTMLElement} answerArea - Answer area container
   * @param {HTMLElement} wordBank - Word bank container
   */
  clearAnswer(answerArea, wordBank) {
    const clones = answerArea.querySelectorAll('.word-tile');
    clones.forEach(clone => {
      const originalIndex = clone.dataset.originalTile;
      const originalTile = wordBank.querySelector(`[data-index="${originalIndex}"]`);

      if (originalTile) {
        originalTile.classList.remove('word-tile--used');
      }

      clone.remove();
    });
  },

  /**
   * Get user's current answer from UI
   * @param {HTMLElement} answerArea - Answer area container
   * @returns {string} - Current user answer
   */
  getUserAnswer(answerArea) {
    const tiles = answerArea.querySelectorAll('.word-tile');
    return Array.from(tiles).map(t => t.dataset.word).join(' ');
  },

  /**
   * Validate student answer
   * @param {string} userAnswer - Student's answer
   * @param {Object} question - Question data
   * @returns {boolean} - True if correct
   */
  validate(userAnswer, question) {
    const normalized = Utils.normalizeText(userAnswer);

    // Check accepted answers first if provided
    if (question.acceptedAnswers && question.acceptedAnswers.length > 0) {
      return question.acceptedAnswers.some(accepted =>
        Utils.normalizeText(accepted) === normalized
      );
    }

    // Use standardized correctSentence field
    return normalized === Utils.normalizeText(question.correctSentence || '');
  },

  /**
   * Builds hints HTML for display in feedback
   * @param {Object} question - Question object
   * @returns {string} HTML string for hints
   */
  buildHintsHtml(question) {
    if (!question.hints || question.hints.length === 0) {
      return '';
    }

    const hintsList = question.hints.map(hint => `<li>${hint}</li>`).join('');
    return `<div class="feedback__hints"><strong>💡 Gợi ý:</strong><ul>${hintsList}</ul></div>`;
  },

  /**
   * Show visual feedback for correct/wrong answer
   * @param {HTMLElement} container - DOM element
   * @param {boolean} isCorrect - Whether answer was correct
   * @param {Object} question - Question data
   * @param {Function} onNext - Callback to advance to next question
   */
  showFeedback(container, isCorrect, question) {
    const actions = container.querySelector('.exercise__actions');
    const answerArea = container.querySelector('.word-arrange__answer-area');

    // Disable all tiles
    container.querySelectorAll('.word-tile').forEach(tile => {
      tile.disabled = true;
      tile.style.cursor = 'not-allowed';
    });

    const feedbackDiv = Utils.createElement('div', {
      class: isCorrect ? 'feedback feedback--success' : 'feedback feedback--error'
    });

    // Build hints and explanation HTML
    const hintsHtml = this.buildHintsHtml(question);
    const explanationHtml = question.explanation ? `<div class="feedback__explanation">${question.explanation}</div>` : '';

    if (isCorrect) {
      answerArea.classList.add('correct-answer');
      feedbackDiv.innerHTML = `
        <span class="feedback__icon">✓</span>
        <div>
          <div>Đúng rồi! Giỏi lắm!</div>
          ${explanationHtml}
          ${hintsHtml}
        </div>
      `;
    } else {
      answerArea.classList.add('wrong-answer');
      // Use standardized correctSentence field
      feedbackDiv.innerHTML = `
        <span class="feedback__icon">✗</span>
        <div>
          <div>Chưa đúng.</div>
          <div class="feedback__correct-answer">Đáp án đúng: <strong>${question.correctSentence || ''}</strong></div>
          ${explanationHtml}
          ${hintsHtml}
        </div>
      `;
    }

    actions.insertAdjacentElement('afterend', feedbackDiv);

    const buttons = actions.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
  },

  /**
   * Reset exercise for retry
   * @param {HTMLElement} container - DOM element
   */
  reset(container) {
    const answerArea = container.querySelector('.word-arrange__answer-area');
    const wordBank = container.querySelector('.word-arrange__bank');

    answerArea.classList.remove('correct-answer', 'wrong-answer');

    // Move all tiles back
    this.clearAnswer(answerArea, wordBank);

    // Re-enable tiles
    container.querySelectorAll('.word-tile').forEach(tile => {
      tile.disabled = false;
      tile.style.cursor = 'pointer';
    });

    const feedback = container.querySelector('.feedback');
    if (feedback) feedback.remove();

    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = false);
  }
};

// Register with game engine when loaded
if (typeof GameEngine !== 'undefined') {
  GameEngine.registerExerciseHandler('word-rearrange', WordRearrangeExercise);
  // Also register for word-arrangement (alternate name used in some units)
  GameEngine.registerExerciseHandler('word-arrangement', WordRearrangeExercise);
}
