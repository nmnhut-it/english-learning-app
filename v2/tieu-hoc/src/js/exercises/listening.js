/**
 * Listening Exercise Type
 * Supports TRUE/FALSE, multiple-choice, and fill-in-the-blank formats with audio player
 * Subtypes: 'true-false', 'multiple-choice', 'fill-blank'
 */

const ListeningExercise = {
  // Track state for current exercise
  currentState: {
    answeredQuestions: {},
    totalQuestions: 0,
    exerciseId: null,
    audioPlayed: false
  },

  // Track current focused question index for keyboard navigation
  focusedQuestionIndex: 0,

  render(exercise, container, callbacks) {
    container.innerHTML = '';

    // Reset state for new exercise
    this.currentState = {
      answeredQuestions: {},
      totalQuestions: exercise.questions?.length || 0,
      exerciseId: exercise.id,
      audioPlayed: false
    };

    // Reset focused question
    this.focusedQuestionIndex = 0;

    const exerciseCard = Utils.createElement('div', {
      class: 'card exercise listening-exercise'
    });

    // Exercise header
    const header = Utils.createElement('div', { class: 'listening-exercise__header' });

    const exerciseNum = Utils.createElement('span', {
      class: 'exercise__number'
    }, exercise.title || `Listening ${exercise.id}`);
    header.appendChild(exerciseNum);

    if (exercise.instruction) {
      const instruction = Utils.createElement('p', {
        class: 'listening-exercise__instruction'
      }, exercise.instruction);
      header.appendChild(instruction);
    }

    // Audio player section
    const audioSection = Utils.createElement('div', { class: 'listening-exercise__audio' });

    const audioTitle = Utils.createElement('h3', {
      class: 'listening-exercise__audio-title'
    }, '🎧 Nghe đoạn audio:');
    audioSection.appendChild(audioTitle);

    const audioPlayer = Utils.createElement('audio', {
      controls: true,
      class: 'listening-exercise__player',
      id: `audio-${exercise.id}`
    });

    if (exercise.audioUrl) {
      audioPlayer.src = exercise.audioUrl;
    }

    // Track when audio is played
    audioPlayer.addEventListener('play', () => {
      this.currentState.audioPlayed = true;
    });

    audioSection.appendChild(audioPlayer);

    // Audio source info
    if (exercise.audioSource) {
      const sourceInfo = Utils.createElement('p', {
        class: 'listening-exercise__source'
      }, `📚 Nguồn: ${exercise.audioSource}`);
      audioSection.appendChild(sourceInfo);
    }

    // Transcript (collapsible, optional)
    if (exercise.transcript) {
      const transcriptToggle = Utils.createElement('button', {
        class: 'btn btn--secondary btn--small mt-1',
        type: 'button'
      }, '📝 Xem transcript');

      const transcriptBox = Utils.createElement('div', {
        class: 'listening-exercise__transcript',
        style: 'display: none;'
      });
      transcriptBox.innerHTML = exercise.transcript.replace(/\n/g, '<br>');

      transcriptToggle.onclick = () => {
        const isHidden = transcriptBox.style.display === 'none';
        transcriptBox.style.display = isHidden ? 'block' : 'none';
        transcriptToggle.textContent = isHidden ? '📝 Ẩn transcript' : '📝 Xem transcript';
      };

      audioSection.appendChild(transcriptToggle);
      audioSection.appendChild(transcriptBox);
    }

    // Questions section
    const questionsSection = Utils.createElement('div', { class: 'listening-exercise__questions' });

    const questionsTitle = Utils.createElement('h3', {
      class: 'listening-exercise__questions-title'
    }, `📝 Trả lời các câu hỏi (${exercise.questions.length} câu):`);
    questionsSection.appendChild(questionsTitle);

    // Render questions based on subtype
    if (exercise.subtype === 'true-false') {
      exercise.questions.forEach((q, qIndex) => {
        const questionDiv = this.renderTrueFalseQuestion(q, qIndex, exercise, callbacks);
        questionsSection.appendChild(questionDiv);
      });
    } else if (exercise.subtype === 'multiple-choice') {
      // Render multiple choice questions
      exercise.questions.forEach((q, qIndex) => {
        const questionDiv = this.renderMultipleChoiceQuestion(q, qIndex, exercise, callbacks);
        questionsSection.appendChild(questionDiv);
      });
    } else if (exercise.subtype === 'fill-blank') {
      // Render passage with blanks
      if (exercise.passage) {
        const passageBox = Utils.createElement('div', { class: 'listening-exercise__passage' });
        passageBox.innerHTML = exercise.passage;
        questionsSection.appendChild(passageBox);
      }

      const blanksContainer = Utils.createElement('div', { class: 'listening-exercise__blanks' });
      exercise.questions.forEach((q, qIndex) => {
        const blankDiv = this.renderFillBlankQuestion(q, qIndex, exercise, callbacks);
        blanksContainer.appendChild(blankDiv);
      });
      questionsSection.appendChild(blanksContainer);
    }

    // Submit all button
    const actionsDiv = Utils.createElement('div', { class: 'listening-exercise__actions' });

    const submitAllBtn = Utils.createElement('button', {
      class: 'btn btn--primary btn--large',
      id: 'submit-all-btn'
    }, '✓ Nộp bài');

    submitAllBtn.onclick = () => this.handleSubmitAll(exercise, container, callbacks);
    actionsDiv.appendChild(submitAllBtn);

    // Hint button
    if (exercise.hints && exercise.hints.length > 0) {
      const hintBtn = Utils.createElement('button', {
        class: 'btn btn--secondary'
      }, '💡 Gợi ý');
      hintBtn.onclick = () => callbacks.onHint();
      actionsDiv.appendChild(hintBtn);
    }

    // Assemble
    exerciseCard.appendChild(header);
    exerciseCard.appendChild(audioSection);
    exerciseCard.appendChild(questionsSection);
    exerciseCard.appendChild(actionsDiv);

    container.appendChild(exerciseCard);

    // Attach keyboard handler based on subtype
    this.attachKeyboardHandler(exercise, container, callbacks);
  },

  /**
   * Attach keyboard handler for listening exercise
   * Supports navigation between questions and answer selection
   */
  attachKeyboardHandler(exercise, container, callbacks) {
    const self = this;
    const questionCount = exercise.questions.length;

    // Focus first question visually
    this.updateQuestionFocus(container, 0);

    const handler = (e) => {
      // Ignore if typing in input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        // Only handle Enter in input fields for fill-blank
        if (e.key === 'Enter' && exercise.subtype === 'fill-blank') {
          const currentInput = e.target;
          const blankDiv = currentInput.closest('[data-question-index]');
          if (blankDiv) {
            const nextIndex = parseInt(blankDiv.dataset.questionIndex) + 1;
            const nextInput = container.querySelector(`#blank-${exercise.id}-${nextIndex}`);
            if (nextInput) {
              nextInput.focus();
            }
          }
        }
        return;
      }

      const key = e.key;

      // Navigate between questions with Up/Down or Tab
      if (key === 'ArrowDown' || key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        self.focusedQuestionIndex = Math.min(self.focusedQuestionIndex + 1, questionCount - 1);
        self.updateQuestionFocus(container, self.focusedQuestionIndex);
        self.scrollToQuestion(container, self.focusedQuestionIndex, exercise);
      }

      if (key === 'ArrowUp' || (key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        self.focusedQuestionIndex = Math.max(self.focusedQuestionIndex - 1, 0);
        self.updateQuestionFocus(container, self.focusedQuestionIndex);
        self.scrollToQuestion(container, self.focusedQuestionIndex, exercise);
      }

      // Handle answer selection based on subtype
      if (exercise.subtype === 'true-false') {
        const tfMap = { 't': 'TRUE', 'T': 'TRUE', '1': 'TRUE', 'f': 'FALSE', 'F': 'FALSE', '2': 'FALSE' };
        if (tfMap.hasOwnProperty(key)) {
          e.preventDefault();
          self.selectTFAnswer(container, exercise, self.focusedQuestionIndex, tfMap[key]);
        }
      } else if (exercise.subtype === 'multiple-choice') {
        const mcMap = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
        if (mcMap.hasOwnProperty(key)) {
          const question = exercise.questions[self.focusedQuestionIndex];
          if (question && mcMap[key] < question.options.length) {
            e.preventDefault();
            self.selectMCAnswer(container, exercise, self.focusedQuestionIndex, mcMap[key]);
          }
        }
      }

      // Submit on Enter
      if (key === 'Enter') {
        e.preventDefault();
        self.handleSubmitAll(exercise, container, callbacks);
      }
    };

    // Store handler for cleanup
    Utils.KeyboardHelper.cleanup();
    document.addEventListener('keydown', handler);
    Utils.KeyboardHelper.activeHandler = handler;

    // Show keyboard hint
    this.showListeningKeyboardHint(container, exercise.subtype);
  },

  /**
   * Update visual focus on question
   */
  updateQuestionFocus(container, index) {
    const questions = container.querySelectorAll('.listening-question');
    questions.forEach((q, i) => {
      q.classList.toggle('listening-question--focused', i === index);
    });
  },

  /**
   * Scroll to focused question
   */
  scrollToQuestion(container, index, exercise) {
    let selector = '.listening-question';
    if (exercise.subtype === 'fill-blank') {
      selector = '.listening-blank';
    }
    const questions = container.querySelectorAll(selector);
    if (questions[index]) {
      questions[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  /**
   * Select TRUE/FALSE answer for a question
   */
  selectTFAnswer(container, exercise, questionIndex, value) {
    const questionDiv = container.querySelector(`[data-question-index="${questionIndex}"]`);
    if (!questionDiv) return;

    const radio = questionDiv.querySelector(`input[value="${value}"]`);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change'));
    }
  },

  /**
   * Select multiple choice answer for a question
   */
  selectMCAnswer(container, exercise, questionIndex, optionIndex) {
    const questionDiv = container.querySelector(`[data-question-index="${questionIndex}"]`);
    if (!questionDiv) return;

    const radios = questionDiv.querySelectorAll('input[type="radio"]');
    if (radios[optionIndex]) {
      radios[optionIndex].checked = true;
      radios[optionIndex].dispatchEvent(new Event('change'));
    }
  },

  /**
   * Show keyboard hint for listening exercise
   */
  showListeningKeyboardHint(container, subtype) {
    const existing = container.querySelector('.keyboard-hint');
    if (existing) existing.remove();

    let hintText = '⌨️ Phím tắt: ↑↓ chuyển câu | ';
    if (subtype === 'true-false') {
      hintText += 'T/1 = TRUE | F/2 = FALSE | ';
    } else if (subtype === 'multiple-choice') {
      hintText += '1-4 hoặc A-D chọn đáp án | ';
    }
    hintText += 'Enter nộp bài';

    const hint = Utils.createElement('div', { class: 'keyboard-hint' }, hintText);
    container.appendChild(hint);
  },

  renderTrueFalseQuestion(question, index, exercise, callbacks) {
    const questionDiv = Utils.createElement('div', {
      class: 'listening-question listening-question--tf',
      dataset: { questionIndex: index }
    });

    // Question text
    const questionText = Utils.createElement('p', {
      class: 'listening-question__text'
    });
    questionText.innerHTML = `<strong>${index + 1}.</strong> ${question.statement}`;
    questionDiv.appendChild(questionText);

    // TRUE/FALSE options
    const optionsDiv = Utils.createElement('div', { class: 'tf-options' });

    ['TRUE', 'FALSE'].forEach((option) => {
      const label = Utils.createElement('label', { class: 'tf-option' });
      const radio = Utils.createElement('input', {
        type: 'radio',
        name: `listening-q-${exercise.id}-${index}`,
        value: option,
        class: 'tf-input'
      });

      radio.addEventListener('change', () => {
        this.currentState.answeredQuestions[index] = option;
        // Update visual
        const labels = optionsDiv.querySelectorAll('.tf-option');
        labels.forEach(lbl => lbl.classList.remove('tf-option--selected'));
        label.classList.add('tf-option--selected');
      });

      const optionText = Utils.createElement('span', { class: 'tf-text' }, option);

      label.appendChild(radio);
      label.appendChild(optionText);
      optionsDiv.appendChild(label);
    });

    questionDiv.appendChild(optionsDiv);

    // Explanation box (hidden initially)
    const explanationBox = Utils.createElement('div', {
      class: 'explanation-box',
      id: `explanation-${exercise.id}-${index}`
    });
    questionDiv.appendChild(explanationBox);

    return questionDiv;
  },

  renderMultipleChoiceQuestion(question, index, exercise, callbacks) {
    const questionDiv = Utils.createElement('div', {
      class: 'listening-question listening-question--mc',
      dataset: { questionIndex: index }
    });

    // Question text
    const questionText = Utils.createElement('p', {
      class: 'listening-question__text'
    });
    questionText.innerHTML = `<strong>${index + 1}.</strong> ${question.question}`;
    questionDiv.appendChild(questionText);

    // Multiple choice options (A, B, C, D)
    const optionsDiv = Utils.createElement('div', { class: 'mc-options' });
    const optionLabels = ['A', 'B', 'C', 'D'];

    question.options.forEach((option, optIndex) => {
      const label = Utils.createElement('label', { class: 'mc-option' });
      const radio = Utils.createElement('input', {
        type: 'radio',
        name: `listening-mc-${exercise.id}-${index}`,
        value: optIndex,
        class: 'mc-input'
      });

      radio.addEventListener('change', () => {
        this.currentState.answeredQuestions[index] = optIndex;
        // Update visual
        const labels = optionsDiv.querySelectorAll('.mc-option');
        labels.forEach(lbl => lbl.classList.remove('mc-option--selected'));
        label.classList.add('mc-option--selected');
      });

      const optionText = Utils.createElement('span', { class: 'mc-text' });
      optionText.textContent = `${optionLabels[optIndex]}. ${option}`;

      label.appendChild(radio);
      label.appendChild(optionText);
      optionsDiv.appendChild(label);
    });

    questionDiv.appendChild(optionsDiv);

    // Explanation box (hidden initially)
    const explanationBox = Utils.createElement('div', {
      class: 'explanation-box',
      id: `explanation-${exercise.id}-${index}`
    });
    questionDiv.appendChild(explanationBox);

    return questionDiv;
  },

  renderFillBlankQuestion(question, index, exercise, callbacks) {
    const blankDiv = Utils.createElement('div', {
      class: 'listening-blank',
      dataset: { questionIndex: index }
    });

    const label = Utils.createElement('label', {
      class: 'listening-blank__label'
    }, `(${index + 1})`);

    const input = Utils.createElement('input', {
      type: 'text',
      class: 'listening-blank__input',
      placeholder: question.hint || 'Nhập câu trả lời...',
      id: `blank-${exercise.id}-${index}`
    });

    input.addEventListener('input', (e) => {
      this.currentState.answeredQuestions[index] = e.target.value.trim();
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        // Move to next blank or submit
        const nextInput = blankDiv.parentElement.querySelector(`#blank-${exercise.id}-${index + 1}`);
        if (nextInput) {
          nextInput.focus();
        }
      }
    });

    blankDiv.appendChild(label);
    blankDiv.appendChild(input);

    // Result indicator (hidden initially)
    const resultSpan = Utils.createElement('span', {
      class: 'listening-blank__result',
      id: `result-${exercise.id}-${index}`
    });
    blankDiv.appendChild(resultSpan);

    return blankDiv;
  },

  handleSubmitAll(exercise, container, callbacks) {
    const questions = exercise.questions;
    const answered = this.currentState.answeredQuestions;

    // Check if all questions are answered
    const unanswered = [];
    questions.forEach((q, idx) => {
      if (answered[idx] === undefined || answered[idx] === '') {
        unanswered.push(idx + 1);
      }
    });

    if (unanswered.length > 0) {
      Utils.showToast(`Vui lòng trả lời câu ${unanswered.join(', ')}`, 'error');
      return;
    }

    // Calculate results
    let correctCount = 0;
    const results = questions.map((q, idx) => {
      const userAnswer = answered[idx];
      let isCorrect = false;

      if (exercise.subtype === 'true-false') {
        isCorrect = userAnswer === q.answer;
      } else if (exercise.subtype === 'multiple-choice') {
        isCorrect = userAnswer === q.correctIndex;
      } else if (exercise.subtype === 'fill-blank') {
        const acceptedAnswers = q.acceptedAnswers || [q.answer];
        isCorrect = Utils.validateAnswer(userAnswer, acceptedAnswers);
      }

      if (isCorrect) correctCount++;
      return {
        questionIndex: idx,
        userAnswer,
        correctAnswer: q.answer,
        isCorrect
      };
    });

    // Show feedback for each question
    this.showAllFeedback(exercise, container, results);

    // Disable submit button
    const submitBtn = container.querySelector('#submit-all-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = `✓ Đã nộp (${correctCount}/${questions.length} đúng)`;
    }

    // Disable all inputs
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => input.disabled = true);

    // Build answer object for game engine
    const answerData = {
      answers: answered,
      correctCount: correctCount,
      totalQuestions: questions.length,
      isAllCorrect: correctCount === questions.length,
      results: results
    };

    callbacks.onAnswer(answerData);
  },

  showAllFeedback(exercise, container, results) {
    results.forEach((result, idx) => {
      const question = exercise.questions[idx];

      if (exercise.subtype === 'true-false') {
        const questionDiv = container.querySelector(`[data-question-index="${idx}"]`);
        if (!questionDiv) return;

        // Highlight correct/wrong option
        const options = questionDiv.querySelectorAll('.tf-option');
        options.forEach(opt => {
          const radio = opt.querySelector('input[type="radio"]');
          if (radio.value === question.answer) {
            opt.classList.add('tf-option--correct');
          } else if (radio.value === result.userAnswer && !result.isCorrect) {
            opt.classList.add('tf-option--wrong');
          }
        });

        // Add result icon
        const questionText = questionDiv.querySelector('.listening-question__text');
        if (questionText) {
          const icon = result.isCorrect ? '✓' : '✗';
          const iconClass = result.isCorrect ? 'result-icon--correct' : 'result-icon--wrong';
          const iconSpan = Utils.createElement('span', { class: `result-icon ${iconClass}` }, ` ${icon}`);
          questionText.appendChild(iconSpan);
        }

        // Show explanation
        const explanationBox = questionDiv.querySelector('.explanation-box');
        if (explanationBox && question.explanation) {
          explanationBox.innerHTML = `
            <p class="explanation-box__title">${result.isCorrect ? '✓ Đúng!' : '✗ Chưa đúng'}</p>
            <div class="explanation-box__content">
              ${!result.isCorrect ? `<p><strong>Đáp án đúng:</strong> ${question.answer}</p>` : ''}
              <p>${question.explanation}</p>
            </div>
          `;
          explanationBox.classList.add('show');
        }

        questionDiv.classList.add(result.isCorrect ? 'listening-question--correct' : 'listening-question--wrong');

      } else if (exercise.subtype === 'multiple-choice') {
        const questionDiv = container.querySelector(`[data-question-index="${idx}"]`);
        if (!questionDiv) return;

        const optionLabels = ['A', 'B', 'C', 'D'];

        // Highlight correct/wrong option
        const options = questionDiv.querySelectorAll('.mc-option');
        options.forEach((opt, optIdx) => {
          if (optIdx === question.correctIndex) {
            opt.classList.add('mc-option--correct');
          } else if (optIdx === result.userAnswer && !result.isCorrect) {
            opt.classList.add('mc-option--wrong');
          }
        });

        // Add result icon
        const questionText = questionDiv.querySelector('.listening-question__text');
        if (questionText) {
          const icon = result.isCorrect ? '✓' : '✗';
          const iconClass = result.isCorrect ? 'result-icon--correct' : 'result-icon--wrong';
          const iconSpan = Utils.createElement('span', { class: `result-icon ${iconClass}` }, ` ${icon}`);
          questionText.appendChild(iconSpan);
        }

        // Show explanation
        const explanationBox = questionDiv.querySelector('.explanation-box');
        if (explanationBox) {
          const correctAnswer = `${optionLabels[question.correctIndex]}. ${question.options[question.correctIndex]}`;
          explanationBox.innerHTML = `
            <p class="explanation-box__title">${result.isCorrect ? '✓ Đúng!' : '✗ Chưa đúng'}</p>
            <div class="explanation-box__content">
              ${!result.isCorrect ? `<p><strong>Đáp án đúng:</strong> ${correctAnswer}</p>` : ''}
              ${question.explanation ? `<p>${question.explanation}</p>` : ''}
            </div>
          `;
          explanationBox.classList.add('show');
        }

        questionDiv.classList.add(result.isCorrect ? 'listening-question--correct' : 'listening-question--wrong');

      } else if (exercise.subtype === 'fill-blank') {
        const blankDiv = container.querySelector(`[data-question-index="${idx}"]`);
        if (!blankDiv) return;

        const input = blankDiv.querySelector('input');
        const resultSpan = blankDiv.querySelector('.listening-blank__result');

        if (result.isCorrect) {
          input.classList.add('correct-answer');
          resultSpan.textContent = '✓';
          resultSpan.classList.add('result--correct');
        } else {
          input.classList.add('wrong-answer');
          resultSpan.textContent = `✗ (${question.answer})`;
          resultSpan.classList.add('result--wrong');
        }
      }
    });
  },

  validate(userAnswer, exercise) {
    if (!userAnswer || typeof userAnswer !== 'object') return false;
    return userAnswer.correctCount > 0 || userAnswer.isAllCorrect;
  },

  getUserAnswer(container) {
    return this.currentState.answeredQuestions;
  },

  showFeedback(container, isCorrect, exercise) {
    const exerciseCard = container.querySelector('.listening-exercise');
    if (exerciseCard) {
      exerciseCard.classList.add(isCorrect ? 'exercise--correct' : 'exercise--attempted');
    }
  },

  reset(container) {
    this.currentState = {
      answeredQuestions: {},
      totalQuestions: 0,
      exerciseId: null,
      audioPlayed: false
    };

    // Reset UI
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
      if (input.type === 'radio') {
        input.checked = false;
      } else {
        input.value = '';
      }
      input.disabled = false;
      input.classList.remove('correct-answer', 'wrong-answer');
    });

    const labels = container.querySelectorAll('.tf-option');
    labels.forEach(lbl => {
      lbl.classList.remove('tf-option--selected', 'tf-option--correct', 'tf-option--wrong');
    });

    const mcLabels = container.querySelectorAll('.mc-option');
    mcLabels.forEach(lbl => {
      lbl.classList.remove('mc-option--selected', 'mc-option--correct', 'mc-option--wrong');
    });

    const questionDivs = container.querySelectorAll('.listening-question');
    questionDivs.forEach(div => {
      div.classList.remove('listening-question--correct', 'listening-question--wrong');
    });

    const explanations = container.querySelectorAll('.explanation-box');
    explanations.forEach(exp => {
      exp.classList.remove('show');
      exp.innerHTML = '';
    });

    const resultIcons = container.querySelectorAll('.result-icon');
    resultIcons.forEach(icon => icon.remove());

    const resultSpans = container.querySelectorAll('.listening-blank__result');
    resultSpans.forEach(span => {
      span.textContent = '';
      span.classList.remove('result--correct', 'result--wrong');
    });

    const submitBtn = container.querySelector('#submit-all-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '✓ Nộp bài';
    }

    // Reset audio
    const audio = container.querySelector('audio');
    if (audio) {
      audio.currentTime = 0;
    }
  }
};

// Register with game engine
if (typeof GameEngine !== 'undefined') {
  GameEngine.registerExerciseHandler('listening', ListeningExercise);
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ListeningExercise;
}
