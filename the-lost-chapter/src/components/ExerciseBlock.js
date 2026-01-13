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
      <div class="exercise-actions" style="display: none;">
        <button class="btn btn-secondary exercise-retry">Try Again</button>
        <button class="btn exercise-continue">Continue</button>
      </div>
    `;

    renderOptions();
    bindEvents();
  }

  function renderOptions() {
    const optionsContainer = container.querySelector('.exercise-options');
    optionsContainer.innerHTML = '';

    switch (exercise.exerciseType) {
      case 'multiple_choice':
        renderMultipleChoice(optionsContainer);
        break;
      case 'true_false':
        renderTrueFalse(optionsContainer);
        break;
      case 'fill_blank':
        renderFillBlank(optionsContainer);
        break;
      default:
        renderMultipleChoice(optionsContainer);
    }
  }

  function renderMultipleChoice(container) {
    const markers = ['A', 'B', 'C', 'D', 'E'];
    exercise.options.forEach((option, index) => {
      const optionEl = document.createElement('div');
      optionEl.className = 'exercise-option';
      optionEl.dataset.index = index;
      optionEl.innerHTML = `
        <span class="exercise-option-marker">${markers[index]}</span>
        <span class="exercise-option-text">${option}</span>
      `;
      container.appendChild(optionEl);
    });
  }

  function renderTrueFalse(container) {
    ['True', 'False'].forEach((option, index) => {
      const optionEl = document.createElement('div');
      optionEl.className = 'exercise-option';
      optionEl.dataset.index = index;
      optionEl.innerHTML = `
        <span class="exercise-option-marker">${option.charAt(0)}</span>
        <span class="exercise-option-text">${option}</span>
      `;
      container.appendChild(optionEl);
    });
  }

  function renderFillBlank(container) {
    container.innerHTML = `
      <input type="text" class="fill-blank-input" placeholder="Type your answer...">
      <button class="btn check-answer">Check Answer</button>
    `;
  }

  function bindEvents() {
    // Option selection
    container.querySelectorAll('.exercise-option').forEach(option => {
      option.addEventListener('click', () => selectOption(parseInt(option.dataset.index)));
    });

    // Fill blank check
    const checkBtn = container.querySelector('.check-answer');
    if (checkBtn) {
      checkBtn.addEventListener('click', checkFillBlank);
      container.querySelector('.fill-blank-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkFillBlank();
      });
    }

    // Retry button
    container.querySelector('.exercise-retry')?.addEventListener('click', reset);

    // Continue button
    container.querySelector('.exercise-continue')?.addEventListener('click', () => {
      onComplete?.();
    });
  }

  function selectOption(index) {
    if (state.answered) return;

    // Clear previous selection
    container.querySelectorAll('.exercise-option').forEach(opt => {
      opt.classList.remove('selected');
    });

    // Mark selected
    const selected = container.querySelector(`[data-index="${index}"]`);
    selected.classList.add('selected');
    state.selectedOption = index;

    // Check answer
    checkAnswer(index);
  }

  function checkAnswer(selectedIndex) {
    state.answered = true;
    state.isCorrect = selectedIndex === exercise.correct;

    // Show correct/incorrect styling
    container.querySelectorAll('.exercise-option').forEach((opt, idx) => {
      if (idx === exercise.correct) {
        opt.classList.add('correct');
      } else if (idx === selectedIndex && !state.isCorrect) {
        opt.classList.add('incorrect');
      }
    });

    showFeedback();
  }

  function checkFillBlank() {
    const input = container.querySelector('.fill-blank-input');
    const answer = input.value.trim().toLowerCase();
    const correct = exercise.answer?.toLowerCase();

    state.answered = true;
    state.isCorrect = answer === correct;

    input.classList.add(state.isCorrect ? 'correct' : 'incorrect');
    showFeedback();
  }

  function showFeedback() {
    const feedbackEl = container.querySelector('.exercise-feedback');
    const actionsEl = container.querySelector('.exercise-actions');

    const feedback = state.isCorrect
      ? exercise.feedback?.correct || 'Correct!'
      : exercise.feedback?.incorrect || 'Not quite. Try again!';

    feedbackEl.textContent = feedback;
    feedbackEl.className = `exercise-feedback ${state.isCorrect ? 'correct' : 'incorrect'}`;
    feedbackEl.style.display = 'block';
    actionsEl.style.display = 'flex';

    // Hide retry if correct
    if (state.isCorrect) {
      container.querySelector('.exercise-retry').style.display = 'none';
    }
  }

  function reset() {
    state.answered = false;
    state.selectedOption = null;
    state.isCorrect = false;

    container.querySelector('.exercise-feedback').style.display = 'none';
    container.querySelector('.exercise-actions').style.display = 'none';

    container.querySelectorAll('.exercise-option').forEach(opt => {
      opt.classList.remove('selected', 'correct', 'incorrect');
    });

    const input = container.querySelector('.fill-blank-input');
    if (input) {
      input.value = '';
      input.classList.remove('correct', 'incorrect');
    }
  }

  function destroy() {
    container.innerHTML = '';
  }

  render();

  return {
    reset,
    destroy
  };
}
