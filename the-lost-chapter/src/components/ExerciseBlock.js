/**
 * ExerciseBlock Component - Interactive exercises
 */

export function createExercise(container, exercise, onComplete) {
  const state = {
    answered: false,
    selectedOption: null,
    isCorrect: false
  };

  function render() {
    container.innerHTML = `
      <div class="exercise-header">
        <span class="exercise-icon">&#9733;</span>
        <span>Exercise</span>
      </div>
      <div class="exercise-question">${exercise.question}</div>
      <div class="exercise-options"></div>
      <div class="exercise-feedback" style="display: none;"></div>
    `;

    const optionsContainer = container.querySelector('.exercise-options');

    switch (exercise.exerciseType) {
      case 'multiple_choice':
      case 'true_false':
        renderMultipleChoice(optionsContainer);
        break;
      case 'fill_blank':
        renderFillBlank(optionsContainer);
        break;
      case 'matching':
        renderMatching(optionsContainer);
        break;
      case 'ordering':
        renderOrdering(optionsContainer);
        break;
      default:
        renderMultipleChoice(optionsContainer);
    }
  }

  function renderMultipleChoice(optionsContainer) {
    const options = exercise.options || [];
    const correctIndex = exercise.correctIndex ?? options.findIndex(o =>
      typeof o === 'object' ? o.correct : false
    );

    options.forEach((option, index) => {
      const optionText = typeof option === 'object' ? option.text : option;
      const btn = document.createElement('button');
      btn.className = 'exercise-option';
      btn.innerHTML = `
        <span class="option-marker">${String.fromCharCode(65 + index)}</span>
        <span class="option-text">${optionText}</span>
      `;

      btn.addEventListener('click', () => {
        if (state.answered) return;

        state.answered = true;
        state.selectedOption = index;
        state.isCorrect = index === correctIndex;

        // Update all options
        optionsContainer.querySelectorAll('.exercise-option').forEach((opt, i) => {
          opt.classList.add('disabled');
          if (i === correctIndex) {
            opt.classList.add('correct');
          }
          if (i === index && !state.isCorrect) {
            opt.classList.add('incorrect');
          }
        });

        showFeedback();
        if (onComplete) onComplete(state.isCorrect);
      });

      optionsContainer.appendChild(btn);
    });
  }

  function renderFillBlank(optionsContainer) {
    const answer = exercise.answer || '';
    const caseSensitive = exercise.caseSensitive ?? false;

    const inputContainer = document.createElement('div');
    inputContainer.innerHTML = `
      <input type="text" class="fill-blank-input" placeholder="Type your answer...">
      <button class="btn" style="margin-left: var(--space-md);">Check</button>
    `;

    const input = inputContainer.querySelector('input');
    const checkBtn = inputContainer.querySelector('.btn');

    checkBtn.addEventListener('click', () => {
      if (state.answered) return;

      state.answered = true;
      const userAnswer = input.value.trim();
      const correctAnswer = caseSensitive ? answer : answer.toLowerCase();
      const compareAnswer = caseSensitive ? userAnswer : userAnswer.toLowerCase();

      state.isCorrect = compareAnswer === correctAnswer;

      input.classList.add(state.isCorrect ? 'correct' : 'incorrect');
      input.disabled = true;
      checkBtn.disabled = true;

      if (!state.isCorrect) {
        const correctSpan = document.createElement('span');
        correctSpan.style.marginLeft = 'var(--space-md)';
        correctSpan.style.color = 'var(--success)';
        correctSpan.textContent = `Correct: ${answer}`;
        inputContainer.appendChild(correctSpan);
      }

      showFeedback();
      if (onComplete) onComplete(state.isCorrect);
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') checkBtn.click();
    });

    optionsContainer.appendChild(inputContainer);
  }

  function renderMatching(optionsContainer) {
    const pairs = exercise.pairs || [];
    const shuffledRight = [...pairs].sort(() => Math.random() - 0.5);

    optionsContainer.innerHTML = `
      <div class="matching-container" style="display: flex; gap: var(--space-xl);">
        <div class="matching-left"></div>
        <div class="matching-right"></div>
      </div>
      <button class="btn check-matching" style="margin-top: var(--space-md);">Check Answers</button>
    `;

    const leftCol = optionsContainer.querySelector('.matching-left');
    const rightCol = optionsContainer.querySelector('.matching-right');

    pairs.forEach((pair, i) => {
      const leftItem = document.createElement('div');
      leftItem.className = 'matching-item';
      leftItem.innerHTML = `<span>${i + 1}. ${pair.left}</span>`;
      leftItem.dataset.index = i;
      leftCol.appendChild(leftItem);
    });

    shuffledRight.forEach((pair, i) => {
      const rightItem = document.createElement('div');
      rightItem.className = 'matching-item';
      rightItem.innerHTML = `
        <select data-index="${i}">
          <option value="">--</option>
          ${pairs.map((_, j) => `<option value="${j}">${j + 1}</option>`).join('')}
        </select>
        ${pair.right}
      `;
      rightCol.appendChild(rightItem);
    });

    optionsContainer.querySelector('.check-matching').addEventListener('click', () => {
      if (state.answered) return;
      state.answered = true;

      let correct = 0;
      const selects = rightCol.querySelectorAll('select');

      selects.forEach((select, i) => {
        const originalIndex = pairs.indexOf(shuffledRight[i]);
        const selectedValue = parseInt(select.value);

        if (selectedValue === originalIndex) {
          correct++;
          select.parentElement.classList.add('correct');
        } else {
          select.parentElement.classList.add('incorrect');
        }
        select.disabled = true;
      });

      state.isCorrect = correct === pairs.length;
      showFeedback(`${correct}/${pairs.length} correct`);
      if (onComplete) onComplete(state.isCorrect);
    });
  }

  function renderOrdering(optionsContainer) {
    const items = exercise.items || [];
    const shuffled = [...items].sort(() => Math.random() - 0.5);

    optionsContainer.innerHTML = `
      <div class="ordering-list"></div>
      <button class="btn check-order" style="margin-top: var(--space-md);">Check Order</button>
    `;

    const list = optionsContainer.querySelector('.ordering-list');

    shuffled.forEach((item, i) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'exercise-option';
      itemEl.draggable = true;
      itemEl.dataset.originalIndex = items.indexOf(item);
      itemEl.innerHTML = `
        <span class="option-marker">${i + 1}</span>
        <span class="option-text">${item}</span>
      `;

      itemEl.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', i);
        itemEl.classList.add('dragging');
      });

      itemEl.addEventListener('dragend', () => {
        itemEl.classList.remove('dragging');
      });

      itemEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dragging = list.querySelector('.dragging');
        if (dragging !== itemEl) {
          const rect = itemEl.getBoundingClientRect();
          const mid = rect.top + rect.height / 2;
          if (e.clientY < mid) {
            list.insertBefore(dragging, itemEl);
          } else {
            list.insertBefore(dragging, itemEl.nextSibling);
          }
        }
      });

      list.appendChild(itemEl);
    });

    optionsContainer.querySelector('.check-order').addEventListener('click', () => {
      if (state.answered) return;
      state.answered = true;

      const orderedItems = list.querySelectorAll('.exercise-option');
      let correct = true;

      orderedItems.forEach((item, i) => {
        const originalIndex = parseInt(item.dataset.originalIndex);
        item.querySelector('.option-marker').textContent = i + 1;

        if (originalIndex === i) {
          item.classList.add('correct');
        } else {
          item.classList.add('incorrect');
          correct = false;
        }
      });

      state.isCorrect = correct;
      showFeedback();
      if (onComplete) onComplete(state.isCorrect);
    });
  }

  function showFeedback(customMessage) {
    const feedback = container.querySelector('.exercise-feedback');
    feedback.style.display = 'block';
    feedback.className = `exercise-feedback ${state.isCorrect ? 'correct' : 'incorrect'}`;

    if (customMessage) {
      feedback.textContent = customMessage;
    } else if (state.isCorrect) {
      feedback.textContent = exercise.correctFeedback || 'Correct! Well done.';
    } else {
      feedback.textContent = exercise.incorrectFeedback || 'Not quite. Try reviewing the content.';
    }
  }

  render();

  return () => {
    // Cleanup if needed
  };
}
