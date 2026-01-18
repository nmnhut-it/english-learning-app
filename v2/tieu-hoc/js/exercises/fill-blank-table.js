/**
 * Fill-Blank-Table Exercise Type
 * Complete tables with multiple cells
 */

const FillBlankTableExercise = {
  render(question, container, callbacks) {
    container.innerHTML = '';

    const exerciseCard = Utils.createElement('div', { class: 'card exercise' });

    const exerciseNum = Utils.createElement('span', {
      class: 'exercise__number'
    }, `Exercise ${question.id}`);

    const title = Utils.createElement('h3', {
      class: 'exercise__title'
    }, question.title || 'Complete the table');

    const table = Utils.createElement('table', { class: 'table-exercise' });

    const thead = Utils.createElement('thead');
    const headerRow = Utils.createElement('tr');
    question.headers.forEach(header => {
      const th = Utils.createElement('th', {}, header);
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = Utils.createElement('tbody');
    question.rows.forEach((row, rowIndex) => {
      const tr = Utils.createElement('tr');
      row.cells.forEach((cell, cellIndex) => {
        const td = Utils.createElement('td');
        if (cell === '___' || row.cellsToFill.includes(cellIndex)) {
          const input = Utils.createElement('input', {
            type: 'text',
            class: 'input',
            id: `cell-${rowIndex}-${cellIndex}`,
            placeholder: '...',
            dataset: { row: rowIndex, cell: cellIndex }
          });
          td.appendChild(input);
        } else {
          td.textContent = cell;
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    const actions = Utils.createElement('div', { class: 'exercise__actions' });

    const submitBtn = Utils.createElement('button', {
      class: 'btn btn--primary'
    }, 'Xong');

    submitBtn.onclick = () => {
      const answers = [];
      const inputs = table.querySelectorAll('input');
      let hasEmpty = false;

      inputs.forEach(input => {
        const value = input.value.trim();
        if (Utils.isEmpty(value)) {
          hasEmpty = true;
        }
        answers.push({
          row: parseInt(input.dataset.row),
          cell: parseInt(input.dataset.cell),
          value: value
        });
      });

      if (hasEmpty) {
        Utils.showToast('Please fill all cells', 'error');
        return;
      }

      callbacks.onAnswer(answers);
    };

    actions.appendChild(submitBtn);

    exerciseCard.appendChild(exerciseNum);
    exerciseCard.appendChild(title);
    exerciseCard.appendChild(table);
    exerciseCard.appendChild(actions);

    container.appendChild(exerciseCard);

    const firstInput = table.querySelector('input');
    if (firstInput) firstInput.focus();
  },

  validate(userAnswers, question) {
    let correctCount = 0;
    let totalCount = 0;

    question.rows.forEach((row, rowIndex) => {
      row.cellsToFill.forEach((cellIndex, answerIndex) => {
        totalCount++;
        const userAnswer = userAnswers.find(
          a => a.row === rowIndex && a.cell === cellIndex
        );
        if (userAnswer) {
          const correctAnswer = row.answers[answerIndex];
          if (Utils.compareAnswers(userAnswer.value, correctAnswer)) {
            correctCount++;
          }
        }
      });
    });

    return correctCount === totalCount;
  },

  getUserAnswer(container) {
    const answers = [];
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
      answers.push({
        row: parseInt(input.dataset.row),
        cell: parseInt(input.dataset.cell),
        value: input.value.trim()
      });
    });
    return answers;
  },

  showFeedback(container, isCorrect, question) {
    const actions = container.querySelector('.exercise__actions');
    const inputs = container.querySelectorAll('input');

    inputs.forEach(input => {
      input.disabled = true;
      const rowIndex = parseInt(input.dataset.row);
      const cellIndex = parseInt(input.dataset.cell);
      const row = question.rows[rowIndex];
      const answerIndex = row.cellsToFill.indexOf(cellIndex);
      const correctAnswer = row.answers[answerIndex];

      if (Utils.compareAnswers(input.value, correctAnswer)) {
        input.classList.add('correct-answer');
      } else {
        input.classList.add('wrong-answer');
      }
    });

    const feedbackDiv = Utils.createElement('div', {
      class: isCorrect ? 'feedback feedback--success' : 'feedback feedback--error'
    });

    if (isCorrect) {
      feedbackDiv.innerHTML = `
        <span class="feedback__icon">✓</span>
        <span>All correct! Excellent work!</span>
      `;
    } else {
      feedbackDiv.innerHTML = `
        <span class="feedback__icon">✗</span>
        <span>Some answers need correction. Check the highlighted cells.</span>
      `;
    }

    actions.insertAdjacentElement('afterend', feedbackDiv);

    const buttons = actions.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
  },

  reset(container) {
    const inputs = container.querySelectorAll('input');
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
  GameEngine.registerExerciseHandler('fill-blank-table', FillBlankTableExercise);
}
