/**
 * Open-Ended Exercise Type
 * Free writing exercises (not auto-scored)
 */

const OpenEndedExercise = {
  render(question, container, callbacks) {
    container.innerHTML = '';

    const exerciseCard = Utils.createElement('div', { class: 'card exercise' });

    const exerciseNum = Utils.createElement('span', {
      class: 'exercise__number'
    }, `Exercise ${question.id}`);

    const title = Utils.createElement('h3', {
      class: 'exercise__title'
    }, question.title || 'Writing Exercise');

    const instructions = Utils.createElement('div', {
      class: 'exercise__instructions'
    }, question.instruction);

    if (question.example) {
      const exampleBox = Utils.createElement('div', {
        class: 'theory-panel__example mt-2'
      }, question.example);
      instructions.appendChild(exampleBox);
    }

    const textarea = Utils.createElement('textarea', {
      class: 'input',
      id: `answer-${question.id}`,
      placeholder: 'Write your answer here...',
      rows: 10
    });

    const charCount = Utils.createElement('div', {
      class: 'text-right text-light mt-1'
    }, '0 words');

    textarea.addEventListener('input', () => {
      const words = textarea.value.trim().split(/\s+/).filter(w => w.length > 0);
      charCount.textContent = `${words.length} words`;

      if (question.maxWords && words.length > question.maxWords) {
        charCount.style.color = 'var(--danger)';
      } else {
        charCount.style.color = 'var(--text-light)';
      }
    });

    const actions = Utils.createElement('div', { class: 'exercise__actions' });

    const continueBtn = Utils.createElement('button', {
      class: 'btn btn--primary'
    }, 'Continue');

    continueBtn.onclick = () => {
      const words = textarea.value.trim().split(/\s+/).filter(w => w.length > 0);

      if (question.minSentences && words.length < question.minSentences * 3) {
        Utils.showToast(`Please write at least ${question.minSentences} sentences`, 'error');
        return;
      }

      callbacks.onAnswer(textarea.value.trim());
    };

    const note = Utils.createElement('div', {
      class: 'mt-2'
    });
    note.innerHTML = '<small><em>Note: This is a writing exercise. Your work is not automatically graded. Click Continue when you\'re done.</em></small>';

    actions.appendChild(continueBtn);

    exerciseCard.appendChild(exerciseNum);
    exerciseCard.appendChild(title);
    exerciseCard.appendChild(instructions);
    exerciseCard.appendChild(textarea);
    exerciseCard.appendChild(charCount);
    exerciseCard.appendChild(note);
    exerciseCard.appendChild(actions);

    container.appendChild(exerciseCard);

    textarea.focus();
  },

  validate(userAnswer, question) {
    return true;
  },

  getUserAnswer(container) {
    const textarea = container.querySelector('textarea');
    return textarea ? textarea.value.trim() : '';
  },

  showFeedback(container, isCorrect, question) {
    const textarea = container.querySelector('textarea');
    const actions = container.querySelector('.exercise__actions');

    if (textarea) textarea.disabled = true;

    const feedbackDiv = Utils.createElement('div', {
      class: 'feedback feedback--success'
    });

    feedbackDiv.innerHTML = `
      <span class="feedback__icon">✓</span>
      <span>Thank you for completing this writing exercise!</span>
    `;

    actions.insertAdjacentElement('afterend', feedbackDiv);

    const buttons = actions.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
  },

  reset(container) {
    const textarea = container.querySelector('textarea');
    if (textarea) {
      textarea.value = '';
      textarea.disabled = false;
      textarea.focus();
    }

    const feedback = container.querySelector('.feedback');
    if (feedback) feedback.remove();

    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = false);
  }
};

if (typeof GameEngine !== 'undefined') {
  GameEngine.registerExerciseHandler('open-ended', OpenEndedExercise);
}
