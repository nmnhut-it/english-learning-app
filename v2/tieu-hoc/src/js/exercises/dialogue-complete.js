/**
 * Dialogue Complete Exercise Type
 * Fill in dialogue blanks
 */

const DialogueCompleteExercise = {
  render(question, container, callbacks) {
    container.innerHTML = '';

    const exerciseCard = Utils.createElement('div', { class: 'card exercise' });

    const exerciseNum = Utils.createElement('span', {
      class: 'exercise__number'
    }, `Exercise ${question.id}`);

    const title = Utils.createElement('h3', {
      class: 'exercise__title'
    }, question.title || 'Complete the dialogue');

    const dialogue = Utils.createElement('div', { class: 'dialogue' });

    question.lines.forEach((line, index) => {
      const dialogueLine = Utils.createElement('div', { class: 'dialogue__line' });

      const speaker = Utils.createElement('span', {
        class: 'dialogue__speaker'
      }, `${line.speaker}:`);

      const textDiv = Utils.createElement('div', { class: 'dialogue__text' });

      if (line.blank) {
        let text = line.text;
        const inputHTML = `<input type="text" class="input dialogue__blank"
          id="blank-${line.blankId}" data-blank-id="${line.blankId}"
          placeholder="...">`;

        text = text.replace('___', inputHTML);
        textDiv.innerHTML = text;
      } else {
        textDiv.textContent = line.text;
      }

      dialogueLine.appendChild(speaker);
      dialogueLine.appendChild(textDiv);
      dialogue.appendChild(dialogueLine);
    });

    const actions = Utils.createElement('div', { class: 'exercise__actions' });

    const submitBtn = Utils.createElement('button', {
      class: 'btn btn--primary'
    }, 'Xong');

    submitBtn.onclick = () => {
      const answers = [];
      let hasEmpty = false;

      const inputs = dialogue.querySelectorAll('input[data-blank-id]');
      inputs.forEach(input => {
        const value = input.value.trim();
        if (Utils.isEmpty(value)) {
          hasEmpty = true;
        }
        answers.push({
          blankId: input.dataset.blankId,
          value: value
        });
      });

      if (hasEmpty) {
        Utils.showToast('Please fill all blanks', 'error');
        return;
      }

      callbacks.onAnswer(answers);
    };

    const hintBtn = Utils.createElement('button', {
      class: 'btn btn--secondary btn--small'
    }, '💡 Hint');

    hintBtn.onclick = () => callbacks.onHint();

    actions.appendChild(submitBtn);
    if (question.hints && question.hints.length > 0) {
      actions.appendChild(hintBtn);
    }

    exerciseCard.appendChild(exerciseNum);
    exerciseCard.appendChild(title);
    exerciseCard.appendChild(dialogue);
    exerciseCard.appendChild(actions);

    container.appendChild(exerciseCard);

    const firstInput = dialogue.querySelector('input');
    if (firstInput) firstInput.focus();
  },

  validate(userAnswers, question) {
    let allCorrect = true;

    question.lines.forEach(line => {
      if (line.blank) {
        const userAnswer = userAnswers.find(a => a.blankId === line.blankId);
        if (!userAnswer) {
          allCorrect = false;
          return;
        }

        const acceptedAnswers = line.acceptedAnswers || [line.answer];
        if (!Utils.validateAnswer(userAnswer.value, acceptedAnswers)) {
          allCorrect = false;
        }
      }
    });

    return allCorrect;
  },

  getUserAnswer(container) {
    const answers = [];
    const inputs = container.querySelectorAll('input[data-blank-id]');
    inputs.forEach(input => {
      answers.push({
        blankId: input.dataset.blankId,
        value: input.value.trim()
      });
    });
    return answers;
  },

  showFeedback(container, isCorrect, question) {
    const actions = container.querySelector('.exercise__actions');
    const inputs = container.querySelectorAll('input[data-blank-id]');

    inputs.forEach(input => {
      input.disabled = true;
      const blankId = input.dataset.blankId;
      const line = question.lines.find(l => l.blankId === blankId);

      if (line) {
        const acceptedAnswers = line.acceptedAnswers || [line.answer];
        if (Utils.validateAnswer(input.value, acceptedAnswers)) {
          input.classList.add('correct-answer');
        } else {
          input.classList.add('wrong-answer');
        }
      }
    });

    const feedbackDiv = Utils.createElement('div', {
      class: isCorrect ? 'feedback feedback--success' : 'feedback feedback--error'
    });

    if (isCorrect) {
      feedbackDiv.innerHTML = `
        <span class="feedback__icon">✓</span>
        <span>All correct! Great dialogue completion!</span>
      `;
    } else {
      feedbackDiv.innerHTML = `
        <span class="feedback__icon">✗</span>
        <span>Some answers need correction. Check the highlighted blanks.</span>
      `;
    }

    actions.insertAdjacentElement('afterend', feedbackDiv);

    const buttons = actions.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
  },

  reset(container) {
    const inputs = container.querySelectorAll('input[data-blank-id]');
    inputs.forEach(input => {
      input.value = '';
      input.disabled = false;
      input.classList.remove('correct-answer', 'wrong-answer');
    });

    const feedback = container.querySelector('.feedback');
    if (feedback) feedback.remove();

    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = false);
  }
};

if (typeof GameEngine !== 'undefined') {
  GameEngine.registerExerciseHandler('dialogue-complete', DialogueCompleteExercise);
}
