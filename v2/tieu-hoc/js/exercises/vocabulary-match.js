/**
 * VocabularyMatch Exercise Type
 * Matches English words with Vietnamese definitions
 * Implements standard exercise API for game engine integration
 */

const VocabularyMatchExercise = {
  /**
   * Render matching pairs UI
   * Creates draggable/clickable interface for matching words with definitions
   */
  render(question, container, callbacks) {
    container.innerHTML = '';

    const { pairs, hints } = question;

    // Shuffle Vietnamese options to make it challenging
    const shuffledVietnamese = this._shuffleArray([...pairs]);

    const exerciseCard = Utils.createElement('div', { class: 'card exercise' });

    const exerciseNum = Utils.createElement('span', {
      class: 'exercise__number'
    }, `Exercise ${question.id}`);

    const instructions = Utils.createElement('div', {
      class: 'exercise__instructions'
    }, 'Match each English word with its Vietnamese meaning');

    // Create matching area
    const matchingArea = Utils.createElement('div', { class: 'matching-area' });

    pairs.forEach((pair, index) => {
      const matchItem = Utils.createElement('div', { class: 'match-item' });
      matchItem.dataset.index = index;
      matchItem.dataset.word = pair.english;

      const matchLabel = Utils.createElement('label', { class: 'match-label' });
      matchLabel.innerHTML = `<span class="match-number">${index + 1}.</span> <strong>${pair.english}</strong>`;

      const select = Utils.createElement('select', { class: 'input match-select' });
      select.dataset.index = index;

      const defaultOption = Utils.createElement('option', { value: '' }, '-- Chọn nghĩa tiếng Việt --');
      select.appendChild(defaultOption);

      shuffledVietnamese.forEach(p => {
        const option = Utils.createElement('option', { value: p.vietnamese }, p.vietnamese);
        select.appendChild(option);
      });

      matchItem.appendChild(matchLabel);
      matchItem.appendChild(select);
      matchingArea.appendChild(matchItem);
    });

    const actions = Utils.createElement('div', { class: 'exercise__actions' });

    const submitBtn = Utils.createElement('button', {
      class: 'btn btn--primary'
    }, 'Nộp bài');

    submitBtn.onclick = () => {
      const userAnswer = this.getUserAnswer(container);

      // Check if all matches are selected
      const allSelected = userAnswer.every(item => item.vietnamese !== '');
      if (!allSelected) {
        Utils.showToast('Vui lòng hoàn thành tất cả các cặp', 'error');
        return;
      }

      callbacks.onAnswer(userAnswer);
    };

    const hintBtn = Utils.createElement('button', {
      class: 'btn btn--secondary btn--small'
    }, '💡 Gợi ý');

    hintBtn.onclick = () => callbacks.onHint();

    actions.appendChild(submitBtn);
    if (question.hints && question.hints.length > 0) {
      actions.appendChild(hintBtn);
    }

    exerciseCard.appendChild(exerciseNum);
    exerciseCard.appendChild(instructions);
    exerciseCard.appendChild(matchingArea);
    exerciseCard.appendChild(actions);

    container.appendChild(exerciseCard);
  },

  /**
   * Validate user's matches against correct pairs
   * Returns true only if all pairs are correctly matched
   */
  validate(userAnswer, question) {
    const { pairs } = question;

    if (!userAnswer || !Array.isArray(userAnswer)) {
      return false;
    }

    // Check if all matches are correct
    let allCorrect = true;
    for (let i = 0; i < pairs.length; i++) {
      const correctPair = pairs[i];
      const userMatch = userAnswer[i];

      if (!userMatch || userMatch.vietnamese !== correctPair.vietnamese) {
        allCorrect = false;
        break;
      }
    }

    return allCorrect;
  },

  /**
   * Extract user's current matches from UI
   * Returns array of {english, vietnamese} objects
   */
  getUserAnswer(container) {
    const selects = container.querySelectorAll('.match-select');
    const answer = [];

    selects.forEach((select, index) => {
      const englishItem = container.querySelector(`[data-index="${index}"]`);
      const english = englishItem.dataset.word;
      const vietnamese = select.value;

      answer.push({
        english: english,
        vietnamese: vietnamese
      });
    });

    return answer;
  },

  /**
   * Show visual feedback for correct/incorrect matches
   * Highlights correct matches in green, wrong ones in red
   */
  showFeedback(container, isCorrect, question) {
    const actions = container.querySelector('.exercise__actions');
    const { pairs } = question;
    const userAnswer = this.getUserAnswer(container);

    // Disable selects after submission
    const selects = container.querySelectorAll('.match-select');
    selects.forEach(select => {
      select.disabled = true;
    });

    const feedbackDiv = Utils.createElement('div', {
      class: isCorrect ? 'feedback feedback--success' : 'feedback feedback--error'
    });

    if (isCorrect) {
      feedbackDiv.innerHTML = `
        <span class="feedback__icon">✓</span>
        <span>Đúng rồi! Tất cả các cặp đều chính xác!</span>
      `;

      // Highlight all as correct
      const items = container.querySelectorAll('.match-item');
      items.forEach(item => {
        item.classList.add('correct');
      });
    } else {
      // Show which matches are wrong
      let wrongCount = 0;
      const items = container.querySelectorAll('.match-item');

      items.forEach((item, index) => {
        const correctVietnamese = pairs[index].vietnamese;
        const userVietnamese = userAnswer[index].vietnamese;

        if (userVietnamese === correctVietnamese) {
          item.classList.add('correct');
        } else {
          item.classList.add('wrong');
          wrongCount++;
        }
      });

      feedbackDiv.innerHTML = `
        <span class="feedback__icon">✗</span>
        <div>
          <div>Chưa đúng. Bạn có ${wrongCount} cặp sai.</div>
          <div class="feedback__correct-answer mt-1">
            <strong>Đáp án đúng:</strong><br>
            ${pairs.map(pair => `${pair.english} = ${pair.vietnamese}`).join('<br>')}
          </div>
        </div>
      `;
    }

    actions.insertAdjacentElement('afterend', feedbackDiv);

    // Disable action buttons
    const buttons = actions.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
  },

  /**
   * Reset exercise to initial state for retry
   * Clears selections and removes feedback
   */
  reset(container) {
    const selects = container.querySelectorAll('.match-select');
    selects.forEach(select => {
      select.value = '';
      select.disabled = false;
    });

    const items = container.querySelectorAll('.match-item');
    items.forEach(item => {
      item.classList.remove('correct', 'wrong');
    });

    const feedback = container.querySelector('.feedback');
    if (feedback) {
      feedback.remove();
    }

    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = false);
  },

  /**
   * Utility: Shuffle array using Fisher-Yates algorithm
   */
  _shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
};

// Auto-register with GameEngine if available
if (typeof GameEngine !== 'undefined') {
  GameEngine.registerExerciseHandler('vocabulary-match', VocabularyMatchExercise);
}
